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

  const soportada = typeof window.speechSynthesis!=='undefined' && typeof window.SpeechSynthesisUtterance!=='undefined';

  // Idioma del narrador = idioma seleccionado en el propio juego
  // (window.LANG, i18n.js) — nunca se le da a elegir al jugador, se
  // adapta sola. Español siempre busca la variante de España
  // (es-ES) antes que cualquier otra (es-MX, es-US...).
  const LOCALE_PREFERIDO={ es:'es-ES', en:'en-US', pt:'pt-PT', fr:'fr-FR', de:'de-DE', it:'it-IT' };
  const PREFIJO_IDIOMA={ es:'es', en:'en', pt:'pt', fr:'fr', de:'de', it:'it' };

  // Heurística de "voz masculina madura": la Web Speech API no
  // permite pedir un timbre concreto, así que se puntúan las voces
  // disponibles por su NOMBRE (los motores de voz de los sistemas
  // operativos suelen incluir nombres propios reconocibles) y se
  // elige la de mayor puntuación — nombres masculinos habituales en
  // los 6 idiomas del juego, no solo en español, ya que la voz debe
  // sonar a hombre sea cual sea el idioma seleccionado.
  const NOMBRES_MASCULINOS=[
    'jorge','diego','pablo','juan','carlos','miguel','enrique','raul','raúl','alonso','fernando','alvaro','álvaro','ricardo', // es
    'david','james','mark','daniel','alex','fred','george','matthew','ryan','tom', // en
    'diogo','bruno','duarte','joaquim', // pt
    'thomas','nicolas','henri','antoine','paul', // fr
    'stefan','klaus','markus','hans','michael', // de
    'luca','marco','paolo','giorgio','roberto', // it
    'male','hombre','homme','uomo','mann','homem',
  ];
  const NOMBRES_FEMENINOS=[
    'monica','mónica','paulina','esperanza','marisol','sabina','helena','conchita','lucia','lucía','camila','laura','elvira', // es
    'susan','samantha','karen','zira','linda','emma','kate', // en
    'joana','ines','inês', // pt
    'julie','celine','céline','amelie','amélie', // fr
    'anna','petra','katja','marlene', // de
    'elsa','giulia','francesca','paola', // it
    'female','mujer','femme','donna','frau','mulher',
  ];
  function puntuarVoz(v, prefijoLang){
    const n=(v.name||'').toLowerCase();
    let score=0;
    if(NOMBRES_MASCULINOS.some(nm=>n.includes(nm))) score+=10;
    if(NOMBRES_FEMENINOS.some(nm=>n.includes(nm))) score-=10;
    if(v.lang && v.lang.toLowerCase()===LOCALE_PREFERIDO[window.LANG]) score+=6; // variante exacta (es-ES, no otro es-XX)
    else if(v.lang && v.lang.toLowerCase().startsWith(prefijoLang)) score+=3;
    if(v.localService) score+=1;
    return score;
  }

  let vozSeleccionada=null;
  let vocesDisponibles=[];
  let ultimoLangUsado=null;
  function elegirVoz(){
    if(!soportada) return null;
    vocesDisponibles=window.speechSynthesis.getVoices();
    if(!vocesDisponibles.length) return null;
    const lang=(window.LANG && PREFIJO_IDIOMA[window.LANG]) ? window.LANG : 'es';
    ultimoLangUsado=lang;
    const prefijo=PREFIJO_IDIOMA[lang];
    const candidatas=vocesDisponibles.filter(v=>v.lang && v.lang.toLowerCase().startsWith(prefijo));
    const pool=candidatas.length?candidatas:vocesDisponibles;
    return pool.slice().sort((a,b)=>puntuarVoz(b,prefijo)-puntuarVoz(a,prefijo))[0] || pool[0];
  }
  if(soportada){
    vozSeleccionada=elegirVoz();
    window.speechSynthesis.onvoiceschanged=()=>{ vozSeleccionada=elegirVoz(); };
    // La app móvil (WebView de Android) es el caso conflictivo aquí:
    // getVoices() suele devolver una lista VACÍA nada más cargar la
    // página, y en bastantes versiones de WebView el evento
    // "voiceschanged" nunca llega a dispararse — así que fiarse solo
    // de ese evento deja la narración sin voz para siempre en esos
    // casos. Como red de seguridad, se reintenta a mano cada segundo
    // durante los primeros 15s (tiempo de sobra para que el motor de
    // voz del sistema termine de inicializarse), y se para en cuanto
    // ya hay una voz elegida.
    let intentosVoz=0;
    const intervaloVoces=setInterval(()=>{
      intentosVoz++;
      if(vozSeleccionada || intentosVoz>15){ clearInterval(intervaloVoces); return; }
      vozSeleccionada=elegirVoz();
    }, 1000);
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
    gol:        { pitch:1.18, rate:1.10 }, // el grito de gol -- solo un poco más rápida que la normal (1.04), no un atropello
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
  // Ficha de turno — identifica cada intento de hablar concreto, para
  // que la red de seguridad de más abajo (el "watchdog") pueda saber
  // si sigue siendo el mismo intento al que pertenece antes de forzar
  // nada, y no interfiera si mientras tanto ya se pasó de verdad a la
  // siguiente frase por su cuenta.
  let tokenHabla=0;
  let ultimoTextoDicho=null;

  function hablar(texto){
    const limpio=limpiarTexto(texto);
    if(!limpio || limpio===ultimoTextoDicho){ continuar(); return; }
    ultimoTextoDicho=limpio;
    const tono=TONOS[categoriaDe(texto)];
    // Puente nativo opcional: si la app Android expone
    // window.AndroidTTS (vía WebView.addJavascriptInterface(), igual
    // que ya existe un puente nativo para el selector de archivos en
    // esta misma app), se usa directamente el motor de Texto a Voz
    // de Android en vez de la Web Speech API del propio WebView —
    // mucho más fiable, porque no depende de que ESE WebView en
    // concreto tenga bien implementada la síntesis de voz (un fallo
    // real y frecuente en WebView de Android, a diferencia de Chrome
    // de escritorio). Mientras ese puente no exista del lado
    // Android, este bloque simplemente no se activa y todo sigue
    // funcionando exactamente igual que antes (Web Speech API
    // normal, más abajo).
    if(window.AndroidTTS && typeof window.AndroidTTS.speak==='function'){
      hablando=true;
      const miTokenAndroid=++tokenHabla;
      // Se manda también el idioma actual del juego (mismo mapeo que
      // ya usa la Web Speech API más abajo) — sin esto, el puente
      // nativo no tenía forma de saber qué idioma tocaba usar y
      // siempre hablaba en español, sin importar lo que el jugador
      // tuviera seleccionado en el juego.
      const localeActual=LOCALE_PREFERIDO[window.LANG] || 'es-ES';
      try{
        window.AndroidTTS.speak(limpio, tono.pitch, tono.rate, NIVELES[nivelActual].volumen, localeActual);
      }catch(e){
        // Red de seguridad: si el puente nativo instalado en el
        // dispositivo todavía es una versión antigua (con speak() de
        // solo 4 parámetros, sin el idioma), la llamada de arriba
        // falla porque el número de argumentos no coincide con
        // ningún método nativo expuesto — sin este reintento, esa
        // llamada fallida dejaba el narrador completamente mudo en
        // vez de sonar aunque fuera con el idioma antiguo.
        try{ window.AndroidTTS.speak(limpio, tono.pitch, tono.rate, NIVELES[nivelActual].volumen); }catch(e2){}
      }
      // El puente nativo no tiene forma directa de avisar cuándo
      // termina de hablar sin código adicional en el lado Android —
      // se estima la duración a partir de la longitud del texto para
      // saber cuándo pasar a la siguiente frase de la cola.
      const duracionEstimadaMs=Math.max(900, limpio.length*70/tono.rate);
      setTimeout(()=>{ if(tokenHabla===miTokenAndroid) continuar(); }, duracionEstimadaMs);
      return;
    }
    if(!soportada) return;
    const u=new SpeechSynthesisUtterance(limpio);
    // Si no hay voz elegida (típico en WebView de Android mientras el
    // motor de voz del sistema no ha terminado de listar sus voces)
    // se deja que el propio sistema use su voz por defecto en vez de
    // no decir nada — mejor una voz no ideal que silencio total.
    if(vozSeleccionada) u.voice=vozSeleccionada;
    // El idioma declarado en el "utterance" debe coincidir con el de
    // la voz REAL encontrada en el dispositivo, no con el idioma
    // "preferido" a ciegas — si el dispositivo solo tiene instalada
    // "es-US" y aquí se declaraba "es-ES", algunos motores de
    // WebView de Android fallan en silencio (sin error, sin sonido)
    // al no coincidir voz e idioma declarado. Se usa el lang real de
    // la voz encontrada siempre que exista.
    u.lang=(vozSeleccionada && vozSeleccionada.lang) ? vozSeleccionada.lang : (LOCALE_PREFERIDO[window.LANG] || 'es-ES');
    u.volume=NIVELES[nivelActual].volumen;
    u.pitch=tono.pitch;
    u.rate=tono.rate;
    hablando=true;
    const miToken=++tokenHabla;
    u.onend=()=>{ if(tokenHabla===miToken) continuar(); };
    u.onerror=()=>{ if(tokenHabla===miToken) continuar(); };
    // Cancelar cualquier resto pendiente justo antes de hablar es una
    // mitigación conocida para un fallo real de los motores basados en
    // Chromium (WebView de Android incluido): tras un tiempo la cola
    // interna de speechSynthesis puede quedarse "atascada" y dejar de
    // decir nada nunca más hasta recargar la página entera.
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    // Red de seguridad adicional (el "watchdog"): la cancelación de
    // arriba no siempre evita el atasco — si tras un margen generoso
    // ni onend ni onerror han disparado todavía, se fuerza a seguir de
    // todas formas. Sin esto, un solo atasco dejaba al narrador mudo
    // para el resto del partido entero, aunque los mensajes de texto
    // siguieran apareciendo con normalidad debajo (el fallo exacto que
    // describía el jugador).
    const duracionEstimadaMs=Math.max(1500, limpio.length*90/tono.rate);
    setTimeout(()=>{
      if(tokenHabla===miToken && hablando){
        hablando=false;
        continuar();
      }
    }, duracionEstimadaMs);
  }
  function continuar(){
    hablando=false;
    if(colaPrioridad.length){ hablar(colaPrioridad.shift()); return; }
    if(colaNormal){ const t=colaNormal; colaNormal=null; hablar(t); }
  }
  function hayMotorDeVoz(){
    return soportada || !!(window.AndroidTTS && typeof window.AndroidTTS.speak==='function');
  }
  function narrar(texto){
    if(!narracionEnabled || !hayMotorDeVoz() || !texto || !texto.trim()) return;
    if(esPrioritario(texto)){
      if(hablando){ if(soportada) window.speechSynthesis.cancel(); hablando=false; }
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
    if(window.AndroidTTS && typeof window.AndroidTTS.stop==='function'){ try{ window.AndroidTTS.stop(); }catch(e){} }
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
  }
  // Diagnóstico visible EN LA PROPIA APP (un toast, no la consola —
  // en el APK de Android no hay forma de ver la consola sin depurar
  // por USB) la primera vez que se activa, para saber con certeza en
  // qué punto exacto falla si no llega a sonar: si la propia API de
  // voz no existe en ese WebView (hace falta un cambio en la app
  // nativa de Android, no arreglable desde aquí), si existe pero no
  // encuentra ninguna voz de sistema, o si todo está bien y debería
  // sonar.
  // La lista de voces de Android se puede seguir consultando bajo
  // demanda (window.G2GNarracion.listarVocesAndroid()) — ya no se
  // muestra sola al activar el narrador, para no interrumpir con un
  // aviso técnico cada vez.
  function mostrarListaVocesAndroid(){
    if(!(window.AndroidTTS && typeof window.AndroidTTS.listarVoces==='function')) return;
    try{
      const lista=window.AndroidTTS.listarVoces();
      setTimeout(()=>{ alert('Voces de Android disponibles:\n\n'+lista); }, 600);
    }catch(e){}
  }

  function setEnabled(v){ aplicarNivel(v ? Math.max(1,nivelActual) : 0); }
  function siguienteNivel(){
    const actual=narracionEnabled?nivelActual:0;
    const nuevo=(actual+1)%NIVELES.length;
    aplicarNivel(nuevo);
  }

  function sincronizarBoton(){
    const btn=document.getElementById('lmNarracionToggleBtn');
    if(!btn) return;
    const nivelMostrado=narracionEnabled?nivelActual:0;
    btn.classList.toggle('lm-narracion-on', narracionEnabled);
    const icon=btn.querySelector('i');
    if(icon) icon.className='ph ph-bold '+NIVELES[nivelMostrado].icon;
  }

  // "Desbloqueo" de la API de voz: algunos WebView de Android exigen
  // un gesto real del usuario antes de dejar hablar a speechSynthesis
  // la primera vez (igual que ya le pasaba al audio de música/efectos
  // del juego) — se dispara una frase vacía justo en el clic real del
  // icono, que no se oye pero "abre la puerta" para las narraciones
  // automáticas que vengan después sin que haga falta otro clic.
  function desbloquearVoz(){
    if(!soportada) return;
    try{
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(''));
    }catch(e){}
  }

  // Probador de voces: las 5 voces locales en español de España que
  // aparecieron en tu propia lista (eea/eec/eed/eee/eef) — no hay
  // forma pública de saber cuál es masculina solo por el nombre, así
  // que se prueban una a una diciendo su propio nombre en voz alta,
  // sin tener que recompilar la app entre una y otra.
  const VOCES_CANDIDATAS_LOCAL=[
    'es-es-x-eea-local','es-es-x-eec-local','es-es-x-eed-local','es-es-x-eee-local','es-es-x-eef-local',
  ];
  let indiceVozPrueba=-1;
  function probarSiguienteVoz(){
    // Sin el puente nativo de Android no hace nada — en escritorio (o
    // cualquier otro dispositivo sin ese puente) esta función queda
    // completamente inerte, sin ningún aviso ni acción.
    if(!(window.AndroidTTS && typeof window.AndroidTTS.probarVoz==='function')) return;
    indiceVozPrueba=(indiceVozPrueba+1)%VOCES_CANDIDATAS_LOCAL.length;
    const nombre=VOCES_CANDIDATAS_LOCAL[indiceVozPrueba];
    try{ window.AndroidTTS.probarVoz(nombre); }catch(e){}
    if(typeof window.showToast==='function') window.showToast('Probando voz '+(indiceVozPrueba+1)+' de '+VOCES_CANDIDATAS_LOCAL.length, 'toast-neutral');
  }

  function conectarBoton(){
    const btn=document.getElementById('lmNarracionToggleBtn');
    if(btn && !btn.dataset.g2gWired){
      btn.dataset.g2gWired='1';
      // Pulsación larga (medio segundo) sobre el propio icono del
      // altavoz: prueba la SIGUIENTE voz candidata de la lista, una
      // por cada pulsación larga — así se pueden escuchar las 5
      // seguidas sin salir del partido ni tocar nada más. Se marca
      // "disparada" para que el click normal (que salta al soltar,
      // pulsación larga o no) no cambie ADEMÁS el nivel de volumen a
      // la vez que se prueba una voz.
      //
      // Solo tiene sentido en la app de Android con el puente nativo
      // puesto — en escritorio (o cualquier otro caso sin ese
      // puente) el temporizador ni siquiera se arma, así que
      // mantener pulsado el botón no hace absolutamente nada aparte
      // de lo que ya hacía un clic normal al soltarlo.
      let pulsacionLargaTimer=null;
      let pulsacionLargaDisparada=false;
      const iniciarPulsacionLarga=()=>{
        if(!(window.AndroidTTS && typeof window.AndroidTTS.probarVoz==='function')) return;
        pulsacionLargaDisparada=false;
        pulsacionLargaTimer=setTimeout(()=>{ pulsacionLargaDisparada=true; probarSiguienteVoz(); }, 500);
      };
      const cancelarPulsacionLarga=()=>{ if(pulsacionLargaTimer){ clearTimeout(pulsacionLargaTimer); pulsacionLargaTimer=null; } };
      btn.addEventListener('touchstart', iniciarPulsacionLarga, {passive:true});
      btn.addEventListener('touchend', cancelarPulsacionLarga);
      btn.addEventListener('touchmove', cancelarPulsacionLarga);
      btn.addEventListener('mousedown', iniciarPulsacionLarga);
      btn.addEventListener('mouseup', cancelarPulsacionLarga);
      btn.addEventListener('mouseleave', cancelarPulsacionLarga);
      btn.addEventListener('click', ()=>{
        if(pulsacionLargaDisparada){ pulsacionLargaDisparada=false; return; }
        desbloquearVoz();
        siguienteNivel();
        if(typeof window.playSound==='function' && narracionEnabled) window.playSound('select');
      });
      sincronizarBoton();
    }
  }

  // Ping de mantenimiento: un fallo real y documentado de los
  // navegadores basados en Chromium (WebView de Android incluido) dejaba
  // el motor de voz completamente "atascado" — sin decir nada nunca
  // más, sin ningún error — tras un rato con la pantalla apagada o la
  // app en segundo plano. Un pause()+resume() periódico mientras no se
  // esté hablando en ese momento evita que llegue a atascarse.
  setInterval(()=>{
    if(soportada && narracionEnabled && !hablando){
      try{ window.speechSynthesis.pause(); window.speechSynthesis.resume(); }catch(e){}
    }
  }, 10000);

  // Si el jugador cambia el idioma del juego (menú de ajustes), la
  // próxima vez que se compruebe aquí se vuelve a elegir voz
  // automáticamente para el nuevo idioma — nunca hace falta que el
  // jugador elija nada a mano.
  setInterval(()=>{
    conectarBoton();
    observarBarra();
    if(soportada && window.LANG && window.LANG!==ultimoLangUsado){
      vozSeleccionada=elegirVoz();
    }
  }, 500);

  // Anuncio FORZADO: para el resultado final ("¡FINAL DEL PARTIDO! ¡X
  // ES EL VENCEDOR!"), que nunca puede faltar. A diferencia de
  // narrar() normal, esto:
  // - Ignora la protección de "no repetir la misma frase dos veces
  //   seguidas" (por si por cualquier casualidad coincidiera con la
  //   última frase dicha, cosa muy improbable pero no imposible).
  // - Interrumpe cualquier cosa que se estuviera diciendo en ese
  //   momento, en vez de esperar cola.
  // - Sustituye lo que hubiera en la cola prioritaria, para que este
  //   anuncio salga literalmente ya, no "en algún momento".
  // Sigue respetando que la narración esté activada — si el jugador
  // la ha apagado a propósito, aquí tampoco se fuerza a hablar.
  function narrarSiempre(texto){
    if(!narracionEnabled || !hayMotorDeVoz() || !texto || !texto.trim()) return;
    if(soportada && hablando) window.speechSynthesis.cancel();
    if(window.AndroidTTS && typeof window.AndroidTTS.stop==='function' && hablando){ try{ window.AndroidTTS.stop(); }catch(e){} }
    ultimoTextoDicho=null;
    hablando=false;
    colaPrioridad=[texto];
    continuar();
  }

  window.G2GNarracion={
    setEnabled, isEnabled:()=>narracionEnabled, siguienteNivel, getNivel:()=>(narracionEnabled?nivelActual:0),
    getVozActual:()=>vozSeleccionada, soportada,
    // Narra un texto directamente, sin depender del MutationObserver
    // de la barra de información — se usa para anuncios críticos
    // (como el resultado final) que deben decirse SIEMPRE, incluso si
    // el jugador termina el partido antes de tiempo con "TERMINAR Y
    // MOSTRAR RESULTADOS" y por lo que sea el observador no llega a
    // reaccionar a tiempo a ese cambio concreto de texto.
    narrarTexto:(texto)=>narrar(texto),
    narrarSiempre,
    // Vuelve a mostrar la lista de voces de Android en cualquier
    // momento (sin tener que apagar y encender el narrador) — útil
    // para comprobar qué voces reales tiene el dispositivo.
    listarVocesAndroid:()=>{
      if(!(window.AndroidTTS && typeof window.AndroidTTS.listarVoces==='function')){
        alert('No hay puente nativo de Android (window.AndroidTTS) en este dispositivo.');
        return;
      }
      mostrarListaVocesAndroid();
    },
    // Prueba la siguiente voz candidata en español (pulsación larga
    // sobre el propio icono del altavoz hace lo mismo) — útil para
    // llamarla también desde fuera si hiciera falta.
    probarSiguienteVoz,
  };

})();
