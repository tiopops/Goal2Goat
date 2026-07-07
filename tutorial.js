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
        title: '3 · La posición ★ importa',
        text: 'Cada jugador tiene una posición natural marcada con ★. Colocado ahí rinde al máximo — fuera de sitio, rinde peor.'
      },
      {
        selector: null,
        title: '4 · Elige estrategia antes de cada partido',
        text: 'Más adelante, antes de cada partido del torneo, podrás elegir una <strong>estrategia</strong> que contrarreste la del rival. Acertar la contra te da una ventaja real en el resultado — no lo tienes delante ahora mismo, pero aparecerá en su momento.'
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

  function clearHighlights(){
    highlightEls.forEach(el => el.classList.remove('g2g-tut-highlight'));
    highlightEls = [];
  }

  function resolveSelector(sel){
    if(typeof sel === 'function') return sel();
    return sel;
  }

  function renderStep(){
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
  }

  function startTutorial(){
    currentStep = 0;
    overlayEl = document.createElement('div');
    overlayEl.id = 'g2gTutOverlay';
    overlayEl.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:90000;pointer-events:none';
    overlayEl.innerHTML = `
      <div id="g2gTutBox" style="pointer-events:auto;position:fixed;left:50%;bottom:20px;transform:translateX(-50%);
        width:92%;max-width:380px;background:#1a1d1f;border:2px solid var(--gold,#f0c419);border-radius:10px;
        padding:16px;box-shadow:0 8px 24px rgba(0,0,0,.5)"></div>
    `;
    document.body.appendChild(overlayEl);
    ensureStyles();
    renderStep();
  }

  function endTutorial(){
    clearHighlights();
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
        z-index:90001 !important;
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
