/* ============================================================
   GOAL2GOAT — LIGA MANAGER (v0.1, primera versión jugable)
   ------------------------------------------------------------
   ALCANCE DE ESTA PRIMERA VERSIÓN (acordado con Jesús):
   - Liga de 20 equipos, calendario ida/vuelta real (38 jornadas).
   - Clasificación completa (puntos, PJ, PG, PE, PP, GF, GC, DG).
   - Un partido por jornada contra el rival que toque, simulado con
     el mismo motor genérico de Copa Leyendas (tacticalModifier +
     poissonSample), sin plantilla de jugadores todavía.
   - Cuerpo técnico: SOLO el Médico está activo. Cuando un jugador
     (de una mini-plantilla de ejemplo) se lesiona, aparece una
     notificación; al abrirla, un dilema simple con tirada de dado
     (sin físicas 3D todavía — eso sigue pendiente de integrar).

   DELIBERADAMENTE FUERA DE ALCANCE en esta v0.1 (para no fingir
   funcionalidad a medias): moneda, escudo/nombre personalizado,
   presupuesto/salarios, mercado de fichajes (sobres), resto del
   cuerpo técnico (Director Deportivo/General/Preparador Físico),
   afinidad, potencial de entrenamiento, misiones de acumulación.

   Persistencia: localStorage únicamente en esta v0.1 (prototipo).
   El guardado por hitos en Firestore ya definido en el diseño se
   conectará cuando el resto de sistemas (fichajes, staff completo)
   estén implementados — conectarlo solo para esto sería prematuro.
   ============================================================ */
(function(){

  const SAVE_KEY = 'g2g_liga_manager_v01';

  /* ---------- 1. Equipos (nombres ficticios — ver aviso legal ya
     anotado en el diseño sobre nombres reales de Primera) ---------- */
  const LM_TEAMS = [
    {id:'lm_0',  name:'Tu Club CF',        attack:52, defense:50, pace:54, passing:50, technique:50}, // recién ascendido, plantilla modesta
    {id:'lm_1',  name:'Real Atlántico',    attack:78, defense:75, pace:72, passing:80, technique:79},
    {id:'lm_2',  name:'Deportivo Manchego',attack:64, defense:62, pace:60, passing:63, technique:61},
    {id:'lm_3',  name:'Unión Levante',     attack:70, defense:68, pace:66, passing:69, technique:67},
    {id:'lm_4',  name:'CD Sierra Nevada',  attack:58, defense:60, pace:57, passing:56, technique:55},
    {id:'lm_5',  name:'Atlético Ribera',   attack:66, defense:64, pace:70, passing:62, technique:63},
    {id:'lm_6',  name:'Real Cantábrico',   attack:74, defense:76, pace:68, passing:72, technique:71},
    {id:'lm_7',  name:'CD Meseta',         attack:55, defense:57, pace:54, passing:53, technique:52},
    {id:'lm_8',  name:'Unión Bética',      attack:69, defense:65, pace:67, passing:70, technique:68},
    {id:'lm_9',  name:'Real Litoral',      attack:61, defense:63, pace:59, passing:60, technique:58},
    {id:'lm_10', name:'Deportivo Segoviano',attack:57, defense:55, pace:56, passing:54, technique:53},
    {id:'lm_11', name:'CF Vallenorte',     attack:65, defense:66, pace:63, passing:64, technique:62},
    {id:'lm_12', name:'Atlético Duero',    attack:60, defense:59, pace:61, passing:58, technique:57},
    {id:'lm_13', name:'Real Costa Azul',   attack:80, defense:77, pace:75, passing:81, technique:82},
    {id:'lm_14', name:'CD Extremeño',      attack:56, defense:58, pace:55, passing:55, technique:54},
    {id:'lm_15', name:'Unión Ebro',        attack:63, defense:61, pace:62, passing:63, technique:60},
    {id:'lm_16', name:'Real Pirineo',      attack:68, defense:70, pace:64, passing:66, technique:65},
    {id:'lm_17', name:'Deportivo Tajo',    attack:59, defense:60, pace:58, passing:57, technique:56},
    {id:'lm_18', name:'CF Guadiana',       attack:62, defense:64, pace:60, passing:61, technique:59},
    {id:'lm_19', name:'Atlético Sur',      attack:67, defense:63, pace:69, passing:65, technique:64}
  ];

  /* ---------- 2. Mini-plantilla de ejemplo (para el Médico) ----------
     Solo para poder probar el sistema de lesiones/dilemas ya — cuando
     se implemente la plantilla real esto se sustituye sin tocar la
     lógica del Médico, que solo necesita "jugadores con estado". */
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

  /* ---------- 5. Estado persistente (localStorage, prototipo v0.1) ---------- */
  let state=null;

  function nuevoEstado(){
    return {
      jornadaActual:1,
      calendario:generarCalendario(LM_TEAMS),
      resultados:{}, // "jornada-home-away" -> {golesA,golesB}
      plantilla:generarMiniPlantilla(),
      medicoNotificacion:null // {jugadorId, dificultad} si hay algo pendiente
    };
  }

  function cargarEstado(){
    try{
      const raw=localStorage.getItem(SAVE_KEY);
      if(raw) return JSON.parse(raw);
    }catch(e){}
    return nuevoEstado();
  }
  function guardarEstado(){
    try{ localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }catch(e){}
  }

  /* ---------- 6. Clasificación calculada a partir de resultados ---------- */
  function calcularClasificacion(){
    const tabla={};
    LM_TEAMS.forEach(t=>{ tabla[t.id]={id:t.id,name:t.name,pj:0,pg:0,pe:0,pp:0,gf:0,gc:0,pts:0}; });
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

    // Posibilidad de lesión en el partido del jugador (~12% por jornada)
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
    // Recuperación natural de lesiones existentes
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

  /* ---------- 9. Render ---------- */
  function render(){
    const root=document.getElementById('ligaManagerScreen');
    if(!root) return;
    const clasif=calcularClasificacion();
    const j=state.jornadaActual-1;
    const proximaJornada= j<38 ? state.calendario[j] : null;
    const miPartido= proximaJornada ? proximaJornada.find(p=>p.home.id==='lm_0'||p.away.id==='lm_0') : null;
    const notif=state.medicoNotificacion;

    root.innerHTML = `
      <div class="lm-wrap">
        <div class="lm-header">
          <div>
            <div class="lm-title">TU CLUB CF</div>
            <div class="lm-sub">${state.jornadaActual<=38 ? 'Jornada '+state.jornadaActual+' de 38' : 'Temporada finalizada'}</div>
          </div>
          ${miPartido ? `<div class="lm-nextmatch">Próximo: ${miPartido.home.name} vs ${miPartido.away.name}</div>` : ''}
          <button id="lmJugarBtn" class="mode-card-btn mode-card-btn-gold" ${state.jornadaActual>38?'disabled':''} style="width:auto;padding:10px 22px;">
            ${state.jornadaActual>38?'TEMPORADA COMPLETA':'JUGAR JORNADA'}
          </button>
          <button id="ligaManagerBackBtn" class="mode-card-btn mode-card-btn-disabled" style="width:auto;padding:10px 18px;">VOLVER AL MENÚ</button>
        </div>

        <div class="lm-staffrow">
          <div class="lm-staff-slot ${notif?'has-notif':''}" id="lmMedicoBtn">
            ${notif?'<span class="lm-staff-badge">1</span>':''}
            <div class="lm-staff-photo"><i class="ph ph-bold ph-first-aid-kit"></i></div>
            <div class="lm-staff-name">Médico</div>
          </div>
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

  /* ---------- 10. Inicialización ---------- */
  function init(){
    state=cargarEstado();
    render();
  }

  window.G2G_LigaManager={ init };

})();
