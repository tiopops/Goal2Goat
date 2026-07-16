/* ============================================================
   GOAL2GOAT — LIGA MANAGER (v0.2)
   ------------------------------------------------------------
   AÑADIDO EN ESTA VERSIÓN respecto a v0.1:
   - Flujo de entrada real: elegir liga (solo España activa) →
     elegir moneda → nombre de tu equipo → empieza la temporada.
     Los otros 19 equipos son los reales de La Liga 2026-27; el
     tuyo lo nombras tú (sustituye al placeholder "Málaga CF").
   - Botón ABANDONAR LIGA: termina la run actual y vuelve a lanzar
     el flujo de entrada desde cero (mismo patrón que descenso).
   - Cuerpo técnico ahora en modo "sticky" (fijo) en la parte de
     abajo de la pantalla en escritorio, para que no se pierda al
     hacer scroll por la clasificación.

   SIGUE FUERA DE ALCANCE (deliberado, para no fingir a medias):
   editor de escudo real (de momento solo nombre + icono genérico),
   presupuesto/salarios/sobres de fichajes, resto del cuerpo técnico
   (Director Deportivo/General/Preparador Físico), afinidad,
   potencial de entrenamiento, misiones de acumulación, físicas 3D
   del dado. Persistencia sigue en localStorage (prototipo) — el
   guardado por hitos en Firestore se conecta cuando el resto de
   sistemas estén implementados.
   ============================================================ */
(function(){

  const SAVE_KEY = 'g2g_liga_manager_v02';

  /* ---------- 1. Equipos rivales — La Liga 2026-27 real, 19 clubes
     confirmados (el 20º slot, lm_0, es tu equipo, con el nombre que
     elijas en el flujo de entrada). Aviso ya anotado en el diseño:
     esto es solo para uso interno/beta con acceso restringido, no
     para publicación — usar nombres/escudos reales de clubes activos
     con fines comerciales es un tema aparte a revisar si esto llega
     a publicarse. ---------- */
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
    {id:'es', nombre:'España — La Liga', flag:'🇪🇸', activa:true},
    {id:'en', nombre:'Inglaterra — Premier League', flag:'🏴', activa:false},
    {id:'it', nombre:'Italia — Serie A', flag:'🇮🇹', activa:false},
    {id:'de', nombre:'Alemania — Bundesliga', flag:'🇩🇪', activa:false},
    {id:'fr', nombre:'Francia — Ligue 1', flag:'🇫🇷', activa:false}
  ];

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
  let setupData={liga:'es', moneda:null, nombre:''};

  function nuevoEstadoSinEmpezar(){
    return { setupComplete:false };
  }

  function empezarTemporada(nombreEquipo, moneda, liga){
    const miEquipo={id:'lm_0', name:nombreEquipo, attack:52, defense:54, pace:56, passing:50, technique:50};
    const teams=[miEquipo, ...LM_RIVALS];
    state={
      setupComplete:true,
      liga, moneda, nombreEquipo,
      jornadaActual:1,
      calendario:generarCalendario(teams),
      resultados:{},
      plantilla:generarMiniPlantilla(),
      medicoNotificacion:null
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
  function guardarEstado(){
    try{ localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }catch(e){}
  }
  function borrarEstado(){
    try{ localStorage.removeItem(SAVE_KEY); }catch(e){}
  }

  /* ---------- 6. Clasificación calculada a partir de resultados ---------- */
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

  /* ---------- 7. Jugar la jornada actual ---------- */
  function jugarJornada(){
    if(state.jornadaActual>38) return;
    const j=state.jornadaActual-1;
    const jornada=state.calendario[j];
    jornada.forEach(partido=>{
      const key=j+'-'+partido.home.id+'-'+partido.away.id;
      if(state.resultados[key]) return;
      state.resultados[key]=simularPartido(partido.home, partido.away);
    });

    if(!state.medicoNotificacion && Math.random()<0.12){
      const sanos=state.plantilla.filter(p=>!p.injured);
      if(sanos.length){
        const jugador=sanos[Math.floor(Math.random()*sanos.length)];
        const severidades=[
          {label:'leve', weeks:1, dificultad:4},
          {label:'moderada', weeks:2, dificultad:5},
          {label:'grave', weeks:4, dificultad:6}
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

  /* ---------- 8. Dilema del médico: tirada simple (sin físicas aún) ---------- */
  function resolverDilemaMedico(){
    if(!state.medicoNotificacion) return null;
    const tirada=1+Math.floor(Math.random()*6);
    const exito=tirada>=state.medicoNotificacion.dificultad;
    if(exito){
      const jugador=state.plantilla.find(p=>p.id===state.medicoNotificacion.jugadorId);
      if(jugador){ jugador.injuryWeeks=Math.max(0, jugador.injuryWeeks-1); if(jugador.injuryWeeks<=0){ jugador.injured=false; jugador.injurySeverity=null; } }
    }
    const resultado={tirada, dificultad:state.medicoNotificacion.dificultad, exito};
    state.medicoNotificacion=null;
    guardarEstado();
    return resultado;
  }

  /* ---------- 9. Abandonar la liga ---------- */
  function abandonarLiga(){
    const ok=confirm('¿Seguro que quieres abandonar la liga? Se perderá todo el progreso de esta temporada y empezarás una partida nueva.');
    if(!ok) return;
    borrarEstado();
    state=nuevoEstadoSinEmpezar();
    setupStep=1;
    setupData={liga:'es', moneda:null, nombre:''};
    render();
  }

  /* ---------- 10. Render: flujo de entrada (liga → moneda → nombre) ---------- */
  function renderSetup(){
    const root=document.getElementById('ligaManagerScreen');
    let inner='';

    if(setupStep===1){
      inner=`
        <div class="lm-setup-title">ELIGE TU LIGA</div>
        <div class="lm-setup-list">
          ${LIGAS_DISPONIBLES.map(l=>`
            <div class="lm-setup-option ${l.activa?'active selected':'disabled'}" data-liga="${l.id}">
              <span style="font-size:20px;margin-right:10px">${l.flag}</span>${l.nombre}
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
        <p class="lm-setup-desc">Este será tu club, recién ascendido a Primera. El resto de la liga son los 19 equipos reales de La Liga. (El editor de escudo por capas/imagen llegará más adelante — de momento un icono genérico.)</p>
        <input id="lmSetupNombre" type="text" maxlength="24" placeholder="Ej: CF Ejemplo" class="lm-setup-input" value="${setupData.nombre||''}">
        <button id="lmSetupConfirm" class="mode-card-btn mode-card-btn-gold" style="width:auto;padding:10px 26px;margin-top:20px;" ${setupData.nombre&&setupData.nombre.trim()?'':'disabled'}>EMPEZAR TEMPORADA</button>
      `;
    }

    root.innerHTML = `
      <div class="lm-wrap">
        <div class="lm-setup-card">
          <div class="lm-setup-header">LIGA MANAGER — NUEVA PARTIDA (paso ${setupStep} de 3)</div>
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
      const confirmBtn=document.getElementById('lmSetupConfirm');
      if(input) input.addEventListener('input', ()=>{
        setupData.nombre=input.value;
        if(confirmBtn) confirmBtn.disabled = !input.value.trim();
      });
      if(confirmBtn) confirmBtn.addEventListener('click', ()=>{
        if(!setupData.nombre || !setupData.nombre.trim()) return;
        if(typeof window.playSound==='function') window.playSound('select');
        empezarTemporada(setupData.nombre.trim(), setupData.moneda, setupData.liga);
        render();
      });
    }
  }

  /* ---------- 11. Render: hub principal (una vez empezada la temporada) ---------- */
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
    const notif=state.medicoNotificacion;
    const monedaInfo=MONEDAS[state.moneda]||MONEDAS.EUR;

    root.innerHTML = `
      <div class="lm-wrap">
        <div class="lm-header">
          <div>
            <div class="lm-title">${state.nombreEquipo.toUpperCase()}</div>
            <div class="lm-sub">${state.jornadaActual<=38 ? 'Jornada '+state.jornadaActual+' de 38' : 'Temporada finalizada'} · Moneda: ${monedaInfo.symbol}</div>
          </div>
          ${miPartido ? `<div class="lm-nextmatch">Próximo: ${miPartido.home.name} vs ${miPartido.away.name}</div>` : ''}
          <button id="lmJugarBtn" class="mode-card-btn mode-card-btn-gold" ${state.jornadaActual>38?'disabled':''} style="width:auto;padding:10px 22px;">
            ${state.jornadaActual>38?'TEMPORADA COMPLETA':'JUGAR JORNADA'}
          </button>
          <button id="lmAbandonarBtn" class="mode-card-btn mode-card-btn-disabled" style="width:auto;padding:10px 16px;">ABANDONAR LIGA</button>
          <button id="ligaManagerBackBtn" class="mode-card-btn mode-card-btn-disabled" style="width:auto;padding:10px 16px;">VOLVER AL MENÚ</button>
        </div>

        <div class="lm-table-wrap">
          <table class="lm-table">
            <thead><tr><th>#</th><th>Equipo</th><th>PJ</th><th>PG</th><th>PE</th><th>PP</th><th>GF</th><th>GC</th><th>DG</th><th>Pts</th></tr></thead>
            <tbody>
              ${clasif.map((t,i)=>`<tr class="${t.id==='lm_0'?'lm-myteam':''}">
                <td>${i+1}</td><td>${t.name}</td><td>${t.pj}</td><td>${t.pg}</td><td>${t.pe}</td><td>${t.pp}</td>
                <td>${t.gf}</td><td>${t.gc}</td><td>${t.gf-t.gc}</td><td><strong>${t.pts}</strong></td>
              </tr>`).join('')}
            </tbody>
          </table>
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

  function abrirDilemaMedico(){
    if(!state.medicoNotificacion){
      if(typeof window.showToast==='function') window.showToast('Sin novedades del médico', 'toast-neutral');
      return;
    }
    const jugador=state.plantilla.find(p=>p.id===state.medicoNotificacion.jugadorId);
    const dificultad=state.medicoNotificacion.dificultad;
    const overlay=document.createElement('div');
    overlay.id='lmMedicoOverlay';
    overlay.innerHTML=`
      <div class="lm-dilemma-card">
        <i class="ph ph-bold ph-first-aid-kit" style="font-size:26px;color:#c9a227"></i>
        <div class="lm-dilemma-title">EL MÉDICO TE CONSULTA</div>
        <div class="lm-dilemma-text">${jugador?jugador.name:'Un jugador'} tiene una lesión ${state.medicoNotificacion.severidad}. Necesitas sacar ${dificultad}+ para acelerar su recuperación.</div>
        <button id="lmTirarBtn" class="mode-card-btn mode-card-btn-gold" style="width:auto;padding:10px 24px;">TIRAR DADO (1d6)</button>
        <div id="lmTiradaResultado" style="margin-top:10px;font-family:'Bebas Neue';font-size:16px;"></div>
      </div>`;
    document.getElementById('ligaManagerScreen').appendChild(overlay);
    document.getElementById('lmTirarBtn').addEventListener('click', function(){
      const r=resolverDilemaMedico();
      const resEl=document.getElementById('lmTiradaResultado');
      resEl.innerHTML = `Sacaste <strong>${r.tirada}</strong> (necesitabas ${r.dificultad}+) — <span style="color:${r.exito?'#5dcaa5':'#e24b4a'}">${r.exito?'✔ ÉXITO, recuperación acelerada':'✘ FALLO, sigue el tiempo previsto'}</span>`;
      this.disabled=true;
      setTimeout(()=>{ overlay.remove(); render(); }, 1800);
    });
  }

  /* ---------- 12. Inicialización ---------- */
  function init(){
    state=cargarEstado();
    setupStep=1;
    render();
  }

  window.G2G_LigaManager={ init };

})();
