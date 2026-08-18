/* ============================================================
   GOAL2GOAT — Música de fondo (menús + partidos) y sonido de gol
   ------------------------------------------------------------
   Archivo aparte y autocontenido: no toca game.js más allá de un
   par de botones/slider de ajustes ya existentes, a los que se
   engancha desde aquí, y de las llamadas puntuales a
   window.G2GMusica.reproducirGol() en los puntos donde se marca un
   gol (game.js, liga-manager.js, liga-manager-partido-visor.js).

   Dos pistas en bucle, con crossfade entre ellas según haya o no un
   partido en directo abierto — nunca sonando las dos a la vez:
   - assets/audio/goal2goatMainTheme.mp3 — tema de los menús.
   - assets/audio/stadium.mp3 — ambiente de estadio durante el
     partido, sustituye a lo que antes era silencio total.
   Comparten el mismo interruptor MÚSICA y el mismo deslizador de
   volumen — conceptualmente es "la música", solo cambia qué pista
   suena según dónde esté el jugador en cada momento.

   Además, assets/audio/goal.mp3 se reproduce una vez (no en bucle)
   cada vez que se marca un gol, con su propio volumen ligado a
   EFECTOS (sfxVolume de game.js), ya que es un efecto puntual del
   partido, no música de fondo.
   ============================================================ */

(function(){

  const RUTA_TEMA='assets/audio/goal2goatMainTheme.mp3';
  const RUTA_ESTADIO='assets/audio/stadium.mp3';
  const RUTA_GOL='assets/audio/goal.mp3';
  const ENABLED_KEY='g2g_musicaEnabled';
  const VOLUME_KEY='g2g_musicVolume';

  let musicaEnabled=true;
  try{
    const saved=localStorage.getItem(ENABLED_KEY);
    if(saved!==null) musicaEnabled=(saved==='true');
  }catch(e){}

  let musicVolume=0.18;
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

  // ---------- Pista genérica en bucle (usada para tema y estadio) ----------
  function crearPistaLoop(ruta, nombreParaAvisos){
    const st={ el:null, fundidoInterval:null, intentandoArrancar:false, yaSonando:false };
    function getEl(){
      if(st.el) return st.el;
      st.el=new Audio(ruta);
      st.el.loop=true;
      st.el.preload='auto';
      st.el.volume=0; // arranca en 0 y sube con fundido, nunca de golpe
      st.el.addEventListener('error', ()=>{
        const err=st.el.error;
        console.error('[Música] No se ha podido cargar '+nombreParaAvisos+' ('+ruta+'). Código de error:', err?err.code:'?', '— revisa que el archivo exista en esa ruta exacta en el servidor.');
      });
      // Red de seguridad para el bucle infinito: loop=true ya se
      // encarga de esto en cualquier navegador moderno, pero por si
      // algún navegador antiguo o WebView no lo respeta al cien por
      // cien, este evento fuerza el reinicio manual en cuanto
      // termina — así la pista nunca se detiene del todo.
      st.el.addEventListener('ended', ()=>{
        if(musicaEnabled){ st.el.currentTime=0; st.el.play().catch(()=>{}); }
      });
      return st.el;
    }
    function fundirHacia(objetivo, duracionMs){
      if(st.fundidoInterval){ clearInterval(st.fundidoInterval); st.fundidoInterval=null; }
      const el=getEl();
      const inicio=el.volume;
      const pasos=Math.max(1, Math.round((duracionMs||800)/40));
      let paso=0;
      st.fundidoInterval=setInterval(()=>{
        paso++;
        const t=Math.min(1, paso/pasos);
        el.volume=inicio+(objetivo-inicio)*t;
        if(t>=1){ clearInterval(st.fundidoInterval); st.fundidoInterval=null; }
      }, 40);
    }
    function arrancar(){
      if(st.intentandoArrancar || st.yaSonando || !musicaEnabled) return;
      st.intentandoArrancar=true;
      const el=getEl();
      el.play().then(()=>{
        st.intentandoArrancar=false;
        st.yaSonando=true;
      }).catch((err)=>{
        // El más habitual es el bloqueo de autoplay por falta de un
        // gesto reciente del usuario — se reintentará en la próxima
        // interacción (yaSonando sigue en false, nunca se descarta
        // para siempre).
        console.warn('[Música] Reproducción de '+nombreParaAvisos+' bloqueada o fallida de momento ('+(err&&err.name?err.name:err)+') — se reintentará con la próxima interacción.');
        st.intentandoArrancar=false;
      });
    }
    function parar(){
      if(!st.el) return;
      fundirHacia(0, 400);
      setTimeout(()=>{
        if(st.el && st.el.volume<=0.01){
          st.el.pause();
          // Imprescindible: sin esto, arrancar() se creía "ya
          // sonando" para siempre después de la primera pausa (la
          // marca solo se ponía a true al arrancar, nunca se
          // reseteaba al parar) — así que apagar y volver a
          // encender la música, o simplemente que la pista se
          // pausara al entrar en un partido, la dejaba bloqueada
          // para siempre: nunca se volvía a llamar a .play().
          st.yaSonando=false;
        }
      }, 450);
    }
    return { getEl, fundirHacia, arrancar, parar, estado:st };
  }

  const tema=crearPistaLoop(RUTA_TEMA, 'el tema principal');
  const estadio=crearPistaLoop(RUTA_ESTADIO, 'la música de estadio');

  function volumenObjetivoTema(){
    if(!musicaEnabled) return 0;
    return hayPartidoEnDirecto() ? 0 : musicVolume;
  }
  function volumenObjetivoEstadio(){
    if(!musicaEnabled) return 0;
    return hayPartidoEnDirecto() ? musicVolume : 0;
  }

  // Comprueba cada segundo si hay un partido en directo abierto o
  // cerrado, y hace el crossfade entre tema/estadio en consecuencia
  // — no hace falta que sea instantáneo, es solo ambientación de
  // fondo. Arranca la pista de estadio la primera vez que hace
  // falta (por si el jugador nunca llegó a interactuar antes de
  // entrar a un partido).
  setInterval(()=>{
    if(tema.estado.el) tema.fundirHacia(volumenObjetivoTema(), 900);
    if(hayPartidoEnDirecto() && musicaEnabled) estadio.arrancar();
    if(estadio.estado.el) estadio.fundirHacia(volumenObjetivoEstadio(), 900);
  }, 1000);

  function arrancarMusica(){
    tema.arrancar();
    if(hayPartidoEnDirecto()) estadio.arrancar();
    // El fundido al volumen real se dispara aparte (no dentro del
    // .then() de arrancar()) porque arrancar() puede no hacer nada
    // si ya estaba sonando — así el volumen se corrige siempre,
    // haya hecho falta arrancar o no.
    tema.fundirHacia(volumenObjetivoTema(), 900);
    estadio.fundirHacia(volumenObjetivoEstadio(), 900);
  }

  function pararMusica(){
    tema.parar();
    estadio.parar();
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
    if(!musicaEnabled) return;
    if(tema.estado.el && !hayPartidoEnDirecto()) tema.estado.el.volume=musicVolume;
    if(estadio.estado.el && hayPartidoEnDirecto()) estadio.estado.el.volume=musicVolume;
  }

  // ---------- Sonido de gol (efecto puntual, no en bucle) ----------
  // Instancia nueva cada vez en vez de reutilizar una sola — así, si
  // hubiera dos goles muy seguidos (Giro Táctico, prórroga...), el
  // segundo no corta al primero a mitad. Volumen ligado a EFECTOS
  // (sfxVolume/audioEnabled de game.js), porque es un efecto del
  // partido, no música de fondo — nunca depende del volumen de
  // MÚSICA ni de su interruptor.
  function reproducirGol(){
    try{
      const vol = (typeof window.audioEnabled==='undefined' || window.audioEnabled)
        ? (typeof window.sfxVolume==='number' ? window.sfxVolume : 1)
        : 0;
      if(vol<=0) return;
      const el=new Audio(RUTA_GOL);
      // Un poco más alto que el resto de efectos a propósito, para que
      // el momento del gol se note más — con tope en 1 (el máximo que
      // admite el propio elemento de audio).
      el.volume=Math.max(0, Math.min(1, vol*1.15));
      el.play().catch(()=>{});
    }catch(e){}
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
  // {once:true}: si el primer intento fallara por lo que fuera, se
  // sigue reintentando en cada interacción hasta que realmente suene
  // (arrancar() ya no hace nada una vez yaSonando es true, así que
  // dejar los listeners puestos no tiene coste real).
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

  window.G2GMusica={
    setEnabled:setMusicaEnabled, isEnabled:()=>musicaEnabled,
    setVolume:setMusicVolume, getVolume:()=>musicVolume,
    reproducirGol,
  };

})();
