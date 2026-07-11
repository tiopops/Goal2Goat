/* ═══════════════════════════════════════════════════════════════
   SISTEMA DE LOGROS — catálogo, archivo separado de game.js
   (extraído tal cual, sin cambios de comportamiento). Se carga como
   un <script> normal justo después de game.js.

   Aquí solo vive el CATÁLOGO de logros (id, dificultad, puntos,
   icono, nombre, descripción). La lógica que comprueba si se acaba
   de cumplir un logro sigue en game.js, enganchada a los eventos
   reales de partido/draft/tickets. Añadir un logro nuevo, o ajustar
   su descripción/recompensa, se hace entero dentro de este archivo.
   ═══════════════════════════════════════════════════════════════ */

const ACHIEVEMENT_DEFS = [
  // BÁSICOS — 1 PT
  {id:'first_match',      tier:'básico',  pts:1,  icon:'ph-megaphone',        name:'PITIDO INICIAL',       desc:'Completa tu primer partido'},
  {id:'first_win',        tier:'básico',  pts:1,  icon:'ph-trophy',         name:'PRIMERA VICTORIA',     desc:'Gana tu primer partido'},
  {id:'first_ticket',     tier:'básico',  pts:1,  icon:'ph-ticket',         name:'PRIMER RASCA',         desc:'Gana puntos en tu primer ticket'},
  {id:'clean_sheet',      tier:'básico',  pts:1,  icon:'ph-shield-check',   name:'PORTERÍA A CERO',      desc:'Gana un partido sin encajar ningún gol'},
  {id:'no_subs_win',      tier:'básico',  pts:1,  icon:'ph-swap',          name:'SIN ROTACIONES',       desc:'Gana un partido sin usar ningún cambio'},
  {id:'first_groups',     tier:'básico',  pts:1,  icon:'ph-flag', name:'FASE SUPERADA',        desc:'Clasifícate para octavos de final'},
  {id:'score_5',          tier:'básico',  pts:1,  icon:'ph-soccer-ball',    name:'GOLEADA',              desc:'Marca 5 goles o más en un partido'},
  {id:'win_comeback',     tier:'básico',  pts:1,  icon:'ph-arrow-bend-up-left','name':'VUELTA AL PARTIDO',  desc:'Gana un partido después de ir perdiendo'},
  {id:'use_skill',        tier:'básico',  pts:1,  icon:'ph-lightning',      name:'PRIMER PODER',         desc:'Activa tu primera habilidad'},
  {id:'full_bench',       tier:'básico',  pts:1,  icon:'ph-users',          name:'PLANTILLA COMPLETA',   desc:'Llega a un partido con el banquillo lleno'},
  {id:'hattrick_player',  tier:'básico',  pts:1,  icon:'ph-number-three',            name:'HAT-TRICK',            desc:'Un mismo jugador marca 3 goles en un partido'},
  {id:'win_no_concede2',  tier:'básico',  pts:1,  icon:'ph-wall',           name:'DOBLE CERROJO',        desc:'No encajes goles en 2 partidos consecutivos'},
  {id:'all_stars',        tier:'básico',  pts:1,  icon:'ph-star',           name:'ONCE PERFECTO',        desc:'Coloca los 11 titulares en su posición natural ★'},
  {id:'first_pen_win',    tier:'básico',  pts:1,  icon:'ph-crosshair',      name:'NERVIOS DE ACERO',     desc:'Gana una tanda de penaltis'},
  {id:'upgrade_once',     tier:'básico',  pts:1,  icon:'ph-arrow-circle-up','name':'PRIMERA MEJORA',     desc:'Sube por primera vez cualquier mejora'},
  {id:'mp_first_friend',  tier:'básico',  pts:1,  icon:'ph-user-plus',      name:'PRIMER RIVAL',         desc:'Añade a tu primer amigo'},
  {id:'mp_first_duel',    tier:'básico',  pts:1,  icon:'ph-swords',         name:'CARA A CARA',          desc:'Completa tu primer duelo multijugador'},
  {id:'mp_first_win',     tier:'básico',  pts:1,  icon:'ph-handshake',      name:'GLORIA COMPARTIDA',    desc:'Gana tu primer duelo multijugador'},
  {id:'mp_pen_win',       tier:'básico',  pts:1,  icon:'ph-target',         name:'TANDA DECISIVA',       desc:'Gana una tanda de penaltis en multijugador'},
  {id:'mp_custom_crest',  tier:'básico',  pts:1,  icon:'ph-image',          name:'IDENTIDAD PROPIA',     desc:'Sube tu propia imagen como escudo'},

  // INTERMEDIOS — 2 PTS
  {id:'groups_unbeaten',  tier:'intermedio', pts:2, icon:'ph-shield',        name:'INVICTO EN GRUPOS',   desc:'Pasa la fase de grupos sin perder ningún partido'},
  {id:'groups_no_concede',tier:'intermedio', pts:2, icon:'ph-shield-star', name:'MURALLA EN GRUPOS',   desc:'No encajes ningún gol en toda la fase de grupos'},
  {id:'quarters',         tier:'intermedio', pts:2, icon:'ph-medal',         name:'CUARTOS',              desc:'Clasifícate para cuartos de final'},
  {id:'semis',            tier:'intermedio', pts:2, icon:'ph-medal', name:'SEMIFINAL',              desc:'Llega a semifinales'},
  {id:'comeback_2',       tier:'intermedio', pts:2, icon:'ph-arrow-fat-lines-up',  name:'REMONTADA ÉPICA',     desc:'Gana un partido después de ir perdiendo de 2 goles'},
  {id:'perfect_tactic',   tier:'intermedio', pts:2, icon:'ph-graph',      name:'TÁCTICA MAESTRA',     desc:'Usa la contra-estrategia perfecta y gana el partido'},
  {id:'no_injuries_semis',tier:'intermedio', pts:2, icon:'ph-plus-circle', name:'HIERRO FORJADO',      desc:'Llega a semifinales sin ningún jugador lesionado'},
  {id:'score_7',          tier:'intermedio', pts:2, icon:'ph-fire',          name:'ARROLLADOR',           desc:'Marca 7 goles o más en un partido'},
  {id:'5_nineties',       tier:'intermedio', pts:2, icon:'ph-crown',         name:'EQUIPO DE LEYENDA',   desc:'Forma un equipo con 5 jugadores de rating 90 o superior'},
  {id:'two_pen_wins',     tier:'intermedio', pts:2, icon:'ph-target',        name:'REY DE PENALTIS',     desc:'Gana dos tandas de penaltis en el mismo torneo'},
  {id:'use_3_skills',     tier:'intermedio', pts:2, icon:'ph-toolbox',     name:'ESPECIALISTA',         desc:'Activa simultáneamente 3 habilidades distintas'},
  {id:'win_5_row',        tier:'intermedio', pts:2, icon:'ph-trend-up',      name:'RACHA GANADORA',      desc:'Gana 5 partidos consecutivos'},
  {id:'50_goat_pts',      tier:'intermedio', pts:2, icon:'ph-coins',         name:'BUEN CONTRATO',       desc:'Acumula 50 GOAT Points sin gastar ninguno'},
  {id:'score_10_group',   tier:'intermedio', pts:2, icon:'ph-chart-bar',     name:'MÁQUINA GOLEADORA',   desc:'Marca 10 goles o más en toda la fase de grupos'},
  {id:'win_all_groups',   tier:'intermedio', pts:2, icon:'ph-check-square',  name:'PLENO EN GRUPOS',     desc:'Gana los 3 partidos de la fase de grupos'},
  {id:'mp_rivalry_5',     tier:'intermedio', pts:2, icon:'ph-users-three',   name:'RIVALIDAD SANA',      desc:'Juega 5 duelos multijugador contra el mismo amigo'},
  {id:'mp_win_streak_3',  tier:'intermedio', pts:2, icon:'ph-trend-up',      name:'RACHA ONLINE',        desc:'Gana 3 duelos multijugador seguidos'},

  // DIFÍCILES — 3 PTS
  {id:'champion',         tier:'difícil', pts:3, icon:'ph-trophy',          name:'CAMPEÓN MUNDIAL',      desc:'Gana el Mundial'},
  {id:'champion_unbeaten',tier:'difícil', pts:3, icon:'ph-star',       name:'CAMPEÓN INVICTO',      desc:'Gana el Mundial sin perder ningún partido'},
  {id:'all_wins',         tier:'difícil', pts:3, icon:'ph-circles-four',        name:'SIETE DE SIETE',       desc:'Gana los 7 partidos del torneo sin empatar'},
  {id:'100_pts',          tier:'difícil', pts:3, icon:'ph-bank',           name:'CAJA FUERTE',          desc:'Acumula 100 GOAT Points sin gastar ninguno'},
  {id:'concede_1',        tier:'difícil', pts:3, icon:'ph-lock',            name:'BAJO SIETE LLAVES',    desc:'Encaja solo 1 gol o menos en todo el torneo'},
  {id:'5_skills',         tier:'difícil', pts:3, icon:'ph-lightning',       name:'MANAGER TOTAL',        desc:'Activa simultáneamente 5 habilidades'},
  {id:'hattrick_final',   tier:'difícil', pts:3, icon:'ph-number-three',             name:'HÉROE DE LA FINAL',    desc:'Un jugador marca 3 goles en la final del Mundial'},
  {id:'10_clean_sheets',  tier:'difícil', pts:3, icon:'ph-shield-check',    name:'PORTERO LEGENDARIO',   desc:'Consigue 10 porterías a cero a lo largo de tus partidas'},
  {id:'pen_win_final',    tier:'difícil', pts:3, icon:'ph-crosshair','name':'FINAL EN PENALTIS',  desc:'Gana la final del Mundial en la tanda de penaltis'},
  {id:'all_achievements_basic', tier:'difícil', pts:3, icon:'ph-seal-check','name':'PROFESIONAL',       desc:'Desbloquea todos los logros básicos'},
  {id:'mp_win_10',        tier:'difícil', pts:3, icon:'ph-medal-military', name:'IMBATIBLE EN DUELOS',  desc:'Gana 10 duelos multijugador'},

  // MÍTICO — 25 PTS
  {id:'triple_crown',     tier:'mítico',  pts:25, icon:'ph-crown',   name:'GOAT ABSOLUTO',        desc:'Gana el Mundial 3 veces'},
];
