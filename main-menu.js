/* ============================================================
   GOAL2GOAT — Main Menu (selector de modo)
   ------------------------------------------------------------
   Módulo independiente y autocontenido. Controla únicamente la
   pantalla de bienvenida con los dos modos (Copa Leyendas / Liga
   Manager). No modifica ni depende de la lógica interna de
   game.js — solo usa window.showToast si ya existe (opcional).

   Mecanismo: se alterna la clase "menu-screen" en <body>.
   Toda la visibilidad (mostrar/ocultar menú, .app, mobileTabBar)
   se resuelve en CSS a partir de esa única clase (ver style.css,
   sección "MAIN MENU"), así no hay que tocar estilos inline ni
   duplicar lógica de layout responsive ya existente.
   ============================================================ */
(function(){

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
    }
  }catch(e){ /* sessionStorage no disponible (privado/bloqueado): se ve el menú, sin más */ }

  // Helper que debe usar cualquier flujo del propio juego que necesite
  // recargar la página para "empezar de nuevo" (fin de torneo, abandono,
  // multijugador, etc.) en lugar de llamar a location.reload() directo.
  window.G2G_reloadToGame = function(){
    try{ sessionStorage.setItem(RETURN_FLAG, '1'); }catch(e){}
    location.reload();
  };

  function enterCopaLeyendas(){
    if(!document.body.classList.contains('menu-screen')) return; // ya dentro del juego
    document.body.classList.remove('menu-screen');
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

  // Pestañas del perfil exclusivas de un modo de juego (aún no implementadas
  // para Liga Manager): mientras estemos en el menú principal, bloquean el
  // clic y avisan, en vez de abrir contenido de un modo que no se ha elegido.
  var RESTRICTED_PROFILE_TABS = ['profileTabStats','profileTabUpgrades','profileTabNotes','profileTabAchievements'];

  function notifyProfileTabLocked(){
    const msg = (window.t) ? window.t('menu.profile_locked') : 'Elige un modo de juego para ver esto';
    if(typeof window.showToast === 'function'){
      window.showToast(msg, 'toast-neutral');
    }
  }

  function guardProfileTabs(){
    RESTRICTED_PROFILE_TABS.forEach(function(id){
      const btn = document.getElementById(id);
      if(!btn) return;
      // Fase de captura: se ejecuta antes que el listener de game.js (fase de
      // burbuja), así podemos frenar el cambio de pestaña sin tocar game.js.
      btn.addEventListener('click', function(e){
        if(document.body.classList.contains('menu-screen')){
          e.stopImmediatePropagation();
          e.preventDefault();
          notifyProfileTabLocked();
        }
      }, true);
    });

    // Si el perfil se abre desde el menú principal, que siempre aterrice en
    // AJUSTES (la única pestaña disponible sin haber elegido modo todavía).
    const profileBtn = document.getElementById('profileBtn');
    if(profileBtn){
      profileBtn.addEventListener('click', function(){
        if(document.body.classList.contains('menu-screen') && typeof window.switchProfileTab === 'function'){
          window.switchProfileTab('user');
        }
      });
    }
  }

  function wireMenu(){
    const copaCard = document.getElementById('modeCardCopa');
    const copaBtn  = document.getElementById('modeCardCopaBtn');

    if(copaBtn){
      copaBtn.addEventListener('click', function(e){
        e.stopPropagation();
        enterCopaLeyendas();
      });
    }
    if(copaCard){
      copaCard.addEventListener('click', enterCopaLeyendas);
      copaCard.addEventListener('keydown', function(e){
        if(e.key === 'Enter' || e.key === ' '){
          e.preventDefault();
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
        notifyLigaManagerSoon();
      });
    });

    guardProfileTabs();
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
