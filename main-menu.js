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
