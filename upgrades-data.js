/* ═══════════════════════════════════════════════════════════════
   SISTEMA DE MEJORAS (GOAT Points) — catálogo, archivo separado de
   game.js (extraído tal cual, sin cambios de comportamiento). Se
   carga como un <script> normal justo después de game.js, compartiendo
   el mismo ámbito global — el resto del juego lo sigue viendo
   exactamente igual que antes de moverlo aquí.

   Aquí solo vive el CATÁLOGO (id, icono, nombre, coste, niveles de
   cada mejora — BANQUILLO, CAMBIOS, CONVOCADOS...). La lógica que
   aplica cada mejora (getMaxBench, getMaxSubs, getPlayersPerTeam,
   getMaxGiroCharges, getRecoveryBonus, los listeners de Firestore)
   sigue en game.js, ya que esas funciones se llaman desde el draft y
   el motor de partido — separarlas también habría significado tocar
   el núcleo del juego, con mucho más riesgo para poco beneficio.
   Añadir una mejora nueva, o ajustar coste/niveles de las que hay, se
   hace entero dentro de este archivo.
   ═══════════════════════════════════════════════════════════════ */

const UPGRADE_DEFS = [
  {
    id: 'bench', icon: '🪑',
    get name(){ return window.t?window.t('upgrade.bench'):'BANQUILLO'; },
    get desc(){ return window.t?window.t('upgrade.bench_desc'):'PLAZAS EN EL BANQUILLO'; },
    baseCost: 5, maxLevel: 5, baseValue: 2,
    tooltip: (lvl) => `${2+lvl} ${t("upgrade.bench_desc")}`
  },
  {
    id: 'subs', icon: '🔄',
    get name(){ return window.t?window.t('upgrade.subs'):'CAMBIOS'; },
    get desc(){ return window.t?window.t('upgrade.subs_desc'):'SUSTITUCIONES POR PARTIDO'; },
    baseCost: 5, maxLevel: 5, baseValue: 2,
    tooltip: (lvl) => `${2+lvl} ${t("upgrade.subs_desc")}`
  },
  {
    id: 'scout', icon: '🔭',
    get name(){ return window.t?window.t('upgrade.scout'):'CONVOCADOS'; },
    get desc(){ return window.t?window.t('upgrade.scout_desc'):'JUGADORES POR EQUIPO AL BARAJAR'; },
    baseCost: 5, maxLevel: 5, baseValue: 5,
    tooltip: (lvl) => `${5+lvl} ${t("upgrade.scout_desc")}`
  },
  {
    id: 'recovery', icon: '⚡',
    get name(){ return window.t?window.t('upgrade.recovery'):'RECUPERACIÓN'; },
    get desc(){ return window.t?window.t('upgrade.recovery_desc'):'REDUCE LA FATIGA ENTRE PARTIDOS'; },
    baseCost: 5, maxLevel: 5, baseValue: 0,
    tooltip: (lvl) => `${lvl*10}% ${t("upgrade.recovery_desc")}`
  },
  {
    id: 'chain', icon: '🔗',
    get name(){ return window.t?window.t('upgrade.chain'):'RUN ENCADENADA'; },
    get desc(){ return window.t?window.t('upgrade.chain_desc'):'JUGADORES QUE CONSERVAS AL EMPEZAR UN NUEVO TORNEO'; },
    baseCost: 5, maxLevel: 5, baseValue: 1,
    tooltip: (lvl) => {
      const n=1+lvl;
      const word=window.t?window.t(n===1?'upgrade.chain_unit_singular':'upgrade.chain_unit_plural'):(n===1?'jugador conservado':'jugadores conservados');
      return `${n} ${word}`;
    }
  },
  {
    id: 'giro', icon: '🔄',
    get name(){ return window.t?window.t('upgrade.giro'):'GIRO TÁCTICO'; },
    get desc(){ return window.t?window.t('upgrade.giro_desc'):'USOS DE GIRO TÁCTICO POR TORNEO'; },
    baseCost: 5, maxLevel: 5, baseValue: 1,
    tooltip: (lvl) => `${1+lvl} ${t("upgrade.giro_desc")}`
  },
  {
    id: 'tactical_adjust', icon: '⚖️',
    get name(){ return window.t?window.t('upgrade.tactical_adjust'):'AJUSTE TÁCTICO'; },
    get desc(){ return window.t?window.t('upgrade.tactical_adjust_desc'):'AJUSTES TÁCTICOS POR TORNEO'; },
    baseCost: 5, maxLevel: 5, baseValue: 5,
    tooltip: (lvl) => `${5+lvl} ${t("upgrade.tactical_adjust_desc")}`
  },
];

// Coste acumulado para subir al nivel N (0-indexed: coste para ir de N-1 a N)
function upgradeLevelCost(def, toLevel){
  // nivel 1 = baseCost, nivel 2 = baseCost*2, nivel 3 = baseCost*4...
  return def.baseCost * Math.pow(2, toLevel - 1);
}

// Cargar upgrades de Firestore
async function loadUpgrades(){
  const user = window._fbAuth && window._fbAuth.currentUser;
  if(!user) return {};
  try{
    const snap = await window._fbDb.collection('users').doc(user.uid).get();
    return (snap.exists && snap.data().upgrades) || {};
  }catch(e){ return {}; }
}

// Guardar upgrades en Firestore
async function saveUpgrades(upgrades){
  const user = window._fbAuth && window._fbAuth.currentUser;
  if(!user) return;
  await window._fbDb.collection('users').doc(user.uid).set({upgrades}, {merge:true});
}

// Iconos SVG para mejoras (sin emoji)
const UPGRADE_ICONS = {
  bench:    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 10v4M20 10v4M2 14h20M6 14v4M18 14v4"/></svg>',
  subs:     '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M7 16l-4-4 4-4"/><path d="M17 8l4 4-4 4"/><line x1="3" y1="12" x2="21" y2="12"/></svg>',
  scout:    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/><path d="M11 8v6M8 11h6"/></svg>',
  recovery: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
  chain:    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="2" y="8" width="8" height="8" rx="4"/><rect x="14" y="8" width="8" height="8" rx="4"/><line x1="9" y1="12" x2="15" y2="12"/></svg>',
  giro:     '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></svg>',
  tactical_adjust: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 3v18"/><path d="M5 7l-3 6a3 3 0 0 0 6 0l-3-6z"/><path d="M19 7l-3 6a3 3 0 0 0 6 0l-3-6z"/><path d="M5 7h14"/></svg>',
};
