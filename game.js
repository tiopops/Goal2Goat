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
   <td><button class="pick-btn" onclick='selectPlayer(${JSON.stringify(player).replace(/'/g,"&#39;")})'>Elegir</button></td>
  </tr>`;
 });

 playerCard.innerHTML = `
 <div class="selection-overlay">
  <div class="selection-modal roster-modal">
   <div class="selection-title">${team.name}</div>
   <table class="roster-table">
    <thead><tr><th>#</th><th>Jugador</th><th>Posiciones</th><th>OVR</th><th></th></tr></thead>
    <tbody>${rows}</tbody>
   </table>
  </div>
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

  usedPlayers.push(selectedPlayer.name);
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
