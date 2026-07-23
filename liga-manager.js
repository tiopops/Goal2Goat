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

  // Genera tu plantilla a partir de un equipo real elegido en vez de
  // crear el tuyo propio — mismos 16 jugadores (11+5) con nombres y
  // dorsales reales de esa plantilla, y estadísticas individuales
  // repartidas alrededor del perfil real del equipo (igual que se hace
  // para generar el once ficticio de los rivales).
  function generarPlantillaDesdeEquipoReal(equipo){
    const jugadores=(equipo.plantilla||[]).slice(0,16);
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
    const POSICIONES_BANQUILLO=["POR","DFC","MC","ED","DC"];
    const plantilla=POSICIONES_TITULARES.map((pos,i)=>jugadorDe('p'+i, i, pos, false));
    POSICIONES_BANQUILLO.forEach((pos,i)=>plantilla.push(jugadorDe('b'+i, 11+i, pos, true)));
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
      // de preparación va desde hoy (el día real de hoy) hasta el
      // partido, así que sí se puede planificar la primera semana.
      anterior=new Date(); anterior.setHours(0,0,0,0); anterior.setDate(anterior.getDate()-1);
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
    const NOMBRE_STAT={attack:'ataque',defense:'defensa',pace:'ritmo',passing:'pase',technique:'técnica'};
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
            textos.push(`${j.name} mejora su ${NOMBRE_STAT[campo]} (+1)`);
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
            textos.push(`${jugador.name} se resiente por sobrecarga de entrenamiento (leve)`);
            lesionesSemana.push({nombre:jugador.name, familia});
          }
        }
        if(!textos.length) textos.push('Entrenamiento sin incidencias');
        state.plantilla.forEach(p=>{ p.fatigue=Math.max(0, Math.min(100, Math.round((p.fatigue===undefined?100:p.fatigue)-2.2))); });
      } else {
        diasDescanso++;
        seguidos=0;
        textos.push('Día de descanso — la plantilla recupera resistencia');
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
        contenido=`<div class="lm-cal-partido" title="Jornada ${partido.jornada} — ${partido.esLocal?'vs':'fuera vs'} ${partido.rival.name}">${rivalCrestHTML(40, partido.rival.crestImg)}</div>`;
      } else if(entrenado){
        contenido=`<i class="ph ph-bold ph-barbell lm-cal-entreno-icon"></i>`;
      }
      const clases=['lm-cal-celda'];
      if(partido) clases.push('lm-cal-dia-partido');
      if(editable) clases.push('lm-cal-editable');
      if(!editable) clases.push('lm-cal-bloqueado');
      return `<div class="${clases.join(' ')}" ${editable?`data-cal-dia="${iso}"`:''} title="${editable?'Toca para marcar/quitar entrenamiento':''}">
        <span class="lm-cal-num">${d.getDate()}</span>
        ${contenido}
      </div>`;
    }).join('');
    const {entreno, descanso}=contarEntrenoSemanaActual();
    return `<div class="lm-calendario-box">
      <div class="bench-title" style="margin:0 0 10px"><span><i class="ph ph-bold ph-calendar-blank" style="color:var(--gold);margin-right:6px"></i>CALENDARIO</span></div>
      <div class="lm-cal-header">
        <button class="lm-cal-nav" data-cal-nav="-1" title="Mes anterior"><i class="ph ph-bold ph-caret-left"></i></button>
        <span class="lm-cal-titulo">${MESES_LARGO[month].toUpperCase()} ${year}</span>
        <button class="lm-cal-nav" data-cal-nav="1" title="Mes siguiente"><i class="ph ph-bold ph-caret-right"></i></button>
      </div>
      <div class="lm-cal-semana-dias"><span>L</span><span>M</span><span>X</span><span>J</span><span>V</span><span>S</span><span>D</span></div>
      <div class="lm-cal-grid">${celdas}</div>
      <div class="lm-cal-leyenda">
        <span><i class="ph ph-bold ph-barbell"></i> Entrenamiento (${entreno})</span>
        <span><i class="ph ph-bold ph-bed"></i> Descanso (${descanso})</span>
        <span class="lm-cal-leyenda-escudo">${crestHTML(state.escudo||null,14)} Partido</span>
      </div>
      <p class="lm-setup-desc" style="text-align:center;margin-top:4px">Entrenar mejora un poco las estadísticas de esta semana, pero cansa — deja días en blanco para que la plantilla recupere resistencia.</p>
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
  function proximoSabadoDesde(base){
    const d=new Date(base); d.setHours(0,0,0,0);
    const diasHasta=(6-d.getDay()+7)%7; // 6 = sábado; si hoy ya es sábado, diasHasta=0
    d.setDate(d.getDate()+diasHasta);
    return d;
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
      const desequilibrioRival = statsRival.attack - statsRival.defense; // positivo = ofensivo y flojo atrás
      let bonusPropio=0, penalizacionRival=0;
      if(miFormacion==='defensiva' && desequilibrioRival>8){
        bonusPropio=Math.min(0.35, (desequilibrioRival-8)*0.022);
      } else if(miFormacion==='ofensiva' && desequilibrioRival<-8){
        // Rival muy defensivo y yo jugando ofensivo: cuesta más de lo
        // que la diferencia de nivel sugeriría, el rival está hecho para
        // encerrarse justo contra este tipo de planteamiento.
        penalizacionRival=Math.min(0.28, (-desequilibrioRival-8)*0.018);
      }
      if(miEsA){ lambdaA=Math.max(0.15,lambdaA+bonusPropio-penalizacionRival); }
      else { lambdaB=Math.max(0.15,lambdaB+bonusPropio-penalizacionRival); }
    }
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
  const LM_SORT_LABELS={arrival:'LLEGADA', position:'POSICIÓN', rating:'PUNTOS', numero:'DORSAL'};
  const LM_SORT_NEXT={arrival:'position', position:'rating', rating:'numero', numero:'arrival'};
  let clasifColapsada=false; // la clasificación empieza desplegada
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

  function empezarTemporada(nombreEquipo, moneda, liga, escudo, equipoRealElegidoId){
    calendarioMesVisto=null; // nueva liga: el calendario debe volver a fijarse en el mes de inicio, no arrastrar el de una partida anterior
    calendarioJornadaSincronizada=null;
    const miEquipo={id:'lm_0', name:nombreEquipo};
    // Si el jugador ha elegido ser uno de los 19 equipos reales en vez de
    // crear el suyo propio, ese equipo se quita de la lista de rivales
    // (no te puedes enfrentar a ti mismo) y tu plantilla se genera con
    // sus jugadores reales en vez de nombres inventados.
    const rivalesBarajados=LM_RIVALS.filter(r=>r.id!==equipoRealElegidoId).slice();
    if(typeof shuffle==='function') shuffle(rivalesBarajados); // shuffle() muta en el sitio, no devuelve nada
    const teams=[miEquipo, ...rivalesBarajados];
    const equipoRealElegido = equipoRealElegidoId ? LM_RIVALS.find(r=>r.id===equipoRealElegidoId) : null;
    const plantilla = equipoRealElegido ? generarPlantillaDesdeEquipoReal(equipoRealElegido) : generarMiniPlantilla();
    state={
      setupComplete:true,
      liga, moneda, nombreEquipo, escudo,
      jornadaActual:1,
      calendario:generarCalendario(teams),
      fechaInicioLiga:fechaISO(proximoSabadoDesde(new Date())),
      calendarioEntrenamiento:{},
      pfPlanEntrenamiento:[],
      lmPendingPrediction:null,
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
      preparadorFisicoCambioUsado:false,
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
    // Regalo de bienvenida solo para tiopops: un sobre de fichajes ya
    // esperando desde el primer día, avisado por correo como cualquier
    // otro — se abre exactamente igual, sin trato especial en el resto.
    if(window.currentUsername==='tiopops'){
      const idRegalo='sobre_regalo_'+Date.now();
      state.sobresFichajesPendientes.push({id:idRegalo, nivel:1, jornadaGenerado:1});
      enviarCorreo('directorDeportivo', '¡Bienvenido de vuelta! Un sobre de regalo te espera',
        'Como agradecimiento por poner en marcha esta liga, la directiva te regala un sobre de fichajes. Ábrelo cuando quieras desde aquí mismo.');
      const ultimoCorreo=state.correoInterno && state.correoInterno[0];
      if(ultimoCorreo){ ultimoCorreo.tipoEspecial='sobre_listo'; ultimoCorreo.sobreId=idRegalo; }
    }
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

  function generarEventosPartido(resultado, miEsLocal, campoRelevante, rival){
    // "home"/"away" se refiere SIEMPRE al equipo local/visitante real del
    // partido — mi equipo puede ser cualquiera de los dos según el
    // calendario. Antes se asumía que "home" era siempre yo, así que
    // cuando jugaba fuera mis propios goleadores/tarjetas/lesiones
    // aparecían del lado del rival.
    const misLado = miEsLocal ? 'home' : 'away';
    const rivalLado = miEsLocal ? 'away' : 'home';
    // Elige un nombre real al azar de la plantilla del rival concreto de
    // este partido — si por lo que sea no tiene plantilla cargada, cae
    // en el nombre del propio club para no dejar el hueco en blanco.
    function jugadorRivalAleatorio(){
      if(rival && rival.plantilla && rival.plantilla.length){
        const disponibles = plantillaEfectivaRival(rival);
        const pool = disponibles.length ? disponibles : rival.plantilla;
        const elegido=pool[Math.floor(Math.random()*pool.length)];
        return {name: elegido.name||elegido, numero: elegido.n};
      }
      return {name: rival ? rival.name : 'Rival'};
    }
    const eventos=[];
    for(let i=0;i<resultado.golesA;i++){
      const goleador = miEsLocal ? elegirGoleador() : jugadorRivalAleatorio();
      eventos.push({minute:5+Math.floor(Math.random()*85), team:'home', type:'goal', jugador:goleador});
    }
    for(let i=0;i<resultado.golesB;i++){
      const goleador = miEsLocal ? jugadorRivalAleatorio() : elegirGoleador();
      eventos.push({minute:5+Math.floor(Math.random()*85), team:'away', type:'goal', jugador:goleador});
    }
    // Tarjetas amarillas/rojas — de momento solo informativas (sin
    // sanción de partidos todavía), con nombre real si es tu jugador.
    if(Math.random()<0.35){
      const jugador=elegirJugadorAlineado();
      eventos.push({minute:10+Math.floor(Math.random()*78), team:misLado, type:'card', tarjeta:'amarilla', jugador: jugador||{name:state.nombreEquipo}});
    }
    if(Math.random()<0.35){
      eventos.push({minute:10+Math.floor(Math.random()*78), team:rivalLado, type:'card', tarjeta:'amarilla', jugador:jugadorRivalAleatorio()});
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
        enviarCorreo('medico', `${p.name} agrava su lesión jugando`,
          `${p.name} ha seguido jugando con la lesión a cuestas y se le ha agravado — ahora es ${severidadNueva} y le quedan ${p.injuryWeeks} jornada${p.injuryWeeks===1?'':'s'} de baja.`);
      }
    });
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
    // La satisfacción de la afición también pesa en la moral del
    // vestuario — un ambiente hostil (aficionados descontentos) hace
    // mella incluso ganando, y una grada volcada anima al equipo.
    const satisfaccion=(state.estadio && state.estadio.satisfaccion) || 0;
    delta += satisfaccion/12;
    delta = Math.round(delta);
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
    delta=Math.round(delta);
    state.ultimoCambioSatisfaccion=delta;
    est.satisfaccion=Math.max(-100, Math.min(100, est.satisfaccion+delta));
    actualizarMoralTrasPartido(miGoles, suGoles);
  }

  function jugarJornada(){
    if(state.jornadaActual>38) return null;
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
          evInjury.jugador.injuryWeeks=evInjury.sev.weeks;
          evInjury.jugador.injurySeverity=evInjury.sev.label;
          evInjury.jugador.injuryFamilia=evInjury.familia;
          jugadorLesionadoEstaJornada=evInjury.jugador.id;
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
    state.preparadorFisicoCambioUsado = false;
    state.dadoRerollsDisponibles = 1;
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
      enviarCorreo('directorGeneral', 'Nuevos candidatos disponibles',
        'Este mes hay nuevos candidatos disponibles para cubrir puestos del cuerpo técnico. Puedes revisarlos en cualquier momento desde CONTRATAR.');
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
      const recuperacionExtra=nivelDePF('recuperacionSemanal')*5;
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

    state.jornadaActual++;
    guardarEstado();
    return miPartidoInfo;
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
  const DIAS_LARGO=['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  // Rueda de prensa de Liga Manager — MISMA mecánica e interfaz que Copa
  // Leyendas (mismas clases CSS .press-modal, mismo temporizador de 8s),
  // pero con preguntas reescritas para encajar en el contexto de una
  // liga regular (jornadas, clasificación, rival concreto) en vez de un
  // torneo de eliminatorias. check(r) se evalúa después del partido
  // contra {myGoals, oppGoals, draw}.
  const LM_PRESS_EVENTS=[
    { q:'«¿Vais a mantener la portería a cero en este partido?»', answers:[
      { text:'«Sí, vamos a por la portería a cero.»', stance:'positive', label:'Confiado', check:(r)=>r.oppGoals===0 },
      { text:'«Es difícil de prometer, ya veremos.»', stance:'neutral', label:'Prudente', check:()=>null },
      { text:'«Lo veo complicado, encajaremos.»', stance:'negative', label:'Pesimista', check:(r)=>r.oppGoals>0 },
    ]},
    { q:'«¿Vais a ganar por tres goles o más esta jornada?»', answers:[
      { text:'«Sí, vamos a golear.»', stance:'positive', label:'Ambicioso', check:(r)=>(r.myGoals-r.oppGoals)>=3 },
      { text:'«No me atrevo a predecir el marcador.»', stance:'neutral', label:'Cauto', check:()=>null },
      { text:'«No, será un partido ajustado.»', stance:'negative', label:'Realista', check:(r)=>(r.myGoals-r.oppGoals)<3 },
    ]},
    { q:'«¿Creéis que os llevaréis los tres puntos hoy?»', answers:[
      { text:'«Sin duda, vamos a ganar.»', stance:'positive', label:'Contundente', check:(r)=>r.myGoals>r.oppGoals },
      { text:'«Lo importante es sumar, como sea.»', stance:'neutral', label:'Pragmático', check:()=>null },
      { text:'«Va a ser un partido muy igualado.»', stance:'negative', label:'Cauteloso', check:(r)=>r.myGoals<=r.oppGoals },
    ]},
    { q:'«¿Marcaréis gol en este partido?»', answers:[
      { text:'«Sí, saldremos a por todas desde el inicio.»', stance:'positive', label:'Decidido', check:(r)=>r.myGoals>0 },
      { text:'«El plan de partido lo decide el míster.»', stance:'neutral', label:'Diplomático', check:()=>null },
      { text:'«Va a costarnos encontrar el gol hoy.»', stance:'negative', label:'Cauteloso', check:(r)=>r.myGoals===0 },
    ]},
    { q:'«¿Va a generar más ocasiones el rival que vosotros?»', answers:[
      { text:'«No, vamos a dominar nosotros el partido.»', stance:'positive', label:'Dominante', check:(r)=>r.myGoals>=r.oppGoals },
      { text:'«Cada partido es distinto, lo veremos en el campo.»', stance:'neutral', label:'Flexible', check:()=>null },
      { text:'«Es un rival fuerte, nos costará contenerlo.»', stance:'negative', label:'Respetuoso', check:(r)=>r.oppGoals>r.myGoals },
    ]},
    { q:'«¿Este resultado os va a acercar a vuestro objetivo en la clasificación?»', answers:[
      { text:'«Sí, sumar hoy es clave para nuestra clasificación.»', stance:'positive', label:'Ambicioso', check:(r)=>r.myGoals>r.oppGoals },
      { text:'«Cada jornada cuenta, veremos el resultado.»', stance:'neutral', label:'Prudente', check:()=>null },
      { text:'«No siempre se puede ganar, hay que ser realistas.»', stance:'negative', label:'Realista', check:(r)=>r.myGoals<r.oppGoals },
    ]},
    { q:'«¿Vais a marcar más de un gol en este partido?»', answers:[
      { text:'«Sí, tenemos gol en las botas.»', stance:'positive', label:'Ofensivo', check:(r)=>r.myGoals>1 },
      { text:'«Con uno nos conformamos si hace falta.»', stance:'neutral', label:'Pragmático', check:()=>null },
      { text:'«Va a costarnos encontrar el gol hoy.»', stance:'negative', label:'Cauteloso', check:(r)=>r.myGoals<=1 },
    ]},
    { q:'«¿Encajaréis dos goles o más en este partido?»', answers:[
      { text:'«No, vamos a estar sólidos atrás.»', stance:'positive', label:'Defensivo', check:(r)=>r.oppGoals<2 },
      { text:'«El fútbol siempre da sorpresas.»', stance:'neutral', label:'Filosófico', check:()=>null },
      { text:'«El rival tiene mucho gol, puede pasar.»', stance:'negative', label:'Realista', check:(r)=>r.oppGoals>=2 },
    ]},
    { q:'«¿Terminará el partido en empate?»', answers:[
      { text:'«No, vamos a buscar la victoria hasta el final.»', stance:'positive', label:'Ambicioso', check:(r)=>!r.draw },
      { text:'«Cualquier resultado es posible en esta liga.»', stance:'neutral', label:'Realista', check:()=>null },
      { text:'«Puede quedarse en un empate, ambos equipos son sólidos.»', stance:'negative', label:'Cauteloso', check:(r)=>r.draw },
    ]},
  ];
  // Devuelve una pregunta al azar, ya con el nombre del rival incrustado
  // donde corresponde, para que la entrevista se sienta específica de
  // ese partido concreto.
  function elegirPreguntaPrensaLM(rivalName){
    const def=LM_PRESS_EVENTS[Math.floor(Math.random()*LM_PRESS_EVENTS.length)];
    return {...def, q: def.q.replace('esta jornada','esta jornada ante '+(rivalName||'el rival'))};
  }
  // Muestra la rueda de prensa reutilizando literalmente las mismas
  // clases CSS que Copa Leyendas (.press-modal/.press-icon/...), con el
  // mismo temporizador de 8s. Al responder o agotarse el tiempo, guarda
  // la promesa pendiente en el estado y continúa el flujo de la semana.
  function mostrarRuedaPrensaLM(overlay, rivalName, onDone){
    const event=elegirPreguntaPrensaLM(rivalName);
    overlay.innerHTML=`
      <div class="press-modal">
        <span class="press-icon">🎙</span>
        <h3>RUEDA DE PRENSA · ANTES DEL PARTIDO</h3>
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
      if(typeof showToast==='function') showToast('No respondiste a tiempo — la prensa se queda sin declaraciones.', 'toast-neutral');
      onDone();
    }, DURATION);
    overlay.querySelectorAll('[data-lm-press-answer]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        if(respondido) return;
        respondido=true;
        clearTimeout(timerId);
        beepTimers.forEach(id=>clearTimeout(id));
        const idx=parseInt(btn.getAttribute('data-lm-press-answer'),10);
        const answer=event.answers[idx];
        state.lmPendingPrediction={event, answer};
        guardarEstado();
        if(typeof window.playSound==='function') window.playSound('select');
        if(typeof showToast==='function') showToast(`Promesa hecha: "${answer.label}"`, 'toast-neutral');
        setTimeout(onDone, 700);
      });
    });
  }
  // Resuelve la promesa pendiente contra el resultado real del partido
  // — mismo efecto que Copa Leyendas: ±8 de moral, o 0 si fue neutral.
  function resolverPrensaLM(miGoles, suGoles){
    if(!state.lmPendingPrediction) return null;
    const {answer}=state.lmPendingPrediction;
    state.lmPendingPrediction=null;
    if(answer.stance==='neutral'){
      return {label:answer.label, outcome:'neutral', delta:0, texto:'🎙 Respuesta neutral: la moral no se ve afectada.'};
    }
    const correcto=answer.check({myGoals:miGoles, oppGoals:suGoles, draw:miGoles===suGoles});
    const delta=correcto?8:-8;
    state.moral=Math.max(-50,Math.min(50,(state.moral||0)+delta));
    return {
      label:answer.label, outcome:correcto?'correct':'wrong', delta,
      texto: correcto
        ? `🎙 Promesa cumplida ("${answer.label}"): +${delta} moral.`
        : `🎙 Promesa incumplida ("${answer.label}"): ${delta} moral.`
    };
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
          <span><strong>${l.nombre}</strong> — sobrecarga ${l.familia==='muscular'?'muscular':'ósea'} (leve)</span>
        </div>`).join('');
      overlay.innerHTML=`
        <div class="lm-dilemma-card lm-semana-card-fija" style="width:420px;max-width:92vw;text-align:left">
          <div class="lm-dilemma-title"><i class="ph ph-bold ph-flag-checkered"></i> SEMANA COMPLETADA</div>
          ${rival?`<div class="lm-rival-crest-block" style="margin:6px auto 12px">${rivalCrestHTML(56, rival.crestImg)}<span class="lm-title" style="font-size:13px">Próximo: ${rival.name}</span></div>`:''}
          <div class="lm-resumen-stats-row">
            <div class="lm-resumen-stat"><i class="ph ph-bold ph-barbell" style="color:#e08a3e"></i><strong>${r.diasEntreno}</strong><span>entreno</span></div>
            <div class="lm-resumen-stat"><i class="ph ph-bold ph-bed" style="color:#5dcaa5"></i><strong>${r.diasDescanso}</strong><span>descanso</span></div>
            <div class="lm-resumen-stat"><i class="ph ph-bold ph-trend-up" style="color:#5dcaa5"></i><strong>${totalMejoras}</strong><span>mejoras</span></div>
            <div class="lm-resumen-stat"><i class="ph ph-bold ph-first-aid-kit" style="color:#e24b4a"></i><strong>${r.lesiones.length}</strong><span>lesiones</span></div>
          </div>
          ${(filasMejoras||filasLesiones)?`<div class="lm-resumen-lista">${filasMejoras}${filasLesiones}</div>`:'<p class="lm-setup-desc" style="text-align:center">Semana sin incidencias reseñables.</p>'}
          <div class="lm-popup-actions" style="justify-content:center">
            <button id="lmSemanaAceptarBtn" class="mode-card-btn mode-card-btn-gold" style="width:auto;padding:10px 30px">ACEPTAR</button>
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
      const nombreDia=DIAS_LARGO[ev.fecha.getDay()];
      if(typeof window.playSound==='function') window.playSound(ev.tipo==='entreno'?'training_day':'rest_day');
      overlay.innerHTML=`
        <div class="lm-dilemma-card lm-semana-card-fija" style="width:380px;max-width:92vw">
          <div class="lm-dilemma-title" style="text-transform:uppercase;justify-content:center;text-align:center">${nombreDia} ${ev.fecha.getDate()}</div>
          <div class="lm-semana-dia-icono ${ev.tipo==='entreno'?'lm-semana-entreno':'lm-semana-descanso'}">
            <i class="ph ph-bold ${ev.tipo==='entreno'?'ph-barbell':'ph-bed'}"></i>
          </div>
          <div class="lm-semana-dia-tag">${ev.tipo==='entreno'?'ENTRENAMIENTO':'DESCANSO'}</div>
          <div class="lm-semana-dia-textos">
            ${ev.textos.map(t=>`<p>${t}</p>`).join('')}
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
        const prensaResuelta=resolverPrensaLM(miGoles, suGoles);
        if(prensaResuelta) guardarEstado();
        document.getElementById('lmPostMatchInfo').innerHTML=`
          <div class="match-result-tag ${resultClass}">${resultText}</div>
          <div class="match-summary">
            <strong>${state.nombreEquipo}</strong> ${miGoles} – ${suGoles} <strong>${info.home.id==='lm_0'?info.away.name:info.home.name}</strong><br>
            ${golesA} gol${golesA===1?'':'es'} en total · ${tarjetasA} tarjeta${tarjetasA===1?'':'s'}${lesionA?` · 1 lesión (${lesionA.jugador.name})`:''}
          </div>
          ${prensaResuelta?`<div class="press-prediction-section ${prensaResuelta.outcome==='correct'?'press-prediction-good':prensaResuelta.outcome==='wrong'?'press-prediction-bad':'press-prediction-neutral'}">${prensaResuelta.texto}</div>`:''}`;

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
      jugador: jugador.name, jugadorId: jugador.id, jornadaInicio: state.jornadaActual, rival,
      severidad: sev.label, tipoLesion, familia, semanasPrevistas: sev.weeks,
      resuelta:false, resueltoPor:null, jornadasReales:null
    });
    // El médico avisa por correo de cualquier lesión nueva, no solo las
    // graves — así el aviso llega siempre, no solo en los casos más raros.
    if(state.trabajadores && state.trabajadores.medico && typeof enviarCorreo==='function'){
      enviarCorreo('medico', `${jugador.name} se ha lesionado`,
        `${jugador.name} sufre ${tipoLesion?tipoLesion.toLowerCase():'una lesión'} (${sev.label}). Previsión: ${sev.weeks} jornada${sev.weeks===1?'':'s'} de baja.`);
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
      enviarCorreo('medico', `${jugador.name} recupera la disponibilidad`, `Buenas noticias: ${jugador.name} ya está completamente recuperado y disponible para jugar.`);
    }
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
    {id:'prevencion_muscular',tipo:'nivel', track:'prevencionMuscular', nombre:'Programa de Prevención Muscular', icon:'ph-heartbeat',        dificultadBase:8, dificultadPaso:4, desc:'Reduce el riesgo de lesiones musculares (partido y sobrecarga por exceso de entrenamiento)'},
    {id:'prevencion_osea',   tipo:'nivel', track:'prevencionOsea',     nombre:'Protocolo de Protección Ósea',  icon:'ph-shield-plus',       dificultadBase:9, dificultadPaso:4, desc:'Reduce el riesgo de lesiones óseas (partido y sobrecarga por exceso de entrenamiento)'}
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
    {track:'prevencionMuscular', label:'Prevención muscular',   icon:'ph-heartbeat',         desc:'Lesión muscular en partido o por sobrecarga de entreno'},
    {track:'prevencionOsea',     label:'Protección ósea',       icon:'ph-shield-plus',       desc:'Lesión ósea en partido o por sobrecarga de entreno'}
  ];
  function estrellasNivel(n, max){ max=max||NIVEL_MAXIMO_EQUIPO; n=Math.max(0,Math.min(max,n)); return '★'.repeat(n) + '☆'.repeat(max-n); }
  function renderNivelesEquipoHTML(){
    return `<div class="med-niveles-grid">${NIVELES_EQUIPO_INFO.map(info=>{
      const n=nivelDe(info.track);
      const completado=n>=NIVEL_MAXIMO_EQUIPO;
      return `<div class="med-nivel-row${completado?' med-nivel-completado':''}">
        ${completado?'<i class="ph ph-bold ph-check-circle med-nivel-check" title="Proyecto completado"></i>':''}
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
      const completado=n>=NIVEL_MAXIMO_EQUIPO;
      return `<div class="med-nivel-row${completado?' med-nivel-completado':''}">
        ${completado?'<i class="ph ph-bold ph-check-circle med-nivel-check" title="Proyecto completado"></i>':''}
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
  // Cierre universal de popups: botón X en la esquina + clic fuera de la
  // tarjeta (sobre el fondo oscuro) también cierra.
  function xCerrarHTML(){ return '<button class="lm-popup-close-x" data-cerrar-x title="Cerrar">×</button>'; }
  function habilitarCierreOverlay(overlay, cerrarFn){
    overlay.addEventListener('click', (e)=>{ if(e.target===overlay) cerrarFn(); });
  }
  // Aviso propio del juego — sustituye al alert() nativo del navegador
  // (ese "www.goal2goat.com dice" no pinta nada aquí).
  // Botón "MOSTRAR INFORMACIÓN" de cada hub — un clic la abre, y se
  // cierra con la X, con CERRAR, o clicando fuera (igual que el resto
  // de ventanas del juego). Cada función abrirInfoFn ya trae su propio
  // cierre completo cuando se le pasa "false" (modo normal, no efímero).
  function mostrarInfoHTML(){
    return `<button type="button" class="mode-card-btn mode-card-btn-secondary lm-mostrar-info-btn" data-mostrar-info><i class="ph ph-bold ph-eye"></i> MOSTRAR INFORMACIÓN</button>`;
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
  function mostrarRevelacionSobreDesdeCorreo(jugadores, onCerrar){
    const overlay=document.createElement('div');
    overlay.id='lmSobreCorreoOverlay';
    overlay.innerHTML=`
      <div class="lm-sobre-apertura-wrap">
        <div class="lm-sobre-apertura-titulo">SOBRE DE FICHAJES</div>
        <div class="lm-sobre-apertura-stage">
          <img src="assets/images/sobre.png" class="lm-sobre-img-flotante" id="lmSobreImgArrastrable" draggable="false">
          <div class="lm-sobre-rasga-zona" id="lmSobreGrabZone">
            <span class="lm-sobre-rasga-flecha lm-sobre-rasga-flecha-izq"><i class="ph ph-bold ph-caret-left"></i></span>
            <span class="lm-sobre-rasga-linea"></span>
            <span class="lm-sobre-rasga-flecha lm-sobre-rasga-flecha-der"><i class="ph ph-bold ph-caret-right"></i></span>
          </div>
        </div>
        <div class="lm-sobre-apertura-hint" id="lmSobreHint">ARRASTRA HACIA UN LADO POR LA FRANJA MARCADA</div>
      </div>`;
    document.getElementById('ligaManagerScreen').appendChild(overlay);

    const img=overlay.querySelector('#lmSobreImgArrastrable');
    const zona=overlay.querySelector('#lmSobreGrabZone');
    const hint=overlay.querySelector('#lmSobreHint');
    const UMBRAL_APERTURA=70; // px que hay que arrastrar hacia cualquier lado para que el sobre se abra
    let arrastrando=false, startX=0, abierto=false;

    function posX(e){ return (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX; }

    function onMove(e){
      if(!arrastrando || abierto) return;
      const deltaCrudo=posX(e)-startX; // negativo = hacia la izquierda, positivo = hacia la derecha
      const delta=Math.abs(deltaCrudo);
      const progreso=Math.min(1, delta/UMBRAL_APERTURA);
      img.style.transform=`translateX(${deltaCrudo*0.5}px) scale(${1+progreso*0.05})`;
      img.style.filter=`brightness(${1+progreso*0.35})`;
      zona.style.opacity=String(1-progreso*0.7);
      hint.style.opacity=String(1-progreso);
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
    overlay.innerHTML=`
      <div class="lm-dilemma-card lm-dilemma-card-dd" style="max-width:640px">
        <div class="lm-dilemma-title"><i class="ph ph-bold ph-envelope-open"></i> SOBRE DE FICHAJES</div>
        <div id="lmSobreReveloZoneCorreo" class="lm-sobre-grid">
          ${jugadores.map((j,i)=>`<div class="slot-reel lm-sobre-reel" id="lmSobreReelC${i}"><div class="slot-strip lm-sobre-face">?</div></div>`).join('')}
        </div>
        <div id="lmSobreResultadoCorreo"></div>
      </div>`;
    let ticks=0;
    const totalTicks=11+Math.floor(Math.random()*4);
    const spin=setInterval(()=>{
      jugadores.forEach((j,i)=>{
        const el=document.getElementById('lmSobreReelC'+i);
        if(el) el.querySelector('.lm-sobre-face').textContent=nombreJugadorAleatorio();
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
        zona.innerHTML=`${hayEstrella?'<div class="lm-fichaje-estrella-banner"><i class="ph ph-bold ph-sparkle"></i> ¡HAY UN FICHAJE ESTRELLA EN ESTE SOBRE! <i class="ph ph-bold ph-sparkle"></i></div>':''}
          <div class="lm-sobre-cards">${jugadores.map((j,i)=>`
          <div class="lm-sobre-card ${j.esFichajeEstrella?'lm-sobre-card-estrella':''}" data-jugador="${i}">
            ${j.esFichajeEstrella?`<div class="lm-fichaje-estrella-tag"><i class="ph ph-bold ph-star"></i> FICHAJE ESTRELLA</div>`:''}
            <div class="lm-sobre-pos">${j.position}</div>
            <div class="lm-sobre-nombre">${j.numero?('#'+j.numero+' '):''}${j.name}</div>
            ${j.esFichajeEstrella?`<div class="lm-sobre-procedencia">actualmente en ${j.equipoOrigenName}</div>`:''}
            <div class="lm-sobre-overall">${j.overall} <span>puntuación</span></div>
            <div class="lm-sobre-stats">
              <span>ATA ${j.attack}</span><span>DEF ${j.defense}</span><span>RIT ${j.pace}</span>
              <span>PAS ${j.passing}</span><span>TEC ${j.technique}</span>
            </div>
            <div class="lm-sobre-salario">${formatoDinero(j.salario)}/mes</div>
            <button class="mode-card-btn mode-card-btn-gold lm-sobre-fichar" data-fichar="${i}">FICHAR</button>
          </div>`).join('')}</div>
          <div class="lm-popup-actions" style="margin-top:12px"><button id="lmSobreCerrarCorreo" class="mode-card-btn mode-card-btn-secondary">CERRAR SOBRE</button></div>`;
        let fichadoNombre=null;
        zona.querySelectorAll('[data-fichar]').forEach(btn=>{
          btn.addEventListener('click', ()=>{
            const i=parseInt(btn.getAttribute('data-fichar'),10);
            if(typeof window.playSound==='function') window.playSound('select');
            ficharJugadorSobre(jugadores[i]);
            fichadoNombre=jugadores[i].name;
            btn.textContent='FICHADO ✔';
            btn.disabled=true;
            btn.closest('.lm-sobre-card').classList.add('lm-sobre-card-fichado');
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
      <div class="lm-dilemma-card" style="max-width:560px">
        ${xCerrarHTML()}
        <div class="lm-dilemma-title"><i class="ph ph-bold ph-ranking"></i> CLASIFICACIÓN</div>
        <div class="lm-table-wrap">
          <table class="lm-table">
            <thead><tr><th></th><th>#</th><th>Equipo</th><th>PJ</th><th>G</th><th>E</th><th>P</th><th>Pts</th></tr></thead>
            <tbody>
              ${clasif.map((t,i)=>`<tr class="${t.id==='lm_0'?'lm-myteam':''} lm-zona-${zonaClasificacion(i+1)}">
                <td>${t.id==='lm_0'?crestHTML(state.escudo,18):rivalCrestHTML(18, t.crestImg)}</td>
                <td>${i+1}</td><td>${t.name}</td><td>${t.pj}</td><td>${t.pg}</td><td>${t.pe}</td><td>${t.pp}</td><td><strong>${t.pts}</strong></td>
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
        <div class="lm-popup-actions"><button id="lmClasifCerrarBtn" class="mode-card-btn mode-card-btn-gold">CERRAR</button></div>
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
        <div class="bench-title" style="margin-top:6px"><span><i class="ph ph-bold ph-t-shirt" style="color:var(--gold);margin-right:6px"></i>ONCE TITULAR</span></div>
        <div>
          <table class="roster-table">
            <thead><tr><th>#</th><th>Jugador</th><th>Pos</th><th>ATA</th><th>DEF</th><th>RIT</th><th>PAS</th><th>TEC</th><th>Rat.</th></tr></thead>
            <tbody>${titulares.map(filaJugadorRival).join('')}</tbody>
          </table>
        </div>
        <div class="bench-title" style="margin-top:14px"><span><i class="ph ph-bold ph-chair" style="color:var(--gold);margin-right:6px"></i>BANQUILLO</span></div>
        <div>
          <table class="roster-table">
            <thead><tr><th>#</th><th>Jugador</th><th>Pos</th><th>ATA</th><th>DEF</th><th>RIT</th><th>PAS</th><th>TEC</th><th>Rat.</th></tr></thead>
            <tbody>${banquillo.map(filaJugadorRival).join('')}</tbody>
          </table>
        </div>
        <div class="lm-popup-actions lm-popup-actions-compact">
          <button id="lmOnceRivalCerrar" class="mode-card-btn mode-card-btn-gold">CERRAR</button>
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
  function mostrarAvisoJuego(mensaje, titulo){
    const overlay=document.createElement('div');
    overlay.id='lmAvisoOverlay';
    overlay.innerHTML=`
      <div class="lm-dilemma-card" style="max-width:400px">
        <div class="lm-dilemma-title"><i class="ph ph-bold ph-warning-circle"></i>${titulo||'AVISO DEL CLUB'}</div>
        <div class="lm-dilemma-text" style="margin:10px 0 16px">${mensaje}</div>
        <div class="lm-popup-actions lm-popup-actions-compact">
          <button id="lmAvisoCerrar" class="mode-card-btn mode-card-btn-gold">ENTENDIDO</button>
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
    const nominaDG=(trab.directorGeneral?trab.directorGeneral.sueldo:0)+nivelTotalDe(state.directorGeneralNiveles)*1500;
    const nominaDD=(trab.directorDeportivo?trab.directorDeportivo.sueldo:0)+nivelTotalDe(state.directorDeportivoNiveles)*1500;
    const nominaPF=(trab.preparadorFisico?trab.preparadorFisico.sueldo:0)+nivelTotalDe(state.preparadorFisicoNiveles)*1200;
    const nominaStaff=nominaMedico+nominaMantenimiento+nominaDG+nominaDD+nominaPF;
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
      enviarCorreo('directorGeneral', 'Nóminas de este mes pagadas',
        `Se han pagado las nóminas de este mes: ${formatoDinero(nominaJugadores)} de la plantilla y ${formatoDinero(nominaStaff)} del cuerpo técnico${n.ingresoPatrocinio>0?`, compensados con ${formatoDinero(n.ingresoPatrocinio)} de patrocinio`:''}. Balance neto del mes: ${netoMes>=0?'+':''}${formatoDinero(netoMes)}. Capital actual: ${formatoDinero(state.capital)}.`);
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
  const NOMBRE_ROL={medico:'Equipo Médico', mantenimiento:'Mantenimiento y Seguridad', directorGeneral:'Director General', directorDeportivo:'Director Deportivo', preparadorFisico:'Preparador Físico'};
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
  function enviarCorreo(rol, asunto, cuerpo){
    if(!state.correoInterno) state.correoInterno=[];
    if(!state.correoUltimoEnviado) state.correoUltimoEnviado={};
    state.correoInterno.unshift({id:'mail'+Date.now()+Math.floor(Math.random()*100000), rol, asunto, cuerpo, jornada:state.jornadaActual, leido:false});
    state.correoUltimoEnviado[rol]=state.jornadaActual;
    if(state.correoInterno.length>40) state.correoInterno=state.correoInterno.slice(0,40);
  }
  function borrarCorreo(mailId){
    if(!state.correoInterno) return;
    state.correoInterno=state.correoInterno.filter(c=>c.id!==mailId);
    if(correoExpandido===mailId) correoExpandido=null;
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
        enviarCorreo('mantenimiento', 'El estado del césped es preocupante',
          `El césped está en ${Math.round(est.campo)}/100. Como sigamos así, va a subir el riesgo de lesión y la afición lo va a notar. Convendría invertir en el terreno de juego pronto.`);
      } else if(est.satisfaccion<-30){
        enviarCorreo('mantenimiento', 'La grada está muy descontenta',
          `La satisfacción de la afición ha caído a ${est.satisfaccion}. Sería buena idea organizar algo para calmar los ánimos antes de que vaya a más.`);
      }
    }
    if(trab.medico && !yaEnviado('medico')){
      const lesionados=(state.plantilla||[]).filter(p=>p.injured);
      const graves=lesionados.filter(p=>p.injurySeverity==='grave');
      if(graves.length){
        enviarCorreo('medico', `${graves[0].name} tiene una lesión grave`,
          `${graves[0].name} se ha lesionado de gravedad y va a necesitar bastante tiempo de baja. Revisa las cartas del equipo médico por si podemos acelerar la recuperación.`);
      } else if(lesionados.length>=3){
        enviarCorreo('medico', `${lesionados.length} jugadores lesionados a la vez`,
          `Tenemos ${lesionados.length} bajas en la enfermería al mismo tiempo. La plantilla puede ir justa para el próximo partido, échale un ojo.`);
      }
    }
    if(trab.directorGeneral && !yaEnviado('directorGeneral')){
      if((state.capital||0)<0){
        enviarCorreo('directorGeneral', 'Números rojos en las cuentas del club',
          `El capital del club está en negativo (${formatoDinero(state.capital)}). Hay que generar ingresos o recortar gastos cuanto antes.`);
      } else {
        const nomina=calcularNominaMensual();
        if((state.capital||0)<nomina.total){
          enviarCorreo('directorGeneral', 'La próxima nómina puede dar problemas',
            `Con el capital actual (${formatoDinero(state.capital)}) no cubrimos la próxima nómina (${formatoDinero(nomina.total)}). Conviene reaccionar antes de que llegue el mes.`);
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
      enviarCorreo('directorDeportivo', 'Sobre de fichajes listo para abrir',
        `Tenemos un sobre de nivel ${nivelSobre} disponible. En cuanto tengas un momento, ábrelo directamente desde aquí para ver qué nos ha traído la red de ojeadores.`);
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
    let d=def.dificultadBase + nivelDeDD(def.track)*def.dificultadPaso;
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
  // de Ojeadores, mejor (y más caro de mantener) — tal como se pidió. Si
  // hay una posición objetivo marcada desde el Director Deportivo, los
  // ojeadores se centran en ella en vez de salir al azar.
  function generarJugadorSobre(nivelSobre, posicionForzada){
    const calidad=nivelDeDD('calidadOjeo');
    const canteraBonus=nivelDeDD('costeSobres')*3;
    const bonusInforme = (state.directorDeportivoBonos && state.directorDeportivoBonos.bonusCalidadSobre) ? 8 : 0;
    const overall=Math.max(45, Math.min(96, 50+nivelSobre*10+calidad*4+canteraBonus+bonusInforme+Math.floor(Math.random()*8)));
    const posiciones=['POR','DFC','LI','LD','MC','EI','ED','DC'];
    const position = (posicionForzada && posiciones.includes(posicionForzada)) ? posicionForzada : posiciones[Math.floor(Math.random()*posiciones.length)];
    const variar=()=>Math.max(30,Math.min(96, overall+Math.floor(Math.random()*13)-6));
    const ahorro=nivelDeDD('ahorroSalarial')*0.12;
    const salario=Math.round(calcularSalario(overall)*(1-ahorro));
    return {
      id:'s'+Date.now()+Math.floor(Math.random()*100000), name:nombreJugadorAleatorio(), position, overall,
      attack:variar(), defense:variar(), pace:variar(), passing:variar(), technique:variar(),
      fatigue:100, racha:0, esSuplente:true,
      injured:false, injuryWeeks:0, injurySeverity:null,
      salario, nivelSobre, esFichajeEstrella:false
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
    return [...disponibles].sort((a,b)=>puntuacion(b)-puntuacion(a)).slice(0,16);
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
    const coste=SOBRE_COSTES[sobre.nivel]||SOBRE_COSTES[1];
    if((state.capital||0)<coste) return null;
    state.capital-=coste;
    registrarMovimientoFinanciero('Sobre de fichajes (nivel '+sobre.nivel+')', -coste, state.jornadaActual);
    state.sobresFichajesPendientes.splice(idx,1);
    const posObjetivo=posicionObjetivoOjeoActual();
    // Probabilidad de fichaje estrella: nula a nivel 0-1, y creciente a
    // partir de nivel 2 de la Red de Ojeadores — como se pidió.
    const nivelRed=nivelDeDD('sobresFichajes');
    const probEstrella = nivelRed>=3 ? 0.35 : (nivelRed===2 ? 0.18 : 0);
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
  function ficharJugadorSobre(jugador){
    state.plantilla.push({...jugador, esSuplente:true});
    if(jugador.esFichajeEstrella && jugador.equipoOrigenId){
      if(!state.jugadoresRealesFichados) state.jugadoresRealesFichados=[];
      state.jugadoresRealesFichados.push({equipoId:jugador.equipoOrigenId, nombre:jugador.name});
    }
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
  function dificultadActualNivelPF(def){ return def.dificultadBase + nivelDePF(def.track)*def.dificultadPaso; }
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
    if(state.preparadorFisicoCambioUsado) return false;
    const otras=state.preparadorFisicoCartas.filter((c,i)=>i!==idx).map(c=>c.cartaId);
    const nueva=generarCartaAleatoriaPF(otras);
    if(!nueva) return false;
    state.preparadorFisicoCartas[idx]=nueva;
    state.preparadorFisicoCambioUsado=true;
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
    const NOMBRE_STAT={attack:'ataque',defense:'defensa',pace:'ritmo',passing:'pase',technique:'técnica'};
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
    const suma=tiradas.reduce((a,b)=>a+b,0);
    let resultado;
    if(def.tipo==='directa'){
      const exito=suma>=def.dificultad;
      if(exito){
        const efecto=aplicarEfectoDirectaPF(def);
        state.preparadorFisicoCartas[idx]=generarCartaAleatoriaPF(state.preparadorFisicoCartas.map(c=>c.cartaId)) || instancia;
        resultado={tipo:'directa', exito:true, suma, dificultad:def.dificultad, texto:efecto.texto};
      } else {
        resultado={tipo:'directa', exito:false, suma, dificultad:def.dificultad, texto:'La carta se queda en tu mano — puedes reintentarlo más adelante'};
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
      window.showConfirmPopup('¿Abandonar la liga? Se perderá todo el progreso de esta temporada y volverás al menú principal.', proceder, 'ABANDONAR');
    } else if(confirm('¿Seguro que quieres abandonar la liga? Se perderá todo el progreso de esta temporada y volverás al menú principal.')){
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
    } else if(setupStep===2.5){
      inner=`
        <div class="lm-setup-title">¿CÓMO QUIERES EMPEZAR?</div>
        <div class="lm-setup-list">
          <div class="lm-setup-option ${setupData.modo==='propio'?'selected':''}" data-modo="propio">
            <i class="ph ph-bold ph-shield-plus" style="margin-right:10px;color:var(--gold)"></i>CREAR MI PROPIO EQUIPO
          </div>
          <div class="lm-setup-option ${setupData.modo==='existente'?'selected':''}" data-modo="existente">
            <i class="ph ph-bold ph-users-three" style="margin-right:10px;color:var(--gold)"></i>ELEGIR UN EQUIPO YA EXISTENTE
          </div>
        </div>
        <p class="lm-setup-desc">Puedes fundar un club nuevo con nombre y escudo propios, o ponerte al mando de uno de los 19 equipos reales de la liga, con su plantilla real.</p>
        <div class="lm-popup-actions"><button id="lmSetupNext" class="mode-card-btn mode-card-btn-gold" ${setupData.modo?'':'disabled'}>SIGUIENTE</button></div>
      `;
    } else if(setupStep===2.6){
      inner=`
        <div class="lm-setup-title">ELIGE TU EQUIPO</div>
        <p class="lm-setup-desc">Jugarás con su plantilla real. El resto de la liga son los otros 18 equipos.</p>
        <div class="lm-setup-list lm-setup-equipos-list">
          ${LM_RIVALS.map(r=>`
            <div class="lm-setup-option lm-setup-option-equipo ${setupData.equipoElegidoId===r.id?'selected':''}" data-equipo="${r.id}">
              ${rivalCrestHTML(28, r.crestImg)}<span>${r.name}</span>
            </div>`).join('')}
        </div>
        <div class="lm-popup-actions"><button id="lmSetupNext" class="mode-card-btn mode-card-btn-gold" ${setupData.equipoElegidoId?'':'disabled'}>EMPEZAR TEMPORADA</button></div>
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
          renderSetup();
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
    if(!state.correoInterno) state.correoInterno=[];
    if(!state.correoUltimoEnviado) state.correoUltimoEnviado={};
    if(!state.posicionObjetivoOjeo) state.posicionObjetivoOjeo='any';
    if(!state.ordenColumnas || state.ordenColumnas.length!==4) state.ordenColumnas=['left','center','right','staff'];
    if(!state.preparadorFisicoCartas || !state.preparadorFisicoCartas.length) state.preparadorFisicoCartas=inicializarCartasPF();
    if(!state.preparadorFisicoCartasAgotadas) state.preparadorFisicoCartasAgotadas=[];
    if(!state.preparadorFisicoHistorial) state.preparadorFisicoHistorial=[];
    if(!state.preparadorFisicoNiveles) state.preparadorFisicoNiveles={resistenciaBase:0, recuperacionSemanal:0, potencialTecnico:0, potencialFisico:0, planificacionSemanal:0};
    if(state.trabajadores && state.trabajadores.preparadorFisico===undefined) state.trabajadores.preparadorFisico=null;
    if(!state.fechaInicioLiga) state.fechaInicioLiga=fechaISO(proximoSabadoDesde(new Date()));
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
        <td class="lm-td-numero">${p.numero||'-'}</td>
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
        <div class="lm-panel lm-left-panel" style="${columnaOrderStyle('left')}">${columnaControlesHTML('left')}<div class="lm-scroll-hint" data-scroll-hint title="Hay más contenido si bajas"><i class="ph ph-bold ph-caret-down"></i></div>
          <div class="lm-header-team">
            ${crestHTML(state.escudo, 76)}
            <div style="flex:1;min-width:0">
              <div class="lm-title">${state.nombreEquipo.toUpperCase()}</div>
              <div class="lm-sub">Jornada ${Math.min(state.jornadaActual,38)} de 38 · ${monedaInfo.symbol}</div>
            </div>
            <button id="lmJugarBtn" class="lm-btn-jugar-icon" ${state.jornadaActual>38?'disabled':''} title="${state.jornadaActual>38?'Temporada completa':(hayVacantes?'Te falta cuerpo técnico por contratar, pero puedes jugar igualmente':'Jugar jornada')}">
              <i class="ph ph-bold ph-play-circle"></i>
              <span>${state.jornadaActual>38?'FIN':(state.semanaResueltaParaJornada===state.jornadaActual?'JUGAR':'SEGUIR')}</span>
            </button>
          </div>
          <div class="bench-title">
            <span><i class="ph ph-bold ph-t-shirt" style="color:var(--gold);margin-right:6px"></i>ONCE TITULAR</span>
            <span style="display:flex;align-items:center;gap:8px">
              <button id="lmSortBtn" class="lm-sort-btn" title="Cambiar orden" aria-label="Cambiar orden">
                <span id="lmSortLabel">${LM_SORT_LABELS[lmSortMode]}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M7 12h10M11 18h2"/></svg>
              </button>
              <span>${plantillaPrincipal.length}</span>
            </span>
          </div>
          <div>
            <table class="roster-table">
              <thead><tr><th>#</th><th>Jugador</th><th>Resist.</th><th>Pos</th><th>ATA</th><th>DEF</th><th>RIT</th><th>PAS</th><th>TEC</th><th>Rat.</th></tr></thead>
              <tbody>${filasPlantilla}</tbody>
            </table>
          </div>
          <div class="bench-title"><span><i class="ph ph-bold ph-chair" style="color:var(--gold);margin-right:6px"></i>BANQUILLO</span><span>${banquillo.length}</span></div>
          <div>
            <table class="roster-table">
              <thead><tr><th>#</th><th>Jugador</th><th>Resist.</th><th>Pos</th><th>ATA</th><th>DEF</th><th>RIT</th><th>PAS</th><th>TEC</th><th>Rat.</th></tr></thead>
              <tbody>${filasBanquillo}</tbody>
            </table>
          </div>

          <div class="team-profile box" style="margin-top:14px">
            <h3 id="lmPerfilEquipoHeader" class="lm-perfil-header"><i class="ph ph-bold ph-chart-bar" style="color:var(--gold);margin-right:6px"></i>PERFIL DEL EQUIPO <span class="lm-perfil-arrow ${perfilEquipoColapsado?'':'lm-perfil-arrow-open'}">▾</span></h3>
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

        <div class="lm-center-panel" style="${columnaOrderStyle('center')}">${columnaControlesHTML('center')}<div class="lm-scroll-hint" data-scroll-hint title="Hay más contenido si bajas"><i class="ph ph-bold ph-caret-down"></i></div>
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
              inner=`${statusIcons}<span class="pos-rating">${efectivoOverall(jugador)}</span><div class="player-info"><div class="lm-player-name-row"><span class="lm-player-name-text">${jugador.name}</span>${star}</div><div class="player-pos-label${inPos?'':' out-of-position'}">${label}</div></div>`;
            }
            const clases=['position', vacio?'empty-slot':'locked', lesionado?'lm-pos-injured':'', seleccionado?'highlight-pos':''].filter(Boolean).join(' ');
            return `<div class="${clases}" data-slot="${def.slot}" style="left:${def.x}%;top:${def.y}%" title="${jugador?jugador.name+' ('+efectivoOverall(jugador)+')':'Vacío'}">${inner}</div>`;
          }).join('')}</div>

          <div class="bench-title" style="margin-top:14px"><span><i class="ph ph-bold ph-strategy" style="color:var(--gold);margin-right:6px"></i>FORMACIÓN</span><span>${state.formacionCode}</span></div>
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

        <div class="lm-panel lm-right-panel" style="${columnaOrderStyle('right')}">${columnaControlesHTML('right')}<div class="lm-scroll-hint" data-scroll-hint title="Hay más contenido si bajas"><i class="ph ph-bold ph-caret-down"></i></div>
          <div class="lm-nextmatch-box">
            ${rival ? `
              <div class="lm-rival-top-row">
                <div class="lm-rival-crest-block">
                  <div class="lm-rival-crest-img-wrap">
                    ${rivalCrestHTML(88, rival.crestImg)}
                    <button class="lm-rival-lupa-btn" id="lmVerOnceRivalBtn" title="Ver su once titular y banquillo"><i class="ph ph-bold ph-magnifying-glass"></i></button>
                  </div>
                  <span class="lm-title" style="font-size:15px">${rival.name}</span>
                  <div class="lm-perfil-nota-grande">${Math.round((rival.attack+rival.defense+rival.pace+rival.passing+rival.technique)/5)}</div>
                </div>
                <div class="lm-rival-info-col">
                  <h3 class="lm-nextrival-header" style="text-align:left;margin:0 0 4px"><i class="ph ph-bold ph-flag" style="color:var(--gold);margin-right:6px"></i>PRÓXIMO RIVAL</h3>
                  <div class="lm-vs-label" style="text-align:left;margin-bottom:6px">${esLocal?'JUEGAS EN CASA':'JUEGAS FUERA'}</div>
                  ${(()=>{
                    const fila=calcularClasificacion();
                    const idx=fila.findIndex(t=>t.id===rival.id);
                    const datos=fila[idx]||{pj:0,pg:0,pe:0,pp:0,pts:0,gf:0,gc:0};
                    const dg=datos.gf-datos.gc;
                    return `<table class="lm-rival-mini-table">
                      <tr><td>Posición</td><td><strong>${idx+1}º</strong></td></tr>
                      <tr><td>Puntos</td><td><strong>${datos.pts}</strong></td></tr>
                      <tr><td>PJ (jugados)</td><td>${datos.pj}</td></tr>
                      <tr><td>G (ganados)</td><td>${datos.pg}</td></tr>
                      <tr><td>E (empatados)</td><td>${datos.pe}</td></tr>
                      <tr><td>P (perdidos)</td><td>${datos.pp}</td></tr>
                      <tr><td>Goles (F:C)</td><td>${datos.gf}:${datos.gc} <span style="color:${dg>=0?'#5dcaa5':'#e24b4a'}">(${dg>=0?'+':''}${dg})</span></td></tr>
                    </table>`;
                  })()}
                </div>
              </div>
              ${(()=>{
                const campoRival=campoRivalEstimado(rival);
                return `<div style="margin-top:6px">
                  <div class="lm-estadio-bar-label" style="font-size:10px"><i class="ph ph-bold ph-plant" style="font-size:12px"></i><span>ESTADO DE SU CAMPO${esLocal?'':' (hoy juegas aquí)'}</span><span>${campoRival}/100</span></div>
                  ${campoBarraHTML(campoRival, true)}
                </div>`;
              })()}
              <div class="lm-rival-profile">
                ${[['ATAQUE','attack'],['DEFENSA','defense'],['RITMO','pace'],['PASE','passing'],['TÉCNICA','technique']].map(([label,k])=>`
                  <div class="stat-row"><span>${label}</span><span>${rival[k]}</span></div>
                  <div class="stat-bar-row"><div class="stat-bar"><div style="width:${Math.max(0,Math.min(100,rival[k]))}%"></div></div></div>
                `).join('')}
              </div>` : `<div class="lm-vs-label" style="text-align:center">Temporada finalizada</div>`}
          </div>
          ${calendarioHTML()}
        </div>

        <div class="lm-panel lm-staff-panel" style="${columnaOrderStyle('staff')}">${columnaControlesHTML('staff')}<div class="lm-scroll-hint" data-scroll-hint title="Hay más contenido si bajas"><i class="ph ph-bold ph-caret-down"></i></div>
          <div class="lm-staff-bar-header">
            <div class="lm-staff-bar-title"><i class="ph ph-bold ph-users-three"></i> CUERPO TÉCNICO</div>
            <div class="lm-staff-bar-capital" title="Dados y rerolls disponibles este partido">
              <span><i class="ph ph-bold ph-dice-five"></i> DADOS: <strong>${state.diceAvailable}</strong></span>
              <span><i class="ph ph-bold ph-arrows-clockwise"></i> RERROLLS: <strong>${state.dadoRerollsDisponibles||0}</strong></span>
            </div>
          </div>
          ${hayVacantes?`<div class="lm-staff-warning"><i class="ph ph-bold ph-warning"></i> Todavía te falta cuerpo técnico por contratar — puedes jugar igualmente, pero conviene completarlo pronto.</div>`:''}
          <button id="lmTrabajadoresBtn" class="lm-btn-trabajadores" style="width:100%;margin-bottom:10px"><i class="ph ph-bold ph-user-plus"></i> CONTRATAR</button>
          <div class="lm-staff-bar-row">
            ${staffTileHTML('directorGeneral', {btnId:'lmDirectorGeneralBtn', infoId:'lmDirectorGeneralInfoBtn', infoTitle:'Finanzas del club', notif:notifDG, badgeTexto:'!', carpeta:'director_general', archivo:'director_general', alt:'Director General', icono:'ph-briefcase', rolLabel:'DIRECTOR GENERAL', acento:'lm-staff-tile-dg', desc:'Patrocinios, merchandising, aforo y precio de las entradas'})}
            ${staffTileHTML('directorDeportivo', {btnId:'lmDirectorDeportivoBtn', infoId:'lmDirectorDeportivoInfoBtn', infoTitle:'Salarios de la plantilla', notif:notifDD, badgeTexto:'!', carpeta:'director_deportivo', archivo:'director_deportivo', alt:'Director Deportivo', icono:'ph-binoculars', rolLabel:'DIRECTOR DEPORTIVO', acento:'lm-staff-tile-dd', desc:'Fichajes, ojeadores y sobres de nuevos jugadores'})}
            ${staffTileHTML('medico', {btnId:'lmMedicoBtn', infoId:'lmMedicoInfoBtn', infoTitle:'Historial médico', notif:notif, badgeTexto:'1', carpeta:'medico', archivo:'medico', alt:'Equipo médico', icono:'ph-first-aid-kit', rolLabel:'EQUIPO MÉDICO', desc:'Previene, diagnostica y trata las lesiones de tus jugadores', acento:'lm-staff-tile-medico'})}
            ${staffTileHTML('preparadorFisico', {btnId:'lmPreparadorFisicoBtn', infoId:'lmPreparadorFisicoInfoBtn', infoTitle:'Historial de entrenamientos', notif:false, badgeTexto:'', carpeta:'preparador_fisico', archivo:'preparador_fisico', alt:'Preparador Físico', icono:'ph-barbell', rolLabel:'PREPARADOR FÍSICO', desc:'Entrena a tus jugadores y mejora sus estadísticas de forma original', acento:'lm-staff-tile-pf'})}
            ${staffTileHTML('mantenimiento', {btnId:'lmMantenimientoBtn', infoId:'lmMantenimientoInfoBtn', infoTitle:'Estado del estadio', notif:notifMant, badgeTexto:'!', carpeta:'mantenimiento', archivo:'mantenimiento_y_seguridad', alt:'Mantenimiento y seguridad', icono:'ph-flag-pennant', rolLabel:'MANTENIMIENTO Y SEGURIDAD', desc:'Cuida el césped, la seguridad y la satisfacción de la afición', acento:'lm-staff-tile-mant'})}
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
                      ${c.ofertas.length?`<button class="lm-correo-oferta-rechazar" data-rechazar-oferta="${c.id}">Rechazar todas</button>`:''}
                    </div>`;
                  } else if(c.tipoEspecial==='oferta_jugador' && c.resuelto){
                    extra=`<div class="lm-correo-resultado">${c.resultadoTexto||''}</div>`;
                  } else if(c.tipoEspecial==='balance_mensual'){
                    extra=`<div class="lm-correo-ofertas"><button class="lm-correo-oferta-btn" data-ver-finanzas="1">VER FINANZAS</button></div>`;
                  } else if(c.tipoEspecial==='sobre_listo' && !c.resuelto){
                    const sobrePendiente=(state.sobresFichajesPendientes||[]).find(s=>s.id===c.sobreId);
                    if(sobrePendiente){
                      const coste=SOBRE_COSTES[sobrePendiente.nivel]||SOBRE_COSTES[1];
                      extra=`<div class="lm-correo-ofertas">
                        <button class="lm-correo-oferta-btn lm-sobre-abrir-btn" data-abrir-sobre-correo="${c.id}" data-sobre-id="${sobrePendiente.id}" ${((state.capital||0)<coste)?'disabled':''}>
                          <i class="ph ph-bold ph-envelope-open"></i> ABRIR SOBRE (${formatoDinero(coste)})
                        </button>
                      </div>`;
                    } else {
                      extra=`<div class="lm-correo-resultado">Este sobre ya se abrió.</div>`;
                    }
                  } else if(c.tipoEspecial==='sobre_listo' && c.resuelto){
                    extra=`<div class="lm-correo-resultado">${c.resultadoTexto||'Sobre ya abierto.'}</div>`;
                  }
                  cuerpoExtra=`<div class="lm-correo-cuerpo">${c.cuerpo||''}${extra}</div>`;
                }
                return `<div class="lm-correo-item ${c.leido?'':'lm-correo-no-leido'} ${correoExpandido===c.id?'lm-correo-expandido':''}" data-correo="${c.id}">
                  <div class="lm-correo-item-top">
                    <i class="ph ph-bold ${CORREO_ICONOS[c.rol]||'ph-envelope'}"></i>
                    <div class="lm-correo-item-info">
                      <div class="lm-correo-remitente">${NOMBRE_ROL[c.rol]||'Club'}</div>
                      <div class="lm-correo-asunto">${c.asunto||''}</div>
                    </div>
                    <button class="lm-correo-borrar" data-borrar-correo="${c.id}" title="Borrar mensaje"><i class="ph ph-bold ph-trash"></i></button>
                  </div>
                  ${cuerpoExtra}
                </div>`;
              }).join('') : '';
              return `<div class="lm-correo-box">
                ${sinLeer?'<span class="lm-correo-notif-dot"></span>':''}
                <div class="lm-correo-header">
                  <span><i class="ph ph-bold ph-envelope"></i> CORREO INTERNO</span>
                  ${sinLeer?`<span class="lm-correo-badge">${sinLeer}</span>`:''}
                </div>
                <div class="lm-correo-list">
                  ${filas||'<p class="lm-setup-desc" style="text-align:center;padding:10px 0">Bandeja vacía por ahora.</p>'}
                </div>
              </div>`;
            }catch(e){
              console.error('Error pintando el correo interno:', e);
              return `<div class="lm-correo-box"><div class="lm-correo-header"><span><i class="ph ph-bold ph-envelope"></i> CORREO INTERNO</span></div><div class="lm-correo-list"><p class="lm-setup-desc" style="text-align:center;padding:10px 0">No se pudo cargar el correo. Prueba a recargar.</p></div></div>`;
            }
          })()}
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
            if(info){ mostrarPartidoEnVivo(info, render); } else { render(); }
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
            if(typeof window.showConfirmPopup==='function'){
              window.showConfirmPopup('Has marcado días de entrenamiento en el calendario, pero no tienes a nadie en el Plan de Entrenamiento del Preparador Físico — esos días no mejorarán a ningún jugador. Puedes cerrar este aviso e ir a configurarlo, o seguir igualmente.', continuarSemana, 'SEGUIR IGUALMENTE');
              return;
            }
          }
          continuarSemana();
        };
        // Solo un aviso a la vez, y cada uno como mucho una vez en toda la
        // partida — nunca se apilan dos popups en el mismo clic.
        const faltaCuerpoTecnico=ROLES_TRABAJO.some(r=>!state.trabajadores[r]);
        if(faltaCuerpoTecnico && !state.avisoCuerpoTecnicoMostrado){
          state.avisoCuerpoTecnicoMostrado=true;
          guardarEstado();
          mostrarAvisoJuego('La dirección deportiva le recuerda que el organigrama del club tiene puestos por cubrir en el cuerpo técnico. El equipo puede competir con normalidad, pero se recomienda completar la plantilla técnica cuanto antes desde CONTRATAR para no ceder ventaja frente al resto de clubes de la competición.', 'PLANTILLA TÉCNICA INCOMPLETA');
          return;
        }
        jugarAhora();
      });
      jugarBtn.addEventListener('mouseenter', marcarInteraccionJugarBtn);
      jugarBtn.addEventListener('mousemove', marcarInteraccionJugarBtn);
      if(Date.now()-jugarBtnUltimaInteraccion>60000) jugarBtn.classList.add('lm-btn-jugar-pulse');
      iniciarPulseJugarBtn();
    }
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
    root.querySelectorAll('[data-ver-finanzas]').forEach(btn=>{
      btn.addEventListener('click', (e)=>{
        e.stopPropagation();
        if(typeof window.playSound==='function') window.playSound('select');
        abrirFinanzasDG();
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
    root.querySelectorAll('[data-borrar-correo]').forEach(btn=>{
      btn.addEventListener('click', (e)=>{
        e.stopPropagation();
        const mailId=btn.getAttribute('data-borrar-correo');
        if(typeof window.playSound==='function') window.playSound('select');
        borrarCorreo(mailId);
        render();
      });
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
      abrirSalariosDD();
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
          estado=`<span style="color:#e24b4a">Todavía de baja</span> (le quedan ${restante} jornada${restante===1?'':'s'}${tratado?' — <span style="color:#5dcaa5">tratamiento aplicado, se ha adelantado</span>':''})`;
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
              ${tratamientos.length?filas:'<p class="lm-setup-desc" style="text-align:center">Todavía no hay nada que contar — de momento tu plantilla está sana.</p>'}
            </div>
          </div>
          ${esModoMantener?'':`<div class="lm-popup-actions lm-popup-actions-compact">
            <button id="lmHistorialCerrar" class="mode-card-btn mode-card-btn-gold">CERRAR</button>
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
          // El efecto ya se aplicó y se guardó dentro de resolverFn — aquí
          // refrescamos el fondo (barras de fatiga, stats del jugador...)
          // en el acto, sin cerrar el propio popup que sigue abierto
          // encima. Blindado: si algo falla al refrescar el fondo, NUNCA
          // debe impedir que se vea el resultado y el botón CERRAR.
          try{
            const overlayPropio=zonaEl.closest('[id$="Overlay"]');
            if(overlayPropio && typeof render==='function'){
              render();
              document.getElementById('ligaManagerScreen').appendChild(overlayPropio);
            }
          }catch(e){ console.error('Refresco de fondo tras dados:', e); }
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
      if(tagEl) tagEl.textContent = rnd.tipo==='nivel' ? 'PROYECTO' : (rnd.tipo==='sobre' ? 'PROYECTO ESPECIAL' : 'MISIÓN');
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
      <button class="lm-col-arrow" data-mover-col="${key}" data-mover-dir="-1" ${esPrimera?'disabled':''} title="Mover a la izquierda">‹</button>
      <button class="lm-col-arrow" data-mover-col="${key}" data-mover-dir="1" ${esUltima?'disabled':''} title="Mover a la derecha">›</button>
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
      <div class="lm-staff-tile-photo">
        ${staffFotoHTML(o.carpeta, o.archivo, o.alt, o.icono, trab?trab.genero:'hombre', !trab)}
        ${o.notif?`<span class="lm-staff-tile-badge">${o.badgeTexto}</span>`:''}
        <button class="lm-staff-tile-info-btn" id="${o.infoId}" title="${o.infoTitle}"><i class="ph ph-bold ph-info"></i></button>
        <div class="lm-staff-tile-photo-fade"></div>
      </div>
      <div class="lm-staff-tile-body">
        <div class="lm-staff-tile-rol">${o.rolLabel}</div>
        <div class="lm-staff-tile-nombre">${trab?trab.nombre:'VACANTE'}</div>
        ${trab?`<div class="lm-staff-tile-estrellas">${estrellasNivel(trab.nivel, 3)}</div>`:'<div class="lm-staff-tile-vacante-txt">Contratar en TRABAJADORES</div>'}
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
      if(xEl){ overlay.remove(); render(); }
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
          <div class="med-card-tag">${def.tipo==='nivel'?'PROYECTO':(def.tipo==='acumulacion'?'PROYECTO':'MISIÓN')}</div>
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
          ${xCerrarHTML()}
          <div class="lm-dilemma-title"><i class="ph ph-bold ph-first-aid-kit"></i> EQUIPO MÉDICO</div>
          ${notif?`
          <div class="lm-urgente-row">
            <div class="lm-urgente-texto"><strong style="color:#e24b4a">URGENTE:</strong> ${jugadorUrgente?jugadorUrgente.name:'Un jugador'} tiene una lesión ${notif.severidad}.</div>
            <button id="lmAtenderUrgente" class="mode-card-btn mode-card-btn-gold">ATENDER (sumar ${notif.dificultad}+)</button>
          </div>` : ''}
          ${renderNivelesEquipoHTML()}
          <div class="lm-setup-desc" style="text-align:center;margin:10px 0 8px">dados disponibles este partido: <strong>${state.diceAvailable}</strong> (compartidos con el resto del cuerpo técnico) · cambios de carta: <strong>${state.medicoCambioUsado?0:1}/1</strong> · rerolls de dado hoy: <strong>${state.dadoRerollsDisponibles||0}/1</strong></div>
          <div class="med-card-grid">${cartasHTML}</div>
          <div class="lm-popup-actions lm-popup-actions-compact">
            ${mostrarInfoHTML()}
            <button id="lmMedicoCerrar" class="mode-card-btn mode-card-btn-secondary">CERRAR</button>
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
            <div class="lm-dilemma-title" style="justify-content:center;text-align:center">${def.nombre.toUpperCase()}</div>
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
        <div class="lm-dilemma-card lm-dilemma-card-medico lm-dice-roll-card">
            ${xCerrarHTML()}
          <div class="lm-dilemma-title" id="lmDiceTitle" style="justify-content:center;text-align:center">TIRANDO ${numDados} DADO${numDados>1?'S':''}...</div>
          <div class="lm-dice-reroll-info">rerrolls disponibles hoy: <strong>${state.dadoRerollsDisponibles||0}/1</strong></div>
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
            <div class="lm-dilemma-title" style="justify-content:center;text-align:center">EL MÉDICO TE CONSULTA</div>
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
          <div class="lm-dice-reroll-info">rerrolls disponibles hoy: <strong>${state.dadoRerollsDisponibles||0}/1</strong></div>
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
    habilitarCierreOverlay(overlay, ()=>{ overlay.remove(); render(); });
    // Delegado: cualquier X que aparezca dentro de este overlay en
    // cualquier pantalla (selector de dados, tirada, etc.) lo cierra.
    overlay.addEventListener('click', (e)=>{
      const xEl = e.target.closest && e.target.closest('[data-cerrar-x]');
      if(xEl){ overlay.remove(); render(); }
    });

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
          <div class="med-card-tag">${def.tipo==='nivel'?'PROYECTO':'MISIÓN'}</div>
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
          ${xCerrarHTML()}
          <div class="lm-dilemma-title"><i class="ph ph-bold ph-flag-pennant"></i> MANTENIMIENTO Y SEGURIDAD</div>
          ${renderNivelesMantenimientoHTML()}
          <div class="lm-setup-desc" style="text-align:center;margin:10px 0 8px">dados disponibles este partido: <strong>${state.diceAvailable}</strong> (compartidos con el resto del cuerpo técnico) · cambios de carta: <strong>${state.mantenimientoCambioUsado?0:1}/1</strong> · rerolls de dado hoy: <strong>${state.dadoRerollsDisponibles||0}/1</strong></div>
          <div class="med-card-grid">${cartasHTML}</div>
          <div class="lm-popup-actions lm-popup-actions-compact">
            ${mostrarInfoHTML()}
            <button id="lmMantenimientoCerrar" class="mode-card-btn mode-card-btn-secondary">CERRAR</button>
          </div>
        </div>`;
        wireMostrarInfoHold(overlay, abrirEstadoEstadio, 'lmEstadoEstadioOverlay');

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
            ${xCerrarHTML()}
            <i class="ph ph-bold ${def.icon}" style="font-size:26px;color:#5dcaa5"></i>
            <div class="lm-dilemma-title" style="justify-content:center;text-align:center">${def.nombre.toUpperCase()}</div>
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
        <div class="lm-dilemma-card lm-dilemma-card-mant lm-dice-roll-card">
            ${xCerrarHTML()}
          <div class="lm-dilemma-title" id="lmDiceTitle" style="justify-content:center;text-align:center">TIRANDO ${numDados} DADO${numDados>1?'S':''}...</div>
          <div class="lm-dice-reroll-info">rerrolls disponibles hoy: <strong>${state.dadoRerollsDisponibles||0}/1</strong></div>
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
        <div class="lm-dilemma-title"><i class="ph ph-bold ph-stadium"></i> ESTADO DEL ESTADIO</div>
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
        ${esModoMantener?'':`<div class="lm-popup-actions lm-popup-actions-compact">
          <button id="lmEstadoEstadioCerrar" class="mode-card-btn mode-card-btn-gold">CERRAR</button>
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
      if(xEl){ overlay.remove(); render(); }
    });

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
          <div class="med-card-tag">${def.tipo==='nivel'?'PROYECTO':'MISIÓN'}</div>
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
          ${xCerrarHTML()}
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
            ${mostrarInfoHTML()}
            <button id="lmDirectorGeneralCerrar" class="mode-card-btn mode-card-btn-secondary">CERRAR</button>
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
            ${xCerrarHTML()}
            <i class="ph ph-bold ${def.icon}" style="font-size:26px;color:#e6c94a"></i>
            <div class="lm-dilemma-title" style="justify-content:center;text-align:center">${def.nombre.toUpperCase()}</div>
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
        <div class="lm-dilemma-card lm-dilemma-card-dg lm-dice-roll-card">
            ${xCerrarHTML()}
          <div class="lm-dilemma-title" id="lmDiceTitle" style="justify-content:center;text-align:center">TIRANDO ${numDados} DADO${numDados>1?'S':''}...</div>
          <div class="lm-dice-reroll-info">rerrolls disponibles hoy: <strong>${state.dadoRerollsDisponibles||0}/1</strong></div>
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
      const completado=n>=NIVEL_MAXIMO_EQUIPO;
      return `<div class="med-nivel-row${completado?' med-nivel-completado':''}">
        ${completado?'<i class="ph ph-bold ph-check-circle med-nivel-check" title="Proyecto completado"></i>':''}
        <i class="ph ph-bold ${info.icon}"></i>
        <div class="med-nivel-info">
          <div class="med-nivel-label">${info.label}</div>
          <div class="med-nivel-desc">${info.desc}</div>
        </div>
        <div class="med-nivel-stars" title="Nivel ${n}/${NIVEL_MAXIMO_EQUIPO}">${estrellasNivel(n)}</div>
      </div>`;
    }).join('')}</div>`;
  }

  const NIVELES_DD_INFO=[
    {track:'calidadOjeo',     label:'Red de Ojeadores',        icon:'ph-binoculars',      desc:'Calidad de los jugadores que salen en los sobres'},
    {track:'ahorroSalarial',  label:'Negociación de Contratos',icon:'ph-handshake',       desc:'Ahorro en el salario de los jugadores fichados por sobre'},
    {track:'sobresFichajes',  label:'Red de Ojeadores Activa', icon:'ph-envelope-open',   desc:'Acorta el tiempo entre sobres — llegan solos por correo, no se abren desde aquí'},
    {track:'costeSobres',     label:'Formación de Cantera',    icon:'ph-graduation-cap',  desc:'Sube el nivel base de los canteranos que llegan por sobre'}
  ];
  function renderNivelesDDHTML(){
    return `<div class="med-niveles-grid">${NIVELES_DD_INFO.map(info=>{
      const n=nivelDeDD(info.track);
      const completado=n>=NIVEL_MAXIMO_EQUIPO;
      return `<div class="med-nivel-row${completado?' med-nivel-completado':''}">
        ${completado?'<i class="ph ph-bold ph-check-circle med-nivel-check" title="Proyecto completado"></i>':''}
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
        ${xCerrarHTML()}
        <div class="lm-dilemma-title"><i class="ph ph-bold ph-chart-line-up"></i> FINANZAS DEL CLUB</div>
        <div class="lm-capital-box" style="margin-bottom:12px">
          <i class="ph ph-bold ph-coins lm-capital-icon"></i>
          <div class="lm-capital-info">
            <div class="lm-capital-title"><span>CAPITAL ACTUAL</span><strong class="${(state.capital||0)<0?'lm-capital-neg':''}">${formatoDinero(state.capital)}</strong></div>
          </div>
        </div>
        ${filaMesActual}
        <p class="lm-setup-desc" style="text-align:left;margin:12px 0 4px">Histórico de meses anteriores (neto por mes)</p>
        ${graficoHistorico}
        ${esModoMantener?'':`<div class="lm-popup-actions lm-popup-actions-compact">
          <button id="lmFinanzasCerrar" class="mode-card-btn mode-card-btn-gold">CERRAR</button>
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
      if(xEl){ overlay.remove(); render(); }
    });

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
        return `
        <div class="med-card med-card-dd ${bloqueada&&!nivelMaximoYa?'med-card-bloqueada':''}" data-idx="${idx}">
          <button class="med-card-swap" data-swap="${idx}" title="Cambiar carta" ${cambioDisponible?'':'disabled'}><i class="ph ph-bold ph-arrows-clockwise"></i></button>
          <div class="med-card-tag">${def.tipo==='nivel'?'PROYECTO':'MISIÓN'}</div>
          <i class="ph ph-bold ${def.icon} med-card-icon"></i>
          <div class="med-card-title">${def.nombre}</div>
          <div class="med-card-divider"></div>
          <div class="med-card-desc">${def.desc}</div>
          ${cuerpo}
          ${botonAccion}
        </div>`;
      }).join('');

      overlay.innerHTML=`
        <div class="lm-dilemma-card lm-dilemma-card-dd" style="max-width:640px">
          ${xCerrarHTML()}
          <div class="lm-dilemma-title"><i class="ph ph-bold ph-binoculars"></i> DIRECTOR DEPORTIVO</div>
          <div class="lm-capital-box">
            <i class="ph ph-bold ph-coins lm-capital-icon"></i>
            <div class="lm-capital-info">
              <div class="lm-capital-title"><span>CAPITAL DEL CLUB</span><strong class="${(state.capital||0)<0?'lm-capital-neg':''}">${formatoDinero(state.capital)}</strong></div>
              <div class="lm-aforo-nota">${(()=>{
                const pendientes=(state.sobresFichajesPendientes||[]).length;
                if(pendientes>0) return `Tienes ${pendientes} sobre${pendientes>1?'s':''} esperando en el correo interno`;
                return nivelSobre>=1
                  ? `Red de Ojeadores a nivel ${nivelSobre}/${NIVEL_MAXIMO_EQUIPO} — los sobres llegan solos con el tiempo, avisan por correo`
                  : 'Sube la "Red de Ojeadores Activa" para que empiecen a llegar sobres con el tiempo';
              })()}</div>
            </div>
          </div>
          <div class="lm-precio-box">
            <div class="lm-estadio-bar-label"><i class="ph ph-bold ph-magnifying-glass"></i><span>POSICIÓN OBJETIVO DE LOS OJEADORES</span></div>
            <select id="lmPosicionOjeoSelect" class="lm-ojeo-select">
              <option value="any" ${(!state.posicionObjetivoOjeo||state.posicionObjetivoOjeo==='any')?'selected':''}>Cualquiera (por defecto)</option>
              ${['POR','DFC','LI','LD','MC','EI','ED','DC'].map(p=>`<option value="${p}" ${state.posicionObjetivoOjeo===p?'selected':''}>${p}</option>`).join('')}
            </select>
            <div class="lm-aforo-nota">Los ojeadores se centrarán en esta posición para los próximos sobres que abras.</div>
          </div>
          ${renderNivelesDDHTML()}
          <div class="lm-setup-desc" style="text-align:center;margin:10px 0 8px">dados disponibles este partido: <strong>${state.diceAvailable}</strong> (compartidos con el resto del cuerpo técnico) · cambios de carta: <strong>${state.directorDeportivoCambioUsado?0:1}/1</strong> · rerolls de dado hoy: <strong>${state.dadoRerollsDisponibles||0}/1</strong></div>
          <div class="med-card-grid">${cartasHTML}</div>
          <div class="lm-popup-actions lm-popup-actions-compact">
            ${mostrarInfoHTML()}
            <button id="lmDirectorDeportivoCerrar" class="mode-card-btn mode-card-btn-secondary">CERRAR</button>
          </div>
        </div>`;
        wireMostrarInfoHold(overlay, abrirSalariosDD, 'lmSalariosOverlay');

      const xBtnDD=overlay.querySelector('[data-cerrar-x]');
      const posicionOjeoSelect=document.getElementById('lmPosicionOjeoSelect');
      if(posicionOjeoSelect) posicionOjeoSelect.addEventListener('change', ()=>{
        state.posicionObjetivoOjeo=posicionOjeoSelect.value;
        if(typeof window.playSound==='function') window.playSound('select');
        guardarEstado();
      });
      if(xBtnDD) xBtnDD.addEventListener('click', ()=>{ overlay.remove(); render(); });
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
            <div class="lm-dilemma-title" style="justify-content:center;text-align:center">${def.nombre.toUpperCase()}</div>
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
        <div class="lm-dilemma-card lm-dilemma-card-dd lm-dice-roll-card">
            ${xCerrarHTML()}
          <div class="lm-dilemma-title" id="lmDiceTitle" style="justify-content:center;text-align:center">TIRANDO ${numDados} DADO${numDados>1?'S':''}...</div>
          <div class="lm-dice-reroll-info">rerrolls disponibles hoy: <strong>${state.dadoRerollsDisponibles||0}/1</strong></div>
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
        <div class="lm-dilemma-card lm-dilemma-card-dd" style="max-width:640px">
          <div class="lm-dilemma-title"><i class="ph ph-bold ph-envelope-open"></i> SOBRE DE FICHAJES</div>
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
              <div class="lm-sobre-overall">${j.overall} <span>puntuación</span></div>
              <div class="lm-sobre-stats">
                <span>ATA ${j.attack}</span><span>DEF ${j.defense}</span><span>RIT ${j.pace}</span>
                <span>PAS ${j.passing}</span><span>TEC ${j.technique}</span>
              </div>
              <div class="lm-sobre-salario">${formatoDinero(j.salario)}/mes</div>
              <button class="mode-card-btn mode-card-btn-gold lm-sobre-fichar" data-fichar="${i}">FICHAR</button>
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
          accion=`<span class="lm-venta-estado">EN VENTA (J${p.ventaResolverJornada})</span> <button class="lm-salario-btn lm-salario-btn-retirar" data-retirar-venta="${p.id}">RETIRAR</button>`;
        } else {
          accion=`<button class="lm-salario-btn" data-venta="${p.id}" title="${chequeo.ok?'':chequeo.motivo}" ${chequeo.ok?'':'disabled'}>PONER EN VENTA</button>`;
        }
        return `<tr>
          <td>${p.name}${p.injured?' <span class="cross" title="Lesionado">✚</span>':''}</td>
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
          <div class="lm-setup-desc" style="text-align:center;margin-bottom:8px">Nómina total: <strong>${formatoDinero(totalNomina)}/mes</strong> · plantilla: <strong>${jugadores.length}</strong> · al poner en venta, el Director Deportivo avisará por correo en 1-3 jornadas con las ofertas que lleguen.</div>
          <div class="lm-salarios-tabla-wrap">
            <table class="lm-salarios-tabla">
              <thead><tr><th>Jugador</th><th>Pos</th><th>Punt.</th><th>Salario</th><th></th></tr></thead>
              <tbody>${filas || '<tr><td colspan="5" style="text-align:center">No hay jugadores en la plantilla.</td></tr>'}</tbody>
            </table>
          </div>
          <div class="lm-popup-actions lm-popup-actions-compact">
            ${esModoMantener?'':'<button id="lmSalariosCerrar" class="mode-card-btn mode-card-btn-gold">CERRAR</button>'}
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
    {track:'resistenciaBase',     label:'Programa de Resistencia', icon:'ph-heartbeat',       desc:'Resistencia que se pierde al jugar cada partido'},
    {track:'recuperacionSemanal', label:'Recuperación Semanal',    icon:'ph-clock-clockwise', desc:'Recuperación extra de los titulares entre jornadas'},
    {track:'potencialTecnico',    label:'Potencial Técnico',       icon:'ph-soccer-ball',     desc:'Técnica de equipo, de forma permanente'},
    {track:'potencialFisico',     label:'Potencial Físico',        icon:'ph-lightning',       desc:'Ritmo de equipo, de forma permanente'}
  ];
  function renderNivelesPFHTML(){
    return `<div class="med-niveles-grid">${NIVELES_PF_INFO.map(info=>{
      const n=nivelDePF(info.track);
      const completado=n>=NIVEL_MAXIMO_EQUIPO;
      return `<div class="med-nivel-row${completado?' med-nivel-completado':''}">
        ${completado?'<i class="ph ph-bold ph-check-circle med-nivel-check" title="Proyecto completado"></i>':''}
        <i class="ph ph-bold ${info.icon}"></i>
        <div class="med-nivel-info">
          <div class="med-nivel-label">${info.label}</div>
          <div class="med-nivel-desc">${info.desc}</div>
        </div>
        <div class="med-nivel-stars" title="Nivel ${n}/${NIVEL_MAXIMO_EQUIPO}">${estrellasNivel(n)}</div>
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
        ${chips?`<div class="lm-plan-chips">${chips}</div>`:'<span>Todavía no has elegido a nadie para entrenar</span>'}
      </div>
      <button id="lmPlanEntrenoBtn" class="mode-card-btn mode-card-btn-secondary" style="padding:9px 16px;font-size:13px;white-space:nowrap">PLAN DE ENTRENAMIENTO</button>
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
      if(xEl){ overlay.remove(); render(); }
    });

    function renderHub(){
      const cartasHTML=state.preparadorFisicoCartas.map((instancia,idx)=>{
        const def=cartaDefPF(instancia.cartaId);
        const dificultadEfectiva = def.tipo==='nivel' ? dificultadActualNivelPF(def) : def.dificultad;
        const maxPosible = state.diceAvailable*6;
        const imposiblePorDados = maxPosible < dificultadEfectiva;
        const nivelMaximoYa = def.tipo==='nivel' && nivelDePF(def.track)>=NIVEL_MAXIMO_EQUIPO;
        const bloqueada = imposiblePorDados || nivelMaximoYa;
        const cambioDisponible=!state.preparadorFisicoCambioUsado;
        let cuerpo;
        if(def.tipo==='nivel'){
          const n=nivelDePF(def.track);
          cuerpo=`<div class="med-card-progress-label" style="text-align:center;letter-spacing:2px;color:var(--gold)">${estrellasNivel(n)}</div>
                  <div class="med-card-dificultad">${nivelMaximoYa?'Nivel máximo alcanzado':`Dificultad ${dificultadEfectiva}+ para subir a nivel ${n+1}/${NIVEL_MAXIMO_EQUIPO}`}</div>`;
        } else {
          cuerpo=`<div class="med-card-dificultad">Dificultad ${def.dificultad}+</div>`;
        }
        return `
        <div class="med-card med-card-pf ${bloqueada&&!nivelMaximoYa?'med-card-bloqueada':''}" data-idx="${idx}">
          <button class="med-card-swap" data-swap="${idx}" title="Cambiar carta" ${cambioDisponible?'':'disabled'}><i class="ph ph-bold ph-arrows-clockwise"></i></button>
          <div class="med-card-tag">${def.tipo==='nivel'?'PROYECTO':'MISIÓN'}</div>
          <i class="ph ph-bold ${def.icon} med-card-icon"></i>
          <div class="med-card-title">${def.nombre}</div>
          <div class="med-card-divider"></div>
          <div class="med-card-desc">${def.desc}</div>
          ${cuerpo}
          ${(bloqueada&&!nivelMaximoYa)?`<div class="med-card-bloqueada-label">Imposible con los dados que quedan</div>`:(nivelMaximoYa?'':`<button class="mode-card-btn mode-card-btn-gold med-card-btn" data-usar="${idx}" style="padding:7px;font-size:11px">USAR</button>`)}
        </div>`;
      }).join('');

      overlay.innerHTML=`
        <div class="lm-dilemma-card lm-dilemma-card-pf" style="max-width:640px">
          ${xCerrarHTML()}
          <div class="lm-dilemma-title"><i class="ph ph-bold ph-barbell"></i> PREPARADOR FÍSICO</div>
          ${renderNivelesPFHTML()}
          ${renderPlanEntrenamientoResumenHTML()}
          <div class="lm-setup-desc" style="text-align:center;margin:10px 0 8px">dados disponibles este partido: <strong>${state.diceAvailable}</strong> (compartidos con el resto del cuerpo técnico) · cambios de carta: <strong>${state.preparadorFisicoCambioUsado?0:1}/1</strong> · rerolls de dado hoy: <strong>${state.dadoRerollsDisponibles||0}/1</strong></div>
          <div class="med-card-grid">${cartasHTML}</div>
          <div class="lm-popup-actions lm-popup-actions-compact">
            ${mostrarInfoHTML()}
            <button id="lmPreparadorFisicoCerrar" class="mode-card-btn mode-card-btn-secondary">CERRAR</button>
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
          if(state.preparadorFisicoCambioUsado) return;
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
              <span>Añadir jugador</span>
            </div>`;
          }
          const p=state.plantilla.find(x=>x.id===slot.jugadorId);
          if(!p) return `<div class="lm-plan-slot lm-plan-slot-vacio" data-plan-slot-add="${i}"><i class="ph ph-bold ph-plus-circle"></i><span>Añadir jugador</span></div>`;
          return `<div class="lm-plan-slot">
            <div class="lm-plan-slot-top">
              <div class="lm-plan-slot-jugador">
                <strong>${p.name}</strong>
                <span class="lm-hist-tag">${p.position}</span>
              </div>
              <button class="lm-plan-slot-quitar" data-plan-slot-quitar="${i}" title="Quitar del plan"><i class="ph ph-bold ph-x"></i></button>
            </div>
            <div class="lm-plan-slot-label">Enfoque de este entrenamiento:</div>
            <div class="lm-plan-stat-row">
              ${STATS_ENTRENO.map(s=>`<button class="lm-plan-stat-btn ${slot.stat===s.key?'lm-plan-stat-activo':''}" data-plan-slot-stat="${i}" data-plan-stat-key="${s.key}" title="${s.label}"><i class="ph ph-bold ${s.icon}"></i><span>${s.label}</span></button>`).join('')}
            </div>
          </div>`;
        }).join('');
        const completos=slots.filter(s=>s && s.stat).length;
        overlay.innerHTML=`
          <div class="lm-dilemma-card lm-dilemma-card-pf" style="width:520px;max-width:92vw;text-align:left">
            ${xCerrarHTML()}
            <div class="lm-dilemma-title"><i class="ph ph-bold ph-clipboard-text"></i> PLAN DE ENTRENAMIENTO</div>
            <p class="lm-setup-desc" style="text-align:center;margin-bottom:10px">Elige hasta 3 jugadores y, para cada uno, QUÉ estadística quieres mejorar — un delantero puede entrenar ataque, un central defensa, etc. Solo mejoran de verdad los días de entrenamiento marcados en el calendario.</p>
            <div class="lm-plan-slots">${huecos}</div>
            <div class="lm-popup-actions">
              <button id="lmPlanGuardar" class="mode-card-btn mode-card-btn-gold">GUARDAR (${completos}/3)</button>
              <button id="lmPlanCancelar" class="lm-btn-cancelar">CERRAR</button>
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
              <button id="lmPlanVolver" class="lm-btn-cancelar">VOLVER</button>
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
            <div class="lm-dilemma-title" style="justify-content:center;text-align:center">${def.nombre.toUpperCase()}</div>
            <div class="lm-dilemma-text">${def.desc}${def.tipo==='directa'?` — necesitas sumar ${def.dificultad}+`:` — necesitas sumar ${dificultadActualNivelPF(def)}+ para subir a nivel ${nivelDePF(def.track)+1}/${NIVEL_MAXIMO_EQUIPO}`}</div>
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
        <div class="lm-dilemma-card lm-dilemma-card-pf lm-dice-roll-card">
            ${xCerrarHTML()}
          <div class="lm-dilemma-title" id="lmDiceTitle" style="justify-content:center;text-align:center">TIRANDO ${numDados} DADO${numDados>1?'S':''}...</div>
          <div class="lm-dice-reroll-info">rerrolls disponibles hoy: <strong>${state.dadoRerollsDisponibles||0}/1</strong></div>
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
        <div class="lm-dilemma-title"><i class="ph ph-bold ph-clock-counter-clockwise"></i> HISTORIAL DE ENTRENAMIENTOS</div>
        <p class="lm-setup-desc" style="text-align:left;margin:10px 0 4px">Mejoras individuales conseguidas</p>
        <div class="lm-hist-list">${filas||'<p class="lm-setup-desc" style="text-align:center">Todavía no se ha entrenado a ningún jugador.</p>'}</div>
        ${esModoMantener?'':`<div class="lm-popup-actions lm-popup-actions-compact">
          <button id="lmHistorialPFCerrar" class="mode-card-btn mode-card-btn-gold">CERRAR</button>
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
      if(xEl){ overlay.remove(); render(); }
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
        <div class="lm-trab-chip lm-trab-chip-vacante"><i class="ph ph-bold ph-user-circle-minus"></i><span>Vacante</span></div>`;
      const chipsCandidatos = candidatos.map(c=>`
        <div class="lm-trab-chip ${c.chollo?'lm-trab-chip-chollo':''}">
          ${c.chollo?'<div class="lm-trab-chollo-badge"><i class="ph ph-bold ph-seal-percent"></i> OPORTUNIDAD</div>':''}
          <div class="lm-trab-chip-top"><span class="lm-trab-nombre">${c.nombre}</span><span class="lm-trab-estrellas">${estrellasNivel(c.nivel, 3)}</span></div>
          <div class="lm-trab-sueldo">${formatoDinero(c.sueldo)}/mes</div>
          <button class="lm-trab-contratar" data-contratar="${c.id}" data-rol="${rol}">CONTRATAR</button>
        </div>`).join('');
      // Siempre 3 huecos de candidato aunque falten (p.ej. tras contratar
      // a uno este mes) — una ficha genérica gris y desactivada en vez de
      // dejar que la fila se reajuste horizontalmente.
      const huecos=Math.max(0, 3-candidatos.length);
      const chipsGenericos=Array.from({length:huecos}).map(()=>`
        <div class="lm-trab-chip lm-trab-chip-generica">
          <div class="lm-trab-chip-top"><span class="lm-trab-nombre">—</span></div>
          <div class="lm-trab-sueldo">Sin candidato</div>
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
          <div class="lm-dilemma-title"><i class="ph ph-bold ph-user-plus"></i> CONTRATAR${rolFiltrado?` — ${NOMBRE_ROL[rolFiltrado]}`:''}</div>
          <p class="lm-setup-desc" style="text-align:center;margin-bottom:10px">Cada mes aparecen nuevos candidatos por puesto — compara nivel y sueldo antes de decidir si te compensa un cambio.${rolFiltrado?' <span id="lmTrabVerTodos" style="color:var(--gold);cursor:pointer;text-decoration:underline">Ver todos los puestos</span>':''}</p>
          <div class="lm-trab-grid">
            ${roles.map(fichaTrabajadorHTML).join('')}
          </div>
          <div class="lm-popup-actions lm-popup-actions-compact">
            <button id="lmTrabajadoresCerrar" class="mode-card-btn mode-card-btn-gold">CERRAR</button>
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
              window.showConfirmPopup(`Ya tienes a ${actual.nombre} en este puesto. Al contratar a otra persona se le despedirá (finiquito de ${formatoDinero(finiquito)}). ¿Continuar?`, proceder, 'CONTRATAR');
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
  function init(){
    state=cargarEstado();
    setupStep=1;
    formacionCategoriaVista=null;
    seleccionJugador=null;
    render();
  }

  window.G2G_LigaManager={ init, abandonarLiga };

})();
