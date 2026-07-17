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

  const SAVE_KEY = 'g2g_liga_manager_v05';
  // Identidad del club (nombre + escudo) — PERSISTE entre partidas, no se
  // pierde al abandonar/descender. Si ya existe, el flujo de entrada no
  // vuelve a pedir nombre ni escudo (solo liga y moneda cada vez).
  const IDENTITY_KEY = 'g2g_liga_manager_identity';
  const DICE_POOL_PER_MATCH = 3;

  /* ---------- 1. Equipos rivales — La Liga 2026-27 real, 19 clubes ---------- */
  const LM_RIVALS = [
    {id:'lm_1',  name:'Real Madrid',          attack:88, defense:85, pace:82, passing:88, technique:89},
    {id:'lm_2',  name:'FC Barcelona',         attack:87, defense:83, pace:84, passing:89, technique:90},
    {id:'lm_3',  name:'Atlético de Madrid',   attack:84, defense:86, pace:80, passing:82, technique:81},
    {id:'lm_4',  name:'Athletic Club',        attack:78, defense:77, pace:76, passing:78, technique:77},
    {id:'lm_5',  name:'Villarreal CF',        attack:79, defense:76, pace:75, passing:80, technique:79},
    {id:'lm_6',  name:'Real Betis',           attack:77, defense:74, pace:74, passing:78, technique:77},
    {id:'lm_7',  name:'Real Sociedad',        attack:76, defense:75, pace:74, passing:77, technique:76},
    {id:'lm_8',  name:'Sevilla FC',           attack:74, defense:73, pace:72, passing:75, technique:74},
    {id:'lm_9',  name:'RC Celta',             attack:72, defense:70, pace:73, passing:74, technique:73},
    {id:'lm_10', name:'Valencia CF',          attack:71, defense:72, pace:70, passing:71, technique:71},
    {id:'lm_11', name:'Rayo Vallecano',       attack:69, defense:70, pace:68, passing:68, technique:67},
    {id:'lm_12', name:'CA Osasuna',           attack:68, defense:71, pace:67, passing:66, technique:65},
    {id:'lm_13', name:'Getafe CF',            attack:66, defense:72, pace:65, passing:62, technique:61},
    {id:'lm_14', name:'RCD Espanyol',         attack:65, defense:66, pace:66, passing:64, technique:64},
    {id:'lm_15', name:'Elche CF',             attack:62, defense:63, pace:61, passing:61, technique:60},
    {id:'lm_16', name:'Levante UD',           attack:61, defense:62, pace:60, passing:60, technique:59},
    {id:'lm_17', name:'Deportivo Alavés',     attack:64, defense:68, pace:63, passing:62, technique:61},
    {id:'lm_18', name:'Racing de Santander',  attack:60, defense:61, pace:60, passing:59, technique:58},
    {id:'lm_19', name:'RC Deportivo',         attack:61, defense:60, pace:61, passing:60, technique:60}
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
    const NOMBRES=["Álvaro","Adrián","Hugo","Mario","Pablo","Marcos","Diego","Sergio","Iker","Nacho","Bruno","Izan"];
    const APELLIDOS=["García","Fernández","López","Martínez","Sánchez","Pérez","Gómez","Ruiz","Díaz","Moreno","Torres","Ramos"];
    const POSICIONES=["POR","DFC","DFC","LI","LD","MC","MC","EI","ED","DC","DC","MC"];
    const usados=new Set();
    const plantilla=[];
    for(let i=0;i<12;i++){
      let nombre;
      do{ nombre=NOMBRES[Math.floor(Math.random()*NOMBRES.length)]+' '+APELLIDOS[Math.floor(Math.random()*APELLIDOS.length)]; }while(usados.has(nombre));
      usados.add(nombre);
      const overall=48+Math.floor(Math.random()*18); // 48-65, coherente con "plantilla modesta, recién ascendido"
      const variar=()=>Math.max(30,Math.min(80, overall+Math.floor(Math.random()*11)-5));
      plantilla.push({
        id:'p'+i, name:nombre, position:POSICIONES[i], overall,
        attack:variar(), defense:variar(), pace:variar(), passing:variar(), technique:variar(),
        racha:0,
        injured:false, injuryWeeks:0, injurySeverity:null
      });
    }
    return plantilla;
  }

  /* ---------- 3b. Formación fija 4-3-3 — coordenadas en % sobre el mismo
     campo (480×640) que Copa Leyendas, para poder posicionar los slots
     con position:absolute dentro de #lmPitchBox. ---------- */
  const FORMACION_433 = [
    {slot:'POR', x:50,   y:90.6},
    {slot:'DFC1',x:29.2, y:75},
    {slot:'DFC2',x:70.8, y:75},
    {slot:'LI',  x:12.5, y:71.9},
    {slot:'LD',  x:87.5, y:71.9},
    {slot:'MC1', x:33.3, y:53.1},
    {slot:'MC2', x:50,   y:48.4},
    {slot:'MC3', x:66.7, y:53.1},
    {slot:'EI',  x:16.7, y:28.1},
    {slot:'DC',  x:50,   y:21.9},
    {slot:'ED',  x:83.3, y:28.1}
  ];

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
  let setupData={liga:'es', moneda:null, nombre:'', escudo:null};

  function nuevoEstadoSinEmpezar(){ return { setupComplete:false }; }

  // Alineación automática de partida: coloca a cada jugador generado en
  // el primer hueco de su posición natural — así el equipo no arranca
  // con el campo vacío, aunque luego se pueda cambiar a mano.
  function alineacionAutomatica(plantilla){
    const mapaPos={POR:['POR'],DFC1:['DFC'],DFC2:['DFC'],LI:['LI'],LD:['LD'],MC1:['MC'],MC2:['MC'],MC3:['MC'],EI:['EI'],ED:['ED'],DC:['DC']};
    const usados=new Set();
    const alineacion={};
    FORMACION_433.forEach(def=>{
      const candidato=plantilla.find(p=>!usados.has(p.id) && mapaPos[def.slot].includes(p.position));
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
      alineacion:alineacionAutomatica(plantilla),
      medicoNotificacion:null,
      diceAvailable:DICE_POOL_PER_MATCH
    };
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
  function rivalCrestHTML(sizePx){
    sizePx=sizePx||28;
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
    teams.forEach(t=>{ tabla[t.id]={id:t.id,name:t.name,pj:0,pg:0,pe:0,pp:0,gf:0,gc:0,pts:0}; });
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

  function generarEventosPartido(resultado){
    const eventos=[];
    for(let i=0;i<resultado.golesA;i++){
      const goleador=elegirGoleador();
      eventos.push({minute:5+Math.floor(Math.random()*85), team:'home', type:'goal', jugador:goleador});
    }
    for(let i=0;i<resultado.golesB;i++){
      eventos.push({minute:5+Math.floor(Math.random()*85), team:'away', type:'goal'});
    }
    // Lesión: puede pasar DURANTE tu propio partido, no como aviso aparte
    // después de la jornada — mismo espíritu que Copa Leyendas.
    if(!state.medicoNotificacion && Math.random()<0.18){
      const idsAlineados=Object.values(state.alineacion||{}).filter(Boolean);
      const titularesSanos=idsAlineados.map(id=>state.plantilla.find(p=>p.id===id)).filter(p=>p && !p.injured);
      const pool = titularesSanos.length ? titularesSanos : state.plantilla.filter(p=>!p.injured);
      if(pool.length){
        const jugador=pool[Math.floor(Math.random()*pool.length)];
        const severidades=[
          {label:'leve', weeks:1, dificultad:7},
          {label:'moderada', weeks:2, dificultad:10},
          {label:'grave', weeks:4, dificultad:13}
        ];
        const sev=severidades[Math.floor(Math.random()*severidades.length)];
        eventos.push({minute:20+Math.floor(Math.random()*65), team:'home', type:'injury', jugador, sev});
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
        const eventos=generarEventosPartido(resultado);
        // Aplicar la lesión generada (si la hay) al estado real del jugador
        const evInjury=eventos.find(e=>e.type==='injury');
        if(evInjury){
          evInjury.jugador.injured=true;
          evInjury.jugador.injuryWeeks=evInjury.sev.weeks;
          evInjury.jugador.injurySeverity=evInjury.sev.label;
          state.medicoNotificacion={jugadorId:evInjury.jugador.id, dificultad:evInjury.sev.dificultad, severidad:evInjury.sev.label};
        }
        miPartidoInfo={ home:partido.home, away:partido.away, resultado, eventos };
      }
    });

    // Fondo de dados: se resetea cada jornada — los que no se usaron en
    // la jornada anterior se pierden (use-it-or-lose-it, ya definido).
    state.diceAvailable = DICE_POOL_PER_MATCH;

    state.plantilla.forEach(p=>{
      if(p.injured && p.injuryWeeks>0){
        p.injuryWeeks--;
        if(p.injuryWeeks<=0){ p.injured=false; p.injurySeverity=null; }
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
            ${crestHTML(miEsLocal?state.escudo:null,48)}
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
            ${crestHTML(!miEsLocal?state.escudo:null,48)}
            <span class="match-team-name">${info.away.name}</span>
          </div>
        </div>
        <div id="lmLiveEvents" style="flex:1;overflow-y:auto;display:flex;flex-direction:column;align-items:stretch;gap:2px;padding:4px 0;min-height:80px;max-height:260px"></div>
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

    function addEvt(icon,text,minLabel,esLocal){
      const item=document.createElement('div');
      item.style.cssText='display:grid;grid-template-columns:1fr 44px 1fr;align-items:center;width:100%;font-size:12px;animation:slideInEvent .3s ease;opacity:0;animation-fill-mode:forwards;padding:3px 0;border-bottom:1px solid rgba(0,0,0,.05)';
      const center=`<span style="font-family:'Bebas Neue',Impact,sans-serif;font-size:15px;color:#aaa;text-align:center;display:block;letter-spacing:.5px">${minLabel}</span>`;
      if(esLocal){
        item.innerHTML=`<span style="text-align:right;padding-right:6px;color:var(--accent);line-height:1.3">${text} <span style="font-size:14px">${icon}</span></span>${center}<span></span>`;
      }else{
        item.innerHTML=`<span></span>${center}<span style="text-align:left;padding-left:6px;color:var(--red);line-height:1.3"><span style="font-size:14px">${icon}</span> ${text}</span>`;
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
          addEvt('✚', `<strong>${ev.jugador.name}</strong> <span style="font-size:10px;color:#e74c3c">(lesión ${ev.sev.label})</span>`, ev.minute+"'", true);
        }
      }

      if(frac<1){ requestAnimationFrame(tick); }
      else{
        clockEl.textContent='FIN';
        halfEl.textContent='FINAL';
        halfEl.style.background='#555';
        fillEl.style.width='100%';
        if(typeof window.playSound==='function') window.playSound('whistle');
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
  function resolverDilemaMedico(numDados, tiradas){
    if(!state.medicoNotificacion) return null;
    const suma = tiradas.reduce((a,b)=>a+b,0);
    const exito = suma >= state.medicoNotificacion.dificultad;
    if(exito){
      const jugador=state.plantilla.find(p=>p.id===state.medicoNotificacion.jugadorId);
      if(jugador){ jugador.injuryWeeks=Math.max(0, jugador.injuryWeeks-1); if(jugador.injuryWeeks<=0){ jugador.injured=false; jugador.injurySeverity=null; } }
    }
    state.diceAvailable = Math.max(0, state.diceAvailable - numDados);
    const resultado={tiradas, suma, dificultad:state.medicoNotificacion.dificultad, exito};
    state.medicoNotificacion=null;
    guardarEstado();
    return resultado;
  }

  /* ---------- 10. Abandonar la liga ---------- */
  function abandonarLiga(){
    const ok=confirm('¿Seguro que quieres abandonar la liga? Se perderá todo el progreso de esta temporada y empezarás una partida nueva.');
    if(!ok) return;
    borrarEstado();
    state=nuevoEstadoSinEmpezar();
    setupStep=1;
    setupData={liga:'es', moneda:null, nombre:'', escudo:null};
    render();
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
        <button id="lmSetupNext" class="mode-card-btn mode-card-btn-gold" style="width:auto;padding:10px 26px;margin-top:20px;">SIGUIENTE</button>
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
        <button id="lmSetupNext" class="mode-card-btn mode-card-btn-gold" style="width:auto;padding:10px 26px;margin-top:20px;" ${setupData.moneda?'':'disabled'}>SIGUIENTE</button>
      `;
    } else if(setupStep===3.5){
      inner=`
        <div class="lm-setup-title">TU CLUB YA ESTÁ CREADO</div>
        <p class="lm-setup-desc">Encontramos un equipo guardado de una partida anterior. Puedes usarlo tal cual o cambiar nombre/escudo.</p>
        <div class="lm-crest-preview">${crestHTML(setupData.escudo, 64)}</div>
        <div class="lm-setup-title" style="font-size:16px;margin:6px 0 22px">${setupData.nombre}</div>
        <button id="lmSetupConfirm" class="mode-card-btn mode-card-btn-gold" style="width:auto;padding:10px 26px;">EMPEZAR TEMPORADA</button>
        <div style="margin-top:12px">
          <button id="lmSetupCambiar" class="mode-card-btn mode-card-btn-disabled" style="width:auto;padding:8px 18px;font-size:13px">CAMBIAR NOMBRE/ESCUDO</button>
        </div>
      `;
    } else if(setupStep===3){
      inner=`
        <div class="lm-setup-title">NOMBRE DE TU EQUIPO</div>
        <p class="lm-setup-desc">Este será tu club, recién ascendido a Primera. El resto de la liga son los 19 equipos reales de La Liga.</p>
        <input id="lmSetupNombre" type="text" maxlength="24" placeholder="Ej: CF Ejemplo" class="lm-setup-input" value="${setupData.nombre||''}">
        <button id="lmSetupNext" class="mode-card-btn mode-card-btn-gold" style="width:auto;padding:10px 26px;margin-top:20px;" ${setupData.nombre&&setupData.nombre.trim()?'':'disabled'}>SIGUIENTE</button>
      `;
    } else if(setupStep===4){
      inner=`
        <div class="lm-setup-title">CREA TU ESCUDO</div>
        <p class="lm-setup-desc">Se abre el mismo editor de escudos de Copa Leyendas (por capas o subiendo una imagen) — solo que esto se guarda aparte, como identidad de Liga Manager.</p>
        <div class="lm-crest-preview">${crestHTML(setupData.escudo, 64)}</div>
        <button id="lmAbrirEditorBtn" class="mode-card-btn mode-card-btn-gold" style="width:auto;padding:10px 24px;">ABRIR EDITOR DE ESCUDOS</button>
        <div style="margin-top:16px">
          <button id="lmSetupConfirm" class="mode-card-btn mode-card-btn-gold" style="width:auto;padding:10px 26px;" ${setupData.escudo?'':'disabled'}>EMPEZAR TEMPORADA</button>
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

    const clasif=calcularClasificacion();
    const j=state.jornadaActual-1;
    const proximaJornada= j<38 ? state.calendario[j] : null;
    const miPartido= proximaJornada ? proximaJornada.find(p=>p.home.id==='lm_0'||p.away.id==='lm_0') : null;
    const rival= miPartido ? (miPartido.home.id==='lm_0' ? miPartido.away : miPartido.home) : null;
    const esLocal= miPartido ? miPartido.home.id==='lm_0' : null;
    const notif=state.medicoNotificacion;
    const monedaInfo=MONEDAS[state.moneda]||MONEDAS.EUR;

    root.innerHTML = `
      <div class="lm-wrap">
        <div class="lm-header">
          <div class="lm-header-team">
            ${crestHTML(state.escudo, 36)}
            <div>
              <div class="lm-title">${state.nombreEquipo.toUpperCase()}</div>
              <div class="lm-sub">Jornada ${Math.min(state.jornadaActual,38)} de 38 · ${monedaInfo.symbol}</div>
            </div>
          </div>
          ${rival ? `
          <div class="lm-header-vs">
            <span class="lm-vs-label">${esLocal?'LOCAL vs':'FUERA en'}</span>
          </div>
          <div class="lm-header-team lm-header-team-rival">
            <div style="text-align:right">
              <div class="lm-title" style="font-size:16px">${rival.name.toUpperCase()}</div>
              <div class="lm-sub">Próximo rival</div>
            </div>
            ${rivalCrestHTML(36)}
          </div>` : `<div class="lm-header-vs"><span class="lm-vs-label">Temporada finalizada</span></div>`}
        </div>

        <div class="lm-actionsrow">
          <button id="lmJugarBtn" class="mode-card-btn mode-card-btn-gold" ${state.jornadaActual>38?'disabled':''} style="width:auto;padding:10px 22px;">
            ${state.jornadaActual>38?'TEMPORADA COMPLETA':'JUGAR JORNADA'}
          </button>
          <button id="lmPlantillaBtn" class="mode-card-btn mode-card-btn-disabled" style="width:auto;padding:10px 16px;">PLANTILLA</button>
          <button id="lmAbandonarBtn" class="mode-card-btn mode-card-btn-disabled" style="width:auto;padding:10px 16px;">ABANDONAR LIGA</button>
          <button id="ligaManagerBackBtn" class="mode-card-btn mode-card-btn-disabled" style="width:auto;padding:10px 16px;">VOLVER AL MENÚ</button>
        </div>

        <div class="lm-maingrid">
          <div class="lm-pitch-col">
            <div id="lmPitchBox">${PITCH_SVG}${FORMACION_433.map(def=>{
              const pid=state.alineacion&&state.alineacion[def.slot];
              const jugador=pid?state.plantilla.find(p=>p.id===pid):null;
              const vacio=!jugador;
              const lesionado=jugador&&jugador.injured;
              const iniciales=jugador?jugador.name.split(' ').map(w=>w[0]).join(''):def.slot.replace(/[0-9]/g,'');
              return `<div class="lm-pos-slot ${vacio?'empty-slot':''} ${lesionado?'lm-pos-injured':''}" data-slot="${def.slot}" style="left:${def.x}%;top:${def.y}%" title="${jugador?jugador.name+' ('+jugador.overall+')':'Vacío'}">
                <span class="lm-pos-code">${iniciales}</span>
                ${jugador?`<span class="lm-pos-rating">${jugador.overall}</span>`:''}
              </div>`;
            }).join('')}</div>
            <p class="lm-pitch-caption">Toca una posición para asignar o cambiar jugador</p>
          </div>
          <div class="lm-table-col">
            <div class="lm-table-wrap">
              <table class="lm-table">
                <thead><tr><th></th><th>#</th><th>Equipo</th><th>PJ</th><th>PG</th><th>PE</th><th>PP</th><th>GF</th><th>GC</th><th>DG</th><th>Pts</th></tr></thead>
                <tbody>
                  ${clasif.map((t,i)=>`<tr class="${t.id==='lm_0'?'lm-myteam':''} lm-zona-${zonaClasificacion(i+1)}">
                    <td>${t.id==='lm_0'?crestHTML(state.escudo,20):rivalCrestHTML(20)}</td>
                    <td>${i+1}</td><td>${t.name}</td><td>${t.pj}</td><td>${t.pg}</td><td>${t.pe}</td><td>${t.pp}</td>
                    <td>${t.gf}</td><td>${t.gc}</td><td>${t.gf-t.gc}</td><td><strong>${t.pts}</strong></td>
                  </tr>`).join('')}
                </tbody>
              </table>
            </div>
            <div class="lm-legend">
              <span><i class="lm-legend-dot lm-zona-champions"></i>Champions League</span>
              <span><i class="lm-legend-dot lm-zona-europa"></i>Europa League</span>
              <span><i class="lm-legend-dot lm-zona-conference"></i>Conference League</span>
              <span><i class="lm-legend-dot lm-zona-descenso"></i>Descenso</span>
            </div>
          </div>
        </div>
      </div>

      <div class="lm-staffrow">
        <div class="lm-staff-slot ${notif?'has-notif':''}" id="lmMedicoBtn">
          ${notif?'<span class="lm-staff-badge">1</span>':''}
          <div class="lm-staff-photo"><i class="ph ph-bold ph-first-aid-kit"></i></div>
          <div class="lm-staff-name">Médico</div>
        </div>
      </div>
    `;

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
    const plantillaBtn=document.getElementById('lmPlantillaBtn');
    if(plantillaBtn) plantillaBtn.addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      abrirPlantilla();
    });
    const medicoBtn=document.getElementById('lmMedicoBtn');
    if(medicoBtn) medicoBtn.addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      abrirDilemaMedico();
    });
    root.querySelectorAll('.lm-pos-slot').forEach(el=>{
      el.addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        abrirSelectorSlot(el.getAttribute('data-slot'));
      });
    });
  }

  /* ---------- 12a. Selector de jugador para una posición del campo ---------- */
  function abrirSelectorSlot(slot){
    const asignadoActualId = state.alineacion[slot];
    const idsUsados = new Set(Object.entries(state.alineacion).filter(([s])=>s!==slot).map(([,id])=>id));
    const disponibles = state.plantilla.filter(p=>!idsUsados.has(p.id));

    const overlay=document.createElement('div');
    overlay.id='lmSlotOverlay';
    overlay.innerHTML=`
      <div class="lm-dilemma-card" style="max-width:360px;text-align:left">
        <div class="lm-dilemma-title" style="text-align:center">POSICIÓN: ${slot.replace(/[0-9]/g,'')}</div>
        <div class="lm-slot-list">
          ${disponibles.map(p=>`
            <div class="lm-slot-option ${p.id===asignadoActualId?'selected':''} ${p.injured?'lm-slot-disabled':''}" data-pid="${p.id}">
              <span>${p.name} <span style="color:#888">(${p.position})</span>${p.injured?' <span style="color:#e24b4a">— lesionado</span>':''}</span>
              <strong>${p.overall}</strong>
            </div>`).join('')}
        </div>
        ${asignadoActualId?'<button id="lmSlotQuitar" class="mode-card-btn mode-card-btn-disabled" style="width:100%;margin-top:12px;padding:9px;">QUITAR DEL CAMPO</button>':''}
        <button id="lmSlotCerrar" class="mode-card-btn mode-card-btn-gold" style="width:100%;margin-top:8px;padding:9px;">CERRAR</button>
      </div>`;
    document.getElementById('ligaManagerScreen').appendChild(overlay);

    overlay.querySelectorAll('[data-pid]').forEach(el=>{
      el.addEventListener('click', ()=>{
        const pid=el.getAttribute('data-pid');
        const jugador=state.plantilla.find(p=>p.id===pid);
        if(jugador.injured) return; // no se puede alinear a un lesionado
        if(typeof window.playSound==='function') window.playSound('select');
        state.alineacion[slot]=pid;
        guardarEstado();
        overlay.remove();
        render();
      });
    });
    const quitarBtn=document.getElementById('lmSlotQuitar');
    if(quitarBtn) quitarBtn.addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      delete state.alineacion[slot];
      guardarEstado();
      overlay.remove();
      render();
    });
    document.getElementById('lmSlotCerrar').addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      overlay.remove();
    });
  }

  /* ---------- 12b. Vista de plantilla (estilo Copa Leyendas: tabla con
     nombre, posición, rating y estado de lesión) ---------- */
  function abrirPlantilla(){
    const overlay=document.createElement('div');
    overlay.id='lmPlantillaOverlay';
    const titularIds=new Set(Object.values(state.alineacion||{}).filter(Boolean));
    const filas=state.plantilla.map(p=>{
      const estado = p.injured
        ? `<span style="color:#e24b4a">Lesionado (${p.injuryWeeks}j)</span>`
        : `<span style="color:#5dcaa5">Disponible</span>`;
      const titular = titularIds.has(p.id) ? '<span style="color:#c9a227" title="Titular">★</span> ' : '';
      const racha = p.racha>=2 ? ` <span title="Racha de gol">🔥${p.racha}</span>` : '';
      return `<tr>
        <td>${titular}${p.name}${racha}</td>
        <td>${p.position}</td>
        <td><strong>${p.overall}</strong></td>
        <td>${estado}</td>
      </tr>`;
    }).join('');
    overlay.innerHTML=`
      <div class="lm-dilemma-card" style="max-width:420px;text-align:left">
        <div class="lm-dilemma-title" style="text-align:center">PLANTILLA — ${state.nombreEquipo.toUpperCase()}</div>
        <p class="lm-setup-desc" style="text-align:center">★ = titular en el campo ahora mismo. Cámbialos tocando una posición en el campo.</p>
        <table class="lm-table" style="margin-top:10px">
          <thead><tr><th>Jugador</th><th>Pos</th><th>Rating</th><th>Estado</th></tr></thead>
          <tbody>${filas}</tbody>
        </table>
        <div style="text-align:center;margin-top:16px">
          <button id="lmPlantillaCerrar" class="mode-card-btn mode-card-btn-gold" style="width:auto;padding:10px 26px;">CERRAR</button>
        </div>
      </div>`;
    document.getElementById('ligaManagerScreen').appendChild(overlay);
    document.getElementById('lmPlantillaCerrar').addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      overlay.remove();
    });
  }

  function abrirDilemaMedico(){
    if(!state.medicoNotificacion){
      if(typeof window.showToast==='function') window.showToast('Sin novedades del médico', 'toast-neutral');
      return;
    }
    const jugador=state.plantilla.find(p=>p.id===state.medicoNotificacion.jugadorId);
    const dificultad=state.medicoNotificacion.dificultad;
    let dadosElegidos=Math.min(1, state.diceAvailable);

    const overlay=document.createElement('div');
    overlay.id='lmMedicoOverlay';
    document.getElementById('ligaManagerScreen').appendChild(overlay);

    function renderSelector(){
      overlay.innerHTML=`
        <div class="lm-dilemma-card">
          <i class="ph ph-bold ph-first-aid-kit" style="font-size:26px;color:#c9a227"></i>
          <div class="lm-dilemma-title">EL MÉDICO TE CONSULTA</div>
          <div class="lm-dilemma-text">${jugador?jugador.name:'Un jugador'} tiene una lesión ${state.medicoNotificacion.severidad}. Necesitas sumar ${dificultad}+ (dados de 6) para acelerar su recuperación.</div>
          <div class="lm-dice-selector">
            <button id="lmDiceMinus" class="lm-dice-stepper">−</button>
            <span id="lmDiceCount">${dadosElegidos}</span>
            <button id="lmDicePlus" class="lm-dice-stepper">+</button>
          </div>
          <div class="lm-setup-desc">dados disponibles: ${state.diceAvailable}</div>
          <button id="lmTirarBtn" class="mode-card-btn mode-card-btn-gold" style="width:auto;padding:10px 24px;margin-top:10px" ${state.diceAvailable<1?'disabled':''}>TIRAR ${dadosElegidos} DADO${dadosElegidos>1?'S':''}</button>
        </div>`;
      const minus=document.getElementById('lmDiceMinus');
      const plus=document.getElementById('lmDicePlus');
      const tirarBtn=document.getElementById('lmTirarBtn');
      if(minus) minus.addEventListener('click', ()=>{ if(dadosElegidos>1){ dadosElegidos--; renderSelector(); } });
      if(plus) plus.addEventListener('click', ()=>{ if(dadosElegidos<state.diceAvailable){ dadosElegidos++; renderSelector(); } });
      if(tirarBtn) tirarBtn.addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        renderRolling(dadosElegidos);
      });
    }

    function renderRolling(numDados){
      overlay.innerHTML=`
        <div class="lm-dilemma-card">
          <div class="lm-dilemma-title" id="lmDiceTitle">TIRANDO ${numDados} DADO${numDados>1?'S':''}...</div>
          <div id="lmDice3DBox" class="lm-dice3d-box"></div>
          <div id="lmDiceResultZone"></div>
        </div>`;
      const box=document.getElementById('lmDice3DBox');
      if(typeof window.G2G_rollDice3D === 'function'){
        window.G2G_rollDice3D(box, numDados, function(tiradas){
          mostrarResultado(numDados, tiradas);
        });
      } else {
        // Fallback si el módulo 3D no cargó por lo que sea
        const tiradas=[]; for(let i=0;i<numDados;i++) tiradas.push(1+Math.floor(Math.random()*6));
        setTimeout(()=>mostrarResultado(numDados, tiradas), 800);
      }
    }

    // El dado 3D (#lmDice3DBox) se queda en pantalla, quieto, mostrando el
    // resultado ya asentado — solo se añade el texto del resultado debajo,
    // nunca se sustituye la tarjeta entera (eso era lo que lo hacía
    // desaparecer). Sigue visible hasta que se pulsa CONTINUAR.
    function mostrarResultado(numDados, tiradas){
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
        <button id="lmContinuarBtn" class="mode-card-btn mode-card-btn-gold" style="width:auto;padding:10px 26px;margin-top:16px">CONTINUAR</button>`;
      document.getElementById('lmContinuarBtn').addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        overlay.remove();
        render();
      });
    }

    renderSelector();
  }

  /* ---------- 14. Inicialización ---------- */
  function init(){
    state=cargarEstado();
    setupStep=1;
    render();
  }

  window.G2G_LigaManager={ init };

})();
