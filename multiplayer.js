/* ═══════════════════════════════════════════════════════════════
   SISTEMA DE AMIGOS / MULTIJUGADOR — archivo separado de game.js
   (extraído tal cual, sin cambios de comportamiento) como parte del
   plan de dividir el proyecto en archivos más pequeños y manejables.
   Se carga como un <script> normal justo después de game.js,
   compartiendo el mismo ámbito global — el resto del juego lo sigue
   viendo exactamente igual que antes de moverlo aquí.
   ═══════════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════════════════════════
   SISTEMA DE AMIGOS / MULTIJUGADOR
   Solo accesible con sesión iniciada y debug mode (CHEATS_ACTIVE) activo.
   Colección Firestore: 'friends' — documento por relación:
   { userId, friendId, friendUsername, status: 'pending'|'accepted', createdAt, requestedBy }
   ════════════════════════════════════════════════════════════ */

/* Listeners en vivo del modal de amigos — se activan al abrir, se desconectan al cerrar */
let mpUnsubFriends1=null, mpUnsubFriends2=null, mpUnsubRequests=null, mpUnsubDuels=null;

window.openMpOverlay = function(){
  const ov=$id('mpOverlay');
  if(!ov) return;
  playSound('select');
  ov.style.display='flex';
  if(window.applyTranslations) window.applyTranslations();
  startMpLiveListeners();
};

window.closeMpOverlay = function(){
  const ov=$id('mpOverlay');
  if(ov) ov.style.display='none';
  stopMpLiveListeners();
};

function startMpLiveListeners(){
  stopMpLiveListeners(); // por seguridad, evita duplicados si se reabre rápido
  const auth=window._fbAuth, db=window._fbDb;
  const user=auth&&auth.currentUser;
  if(!user||!db) return;
  // Solicitudes pendientes recibidas — tiempo real (un solo where, filtro en JS)
  mpUnsubRequests=db.collection('friends')
    .where('friendId','==',user.uid)
    .onSnapshot(()=>renderPendingRequests(), e=>console.error('mpUnsubRequests error:',e));
  // Amistades aceptadas (en ambas direcciones) — tiempo real (un solo where, filtro en JS)
  mpUnsubFriends1=db.collection('friends')
    .where('userId','==',user.uid)
    .onSnapshot(()=>renderFriendsList(), e=>console.error('mpUnsubFriends1 error:',e));
  mpUnsubFriends2=db.collection('friends')
    .where('friendId','==',user.uid)
    .onSnapshot(()=>renderFriendsList(), e=>console.error('mpUnsubFriends2 error:',e));
  // Desafíos de duelo recibidos — tiempo real (un solo where, filtro en JS)
  mpUnsubDuels=db.collection('duels')
    .where('opponentId','==',user.uid)
    .onSnapshot(()=>renderPendingDuels(), e=>console.error('mpUnsubDuels error:',e));
}

function stopMpLiveListeners(){
  if(mpUnsubFriends1){ mpUnsubFriends1(); mpUnsubFriends1=null; }
  if(mpUnsubFriends2){ mpUnsubFriends2(); mpUnsubFriends2=null; }
  if(mpUnsubRequests){ mpUnsubRequests(); mpUnsubRequests=null; }
  if(mpUnsubDuels){ mpUnsubDuels(); mpUnsubDuels=null; }
}

/* Añadir amigo por nombre de usuario o email — solo usuarios YA registrados en Firestore */
async function mpAddFriend(){
  playSound('select');
  const input=$id('mpFriendInput');
  const errEl=$id('mpAddFriendErr');
  const okEl=$id('mpAddFriendOk');
  if(errEl){errEl.style.display='none';errEl.textContent='';}
  if(okEl){okEl.style.display='none';okEl.textContent='';}
  const query=(input?input.value:'').trim();
  if(!query){
    if(errEl){errEl.textContent=tk('mp.err_empty');errEl.style.display='block';}
    return;
  }
  const auth=window._fbAuth, db=window._fbDb;
  const user=auth&&auth.currentUser;
  if(!user){
    if(errEl){errEl.textContent=tk('mp.err_login');errEl.style.display='block';}
    return;
  }
  const btn=$id('mpAddFriendBtn');
  if(btn){btn.disabled=true;btn.textContent=tk('mp.searching');}
  try{
    // Buscar por username_lower o por email exacto — solo usuarios registrados
    let targetDoc=null;
    const isEmail=query.includes('@');
    if(isEmail){
      const snap=await db.collection('users').where('email','==',query.toLowerCase()).get();
      if(!snap.empty) targetDoc=snap.docs[0];
    }else{
      const snap=await db.collection('users').where('username_lower','==',query.toLowerCase()).get();
      if(!snap.empty) targetDoc=snap.docs[0];
    }
    if(!targetDoc){
      if(errEl){errEl.textContent=tk('mp.err_not_found');errEl.style.display='block';}
      return;
    }
    const targetUid=targetDoc.id;
    const targetData=targetDoc.data();
    if(targetUid===user.uid){
      if(errEl){errEl.textContent=tk('mp.err_self');errEl.style.display='block';}
      return;
    }
    // Comprobar si ya existe relación (en cualquier dirección) — un solo where, filtro en JS
    // IMPORTANTE: ambas queries deben filtrar por un campo == auth.uid (requisito de las
    // reglas de seguridad de Firestore, que exigen poder demostrar el acceso sin ejecutar
    // la query primero). Por eso existing2 usa friendId==user.uid, no userId==targetUid.
    const existing1=await db.collection('friends')
      .where('userId','==',user.uid).get();
    const existing2=await db.collection('friends')
      .where('friendId','==',user.uid).get();
    const already1=existing1.docs.some(d=>d.data().friendId===targetUid);
    const already2=existing2.docs.some(d=>d.data().userId===targetUid);
    if(already1 || already2){
      if(errEl){errEl.textContent=tk('mp.err_already');errEl.style.display='block';}
      return;
    }
    // Obtener username propio
    const mySnap=await db.collection('users').doc(user.uid).get();
    const myUsername=mySnap.exists?mySnap.data().username:user.email;
    // Crear solicitud pendiente (bidireccional con un solo doc + status)
    await db.collection('friends').add({
      userId:user.uid, userUsername:myUsername,
      friendId:targetUid, friendUsername:targetData.username||targetData.email,
      status:'pending', requestedBy:user.uid,
      createdAt:Date.now()
    });
    if(okEl){okEl.textContent=tk('mp.request_sent').replace('{0}',targetData.username||targetData.email);okEl.style.display='block';}
    if(input) input.value='';
  }catch(e){
    console.error('mpAddFriend error:',e);
    if(errEl){errEl.textContent=tk('mp.err_generic');errEl.style.display='block';}
  }finally{
    if(btn){btn.disabled=false;btn.textContent=tk('mp.add_btn');}
  }
}

/* Cargar solicitudes pendientes recibidas */
async function renderPendingRequests(){
  const auth=window._fbAuth, db=window._fbDb;
  const user=auth&&auth.currentUser;
  const section=$id('mpRequestsSection');
  const list=$id('mpRequestsList');
  if(!user||!db||!section||!list) return;
  try{
    const snap=await db.collection('friends')
      .where('friendId','==',user.uid).get();
    const pendingDocs=snap.docs.filter(d=>d.data().status==='pending');
    if(!pendingDocs.length){ section.style.display='none'; return; }
    section.style.display='block';
    list.innerHTML='';
    pendingDocs.forEach(doc=>{
      const d=doc.data();
      const row=document.createElement('div');
      row.className='mp-row';
      row.innerHTML=`
        <span class="mp-row-name">${mpEsc(d.userUsername||'???')}</span>
        <div style="display:flex;gap:6px">
          <button class="mp-accept-btn mp-btn-accept" data-id="${doc.id}">${tk('mp.accept')}</button>
          <button class="mp-reject-btn mp-btn-reject" data-id="${doc.id}">${tk('mp.reject')}</button>
        </div>`;
      list.appendChild(row);
    });
    list.querySelectorAll('.mp-accept-btn').forEach(b=>b.addEventListener('click',()=>mpRespondRequest(b.dataset.id,true)));
    list.querySelectorAll('.mp-reject-btn').forEach(b=>b.addEventListener('click',()=>mpRespondRequest(b.dataset.id,false)));
  }catch(e){console.error('renderPendingRequests error:',e);}
}

async function mpRespondRequest(docId,accept){
  playSound('select');
  const db=window._fbDb;
  if(!db) return;
  try{
    if(accept){
      await db.collection('friends').doc(docId).update({status:'accepted', acceptedAt:Date.now()});
    }else{
      await db.collection('friends').doc(docId).delete();
    }
    // El refresco es automático vía onSnapshot — no se requiere llamada manual
  }catch(e){console.error('mpRespondRequest error:',e);}
}

/* Cargar lista de amigos aceptados */
/* Eliminar amigo de la lista (con confirmación) */
async function mpRemoveFriend(docId, username){
  const ok=await mpShowConfirmRemove(username);
  if(!ok) return;
  const db=window._fbDb;
  if(!db) return;
  try{
    await db.collection('friends').doc(docId).delete();
    // El refresco es automático vía onSnapshot — no se requiere llamada manual
  }catch(e){
    console.error('mpRemoveFriend error:',e);
    alert(tk('mp.err_generic'));
  }
}

/* Modal de confirmación in-app para eliminar amigo (sustituye al confirm() nativo) */
function mpShowConfirmRemove(username){
  return new Promise(resolve=>{
    const ov=$id('mpConfirmRemoveOverlay');
    const txt=$id('mpConfirmRemoveText');
    const okBtn=$id('mpConfirmRemoveOk');
    const cancelBtn=$id('mpConfirmRemoveCancel');
    if(!ov||!txt||!okBtn||!cancelBtn){ resolve(false); return; }
    txt.textContent=(tk('mp.confirm_remove')||'¿Eliminar a {0} de tus amigos?').replace('{0}', username||'');
    ov.style.display='flex';
    const cleanup=(result)=>{
      ov.style.display='none';
      okBtn.removeEventListener('click', onOk);
      cancelBtn.removeEventListener('click', onCancel);
      ov.removeEventListener('click', onOverlayClick);
      resolve(result);
    };
    const onOk=()=>cleanup(true);
    const onCancel=()=>cleanup(false);
    const onOverlayClick=(e)=>{ if(e.target===ov) cleanup(false); };
    okBtn.addEventListener('click', onOk);
    cancelBtn.addEventListener('click', onCancel);
    ov.addEventListener('click', onOverlayClick);
  });
}

async function renderFriendsList(){
  const auth=window._fbAuth, db=window._fbDb;
  const user=auth&&auth.currentUser;
  const list=$id('mpFriendsList');
  if(!user||!db||!list) return;
  list.innerHTML=`<div class="mp-empty-state">${tk('mp.loading')}</div>`;
  try{
    // Mis propias estadísticas de duelo, para la tarjeta de arriba
    const meSnap=await db.collection('users').doc(user.uid).get();
    const meData=meSnap.exists?meSnap.data():{};
    const myStatsCard=document.getElementById('mpMyStatsCard');
    if(myStatsCard){
      const played=meData.duelsPlayed||0, won=meData.duelsWon||0, lost=meData.duelsLost||0;
      const winRate=played?Math.round((won/played)*100):0;
      const vals=myStatsCard.querySelectorAll('.pstat-val');
      if(vals[0]) vals[0].textContent=played;
      if(vals[1]) vals[1].textContent=won;
      if(vals[2]) vals[2].textContent=lost;
      if(vals[3]) vals[3].textContent=winRate+'%';
    }

    const snap1=await db.collection('friends')
      .where('userId','==',user.uid).get();
    const snap2=await db.collection('friends')
      .where('friendId','==',user.uid).get();
    const friends=[];
    snap1.forEach(doc=>{const d=doc.data();if(d.status==='accepted')friends.push({id:doc.id,uid:d.friendId,username:d.friendUsername});});
    snap2.forEach(doc=>{const d=doc.data();if(d.status==='accepted')friends.push({id:doc.id,uid:d.userId,username:d.userUsername});});
    if(!friends.length){
      list.innerHTML=`<div class="mp-empty-state">${tk('mp.no_friends')}</div>`;
      return;
    }
    // Estadísticas de cada amigo, en paralelo (una lectura por amigo —
    // el perfil de usuario ya es de lectura pública para cualquiera).
    const friendDocs=await Promise.all(friends.map(f=>
      db.collection('users').doc(f.uid).get().catch(()=>null)
    ));
    friends.forEach((f,i)=>{
      const fd=friendDocs[i]&&friendDocs[i].exists?friendDocs[i].data():{};
      f.played=fd.duelsPlayed||0; f.won=fd.duelsWon||0; f.lost=fd.duelsLost||0;
    });

    list.innerHTML='';
    const table=document.createElement('table');
    table.className='mp-friends-table';
    table.innerHTML=`<thead><tr>
        <th data-i18n="mp.col_friend">${tk('mp.col_friend')}</th>
        <th class="mp-col-stat" title="${tk('mp.stats_played')||'Jugados'}">${tk('mp.col_played')||'J'}</th>
        <th class="mp-col-stat" title="${tk('mp.stats_won')||'Ganados'}">${tk('mp.col_won')||'G'}</th>
        <th class="mp-col-stat" title="${tk('mp.stats_lost')||'Perdidos'}">${tk('mp.col_lost')||'P'}</th>
        <th class="mp-col-action"></th>
        <th class="mp-col-action"></th>
      </tr></thead><tbody></tbody>`;
    const tbody=table.querySelector('tbody');
    friends.forEach(f=>{
      const row=document.createElement('tr');
      row.className='mp-friend-row';
      row.innerHTML=`
        <td class="mp-row-name">${mpEsc(f.username||'???')}</td>
        <td class="mp-col-stat">${f.played}</td>
        <td class="mp-col-stat" style="color:#4ade80">${f.won}</td>
        <td class="mp-col-stat" style="color:#ff7e7e">${f.lost}</td>
        <td class="mp-col-action"><button class="mp-challenge-btn mp-btn-challenge" data-uid="${f.uid}" data-username="${mpEsc(f.username||'')}" title="${tk('mp.challenge')}"><i class="ph ph-bold ph-play"></i></button></td>
        <td class="mp-col-action"><button class="mp-remove-btn mp-btn-remove" data-id="${f.id}" data-username="${mpEsc(f.username||'')}" title="${tk('mp.remove')}"><i class="ph ph-bold ph-trash"></i></button></td>`;
      tbody.appendChild(row);
    });
    list.appendChild(table);
    list.querySelectorAll('.mp-remove-btn').forEach(b=>b.addEventListener('click',()=>mpRemoveFriend(b.dataset.id, b.dataset.username)));
    list.querySelectorAll('.mp-challenge-btn').forEach(b=>b.addEventListener('click',()=>mpChallengeFriend(b.dataset.uid, b.dataset.username, b)));
  }catch(e){
    console.error('renderFriendsList error:',e);
    list.innerHTML=`<div class="mp-empty-state" style="color:var(--red)">${tk('mp.err_generic')}</div>`;
  }
}

function mpEsc(s){ return String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

/* ════════════════════════════════════════════════════════════
   DUELO — CÁLCULO DE PARTIDO (Fase 3, primera entrega)
   Reutiliza las mismas fórmulas que playMatch() en solitario
   (tacticalModifier, poissonSample, STRATEGIES) pero aplicadas de
   forma simétrica a dos plantillas reales en vez de jugador-vs-IA.
   NOTA: esta primera versión no incluye lesiones/tarjetas en vivo
   durante el partido (ver aviso en el resumen del chat).
   ════════════════════════════════════════════════════════════ */
function duelSquadPower(squad){
  const pl=(squad.pitch||[]).slice(0,11);
  const avg=pl.length?pl.reduce((s,p)=>s+(p.rating||75),0)/pl.length:75;
  const bonusBoost=Object.values(squad.teamStats||{}).reduce((a,b)=>a+(Math.abs(b)||0),0)*0.12;
  const fatigueAvg=pl.length?pl.reduce((s,p)=>s+(p.fatigue===undefined?100:p.fatigue),0)/pl.length:100;
  const fatiguePenalty=(100-fatigueAvg)/100*3.5;
  return avg + bonusBoost - fatiguePenalty;
}
function duelStreakBonus(squad){
  let bonus=0;
  (squad.pitch||[]).forEach(p=>{
    if(p.placedPos && ["DC","EI","ED","MC"].includes(p.placedPos)){
      const streak=(squad.scorerStreaks&&squad.scorerStreaks[p.name])||0;
      bonus+=Math.min(streak,MAX_STREAK_BONUS)*0.015;
    }
  });
  return bonus;
}
function duelCounterModifier(myKey, rivalKey){
  if(!myKey && !rivalKey) return {myScoreMod:0, oppScoreMod:0};
  const rivalStrat=STRATEGIES[rivalKey], myStrat=STRATEGIES[myKey];
  const rivalCountersMe = rivalStrat && rivalStrat.counters===myKey;
  const iCounterRival    = myStrat && myStrat.counters===rivalKey;
  const iPartiallyCounterRival = myStrat && myStrat.partialCounters && myStrat.partialCounters.includes(rivalKey);
  let mod=0;
  if(iCounterRival)               mod=0.16;
  else if(iPartiallyCounterRival) mod=0.08;
  else if(rivalCountersMe)        mod=-0.10;
  else if(myKey && myKey===rivalKey) mod=-0.04;
  return {myScoreMod:mod, oppScoreMod:-mod*0.5};
}
function duelRollCards(pitchArr){
  const carded=[];
  (pitchArr||[]).forEach(p=>{
    const r=Math.random();
    const minute=Math.floor(5+Math.random()*90);
    if(r<RED_RISK_PER_PLAYER){ carded.push({player:{name:p.name}, type:'red', minute}); }
    else if(r<RED_RISK_PER_PLAYER+YELLOW_RISK_PER_PLAYER){ carded.push({player:{name:p.name}, type:'yellow', minute}); }
  });
  return carded;
}
function duelRollInjuries(pitchArr, foulerPool){
  const injured=[];
  (pitchArr||[]).forEach(p=>{
    if(injured.length>=1) return;
    if(Math.random()<0.06){
      const r=Math.random();
      let type, foulCard=null;
      if(r<0.5){ type='leve'; foulCard=Math.random()<0.8?'yellow':null; }
      else if(r<0.85){ type='básica'; foulCard=Math.random()<0.6?'yellow':'red'; }
      else { type='grave'; foulCard='red'; }
      const minute=Math.floor(20+Math.random()*65);
      let foulerName=null;
      if(foulCard && foulerPool && foulerPool.length){
        foulerName=foulerPool[Math.floor(Math.random()*foulerPool.length)].name;
      }
      injured.push({name:p.name, type, _foulCard:foulCard, injury:{foulCard,type}, minute, foulerName});
    }
  });
  return injured;
}
function computeDuelMatchResult(challengerSquad, opponentSquad, challengerStrategy, opponentStrategy){
  const chalPower=duelSquadPower(challengerSquad);
  const oppPower=duelSquadPower(opponentSquad);
  const diff=(chalPower-oppPower)*0.03;
  const tactical=tacticalModifier(challengerSquad.teamStats||{}, opponentSquad.teamStats||{});
  const counter=duelCounterModifier(challengerStrategy, opponentStrategy);
  const chalMorale=((challengerSquad.teamMorale||0)/50)*0.15;
  const oppMorale=((opponentSquad.teamMorale||0)/50)*0.15;
  const chalStreak=duelStreakBonus(challengerSquad);
  const oppStreak=duelStreakBonus(opponentSquad);
  const weatherDelta=weatherLambdaEffect(); // condición compartida del partido, igual para ambos
  const chalCaptain=(challengerSquad.skills&&challengerSquad.skills.capitan&&(challengerSquad.teamMorale||0)<0)?0.10:0;
  const oppCaptain=(opponentSquad.skills&&opponentSquad.skills.capitan&&(opponentSquad.teamMorale||0)<0)?0.10:0;
  const chalLambda=Math.max(0.25, 1.15+diff+tactical.myScoreMod+counter.myScoreMod+chalMorale+chalStreak+weatherDelta+chalCaptain);
  const oppLambda=Math.max(0.25, 1.15-diff+tactical.oppScoreMod+counter.oppScoreMod+oppMorale+oppStreak+weatherDelta+oppCaptain);
  let challengerGoals=poissonSample(chalLambda);
  let opponentGoals=poissonSample(oppLambda);
  if(challengerSquad.skills&&challengerSquad.skills.remontada&&opponentGoals>=challengerGoals+2){
    challengerGoals=poissonSample(chalLambda*1.35);
  }
  if(opponentSquad.skills&&opponentSquad.skills.remontada&&challengerGoals>=opponentGoals+2){
    opponentGoals=poissonSample(oppLambda*1.35);
  }
  // Fatiga real de los titulares tras el partido — misma fórmula que en solitario
  const challengerFatigue={}, opponentFatigue={};
  (challengerSquad.pitch||[]).slice(0,11).forEach(p=>{
    challengerFatigue[p.name]=Math.max(0, Math.round((p.fatigue===undefined?100:p.fatigue)-(2+Math.random()*4)));
  });
  (opponentSquad.pitch||[]).slice(0,11).forEach(p=>{
    opponentFatigue[p.name]=Math.max(0, Math.round((p.fatigue===undefined?100:p.fatigue)-(2+Math.random()*4)));
  });
  const challengerCards=duelRollCards(challengerSquad.pitch);
  const opponentCards=duelRollCards(opponentSquad.pitch);
  const challengerInjuries=duelRollInjuries(challengerSquad.pitch, opponentSquad.pitch);
  const opponentInjuries=duelRollInjuries(opponentSquad.pitch, challengerSquad.pitch);
  const possession=Math.round(45+Math.random()*20);
  // Goleadores, minutos y tiros — calculados aquí (por el retador) y
  // guardados, para que ambos dispositivos vean exactamente los mismos
  // nombres y minutos en vez de sortearlos cada uno por su cuenta.
  const chalAttackers=(challengerSquad.pitch||[]).filter(p=>p.placedPos&&["DC","EI","ED","MC"].includes(p.placedPos));
  const oppAttackers=(opponentSquad.pitch||[]).filter(p=>p.placedPos&&["DC","EI","ED","MC"].includes(p.placedPos));
  const chalPool=chalAttackers.length?chalAttackers:(challengerSquad.pitch||[]);
  const oppPool=oppAttackers.length?oppAttackers:(opponentSquad.pitch||[]);
  const chalMinutes=[]; for(let i=0;i<challengerGoals;i++) chalMinutes.push(Math.floor(5+Math.random()*85));
  const oppMinutes=[]; for(let i=0;i<opponentGoals;i++) oppMinutes.push(Math.floor(5+Math.random()*85));
  chalMinutes.sort((a,b)=>a-b); oppMinutes.sort((a,b)=>a-b);
  const challengerGoalEvents=chalMinutes.map(min=>({name:chalPool.length?chalPool[Math.floor(Math.random()*chalPool.length)].name:null, minute:min}));
  const opponentGoalEvents=oppMinutes.map(min=>({name:oppPool.length?oppPool[Math.floor(Math.random()*oppPool.length)].name:null, minute:min}));
  const shotsChallenger=challengerGoals*2+Math.floor(Math.random()*5)+3;
  const shotsOpponent=opponentGoals*2+Math.floor(Math.random()*4)+2;
  return {challengerGoals, opponentGoals, challengerFatigue, opponentFatigue, challengerCards, opponentCards,
    challengerInjuries, opponentInjuries, possession, challengerGoalEvents, opponentGoalEvents, shotsChallenger, shotsOpponent,
    challengerBaseLambda:chalLambda, opponentBaseLambda:oppLambda};
}

/* Pantalla de selección de estrategia para el partido actual del duelo */
/* Pantalla de estrategia + gestión de plantilla, usada tanto para el
   partido 1 como para los siguientes — usa los elementos REALES del
   juego (banquillo + panel de rival con selector de estrategia), igual
   que en solitario, nunca un popup superpuesto. */
/* Hash determinista simple — con la misma semilla (duelId+partido) da
   siempre el mismo resultado en los dos navegadores, sin tener que
   escribir nada extra a Firestore para sincronizar la decisión. */
function mpSimpleHash(str){
  let h=0;
  for(let i=0;i<str.length;i++){ h=(h*31+str.charCodeAt(i))|0; }
  return Math.abs(h);
}
/* Rueda de prensa antes de un partido del duelo — misma probabilidad
   que en solitario. Si toca, le aparece a AMBOS jugadores (semilla
   compartida), cada uno respondiendo la suya. El temporizador de
   gestión no empieza hasta que esta pantalla se cierra. */
function mpMaybeShowPressConference(idx, callback){
  const seed=(window._duelId||'')+':'+idx;
  const roll=mpSimpleHash(seed+':roll')%100;
  if(roll>=30){ callback(); return; }
  const events=getPressEvents();
  if(!events||!events.length){ callback(); return; }
  const eventIdx=mpSimpleHash(seed+':event')%events.length;
  showPressEventModal(events[eventIdx], ()=>{ pendingPrediction=null; callback(); });
}

function mpShowStrategyAndBenchPhase(){
  const idx=window._duelMatchIndex;
  mpMaybeShowPressConference(idx, ()=>mpRenderStrategyAndBenchPhase(idx));
}

function mpRenderStrategyAndBenchPhase(idx){
  selectedMatchStrategy=null;
  if(idx===0){
    // Giro Táctico: usos disponibles para todo el duelo (misma cantidad
    // real que en solitario: 1 base + mejora comprada).
    window._giroCharges=getMaxGiroCharges();
  }
  swapsUsedThisMatch=0;
  convSortMode='position';
  swapSelection=null;
  // Limpiar cualquier resto de la ventana de partido anterior
  const mo=document.getElementById('matchOverlay');
  if(mo) mo.innerHTML='';
  const liveExit=document.getElementById('duelLiveExitLink'); if(liveExit) liveExit.remove();
  const matchBadge=document.getElementById('duelMatchBadge'); if(matchBadge) matchBadge.remove();
  mpHideDuelOverlay();

  document.getElementById("benchSection").style.display="block";
  document.getElementById("moraleSection").style.display="block";
  document.getElementById("rivalBox").style.display="block";
  const matchHistoryBox=document.getElementById("matchHistoryBox"); if(matchHistoryBox) matchHistoryBox.style.display="none";
  const playBtn=document.getElementById("playMatchBtn"); if(playBtn) playBtn.style.display="none";
  const matchActionWrap1=document.getElementById("matchActionWrap"); if(matchActionWrap1) matchActionWrap1.style.display="none";
  const abandonBtn1=document.getElementById("abandonTournamentBtn"); if(abandonBtn1) abandonBtn1.style.display="none";
  // Por si se llega aquí tras recargar a mitad de duelo (sin pasar por el
  // draft normal), asegurar que estos botones siguen ocultos.
  const rollBtnEl=document.getElementById("rollBtn"); if(rollBtnEl) rollBtnEl.style.display="none";
  const qbWrap=document.getElementById("quickBuildWrap"); if(qbWrap) qbWrap.style.display="none";
  refreshPitchRatings();
  updateConvocadosTable();
  updateBenchTable();
  renderMorale();

  // Cabecera del panel de rival, adaptada a un oponente humano
  const rivalInfo=document.getElementById('rivalInfo');
  if(rivalInfo) rivalInfo.innerHTML=`<div style="text-align:center;padding:4px 0 8px">
      ${window._rivalCrestData?renderRivalCrestThumb(90):'<i class="ph ph-bold ph-user" style="font-size:56px;color:#7b9cff"></i>'}
      <div style="font-family:'Bebas Neue',Impact,sans-serif;font-size:16px;margin-top:4px">${mpEsc(window._duelOpponentUsername||'')}</div>
    </div>`;
  // Red de seguridad: si el escudo del rival nunca llegó a cargarse (p.ej.
  // sesión de duelo antigua sin el dato del rival), reintentar aquí
  // directamente desde el propio documento del duelo, y volver a pintar
  // esta cabecera en cuanto se resuelva.
  if(window._rivalCrestData===undefined && window._duelId && window._fbDb){
    window._fbDb.collection('duels').doc(window._duelId).get().then(snap=>{
      const dd=snap.exists?snap.data():null;
      if(!dd) return;
      const rivalUid = window._duelRole==='challenger' ? dd.opponentId : dd.challengerId;
      if(!rivalUid) return;
      return loadRivalCrestData(rivalUid);
    }).then(()=>{
      const ri=document.getElementById('rivalInfo');
      if(ri && window._rivalCrestData) ri.innerHTML=`<div style="text-align:center;padding:4px 0 8px">
          ${renderRivalCrestThumb(90)}
          <div style="font-family:'Bebas Neue',Impact,sans-serif;font-size:16px;margin-top:4px">${mpEsc(window._duelOpponentUsername||'')}</div>
        </div>`;
    }).catch(e=>console.error('[Escudo] reintento del rival falló:', e));
  }
  const rivalHint=document.getElementById('rivalHint');
  if(rivalHint) rivalHint.innerHTML=`<div class="style-label">${(tk('mp.duel_match_of')||'PARTIDO {0} DE 5').replace('{0}', String(idx+1))}</div>`;
  const weatherDisplay=document.getElementById('weatherDisplay'); if(weatherDisplay) weatherDisplay.style.display='none';

  renderStrategySelector();

  // Cambiar el punto de interés móvil al panel del rival al empezar
  // la gestión del equipo (partido 1 o entre partidos)
  if(typeof switchMobileTab==='function') setTimeout(()=>switchMobileTab('rival'), 150);

  let actionsWrap=document.getElementById('duelStrategyActions');
  if(!actionsWrap){
    actionsWrap=document.createElement('div');
    actionsWrap.id='duelStrategyActions';
    const rb=document.getElementById('rivalBox');
    if(rb) rb.appendChild(actionsWrap);
  }
  actionsWrap.innerHTML=`
    <button id="duelConfirmStrategyBtn" class="modal-btn" style="width:100%;margin-top:10px">${tk('mp.duel_confirm_strategy')||'CONFIRMAR Y ESPERAR AL RIVAL'}</button>
    <div id="duelStrategyWaitMsg" style="display:none;font-size:12px;color:var(--text-muted);margin-top:8px;text-align:center">${tk('mp.duel_waiting_strategy')||'Esperando la estrategia del rival...'}</div>`;
  const btn=document.getElementById('duelConfirmStrategyBtn');
  if(btn) btn.addEventListener('click', mpConfirmStrategyAndSquad);

  // Cuenta atrás de 30s — barra fina de progreso bajo el header, no lo tapa.
  let bar=document.getElementById('duelBetweenBar');
  if(!bar){
    bar=document.createElement('div');
    bar.id='duelBetweenBar';
    bar.style.cssText='position:fixed;left:0;right:0;z-index:70000;background:rgba(20,32,44,.94);padding:4px 10px;font-family:"Bebas Neue",Impact,sans-serif;letter-spacing:.5px;font-size:11px;color:#7ec3ff;display:flex;align-items:center;gap:8px';
    bar.innerHTML=`<span id="duelBarLabel" style="white-space:nowrap"></span>
      <div style="flex:1;height:6px;background:#0d1620;border-radius:3px;overflow:hidden">
        <div id="duelBarFill" style="height:100%;width:100%;background:linear-gradient(90deg,#4a90d9,#7ec3ff)"></div>
      </div>`;
    document.body.appendChild(bar);
  }
  mpAttachStickyBarScroll('duelBetweenBar');
  bar.style.display='flex';
  const totalMs=30000;
  const deadline=Date.now()+totalMs;
  const labelEl=document.getElementById('duelBarLabel');
  const fillEl=document.getElementById('duelBarFill');
  const matchLabel=(tk('mp.duel_match_of')||'PARTIDO {0} DE 5').replace('{0}', String(idx+1));
  const tick=()=>{
    const msLeft=deadline-Date.now();
    if(msLeft<=0){
      if(_duelTimerInterval){ clearInterval(_duelTimerInterval); _duelTimerInterval=null; }
      mpConfirmStrategyAndSquad();
      return;
    }
    const secLeft=Math.ceil(msLeft/1000);
    checkCountdownBeep(secLeft, 'duelStrategyBar');
    if(labelEl) labelEl.textContent=`${matchLabel} — `+(tk('mp.duel_between_time')||'⏱️ {0}s').replace('{0}', String(secLeft));
    if(fillEl) fillEl.style.width=Math.max(0, msLeft/totalMs*100)+'%';
  };
  tick();
  _duelTimerInterval=setInterval(tick,200);
}

/* Envía plantilla (por si hubo cambios) + estrategia elegida para el
   partido actual, y espera a que el rival haga lo mismo. */
async function mpConfirmStrategyAndSquad(){
  playSound('select');
  if(_duelTimerInterval){ clearInterval(_duelTimerInterval); _duelTimerInterval=null; }
  const bar=document.getElementById('duelBetweenBar'); if(bar) bar.style.display='none';
  mpDetachStickyBarScroll('duelBetweenBar');
  const db=window._fbDb;
  if(!db||!window._duelId) return;
  const btn=document.getElementById('duelConfirmStrategyBtn');
  if(btn) btn.disabled=true;
  const waitMsg=document.getElementById('duelStrategyWaitMsg');
  if(waitMsg) waitMsg.style.display='block';
  const idx=window._duelMatchIndex;
  const squad={
    pitch: usedPlayers.map(p=>({name:p.name, rating:p.rating, positions:p.positions, placedPos:p.placedPos, fatigue:(p.fatigue===undefined?100:p.fatigue)})),
    bench: bench.map(p=>({name:p.name, rating:p.rating, positions:p.positions})),
    formation: currentFormation,
    teamStats:{...teamStats},
    teamMorale: (typeof teamMorale!=='undefined')?teamMorale:0,
    scorerStreaks: usedPlayers.reduce((acc,p)=>{ if(scorerStreaks[p.name]) acc[p.name]=scorerStreaks[p.name]; return acc; },{}),
    skills: window._skillCache?{...window._skillCache}:{}
  };
  const squadField=window._duelRole==='challenger'?'challengerSquad':'opponentSquad';
  const stratField=window._duelRole==='challenger'?`m${idx}_challengerStrategy`:`m${idx}_opponentStrategy`;
  try{
    await db.collection('duels').doc(window._duelId).update({
      [squadField]: squad,
      [stratField]: selectedMatchStrategy||'__none__',
      currentMatchIndex: idx
    });
  }catch(e){ console.error('mpConfirmStrategyAndSquad error:',e); }
  document.getElementById("benchSection").style.display="none";
  document.getElementById("moraleSection").style.display="none";
  document.getElementById("rivalBox").style.display="none";
  mpShowWaitingPopup(`${(tk('mp.duel_match_of')||'PARTIDO {0} DE 5').replace('{0}', String(idx+1))}<br><span style="font-size:12px;font-weight:normal">${tk('mp.duel_waiting_strategy')||'Esperando la estrategia del rival...'}</span>`);
  mpWatchForMatchResult();
}

/* Espera a que ambas estrategias estén enviadas. El retador calcula el
   resultado y lo guarda; ambos lo leen de ahí para verlo idéntico. */
function mpWatchForMatchResult(){
  const db=window._fbDb;
  if(!db||!window._duelId) return;
  const idx=window._duelMatchIndex;
  const resultField=`m${idx}_result`;
  const chalKey=`m${idx}_challengerStrategy`, oppKey=`m${idx}_opponentStrategy`;
  const unsub=db.collection('duels').doc(window._duelId).onSnapshot(async snap=>{
    const d=snap.data();
    if(!d) return;
    if(d.status==='cancelled'){ unsub(); mpExitDuelMode(); location.reload(); return; }
    if(d[resultField]){ unsub(); mpPlayDuelMatchAnimation(d[resultField], d.challengerSquad, d.opponentSquad); return; }
    if(window._duelRole==='challenger' && d[chalKey]!==undefined && d[oppKey]!==undefined){
      unsub();
      const chalStrategy=d[chalKey]==='__none__'?null:d[chalKey];
      const oppStrategy=d[oppKey]==='__none__'?null:d[oppKey];
      const result=computeDuelMatchResult(d.challengerSquad, d.opponentSquad, chalStrategy, oppStrategy);
      try{ await db.collection('duels').doc(window._duelId).update({[resultField]: result}); }
      catch(e){ console.error('mpWatchForMatchResult compute error:',e); }
      mpPlayDuelMatchAnimation(result, d.challengerSquad, d.opponentSquad);
    }
  }, e=>console.error('mpWatchForMatchResult error:',e));
}

/* Resultado del partido actual — versión simple (marcador), sin animación
   minuto a minuto todavía. */
/* Genera el resumen de goles con el mismo formato HTML que usa
   generateMatchSummary() en solitario — showLiveMatch() ya sabe
   interpretarlo, así que no hace falta tocar esa función. */
function generateDuelMatchSummary(myGoalEvents, rivalGoalEvents, myShots, rivalShots, opponentUsername, myPossession){
  const possession=myPossession!==undefined?myPossession:50;
  const oppPoss=100-possession;
  const scorers=[];
  const myGoalLines=(myGoalEvents||[]).map(ev=>{
    if(ev.name) scorers.push(ev.name);
    return `<li>⚽ ${ev.name?mpEsc(ev.name):'Desconocido'} <span class="goal-min">(${ev.minute}')</span></li>`;
  });
  generateDuelMatchSummary._scorers=scorers; // para la racha de goleador, igual que en solitario
  generateDuelMatchSummary._lastStats={possession, oppPoss, shots:myShots, oppShots:rivalShots};
  const oppGoalLines=(rivalGoalEvents||[]).map(ev=>
    `<li>⚽ ${ev.name?mpEsc(ev.name):mpEsc(opponentUsername)} <span class="goal-min">(${ev.minute}')</span></li>`);
  const myLabel=(window.myTeamName||myTeamName||'TU EQUIPO');
  const goalsHTML=`
  <div class="goals-columns">
    <div class="goals-col">
      <div class="goals-col-header">${window._myCrestData?renderCrestThumb(18):'<i class="ph ph-bold ph-user" style="color:#4a90d9;vertical-align:middle;margin-right:2px"></i>'} ${myLabel}</div>
      <ul class="goals-list">${myGoalLines.length?myGoalLines.join(''):'<li class="no-goal">Sin goles</li>'}</ul>
    </div>
    <div class="goals-col">
      <div class="goals-col-header">${window._rivalCrestData?renderRivalCrestThumb(18):'<i class="ph ph-bold ph-user" style="color:#e74c3c;vertical-align:middle;margin-right:2px"></i>'} ${mpEsc(opponentUsername)}</div>
      <ul class="goals-list">${oppGoalLines.length?oppGoalLines.join(''):'<li class="no-goal">Sin goles</li>'}</ul>
    </div>
  </div>`;
  const tt=k=>window.t?window.t(k):k;
  return `<strong>${tt("match.possession")||'Posesión'}:</strong> ${myLabel} ${possession}% · ${mpEsc(opponentUsername)} ${oppPoss}%<br>
<strong>${tt("match.shots")||'Tiros'}:</strong> ${myShots} – ${rivalShots}
${goalsHTML}`;
}

/* Reproduce el partido con la MISMA animación minuto a minuto que el
   modo un jugador, reutilizando showLiveMatch() sin modificarlo. */
function mpPlayDuelMatchAnimation(result, challengerSquad, opponentSquad){
  const myGoals=window._duelRole==='challenger'?result.challengerGoals:result.opponentGoals;
  const rivalGoals=window._duelRole==='challenger'?result.opponentGoals:result.challengerGoals;
  const mySquad=window._duelRole==='challenger'?challengerSquad:opponentSquad;
  const rivalSquad=window._duelRole==='challenger'?opponentSquad:challengerSquad;
  const myCards=(window._duelRole==='challenger'?result.challengerCards:result.opponentCards)||[];
  const rivalCards=(window._duelRole==='challenger'?result.opponentCards:result.challengerCards)||[];
  const myInjuries=(window._duelRole==='challenger'?result.challengerInjuries:result.opponentInjuries)||[];
  const rivalInjuries=(window._duelRole==='challenger'?result.opponentInjuries:result.challengerInjuries)||[];
  const won=myGoals>rivalGoals, draw=myGoals===rivalGoals;
  // Aplicar la fatiga real calculada por el retador a mi propia plantilla local
  const myFatigueMap=(window._duelRole==='challenger'?result.challengerFatigue:result.opponentFatigue)||{};
  usedPlayers.forEach(p=>{ if(myFatigueMap[p.name]!==undefined) p.fatigue=myFatigueMap[p.name]; });
  const myGoalEvents=(window._duelRole==='challenger'?result.challengerGoalEvents:result.opponentGoalEvents)||[];
  const rivalGoalEvents=(window._duelRole==='challenger'?result.opponentGoalEvents:result.challengerGoalEvents)||[];
  const myShots=(window._duelRole==='challenger'?result.shotsChallenger:result.shotsOpponent)||0;
  const rivalShots=(window._duelRole==='challenger'?result.shotsOpponent:result.shotsChallenger)||0;
  updateScorerStreaks(generateDuelMatchSummary._scorers||[]);
  const myPossession=window._duelRole==='challenger'?result.possession:(100-result.possession);
  const summary=generateDuelMatchSummary(myGoalEvents, rivalGoalEvents, myShots, rivalShots, window._duelOpponentUsername||'Rival', myPossession);
  mpHideDuelOverlay();
  document.getElementById("benchSection").style.display="none";
  document.getElementById("moraleSection").style.display="none";
  window._duelLastMatchStats={myGoals,rivalGoals,myCards,rivalCards,myInjuries,rivalInjuries,won,draw};
  // Contexto para Giro Táctico en duelo — permite recalcular el tramo
  // restante lo pida quien lo pida, sin depender del retador.
  window._giroDuelCtx={
    duelId: window._duelId,
    matchIndex: window._duelMatchIndex,
    myRole: window._duelRole,
    mySquad, rivalSquad,
    challengerSquad, opponentSquad,
    opponentUsername: window._duelOpponentUsername,
    result
  };
  window._giroLambdaCtx=null; // este contexto es solo de solitario, no aplica aquí
  showLiveMatch(myGoals, rivalGoals, summary, [], myInjuries, won, draw, null, myCards, null, {injuries:rivalInjuries, cards:rivalCards});
  mpAddDuelExitLinkToLiveMatch();
}

/* Pequeño enlace de abandono flotante durante la animación en vivo,
   ya que en solitario no existe (no se puede "abandonar" contra la IA). */
function mpAddDuelExitLinkToLiveMatch(){
  let link=document.getElementById('duelLiveExitLink');
  if(link) link.remove();
  link=document.createElement('div');
  link.id='duelLiveExitLink';
  link.textContent=tk('mp.duel_exit')||'ABANDONAR ENCUENTRO';
  link.style.cssText='position:fixed;bottom:12px;right:12px;z-index:90000;cursor:pointer;color:#ff7e7e;background:#3a1a1a;border:1px solid #d94a4a;font-family:"Bebas Neue",Impact,sans-serif;font-size:14px;letter-spacing:.5px;padding:10px 16px;border-radius:5px';
  link.addEventListener('click', mpAbandonDuel);
  document.body.appendChild(link);
}

