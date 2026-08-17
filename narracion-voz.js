/* ============================================================
   GOAL2GOAT — Narración por voz del partido (modo manager)
   ------------------------------------------------------------
   Usa la Web Speech API del propio navegador (gratuita, sin
   servidor ni claves de API) para narrar en voz alta lo que va
   apareciendo en la barra de información del partido.

   Se observa la barra con un MutationObserver — cualquier cambio de
   texto dispara la narración automáticamente, sin enganchar cada
   uno de los ~36 puntos del código que la actualizan.

   Cola con un hueco por prioridad: los mensajes normales se
   sustituyen por el más reciente si el partido va más rápido de lo
   que se tarda en decir la frase; los prioritarios (gol, comienzo,
   descanso, segunda parte, final) nunca se pierden e interrumpen lo
   que se estuviera narrando.

   El icono del altavoz cicla, con cada clic, por 4 niveles:
   apagado → bajo → medio → alto → apagado... con su propio icono
   Phosphor y volumen real de la voz en cada uno.
   ============================================================ */

(function(){

  const ENABLED_KEY='g2g_narracionEnabled';
  const NIVEL_KEY='g2g_narracionNivel';
  // Niveles: 0=apagado, 1=bajo, 2=medio, 3=alto. Se guarda el nivel
  // por separado de si está activo, para recordar en qué volumen se
  // dejó la última vez aunque se apague y se vuelva a encender.
  const NIVELES=[
    { volumen:0, icon:'ph-speaker-slash' },       // 0: apagado
    { volumen:0.4, icon:'ph-speaker-none' },      // 1: bajo
    { volumen:0.7, icon:'ph-speaker-simple-low' },// 2: medio
    { volumen:1.0, icon:'ph-speaker-simple-high' },// 3: alto
  ];
  let nivelActual=1; // si se activa por primera vez, arranca en "bajo"
  try{
    const savedNivel=localStorage.getItem(NIVEL_KEY);
    if(savedNivel!==null) nivelActual=Math.max(1, Math.min(3, parseInt(savedNivel,10)||1));
  }catch(e){}

  let narracionEnabled=false; // apagada por defecto — es una función nueva y llamativa, mejor que el jugador la active si la quiere
  try{
    const saved=localStorage.getItem(ENABLED_KEY);
    if(saved!==null) narracionEnabled=(saved==='true');
  }catch(e){}

  const soportada = typeof window.speechSynthesis!=='undefined' && typeof window.SpeechSynthesisUtterance!=='undefined';

  let vozSeleccionada=null;
  function elegirVoz(){
    if(!soportada) return null;
    const voces=window.speechSynthesis.getVoices();
    return voces.find(v=>v.lang && v.lang.toLowerCase().startsWith('es')) || voces[0] || null;
  }
  if(soportada){
    vozSeleccionada=elegirVoz();
    window.speechSynthesis.onvoiceschanged=()=>{ vozSeleccionada=elegirVoz(); };
  }

  // Palabras clave para reconocer los momentos que SIEMPRE hay que
  // narrar, nunca descartar ni interrumpir a mitad. También sirven
  // para dar una entonación más viva (gol sobre todo) — un
  // comentarista de verdad no dice un gol con el mismo tono que
  // "fulano hace circular el balón".
  const PALABRAS_PRIORIDAD=['gol','descanso','primera parte','segunda parte','final','comienza','pitido inicial','simulando partido'];
  function esPrioritario(texto){
    const t=texto.toLowerCase();
    return PALABRAS_PRIORIDAD.some(p=>t.includes(p));
  }
  function esGol(texto){
    return texto.toLowerCase().includes('gol');
  }

  // Siglas de forma jurídica de club que un comentarista real jamás
  // pronuncia ("Valencia CF", nunca "Valencia Ce Efe") — se quitan
  // antes de narrar. Se comprueban como palabra suelta (con límites
  // de palabra) para no tocar nada que solo las contenga por
  // casualidad dentro de otra palabra.
  const SIGLAS_CLUB=['CF','SD','CD','UD','RC','RCD','CA'];
  function quitarSiglasClub(texto){
    let out=texto;
    SIGLAS_CLUB.forEach(sigla=>{
      out=out.replace(new RegExp('\\b'+sigla+'\\b','g'), '');
    });
    return out.replace(/\s+/g,' ').trim();
  }

  // Si el nombre de un equipo (o cualquier otra palabra) está en
  // mayúsculas — "POPSTEAM" — muchas voces del navegador lo
  // deletrean en vez de leerlo como palabra ("Pe, O, Pe..."). Se
  // pasa a formato Título (solo la primera letra en mayúscula) para
  // que se lea de corrido. "GOL" y demás exclamaciones cortas no se
  // ven afectadas en la pronunciación, solo cambia cómo se escribe
  // internamente antes de pasarlo a la voz.
  function corregirMayusculas(texto){
    return texto.replace(/\b[A-ZÁÉÍÓÚÑ]{3,}\b/g, palabra => palabra.charAt(0)+palabra.slice(1).toLowerCase());
  }

  function limpiarTexto(texto){
    let out=texto.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}]/gu,''); // fuera emojis sueltos
    out=quitarSiglasClub(out);
    out=corregirMayusculas(out);
    return out.replace(/\s+/g,' ').trim();
  }

  let colaNormal=null;
  let colaPrioridad=[];
  let hablando=false;
  let ultimoTextoDicho=null; // para no repetir la misma frase dos veces seguidas

  function hablar(texto){
    if(!soportada) return;
    const limpio=limpiarTexto(texto);
    if(!limpio || limpio===ultimoTextoDicho){ continuar(); return; }
    ultimoTextoDicho=limpio;
    const u=new SpeechSynthesisUtterance(limpio);
    if(vozSeleccionada) u.voice=vozSeleccionada;
    u.lang='es-ES';
    u.volume=NIVELES[nivelActual].volumen;
    // Entonación más viva para un comentarista deportivo: tono y
    // velocidad algo más altos de lo normal en cualquier mensaje
    // (nunca plano/robótico), y un extra de emoción en los goles —
    // como un comentarista real que sube el tono al grito de gol.
    if(esGol(texto)){
      u.pitch=1.35;
      u.rate=1.28;
    } else if(esPrioritario(texto)){
      u.pitch=1.15;
      u.rate=1.18;
    } else {
      u.pitch=1.08;
      u.rate=1.12;
    }
    u.onend=continuar;
    u.onerror=continuar;
    hablando=true;
    window.speechSynthesis.speak(u);
  }
  function continuar(){
    hablando=false;
    if(colaPrioridad.length){ hablar(colaPrioridad.shift()); return; }
    if(colaNormal){ const t=colaNormal; colaNormal=null; hablar(t); }
  }
  function narrar(texto){
    if(!narracionEnabled || !soportada || !texto || !texto.trim()) return;
    if(esPrioritario(texto)){
      if(hablando){ window.speechSynthesis.cancel(); hablando=false; }
      colaPrioridad.push(texto);
      if(!hablando) continuar();
    } else if(hablando){
      colaNormal=texto; // sustituye cualquier normal pendiente, nunca se acumulan
    } else {
      hablar(texto);
    }
  }

  // Observa la barra de información del visor manager — cualquier
  // cambio de texto (venga de cualquiera de los puntos del código
  // que la actualizan) dispara la narración sola.
  let observando=null;
  function observarBarra(){
    const barra=document.getElementById('lmVisorInfoBar');
    if(!barra || barra===observando) return;
    observando=barra;
    const obs=new MutationObserver(()=>{ narrar(barra.textContent); });
    obs.observe(barra, {childList:true, characterData:true, subtree:true});
  }

  function pararTodo(){
    if(soportada) window.speechSynthesis.cancel();
    colaPrioridad=[]; colaNormal=null; hablando=false; ultimoTextoDicho=null;
  }

  function aplicarNivel(nivel){
    nivelActual=nivel;
    narracionEnabled=(nivel>0);
    try{
      localStorage.setItem(ENABLED_KEY, narracionEnabled);
      if(nivel>0) localStorage.setItem(NIVEL_KEY, nivel);
    }catch(e){}
    if(!narracionEnabled) pararTodo();
    sincronizarBoton();
  }

  // API pública compatible con lo anterior (setEnabled/isEnabled),
  // más el nuevo ciclo de niveles.
  function setEnabled(v){ aplicarNivel(v ? Math.max(1,nivelActual) : 0); }
  function siguienteNivel(){
    // Ciclo: apagado(0) -> bajo(1) -> medio(2) -> alto(3) -> apagado...
    const actual = narracionEnabled ? nivelActual : 0;
    aplicarNivel((actual+1)%NIVELES.length);
  }

  function sincronizarBoton(){
    const btn=document.getElementById('lmNarracionToggleBtn');
    if(!btn) return;
    const nivelMostrado = narracionEnabled ? nivelActual : 0;
    btn.classList.toggle('lm-narracion-on', narracionEnabled);
    const icon=btn.querySelector('i');
    if(icon) icon.className = 'ph ph-bold '+NIVELES[nivelMostrado].icon;
  }

  function conectarBoton(){
    const btn=document.getElementById('lmNarracionToggleBtn');
    if(!btn || btn.dataset.g2gWired) return;
    btn.dataset.g2gWired='1';
    btn.addEventListener('click', ()=>{
      siguienteNivel();
      if(typeof window.playSound==='function' && narracionEnabled) window.playSound('select');
    });
    sincronizarBoton();
  }

  // Tanto el botón como la barra observada se recrean cada vez que
  // se abre un partido nuevo — se reintenta conectar/observar
  // periódicamente sin coste real (ambas funciones no hacen nada si
  // ya estaban conectadas).
  setInterval(()=>{ conectarBoton(); observarBarra(); }, 500);

  window.G2GNarracion={ setEnabled, isEnabled:()=>narracionEnabled, siguienteNivel, getNivel:()=>(narracionEnabled?nivelActual:0), soportada };

})();
