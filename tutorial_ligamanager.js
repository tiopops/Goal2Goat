/* ═══════════════════════════════════════════════════════════════
   TUTORIAL INTERACTIVO — Liga Manager (Goal2Goat)
   Mismo motor visual y mismas reglas que tutorial.js (Copa Leyendas):
   archivo totalmente independiente de liga-manager.js, no modifica ni
   una sola línea de él, solo se engancha a elementos que ya existen
   por su id/clase. Si algo de este archivo fallara, basta con quitar
   su <script> de index.html para que el modo quede exactamente igual
   que antes de añadirlo.

   El recuadro de texto SIEMPRE aparece centrado en la pantalla, fijo,
   con su propio scroll interno si hiciera falta. El elemento señalado
   se resalta aparte, con un brillo dorado, sin que eso afecte a dónde
   está el recuadro de texto — calcado deliberadamente del tutorial de
   Copa Leyendas para que la experiencia sea coherente entre modos.
   ═══════════════════════════════════════════════════════════════ */
(function(){

  // El disparo del tutorial depende de la marca sessionStorage que
  // deja empezarTemporada() en liga-manager.js (ver maybeAutoStart más
  // abajo) — no de ningún "visto para siempre" en localStorage.

  function isMobileLayout(){
    return window.innerWidth <= 1050;
  }

  function getSteps(){
    return [
      {
        selector: '#modeCardLigaBtn, .lm-setup-card',
        title: '1 · Elige tu club',
        text: 'Puedes crear un club totalmente personalizado o convertirte en uno de los 20 equipos reales de LaLiga, con sus jugadores reales. Esta elección define tu identidad para toda la temporada.'
      },
      {
        selector: '#lmPitchBox, .lm-panel',
        title: '2 · Completa tu plantilla y formación',
        text: 'Coloca a cada jugador en su <strong>posición</strong> para que rinda al máximo. Puedes cambiar la formación antes de cada partido — hay 21 formaciones reales entre las que elegir.'
      },
      {
        selector: '.lm-nextmatch-box, #lmPanelRival',
        title: '3 · Tu próximo rival',
        text: 'Aquí ves toda la información del siguiente partido: el rival, si juegas en casa o fuera, su estilo de juego y el clima previsto — todo esto influye de verdad en el resultado.'
      },
      {
        selector: '.lm-calendario-box',
        title: '4 · El calendario de la temporada',
        text: 'Sigue las 38 jornadas de la liga. Los días antes de cada partido puedes entrenar a tus jugadores o dejarlos descansar — no todo se decide el día del partido.'
      },
      {
        selector: '.lm-correo-box',
        title: '5 · Tu correo interno',
        text: 'Tu cuerpo técnico (Director Deportivo, Médico, Preparador Físico y más) te escribe aquí con avisos importantes: lesiones, fichajes, sobres disponibles y decisiones que requieren tu atención.'
      },
      {
        selector: () => isMobileLayout() ? '#lmMobileTabBar, #mobileTabBar' : '.app',
        title: '6 · Tu centro de mando',
        text: () => (isMobileLayout()
          ? 'En el móvil, las pestañas de abajo cambian entre el campo, tu plantilla, el rival y el correo — todo a un toque.'
          : 'En escritorio tienes tu plantilla, el campo y la información del rival visibles a la vez, sin cambiar de pantalla.')
          + ' <br><br>Gestiona tu <strong>cuerpo técnico</strong> para hacer crecer el club, contesta bien en la <strong>rueda de prensa</strong>, y no descuides la <strong>moral</strong> del equipo. <br><br>Puedes volver a ver este tutorial cuando quieras desde <strong>CÓMO JUGAR</strong>.'
      },
    ];
  }

  let currentStep = 0;
  let overlayEl = null;
  // Opt-out permanente y explícito del jugador (checkbox en el propio
  // recuadro del tutorial) — a diferencia del resto del disparo
  // automático (que depende de sessionStorage y se reinicia con cada
  // liga nueva a propósito), esta marca vive en localStorage y NUNCA
  // se borra sola: ni al recargar la web, ni al reiniciar, ni al
  // empezar una liga nueva. Es la única forma de que el tutorial deje
  // de aparecer para siempre.
  const NO_AUTO_KEY = 'g2g_tut_lm_no_auto';
  let noAutoChecked = false;
  try{ noAutoChecked = localStorage.getItem(NO_AUTO_KEY) === '1'; }catch(e){}
  let highlightEls = [];
  let transitioning = false; // evita que dobles clics rápidos solapen dos pasos

  // ───────── Resaltado del elemento señalado ─────────
  let spotlightTrackHandler = null;
  function stopSpotlightTracking(){
    if(spotlightTrackHandler){
      window.removeEventListener('scroll', spotlightTrackHandler, true);
      window.removeEventListener('resize', spotlightTrackHandler);
      spotlightTrackHandler = null;
    }
  }
  function startSpotlightTracking(applyFn){
    stopSpotlightTracking();
    spotlightTrackHandler = () => applyFn();
    window.addEventListener('scroll', spotlightTrackHandler, true);
    window.addEventListener('resize', spotlightTrackHandler);
  }

  function clearHighlights(){
    stopSpotlightTracking();
    highlightEls = [];
    if(overlayEl) positionSpotlightRect(null);
  }

  function addHighlight(el){
    highlightEls.push(el);
    positionSpotlight(el);
  }

  function positionSpotlight(el){
    if(!el){ positionSpotlightRect(null); return; }
    const rect = el.getBoundingClientRect();
    positionSpotlightRect(rect.left, rect.top, rect.width, rect.height);
  }

  function positionSpotlightRect(left, top, width, height){
    const spotlight = overlayEl.querySelector('#g2gTutLmSpotlight');
    if(left === null){ spotlight.classList.remove('g2g-tut-pulse'); return; }
    const pad = 4;
    spotlight.style.top = (top - pad) + 'px';
    spotlight.style.left = (left - pad) + 'px';
    spotlight.style.width = (width + pad*2) + 'px';
    spotlight.style.height = (height + pad*2) + 'px';
    spotlight.classList.add('g2g-tut-pulse');
  }

  function resolveSelector(sel){
    return typeof sel === 'function' ? sel() : sel;
  }

  function findFirstMatch(selectorList){
    // Varios selectores separados por coma, se usa el primero que
    // exista de verdad y esté visible — la interfaz de Liga Manager
    // cambia mucho de pantalla a pantalla, así que un solo selector
    // fijo fallaría en cuanto el jugador estuviera en otro punto del
    // flujo (configuración, plantilla, jornada ya en curso...).
    const partes = selectorList.split(',').map(s=>s.trim());
    for(const sel of partes){
      const el = document.querySelector(sel);
      if(el && el.offsetParent !== null) return el;
    }
    return null;
  }

  // ───────── Paso actual ─────────
  function positionBox(box, targetEl){
    const SAFE_TOP = 34;
    const SAFE_BOTTOM = 68; // deja hueco de sobra para la barra móvil, aunque no se encuentre el elemento a señalar
    const viewportH = window.innerHeight;

    if(!targetEl){
      box.style.top = '';
      box.style.bottom = SAFE_BOTTOM + 'px';
      return;
    }
    const rect = targetEl.getBoundingClientRect();
    const targetMidY = rect.top + rect.height/2;

    if(targetMidY > viewportH/2){
      box.style.top = SAFE_TOP + 'px';
      box.style.bottom = '';
    } else {
      box.style.bottom = SAFE_BOTTOM + 'px';
      box.style.top = '';
    }
  }

  function renderStep(){
    clearHighlights();

    const steps = getSteps();
    const step = steps[currentStep];
    const total = steps.length;

    const selector = resolveSelector(step.selector);
    let targetEl = selector ? findFirstMatch(selector) : null;

    if(targetEl){
      targetEl.scrollIntoView({behavior:'auto', block:'center'});
    }

    const applySpotlight = () => {
      if(targetEl) addHighlight(targetEl);
      else positionSpotlight(null);
    };
    setTimeout(applySpotlight, 60);
    startSpotlightTracking(applySpotlight);

    const text = typeof step.text === 'function' ? step.text() : step.text;

    const box = overlayEl.querySelector('#g2gTutLmBox');
    box.innerHTML = `
      <div style="font-size:10px;color:var(--gold,#f0c419);letter-spacing:1px;margin-bottom:4px">PASO ${currentStep+1} DE ${total}</div>
      <div style="font-family:'Bebas Neue',Impact,sans-serif;letter-spacing:.5px;font-size:16px;color:#fff;margin-bottom:8px">${step.title}</div>
      <div style="font-size:13px;color:#e8e6e1;line-height:1.5;margin-bottom:16px">${text}</div>
      <label style="display:flex;align-items:center;gap:7px;font-size:11px;color:#8a9094;margin-bottom:12px;cursor:pointer;user-select:none">
        <input type="checkbox" id="g2gTutLmNoAuto" ${noAutoChecked?'checked':''} style="cursor:pointer;accent-color:var(--gold,#f0c419)">
        No volver a mostrar automáticamente
      </label>
      <div style="display:flex;gap:8px;align-items:center">
        <button id="g2gTutLmSkip" style="background:none;border:none;color:#8a9094;font-size:12px;cursor:pointer;text-decoration:underline;padding:6px 4px">Saltar</button>
        <div style="flex:1"></div>
        ${currentStep>0 ? `<button id="g2gTutLmPrev" style="background:none;border:1px solid #555;color:#ccc;border-radius:6px;padding:8px 14px;cursor:pointer;font-family:'Bebas Neue',Impact,sans-serif;letter-spacing:1px;font-size:12px">ATRÁS</button>` : ''}
        <button id="g2gTutLmNext" style="background:var(--gold,#f0c419);border:none;color:#000;border-radius:6px;padding:8px 16px;cursor:pointer;font-family:'Bebas Neue',Impact,sans-serif;letter-spacing:1px;font-size:12px">${currentStep<total-1?'SIGUIENTE':'ENTENDIDO'}</button>
      </div>
    `;

    const noAutoCheckbox = box.querySelector('#g2gTutLmNoAuto');
    if(noAutoCheckbox) noAutoCheckbox.addEventListener('change', ()=>{
      noAutoChecked = noAutoCheckbox.checked;
      try{
        if(noAutoChecked) localStorage.setItem(NO_AUTO_KEY, '1');
        else localStorage.removeItem(NO_AUTO_KEY);
      }catch(e){}
    });
    box.querySelector('#g2gTutLmSkip').addEventListener('click', ()=>{ playTutSound(); guarded(endTutorial); });
    box.querySelector('#g2gTutLmNext').addEventListener('click', ()=>{ playTutSound(); guarded(()=>{
      if(currentStep < total-1){ currentStep++; renderStep(); }
      else endTutorial();
    }); });
    const prevBtn = box.querySelector('#g2gTutLmPrev');
    if(prevBtn) prevBtn.addEventListener('click', ()=>{ playTutSound(); guarded(()=>{ currentStep--; renderStep(); }); });

    setTimeout(()=>positionBox(box, targetEl), 300);
    transitioning = false;
  }

  function guarded(fn){
    if(transitioning) return;
    transitioning = true;
    fn();
  }

  function startTutorial(){
    currentStep = 0;
    transitioning = false;
    overlayEl = document.createElement('div');
    overlayEl.id = 'g2gTutLmOverlay';
    overlayEl.style.cssText = 'position:fixed;inset:0;z-index:2147483647;pointer-events:auto';
    overlayEl.innerHTML = `
      <div id="g2gTutLmSpotlight" style="position:fixed;pointer-events:none;border-radius:8px;
        transition:top .25s ease,left .25s ease,width .25s ease,height .25s ease;"></div>
      <div id="g2gTutLmBox" style="pointer-events:auto;position:fixed;left:50%;transform:translateX(-50%);
        width:92%;max-width:380px;max-height:45vh;overflow-y:auto;
        background:#1a1d1f;border:2px solid var(--gold,#f0c419);border-radius:10px;
        padding:16px;box-shadow:0 8px 24px rgba(0,0,0,.5);box-sizing:border-box"></div>
    `;
    document.body.appendChild(overlayEl);
    ensurePulseStyle();
    renderStep();
  }

  function ensurePulseStyle(){
    // Reutiliza la misma animación que Copa Leyendas si ya está en la
    // página (tutorial.js suele cargar antes); si no, la crea aparte
    // con un id propio para no depender de que el otro tutorial exista.
    if(document.getElementById('g2gTutPulseStyleTag') || document.getElementById('g2gTutLmPulseStyleTag')) return;
    const style = document.createElement('style');
    style.id = 'g2gTutLmPulseStyleTag';
    style.textContent = `
      @keyframes g2gTutPulse{
        0%,100%{ outline-color:rgba(240,196,25,.65); box-shadow:0 0 0 9999px rgba(0,0,0,.6), 0 0 14px rgba(240,196,25,.35); }
        50%{ outline-color:rgba(240,196,25,1); box-shadow:0 0 0 9999px rgba(0,0,0,.6), 0 0 26px rgba(240,196,25,.75); }
      }
      #g2gTutLmSpotlight.g2g-tut-pulse{
        outline:3px solid #f0c419;
        animation:g2gTutPulse 1.6s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);
  }

  function endTutorial(){
    clearHighlights();
    if(overlayEl){ overlayEl.remove(); overlayEl = null; }
    // Ya no se guarda "visto para siempre" — el disparo depende solo
    // de si se acaba de crear una liga nueva (ver maybeAutoStart), así
    // que saltar el tutorial en esta liga no debe impedir que vuelva a
    // aparecer si el jugador crea otra liga nueva más adelante.
  }

  function playTutSound(){
    try{ if(typeof playSound==='function') playSound('select'); }catch(e){}
  }

  function bindReplayButton(){
    const btn = document.getElementById('lmReplayTutorialBtn');
    if(btn && !btn.dataset.g2gBound){
      btn.dataset.g2gBound = '1';
      btn.addEventListener('click', ()=>{ playTutSound(); startTutorial(); });
    }
  }
  // El botón "VER TUTORIAL DE NUEVO" de Liga Manager se pinta de forma
  // dinámica (render() de liga-manager.js), así que puede no existir
  // todavía al cargar este archivo — se reintenta el enganche cada
  // poco tiempo en vez de una sola vez al arrancar.
  document.addEventListener('DOMContentLoaded', bindReplayButton);
  bindReplayButton();
  setInterval(bindReplayButton, 1500);

  function maybeAutoStart(){
    // El tutorial se reproduce cada vez que se crea una liga NUEVA,
    // no solo la primera vez en la vida del navegador — se comprueba
    // la marca que deja empezarTemporada() en liga-manager.js justo
    // al crear la liga. Si el jugador pulsa "Saltar" o termina el
    // tutorial, la marca se borra y no vuelve a aparecer hasta que
    // cree otra liga nueva de verdad.
    //
    // IMPORTANTE: esta comprobación es PERMANENTE, nunca se detiene
    // del todo — antes se paraba tras la primera vez que se disparaba
    // (o a los 10 minutos), así que si el jugador abandonaba su liga y
    // creaba OTRA nueva más tarde en la misma sesión, ya no quedaba
    // ninguna comprobación activa esperando esa segunda oportunidad.
    // El coste de comprobar sessionStorage + un elemento cada 500ms es
    // insignificante, así que no hay problema en dejarlo para siempre.
    setInterval(()=>{
      if(overlayEl) return; // el tutorial ya está abierto ahora mismo, no interferir
      let noAuto = false;
      try{ noAuto = localStorage.getItem(NO_AUTO_KEY) === '1'; }catch(e){}
      if(noAuto) return; // el jugador marcó "no volver a mostrar" — nunca más, pase lo que pase
      let esLigaNueva = false;
      try{ esLigaNueva = sessionStorage.getItem('g2g_tut_lm_new_league') === '1'; }catch(e){}
      if(!esLigaNueva) return; // todavía no se ha creado ninguna liga nueva pendiente

      const pitchBox = document.getElementById('lmPitchBox');
      const ligaScreen = document.getElementById('ligaManagerScreen');
      const enLigaManagerVisible = ligaScreen && getComputedStyle(ligaScreen).display !== 'none';
      const pitchVisible = enLigaManagerVisible && pitchBox && pitchBox.offsetParent !== null;
      if(pitchVisible){
        try{ sessionStorage.removeItem('g2g_tut_lm_new_league'); }catch(e){}
        startTutorial();
      }
    }, 500);
  }

  maybeAutoStart();

})();
