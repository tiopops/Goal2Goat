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
    const onOk=()=>{ playSound('select'); cleanup(true); };
    const onCancel=()=>{ playSound('select'); cleanup(false); };
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
        <td class="mp-col-action">
          <button class="mp-challenge-btn mp-btn-challenge mp-btn-labeled" data-uid="${f.uid}" data-username="${mpEsc(f.username||'')}" title="${tk('mp.challenge')}">
            <i class="ph ph-bold ph-play"></i><span>Partido</span>
          </button>
          <button class="mp-challenge-btn mp-btn-challenge mp-btn-labeled" style="background:rgba(240,196,25,.12);border-color:var(--gold);color:var(--gold);margin-left:4px" data-uid="${f.uid}" data-username="${mpEsc(f.username||'')}" data-penalties-test="1" title="Reto directo a una tanda de penaltis, sin jugar partidos">
            <i class="ph ph-bold ph-soccer-ball"></i><span>Penaltis</span>
          </button>
        </td>
        <td class="mp-col-action"><button class="mp-remove-btn mp-btn-remove" data-id="${f.id}" data-username="${mpEsc(f.username||'')}" title="${tk('mp.remove')}"><i class="ph ph-bold ph-trash"></i></button></td>`;
      tbody.appendChild(row);
    });
    list.appendChild(table);
    list.querySelectorAll('.mp-remove-btn').forEach(b=>b.addEventListener('click',()=>{ playSound('select'); mpRemoveFriend(b.dataset.id, b.dataset.username); }));
    list.querySelectorAll('.mp-challenge-btn').forEach(b=>b.addEventListener('click',()=>{
      if(b.dataset.penaltiesTest) mpChallengeFriendPenaltiesTest(b.dataset.uid, b.dataset.username, b);
      else mpChallengeFriend(b.dataset.uid, b.dataset.username, b);
    }));
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
  const abandonWrap1=document.getElementById("abandonTournamentWrap"); if(abandonWrap1) abandonWrap1.style.display="none";
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
      ${(window._rivalCrestData||window._rivalCrestImage)?renderRivalCrestThumb(90):'<i class="ph ph-bold ph-user" style="font-size:56px;color:#7b9cff"></i>'}
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
      <div class="goals-col-header">${(window._myCrestData||window._myCrestImage)?renderCrestThumb(18):'<i class="ph ph-bold ph-user" style="color:#4a90d9;vertical-align:middle;margin-right:2px"></i>'} ${myLabel}</div>
      <ul class="goals-list">${myGoalLines.length?myGoalLines.join(''):'<li class="no-goal">Sin goles</li>'}</ul>
    </div>
    <div class="goals-col">
      <div class="goals-col-header">${(window._rivalCrestData||window._rivalCrestImage)?renderRivalCrestThumb(18):'<i class="ph ph-bold ph-user" style="color:#e74c3c;vertical-align:middle;margin-right:2px"></i>'} ${mpEsc(opponentUsername)}</div>
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


/* Continuación: tanda de penaltis, flujo completo de duelo (retos,
   entrar/salir de duelo, resumen final) y el cableado de los botones
   — se movió aquí también porque dependía de funciones de este
   mismo archivo (openMpOverlay), y quedarse en game.js causaba que
   el botón MULTIJUGADOR se enganchara antes de que existiera. */


/* Tras ver el resultado: si quedan partidos, ventana de 15s para tocar
   convocados/banquillo; si era el 5º, resumen final. */
/* ════════════════════════════════════════════════════════════════
   TANDA DE PENALTIS — exclusiva de duelo multijugador. Si un partido
   del duelo termina en empate, en vez de contar como empate se juega
   esta tanda visual (5 lanzamientos cada uno + muerte súbita, reglas
   Mundial) para decidir un ganador real de ese partido.
   Diseño de sincronización: en cada lanzamiento hay un tirador y un
   portero (se alternan). El TIRADOR es siempre quien resuelve el
   lanzamiento y avanza a la siguiente ronda — el otro simplemente
   adopta el resultado ya escrito, sin recalcular nada (mismo patrón
   que el resto del duelo). El RETADOR es quien inicializa la tanda
   (evita que los dos la inicien a la vez).
   ════════════════════════════════════════════════════════════════ */
const PENALTY_ZONES=[
  {id:'arriba_izquierda', x:18, y:30},
  {id:'arriba_derecha',   x:85, y:30},
  {id:'centro',           x:51, y:40},
  {id:'abajo_izquierda',  x:18, y:49},
  {id:'abajo_derecha',    x:85, y:49},
];
const PENALTY_KICK_MS=5000;
// Margen extra sobre el plazo compartido, para absorber diferencias de
// velocidad de red/dispositivo entre los dos jugadores — así el que
// tarda un poco más en recibir su turno no se queda sin oportunidad
// real de actuar.
const PENALTY_EXTRA_BUFFER_MS=4000;
// Tiempo que tardan los dos dispositivos en terminar de ver la animación
// del lanzamiento anterior (2000ms chuta + 1400ms resultado + 450ms
// respiro) antes de que aparezcan los círculos del siguiente — hay que
// sumarlo al plazo, si no los 5s ya se han comido casi enteros para
// cuando el jugador por fin puede elegir.
const PENALTY_ANIM_DELAY_MS=3850;

function mpPenaltyShooterRoleForKick(kickNum){
  // Pares = retador tira, impares = rival tira — igual en la tanda
  // base (5 rondas) y en la muerte súbita.
  return kickNum%2===0 ? 'challenger' : 'opponent';
}

async function mpMaybeStartPenalties(){
  const db=window._fbDb;
  const idx=window._duelMatchIndex;
  if(!db||!window._duelId) return;
  const ref=db.collection('duels').doc(window._duelId);
  if(window._duelRole==='challenger'){
    // Solo el retador inicializa, para evitar que los dos lo hagan a la vez
    try{
      const snap=await ref.get();
      const d=snap.exists?snap.data():{};
      if(!d[`m${idx}_penActive`]){
        await ref.update({
          [`m${idx}_penActive`]: true,
          [`m${idx}_penHistory`]: [],
          [`m${idx}_penCurrent`]: {kickNum:0, shooterRole:mpPenaltyShooterRoleForKick(0), deadline:Date.now()+PENALTY_KICK_MS, shooterZone:null, keeperZone:null}
        });
      }
    }catch(e){ console.error('[Penaltis] init falló:', e); }
  }
  mpRenderPenaltyShootoutScreen();
}

function mpRenderPenaltyShootoutScreen(){
  const overlay=document.getElementById('matchOverlay');
  if(!overlay) return;
  overlay.innerHTML=`
    <div class="match-modal" style="width:auto;max-width:98vw;padding:14px;display:flex;flex-direction:column;align-items:center;gap:8px;box-sizing:border-box">
      <div style="font-family:'Bebas Neue',Impact,sans-serif;color:var(--gold);letter-spacing:1.5px;font-size:16px">TANDA DE PENALTIS</div>
      <div id="penScoreLine" style="font-family:'Bebas Neue',Impact,sans-serif;font-size:26px;letter-spacing:2px">0 – 0</div>
      <div id="penKickLabel" style="font-size:11px;color:var(--text-muted)"></div>
      <div id="penTurnLabel" style="width:min(88vw,80vh,460px);text-align:center;font-family:'Bebas Neue',Impact,sans-serif;font-size:30px;letter-spacing:1px;padding-bottom:8px;border-bottom:3px solid var(--gold)"></div>
      <div style="width:90%;max-width:280px;height:4px;background:#222;border-radius:3px;overflow:hidden">
        <div id="penTimerFill" style="height:100%;width:100%;background:var(--gold);transition:width .1s linear"></div>
      </div>
      <div id="penSub" style="font-size:12px;color:var(--gold);min-height:14px;font-weight:700"></div>
      <div id="penStageWrap" style="position:relative;width:min(88vw,80vh,460px);height:min(88vw,80vh,460px);margin:0 auto;box-sizing:border-box">
        <img src="assets/penaltis/escenario.png" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain">
        <img id="penBalon" src="assets/penaltis/balon_iddle.png" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain">
        <img id="penPortero" src="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain">
        <img id="penJugador" src="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain">
        <div id="penZones" style="position:absolute;inset:0"></div>
      </div>
      <div id="penHistoryRow" style="display:flex;gap:5px;flex-wrap:wrap;justify-content:center;margin-top:4px"></div>
    </div>`;
  mpPenaltyAttachListener();
}

let mpPenListenerUnsub=null, mpPenTimerHandle=null, mpPenRenderedKick=-1, mpPenMyChoice=null;
let mpPenLatestCur=null; // siempre el último "cur" leído de Firestore, sin filtrar por si ya se renderizó
let mpPenAnimatedCount=0, mpPenAnimating=false, mpPenPendingFinish=null, mpPenResolvingKick=-1;
function mpPenaltyAttachListener(){
  mpPenaltyDetachListener();
  mpPenAnimatedCount=0; mpPenAnimating=false; mpPenPendingFinish=null;
  mpPenRenderedKick=-1; mpPenResolvingKick=-1;
  const db=window._fbDb;
  if(!db||!window._duelId) return;
  const idx=window._duelMatchIndex;
  mpPenListenerUnsub=db.collection('duels').doc(window._duelId).onSnapshot(snap=>{
    const d=snap.data();
    if(!d) return;
    if(d.status==='cancelled'){ mpPenaltyDetachListener(); mpExitDuelMode(); location.reload(); return; }
    const hist=d[`m${idx}_penHistory`]||[];
    const cur=d[`m${idx}_penCurrent`];
    const winner=d[`m${idx}_penWinner`];
    if(cur) mpPenLatestCur=cur; // siempre al día, aunque el render se salte por dedup

    // Si hay un lanzamiento en el historial que este dispositivo aún no
    // ha animado, reproducirlo ANTES que cualquier otra cosa — así los
    // dos ven exactamente la misma secuencia, en todos los penaltis.
    if(hist.length>mpPenAnimatedCount){
      const entry=hist[mpPenAnimatedCount];
      mpPenAnimatedCount++;
      mpPenPendingFinish=winner?{winnerRole:winner, history:hist}:null;
      mpPenAnimating=true;
      mpPlayPenaltyAnimationForEntry(entry).then(()=>{
        // Actualizar el marcador ya con este lanzamiento incluido
        const shownHist=hist.slice(0,mpPenAnimatedCount);
        const myGoalsPen=shownHist.filter(h=>h.shooterRole===window._duelRole&&h.result==='gol').length;
        const rivalGoalsPen=shownHist.filter(h=>h.shooterRole!==window._duelRole&&h.result==='gol').length;
        const sl=document.getElementById('penScoreLine'); if(sl) sl.textContent=`${myGoalsPen} – ${rivalGoalsPen}`;
        mpRenderPenaltyHistory(shownHist);
        // Pequeño respiro antes de pasar al siguiente lanzamiento — se
        // mantiene "animando" activo durante la pausa para que ningún
        // aviso del listener se cuele a mitad y solape fotogramas.
        setTimeout(()=>{
          mpPenAnimating=false;
          if(mpPenPendingFinish){
            mpPenaltyDetachListener();
            mpFinishPenaltiesUI(mpPenPendingFinish.winnerRole, mpPenPendingFinish.history);
          }else{
            // OJO: usar el estado más reciente conocido (mpPenLatestCur),
            // no el "cur" capturado hace ~4s cuando empezó esta animación
            // — si durante la espera el rival ya había elegido su zona
            // para el siguiente lanzamiento, ese "cur" antiguo ya no
            // refleja la realidad y el juego actuaría con datos viejos.
            const freshCur=mpPenLatestCur||cur;
            if(freshCur){
              mpRenderPenaltyKick(freshCur, shownHist);
              if(freshCur.shooterRole===window._duelRole) mpMaybeResolveAsShooter(freshCur, shownHist);
            }
          }
        }, 450);
      });
      return; // no procesar nada más hasta que esta animación termine
    }

    if(winner){
      if(mpPenAnimating){ mpPenPendingFinish={winnerRole:winner, history:hist}; return; }
      mpPenaltyDetachListener();
      mpFinishPenaltiesUI(winner, hist);
      return;
    }
    if(!cur || mpPenAnimating) return;
    mpRenderPenaltyKick(cur, hist);
    // El tirador de este lanzamiento es quien resuelve, en cuanto tenga
    // los dos datos (o se agote el tiempo) — nunca el portero.
    if(cur.shooterRole===window._duelRole){
      mpMaybeResolveAsShooter(cur, hist);
    }
  }, e=>console.error('[Penaltis] listener falló:', e));
}
function mpPenaltyDetachListener(){
  if(mpPenListenerUnsub){ mpPenListenerUnsub(); mpPenListenerUnsub=null; }
  if(mpPenTimerHandle){ clearInterval(mpPenTimerHandle); mpPenTimerHandle=null; }
}

function mpRenderPenaltyKick(cur, hist){
  if(mpPenRenderedKick===cur.kickNum && !cur._forceRerender) return;
  mpPenRenderedKick=cur.kickNum;
  mpPenMyChoice=null;
  mpPenCurState=cur;
  mpPenCurHist=hist;
  const iAmShooter=cur.shooterRole===window._duelRole;
  const myName=mpEsc(window.currentUsername||'TÚ');
  const round=Math.floor(cur.kickNum/2)+1;
  const label=round<=5?`Ronda ${round} de 5`:`Muerte súbita ${round-5}`;
  const lbl=document.getElementById('penKickLabel'); if(lbl) lbl.textContent=label;
  const turnLbl=document.getElementById('penTurnLabel');
  // Siempre describe MI PROPIO papel en este lanzamiento — antes se
  // mezclaba el nombre de quien tira con el verbo según mi rol, dando
  // frases sin sentido como "TIOPOPS PARA" cuando en realidad tiopops
  // estaba tirando y era el otro jugador quien paraba.
  if(turnLbl) turnLbl.innerHTML=`<span style="color:${iAmShooter?'#4a90d9':'#e74c3c'}">${myName.toUpperCase()}</span> ${iAmShooter?'TIRA':'INTENTA PARAR'} EL PENALTI`;
  // DIAGNÓSTICO TEMPORAL — solo kickNum y shooterRole, para confirmar
  // si el número de lanzamiento avanza de 1 en 1 (correcto) o de 2 en
  // 2 (lo que explicaría que el mismo jugador tire siempre). Quitar en
  // cuanto se confirme.
  const dbgKick=document.getElementById('penDebugKick')||(()=>{
    const t=document.createElement('div');
    t.id='penDebugKick';
    t.style.cssText='font-size:10px;color:#888;text-align:center;font-family:monospace;padding:2px';
    if(lbl&&lbl.parentNode) lbl.parentNode.insertBefore(t, lbl.nextSibling);
    return t;
  })();
  if(dbgKick) dbgKick.textContent=`[debug] kickNum=${cur.kickNum} shooterRole=${cur.shooterRole} duelRole=${window._duelRole}`;
  const sub=document.getElementById('penSub');
  if(sub) sub.textContent=iAmShooter?'¡Te toca lanzar! Elige tu zona':'¡Te toca parar! Elige dónde te tiras';

  // Marcador de penaltis (aciertos hasta ahora)
  const myGoalsPen=hist.filter(h=>h.shooterRole===window._duelRole && h.result==='gol').length;
  const rivalGoalsPen=hist.filter(h=>h.shooterRole!==window._duelRole && h.result==='gol').length;
  const sl=document.getElementById('penScoreLine'); if(sl) sl.textContent=`${myGoalsPen} – ${rivalGoalsPen}`;

  mpRenderPenaltyHistory(hist);

  // Capas: si soy tirador -> jugador (yo) + portero_rival; si soy portero -> jugador_rival + portero (yo)
  const jugadorImg=document.getElementById('penJugador');
  const porteroImg=document.getElementById('penPortero');
  const balonImg=document.getElementById('penBalon');
  if(jugadorImg) jugadorImg.src=`assets/penaltis/${iAmShooter?'jugador_iddle':'jugador_rival_iddle'}.png`;
  if(porteroImg) porteroImg.src=`assets/penaltis/${iAmShooter?'portero_rival_iddle':'portero_iddle'}.png`;
  if(balonImg) balonImg.src='assets/penaltis/balon_iddle.png';

  mpRenderPenaltyZones(iAmShooter, cur);
  mpStartPenaltyTimer(cur);
}

/* Marcadores de aciertos/fallos — un balón (tuyo en azul, del rival en
   rojo) relleno si acertó, hueco con aspa si falló. Más claro que los
   puntos bicolor anteriores. */
function mpRenderPenaltyHistory(hist){
  const hrow=document.getElementById('penHistoryRow');
  if(!hrow) return;
  hrow.innerHTML=hist.map(h=>{
    const mine=h.shooterRole===window._duelRole;
    const color=mine?'#4a90d9':'#e74c3c';
    // El significado de "acierto" se invierte según de quién sea el
    // turno: si YO tiro (azul), acierto = marqué gol. Si el RIVAL tira
    // y yo paro (rojo), acierto = NO me marcaron gol (da igual si fue
    // parada mía o el rival falló solo) — el icono siempre refleja MI
    // propio resultado en ese lanzamiento, nunca el del rival.
    const success = mine ? (h.result==='gol') : (h.result!=='gol');
    return `<div style="width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;
      background:${success?color:'transparent'};border:2px solid ${color};flex-shrink:0">
      <i class="ph ph-bold ${success?'ph-check':'ph-x'}" style="font-size:12px;color:${success?'#fff':color}"></i>
    </div>`;
  }).join('');
}

function mpEnsurePenaltyZoneStyles(){
  if(document.getElementById('penZoneStylesTag')) return;
  const style=document.createElement('style');
  style.id='penZoneStylesTag';
  style.textContent=`
    @keyframes penZonePulse{
      0%{ transform:translate(-50%,-50%) scale(1); }
      40%{ transform:translate(-50%,-50%) scale(1.35); }
      100%{ transform:translate(-50%,-50%) scale(1.15); }
    }
    .pen-zone-dot.pressed{ animation:penZonePulse .35s ease forwards; border-color:var(--gold) !important; background:rgba(255,220,120,.35) !important; box-shadow:0 0 25px 8px rgba(255,215,80,.85),inset 0 0 15px rgba(255,255,255,.5) !important; }
  `;
  document.head.appendChild(style);
}
function mpRenderPenaltyZones(iAmShooter, cur){
  mpEnsurePenaltyZoneStyles();
  const wrap=document.getElementById('penZones');
  if(!wrap) return;
  wrap.innerHTML='';
  const myField=iAmShooter?'shooterZone':'keeperZone';
  if(cur[myField]){ wrap.style.display='none'; return; } // ya elegí, ocultar círculos
  wrap.style.display='block';
  PENALTY_ZONES.forEach(z=>{
    const dot=document.createElement('div');
    dot.className='pen-zone-dot';
    dot.style.cssText=`position:absolute;left:${z.x}%;top:${z.y}%;transform:translate(-50%,-50%);width:15%;height:15%;border-radius:50%;background:rgba(255,255,255,.12);border:4px solid #fff;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.5),inset 0 0 10px rgba(255,255,255,.15);transition:transform .15s ease;-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none;outline:none;touch-action:manipulation`;
    dot.addEventListener('click', ()=>{
      playSound('select');
      dot.classList.add('pressed');
      // Ocultar el resto de zonas al instante, dejando la pulsación visible
      Array.from(wrap.children).forEach(c=>{ if(c!==dot) c.style.visibility='hidden'; });
      setTimeout(()=>mpSubmitPenaltyChoice(z.id), 200);
    });
    wrap.appendChild(dot);
  });
}

let mpPenCurState=null, mpPenCurHist=[];
function mpStartPenaltyTimer(cur){
  if(mpPenTimerHandle) clearInterval(mpPenTimerHandle);
  const fill=document.getElementById('penTimerFill');
  let lastBeepSec=null;
  // Dos relojes distintos, a propósito:
  // 1) La BARRA VISUAL usa el reloj local de ESTE dispositivo, empezando
  //    en el momento en que él mismo pinta la pantalla — así cada
  //    jugador ve siempre una cuenta atrás completa y justa desde su
  //    propio punto de vista, sea cual sea el retraso de red que haya
  //    tenido para llegar hasta aquí.
  // 2) El PLAZO REAL para forzar la resolución usa el plazo compartido
  //    (cur.deadline) más un margen extra generoso — así el tirador no
  //    fuerza el resultado mientras el portero todavía podría estar
  //    esperando su turno por culpa de un simple retraso de red.
  const localStart=Date.now();
  const sharedDeadline = (cur.deadline||(Date.now()+PENALTY_KICK_MS)) + PENALTY_EXTRA_BUFFER_MS;
  if(fill){ fill.style.transition='none'; fill.style.width='100%'; }
  requestAnimationFrame(()=>{
    requestAnimationFrame(()=>{ if(fill) fill.style.transition='width .1s linear'; });
  });
  mpPenTimerHandle=setInterval(()=>{
    const localRemainMs=Math.max(0, PENALTY_KICK_MS-(Date.now()-localStart));
    const remainSec=Math.ceil(localRemainMs/1000);
    if(remainSec!==lastBeepSec){ lastBeepSec=remainSec; checkCountdownBeep(remainSec,'penalty'); }
    if(fill) fill.style.width=(localRemainMs/PENALTY_KICK_MS*100)+'%';

    if(Date.now()>=sharedDeadline){
      clearInterval(mpPenTimerHandle); mpPenTimerHandle=null;
      // Al agotarse el plazo compartido (con su margen) hay que forzar
      // la resolución — si no, el juego se queda esperando indefinidamente.
      // OJO: usar SIEMPRE el estado más reciente (mpPenLatestCur), no
      // el "cur" capturado al arrancar el temporizador.
      // IMPORTANTE: por tiempo agotado, CUALQUIERA de los dos puede
      // forzar la resolución — no solo el tirador. Si solo lo pudiera
      // hacer el tirador y su dispositivo se quedaba pillado, se
      // desconectaba, o tardaba demasiado, el portero se quedaba
      // esperando para siempre sin ninguna forma de desatascarlo. La
      // protección contra dobles escrituras (mpPenResolvingKick) ya
      // evita que esto cause un resultado duplicado o inconsistente.
      const freshCur=mpPenLatestCur||cur;
      mpMaybeResolveAsShooter(freshCur, mpPenCurHist, true);
    }
  }, 100);
}

async function mpSubmitPenaltyChoice(zoneId){
  if(mpPenMyChoice) return; // ya elegí esta ronda
  mpPenMyChoice=zoneId;
  const wrap=document.getElementById('penZones');
  if(wrap) wrap.style.display='none';
  const sub=document.getElementById('penSub'); if(sub) sub.textContent='Esperando al rival...';
  const db=window._fbDb;
  if(!db||!window._duelId) return;
  const idx=window._duelMatchIndex;
  // Usar el lanzamiento que YO tenía delante cuando pulsé (mpPenCurState),
  // no volver a leer Firestore aquí — si para entonces el lanzamiento ya
  // había avanzado al siguiente (los papeles se intercambian en cada
  // uno), una lectura nueva daría el rol equivocado y la elección se
  // guardaría en el campo que no era (tirador↔portero mezclados).
  const cur=mpPenCurState;
  if(!cur) return;
  const iAmShooter=cur.shooterRole===window._duelRole;
  const field=iAmShooter?'shooterZone':'keeperZone';
  try{
    // Comprobación de seguridad: si para cuando esto se envía el
    // lanzamiento ya avanzó al siguiente (kickNum distinto), esta
    // elección ya no tiene sentido — se descarta en vez de escribirla
    // en el campo de un lanzamiento que no es al que respondía.
    const snap=await db.collection('duels').doc(window._duelId).get();
    const d=snap.exists?snap.data():{};
    const liveCur=d[`m${idx}_penCurrent`];
    if(!liveCur || liveCur.kickNum!==cur.kickNum) return;
    await db.collection('duels').doc(window._duelId).update({[`m${idx}_penCurrent.${field}`]: zoneId});
  }catch(e){ console.error('[Penaltis] envío de elección falló:', e); }
}

async function mpMaybeResolveAsShooter(cur, hist, timeUp){
  if(mpPenResolvingKick===cur.kickNum) return; // ya en proceso
  const bothPicked=cur.shooterZone && cur.keeperZone;
  if(!bothPicked && !timeUp) return;
  mpPenResolvingKick=cur.kickNum;

  let result, shooterZone=cur.shooterZone, keeperZone=cur.keeperZone;
  if(!cur.shooterZone){
    result='fuera'; // el tirador no eligió a tiempo: disparo fuera
  }else{
    // El portero que no elige a tiempo se queda quieto en el centro,
    // como si esa fuera su elección — no es gol automático.
    if(!keeperZone) keeperZone='centro';
    result=(cur.shooterZone===keeperZone)?'para':'gol';
  }

  // No se anima aquí — la animación la dispara el listener a partir del
  // historial, igual en los dos dispositivos, para que se vea idéntica.
  const newHist=[...hist, {kickNum:cur.kickNum, shooterRole:cur.shooterRole, result, shooterZone, keeperZone}];
  const db=window._fbDb;
  const idx=window._duelMatchIndex;

  // Comprobar si la tanda ya está decidida (regla de parada anticipada,
  // igual que en un jugador)
  const chalGoals=newHist.filter(h=>h.shooterRole==='challenger'&&h.result==='gol').length;
  const oppGoals=newHist.filter(h=>h.shooterRole==='opponent'&&h.result==='gol').length;
  const chalKicksLeftBase=Math.max(0,5-newHist.filter(h=>h.shooterRole==='challenger'&&h.kickNum<10).length);
  const oppKicksLeftBase=Math.max(0,5-newHist.filter(h=>h.shooterRole==='opponent'&&h.kickNum<10).length);
  const nextKickNum=cur.kickNum+1;
  const inSuddenDeath=nextKickNum>=10;
  let decided=false, winner=null;
  if(!inSuddenDeath){
    const diff=chalGoals-oppGoals;
    if(diff>oppKicksLeftBase){ decided=true; winner='challenger'; }
    else if(-diff>chalKicksLeftBase){ decided=true; winner='opponent'; }
  }else{
    // Muerte súbita: se decide en cuanto se completa un par de tiros con marcador distinto
    if(nextKickNum%2===0 && chalGoals!==oppGoals){ decided=true; winner=chalGoals>oppGoals?'challenger':'opponent'; }
  }

  try{
    if(decided){
      await db.collection('duels').doc(window._duelId).update({
        [`m${idx}_penHistory`]: newHist,
        [`m${idx}_penWinner`]: winner,
        [`m${idx}_penCurrent`]: null
      });
    }else{
      await db.collection('duels').doc(window._duelId).update({
        [`m${idx}_penHistory`]: newHist,
        [`m${idx}_penCurrent`]: {kickNum:nextKickNum, shooterRole:mpPenaltyShooterRoleForKick(nextKickNum), deadline:Date.now()+PENALTY_ANIM_DELAY_MS+PENALTY_KICK_MS, shooterZone:null, keeperZone:null}
      });
    }
  }catch(e){ console.error('[Penaltis] avance de ronda falló:', e); }
}

/* Prepara la escena para el lanzamiento indicado (idle correcto para mi
   perspectiva) y reproduce su animación ya resuelta — se llama igual en
   los dos dispositivos, a partir del historial compartido. */
function mpPlayPenaltyAnimationForEntry(entry){
  const iShoot=entry.shooterRole===window._duelRole;
  const jugadorImg=document.getElementById('penJugador');
  const porteroImg=document.getElementById('penPortero');
  const balonImg=document.getElementById('penBalon');
  const wrap=document.getElementById('penZones'); if(wrap) wrap.style.display='none';
  if(jugadorImg) jugadorImg.src=`assets/penaltis/${iShoot?'jugador_iddle':'jugador_rival_iddle'}.png`;
  if(porteroImg) porteroImg.src=`assets/penaltis/${iShoot?'portero_rival_iddle':'portero_iddle'}.png`;
  if(balonImg){ balonImg.style.display=''; balonImg.src='assets/penaltis/balon_iddle.png'; }
  const round=Math.floor(entry.kickNum/2)+1;
  const label=round<=5?`Ronda ${round} de 5`:`Muerte súbita ${round-5}`;
  const lbl=document.getElementById('penKickLabel'); if(lbl) lbl.textContent=label;
  const myName=mpEsc(window.currentUsername||'TÚ');
  const turnLbl=document.getElementById('penTurnLabel');
  if(turnLbl) turnLbl.innerHTML=`<span style="color:${iShoot?'#4a90d9':'#e74c3c'}">${myName.toUpperCase()}</span> ${iShoot?'TIRA':'INTENTA PARAR'} EL PENALTI`;
  return mpPlayPenaltyAnimation(entry.result, entry.shooterZone, entry.keeperZone, iShoot);
}

function mpPlayPenaltyAnimation(result, shooterZone, keeperZone, iShoot){
  return new Promise(resolve=>{
    const jugadorImg=document.getElementById('penJugador');
    const porteroImg=document.getElementById('penPortero');
    const balonImg=document.getElementById('penBalon');
    const sub=document.getElementById('penSub');
    const jPrefix=iShoot?'jugador':'jugador_rival';
    const pPrefix=iShoot?'portero_rival':'portero';
    if(sub) sub.textContent='¡Chuta!';
    if(jugadorImg) jugadorImg.src=`assets/penaltis/${jPrefix}_chuta.png`;
    playSound('select');
    setTimeout(()=>{
      const zone=shooterZone||'centro';
      if(result==='fuera'){
        if(jugadorImg) jugadorImg.src=`assets/penaltis/${jPrefix}_falla.png`;
        // El portero, si sí eligió zona, se muestra reaccionando ahí
        // igualmente — que el disparo se fuera no significa que su
        // elección se ignorase visualmente.
        if(porteroImg) porteroImg.src=keeperZone?`assets/penaltis/${pPrefix}_${keeperZone}_para.png`:`assets/penaltis/${pPrefix}_iddle.png`;
        if(balonImg) balonImg.style.display='none';
        if(sub) sub.textContent='¡FUERA!';
        // Malo para quien tiraba (falló su disparo); neutro para el
        // portero, que no tuvo que hacer nada.
        if(iShoot) playSound('defeat');
      }else if(result==='gol'){
        if(jugadorImg) jugadorImg.src=`assets/penaltis/${jPrefix}_gol.png`;
        if(porteroImg) porteroImg.src=keeperZone?`assets/penaltis/${pPrefix}_${keeperZone}_falla.png`:`assets/penaltis/${pPrefix}_iddle.png`;
        if(balonImg){ balonImg.style.display=''; balonImg.src=`assets/penaltis/balon_gol_${zone}.png`; }
        if(sub) sub.textContent='¡GOL!';
        // Bueno para quien tiraba (marcó), malo para el portero (encajó).
        playSound(iShoot?'goal':'defeat');
      }else{ // para
        if(jugadorImg) jugadorImg.src=`assets/penaltis/${jPrefix}_falla.png`;
        if(porteroImg) porteroImg.src=`assets/penaltis/${pPrefix}_${keeperZone}_para.png`;
        if(balonImg) balonImg.style.display='none';
        if(sub) sub.textContent='¡PARADA!';
        // Bueno para el portero (paró), malo para quien tiraba (falló).
        playSound(iShoot?'defeat':'victory');
      }
      setTimeout(resolve, 1400);
    }, 2000);
  });
}

function mpFinishPenaltiesUI(winnerRole, history){
  const sub=document.getElementById('penSub');
  const iWon=winnerRole===window._duelRole;
  if(sub) sub.textContent=iWon?'¡GANAS LA TANDA DE PENALTIS!':'Pierdes la tanda de penaltis';
  playSound(iWon?'victory':'defeat');
  if(window._duelLastMatchStats) Object.assign(window._duelLastMatchStats, {won:iWon, draw:false, decidedByPenalties:true});
  const myPenGoals=history.filter(h=>h.shooterRole===window._duelRole&&h.result==='gol').length;
  const rivalPenGoals=history.filter(h=>h.shooterRole!==window._duelRole&&h.result==='gol').length;
  const st=window._duelLastMatchStats||{};
  setTimeout(()=>{
    const overlay=document.getElementById('matchOverlay');
    if(overlay){
      const resultBanner = window._duelIsPenaltiesOnly
        ? `<div style="text-align:center;padding:16px 0 4px">
             <div style="font-family:'Bebas Neue',Impact,sans-serif;font-size:26px;letter-spacing:1px;color:${iWon?'var(--gold)':'#e74c3c'}">${iWon?'¡GANAS LA TANDA DE PENALTIS!':'PIERDES LA TANDA DE PENALTIS'}</div>
           </div>
           <button id="mpPenaltiesOnlyBackBtn" style="margin:14px auto 4px;display:block;font-family:'Bebas Neue',Impact,sans-serif;letter-spacing:1px;font-size:13px;background:var(--gold);color:#000;border:none;border-radius:6px;padding:10px 24px;cursor:pointer">VOLVER AL INICIO</button>`
        : '';
      overlay.innerHTML=`
      <div class="match-modal" style="overflow:hidden;display:flex;flex-direction:column">
        <div class="match-header">
          <div class="match-side">
            ${(window._myCrestData||window._myCrestImage)?renderCrestThumb(40):'<i class="ph ph-bold ph-user" style="font-size:32px;color:#4a90d9"></i>'}
            <span class="match-team-name">${mpEsc(window.myTeamName||myTeamName||'TU EQUIPO')}</span>
          </div>
          <div style="text-align:center;flex:0 0 auto">
            <div class="match-scoreline" style="font-size:42px;letter-spacing:4px">${st.myGoals||0} – ${st.rivalGoals||0}</div>
            <div style="font-size:11px;color:var(--gold);margin-top:2px">${(tk('match.penalties')||'PENALTIS')} ${myPenGoals}-${rivalPenGoals}</div>
            <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:4px">
              <div style="font-size:9px;font-weight:700;background:#555;color:#fff;padding:2px 7px;letter-spacing:1px;text-transform:uppercase">${tk('match.end')||'FIN'}</div>
            </div>
          </div>
          <div class="match-side">
            ${(window._rivalCrestData||window._rivalCrestImage)?renderRivalCrestThumb(40):'<i class="ph ph-bold ph-user" style="font-size:32px;color:#e74c3c"></i>'}
            <span class="match-team-name">${mpEsc(window._duelOpponentUsername||'RIVAL')}</span>
          </div>
        </div>
        ${resultBanner}
      </div>`;
    }
    if(window._duelIsPenaltiesOnly){
      // Modo TANDA DE PENALTIS: aquí acaba, no se continúa a otro
      // partido — se marca el duelo como terminado y se muestra el
      // resultado fijo, con un botón para volver cuando el jugador
      // quiera (en vez de recargar sola a los pocos segundos, que no
      // daba tiempo a leer el resultado).
      const db=window._fbDb;
      if(db&&window._duelId){
        db.collection('duels').doc(window._duelId).update({status:'finished'}).catch(e=>console.error(e));
      }
      const backBtn=document.getElementById('mpPenaltiesOnlyBackBtn');
      if(backBtn) backBtn.addEventListener('click', ()=>{ playSound('select'); mpExitDuelMode(); location.reload(); });
      return;
    }
    mpAdvanceAfterMatch();
  }, 1600);
}

/* El sistema de ESCUDO PERSONALIZADO (editor, guardado, miniaturas)
   vive ahora en crest-editor.js, cargado justo después de este
   archivo — mismo ámbito global, mismo comportamiento, solo separado
   para que este archivo no siga creciendo sin control. */

function mpAdvanceAfterMatch(){
  mpShowDuelPostMatchStats();
}

/* Estadísticas del partido recién jugado — se insertan en la MISMA
   ventana de partido (igual que showPostMatch() en solitario), no en
   un popup aparte. Ambos deben confirmar para pasar a la gestión
   previa al siguiente partido (o al resumen final). */
async function mpShowDuelPostMatchStats(){
  const db=window._fbDb;
  const idx=window._duelMatchIndex;
  const st=window._duelLastMatchStats||{};
  const s=generateDuelMatchSummary._lastStats||{possession:50,oppPoss:50,shots:0,oppShots:0};
  const overlay=document.getElementById('matchOverlay');
  const modal=overlay?overlay.querySelector('.match-modal'):null;
  if(!modal){
    // Red de seguridad si por lo que sea la ventana de partido ya no está
    if(idx>=4){ mpShowDuelFinalSummary(); }else{ window._duelMatchIndex=idx+1; mpShowStrategyAndBenchPhase(); }
    return;
  }
  modal.style.overflowY='auto';

  const resultClass=st.won?'res-win-tag':st.draw?'res-draw-tag':'res-lose-tag';
  const resultText=(st.won?(tk('mp.duel_you_won')||'¡GANASTE ESTE PARTIDO!')
    :st.draw?(tk('mp.duel_draw')||'Empate')
    :(tk('mp.duel_you_lost')||'Has perdido este partido')) + (st.decidedByPenalties?' ('+(tk('match.penalties')||'PENALTIS')+')':'');
  const banner=document.createElement('div');
  banner.className=`match-result-tag ${resultClass}`;
  banner.textContent=resultText;
  banner.style.animation='slideInEvent .4s ease forwards';
  modal.appendChild(banner);

  const infoWrap=document.createElement('div');
  infoWrap.style.cssText='display:flex;flex-direction:column;gap:6px;margin-top:8px';

  const summaryDiv=document.createElement('div');
  summaryDiv.className='match-summary';
  const myLabel=(window.myTeamName||myTeamName||'TU EQUIPO');
  summaryDiv.innerHTML=`<strong>${tk('mp.duel_possession')||'Posesión'}:</strong> ${myLabel} ${s.possession}% · ${mpEsc(window._duelOpponentUsername||'')} ${s.oppPoss}%<br><strong>${tk('mp.duel_shots')||'Tiros'}:</strong> ${s.shots} – ${s.oppShots}`;
  infoWrap.appendChild(summaryDiv);

  const ILABELS={leve:'leve (1 partido)', básica:'básica (2 partidos)', grave:'grave (3 partidos)'};
  if(st.myInjuries&&st.myInjuries.length){
    const inj=document.createElement('div');
    inj.className='injury-section';
    inj.innerHTML=`<p>${(tk('match.injuries_short')||'⚠ Lesiones en {0}:').replace('{0}',myLabel)}</p><ul>${st.myInjuries.map(p=>`<li><span style="color:#e74c3c">✚</span> ${mpEsc(p.name)}: lesión ${ILABELS[p.type]||''}</li>`).join('')}</ul>`;
    infoWrap.appendChild(inj);
  }
  if(st.rivalInjuries&&st.rivalInjuries.length){
    const inj=document.createElement('div');
    inj.className='injury-section';
    inj.innerHTML=`<p>${(tk('match.injuries_short')||'⚠ Lesiones en {0}:').replace('{0}',mpEsc(window._duelOpponentUsername||''))}</p><ul>${st.rivalInjuries.map(p=>`<li><span style="color:#e74c3c">✚</span> ${mpEsc(p.name)}: lesión ${ILABELS[p.type]||''}</li>`).join('')}</ul>`;
    infoWrap.appendChild(inj);
  }
  const allCards=[...(st.myCards||[]), ...(st.rivalCards||[])];
  if(allCards.length){
    const CARD_LABELS={yellow:{icon:'🟨',text:'amarilla'}, red:{icon:'🟥',text:'roja directa — sancionado'}};
    const cd=document.createElement('div');
    cd.className='card-section';
    cd.innerHTML=`<p>${tk('match.cards_short')||'📋 Tarjetas:'}</p><ul>${allCards.map(c=>{const l=CARD_LABELS[c.type]||CARD_LABELS.yellow; return `<li>${l.icon} ${mpEsc(c.player.name)}: ${l.text}</li>`;}).join('')}</ul>`;
    infoWrap.appendChild(cd);
  }

  // Evaluar si la estrategia elegida fue acertada
  try{
    if(db&&window._duelId){
      const snap=await db.collection('duels').doc(window._duelId).get();
      const d=snap.data()||{};
      const chalKey=d[`m${idx}_challengerStrategy`], oppKey=d[`m${idx}_opponentStrategy`];
      const myKey=window._duelRole==='challenger'?chalKey:oppKey;
      if(myKey && myKey!=='__none__' && modal.isConnected){
        const mod=window._duelRole==='challenger'
          ?duelCounterModifier(chalKey,oppKey).myScoreMod
          :duelCounterModifier(chalKey,oppKey).oppScoreMod;
        const myName=STRATEGIES[myKey]?STRATEGIES[myKey].name:myKey;
        const verdict=mod>0.1?(tk('mp.duel_strat_great')||'¡Gran elección! Superó la estrategia rival')
          :mod>0?(tk('mp.duel_strat_good')||'Buena lectura del rival')
          :mod<0?(tk('mp.duel_strat_bad')||'El rival te leyó mejor esta vez')
          :(tk('mp.duel_strat_neutral')||'Elección neutral, sin ventaja ni penalización');
        const stratClass=mod>0?'strategy-feedback-good':mod<0?'strategy-feedback-bad':'strategy-feedback-neutral';
        const sf=document.createElement('div');
        sf.className=`strategy-feedback ${stratClass}`;
        sf.textContent=`${(tk('mp.duel_your_strategy')||'Tu estrategia')} (${myName}): ${verdict}`;
        infoWrap.appendChild(sf);
      }
      // Giro Táctico — mostrar si alguno de los dos lo usó este partido
      // (reutiliza la misma lectura de arriba, sin gasto extra).
      const giroChal=d[`m${idx}_giroChallenger`], giroOpp=d[`m${idx}_giroOpponent`];
      const myGiro=window._duelRole==='challenger'?giroChal:giroOpp;
      const rivalGiro=window._duelRole==='challenger'?giroOpp:giroChal;
      if(myGiro){
        const gc=document.createElement('div');
        gc.className='match-summary';
        gc.style.cssText='border:1px solid var(--gold);border-radius:8px;padding:10px;display:flex;align-items:center;gap:10px';
        gc.innerHTML=myGiro.noPick
          ? `<i class="ph ph-bold ph-notebook" style="font-size:26px;color:#4a90d9;flex-shrink:0"></i><div><strong style="color:var(--gold)">${tk('giro.used_title')||'Giro Táctico usado'}</strong>: ${tk('giro.no_pick')||'no se eligió ninguna carta a tiempo'} (min ${myGiro.minute}')</div>`
          : `<i class="ph ph-bold ph-notebook" style="font-size:26px;color:#4a90d9;flex-shrink:0"></i><div><strong style="color:var(--gold)">${tk('giro.used_title')||'Giro Táctico usado'}: ${mpEsc(myGiro.cardName)}</strong><br><span style="color:#bfe8c9">${mpEsc(myGiro.pos)}</span> · <span style="color:#f3c6c1">${mpEsc(myGiro.neg)}</span></div>`;
        infoWrap.appendChild(gc);
      }
      if(rivalGiro){
        const gc=document.createElement('div');
        gc.className='match-summary';
        gc.style.cssText='border:1px solid #4a90d9;border-radius:8px;padding:10px;display:flex;align-items:center;gap:10px';
        const rivalName=mpEsc(window._duelOpponentUsername||'Rival');
        gc.innerHTML=rivalGiro.noPick
          ? `<i class="ph ph-bold ph-notebook" style="font-size:26px;color:#e74c3c;flex-shrink:0"></i><div><strong style="color:#7ec3ff">${rivalName} ${(tk('giro.rival_used')||'usó Giro Táctico')}</strong>: ${tk('giro.no_pick')||'no eligió ninguna carta a tiempo'} (min ${rivalGiro.minute}')</div>`
          : `<i class="ph ph-bold ph-notebook" style="font-size:26px;color:#e74c3c;flex-shrink:0"></i><div><strong style="color:#7ec3ff">${rivalName} ${(tk('giro.rival_used')||'usó Giro Táctico')}: ${mpEsc(rivalGiro.cardName)}</strong><br><span style="color:#bfe8c9">${mpEsc(rivalGiro.pos)}</span> · <span style="color:#f3c6c1">${mpEsc(rivalGiro.neg)}</span></div>`;
        infoWrap.appendChild(gc);
      }
    }
  }catch(e){ console.error('mpShowDuelPostMatchStats strategy error:',e); }

  const waitMsg=document.createElement('div');
  waitMsg.id='duelPostMatchWaitMsg';
  waitMsg.style.cssText='display:none;font-size:12px;color:var(--text-muted);margin-top:8px;text-align:center';
  waitMsg.textContent=tk('mp.duel_waiting_continue')||'Esperando a que el rival confirme...';
  infoWrap.appendChild(waitMsg);

  modal.appendChild(infoWrap);

  const btn=document.createElement('button');
  btn.className='modal-btn';
  btn.id='duelPostMatchContinueBtn';
  btn.textContent=tk('mp.duel_continue')||'CONTINUAR';
  btn.style.marginTop='10px';
  btn.addEventListener('click', mpConfirmPostMatchContinue);
  modal.appendChild(btn);

  // Scroll al final para que el botón de continuar se vea sin desplazar
  setTimeout(()=>{ modal.scrollTop=9999; },100);
}

async function mpConfirmPostMatchContinue(){
  playSound('select');
  const db=window._fbDb;
  if(!db||!window._duelId) return;
  const btn=document.getElementById('duelPostMatchContinueBtn');
  if(btn) btn.disabled=true;
  const waitMsg=document.getElementById('duelPostMatchWaitMsg');
  if(waitMsg) waitMsg.style.display='block';
  const idx=window._duelMatchIndex;
  const field=window._duelRole==='challenger'?`m${idx}_challengerContinued`:`m${idx}_opponentContinued`;
  try{ await db.collection('duels').doc(window._duelId).update({[field]:true}); }
  catch(e){ console.error('mpConfirmPostMatchContinue error:',e); }
  mpWatchForBothContinued(idx);
}

/* Espera a que ambos hayan confirmado "continuar" tras ver las
   estadísticas del partido. Reutilizable también al retomar tras recargar. */
function mpWatchForBothContinued(idx){
  const db=window._fbDb;
  if(!db||!window._duelId) return;
  const chalField=`m${idx}_challengerContinued`, oppField=`m${idx}_opponentContinued`;
  const unsub=db.collection('duels').doc(window._duelId).onSnapshot(snap=>{
    const d=snap.data();
    if(!d) return;
    if(d.status==='cancelled'){ unsub(); mpExitDuelMode(); location.reload(); return; }
    if(d[chalField] && d[oppField]){
      unsub();
      if(idx>=4){ mpShowDuelFinalSummary(); }
      else{ window._duelMatchIndex=idx+1; mpShowStrategyAndBenchPhase(); }
    }
  }, e=>console.error('mpWatchForBothContinued error:',e));
}

/* Resumen final: solo vencedor + estadísticas globales de los 5 partidos. */
async function mpShowDuelFinalSummary(){
  const db=window._fbDb;
  if(!db||!window._duelId) return;
  let d={};
  try{
    const snap=await db.collection('duels').doc(window._duelId).get();
    d=snap.data()||{};
  }catch(e){ console.error('mpShowDuelFinalSummary error:',e); }
  let myWins=0, rivalWins=0, myGoalsTotal=0, rivalGoalsTotal=0, draws=0;
  let myCardsTotal=0, rivalCardsTotal=0, myInjuriesTotal=0, rivalInjuriesTotal=0;
  let myGiroUses=0, rivalGiroUses=0;
  let possessionSum=0, playedCount=0, biggestWinIdx=-1, biggestWinMargin=0, cleanSheets=0, rivalCleanSheets=0;
  const rows=[];
  for(let i=0;i<5;i++){
    const r=d[`m${i}_result`];
    if(!r) continue;
    playedCount++;
    const myG=window._duelRole==='challenger'?r.challengerGoals:r.opponentGoals;
    const rG=window._duelRole==='challenger'?r.opponentGoals:r.challengerGoals;
    const myC=(window._duelRole==='challenger'?r.challengerCards:r.opponentCards)||[];
    const rC=(window._duelRole==='challenger'?r.opponentCards:r.challengerCards)||[];
    const myI=(window._duelRole==='challenger'?r.challengerInjuries:r.opponentInjuries)||[];
    const rI=(window._duelRole==='challenger'?r.opponentInjuries:r.challengerInjuries)||[];
    const myPoss=window._duelRole==='challenger'?r.possession:(100-(r.possession||50));
    possessionSum+=(myPoss||50);
    myGoalsTotal+=myG; rivalGoalsTotal+=rG;
    myCardsTotal+=myC.length; rivalCardsTotal+=rC.length;
    myInjuriesTotal+=myI.length; rivalInjuriesTotal+=rI.length;
    if(d[`m${i}_${window._duelRole==='challenger'?'giroChallenger':'giroOpponent'}`]) myGiroUses++;
    if(d[`m${i}_${window._duelRole==='challenger'?'giroOpponent':'giroChallenger'}`]) rivalGiroUses++;
    if(rG===0) cleanSheets++;
    if(myG===0) rivalCleanSheets++;
    let res=myG>rG?'W':myG<rG?'L':'D';
    let penIndicator='';
    const penWinner=d[`m${i}_penWinner`];
    if(res==='D' && penWinner){
      res=penWinner===window._duelRole?'W':'L';
      penIndicator=' <span style="font-size:9px;opacity:.7">(pen.)</span>';
    }
    if(res==='W') myWins++; else if(res==='L') rivalWins++; else draws++;
    if(res==='W' && (myG-rG)>biggestWinMargin){ biggestWinMargin=myG-rG; biggestWinIdx=i; }
    const resColor=res==='W'?'#4ade80':res==='L'?'#ff7e7e':'var(--text-muted)';
    rows.push(`<div class="mp-stat-row"><span>${tk('mp.duel_match_short')||'Partido'} ${i+1}</span><span style="color:${resColor}">${myG} - ${rG}${penIndicator}</span></div>`);
  }
  const avgPoss=playedCount?Math.round(possessionSum/playedCount):50;
  let iWin=myWins>rivalWins, iLose=myWins<rivalWins;
  let tiebreakNote='';
  if(myWins===rivalWins){
    const myDiff=myGoalsTotal-rivalGoalsTotal, rivalDiff=rivalGoalsTotal-myGoalsTotal;
    if(myDiff!==rivalDiff){
      iWin=myDiff>rivalDiff; iLose=!iWin;
      tiebreakNote=tk('mp.duel_tiebreak_goals')||'(empate en partidos ganados, decidido por diferencia de goles)';
    }else if(avgPoss!==(100-avgPoss)){
      iWin=avgPoss>(100-avgPoss); iLose=!iWin;
      tiebreakNote=tk('mp.duel_tiebreak_possession')||'(empate en partidos y goles, decidido por posesión media)';
    }
  }
  const outcome = iWin
    ? (tk('mp.duel_final_won')||'¡HAS GANADO EL DUELO!')
    : iLose
      ? (tk('mp.duel_final_lost')||'Has perdido el duelo')
      : (tk('mp.duel_final_tie')||'Duelo empatado');
  playSound(iWin?'victory':iLose?'defeat':'whistle');

  // Guardar estadísticas de duelo (una sola vez, aunque se recargue la
  // pantalla) — cada jugador anota las suyas propias en su documento.
  const statsField=`statsRecorded_${window._duelRole}`;
  if(!d[statsField]){
    try{
      const user=window._fbAuth&&window._fbAuth.currentUser;
      if(user){
        await db.collection('users').doc(user.uid).set({
          duelsPlayed: firebase.firestore.FieldValue.increment(1),
          duelsWon: firebase.firestore.FieldValue.increment(iWin?1:0),
          duelsLost: firebase.firestore.FieldValue.increment(iLose?1:0),
        }, {merge:true});
      }
      await db.collection('duels').doc(window._duelId).update({[statsField]: true});
    }catch(e){ console.error('[Duelo] guardado de estadísticas falló:', e); }
  }

  // Frase narrativa con algún dato destacado
  let narrative='';
  if(biggestWinIdx>=0){
    narrative=(tk('mp.duel_final_narrative_win')||'Tu mejor actuación fue en el partido {0}, ganando por {1} goles de diferencia.')
      .replace('{0}', String(biggestWinIdx+1)).replace('{1}', String(biggestWinMargin));
  }else if(myGoalsTotal>rivalGoalsTotal){
    narrative=(tk('mp.duel_final_narrative_goals')||'Marcaste {0} goles en total, {1} más que tu rival.')
      .replace('{0}', String(myGoalsTotal)).replace('{1}', String(myGoalsTotal-rivalGoalsTotal));
  }else if(cleanSheets>0){
    narrative=(tk('mp.duel_final_narrative_clean')||'Mantuviste la portería a cero en {0} de {1} partidos.')
      .replace('{0}', String(cleanSheets)).replace('{1}', String(playedCount));
  }

  const myLabel=(window.myTeamName||myTeamName||'TU EQUIPO');

  mpShowDuelOverlay(`
    <i class="ph ph-bold ph-trophy" style="font-size:34px;color:var(--gold);display:block;margin-bottom:6px"></i>
    <div style="font-family:'Bebas Neue',Impact,sans-serif;font-size:22px;color:var(--gold)">${outcome}</div>
    ${tiebreakNote?`<div style="font-size:11px;color:var(--text-muted);margin-top:2px">${tiebreakNote}</div>`:''}
    <div style="font-family:'Bebas Neue',Impact,sans-serif;font-size:26px;margin:6px 0">${myWins} - ${rivalWins}</div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;border-top:1px solid var(--line);margin-top:8px">
      <div style="text-align:center;padding:8px 6px;border-right:1px solid var(--line)">
        <div style="font-family:'Bebas Neue',Impact,sans-serif;font-size:13px;color:var(--gold)">${mpEsc(myLabel)}</div>
      </div>
      <div style="text-align:center;padding:8px 6px">
        <div style="font-family:'Bebas Neue',Impact,sans-serif;font-size:13px">${mpEsc(window._duelOpponentUsername||'')}</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr auto 1fr;align-items:center;font-size:12px">
      <div style="text-align:center;padding:3px 0">${myWins}</div><div style="text-align:center;color:var(--text-muted);font-size:10px;padding:0 8px">${tk('mp.duel_final_matches')||'Partidos ganados'}</div><div style="text-align:center;padding:3px 0">${rivalWins}</div>
      <div style="text-align:center;padding:3px 0">${myGoalsTotal}</div><div style="text-align:center;color:var(--text-muted);font-size:10px;padding:0 8px">${tk('mp.duel_final_goals')||'Goles'}</div><div style="text-align:center;padding:3px 0">${rivalGoalsTotal}</div>
      <div style="text-align:center;padding:3px 0">${avgPoss}%</div><div style="text-align:center;color:var(--text-muted);font-size:10px;padding:0 8px">${tk('mp.duel_possession')||'Posesión media'}</div><div style="text-align:center;padding:3px 0">${100-avgPoss}%</div>
      <div style="text-align:center;padding:3px 0">${myCardsTotal}</div><div style="text-align:center;color:var(--text-muted);font-size:10px;padding:0 8px">${tk('mp.duel_final_cards_short')||'Tarjetas'}</div><div style="text-align:center;padding:3px 0">${rivalCardsTotal}</div>
      <div style="text-align:center;padding:3px 0">${myInjuriesTotal}</div><div style="text-align:center;color:var(--text-muted);font-size:10px;padding:0 8px">${tk('mp.duel_final_injuries_short')||'Lesionados'}</div><div style="text-align:center;padding:3px 0">${rivalInjuriesTotal}</div>
      <div style="text-align:center;padding:3px 0">${cleanSheets}</div><div style="text-align:center;color:var(--text-muted);font-size:10px;padding:0 8px">${tk('mp.duel_final_clean_sheets')||'Porterías a cero'}</div><div style="text-align:center;padding:3px 0">${rivalCleanSheets}</div>
      <div style="text-align:center;padding:3px 0">${myGiroUses}</div><div style="text-align:center;color:var(--text-muted);font-size:10px;padding:0 8px">${tk('giro.final_uses')||'Giros Tácticos usados'}</div><div style="text-align:center;padding:3px 0">${rivalGiroUses}</div>
    </div>

    ${narrative?`<div style="font-size:12px;color:var(--gold);font-style:italic;border-top:1px solid var(--line);margin-top:10px;padding-top:8px">${narrative}</div>`:''}

    <div style="text-align:left;border-top:1px solid var(--line);margin-top:10px;padding-top:8px">
      <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">${tk('mp.duel_final_breakdown')||'Partido a partido'}</div>
      ${rows.join('')}
    </div>

    <button id="duelExitBtn" class="modal-btn" style="width:100%;margin-top:14px">${tk('mp.duel_finish')||'FINALIZAR'}</button>
  `, true);
  const exitBtn=document.getElementById('duelExitBtn');
  if(exitBtn) exitBtn.addEventListener('click', async()=>{
    try{ await db.collection('duels').doc(window._duelId).update({status:'finished'}); }catch(e){}
    mpExitDuelMode();
    location.reload();
  });
}

/* ════════════════════════════════════════════════════════════
   SISTEMA DE DUELOS (Fase 1: invitación y aceptación)
   Colección Firestore: 'duels' — documento por desafío:
   { challengerId, challengerUsername, opponentId, opponentUsername,
     status: 'pending'|'accepted'|'rejected'|'cancelled', createdAt }
   La fase de draft sincronizado y la simulación de partidos se
   implementan en fases posteriores sobre esta base.
   ════════════════════════════════════════════════════════════ */

/* Enviar desafío a un amigo */
/* BOTÓN DE PRUEBAS — reta directo a una tanda de penaltis, sin jugar
   los 5 partidos, para poder testear el sistema de penaltis rápido.
   Quitar el botón (y esta función) cuando ya no haga falta. */
async function mpChallengeFriendPenaltiesTest(targetUid, targetUsername, btnEl){
  playSound('select');
  const auth=window._fbAuth, db=window._fbDb;
  const user=auth&&auth.currentUser;
  if(!user||!db) return;
  if(btnEl) btnEl.disabled=true;
  try{
    const mySnap=await db.collection('users').doc(user.uid).get();
    const myUsername=(mySnap.exists&&(mySnap.data().username||mySnap.data().email))||user.email||'???';
    await db.collection('duels').add({
      challengerId:user.uid, challengerUsername:myUsername,
      opponentId:targetUid, opponentUsername:targetUsername,
      status:'pending', createdAt:Date.now(),
      debugPenaltiesOnly:true
    }).then(ref=>{
      try{ sessionStorage.setItem('g2g_pending_challenge_id', ref.id); }catch(e){}
    });
    showToast('⚽ Reto de penaltis (prueba) enviado a '+(targetUsername||''), 'toast-pos');
  }catch(e){
    console.error('mpChallengeFriendPenaltiesTest error:',e);
    showToast(tk('mp.err_generic'), 'toast-neg');
  }finally{
    if(btnEl) btnEl.disabled=false;
  }
}

async function mpChallengeFriend(targetUid, targetUsername, btnEl){
  playSound('select');
  const auth=window._fbAuth, db=window._fbDb;
  const user=auth&&auth.currentUser;
  if(!user||!db) return;
  if(btnEl) btnEl.disabled=true;
  try{
    // Evitar duplicar un desafío ya pendiente con el mismo rival (un solo where, filtro en JS)
    const mine=await db.collection('duels').where('challengerId','==',user.uid).get();
    const already=mine.docs.some(d=>{const x=d.data();return x.opponentId===targetUid && x.status==='pending';});
    if(already){
      showToast((tk('mp.duel_pending_own')||'Ya tienes un desafío pendiente con {0}').replace('{0}',targetUsername||''), 'toast-neg');
      return;
    }
    const mySnap=await db.collection('users').doc(user.uid).get();
    const myUsername=(mySnap.exists&&(mySnap.data().username||mySnap.data().email))||user.email||'???';
    await db.collection('duels').add({
      challengerId:user.uid, challengerUsername:myUsername,
      opponentId:targetUid, opponentUsername:targetUsername,
      status:'pending', createdAt:Date.now()
    }).then(ref=>{
      try{ sessionStorage.setItem('g2g_pending_challenge_id', ref.id); }catch(e){}
    });
    showToast((tk('mp.duel_sent')||'Desafío enviado a {0}').replace('{0}',targetUsername||''), 'toast-pos');
  }catch(e){
    console.error('mpChallengeFriend error:',e);
    showToast(tk('mp.err_generic'), 'toast-neg');
  }finally{
    if(btnEl) btnEl.disabled=false;
  }
}

/* Cargar desafíos de duelo pendientes recibidos */
async function renderPendingDuels(){
  const auth=window._fbAuth, db=window._fbDb;
  const user=auth&&auth.currentUser;
  const section=$id('mpDuelsSection');
  const list=$id('mpDuelsList');
  if(!user||!db||!section||!list) return;
  try{
    const snap=await db.collection('duels')
      .where('opponentId','==',user.uid).get();
    const pendingDocs=snap.docs.filter(d=>d.data().status==='pending');
    if(!pendingDocs.length){ section.style.display='none'; return; }
    section.style.display='block';
    list.innerHTML='';
    pendingDocs.forEach(doc=>{
      const d=doc.data();
      const row=document.createElement('div');
      row.className='mp-row';
      row.innerHTML=`
        <span class="mp-row-name">${mpEsc(d.challengerUsername||'???')}</span>
        <button class="mp-btn-accept" data-id="${doc.id}">${tk('mp.accept')}</button>
        <button class="mp-btn-reject" data-id="${doc.id}">${tk('mp.reject')}</button>`;
      list.appendChild(row);
    });
    list.querySelectorAll('.mp-btn-accept').forEach(b=>b.addEventListener('click',()=>mpRespondDuel(b.dataset.id,true)));
    list.querySelectorAll('.mp-btn-reject').forEach(b=>b.addEventListener('click',()=>mpRespondDuel(b.dataset.id,false)));
  }catch(e){
    console.error('renderPendingDuels error:',e);
  }
}

/* Aceptar o rechazar un desafío de duelo recibido */
async function mpRespondDuel(docId, accept){
  playSound('select');
  const db=window._fbDb;
  const auth=window._fbAuth;
  const user=auth&&auth.currentUser;
  if(!db||!user) return;
  try{
    if(accept){
      const draftStartAt=Date.now();
      await db.collection('duels').doc(docId).update({status:'accepted', acceptedAt:draftStartAt, draftStartAt});
      const snap=await db.collection('duels').doc(docId).get();
      const d=snap.data();
      mpEnterDuelMode(docId, d, user.uid);
    }else{
      await db.collection('duels').doc(docId).update({status:'rejected'});
    }
  }catch(e){
    console.error('mpRespondDuel error:',e);
    alert(tk('mp.err_generic'));
  }
}

/* ════════════════════════════════════════════════════════════
   DUELO — DRAFT SINCRONIZADO (Fase 2)
   Guarda el duelo activo en sessionStorage y recarga, igual que ya
   hace la Run Encadenada con 'g2g_inherited'. Así el draft arranca
   siempre limpio, sin arrastrar estado de una partida anterior.
   ════════════════════════════════════════════════════════════ */
let _duelTimerInterval=null;
let _duelWatcherUnsub=null;

/* Guarda el duelo en sessionStorage y recarga la página para entrar limpio */
/* Overlay reutilizable para las pantallas del duelo — ahora como un
   popup centrado (mismo estilo que el resto de modales del juego),
   sobre un fondo semitransparente, no una pantalla negra completa. */
function mpShowDuelOverlay(innerHtml, wide){
  let ov=document.getElementById('duelOverlay');
  if(!ov){
    ov=document.createElement('div');
    ov.id='duelOverlay';
    ov.style.cssText='position:fixed;inset:0;z-index:80000;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto';
    document.body.appendChild(ov);
  }
  ov.innerHTML=`<div class="auth-modal" style="${wide?'max-width:560px;':''}text-align:center;overflow-y:auto">${innerHtml}</div>`;
  ov.style.display='flex';
  return ov;
}
function mpHideDuelOverlay(){
  const ov=document.getElementById('duelOverlay');
  if(ov) ov.style.display='none';
}
/* Popup simple de "esperando..." reutilizado en varios puntos del flujo */
function mpShowWaitingPopup(text){
  mpShowDuelOverlay(`
    <i class="ph ph-bold ph-hourglass-medium" style="font-size:28px;color:#7b9cff;display:block;margin-bottom:10px"></i>
    <div style="font-family:'Bebas Neue',Impact,sans-serif;font-size:16px;color:var(--gold);letter-spacing:.5px">${text}</div>`);
}

function mpEnterDuelMode(duelId, duelData, myUid){
  const isChallenger=duelData.challengerId===myUid;
  const info={
    duelId,
    role: isChallenger?'challenger':'opponent',
    opponentUsername: isChallenger?duelData.opponentUsername:duelData.challengerUsername,
    opponentUid: isChallenger?duelData.opponentId:duelData.challengerId,
    draftStartAt: duelData.draftStartAt||Date.now()
  };
  try{ sessionStorage.setItem('g2g_duel_active', JSON.stringify(info)); }catch(e){}
  location.reload();
}

/* Vigila (para el retador) si el rival ha aceptado su desafío saliente,
   incluso con el modal de multijugador cerrado. */
function startDuelWatcher(uid){
  stopDuelWatcher();
  const db=window._fbDb;
  if(!db) return;
  _duelWatcherUnsub=db.collection('duels')
    .where('challengerId','==',uid)
    .onSnapshot(snap=>{
      // Si ya estoy en un duelo activo, no reaccionar (evita bucles de recarga)
      let active=null;
      try{ active=JSON.parse(sessionStorage.getItem('g2g_duel_active')||'null'); }catch(e){}
      if(active) return;
      // Solo reaccionar al desafío que YO envié en esta sesión — evita que duelos
      // antiguos ya aceptados (de pruebas previas) vuelvan a arrastrar al jugador.
      let pendingId=null;
      try{ pendingId=sessionStorage.getItem('g2g_pending_challenge_id'); }catch(e){}
      if(!pendingId) return;
      snap.docChanges().forEach(ch=>{
        if(ch.doc.id!==pendingId) return;
        const d=ch.doc.data();
        if(d.status==='accepted'){
          try{ sessionStorage.removeItem('g2g_pending_challenge_id'); }catch(e){}
          mpEnterDuelMode(ch.doc.id, d, uid);
        }
      });
    }, e=>console.error('startDuelWatcher error:',e));
}
function stopDuelWatcher(){
  if(_duelWatcherUnsub){ _duelWatcherUnsub(); _duelWatcherUnsub=null; }
}

/* Aviso (circulito rojo) en el botón MULTIJUGADOR cuando hay una
   solicitud de amistad o un desafío de duelo pendientes, sin necesidad
   de abrir el modal. Un solo where por consulta, filtro en JS. */
let _mpNotifFriendsUnsub=null, _mpNotifDuelsUnsub=null;
let _mpNotifState={friends:false, duels:false};
function mpUpdateNotifBadge(){
  const badge=document.getElementById('mpNotifBadge');
  if(!badge) return;
  badge.style.display=(_mpNotifState.friends||_mpNotifState.duels)?'block':'none';
}
function startMpNotificationListener(uid){
  stopMpNotificationListener();
  const db=window._fbDb;
  if(!db) return;
  _mpNotifFriendsUnsub=db.collection('friends')
    .where('friendId','==',uid)
    .onSnapshot(snap=>{
      _mpNotifState.friends=snap.docs.some(d=>d.data().status==='pending');
      mpUpdateNotifBadge();
    }, e=>console.error('mpNotif friends error:',e));
  _mpNotifDuelsUnsub=db.collection('duels')
    .where('opponentId','==',uid)
    .onSnapshot(snap=>{
      _mpNotifState.duels=snap.docs.some(d=>d.data().status==='pending');
      mpUpdateNotifBadge();
    }, e=>console.error('mpNotif duels error:',e));
}
function stopMpNotificationListener(){
  if(_mpNotifFriendsUnsub){ _mpNotifFriendsUnsub(); _mpNotifFriendsUnsub=null; }
  if(_mpNotifDuelsUnsub){ _mpNotifDuelsUnsub(); _mpNotifDuelsUnsub=null; }
  _mpNotifState={friends:false, duels:false};
  const badge=document.getElementById('mpNotifBadge');
  if(badge) badge.style.display='none';
}

/* Al cargar la página: si hay un duelo activo en sessionStorage, retomarlo
   consultando su estado real en Firestore (no confiar solo en lo local). */
/* Inactividad en duelo: si un jugador no interactúa con nada durante
   más de 1 minuto mientras el duelo está activo, la partida finaliza
   automáticamente — reutiliza el mismo mecanismo que "abandonar duelo",
   así se integra con cualquier pantalla en la que esté el jugador. */
function startDuelInactivityMonitor(){
  stopDuelInactivityMonitor();
  _duelLastInteraction=Date.now();
  if(!_duelInteractionListenersAttached){
    _duelInteractionListenersAttached=true;
    ['click','touchstart','keydown'].forEach(evt=>{
      document.addEventListener(evt, ()=>{ _duelLastInteraction=Date.now(); }, {passive:true});
    });
  }
  _duelInactivityInterval=setInterval(()=>{
    if(!window._duelId){ stopDuelInactivityMonitor(); return; }
    if(Date.now()-_duelLastInteraction>60000){
      stopDuelInactivityMonitor();
      console.log('[Duelo] finalizado automáticamente por inactividad (más de 1 minuto sin interacción)');
      mpAbandonDuel();
    }
  }, 10000);
}
function stopDuelInactivityMonitor(){
  if(_duelInactivityInterval){ clearInterval(_duelInactivityInterval); _duelInactivityInterval=null; }
}

/* Carga el escudo del rival en un duelo, para que cada jugador aparezca
   con el suyo propio en vez de con el icono genérico. Lectura pública
   del perfil del rival, igual que ya hacemos con sus estadísticas. */
function loadRivalCrestData(uid){
  const db=window._fbDb;
  if(!db||!uid) return Promise.resolve();
  return db.collection('users').doc(uid).get().then(snap=>{
    const data=snap.exists?snap.data():{};
    window._rivalCrestImage=data.customCrestImage||null;
    window._rivalCrestData=window._rivalCrestImage?null:(data.customCrest||null);
    refreshAllCrestThumbs();
  }).catch(e=>console.error('[Escudo] carga del rival falló:', e));
}

async function initDuelModeFromSession(){
  let info=null;
  try{ info=JSON.parse(sessionStorage.getItem('g2g_duel_active')||'null'); }catch(e){}
  if(!info) return;
  window._duelId=info.duelId;
  window._duelRole=info.role;
  window._duelOpponentUsername=info.opponentUsername;
  window._duelDraftDeadline=info.draftStartAt+DUEL_DRAFT_SECONDS*1000;
  if(info.opponentUid) await loadRivalCrestData(info.opponentUid);
  startDuelInactivityMonitor();
  // La pantalla de bienvenida ("EMPEZAR A JUGAR") es obligatoria en cada carga;
  // en modo duelo la saltamos, ya que el jugador ya confirmó explícitamente al
  // aceptar/lanzar el desafío.
  const wo=document.getElementById("welcomeOverlay");
  if(wo) wo.style.display="none";
  // Ocultar elementos de menú irrelevantes en modo duelo
  const mpwQ=document.getElementById("multiplayerWrap");
  if(mpwQ) mpwQ.style.display="none";
  const qb=document.getElementById("quickBuildWrap"); // se sigue usando internamente al agotar el tiempo
  // Comprobar el estado real del duelo para decidir si mostrar el draft o la espera
  try{
    const db=window._fbDb;
    // La sesión de auth puede tardar un instante en estar lista tras el reload
    let tries=0;
    while(!window._fbDb && tries<20){ await new Promise(r=>setTimeout(r,150)); tries++; }
    const snap=await window._fbDb.collection('duels').doc(window._duelId).get();
    if(!snap.exists){ mpExitDuelMode(); return; }
    const d=snap.data();
    const myReadyField=window._duelRole==='challenger'?'challengerReady':'opponentReady';
    window._duelIsPenaltiesOnly = !!d.debugPenaltiesOnly;
    if(!d[myReadyField]){
      if(d.debugPenaltiesOnly){
        // Modo TANDA DE PENALTIS: no hace falta formar equipo — se
        // marca "listo" al instante con una plantilla vacía de relleno.
        await mpMarkReadyPenaltiesOnly();
        return;
      }
      startDuelDraftTimer();
      return;
    }
    if(!d.challengerReady || !d.opponentReady){
      mpShowDuelWaitingScreen();
      return;
    }
    if(d.debugPenaltiesOnly){
      // Botón de pruebas: si se recarga a mitad, volver directo a la
      // tanda de penaltis en vez de intentar retomar un partido normal.
      window._duelMatchIndex=0;
      mpMaybeStartPenalties();
      return;
    }
    // Ambos equipos ya listos: retomar exactamente en el partido/sub-fase
    // correctos, en vez de reiniciar siempre desde el partido 1.
    const idx=d.currentMatchIndex||0;
    window._duelMatchIndex=idx;
    const myStratField=window._duelRole==='challenger'?`m${idx}_challengerStrategy`:`m${idx}_opponentStrategy`;
    if(d[`m${idx}_result`]!==undefined){
      // El resultado de este partido ya se calculó (aplicar la fatiga
      // guardada es seguro repetirlo, no se duplica).
      mpPlayDuelMatchAnimation(d[`m${idx}_result`], d.challengerSquad, d.opponentSquad);
    }else if(d[myStratField]!==undefined){
      // Ya envié mi estrategia para este partido — esperar/calcular el resultado
      mpShowWaitingPopup(`${(tk('mp.duel_match_of')||'PARTIDO {0} DE 5').replace('{0}', String(idx+1))}<br><span style="font-size:12px;font-weight:normal">${tk('mp.duel_waiting_strategy')||'Esperando la estrategia del rival...'}</span>`);
      mpWatchForMatchResult();
    }else{
      // Aún no he elegido estrategia para este partido
      mpShowStrategyAndBenchPhase();
    }
  }catch(e){
    console.error('initDuelModeFromSession error:',e);
    startDuelDraftTimer(); // fallback: mostrar el temporizador igualmente
  }
}

/* Salir de modo duelo (usado ante error o duelo cancelado/inexistente) */
function mpExitDuelMode(){
  try{ sessionStorage.removeItem('g2g_duel_active'); }catch(e){}
  try{ sessionStorage.removeItem('g2g_pending_challenge_id'); }catch(e){}
  window._duelId=null;
  window._rivalCrestData=null;
  if(_duelTimerInterval){ clearInterval(_duelTimerInterval); _duelTimerInterval=null; }
  stopDuelInactivityMonitor();
}

/* Barra de cuenta atrás del draft — visible en todo momento durante el
   draft/banquillo cuando hay un duelo activo. Al agotarse, autocompleta
   con el mismo método que EQUIPO RÁPIDO (quickBuild), sin duplicarlo. */
function startDuelDraftTimer(){
  let bar=document.getElementById('duelDraftTimerBar');
  if(!bar){
    bar=document.createElement('div');
    bar.id='duelDraftTimerBar';
    bar.style.cssText='position:fixed;left:0;right:0;z-index:70000;background:#1a2a3a;border-bottom:2px solid #4a90d9;color:#7ec3ff;text-align:center;padding:6px 10px;font-family:"Bebas Neue",Impact,sans-serif;letter-spacing:1px;font-size:15px;display:flex;align-items:center;justify-content:center;gap:14px';
    const span=document.createElement('span');
    span.id='duelDraftTimerText';
    const exitLink=document.createElement('span');
    exitLink.id='duelDraftExitLink';
    exitLink.textContent=tk('mp.duel_exit')||'ABANDONAR ENCUENTRO';
    exitLink.style.cssText='cursor:pointer;color:#ff7e7e;font-size:12px;border:1px solid #d94a4a;padding:2px 8px;border-radius:3px';
    exitLink.addEventListener('click', mpAbandonDuel);
    bar.appendChild(span);
    bar.appendChild(exitLink);
    document.body.appendChild(bar);
  }
  mpAttachStickyBarScroll('duelDraftTimerBar');
  const textEl=document.getElementById('duelDraftTimerText')||bar;
  bar.style.display='flex';
  const tick=()=>{
    const msLeft=window._duelDraftDeadline-Date.now();
    if(msLeft<=0){
      textEl.textContent=(tk('mp.duel_draft_time_up')||'⏱️ ¡Tiempo agotado! Completando equipo automáticamente...');
      clearInterval(_duelTimerInterval);
      _duelTimerInterval=null;
      if(phase==='draft'||phase==='bench') quickBuild();
      return;
    }
    const s=Math.ceil(msLeft/1000);
    checkCountdownBeep(s, 'duelDraftBar');
    const mm=Math.floor(s/60), ss=s%60;
    textEl.textContent=(tk('mp.duel_draft_time')||'⏱️ Construye tu equipo: {0}:{1}')
      .replace('{0}', String(mm)).replace('{1}', String(ss).padStart(2,'0'));
  };
  tick();
  _duelTimerInterval=setInterval(tick,1000);
}

/* Se ejecuta cuando MI draft/banquillo ha terminado (manual o por tiempo
   agotado). Serializa mi plantilla y la guarda en el duelo. */
/* Modo TANDA DE PENALTIS — marca "listo" al instante, sin pasar por el
   draft, con una plantilla de relleno mínima (no se usa para nada real,
   solo para no dejar el campo vacío en Firestore). */
async function mpMarkReadyPenaltiesOnly(){
  const db=window._fbDb;
  if(!db||!window._duelId) return;
  const readyField=window._duelRole==='challenger'?'challengerReady':'opponentReady';
  const squadField=window._duelRole==='challenger'?'challengerSquad':'opponentSquad';
  try{
    await db.collection('duels').doc(window._duelId).update({
      [squadField]: {placeholder:true},
      [readyField]: true
    });
  }catch(e){ console.error('mpMarkReadyPenaltiesOnly error:',e); }
  mpShowDuelWaitingScreen();
}

async function mpOnDraftComplete(){
  if(_duelTimerInterval){ clearInterval(_duelTimerInterval); _duelTimerInterval=null; }
  const bar=document.getElementById('duelDraftTimerBar');
  if(bar) bar.style.display='none';
  mpDetachStickyBarScroll('duelDraftTimerBar');
  // En modo duelo startMatchPhase() no se ejecuta, así que este botón no
  // se oculta por el camino normal — lo ocultamos aquí explícitamente.
  const qb=document.getElementById("quickBuildWrap");
  if(qb) qb.style.display="none";
  const db=window._fbDb;
  if(!db||!window._duelId) return;
  const squad={
    pitch: usedPlayers.map(p=>({name:p.name, rating:p.rating, positions:p.positions, placedPos:p.placedPos, fatigue:(p.fatigue===undefined?100:p.fatigue)})),
    bench: bench.map(p=>({name:p.name, rating:p.rating, positions:p.positions})),
    formation: currentFormation,
    teamOVR: typeof baseTeamOVR!=='undefined'?baseTeamOVR:computeTeamOVR(),
    // Foto del perfil táctico real (attack/defense/pace/passing/technique),
    // ya calculado a partir de las selecciones históricas fichadas + formación.
    // Se usará tal cual como perfil del rival real en los partidos del duelo.
    teamStats:{...teamStats},
    // Foto de moral y racha en el momento de terminar el equipo — se
    // actualizarán partido a partido con las mismas fórmulas que en solitario.
    // La racha es por jugador (scorerStreaks), no un número único de equipo.
    teamMorale: (typeof teamMorale!=='undefined')?teamMorale:0,
    scorerStreaks: usedPlayers.reduce((acc,p)=>{ if(scorerStreaks[p.name]) acc[p.name]=scorerStreaks[p.name]; return acc; },{}),
    skills: window._skillCache?{...window._skillCache}:{}
  };
  const readyField=window._duelRole==='challenger'?'challengerReady':'opponentReady';
  const squadField=window._duelRole==='challenger'?'challengerSquad':'opponentSquad';
  try{
    await db.collection('duels').doc(window._duelId).update({
      [squadField]: squad,
      [readyField]: true
    });
  }catch(e){
    console.error('mpOnDraftComplete error:',e);
  }
  mpShowDuelWaitingScreen();
}

/* Pantalla de espera mientras el rival termina su equipo. Escucha el
   duelo en tiempo real; cuando ambos están listos, Fase 3 (motor de
   partidos) tomará el relevo desde aquí. */
function mpShowDuelWaitingScreen(){
  mpShowDuelOverlay(`
    <i class="ph ph-bold ph-users" style="font-size:34px;color:#7b9cff;display:block;margin-bottom:10px"></i>
    <div style="font-family:'Bebas Neue',Impact,sans-serif;font-size:17px;letter-spacing:.5px;margin-bottom:16px" id="duelWaitingText">${tk('mp.duel_waiting')||'Esperando a que tu rival termine su equipo...'}</div>
    <button id="duelExitBtn" style="width:100%;padding:10px 22px;background:#3a1a1a;border:1px solid #d94a4a;color:#ff7e7e;font-family:'Bebas Neue',Impact,sans-serif;font-size:13px;letter-spacing:1px;border-radius:4px;cursor:pointer">${tk('mp.duel_exit')||'ABANDONAR ENCUENTRO'}</button>`);
  const exitBtn=document.getElementById('duelExitBtn');
  if(exitBtn) exitBtn.addEventListener('click', mpAbandonDuel);
  const db=window._fbDb;
  if(!db||!window._duelId) return;
  const unsub=db.collection('duels').doc(window._duelId).onSnapshot(snap=>{
    const d=snap.data();
    if(!d) return;
    if(d.status==='cancelled'){
      // El rival ha salido del duelo — liberar y volver al juego normal
      unsub();
      mpExitDuelMode();
      location.reload();
      return;
    }
    if(d.challengerReady && d.opponentReady){
      if(window._duelMatchesStarted) return; // evita disparar dos veces
      window._duelMatchesStarted=true;
      unsub();
      mpHideDuelOverlay(); // si no, se queda tapando la rueda de prensa/estrategia
      window._duelMatchIndex=0;
      if(d.debugPenaltiesOnly){
        // Botón de pruebas: saltar directo a la tanda de penaltis, sin
        // jugar los 5 partidos. Solo para testear el propio sistema de
        // penaltis rápido — quitar cuando ya no haga falta.
        mpMaybeStartPenalties();
        return;
      }
      mpShowStrategyAndBenchPhase();
      return;
    }
  }, e=>console.error('mpShowDuelWaitingScreen error:',e));
}

/* Salir voluntariamente de un duelo (desde la pantalla de espera).
   Marca el duelo como cancelado para que el rival también salga. */
function mpAbandonDuel(){
  showConfirmPopup(
    '¿Abandonar el duelo? Se perderá el progreso de este encuentro.',
    ()=>mpAbandonDuelConfirmed()
  );
}
async function mpAbandonDuelConfirmed(){
  playSound('select');
  const db=window._fbDb;
  if(db&&window._duelId){
    try{ await db.collection('duels').doc(window._duelId).update({status:'cancelled'}); }
    catch(e){ console.error('mpAbandonDuel error:',e); }
  }
  mpExitDuelMode();
  location.reload();
}

// Wiring directo (sin depender de DOMContentLoaded, que ya puede haberse disparado
// para cuando este script se ejecuta vía document.write con cache-busting)
(function(){
  const mpBtn=document.getElementById('multiplayerBtn');
  if(mpBtn) mpBtn.addEventListener('click', window.openMpOverlay);
  const addBtn=document.getElementById('mpAddFriendBtn');
  if(addBtn) addBtn.addEventListener('click', mpAddFriend);
  const input=document.getElementById('mpFriendInput');
  if(input) input.addEventListener('keydown', e=>{ if(e.key==='Enter') mpAddFriend(); });
})();
// Delegación de respaldo: garantiza el click incluso si el listener directo
// no llegó a engancharse a tiempo (timing de carga del script).
document.addEventListener('click', e=>{
  if(e.target && e.target.id==='multiplayerBtn') window.openMpOverlay();
});

/* Si hay un duelo multijugador activo en sessionStorage, retomarlo —
   esto tiene que ejecutarse aquí (no en game.js) porque depende de
   funciones definidas en este mismo archivo. No interfiere con el
   modo un jugador si no hay duelo activo. */
initDuelModeFromSession();
