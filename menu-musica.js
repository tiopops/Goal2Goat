/* ============================================================
   GOAL2GOAT — Música de fondo para los menús
   ------------------------------------------------------------
   Archivo aparte y autocontenido (mismo patrón que
   liga-manager-dice3d.js / liga-manager-giro-tactico.js): no toca
   game.js más allá de un par de botones de ajustes ya existentes,
   a los que se engancha desde aquí.

   Tema compuesto directamente con osciladores de Web Audio API —
   sin ningún archivo de audio ni librería externa, igual que el
   resto del sistema de sonido del juego (game.js ya sintetiza
   todos sus efectos así, nunca con ficheros .mp3/.wav). Un acorde
   sencillo y cálido en La menor (Am–F–C–G), con una melodía corta
   y pegadiza tipo arpegio encima — pensado para sonar de fondo en
   los menús sin cansar ni distraer, en la línea de los temas
   sencillos de los viejos manager de fútbol (PC Fútbol y similares).

   Se pausa solo (con un fundido suave) en cuanto se abre un
   partido en directo — Copa Leyendas (#matchOverlay), Liga Manager
   modo automático (#lmMatchOverlay) o modo manager
   (#lmVisorPartidoOverlay) — y se reanuda al cerrarse, para no
   competir con los efectos de sonido del propio partido.
   ============================================================ */

(function(){

  const STORAGE_KEY='g2g_musicaEnabled';
  let musicaEnabled=true;
  try{
    const saved=localStorage.getItem(STORAGE_KEY);
    if(saved!==null) musicaEnabled=(saved==='true');
  }catch(e){}

  let ctx=null;
  let masterGain=null;
  let arrancada=false;
  let loopTimeoutId=null;
  const DUR_ACORDE=2.0; // segundos por acorde
  const IDS_PARTIDO_EN_DIRECTO=['matchOverlay','lmMatchOverlay','lmVisorPartidoOverlay'];

  // Notas (Hz, temperamento igual, A4=440Hz) — solo las que hacen falta.
  const N={
    C2:65.41, F2:87.31, G2:98.00, A2:110.00,
    C3:130.81, E3:164.81, F3:174.61, G3:196.00, A3:220.00, B3:246.94,
    C4:261.63, D4:293.66, E4:329.63, F4:349.23, G4:392.00, A4:440.00, B4:493.88,
    C5:523.25, D5:587.33, E5:659.25, F5:698.46,
  };

  // Progresión de 4 acordes (vi–IV–I–V en Do mayor / La menor) — muy
  // familiar y cálida, la misma base que usan cientos de temas
  // sencillos y pegadizos. Cada uno lleva su nota de bajo, el propio
  // acorde como colchón sostenido, y un arpegio de 4 notas de melodía
  // (patrón raíz–3ª–5ª–3ª, siempre el mismo dibujo, solo cambia de
  // acorde — es justo lo que lo hace fácil de recordar).
  const ACORDES=[
    { bajo:N.A2, pad:[N.A3,N.C4,N.E4], melodia:[N.A4,N.C5,N.E5,N.C5] },
    { bajo:N.F2, pad:[N.F3,N.A3,N.C4], melodia:[N.F4,N.A4,N.C5,N.A4] },
    { bajo:N.C2, pad:[N.C3,N.E3,N.G3], melodia:[N.C4,N.E4,N.G4,N.E4] },
    { bajo:N.G2, pad:[N.G3,N.B3,N.D4], melodia:[N.G4,N.B4,N.D5,N.B4] },
  ];

  function getCtx(){
    if(ctx) return ctx;
    try{ ctx=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ ctx=null; }
    if(ctx){
      masterGain=ctx.createGain();
      masterGain.gain.value=musicaEnabled?0.5:0;
      masterGain.connect(ctx.destination);
    }
    return ctx;
  }

  // Una sola nota con envolvente suave (ataque breve, caída lenta) —
  // igual de sencillo que el helper tone() de game.js, pero con su
  // propio volumen aparte para no depender del audio de efectos.
  function nota(freq, inicio, dur, tipo, picoVol){
    if(!ctx || !masterGain) return;
    const osc=ctx.createOscillator();
    const gain=ctx.createGain();
    osc.type=tipo;
    osc.frequency.setValueAtTime(freq, ctx.currentTime+inicio);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime+inicio);
    gain.gain.exponentialRampToValueAtTime(picoVol, ctx.currentTime+inicio+0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime+inicio+dur);
    osc.connect(gain); gain.connect(masterGain);
    osc.start(ctx.currentTime+inicio);
    osc.stop(ctx.currentTime+inicio+dur+0.05);
  }

  // Programa UN acorde completo (bajo + colchón + arpegio de melodía)
  // a partir del instante "inicio" (en segundos, relativo a ahora).
  function programarAcorde(acorde, inicio){
    // Bajo: una sola nota larga y suave, todo el acorde.
    nota(acorde.bajo, inicio, DUR_ACORDE*0.95, 'sine', 0.16);
    // Colchón: las 3 notas del acorde sostenidas, muy suaves — dan
    // cuerpo sin llamar la atención.
    acorde.pad.forEach(f=>nota(f, inicio, DUR_ACORDE*0.9, 'triangle', 0.045));
    // Melodía: 4 notas cortas tipo arpegio, un pelín más presentes —
    // son las que hacen que el tema se reconozca y se pueda tararear.
    const porNota=DUR_ACORDE/4;
    acorde.melodia.forEach((f,i)=>nota(f, inicio+i*porNota, porNota*0.85, 'triangle', 0.09));
  }

  // Bucle con "look-ahead": programa un acorde entero de golpe con
  // tiempos exactos del propio AudioContext (nunca de setTimeout,
  // que puede desviarse), y solo usa setTimeout para decidir CUÁNDO
  // programar el siguiente — así el bucle no tiene ningún hueco ni
  // solape perceptible por mucho que dure sonando.
  let indiceAcorde=0;
  function cicloMusical(){
    if(!musicaEnabled || !ctx){ arrancada=false; return; }
    const enPartido=IDS_PARTIDO_EN_DIRECTO.some(id=>document.getElementById(id));
    // Fundido suave hacia silencio durante un partido en directo, y de
    // vuelta al volumen normal en cuanto se cierra — nunca un corte
    // brusco.
    if(masterGain){
      const objetivo = enPartido ? 0.0001 : 0.5;
      masterGain.gain.cancelScheduledValues(ctx.currentTime);
      masterGain.gain.setValueAtTime(Math.max(0.0001, masterGain.gain.value), ctx.currentTime);
      masterGain.gain.exponentialRampToValueAtTime(objetivo, ctx.currentTime+1.2);
    }
    programarAcorde(ACORDES[indiceAcorde % ACORDES.length], 0);
    indiceAcorde++;
    loopTimeoutId=setTimeout(cicloMusical, DUR_ACORDE*1000);
  }

  function arrancarMusica(){
    if(arrancada || !musicaEnabled) return;
    const c=getCtx();
    if(!c) return;
    if(c.state==='suspended') c.resume();
    arrancada=true;
    cicloMusical();
  }

  function pararMusica(){
    arrancada=false;
    if(loopTimeoutId){ clearTimeout(loopTimeoutId); loopTimeoutId=null; }
    if(masterGain && ctx){
      masterGain.gain.cancelScheduledValues(ctx.currentTime);
      masterGain.gain.setValueAtTime(masterGain.gain.value, ctx.currentTime);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime+0.4);
    }
  }

  function setMusicaEnabled(valor){
    musicaEnabled=!!valor;
    try{ localStorage.setItem(STORAGE_KEY, musicaEnabled); }catch(e){}
    if(musicaEnabled) arrancarMusica();
    else pararMusica();
    sincronizarBotones();
  }

  // Mismo patrón visual que los botones de SONIDO/TEMA ya existentes
  // (topbar-dot que se enciende/apaga) — se busca el botón tanto en
  // el desplegable de cabecera como en el modal de perfil, los dos
  // sitios donde ya vive el ajuste de sonido.
  function sincronizarBotones(){
    ['musicToggleHeader','musicToggle'].forEach(id=>{
      const btn=document.getElementById(id);
      if(!btn) return;
      const dot=btn.querySelector('.topbar-dot');
      if(dot) dot.classList.toggle('on', musicaEnabled);
      btn.classList.toggle('off', !musicaEnabled);
    });
  }

  function conectarBotones(){
    ['musicToggleHeader','musicToggle'].forEach(id=>{
      const btn=document.getElementById(id);
      if(!btn || btn.dataset.g2gMusicWired) return;
      btn.dataset.g2gMusicWired='1';
      btn.addEventListener('click', ()=>{
        setMusicaEnabled(!musicaEnabled);
        if(typeof window.playSound==='function' && musicaEnabled) window.playSound('select');
      });
    });
    sincronizarBotones();
  }

  // El primer arranque de audio en cualquier navegador necesita un
  // gesto real del usuario (clic, toque, tecla) — igual que ya le
  // pasa al resto del sistema de sonido del juego. Se engancha una
  // sola vez al primer gesto, en cualquier parte de la página.
  function primerGesto(){
    document.removeEventListener('click', primerGesto);
    document.removeEventListener('keydown', primerGesto);
    document.removeEventListener('touchstart', primerGesto);
    if(musicaEnabled) arrancarMusica();
  }
  document.addEventListener('click', primerGesto, {once:true});
  document.addEventListener('keydown', primerGesto, {once:true});
  document.addEventListener('touchstart', primerGesto, {once:true});

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', conectarBotones);
  } else {
    conectarBotones();
  }
  // Los botones de ajustes se reconstruyen en algunos renders (por
  // ejemplo al iniciar sesión) — se reintenta conectar periódicamente
  // sin coste real, ya que conectarBotones() no hace nada si ya
  // estaban conectados (dataset.g2gMusicWired).
  setInterval(conectarBotones, 2000);

  window.G2GMusica={ setEnabled:setMusicaEnabled, isEnabled:()=>musicaEnabled };

})();
