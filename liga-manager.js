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

  const SAVE_KEY = 'g2g_liga_manager_v04';
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

  const ESCUDO_ICONOS = ['ph-shield-star','ph-shield-check','ph-crown-simple','ph-fire','ph-lightning','ph-mountains','ph-paw-print','ph-star'];
  const ESCUDO_COLORES = ['#c9a227','#4a90d9','#e24b4a','#5dcaa5','#a05fd9','#e0862a','#8a95a0','#d94f8c'];

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
    const NOMBRES=["Álvaro","Adrián","Hugo","Mario","Pablo","Marcos","Diego","Sergio"];
    const APELLIDOS=["García","Fernández","López","Martínez","Sánchez","Pérez","Gómez","Ruiz"];
    const usados=new Set();
    const plantilla=[];
    for(let i=0;i<8;i++){
      let nombre;
      do{ nombre=NOMBRES[Math.floor(Math.random()*NOMBRES.length)]+' '+APELLIDOS[Math.floor(Math.random()*APELLIDOS.length)]; }while(usados.has(nombre));
      usados.add(nombre);
      plantilla.push({id:'p'+i, name:nombre, injured:false, injuryWeeks:0, injurySeverity:null});
    }
    return plantilla;
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
    const statsA={attack:teamA.attack,defense:teamA.defense,pace:teamA.pace,passing:teamA.passing,technique:teamA.technique};
    const statsB={attack:teamB.attack,defense:teamB.defense,pace:teamB.pace,passing:teamB.passing,technique:teamB.technique};
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

  function empezarTemporada(nombreEquipo, moneda, liga, escudo){
    const miEquipo={id:'lm_0', name:nombreEquipo, attack:52, defense:54, pace:56, passing:50, technique:50};
    const teams=[miEquipo, ...LM_RIVALS];
    state={
      setupComplete:true,
      liga, moneda, nombreEquipo, escudo,
      jornadaActual:1,
      calendario:generarCalendario(teams),
      resultados:{},
      plantilla:generarMiniPlantilla(),
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

  /* ---------- 6. Escudo — helper de render (icono + color, propio y simple) ---------- */
  function crestHTML(escudo, sizePx){
    sizePx=sizePx||28;
    if(!escudo) return `<i class="ph ph-bold ph-shield" style="font-size:${sizePx*0.6}px;color:#888"></i>`;
    return `<i class="ph ph-bold ${escudo.icon}" style="font-size:${sizePx*0.6}px;color:${escudo.color}"></i>`;
  }
  function rivalCrestHTML(sizePx){
    sizePx=sizePx||28;
    return `<i class="ph ph-bold ph-shield" style="font-size:${sizePx*0.6}px;color:#8a95a0"></i>`;
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
  function jugarJornada(){
    if(state.jornadaActual>38) return;
    const j=state.jornadaActual-1;
    const jornada=state.calendario[j];
    jornada.forEach(partido=>{
      const key=j+'-'+partido.home.id+'-'+partido.away.id;
      if(state.resultados[key]) return;
      state.resultados[key]=simularPartido(partido.home, partido.away);
    });

    // Fondo de dados: se resetea cada jornada — los que no se usaron en
    // la jornada anterior se pierden (use-it-or-lose-it, ya definido).
    state.diceAvailable = DICE_POOL_PER_MATCH;

    if(!state.medicoNotificacion && Math.random()<0.12){
      const sanos=state.plantilla.filter(p=>!p.injured);
      if(sanos.length){
        const jugador=sanos[Math.floor(Math.random()*sanos.length)];
        const severidades=[
          {label:'leve', weeks:1, dificultad:7},
          {label:'moderada', weeks:2, dificultad:10},
          {label:'grave', weeks:4, dificultad:13}
        ];
        const sev=severidades[Math.floor(Math.random()*severidades.length)];
        jugador.injured=true; jugador.injuryWeeks=sev.weeks; jugador.injurySeverity=sev.label;
        state.medicoNotificacion={jugadorId:jugador.id, dificultad:sev.dificultad, severidad:sev.label};
      }
    }
    state.plantilla.forEach(p=>{
      if(p.injured && p.injuryWeeks>0){
        p.injuryWeeks--;
        if(p.injuryWeeks<=0){ p.injured=false; p.injurySeverity=null; }
      }
    });

    state.jornadaActual++;
    guardarEstado();
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
    } else if(setupStep===3){
      inner=`
        <div class="lm-setup-title">NOMBRE DE TU EQUIPO</div>
        <p class="lm-setup-desc">Este será tu club, recién ascendido a Primera. El resto de la liga son los 19 equipos reales de La Liga.</p>
        <input id="lmSetupNombre" type="text" maxlength="24" placeholder="Ej: CF Ejemplo" class="lm-setup-input" value="${setupData.nombre||''}">
        <button id="lmSetupNext" class="mode-card-btn mode-card-btn-gold" style="width:auto;padding:10px 26px;margin-top:20px;" ${setupData.nombre&&setupData.nombre.trim()?'':'disabled'}>SIGUIENTE</button>
      `;
    } else if(setupStep===4){
      const escudo=setupData.escudo||{icon:ESCUDO_ICONOS[0], color:ESCUDO_COLORES[0]};
      setupData.escudo=escudo;
      inner=`
        <div class="lm-setup-title">CREA TU ESCUDO</div>
        <p class="lm-setup-desc">Un escudo sencillo por ahora (icono + color) — el editor completo por capas/imagen llegará más adelante.</p>
        <div class="lm-crest-preview">${crestHTML(escudo, 64)}</div>
        <div class="lm-setup-desc" style="margin-bottom:6px">Icono</div>
        <div class="lm-icon-grid">
          ${ESCUDO_ICONOS.map(ic=>`<div class="lm-icon-option ${escudo.icon===ic?'selected':''}" data-icon="${ic}"><i class="ph ph-bold ${ic}"></i></div>`).join('')}
        </div>
        <div class="lm-setup-desc" style="margin:14px 0 6px">Color</div>
        <div class="lm-color-grid">
          ${ESCUDO_COLORES.map(c=>`<div class="lm-color-option ${escudo.color===c?'selected':''}" data-color="${c}" style="background:${c}"></div>`).join('')}
        </div>
        <button id="lmSetupConfirm" class="mode-card-btn mode-card-btn-gold" style="width:auto;padding:10px 26px;margin-top:22px;">EMPEZAR TEMPORADA</button>
      `;
    }

    root.innerHTML = `
      <div class="lm-wrap">
        <div class="lm-setup-card">
          <div class="lm-setup-header">LIGA MANAGER — NUEVA PARTIDA (paso ${setupStep} de 4)</div>
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
      if(next) next.addEventListener('click', ()=>{ if(!setupData.moneda) return; if(typeof window.playSound==='function') window.playSound('select'); setupStep=3; renderSetup(); });
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
      root.querySelectorAll('[data-icon]').forEach(el=>{
        el.addEventListener('click', ()=>{
          setupData.escudo.icon=el.getAttribute('data-icon');
          if(typeof window.playSound==='function') window.playSound('select');
          renderSetup();
        });
      });
      root.querySelectorAll('[data-color]').forEach(el=>{
        el.addEventListener('click', ()=>{
          setupData.escudo.color=el.getAttribute('data-color');
          if(typeof window.playSound==='function') window.playSound('select');
          renderSetup();
        });
      });
      const confirmBtn=document.getElementById('lmSetupConfirm');
      if(confirmBtn) confirmBtn.addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
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
          <button id="lmAbandonarBtn" class="mode-card-btn mode-card-btn-disabled" style="width:auto;padding:10px 16px;">ABANDONAR LIGA</button>
          <button id="ligaManagerBackBtn" class="mode-card-btn mode-card-btn-disabled" style="width:auto;padding:10px 16px;">VOLVER AL MENÚ</button>
        </div>

        <div class="lm-maingrid">
          <div class="lm-pitch-col">
            <div id="lmPitchBox">${PITCH_SVG}</div>
            <p class="lm-pitch-caption">La alineación llegará cuando se implemente la plantilla</p>
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
      jugarJornada();
      render();
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
    const medicoBtn=document.getElementById('lmMedicoBtn');
    if(medicoBtn) medicoBtn.addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      abrirDilemaMedico();
    });
  }

  /* ---------- 13. Dilema del médico: selector de dados → tirada 3D → resultado ---------- */
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
          <div class="lm-dilemma-title">TIRANDO ${numDados} DADO${numDados>1?'S':''}...</div>
          <div id="lmDice3DBox" class="lm-dice3d-box"></div>
        </div>`;
      const box=document.getElementById('lmDice3DBox');
      if(typeof window.G2G_rollDice3D === 'function'){
        window.G2G_rollDice3D(box, numDados, function(tiradas){
          renderResultado(numDados, tiradas);
        });
      } else {
        // Fallback si el módulo 3D no cargó por lo que sea
        const tiradas=[]; for(let i=0;i<numDados;i++) tiradas.push(1+Math.floor(Math.random()*6));
        setTimeout(()=>renderResultado(numDados, tiradas), 800);
      }
    }

    function renderResultado(numDados, tiradas){
      const r=resolverDilemaMedico(numDados, tiradas);
      overlay.innerHTML=`
        <div class="lm-dilemma-card">
          <div class="lm-dilemma-title">RESULTADO</div>
          <div class="lm-dice-result-row">${tiradas.map(v=>`<span class="lm-dice-pill">${v}</span>`).join('')}</div>
          <div style="font-family:'Bebas Neue';font-size:16px;margin-top:10px">
            Suma <strong>${r.suma}</strong> (necesitabas ${r.dificultad}+) —
            <span style="color:${r.exito?'#5dcaa5':'#e24b4a'}">${r.exito?'✔ ÉXITO, recuperación acelerada':'✘ FALLO, sigue el tiempo previsto'}</span>
          </div>
          <button id="lmContinuarBtn" class="mode-card-btn mode-card-btn-gold" style="width:auto;padding:10px 26px;margin-top:16px">CONTINUAR</button>
        </div>`;
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
