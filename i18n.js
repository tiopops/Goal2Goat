/* ============================================================
   GOAL2GOAT i18n — Sistema de traducciones
   Uso: window.t('clave') → texto en idioma activo
   ============================================================ */

window.LANG = 'es';

window.TRANSLATIONS = {

  /* ── HEADER ── */
  'app.support':    {es:'APOYA A GOAL2GOAT',  en:'SUPPORT GOAL2GOAT'},
  'app.ranking':    {es:'RANKING',             en:'RANKING'},
  'app.tickets':    {es:'TICKETS',             en:'TICKETS'},

  /* ── PERFIL PESTAÑAS ── */
  'tab.stats':      {es:'ESTADÍSTICAS',        en:'STATISTICS'},
  'tab.settings':   {es:'AJUSTES',             en:'SETTINGS'},
  'tab.upgrades':   {es:'MEJORAS',             en:'UPGRADES'},
  'tab.skills':     {es:'HABILIDADES',         en:'SKILLS'},
  'tab.achievements':{es:'LOGROS',             en:'ACHIEVEMENTS'},

  /* ── ESTADÍSTICAS ── */
  'stats.results':  {es:'RESULTADOS',          en:'RESULTS'},
  'stats.trophies': {es:'TROFEOS',             en:'TROPHIES'},
  'stats.played':   {es:'PARTIDAS',            en:'MATCHES'},
  'stats.wins':     {es:'VICTORIAS',           en:'WINS'},
  'stats.draws':    {es:'EMPATES',             en:'DRAWS'},
  'stats.losses':   {es:'DERROTAS',            en:'LOSSES'},
  'stats.gf':       {es:'A FAVOR',             en:'FOR'},
  'stats.ga':       {es:'EN CONTRA',           en:'AGAINST'},
  'stats.best':     {es:'MEJOR PUNT.',         en:'BEST SCORE'},
  'stats.titles':   {es:'TÍTULOS',             en:'TITLES'},
  'stats.goat_pts': {es:'GOAT PTS',            en:'GOAT PTS'},

  /* ── AJUSTES ── */
  'settings.prefs':     {es:'PREFERENCIAS',               en:'PREFERENCES'},
  'settings.sound':     {es:'SONIDO',                     en:'SOUND'},
  'settings.theme':     {es:'TEMA CLARO',                 en:'LIGHT THEME'},
  'settings.team_name': {es:'NOMBRE DEL EQUIPO',          en:'TEAM NAME'},
  'settings.always_use':{es:'Usar siempre como nombre de equipo', en:'Always use as team name'},
  'settings.always_hint':{es:'Si lo activas, no se te preguntará el nombre del equipo al formarlo — se usará este automáticamente.', en:'If enabled, you won\'t be asked for a team name — it will be used automatically.'},
  'settings.save':      {es:'GUARDAR',                    en:'SAVE'},
  'settings.patch':     {es:'NOTAS v0.353',               en:'PATCH NOTES v0.353'},
  'settings.language':  {es:'IDIOMA',                     en:'LANGUAGE'},

  /* ── MEJORAS ── */
  'upgrades.title':     {es:'MEJORAS',                    en:'UPGRADES'},
  'upgrades.subtitle':  {es:'ATRIBUTOS DEL MANAGER',      en:'MANAGER ATTRIBUTES'},
  'upgrades.pts':       {es:'GOAT POINTS',                en:'GOAT POINTS'},
  'upgrades.max':       {es:'MAX',                        en:'MAX'},
  'upgrades.buy':       {es:'MEJORAR',                    en:'UPGRADE'},
  'upgrades.sell':      {es:'VENDER',                     en:'SELL'},
  'upgrade.bench':      {es:'BANQUILLO',                  en:'BENCH'},
  'upgrade.bench_d':    {es:'PLAZAS EN EL BANQUILLO',     en:'BENCH SPOTS'},
  'upgrade.subs':       {es:'CAMBIOS',                    en:'SUBSTITUTIONS'},
  'upgrade.subs_d':     {es:'SUSTITUCIONES POR PARTIDO',  en:'SUBS PER MATCH'},
  'upgrade.scout':      {es:'CONVOCADOS',                 en:'SQUAD'},
  'upgrade.scout_d':    {es:'JUGADORES POR EQUIPO AL BARAJAR', en:'PLAYERS PER TEAM WHEN ROLLING'},
  'upgrade.recovery':   {es:'RECUPERACIÓN',               en:'RECOVERY'},
  'upgrade.recovery_d': {es:'REDUCE LA FATIGA ENTRE PARTIDOS', en:'REDUCES MATCH FATIGUE'},

  /* ── HABILIDADES ── */
  'skills.title':       {es:'HABILIDADES',                en:'SKILLS'},
  'skills.subtitle':    {es:'MODIFICADORES ESPECIALES',   en:'SPECIAL MODIFIERS'},
  'skills.active':      {es:'✓ ACTIVA · PULSA PARA DESACTIVAR', en:'✓ ACTIVE · CLICK TO DEACTIVATE'},
  'skills.cat.tactica': {es:'TÁCTICA',                    en:'TACTICS'},
  'skills.cat.plantilla':{es:'PLANTILLA',                 en:'SQUAD'},
  'skills.cat.economia':{es:'ECONOMÍA',                   en:'ECONOMY'},
  'skill.estratega':    {es:'ESTRATEGA',                  en:'STRATEGIST'},
  'skill.estratega_d':  {es:'Muestra la mejor contra-estrategia antes de cada partido.', en:'Shows the best counter-strategy before each match.'},
  'skill.capitan':      {es:'CAPITÁN',                    en:'CAPTAIN'},
  'skill.capitan_d':    {es:'Si vas perdiendo en el descanso, tu ataque sube un 10% en la segunda parte.', en:'If losing at half-time, your attack rises 10% in the second half.'},
  'skill.remontada':    {es:'REMONTADA',                  en:'COMEBACK'},
  'skill.remontada_d':  {es:'Si vas perdiendo de 2 o más goles, tu ataque sube un 35% el resto del partido.', en:'If losing by 2+ goals, your attack rises 35% for the rest of the match.'},
  'skill.penaltis':     {es:'ESPECIALISTA EN PENALTIS',   en:'PENALTY SPECIALIST'},
  'skill.penaltis_d':   {es:'Aumenta la probabilidad de anotar en tandas de penaltis en un 15%.', en:'Increases penalty scoring probability by 15%.'},
  'skill.medico':       {es:'MÉDICO DE ÉLITE',            en:'ELITE PHYSIO'},
  'skill.medico_d':     {es:'Las lesiones leves se recuperan automáticamente al acabar el partido.', en:'Minor injuries recover automatically at the end of the match.'},
  'skill.ojeador':      {es:'OJEADOR',                    en:'SCOUT'},
  'skill.ojeador_d':    {es:'Al barajar siempre aparece al menos un jugador con 85 o más de rating.', en:'When rolling, at least one player with 85+ rating always appears.'},
  'skill.cazatalentos': {es:'CAZATALENTOS',               en:'TALENT HUNTER'},
  'skill.cazatalentos_d':{es:'Los jugadores fuera de su posición solo pierden un 5% de rendimiento.', en:'Players out of position only lose 5% performance instead of 15%.'},
  'skill.veterano':     {es:'VETERANO',                   en:'VETERAN'},
  'skill.veterano_d':   {es:'Los jugadores con 85+ rating no pueden recibir tarjeta roja directa.', en:'Players with 85+ rating cannot receive a straight red card.'},
  'skill.coleccionista':{es:'COLECCIONISTA',              en:'COLLECTOR'},
  'skill.coleccionista_d':{es:'Cada casilla buena del ticket da 1 punto extra.', en:'Each good ticket cell gives 1 extra point.'},
  'skill.patrocinador': {es:'PATROCINADOR',               en:'SPONSOR'},
  'skill.patrocinador_d':{es:'Ganas 1 GOAT Point extra al clasificarte para cuartos de final.', en:'You earn 1 extra GOAT Point when reaching the quarter-finals.'},

  /* ── LOGROS ── */
  'ach.title':      {es:'LOGROS',                         en:'ACHIEVEMENTS'},
  'ach.subtitle':   {es:'Desafíos y recompensas',         en:'Challenges & rewards'},
  'ach.pts_earned': {es:'PTS GANADOS',                    en:'PTS EARNED'},
  'ach.unlocked':   {es:'LOGRO DESBLOQUEADO',             en:'ACHIEVEMENT UNLOCKED'},

  /* Nombres logros */
  'ach.first_match':     {es:'PITIDO INICIAL',       en:'KICK-OFF'},
  'ach.first_win':       {es:'PRIMERA VICTORIA',     en:'FIRST WIN'},
  'ach.first_ticket':    {es:'PRIMER RASCA',         en:'FIRST SCRATCH'},
  'ach.clean_sheet':     {es:'PORTERÍA A CERO',      en:'CLEAN SHEET'},
  'ach.no_subs_win':     {es:'SIN ROTACIONES',       en:'NO CHANGES'},
  'ach.first_groups':    {es:'FASE SUPERADA',        en:'GROUPS CLEARED'},
  'ach.score_5':         {es:'GOLEADA',              en:'THRASHING'},
  'ach.win_comeback':    {es:'VUELTA AL PARTIDO',    en:'BACK IN THE GAME'},
  'ach.use_skill':       {es:'PRIMER PODER',         en:'FIRST POWER'},
  'ach.full_bench':      {es:'PLANTILLA COMPLETA',   en:'FULL SQUAD'},
  'ach.hattrick_player': {es:'HAT-TRICK',            en:'HAT-TRICK'},
  'ach.win_no_concede2': {es:'DOBLE CERROJO',        en:'DOUBLE LOCK'},
  'ach.all_stars':       {es:'ONCE PERFECTO',        en:'PERFECT ELEVEN'},
  'ach.first_pen_win':   {es:'NERVIOS DE ACERO',     en:'NERVES OF STEEL'},
  'ach.upgrade_once':    {es:'PRIMERA MEJORA',       en:'FIRST UPGRADE'},
  'ach.groups_unbeaten': {es:'INVICTO EN GRUPOS',    en:'UNBEATEN IN GROUPS'},
  'ach.groups_no_concede':{es:'MURALLA EN GRUPOS',   en:'WALL IN GROUPS'},
  'ach.quarters':        {es:'CUARTOS',              en:'QUARTER-FINALS'},
  'ach.semis':           {es:'SEMIFINAL',            en:'SEMI-FINAL'},
  'ach.comeback_2':      {es:'REMONTADA ÉPICA',      en:'EPIC COMEBACK'},
  'ach.perfect_tactic':  {es:'TÁCTICA MAESTRA',      en:'MASTER TACTIC'},
  'ach.no_injuries_semis':{es:'HIERRO FORJADO',      en:'IRON MAN'},
  'ach.score_7':         {es:'ARROLLADOR',           en:'DOMINANT'},
  'ach.5_nineties':      {es:'EQUIPO DE LEYENDA',    en:'LEGENDARY SQUAD'},
  'ach.two_pen_wins':    {es:'REY DE PENALTIS',      en:'PENALTY KING'},
  'ach.use_3_skills':    {es:'ESPECIALISTA',         en:'SPECIALIST'},
  'ach.win_5_row':       {es:'RACHA GANADORA',       en:'WINNING STREAK'},
  'ach.50_goat_pts':     {es:'BUEN CONTRATO',        en:'GOOD DEAL'},
  'ach.score_10_group':  {es:'MÁQUINA GOLEADORA',    en:'GOAL MACHINE'},
  'ach.win_all_groups':  {es:'PLENO EN GRUPOS',      en:'PERFECT GROUPS'},
  'ach.champion':        {es:'CAMPEÓN MUNDIAL',      en:'WORLD CHAMPION'},
  'ach.champion_unbeaten':{es:'CAMPEÓN INVICTO',     en:'UNBEATEN CHAMPION'},
  'ach.all_wins':        {es:'SIETE DE SIETE',       en:'SEVEN FROM SEVEN'},
  'ach.100_pts':         {es:'CAJA FUERTE',          en:'VAULT'},
  'ach.concede_1':       {es:'BAJO SIETE LLAVES',    en:'LOCKED DOWN'},
  'ach.5_skills':        {es:'MANAGER TOTAL',        en:'TOTAL MANAGER'},
  'ach.hattrick_final':  {es:'HÉROE DE LA FINAL',    en:'FINAL HERO'},
  'ach.10_clean_sheets': {es:'PORTERO LEGENDARIO',   en:'LEGENDARY KEEPER'},
  'ach.pen_win_final':   {es:'FINAL EN PENALTIS',    en:'FINAL ON PENALTIES'},
  'ach.all_achievements_basic':{es:'PROFESIONAL',    en:'PROFESSIONAL'},
  'ach.triple_crown':    {es:'GOAT ABSOLUTO',        en:'ABSOLUTE GOAT'},

  /* Descripciones logros */
  'ach.first_match.d':   {es:'Completa tu primer partido',                en:'Complete your first match'},
  'ach.first_win.d':     {es:'Gana tu primer partido',                   en:'Win your first match'},
  'ach.first_ticket.d':  {es:'Gana puntos en tu primer ticket',          en:'Earn points on your first ticket'},
  'ach.clean_sheet.d':   {es:'Gana un partido sin encajar ningún gol',   en:'Win a match without conceding'},
  'ach.no_subs_win.d':   {es:'Gana un partido sin usar ningún cambio',   en:'Win a match without any substitutions'},
  'ach.first_groups.d':  {es:'Clasifícate para octavos de final',        en:'Qualify for the round of 16'},
  'ach.score_5.d':       {es:'Marca 5 goles o más en un partido',        en:'Score 5 or more goals in a match'},
  'ach.win_comeback.d':  {es:'Gana un partido después de ir perdiendo',  en:'Win a match after falling behind'},
  'ach.use_skill.d':     {es:'Activa tu primera habilidad',              en:'Activate your first skill'},
  'ach.full_bench.d':    {es:'Llega a un partido con el banquillo lleno',en:'Enter a match with a full bench'},
  'ach.hattrick_player.d':{es:'Un mismo jugador marca 3 goles en un partido', en:'One player scores 3 goals in a match'},
  'ach.win_no_concede2.d':{es:'No encajes goles en 2 partidos consecutivos', en:'Keep a clean sheet in 2 consecutive matches'},
  'ach.all_stars.d':     {es:'Coloca los 11 titulares en su posición ★', en:'Place all 11 starters in their natural position ★'},
  'ach.first_pen_win.d': {es:'Gana una tanda de penaltis',               en:'Win a penalty shootout'},
  'ach.upgrade_once.d':  {es:'Sube por primera vez cualquier mejora',    en:'Upgrade anything for the first time'},
  'ach.groups_unbeaten.d':{es:'Pasa la fase de grupos sin perder',       en:'Go through the group stage unbeaten'},
  'ach.groups_no_concede.d':{es:'No encajes ningún gol en fase de grupos', en:'Concede no goals in the group stage'},
  'ach.quarters.d':      {es:'Clasifícate para cuartos de final',        en:'Reach the quarter-finals'},
  'ach.semis.d':         {es:'Llega a semifinales',                      en:'Reach the semi-finals'},
  'ach.comeback_2.d':    {es:'Gana después de ir perdiendo de 2 goles',  en:'Win a match after being 2 goals down'},
  'ach.perfect_tactic.d':{es:'Usa la contra-estrategia perfecta y gana', en:'Use the perfect counter-strategy and win'},
  'ach.no_injuries_semis.d':{es:'Llega a semis sin ningún jugador lesionado', en:'Reach the semis with no injuries'},
  'ach.score_7.d':       {es:'Marca 7 goles o más en un partido',        en:'Score 7 or more goals in a match'},
  'ach.5_nineties.d':    {es:'Forma un equipo con 5 jugadores de rating 90+', en:'Build a team with 5 players rated 90+'},
  'ach.two_pen_wins.d':  {es:'Gana dos tandas de penaltis en el mismo torneo', en:'Win two shootouts in the same tournament'},
  'ach.use_3_skills.d':  {es:'Activa simultáneamente 3 habilidades',     en:'Activate 3 skills simultaneously'},
  'ach.win_5_row.d':     {es:'Gana 5 partidos consecutivos',             en:'Win 5 consecutive matches'},
  'ach.50_goat_pts.d':   {es:'Acumula 50 GOAT Points sin gastar',        en:'Accumulate 50 GOAT Points without spending'},
  'ach.score_10_group.d':{es:'Marca 10 goles o más en fase de grupos',   en:'Score 10+ goals in the group stage'},
  'ach.win_all_groups.d':{es:'Gana los 3 partidos de la fase de grupos', en:'Win all 3 group stage matches'},
  'ach.champion.d':      {es:'Gana el Mundial',                          en:'Win the World Cup'},
  'ach.champion_unbeaten.d':{es:'Gana el Mundial sin perder ningún partido', en:'Win the World Cup unbeaten'},
  'ach.all_wins.d':      {es:'Gana los 7 partidos del torneo sin empatar', en:'Win all 7 matches without drawing'},
  'ach.100_pts.d':       {es:'Acumula 100 GOAT Points sin gastar',       en:'Accumulate 100 GOAT Points without spending'},
  'ach.concede_1.d':     {es:'Encaja solo 1 gol o menos en todo el torneo', en:'Concede 1 goal or less in the whole tournament'},
  'ach.5_skills.d':      {es:'Activa simultáneamente 5 habilidades',     en:'Activate 5 skills simultaneously'},
  'ach.hattrick_final.d':{es:'Un jugador marca 3 goles en la final',     en:'A player scores a hat-trick in the final'},
  'ach.10_clean_sheets.d':{es:'Consigue 10 porterías a cero en total',   en:'Keep 10 clean sheets across all your matches'},
  'ach.pen_win_final.d': {es:'Gana la final del Mundial en penaltis',    en:'Win the World Cup final on penalties'},
  'ach.all_achievements_basic.d':{es:'Desbloquea todos los logros básicos', en:'Unlock all basic achievements'},
  'ach.triple_crown.d':  {es:'Gana el Mundial 3 veces',                  en:'Win the World Cup 3 times'},

  /* ── TIER LABELS ── */
  'tier.basic':     {es:'★ 1 PT',   en:'★ 1 PT'},
  'tier.inter':     {es:'★ 2 PTS',  en:'★ 2 PTS'},
  'tier.hard':      {es:'★ 3 PTS',  en:'★ 3 PTS'},
  'tier.mythic':    {es:'★ 25 PTS', en:'★ 25 PTS'},

  /* ── CAMPO / DRAFT ── */
  'draft.convocados': {es:'CONVOCADOS',          en:'SQUAD'},
  'draft.select':     {es:'SELECCIONAR JUGADOR', en:'SELECT PLAYER'},
  'draft.quick':      {es:'EQUIPO RÁPIDO',       en:'QUICK TEAM'},
  'draft.position':   {es:'POSICIÓN',            en:'POSITION'},
  'draft.arrival':    {es:'LLEGADA',             en:'ARRIVAL'},
  'draft.rating':     {es:'PUNTOS',              en:'RATING'},
  'draft.bench':      {es:'BANQUILLO',           en:'BENCH'},
  'draft.morale':     {es:'MORAL',               en:'MORALE'},
  'draft.changes':    {es:'Cambios disponibles antes del próximo partido', en:'Available substitutions before next match'},

  /* ── PERFIL DEL EQUIPO ── */
  'team.profile':   {es:'PERFIL DEL EQUIPO',  en:'TEAM PROFILE'},
  'team.avg':       {es:'NOTA MEDIA',         en:'AVG RATING'},
  'team.attack':    {es:'ATAQUE',             en:'ATTACK'},
  'team.defense':   {es:'DEFENSA',            en:'DEFENCE'},
  'team.pace':      {es:'RITMO',              en:'PACE'},
  'team.passing':   {es:'PASE',               en:'PASSING'},
  'team.technique': {es:'TÉCNICA',            en:'TECHNIQUE'},

  /* ── FORMACIÓN ── */
  'formation.title':    {es:'FORMACIÓN',           en:'FORMATION'},
  'formation.chosen':   {es:'FORMACIÓN ELEGIDA',   en:'CHOSEN FORMATION'},
  'formation.offensive':{es:'Ofensiva',            en:'Offensive'},
  'formation.balanced': {es:'Equilibrada',         en:'Balanced'},
  'formation.defensive':{es:'Defensiva',           en:'Defensive'},

  /* ── RIVAL ── */
  'rival.next':     {es:'PRÓXIMO RIVAL',       en:'NEXT OPPONENT'},
  'rival.power':    {es:'PODER RIVAL',         en:'RIVAL POWER'},
  'rival.style':    {es:'ESTILO DE JUEGO',     en:'PLAYING STYLE'},
  'rival.strategy': {es:'ELIGE TU ESTRATEGIA PARA ESTE PARTIDO', en:'CHOOSE YOUR STRATEGY FOR THIS MATCH'},
  'rival.no_strat': {es:'Sin estrategia elegida: sin bonus ni penalización.', en:'No strategy chosen: no bonus or penalty.'},

  /* ── COMPETICIÓN ── */
  'comp.groups':    {es:'FASE DE GRUPOS',      en:'GROUP STAGE'},
  'comp.r16':       {es:'OCTAVOS DE FINAL',    en:'ROUND OF 16'},
  'comp.qf':        {es:'CUARTOS DE FINAL',    en:'QUARTER-FINALS'},
  'comp.sf':        {es:'SEMIFINAL',           en:'SEMI-FINAL'},
  'comp.final':     {es:'FINAL',               en:'FINAL'},
  'comp.champion':  {es:'¡¡CAMPEÓN DEL MUNDO!!', en:'WORLD CHAMPION!!'},
  'comp.play':      {es:'JUGAR',               en:'PLAY'},
  'comp.next_match':{es:'SIGUIENTE PARTIDO',   en:'NEXT MATCH'},
  'comp.group_results':{es:'VER RESULTADOS DE GRUPO', en:'SEE GROUP RESULTS'},
  'comp.end':       {es:'FINALIZAR CAMPEONATO', en:'END TOURNAMENT'},
  'comp.qualified': {es:'clasificado para',    en:'qualified for'},

  /* ── PARTIDO ── */
  'match.halftime': {es:'DESCANSO',            en:'HALF TIME'},
  'match.extratime':{es:'PRÓRROGA',            en:'EXTRA TIME'},
  'match.penalties':{es:'PENALTIS',            en:'PENALTIES'},
  'match.victory':  {es:'¡VICTORIA!',          en:'VICTORY!'},
  'match.defeat':   {es:'DERROTA',             en:'DEFEAT'},
  'match.draw':     {es:'EMPATE',              en:'DRAW'},
  'match.possession':{es:'Posesión',           en:'Possession'},
  'match.shots':    {es:'Tiros a puerta',      en:'Shots on target'},
  'match.continue': {es:'CONTINUAR',           en:'CONTINUE'},
  'match.match':    {es:'partido',             en:'match'},

  /* ── RUEDA DE PRENSA ── */
  'press.title':    {es:'RUEDA DE PRENSA',     en:'PRESS CONFERENCE'},
  'press.skip':     {es:'OMITIR',              en:'SKIP'},

  /* Preguntas */
  'press.q1':  {es:'«¿Dejaréis la portería a cero en este encuentro?»',         en:'"Will you keep a clean sheet in this match?"'},
  'press.q2':  {es:'«¿Vais a ganar por tres goles o más?»',                     en:'"Are you going to win by three goals or more?"'},
  'press.q3':  {es:'«Lleváis varios partidos viendo tarjetas. ¿Seguiréis acumulando?»', en:'"You\'ve been picking up cards lately. Will that continue?"'},
  'press.q4':  {es:'«¿Marcaréis en la primera mitad?»',                         en:'"Will you score in the first half?"'},
  'press.q5':  {es:'«¿Va a generar más ocasiones el rival que vosotros?»',      en:'"Will the opponent create more chances than you?"'},
  'press.q6':  {es:'«¿Se va a decidir esto en los 90 minutos, sin penaltis?»',  en:'"Will this be decided in 90 minutes, without penalties?"'},
  'press.q7':  {es:'«¿Vais a marcar más de un gol en este partido?»',           en:'"Will you score more than one goal in this match?"'},
  'press.q8':  {es:'«¿Encajaréis dos goles o más en este partido?»',            en:'"Will you concede two or more goals in this match?"'},
  'press.q9':  {es:'«¿Terminará el partido en empate?»',                        en:'"Do you think the match will end in a draw?"'},
  'press.q10': {es:'«¿Marcará alguno de vuestros delanteros estrella?»',        en:'"Will any of your star forwards get on the scoresheet?"'},
  'press.q11': {es:'«¿Va a ser un partido con mucho juego físico?»',            en:'"Is this going to be a physical match?"'},
  'press.q12': {es:'«¿Va a ser un partido de muchas ocasiones para ambos?»',    en:'"Will this be an open game with chances for both sides?"'},

  /* Respuestas */
  'press.q1a1':{es:'«Sí, vamos a por la portería a cero.»',              en:'"Yes, we are going for the clean sheet."'},
  'press.q1a2':{es:'«Es difícil de prometer, ya veremos.»',              en:'"Hard to promise, we\'ll see."'},
  'press.q1a3':{es:'«Lo veo complicado, encajaremos.»',                  en:'"I think we\'ll concede, to be honest."'},
  'press.q2a1':{es:'«Sí, vamos a golear.»',                              en:'"Yes, we\'re going to score plenty."'},
  'press.q2a2':{es:'«No me atrevo a predecir el marcador.»',             en:'"I wouldn\'t dare predict the scoreline."'},
  'press.q2a3':{es:'«No, será un partido ajustado.»',                    en:'"No, it will be a tight game."'},
  'press.q3a1':{es:'«No, vamos a jugar limpio esta vez.»',               en:'"No, we\'re going to play clean this time."'},
  'press.q3a2':{es:'«No puedo controlar lo que pite el árbitro.»',       en:'"I can\'t control what the referee decides."'},
  'press.q3a3':{es:'«Es probable, el rival nos hará cometer faltas.»',   en:'"Probably, the opponent will force us into fouls."'},
  'press.q4a1':{es:'«Sí, saldremos a por todas desde el inicio.»',       en:'"Yes, we\'ll go for it from the start."'},
  'press.q4a2':{es:'«El plan de partido lo decide el míster.»',          en:'"The game plan is up to the manager."'},
  'press.q4a3':{es:'«Seremos pacientes, no hay prisa por marcar.»',      en:'"We\'ll be patient, there\'s no rush to score."'},
  'press.q5a1':{es:'«No, vamos a dominar nosotros el partido.»',         en:'"No, we\'re going to dominate this game."'},
  'press.q5a2':{es:'«Cada partido es distinto, lo veremos en el campo.»',en:'"Every game is different, we\'ll see on the pitch."'},
  'press.q5a3':{es:'«Es un rival fuerte, nos costará contenerlo.»',      en:'"They\'re a strong side, it will be tough to contain them."'},
  'press.q6a1':{es:'«Sí, lo resolveremos en el tiempo reglamentario.»',  en:'"Yes, we\'ll settle it in normal time."'},
  'press.q6a2':{es:'«Lo importante es resolverlo, como sea.»',           en:'"The important thing is to get through, however it takes."'},
  'press.q6a3':{es:'«Puede decidirse incluso en penaltis.»',             en:'"It could even come down to penalties."'},
  'press.q7a1':{es:'«Sí, tenemos gol en las botas.»',                   en:'"Yes, we have goals in our boots."'},
  'press.q7a2':{es:'«Con uno nos conformamos si hace falta.»',           en:'"One will do if that\'s what it takes."'},
  'press.q7a3':{es:'«Va a costarnos encontrar el gol hoy.»',             en:'"We\'ll struggle to find the net today."'},
  'press.q8a1':{es:'«No, vamos a estar sólidos atrás.»',                 en:'"No, we\'ll be solid at the back."'},
  'press.q8a2':{es:'«El fútbol siempre da sorpresas.»',                  en:'"Football always throws up surprises."'},
  'press.q8a3':{es:'«El rival tiene mucho gol, puede pasar.»',           en:'"They\'re a dangerous side, it could happen."'},
  'press.q9a1':{es:'«No, vamos a buscar la victoria hasta el final.»',   en:'"No, we\'ll push for the win until the end."'},
  'press.q9a2':{es:'«Cualquier resultado es posible en este torneo.»',   en:'"Any result is possible in this tournament."'},
  'press.q9a3':{es:'«Puede que ninguno consiga abrir la lata.»',         en:'"Neither side might be able to break the deadlock."'},
  'press.q10a1':{es:'«Sí, va a estar fino delante de la portería.»',     en:'"Yes, he\'ll be sharp in front of goal."'},
  'press.q10a2':{es:'«El gol es cosa de todo el equipo.»',               en:'"Goals are a team effort."'},
  'press.q10a3':{es:'«El rival lo va a tener vigilado de cerca.»',       en:'"The opponent will be marking him tightly."'},
  'press.q11a1':{es:'«No, queremos jugar al fútbol, no a la guerra.»',   en:'"No, we want to play football, not kick people."'},
  'press.q11a2':{es:'«Eso lo decide el árbitro, no nosotros.»',          en:'"That\'s for the referee to decide, not us."'},
  'press.q11a3':{es:'«Va a ser un partido muy disputado, sin duda.»',    en:'"It will be a very contested match, no doubt."'},
  'press.q12a1':{es:'«Sí, esto va a ser ida y vuelta.»',                 en:'"Yes, it\'s going to be end to end."'},
  'press.q12a2':{es:'«Depende de cómo se plantee el partido.»',          en:'"It depends on how both teams approach it."'},
  'press.q12a3':{es:'«Va a ser un partido cerrado y táctico.»',          en:'"It will be a tight, tactical affair."'},

  /* Labels respuestas */
  'press.l1a1':{es:'Confiado',     en:'Confident'},   'press.l1a2':{es:'Prudente',    en:'Cautious'},  'press.l1a3':{es:'Pesimista',   en:'Pessimistic'},
  'press.l2a1':{es:'Ambicioso',    en:'Ambitious'},   'press.l2a2':{es:'Cauto',       en:'Cautious'},  'press.l2a3':{es:'Realista',    en:'Realistic'},
  'press.l3a1':{es:'Comprometido', en:'Committed'},   'press.l3a2':{es:'Evasivo',     en:'Evasive'},   'press.l3a3':{es:'Sincero',     en:'Honest'},
  'press.l4a1':{es:'Decidido',     en:'Determined'},  'press.l4a2':{es:'Diplomático', en:'Diplomatic'},'press.l4a3':{es:'Paciente',    en:'Patient'},
  'press.l5a1':{es:'Dominante',    en:'Dominant'},    'press.l5a2':{es:'Flexible',    en:'Flexible'},  'press.l5a3':{es:'Respetuoso',  en:'Respectful'},
  'press.l6a1':{es:'Seguro',       en:'Confident'},   'press.l6a2':{es:'Pragmático',  en:'Pragmatic'}, 'press.l6a3':{es:'Cauteloso',   en:'Wary'},
  'press.l7a1':{es:'Ofensivo',     en:'Attacking'},   'press.l7a2':{es:'Pragmático',  en:'Pragmatic'}, 'press.l7a3':{es:'Cauteloso',   en:'Cautious'},
  'press.l8a1':{es:'Defensivo',    en:'Defensive'},   'press.l8a2':{es:'Filosófico',  en:'Philosophical'},'press.l8a3':{es:'Realista', en:'Realistic'},
  'press.l9a1':{es:'Ambicioso',    en:'Ambitious'},   'press.l9a2':{es:'Realista',    en:'Realistic'}, 'press.l9a3':{es:'Cauteloso',   en:'Cautious'},
  'press.l10a1':{es:'Confiado',    en:'Confident'},   'press.l10a2':{es:'Colectivo',  en:'Team-minded'},'press.l10a3':{es:'Precavido',  en:'Careful'},
  'press.l11a1':{es:'Conciliador', en:'Peaceable'},   'press.l11a2':{es:'Evasivo',    en:'Evasive'},   'press.l11a3':{es:'Realista',   en:'Realistic'},
  'press.l12a1':{es:'Espectáculo', en:'Entertaining'},'press.l12a2':{es:'Flexible',   en:'Open-minded'},'press.l12a3':{es:'Realista',  en:'Realistic'},

  /* ── TICKETS ── */
  'ticket.subtitle':  {es:'Ticket de GoatPoints',       en:'GoatPoints Ticket'},
  'ticket.number':    {es:'Boleto',                     en:'Ticket'},
  'ticket.acc_pts':   {es:'Puntos acumulados en el boleto', en:'Points accumulated'},
  'ticket.scratched': {es:'Casillas rascadas',          en:'Cells scratched'},
  'ticket.risk':      {es:'Riesgo de la próxima casilla', en:'Risk of next cell'},
  'ticket.cashout':   {es:'PLANTARSE',                  en:'CASH OUT'},
  'ticket.risk_btn':  {es:'ARRIESGAR',                  en:'RISK IT'},
  'ticket.next_in':   {es:'Próximo ticket en',          en:'Next ticket in'},
  'ticket.win':       {es:'¡TICKET PREMIADO!',          en:'WINNING TICKET!'},
  'ticket.lose':      {es:'TICKET ANULADO',             en:'TICKET VOID'},
  'ticket.pts_won':   {es:'puntos ganados',             en:'points earned'},
  'ticket.golden':    {es:'¡TICKET GOAT DORADO!',       en:'GOLDEN GOAT TICKET!'},
  'ticket.close':     {es:'CERRAR',                     en:'CLOSE'},

  /* ── HISTORIAL ── */
  'history.title':    {es:'HISTORIAL',                  en:'HISTORY'},
  'history.empty':    {es:'No hay partidos registrados aún.', en:'No matches recorded yet.'},

  /* ── RANKING ── */
  'ranking.title':    {es:'🏆 RANKING GLOBAL',          en:'🏆 GLOBAL RANKING'},
  'ranking.loading':  {es:'Cargando ranking...',        en:'Loading ranking...'},

  /* ── INFO ── */
  'info.did_you_know':{es:'¿SABÍAS QUE...?',            en:'DID YOU KNOW...?'},
  'info.how_to_play': {es:'CÓMO JUGAR',                 en:'HOW TO PLAY'},
  'info.stats_guide': {es:'PARA QUÉ SIRVE CADA ESTADÍSTICA', en:'WHAT EACH STAT DOES'},

  /* ── TABS MÓVIL ── */
  'mob.campo':    {es:'CAMPO',       en:'PITCH'},
  'mob.equipo':   {es:'EQUIPO',      en:'SQUAD'},
  'mob.rival':    {es:'RIVAL',       en:'OPPONENT'},
  'mob.historial':{es:'HISTORIAL',   en:'HISTORY'},
  'mob.tickets':  {es:'TICKETS',     en:'TICKETS'},
  'mob.info':     {es:'INFORMACIÓN', en:'INFO'},
  'mob.ranking':  {es:'RANKING',     en:'RANKING'},

  /* ── MISC ── */
  'ui.loading':   {es:'Cargando...',                    en:'Loading...'},
  'ui.login_req': {es:'Inicia sesión para ver esto.',   en:'Log in to see this.'},
  'ui.save':      {es:'GUARDAR',                        en:'SAVE'},
  'ui.continue':  {es:'CONTINUAR',                      en:'CONTINUE'},
  'ui.close':     {es:'CERRAR',                         en:'CLOSE'},
};

/* ── Función principal ── */

  /* ── RIVAL BOX ── */
  'rival.next':      {es:'PRÓXIMO RIVAL',          en:'NEXT OPPONENT'},
  'rival.power':     {es:'PODER RIVAL',            en:'RIVAL POWER'},
  'rival.style':     {es:'Estilo de juego',        en:'Playing style'},
  'rival.strategy':  {es:'Elige tu estrategia para este partido', en:'Choose your strategy for this match'},
  'rival.no_strat':  {es:'Sin estrategia elegida: sin bonus ni penalización.', en:'No strategy chosen: no bonus or penalty.'},
  'rival.strategist':{es:'ESTRATEGA: La mejor contra-táctica es', en:'STRATEGIST: Best counter-tactic is'},

  /* ── TEAM PROFILE ── */
  'team.profile':    {es:'PERFIL DEL EQUIPO',      en:'TEAM PROFILE'},
  'team.avg':        {es:'NOTA MEDIA',             en:'AVG RATING'},

  /* ── INFO PANEL ── */
  'info.did_you_know':{es:'¿SABÍAS QUÉ...?',       en:'DID YOU KNOW...?'},
  'info.how_to_play': {es:'CÓMO JUGAR',            en:'HOW TO PLAY'},
  'info.stats_guide': {es:'PARA QUÉ SIRVE CADA ESTADÍSTICA', en:'WHAT EACH STAT DOES'},

  /* ── AJUSTES ── */
  'settings.sound':   {es:'SONIDO',               en:'SOUND'},
  'settings.theme':   {es:'TEMA OSCURO',           en:'DARK THEME'},
  'settings.team_name':{es:'NOMBRE DEL EQUIPO',   en:'TEAM NAME'},
  'settings.always_use':{es:'Usar siempre como nombre de equipo', en:'Always use as team name'},
  'settings.always_hint':{es:'Si lo activas, no se te preguntará el nombre del equipo al formarlo — se usará este automáticamente.', en:'If enabled, you won't be asked for a team name — it will be used automatically.'},


  /* ══ TUTORIALES — CÓMO JUGAR ══ */
  'howto.1': {
    es: 'Elige tu <strong>formación</strong> (queda fija todo el torneo) y arma tu once: <strong>SELECCIONAR JUGADOR</strong> o <strong>EQUIPO RÁPIDO</strong>. Coloca cada jugador en su <strong>posición ★</strong> para el 100% de rendimiento.',
    en: 'Choose your <strong>formation</strong> (fixed for the whole tournament) and build your eleven: <strong>SELECT PLAYER</strong> or <strong>QUICK TEAM</strong>. Place each player in their <strong>★ position</strong> for 100% performance.'
  },
  'howto.2': {
    es: '<strong>Grupos → Octavos → Cuartos → Semis → Final.</strong> Antes de cada partido: rueda de prensa (predicción → moral) y elige una <strong>estrategia</strong> que contrarreste al rival.',
    en: '<strong>Groups → R16 → QF → SF → Final.</strong> Before each match: press conference (prediction → morale) and choose a <strong>strategy</strong> to counter your opponent.'
  },
  'howto.3': {
    es: 'Hasta <strong>5 cambios 🪑</strong> por partido. Vigila lesiones ✚, sanciones 🚫 y la barra de <strong>Resistencia</strong> — descansa en el banquillo para recuperarla.',
    en: 'Up to <strong>5 substitutions 🪑</strong> per match. Watch for injuries ✚, suspensions 🚫 and the <strong>Stamina</strong> bar — rest players on the bench to recover it.'
  },
  'howto.4': {
    es: 'La <strong>moral</strong> sube con goles/aciertos y baja con derrotas/fallos. El <strong>clima</strong> y las <strong>rachas 🔥</strong> también influyen en cada partido.',
    en: 'Your <strong>morale</strong> rises with goals/correct calls and drops with defeats/errors. The <strong>weather</strong> and <strong>streaks 🔥</strong> also influence each match.'
  },
  'howto.5': {
    es: 'Cada run puntúa de <strong>0 a 1000</strong>. Gana el Mundial para acercarte al máximo — tu mejor puntuación se guarda si estás registrado.',
    en: 'Each run scores from <strong>0 to 1000</strong>. Win the World Cup to get close to the maximum — your best score is saved if you are registered.'
  },

  /* ══ TUTORIALES — ESTADÍSTICAS ══ */
  'stats.attack_desc': {
    es: '<strong>ATAQUE</strong> — cuanto más alto frente a la defensa rival, más posibilidades de marcar goles.',
    en: '<strong>ATTACK</strong> — the higher it is against the opponent's defence, the more chances of scoring.'
  },
  'stats.defense_desc': {
    es: '<strong>DEFENSA</strong> — frena el ataque rival: cuanto más alta, menos goles encajas.',
    en: '<strong>DEFENCE</strong> — stops the opponent's attack: the higher it is, the fewer goals you concede.'
  },
  'stats.pace_desc': {
    es: '<strong>RITMO</strong> — aporta un extra de peligro ofensivo cuando supera al rival en velocidad.',
    en: '<strong>PACE</strong> — provides extra attacking threat when it exceeds the opponent's speed.'
  },
  'stats.passing_desc': {
    es: '<strong>PASE</strong> — mejora tu juego colectivo y ayuda a crear más ocasiones de gol.',
    en: '<strong>PASSING</strong> — improves your team play and helps create more goal-scoring chances.'
  },
  'stats.technique_desc': {
    es: '<strong>TÉCNICA</strong> — calidad individual: suma un plus de peligro tanto en ataque como en el control del partido.',
    en: '<strong>TECHNIQUE</strong> — individual quality: adds extra threat both in attack and in controlling the match.'
  },
  'stats.tip': {
    es: 'Los <strong>jugadores ★ en su posición</strong> y la <strong>estrategia</strong> elegida frente a cada rival son lo que más mueve estas estadísticas. ¡Elige bien para inclinar la balanza a tu favor!',
    en: '<strong>★ players in position</strong> and the chosen <strong>strategy</strong> against each opponent are what move these stats the most. Choose wisely to tip the balance in your favour!'
  },

  /* ══ RANKING ══ */
  'ranking.title':    {es:'🏆 RANKING GLOBAL',   en:'🏆 GLOBAL RANKING'},
  'ranking.subtitle': {es:'Top 50 mejores puntuaciones de jugadores registrados', en:'Top 50 best scores from registered players'},


  /* ── PARTIDO — claves faltantes ── */
  'match.recovered':      {es:'se recupera',              en:'has recovered'},
  'match.group_results':  {es:'VER RESULTADOS DE GRUPO',  en:'SEE GROUP RESULTS'},
  'match.next_match':     {es:'SIGUIENTE PARTIDO',        en:'NEXT MATCH'},
  'match.next_round':     {es:'SIGUIENTE RONDA',          en:'NEXT ROUND'},
  'match.achievement_unlocked':{es:'LOGRO DESBLOQUEADO',  en:'ACHIEVEMENT UNLOCKED'},

  /* ── COMPETICIÓN — claves faltantes ── */
  'comp.play_match':      {es:'JUGAR PARTIDO',            en:'PLAY MATCH'},
  'comp.next_round':      {es:'SIGUIENTE RONDA',          en:'NEXT ROUND'},
  'comp.end_tournament':  {es:'FINALIZAR CAMPEONATO',     en:'END TOURNAMENT'},
  'comp.r16_advance':     {es:'clasificado para octavos', en:'qualified for the round of 16'},

  /* ── ESTRATEGIA ── */
  'strategy.choose':      {es:'ELIGE TU ESTRATEGIA PARA ESTE PARTIDO', en:'CHOOSE YOUR STRATEGY FOR THIS MATCH'},

  /* ── DRAFT ── */
  'draft.select_player':  {es:'SELECCIONAR JUGADOR',      en:'SELECT PLAYER'},

  /* ── MEJORAS — descs faltantes ── */
  'upgrade.bench_desc':   {es:'PLAZAS EN EL BANQUILLO',        en:'BENCH SPOTS'},
  'upgrade.subs_desc':    {es:'SUSTITUCIONES POR PARTIDO',     en:'SUBS PER MATCH'},
  'upgrade.scout_desc':   {es:'JUGADORES POR EQUIPO AL BARAJAR', en:'PLAYERS PER TEAM WHEN ROLLING'},
  'upgrade.recovery_desc':{es:'REDUCE LA FATIGA ENTRE PARTIDOS', en:'REDUCES MATCH FATIGUE'},

  /* ── TICKETS — textos pendientes ── */
  'ticket.serial':        {es:'Nº',                       en:'No.'},
  'ticket.edition_gold':  {es:'EDICIÓN ORO',              en:'GOLD EDITION'},
  'ticket.acc_pts_gold':  {es:'Puntos acumulados',        en:'Accumulated points'},
  'ticket.cashout':       {es:'PLANTARSE',                en:'CASH OUT'},
  'ticket.risk_it':       {es:'ARRIESGAR',                en:'RISK IT'},
  'ticket.pts_won':       {es:'puntos ganados',           en:'points earned'},
  'ticket.max_prize':     {es:'Rascaste todo el boleto. Premio máximo.', en:'You scratched the whole ticket. Maximum prize.'},
  'ticket.good_call':     {es:'¡Buena jugada! Te has retirado a tiempo.', en:'Good call! You cashed out at the right time.'},
  'ticket.lost_pts':      {es:'Has perdido los puntos acumulados en este boleto.', en:'You lost the points accumulated on this ticket.'},
  'ticket.boleto_n':      {es:'Boleto',                   en:'Ticket'},
  'ticket.risk_label':    {es:'Riesgo de la próxima casilla', en:'Risk of next cell'},

window.t = function(key) {
  const entry = window.TRANSLATIONS[key];
  if (!entry) return key;
  return entry[window.LANG] || entry['es'] || key;
};

/* ── Cambiar idioma ── */
window.setLang = function(lang) {
  if (lang !== 'es' && lang !== 'en') return;
  window.LANG = lang;
  try { localStorage.setItem('g2g_lang', lang); } catch(e) {}
  const user = window._fbAuth && window._fbAuth.currentUser;
  if (user && window._fbDb) {
    window._fbDb.collection('users').doc(user.uid).set({ lang }, { merge: true });
  }
  if (window.applyTranslations) window.applyTranslations();
};

/* ── Cargar idioma guardado ── */
(function() {
  try { window.LANG = localStorage.getItem('g2g_lang') || 'es'; } catch(e) { window.LANG = 'es'; }
})();
