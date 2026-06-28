/* ============================================================
   GOAL2GOAT — Sistema de internacionalización (i18n)
   Idiomas: es (español, por defecto), en (inglés)
   Uso: t('clave') → texto en idioma activo
   ============================================================ */

window.LANG = 'es';

window.TRANSLATIONS = {

  /* ── UI GENERAL ── */
  'app.support':          {es:'APOYA A GOAL2GOAT',   en:'SUPPORT GOAL2GOAT'},
  'app.ranking':          {es:'RANKING',              en:'RANKING'},
  'app.tickets':          {es:'TICKETS',              en:'TICKETS'},
  'app.version':          {es:'v0.353',               en:'v0.353'},

  /* ── HEADER / AUTH ── */
  'auth.login':           {es:'ENTRAR',               en:'LOG IN'},
  'auth.register':        {es:'REGISTRARSE',          en:'REGISTER'},
  'auth.logout':          {es:'CERRAR SESIÓN',        en:'LOG OUT'},
  'auth.email':           {es:'Email',                en:'Email'},
  'auth.password':        {es:'Contraseña',           en:'Password'},
  'auth.username':        {es:'Nombre de usuario',    en:'Username'},
  'auth.login_title':     {es:'INICIAR SESIÓN',       en:'LOG IN'},
  'auth.register_title':  {es:'CREAR CUENTA',         en:'CREATE ACCOUNT'},
  'auth.no_account':      {es:'¿No tienes cuenta?',   en:'No account yet?'},
  'auth.has_account':     {es:'¿Ya tienes cuenta?',   en:'Already have an account?'},

  /* ── PERFIL PESTAÑAS ── */
  'profile.stats':        {es:'ESTADÍSTICAS',         en:'STATISTICS'},
  'profile.settings':     {es:'AJUSTES',              en:'SETTINGS'},
  'profile.upgrades':     {es:'MEJORAS',              en:'UPGRADES'},
  'profile.skills':       {es:'HABILIDADES',          en:'SKILLS'},
  'profile.achievements': {es:'LOGROS',               en:'ACHIEVEMENTS'},

  /* ── ESTADÍSTICAS ── */
  'stats.results':        {es:'RESULTADOS',           en:'RESULTS'},
  'stats.goals':          {es:'GOLES',                en:'GOALS'},
  'stats.trophies':       {es:'TROFEOS',              en:'TROPHIES'},
  'stats.played':         {es:'PARTIDAS',             en:'MATCHES'},
  'stats.wins':           {es:'VICTORIAS',            en:'WINS'},
  'stats.draws':          {es:'EMPATES',              en:'DRAWS'},
  'stats.losses':         {es:'DERROTAS',             en:'LOSSES'},
  'stats.gf':             {es:'A FAVOR',              en:'FOR'},
  'stats.ga':             {es:'EN CONTRA',            en:'AGAINST'},
  'stats.best':           {es:'MEJOR PUNT.',          en:'BEST SCORE'},
  'stats.titles':         {es:'TÍTULOS',              en:'TITLES'},
  'stats.goat_pts':       {es:'GOAT PTS',             en:'GOAT PTS'},

  /* ── AJUSTES ── */
  'settings.sound':       {es:'SONIDO',               en:'SOUND'},
  'settings.theme':       {es:'TEMA OSCURO',          en:'DARK THEME'},
  'settings.theme_light': {es:'TEMA CLARO',           en:'LIGHT THEME'},
  'settings.team_name':   {es:'NOMBRE DEL EQUIPO',    en:'TEAM NAME'},
  'settings.team_name_placeholder': {es:'Ej: Dream Team FC', en:'E.g. Dream Team FC'},
  'settings.always_use':  {es:'Usar siempre como nombre de equipo', en:'Always use as team name'},
  'settings.always_use_hint': {es:'Si lo activas, no se te preguntará el nombre del equipo al formarlo — se usará este automáticamente.', en:'If enabled, you won\'t be asked for a team name when building — this name will be used automatically.'},
  'settings.save':        {es:'GUARDAR',              en:'SAVE'},
  'settings.patch_notes': {es:'NOTAS v0.353',         en:'PATCH NOTES v0.353'},
  'settings.language':    {es:'IDIOMA',               en:'LANGUAGE'},
  'settings.lang_es':     {es:'Español',              en:'Spanish'},
  'settings.lang_en':     {es:'English',              en:'English'},

  /* ── MEJORAS ── */
  'upgrades.title':       {es:'MEJORAS',              en:'UPGRADES'},
  'upgrades.subtitle':    {es:'ATRIBUTOS DEL MANAGER', en:'MANAGER ATTRIBUTES'},
  'upgrades.goat_pts':    {es:'GOAT POINTS',          en:'GOAT POINTS'},
  'upgrades.buy':         {es:'MEJORAR',              en:'UPGRADE'},
  'upgrades.sell':        {es:'VENDER',               en:'SELL'},
  'upgrades.max':         {es:'MÁXIMO',               en:'MAXIMUM'},
  'upgrade.bench':        {es:'BANQUILLO',            en:'BENCH'},
  'upgrade.bench_desc':   {es:'PLAZAS EN EL BANQUILLO', en:'BENCH SPOTS'},
  'upgrade.subs':         {es:'CAMBIOS',              en:'SUBSTITUTIONS'},
  'upgrade.subs_desc':    {es:'SUSTITUCIONES POR PARTIDO', en:'SUBS PER MATCH'},
  'upgrade.scout':        {es:'CONVOCADOS',           en:'SQUAD'},
  'upgrade.scout_desc':   {es:'JUGADORES POR EQUIPO AL BARAJAR', en:'PLAYERS PER TEAM WHEN ROLLING'},
  'upgrade.recovery':     {es:'RECUPERACIÓN',         en:'RECOVERY'},
  'upgrade.recovery_desc':{es:'REDUCE LA FATIGA ENTRE PARTIDOS', en:'REDUCES MATCH FATIGUE'},

  /* ── HABILIDADES ── */
  'skills.title':         {es:'HABILIDADES',          en:'SKILLS'},
  'skills.subtitle':      {es:'MODIFICADORES ESPECIALES', en:'SPECIAL MODIFIERS'},
  'skills.active':        {es:'✓ ACTIVA',             en:'✓ ACTIVE'},
  'skills.deactivate':    {es:'DESACTIVAR',           en:'DEACTIVATE'},
  'skills.pts':           {es:'PTS',                  en:'PTS'},
  'skill.estratega':      {es:'ESTRATEGA',            en:'STRATEGIST'},
  'skill.estratega_desc': {es:'Muestra la mejor contra-estrategia antes de cada partido.', en:'Shows the best counter-strategy before each match.'},
  'skill.capitan':        {es:'CAPITÁN',              en:'CAPTAIN'},
  'skill.capitan_desc':   {es:'Si vas perdiendo en el descanso, tu ataque sube un 10% en la segunda parte.', en:'If losing at half-time, your attack rises 10% in the second half.'},
  'skill.remontada':      {es:'REMONTADA',            en:'COMEBACK'},
  'skill.remontada_desc': {es:'Si vas perdiendo de 2 o más goles, tu ataque sube un 35% el resto del partido.', en:'If losing by 2+ goals, your attack rises 35% for the rest of the match.'},
  'skill.penaltis':       {es:'ESPECIALISTA EN PENALTIS', en:'PENALTY SPECIALIST'},
  'skill.penaltis_desc':  {es:'Aumenta la probabilidad de anotar en tandas de penaltis en un 15%.', en:'Increases penalty shootout scoring probability by 15%.'},
  'skill.medico':         {es:'MÉDICO DE ÉLITE',      en:'ELITE PHYSIO'},
  'skill.medico_desc':    {es:'Las lesiones leves se recuperan automáticamente al acabar el partido.', en:'Minor injuries recover automatically at the end of the match.'},
  'skill.ojeador':        {es:'OJEADOR',              en:'SCOUT'},
  'skill.ojeador_desc':   {es:'Al barajar equipos siempre aparece al menos un jugador con 85 o más de rating.', en:'When rolling teams, at least one player with 85+ rating always appears.'},
  'skill.cazatalentos':   {es:'CAZATALENTOS',         en:'TALENT HUNTER'},
  'skill.cazatalentos_desc':{es:'Los jugadores fuera de su posición natural solo pierden un 5% de rendimiento.', en:'Players out of position only lose 5% performance instead of 15%.'},
  'skill.veterano':       {es:'VETERANO',             en:'VETERAN'},
  'skill.veterano_desc':  {es:'Los jugadores con 85+ de rating no pueden recibir tarjeta roja directa.', en:'Players with 85+ rating cannot receive a straight red card.'},
  'skill.coleccionista':  {es:'COLECCIONISTA',        en:'COLLECTOR'},
  'skill.coleccionista_desc':{es:'Cada casilla buena del ticket (moneda o cabra) da 1 punto extra.', en:'Each good ticket cell (coin or goat) gives 1 extra point.'},
  'skill.patrocinador':   {es:'PATROCINADOR',         en:'SPONSOR'},
  'skill.patrocinador_desc':{es:'Ganas 1 GOAT Point extra al clasificarte para cuartos de final.', en:'You earn 1 extra GOAT Point when reaching the quarter-finals.'},

  /* ── LOGROS ── */
  'achievements.title':   {es:'LOGROS',               en:'ACHIEVEMENTS'},
  'achievements.subtitle':{es:'Desafíos y recompensas', en:'Challenges & rewards'},
  'achievements.progress':{es:'LOGROS',               en:'ACHIEVEMENTS'},
  'achievements.pts_earned':{es:'PTS GANADOS',        en:'PTS EARNED'},
  'tier.basic':           {es:'BÁSICO',               en:'BASIC'},
  'tier.intermediate':    {es:'INTERMEDIO',           en:'INTERMEDIATE'},
  'tier.hard':            {es:'DIFÍCIL',              en:'HARD'},
  'tier.mythic':          {es:'MÍTICO',               en:'MYTHIC'},
  /* Nombres logros */
  'ach.first_match':      {es:'PITIDO INICIAL',       en:'KICK-OFF'},
  'ach.first_win':        {es:'PRIMERA VICTORIA',     en:'FIRST WIN'},
  'ach.first_ticket':     {es:'PRIMER RASCA',         en:'FIRST SCRATCH'},
  'ach.clean_sheet':      {es:'PORTERÍA A CERO',      en:'CLEAN SHEET'},
  'ach.no_subs_win':      {es:'SIN ROTACIONES',       en:'NO CHANGES'},
  'ach.first_groups':     {es:'FASE SUPERADA',        en:'GROUPS CLEARED'},
  'ach.score_5':          {es:'GOLEADA',              en:'THRASHING'},
  'ach.win_comeback':     {es:'VUELTA AL PARTIDO',    en:'BACK IN THE GAME'},
  'ach.use_skill':        {es:'PRIMER PODER',         en:'FIRST POWER'},
  'ach.full_bench':       {es:'PLANTILLA COMPLETA',   en:'FULL SQUAD'},
  'ach.hattrick_player':  {es:'HAT-TRICK',            en:'HAT-TRICK'},
  'ach.win_no_concede2':  {es:'DOBLE CERROJO',        en:'DOUBLE LOCK'},
  'ach.all_stars':        {es:'ONCE PERFECTO',        en:'PERFECT ELEVEN'},
  'ach.first_pen_win':    {es:'NERVIOS DE ACERO',     en:'NERVES OF STEEL'},
  'ach.upgrade_once':     {es:'PRIMERA MEJORA',       en:'FIRST UPGRADE'},
  'ach.groups_unbeaten':  {es:'INVICTO EN GRUPOS',    en:'UNBEATEN IN GROUPS'},
  'ach.groups_no_concede':{es:'MURALLA EN GRUPOS',    en:'WALL IN GROUPS'},
  'ach.quarters':         {es:'CUARTOS',              en:'QUARTER-FINALS'},
  'ach.semis':            {es:'SEMIFINAL',            en:'SEMI-FINAL'},
  'ach.comeback_2':       {es:'REMONTADA ÉPICA',      en:'EPIC COMEBACK'},
  'ach.perfect_tactic':   {es:'TÁCTICA MAESTRA',      en:'MASTER TACTIC'},
  'ach.no_injuries_semis':{es:'HIERRO FORJADO',       en:'IRON MAN'},
  'ach.score_7':          {es:'ARROLLADOR',           en:'DOMINANT'},
  'ach.5_nineties':       {es:'EQUIPO DE LEYENDA',    en:'LEGENDARY SQUAD'},
  'ach.two_pen_wins':     {es:'REY DE PENALTIS',      en:'PENALTY KING'},
  'ach.use_3_skills':     {es:'ESPECIALISTA',         en:'SPECIALIST'},
  'ach.win_5_row':        {es:'RACHA GANADORA',       en:'WINNING STREAK'},
  'ach.50_goat_pts':      {es:'BUEN CONTRATO',        en:'GOOD DEAL'},
  'ach.score_10_group':   {es:'MÁQUINA GOLEADORA',    en:'GOAL MACHINE'},
  'ach.win_all_groups':   {es:'PLENO EN GRUPOS',      en:'PERFECT GROUPS'},
  'ach.champion':         {es:'CAMPEÓN MUNDIAL',      en:'WORLD CHAMPION'},
  'ach.champion_unbeaten':{es:'CAMPEÓN INVICTO',      en:'UNBEATEN CHAMPION'},
  'ach.all_wins':         {es:'SIETE DE SIETE',       en:'SEVEN FROM SEVEN'},
  'ach.100_pts':          {es:'CAJA FUERTE',          en:'VAULT'},
  'ach.concede_1':        {es:'BAJO SIETE LLAVES',    en:'LOCKED DOWN'},
  'ach.5_skills':         {es:'MANAGER TOTAL',        en:'TOTAL MANAGER'},
  'ach.hattrick_final':   {es:'HÉROE DE LA FINAL',    en:'FINAL HERO'},
  'ach.10_clean_sheets':  {es:'PORTERO LEGENDARIO',   en:'LEGENDARY KEEPER'},
  'ach.pen_win_final':    {es:'FINAL EN PENALTIS',    en:'FINAL ON PENALTIES'},
  'ach.all_achievements_basic':{es:'PROFESIONAL',    en:'PROFESSIONAL'},
  'ach.triple_crown':     {es:'GOAT ABSOLUTO',        en:'ABSOLUTE GOAT'},
  /* Descripciones logros */
  'ach.first_match.d':    {es:'Completa tu primer partido',           en:'Complete your first match'},
  'ach.first_win.d':      {es:'Gana tu primer partido',              en:'Win your first match'},
  'ach.first_ticket.d':   {es:'Gana puntos en tu primer ticket',     en:'Earn points on your first ticket'},
  'ach.clean_sheet.d':    {es:'Gana un partido sin encajar ningún gol', en:'Win a match without conceding'},
  'ach.no_subs_win.d':    {es:'Gana un partido sin usar ningún cambio', en:'Win a match without any substitutions'},
  'ach.first_groups.d':   {es:'Clasifícate para octavos de final',   en:'Qualify for the round of 16'},
  'ach.score_5.d':        {es:'Marca 5 goles o más en un partido',   en:'Score 5 or more goals in a match'},
  'ach.win_comeback.d':   {es:'Gana un partido después de ir perdiendo', en:'Win a match after falling behind'},
  'ach.use_skill.d':      {es:'Activa tu primera habilidad',         en:'Activate your first skill'},
  'ach.full_bench.d':     {es:'Llega a un partido con el banquillo lleno', en:'Enter a match with a full bench'},
  'ach.hattrick_player.d':{es:'Un mismo jugador marca 3 goles en un partido', en:'One player scores 3 goals in a match'},
  'ach.win_no_concede2.d':{es:'No encajes goles en 2 partidos consecutivos', en:'Keep a clean sheet in 2 consecutive matches'},
  'ach.all_stars.d':      {es:'Coloca los 11 titulares en su posición natural ★', en:'Place all 11 starters in their natural position ★'},
  'ach.first_pen_win.d':  {es:'Gana una tanda de penaltis',         en:'Win a penalty shootout'},
  'ach.upgrade_once.d':   {es:'Sube por primera vez cualquier mejora', en:'Upgrade anything for the first time'},
  'ach.groups_unbeaten.d':{es:'Pasa la fase de grupos sin perder',   en:'Go through the group stage unbeaten'},
  'ach.groups_no_concede.d':{es:'No encajes ningún gol en fase de grupos', en:'Concede no goals in the group stage'},
  'ach.quarters.d':       {es:'Clasifícate para cuartos de final',   en:'Reach the quarter-finals'},
  'ach.semis.d':          {es:'Llega a semifinales',                 en:'Reach the semi-finals'},
  'ach.comeback_2.d':     {es:'Gana un partido después de ir perdiendo de 2 goles', en:'Win a match after being 2 goals down'},
  'ach.perfect_tactic.d': {es:'Usa la contra-estrategia perfecta y gana', en:'Use the perfect counter-strategy and win'},
  'ach.no_injuries_semis.d':{es:'Llega a semifinales sin ningún jugador lesionado', en:'Reach the semis with no injuries'},
  'ach.score_7.d':        {es:'Marca 7 goles o más en un partido',   en:'Score 7 or more goals in a match'},
  'ach.5_nineties.d':     {es:'Forma un equipo con 5 jugadores de rating 90+', en:'Build a team with 5 players rated 90+'},
  'ach.two_pen_wins.d':   {es:'Gana dos tandas de penaltis en el mismo torneo', en:'Win two shootouts in the same tournament'},
  'ach.use_3_skills.d':   {es:'Activa simultáneamente 3 habilidades', en:'Activate 3 skills simultaneously'},
  'ach.win_5_row.d':      {es:'Gana 5 partidos consecutivos',        en:'Win 5 consecutive matches'},
  'ach.50_goat_pts.d':    {es:'Acumula 50 GOAT Points sin gastar',   en:'Accumulate 50 GOAT Points without spending'},
  'ach.score_10_group.d': {es:'Marca 10 goles o más en fase de grupos', en:'Score 10+ goals in the group stage'},
  'ach.win_all_groups.d': {es:'Gana los 3 partidos de la fase de grupos', en:'Win all 3 group stage matches'},
  'ach.champion.d':       {es:'Gana el Mundial',                     en:'Win the World Cup'},
  'ach.champion_unbeaten.d':{es:'Gana el Mundial sin perder ningún partido', en:'Win the World Cup unbeaten'},
  'ach.all_wins.d':       {es:'Gana los 7 partidos del torneo sin empatar', en:'Win all 7 matches without drawing'},
  'ach.100_pts.d':        {es:'Acumula 100 GOAT Points sin gastar',  en:'Accumulate 100 GOAT Points without spending'},
  'ach.concede_1.d':      {es:'Encaja solo 1 gol o menos en todo el torneo', en:'Concede 1 goal or less in the whole tournament'},
  'ach.5_skills.d':       {es:'Activa simultáneamente 5 habilidades', en:'Activate 5 skills simultaneously'},
  'ach.hattrick_final.d': {es:'Un jugador marca 3 goles en la final del Mundial', en:'A player scores a hat-trick in the World Cup final'},
  'ach.10_clean_sheets.d':{es:'Consigue 10 porterías a cero a lo largo de tus partidas', en:'Keep 10 clean sheets across all your matches'},
  'ach.pen_win_final.d':  {es:'Gana la final del Mundial en la tanda de penaltis', en:'Win the World Cup final on penalties'},
  'ach.all_achievements_basic.d':{es:'Desbloquea todos los logros básicos', en:'Unlock all basic achievements'},
  'ach.triple_crown.d':   {es:'Gana el Mundial 3 veces',             en:'Win the World Cup 3 times'},

  /* ── CAMPO / DRAFT ── */
  'draft.select_player':  {es:'SELECCIONAR JUGADOR',  en:'SELECT PLAYER'},
  'draft.quick_team':     {es:'EQUIPO RÁPIDO',        en:'QUICK TEAM'},
  'draft.convocados':     {es:'CONVOCADOS',           en:'SQUAD'},
  'draft.sort_position':  {es:'POSICIÓN',             en:'POSITION'},
  'draft.sort_arrival':   {es:'LLEGADA',              en:'ARRIVAL'},
  'draft.sort_rating':    {es:'PUNTOS',               en:'RATING'},
  'draft.resistance':     {es:'Resistencia',          en:'Stamina'},
  'draft.bench':          {es:'BANQUILLO',            en:'BENCH'},
  'draft.changes':        {es:'CAMBIOS DISPONIBLES',  en:'AVAILABLE SUBS'},
  'draft.morale':         {es:'MORAL',                en:'MORALE'},

  /* ── FORMACIÓN ── */
  'formation.title':      {es:'FORMACIÓN',            en:'FORMATION'},
  'formation.offensive':  {es:'Ofensiva',             en:'Offensive'},
  'formation.balanced':   {es:'Equilibrada',          en:'Balanced'},
  'formation.defensive':  {es:'Defensiva',            en:'Defensive'},
  'formation.chosen':     {es:'FORMACIÓN ELEGIDA',    en:'CHOSEN FORMATION'},
  'formation.attack_bonus':{es:'Bonus ataque',        en:'Attack bonus'},
  'formation.defense_bonus':{es:'Bonus defensa',      en:'Defence bonus'},

  /* ── RIVAL ── */
  'rival.title':          {es:'RIVAL',                en:'OPPONENT'},
  'rival.power':          {es:'Poder',                en:'Power'},
  'rival.attack':         {es:'ATAQUE',               en:'ATTACK'},
  'rival.defense':        {es:'DEFENSA',              en:'DEFENCE'},
  'rival.pace':           {es:'RITMO',                en:'PACE'},
  'rival.passing':        {es:'PASE',                 en:'PASSING'},
  'rival.technique':      {es:'TÉCNICA',              en:'TECHNIQUE'},

  /* ── ESTRATEGIA ── */
  'strategy.title':       {es:'ESTRATEGIA',           en:'STRATEGY'},
  'strategy.choose':      {es:'Elige tu estrategia para este partido', en:'Choose your strategy for this match'},
  'strategy.none':        {es:'Sin estrategia elegida: sin bonus ni penalización.', en:'No strategy chosen: no bonus or penalty.'},
  'strategy.hint':        {es:'ESTRATEGA: La mejor contra-táctica es', en:'STRATEGIST: Best counter-tactic is'},

  /* ── PARTIDO ── */
  'match.kickoff':        {es:'INICIO',               en:'KICK OFF'},
  'match.halftime':       {es:'DESCANSO',             en:'HALF TIME'},
  'match.fulltime':       {es:'FINAL',                en:'FULL TIME'},
  'match.extratime':      {es:'PRÓRROGA',             en:'EXTRA TIME'},
  'match.penalties':      {es:'PENALTIS',             en:'PENALTIES'},
  'match.victory':        {es:'¡VICTORIA!',           en:'VICTORY!'},
  'match.defeat':         {es:'DERROTA',              en:'DEFEAT'},
  'match.draw':           {es:'EMPATE',               en:'DRAW'},
  'match.possession':     {es:'Posesión',             en:'Possession'},
  'match.shots':          {es:'Tiros a puerta',       en:'Shots on target'},
  'match.continue':       {es:'CONTINUAR',            en:'CONTINUE'},
  'match.group_results':  {es:'VER RESULTADOS DE GRUPO', en:'SEE GROUP RESULTS'},
  'match.next_match':     {es:'SIGUIENTE PARTIDO',    en:'NEXT MATCH'},
  'match.injury':         {es:'Lesión',               en:'Injury'},
  'match.card_yellow':    {es:'Amarilla',             en:'Yellow card'},
  'match.card_red':       {es:'Roja',                 en:'Red card'},
  'match.sub_in':         {es:'Entra',                en:'On'},
  'match.sub_out':        {es:'Sale',                 en:'Off'},
  'match.foul_on':        {es:'falta sobre',          en:'foul on'},
  'match.penalty_scored': {es:'GOL',                  en:'GOAL'},
  'match.penalty_missed': {es:'FALLO',                en:'MISS'},

  /* ── RUEDA DE PRENSA ── */
  'press.title':          {es:'RUEDA DE PRENSA',      en:'PRESS CONFERENCE'},
  'press.skip':           {es:'OMITIR',               en:'SKIP'},
  'press.sincero':        {es:'Sincero',              en:'Honest'},
  'press.diplomatico':    {es:'Diplomático',          en:'Diplomatic'},
  'press.motivador':      {es:'Motivador',            en:'Motivational'},
  'press.promise_broken': {es:'Promesa incumplida',   en:'Broken promise'},
  'press.morale_boost':   {es:'La moral sube',        en:'Morale rises'},
  'press.morale_drop':    {es:'La moral baja',        en:'Morale drops'},

  /* ── COMPETICIÓN ── */
  'comp.groups':          {es:'FASE DE GRUPOS',       en:'GROUP STAGE'},
  'comp.r16':             {es:'OCTAVOS DE FINAL',     en:'ROUND OF 16'},
  'comp.qf':              {es:'CUARTOS DE FINAL',     en:'QUARTER-FINALS'},
  'comp.sf':              {es:'SEMIFINAL',            en:'SEMI-FINAL'},
  'comp.final':           {es:'FINAL',                en:'FINAL'},
  'comp.champion':        {es:'¡CAMPEÓN DEL MUNDO!',  en:'WORLD CHAMPION!'},
  'comp.play_match':      {es:'JUGAR PARTIDO',        en:'PLAY MATCH'},
  'comp.end_tournament':  {es:'FINALIZAR CAMPEONATO', en:'END TOURNAMENT'},

  /* ── TICKETS ── */
  'ticket.title':         {es:'BOLETO RASCA Y GANA',  en:'SCRATCH CARD'},
  'ticket.available':     {es:'Ticket disponible',    en:'Ticket available'},
  'ticket.next':          {es:'Próximo ticket en',    en:'Next ticket in'},
  'ticket.scratch':       {es:'RASCAR',               en:'SCRATCH'},
  'ticket.cashout':       {es:'COBRAR',               en:'CASH OUT'},
  'ticket.risk':          {es:'ARRIESGAR',            en:'RISK IT'},
  'ticket.bomb':          {es:'¡BOMBA! Pierdes los puntos acumulados.', en:'BOMB! You lose all accumulated points.'},
  'ticket.won':           {es:'¡PREMIADO!',           en:'WINNER!'},
  'ticket.pts_earned':    {es:'puntos ganados',       en:'points earned'},
  'ticket.golden':        {es:'¡TICKET GOAT DORADO!', en:'GOLDEN GOAT TICKET!'},

  /* ── HISTORIAL ── */
  'history.title':        {es:'HISTORIAL',            en:'HISTORY'},
  'history.empty':        {es:'No hay partidos registrados aún.', en:'No matches recorded yet.'},
  'history.result':       {es:'Resultado',            en:'Result'},
  'history.opponent':     {es:'Rival',                en:'Opponent'},
  'history.score':        {es:'Marcador',             en:'Score'},

  /* ── RANKING ── */
  'ranking.title':        {es:'RANKING GLOBAL',       en:'GLOBAL RANKING'},
  'ranking.pos':          {es:'#',                    en:'#'},
  'ranking.player':       {es:'Jugador',              en:'Player'},
  'ranking.score':        {es:'Puntuación',           en:'Score'},
  'ranking.loading':      {es:'Cargando ranking...',  en:'Loading ranking...'},

  /* ── INFORMACIÓN ── */
  'info.did_you_know':    {es:'¿SABÍAS QUÉ...?',      en:'DID YOU KNOW...?'},
  'info.how_to_play':     {es:'CÓMO JUGAR',           en:'HOW TO PLAY'},
  'info.stats_guide':     {es:'PARA QUÉ SIRVE CADA ESTADÍSTICA', en:'WHAT EACH STAT DOES'},
  'info.attack':          {es:'ATAQUE',               en:'ATTACK'},
  'info.defense':         {es:'DEFENSA',              en:'DEFENCE'},
  'info.pace':            {es:'RITMO',                en:'PACE'},
  'info.passing':         {es:'PASE',                 en:'PASSING'},
  'info.technique':       {es:'TÉCNICA',              en:'TECHNIQUE'},

  /* ── TIPS (¿Sabías qué...?) ── */
  'tips.0': {es:'💡 Regístrate para guardar tu progreso y acceder a contenido exclusivo.', en:'💡 Register to save your progress and access exclusive content.'},
  'tips.1': {es:'💡 Un jugador cansado rendirá peor en el campo, controla su resistencia.', en:'💡 A tired player will perform worse on the pitch — keep an eye on their stamina.'},
  'tips.2': {es:'💡 Conoce a tu rival. Elegir una buena estrategia puede marcar la diferencia.', en:'💡 Know your opponent. Picking the right strategy can make all the difference.'},

  /* ── CÓMO JUGAR — pasos ── */
  'howto.step1': {
    es:'Elige tu <strong>formación</strong> (queda fija todo el torneo) y arma tu once: <strong>SELECCIONAR JUGADOR</strong> o <strong>EQUIPO RÁPIDO</strong>. Coloca cada jugador en su <strong>posición ★</strong> para el 100% de rendimiento.',
    en:'Choose your <strong>formation</strong> (locked for the whole tournament) and build your eleven: <strong>SELECT PLAYER</strong> or <strong>QUICK TEAM</strong>. Place each player in their <strong>★ position</strong> for 100% performance.'
  },
  'howto.step2': {
    es:'<strong>Grupos → Octavos → Cuartos → Semis → Final.</strong> Antes de cada partido: rueda de prensa (predicción → moral) y elige una <strong>estrategia</strong> que contrarreste al rival.',
    en:'<strong>Groups → Round of 16 → Quarter-finals → Semis → Final.</strong> Before each match: press conference (prediction → morale) and pick a <strong>strategy</strong> to counter your opponent.'
  },
  'howto.step3': {
    es:'Hasta <strong>5 cambios 🪑</strong> por partido. Vigila lesiones ✚, sanciones 🚫 y la barra de <strong>Resistencia</strong> — descansa en el banquillo para recuperarla.',
    en:'Up to <strong>5 substitutions 🪑</strong> per match. Watch for injuries ✚, suspensions 🚫 and the <strong>Stamina</strong> bar — rest players on the bench to recover it.'
  },
  'howto.step4': {
    es:'La <strong>moral</strong> sube con goles/aciertos y baja con derrotas/fallos. El <strong>clima</strong> y las <strong>rachas 🔥</strong> también influyen en cada partido.',
    en:'<strong>Morale</strong> rises with goals/correct predictions and drops with defeats/misses. <strong>Weather</strong> and <strong>streaks 🔥</strong> also affect each match.'
  },
  'howto.step5': {
    es:'Cada run puntúa de <strong>0 a 1000</strong>. Gana el Mundial para acercarte al máximo — tu mejor puntuación se guarda si estás registrado.',
    en:'Each run scores from <strong>0 to 1000</strong>. Win the World Cup to reach the maximum — your best score is saved if you are registered.'
  },

  /* ── STATS GUIDE — descripciones ── */
  'info.attack.desc': {
    es:'<strong>ATAQUE</strong> — cuanto más alto frente a la defensa rival, más posibilidades de marcar goles.',
    en:'<strong>ATTACK</strong> — the higher it is against the opponent\'s defence, the more chances you have to score.'
  },
  'info.defense.desc': {
    es:'<strong>DEFENSA</strong> — frena el ataque rival: cuanto más alta, menos goles encajas.',
    en:'<strong>DEFENCE</strong> — limits the opponent\'s attack: the higher it is, the fewer goals you concede.'
  },
  'info.pace.desc': {
    es:'<strong>RITMO</strong> — aporta un extra de peligro ofensivo cuando supera al rival en velocidad.',
    en:'<strong>PACE</strong> — adds extra offensive threat when it exceeds the opponent\'s speed.'
  },
  'info.passing.desc': {
    es:'<strong>PASE</strong> — mejora tu juego colectivo y ayuda a crear más ocasiones de gol.',
    en:'<strong>PASSING</strong> — improves your collective play and helps create more goalscoring chances.'
  },
  'info.technique.desc': {
    es:'<strong>TÉCNICA</strong> — calidad individual: suma un plus de peligro tanto en ataque como en el control del partido.',
    en:'<strong>TECHNIQUE</strong> — individual quality: adds a danger bonus both in attack and in overall match control.'
  },
  'info.stats_tip': {
    es:'Los <strong>jugadores ★ en su posición</strong> y la <strong>estrategia</strong> elegida frente a cada rival son lo que más mueve estas estadísticas. ¡Elige bien para inclinar la balanza a tu favor!',
    en:'<strong>★ players in their position</strong> and the <strong>strategy</strong> chosen against each opponent are what move these stats the most. Choose wisely to tip the balance in your favour!'
  },

  /* ── LESIONES / TARJETAS ── */
  'injury.leve':          {es:'Lesión leve',          en:'Minor injury'},
  'injury.basica':        {es:'Lesión básica',        en:'Moderate injury'},
  'injury.grave':         {es:'Lesión grave',         en:'Serious injury'},
  'injury.suspended':     {es:'Sancionado',           en:'Suspended'},
  'injury.matches':       {es:'partidos',             en:'matches'},



  /* ── CATEGORÍAS ── */
  'cat.tactica':          {es:'TÁCTICA',              en:'TACTICS'},
  'cat.plantilla':        {es:'PLANTILLA',            en:'SQUAD'},
  'cat.economia':         {es:'ECONOMÍA',             en:'ECONOMY'},
  'settings.preferences': {es:'PREFERENCIAS',        en:'PREFERENCES'},
  'settings.always_team': {es:'Usar siempre como nombre de equipo', en:'Always use as team name'},

  /* ── CLAVES ADICIONALES ── */
  'comp.r16_advance':     {es:'Los 2 primeros avanzan a los Octavos de Final.', en:'The top 2 advance to the Round of 16.'},
  'comp.next_round':      {es:'Próxima ronda: ',         en:'Next round: '},
  'comp.qualified_for':   {es:'clasificado para',        en:'qualified for'},
  'comp.of_group':        {es:'del grupo',               en:'of the group'},
  'match.match':          {es:'partido',                 en:'match'},
  'match.recovered':      {es:'Recuperados',             en:'Recovered'},
  'match.goal':           {es:'GOL',                     en:'GOAL'},
  'match.own_goal':       {es:'Gol en propia',           en:'Own goal'},
  'match.achievement_unlocked': {es:'LOGRO DESBLOQUEADO', en:'ACHIEVEMENT UNLOCKED'},
  'strategy.counter_is':  {es:'La mejor contra-táctica es', en:'Best counter-tactic is'},
  'upgrade.bench_tooltip':{es:'plazas en el banquillo', en:'bench spots'},
  'upgrade.subs_tooltip': {es:'cambios por partido',    en:'subs per match'},
  'upgrade.scout_tooltip':{es:'jugadores por equipo al barajar', en:'players per team when rolling'},
  'upgrade.recovery_tooltip':{es:'menos fatiga por partido', en:'less fatigue per match'},
  'press.promise_sincero':{es:'Promesa incumplida ("Sincero")', en:'Broken promise ("Honest")'},
  'press.moral_up':       {es:'La moral sube',           en:'Morale rises'},
  'press.moral_down':     {es:'La moral baja',           en:'Morale drops'},
  'ticket.accumulated':   {es:'Puntos acumulados',       en:'Accumulated points'},
  'ticket.next_in':       {es:'Próximo ticket en',       en:'Next ticket in'},
  'injury.match':         {es:'partido',                 en:'match'},
  'injury.matches_out':   {es:'partidos de baja',        en:'matches out'},
  'draft.in_position':    {es:'en su posición',          en:'in position'},
  'draft.team_profile':   {es:'PERFIL DEL EQUIPO',       en:'TEAM PROFILE'},
  'draft.avg_rating':     {es:'NOTA MEDIA',              en:'AVERAGE RATING'},

  /* ── TABS MÓVIL ── */
  'mob.campo':            {es:'CAMPO',                en:'PITCH'},
  'mob.equipo':           {es:'EQUIPO',               en:'SQUAD'},
  'mob.rival':            {es:'RIVAL',                en:'OPPONENT'},
  'mob.historial':        {es:'HISTORIAL',            en:'HISTORY'},
  'mob.tickets':          {es:'TICKETS',              en:'TICKETS'},
  'mob.info':             {es:'INFORMACIÓN',          en:'INFO'},
  'mob.ranking':          {es:'RANKING',              en:'RANKING'},

  /* ── NOTAS DEL PARCHE ── */
  'patch.title':          {es:'NOTAS DE LA VERSIÓN',  en:'PATCH NOTES'},
};

/* ── Función principal de traducción ── */
window.t = function(key, ...args) {
  const entry = window.TRANSLATIONS[key];
  if (!entry) return key; // fallback: mostrar la clave
  let text = entry[window.LANG] || entry['es'] || key;
  // Reemplazar {0}, {1}... con argumentos
  args.forEach((arg, i) => { text = text.replace(`{${i}}`, arg); });
  return text;
};

/* ── Cambiar idioma ── */
window.setLang = function(lang) {
  if (lang !== 'es' && lang !== 'en') return;
  window.LANG = lang;
  try { localStorage.setItem('g2g_lang', lang); } catch(e) {}
  // Guardar en Firebase si está logueado
  const user = window._fbAuth && window._fbAuth.currentUser;
  if (user && window._fbDb) {
    window._fbDb.collection('users').doc(user.uid).set({ lang }, { merge: true });
  }
  // Re-renderizar la UI
  if (window.applyTranslations) window.applyTranslations();
};

/* ── Cargar idioma guardado ── */
(function() {
  let lang = 'es';
  try { lang = localStorage.getItem('g2g_lang') || 'es'; } catch(e) {}
  window.LANG = lang;
})();
