/* ═══════════════════════════════════════════════════════════════
   TUTORIAL INTERACTIVO — Goal2Goat
   Archivo totalmente independiente de game.js: no modifica ni una
   sola línea de él, solo se engancha a elementos que ya existen por
   su id/clase. Si algo de este archivo fallara, basta con quitar su
   <script> de index.html para que el juego quede exactamente igual
   que antes de añadirlo.
   ═══════════════════════════════════════════════════════════════ */
(function(){

  const SEEN_KEY = 'g2g_tutorial_seen';

  function isMobileLayout(){
    return window.innerWidth <= 1050;
  }

  // Cada paso señala un elemento real de la interfaz de draft. El
  // paso de estrategia no señala nada (ese paso llega más tarde, tras
  // completar la plantilla), así que se muestra solo como texto.
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
        text: 'Cada jugador tiene una posición natural marcada con ★. Colocado ahí rinde al máximo — fuera de sitio, rinde peor. Hemos colocado unos jugadores de ejemplo al azar para que lo veas — no forman parte de tu equipo real.'
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
        text: () => isMobileLayout()
          ? 'En el móvil, estas pestañas de abajo cambian entre el campo, tu equipo, el rival y el historial — todo está siempre a un toque.'
          : 'En escritorio tienes tu plantilla, el campo y la información del rival visibles los tres a la vez, sin necesidad de cambiar de pantalla.'
      },
    ];
  }

  let currentStep = 0;
  let overlayEl = null;
  let highlightEls = [];

  // Estado guardado mientras alguna vista previa "real" está activa,
  // para poder devolverlo todo exactamente a como estaba al salir del paso.
  let activePreviewKind = null; // null | 'strategy' | 'pitch'
  let savedNextOpponent, savedSelectedStrategy, savedMobileTab, savedRivalHTML, savedHintHTML, savedStrategyHTML;
  let savedPitchSlotsHTML = [];

  function setupRealPreview(kind){
    if(kind === 'pitch'){ setupPitchPreview(); return; }
    if(kind !== 'strategy') return;
    if(typeof nextOpponent === 'undefined' || typeof teams === 'undefined' || typeof renderRivalBox !== 'function') return;
    if(nextOpponent) return; // ya hay un rival real cargado (no debería pasar en el draft, pero por seguridad no tocamos nada)

    activePreviewKind = 'strategy';
    savedNextOpponent = nextOpponent;
    savedSelectedStrategy = (typeof selectedMatchStrategy !== 'undefined') ? selectedMatchStrategy : null;

    const rivalInfoEl = document.getElementById('rivalInfo');
    const rivalHintEl = document.getElementById('rivalHint');
    const strategyEl = document.getElementById('strategySelector');
    savedRivalHTML = rivalInfoEl ? rivalInfoEl.innerHTML : '';
    savedHintHTML = rivalHintEl ? rivalHintEl.textContent : '';
    savedStrategyHTML = strategyEl ? strategyEl.innerHTML : '';

    // Cargar un rival de ejemplo, al azar, usando el mismo mecanismo que
    // usa el propio juego — solo lectura de datos ya existentes.
    nextOpponent = teams[Math.floor(Math.random()*teams.length)];
    renderRivalBox();

    // En móvil, cambiar a la pestaña RIVAL para que se vea de verdad.
    if(window.innerWidth <= 1050 && typeof switchMobileTab === 'function'){
      const activeTab = document.querySelector('.mob-tab.active');
      savedMobileTab = activeTab ? activeTab.dataset.tab : 'campo';
      switchMobileTab('rival');
    }

    // Bloquear los clics reales sobre la interfaz de ejemplo — es solo
    // para mirar, no para elegir una estrategia de verdad por accidente.
    const strategyElNow = document.getElementById('strategySelector');
    const rivalInfoElNow = document.getElementById('rivalInfo');
    [strategyElNow, rivalInfoElNow].forEach(el=>{
      if(el){ el.style.pointerEvents = 'none'; el.dataset.g2gTutBlocked = '1'; }
    });
  }

  function restoreRealPreview(){
    if(activePreviewKind === 'strategy') restoreStrategyPreview();
    else if(activePreviewKind === 'pitch') restorePitchPreview();
    activePreviewKind = null;
  }

  function restoreStrategyPreview(){
    nextOpponent = savedNextOpponent;
    if(typeof selectedMatchStrategy !== 'undefined') selectedMatchStrategy = savedSelectedStrategy;

    const rivalInfoEl = document.getElementById('rivalInfo');
    const rivalHintEl = document.getElementById('rivalHint');
    const strategyEl = document.getElementById('strategySelector');
    if(rivalInfoEl){ rivalInfoEl.innerHTML = savedRivalHTML; rivalInfoEl.style.pointerEvents = ''; delete rivalInfoEl.dataset.g2gTutBlocked; }
    if(rivalHintEl) rivalHintEl.textContent = savedHintHTML;
    if(strategyEl){ strategyEl.innerHTML = savedStrategyHTML; strategyEl.style.pointerEvents = ''; delete strategyEl.dataset.g2gTutBlocked; }

    if(savedMobileTab && window.innerWidth <= 1050 && typeof switchMobileTab === 'function'){
      switchMobileTab(savedMobileTab);
    }
    savedMobileTab = null;
  }

  // Coloca jugadores reales al azar (elegidos por su posición natural,
  // para que se vea la ★) usando renderSlotContent — la misma función
  // que usa el juego para pintar un jugador en el campo. NO toca
  // usedPlayers, draftedCount ni phase: es puramente visual, así que
  // basta con volver a pintar el campo vacío para deshacerlo del todo.
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
      slot.dataset.g2gTutBlocked = '1';
    });
  }

  function restorePitchPreview(){
    savedPitchSlotsHTML.forEach(({slot, html})=>{
      slot.innerHTML = html;
      slot.style.pointerEvents = '';
      delete slot.dataset.g2gTutBlocked;
    });
    savedPitchSlotsHTML = [];
  }

  function clearHighlights(){
    highlightEls.forEach(el => el.classList.remove('g2g-tut-highlight'));
    highlightEls = [];
  }

  function resolveSelector(sel){
    if(typeof sel === 'function') return sel();
    return sel;
  }

  // Coloca el recuadro de texto evitando taparle el elemento señalado:
  // lo pone debajo si hay hueco, si no arriba, y si tampoco cabe, lo dej
  // centrado pero SIN solaparse con el propio elemento (lo desplaza).
  function positionBox(box, targetEl){
    box.style.left = '50%';
    box.style.right = '';
    box.style.transform = 'translateX(-50%)';

    const viewportH = window.innerHeight;
    const margin = 14;
    const boxHeight = box.offsetHeight || 220;
    // Deja hueco para la barra de estado del móvil (hora, batería...) y
    // para no pegarse del todo al borde inferior de la pantalla.
    const SAFE_TOP = 30;
    const SAFE_BOTTOM = 10;

    if(!targetEl){
      box.style.top = '';
      box.style.bottom = SAFE_BOTTOM + 'px';
      return;
    }

    const rect = targetEl.getBoundingClientRect();
    const spaceBelow = viewportH - rect.bottom;
    const spaceAbove = rect.top;

    let topPx = null, bottomPx = null;

    if(spaceBelow >= boxHeight + margin){
      topPx = rect.bottom + margin;
    } else if(spaceAbove >= boxHeight + margin){
      bottomPx = viewportH - rect.top + margin;
    } else if(spaceBelow >= spaceAbove){
      bottomPx = SAFE_BOTTOM;
    } else {
      topPx = SAFE_TOP;
    }

    // Nunca dejar que el recuadro invada la barra de estado arriba, ni
    // que se salga por abajo de la pantalla.
    if(topPx !== null){
      if(topPx < SAFE_TOP) topPx = SAFE_TOP;
      if(topPx + boxHeight > viewportH - SAFE_BOTTOM) topPx = Math.max(SAFE_TOP, viewportH - SAFE_BOTTOM - boxHeight);
      box.style.top = topPx + 'px';
      box.style.bottom = '';
    } else {
      if(bottomPx < SAFE_BOTTOM) bottomPx = SAFE_BOTTOM;
      if(bottomPx + boxHeight > viewportH - SAFE_TOP) bottomPx = Math.max(SAFE_BOTTOM, viewportH - SAFE_TOP - boxHeight);
      box.style.bottom = bottomPx + 'px';
      box.style.top = '';
    }
  }

  function renderStep(){
    restoreRealPreview();
    clearHighlights();
    const steps = getSteps();
    const step = steps[currentStep];
    const total = steps.length;

    const selector = resolveSelector(step.selector);
    let targetEl = selector ? document.querySelector(selector) : null;
    if(step.extraSelector){
      const extraEl = document.querySelector(step.extraSelector);
      if(extraEl){ extraEl.classList.add('g2g-tut-highlight'); highlightEls.push(extraEl); }
    }
    if(targetEl){
      targetEl.classList.add('g2g-tut-highlight');
      highlightEls.push(targetEl);
      targetEl.scrollIntoView({behavior:'smooth', block:'center'});
    }

    if(step.mockPreview){
      setupRealPreview(step.mockPreview);
      // Tras cargar el rival de ejemplo, señalar el panel real relleno
      if(!targetEl){
        const rivalPanelTarget = document.getElementById('rivalInfo');
        if(rivalPanelTarget){
          targetEl = rivalPanelTarget;
          targetEl.classList.add('g2g-tut-highlight');
          highlightEls.push(targetEl);
          setTimeout(()=>targetEl.scrollIntoView({behavior:'smooth', block:'center'}), 60);
        }
      }
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

    box.querySelector('#g2gTutSkip').addEventListener('click', endTutorial);
    box.querySelector('#g2gTutNext').addEventListener('click', ()=>{
      if(currentStep < total-1){ currentStep++; renderStep(); }
      else endTutorial();
    });
    const prevBtn = box.querySelector('#g2gTutPrev');
    if(prevBtn) prevBtn.addEventListener('click', ()=>{ currentStep--; renderStep(); });

    // Esperar a que el scroll (animado) se asiente antes de medir dónde
    // colocar el recuadro, para no taparle el elemento que señala.
    setTimeout(()=>positionBox(box, targetEl), 350);
  }

  function startTutorial(){
    currentStep = 0;
    overlayEl = document.createElement('div');
    overlayEl.id = 'g2gTutOverlay';
    overlayEl.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:999990;pointer-events:none';
    overlayEl.innerHTML = `
      <div id="g2gTutBox" style="pointer-events:auto;position:fixed;left:50%;bottom:20px;transform:translateX(-50%);
        width:92%;max-width:380px;max-height:80vh;overflow-y:auto;background:#1a1d1f;border:2px solid var(--gold,#f0c419);border-radius:10px;
        padding:16px;box-shadow:0 8px 24px rgba(0,0,0,.5);z-index:999999"></div>
    `;
    document.body.appendChild(overlayEl);
    ensureStyles();
    renderStep();
  }

  function endTutorial(){
    clearHighlights();
    restoreRealPreview();
    if(overlayEl){ overlayEl.remove(); overlayEl = null; }
    try{ localStorage.setItem(SEEN_KEY, '1'); }catch(e){}
  }

  function ensureStyles(){
    if(document.getElementById('g2gTutStylesTag')) return;
    const style = document.createElement('style');
    style.id = 'g2gTutStylesTag';
    style.textContent = `
      .g2g-tut-highlight{
        position:relative;
        outline:3px solid var(--gold,#f0c419) !important;
        outline-offset:3px;
        border-radius:8px;
        box-shadow:0 0 0 6px rgba(240,196,25,.25), 0 0 24px rgba(240,196,25,.5) !important;
        z-index:999995 !important;
        transition:box-shadow .2s;
      }
    `;
    document.head.appendChild(style);
  }

  // Botón para volver a verlo cuando quieras, desde CÓMO JUGAR
  document.addEventListener('DOMContentLoaded', bindReplayButton);
  // Por si el script se carga después de que DOMContentLoaded ya disparara
  // (aquí se carga vía document.write, como el resto del juego)
  bindReplayButton();
  function bindReplayButton(){
    const btn = document.getElementById('replayTutorialBtn');
    if(btn && !btn.dataset.g2gBound){
      btn.dataset.g2gBound = '1';
      btn.addEventListener('click', startTutorial);
    }
  }

  // Mostrarlo automáticamente la primera vez, en cuanto la pantalla de
  // draft esté realmente visible (evita solaparse con la ventana de
  // bienvenida, que se cierra manualmente).
  function maybeAutoStart(){
    let seen = false;
    try{ seen = localStorage.getItem(SEEN_KEY) === '1'; }catch(e){}
    if(seen) return;

    const check = setInterval(()=>{
      const pitchBox = document.getElementById('pitchBox');
      const welcome = document.getElementById('welcomeOverlay');
      const welcomeHidden = !welcome || welcome.style.display === 'none' || getComputedStyle(welcome).display === 'none';
      const pitchVisible = pitchBox && pitchBox.offsetParent !== null;
      if(welcomeHidden && pitchVisible){
        clearInterval(check);
        startTutorial();
      }
    }, 500);
    // No esperar indefinidamente si algo no encaja
    setTimeout(()=>clearInterval(check), 60000);
  }

  maybeAutoStart();
  bindReplayButton();

})();
