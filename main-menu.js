/* ============================================================
   GOAL2GOAT — Main Menu (selector de modo)
   ------------------------------------------------------------
   Módulo independiente y autocontenido. Controla únicamente la
   pantalla de bienvenida con los dos modos (Copa Leyendas / Liga
   Manager). No modifica ni depende de la lógica interna de
   game.js — solo usa window.showToast si ya existe (opcional).

   Mecanismo: se alterna la clase "menu-screen" en <body>.
   Toda la visibilidad (mostrar/ocultar menú, .app, mobileTabBar,
   pestañas del perfil exclusivas de un modo) se resuelve en CSS
   a partir de esa única clase (ver style.css, sección "MAIN
   MENU"), así no hay que tocar estilos inline ni duplicar lógica
   de layout responsive ya existente.
   ============================================================ */
(function(){

  // El navegador no debe "recordar" el scroll de la carga anterior:
  // queremos decidir nosotros mismos dónde aparece el scroll en cada
  // caso (ver resetGameScroll más abajo).
  try{ if('scrollRestoration' in history) history.scrollRestoration = 'manual'; }catch(e){}

  /* ------------------------------------------------------------
     Volver directamente a Copa Leyendas tras una recarga interna
     ------------------------------------------------------------
     El propio juego usa location.reload() para "empezar de nuevo"
     al terminar/abandonar un torneo o una partida multijugador.
     Antes de esta marca, cualquier reload devolvía al menú
     principal (comportamiento por defecto de body.menu-screen).

     Ahora: si el reload lo dispara el propio juego (a través de
     window.G2G_reloadToGame), dejamos una marca en sessionStorage
     justo antes de recargar. Al volver a cargar la página, si esa
     marca está presente, saltamos el menú principal y entramos
     directo en Copa Leyendas — y borramos la marca al usarla.

     Si el reload es un F5 manual, una pestaña nueva (sessionStorage
     no viaja entre pestañas) o el clic en el logo del header (que
     sigue usando location.reload() directo, sin pasar por el
     helper), la marca no existe y se muestra el menú principal,
     tal como se pidió.
     ------------------------------------------------------------ */
  var RETURN_FLAG = 'g2g_return_to_game';

  try{
    if(sessionStorage.getItem(RETURN_FLAG) === '1'){
      sessionStorage.removeItem(RETURN_FLAG);
      document.body.classList.remove('menu-screen');
      resetGameScroll();
    }
  }catch(e){ /* sessionStorage no disponible (privado/bloqueado): se ve el menú, sin más */ }

  // Helper que debe usar cualquier flujo del propio juego que necesite
  // recargar la página para "empezar de nuevo" (fin de torneo, abandono,
  // multijugador, etc.) en lugar de llamar a location.reload() directo.
  window.G2G_reloadToGame = function(){
    try{ sessionStorage.setItem(RETURN_FLAG, '1'); }catch(e){}
    location.reload();
  };

  // Tanto al entrar en Copa Leyendas desde el menú como al volver tras una
  // recarga interna, la página debe aparecer con el scroll arriba del todo
  // (documento y cualquier panel con scroll propio), nunca a mitad de página.
  function resetGameScroll(){
    window.scrollTo(0,0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    ['.left-panel','.center-panel','.right-panel'].forEach(function(sel){
      const el = document.querySelector(sel);
      if(el) el.scrollTop = 0;
    });
  }

  function playClickSound(){
    if(typeof window.playSound === 'function') window.playSound('select');
  }

  function enterCopaLeyendas(){
    if(!document.body.classList.contains('menu-screen')) return; // ya dentro del juego
    document.body.classList.remove('menu-screen');
    resetGameScroll();
    // Por si algún componente (gráficos, canvas, etc.) necesita recalcular
    // tamaños ahora que .app pasa a ser visible y ocupa espacio real.
    window.dispatchEvent(new Event('resize'));
  }

  function notifyLigaManagerSoon(){
    const msg = (window.t) ? window.t('menu.liga_soon') : 'Disponible muy pronto';
    if(typeof window.showToast === 'function'){
      window.showToast(msg, 'toast-neutral');
    }
  }

  /* ------------------------------------------------------------
     Liga Manager — acceso restringido mientras está en construcción
     ------------------------------------------------------------
     window.LIGA_MANAGER_UNLOCKED lo fija game.js (dentro de
     onAuthStateChanged) en cuanto sabe si el usuario logueado es
     la cuenta autorizada. Aquí solo reaccionamos a ese valor: no
     tomamos ninguna decisión de "quién puede entrar", eso vive
     exclusivamente en game.js — este módulo solo pinta el resultado.
     ------------------------------------------------------------ */
  function enterLigaManager(){
    if(!window.LIGA_MANAGER_UNLOCKED) return; // por si acaso, nunca debería llamarse sin acceso
    document.body.classList.remove('menu-screen');
    document.body.classList.add('liga-manager-screen');
    resetGameScroll();
    if(window.G2G_LigaManager && typeof window.G2G_LigaManager.init==='function'){
      window.G2G_LigaManager.init();
    }
  }

  function applyLigaManagerAccess(unlocked){
    const card  = document.getElementById('modeCardLiga');
    const btn   = document.getElementById('modeCardLigaBtn');
    const badge = card ? card.querySelector('.mode-card-badge') : null;
    if(!card || !btn) return;

    card.classList.toggle('mode-card-liga-unlocked', !!unlocked);

    if(unlocked){
      btn.classList.remove('mode-card-btn-disabled');
      btn.classList.add('mode-card-btn-gold');
      btn.innerHTML = '<span data-i18n="menu.copa_play">JUGAR AHORA</span> <i class="ph ph-bold ph-arrow-right"></i>';
      if(badge) badge.style.display='none';
    }else{
      btn.classList.add('mode-card-btn-disabled');
      btn.classList.remove('mode-card-btn-gold');
      btn.innerHTML = '<span data-i18n="menu.liga_badge">PRÓXIMAMENTE</span>';
      if(badge) badge.setAttribute('data-i18n','menu.liga_badge');
    }
    if(typeof window.applyTranslations === 'function') window.applyTranslations();
  }
  window.G2G_applyLigaManagerAccess = applyLigaManagerAccess;

  // Si el perfil se abre desde el menú principal, que siempre aterrice en
  // AJUSTES: las otras pestañas (Estadísticas, Mejoras, Habilidades, Logros)
  // son de Copa Leyendas y se ocultan por CSS mientras no se elija un modo.
  function wireProfileDefaultTab(){
    const profileBtn = document.getElementById('profileBtn');
    if(!profileBtn) return;
    profileBtn.addEventListener('click', function(){
      const enMenu = document.body.classList.contains('menu-screen');
      const enLigaManager = document.body.classList.contains('liga-manager-screen');
      if((enMenu || enLigaManager) && typeof window.switchProfileTab === 'function'){
        window.switchProfileTab('user');
      }
    });
  }

  function wireAbandonarLigaBtn(){
    const btn = document.getElementById('profileAbandonarLigaBtn');
    if(!btn) return;
    btn.addEventListener('click', function(){
      const overlay = document.getElementById('profileOverlay');
      if(overlay) overlay.style.display = 'none';
      if(window.G2G_LigaManager && typeof window.G2G_LigaManager.abandonarLiga === 'function'){
        window.G2G_LigaManager.abandonarLiga();
      }
    });
  }

  function wireMenu(){
    const copaCard = document.getElementById('modeCardCopa');
    const copaBtn  = document.getElementById('modeCardCopaBtn');

    if(copaBtn){
      copaBtn.addEventListener('click', function(e){
        e.stopPropagation();
        playClickSound();
        enterCopaLeyendas();
      });
    }
    if(copaCard){
      copaCard.addEventListener('click', function(){
        playClickSound();
        enterCopaLeyendas();
      });
      copaCard.addEventListener('keydown', function(e){
        if(e.key === 'Enter' || e.key === ' '){
          e.preventDefault();
          playClickSound();
          enterCopaLeyendas();
        }
      });
    }

    const ligaCard = document.getElementById('modeCardLiga');
    const ligaBtn  = document.getElementById('modeCardLigaBtn');
    [ligaCard, ligaBtn].forEach(function(el){
      if(!el) return;
      el.addEventListener('click', function(e){
        e.stopPropagation();
        playClickSound();
        if(window.LIGA_MANAGER_UNLOCKED){
          enterLigaManager();
        }else{
          notifyLigaManagerSoon();
        }
      });
    });

    // Por si el acceso ya se resolvió (game.js) antes de que este script
    // terminara de wirear el menú, aplicamos el estado actual ya conocido.
    if(typeof window.LIGA_MANAGER_UNLOCKED === 'boolean'){
      applyLigaManagerAccess(window.LIGA_MANAGER_UNLOCKED);
    }

    wireProfileDefaultTab();
    wireAbandonarLigaBtn();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', wireMenu);
  }else{
    wireMenu();
  }

  // Expuesto por si en el futuro algún otro módulo necesita volver
  // a mostrar el menú principal (p.ej. un botón "Salir al menú").
  window.G2G_MainMenu = {
    enterCopaLeyendas: enterCopaLeyendas
  };

})();
