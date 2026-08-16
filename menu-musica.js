/* ============================================================
   GOAL2GOAT — Música de fondo para los menús
   ------------------------------------------------------------
   Archivo aparte y autocontenido: no toca game.js más allá de un
   par de botones/slider de ajustes ya existentes, a los que se
   engancha desde aquí.

   Reproduce el tema principal real (assets/audio/goal2goatMainTheme.mp3)
   en bucle mientras se navega por los menús — un elemento <audio>
   normal con loop=true, no una composición sintetizada. Se pausa
   sola (con un fundido suave) en cuanto se abre un partido en
   directo — Copa Leyendas (#matchOverlay), Liga Manager modo
   automático (#lmMatchOverlay) o modo manager
   (#lmVisorPartidoOverlay) — y se reanuda al cerrarse, para no
   competir con los efectos de sonido del propio partido.

   Volumen totalmente independiente del de los EFECTOS de sonido
   (ese vive en game.js, sfxVolume/sfxMasterGain) — aquí solo se
   controla el volumen de esta música, con su propio interruptor y
   su propio deslizador.
   ============================================================ */

(function(){

  const RUTA_AUDIO='assets/audio/goal2goatMainTheme.mp3';
  const ENABLED_KEY='g2g_musicaEnabled';
  const VOLUME_KEY='g2g_musicVolume';

  let musicaEnabled=true;
  try{
    const saved=localStorage.getItem(ENABLED_KEY);
    if(saved!==null) musicaEnabled=(saved==='true');
  }catch(e){}

  let musicVolume=0.28;
  try{
    const savedVol=localStorage.getItem(VOLUME_KEY);
    if(savedVol!==null) musicVolume=Math.max(0, Math.min(1, parseFloat(savedVol)));
  }catch(e){}

  const IDS_PARTIDO_EN_DIRECTO=['lmMatchOverlay','lmVisorPartidoOverlay'];
  // #matchOverlay (Copa Leyendas) es distinto a los otros dos: es un
  // <div> ESTÁTICO que existe siempre en el HTML, nunca se crea ni
  // se destruye — se rellena/vacía su innerHTML para mostrar u
  // ocultar el partido. Comprobar solo su existencia (como con los
  // otros IDs) lo daba SIEMPRE como "hay partido en directo" desde
  // el arranque de la página, silenciando la música para siempre.
  // Aquí se comprueba si tiene contenido de verdad.
  function hayPartidoEnDirecto(){
    if(IDS_PARTIDO_EN_DIRECTO.some(id=>document.getElementById(id))) return true;
    const cl=document.getElementById('matchOverlay');
    return !!(cl && cl.innerHTML && cl.innerHTML.trim()!=='');
  }

  let audioEl=null;
  let fundidoInterval=null;
  let intentandoArrancar=false;
  let yaSonando=false; // true en cuanto play() resuelve con éxito una vez

  function getAudioEl(){
    if(audioEl) return audioEl;
    audioEl=new Audio(RUTA_AUDIO);
    audioEl.loop=true;
    audioEl.preload='auto';
    audioEl.volume=0; // arranca en 0 y sube con fundido, nunca de golpe
    // Diagnóstico: si el archivo no carga (ruta incorrecta en el
    // servidor, 404, tipo MIME no servido, etc.) se avisa alto y
    // claro en la consola — antes un fallo aquí quedaba
    // completamente silencioso, sin ninguna pista de qué había
    // pasado.
    audioEl.addEventListener('error', ()=>{
      const err=audioEl.error;
      console.error('[Música] No se ha podido cargar el archivo de audio ('+RUTA_AUDIO+'). Código de error:', err?err.code:'?', '— revisa que el archivo exista en esa ruta exacta en el servidor.');
    });
    // Red de seguridad para el bucle infinito: loop=true ya se
    // encarga de esto en cualquier navegador moderno, pero por si
    // algún navegador antiguo o WebView no lo respeta al cien por
    // cien, este evento fuerza el reinicio manual en cuanto termina
    // — así el tema nunca se detiene del todo, pase lo que pase.
    audioEl.addEventListener('ended', ()=>{
      if(musicaEnabled){ audioEl.currentTime=0; audioEl.play().catch(()=>{}); }
    });
    return audioEl;
  }

  // Sube o baja el volumen real del elemento <audio> poco a poco
  // hasta el objetivo — nunca un salto brusco, ni al empezar a sonar
  // ni al pausarse por un partido en directo.
  function fundirHacia(objetivo, duracionMs){
    if(fundidoInterval){ clearInterval(fundidoInterval); fundidoInterval=null; }
    const el=getAudioEl();
    const inicio=el.volume;
    const pasos=Math.max(1, Math.round((duracionMs||800)/40));
    let paso=0;
    fundidoInterval=setInterval(()=>{
      paso++;
      const t=Math.min(1, paso/pasos);
      el.volume=inicio+(objetivo-inicio)*t;
      if(t>=1){ clearInterval(fundidoInterval); fundidoInterval=null; }
    }, 40);
  }

  function volumenObjetivoActual(){
    if(!musicaEnabled) return 0;
    return hayPartidoEnDirecto() ? 0 : musicVolume;
  }

  // Comprueba cada segundo si hay un partido en directo abierto o
  // cerrado, y ajusta el volumen (fundido) en consecuencia — no hace
  // falta que sea instantáneo, es solo ambientación de fondo.
  setInterval(()=>{
    if(!audioEl) return;
    fundirHacia(volumenObjetivoActual(), 900);
  }, 1000);

  function arrancarMusica(){
    if(intentandoArrancar || yaSonando || !musicaEnabled) return;
    intentandoArrancar=true;
    const el=getAudioEl();
    el.play().then(()=>{
      intentandoArrancar=false;
      yaSonando=true;
      fundirHacia(volumenObjetivoActual(), 900);
    }).catch((err)=>{
      // El intento más habitual de fallo es que el navegador bloquee
      // la reproducción automática por falta de un gesto reciente del
      // usuario — se reintentará en el siguiente clic/tecla/toque
      // (yaSonando sigue en false, así que no queda descartado para
      // siempre como pasaba antes). Se deja constancia en consola
      // para poder diferenciar ese caso normal de un fallo real
      // (archivo no encontrado, formato no soportado, etc.).
      console.warn('[Música] Reproducción bloqueada o fallida de momento ('+(err&&err.name?err.name:err)+') — se reintentará con la próxima interacción.');
      intentandoArrancar=false;
    });
  }

  function pararMusica(){
    if(!audioEl) return;
    fundirHacia(0, 400);
    setTimeout(()=>{ if(audioEl && audioEl.volume<=0.01) audioEl.pause(); }, 450);
  }

  function setMusicaEnabled(valor){
    musicaEnabled=!!valor;
    try{ localStorage.setItem(ENABLED_KEY, musicaEnabled); }catch(e){}
    if(musicaEnabled) arrancarMusica();
    else pararMusica();
    sincronizarBotones();
  }

  function setMusicVolume(v){
    musicVolume=Math.max(0, Math.min(1, v));
    try{ localStorage.setItem(VOLUME_KEY, musicVolume); }catch(e){}
    if(audioEl && musicaEnabled && !hayPartidoEnDirecto()){
      audioEl.volume=musicVolume;
    }
  }

  function sincronizarBotones(){
    ['musicToggleHeader','musicToggle'].forEach(id=>{
      const btn=document.getElementById(id);
      if(!btn) return;
      const dot=btn.querySelector('.topbar-dot');
      if(dot) dot.classList.toggle('on', musicaEnabled);
    });
  }

  function conectarControles(){
    ['musicToggleHeader','musicToggle'].forEach(id=>{
      const btn=document.getElementById(id);
      if(!btn || btn.dataset.g2gMusicWired) return;
      btn.dataset.g2gMusicWired='1';
      btn.addEventListener('click', ()=>{
        setMusicaEnabled(!musicaEnabled);
        if(typeof window.playSound==='function' && musicaEnabled) window.playSound('select');
      });
    });
    const slider=document.getElementById('musicVolumeSlider');
    if(slider && !slider.dataset.g2gMusicWired){
      slider.dataset.g2gMusicWired='1';
      slider.value=Math.round(musicVolume*100);
      slider.addEventListener('input', ()=>{ setMusicVolume(slider.value/100); });
    }
    sincronizarBotones();
  }

  // El primer arranque de audio en cualquier navegador necesita un
  // gesto real del usuario (clic, toque, tecla) — igual que el resto
  // del sistema de sonido del juego. A propósito NO se usa
  // {once:true}: antes, si el primer intento fallaba por lo que
  // fuera (no solo por el bloqueo típico de autoplay, cualquier
  // fallo transitorio), los listeners ya se habían quitado y la
  // música no se volvía a intentar nunca más en toda la sesión, por
  // muchos clics que se hicieran después. Ahora se sigue
  // reintentando en cada interacción hasta que realmente suene
  // (arrancarMusica() ya no hace nada una vez yaSonando es true, así
  // que dejar los listeners puestos no tiene coste real).
  function intentoDeGesto(){
    if(musicaEnabled) arrancarMusica();
  }
  document.addEventListener('click', intentoDeGesto);
  document.addEventListener('keydown', intentoDeGesto);
  document.addEventListener('touchstart', intentoDeGesto);

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', conectarControles);
  } else {
    conectarControles();
  }
  // Los controles de ajustes se reconstruyen en algunos renders (por
  // ejemplo al iniciar sesión) — se reintenta conectar
  // periódicamente sin coste real (conectarControles() no hace nada
  // si ya estaban conectados, vía dataset.g2gMusicWired).
  setInterval(conectarControles, 2000);

  window.G2GMusica={ setEnabled:setMusicaEnabled, isEnabled:()=>musicaEnabled, setVolume:setMusicVolume, getVolume:()=>musicVolume };

})();
