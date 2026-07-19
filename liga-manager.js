/* ============================================================
   GOAL2GOAT — LIGA MANAGER (v0.4)
   ------------------------------------------------------------
   AÑADIDO EN ESTA VERSIÓN respecto a v0.3:
   - Dado del médico ahora en 3D DE VERDAD, con físicas reales
     (Cannon-es + Three.js, cargados solo cuando hace falta — ver
     liga-manager-dice3d.js, módulo aparte y autocontenido).
   - Fondo de dados por partido: 3 (cambiado desde el 2 que
     teníamos anotado en el diseño — Jesús lo confirmó explícitamente
     en esta sesión). Antes de tirar, se puede elegir cuántos de los
     dados disponibles se quieren invertir en el intento.
   - La ventana del dilema ya NO se cierra sola a los pocos segundos:
     ahora hay un botón "CONTINUAR" que hay que pulsar.
   - Campo (pitch) reutilizado tal cual de Copa Leyendas (mismo SVG),
     de momento decorativo/estructural — Liga Manager aún no tiene
     alineación ni posiciones de jugadores implementadas.
   - Tabla de clasificación con las zonas de descenso/Champions/
     Europa League/Conference resaltadas.

   SIGUE FUERA DE ALCANCE: editor de escudo por capas real,
   presupuesto/salarios/sobres, resto del cuerpo técnico, afinidad,
   potencial de entrenamiento, misiones de acumulación, alineación
   real sobre el campo. Persistencia sigue en localStorage.
   ============================================================ */
(function(){

  const SAVE_KEY = 'g2g_liga_manager_v11';
  // Identidad del club (nombre + escudo) — PERSISTE entre partidas, no se
  // pierde al abandonar/descender. Si ya existe, el flujo de entrada no
  // vuelve a pedir nombre ni escudo (solo liga y moneda cada vez).
  const IDENTITY_KEY = 'g2g_liga_manager_identity';
  const DICE_POOL_PER_MATCH = 3;

  /* ---------- 1. Equipos rivales — La Liga 2026-27 real, 19 clubes ---------- */
  const ESCUDOS_DIR='assets/escudos_liga_española/';
  const LM_RIVALS = [
    {id:'lm_1',  name:'Real Madrid',          attack:88, defense:85, pace:82, passing:88, technique:89, crestImg:ESCUDOS_DIR+'realmadrid.png'},
    {id:'lm_2',  name:'FC Barcelona',         attack:87, defense:83, pace:84, passing:89, technique:90, crestImg:ESCUDOS_DIR+'barcelona.png'},
    {id:'lm_3',  name:'Atlético de Madrid',   attack:84, defense:86, pace:80, passing:82, technique:81, crestImg:ESCUDOS_DIR+'atlmadrid.png'},
    {id:'lm_4',  name:'Athletic Club',        attack:78, defense:77, pace:76, passing:78, technique:77, crestImg:ESCUDOS_DIR+'athletic.png'},
    {id:'lm_5',  name:'Villarreal CF',        attack:79, defense:76, pace:75, passing:80, technique:79, crestImg:ESCUDOS_DIR+'villarreal.png'},
    {id:'lm_6',  name:'Real Betis',           attack:77, defense:74, pace:74, passing:78, technique:77, crestImg:ESCUDOS_DIR+'betis.png'},
    {id:'lm_7',  name:'Real Sociedad',        attack:76, defense:75, pace:74, passing:77, technique:76, crestImg:ESCUDOS_DIR+'realsociedad.png'},
    {id:'lm_8',  name:'Sevilla FC',           attack:74, defense:73, pace:72, passing:75, technique:74, crestImg:ESCUDOS_DIR+'sevilla.png'},
    {id:'lm_9',  name:'RC Celta',             attack:72, defense:70, pace:73, passing:74, technique:73, crestImg:ESCUDOS_DIR+'celta.png'},
    {id:'lm_10', name:'Valencia CF',          attack:71, defense:72, pace:70, passing:71, technique:71, crestImg:ESCUDOS_DIR+'valencia.png'},
    {id:'lm_11', name:'Rayo Vallecano',       attack:69, defense:70, pace:68, passing:68, technique:67, crestImg:ESCUDOS_DIR+'rayovallecano.png'},
    {id:'lm_12', name:'CA Osasuna',           attack:68, defense:71, pace:67, passing:66, technique:65, crestImg:ESCUDOS_DIR+'osasuna.png'},
    {id:'lm_13', name:'Getafe CF',            attack:66, defense:72, pace:65, passing:62, technique:61, crestImg:ESCUDOS_DIR+'getafe.png'},
    {id:'lm_14', name:'RCD Espanyol',         attack:65, defense:66, pace:66, passing:64, technique:64, crestImg:ESCUDOS_DIR+'espanyol.png'},
    {id:'lm_15', name:'Elche CF',             attack:62, defense:63, pace:61, passing:61, technique:60, crestImg:ESCUDOS_DIR+'elche.png'},
    {id:'lm_16', name:'Levante UD',           attack:61, defense:62, pace:60, passing:60, technique:59, crestImg:ESCUDOS_DIR+'levante.png'},
    {id:'lm_17', name:'Deportivo Alavés',     attack:64, defense:68, pace:63, passing:62, technique:61, crestImg:ESCUDOS_DIR+'alaves.png'},
    {id:'lm_18', name:'Racing de Santander',  attack:60, defense:61, pace:60, passing:59, technique:58, crestImg:ESCUDOS_DIR+'racingsantander.png'},
    {id:'lm_19', name:'RC Deportivo',         attack:61, defense:60, pace:61, passing:60, technique:60, crestImg:ESCUDOS_DIR+'deportivocoruna.png'}
  ];

  const MONEDAS = {
    EUR:{symbol:'€', label:'Euro'},
    GBP:{symbol:'£', label:'Libra'},
    USD:{symbol:'$', label:'Dólar'}
  };

  // Estado del campo de cada rival — no se simula partido a partido (los
  // rivales no tienen su propio departamento de mantenimiento gestionable),
  // se estima a partir de su nivel medio: los clubes con más presupuesto
  // suelen cuidar mejor sus instalaciones. Sirve tanto para mostrarlo en
  // la ficha del rival como para el efecto de clima+campo cuando jugamos
  // en su estadio.
  function campoRivalEstimado(rival){
    const media=(rival.attack+rival.defense+rival.pace+rival.passing+rival.technique)/5;
    return Math.max(30, Math.min(95, Math.round((media-58)*1.8+35)));
  }

  const LIGAS_DISPONIBLES = [
    {id:'es', nombre:'España — La Liga', flagImg:'assets/flags/1f1ea-1f1f8.png', activa:true},
    {id:'en', nombre:'Inglaterra — Premier League', flagImg:'assets/flags/1f1ec-1f1e7.png', activa:false},
    {id:'it', nombre:'Italia — Serie A', flagImg:'assets/flags/1f1ee-1f1f9.png', activa:false},
    {id:'de', nombre:'Alemania — Bundesliga', flagImg:'assets/flags/1f1e9-1f1ea.png', activa:false},
    {id:'fr', nombre:'Francia — Ligue 1', flagImg:'assets/flags/1f1eb-1f1f7.png', activa:false}
  ];

  // Zonas de la clasificación (posiciones 1-indexadas, 20 equipos, criterio
  // habitual de La Liga: 1-4 Champions, 5 Europa League, 6 Conference,
  // 18-20 descenso). Simplificado — la asignación real varía cada
  // temporada según plazas extra de coeficiente UEFA.
  function zonaClasificacion(pos){
    if(pos<=4) return 'champions';
    if(pos===5) return 'europa';
    if(pos===6) return 'conference';
    if(pos>=18) return 'descenso';
    return '';
  }

  const PITCH_SVG = `      <svg class="pitch-svg" viewBox="0 0 480 640" xmlns="http://www.w3.org/2000/svg">
        <rect width="480" height="640" fill="#2f7c42"/>
        <rect y="38" width="480" height="38" fill="#246f38"/>
        <rect y="114" width="480" height="38" fill="#246f38"/>
        <rect y="190" width="480" height="38" fill="#246f38"/>
        <rect y="266" width="480" height="38" fill="#246f38"/>
        <rect y="342" width="480" height="38" fill="#246f38"/>
        <rect y="418" width="480" height="38" fill="#246f38"/>
        <rect y="494" width="480" height="38" fill="#246f38"/>
        <rect y="570" width="480" height="38" fill="#246f38"/>
        <!-- halfway -->
        <line x1="0" y1="320" x2="480" y2="320" stroke="rgba(255,255,255,.5)" stroke-width="2"/>
        <circle cx="240" cy="320" r="73" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="2.5"/>
        <circle cx="240" cy="320" r="4" fill="rgba(255,255,255,.55)"/>
        <!-- top penalty area -->
        <rect x="100" y="0" width="280" height="105" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="2.5"/>
        <rect x="180" y="0" width="120" height="45" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="2.5"/>
        <circle cx="240" cy="65" r="4" fill="rgba(255,255,255,.55)"/>
        <path d="M210 105 A30 30 0 0 0 270 105" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="2.5"/>
        <!-- bottom penalty area -->
        <rect x="100" y="535" width="280" height="105" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="2.5"/>
        <rect x="180" y="595" width="120" height="45" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="2.5"/>
        <circle cx="240" cy="575" r="4" fill="rgba(255,255,255,.55)"/>
        <path d="M210 535 A30 30 0 0 1 270 535" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="2.5"/>
        <!-- corner flags - sharp corners, no border -->
        <line x1="0" y1="0" x2="480" y2="0" stroke="rgba(255,255,255,.3)" stroke-width="2"/>
        <line x1="0" y1="640" x2="480" y2="640" stroke="rgba(255,255,255,.3)" stroke-width="2"/>
        <line x1="0" y1="0" x2="0" y2="640" stroke="rgba(255,255,255,.3)" stroke-width="2"/>
        <line x1="480" y1="0" x2="480" y2="640" stroke="rgba(255,255,255,.3)" stroke-width="2"/>
      </svg>
`;

  /* ---------- 2. Mini-plantilla de ejemplo (para el Médico) ---------- */
  // Nombres reutilizados tanto para la plantilla inicial como para los
  // jugadores que salen de los sobres de fichajes del Director Deportivo.
  const NOMBRES_JUGADOR=["Álvaro","Adrián","Hugo","Mario","Pablo","Marcos","Diego","Sergio","Iker","Nacho","Bruno","Izan","Rubén","Guillermo","Álex","Raúl","Daniel","Carlos","Javier","Óscar"];
  const APELLIDOS_JUGADOR=["García","Fernández","López","Martínez","Sánchez","Pérez","Gómez","Ruiz","Díaz","Moreno","Torres","Ramos","Molina","Ortega","Vázquez","Serrano","Castro","Romero","Navarro","Iglesias"];
  // Nombres femeninos — el cuerpo técnico (médico, mantenimiento y los
  // dos directores) puede ser hombre o mujer; los jugadores de la
  // plantilla siguen siendo siempre hombres (mismos apellidos para
  // ambos géneros, solo cambia el nombre de pila).
  const NOMBRES_MUJER=["Ana","Laura","Marta","Sara","Elena","Lucía","Paula","Andrea","Carmen","Irene","Claudia","Sofía","Alba","Nuria","Cristina","Beatriz","Silvia","Patricia","Rocío","Julia"];
  function nombreTrabajadorAleatorio(){
    const genero = Math.random()<0.5 ? 'hombre' : 'mujer';
    const nombres = genero==='mujer' ? NOMBRES_MUJER : NOMBRES_JUGADOR;
    const nombre = nombres[Math.floor(Math.random()*nombres.length)]+' '+APELLIDOS_JUGADOR[Math.floor(Math.random()*APELLIDOS_JUGADOR.length)];
    return {nombre, genero};
  }
  function nombreJugadorAleatorio(usados){
    let nombre;
    do{ nombre=NOMBRES_JUGADOR[Math.floor(Math.random()*NOMBRES_JUGADOR.length)]+' '+APELLIDOS_JUGADOR[Math.floor(Math.random()*APELLIDOS_JUGADOR.length)]; }while(usados && usados.has(nombre));
    if(usados) usados.add(nombre);
    return nombre;
  }
  // Salario mensual a partir del overall — escala pensada para que una
  // plantilla modesta (48-65) cueste en torno a 150.000-200.000€/mes en
  // total, coherente con el capital inicial y el aforo modestos.
  function calcularSalario(overall){
    return Math.round(Math.max(1200, (overall-40)*260));
  }
  function generarMiniPlantilla(){
    const usados=new Set();
    function nombreUnico(){ return nombreJugadorAleatorio(usados); }
    function nuevoJugador(id, position, esSuplente){
      const overall=48+Math.floor(Math.random()*18); // 48-65, coherente con "plantilla modesta, recién ascendido"
      const variar=()=>Math.max(30,Math.min(80, overall+Math.floor(Math.random()*11)-5));
      return {
        id, name:nombreUnico(), position, overall,
        attack:variar(), defense:variar(), pace:variar(), passing:variar(), technique:variar(),
        fatigue:100, racha:0, esSuplente:!!esSuplente,
        injured:false, injuryWeeks:0, injurySeverity:null,
        salario:calcularSalario(overall)
      };
    }

    // 11 jugadores de plantilla principal (posiciones base del 4-3-3)
    const POSICIONES_TITULARES=["POR","DFC","DFC","LI","LD","MC","MC","MC","EI","ED","DC"];
    const plantilla=POSICIONES_TITULARES.map((pos,i)=>nuevoJugador('p'+i, pos, false));

    // Banquillo: 5 jugadores con posiciones al azar que NO se repiten
    // entre ellos (aunque sí puedan coincidir con alguna de los 11 de
    // arriba). Ampliable más adelante mediante mejoras.
    const TODAS_POSICIONES=["POR","DFC","LI","LD","MC","EI","ED","DC"];
    const posiciones=TODAS_POSICIONES.slice();
    for(let i=posiciones.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      const tmp=posiciones[i]; posiciones[i]=posiciones[j]; posiciones[j]=tmp;
    }
    posiciones.slice(0,5).forEach((pos,i)=>{ plantilla.push(nuevoJugador('b'+i, pos, true)); });

    return plantilla;
  }

  /* ---------- 3b. Formaciones seleccionables — a diferencia de Copa
     Leyendas (fija al empezar), aquí se puede elegir antes de cada
     partido. Coordenadas en % sobre el mismo campo (480×640). ---------- */
  /* ---------- 3b. Formaciones — MISMAS que en Copa Leyendas (3 categorías
     × 7 códigos cada una = 21 en total). Las coordenadas de cada posición
     se generan automáticamente a partir del código (ej. "4-2-3-1"), en
     vez de definir las 21 a mano — un generador genérico reparte cada
     línea de jugadores en el campo (480×640, igual que Copa Leyendas). ---------- */
  const FORMATION_CODES = {
    ofensiva:   ['3-4-3','3-4-1-2','4-2-4','4-3-3','4-2-3-1','3-5-2','2-3-5'],
    equilibrada:['4-4-2','4-3-3','4-1-4-1','4-2-3-1','4-3-1-2','3-5-2','4-5-1'],
    defensiva:  ['5-4-1','5-3-2','4-5-1','4-1-4-1','3-6-1','5-2-2-1','6-3-1']
  };
  const CAT_LABELS = {ofensiva:'OFENSIVA', equilibrada:'EQUILIBRADA', defensiva:'DEFENSIVA'};

  // Posición genérica de una línea — SOLO se usa como red de seguridad si
  // algún código de formación no estuviera en el FORMATION_LAYOUTS real de
  // Copa Leyendas (no debería pasar: los 21 códigos de FORMATION_CODES
  // están todos ahí), para no dejar nunca el campo sin generar.
  function posParaFila(rowIdx, nFilas, i, count){
    if(rowIdx===0){
      if(count>=2 && i===0) return 'LI';
      if(count>=2 && i===count-1) return 'LD';
      return 'DFC';
    }
    if(rowIdx===nFilas-1){
      if(count>=3 && i===0) return 'EI';
      if(count>=3 && i===count-1) return 'ED';
      return 'DC';
    }
    if(count>=4 && i===0) return 'EI';
    if(count>=4 && i===count-1) return 'ED';
    return 'MC';
  }
  function generarSlotsFormacionFallback(code){
    const filas=code.split('-').map(n=>parseInt(n,10));
    const slots=[{slot:'POR', x:50, y:90.6}];
    const nFilas=filas.length;
    const contador={};
    filas.forEach((count,rowIdx)=>{
      const y = 75 - (nFilas<=1?0:(rowIdx/(nFilas-1))*55);
      for(let i=0;i<count;i++){
        const x = count===1?50:10+(i/(count-1))*80;
        const base=posParaFila(rowIdx,nFilas,i,count);
        contador[base]=(contador[base]||0)+1;
        slots.push({slot:base+contador[base], x, y});
      }
    });
    return slots;
  }
  // Generación REAL de las posiciones: CALCO exacto de Copa Leyendas — se
  // reutiliza literalmente su buildFormationSlots()/FORMATION_LAYOUTS (líneas
  // arqueadas, no rectas, y coordenadas idénticas a las del campo de Copa
  // Leyendas), disponibles como globales porque game.js se carga antes que
  // este archivo. Solo se añade un sufijo numérico a cada etiqueta repetida
  // para tener una clave única por posición (Liga Manager necesita guardar
  // la alineación como diccionario serializable, a diferencia de Copa
  // Leyendas que la guarda en el propio DOM).
  function generarSlotsFormacion(code){
    if(typeof buildFormationSlots!=='function' || !FORMATION_LAYOUTS[code]){
      return generarSlotsFormacionFallback(code);
    }
    const layout=buildFormationSlots(code);
    const contador={};
    return layout.map(s=>{
      contador[s.label]=(contador[s.label]||0)+1;
      return {slot:s.label+contador[s.label], x:s.left, y:s.top};
    });
  }
  function formacionActual(){
    const code=(state.formacionCode)||'4-3-3';
    return {code, slots:generarSlotsFormacion(code)};
  }

  // Media de las 5 categorías de los titulares asignados (si no hay
  // ninguno asignado todavía, usa la media de toda la plantilla como
  // valor por defecto, para que la simulación nunca se quede sin datos).
  function calcularStatsEquipo(){
    const ids=Object.values(state.alineacion||{}).filter(Boolean);
    const titulares = ids.map(id=>state.plantilla.find(p=>p.id===id)).filter(p=>p && !p.injured);
    const base = titulares.length ? titulares : state.plantilla.filter(p=>!p.injured);
    const baseFinal = base.length ? base : state.plantilla; // último recurso: si toda la plantilla está lesionada
    const suma = {attack:0,defense:0,pace:0,passing:0,technique:0};
    baseFinal.forEach(p=>{ suma.attack+=p.attack; suma.defense+=p.defense; suma.pace+=p.pace; suma.passing+=p.passing; suma.technique+=p.technique; });
    const n=baseFinal.length||1;
    return {attack:suma.attack/n, defense:suma.defense/n, pace:suma.pace/n, passing:suma.passing/n, technique:suma.technique/n};
  }


  /* ---------- 3. Calendario ida/vuelta (método del círculo) ---------- */
  function generarCalendario(teams){
    const n=teams.length, rounds=n-1, half=n/2;
    let arr=teams.slice(1);
    const ida=[];
    for(let r=0;r<rounds;r++){
      const roundTeams=[teams[0],...arr];
      const round=[];
      for(let i=0;i<half;i++){
        const a=roundTeams[i], b=roundTeams[n-1-i];
        round.push(r%2===0 ? {home:a,away:b} : {home:b,away:a});
      }
      ida.push(round);
      arr.unshift(arr.pop());
    }
    const vuelta=ida.map(round=>round.map(p=>({home:p.away,away:p.home})));
    return [...ida,...vuelta];
  }

  /* ---------- 4. Simulación de un partido (motor genérico reutilizado) ---------- */
  // Efecto de clima+campo sobre el resultado — un campo bien cuidado
  // mitiga buena parte del impacto del mal tiempo para el equipo QUE
  // JUEGA EN SU CASA (lo conoce, entrena en él); el visitante sufre el
  // impacto completo del clima, algo agravado si además el campo del
  // anfitrión está descuidado (peor agarre, terreno irregular).
  function factorClimaCampo(weatherId, campoAnfitrion, esAnfitrion){
    if(!weatherId || weatherId==='cloudy' || campoAnfitrion===undefined) return 1;
    const impacto={sunny:0.02, rain:0.07, wind:0.035, hot:0.055, snow:0.06}[weatherId] || 0;
    if(esAnfitrion){
      const mitigacion=(campoAnfitrion/100)*0.75; // un campo perfecto mitiga hasta el 75% del impacto del clima
      return 1-(impacto*(1-mitigacion));
    }
    const agravante=1+(100-campoAnfitrion)/100*0.4; // hasta un 40% más de impacto si el campo rival está muy descuidado
    return 1-(impacto*agravante);
  }
  function simularPartido(teamA, teamB, contexto){
    const statsA = teamA.id==='lm_0' ? calcularStatsEquipo() : {attack:teamA.attack,defense:teamA.defense,pace:teamA.pace,passing:teamA.passing,technique:teamA.technique};
    const statsB = teamB.id==='lm_0' ? calcularStatsEquipo() : {attack:teamB.attack,defense:teamB.defense,pace:teamB.pace,passing:teamB.passing,technique:teamB.technique};
    const mod=window.tacticalModifier(statsA,statsB);
    let lambdaA=Math.max(0.25, 1.15+mod.myScoreMod);
    let lambdaB=Math.max(0.25, 1.15+mod.oppScoreMod);
    if(contexto && contexto.climaId){
      lambdaA=Math.max(0.15, lambdaA*factorClimaCampo(contexto.climaId, contexto.campoAnfitrion, contexto.anfitrionA));
      lambdaB=Math.max(0.15, lambdaB*factorClimaCampo(contexto.climaId, contexto.campoAnfitrion, !contexto.anfitrionA));
    }
    if(contexto && contexto.moralBonus){
      // Mismo espíritu que moraleLambdaBonus() en Copa Leyendas, pero más
      // moderado (±0.08 frente a ±0.15) al ya sumarse al efecto de
      // clima+campo — solo afecta a MI equipo, nunca al rival.
      if(contexto.esMiEquipoA) lambdaA=Math.max(0.15, lambdaA+contexto.moralBonus);
      else lambdaB=Math.max(0.15, lambdaB+contexto.moralBonus);
    }
    const golesA=window.poissonSample(lambdaA);
    const golesB=window.poissonSample(lambdaB);
    return {golesA,golesB};
  }

  /* ---------- 5. Estado persistente (localStorage, prototipo) ---------- */
  let state=null;
  let setupStep=1;
  let formacionCategoriaVista=null; // categoría que se está viendo en el selector (no siempre coincide con la activa)
  let seleccionJugador=null; // id del jugador seleccionado en la plantilla/banquillo/campo, a la espera del segundo clic
  // Ordenación de la tabla PLANTILLA — mismo sistema de 3 modos que
  // CONVOCADOS en Copa Leyendas (LLEGADA/POSICIÓN/PUNTOS, un botón cíclico).
  let lmSortMode='position';
  const LM_SORT_LABELS={arrival:'LLEGADA', position:'POSICIÓN', rating:'PUNTOS'};
  const LM_SORT_NEXT={arrival:'position', position:'rating', rating:'arrival'};
  let clasifColapsada=true; // la clasificación empieza contraída, igual que el glosario de Copa Leyendas
  let setupData={liga:'es', moneda:null, nombre:'', escudo:null};

  function nuevoEstadoSinEmpezar(){ return { setupComplete:false }; }

  // Deriva la posición "genérica" de un slot de formación (quita el
  // número final y aplica algún alias) para poder casarlo con la
  // posición natural de un jugador, sea cual sea la formación elegida.
  function basePos(slotCode){
    const sinNumero=slotCode.replace(/[0-9]/g,'');
    const alias={MI:'EI', MD:'ED'};
    return alias[sinNumero]||sinNumero;
  }

  // Alineación automática de partida: coloca a cada jugador generado en
  // el primer hueco de su posición natural — así el equipo no arranca
  // con el campo vacío, aunque luego se pueda cambiar a mano.
  function alineacionAutomatica(plantilla, slots){
    const usados=new Set();
    const alineacion={};
    // 1ª pasada: casar por posición natural exacta.
    slots.forEach(def=>{
      const posGenerica=basePos(def.slot);
      const candidato=plantilla.find(p=>!usados.has(p.id) && p.position===posGenerica);
      if(candidato){ alineacion[def.slot]=candidato.id; usados.add(candidato.id); }
    });
    // 2ª pasada: si una formación pide más jugadores de una posición de
    // los que hay en la plantilla con esa posición EXACTA (ej. una
    // formación con 2 DC cuando solo se generó 1 DC natural), el hueco
    // se rellena con cualquier jugador que quede libre — igual que en
    // Copa Leyendas nunca queda una posición vacía en el campo: se
    // acepta la penalización de jugar fuera de posición antes que dejar
    // un hueco sin nadie (y sin nombre) como pasaba antes.
    slots.forEach(def=>{
      if(alineacion[def.slot]) return;
      const candidato=plantilla.find(p=>!usados.has(p.id));
      if(candidato){ alineacion[def.slot]=candidato.id; usados.add(candidato.id); }
    });
    return alineacion;
  }

  // Rating efectivo — CALCO de effRating() de Copa Leyendas: penaliza un
  // 15% si el jugador juega fuera de su posición natural, un 40% extra
  // si está lesionado, y aplica el mismo factor de fatiga por resistencia
  // (sin penalización por encima de 75, hasta -30% con la barra a 0).
  function getFatigueFactorLM(p){
    const f=(p.fatigue===undefined)?100:p.fatigue;
    if(f>=75) return 1;
    return Math.max(0.70, Math.min(1, 0.70+(f/75)*0.30));
  }
  function efectivoOverall(p){
    const base=p.overall||70;
    const slot=slotDeJugador(p.id);
    const inPos=!slot || basePos(slot)===p.position;
    const positionFactor=inPos?1:0.85;
    const injuryFactor=p.injured?0.6:1;
    const fatigueFactor=getFatigueFactorLM(p);
    return Math.round(base*positionFactor*injuryFactor*fatigueFactor);
  }

  // Estadísticas de equipo — misma interfaz visual de "PERFIL DEL EQUIPO"
  // que Copa Leyendas (ATAQUE/DEFENSA/RITMO/PASE/TÉCNICA + nota media),
  // pero calculada como la media de TODA la plantilla (16 jugadores), no
  // solo de los 11 titulares — así refleja el fondo de armario real.
  function calcularStatsEquipoLM(){
    const lista=state.plantilla||[];
    if(!lista.length) return {attack:0,defense:0,pace:0,passing:0,technique:0,overall:0};
    const n=lista.length;
    const sum=lista.reduce((acc,p)=>{
      acc.attack+=p.attack; acc.defense+=p.defense; acc.pace+=p.pace;
      acc.passing+=p.passing; acc.technique+=p.technique; acc.overall+=p.overall;
      return acc;
    }, {attack:0,defense:0,pace:0,passing:0,technique:0,overall:0});
    return {
      attack:Math.round(sum.attack/n), defense:Math.round(sum.defense/n), pace:Math.round(sum.pace/n),
      passing:Math.round(sum.passing/n), technique:Math.round(sum.technique/n), overall:Math.round(sum.overall/n)
    };
  }

  function empezarTemporada(nombreEquipo, moneda, liga, escudo){
    const miEquipo={id:'lm_0', name:nombreEquipo};
    const teams=[miEquipo, ...LM_RIVALS];
    const plantilla=generarMiniPlantilla();
    state={
      setupComplete:true,
      liga, moneda, nombreEquipo, escudo,
      jornadaActual:1,
      calendario:generarCalendario(teams),
      resultados:{},
      plantilla,
      formacionCategoria:'equilibrada',
      formacionCode:'4-3-3',
      alineacion:alineacionAutomatica(plantilla, generarSlotsFormacion('4-3-3')),
      medicoNotificacion:null,
      diceAvailable:DICE_POOL_PER_MATCH,
      medicoCartas:[],
      medicoCambioUsado:false,
      medicoCartasAgotadas:[],
      medicoBonos:{},
      medicoHistorial:[],
      medicoNiveles:{curacionMuscular:0, curacionOsea:0, prevencionMuscular:0, prevencionOsea:0},
      // Aforo inicial deliberadamente modesto — un club recién ascendido a
      // Primera no suele tener un estadio grande (referencia real: Eibar
      // ~8.000, Huesca ~7.600, Leganés ~12.500). Se podrá ampliar más
      // adelante con mejoras del cuerpo técnico, todavía no implementado.
      estadio:{campo:90, satisfaccion:10, aforoTotal:12000, ultimaAsistencia:null},
      moral:0,
      rachaResultados:0,
      mantenimientoCartas:[],
      mantenimientoCambioUsado:false,
      mantenimientoCartasAgotadas:[],
      mantenimientoHistorial:[],
      mantenimientoNiveles:{prevencionDesgaste:0, recuperacionCesped:0, boostSatisfaccion:0, proteccionSatisfaccion:0},
      dadoRerollsDisponibles:1,
      // ---- Economía ----
      // Capital inicial modesto, coherente con un recién ascendido: dos o
      // tres meses de margen antes de que la nómina apriete de verdad.
      capital:400000,
      precioEntrada:15,
      mesesPagados:0,
      finanzasHistorial:[],
      directorGeneralCartas:[],
      directorGeneralCambioUsado:false,
      directorGeneralCartasAgotadas:[],
      directorGeneralHistorial:[],
      directorGeneralNiveles:{aforoExtra:0, ingresoPatrocinio:0, ingresoMerchandising:0, toleranciaPrecio:0},
      directorDeportivoCartas:[],
      directorDeportivoCambioUsado:false,
      directorDeportivoCartasAgotadas:[],
      directorDeportivoHistorial:[],
      directorDeportivoNiveles:{calidadOjeo:0, ahorroSalarial:0, sobresFichajes:0, costeSobres:0},
      // ---- Trabajadores del cuerpo técnico ----
      trabajadores:{
        medico:null,
        mantenimiento:null,
        directorGeneral:null,
        directorDeportivo:null
      },
      candidatosTrabajo:[],
      mesTrabajadoresGenerado:0
    };
    state.medicoCartas = inicializarCartasMedico();
    state.mantenimientoCartas = inicializarCartasMantenimiento();
    state.directorGeneralCartas = inicializarCartasDG();
    state.directorDeportivoCartas = inicializarCartasDD();
    guardarEstado();
  }


  function cargarEstado(){
    try{
      const raw=localStorage.getItem(SAVE_KEY);
      if(raw) return JSON.parse(raw);
    }catch(e){}
    return nuevoEstadoSinEmpezar();
  }
  function guardarEstado(){ try{ localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }catch(e){} }
  function borrarEstado(){ try{ localStorage.removeItem(SAVE_KEY); }catch(e){} }

  /* ---------- 6. Identidad persistente (nombre+escudo) — separada del
     progreso de la run (SAVE_KEY). Se guarda cuando se confirma en el
     flujo de entrada, y se reutiliza automáticamente en la siguiente
     partida sin volver a preguntar, tal como pidió Jesús. ---------- */
  function cargarIdentidad(){
    try{
      const raw=localStorage.getItem(IDENTITY_KEY);
      if(raw) return JSON.parse(raw);
    }catch(e){}
    return null;
  }
  function guardarIdentidad(nombre, crest){
    try{ localStorage.setItem(IDENTITY_KEY, JSON.stringify({nombre, crest})); }catch(e){}
  }
  // Si todavía no hay identidad propia de Liga Manager guardada (primera
  // vez que se entra), se reutiliza la preferencia global ya definida en
  // Ajustes de Copa Leyendas (checkbox "usar siempre como nombre de
  // equipo" + el escudo guardado) — así no se pregunta dos veces lo
  // mismo si el jugador ya lo dejó configurado ahí.
  function identidadPorDefecto(){
    const propia=cargarIdentidad();
    if(propia && propia.nombre && propia.crest) return propia;
    if(window.useFixedTeamName && window.preferredTeamName){
      const crestGlobal = window._myCrestImage
        ? {type:'image', data:window._myCrestImage}
        : (window._myCrestData ? {type:'layers', data:window._myCrestData} : null);
      if(crestGlobal) return {nombre:window.preferredTeamName, crest:crestGlobal};
    }
    return null;
  }

  // Escudo — reutiliza DE VERDAD el motor de dibujo de crest-editor.js
  // (buildCrestSVGInner vía renderCrestThumb), tanto para el escudo por
  // capas como para una imagen subida. Nunca toca window._myCrestData
  // (eso es de Copa Leyendas) — aquí solo se LEE con datos propios.
  function crestHTML(crest, sizePx){
    sizePx=sizePx||28;
    if(!crest) return `<i class="ph ph-bold ph-shield" style="font-size:${sizePx*0.6}px;color:#888"></i>`;
    if(crest.type==='image'){
      return `<img src="${crest.data}" style="width:${sizePx}px;height:${sizePx}px;object-fit:cover;border-radius:4px;vertical-align:middle">`;
    }
    if(crest.type==='layers' && typeof window.renderCrestThumb==='function'){
      return window.renderCrestThumb(sizePx, crest.data);
    }
    return `<i class="ph ph-bold ph-shield" style="font-size:${sizePx*0.6}px;color:#888"></i>`;
  }
  function rivalCrestHTML(sizePx, crestImg){
    sizePx=sizePx||28;
    if(crestImg) return `<img src="${crestImg}" alt="" style="width:${sizePx}px;height:${sizePx}px;object-fit:contain;vertical-align:middle">`;
    return `<i class="ph ph-bold ph-shield" style="font-size:${sizePx*0.6}px;color:#8a95a0"></i>`;
  }

  // Clima del próximo partido — reutiliza LITERALMENTE el catálogo
  // WEATHER_TYPES de Copa Leyendas (mismas probabilidades, mismos
  // textos/iconos) en vez de duplicarlo, ya que game.js se carga antes
  // que este archivo y queda accesible como global. Se sortea una vez
  // por jornada (no en cada render) y se guarda en el estado.
  function climaDelPartido(){
    if(typeof WEATHER_TYPES==='undefined') return null;
    if(state.climaJornada!==state.jornadaActual || !state.climaId){
      const pesos=[2,2,1,1.5,1,0.6]; // mismo orden/pesos que rollWeather(): sunny,cloudy,rain,wind,hot,snow
      const total=pesos.reduce((a,b)=>a+b,0);
      let r=Math.random()*total, idx=1;
      for(let i=0;i<pesos.length;i++){ r-=pesos[i]; if(r<=0){ idx=i; break; } }
      state.climaJornada=state.jornadaActual;
      state.climaId=(WEATHER_TYPES[idx]||WEATHER_TYPES[1]).id;
      guardarEstado();
    }
    return WEATHER_TYPES.find(w=>w.id===state.climaId) || WEATHER_TYPES[1];
  }
  function weatherDisplayHTML(clima){
    if(!clima) return '';
    return `<div class="weather-display" style="display:flex">
      <span class="weather-icon">${clima.label.split(' ')[0]}</span>
      <div class="weather-block">
        <span>${clima.label.slice(clima.label.indexOf(' ')+1)}</span>
        <span class="weather-desc">${clima.desc}</span>
      </div>
    </div>`;
  }
  // Efecto visual del clima sobre el campo de Liga Manager — CALCO exacto
  // de applyPitchWeatherVisual() de Copa Leyendas (mismas clases CSS:
  // weather-fx-X/weather-sheen/weather-drop/weather-splash/weather-flake/
  // weather-gust, todas genéricas y no atadas al #pitch de Copa Leyendas),
  // aplicado sobre #lmPitchBox/#lmWeatherLayer en vez de #pitch.
  function aplicarClimaVisualLM(weatherId){
    const pitch=document.getElementById('lmPitchBox');
    const layer=document.getElementById('lmWeatherLayer');
    if(!pitch||!layer) return;
    pitch.className = pitch.className.replace(/\bweather-fx-\S+/g, '').trim();
    layer.innerHTML='';
    if(!weatherId || weatherId==='cloudy') return;
    pitch.classList.add('weather-fx-'+weatherId);
    if(weatherId==='rain' || weatherId==='hot' || weatherId==='sunny'){
      const sheen=document.createElement('div');
      sheen.className='weather-sheen';
      layer.appendChild(sheen);
    }
    if(weatherId==='rain'){
      for(let i=0;i<40;i++){
        const drop=document.createElement('div');
        drop.className='weather-drop';
        const left=Math.random()*100, duration=0.5+Math.random()*0.4;
        const negDelay=-Math.random()*duration;
        drop.style.left=left+'%';
        drop.style.animationDuration=duration+'s';
        drop.style.animationDelay=negDelay+'s';
        drop.style.opacity=0.4+Math.random()*0.4;
        layer.appendChild(drop);
        const splash=document.createElement('div');
        splash.className='weather-splash';
        splash.style.left=left+'%'; splash.style.top=(10+Math.random()*82)+'%';
        splash.style.animationDuration=(0.9+Math.random()*0.8)+'s';
        splash.style.animationDelay=(-Math.random()*1.6)+'s';
        layer.appendChild(splash);
      }
    }
    if(weatherId==='snow'){
      for(let i=0;i<28;i++){
        const flake=document.createElement('div');
        flake.className='weather-flake';
        const left=Math.random()*100, duration=3+Math.random()*3, size=6+Math.random()*7;
        const negDelay=-Math.random()*duration;
        flake.textContent='❄';
        flake.style.left=left+'%';
        flake.style.fontSize=size+'px';
        flake.style.animationDuration=duration+'s';
        flake.style.animationDelay=negDelay+'s';
        flake.style.opacity=0.55+Math.random()*0.4;
        layer.appendChild(flake);
      }
    }
    if(weatherId==='wind'){
      for(let i=0;i<3;i++){
        const gust=document.createElement('div');
        gust.className='weather-gust';
        gust.style.animationDelay=(i*1.1)+'s';
        layer.appendChild(gust);
      }
    }
  }

  /* Abre el editor de escudos REAL de Copa Leyendas (crest-editor.js), sin
     modificarlo ni un carácter: se intercambia temporalmente el estado
     global que usa (window._myCrestData / _myCrestImage) y se sustituyen
     sus funciones de guardado por unas propias que escriben en la
     identidad de Liga Manager en vez de en Firestore/Copa Leyendas. Al
     cerrar el editor (detectado por sondeo, ya que no expone un evento
     de cierre), se restaura todo tal como estaba. */
  function openLigaManagerCrestEditor(nombreActual, crestActual, onDone){
    if(typeof window.openCrestEditor !== 'function'){
      if(typeof window.showToast==='function') window.showToast('El editor de escudos no está disponible', 'toast-neutral');
      return;
    }
    const prevData = window._myCrestData;
    const prevImage = window._myCrestImage;
    const prevSaveData = window.saveMyCrestData;
    const prevSaveImage = window.saveMyCrestImage;
    const nameInput = document.getElementById('preferredTeamNameInput');
    const prevNameVal = nameInput ? nameInput.value : null;

    window._myCrestData = (crestActual && crestActual.type==='layers') ? crestActual.data : null;
    window._myCrestImage = (crestActual && crestActual.type==='image') ? crestActual.data : null;
    if(nameInput) nameInput.value = nombreActual || '';

    let guardado = null;
    window.saveMyCrestData = async function(data){
      window._myCrestData = data; window._myCrestImage = null;
      guardado = {type:'layers', data};
      if(typeof window.refreshAllCrestThumbs==='function') window.refreshAllCrestThumbs();
    };
    window.saveMyCrestImage = async function(dataUrl){
      window._myCrestImage = dataUrl; window._myCrestData = null;
      guardado = {type:'image', data:dataUrl};
      if(typeof window.refreshAllCrestThumbs==='function') window.refreshAllCrestThumbs();
    };

    function restaurar(){
      window._myCrestData = prevData;
      window._myCrestImage = prevImage;
      window.saveMyCrestData = prevSaveData;
      window.saveMyCrestImage = prevSaveImage;
      if(nameInput) nameInput.value = prevNameVal;
      if(typeof window.refreshAllCrestThumbs==='function') window.refreshAllCrestThumbs();
    }

    window.openCrestEditor();

    // El editor no expone un callback/evento de cierre — se sondea la
    // presencia de su overlay para saber cuándo el jugador ha terminado.
    const poll=setInterval(function(){
      if(!document.getElementById('crestEditorOverlay')){
        clearInterval(poll);
        restaurar();
        onDone(guardado || crestActual);
      }
    }, 250);
  }

  /* ---------- 7. Clasificación calculada a partir de resultados ---------- */
  function calcularClasificacion(){
    const teams=[{id:'lm_0',name:state.nombreEquipo}, ...LM_RIVALS];
    const tabla={};
    teams.forEach(t=>{ tabla[t.id]={id:t.id,name:t.name,crestImg:t.crestImg,pj:0,pg:0,pe:0,pp:0,gf:0,gc:0,pts:0}; });
    for(let j=0;j<state.jornadaActual-1;j++){
      state.calendario[j].forEach(partido=>{
        const key=j+'-'+partido.home.id+'-'+partido.away.id;
        const res=state.resultados[key];
        if(!res) return;
        const home=tabla[partido.home.id], away=tabla[partido.away.id];
        home.pj++; away.pj++;
        home.gf+=res.golesA; home.gc+=res.golesB;
        away.gf+=res.golesB; away.gc+=res.golesA;
        if(res.golesA>res.golesB){ home.pg++; home.pts+=3; away.pp++; }
        else if(res.golesA<res.golesB){ away.pg++; away.pts+=3; home.pp++; }
        else{ home.pe++; away.pe++; home.pts++; away.pts++; }
      });
    }
    return Object.values(tabla).sort((a,b)=> b.pts-a.pts || (b.gf-b.gc)-(a.gf-a.gc) || b.gf-a.gf);
  }

  /* ---------- 8. Jugar la jornada actual ---------- */
  /* ---------- 8. Generar eventos del partido: goles con GOLEADOR real
     (de tu alineación, con sesgo hacia posiciones ofensivas) + posible
     lesión durante el propio partido — todo con minuto real, igual que
     hace Copa Leyendas, en vez de un aviso aparte tras la jornada. ---------- */
  function elegirGoleador(){
    const idsAlineados=Object.values(state.alineacion||{}).filter(Boolean);
    const titulares=idsAlineados.map(id=>state.plantilla.find(p=>p.id===id)).filter(p=>p && !p.injured);
    if(!titulares.length) return null;
    const ofensivos=titulares.filter(p=>['DC','EI','ED','MC'].includes(p.position));
    const pool = ofensivos.length ? ofensivos : titulares;
    return pool[Math.floor(Math.random()*pool.length)];
  }

  function elegirJugadorAlineado(excluirIds){
    excluirIds = excluirIds || new Set();
    const idsAlineados=Object.values(state.alineacion||{}).filter(Boolean).filter(id=>!excluirIds.has(id));
    const titulares=idsAlineados.map(id=>state.plantilla.find(p=>p.id===id)).filter(p=>p && !p.injured);
    if(!titulares.length) return null;
    return titulares[Math.floor(Math.random()*titulares.length)];
  }

  function generarEventosPartido(resultado, miEsLocal, campoRelevante){
    // "home"/"away" se refiere SIEMPRE al equipo local/visitante real del
    // partido — mi equipo puede ser cualquiera de los dos según el
    // calendario. Antes se asumía que "home" era siempre yo, así que
    // cuando jugaba fuera mis propios goleadores/tarjetas/lesiones
    // aparecían del lado del rival.
    const misLado = miEsLocal ? 'home' : 'away';
    const rivalLado = miEsLocal ? 'away' : 'home';
    const eventos=[];
    for(let i=0;i<resultado.golesA;i++){
      const goleador = miEsLocal ? elegirGoleador() : null;
      eventos.push({minute:5+Math.floor(Math.random()*85), team:'home', type:'goal', jugador:goleador});
    }
    for(let i=0;i<resultado.golesB;i++){
      const goleador = miEsLocal ? null : elegirGoleador();
      eventos.push({minute:5+Math.floor(Math.random()*85), team:'away', type:'goal', jugador:goleador});
    }
    // Tarjetas amarillas/rojas — de momento solo informativas (sin
    // sanción de partidos todavía), con nombre real si es tu jugador.
    if(Math.random()<0.35){
      const jugador=elegirJugadorAlineado();
      eventos.push({minute:10+Math.floor(Math.random()*78), team:misLado, type:'card', tarjeta:'amarilla', jugador: jugador||{name:state.nombreEquipo}});
    }
    if(Math.random()<0.35){
      eventos.push({minute:10+Math.floor(Math.random()*78), team:rivalLado, type:'card', tarjeta:'amarilla', jugador:{name:'Rival'}});
    }
    if(Math.random()<0.06){
      const jugador=elegirJugadorAlineado();
      eventos.push({minute:20+Math.floor(Math.random()*68), team:misLado, type:'card', tarjeta:'roja', jugador: jugador||{name:state.nombreEquipo}});
    }
    // Lesión: puede pasar DURANTE tu propio partido, no como aviso aparte
    // después de la jornada — mismo espíritu que Copa Leyendas. Existen dos
    // FAMILIAS de lesión independientes (muscular: musculares, esguinces y
    // ligamentos / ósea: fisuras, fracturas y menisco), cada una con su
    // propio riesgo de aparición y velocidad de curación, moduladas por los
    // niveles de equipo médico correspondientes (state.medicoNiveles).
    const nivelesMed=state.medicoNiveles||{};
    const bonos=state.medicoBonos||{};
    // Un césped descuidado aumenta el riesgo de lesión — se usa el estado
    // del campo relevante para este partido (el propio si juegas en casa,
    // el del rival si juegas fuera), hasta un +40% con el campo a 0.
    const factorCampo = (campoRelevante===undefined||campoRelevante===null) ? 1 : (1+Math.max(0,(100-campoRelevante))*0.004);
    const riesgoBase=0.18*(bonos.riesgoLesionSiguiente||1)*factorCampo;
    if(bonos.riesgoLesionSiguiente){ state.medicoBonos.riesgoLesionSiguiente=1; } // se consume tras un partido
    const riesgoMuscular=riesgoBase*0.55*Math.pow(0.85, nivelesMed.prevencionMuscular||0);
    const riesgoOsea=riesgoBase*0.45*Math.pow(0.85, nivelesMed.prevencionOsea||0);
    if(!state.medicoNotificacion && Math.random()<(riesgoMuscular+riesgoOsea)){
      const idsAlineados=Object.values(state.alineacion||{}).filter(Boolean);
      const titularesSanos=idsAlineados.map(id=>state.plantilla.find(p=>p.id===id)).filter(p=>p && !p.injured);
      const pool = titularesSanos.length ? titularesSanos : state.plantilla.filter(p=>!p.injured);
      if(pool.length){
        const jugador=pool[Math.floor(Math.random()*pool.length)];
        const familia = Math.random()<(riesgoMuscular/(riesgoMuscular+riesgoOsea)) ? 'muscular' : 'osea';
        const TIPOS_LESION_POR_FAMILIA={
          muscular:{
            leve:['Sobrecarga muscular','Molestias en el isquiotibial','Contractura en el gemelo'],
            moderada:['Distensión muscular','Esguince de tobillo','Elongación en el aductor'],
            grave:['Rotura fibrilar','Rotura de ligamentos','Rotura del ligamento cruzado']
          },
          osea:{
            leve:['Contusión ósea en la tibia','Molestias en el pubis','Golpe óseo en el tobillo'],
            moderada:['Fisura costal','Inflamación del menisco','Golpe óseo en la rodilla'],
            grave:['Fractura de peroné','Rotura de menisco','Fisura en el metatarso']
          }
        };
        const severidades=[
          {label:'leve', weeks:1, dificultad:7},
          {label:'moderada', weeks:2, dificultad:10},
          {label:'grave', weeks:4, dificultad:13}
        ];
        const sev=severidades[Math.floor(Math.random()*severidades.length)];
        const nivelCuracion = familia==='muscular' ? (nivelesMed.curacionMuscular||0) : (nivelesMed.curacionOsea||0);
        let weeks=Math.max(1, sev.weeks-nivelCuracion);
        const tipoLesion=TIPOS_LESION_POR_FAMILIA[familia][sev.label][Math.floor(Math.random()*TIPOS_LESION_POR_FAMILIA[familia][sev.label].length)];
        eventos.push({minute:20+Math.floor(Math.random()*65), team:misLado, type:'injury', jugador, sev:{...sev, weeks}, tipoLesion, familia});
      }
    }
    // Actualizar rachas de gol: quien marca suma, el resto de titulares que
    // NO marcaron este partido pierden la racha (mismo concepto que el
    // "streak" de goleador ya usado en Copa Leyendas).
    const marcadoresIds=new Set(eventos.filter(e=>e.type==='goal'&&e.jugador).map(e=>e.jugador.id));
    const idsAlineados=Object.values(state.alineacion||{}).filter(Boolean);
    idsAlineados.forEach(id=>{
      const p=state.plantilla.find(x=>x.id===id);
      if(!p) return;
      if(marcadoresIds.has(id)) p.racha=(p.racha||0)+1;
      else p.racha=0;
    });
    eventos.sort((a,b)=>a.minute-b.minute);
    return eventos;
  }

  // Actualiza el estado del estadio (césped + satisfacción) tras jugar mi
  // partido de la jornada. El césped solo se desgasta si jugué en casa
  // (es mi terreno el que se pisa); la recuperación natural del
  // mantenimiento habitual se aplica siempre. La satisfacción sube con
  // las victorias y baja con las derrotas, agravada si el césped está
  // descuidado — tal y como se pidió: "un campo mal cuidado aumenta...
  // el descontento de la afición".
  // Asistencia al estadio — depende de la satisfacción de la afición, la
  // moral del equipo y el clima del día. Todavía solo simbólico (no
  // genera ingresos), pero deja ver de un vistazo cómo responde la
  // afición a cómo va la temporada.
  function calcularAsistencia(weatherId){
    const est=state.estadio||{};
    const aforo=est.aforoTotal||12000;
    const baseSatisfaccion=0.35+((est.satisfaccion||0)+100)/200*0.55; // 35% a 90% según satisfacción
    const bonusMoral=(state.moral||0)/50*0.08; // hasta ±8% según moral del equipo
    const penalizacionClima = weatherId ? ({sunny:0, cloudy:0, rain:0.12, wind:0.05, hot:0.08, snow:0.15}[weatherId]||0) : 0;
    // Precio de la entrada: por encima de un precio de referencia (10€)
    // cada euro de más resta asistencia — mitigado por el nivel de
    // Relaciones con la Afición del Director General (el "caché" del
    // club: cuanto más grande eres, mejor toleras subir el precio).
    const precio=state.precioEntrada===undefined?15:state.precioEntrada;
    const tolerancia=nivelDeDG('toleranciaPrecio');
    const penalizacionPrecio=Math.max(0,(precio-10))*0.012*(1-tolerancia*0.22);
    let pct=baseSatisfaccion+bonusMoral-penalizacionClima-penalizacionPrecio;
    if(state.directorGeneralBonos && state.directorGeneralBonos.boostAsistencia){ pct+=state.directorGeneralBonos.boostAsistencia; }
    pct=Math.max(0.15, Math.min(0.99, pct));
    return {asistentes:Math.round(aforo*pct), aforo, pct};
  }
  // Moral del equipo (-50..50) — CALCO del rango y espíritu del sistema
  // de moral de Copa Leyendas (teamMorale), pero propio de Liga Manager:
  // sube con las victorias y baja con las derrotas, amplificado si se
  // encadenan varios resultados seguidos del mismo signo (una racha
  // pesa más que un resultado suelto).
  function actualizarMoralTrasPartido(miGoles, suGoles){
    let delta=0;
    if(miGoles>suGoles){ delta=6; state.rachaResultados=Math.max(1,(state.rachaResultados||0)+1); }
    else if(miGoles===suGoles){ delta=0; state.rachaResultados=0; }
    else { delta=-7; state.rachaResultados=Math.min(-1,(state.rachaResultados||0)-1); }
    const rachaAbs=Math.abs(state.rachaResultados||0);
    if(rachaAbs>=2){
      const extra=(rachaAbs-1)*1.5;
      delta += delta>0 ? extra : (delta<0 ? -extra : 0);
    }
    state.moral=Math.max(-50, Math.min(50, Math.round((state.moral||0)+delta)));
  }

  function actualizarEstadioTrasPartido(miEsLocal, resultado, clima){
    if(!state.estadio) state.estadio={campo:90, satisfaccion:10, aforoTotal:12000, ultimaAsistencia:null};
    const est=state.estadio;
    // La asistencia se calcula ANTES de actualizar satisfacción/moral con
    // el resultado de hoy — refleja quién decidió venir sabiendo cómo
    // estaban las cosas hasta el partido anterior, no el resultado que
    // aún no se conocía.
    if(miEsLocal){
      const asistenciaInfo=calcularAsistencia(clima?clima.id:null);
      est.ultimaAsistencia={...asistenciaInfo, jornada:state.jornadaActual};
      if(state.directorGeneralBonos && state.directorGeneralBonos.boostAsistencia){ state.directorGeneralBonos.boostAsistencia=0; }
      const precio=state.precioEntrada===undefined?15:state.precioEntrada;
      const ingresoEntradas=asistenciaInfo.asistentes*precio;
      const ingresoMerch=Math.round(asistenciaInfo.asistentes*(2+nivelDeDG('ingresoMerchandising')*1.5));
      state.capital=Math.round((state.capital||0)+ingresoEntradas+ingresoMerch);
      registrarMovimientoFinanciero('Entradas', ingresoEntradas, state.jornadaActual);
      registrarMovimientoFinanciero('Merchandising', ingresoMerch, state.jornadaActual);
    }
    if(miEsLocal && clima){
      const desgasteBase={sunny:3, cloudy:2, rain:8, wind:4, hot:6, snow:7}[clima.id] || 2;
      const reduccion=nivelDeM('prevencionDesgaste')*1.4;
      const desgaste=Math.max(0, desgasteBase-reduccion);
      est.campo=Math.max(0, est.campo-desgaste);
    }
    const recuperacion=2+nivelDeM('recuperacionCesped')*2;
    est.campo=Math.min(100, Math.round(est.campo+recuperacion));

    const miGoles = miEsLocal ? resultado.golesA : resultado.golesB;
    const suGoles = miEsLocal ? resultado.golesB : resultado.golesA;
    const boostVictoria=1+nivelDeM('boostSatisfaccion')*0.25;
    const proteccion=1-nivelDeM('proteccionSatisfaccion')*0.2;
    let delta=0;
    if(miGoles>suGoles) delta=8*boostVictoria;
    else if(miGoles===suGoles) delta=1;
    else delta=-10*proteccion;
    if(est.campo<40) delta-=(40-est.campo)*0.15*proteccion;
    if(delta<0 && state.mantenimientoBonos && state.mantenimientoBonos.amortiguarPerdida){
      delta*=0.5;
      state.mantenimientoBonos.amortiguarPerdida=false;
    }
    est.satisfaccion=Math.max(-100, Math.min(100, Math.round(est.satisfaccion+delta)));
    actualizarMoralTrasPartido(miGoles, suGoles);
  }

  function jugarJornada(){
    if(state.jornadaActual>38) return null;
    const j=state.jornadaActual-1;
    const jornada=state.calendario[j];
    let miPartidoInfo=null;
    const clima=climaDelPartido();
    jornada.forEach(partido=>{
      const key=j+'-'+partido.home.id+'-'+partido.away.id;
      if(state.resultados[key]) return;
      const esMiPartido = partido.home.id==='lm_0' || partido.away.id==='lm_0';
      let contexto=null, campoRelevante=null, miEsLocalDeEste=null;
      if(esMiPartido){
        miEsLocalDeEste = partido.home.id==='lm_0';
        campoRelevante = miEsLocalDeEste ? (state.estadio?state.estadio.campo:100) : campoRivalEstimado(miEsLocalDeEste?partido.away:partido.home);
        contexto = {
          climaId: clima ? clima.id : null,
          campoAnfitrion: campoRelevante,
          anfitrionA: miEsLocalDeEste,
          esMiEquipoA: miEsLocalDeEste,
          moralBonus: ((state.moral||0)/50)*0.08
        };
      }
      const resultado=simularPartido(partido.home, partido.away, contexto);
      state.resultados[key]=resultado;
      if(esMiPartido){
        const eventos=generarEventosPartido(resultado, miEsLocalDeEste, campoRelevante);
        // Aplicar la lesión generada (si la hay) al estado real del jugador
        const evInjury=eventos.find(e=>e.type==='injury');
        if(evInjury){
          evInjury.jugador.injured=true;
          evInjury.jugador.injuryWeeks=evInjury.sev.weeks;
          evInjury.jugador.injurySeverity=evInjury.sev.label;
          evInjury.jugador.injuryFamilia=evInjury.familia;
          state.medicoNotificacion={jugadorId:evInjury.jugador.id, dificultad:evInjury.sev.dificultad, severidad:evInjury.sev.label};
          const rivalDeEsta = partido.home.id==='lm_0' ? partido.away.name : partido.home.name;
          evInjury.jugador.lesionLogId=registrarLesionHistorial(evInjury.jugador, evInjury.sev, evInjury.tipoLesion, rivalDeEsta, evInjury.familia);
        }
        miPartidoInfo={ home:partido.home, away:partido.away, resultado, eventos };
        actualizarEstadioTrasPartido(miEsLocalDeEste, resultado, clima);
      }
    });

    // Fondo de dados: se resetea cada jornada — los que no se usaron en
    // la jornada anterior se pierden (use-it-or-lose-it, ya definido).
    // Médico y Mantenimiento COMPARTEN este mismo fondo de dados: hay que
    // repartir entre las dos plantillas de cartas cada partido.
    state.diceAvailable = DICE_POOL_PER_MATCH;
    state.medicoCambioUsado = false;
    state.mantenimientoCambioUsado = false;
    state.directorGeneralCambioUsado = false;
    state.directorDeportivoCambioUsado = false;
    state.dadoRerollsDisponibles = 1;

    // Nómina mensual — se cobra una vez al entrar en cada mes (cada 4
    // jornadas: J1, J5, J9...), jugadores + los 4 departamentos técnicos.
    const mesDeEstaJornada=Math.floor((state.jornadaActual-1)/4)+1;
    if(mesDeEstaJornada>(state.mesesPagados||0)){
      aplicarNominaMensual();
      state.mesesPagados=mesDeEstaJornada;
    }
    if(mesDeEstaJornada>(state.mesTrabajadoresGenerado||0)){
      regenerarCandidatosTrabajo();
      state.mesTrabajadoresGenerado=mesDeEstaJornada;
    }

    state.plantilla.forEach(p=>{
      if(p.injured && p.injuryWeeks>0){
        p.injuryWeeks--;
        if(p.injuryWeeks<=0){
          p.injured=false; p.injurySeverity=null;
          cerrarLesionHistorial(p, 'Tiempo natural');
        }
      }
    });

    // Fatiga real — CALCO del concepto de applyMatchFatigue() de Copa
    // Leyendas: quien ha jugado esta jornada (los 11 del campo) pierde
    // resistencia (el portero apenas se cansa, los centrales son los que
    // menos corren), y quien se queda en el banquillo recupera del todo.
    // Antes el campo "fatigue" existía pero nunca bajaba jugando.
    if(miPartidoInfo){
      const titularIdsJornada=new Set(Object.values(state.alineacion||{}).filter(Boolean));
      state.plantilla.forEach(p=>{
        const actual=(p.fatigue===undefined)?100:p.fatigue;
        if(!titularIdsJornada.has(p.id)){ p.fatigue=100; return; }
        if(p.position==='POR'){ p.fatigue=Math.max(0, Math.round(actual-(2+Math.random()*4))); return; }
        let loss=8+Math.random()*6;
        if(p.position==='DFC') loss*=0.65;
        p.fatigue=Math.max(0, Math.round(actual-loss));
      });
    }

    state.jornadaActual++;
    guardarEstado();
    return miPartidoInfo;
  }

  /* ---------- 8b. Partido en vivo — CALCO exacto de Copa Leyendas: mismas
     clases CSS (.match-modal/.match-header/.match-side/.match-team-name/
     .match-scoreline), dos tiempos claramente separados con descanso,
     goles con goleador real, lesiones durante el propio partido, y
     badge de racha (🔥) si el goleador lleva varios partidos marcando. ---------- */
  function mostrarPartidoEnVivo(info, onFinish){
    const miEsLocal = info.home.id==='lm_0';
    const overlay=document.createElement('div');
    overlay.id='lmMatchOverlay';
    overlay.innerHTML=`
      <div class="match-modal" style="overflow:hidden;display:flex;flex-direction:column;max-height:85vh">
        <div class="match-header">
          <div class="match-side">
            ${miEsLocal?crestHTML(state.escudo,72):rivalCrestHTML(72, info.home.crestImg)}
            <span class="match-team-name">${info.home.name}</span>
          </div>
          <div style="text-align:center;flex:0 0 auto">
            <div class="match-scoreline" id="lmLiveScore" style="font-size:42px;letter-spacing:4px">0 – 0</div>
            <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:4px">
              <div style="font-family:'Bebas Neue',Impact,sans-serif;font-size:20px;color:var(--gold)" id="lmLiveClock">0'</div>
              <div style="font-size:9px;font-weight:700;background:var(--accent);color:#fff;padding:2px 7px;letter-spacing:1px;text-transform:uppercase" id="lmLiveHalf">1ª PARTE</div>
            </div>
            <div style="height:4px;background:#eee;border-radius:2px;margin-top:6px;overflow:hidden">
              <div id="lmLiveFill" style="height:100%;background:var(--accent);border-radius:2px;width:0%;transition:width .15s linear"></div>
            </div>
          </div>
          <div class="match-side">
            ${!miEsLocal?crestHTML(state.escudo,72):rivalCrestHTML(72, info.away.crestImg)}
            <span class="match-team-name">${info.away.name}</span>
          </div>
        </div>
        <div id="lmLiveEvents" style="flex:1;overflow-y:auto;display:flex;flex-direction:column;align-items:stretch;gap:2px;padding:4px 0;min-height:80px;max-height:260px"></div>
        <div id="lmPostMatchInfo"></div>
        <button id="lmLiveContinuar" class="mode-card-btn mode-card-btn-gold" style="display:none;width:100%;padding:11px;margin-top:10px">CONTINUAR</button>
      </div>`;
    document.getElementById('ligaManagerScreen').appendChild(overlay);

    const eventsEl=document.getElementById('lmLiveEvents');
    const clockEl=document.getElementById('lmLiveClock');
    const halfEl=document.getElementById('lmLiveHalf');
    const fillEl=document.getElementById('lmLiveFill');
    const scoreEl=document.getElementById('lmLiveScore');
    let curHome=0, curOpp=0, idx=0;

    function flashScore(){ scoreEl.classList.remove('goal-flash'); void scoreEl.offsetWidth; scoreEl.classList.add('goal-flash'); }

    function addSep(text){
      const sep=document.createElement('div');
      sep.style.cssText='text-align:center;font-size:10px;font-weight:700;color:var(--accent);letter-spacing:2px;padding:4px 0;border-top:1px solid #eee;border-bottom:1px solid #eee;margin:2px 0;text-transform:uppercase';
      sep.textContent=text;
      eventsEl.appendChild(sep);
      eventsEl.scrollTop=eventsEl.scrollHeight;
    }

    function addEvt(icon,text,minLabel,esLocal,colorOverride){
      const item=document.createElement('div');
      item.style.cssText='display:grid;grid-template-columns:1fr 44px 1fr;align-items:center;width:100%;font-size:12px;animation:slideInEvent .3s ease;opacity:0;animation-fill-mode:forwards;padding:3px 0;border-bottom:1px solid rgba(0,0,0,.05)';
      const center=`<span style="font-family:'Bebas Neue',Impact,sans-serif;font-size:15px;color:#aaa;text-align:center;display:block;letter-spacing:.5px">${minLabel}</span>`;
      const color = colorOverride || (esLocal ? 'var(--accent)' : 'var(--red)');
      if(esLocal){
        item.innerHTML=`<span style="text-align:right;padding-right:6px;color:${color};line-height:1.3">${text} <span style="font-size:14px">${icon}</span></span>${center}<span></span>`;
      }else{
        item.innerHTML=`<span></span>${center}<span style="text-align:left;padding-left:6px;color:${color};line-height:1.3"><span style="font-size:14px">${icon}</span> ${text}</span>`;
      }
      eventsEl.appendChild(item);
      eventsEl.scrollTop=eventsEl.scrollHeight;
    }

    if(typeof window.playSound==='function') window.playSound('whistle');

    // Dos tiempos claramente diferenciados, igual que Copa Leyendas:
    // 1ª PARTE (0-47%) → DESCANSO (47-53%) → 2ª PARTE (53-100%).
    const DURATION=8000;
    const HT_S=0.47, HT_E=0.53;
    const start=performance.now();
    let htShown=false;

    function tick(now){
      const frac=Math.min((now-start)/DURATION,1);

      if(frac>=HT_S && frac<HT_E){
        if(!htShown){
          htShown=true;
          clockEl.textContent="45'";
          halfEl.textContent='DESCANSO';
          halfEl.style.background='#a07a00';
          fillEl.style.width='50%';
          addSep("Descanso — 45'");
          if(typeof window.playSound==='function') window.playSound('whistle');
        }
        requestAnimationFrame(tick);
        return;
      }

      let minute;
      if(frac<HT_S){
        minute=Math.floor((frac/HT_S)*45);
        halfEl.textContent='1ª PARTE'; halfEl.style.background='var(--accent)';
      }else{
        const f2=(frac-HT_E)/(1-HT_E);
        minute=45+Math.floor(f2*45);
        halfEl.textContent='2ª PARTE'; halfEl.style.background='var(--accent)';
      }
      clockEl.textContent=minute+"'";
      fillEl.style.width=(frac*100)+'%';

      while(idx<info.eventos.length && info.eventos[idx].minute<=minute){
        const ev=info.eventos[idx++];
        const esLocal = ev.team==='home';
        if(ev.type==='goal'){
          if(esLocal) curHome++; else curOpp++;
          scoreEl.textContent=curHome+' – '+curOpp;
          flashScore();
          const equipoGol = esLocal ? info.home.name : info.away.name;
          const racha = ev.jugador && ev.jugador.racha>=2 ? ` <span title="Racha de gol">🔥${ev.jugador.racha}</span>` : '';
          const nombre = ev.jugador ? ev.jugador.name : equipoGol;
          addEvt('⚽', `<strong>${nombre}</strong>${racha}`, ev.minute+"'", esLocal);
          if(typeof window.playSound==='function') window.playSound('goal');
        } else if(ev.type==='injury'){
          addEvt('✚', `<strong>${ev.jugador.name}</strong> <span style="font-size:10px;color:var(--red)">(lesión ${ev.sev.label})</span>`, ev.minute+"'", esLocal, 'var(--red)');
        } else if(ev.type==='card'){
          const icon = ev.tarjeta==='roja' ? '🟥' : '🟨';
          addEvt(icon, `<strong>${ev.jugador.name}</strong>`, ev.minute+"'", ev.team==='home');
        }
      }

      if(frac<1){ requestAnimationFrame(tick); }
      else{
        clockEl.textContent='FIN';
        halfEl.textContent='FINAL';
        halfEl.style.background='#555';
        fillEl.style.width='100%';
        if(typeof window.playSound==='function') window.playSound('whistle');

        // Resultado final desde tu perspectiva — mismo banner que Copa
        // Leyendas (.match-result-tag + .res-win-tag/.res-draw-tag/.res-lose-tag).
        const miGoles = miEsLocal?curHome:curOpp;
        const suGoles = miEsLocal?curOpp:curHome;
        let resultClass, resultText;
        if(miGoles===suGoles){ resultClass='res-draw-tag'; resultText='EMPATE'; }
        else if(miGoles>suGoles){ resultClass='res-win-tag'; resultText='¡VICTORIA!'; }
        else { resultClass='res-lose-tag'; resultText='DERROTA'; }
        const golesA=info.eventos.filter(e=>e.type==='goal').length;
        const tarjetasA=info.eventos.filter(e=>e.type==='card').length;
        const lesionA=info.eventos.find(e=>e.type==='injury');
        document.getElementById('lmPostMatchInfo').innerHTML=`
          <div class="match-result-tag ${resultClass}">${resultText}</div>
          <div class="match-summary">
            <strong>${state.nombreEquipo}</strong> ${miGoles} – ${suGoles} <strong>${info.home.id==='lm_0'?info.away.name:info.home.name}</strong><br>
            ${golesA} gol${golesA===1?'':'es'} en total · ${tarjetasA} tarjeta${tarjetasA===1?'':'s'}${lesionA?` · 1 lesión (${lesionA.jugador.name})`:''}
          </div>`;

        document.getElementById('lmLiveContinuar').style.display='block';
      }
    }
    requestAnimationFrame(tick);

    document.getElementById('lmLiveContinuar').addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      overlay.remove();
      onFinish();
    });
  }

  /* ---------- 9. Resolver el dilema del médico con N dados (se SUMAN) ---------- */
  /* ---------- 9a. Historial del médico — registra cada lesión (cuándo,
     contra quién, tipo) y cómo se resolvió (tiempo natural, dado urgente
     o una carta concreta), más el progreso de las cartas de acumulación.
     Se muestra ordenado de más reciente a más antiguo. ---------- */
  function registrarLesionHistorial(jugador, sev, tipoLesion, rival, familia){
    state.medicoHistorial = state.medicoHistorial||[];
    const id = 'h'+Date.now()+Math.floor(Math.random()*1000);
    state.medicoHistorial.push({
      id, tipo:'lesion',
      jugador: jugador.name, jornadaInicio: state.jornadaActual, rival,
      severidad: sev.label, tipoLesion, familia, semanasPrevistas: sev.weeks,
      resuelta:false, resueltoPor:null, jornadasReales:null
    });
    return id;
  }
  function cerrarLesionHistorial(jugador, resueltoPor){
    if(!jugador.lesionLogId || !state.medicoHistorial) return;
    const entry=state.medicoHistorial.find(h=>h.id===jugador.lesionLogId);
    if(entry && !entry.resuelta){
      entry.resuelta=true;
      entry.resueltoPor=resueltoPor;
      entry.jornadasReales=Math.max(1, state.jornadaActual-entry.jornadaInicio+1);
    }
    jugador.lesionLogId=null;
    jugador.injuryFamilia=null;
  }
  function registrarProgresoHistorial(texto){
    state.medicoHistorial = state.medicoHistorial||[];
    state.medicoHistorial.push({id:'h'+Date.now()+Math.floor(Math.random()*1000), tipo:'progreso', jornada:state.jornadaActual, texto});
  }

  function resolverDilemaMedico(numDados, tiradas){
    if(!state.medicoNotificacion) return null;
    const suma = tiradas.reduce((a,b)=>a+b,0);
    const exito = suma >= state.medicoNotificacion.dificultad;
    if(exito){
      const jugador=state.plantilla.find(p=>p.id===state.medicoNotificacion.jugadorId);
      if(jugador){
        jugador.injuryWeeks=Math.max(0, jugador.injuryWeeks-1);
        if(jugador.injuryWeeks<=0){ jugador.injured=false; jugador.injurySeverity=null; cerrarLesionHistorial(jugador, 'Dado urgente'); }
      }
    }
    state.diceAvailable = Math.max(0, state.diceAvailable - numDados);
    const resultado={tiradas, suma, dificultad:state.medicoNotificacion.dificultad, exito};
    state.medicoNotificacion=null;
    guardarEstado();
    return resultado;
  }

  /* ---------- 9b. CARTAS DE MISIÓN DEL CUERPO TÉCNICO (Médico) ----------
     10 cartas base. Tres tipos:
     - "directa": se resuelve al momento (dados sumados vs dificultad).
       Si falla, la carta se queda tal cual, se puede reintentar cuando
       se pueda. Si tiene éxito, se aplica el efecto y se cambia por una
       carta nueva al azar automáticamente.
     - "nivel": mejora permanente de una de las 4 especialidades del
       equipo médico (curación muscular, curación ósea, prevención
       muscular, prevención ósea). Se resuelve al momento igual que una
       carta directa (dados vs dificultad, sin fallo posible en la
       tirada en sí más allá de no alcanzar la dificultad) — si tiene
       éxito, sube un nivel esa especialidad y la carta se sustituye por
       otra al azar; si esa misma carta vuelve a salir más adelante, un
       nuevo éxito la sube otro nivel (dificultad más alta cada vez).
       Al alcanzar el nivel máximo (3) la carta queda agotada para
       siempre y ya no puede volver a salir.
     - "acumulacion": los dados invertidos SIEMPRE suman puntos a un
       proyecto (no hay fallo posible en la tirada en sí); tiene varios
       niveles con umbral creciente — completar por etapas sale más
       barato en total que si solo existiera un umbral alto directo.
     Puedes cambiar 1 carta (de las 3 en mano) por partido: se descarta
     y se reemplaza por otra al azar del resto del catálogo. ---------- */
  const MEDICO_CARTAS_BASE = [
    {id:'urgente',      tipo:'directa',     nombre:'Recuperación Exprés',      icon:'ph-first-aid-kit',    dificultad:8,  requiereLesion:true,  desc:'Reduce a la mitad el tiempo de recuperación de un jugador lesionado'},
    {id:'milagro',      tipo:'directa',     nombre:'Milagro de Vestuario',     icon:'ph-sparkle',          dificultad:15, requiereLesion:true,  desc:'Cura al instante cualquier lesión, sea cual sea su gravedad'},
    {id:'consulta',     tipo:'directa',     nombre:'Consulta Rápida',          icon:'ph-stethoscope',      dificultad:5,  requiereLesion:true,  desc:'Reduce en 1 semana el tiempo de recuperación'},
    {id:'cirugia',      tipo:'directa',     nombre:'Cirugía de Precisión',     icon:'ph-scissors',         dificultad:12, requiereLesion:'grave',desc:'Convierte una lesión grave en moderada'},
    {id:'prevencion_t', tipo:'directa',     nombre:'Prevención Táctica',       icon:'ph-shield-check',     dificultad:7,  requiereLesion:false, desc:'Reduce el riesgo de lesión en el próximo partido'},
    {id:'chequeo',      tipo:'directa',     nombre:'Chequeo de Plantilla',     icon:'ph-clipboard-text',   dificultad:6,  requiereLesion:false, desc:'Mejora la resistencia de toda la plantilla este partido'},
    {id:'fisio_muscular',    tipo:'nivel', track:'curacionMuscular',   nombre:'Unidad de Fisioterapia',        icon:'ph-person-simple-run', dificultadBase:8, dificultadPaso:4, desc:'Acelera la recuperación de lesiones musculares, esguinces y de ligamentos'},
    {id:'fisio_osea',        tipo:'nivel', track:'curacionOsea',       nombre:'Unidad de Traumatología',       icon:'ph-bandaids',          dificultadBase:9, dificultadPaso:4, desc:'Acelera la recuperación de fisuras, fracturas y lesiones de menisco'},
    {id:'prevencion_muscular',tipo:'nivel', track:'prevencionMuscular', nombre:'Programa de Prevención Muscular', icon:'ph-heartbeat',        dificultadBase:8, dificultadPaso:4, desc:'Reduce el riesgo de sufrir lesiones musculares, esguinces y de ligamentos'},
    {id:'prevencion_osea',   tipo:'nivel', track:'prevencionOsea',     nombre:'Protocolo de Protección Ósea',  icon:'ph-shield-plus',       dificultadBase:9, dificultadPaso:4, desc:'Reduce el riesgo de sufrir fisuras, fracturas y lesiones de menisco'}
  ];

  const NIVEL_MAXIMO_EQUIPO=3;
  function nivelDe(track){ return (state.medicoNiveles && state.medicoNiveles[track]) || 0; }
  function dificultadActualNivel(def){ return def.dificultadBase + nivelDe(def.track)*def.dificultadPaso; }

  // Resumen del equipo médico por especialidad — CONDENSADO a propósito:
  // una fila por especialidad con su nivel actual en estrellas, nunca un
  // listado de cada mejora conseguida. Se reutiliza tanto en la propia
  // ficha del equipo médico como en la pestaña INSTALACIONES del
  // historial.
  const NIVELES_EQUIPO_INFO=[
    {track:'curacionMuscular',   label:'Fisioterapia',          icon:'ph-person-simple-run', desc:'Recuperación de lesiones musculares'},
    {track:'curacionOsea',       label:'Traumatología',         icon:'ph-bandaids',          desc:'Recuperación de lesiones óseas'},
    {track:'prevencionMuscular', label:'Prevención muscular',   icon:'ph-heartbeat',         desc:'Riesgo de sufrir una lesión muscular'},
    {track:'prevencionOsea',     label:'Protección ósea',       icon:'ph-shield-plus',       desc:'Riesgo de sufrir una lesión ósea'}
  ];
  function estrellasNivel(n){ return '★'.repeat(n) + '☆'.repeat(NIVEL_MAXIMO_EQUIPO-n); }
  function renderNivelesEquipoHTML(){
    return `<div class="med-niveles-grid">${NIVELES_EQUIPO_INFO.map(info=>{
      const n=nivelDe(info.track);
      return `<div class="med-nivel-row">
        <i class="ph ph-bold ${info.icon}"></i>
        <div class="med-nivel-info">
          <div class="med-nivel-label">${info.label}</div>
          <div class="med-nivel-desc">${info.desc}</div>
        </div>
        <div class="med-nivel-stars" title="Nivel ${n}/${NIVEL_MAXIMO_EQUIPO}">${estrellasNivel(n)}</div>
      </div>`;
    }).join('')}</div>`;
  }

  function cartaDef(id){ return MEDICO_CARTAS_BASE.find(c=>c.id===id); }

  function generarCartaAleatoria(excluirIds){
    excluirIds = excluirIds || [];
    const agotadas = state.medicoCartasAgotadas||[];
    const disponibles = MEDICO_CARTAS_BASE.filter(c=>!excluirIds.includes(c.id) && !agotadas.includes(c.id));
    const pool = disponibles.length ? disponibles : MEDICO_CARTAS_BASE.filter(c=>!agotadas.includes(c.id));
    if(!pool.length) return null;
    const def=pool[Math.floor(Math.random()*pool.length)];
    return {cartaId:def.id, progreso:0, nivelActual:1};
  }

  function inicializarCartasMedico(){
    const cartas=[];
    for(let i=0;i<3;i++){
      const nueva=generarCartaAleatoria(cartas.map(c=>c.cartaId));
      if(nueva) cartas.push(nueva);
    }
    return cartas;
  }

  function cambiarCartaMedico(idx){
    if(state.medicoCambioUsado) return false;
    const otras=state.medicoCartas.filter((c,i)=>i!==idx).map(c=>c.cartaId);
    const nueva=generarCartaAleatoria(otras);
    if(!nueva) return false;
    state.medicoCartas[idx]=nueva;
    state.medicoCambioUsado=true;
    guardarEstado();
    return true;
  }

  // Aplica el efecto de una carta DIRECTA al tener éxito. Devuelve un
  // texto corto describiendo lo ocurrido, para mostrarlo en el resultado.
  function textoReduccion(antes, despues){
    if(antes===null||antes===undefined) return '';
    const reduccion=antes-Math.max(0,despues);
    if(reduccion<=0) return '';
    if(despues<=0) return ` — vuelve a estar disponible (${reduccion} jornada${reduccion===1?'':'s'} menos)`;
    return ` — pasa de ${antes} a ${despues} jornada${despues===1?'':'s'} de baja (-${reduccion})`;
  }
  function aplicarEfectoDirecta(def, jugadorObjetivo){
    const antes = jugadorObjetivo ? jugadorObjetivo.injuryWeeks : null;
    switch(def.id){
      case 'urgente':
        if(jugadorObjetivo){
          jugadorObjetivo.injuryWeeks=Math.max(0,Math.ceil(jugadorObjetivo.injuryWeeks/2));
          if(jugadorObjetivo.injuryWeeks<=0){ jugadorObjetivo.injured=false; jugadorObjetivo.injurySeverity=null; cerrarLesionHistorial(jugadorObjetivo, 'Carta: '+def.nombre); }
        }
        return jugadorObjetivo?`${jugadorObjetivo.name} recorta a la mitad su tiempo de baja${textoReduccion(antes,jugadorObjetivo.injuryWeeks)}`:'Aplicado';
      case 'milagro':
        if(jugadorObjetivo){ jugadorObjetivo.injured=false; jugadorObjetivo.injuryWeeks=0; jugadorObjetivo.injurySeverity=null; cerrarLesionHistorial(jugadorObjetivo, 'Carta: '+def.nombre); }
        return jugadorObjetivo?`${jugadorObjetivo.name} recupera la disponibilidad al instante${textoReduccion(antes,0)}`:'Aplicado';
      case 'consulta':
        if(jugadorObjetivo){
          jugadorObjetivo.injuryWeeks=Math.max(0,jugadorObjetivo.injuryWeeks-1);
          if(jugadorObjetivo.injuryWeeks<=0){ jugadorObjetivo.injured=false; jugadorObjetivo.injurySeverity=null; cerrarLesionHistorial(jugadorObjetivo, 'Carta: '+def.nombre); }
        }
        return jugadorObjetivo?`${jugadorObjetivo.name} se recupera 1 semana antes${textoReduccion(antes,jugadorObjetivo.injuryWeeks)}`:'Aplicado';
      case 'cirugia':
        if(jugadorObjetivo){ jugadorObjetivo.injurySeverity='moderada'; jugadorObjetivo.injuryWeeks=Math.min(jugadorObjetivo.injuryWeeks,2); }
        return jugadorObjetivo?`La lesión de ${jugadorObjetivo.name} pasa a moderada${textoReduccion(antes,jugadorObjetivo.injuryWeeks)}`:'Aplicado';
      case 'prevencion_t':
        state.medicoBonos.riesgoLesionSiguiente = (state.medicoBonos.riesgoLesionSiguiente||1)*0.5;
        return 'Riesgo de lesión reducido para el próximo partido';
      case 'chequeo':
        state.plantilla.forEach(p=>{ p.fatigue=Math.min(100,(p.fatigue===undefined?100:p.fatigue)+15); });
        return 'La plantilla llega más fresca a este partido';
      default: return 'Aplicado';
    }
  }

  // Aplica el efecto PERMANENTE de una carta de ACUMULACIÓN al completar
  // un nivel (se acumula con niveles anteriores de la misma carta), y lo
  // deja anotado en el historial del médico.
  function aplicarNivelAcumulacion(def, nivel){
    switch(def.id){
      case 'sala_fisio': state.medicoBonos.recuperacionExtra=(state.medicoBonos.recuperacionExtra||0)+1; break;
      case 'prevencion_p': state.medicoBonos.riesgoLesionMultiplier=(state.medicoBonos.riesgoLesionMultiplier||1)*0.85; break;
      case 'especialista': state.medicoBonos.graveMultiplier=(state.medicoBonos.graveMultiplier||1)*0.5; break;
      case 'equipo_fisios': state.medicoBonos.recuperacionExtra=(state.medicoBonos.recuperacionExtra||0)+1; break;
    }
    registrarProgresoHistorial(`${def.nombre} actualizado a nivel ${nivel} — ${def.desc}`);
  }

  // Aplica el efecto PERMANENTE de una carta de NIVEL al tener éxito: sube
  // un nivel la especialidad correspondiente (curación/prevención ×
  // muscular/ósea), hasta un máximo de 3. Al llegar al máximo, la carta
  // queda agotada para siempre (no puede volver a salir en la mano).
  function aplicarNivelMejora(def){
    if(!state.medicoNiveles) state.medicoNiveles={curacionMuscular:0, curacionOsea:0, prevencionMuscular:0, prevencionOsea:0};
    const nivelNuevo=Math.min(NIVEL_MAXIMO_EQUIPO, nivelDe(def.track)+1);
    state.medicoNiveles[def.track]=nivelNuevo;
    const maxAlcanzado=nivelNuevo>=NIVEL_MAXIMO_EQUIPO;
    if(maxAlcanzado){
      state.medicoCartasAgotadas = state.medicoCartasAgotadas||[];
      state.medicoCartasAgotadas.push(def.id);
    }
    return {nivelNuevo, maxAlcanzado};
  }

  // Resuelve una tirada ya hecha (tiradas[] de dados de 6) sobre la carta
  // en la posición idx de la mano. Devuelve info para pintar el resultado.
  function resolverCartaMedico(idx, tiradas, jugadorObjetivoId){
    const instancia=state.medicoCartas[idx];
    const def=cartaDef(instancia.cartaId);
    const suma=tiradas.reduce((a,b)=>a+b,0);
    let resultado;

    if(def.tipo==='directa'){
      const exito = suma>=def.dificultad;
      const jugadorObjetivo = jugadorObjetivoId ? state.plantilla.find(p=>p.id===jugadorObjetivoId) : null;
      if(exito){
        const texto=aplicarEfectoDirecta(def, jugadorObjetivo);
        state.medicoCartas[idx]=generarCartaAleatoria(state.medicoCartas.map(c=>c.cartaId)) || instancia;
        resultado={tipo:'directa', exito:true, suma, dificultad:def.dificultad, texto};
      } else {
        resultado={tipo:'directa', exito:false, suma, dificultad:def.dificultad, texto:'La carta se queda en tu mano — puedes reintentarlo más adelante'};
      }
    } else if(def.tipo==='nivel'){
      const dificultadActual=dificultadActualNivel(def);
      const exito = suma>=dificultadActual;
      if(exito){
        const {nivelNuevo, maxAlcanzado}=aplicarNivelMejora(def);
        state.medicoCartas[idx]=generarCartaAleatoria(state.medicoCartas.map(c=>c.cartaId)) || instancia;
        resultado={tipo:'nivel', exito:true, suma, dificultad:dificultadActual, nivelNuevo, maxAlcanzado, nombre:def.nombre};
      } else {
        resultado={tipo:'nivel', exito:false, suma, dificultad:dificultadActual, nombre:def.nombre, texto:'La carta se queda en tu mano — puedes reintentarlo más adelante'};
      }
    } else {
      // Acumulación: SIEMPRE suma, nunca "falla" la tirada en sí.
      instancia.progreso += suma;
      const umbral=def.niveles[instancia.nivelActual-1];
      let subioNivel=false, completada=false;
      while(instancia.progreso>=umbral && !completada){
        aplicarNivelAcumulacion(def, instancia.nivelActual);
        subioNivel=true;
        if(instancia.nivelActual>=def.niveles.length){
          completada=true;
        } else {
          instancia.progreso -= umbral;
          instancia.nivelActual++;
        }
      }
      if(completada){
        state.medicoCartasAgotadas = state.medicoCartasAgotadas||[];
        state.medicoCartasAgotadas.push(def.id);
        state.medicoCartas[idx]=generarCartaAleatoria(state.medicoCartas.map(c=>c.cartaId)) || instancia;
      }
      resultado={tipo:'acumulacion', suma, subioNivel, completada, nivelActual:instancia.nivelActual, umbral:def.niveles[Math.min(instancia.nivelActual,def.niveles.length)-1], progreso:instancia.progreso};
    }
    guardarEstado();
    return resultado;
  }

  /* ---------- 9c. CARTAS DE MISIÓN DEL EQUIPO DE MANTENIMIENTO Y SEGURIDAD ----------
     Mismo sistema que el Médico (10 cartas: 6 directa + 4 nivel, comparte
     el mismo fondo de dados por partido y su propio cambio de carta), pero
     aplicado al estadio en vez de a la plantilla. Dos frentes:
     - CÉSPED: estado 0-100, se desgasta con el mal tiempo cuando juegas en
       casa, se recupera un poco cada semana con el mantenimiento normal.
     - AFICIÓN: satisfacción -100..100, sube con las victorias y baja con
       las derrotas y con un césped descuidado. ---------- */
  const MANTENIMIENTO_CARTAS_BASE = [
    {id:'riego_emergencia',  tipo:'directa', nombre:'Riego de Emergencia',           icon:'ph-drop',              dificultad:6,  desc:'Recupera 20 puntos del estado del césped al instante'},
    {id:'renovacion_cesped', tipo:'directa', nombre:'Renovación Total del Césped',   icon:'ph-sparkle',           dificultad:15, desc:'Deja el césped en condiciones perfectas al instante'},
    {id:'revision_terreno',  tipo:'directa', nombre:'Revisión del Terreno de Juego', icon:'ph-magnifying-glass',  dificultad:5,  desc:'Recupera 10 puntos del estado del césped'},
    {id:'evento_aficion',    tipo:'directa', nombre:'Jornada de Puertas Abiertas',   icon:'ph-confetti',          dificultad:7,  desc:'Sube al instante la satisfacción de la afición'},
    {id:'gestion_crisis',    tipo:'directa', nombre:'Gestión de Crisis con Peñas',   icon:'ph-megaphone',         dificultad:12, requiereCrisis:true, desc:'Calma a una afición muy descontenta y estabiliza la satisfacción'},
    {id:'plan_comunicacion', tipo:'directa', nombre:'Plan de Comunicación',         icon:'ph-shield-check',      dificultad:7,  desc:'Amortigua la pérdida de satisfacción si el resultado no acompaña en el próximo partido'},
    {id:'sistema_riego',     tipo:'nivel', track:'prevencionDesgaste',    nombre:'Sistema de Riego Automático',  icon:'ph-drop-half-bottom', dificultadBase:8, dificultadPaso:4, desc:'Reduce el desgaste del césped por las inclemencias del tiempo'},
    {id:'greenkeeping',      tipo:'nivel', track:'recuperacionCesped',    nombre:'Servicio de Greenkeeping',     icon:'ph-plant',            dificultadBase:8, dificultadPaso:4, desc:'Acelera la recuperación natural del césped entre partidos'},
    {id:'experiencia_socio', tipo:'nivel', track:'boostSatisfaccion',     nombre:'Experiencia del Aficionado',   icon:'ph-ticket',           dificultadBase:8, dificultadPaso:4, desc:'Aumenta la satisfacción que genera cada victoria'},
    {id:'seguridad_grada',   tipo:'nivel', track:'proteccionSatisfaccion',nombre:'Seguridad y Grada Organizada', icon:'ph-shield-star',      dificultadBase:9, dificultadPaso:4, desc:'Reduce el descontento que genera una derrota o un césped descuidado'}
  ];
  function cartaDefM(id){ return MANTENIMIENTO_CARTAS_BASE.find(c=>c.id===id); }
  function nivelDeM(track){ return (state.mantenimientoNiveles && state.mantenimientoNiveles[track]) || 0; }
  function dificultadActualNivelM(def){ return def.dificultadBase + nivelDeM(def.track)*def.dificultadPaso; }

  const NIVELES_MANTENIMIENTO_INFO=[
    {track:'prevencionDesgaste',     label:'Riego automático',      icon:'ph-drop-half-bottom', desc:'Desgaste del césped por el mal tiempo'},
    {track:'recuperacionCesped',     label:'Greenkeeping',          icon:'ph-plant',            desc:'Recuperación natural del césped'},
    {track:'boostSatisfaccion',      label:'Experiencia del socio', icon:'ph-ticket',           desc:'Satisfacción ganada al vencer'},
    {track:'proteccionSatisfaccion', label:'Seguridad y grada',     icon:'ph-shield-star',      desc:'Descontento por derrota o césped descuidado'}
  ];
  function renderNivelesMantenimientoHTML(){
    return `<div class="med-niveles-grid">${NIVELES_MANTENIMIENTO_INFO.map(info=>{
      const n=nivelDeM(info.track);
      return `<div class="med-nivel-row">
        <i class="ph ph-bold ${info.icon}"></i>
        <div class="med-nivel-info">
          <div class="med-nivel-label">${info.label}</div>
          <div class="med-nivel-desc">${info.desc}</div>
        </div>
        <div class="med-nivel-stars" title="Nivel ${n}/${NIVEL_MAXIMO_EQUIPO}">${estrellasNivel(n)}</div>
      </div>`;
    }).join('')}</div>`;
  }

  function generarCartaAleatoriaMantenimiento(excluirIds){
    excluirIds = excluirIds || [];
    const agotadas = state.mantenimientoCartasAgotadas||[];
    const disponibles = MANTENIMIENTO_CARTAS_BASE.filter(c=>!excluirIds.includes(c.id) && !agotadas.includes(c.id));
    const pool = disponibles.length ? disponibles : MANTENIMIENTO_CARTAS_BASE.filter(c=>!agotadas.includes(c.id));
    if(!pool.length) return null;
    const def=pool[Math.floor(Math.random()*pool.length)];
    return {cartaId:def.id, progreso:0, nivelActual:1};
  }
  function inicializarCartasMantenimiento(){
    const cartas=[];
    for(let i=0;i<3;i++){
      const nueva=generarCartaAleatoriaMantenimiento(cartas.map(c=>c.cartaId));
      if(nueva) cartas.push(nueva);
    }
    return cartas;
  }
  function cambiarCartaMantenimiento(idx){
    if(state.mantenimientoCambioUsado) return false;
    const otras=state.mantenimientoCartas.filter((c,i)=>i!==idx).map(c=>c.cartaId);
    const nueva=generarCartaAleatoriaMantenimiento(otras);
    if(!nueva) return false;
    state.mantenimientoCartas[idx]=nueva;
    state.mantenimientoCambioUsado=true;
    guardarEstado();
    return true;
  }

  function mantenimientoBloqueadaPorEstado(def){
    if(def.id==='gestion_crisis') return !(state.estadio && state.estadio.satisfaccion<=-50);
    return false;
  }

  function textoCambioValor(label, antes, despues){
    const delta=despues-antes;
    if(delta===0) return '';
    return ` — ${label} ${antes} → ${despues} (${delta>0?'+':''}${delta})`;
  }
  function aplicarEfectoDirectaMantenimiento(def){
    const est=state.estadio;
    switch(def.id){
      case 'riego_emergencia': {
        const antes=est.campo; est.campo=Math.min(100, est.campo+20);
        return `El césped mejora su estado${textoCambioValor('campo',antes,est.campo)}`;
      }
      case 'renovacion_cesped': {
        const antes=est.campo; est.campo=100;
        return `El césped queda en condiciones perfectas${textoCambioValor('campo',antes,est.campo)}`;
      }
      case 'revision_terreno': {
        const antes=est.campo; est.campo=Math.min(100, est.campo+10);
        return `Pequeñas mejoras en el terreno de juego${textoCambioValor('campo',antes,est.campo)}`;
      }
      case 'evento_aficion': {
        const antes=est.satisfaccion; est.satisfaccion=Math.max(-100,Math.min(100, est.satisfaccion+15));
        return `La afición responde bien al evento${textoCambioValor('satisfacción',antes,est.satisfaccion)}`;
      }
      case 'gestion_crisis': {
        const antes=est.satisfaccion; est.satisfaccion=Math.max(est.satisfaccion, -30);
        return `Se calma el ambiente con las peñas${textoCambioValor('satisfacción',antes,est.satisfaccion)}`;
      }
      case 'plan_comunicacion':
        state.mantenimientoBonos = state.mantenimientoBonos||{};
        state.mantenimientoBonos.amortiguarPerdida = true;
        return 'La pérdida de satisfacción por un mal resultado quedará amortiguada en el próximo partido';
      default: return 'Aplicado';
    }
  }
  function aplicarNivelMejoraMantenimiento(def){
    if(!state.mantenimientoNiveles) state.mantenimientoNiveles={prevencionDesgaste:0, recuperacionCesped:0, boostSatisfaccion:0, proteccionSatisfaccion:0};
    const nivelNuevo=Math.min(NIVEL_MAXIMO_EQUIPO, nivelDeM(def.track)+1);
    state.mantenimientoNiveles[def.track]=nivelNuevo;
    const maxAlcanzado=nivelNuevo>=NIVEL_MAXIMO_EQUIPO;
    if(maxAlcanzado){
      state.mantenimientoCartasAgotadas = state.mantenimientoCartasAgotadas||[];
      state.mantenimientoCartasAgotadas.push(def.id);
    }
    return {nivelNuevo, maxAlcanzado};
  }

  function resolverCartaMantenimiento(idx, tiradas){
    const instancia=state.mantenimientoCartas[idx];
    const def=cartaDefM(instancia.cartaId);
    const suma=tiradas.reduce((a,b)=>a+b,0);
    let resultado;
    if(def.tipo==='directa'){
      const exito = suma>=def.dificultad;
      if(exito){
        const texto=aplicarEfectoDirectaMantenimiento(def);
        state.mantenimientoCartas[idx]=generarCartaAleatoriaMantenimiento(state.mantenimientoCartas.map(c=>c.cartaId)) || instancia;
        resultado={tipo:'directa', exito:true, suma, dificultad:def.dificultad, texto};
      } else {
        resultado={tipo:'directa', exito:false, suma, dificultad:def.dificultad, texto:'La carta se queda en tu mano — puedes reintentarlo más adelante'};
      }
    } else {
      const dificultadActual=dificultadActualNivelM(def);
      const exito = suma>=dificultadActual;
      if(exito){
        const {nivelNuevo, maxAlcanzado}=aplicarNivelMejoraMantenimiento(def);
        state.mantenimientoCartas[idx]=generarCartaAleatoriaMantenimiento(state.mantenimientoCartas.map(c=>c.cartaId)) || instancia;
        resultado={tipo:'nivel', exito:true, suma, dificultad:dificultadActual, nivelNuevo, maxAlcanzado, nombre:def.nombre};
      } else {
        resultado={tipo:'nivel', exito:false, suma, dificultad:dificultadActual, nombre:def.nombre, texto:'La carta se queda en tu mano — puedes reintentarlo más adelante'};
      }
    }
    guardarEstado();
    return resultado;
  }

  function colorCampo(valor){ if(valor>=70) return 'green'; if(valor>=40) return 'yellow'; return 'red'; }
  // Foto de un puesto del cuerpo técnico — si está vacante (despedido o
  // todavía sin cubrir), se usa la variante en blanco y negro cuyo
  // nombre de archivo termina en "_escenario" en vez de la foto normal.
  // Foto de un puesto del cuerpo técnico — nombres de archivo reales del
  // proyecto: {carpeta}/{archivo}_hombre.png o _mujer.png según quién lo
  // ocupe, y {archivo}_escenario.png (sin género) en blanco y negro
  // cuando el puesto está vacante (despedido o sin cubrir todavía).
  function staffFotoHTML(carpeta, archivoBase, alt, iconoFallback, genero, vacante){
    const ruta = vacante
      ? `assets/equipo_tecnico/${carpeta}/${archivoBase}_escenario.png`
      : `assets/equipo_tecnico/${carpeta}/${archivoBase}_${genero==='mujer'?'mujer':'hombre'}.png`;
    const estiloGris = vacante ? ' style="filter:grayscale(1)"' : '';
    return `<img src="${ruta}" alt="${alt}"${vacante?' title="Puesto vacante"':''} class="lm-staff-photo-img"${estiloGris} onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex';">
      <div class="lm-staff-photo-fallback${vacante?' lm-staff-photo-vacante':''}" style="display:none"><i class="ph ph-bold ${iconoFallback}"></i></div>`;
  }
  // Cuánto se "seca" visualmente el campo — nada sutil a propósito: con
  // el césped perfecto (100) no hay overlay, y va ganando marrón de forma
  // lineal y notoria a medida que baja, hasta quedar claramente reseco
  // cerca de 0. Coexiste con el clima porque es una capa aparte dentro de
  // #lmPitchBox (igual que la capa de lluvia/nieve): el filtro de clima
  // se sigue aplicando sobre #lmPitchBox entero, por encima de esto.
  function campoOpacidadDesgaste(campo){
    const c=Math.max(0,Math.min(100, campo===undefined?100:campo));
    return Math.max(0, (100-c)/100*0.85).toFixed(2);
  }
  function campoBarraHTML(valor, mini){
    const wrap = mini ? 'lm-campo-bar-wrap-mini' : 'lm-campo-bar-wrap';
    return `<div class="${wrap}"><div class="fatigue-bar fatigue-${colorCampo(valor)}" style="width:${Math.max(0,Math.min(100,valor))}%"></div></div>`;
  }
  // Barra bidireccional — CALCO exacto de la barra de MORAL de Copa
  // Leyendas (.morale-track/.morale-fill), reutilizada tanto para la
  // satisfacción de la afición (-100..100) como para la moral del propio
  // equipo (-50..50). "claseExtra" permite un acento de color distinto
  // para cada una (oro para afición, verde/rojo de siempre para moral),
  // así las tres barras del estadio quedan bien diferenciadas entre sí.
  function bidireccionalBarraHTML(valor, rango, claseExtra){
    const pct=Math.min(50, Math.abs(valor)/rango*50);
    const positivo=valor>=0;
    const left = positivo ? '50%' : (50-pct)+'%';
    return `<div class="morale-track">
      <div class="morale-neg-zone"></div>
      <div class="morale-pos-zone"></div>
      <div class="morale-center"></div>
      <div class="morale-fill ${claseExtra||''} ${positivo?'positive':'negative'}" style="width:${pct}%;left:${left}"></div>
      <div class="morale-zero-marker"></div>
    </div>`;
  }
  function satisfaccionBarraHTML(valor){ return bidireccionalBarraHTML(valor, 100, 'lm-sat-fill'); }
  function moralBarraHTML(valor){ return bidireccionalBarraHTML(valor, 50, ''); }

  function formatoDinero(v){ return Math.round(v||0).toLocaleString('es-ES')+'€'; }
  function registrarMovimientoFinanciero(concepto, monto, jornada){
    state.finanzasHistorial = state.finanzasHistorial||[];
    state.finanzasHistorial.push({concepto, monto:Math.round(monto), jornada, mes:Math.floor((jornada-1)/4)+1});
    if(state.finanzasHistorial.length>250) state.finanzasHistorial=state.finanzasHistorial.slice(-250);
  }
  function nivelTotalDe(niveles){ return Object.values(niveles||{}).reduce((a,b)=>a+b,0); }
  // Nómina mensual — jugadores + los 4 departamentos técnicos. Cuanto más
  // nivel tenga un departamento, más cuesta mantenerlo (igual que un
  // jugador de sobre mejor es más caro). Se cobra una vez al entrar en
  // cada mes (cada 4 jornadas).
  function calcularNominaMensual(){
    const nominaJugadores=(state.plantilla||[]).reduce((s,p)=>s+(p.salario||0),0);
    const trab=state.trabajadores||{};
    const nominaMedico=(trab.medico?trab.medico.sueldo:0)+nivelTotalDe(state.medicoNiveles)*1200;
    const nominaMantenimiento=(trab.mantenimiento?trab.mantenimiento.sueldo:0)+nivelTotalDe(state.mantenimientoNiveles)*1200;
    const nominaDG=(trab.directorGeneral?trab.directorGeneral.sueldo:0)+nivelTotalDe(state.directorGeneralNiveles)*1500;
    const nominaDD=(trab.directorDeportivo?trab.directorDeportivo.sueldo:0)+nivelTotalDe(state.directorDeportivoNiveles)*1500;
    const nominaStaff=nominaMedico+nominaMantenimiento+nominaDG+nominaDD;
    const ingresoPatrocinio=nivelDeDG('ingresoPatrocinio')*15000;
    return {nominaJugadores, nominaStaff, ingresoPatrocinio, total:nominaJugadores+nominaStaff};
  }
  function aplicarNominaMensual(){
    const n=calcularNominaMensual();
    let nominaJugadores=n.nominaJugadores;
    if(state.directorDeportivoBonos && state.directorDeportivoBonos.descuentoNomina){
      nominaJugadores=Math.round(nominaJugadores*(1-state.directorDeportivoBonos.descuentoNomina));
      state.directorDeportivoBonos.descuentoNomina=0;
    }
    let nominaStaff=n.nominaStaff;
    if(state.directorGeneralBonos && state.directorGeneralBonos.descuentoNomina){
      nominaStaff=Math.round(nominaStaff*(1-state.directorGeneralBonos.descuentoNomina));
      state.directorGeneralBonos.descuentoNomina=0;
    }
    state.capital=Math.round((state.capital||0)-nominaJugadores-nominaStaff+n.ingresoPatrocinio);
    registrarMovimientoFinanciero('Nómina de jugadores', -nominaJugadores, state.jornadaActual);
    registrarMovimientoFinanciero('Nómina del cuerpo técnico', -nominaStaff, state.jornadaActual);
    if(n.ingresoPatrocinio>0) registrarMovimientoFinanciero('Patrocinio mensual', n.ingresoPatrocinio, state.jornadaActual);
  }

  /* ---------- 9c-bis. TRABAJADORES del cuerpo técnico — cada uno de los
     4 puestos (médico, mantenimiento, director general, director
     deportivo) lo ocupa una persona con su propio nivel (1-5★) y sueldo.
     Cada mes aparece un puñado de candidatos nuevos para poder comparar
     si compensa cambiar; despedir deja el puesto vacante (sin sueldo,
     pero también sin nadie al mando) hasta contratar a otra persona. ---------- */
  const ROLES_TRABAJO=['medico','mantenimiento','directorGeneral','directorDeportivo'];
  const SUELDO_BASE_ROL={medico:4000, mantenimiento:4000, directorGeneral:5000, directorDeportivo:5000};
  const NOMBRE_ROL={medico:'Equipo Médico', mantenimiento:'Mantenimiento y Seguridad', directorGeneral:'Director General', directorDeportivo:'Director Deportivo'};
  function nivelAleatorioTrabajador(){
    // 1★ es lo más común, 5★ muy raro — igual de espíritu que la rareza
    // de un sobre de fichajes.
    const pesos=[40,28,18,10,4]; // nivel 1..5
    const total=pesos.reduce((a,b)=>a+b,0);
    let r=Math.random()*total;
    for(let i=0;i<pesos.length;i++){ r-=pesos[i]; if(r<=0) return i+1; }
    return 1;
  }
  function generarCandidatoTrabajo(rol){
    const nivel=nivelAleatorioTrabajador();
    const sueldo=Math.round(SUELDO_BASE_ROL[rol]*(0.55+nivel*0.55)*(0.9+Math.random()*0.2));
    return {id:'cand'+Date.now()+Math.floor(Math.random()*100000), rol, ...nombreTrabajadorAleatorio(), nivel, sueldo};
  }
  function regenerarCandidatosTrabajo(){
    const candidatos=[];
    ROLES_TRABAJO.forEach(rol=>{
      candidatos.push(generarCandidatoTrabajo(rol));
      candidatos.push(generarCandidatoTrabajo(rol));
    });
    state.candidatosTrabajo=candidatos;
  }
  function contratarTrabajador(rol, candidatoId){
    const candidato=(state.candidatosTrabajo||[]).find(c=>c.id===candidatoId && c.rol===rol);
    if(!candidato) return false;
    if(!state.trabajadores) state.trabajadores={};
    state.trabajadores[rol]={id:'t'+Date.now(), nombre:candidato.nombre, genero:candidato.genero, nivel:candidato.nivel, sueldo:candidato.sueldo};
    state.candidatosTrabajo=state.candidatosTrabajo.filter(c=>c.id!==candidatoId);
    guardarEstado();
    return true;
  }
  function despedirTrabajador(rol){
    if(!state.trabajadores) return;
    state.trabajadores[rol]=null;
    guardarEstado();
  }

  /* ---------- 9d. CARTAS DEL DIRECTOR GENERAL (dorado) — economía y
     marca del club: patrocinios, merchandising, aforo y precio de
     entrada. Mismo sistema de 10 cartas que médico/mantenimiento. ---------- */
  const DIRECTOR_GENERAL_CARTAS_BASE = [
    {id:'patrocinio_puntual',    tipo:'directa', nombre:'Acuerdo de Patrocinio Puntual', icon:'ph-handshake',      dificultad:6, desc:'Ingreso instantáneo de capital por un acuerdo puntual'},
    {id:'venta_especial',        tipo:'directa', nombre:'Venta Especial de Merchandising', icon:'ph-t-shirt',      dificultad:5, desc:'Ingreso instantáneo por una campaña de camisetas'},
    {id:'renegociacion_gastos',  tipo:'directa', nombre:'Renegociación de Contratos',    icon:'ph-file-text',      dificultad:8, desc:'La nómina del próximo mes será más barata'},
    {id:'evento_corporativo',    tipo:'directa', nombre:'Evento Corporativo',            icon:'ph-confetti',       dificultad:7, desc:'Ingreso instantáneo de capital y un pequeño impulso a la satisfacción'},
    {id:'auditoria_financiera',  tipo:'directa', nombre:'Auditoría Financiera',          icon:'ph-chart-line-up',  dificultad:9, desc:'Ingreso instantáneo de capital, mayor que el habitual'},
    {id:'campana_socios',        tipo:'directa', nombre:'Campaña de Socios',             icon:'ph-megaphone',      dificultad:6, desc:'Impulsa la asistencia prevista del próximo partido en casa'},
    {id:'ampliacion_grada',      tipo:'nivel', track:'aforoExtra',         nombre:'Ampliación de Grada',          icon:'ph-stairs',       dificultadBase:9, dificultadPaso:5, desc:'Amplía permanentemente el aforo del estadio'},
    {id:'cartera_patrocinadores',tipo:'nivel', track:'ingresoPatrocinio',  nombre:'Cartera de Patrocinadores',    icon:'ph-handshake',    dificultadBase:8, dificultadPaso:4, desc:'Aumenta el ingreso fijo por patrocinio cada mes'},
    {id:'tienda_merchandising',  tipo:'nivel', track:'ingresoMerchandising',nombre:'Tienda y Merchandising',      icon:'ph-t-shirt',      dificultadBase:8, dificultadPaso:4, desc:'Aumenta lo recaudado en merchandising por cada asistente'},
    {id:'relaciones_aficion',    tipo:'nivel', track:'toleranciaPrecio',   nombre:'Relaciones con la Afición',    icon:'ph-users-three',  dificultadBase:8, dificultadPaso:4, desc:'Permite subir el precio de la entrada con menos enfado de la afición'}
  ];
  function cartaDefDG(id){ return DIRECTOR_GENERAL_CARTAS_BASE.find(c=>c.id===id); }
  function nivelDeDG(track){ return (state.directorGeneralNiveles && state.directorGeneralNiveles[track]) || 0; }
  function dificultadActualNivelDG(def){ return def.dificultadBase + nivelDeDG(def.track)*def.dificultadPaso; }
  function generarCartaAleatoriaDG(excluirIds){
    excluirIds=excluirIds||[];
    const agotadas=state.directorGeneralCartasAgotadas||[];
    const disponibles=DIRECTOR_GENERAL_CARTAS_BASE.filter(c=>!excluirIds.includes(c.id) && !agotadas.includes(c.id));
    const pool=disponibles.length?disponibles:DIRECTOR_GENERAL_CARTAS_BASE.filter(c=>!agotadas.includes(c.id));
    if(!pool.length) return null;
    const def=pool[Math.floor(Math.random()*pool.length)];
    return {cartaId:def.id, progreso:0, nivelActual:1};
  }
  function inicializarCartasDG(){
    const cartas=[];
    for(let i=0;i<3;i++){ const nueva=generarCartaAleatoriaDG(cartas.map(c=>c.cartaId)); if(nueva) cartas.push(nueva); }
    return cartas;
  }
  function cambiarCartaDG(idx){
    if(state.directorGeneralCambioUsado) return false;
    const otras=state.directorGeneralCartas.filter((c,i)=>i!==idx).map(c=>c.cartaId);
    const nueva=generarCartaAleatoriaDG(otras);
    if(!nueva) return false;
    state.directorGeneralCartas[idx]=nueva;
    state.directorGeneralCambioUsado=true;
    guardarEstado();
    return true;
  }
  function aplicarEfectoDirectaDG(def){
    switch(def.id){
      case 'patrocinio_puntual': {
        const monto=18000+Math.round(Math.random()*7000);
        state.capital=(state.capital||0)+monto;
        registrarMovimientoFinanciero('Patrocinio puntual', monto, state.jornadaActual);
        return `Ingreso de ${formatoDinero(monto)}`;
      }
      case 'venta_especial': {
        const monto=9000+Math.round(Math.random()*4000);
        state.capital=(state.capital||0)+monto;
        registrarMovimientoFinanciero('Venta especial de merchandising', monto, state.jornadaActual);
        return `Ingreso de ${formatoDinero(monto)}`;
      }
      case 'renegociacion_gastos':
        state.directorGeneralBonos=state.directorGeneralBonos||{};
        state.directorGeneralBonos.descuentoNomina=0.15;
        return 'La nómina del cuerpo técnico del próximo mes será un 15% más barata';
      case 'evento_corporativo': {
        const monto=12000+Math.round(Math.random()*5000);
        state.capital=(state.capital||0)+monto;
        state.estadio.satisfaccion=Math.max(-100,Math.min(100, state.estadio.satisfaccion+4));
        registrarMovimientoFinanciero('Evento corporativo', monto, state.jornadaActual);
        return `Ingreso de ${formatoDinero(monto)} y la afición lo agradece`;
      }
      case 'auditoria_financiera': {
        const monto=25000+Math.round(Math.random()*10000);
        state.capital=(state.capital||0)+monto;
        registrarMovimientoFinanciero('Auditoría financiera', monto, state.jornadaActual);
        return `Ingreso de ${formatoDinero(monto)}`;
      }
      case 'campana_socios':
        state.directorGeneralBonos=state.directorGeneralBonos||{};
        state.directorGeneralBonos.boostAsistencia=0.10;
        return 'La asistencia del próximo partido en casa subirá algo más de lo habitual';
      default: return 'Aplicado';
    }
  }
  function aplicarNivelMejoraDG(def){
    if(!state.directorGeneralNiveles) state.directorGeneralNiveles={aforoExtra:0, ingresoPatrocinio:0, ingresoMerchandising:0, toleranciaPrecio:0};
    const nivelNuevo=Math.min(NIVEL_MAXIMO_EQUIPO, nivelDeDG(def.track)+1);
    state.directorGeneralNiveles[def.track]=nivelNuevo;
    if(def.track==='aforoExtra'){
      state.estadio.aforoTotal=(state.estadio.aforoTotal||12000)+1500;
    }
    const maxAlcanzado=nivelNuevo>=NIVEL_MAXIMO_EQUIPO;
    if(maxAlcanzado){
      state.directorGeneralCartasAgotadas=state.directorGeneralCartasAgotadas||[];
      state.directorGeneralCartasAgotadas.push(def.id);
    }
    return {nivelNuevo, maxAlcanzado};
  }
  function resolverCartaDG(idx, tiradas){
    const instancia=state.directorGeneralCartas[idx];
    const def=cartaDefDG(instancia.cartaId);
    const suma=tiradas.reduce((a,b)=>a+b,0);
    let resultado;
    if(def.tipo==='directa'){
      const exito=suma>=def.dificultad;
      if(exito){
        const texto=aplicarEfectoDirectaDG(def);
        state.directorGeneralCartas[idx]=generarCartaAleatoriaDG(state.directorGeneralCartas.map(c=>c.cartaId)) || instancia;
        resultado={tipo:'directa', exito:true, suma, dificultad:def.dificultad, texto};
      } else {
        resultado={tipo:'directa', exito:false, suma, dificultad:def.dificultad, texto:'La carta se queda en tu mano — puedes reintentarlo más adelante'};
      }
    } else {
      const dificultadActual=dificultadActualNivelDG(def);
      const exito=suma>=dificultadActual;
      if(exito){
        const {nivelNuevo, maxAlcanzado}=aplicarNivelMejoraDG(def);
        state.directorGeneralCartas[idx]=generarCartaAleatoriaDG(state.directorGeneralCartas.map(c=>c.cartaId)) || instancia;
        resultado={tipo:'nivel', exito:true, suma, dificultad:dificultadActual, nivelNuevo, maxAlcanzado, nombre:def.nombre};
      } else {
        resultado={tipo:'nivel', exito:false, suma, dificultad:dificultadActual, nombre:def.nombre, texto:'La carta se queda en tu mano — puedes reintentarlo más adelante'};
      }
    }
    guardarEstado();
    return resultado;
  }

  /* ---------- 9e. CARTAS DEL DIRECTOR DEPORTIVO (plata) — fichajes.
     La pieza especial es "Sobres de Fichajes" (tipo 'sobre'): sube de
     nivel con dados igual que una carta de nivel normal, pero además
     lleva un botón propio de "ABRIR SOBRE" siempre visible una vez
     alcanzado un nivel — se puede abrir cuando se quiera (pagando un
     coste de capital), sin depender de la tirada. Al completar el nivel
     3 se abre automáticamente un sobre de máxima calidad gratis, como
     recompensa. ---------- */
  const DIRECTOR_DEPORTIVO_CARTAS_BASE = [
    {id:'ojeo_urgente',            tipo:'directa', nombre:'Ojeo Urgente',            icon:'ph-binoculars',   dificultad:8, desc:'Trae gratis un sobre de fichajes al nivel actual de tus Sobres'},
    {id:'venta_jugador',           tipo:'directa', nombre:'Venta de Jugador',        icon:'ph-hand-coins',   dificultad:6, desc:'Vende a tu peor suplente por un ingreso de capital'},
    {id:'prestamo_breve',          tipo:'directa', nombre:'Préstamo Breve',          icon:'ph-bank',         dificultad:6, desc:'Ingreso instantáneo de capital'},
    {id:'negociacion_salarial',    tipo:'directa', nombre:'Negociación Salarial',    icon:'ph-file-text',    dificultad:9, desc:'La nómina de jugadores del próximo mes será más barata'},
    {id:'revision_medica_fichajes',tipo:'directa', nombre:'Revisión Médica de Fichajes', icon:'ph-heartbeat', dificultad:7, desc:'Reduce el riesgo de lesión de la plantilla en el próximo partido'},
    {id:'gira_promocional',        tipo:'directa', nombre:'Gira Promocional',        icon:'ph-airplane-tilt',dificultad:6, desc:'Ingreso instantáneo de capital y un pequeño impulso a la moral'},
    {id:'sobres_fichajes',   tipo:'sobre', track:'sobresFichajes', nombre:'Sobres de Fichajes',      icon:'ph-envelope-open', dificultadBase:9, dificultadPaso:5, desc:'Sube el nivel de tus sobres — ábrelos cuando quieras para ver qué jugadores traen'},
    {id:'red_ojeadores',     tipo:'nivel', track:'calidadOjeo',    nombre:'Red de Ojeadores',        icon:'ph-binoculars',    dificultadBase:8, dificultadPaso:4, desc:'Mejora la calidad de los jugadores que salen en los sobres'},
    {id:'negociacion_contratos',tipo:'nivel', track:'ahorroSalarial', nombre:'Negociación de Contratos', icon:'ph-handshake', dificultadBase:8, dificultadPaso:4, desc:'Reduce el salario de los jugadores fichados por sobre'},
    {id:'formacion_cantera', tipo:'nivel', track:'costeSobres',    nombre:'Formación de Cantera',    icon:'ph-graduation-cap',dificultadBase:8, dificultadPaso:4, desc:'Reduce la dificultad para subir de nivel los Sobres de Fichajes'}
  ];
  function cartaDefDD(id){ return DIRECTOR_DEPORTIVO_CARTAS_BASE.find(c=>c.id===id); }
  function nivelDeDD(track){ return (state.directorDeportivoNiveles && state.directorDeportivoNiveles[track]) || 0; }
  function dificultadActualNivelDD(def){
    let d=def.dificultadBase + nivelDeDD(def.track)*def.dificultadPaso;
    if(def.track==='sobresFichajes') d-=nivelDeDD('costeSobres')*2;
    return Math.max(4, d);
  }
  function generarCartaAleatoriaDD(excluirIds){
    excluirIds=excluirIds||[];
    const agotadas=state.directorDeportivoCartasAgotadas||[];
    const disponibles=DIRECTOR_DEPORTIVO_CARTAS_BASE.filter(c=>!excluirIds.includes(c.id) && !agotadas.includes(c.id));
    const pool=disponibles.length?disponibles:DIRECTOR_DEPORTIVO_CARTAS_BASE.filter(c=>!agotadas.includes(c.id));
    if(!pool.length) return null;
    const def=pool[Math.floor(Math.random()*pool.length)];
    return {cartaId:def.id, progreso:0, nivelActual:1};
  }
  function inicializarCartasDD(){
    const cartas=[];
    for(let i=0;i<3;i++){ const nueva=generarCartaAleatoriaDD(cartas.map(c=>c.cartaId)); if(nueva) cartas.push(nueva); }
    return cartas;
  }
  function cambiarCartaDD(idx){
    if(state.directorDeportivoCambioUsado) return false;
    const otras=state.directorDeportivoCartas.filter((c,i)=>i!==idx).map(c=>c.cartaId);
    const nueva=generarCartaAleatoriaDD(otras);
    if(!nueva) return false;
    state.directorDeportivoCartas[idx]=nueva;
    state.directorDeportivoCambioUsado=true;
    guardarEstado();
    return true;
  }
  const SOBRE_COSTES={1:5000, 2:12000, 3:25000};
  // Genera un jugador de sobre: cuanto mayor el nivel del sobre y la Red
  // de Ojeadores, mejor (y más caro de mantener) — tal como se pidió.
  function generarJugadorSobre(nivelSobre){
    const calidad=nivelDeDD('calidadOjeo');
    const overall=Math.max(45, Math.min(94, 50+nivelSobre*10+calidad*4+Math.floor(Math.random()*8)));
    const posiciones=['POR','DFC','LI','LD','MC','EI','ED','DC'];
    const position=posiciones[Math.floor(Math.random()*posiciones.length)];
    const variar=()=>Math.max(30,Math.min(96, overall+Math.floor(Math.random()*13)-6));
    const ahorro=nivelDeDD('ahorroSalarial')*0.12;
    const salario=Math.round(calcularSalario(overall)*(1-ahorro));
    return {
      id:'s'+Date.now()+Math.floor(Math.random()*100000), name:nombreJugadorAleatorio(), position, overall,
      attack:variar(), defense:variar(), pace:variar(), passing:variar(), technique:variar(),
      fatigue:100, racha:0, esSuplente:true,
      injured:false, injuryWeeks:0, injurySeverity:null,
      salario, nivelSobre
    };
  }
  function abrirSobreEnNivel(nivelSobre){
    const coste=SOBRE_COSTES[nivelSobre]||SOBRE_COSTES[1];
    if((state.capital||0)<coste) return null;
    state.capital-=coste;
    registrarMovimientoFinanciero('Sobre de fichajes (nivel '+nivelSobre+')', -coste, state.jornadaActual);
    const jugadores=[1,2,3].map(()=>generarJugadorSobre(nivelSobre));
    guardarEstado();
    return jugadores;
  }
  function ficharJugadorSobre(jugador){
    state.plantilla.push({...jugador, esSuplente:true});
    guardarEstado();
  }
  // Venta manual de jugadores desde la burbuja del Director Deportivo —
  // blindada para no dejar nunca la plantilla sin gente para jugar:
  // nunca por debajo de 11 en total, y siempre al menos 11 SANOS
  // disponibles después de la venta (contando lesionados aparte).
  function puedeVenderJugador(jugadorId){
    const plantilla=state.plantilla||[];
    if(plantilla.length<=11) return {ok:false, motivo:'No puedes bajar de 11 jugadores en la plantilla'};
    const sanosSinEste=plantilla.filter(p=>p.id!==jugadorId && !p.injured).length;
    if(sanosSinEste<11) return {ok:false, motivo:'Necesitas al menos 11 jugadores sanos disponibles después de la venta'};
    return {ok:true};
  }
  function venderJugadorManual(jugadorId){
    const jugador=(state.plantilla||[]).find(p=>p.id===jugadorId);
    if(!jugador) return {ok:false, motivo:'Ese jugador ya no está en la plantilla'};
    const chequeo=puedeVenderJugador(jugadorId);
    if(!chequeo.ok) return chequeo;
    const monto=Math.max(3000, Math.round(jugador.overall*400));
    state.plantilla=state.plantilla.filter(p=>p.id!==jugadorId);
    if(state.alineacion){ Object.keys(state.alineacion).forEach(k=>{ if(state.alineacion[k]===jugadorId) delete state.alineacion[k]; }); }
    state.capital=(state.capital||0)+monto;
    registrarMovimientoFinanciero('Venta de '+jugador.name, monto, state.jornadaActual);
    guardarEstado();
    return {ok:true, monto, jugador};
  }
  function aplicarEfectoDirectaDD(def){
    switch(def.id){
      case 'ojeo_urgente': {
        const nivelSobre=Math.max(1, nivelDeDD('sobresFichajes'));
        const jugadores=[1,2,3].map(()=>generarJugadorSobre(nivelSobre));
        return {texto:`Tu ojeador de urgencia trae un sobre de nivel ${nivelSobre} gratis`, sobreAbierto:jugadores};
      }
      case 'venta_jugador': {
        const peor=state.plantilla.length?[...state.plantilla].sort((a,b)=>a.overall-b.overall)[0]:null;
        if(!peor) return {texto:'No queda ningún jugador que vender'};
        const monto=Math.max(3000, Math.round(peor.overall*400));
        state.plantilla=state.plantilla.filter(p=>p.id!==peor.id);
        if(state.alineacion){ Object.keys(state.alineacion).forEach(k=>{ if(state.alineacion[k]===peor.id) delete state.alineacion[k]; }); }
        state.capital=(state.capital||0)+monto;
        registrarMovimientoFinanciero('Venta de '+peor.name, monto, state.jornadaActual);
        return {texto:`${peor.name} sale del club por ${formatoDinero(monto)}`};
      }
      case 'prestamo_breve': {
        const monto=15000+Math.round(Math.random()*6000);
        state.capital=(state.capital||0)+monto;
        registrarMovimientoFinanciero('Préstamo breve', monto, state.jornadaActual);
        return {texto:`Ingreso de ${formatoDinero(monto)}`};
      }
      case 'negociacion_salarial':
        state.directorDeportivoBonos=state.directorDeportivoBonos||{};
        state.directorDeportivoBonos.descuentoNomina=0.15;
        return {texto:'La nómina de jugadores del próximo mes será un 15% más barata'};
      case 'revision_medica_fichajes':
        state.medicoBonos=state.medicoBonos||{};
        state.medicoBonos.riesgoLesionSiguiente=(state.medicoBonos.riesgoLesionSiguiente||1)*0.6;
        return {texto:'Riesgo de lesión reducido en el próximo partido'};
      case 'gira_promocional': {
        const monto=10000+Math.round(Math.random()*4000);
        state.capital=(state.capital||0)+monto;
        state.moral=Math.max(-50,Math.min(50,(state.moral||0)+3));
        registrarMovimientoFinanciero('Gira promocional', monto, state.jornadaActual);
        return {texto:`Ingreso de ${formatoDinero(monto)} y un empujón a la moral`};
      }
      default: return {texto:'Aplicado'};
    }
  }
  function aplicarNivelMejoraDD(def){
    if(!state.directorDeportivoNiveles) state.directorDeportivoNiveles={calidadOjeo:0, ahorroSalarial:0, sobresFichajes:0, costeSobres:0};
    const nivelNuevo=Math.min(NIVEL_MAXIMO_EQUIPO, nivelDeDD(def.track)+1);
    state.directorDeportivoNiveles[def.track]=nivelNuevo;
    const maxAlcanzado=nivelNuevo>=NIVEL_MAXIMO_EQUIPO;
    if(maxAlcanzado){
      state.directorDeportivoCartasAgotadas=state.directorDeportivoCartasAgotadas||[];
      state.directorDeportivoCartasAgotadas.push(def.id);
    }
    let sobreAutomatico=null;
    if(def.track==='sobresFichajes' && maxAlcanzado){
      sobreAutomatico=[1,2,3].map(()=>generarJugadorSobre(3));
    }
    return {nivelNuevo, maxAlcanzado, sobreAutomatico};
  }
  function resolverCartaDD(idx, tiradas){
    const instancia=state.directorDeportivoCartas[idx];
    const def=cartaDefDD(instancia.cartaId);
    const suma=tiradas.reduce((a,b)=>a+b,0);
    let resultado;
    if(def.tipo==='directa'){
      const exito=suma>=def.dificultad;
      if(exito){
        const efecto=aplicarEfectoDirectaDD(def);
        state.directorDeportivoCartas[idx]=generarCartaAleatoriaDD(state.directorDeportivoCartas.map(c=>c.cartaId)) || instancia;
        resultado={tipo:'directa', exito:true, suma, dificultad:def.dificultad, texto:efecto.texto, sobreAbierto:efecto.sobreAbierto||null};
      } else {
        resultado={tipo:'directa', exito:false, suma, dificultad:def.dificultad, texto:'La carta se queda en tu mano — puedes reintentarlo más adelante'};
      }
    } else {
      const dificultadActual=dificultadActualNivelDD(def);
      const exito=suma>=dificultadActual;
      if(exito){
        const {nivelNuevo, maxAlcanzado, sobreAutomatico}=aplicarNivelMejoraDD(def);
        state.directorDeportivoCartas[idx]=generarCartaAleatoriaDD(state.directorDeportivoCartas.map(c=>c.cartaId)) || instancia;
        resultado={tipo:'nivel', exito:true, suma, dificultad:dificultadActual, nivelNuevo, maxAlcanzado, nombre:def.nombre, sobreAbierto:sobreAutomatico};
      } else {
        resultado={tipo:'nivel', exito:false, suma, dificultad:dificultadActual, nombre:def.nombre, texto:'La carta se queda en tu mano — puedes reintentarlo más adelante'};
      }
    }
    guardarEstado();
    return resultado;
  }

  /* ---------- 10. Abandonar la liga ---------- */
  function abandonarLiga(){
    function proceder(){
      borrarEstado();
      state=nuevoEstadoSinEmpezar();
      setupStep=1;
      setupData={liga:'es', moneda:null, nombre:'', escudo:null};
      render();
    }
    if(typeof window.showConfirmPopup==='function'){
      window.showConfirmPopup('¿Abandonar la liga? Se perderá todo el progreso de esta temporada y empezarás una partida nueva.', proceder, 'ABANDONAR');
    } else if(confirm('¿Seguro que quieres abandonar la liga? Se perderá todo el progreso de esta temporada y empezarás una partida nueva.')){
      proceder();
    }
  }

  /* ---------- 11. Render: flujo de entrada (liga → moneda → nombre → escudo) ---------- */
  function renderSetup(){
    const root=document.getElementById('ligaManagerScreen');
    let inner='';

    if(setupStep===1){
      inner=`
        <div class="lm-setup-title">ELIGE TU LIGA</div>
        <div class="lm-setup-list">
          ${LIGAS_DISPONIBLES.map(l=>`
            <div class="lm-setup-option ${l.activa?'active selected':'disabled'}" data-liga="${l.id}">
              <img src="${l.flagImg}" alt="" style="width:22px;height:16px;object-fit:cover;border-radius:2px;vertical-align:middle;margin-right:10px">${l.nombre}
              ${!l.activa?'<span class="lm-setup-soon">PRÓXIMAMENTE</span>':''}
            </div>`).join('')}
        </div>
        <div class="lm-popup-actions"><button id="lmSetupNext" class="mode-card-btn mode-card-btn-gold">SIGUIENTE</button></div>
      `;
    } else if(setupStep===2){
      inner=`
        <div class="lm-setup-title">ELIGE TU MONEDA</div>
        <div class="lm-setup-list lm-setup-list-row">
          ${Object.keys(MONEDAS).map(k=>`
            <div class="lm-setup-option lm-setup-option-currency ${setupData.moneda===k?'selected':''}" data-moneda="${k}">
              <span style="font-size:22px">${MONEDAS[k].symbol}</span><br>${MONEDAS[k].label}
            </div>`).join('')}
        </div>
        <div class="lm-popup-actions"><button id="lmSetupNext" class="mode-card-btn mode-card-btn-gold" ${setupData.moneda?'':'disabled'}>SIGUIENTE</button></div>
      `;
    } else if(setupStep===3.5){
      inner=`
        <div class="lm-setup-title">TU CLUB YA ESTÁ CREADO</div>
        <p class="lm-setup-desc">Encontramos un equipo guardado de una partida anterior. Puedes usarlo tal cual o cambiar nombre/escudo.</p>
        <div class="lm-crest-preview">${crestHTML(setupData.escudo, 64)}</div>
        <div class="lm-setup-title" style="font-size:16px;margin:6px 0 22px">${setupData.nombre}</div>
        <div class="lm-popup-actions">
          <button id="lmSetupConfirm" class="mode-card-btn mode-card-btn-gold">EMPEZAR TEMPORADA</button>
          <button id="lmSetupCambiar" class="mode-card-btn mode-card-btn-secondary">CAMBIAR NOMBRE/ESCUDO</button>
        </div>
      `;
    } else if(setupStep===3){
      inner=`
        <div class="lm-setup-title">NOMBRE DE TU EQUIPO</div>
        <p class="lm-setup-desc">Este será tu club, recién ascendido a Primera. El resto de la liga son los 19 equipos reales de La Liga.</p>
        <input id="lmSetupNombre" type="text" maxlength="24" placeholder="Ej: CF Ejemplo" class="lm-setup-input" value="${setupData.nombre||''}">
        <div class="lm-popup-actions"><button id="lmSetupNext" class="mode-card-btn mode-card-btn-gold" ${setupData.nombre&&setupData.nombre.trim()?'':'disabled'}>SIGUIENTE</button></div>
      `;
    } else if(setupStep===4){
      inner=`
        <div class="lm-setup-title">CREA TU ESCUDO</div>
        <p class="lm-setup-desc">Se abre el mismo editor de escudos de Copa Leyendas (por capas o subiendo una imagen) — solo que esto se guarda aparte, como identidad de Liga Manager.</p>
        <div class="lm-crest-preview">${crestHTML(setupData.escudo, 64)}</div>
        <div class="lm-popup-actions"><button id="lmAbrirEditorBtn" class="mode-card-btn mode-card-btn-gold">ABRIR EDITOR DE ESCUDOS</button></div>
        <div class="lm-popup-actions">
          <button id="lmSetupConfirm" class="mode-card-btn mode-card-btn-gold" ${setupData.escudo?'':'disabled'}>EMPEZAR TEMPORADA</button>
        </div>
      `;
    }

    root.innerHTML = `
      <div class="lm-wrap">
        <div class="lm-setup-card">
          <div class="lm-setup-header">LIGA MANAGER — NUEVA PARTIDA</div>
          ${inner}
        </div>
      </div>`;

    if(setupStep===1){
      root.querySelectorAll('[data-liga].active').forEach(el=>{
        el.addEventListener('click', ()=>{
          setupData.liga=el.getAttribute('data-liga');
          root.querySelectorAll('[data-liga]').forEach(o=>o.classList.remove('selected'));
          el.classList.add('selected');
        });
      });
      const next=document.getElementById('lmSetupNext');
      if(next) next.addEventListener('click', ()=>{ if(typeof window.playSound==='function') window.playSound('select'); setupStep=2; renderSetup(); });
    } else if(setupStep===2){
      root.querySelectorAll('[data-moneda]').forEach(el=>{
        el.addEventListener('click', ()=>{
          setupData.moneda=el.getAttribute('data-moneda');
          if(typeof window.playSound==='function') window.playSound('select');
          renderSetup();
        });
      });
      const next=document.getElementById('lmSetupNext');
      if(next) next.addEventListener('click', ()=>{
        if(!setupData.moneda) return;
        if(typeof window.playSound==='function') window.playSound('select');
        // Si ya hay una identidad (nombre+escudo) guardada de antes —
        // propia de Liga Manager o, si es la primera vez, la preferencia
        // fija de Copa Leyendas — no se vuelve a pedir.
        const identidad=identidadPorDefecto();
        if(identidad && identidad.nombre && identidad.crest){
          setupData.nombre=identidad.nombre;
          setupData.escudo=identidad.crest;
          setupStep=3.5;
        }else{
          setupStep=3;
        }
        renderSetup();
      });
    } else if(setupStep===3.5){
      const confirmBtn=document.getElementById('lmSetupConfirm');
      if(confirmBtn) confirmBtn.addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        guardarIdentidad(setupData.nombre, setupData.escudo);
        empezarTemporada(setupData.nombre, setupData.moneda, setupData.liga, setupData.escudo);
        render();
      });
      const cambiarBtn=document.getElementById('lmSetupCambiar');
      if(cambiarBtn) cambiarBtn.addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        setupData.nombre=''; setupData.escudo=null;
        setupStep=3; renderSetup();
      });
    } else if(setupStep===3){
      const input=document.getElementById('lmSetupNombre');
      const next=document.getElementById('lmSetupNext');
      if(input) input.addEventListener('input', ()=>{
        setupData.nombre=input.value;
        if(next) next.disabled = !input.value.trim();
      });
      if(next) next.addEventListener('click', ()=>{
        if(!setupData.nombre || !setupData.nombre.trim()) return;
        if(typeof window.playSound==='function') window.playSound('select');
        setupStep=4; renderSetup();
      });
    } else if(setupStep===4){
      const abrirBtn=document.getElementById('lmAbrirEditorBtn');
      if(abrirBtn) abrirBtn.addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        openLigaManagerCrestEditor(setupData.nombre, setupData.escudo, function(crest){
          setupData.escudo=crest;
          renderSetup();
        });
      });
      const confirmBtn=document.getElementById('lmSetupConfirm');
      if(confirmBtn) confirmBtn.addEventListener('click', ()=>{
        if(!setupData.escudo) return;
        if(typeof window.playSound==='function') window.playSound('select');
        guardarIdentidad(setupData.nombre.trim(), setupData.escudo);
        empezarTemporada(setupData.nombre.trim(), setupData.moneda, setupData.liga, setupData.escudo);
        render();
      });
    }
  }

  /* ---------- 12. Render: hub principal (una vez empezada la temporada) ---------- */
  function render(){
    const root=document.getElementById('ligaManagerScreen');
    if(!root) return;

    if(!state || !state.setupComplete){
      renderSetup();
      return;
    }
    // Red de seguridad: si el estado guardado viene de una versión anterior
    // y le faltan campos nuevos, se rellenan con valores por defecto en vez
    // de dejar que el render entero se rompa (pantalla en negro).
    if(!state.formacionCategoria || !FORMATION_CODES[state.formacionCategoria]) state.formacionCategoria='equilibrada';
    if(!state.formacionCode) state.formacionCode='4-3-3';
    if(!state.alineacion) state.alineacion={};
    if(!state.medicoCartas || !state.medicoCartas.length) state.medicoCartas=inicializarCartasMedico();
    if(!state.medicoBonos) state.medicoBonos={};
    if(!state.medicoCartasAgotadas) state.medicoCartasAgotadas=[];
    if(!state.medicoHistorial) state.medicoHistorial=[];
    if(!state.medicoNiveles) state.medicoNiveles={curacionMuscular:0, curacionOsea:0, prevencionMuscular:0, prevencionOsea:0};
    if(!state.estadio) state.estadio={campo:90, satisfaccion:10, aforoTotal:12000, ultimaAsistencia:null};
    if(state.estadio.aforoTotal===undefined) state.estadio.aforoTotal=12000;
    if(state.estadio.ultimaAsistencia===undefined) state.estadio.ultimaAsistencia=null;
    if(state.moral===undefined) state.moral=0;
    if(state.rachaResultados===undefined) state.rachaResultados=0;
    if(state.capital===undefined) state.capital=400000;
    if(state.precioEntrada===undefined) state.precioEntrada=15;
    if(state.mesesPagados===undefined) state.mesesPagados=0;
    if(!state.finanzasHistorial) state.finanzasHistorial=[];
    if(!state.directorGeneralCartas || !state.directorGeneralCartas.length) state.directorGeneralCartas=inicializarCartasDG();
    if(!state.directorGeneralCartasAgotadas) state.directorGeneralCartasAgotadas=[];
    if(!state.directorGeneralHistorial) state.directorGeneralHistorial=[];
    if(!state.directorGeneralNiveles) state.directorGeneralNiveles={aforoExtra:0, ingresoPatrocinio:0, ingresoMerchandising:0, toleranciaPrecio:0};
    if(!state.directorGeneralBonos) state.directorGeneralBonos={};
    if(!state.directorDeportivoCartas || !state.directorDeportivoCartas.length) state.directorDeportivoCartas=inicializarCartasDD();
    if(!state.directorDeportivoCartasAgotadas) state.directorDeportivoCartasAgotadas=[];
    if(!state.directorDeportivoHistorial) state.directorDeportivoHistorial=[];
    if(!state.directorDeportivoNiveles) state.directorDeportivoNiveles={calidadOjeo:0, ahorroSalarial:0, sobresFichajes:0, costeSobres:0};
    if(!state.directorDeportivoBonos) state.directorDeportivoBonos={};
    if(!state.trabajadores){
      state.trabajadores={
        medico:{id:'t0', ...nombreTrabajadorAleatorio(), nivel:1, sueldo:4400},
        mantenimiento:{id:'t1', ...nombreTrabajadorAleatorio(), nivel:1, sueldo:4400},
        directorGeneral:{id:'t2', ...nombreTrabajadorAleatorio(), nivel:1, sueldo:5500},
        directorDeportivo:{id:'t3', ...nombreTrabajadorAleatorio(), nivel:1, sueldo:5500}
      };
    }
    // Partidas guardadas de antes de tener género: se les asigna uno al
    // azar la primera vez que se cargan, para no romper el render.
    Object.keys(state.trabajadores||{}).forEach(rol=>{
      const t=state.trabajadores[rol];
      if(t && !t.genero) t.genero = Math.random()<0.5 ? 'hombre' : 'mujer';
    });
    if(!state.candidatosTrabajo || !state.candidatosTrabajo.length) regenerarCandidatosTrabajo();
    if(state.mesTrabajadoresGenerado===undefined) state.mesTrabajadoresGenerado=Math.floor((state.jornadaActual-1)/4)+1;
    if(!state.mantenimientoCartas || !state.mantenimientoCartas.length) state.mantenimientoCartas=inicializarCartasMantenimiento();
    if(!state.mantenimientoCartasAgotadas) state.mantenimientoCartasAgotadas=[];
    if(!state.mantenimientoHistorial) state.mantenimientoHistorial=[];
    if(!state.mantenimientoNiveles) state.mantenimientoNiveles={prevencionDesgaste:0, recuperacionCesped:0, boostSatisfaccion:0, proteccionSatisfaccion:0};
    if(!state.mantenimientoBonos) state.mantenimientoBonos={};
    if(state.dadoRerollsDisponibles===undefined) state.dadoRerollsDisponibles=1;

    const clasif=calcularClasificacion();
    const j=state.jornadaActual-1;
    const proximaJornada= j<38 ? state.calendario[j] : null;
    const miPartido= proximaJornada ? proximaJornada.find(p=>p.home.id==='lm_0'||p.away.id==='lm_0') : null;
    const rival= miPartido ? (miPartido.home.id==='lm_0' ? miPartido.away : miPartido.home) : null;
    const esLocal= miPartido ? miPartido.home.id==='lm_0' : null;
    const clima= rival ? climaDelPartido() : null;
    const notif=state.medicoNotificacion;
    const notifMant = !!(state.estadio && (state.estadio.satisfaccion<=-50 || state.estadio.campo<=20));
    const notifDG = (state.capital||0)<0;
    const notifDD = nivelDeDD('sobresFichajes')>=1;
    const hayVacantes = ROLES_TRABAJO.some(r=>!state.trabajadores[r]);
    const monedaInfo=MONEDAS[state.moneda]||MONEDAS.EUR;

    function fatigueColor(f){ if(f>=75) return 'green'; if(f>=40) return 'yellow'; return 'red'; }
    function fatigueBarHTML(p){
      const f=(p.fatigue===undefined)?100:p.fatigue;
      return `<div class="fatigue-bar-wrap" title="Resistencia: ${f}%"><div class="fatigue-bar fatigue-${fatigueColor(f)}" style="width:${f}%"></div></div>`;
    }
    function filaJugador(p){
      const cross=p.injured?` <span class="cross" title="Lesionado">✚</span>`:'';
      const racha=p.racha>=2?` <span title="Racha de gol">🔥${p.racha}</span>`:'';
      const star=titularIds.has(p.id)?'<span class="star" title="Titular">★</span>':'';
      const claseFila=[p.id===seleccionJugador?'lm-row-selected':'', p.injured?'lm-row-injured':''].filter(Boolean).join(' ');
      // Posición JUGADA (la del slot del campo si está alineado) frente a
      // su posición natural — mismo tratamiento que Copa Leyendas en
      // CONVOCADOS: si difieren, la jugada se marca en rojo y la natural
      // aparece debajo en gris pequeño.
      const slotAsignado=slotDeJugador(p.id);
      const posJugada=slotAsignado?basePos(slotAsignado):p.position;
      const fueraDePos=slotAsignado && posJugada!==p.position;
      const posCell=`<span style="font-weight:700${fueraDePos?';color:#e24b4a':''}">${posJugada}</span>${star}${fueraDePos?`<br><span style="font-size:9px;color:#888">${p.position}</span>`:''}`;
      return `<tr data-pid="${p.id}" class="${claseFila}">
        <td>${p.name}${cross}${racha}</td>
        <td>${fatigueBarHTML(p)}</td>
        <td>${posCell}</td>
        <td>${p.attack}</td><td>${p.defense}</td><td>${p.pace}</td><td>${p.passing}</td><td>${p.technique}</td>
        <td><strong>${efectivoOverall(p)}</strong></td>
      </tr>`;
    }
    const titularIds=new Set(Object.values(state.alineacion||{}).filter(Boolean));
    const statsEquipo=calcularStatsEquipoLM();
    // PLANTILLA = quienes están AHORA MISMO en el campo, BANQUILLO = el
    // resto — igual que CONVOCADOS/BANQUILLO en Copa Leyendas, donde un
    // cambio mueve de verdad al jugador de una lista a la otra. Antes se
    // usaba la etiqueta fija "esSuplente" de la generación inicial, que
    // no se actualizaba al hacer cambios y dejaba las tablas
    // desincronizadas del campo real.
    const posOrderLM=['POR','DFC','LI','LD','MC','EI','ED','DC'];
    function posicionEfectiva(p){
      const slot=slotDeJugador(p.id);
      return slot?basePos(slot):p.position;
    }
    function ordenarPlantilla(lista){
      if(lmSortMode==='position'){
        return [...lista].sort((a,b)=>{
          const ai=posOrderLM.indexOf(posicionEfectiva(a)), bi=posOrderLM.indexOf(posicionEfectiva(b));
          return (ai===-1?99:ai)-(bi===-1?99:bi);
        });
      }
      if(lmSortMode==='rating') return [...lista].sort((a,b)=>efectivoOverall(b)-efectivoOverall(a));
      return lista; // 'arrival' = orden de llegada = orden del array tal cual
    }
    const plantillaPrincipal=ordenarPlantilla(state.plantilla.filter(p=>titularIds.has(p.id)));
    const banquillo=state.plantilla.filter(p=>!titularIds.has(p.id));
    const filasPlantilla=plantillaPrincipal.map(filaJugador).join('');
    const filasBanquillo=banquillo.map(filaJugador).join('');

    root.innerHTML = `
      <div class="lm-app-grid">
        <div class="lm-panel lm-left-panel">
          <div class="lm-header-team">
            ${crestHTML(state.escudo, 76)}
            <div>
              <div class="lm-title">${state.nombreEquipo.toUpperCase()}</div>
              <div class="lm-sub">Jornada ${Math.min(state.jornadaActual,38)} de 38 · ${monedaInfo.symbol}</div>
            </div>
          </div>
          <div class="bench-title">
            <span>ONCE TITULAR</span>
            <span style="display:flex;align-items:center;gap:8px">
              <button id="lmSortBtn" class="lm-sort-btn" title="Cambiar orden" aria-label="Cambiar orden">
                <span id="lmSortLabel">${LM_SORT_LABELS[lmSortMode]}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M7 12h10M11 18h2"/></svg>
              </button>
              <span>${plantillaPrincipal.length}</span>
            </span>
          </div>
          <div style="overflow-x:auto">
            <table class="roster-table">
              <thead><tr><th>Jugador</th><th>Resist.</th><th>Pos</th><th>ATA</th><th>DEF</th><th>RIT</th><th>PAS</th><th>TEC</th><th>Rat.</th></tr></thead>
              <tbody>${filasPlantilla}</tbody>
            </table>
          </div>
          <div class="bench-title"><span>BANQUILLO</span><span>${banquillo.length}</span></div>
          <div style="overflow-x:auto">
            <table class="roster-table">
              <thead><tr><th>Jugador</th><th>Resist.</th><th>Pos</th><th>ATA</th><th>DEF</th><th>RIT</th><th>PAS</th><th>TEC</th><th>Rat.</th></tr></thead>
              <tbody>${filasBanquillo}</tbody>
            </table>
          </div>

          <div class="team-profile box" style="margin-top:14px">
            <h3>PERFIL DEL EQUIPO</h3>
            <div class="ovr-team"><span class="team-stat-title">NOTA MEDIA</span><span>${statsEquipo.overall}</span></div>
            ${[['attack','ATAQUE'],['defense','DEFENSA'],['pace','RITMO'],['passing','PASE'],['technique','TÉCNICA']].map(([k,label])=>`
              <div class="stat-row"><span>${label}</span><span>${statsEquipo[k]}</span></div>
              <div class="stat-bar-row"><div class="stat-bar"><div style="width:${Math.max(0,Math.min(100,statsEquipo[k]))}%"></div></div></div>
            `).join('')}
            <p class="lm-setup-desc" style="text-align:left;margin-top:6px">Media de los ${state.plantilla.length} jugadores de la plantilla.</p>
          </div>
        </div>

        <div class="lm-center-panel">
          <div id="lmPitchBox">${PITCH_SVG}<div id="lmCampoLayer" style="opacity:${campoOpacidadDesgaste(state.estadio?state.estadio.campo:100)}"></div><div id="lmWeatherLayer"></div>${formacionActual().slots.map(def=>{
            const pid=state.alineacion&&state.alineacion[def.slot];
            const jugador=pid?state.plantilla.find(p=>p.id===pid):null;
            const vacio=!jugador;
            const lesionado=jugador&&jugador.injured;
            const seleccionado=jugador && jugador.id===seleccionJugador;
            const label=basePos(def.slot);
            // Calco exacto de renderSlotContent() de Copa Leyendas: círculo
            // con el rating dentro, nombre + estrella + etiqueta de posición
            // DEBAJO del círculo (.player-info), reutilizando las mismas
            // clases globales (.position/.locked/.player-info/.pos-rating/
            // .player-pos-label/.star) en vez de un sistema aparte.
            let inner;
            if(vacio){
              inner=`<span class="pos-label-inside">${label}</span>`;
            }else{
              const inPos=jugador.position===label;
              const star=inPos?' <span class="star">★</span>':'';
              const statusIcons=lesionado?'<div class="pitch-status-row"><span class="pitch-status-icon pitch-status-injury" title="Lesionado">✚</span></div>':'';
              inner=`${statusIcons}<span class="pos-rating">${efectivoOverall(jugador)}</span><div class="player-info">${jugador.name}${star}<div class="player-pos-label${inPos?'':' out-of-position'}">${label}</div></div>`;
            }
            const clases=['position', vacio?'empty-slot':'locked', lesionado?'lm-pos-injured':'', seleccionado?'highlight-pos':''].filter(Boolean).join(' ');
            return `<div class="${clases}" data-slot="${def.slot}" style="left:${def.x}%;top:${def.y}%" title="${jugador?jugador.name+' ('+efectivoOverall(jugador)+')':'Vacío'}">${inner}</div>`;
          }).join('')}</div>

          <div class="bench-title" style="margin-top:14px"><span>FORMACIÓN</span><span>${state.formacionCode}</span></div>
          <div class="formation-tabs">
            ${Object.keys(FORMATION_CODES).map(cat=>`<div class="formation-tab ${(formacionCategoriaVista||state.formacionCategoria)===cat?'active':''}" data-categoria="${cat}">${CAT_LABELS[cat]}</div>`).join('')}
          </div>
          <div id="formationList">
            ${FORMATION_CODES[formacionCategoriaVista||state.formacionCategoria].map(code=>`
              <div class="formation-option ${state.formacionCode===code?'selected':''}" data-formacion-codigo="${code}">
                <span class="f-code">${code}</span>
                <span class="f-badge">${code.split('-').length} líneas</span>
              </div>`).join('')}
          </div>
        </div>

        <div class="lm-panel lm-right-panel">
          <div class="lm-nextmatch-box">
            ${rival ? `
              <div class="lm-vs-label" style="text-align:center;margin-bottom:6px">${esLocal?'JUEGAS EN CASA':'JUEGAS FUERA'}</div>
              <div class="lm-rival-crest-block">
                ${rivalCrestHTML(72, rival.crestImg)}<span class="lm-title" style="font-size:15px">${rival.name}</span>
              </div>
              ${(()=>{
                const fila=calcularClasificacion();
                const idx=fila.findIndex(t=>t.id===rival.id);
                const datos=fila[idx]||{pj:0,pts:0,gf:0,gc:0};
                const dg=datos.gf-datos.gc;
                return `<div class="lm-rival-stats-row">
                  <span><i class="ph ph-bold ph-ranking"></i> ${idx+1}º</span>
                  <span><i class="ph ph-bold ph-trophy"></i> ${datos.pts} pts</span>
                  <span><i class="ph ph-bold ph-soccer-ball"></i> ${dg>=0?'+':''}${dg}</span>
                </div>`;
              })()}
              ${(()=>{
                const campoRival=campoRivalEstimado(rival);
                return `<div style="margin-top:6px">
                  <div class="lm-estadio-bar-label" style="font-size:10px"><i class="ph ph-bold ph-plant" style="font-size:12px"></i><span>ESTADO DE SU CAMPO${esLocal?'':' (hoy juegas aquí)'}</span><span>${campoRival}/100</span></div>
                  ${campoBarraHTML(campoRival, true)}
                </div>`;
              })()}
              ${weatherDisplayHTML(clima)}
              <div class="lm-rival-profile">
                ${[['ATAQUE','attack'],['DEFENSA','defense'],['RITMO','pace'],['PASE','passing'],['TÉCNICA','technique']].map(([label,k])=>`
                  <div class="stat-row"><span>${label}</span><span>${rival[k]}</span></div>
                  <div class="stat-bar-row"><div class="stat-bar"><div style="width:${Math.max(0,Math.min(100,rival[k]))}%"></div></div></div>
                `).join('')}
              </div>` : `<div class="lm-vs-label" style="text-align:center">Temporada finalizada</div>`}
          </div>
          <h3 class="lm-clasif-header" id="lmClasifHeader"><span style="color:var(--gold)">CLASIFICACIÓN</span> <span class="lm-clasif-arrow ${clasifColapsada?'':'lm-clasif-arrow-open'}">▾</span></h3>
          <div id="lmClasifBody" style="${clasifColapsada?'display:none':''}">
          <div class="lm-table-wrap">
            <table class="lm-table">
              <thead><tr><th></th><th>#</th><th>Equipo</th><th>PJ</th><th>Pts</th></tr></thead>
              <tbody>
                ${clasif.map((t,i)=>`<tr class="${t.id==='lm_0'?'lm-myteam':''} lm-zona-${zonaClasificacion(i+1)}">
                  <td>${t.id==='lm_0'?crestHTML(state.escudo,18):rivalCrestHTML(18, t.crestImg)}</td>
                  <td>${i+1}</td><td>${t.name}</td><td>${t.pj}</td><td><strong>${t.pts}</strong></td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
          <div class="lm-legend">
            <span><i class="lm-legend-dot lm-zona-champions"></i>Champions</span>
            <span><i class="lm-legend-dot lm-zona-europa"></i>Europa Lg.</span>
            <span><i class="lm-legend-dot lm-zona-conference"></i>Conference</span>
            <span><i class="lm-legend-dot lm-zona-descenso"></i>Descenso</span>
          </div>
          </div>
        </div>

        <div class="lm-panel lm-staff-panel">
          <div class="lm-staff-bar-header">
            <div class="lm-staff-bar-title"><i class="ph ph-bold ph-users-three"></i> CUERPO TÉCNICO</div>
            <div class="lm-staff-bar-capital"><i class="ph ph-bold ph-coins"></i> ${formatoDinero(state.capital)}</div>
          </div>
          ${hayVacantes?`<div class="lm-staff-warning"><i class="ph ph-bold ph-warning"></i> Todavía te falta cuerpo técnico por contratar antes de poder jugar tu próxima jornada.</div>`:''}
          <button id="lmTrabajadoresBtn" class="lm-btn-trabajadores" style="width:100%;margin-bottom:10px">CONTRATAR/DESPEDIR TRABAJADORES</button>
          <div class="lm-staff-bar-row">
            ${staffTileHTML('directorGeneral', {btnId:'lmDirectorGeneralBtn', infoId:'lmDirectorGeneralInfoBtn', infoTitle:'Finanzas del club', notif:notifDG, badgeTexto:'!', carpeta:'director_general', archivo:'director_general', alt:'Director General', icono:'ph-briefcase', rolLabel:'DIRECTOR GENERAL', acento:'lm-staff-tile-dg', desc:'Patrocinios, merchandising, aforo y precio de las entradas'})}
            ${staffTileHTML('directorDeportivo', {btnId:'lmDirectorDeportivoBtn', infoId:'lmDirectorDeportivoInfoBtn', infoTitle:'Salarios de la plantilla', notif:notifDD, badgeTexto:'!', carpeta:'director_deportivo', archivo:'director_deportivo', alt:'Director Deportivo', icono:'ph-binoculars', rolLabel:'DIRECTOR DEPORTIVO', acento:'lm-staff-tile-dd', desc:'Fichajes, ojeadores y sobres de nuevos jugadores'})}
            ${staffTileHTML('medico', {btnId:'lmMedicoBtn', infoId:'lmMedicoInfoBtn', infoTitle:'Historial médico', notif:notif, badgeTexto:'1', carpeta:'medico', archivo:'medico', alt:'Equipo médico', icono:'ph-first-aid-kit', rolLabel:'EQUIPO MÉDICO', desc:'Previene, diagnostica y trata las lesiones de tus jugadores', acento:'lm-staff-tile-medico'})}
            ${staffTileHTML('mantenimiento', {btnId:'lmMantenimientoBtn', infoId:'lmMantenimientoInfoBtn', infoTitle:'Estado del estadio', notif:notifMant, badgeTexto:'!', carpeta:'mantenimiento_y_seguridad', archivo:'mantenimiento_y_seguridad', alt:'Mantenimiento y seguridad', icono:'ph-flag-pennant', rolLabel:'MANTENIMIENTO', desc:'Cuida el césped, la seguridad y la satisfacción de la afición', acento:'lm-staff-tile-mant'})}
          </div>
          <div class="lm-match-actions" style="margin-top:auto">
            <button id="lmJugarBtn" class="lm-btn-jugar" ${(state.jornadaActual>38||hayVacantes)?'disabled':''}>
              ${state.jornadaActual>38?'TEMPORADA COMPLETA':(hayVacantes?'CONTRATA AL CUERPO TÉCNICO':'JUGAR JORNADA')}
            </button>
            <button id="lmAbandonarBtn" class="lm-btn-abandonar">ABANDONAR LIGA</button>
            <button id="ligaManagerBackBtn" class="lm-btn-volver">VOLVER AL MENÚ</button>
          </div>
        </div>
      </div>
    `;

    if(clima) aplicarClimaVisualLM(clima.id);

    const medicoInfoBtn=document.getElementById('lmMedicoInfoBtn');
    if(medicoInfoBtn) medicoInfoBtn.addEventListener('click', (e)=>{
      e.stopPropagation();
      if(typeof window.playSound==='function') window.playSound('select');
      abrirHistorialMedico();
    });

    root.querySelectorAll('[data-categoria]').forEach(el=>{
      el.addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        formacionCategoriaVista=el.getAttribute('data-categoria');
        render();
      });
    });
    root.querySelectorAll('[data-formacion-codigo]').forEach(el=>{
      el.addEventListener('click', ()=>{
        const code=el.getAttribute('data-formacion-codigo');
        if(code===state.formacionCode) return;
        if(typeof window.playSound==='function') window.playSound('select');
        state.formacionCode=code;
        state.formacionCategoria=formacionCategoriaVista||state.formacionCategoria;
        state.alineacion=alineacionAutomatica(state.plantilla, generarSlotsFormacion(code));
        guardarEstado();
        render();
      });
    });

    const jugarBtn=document.getElementById('lmJugarBtn');
    if(jugarBtn) jugarBtn.addEventListener('click', ()=>{
      if(ROLES_TRABAJO.some(r=>!state.trabajadores[r])){
        if(typeof window.playSound==='function') window.playSound('select');
        alert('Todavía tienes puestos vacantes en el cuerpo técnico. Contrata desde TRABAJADORES antes de jugar la jornada.');
        return;
      }
      if(typeof window.playSound==='function') window.playSound('select');
      const info=jugarJornada();
      if(info){
        mostrarPartidoEnVivo(info, render);
      } else {
        render();
      }
    });
    const backBtn=document.getElementById('ligaManagerBackBtn');
    if(backBtn) backBtn.addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      document.body.classList.remove('liga-manager-screen');
      document.body.classList.add('menu-screen');
    });
    const abandonarBtn=document.getElementById('lmAbandonarBtn');
    if(abandonarBtn) abandonarBtn.addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      abandonarLiga();
    });
    const trabajadoresBtn=document.getElementById('lmTrabajadoresBtn');
    if(trabajadoresBtn) trabajadoresBtn.addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      abrirTrabajadores();
    });
    const clasifHeader=document.getElementById('lmClasifHeader');
    if(clasifHeader) clasifHeader.addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      clasifColapsada=!clasifColapsada;
      render();
    });
    const sortBtn=document.getElementById('lmSortBtn');
    if(sortBtn) sortBtn.addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      lmSortMode=LM_SORT_NEXT[lmSortMode];
      render();
    });
    const medicoBtn=document.getElementById('lmMedicoBtn');
    if(medicoBtn) medicoBtn.addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      abrirMedico();
    });
    const mantenimientoBtn=document.getElementById('lmMantenimientoBtn');
    if(mantenimientoBtn) mantenimientoBtn.addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      abrirMantenimiento();
    });
    const mantenimientoInfoBtn=document.getElementById('lmMantenimientoInfoBtn');
    if(mantenimientoInfoBtn) mantenimientoInfoBtn.addEventListener('click', (e)=>{
      e.stopPropagation();
      if(typeof window.playSound==='function') window.playSound('select');
      abrirEstadoEstadio();
    });
    const dgBtn=document.getElementById('lmDirectorGeneralBtn');
    if(dgBtn) dgBtn.addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      abrirDirectorGeneral();
    });
    const dgInfoBtn=document.getElementById('lmDirectorGeneralInfoBtn');
    if(dgInfoBtn) dgInfoBtn.addEventListener('click', (e)=>{
      e.stopPropagation();
      if(typeof window.playSound==='function') window.playSound('select');
      abrirFinanzasDG();
    });
    const ddBtn=document.getElementById('lmDirectorDeportivoBtn');
    if(ddBtn) ddBtn.addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      abrirDirectorDeportivo();
    });
    const ddInfoBtn=document.getElementById('lmDirectorDeportivoInfoBtn');
    if(ddInfoBtn) ddInfoBtn.addEventListener('click', (e)=>{
      e.stopPropagation();
      if(typeof window.playSound==='function') window.playSound('select');
      abrirSalariosDD();
    });
    root.querySelectorAll('#lmPitchBox .position').forEach(el=>{
      el.addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        manejarClicSlot(el.getAttribute('data-slot'));
      });
    });
    root.querySelectorAll('.roster-table tr[data-pid]').forEach(el=>{
      el.addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        manejarClicJugador(el.getAttribute('data-pid'));
      });
    });
  }

  /* ---------- 12a. Selección unificada campo ↔ plantilla/banquillo,
     igual que Copa Leyendas: un clic selecciona, el siguiente clic (en
     otro jugador o en una posición) coloca/intercambia. Un jugador
     lesionado no se puede seleccionar para jugar. ---------- */
  function slotDeJugador(playerId){
    return Object.keys(state.alineacion||{}).find(s=>state.alineacion[s]===playerId) || null;
  }

  function manejarClicJugador(playerId){
    const jugador=state.plantilla.find(p=>p.id===playerId);
    if(jugador && jugador.injured && !seleccionJugador) return; // no se puede seleccionar a un lesionado para jugar
    if(seleccionJugador===playerId){ seleccionJugador=null; render(); return; }
    if(seleccionJugador){
      // Si NINGUNO de los dos ocupa una posición en el campo no hay nada
      // que intercambiar sobre el campo (igual que en Copa Leyendas, dos
      // suplentes seguidos no producen swap) — mover la selección al
      // nuevo jugador en vez de deseleccionar sin más, que es lo que
      // pasaba antes y parecía que el intercambio "no hacía nada".
      const slotA=slotDeJugador(seleccionJugador), slotB=slotDeJugador(playerId);
      if(!slotA && !slotB){
        seleccionJugador=playerId;
        render();
        return;
      }
      intercambiarJugadores(seleccionJugador, playerId);
      seleccionJugador=null;
      render();
      return;
    }
    seleccionJugador=playerId;
    render();
  }

  function manejarClicSlot(slot){
    const ocupanteId=state.alineacion[slot];
    if(seleccionJugador){
      asignarJugadorASlot(seleccionJugador, slot);
      seleccionJugador=null;
      render();
      return;
    }
    if(ocupanteId){
      seleccionJugador=ocupanteId;
      render();
      return;
    }
    // Slot vacío sin selección previa: no hace nada — el jugador primero
    // selecciona a alguien de la plantilla/banquillo y luego toca aquí.
  }

  function asignarJugadorASlot(playerId, slot){
    const slotAnterior=slotDeJugador(playerId);
    const ocupanteActual=state.alineacion[slot];
    if(slotAnterior===slot) return;
    if(slotAnterior){
      if(ocupanteActual) state.alineacion[slotAnterior]=ocupanteActual;
      else delete state.alineacion[slotAnterior];
    }
    state.alineacion[slot]=playerId;
    guardarEstado();
  }

  function intercambiarJugadores(idA, idB){
    const slotA=slotDeJugador(idA), slotB=slotDeJugador(idB);
    if(slotA && slotB){ state.alineacion[slotA]=idB; state.alineacion[slotB]=idA; }
    else if(slotA && !slotB){ state.alineacion[slotA]=idB; }
    else if(!slotA && slotB){ state.alineacion[slotB]=idA; }
    guardarEstado();
  }

  /* ---------- 9c. Historial médico — modal con el listado de lesiones
     tratadas (jornada, rival, tipo, cómo se resolvió) y el progreso de
     las cartas de acumulación, más reciente primero. ---------- */
  let histTab='tratamientos';
  function abrirHistorialMedico(){
    const overlay=document.createElement('div');
    overlay.id='lmHistorialOverlay';
    const historial=(state.medicoHistorial||[]).slice().reverse(); // más reciente primero
    const tratamientos=historial.filter(h=>h.tipo!=='progreso');
    const totalEstrellas=NIVELES_EQUIPO_INFO.reduce((s,info)=>s+nivelDe(info.track),0);

    function pintar(){
      const filas = tratamientos.map(h=>{
        const estado = h.resuelta
          ? `Se recuperó gracias a <strong>${h.resueltoPor}</strong> — estuvo ${h.jornadasReales} jornada${h.jornadasReales===1?'':'s'} sin jugar`
          : `<span style="color:#e24b4a">Todavía de baja</span> (previsto ${h.semanasPrevistas} jornada${h.semanasPrevistas===1?'':'s'})`;
        return `<div class="lm-hist-item">
          <i class="ph ph-bold ph-first-aid-kit" style="color:${h.resuelta?'#5dcaa5':'#e24b4a'}"></i>
          <div>
            <div class="lm-hist-title">${h.jugador} — ${h.tipoLesion} <span class="lm-hist-tag">${h.severidad}</span> ${h.familia?`<span class="lm-hist-tag lm-hist-tag-familia">${h.familia==='muscular'?'muscular':'ósea'}</span>`:''}</div>
            <div class="lm-hist-meta">Jornada ${h.jornadaInicio} contra ${h.rival}</div>
            <div class="lm-hist-desc">${estado}</div>
          </div>
        </div>`;
      }).join('');

      overlay.innerHTML=`
        <div class="lm-dilemma-card lm-dilemma-card-medico" style="max-width:480px;text-align:left">
          <div class="lm-dilemma-title" style="text-align:center"><i class="ph ph-bold ph-clock-counter-clockwise"></i> HISTORIAL MÉDICO</div>
          <div class="formation-tabs">
            <div class="formation-tab ${histTab==='tratamientos'?'active':''}" data-histtab="tratamientos">TRATAMIENTOS <span class="counter-badge">${tratamientos.length}</span></div>
            <div class="formation-tab ${histTab==='mejoras'?'active':''}" data-histtab="mejoras">INSTALACIONES <span class="counter-badge">${totalEstrellas}/${NIVELES_EQUIPO_INFO.length*NIVEL_MAXIMO_EQUIPO}</span></div>
          </div>
          <div class="lm-tab-content">
            ${histTab==='tratamientos' ? `
            <div class="lm-hist-list">
              ${tratamientos.length?filas:'<p class="lm-setup-desc" style="text-align:center">Todavía no hay nada que contar — de momento tu plantilla está sana.</p>'}
            </div>` : `
            <p class="lm-setup-desc" style="text-align:left;margin:8px 0 4px">Nivel actual de cada especialidad del cuerpo médico.</p>
            ${renderNivelesEquipoHTML()}
            `}
          </div>
          <div class="lm-popup-actions lm-popup-actions-compact">
            <button id="lmHistorialCerrar" class="mode-card-btn mode-card-btn-gold">CERRAR</button>
          </div>
        </div>`;
      overlay.querySelectorAll('[data-histtab]').forEach(el=>{
        el.addEventListener('click', ()=>{
          if(typeof window.playSound==='function') window.playSound('select');
          histTab=el.getAttribute('data-histtab');
          pintar();
        });
      });
      document.getElementById('lmHistorialCerrar').addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        overlay.remove();
      });
    }
    document.getElementById('ligaManagerScreen').appendChild(overlay);
    pintar();
  }

  // Caras de dado con PIPS (puntos), no números — blancas y con esquinas
  // redondeadas, tamaño grande para que se lea de un vistazo.
  const LM_DICE_PIPS={
    1:[[50,50]],
    2:[[27,27],[73,73]],
    3:[[27,27],[50,50],[73,73]],
    4:[[27,27],[73,27],[27,73],[73,73]],
    5:[[27,27],[73,27],[50,50],[27,73],[73,73]],
    6:[[27,25],[73,25],[27,50],[73,50],[27,75],[73,75]]
  };
  function dadoPipsHTML(valor){
    const pips=LM_DICE_PIPS[valor]||LM_DICE_PIPS[1];
    return `<svg viewBox="0 0 100 100" class="lm-dice-pips-svg">${pips.map(([x,y])=>`<circle cx="${x}" cy="${y}" r="9"></circle>`).join('')}</svg>`;
  }

  // Barajado de las caras del dado — CALCO del slot-machine de selección
  // de equipos del draft de Copa Leyendas (mismos sonidos spin/reveal),
  // ahora mostrando pips en vez de números, en el mismo estilo/tamaño
  // que se usará luego para el resultado (sin caja punteada aparte).
  function iniciarBarajadoDados(container, numDados, onDone){
    const tiradasFinal=[]; for(let i=0;i<numDados;i++) tiradasFinal.push(1+Math.floor(Math.random()*6));
    container.innerHTML = Array.from({length:numDados}).map((_,i)=>
      `<div class="lm-dice-face lm-dice-face-shuffling" id="lmDiceFace${i}">${dadoPipsHTML(1+Math.floor(Math.random()*6))}</div>`
    ).join('');
    let ticks=0;
    const totalTicks=11+Math.floor(Math.random()*4); // ~950-1275ms de barajado
    const spin=setInterval(()=>{
      for(let i=0;i<numDados;i++){
        const faceEl=document.getElementById('lmDiceFace'+i);
        if(faceEl) faceEl.innerHTML=dadoPipsHTML(1+Math.floor(Math.random()*6));
      }
      if(typeof window.playSound==='function') window.playSound('spin');
      ticks++;
      if(ticks>=totalTicks){
        clearInterval(spin);
        for(let i=0;i<numDados;i++){
          const faceEl=document.getElementById('lmDiceFace'+i);
          if(faceEl){ faceEl.innerHTML=dadoPipsHTML(tiradasFinal[i]); faceEl.classList.remove('lm-dice-face-shuffling'); }
        }
        if(typeof window.playSound==='function') window.playSound('reveal');
        onDone(tiradasFinal);
      }
    },85);
  }

  // Anima UN dado concreto (reroll) con el mismo barajado, hasta fijarse
  // en un valor nuevo al azar.
  function animarRerollUnDado(faceEl, onNuevoValor){
    let ticks=0;
    const totalTicks=7+Math.floor(Math.random()*3);
    faceEl.classList.add('lm-dice-face-shuffling');
    const spin=setInterval(()=>{
      faceEl.innerHTML=dadoPipsHTML(1+Math.floor(Math.random()*6));
      if(typeof window.playSound==='function') window.playSound('spin');
      ticks++;
      if(ticks>=totalTicks){
        clearInterval(spin);
        const nuevoValor=1+Math.floor(Math.random()*6);
        faceEl.innerHTML=dadoPipsHTML(nuevoValor);
        faceEl.classList.remove('lm-dice-face-shuffling');
        if(typeof window.playSound==='function') window.playSound('reveal');
        onNuevoValor(nuevoValor);
      }
    },85);
  }

  // Texto de resultado a partir de lo que devuelven resolverCartaMedico/
  // Mantenimiento/DG/DD/resolverDilemaMedico — formas ligeramente
  // distintas, unificadas aquí en un único formateador.
  function formatearResultadoDados(r){
    if(!r) return '';
    if(r.tipo==='directa'){
      return `Suma <strong>${r.suma}</strong> (necesitabas ${r.dificultad}+) — <span style="color:${r.exito?'#5dcaa5':'#e24b4a'}">${r.exito?'✔ ÉXITO — '+r.texto:'✘ FALLO — '+r.texto}</span>`;
    }
    if(r.tipo==='nivel'){
      return r.exito
        ? `Suma <strong>${r.suma}</strong> (necesitabas ${r.dificultad}+) — <span style="color:#5dcaa5">✔ ÉXITO</span> — ${r.nombre} sube a nivel ${r.nivelNuevo}/${NIVEL_MAXIMO_EQUIPO}${r.maxAlcanzado?' — <strong>nivel máximo alcanzado</strong>':''}`
        : `Suma <strong>${r.suma}</strong> (necesitabas ${r.dificultad}+) — <span style="color:#e24b4a">✘ FALLO</span> — ${r.texto}`;
    }
    // Forma de resolverDilemaMedico (dado urgente): {suma,dificultad,exito}
    return `Suma <strong>${r.suma}</strong> (necesitabas ${r.dificultad}+) — <span style="color:${r.exito?'#5dcaa5':'#e24b4a'}">${r.exito?'✔ ÉXITO, recuperación acelerada':'✘ FALLO, sigue el tiempo previsto'}</span>`;
  }

  // Pantalla ÚNICA de resultado de una tirada — sustituye a la antigua
  // pareja "revisa tu tirada" + "resultado" (dos pantallas, dos clics
  // para lo mismo): los dados grandes con pips y la SUMA en grande se ven
  // desde el primer momento; si queda reroll disponible, cada dado es
  // tocable (con su propio barajado) para repetirlo; un único botón
  // aplica el efecto Y enseña el resultado a la vez, y solo hace falta
  // un segundo toque para cerrar y volver al hub.
  function mostrarResultadoDados(zonaEl, tiradas, resolverFn, onCerrar){
    let resultado=null;
    function pintar(){
      const suma=tiradas.reduce((a,b)=>a+b,0);
      const puedeReroll = !resultado && (state.dadoRerollsDisponibles||0)>0;
      zonaEl.innerHTML=`
        <div class="lm-dice-result-row">${tiradas.map((v,i)=>`<div class="lm-dice-face${puedeReroll?' lm-dice-face-reroll':''}" data-reroll-i="${i}" id="lmDiceResultFace${i}" ${puedeReroll?'title="Repetir este dado"':''}>${dadoPipsHTML(v)}</div>`).join('')}</div>
        <div class="lm-dice-suma-grande">${suma}</div>
        ${puedeReroll?`<div class="lm-setup-desc">toca un dado para repetirlo · rerolls hoy: <strong>${state.dadoRerollsDisponibles}/1</strong></div>`:''}
        ${resultado?`<div class="lm-dice-resultado-texto">${formatearResultadoDados(resultado)}</div>`:''}
        <div class="lm-popup-actions"><button id="lmDiceAccionBtn" class="mode-card-btn mode-card-btn-gold">${resultado?'CERRAR':'CONTINUAR'}</button></div>`;
      if(puedeReroll){
        zonaEl.querySelectorAll('[data-reroll-i]').forEach(el=>{
          el.addEventListener('click', ()=>{
            if(resultado || (state.dadoRerollsDisponibles||0)<=0) return;
            const i=parseInt(el.getAttribute('data-reroll-i'),10);
            animarRerollUnDado(el, (nuevoValor)=>{
              state.dadoRerollsDisponibles--;
              tiradas[i]=nuevoValor;
              guardarEstado();
              pintar();
            });
          });
        });
      }
      document.getElementById('lmDiceAccionBtn').addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        if(!resultado){
          resultado=resolverFn(tiradas);
          pintar();
        } else {
          onCerrar(resultado);
        }
      });
    }
    pintar();
  }

  // Animación de "rerroll" sobre la propia tarjeta al cambiarla — mismo
  // espíritu que el slot-machine de selección de equipos de Copa
  // Leyendas: icono y nombre van cambiando al azar un instante (mismos
  // sonidos spin/reveal) antes de fijarse en la carta nueva de verdad.
  function animarRerollCarta(overlay, idx, catalogo, onDone){
    const cardEl = overlay.querySelector(`.med-card[data-idx="${idx}"]`);
    if(!cardEl){ onDone(); return; }
    const iconEl = cardEl.querySelector('.med-card-icon');
    const titleEl = cardEl.querySelector('.med-card-title');
    const swapBtn = cardEl.querySelector('.med-card-swap');
    if(!iconEl || !titleEl){ onDone(); return; }
    if(swapBtn) swapBtn.disabled=true;
    cardEl.classList.add('med-card-spinning');
    let ticks=0;
    const totalTicks=9+Math.floor(Math.random()*3); // ~810-1080ms de barajado
    const spin=setInterval(()=>{
      const rnd=catalogo[Math.floor(Math.random()*catalogo.length)];
      iconEl.className=`ph ph-bold ${rnd.icon} med-card-icon`;
      titleEl.textContent=rnd.nombre;
      if(typeof window.playSound==='function') window.playSound('spin');
      ticks++;
      if(ticks>=totalTicks){
        clearInterval(spin);
        cardEl.classList.remove('med-card-spinning');
        if(typeof window.playSound==='function') window.playSound('reveal');
        onDone();
      }
    },90);
  }

  // Ficha horizontal de un puesto del cuerpo técnico, para la barra
  // superior "CUERPO TÉCNICO" — foto (con el género correcto o la
  // variante en blanco y negro si está vacante), rol, nombre de quien lo
  // ocupa y su nivel en estrellas, con badge de aviso y burbuja de info.
  function staffTileHTML(rol, o){
    const trab=state.trabajadores[rol];
    return `
    <div class="lm-staff-tile ${o.acento||''} ${trab?'':'lm-staff-tile-vacante'}" id="${o.btnId}">
      <div class="lm-staff-tile-photo">
        ${staffFotoHTML(o.carpeta, o.archivo, o.alt, o.icono, trab?trab.genero:'hombre', !trab)}
        ${o.notif?`<span class="lm-staff-tile-badge">${o.badgeTexto}</span>`:''}
        <button class="lm-staff-tile-info-btn" id="${o.infoId}" title="${o.infoTitle}"><i class="ph ph-bold ph-info"></i></button>
        <div class="lm-staff-tile-photo-fade"></div>
      </div>
      <div class="lm-staff-tile-body">
        <div class="lm-staff-tile-rol">${o.rolLabel}</div>
        <div class="lm-staff-tile-nombre">${trab?trab.nombre:'VACANTE'}</div>
        ${trab?`<div class="lm-staff-tile-estrellas">${estrellasNivel(trab.nivel)}</div>`:'<div class="lm-staff-tile-vacante-txt">Contratar en TRABAJADORES</div>'}
        <div class="lm-staff-tile-desc">${o.desc}</div>
      </div>
    </div>`;
  }

  function abrirMedico(){
    const overlay=document.createElement('div');
    overlay.id='lmMedicoOverlay';
    document.getElementById('ligaManagerScreen').appendChild(overlay);

    function jugadoresLesionadosPara(def){
      if(!def.requiereLesion) return [];
      return state.plantilla.filter(p=>p.injured && (def.requiereLesion==='grave' ? p.injurySeverity==='grave' : true));
    }

    function renderHub(){
      const notif=state.medicoNotificacion;
      const jugadorUrgente=notif?state.plantilla.find(p=>p.id===notif.jugadorId):null;

      const cartasHTML=state.medicoCartas.map((instancia,idx)=>{
        const def=cartaDef(instancia.cartaId);
        const candidatos=jugadoresLesionadosPara(def);
        const sinLesionNecesaria = def.requiereLesion && candidatos.length===0;
        const dificultadEfectiva = def.tipo==='nivel' ? dificultadActualNivel(def) : def.dificultad;
        const maxPosible = state.diceAvailable*6;
        const imposiblePorDados = (def.tipo==='directa'||def.tipo==='nivel') && maxPosible < dificultadEfectiva;
        const nivelMaximoYa = def.tipo==='nivel' && nivelDe(def.track)>=NIVEL_MAXIMO_EQUIPO;
        const bloqueada = sinLesionNecesaria || imposiblePorDados || nivelMaximoYa;
        const cambioDisponible=!state.medicoCambioUsado;
        let cuerpo;
        if(def.tipo==='nivel'){
          const n=nivelDe(def.track);
          cuerpo=`<div class="med-card-progress-label" style="text-align:center;letter-spacing:2px;color:var(--gold)">${estrellasNivel(n)}</div>
                  <div class="med-card-dificultad">Dificultad ${dificultadEfectiva}+ para subir a nivel ${n+1}/${NIVEL_MAXIMO_EQUIPO}</div>`;
        } else if(def.tipo==='acumulacion'){
          const umbral=def.niveles[instancia.nivelActual-1];
          cuerpo=`<div class="med-card-progress"><div class="med-card-progress-fill" style="width:${Math.min(100,100*instancia.progreso/umbral)}%"></div></div>
                  <div class="med-card-progress-label">Nivel ${instancia.nivelActual}/${def.niveles.length} — ${instancia.progreso}/${umbral}</div>`;
        } else {
          cuerpo=`<div class="med-card-dificultad">Dificultad ${def.dificultad}+</div>`;
        }
        return `
        <div class="med-card med-card-medico ${bloqueada?'med-card-bloqueada':''}" data-idx="${idx}">
          <button class="med-card-swap" data-swap="${idx}" title="Cambiar carta" ${cambioDisponible?'':'disabled'}><i class="ph ph-bold ph-arrows-clockwise"></i></button>
          <div class="med-card-tag">${def.tipo==='nivel'?'MEJORA':(def.tipo==='acumulacion'?'PROYECTO':'MISIÓN')}</div>
          <i class="ph ph-bold ${def.icon} med-card-icon"></i>
          <div class="med-card-title">${def.nombre}</div>
          <div class="med-card-divider"></div>
          <div class="med-card-desc">${def.desc}</div>
          ${cuerpo}
          ${bloqueada?`<div class="med-card-bloqueada-label">${sinLesionNecesaria?'Necesitas una lesión activa':(nivelMaximoYa?'Especialidad al máximo nivel':'Imposible con los dados que quedan')}</div>`:`<button class="mode-card-btn mode-card-btn-gold med-card-btn" data-usar="${idx}" style="padding:7px;font-size:11px">USAR</button>`}
        </div>`;
      }).join('');

      overlay.innerHTML=`
        <div class="lm-dilemma-card lm-dilemma-card-medico" style="max-width:640px">
          <div class="lm-dilemma-title"><i class="ph ph-bold ph-first-aid-kit"></i> EQUIPO MÉDICO</div>
          ${notif?`
          <div class="lm-dilemma-text" style="background:#2a1e1e;border:1px solid #e24b4a;border-radius:8px;padding:10px;margin-bottom:14px">
            <strong style="color:#e24b4a">URGENTE:</strong> ${jugadorUrgente?jugadorUrgente.name:'Un jugador'} tiene una lesión ${notif.severidad}.
            <div style="text-align:right;margin-top:8px">
              <button id="lmAtenderUrgente" class="mode-card-btn mode-card-btn-gold" style="width:auto;padding:7px 16px">ATENDER (sumar ${notif.dificultad}+)</button>
            </div>
          </div>` : ''}
          ${renderNivelesEquipoHTML()}
          <div class="lm-setup-desc" style="text-align:center;margin:10px 0 8px">dados disponibles este partido: <strong>${state.diceAvailable}</strong> (compartidos con el resto del cuerpo técnico) · cambios de carta: <strong>${state.medicoCambioUsado?0:1}/1</strong> · rerolls de dado hoy: <strong>${state.dadoRerollsDisponibles||0}/1</strong></div>
          <div class="med-card-grid">${cartasHTML}</div>
          <div class="lm-popup-actions lm-popup-actions-compact">
            <button id="lmMedicoCerrar" class="mode-card-btn mode-card-btn-secondary">CERRAR</button>
          </div>
        </div>`;

      const cerrarBtn=document.getElementById('lmMedicoCerrar');
      if(cerrarBtn) cerrarBtn.addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        overlay.remove();
        render();
      });

      const atenderBtn=document.getElementById('lmAtenderUrgente');
      if(atenderBtn) atenderBtn.addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        renderSelectorUrgente();
      });
      overlay.querySelectorAll('[data-swap]').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const idx=parseInt(btn.getAttribute('data-swap'),10);
          if(state.medicoCambioUsado) return;
          if(typeof window.playSound==='function') window.playSound('select');
          animarRerollCarta(overlay, idx, MEDICO_CARTAS_BASE, ()=>{
            cambiarCartaMedico(idx);
            renderHub();
          });
        });
      });
      overlay.querySelectorAll('[data-usar]').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const idx=parseInt(btn.getAttribute('data-usar'),10);
          if(typeof window.playSound==='function') window.playSound('select');
          const def=cartaDef(state.medicoCartas[idx].cartaId);
          const candidatos=jugadoresLesionadosPara(def);
          if(def.requiereLesion && candidatos.length>1){
            renderSelectorJugador(idx, candidatos);
          } else {
            renderSelectorCarta(idx, candidatos[0]?candidatos[0].id:null);
          }
        });
      });
    }

    function renderSelectorJugador(idx, candidatos){
      overlay.innerHTML=`
        <div class="lm-dilemma-card lm-dilemma-card-medico">
          <div class="lm-dilemma-title">¿SOBRE QUIÉN?</div>
          <div class="lm-slot-list">
            ${candidatos.map(p=>`<div class="lm-slot-option" data-pid="${p.id}"><span>${p.name}</span><span style="color:#e24b4a">${p.injurySeverity} · ${p.injuryWeeks} jornada${p.injuryWeeks===1?'':'s'} restante${p.injuryWeeks===1?'':'s'}</span></div>`).join('')}
          </div>
        </div>`;
      overlay.querySelectorAll('[data-pid]').forEach(el=>{
        el.addEventListener('click', ()=>{
          if(typeof window.playSound==='function') window.playSound('select');
          renderSelectorCarta(idx, el.getAttribute('data-pid'));
        });
      });
    }

    function renderSelectorCarta(idx, jugadorObjetivoId){
      const def=cartaDef(state.medicoCartas[idx].cartaId);
      const jugadorObjetivo = jugadorObjetivoId ? state.plantilla.find(p=>p.id===jugadorObjetivoId) : null;
      let dadosElegidos=Math.min(1, state.diceAvailable);
      function pintar(){
        overlay.innerHTML=`
          <div class="lm-dilemma-card lm-dilemma-card-medico">
            <i class="ph ph-bold ${def.icon}" style="font-size:26px;color:#5dcaa5"></i>
            <div class="lm-dilemma-title">${def.nombre.toUpperCase()}</div>
            <div class="lm-dilemma-text">${def.desc}${def.tipo==='directa'?` — necesitas sumar ${def.dificultad}+`:(def.tipo==='nivel'?` — necesitas sumar ${dificultadActualNivel(def)}+ para subir a nivel ${nivelDe(def.track)+1}/${NIVEL_MAXIMO_EQUIPO}`:' — los dados invertidos siempre suman al proyecto')}</div>
            ${jugadorObjetivo?`<div class="lm-setup-desc" style="margin-top:-4px">Sobre <strong>${jugadorObjetivo.name}</strong> — ${jugadorObjetivo.injurySeverity} · ${jugadorObjetivo.injuryWeeks} jornada${jugadorObjetivo.injuryWeeks===1?'':'s'} restante${jugadorObjetivo.injuryWeeks===1?'':'s'}</div>`:''}
            <div class="lm-dice-selector">
              <button id="lmDiceMinus" class="lm-dice-stepper">−</button>
              <span id="lmDiceCount">${dadosElegidos}</span>
              <button id="lmDicePlus" class="lm-dice-stepper">+</button>
            </div>
            <div class="lm-setup-desc">dados disponibles: ${state.diceAvailable}</div>
            <div class="lm-popup-actions">
              <button id="lmTirarBtn" class="mode-card-btn mode-card-btn-gold" ${state.diceAvailable<1?'disabled':''}>TIRAR ${dadosElegidos} DADO${dadosElegidos>1?'S':''}</button>
              <button id="lmCancelarCartaBtn" class="lm-btn-cancelar">CANCELAR</button>
            </div>
          </div>`;
        const minus=document.getElementById('lmDiceMinus');
        const plus=document.getElementById('lmDicePlus');
        const tirarBtn=document.getElementById('lmTirarBtn');
        const cancelarBtn=document.getElementById('lmCancelarCartaBtn');
        if(minus) minus.addEventListener('click', ()=>{ if(dadosElegidos>1){ dadosElegidos--; pintar(); } });
        if(plus) plus.addEventListener('click', ()=>{ if(dadosElegidos<state.diceAvailable){ dadosElegidos++; pintar(); } });
        if(cancelarBtn) cancelarBtn.addEventListener('click', ()=>{
          if(typeof window.playSound==='function') window.playSound('select');
          renderHub();
        });
        if(tirarBtn) tirarBtn.addEventListener('click', ()=>{
          if(typeof window.playSound==='function') window.playSound('select');
          renderRolloCarta(idx, dadosElegidos, jugadorObjetivoId);
        });
      }
      pintar();
    }

    // Barajado 2D de las caras del dado — CALCO del slot-machine que ya se
    function renderRolloCarta(idx, numDados, jugadorObjetivoId){
      overlay.innerHTML=`
        <div class="lm-dilemma-card lm-dilemma-card-medico">
          <div class="lm-dilemma-title" id="lmDiceTitle">TIRANDO ${numDados} DADO${numDados>1?'S':''}...</div>
          <div id="lmDice2DRow" class="lm-dice2d-row"></div>
          <div id="lmDiceResultZone"></div>
        </div>`;
      const box=document.getElementById('lmDice2DRow');
      iniciarBarajadoDados(box, numDados, (tiradas)=>{
        const tituloEl=document.getElementById('lmDiceTitle');
        if(tituloEl) tituloEl.textContent='TU TIRADA';
        box.innerHTML='';
        const zona=document.getElementById('lmDiceResultZone');
        mostrarResultadoDados(zona, tiradas,
          (tiradasFinales)=>{
            state.diceAvailable=Math.max(0, state.diceAvailable-numDados);
            return resolverCartaMedico(idx, tiradasFinales, jugadorObjetivoId);
          },
          ()=>{ renderHub(); }
        );
      });
    }

    // ---- Flujo de la notificación urgente (lesión recién ocurrida) ----
    function renderSelectorUrgente(){
      const jugador=state.plantilla.find(p=>p.id===state.medicoNotificacion.jugadorId);
      const dificultad=state.medicoNotificacion.dificultad;
      let dadosElegidos=Math.min(1, state.diceAvailable);
      function pintar(){
        overlay.innerHTML=`
          <div class="lm-dilemma-card lm-dilemma-card-medico">
            <i class="ph ph-bold ph-first-aid-kit" style="font-size:26px;color:#e24b4a"></i>
            <div class="lm-dilemma-title">EL MÉDICO TE CONSULTA</div>
            <div class="lm-dilemma-text">${jugador?jugador.name:'Un jugador'} tiene una lesión ${state.medicoNotificacion.severidad}. Necesitas sumar ${dificultad}+ para acelerar su recuperación.</div>
            <div class="lm-dice-selector">
              <button id="lmDiceMinus" class="lm-dice-stepper">−</button>
              <span id="lmDiceCount">${dadosElegidos}</span>
              <button id="lmDicePlus" class="lm-dice-stepper">+</button>
            </div>
            <div class="lm-setup-desc">dados disponibles: ${state.diceAvailable}</div>
            <div class="lm-popup-actions">
              <button id="lmTirarBtn" class="mode-card-btn mode-card-btn-gold" ${state.diceAvailable<1?'disabled':''}>TIRAR ${dadosElegidos} DADO${dadosElegidos>1?'S':''}</button>
            </div>
          </div>`;
        const minus=document.getElementById('lmDiceMinus');
        const plus=document.getElementById('lmDicePlus');
        const tirarBtn=document.getElementById('lmTirarBtn');
        if(minus) minus.addEventListener('click', ()=>{ if(dadosElegidos>1){ dadosElegidos--; pintar(); } });
        if(plus) plus.addEventListener('click', ()=>{ if(dadosElegidos<state.diceAvailable){ dadosElegidos++; pintar(); } });
        if(tirarBtn) tirarBtn.addEventListener('click', ()=>{
          if(typeof window.playSound==='function') window.playSound('select');
          renderRolloUrgente(dadosElegidos);
        });
      }
      pintar();
    }

    function renderRolloUrgente(numDados){
      overlay.innerHTML=`
        <div class="lm-dilemma-card lm-dilemma-card-medico">
          <div class="lm-dilemma-title" id="lmDiceTitle">TIRANDO ${numDados} DADO${numDados>1?'S':''}...</div>
          <div id="lmDice2DRow" class="lm-dice2d-row"></div>
          <div id="lmDiceResultZone"></div>
        </div>`;
      const box=document.getElementById('lmDice2DRow');
      iniciarBarajadoDados(box, numDados, (tiradas)=>{
        const tituloEl=document.getElementById('lmDiceTitle');
        if(tituloEl) tituloEl.textContent='TU TIRADA';
        box.innerHTML='';
        const zona=document.getElementById('lmDiceResultZone');
        mostrarResultadoDados(zona, tiradas,
          (tiradasFinales)=>resolverDilemaMedico(numDados, tiradasFinales),
          ()=>{ renderHub(); render(); }
        );
      });
    }

    renderHub();
  }

  /* ---------- 13b. Interfaz de Mantenimiento y Seguridad — mismo patrón que el
     equipo médico (misma mano de 3 cartas, mismo fondo de dados
     compartido, mismo barajado 2D), pero sin selección de jugador ya
     que las cartas actúan directamente sobre el estadio. ---------- */
  function abrirMantenimiento(){
    const overlay=document.createElement('div');
    overlay.id='lmMantenimientoOverlay';
    document.getElementById('ligaManagerScreen').appendChild(overlay);

    function renderHub(){
      const est=state.estadio||{campo:90,satisfaccion:0};
      const cartasHTML=state.mantenimientoCartas.map((instancia,idx)=>{
        const def=cartaDefM(instancia.cartaId);
        const bloqueadaPorEstado=mantenimientoBloqueadaPorEstado(def);
        const dificultadEfectiva = def.tipo==='nivel' ? dificultadActualNivelM(def) : def.dificultad;
        const maxPosible = state.diceAvailable*6;
        const imposiblePorDados = maxPosible < dificultadEfectiva;
        const nivelMaximoYa = def.tipo==='nivel' && nivelDeM(def.track)>=NIVEL_MAXIMO_EQUIPO;
        const bloqueada = bloqueadaPorEstado || imposiblePorDados || nivelMaximoYa;
        const cambioDisponible=!state.mantenimientoCambioUsado;
        let cuerpo;
        if(def.tipo==='nivel'){
          const n=nivelDeM(def.track);
          cuerpo=`<div class="med-card-progress-label" style="text-align:center;letter-spacing:2px;color:var(--gold)">${estrellasNivel(n)}</div>
                  <div class="med-card-dificultad">Dificultad ${dificultadEfectiva}+ para subir a nivel ${n+1}/${NIVEL_MAXIMO_EQUIPO}</div>`;
        } else {
          cuerpo=`<div class="med-card-dificultad">Dificultad ${def.dificultad}+</div>`;
        }
        return `
        <div class="med-card med-card-mantenimiento ${bloqueada?'med-card-bloqueada':''}" data-idx="${idx}">
          <button class="med-card-swap" data-swap="${idx}" title="Cambiar carta" ${cambioDisponible?'':'disabled'}><i class="ph ph-bold ph-arrows-clockwise"></i></button>
          <div class="med-card-tag">${def.tipo==='nivel'?'MEJORA':'MISIÓN'}</div>
          <i class="ph ph-bold ${def.icon} med-card-icon"></i>
          <div class="med-card-title">${def.nombre}</div>
          <div class="med-card-divider"></div>
          <div class="med-card-desc">${def.desc}</div>
          ${cuerpo}
          ${bloqueada?`<div class="med-card-bloqueada-label">${bloqueadaPorEstado?'Necesitas una afición muy descontenta (≤ −50)':(nivelMaximoYa?'Especialidad al máximo nivel':'Imposible con los dados que quedan')}</div>`:`<button class="mode-card-btn mode-card-btn-gold med-card-btn" data-usar="${idx}" style="padding:7px;font-size:11px">USAR</button>`}
        </div>`;
      }).join('');

      overlay.innerHTML=`
        <div class="lm-dilemma-card lm-dilemma-card-mant" style="max-width:640px">
          <div class="lm-dilemma-title"><i class="ph ph-bold ph-flag-pennant"></i> MANTENIMIENTO Y SEGURIDAD</div>
          ${renderNivelesMantenimientoHTML()}
          <div class="lm-setup-desc" style="text-align:center;margin:10px 0 8px">dados disponibles este partido: <strong>${state.diceAvailable}</strong> (compartidos con el resto del cuerpo técnico) · cambios de carta: <strong>${state.mantenimientoCambioUsado?0:1}/1</strong> · rerolls de dado hoy: <strong>${state.dadoRerollsDisponibles||0}/1</strong></div>
          <div class="med-card-grid">${cartasHTML}</div>
          <div class="lm-popup-actions lm-popup-actions-compact">
            <button id="lmMantenimientoCerrar" class="mode-card-btn mode-card-btn-secondary">CERRAR</button>
          </div>
        </div>`;

      const cerrarBtn=document.getElementById('lmMantenimientoCerrar');
      if(cerrarBtn) cerrarBtn.addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        overlay.remove();
        render();
      });
      overlay.querySelectorAll('[data-swap]').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const idx=parseInt(btn.getAttribute('data-swap'),10);
          if(state.mantenimientoCambioUsado) return;
          if(typeof window.playSound==='function') window.playSound('select');
          animarRerollCarta(overlay, idx, MANTENIMIENTO_CARTAS_BASE, ()=>{
            cambiarCartaMantenimiento(idx);
            renderHub();
          });
        });
      });
      overlay.querySelectorAll('[data-usar]').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const idx=parseInt(btn.getAttribute('data-usar'),10);
          if(typeof window.playSound==='function') window.playSound('select');
          renderSelectorCarta(idx);
        });
      });
    }

    function renderSelectorCarta(idx){
      const def=cartaDefM(state.mantenimientoCartas[idx].cartaId);
      let dadosElegidos=Math.min(1, state.diceAvailable);
      function pintar(){
        overlay.innerHTML=`
          <div class="lm-dilemma-card lm-dilemma-card-mant">
            <i class="ph ph-bold ${def.icon}" style="font-size:26px;color:#5dcaa5"></i>
            <div class="lm-dilemma-title">${def.nombre.toUpperCase()}</div>
            <div class="lm-dilemma-text">${def.desc}${def.tipo==='directa'?` — necesitas sumar ${def.dificultad}+`:` — necesitas sumar ${dificultadActualNivelM(def)}+ para subir a nivel ${nivelDeM(def.track)+1}/${NIVEL_MAXIMO_EQUIPO}`}</div>
            <div class="lm-dice-selector">
              <button id="lmDiceMinus" class="lm-dice-stepper">−</button>
              <span id="lmDiceCount">${dadosElegidos}</span>
              <button id="lmDicePlus" class="lm-dice-stepper">+</button>
            </div>
            <div class="lm-setup-desc">dados disponibles: ${state.diceAvailable}</div>
            <div class="lm-popup-actions">
              <button id="lmTirarBtn" class="mode-card-btn mode-card-btn-gold" ${state.diceAvailable<1?'disabled':''}>TIRAR ${dadosElegidos} DADO${dadosElegidos>1?'S':''}</button>
              <button id="lmCancelarCartaBtn" class="lm-btn-cancelar">CANCELAR</button>
            </div>
          </div>`;
        const minus=document.getElementById('lmDiceMinus');
        const plus=document.getElementById('lmDicePlus');
        const tirarBtn=document.getElementById('lmTirarBtn');
        const cancelarBtn=document.getElementById('lmCancelarCartaBtn');
        if(minus) minus.addEventListener('click', ()=>{ if(dadosElegidos>1){ dadosElegidos--; pintar(); } });
        if(plus) plus.addEventListener('click', ()=>{ if(dadosElegidos<state.diceAvailable){ dadosElegidos++; pintar(); } });
        if(cancelarBtn) cancelarBtn.addEventListener('click', ()=>{
          if(typeof window.playSound==='function') window.playSound('select');
          renderHub();
        });
        if(tirarBtn) tirarBtn.addEventListener('click', ()=>{
          if(typeof window.playSound==='function') window.playSound('select');
          renderRolloCarta(idx, dadosElegidos);
        });
      }
      pintar();
    }

    function renderRolloCarta(idx, numDados){
      overlay.innerHTML=`
        <div class="lm-dilemma-card lm-dilemma-card-mant">
          <div class="lm-dilemma-title" id="lmDiceTitle">TIRANDO ${numDados} DADO${numDados>1?'S':''}...</div>
          <div id="lmDice2DRow" class="lm-dice2d-row"></div>
          <div id="lmDiceResultZone"></div>
        </div>`;
      const box=document.getElementById('lmDice2DRow');
      iniciarBarajadoDados(box, numDados, (tiradas)=>{
        const tituloEl=document.getElementById('lmDiceTitle');
        if(tituloEl) tituloEl.textContent='TU TIRADA';
        box.innerHTML='';
        const zona=document.getElementById('lmDiceResultZone');
        mostrarResultadoDados(zona, tiradas,
          (tiradasFinales)=>{
            state.diceAvailable=Math.max(0, state.diceAvailable-numDados);
            return resolverCartaMantenimiento(idx, tiradasFinales);
          },
          ()=>{ renderHub(); }
        );
      });
    }

    renderHub();
  }

  /* ---------- 13c. Estado del estadio — burbuja "i" de Mantenimiento y
     Seguridad: las 3 barras (césped/satisfacción/moral) y el panel de
     aforo, que antes vivían en el hub de cartas y ahora quedan aparte
     como consulta rápida, igual que el historial médico. ---------- */
  function abrirEstadoEstadio(){
    const overlay=document.createElement('div');
    overlay.id='lmEstadoEstadioOverlay';
    const est=state.estadio||{campo:90, satisfaccion:0, aforoTotal:12000, ultimaAsistencia:null};
    const climaActual=climaDelPartido();
    const prevista=calcularAsistencia(climaActual?climaActual.id:null);
    const ultima=est.ultimaAsistencia;
    overlay.innerHTML=`
      <div class="lm-dilemma-card lm-dilemma-card-mant" style="max-width:480px;text-align:left">
        <div class="lm-dilemma-title" style="text-align:center"><i class="ph ph-bold ph-stadium"></i> ESTADO DEL ESTADIO</div>
        <div class="lm-estadio-bars">
          <div>
            <div class="lm-estadio-bar-label"><i class="ph ph-bold ph-plant"></i><span>ESTADO DEL CÉSPED</span><span>${Math.round(est.campo)}/100</span></div>
            ${campoBarraHTML(est.campo)}
          </div>
          <div>
            <div class="lm-estadio-bar-label"><i class="ph ph-bold ph-users-three"></i><span>SATISFACCIÓN DE LA AFICIÓN</span><span>${est.satisfaccion>0?'+':''}${est.satisfaccion}</span></div>
            ${satisfaccionBarraHTML(est.satisfaccion)}
          </div>
          <div>
            <div class="lm-estadio-bar-label"><i class="ph ph-bold ph-trend-up"></i><span>MORAL DEL EQUIPO</span><span>${(state.moral||0)>0?'+':''}${state.moral||0}</span></div>
            ${moralBarraHTML(state.moral||0)}
          </div>
        </div>
        <div class="lm-aforo-box">
          <i class="ph ph-bold ph-ticket lm-aforo-icon"></i>
          <div class="lm-aforo-info">
            <div class="lm-aforo-title"><span>AFORO DEL ESTADIO</span><strong>${est.aforoTotal.toLocaleString('es-ES')} asientos</strong></div>
            <div class="lm-aforo-bar-wrap"><div class="lm-aforo-bar-fill" style="width:${Math.round(prevista.pct*100)}%"></div></div>
            <div class="lm-aforo-nota">
              Previsión próximo partido en casa: <strong>${prevista.asistentes.toLocaleString('es-ES')}</strong> asientos (${Math.round(prevista.pct*100)}%)
              ${ultima?` · Último partido en casa (J${ultima.jornada}): <strong>${ultima.asistentes.toLocaleString('es-ES')}</strong> (${Math.round(ultima.pct*100)}%)`:''}
            </div>
          </div>
        </div>
        <div class="lm-popup-actions lm-popup-actions-compact">
          <button id="lmEstadoEstadioCerrar" class="mode-card-btn mode-card-btn-gold">CERRAR</button>
        </div>
      </div>`;
    document.getElementById('ligaManagerScreen').appendChild(overlay);
    document.getElementById('lmEstadoEstadioCerrar').addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      overlay.remove();
    });
  }

  /* ---------- 13d. Interfaz del Director General — capital, precio de
     entrada (control manual) y sus 10 cartas, mismo patrón que médico y
     mantenimiento. ---------- */
  function abrirDirectorGeneral(){
    const overlay=document.createElement('div');
    overlay.id='lmDirectorGeneralOverlay';
    document.getElementById('ligaManagerScreen').appendChild(overlay);

    function renderHub(){
      const cartasHTML=state.directorGeneralCartas.map((instancia,idx)=>{
        const def=cartaDefDG(instancia.cartaId);
        const dificultadEfectiva = def.tipo==='nivel' ? dificultadActualNivelDG(def) : def.dificultad;
        const maxPosible = state.diceAvailable*6;
        const imposiblePorDados = maxPosible < dificultadEfectiva;
        const nivelMaximoYa = def.tipo==='nivel' && nivelDeDG(def.track)>=NIVEL_MAXIMO_EQUIPO;
        const bloqueada = imposiblePorDados || nivelMaximoYa;
        const cambioDisponible=!state.directorGeneralCambioUsado;
        let cuerpo;
        if(def.tipo==='nivel'){
          const n=nivelDeDG(def.track);
          cuerpo=`<div class="med-card-progress-label" style="text-align:center;letter-spacing:2px;color:var(--gold)">${estrellasNivel(n)}</div>
                  <div class="med-card-dificultad">Dificultad ${dificultadEfectiva}+ para subir a nivel ${n+1}/${NIVEL_MAXIMO_EQUIPO}</div>`;
        } else {
          cuerpo=`<div class="med-card-dificultad">Dificultad ${def.dificultad}+</div>`;
        }
        return `
        <div class="med-card med-card-dg ${bloqueada?'med-card-bloqueada':''}" data-idx="${idx}">
          <button class="med-card-swap" data-swap="${idx}" title="Cambiar carta" ${cambioDisponible?'':'disabled'}><i class="ph ph-bold ph-arrows-clockwise"></i></button>
          <div class="med-card-tag">${def.tipo==='nivel'?'MEJORA':'MISIÓN'}</div>
          <i class="ph ph-bold ${def.icon} med-card-icon"></i>
          <div class="med-card-title">${def.nombre}</div>
          <div class="med-card-divider"></div>
          <div class="med-card-desc">${def.desc}</div>
          ${cuerpo}
          ${bloqueada?`<div class="med-card-bloqueada-label">${nivelMaximoYa?'Especialidad al máximo nivel':'Imposible con los dados que quedan'}</div>`:`<button class="mode-card-btn mode-card-btn-gold med-card-btn" data-usar="${idx}" style="padding:7px;font-size:11px">USAR</button>`}
        </div>`;
      }).join('');

      overlay.innerHTML=`
        <div class="lm-dilemma-card lm-dilemma-card-dg" style="max-width:640px">
          <div class="lm-dilemma-title"><i class="ph ph-bold ph-briefcase"></i> DIRECTOR GENERAL</div>
          <div class="lm-capital-box">
            <i class="ph ph-bold ph-coins lm-capital-icon"></i>
            <div class="lm-capital-info">
              <div class="lm-capital-title"><span>CAPITAL DEL CLUB</span><strong class="${(state.capital||0)<0?'lm-capital-neg':''}">${formatoDinero(state.capital)}</strong></div>
              <div class="lm-aforo-nota">Próxima nómina en la jornada ${Math.max(1,(state.mesesPagados||0)*4+1)}</div>
            </div>
          </div>
          <div class="lm-precio-box">
            <div class="lm-estadio-bar-label"><i class="ph ph-bold ph-ticket"></i><span>PRECIO DE LA ENTRADA</span><span>${formatoDinero(state.precioEntrada)}</span></div>
            <input type="range" id="lmPrecioEntradaSlider" min="5" max="60" step="1" value="${state.precioEntrada}" class="lm-precio-slider">
            <div class="lm-aforo-nota">Más caro = más ingreso por entrada, pero menos afición vendrá a verte (se nota menos cuanto más nivel tengas en Relaciones con la Afición).</div>
          </div>
          ${renderNivelesDGHTML()}
          <div class="lm-setup-desc" style="text-align:center;margin:10px 0 8px">dados disponibles este partido: <strong>${state.diceAvailable}</strong> (compartidos con el resto del cuerpo técnico) · cambios de carta: <strong>${state.directorGeneralCambioUsado?0:1}/1</strong> · rerolls de dado hoy: <strong>${state.dadoRerollsDisponibles||0}/1</strong></div>
          <div class="med-card-grid">${cartasHTML}</div>
          <div class="lm-popup-actions lm-popup-actions-compact">
            <button id="lmDirectorGeneralCerrar" class="mode-card-btn mode-card-btn-secondary">CERRAR</button>
          </div>
        </div>`;

      const slider=document.getElementById('lmPrecioEntradaSlider');
      if(slider) slider.addEventListener('change', ()=>{
        state.precioEntrada=parseInt(slider.value,10);
        if(typeof window.playSound==='function') window.playSound('select');
        guardarEstado();
        renderHub();
      });
      const cerrarBtn=document.getElementById('lmDirectorGeneralCerrar');
      if(cerrarBtn) cerrarBtn.addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        overlay.remove();
        render();
      });
      overlay.querySelectorAll('[data-swap]').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const idx=parseInt(btn.getAttribute('data-swap'),10);
          if(state.directorGeneralCambioUsado) return;
          if(typeof window.playSound==='function') window.playSound('select');
          animarRerollCarta(overlay, idx, DIRECTOR_GENERAL_CARTAS_BASE, ()=>{
            cambiarCartaDG(idx);
            renderHub();
          });
        });
      });
      overlay.querySelectorAll('[data-usar]').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const idx=parseInt(btn.getAttribute('data-usar'),10);
          if(typeof window.playSound==='function') window.playSound('select');
          renderSelectorCarta(idx);
        });
      });
    }

    function renderSelectorCarta(idx){
      const def=cartaDefDG(state.directorGeneralCartas[idx].cartaId);
      let dadosElegidos=Math.min(1, state.diceAvailable);
      function pintar(){
        overlay.innerHTML=`
          <div class="lm-dilemma-card lm-dilemma-card-dg">
            <i class="ph ph-bold ${def.icon}" style="font-size:26px;color:#e6c94a"></i>
            <div class="lm-dilemma-title">${def.nombre.toUpperCase()}</div>
            <div class="lm-dilemma-text">${def.desc}${def.tipo==='directa'?` — necesitas sumar ${def.dificultad}+`:` — necesitas sumar ${dificultadActualNivelDG(def)}+ para subir a nivel ${nivelDeDG(def.track)+1}/${NIVEL_MAXIMO_EQUIPO}`}</div>
            <div class="lm-dice-selector">
              <button id="lmDiceMinus" class="lm-dice-stepper">−</button>
              <span id="lmDiceCount">${dadosElegidos}</span>
              <button id="lmDicePlus" class="lm-dice-stepper">+</button>
            </div>
            <div class="lm-setup-desc">dados disponibles: ${state.diceAvailable}</div>
            <div class="lm-popup-actions">
              <button id="lmTirarBtn" class="mode-card-btn mode-card-btn-gold" ${state.diceAvailable<1?'disabled':''}>TIRAR ${dadosElegidos} DADO${dadosElegidos>1?'S':''}</button>
              <button id="lmCancelarCartaBtn" class="lm-btn-cancelar">CANCELAR</button>
            </div>
          </div>`;
        const minus=document.getElementById('lmDiceMinus');
        const plus=document.getElementById('lmDicePlus');
        const tirarBtn=document.getElementById('lmTirarBtn');
        const cancelarBtn=document.getElementById('lmCancelarCartaBtn');
        if(minus) minus.addEventListener('click', ()=>{ if(dadosElegidos>1){ dadosElegidos--; pintar(); } });
        if(plus) plus.addEventListener('click', ()=>{ if(dadosElegidos<state.diceAvailable){ dadosElegidos++; pintar(); } });
        if(cancelarBtn) cancelarBtn.addEventListener('click', ()=>{
          if(typeof window.playSound==='function') window.playSound('select');
          renderHub();
        });
        if(tirarBtn) tirarBtn.addEventListener('click', ()=>{
          if(typeof window.playSound==='function') window.playSound('select');
          renderRolloCarta(idx, dadosElegidos);
        });
      }
      pintar();
    }

    function renderRolloCarta(idx, numDados){
      overlay.innerHTML=`
        <div class="lm-dilemma-card lm-dilemma-card-dg">
          <div class="lm-dilemma-title" id="lmDiceTitle">TIRANDO ${numDados} DADO${numDados>1?'S':''}...</div>
          <div id="lmDice2DRow" class="lm-dice2d-row"></div>
          <div id="lmDiceResultZone"></div>
        </div>`;
      const box=document.getElementById('lmDice2DRow');
      iniciarBarajadoDados(box, numDados, (tiradas)=>{
        const tituloEl=document.getElementById('lmDiceTitle');
        if(tituloEl) tituloEl.textContent='TU TIRADA';
        box.innerHTML='';
        const zona=document.getElementById('lmDiceResultZone');
        mostrarResultadoDados(zona, tiradas,
          (tiradasFinales)=>{
            state.diceAvailable=Math.max(0, state.diceAvailable-numDados);
            return resolverCartaDG(idx, tiradasFinales);
          },
          ()=>{ renderHub(); }
        );
      });
    }

    renderHub();
  }

  const NIVELES_DG_INFO=[
    {track:'aforoExtra',          label:'Ampliación de grada',   icon:'ph-stairs',       desc:'Aforo permanente del estadio'},
    {track:'ingresoPatrocinio',   label:'Patrocinadores',        icon:'ph-handshake',    desc:'Ingreso fijo mensual'},
    {track:'ingresoMerchandising',label:'Tienda y merchandising',icon:'ph-t-shirt',      desc:'Ingreso por cada asistente'},
    {track:'toleranciaPrecio',    label:'Relaciones con la afición',icon:'ph-users-three',desc:'Margen para subir el precio de entrada'}
  ];
  function renderNivelesDGHTML(){
    return `<div class="med-niveles-grid">${NIVELES_DG_INFO.map(info=>{
      const n=nivelDeDG(info.track);
      return `<div class="med-nivel-row">
        <i class="ph ph-bold ${info.icon}"></i>
        <div class="med-nivel-info">
          <div class="med-nivel-label">${info.label}</div>
          <div class="med-nivel-desc">${info.desc}</div>
        </div>
        <div class="med-nivel-stars" title="Nivel ${n}/${NIVEL_MAXIMO_EQUIPO}">${estrellasNivel(n)}</div>
      </div>`;
    }).join('')}</div>`;
  }

  /* ---------- 13e. Finanzas del Director General — burbuja "i": tabla
     mensual de ingresos/gastos con mini barras, agrupada por mes. ---------- */
  function abrirFinanzasDG(){
    const overlay=document.createElement('div');
    overlay.id='lmFinanzasOverlay';
    const historial=state.finanzasHistorial||[];
    const meses={};
    historial.forEach(h=>{
      if(!meses[h.mes]) meses[h.mes]={ingresos:0, gastos:0, movimientos:[]};
      if(h.monto>=0) meses[h.mes].ingresos+=h.monto; else meses[h.mes].gastos+=Math.abs(h.monto);
      meses[h.mes].movimientos.push(h);
    });
    const mesesOrdenadosDesc=Object.keys(meses).map(Number).sort((a,b)=>b-a);
    const mesActual=mesesOrdenadosDesc[0];
    const mesesHistoricos=mesesOrdenadosDesc.slice(1).sort((a,b)=>a-b); // resto, de más antiguo a más reciente para el gráfico
    let filaMesActual='<p class="lm-setup-desc" style="text-align:center">Todavía no hay movimientos este mes.</p>';
    if(mesActual!==undefined){
      const d=meses[mesActual];
      const neto=d.ingresos-d.gastos;
      const maxValor=Math.max(1, d.ingresos, d.gastos);
      filaMesActual=`<div class="lm-fin-mes">
        <div class="lm-fin-mes-title"><span>MES ${mesActual} (ACTUAL)</span><span style="color:${neto>=0?'#5dcaa5':'#e24b4a'}">${neto>=0?'+':''}${formatoDinero(neto)}</span></div>
        <div class="lm-fin-bar-row"><span class="lm-fin-bar-label">Ingresos</span><div class="lm-fin-bar-wrap"><div class="lm-fin-bar-fill lm-fin-bar-ingreso" style="width:${Math.round(d.ingresos/maxValor*100)}%"></div></div><span class="lm-fin-bar-valor">${formatoDinero(d.ingresos)}</span></div>
        <div class="lm-fin-bar-row"><span class="lm-fin-bar-label">Gastos</span><div class="lm-fin-bar-wrap"><div class="lm-fin-bar-fill lm-fin-bar-gasto" style="width:${Math.round(d.gastos/maxValor*100)}%"></div></div><span class="lm-fin-bar-valor">${formatoDinero(d.gastos)}</span></div>
      </div>`;
    }
    // Histórico de meses anteriores — gráfico de barras (neto por mes),
    // en vez de repetir la misma tabla detallada para cada mes.
    let graficoHistorico='<p class="lm-setup-desc" style="text-align:center">Todavía no hay histórico de meses anteriores.</p>';
    if(mesesHistoricos.length){
      const netos=mesesHistoricos.map(m=>meses[m].ingresos-meses[m].gastos);
      const maxAbs=Math.max(1, ...netos.map(n=>Math.abs(n)));
      const w=420, h=150, midY=h/2, hueco=(w-20)/mesesHistoricos.length, barW=Math.min(34, hueco-8);
      const barras=mesesHistoricos.map((m,i)=>{
        const neto=netos[i];
        const barH=Math.max(2, Math.round(Math.abs(neto)/maxAbs*(h/2-14)));
        const x=10+i*hueco+(hueco-barW)/2;
        const y=neto>=0 ? midY-barH : midY;
        const color=neto>=0 ? '#5dcaa5' : '#e24b4a';
        return `<rect x="${x.toFixed(1)}" y="${y}" width="${barW.toFixed(1)}" height="${barH}" fill="${color}" rx="2"></rect>
                <text x="${(x+barW/2).toFixed(1)}" y="${h-3}" font-size="8" fill="#888" text-anchor="middle">M${m}</text>`;
      }).join('');
      graficoHistorico=`<svg viewBox="0 0 ${w} ${h}" style="width:100%;height:150px">
        <line x1="0" y1="${midY}" x2="${w}" y2="${midY}" stroke="#3a3f42" stroke-width="1"></line>
        ${barras}
      </svg>`;
    }
    overlay.innerHTML=`
      <div class="lm-dilemma-card lm-dilemma-card-dg" style="max-width:480px;text-align:left">
        <div class="lm-dilemma-title" style="text-align:center"><i class="ph ph-bold ph-chart-line-up"></i> FINANZAS DEL CLUB</div>
        <div class="lm-capital-box" style="margin-bottom:12px">
          <i class="ph ph-bold ph-coins lm-capital-icon"></i>
          <div class="lm-capital-info">
            <div class="lm-capital-title"><span>CAPITAL ACTUAL</span><strong class="${(state.capital||0)<0?'lm-capital-neg':''}">${formatoDinero(state.capital)}</strong></div>
          </div>
        </div>
        ${filaMesActual}
        <p class="lm-setup-desc" style="text-align:left;margin:12px 0 4px">Histórico de meses anteriores (neto por mes)</p>
        ${graficoHistorico}
        <div class="lm-popup-actions lm-popup-actions-compact">
          <button id="lmFinanzasCerrar" class="mode-card-btn mode-card-btn-gold">CERRAR</button>
        </div>
      </div>`;
    document.getElementById('ligaManagerScreen').appendChild(overlay);
    document.getElementById('lmFinanzasCerrar').addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      overlay.remove();
    });
  }

  /* ---------- 13f. Interfaz del Director Deportivo — sus 10 cartas
     (incluida la especial "Sobres de Fichajes", con botón propio de abrir
     sobre siempre visible a partir de nivel 1) y la revelación de
     jugadores al abrir un sobre, con el mismo barajado 2D que los dados. ---------- */
  function abrirDirectorDeportivo(){
    const overlay=document.createElement('div');
    overlay.id='lmDirectorDeportivoOverlay';
    document.getElementById('ligaManagerScreen').appendChild(overlay);

    function renderHub(){
      const nivelSobre=nivelDeDD('sobresFichajes');
      const cartasHTML=state.directorDeportivoCartas.map((instancia,idx)=>{
        const def=cartaDefDD(instancia.cartaId);
        const esSobre=def.tipo==='sobre';
        const dificultadEfectiva = (def.tipo==='nivel'||esSobre) ? dificultadActualNivelDD(def) : def.dificultad;
        const maxPosible = state.diceAvailable*6;
        const imposiblePorDados = maxPosible < dificultadEfectiva;
        const nivelActualTrack = (def.tipo==='nivel'||esSobre) ? nivelDeDD(def.track) : 0;
        const nivelMaximoYa = (def.tipo==='nivel'||esSobre) && nivelActualTrack>=NIVEL_MAXIMO_EQUIPO;
        const bloqueada = imposiblePorDados || nivelMaximoYa;
        const cambioDisponible=!state.directorDeportivoCambioUsado;
        let cuerpo;
        if(def.tipo==='nivel'||esSobre){
          cuerpo=`<div class="med-card-progress-label" style="text-align:center;letter-spacing:2px;color:var(--gold)">${estrellasNivel(nivelActualTrack)}</div>
                  <div class="med-card-dificultad">${nivelMaximoYa?'Nivel máximo alcanzado':`Dificultad ${dificultadEfectiva}+ para subir a nivel ${nivelActualTrack+1}/${NIVEL_MAXIMO_EQUIPO}`}</div>`;
        } else {
          cuerpo=`<div class="med-card-dificultad">Dificultad ${def.dificultad}+</div>`;
        }
        const botonAccion = bloqueada
          ? (nivelMaximoYa ? '' : `<div class="med-card-bloqueada-label">Imposible con los dados que quedan</div>`)
          : `<button class="mode-card-btn mode-card-btn-gold med-card-btn" data-usar="${idx}" style="padding:7px;font-size:11px">USAR</button>`;
        const botonSobre = (esSobre && nivelActualTrack>=1)
          ? `<button class="mode-card-btn mode-card-btn-secondary med-card-btn" data-abrirsobre="${nivelActualTrack}" style="padding:7px;font-size:11px;margin-top:6px;border:1px solid var(--gold);color:var(--gold)" ${((state.capital||0)<(SOBRE_COSTES[nivelActualTrack]||0))?'disabled':''}>ABRIR SOBRE (${formatoDinero(SOBRE_COSTES[nivelActualTrack]||0)})</button>`
          : '';
        return `
        <div class="med-card med-card-dd ${bloqueada&&!nivelMaximoYa?'med-card-bloqueada':''}" data-idx="${idx}">
          <button class="med-card-swap" data-swap="${idx}" title="Cambiar carta" ${cambioDisponible?'':'disabled'}><i class="ph ph-bold ph-arrows-clockwise"></i></button>
          <div class="med-card-tag">${esSobre?'PROYECTO ESPECIAL':(def.tipo==='nivel'?'MEJORA':'MISIÓN')}</div>
          <i class="ph ph-bold ${def.icon} med-card-icon"></i>
          <div class="med-card-title">${def.nombre}</div>
          <div class="med-card-divider"></div>
          <div class="med-card-desc">${def.desc}</div>
          ${cuerpo}
          ${botonAccion}
          ${botonSobre}
        </div>`;
      }).join('');

      overlay.innerHTML=`
        <div class="lm-dilemma-card lm-dilemma-card-dd" style="max-width:640px">
          <div class="lm-dilemma-title"><i class="ph ph-bold ph-binoculars"></i> DIRECTOR DEPORTIVO</div>
          <div class="lm-capital-box">
            <i class="ph ph-bold ph-coins lm-capital-icon"></i>
            <div class="lm-capital-info">
              <div class="lm-capital-title"><span>CAPITAL DEL CLUB</span><strong class="${(state.capital||0)<0?'lm-capital-neg':''}">${formatoDinero(state.capital)}</strong></div>
              <div class="lm-aforo-nota">${nivelSobre>=1?`Sobres de Fichajes a nivel ${nivelSobre}/${NIVEL_MAXIMO_EQUIPO} — puedes abrirlos cuando quieras desde su tarjeta`:'Sube el proyecto "Sobres de Fichajes" para empezar a fichar'}</div>
            </div>
          </div>
          <div class="lm-setup-desc" style="text-align:center;margin:10px 0 8px">dados disponibles este partido: <strong>${state.diceAvailable}</strong> (compartidos con el resto del cuerpo técnico) · cambios de carta: <strong>${state.directorDeportivoCambioUsado?0:1}/1</strong> · rerolls de dado hoy: <strong>${state.dadoRerollsDisponibles||0}/1</strong></div>
          <div class="med-card-grid">${cartasHTML}</div>
          <div class="lm-popup-actions lm-popup-actions-compact">
            <button id="lmDirectorDeportivoCerrar" class="mode-card-btn mode-card-btn-secondary">CERRAR</button>
          </div>
        </div>`;

      const cerrarBtn=document.getElementById('lmDirectorDeportivoCerrar');
      if(cerrarBtn) cerrarBtn.addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        overlay.remove();
        render();
      });
      overlay.querySelectorAll('[data-swap]').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const idx=parseInt(btn.getAttribute('data-swap'),10);
          if(state.directorDeportivoCambioUsado) return;
          if(typeof window.playSound==='function') window.playSound('select');
          animarRerollCarta(overlay, idx, DIRECTOR_DEPORTIVO_CARTAS_BASE, ()=>{
            cambiarCartaDD(idx);
            renderHub();
          });
        });
      });
      overlay.querySelectorAll('[data-usar]').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const idx=parseInt(btn.getAttribute('data-usar'),10);
          if(typeof window.playSound==='function') window.playSound('select');
          renderSelectorCarta(idx);
        });
      });
      overlay.querySelectorAll('[data-abrirsobre]').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const nivel=parseInt(btn.getAttribute('data-abrirsobre'),10);
          if(typeof window.playSound==='function') window.playSound('select');
          const jugadores=abrirSobreEnNivel(nivel);
          if(!jugadores){ renderHub(); return; }
          mostrarRevelacionSobre(jugadores, renderHub);
        });
      });
    }

    function renderSelectorCarta(idx){
      const def=cartaDefDD(state.directorDeportivoCartas[idx].cartaId);
      const esSobre=def.tipo==='sobre';
      let dadosElegidos=Math.min(1, state.diceAvailable);
      function pintar(){
        overlay.innerHTML=`
          <div class="lm-dilemma-card lm-dilemma-card-dd">
            <i class="ph ph-bold ${def.icon}" style="font-size:26px;color:#c9c9c9"></i>
            <div class="lm-dilemma-title">${def.nombre.toUpperCase()}</div>
            <div class="lm-dilemma-text">${def.desc}${def.tipo==='directa'?` — necesitas sumar ${def.dificultad}+`:` — necesitas sumar ${dificultadActualNivelDD(def)}+ para subir a nivel ${nivelDeDD(def.track)+1}/${NIVEL_MAXIMO_EQUIPO}`}</div>
            <div class="lm-dice-selector">
              <button id="lmDiceMinus" class="lm-dice-stepper">−</button>
              <span id="lmDiceCount">${dadosElegidos}</span>
              <button id="lmDicePlus" class="lm-dice-stepper">+</button>
            </div>
            <div class="lm-setup-desc">dados disponibles: ${state.diceAvailable}</div>
            <div class="lm-popup-actions">
              <button id="lmTirarBtn" class="mode-card-btn mode-card-btn-gold" ${state.diceAvailable<1?'disabled':''}>TIRAR ${dadosElegidos} DADO${dadosElegidos>1?'S':''}</button>
              <button id="lmCancelarCartaBtn" class="lm-btn-cancelar">CANCELAR</button>
            </div>
          </div>`;
        const minus=document.getElementById('lmDiceMinus');
        const plus=document.getElementById('lmDicePlus');
        const tirarBtn=document.getElementById('lmTirarBtn');
        const cancelarBtn=document.getElementById('lmCancelarCartaBtn');
        if(minus) minus.addEventListener('click', ()=>{ if(dadosElegidos>1){ dadosElegidos--; pintar(); } });
        if(plus) plus.addEventListener('click', ()=>{ if(dadosElegidos<state.diceAvailable){ dadosElegidos++; pintar(); } });
        if(cancelarBtn) cancelarBtn.addEventListener('click', ()=>{
          if(typeof window.playSound==='function') window.playSound('select');
          renderHub();
        });
        if(tirarBtn) tirarBtn.addEventListener('click', ()=>{
          if(typeof window.playSound==='function') window.playSound('select');
          renderRolloCarta(idx, dadosElegidos, esSobre);
        });
      }
      pintar();
    }

    function renderRolloCarta(idx, numDados, esSobre){
      overlay.innerHTML=`
        <div class="lm-dilemma-card lm-dilemma-card-dd">
          <div class="lm-dilemma-title" id="lmDiceTitle">TIRANDO ${numDados} DADO${numDados>1?'S':''}...</div>
          <div id="lmDice2DRow" class="lm-dice2d-row"></div>
          <div id="lmDiceResultZone"></div>
        </div>`;
      const box=document.getElementById('lmDice2DRow');
      iniciarBarajadoDados(box, numDados, (tiradas)=>{
        const tituloEl=document.getElementById('lmDiceTitle');
        if(tituloEl) tituloEl.textContent='TU TIRADA';
        box.innerHTML='';
        const zona=document.getElementById('lmDiceResultZone');
        mostrarResultadoDados(zona, tiradas,
          (tiradasFinales)=>{
            state.diceAvailable=Math.max(0, state.diceAvailable-numDados);
            return resolverCartaDD(idx, tiradasFinales);
          },
          (resultado)=>{
            if(resultado && resultado.sobreAbierto && resultado.sobreAbierto.length){
              mostrarRevelacionSobre(resultado.sobreAbierto, renderHub);
            } else {
              renderHub();
            }
          }
        );
      });
    }

    // Revelación de los 3 jugadores de un sobre — mismo barajado 2D que
    // los dados/las cartas de rerroll, mostrando la posición en grande
    // (todavía sin imagen) y permitiendo fichar al momento.
    function mostrarRevelacionSobre(jugadores, onCerrar){
      overlay.innerHTML=`
        <div class="lm-dilemma-card lm-dilemma-card-dd" style="max-width:560px">
          <div class="lm-dilemma-title"><i class="ph ph-bold ph-envelope-open"></i> SOBRE DE FICHAJES</div>
          <div id="lmSobreReveloZone" class="lm-sobre-grid">
            ${jugadores.map((j,i)=>`<div class="slot-reel lm-sobre-reel" id="lmSobreReel${i}"><div class="slot-strip lm-sobre-face">?</div></div>`).join('')}
          </div>
          <div id="lmSobreResultado"></div>
        </div>`;
      let ticks=0;
      const totalTicks=11+Math.floor(Math.random()*4);
      const posiciones=['POR','DFC','LI','LD','MC','EI','ED','DC'];
      const spin=setInterval(()=>{
        jugadores.forEach((j,i)=>{
          const el=document.getElementById('lmSobreReel'+i);
          if(el) el.querySelector('.lm-sobre-face').textContent=posiciones[Math.floor(Math.random()*posiciones.length)];
        });
        if(typeof window.playSound==='function') window.playSound('spin');
        ticks++;
        if(ticks>=totalTicks){
          clearInterval(spin);
          if(typeof window.playSound==='function') window.playSound('reveal');
          const zona=document.getElementById('lmSobreResultado');
          zona.innerHTML=`<div class="lm-sobre-cards">${jugadores.map((j,i)=>`
            <div class="lm-sobre-card" data-jugador="${i}">
              <div class="lm-sobre-pos">${j.position}</div>
              <div class="lm-sobre-nombre">${j.name}</div>
              <div class="lm-sobre-overall">${j.overall} <span>puntuación</span></div>
              <div class="lm-sobre-stats">ATA ${j.attack} · DEF ${j.defense} · RIT ${j.pace} · PAS ${j.passing} · TEC ${j.technique}</div>
              <div class="lm-sobre-salario">${formatoDinero(j.salario)}/mes</div>
              <button class="mode-card-btn mode-card-btn-gold lm-sobre-fichar" data-fichar="${i}" style="padding:6px;font-size:10px;margin-top:6px">FICHAR</button>
            </div>`).join('')}</div>
            <div class="lm-popup-actions" style="margin-top:12px"><button id="lmSobreCerrar" class="mode-card-btn mode-card-btn-secondary">CERRAR SOBRE</button></div>`;
          zona.querySelectorAll('[data-fichar]').forEach(btn=>{
            btn.addEventListener('click', ()=>{
              const i=parseInt(btn.getAttribute('data-fichar'),10);
              if(typeof window.playSound==='function') window.playSound('select');
              ficharJugadorSobre(jugadores[i]);
              btn.textContent='FICHADO ✔';
              btn.disabled=true;
              btn.closest('.lm-sobre-card').classList.add('lm-sobre-card-fichado');
            });
          });
          document.getElementById('lmSobreCerrar').addEventListener('click', ()=>{
            if(typeof window.playSound==='function') window.playSound('select');
            onCerrar();
          });
        }
      },85);
    }

    renderHub();
  }

  /* ---------- 13g. Salarios de la plantilla — burbuja "i" del Director
     Deportivo: lista completa de jugadores con su salario mensual. ---------- */
  function abrirSalariosDD(){
    const overlay=document.createElement('div');
    overlay.id='lmSalariosOverlay';
    function pintar(){
      const jugadores=[...(state.plantilla||[])].sort((a,b)=>(b.salario||0)-(a.salario||0));
      const totalNomina=jugadores.reduce((s,p)=>s+(p.salario||0),0);
      const filas=jugadores.map(p=>{
        const chequeo=puedeVenderJugador(p.id);
        return `
      <div class="lm-hist-item">
        <i class="ph ph-bold ph-user" style="color:#c9c9c9"></i>
        <div style="flex:1">
          <div class="lm-hist-title">${p.name} <span class="lm-hist-tag">${p.position}</span>${p.injured?' <span class="cross" title="Lesionado">✚</span>':''}</div>
          <div class="lm-hist-meta">Puntuación ${p.overall}</div>
        </div>
        <div style="text-align:right">
          <div style="font-family:'Bebas Neue';font-size:14px;color:var(--gold);white-space:nowrap">${formatoDinero(p.salario||0)}/mes</div>
          <button class="mode-card-btn mode-card-btn-secondary lm-vender-btn" data-vender="${p.id}" title="${chequeo.ok?'':chequeo.motivo}" ${chequeo.ok?'':'disabled'} style="padding:4px 8px;font-size:9px;margin-top:3px">VENDER</button>
        </div>
      </div>`;
      }).join('');
      overlay.innerHTML=`
        <div class="lm-dilemma-card lm-dilemma-card-dd" style="max-width:480px;text-align:left">
          <div class="lm-dilemma-title" style="text-align:center"><i class="ph ph-bold ph-file-text"></i> SALARIOS DE LA PLANTILLA</div>
          <div class="lm-setup-desc" style="text-align:center;margin-bottom:8px">Nómina total de jugadores: <strong>${formatoDinero(totalNomina)}/mes</strong> · plantilla: <strong>${jugadores.length}</strong></div>
          <p class="lm-setup-desc" style="text-align:center;margin-bottom:8px">No puedes vender si te dejaría por debajo de 11 jugadores sanos disponibles.</p>
          <div class="lm-hist-list">${filas||'<p class="lm-setup-desc" style="text-align:center">No hay jugadores en la plantilla.</p>'}</div>
          <div class="lm-popup-actions lm-popup-actions-compact">
            <button id="lmSalariosCerrar" class="mode-card-btn mode-card-btn-gold">CERRAR</button>
          </div>
        </div>`;
      document.getElementById('lmSalariosCerrar').addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        overlay.remove();
      });
      overlay.querySelectorAll('[data-vender]').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const jugadorId=btn.getAttribute('data-vender');
          const jugador=(state.plantilla||[]).find(p=>p.id===jugadorId);
          if(!jugador) return;
          const proceder=()=>{
            const r=venderJugadorManual(jugadorId);
            if(typeof window.playSound==='function') window.playSound('select');
            if(!r.ok && r.motivo) alert(r.motivo);
            pintar();
          };
          const monto=Math.max(3000, Math.round(jugador.overall*400));
          if(typeof window.showConfirmPopup==='function'){
            window.showConfirmPopup(`¿Vender a ${jugador.name} por ${formatoDinero(monto)}? Esta acción no se puede deshacer.`, proceder, 'VENDER');
          } else if(confirm(`¿Vender a ${jugador.name} por ${formatoDinero(monto)}?`)){
            proceder();
          }
        });
      });
    }
    document.getElementById('ligaManagerScreen').appendChild(overlay);
    pintar();
  }

  /* ---------- 13h. TRABAJADORES — contratar y despedir al cuerpo
     técnico. Cada mes se renuevan 2 candidatos por puesto (mismo momento
     que la nómina), con nivel y sueldo acordes; despedir deja el puesto
     vacante (sin sueldo) hasta contratar a alguien. ---------- */
  function abrirTrabajadores(){
    const overlay=document.createElement('div');
    overlay.id='lmTrabajadoresOverlay';
    document.getElementById('ligaManagerScreen').appendChild(overlay);

    function fichaTrabajadorHTML(rol){
      const actual=state.trabajadores[rol];
      const candidatos=(state.candidatosTrabajo||[]).filter(c=>c.rol===rol);
      return `
      <div class="lm-trab-rol">
        <div class="lm-trab-rol-titulo">${NOMBRE_ROL[rol]}</div>
        ${actual ? `
          <div class="lm-trab-card lm-trab-card-actual">
            <div class="lm-trab-card-top">
              <span class="lm-trab-nombre">${actual.nombre}</span>
              <span class="lm-trab-estrellas">${estrellasNivel(actual.nivel)}</span>
            </div>
            <div class="lm-trab-sueldo">${formatoDinero(actual.sueldo)}/mes</div>
            <button class="mode-card-btn mode-card-btn-secondary lm-trab-despedir" data-despedir="${rol}" style="padding:6px;font-size:10px;margin-top:6px">DESPEDIR</button>
          </div>` : `
          <div class="lm-trab-card lm-trab-card-vacante">
            <i class="ph ph-bold ph-user-circle-minus"></i>
            <span>Puesto vacante</span>
          </div>`}
        <div class="lm-trab-candidatos">
          ${candidatos.map(c=>`
            <div class="lm-trab-card">
              <div class="lm-trab-card-top">
                <span class="lm-trab-nombre">${c.nombre}</span>
                <span class="lm-trab-estrellas">${estrellasNivel(c.nivel)}</span>
              </div>
              <div class="lm-trab-sueldo">${formatoDinero(c.sueldo)}/mes</div>
              <button class="mode-card-btn mode-card-btn-gold lm-trab-contratar" data-contratar="${c.id}" data-rol="${rol}" style="padding:6px;font-size:10px;margin-top:6px">CONTRATAR</button>
            </div>`).join('') || '<p class="lm-setup-desc" style="text-align:center">Sin candidatos este mes</p>'}
        </div>
      </div>`;
    }

    function pintar(){
      overlay.innerHTML=`
        <div class="lm-dilemma-card" style="max-width:680px;text-align:left">
          <div class="lm-dilemma-title" style="text-align:center"><i class="ph ph-bold ph-users-three"></i> TRABAJADORES</div>
          <p class="lm-setup-desc" style="text-align:center;margin-bottom:10px">Cada mes aparecen nuevos candidatos por puesto — compara nivel y sueldo antes de decidir si te compensa un cambio.</p>
          <div class="lm-trab-grid">
            ${ROLES_TRABAJO.map(fichaTrabajadorHTML).join('')}
          </div>
          <div class="lm-popup-actions lm-popup-actions-compact">
            <button id="lmTrabajadoresCerrar" class="mode-card-btn mode-card-btn-gold">CERRAR</button>
          </div>
        </div>`;
      document.getElementById('lmTrabajadoresCerrar').addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        overlay.remove();
        render();
      });
      overlay.querySelectorAll('[data-despedir]').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const rol=btn.getAttribute('data-despedir');
          const actual=state.trabajadores[rol];
          const proceder=()=>{ despedirTrabajador(rol); pintar(); };
          if(typeof window.showConfirmPopup==='function'){
            window.showConfirmPopup(`¿Despedir a ${actual.nombre} (${NOMBRE_ROL[rol]})? El puesto quedará vacante hasta que contrates a otra persona.`, proceder, 'DESPEDIR');
          } else if(confirm(`¿Despedir a ${actual.nombre}?`)){
            proceder();
          }
        });
      });
      overlay.querySelectorAll('[data-contratar]').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const candidatoId=btn.getAttribute('data-contratar');
          const rol=btn.getAttribute('data-rol');
          if(typeof window.playSound==='function') window.playSound('select');
          contratarTrabajador(rol, candidatoId);
          pintar();
        });
      });
    }
    pintar();
  }

  /* ---------- 14. Inicialización ---------- */
  function init(){
    state=cargarEstado();
    setupStep=1;
    formacionCategoriaVista=null;
    seleccionJugador=null;
    render();
  }

  window.G2G_LigaManager={ init };

})();
