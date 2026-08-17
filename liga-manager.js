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

  const SAVE_KEY = 'g2g_liga_manager_v13';
  // Identidad del club (nombre + escudo) — PERSISTE entre partidas, no se
  // pierde al abandonar/descender. Si ya existe, el flujo de entrada no
  // vuelve a pedir nombre ni escudo (solo liga y moneda cada vez).
  const IDENTITY_KEY = 'g2g_liga_manager_identity';
  const DICE_POOL_PER_MATCH = 5;

  /* ---------- 1. Equipos rivales — La Liga 2026-27 real, 19 clubes ---------- */
  const ESCUDOS_DIR='assets/escudos_liga_española/';
  // Los datos de equipos y jugadores de la temporada viven en su propio
  // archivo (teams-data.js, cargado ANTES que este script) para poder
  // actualizarlos cada temporada nueva sin tocar nada de esta lógica.
  const LM_RIVALS = window.LM_RIVALS || [];

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
  // Describe el estilo de juego real del rival a partir de su perfil de
  // estadísticas — el mismo desequilibrio ataque/defensa que usa
  // simularPartido() para dar ventaja o penalización según tu
  // formación, así el texto es un reflejo fiel de la mecánica real, no
  // solo ambientación.
  function estiloDeJuegoRival(rival){
    const desequilibrio=rival.attack-rival.defense;
    const posesion=rival.passing+rival.technique;
    let base, consejo;
    if(desequilibrio>15){
      base=t('lm.estilo_muy_ofensivo');
      consejo='Una formación defensiva aprovecha bien esos huecos al contragolpe.';
    } else if(desequilibrio>8){
      base=t('lm.estilo_prioriza_ataque');
      consejo='Plantear un bloque defensivo puede darte ventaja en las transiciones.';
    } else if(desequilibrio<-15){
      base=t('lm.estilo_muy_defensivo');
      consejo='Ir con una formación muy ofensiva contra ellos suele costar más de lo esperado.';
    } else if(desequilibrio<-8){
      base=t('lm.estilo_solido_atras');
      consejo='Un planteamiento ofensivo choca con su principal virtud: la defensa.';
    } else if(posesion>=175){
      base=t('lm.estilo_posesion');
      consejo='Presionar arriba puede incomodarles más que esperar atrás.';
    } else if(rival.pace>=85){
      base=t('lm.estilo_rapido_directo');
      consejo='Una defensa bien colocada limita mucho su principal arma.';
    } else {
      base=t('lm.estilo_equilibrado');
      consejo='Cualquier planteamiento razonable debería servir contra ellos.';
    }
    return {base, consejo};
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
  const NOMBRES_JUGADOR=["Álvaro","Adrián","Hugo","Mario","Pablo","Marcos","Diego","Sergio","Iker","Nacho","Bruno","Izan","Rubén","Guillermo","Álex","Raúl","Daniel","Carlos","Javier","Óscar","Manuel","Antonio","Francisco","José","David","Jorge","Víctor","Iván","Enrique","Ismael","Rodrigo","Samuel","Gonzalo","Fernando","Miguel","Andrés","Emilio","Tomás","Lucas","Gabriel","Martín","Xabi","Unai","Ander","Aitor","Eneko"];
  const APELLIDOS_JUGADOR=["García","Fernández","López","Martínez","Sánchez","Pérez","Gómez","Ruiz","Díaz","Moreno","Torres","Ramos","Molina","Ortega","Vázquez","Serrano","Castro","Romero","Navarro","Iglesias","Domínguez","Vidal","Santos","Cano","Prieto","Vega","Herrera","Cabrera","Rubio","Marín","Delgado","Soto","Campos","Reyes","Blanco","Suárez","Peña","Flores","Nieto","Cortés","Aguilar","Ibáñez","Lozano","Cruz","Pascual"];
  // Nombres femeninos — el cuerpo técnico (médico, mantenimiento y los
  // dos directores) puede ser hombre o mujer; los jugadores de la
  // plantilla siguen siendo siempre hombres (mismos apellidos para
  // ambos géneros, solo cambia el nombre de pila).
  const NOMBRES_MUJER=["Ana","Laura","Marta","Sara","Elena","Lucía","Paula","Andrea","Carmen","Irene","Claudia","Sofía","Alba","Nuria","Cristina","Beatriz","Silvia","Patricia","Rocío","Julia","María","Isabel","Raquel","Eva","Noelia","Sandra","Natalia","Alicia","Verónica","Yolanda","Pilar","Teresa","Mónica","Cristina","Esther","Gloria","Inés","Marina","Celia","Aitana","Vega","Daniela","Valeria","Olivia"];
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
    const numerosUsados=new Set();
    function numeroUnico(){
      let n;
      do{ n=1+Math.floor(Math.random()*30); }while(numerosUsados.has(n));
      numerosUsados.add(n);
      return n;
    }
    function nuevoJugador(id, position, esSuplente){
      const overall=48+Math.floor(Math.random()*18); // 48-65, coherente con "plantilla modesta, recién ascendido"
      const variar=()=>Math.max(30,Math.min(80, overall+Math.floor(Math.random()*11)-5));
      return {
        id, name:nombreUnico(), numero:numeroUnico(), position, overall,
        attack:variar(), defense:variar(), pace:variar(), passing:variar(), technique:variar(),
        fatigue:100, racha:0, esSuplente:!!esSuplente,
        injured:false, injuryWeeks:0, injurySeverity:null,
        salario:calcularSalario(overall)
      };
    }

    // 11 jugadores de plantilla principal (posiciones base del 4-3-3)
    const POSICIONES_TITULARES=["POR","DFC","DFC","LI","LD","MC","MC","MC","EI","ED","DC"];
    const plantilla=POSICIONES_TITULARES.map((pos,i)=>nuevoJugador('p'+i, pos, false));

    // Banquillo: tamaño según la mejora "Banquillo" comprada (5 de base,
    // hasta 10 con el nivel máximo) con posiciones al azar que no se
    // repiten entre ellas mientras queden posiciones libres.
    const TODAS_POSICIONES=["POR","DFC","LI","LD","MC","EI","ED","DC"];
    const posiciones=TODAS_POSICIONES.slice();
    for(let i=posiciones.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      const tmp=posiciones[i]; posiciones[i]=posiciones[j]; posiciones[j]=tmp;
    }
    const tamanoBanquillo=lmMaxBanquillo();
    for(let i=0;i<tamanoBanquillo;i++){ plantilla.push(nuevoJugador('b'+i, posiciones[i%posiciones.length], true)); }

    return plantilla;
  }

  // Genera tu plantilla a partir de un equipo real elegido en vez de
  // crear el tuyo propio — mismos 16 jugadores (11+5) con nombres y
  // dorsales reales de esa plantilla, y estadísticas individuales
  // repartidas alrededor del perfil real del equipo (igual que se hace
  // para generar el once ficticio de los rivales).
  function generarPlantillaDesdeEquipoReal(equipo){
    const tamanoBanquillo=lmMaxBanquillo();
    const porteros=(equipo.plantilla||[]).filter(j=>j.pos==='POR');
    const resto=(equipo.plantilla||[]).filter(j=>j.pos!=='POR');
    const jugadores=[...porteros, ...resto].slice(0,11+tamanoBanquillo);
    function statVariada(base){ return Math.max(35, Math.min(97, Math.round(base+Math.floor(Math.random()*13)-6))); }
    function jugadorDe(id, idx, pos, esSuplente){
      const j=jugadores[idx];
      const tieneStatsReales = j && j.attack!==undefined;
      const attack = tieneStatsReales ? j.attack : statVariada(equipo.attack);
      const defense = tieneStatsReales ? j.defense : statVariada(equipo.defense);
      const pace = tieneStatsReales ? j.pace : statVariada(equipo.pace);
      const passing = tieneStatsReales ? j.passing : statVariada(equipo.passing);
      const technique = tieneStatsReales ? j.technique : statVariada(equipo.technique);
      const overall=Math.round((attack+defense+pace+passing+technique)/5);
      return {
        id, name: j?j.name:('Jugador '+(idx+1)), numero: j?j.n:(idx+1), position:pos, overall,
        attack, defense, pace, passing, technique,
        fatigue:100, racha:0, esSuplente:!!esSuplente,
        injured:false, injuryWeeks:0, injurySeverity:null,
        salario:calcularSalario(overall)
      };
    }
    const POSICIONES_TITULARES=["POR","DFC","DFC","LI","LD","MC","MC","MC","EI","ED","DC"];
    const POSICIONES_BANQUILLO_BASE=["POR","DFC","MC","ED","DC"];
    const plantilla=POSICIONES_TITULARES.map((pos,i)=>jugadorDe('p'+i, i, pos, false));
    for(let i=0;i<tamanoBanquillo;i++){ plantilla.push(jugadorDe('b'+i, 11+i, POSICIONES_BANQUILLO_BASE[i%POSICIONES_BANQUILLO_BASE.length], true)); }
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
  // Bonus real de la formación activa — mismos valores que usa Copa
  // Leyendas (FORMATIONS[cat].bonus), sumados directamente a las 5
  // estadísticas del once titular: elegir formación ahora afecta de
  // verdad al ataque/defensa/etc., no es solo un dibujo visual.
  function formacionBonusActual(){
    const cat=FORMATIONS[state.formacionCategoria] ? state.formacionCategoria : 'equilibrada';
    const f=(FORMATIONS[cat]||[]).find(x=>x.code===state.formacionCode);
    return f ? f.bonus : {attack:0,defense:0,pace:0,passing:0,technique:0};
  }
  // Ventana de días editables del calendario de entrenamiento — los días
  // entre el partido anterior (exclusive) y el próximo (exclusive). La
  // jornada 1 no tiene semana previa, así que no hay días que preparar.
  function ventanaEntrenoActual(){
    if(!state.jornadaActual || state.jornadaActual>38) return null;
    const proxima=fechaJornadaLM(state.jornadaActual);
    if(!proxima) return null;
    let anterior;
    if(state.jornadaActual<=1){
      // Antes del primer partido no hay "jornada anterior" — la semana
      // de preparación empieza exactamente 7 días antes del primer
      // partido, NUNCA en el día real de hoy: con fechas de temporada
      // realistas (agosto), "hoy" puede estar meses antes del inicio
      // de la liga, lo que dejaba una ventana de entrenamiento
      // gigantesca en vez de la semana previa habitual.
      anterior=new Date(proxima); anterior.setHours(0,0,0,0); anterior.setDate(anterior.getDate()-7);
    } else {
      anterior=fechaJornadaLM(state.jornadaActual-1);
    }
    if(!anterior) return null;
    if(anterior.getTime()>=proxima.getTime()) return null; // sin margen (la liga arranca hoy mismo)
    return {desde:anterior, hasta:proxima};
  }
  function fechaEsEditable(fecha){
    // Si la semana ya se resolvió (primer SEGUIR ya dado), toca jugar el
    // partido y el calendario de esa semana se queda fijo — no tiene
    // sentido seguir tocándolo con el entrenamiento ya procesado.
    if(state.semanaResueltaParaJornada===state.jornadaActual) return false;
    const v=ventanaEntrenoActual();
    if(!v) return false;
    const t=fecha.getTime();
    return t>v.desde.getTime() && t<v.hasta.getTime();
  }
  function contarEntrenoSemanaActual(){
    const v=ventanaEntrenoActual();
    if(!v) return {entreno:0, descanso:0, dias:0};
    let entreno=0, dias=0;
    const cur=new Date(v.desde); cur.setDate(cur.getDate()+1);
    while(cur.getTime()<v.hasta.getTime()){
      dias++;
      if(state.calendarioEntrenamiento && state.calendarioEntrenamiento[fechaISO(cur)]) entreno++;
      cur.setDate(cur.getDate()+1);
    }
    return {entreno, descanso:dias-entreno, dias};
  }
  // Procesa la semana de entrenamiento día a día: solo los jugadores
  // elegidos en el PLAN DE ENTRENAMIENTO mejoran de verdad (permanente,
  // sube su valor real), y entrenar muchos días seguidos sube el riesgo
  // de lesión por sobrecarga — mitigado por la prevención del médico.
  // Devuelve la lista de eventos día a día para el visionado rápido de
  // la semana antes del partido.
  function procesarEntrenamientoSemanal(){
    const v=ventanaEntrenoActual();
    const eventosDias=[];
    if(!v) return eventosDias;
    const NOMBRE_STAT={
      get attack(){return t('lm.stat_attack');}, get defense(){return t('lm.stat_defense');},
      get pace(){return t('lm.stat_pace');}, get passing(){return t('lm.stat_passing');}, get technique(){return t('lm.stat_technique');}
    };
    const plan=(state.pfPlanEntrenamiento||[])
      .map(entry=>{
        const jugador=state.plantilla.find(p=>p.id===entry.jugadorId);
        return jugador ? {jugador, stat:entry.stat} : null;
      })
      .filter(Boolean);
    const nivelesMed=state.medicoNiveles||{};
    const bonusPlanificacion=1+nivelDePF('planificacionSemanal')*0.25;
    const cur=new Date(v.desde); cur.setDate(cur.getDate()+1);
    let seguidos=0;
    // Seguimiento agregado de toda la semana, para el resumen final
    // condensado (no hace falta guardar el detalle día a día ahí).
    const mejorasPorJugador={}; // id -> {nombre, stats:{campo:cantidad}}
    const lesionesSemana=[]; // {nombre, familia}
    let diasEntreno=0, diasDescanso=0;
    while(cur.getTime()<v.hasta.getTime()){
      const iso=fechaISO(cur);
      const esEntreno=!!(state.calendarioEntrenamiento && state.calendarioEntrenamiento[iso]);
      const textos=[];
      if(esEntreno){
        diasEntreno++;
        seguidos++;
        plan.forEach(({jugador:j, stat:campo})=>{
          if(!campo) return; // sin enfoque elegido, no entrena de verdad
          if(Math.random()<0.30*bonusPlanificacion){
            j[campo]=Math.min(99, Math.round((j[campo]||50)+1));
            // Recalcular el overall del jugador cada vez que mejora una
            // estadística — antes la estadística subía pero la
            // puntuación general se quedaba con el valor antiguo, y por
            // extensión también la media del equipo (que se calcula a
            // partir del overall de cada jugador) hasta que algo más
            // la refrescara por otro motivo.
            j.overall=Math.round((j.attack+j.defense+j.pace+j.passing+j.technique)/5);
            textos.push(tp('lm.dia_mejora_stat', {nombre:j.name, stat:t('lm.stat_'+campo)}));
            if(!mejorasPorJugador[j.id]) mejorasPorJugador[j.id]={nombre:j.name, stats:{}};
            mejorasPorJugador[j.id].stats[campo]=(mejorasPorJugador[j.id].stats[campo]||0)+1;
          }
        });
        // Entrenar 3+ días seguidos empieza a pasar factura — la
        // prevención del médico (muscular y ósea) reduce este riesgo,
        // igual que hace con las lesiones de partido. Cualquier jugador
        // puede resentirse (entrena toda la plantilla esa semana), pero
        // los del Plan de Entrenamiento llevan mucha más carga extra y
        // por eso tienen bastante más papeletas.
        const factorPrevencion=Math.pow(0.85, (nivelesMed.prevencionMuscular||0)+(nivelesMed.prevencionOsea||0));
        const riesgoSobrecarga=Math.max(0, seguidos-2)*0.05*factorPrevencion;
        if(riesgoSobrecarga>0 && Math.random()<riesgoSobrecarga){
          const idsEnPlan=new Set(plan.map(p=>p.jugador.id));
          const pool=[];
          state.plantilla.forEach(p=>{
            if(p.injured) return;
            const peso=idsEnPlan.has(p.id)?4:1;
            for(let i=0;i<peso;i++) pool.push(p);
          });
          if(pool.length){
            const jugador=pool[Math.floor(Math.random()*pool.length)];
            const familia=Math.random()<0.5?'muscular':'osea';
            const sev={label:'leve', weeks:1, dificultad:7};
            jugador.injured=true; jugador.injurySeverity=sev.label; jugador.injuryWeeks=sev.weeks; jugador.injuryFamilia=familia;
            jugador.lesionLogId=registrarLesionHistorial(jugador, sev, 'Sobrecarga por exceso de entrenamiento', 'el propio entrenamiento', familia);
            // Igual que con las lesiones de partido: el médico recomienda
            // tratarla cuanto antes (antes esto solo pasaba en las
            // lesiones ocurridas jugando, nunca en las de entrenamiento).
            if(!state.medicoNotificacion){
              state.medicoNotificacion={jugadorId:jugador.id, dificultad:sev.dificultad, severidad:sev.label};
            }
            textos.push(tp('lm.dia_sobrecarga_entreno', {nombre:jugador.name}));
            lesionesSemana.push({nombre:jugador.name, familia});
          }
        }
        if(!textos.length) textos.push(t('lm.dia_entreno_sin_incidencias'));
        state.plantilla.forEach(p=>{ p.fatigue=Math.max(0, Math.min(100, Math.round((p.fatigue===undefined?100:p.fatigue)-2.2))); });
      } else {
        diasDescanso++;
        seguidos=0;
        textos.push(t('lm.dia_descanso_texto'));
        state.plantilla.forEach(p=>{ p.fatigue=Math.max(0, Math.min(100, Math.round((p.fatigue===undefined?100:p.fatigue)+4))); });
      }
      eventosDias.push({fecha:new Date(cur), iso, tipo:esEntreno?'entreno':'descanso', textos});
      cur.setDate(cur.getDate()+1);
    }
    eventosDias.resumenSemanal={
      diasEntreno, diasDescanso,
      mejoras:Object.values(mejorasPorJugador),
      lesiones:lesionesSemana,
      NOMBRE_STAT
    };
    if(typeof window.unlockLMAchievement==='function' && diasEntreno>0) window.unlockLMAchievement('lm_first_training', false);
    guardarEstado();
    return eventosDias;
  }

  // Días de un mes concreto para pintar la rejilla del calendario —
  // semana empezando en lunes, huecos en blanco antes del día 1. Se
  // apoya solo en Date nativo, así que sigue siendo correcto pintando
  // cualquier año futuro sin tocar nada.
  function generarDiasMes(year, month){
    const primerDia=new Date(year, month, 1);
    const ultimoDia=new Date(year, month+1, 0);
    let offset=primerDia.getDay()-1; if(offset<0) offset=6;
    const dias=[];
    for(let i=0;i<offset;i++) dias.push(null);
    for(let d=1; d<=ultimoDia.getDate(); d++) dias.push(new Date(year, month, d));
    return dias;
  }
  // ¿Juega mi equipo ese día? Recorre las 38 jornadas (barato, nada que
  // optimizar) y devuelve el rival si coincide la fecha.
  function partidoMioEnFecha(isoStr){
    for(let n=1;n<=38;n++){
      const f=fechaJornadaLM(n);
      if(!f || fechaISO(f)!==isoStr) continue;
      const jornada=state.calendario[n-1];
      if(!jornada) return null;
      const miPartido=jornada.find(p=>p.home.id==='lm_0'||p.away.id==='lm_0');
      if(!miPartido) return null;
      const esLocal=miPartido.home.id==='lm_0';
      return {jornada:n, rival: esLocal?miPartido.away:miPartido.home, esLocal};
    }
    return null;
  }
  let calendarioMesVisto=null; // {year,month} — se fija la primera vez que se pinta, en el mes del próximo partido
  let calendarioJornadaSincronizada=null; // controla cuándo hay que saltar de mes automáticamente
  function calendarioHTML(){
    if(!state.fechaInicioLiga) return '';
    // El calendario avanza solo: cada vez que cambia la jornada actual
    // (se ha jugado un partido), si el próximo cae en otro mes, salta a
    // ese mes automáticamente. Mientras la jornada no cambie, el usuario
    // puede navegar libremente con las flechas sin que se le reinicie.
    if(!calendarioMesVisto || calendarioJornadaSincronizada!==state.jornadaActual){
      // Usamos el primer día realmente editable de la ventana (el día
      // siguiente al partido anterior) como referencia, no la fecha del
      // propio partido — así el calendario muestra siempre el mes donde
      // de verdad se pueden marcar entrenamientos, aunque el partido
      // caiga ya en el mes siguiente.
      const ventana=ventanaEntrenoActual();
      let base;
      if(ventana){ base=new Date(ventana.desde); base.setDate(base.getDate()+1); }
      else { base=fechaJornadaLM(Math.min(state.jornadaActual,38)) || new Date(state.fechaInicioLiga+'T00:00:00'); }
      calendarioMesVisto={year:base.getFullYear(), month:base.getMonth()};
      calendarioJornadaSincronizada=state.jornadaActual;
    }
    const {year, month}=calendarioMesVisto;
    const dias=generarDiasMes(year, month);
    const celdas=dias.map(d=>{
      if(!d) return `<div class="lm-cal-celda lm-cal-vacia"></div>`;
      const iso=fechaISO(d);
      const partido=partidoMioEnFecha(iso);
      const editable=fechaEsEditable(d);
      const entrenado=!!(state.calendarioEntrenamiento && state.calendarioEntrenamiento[iso]);
      let contenido='';
      if(partido){
        contenido=`<div class="lm-cal-partido" title="${t('lm.cal_jornada_vs')} ${partido.jornada} — ${partido.esLocal?t('lm.cal_vs'):t('lm.cal_fuera_vs')} ${partido.rival.name}">${rivalCrestHTML(40, partido.rival.crestImg)}</div>`;
      } else if(entrenado){
        contenido=`<i class="ph ph-bold ph-barbell lm-cal-entreno-icon"></i>`;
      }
      const clases=['lm-cal-celda'];
      if(partido) clases.push('lm-cal-dia-partido');
      if(editable) clases.push('lm-cal-editable');
      if(!editable) clases.push('lm-cal-bloqueado');
      return `<div class="${clases.join(' ')}" ${editable?`data-cal-dia="${iso}"`:''} title="${editable?t('lm.cal_tocar_entrenamiento'):''}">
        <span class="lm-cal-num">${d.getDate()}</span>
        ${contenido}
      </div>`;
    }).join('');
    const {entreno, descanso}=contarEntrenoSemanaActual();
    return `<div class="lm-calendario-box">
      <div class="bench-title" style="margin:0 0 10px"><span><i class="ph ph-bold ph-calendar-blank" style="color:var(--gold);margin-right:6px"></i>${t("lm.calendario")}</span></div>
      <div class="lm-cal-header">
        <button class="lm-cal-nav" data-cal-nav="-1" title="${t('lm.tt_mes_anterior')}"><i class="ph ph-bold ph-caret-left"></i></button>
        <span class="lm-cal-titulo">${MESES_LARGO[month].toUpperCase()} ${year}</span>
        <button class="lm-cal-nav" data-cal-nav="1" title="${t('lm.tt_mes_siguiente')}"><i class="ph ph-bold ph-caret-right"></i></button>
      </div>
      <div class="lm-cal-semana-dias"><span>L</span><span>M</span><span>X</span><span>J</span><span>V</span><span>S</span><span>D</span></div>
      <div class="lm-cal-grid">${celdas}</div>
      <div class="lm-cal-leyenda">
        <span><i class="ph ph-bold ph-barbell"></i> ${t('lm.cal_entrenamiento')} (${entreno})</span>
        <span><i class="ph ph-bold ph-bed"></i> ${t('lm.cal_descanso')} (${descanso})</span>
        <span class="lm-cal-leyenda-escudo">${crestHTML(state.escudo||null,14)} ${t('lm.cal_partido')}</span>
      </div>
      <p class="lm-setup-desc" style="text-align:center;margin-top:4px">${t('lm.cal_descripcion')}</p>
    </div>`;
  }

  function calcularStatsEquipo(){
    const ids=Object.values(state.alineacion||{}).filter(Boolean);
    const titulares = ids.map(id=>state.plantilla.find(p=>p.id===id)).filter(Boolean);
    const base = titulares.length ? titulares : state.plantilla;
    const baseFinal = base.length ? base : state.plantilla; // último recurso: si la plantilla está vacía
    const suma = {attack:0,defense:0,pace:0,passing:0,technique:0};
    baseFinal.forEach(p=>{
      // Un jugador lesionado SÍ puede jugar, pero rinde peor — mismo
      // factor de penalización (0.6) que efectivoOverall().
      const f=p.injured?0.6:1;
      suma.attack+=p.attack*f; suma.defense+=p.defense*f; suma.pace+=p.pace*f; suma.passing+=p.passing*f; suma.technique+=p.technique*f;
    });
    const n=baseFinal.length||1;
    const bonus=formacionBonusActual();
    const tecPF=nivelDePF('potencialTecnico')*2, fisPF=nivelDePF('potencialFisico')*2;
    return {
      attack:suma.attack/n+(bonus.attack||0), defense:suma.defense/n+(bonus.defense||0), pace:suma.pace/n+(bonus.pace||0)+fisPF,
      passing:suma.passing/n+(bonus.passing||0), technique:suma.technique/n+(bonus.technique||0)+tecPF
    };
  }


  /* ---------- 3. Calendario ida/vuelta (método del círculo) ---------- */
  /* ---------- 2b. Fechas reales del calendario de entrenamiento — se
     apoya siempre en el objeto Date nativo del navegador, nunca en
     tablas de días fijas, así que sigue siendo correcto dentro de 20 o
     50 años sin tocar una línea. La liga arranca el sábado más cercano
     (hoy mismo si hoy ya es sábado) a partir del día en que se crea la
     partida, y cada jornada siguiente cae 7 días después. ---------- */
  function fechaISO(d){
    const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0'), day=String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
  }
  // Etiqueta de temporada tipo "26/27" — a partir del año de la fecha
  // real de inicio de la liga (jornada 1, siempre en agosto). Como el
  // calendario ya usa fechas realistas de temporada de fútbol
  // (agosto → mayo/junio del año siguiente), esto es simplemente los
  // dos últimos dígitos de ese año y del siguiente.
  function temporadaLabel(){
    if(!state.fechaInicioLiga) return '';
    const anioInicio=parseInt(state.fechaInicioLiga.slice(0,4), 10);
    if(!anioInicio) return '';
    const dosDigitos=n=>String(n%100).padStart(2,'0');
    return `${dosDigitos(anioInicio)}/${dosDigitos(anioInicio+1)}`;
  }
  // Fecha de inicio de temporada realista: en vez de arrancar la
  // jornada 1 "el próximo sábado desde hoy" (lo que podía situar una
  // liga entera en cualquier época del año, sin relación con un
  // calendario real de fútbol), se usa el tercer sábado de agosto —
  // fecha habitual de inicio de LaLiga — del año en curso. Con eso, 38
  // jornadas semanales terminan de forma natural a finales de mayo del
  // año siguiente, igual que una temporada real (agosto → mayo/junio).
  // Si esa fecha de agosto ya ha quedado atrás este año, se usa la del
  // año siguiente — nunca se puede arrancar una jornada 1 en el pasado.
  function inicioTemporadaRealista(){
    function tercerSabadoDeAgosto(year){
      const d=new Date(year, 7, 1); // 1 de agosto
      const diasHastaPrimerSabado=(6-d.getDay()+7)%7;
      d.setDate(1+diasHastaPrimerSabado+14); // +2 semanas = tercer sábado
      return d;
    }
    const hoy=new Date(); hoy.setHours(0,0,0,0);
    let candidato=tercerSabadoDeAgosto(hoy.getFullYear());
    // Mismo margen mínimo de 5 días que ya usaba proximoSabadoDesde,
    // como red de seguridad heredada.
    const diasMargen=(candidato-hoy)/86400000;
    if(diasMargen<5) candidato=tercerSabadoDeAgosto(hoy.getFullYear()+1);
    return candidato;
  }
  // Reparto real de LaLiga: cada jornada se juega entre viernes y lunes
  // (a veces incluso más días por aplazamientos, pero nos quedamos con
  // el núcleo habitual), con la mayoría de partidos en sábado y domingo,
  // algo menos el viernes, y solo alguno el lunes — igual que en la
  // competición real. El día se calcula con un hash determinista a
  // partir del número de jornada, así que siempre sale el mismo sin
  // tener que guardar nada aparte en el estado.
  function offsetDiaJornada(n){
    let h=(n*2654435761)%2147483647; if(h<0) h+=2147483647;
    const r=h/2147483647; // 0..1 estable para cada jornada
    if(r<0.12) return -1; // viernes
    if(r<0.52) return 0;  // sábado
    if(r<0.90) return 1;  // domingo
    return 2;              // lunes
  }
  function fechaJornadaLM(n){
    if(!state.fechaInicioLiga) return null;
    const inicio=new Date(state.fechaInicioLiga+'T00:00:00');
    // La jornada 1 se queda fija en el sábado de inicio de liga — así
    // nunca puede caer antes de hoy (el offset de las demás jornadas sí
    // puede adelantar o atrasar el día, pero la 1ª no tiene semana previa
    // que mover hacia atrás sin arriesgarse a caer en el pasado).
    if(n<=1) return inicio;
    const f=new Date(inicio);
    f.setDate(inicio.getDate()+(n-1)*7+offsetDiaJornada(n));
    return f;
  }
  function diaSemanaCorto(d){
    return ['DOM','LUN','MAR','MIÉ','JUE','VIE','SÁB'][d.getDay()];
  }
  const MESES_LARGO=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

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
    // Leer el partido y elegir bien la formación importa: un
    // planteamiento defensivo (contragolpe) saca mucho más partido a un
    // rival muy ofensivo y flojo atrás — se abren espacios a la contra
    // que una formación defensiva está hecha para aprovechar. Al revés,
    // jugar ofensivo contra un equipo muy defensivo cuesta más goles de
    // los que parece que deberían caer solo por diferencia de nivel.
    const miEsA = teamA.id==='lm_0', miEsB = teamB.id==='lm_0';
    if(miEsA || miEsB){
      const misStats = miEsA ? statsA : statsB;
      const statsRival = miEsA ? statsB : statsA;
      const miFormacion = state.formacionCategoria;
      const miFormacionCode = state.formacionCode;
      const desequilibrioRival = statsRival.attack - statsRival.defense; // positivo = ofensivo y flojo atrás
      let bonusPropio=0, penalizacionRival=0;
      if(miFormacion==='defensiva' && desequilibrioRival>8){
        bonusPropio=Math.min(0.35, (desequilibrioRival-8)*0.022);
        // Dentro de las defensivas, el 5-2-2-1 (Contragolpe) es la
        // formación perfecta contra un rival muy ofensivo y flojo
        // atrás — aprovecha justo ese desequilibrio al máximo.
        if(miFormacionCode==='5-2-2-1') bonusPropio+=0.10;
      } else if(miFormacion==='ofensiva' && desequilibrioRival<-8){
        // Rival muy defensivo y yo jugando ofensivo: cuesta más de lo
        // que la diferencia de nivel sugeriría, el rival está hecho para
        // encerrarse justo contra este tipo de planteamiento.
        penalizacionRival=Math.min(0.28, (-desequilibrioRival-8)*0.018);
        // Dentro de las ofensivas, el 3-5-2 (Superioridad central) es la
        // formación perfecta para romper un bloque bajo — el extra de
        // pase compensa parte de esa penalización.
        if(miFormacionCode==='3-5-2') penalizacionRival=Math.max(0, penalizacionRival-0.10);
      }
      if(miEsA){ lambdaA=Math.max(0.15,lambdaA+bonusPropio-penalizacionRival); }
      else { lambdaB=Math.max(0.15,lambdaB+bonusPropio-penalizacionRival); }
    }
    if(contexto && contexto.climaId){
      const climaSkillActiva = typeof lmSkillActiva==='function' && lmSkillActiva('lm_meteorologo');
      let factorA=factorClimaCampo(contexto.climaId, contexto.campoAnfitrion, contexto.anfitrionA);
      let factorB=factorClimaCampo(contexto.climaId, contexto.campoAnfitrion, !contexto.anfitrionA);
      // Especialista en Clima: la penalización (la distancia hasta 1.0)
      // se reduce a la mitad, solo para mi equipo.
      if(climaSkillActiva && miEsA) factorA = 1 - (1-factorA)*0.5;
      if(climaSkillActiva && miEsB) factorB = 1 - (1-factorB)*0.5;
      lambdaA=Math.max(0.15, lambdaA*factorA);
      lambdaB=Math.max(0.15, lambdaB*factorB);
    }
    if(contexto && contexto.moralBonus){
      // Mismo espíritu que moraleLambdaBonus() en Copa Leyendas, pero más
      // moderado (±0.08 frente a ±0.15) al ya sumarse al efecto de
      // clima+campo — solo afecta a MI equipo, nunca al rival.
      if(contexto.esMiEquipoA) lambdaA=Math.max(0.15, lambdaA+contexto.moralBonus);
      else lambdaB=Math.max(0.15, lambdaB+contexto.moralBonus);
    }
    // Habilidades de Liga Manager — todas de ámbito táctico/de partido,
    // nunca tocan lo que resuelven las cartas del cuerpo técnico.
    if(contexto && (miEsA || miEsB) && typeof lmSkillActiva==='function'){
      const yoSoyLocal = miEsA ? contexto.anfitrionA : !contexto.anfitrionA;
      if(yoSoyLocal && lmSkillActiva('lm_factor_campo')){
        if(miEsA) lambdaA=Math.max(0.15, lambdaA+0.10); else lambdaB=Math.max(0.15, lambdaB+0.10);
      }
      if(!yoSoyLocal && lmSkillActiva('lm_contraataque_letal')){
        // Jugando fuera, defiendes mejor: reduces el ataque del rival.
        if(miEsA) lambdaB=Math.max(0.15, lambdaB-0.08); else lambdaA=Math.max(0.15, lambdaA-0.08);
      }
      if((state.rachaResultados||0)>=3 && lmSkillActiva('lm_mentalidad_ganadora')){
        if(miEsA) lambdaA=Math.max(0.15, lambdaA+0.08); else lambdaB=Math.max(0.15, lambdaB+0.08);
      }
      if((state.rachaResultados||0)===-1 && lmSkillActiva('lm_revancha')){
        // Justo tras perder el partido anterior — el equipo sale con
        // hambre de resarcirse.
        if(miEsA) lambdaA=Math.max(0.15, lambdaA+0.09); else lambdaB=Math.max(0.15, lambdaB+0.09);
      }
    }
    const golesA=window.poissonSample(lambdaA);
    const golesB=window.poissonSample(lambdaB);
    // Posesión del partido — mismo criterio que ya usa el visor
    // manager para decidir quién tiene más el balón: un equipo con
    // mejor pase y técnica controla más el partido. Se guarda como
    // parte del resultado para poder mostrarla y mencionarla luego,
    // tanto en modo automático como en modo manager.
    const calidadA=(statsA.passing+statsA.technique)/2, calidadB=(statsB.passing+statsB.technique)/2;
    const posesionA=Math.max(32, Math.min(68, Math.round(50+(calidadA-calidadB)/1.6)));
    return {golesA,golesB,posesionA,posesionB:100-posesionA};
  }

  /* ---------- 5. Estado persistente (localStorage, prototipo) ---------- */
  let state=null;
  let setupStep=1;
  let formacionCategoriaVista=null; // categoría que se está viendo en el selector (no siempre coincide con la activa)
  let seleccionJugador=null; // id del jugador seleccionado en la plantilla/banquillo/campo, a la espera del segundo clic
  // Ordenación de la tabla PLANTILLA — mismo sistema de 3 modos que
  // CONVOCADOS en Copa Leyendas (LLEGADA/POSICIÓN/PUNTOS, un botón cíclico).
  let lmSortMode='position';
  const LM_SORT_LABELS={arrival:'LLEGADA', position:'POSICIÓN', rating:'PUNTOS', numero:'DORSAL'};
  const LM_SORT_NEXT={arrival:'position', position:'rating', rating:'numero', numero:'arrival'};
  // Los catálogos de cartas (MEDICO_CARTAS_BASE, etc.) son const que se
  // evalúan una sola vez al cargar el archivo — si el nombre/descripción
  // se tradujera AL DEFINIR la carta, se quedaría congelado en el
  // idioma que estuviera activo en ese momento. Por eso se resuelve
  // aquí, cada vez que se muestra, con el texto en español original
  // como respaldo si falta la clave.
  function tc(prefix, id, campo, fallback){
    const key=prefix+'.'+id+'.'+campo;
    const val=(typeof window.t==='function') ? window.t(key) : null;
    return (val && val!==key) ? val : fallback;
  }
  // Traduce una clave de texto y sustituye marcadores {nombre} por los
  // valores reales pasados en un objeto — usado sobre todo en los
  // correos internos, que mezclan texto fijo con datos de la partida.
  function tp(key, vars){
    let texto=(typeof window.t==='function') ? window.t(key) : key;
    if(vars) Object.keys(vars).forEach(k=>{ texto=texto.split('{'+k+'}').join(vars[k]); });
    return texto;
  }
  let clasifColapsada=false; // la clasificación empieza desplegada
  // ---- Rasgos de jugador ----
  // Se ganan a través de la quiniela (nunca se compran) y se quedan
  // para siempre en el jugador que los recibe. La mayoría suman +5 a
  // una de sus 5 estadísticas; Versátil es especial: quita la
  // penalización de jugar fuera de su posición natural.
  // ---- Guardias de seguridad ----
  // 12 zonas reales del estadio (gradas.png), con su posición aproximada
  // sobre la imagen para poder pintar la insignia y los botones +/- en
  // el sitio correcto.
  const LM_ZONAS_ESTADIO=[
    {id:'norte', get label(){return t('lm.zona_norte');}, left:49, top:13, w:64, h:20},
    {id:'este_1',  get label(){return t('lm.zona_este_1');}, left:87, top:33, w:15, h:26},
    {id:'este_2',  get label(){return t('lm.zona_este_2');}, left:87, top:60, w:15, h:26},
    {id:'sur',   get label(){return t('lm.zona_sur');}, left:49, top:80, w:64, h:20},
    {id:'oeste_2', get label(){return t('lm.zona_oeste_2');}, left:9,  top:60, w:15, h:26},
    {id:'oeste_1', get label(){return t('lm.zona_oeste_1');}, left:9, top:33, w:15, h:26},
  ];
  const LM_DISTURBIO_LABEL={get 0(){return t('lm.disturbio_0');},get 1(){return t('lm.disturbio_1');},get 2(){return t('lm.disturbio_2');},get 3(){return t('lm.disturbio_3');}};
  const LM_DISTURBIO_COLOR={0:null,1:'#e6c94a',2:'#e88a2e',3:'#e24b4a'};
  // Coste base del guardia y descuento por trabajador de nivel alto —
  // igual que el resto del cuerpo técnico, 3 estrellas abarata las cosas.
  const GUARDIA_SALARIO_BASE=900;
  function guardiaSalarioActual(){
    const trab=state.trabajadores && state.trabajadores.mantenimiento;
    const nivel=trab?trab.nivel:1;
    const descuento = nivel>=3 ? 0.25 : (nivel===2 ? 0.10 : 0);
    return Math.round(GUARDIA_SALARIO_BASE*(1-descuento));
  }
  function guardiasAsignadosTotal(){
    return Object.values(state.guardiasZonas||{}).reduce((a,b)=>a+(b||0),0);
  }
  function guardiasDisponibles(){
    return Math.max(0, (state.guardiasContratados||0)-guardiasAsignadosTotal());
  }
  function contratarGuardia(){
    state.guardiasContratados=(state.guardiasContratados||0)+1;
    guardarEstado();
  }
  function despedirGuardiaDisponible(){
    if(guardiasDisponibles()<=0) return false;
    state.guardiasContratados=Math.max(0,(state.guardiasContratados||0)-1);
    guardarEstado();
    return true;
  }
  function asignarGuardiaZona(zonaId){
    if(guardiasDisponibles()<=0) return false;
    if(!state.guardiasZonas) state.guardiasZonas={};
    if((state.guardiasZonas[zonaId]||0)>=3) return false;
    state.guardiasZonas[zonaId]=(state.guardiasZonas[zonaId]||0)+1;
    guardarEstado();
    return true;
  }
  function quitarGuardiaZona(zonaId){
    if(!state.guardiasZonas || !(state.guardiasZonas[zonaId]>0)) return false;
    state.guardiasZonas[zonaId]--;
    guardarEstado();
    return true;
  }
  // Se llama una vez por jornada jugada como local — las zonas sin
  // guardias van acumulando disturbios si la afición está descontenta;
  // más guardias en una zona reducen o frenan ese avance. Una zona que
  // llega a GRAVE sin ningún guardia puede estallar en disturbios de
  // verdad, con daños económicos reales.
  function procesarDisturbiosTrasPartido(){
    if(!state.disturbiosZonas) return;
    const satisfaccion=(state.estadio&&state.estadio.satisfaccion)||0;
    // Cuanto peor esté la afición, más probable que una zona sin
    // vigilancia empeore; con buena satisfacción, las zonas tienden a
    // calmarse solas con el tiempo.
    const probabilidadEmpeorar = satisfaccion<=-40 ? 0.55 : (satisfaccion<=-10 ? 0.32 : (satisfaccion<10 ? 0.12 : 0));
    // Vigilancia Extra: reduce ligeramente la probabilidad de que
    // empeore una zona sin guardias — nunca sustituye a los guardias
    // de verdad, solo la nudge un poco a favor.
    const probabilidadEmpeorarFinal = (typeof lmSkillActiva==='function' && lmSkillActiva('lm_vigilancia_extra')) ? probabilidadEmpeorar*0.8 : probabilidadEmpeorar;
    const probabilidadMejorar = satisfaccion>=10 ? 0.4 : 0.15;
    let zonaEstallada=null;
    LM_ZONAS_ESTADIO.forEach(z=>{
      const guardias=state.guardiasZonas[z.id]||0;
      let nivel=state.disturbiosZonas[z.id]||0;
      if(guardias>0){
        // Cada guardia asignado da más probabilidad de que la zona
        // mejore un nivel, y ninguna de que empeore.
        if(nivel>0 && Math.random()<0.25+guardias*0.2) nivel=Math.max(0, nivel-1);
      } else {
        if(nivel<3 && Math.random()<probabilidadEmpeorarFinal) nivel=Math.min(3, nivel+1);
        else if(nivel>0 && Math.random()<probabilidadMejorar) nivel=Math.max(0, nivel-1);
        // Una zona GRAVE, sin ningún guardia, puede estallar de verdad.
        if(nivel>=3 && !zonaEstallada && Math.random()<0.3) zonaEstallada=z;
      }
      state.disturbiosZonas[z.id]=nivel;
    });
    // Penalización a satisfacción y moral mientras haya disturbios
    // activos en cualquier zona — cuanto más graves en conjunto, más
    // castigo. Antes los disturbios solo importaban si llegaban a
    // estallar del todo; ahora ya se notan desde el nivel "leve".
    const severidadTotal = LM_ZONAS_ESTADIO.reduce((s,z)=>s+(state.disturbiosZonas[z.id]||0), 0);
    if(severidadTotal>0){
      if(!state.estadio) state.estadio={campo:90, satisfaccion:10, aforoTotal:12000, ultimaAsistencia:null};
      state.estadio.satisfaccion=Math.max(-100, state.estadio.satisfaccion-severidadTotal*1.5);
      state.moral=Math.max(-50, (state.moral||0)-severidadTotal);
    }
    if(zonaEstallada) resolverEstallidoDisturbios(zonaEstallada);
  }
  function resolverEstallidoDisturbios(zona){
    const daño=1200+Math.floor(Math.random()*2600);
    state.capital=(state.capital||0)-daño;
    registrarMovimientoFinanciero('Daños por disturbios en '+zona.label, -daño, state.jornadaActual);
    state.disturbiosZonas[zona.id]=1; // vuelve a leve tras el suceso, no a cero — el ambiente sigue algo caldeado
    enviarCorreo('mantenimiento', tp('correo.incidentes_zona.asunto', {zona:zona.label}),
      tp('correo.incidentes_zona.cuerpo', {zona:zona.label, dano:formatoDinero(daño)}),
      {asunto:'correo.incidentes_zona.asunto', paramsAsunto:{zona:zona.label}, cuerpo:'correo.incidentes_zona.cuerpo', paramsCuerpo:{zona:zona.label, dano:formatoDinero(daño)}});
  }
  const LM_RASGOS_DEFS=[
    {id:'killer', icon:'ph-target', stat:'attack', get name(){return t('rasgo.killer.nombre');}, get desc(){return t('rasgo.killer.desc');}},
    {id:'muro_defensivo', icon:'ph-shield', stat:'defense', get name(){return t('rasgo.muro_defensivo.nombre');}, get desc(){return t('rasgo.muro_defensivo.desc');}},
    {id:'velocista', icon:'ph-lightning', stat:'pace', get name(){return t('rasgo.velocista.nombre');}, get desc(){return t('rasgo.velocista.desc');}},
    {id:'lider', icon:'ph-brain', stat:'passing', get name(){return t('rasgo.lider.nombre');}, get desc(){return t('rasgo.lider.desc');}},
    {id:'especialista_balon_parado', icon:'ph-soccer-ball', stat:'technique', get name(){return t('rasgo.especialista_balon_parado.nombre');}, get desc(){return t('rasgo.especialista_balon_parado.desc');}},
    {id:'incansable', icon:'ph-battery-charging', stat:'pace', get name(){return t('rasgo.incansable.nombre');}, get desc(){return t('rasgo.incansable.desc');}},
    {id:'versatil', icon:'ph-arrows-out-cardinal', stat:null, get name(){return t('rasgo.versatil.nombre');}, get desc(){return t('rasgo.versatil.desc');}},
  ];
  function rasgoDef(id){ return LM_RASGOS_DEFS.find(r=>r.id===id); }
  // Asigna un rasgo a un jugador de la plantilla — si ya lo tenía, no
  // hace nada (nunca se duplica). Los rasgos de estadística suman +5 de
  // forma permanente, con tope en 99.
  function asignarRasgoJugador(jugadorId, rasgoId){
    const jugador=(state.plantilla||[]).find(p=>p.id===jugadorId);
    const def=rasgoDef(rasgoId);
    if(!jugador || !def) return false;
    if(!jugador.rasgos) jugador.rasgos=[];
    if(jugador.rasgos.includes(rasgoId)) return false;
    jugador.rasgos.push(rasgoId);
    if(def.stat){
      jugador[def.stat]=Math.min(99, (jugador[def.stat]||0)+5);
      // El overall del jugador se recalcula a partir de sus 5
      // estadísticas reales — así la media del equipo (que se calcula a
      // partir de esto) y su valor de venta (que usa overall
      // directamente al generar ofertas) quedan siempre al día, sin
      // quedarse con un número antiguo.
      jugador.overall=Math.round((jugador.attack+jugador.defense+jugador.pace+jugador.passing+jugador.technique)/5);
      jugador.salario=calcularSalario(jugador.overall);
    }
    guardarEstado();
    return true;
  }
  // Icono(s) de rasgo en miniatura para mostrar junto al nombre del
  // jugador en listas y en el campo.
  function rasgosIconosHTML(jugador){
    if(!jugador || !jugador.rasgos || !jugador.rasgos.length) return '';
    return jugador.rasgos.map(id=>{
      const def=rasgoDef(id);
      if(!def) return '';
      return `<i class="ph ph-bold ${def.icon} lm-rasgo-icono" title="${def.name} — ${def.desc}"></i>`;
    }).join('');
  }

  // ---- Quiniela ----
  // Cada 3 victorias llega un correo del Director General con un boletín
  // para la PRÓXIMA jornada — se eligen 1/X/2 para cada partido de la
  // ronda completa. Se resuelve en cuanto esa jornada se juega de
  // verdad, mostrándose justo después de cerrar el resultado del
  // siguiente partido: premio económico siempre, y si se acierta más de
  // la mitad, también 1-3 rasgos a repartir entre tu plantilla.
  function generarBoletoQuiniela(jornadaIndexForzado){
    // Normalmente esto se llama a mitad de jugarJornada(), antes de
    // incrementar jornadaActual — el índice 0-based de jornadaActual
    // apunta entonces a la PRÓXIMA jornada de verdad. La única
    // excepción es el regalo de bienvenida (se llama antes de jugar
    // absolutamente nada), donde se fuerza a la jornada 1 (índice 0).
    const jSiguiente = jornadaIndexForzado!==undefined ? jornadaIndexForzado : state.jornadaActual;
    if(jSiguiente>=38) return;
    const partidos=state.calendario[jSiguiente];
    if(!partidos || !partidos.length) return;
    state.quinielaBoleto={
      jornadaIndex:jSiguiente,
      partidos:partidos.map(p=>({homeId:p.home.id, homeName:p.home.name, homeCrest:p.home.crestImg||null, homeEsMio:p.home.id==='lm_0',
        awayId:p.away.id, awayName:p.away.name, awayCrest:p.away.crestImg||null, awayEsMio:p.away.id==='lm_0'})),
      predicciones:{}, rellenado:false
    };
    enviarCorreo('directorGeneral', t('lm.correo_quiniela_asunto'),
      t('lm.correo_quiniela_cuerpo'),
      {asunto:'lm.correo_quiniela_asunto', cuerpo:'lm.correo_quiniela_cuerpo'});
    const ultimo=state.correoInterno && state.correoInterno[0];
    if(ultimo){ ultimo.tipoEspecial='quiniela_lista'; }
  }
  function resultadoPartidoQuiniela(res){
    if(res.golesA>res.golesB) return '1';
    if(res.golesA<res.golesB) return '2';
    return 'X';
  }
  // El propio equipo no tiene una URL de escudo como los rivales (usa
  // state.escudo con su propio formato) — este helper elige la forma
  // correcta según quién sea, para poder mostrar SIEMPRE un escudo en
  // la quiniela, sea rival o el mío.
  function quinielaEscudoHTML(esMio, crestUrl, size){
    if(esMio) return crestHTML(state.escudo, size);
    if(crestUrl) return `<img src="${crestUrl}" alt="" style="width:${size}px;height:${size}px;object-fit:contain">`;
    return '';
  }
  // Se llama al final de cada jugarJornada() — si hay un boleto
  // rellenado esperando justo esta jornada, calcula aciertos, premio y
  // rasgos, y lo deja guardado para mostrarse en cuanto se cierre el
  // resultado del partido.
  function resolverQuinielaSiToca(jIndexJugado){
    const boleto=state.quinielaBoleto;
    if(!boleto || !boleto.rellenado || boleto.jornadaIndex!==jIndexJugado) return;
    let aciertos=0;
    const detalle=boleto.partidos.map(p=>{
      const key=jIndexJugado+'-'+p.homeId+'-'+p.awayId;
      const res=state.resultados[key];
      const real = res ? resultadoPartidoQuiniela(res) : null;
      // Con los cheats activados, la quiniela sale siempre perfecta —
      // se muestra la predicción como si hubiera acertado el resultado
      // real en todos los partidos.
      const prediccionReal=boleto.predicciones[jIndexJugado+'-'+p.homeId+'-'+p.awayId];
      const prediccion = window.CHEATS_ACTIVE ? real : prediccionReal;
      const acierto = window.CHEATS_ACTIVE ? !!real : (real && prediccionReal===real);
      if(acierto) aciertos++;
      return {...p, prediccion, real, acierto};
    });
    const total=detalle.length;
    const premio=Math.round((aciertos/total)*aciertos*3500); // crece más que proporcional cuantos más aciertas
    const rasgosGanados=[];
    if(aciertos/total>0.5){
      const numRasgos=aciertos===total?3:(aciertos/total>=0.75?2:1);
      const catalogoDisponible=LM_RASGOS_DEFS.slice();
      for(let i=0;i<numRasgos;i++){
        const elegido=catalogoDisponible.splice(Math.floor(Math.random()*catalogoDisponible.length),1)[0];
        if(elegido) rasgosGanados.push(elegido.id);
      }
    }
    state.capital=(state.capital||0)+premio;
    if(premio>0) registrarMovimientoFinanciero('Premio de quiniela ('+aciertos+'/'+total+' aciertos)', premio, state.jornadaActual);
    state.quinielaResultadoPendiente={aciertos, total, premio, rasgosGanados, detalle};
    state.quinielaBoleto=null;
    if(typeof window.unlockLMAchievement==='function') window.unlockLMAchievement('lm_first_quiniela', false);
    // Racha de quinielas perfectas (todas acertadas) seguidas — se
    // reinicia en cuanto una quiniela resuelta no es perfecta.
    if(aciertos===total && total>0){
      state.quinielaRachaPerfecta=(state.quinielaRachaPerfecta||0)+1;
      if(state.quinielaRachaPerfecta>=3 && typeof window.unlockLMAchievement==='function') window.unlockLMAchievement('lm_quiniela_streak', false);
    } else {
      state.quinielaRachaPerfecta=0;
    }
    guardarEstado();
  }
  function abrirBoletoQuiniela(){
    const boleto=state.quinielaBoleto;
    if(!boleto || boleto.rellenado) return;
    const overlay=document.createElement('div');
    overlay.id='lmQuinielaOverlay';
    function pintar(){
      const todasRellenas=boleto.partidos.every(p=>boleto.predicciones[boleto.jornadaIndex+'-'+p.homeId+'-'+p.awayId]);
      overlay.innerHTML=`
        <div class="lm-dilemma-card lm-quiniela-card">
          ${xCerrarHTML()}
          <div class="lm-quiniela-header">
            <i class="ph ph-bold ph-ticket"></i>
            <div><div class="lm-quiniela-titulo">${t('lm.quiniela_titulo')} ${boleto.jornadaIndex+1}</div><div class="lm-quiniela-subtitulo">${t('lm.quiniela_subtitulo')}</div></div>
          </div>
          <div class="lm-quiniela-lista">
            ${boleto.partidos.map((p,i)=>{
              const key=boleto.jornadaIndex+'-'+p.homeId+'-'+p.awayId;
              const elegido=boleto.predicciones[key];
              // Blindaje final, en el propio pintado: si por lo que
              // sea los dos nombres coinciden exactos (con IDs
              // distintos), se distingue aquí mismo, en el momento de
              // mostrarlo — así es imposible que la interfaz llegue a
              // enseñar "X vs X", pase lo que pase con el dato de
              // origen o con cualquier reparación anterior.
              let nombreLocalMostrado=p.homeName, nombreVisitanteMostrado=p.awayName;
              if(p.homeName && p.awayName
                 && p.homeName.trim().toLowerCase()===p.awayName.trim().toLowerCase()){
                if(p.homeEsMio) nombreVisitanteMostrado=p.awayName.trim()+' (2)';
                else nombreLocalMostrado=p.homeName.trim()+' (2)';
              }
              return `<div class="lm-quiniela-fila">
                <div class="lm-quiniela-equipo lm-quiniela-equipo-local">${quinielaEscudoHTML(p.homeEsMio, p.homeCrest, 26)}<span>${nombreLocalMostrado}</span></div>
                <div class="lm-quiniela-opciones">
                  <button class="lm-quiniela-btn ${elegido==='1'?'lm-quiniela-btn-activa':''}" data-qk="${key}" data-qv="1">1</button>
                  <button class="lm-quiniela-btn ${elegido==='X'?'lm-quiniela-btn-activa':''}" data-qk="${key}" data-qv="X">X</button>
                  <button class="lm-quiniela-btn ${elegido==='2'?'lm-quiniela-btn-activa':''}" data-qk="${key}" data-qv="2">2</button>
                </div>
                <div class="lm-quiniela-equipo lm-quiniela-equipo-visitante"><span>${nombreVisitanteMostrado}</span>${quinielaEscudoHTML(p.awayEsMio, p.awayCrest, 26)}</div>
              </div>`;
            }).join('')}
          </div>
          <div id="lmQuinielaAviso" class="lm-quiniela-aviso" style="display:none">${t('lm.quiniela_incompleta')}</div>
          <div class="lm-popup-actions"><button id="lmQuinielaConfirmar" class="mode-card-btn mode-card-btn-gold">${t('lm.confirmar_quiniela')}</button></div>
        </div>`;
      overlay.querySelectorAll('[data-qk]').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          if(typeof window.playSound==='function') window.playSound('select');
          boleto.predicciones[btn.getAttribute('data-qk')]=btn.getAttribute('data-qv');
          pintar();
        });
      });
      const confirmar=document.getElementById('lmQuinielaConfirmar');
      if(confirmar) confirmar.addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        if(!todasRellenas){
          const aviso=document.getElementById('lmQuinielaAviso');
          if(aviso) aviso.style.display='block';
          return;
        }
        boleto.rellenado=true;
        guardarEstado();
        overlay.remove();
        render();
      });
      habilitarCierreOverlay(overlay, ()=>overlay.remove());
      const xBtn=overlay.querySelector('[data-cerrar-x]');
      if(xBtn) xBtn.addEventListener('click', ()=>overlay.remove());
    }
    document.getElementById('ligaManagerScreen').appendChild(overlay);
    pintar();
  }
  // Muestra el resultado de la quiniela (premio + rasgos) si hay uno
  // pendiente — se llama justo después de cerrar la ventana de
  // resultado del partido siguiente, tal como se pidió.
  function mostrarResolucionQuinielaSiToca(){
    const r=state.quinielaResultadoPendiente;
    if(!r) return;
    state.quinielaResultadoPendiente=null;
    guardarEstado();
    const overlay=document.createElement('div');
    overlay.id='lmQuinielaResultadoOverlay';
    const exito=r.aciertos/r.total>0.5;
    const jugadoresElegibles=(state.plantilla||[]);
    overlay.innerHTML=`
      <div class="lm-dilemma-card lm-quiniela-resultado-card">
        <div class="lm-quiniela-resultado-header ${exito?'lm-quiniela-resultado-exito':''}">
          <i class="ph ph-bold ph-ticket"></i>
          <div class="lm-quiniela-resultado-titulo">${t('lm.resultado_quiniela')}</div>
          <div class="lm-quiniela-resultado-aciertos">${r.aciertos}<span>/${r.total} ${t('lm.aciertos')}</span></div>
        </div>
        <div class="lm-quiniela-premio-box">
          <i class="ph ph-bold ph-coins"></i>
          <div><div class="lm-quiniela-premio-val">${formatoDinero(r.premio)}</div><div class="lm-quiniela-premio-label">${t('lm.premio_economico')}</div></div>
        </div>
        <div class="lm-quiniela-detalle-lista">
          ${r.detalle.map(d=>`
            <div class="lm-quiniela-detalle-fila ${d.acierto?'lm-quiniela-detalle-acierto':'lm-quiniela-detalle-fallo'}">
              <i class="ph ph-bold ${d.acierto?'ph-check-circle':'ph-x-circle'}"></i>
              <div class="lm-quiniela-detalle-equipos">
                <span class="lm-quiniela-detalle-equipo">${quinielaEscudoHTML(d.homeEsMio, d.homeCrest, 22)}${d.homeName}</span>
                <span class="lm-quiniela-detalle-vs">vs</span>
                <span class="lm-quiniela-detalle-equipo">${d.awayName}${quinielaEscudoHTML(d.awayEsMio, d.awayCrest, 22)}</span>
              </div>
              <div class="lm-quiniela-detalle-pronosticos">
                <span class="lm-quiniela-detalle-tu">${t('lm.quiniela_tu')}: <strong>${d.prediccion}</strong></span>
                <span class="lm-quiniela-detalle-real">${t('lm.quiniela_real')}: <strong>${d.real}</strong></span>
              </div>
            </div>`).join('')}
        </div>
        ${r.rasgosGanados.length?`
        <div class="lm-quiniela-rasgos-titulo"><i class="ph ph-bold ph-sparkle"></i> ${t('lm.mas_mitad_acertados')} ${r.rasgosGanados.length} ${r.rasgosGanados.length>1?t('lm.rasgos_plural'):t('lm.rasgo_singular')}</div>
        <div class="lm-quiniela-rasgos-lista">
          ${r.rasgosGanados.map((rid,i)=>{
            const def=rasgoDef(rid);
            return `<div class="lm-rasgo-card">
              <i class="ph ph-bold ${def.icon}"></i>
              <div class="lm-rasgo-card-nombre">${def.name}</div>
              <div class="lm-rasgo-card-desc">${def.desc}</div>
              <select class="lm-rasgo-select" data-rasgo-idx="${i}" data-rasgo-id="${rid}">
                <option value="">${t('lm.elige_jugador')}</option>
                ${jugadoresElegibles.map(p=>`<option value="${p.id}" ${p.rasgos&&p.rasgos.includes(rid)?'disabled':''}>${p.name}${p.rasgos&&p.rasgos.includes(rid)?' '+t('lm.ya_lo_tiene'):''}</option>`).join('')}
              </select>
            </div>`;
          }).join('')}
        </div>` : ''}
        <div class="lm-popup-actions"><button id="lmQuinielaResultadoCerrar" class="mode-card-btn mode-card-btn-gold">${t('lm.continuar')}</button></div>
      </div>`;
    document.getElementById('ligaManagerScreen').appendChild(overlay);
    overlay.querySelectorAll('.lm-rasgo-select').forEach(sel=>{
      sel.addEventListener('change', ()=>{
        if(sel.value){
          asignarRasgoJugador(sel.value, sel.getAttribute('data-rasgo-id'));
          if(typeof window.playSound==='function') window.playSound('select');
          Array.from(sel.options).forEach(o=>{ if(o.value===sel.value) o.textContent=o.textContent.replace(' (ya lo tiene)','')+' ✔'; });
          sel.disabled=true;
        }
      });
    });
    document.getElementById('lmQuinielaResultadoCerrar').addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      overlay.remove();
      render();
    });
  }
  // ---- Sistema de mejoras (GOAT Points) de Liga Manager ----
  // Comparte la MISMA moneda que Copa Leyendas (scratchPoints, en
  // Firestore users/{uid}) pero los niveles comprados se guardan por
  // separado (users/{uid}.ligaManagerUpgrades) — gastar puntos aquí no
  // añade ni quita niveles a las mejoras de Copa Leyendas, y viceversa.
  const LM_UPGRADE_DEFS=[
    {id:'lm_bench', phIcon:'ph-users-three', get name(){return t('mejora.bench.nombre');}, get desc(){return t('mejora.bench.desc');},
      baseCost:5, maxLevel:5, baseValue:5, tooltip:(lvl)=>t('mejora.bench.tooltip').replace('{n}', 5+lvl)},
    {id:'lm_dice', phIcon:'ph-dice-five', get name(){return t('mejora.dice.nombre');}, get desc(){return t('mejora.dice.desc');},
      baseCost:5, maxLevel:5, baseValue:5, tooltip:(lvl)=>t('mejora.dice.tooltip').replace('{n}', 5+lvl)},
    {id:'lm_rerolls', phIcon:'ph-arrows-clockwise', get name(){return t('mejora.rerolls.nombre');}, get desc(){return t('mejora.rerolls.desc');},
      baseCost:5, maxLevel:5, baseValue:1, tooltip:(lvl)=>t('mejora.rerolls.tooltip').replace('{n}', 1+lvl).replace('{s}', lvl?'s':'')},
    {id:'lm_cardswap', phIcon:'ph-cards', get name(){return t('mejora.cardswap.nombre');}, get desc(){return t('mejora.cardswap.desc');},
      baseCost:5, maxLevel:3, baseValue:1, tooltip:(lvl)=>t('mejora.cardswap.tooltip').replace('{n}', 1+lvl).replace('{s}', lvl>0?'s':'')},
    {id:'lm_sobredescuento', phIcon:'ph-percent', get name(){return t('mejora.sobredescuento.nombre');}, get desc(){return t('mejora.sobredescuento.desc');},
      baseCost:5, maxLevel:5, baseValue:0, tooltip:(lvl)=>lvl===0?t('mejora.sin_descuento'):t('mejora.sobredescuento.tooltip').replace('{n}', lvl*10)},
    {id:'lm_girotactico', phIcon:'ph-notebook', get name(){return t('mejora.girotactico.nombre');}, get desc(){return t('mejora.girotactico.desc');},
      baseCost:5, maxLevel:5, baseValue:5, tooltip:(lvl)=>t('mejora.girotactico.tooltip').replace('{n}', 5+lvl)},
  ];
  function lmUpgradeLevelCost(def, toLevel){ return def.baseCost*Math.pow(2, toLevel-1); }
  function lmNivelMejora(id){ return (window._lmUpgradeCache && window._lmUpgradeCache[id]) || 0; }
  function lmMaxBanquillo(){ return LM_UPGRADE_DEFS[0].baseValue + lmNivelMejora('lm_bench'); }
  function lmDicePoolPorPartido(){ return LM_UPGRADE_DEFS[1].baseValue + lmNivelMejora('lm_dice'); }
  function lmRerollsPorPartido(){ return LM_UPGRADE_DEFS[2].baseValue + lmNivelMejora('lm_rerolls'); }
  function lmCambiosCartaPorPartido(){ return LM_UPGRADE_DEFS[3].baseValue + lmNivelMejora('lm_cardswap'); }
  function lmDescuentoSobres(){ return lmNivelMejora('lm_sobredescuento')*0.10; } // 0, .10, .20, .30, .40, .50
  // Usos de Giro Táctico disponibles por CADA media temporada (19
  // jornadas): 5 de base, +1 por cada nivel de la mejora "Plan de
  // Giro Táctico" comprada aquí mismo, con puntos desde el menú de
  // perfil — igual que el resto de mejoras de Liga Manager, nunca una
  // carta del Director General.
  function getMaxGiroTacticoLM(){ return 5 + lmNivelMejora('lm_girotactico') + (lmSkillActiva('lm_ultimo_cartucho')?1:0); }
  async function lmCargarUpgradeCache(){
    try{
      const user=window._fbAuth && window._fbAuth.currentUser;
      if(!user){ window._lmUpgradeCache={}; return; }
      const snap=await window._fbDb.collection('users').doc(user.uid).get();
      const data=snap.exists?snap.data():{};
      window._lmUpgradeCache=data.ligaManagerUpgrades||{};
      window._lmScratchPoints=data.scratchPoints||0;
    }catch(e){ window._lmUpgradeCache=window._lmUpgradeCache||{}; }
  }
  // Evita el salto de scroll al principio que ocurría cada vez que se
  // pulsaba un botón en las pestañas de mejoras/logros/habilidades del
  // perfil: al vaciar la lista para mostrar "Cargando..." antes de
  // reconstruirla, el contenedor se quedaba momentáneamente muy bajo
  // de altura y el navegador recortaba el scroll a 0 — al reconstruir
  // el contenido completo, esa posición ya no se restauraba sola.
  // Aquí se guarda el scroll del panel ANTES y se reaplica DESPUÉS.
  async function reRenderPanelConservandoScroll(paneId, renderFn){
    const pane=document.getElementById(paneId);
    const scrollPrevio=pane?pane.scrollTop:0;
    await renderFn();
    if(pane) pane.scrollTop=scrollPrevio;
  }
  async function renderLigaManagerUpgradesTab(){
    await reRenderPanelConservandoScroll('lmProfileUpgradesPane', renderLigaManagerUpgradesTabImpl);
  }
  async function renderLigaManagerUpgradesTabImpl(){
    const list=document.getElementById('lmUpgradesList');
    const pointsEl=document.getElementById('lmUpgradePointsDisplay');
    if(!list) return;
    list.innerHTML=`<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:12px">${t('lm.cargando')}</div>`;
    await lmCargarUpgradeCache();
    const user=window._fbAuth && window._fbAuth.currentUser;
    if(!user){
      list.innerHTML=`<div style="text-align:center;padding:20px;color:var(--text-muted)">${t('lm.inicia_sesion_mejoras')}</div>`;
      return;
    }
    let currentPts=window._lmScratchPoints||0;
    if(pointsEl) pointsEl.textContent=currentPts;
    list.innerHTML='';
    LM_UPGRADE_DEFS.forEach(def=>{
      const currentLevel=lmNivelMejora(def.id);
      const nextCost=currentLevel<def.maxLevel ? lmUpgradeLevelCost(def, currentLevel+1) : null;
      const prevRefund=currentLevel>0 ? lmUpgradeLevelCost(def, currentLevel) : null;
      const canUpgrade=nextCost!==null && currentPts>=nextCost;
      const canDowngrade=currentLevel>0;
      const bars=Array.from({length:def.maxLevel},(_,i)=>`<div class="upgrade-bar ${i<currentLevel?'filled':''}"></div>`).join('');
      const costHtml=nextCost!==null ? `<span class="cost-star">★</span>${nextCost}` : `<span style="font-size:9px;color:var(--text-muted);letter-spacing:1px">MAX</span>`;
      const row=document.createElement('div');
      row.className='upgrade-row';
      row.id=`lm-upgrade-row-${def.id}`;
      row.innerHTML=`
        <div class="upgrade-row-top">
          <div class="upgrade-icon" style="color:var(--accent);font-size:22px;display:flex;align-items:center;justify-content:center"><i class="ph ph-bold ${def.phIcon}"></i></div>
          <div class="upgrade-label-block">
            <div class="upgrade-name">${def.name}</div>
            <div class="upgrade-desc">${def.desc}</div>
          </div>
          <div class="upgrade-value-pill">${def.tooltip(currentLevel)}</div>
        </div>
        <div class="upgrade-row-bottom">
          <div class="upgrade-bars">${bars}</div>
          <div class="upgrade-controls">
            <div class="upgrade-cost-badge">${costHtml}</div>
            <button class="upgrade-btn minus" data-lmid="${def.id}" title="Recuperar ${prevRefund||0} pts" ${canDowngrade?'':'disabled'}>−</button>
            <button class="upgrade-btn plus" data-lmid="${def.id}" title="Coste: ${nextCost||0} pts" ${canUpgrade?'':'disabled'}>+</button>
          </div>
        </div>`;
      list.appendChild(row);
    });
    list.querySelectorAll('.upgrade-btn').forEach(btn=>{
      btn.addEventListener('click', async ()=>{
        const id=btn.getAttribute('data-lmid');
        const def=LM_UPGRADE_DEFS.find(d=>d.id===id);
        if(!def) return;
        const currentLevel=lmNivelMejora(id);
        const esCompra=btn.classList.contains('plus');
        if(typeof window.playSound==='function') window.playSound('select');
        if(esCompra){
          if(currentLevel>=def.maxLevel) return;
          const cost=lmUpgradeLevelCost(def, currentLevel+1);
          if((window._lmScratchPoints||0)<cost) return;
          window._lmUpgradeCache[id]=currentLevel+1;
          window._lmScratchPoints=(window._lmScratchPoints||0)-cost;
          if(typeof window.unlockLMAchievement==='function') window.unlockLMAchievement('lm_first_upgrade', false);
        } else {
          if(currentLevel<=0) return;
          const refund=lmUpgradeLevelCost(def, currentLevel);
          window._lmUpgradeCache[id]=currentLevel-1;
          window._lmScratchPoints=(window._lmScratchPoints||0)+refund;
        }
        try{
          const u=window._fbAuth && window._fbAuth.currentUser;
          if(u) await window._fbDb.collection('users').doc(u.uid).set({ligaManagerUpgrades:window._lmUpgradeCache, scratchPoints:window._lmScratchPoints}, {merge:true});
        }catch(e){}
        renderLigaManagerUpgradesTab();
      });
    });
  }
  window.renderLigaManagerUpgradesTab = renderLigaManagerUpgradesTab;

  // ---- Logros de Liga Manager ----
  // Catálogo propio (no comparte progreso con los de Copa Leyendas),
  // pero desbloquearlos SÍ suma a los mismos GOAT Points compartidos.
  const LM_TIER_COLOR={'básico':'#7bbf7b','intermedio':'#5b9bd5','difícil':'#c9a227','mítico':'#e67e22'};
  const LM_ACHIEVEMENT_DEFS=[
    {id:'lm_first_match',    tier:'básico', pts:1, icon:'ph-megaphone',      get name(){return t('lmach.first_match.nombre');}, get desc(){return t('lmach.first_match.desc');}},
    {id:'lm_first_win',      tier:'básico', pts:1, icon:'ph-trophy',         get name(){return t('lmach.first_win.nombre');}, get desc(){return t('lmach.first_win.desc');}},
    {id:'lm_first_sobre',    tier:'básico', pts:1, icon:'ph-envelope-open',  get name(){return t('lmach.first_sobre.nombre');}, get desc(){return t('lmach.first_sobre.desc');}},
    {id:'lm_first_sale',     tier:'básico', pts:1, icon:'ph-handshake',      get name(){return t('lmach.first_sale.nombre');}, get desc(){return t('lmach.first_sale.desc');}},
    {id:'lm_first_worker',   tier:'básico', pts:1, icon:'ph-user-plus',      get name(){return t('lmach.first_worker.nombre');}, get desc(){return t('lmach.first_worker.desc');}},
    {id:'lm_clean_sheet',    tier:'básico', pts:1, icon:'ph-shield-check',   get name(){return t('lmach.clean_sheet.nombre');}, get desc(){return t('lmach.clean_sheet.desc');}},
    {id:'lm_win_streak_3',   tier:'intermedio', pts:2, icon:'ph-trend-up',   get name(){return t('lmach.win_streak_3.nombre');}, get desc(){return t('lmach.win_streak_3.desc');}},
    {id:'lm_star_signing',   tier:'intermedio', pts:2, icon:'ph-star',       get name(){return t('lmach.star_signing.nombre');}, get desc(){return t('lmach.star_signing.desc');}},
    {id:'lm_top4',           tier:'intermedio', pts:2, icon:'ph-medal',      get name(){return t('lmach.top4.nombre');}, get desc(){return t('lmach.top4.desc');}},
    {id:'lm_win_10',         tier:'intermedio', pts:2, icon:'ph-soccer-ball', get name(){return t('lmach.win_10.nombre');}, get desc(){return t('lmach.win_10.desc');}},
    {id:'lm_season_complete',tier:'difícil', pts:3, icon:'ph-flag-checkered', get name(){return t('lmach.season_complete.nombre');}, get desc(){return t('lmach.season_complete.desc');}},
    {id:'lm_champion',       tier:'mítico', pts:5, icon:'ph-crown',          get name(){return t('lmach.champion.nombre');}, get desc(){return t('lmach.champion.desc');}},
    // --- Nuevos (esta ronda): 24 logros más, triplicando el total ---
    {id:'lm_first_goal',     tier:'básico', pts:1, icon:'ph-soccer-ball',    get name(){return t('lmach.first_goal.nombre');}, get desc(){return t('lmach.first_goal.desc');}},
    {id:'lm_first_defeat',   tier:'básico', pts:1, icon:'ph-thumbs-down',    get name(){return t('lmach.first_defeat.nombre');}, get desc(){return t('lmach.first_defeat.desc');}},
    {id:'lm_first_draw',     tier:'básico', pts:1, icon:'ph-equals',         get name(){return t('lmach.first_draw.nombre');}, get desc(){return t('lmach.first_draw.desc');}},
    {id:'lm_first_injury',   tier:'básico', pts:1, icon:'ph-first-aid-kit',  get name(){return t('lmach.first_injury.nombre');}, get desc(){return t('lmach.first_injury.desc');}},
    {id:'lm_first_upgrade',  tier:'básico', pts:1, icon:'ph-trend-up',       get name(){return t('lmach.first_upgrade.nombre');}, get desc(){return t('lmach.first_upgrade.desc');}},
    {id:'lm_first_training', tier:'básico', pts:1, icon:'ph-barbell',        get name(){return t('lmach.first_training.nombre');}, get desc(){return t('lmach.first_training.desc');}},
    {id:'lm_first_quiniela', tier:'básico', pts:1, icon:'ph-ticket',         get name(){return t('lmach.first_quiniela.nombre');}, get desc(){return t('lmach.first_quiniela.desc');}},
    {id:'lm_first_sponsor',  tier:'básico', pts:1, icon:'ph-handshake',      get name(){return t('lmach.first_sponsor.nombre');}, get desc(){return t('lmach.first_sponsor.desc');}},
    {id:'lm_5_wins',         tier:'intermedio', pts:2, icon:'ph-fire',       get name(){return t('lmach.5_wins.nombre');}, get desc(){return t('lmach.5_wins.desc');}},
    {id:'lm_10_goals',       tier:'intermedio', pts:2, icon:'ph-target',     get name(){return t('lmach.10_goals.nombre');}, get desc(){return t('lmach.10_goals.desc');}},
    {id:'lm_no_injuries_month', tier:'intermedio', pts:2, icon:'ph-heart',   get name(){return t('lmach.no_injuries_month.nombre');}, get desc(){return t('lmach.no_injuries_month.desc');}},
    {id:'lm_full_stadium',   tier:'intermedio', pts:2, icon:'ph-users-three',    get name(){return t('lmach.full_stadium.nombre');}, get desc(){return t('lmach.full_stadium.desc');}},
    {id:'lm_quiniela_streak', tier:'intermedio', pts:2, icon:'ph-brain',     get name(){return t('lmach.quiniela_streak.nombre');}, get desc(){return t('lmach.quiniela_streak.desc');}},
    {id:'lm_5_signings',     tier:'intermedio', pts:2, icon:'ph-arrows-left-right', get name(){return t('lmach.5_signings.nombre');}, get desc(){return t('lmach.5_signings.desc');}},
    {id:'lm_max_level_dept', tier:'intermedio', pts:2, icon:'ph-graduation-cap', get name(){return t('lmach.max_level_dept.nombre');}, get desc(){return t('lmach.max_level_dept.desc');}},
    {id:'lm_positive_balance', tier:'intermedio', pts:2, icon:'ph-bank',     get name(){return t('lmach.positive_balance.nombre');}, get desc(){return t('lmach.positive_balance.desc');}},
    {id:'lm_undefeated_5',   tier:'difícil', pts:3, icon:'ph-shield-check',   get name(){return t('lmach.undefeated_5.nombre');}, get desc(){return t('lmach.undefeated_5.desc');}},
    {id:'lm_all_departments', tier:'difícil', pts:3, icon:'ph-users-three',  get name(){return t('lmach.all_departments.nombre');}, get desc(){return t('lmach.all_departments.desc');}},
    {id:'lm_stadium_max',    tier:'difícil', pts:3, icon:'ph-buildings',     get name(){return t('lmach.stadium_max.nombre');}, get desc(){return t('lmach.stadium_max.desc');}},
    {id:'lm_20_wins',        tier:'difícil', pts:3, icon:'ph-trophy',        get name(){return t('lmach.20_wins.nombre');}, get desc(){return t('lmach.20_wins.desc');}},
    {id:'lm_top_half',       tier:'difícil', pts:3, icon:'ph-chart-bar',     get name(){return t('lmach.top_half.nombre');}, get desc(){return t('lmach.top_half.desc');}},
    {id:'lm_all_skills',     tier:'difícil', pts:3, icon:'ph-lightning',     get name(){return t('lmach.all_skills.nombre');}, get desc(){return t('lmach.all_skills.desc');}},
    {id:'lm_perfect_season', tier:'mítico', pts:5, icon:'ph-sparkle',        get name(){return t('lmach.perfect_season.nombre');}, get desc(){return t('lmach.perfect_season.desc');}},
    {id:'lm_dynasty',        tier:'mítico', pts:5, icon:'ph-medal-military',   get name(){return t('lmach.dynasty.nombre');}, get desc(){return t('lmach.dynasty.desc');}},
    // --- Nuevos (esta ronda): ligados al Giro Táctico y a momentos
    // dramáticos de partido que antes no tenían ningún logro asociado.
    {id:'lm_giro_primera_vez', tier:'básico', pts:1, icon:'ph-arrows-clockwise', get name(){return t('lmach.giro_primera_vez.nombre');}, get desc(){return t('lmach.giro_primera_vez.desc');}},
    {id:'lm_giro_remontada', tier:'intermedio', pts:2, icon:'ph-arrow-u-up-left', get name(){return t('lmach.giro_remontada.nombre');}, get desc(){return t('lmach.giro_remontada.desc');}},
    {id:'lm_giro_agotado',   tier:'intermedio', pts:2, icon:'ph-battery-warning', get name(){return t('lmach.giro_agotado.nombre');}, get desc(){return t('lmach.giro_agotado.desc');}},
    {id:'lm_gol_ultimo_minuto', tier:'intermedio', pts:2, icon:'ph-clock-countdown', get name(){return t('lmach.gol_ultimo_minuto.nombre');}, get desc(){return t('lmach.gol_ultimo_minuto.desc');}},
    {id:'lm_canterano_joya', tier:'intermedio', pts:2, icon:'ph-diamond', get name(){return t('lmach.canterano_joya.nombre');}, get desc(){return t('lmach.canterano_joya.desc');}},
    {id:'lm_fenix_liga',     tier:'difícil', pts:3, icon:'ph-fire-simple', get name(){return t('lmach.fenix_liga.nombre');}, get desc(){return t('lmach.fenix_liga.desc');}},
    {id:'lm_giro_leyenda',   tier:'mítico', pts:5, icon:'ph-crown-simple', get name(){return t('lmach.giro_leyenda.nombre');}, get desc(){return t('lmach.giro_leyenda.desc');}},
  ];
  async function unlockLMAchievement(id, mostrarInmediatamente){
    if(mostrarInmediatamente===undefined) mostrarInmediatamente=true;
    if(!window._lmAchievementsCache) window._lmAchievementsCache=new Set();
    if(window._lmAchievementsCache.has(id)) return;
    const user=window._fbAuth && window._fbAuth.currentUser;
    if(!user) return;
    const def=LM_ACHIEVEMENT_DEFS.find(a=>a.id===id);
    if(!def) return;
    window._lmAchievementsCache.add(id);
    try{
      const snap=await window._fbDb.collection('users').doc(user.uid).get();
      const d=snap.exists?snap.data():{};
      const current=d.ligaManagerAchievements||[];
      if(current.includes(id)) return;
      const newPts=(d.scratchPoints||0)+def.pts;
      await window._fbDb.collection('users').doc(user.uid).set({
        ligaManagerAchievements:[...current,id],
        scratchPoints:newPts,
        scratchPointsEarned:(d.scratchPointsEarned||0)+def.pts
      },{merge:true});
      window._lmScratchPoints=newPts;
      if(mostrarInmediatamente){
        if(typeof window.showAchievementToast==='function') window.showAchievementToast(def);
      } else {
        if(!window._lmLogrosParaMostrar) window._lmLogrosParaMostrar=[];
        window._lmLogrosParaMostrar.push(def);
      }
      const lab=document.getElementById('lmAchievementsBadge');
      if(lab) lab.style.display='inline-block';
    }catch(e){ console.warn('LM achievement error:', e); }
  }
  window.unlockLMAchievement = unlockLMAchievement;
  // Expuesta globalmente para que liga-manager-partido-visor.js (otro
  // archivo) pueda consultar habilidades activas al ofrecer el Giro
  // Táctico — mismo patrón que unlockLMAchievement, justo arriba.
  window.lmSkillActiva = lmSkillActiva;
  // Los logros conseguidos DURANTE la simulación de un partido no se
  // muestran al instante (podrían chivar el resultado antes de que el
  // jugador vea la animación) — se guardan en cola y se sueltan aquí,
  // justo después de cerrar la ventana de resultado del partido.
  function mostrarLogrosPendientes(){
    const pendientes=window._lmLogrosParaMostrar;
    if(!pendientes || !pendientes.length) return;
    window._lmLogrosParaMostrar=[];
    pendientes.forEach((def,i)=>{
      setTimeout(()=>{
        if(typeof window.showAchievementToast==='function') window.showAchievementToast(def);
      }, i*1400);
    });
  }
  async function renderLigaManagerAchievementsTab(){
    await reRenderPanelConservandoScroll('lmProfileAchievementsPane', renderLigaManagerAchievementsTabImpl);
  }
  async function renderLigaManagerAchievementsTabImpl(){
    const list=document.getElementById('lmAchievementsList');
    if(!list) return;
    list.innerHTML=`<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:12px">${t('lm.cargando')}</div>`;
    const user=window._fbAuth && window._fbAuth.currentUser;
    if(!user){ list.innerHTML=`<div style="text-align:center;padding:20px;color:var(--text-muted)">${t('lm.inicia_sesion_logros')}</div>`; return; }
    const snap=await window._fbDb.collection('users').doc(user.uid).get();
    const unlocked=new Set((snap.exists && snap.data().ligaManagerAchievements)||[]);
    window._lmAchievementsCache=unlocked;
    const total=LM_ACHIEVEMENT_DEFS.length;
    const done=[...unlocked].filter(id=>LM_ACHIEVEMENT_DEFS.find(a=>a.id===id)).length;
    const countBadge=document.getElementById('lmAchievementsCountDisplay');
    if(countBadge) countBadge.textContent=`${done}/${total}`;
    list.innerHTML='';
    list.style.paddingRight='12px';
    const progress=document.createElement('div');
    progress.style.cssText='display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;font-family:"Bebas Neue",Impact,sans-serif';
    progress.innerHTML=`<span style="font-size:13px;color:var(--text-muted);letter-spacing:1px">${done} / ${total} LOGROS</span>
      <span style="font-size:13px;color:var(--gold)">${LM_ACHIEVEMENT_DEFS.filter(a=>unlocked.has(a.id)).reduce((s,a)=>s+a.pts,0)} PTS GANADOS</span>`;
    list.appendChild(progress);
    const resetBtn=document.createElement('button');
    resetBtn.textContent='REINICIAR MIS LOGROS';
    resetBtn.style.cssText='display:block;margin:0 0 12px;padding:6px 10px;font-size:10px;letter-spacing:1px;background:transparent;border:1px solid var(--line);color:var(--text-muted);cursor:pointer;font-family:"Bebas Neue",Impact,sans-serif';
    resetBtn.addEventListener('click', async ()=>{
      if(!confirm('¿Seguro que quieres reiniciar todos tus logros de Liga Manager? Los puntos ya ganados no se descuentan, solo se vuelve a marcar todo como bloqueado.')) return;
      try{
        await window._fbDb.collection('users').doc(user.uid).set({ligaManagerAchievements:[]}, {merge:true});
        window._lmAchievementsCache=new Set();
        renderLigaManagerAchievementsTab();
      }catch(e){ console.error(e); }
    });
    list.appendChild(resetBtn);
    const grid=document.createElement('div');
    grid.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:6px;padding-right:4px';
    list.appendChild(grid);
    LM_ACHIEVEMENT_DEFS.forEach(def=>{
      const isUnlocked=unlocked.has(def.id);
      const isLight=document.body.classList.contains('light-theme');
      const card=document.createElement('div');
      const lockedBg=isLight?'#ede8df':'#1a1e20';
      const unlockedBg=isLight?'#e8f4ec':'rgba(0,0,0,.3)';
      const borderColor=isUnlocked?LM_TIER_COLOR[def.tier]:(isLight?'#d4cec4':'var(--line)');
      card.style.cssText='display:flex;align-items:center;gap:10px;padding:10px;border:1px solid '+borderColor+';background:'+(isUnlocked?unlockedBg:lockedBg)+';position:relative;overflow:hidden';
      const iconColor=isUnlocked?'#c9a227':(isLight?'#bbb':'var(--text-muted)');
      const iconHtml='<i class="ph ph-bold '+def.icon+'" style="font-size:26px;flex-shrink:0;color:'+iconColor+';'+(isUnlocked?'':' opacity:.5')+'"></i>';
      const checkHtml=isUnlocked?'<i class="ph ph-bold ph-check" style="position:absolute;top:5px;right:6px;font-size:12px;color:'+(LM_TIER_COLOR[def.tier]||'#c9a227')+'"></i>':'';
      const tierColor=LM_TIER_COLOR[def.tier]||'#aaa';
      const nameColor=isUnlocked?(isLight?'#1a1a1a':'#fff'):(isLight?'#333':'var(--text-muted)');
      const descColor=isUnlocked?(isLight?'#444':'#aaa'):(isLight?'#666':'var(--text-muted)');
      card.innerHTML=iconHtml+checkHtml+
        '<div style="min-width:0;flex:1">'+
        '<div style="font-size:12px;letter-spacing:.8px;color:'+nameColor+';line-height:1.2;font-weight:700">'+def.name+'</div>'+
        '<div style="font-size:11px;color:'+descColor+';line-height:1.4;margin-top:2px">'+def.desc+'</div>'+
        '<div style="font-size:9px;color:'+tierColor+';letter-spacing:1px;margin-top:3px">'+t('lmach.tier.'+def.tier)+'</div>'+
        '</div>';
      grid.appendChild(card);
    });
    const lab=document.getElementById('lmAchievementsBadge');
    if(lab) lab.style.display='none';
  }
  window.renderLigaManagerAchievementsTab = renderLigaManagerAchievementsTab;

  // ---- Habilidades de Liga Manager ----
  // Se activan/desactivan (no tienen niveles), igual que en Copa
  // Leyendas — comparten la misma moneda (scratchPoints) pero se
  // guardan en un campo propio (ligaManagerSkills) que no interfiere
  // con las habilidades de Copa Leyendas.
  const LM_SKILL_DEFS=[
    {id:'lm_mentalidad_ganadora', get category(){return t('skill.categoria_tactica');}, get name(){return t('skill.mentalidad_ganadora.nombre');}, cost:35, phIcon:'ph-trend-up',
      get tooltip(){return t('skill.mentalidad_ganadora.tooltip');}},
    {id:'lm_revancha', get category(){return t('skill.categoria_tactica');}, get name(){return t('skill.revancha.nombre');}, cost:35, phIcon:'ph-arrow-clockwise',
      get tooltip(){return t('skill.revancha.tooltip');}},
    {id:'lm_factor_campo', get category(){return t('skill.categoria_tactica');}, get name(){return t('skill.factor_campo.nombre');}, cost:30, phIcon:'ph-house',
      get tooltip(){return t('skill.factor_campo.tooltip');}},
    {id:'lm_meteorologo', get category(){return t('skill.categoria_gestion');}, get name(){return t('skill.meteorologo.nombre');}, cost:30, phIcon:'ph-cloud-sun',
      get tooltip(){return t('skill.meteorologo.tooltip');}},
    {id:'lm_temple_competitivo', get category(){return t('skill.categoria_gestion');}, get name(){return t('skill.temple_competitivo.nombre');}, cost:30, phIcon:'ph-shield-star',
      get tooltip(){return t('skill.temple_competitivo.tooltip');}},
    {id:'lm_contraataque_letal', get category(){return t('skill.categoria_gestion');}, get name(){return t('skill.contraataque_letal.nombre');}, cost:35, phIcon:'ph-lightning',
      get tooltip(){return t('skill.contraataque_letal.tooltip');}},
    // --- Nuevas (esta ronda): 6 habilidades más, doblando el total.
    // Categoría propia "Apoyo al cuerpo técnico" — a propósito, para
    // que quede claro que complementan a cada departamento, nunca lo
    // sustituyen ni lo eclipsan.
    {id:'lm_ojo_clinico', get category(){return t('skill.categoria_apoyo');}, get name(){return t('skill.ojo_clinico.nombre');}, cost:30, phIcon:'ph-binoculars',
      get tooltip(){return t('skill.ojo_clinico.tooltip');}},
    {id:'lm_negociador_nato', get category(){return t('skill.categoria_apoyo');}, get name(){return t('skill.negociador_nato.nombre');}, cost:30, phIcon:'ph-handshake',
      get tooltip(){return t('skill.negociador_nato.tooltip');}},
    {id:'lm_manos_de_seda', get category(){return t('skill.categoria_apoyo');}, get name(){return t('skill.manos_de_seda.nombre');}, cost:30, phIcon:'ph-first-aid-kit',
      get tooltip(){return t('skill.manos_de_seda.tooltip');}},
    {id:'lm_discurso_motivador', get category(){return t('skill.categoria_apoyo');}, get name(){return t('skill.discurso_motivador.nombre');}, cost:30, phIcon:'ph-megaphone',
      get tooltip(){return t('skill.discurso_motivador.tooltip');}},
    {id:'lm_vigilancia_extra', get category(){return t('skill.categoria_apoyo');}, get name(){return t('skill.vigilancia_extra.nombre');}, cost:25, phIcon:'ph-shield-checkered',
      get tooltip(){return t('skill.vigilancia_extra.tooltip');}},
    {id:'lm_gestion_vestuario', get category(){return t('skill.categoria_apoyo');}, get name(){return t('skill.gestion_del_vestuario.nombre');}, cost:35, phIcon:'ph-users-three',
      get tooltip(){return t('skill.gestion_del_vestuario.tooltip');}},
    // --- Nuevas (esta ronda): ligadas al Giro Táctico, categoría
    // propia para que quede claro que giran en torno al descanso.
    {id:'lm_lectura_partido', get category(){return t('skill.categoria_giro');}, get name(){return t('skill.lectura_partido.nombre');}, cost:30, phIcon:'ph-eye',
      get tooltip(){return t('skill.lectura_partido.tooltip');}},
    {id:'lm_ultimo_cartucho', get category(){return t('skill.categoria_giro');}, get name(){return t('skill.ultimo_cartucho.nombre');}, cost:35, phIcon:'ph-battery-charging',
      get tooltip(){return t('skill.ultimo_cartucho.tooltip');}},
    {id:'lm_ojeador_estrella', get category(){return t('skill.categoria_giro');}, get name(){return t('skill.ojeador_estrella.nombre');}, cost:30, phIcon:'ph-binoculars',
      get tooltip(){return t('skill.ojeador_estrella.tooltip');}},
    {id:'lm_mano_dura', get category(){return t('skill.categoria_giro');}, get name(){return t('skill.mano_dura.nombre');}, cost:25, phIcon:'ph-hand-palm',
      get tooltip(){return t('skill.mano_dura.tooltip');}},
  ];
  async function lmCargarSkillsCache(){
    try{
      const user=window._fbAuth && window._fbAuth.currentUser;
      if(!user){ window._lmSkillsCache={}; return; }
      const snap=await window._fbDb.collection('users').doc(user.uid).get();
      const data=snap.exists?snap.data():{};
      window._lmSkillsCache=data.ligaManagerSkills||{};
    }catch(e){ window._lmSkillsCache=window._lmSkillsCache||{}; }
  }
  function lmSkillActiva(id){ return !!(window._lmSkillsCache && window._lmSkillsCache[id]); }
  async function renderLigaManagerSkillsTab(){
    await reRenderPanelConservandoScroll('lmProfileNotesPane', renderLigaManagerSkillsTabImpl);
  }
  async function renderLigaManagerSkillsTabImpl(){
    const list=document.getElementById('lmSkillsList');
    const pointsEl=document.getElementById('lmSkillPointsDisplay');
    if(!list) return;
    if(!list.children.length) list.innerHTML=`<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:12px">${t('lm.cargando')}</div>`;
    const user=window._fbAuth && window._fbAuth.currentUser;
    if(!user){ list.innerHTML=`<div style="text-align:center;padding:20px;color:var(--text-muted)">${t('lm.inicia_sesion_habilidades')}</div>`; return; }
    await lmCargarSkillsCache();
    let pts=window._lmScratchPoints;
    if(pts===undefined){
      const snap=await window._fbDb.collection('users').doc(user.uid).get();
      pts=(snap.exists?snap.data().scratchPoints:0)||0;
      window._lmScratchPoints=pts;
    }
    if(pointsEl) pointsEl.textContent=pts;
    list.innerHTML='';
    list.style.overflowX='hidden';
    list.style.width='100%';
    list.style.paddingRight='12px';
    const categorias=[...new Set(LM_SKILL_DEFS.map(d=>d.category))];
    categorias.forEach(cat=>{
      const label=document.createElement('div');
      label.style.cssText='font-family:"Bebas Neue",Impact,sans-serif;font-size:11px;letter-spacing:2px;color:var(--text-muted);border-bottom:1px solid var(--line);padding-bottom:4px;margin:12px 0 8px';
      label.textContent=cat;
      list.appendChild(label);
      const grid=document.createElement('div');
      grid.className='skill-grid';
      grid.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:6px';
      list.appendChild(grid);
      LM_SKILL_DEFS.filter(d=>d.category===cat).forEach(def=>{
        const active=lmSkillActiva(def.id);
        const btn=document.createElement('button');
        btn.className='skill-toggle-btn';
        btn.dataset.lmid=def.id;
        btn.style.cssText=`display:flex;flex-direction:column;align-items:center;justify-content:space-between;gap:0;border:2px solid ${active?'var(--gold)':'var(--line)'};background:${active?'rgba(201,162,39,.12)':'var(--panel)'};color:${active?'var(--gold)':'var(--text)'};cursor:pointer;transition:.15s;text-align:center;width:100%;box-sizing:border-box;overflow:hidden;height:200px`;
        const iconPart=`<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;padding:12px 8px 8px;flex:1">
          <i class="ph ph-bold ${def.phIcon}" style="font-size:26px;color:${active?'var(--gold)':'var(--accent)'}"></i>
          <span style="font-family:'Bebas Neue',Impact,sans-serif;font-size:13px;letter-spacing:.8px;color:${active?'var(--gold)':'var(--text)'};line-height:1.1">${def.name}</span>
          <span style="font-size:12px;color:${active?'var(--accent)':'var(--text-muted)'};line-height:1.4;padding:0 4px">${def.tooltip}</span>
        </div>`;
        const footerPart=`<div style="width:100%;padding:6px;background:${active?'rgba(201,162,39,.15)':'rgba(0,0,0,.15)'};border-top:1px solid ${active?'rgba(201,162,39,.3)':'var(--line)'}">
          <span style="font-family:'Bebas Neue',Impact,sans-serif;font-size:12px;color:${active?'var(--gold)':'var(--text-muted)'};letter-spacing:1px">${active?'✓ ACTIVA · PULSA PARA DESACTIVAR':'★ '+def.cost+' PTS'}</span>
        </div>`;
        btn.innerHTML=iconPart+footerPart;
        btn.addEventListener('click', async ()=>{
          btn.disabled=true;
          if(typeof window.playSound==='function') window.playSound('select');
          if(!window._lmSkillsCache) window._lmSkillsCache={};
          if(window._lmSkillsCache[def.id]){
            delete window._lmSkillsCache[def.id];
            window._lmScratchPoints=(window._lmScratchPoints||0)+def.cost;
          } else {
            if((window._lmScratchPoints||0)<def.cost){ btn.disabled=false; return; }
            window._lmSkillsCache[def.id]=true;
            window._lmScratchPoints=(window._lmScratchPoints||0)-def.cost;
          }
          if(typeof window.unlockLMAchievement==='function' && LM_SKILL_DEFS.every(d=>lmSkillActiva(d.id))) window.unlockLMAchievement('lm_all_skills', false);
          try{
            await window._fbDb.collection('users').doc(user.uid).set({ligaManagerSkills:window._lmSkillsCache, scratchPoints:window._lmScratchPoints}, {merge:true});
          }catch(e){}
          renderLigaManagerSkillsTab();
        });
        grid.appendChild(btn);
      });
    });
  }
  window.renderLigaManagerSkillsTab = renderLigaManagerSkillsTab;
  let perfilEquipoColapsado=false;
  let correoExpandido=null;
  let ordenColumnasSaveTimer=null; // el orden de columnas se persiste solo tras 60s sin más cambios
  let acabaDeReordenarColumnas=false;
  // Pulso sutil del botón JUGAR JORNADA tras 1 minuto sin tocarlo ni
  // pasar el ratón por encima — un único intervalo para toda la sesión,
  // que revisa el botón actual cada pocos segundos (el DOM se rehace en
  // cada render(), así que no sirve guardar la referencia al elemento).
  let jugarBtnUltimaInteraccion=Date.now();
  let jugarBtnPulseInterval=null;
  function marcarInteraccionJugarBtn(){
    jugarBtnUltimaInteraccion=Date.now();
    const btn=document.getElementById('lmJugarBtn');
    if(btn) btn.classList.remove('lm-btn-jugar-pulse');
  }
  function iniciarPulseJugarBtn(){
    if(jugarBtnPulseInterval) return;
    jugarBtnPulseInterval=setInterval(()=>{
      const btn=document.getElementById('lmJugarBtn');
      if(!btn) return;
      if(Date.now()-jugarBtnUltimaInteraccion>60000) btn.classList.add('lm-btn-jugar-pulse');
    }, 3000);
  }
  // Indicador sutil de "hay más contenido abajo" — si pasan 30s sin
  // hacer scroll en una columna Y esa columna todavía no está desplazada
  // del todo hasta el final, aparece un puntito con un pulso discreto en
  // su esquina inferior derecha. En cuanto se scrollea (o se llega al
  // final) se oculta otra vez. Se guarda por columna (clave = su
  // className, estable entre renders) porque el DOM se rehace entero
  // cada vez que se llama a render().
  let colScrollUltimaInteraccion={};
  let colScrollHintInterval=null;
  function marcarScrollColumna(clave){
    colScrollUltimaInteraccion[clave]=Date.now();
  }
  function iniciarHintScrollColumnas(){
    if(colScrollHintInterval) return;
    colScrollHintInterval=setInterval(()=>{
      document.querySelectorAll('.lm-panel, .lm-center-panel').forEach(el=>{
        const clave=el.className;
        const hint=el.querySelector(':scope > [data-scroll-hint]');
        if(!hint) return;
        // El que de verdad scrollea es el div interior (envuelto por JS
        // en render() con position:absolute) cuando existe; si por lo
        // que sea todavía no se ha envuelto, cae en la propia columna.
        const scrollEl=el.querySelector(':scope > .lm-col-scroll-inner')||el;
        const quedaContenido = scrollEl.scrollHeight-scrollEl.scrollTop > scrollEl.clientHeight+6;
        const ultima=colScrollUltimaInteraccion[clave]||0;
        const inactivaMasDe30s=Date.now()-ultima>30000;
        hint.classList.toggle('lm-scroll-hint-visible', quedaContenido && inactivaMasDe30s);
      });
    }, 1500);
  }
  // Flechas de reordenar columnas — se vuelven invisibles tras 10s sin
  // tocarlas (clic o simplemente pasar el ratón por encima), y
  // reaparecen en cuanto se vuelve a interactuar con ellas.
  let colArrowsUltimaInteraccion=Date.now();
  let colArrowsFadeInterval=null;
  function marcarInteraccionColArrows(){
    colArrowsUltimaInteraccion=Date.now();
    document.querySelectorAll('.lm-col-reorder').forEach(el=>el.classList.remove('lm-col-reorder-oculto'));
  }
  function iniciarFadeColArrows(){
    if(colArrowsFadeInterval) return;
    colArrowsFadeInterval=setInterval(()=>{
      if(Date.now()-colArrowsUltimaInteraccion>10000){
        document.querySelectorAll('.lm-col-reorder').forEach(el=>el.classList.add('lm-col-reorder-oculto'));
      }
    }, 1000);
  }
  let setupData={liga:'es', moneda:null, nombre:'', escudo:null, modo:null, equipoElegidoId:null};

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
    const esVersatil = p.rasgos && p.rasgos.includes('versatil');
    const positionFactor=(inPos||esVersatil)?1:0.85;
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

  function empezarTemporada(nombreEquipo, moneda, liga, escudo, equipoRealElegidoId){
    calendarioMesVisto=null; // nueva liga: el calendario debe volver a fijarse en el mes de inicio, no arrastrar el de una partida anterior
    calendarioJornadaSincronizada=null;
    // Marca que se acaba de crear una liga nueva, para que el
    // tutorial de Liga Manager se reproduzca de nuevo — a diferencia
    // de un simple "visto una vez", el jugador debe verlo cada vez
    // que empieza una liga desde cero, aunque ya hubiera jugado otras
    // antes. sessionStorage (no localStorage) porque solo debe
    // disparar en ESTA sesión, justo tras crear la liga.
    try{ sessionStorage.setItem('g2g_tut_lm_new_league','1'); }catch(e){}
    const miEquipo={id:'lm_0', name:nombreEquipo};
    // LaLiga tiene 20 equipos — LM_RIVALS ya contiene los 20 reales de
    // la temporada. Tu equipo ocupa SIEMPRE una de esas 20 plazas:
    // - Si eliges ser un club real, se quita ESE club de la lista de
    //   rivales (te conviertes en él) — quedan 19 rivales + tú = 20.
    // - Si creas un club inventado, se sortea al azar UNO de los 20
    //   reales para cederte su plaza en la tabla — quedan 19 rivales +
    //   tú = 20. Nunca se duplica ningún nombre ni se deja un número
    //   impar de equipos, que es lo que rompía el calendario antes
    //   (con 19 equipos, el generador no podía funcionar y acababa
    //   emparejando a un equipo consigo mismo, jornada tras jornada).
    const idAExcluir = equipoRealElegidoId || LM_RIVALS[Math.floor(Math.random()*LM_RIVALS.length)].id;
    const rivalesBarajados=LM_RIVALS.filter(r=>r.id!==idAExcluir).slice();
    if(typeof shuffle==='function') shuffle(rivalesBarajados); // shuffle() muta en el sitio, no devuelve nada
    const teams=[miEquipo, ...rivalesBarajados];
    const equipoRealElegido = equipoRealElegidoId ? LM_RIVALS.find(r=>r.id===equipoRealElegidoId) : null;
    const plantilla = equipoRealElegido ? generarPlantillaDesdeEquipoReal(equipoRealElegido) : generarMiniPlantilla();
    state={
      setupComplete:true,
      liga, moneda, nombreEquipo, escudo,
      jornadaActual:1,
      calendario:generarCalendario(teams),
      fechaInicioLiga:fechaISO(inicioTemporadaRealista()),
      calendarioEntrenamiento:{},
      pfPlanEntrenamiento:[],
      lmPendingPrediction:null,
      resultados:{},
      plantilla,
      formacionCategoria:'equilibrada',
      formacionCode:'4-3-3',
      alineacion:alineacionAutomatica(plantilla, generarSlotsFormacion('4-3-3')),
      medicoNotificacion:null,
      diceAvailable:lmDicePoolPorPartido(),
      medicoCartas:[],
      medicoCambiosUsados:0,
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
      victoriasQuiniela:0,
      quinielaBoleto:null,
      quinielaResultadoPendiente:null,
      mantenimientoCartas:[],
      mantenimientoCambiosUsados:0,
      mantenimientoCartasAgotadas:[],
      mantenimientoHistorial:[],
      mantenimientoNiveles:{prevencionDesgaste:0, recuperacionCesped:0, boostSatisfaccion:0, proteccionSatisfaccion:0},
      // ---- Guardias de seguridad ----
      // guardiasContratados: cuántos guardias tienes en plantilla en total.
      // guardiasZonas: cuántos de esos están asignados a cada zona (máx 3).
      // Los "disponibles" son contratados menos asignados.
      // disturbiosZonas: nivel de disturbios de cada zona del estadio.
      guardiasContratados:0,
      modoVisualPartido:'auto',
      guardiasZonas:{norte_1:0,norte_2:0,norte_3:0,sur_1:0,sur_2:0,sur_3:0,oeste_1:0,oeste_2:0,oeste_3:0,este_1:0,este_2:0,este_3:0},
      disturbiosZonas:{norte_1:0,norte_2:0,norte_3:0,sur_1:0,sur_2:0,sur_3:0,oeste_1:0,oeste_2:0,oeste_3:0,este_1:0,este_2:0,este_3:0},
      dadoRerollsDisponibles:lmRerollsPorPartido(),
      // ---- Economía ----
      // Capital inicial modesto, coherente con un recién ascendido: dos o
      // tres meses de margen antes de que la nómina apriete de verdad.
      capital:400000,
      precioEntrada:15,
      mesesPagados:0,
      finanzasHistorial:[],
      directorGeneralCartas:[],
      directorGeneralCambiosUsados:0,
      directorGeneralCartasAgotadas:[],
      directorGeneralHistorial:[],
      directorGeneralNiveles:{aforoExtra:0, ingresoPatrocinio:0, ingresoMerchandising:0, toleranciaPrecio:0},
      // Giro Táctico (adaptado de Copa Leyendas): usos disponibles se
      // reinician cada media temporada (jornadas 1-19 / 20-38), nunca
      // por partido ni por temporada completa — giroTacticoMitad
      // registra de cuál de las dos mitades es el contador actual,
      // para saber cuándo toca reiniciarlo.
      giroTacticoUsosRestantes:5,
      giroTacticoMitad:1,
      directorDeportivoCartas:[],
      directorDeportivoCambiosUsados:0,
      directorDeportivoCartasAgotadas:[],
      directorDeportivoHistorial:[],
      directorDeportivoNiveles:{calidadOjeo:0, ahorroSalarial:0, sobresFichajes:0, costeSobres:0},
      // Sobres de fichajes: ya NO se abren directamente desde la tarjeta.
      // Se generan solos con el tiempo (más a menudo cuanto más subida
      // esté la carta "Sobres de Fichajes") y avisan por correo cuando
      // están listos — desde ahí se abren. Máximo 3 sin abrir a la vez.
      sobresFichajesPendientes:[],
      // Jugadores reales de otros equipos ya fichados en ESTA partida —
      // desaparecen de su equipo de origen (no vuelven a aparecer como
      // goleadores/alineación suyos) en cuanto se fichan.
      jugadoresRealesFichados:[],
      // ---- Trabajadores del cuerpo técnico ----
      trabajadores:{
        medico:null,
        mantenimiento:null,
        directorGeneral:null,
        directorDeportivo:null,
        preparadorFisico:null
      },
      candidatosTrabajo:[],
      mesTrabajadoresGenerado:0,
      correoInterno:[],
      correoUltimoEnviado:{},
      posicionObjetivoOjeo:'any',
      preparadorFisicoCartas:[],
      preparadorFisicoCambiosUsados:0,
      preparadorFisicoCartasAgotadas:[],
      preparadorFisicoHistorial:[],
      preparadorFisicoNiveles:{resistenciaBase:0, recuperacionSemanal:0, potencialTecnico:0, potencialFisico:0, planificacionSemanal:0},
      ordenColumnas:['left','center','right','staff']
    };
    state.medicoCartas = inicializarCartasMedico();
    state.mantenimientoCartas = inicializarCartasMantenimiento();
    state.directorGeneralCartas = inicializarCartasDG();
    state.directorDeportivoCartas = inicializarCartasDD();
    state.preparadorFisicoCartas = inicializarCartasPF();
    // Regalo de bienvenida para todos: un sobre de fichajes gratuito ya
    // esperando desde el primer día, avisado por correo como cualquier
    // otro — se abre igual, pero sin coste al abrirlo.
    {
      const idRegalo='sobre_regalo_'+Date.now();
      state.sobresFichajesPendientes.push({id:idRegalo, nivel:1, jornadaGenerado:1, gratis:true});
      enviarCorreo('directorDeportivo', t('correo.bienvenida_sobre.asunto'),
        t('correo.bienvenida_sobre.cuerpo'),
        {asunto:'correo.bienvenida_sobre.asunto', cuerpo:'correo.bienvenida_sobre.cuerpo'});
      const ultimoCorreo=state.correoInterno && state.correoInterno[0];
      if(ultimoCorreo){ ultimoCorreo.tipoEspecial='sobre_listo'; ultimoCorreo.sobreId=idRegalo; }
    }
    // Regalo especial solo para tiopops: una quiniela de bienvenida ya
    // lista para rellenar desde el primer día — mismo mecanismo que las
    // que se ganan jugando (cada 3 victorias, acumulado).
    if(window.currentUsername==='tiopops'){
      generarBoletoQuiniela(0);
    }
    guardarEstado();
  }


  function cargarEstado(){
    try{
      const raw=localStorage.getItem(SAVE_KEY);
      if(raw){
        const s=JSON.parse(raw);
        repararColisionNombresCalendario(s);
        return s;
      }
    }catch(e){}
    return nuevoEstadoSinEmpezar();
  }
  // Reparación para partidas YA EXISTENTES (el arreglo en
  // empezarTemporada solo protege ligas nuevas — esto cubre las que ya
  // tenían el calendario generado con la colisión de nombres, como
  // "Sevilla FC vs Sevilla FC"). Solo toca el NOMBRE mostrado, nunca
  // los IDs ni los resultados/predicciones ya guardados, que se
  // referencian por ID — así es 100% seguro aplicarlo con partidas en
  // curso sin invalidar nada.
  function repararColisionNombresCalendario(s){
    if(!s) return;
    let reparado=false;
    if(s.calendario && Array.isArray(s.calendario)){
      s.calendario.forEach(jornada=>{
        if(!Array.isArray(jornada)) return;
        jornada.forEach(partido=>{
          if(partido && partido.home && partido.away && partido.home.id!==partido.away.id
             && partido.home.name && partido.away.name
             && partido.home.name.trim().toLowerCase()===partido.away.name.trim().toLowerCase()){
            const esMiaLaLocal = partido.home.id==='lm_0';
            if(esMiaLaLocal) partido.away.name=partido.away.name.trim()+' (rival)';
            else partido.home.name=partido.home.name.trim()+' (rival)';
            reparado=true;
          }
        });
      });
    }
    // La quiniela guarda su PROPIA copia de los nombres (homeName/
    // awayName), tomada en el momento de generar el boleto — separada
    // por completo del calendario. Sin repararla aquí también, el
    // arreglo de arriba no llegaba nunca a lo que se ve en pantalla en
    // la quiniela, que es justo donde seguía fallando.
    if(s.quinielaBoleto && Array.isArray(s.quinielaBoleto.partidos)){
      s.quinielaBoleto.partidos.forEach(p=>{
        if(p && p.homeId!==p.awayId && p.homeName && p.awayName
           && p.homeName.trim().toLowerCase()===p.awayName.trim().toLowerCase()){
          if(p.homeEsMio) p.awayName=p.awayName.trim()+' (rival)';
          else p.homeName=p.homeName.trim()+' (rival)';
          reparado=true;
        }
      });
    }
    if(reparado){ try{ localStorage.setItem(SAVE_KEY, JSON.stringify(s)); }catch(e){} }
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
  // Texto narrativo del histórico del partido — en lenguaje claro y
  // ameno, a partir de los eventos REALES de ese partido concreto
  // (nunca inventado). Compartida entre modo automático y modo
  // manager, para que ambos muestren exactamente el mismo resumen.
  function generarHistoricoPartidoTexto(info, miEsLocal, posesionRealMia){
    const miNombre = state.nombreEquipo || state.escudo && state.escudo.nombre || 'Tu equipo';
    const rivalNombre = miEsLocal ? info.away.name : info.home.name;
    const golesMio = miEsLocal ? info.resultado.golesA : info.resultado.golesB;
    const golesRival = miEsLocal ? info.resultado.golesB : info.resultado.golesA;
    const miLado = miEsLocal ? 'home' : 'away';
    const eventos = (info.eventos||[]).slice().sort((a,b)=>a.minute-b.minute);
    const goles = eventos.filter(e=>e.type==='goal');
    const tarjetas = eventos.filter(e=>e.type==='card');
    const lesiones = eventos.filter(e=>e.type==='injury');
    const posMio = posesionRealMia!=null ? posesionRealMia : (info.resultado.posesionA!=null ? (miEsLocal?info.resultado.posesionA:info.resultado.posesionB) : null);
    const posRival = posMio!=null ? 100-posMio : null;

    const partes=[];
    // Apertura: resultado en una frase, elegida al azar entre varias
    // formas distintas de contarlo — así la crónica no suena siempre
    // exactamente igual, como un periodista que varía su redacción.
    function elegir(...claves){ return claves[Math.floor(Math.random()*claves.length)]; }
    if(golesMio>golesRival) partes.push(tp(elegir('lm.hist_gano','lm.hist_gano2','lm.hist_gano3'), {miNombre, rivalNombre, golesMio, golesRival}));
    else if(golesMio<golesRival) partes.push(tp(elegir('lm.hist_perdio','lm.hist_perdio2'), {miNombre, rivalNombre, golesMio, golesRival}));
    else partes.push(tp(elegir('lm.hist_empato','lm.hist_empato2'), {miNombre, rivalNombre, golesMio}));

    // Posesión — una frase que da color y contexto a lo que se vio.
    if(posMio!=null){
      if(Math.abs(posMio-posRival)>=8){
        const dominador = posMio>posRival ? miNombre : rivalNombre;
        const domPos = posMio>posRival ? posMio : posRival;
        const domPosRival = posMio>posRival ? posRival : posMio;
        const dominadoRival = posMio>posRival ? rivalNombre : miNombre;
        partes.push(tp('lm.hist_posesion_dominio', {equipo:dominador, pos:domPos, posRival:domPosRival, rivalEquipo:dominadoRival}));
      } else {
        partes.push(tp('lm.hist_posesion_equilibrada', {pos:posMio, posRival}));
      }
    }

    // Clima — solo si tuvo algo de protagonismo real en el partido.
    const climaId = info.climaId;
    const claveClima = {rain:'lm.hist_clima_lluvia', wind:'lm.hist_clima_viento', hot:'lm.hist_clima_calor', snow:'lm.hist_clima_nieve'}[climaId];
    if(claveClima) partes.push(t(claveClima));

    // Goles, contados como una pequeña crónica.
    if(goles.length){
      const frasesGoles = goles.map(g=>{
        const equipo = g.team===miLado ? miNombre : rivalNombre;
        const nombreJ = g.jugador ? g.jugador.name : equipo;
        const claveConector = elegir('lm.hist_gol_de','lm.hist_gol_de2','lm.hist_gol_de3','lm.hist_gol_de4');
        return `${nombreJ} (${equipo}) ${tp(claveConector,{min:g.minute})}`;
      });
      partes.push(`**${t('lm.hist_goles_titulo')}**\n${frasesGoles.join('. ')}.`);
    } else {
      partes.push(`**${t('lm.hist_goles_titulo')}**\n${t('lm.hist_sin_goles')}`);
    }

    // Tarjetas.
    if(tarjetas.length){
      const frasesTarjetas = tarjetas.map(c=>{
        const equipo = c.team===miLado ? miNombre : rivalNombre;
        const nombreJ = c.jugador ? c.jugador.name : equipo;
        const claveT = c.tarjeta==='roja' ? 'lm.hist_roja_de' : 'lm.hist_amarilla_de';
        return `${nombreJ} (${equipo}) ${tp(claveT,{min:c.minute})}`;
      });
      partes.push(`**${t('lm.hist_tarjetas_titulo')}**\n${frasesTarjetas.join('. ')}.`);
    } else {
      partes.push(`**${t('lm.hist_tarjetas_titulo')}**\n${t('lm.hist_sin_tarjetas')}`);
    }

    // Lesiones, solo si hubo alguna — no hace falta un párrafo vacío.
    if(lesiones.length){
      const frasesLesiones = lesiones.map(l=>{
        const equipo = l.team===miLado ? miNombre : rivalNombre;
        const nombreJ = l.jugador ? l.jugador.name : equipo;
        return `${nombreJ} (${equipo}) ${tp('lm.hist_lesion_de',{min:l.minute})}`;
      });
      partes.push(`**${t('lm.hist_lesiones_titulo')}**\n${frasesLesiones.join('. ')}.`);
    }

    // Rueda de prensa — si hubo una promesa hecha antes del partido,
    // se menciona si se cumplió o no.
    const prensa = state.ultimaPrensaResuelta;
    if(prensa && prensa.outcome!=='neutral'){
      partes.push(tp(prensa.outcome==='correct' ? 'lm.hist_prensa_cumplida' : 'lm.hist_prensa_incumplida', {label:prensa.label, delta:prensa.delta}));
    }

    // Cierre breve.
    partes.push(Math.abs(golesMio-golesRival)<=1 ? t('lm.hist_cierre_ajustado') : t('lm.hist_cierre_claro'));

    return partes.join('\n\n');
  }
  function mostrarHistoricoPartido(info, miEsLocal, posesionRealMia){
    // Evita que se acumulen varias ventanas si se pulsa el botón más
    // de una vez — se quita cualquier histórico ya abierto antes de
    // crear uno nuevo.
    const existente=document.getElementById('lmHistoricoOverlay');
    if(existente) existente.remove();
    const texto = generarHistoricoPartidoTexto(info, miEsLocal, posesionRealMia);
    const htmlTexto = texto.split('\n\n').map(p=>{
      if(p.startsWith('**')){
        const [titulo, ...resto] = p.split('\n');
        return `<div class="lm-historico-subtitulo">${titulo.replace(/\*\*/g,'')}</div><p class="lm-historico-parrafo">${resto.join(' ')}</p>`;
      }
      return `<p class="lm-historico-parrafo">${p}</p>`;
    }).join('');
    const overlay=document.createElement('div');
    overlay.id='lmHistoricoOverlay';
    overlay.innerHTML=`
      <div class="lm-dilemma-card" style="width:480px;max-width:92vw;text-align:left;max-height:80vh;display:flex;flex-direction:column">
        <div class="lm-dilemma-title"><i class="ph ph-bold ph-notebook"></i> ${t('lm.historico_partido_btn')}</div>
        <div style="overflow-y:auto;flex:1;padding-right:4px">${htmlTexto}</div>
        <div class="lm-popup-actions" style="margin-top:12px"><button id="lmHistoricoCerrar" class="mode-card-btn mode-card-btn-gold">${t('lm.continuar')}</button></div>
      </div>`;
    document.getElementById('ligaManagerScreen').appendChild(overlay);
    const cerrar=()=>overlay.remove();
    if(typeof habilitarCierreOverlay==='function') habilitarCierreOverlay(overlay, cerrar);
    overlay.querySelector('#lmHistoricoCerrar').addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      cerrar();
    });
  }

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
    const sinPortero=titulares.filter(p=>p.position!=='POR');
    const ofensivos=sinPortero.filter(p=>['DC','EI','ED','MC'].includes(p.position));
    const pool = ofensivos.length ? ofensivos : (sinPortero.length ? sinPortero : titulares);
    return pool[Math.floor(Math.random()*pool.length)];
  }

  function elegirJugadorAlineado(excluirIds){
    excluirIds = excluirIds || new Set();
    const idsAlineados=Object.values(state.alineacion||{}).filter(Boolean).filter(id=>!excluirIds.has(id));
    const titulares=idsAlineados.map(id=>state.plantilla.find(p=>p.id===id)).filter(p=>p && !p.injured);
    if(!titulares.length) return null;
    return titulares[Math.floor(Math.random()*titulares.length)];
  }

  // Elige un nombre real al azar de la plantilla del rival concreto —
  // si por lo que sea no tiene plantilla cargada, cae en el nombre del
  // propio club para no dejar el hueco en blanco. Extraída como
  // función de nivel superior (antes vivía solo dentro de
  // generarEventosPartido) para poder reutilizarla también desde la
  // re-simulación de la segunda parte del Giro Táctico.
  function jugadorRivalAleatorio(rival){
    if(rival && rival.plantilla && rival.plantilla.length){
      const disponibles = plantillaEfectivaRival(rival);
      // Nunca el portero, y con preferencia clara por posiciones
      // ofensivas — antes se elegía entre los 11 sin ningún filtro,
      // así que el portero rival podía "marcar" con la misma
      // probabilidad que un delantero. Nada realista.
      const sinPortero = disponibles.filter(j=>j.pos!=='POR');
      const ofensivos = sinPortero.filter(j=>['DC','EI','ED','MC'].includes(j.pos));
      const pool = ofensivos.length ? ofensivos : (sinPortero.length ? sinPortero : disponibles);
      const elegido=pool[Math.floor(Math.random()*pool.length)];
      return {name: elegido.name||elegido, numero: elegido.n};
    }
    return {name: rival ? rival.name : 'Rival'};
  }
  function generarEventosPartido(resultado, miEsLocal, campoRelevante, rival){
    // "home"/"away" se refiere SIEMPRE al equipo local/visitante real del
    // partido — mi equipo puede ser cualquiera de los dos según el
    // calendario. Antes se asumía que "home" era siempre yo, así que
    // cuando jugaba fuera mis propios goleadores/tarjetas/lesiones
    // aparecían del lado del rival.
    const misLado = miEsLocal ? 'home' : 'away';
    const rivalLado = miEsLocal ? 'away' : 'home';
    const eventos=[];
    for(let i=0;i<resultado.golesA;i++){
      const goleador = miEsLocal ? elegirGoleador() : jugadorRivalAleatorio(rival);
      eventos.push({minute:5+Math.floor(Math.random()*85), team:'home', type:'goal', jugador:goleador});
    }
    for(let i=0;i<resultado.golesB;i++){
      const goleador = miEsLocal ? jugadorRivalAleatorio(rival) : elegirGoleador();
      eventos.push({minute:5+Math.floor(Math.random()*85), team:'away', type:'goal', jugador:goleador});
    }
    // Tarjetas amarillas/rojas — de momento solo informativas (sin
    // sanción de partidos todavía), con nombre real si es tu jugador.
    if(Math.random()<0.35){
      const jugador=elegirJugadorAlineado();
      eventos.push({minute:10+Math.floor(Math.random()*78), team:misLado, type:'card', tarjeta:'amarilla', jugador: jugador||{name:state.nombreEquipo}});
    }
    if(Math.random()<0.35){
      eventos.push({minute:10+Math.floor(Math.random()*78), team:rivalLado, type:'card', tarjeta:'amarilla', jugador:jugadorRivalAleatorio(rival)});
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
        let sev=severidades[Math.floor(Math.random()*severidades.length)];
        // Manos de Seda: pequeña probabilidad de que, si ha tocado
        // "grave", en realidad se quede en "moderada" — nunca mejora
        // más de un escalón, y nunca toca lesiones ya "leve".
        if(sev.label==='grave' && typeof lmSkillActiva==='function' && lmSkillActiva('lm_manos_de_seda') && Math.random()<0.30){
          sev=severidades[1];
        }
        const nivelCuracion = familia==='muscular' ? (nivelesMed.curacionMuscular||0) : (nivelesMed.curacionOsea||0);
        let weeks=Math.max(1, sev.weeks-nivelCuracion);
        const tipoLesion=TIPOS_LESION_POR_FAMILIA[familia][sev.label][Math.floor(Math.random()*TIPOS_LESION_POR_FAMILIA[familia][sev.label].length)];
        eventos.push({minute:20+Math.floor(Math.random()*65), team:misLado, type:'injury', jugador, sev:{...sev, weeks}, tipoLesion, familia});
      }
    }
    // Jugar ya lesionado ahora está permitido, pero no es gratis: hay
    // riesgo de que la lesión se agrave durante el propio partido (más
    // aún si el campo está en mal estado).
    const idsParaAgravar=Object.values(state.alineacion||{}).filter(Boolean);
    idsParaAgravar.forEach(id=>{
      const p=state.plantilla.find(x=>x.id===id);
      if(!p || !p.injured) return;
      const riesgoAgravar=0.14*factorCampo*(bonos.riesgoLesionSiguiente||1);
      if(Math.random()>=riesgoAgravar) return;
      const orden=['leve','moderada','grave'];
      const idxActual=orden.indexOf(p.injurySeverity);
      let severidadNueva=p.injurySeverity, semanasExtra=2;
      if(idxActual>=0 && idxActual<orden.length-1){
        severidadNueva=orden[idxActual+1];
        semanasExtra=severidadNueva==='grave'?3:2;
        p.injurySeverity=severidadNueva;
      }
      p.injuryWeeks=(p.injuryWeeks||0)+semanasExtra;
      if(p.lesionLogId && state.medicoHistorial){
        const entry=state.medicoHistorial.find(h=>h.id===p.lesionLogId);
        if(entry){ entry.severidad=severidadNueva; entry.semanasPrevistas=(entry.semanasPrevistas||0)+semanasExtra; }
      }
      if(state.trabajadores && state.trabajadores.medico && typeof enviarCorreo==='function' &&
         (!state.correoUltimoEnviado || state.correoUltimoEnviado.medico!==state.jornadaActual)){
        enviarCorreo('medico', tp('correo.agrava_lesion.asunto', {jugador:p.name}),
          tp('correo.agrava_lesion.cuerpo', {jugador:p.name, severidad:severidadNueva, semanas:p.injuryWeeks+' '+t('lm.jornada').toLowerCase()+(p.injuryWeeks===1?'':'s')}),
          {asunto:'correo.agrava_lesion.asunto', paramsAsunto:{jugador:p.name}, cuerpo:'correo.agrava_lesion.cuerpo', paramsCuerpo:{jugador:p.name, severidad:severidadNueva, semanas:p.injuryWeeks+' '+t('lm.jornada').toLowerCase()+(p.injuryWeeks===1?'':'s')}});
      }
    });
    // Actualizar rachas de gol: quien marca suma, el resto de titulares que
    // NO marcaron este partido pierden la racha (mismo concepto que el
    // "streak" de goleador ya usado en Copa Leyendas).
    const marcadoresIds=new Set(eventos.filter(e=>e.type==='goal'&&e.jugador).map(e=>e.jugador.id));
    // Total de goles de la temporada por jugador — a diferencia de
    // marcadoresIds (un Set, solo sirve para saber SI marcó), aquí se
    // cuenta cada gol individualmente, para poder mostrar un máximo
    // goleador real en el resumen de fin de temporada. Solo se cuentan
    // los goles de MI equipo (los del rival usan un jugador ajeno, no
    // guardado en mi plantilla).
    eventos.filter(e=>e.type==='goal' && e.team===misLado && e.jugador && e.jugador.id).forEach(e=>{
      const p=state.plantilla.find(x=>x.id===e.jugador.id);
      if(p) p.golesTemporada=(p.golesTemporada||0)+1;
    });
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
  // Fracción del aforo total que queda bloqueada (sin generar
  // ingresos por entradas) porque alguna zona está en disturbios
  // graves — proporcional al tamaño de esa zona respecto al estadio
  // completo. Una zona grave se considera cerrada al público hasta
  // que se calme.
  function fraccionAforoBloqueadoPorDisturbios(){
    if(!state.disturbiosZonas) return 0;
    const areaTotal=LM_ZONAS_ESTADIO.reduce((s,z)=>s+z.w*z.h, 0);
    if(areaTotal<=0) return 0;
    return LM_ZONAS_ESTADIO.reduce((s,z)=>{
      const nivel=state.disturbiosZonas[z.id]||0;
      return nivel>=3 ? s+(z.w*z.h)/areaTotal : s;
    }, 0);
  }
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
    const aforoBloqueado=fraccionAforoBloqueadoPorDisturbios();
    return {asistentes:Math.round(aforo*pct*(1-aforoBloqueado)), aforo, pct, aforoBloqueado};
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
    // La satisfacción de la afición también pesa en la moral del
    // vestuario — un ambiente hostil (aficionados descontentos) hace
    // mella incluso ganando, y una grada volcada anima al equipo.
    const satisfaccion=(state.estadio && state.estadio.satisfaccion) || 0;
    delta += satisfaccion/12;
    // Gestión del Vestuario: pequeño extra de moral tras una victoria
    // — complementa a todo el cuerpo técnico, no sustituye su trabajo.
    if(miGoles>suGoles && typeof lmSkillActiva==='function' && lmSkillActiva('lm_gestion_vestuario')) delta+=3;
    delta = Math.round(delta);
    // Temple Competitivo: si el partido se decide por la mínima (un gol
    // de diferencia) y vas perdiendo, la caída de moral es menor.
    if(miGoles<suGoles && (suGoles-miGoles)===1 && typeof lmSkillActiva==='function' && lmSkillActiva('lm_temple_competitivo')){
      delta=Math.round(delta*0.5);
    }
    state.ultimoCambioMoral = delta;
    state.moral=Math.max(-50, Math.min(50, (state.moral||0)+delta));
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
      if(typeof window.unlockLMAchievement==='function' && asistenciaInfo.asistentes>=est.aforoTotal) window.unlockLMAchievement('lm_full_stadium', false);
      if(state.directorGeneralBonos && state.directorGeneralBonos.boostAsistencia){ state.directorGeneralBonos.boostAsistencia=0; }
      const precio=state.precioEntrada===undefined?15:state.precioEntrada;
      const ingresoEntradas=asistenciaInfo.asistentes*precio;
      const ingresoMerch=Math.round(asistenciaInfo.asistentes*(2+nivelDeDG('ingresoMerchandising')*1.5));
      state.capital=Math.round((state.capital||0)+ingresoEntradas+ingresoMerch);
      registrarMovimientoFinanciero('Entradas', ingresoEntradas, state.jornadaActual);
      registrarMovimientoFinanciero('Merchandising', ingresoMerch, state.jornadaActual);
    }
    const campoAntes=est.campo;
    if(miEsLocal && clima){
      const desgasteBase={sunny:10, cloudy:6, rain:20, wind:11, hot:16, snow:19}[clima.id] || 6;
      const reduccion=nivelDeM('prevencionDesgaste')*1.4;
      const desgaste=Math.max(0, desgasteBase-reduccion);
      est.campo=Math.max(0, est.campo-desgaste);
    }
    const recuperacion=1+nivelDeM('recuperacionCesped')*2;
    est.campo=Math.min(100, Math.round(est.campo+recuperacion));
    state.ultimoCambioCampo=Math.round(est.campo-campoAntes);

    const miGoles = miEsLocal ? resultado.golesA : resultado.golesB;
    const suGoles = miEsLocal ? resultado.golesB : resultado.golesA;
    const boostVictoria=1+nivelDeM('boostSatisfaccion')*0.25;
    const proteccion=1-nivelDeM('proteccionSatisfaccion')*0.2;
    let delta=0;
    const margen=miGoles-suGoles;
    if(margen>0) delta=(14+Math.min(margen-1,3)*4)*boostVictoria; // gana: 14 base, más cuanto más goleada
    else if(margen===0) delta=1;
    else delta=(-18-Math.min(-margen-1,3)*4)*proteccion; // pierde: -18 base, más cuanto más goleada en contra
    if(est.campo<40) delta-=(40-est.campo)*0.15*proteccion;
    if(delta<0 && state.mantenimientoBonos && state.mantenimientoBonos.amortiguarPerdida){
      delta*=0.5;
      state.mantenimientoBonos.amortiguarPerdida=false;
    }
    // Bajar mucho el precio de la entrada es un gesto que la afición
    // agradece — cuanto más por debajo de los 15€ de referencia, mayor
    // el extra de satisfacción (con tope para no desequilibrar).
    const precioActual=state.precioEntrada===undefined?15:state.precioEntrada;
    if(precioActual<15){
      delta += Math.min(15, (15-precioActual)*1.2);
    }
    delta=Math.round(delta);
    state.ultimoCambioSatisfaccion=delta;
    est.satisfaccion=Math.max(-100, Math.min(100, est.satisfaccion+delta));
    actualizarMoralTrasPartido(miGoles, suGoles);
    if(miEsLocal){ try{ procesarDisturbiosTrasPartido(); }catch(e){ console.error('procesarDisturbiosTrasPartido:', e); } }
  }

  // ============================================================
  // El visor de partido en Modo Manager vive en su propio archivo
  // (liga-manager-partido-visor.js), igual que los dados 3D — aquí
  // solo se le pasan las piezas que necesita de este módulo.
  function abrirVisorPartidoManager(info, onFinish){
    if(typeof window.G2G_abrirVisorPartidoManager!=='function') return;
    window.G2G_abrirVisorPartidoManager(info, onFinish, {
      state, t, formacionActual, generarSlotsFormacion, climaDelPartido, calcularStatsEquipo, plantillaEfectivaRival, crestHTML, rivalCrestHTML, mostrarHistoricoPartido,
      guardarEstado, getMaxGiroTacticoLM, jugadorRivalAleatorio, elegirGoleador, elegirJugadorAlineado
    });
  }


  function jugarJornada(){
    if(state.jornadaActual>38) return null;
    actualizarUsosGiroTacticoLM();
    const j=state.jornadaActual-1;
    const jornada=state.calendario[j];
    let miPartidoInfo=null;
    let jugadorLesionadoEstaJornada=null;
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
        const rivalDeEstePartido = miEsLocalDeEste ? partido.away : partido.home;
        const eventos=generarEventosPartido(resultado, miEsLocalDeEste, campoRelevante, rivalDeEstePartido);
        // Aplicar la lesión generada (si la hay) al estado real del jugador
        const evInjury=eventos.find(e=>e.type==='injury');
        if(evInjury){
          evInjury.jugador.injured=true;
          evInjury.jugador.injuryWeeks = evInjury.sev.weeks;
          evInjury.jugador.injurySeverity=evInjury.sev.label;
          evInjury.jugador.injuryFamilia=evInjury.familia;
          jugadorLesionadoEstaJornada=evInjury.jugador.id;
          state.medicoNotificacion={jugadorId:evInjury.jugador.id, dificultad:evInjury.sev.dificultad, severidad:evInjury.sev.label};
          const rivalDeEsta = partido.home.id==='lm_0' ? partido.away.name : partido.home.name;
          evInjury.jugador.lesionLogId=registrarLesionHistorial(evInjury.jugador, evInjury.sev, evInjury.tipoLesion, rivalDeEsta, evInjury.familia);
          if(typeof window.unlockLMAchievement==='function') window.unlockLMAchievement('lm_first_injury', false);
        }
        miPartidoInfo={ home:partido.home, away:partido.away, resultado, eventos, climaId: clima?clima.id:null, jornadaIndex:j };
        actualizarEstadioTrasPartido(miEsLocalDeEste, resultado, clima);
        const misGoles=miEsLocalDeEste?resultado.golesA:resultado.golesB, susGoles=miEsLocalDeEste?resultado.golesB:resultado.golesA;
        // Se resuelve aquí, en el origen común de los dos modos de
        // visualización — antes solo se resolvía dentro del código
        // específico del modo automático, así que en modo manager la
        // predicción de la rueda de prensa nunca se comprobaba: ni
        // afectaba a la moral, ni aparecía en el resumen ni en el
        // histórico del partido. Llamarla aquí también es segura para
        // el modo automático (que la vuelve a llamar más abajo), ya
        // que resolverPrensaLM no hace nada si ya se había resuelto.
        state._prensaResueltaEstePartido=false;
        resolverPrensaLM(misGoles, susGoles);
        if(typeof window.unlockLMAchievement==='function'){
          window.unlockLMAchievement('lm_first_match', false);
          if(misGoles>susGoles){
            window.unlockLMAchievement('lm_first_win', false);
            if(susGoles===0) window.unlockLMAchievement('lm_clean_sheet', false);
            if((state.rachaResultados||0)+1>=3) window.unlockLMAchievement('lm_win_streak_3', false);
          }
        }
        if(misGoles>susGoles){
          state.victoriasQuiniela=(state.victoriasQuiniela||0)+1;
          if(state.victoriasQuiniela>=3){
            state.victoriasQuiniela=0;
            generarBoletoQuiniela();
          }
        }
      }
    });

    // Fondo de dados: se resetea cada jornada — los que no se usaron en
    // la jornada anterior se pierden (use-it-or-lose-it, ya definido).
    // Médico y Mantenimiento COMPARTEN este mismo fondo de dados: hay que
    // repartir entre las dos plantillas de cartas cada partido.
    state.diceAvailable = lmDicePoolPorPartido();
    state.medicoCambiosUsados = 0;
    state.mantenimientoCambiosUsados = 0;
    state.directorGeneralCambiosUsados = 0;
    state.directorDeportivoCambiosUsados = 0;
    state.preparadorFisicoCambiosUsados = 0;
    state.dadoRerollsDisponibles = lmRerollsPorPartido();
    // Cada partido trae caras nuevas: la mano de cartas de los 5
    // departamentos se renueva por completo (respetando las que ya
    // están agotadas por haber llegado a nivel máximo).
    state.medicoCartas = inicializarCartasMedico();
    state.mantenimientoCartas = inicializarCartasMantenimiento();
    state.directorGeneralCartas = inicializarCartasDG();
    state.directorDeportivoCartas = inicializarCartasDD();
    state.preparadorFisicoCartas = inicializarCartasPF();

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
      enviarCorreo('directorGeneral', t('correo.nuevos_candidatos.asunto'),
        t('correo.nuevos_candidatos.cuerpo'),
        {asunto:'correo.nuevos_candidatos.asunto', cuerpo:'correo.nuevos_candidatos.cuerpo'});
      state.correoInterno[0].tipoEspecial='nuevos_candidatos';
    }

    state.plantilla.forEach(p=>{
      if(p.id===jugadorLesionadoEstaJornada) return; // se acaba de lesionar ahora mismo: su cuenta atrás empieza la próxima jornada, no esta
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
    // El efecto del calendario de entrenamiento (entrenar cansa, descansar
    // recupera) ya se resuelve antes, en procesarEntrenamientoSemanal(),
    // así se nota en el acto y no hay que esperar a jugar el partido.
    if(miPartidoInfo){
      const titularIdsJornada=new Set(Object.values(state.alineacion||{}).filter(Boolean));
      const factorResistencia=1-nivelDePF('resistenciaBase')*0.12;
      // Discurso Motivador: pequeño extra de recuperación tras CADA
      // partido, encima de lo que ya da el Preparador Físico — nunca
      // sustituye su plan, solo lo complementa.
      const recuperacionExtra=nivelDePF('recuperacionSemanal')*5 + ((typeof lmSkillActiva==='function' && lmSkillActiva('lm_discurso_motivador')) ? 4 : 0);
      state.plantilla.forEach(p=>{
        const actual=(p.fatigue===undefined)?100:p.fatigue;
        if(!titularIdsJornada.has(p.id)){ p.fatigue=100; return; }
        if(p.position==='POR'){ p.fatigue=Math.max(0, Math.min(100, Math.round(actual-(2+Math.random()*4)*factorResistencia+recuperacionExtra))); return; }
        let loss=8+Math.random()*6;
        if(p.position==='DFC') loss*=0.65;
        p.fatigue=Math.max(0, Math.min(100, Math.round(actual-loss*factorResistencia+recuperacionExtra)));
      });
    }

    // Blindado: un fallo aquí (correo/ofertas) NUNCA debe impedir que la
    // jornada avance — antes un error sin capturar aquí dejaba todo el
    // juego bloqueado sin ningún aviso.
    try{ procesarOfertasTraspaso(); }catch(e){ console.error('procesarOfertasTraspaso:', e); }
    try{ generarCorreosTrasJornada(); }catch(e){ console.error('generarCorreosTrasJornada:', e); }
    try{ resolverQuinielaSiToca(j); }catch(e){ console.error('resolverQuinielaSiToca:', e); }

    state.jornadaActual++;
    if(typeof window.unlockLMAchievement==='function'){
      try{
        const clasif=calcularClasificacion();
        const miPos=clasif.findIndex(t=>t.id==='lm_0')+1;
        const misDatos=clasif.find(t=>t.id==='lm_0');
        // Rastreo para el Ave Fénix: si en algún momento de la
        // temporada se estuvo en zona de descenso, se marca aquí —
        // reiniciado al empezar cada temporada nueva.
        if(miPos>=18) state.estuvoEnDescensoEstaTemporada=true;
        if(miPos>0 && miPos<=4) window.unlockLMAchievement('lm_top4', false);
        if(misDatos && misDatos.pg>=10) window.unlockLMAchievement('lm_win_10', false);
        if(misDatos && misDatos.pg>=5) window.unlockLMAchievement('lm_5_wins', false);
        if(misDatos && misDatos.pg>=20) window.unlockLMAchievement('lm_20_wins', false);
        if(misDatos && misDatos.gf>=10) window.unlockLMAchievement('lm_10_goals', false);
        // Resultado del partido que se acaba de jugar — primer gol,
        // primera derrota, primer empate.
        if(miPartidoInfo){
          const miEsLocalDeEste2 = miPartidoInfo.home.id==='lm_0';
          const misGolesDeEste = miEsLocalDeEste2 ? miPartidoInfo.resultado.golesA : miPartidoInfo.resultado.golesB;
          const rivalGolesDeEste = miEsLocalDeEste2 ? miPartidoInfo.resultado.golesB : miPartidoInfo.resultado.golesA;
          if(misGolesDeEste>0) window.unlockLMAchievement('lm_first_goal', false);
          if(misGolesDeEste<rivalGolesDeEste) window.unlockLMAchievement('lm_first_defeat', false);
          if(misGolesDeEste===rivalGolesDeEste) window.unlockLMAchievement('lm_first_draw', false);
          // Gol en el descuento que decide una victoria — minuto 85+.
          if(misGolesDeEste>rivalGolesDeEste){
            const miLadoEste = miEsLocalDeEste2 ? 'home' : 'away';
            const huboGolTardio=(miPartidoInfo.eventos||[]).some(e=>e.type==='goal' && e.team===miLadoEste && e.minute>=85);
            if(huboGolTardio) window.unlockLMAchievement('lm_gol_ultimo_minuto', false);
          }
        }
        // Racha sin perder — reutiliza state.rachaResultados, que ya se
        // actualiza en otro punto tras cada partido.
        if(state.rachaResultados>=5) window.unlockLMAchievement('lm_undefeated_5', false);
        // Jornadas seguidas sin ninguna lesión — se reinicia en cuanto
        // hay una (jugadorLesionadoEstaJornada, ya calculado más
        // arriba en esta misma función).
        if(jugadorLesionadoEstaJornada) state.jornadasSinLesion=0;
        else state.jornadasSinLesion=(state.jornadasSinLesion||0)+1;
        if(state.jornadasSinLesion>=4) window.unlockLMAchievement('lm_no_injuries_month', false);
        // Cuerpo técnico y estadio — comprobables directamente desde el
        // estado en cualquier momento, no solo tras jugar.
        const rolesContratados=['medico','mantenimiento','directorGeneral','directorDeportivo','preparadorFisico'].filter(r=>state.trabajadores && state.trabajadores[r]);
        if(rolesContratados.length>=5) window.unlockLMAchievement('lm_all_departments', false);
        // Departamento de élite: TODAS las pistas de nivel de un mismo
        // departamento en el máximo a la vez (no basta con una sola).
        const deptosNiveles=[state.medicoNiveles, state.mantenimientoNiveles, state.directorGeneralNiveles, state.directorDeportivoNiveles, state.preparadorFisicoNiveles];
        if(deptosNiveles.some(niv=>niv && Object.values(niv).length>0 && Object.values(niv).every(n=>n>=NIVEL_MAXIMO_EQUIPO))) window.unlockLMAchievement('lm_max_level_dept', false);
        // Estadio de primer nivel: césped y satisfacción prácticamente
        // al máximo a la vez (no existe un "nivel 1-5" único de
        // estadio como tal — esta es la aproximación más fiel).
        if(state.estadio && state.estadio.campo>=99 && state.estadio.satisfaccion>=99) window.unlockLMAchievement('lm_stadium_max', false);
        // Cuentas saneadas: simplificación deliberada de "cierra un mes
        // en positivo" — se comprueba el capital actual cada vez que
        // se juega, no solo en el límite exacto de cada mes.
        if((state.capital||0)>=0) window.unlockLMAchievement('lm_positive_balance', false);
        if(state.estadio && rolesContratados.length>=5){ /* estadio de nivel máximo: pendiente de una comprobación fiable, no bloquea el resto */ }
        if(state.jornadaActual>38){
          window.unlockLMAchievement('lm_season_complete', false);
          if(miPos===1){
            window.unlockLMAchievement('lm_champion', false);
            // Dinastía: 2 ligas ganadas con el mismo club — solo tiene
            // sentido contarlo si la partida sigue viva (se continúa
            // con progreso), nunca si se empieza una liga nueva desde
            // cero, que ya seria otro club.
            state.titulosGanados=(state.titulosGanados||0)+1;
            if(state.titulosGanados>=2) window.unlockLMAchievement('lm_dynasty', false);
          }
          if(miPos<=10) window.unlockLMAchievement('lm_top_half', false);
          if(misDatos && misDatos.pp===0) window.unlockLMAchievement('lm_perfect_season', false);
          // Ave Fénix: estuvo en descenso en algún momento de esta
          // misma temporada y ha terminado fuera de esa zona.
          if(state.estuvoEnDescensoEstaTemporada && miPos<18) window.unlockLMAchievement('lm_fenix_liga', false);
          state.estuvoEnDescensoEstaTemporada=false;
        }
      }catch(e){}
    }
    guardarEstado();
    return miPartidoInfo;
  }

  /* ---------- 8a. Herramienta de desarrollo (SOLO cuenta jesuslor85@gmail.com):
     simula al instante, sin ninguna interfaz de partido, todas las jornadas
     que quedan hasta dejar la liga justo en la ÚLTIMA jornada (38) sin
     jugar todavía. Todos los partidos de todos los equipos se resuelven al
     azar con el mismo motor (simularPartido), EXCEPTO los de mi equipo,
     cuyo resultado se fuerza a victoria o derrota (marcador aleatorio
     dentro de ese resultado forzado). No reproduce el resto de sistemas
     de una jornada normal (fichas médicas, nómina, correo, fatiga...) —
     es una herramienta de depuración, no una simulación fiel jornada a
     jornada. ---------- */
  function lmDevSimularHastaUltimaJornada(forzar){
    // forzar: 'ganar' | 'perder'
    const ULTIMA_SIN_JUGAR = 38; // se deja esta jornada sin resolver
    for(let j=state.jornadaActual-1; j<ULTIMA_SIN_JUGAR-1; j++){
      const jornada=state.calendario[j];
      if(!jornada) break;
      jornada.forEach(partido=>{
        const key=j+'-'+partido.home.id+'-'+partido.away.id;
        if(state.resultados[key]) return;
        const miEsLocal = partido.home.id==='lm_0';
        const esMiPartido = miEsLocal || partido.away.id==='lm_0';
        let resultado;
        if(esMiPartido){
          let misGoles, susGoles;
          if(forzar==='ganar'){
            misGoles=1+Math.floor(Math.random()*4);
            susGoles=Math.floor(Math.random()*misGoles);
          }else{
            susGoles=1+Math.floor(Math.random()*4);
            misGoles=Math.floor(Math.random()*susGoles);
          }
          resultado = miEsLocal ? {golesA:misGoles,golesB:susGoles,posesionA:50,posesionB:50} : {golesA:susGoles,golesB:misGoles,posesionA:50,posesionB:50};
        }else{
          resultado = simularPartido(partido.home, partido.away, null);
        }
        state.resultados[key]=resultado;
      });
    }
    state.jornadaActual = ULTIMA_SIN_JUGAR;
    guardarEstado();
    render();
  }

  /* ---------- 8b. Partido en vivo — CALCO exacto de Copa Leyendas: mismas
     clases CSS (.match-modal/.match-header/.match-side/.match-team-name/
     .match-scoreline), dos tiempos claramente separados con descanso,
     goles con goleador real, lesiones durante el propio partido, y
     badge de racha (🔥) si el goleador lleva varios partidos marcando. ---------- */
  // Vista rápida de la semana antes del partido — avanza sola día a día
  // (mismo espíritu que el minutero del partido en vivo, pero con los
  // días de la semana), mostrando qué ha pasado en cada uno según el
  // calendario. Al llegar al final, hay que pulsar para jugar el partido.
  const DIAS_LARGO_KEYS=['lm.dia_domingo','lm.dia_lunes','lm.dia_martes','lm.dia_miercoles','lm.dia_jueves','lm.dia_viernes','lm.dia_sabado'];
  function diaLargo(idx){ return t(DIAS_LARGO_KEYS[idx]); }
  // Rueda de prensa de Liga Manager — MISMA mecánica e interfaz que Copa
  // Leyendas (mismas clases CSS .press-modal, mismo temporizador de 8s),
  // pero con preguntas reescritas para encajar en el contexto de una
  // liga regular (jornadas, clasificación, rival concreto) en vez de un
  // torneo de eliminatorias. check(r) se evalúa después del partido
  // contra {myGoals, oppGoals, draw}.
  const LM_PRESS_EVENTS=[
    { get q(){return t('lm.prensa.q1');}, answers:[
      { get text(){return t('lm.prensa.q1.a1');}, stance:'positive', get label(){return t('lm.prensa.q1.a1_label');}, check:(r)=>r.oppGoals===0 },
      { get text(){return t('lm.prensa.q1.a2');}, stance:'neutral', get label(){return t('lm.prensa.q1.a2_label');}, check:()=>null },
      { get text(){return t('lm.prensa.q1.a3');}, stance:'negative', get label(){return t('lm.prensa.q1.a3_label');}, check:(r)=>r.oppGoals>0 },
    ]},
    { get q(){return t('lm.prensa.q2');}, answers:[
      { get text(){return t('lm.prensa.q2.a1');}, stance:'positive', get label(){return t('lm.prensa.q2.a1_label');}, check:(r)=>(r.myGoals-r.oppGoals)>=3 },
      { get text(){return t('lm.prensa.q2.a2');}, stance:'neutral', get label(){return t('lm.prensa.q2.a2_label');}, check:()=>null },
      { get text(){return t('lm.prensa.q2.a3');}, stance:'negative', get label(){return t('lm.prensa.q2.a3_label');}, check:(r)=>(r.myGoals-r.oppGoals)<3 },
    ]},
    { get q(){return t('lm.prensa.q3');}, answers:[
      { get text(){return t('lm.prensa.q3.a1');}, stance:'positive', get label(){return t('lm.prensa.q3.a1_label');}, check:(r)=>r.myGoals>r.oppGoals },
      { get text(){return t('lm.prensa.q3.a2');}, stance:'neutral', get label(){return t('lm.prensa.q3.a2_label');}, check:()=>null },
      { get text(){return t('lm.prensa.q3.a3');}, stance:'negative', get label(){return t('lm.prensa.q3.a3_label');}, check:(r)=>r.myGoals<=r.oppGoals },
    ]},
    { get q(){return t('lm.prensa.q4');}, answers:[
      { get text(){return t('lm.prensa.q4.a1');}, stance:'positive', get label(){return t('lm.prensa.q4.a1_label');}, check:(r)=>r.myGoals>0 },
      { get text(){return t('lm.prensa.q4.a2');}, stance:'neutral', get label(){return t('lm.prensa.q4.a2_label');}, check:()=>null },
      { get text(){return t('lm.prensa.q4.a3');}, stance:'negative', get label(){return t('lm.prensa.q4.a3_label');}, check:(r)=>r.myGoals===0 },
    ]},
    { get q(){return t('lm.prensa.q5');}, answers:[
      { get text(){return t('lm.prensa.q5.a1');}, stance:'positive', get label(){return t('lm.prensa.q5.a1_label');}, check:(r)=>r.myGoals>=r.oppGoals },
      { get text(){return t('lm.prensa.q5.a2');}, stance:'neutral', get label(){return t('lm.prensa.q5.a2_label');}, check:()=>null },
      { get text(){return t('lm.prensa.q5.a3');}, stance:'negative', get label(){return t('lm.prensa.q5.a3_label');}, check:(r)=>r.oppGoals>r.myGoals },
    ]},
    { get q(){return t('lm.prensa.q6');}, answers:[
      { get text(){return t('lm.prensa.q6.a1');}, stance:'positive', get label(){return t('lm.prensa.q6.a1_label');}, check:(r)=>r.myGoals>r.oppGoals },
      { get text(){return t('lm.prensa.q6.a2');}, stance:'neutral', get label(){return t('lm.prensa.q6.a2_label');}, check:()=>null },
      { get text(){return t('lm.prensa.q6.a3');}, stance:'negative', get label(){return t('lm.prensa.q6.a3_label');}, check:(r)=>r.myGoals<r.oppGoals },
    ]},
    { get q(){return t('lm.prensa.q7');}, answers:[
      { get text(){return t('lm.prensa.q7.a1');}, stance:'positive', get label(){return t('lm.prensa.q7.a1_label');}, check:(r)=>r.myGoals>1 },
      { get text(){return t('lm.prensa.q7.a2');}, stance:'neutral', get label(){return t('lm.prensa.q7.a2_label');}, check:()=>null },
      { get text(){return t('lm.prensa.q7.a3');}, stance:'negative', get label(){return t('lm.prensa.q7.a3_label');}, check:(r)=>r.myGoals<=1 },
    ]},
    { get q(){return t('lm.prensa.q8');}, answers:[
      { get text(){return t('lm.prensa.q8.a1');}, stance:'positive', get label(){return t('lm.prensa.q8.a1_label');}, check:(r)=>r.oppGoals<2 },
      { get text(){return t('lm.prensa.q8.a2');}, stance:'neutral', get label(){return t('lm.prensa.q8.a2_label');}, check:()=>null },
      { get text(){return t('lm.prensa.q8.a3');}, stance:'negative', get label(){return t('lm.prensa.q8.a3_label');}, check:(r)=>r.oppGoals>=2 },
    ]},
    { get q(){return t('lm.prensa.q9');}, answers:[
      { get text(){return t('lm.prensa.q9.a1');}, stance:'positive', get label(){return t('lm.prensa.q9.a1_label');}, check:(r)=>!r.draw },
      { get text(){return t('lm.prensa.q9.a2');}, stance:'neutral', get label(){return t('lm.prensa.q9.a2_label');}, check:()=>null },
      { get text(){return t('lm.prensa.q9.a3');}, stance:'negative', get label(){return t('lm.prensa.q9.a3_label');}, check:(r)=>r.draw },
    ]},
  ];
  // Devuelve una pregunta al azar, ya con el nombre del rival incrustado
  // donde corresponde, para que la entrevista se sienta específica de
  // ese partido concreto.
  function elegirPreguntaPrensaLM(rivalName){
    const idx=Math.floor(Math.random()*LM_PRESS_EVENTS.length);
    const def=LM_PRESS_EVENTS[idx];
    // Solo la pregunta 2 (sobre ganar por tres goles) incrusta el
    // nombre del rival — usa tp() con marcador {rival} en vez de
    // buscar y sustituir texto en español, que dejaba de funcionar
    // en cualquier otro idioma.
    const q = idx===1 ? tp('lm.prensa.q2', {rival:rivalName||'el rival'}) : def.q;
    return {...def, q};
  }
  // Muestra la rueda de prensa reutilizando literalmente las mismas
  // clases CSS que Copa Leyendas (.press-modal/.press-icon/...), con el
  // mismo temporizador de 8s. Al responder o agotarse el tiempo, guarda
  // la promesa pendiente en el estado y continúa el flujo de la semana.
  function mostrarRuedaPrensaLM(overlay, rivalName, onDone){
    const event=elegirPreguntaPrensaLM(rivalName);
    overlay.innerHTML=`
      <div class="press-modal">
        <h3>${t('lm.rueda_prensa')}</h3>
        <img src="assets/images/rueda_prensa.png" class="press-image" alt="Rueda de prensa">
        <p class="press-question">${event.q}</p>
        <div class="press-answers">
          ${event.answers.map((a,i)=>`
            <button class="press-answer-btn" data-lm-press-answer="${i}">
              <span>${a.text}</span>
              <span class="press-answer-label">${a.label}</span>
            </button>`).join('')}
        </div>
        <div class="press-timer-track"><div class="press-timer-fill" id="lmPressTimerFill"></div></div>
      </div>`;
    let respondido=false;
    const DURATION=8000;
    const fill=document.getElementById('lmPressTimerFill');
    const beepTimers=[5,4,3,2,1].map(secLeft=>setTimeout(()=>{
      if(respondido) return;
      if(typeof checkCountdownBeep==='function') checkCountdownBeep(secLeft, 'lmPressConference');
    }, DURATION-secLeft*1000));
    if(fill){
      fill.style.transition='none';
      fill.style.width='100%';
      requestAnimationFrame(()=>{
        requestAnimationFrame(()=>{
          fill.style.transition=`width ${DURATION}ms linear`;
          fill.style.width='0%';
        });
      });
    }
    const timerId=setTimeout(()=>{
      if(respondido) return;
      respondido=true;
      // Aunque se agote el tiempo sin responder, la imagen también
      // cambia (a la neutral) y se deja ver 1 segundo antes de
      // cerrar — igual que cuando sí se responde.
      const imgEl=overlay.querySelector('.press-image');
      if(imgEl){
        imgEl.classList.add('fading');
        setTimeout(()=>{
          imgEl.src='assets/images/rueda_prensa_neutral.png';
          imgEl.classList.remove('fading');
        }, 220);
      }
      if(typeof showToast==='function') showToast('No respondiste a tiempo — la prensa se queda sin declaraciones.', 'toast-neutral');
      setTimeout(onDone, 1000);
    }, DURATION);
    overlay.querySelectorAll('[data-lm-press-answer]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        if(respondido) return;
        respondido=true;
        clearTimeout(timerId);
        beepTimers.forEach(id=>clearTimeout(id));
        const idx=parseInt(btn.getAttribute('data-lm-press-answer'),10);
        const answer=event.answers[idx];
        // Cambia la imagen de cabecera a la que corresponda al tono
        // de la respuesta elegida, con un fundido rápido — mismo
        // efecto que en Copa Leyendas.
        const imgEl=overlay.querySelector('.press-image');
        if(imgEl){
          const archivo = answer.stance==='positive' ? 'rueda_prensa_optimista.png'
            : answer.stance==='negative' ? 'rueda_prensa_pesimista.png'
            : 'rueda_prensa_neutral.png';
          imgEl.classList.add('fading');
          setTimeout(()=>{
            imgEl.src='assets/images/'+archivo;
            imgEl.classList.remove('fading');
          }, 220);
        }
        state.lmPendingPrediction={event, answer};
        guardarEstado();
        if(typeof window.playSound==='function') window.playSound('select');
        if(typeof showToast==='function') showToast(`Promesa hecha: "${answer.label}"`, 'toast-neutral');
        setTimeout(onDone, 1700);
      });
    });
  }
  // Resuelve la promesa pendiente contra el resultado real del partido
  // — mismo efecto que Copa Leyendas: ±8 de moral, o 0 si fue neutral.
  function resolverPrensaLM(miGoles, suGoles){
    // Esta función puede llamarse más de una vez en el mismo partido
    // (una desde el origen común, otra de forma redundante en el
    // código específico del modo automático) — la marca evita que la
    // segunda llamada, al encontrar lmPendingPrediction ya vacío por
    // la primera, borre por error el resultado que la primera ya
    // había guardado correctamente.
    if(state._prensaResueltaEstePartido) return null;
    if(!state.lmPendingPrediction){
      // Sin rueda de prensa en este partido concreto — se limpia el
      // resultado guardado, para que el histórico de ESTE partido
      // nunca muestre por error la promesa de una jornada anterior.
      state.ultimaPrensaResuelta=null;
      state._prensaResueltaEstePartido=true;
      return null;
    }
    state._prensaResueltaEstePartido=true;
    const {answer}=state.lmPendingPrediction;
    state.lmPendingPrediction=null;
    if(answer.stance==='neutral'){
      const r={label:answer.label, outcome:'neutral', delta:0, texto:'🎙 Respuesta neutral: la moral no se ve afectada.'};
      state.ultimaPrensaResuelta=r;
      return r;
    }
    const correcto=answer.check({myGoals:miGoles, oppGoals:suGoles, draw:miGoles===suGoles});
    const delta=correcto?8:-8;
    state.moral=Math.max(-50,Math.min(50,(state.moral||0)+delta));
    const r={
      label:answer.label, outcome:correcto?'correct':'wrong', delta,
      texto: correcto
        ? `🎙 Promesa cumplida ("${answer.label}"): +${delta} moral.`
        : `🎙 Promesa incumplida ("${answer.label}"): ${delta} moral.`
    };
    // Se guarda aparte (no solo se devuelve), para que el histórico
    // del partido pueda mencionarlo aunque se abra más tarde, cuando
    // state.lmPendingPrediction ya se haya vaciado.
    state.ultimaPrensaResuelta=r;
    return r;
  }

  function mostrarSemanaEnVivo(eventosDias, onAceptar){
    const overlay=document.createElement('div');
    overlay.id='lmSemanaOverlay';
    document.getElementById('ligaManagerScreen').appendChild(overlay);
    const rival=(()=>{
      const j=state.jornadaActual-1;
      const jornada=j>=0 && j<38 ? state.calendario[j] : null;
      const miPartido=jornada?jornada.find(p=>p.home.id==='lm_0'||p.away.id==='lm_0'):null;
      if(!miPartido) return null;
      return miPartido.home.id==='lm_0'?miPartido.away:miPartido.home;
    })();
    // Historial final — resumen de TODO lo ocurrido en la semana, con un
    // único botón ACEPTAR que solo cierra esta ventana. El partido no se
    // juega aquí: hace falta un segundo SEGUIR aparte para eso.
    function pantallaResumen(){
      const r=eventosDias.resumenSemanal || {diasEntreno:0, diasDescanso:0, mejoras:[], lesiones:[], NOMBRE_STAT:{}};
      const totalMejoras=r.mejoras.reduce((s,m)=>s+Object.values(m.stats).reduce((a,b)=>a+b,0), 0);
      const filasMejoras=r.mejoras.map(m=>{
        const detalle=Object.entries(m.stats).map(([campo,cant])=>`${r.NOMBRE_STAT[campo]||campo} +${cant}`).join(', ');
        return `<div class="lm-resumen-fila">
          <i class="ph ph-bold ph-trend-up" style="color:#5dcaa5"></i>
          <span><strong>${m.nombre}</strong> — ${detalle}</span>
        </div>`;
      }).join('');
      const filasLesiones=r.lesiones.map(l=>`
        <div class="lm-resumen-fila">
          <i class="ph ph-bold ph-first-aid-kit" style="color:#e24b4a"></i>
          <span><strong>${l.nombre}</strong> — ${l.familia==='muscular'?t('lm.sobrecarga_muscular'):t('lm.sobrecarga_osea')}</span>
        </div>`).join('');
      overlay.innerHTML=`
        <div class="lm-dilemma-card lm-semana-card-fija" style="width:420px;max-width:92vw;text-align:left">
          <div class="lm-dilemma-title"><i class="ph ph-bold ph-flag-checkered"></i> ${t('lm.semana_completada')}</div>
          ${rival?`<div class="lm-rival-crest-block" style="margin:6px auto 12px">${rivalCrestHTML(56, rival.crestImg)}<span class="lm-title" style="font-size:13px">${t('lm.proximo_corto')} ${rival.name}</span></div>`:''}
          <div class="lm-resumen-stats-row">
            <div class="lm-resumen-stat"><i class="ph ph-bold ph-barbell" style="color:#e08a3e"></i><strong>${r.diasEntreno}</strong><span>${t('lm.resumen_entreno')}</span></div>
            <div class="lm-resumen-stat"><i class="ph ph-bold ph-bed" style="color:#5dcaa5"></i><strong>${r.diasDescanso}</strong><span>${t('lm.resumen_descanso')}</span></div>
            <div class="lm-resumen-stat"><i class="ph ph-bold ph-trend-up" style="color:#5dcaa5"></i><strong>${totalMejoras}</strong><span>${t('lm.resumen_mejoras')}</span></div>
            <div class="lm-resumen-stat"><i class="ph ph-bold ph-first-aid-kit" style="color:#e24b4a"></i><strong>${r.lesiones.length}</strong><span>${t('lm.resumen_lesiones')}</span></div>
          </div>
          ${(filasMejoras||filasLesiones)?`<div class="lm-resumen-lista">${filasMejoras}${filasLesiones}</div>`:`<p class="lm-setup-desc" style="text-align:center">${t('lm.semana_sin_incidencias')}</p>`}
          <div class="lm-popup-actions" style="justify-content:center">
            <button id="lmSemanaAceptarBtn" class="mode-card-btn mode-card-btn-gold" style="width:auto;padding:10px 30px">${t('lm.aceptar')}</button>
          </div>
        </div>`;
      document.getElementById('lmSemanaAceptarBtn').addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        overlay.remove();
        onAceptar();
      });
    }
    if(!eventosDias || !eventosDias.length){ pantallaResumen(); return; }
    // Rueda de prensa — un día al azar de esta semana, antes del
    // partido, con un 35% de probabilidad (si no hay ya una promesa
    // pendiente de una semana anterior sin resolver). Pausa el flujo de
    // días hasta que se responda o se agote el tiempo.
    const diaPrensaIdx = (rival && !state.lmPendingPrediction && Math.random()<0.5)
      ? Math.floor(Math.random()*eventosDias.length) : -1;
    let idx=0;
    function pintarDia(){
      if(idx===diaPrensaIdx){
        mostrarRuedaPrensaLM(overlay, rival?rival.name:null, ()=>{
          idx++;
          if(idx<eventosDias.length) pintarDia(); else pantallaResumen();
        });
        return;
      }
      const ev=eventosDias[idx];
      const nombreDia=diaLargo(ev.fecha.getDay());
      if(typeof window.playSound==='function') window.playSound(ev.tipo==='entreno'?'training_day':'rest_day');
      overlay.innerHTML=`
        <div class="lm-dilemma-card lm-semana-card-fija" style="width:380px;max-width:92vw">
          <div class="lm-dilemma-title" style="text-transform:uppercase;justify-content:center;text-align:center">${nombreDia} ${ev.fecha.getDate()}</div>
          <div class="lm-semana-dia-icono ${ev.tipo==='entreno'?'lm-semana-entreno':'lm-semana-descanso'}">
            <i class="ph ph-bold ${ev.tipo==='entreno'?'ph-barbell':'ph-bed'}"></i>
          </div>
          <div class="lm-semana-dia-tag">${ev.tipo==='entreno'?t('lm.dia_entrenamiento'):t('lm.dia_descanso')}</div>
          <div class="lm-semana-dia-textos">
            ${ev.textos.map(txt=>`<p>${txt}</p>`).join('')}
          </div>
          <div class="lm-semana-progreso">
            ${eventosDias.map((_,i)=>`<span class="lm-semana-punto ${i<=idx?'lm-semana-punto-activo':''}"></span>`).join('')}
          </div>
        </div>`;
      setTimeout(()=>{
        idx++;
        if(idx<eventosDias.length) pintarDia();
        else pantallaResumen();
      }, 700);
    }
    pintarDia();
  }

  function mostrarPartidoEnVivo(info, onFinish){
    const miEsLocal = info.home.id==='lm_0';
    const overlay=document.createElement('div');
    overlay.id='lmMatchOverlay';
    overlay.innerHTML=`
      <div class="match-modal" style="overflow:hidden;display:flex;flex-direction:column;max-height:85vh">
        <div class="match-header">
          <div class="match-side">
            ${miEsLocal?crestHTML(state.escudo,92):rivalCrestHTML(92, info.home.crestImg)}
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
            ${!miEsLocal?crestHTML(state.escudo,92):rivalCrestHTML(92, info.away.crestImg)}
            <span class="match-team-name">${info.away.name}</span>
          </div>
        </div>
        <div id="lmLiveEvents" style="flex:1;overflow-y:auto;display:flex;flex-direction:column;align-items:stretch;gap:2px;padding:4px 0;min-height:80px;max-height:260px"></div>
        <div id="lmPostMatchInfo"></div>
        <button id="lmHistoricoBtn" class="mode-card-btn mode-card-btn-secondary" style="display:none;width:100%;margin-top:8px"><i class="ph ph-bold ph-notebook"></i> ${t('lm.historico_partido_btn')}</button>
        <button id="lmLiveContinuar" class="mode-card-btn mode-card-btn-gold" style="display:none;width:100%;padding:11px;margin-top:10px">${t('lm.continuar')}</button>
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
    let start=performance.now();
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
          // Oferta de Giro Táctico — solo si vamos perdiendo al
          // descanso y quedan usos disponibles esta media temporada.
          // Se pausa aquí (no se programa el siguiente
          // requestAnimationFrame) hasta que el jugador decida.
          const miGolesHT = miEsLocal?curHome:curOpp, rivalGolesHT = miEsLocal?curOpp:curHome;
          // Por defecto, pierdiendo O empatado al descanso. Con la
          // habilidad Lectura de Partido, incluso ganando por la
          // mínima (protege una ventaja corta).
          const vaMalAlDescansoAuto = lmSkillActiva('lm_lectura_partido') ? miGolesHT<=rivalGolesHT+1 : miGolesHT<=rivalGolesHT;
          if(vaMalAlDescansoAuto && (state.giroTacticoUsosRestantes||0)>0 && typeof window.LMGiroTactico!=='object'){
            console.error('[Liga Manager] Giro Táctico no disponible: liga-manager-giro-tactico.js no se ha cargado (revisa que el archivo y el <script> en index.html estén subidos al servidor).');
          }
          if(typeof window.LMGiroTactico==='object' && vaMalAlDescansoAuto && (state.giroTacticoUsosRestantes||0)>0){
            const misStatsHT = calcularStatsEquipo();
            const rivalTeamObjHT = miEsLocal ? info.away : info.home;
            const pausaInicioTs=performance.now();
            const reanudar=()=>{ start+=(performance.now()-pausaInicioTs); requestAnimationFrame(tick); };
            window.LMGiroTactico.ofrecerSiProcede({
              contenedor: document.getElementById('ligaManagerScreen'),
              t, usosRestantes: state.giroTacticoUsosRestantes,
              misStats: misStatsHT, rivalStats:{attack:rivalTeamObjHT.attack,defense:rivalTeamObjHT.defense,pace:rivalTeamObjHT.pace,passing:rivalTeamObjHT.passing,technique:rivalTeamObjHT.technique},
              rivalTeamObj: rivalTeamObjHT, esMiEquipoLocal: miEsLocal, miNombre: state.nombreEquipo, rivalNombre: rivalTeamObjHT.name,
              manoDuraActiva: lmSkillActiva('lm_mano_dura'),
              golesMiosPrimeraParte: miGolesHT, golesRivalPrimeraParte: rivalGolesHT,
              elegirGoleador, jugadorRivalAleatorio, elegirJugadorAlineado,
              onConsumirUso: ()=>{
                state.giroTacticoUsosRestantes=Math.max(0,(state.giroTacticoUsosRestantes||0)-1);
                if(typeof window.unlockLMAchievement==='function') window.unlockLMAchievement('lm_giro_primera_vez', false);
                if(state.giroTacticoUsosRestantes<=0 && typeof window.unlockLMAchievement==='function') window.unlockLMAchievement('lm_giro_agotado', false);
                guardarEstado();
              },
              onResultadoFinal: (golesMios2P, golesRival2P, nuevosEventos2P)=>{
                const miLadoEv = miEsLocal ? 'home' : 'away';
                info.eventos.filter(e=>e.minute>45 && e.team===miLadoEv && e.jugador && e.jugador.id).forEach(e=>{
                  const p=(state.plantilla||[]).find(x=>x.id===e.jugador.id);
                  if(p && p.golesTemporada) p.golesTemporada=Math.max(0,p.golesTemporada-1);
                });
                nuevosEventos2P.filter(e=>e.type==='goal' && e.team===miLadoEv && e.jugador && e.jugador.id).forEach(e=>{
                  const p=(state.plantilla||[]).find(x=>x.id===e.jugador.id);
                  if(p) p.golesTemporada=(p.golesTemporada||0)+1;
                });
                info.eventos = info.eventos.filter(e=>e.minute<=45).concat(nuevosEventos2P).sort((a,b)=>a.minute-b.minute);
                const nuevoGolesA = miEsLocal ? (curHome+golesMios2P) : (curHome+golesRival2P);
                const nuevoGolesB = miEsLocal ? (curOpp+golesRival2P) : (curOpp+golesMios2P);
                info.resultado.golesA=nuevoGolesA; info.resultado.golesB=nuevoGolesB;
                if(info.jornadaIndex!==undefined){
                  const key=info.jornadaIndex+'-'+info.home.id+'-'+info.away.id;
                  if(state.resultados[key]) state.resultados[key]={...state.resultados[key], golesA:nuevoGolesA, golesB:nuevoGolesB};
                }
                const misGolesFinalesAuto = miEsLocal ? nuevoGolesA : nuevoGolesB;
                const rivalGolesFinalesAuto = miEsLocal ? nuevoGolesB : nuevoGolesA;
                if(misGolesFinalesAuto>rivalGolesFinalesAuto && typeof window.unlockLMAchievement==='function'){
                  window.unlockLMAchievement('lm_giro_remontada', false);
                  state.giroRemontadasTotales=(state.giroRemontadasTotales||0)+1;
                  if(state.giroRemontadasTotales>=3) window.unlockLMAchievement('lm_giro_leyenda', false);
                }
                guardarEstado();
                reanudar();
              },
              onCancelado: reanudar
            });
            return;
          }
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
          const racha = ev.jugador && ev.jugador.racha>=2 ? ` <span title="${t('lm.tt_racha_gol')}">🔥${ev.jugador.racha}</span>` : '';
          const nombre = ev.jugador ? ev.jugador.name : equipoGol;
          addEvt('⚽', `<strong>${nombre}</strong>${racha}`, ev.minute+"'", esLocal);
          if(typeof window.playSound==='function') window.playSound('goal');
          if(window.G2GMusica) window.G2GMusica.reproducirGol();
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
        const prensaResuelta=resolverPrensaLM(miGoles, suGoles);
        if(prensaResuelta) guardarEstado();
        const posMioFinal2 = info.resultado.posesionA!=null ? (miEsLocal?info.resultado.posesionA:info.resultado.posesionB) : null;
        const barraPosesion2 = posMioFinal2!=null ? `
          <div class="lm-visor-posesion-titulo">${t('lm.posesion_titulo')}</div>
          <div class="lm-visor-posesion-barra">
            <div class="lm-visor-posesion-mia" style="width:${posMioFinal2}%">${posMioFinal2}%</div>
            <div class="lm-visor-posesion-rival" style="width:${100-posMioFinal2}%">${100-posMioFinal2}%</div>
          </div>` : '';
        document.getElementById('lmPostMatchInfo').innerHTML=`
          <div class="match-result-tag ${resultClass}">${resultText}</div>
          <div class="match-summary">
            <strong>${state.nombreEquipo}</strong> ${miGoles} – ${suGoles} <strong>${info.home.id==='lm_0'?info.away.name:info.home.name}</strong><br>
            ${golesA} gol${golesA===1?'':'es'} en total · ${tarjetasA} tarjeta${tarjetasA===1?'':'s'}${lesionA?` · 1 lesión (${lesionA.jugador.name})`:''}
          </div>
          ${barraPosesion2}
          ${prensaResuelta?`<div class="press-prediction-section ${prensaResuelta.outcome==='correct'?'press-prediction-good':prensaResuelta.outcome==='wrong'?'press-prediction-bad':'press-prediction-neutral'}">${prensaResuelta.texto}</div>`:''}`;

        document.getElementById('lmLiveContinuar').style.display='block';
        document.getElementById('lmHistoricoBtn').style.display='block';
      }
    }
    requestAnimationFrame(tick);

    document.getElementById('lmHistoricoBtn').addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      mostrarHistoricoPartido(info, miEsLocal);
    });
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
      jugador: jugador.name, jugadorId: jugador.id, jornadaInicio: state.jornadaActual, rival,
      severidad: sev.label, tipoLesion, familia, semanasPrevistas: sev.weeks,
      resuelta:false, resueltoPor:null, jornadasReales:null
    });
    // El médico avisa por correo de cualquier lesión nueva, no solo las
    // graves — así el aviso llega siempre, no solo en los casos más raros.
    if(state.trabajadores && state.trabajadores.medico && typeof enviarCorreo==='function'){
      enviarCorreo('medico', tp('correo.se_lesiona.asunto', {jugador:jugador.name}),
        tp('correo.se_lesiona.cuerpo', {jugador:jugador.name, tipo:tipoLesion?tipoLesion.toLowerCase():'una lesión', severidad:sev.label, semanas:sev.weeks+' '+t('lm.jornada').toLowerCase()+(sev.weeks===1?'':'s')}),
        {asunto:'correo.se_lesiona.asunto', paramsAsunto:{jugador:jugador.name}, cuerpo:'correo.se_lesiona.cuerpo', paramsCuerpo:{jugador:jugador.name, tipo:tipoLesion?tipoLesion.toLowerCase():'una lesión', severidad:sev.label, semanas:sev.weeks+' '+t('lm.jornada').toLowerCase()+(sev.weeks===1?'':'s')}});
    }
    return id;
  }
  function cerrarLesionHistorial(jugador, resueltoPor){
    // El aviso URGENTE (con su botón ATENDER) apunta a un jugador
    // concreto — si se recupera por cualquier vía (tiempo natural,
    // carta, dado urgente...) antes de haberlo atendido, hay que
    // limpiarlo aquí también, o se queda pidiendo dados para curar a
    // alguien que ya está sano.
    if(state.medicoNotificacion && state.medicoNotificacion.jugadorId===jugador.id){
      state.medicoNotificacion=null;
    }
    if(!jugador.lesionLogId || !state.medicoHistorial) return;
    const entry=state.medicoHistorial.find(h=>h.id===jugador.lesionLogId);
    if(entry && !entry.resuelta){
      entry.resuelta=true;
      entry.resueltoPor=resueltoPor;
      entry.jornadasReales=Math.max(1, state.jornadaActual-entry.jornadaInicio+1);
    }
    jugador.lesionLogId=null;
    jugador.injuryFamilia=null;
    // El médico avisa por correo de que el jugador ya está disponible —
    // así deja de tener sentido seguir ofreciendo tratarlo (ya no
    // aparece en jugadoresLesionadosPara al no estar "injured").
    if(state.trabajadores && state.trabajadores.medico && typeof enviarCorreo==='function' &&
       (!state.correoUltimoEnviado || state.correoUltimoEnviado.medico!==state.jornadaActual)){
      enviarCorreo('medico', tp('correo.recupera_disponibilidad.asunto', {jugador:jugador.name}), tp('correo.recupera_disponibilidad.cuerpo', {jugador:jugador.name}), {asunto:'correo.recupera_disponibilidad.asunto', paramsAsunto:{jugador:jugador.name}, cuerpo:'correo.recupera_disponibilidad.cuerpo', paramsCuerpo:{jugador:jugador.name}});
    }
  }
  function registrarProgresoHistorial(texto){
    state.medicoHistorial = state.medicoHistorial||[];
    state.medicoHistorial.push({id:'h'+Date.now()+Math.floor(Math.random()*1000), tipo:'progreso', jornada:state.jornadaActual, texto});
  }

  function resolverDilemaMedico(numDados, tiradas){
    if(!state.medicoNotificacion) return null;
    const suma = tiradas.reduce((a,b)=>a+b,0);
    const exito = state.medicoNotificacion ? (suma >= state.medicoNotificacion.dificultad) : false;
    if(exito){
      const jugador=state.plantilla.find(p=>p.id===state.medicoNotificacion.jugadorId);
      if(jugador){
        jugador.injuryWeeks=Math.max(0, jugador.injuryWeeks-1);
        if(jugador.injuryWeeks<=0){ jugador.injured=false; jugador.injurySeverity=null; cerrarLesionHistorial(jugador, 'Dado urgente'); }
      }
    }
    state.diceAvailable = Math.max(0, state.diceAvailable - numDados);
    const resultado={tiradas, suma, dificultad:state.medicoNotificacion?state.medicoNotificacion.dificultad:0, exito};
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
    {id:'prevencion_muscular',tipo:'nivel', track:'prevencionMuscular', nombre:'Programa de Prevención Muscular', icon:'ph-heartbeat',        dificultadBase:8, dificultadPaso:4, desc:'Reduce el riesgo de lesiones musculares (partido y sobrecarga por exceso de entrenamiento)'},
    {id:'prevencion_osea',   tipo:'nivel', track:'prevencionOsea',     nombre:'Protocolo de Protección Ósea',  icon:'ph-shield-plus',       dificultadBase:9, dificultadPaso:4, desc:'Reduce el riesgo de lesiones óseas (partido y sobrecarga por exceso de entrenamiento)'}
  ];

  const NIVEL_MAXIMO_EQUIPO=3;
  function nivelDe(track){ return (state.medicoNiveles && state.medicoNiveles[track]) || 0; }
  // Cuantas más estrellas (nivel 1-3) tenga el trabajador contratado en
  // ese puesto, más fáciles son las tiradas de dados de sus cartas —
  // 1★ no reduce nada, 2★ resta 1 punto de dificultad, 3★ resta 2.
  // Se aplica por igual a cartas de nivel y de misión, en los 5
  // departamentos del cuerpo técnico.
  function bonusEstrellasTrabajador(rol){
    const t=state.trabajadores && state.trabajadores[rol];
    return (t && t.nivel) ? Math.max(0, t.nivel-1) : 0;
  }
  function dificultadActualNivel(def){ return Math.max(3, def.dificultadBase + nivelDe(def.track)*def.dificultadPaso - bonusEstrellasTrabajador('medico')); }

  // Resumen del equipo médico por especialidad — CONDENSADO a propósito:
  // una fila por especialidad con su nivel actual en estrellas, nunca un
  // listado de cada mejora conseguida. Se reutiliza tanto en la propia
  // ficha del equipo médico como en la pestaña INSTALACIONES del
  // historial.
  const NIVELES_EQUIPO_INFO=[
    {track:'curacionMuscular',   label:'Fisioterapia',          icon:'ph-person-simple-run', desc:'Recuperación de lesiones musculares'},
    {track:'curacionOsea',       label:'Traumatología',         icon:'ph-bandaids',          desc:'Recuperación de lesiones óseas'},
    {track:'prevencionMuscular', label:'Prevención muscular',   icon:'ph-heartbeat',         desc:'Lesión muscular en partido o por sobrecarga de entreno'},
    {track:'prevencionOsea',     label:'Protección ósea',       icon:'ph-shield-plus',       desc:'Lesión ósea en partido o por sobrecarga de entreno'}
  ];
  function estrellasNivel(n, max){ max=max||NIVEL_MAXIMO_EQUIPO; n=Math.max(0,Math.min(max,n)); return '★'.repeat(n) + '☆'.repeat(max-n); }
  function renderNivelesEquipoHTML(){
    return `<div class="med-niveles-grid">${NIVELES_EQUIPO_INFO.map(info=>{
      const n=nivelDe(info.track);
      const completado=n>=NIVEL_MAXIMO_EQUIPO;
      return `<div class="med-nivel-row${completado?' med-nivel-completado':''}">
        ${completado?`<i class="ph ph-bold ph-check-circle med-nivel-check" title="${t('lm.tt_proyecto_completado')}"></i>`:''}
        <i class="ph ph-bold ${info.icon}"></i>
        <div class="med-nivel-info">
          <div class="med-nivel-label">${info.label}</div>
          <div class="med-nivel-desc">${info.desc}</div>
        </div>
        <div class="med-nivel-stars" title="${t('lm.nivel_n_de_x')} ${n}/${NIVEL_MAXIMO_EQUIPO}">${estrellasNivel(n)}</div>
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
    if((state.medicoCambiosUsados||0)>=lmCambiosCartaPorPartido()) return false;
    const otras=state.medicoCartas.filter((c,i)=>i!==idx).map(c=>c.cartaId);
    const nueva=generarCartaAleatoria(otras);
    if(!nueva) return false;
    state.medicoCartas[idx]=nueva;
    state.medicoCambiosUsados=(state.medicoCambiosUsados||0)+1;
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
          jugadorObjetivo.injuryWeeks=Math.max(0,Math.floor(jugadorObjetivo.injuryWeeks/2));
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
    if(!def) return {tipo:'error', texto:'No se encontró la carta — prueba a cambiarla.'};
    const suma=tiradas.reduce((a,b)=>a+b,0);
    let resultado;

    if(def.tipo==='directa'){
      const dificultadEfectiva=Math.max(3, def.dificultad - bonusEstrellasTrabajador('medico'));
      const exito = suma>=dificultadEfectiva;
      const jugadorObjetivo = jugadorObjetivoId ? state.plantilla.find(p=>p.id===jugadorObjetivoId) : null;
      if(exito){
        const texto=aplicarEfectoDirecta(def, jugadorObjetivo);
        state.medicoCartas[idx]=generarCartaAleatoria(state.medicoCartas.map(c=>c.cartaId)) || instancia;
        resultado={tipo:'directa', exito:true, suma, dificultad:dificultadEfectiva, texto};
      } else {
        resultado={tipo:'directa', exito:false, suma, dificultad:dificultadEfectiva, texto:'La carta se queda en tu mano — puedes reintentarlo más adelante'};
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
  function dificultadActualNivelM(def){ return Math.max(3, def.dificultadBase + nivelDeM(def.track)*def.dificultadPaso - bonusEstrellasTrabajador('mantenimiento')); }

  const NIVELES_MANTENIMIENTO_INFO=[
    {track:'prevencionDesgaste',     get label(){return t('nivel.mant.riego.label');},      icon:'ph-drop-half-bottom', get desc(){return t('nivel.mant.riego.desc');}},
    {track:'recuperacionCesped',     get label(){return t('nivel.mant.green.label');},          icon:'ph-plant',            get desc(){return t('nivel.mant.green.desc');}},
    {track:'boostSatisfaccion',      get label(){return t('nivel.mant.experiencia.label');}, icon:'ph-ticket',           get desc(){return t('nivel.mant.experiencia.desc');}},
    {track:'proteccionSatisfaccion', get label(){return t('nivel.mant.seguridad.label');},     icon:'ph-shield-star',      get desc(){return t('nivel.mant.seguridad.desc');}}
  ];
  function renderNivelesMantenimientoHTML(){
    return `<div class="med-niveles-grid">${NIVELES_MANTENIMIENTO_INFO.map(info=>{
      const n=nivelDeM(info.track);
      const completado=n>=NIVEL_MAXIMO_EQUIPO;
      return `<div class="med-nivel-row${completado?' med-nivel-completado':''}">
        ${completado?`<i class="ph ph-bold ph-check-circle med-nivel-check" title="${t('lm.tt_proyecto_completado')}"></i>`:''}
        <i class="ph ph-bold ${info.icon}"></i>
        <div class="med-nivel-info">
          <div class="med-nivel-label">${info.label}</div>
          <div class="med-nivel-desc">${info.desc}</div>
        </div>
        <div class="med-nivel-stars" title="${t('lm.nivel_n_de_x')} ${n}/${NIVEL_MAXIMO_EQUIPO}">${estrellasNivel(n)}</div>
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
    if((state.mantenimientoCambiosUsados||0)>=lmCambiosCartaPorPartido()) return false;
    const otras=state.mantenimientoCartas.filter((c,i)=>i!==idx).map(c=>c.cartaId);
    const nueva=generarCartaAleatoriaMantenimiento(otras);
    if(!nueva) return false;
    state.mantenimientoCartas[idx]=nueva;
    state.mantenimientoCambiosUsados=(state.mantenimientoCambiosUsados||0)+1;
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
    if(!def) return {tipo:'error', texto:'No se encontró la carta — prueba a cambiarla.'};
    const suma=tiradas.reduce((a,b)=>a+b,0);
    let resultado;
    if(def.tipo==='directa'){
      const dificultadEfectiva=Math.max(3, def.dificultad - bonusEstrellasTrabajador('mantenimiento'));
      const exito = suma>=dificultadEfectiva;
      if(exito){
        const texto=aplicarEfectoDirectaMantenimiento(def);
        state.mantenimientoCartas[idx]=generarCartaAleatoriaMantenimiento(state.mantenimientoCartas.map(c=>c.cartaId)) || instancia;
        resultado={tipo:'directa', exito:true, suma, dificultad:dificultadEfectiva, texto};
      } else {
        resultado={tipo:'directa', exito:false, suma, dificultad:dificultadEfectiva, texto:'La carta se queda en tu mano — puedes reintentarlo más adelante'};
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
  // Cierre universal de popups: botón X en la esquina + clic fuera de la
  // tarjeta (sobre el fondo oscuro) también cierra.
  function xCerrarHTML(){ return '<button class="lm-popup-close-x" data-cerrar-x title="Cerrar">×</button>'; }
  function habilitarCierreOverlay(overlay, cerrarFn){
    overlay.addEventListener('click', (e)=>{ if(e.target===overlay){ if(typeof window.playSound==='function') window.playSound('select'); cerrarFn(); } });
  }
  // Aviso propio del juego — sustituye al alert() nativo del navegador
  // (ese "www.goal2goat.com dice" no pinta nada aquí).
  // Botón "MOSTRAR INFORMACIÓN" de cada hub — un clic la abre, y se
  // cierra con la X, con CERRAR, o clicando fuera (igual que el resto
  // de ventanas del juego). Cada función abrirInfoFn ya trae su propio
  // cierre completo cuando se le pasa "false" (modo normal, no efímero).
  function mostrarInfoHTML(){
    return `<button type="button" class="mode-card-btn mode-card-btn-secondary lm-mostrar-info-btn" data-mostrar-info><i class="ph ph-bold ph-eye"></i> ${t('lm.mostrar_informacion')}</button>`;
  }
  function wireMostrarInfoHold(container, abrirInfoFn){
    const btn=container.querySelector('[data-mostrar-info]');
    if(!btn) return;
    btn.addEventListener('click', (e)=>{
      e.preventDefault();
      if(typeof window.playSound==='function') window.playSound('select');
      abrirInfoFn(false);
    });
  }
  // Genera un once + banquillo del rival a partir de su plantilla real y
  // su nivel medio de equipo — no tenemos stats individuales de los
  // rivales, así que se reparten con una pequeña variación alrededor de
  // su media, con una formación genérica razonable.
  function generarOnceRivalFicticio(rival){
    const nombres=plantillaEfectivaRival(rival);
    function statVariada(base){ return Math.max(35, Math.min(97, Math.round(base+Math.floor(Math.random()*13)-6))); }
    function jugadorDe(entry, idx, pos, offsetExtra){
      const nombre = entry ? (entry.name||entry) : `Jugador ${idx+1}${offsetExtra||''}`;
      const numero = entry ? entry.n : null;
      // Si el jugador ya tiene estadísticas individuales reales cargadas
      // en teams-data.js, se usan tal cual — solo se generan al azar
      // alrededor de la media del equipo para los jugadores que todavía
      // no las tienen (plantillas pendientes de completar).
      const tieneStatsReales = entry && entry.attack!==undefined;
      return {
        name:nombre, numero, position:pos,
        attack: tieneStatsReales ? entry.attack : statVariada(rival.attack),
        defense: tieneStatsReales ? entry.defense : statVariada(rival.defense),
        pace: tieneStatsReales ? entry.pace : statVariada(rival.pace),
        passing: tieneStatsReales ? entry.passing : statVariada(rival.passing),
        technique: tieneStatsReales ? entry.technique : statVariada(rival.technique)
      };
    }
    const posicionesTitulares=['POR','DFC','DFC','LI','LD','MC','MC','MC','EI','ED','DC'];
    const titulares=posicionesTitulares.map((pos,i)=>jugadorDe(nombres[i], i, pos));
    const posicionesBanquillo=['POR','DFC','MC','ED','DC'];
    const banquillo=posicionesBanquillo.map((pos,i)=>jugadorDe(nombres[11+i], i, pos));
    return {titulares, banquillo};
  }
  // Versión independiente de la revelación del sobre, para poder
  // abrirlo directamente desde el correo (sin pasar por la interfaz del
  // Director Deportivo). Misma animación de barajado y misma mecánica
  // de fichar, pero con un overlay propio — y con el destacado especial
  // para el FICHAJE ESTRELLA cuando aparece un jugador real de otro
  // equipo en vez de un canterano inventado.
  // Reparte una cara aleatoria por jugador de las 3 tarjetas del sobre,
  // sin repetir entre ellas — porteros usan siempre una imagen "portero",
  // el resto de posiciones usan una imagen "jugador".
  const SOBRE_CARAS_JUGADOR=['jugador1','jugador2','jugador3','jugador4','jugador5','jugador6'];
  const SOBRE_CARAS_PORTERO=['portero1','portero2','portero3','portero4'];
  function asignarCarasSobre(jugadores){
    const jBarajado=SOBRE_CARAS_JUGADOR.slice(); if(typeof shuffle==='function') shuffle(jBarajado);
    const pBarajado=SOBRE_CARAS_PORTERO.slice(); if(typeof shuffle==='function') shuffle(pBarajado);
    let jIdx=0, pIdx=0;
    return jugadores.map(j=>{
      if(j.position==='POR'){ const f=pBarajado[pIdx%pBarajado.length]; pIdx++; return 'assets/sobres/'+f+'.png'; }
      const f=jBarajado[jIdx%jBarajado.length]; jIdx++; return 'assets/sobres/'+f+'.png';
    });
  }
  function mostrarRevelacionSobreDesdeCorreo(jugadores, onCerrar){
    const overlay=document.createElement('div');
    overlay.id='lmSobreCorreoOverlay';
    overlay.innerHTML=`
      <div class="lm-sobre-apertura-wrap">
        <div class="lm-sobre-apertura-titulo">${t('lm.sobre_titulo')}</div>
        <div class="lm-sobre-apertura-stage">
          <img src="assets/sobres/sobre.png" class="lm-sobre-img-flotante" id="lmSobreImgArrastrable" draggable="false">
          <div class="lm-sobre-rasga-zona" id="lmSobreGrabZone">
            <span class="lm-sobre-rasga-barrido"></span>
          </div>
        </div>
        <div class="lm-sobre-apertura-hint" id="lmSobreHint">${t('lm.sobre_arrastra')}</div>
      </div>`;
    document.getElementById('ligaManagerScreen').appendChild(overlay);

    const img=overlay.querySelector('#lmSobreImgArrastrable');
    const zona=overlay.querySelector('#lmSobreGrabZone');
    const hint=overlay.querySelector('#lmSobreHint');
    const UMBRAL_APERTURA=180; // px que hay que arrastrar — casi todo el recorrido de la franja, para que no se abra al mínimo roce
    let arrastrando=false, startX=0, abierto=false, ultimaEstelaTs=0, ultimoSonidoTs=0;

    function posX(e){ return (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX; }
    function posY(e){ return (e.touches && e.touches[0]) ? e.touches[0].clientY : e.clientY; }
    // Estela amarilla que sigue al puntero mientras se arrastra — una
    // mota nueva cada pocos milisegundos, que se desvanece sola.
    function crearEstela(x, y){
      const punto=document.createElement('div');
      punto.className='lm-sobre-estela-punto';
      punto.style.left=x+'px';
      punto.style.top=y+'px';
      document.body.appendChild(punto);
      requestAnimationFrame(()=>{ punto.style.opacity='0'; punto.style.transform='translate(-50%,-50%) scale(2.2)'; });
      setTimeout(()=>punto.remove(), 450);
    }

    function onMove(e){
      if(!arrastrando || abierto) return;
      const deltaCrudo=posX(e)-startX; // negativo = hacia la izquierda, positivo = hacia la derecha
      const delta=Math.abs(deltaCrudo);
      const progreso=Math.min(1, delta/UMBRAL_APERTURA);
      img.style.transform=`translateX(${deltaCrudo*0.5}px) scale(${1+progreso*0.05})`;
      img.style.filter=`brightness(${1+progreso*0.35})`;
      zona.style.opacity=String(1-progreso*0.7);
      hint.style.opacity=String(1-progreso);
      const ahora=Date.now();
      if(ahora-ultimaEstelaTs>28){ ultimaEstelaTs=ahora; crearEstela(posX(e), posY(e)); }
      if(ahora-ultimoSonidoTs>90){ ultimoSonidoTs=ahora; if(typeof window.playSound==='function') window.playSound('envelope_drag', progreso); }
      if(delta>=UMBRAL_APERTURA) completarApertura(deltaCrudo>0?1:-1);
    }
    function onUp(){
      if(abierto) return;
      arrastrando=false;
      // No llegó al umbral: el sobre vuelve suavemente a su sitio.
      img.style.transition='transform .3s ease, filter .3s ease';
      img.style.transform='';
      img.style.filter='';
      zona.style.opacity='1';
      hint.style.opacity='1';
      setTimeout(()=>{ if(img) img.style.transition=''; }, 300);
    }
    function completarApertura(direccion){
      if(abierto) return;
      abierto=true;
      if(typeof window.playSound==='function') window.playSound('select');
      img.style.transition='transform .35s ease, opacity .35s ease';
      img.style.transform=`translateX(${direccion*220}px) scale(1.1)`;
      img.style.opacity='0';
      zona.style.transition='opacity .2s ease';
      zona.style.opacity='0';
      hint.style.transition='opacity .2s ease';
      hint.style.opacity='0';
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchend', onUp);
      setTimeout(()=>{ mostrarSpinDeSobre(overlay, jugadores, onCerrar); }, 320);
    }
    zona.addEventListener('mousedown', (e)=>{ e.preventDefault(); arrastrando=true; startX=posX(e); });
    zona.addEventListener('touchstart', (e)=>{ arrastrando=true; startX=posX(e); }, {passive:true});
    document.addEventListener('mousemove', onMove);
    document.addEventListener('touchmove', onMove, {passive:true});
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchend', onUp);
  }

  // Segunda mitad de la apertura del sobre: la tirada de cartas de
  // siempre, reutilizando el mismo overlay ya abierto.
  function mostrarSpinDeSobre(overlay, jugadores, onCerrar){
    const carasBarajado=[...SOBRE_CARAS_JUGADOR, ...SOBRE_CARAS_PORTERO];
    const posicionesBarajado=['POR','DFC','LI','LD','MC','EI','ED','DC'];
    overlay.innerHTML=`
      <div class="lm-dilemma-card lm-dilemma-card-dd lm-sobre-popup-ancho" style="max-width:860px">
        <div class="lm-dilemma-title"><i class="ph ph-bold ph-envelope-open"></i> ${t('lm.sobre_titulo')}</div>
        <div id="lmSobreReveloZoneCorreo" class="lm-sobre-cards">
          ${jugadores.map((j,i)=>`
          <div class="lm-sobre-card lm-sobre-card-barajando" id="lmSobreReelC${i}" style="animation-delay:${i*0.35}s">
            <div class="lm-sobre-cara"><img id="lmSobreCaraBarajo${i}" src="assets/sobres/${carasBarajado[Math.floor(Math.random()*carasBarajado.length)]}.png" alt=""><span class="lm-sobre-pos-badge" id="lmSobrePosBarajo${i}">?</span></div>
            <div class="lm-sobre-nombre" id="lmSobreNombreBarajo${i}">···</div>
            <div class="lm-sobre-overall" id="lmSobreOverallBarajo${i}">??</div>
            <div class="lm-sobre-stats-fila">
              <span><b>··</b>ATA</span><span><b>··</b>DEF</span><span><b>··</b>RIT</span><span><b>··</b>PAS</span><span><b>··</b>TEC</span>
            </div>
          </div>`).join('')}
        </div>
        <div id="lmSobreResultadoCorreo"></div>
      </div>`;
    let ticks=0;
    const totalTicks=11+Math.floor(Math.random()*4);
    const spin=setInterval(()=>{
      jugadores.forEach((j,i)=>{
        const nombreEl=document.getElementById('lmSobreNombreBarajo'+i);
        const caraEl=document.getElementById('lmSobreCaraBarajo'+i);
        const posEl=document.getElementById('lmSobrePosBarajo'+i);
        const overallEl=document.getElementById('lmSobreOverallBarajo'+i);
        if(nombreEl) nombreEl.textContent=nombreJugadorAleatorio();
        if(caraEl) caraEl.src='assets/sobres/'+carasBarajado[Math.floor(Math.random()*carasBarajado.length)]+'.png';
        if(posEl) posEl.textContent=posicionesBarajado[Math.floor(Math.random()*posicionesBarajado.length)];
        if(overallEl) overallEl.textContent=40+Math.floor(Math.random()*55);
      });
      if(typeof window.playSound==='function') window.playSound('spin');
      ticks++;
      if(ticks>=totalTicks){
        clearInterval(spin);
        // El fichaje estrella se anuncia con más fanfarria — sonido y
        // vibración visual propios, para que destaque de verdad frente
        // a un canterano cualquiera.
        const hayEstrella=jugadores.some(j=>j.esFichajeEstrella);
        if(typeof window.playSound==='function') window.playSound(hayEstrella?'victory':'reveal');
        const zonaReels=document.getElementById('lmSobreReveloZoneCorreo');
        if(zonaReels) zonaReels.innerHTML='';
        const zona=document.getElementById('lmSobreResultadoCorreo');
        const caras=asignarCarasSobre(jugadores);
        zona.innerHTML=`${hayEstrella?`<div class="lm-fichaje-estrella-banner"><i class="ph ph-bold ph-sparkle"></i> ${t('lm.hay_fichaje_estrella')} <i class="ph ph-bold ph-sparkle"></i></div>`:''}
          <div class="lm-sobre-cards" id="lmSobreCardsRow">${jugadores.map((j,i)=>`
          <div class="lm-sobre-card ${j.esFichajeEstrella?'lm-sobre-card-estrella':''}" data-jugador="${i}" style="animation-delay:${i*0.35}s">
            ${j.esFichajeEstrella?`<div class="lm-fichaje-estrella-tag"><i class="ph ph-bold ph-star"></i> ${t('lm.fichaje_estrella')}</div>`:''}
            ${(!j.esFichajeEstrella && j.esOportunidad)?`<div class="lm-trab-chollo-badge lm-sobre-oportunidad-badge"><i class="ph ph-bold ph-seal-percent"></i> ${t('lm.oportunidad')}</div>`:''}
            <div class="lm-sobre-cara"><img src="${caras[i]}" alt="${j.position}"><span class="lm-sobre-pos-badge">${j.position}</span></div>
            <div class="lm-sobre-nombre">${j.numero?('#'+j.numero+' '):''}${j.name}</div>
            ${j.esFichajeEstrella?`<div class="lm-sobre-procedencia">${t('lm.actualmente_en')} ${j.equipoOrigenName}</div>`:''}
            <div class="lm-sobre-overall">${j.overall} <span>${t('lm.puntuacion')}</span></div>
            ${(typeof lmSkillActiva==='function' && lmSkillActiva('lm_ojo_clinico')) ? `<div class="lm-sobre-potencial"><i class="ph ph-bold ph-binoculars"></i> ${t('lm.potencial_techo')}: <b>${j.potencial||j.overall}</b></div>` : ''}
            <div class="lm-sobre-stats-fila">
              <span><b>${j.attack}</b>${t('lm.stat_ata')}</span><span><b>${j.defense}</b>${t('lm.stat_def')}</span><span><b>${j.pace}</b>${t('lm.stat_rit')}</span><span><b>${j.passing}</b>${t('lm.stat_pas')}</span><span><b>${j.technique}</b>${t('lm.stat_tec')}</span>
            </div>
            <div class="lm-sobre-salario">${formatoDinero(j.salario)}/mes</div>
            <button class="mode-card-btn mode-card-btn-gold lm-sobre-fichar" data-fichar="${i}">${t('lm.fichar_btn')}</button>
          </div>`).join('')}</div>
          <div class="lm-popup-actions" style="margin-top:12px"><button id="lmSobreCerrarCorreo" class="mode-card-btn lm-btn-rojo">${t('lm.cerrar_sobre')}</button></div>`;
        const filaCards=zona.querySelector('#lmSobreCardsRow');
        filaCards.querySelectorAll('.lm-sobre-card').forEach(carta=>{
          carta.addEventListener('click', (e)=>{
            if(e.target.closest('[data-fichar]')) return; // el botón FICHAR tiene su propio manejador
            if(typeof window.playSound==='function') window.playSound('select');
            const yaEnfocada=carta.classList.contains('lm-sobre-card-focused');
            filaCards.querySelectorAll('.lm-sobre-card').forEach(c=>c.classList.remove('lm-sobre-card-focused'));
            filaCards.classList.toggle('lm-sobre-cards-con-foco', !yaEnfocada);
            if(!yaEnfocada) carta.classList.add('lm-sobre-card-focused');
          });
        });
        let fichadoNombre=null;
        const botonesFichar=zona.querySelectorAll('[data-fichar]');
        botonesFichar.forEach(btn=>{
          btn.addEventListener('click', ()=>{
            const i=parseInt(btn.getAttribute('data-fichar'),10);
            if(typeof window.playSound==='function') window.playSound('select');
            ficharJugadorSobre(jugadores[i]);
            fichadoNombre=jugadores[i].name;
            btn.textContent='FICHADO ✔';
            btn.closest('.lm-sobre-card').classList.add('lm-sobre-card-fichado');
            // Solo se puede fichar UNO de los 3 — los otros dos quedan
            // bloqueados en cuanto se confirma uno.
            botonesFichar.forEach(otro=>{
              otro.disabled=true;
              if(otro!==btn) otro.textContent='NO ELEGIDO';
            });
          });
        });
        document.getElementById('lmSobreCerrarCorreo').addEventListener('click', ()=>{
          if(typeof window.playSound==='function') window.playSound('select');
          overlay.remove();
          onCerrar(fichadoNombre);
        });
      }
    },85);
  }

  // Clasificación como ventana emergente — se abre desde el botón del
  // header que antes era "RANKING" (ahora "CLASIFICACIÓN" mientras estás
  // en Liga Manager). Ya no vive fija dentro de ninguna columna.
  function abrirClasificacionLM(){
    if(!state || !state.setupComplete) return;
    const overlay=document.createElement('div');
    overlay.id='lmClasifOverlay';
    const clasif=calcularClasificacion();
    overlay.innerHTML=`
      <div class="lm-dilemma-card lm-clasif-popup-card" style="max-width:600px">
        ${xCerrarHTML()}
        <div class="lm-dilemma-title"><i class="ph ph-bold ph-ranking"></i> ${t('lm.clasificacion')}</div>
        <div class="lm-clasif-scroll-area">
          <div class="lm-table-wrap">
            <table class="lm-table lm-table-grande">
              <thead><tr><th></th><th>#</th><th>${t('lm.tabla_equipo')}</th><th>${t('lm.tabla_pj')}</th><th>${t('lm.tabla_g')}</th><th>${t('lm.tabla_e')}</th><th>${t('lm.tabla_p')}</th><th>${t('lm.tabla_pts')}</th></tr></thead>
              <tbody>
                ${clasif.map((t2,i)=>`<tr class="${t2.id==='lm_0'?'lm-myteam':''} lm-zona-${zonaClasificacion(i+1)}">
                  <td>${t2.id==='lm_0'?crestHTML(state.escudo,20):rivalCrestHTML(20, t2.crestImg)}</td>
                  <td>${i+1}</td><td>${t2.name}</td><td>${t2.pj}</td><td>${t2.pg}</td><td>${t2.pe}</td><td>${t2.pp}</td><td><strong>${t2.pts}</strong></td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
        <div class="lm-legend">
          <span><i class="lm-legend-dot lm-zona-champions"></i>${t('lm.zona_champions')}</span>
          <span><i class="lm-legend-dot lm-zona-europa"></i>${t('lm.zona_europa')}</span>
          <span><i class="lm-legend-dot lm-zona-conference"></i>${t('lm.zona_conference')}</span>
          <span><i class="lm-legend-dot lm-zona-descenso"></i>${t('lm.zona_descenso')}</span>
        </div>
        <div class="lm-popup-actions"><button id="lmClasifCerrarBtn" class="mode-card-btn mode-card-btn-gold">${t('lm.cerrar')}</button></div>
      </div>`;
    document.getElementById('ligaManagerScreen').appendChild(overlay);
    habilitarCierreOverlay(overlay, ()=>overlay.remove());
    overlay.querySelector('[data-cerrar-x]').addEventListener('click', ()=>overlay.remove());
    overlay.querySelector('#lmClasifCerrarBtn').addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      overlay.remove();
    });
  }
  window.abrirClasificacionLM = abrirClasificacionLM;
  // El botón del header decide qué abrir según el modo actual — el
  // ranking online de Copa Leyendas, o la clasificación de Liga Manager.
  window.handleRankingOrClasificacionClick = function(){
    if(document.body.classList.contains('liga-manager-screen')){
      if(typeof window.playSound==='function') window.playSound('select');
      window.abrirClasificacionLM();
    } else if(typeof window.showRankingModal==='function'){
      window.showRankingModal();
    }
  };

  /* ---------- 7b. Resumen de fin de temporada ---------- */
  // Recorre las 38 jornadas ya jugadas buscando el partido de mayor
  // margen de victoria y el de mayor margen de derrota de MI equipo —
  // usado en el resumen final de temporada. Se recalcula sobre
  // state.resultados (nunca se guarda aparte), igual que la propia
  // clasificación.
  function calcularResultadosDestacadosTemporada(){
    let mejorVictoria=null, peorDerrota=null;
    for(let j=0;j<38;j++){
      const jornada=state.calendario[j];
      if(!jornada) continue;
      jornada.forEach(partido=>{
        if(partido.home.id!=='lm_0' && partido.away.id!=='lm_0') return;
        const key=j+'-'+partido.home.id+'-'+partido.away.id;
        const res=state.resultados[key];
        if(!res) return;
        const miEsLocal=partido.home.id==='lm_0';
        const misGoles = miEsLocal?res.golesA:res.golesB;
        const susGoles = miEsLocal?res.golesB:res.golesA;
        const rivalNombre = miEsLocal?partido.away.name:partido.home.name;
        const diff=misGoles-susGoles;
        if(diff>0 && (!mejorVictoria || diff>mejorVictoria.diff)) mejorVictoria={misGoles, susGoles, rivalNombre, diff, jornada:j+1};
        else if(diff<0 && (!peorDerrota || diff<peorDerrota.diff)) peorDerrota={misGoles, susGoles, rivalNombre, diff, jornada:j+1};
      });
    }
    return {mejorVictoria, peorDerrota};
  }
  // Popup de fin de temporada — mismo patrón visual que el resto de la
  // interfaz (.lm-dilemma-card / .lm-clasif-popup-card, con su zona de
  // scroll interna para que quepa en cualquier pantalla), a modo de
  // resumen esquemático de toda la temporada: clasificación, resultados
  // destacados, máximo goleador, balance financiero y proyectos
  // conseguidos por el cuerpo técnico.
  // Recoge los 20 equipos (el mío + los 19 rivales) ya presentes en el
  // calendario de la temporada que acaba de terminar — así una nueva
  // temporada con progreso mantiene la misma liga, sin volver a
  // sortear rivales ni arriesgarse a duplicar o perder ninguno.
  function extraerEquiposCalendarioActual(){
    const mapa=new Map();
    (state.calendario||[]).forEach(jornada=>{
      (jornada||[]).forEach(partido=>{
        mapa.set(partido.home.id, partido.home);
        mapa.set(partido.away.id, partido.away);
      });
    });
    return [...mapa.values()];
  }
  // Nueva temporada MANTENIENDO todo el progreso (plantilla, mejoras,
  // capital, logros, escudo...) — solo se reinician los elementos
  // propios de una temporada concreta: el calendario (nuevos
  // emparejamientos), el marcador de jornada, los resultados
  // acumulados, la fecha de inicio (la siguiente temporada real) y el
  // contador de goles de la temporada de cada jugador (para que el
  // resumen del año que viene empiece de cero, no arrastre los goles
  // del año anterior).
  function iniciarNuevaTemporadaConProgreso(){
    const teams=extraerEquiposCalendarioActual();
    state.jornadaActual=1;
    state.calendario=generarCalendario(teams);
    state.resultados={};
    state.fechaInicioLiga=fechaISO(inicioTemporadaRealista());
    state.semanaResueltaParaJornada=undefined;
    calendarioMesVisto=null;
    calendarioJornadaSincronizada=null;
    (state.plantilla||[]).forEach(p=>{ p.golesTemporada=0; });
    state.giroTacticoUsosRestantes=getMaxGiroTacticoLM();
    state.giroTacticoMitad=1;
    state.estuvoEnDescensoEstaTemporada=false;
    guardarEstado();
    render();
  }
  // Premio económico de fin de temporada: depende de dónde se termine
  // en la clasificación Y de la complejidad de lo conseguido durante
  // la partida (los logros más difíciles pesan más que los básicos,
  // reutilizando directamente los "pts" ya asignados a cada tier).
  // Solo se paga si se puede continuar (nunca en caso de descenso o
  // números rojos — el club no sobrevive, no hay nada que premiar).
  // Texto para compartir el resumen de fin de temporada — mismo
  // patrón que buildTeamShareText()/shareMyTeam() de Copa Leyendas
  // (game.js): navigator.share si está disponible, si no portapapeles,
  // y si tampoco un alert como último recurso. Aquí vive en un
  // archivo propio de Liga Manager para no tocar game.js.
  // Texto para compartir el resumen de fin de temporada -- mismo
  // patron que buildTeamShareText()/shareMyTeam() de Copa Leyendas
  // (game.js): navigator.share si esta disponible, si no portapapeles,
  // y si tampoco un alert como ultimo recurso. Aqui vive en un
  // archivo propio de Liga Manager para no tocar game.js.
  //
  // Reescrito para ser un informe completo y profesional en vez de
  // 4 lineas sueltas con emojis -- estructurado por secciones, con
  // encabezados en mayusculas y separadores, pensado para poder
  // pegarse tal cual en un chat o una red social y leerse con
  // seriedad, no como una notificacion rapida.
  // Texto para compartir el resumen de fin de temporada -- mismo
  // patron que buildTeamShareText()/shareMyTeam() de Copa Leyendas
  // (game.js): navigator.share si esta disponible, si no portapapeles,
  // y si tampoco un alert como ultimo recurso. Aqui vive en un
  // archivo propio de Liga Manager para no tocar game.js.
  //
  // Informe completo por secciones, con algun emoji puntual de
  // cabecera (no en cada linea) para que se lea bien en redes/chat
  // sin perder seriedad ni completitud.
  function buildLMResumenShareText(datos){
    const {miPos, misDatos, claveValoracion, mejorVictoria, peorDerrota, maxGoleador, premioTemporada, estrellasTotal, estrellasMax, dptos, ingresosTotales, gastosTotales, balanceNeto, capitalFinal, claveVeredicto, finDeLaPartida}=datos;
    const sep='---------------------------';
    const lines=[
      `\ud83c\udfc6 GOAL2GOAT . LIGA MANAGER`,
      `Informe de fin de temporada -- ${state.nombreEquipo.toUpperCase()}`,
      sep,
      `${t(claveValoracion)}`,
      '',
      '\ud83d\udcca CLASIFICACION',
      `Posicion final: ${miPos}o`,
      `Puntos: ${misDatos?misDatos.pts:0}`,
      `Balance: ${misDatos?misDatos.pg:0}G ${misDatos?misDatos.pe:0}E ${misDatos?misDatos.pp:0}P`,
      `Goles: ${misDatos?misDatos.gf:0} a favor, ${misDatos?misDatos.gc:0} en contra (diferencia ${misDatos?((misDatos.gf-misDatos.gc>0?'+':'')+(misDatos.gf-misDatos.gc)):0})`,
      sep,
      '\u26bd RESULTADOS DESTACADOS',
      mejorVictoria ? `Mayor victoria: ${state.nombreEquipo} ${mejorVictoria.misGoles}-${mejorVictoria.susGoles} ${mejorVictoria.rivalNombre} (jornada ${mejorVictoria.jornada})` : 'Mayor victoria: sin victorias registradas',
      peorDerrota ? `Peor derrota: ${state.nombreEquipo} ${peorDerrota.misGoles}-${peorDerrota.susGoles} ${peorDerrota.rivalNombre} (jornada ${peorDerrota.jornada})` : 'Peor derrota: sin derrotas registradas',
      `Maximo goleador: ${(maxGoleador && maxGoleador.golesTemporada>0) ? `${maxGoleador.name} (${maxGoleador.golesTemporada} goles)` : 'sin goles registrados'}`,
      sep,
      '\ud83d\udcb0 BALANCE FINANCIERO',
      premioTemporada ? `Premio de temporada: +${formatoDinero(premioTemporada.total)}` : null,
      `Ingresos totales: +${formatoDinero(ingresosTotales)}`,
      `Gastos totales: -${formatoDinero(gastosTotales)}`,
      `Balance neto: ${balanceNeto>=0?'+':''}${formatoDinero(balanceNeto)}`,
      `Capital final: ${formatoDinero(capitalFinal)}`,
      sep,
      '\ud83c\udfdf\ufe0f CUERPO TECNICO',
      `Mejoras conseguidas: ${estrellasTotal}/${estrellasMax}`,
      ...dptos.map(d=>`${d.nombre}: ${d.n}/${d.nMax}`),
      sep,
      finDeLaPartida ? `${t(claveVeredicto)}` : `\u2705 ${t('lm.resumen_temporada_puede_continuar')}`,
      '',
      '\u26bd goal2goat.com',
    ].filter(l=>l!==null);
    return lines.join('\n');
  }
  async function shareLMResumenTemporada(datos){
    const text=buildLMResumenShareText(datos);
    if(navigator.share){
      try{ await navigator.share({text}); }catch(e){ /* cancelado por el usuario, nada que hacer */ }
    }else{
      try{
        await navigator.clipboard.writeText(text);
        if(typeof showToast==='function') showToast('\ud83d\udccb Copiado al portapapeles', 'toast-pos');
      }catch(e){
        alert(text);
      }
    }
  }
  // Informe imprimible / "Guardar como PDF" -- documento HTML
  // independiente con diseno moderno de informe deportivo de datos
  // (estilo "matchday report" de analitica de futbol del siglo XXI):
  // tipografia de palo, cabecera con marca de color, tarjetas de
  // estadisticas en cuadricula, tablas con cabecera oscura y filas
  // alternas, franjas de color para cada bloque. Abre el dialogo de
  // impresion del propio navegador (con "Guardar como PDF" ya
  // disponible ahi en Chrome, Edge, Safari, etc. sin libreria externa).
  function buildLMResumenPrintHTML(datos){
    const {miPos, misDatos, claveValoracion, mejorVictoria, peorDerrota, maxGoleador, premioTemporada, estrellasTotal, estrellasMax, dptos, ingresosTotales, gastosTotales, balanceNeto, capitalFinal, claveVeredicto, finDeLaPartida}=datos;
    const fecha=new Date().toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'});
    const dg = misDatos ? (misDatos.gf-misDatos.gc) : 0;
    const statCard=(numero,label)=>`<div class="stat-card"><div class="stat-num">${numero}</div><div class="stat-label">${label}</div></div>`;
    const filaTabla=(label,valor,clase)=>`<tr><td>${label}</td><td class="val ${clase||''}">${valor}</td></tr>`;
    const dptosFilas = dptos.map(d=>{
      const pct = Math.round((d.n/Math.max(1,d.nMax))*100);
      return `<tr><td>${d.nombre}</td><td class="val">${d.n}/${d.nMax}</td><td class="barcell"><div class="barbg"><div class="barfill" style="width:${pct}%"></div></div></td></tr>`;
    }).join('');
    return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<title>Informe de temporada -- ${state.nombreEquipo}</title>
<style>
  @page{ margin:12mm 14mm; }
  *{ box-sizing:border-box; }
  body{
    font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif; color:#1c1f24;
    max-width:780px; margin:0 auto; padding:0; font-size:12.5px; line-height:1.4;
  }
  .band{ background:#12151a; color:#fff; padding:18px 32px; border-radius:0 0 14px 14px; margin-bottom:0; text-align:center; }
  .band .eyebrow{ font-size:10px; letter-spacing:3px; color:#d9b23c; text-transform:uppercase; font-weight:700; margin-bottom:5px; }
  .band h1{ font-size:24px; margin:0 0 3px; font-weight:800; letter-spacing:-.5px; }
  .band .sub{ font-size:11px; color:#a7adb6; }
  .valoracion-strip{
    background:#d9b23c; color:#12151a; text-align:center; padding:8px 12px;
    font-weight:800; font-size:12px; letter-spacing:.5px; text-transform:uppercase;
  }
  .content{ padding:16px 30px 4px; }
  .stats-grid{ display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin-bottom:4px; }
  .stat-card{ background:#f4f5f7; border-radius:10px; padding:10px 8px; text-align:center; }
  .stat-num{ font-size:19px; font-weight:800; color:#12151a; }
  .stat-label{ font-size:8.5px; letter-spacing:.5px; text-transform:uppercase; color:#777; margin-top:2px; }
  h2{
    font-size:11.5px; letter-spacing:1.5px; text-transform:uppercase; font-weight:800;
    color:#12151a; margin:16px 0 8px; padding-left:10px; border-left:4px solid #d9b23c;
  }
  table{ width:100%; border-collapse:collapse; font-size:12px; margin-bottom:2px; }
  thead td{ display:none; }
  tbody tr:nth-child(odd){ background:#f7f7f8; }
  td{ padding:6px 10px; }
  td.val{ text-align:right; font-weight:700; }
  td.positivo{ color:#1a7a3c; }
  td.negativo{ color:#c0392b; }
  .barcell{ width:110px; }
  .barbg{ background:#e6e6e6; border-radius:4px; height:7px; overflow:hidden; }
  .barfill{ background:#d9b23c; height:100%; }
  .destacados{ display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:4px; }
  .destacado-card{ background:#f4f5f7; border-radius:10px; padding:10px 14px; }
  .destacado-card .tag{ font-size:8.5px; letter-spacing:1px; text-transform:uppercase; color:#999; font-weight:700; display:block; margin-bottom:3px; }
  .destacado-card .cont{ font-size:12px; font-weight:600; }
  .destacado-card.full{ grid-column:1/3; }
  .footer{ margin-top:14px; padding:10px 30px; text-align:center; font-size:9.5px; color:#999; border-top:1px solid #eee; }
  @media print{ .band{ border-radius:0; } }
</style></head><body>
  <div class="band">
    <div class="eyebrow">Goal2Goat &middot; Liga Manager</div>
    <h1>${state.nombreEquipo.toUpperCase()}</h1>
    <div class="sub">Informe oficial de fin de temporada &middot; ${fecha}</div>
  </div>
  <div class="valoracion-strip">${t(claveValoracion)}</div>

  <div class="content">
    <h2>Clasificacion final</h2>
    <div class="stats-grid">
      ${statCard(miPos+'&ordm;','Posicion')}
      ${statCard(misDatos?misDatos.pts:0,'Puntos')}
      ${statCard(`${misDatos?misDatos.pg:0}-${misDatos?misDatos.pe:0}-${misDatos?misDatos.pp:0}`,'G-E-P')}
      ${statCard((dg>0?'+':'')+dg,'Dif. de goles')}
    </div>

    <h2>Resultados destacados</h2>
    <div class="destacados">
      <div class="destacado-card"><span class="tag">Mayor victoria</span><div class="cont">${mejorVictoria ? `${state.nombreEquipo} ${mejorVictoria.misGoles}-${mejorVictoria.susGoles} ${mejorVictoria.rivalNombre}<br><small style="color:#999">Jornada ${mejorVictoria.jornada}</small>` : 'Sin victorias registradas'}</div></div>
      <div class="destacado-card"><span class="tag">Peor derrota</span><div class="cont">${peorDerrota ? `${state.nombreEquipo} ${peorDerrota.misGoles}-${peorDerrota.susGoles} ${peorDerrota.rivalNombre}<br><small style="color:#999">Jornada ${peorDerrota.jornada}</small>` : 'Sin derrotas registradas'}</div></div>
      <div class="destacado-card full"><span class="tag">Maximo goleador</span><div class="cont">${(maxGoleador && maxGoleador.golesTemporada>0) ? `${maxGoleador.name} &mdash; ${maxGoleador.golesTemporada} goles` : 'Sin goles registrados esta temporada'}</div></div>
    </div>

    <h2>Balance financiero</h2>
    <table><tbody>
      ${premioTemporada ? filaTabla('Premio de temporada', '+'+formatoDinero(premioTemporada.total), 'positivo') : ''}
      ${filaTabla('Ingresos totales', '+'+formatoDinero(ingresosTotales), 'positivo')}
      ${filaTabla('Gastos totales', '-'+formatoDinero(gastosTotales), 'negativo')}
      ${filaTabla('Balance neto', (balanceNeto>=0?'+':'')+formatoDinero(balanceNeto), balanceNeto>=0?'positivo':'negativo')}
      ${filaTabla('Capital final', formatoDinero(capitalFinal))}
    </tbody></table>

    <h2>Cuerpo tecnico &mdash; ${estrellasTotal}/${estrellasMax} mejoras conseguidas</h2>
    <table><tbody>
      ${dptosFilas}
    </tbody></table>
  </div>

  <div class="footer">Generado automaticamente por Goal2Goat &middot; goal2goat.com</div>
</body></html>`;
  }
  function imprimirLMResumenTemporada(datos){
    const ventana=window.open('', '_blank');
    if(!ventana){ alert(t('lm.popup_bloqueado_pdf')); return; }
    ventana.document.write(buildLMResumenPrintHTML(datos));
    ventana.document.close();
    ventana.focus();
    setTimeout(()=>{ ventana.print(); }, 350);
  }
    function calcularPremioFinTemporada(miPos){
    const basePorPosicion = miPos===1?150000 : miPos<=4?90000 : miPos===5?65000 : miPos===6?50000 : miPos<=10?30000 : 15000;
    // Complejidad de lo logrado: suma de los "pts" (1 básico, 2
    // intermedio, 3 difícil, 5 mítico) de todos los logros de Liga
    // Manager ya desbloqueados. window._lmAchievementsCache solo
    // refleja con certeza lo desbloqueado EN ESTA SESIÓN si nunca se
    // ha abierto la pestaña de logros del perfil — una aproximación
    // razonable, no una cuenta perfecta desde Firestore.
    const cache=window._lmAchievementsCache;
    const puntosLogros = cache ? LM_ACHIEVEMENT_DEFS.reduce((s,d)=> s+(cache.has(d.id)?d.pts:0), 0) : 0;
    const bonusComplejidad = puntosLogros*800;
    return {basePorPosicion, bonusComplejidad, total: basePorPosicion+bonusComplejidad};
  }
  function mostrarResumenTemporada(){
    const overlay=document.createElement('div');
    overlay.id='lmResumenTemporadaOverlay';
    const clasif=calcularClasificacion();
    const miPos=clasif.findIndex(t2=>t2.id==='lm_0')+1;
    const misDatos=clasif.find(t2=>t2.id==='lm_0');
    const zona=zonaClasificacion(miPos);
    let claveValoracion='lm.resumen_temporada_valoracion_media';
    if(miPos===1) claveValoracion='lm.resumen_temporada_valoracion_campeon';
    else if(zona==='champions') claveValoracion='lm.resumen_temporada_valoracion_champions';
    else if(zona==='europa') claveValoracion='lm.resumen_temporada_valoracion_europa';
    else if(zona==='conference') claveValoracion='lm.resumen_temporada_valoracion_conference';
    else if(zona==='descenso') claveValoracion='lm.resumen_temporada_valoracion_descenso';
    // Veredicto de la temporada, calculado aquí (antes que las cifras
    // financieras de más abajo) porque el premio, si toca, debe
    // reflejarse en el capital final e ingresos totales que se
    // muestran a continuación. El mismo cálculo (con el capital DE
    // ANTES del premio) es el que decide si la partida continúa o
    // termina — nunca se vuelve a comprobar después de pagar el
    // premio, para que un premio grande no pueda "salvar" a última
    // hora una temporada que ya se había perdido.
    const enDescenso = zona==='descenso';
    const enNumerosRojos = (state.capital||0)<0;
    const finDeLaPartida = enDescenso || enNumerosRojos;
    let premioTemporada=null;
    if(!finDeLaPartida){
      premioTemporada=calcularPremioFinTemporada(miPos);
      state.capital=(state.capital||0)+premioTemporada.total;
      registrarMovimientoFinanciero('Premio de fin de temporada', premioTemporada.total, state.jornadaActual);
      guardarEstado();
    }
    const {mejorVictoria, peorDerrota}=calcularResultadosDestacadosTemporada();
    const golesFilaHTML = (r, claveVacio)=> !r ? `<div class="lm-resumen-temp-fila-vacia">${t(claveVacio)}</div>`
      : `<div class="lm-resumen-temp-fila"><span>${state.nombreEquipo} ${r.misGoles} - ${r.susGoles} ${r.rivalNombre}</span><span class="lm-resumen-temp-jornada">${t('lm.jornada')} ${r.jornada}</span></div>`;
    const maxGoleador = (state.plantilla||[]).reduce((max,p)=>(p.golesTemporada||0)>(max?max.golesTemporada||0:0) ? p : max, null);
    const goleadorHTML = (maxGoleador && maxGoleador.golesTemporada>0)
      ? `<div class="lm-resumen-temp-fila"><span><strong>${maxGoleador.name}</strong></span><span class="lm-resumen-temp-jornada">${tp('lm.resumen_temporada_goleador_goles',{n:maxGoleador.golesTemporada})}</span></div>`
      : `<div class="lm-resumen-temp-fila-vacia">${t('lm.resumen_temporada_sin_goleador')}</div>`;
    const historialFin=(state.finanzasHistorial||[]);
    const ingresosTotales=historialFin.filter(h=>h.monto>=0).reduce((s,h)=>s+h.monto,0);
    const gastosTotales=historialFin.filter(h=>h.monto<0).reduce((s,h)=>s+Math.abs(h.monto),0);
    const balanceNeto=ingresosTotales-gastosTotales;
    const {total:estrellasTotal, max:estrellasMax}=calcularEstrellasClub();
    const dptos=[
      ['lm.resumen_temporada_dpto_medico', state.medicoNiveles],
      ['lm.resumen_temporada_dpto_mantenimiento', state.mantenimientoNiveles],
      ['lm.resumen_temporada_dpto_dg', state.directorGeneralNiveles],
      ['lm.resumen_temporada_dpto_dd', state.directorDeportivoNiveles],
      ['lm.resumen_temporada_dpto_pf', state.preparadorFisicoNiveles],
    ];
    // Versión con los datos ya resueltos (nombre traducido, nivel
    // conseguido, nivel máximo posible) — reutilizada tanto para
    // compartir como para el informe imprimible, en vez de repetir
    // este cálculo en cada sitio.
    const dptosResueltos = dptos.map(([clave, niveles])=>({
      nombre: t(clave),
      n: nivelTotalDe(niveles),
      nMax: Object.keys(niveles||{}).length*NIVEL_MAXIMO_EQUIPO,
    }));
    const dptosHTML = dptos.map(([clave, niveles])=>{
      const n=nivelTotalDe(niveles);
      const nMax=Object.keys(niveles||{}).length*NIVEL_MAXIMO_EQUIPO;
      return `<div class="lm-resumen-temp-fila"><span>${t(clave)}</span><span class="lm-resumen-temp-jornada">${estrellasNivel(Math.round((n/Math.max(1,nMax))*NIVEL_MAXIMO_EQUIPO))}</span></div>`;
    }).join('');
    let claveVeredicto=null;
    if(enDescenso && enNumerosRojos) claveVeredicto='lm.resumen_temporada_fin_ambos';
    else if(enDescenso) claveVeredicto='lm.resumen_temporada_fin_descenso';
    else if(enNumerosRojos) claveVeredicto='lm.resumen_temporada_fin_numeros_rojos';
    const veredictoHTML = finDeLaPartida
      ? `<div class="lm-resumen-temp-veredicto lm-resumen-temp-veredicto-negativo"><i class="ph ph-bold ph-skull"></i>${t(claveVeredicto)}</div>`
      : `<div class="lm-resumen-temp-veredicto lm-resumen-temp-veredicto-positivo"><i class="ph ph-bold ph-check-circle"></i>${t('lm.resumen_temporada_puede_continuar')}</div>`;
    overlay.innerHTML=`
      <div class="lm-dilemma-card lm-clasif-popup-card lm-resumen-temp-card" style="max-width:520px;position:relative">
        <button id="lmResumenTemporadaImprimirBtn" title="${t('lm.imprimir_resumen')}" style="display:flex;position:absolute;top:14px;right:56px;z-index:6;width:34px;height:34px;border-radius:50%;background:rgba(0,0,0,.45);border:1px solid rgba(255,255,255,.5);color:#fff;align-items:center;justify-content:center;cursor:pointer;padding:0">
          <i class="ph ph-bold ph-printer" style="font-size:17px"></i>
        </button>
        <button id="lmResumenTemporadaCompartirBtn" title="${t('lm.compartir_resumen')}" style="display:flex;position:absolute;top:14px;right:14px;z-index:6;width:34px;height:34px;border-radius:50%;background:rgba(0,0,0,.45);border:1px solid rgba(255,255,255,.5);color:#fff;align-items:center;justify-content:center;cursor:pointer;padding:0">
          <i class="ph ph-bold ph-share-network" style="font-size:17px"></i>
        </button>
        <div class="lm-dilemma-title" style="justify-content:center;text-align:center"><i class="ph ph-bold ph-trophy"></i>${t('lm.resumen_temporada_titulo')}</div>
        <div class="lm-clasif-scroll-area">
          <div class="lm-resumen-temp-header">
            ${crestHTML(state.escudo, 56)}
            <div>
              <div class="lm-resumen-temp-club">${state.nombreEquipo.toUpperCase()}</div>
              <div class="lm-resumen-temp-valoracion lm-zona-${zona}">${t(claveValoracion)}</div>
            </div>
          </div>
          <div class="lm-resumen-temp-stats-grid">
            <div class="lm-resumen-temp-stat"><span class="lm-resumen-temp-stat-num">${miPos}º</span><span class="lm-resumen-temp-stat-label">${t('lm.resumen_temporada_posicion')}</span></div>
            <div class="lm-resumen-temp-stat"><span class="lm-resumen-temp-stat-num">${misDatos?misDatos.pts:0}</span><span class="lm-resumen-temp-stat-label">${t('lm.tabla_pts')}</span></div>
            <div class="lm-resumen-temp-stat"><span class="lm-resumen-temp-stat-num">${misDatos?misDatos.pg:0}-${misDatos?misDatos.pe:0}-${misDatos?misDatos.pp:0}</span><span class="lm-resumen-temp-stat-label">${t('lm.tabla_g')}-${t('lm.tabla_e')}-${t('lm.tabla_p')}</span></div>
            <div class="lm-resumen-temp-stat"><span class="lm-resumen-temp-stat-num">${misDatos?(misDatos.gf-misDatos.gc>0?'+':'')+(misDatos.gf-misDatos.gc):0}</span><span class="lm-resumen-temp-stat-label">${t('lm.resumen_temporada_dg')}</span></div>
          </div>
          <div class="lm-resumen-temp-subtitulo">${t('lm.resumen_temporada_resultados_titulo')}</div>
          ${golesFilaHTML(mejorVictoria,'lm.resumen_temporada_sin_victorias')}
          ${golesFilaHTML(peorDerrota,'lm.resumen_temporada_sin_derrotas')}
          <div class="lm-resumen-temp-subtitulo">${t('lm.resumen_temporada_goleador_titulo')}</div>
          ${goleadorHTML}
          <div class="lm-resumen-temp-subtitulo">${t('lm.resumen_temporada_financiero_titulo')}</div>
          ${premioTemporada ? `<div class="lm-resumen-temp-fila"><span><i class="ph ph-bold ph-medal"></i> ${t('lm.resumen_temporada_premio')}</span><span class="lm-resumen-temp-jornada lm-resumen-temp-positivo">+${formatoDinero(premioTemporada.total)}</span></div>` : ''}
          <div class="lm-resumen-temp-fila"><span>${t('lm.resumen_temporada_capital_final')}</span><span class="lm-resumen-temp-jornada">${formatoDinero(state.capital)}</span></div>
          <div class="lm-resumen-temp-fila"><span>${t('lm.resumen_temporada_ingresos')}</span><span class="lm-resumen-temp-jornada lm-resumen-temp-positivo">+${formatoDinero(ingresosTotales)}</span></div>
          <div class="lm-resumen-temp-fila"><span>${t('lm.resumen_temporada_gastos')}</span><span class="lm-resumen-temp-jornada lm-resumen-temp-negativo">-${formatoDinero(gastosTotales)}</span></div>
          <div class="lm-resumen-temp-fila"><span>${t('lm.resumen_temporada_balance_neto')}</span><span class="lm-resumen-temp-jornada ${balanceNeto>=0?'lm-resumen-temp-positivo':'lm-resumen-temp-negativo'}">${balanceNeto>=0?'+':''}${formatoDinero(balanceNeto)}</span></div>
          <div class="lm-resumen-temp-subtitulo">${t('lm.resumen_temporada_cuerpo_tecnico_titulo')}</div>
          <div class="lm-resumen-temp-fila"><span>${t('lm.resumen_temporada_estrellas_totales')}</span><span class="lm-resumen-temp-jornada">${estrellasTotal}/${estrellasMax}</span></div>
          ${dptosHTML}
          ${veredictoHTML}
        </div>
        <div class="lm-popup-actions"><button id="lmResumenTemporadaCerrarBtn" class="mode-card-btn mode-card-btn-gold">${finDeLaPartida?t('lm.finalizar'):t('lm.continuar')}</button></div>
      </div>`;
    document.getElementById('ligaManagerScreen').appendChild(overlay);
    // Datos completos, compartidos entre el botón de compartir y el
    // de imprimir/PDF — así ambos muestran exactamente la misma
    // información, solo en formato distinto.
    const datosInforme = {miPos, misDatos, zona, claveValoracion, mejorVictoria, peorDerrota, maxGoleador, premioTemporada, estrellasTotal, estrellasMax, dptos:dptosResueltos, ingresosTotales, gastosTotales, balanceNeto, capitalFinal: state.capital, claveVeredicto, finDeLaPartida};
    const compartirBtn=overlay.querySelector('#lmResumenTemporadaCompartirBtn');
    if(compartirBtn) compartirBtn.addEventListener('click', (e)=>{
      e.stopPropagation();
      if(typeof window.playSound==='function') window.playSound('select');
      shareLMResumenTemporada(datosInforme);
    });
    const imprimirBtn=overlay.querySelector('#lmResumenTemporadaImprimirBtn');
    if(imprimirBtn) imprimirBtn.addEventListener('click', (e)=>{
      e.stopPropagation();
      if(typeof window.playSound==='function') window.playSound('select');
      imprimirLMResumenTemporada(datosInforme);
    });
    // A propósito SIN habilitarCierreOverlay: este popup decide si la
    // partida termina o continúa a una nueva temporada — un clic fuera
    // accidental no puede saltarse esa decisión sin pasar por el botón
    // explícito, a diferencia del resto de popups informativos del
    // juego, que sí se pueden cerrar tocando fuera.
    overlay.querySelector('#lmResumenTemporadaCerrarBtn').addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      overlay.remove();
      if(finDeLaPartida){
        // Fin de la partida: se borra el progreso y se vuelve al menú
        // de selección de modo — mismo camino de salida que ya usa
        // "abandonar liga", reutilizado aquí porque el efecto es
        // idéntico (la partida ya no puede continuar).
        borrarEstado();
        state=nuevoEstadoSinEmpezar();
        setupStep=1;
        setupData={liga:'es', moneda:null, nombre:'', escudo:null, modo:null, equipoElegidoId:null};
        document.body.classList.remove('liga-manager-screen');
        document.body.classList.add('menu-screen');
        return;
      }
      mostrarFelicitacionNuevaTemporada();
    });
  }
  // Popup de felicitación antes de arrancar la nueva temporada con
  // todo el progreso conservado — mismo estilo que el resto de la
  // interfaz, a modo de reconocimiento por una buena temporada antes
  // de continuar la aventura.
  function mostrarFelicitacionNuevaTemporada(){
    const overlay=document.createElement('div');
    overlay.id='lmFelicitacionTemporadaOverlay';
    overlay.innerHTML=`
      <div class="lm-dilemma-card" style="max-width:420px">
        <div class="lm-dilemma-title" style="justify-content:center;text-align:center"><i class="ph ph-bold ph-confetti"></i>${t('lm.resumen_temporada_felicidades_titulo')}</div>
        <div class="lm-dilemma-text" style="margin:10px 0 16px;text-align:center">${t('lm.resumen_temporada_felicidades_texto')}</div>
        <div class="lm-popup-actions"><button id="lmFelicitacionEmpezarBtn" class="mode-card-btn mode-card-btn-gold">${t('lm.resumen_temporada_empezar_temporada_btn')}</button></div>
      </div>`;
    document.getElementById('ligaManagerScreen').appendChild(overlay);
    overlay.querySelector('#lmFelicitacionEmpezarBtn').addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      overlay.remove();
      iniciarNuevaTemporadaConProgreso();
    });
  }

  // Suma todas las estrellas de nivel conseguidas en los proyectos de
  // los 5 departamentos del cuerpo técnico (máximo 3★ cada track) —
  // determina el nivel visual del estadio: 5 niveles de imagen, y solo
  // tenerlas TODAS al máximo da el nivel 5.
  function calcularEstrellasClub(){
    const grupos=[
      state.medicoNiveles, state.mantenimientoNiveles, state.directorGeneralNiveles,
      state.directorDeportivoNiveles, state.preparadorFisicoNiveles
    ];
    let total=0, max=0;
    grupos.forEach(g=>{
      if(!g) return;
      Object.values(g).forEach(v=>{ total+=(v||0); max+=NIVEL_MAXIMO_EQUIPO; });
    });
    const ratio = max>0 ? total/max : 0;
    let nivelEstadio;
    if(ratio>=1) nivelEstadio=5;
    else if(ratio>=0.75) nivelEstadio=4;
    else if(ratio>=0.5) nivelEstadio=3;
    else if(ratio>=0.25) nivelEstadio=2;
    else nivelEstadio=1;
    return {total, max, nivelEstadio};
  }
  function abrirInfoClub(){
    const overlay=document.createElement('div');
    overlay.id='lmInfoClubOverlay';
    const {total, max, nivelEstadio}=calcularEstrellasClub();
    const estadio=state.estadio||{campo:100,satisfaccion:0,aforoTotal:0,ultimaAsistencia:null};
    const monedaInfo=MONEDAS[state.moneda]||MONEDAS.EUR;
    overlay.innerHTML=`
      <div class="lm-dilemma-card lm-infoclub-card">
        ${xCerrarHTML()}
        <div class="lm-dilemma-title"><i class="ph ph-bold ph-magnifying-glass"></i> INFORMACIÓN DEL CLUB</div>
        <div class="lm-infoclub-estadio">
          <img src="assets/estadio/estadio_nivel${nivelEstadio}.png" alt="Estadio nivel ${nivelEstadio}">
          <div class="lm-infoclub-estadio-nivel"><i class="ph ph-bold ph-star"></i> ${t('lm.nivel_estadio')} ${nivelEstadio}/5</div>
          <div class="lm-infoclub-estrellas-bar"><div class="lm-infoclub-estrellas-fill" style="width:${Math.min(100,(total/max)*100)}%"></div></div>
          <div class="lm-infoclub-estrellas-txt">${total}/${max} estrellas de proyectos conseguidas</div>
        </div>
        <div class="lm-infoclub-stats-grid">
          <div class="lm-infoclub-stat">
            <div class="lm-infoclub-stat-top"><i class="ph ph-bold ph-coins"></i><div class="lm-infoclub-stat-val">${formatoDinero(state.capital||0)}</div></div><div class="lm-infoclub-stat-label">${t('lm.capital')}</div>
          </div>
          <div class="lm-infoclub-stat">
            <div class="lm-infoclub-stat-top"><i class="ph ph-bold ph-users"></i><div class="lm-infoclub-stat-val">${(estadio.aforoTotal||0).toLocaleString('es-ES')}</div></div><div class="lm-infoclub-stat-label">${t('lm.aforo_maximo')}</div>
          </div>
          <div class="lm-infoclub-stat">
            <div class="lm-infoclub-stat-top"><i class="ph ph-bold ph-ticket"></i><div class="lm-infoclub-stat-val">${((estadio.ultimaAsistencia&&estadio.ultimaAsistencia.asistentes)||0).toLocaleString('es-ES')}</div></div><div class="lm-infoclub-stat-label">${t('lm.ultima_asistencia')}</div>
          </div>
          <div class="lm-infoclub-stat">
            <div class="lm-infoclub-stat-top"><i class="ph ph-bold ph-money"></i><div class="lm-infoclub-stat-val">${monedaInfo.symbol}${state.precioEntrada||0}</div></div><div class="lm-infoclub-stat-label">${t('lm.precio_entrada')}</div>
          </div>
          <div class="lm-infoclub-stat">
            <div class="lm-infoclub-stat-top"><i class="ph ph-bold ph-smiley"></i><div class="lm-infoclub-stat-val">${estadio.satisfaccion||0}</div></div><div class="lm-infoclub-stat-label">${t('lm.satisfaccion_afición')}</div>
          </div>
          <div class="lm-infoclub-stat">
            <div class="lm-infoclub-stat-top"><i class="ph ph-bold ph-heartbeat"></i><div class="lm-infoclub-stat-val">${state.moral||0}</div></div><div class="lm-infoclub-stat-label">${t('lm.moral_equipo')}</div>
          </div>
          <div class="lm-infoclub-stat">
            <div class="lm-infoclub-stat-top"><i class="ph ph-bold ph-grass"></i><div class="lm-infoclub-stat-val">${estadio.campo||0}%</div></div><div class="lm-infoclub-stat-label">${t('lm.estado_cesped')}</div>
          </div>
          <div class="lm-infoclub-stat">
            <div class="lm-infoclub-stat-top"><i class="ph ph-bold ph-users-three"></i><div class="lm-infoclub-stat-val">${(state.plantilla||[]).length}</div></div><div class="lm-infoclub-stat-label">${t('lm.plantilla')}</div>
          </div>
        </div>
        <div class="lm-popup-actions"><button id="lmInfoClubCerrar" class="mode-card-btn mode-card-btn-gold">${t('lm.cerrar')}</button></div>
      </div>`;
    document.getElementById('ligaManagerScreen').appendChild(overlay);
    habilitarCierreOverlay(overlay, ()=>overlay.remove());
    overlay.querySelector('[data-cerrar-x]').addEventListener('click', ()=>overlay.remove());
    overlay.querySelector('#lmInfoClubCerrar').addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      overlay.remove();
    });
  }

  function abrirOnceRival(rival){
    const overlay=document.createElement('div');
    overlay.id='lmOnceRivalOverlay';
    const {titulares, banquillo}=generarOnceRivalFicticio(rival);
    const filaJugadorRival=j=>`<tr>
      <td class="lm-td-numero">${j.numero||'-'}</td>
      <td>${j.name}</td>
      <td><strong>${j.position}</strong></td>
      <td>${j.attack}</td><td>${j.defense}</td><td>${j.pace}</td><td>${j.passing}</td><td>${j.technique}</td>
      <td><strong>${Math.round((j.attack+j.defense+j.pace+j.passing+j.technique)/5)}</strong></td>
    </tr>`;
    overlay.innerHTML=`
      <div class="lm-dilemma-card" style="width:560px;max-width:94vw;text-align:left">
        ${xCerrarHTML()}
        <div class="lm-dilemma-title">${rivalCrestHTML(26, rival.crestImg)}<span style="margin-left:6px">${rival.name.toUpperCase()}</span></div>
        <div class="bench-title" style="margin-top:6px"><span><i class="ph ph-bold ph-t-shirt" style="color:var(--gold);margin-right:6px"></i>${t("lm.once_titular")}</span></div>
        <div>
          <table class="roster-table">
            <thead><tr><th>#</th><th>${t('lm.tabla_jugador')}</th><th>Pos</th><th>${t('lm.stat_ata')}</th><th>${t('lm.stat_def')}</th><th>${t('lm.stat_rit')}</th><th>${t('lm.stat_pas')}</th><th>${t('lm.stat_tec')}</th><th>${t('lm.tabla_punt')}</th></tr></thead>
            <tbody>${titulares.map(filaJugadorRival).join('')}</tbody>
          </table>
        </div>
        <div class="bench-title" style="margin-top:14px"><span><i class="ph ph-bold ph-chair" style="color:var(--gold);margin-right:6px"></i>${t("lm.banquillo")}</span></div>
        <div>
          <table class="roster-table">
            <thead><tr><th>#</th><th>${t('lm.tabla_jugador')}</th><th>Pos</th><th>${t('lm.stat_ata')}</th><th>${t('lm.stat_def')}</th><th>${t('lm.stat_rit')}</th><th>${t('lm.stat_pas')}</th><th>${t('lm.stat_tec')}</th><th>${t('lm.tabla_punt')}</th></tr></thead>
            <tbody>${banquillo.map(filaJugadorRival).join('')}</tbody>
          </table>
        </div>
        <div class="lm-popup-actions lm-popup-actions-compact">
          <button id="lmOnceRivalCerrar" class="mode-card-btn mode-card-btn-gold">${t('lm.cerrar')}</button>
        </div>
      </div>`;
    document.getElementById('ligaManagerScreen').appendChild(overlay);
    habilitarCierreOverlay(overlay, ()=>overlay.remove());
    const xBtn=overlay.querySelector('[data-cerrar-x]');
    if(xBtn) xBtn.addEventListener('click', ()=>overlay.remove());
    document.getElementById('lmOnceRivalCerrar').addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      overlay.remove();
    });
  }
  // Aviso de plantilla técnica incompleta — a diferencia del aviso
  // genérico de un solo botón, este tiene dos opciones reales:
  // decidirlo más tarde (sigue jugando sin más) o ir directo a
  // contratar. Mismo patrón visual que el aviso de quiniela pendiente,
  // para que ambos popups mantengan homogeneidad entre sí.
  function mostrarAvisoPlantillaTecnicaIncompleta(continuarCallback){
    const overlay=document.createElement('div');
    overlay.id='lmAvisoPlantillaTecnicaOverlay';
    overlay.innerHTML=`
      <div class="lm-dilemma-card" style="max-width:400px">
        <div class="lm-dilemma-title"><i class="ph ph-bold ph-warning-circle"></i>${t('lm.plantilla_tecnica_incompleta_titulo')}</div>
        <div class="lm-dilemma-text" style="margin:10px 0 16px">${t('lm.plantilla_tecnica_incompleta_msg')}</div>
        <div class="lm-popup-actions lm-popup-actions-compact">
          <button id="lmAvisoPlantillaTecnicaMasTarde" class="mode-card-btn mode-card-btn-secondary">${t('lm.decidir_mas_tarde_btn')}</button>
          <button id="lmAvisoPlantillaTecnicaContratar" class="mode-card-btn mode-card-btn-gold">${t('lm.contratar_ahora_btn')}</button>
        </div>
      </div>`;
    document.getElementById('ligaManagerScreen').appendChild(overlay);
    const cerrar=()=>overlay.remove();
    habilitarCierreOverlay(overlay, cerrar);
    document.getElementById('lmAvisoPlantillaTecnicaContratar').addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      cerrar();
      abrirTrabajadores();
    });
    document.getElementById('lmAvisoPlantillaTecnicaMasTarde').addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      cerrar();
      // Sigue encadenando al siguiente aviso pendiente (quiniela,
      // entrenamiento sin plan...) en vez de cortar aquí el flujo —
      // antes había que pulsar SEGUIR una vez por cada aviso
      // distinto, en vez de verlos todos seguidos en el mismo clic.
      if(typeof continuarCallback==='function') continuarCallback();
    });
  }
  // Aviso de entrenamiento sin plan asignado — mismo patrón visual que
  // los otros dos popups (plantilla técnica incompleta y quiniela
  // pendiente): decidirlo más tarde (sigue la semana sin más) o ir
  // directo a planificar el entrenamiento.
  function mostrarAvisoEntrenamientoSinPlan(continuarCallback){
    const overlay=document.createElement('div');
    overlay.id='lmAvisoEntrenamientoSinPlanOverlay';
    overlay.innerHTML=`
      <div class="lm-dilemma-card" style="max-width:400px">
        <div class="lm-dilemma-title"><i class="ph ph-bold ph-barbell"></i>${t('lm.plan_entrenamiento_titulo')}</div>
        <div class="lm-dilemma-text" style="margin:10px 0 16px">${t('lm.confirmar_seguir_sin_pf')}</div>
        <div class="lm-popup-actions lm-popup-actions-compact">
          <button id="lmAvisoEntrenamientoMasTarde" class="mode-card-btn mode-card-btn-secondary">${t('lm.decidir_mas_tarde_btn')}</button>
          <button id="lmAvisoEntrenamientoPlanificar" class="mode-card-btn mode-card-btn-gold">${t('lm.planificar_entrenamiento_btn')}</button>
        </div>
      </div>`;
    document.getElementById('ligaManagerScreen').appendChild(overlay);
    const cerrar=()=>overlay.remove();
    habilitarCierreOverlay(overlay, cerrar);
    document.getElementById('lmAvisoEntrenamientoPlanificar').addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      cerrar();
      abrirPreparadorFisico();
    });
    document.getElementById('lmAvisoEntrenamientoMasTarde').addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      cerrar();
      continuarCallback();
    });
  }
  function mostrarAvisoJuego(mensaje, titulo){
    const overlay=document.createElement('div');
    overlay.id='lmAvisoOverlay';
    overlay.innerHTML=`
      <div class="lm-dilemma-card" style="max-width:400px">
        <div class="lm-dilemma-title"><i class="ph ph-bold ph-warning-circle"></i>${titulo||'AVISO DEL CLUB'}</div>
        <div class="lm-dilemma-text" style="margin:10px 0 16px">${mensaje}</div>
        <div class="lm-popup-actions lm-popup-actions-compact">
          <button id="lmAvisoCerrar" class="mode-card-btn mode-card-btn-gold">${t('lm.entendido')}</button>
        </div>
      </div>`;
    document.getElementById('ligaManagerScreen').appendChild(overlay);
    const cerrar=()=>overlay.remove();
    habilitarCierreOverlay(overlay, cerrar);
    document.getElementById('lmAvisoCerrar').addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      cerrar();
    });
  }
  // Aviso de quiniela pendiente justo antes de jugar el partido — la
  // quiniela se entrega para usarse en ESA jornada, así que si el
  // jugador intenta jugar sin haberla rellenado, se le da la opción de
  // rellenarla ahí mismo o seguir jugando (perdiéndola).
  function mostrarAvisoQuinielaPendienteAntesDeJugar(continuarCallback){
    const overlay=document.createElement('div');
    overlay.id='lmAvisoQuinielaOverlay';
    overlay.innerHTML=`
      <div class="lm-dilemma-card" style="max-width:400px">
        <div class="lm-dilemma-title"><i class="ph ph-bold ph-ticket"></i>${t('lm.quiniela_pendiente_titulo')}</div>
        <div class="lm-dilemma-text" style="margin:10px 0 16px">${t('lm.quiniela_pendiente_aviso')}</div>
        <div class="lm-popup-actions lm-popup-actions-compact">
          <button id="lmAvisoQuinielaSeguir" class="mode-card-btn mode-card-btn-secondary">${t('lm.seguir_sin_quiniela_btn')}</button>
          <button id="lmAvisoQuinielaRellenar" class="mode-card-btn mode-card-btn-gold">${t('lm.rellenar_quiniela_btn')}</button>
        </div>
      </div>`;
    document.getElementById('ligaManagerScreen').appendChild(overlay);
    const cerrar=()=>overlay.remove();
    habilitarCierreOverlay(overlay, cerrar);
    document.getElementById('lmAvisoQuinielaRellenar').addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      cerrar();
      abrirBoletoQuiniela();
    });
    document.getElementById('lmAvisoQuinielaSeguir').addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      // Se pierde de verdad: se borra del correo interno y del estado,
      // no tiene sentido conservar una quiniela para una jornada que
      // ya se ha jugado.
      state.quinielaBoleto=null;
      guardarEstado();
      cerrar();
      continuarCallback();
    });
  }
  // Si has despedido a quien ocupaba un puesto (o todavía no lo has
  // cubierto), en vez de un aviso genérico abrimos directamente
  // TRABAJADORES ya filtrado a ese puesto concreto.
  function bloqueadoPorVacante(rol){
    if(!state.trabajadores || !state.trabajadores[rol]){
      if(typeof window.playSound==='function') window.playSound('select');
      abrirTrabajadores(rol);
      return true;
    }
    return false;
  }
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
    return `<img src="${ruta}" alt="${alt}"${vacante?` title="${t('lm.tt_puesto_vacante')}"`:''} class="lm-staff-photo-img"${estiloGris} onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex';">
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
    return `<div class="${wrap}"><div class="fatigue-bar fatigue-${colorCampo(valor)}" style="width:${Math.max(0,Math.min(100,valor))}%"></div></div>${mini?'':ultimoCambioHTML(state.ultimoCambioCampo)}`;
  }
  // Etiqueta discreta y oscura con el último cambio de una barra (moral,
  // satisfacción, césped...) — mismo tono que la propia barra pero
  // apagado, para verlo de un vistazo sin que grite más que el número
  // principal.
  function ultimoCambioHTML(delta, compacto){
    if(delta===undefined || delta===null || delta===0) return '';
    const positivo=delta>0;
    return `<div class="lm-ultimo-cambio ${positivo?'lm-ultimo-cambio-pos':'lm-ultimo-cambio-neg'}${compacto?' lm-ultimo-cambio-mini':''}">
      <i class="ph ph-bold ${positivo?'ph-trend-up':'ph-trend-down'}"></i>último: ${positivo?'+':''}${delta}
    </div>`;
  }
  // Barra bidireccional — CALCO exacto de la barra de MORAL de Copa
  // Leyendas (.morale-track/.morale-fill), reutilizada tanto para la
  // satisfacción de la afición (-100..100) como para la moral del propio
  // equipo (-50..50). "claseExtra" permite un acento de color distinto
  // para cada una (oro para afición, verde/rojo de siempre para moral),
  // así las tres barras del estadio quedan bien diferenciadas entre sí.
  function bidireccionalBarraHTML(valor, rango, claseExtra, ultimoCambio){
    const pct=Math.min(50, Math.abs(valor)/rango*50);
    const positivo=valor>=0;
    const left = positivo ? '50%' : (50-pct)+'%';
    return `<div class="morale-track">
      <div class="morale-neg-zone"></div>
      <div class="morale-pos-zone"></div>
      <div class="morale-center"></div>
      <div class="morale-fill ${claseExtra||''} ${positivo?'positive':'negative'}" style="width:${pct}%;left:${left}"></div>
      <div class="morale-zero-marker"></div>
    </div>${ultimoCambioHTML(ultimoCambio)}`;
  }
  function satisfaccionBarraHTML(valor){ return bidireccionalBarraHTML(valor, 100, 'lm-sat-fill', state.ultimoCambioSatisfaccion); }
  function moralBarraHTML(valor){ return bidireccionalBarraHTML(valor, 50, '', state.ultimoCambioMoral); }

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
    const nominaGuardias=(state.guardiasContratados||0)*guardiaSalarioActual();
    const nominaDG=(trab.directorGeneral?trab.directorGeneral.sueldo:0)+nivelTotalDe(state.directorGeneralNiveles)*1500;
    const nominaDD=(trab.directorDeportivo?trab.directorDeportivo.sueldo:0)+nivelTotalDe(state.directorDeportivoNiveles)*1500;
    const nominaPF=(trab.preparadorFisico?trab.preparadorFisico.sueldo:0)+nivelTotalDe(state.preparadorFisicoNiveles)*1200;
    const nominaStaff=nominaMedico+nominaMantenimiento+nominaGuardias+nominaDG+nominaDD+nominaPF;
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
    // Aviso mensual de nóminas pagadas, con acceso directo al balance
    // económico completo desde el propio correo.
    const netoMes=n.ingresoPatrocinio-nominaJugadores-nominaStaff;
    if(typeof enviarCorreo==='function'){
      enviarCorreo('directorGeneral', t('correo.nominas_pagadas.asunto'),
        tp('correo.nominas_pagadas.cuerpo', {jugadores:formatoDinero(nominaJugadores), staff:formatoDinero(nominaStaff), patrocinio:n.ingresoPatrocinio>0?tp('correo.nominas_patrocinio',{patrocinio:formatoDinero(n.ingresoPatrocinio)}):'', balance:(netoMes>=0?'+':'')+formatoDinero(netoMes), capital:formatoDinero(state.capital)}),
        {asunto:'correo.nominas_pagadas.asunto', cuerpo:'correo.nominas_pagadas.cuerpo', paramsCuerpo:{jugadores:formatoDinero(nominaJugadores), staff:formatoDinero(nominaStaff), patrocinio:n.ingresoPatrocinio>0?tp('correo.nominas_patrocinio',{patrocinio:formatoDinero(n.ingresoPatrocinio)}):'', balance:(netoMes>=0?'+':'')+formatoDinero(netoMes), capital:formatoDinero(state.capital)}});
      const ultimo=state.correoInterno && state.correoInterno[0];
      if(ultimo) ultimo.tipoEspecial='balance_mensual';
    }
  }

  /* ---------- 9c-bis. TRABAJADORES del cuerpo técnico — cada uno de los
     4 puestos (médico, mantenimiento, director general, director
     deportivo) lo ocupa una persona con su propio nivel (1-5★) y sueldo.
     Cada mes aparece un puñado de candidatos nuevos para poder comparar
     si compensa cambiar; despedir deja el puesto vacante (sin sueldo,
     pero también sin nadie al mando) hasta contratar a otra persona. ---------- */
  const ROLES_TRABAJO=['directorGeneral','directorDeportivo','medico','preparadorFisico','mantenimiento'];
  const SUELDO_BASE_ROL={medico:4000, mantenimiento:4000, directorGeneral:5000, directorDeportivo:5000, preparadorFisico:4200};
  const NOMBRE_ROL={
    get medico(){return t('lm.titulo_medico');},
    get mantenimiento(){return t('lm.titulo_mantenimiento');},
    get directorGeneral(){return t('lm.titulo_dg');},
    get directorDeportivo(){return t('lm.titulo_dd');},
    get preparadorFisico(){return t('lm.titulo_pf');}
  };
  function nivelAleatorioTrabajador(){
    // 1★ es lo más común, 5★ muy raro — igual de espíritu que la rareza
    // de un sobre de fichajes.
    const pesos=[40,28,18,10,4]; // nivel 1..5
    const total=pesos.reduce((a,b)=>a+b,0);
    let r=Math.random()*total;
    for(let i=0;i<pesos.length;i++){ r-=pesos[i]; if(r<=0) return i+1; }
    return 1;
  }
  function generarCandidatoTrabajo(rol, nivelFijo){
    const nivel=nivelFijo||nivelAleatorioTrabajador();
    // De vez en cuando (solo en niveles 2-3) aparece un auténtico chollo:
    // el mismo nivel de siempre, pero a un sueldo muy por debajo de lo
    // normal — poco probable, pero conviene fijarse en TODOS los
    // candidatos de cada mes por si acaso.
    const esChollo = nivel>=2 && nivel<=3 && Math.random()<0.07;
    const factorSueldo = esChollo ? (0.55+Math.random()*0.12) : (0.9+Math.random()*0.2);
    const sueldo=Math.round(SUELDO_BASE_ROL[rol]*(0.55+nivel*0.55)*factorSueldo);
    return {id:'cand'+Date.now()+Math.floor(Math.random()*100000), rol, ...nombreTrabajadorAleatorio(), nivel, sueldo, chollo:esChollo};
  }
  // Un candidato de CADA nivel (1★ a 3★) por puesto, para poder elegir a
  // conciencia cada mes — no un sorteo con posibilidad de repetir nivel.
  function regenerarCandidatosTrabajo(){
    const candidatos=[];
    ROLES_TRABAJO.forEach(rol=>{
      for(let nivel=1;nivel<=3;nivel++) candidatos.push(generarCandidatoTrabajo(rol, nivel));
    });
    state.candidatosTrabajo=candidatos;
  }
  function contratarTrabajador(rol, candidatoId){
    const candidato=(state.candidatosTrabajo||[]).find(c=>c.id===candidatoId && c.rol===rol);
    if(!candidato) return false;
    if(!state.trabajadores) state.trabajadores={};
    const actual=state.trabajadores[rol];
    if(actual){
      const finiquito=calcularFiniquito(actual);
      state.capital=Math.round((state.capital||0)-finiquito);
      registrarMovimientoFinanciero('Finiquito de '+actual.nombre, -finiquito, state.jornadaActual);
    }
    state.trabajadores[rol]={id:'t'+Date.now(), nombre:candidato.nombre, genero:candidato.genero, nivel:candidato.nivel, sueldo:candidato.sueldo};
    state.candidatosTrabajo=state.candidatosTrabajo.filter(c=>c.id!==candidatoId);
    if(typeof window.unlockLMAchievement==='function' && ROLES_TRABAJO.every(r=>state.trabajadores[r])) window.unlockLMAchievement('lm_first_worker');
    guardarEstado();
    return true;
  }
  // Finiquito — dos meses de sueldo, igual que una indemnización real.
  function calcularFiniquito(trabajador){
    return trabajador ? Math.round(trabajador.sueldo*2) : 0;
  }
  function despedirTrabajador(rol){
    if(!state.trabajadores) return;
    const actual=state.trabajadores[rol];
    if(!actual) return;
    const finiquito=calcularFiniquito(actual);
    state.capital=Math.round((state.capital||0)-finiquito);
    registrarMovimientoFinanciero('Finiquito de '+actual.nombre, -finiquito, state.jornadaActual);
    state.trabajadores[rol]=null;
    guardarEstado();
  }

  /* ---------- 9c-ter. CORREO INTERNO — cada trabajador puede mandar un
     correo con algo importante, pero como mucho uno por jornada, y solo
     si de verdad hay algo que contar (no todas las jornadas). Textos
     cortos y directos, pensados para leerse de un vistazo. ---------- */
  const CORREO_ICONOS={medico:'ph-first-aid-kit', mantenimiento:'ph-flag-pennant', directorGeneral:'ph-briefcase', directorDeportivo:'ph-binoculars', preparadorFisico:'ph-barbell'};
  function enviarCorreo(rol, asunto, cuerpo, claves){
    if(!state.correoInterno) state.correoInterno=[];
    if(!state.correoUltimoEnviado) state.correoUltimoEnviado={};
    const mail={id:'mail'+Date.now()+Math.floor(Math.random()*100000), rol, asunto, cuerpo, jornada:state.jornadaActual, leido:false};
    // Si se pasan las claves de traducción originales, se guardan
    // también — así el correo se puede volver a traducir al idioma
    // que esté activo en el momento de leerlo, en vez de quedarse
    // congelado para siempre en el idioma en que se envió.
    if(claves){ mail.claveAsunto=claves.asunto; mail.paramsAsunto=claves.paramsAsunto; mail.claveCuerpo=claves.cuerpo; mail.paramsCuerpo=claves.paramsCuerpo; }
    state.correoInterno.unshift(mail);
    state.correoUltimoEnviado[rol]=state.jornadaActual;
    if(state.correoInterno.length>40) state.correoInterno=state.correoInterno.slice(0,40);
  }
  // Traduce un correo al idioma actual si se guardaron sus claves
  // originales; si es un correo antiguo sin claves (de antes de este
  // arreglo), usa el texto ya guardado tal cual.
  function correoAsuntoActual(c){ return c.claveAsunto ? (c.paramsAsunto?tp(c.claveAsunto,c.paramsAsunto):t(c.claveAsunto)) : c.asunto; }
  function correoCuerpoActual(c){ return c.claveCuerpo ? (c.paramsCuerpo?tp(c.claveCuerpo,c.paramsCuerpo):t(c.claveCuerpo)) : c.cuerpo; }
  function borrarCorreo(mailId){
    if(!state.correoInterno) return;
    state.correoInterno=state.correoInterno.filter(c=>c.id!==mailId);
    if(correoExpandido===mailId) correoExpandido=null;
    guardarEstado();
  }
  function borrarTodoElCorreo(){
    state.correoInterno=[];
    correoExpandido=null;
    guardarEstado();
  }
  function generarCorreosTrasJornada(){
    if(!state.correoInterno) state.correoInterno=[];
    if(!state.correoUltimoEnviado) state.correoUltimoEnviado={};
    const trab=state.trabajadores||{};
    const yaEnviado=(rol)=>state.correoUltimoEnviado[rol]===state.jornadaActual;

    if(trab.mantenimiento && !yaEnviado('mantenimiento')){
      const est=state.estadio||{};
      if(est.campo<40){
        enviarCorreo('mantenimiento', t('correo.cesped_preocupante.asunto'),
          tp('correo.cesped_preocupante.cuerpo', {n:Math.round(est.campo)}),
          {asunto:'correo.cesped_preocupante.asunto', cuerpo:'correo.cesped_preocupante.cuerpo', paramsCuerpo:{n:Math.round(est.campo)}});
      } else if(est.satisfaccion<-30){
        enviarCorreo('mantenimiento', t('correo.grada_descontenta.asunto'),
          tp('correo.grada_descontenta.cuerpo', {n:est.satisfaccion}),
          {asunto:'correo.grada_descontenta.asunto', cuerpo:'correo.grada_descontenta.cuerpo', paramsCuerpo:{n:est.satisfaccion}});
      }
    }
    if(trab.medico && !yaEnviado('medico')){
      const lesionados=(state.plantilla||[]).filter(p=>p.injured);
      const graves=lesionados.filter(p=>p.injurySeverity==='grave');
      if(graves.length){
        enviarCorreo('medico', tp('correo.lesion_grave.asunto', {jugador:graves[0].name}),
          tp('correo.lesion_grave.cuerpo', {jugador:graves[0].name}),
          {asunto:'correo.lesion_grave.asunto', paramsAsunto:{jugador:graves[0].name}, cuerpo:'correo.lesion_grave.cuerpo', paramsCuerpo:{jugador:graves[0].name}});
      } else if(lesionados.length>=3){
        enviarCorreo('medico', tp('correo.multiples_lesionados.asunto', {n:lesionados.length}),
          tp('correo.multiples_lesionados.cuerpo', {n:lesionados.length}),
          {asunto:'correo.multiples_lesionados.asunto', paramsAsunto:{n:lesionados.length}, cuerpo:'correo.multiples_lesionados.cuerpo', paramsCuerpo:{n:lesionados.length}});
      }
    }
    if(trab.directorGeneral && !yaEnviado('directorGeneral')){
      if((state.capital||0)<0){
        enviarCorreo('directorGeneral', t('correo.numeros_rojos.asunto'),
          tp('correo.numeros_rojos.cuerpo', {n:formatoDinero(state.capital)}),
          {asunto:'correo.numeros_rojos.asunto', cuerpo:'correo.numeros_rojos.cuerpo', paramsCuerpo:{n:formatoDinero(state.capital)}});
      } else {
        const nomina=calcularNominaMensual();
        if((state.capital||0)<nomina.total){
          enviarCorreo('directorGeneral', t('correo.nomina_problema.asunto'),
            tp('correo.nomina_problema.cuerpo', {capital:formatoDinero(state.capital), nomina:formatoDinero(nomina.total)}),
            {asunto:'correo.nomina_problema.asunto', cuerpo:'correo.nomina_problema.cuerpo', paramsCuerpo:{capital:formatoDinero(state.capital), nomina:formatoDinero(nomina.total)}});
        }
      }
    }
    if(trab.directorDeportivo){
      intentarGenerarSobreFichajes();
    }
    guardarEstado();
  }

  // Los sobres de fichajes se generan solos con el tiempo — más a menudo
  // cuanto más subida esté la Red de Ojeadores del Director Deportivo.
  // Máximo 3 sin abrir a la vez: si no abres los que tienes, no llegan
  // más nuevos hasta que hagas hueco. Cada uno avisa por correo en
  // cuanto está listo, y se abre directamente desde ahí.
  function intentarGenerarSobreFichajes(){
    if(!state.sobresFichajesPendientes) state.sobresFichajesPendientes=[];
    if(state.sobresFichajesPendientes.length>=3) return;
    const nivel=nivelDeDD('sobresFichajes');
    const probabilidad=0.08+nivel*0.07; // 8% base, hasta ~29% a nivel máximo
    if(Math.random()<probabilidad){
      const nivelSobre=Math.max(1, nivel);
      const id='sobre'+Date.now()+Math.floor(Math.random()*100000);
      state.sobresFichajesPendientes.push({id, nivel:nivelSobre, jornadaGenerado:state.jornadaActual});
      enviarCorreo('directorDeportivo', t('correo.sobre_listo.asunto'),
        tp('correo.sobre_listo.cuerpo', {n:nivelSobre}),
        {asunto:'correo.sobre_listo.asunto', cuerpo:'correo.sobre_listo.cuerpo', paramsCuerpo:{n:nivelSobre}});
      const ultimo=state.correoInterno && state.correoInterno[0];
      if(ultimo){ ultimo.tipoEspecial='sobre_listo'; ultimo.sobreId=id; }
    }
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
  // Reinicia los usos del Giro Táctico al cruzar de la primera mitad
  // de temporada (jornadas 1-19) a la segunda (20-38) — se llama al
  // principio de jugarJornada(), así siempre está al día antes de
  // jugar cualquier partido. También sirve de inicialización perezosa
  // para partidas guardadas antes de que existiera este sistema.
  function actualizarUsosGiroTacticoLM(){
    const mitadReal = state.jornadaActual<=19 ? 1 : 2;
    if(state.giroTacticoUsosRestantes===undefined || state.giroTacticoMitad!==mitadReal){
      state.giroTacticoUsosRestantes=getMaxGiroTacticoLM();
      state.giroTacticoMitad=mitadReal;
    }
  }
  function dificultadActualNivelDG(def){ return Math.max(3, def.dificultadBase + nivelDeDG(def.track)*def.dificultadPaso - bonusEstrellasTrabajador('directorGeneral')); }
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
    if((state.directorGeneralCambiosUsados||0)>=lmCambiosCartaPorPartido()) return false;
    const otras=state.directorGeneralCartas.filter((c,i)=>i!==idx).map(c=>c.cartaId);
    const nueva=generarCartaAleatoriaDG(otras);
    if(!nueva) return false;
    state.directorGeneralCartas[idx]=nueva;
    state.directorGeneralCambiosUsados=(state.directorGeneralCambiosUsados||0)+1;
    guardarEstado();
    return true;
  }
  function aplicarEfectoDirectaDG(def){
    switch(def.id){
      case 'patrocinio_puntual': {
        const monto=18000+Math.round(Math.random()*7000);
        state.capital=(state.capital||0)+monto;
        registrarMovimientoFinanciero('Patrocinio puntual', monto, state.jornadaActual);
        if(typeof window.unlockLMAchievement==='function') window.unlockLMAchievement('lm_first_sponsor', false);
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
    if(!def) return {tipo:'error', texto:'No se encontró la carta — prueba a cambiarla.'};
    const suma=tiradas.reduce((a,b)=>a+b,0);
    let resultado;
    if(def.tipo==='directa'){
      const dificultadEfectiva=Math.max(3, def.dificultad - bonusEstrellasTrabajador('directorGeneral'));
      const exito=suma>=dificultadEfectiva;
      if(exito){
        const texto=aplicarEfectoDirectaDG(def);
        state.directorGeneralCartas[idx]=generarCartaAleatoriaDG(state.directorGeneralCartas.map(c=>c.cartaId)) || instancia;
        resultado={tipo:'directa', exito:true, suma, dificultad:dificultadEfectiva, texto};
      } else {
        resultado={tipo:'directa', exito:false, suma, dificultad:dificultadEfectiva, texto:'La carta se queda en tu mano — puedes reintentarlo más adelante'};
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
    {id:'informe_ojeo',            tipo:'directa', nombre:'Informe de Ojeo Exprés', icon:'ph-magnifying-glass', dificultad:7, desc:'El próximo sobre que abras traerá mejor calidad de la habitual'},
    {id:'gira_promocional',        tipo:'directa', nombre:'Gira Promocional',        icon:'ph-airplane-tilt',dificultad:6, desc:'Ingreso instantáneo de capital y un pequeño impulso a la moral'},
    {id:'sobres_fichajes',   tipo:'nivel', track:'sobresFichajes', nombre:'Red de Ojeadores Activa',      icon:'ph-envelope-open', dificultadBase:9, dificultadPaso:5, desc:'Acorta el tiempo entre sobres de fichajes — llegarán con más frecuencia por correo. A nivel alto, aumenta también la posibilidad de que aparezca un fichaje estrella real'},
    {id:'red_ojeadores',     tipo:'nivel', track:'calidadOjeo',    nombre:'Red de Ojeadores',        icon:'ph-binoculars',    dificultadBase:8, dificultadPaso:4, desc:'Mejora la calidad de los jugadores que salen en los sobres'},
    {id:'negociacion_contratos',tipo:'nivel', track:'ahorroSalarial', nombre:'Negociación de Contratos', icon:'ph-handshake', dificultadBase:8, dificultadPaso:4, desc:'Reduce el salario de los jugadores fichados por sobre'},
    {id:'formacion_cantera', tipo:'nivel', track:'costeSobres',    nombre:'Formación de Cantera',    icon:'ph-graduation-cap',dificultadBase:8, dificultadPaso:4, desc:'Tu academia forma talento desde la base: cada canterano que llega por sobre nace con un nivel superior al habitual'}
  ];
  function cartaDefDD(id){ return DIRECTOR_DEPORTIVO_CARTAS_BASE.find(c=>c.id===id); }
  function nivelDeDD(track){ return (state.directorDeportivoNiveles && state.directorDeportivoNiveles[track]) || 0; }
  function dificultadActualNivelDD(def){
    let d=def.dificultadBase + nivelDeDD(def.track)*def.dificultadPaso - bonusEstrellasTrabajador('directorDeportivo');
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
    if((state.directorDeportivoCambiosUsados||0)>=lmCambiosCartaPorPartido()) return false;
    const otras=state.directorDeportivoCartas.filter((c,i)=>i!==idx).map(c=>c.cartaId);
    const nueva=generarCartaAleatoriaDD(otras);
    if(!nueva) return false;
    state.directorDeportivoCartas[idx]=nueva;
    state.directorDeportivoCambiosUsados=(state.directorDeportivoCambiosUsados||0)+1;
    guardarEstado();
    return true;
  }
  const SOBRE_COSTES={1:5000, 2:12000, 3:25000};
  // Genera un jugador de sobre: cuanto mayor el nivel del sobre y la Red
  // de Ojeadores, mejor (y más caro de mantener) — tal como se pidió. Si
  // hay una posición objetivo marcada desde el Director Deportivo, los
  // ojeadores se centran en ella en vez de salir al azar.
  function generarJugadorSobre(nivelSobre, posicionForzada){
    const calidad=nivelDeDD('calidadOjeo');
    const canteraBonus=nivelDeDD('costeSobres')*3;
    const bonusInforme = (state.directorDeportivoBonos && state.directorDeportivoBonos.bonusCalidadSobre) ? 8 : 0;
    // OPORTUNIDAD: el canterano sale con una nota algo superior a la
    // habitual, pero pidiendo un sueldo más bajo del que le
    // correspondería por esa nota. Cuanto más subido esté "Red de
    // Ojeadores", más fácil es que aparezca — de un 5% base a un 25%
    // con la Red de Ojeadores al máximo.
    const esOportunidad = Math.random()<(0.05+calidad*0.02);
    const overall=Math.max(45, Math.min(96, 50+nivelSobre*10+calidad*4+canteraBonus+bonusInforme+(esOportunidad?6:0)+Math.floor(Math.random()*8)));
    const posiciones=['POR','DFC','LI','LD','MC','EI','ED','DC'];
    const position = (posicionForzada && posiciones.includes(posicionForzada)) ? posicionForzada : posiciones[Math.floor(Math.random()*posiciones.length)];
    const variar=()=>Math.max(30,Math.min(96, overall+Math.floor(Math.random()*13)-6));
    const ahorro=nivelDeDD('ahorroSalarial')*0.12;
    const descuentoOportunidad = esOportunidad ? 0.35 : 0;
    const salario=Math.round(calcularSalario(overall)*(1-ahorro)*(1-descuentoOportunidad));
    return {
      id:'s'+Date.now()+Math.floor(Math.random()*100000), name:nombreJugadorAleatorio(), position, overall,
      attack:variar(), defense:variar(), pace:variar(), passing:variar(), technique:variar(),
      fatigue:100, racha:0, esSuplente:true,
      injured:false, injuryWeeks:0, injurySeverity:null,
      // Techo de potencial — dato que existe siempre para cada
      // candidato, pero que solo se MUESTRA al jugador si tiene activa
      // la habilidad Ojo Clínico (ver render de la carta del sobre).
      potencial: Math.max(overall, Math.min(99, overall+8+Math.floor(Math.random()*12))),
      salario, nivelSobre, esFichajeEstrella:false, esOportunidad
    };
  }
  // FICHAJE ESTRELLA — con la Red de Ojeadores bien subida de nivel
  // (2-3 estrellas), a veces uno de los 3 candidatos del sobre no es un
  // canterano inventado, sino un jugador REAL de otro equipo de la
  // liga, listo para ficharlo. Si se ficha, desaparece de su equipo de
  // origen el resto de la partida (registrado en
  // state.jugadoresRealesFichados).
  function jugadorYaFichado(equipoId, nombre){
    return (state.jugadoresRealesFichados||[]).some(j=>j.equipoId===equipoId && j.nombre===nombre);
  }
  // Aunque un equipo tenga más jugadores investigados en teams-data.js
  // (algunos llegan a 25-29), en el terreno de juego un rival SOLO usa
  // sus 16 mejores (11 titulares + 5 banquillo) — los mismos que se
  // muestran en la lupa y los únicos que pueden salir como goleadores.
  // El resto queda "en la recámara": si uno de esos 16 se ficha (sale
  // del equipo), el siguiente mejor disponible ocupa su hueco solo,
  // sin que el jugador tenga que hacer nada. Esto NUNCA afecta a tu
  // propia plantilla, solo a la de los rivales.
  function plantillaEfectivaRival(equipo){
    const disponibles=(equipo.plantilla||[]).filter(j=>!jugadorYaFichado(equipo.id, j.name));
    const puntuacion=j=> j.attack!==undefined
      ? Math.round((j.attack+j.defense+j.pace+j.passing+j.technique)/5)
      : Math.round((equipo.attack+equipo.defense+equipo.pace+equipo.passing+equipo.technique)/5);
    // El portero real del equipo SIEMPRE debe ocupar la portería, nunca
    // un jugador de campo — por eso se separan y se ordena cada grupo
    // por su cuenta, con el portero (o los porteros, si hay varios)
    // siempre por delante del resto.
    const porteros=disponibles.filter(j=>j.pos==='POR').sort((a,b)=>puntuacion(b)-puntuacion(a));
    const resto=disponibles.filter(j=>j.pos!=='POR').sort((a,b)=>puntuacion(b)-puntuacion(a));
    return [...porteros, ...resto].slice(0,16);
  }
  function generarJugadorFichajeEstrella(posicionForzada){
    const equiposConHueco = LM_RIVALS.filter(eq=>(eq.plantilla||[]).some(j=>!jugadorYaFichado(eq.id, j.name)));
    if(!equiposConHueco.length) return null;
    const equipo = equiposConHueco[Math.floor(Math.random()*equiposConHueco.length)];
    const candidatos = equipo.plantilla.filter(j=>!jugadorYaFichado(equipo.id, j.name));
    const jugadorReal = candidatos[Math.floor(Math.random()*candidatos.length)];
    const posiciones=['POR','DFC','LI','LD','MC','EI','ED','DC'];
    const position = (posicionForzada && posiciones.includes(posicionForzada)) ? posicionForzada : posiciones[Math.floor(Math.random()*posiciones.length)];
    function statVariada(base){ return Math.max(50, Math.min(97, Math.round(base+Math.floor(Math.random()*11)-5))); }
    const tieneStatsReales = jugadorReal.attack!==undefined;
    const attack = tieneStatsReales ? jugadorReal.attack : statVariada(equipo.attack);
    const defense = tieneStatsReales ? jugadorReal.defense : statVariada(equipo.defense);
    const pace = tieneStatsReales ? jugadorReal.pace : statVariada(equipo.pace);
    const passing = tieneStatsReales ? jugadorReal.passing : statVariada(equipo.passing);
    const technique = tieneStatsReales ? jugadorReal.technique : statVariada(equipo.technique);
    const overall=Math.round((attack+defense+pace+passing+technique)/5);
    return {
      id:'s'+Date.now()+Math.floor(Math.random()*100000), name:jugadorReal.name, numero:jugadorReal.n, position, overall,
      attack, defense, pace, passing, technique,
      fatigue:100, racha:0, esSuplente:true,
      injured:false, injuryWeeks:0, injurySeverity:null,
      potencial: Math.max(overall, Math.min(99, overall+4+Math.floor(Math.random()*8))), // un fichaje estrella ya está más cerca de su techo real
      salario:calcularSalario(overall),
      esFichajeEstrella:true, equipoOrigenId:equipo.id, equipoOrigenName:equipo.name
    };
  }
  function posicionObjetivoOjeoActual(){
    return (state.posicionObjetivoOjeo && state.posicionObjetivoOjeo!=='any') ? state.posicionObjetivoOjeo : null;
  }
  // Abre un sobre concreto de la cola de pendientes (por id) — ya no se
  // abre "por nivel" desde una tarjeta, sino un sobre específico que ya
  // estaba esperando, avisado por correo.
  function abrirSobrePorId(sobreId){
    const idx=(state.sobresFichajesPendientes||[]).findIndex(s=>s.id===sobreId);
    if(idx===-1) return null;
    const sobre=state.sobresFichajesPendientes[idx];
    const costeBase=sobre.gratis ? 0 : (SOBRE_COSTES[sobre.nivel]||SOBRE_COSTES[1]);
    // Negociador Nato: pequeño descuento extra en cada sobre con coste
    // real, mientras la habilidad esté activa — igual que el resto de
    // habilidades del juego (bonus continuo, no de un solo uso).
    const descuentoNegociador = (costeBase>0 && typeof lmSkillActiva==='function' && lmSkillActiva('lm_negociador_nato')) ? 0.08 : 0;
    const coste=Math.round(costeBase*(1-lmDescuentoSobres()-descuentoNegociador));
    if((state.capital||0)<coste) return null;
    if(coste>0){
      state.capital-=coste;
      registrarMovimientoFinanciero('Sobre de fichajes (nivel '+sobre.nivel+')', -coste, state.jornadaActual);
    }
    state.sobresFichajesPendientes.splice(idx,1);
    if(typeof window.unlockLMAchievement==='function') window.unlockLMAchievement('lm_first_sobre');
    const posObjetivo=posicionObjetivoOjeoActual();
    // Probabilidad de fichaje estrella: nula a nivel 0-1, y creciente a
    // partir de nivel 2 de la Red de Ojeadores — como se pidió.
    const nivelRed=nivelDeDD('sobresFichajes');
    const probEstrellaBase = nivelRed>=3 ? 0.35 : (nivelRed===2 ? 0.18 : 0);
    // Ojeador Estrella: pequeño extra de probabilidad, pero solo tiene
    // efecto si la Red de Ojeadores ya está en nivel 2 o más — a nivel
    // 0-1 sigue siendo imposible, tal y como se diseñó esa mejora.
    const bonusOjeadorEstrella = (nivelRed>=2 && lmSkillActiva('lm_ojeador_estrella')) ? 0.05 : 0;
    const probEstrella = probEstrellaBase+bonusOjeadorEstrella;
    let huboEstrella=false;
    const jugadores=[1,2,3].map(()=>{
      if(!huboEstrella && Math.random()<probEstrella){
        const estrella=generarJugadorFichajeEstrella(posObjetivo);
        if(estrella){ huboEstrella=true; return estrella; }
      }
      return generarJugadorSobre(sobre.nivel, posObjetivo);
    });
    if(state.directorDeportivoBonos && state.directorDeportivoBonos.bonusCalidadSobre){ state.directorDeportivoBonos.bonusCalidadSobre=false; }
    guardarEstado();
    return jugadores;
  }
  // Busca el primer dorsal libre (1-99) en tu plantilla actual — si el
  // jugador ya trae un número real (p.ej. un fichaje estrella) y ese
  // número está libre, se respeta; si ya lo tiene otro, se le asigna el
  // siguiente disponible.
  function asignarNumeroDisponible(numeroPreferido){
    const usados=new Set((state.plantilla||[]).map(p=>p.numero).filter(n=>n!=null));
    if(numeroPreferido && !usados.has(numeroPreferido)) return numeroPreferido;
    for(let n=1;n<=99;n++){ if(!usados.has(n)) return n; }
    return null;
  }
  function ficharJugadorSobre(jugador){
    const numero=asignarNumeroDisponible(jugador.numero);
    state.plantilla.push({...jugador, numero, esSuplente:true});
    if(jugador.esFichajeEstrella && jugador.equipoOrigenId){
      if(!state.jugadoresRealesFichados) state.jugadoresRealesFichados=[];
      state.jugadoresRealesFichados.push({equipoId:jugador.equipoOrigenId, nombre:jugador.name});
      if(typeof window.unlockLMAchievement==='function') window.unlockLMAchievement('lm_star_signing');
    }
    if(!state.directorDeportivoHistorial) state.directorDeportivoHistorial=[];
    state.directorDeportivoHistorial.unshift({tipo:'fichaje', nombre:jugador.name, position:jugador.position, overall:jugador.overall, estrella:!!jugador.esFichajeEstrella, procedencia:jugador.equipoOrigenName||null, jornada:state.jornadaActual});
    if(typeof window.unlockLMAchievement==='function' && state.directorDeportivoHistorial.filter(h=>h.tipo==='fichaje').length>=5) window.unlockLMAchievement('lm_5_signings', false);
    if(typeof window.unlockLMAchievement==='function' && jugador.potencial && (jugador.potencial-jugador.overall)>=15) window.unlockLMAchievement('lm_canterano_joya', false);
    guardarEstado();
  }
  // Poner en venta / ofertas de traspaso — blindado igual que antes para
  // no dejar nunca la plantilla sin gente para jugar: nunca por debajo
  // de 11 en total, y siempre al menos 11 SANOS disponibles.
  function puedeVenderJugador(jugadorId){
    const plantilla=state.plantilla||[];
    if(plantilla.length<=11) return {ok:false, motivo:'No puedes bajar de 11 jugadores en la plantilla'};
    const sanosSinEste=plantilla.filter(p=>p.id!==jugadorId && !p.injured).length;
    if(sanosSinEste<11) return {ok:false, motivo:'Necesitas al menos 11 jugadores sanos disponibles después de la venta'};
    return {ok:true};
  }
  // Poner un jugador en venta no da dinero al momento: el Director
  // Deportivo tantea el mercado y, en 1-3 jornadas, avisa por correo de
  // qué clubes se han interesado — se elige la oferta a aceptar (o
  // ninguna) desde el propio correo.
  function ponerJugadorEnVenta(jugadorId){
    const jugador=(state.plantilla||[]).find(p=>p.id===jugadorId);
    if(!jugador) return {ok:false, motivo:'Ese jugador ya no está en la plantilla'};
    if(jugador.enVenta) return {ok:false, motivo:'Ese jugador ya está en venta'};
    const chequeo=puedeVenderJugador(jugadorId);
    if(!chequeo.ok) return chequeo;
    jugador.enVenta=true;
    jugador.ventaResolverJornada=state.jornadaActual+1+Math.floor(Math.random()*3);
    guardarEstado();
    return {ok:true};
  }
  function quitarJugadorDeVenta(jugadorId){
    const jugador=(state.plantilla||[]).find(p=>p.id===jugadorId);
    if(!jugador) return;
    jugador.enVenta=false;
    jugador.ventaResolverJornada=null;
    guardarEstado();
  }
  // Comprueba si ha llegado el plazo de algún jugador puesto en venta y,
  // si es así, genera las ofertas de 1-3 clubes rivales y manda el
  // correo del Director Deportivo con los botones para elegir.
  function procesarOfertasTraspaso(){
    if(!state.trabajadores || !state.trabajadores.directorDeportivo) return;
    if(state.correoUltimoEnviado && state.correoUltimoEnviado.directorDeportivo===state.jornadaActual) return;
    const jugador=(state.plantilla||[]).find(p=>p.enVenta && p.ventaResolverJornada<=state.jornadaActual);
    if(!jugador) return;
    const numOfertas=1+Math.floor(Math.random()*3);
    const clubesDisponibles=[...LM_RIVALS];
    if(typeof shuffle==='function') shuffle(clubesDisponibles); // shuffle() muta en el sitio, no devuelve nada
    const ofertas=clubesDisponibles.slice(0,numOfertas).map(c=>({
      club:c.name, monto:Math.round(jugador.overall*(280+Math.random()*220))
    })).sort((a,b)=>b.monto-a.monto);
    jugador.enVenta=false;
    jugador.ventaResolverJornada=null;
    const cuerpo = ofertas.length
      ? `Hemos tanteado el mercado con ${jugador.name} y han llegado ${ofertas.length} oferta${ofertas.length===1?'':'s'}. Elige cuál aceptar — si ninguna te convence, se queda en la plantilla.`
      : `No ha llegado ninguna oferta seria por ${jugador.name}. De momento sigue en la plantilla.`;
    if(!state.correoInterno) state.correoInterno=[];
    if(!state.correoUltimoEnviado) state.correoUltimoEnviado={};
    state.correoInterno.unshift({
      id:'mail'+Date.now()+Math.floor(Math.random()*100000), rol:'directorDeportivo',
      asunto: ofertas.length?`Ofertas por ${jugador.name}`:`Sin ofertas por ${jugador.name}`,
      cuerpo, jornada:state.jornadaActual, leido:false,
      tipoEspecial:'oferta_jugador', jugadorId:jugador.id, jugadorNombre:jugador.name, ofertas, resuelto:false
    });
    if(state.correoInterno.length>40) state.correoInterno=state.correoInterno.slice(0,40);
    state.correoUltimoEnviado.directorDeportivo=state.jornadaActual;
    guardarEstado();
  }
  function aceptarOfertaTraspaso(mailId, ofertaIdx){
    const mail=(state.correoInterno||[]).find(m=>m.id===mailId);
    if(!mail || mail.resuelto) return {ok:false};
    const jugador=(state.plantilla||[]).find(p=>p.id===mail.jugadorId);
    if(!jugador) return {ok:false, motivo:'Ese jugador ya no está en la plantilla'};
    const chequeo=puedeVenderJugador(jugador.id);
    if(!chequeo.ok) return chequeo;
    const oferta=mail.ofertas[ofertaIdx];
    if(!oferta) return {ok:false};
    state.plantilla=state.plantilla.filter(p=>p.id!==jugador.id);
    if(state.alineacion){ Object.keys(state.alineacion).forEach(k=>{ if(state.alineacion[k]===jugador.id) delete state.alineacion[k]; }); }
    state.capital=(state.capital||0)+oferta.monto;
    registrarMovimientoFinanciero('Traspaso de '+jugador.name+' a '+oferta.club, oferta.monto, state.jornadaActual);
    if(!state.directorDeportivoHistorial) state.directorDeportivoHistorial=[];
    state.directorDeportivoHistorial.unshift({tipo:'venta', nombre:jugador.name, position:jugador.position, overall:jugador.overall, destino:oferta.club, monto:oferta.monto, jornada:state.jornadaActual});
    if(typeof window.unlockLMAchievement==='function') window.unlockLMAchievement('lm_first_sale');
    mail.resuelto=true;
    mail.resultadoTexto=`Aceptaste la oferta de ${oferta.club} por ${formatoDinero(oferta.monto)}.`;
    guardarEstado();
    return {ok:true, oferta};
  }
  function rechazarOfertasTraspaso(mailId){
    const mail=(state.correoInterno||[]).find(m=>m.id===mailId);
    if(!mail || mail.resuelto) return;
    mail.resuelto=true;
    mail.resultadoTexto='Rechazaste todas las ofertas — el jugador sigue en la plantilla.';
    guardarEstado();
  }
  function aplicarEfectoDirectaDD(def){
    switch(def.id){
      case 'ojeo_urgente': {
        const nivelSobre=Math.max(1, nivelDeDD('sobresFichajes'));
        const jugadores=[1,2,3].map(()=>generarJugadorSobre(nivelSobre, posicionObjetivoOjeoActual()));
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
      case 'informe_ojeo':
        state.directorDeportivoBonos=state.directorDeportivoBonos||{};
        state.directorDeportivoBonos.bonusCalidadSobre=true;
        return {texto:'El próximo sobre que abras traerá jugadores de mejor calidad'};
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
      sobreAutomatico=[1,2,3].map(()=>generarJugadorSobre(3, posicionObjetivoOjeoActual()));
    }
    return {nivelNuevo, maxAlcanzado, sobreAutomatico};
  }
  function resolverCartaDD(idx, tiradas){
    const instancia=state.directorDeportivoCartas[idx];
    const def=cartaDefDD(instancia.cartaId);
    if(!def) return {tipo:'error', texto:'No se encontró la carta — prueba a cambiarla.'};
    const suma=tiradas.reduce((a,b)=>a+b,0);
    let resultado;
    if(def.tipo==='directa'){
      const dificultadEfectiva=Math.max(3, def.dificultad - bonusEstrellasTrabajador('directorDeportivo'));
      const exito=suma>=dificultadEfectiva;
      if(exito){
        const efecto=aplicarEfectoDirectaDD(def);
        state.directorDeportivoCartas[idx]=generarCartaAleatoriaDD(state.directorDeportivoCartas.map(c=>c.cartaId)) || instancia;
        resultado={tipo:'directa', exito:true, suma, dificultad:dificultadEfectiva, texto:efecto.texto, sobreAbierto:efecto.sobreAbierto||null};
      } else {
        resultado={tipo:'directa', exito:false, suma, dificultad:dificultadEfectiva, texto:'La carta se queda en tu mano — puedes reintentarlo más adelante'};
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

  /* ---------- 9g. CARTAS DEL PREPARADOR FÍSICO — mejora las estadísticas
     de los jugadores de formas originales: entrenamientos individuales
     que suben stats concretas de un jugador al azar de forma PERMANENTE,
     más 4 programas de nivel con bonus pasivo de equipo (resistencia,
     recuperación, técnica y ritmo). Mismo sistema de 10 cartas que el
     resto de departamentos. ---------- */
  const PREPARADOR_FISICO_CARTAS_BASE=[
    {id:'entrenamiento_tecnico', tipo:'directa', nombre:'Entrenamiento Técnico',   icon:'ph-target',        dificultad:6, desc:'+3 de TÉCNICA permanente a un jugador al azar de la plantilla'},
    {id:'entrenamiento_fisico',  tipo:'directa', nombre:'Entrenamiento Físico',    icon:'ph-person-simple-run', dificultad:6, desc:'+3 de RITMO permanente a un jugador al azar de la plantilla'},
    {id:'entrenamiento_tactico', tipo:'directa', nombre:'Entrenamiento de Pase',   icon:'ph-arrows-split',  dificultad:7, desc:'+3 de PASE permanente a un jugador al azar de la plantilla'},
    {id:'pretemporada_intensiva',tipo:'directa', nombre:'Pretemporada Intensiva', icon:'ph-barbell',       dificultad:9, desc:'+2 a TODAS las estadísticas de un jugador al azar, de forma permanente'},
    {id:'recuperacion_expres',   tipo:'directa', nombre:'Recuperación Exprés',    icon:'ph-battery-charging', dificultad:5, desc:'Restaura al instante la resistencia de toda la plantilla'},
    {id:'charla_motivacional',   tipo:'directa', nombre:'Charla Motivacional',    icon:'ph-megaphone-simple', dificultad:5, desc:'Pequeño impulso a la moral del equipo'},
    {id:'sesion_doble',          tipo:'directa', nombre:'Sesión Doble',           icon:'ph-calendar-plus',    dificultad:7, desc:'Añade un día de entrenamiento extra a esta semana en el calendario, sin coste de fatiga'},
    {id:'resistencia_base',      tipo:'nivel', track:'resistenciaBase',    nombre:'Programa de Resistencia',   icon:'ph-heartbeat',         dificultadBase:8, dificultadPaso:4, desc:'Reduce la resistencia que se pierde al jugar cada partido'},
    {id:'recuperacion_semanal',  tipo:'nivel', track:'recuperacionSemanal',nombre:'Recuperación Semanal',      icon:'ph-clock-clockwise',   dificultadBase:8, dificultadPaso:4, desc:'Los días de descanso del calendario recuperan más resistencia'},
    {id:'potencial_tecnico',     tipo:'nivel', track:'potencialTecnico',   nombre:'Potencial Técnico',         icon:'ph-soccer-ball',       dificultadBase:8, dificultadPaso:4, desc:'Sube la TÉCNICA de todo el equipo de forma permanente'},
    {id:'potencial_fisico',      tipo:'nivel', track:'potencialFisico',    nombre:'Potencial Físico',          icon:'ph-lightning',         dificultadBase:8, dificultadPaso:4, desc:'Sube el RITMO de todo el equipo de forma permanente'},
    {id:'planificacion_semanal', tipo:'nivel', track:'planificacionSemanal',nombre:'Planificación Semanal',    icon:'ph-calendar-check',    dificultadBase:9, dificultadPaso:4, desc:'Cada día de entrenamiento marcado en el calendario rinde más'}
  ];
  function cartaDefPF(id){ return PREPARADOR_FISICO_CARTAS_BASE.find(c=>c.id===id); }
  function nivelDePF(track){ return (state.preparadorFisicoNiveles && state.preparadorFisicoNiveles[track]) || 0; }
  function dificultadActualNivelPF(def){ return Math.max(3, def.dificultadBase + nivelDePF(def.track)*def.dificultadPaso - bonusEstrellasTrabajador('preparadorFisico')); }
  function generarCartaAleatoriaPF(excluirIds){
    excluirIds=excluirIds||[];
    const agotadas=state.preparadorFisicoCartasAgotadas||[];
    const disponibles=PREPARADOR_FISICO_CARTAS_BASE.filter(c=>!excluirIds.includes(c.id) && !agotadas.includes(c.id));
    const pool=disponibles.length?disponibles:PREPARADOR_FISICO_CARTAS_BASE.filter(c=>!agotadas.includes(c.id));
    if(!pool.length) return null;
    const def=pool[Math.floor(Math.random()*pool.length)];
    return {cartaId:def.id, progreso:0, nivelActual:1};
  }
  function inicializarCartasPF(){
    const cartas=[];
    for(let i=0;i<3;i++){ const nueva=generarCartaAleatoriaPF(cartas.map(c=>c.cartaId)); if(nueva) cartas.push(nueva); }
    return cartas;
  }
  function cambiarCartaPF(idx){
    if((state.preparadorFisicoCambiosUsados||0)>=lmCambiosCartaPorPartido()) return false;
    const otras=state.preparadorFisicoCartas.filter((c,i)=>i!==idx).map(c=>c.cartaId);
    const nueva=generarCartaAleatoriaPF(otras);
    if(!nueva) return false;
    state.preparadorFisicoCartas[idx]=nueva;
    state.preparadorFisicoCambiosUsados=(state.preparadorFisicoCambiosUsados||0)+1;
    guardarEstado();
    return true;
  }
  // Entrena a un jugador al azar (no lesionado) subiéndole una estadística
  // de forma permanente — la "manera original" de mejorar jugadores que
  // se pidió, en vez de solo bonus de equipo.
  function entrenarJugadorAleatorio(campos, cantidad){
    const elegibles=(state.plantilla||[]).filter(p=>!p.injured);
    if(!elegibles.length) return null;
    const jugador=elegibles[Math.floor(Math.random()*elegibles.length)];
    campos.forEach(campo=>{ jugador[campo]=Math.min(99, Math.round(jugador[campo]+cantidad)); });
    if(!state.preparadorFisicoHistorial) state.preparadorFisicoHistorial=[];
    const NOMBRE_STAT={
      get attack(){return t('lm.stat_attack');}, get defense(){return t('lm.stat_defense');},
      get pace(){return t('lm.stat_pace');}, get passing(){return t('lm.stat_passing');}, get technique(){return t('lm.stat_technique');}
    };
    const detalle=campos.map(c=>NOMBRE_STAT[c]||c).join(', ');
    state.preparadorFisicoHistorial.unshift({id:'ent'+Date.now()+Math.floor(Math.random()*10000), jugador:jugador.name, detalle, cantidad, jornada:state.jornadaActual});
    if(state.preparadorFisicoHistorial.length>30) state.preparadorFisicoHistorial=state.preparadorFisicoHistorial.slice(0,30);
    return jugador;
  }
  function aplicarEfectoDirectaPF(def){
    switch(def.id){
      case 'entrenamiento_tecnico': {
        const j=entrenarJugadorAleatorio(['technique'],3);
        return j?{texto:`${j.name} mejora su técnica permanentemente (ahora ${j.technique})`}:{texto:'No hay jugadores disponibles para entrenar'};
      }
      case 'entrenamiento_fisico': {
        const j=entrenarJugadorAleatorio(['pace'],3);
        return j?{texto:`${j.name} mejora su ritmo permanentemente (ahora ${j.pace})`}:{texto:'No hay jugadores disponibles para entrenar'};
      }
      case 'entrenamiento_tactico': {
        const j=entrenarJugadorAleatorio(['passing'],3);
        return j?{texto:`${j.name} mejora su pase permanentemente (ahora ${j.passing})`}:{texto:'No hay jugadores disponibles para entrenar'};
      }
      case 'pretemporada_intensiva': {
        const j=entrenarJugadorAleatorio(['attack','defense','pace','passing','technique'],2);
        return j?{texto:`${j.name} completa una pretemporada excelente — mejora en todas sus estadísticas`}:{texto:'No hay jugadores disponibles para entrenar'};
      }
      case 'recuperacion_expres':
        (state.plantilla||[]).forEach(p=>{ p.fatigue=100; });
        return {texto:'Toda la plantilla recupera su resistencia al máximo'};
      case 'charla_motivacional':
        state.moral=Math.max(-50,Math.min(50,(state.moral||0)+4));
        return {texto:'El vestuario responde bien a la charla — sube la moral'};
      case 'sesion_doble': {
        const v=ventanaEntrenoActual();
        if(!v) return {texto:'Todavía no hay una semana de calendario que preparar'};
        if(!state.calendarioEntrenamiento) state.calendarioEntrenamiento={};
        const cur=new Date(v.desde); cur.setDate(cur.getDate()+1);
        let marcado=false;
        while(cur.getTime()<v.hasta.getTime()){
          const iso=fechaISO(cur);
          if(!state.calendarioEntrenamiento[iso]){ state.calendarioEntrenamiento[iso]=true; marcado=true; break; }
          cur.setDate(cur.getDate()+1);
        }
        return marcado ? {texto:'Se añade un día de entrenamiento extra a esta semana, sin coste de fatiga'} : {texto:'Esta semana ya está entrenada al completo'};
      }
      default: return {texto:'Aplicado'};
    }
  }
  function aplicarNivelMejoraPF(def){
    if(!state.preparadorFisicoNiveles) state.preparadorFisicoNiveles={resistenciaBase:0, recuperacionSemanal:0, potencialTecnico:0, potencialFisico:0, planificacionSemanal:0};
    const nivelNuevo=Math.min(NIVEL_MAXIMO_EQUIPO, nivelDePF(def.track)+1);
    state.preparadorFisicoNiveles[def.track]=nivelNuevo;
    const maxAlcanzado=nivelNuevo>=NIVEL_MAXIMO_EQUIPO;
    if(maxAlcanzado){
      state.preparadorFisicoCartasAgotadas=state.preparadorFisicoCartasAgotadas||[];
      state.preparadorFisicoCartasAgotadas.push(def.id);
    }
    return {nivelNuevo, maxAlcanzado};
  }
  function resolverCartaPF(idx, tiradas){
    const instancia=state.preparadorFisicoCartas[idx];
    const def=cartaDefPF(instancia.cartaId);
    if(!def) return {tipo:'error', texto:'No se encontró la carta — prueba a cambiarla.'};
    const suma=tiradas.reduce((a,b)=>a+b,0);
    let resultado;
    if(def.tipo==='directa'){
      const dificultadEfectiva=Math.max(3, def.dificultad - bonusEstrellasTrabajador('preparadorFisico'));
      const exito=suma>=dificultadEfectiva;
      if(exito){
        const efecto=aplicarEfectoDirectaPF(def);
        state.preparadorFisicoCartas[idx]=generarCartaAleatoriaPF(state.preparadorFisicoCartas.map(c=>c.cartaId)) || instancia;
        resultado={tipo:'directa', exito:true, suma, dificultad:dificultadEfectiva, texto:efecto.texto};
      } else {
        resultado={tipo:'directa', exito:false, suma, dificultad:dificultadEfectiva, texto:'La carta se queda en tu mano — puedes reintentarlo más adelante'};
      }
    } else {
      const dificultadActual=dificultadActualNivelPF(def);
      const exito=suma>=dificultadActual;
      if(exito){
        const {nivelNuevo, maxAlcanzado}=aplicarNivelMejoraPF(def);
        state.preparadorFisicoCartas[idx]=generarCartaAleatoriaPF(state.preparadorFisicoCartas.map(c=>c.cartaId)) || instancia;
        resultado={tipo:'nivel', exito:true, suma, dificultad:dificultadActual, nivelNuevo, maxAlcanzado, nombre:def.nombre};
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
      setupData={liga:'es', moneda:null, nombre:'', escudo:null, modo:null, equipoElegidoId:null};
      document.body.classList.remove('liga-manager-screen');
      document.body.classList.add('menu-screen');
    }
    if(typeof window.showConfirmPopup==='function'){
      window.showConfirmPopup(t('lm.confirmar_abandonar_liga'), proceder, t('lm.abandonar_btn'));
    } else if(confirm(t('lm.confirmar_abandonar_liga'))){
      proceder();
    }
  }

  /* ---------- 11. Render: flujo de entrada (liga → moneda → nombre → escudo) ---------- */
  function renderSetup(){
    const root=document.getElementById('ligaManagerScreen');
    let inner='';

    if(setupStep===1){
      inner=`
        <div class="lm-setup-title">${t('lm.elige_liga')}</div>
        <div class="lm-setup-list">
          ${LIGAS_DISPONIBLES.map(l=>`
            <div class="lm-setup-option ${l.activa?'active selected':'disabled'}" data-liga="${l.id}">
              <img src="${l.flagImg}" alt="" style="width:22px;height:16px;object-fit:cover;border-radius:2px;vertical-align:middle;margin-right:10px">${l.nombre}
              ${!l.activa?`<span class="lm-setup-soon">${t('lm.proximamente')}</span>`:''}
            </div>`).join('')}
        </div>
        <div class="lm-popup-actions"><button id="lmSetupNext" class="mode-card-btn mode-card-btn-gold">${t('lm.siguiente')}</button></div>
      `;
    } else if(setupStep===2){
      inner=`
        <div class="lm-setup-title">${t('lm.elige_moneda')}</div>
        <div class="lm-setup-list lm-setup-list-row">
          ${Object.keys(MONEDAS).map(k=>`
            <div class="lm-setup-option lm-setup-option-currency ${setupData.moneda===k?'selected':''}" data-moneda="${k}">
              <span style="font-size:22px">${MONEDAS[k].symbol}</span><br>${MONEDAS[k].label}
            </div>`).join('')}
        </div>
        <div class="lm-popup-actions"><button id="lmSetupNext" class="mode-card-btn mode-card-btn-gold" ${setupData.moneda?'':'disabled'}>${t('lm.siguiente')}</button></div>
      `;
    } else if(setupStep===2.5){
      inner=`
        <div class="lm-setup-title">${t('lm.como_empezar')}</div>
        <div class="lm-setup-list">
          <div class="lm-setup-option ${setupData.modo==='propio'?'selected':''}" data-modo="propio">
            <i class="ph ph-bold ph-shield-plus" style="margin-right:10px;color:var(--gold)"></i>${t('lm.crear_equipo_propio')}
          </div>
          <div class="lm-setup-option ${setupData.modo==='existente'?'selected':''}" data-modo="existente">
            <i class="ph ph-bold ph-users-three" style="margin-right:10px;color:var(--gold)"></i>${t('lm.elegir_equipo_existente')}
          </div>
        </div>
        <p class="lm-setup-desc">${t('lm.como_empezar_desc')}</p>
        <div class="lm-popup-actions"><button id="lmSetupNext" class="mode-card-btn mode-card-btn-gold" ${setupData.modo?'':'disabled'}>${t('lm.siguiente')}</button></div>
      `;
    } else if(setupStep===2.6){
      inner=`
        <div class="lm-setup-title">${t('lm.elige_tu_equipo')}</div>
        <p class="lm-setup-desc">${t('lm.elige_tu_equipo_desc')}</p>
        <div class="lm-setup-list lm-setup-equipos-list">
          ${LM_RIVALS.map(r=>`
            <div class="lm-setup-option lm-setup-option-equipo ${setupData.equipoElegidoId===r.id?'selected':''}" data-equipo="${r.id}">
              ${rivalCrestHTML(28, r.crestImg)}<span>${r.name}</span>
            </div>`).join('')}
        </div>
        <div class="lm-popup-actions"><button id="lmSetupNext" class="mode-card-btn mode-card-btn-gold" ${setupData.equipoElegidoId?'':'disabled'}>${t('lm.empezar_temporada')}</button></div>
        <div class="lm-popup-actions" style="margin-top:8px"><button id="lmSetupAtras" class="mode-card-btn mode-card-btn-secondary">${t('lm.atras')}</button></div>
      `;
    } else if(setupStep===3.5){
      inner=`
        <div class="lm-setup-title">${t('lm.club_ya_creado')}</div>
        <p class="lm-setup-desc">${t('lm.club_ya_creado_desc')}</p>
        <div class="lm-crest-preview">${crestHTML(setupData.escudo, 64)}</div>
        <div class="lm-setup-title" style="font-size:16px;margin:6px 0 22px">${setupData.nombre}</div>
        <div class="lm-popup-actions">
          <button id="lmSetupConfirm" class="mode-card-btn mode-card-btn-gold">${t('lm.empezar_temporada')}</button>
          <button id="lmSetupCambiar" class="mode-card-btn mode-card-btn-secondary">${t('lm.cambiar_nombre_escudo')}</button>
        </div>
      `;
    } else if(setupStep===3){
      inner=`
        <div class="lm-setup-title">${t('lm.nombre_de_tu_equipo')}</div>
        <p class="lm-setup-desc">${t('lm.nombre_de_tu_equipo_desc')}</p>
        <input id="lmSetupNombre" type="text" maxlength="24" placeholder="${t('lm.nombre_placeholder')}" class="lm-setup-input" value="${setupData.nombre||''}">
        <div class="lm-popup-actions"><button id="lmSetupNext" class="mode-card-btn mode-card-btn-gold" ${setupData.nombre&&setupData.nombre.trim()?'':'disabled'}>${t('lm.siguiente')}</button></div>
      `;
    } else if(setupStep===4){
      inner=`
        <div class="lm-setup-title">${t('lm.crea_tu_escudo')}</div>
        <p class="lm-setup-desc">${t('lm.crea_tu_escudo_desc')}</p>
        <div class="lm-crest-preview">${crestHTML(setupData.escudo, 64)}</div>
        <div class="lm-popup-actions"><button id="lmAbrirEditorBtn" class="mode-card-btn mode-card-btn-gold">${t('lm.abrir_editor_escudos')}</button></div>
        <div class="lm-popup-actions">
          <button id="lmSetupConfirm" class="mode-card-btn mode-card-btn-gold" ${setupData.escudo?'':'disabled'}>${t('lm.empezar_temporada')}</button>
        </div>
      `;
    }

    root.innerHTML = `
      <div class="lm-wrap">
        <div class="lm-setup-card">
          <div class="lm-setup-header">${t('lm.setup_header')}</div>
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
        setupStep=2.5;
        renderSetup();
      });
    } else if(setupStep===2.5){
      root.querySelectorAll('[data-modo]').forEach(el=>{
        el.addEventListener('click', ()=>{
          setupData.modo=el.getAttribute('data-modo');
          if(typeof window.playSound==='function') window.playSound('select');
          renderSetup();
        });
      });
      const next=document.getElementById('lmSetupNext');
      if(next) next.addEventListener('click', ()=>{
        if(!setupData.modo) return;
        if(typeof window.playSound==='function') window.playSound('select');
        if(setupData.modo==='existente'){
          setupStep=2.6;
          renderSetup();
          return;
        }
        // Crear equipo propio — mismo flujo de siempre (identidad
        // guardada, o nombre + escudo desde cero).
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
    } else if(setupStep===2.6){
      root.querySelectorAll('[data-equipo]').forEach(el=>{
        el.addEventListener('click', ()=>{
          setupData.equipoElegidoId=el.getAttribute('data-equipo');
          if(typeof window.playSound==='function') window.playSound('select');
          // FIX real del salto de scroll: en vez de volver a construir
          // todo el HTML de la pantalla (innerHTML=...), que siempre
          // reinicia el scroll al recrear el contenido, se cambia la
          // clase "selected" directamente sobre los elementos que ya
          // existen en el DOM — cero repintado, cero salto posible.
          root.querySelectorAll('[data-equipo].selected').forEach(s=>s.classList.remove('selected'));
          el.classList.add('selected');
          const nextBtn=document.getElementById('lmSetupNext');
          if(nextBtn) nextBtn.disabled=false;
        });
      });
      const next=document.getElementById('lmSetupNext');
      if(next) next.addEventListener('click', ()=>{
        if(!setupData.equipoElegidoId) return;
        if(typeof window.playSound==='function') window.playSound('select');
        const equipo=LM_RIVALS.find(r=>r.id===setupData.equipoElegidoId);
        if(!equipo) return;
        const escudo={type:'image', data:equipo.crestImg};
        empezarTemporada(equipo.name, setupData.moneda, setupData.liga, escudo, equipo.id);
        render();
      });
      const atras=document.getElementById('lmSetupAtras');
      if(atras) atras.addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        setupStep=2.5;
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
  function renderInner(){
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
    if(!state.correoInterno) state.correoInterno=[];
    if(!state.correoUltimoEnviado) state.correoUltimoEnviado={};
    if(!state.posicionObjetivoOjeo) state.posicionObjetivoOjeo='any';
    if(!state.ordenColumnas || state.ordenColumnas.length!==4) state.ordenColumnas=['left','center','right','staff'];
    if(!state.preparadorFisicoCartas || !state.preparadorFisicoCartas.length) state.preparadorFisicoCartas=inicializarCartasPF();
    if(!state.preparadorFisicoCartasAgotadas) state.preparadorFisicoCartasAgotadas=[];
    if(!state.preparadorFisicoHistorial) state.preparadorFisicoHistorial=[];
    if(!state.preparadorFisicoNiveles) state.preparadorFisicoNiveles={resistenciaBase:0, recuperacionSemanal:0, potencialTecnico:0, potencialFisico:0, planificacionSemanal:0};
    if(state.trabajadores && state.trabajadores.preparadorFisico===undefined) state.trabajadores.preparadorFisico=null;
    if(!state.fechaInicioLiga) state.fechaInicioLiga=fechaISO(inicioTemporadaRealista());
    if(!state.calendarioEntrenamiento) state.calendarioEntrenamiento={};
    if(!state.pfPlanEntrenamiento) state.pfPlanEntrenamiento=[];
    // Migración desde el formato antiguo (solo lista de ids, sin
    // estadística elegida) — se les asigna un enfoque sugerido según su
    // posición para no perder la selección.
    state.pfPlanEntrenamiento=state.pfPlanEntrenamiento.map(entry=>{
      if(typeof entry==='string'){
        const p=state.plantilla.find(x=>x.id===entry);
        return {jugadorId:entry, stat:statSugeridaPorPosicion(p?p.position:'')};
      }
      return entry;
    }).filter(e=>e && e.jugadorId);
    if(!state.mantenimientoCartas || !state.mantenimientoCartas.length) state.mantenimientoCartas=inicializarCartasMantenimiento();
    if(!state.mantenimientoCartasAgotadas) state.mantenimientoCartasAgotadas=[];
    if(!state.mantenimientoHistorial) state.mantenimientoHistorial=[];
    if(!state.mantenimientoNiveles) state.mantenimientoNiveles={prevencionDesgaste:0, recuperacionCesped:0, boostSatisfaccion:0, proteccionSatisfaccion:0};
    if(!state.mantenimientoBonos) state.mantenimientoBonos={};
    if(state.dadoRerollsDisponibles===undefined) state.dadoRerollsDisponibles=1;

    // Botones de simulación instantánea de temporada — SOLO visibles para
    // la cuenta de desarrollo (jesuslor85@gmail.com), nunca para el resto
    // de usuarios. Llevan la liga hasta la última jornada (38) dejándola
    // sin jugar, con todas las jornadas anteriores resueltas al azar y el
    // resultado de MI equipo forzado a victoria (verde) o derrota (roja).
    const esCuentaDevCheat = !!(window._fbAuth && window._fbAuth.currentUser && window._fbAuth.currentUser.email==='jesuslor85@gmail.com');
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
    const notifDD = (state.sobresFichajesPendientes||[]).length>0;
    const hayVacantes = ROLES_TRABAJO.some(r=>!state.trabajadores[r]);
    const monedaInfo=MONEDAS[state.moneda]||MONEDAS.EUR;

    function fatigueColor(f){ if(f>=75) return 'green'; if(f>=40) return 'yellow'; return 'red'; }
    function fatigueBarHTML(p){
      const f=(p.fatigue===undefined)?100:p.fatigue;
      return `<div class="fatigue-bar-wrap" title="Resistencia: ${f}%"><div class="fatigue-bar fatigue-${fatigueColor(f)}" style="width:${f}%"></div></div>`;
    }
    function filaJugador(p){
      const cross=p.injured?` <span class="cross" title="${t('lm.tt_lesionado')}">✚</span>`:'';
      const racha=p.racha>=2?` <span title="${t('lm.tt_racha_gol')}">🔥${p.racha}</span>`:'';
      const star=titularIds.has(p.id)?`<span class="star" title="${t('lm.tt_titular')}">★</span>`:'';
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
        <td class="lm-td-numero">${p.numero||'-'}</td>
        <td>${p.name}${rasgosIconosHTML(p)}${cross}${racha}</td>
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
      if(lmSortMode==='numero') return [...lista].sort((a,b)=>(a.numero||99)-(b.numero||99));
      return lista; // 'arrival' = orden de llegada = orden del array tal cual
    }
    const plantillaPrincipal=ordenarPlantilla(state.plantilla.filter(p=>titularIds.has(p.id)));
    const banquillo=state.plantilla.filter(p=>!titularIds.has(p.id));
    const filasPlantilla=plantillaPrincipal.map(filaJugador).join('');
    const filasBanquillo=banquillo.map(filaJugador).join('');

    // El scroll de cada columna es independiente y se pierde cada vez que
    // se reconstruye el HTML entero — se guarda aquí y se restaura al
    // final, para que marcar un día del calendario (o cualquier otra
    // acción) no salte la columna arriba de golpe.
    const scrollGuardado={};
    root.querySelectorAll('.lm-panel, .lm-center-panel').forEach(el=>{
      const clave=el.className;
      const scrollReal=el.querySelector(':scope > .lm-col-scroll-inner')||el;
      if(clave) scrollGuardado[clave]=scrollReal.scrollTop;
    });

    root.innerHTML = `
      <div class="lm-app-grid ${acabaDeReordenarColumnas?'lm-col-reordering':''}">
        <div id="lmPanelEquipo" class="lm-panel lm-left-panel" style="${columnaOrderStyle('left')}">${columnaControlesHTML('left')}<div class="lm-scroll-hint" data-scroll-hint title="${t('lm.tt_mas_contenido')}"><i class="ph ph-bold ph-caret-down"></i></div>
          <div class="lm-header-team">
            ${crestHTML(state.escudo, 76)}
            <div style="flex:1;min-width:0">
              <div class="lm-title">${state.nombreEquipo.toUpperCase()}</div>
              <div class="lm-sub">Jornada ${Math.min(state.jornadaActual,38)} de 38${temporadaLabel()?` <span class="lm-sub-punto">·</span> <span class="lm-sub-temporada">${temporadaLabel()}</span>`:''}</div>
            </div>
            <div class="lm-modo-visual-toggle">
              <button type="button" class="lm-modo-visual-btn ${(!state.modoVisualPartido||state.modoVisualPartido==='auto')?'lm-modo-visual-activo':''}" data-modo-visual="auto"><i class="ph ph-bold ph-fast-forward"></i>${t('lm.modo_automatico')}</button>
              <button type="button" class="lm-modo-visual-btn ${state.modoVisualPartido==='manager'?'lm-modo-visual-activo':''}" data-modo-visual="manager"><i class="ph ph-bold ph-strategy"></i>${t('lm.modo_manager')}</button>
            </div>
            <button id="lmJugarBtn" class="lm-btn-jugar-icon" ${state.jornadaActual>38?'disabled':''} title="${state.jornadaActual>38?t('lm.tt_temporada_completa'):(hayVacantes?t('lm.tt_falta_cuerpo_tecnico'):t('lm.tt_jugar_jornada'))}">
              <i class="ph ph-bold ph-play-circle"></i>
              <span>${state.jornadaActual>38?t('lm.fin_btn'):(state.semanaResueltaParaJornada===state.jornadaActual?t('lm.jugar_btn'):t('lm.seguir_btn'))}</span>
            </button>
            ${esCuentaDevCheat && state.jornadaActual<38 ? `
            <div class="lm-cheat-dev-wrap">
              <button id="lmCheatPerderBtn" type="button" class="lm-cheat-dev-btn lm-cheat-dev-btn-rojo" title="DEV: simular hasta la última jornada, todo perdido">
                <i class="ph ph-bold ph-skull"></i>
              </button>
              <button id="lmCheatGanarBtn" type="button" class="lm-cheat-dev-btn lm-cheat-dev-btn-verde" title="DEV: simular hasta la última jornada, todo ganado">
                <i class="ph ph-bold ph-trophy"></i>
              </button>
            </div>` : ''}
          </div>
          <div class="bench-title">
            <span><i class="ph ph-bold ph-t-shirt" style="color:var(--gold);margin-right:6px"></i>${t("lm.once_titular")}</span>
            <span style="display:flex;align-items:center;gap:8px">
              <button id="lmSortBtn" class="lm-sort-btn" title="${t('lm.tt_cambiar_orden')}" aria-label="Cambiar orden">
                <span id="lmSortLabel">${LM_SORT_LABELS[lmSortMode]}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M7 12h10M11 18h2"/></svg>
              </button>
              <span>${plantillaPrincipal.length}</span>
            </span>
          </div>
          <div>
            <table class="roster-table">
              <thead><tr><th>#</th><th>${t('lm.tabla_jugador')}</th><th>${t('lm.tabla_resist')}</th><th>Pos</th><th>${t('lm.stat_ata')}</th><th>${t('lm.stat_def')}</th><th>${t('lm.stat_rit')}</th><th>${t('lm.stat_pas')}</th><th>${t('lm.stat_tec')}</th><th>${t('lm.tabla_punt')}</th></tr></thead>
              <tbody>${filasPlantilla}</tbody>
            </table>
          </div>
          <div class="bench-title"><span><i class="ph ph-bold ph-chair" style="color:var(--gold);margin-right:6px"></i>${t("lm.banquillo")}</span><span>${banquillo.length}</span></div>
          <div>
            <table class="roster-table">
              <thead><tr><th>#</th><th>${t('lm.tabla_jugador')}</th><th>${t('lm.tabla_resist')}</th><th>Pos</th><th>${t('lm.stat_ata')}</th><th>${t('lm.stat_def')}</th><th>${t('lm.stat_rit')}</th><th>${t('lm.stat_pas')}</th><th>${t('lm.stat_tec')}</th><th>${t('lm.tabla_punt')}</th></tr></thead>
              <tbody>${filasBanquillo}</tbody>
            </table>
          </div>

          <div class="team-profile box" style="margin-top:14px">
            <h3 id="lmPerfilEquipoHeader" class="lm-perfil-header"><i class="ph ph-bold ph-chart-bar" style="color:var(--gold);margin-right:6px"></i>${t('lm.perfil_equipo')} <span class="lm-perfil-arrow ${perfilEquipoColapsado?'':'lm-perfil-arrow-open'}">▾</span></h3>
            <div class="lm-perfil-nota-grande">${statsEquipo.overall}</div>
            ${!perfilEquipoColapsado?`
            ${[['attack','ATAQUE'],['defense','DEFENSA'],['pace','RITMO'],['passing','PASE'],['technique','TÉCNICA']].map(([k,label])=>`
              <div class="stat-row"><span>${label}</span><span>${statsEquipo[k]}</span></div>
              <div class="stat-bar-row"><div class="stat-bar"><div style="width:${Math.max(0,Math.min(100,statsEquipo[k]))}%"></div></div></div>
            `).join('')}
            <p class="lm-setup-desc" style="text-align:left;margin-top:6px">Media de los ${state.plantilla.length} jugadores de la plantilla.</p>
            `:''}
          </div>
        </div>

        <div id="lmPanelCampo" class="lm-center-panel" style="${columnaOrderStyle('center')}">${columnaControlesHTML('center')}<div class="lm-scroll-hint" data-scroll-hint title="${t('lm.tt_mas_contenido')}"><i class="ph ph-bold ph-caret-down"></i></div>
          <div id="lmPitchBox"><button type="button" id="lmInfoClubBtn" class="lm-pitch-lupa-btn" title="${t('lm.info_club_tooltip')}"><i class="ph ph-bold ph-magnifying-glass"></i></button>${PITCH_SVG}<div id="lmCampoLayer" style="opacity:${campoOpacidadDesgaste(state.estadio?state.estadio.campo:100)}"></div><div id="lmWeatherLayer"></div>${formacionActual().slots.map(def=>{
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
              const statusIcons=lesionado?`<div class="pitch-status-row"><span class="pitch-status-icon pitch-status-injury" title="${t('lm.tt_lesionado')}">✚</span></div>`:'';
              inner=`${statusIcons}<span class="pos-rating">${efectivoOverall(jugador)}</span><div class="player-info"><div class="lm-player-name-row"><span class="lm-player-name-text">${jugador.name}${rasgosIconosHTML(jugador)}</span>${star}</div><div class="player-pos-label${inPos?'':' out-of-position'}">${label}</div></div>`;
            }
            const clases=['position', vacio?'empty-slot':'locked', lesionado?'lm-pos-injured':'', seleccionado?'highlight-pos':''].filter(Boolean).join(' ');
            return `<div class="${clases}" data-slot="${def.slot}" style="left:${def.x}%;top:${def.y}%" title="${jugador?jugador.name+' ('+efectivoOverall(jugador)+')':'Vacío'}">${inner}</div>`;
          }).join('')}</div>

          <div class="bench-title" style="margin-top:14px"><span><i class="ph ph-bold ph-strategy" style="color:var(--gold);margin-right:6px"></i>${t('lm.formacion')}</span><span>${state.formacionCode}</span></div>
          <div class="formation-tabs">
            ${Object.keys(FORMATIONS).map(cat=>`<div class="formation-tab ${(formacionCategoriaVista||state.formacionCategoria)===cat?'active':''}" data-categoria="${cat}">${CAT_NAMES[cat]}</div>`).join('')}
          </div>
          <div id="formationList">
            ${FORMATIONS[formacionCategoriaVista||state.formacionCategoria].map(f=>`
              <div class="formation-option ${state.formacionCode===f.code?'selected':''}" data-formacion-codigo="${f.code}">
                <span class="f-code">${f.code}</span>
                <span class="f-badge">${f.label}</span>
              </div>`).join('')}
          </div>
        </div>

        <div id="lmPanelRival" class="lm-panel lm-right-panel" style="${columnaOrderStyle('right')}">${columnaControlesHTML('right')}<div class="lm-scroll-hint" data-scroll-hint title="${t('lm.tt_mas_contenido')}"><i class="ph ph-bold ph-caret-down"></i></div>
          <div class="lm-nextmatch-box">
            ${rival ? `
              <div class="lm-rival-top-row">
                <div class="lm-rival-crest-block">
                  <div class="lm-rival-crest-img-wrap">
                    ${rivalCrestHTML(88, rival.crestImg)}
                    <button class="lm-rival-lupa-btn" id="lmVerOnceRivalBtn" title="${t('lm.tt_ver_once_banquillo')}"><i class="ph ph-bold ph-magnifying-glass"></i></button>
                  </div>
                  <span class="lm-title" style="font-size:15px">${rival.name}</span>
                  <div class="lm-perfil-nota-grande">${Math.round((rival.attack+rival.defense+rival.pace+rival.passing+rival.technique)/5)}</div>
                </div>
                <div class="lm-rival-info-col">
                  <h3 class="lm-nextrival-header" style="text-align:left;margin:0 0 4px"><i class="ph ph-bold ph-flag" style="color:var(--gold);margin-right:6px"></i>${t("lm.proximo_rival")}</h3>
                  <div class="lm-vs-label" style="text-align:left;margin-bottom:6px;display:flex;align-items:center;justify-content:space-between;gap:8px">
                    <span>${esLocal?t('lm.juegas_en_casa'):t('lm.juegas_fuera')}</span>
                    ${(()=>{ const climaPartido=(typeof climaDelPartido==='function')?climaDelPartido():null; return climaPartido ? `<span style="font-size:13px;font-weight:600;color:#ccc;white-space:nowrap">${climaPartido.label}</span>` : ''; })()}
                  </div>
                  ${(()=>{
                    const fila=calcularClasificacion();
                    const idx=fila.findIndex(t=>t.id===rival.id);
                    const datos=fila[idx]||{pj:0,pg:0,pe:0,pp:0,pts:0,gf:0,gc:0};
                    const dg=datos.gf-datos.gc;
                    return `<table class="lm-rival-mini-table">
                      <tr><td>${t('lm.tabla_posicion')}</td><td><strong>${idx+1}º</strong></td></tr>
                      <tr><td>${t('lm.tabla_puntos')}</td><td><strong>${datos.pts}</strong></td></tr>
                      <tr><td>${t('lm.tabla_pj_jugados')}</td><td>${datos.pj}</td></tr>
                      <tr><td>${t('lm.tabla_g_ganados')}</td><td>${datos.pg}</td></tr>
                      <tr><td>${t('lm.tabla_e_empatados')}</td><td>${datos.pe}</td></tr>
                      <tr><td>${t('lm.tabla_p_perdidos')}</td><td>${datos.pp}</td></tr>
                      <tr><td>${t('lm.goles_fc')}</td><td>${datos.gf}:${datos.gc} <span style="color:${dg>=0?'#5dcaa5':'#e24b4a'}">(${dg>=0?'+':''}${dg})</span></td></tr>
                    </table>`;
                  })()}
                </div>
              </div>
              ${(()=>{
                const estilo=estiloDeJuegoRival(rival);
                return `<div class="lm-estilo-juego-box">
                  <div class="lm-estilo-juego-titulo"><i class="ph ph-bold ph-strategy"></i> ${t('lm.estilo_de_juego')}</div>
                  <div class="lm-estilo-juego-texto">${estilo.base}</div>
                </div>`;
              })()}
              ${(()=>{
                const campoRival=campoRivalEstimado(rival);
                return `<div style="margin-top:6px">
                  <div class="lm-estadio-bar-label" style="font-size:10px"><i class="ph ph-bold ph-plant" style="font-size:12px"></i><span>${t('lm.estado_su_campo')}${esLocal?'':' '+t('lm.hoy_juegas_aqui')}</span><span>${campoRival}/100</span></div>
                  ${campoBarraHTML(campoRival, true)}
                </div>`;
              })()}
              <div class="lm-rival-profile">
                ${[[t('lm.stat_ataque_lbl'),'attack'],[t('lm.stat_defensa_lbl'),'defense'],[t('lm.stat_ritmo_lbl'),'pace'],[t('lm.stat_pase_lbl'),'passing'],[t('lm.stat_tecnica_lbl'),'technique']].map(([label,k])=>`
                  <div class="stat-row"><span>${label}</span><span>${rival[k]}</span></div>
                  <div class="stat-bar-row"><div class="stat-bar"><div style="width:${Math.max(0,Math.min(100,rival[k]))}%"></div></div></div>
                `).join('')}
              </div>` : `<div class="lm-vs-label" style="text-align:center">${t('lm.temporada_finalizada')}</div>`}
          </div>
          ${calendarioHTML()}
        </div>

        <div id="lmPanelTecnicos" class="lm-panel lm-staff-panel" style="${columnaOrderStyle('staff')}">${columnaControlesHTML('staff')}<div class="lm-scroll-hint" data-scroll-hint title="${t('lm.tt_mas_contenido')}"><i class="ph ph-bold ph-caret-down"></i></div>
          <div class="lm-staff-bar-header">
            <div class="lm-staff-bar-title"><i class="ph ph-bold ph-users-three"></i> ${t("lm.cuerpo_tecnico")}</div>
            <div class="lm-staff-bar-capital" title="${t('lm.tt_dados_rerolls')}">
              <span><i class="ph ph-bold ph-dice-five"></i> ${t('lm.dados')}: <strong>${state.diceAvailable}</strong></span>
              <span><i class="ph ph-bold ph-arrows-clockwise"></i> ${t('lm.rerrolls')}: <strong>${state.dadoRerollsDisponibles||0}</strong></span>
            </div>
          </div>
          ${hayVacantes?`<div class="lm-staff-warning"><i class="ph ph-bold ph-warning"></i> ${t('lm.falta_cuerpo_tecnico_msg')}</div>`:''}
          <button id="lmTrabajadoresBtn" class="lm-btn-trabajadores" style="width:100%;margin-bottom:10px"><i class="ph ph-bold ph-user-plus"></i> ${t('lm.contratar_btn')}</button>
          <div class="lm-staff-bar-row">
            ${staffTileHTML('directorGeneral', {btnId:'lmDirectorGeneralBtn', infoId:'lmDirectorGeneralInfoBtn', infoTitle:t('lm.info_dg'), notif:notifDG, badgeTexto:'!', carpeta:'director_general', archivo:'director_general', alt:'Director General', icono:'ph-briefcase', rolLabel:t('lm.rol_dg'), acento:'lm-staff-tile-dg', desc:t('lm.desc_dg')})}
            ${staffTileHTML('directorDeportivo', {btnId:'lmDirectorDeportivoBtn', infoId:'lmDirectorDeportivoInfoBtn', infoTitle:t('lm.info_dd'), notif:notifDD, badgeTexto:'!', carpeta:'director_deportivo', archivo:'director_deportivo', alt:'Director Deportivo', icono:'ph-binoculars', rolLabel:t('lm.rol_dd'), acento:'lm-staff-tile-dd', desc:t('lm.desc_dd')})}
            ${staffTileHTML('medico', {btnId:'lmMedicoBtn', infoId:'lmMedicoInfoBtn', infoTitle:t('lm.info_medico'), notif:notif, badgeTexto:'1', carpeta:'medico', archivo:'medico', alt:'Equipo médico', icono:'ph-first-aid-kit', rolLabel:t('lm.rol_medico'), desc:t('lm.desc_medico'), acento:'lm-staff-tile-medico'})}
            ${staffTileHTML('preparadorFisico', {btnId:'lmPreparadorFisicoBtn', infoId:'lmPreparadorFisicoInfoBtn', infoTitle:t('lm.info_pf'), notif:false, badgeTexto:'', carpeta:'preparador_fisico', archivo:'preparador_fisico', alt:'Preparador Físico', icono:'ph-barbell', rolLabel:t('lm.rol_pf'), desc:t('lm.desc_pf'), acento:'lm-staff-tile-pf'})}
            ${staffTileHTML('mantenimiento', {btnId:'lmMantenimientoBtn', infoId:'lmMantenimientoInfoBtn', infoTitle:t('lm.info_mant'), notif:notifMant, badgeTexto:'!', carpeta:'mantenimiento', archivo:'mantenimiento_y_seguridad', alt:'Mantenimiento y seguridad', icono:'ph-flag-pennant', rolLabel:t('lm.rol_mant'), desc:t('lm.desc_mant'), acento:'lm-staff-tile-mant'})}
          </div>
          ${(()=>{
            try{
              const lista=state.correoInterno||[];
              const sinLeer=lista.filter(c=>c && !c.leido).length;
              const filas=lista.length?lista.slice(0,10).map(c=>{
                if(!c || !c.id) return '';
                let cuerpoExtra='';
                if(correoExpandido===c.id){
                  let extra='';
                  if(c.tipoEspecial==='oferta_jugador' && !c.resuelto && Array.isArray(c.ofertas)){
                    extra=`<div class="lm-correo-ofertas">
                      ${c.ofertas.map((o,i)=>`<button class="lm-correo-oferta-btn" data-aceptar-oferta="${c.id}" data-oferta-idx="${i}">${o.club} — ${formatoDinero(o.monto)}</button>`).join('')}
                      ${c.ofertas.length?`<button class="lm-correo-oferta-rechazar" data-rechazar-oferta="${c.id}">${t('lm.rechazar_todas')}</button>`:''}
                    </div>`;
                  } else if(c.tipoEspecial==='oferta_jugador' && c.resuelto){
                    extra=`<div class="lm-correo-resultado">${c.resultadoTexto||''}</div>`;
                  } else if(c.tipoEspecial==='balance_mensual'){
                    extra=`<div class="lm-correo-ofertas"><button class="lm-correo-oferta-btn" data-ver-finanzas="1">${t('lm.ver_finanzas')}</button></div>`;
                  } else if(c.tipoEspecial==='sobre_listo' && !c.resuelto){
                    const sobrePendiente=(state.sobresFichajesPendientes||[]).find(s=>s.id===c.sobreId);
                    if(sobrePendiente){
                      const coste=sobrePendiente.gratis ? 0 : Math.round((SOBRE_COSTES[sobrePendiente.nivel]||SOBRE_COSTES[1])*(1-lmDescuentoSobres()));
                      extra=`<div class="lm-correo-ofertas">
                        <button class="lm-correo-oferta-btn lm-sobre-abrir-btn" data-abrir-sobre-correo="${c.id}" data-sobre-id="${sobrePendiente.id}" ${((state.capital||0)<coste)?'disabled':''}>
                          <i class="ph ph-bold ph-envelope-open"></i> ${t('lm.abrir_sobre')} ${sobrePendiente.gratis?`(${t('lm.gratis')})`:'('+formatoDinero(coste)+')'}
                        </button>
                      </div>`;
                    } else {
                      extra=`<div class="lm-correo-resultado">${t('lm.sobre_ya_abierto')}</div>`;
                    }
                  } else if(c.tipoEspecial==='sobre_listo' && c.resuelto){
                    extra=`<div class="lm-correo-resultado">${c.resultadoTexto||t('lm.sobre_ya_abierto')}</div>`;
                  } else if(c.tipoEspecial==='quiniela_lista'){
                    if(state.quinielaBoleto && !state.quinielaBoleto.rellenado){
                      extra=`<div class="lm-correo-ofertas"><button class="lm-correo-oferta-btn" data-abrir-quiniela="1"><i class="ph ph-bold ph-ticket"></i> ${t('lm.rellenar_quiniela')}</button></div>`;
                    } else {
                      extra=`<div class="lm-correo-resultado">${t('lm.quiniela_ya_rellenada')}</div>`;
                    }
                  } else if(c.tipoEspecial==='nuevos_candidatos'){
                    extra=`<div class="lm-correo-ofertas"><button class="lm-correo-oferta-btn" data-ir-contratar="1"><i class="ph ph-bold ph-user-plus"></i> ${t('lm.contratar_btn')}</button></div>`;
                  }
                  cuerpoExtra=`<div class="lm-correo-cuerpo">${correoCuerpoActual(c)||''}${extra}</div>`;
                }
                return `<div class="lm-correo-item ${c.leido?'':'lm-correo-no-leido'} ${correoExpandido===c.id?'lm-correo-expandido':''}" data-correo="${c.id}">
                  <div class="lm-correo-item-top">
                    <i class="ph ph-bold ${CORREO_ICONOS[c.rol]||'ph-envelope'}"></i>
                    <div class="lm-correo-item-info">
                      <div class="lm-correo-remitente">${NOMBRE_ROL[c.rol]||t('lm.club_generico')}</div>
                      <div class="lm-correo-asunto">${correoAsuntoActual(c)||''}</div>
                    </div>
                    <button class="lm-correo-borrar" data-borrar-correo="${c.id}" title="${t('lm.borrar_mensaje')}"><i class="ph ph-bold ph-trash"></i></button>
                  </div>
                  ${cuerpoExtra}
                </div>`;
              }).join('') : '';
              return `<div class="lm-correo-box">
                ${sinLeer?'<span class="lm-correo-notif-dot"></span>':''}
                <div class="lm-correo-header">
                  <span><i class="ph ph-bold ph-envelope"></i> ${t("lm.correo_interno")}</span>
                  ${sinLeer?`<span class="lm-correo-badge">${sinLeer}</span>`:''}
                  ${(state.correoInterno&&state.correoInterno.length)?`<button class="lm-correo-borrar-todos" id="lmCorreoBorrarTodos">${t('lm.borrar_todos')}</button>`:''}
                </div>
                <div class="lm-correo-list">
                  ${filas||`<p class="lm-setup-desc" style="text-align:center;padding:10px 0">${t('lm.bandeja_vacia')}</p>`}
                </div>
              </div>`;
            }catch(e){
              console.error('Error pintando el correo interno:', e);
              return `<div class="lm-correo-box"><div class="lm-correo-header"><span><i class="ph ph-bold ph-envelope"></i> ${t("lm.correo_interno")}</span></div><div class="lm-correo-list"><p class="lm-setup-desc" style="text-align:center;padding:10px 0">${t('lm.correo_error_carga')}</p></div></div>`;
            }
          })()}
          <div class="box collapsible-box collapsed" id="lmHowToPlayBox">
            <h3 class="collapsible-header" onclick="toggleCollapsible('lmHowToPlayBox')"><span>${t('lm.howto_titulo')}</span> <span class="collapse-arrow">▾</span></h3>
            <div class="howto-content">
              <div class="howto-step"><span class="howto-num">1</span><div>${t('lm.howto_paso1')}</div></div>
              <div class="howto-step"><span class="howto-num">2</span><div>${t('lm.howto_paso2')}</div></div>
              <div class="howto-step"><span class="howto-num">3</span><div>${t('lm.howto_paso3')}</div></div>
              <div class="howto-step"><span class="howto-num">4</span><div>${t('lm.howto_paso4')}</div></div>
              <div class="howto-step"><span class="howto-num">5</span><div>${t('lm.howto_paso5')}</div></div>
              <button id="lmReplayTutorialBtn" style="width:100%;margin-top:12px;font-family:'Bebas Neue',Impact,sans-serif;letter-spacing:1px;font-size:16px;background:none;border:1px solid var(--gold);color:var(--gold);border-radius:6px;padding:9px 14px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px">
                <i class="ph ph-bold ph-play-circle" style="font-size:20px"></i> ${t('lm.howto_ver_tutorial')}
              </button>
            </div>
          </div>
          <div class="box collapsible-box collapsed" id="lmStatsGuideBox">
            <h3 class="collapsible-header" onclick="toggleCollapsible('lmStatsGuideBox')"><span>${t('lm.stats_guide_titulo')}</span> <span class="collapse-arrow">▾</span></h3>
            <div class="howto-content">
              <div class="howto-step"><span class="howto-num stat-num stat-attack">A</span><div><strong>${t('lm.stat_ataque_lbl')}</strong> — ${t('lm.stat_ataque_desc')}</div></div>
              <div class="howto-step"><span class="howto-num stat-num stat-defense">D</span><div><strong>${t('lm.stat_defensa_lbl')}</strong> — ${t('lm.stat_defensa_desc')}</div></div>
              <div class="howto-step"><span class="howto-num stat-num stat-pace">R</span><div><strong>${t('lm.stat_ritmo_lbl')}</strong> — ${t('lm.stat_ritmo_desc')}</div></div>
              <div class="howto-step"><span class="howto-num stat-num stat-passing">P</span><div><strong>${t('lm.stat_pase_lbl')}</strong> — ${t('lm.stat_pase_desc')}</div></div>
              <div class="howto-step"><span class="howto-num stat-num stat-technique">T</span><div><strong>${t('lm.stat_tecnica_lbl')}</strong> — ${t('lm.stat_tecnica_desc')}</div></div>
            </div>
          </div>
          <div class="box collapsible-box collapsed" id="lmGlossaryBox">
            <h3 class="collapsible-header" onclick="toggleCollapsible('lmGlossaryBox')"><span>${t('lm.glosario_titulo')}</span> <span class="collapse-arrow">▾</span></h3>
            <div class="howto-content">
              <table class="glossary-table"><tbody>
                ${['jornada','quiniela','cuerpo_tecnico','proyectos','moral','fichajes','sobres','traspasos','capital','rasgos','mejoras_habilidades','guardias','rueda_prensa','estadio','sancion','entrenamiento'].map(k=>`<tr><td class="glossary-term">${t('lm.gloss_'+k+'_term')}</td><td class="glossary-desc">${t('lm.gloss_'+k)}</td></tr>`).join('')}
              </tbody></table>
            </div>
          </div>
        </div>

      </div>
    `;

    if(clima) aplicarClimaVisualLM(clima.id);
    acabaDeReordenarColumnas=false;
    // Scroll de columna a prueba de balas: en vez de confiar en que la
    // altura en % se calcule bien a través de flex+grid (que en esta
    // columna concreta llevaba fallando pese a varios intentos), se
    // envuelve TODO el contenido de cada columna en un div interior con
    // position:absolute;inset:0 — su tamaño se calcula solo a partir del
    // propio contenedor (position:relative), sin depender para nada de
    // cómo se comporte el grid por fuera. Es una técnica distinta a
    // todo lo probado hasta ahora.
    try{
      document.querySelectorAll('#ligaManagerScreen .lm-app-grid > .lm-panel, #ligaManagerScreen .lm-app-grid > .lm-center-panel').forEach(col=>{
        if(col.querySelector(':scope > .lm-col-scroll-inner')) return; // ya envuelta en este mismo render
        const hijos=Array.from(col.childNodes).filter(h=>{
          if(h.nodeType!==1) return true; // texto/comentarios, da igual, se mueven
          return !h.classList.contains('lm-col-reorder') && !h.classList.contains('lm-scroll-hint');
        });
        const inner=document.createElement('div');
        inner.className='lm-col-scroll-inner';
        hijos.forEach(h=>inner.appendChild(h));
        col.appendChild(inner);
        col.classList.add('lm-col-scroll-outer');
      });
    }catch(e){ console.error('Error envolviendo columnas para scroll:', e); }
    root.querySelectorAll('.lm-panel, .lm-center-panel').forEach(el=>{
      const clave=el.className;
      const scrollTarget=el.querySelector('.lm-col-scroll-inner')||el;
      if(clave && scrollGuardado[clave]!==undefined) scrollTarget.scrollTop=scrollGuardado[clave];
      marcarScrollColumna(clave);
      scrollTarget.addEventListener('scroll', ()=>marcarScrollColumna(clave));
    });
    iniciarHintScrollColumnas();

    const medicoInfoBtn=document.getElementById('lmMedicoInfoBtn');
    if(medicoInfoBtn) medicoInfoBtn.addEventListener('click', (e)=>{
      e.stopPropagation();
      if(bloqueadoPorVacante('medico')) return;
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

    root.querySelectorAll('[data-modo-visual]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        state.modoVisualPartido=btn.getAttribute('data-modo-visual');
        guardarEstado();
        render();
      });
    });

    const jugarBtn=document.getElementById('lmJugarBtn');
    if(jugarBtn){
      jugarBtn.addEventListener('click', ()=>{
        marcarInteraccionJugarBtn();
        if(typeof window.playSound==='function') window.playSound('select');
        const jugarAhora=()=>{
          // Si la semana de esta jornada ya se resolvió (primer SEGUIR),
          // este segundo SEGUIR juega directamente el partido.
          if(state.semanaResueltaParaJornada===state.jornadaActual){
            const info=jugarJornada();
            if(info){
              const alTerminar=()=>{
                render();
                mostrarLogrosPendientes();
                mostrarResolucionQuinielaSiToca();
                // Se acaba de cruzar de la jornada 38 a la 39: la
                // temporada ha terminado justo ahora — se muestra el
                // resumen una única vez, aquí mismo, nunca en renders
                // posteriores (el botón JUGAR/SEGUIR queda deshabilitado
                // en cuanto jornadaActual>38, así que este callback no
                // puede volver a dispararse para la misma temporada).
                if(state.jornadaActual>38) mostrarResumenTemporada();
              };
              if(state.modoVisualPartido==='manager'){ abrirVisorPartidoManager(info, alTerminar); }
              else { mostrarPartidoEnVivo(info, alTerminar); }
            } else { render(); }
            return;
          }
          const continuarSemana=()=>{
            const eventosDias=procesarEntrenamientoSemanal();
            state.semanaResueltaParaJornada=state.jornadaActual;
            guardarEstado();
            mostrarSemanaEnVivo(eventosDias, ()=>{ render(); });
          };
          // Si hay días de entrenamiento marcados en el calendario pero no
          // hay nadie en el Plan de Entrenamiento del Preparador Físico,
          // esos días no mejorarían a ningún jugador — se avisa (solo la
          // primera vez que pase en toda la partida) y se le da la
          // oportunidad de corregirlo antes de seguir.
          const {entreno}=contarEntrenoSemanaActual();
          const sinPlan=!(state.pfPlanEntrenamiento && state.pfPlanEntrenamiento.length);
          if(entreno>0 && sinPlan && !state.avisoSinPlanMostrado){
            state.avisoSinPlanMostrado=true;
            guardarEstado();
            mostrarAvisoEntrenamientoSinPlan(continuarSemana);
            return;
          }
          continuarSemana();
        };
        // Los avisos van encadenados: cada uno, al cerrarse (con
        // "decidir más tarde" o similar), pasa directamente al
        // siguiente pendiente en vez de cortar el flujo — antes había
        // que pulsar SEGUIR una vez por cada aviso distinto para
        // verlos todos, cuando deberían aparecer uno tras otro en el
        // mismo clic. Cada aviso sigue mostrándose como mucho una vez
        // en toda la partida.
        const pasoQuiniela=()=>{
          // Aviso de quiniela pendiente: la quiniela se entrega para
          // usarse en ESA jornada concreta — si el jugador intenta jugar
          // el partido sin haberla rellenado, se le avisa y se le da la
          // opción de rellenarla ahí mismo, o seguir jugando (en cuyo
          // caso la quiniela se pierde y se borra del correo interno,
          // ya que no tiene sentido conservarla para una jornada que ya
          // ha pasado).
          if(state.quinielaBoleto && !state.quinielaBoleto.rellenado){
            mostrarAvisoQuinielaPendienteAntesDeJugar(jugarAhora);
            return;
          }
          jugarAhora();
        };
        const faltaCuerpoTecnico=ROLES_TRABAJO.some(r=>!state.trabajadores[r]);
        if(faltaCuerpoTecnico && !state.avisoCuerpoTecnicoMostrado){
          state.avisoCuerpoTecnicoMostrado=true;
          guardarEstado();
          mostrarAvisoPlantillaTecnicaIncompleta(pasoQuiniela);
          return;
        }
        pasoQuiniela();
      });
      jugarBtn.addEventListener('mouseenter', marcarInteraccionJugarBtn);
      jugarBtn.addEventListener('mousemove', marcarInteraccionJugarBtn);
      if(Date.now()-jugarBtnUltimaInteraccion>60000) jugarBtn.classList.add('lm-btn-jugar-pulse');
      iniciarPulseJugarBtn();
    }
    // Botones DEV (solo jesuslor85@gmail.com) — simulan al instante hasta
    // la última jornada, forzando todos mis partidos ganados o perdidos.
    const cheatPerderBtn=document.getElementById('lmCheatPerderBtn');
    if(cheatPerderBtn) cheatPerderBtn.addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      lmDevSimularHastaUltimaJornada('perder');
    });
    const cheatGanarBtn=document.getElementById('lmCheatGanarBtn');
    if(cheatGanarBtn) cheatGanarBtn.addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      lmDevSimularHastaUltimaJornada('ganar');
    });
    const trabajadoresBtn=document.getElementById('lmTrabajadoresBtn');
    if(trabajadoresBtn) trabajadoresBtn.addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      abrirTrabajadores();
    });
    const verOnceRivalBtn=document.getElementById('lmVerOnceRivalBtn');
    if(verOnceRivalBtn) verOnceRivalBtn.addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      if(rival) abrirOnceRival(rival);
    });
    root.querySelectorAll('[data-mover-col]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        if(btn.disabled) return;
        marcarInteraccionColArrows();
        const key=btn.getAttribute('data-mover-col');
        const dir=parseInt(btn.getAttribute('data-mover-dir'),10);
        if(typeof window.playSound==='function') window.playSound('select');
        moverColumna(key, dir);
      });
    });
    root.querySelectorAll('.lm-col-reorder').forEach(el=>{
      el.addEventListener('mouseenter', marcarInteraccionColArrows);
      el.addEventListener('touchstart', marcarInteraccionColArrows, {passive:true});
      if(Date.now()-colArrowsUltimaInteraccion>10000) el.classList.add('lm-col-reorder-oculto');
    });
    iniciarFadeColArrows();
    root.querySelectorAll('[data-cal-dia]').forEach(el=>{
      el.addEventListener('click', ()=>{
        const iso=el.getAttribute('data-cal-dia');
        if(!state.calendarioEntrenamiento) state.calendarioEntrenamiento={};
        const yaEntrena=!!state.calendarioEntrenamiento[iso];
        if(typeof window.playSound==='function') window.playSound(yaEntrena?'rest_day':'training_day');
        if(yaEntrena) delete state.calendarioEntrenamiento[iso];
        else state.calendarioEntrenamiento[iso]=true;
        guardarEstado();
        render();
      });
    });
    root.querySelectorAll('[data-cal-nav]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        const dir=parseInt(btn.getAttribute('data-cal-nav'),10);
        if(!calendarioMesVisto){
          const base=fechaJornadaLM(Math.min(state.jornadaActual,38)) || new Date(state.fechaInicioLiga+'T00:00:00');
          calendarioMesVisto={year:base.getFullYear(), month:base.getMonth()};
        }
        let {year, month}=calendarioMesVisto;
        month+=dir;
        if(month<0){ month=11; year--; } else if(month>11){ month=0; year++; }
        calendarioMesVisto={year, month};
        render();
      });
    });
    const perfilHeader=document.getElementById('lmPerfilEquipoHeader');
    if(perfilHeader) perfilHeader.addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      perfilEquipoColapsado=!perfilEquipoColapsado;
      render();
    });
    root.querySelectorAll('[data-correo]').forEach(el=>{
      el.addEventListener('click', ()=>{
        const id=el.getAttribute('data-correo');
        if(typeof window.playSound==='function') window.playSound('select');
        const correo=(state.correoInterno||[]).find(c=>c.id===id);
        if(correo && !correo.leido){ correo.leido=true; guardarEstado(); }
        correoExpandido = correoExpandido===id ? null : id;
        render();
      });
    });
    root.querySelectorAll('[data-aceptar-oferta]').forEach(btn=>{
      btn.addEventListener('click', (e)=>{
        e.stopPropagation();
        const mailId=btn.getAttribute('data-aceptar-oferta');
        const idx=parseInt(btn.getAttribute('data-oferta-idx'),10);
        const mail=(state.correoInterno||[]).find(m=>m.id===mailId);
        const proceder=()=>{
          if(typeof window.playSound==='function') window.playSound('select');
          const r=aceptarOfertaTraspaso(mailId, idx);
          if(r && !r.ok && r.motivo) mostrarAvisoJuego(r.motivo);
          render();
        };
        if(mail && typeof window.showConfirmPopup==='function'){
          window.showConfirmPopup(`¿Aceptar la oferta de ${mail.ofertas[idx].club} por ${formatoDinero(mail.ofertas[idx].monto)}? El jugador se irá al club rival.`, proceder, 'ACEPTAR');
        } else {
          proceder();
        }
      });
    });
    root.querySelectorAll('[data-rechazar-oferta]').forEach(btn=>{
      btn.addEventListener('click', (e)=>{
        e.stopPropagation();
        const mailId=btn.getAttribute('data-rechazar-oferta');
        if(typeof window.playSound==='function') window.playSound('select');
        rechazarOfertasTraspaso(mailId);
        render();
      });
    });
    const btnInfoClub=document.getElementById('lmInfoClubBtn');
    if(btnInfoClub) btnInfoClub.addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      abrirInfoClub();
    });
    root.querySelectorAll('[data-ver-finanzas]').forEach(btn=>{
      btn.addEventListener('click', (e)=>{
        e.stopPropagation();
        if(typeof window.playSound==='function') window.playSound('select');
        abrirFinanzasDG();
      });
    });
    root.querySelectorAll('[data-ir-contratar]').forEach(btn=>{
      btn.addEventListener('click', (e)=>{
        e.stopPropagation();
        if(typeof window.playSound==='function') window.playSound('select');
        abrirTrabajadores();
      });
    });
    root.querySelectorAll('[data-abrir-sobre-correo]').forEach(btn=>{
      btn.addEventListener('click', (e)=>{
        e.stopPropagation();
        if(typeof window.playSound==='function') window.playSound('select');
        const mailId=btn.getAttribute('data-abrir-sobre-correo');
        const sobreId=btn.getAttribute('data-sobre-id');
        const jugadores=abrirSobrePorId(sobreId);
        if(!jugadores){ render(); return; }
        mostrarRevelacionSobreDesdeCorreo(jugadores, (fichadoNombre)=>{
          const mail=(state.correoInterno||[]).find(m=>m.id===mailId);
          if(mail){
            mail.resuelto=true;
            mail.resultadoTexto = fichadoNombre
              ? `Sobre abierto — fichaste a ${fichadoNombre}.`
              : 'Sobre abierto — no se fichó a nadie esta vez.';
          }
          guardarEstado();
          render();
        });
      });
    });
    root.querySelectorAll('[data-abrir-quiniela]').forEach(btn=>{
      btn.addEventListener('click', (e)=>{
        e.stopPropagation();
        if(typeof window.playSound==='function') window.playSound('select');
        abrirBoletoQuiniela();
      });
    });
    root.querySelectorAll('[data-borrar-correo]').forEach(btn=>{
      btn.addEventListener('click', (e)=>{
        e.stopPropagation();
        const mailId=btn.getAttribute('data-borrar-correo');
        if(typeof window.playSound==='function') window.playSound('select');
        borrarCorreo(mailId);
        render();
      });
    });
    const btnBorrarTodos=root.querySelector('#lmCorreoBorrarTodos');
    if(btnBorrarTodos) btnBorrarTodos.addEventListener('click', (e)=>{
      e.stopPropagation();
      if(typeof window.playSound==='function') window.playSound('select');
      const proceder=()=>{ borrarTodoElCorreo(); render(); };
      if(typeof window.showConfirmPopup==='function'){
        window.showConfirmPopup(t('lm.confirmar_borrar_todos'), proceder, t('lm.borrar_todos').toUpperCase());
      } else if(confirm(t('lm.confirmar_borrar_todos'))){
        proceder();
      }
    });
    const sortBtn=document.getElementById('lmSortBtn');
    if(sortBtn) sortBtn.addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      lmSortMode=LM_SORT_NEXT[lmSortMode];
      render();
    });
    const medicoBtn=document.getElementById('lmMedicoBtn');
    if(medicoBtn) medicoBtn.addEventListener('click', ()=>{
      if(bloqueadoPorVacante('medico')) return;
      if(typeof window.playSound==='function') window.playSound('select');
      abrirMedico();
    });
    const mantenimientoBtn=document.getElementById('lmMantenimientoBtn');
    if(mantenimientoBtn) mantenimientoBtn.addEventListener('click', ()=>{
      if(bloqueadoPorVacante('mantenimiento')) return;
      if(typeof window.playSound==='function') window.playSound('select');
      abrirMantenimiento();
    });
    const mantenimientoInfoBtn=document.getElementById('lmMantenimientoInfoBtn');
    if(mantenimientoInfoBtn) mantenimientoInfoBtn.addEventListener('click', (e)=>{
      e.stopPropagation();
      if(bloqueadoPorVacante('mantenimiento')) return;
      if(typeof window.playSound==='function') window.playSound('select');
      abrirEstadoEstadio();
    });
    const dgBtn=document.getElementById('lmDirectorGeneralBtn');
    if(dgBtn) dgBtn.addEventListener('click', ()=>{
      if(bloqueadoPorVacante('directorGeneral')) return;
      if(typeof window.playSound==='function') window.playSound('select');
      abrirDirectorGeneral();
    });
    const dgInfoBtn=document.getElementById('lmDirectorGeneralInfoBtn');
    if(dgInfoBtn) dgInfoBtn.addEventListener('click', (e)=>{
      e.stopPropagation();
      if(bloqueadoPorVacante('directorGeneral')) return;
      if(typeof window.playSound==='function') window.playSound('select');
      abrirFinanzasDG();
    });
    const ddBtn=document.getElementById('lmDirectorDeportivoBtn');
    if(ddBtn) ddBtn.addEventListener('click', ()=>{
      if(bloqueadoPorVacante('directorDeportivo')) return;
      if(typeof window.playSound==='function') window.playSound('select');
      abrirDirectorDeportivo();
    });
    const ddInfoBtn=document.getElementById('lmDirectorDeportivoInfoBtn');
    if(ddInfoBtn) ddInfoBtn.addEventListener('click', (e)=>{
      e.stopPropagation();
      if(bloqueadoPorVacante('directorDeportivo')) return;
      if(typeof window.playSound==='function') window.playSound('select');
      abrirHistorialFichajesDD();
    });
    const pfBtn=document.getElementById('lmPreparadorFisicoBtn');
    if(pfBtn) pfBtn.addEventListener('click', ()=>{
      if(bloqueadoPorVacante('preparadorFisico')) return;
      if(typeof window.playSound==='function') window.playSound('select');
      abrirPreparadorFisico();
    });
    const pfInfoBtn=document.getElementById('lmPreparadorFisicoInfoBtn');
    if(pfInfoBtn) pfInfoBtn.addEventListener('click', (e)=>{
      e.stopPropagation();
      if(bloqueadoPorVacante('preparadorFisico')) return;
      if(typeof window.playSound==='function') window.playSound('select');
      abrirHistorialPF();
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
    if(typeof reiniciarAvisoInactividadCampo==='function') reiniciarAvisoInactividadCampo();
  }
  // Envoltorio de seguridad: si renderInner() falla por CUALQUIER
  // motivo, en vez de dejar la pantalla en negro en silencio, se
  // muestra el error exacto directamente en pantalla — así se puede
  // ver y copiar el problema real sin necesitar herramientas de
  // desarrollador ni conexión USB.
  function render(){
    try{
      renderInner();
    }catch(e){
      console.error('Error en render() de Liga Manager:', e);
      const root=document.getElementById('ligaManagerScreen');
      if(root){
        root.innerHTML=`
          <div style="padding:24px;color:#fff;font-family:monospace;font-size:13px;line-height:1.6;max-width:100%;overflow-wrap:break-word">
            <div style="color:#e24b4a;font-size:16px;font-weight:bold;margin-bottom:12px">⚠️ Error al cargar Liga Manager</div>
            <div style="color:#ccc;margin-bottom:12px">${t('lm.copia_mensaje_dev')}</div>
            <div style="background:#1a1a1a;border:1px solid #e24b4a;border-radius:6px;padding:12px;color:#ffb3b3;user-select:text">${(e && e.message) ? e.message : String(e)}${(e && e.stack) ? '<br><br>'+e.stack.replace(/\\n/g,'<br>') : ''}</div>
          </div>`;
      }
    }
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
    // Un jugador lesionado SÍ se puede alinear — juega con más riesgo de
    // agravar la lesión (se resuelve en el propio partido), ya no se
    // bloquea aquí como antes.
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
  function abrirHistorialMedico(esModoMantener){
    const overlay=document.createElement('div');
    overlay.id='lmHistorialOverlay';
    const historial=(state.medicoHistorial||[]).slice().reverse(); // más reciente primero
    const tratamientos=historial.filter(h=>h.tipo!=='progreso');
    const totalEstrellas=NIVELES_EQUIPO_INFO.reduce((s,info)=>s+nivelDe(info.track),0);

    function pintar(){
      const filas = tratamientos.map(h=>{
        let estado;
        if(h.resuelta){
          estado=`Se recuperó gracias a <strong>${h.resueltoPor}</strong> — estuvo ${h.jornadasReales} jornada${h.jornadasReales===1?'':'s'} sin jugar`;
        } else {
          // Ojo: semanasPrevistas es la previsión del DÍA de la lesión y
          // nunca cambia — hay que mirar al jugador real para reflejar
          // que un tratamiento le ha adelantado la recuperación.
          const jugadorReal = h.jugadorId ? state.plantilla.find(p=>p.id===h.jugadorId) : null;
          const restante = jugadorReal ? jugadorReal.injuryWeeks : h.semanasPrevistas;
          const tratado = jugadorReal && restante < h.semanasPrevistas;
          estado=`<span style="color:#e24b4a">${t('lm.todavia_de_baja')}</span> (le quedan ${restante} jornada${restante===1?'':'s'}${tratado?` — <span style="color:#5dcaa5">${t('lm.tratamiento_adelantado')}</span>`:''})`;
        }
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
        <div class="lm-dilemma-card lm-dilemma-card-medico" style="width:480px;max-width:90vw;text-align:left">
          ${xCerrarHTML()}
          <div class="lm-dilemma-title"><i class="ph ph-bold ph-clock-counter-clockwise"></i> HISTORIAL MÉDICO</div>
          <div class="lm-tab-content">
            <div class="lm-hist-list">
              ${tratamientos.length?filas:`<p class="lm-setup-desc" style="text-align:center">${t('lm.sin_historial_medico')}</p>`}
            </div>
          </div>
          ${esModoMantener?'':`<div class="lm-popup-actions lm-popup-actions-compact">
            <button id="lmHistorialCerrar" class="mode-card-btn mode-card-btn-gold">${t('lm.cerrar')}</button>
          </div>`}
        </div>`;
      overlay.querySelectorAll('[data-histtab]').forEach(el=>{
        el.addEventListener('click', ()=>{
          if(typeof window.playSound==='function') window.playSound('select');
          histTab=el.getAttribute('data-histtab');
          pintar();
        });
      });
      const cerrarHist=()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        overlay.remove();
      };
      const btnCerrarHist=document.getElementById('lmHistorialCerrar');
      if(btnCerrarHist) btnCerrarHist.addEventListener('click', cerrarHist);
      const xBtnHist=overlay.querySelector('[data-cerrar-x]');
      if(xBtnHist) xBtnHist.addEventListener('click', cerrarHist);
    }
    document.getElementById('ligaManagerScreen').appendChild(overlay);
    habilitarCierreOverlay(overlay, ()=>overlay.remove());
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
    if(r.tipo==='error'){
      return `<span style="color:#e6c94a">${r.texto}</span>`;
    }
    if(r.tipo==='directa'){
      return `Suma <strong>${r.suma}</strong> (necesitabas ${r.dificultad}+) — <span style="color:${r.exito?'#5dcaa5':'#e24b4a'}">${r.exito?'✔ ÉXITO — '+r.texto:'✘ FALLO — '+r.texto}</span>`;
    }
    if(r.tipo==='nivel'){
      return r.exito
        ? `Suma <strong>${r.suma}</strong> (necesitabas ${r.dificultad}+) — <span style="color:#5dcaa5">✔ ÉXITO</span> — ${r.nombre} sube a nivel ${r.nivelNuevo}/${NIVEL_MAXIMO_EQUIPO}${r.maxAlcanzado?` — <strong>${t('lm.nivel_maximo_alcanzado')}</strong>`:''}`
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
        <div class="lm-dice-result-row">${tiradas.map((v,i)=>`<div class="lm-dice-face${puedeReroll?' lm-dice-face-reroll':''}" data-reroll-i="${i}" id="lmDiceResultFace${i}" ${puedeReroll?`title="${t('lm.tt_repetir_dado')}"`:''}>${dadoPipsHTML(v)}</div>`).join('')}</div>
        <div class="lm-dice-suma-grande">${suma}</div>
        ${puedeReroll?`<div class="lm-setup-desc">${t('lm.toca_dado_repetirlo')} <strong>${state.dadoRerollsDisponibles}/${lmRerollsPorPartido()}</strong></div>`:''}
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
          try{
            resultado=resolverFn(tiradas);
          }catch(e){
            console.error('Error al resolver la tirada:', e);
            resultado={tipo:'error', texto:`Hubo un problema al aplicar el resultado, pero tu tirada se ha registrado. Detalle técnico (cópialo si vuelve a pasar): ${(e&&e.message)||e}`};
          }
          if(!resultado) resultado={tipo:'error', texto:'No se pudo aplicar el resultado.'};
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
    const tagEl = cardEl.querySelector('.med-card-tag');
    const descEl = cardEl.querySelector('.med-card-desc');
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
      if(tagEl) tagEl.textContent = rnd.tipo==='nivel' ? t('lm.tag_proyecto') : (rnd.tipo==='sobre' ? t('lm.tag_proyecto_especial') : t('lm.tag_accion'));
      if(descEl) descEl.textContent = rnd.desc;
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
  // Columnas intercambiables (solo escritorio) — flechitas ‹ › en la
  // esquina de cada columna para moverla a izquierda/derecha. El nuevo
  // orden se ve al instante, pero solo se GUARDA en el estado si pasa 1
  // minuto entero sin que el usuario vuelva a tocar nada (debounce), para
  // no escribir en cada clic mientras está todavía "probando" el orden.
  function moverColumna(key, direccion){
    if(!state.ordenColumnas || state.ordenColumnas.length!==4) state.ordenColumnas=['left','center','right','staff'];
    const arr=state.ordenColumnas;
    const idx=arr.indexOf(key);
    const nuevoIdx=idx+direccion;
    if(idx<0 || nuevoIdx<0 || nuevoIdx>=arr.length) return;
    const tmp=arr[idx]; arr[idx]=arr[nuevoIdx]; arr[nuevoIdx]=tmp;
    if(ordenColumnasSaveTimer) clearTimeout(ordenColumnasSaveTimer);
    ordenColumnasSaveTimer=setTimeout(()=>{ guardarEstado(); ordenColumnasSaveTimer=null; }, 60000);
    acabaDeReordenarColumnas=true;
    render();
  }
  function columnaControlesHTML(key){
    const arr=state.ordenColumnas||['left','center','right','staff'];
    const idx=arr.indexOf(key);
    const esPrimera=idx<=0, esUltima=idx>=arr.length-1;
    return `<div class="lm-col-reorder">
      <button class="lm-col-arrow" data-mover-col="${key}" data-mover-dir="-1" ${esPrimera?'disabled':''} title="${t('lm.tt_mover_izquierda')}">‹</button>
      <button class="lm-col-arrow" data-mover-col="${key}" data-mover-dir="1" ${esUltima?'disabled':''} title="${t('lm.tt_mover_derecha')}">›</button>
    </div>`;
  }
  function columnaOrderStyle(key){
    const arr=state.ordenColumnas||['left','center','right','staff'];
    const idx=arr.indexOf(key);
    return idx>=0 ? `order:${idx}` : '';
  }

  function staffTileHTML(rol, o){
    const trab=state.trabajadores[rol];
    return `
    <div class="lm-staff-tile ${o.acento||''} ${trab?'':'lm-staff-tile-vacante'}" id="${o.btnId}">
      <i class="ph ph-bold ${o.icono} lm-staff-tile-rol-icon"></i>
      <div class="lm-staff-tile-photo">
        ${staffFotoHTML(o.carpeta, o.archivo, o.alt, o.icono, trab?trab.genero:'hombre', !trab)}
        ${o.notif?`<span class="lm-staff-tile-badge">${o.badgeTexto}</span>`:''}
        <button class="lm-staff-tile-info-btn" id="${o.infoId}" title="${o.infoTitle}"><i class="ph ph-bold ph-info"></i></button>
        <div class="lm-staff-tile-photo-fade"></div>
      </div>
      <div class="lm-staff-tile-body">
        <div class="lm-staff-tile-rol">${o.rolLabel}</div>
        <div class="lm-staff-tile-nombre">${trab?trab.nombre:'VACANTE'}</div>
        ${trab?`<div class="lm-staff-tile-estrellas">${estrellasNivel(trab.nivel, 3)}</div>`:`<div class="lm-staff-tile-vacante-txt">${t('lm.contratar_en_trabajadores')}</div>`}
        <div class="lm-staff-tile-desc">${o.desc}</div>
      </div>
    </div>`;
  }

  function abrirMedico(){
    const overlay=document.createElement('div');
    overlay.id='lmMedicoOverlay';
    document.getElementById('ligaManagerScreen').appendChild(overlay);
    habilitarCierreOverlay(overlay, ()=>{ overlay.remove(); render(); });
    // Delegado: cualquier X que aparezca dentro de este overlay en
    // cualquier pantalla (selector de dados, tirada, etc.) lo cierra.
    overlay.addEventListener('click', (e)=>{
      const xEl = e.target.closest && e.target.closest('[data-cerrar-x]');
      if(xEl){ if(typeof window.playSound==='function') window.playSound('select'); overlay.remove(); render(); }
    });

    function jugadoresLesionadosPara(def){
      if(!def.requiereLesion) return [];
      return state.plantilla.filter(p=>p.injured && (def.requiereLesion==='grave' ? p.injurySeverity==='grave' : true));
    }

    function renderHub(){
      let notif=state.medicoNotificacion;
      let jugadorUrgente=notif?state.plantilla.find(p=>p.id===notif.jugadorId):null;
      if(notif && (!jugadorUrgente || !jugadorUrgente.injured)){
        state.medicoNotificacion=null;
        notif=null; jugadorUrgente=null;
      }

      const cartasHTML=state.medicoCartas.map((instancia,idx)=>{
        const def=cartaDef(instancia.cartaId);
        const candidatos=jugadoresLesionadosPara(def);
        const sinLesionNecesaria = def.requiereLesion && candidatos.length===0;
        const dificultadEfectiva = def.tipo==='nivel' ? dificultadActualNivel(def) : Math.max(3, def.dificultad - bonusEstrellasTrabajador('medico'));
        const maxPosible = state.diceAvailable*6;
        const imposiblePorDados = (def.tipo==='directa'||def.tipo==='nivel') && maxPosible < dificultadEfectiva;
        const nivelMaximoYa = def.tipo==='nivel' && nivelDe(def.track)>=NIVEL_MAXIMO_EQUIPO;
        const bloqueada = sinLesionNecesaria || imposiblePorDados || nivelMaximoYa;
        const cambioDisponible=(state.medicoCambiosUsados||0)<lmCambiosCartaPorPartido();
        let cuerpo;
        if(def.tipo==='nivel'){
          const n=nivelDe(def.track);
          cuerpo=`<div class="med-card-progress-label" style="text-align:center;letter-spacing:2px;color:var(--gold)">${estrellasNivel(n)}</div>
                  <div class="med-card-dificultad">${t('lm.dificultad_lbl')} ${dificultadEfectiva}+ ${t('lm.para_subir_a_nivel')} ${n+1}/${NIVEL_MAXIMO_EQUIPO}</div>`;
        } else if(def.tipo==='acumulacion'){
          const umbral=def.niveles[instancia.nivelActual-1];
          cuerpo=`<div class="med-card-progress"><div class="med-card-progress-fill" style="width:${Math.min(100,100*instancia.progreso/umbral)}%"></div></div>
                  <div class="med-card-progress-label">${t('lm.nivel_n_de_x')} ${instancia.nivelActual}/${def.niveles.length} — ${instancia.progreso}/${umbral}</div>`;
        } else {
          cuerpo=`<div class="med-card-dificultad">Dificultad ${Math.max(3, def.dificultad - bonusEstrellasTrabajador('medico'))}+</div>`;
        }
        return `
        <div class="med-card med-card-medico ${bloqueada?'med-card-bloqueada':''}" data-idx="${idx}">
          <button class="med-card-swap" data-swap="${idx}" title="${t('lm.tt_cambiar_carta')}" ${cambioDisponible?'':'disabled'}><i class="ph ph-bold ph-arrows-clockwise"></i></button>
          <div class="med-card-tag">${def.tipo==='nivel'?t('lm.tag_proyecto'):(def.tipo==='acumulacion'?t('lm.tag_proyecto'):t('lm.tag_accion'))}</div>
          <i class="ph ph-bold ${def.icon} med-card-icon"></i>
          <div class="med-card-title">${tc('med', def.id, 'nombre', def.nombre)}</div>
          <div class="med-card-divider"></div>
          <div class="med-card-desc">${tc('med', def.id, 'desc', def.desc)}</div>
          ${cuerpo}
          ${bloqueada?`<div class="med-card-bloqueada-label">${sinLesionNecesaria?t('lm.necesita_lesion_activa'):(nivelMaximoYa?t('lm.especialidad_maxima'):t('lm.imposible_dados'))}</div>`:`<button class="mode-card-btn mode-card-btn-gold med-card-btn" data-usar="${idx}" style="padding:7px;font-size:11px">${t('lm.usar_btn')}</button>`}
        </div>`;
      }).join('');

      overlay.innerHTML=`
        <div class="lm-dilemma-card lm-dilemma-card-medico" style="max-width:640px">
          ${xCerrarHTML()}
          <div class="lm-dilemma-title"><i class="ph ph-bold ph-first-aid-kit"></i> ${t('lm.titulo_medico')}</div>
          ${notif?`
          <div class="lm-urgente-row">
            <div class="lm-urgente-texto"><strong style="color:#e24b4a">${t('lm.urgente')}</strong> ${jugadorUrgente?jugadorUrgente.name:'Un jugador'} tiene una lesión ${notif.severidad}.</div>
            ${(state.diceAvailable*6 < notif.dificultad)
              ? `<div class="med-card-bloqueada-label" style="margin:0">${t('lm.imposible_dados')}</div>`
              : `<button id="lmAtenderUrgente" class="mode-card-btn mode-card-btn-gold">ATENDER (sumar ${notif.dificultad}+)</button>`}
          </div>` : ''}
          ${renderNivelesEquipoHTML()}
          <div class="lm-staff-bar-capital" style="justify-content:center;margin:10px 0 8px"><span><i class="ph ph-bold ph-dice-five"></i> ${t('lm.dados')}: <strong>${state.diceAvailable}</strong></span><span><i class="ph ph-bold ph-arrows-clockwise"></i> ${t('lm.rerrolls')}: <strong>${state.dadoRerollsDisponibles||0}</strong></span><span><i class="ph ph-bold ph-cards"></i> ${t('lm.cambios')}: <strong>${Math.max(0,lmCambiosCartaPorPartido()-(state.medicoCambiosUsados||0))}/${lmCambiosCartaPorPartido()}</strong></span></div>
          <div class="med-card-grid">${cartasHTML}</div>
          <div class="lm-popup-actions lm-popup-actions-compact">
            ${mostrarInfoHTML()}
            <button id="lmMedicoCerrar" class="mode-card-btn mode-card-btn-secondary">${t('lm.cerrar')}</button>
          </div>
        </div>`;

      wireMostrarInfoHold(overlay, abrirHistorialMedico, 'lmHistorialOverlay');
      const xBtnMed=overlay.querySelector('[data-cerrar-x]');
      if(xBtnMed) xBtnMed.addEventListener('click', ()=>{ overlay.remove(); render(); });
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
          if((state.medicoCambiosUsados||0)>=lmCambiosCartaPorPartido()) return;
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
            ${xCerrarHTML()}
          <div class="lm-dilemma-title" style="justify-content:center;text-align:center">¿SOBRE QUIÉN?</div>
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
            ${xCerrarHTML()}
            <i class="ph ph-bold ${def.icon}" style="font-size:26px;color:#5dcaa5"></i>
            <div class="lm-dilemma-title" style="justify-content:center;text-align:center">${tc('med', def.id, 'nombre', def.nombre).toUpperCase()}</div>
            <div class="lm-dilemma-text">${tc('med', def.id, 'desc', def.desc)}${def.tipo==='directa'?` — necesitas sumar <strong class="lm-dificultad-destacada">${Math.max(3, def.dificultad - bonusEstrellasTrabajador('medico'))}+</strong>`:(def.tipo==='nivel'?` — necesitas sumar <strong class="lm-dificultad-destacada">${dificultadActualNivel(def)}+</strong> para subir a nivel ${nivelDe(def.track)+1}/${NIVEL_MAXIMO_EQUIPO}`:' — los dados invertidos siempre suman al proyecto')}</div>
            ${jugadorObjetivo?`<div class="lm-setup-desc" style="margin-top:-4px"><strong>${jugadorObjetivo.name}</strong> — ${jugadorObjetivo.injurySeverity} · ${jugadorObjetivo.injuryWeeks} ${t('lm.jornada').toLowerCase()}${jugadorObjetivo.injuryWeeks===1?'':'s'} restante${jugadorObjetivo.injuryWeeks===1?'':'s'}</div>`:''}
            <div class="lm-dice-selector">
              <button id="lmDiceMinus" class="lm-dice-stepper">−</button>
              <span id="lmDiceCount">${dadosElegidos}</span>
              <button id="lmDicePlus" class="lm-dice-stepper">+</button>
            </div>
            <div class="lm-setup-desc">dados disponibles: ${state.diceAvailable}</div>
            <div class="lm-popup-actions">
              <button id="lmTirarBtn" class="mode-card-btn mode-card-btn-gold" ${state.diceAvailable<1?'disabled':''}>TIRAR ${dadosElegidos} DADO${dadosElegidos>1?'S':''}</button>
              <button id="lmCancelarCartaBtn" class="lm-btn-cancelar">${t('lm.cancelar')}</button>
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
      const cartaObjetivo=cartaDef(state.medicoCartas[idx].cartaId);
      const dificultadObjetivo = cartaObjetivo.tipo==='directa'
        ? Math.max(3, cartaObjetivo.dificultad - bonusEstrellasTrabajador('medico'))
        : (cartaObjetivo.tipo==='nivel' ? dificultadActualNivel(cartaObjetivo) : null);
      overlay.innerHTML=`
        <div class="lm-dilemma-card lm-dilemma-card-medico lm-dice-roll-card">
            ${xCerrarHTML()}
          <div class="lm-dilemma-title" id="lmDiceTitle" style="justify-content:center;text-align:center">TIRANDO ${numDados} DADO${numDados>1?'S':''}...</div>
          ${dificultadObjetivo!==null?`<div class="lm-dice-objetivo">${t('lm.necesitas_sumar')} <strong>${dificultadObjetivo}+</strong></div>`:''}
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
            ${xCerrarHTML()}
            <i class="ph ph-bold ph-first-aid-kit" style="font-size:26px;color:#e24b4a"></i>
            <div class="lm-dilemma-title" style="justify-content:center;text-align:center">${t('lm.medico_te_consulta')}</div>
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
        <div class="lm-dilemma-card lm-dilemma-card-medico lm-dice-roll-card">
            ${xCerrarHTML()}
          <div class="lm-dilemma-title" id="lmDiceTitle" style="justify-content:center;text-align:center">TIRANDO ${numDados} DADO${numDados>1?'S':''}...</div>
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
  function abrirSeguridadEstadio(){
    const overlay=document.createElement('div');
    overlay.id='lmSeguridadEstadioOverlay';
    function pintar(){
      const contratados=state.guardiasContratados||0;
      const disponibles=guardiasDisponibles();
      const salario=guardiaSalarioActual();
      overlay.innerHTML=`
        <div class="lm-dilemma-card lm-seguridad-card">
          ${xCerrarHTML()}
          <div class="lm-dilemma-title"><i class="ph ph-bold ph-shield-check"></i> ${t('lm.seguridad_estadio')}</div>
          <div class="lm-seguridad-resumen">
            <div class="lm-seguridad-resumen-item">
              <i class="ph ph-bold ph-users-three"></i>
              <div><div class="lm-seguridad-resumen-val">${contratados}</div><div class="lm-seguridad-resumen-label">${t('lm.guardias_contratados')}</div></div>
            </div>
            <div class="lm-seguridad-resumen-item">
              <i class="ph ph-bold ph-user-plus"></i>
              <div><div class="lm-seguridad-resumen-val">${disponibles}</div><div class="lm-seguridad-resumen-label">${t('lm.sin_asignar')}</div></div>
            </div>
            <div class="lm-seguridad-resumen-item">
              <i class="ph ph-bold ph-coins"></i>
              <div><div class="lm-seguridad-resumen-val">${formatoDinero(salario)}</div><div class="lm-seguridad-resumen-label">${t('lm.sueldo_guardia_mes')}</div></div>
            </div>
          </div>
          <div class="lm-seguridad-contratar-row">
            <button id="lmContratarGuardiaBtn" class="mode-card-btn mode-card-btn-gold"><i class="ph ph-bold ph-plus"></i> ${t('lm.contratar_guardia')}</button>
            <button id="lmDespedirGuardiaBtn" class="mode-card-btn mode-card-btn-secondary" ${disponibles<=0?'disabled':''}><i class="ph ph-bold ph-minus"></i> ${t('lm.despedir_uno_libre')}</button>
          </div>
          <div class="lm-seguridad-mapa-wrap">
            <img src="assets/estadio/gradas.png" alt="Estadio" class="lm-seguridad-mapa-img">
            ${LM_ZONAS_ESTADIO.map(z=>{
              const guardiasZona=state.guardiasZonas[z.id]||0;
              const nivel=state.disturbiosZonas[z.id]||0;
              const color=LM_DISTURBIO_COLOR[nivel];
              const claseLado = z.left<40 ? 'lm-zona-marcador-izq' : (z.left>60 ? 'lm-zona-marcador-der' : '');
              return `<div class="lm-zona-marcador ${claseLado} ${nivel===3?'lm-zona-marcador-grave':''}" style="left:${z.left}%;top:${z.top}%;${color?`--zona-color:${color}`:''}">
                ${color?`<div class="lm-zona-tinte" style="background:${color}"></div>`:''}
                <div class="lm-zona-etiqueta">
                  <div class="lm-zona-nombre">${z.label}</div>
                  ${nivel>0?`<div class="lm-zona-disturbio" style="color:${color}">${LM_DISTURBIO_LABEL[nivel]}</div>`:''}
                  <div class="lm-zona-guardias-fila">
                    <button class="lm-zona-btn" data-zona-quitar="${z.id}" ${guardiasZona<=0?'disabled':''}><i class="ph ph-bold ph-minus"></i></button>
                    <span class="lm-zona-guardias-num"><i class="ph ph-bold ph-shield"></i> ${guardiasZona}/3</span>
                    <button class="lm-zona-btn" data-zona-anadir="${z.id}" ${(guardiasZona>=3||disponibles<=0)?'disabled':''}><i class="ph ph-bold ph-plus"></i></button>
                  </div>
                </div>
              </div>`;
            }).join('')}
          </div>
          <div class="lm-seguridad-mapa-mini-wrap">
            <img src="assets/estadio/gradas.png" alt="Estadio" class="lm-seguridad-mapa-mini">
            ${LM_ZONAS_ESTADIO.map(z=>`<button type="button" class="lm-zona-hotspot" data-zona-jump="${z.id}" style="left:${z.left}%;top:${z.top}%;width:${z.w}%;height:${z.h}%" aria-label="${z.label}"></button>`).join('')}
          </div>
          <div class="lm-seguridad-lista-movil">
            ${LM_ZONAS_ESTADIO.map(z=>{
              const guardiasZona=state.guardiasZonas[z.id]||0;
              const nivel=state.disturbiosZonas[z.id]||0;
              const color=LM_DISTURBIO_COLOR[nivel];
              return `<div class="lm-zona-fila-movil" id="lmZonaFila_${z.id}" ${color?`style="--zona-color:${color}"`:''}>
                <div class="lm-zona-fila-color ${nivel===3?'lm-zona-fila-color-grave':''}" style="background:${color||'#333'}"></div>
                <div class="lm-zona-fila-info">
                  <div class="lm-zona-fila-nombre">${z.label}</div>
                  <div class="lm-zona-fila-estado" style="color:${color||'#666'}">${nivel>0?LM_DISTURBIO_LABEL[nivel]:t('lm.disturbio_0')}</div>
                </div>
                <button class="lm-zona-btn-movil" data-zona-quitar="${z.id}" ${guardiasZona<=0?'disabled':''}><i class="ph ph-bold ph-minus"></i></button>
                <span class="lm-zona-fila-num"><i class="ph ph-bold ph-shield"></i> ${guardiasZona}/3</span>
                <button class="lm-zona-btn-movil" data-zona-anadir="${z.id}" ${(guardiasZona>=3||disponibles<=0)?'disabled':''}><i class="ph ph-bold ph-plus"></i></button>
              </div>`;
            }).join('')}
          </div>
          <div class="lm-setup-desc" style="text-align:center;margin-top:8px">${t('lm.zonas_sin_guardia_desc')}</div>
          <div class="lm-popup-actions"><button id="lmSeguridadCerrarBtn" class="mode-card-btn mode-card-btn-gold">${t('lm.cerrar')}</button></div>
        </div>`;
      document.getElementById('lmContratarGuardiaBtn').addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        contratarGuardia();
        pintar();
      });
      const despedirBtn=document.getElementById('lmDespedirGuardiaBtn');
      if(despedirBtn) despedirBtn.addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        despedirGuardiaDisponible();
        pintar();
      });
      overlay.querySelectorAll('[data-zona-jump]').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          if(typeof window.playSound==='function') window.playSound('select');
          const fila=document.getElementById('lmZonaFila_'+btn.getAttribute('data-zona-jump'));
          if(fila){
            fila.scrollIntoView({behavior:'smooth', block:'center'});
            fila.classList.add('lm-zona-fila-resaltada');
            setTimeout(()=>fila.classList.remove('lm-zona-fila-resaltada'), 1600);
          }
        });
      });
      overlay.querySelectorAll('[data-zona-anadir]').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          if(typeof window.playSound==='function') window.playSound('select');
          asignarGuardiaZona(btn.getAttribute('data-zona-anadir'));
          pintar();
        });
      });
      overlay.querySelectorAll('[data-zona-quitar]').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          if(typeof window.playSound==='function') window.playSound('select');
          quitarGuardiaZona(btn.getAttribute('data-zona-quitar'));
          pintar();
        });
      });
      habilitarCierreOverlay(overlay, ()=>overlay.remove());
      const xBtn=overlay.querySelector('[data-cerrar-x]');
      if(xBtn) xBtn.addEventListener('click', ()=>overlay.remove());
      document.getElementById('lmSeguridadCerrarBtn').addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        overlay.remove();
      });
    }
    document.getElementById('ligaManagerScreen').appendChild(overlay);
    pintar();
  }

  function abrirMantenimiento(){
    const overlay=document.createElement('div');
    overlay.id='lmMantenimientoOverlay';
    document.getElementById('ligaManagerScreen').appendChild(overlay);
    habilitarCierreOverlay(overlay, ()=>{ overlay.remove(); render(); });
    // Delegado: cualquier X que aparezca dentro de este overlay en
    // cualquier pantalla (selector de dados, tirada, etc.) lo cierra.
    overlay.addEventListener('click', (e)=>{
      const xEl = e.target.closest && e.target.closest('[data-cerrar-x]');
      if(xEl){ if(typeof window.playSound==='function') window.playSound('select'); overlay.remove(); render(); }
    });

    function renderHub(){
      const est=state.estadio||{campo:90,satisfaccion:0};
      const cartasHTML=state.mantenimientoCartas.map((instancia,idx)=>{
        const def=cartaDefM(instancia.cartaId);
        const bloqueadaPorEstado=mantenimientoBloqueadaPorEstado(def);
        const dificultadEfectiva = def.tipo==='nivel' ? dificultadActualNivelM(def) : Math.max(3, def.dificultad - bonusEstrellasTrabajador('mantenimiento'));
        const maxPosible = state.diceAvailable*6;
        const imposiblePorDados = maxPosible < dificultadEfectiva;
        const nivelMaximoYa = def.tipo==='nivel' && nivelDeM(def.track)>=NIVEL_MAXIMO_EQUIPO;
        const bloqueada = bloqueadaPorEstado || imposiblePorDados || nivelMaximoYa;
        const cambioDisponible=(state.mantenimientoCambiosUsados||0)<lmCambiosCartaPorPartido();
        let cuerpo;
        if(def.tipo==='nivel'){
          const n=nivelDeM(def.track);
          cuerpo=`<div class="med-card-progress-label" style="text-align:center;letter-spacing:2px;color:var(--gold)">${estrellasNivel(n)}</div>
                  <div class="med-card-dificultad">${t('lm.dificultad_lbl')} ${dificultadEfectiva}+ ${t('lm.para_subir_a_nivel')} ${n+1}/${NIVEL_MAXIMO_EQUIPO}</div>`;
        } else {
          cuerpo=`<div class="med-card-dificultad">Dificultad ${Math.max(3, def.dificultad - bonusEstrellasTrabajador('mantenimiento'))}+</div>`;
        }
        return `
        <div class="med-card med-card-mantenimiento ${bloqueada?'med-card-bloqueada':''}" data-idx="${idx}">
          <button class="med-card-swap" data-swap="${idx}" title="${t('lm.tt_cambiar_carta')}" ${cambioDisponible?'':'disabled'}><i class="ph ph-bold ph-arrows-clockwise"></i></button>
          <div class="med-card-tag">${def.tipo==='nivel'?t('lm.tag_proyecto'):t('lm.tag_accion')}</div>
          <i class="ph ph-bold ${def.icon} med-card-icon"></i>
          <div class="med-card-title">${tc('mant', def.id, 'nombre', def.nombre)}</div>
          <div class="med-card-divider"></div>
          <div class="med-card-desc">${tc('mant', def.id, 'desc', def.desc)}</div>
          ${cuerpo}
          ${bloqueada?`<div class="med-card-bloqueada-label">${bloqueadaPorEstado?t('lm.necesita_aficion_descontenta'):(nivelMaximoYa?t('lm.especialidad_maxima'):t('lm.imposible_dados'))}</div>`:`<button class="mode-card-btn mode-card-btn-gold med-card-btn" data-usar="${idx}" style="padding:7px;font-size:11px">${t('lm.usar_btn')}</button>`}
        </div>`;
      }).join('');

      overlay.innerHTML=`
        <div class="lm-dilemma-card lm-dilemma-card-mant" style="max-width:640px">
          ${xCerrarHTML()}
          <div class="lm-dilemma-title"><i class="ph ph-bold ph-flag-pennant"></i> ${t('lm.titulo_mantenimiento')}</div>
          <button type="button" class="mode-card-btn mode-card-btn-gold" id="lmSeguridadEstadioBtn" style="width:100%;margin-bottom:10px"><i class="ph ph-bold ph-shield-check"></i> ${t('lm.seguridad_estadio')}</button>
          ${renderNivelesMantenimientoHTML()}
          <div class="lm-staff-bar-capital" style="justify-content:center;margin:10px 0 8px"><span><i class="ph ph-bold ph-dice-five"></i> ${t('lm.dados')}: <strong>${state.diceAvailable}</strong></span><span><i class="ph ph-bold ph-arrows-clockwise"></i> ${t('lm.rerrolls')}: <strong>${state.dadoRerollsDisponibles||0}</strong></span><span><i class="ph ph-bold ph-cards"></i> ${t('lm.cambios')}: <strong>${Math.max(0,lmCambiosCartaPorPartido()-(state.mantenimientoCambiosUsados||0))}/${lmCambiosCartaPorPartido()}</strong></span></div>
          <div class="med-card-grid">${cartasHTML}</div>
          <div class="lm-popup-actions lm-popup-actions-compact">
            ${mostrarInfoHTML()}
            <button id="lmMantenimientoCerrar" class="mode-card-btn mode-card-btn-secondary">${t('lm.cerrar')}</button>
          </div>
        </div>`;
        wireMostrarInfoHold(overlay, abrirEstadoEstadio, 'lmEstadoEstadioOverlay');
        const btnSeguridad=overlay.querySelector('#lmSeguridadEstadioBtn');
        if(btnSeguridad) btnSeguridad.addEventListener('click', ()=>{
          if(typeof window.playSound==='function') window.playSound('select');
          abrirSeguridadEstadio();
        });

      const xBtnMant=overlay.querySelector('[data-cerrar-x]');
      if(xBtnMant) xBtnMant.addEventListener('click', ()=>{ overlay.remove(); render(); });
      const cerrarBtn=document.getElementById('lmMantenimientoCerrar');
      if(cerrarBtn) cerrarBtn.addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        overlay.remove();
        render();
      });
      overlay.querySelectorAll('[data-swap]').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const idx=parseInt(btn.getAttribute('data-swap'),10);
          if((state.mantenimientoCambiosUsados||0)>=lmCambiosCartaPorPartido()) return;
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
            ${xCerrarHTML()}
            <i class="ph ph-bold ${def.icon}" style="font-size:26px;color:#5dcaa5"></i>
            <div class="lm-dilemma-title" style="justify-content:center;text-align:center">${tc('mant', def.id, 'nombre', def.nombre).toUpperCase()}</div>
            <div class="lm-dilemma-text">${tc('mant', def.id, 'desc', def.desc)}${def.tipo==='directa'?` — necesitas sumar <strong class="lm-dificultad-destacada">${Math.max(3, def.dificultad - bonusEstrellasTrabajador('mantenimiento'))}+</strong>`:` — necesitas sumar <strong class="lm-dificultad-destacada">${dificultadActualNivelM(def)}+</strong> para subir a nivel ${nivelDeM(def.track)+1}/${NIVEL_MAXIMO_EQUIPO}`}</div>
            <div class="lm-dice-selector">
              <button id="lmDiceMinus" class="lm-dice-stepper">−</button>
              <span id="lmDiceCount">${dadosElegidos}</span>
              <button id="lmDicePlus" class="lm-dice-stepper">+</button>
            </div>
            <div class="lm-setup-desc">dados disponibles: ${state.diceAvailable}</div>
            <div class="lm-popup-actions">
              <button id="lmTirarBtn" class="mode-card-btn mode-card-btn-gold" ${state.diceAvailable<1?'disabled':''}>TIRAR ${dadosElegidos} DADO${dadosElegidos>1?'S':''}</button>
              <button id="lmCancelarCartaBtn" class="lm-btn-cancelar">${t('lm.cancelar')}</button>
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
      const cartaObjetivo=cartaDefM(state.mantenimientoCartas[idx].cartaId);
      const dificultadObjetivo = cartaObjetivo.tipo==='directa'
        ? Math.max(3, cartaObjetivo.dificultad - bonusEstrellasTrabajador('mantenimiento'))
        : dificultadActualNivelM(cartaObjetivo);
      overlay.innerHTML=`
        <div class="lm-dilemma-card lm-dilemma-card-mant lm-dice-roll-card">
            ${xCerrarHTML()}
          <div class="lm-dilemma-title" id="lmDiceTitle" style="justify-content:center;text-align:center">TIRANDO ${numDados} DADO${numDados>1?'S':''}...</div>
          <div class="lm-dice-objetivo">${t('lm.necesitas_sumar')} <strong>${dificultadObjetivo}+</strong></div>
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
  function abrirEstadoEstadio(esModoMantener){
    const overlay=document.createElement('div');
    overlay.id='lmEstadoEstadioOverlay';
    const est=state.estadio||{campo:90, satisfaccion:0, aforoTotal:12000, ultimaAsistencia:null};
    const climaActual=climaDelPartido();
    const prevista=calcularAsistencia(climaActual?climaActual.id:null);
    const ultima=est.ultimaAsistencia;
    overlay.innerHTML=`
      <div class="lm-dilemma-card lm-dilemma-card-mant" style="max-width:480px;text-align:left">
        ${xCerrarHTML()}
        <div class="lm-dilemma-title"><i class="ph ph-bold ph-stadium"></i> ${t('lm.estado_estadio_titulo')}</div>
        <div class="lm-estadio-bars">
          <div>
            <div class="lm-estadio-bar-label"><i class="ph ph-bold ph-plant"></i><span>${t('lm.estado_cesped')}</span><span>${Math.round(est.campo)}/100</span></div>
            ${campoBarraHTML(est.campo)}
          </div>
          <div>
            <div class="lm-estadio-bar-label"><i class="ph ph-bold ph-users-three"></i><span>${t('lm.satisfaccion_de_la_afición')}</span><span>${est.satisfaccion>0?'+':''}${est.satisfaccion}</span></div>
            ${satisfaccionBarraHTML(est.satisfaccion)}
          </div>
          <div>
            <div class="lm-estadio-bar-label"><i class="ph ph-bold ph-trend-up"></i><span>${t('lm.moral_equipo')}</span><span>${(state.moral||0)>0?'+':''}${state.moral||0}</span></div>
            ${moralBarraHTML(state.moral||0)}
          </div>
        </div>
        <div class="lm-aforo-box">
          <i class="ph ph-bold ph-ticket lm-aforo-icon"></i>
          <div class="lm-aforo-info">
            <div class="lm-aforo-title"><span>${t('lm.aforo_estadio')}</span><strong>${est.aforoTotal.toLocaleString('es-ES')} asientos</strong></div>
            <div class="lm-aforo-bar-wrap"><div class="lm-aforo-bar-fill" style="width:${Math.round(prevista.pct*100)}%"></div></div>
            <div class="lm-aforo-nota">
              Previsión próximo partido en casa: <strong>${prevista.asistentes.toLocaleString('es-ES')}</strong> asientos (${Math.round(prevista.pct*100)}%)
              ${ultima?` · Último partido en casa (J${ultima.jornada}): <strong>${ultima.asistentes.toLocaleString('es-ES')}</strong> (${Math.round(ultima.pct*100)}%)`:''}
            </div>
          </div>
        </div>
        ${esModoMantener?'':`<div class="lm-popup-actions lm-popup-actions-compact">
          <button id="lmEstadoEstadioCerrar" class="mode-card-btn mode-card-btn-gold">${t('lm.cerrar')}</button>
        </div>`}
      </div>`;
    document.getElementById('ligaManagerScreen').appendChild(overlay);
    habilitarCierreOverlay(overlay, ()=>overlay.remove());
    const xBtnEstadio=overlay.querySelector('[data-cerrar-x]');
    if(xBtnEstadio) xBtnEstadio.addEventListener('click', ()=>overlay.remove());
    const btnCerrarEstadio=document.getElementById('lmEstadoEstadioCerrar');
    if(btnCerrarEstadio) btnCerrarEstadio.addEventListener('click', ()=>{
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
    habilitarCierreOverlay(overlay, ()=>{ overlay.remove(); render(); });
    // Delegado: cualquier X que aparezca dentro de este overlay en
    // cualquier pantalla (selector de dados, tirada, etc.) lo cierra.
    overlay.addEventListener('click', (e)=>{
      const xEl = e.target.closest && e.target.closest('[data-cerrar-x]');
      if(xEl){ if(typeof window.playSound==='function') window.playSound('select'); overlay.remove(); render(); }
    });

    function renderHub(){
      const cartasHTML=state.directorGeneralCartas.map((instancia,idx)=>{
        const def=cartaDefDG(instancia.cartaId);
        const dificultadEfectiva = def.tipo==='nivel' ? dificultadActualNivelDG(def) : Math.max(3, def.dificultad - bonusEstrellasTrabajador('directorGeneral'));
        const maxPosible = state.diceAvailable*6;
        const imposiblePorDados = maxPosible < dificultadEfectiva;
        const nivelMaximoYa = def.tipo==='nivel' && nivelDeDG(def.track)>=NIVEL_MAXIMO_EQUIPO;
        const bloqueada = imposiblePorDados || nivelMaximoYa;
        const cambioDisponible=(state.directorGeneralCambiosUsados||0)<lmCambiosCartaPorPartido();
        let cuerpo;
        if(def.tipo==='nivel'){
          const n=nivelDeDG(def.track);
          cuerpo=`<div class="med-card-progress-label" style="text-align:center;letter-spacing:2px;color:var(--gold)">${estrellasNivel(n)}</div>
                  <div class="med-card-dificultad">${t('lm.dificultad_lbl')} ${dificultadEfectiva}+ ${t('lm.para_subir_a_nivel')} ${n+1}/${NIVEL_MAXIMO_EQUIPO}</div>`;
        } else {
          cuerpo=`<div class="med-card-dificultad">Dificultad ${Math.max(3, def.dificultad - bonusEstrellasTrabajador('directorGeneral'))}+</div>`;
        }
        return `
        <div class="med-card med-card-dg ${bloqueada?'med-card-bloqueada':''}" data-idx="${idx}">
          <button class="med-card-swap" data-swap="${idx}" title="${t('lm.tt_cambiar_carta')}" ${cambioDisponible?'':'disabled'}><i class="ph ph-bold ph-arrows-clockwise"></i></button>
          <div class="med-card-tag">${def.tipo==='nivel'?t('lm.tag_proyecto'):t('lm.tag_accion')}</div>
          <i class="ph ph-bold ${def.icon} med-card-icon"></i>
          <div class="med-card-title">${tc('dg', def.id, 'nombre', def.nombre)}</div>
          <div class="med-card-divider"></div>
          <div class="med-card-desc">${tc('dg', def.id, 'desc', def.desc)}</div>
          ${cuerpo}
          ${bloqueada?`<div class="med-card-bloqueada-label">${nivelMaximoYa?t('lm.especialidad_maxima'):t('lm.imposible_dados')}</div>`:`<button class="mode-card-btn mode-card-btn-gold med-card-btn" data-usar="${idx}" style="padding:7px;font-size:11px">${t('lm.usar_btn')}</button>`}
        </div>`;
      }).join('');

      overlay.innerHTML=`
        <div class="lm-dilemma-card lm-dilemma-card-dg" style="max-width:640px">
          ${xCerrarHTML()}
          <div class="lm-dilemma-title"><i class="ph ph-bold ph-briefcase"></i> ${t('lm.titulo_dg')}</div>
          <div class="lm-capital-box">
            <i class="ph ph-bold ph-coins lm-capital-icon"></i>
            <div class="lm-capital-info">
              <div class="lm-capital-title"><span>${t('lm.capital_del_club')}</span><strong class="${(state.capital||0)<0?'lm-capital-neg':''}">${formatoDinero(state.capital)}</strong></div>
              <div class="lm-aforo-nota">Próxima nómina en la jornada ${Math.max(1,(state.mesesPagados||0)*4+1)}</div>
            </div>
          </div>
          <div class="lm-precio-box">
            <div class="lm-estadio-bar-label"><i class="ph ph-bold ph-ticket"></i><span>${t('lm.precio_de_la_entrada')}</span><span>${formatoDinero(state.precioEntrada)}</span></div>
            <input type="range" id="lmPrecioEntradaSlider" min="5" max="60" step="1" value="${state.precioEntrada}" class="lm-precio-slider">
            <div class="lm-aforo-nota">Más caro = más ingreso por entrada, pero menos afición vendrá a verte (se nota menos cuanto más nivel tengas en Relaciones con la Afición).</div>
          </div>
          ${renderNivelesDGHTML()}
          <div class="lm-staff-bar-capital" style="justify-content:center;margin:10px 0 8px"><span><i class="ph ph-bold ph-dice-five"></i> ${t('lm.dados')}: <strong>${state.diceAvailable}</strong></span><span><i class="ph ph-bold ph-arrows-clockwise"></i> ${t('lm.rerrolls')}: <strong>${state.dadoRerollsDisponibles||0}</strong></span><span><i class="ph ph-bold ph-cards"></i> ${t('lm.cambios')}: <strong>${Math.max(0,lmCambiosCartaPorPartido()-(state.directorGeneralCambiosUsados||0))}/${lmCambiosCartaPorPartido()}</strong></span></div>
          <div class="med-card-grid">${cartasHTML}</div>
          <div class="lm-popup-actions lm-popup-actions-compact">
            ${(state.quinielaBoleto&&!state.quinielaBoleto.rellenado)?`<button type="button" class="mode-card-btn mode-card-btn-secondary lm-pendientes-indicador" id="lmQuinielaPendienteBtn"><i class="ph ph-bold ph-ticket lm-pendientes-pulso"></i> ${t('lm.quiniela_pendiente')}</button>`:''}
            ${mostrarInfoHTML()}
            <button id="lmDirectorGeneralCerrar" class="mode-card-btn mode-card-btn-secondary">${t('lm.cerrar')}</button>
          </div>
        </div>`;
        wireMostrarInfoHold(overlay, abrirFinanzasDG, 'lmFinanzasOverlay');

      const slider=document.getElementById('lmPrecioEntradaSlider');
      if(slider) slider.addEventListener('change', ()=>{
        state.precioEntrada=parseInt(slider.value,10);
        if(typeof window.playSound==='function') window.playSound('select');
        guardarEstado();
        renderHub();
      });
      const xBtnDG=overlay.querySelector('[data-cerrar-x]');
      if(xBtnDG) xBtnDG.addEventListener('click', ()=>{ overlay.remove(); render(); });
      const btnQuinielaPendiente=document.getElementById('lmQuinielaPendienteBtn');
      if(btnQuinielaPendiente) btnQuinielaPendiente.addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        overlay.remove();
        abrirBoletoQuiniela();
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
          if((state.directorGeneralCambiosUsados||0)>=lmCambiosCartaPorPartido()) return;
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
            ${xCerrarHTML()}
            <i class="ph ph-bold ${def.icon}" style="font-size:26px;color:#e6c94a"></i>
            <div class="lm-dilemma-title" style="justify-content:center;text-align:center">${tc('dg', def.id, 'nombre', def.nombre).toUpperCase()}</div>
            <div class="lm-dilemma-text">${tc('dg', def.id, 'desc', def.desc)}${def.tipo==='directa'?` — necesitas sumar <strong class="lm-dificultad-destacada">${Math.max(3, def.dificultad - bonusEstrellasTrabajador('directorGeneral'))}+</strong>`:` — necesitas sumar <strong class="lm-dificultad-destacada">${dificultadActualNivelDG(def)}+</strong> para subir a nivel ${nivelDeDG(def.track)+1}/${NIVEL_MAXIMO_EQUIPO}`}</div>
            <div class="lm-dice-selector">
              <button id="lmDiceMinus" class="lm-dice-stepper">−</button>
              <span id="lmDiceCount">${dadosElegidos}</span>
              <button id="lmDicePlus" class="lm-dice-stepper">+</button>
            </div>
            <div class="lm-setup-desc">dados disponibles: ${state.diceAvailable}</div>
            <div class="lm-popup-actions">
              <button id="lmTirarBtn" class="mode-card-btn mode-card-btn-gold" ${state.diceAvailable<1?'disabled':''}>TIRAR ${dadosElegidos} DADO${dadosElegidos>1?'S':''}</button>
              <button id="lmCancelarCartaBtn" class="lm-btn-cancelar">${t('lm.cancelar')}</button>
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
      const cartaObjetivo=cartaDefDG(state.directorGeneralCartas[idx].cartaId);
      const dificultadObjetivo = cartaObjetivo.tipo==='directa'
        ? Math.max(3, cartaObjetivo.dificultad - bonusEstrellasTrabajador('directorGeneral'))
        : dificultadActualNivelDG(cartaObjetivo);
      overlay.innerHTML=`
        <div class="lm-dilemma-card lm-dilemma-card-dg lm-dice-roll-card">
            ${xCerrarHTML()}
          <div class="lm-dilemma-title" id="lmDiceTitle" style="justify-content:center;text-align:center">TIRANDO ${numDados} DADO${numDados>1?'S':''}...</div>
          <div class="lm-dice-objetivo">${t('lm.necesitas_sumar')} <strong>${dificultadObjetivo}+</strong></div>
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
    {track:'aforoExtra',          get label(){return t('nivel.dg.grada.label');},   icon:'ph-stairs',       get desc(){return t('nivel.dg.grada.desc');}},
    {track:'ingresoPatrocinio',   get label(){return t('nivel.dg.patrocinadores.label');},        icon:'ph-handshake',    get desc(){return t('nivel.dg.patrocinadores.desc');}},
    {track:'ingresoMerchandising',get label(){return t('nivel.dg.tienda.label');},icon:'ph-t-shirt',      get desc(){return t('nivel.dg.tienda.desc');}},
    {track:'toleranciaPrecio',    get label(){return t('nivel.dg.relaciones.label');},icon:'ph-users-three',get desc(){return t('nivel.dg.relaciones.desc');}}
  ];
  function renderNivelesDGHTML(){
    return `<div class="med-niveles-grid">${NIVELES_DG_INFO.map(info=>{
      const n=nivelDeDG(info.track);
      const completado=n>=NIVEL_MAXIMO_EQUIPO;
      return `<div class="med-nivel-row${completado?' med-nivel-completado':''}">
        ${completado?`<i class="ph ph-bold ph-check-circle med-nivel-check" title="${t('lm.tt_proyecto_completado')}"></i>`:''}
        <i class="ph ph-bold ${info.icon}"></i>
        <div class="med-nivel-info">
          <div class="med-nivel-label">${info.label}</div>
          <div class="med-nivel-desc">${info.desc}</div>
        </div>
        <div class="med-nivel-stars" title="${t('lm.nivel_n_de_x')} ${n}/${NIVEL_MAXIMO_EQUIPO}">${estrellasNivel(n)}</div>
      </div>`;
    }).join('')}</div>`;
  }

  const NIVELES_DD_INFO=[
    {track:'calidadOjeo',     get label(){return t('nivel.dd.red_ojeadores.label');},        icon:'ph-binoculars',      get desc(){return t('nivel.dd.red_ojeadores.desc');}},
    {track:'ahorroSalarial',  get label(){return t('nivel.dd.negociacion.label');},icon:'ph-handshake',       get desc(){return t('nivel.dd.negociacion.desc');}},
    {track:'sobresFichajes',  get label(){return t('nivel.dd.red_activa.label');}, icon:'ph-envelope-open',   get desc(){return t('nivel.dd.red_activa.desc');}},
    {track:'costeSobres',     get label(){return t('nivel.dd.cantera.label');},    icon:'ph-graduation-cap',  get desc(){return t('nivel.dd.cantera.desc');}}
  ];
  function renderNivelesDDHTML(){
    return `<div class="med-niveles-grid">${NIVELES_DD_INFO.map(info=>{
      const n=nivelDeDD(info.track);
      const completado=n>=NIVEL_MAXIMO_EQUIPO;
      return `<div class="med-nivel-row${completado?' med-nivel-completado':''}">
        ${completado?`<i class="ph ph-bold ph-check-circle med-nivel-check" title="${t('lm.tt_proyecto_completado')}"></i>`:''}
        <i class="ph ph-bold ${info.icon}"></i>
        <div class="med-nivel-info">
          <div class="med-nivel-label">${info.label}</div>
          <div class="med-nivel-desc">${info.desc}</div>
        </div>
        <div class="med-nivel-stars" title="${t('lm.nivel_n_de_x')} ${n}/${NIVEL_MAXIMO_EQUIPO}">${estrellasNivel(n)}</div>
      </div>`;
    }).join('')}</div>`;
  }

  /* ---------- 13e. Finanzas del Director General — burbuja "i": tabla
     mensual de ingresos/gastos con mini barras, agrupada por mes. ---------- */
  function abrirFinanzasDG(esModoMantener){
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
    let filaMesActual=`<p class="lm-setup-desc" style="text-align:center">${t('lm.sin_movimientos_mes')}</p>`;
    if(mesActual!==undefined){
      const d=meses[mesActual];
      const neto=d.ingresos-d.gastos;
      const maxValor=Math.max(1, d.ingresos, d.gastos);
      filaMesActual=`<div class="lm-fin-mes">
        <div class="lm-fin-mes-title"><span>MES ${mesActual} (ACTUAL)</span><span style="color:${neto>=0?'#5dcaa5':'#e24b4a'}">${neto>=0?'+':''}${formatoDinero(neto)}</span></div>
        <div class="lm-fin-bar-row"><span class="lm-fin-bar-label">${t('lm.ingresos')}</span><div class="lm-fin-bar-wrap"><div class="lm-fin-bar-fill lm-fin-bar-ingreso" style="width:${Math.round(d.ingresos/maxValor*100)}%"></div></div><span class="lm-fin-bar-valor">${formatoDinero(d.ingresos)}</span></div>
        <div class="lm-fin-bar-row"><span class="lm-fin-bar-label">${t('lm.gastos')}</span><div class="lm-fin-bar-wrap"><div class="lm-fin-bar-fill lm-fin-bar-gasto" style="width:${Math.round(d.gastos/maxValor*100)}%"></div></div><span class="lm-fin-bar-valor">${formatoDinero(d.gastos)}</span></div>
      </div>`;
    }
    // Histórico de meses anteriores — gráfico de barras (neto por mes),
    // en vez de repetir la misma tabla detallada para cada mes.
    let graficoHistorico=`<p class="lm-setup-desc" style="text-align:center">${t('lm.sin_historico_meses')}</p>`;
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
        ${xCerrarHTML()}
        <div class="lm-dilemma-title"><i class="ph ph-bold ph-chart-line-up"></i> ${t('lm.finanzas_club_titulo')}</div>
        <div class="lm-capital-box" style="margin-bottom:12px">
          <i class="ph ph-bold ph-coins lm-capital-icon"></i>
          <div class="lm-capital-info">
            <div class="lm-capital-title"><span>${t('lm.capital_actual')}</span><strong class="${(state.capital||0)<0?'lm-capital-neg':''}">${formatoDinero(state.capital)}</strong></div>
          </div>
        </div>
        ${filaMesActual}
        <p class="lm-setup-desc" style="text-align:left;margin:12px 0 4px">${t('lm.historico_meses_anteriores')}</p>
        ${graficoHistorico}
        ${esModoMantener?'':`<div class="lm-popup-actions lm-popup-actions-compact">
          <button id="lmFinanzasCerrar" class="mode-card-btn mode-card-btn-gold">${t('lm.cerrar')}</button>
        </div>`}
      </div>`;
    document.getElementById('ligaManagerScreen').appendChild(overlay);
    habilitarCierreOverlay(overlay, ()=>overlay.remove());
    const xBtnFin=overlay.querySelector('[data-cerrar-x]');
    if(xBtnFin) xBtnFin.addEventListener('click', ()=>overlay.remove());
    const btnCerrarFin=document.getElementById('lmFinanzasCerrar');
    if(btnCerrarFin) btnCerrarFin.addEventListener('click', ()=>{
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
    habilitarCierreOverlay(overlay, ()=>{ overlay.remove(); render(); });
    // Delegado: cualquier X que aparezca dentro de este overlay en
    // cualquier pantalla (selector de dados, tirada, etc.) lo cierra.
    overlay.addEventListener('click', (e)=>{
      const xEl = e.target.closest && e.target.closest('[data-cerrar-x]');
      if(xEl){ if(typeof window.playSound==='function') window.playSound('select'); overlay.remove(); render(); }
    });

    function renderHub(){
      const nivelSobre=nivelDeDD('sobresFichajes');
      const cartasHTML=state.directorDeportivoCartas.map((instancia,idx)=>{
        const def=cartaDefDD(instancia.cartaId);
        const esSobre=def.tipo==='sobre';
        const dificultadEfectiva = (def.tipo==='nivel'||esSobre) ? dificultadActualNivelDD(def) : Math.max(3, def.dificultad - bonusEstrellasTrabajador('directorDeportivo'));
        const maxPosible = state.diceAvailable*6;
        const imposiblePorDados = maxPosible < dificultadEfectiva;
        const nivelActualTrack = (def.tipo==='nivel'||esSobre) ? nivelDeDD(def.track) : 0;
        const nivelMaximoYa = (def.tipo==='nivel'||esSobre) && nivelActualTrack>=NIVEL_MAXIMO_EQUIPO;
        const bloqueada = imposiblePorDados || nivelMaximoYa;
        const cambioDisponible=(state.directorDeportivoCambiosUsados||0)<lmCambiosCartaPorPartido();
        let cuerpo;
        if(def.tipo==='nivel'||esSobre){
          cuerpo=`<div class="med-card-progress-label" style="text-align:center;letter-spacing:2px;color:var(--gold)">${estrellasNivel(nivelActualTrack)}</div>
                  <div class="med-card-dificultad">${nivelMaximoYa?t('lm.nivel_maximo_alcanzado'):`${t('lm.dificultad_lbl')} ${dificultadEfectiva}+ ${t('lm.para_subir_a_nivel')} ${nivelActualTrack+1}/${NIVEL_MAXIMO_EQUIPO}`}</div>`;
        } else {
          cuerpo=`<div class="med-card-dificultad">Dificultad ${Math.max(3, def.dificultad - bonusEstrellasTrabajador('directorDeportivo'))}+</div>`;
        }
        const botonAccion = bloqueada
          ? (nivelMaximoYa ? '' : `<div class="med-card-bloqueada-label">${t('lm.imposible_dados')}</div>`)
          : `<button class="mode-card-btn mode-card-btn-gold med-card-btn" data-usar="${idx}" style="padding:7px;font-size:11px">${t('lm.usar_btn')}</button>`;
        return `
        <div class="med-card med-card-dd ${bloqueada&&!nivelMaximoYa?'med-card-bloqueada':''}" data-idx="${idx}">
          <button class="med-card-swap" data-swap="${idx}" title="${t('lm.tt_cambiar_carta')}" ${cambioDisponible?'':'disabled'}><i class="ph ph-bold ph-arrows-clockwise"></i></button>
          <div class="med-card-tag">${def.tipo==='nivel'?t('lm.tag_proyecto'):t('lm.tag_accion')}</div>
          <i class="ph ph-bold ${def.icon} med-card-icon"></i>
          <div class="med-card-title">${tc('dd', def.id, 'nombre', def.nombre)}</div>
          <div class="med-card-divider"></div>
          <div class="med-card-desc">${tc('dd', def.id, 'desc', def.desc)}</div>
          ${cuerpo}
          ${botonAccion}
        </div>`;
      }).join('');

      overlay.innerHTML=`
        <div class="lm-dilemma-card lm-dilemma-card-dd" style="max-width:640px">
          ${xCerrarHTML()}
          <div class="lm-dilemma-title"><i class="ph ph-bold ph-binoculars"></i> ${t('lm.titulo_dd')}</div>
          <button type="button" class="mode-card-btn mode-card-btn-gold" id="lmInfoPlantillaDDBtn" style="width:100%;margin:10px 0"><i class="ph ph-bold ph-scroll"></i> ${t('lm.info_plantilla_btn')}</button>
          <div class="lm-precio-box">
            <div class="lm-estadio-bar-label"><i class="ph ph-bold ph-magnifying-glass"></i><span>${t('lm.posicion_objetivo_ojeadores')}</span></div>
            <select id="lmPosicionOjeoSelect" class="lm-ojeo-select">
              <option value="any" ${(!state.posicionObjetivoOjeo||state.posicionObjetivoOjeo==='any')?'selected':''}>${t('lm.cualquiera_defecto')}</option>
              ${['POR','DFC','LI','LD','MC','EI','ED','DC'].map(p=>`<option value="${p}" ${state.posicionObjetivoOjeo===p?'selected':''}>${p}</option>`).join('')}
            </select>
            <div class="lm-aforo-nota">Los ojeadores se centrarán en esta posición para los próximos sobres que abras.</div>
          </div>
          ${renderNivelesDDHTML()}
          <div class="lm-staff-bar-capital" style="justify-content:center;margin:10px 0 8px"><span><i class="ph ph-bold ph-dice-five"></i> ${t('lm.dados')}: <strong>${state.diceAvailable}</strong></span><span><i class="ph ph-bold ph-arrows-clockwise"></i> ${t('lm.rerrolls')}: <strong>${state.dadoRerollsDisponibles||0}</strong></span><span><i class="ph ph-bold ph-cards"></i> ${t('lm.cambios')}: <strong>${Math.max(0,lmCambiosCartaPorPartido()-(state.directorDeportivoCambiosUsados||0))}/${lmCambiosCartaPorPartido()}</strong></span></div>
          <div class="med-card-grid">${cartasHTML}</div>
          <div class="lm-popup-actions lm-popup-actions-compact">
            ${(state.sobresFichajesPendientes&&state.sobresFichajesPendientes.length)?`<button type="button" class="mode-card-btn mode-card-btn-secondary lm-pendientes-indicador" id="lmSobresPendientesBtn"><i class="ph ph-bold ph-envelope-simple-open lm-pendientes-pulso"></i> ${t('lm.sobres_pendientes')} ${state.sobresFichajesPendientes.length}/3</button>`:''}
            ${mostrarInfoHTML()}
            <button id="lmDirectorDeportivoCerrar" class="mode-card-btn mode-card-btn-secondary">${t('lm.cerrar')}</button>
          </div>
        </div>`;
        wireMostrarInfoHold(overlay, abrirHistorialFichajesDD, 'lmHistorialFichajesDDOverlay');
        const btnInfoPlantillaDD=overlay.querySelector('#lmInfoPlantillaDDBtn');
        if(btnInfoPlantillaDD) btnInfoPlantillaDD.addEventListener('click', ()=>{
          if(typeof window.playSound==='function') window.playSound('select');
          abrirSalariosDD(false);
        });

      const xBtnDD=overlay.querySelector('[data-cerrar-x]');
      const posicionOjeoSelect=document.getElementById('lmPosicionOjeoSelect');
      if(posicionOjeoSelect) posicionOjeoSelect.addEventListener('change', ()=>{
        state.posicionObjetivoOjeo=posicionOjeoSelect.value;
        if(typeof window.playSound==='function') window.playSound('select');
        guardarEstado();
      });
      if(xBtnDD) xBtnDD.addEventListener('click', ()=>{ overlay.remove(); render(); });
      const btnSobresPendientes=document.getElementById('lmSobresPendientesBtn');
      if(btnSobresPendientes) btnSobresPendientes.addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        const lista=state.sobresFichajesPendientes||[];
        if(!lista.length) return;
        const sobreId=lista[lista.length-1].id;
        const jugadores=abrirSobrePorId(sobreId);
        if(!jugadores){ render(); return; }
        mostrarRevelacionSobreDesdeCorreo(jugadores, ()=>{ guardarEstado(); overlay.remove(); render(); });
      });
      const cerrarBtn=document.getElementById('lmDirectorDeportivoCerrar');
      if(cerrarBtn) cerrarBtn.addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        overlay.remove();
        render();
      });
      overlay.querySelectorAll('[data-swap]').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const idx=parseInt(btn.getAttribute('data-swap'),10);
          if((state.directorDeportivoCambiosUsados||0)>=lmCambiosCartaPorPartido()) return;
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
    }

    function renderSelectorCarta(idx){
      const def=cartaDefDD(state.directorDeportivoCartas[idx].cartaId);
      const esSobre=def.tipo==='sobre';
      let dadosElegidos=Math.min(1, state.diceAvailable);
      function pintar(){
        overlay.innerHTML=`
          <div class="lm-dilemma-card lm-dilemma-card-dd">
            ${xCerrarHTML()}
            <i class="ph ph-bold ${def.icon}" style="font-size:26px;color:#c9c9c9"></i>
            <div class="lm-dilemma-title" style="justify-content:center;text-align:center">${tc('dd', def.id, 'nombre', def.nombre).toUpperCase()}</div>
            <div class="lm-dilemma-text">${tc('dd', def.id, 'desc', def.desc)}${def.tipo==='directa'?` — necesitas sumar <strong class="lm-dificultad-destacada">${Math.max(3, def.dificultad - bonusEstrellasTrabajador('directorDeportivo'))}+</strong>`:` — necesitas sumar <strong class="lm-dificultad-destacada">${dificultadActualNivelDD(def)}+</strong> para subir a nivel ${nivelDeDD(def.track)+1}/${NIVEL_MAXIMO_EQUIPO}`}</div>
            <div class="lm-dice-selector">
              <button id="lmDiceMinus" class="lm-dice-stepper">−</button>
              <span id="lmDiceCount">${dadosElegidos}</span>
              <button id="lmDicePlus" class="lm-dice-stepper">+</button>
            </div>
            <div class="lm-setup-desc">dados disponibles: ${state.diceAvailable}</div>
            <div class="lm-popup-actions">
              <button id="lmTirarBtn" class="mode-card-btn mode-card-btn-gold" ${state.diceAvailable<1?'disabled':''}>TIRAR ${dadosElegidos} DADO${dadosElegidos>1?'S':''}</button>
              <button id="lmCancelarCartaBtn" class="lm-btn-cancelar">${t('lm.cancelar')}</button>
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
      const cartaObjetivo=cartaDefDD(state.directorDeportivoCartas[idx].cartaId);
      const dificultadObjetivo = cartaObjetivo.tipo==='directa'
        ? Math.max(3, cartaObjetivo.dificultad - bonusEstrellasTrabajador('directorDeportivo'))
        : dificultadActualNivelDD(cartaObjetivo);
      overlay.innerHTML=`
        <div class="lm-dilemma-card lm-dilemma-card-dd lm-dice-roll-card">
            ${xCerrarHTML()}
          <div class="lm-dilemma-title" id="lmDiceTitle" style="justify-content:center;text-align:center">TIRANDO ${numDados} DADO${numDados>1?'S':''}...</div>
          <div class="lm-dice-objetivo">${t('lm.necesitas_sumar')} <strong>${dificultadObjetivo}+</strong></div>
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
              mostrarRevelacionSobreDesdeCorreo(resultado.sobreAbierto, renderHub);
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
        <div class="lm-dilemma-card lm-dilemma-card-dd" style="max-width:640px">
          <div class="lm-dilemma-title"><i class="ph ph-bold ph-envelope-open"></i> ${t('lm.sobre_titulo')}</div>
          <div id="lmSobreReveloZone" class="lm-sobre-grid">
            ${jugadores.map((j,i)=>`<div class="slot-reel lm-sobre-reel" id="lmSobreReel${i}"><div class="slot-strip lm-sobre-face">?</div></div>`).join('')}
          </div>
          <div id="lmSobreResultado"></div>
        </div>`;
      let ticks=0;
      const totalTicks=11+Math.floor(Math.random()*4);
      // Se barajan NOMBRES de jugador al azar (no posiciones): lo que se
      // está sorteando es a qué jugador vas a fichar, no en qué posición
      // va a jugar (eso ya lo trae fijo cada carta del sobre).
      const spin=setInterval(()=>{
        jugadores.forEach((j,i)=>{
          const el=document.getElementById('lmSobreReel'+i);
          if(el) el.querySelector('.lm-sobre-face').textContent=nombreJugadorAleatorio();
        });
        if(typeof window.playSound==='function') window.playSound('spin');
        ticks++;
        if(ticks>=totalTicks){
          clearInterval(spin);
          if(typeof window.playSound==='function') window.playSound('reveal');
          // La fila de barajado ya no hace falta — el resultado real se
          // pinta debajo con las fichas completas; si se deja aquí se
          // queda "temblando" para siempre (la animación de pulso no se
          // detiene sola).
          const zonaReels=document.getElementById('lmSobreReveloZone');
          if(zonaReels) zonaReels.innerHTML='';
          const zona=document.getElementById('lmSobreResultado');
          zona.innerHTML=`<div class="lm-sobre-cards">${jugadores.map((j,i)=>`
            <div class="lm-sobre-card" data-jugador="${i}">
              <div class="lm-sobre-pos">${j.position}</div>
              <div class="lm-sobre-nombre">${j.name}</div>
              <div class="lm-sobre-overall">${j.overall} <span>${t('lm.puntuacion')}</span></div>
              ${(typeof lmSkillActiva==='function' && lmSkillActiva('lm_ojo_clinico')) ? `<div class="lm-sobre-potencial"><i class="ph ph-bold ph-binoculars"></i> ${t('lm.potencial_techo')}: <b>${j.potencial||j.overall}</b></div>` : ''}
              <div class="lm-sobre-stats">
                <span>ATA ${j.attack}</span><span>DEF ${j.defense}</span><span>RIT ${j.pace}</span>
                <span>PAS ${j.passing}</span><span>TEC ${j.technique}</span>
              </div>
              <div class="lm-sobre-salario">${formatoDinero(j.salario)}/mes</div>
              <button class="mode-card-btn mode-card-btn-gold lm-sobre-fichar" data-fichar="${i}">${t('lm.fichar_btn')}</button>
            </div>`).join('')}</div>
            <div class="lm-popup-actions" style="margin-top:12px"><button id="lmSobreCerrar" class="mode-card-btn mode-card-btn-secondary">${t('lm.cerrar_sobre')}</button></div>`;
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
  function abrirHistorialFichajesDD(esModoMantener){
    const overlay=document.createElement('div');
    overlay.id='lmHistorialFichajesDDOverlay';
    const historial=state.directorDeportivoHistorial||[];
    overlay.innerHTML=`
      <div class="lm-dilemma-card lm-dilemma-card-dd" style="max-width:520px;text-align:left">
        ${esModoMantener?'':xCerrarHTML()}
        <div class="lm-dilemma-title"><i class="ph ph-bold ph-clock-counter-clockwise"></i> ${t('lm.historico_fichajes_titulo')}</div>
        ${historial.length ? `
        <div class="lm-historial-dd-lista">
          ${historial.slice(0,12).map(h=>`
            <div class="lm-historial-dd-item ${h.tipo==='venta'?'lm-historial-dd-venta':'lm-historial-dd-fichaje'}">
              <i class="ph ph-bold ${h.tipo==='venta'?'ph-arrow-circle-up':'ph-arrow-circle-down'}"></i>
              <div class="lm-historial-dd-texto">
                ${h.tipo==='venta'
                  ? `Vendiste a <strong>${h.nombre}</strong> (${h.position}, ${h.overall}) a ${h.destino} por <strong>${formatoDinero(h.monto)}</strong>`
                  : `Fichaste a <strong>${h.nombre}</strong> (${h.position}, ${h.overall})${h.estrella?` — fichaje estrella, procedente de ${h.procedencia}`:' desde un sobre'}`}
              </div>
              <span class="lm-historial-dd-jornada">J${h.jornada}</span>
            </div>`).join('')}
        </div>` : `<div class="lm-historial-dd-vacio">${t('lm.sin_fichajes_ventas')}</div>`}
        ${esModoMantener?'':`<div class="lm-popup-actions lm-popup-actions-compact"><button id="lmHistorialFichajesDDCerrar" class="mode-card-btn mode-card-btn-gold">${t('lm.cerrar')}</button></div>`}
      </div>`;
    document.getElementById('ligaManagerScreen').appendChild(overlay);
    if(!esModoMantener){
      habilitarCierreOverlay(overlay, ()=>overlay.remove());
      const xBtn=overlay.querySelector('[data-cerrar-x]');
      if(xBtn) xBtn.addEventListener('click', ()=>overlay.remove());
      const btnCerrar=document.getElementById('lmHistorialFichajesDDCerrar');
      if(btnCerrar) btnCerrar.addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        overlay.remove();
      });
    }
  }
  function abrirSalariosDD(esModoMantener){
    const overlay=document.createElement('div');
    overlay.id='lmSalariosOverlay';
    function pintar(){
      const jugadores=[...(state.plantilla||[])].sort((a,b)=>(b.salario||0)-(a.salario||0));
      const totalNomina=jugadores.reduce((s,p)=>s+(p.salario||0),0);
      const filas=jugadores.map(p=>{
        const chequeo=puedeVenderJugador(p.id);
        let accion;
        if(p.enVenta){
          accion=`<span class="lm-venta-estado">EN VENTA (J${p.ventaResolverJornada})</span> <button class="lm-salario-btn lm-salario-btn-retirar" data-retirar-venta="${p.id}">${t('lm.retirar')}</button>`;
        } else {
          accion=`<button class="lm-salario-btn" data-venta="${p.id}" title="${chequeo.ok?'':chequeo.motivo}" ${chequeo.ok?'':'disabled'}>${t('lm.poner_en_venta')}</button>`;
        }
        return `<tr>
          <td>${p.name}${p.injured?` <span class="cross" title="${t('lm.tt_lesionado')}">✚</span>`:''}</td>
          <td>${p.position}</td>
          <td>${p.overall}</td>
          <td>${formatoDinero(p.salario||0)}</td>
          <td class="lm-salario-accion-td">${accion}</td>
        </tr>`;
      }).join('');
      overlay.innerHTML=`
        <div class="lm-dilemma-card lm-dilemma-card-dd" style="max-width:640px;text-align:left">
          ${xCerrarHTML()}
          <div class="lm-dilemma-title"><i class="ph ph-bold ph-file-text"></i> SALARIOS DE LA PLANTILLA</div>
          <div class="lm-setup-desc" style="text-align:center;margin-bottom:8px">${t('lm.nomina_total')} <strong>${formatoDinero(totalNomina)}/mes</strong> · plantilla: <strong>${jugadores.length}</strong> · al poner en venta, el Director Deportivo avisará por correo en 1-3 jornadas con las ofertas que lleguen.</div>
          <div class="lm-salarios-tabla-wrap">
            <table class="lm-salarios-tabla">
              <thead><tr><th>${t('lm.tabla_jugador')}</th><th>Pos</th><th>${t('lm.tabla_punt')}</th><th>${t('lm.tabla_salario')}</th><th></th></tr></thead>
              <tbody>${filas || `<tr><td colspan="5" style="text-align:center">${t('lm.sin_jugadores_plantilla')}</td></tr>`}</tbody>
            </table>
          </div>
          <div class="lm-popup-actions lm-popup-actions-compact">
            ${esModoMantener?'':`<button id="lmSalariosCerrar" class="mode-card-btn mode-card-btn-gold">${t('lm.cerrar')}</button>`}
          </div>
        </div>`;
      const xBtnSal=overlay.querySelector('[data-cerrar-x]');
      if(xBtnSal) xBtnSal.addEventListener('click', ()=>overlay.remove());
      const btnCerrarSal=document.getElementById('lmSalariosCerrar');
      if(btnCerrarSal) btnCerrarSal.addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        overlay.remove();
      });
      overlay.querySelectorAll('[data-venta]').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const jugadorId=btn.getAttribute('data-venta');
          const jugador=(state.plantilla||[]).find(p=>p.id===jugadorId);
          if(!jugador) return;
          const proceder=()=>{
            const r=ponerJugadorEnVenta(jugadorId);
            if(typeof window.playSound==='function') window.playSound('select');
            if(!r.ok && r.motivo) mostrarAvisoJuego(r.motivo);
            pintar();
          };
          if(typeof window.showConfirmPopup==='function'){
            window.showConfirmPopup(`¿Poner a ${jugador.name} en venta? En 1-3 jornadas el Director Deportivo te avisará por correo de las ofertas que lleguen.`, proceder, 'PONER EN VENTA');
          } else if(confirm(`¿Poner a ${jugador.name} en venta?`)){
            proceder();
          }
        });
      });
      overlay.querySelectorAll('[data-retirar-venta]').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const jugadorId=btn.getAttribute('data-retirar-venta');
          if(typeof window.playSound==='function') window.playSound('select');
          quitarJugadorDeVenta(jugadorId);
          pintar();
        });
      });
    }
    document.getElementById('ligaManagerScreen').appendChild(overlay);
    habilitarCierreOverlay(overlay, ()=>overlay.remove());
    pintar();
  }

  const NIVELES_PF_INFO=[
    {track:'resistenciaBase',     get label(){return t('nivel.pf.resistencia.label');}, icon:'ph-heartbeat',       get desc(){return t('nivel.pf.resistencia.desc');}},
    {track:'recuperacionSemanal', get label(){return t('nivel.pf.recuperacion.label');},    icon:'ph-clock-clockwise', get desc(){return t('nivel.pf.recuperacion.desc');}},
    {track:'potencialTecnico',    get label(){return t('nivel.pf.tecnico.label');},       icon:'ph-soccer-ball',     get desc(){return t('nivel.pf.tecnico.desc');}},
    {track:'potencialFisico',     get label(){return t('nivel.pf.fisico.label');},        icon:'ph-lightning',       get desc(){return t('nivel.pf.fisico.desc');}}
  ];
  function renderNivelesPFHTML(){
    return `<div class="med-niveles-grid">${NIVELES_PF_INFO.map(info=>{
      const n=nivelDePF(info.track);
      const completado=n>=NIVEL_MAXIMO_EQUIPO;
      return `<div class="med-nivel-row${completado?' med-nivel-completado':''}">
        ${completado?`<i class="ph ph-bold ph-check-circle med-nivel-check" title="${t('lm.tt_proyecto_completado')}"></i>`:''}
        <i class="ph ph-bold ${info.icon}"></i>
        <div class="med-nivel-info">
          <div class="med-nivel-label">${info.label}</div>
          <div class="med-nivel-desc">${info.desc}</div>
        </div>
        <div class="med-nivel-stars" title="${t('lm.nivel_n_de_x')} ${n}/${NIVEL_MAXIMO_EQUIPO}">${estrellasNivel(n)}</div>
      </div>`;
    }).join('')}</div>`;
  }
  // Resumen compacto del PLAN DE ENTRENAMIENTO — los hasta 3 jugadores
  // elegidos son los únicos que mejoran de verdad al marcar días de
  // entrenamiento en el calendario.
  const STATS_ENTRENO=[
    {key:'attack', label:'Ataque',   icon:'ph-sword'},
    {key:'defense', label:'Defensa', icon:'ph-shield'},
    {key:'pace', label:'Ritmo',      icon:'ph-lightning'},
    {key:'passing', label:'Pase',    icon:'ph-arrows-split'},
    {key:'technique', label:'Técnica', icon:'ph-soccer-ball'}
  ];
  // Sugerencia de enfoque según la posición — un punto de partida
  // razonable que el usuario siempre puede cambiar a mano.
  function statSugeridaPorPosicion(pos){
    if(pos==='DC'||pos==='ED'||pos==='EI') return 'attack';
    if(pos==='DFC'||pos==='LD'||pos==='LI'||pos==='POR') return 'defense';
    if(pos==='MC') return 'passing';
    return 'technique';
  }
  function renderPlanEntrenamientoResumenHTML(){
    const plan=state.pfPlanEntrenamiento||[];
    const chips=plan.map(entry=>{
      const p=(state.plantilla||[]).find(x=>x.id===entry.jugadorId);
      if(!p) return '';
      const statInfo=STATS_ENTRENO.find(s=>s.key===entry.stat);
      return `<span class="lm-plan-chip"><i class="ph ph-bold ${statInfo?statInfo.icon:'ph-question'}"></i>${p.name} <em>${statInfo?statInfo.label:'sin enfoque'}</em></span>`;
    }).filter(Boolean).join('');
    return `<div class="lm-plan-resumen">
      <div class="lm-plan-resumen-texto">
        <i class="ph ph-bold ph-clipboard-text"></i>
        ${chips?`<div class="lm-plan-chips">${chips}</div>`:`<span>${t('lm.sin_elegido_entrenar')}</span>`}
      </div>
      <button id="lmPlanEntrenoBtn" class="mode-card-btn mode-card-btn-gold" style="padding:9px 16px;font-size:13px;white-space:nowrap">${t('lm.plan_entrenamiento')}</button>
    </div>`;
  }

  /* ---------- 13i. Interfaz del Preparador Físico — mismo patrón de
     hub con cartas que médico/mantenimiento/directores. ---------- */
  function abrirPreparadorFisico(){
    const overlay=document.createElement('div');
    overlay.id='lmPreparadorFisicoOverlay';
    document.getElementById('ligaManagerScreen').appendChild(overlay);
    habilitarCierreOverlay(overlay, ()=>{ overlay.remove(); render(); });
    // Delegado: cualquier X que aparezca dentro de este overlay en
    // cualquier pantalla (selector de dados, tirada, etc.) lo cierra.
    overlay.addEventListener('click', (e)=>{
      const xEl = e.target.closest && e.target.closest('[data-cerrar-x]');
      if(xEl){ if(typeof window.playSound==='function') window.playSound('select'); overlay.remove(); render(); }
    });

    function renderHub(){
      const cartasHTML=state.preparadorFisicoCartas.map((instancia,idx)=>{
        const def=cartaDefPF(instancia.cartaId);
        const dificultadEfectiva = def.tipo==='nivel' ? dificultadActualNivelPF(def) : Math.max(3, def.dificultad - bonusEstrellasTrabajador('preparadorFisico'));
        const maxPosible = state.diceAvailable*6;
        const imposiblePorDados = maxPosible < dificultadEfectiva;
        const nivelMaximoYa = def.tipo==='nivel' && nivelDePF(def.track)>=NIVEL_MAXIMO_EQUIPO;
        const bloqueada = imposiblePorDados || nivelMaximoYa;
        const cambioDisponible=(state.preparadorFisicoCambiosUsados||0)<lmCambiosCartaPorPartido();
        let cuerpo;
        if(def.tipo==='nivel'){
          const n=nivelDePF(def.track);
          cuerpo=`<div class="med-card-progress-label" style="text-align:center;letter-spacing:2px;color:var(--gold)">${estrellasNivel(n)}</div>
                  <div class="med-card-dificultad">${nivelMaximoYa?t('lm.nivel_maximo_alcanzado'):`${t('lm.dificultad_lbl')} ${dificultadEfectiva}+ ${t('lm.para_subir_a_nivel')} ${n+1}/${NIVEL_MAXIMO_EQUIPO}`}</div>`;
        } else {
          cuerpo=`<div class="med-card-dificultad">Dificultad ${Math.max(3, def.dificultad - bonusEstrellasTrabajador('preparadorFisico'))}+</div>`;
        }
        return `
        <div class="med-card med-card-pf ${bloqueada&&!nivelMaximoYa?'med-card-bloqueada':''}" data-idx="${idx}">
          <button class="med-card-swap" data-swap="${idx}" title="${t('lm.tt_cambiar_carta')}" ${cambioDisponible?'':'disabled'}><i class="ph ph-bold ph-arrows-clockwise"></i></button>
          <div class="med-card-tag">${def.tipo==='nivel'?t('lm.tag_proyecto'):t('lm.tag_accion')}</div>
          <i class="ph ph-bold ${def.icon} med-card-icon"></i>
          <div class="med-card-title">${tc('pf', def.id, 'nombre', def.nombre)}</div>
          <div class="med-card-divider"></div>
          <div class="med-card-desc">${tc('pf', def.id, 'desc', def.desc)}</div>
          ${cuerpo}
          ${(bloqueada&&!nivelMaximoYa)?`<div class="med-card-bloqueada-label">${t('lm.imposible_dados')}</div>`:(nivelMaximoYa?'':`<button class="mode-card-btn mode-card-btn-gold med-card-btn" data-usar="${idx}" style="padding:7px;font-size:11px">${t('lm.usar_btn')}</button>`)}
        </div>`;
      }).join('');

      overlay.innerHTML=`
        <div class="lm-dilemma-card lm-dilemma-card-pf" style="max-width:640px">
          ${xCerrarHTML()}
          <div class="lm-dilemma-title"><i class="ph ph-bold ph-barbell"></i> ${t('lm.titulo_pf')}</div>
          ${renderPlanEntrenamientoResumenHTML()}
          ${renderNivelesPFHTML()}
          <div class="lm-staff-bar-capital" style="justify-content:center;margin:10px 0 8px"><span><i class="ph ph-bold ph-dice-five"></i> ${t('lm.dados')}: <strong>${state.diceAvailable}</strong></span><span><i class="ph ph-bold ph-arrows-clockwise"></i> ${t('lm.rerrolls')}: <strong>${state.dadoRerollsDisponibles||0}</strong></span><span><i class="ph ph-bold ph-cards"></i> ${t('lm.cambios')}: <strong>${Math.max(0,lmCambiosCartaPorPartido()-(state.preparadorFisicoCambiosUsados||0))}/${lmCambiosCartaPorPartido()}</strong></span></div>
          <div class="med-card-grid">${cartasHTML}</div>
          <div class="lm-popup-actions lm-popup-actions-compact">
            ${mostrarInfoHTML()}
            <button id="lmPreparadorFisicoCerrar" class="mode-card-btn mode-card-btn-secondary">${t('lm.cerrar')}</button>
          </div>
        </div>`;
        wireMostrarInfoHold(overlay, abrirHistorialPF, 'lmHistorialPFOverlay');

      const xBtnPF=overlay.querySelector('[data-cerrar-x]');
      if(xBtnPF) xBtnPF.addEventListener('click', ()=>{ overlay.remove(); render(); });
      const cerrarBtn=document.getElementById('lmPreparadorFisicoCerrar');
      if(cerrarBtn) cerrarBtn.addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        overlay.remove();
        render();
      });
      overlay.querySelectorAll('[data-swap]').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const idx=parseInt(btn.getAttribute('data-swap'),10);
          if((state.preparadorFisicoCambiosUsados||0)>=lmCambiosCartaPorPartido()) return;
          if(typeof window.playSound==='function') window.playSound('select');
          animarRerollCarta(overlay, idx, PREPARADOR_FISICO_CARTAS_BASE, ()=>{
            cambiarCartaPF(idx);
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
      const planBtn=document.getElementById('lmPlanEntrenoBtn');
      if(planBtn) planBtn.addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        renderSelectorPlanEntrenamiento();
      });
    }

    function renderSelectorPlanEntrenamiento(){
      // slots: hasta 3 huecos, cada uno {jugadorId, stat} o null si está vacío.
      const guardado=(state.pfPlanEntrenamiento||[]).slice(0,3);
      const slots=[0,1,2].map(i=>guardado[i]?{...guardado[i]}:null);

      function pintarPrincipal(){
        const huecos=slots.map((slot,i)=>{
          if(!slot){
            return `<div class="lm-plan-slot lm-plan-slot-vacio" data-plan-slot-add="${i}">
              <i class="ph ph-bold ph-plus-circle"></i>
              <span>${t('lm.anadir_jugador')}</span>
            </div>`;
          }
          const p=state.plantilla.find(x=>x.id===slot.jugadorId);
          if(!p) return `<div class="lm-plan-slot lm-plan-slot-vacio" data-plan-slot-add="${i}"><i class="ph ph-bold ph-plus-circle"></i><span>${t('lm.anadir_jugador')}</span></div>`;
          return `<div class="lm-plan-slot">
            <div class="lm-plan-slot-top">
              <div class="lm-plan-slot-jugador">
                <strong>${p.name}</strong>
                <span class="lm-hist-tag">${p.position}</span>
              </div>
              <button class="lm-plan-slot-quitar" data-plan-slot-quitar="${i}" title="${t('lm.tt_quitar_del_plan')}"><i class="ph ph-bold ph-x"></i></button>
            </div>
            <div class="lm-plan-slot-label">${t('lm.enfoque_entrenamiento')}</div>
            <div class="lm-plan-stat-row">
              ${STATS_ENTRENO.map(s=>`<button class="lm-plan-stat-btn ${slot.stat===s.key?'lm-plan-stat-activo':''}" data-plan-slot-stat="${i}" data-plan-stat-key="${s.key}" title="${s.label}"><i class="ph ph-bold ${s.icon}"></i><span>${s.label}</span></button>`).join('')}
            </div>
          </div>`;
        }).join('');
        const completos=slots.filter(s=>s && s.stat).length;
        overlay.innerHTML=`
          <div class="lm-dilemma-card lm-dilemma-card-pf" style="width:520px;max-width:92vw;text-align:left">
            ${xCerrarHTML()}
            <div class="lm-dilemma-title"><i class="ph ph-bold ph-clipboard-text"></i> ${t('lm.plan_entrenamiento_titulo')}</div>
            <p class="lm-setup-desc" style="text-align:center;margin-bottom:10px">Elige hasta 3 jugadores y, para cada uno, QUÉ estadística quieres mejorar — un delantero puede entrenar ataque, un central defensa, etc. Solo mejoran de verdad los días de entrenamiento marcados en el calendario.</p>
            <div class="lm-plan-slots">${huecos}</div>
            <div class="lm-popup-actions">
              <button id="lmPlanGuardar" class="mode-card-btn mode-card-btn-gold">GUARDAR (${completos}/3)</button>
              <button id="lmPlanCancelar" class="lm-btn-cancelar">${t('lm.cerrar')}</button>
            </div>
          </div>`;
        overlay.querySelectorAll('[data-plan-slot-add]').forEach(el=>{
          el.addEventListener('click', ()=>{
            const i=parseInt(el.getAttribute('data-plan-slot-add'),10);
            if(typeof window.playSound==='function') window.playSound('select');
            pintarElegirJugador(i);
          });
        });
        overlay.querySelectorAll('[data-plan-slot-quitar]').forEach(el=>{
          el.addEventListener('click', ()=>{
            const i=parseInt(el.getAttribute('data-plan-slot-quitar'),10);
            if(typeof window.playSound==='function') window.playSound('select');
            slots[i]=null;
            pintarPrincipal();
          });
        });
        overlay.querySelectorAll('[data-plan-slot-stat]').forEach(el=>{
          el.addEventListener('click', ()=>{
            const i=parseInt(el.getAttribute('data-plan-slot-stat'),10);
            const key=el.getAttribute('data-plan-stat-key');
            if(typeof window.playSound==='function') window.playSound('select');
            slots[i].stat=key;
            pintarPrincipal();
          });
        });
        document.getElementById('lmPlanCancelar').addEventListener('click', ()=>{
          if(typeof window.playSound==='function') window.playSound('select');
          renderHub();
        });
        document.getElementById('lmPlanGuardar').addEventListener('click', ()=>{
          if(typeof window.playSound==='function') window.playSound('select');
          state.pfPlanEntrenamiento=slots.filter(s=>s && s.jugadorId && s.stat);
          guardarEstado();
          renderHub();
        });
      }

      function pintarElegirJugador(slotIdx){
        const yaElegidosOtros=slots.filter((s,i)=>i!==slotIdx && s).map(s=>s.jugadorId);
        const filas=(state.plantilla||[]).filter(p=>!yaElegidosOtros.includes(p.id)).map(p=>`
          <div class="lm-slot-option" data-plan-elegir-pid="${p.id}">
            <span>${p.name} <span class="lm-hist-tag">${p.position}</span></span>
            <span>Punt. ${p.overall}</span>
          </div>`).join('');
        overlay.innerHTML=`
          <div class="lm-dilemma-card lm-dilemma-card-pf" style="width:480px;max-width:90vw;text-align:left">
            ${xCerrarHTML()}
            <div class="lm-dilemma-title"><i class="ph ph-bold ph-user-focus"></i> ELEGIR JUGADOR</div>
            <div class="lm-slot-list">${filas}</div>
            <div class="lm-popup-actions">
              <button id="lmPlanVolver" class="lm-btn-cancelar">${t('lm.volver')}</button>
            </div>
          </div>`;
        overlay.querySelectorAll('[data-plan-elegir-pid]').forEach(el=>{
          el.addEventListener('click', ()=>{
            const pid=el.getAttribute('data-plan-elegir-pid');
            const p=state.plantilla.find(x=>x.id===pid);
            if(typeof window.playSound==='function') window.playSound('select');
            slots[slotIdx]={jugadorId:pid, stat:statSugeridaPorPosicion(p?p.position:'')};
            pintarPrincipal();
          });
        });
        document.getElementById('lmPlanVolver').addEventListener('click', ()=>{
          if(typeof window.playSound==='function') window.playSound('select');
          pintarPrincipal();
        });
      }

      pintarPrincipal();
    }


    function renderSelectorCarta(idx){
      const def=cartaDefPF(state.preparadorFisicoCartas[idx].cartaId);
      let dadosElegidos=Math.min(1, state.diceAvailable);
      function pintar(){
        overlay.innerHTML=`
          <div class="lm-dilemma-card lm-dilemma-card-pf">
            ${xCerrarHTML()}
            <i class="ph ph-bold ${def.icon}" style="font-size:26px;color:#e08a3e"></i>
            <div class="lm-dilemma-title" style="justify-content:center;text-align:center">${tc('pf', def.id, 'nombre', def.nombre).toUpperCase()}</div>
            <div class="lm-dilemma-text">${tc('pf', def.id, 'desc', def.desc)}${def.tipo==='directa'?` — necesitas sumar <strong class="lm-dificultad-destacada">${Math.max(3, def.dificultad - bonusEstrellasTrabajador('preparadorFisico'))}+</strong>`:` — necesitas sumar <strong class="lm-dificultad-destacada">${dificultadActualNivelPF(def)}+</strong> para subir a nivel ${nivelDePF(def.track)+1}/${NIVEL_MAXIMO_EQUIPO}`}</div>
            <div class="lm-dice-selector">
              <button id="lmDiceMinus" class="lm-dice-stepper">−</button>
              <span id="lmDiceCount">${dadosElegidos}</span>
              <button id="lmDicePlus" class="lm-dice-stepper">+</button>
            </div>
            <div class="lm-setup-desc">dados disponibles: ${state.diceAvailable}</div>
            <div class="lm-popup-actions">
              <button id="lmTirarBtn" class="mode-card-btn mode-card-btn-gold" ${state.diceAvailable<1?'disabled':''}>TIRAR ${dadosElegidos} DADO${dadosElegidos>1?'S':''}</button>
              <button id="lmCancelarCartaBtn" class="lm-btn-cancelar">${t('lm.cancelar')}</button>
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
      const cartaObjetivo=cartaDefPF(state.preparadorFisicoCartas[idx].cartaId);
      const dificultadObjetivo = cartaObjetivo.tipo==='directa'
        ? Math.max(3, cartaObjetivo.dificultad - bonusEstrellasTrabajador('preparadorFisico'))
        : dificultadActualNivelPF(cartaObjetivo);
      overlay.innerHTML=`
        <div class="lm-dilemma-card lm-dilemma-card-pf lm-dice-roll-card">
            ${xCerrarHTML()}
          <div class="lm-dilemma-title" id="lmDiceTitle" style="justify-content:center;text-align:center">TIRANDO ${numDados} DADO${numDados>1?'S':''}...</div>
          <div class="lm-dice-objetivo">${t('lm.necesitas_sumar')} <strong>${dificultadObjetivo}+</strong></div>
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
            return resolverCartaPF(idx, tiradasFinales);
          },
          ()=>{ renderHub(); }
        );
      });
    }

    renderHub();
  }

  /* ---------- 13j. Historial de entrenamientos — burbuja "i" del
     Preparador Físico. ---------- */
  function abrirHistorialPF(esModoMantener){
    const overlay=document.createElement('div');
    overlay.id='lmHistorialPFOverlay';
    const hist=state.preparadorFisicoHistorial||[];
    const filas=hist.map(h=>`
      <div class="lm-hist-item">
        <i class="ph ph-bold ph-barbell" style="color:#e08a3e"></i>
        <div style="flex:1">
          <div class="lm-hist-title">${h.jugador} <span class="lm-hist-tag">+${h.cantidad}</span></div>
          <div class="lm-hist-meta">${h.detalle} · Jornada ${h.jornada}</div>
        </div>
      </div>`).join('');
    overlay.innerHTML=`
      <div class="lm-dilemma-card lm-dilemma-card-pf" style="max-width:480px;text-align:left">
        ${xCerrarHTML()}
        <div class="lm-dilemma-title"><i class="ph ph-bold ph-clock-counter-clockwise"></i> ${t('lm.historial_entrenamientos_titulo')}</div>
        <p class="lm-setup-desc" style="text-align:left;margin:10px 0 4px">${t('lm.mejoras_individuales')}</p>
        <div class="lm-hist-list">${filas||`<p class="lm-setup-desc" style="text-align:center">${t('lm.sin_entrenar_nadie')}</p>`}</div>
        ${esModoMantener?'':`<div class="lm-popup-actions lm-popup-actions-compact">
          <button id="lmHistorialPFCerrar" class="mode-card-btn mode-card-btn-gold">${t('lm.cerrar')}</button>
        </div>`}
      </div>`;
    document.getElementById('ligaManagerScreen').appendChild(overlay);
    habilitarCierreOverlay(overlay, ()=>overlay.remove());
    const xBtnHPF=overlay.querySelector('[data-cerrar-x]');
    if(xBtnHPF) xBtnHPF.addEventListener('click', ()=>overlay.remove());
    const btnCerrarHPF=document.getElementById('lmHistorialPFCerrar');
    if(btnCerrarHPF) btnCerrarHPF.addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      overlay.remove();
    });
  }

  /* ---------- 13h. TRABAJADORES — contratar y despedir al cuerpo
     técnico. Cada mes se renuevan 2 candidatos por puesto (mismo momento
     que la nómina), con nivel y sueldo acordes; despedir deja el puesto
     vacante (sin sueldo) hasta contratar a alguien. ---------- */
  function abrirTrabajadores(rolFiltrado){
    const overlay=document.createElement('div');
    overlay.id='lmTrabajadoresOverlay';
    document.getElementById('ligaManagerScreen').appendChild(overlay);
    habilitarCierreOverlay(overlay, ()=>{ overlay.remove(); render(); });
    // Delegado: cualquier X que aparezca dentro de este overlay en
    // cualquier pantalla (selector de dados, tirada, etc.) lo cierra.
    overlay.addEventListener('click', (e)=>{
      const xEl = e.target.closest && e.target.closest('[data-cerrar-x]');
      if(xEl){ if(typeof window.playSound==='function') window.playSound('select'); overlay.remove(); render(); }
    });

    function fichaTrabajadorHTML(rol){
      const actual=state.trabajadores[rol];
      const candidatos=(state.candidatosTrabajo||[]).filter(c=>c.rol===rol).sort((a,b)=>a.nivel-b.nivel);
      const chipActual = actual ? `
        <div class="lm-trab-chip lm-trab-chip-actual">
          <div class="lm-trab-chip-top"><span class="lm-trab-nombre">${actual.nombre}</span><span class="lm-trab-estrellas">${estrellasNivel(actual.nivel, 3)}</span></div>
          <div class="lm-trab-sueldo">${formatoDinero(actual.sueldo)}/mes</div>
          <button class="lm-trab-despedir" data-despedir="${rol}">DESPEDIR (${formatoDinero(calcularFiniquito(actual))})</button>
        </div>` : `
        <div class="lm-trab-chip lm-trab-chip-vacante"><i class="ph ph-bold ph-user-circle-minus"></i><span>${t('lm.vacante')}</span></div>`;
      const chipsCandidatos = candidatos.map(c=>`
        <div class="lm-trab-chip ${c.chollo?'lm-trab-chip-chollo':''}">
          ${c.chollo?'<div class="lm-trab-chollo-badge"><i class="ph ph-bold ph-seal-percent"></i> OPORTUNIDAD</div>':''}
          <div class="lm-trab-chip-top"><span class="lm-trab-nombre">${c.nombre}</span><span class="lm-trab-estrellas">${estrellasNivel(c.nivel, 3)}</span></div>
          <div class="lm-trab-sueldo">${formatoDinero(c.sueldo)}/mes</div>
          <button class="lm-trab-contratar" data-contratar="${c.id}" data-rol="${rol}">${t('lm.contratar')}</button>
        </div>`).join('');
      // Siempre 3 huecos de candidato aunque falten (p.ej. tras contratar
      // a uno este mes) — una ficha genérica gris y desactivada en vez de
      // dejar que la fila se reajuste horizontalmente.
      const huecos=Math.max(0, 3-candidatos.length);
      const chipsGenericos=Array.from({length:huecos}).map(()=>`
        <div class="lm-trab-chip lm-trab-chip-generica">
          <div class="lm-trab-chip-top"><span class="lm-trab-nombre">—</span></div>
          <div class="lm-trab-sueldo">${t('lm.sin_candidato')}</div>
          <button class="lm-trab-generica-btn" disabled>—</button>
        </div>`).join('');
      return `
      <div class="lm-trab-rol-row">
        <div class="lm-trab-rol-titulo"><i class="ph ph-bold ${CORREO_ICONOS[rol]||'ph-user'}"></i><span>${NOMBRE_ROL[rol]}</span></div>
        <div class="lm-trab-chips">${chipActual}${chipsCandidatos}${chipsGenericos}</div>
      </div>`;
    }

    function pintar(){
      const roles = rolFiltrado ? [rolFiltrado] : ROLES_TRABAJO;
      overlay.innerHTML=`
        <div class="lm-dilemma-card" style="width:960px;max-width:94vw;text-align:left">
          ${xCerrarHTML()}
          <div class="lm-dilemma-title"><i class="ph ph-bold ph-user-plus"></i> ${t('lm.contratar_btn')}${rolFiltrado?` — ${NOMBRE_ROL[rolFiltrado]}`:''}</div>
          <p class="lm-setup-desc" style="text-align:center;margin-bottom:10px">${t('lm.candidatos_mensuales_msg')}${rolFiltrado?` <span id="lmTrabVerTodos" style="color:var(--gold);cursor:pointer;text-decoration:underline">${t('lm.ver_todos_puestos')}</span>`:''}</p>
          <div class="lm-trab-grid">
            ${roles.map(fichaTrabajadorHTML).join('')}
          </div>
          <div class="lm-popup-actions lm-popup-actions-compact">
            <button id="lmTrabajadoresCerrar" class="mode-card-btn mode-card-btn-gold">${t('lm.cerrar')}</button>
          </div>
        </div>`;
      const xBtnTrab=overlay.querySelector('[data-cerrar-x]');
      if(xBtnTrab) xBtnTrab.addEventListener('click', ()=>{ overlay.remove(); render(); });
      document.getElementById('lmTrabajadoresCerrar').addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        overlay.remove();
        render();
      });
      const verTodos=document.getElementById('lmTrabVerTodos');
      if(verTodos) verTodos.addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        rolFiltrado=null;
        pintar();
      });
      overlay.querySelectorAll('[data-despedir]').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          if(typeof window.playSound==='function') window.playSound('select');
          const rol=btn.getAttribute('data-despedir');
          const actual=state.trabajadores[rol];
          const proceder=()=>{ despedirTrabajador(rol); pintar(); };
          if(typeof window.showConfirmPopup==='function'){
            window.showConfirmPopup(`¿Despedir a ${actual.nombre} (${NOMBRE_ROL[rol]})? Costará un finiquito de ${formatoDinero(calcularFiniquito(actual))} y el puesto quedará vacante hasta que contrates a otra persona.`, proceder, 'DESPEDIR');
          } else if(confirm(`¿Despedir a ${actual.nombre} por ${formatoDinero(calcularFiniquito(actual))} de finiquito?`)){
            proceder();
          }
        });
      });
      overlay.querySelectorAll('[data-contratar]').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const candidatoId=btn.getAttribute('data-contratar');
          const rol=btn.getAttribute('data-rol');
          const actual=state.trabajadores[rol];
          const proceder=()=>{
            if(typeof window.playSound==='function') window.playSound('select');
            contratarTrabajador(rol, candidatoId);
            pintar();
          };
          if(actual){
            const finiquito=calcularFiniquito(actual);
            if(typeof window.showConfirmPopup==='function'){
              window.showConfirmPopup(`Ya tienes a ${actual.nombre} en este puesto. Al contratar a otra persona se le despedirá (finiquito de ${formatoDinero(finiquito)}). ¿Continuar?`, proceder, t('lm.contratar_btn'));
            } else if(confirm(`¿Despedir a ${actual.nombre} (finiquito ${formatoDinero(finiquito)}) para contratar al nuevo candidato?`)){
              proceder();
            }
          } else {
            proceder();
          }
        });
      });
    }
    pintar();
  }

  /* ---------- 14. Inicialización ---------- */
  // Rellena el panel ESTADÍSTICAS del menú de perfil con los datos
  // reales de la temporada de Liga Manager en curso — mismo estilo que
  // Copa Leyendas, pero con sus propios números.
  function renderLigaManagerProfileStats(){
    if(!state || !state.setupComplete) return;
    const set=(id,val)=>{ const el=document.getElementById(id); if(el) el.textContent=val; };
    let pj=0,pg=0,pe=0,pp=0,gf=0,gc=0;
    for(let j=0;j<state.jornadaActual-1;j++){
      (state.calendario[j]||[]).forEach(partido=>{
        if(partido.home.id!=='lm_0' && partido.away.id!=='lm_0') return;
        const key=j+'-'+partido.home.id+'-'+partido.away.id;
        const res=state.resultados[key];
        if(!res) return;
        pj++;
        const esLocal=partido.home.id==='lm_0';
        const misGoles=esLocal?res.golesA:res.golesB, susGoles=esLocal?res.golesB:res.golesA;
        gf+=misGoles; gc+=susGoles;
        if(misGoles>susGoles) pg++; else if(misGoles===susGoles) pe++; else pp++;
      });
    }
    const clasif=calcularClasificacion();
    const posicion=clasif.findIndex(t=>t.id==='lm_0')+1;
    set('lmpstat-jornada', Math.min(state.jornadaActual,38)+'/38');
    set('lmpstat-posicion', posicion>0?(posicion+'º'):'—');
    set('lmpstat-games', pj);
    set('lmpstat-wins', pg);
    set('lmpstat-draws', pe);
    set('lmpstat-losses', pp);
    set('lmpstat-gf', gf);
    set('lmpstat-ga', gc);
    set('lmpstat-plantilla', (state.plantilla||[]).length);
    const racha=state.rachaResultados||0;
    set('lmpstat-racha', racha===0 ? '—' : (racha>0 ? `${racha}V` : `${Math.abs(racha)}D`));
    set('lmpstat-capital', formatoDinero(state.capital||0));
  }
  window.renderLigaManagerProfileStats = renderLigaManagerProfileStats;

  function init(){
    try{
      state=cargarEstado();
      setupStep=1;
      formacionCategoriaVista=null;
      seleccionJugador=null;
      lmCargarUpgradeCache().then(()=>render());
      lmCargarSkillsCache();
      render();
      inicializarBarraMovilLM();
    }catch(e){
      console.error('Error en init() de Liga Manager:', e);
      const root=document.getElementById('ligaManagerScreen');
      if(root){
        root.innerHTML=`
          <div style="padding:24px;color:#fff;font-family:monospace;font-size:13px;line-height:1.6;max-width:100%;overflow-wrap:break-word">
            <div style="color:#e24b4a;font-size:16px;font-weight:bold;margin-bottom:12px">⚠️ Error al iniciar Liga Manager</div>
            <div style="color:#ccc;margin-bottom:12px">${t('lm.copia_mensaje_dev')}</div>
            <div style="background:#1a1a1a;border:1px solid #e24b4a;border-radius:6px;padding:12px;color:#ffb3b3;user-select:text">${(e && e.message) ? e.message : String(e)}${(e && e.stack) ? '<br><br>'+e.stack.replace(/\\n/g,'<br>') : ''}</div>
          </div>`;
      }
    }
  }

  // Barra de pestañas móvil de Liga Manager. Los botones CAMPO/EQUIPO/
  // RIVAL/TÉCNICOS son enlaces de ancla nativos (<a href="#id">) — el
  // propio navegador hace el scroll, así que aquí NUNCA se fuerza ese
  // scroll desde JavaScript (eso era lo que causaba que siempre
  // "volviera a CAMPO" en cada actualización). Esta función solo se
  // encarga de: 1) resaltar en amarillo la pestaña que se acaba de
  // pulsar, 2) cerrar cualquier ventana emergente que estuviera
  // abierta, para que no se quede tapando el contenido al navegar.
  // Aviso de inactividad: si pasan 30s sin pulsar JUGAR/SEGUIR, se
  // enciende una notificación roja sobre el icono CAMPO de la barra
  // móvil, para que quede claro que hay una acción pendiente ahí.
  let timerInactividadLM=null;
  function reiniciarAvisoInactividadCampo(){
    if(timerInactividadLM) clearTimeout(timerInactividadLM);
    const badge=document.getElementById('lmCampoBadge');
    if(badge) badge.style.display='none';
    timerInactividadLM=setTimeout(()=>{
      const b=document.getElementById('lmCampoBadge');
      if(b) b.style.display='flex';
    }, 30000);
  }
  function inicializarBarraMovilLM(){
    const barra=document.getElementById('lmMobileTabBar');
    if(!barra || barra.dataset.wired) return; // solo una vez, la barra es HTML estático
    barra.dataset.wired='1';
    // JUGAR/SEGUIR se regenera en cada render() — se delega el evento
    // sobre el contenedor fijo para no perder el cableado nunca.
    const screen=document.getElementById('ligaManagerScreen');
    if(screen) screen.addEventListener('click', (e)=>{
      if(e.target.closest && (e.target.closest('#lmJugarBtn') || e.target.closest('#lmLiveContinuar'))){
        reiniciarAvisoInactividadCampo();
      }
    });
    barra.querySelectorAll('.mob-tab[data-lmtab]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        barra.querySelectorAll('.mob-tab').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        if(btn.dataset.lmtab==='tecnicos'){
          const badge=document.getElementById('lmTecnicosBadge');
          if(badge) badge.style.display='none';
        }
        if(btn.dataset.lmtab==='equipo'){
          const badgeCampo=document.getElementById('lmCampoBadge');
          if(badgeCampo) badgeCampo.style.display='none';
        }
        // Cierra cualquier popup de Liga Manager que estuviera abierto,
        // para que la navegación a la sección no se quede tapada detrás
        // — EXCEPTO el partido en curso (modo automático o manager),
        // que nunca se puede cerrar mientras se está reproduciendo.
        document.querySelectorAll('#ligaManagerScreen [id$="Overlay"]').forEach(ov=>{
          const liveContinuarBtn=document.getElementById('lmLiveContinuar');
          const partidoAutoEnCurso = ov.id==='lmMatchOverlay' && liveContinuarBtn && liveContinuarBtn.style.display==='none';
          const resumenBoxLM=document.getElementById('lmVisorResumenBox');
          const partidoManagerEnCurso = ov.id==='lmVisorPartidoOverlay' && resumenBoxLM && resumenBoxLM.style.display==='none';
          if(partidoAutoEnCurso || partidoManagerEnCurso) return;
          ov.remove();
        });
        // Y también el ticket, si estuviera abierto — vive fuera de
        // Liga Manager, así que se cierra aparte.
        if(typeof window.closeTicketOverlay==='function') window.closeTicketOverlay();
      });
    });
    // TICKETS y CLASIF. también cuentan como "pestaña" a efectos de
    // resaltado, aunque abran una ventana en vez de desplazar la vista.
    ['lmTicketTabBtn','lmClasifTabBtn'].forEach(id=>{
      const btn=document.getElementById(id);
      if(btn) btn.addEventListener('click', ()=>{
        barra.querySelectorAll('.mob-tab').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        if(id==='lmClasifTabBtn' && typeof window.closeTicketOverlay==='function') window.closeTicketOverlay();
      });
    });
  }

  window.rerenderLigaManager = function(){
    if(state && state.setupComplete){
      try{ render(); }catch(e){ console.error('Error al redibujar Liga Manager:', e); }
    }
  };
  window.G2G_LigaManager={ init, abandonarLiga };

})();
