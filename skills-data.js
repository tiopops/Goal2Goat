/* ═══════════════════════════════════════════════════════════════
   SISTEMA DE HABILIDADES (GOAT Points) — catálogo, archivo separado
   de game.js (extraído tal cual, sin cambios de comportamiento). Se
   carga como un <script> normal justo después de game.js.

   Aquí solo vive el CATÁLOGO de habilidades (id, categoría, nombre,
   coste, icono, descripción). La lógica que comprueba si una
   habilidad está activa (window._skillCache.X) y aplica su efecto
   sigue en game.js, repartida por el motor de partido (fatiga, moral,
   penaltis, remontadas, médico, patrocinador, coleccionista...) —
   separarla también habría significado tocar el núcleo del juego.
   Añadir una habilidad nueva, o ajustar coste/descripción de las que
   hay, se hace entero dentro de este archivo.
   ═══════════════════════════════════════════════════════════════ */

const SKILL_DEFS = [
  // === TÁCTICA ===
  {
    id: 'estratega', get category(){ return window.t?window.t('skill.category.tactica'):'TÁCTICA'; },
    get name(){ return window.t?window.t('skill.estratega'):'ESTRATEGA'; }, cost: 40,
    icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 3"/></svg>',
    get tooltip(){ return window.t?window.t('skill.estratega_desc'):'Muestra la mejor contra-estrategia antes de cada partido.'; },
  },
  {
    id: 'capitan', get category(){ return window.t?window.t('skill.category.tactica'):'TÁCTICA'; },
    get name(){ return window.t?window.t('skill.capitan'):'CAPITÁN'; }, cost: 30,
    icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    get tooltip(){ return window.t?window.t('skill.capitan_desc'):'Si vas perdiendo en el descanso, tu ataque sube un 10% en la segunda parte.'; },
  },
  {
    id: 'remontada', get category(){ return window.t?window.t('skill.category.tactica'):'TÁCTICA'; },
    get name(){ return window.t?window.t('skill.remontada'):'REMONTADA'; }, cost: 60,
    icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M18 15l-6-6-6 6"/></svg>',
    get tooltip(){ return window.t?window.t('skill.remontada_desc'):'Si vas perdiendo de 2 o más goles, tu ataque sube un 35% el resto del partido.'; },
  },
  {
    id: 'penaltis', get category(){ return window.t?window.t('skill.category.tactica'):'TÁCTICA'; },
    get name(){ return window.t?window.t('skill.penaltis'):'ESPECIALISTA EN PENALTIS'; }, cost: 35,
    icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="3" x2="12" y2="21"/><line x1="3" y1="12" x2="21" y2="12"/></svg>',
    get tooltip(){ return window.t?window.t('skill.penaltis_desc'):'Aumenta la probabilidad de anotar en tandas de penaltis en un 15%.'; },
  },
  // === PLANTILLA ===
  {
    id: 'medico', get category(){ return window.t?window.t('skill.category.plantilla'):'PLANTILLA'; },
    get name(){ return window.t?window.t('skill.medico'):'MÉDICO DE ÉLITE'; }, cost: 50,
    icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
    get tooltip(){ return window.t?window.t('skill.medico_desc'):'Las lesiones leves se recuperan automáticamente al acabar el partido.'; },
  },
  {
    id: 'ojeador', get category(){ return window.t?window.t('skill.category.plantilla'):'PLANTILLA'; },
    get name(){ return window.t?window.t('skill.ojeador'):'OJEADOR'; }, cost: 25,
    icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>',
    get tooltip(){ return window.t?window.t('skill.ojeador_desc'):'Al barajar equipos siempre aparece al menos un jugador con 85 o más de rating.'; },
  },
  {
    id: 'cazatalentos', get category(){ return window.t?window.t('skill.category.plantilla'):'PLANTILLA'; },
    get name(){ return window.t?window.t('skill.cazatalentos'):'CAZATALENTOS'; }, cost: 30,
    icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    get tooltip(){ return window.t?window.t('skill.cazatalentos_desc'):'Los jugadores fuera de su posición natural solo pierden un 5% de rendimiento.'; },
  },
  {
    id: 'veterano', get category(){ return window.t?window.t('skill.category.plantilla'):'PLANTILLA'; },
    get name(){ return window.t?window.t('skill.veterano'):'VETERANO'; }, cost: 45,
    icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
    get tooltip(){ return window.t?window.t('skill.veterano_desc'):'Los jugadores con 85+ de rating no pueden recibir tarjeta roja directa.'; },
  },
  // === ECONOMÍA ===
  {
    id: 'coleccionista', get category(){ return window.t?window.t('skill.category.economia'):'ECONOMÍA'; },
    get name(){ return window.t?window.t('skill.coleccionista'):'COLECCIONISTA'; }, cost: 20,
    icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>',
    get tooltip(){ return window.t?window.t('skill.coleccionista_desc'):'Cada casilla buena del ticket (moneda o cabra) da 1 punto extra.'; },
  },
  {
    id: 'patrocinador', get category(){ return window.t?window.t('skill.category.economia'):'ECONOMÍA'; },
    get name(){ return window.t?window.t('skill.patrocinador'):'PATROCINADOR'; }, cost: 20,
    icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
    get tooltip(){ return window.t?window.t('skill.patrocinador_desc'):'Ganas 1 GOAT Point extra al clasificarte para cuartos de final.'; },
  },
];
