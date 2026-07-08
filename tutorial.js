/* ═══════════════════════════════════════════════════════════════
   TUTORIAL INTERACTIVO — Goal2Goat
   Archivo totalmente independiente de game.js: no modifica ni una
   sola línea de él, solo se engancha a elementos que ya existen por
   su id/clase. Si algo de este archivo fallara, basta con quitar su
   <script> de index.html para que el juego quede exactamente igual
   que antes de añadirlo.

   Reescrito de forma más simple y robusta: el recuadro de texto
   SIEMPRE aparece centrado en la pantalla, fijo, con su propio
   scroll interno si hiciera falta — nunca intenta colocarse "cerca"
   del elemento señalado, así que no puede quedar cortado ni tapado
   por nada. El elemento señalado se resalta aparte, con un brillo
   dorado, sin que eso afecte a dónde está el recuadro de texto.
   ═══════════════════════════════════════════════════════════════ */
(function(){

  const SEEN_KEY = 'g2g_tutorial_seen';

  function isMobileLayout(){
    return window.innerWidth <= 1050;
  }

  function getSteps(){
    return [
      {
        selector: '.formation-tabs',
        title: '1 · Elige tu formación',
        text: 'Ofensiva, Equilibrada o Defensiva — la formación que elijas aquí queda fija todo el torneo, así que piénsala bien.'
      },
      {
        selector: '#rollBtn',
        extraSelector: '#quickBuildBtn',
        title: '2 · Arma tu plantilla',
        text: '<strong>SELECCIONAR JUGADOR</strong> te deja elegir uno a uno. <strong>EQUIPO RÁPIDO</strong> completa el resto por ti al instante.'
      },
      {
        selector: '#pitchBox',
        mockPreview: 'pitch',
        title: '3 · La posición ★ importa',
        text: 'Cada jugador tiene una posición natural marcada con ★. Colocado ahí rinde al máximo — fuera de sitio, rinde peor. Hemos colocado unos jugadores de ejemplo al azar para que lo veas — no forman parte de tu equipo real. <br><br>Truco: entre partido y partido del torneo puedes hacer <strong>cambios</strong> para rotar a quien necesite descanso.'
      },
      {
        selector: null,
        mockPreview: 'strategy',
        title: '4 · Elige estrategia antes de cada partido',
        text: 'Antes de cada partido del torneo podrás elegir una <strong>estrategia</strong> que contrarreste la del rival. Acertar la contra te da una ventaja real en el resultado. Para que veas cómo es, hemos cargado un rival de ejemplo al azar — los botones no funcionan ahora mismo, es solo para que lo veas.'
      },
      {
        selector: () => isMobileLayout() ? '#mobileTabBar' : '.app',
        title: '5 · Tu centro de mando',
        text: () => (isMobileLayout()
          ? 'En el móvil, estas pestañas de abajo cambian entre el campo, tu equipo, el rival y el historial — todo está siempre a un toque.'
          : 'En escritorio tienes tu plantilla, el campo y la información del rival visibles los tres a la vez, sin necesidad de cambiar de pantalla.')
          + ' <br><br>Si te registras, desde tu perfil podrás desbloquear <strong>mejoras y habilidades</strong> con GOAT Points. <br><br>Puedes volver a ver este tutorial cuando quieras desde <strong>CÓMO JUGAR</strong>.'
      },
    ];
  }

  let currentStep = 0;
  let overlayEl = null;
  let highlightEls = [];
  let transitioning = false; // evita que dobles clics rápidos solapen dos pasos

  // ───────── Vistas previas seguras (leen datos reales, nunca dejan
  // nada a medias) ─────────
  let activePreviewKind = null; // null | 'strategy' | 'pitch'
  let savedMobileTab, savedRivalHTML, savedHintHTML, savedStrategyHTML, savedRivalBoxDisplay;
  let savedPitchSlotsHTML = [];

  function setupRealPreview(kind){
    if(kind === 'pitch'){ setupPitchPreview(); return; }
    if(kind === 'strategy'){ setupStrategyPreview(); return; }
  }

  function restoreRealPreview(){
    if(activePreviewKind === 'strategy') restoreStrategyPreview();
    else if(activePreviewKind === 'pitch') restorePitchPreview();
    activePreviewKind = null;
  }

  function setupStrategyPreview(){
    if(typeof teams === 'undefined' || typeof STRATEGY_ORDER === 'undefined' || typeof STRATEGIES === 'undefined') return;

    const rivalBoxEl = document.getElementById('rivalBox');
    const rivalInfoEl = document.getElementById('rivalInfo');
    const rivalHintEl = document.getElementById('rivalHint');
    const strategyEl = document.getElementById('strategySelector');
    if(!rivalBoxEl || !rivalInfoEl || !strategyEl) return;

    activePreviewKind = 'strategy';
    savedRivalBoxDisplay = rivalBoxEl.style.display;
    savedRivalHTML = rivalInfoEl.innerHTML;
    savedHintHTML = rivalHintEl ? rivalHintEl.textContent : '';
    savedStrategyHTML = strategyEl.innerHTML;

    rivalBoxEl.style.display = 'block';

    const randomTeam = teams[Math.floor(Math.random()*teams.length)];
    const teamName = (typeof getTeamName==='function') ? getTeamName(randomTeam.name) : randomTeam.name;
    const flag = (typeof flagEmoji==='function') ? flagEmoji(randomTeam.name, 22) : '';

    rivalInfoEl.innerHTML = `
      <div style="text-align:center;padding:6px 0">
        ${flag}
        <div style="font-family:'Bebas Neue',Impact,sans-serif;font-size:15px;margin-top:4px">${teamName}</div>
      </div>`;
    if(rivalHintEl) rivalHintEl.textContent = 'Rival de ejemplo — no es tu próximo partido real.';

    const buttonsHTML = STRATEGY_ORDER.map(key=>{
      const s = STRATEGIES[key];
      return `<button class="strategy-btn">${s.name}</button>`;
    }).join('');
    strategyEl.innerHTML = `<div class="strategy-grid">${buttonsHTML}</div>`;

    if(isMobileLayout() && typeof switchMobileTab === 'function'){
      const activeTab = document.querySelector('.mob-tab.active');
      savedMobileTab = activeTab ? activeTab.dataset.tab : 'campo';
      switchMobileTab('rival');
    }

    [strategyEl, rivalInfoEl].forEach(el=>{ el.style.pointerEvents = 'none'; });
  }

  function restoreStrategyPreview(){
    const rivalBoxEl = document.getElementById('rivalBox');
    const rivalInfoEl = document.getElementById('rivalInfo');
    const rivalHintEl = document.getElementById('rivalHint');
    const strategyEl = document.getElementById('strategySelector');
    if(rivalBoxEl) rivalBoxEl.style.display = savedRivalBoxDisplay;
    if(rivalInfoEl){ rivalInfoEl.innerHTML = savedRivalHTML; rivalInfoEl.style.pointerEvents = ''; }
    if(rivalHintEl) rivalHintEl.textContent = savedHintHTML;
    if(strategyEl){ strategyEl.innerHTML = savedStrategyHTML; strategyEl.style.pointerEvents = ''; }

    if(savedMobileTab && isMobileLayout() && typeof switchMobileTab === 'function'){
      switchMobileTab(savedMobileTab);
    }
    savedMobileTab = null;
  }

  function setupPitchPreview(){
    if(typeof pitchEl === 'undefined' || typeof playersDB === 'undefined' || typeof renderSlotContent !== 'function') return;
    const slots = pitchEl.querySelectorAll('.position');
    if(!slots.length) return;

    activePreviewKind = 'pitch';
    savedPitchSlotsHTML = [];

    slots.forEach(slot=>{
      savedPitchSlotsHTML.push({slot, html: slot.innerHTML});
      const label = slot.dataset.label;
      const candidates = playersDB.filter(p => p.positions && p.positions[0] === label);
      const pool = candidates.length ? candidates : playersDB.filter(p => p.positions && p.positions.includes(label));
      if(!pool.length) return;
      const player = pool[Math.floor(Math.random()*pool.length)];
      const inPos = player.positions && player.positions[0] === label;
      const rating = player.overall || 70;
      const starHTML = inPos ? ' <span class="star">★</span>' : '';
      renderSlotContent(slot, player, label, rating, starHTML);
      slot.style.pointerEvents = 'none';
    });
  }

  function restorePitchPreview(){
    savedPitchSlotsHTML.forEach(({slot, html})=>{
      slot.innerHTML = html;
      slot.style.pointerEvents = '';
    });
    savedPitchSlotsHTML = [];
  }

  // ───────── Resaltado del elemento señalado ─────────
  function clearHighlights(){
    highlightEls.forEach(el => {
      el.classList.remove('g2g-tut-highlight');
      el.style.removeProperty('z-index');
      el.style.removeProperty('outline');
      el.style.removeProperty('outline-offset');
      el.style.removeProperty('box-shadow');
      el.style.removeProperty('border-radius');
      if(el.dataset.g2gForcedRelative){ el.style.position = ''; delete el.dataset.g2gForcedRelative; }
    });
    highlightEls = [];
  }

  function addHighlight(el){
    const pos = getComputedStyle(el).position;
    if(pos === 'static'){ el.style.position = 'relative'; el.dataset.g2gForcedRelative = '1'; }
    // Un selector por id (como #mobileTabBar) siempre gana en
    // especificidad a una clase, aunque las dos usen !important — por
    // eso la clase CSS sola no bastaba. Con setProperty(...,'important')
    // se aplica como estilo en línea con prioridad, que sí gana siempre.
    el.style.setProperty('z-index', '2147483646', 'important');
    el.style.setProperty('outline', '3px solid #f0c419', 'important');
    el.style.setProperty('outline-offset', '3px', 'important');
    el.style.setProperty('box-shadow', '0 0 0 6px rgba(240,196,25,.25), 0 0 24px rgba(240,196,25,.6)', 'important');
    el.style.setProperty('border-radius', '8px', 'important');
    el.classList.add('g2g-tut-highlight');
    highlightEls.push(el);
  }

  function resolveSelector(sel){
    return typeof sel === 'function' ? sel() : sel;
  }

  // ───────── Paso actual ─────────
  function positionBox(box, targetEl){
    const SAFE_TOP = 34;   // deja hueco a la hora/batería del móvil
    const SAFE_BOTTOM = 12;
    const viewportH = window.innerHeight;

    if(!targetEl){
      box.style.top = '';
      box.style.bottom = SAFE_BOTTOM + 'px';
      return;
    }
    const rect = targetEl.getBoundingClientRect();
    const targetMidY = rect.top + rect.height/2;

    if(targetMidY > viewportH/2){
      // El elemento está en la mitad de abajo: el recuadro va arriba del todo.
      box.style.top = SAFE_TOP + 'px';
      box.style.bottom = '';
    } else {
      // El elemento está en la mitad de arriba: el recuadro va abajo del todo.
      box.style.bottom = SAFE_BOTTOM + 'px';
      box.style.top = '';
    }
  }

  function renderStep(){
    restoreRealPreview();
    clearHighlights();

    const steps = getSteps();
    const step = steps[currentStep];
    const total = steps.length;

    if(step.mockPreview) setupRealPreview(step.mockPreview);

    const selector = resolveSelector(step.selector);
    let targetEl = selector ? document.querySelector(selector) : null;
    // Para el paso de estrategia (sin selector fijo), señalar el panel
    // real ya relleno con el rival de ejemplo.
    if(!targetEl && step.mockPreview === 'strategy'){
      targetEl = document.getElementById('rivalBox');
    }

    if(step.extraSelector){
      const extraEl = document.querySelector(step.extraSelector);
      if(extraEl) addHighlight(extraEl);
    }
    if(targetEl){
      addHighlight(targetEl);
      targetEl.scrollIntoView({behavior:'smooth', block:'center'});
    }

    const text = typeof step.text === 'function' ? step.text() : step.text;

    const box = overlayEl.querySelector('#g2gTutBox');
    box.innerHTML = `
      <div style="font-size:10px;color:var(--gold,#f0c419);letter-spacing:1px;margin-bottom:4px">PASO ${currentStep+1} DE ${total}</div>
      <div style="font-family:'Bebas Neue',Impact,sans-serif;letter-spacing:.5px;font-size:16px;color:#fff;margin-bottom:8px">${step.title}</div>
      <div style="font-size:13px;color:#e8e6e1;line-height:1.5;margin-bottom:16px">${text}</div>
      <div style="display:flex;gap:8px;align-items:center">
        <button id="g2gTutSkip" style="background:none;border:none;color:#8a9094;font-size:12px;cursor:pointer;text-decoration:underline;padding:6px 4px">Saltar</button>
        <div style="flex:1"></div>
        ${currentStep>0 ? `<button id="g2gTutPrev" style="background:none;border:1px solid #555;color:#ccc;border-radius:6px;padding:8px 14px;cursor:pointer;font-family:'Bebas Neue',Impact,sans-serif;letter-spacing:1px;font-size:12px">ATRÁS</button>` : ''}
        <button id="g2gTutNext" style="background:var(--gold,#f0c419);border:none;color:#000;border-radius:6px;padding:8px 16px;cursor:pointer;font-family:'Bebas Neue',Impact,sans-serif;letter-spacing:1px;font-size:12px">${currentStep<total-1?'SIGUIENTE':'ENTENDIDO'}</button>
      </div>
    `;

    box.querySelector('#g2gTutSkip').addEventListener('click', ()=>guarded(endTutorial));
    box.querySelector('#g2gTutNext').addEventListener('click', ()=>guarded(()=>{
      if(currentStep < total-1){ currentStep++; renderStep(); }
      else endTutorial();
    }));
    const prevBtn = box.querySelector('#g2gTutPrev');
    if(prevBtn) prevBtn.addEventListener('click', ()=>guarded(()=>{ currentStep--; renderStep(); }));

    setTimeout(()=>positionBox(box, targetEl), 300);
    transitioning = false;
  }

  // Evita que un doble toque rápido dispare dos transiciones de paso a
  // la vez (eso era lo que producía highlights y textos mezclados).
  function guarded(fn){
    if(transitioning) return;
    transitioning = true;
    fn();
  }

  function startTutorial(){
    currentStep = 0;
    transitioning = false;
    overlayEl = document.createElement('div');
    overlayEl.id = 'g2gTutOverlay';
    overlayEl.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:2147483647;pointer-events:none;isolation:isolate';
    overlayEl.innerHTML = `
      <div id="g2gTutBox" style="pointer-events:auto;position:fixed;left:50%;transform:translateX(-50%);z-index:2147483647;
        width:92%;max-width:380px;max-height:45vh;overflow-y:auto;
        background:#1a1d1f;border:2px solid var(--gold,#f0c419);border-radius:10px;
        padding:16px;box-shadow:0 8px 24px rgba(0,0,0,.5);box-sizing:border-box"></div>
    `;
    // Se añade a <body> (no a <html>) — así los elementos que se
    // resaltan (que también viven dentro de <body>) son hermanos
    // directos de esta capa y pueden comparar su z-index contra ella
    // con normalidad, en vez de quedar atrapados en un contexto aparte.
    document.body.appendChild(overlayEl);
    ensureStyles();
    renderStep();
  }

  function endTutorial(){
    clearHighlights();
    restoreRealPreview();
    if(overlayEl){ overlayEl.remove(); overlayEl = null; }
    try{ localStorage.setItem(SEEN_KEY, '1'); }catch(e){}
    if(isMobileLayout() && typeof switchMobileTab === 'function'){
      switchMobileTab('campo');
    }
  }

  function ensureStyles(){
    if(document.getElementById('g2gTutStylesTag')) return;
    const style = document.createElement('style');
    style.id = 'g2gTutStylesTag';
    style.textContent = `
      .g2g-tut-highlight{
        outline:3px solid var(--gold,#f0c419) !important;
        outline-offset:3px;
        border-radius:8px;
        box-shadow:0 0 0 6px rgba(240,196,25,.25), 0 0 24px rgba(240,196,25,.5) !important;
        z-index:2147483646 !important;
        transition:box-shadow .2s;
      }
    `;
    document.head.appendChild(style);
  }

  function bindReplayButton(){
    const btn = document.getElementById('replayTutorialBtn');
    if(btn && !btn.dataset.g2gBound){
      btn.dataset.g2gBound = '1';
      btn.addEventListener('click', startTutorial);
    }
  }
  document.addEventListener('DOMContentLoaded', bindReplayButton);
  bindReplayButton();

  function maybeAutoStart(){
    let seen = false;
    try{ seen = localStorage.getItem(SEEN_KEY) === '1'; }catch(e){}
    if(seen) return;

    const check = setInterval(()=>{
      const pitchBox = document.getElementById('pitchBox');
      const welcome = document.getElementById('welcomeOverlay');
      const welcomeHidden = !welcome || getComputedStyle(welcome).display === 'none';
      const pitchVisible = pitchBox && pitchBox.offsetParent !== null;
      if(welcomeHidden && pitchVisible){
        clearInterval(check);
        startTutorial();
      }
    }, 500);
    setTimeout(()=>clearInterval(check), 60000);
  }

  maybeAutoStart();

})();
