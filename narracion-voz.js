/* ============================================================
   GOAL2GOAT — Narración por voz del partido (modo manager)
   ------------------------------------------------------------
   Usa la Web Speech API del propio navegador (gratuita, sin
   servidor ni claves de API) para narrar en voz alta lo que va
   apareciendo en la barra de información del partido.

   El navegador ofrece las voces que tenga instaladas el sistema
   operativo — varían mucho de un dispositivo a otro, así que aquí
   se intenta ELEGIR AUTOMÁTICAMENTE una voz masculina y de timbre
   maduro por nombre (heurística, no hay forma de pedirle "grave"
   a la API directamente), y además se deja un SELECTOR manual en
   Ajustes de Audio para que cada jugador pruebe las que tenga
   disponibles y se quede con la que mejor le suene.

   Se observa la barra de información con un MutationObserver —
   cualquier cambio de texto dispara la narración automáticamente,
   sin enganchar cada uno de los ~36 puntos del código que la
   actualizan.

   Cola con un hueco por prioridad: los mensajes normales se
   sustituyen por el más reciente si el partido va más rápido de lo
   que se tarda en decir la frase; los prioritarios (gol, comienzo,
   descanso, segunda parte, final) nunca se pierden e interrumpen lo
   que se estuviera narrando.

   El icono del altavoz cicla, con cada clic, por 4 niveles:
   apagado → bajo → medio → alto → apagado...
   ============================================================ */

(function(){

  const ENABLED_KEY='g2g_narracionEnabled';
  const NIVEL_KEY='g2g_narracionNivel';
  const VOZ_KEY='g2g_narracionVozURI';

  const NIVELES=[
    { volumen:0, icon:'ph-speaker-slash' },        // 0: apagado
    { volumen:0.4, icon:'ph-speaker-none' },       // 1: bajo
    { volumen:0.7, icon:'ph-speaker-simple-low' }, // 2: medio
    { volumen:1.0, icon:'ph-speaker-simple-high' },// 3: alto
  ];
  let nivelActual=1;
  try{
    const savedNivel=localStorage.getItem(NIVEL_KEY);
    if(savedNivel!==null) nivelActual=Math.max(1, Math.min(3, parseInt(savedNivel,10)||1));
  }catch(e){}

  let narracionEnabled=false; // apagada por defecto
  try{
    const saved=localStorage.getItem(ENABLED_KEY);
    if(saved!==null) narracionEnabled=(saved==='true');
  }catch(e){}

  let vozManualURI=null;
  try{ vozManualURI=localStorage.getItem(VOZ_KEY); }catch(e){}

  const soportada = typeof window.speechSynthesis!=='undefined' && typeof window.SpeechSynthesisUtterance!=='undefined';

  // Heurística de "voz masculina madura": la Web Speech API no
  // permite pedir un timbre concreto, así que se puntúan las voces
  // disponibles por su NOMBRE (los motores de voz de los sistemas
  // operativos suelen incluir nombres propios reconocibles) y se
  // elige la de mayor puntuación. Si el jugador elige una a mano en
  // Ajustes de Audio, esa siempre gana sobre la automática.
  const NOMBRES_MASCULINOS=['jorge','diego','pablo','juan','carlos','miguel','enrique','raul','raúl','alonso','fernando','alvaro','álvaro','ricardo','male','hombre'];
  const NOMBRES_FEMENINOS=['monica','mónica','paulina','esperanza','marisol','sabina','helena','conchita','lucia','lucía','camila','female','mujer','laura','elvira'];
  function puntuarVoz(v){
    const n=(v.name||'').toLowerCase();
    let score=0;
    if(NOMBRES_MASCULINOS.some(nm=>n.includes(nm))) score+=10;
    if(NOMBRES_FEMENINOS.some(nm=>n.includes(nm))) score-=10;
    if(v.lang && v.lang.toLowerCase().startsWith('es')) score+=5;
    if(v.localService) score+=1;
    return score;
  }

  let vozSeleccionada=null;
  let vocesDisponibles=[];
  function elegirVoz(){
    if(!soportada) return null;
    vocesDisponibles=window.speechSynthesis.getVoices();
    if(!vocesDisponibles.length) return null;
    if(vozManualURI){
      const elegidaAMano=vocesDisponibles.find(v=>v.voiceURI===vozManualURI);
      if(elegidaAMano) return elegidaAMano;
    }
    const candidatas=vocesDisponibles.filter(v=>v.lang && v.lang.toLowerCase().startsWith('es'));
    const pool=candidatas.length?candidatas:vocesDisponibles;
    return pool.slice().sort((a,b)=>puntuarVoz(b)-puntuarVoz(a))[0] || pool[0];
  }
  if(soportada){
    vozSeleccionada=elegirVoz();
    window.speechSynthesis.onvoiceschanged=()=>{ vozSeleccionada=elegirVoz(); poblarSelectorVoces(); };
  }

  // ---------- Categorías emocionales ----------
  // Un comentarista real no habla siempre igual: un gol se grita, una
  // tarjeta se dice serio, una ocasión clara sube la tensión, una
  // lesión se dice con preocupación. El tono base también es más
  // grave que una lectura neutra, para sonar más maduro.
  const PALABRAS_PRIORIDAD=['gol','descanso','primera parte','segunda parte','final','comienza','pitido inicial','simulando partido'];
  function esPrioritario(texto){
    const t=texto.toLowerCase();
    return PALABRAS_PRIORIDAD.some(p=>t.includes(p));
  }
  function categoriaDe(texto){
    const t=texto.toLowerCase();
    if(t.includes('gol')) return 'gol';
    if(t.includes('tarjeta')) return 'tarjeta';
    if(t.includes('duele en el suelo') || t.includes('lesion') || t.includes('lesión')) return 'lesion';
    if(t.includes('peligro') || t.includes('contraataque') || t.includes('pase filtrado') || t.includes('remata') || t.includes('rechace') || t.includes('se planta solo')) return 'ocasion';
    if(esPrioritario(texto)) return 'prioritario';
    return 'normal';
  }
  const TONOS={
    gol:        { pitch:1.28, rate:1.32 }, // el grito de gol
    ocasion:    { pitch:1.05, rate:1.20 }, // sube la tensión
    tarjeta:    { pitch:0.80, rate:0.94 }, // serio, casi de reproche
    lesion:     { pitch:0.78, rate:0.90 }, // preocupado, más lento
    prioritario:{ pitch:0.98, rate:1.02 }, // anuncio claro y firme
    normal:     { pitch:0.90, rate:1.04 }, // base madura, algo viva
  };

  // Siglas de forma jurídica de club que un comentarista real jamás
  // pronuncia ("Valencia CF", nunca "Valencia Ce Efe").
  const SIGLAS_CLUB=['CF','SD','CD','UD','RC','RCD','CA'];
  function quitarSiglasClub(texto){
    let out=texto;
    SIGLAS_CLUB.forEach(sigla=>{ out=out.replace(new RegExp('\\b'+sigla+'\\b','g'), ''); });
    return out.replace(/\s+/g,' ').trim();
  }
  // Palabras en mayúsculas ("POPSTEAM") se deletrean en muchas voces
  // en vez de leerse como palabra — se pasan a formato Título.
  function corregirMayusculas(texto){
    return texto.replace(/\b[A-ZÁÉÍÓÚÑ]{3,}\b/g, palabra => palabra.charAt(0)+palabra.slice(1).toLowerCase());
  }
  // Si dos frases seguidas son del MISMO equipo, un comentarista real
  // no repite su nombre en cada una ("Real Madrid... Real Madrid...
  // Real Madrid..." suena antinatural) — se omite a partir de la
  // segunda vez seguida, hasta que el protagonismo cambia de equipo.
  // Necesita los nombres reales de ESTE partido concreto (expuestos
  // por el visor en window.G2G_EquiposNarracion) para reconocerlos;
  // sin eso, no se toca nada.
  let ultimoEquiposRef=null;
  let ultimoEquipoNarrado=null;
  function escaparRegex(s){ return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function omitirEquipoRepetido(texto){
    const equipos=window.G2G_EquiposNarracion;
    if(equipos!==ultimoEquiposRef){ ultimoEquiposRef=equipos; ultimoEquipoNarrado=null; }
    if(!equipos || !equipos.mio || !equipos.rival) return texto;
    const nombres=[equipos.mio, equipos.rival];
    let resultado=texto;
    let equipoDetectado=null;
    for(const nombre of nombres){
      if(texto.startsWith(nombre+' ')){
        equipoDetectado=nombre;
        if(nombre===ultimoEquipoNarrado){
          const resto=texto.slice(nombre.length+1);
          resultado=resto.charAt(0).toUpperCase()+resto.slice(1);
        }
        break;
      }
      const patronDe=new RegExp('\\bde '+escaparRegex(nombre)+'\\b');
      if(patronDe.test(texto)){
        equipoDetectado=nombre;
        if(nombre===ultimoEquipoNarrado){
          resultado=texto.replace(patronDe, '').replace(/\s+/g,' ').replace(/\s+([!?.,])/,'$1').trim();
        }
        break;
      }
    }
    if(equipoDetectado) ultimoEquipoNarrado=equipoDetectado;
    return resultado;
  }
  function limpiarTexto(texto){
    let out=texto.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}]/gu,'');
    out=omitirEquipoRepetido(out);
    out=quitarSiglasClub(out);
    out=corregirMayusculas(out);
    return out.replace(/\s+/g,' ').trim();
  }

  let colaNormal=null;
  let colaPrioridad=[];
  let hablando=false;
  let ultimoTextoDicho=null;

  function hablar(texto){
    if(!soportada) return;
    const limpio=limpiarTexto(texto);
    if(!limpio || limpio===ultimoTextoDicho){ continuar(); return; }
    ultimoTextoDicho=limpio;
    const u=new SpeechSynthesisUtterance(limpio);
    if(vozSeleccionada) u.voice=vozSeleccionada;
    u.lang='es-ES';
    u.volume=NIVELES[nivelActual].volumen;
    const tono=TONOS[categoriaDe(texto)];
    u.pitch=tono.pitch;
    u.rate=tono.rate;
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
      colaNormal=texto;
    } else {
      hablar(texto);
    }
  }

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
    colaPrioridad=[]; colaNormal=null; hablando=false; ultimoTextoDicho=null; ultimoEquipoNarrado=null;
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
    sincronizarBotonSettings();
  }
  function setEnabled(v){ aplicarNivel(v ? Math.max(1,nivelActual) : 0); }
  function siguienteNivel(){
    const actual=narracionEnabled?nivelActual:0;
    aplicarNivel((actual+1)%NIVELES.length);
  }
  function setVoz(voiceURI){
    vozManualURI=voiceURI||null;
    try{
      if(vozManualURI) localStorage.setItem(VOZ_KEY, vozManualURI);
      else localStorage.removeItem(VOZ_KEY);
    }catch(e){}
    vozSeleccionada=elegirVoz();
  }

  function sincronizarBoton(){
    const btn=document.getElementById('lmNarracionToggleBtn');
    if(!btn) return;
    const nivelMostrado=narracionEnabled?nivelActual:0;
    btn.classList.toggle('lm-narracion-on', narracionEnabled);
    const icon=btn.querySelector('i');
    if(icon) icon.className='ph ph-bold '+NIVELES[nivelMostrado].icon;
  }
  function sincronizarBotonSettings(){
    const dot=document.getElementById('narracionSettingsDot');
    if(dot) dot.classList.toggle('on', narracionEnabled);
  }

  function poblarSelectorVoces(){
    const sel=document.getElementById('narracionVozSelect');
    if(!sel || !soportada) return;
    const voces=vocesDisponibles.length?vocesDisponibles:window.speechSynthesis.getVoices();
    if(!voces.length) return;
    const actual=sel.value;
    sel.innerHTML='<option value="">Automática</option>'+voces.map(v=>`<option value="${v.voiceURI}">${v.name}${v.lang?' ('+v.lang+')':''}</option>`).join('');
    sel.value = vozManualURI && voces.some(v=>v.voiceURI===vozManualURI) ? vozManualURI : (actual||'');
  }

  function conectarBoton(){
    const btn=document.getElementById('lmNarracionToggleBtn');
    if(btn && !btn.dataset.g2gWired){
      btn.dataset.g2gWired='1';
      btn.addEventListener('click', ()=>{
        siguienteNivel();
        if(typeof window.playSound==='function' && narracionEnabled) window.playSound('select');
      });
      sincronizarBoton();
    }
    const btnSettings=document.getElementById('narracionToggleSettings');
    if(btnSettings && !btnSettings.dataset.g2gWired){
      btnSettings.dataset.g2gWired='1';
      btnSettings.addEventListener('click', ()=>{
        setEnabled(!narracionEnabled);
        if(typeof window.playSound==='function' && narracionEnabled) window.playSound('select');
      });
      sincronizarBotonSettings();
    }
    const sel=document.getElementById('narracionVozSelect');
    if(sel && !sel.dataset.g2gWired){
      sel.dataset.g2gWired='1';
      poblarSelectorVoces();
      sel.addEventListener('change', ()=>{ setVoz(sel.value); });
    }
  }

  setInterval(()=>{ conectarBoton(); observarBarra(); }, 500);

  window.G2GNarracion={
    setEnabled, isEnabled:()=>narracionEnabled, siguienteNivel, getNivel:()=>(narracionEnabled?nivelActual:0),
    setVoz, getVozActual:()=>vozSeleccionada, soportada,
  };

})();
