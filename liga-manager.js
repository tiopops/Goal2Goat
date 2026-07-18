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

  const SAVE_KEY = 'g2g_liga_manager_v07';
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
  function generarMiniPlantilla(){
    const NOMBRES=["Álvaro","Adrián","Hugo","Mario","Pablo","Marcos","Diego","Sergio","Iker","Nacho","Bruno","Izan","Rubén","Guillermo","Álex","Raúl"];
    const APELLIDOS=["García","Fernández","López","Martínez","Sánchez","Pérez","Gómez","Ruiz","Díaz","Moreno","Torres","Ramos","Molina","Ortega","Vázquez","Serrano"];
    const usados=new Set();
    function nombreUnico(){
      let nombre;
      do{ nombre=NOMBRES[Math.floor(Math.random()*NOMBRES.length)]+' '+APELLIDOS[Math.floor(Math.random()*APELLIDOS.length)]; }while(usados.has(nombre));
      usados.add(nombre);
      return nombre;
    }
    function nuevoJugador(id, position, esSuplente){
      const overall=48+Math.floor(Math.random()*18); // 48-65, coherente con "plantilla modesta, recién ascendido"
      const variar=()=>Math.max(30,Math.min(80, overall+Math.floor(Math.random()*11)-5));
      return {
        id, name:nombreUnico(), position, overall,
        attack:variar(), defense:variar(), pace:variar(), passing:variar(), technique:variar(),
        fatigue:100, racha:0, esSuplente:!!esSuplente,
        injured:false, injuryWeeks:0, injurySeverity:null
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

  // Posición genérica de una línea: primera línea tras el portero =
  // defensa (LI/LD en los extremos si hay 2+), última línea = ataque
  // (EI/ED en los extremos si hay 3+), líneas intermedias = mediocampo
  // (EI/ED en los extremos si la línea es ancha, 4+).
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
  function generarSlotsFormacion(code){
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
  function simularPartido(teamA, teamB){
    const statsA = teamA.id==='lm_0' ? calcularStatsEquipo() : {attack:teamA.attack,defense:teamA.defense,pace:teamA.pace,passing:teamA.passing,technique:teamA.technique};
    const statsB = teamB.id==='lm_0' ? calcularStatsEquipo() : {attack:teamB.attack,defense:teamB.defense,pace:teamB.pace,passing:teamB.passing,technique:teamB.technique};
    const mod=window.tacticalModifier(statsA,statsB);
    const lambdaA=Math.max(0.25, 1.15+mod.myScoreMod);
    const lambdaB=Math.max(0.25, 1.15+mod.oppScoreMod);
    const golesA=window.poissonSample(lambdaA);
    const golesB=window.poissonSample(lambdaB);
    return {golesA,golesB};
  }

  /* ---------- 5. Estado persistente (localStorage, prototipo) ---------- */
  let state=null;
  let setupStep=1;
  let formacionCategoriaVista=null; // categoría que se está viendo en el selector (no siempre coincide con la activa)
  let seleccionJugador=null; // id del jugador seleccionado en la plantilla/banquillo/campo, a la espera del segundo clic
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
    slots.forEach(def=>{
      const posGenerica=basePos(def.slot);
      const candidato=plantilla.find(p=>!usados.has(p.id) && p.position===posGenerica);
      if(candidato){ alineacion[def.slot]=candidato.id; usados.add(candidato.id); }
    });
    return alineacion;
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
      medicoHistorial:[]
    };
    state.medicoCartas = inicializarCartasMedico();
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

  function generarEventosPartido(resultado, miEsLocal){
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
    // después de la jornada — mismo espíritu que Copa Leyendas. El riesgo
    // base se ve reducido por los bonos acumulados del médico (cartas de
    // acumulación completadas + el efecto puntual de "Prevención Táctica").
    const bonos=state.medicoBonos||{};
    const riesgoBase=0.18*(bonos.riesgoLesionMultiplier||1)*(bonos.riesgoLesionSiguiente||1);
    if(bonos.riesgoLesionSiguiente){ state.medicoBonos.riesgoLesionSiguiente=1; } // se consume tras un partido
    if(!state.medicoNotificacion && Math.random()<riesgoBase){
      const idsAlineados=Object.values(state.alineacion||{}).filter(Boolean);
      const titularesSanos=idsAlineados.map(id=>state.plantilla.find(p=>p.id===id)).filter(p=>p && !p.injured);
      const pool = titularesSanos.length ? titularesSanos : state.plantilla.filter(p=>!p.injured);
      if(pool.length){
        const jugador=pool[Math.floor(Math.random()*pool.length)];
        const TIPOS_LESION={
          leve:['Sobrecarga muscular','Golpe en el tobillo','Molestias en el isquiotibial'],
          moderada:['Esguince de tobillo','Distensión muscular','Golpe en la rodilla'],
          grave:['Rotura de ligamentos','Rotura fibrilar','Lesión de menisco']
        };
        const severidades=[
          {label:'leve', weeks:1, dificultad:7},
          {label:'moderada', weeks:2, dificultad:10},
          {label:'grave', weeks:4, dificultad:13}
        ];
        const sev=severidades[Math.floor(Math.random()*severidades.length)];
        let weeks=Math.max(1, sev.weeks-(bonos.recuperacionExtra||0));
        if(sev.label==='grave' && bonos.graveMultiplier) weeks=Math.max(1, Math.round(weeks*bonos.graveMultiplier));
        const tipoLesion=TIPOS_LESION[sev.label][Math.floor(Math.random()*TIPOS_LESION[sev.label].length)];
        eventos.push({minute:20+Math.floor(Math.random()*65), team:misLado, type:'injury', jugador, sev:{...sev, weeks}, tipoLesion});
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

  function jugarJornada(){
    if(state.jornadaActual>38) return null;
    const j=state.jornadaActual-1;
    const jornada=state.calendario[j];
    let miPartidoInfo=null;
    jornada.forEach(partido=>{
      const key=j+'-'+partido.home.id+'-'+partido.away.id;
      if(state.resultados[key]) return;
      const resultado=simularPartido(partido.home, partido.away);
      state.resultados[key]=resultado;
      if(partido.home.id==='lm_0' || partido.away.id==='lm_0'){
        const eventos=generarEventosPartido(resultado, partido.home.id==='lm_0');
        // Aplicar la lesión generada (si la hay) al estado real del jugador
        const evInjury=eventos.find(e=>e.type==='injury');
        if(evInjury){
          evInjury.jugador.injured=true;
          evInjury.jugador.injuryWeeks=evInjury.sev.weeks;
          evInjury.jugador.injurySeverity=evInjury.sev.label;
          state.medicoNotificacion={jugadorId:evInjury.jugador.id, dificultad:evInjury.sev.dificultad, severidad:evInjury.sev.label};
          const rivalDeEsta = partido.home.id==='lm_0' ? partido.away.name : partido.home.name;
          evInjury.jugador.lesionLogId=registrarLesionHistorial(evInjury.jugador, evInjury.sev, evInjury.tipoLesion, rivalDeEsta);
        }
        miPartidoInfo={ home:partido.home, away:partido.away, resultado, eventos };
      }
    });

    // Fondo de dados: se resetea cada jornada — los que no se usaron en
    // la jornada anterior se pierden (use-it-or-lose-it, ya definido).
    state.diceAvailable = DICE_POOL_PER_MATCH;
    state.medicoCambioUsado = false;

    state.plantilla.forEach(p=>{
      if(p.injured && p.injuryWeeks>0){
        p.injuryWeeks--;
        if(p.injuryWeeks<=0){
          p.injured=false; p.injurySeverity=null;
          cerrarLesionHistorial(p, 'Tiempo natural');
        }
      }
    });

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
            ${miEsLocal?crestHTML(state.escudo,60):rivalCrestHTML(60, info.home.crestImg)}
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
            ${!miEsLocal?crestHTML(state.escudo,60):rivalCrestHTML(60, info.away.crestImg)}
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
  function registrarLesionHistorial(jugador, sev, tipoLesion, rival){
    state.medicoHistorial = state.medicoHistorial||[];
    const id = 'h'+Date.now()+Math.floor(Math.random()*1000);
    state.medicoHistorial.push({
      id, tipo:'lesion',
      jugador: jugador.name, jornadaInicio: state.jornadaActual, rival,
      severidad: sev.label, tipoLesion, semanasPrevistas: sev.weeks,
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
     10 cartas base. Dos tipos:
     - "directa": se resuelve al momento (dados sumados vs dificultad).
       Si falla, la carta se queda tal cual, se puede reintentar cuando
       se pueda. Si tiene éxito, se aplica el efecto y se cambia por una
       carta nueva al azar automáticamente.
     - "acumulacion": los dados invertidos SIEMPRE suman puntos a un
       proyecto (no hay fallo posible en la tirada en sí); tiene varios
       niveles con umbral creciente — completar por etapas sale más
       barato en total que si solo existiera un umbral alto directo.
       Al completar el último nivel, la carta queda agotada para
       siempre (no puede volver a salir) y se sustituye por una nueva.
     Puedes cambiar 1 carta (de las 3 en mano) por partido: se descarta
     y se reemplaza por otra al azar del resto del catálogo. ---------- */
  const MEDICO_CARTAS_BASE = [
    {id:'urgente',      tipo:'directa',     nombre:'Recuperación Exprés',      icon:'ph-first-aid-kit',    dificultad:8,  requiereLesion:true,  desc:'Reduce a la mitad el tiempo de recuperación de un jugador lesionado'},
    {id:'milagro',      tipo:'directa',     nombre:'Milagro de Vestuario',     icon:'ph-sparkle',          dificultad:15, requiereLesion:true,  desc:'Cura al instante cualquier lesión, sea cual sea su gravedad'},
    {id:'consulta',     tipo:'directa',     nombre:'Consulta Rápida',          icon:'ph-stethoscope',      dificultad:5,  requiereLesion:true,  desc:'Reduce en 1 semana el tiempo de recuperación'},
    {id:'cirugia',      tipo:'directa',     nombre:'Cirugía de Precisión',     icon:'ph-scissors',         dificultad:12, requiereLesion:'grave',desc:'Convierte una lesión grave en moderada'},
    {id:'prevencion_t', tipo:'directa',     nombre:'Prevención Táctica',       icon:'ph-shield-check',     dificultad:7,  requiereLesion:false, desc:'Reduce el riesgo de lesión en el próximo partido'},
    {id:'chequeo',      tipo:'directa',     nombre:'Chequeo de Plantilla',     icon:'ph-clipboard-text',   dificultad:6,  requiereLesion:false, desc:'Mejora la resistencia de toda la plantilla este partido'},
    {id:'sala_fisio',   tipo:'acumulacion', nombre:'Sala de Fisioterapia',     icon:'ph-buildings',        niveles:[8,12,16], desc:'Cada nivel reduce el tiempo base de recuperación de futuras lesiones'},
    {id:'prevencion_p', tipo:'acumulacion', nombre:'Programa de Prevención',   icon:'ph-heartbeat',        niveles:[10,14],   desc:'Cada nivel reduce el riesgo base de lesión de la plantilla'},
    {id:'especialista', tipo:'acumulacion', nombre:'Especialista en Readaptación', icon:'ph-user-focus',   niveles:[20],      desc:'Reduce a la mitad el tiempo de las lesiones graves para siempre'},
    {id:'equipo_fisios',tipo:'acumulacion', nombre:'Equipo de Fisios',         icon:'ph-users-three',      niveles:[6,10,14], desc:'Cada nivel acelera la recuperación general de toda la plantilla'}
  ];

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
  function aplicarEfectoDirecta(def, jugadorObjetivo){
    switch(def.id){
      case 'urgente':
        if(jugadorObjetivo){
          jugadorObjetivo.injuryWeeks=Math.max(0,Math.ceil(jugadorObjetivo.injuryWeeks/2));
          if(jugadorObjetivo.injuryWeeks<=0){ jugadorObjetivo.injured=false; jugadorObjetivo.injurySeverity=null; cerrarLesionHistorial(jugadorObjetivo, 'Carta: '+def.nombre); }
        }
        return jugadorObjetivo?`${jugadorObjetivo.name} recorta a la mitad su tiempo de baja`:'Aplicado';
      case 'milagro':
        if(jugadorObjetivo){ jugadorObjetivo.injured=false; jugadorObjetivo.injuryWeeks=0; jugadorObjetivo.injurySeverity=null; cerrarLesionHistorial(jugadorObjetivo, 'Carta: '+def.nombre); }
        return jugadorObjetivo?`${jugadorObjetivo.name} recupera la disponibilidad al instante`:'Aplicado';
      case 'consulta':
        if(jugadorObjetivo){
          jugadorObjetivo.injuryWeeks=Math.max(0,jugadorObjetivo.injuryWeeks-1);
          if(jugadorObjetivo.injuryWeeks<=0){ jugadorObjetivo.injured=false; jugadorObjetivo.injurySeverity=null; cerrarLesionHistorial(jugadorObjetivo, 'Carta: '+def.nombre); }
        }
        return jugadorObjetivo?`${jugadorObjetivo.name} se recupera 1 semana antes`:'Aplicado';
      case 'cirugia':
        if(jugadorObjetivo){ jugadorObjetivo.injurySeverity='moderada'; jugadorObjetivo.injuryWeeks=Math.min(jugadorObjetivo.injuryWeeks,2); }
        return jugadorObjetivo?`La lesión de ${jugadorObjetivo.name} pasa a moderada`:'Aplicado';
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
        // Si ya hay una identidad (nombre+escudo) guardada de antes, no se
        // vuelve a pedir — se salta directo a la pantalla de confirmación.
        const identidad=cargarIdentidad();
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

    const clasif=calcularClasificacion();
    const j=state.jornadaActual-1;
    const proximaJornada= j<38 ? state.calendario[j] : null;
    const miPartido= proximaJornada ? proximaJornada.find(p=>p.home.id==='lm_0'||p.away.id==='lm_0') : null;
    const rival= miPartido ? (miPartido.home.id==='lm_0' ? miPartido.away : miPartido.home) : null;
    const esLocal= miPartido ? miPartido.home.id==='lm_0' : null;
    const notif=state.medicoNotificacion;
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
      return `<tr data-pid="${p.id}" class="${claseFila}">
        <td>${p.name}${cross}${racha}</td>
        <td>${fatigueBarHTML(p)}</td>
        <td>${p.position}${star}</td>
        <td>${p.attack}</td><td>${p.defense}</td><td>${p.pace}</td><td>${p.passing}</td><td>${p.technique}</td>
        <td><strong>${p.overall}</strong></td>
      </tr>`;
    }
    const titularIds=new Set(Object.values(state.alineacion||{}).filter(Boolean));
    const plantillaPrincipal=state.plantilla.filter(p=>!p.esSuplente);
    const banquillo=state.plantilla.filter(p=>p.esSuplente);
    const filasPlantilla=plantillaPrincipal.map(filaJugador).join('');
    const filasBanquillo=banquillo.map(filaJugador).join('');

    root.innerHTML = `
      <div class="lm-app-grid">
        <div class="lm-panel lm-left-panel">
          <div class="lm-header-team">
            ${crestHTML(state.escudo, 60)}
            <div>
              <div class="lm-title">${state.nombreEquipo.toUpperCase()}</div>
              <div class="lm-sub">Jornada ${Math.min(state.jornadaActual,38)} de 38 · ${monedaInfo.symbol}</div>
            </div>
          </div>
          <div class="bench-title"><span>PLANTILLA</span><span>${plantillaPrincipal.length}</span></div>
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

          <div class="bench-title"><span>FORMACIÓN</span><span>${state.formacionCode}</span></div>
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

        <div class="lm-center-panel">
          <div id="lmPitchBox">${PITCH_SVG}${formacionActual().slots.map(def=>{
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
              inner=`${statusIcons}<span class="pos-rating">${jugador.overall}</span><div class="player-info">${jugador.name}${star}<div class="player-pos-label${inPos?'':' out-of-position'}">${label}</div></div>`;
            }
            const clases=['position', vacio?'empty-slot':'locked', lesionado?'lm-pos-injured':'', seleccionado?'highlight-pos':''].filter(Boolean).join(' ');
            return `<div class="${clases}" data-slot="${def.slot}" style="left:${def.x}%;top:${def.y}%" title="${jugador?jugador.name+' ('+jugador.overall+')':'Vacío'}">${inner}</div>`;
          }).join('')}</div>
          <p class="lm-pitch-caption">Toca una posición para asignar o cambiar jugador. Puedes cambiar de formación antes de cada partido.</p>

          <div class="lm-match-actions">
            <button id="lmJugarBtn" class="lm-btn-jugar" ${state.jornadaActual>38?'disabled':''}>
              ${state.jornadaActual>38?'TEMPORADA COMPLETA':'JUGAR JORNADA'}
            </button>
            <button id="lmAbandonarBtn" class="lm-btn-abandonar">ABANDONAR LIGA</button>
            <button id="ligaManagerBackBtn" class="lm-btn-volver">VOLVER AL MENÚ</button>
          </div>
        </div>

        <div class="lm-panel lm-right-panel">
          <div class="lm-nextmatch-box">
            ${rival ? `
              <div class="lm-vs-label" style="text-align:center;margin-bottom:6px">${esLocal?'JUEGAS EN CASA':'JUEGAS FUERA'}</div>
              <div class="lm-header-team-rival" style="justify-content:center;gap:10px">
                ${rivalCrestHTML(52, rival.crestImg)}<span class="lm-title" style="font-size:15px">${rival.name}</span>
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
      </div>

      <div class="lm-staffrow">
        <div class="lm-staff-card ${notif?'has-notif':''}" id="lmMedicoBtn" title="Es el encargado de prevenir, diagnosticar y tratar lesiones de tus jugadores">
          ${notif?'<span class="lm-staff-badge">1</span>':''}
          <button class="lm-staff-info-bubble" id="lmMedicoInfoBtn" title="Historial médico">i</button>
          <div class="lm-staff-photo-wrap">
            <img src="assets/equipo_tecnico/medico/novato.png" alt="Médico" class="lm-staff-photo-img" onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex';">
            <div class="lm-staff-photo-fallback" style="display:none"><i class="ph ph-bold ph-first-aid-kit"></i></div>
          </div>
          <span class="lm-staff-card-name">MÉDICO</span>
        </div>
      </div>
    `;

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
    const clasifHeader=document.getElementById('lmClasifHeader');
    if(clasifHeader) clasifHeader.addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      clasifColapsada=!clasifColapsada;
      render();
    });
    const medicoBtn=document.getElementById('lmMedicoBtn');
    if(medicoBtn) medicoBtn.addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      abrirMedico();
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
  function abrirHistorialMedico(){
    const overlay=document.createElement('div');
    overlay.id='lmHistorialOverlay';
    const historial=(state.medicoHistorial||[]).slice().reverse(); // más reciente primero

    const filas=historial.map(h=>{
      if(h.tipo==='progreso'){
        return `<div class="lm-hist-item lm-hist-progreso">
          <i class="ph ph-bold ph-trend-up"></i>
          <div>
            <div class="lm-hist-title">${h.texto}</div>
            <div class="lm-hist-meta">Jornada ${h.jornada}</div>
          </div>
        </div>`;
      }
      const estado = h.resuelta
        ? `Se recuperó gracias a <strong>${h.resueltoPor}</strong> — estuvo ${h.jornadasReales} jornada${h.jornadasReales===1?'':'s'} sin jugar`
        : `<span style="color:#e24b4a">Todavía de baja</span> (previsto ${h.semanasPrevistas} jornada${h.semanasPrevistas===1?'':'s'})`;
      return `<div class="lm-hist-item">
        <i class="ph ph-bold ph-first-aid-kit" style="color:${h.resuelta?'#5dcaa5':'#e24b4a'}"></i>
        <div>
          <div class="lm-hist-title">${h.jugador} — ${h.tipoLesion} <span class="lm-hist-tag">${h.severidad}</span></div>
          <div class="lm-hist-meta">Jornada ${h.jornadaInicio} contra ${h.rival}</div>
          <div class="lm-hist-desc">${estado}</div>
        </div>
      </div>`;
    }).join('');

    overlay.innerHTML=`
      <div class="lm-dilemma-card" style="max-width:480px;text-align:left">
        <div class="lm-dilemma-title" style="text-align:center"><i class="ph ph-bold ph-clock-counter-clockwise"></i> HISTORIAL MÉDICO</div>
        <div class="lm-hist-list">
          ${historial.length?filas:'<p class="lm-setup-desc" style="text-align:center">Todavía no hay nada que contar — de momento tu plantilla está sana.</p>'}
        </div>
        <div class="lm-popup-actions lm-popup-actions-compact">
          <button id="lmHistorialCerrar" class="mode-card-btn mode-card-btn-gold">CERRAR</button>
        </div>
      </div>`;
    document.getElementById('ligaManagerScreen').appendChild(overlay);
    document.getElementById('lmHistorialCerrar').addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      overlay.remove();
    });
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
        const maxPosible = state.diceAvailable*6;
        const imposiblePorDados = def.tipo==='directa' && maxPosible < def.dificultad;
        const bloqueada = sinLesionNecesaria || imposiblePorDados;
        const cambioDisponible=!state.medicoCambioUsado;
        let cuerpo;
        if(def.tipo==='acumulacion'){
          const umbral=def.niveles[instancia.nivelActual-1];
          cuerpo=`<div class="med-card-progress"><div class="med-card-progress-fill" style="width:${Math.min(100,100*instancia.progreso/umbral)}%"></div></div>
                  <div class="med-card-progress-label">Nivel ${instancia.nivelActual}/${def.niveles.length} — ${instancia.progreso}/${umbral}</div>`;
        } else {
          cuerpo=`<div class="med-card-dificultad">Dificultad ${def.dificultad}+</div>`;
        }
        return `
        <div class="med-card ${bloqueada?'med-card-bloqueada':''}" data-idx="${idx}">
          <button class="med-card-swap" data-swap="${idx}" title="Cambiar carta" ${cambioDisponible?'':'disabled'}><i class="ph ph-bold ph-arrows-clockwise"></i></button>
          <div class="med-card-tag">${def.tipo==='acumulacion'?'PROYECTO':'MISIÓN'}</div>
          <i class="ph ph-bold ${def.icon} med-card-icon"></i>
          <div class="med-card-title">${def.nombre}</div>
          <div class="med-card-divider"></div>
          <div class="med-card-desc">${def.desc}</div>
          ${cuerpo}
          ${bloqueada?`<div class="med-card-bloqueada-label">${sinLesionNecesaria?'Necesitas una lesión activa':'Imposible con los dados que quedan'}</div>`:`<button class="mode-card-btn mode-card-btn-gold med-card-btn" data-usar="${idx}" style="padding:7px;font-size:11px">USAR</button>`}
        </div>`;
      }).join('');

      overlay.innerHTML=`
        <div class="lm-dilemma-card" style="max-width:640px">
          <div class="lm-dilemma-title"><i class="ph ph-bold ph-first-aid-kit"></i> EQUIPO MÉDICO</div>
          ${notif?`
          <div class="lm-dilemma-text" style="background:#2a1e1e;border:1px solid #e24b4a;border-radius:8px;padding:10px;margin-bottom:14px">
            <strong style="color:#e24b4a">URGENTE:</strong> ${jugadorUrgente?jugadorUrgente.name:'Un jugador'} tiene una lesión ${notif.severidad}.
            <button id="lmAtenderUrgente" class="mode-card-btn mode-card-btn-gold" style="width:auto;padding:7px 16px;margin-top:8px;display:block">ATENDER (sumar ${notif.dificultad}+)</button>
          </div>` : ''}
          <div class="lm-setup-desc" style="text-align:center;margin-bottom:8px">dados disponibles este partido: ${state.diceAvailable} · puedes cambiar 1 carta por partido</div>
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
          if(typeof window.playSound==='function') window.playSound('select');
          if(cambiarCartaMedico(idx)) renderHub();
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
        <div class="lm-dilemma-card">
          <div class="lm-dilemma-title">¿SOBRE QUIÉN?</div>
          <div class="lm-slot-list">
            ${candidatos.map(p=>`<div class="lm-slot-option" data-pid="${p.id}"><span>${p.name}</span><span style="color:#e24b4a">${p.injurySeverity}</span></div>`).join('')}
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
      let dadosElegidos=Math.min(1, state.diceAvailable);
      function pintar(){
        overlay.innerHTML=`
          <div class="lm-dilemma-card">
            <i class="ph ph-bold ${def.icon}" style="font-size:26px;color:#5dcaa5"></i>
            <div class="lm-dilemma-title">${def.nombre.toUpperCase()}</div>
            <div class="lm-dilemma-text">${def.desc}${def.tipo==='directa'?` — necesitas sumar ${def.dificultad}+`:' — los dados invertidos siempre suman al proyecto'}</div>
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

    function renderRolloCarta(idx, numDados, jugadorObjetivoId){
      overlay.innerHTML=`
        <div class="lm-dilemma-card">
          <div class="lm-dilemma-title" id="lmDiceTitle">TIRANDO ${numDados} DADO${numDados>1?'S':''}...</div>
          <div id="lmDice3DBox" class="lm-dice3d-box"></div>
          <div id="lmDiceResultZone"></div>
        </div>`;
      if(typeof window.playSound==='function') window.playSound('dice');
      const box=document.getElementById('lmDice3DBox');
      function conResultado(tiradas){
        state.diceAvailable=Math.max(0, state.diceAvailable-numDados);
        const r=resolverCartaMedico(idx, tiradas, jugadorObjetivoId);
        const tituloEl=document.getElementById('lmDiceTitle');
        if(tituloEl) tituloEl.textContent='RESULTADO';
        const zona=document.getElementById('lmDiceResultZone');
        let textoResultado;
        if(r.tipo==='directa'){
          textoResultado=`Suma <strong>${r.suma}</strong> (necesitabas ${r.dificultad}+) — <span style="color:${r.exito?'#5dcaa5':'#e24b4a'}">${r.exito?'✔ ÉXITO — '+r.texto:'✘ FALLO — '+r.texto}</span>`;
        } else {
          textoResultado = r.completada
            ? `+${r.suma} puntos — <span style="color:#5dcaa5">✔ PROYECTO COMPLETADO</span>`
            : (r.subioNivel
              ? `+${r.suma} puntos — <span style="color:#5dcaa5">¡Nivel superado!</span> Ahora nivel ${r.nivelActual} (${r.progreso}/${r.umbral})`
              : `+${r.suma} puntos — progreso ${r.progreso}/${r.umbral}`);
        }
        zona.innerHTML=`
          <div class="lm-dice-result-row">${tiradas.map(v=>`<span class="lm-dice-pill">${v}</span>`).join('')}</div>
          <div style="font-family:'Bebas Neue';font-size:15px;margin-top:10px;line-height:1.4">${textoResultado}</div>
          <div class="lm-popup-actions"><button id="lmContinuarBtn" class="mode-card-btn mode-card-btn-gold">CONTINUAR</button></div>`;
        document.getElementById('lmContinuarBtn').addEventListener('click', ()=>{
          if(typeof window.playSound==='function') window.playSound('select');
          renderHub();
        });
      }
      if(typeof window.G2G_rollDice3D === 'function'){
        window.G2G_rollDice3D(box, numDados, conResultado);
      } else {
        const tiradas=[]; for(let i=0;i<numDados;i++) tiradas.push(1+Math.floor(Math.random()*6));
        setTimeout(()=>conResultado(tiradas), 800);
      }
    }

    // ---- Flujo de la notificación urgente (lesión recién ocurrida) ----
    function renderSelectorUrgente(){
      const jugador=state.plantilla.find(p=>p.id===state.medicoNotificacion.jugadorId);
      const dificultad=state.medicoNotificacion.dificultad;
      let dadosElegidos=Math.min(1, state.diceAvailable);
      function pintar(){
        overlay.innerHTML=`
          <div class="lm-dilemma-card">
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
        <div class="lm-dilemma-card">
          <div class="lm-dilemma-title" id="lmDiceTitle">TIRANDO ${numDados} DADO${numDados>1?'S':''}...</div>
          <div id="lmDice3DBox" class="lm-dice3d-box"></div>
          <div id="lmDiceResultZone"></div>
        </div>`;
      if(typeof window.playSound==='function') window.playSound('dice');
      const box=document.getElementById('lmDice3DBox');
      function conResultado(tiradas){
        const r=resolverDilemaMedico(numDados, tiradas);
        const tituloEl=document.getElementById('lmDiceTitle');
        if(tituloEl) tituloEl.textContent='RESULTADO';
        const zona=document.getElementById('lmDiceResultZone');
        zona.innerHTML=`
          <div class="lm-dice-result-row">${tiradas.map(v=>`<span class="lm-dice-pill">${v}</span>`).join('')}</div>
          <div style="font-family:'Bebas Neue';font-size:16px;margin-top:10px">
            Suma <strong>${r.suma}</strong> (necesitabas ${r.dificultad}+) —
            <span style="color:${r.exito?'#5dcaa5':'#e24b4a'}">${r.exito?'✔ ÉXITO, recuperación acelerada':'✘ FALLO, sigue el tiempo previsto'}</span>
          </div>
          <div class="lm-popup-actions"><button id="lmContinuarBtn" class="mode-card-btn mode-card-btn-gold">CONTINUAR</button></div>`;
        document.getElementById('lmContinuarBtn').addEventListener('click', ()=>{
          if(typeof window.playSound==='function') window.playSound('select');
          renderHub();
          render();
        });
      }
      if(typeof window.G2G_rollDice3D === 'function'){
        window.G2G_rollDice3D(box, numDados, conResultado);
      } else {
        const tiradas=[]; for(let i=0;i<numDados;i++) tiradas.push(1+Math.floor(Math.random()*6));
        setTimeout(()=>conResultado(tiradas), 800);
      }
    }

    renderHub();
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
