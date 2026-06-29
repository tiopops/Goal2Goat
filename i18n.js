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
  'settings.patch_notes': {es:'NOTAS v0.354',         en:'PATCH NOTES v0.354'},
  'settings.language':    {es:'IDIOMA',               en:'LANGUAGE'},
  'settings.lang_es':     {es:'Español',              en:'Spanish'},
  'settings.lang_en':     {es:'English',              en:'English'},
  'settings.preferences': {es:'PREFERENCIAS',         en:'PREFERENCES'},
  'settings.always_use_checkbox': {es:'Usar siempre como nombre de equipo', en:'Always use as team name'},
  'settings.debug':       {es:'⚙️ MODO DEBUG',         en:'⚙️ DEBUG MODE'},
  'settings.cheats':      {es:'CHEATS ACTIVADOS',      en:'CHEATS ENABLED'},
  'settings.cheats_desc': {es:'Tickets siempre 3/3 · Gana todos los partidos · Puntos infinitos', en:'Tickets always 3/3 · Win every match · Infinite points'},

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

  /* ── UPGRADES — UI strings ── */
  'upgrade.title':        {es:'MEJORAS',               en:'UPGRADES'},
  'upgrade.subtitle':     {es:'Atributos del manager', en:'Manager attributes'},
  'upgrade.loading':      {es:'Cargando...',           en:'Loading...'},
  'upgrade.login':        {es:'Inicia sesión para ver las mejoras.', en:'Sign in to view upgrades.'},
  'upgrade.pts_label':    {es:'GOAT POINTS',           en:'GOAT POINTS'},
  'upgrade.max':          {es:'MAX',                   en:'MAX'},
  'upgrade.refund':       {es:'Recuperar {0} pts',     en:'Refund {0} pts'},
  'upgrade.cost_title':   {es:'Coste: {0} pts',        en:'Cost: {0} pts'},

  /* ── SKILLS — UI strings ── */
  'skill.title':          {es:'HABILIDADES',           en:'SKILLS'},
  'skill.subtitle':       {es:'Modificadores especiales', en:'Special modifiers'},
  'skill.loading':        {es:'Cargando...',           en:'Loading...'},
  'skill.login':          {es:'Inicia sesión para ver las habilidades.', en:'Sign in to view skills.'},
  'skill.pts_label':      {es:'GOAT POINTS',           en:'GOAT POINTS'},
  'skill.active_footer':  {es:'✓ ACTIVA · PULSA PARA DESACTIVAR', en:'✓ ACTIVE · TAP TO DEACTIVATE'},
  'skill.category.tactica':  {es:'TÁCTICA',            en:'TACTICS'},
  'skill.category.plantilla':{es:'PLANTILLA',          en:'SQUAD'},
  'skill.category.economia': {es:'ECONOMÍA',           en:'ECONOMY'},

  /* ── ACHIEVEMENTS — tier labels ── */
  'tier.basic':           {es:'BÁSICO',               en:'BASIC'},
  'tier.intermediate':    {es:'INTERMEDIO',           en:'INTERMEDIATE'},
  'tier.hard':            {es:'DIFÍCIL',              en:'HARD'},
  'tier.mythic':          {es:'MÍTICO',               en:'MYTHIC'},
  'tier.pts.basic':       {es:'★ 1 PT',               en:'★ 1 PT'},
  'tier.pts.intermediate':{es:'★ 2 PTS',              en:'★ 2 PTS'},
  'tier.pts.hard':        {es:'★ 3 PTS',              en:'★ 3 PTS'},
  'tier.pts.mythic':      {es:'★ 25 PTS',             en:'★ 25 PTS'},
  'achievements.login':   {es:'Inicia sesión para ver tus logros.', en:'Sign in to view your achievements.'},
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

  /* ── CONVOCADOS — tabla y textos dinámicos ── */
  'draft.th_player':      {es:'Jugador',              en:'Player'},
  'draft.th_stamina':     {es:'Resistencia',          en:'Stamina'},
  'draft.th_pos':         {es:'Pos',                  en:'Pos'},
  'draft.positions':      {es:'Posiciones',           en:'Positions'},
  'draft.swap_available': {es:'Cambios disponibles antes del próximo partido', en:'Subs available before next match'},
  'draft.swap_used':      {es:'Ya has usado tu cambio para este partido.',     en:'You have already used your sub for this match.'},
  'draft.choose_team':    {es:'ELIGE UNA SELECCIÓN',          en:'CHOOSE A SQUAD'},
  'draft.choose_bench':   {es:'ELIGE JUGADOR DE BANQUILLO',   en:'CHOOSE A BENCH PLAYER'},
  'draft.stamina_pct':    {es:'Resistencia',                  en:'Stamina'},

  /* ── FORMACIÓN ── */
  'formation.title':      {es:'FORMACIÓN',            en:'FORMATION'},
  'formation.offensive':  {es:'Ofensiva',             en:'Offensive'},
  'formation.balanced':   {es:'Equilibrada',          en:'Balanced'},
  'formation.defensive':  {es:'Defensiva',            en:'Defensive'},
  'formation.chosen':     {es:'FORMACIÓN ELEGIDA',    en:'CHOSEN FORMATION'},
  'formation.attack_bonus':{es:'Bonus ataque',        en:'Attack bonus'},
  'formation.defense_bonus':{es:'Bonus defensa',      en:'Defence bonus'},
  'formation.hint':       {es:'Elige tu formación ahora — una vez completes el equipo, quedará fijada para todo el torneo.', en:'Choose your formation now — once you complete the squad, it will be locked for the whole tournament.'},

  /* ── FORMACIÓN — labels ── */
  'formation.label.3-4-3.ofensiva':   {es:'Ataque total',          en:'Total attack'},
  'formation.label.3-4-1-2.ofensiva': {es:'Mediapunta creativo',   en:'Creative playmaker'},
  'formation.label.4-2-4.ofensiva':   {es:'Brasil clásico',        en:'Classic Brazil'},
  'formation.label.4-3-3.ofensiva':   {es:'Tridente Ofensivo',     en:'Offensive Trident'},
  'formation.label.4-2-3-1.ofensiva': {es:'Extremos al ataque',    en:'Wingers forward'},
  'formation.label.3-5-2.ofensiva':   {es:'Superioridad central',  en:'Central superiority'},
  'formation.label.2-3-5.ofensiva':   {es:'Vintage ofensivo',      en:'Offensive vintage'},
  'formation.label.4-4-2.equilibrada':{es:'El clásico',            en:'The classic'},
  'formation.label.4-3-3.equilibrada':{es:'Posesión y ataque',     en:'Possession & attack'},
  'formation.label.4-1-4-1.equilibrada':{es:'Sólido en todo',      en:'Solid all round'},
  'formation.label.4-2-3-1.equilibrada':{es:'Fútbol moderno',      en:'Modern football'},
  'formation.label.4-3-1-2.equilibrada':{es:'Control + 2 puntas',  en:'Control + 2 strikers'},
  'formation.label.3-5-2.equilibrada':{es:'Carrileros activos',    en:'Active wing-backs'},
  'formation.label.4-5-1.equilibrada':{es:'Defensivo+contragol',   en:'Defensive+counter'},
  'formation.label.5-4-1.defensiva':  {es:'Fortaleza',             en:'Fortress'},
  'formation.label.5-3-2.defensiva':  {es:'5 atrás + 2 arriba',   en:'5 back + 2 up'},
  'formation.label.4-5-1.defensiva':  {es:'Bloque compacto',       en:'Compact block'},
  'formation.label.4-1-4-1.defensiva':{es:'Pivote protector',      en:'Defensive pivot'},
  'formation.label.3-6-1.defensiva':  {es:'Muro defensivo',        en:'Defensive wall'},
  'formation.label.5-2-2-1.defensiva':{es:'Contragolpe',           en:'Counter-attack'},
  'formation.label.6-3-1.defensiva':  {es:'Ultra defensivo',       en:'Ultra defensive'},

  /* ── FORMACIÓN — descripciones ── */
  'formation.desc.3-4-3':   {es:'Tres centrales y tres delanteros: máxima presencia ofensiva.',      en:'Three centre-backs and three forwards: maximum offensive presence.'},
  'formation.desc.3-4-1-2': {es:'Línea de 3 con un mediapunta libre entre líneas.',                  en:'Back three with a free-roaming playmaker between the lines.'},
  'formation.desc.4-2-4':   {es:'Cuatro atacantes apoyados por solo dos centrocampistas.',           en:'Four attackers supported by just two midfielders.'},
  'formation.desc.4-3-3':   {es:'Equilibrio clásico entre posesión y ancho ofensivo.',              en:'Classic balance between possession and offensive width.'},
  'formation.desc.4-2-3-1': {es:'Doble pivote y un enganche que conecta con la punta.',             en:'Double pivot and an attacking midfielder linking up with the striker.'},
  'formation.desc.3-5-2':   {es:'Carrileros que suben por banda y dos puntas arriba.',              en:'Wing-backs bombing forward and two strikers up top.'},
  'formation.desc.2-3-5':   {es:'Formación vintage con cinco hombres en ataque.',                   en:'Vintage formation with five men in attack.'},
  'formation.desc.4-4-2':   {es:'El dibujo más clásico: simetría y bloques compactos.',             en:'The most classic shape: symmetry and compact blocks.'},
  'formation.desc.4-1-4-1': {es:'Pivote defensivo que protege la línea de cuatro.',                 en:'Defensive pivot protecting the back four.'},
  'formation.desc.4-3-1-2': {es:'Mediocentro creativo entre la medular y la delantera.',            en:'Creative central midfielder between the midfield and attack.'},
  'formation.desc.4-5-1':   {es:'Línea de cinco en el centro, un único punta de referencia.',       en:'Five-man midfield with a single reference striker.'},
  'formation.desc.5-4-1':   {es:'Cinco defensas para cerrar todos los espacios.',                   en:'Five defenders to close down every space.'},
  'formation.desc.5-3-2':   {es:'Bloque de cinco atrás con doble delantero al contragolpe.',        en:'Back five with two strikers ready to counter-attack.'},
  'formation.desc.3-6-1':   {es:'Seis hombres en el medio, máxima cautela ofensiva.',              en:'Six men in midfield, maximum offensive caution.'},
  'formation.desc.5-2-2-1': {es:'Defensa numerosa pensada para salir rápido a la contra.',          en:'Packed defence designed to hit fast on the counter.'},
  'formation.desc.6-3-1':   {es:'El mayor número de defensas posible en el campo.',                 en:'The highest number of defenders possible on the pitch.'},

  /* ── RIVAL ── */
  'rival.title':          {es:'RIVAL',                en:'OPPONENT'},
  'rival.next':           {es:'PRÓXIMO RIVAL',        en:'NEXT OPPONENT'},
  'rival.power_label':    {es:'PODER RIVAL',          en:'RIVAL POWER'},
  'rival.style_label':    {es:'Estilo de juego',      en:'Play style'},
  'rival.power':          {es:'Poder',                en:'Power'},
  'rival.attack':         {es:'ATAQUE',               en:'ATTACK'},
  'rival.defense':        {es:'DEFENSA',              en:'DEFENCE'},
  'rival.pace':           {es:'RITMO',                en:'PACE'},
  'rival.passing':        {es:'PASE',                 en:'PASSING'},
  'rival.technique':      {es:'TÉCNICA',              en:'TECHNIQUE'},

  /* ── ESTILOS DE JUEGO — descripciones de scouts ── */
  'style.jogo_bonito':          {es:'El fútbol más bonito y creativo. Sus jugadores pueden resolver el partido en cualquier momento.',                                                                                          en:'The most beautiful and creative football. Their players can decide the match at any moment.'},
  'style.gegenpress':           {es:'Presión tras pérdida y transiciones rápidas. No dan descanso al rival.',                                                                                                                  en:'Press after losing possession and fast transitions. They give the opponent no rest.'},
  'style.defensivo':            {es:'Bloque compacto y salida rápida. Peligrosos en el contragolpe.',                                                                                                                         en:'Compact block and quick outlet. Dangerous on the counter.'},
  'style.directo':              {es:'Juego vertical y ritmo alto. No dan tiempo a pensar.',                                                                                                                                    en:'Vertical play and high tempo. They give you no time to think.'},
  'style.contraataque':         {es:'Espera y golpea. Letales cuando tienen espacios.',                                                                                                                                        en:'Wait and strike. Lethal when they have space.'},
  'style.tiki_taka':            {es:'Dominan el balón y presionan en campo rival desde el primer minuto, pero un bloque bajo y bien plantado les incomoda, y la velocidad a la espalda les genera muchos problemas.',         en:'They dominate the ball and press in the opponent\'s half from the first minute, but a well-organised low block unsettles them, and pace in behind causes them serious problems.'},
  'style.samba_total':          {es:'Su ataque desborda con calidad individual, pero a cambio dejan huecos enormes en defensa que cualquier transición rápida puede aprovechar.',                                              en:'Their attack overflows with individual quality, but in return they leave huge gaps at the back that any quick transition can exploit.'},
  'style.catenaccio':           {es:'Apenas conceden ocasiones claras, un bloque bajo y compacto que sostiene el resultado durante los noventa minutos sin apenas despeinarse.',                                               en:'They barely concede clear chances — a low, compact block that holds the result for ninety minutes without breaking a sweat.'},
  'style.gegenpressing':        {es:'Presionan sin descanso y recuperan el balón muy arriba, agotando físicamente al rival que intenta jugar con calma desde atrás.',                                                         en:'They press relentlessly and win the ball high up the pitch, physically wearing down any opponent who tries to play out from the back.'},
  'style.total_football':       {es:'Rotan posiciones constantemente y atacan desde cualquier zona del campo, lo que exige mantener el orden colectivo en todo momento.',                                                      en:'They constantly rotate positions and attack from every area of the pitch, demanding total collective organisation at all times.'},
  'style.maquinaria_alemana':   {es:'Eficientes y disciplinados, sin apenas fisuras durante el partido, un rival que no perdona los errores propios.',                                                                         en:'Efficient and disciplined, with barely any cracks during the match — an opponent who does not forgive your mistakes.'},
  'style.magia_individual':     {es:'Casi todo su peligro pasa por un par de jugadores desequilibrantes; el resto del equipo pasa bastante desapercibido.',                                                                    en:'Almost all their danger runs through a couple of match-winners; the rest of the team largely goes unnoticed.'},
  'style.garra_charrua':        {es:'Entrega física y mentalidad guerrera por encima de todo, aunque a veces les falta algo de calidad con el balón en los pies.',                                                            en:'Physical commitment and a warrior mentality above all else, although they sometimes lack a little quality on the ball.'},
  'style.ataque_letal':         {es:'Tienen una delantera que castiga cualquier error, aunque su defensa concede más ocasiones de las que debería.',                                                                           en:'They have a forward line that punishes any mistake, though their defence concedes more chances than it should.'},
  'style.solidez_francesa':     {es:'Defensa muy sólida y poco vistosa, pero les cuesta generar peligro real cuando tienen el balón.',                                                                                         en:'Very solid and unglamorous at the back, but they struggle to create real danger when they have the ball.'},
  'style.velocidad_punzante':   {es:'Transiciones rapidísimas que castigan cualquier espacio dejado a la espalda de la defensa.',                                                                                              en:'Lightning-fast transitions that punish any space left in behind the defensive line.'},
  'style.garra_lusa':           {es:'Intensidad física y calidad individual en los duelos uno contra uno por todo el campo.',                                                                                                  en:'Physical intensity and individual quality in one-on-one duels all over the pitch.'},
  'style.futbol_directo':       {es:'Apuestan por el juego directo y los balones largos, con pocas florituras pero mucha insistencia en los duelos aéreos.',                                                                  en:'They rely on direct play and long balls, with few frills but great persistence in aerial duels.'},
  'style.naranja_mecanica':     {es:'Creativos y técnicos, capaces de generar peligro desde cualquier posición del campo.',                                                                                                    en:'Creative and technical, capable of generating danger from any position on the pitch.'},
  'style.muralla_balcanica':    {es:'Una defensa paciente y muy difícil de superar, que espera su momento sin precipitarse.',                                                                                                  en:'A patient defence that is very hard to break down — they wait for their moment without rushing.'},
  'style.muralla_atlas':        {es:'Su organización defensiva ha sorprendido a selecciones mucho más reputadas en los últimos torneos.',                                                                                     en:'Their defensive organisation has surprised far more reputed sides in recent tournaments.'},
  'style.once_oro_magiar':      {es:'Uno de los ataques más prolíficos de la historia, capaz de anotar con facilidad ante cualquier rival.',                                                                                  en:'One of the most prolific attacks in history, capable of scoring with ease against any opponent.'},
  'style.dinamita_danesa':      {es:'Un equipo impredecible que, en su mejor versión, puede complicarle la vida a cualquiera.',                                                                                                en:'An unpredictable side who, at their best, can make life difficult for anyone.'},
  'style.garra_española':       {es:'Energía y lucha constante, aunque a veces la pasión les pesa más que la calidad técnica.',                                                                                               en:'Non-stop energy and fight, although sometimes passion weighs heavier than technical quality.'},
  'style.disciplina_nipona':    {es:'Muy organizados y trabajadores, aunque con poco peligro real cuando llegan al área rival.',                                                                                               en:'Very organised and hard-working, although with little real danger when they reach the opponent\'s box.'},
  'style.disciplina_vikinga':   {es:'Un bloque ordenado y físico, sin demasiadas individualidades que desequilibren el partido.',                                                                                             en:'An organised, physical block with few individual match-winners to unbalance the game.'},
  'style.fiesta_cafetera':      {es:'Mucho talento técnico y ofensivo, aunque su defensa muestra dudas de vez en cuando.',                                                                                                    en:'Plenty of technical and attacking talent, though their defence shows uncertainty from time to time.'},
  'style.furia_otomana':        {es:'Juegan con mucha intensidad y pasión, al límite en cada disputa del partido.',                                                                                                           en:'They play with great intensity and passion, going all out in every contest throughout the match.'},
  'style.furia_tartan':         {es:'Carácter combativo y fuertes en el choque, aunque algo limitados con el balón en los pies.',                                                                                             en:'Combative character and strong in the challenge, though somewhat limited with the ball at their feet.'},
  'style.garra_chilena':        {es:'Compensan con actitud y lucha lo que les pueda faltar en calidad técnica.',                                                                                                              en:'They make up in attitude and fight what they may lack in technical quality.'},
  'style.garra_yanqui':         {es:'Físicos, disciplinados y muy difíciles de batir por la mínima diferencia.',                                                                                                             en:'Physical, disciplined and very hard to beat by a narrow margin.'},
  'style.la_scaloneta':         {es:'Un bloque sólido con un líder de clase mundial arriba, muy completos en todas las líneas.',                                                                                              en:'A solid block with a world-class leader up front — very complete across all lines.'},
  'style.leones_indomables':    {es:'Explosivos físicamente y muy peligrosos cuando encuentran espacios para correr al contraataque.',                                                                                         en:'Physically explosive and very dangerous when they find space to run into on the counter.'},
  'style.magia_carpatica':      {es:'Jugadores con mucho talento individual, aunque algo inconsistentes como conjunto.',                                                                                                       en:'Players with a great deal of individual talent, though somewhat inconsistent as a unit.'},
  'style.milagro_defensivo':    {es:'Un bloque muy disciplinado que ya ha frenado a algunos de los mejores ataques del mundo.',                                                                                               en:'A highly disciplined block that has already stopped some of the best attacks in the world.'},
  'style.muralla_celta':        {es:'Defensa férrea y muy compacta, conceden muy pocas ocasiones claras durante el partido.',                                                                                                 en:'An iron, very compact defence — they concede very few clear chances throughout the match.'},
  'style.muralla_guarani':      {es:'Defensa sacrificada y muy ordenada, suben pocos jugadores cuando atacan.',                                                                                                               en:'A selfless, very organised defence — they commit few players forward when attacking.'},
  'style.punta_lanza':          {es:'Su peligro ofensivo depende en gran medida de un delantero de referencia que marca la diferencia.',                                                                                      en:'Their attacking threat relies heavily on a reference striker who makes the difference.'},
  'style.sistema_cerrojo':      {es:'Un bloque ultra defensivo cuya prioridad absoluta es no encajar goles, cueste lo que cueste.',                                                                                           en:'An ultra-defensive block whose absolute priority is not to concede goals, whatever it takes.'},
  'style.tecnica_balcanica':    {es:'Buen toque de balón y jugadores con clase, aunque defensivamente pueden mostrar algunas dudas.',                                                                                         en:'Good touch on the ball and classy players, though they can show some defensive uncertainty.'},
  'style.tecnica_centroeuropea':{es:'Técnica depurada y buen juego colectivo, con un ritmo de partido más bien pausado.',                                                                                                    en:'Refined technique and good collective play, at a rather measured match tempo.'},
  'style.tricolor_tecnico':     {es:'Habilidosos y vistosos con el balón, aunque pueden verse superados ante la intensidad.',                                                                                                 en:'Skillful and attractive on the ball, though they can be overwhelmed by high intensity.'},
  'style.vendaval_incaico':     {es:'Buen toque de balón y jugadores desequilibrantes cuando llegan a campo rival.',                                                                                                          en:'Good touch and match-winning players when they get into the opponent\'s half.'},
  'style.vikingo_directo':      {es:'Físicos y directos, especialmente peligrosos en el juego aéreo.',                                                                                                                        en:'Physical and direct, especially dangerous in aerial play.'},
  'style.superaguilas':         {es:'Explosivos físicamente, con jugadores desequilibrantes que aprovechan los espacios a la carrera.',                                                                                        en:'Physically explosive, with match-winners who exploit space at pace.'},
  'style.wunderteam':           {es:'Un equipo técnico y ofensivo con una gran tradición histórica a sus espaldas.',                                                                                                          en:'A technical and attacking side with a great historical tradition behind them.'},

  /* ── ESTRATEGIAS — nombres y descripciones ── */
  'strategy.tiki_taka.name':     {es:'Tiki-Taka',           en:'Tiki-Taka'},
  'strategy.tiki_taka.desc':     {es:'Prioriza los pases cortos y la posesión para desgastar al rival y crear espacios.', en:'Prioritises short passes and possession to wear down the opponent and create space.'},
  'strategy.contraataque.name':  {es:'Contraataque',        en:'Counter-attack'},
  'strategy.contraataque.desc':  {es:'Defiende con orden y busca atacar rápidamente tras recuperar el balón.', en:'Defends in an organised way and looks to attack quickly after winning the ball.'},
  'strategy.catenaccio.name':    {es:'Catenaccio',          en:'Catenaccio'},
  'strategy.catenaccio.desc':    {es:'Centra sus esfuerzos en la defensa y aprovecha las pocas oportunidades de ataque.', en:'Focuses on defending and capitalises on the few attacking opportunities that arise.'},
  'strategy.presion_alta.name':  {es:'Presión Alta',        en:'High Press'},
  'strategy.presion_alta.desc':  {es:'Presiona al rival en su campo para recuperar el balón cuanto antes.', en:'Presses the opponent in their own half to win the ball back as soon as possible.'},
  'strategy.gegenpressing.name': {es:'Gegenpressing',       en:'Gegenpressing'},
  'strategy.gegenpressing.desc': {es:'Tras perder la posesión, todo el equipo intenta recuperarla inmediatamente.', en:'After losing possession, the whole team immediately tries to win it back.'},
  'strategy.posesion.name':      {es:'Juego de Posesión',   en:'Possession Play'},
  'strategy.posesion.desc':      {es:'Mantiene el control del balón para dominar el ritmo del partido.', en:'Keeps control of the ball to dominate the tempo of the match.'},
  'strategy.juego_directo.name': {es:'Juego Directo',       en:'Direct Play'},
  'strategy.juego_directo.desc': {es:'Busca llegar al área rival con rapidez y el menor número de pases posible.', en:'Looks to reach the opponent\'s box quickly with as few passes as possible.'},
  'strategy.futbol_total.name':  {es:'Fútbol Total',        en:'Total Football'},
  'strategy.futbol_total.desc':  {es:'Los jugadores intercambian posiciones constantemente para generar superioridades.', en:'Players constantly swap positions to create numerical advantages.'},
  'strategy.bloque_bajo.name':   {es:'Bloque Bajo',         en:'Low Block'},
  'strategy.bloque_bajo.desc':   {es:'Repliega al equipo cerca de su área para cerrar espacios y dificultar los ataques rivales.', en:'Drops the team deep near their own box to close spaces and make it hard for the opponent to attack.'},
  'strategy.ataque_bandas.name': {es:'Ataque por Bandas',   en:'Wide Attack'},
  'strategy.ataque_bandas.desc': {es:'Utiliza las bandas para crear peligro mediante desbordes y centros al área.', en:'Uses the flanks to create danger through dribbles and crosses into the box.'},

  /* ── ESTRATEGIA — feedback post-partido ── */
  'strategy.fb.counter':  {es:'✓ Tu estrategia ({0}) contrarrestó perfectamente a {1}.',          en:'✓ Your strategy ({0}) perfectly countered {1}.'},
  'strategy.fb.partial':  {es:'✓ Tu estrategia ({0}) controló bien a {1}.',                        en:'✓ Your strategy ({0}) controlled {1} well.'},
  'strategy.fb.beaten':   {es:'✗ {0} aprovechó el enfrentamiento táctico.',                        en:'✗ {0} exploited the tactical matchup.'},
  'strategy.fb.mirror':   {es:'= Ambos jugaron con un enfoque similar ({0}).',                     en:'= Both sides played with a similar approach ({0}).'},
  'strategy.fb.neutral':  {es:'Estrategia neutral: {0}, sin ventaja táctica clara.',               en:'Neutral strategy: {0}, no clear tactical advantage.'},
  'strategy.fb.counter2': {es:'✓ Tu estrategia ({0}) contrarrestó perfectamente a {1}.',          en:'✓ Your strategy ({0}) perfectly countered {1}.'},
  'strategy.fb.partial2': {es:'✓ Tu estrategia ({0}) controló bien a {1}, aunque no era la elección perfecta.', en:'✓ Your strategy ({0}) controlled {1} well, though it wasn\'t the perfect pick.'},
  'strategy.fb.beaten2':  {es:'✗ {0} aprovechó mejor el enfrentamiento táctico esta vez.',        en:'✗ {0} handled the tactical matchup better this time.'},
  'strategy.fb.mirror2':  {es:'= Ambos equipos jugaron con un enfoque similar ({0}).',            en:'= Both teams played with a similar approach ({0}).'},

  /* ── CLIMA ── */
  'weather.sunny.label':  {es:'☀ Soleado',        en:'☀ Sunny'},
  'weather.sunny.desc':   {es:'Calor intenso · RITMO -15% ambos equipos',     en:'Intense heat · PACE -15% both teams'},
  'weather.cloudy.label': {es:'⛅ Nublado',         en:'⛅ Cloudy'},
  'weather.cloudy.desc':  {es:'Condiciones neutras',                           en:'Neutral conditions'},
  'weather.rain.label':   {es:'🌧 Lluvia',          en:'🌧 Rain'},
  'weather.rain.desc':    {es:'Campo pesado · RITMO -20%, TÉCNICA -10%',       en:'Heavy pitch · PACE -20%, TECHNIQUE -10%'},
  'weather.wind.label':   {es:'💨 Viento fuerte',   en:'💨 Strong wind'},
  'weather.wind.desc':    {es:'Juego directo · PASE -15%',                     en:'Direct play · PASSING -15%'},
  'weather.hot.label':    {es:'🌡 Calor extremo',   en:'🌡 Extreme heat'},
  'weather.hot.desc':     {es:'Fatiga máxima · RITMO -25%, DEFENSA -10%',      en:'Maximum fatigue · PACE -25%, DEFENCE -10%'},

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
  'match.group_results':  {es:'VER RESULTADOS DE GRUPO', en:'SHOW GROUP RESULTS'},
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
  'press.title_full':     {es:'RUEDA DE PRENSA · ANTES DEL PARTIDO', en:'PRESS CONFERENCE · PRE-MATCH'},
  'press.skip':           {es:'OMITIR',               en:'SKIP'},
  'press.sincero':        {es:'Sincero',              en:'Honest'},
  'press.diplomatico':    {es:'Diplomático',          en:'Diplomatic'},
  'press.motivador':      {es:'Motivador',            en:'Motivational'},
  'press.promise_broken': {es:'Promesa incumplida',   en:'Broken promise'},
  'press.morale_boost':   {es:'La moral sube',        en:'Morale rises'},
  'press.morale_drop':    {es:'La moral baja',        en:'Morale drops'},
  'press.timeout':        {es:'No respondiste a tiempo — la prensa se queda sin declaraciones.', en:'You didn\'t answer in time — the press gets no statement.'},
  'press.promise_made':   {es:'Promesa hecha',        en:'Promise made'},
  'press.resolved_neutral':   {es:'🎙 Respuesta neutral: la moral no se ve afectada.',               en:'🎙 Neutral answer: morale is unaffected.'},
  'press.resolved_correct':   {es:'🎙 Promesa cumplida ("{0}"): +{1} moral.',                        en:'🎙 Promise kept ("{0}"): +{1} morale.'},
  'press.resolved_wrong':     {es:'🎙 Promesa incumplida ("{0}"): {1} moral.',                       en:'🎙 Promise broken ("{0}"): {1} morale.'},

  /* ── RUEDA DE PRENSA — preguntas y respuestas ── */
  'press.q0':  {es:'«¿Dejaréis la portería a cero en este encuentro?»',                              en:'"Will you keep a clean sheet in this match?"'},
  'press.q0a0.text':  {es:'«Sí, vamos a por la portería a cero.»',                                   en:'"Yes, we\'re going for the clean sheet."'},
  'press.q0a0.label': {es:'Confiado',    en:'Confident'},
  'press.q0a1.text':  {es:'«Es difícil de prometer, ya veremos.»',                                   en:'"It\'s hard to promise, we\'ll see."'},
  'press.q0a1.label': {es:'Prudente',    en:'Cautious'},
  'press.q0a2.text':  {es:'«Lo veo complicado, encajaremos.»',                                       en:'"I think we\'ll concede, it\'s complicated."'},
  'press.q0a2.label': {es:'Pesimista',   en:'Pessimistic'},

  'press.q1':  {es:'«¿Vais a ganar por tres goles o más?»',                                          en:'"Are you going to win by three goals or more?"'},
  'press.q1a0.text':  {es:'«Sí, vamos a golear.»',                                                   en:'"Yes, we\'re going to score plenty."'},
  'press.q1a0.label': {es:'Ambicioso',   en:'Ambitious'},
  'press.q1a1.text':  {es:'«No me atrevo a predecir el marcador.»',                                  en:'"I wouldn\'t dare predict the scoreline."'},
  'press.q1a1.label': {es:'Cauto',       en:'Wary'},
  'press.q1a2.text':  {es:'«No, será un partido ajustado.»',                                         en:'"No, it\'ll be a tight game."'},
  'press.q1a2.label': {es:'Realista',    en:'Realistic'},

  'press.q2':  {es:'«Lleváis varios partidos viendo tarjetas. ¿Seguiréis acumulando en este encuentro?»', en:'"You\'ve been picking up cards lately. Will you keep collecting them in this match?"'},
  'press.q2a0.text':  {es:'«No, vamos a jugar limpio esta vez.»',                                    en:'"No, we\'re going to play clean this time."'},
  'press.q2a0.label': {es:'Comprometido', en:'Committed'},
  'press.q2a1.text':  {es:'«No puedo controlar lo que pite el árbitro.»',                            en:'"I can\'t control what the referee calls."'},
  'press.q2a1.label': {es:'Evasivo',     en:'Evasive'},
  'press.q2a2.text':  {es:'«Es probable, el rival nos hará cometer faltas.»',                        en:'"Probably — the opponent will force us into fouls."'},
  'press.q2a2.label': {es:'Sincero',     en:'Honest'},

  'press.q3':  {es:'«¿Marcaréis en la primera mitad?»',                                              en:'"Will you score in the first half?"'},
  'press.q3a0.text':  {es:'«Sí, saldremos a por todas desde el inicio.»',                            en:'"Yes, we\'ll go all out from the start."'},
  'press.q3a0.label': {es:'Decidido',    en:'Determined'},
  'press.q3a1.text':  {es:'«El plan de partido lo decide el míster.»',                               en:'"The game plan is the manager\'s call."'},
  'press.q3a1.label': {es:'Diplomático', en:'Diplomatic'},
  'press.q3a2.text':  {es:'«Seremos pacientes, no hay prisa por marcar.»',                           en:'"We\'ll be patient — no rush to score."'},
  'press.q3a2.label': {es:'Paciente',    en:'Patient'},

  'press.q4':  {es:'«¿Va a generar más ocasiones el rival que vosotros?»',                           en:'"Will the opponent create more chances than you?"'},
  'press.q4a0.text':  {es:'«No, vamos a dominar nosotros el partido.»',                              en:'"No, we\'re going to control the game."'},
  'press.q4a0.label': {es:'Dominante',   en:'Dominant'},
  'press.q4a1.text':  {es:'«Cada partido es distinto, lo veremos en el campo.»',                     en:'"Every match is different — we\'ll see on the pitch."'},
  'press.q4a1.label': {es:'Flexible',    en:'Flexible'},
  'press.q4a2.text':  {es:'«Es un rival fuerte, nos costará contenerlo.»',                           en:'"They\'re a strong side — it won\'t be easy to contain them."'},
  'press.q4a2.label': {es:'Respetuoso',  en:'Respectful'},

  'press.q5':  {es:'«¿Se va a decidir esto en los 90 minutos, sin penaltis?»',                       en:'"Will this be decided in 90 minutes, without penalties?"'},
  'press.q5a0.text':  {es:'«Sí, lo resolveremos en el tiempo reglamentario.»',                       en:'"Yes, we\'ll settle it in normal time."'},
  'press.q5a0.label': {es:'Seguro',      en:'Confident'},
  'press.q5a1.text':  {es:'«Lo importante es resolverlo, como sea.»',                                en:'"The important thing is to get it done, however it takes."'},
  'press.q5a1.label': {es:'Pragmático',  en:'Pragmatic'},
  'press.q5a2.text':  {es:'«Puede decidirse en los detalles, incluso en penaltis.»',                 en:'"It could come down to the fine margins — even penalties."'},
  'press.q5a2.label': {es:'Cauteloso',   en:'Cautious'},

  'press.q6':  {es:'«¿Vais a marcar más de un gol en este partido?»',                                en:'"Are you going to score more than one goal in this match?"'},
  'press.q6a0.text':  {es:'«Sí, tenemos gol en las botas.»',                                        en:'"Yes, we have goals in our boots."'},
  'press.q6a0.label': {es:'Ofensivo',    en:'Attacking'},
  'press.q6a1.text':  {es:'«Con uno nos conformamos si hace falta.»',                                en:'"One goal is enough if it comes to it."'},
  'press.q6a1.label': {es:'Pragmático',  en:'Pragmatic'},
  'press.q6a2.text':  {es:'«Va a costarnos encontrar el gol hoy.»',                                  en:'"It\'s going to be hard to find the net today."'},
  'press.q6a2.label': {es:'Cauteloso',   en:'Cautious'},

  'press.q7':  {es:'«¿Encajaréis dos goles o más en este partido?»',                                 en:'"Will you concede two goals or more in this match?"'},
  'press.q7a0.text':  {es:'«No, vamos a estar sólidos atrás.»',                                     en:'"No, we\'re going to be solid at the back."'},
  'press.q7a0.label': {es:'Defensivo',   en:'Defensive'},
  'press.q7a1.text':  {es:'«El fútbol siempre da sorpresas.»',                                       en:'"Football always throws up surprises."'},
  'press.q7a1.label': {es:'Filosófico',  en:'Philosophical'},
  'press.q7a2.text':  {es:'«El rival tiene mucho gol, puede pasar.»',                               en:'"They score a lot — it could happen."'},
  'press.q7a2.label': {es:'Realista',    en:'Realistic'},

  'press.q8':  {es:'«¿Terminará el partido en empate?»',                                             en:'"Will the match end in a draw?"'},
  'press.q8a0.text':  {es:'«No, vamos a buscar la victoria hasta el final.»',                        en:'"No, we\'ll chase the win until the final whistle."'},
  'press.q8a0.label': {es:'Ambicioso',   en:'Ambitious'},
  'press.q8a1.text':  {es:'«Cualquier resultado es posible en este torneo.»',                        en:'"Any result is possible in this tournament."'},
  'press.q8a1.label': {es:'Realista',    en:'Realistic'},
  'press.q8a2.text':  {es:'«Puede que ninguno consiga abrir la lata.»',                              en:'"It\'s possible neither side can break the deadlock."'},
  'press.q8a2.label': {es:'Cauteloso',   en:'Cautious'},

  'press.q9':  {es:'«¿Marcará alguno de vuestros delanteros estrella?»',                             en:'"Will any of your star forwards get on the scoresheet?"'},
  'press.q9a0.text':  {es:'«Sí, va a estar fino delante de la portería.»',                           en:'"Yes, he\'ll be sharp in front of goal."'},
  'press.q9a0.label': {es:'Confiado',    en:'Confident'},
  'press.q9a1.text':  {es:'«El gol es cosa de todo el equipo.»',                                    en:'"Goals are a team effort."'},
  'press.q9a1.label': {es:'Colectivo',   en:'Team-minded'},
  'press.q9a2.text':  {es:'«El rival lo va a tener vigilado de cerca.»',                             en:'"The opponent is going to mark him tightly."'},
  'press.q9a2.label': {es:'Precavido',   en:'Guarded'},

  'press.q10': {es:'«¿Va a ser un partido con mucho juego físico?»',                                 en:'"Is this going to be a physical match?"'},
  'press.q10a0.text': {es:'«No, queremos jugar al fútbol, no a la guerra.»',                         en:'"No, we want to play football, not a war."'},
  'press.q10a0.label':{es:'Conciliador', en:'Conciliatory'},
  'press.q10a1.text': {es:'«Eso lo decide el árbitro, no nosotros.»',                                en:'"That\'s for the referee to decide, not us."'},
  'press.q10a1.label':{es:'Evasivo',     en:'Evasive'},
  'press.q10a2.text': {es:'«Va a ser un partido muy disputado, sin duda.»',                          en:'"It\'s going to be a very contested match, no doubt."'},
  'press.q10a2.label':{es:'Realista',    en:'Realistic'},

  'press.q11': {es:'«¿Va a ser un partido de muchas ocasiones para ambos equipos?»',                 en:'"Is this going to be an open game with chances at both ends?"'},
  'press.q11a0.text': {es:'«Sí, esto va a ser ida y vuelta.»',                                      en:'"Yes, it\'s going to be end to end."'},
  'press.q11a0.label':{es:'Espectáculo', en:'Showman'},
  'press.q11a1.text': {es:'«Depende de cómo se plantee el partido.»',                               en:'"Depends on how the match sets up."'},
  'press.q11a1.label':{es:'Flexible',    en:'Flexible'},
  'press.q11a2.text': {es:'«Va a ser un partido cerrado y táctico.»',                               en:'"It\'s going to be a tight, tactical affair."'},
  'press.q11a2.label':{es:'Realista',    en:'Realistic'},

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
    es:'Hasta <strong>2 cambios 🪑</strong> por partido (ampliables con mejoras). Vigila lesiones ✚, sanciones 🚫 y la barra de <strong>Resistencia</strong> — descansa en el banquillo para recuperarla.',
    en:'Up to <strong>2 substitutions 🪑</strong> per match (upgradeable). Watch for injuries ✚, suspensions 🚫 and the <strong>Stamina</strong> bar — rest players on the bench to recover it.'
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

  /* ── RESULTADO — botones y etiquetas ── */
  'match.victory_pen':    {es:'¡VICTORIA EN PENALTIS!',  en:'PENALTY SHOOT-OUT WIN!'},
  'match.defeat_pen':     {es:'DERROTA EN PENALTIS',     en:'PENALTY SHOOT-OUT DEFEAT'},
  'match.end_tournament': {es:'FIN DEL TORNEO',          en:'END OF TOURNAMENT'},
  'match.see_summary':    {es:'VER RESUMEN FINAL',        en:'SEE FINAL SUMMARY'},
  'match.next_round':     {es:'SIGUIENTE RONDA',          en:'NEXT ROUND'},
  'match.new_game':       {es:'NUEVA PARTIDA',            en:'NEW GAME'},

  /* ── SIMULACIÓN DE PARTIDO — textos live ── */
  'match.play_btn':       {es:'JUGAR PARTIDO',            en:'PLAY MATCH'},
  'match.first_half':     {es:'1ª PARTE',                 en:'1ST HALF'},
  'match.second_half':    {es:'2ª PARTE',                 en:'2ND HALF'},
  'match.end':            {es:'FIN',                      en:'END'},
  'match.et_first':       {es:'PRÓRROGA 1ª',              en:'ET 1ST'},
  'match.et_second':      {es:'PRÓRROGA 2ª',              en:'ET 2ND'},
  'match.ht_sep':         {es:'Descanso — 45+{0}\'',      en:'Half time — 45+{0}\''},
  'match.et_ht_sep':      {es:'Descanso prórroga — 105\'',en:'Extra time break — 105\''},
  'match.et_sep':         {es:'— {0} —',                  en:'— {0} —'},
  'match.pen_win':        {es:'🏆 {0} gana la tanda {1}–{2}', en:'🏆 {0} wins the shoot-out {1}–{2}'},
  'match.pen_lose':       {es:'💔 {0} gana la tanda {1}–{2}', en:'💔 {0} wins the shoot-out {1}–{2}'},
  'match.foul_on':        {es:'falta sobre',              en:'foul on'},
  'match.injuries_short': {es:'⚠ Lesiones en {0}:',      en:'⚠ Injuries in {0}:'},
  'match.injury_leve':    {es:'leve (1 partido)',          en:'minor (1 match)'},
  'match.injury_basica':  {es:'básica (2 partidos)',       en:'moderate (2 matches)'},
  'match.injury_grave':   {es:'grave (3 partidos)',        en:'serious (3 matches)'},
  'match.cards_short':    {es:'📋 Tarjetas:',             en:'📋 Cards:'},
  'match.card_yellow_s':  {es:'amarilla',                 en:'yellow card'},
  'match.card_yellow2_s': {es:'2ª amarilla — sancionado', en:'2nd yellow — suspended'},
  'match.card_double_s':  {es:'doble amarilla — sancionado', en:'double yellow — suspended'},
  'match.card_red_s':     {es:'roja directa — sancionado',en:'straight red — suspended'},

  /* ── RESULTADO — score screen labels ── */
  'result.final_score':   {es:'PUNTUACIÓN FINAL',         en:'FINAL SCORE'},
  'result.score':         {es:'PUNTUACIÓN',               en:'SCORE'},
  'result.grade.legendary':{es:'LEGENDARIO',              en:'LEGENDARY'},
  'result.grade.elite':   {es:'ÉLITE',                    en:'ELITE'},
  'result.grade.excellent':{es:'EXCELENTE',               en:'EXCELLENT'},
  'result.grade.very_good':{es:'MUY BUENO',               en:'VERY GOOD'},
  'result.grade.good':    {es:'BUENO',                    en:'GOOD'},
  'result.grade.improvable':{es:'MEJORABLE',              en:'NEEDS WORK'},
  'result.vb.ovr':        {es:'Calidad del equipo (OVR {0})',          en:'Squad quality (OVR {0})'},
  'result.vb.goals':      {es:'Goles marcados ({0})',                  en:'Goals scored ({0})'},
  'result.vb.defense':    {es:'Solidez defensiva ({0} goles encajados)',en:'Defensive solidity ({0} goals conceded)'},
  'result.vb.morale':     {es:'Gestión de moral ({0}{1})',             en:'Morale management ({0}{1})'},
  'result.vb.clean':      {es:'Portería a cero ({0} partidos)',        en:'Clean sheets ({0} matches)'},
  'result.vb.stars':      {es:'Jugadores en posición ★ ({0}/11)',      en:'★ players in position ({0}/11)'},
  'result.vb.streaks':    {es:'Rachas de goleador',                    en:'Scorer streaks'},
  'result.vb.penalties':  {es:'Victorias en penaltis ({0})',           en:'Penalty shoot-out wins ({0})'},

  /* ── GRUPOS — tabla y mensajes ── */
  'result.groups_title':  {es:'FASE DE GRUPOS — RESULTADOS',           en:'GROUP STAGE — RESULTS'},
  'result.groups_table_intro': {es:'Así queda la tabla de tu grupo:',  en:'This is how your group table looks:'},
  'result.groups_continue':{es:'CONTINUAR',                            en:'CONTINUE'},
  'result.group_th_team': {es:'Equipo',    en:'Team'},
  'result.group_th_pld':  {es:'PJ',        en:'Pld'},
  'result.group_th_w':    {es:'G',         en:'W'},
  'result.group_th_d':    {es:'E',         en:'D'},
  'result.group_th_l':    {es:'P',         en:'L'},
  'result.group_th_pts':  {es:'Pts',       en:'Pts'},
  'result.qualified':     {es:'¡{0} clasificado para {1}! ({2}º del grupo)',  en:'{0} qualified for {1}! ({2}{3} in group)'},
  'result.eliminated_group':{es:'{0} eliminado en la fase de grupos ({1}º del grupo)', en:'{0} eliminated in the group stage ({1}{2} in group)'},
  'result.elim_groups_title': {es:'FASE DE GRUPOS',                    en:'GROUP STAGE'},
  'result.elim_groups_tag':   {es:'ELIMINADO EN FASE DE GRUPOS',       en:'ELIMINATED IN GROUP STAGE'},
  'result.elim_groups_text':  {es:'{0} no ha conseguido clasificarse entre los 2 primeros del grupo.', en:'{0} failed to finish in the top 2 of the group.'},
  'result.elim_ko_tag':   {es:'ELIMINADO EN {0}',                       en:'ELIMINATED IN {0}'},
  'result.chain_keep':    {es:'🔗 CONSERVAR {0} JUGADOR{1}',            en:'🔗 KEEP {0} PLAYER{1}'},
  'result.chain_info':    {es:'🔗 Run Encadenada: conserva {0} jugador{1} para el siguiente intento', en:'🔗 Chain Run: keep {0} player{1} for the next attempt'},

  /* ── LESIONES y TARJETAS en resultado ── */
  'result.injuries_title': {es:'⚠ Lesiones en {0} tras el partido:',   en:'⚠ Injuries in {0} after the match:'},
  'result.injury_note':    {es:'Recuerda: puedes hacer hasta <strong>{0} cambios</strong> entre Convocados y Banquillo antes del próximo partido. Hazlo manualmente desde las tablas de la izquierda.', en:'Remember: you can make up to <strong>{0} substitutions</strong> between Squad and Bench before the next match. Do it manually from the tables on the left.'},
  'result.injury.leve':    {es:'leve (1 partido)',    en:'minor (1 match)'},
  'result.injury.basica':  {es:'básica (2 partidos)', en:'moderate (2 matches)'},
  'result.injury.grave':   {es:'grave (3 partidos)',  en:'serious (3 matches)'},
  'result.injury_item':    {es:'lesión',              en:'injury'},
  'result.cards_title':    {es:'📋 Tarjetas en {0} tras el partido:',   en:'📋 Cards in {0} after the match:'},
  'result.card.yellow':    {es:'amarilla',            en:'yellow card'},
  'result.card.yellow2':   {es:'2ª amarilla (acumulación) — sancionado el próximo partido', en:'2nd yellow (accumulation) — suspended next match'},
  'result.card.double_yellow': {es:'doble amarilla — expulsado, sancionado el próximo partido', en:'double yellow — sent off, suspended next match'},
  'result.card.red':       {es:'roja directa — sancionado el próximo partido', en:'straight red — suspended next match'},

  /* ── HISTORIAL ── */
  'result.history_title':  {es:'RESULTADOS',          en:'RESULTS'},
  'result.match_progress_groups': {es:'FASE DE GRUPOS', en:'GROUP STAGE'},
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
  'draft.star_bonus':     {es:'★ Bonus posición +',      en:'★ Position bonus +'},

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
