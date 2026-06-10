const teams = [
{
    name:"España 2010",
    style:"Tiki-Taka",
    bonuses:{ passing:8, technique:6 },
    players:[
        {name:"Casillas",positions:["POR"]},
        {name:"Puyol",positions:["DFC","LD"]},
        {name:"Piqué",positions:["DFC"]},
        {name:"Busquets",positions:["MC"]},
        {name:"Xavi",positions:["MC"]},
        {name:"Iniesta",positions:["MC","EI"]},
        {name:"Villa",positions:["DC","EI"]},
        {name:"Torres",positions:["DC"]}
    ]
},
{
    name:"Italia 2006",
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
 <div class="team-choice">
  <div class="team-option" onclick="selectTeam('${first.name}')">
   <h3>${first.name}</h3><p>${first.style}</p>${renderBonuses(first)}
  </div>
  <div class="team-option" onclick="selectTeam('${second.name}')">
   <h3>${second.name}</h3><p>${second.style}</p>${renderBonuses(second)}
  </div>
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

 let html=`<div class="team-roster"><h3>${team.name}</h3><p>${team.style}</p>`;
 team.players.forEach(player=>{
  if(usedPlayers.includes(player.name)) return;
  html += `<button class="player-select" onclick='selectPlayer(${JSON.stringify(player)})'>${player.name}</button>`;
 });
 html += `</div>`;
 playerCard.innerHTML=html;
}

function selectPlayer(player){
 selectedPlayer=player;
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
