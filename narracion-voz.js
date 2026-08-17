/* ============================================================
   GOAL2GOAT — Narración por voz del partido (modo manager)
   ------------------------------------------------------------
   Usa la Web Speech API del propio navegador (gratuita, sin
   servidor ni claves de API, igual de "todo en el cliente" que el
   resto del proyecto) para narrar en voz alta lo que va apareciendo
   en la barra de información del partido.

   En vez de enganchar cada uno de los ~36 puntos del código que
   actualizan esa barra, se observa el propio elemento con un
   MutationObserver — cualquier cambio de texto dispara la
   narración automáticamente, venga de donde venga.

   Como el partido puede ir más rápido de lo que se tarda en decir
   una frase, se usa una cola de un único hueco por prioridad:
   - Mensajes normales: solo se guarda el ÚLTIMO pendiente (se
     sustituye si llega uno nuevo antes de poder decirlo) — así la
     narración nunca se queda atascada diciendo cosas ya viejas.
   - Mensajes prioritarios (gol, comienzo de partido, descanso,
     segunda parte, final) SIEMPRE se dicen, nunca se descartan, e
     interrumpen lo que se estuviera narrando en ese momento.
   ============================================================ */

(function(){

  const STORAGE_KEY='g2g_narracionEnabled';
  let narracionEnabled=false; // apagada por defecto — es una función nueva y llamativa, mejor que el jugador la active si la quiere
  try{
    const saved=localStorage.getItem(STORAGE_KEY);
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
  // narrar, nunca descartar ni interrumpir a mitad — el resto de
  // mensajes (jugadas, tarjetas, lesiones...) son "normales" y
  // pueden sustituirse por el siguiente si el partido va deprisa.
  const PALABRAS_PRIORIDAD=['gol','descanso','primera parte','segunda parte','final','comienza','pitido inicial','simulando partido'];
  function esPrioritario(texto){
    const t=texto.toLowerCase();
    return PALABRAS_PRIORIDAD.some(p=>t.includes(p));
  }
  function limpiarTexto(texto){
    // Quita emojis sueltos (⚽ ✚ etc.) para que la voz no intente
    // pronunciarlos literalmente.
    return texto.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}]/gu,'').replace(/\s+/g,' ').trim();
  }

  let colaNormal=null;
  let colaPrioridad=[];
  let hablando=false;

  function hablar(texto){
    if(!soportada) return;
    const limpio=limpiarTexto(texto);
    if(!limpio){ continuar(); return; }
    const u=new SpeechSynthesisUtterance(limpio);
    if(vozSeleccionada) u.voice=vozSeleccionada;
    u.lang='es-ES';
    u.rate=1.15;
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
  // que la actualizan) dispara la narración sola, sin enganchar cada
  // punto por separado.
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
    colaPrioridad=[]; colaNormal=null; hablando=false;
  }

  function setEnabled(v){
    narracionEnabled=!!v;
    try{ localStorage.setItem(STORAGE_KEY, narracionEnabled); }catch(e){}
    if(!narracionEnabled) pararTodo();
    sincronizarBoton();
  }

  function sincronizarBoton(){
    const btn=document.getElementById('lmNarracionToggleBtn');
    if(!btn) return;
    btn.classList.toggle('lm-narracion-on', narracionEnabled);
    const icon=btn.querySelector('i');
    if(icon) icon.className = narracionEnabled ? 'ph ph-bold ph-speaker-high' : 'ph ph-bold ph-speaker-slash';
  }

  function conectarBoton(){
    const btn=document.getElementById('lmNarracionToggleBtn');
    if(!btn || btn.dataset.g2gWired) return;
    btn.dataset.g2gWired='1';
    btn.addEventListener('click', ()=>{
      setEnabled(!narracionEnabled);
      if(typeof window.playSound==='function') window.playSound('select');
    });
    sincronizarBoton();
  }

  // Tanto el botón como la barra observada se recrean cada vez que
  // se abre un partido nuevo — se reintenta conectar/observar
  // periódicamente sin coste real (ambas funciones no hacen nada si
  // ya estaban conectadas).
  setInterval(()=>{ conectarBoton(); observarBarra(); }, 500);

  window.G2GNarracion={ setEnabled, isEnabled:()=>narracionEnabled, soportada };

})();
