const teams = [
{
    name:"España 2010",
    flag:"es",
    style:"Tiki-Taka",
    bonuses:{ passing:8, technique:6 },
    players:[
        {name:"Casillas",positions:["POR"],rating:89},
        {name:"Puyol",positions:["DFC","LD"],rating:88},
        {name:"Piqué",positions:["DFC"],rating:86},
        {name:"Busquets",positions:["MC"]},
        {name:"Xavi",positions:["MC"],rating:92},
        {name:"Iniesta",positions:["MC","EI"],rating:92},
        {name:"Villa",positions:["DC","EI"],rating:89},
        {name:"Torres",positions:["DC"],rating:86}
    ]
},
{
    name:"Italia 2006",
    flag:"it",
    style:"Catenaccio",
    bonuses:{ defense:12 },
    players:[
        {name:"Buffon",positions:["POR"]},
        {name:"Cannavaro",positions:["DFC"]},
        {name:"Pirlo",positions:["MC"]},
        {name:"Gattuso",positions:["MC"]},
        {name:"Totti",positions:["DC","MC"]},
        {name:"Del Piero",positions:["DC"]}
    ]
},
{
    name:"Brasil 1970",
    flag:"br",
    style:"Jogo Bonito",
    bonuses:{ attack:8, technique:10 },
    players:[
        {name:"Pelé",positions:["DC","MC"]},
        {name:"Jairzinho",positions:["ED","DC"]},
        {name:"Tostão",positions:["DC"]},
        {name:"Rivelino",positions:["MC","EI"]},
        {name:"Carlos Alberto",positions:["LD"]}
    ]
},
{
    name:"Alemania 2014",
    flag:"de",
    style:"Máquina Alemana",
    bonuses:{ attack:5, defense:5 },
    players:[
        {name:"Neuer",positions:["POR"]},
        {name:"Lahm",positions:["LD","MC"]},
        {name:"Kroos",positions:["MC"]},
        {name:"Müller",positions:["DC","ED"]},
        {name:"Götze",positions:["MC","DC"]}
    ]
}
];

const teamStats = { attack:0, defense:0, pace:0, passing:0, technique:0 };
let selectedPlayer = null;
const usedTeams = [];
const usedPlayers = [];
let draftedPlayers = 0;

const rollBtn = document.getElementById("rollBtn");
const playerCard = document.getElementById("playerCard");

rollBtn.addEventListener("click", rollTeams);

updateStats();
updateDraftCounter();

function updateDraftCounter(){
 document.getElementById("draftCounter").textContent = draftedPlayers + " / 11";
}


function rollTeams(){
 if(draftedPlayers >= 11) return;
 const availableTeams = teams.filter(t => !usedTeams.includes(t.name));
 if(availableTeams.length < 2){
   playerCard.innerHTML="<div class='player-card'>No quedan selecciones.</div>";
   return;
 }
 const first = availableTeams[Math.floor(Math.random()*availableTeams.length)];
 let second;
 do{
   second = availableTeams[Math.floor(Math.random()*availableTeams.length)];
 }while(second.name===first.name);

 playerCard.innerHTML=`
<div class="selection-overlay">
 <div class="selection-modal">
  <div class="selection-title">ELIGE UNA SELECCIÓN</div>
  <div class="team-choice">
   <div class="team-option" onclick="selectTeam('${first.name}')">
    <img src="assets/flags/${first.flag}.png">
    <h3>${first.name}</h3>
    <p>${first.style}</p>
    ${renderBonuses(first)}
   </div>
   <div class="team-option" onclick="selectTeam('${second.name}')">
    <img src="assets/flags/${second.flag}.png">
    <h3>${second.name}</h3>
    <p>${second.style}</p>
    ${renderBonuses(second)}
   </div>
  </div>
 </div>
</div>`; 
}

function renderTeamCard(team){
 return `
 <div class="team-option roguelike-card" onclick="selectTeam('${team.name}')">
   <img class="team-flag" src="assets/flags/${team.flag}.png">
   <h3>${team.name}</h3>
   <div class="team-style">${team.style}</div>
   <div class="bonus-list">${renderBonuses(team)}</div>
   <div class="team-count">${team.players.length} jugadores</div>
 </div>`;
}

function renderBonuses(team){
 let html="";
 for(let stat in team.bonuses){
   html += `<div class="bonus-line">${stat.toUpperCase()} +${team.bonuses[stat]}</div>`;
 }
 return html;
}


function selectTeam(teamName){
 const team = teams.find(t=>t.name===teamName);
 usedTeams.push(team.name);
 const styleEl=document.getElementById("teamStyle");
 if(styleEl) styleEl.textContent=team.style;
 applyBonuses(team);

 let rows="";
 team.players.forEach((player,index)=>{
  if(usedPlayers.includes(player.name)) return;
  rows += `<tr>
   <td>${index+1}</td>
   <td>${player.name}</td>
   <td>${player.positions.join(" / ")}</td>
   <td>${player.rating || 80}</td>
   <td><button class="pick-btn" 
onmouseover='highlightPlayerPositions(${JSON.stringify(player.positions)})'
onmouseout='clearHighlights()'
onclick='selectPlayer(${JSON.stringify(player).replace(/'/g,"&#39;")})'>Elegir</button></td>
  </tr>`;
 });

 playerCard.innerHTML = `
  <div class="roster-modal">
   <div class="selection-title">ELIGE UN JUGADOR · ${team.name}</div>
   <table class="roster-table">
    <thead><tr><th>#</th><th>Jugador</th><th>Posiciones</th><th>ESTADÍSTICAS</th><th></th></tr></thead>
    <tbody>${rows}</tbody>
   </table>
  </div>`;
}


function selectPlayer(player){
 selectedPlayer=player; playerCard.innerHTML='';
 document.querySelectorAll(".position").forEach(pos=>{
  if(pos.classList.contains("locked")) return;
  pos.style.borderColor="rgba(255,255,255,.65)";
  pos.style.boxShadow="none";
 });
 player.positions.forEach(position=>{
  document.querySelectorAll(".position").forEach(slot=>{
   if(slot.classList.contains("locked")) return;
   if(slot.textContent.trim()===position){
    slot.style.borderColor="#ffd700";
    slot.style.boxShadow="0 0 15px #ffd700";
   }
  });
 });
}

function applyBonuses(team){
 for(let stat in team.bonuses){ teamStats[stat]+=team.bonuses[stat]; }
 updateStats();
}

function updateStats(){
 ["attack","defense","pace","passing","technique"].forEach(k=>{
  const v=document.getElementById(k+"Value");
  const b=document.getElementById(k+"Bar");
  if(v) v.textContent=teamStats[k];
  if(b) b.style.width=teamStats[k]+"%";
 });
}

document.querySelectorAll(".position").forEach(slot=>{
 slot.addEventListener("click",()=>{
  if(!selectedPlayer) return;
  if(slot.classList.contains("locked")) return;
  const slotName=slot.textContent.trim();
  if(!selectedPlayer.positions.includes(slotName)) return;

  slot.innerHTML=selectedPlayer.name;
  slot.style.fontSize="10px";
  slot.classList.add("locked");

  usedPlayers.push(selectedPlayer);
  draftedPlayers++;
  updateDraftCounter();

  selectedPlayer=null;
  document.querySelectorAll(".position").forEach(pos=>{
   pos.style.borderColor="rgba(255,255,255,.65)";
   pos.style.boxShadow="none";
  });

  playerCard.innerHTML="";

  if(draftedPlayers>=11){
   rollBtn.disabled=true;
   rollBtn.textContent="EQUIPO COMPLETADO";
  }
 });
});


function clearHighlights(){
    document.querySelectorAll(".position").forEach(slot=>{
        if(!slot.classList.contains("locked")){
            slot.style.borderColor="rgba(255,255,255,.65)";
            slot.style.boxShadow="none";
        }
    });
}

function highlightPlayerPositions(positions){
    clearHighlights();
    document.querySelectorAll(".position").forEach(slot=>{
        const name = slot.textContent.trim();
        if(!slot.classList.contains("locked") && positions.includes(name)){
            slot.style.borderColor="#ffd700";
            slot.style.boxShadow="0 0 15px #ffd700";
        }
    });
}


function updateConvocadosTable(){
 const el=document.getElementById('convocadosTable');
 if(!el) return;
 const rows=usedPlayers.map((p,i)=>`<tr><td>${i+1}</td><td>${p.name}</td><td><span class="star">★</span>${p.positions[0]}</td><td>${p.rating||0}</td></tr>`).join('');
 el.innerHTML=`<table><tr><th>#</th><th>Jugador</th><th>Pos</th><th>ESTADÍSTICAS</th></tr>${rows}</table>`;
 const avg=usedPlayers.length?Math.round(usedPlayers.reduce((a,b)=>a+(b.rating||0),0)/usedPlayers.length):0;
 const o=document.getElementById('teamOVR')||document.getElementById('teamESTADÍSTICAS'); if(o) o.textContent=avg;
}
const _oldDraft=updateDraftCounter;
updateDraftCounter=function(){_oldDraft();updateConvocadosTable();}

// extra enhancements
function refreshESTADÍSTICAS(){const avg=usedPlayers.length?Math.round(usedPlayers.reduce((s,p)=>s+(p.rating||80),0)/usedPlayers.length):0;const e=document.getElementById('teamESTADÍSTICAS');if(e)e.textContent=avg;}
const _u=updateDraftCounter;updateDraftCounter=function(){_u();refreshESTADÍSTICAS();updateConvocadosTable&&updateConvocadosTable();}


// Goal2Goat FM upgrade
function refreshConvocadosFM(){
 const t=document.getElementById('convocadosTable');
 if(!t || typeof usedPlayers==='undefined') return;
 let rows='';
 usedPlayers.forEach((p,i)=>{
   const pos=(p.positions&&p.positions.length)?p.positions[0]:'--';
   const sec=(p.positions&&p.positions.length>1)?p.positions.slice(1).join(', '):'';
   rows += `<tr data-pos="${pos}"><td>${i+1}</td><td>${p.name||''}</td><td class="pos-main">${pos}★</td><td>${sec}</td><td>${p.rating||0}</td></tr>`;
 });
 t.innerHTML=`<table><tr><th>#</th><th>Jugador</th><th>Pos</th><th>Sec.</th><th>EST</th></tr>${rows}</table>`;

 t.querySelectorAll('tr[data-pos]').forEach(r=>{
   r.addEventListener('mouseenter',()=>{
      document.querySelectorAll('[data-position]').forEach(el=>{
        if(el.dataset.position===r.dataset.pos){ el.classList.add('player-flash'); }
      });
   });
 });
}
setInterval(refreshConvocadosFM,1000);


let G2G_PLAYERS=[];
let G2G_TEAMS=[];

async function loadGoal2GoatData(){
 try{
   const [p,t]=await Promise.all([
     fetch('data/players.json').then(r=>r.json()),
     fetch('data/teams.json').then(r=>r.json())
   ]);
   G2G_PLAYERS=p;
   G2G_TEAMS=t;
   console.log('Goal2Goat data loaded', G2G_PLAYERS.length, G2G_TEAMS.length);
 }catch(e){
   console.error('Error loading Goal2Goat data',e);
 }
}
loadGoal2GoatData();
