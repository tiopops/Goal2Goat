

function flagAsset(name){
const n=name.toLowerCase();
// Special non-ISO flags (England/Scotland/Wales, historical countries)
const special={
'inglaterra':'gb-eng','escocia':'gb-sct','gales':'gb-wls',
'yugoslavia':'rs','checoslovaquia':'cz'
};
for(const k in special){ if(n.includes(k)) return special[k]; }
const map={
'españa':'es','brasil':'br','francia':'fr','alemania':'de',
'polonia':'pl','croacia':'hr','serbia':'rs',
'holanda':'nl','argentina':'ar','italia':'it',
'portugal':'pt','uruguay':'uy','bélgica':'be','belgica':'be',
'austria':'at','camerún':'cm','camerun':'cm',
'chile':'cl','colombia':'co',
'dinamarca':'dk','corea del sur':'kr','estados unidos':'us',
'grecia':'gr','hungría':'hu','hungria':'hu',
'irlanda':'ie','japón':'jp','japon':'jp','marruecos':'ma',
'méxico':'mx','mexico':'mx','nigeria':'ng','noruega':'no',
'paraguay':'py','perú':'pe','peru':'pe','rumanía':'ro','rumania':'ro',
'rusia':'ru','suecia':'se','suiza':'ch','turquía':'tr','turquia':'tr',
'ucrania':'ua','senegal':'sn','costa rica':'cr','ghana':'gh'
};
for (const k in map){ if(n.includes(k)) return map[k]; }
return 'un';
}

function flagEmoji(name, size){
  const cc = flagAsset(name);
  const w = size||40;
  return `<img class="flag-emoji" src="https://flagcdn.com/w80/${cc}.png" srcset="https://flagcdn.com/w160/${cc}.png 2x" alt="${name}" title="${name}" style="width:${w}px;height:auto;display:inline-block;vertical-align:middle;border-radius:2px;box-shadow:0 0 0 1px rgba(0,0,0,.1)">`;
}

let playersDB = [{"id": "p_1_0", "name": "Iker Casillas", "positions": ["POR"], "overall": 91}, {"id": "p_1_1", "name": "Sergio Ramos", "positions": ["DFC"], "overall": 86}, {"id": "p_1_2", "name": "Gerard Piqué", "positions": ["DFC"], "overall": 86}, {"id": "p_1_3", "name": "Carles Puyol", "positions": ["DFC"], "overall": 85}, {"id": "p_1_4", "name": "Joan Capdevila", "positions": ["LI", "DFC"], "overall": 80}, {"id": "p_1_5", "name": "Álvaro Arbeloa", "positions": ["LD", "DFC"], "overall": 78}, {"id": "p_1_6", "name": "Xavi Hernández", "positions": ["MC"], "overall": 92}, {"id": "p_1_7", "name": "Andrés Iniesta", "positions": ["MC"], "overall": 93}, {"id": "p_1_8", "name": "Sergio Busquets", "positions": ["MC"], "overall": 83}, {"id": "p_1_9", "name": "Xabi Alonso", "positions": ["MC"], "overall": 87}, {"id": "p_1_10", "name": "Pedro Rodríguez", "positions": ["EI", "ED"], "overall": 84}, {"id": "p_1_11", "name": "David Silva", "positions": ["ED", "EI"], "overall": 87}, {"id": "p_1_12", "name": "David Villa", "positions": ["DC"], "overall": 91}, {"id": "p_1_13", "name": "Fernando Torres", "positions": ["DC"], "overall": 85}, {"id": "p_1_14", "name": "Cesc Fàbregas", "positions": ["DC", "EI"], "overall": 86}, {"id": "p_1_15", "name": "Jesús Navas", "positions": ["ED", "EI"], "overall": 78}, {"id": "p_2_0", "name": "Iker Casillas", "positions": ["POR"], "overall": 90}, {"id": "p_2_1", "name": "Gerard Piqué", "positions": ["DFC"], "overall": 87}, {"id": "p_2_2", "name": "Sergio Ramos", "positions": ["DFC"], "overall": 87}, {"id": "p_2_3", "name": "Carles Puyol", "positions": ["DFC"], "overall": 85}, {"id": "p_2_4", "name": "Jordi Alba", "positions": ["LI", "DFC"], "overall": 84}, {"id": "p_2_5", "name": "Álvaro Arbeloa", "positions": ["LD", "DFC"], "overall": 79}, {"id": "p_2_6", "name": "Xavi Hernández", "positions": ["MC"], "overall": 91}, {"id": "p_2_7", "name": "Andrés Iniesta", "positions": ["MC"], "overall": 93}, {"id": "p_2_8", "name": "Sergio Busquets", "positions": ["MC"], "overall": 85}, {"id": "p_2_9", "name": "Xabi Alonso", "positions": ["MC"], "overall": 88}, {"id": "p_2_10", "name": "David Silva", "positions": ["EI", "ED"], "overall": 88}, {"id": "p_2_11", "name": "Jesús Navas", "positions": ["ED", "EI"], "overall": 79}, {"id": "p_2_12", "name": "Fernando Torres", "positions": ["DC"], "overall": 84}, {"id": "p_2_13", "name": "Cesc Fàbregas", "positions": ["DC"], "overall": 87}, {"id": "p_2_14", "name": "Pedro Rodríguez", "positions": ["DC", "EI"], "overall": 83}, {"id": "p_2_15", "name": "David Villa", "positions": ["DC", "ED"], "overall": 88}, {"id": "p_4_0", "name": "Marcos", "positions": ["POR"], "overall": 85}, {"id": "p_4_1", "name": "Lúcio", "positions": ["DFC"], "overall": 86}, {"id": "p_4_2", "name": "Roque Júnior", "positions": ["DFC"], "overall": 78}, {"id": "p_4_3", "name": "Edmílson", "positions": ["DFC"], "overall": 82}, {"id": "p_4_4", "name": "Roberto Carlos", "positions": ["LI", "DFC"], "overall": 90}, {"id": "p_4_5", "name": "Cafu", "positions": ["LD", "DFC"], "overall": 89}, {"id": "p_4_6", "name": "Gilberto Silva", "positions": ["MC"], "overall": 85}, {"id": "p_4_7", "name": "Kléberson", "positions": ["MC"], "overall": 80}, {"id": "p_4_8", "name": "Ronaldinho", "positions": ["EI", "ED"], "overall": 92}, {"id": "p_4_9", "name": "Rivaldo", "positions": ["ED", "EI"], "overall": 91}, {"id": "p_4_10", "name": "Ronaldo Nazário", "positions": ["DC"], "overall": 97}, {"id": "p_4_11", "name": "Edmundo", "positions": ["DC"], "overall": 78}, {"id": "p_4_12", "name": "Luizão", "positions": ["DC", "EI"], "overall": 76}, {"id": "p_4_13", "name": "Denílson", "positions": ["DC", "ED"], "overall": 79}, {"id": "p_4_14", "name": "Juninho Paulista", "positions": ["MC"], "overall": 79}, {"id": "p_4_15", "name": "Edílson", "positions": ["MC"], "overall": 76}, {"id": "p_6_0", "name": "Bodo Illgner", "positions": ["POR"], "overall": 84}, {"id": "p_6_1", "name": "Jürgen Kohler", "positions": ["DFC"], "overall": 86}, {"id": "p_6_2", "name": "Guido Buchwald", "positions": ["DFC"], "overall": 84}, {"id": "p_6_3", "name": "Klaus Augenthaler", "positions": ["DFC"], "overall": 82}, {"id": "p_6_4", "name": "Andreas Brehme", "positions": ["LI", "DFC"], "overall": 87}, {"id": "p_6_5", "name": "Stefan Reuter", "positions": ["LD", "DFC"], "overall": 80}, {"id": "p_6_6", "name": "Lothar Matthäus", "positions": ["MC"], "overall": 93}, {"id": "p_6_7", "name": "Thomas Häßler", "positions": ["MC"], "overall": 85}, {"id": "p_6_8", "name": "Olaf Thon", "positions": ["MC"], "overall": 80}, {"id": "p_6_9", "name": "Pierre Littbarski", "positions": ["MC"], "overall": 81}, {"id": "p_6_10", "name": "Jürgen Klinsmann", "positions": ["EI", "ED"], "overall": 92}, {"id": "p_6_11", "name": "Rudi Völler", "positions": ["ED", "EI"], "overall": 88}, {"id": "p_6_12", "name": "Karl-Heinz Riedle", "positions": ["DC"], "overall": 78}, {"id": "p_6_13", "name": "Uwe Bein", "positions": ["DC"], "overall": 76}, {"id": "p_6_14", "name": "Frank Mill", "positions": ["DC", "EI"], "overall": 74}, {"id": "p_6_15", "name": "Thomas Berthold", "positions": ["DFC", "MC"], "overall": 80}, {"id": "p_7_0", "name": "Manuel Neuer", "positions": ["POR"], "overall": 93}, {"id": "p_7_1", "name": "Mats Hummels", "positions": ["DFC"], "overall": 87}, {"id": "p_7_2", "name": "Jérôme Boateng", "positions": ["DFC"], "overall": 86}, {"id": "p_7_3", "name": "Per Mertesacker", "positions": ["DFC"], "overall": 83}, {"id": "p_7_4", "name": "Benedikt Höwedes", "positions": ["LI", "DFC"], "overall": 81}, {"id": "p_7_5", "name": "Philipp Lahm", "positions": ["LD", "DFC"], "overall": 89}, {"id": "p_7_6", "name": "Bastian Schweinsteiger", "positions": ["MC"], "overall": 88}, {"id": "p_7_7", "name": "Toni Kroos", "positions": ["MC"], "overall": 89}, {"id": "p_7_8", "name": "Sami Khedira", "positions": ["MC"], "overall": 84}, {"id": "p_7_9", "name": "Mesut Özil", "positions": ["EI", "ED"], "overall": 88}, {"id": "p_7_10", "name": "Thomas Müller", "positions": ["ED", "EI"], "overall": 89}, {"id": "p_7_11", "name": "Miroslav Klose", "positions": ["DC"], "overall": 87}, {"id": "p_7_12", "name": "André Schürrle", "positions": ["DC"], "overall": 82}, {"id": "p_7_13", "name": "Mario Götze", "positions": ["DC", "EI"], "overall": 85}, {"id": "p_7_14", "name": "Lukas Podolski", "positions": ["DC", "ED"], "overall": 81}, {"id": "p_7_15", "name": "Christoph Kramer", "positions": ["MC"], "overall": 76}, {"id": "p_8_0", "name": "Nery Pumpido", "positions": ["POR"], "overall": 80}, {"id": "p_8_1", "name": "Oscar Ruggeri", "positions": ["DFC"], "overall": 84}, {"id": "p_8_2", "name": "José Luis Brown", "positions": ["DFC"], "overall": 81}, {"id": "p_8_3", "name": "Néstor Clausen", "positions": ["DFC"], "overall": 76}, {"id": "p_8_4", "name": "Julio Olarticoechea", "positions": ["LI", "DFC"], "overall": 79}, {"id": "p_8_5", "name": "José Luis Cuciuffo", "positions": ["LD", "DFC"], "overall": 78}, {"id": "p_8_6", "name": "Diego Armando Maradona", "positions": ["EI", "MC"], "overall": 98}, {"id": "p_8_7", "name": "Jorge Burruchaga", "positions": ["MC"], "overall": 84}, {"id": "p_8_8", "name": "Sergio Batista", "positions": ["MC"], "overall": 80}, {"id": "p_8_9", "name": "Ricardo Giusti", "positions": ["MC"], "overall": 78}, {"id": "p_8_10", "name": "Jorge Valdano", "positions": ["EI", "ED"], "overall": 86}, {"id": "p_8_11", "name": "Héctor Enrique", "positions": ["MC"], "overall": 76}, {"id": "p_8_12", "name": "Claudio Borghi", "positions": ["MC"], "overall": 76}, {"id": "p_8_13", "name": "Ramón Díaz", "positions": ["DC"], "overall": 78}, {"id": "p_8_14", "name": "Pedro Pasculli", "positions": ["DC"], "overall": 75}, {"id": "p_8_15", "name": "Marcelo Trobbiani", "positions": ["ED", "EI"], "overall": 73}, {"id": "p_9_0", "name": "Emiliano Martínez", "positions": ["POR"], "overall": 88}, {"id": "p_9_1", "name": "Cristian Romero", "positions": ["DFC"], "overall": 85}, {"id": "p_9_2", "name": "Nicolás Otamendi", "positions": ["DFC"], "overall": 82}, {"id": "p_9_3", "name": "Lisandro Martínez", "positions": ["DFC"], "overall": 84}, {"id": "p_9_4", "name": "Nicolás Tagliafico", "positions": ["LI", "DFC"], "overall": 81}, {"id": "p_9_5", "name": "Nahuel Molina", "positions": ["LD", "DFC"], "overall": 80}, {"id": "p_9_6", "name": "Rodrigo De Paul", "positions": ["MC"], "overall": 84}, {"id": "p_9_7", "name": "Enzo Fernández", "positions": ["MC"], "overall": 85}, {"id": "p_9_8", "name": "Alexis Mac Allister", "positions": ["MC"], "overall": 83}, {"id": "p_9_9", "name": "Ángel Di María", "positions": ["EI", "ED"], "overall": 86}, {"id": "p_9_10", "name": "Julián Álvarez", "positions": ["DC", "EI"], "overall": 86}, {"id": "p_9_11", "name": "Lionel Messi", "positions": ["EI", "DC"], "overall": 97}, {"id": "p_9_12", "name": "Lautaro Martínez", "positions": ["DC"], "overall": 86}, {"id": "p_9_13", "name": "Paulo Dybala", "positions": ["DC", "EI"], "overall": 82}, {"id": "p_9_14", "name": "Leandro Paredes", "positions": ["MC"], "overall": 78}, {"id": "p_9_15", "name": "Alejandro Gómez", "positions": ["DC", "ED"], "overall": 77}, {"id": "p_10_0", "name": "Fabien Barthez", "positions": ["POR"], "overall": 87}, {"id": "p_10_1", "name": "Laurent Blanc", "positions": ["DFC"], "overall": 86}, {"id": "p_10_2", "name": "Marcel Desailly", "positions": ["DFC"], "overall": 88}, {"id": "p_10_3", "name": "Lilian Thuram", "positions": ["DFC"], "overall": 87}, {"id": "p_10_4", "name": "Bixente Lizarazu", "positions": ["LI", "DFC"], "overall": 85}, {"id": "p_10_5", "name": "Christian Karembeu", "positions": ["LD", "DFC"], "overall": 79}, {"id": "p_10_6", "name": "Didier Deschamps", "positions": ["MC"], "overall": 84}, {"id": "p_10_7", "name": "Emmanuel Petit", "positions": ["MC"], "overall": 85}, {"id": "p_10_8", "name": "Youri Djorkaeff", "positions": ["MC"], "overall": 86}, {"id": "p_10_9", "name": "Zinedine Zidane", "positions": ["MC", "EI"], "overall": 94}, {"id": "p_10_10", "name": "Thierry Henry", "positions": ["EI", "ED"], "overall": 88}, {"id": "p_10_11", "name": "Robert Pirès", "positions": ["ED", "EI"], "overall": 84}, {"id": "p_10_12", "name": "David Trezeguet", "positions": ["DC"], "overall": 84}, {"id": "p_10_13", "name": "Christophe Dugarry", "positions": ["DC"], "overall": 79}, {"id": "p_10_14", "name": "Patrick Vieira", "positions": ["MC"], "overall": 86}, {"id": "p_10_15", "name": "Stéphane Guivarc'h", "positions": ["DC"], "overall": 76}, {"id": "p_11_0", "name": "Hugo Lloris", "positions": ["POR"], "overall": 87}, {"id": "p_11_1", "name": "Raphaël Varane", "positions": ["DFC"], "overall": 88}, {"id": "p_11_2", "name": "Samuel Umtiti", "positions": ["DFC"], "overall": 82}, {"id": "p_11_3", "name": "Lucas Hernández", "positions": ["LI", "DFC"], "overall": 83}, {"id": "p_11_4", "name": "Benjamin Pavard", "positions": ["LD", "DFC"], "overall": 81}, {"id": "p_11_5", "name": "Presnel Kimpembe", "positions": ["DFC"], "overall": 79}, {"id": "p_11_6", "name": "N'Golo Kanté", "positions": ["MC"], "overall": 89}, {"id": "p_11_7", "name": "Paul Pogba", "positions": ["MC"], "overall": 87}, {"id": "p_11_8", "name": "Blaise Matuidi", "positions": ["MC"], "overall": 82}, {"id": "p_11_9", "name": "Kylian Mbappé", "positions": ["EI", "ED"], "overall": 91}, {"id": "p_11_10", "name": "Antoine Griezmann", "positions": ["DC", "EI"], "overall": 90}, {"id": "p_11_11", "name": "Olivier Giroud", "positions": ["DC"], "overall": 84}, {"id": "p_11_12", "name": "Ousmane Dembélé", "positions": ["ED", "EI"], "overall": 81}, {"id": "p_11_13", "name": "Florian Thauvin", "positions": ["ED", "EI"], "overall": 79}, {"id": "p_11_14", "name": "Steven Nzonzi", "positions": ["MC"], "overall": 80}, {"id": "p_11_15", "name": "Corentin Tolisso", "positions": ["MC"], "overall": 78}, {"id": "p_13_0", "name": "Gianluigi Buffon", "positions": ["POR"], "overall": 91}, {"id": "p_13_1", "name": "Fabio Cannavaro", "positions": ["DFC"], "overall": 90}, {"id": "p_13_2", "name": "Alessandro Nesta", "positions": ["DFC"], "overall": 87}, {"id": "p_13_3", "name": "Marco Materazzi", "positions": ["DFC"], "overall": 83}, {"id": "p_13_4", "name": "Fabio Grosso", "positions": ["LI", "DFC"], "overall": 81}, {"id": "p_13_5", "name": "Gianluca Zambrotta", "positions": ["LD", "DFC"], "overall": 84}, {"id": "p_13_6", "name": "Andrea Pirlo", "positions": ["MC"], "overall": 90}, {"id": "p_13_7", "name": "Gennaro Gattuso", "positions": ["MC"], "overall": 84}, {"id": "p_13_8", "name": "Mauro Camoranesi", "positions": ["MC"], "overall": 80}, {"id": "p_13_9", "name": "Francesco Totti", "positions": ["EI", "ED"], "overall": 89}, {"id": "p_13_10", "name": "Luca Toni", "positions": ["ED", "EI"], "overall": 85}, {"id": "p_13_11", "name": "Alessandro Del Piero", "positions": ["DC"], "overall": 88}, {"id": "p_13_12", "name": "Alberto Gilardino", "positions": ["DC"], "overall": 81}, {"id": "p_13_13", "name": "Vincenzo Iaquinta", "positions": ["DC", "EI"], "overall": 77}, {"id": "p_13_14", "name": "Daniele De Rossi", "positions": ["MC"], "overall": 84}, {"id": "p_13_15", "name": "Simone Perrotta", "positions": ["MC"], "overall": 78}, {"id": "p_17_0", "name": "Rui Patrício", "positions": ["POR"], "overall": 84}, {"id": "p_17_1", "name": "Pepe", "positions": ["DFC"], "overall": 84}, {"id": "p_17_2", "name": "José Fonte", "positions": ["DFC"], "overall": 81}, {"id": "p_17_3", "name": "Bruno Alves", "positions": ["DFC"], "overall": 80}, {"id": "p_17_4", "name": "Raphaël Guerreiro", "positions": ["LI", "DFC"], "overall": 81}, {"id": "p_17_5", "name": "Cédric Soares", "positions": ["LD", "DFC"], "overall": 78}, {"id": "p_17_6", "name": "William Carvalho", "positions": ["MC"], "overall": 82}, {"id": "p_17_7", "name": "João Moutinho", "positions": ["MC"], "overall": 83}, {"id": "p_17_8", "name": "Adrien Silva", "positions": ["MC"], "overall": 79}, {"id": "p_17_9", "name": "Renato Sanches", "positions": ["MC"], "overall": 80}, {"id": "p_17_10", "name": "Cristiano Ronaldo", "positions": ["EI", "DC"], "overall": 95}, {"id": "p_17_11", "name": "Nani", "positions": ["ED", "EI"], "overall": 81}, {"id": "p_17_12", "name": "Ricardo Quaresma", "positions": ["ED", "EI"], "overall": 80}, {"id": "p_17_13", "name": "André Silva", "positions": ["DC"], "overall": 76}, {"id": "p_17_14", "name": "João Mário", "positions": ["MC", "ED"], "overall": 78}, {"id": "p_17_15", "name": "Éder", "positions": ["DC"], "overall": 76}, {"id": "p_18_0", "name": "Danijel Subašić", "positions": ["POR"], "overall": 85}, {"id": "p_18_1", "name": "Dejan Lovren", "positions": ["DFC"], "overall": 81}, {"id": "p_18_2", "name": "Domagoj Vida", "positions": ["DFC"], "overall": 80}, {"id": "p_18_3", "name": "Šime Vrsaljko", "positions": ["LD", "DFC"], "overall": 79}, {"id": "p_18_4", "name": "Ivan Strinić", "positions": ["LI", "DFC"], "overall": 77}, {"id": "p_18_5", "name": "Borna Barišić", "positions": ["LI", "DFC"], "overall": 76}, {"id": "p_18_6", "name": "Luka Modrić", "positions": ["MC"], "overall": 93}, {"id": "p_18_7", "name": "Ivan Rakitić", "positions": ["MC"], "overall": 88}, {"id": "p_18_8", "name": "Marcelo Brozović", "positions": ["MC"], "overall": 82}, {"id": "p_18_9", "name": "Ivan Perišić", "positions": ["EI", "ED"], "overall": 86}, {"id": "p_18_10", "name": "Mario Mandžukić", "positions": ["DC"], "overall": 86}, {"id": "p_18_11", "name": "Ante Rebić", "positions": ["ED", "EI"], "overall": 81}, {"id": "p_18_12", "name": "Andrej Kramarić", "positions": ["DC"], "overall": 81}, {"id": "p_18_13", "name": "Milan Badelj", "positions": ["MC"], "overall": 78}, {"id": "p_18_14", "name": "Marko Pjaca", "positions": ["DC", "EI"], "overall": 76}, {"id": "p_18_15", "name": "Nikola Kalinić", "positions": ["DC", "ED"], "overall": 77}, {"id": "p_21_0", "name": "Peter Schmeichel", "positions": ["POR"], "overall": 89}, {"id": "p_21_1", "name": "Lars Olsen", "positions": ["DFC"], "overall": 82}, {"id": "p_21_2", "name": "Kent Nielsen", "positions": ["DFC"], "overall": 77}, {"id": "p_21_3", "name": "Torben Piechnik", "positions": ["DFC"], "overall": 76}, {"id": "p_21_4", "name": "Jan Heintze", "positions": ["LI", "DFC"], "overall": 79}, {"id": "p_21_5", "name": "Kim Christofte", "positions": ["LD", "DFC"], "overall": 75}, {"id": "p_21_6", "name": "John Jensen", "positions": ["MC"], "overall": 80}, {"id": "p_21_7", "name": "Kim Vilfort", "positions": ["MC"], "overall": 83}, {"id": "p_21_8", "name": "Henrik Andersen", "positions": ["MC"], "overall": 78}, {"id": "p_21_9", "name": "Brian Laudrup", "positions": ["EI", "ED"], "overall": 87}, {"id": "p_21_10", "name": "Flemming Povlsen", "positions": ["ED", "EI"], "overall": 81}, {"id": "p_21_11", "name": "Henrik Larsen", "positions": ["DC"], "overall": 83}, {"id": "p_21_12", "name": "Bent Christensen", "positions": ["DC"], "overall": 76}, {"id": "p_21_13", "name": "Lars Elstrup", "positions": ["MC"], "overall": 76}, {"id": "p_21_14", "name": "Peter Rasmussen", "positions": ["DC", "EI"], "overall": 73}, {"id": "p_21_15", "name": "Claus Christiansen", "positions": ["DC", "ED"], "overall": 73}, {"id": "p_22_0", "name": "Thibaut Courtois", "positions": ["POR"], "overall": 89}, {"id": "p_22_1", "name": "Vincent Kompany", "positions": ["DFC"], "overall": 86}, {"id": "p_22_2", "name": "Toby Alderweireld", "positions": ["DFC"], "overall": 84}, {"id": "p_22_3", "name": "Jan Vertonghen", "positions": ["DFC"], "overall": 84}, {"id": "p_22_4", "name": "Thomas Meunier", "positions": ["LD", "DFC"], "overall": 78}, {"id": "p_22_5", "name": "Nacer Chadli", "positions": ["LI", "DFC"], "overall": 78}, {"id": "p_22_6", "name": "Kevin De Bruyne", "positions": ["MC"], "overall": 91}, {"id": "p_22_7", "name": "Axel Witsel", "positions": ["MC"], "overall": 82}, {"id": "p_22_8", "name": "Marouane Fellaini", "positions": ["MC"], "overall": 79}, {"id": "p_22_9", "name": "Eden Hazard", "positions": ["EI", "ED"], "overall": 91}, {"id": "p_22_10", "name": "Romelu Lukaku", "positions": ["DC"], "overall": 87}, {"id": "p_22_11", "name": "Dries Mertens", "positions": ["DC", "EI"], "overall": 82}, {"id": "p_22_12", "name": "Yannick Carrasco", "positions": ["ED", "EI"], "overall": 80}, {"id": "p_22_13", "name": "Mousa Dembélé", "positions": ["MC"], "overall": 80}, {"id": "p_22_14", "name": "Michy Batshuayi", "positions": ["DC"], "overall": 77}, {"id": "p_22_15", "name": "Adnan Januzaj", "positions": ["DC", "ED"], "overall": 76}, {"id": "p_23_0", "name": "Pablo Larios", "positions": ["POR"], "overall": 78}, {"id": "p_23_1", "name": "Fernando Quirarte", "positions": ["DFC"], "overall": 79}, {"id": "p_23_2", "name": "Rafael Amador", "positions": ["DFC"], "overall": 75}, {"id": "p_23_3", "name": "Miguel España", "positions": ["LI", "DFC"], "overall": 75}, {"id": "p_23_4", "name": "Javier López", "positions": ["LD", "DFC"], "overall": 73}, {"id": "p_23_5", "name": "Mario Villa", "positions": ["DFC"], "overall": 73}, {"id": "p_23_6", "name": "Hugo Sánchez", "positions": ["DC"], "overall": 90}, {"id": "p_23_7", "name": "Carlos Hermosillo", "positions": ["DC"], "overall": 75}, {"id": "p_23_8", "name": "Manuel Negrete", "positions": ["MC"], "overall": 81}, {"id": "p_23_9", "name": "Javier Aguirre", "positions": ["MC"], "overall": 78}, {"id": "p_23_10", "name": "Tomás Boy", "positions": ["MC"], "overall": 80}, {"id": "p_23_11", "name": "Luis Flores", "positions": ["EI", "ED"], "overall": 76}, {"id": "p_23_12", "name": "Carlos de los Cobos", "positions": ["MC"], "overall": 74}, {"id": "p_23_13", "name": "Mario Ortiz", "positions": ["DC", "EI"], "overall": 73}, {"id": "p_23_14", "name": "Sergio Lugo", "positions": ["DC", "ED"], "overall": 73}, {"id": "p_23_15", "name": "Javier Hernández sr.", "positions": ["ED", "EI"], "overall": 74}, {"id": "p_24_0", "name": "Brad Friedel", "positions": ["POR"], "overall": 82}, {"id": "p_24_1", "name": "Eddie Pope", "positions": ["DFC"], "overall": 79}, {"id": "p_24_2", "name": "Jeff Agoos", "positions": ["DFC"], "overall": 75}, {"id": "p_24_3", "name": "Gregg Berhalter", "positions": ["DFC"], "overall": 76}, {"id": "p_24_4", "name": "Tony Sanneh", "positions": ["LI", "DFC"], "overall": 75}, {"id": "p_24_5", "name": "Frankie Hejduk", "positions": ["LD", "DFC"], "overall": 76}, {"id": "p_24_6", "name": "Claudio Reyna", "positions": ["MC"], "overall": 84}, {"id": "p_24_7", "name": "John O'Brien", "positions": ["MC"], "overall": 78}, {"id": "p_24_8", "name": "Pablo Mastroeni", "positions": ["MC"], "overall": 75}, {"id": "p_24_9", "name": "Earnie Stewart", "positions": ["MC"], "overall": 77}, {"id": "p_24_10", "name": "Landon Donovan", "positions": ["EI", "ED"], "overall": 84}, {"id": "p_24_11", "name": "DaMarcus Beasley", "positions": ["ED", "EI"], "overall": 79}, {"id": "p_24_12", "name": "Brian McBride", "positions": ["DC"], "overall": 81}, {"id": "p_24_13", "name": "Josh Wolff", "positions": ["DC"], "overall": 75}, {"id": "p_24_14", "name": "Clint Mathis", "positions": ["DC", "EI"], "overall": 77}, {"id": "p_24_15", "name": "Cobi Jones", "positions": ["DC", "ED"], "overall": 76}, {"id": "p_25_0", "name": "Yoshikatsu Kawaguchi", "positions": ["POR"], "overall": 80}, {"id": "p_25_1", "name": "Tsuneyasu Miyamoto", "positions": ["DFC"], "overall": 78}, {"id": "p_25_2", "name": "Naoki Matsuda", "positions": ["DFC"], "overall": 76}, {"id": "p_25_3", "name": "Ryuzo Morioka", "positions": ["DFC"], "overall": 75}, {"id": "p_25_4", "name": "Koji Nakata", "positions": ["LI", "DFC"], "overall": 75}, {"id": "p_25_5", "name": "Hiroaki Morishima", "positions": ["LD", "DFC"], "overall": 74}, {"id": "p_25_6", "name": "Hidetoshi Nakata", "positions": ["MC"], "overall": 86}, {"id": "p_25_7", "name": "Junichi Inamoto", "positions": ["MC"], "overall": 79}, {"id": "p_25_8", "name": "Shinji Ono", "positions": ["MC"], "overall": 81}, {"id": "p_25_9", "name": "Toshiya Fujita", "positions": ["MC"], "overall": 75}, {"id": "p_25_10", "name": "Atsushi Yanagisawa", "positions": ["DC"], "overall": 76}, {"id": "p_25_11", "name": "Naohiro Takahara", "positions": ["DC"], "overall": 76}, {"id": "p_25_12", "name": "Masashi Nakayama", "positions": ["DC", "EI"], "overall": 78}, {"id": "p_25_13", "name": "Shoji Jo", "positions": ["DC", "ED"], "overall": 73}, {"id": "p_25_14", "name": "Akinori Nishizawa", "positions": ["ED", "EI"], "overall": 76}, {"id": "p_25_15", "name": "Teruyoshi Ito", "positions": ["MC"], "overall": 74}, {"id": "p_26_0", "name": "Lee Woon-jae", "positions": ["POR"], "overall": 81}, {"id": "p_26_1", "name": "Hong Myung-bo", "positions": ["DFC"], "overall": 84}, {"id": "p_26_2", "name": "Choi Jin-cheul", "positions": ["DFC"], "overall": 76}, {"id": "p_26_3", "name": "Kim Tae-young", "positions": ["DFC"], "overall": 76}, {"id": "p_26_4", "name": "Lee Young-pyo", "positions": ["LI", "DFC"], "overall": 80}, {"id": "p_26_5", "name": "Song Chong-gug", "positions": ["LD", "DFC"], "overall": 78}, {"id": "p_26_6", "name": "Park Ji-sung", "positions": ["MC"], "overall": 84}, {"id": "p_26_7", "name": "Yoo Sang-chul", "positions": ["MC"], "overall": 81}, {"id": "p_26_8", "name": "Kim Nam-il", "positions": ["MC"], "overall": 77}, {"id": "p_26_9", "name": "Lee Chun-soo", "positions": ["MC"], "overall": 78}, {"id": "p_26_10", "name": "Ahn Jung-hwan", "positions": ["DC"], "overall": 82}, {"id": "p_26_11", "name": "Seol Ki-hyeon", "positions": ["EI", "ED"], "overall": 79}, {"id": "p_26_12", "name": "Hwang Sun-hong", "positions": ["DC"], "overall": 78}, {"id": "p_26_13", "name": "Cha Du-ri", "positions": ["LD", "MC"], "overall": 76}, {"id": "p_26_14", "name": "Kim Do-hoon", "positions": ["DC", "ED"], "overall": 75}, {"id": "p_26_15", "name": "Choi Tae-uk", "positions": ["ED", "EI"], "overall": 75}, {"id": "p_27_0", "name": "Yassine Bounou", "positions": ["POR"], "overall": 86}, {"id": "p_27_1", "name": "Romain Saïss", "positions": ["DFC"], "overall": 80}, {"id": "p_27_2", "name": "Nayef Aguerd", "positions": ["DFC"], "overall": 79}, {"id": "p_27_3", "name": "Achraf Dari", "positions": ["DFC"], "overall": 75}, {"id": "p_27_4", "name": "Noussair Mazraoui", "positions": ["LD", "DFC"], "overall": 80}, {"id": "p_27_5", "name": "Achraf Hakimi", "positions": ["LD", "DFC"], "overall": 86}, {"id": "p_27_6", "name": "Sofyan Amrabat", "positions": ["MC"], "overall": 83}, {"id": "p_27_7", "name": "Azzedine Ounahi", "positions": ["MC"], "overall": 80}, {"id": "p_27_8", "name": "Selim Amallah", "positions": ["MC"], "overall": 75}, {"id": "p_27_9", "name": "Abdelhamid Sabiri", "positions": ["MC"], "overall": 76}, {"id": "p_27_10", "name": "Hakim Ziyech", "positions": ["EI", "ED"], "overall": 84}, {"id": "p_27_11", "name": "Sofiane Boufal", "positions": ["ED", "EI"], "overall": 78}, {"id": "p_27_12", "name": "Youssef En-Nesyri", "positions": ["DC"], "overall": 82}, {"id": "p_27_13", "name": "Abderrazak Hamdallah", "positions": ["DC"], "overall": 75}, {"id": "p_27_14", "name": "Walid Cheddira", "positions": ["DC", "EI"], "overall": 74}, {"id": "p_27_15", "name": "Zakaria Aboukhlal", "positions": ["DC", "ED"], "overall": 75}, {"id": "p_28_0", "name": "Peter Rufai", "positions": ["POR"], "overall": 82}, {"id": "p_28_1", "name": "Uche Okechukwu", "positions": ["DFC"], "overall": 77}, {"id": "p_28_2", "name": "Augustine Eguavoen", "positions": ["DFC"], "overall": 78}, {"id": "p_28_3", "name": "Benedict Iroha", "positions": ["DFC"], "overall": 75}, {"id": "p_28_4", "name": "Chidi Nwanu", "positions": ["LI", "DFC"], "overall": 73}, {"id": "p_28_5", "name": "Mobi Oparaku", "positions": ["LD", "DFC"], "overall": 73}, {"id": "p_28_6", "name": "Jay-Jay Okocha", "positions": ["EI", "ED"], "overall": 87}, {"id": "p_28_7", "name": "Sunday Oliseh", "positions": ["MC"], "overall": 81}, {"id": "p_28_8", "name": "Emmanuel Amunike", "positions": ["MC"], "overall": 82}, {"id": "p_28_9", "name": "Samson Siasia", "positions": ["MC"], "overall": 75}, {"id": "p_28_10", "name": "Mutiu Adepoju", "positions": ["MC"], "overall": 76}, {"id": "p_28_11", "name": "Finidi George", "positions": ["ED", "EI"], "overall": 83}, {"id": "p_28_12", "name": "Rashidi Yekini", "positions": ["DC"], "overall": 85}, {"id": "p_28_13", "name": "Daniel Amokachi", "positions": ["DC"], "overall": 81}, {"id": "p_28_14", "name": "Victor Ikpeba", "positions": ["DC", "EI"], "overall": 79}, {"id": "p_28_15", "name": "Friday Ekpo", "positions": ["DC", "ED"], "overall": 72}, {"id": "p_29_0", "name": "Thomas N'Kono", "positions": ["POR"], "overall": 84}, {"id": "p_29_1", "name": "Stephen Tataw", "positions": ["DFC"], "overall": 78}, {"id": "p_29_2", "name": "Emmanuel Kundé", "positions": ["DFC"], "overall": 78}, {"id": "p_29_3", "name": "Benjamin Massing", "positions": ["DFC"], "overall": 75}, {"id": "p_29_4", "name": "André Kana-Biyik", "positions": ["LI", "DFC"], "overall": 76}, {"id": "p_29_5", "name": "Bertin Ebwellé", "positions": ["LD", "DFC"], "overall": 73}, {"id": "p_29_6", "name": "Roger Milla", "positions": ["DC"], "overall": 86}, {"id": "p_29_7", "name": "François Omam-Biyik", "positions": ["EI", "ED"], "overall": 80}, {"id": "p_29_8", "name": "Cyrille Makanaky", "positions": ["MC"], "overall": 79}, {"id": "p_29_9", "name": "Emile Mbouh", "positions": ["MC"], "overall": 75}, {"id": "p_29_10", "name": "Louis-Paul Mfedé", "positions": ["MC"], "overall": 74}, {"id": "p_29_11", "name": "Victor Ndip Akem", "positions": ["MC"], "overall": 73}, {"id": "p_29_12", "name": "Eugène Ekéké", "positions": ["DC"], "overall": 75}, {"id": "p_29_13", "name": "Jean-Claude Pagal", "positions": ["DC", "EI"], "overall": 73}, {"id": "p_29_14", "name": "Roger Feutmba", "positions": ["DC", "ED"], "overall": 73}, {"id": "p_29_15", "name": "Jules Nyongha", "positions": ["ED", "EI"], "overall": 73}, {"id": "p_31_0", "name": "Justo Villar", "positions": ["POR"], "overall": 82}, {"id": "p_31_1", "name": "Paulo da Silva", "positions": ["DFC"], "overall": 79}, {"id": "p_31_2", "name": "Antolín Alcaraz", "positions": ["DFC"], "overall": 78}, {"id": "p_31_3", "name": "Darío Verón", "positions": ["DFC"], "overall": 75}, {"id": "p_31_4", "name": "Denis Caniza", "positions": ["LI", "DFC"], "overall": 76}, {"id": "p_31_5", "name": "Claudio Morel Rodríguez", "positions": ["LD", "DFC"], "overall": 75}, {"id": "p_31_6", "name": "Roque Santa Cruz", "positions": ["DC"], "overall": 82}, {"id": "p_31_7", "name": "Óscar Cardozo", "positions": ["DC"], "overall": 80}, {"id": "p_31_8", "name": "Cristian Riveros", "positions": ["MC"], "overall": 78}, {"id": "p_31_9", "name": "Víctor Cáceres", "positions": ["MC"], "overall": 76}, {"id": "p_31_10", "name": "Enrique Vera", "positions": ["MC"], "overall": 76}, {"id": "p_31_11", "name": "Edgar Barreto", "positions": ["MC"], "overall": 78}, {"id": "p_31_12", "name": "Nelson Haedo Valdez", "positions": ["EI", "ED"], "overall": 78}, {"id": "p_31_13", "name": "Lucas Barrios", "positions": ["DC", "EI"], "overall": 77}, {"id": "p_31_14", "name": "Edgar Benítez", "positions": ["DC", "EI"], "overall": 75}, {"id": "p_31_15", "name": "Santiago Salcedo", "positions": ["DC", "ED"], "overall": 73}, {"id": "p_32_0", "name": "David Ospina", "positions": ["POR"], "overall": 84}, {"id": "p_32_1", "name": "Mario Yepes", "positions": ["DFC"], "overall": 79}, {"id": "p_32_2", "name": "Cristián Zapata", "positions": ["DFC"], "overall": 78}, {"id": "p_32_3", "name": "Pablo Armero", "positions": ["LI", "DFC"], "overall": 76}, {"id": "p_32_4", "name": "Santiago Arias", "positions": ["LD", "DFC"], "overall": 78}, {"id": "p_32_5", "name": "Éder Álvarez Balanta", "positions": ["DFC"], "overall": 75}, {"id": "p_32_6", "name": "James Rodríguez", "positions": ["EI", "ED"], "overall": 89}, {"id": "p_32_7", "name": "Juan Cuadrado", "positions": ["MC", "ED"], "overall": 82}, {"id": "p_32_8", "name": "Fredy Guarín", "positions": ["MC"], "overall": 80}, {"id": "p_32_9", "name": "Carlos Sánchez", "positions": ["MC"], "overall": 79}, {"id": "p_32_10", "name": "Abel Aguilar", "positions": ["MC"], "overall": 75}, {"id": "p_32_11", "name": "Jackson Martínez", "positions": ["DC"], "overall": 80}, {"id": "p_32_12", "name": "Carlos Bacca", "positions": ["DC"], "overall": 81}, {"id": "p_32_13", "name": "Teófilo Gutiérrez", "positions": ["DC"], "overall": 77}, {"id": "p_32_14", "name": "Juan Fernando Quintero", "positions": ["ED", "EI"], "overall": 78}, {"id": "p_32_15", "name": "Adrián Ramos", "positions": ["DC", "ED"], "overall": 75}, {"id": "p_40_0", "name": "Rüştü Reçber", "positions": ["POR"], "overall": 84}, {"id": "p_40_1", "name": "Alpay Özalan", "positions": ["DFC"], "overall": 80}, {"id": "p_40_2", "name": "Bülent Korkmaz", "positions": ["DFC"], "overall": 78}, {"id": "p_40_3", "name": "Fatih Akyel", "positions": ["DFC"], "overall": 76}, {"id": "p_40_4", "name": "Ümit Davala", "positions": ["LI", "DFC"], "overall": 78}, {"id": "p_40_5", "name": "Ogün Temizkanoğlu", "positions": ["LD", "DFC"], "overall": 73}, {"id": "p_40_6", "name": "Hakan Şükür", "positions": ["DC"], "overall": 84}, {"id": "p_40_7", "name": "Nihat Kahveci", "positions": ["DC"], "overall": 80}, {"id": "p_40_8", "name": "Tugay Kerimoğlu", "positions": ["MC"], "overall": 81}, {"id": "p_40_9", "name": "Emre Belözoğlu", "positions": ["MC"], "overall": 80}, {"id": "p_40_10", "name": "Yıldıray Baştürk", "positions": ["MC"], "overall": 77}, {"id": "p_40_11", "name": "Hasan Şaş", "positions": ["MC"], "overall": 79}, {"id": "p_40_12", "name": "İlhan Mansız", "positions": ["EI", "ED"], "overall": 78}, {"id": "p_40_13", "name": "Ümit Karan", "positions": ["ED", "EI"], "overall": 75}, {"id": "p_40_14", "name": "Tayfun Korkut", "positions": ["DC", "EI"], "overall": 73}, {"id": "p_40_15", "name": "Tayfur Havutçu", "positions": ["DC", "ED"], "overall": 74}, {"id": "p_41_0", "name": "Antonis Nikopolidis", "positions": ["POR"], "overall": 81}, {"id": "p_41_1", "name": "Traianos Dellas", "positions": ["DFC"], "overall": 80}, {"id": "p_41_2", "name": "Michalis Kapsis", "positions": ["DFC"], "overall": 76}, {"id": "p_41_3", "name": "Takis Fyssas", "positions": ["LI", "DFC"], "overall": 76}, {"id": "p_41_4", "name": "Giourkas Seitaridis", "positions": ["LD", "DFC"], "overall": 78}, {"id": "p_41_5", "name": "Stelios Venetidis", "positions": ["LD", "DFC"], "overall": 73}, {"id": "p_41_6", "name": "Theodoros Zagorakis", "positions": ["MC"], "overall": 82}, {"id": "p_41_7", "name": "Kostas Katsouranis", "positions": ["MC"], "overall": 78}, {"id": "p_41_8", "name": "Angelos Basinas", "positions": ["MC"], "overall": 78}, {"id": "p_41_9", "name": "Stylianos Giannakopoulos", "positions": ["MC"], "overall": 75}, {"id": "p_41_10", "name": "Giorgos Karagounis", "positions": ["MC", "ED"], "overall": 79}, {"id": "p_41_11", "name": "Angelos Charisteas", "positions": ["DC"], "overall": 81}, {"id": "p_41_12", "name": "Demis Nikolaidis", "positions": ["DC"], "overall": 77}, {"id": "p_41_13", "name": "Zisis Vryzas", "positions": ["EI", "ED"], "overall": 75}, {"id": "p_41_14", "name": "Vassilios Tsiartas", "positions": ["EI", "ED"], "overall": 76}, {"id": "p_41_15", "name": "Vassilis Lakis", "positions": ["DC", "EI"], "overall": 72}, {"id": "p_42_0", "name": "Florin Prunea", "positions": ["POR"], "overall": 79}, {"id": "p_42_1", "name": "Gheorghe Popescu", "positions": ["DFC"], "overall": 82}, {"id": "p_42_2", "name": "Miodrag Belodedici", "positions": ["DFC"], "overall": 80}, {"id": "p_42_3", "name": "Daniel Prodan", "positions": ["DFC"], "overall": 75}, {"id": "p_42_4", "name": "Dan Petrescu", "positions": ["LD", "DFC"], "overall": 80}, {"id": "p_42_5", "name": "Ioan Lupescu", "positions": ["LI", "DFC"], "overall": 78}, {"id": "p_42_6", "name": "Gheorghe Hagi", "positions": ["MC", "EI"], "overall": 89}, {"id": "p_42_7", "name": "Ilie Dumitrescu", "positions": ["MC"], "overall": 80}, {"id": "p_42_8", "name": "Tibor Selymes", "positions": ["MC"], "overall": 75}, {"id": "p_42_9", "name": "Cristian Dulca", "positions": ["MC"], "overall": 73}, {"id": "p_42_10", "name": "Florin Răducioiu", "positions": ["EI", "ED"], "overall": 79}, {"id": "p_42_11", "name": "Adrian Ilie", "positions": ["ED", "EI"], "overall": 76}, {"id": "p_42_12", "name": "Dorinel Munteanu", "positions": ["MC"], "overall": 76}, {"id": "p_42_13", "name": "Viorel Moldovan", "positions": ["DC"], "overall": 76}, {"id": "p_42_14", "name": "Gheorghe Craioveanu", "positions": ["DC", "ED"], "overall": 73}, {"id": "p_42_15", "name": "Ioan Vlădoiu", "positions": ["DC"], "overall": 73}, {"id": "p_43_0", "name": "Packie Bonner", "positions": ["POR"], "overall": 82}, {"id": "p_43_1", "name": "Paul McGrath", "positions": ["DFC"], "overall": 85}, {"id": "p_43_2", "name": "Mick McCarthy", "positions": ["DFC"], "overall": 76}, {"id": "p_43_3", "name": "Kevin Moran", "positions": ["DFC"], "overall": 78}, {"id": "p_43_4", "name": "Steve Staunton", "positions": ["LI", "DFC"], "overall": 77}, {"id": "p_43_5", "name": "Chris Morris", "positions": ["LD", "DFC"], "overall": 74}, {"id": "p_43_6", "name": "Liam Brady", "positions": ["MC"], "overall": 81}, {"id": "p_43_7", "name": "Andy Townsend", "positions": ["MC"], "overall": 78}, {"id": "p_43_8", "name": "Ray Houghton", "positions": ["MC"], "overall": 79}, {"id": "p_43_9", "name": "Ronnie Whelan", "positions": ["MC"], "overall": 78}, {"id": "p_43_10", "name": "Kevin Sheedy", "positions": ["ED", "EI"], "overall": 78}, {"id": "p_43_11", "name": "John Aldridge", "positions": ["DC"], "overall": 78}, {"id": "p_43_12", "name": "Niall Quinn", "positions": ["DC"], "overall": 78}, {"id": "p_43_13", "name": "Tony Cascarino", "positions": ["DC"], "overall": 76}, {"id": "p_43_14", "name": "David O'Leary", "positions": ["DFC", "MC"], "overall": 77}, {"id": "p_43_15", "name": "David Kelly", "positions": ["DC", "ED"], "overall": 73}, {"id": "p_46_0", "name": "Igor Akinfeev", "positions": ["POR"], "overall": 83}, {"id": "p_46_1", "name": "Sergei Ignashevich", "positions": ["DFC"], "overall": 78}, {"id": "p_46_2", "name": "Ilya Kutepov", "positions": ["DFC"], "overall": 74}, {"id": "p_46_3", "name": "Andrei Semyonov", "positions": ["DFC"], "overall": 73}, {"id": "p_46_4", "name": "Yuri Zhirkov", "positions": ["LI", "DFC"], "overall": 78}, {"id": "p_46_5", "name": "Mário Fernandes", "positions": ["LD", "DFC"], "overall": 76}, {"id": "p_46_6", "name": "Aleksandr Golovin", "positions": ["MC"], "overall": 81}, {"id": "p_46_7", "name": "Roman Zobnin", "positions": ["MC"], "overall": 77}, {"id": "p_46_8", "name": "Alan Dzagoev", "positions": ["MC"], "overall": 76}, {"id": "p_46_9", "name": "Daler Kuzyaev", "positions": ["MC"], "overall": 75}, {"id": "p_46_10", "name": "Denis Cheryshev", "positions": ["EI", "ED"], "overall": 79}, {"id": "p_46_11", "name": "Aleksandr Samedov", "positions": ["ED", "EI"], "overall": 74}, {"id": "p_46_12", "name": "Artem Dzyuba", "positions": ["DC"], "overall": 79}, {"id": "p_46_13", "name": "Fedor Smolov", "positions": ["DC"], "overall": 76}, {"id": "p_46_14", "name": "Anton Miranchuk", "positions": ["DC", "EI"], "overall": 74}, {"id": "p_46_15", "name": "Yuri Gazinsky", "positions": ["DC", "ED"], "overall": 72}, {"id": "p_47_0", "name": "Oleksandr Shovkovskiy", "positions": ["POR"], "overall": 81}, {"id": "p_47_1", "name": "Vladislav Vashchuk", "positions": ["DFC"], "overall": 76}, {"id": "p_47_2", "name": "Andriy Nesmachniy", "positions": ["DFC"], "overall": 75}, {"id": "p_47_3", "name": "Vyacheslav Sviderskyi", "positions": ["DFC"], "overall": 75}, {"id": "p_47_4", "name": "Andriy Husin", "positions": ["LI", "DFC"], "overall": 75}, {"id": "p_47_5", "name": "Bohdan Shust", "positions": ["LD", "DFC"], "overall": 72}, {"id": "p_47_6", "name": "Andriy Shevchenko", "positions": ["DC"], "overall": 88}, {"id": "p_47_7", "name": "Anatoliy Tymoshchuk", "positions": ["MC"], "overall": 84}, {"id": "p_47_8", "name": "Serhiy Rebrov", "positions": ["MC", "EI"], "overall": 80}, {"id": "p_47_9", "name": "Oleh Husyev", "positions": ["MC"], "overall": 76}, {"id": "p_47_10", "name": "Ruslan Rotan", "positions": ["MC"], "overall": 75}, {"id": "p_47_11", "name": "Andriy Voronin", "positions": ["EI", "ED"], "overall": 79}, {"id": "p_47_12", "name": "Maksym Kalynychenko", "positions": ["ED", "EI"], "overall": 76}, {"id": "p_47_13", "name": "Artem Milevskyi", "positions": ["DC"], "overall": 75}, {"id": "p_47_14", "name": "Andriy Vorobei", "positions": ["DC", "EI"], "overall": 73}, {"id": "p_47_15", "name": "Yevhen Levchenko", "positions": ["DC", "ED"], "overall": 72}, {"id": "p_48_0", "name": "Vladimir Stojković", "positions": ["POR"], "overall": 78}, {"id": "p_48_1", "name": "Nemanja Vidić", "positions": ["DFC"], "overall": 87}, {"id": "p_48_2", "name": "Branislav Ivanović", "positions": ["DFC", "LD"], "overall": 84}, {"id": "p_48_3", "name": "Aleksandar Luković", "positions": ["DFC"], "overall": 75}, {"id": "p_48_4", "name": "Neven Subotić", "positions": ["LI", "DFC"], "overall": 78}, {"id": "p_48_5", "name": "Ivan Obradović", "positions": ["LD", "DFC"], "overall": 73}, {"id": "p_48_6", "name": "Dejan Stanković", "positions": ["MC"], "overall": 82}, {"id": "p_48_7", "name": "Zdravko Kuzmanović", "positions": ["MC"], "overall": 75}, {"id": "p_48_8", "name": "Miloš Krasić", "positions": ["MC", "ED"], "overall": 79}, {"id": "p_48_9", "name": "Gojko Kačar", "positions": ["MC"], "overall": 73}, {"id": "p_48_10", "name": "Milan Jovanović", "positions": ["EI", "ED"], "overall": 78}, {"id": "p_48_11", "name": "Zoran Tošić", "positions": ["ED", "EI"], "overall": 76}, {"id": "p_48_12", "name": "Marko Pantelić", "positions": ["DC"], "overall": 76}, {"id": "p_48_13", "name": "Nikola Žigić", "positions": ["DC"], "overall": 78}, {"id": "p_48_14", "name": "Danko Lazović", "positions": ["DC", "EI"], "overall": 75}, {"id": "p_48_15", "name": "Milan Smiljanić", "positions": ["DC", "ED"], "overall": 72}, {"id": "p_49_0", "name": "Frode Grodås", "positions": ["POR"], "overall": 78}, {"id": "p_49_1", "name": "Ronny Johnsen", "positions": ["DFC"], "overall": 81}, {"id": "p_49_2", "name": "Henning Berg", "positions": ["DFC"], "overall": 80}, {"id": "p_49_3", "name": "Dan Eggen", "positions": ["DFC"], "overall": 73}, {"id": "p_49_4", "name": "Gunnar Halle", "positions": ["LD", "DFC"], "overall": 74}, {"id": "p_49_5", "name": "Erland Johnsen", "positions": ["LI", "DFC"], "overall": 75}, {"id": "p_49_6", "name": "Ole Gunnar Solskjær", "positions": ["DC"], "overall": 82}, {"id": "p_49_7", "name": "Tore André Flo", "positions": ["DC"], "overall": 81}, {"id": "p_49_8", "name": "Kjetil Rekdal", "positions": ["MC"], "overall": 76}, {"id": "p_49_9", "name": "Øyvind Leonhardsen", "positions": ["MC"], "overall": 76}, {"id": "p_49_10", "name": "Stig Inge Bjørnebye", "positions": ["LI", "MC"], "overall": 76}, {"id": "p_49_11", "name": "Erik Mykland", "positions": ["MC"], "overall": 74}, {"id": "p_49_12", "name": "Jostein Flo", "positions": ["EI", "DC"], "overall": 75}, {"id": "p_49_13", "name": "Steffen Iversen", "positions": ["DC", "EI"], "overall": 76}, {"id": "p_49_14", "name": "Egil Østenstad", "positions": ["DC", "EI"], "overall": 73}, {"id": "p_49_15", "name": "Håvard Flo", "positions": ["DC", "ED"], "overall": 72}, {"id": "p_team_brasil_1982_0", "name": "Waldir Peres", "positions": ["POR"], "overall": 82}, {"id": "p_team_brasil_1982_1", "name": "Leandro", "positions": ["LD"], "overall": 84}, {"id": "p_team_brasil_1982_2", "name": "Oscar", "positions": ["DFC"], "overall": 83}, {"id": "p_team_brasil_1982_3", "name": "Luízinho", "positions": ["DFC"], "overall": 82}, {"id": "p_team_brasil_1982_4", "name": "Junior", "positions": ["LI"], "overall": 85}, {"id": "p_team_brasil_1982_5", "name": "Toninho Cerezo", "positions": ["MC"], "overall": 85}, {"id": "p_team_brasil_1982_6", "name": "Falcão", "positions": ["MC"], "overall": 92}, {"id": "p_team_brasil_1982_7", "name": "Sócrates", "positions": ["EI", "MC"], "overall": 93}, {"id": "p_team_brasil_1982_8", "name": "Zico", "positions": ["EI", "DC"], "overall": 94}, {"id": "p_team_brasil_1982_9", "name": "Éder", "positions": ["EI"], "overall": 87}, {"id": "p_team_brasil_1982_10", "name": "Paulo Isidoro", "positions": ["ED"], "overall": 83}, {"id": "p_team_brasil_1982_11", "name": "Serginho", "positions": ["DC"], "overall": 82}, {"id": "p_team_brasil_1982_12", "name": "Batista", "positions": ["DFC", "MC"], "overall": 80}, {"id": "p_team_brasil_1982_13", "name": "Dirceu", "positions": ["MC", "EI"], "overall": 84}, {"id": "p_team_brasil_1982_14", "name": "Reinaldo", "positions": ["DC"], "overall": 82}, {"id": "p_team_brasil_1982_15", "name": "Paulo Roberto", "positions": ["MC"], "overall": 83}, {"id": "p_team_argentina_1978_0", "name": "Ubaldo Fillol", "positions": ["POR"], "overall": 86}, {"id": "p_team_argentina_1978_1", "name": "Jorge Olguín", "positions": ["LD"], "overall": 82}, {"id": "p_team_argentina_1978_2", "name": "Daniel Passarella", "positions": ["DFC"], "overall": 90}, {"id": "p_team_argentina_1978_3", "name": "Luis Galván", "positions": ["DFC"], "overall": 82}, {"id": "p_team_argentina_1978_4", "name": "Alberto Tarantini", "positions": ["LI"], "overall": 81}, {"id": "p_team_argentina_1978_5", "name": "Omar Larrosa", "positions": ["MC"], "overall": 82}, {"id": "p_team_argentina_1978_6", "name": "Américo Gallego", "positions": ["MC"], "overall": 83}, {"id": "p_team_argentina_1978_7", "name": "Osvaldo Ardiles", "positions": ["MC"], "overall": 87}, {"id": "p_team_argentina_1978_8", "name": "Leopoldo Luque", "positions": ["DC"], "overall": 85}, {"id": "p_team_argentina_1978_9", "name": "Mario Kempes", "positions": ["DC", "EI"], "overall": 93}, {"id": "p_team_argentina_1978_10", "name": "René Houseman", "positions": ["ED"], "overall": 84}, {"id": "p_team_argentina_1978_11", "name": "Norberto Alonso", "positions": ["EI", "MC"], "overall": 83}, {"id": "p_team_argentina_1978_12", "name": "Ricardo Villa", "positions": ["MC"], "overall": 82}, {"id": "p_team_argentina_1978_13", "name": "Daniel Bertoni", "positions": ["ED"], "overall": 83}, {"id": "p_team_argentina_1978_14", "name": "Hugo Gatti", "positions": ["POR"], "overall": 82}, {"id": "p_team_argentina_1978_15", "name": "Jorge Carrascosa", "positions": ["MC"], "overall": 80}, {"id": "p_team_holanda_1988_0", "name": "Hans van Breukelen", "positions": ["POR"], "overall": 84}, {"id": "p_team_holanda_1988_1", "name": "Berry van Aerle", "positions": ["LD"], "overall": 82}, {"id": "p_team_holanda_1988_2", "name": "Ronald Koeman", "positions": ["DFC"], "overall": 90}, {"id": "p_team_holanda_1988_3", "name": "Adri van Tiggelen", "positions": ["DFC"], "overall": 82}, {"id": "p_team_holanda_1988_4", "name": "Jan Wouters", "positions": ["MC", "DFC"], "overall": 84}, {"id": "p_team_holanda_1988_5", "name": "Gerald Vanenburg", "positions": ["MC"], "overall": 83}, {"id": "p_team_holanda_1988_6", "name": "Ruud Gullit", "positions": ["DC", "EI"], "overall": 95}, {"id": "p_team_holanda_1988_7", "name": "Frank Rijkaard", "positions": ["MC"], "overall": 91}, {"id": "p_team_holanda_1988_8", "name": "Marco van Basten", "positions": ["DC"], "overall": 96}, {"id": "p_team_holanda_1988_9", "name": "John van 't Schip", "positions": ["EI", "MC"], "overall": 84}, {"id": "p_team_holanda_1988_10", "name": "Rob Witschge", "positions": ["MC"], "overall": 82}, {"id": "p_team_holanda_1988_11", "name": "Wim Kieft", "positions": ["DC"], "overall": 83}, {"id": "p_team_holanda_1988_12", "name": "Hans Gillhaus", "positions": ["EI", "DC"], "overall": 82}, {"id": "p_team_holanda_1988_13", "name": "Arnold Mühren", "positions": ["MC"], "overall": 84}, {"id": "p_team_holanda_1988_14", "name": "Erwin Koeman", "positions": ["LD", "MC"], "overall": 83}, {"id": "p_team_holanda_1988_15", "name": "Peter Boeve", "positions": ["DFC"], "overall": 80}, {"id": "p_team_senegal_2002_0", "name": "Tony Sylva", "positions": ["POR"], "overall": 82}, {"id": "p_team_senegal_2002_1", "name": "Lamine Diatta", "positions": ["DFC"], "overall": 82}, {"id": "p_team_senegal_2002_2", "name": "Ferdinand Coly", "positions": ["LD"], "overall": 83}, {"id": "p_team_senegal_2002_3", "name": "Pape Bouba Diop", "positions": ["DFC"], "overall": 82}, {"id": "p_team_senegal_2002_4", "name": "Omar Daf", "positions": ["LI"], "overall": 81}, {"id": "p_team_senegal_2002_5", "name": "Khalilou Fadiga", "positions": ["MC"], "overall": 84}, {"id": "p_team_senegal_2002_6", "name": "Aliou Cissé", "positions": ["MC"], "overall": 82}, {"id": "p_team_senegal_2002_7", "name": "El Hadji Diouf", "positions": ["DC", "EI"], "overall": 86}, {"id": "p_team_senegal_2002_8", "name": "Salif Diao", "positions": ["MC"], "overall": 83}, {"id": "p_team_senegal_2002_9", "name": "Henri Camara", "positions": ["DC"], "overall": 84}, {"id": "p_team_senegal_2002_10", "name": "Souleymane Camara", "positions": ["DC"], "overall": 81}, {"id": "p_team_senegal_2002_11", "name": "Habib Beye", "positions": ["LD", "MC"], "overall": 82}, {"id": "p_team_senegal_2002_12", "name": "Mamadou Niang", "positions": ["DC"], "overall": 82}, {"id": "p_team_senegal_2002_13", "name": "Amdy Faye", "positions": ["MC"], "overall": 81}, {"id": "p_team_senegal_2002_14", "name": "Moussa N'Diaye", "positions": ["EI"], "overall": 81}, {"id": "p_team_senegal_2002_15", "name": "Pape Thiaw", "positions": ["DFC", "MC"], "overall": 80}, {"id": "p_team_costa_rica_2014_0", "name": "Keylor Navas", "positions": ["POR"], "overall": 90}, {"id": "p_team_costa_rica_2014_1", "name": "Michael Umaña", "positions": ["DFC"], "overall": 81}, {"id": "p_team_costa_rica_2014_2", "name": "Óscar Duarte", "positions": ["DFC"], "overall": 82}, {"id": "p_team_costa_rica_2014_3", "name": "Giancarlo González", "positions": ["DFC"], "overall": 81}, {"id": "p_team_costa_rica_2014_4", "name": "Junior Díaz", "positions": ["LI"], "overall": 80}, {"id": "p_team_costa_rica_2014_5", "name": "David Myrie", "positions": ["LD"], "overall": 79}, {"id": "p_team_costa_rica_2014_6", "name": "Bryan Ruiz", "positions": ["MC", "EI"], "overall": 84}, {"id": "p_team_costa_rica_2014_7", "name": "Yeltsin Tejeda", "positions": ["MC"], "overall": 80}, {"id": "p_team_costa_rica_2014_8", "name": "Celso Borges", "positions": ["MC"], "overall": 82}, {"id": "p_team_costa_rica_2014_9", "name": "Joel Campbell", "positions": ["EI", "DC"], "overall": 83}, {"id": "p_team_costa_rica_2014_10", "name": "Marco Ureña", "positions": ["DC"], "overall": 80}, {"id": "p_team_costa_rica_2014_11", "name": "José Miguel Cubero", "positions": ["DFC", "MC"], "overall": 80}, {"id": "p_team_costa_rica_2014_12", "name": "Álvaro Saborío", "positions": ["DC"], "overall": 81}, {"id": "p_team_costa_rica_2014_13", "name": "Johnny Acosta", "positions": ["DFC"], "overall": 79}, {"id": "p_team_costa_rica_2014_14", "name": "Diego Calvo", "positions": ["LD"], "overall": 78}, {"id": "p_team_costa_rica_2014_15", "name": "Randall Brenes", "positions": ["MC"], "overall": 79}, {"id": "p_team_ghana_2010_0", "name": "Richard Kingson", "positions": ["POR"], "overall": 81}, {"id": "p_team_ghana_2010_1", "name": "Hans Sarpei", "positions": ["LI"], "overall": 80}, {"id": "p_team_ghana_2010_2", "name": "John Mensah", "positions": ["DFC"], "overall": 83}, {"id": "p_team_ghana_2010_3", "name": "Jonathan Mensah", "positions": ["DFC"], "overall": 80}, {"id": "p_team_ghana_2010_4", "name": "Samuel Inkoom", "positions": ["LD"], "overall": 80}, {"id": "p_team_ghana_2010_5", "name": "Anthony Annan", "positions": ["MC"], "overall": 81}, {"id": "p_team_ghana_2010_6", "name": "Kevin-Prince Boateng", "positions": ["MC", "EI"], "overall": 85}, {"id": "p_team_ghana_2010_7", "name": "Kwadwo Asamoah", "positions": ["MC", "LI"], "overall": 84}, {"id": "p_team_ghana_2010_8", "name": "Sulley Muntari", "positions": ["MC"], "overall": 83}, {"id": "p_team_ghana_2010_9", "name": "Asamoah Gyan", "positions": ["DC"], "overall": 87}, {"id": "p_team_ghana_2010_10", "name": "André Ayew", "positions": ["EI", "DC"], "overall": 84}, {"id": "p_team_ghana_2010_11", "name": "John Paintsil", "positions": ["LD"], "overall": 80}, {"id": "p_team_ghana_2010_12", "name": "Dominic Adiyiah", "positions": ["DC"], "overall": 80}, {"id": "p_team_ghana_2010_13", "name": "Stephen Appiah", "positions": ["MC"], "overall": 83}, {"id": "p_team_ghana_2010_14", "name": "Laryea Kingston", "positions": ["MC", "EI"], "overall": 80}, {"id": "p_team_ghana_2010_15", "name": "Jordan Ayew", "positions": ["EI", "DC"], "overall": 82}, {"id": "p_team_uruguay_2010_0", "name": "Fernando Muslera", "positions": ["POR"], "overall": 85}, {"id": "p_team_uruguay_2010_1", "name": "Maxi Pereira", "positions": ["LD"], "overall": 82}, {"id": "p_team_uruguay_2010_2", "name": "Diego Lugano", "positions": ["DFC"], "overall": 84}, {"id": "p_team_uruguay_2010_3", "name": "Diego Godín", "positions": ["DFC"], "overall": 90}, {"id": "p_team_uruguay_2010_4", "name": "Jorge Fucile", "positions": ["LI"], "overall": 80}, {"id": "p_team_uruguay_2010_5", "name": "Álvaro Pereira", "positions": ["LI", "MC"], "overall": 82}, {"id": "p_team_uruguay_2010_6", "name": "Egidio Arévalo Ríos", "positions": ["MC"], "overall": 81}, {"id": "p_team_uruguay_2010_7", "name": "Diego Pérez", "positions": ["DFC", "MC"], "overall": 80}, {"id": "p_team_uruguay_2010_8", "name": "Edinson Cavani", "positions": ["DC", "EI"], "overall": 91}, {"id": "p_team_uruguay_2010_9", "name": "Luis Suárez", "positions": ["DC"], "overall": 94}, {"id": "p_team_uruguay_2010_10", "name": "Diego Forlán", "positions": ["DC", "EI"], "overall": 90}, {"id": "p_team_uruguay_2010_11", "name": "Sebastián Abreu", "positions": ["DC"], "overall": 80}, {"id": "p_team_uruguay_2010_12", "name": "Andrés Scotti", "positions": ["DFC"], "overall": 79}, {"id": "p_team_uruguay_2010_13", "name": "Nicolás Lodeiro", "positions": ["MC", "EI"], "overall": 82}, {"id": "p_team_uruguay_2010_14", "name": "Sebastián Eguren", "positions": ["MC"], "overall": 80}, {"id": "p_team_uruguay_2010_15", "name": "Carlos Bueno", "positions": ["DC"], "overall": 79}, {"id": "p_team_suecia_1994_0", "name": "Thomas Ravelli", "positions": ["POR"], "overall": 85}, {"id": "p_team_suecia_1994_1", "name": "Roland Nilsson", "positions": ["LD"], "overall": 83}, {"id": "p_team_suecia_1994_2", "name": "Patrik Andersson", "positions": ["DFC"], "overall": 82}, {"id": "p_team_suecia_1994_3", "name": "Joachim Björklund", "positions": ["DFC"], "overall": 81}, {"id": "p_team_suecia_1994_4", "name": "Pontus Kåmark", "positions": ["DFC"], "overall": 80}, {"id": "p_team_suecia_1994_5", "name": "Klas Ingesson", "positions": ["MC"], "overall": 82}, {"id": "p_team_suecia_1994_6", "name": "Jonas Thern", "positions": ["MC"], "overall": 83}, {"id": "p_team_suecia_1994_7", "name": "Stefan Schwarz", "positions": ["MC"], "overall": 83}, {"id": "p_team_suecia_1994_8", "name": "Kennet Andersson", "positions": ["DC"], "overall": 82}, {"id": "p_team_suecia_1994_9", "name": "Henrik Larsson", "positions": ["DC", "EI"], "overall": 88}, {"id": "p_team_suecia_1994_10", "name": "Martin Dahlin", "positions": ["DC"], "overall": 85}, {"id": "p_team_suecia_1994_11", "name": "Tomas Brolin", "positions": ["EI", "DC"], "overall": 86}, {"id": "p_team_suecia_1994_12", "name": "Håkan Mild", "positions": ["MC"], "overall": 81}, {"id": "p_team_suecia_1994_13", "name": "Jesper Blomqvist", "positions": ["EI"], "overall": 82}, {"id": "p_team_suecia_1994_14", "name": "Jan Eriksson", "positions": ["DFC"], "overall": 79}, {"id": "p_team_suecia_1994_15", "name": "Niklas Alexandersson", "positions": ["LD", "MC"], "overall": 80}, {"id": "p_team_holanda_1988_0", "name": "Hans van Breukelen", "positions": ["POR"], "overall": 84}, {"id": "p_team_holanda_1988_1", "name": "Berry van Aerle", "positions": ["LD"], "overall": 82}, {"id": "p_team_holanda_1988_2", "name": "Ronald Koeman", "positions": ["DFC"], "overall": 90}, {"id": "p_team_holanda_1988_3", "name": "Adri van Tiggelen", "positions": ["DFC"], "overall": 82}, {"id": "p_team_holanda_1988_4", "name": "Jan Wouters", "positions": ["MC", "DFC"], "overall": 84}, {"id": "p_team_holanda_1988_5", "name": "Gerald Vanenburg", "positions": ["MC"], "overall": 83}, {"id": "p_team_holanda_1988_6", "name": "Ruud Gullit", "positions": ["DC", "EI"], "overall": 95}, {"id": "p_team_holanda_1988_7", "name": "Frank Rijkaard", "positions": ["MC"], "overall": 91}, {"id": "p_team_holanda_1988_8", "name": "Marco van Basten", "positions": ["DC"], "overall": 96}, {"id": "p_team_holanda_1988_9", "name": "John van 't Schip", "positions": ["EI", "MC"], "overall": 84}, {"id": "p_team_holanda_1988_10", "name": "Rob Witschge", "positions": ["MC"], "overall": 82}, {"id": "p_team_holanda_1988_11", "name": "Wim Kieft", "positions": ["DC"], "overall": 83}, {"id": "p_team_holanda_1988_12", "name": "Hans Gillhaus", "positions": ["EI", "DC"], "overall": 82}, {"id": "p_team_holanda_1988_13", "name": "Arnold Mühren", "positions": ["MC"], "overall": 84}, {"id": "p_team_holanda_1988_14", "name": "Erwin Koeman", "positions": ["LD", "MC"], "overall": 83}, {"id": "p_team_holanda_1988_15", "name": "Peter Boeve", "positions": ["DFC"], "overall": 80}];
let rawTeams = [
  {"id":"team_1","name":"España 2010","players":["p_1_0","p_1_1","p_1_2","p_1_3","p_1_4","p_1_5","p_1_6","p_1_7","p_1_8","p_1_9","p_1_10","p_1_11","p_1_12","p_1_13","p_1_14","p_1_15"],"flag":"assets/flags/es.png","emoji":"🇪🇸","bonus":{"PASE":5},"style":"tiki_taka"},
  {"id":"team_2","name":"España 2012","players":["p_2_0","p_2_1","p_2_2","p_2_3","p_2_4","p_2_5","p_2_6","p_2_7","p_2_8","p_2_9","p_2_10","p_2_11","p_2_12","p_2_13","p_2_14","p_2_15"],"flag":"assets/flags/es.png","emoji":"🇪🇸","bonus":{"PASE":5},"style":"tiki_taka"},
  {"id":"team_4","name":"Brasil 2002","players":["p_4_0","p_4_1","p_4_2","p_4_3","p_4_4","p_4_5","p_4_6","p_4_7","p_4_8","p_4_9","p_4_10","p_4_11","p_4_12","p_4_13","p_4_14","p_4_15"],"flag":"assets/flags/br.png","emoji":"🇧🇷","bonus":{"TÉCNICA":5},"style":"samba_total"},
  {"id":"team_6","name":"Alemania 1990","players":["p_6_0","p_6_1","p_6_2","p_6_3","p_6_4","p_6_5","p_6_6","p_6_7","p_6_8","p_6_9","p_6_10","p_6_11","p_6_12","p_6_13","p_6_14","p_6_15"],"flag":"assets/flags/de.png","emoji":"🇩🇪","bonus":{"DEFENSA":5},"style":"maquinaria_alemana"},
  {"id":"team_7","name":"Alemania 2014","players":["p_7_0","p_7_1","p_7_2","p_7_3","p_7_4","p_7_5","p_7_6","p_7_7","p_7_8","p_7_9","p_7_10","p_7_11","p_7_12","p_7_13","p_7_14","p_7_15"],"flag":"assets/flags/de.png","emoji":"🇩🇪","bonus":{"DEFENSA":5},"style":"gegenpressing"},
  {"id":"team_8","name":"Argentina 1986","players":["p_8_0","p_8_1","p_8_2","p_8_3","p_8_4","p_8_5","p_8_6","p_8_7","p_8_8","p_8_9","p_8_10","p_8_11","p_8_12","p_8_13","p_8_14","p_8_15"],"flag":"assets/flags/ar.png","emoji":"🇦🇷","bonus":{"ATAQUE":5},"style":"magia_individual"},
  {"id":"team_9","name":"Argentina 2022","players":["p_9_0","p_9_1","p_9_2","p_9_3","p_9_4","p_9_5","p_9_6","p_9_7","p_9_8","p_9_9","p_9_10","p_9_11","p_9_12","p_9_13","p_9_14","p_9_15"],"flag":"assets/flags/ar.png","emoji":"🇦🇷","bonus":{"ATAQUE":5},"style":"la_scaloneta"},
  {"id":"team_10","name":"Francia 1998","players":["p_10_0","p_10_1","p_10_2","p_10_3","p_10_4","p_10_5","p_10_6","p_10_7","p_10_8","p_10_9","p_10_10","p_10_11","p_10_12","p_10_13","p_10_14","p_10_15"],"flag":"assets/flags/fr.png","emoji":"🏳️","bonus":{"PASE":2},"style":"solidez_francesa"},
  {"id":"team_11","name":"Francia 2018","players":["p_11_0","p_11_1","p_11_2","p_11_3","p_11_4","p_11_5","p_11_6","p_11_7","p_11_8","p_11_9","p_11_10","p_11_11","p_11_12","p_11_13","p_11_14","p_11_15"],"flag":"assets/flags/fr.png","emoji":"🏳️","bonus":{"PASE":2},"style":"velocidad_punzante"},
  {"id":"team_13","name":"Italia 2006","players":["p_13_0","p_13_1","p_13_2","p_13_3","p_13_4","p_13_5","p_13_6","p_13_7","p_13_8","p_13_9","p_13_10","p_13_11","p_13_12","p_13_13","p_13_14","p_13_15"],"flag":"assets/flags/it.png","emoji":"🇮🇹","bonus":{"DEFENSA":5},"style":"catenaccio"},
  {"id":"team_17","name":"Portugal 2016","players":["p_17_0","p_17_1","p_17_2","p_17_3","p_17_4","p_17_5","p_17_6","p_17_7","p_17_8","p_17_9","p_17_10","p_17_11","p_17_12","p_17_13","p_17_14","p_17_15"],"flag":"assets/flags/pt.png","emoji":"🇵🇹","bonus":{"TÉCNICA":3},"style":"garra_lusa"},
  {"id":"team_18","name":"Croacia 2018","players":["p_18_0","p_18_1","p_18_2","p_18_3","p_18_4","p_18_5","p_18_6","p_18_7","p_18_8","p_18_9","p_18_10","p_18_11","p_18_12","p_18_13","p_18_14","p_18_15"],"emoji":"🇭🇷","bonus":{"PASE":3},"style":"muralla_balcanica"},
  {"id":"team_21","name":"Dinamarca 1992","players":["p_21_0","p_21_1","p_21_2","p_21_3","p_21_4","p_21_5","p_21_6","p_21_7","p_21_8","p_21_9","p_21_10","p_21_11","p_21_12","p_21_13","p_21_14","p_21_15"],"emoji":"🏳️","bonus":{"PASE":2},"style":"dinamita_danesa"},
  {"id":"team_22","name":"Bélgica 2018","players":["p_22_0","p_22_1","p_22_2","p_22_3","p_22_4","p_22_5","p_22_6","p_22_7","p_22_8","p_22_9","p_22_10","p_22_11","p_22_12","p_22_13","p_22_14","p_22_15"],"emoji":"🏳️","bonus":{"PASE":2},"style":"velocidad_punzante"},
  {"id":"team_23","name":"México 1986","players":["p_23_0","p_23_1","p_23_2","p_23_3","p_23_4","p_23_5","p_23_6","p_23_7","p_23_8","p_23_9","p_23_10","p_23_11","p_23_12","p_23_13","p_23_14","p_23_15"],"flag":"assets/flags/mx.png","emoji":"🏳️","bonus":{"PASE":2},"style":"tricolor_tecnico"},
  {"id":"team_24","name":"Estados Unidos 2002","players":["p_24_0","p_24_1","p_24_2","p_24_3","p_24_4","p_24_5","p_24_6","p_24_7","p_24_8","p_24_9","p_24_10","p_24_11","p_24_12","p_24_13","p_24_14","p_24_15"],"emoji":"🏳️","bonus":{"PASE":2},"style":"garra_yanqui"},
  {"id":"team_25","name":"Japón 2002","players":["p_25_0","p_25_1","p_25_2","p_25_3","p_25_4","p_25_5","p_25_6","p_25_7","p_25_8","p_25_9","p_25_10","p_25_11","p_25_12","p_25_13","p_25_14","p_25_15"],"emoji":"🏳️","bonus":{"PASE":2},"style":"disciplina_nipona"},
  {"id":"team_26","name":"Corea del Sur 2002","players":["p_26_0","p_26_1","p_26_2","p_26_3","p_26_4","p_26_5","p_26_6","p_26_7","p_26_8","p_26_9","p_26_10","p_26_11","p_26_12","p_26_13","p_26_14","p_26_15"],"emoji":"🏳️","bonus":{"PASE":2},"style":"futbol_directo"},
  {"id":"team_27","name":"Marruecos 2022","players":["p_27_0","p_27_1","p_27_2","p_27_3","p_27_4","p_27_5","p_27_6","p_27_7","p_27_8","p_27_9","p_27_10","p_27_11","p_27_12","p_27_13","p_27_14","p_27_15"],"emoji":"🏳️","bonus":{"PASE":2},"style":"muralla_atlas"},
  {"id":"team_28","name":"Nigeria 1994","players":["p_28_0","p_28_1","p_28_2","p_28_3","p_28_4","p_28_5","p_28_6","p_28_7","p_28_8","p_28_9","p_28_10","p_28_11","p_28_12","p_28_13","p_28_14","p_28_15"],"emoji":"🏳️","bonus":{"PASE":2},"style":"superaguilas"},
  {"id":"team_29","name":"Camerún 1990","players":["p_29_0","p_29_1","p_29_2","p_29_3","p_29_4","p_29_5","p_29_6","p_29_7","p_29_8","p_29_9","p_29_10","p_29_11","p_29_12","p_29_13","p_29_14","p_29_15"],"flag":"assets/flags/cm.png","emoji":"🏳️","bonus":{"PASE":2},"style":"leones_indomables"},
  {"id":"team_31","name":"Paraguay 2010","players":["p_31_0","p_31_1","p_31_2","p_31_3","p_31_4","p_31_5","p_31_6","p_31_7","p_31_8","p_31_9","p_31_10","p_31_11","p_31_12","p_31_13","p_31_14","p_31_15"],"flag":"assets/flags/py.png","emoji":"🏳️","bonus":{"PASE":2},"style":"muralla_guarani"},
  {"id":"team_32","name":"Colombia 2014","players":["p_32_0","p_32_1","p_32_2","p_32_3","p_32_4","p_32_5","p_32_6","p_32_7","p_32_8","p_32_9","p_32_10","p_32_11","p_32_12","p_32_13","p_32_14","p_32_15"],"emoji":"🏳️","bonus":{"PASE":2},"style":"fiesta_cafetera"},
  {"id":"team_40","name":"Turquía 2002","players":["p_40_0","p_40_1","p_40_2","p_40_3","p_40_4","p_40_5","p_40_6","p_40_7","p_40_8","p_40_9","p_40_10","p_40_11","p_40_12","p_40_13","p_40_14","p_40_15"],"emoji":"🏳️","bonus":{"PASE":2},"style":"furia_otomana"},
  {"id":"team_41","name":"Grecia 2004","players":["p_41_0","p_41_1","p_41_2","p_41_3","p_41_4","p_41_5","p_41_6","p_41_7","p_41_8","p_41_9","p_41_10","p_41_11","p_41_12","p_41_13","p_41_14","p_41_15"],"emoji":"🏳️","bonus":{"PASE":2},"style":"milagro_defensivo"},
  {"id":"team_42","name":"Rumanía 1994","players":["p_42_0","p_42_1","p_42_2","p_42_3","p_42_4","p_42_5","p_42_6","p_42_7","p_42_8","p_42_9","p_42_10","p_42_11","p_42_12","p_42_13","p_42_14","p_42_15"],"emoji":"🏳️","bonus":{"PASE":2},"style":"magia_carpatica"},
  {"id":"team_43","name":"Irlanda 1990","players":["p_43_0","p_43_1","p_43_2","p_43_3","p_43_4","p_43_5","p_43_6","p_43_7","p_43_8","p_43_9","p_43_10","p_43_11","p_43_12","p_43_13","p_43_14","p_43_15"],"emoji":"🏳️","bonus":{"PASE":2},"style":"muralla_celta"},
  {"id":"team_46","name":"Rusia 2018","players":["p_46_0","p_46_1","p_46_2","p_46_3","p_46_4","p_46_5","p_46_6","p_46_7","p_46_8","p_46_9","p_46_10","p_46_11","p_46_12","p_46_13","p_46_14","p_46_15"],"flag":"assets/flags/ru.png","emoji":"🏳️","bonus":{"PASE":2},"style":"punta_lanza"},
  {"id":"team_47","name":"Ucrania 2006","players":["p_47_0","p_47_1","p_47_2","p_47_3","p_47_4","p_47_5","p_47_6","p_47_7","p_47_8","p_47_9","p_47_10","p_47_11","p_47_12","p_47_13","p_47_14","p_47_15"],"emoji":"🏳️","bonus":{"PASE":2},"style":"tecnica_centroeuropea"},
  {"id":"team_48","name":"Serbia 2010","players":["p_48_0","p_48_1","p_48_2","p_48_3","p_48_4","p_48_5","p_48_6","p_48_7","p_48_8","p_48_9","p_48_10","p_48_11","p_48_12","p_48_13","p_48_14","p_48_15"],"emoji":"🇷🇸","bonus":{"PASE":2},"style":"tecnica_balcanica"},
  {"id":"team_49","name":"Noruega 1998","players":["p_49_0","p_49_1","p_49_2","p_49_3","p_49_4","p_49_5","p_49_6","p_49_7","p_49_8","p_49_9","p_49_10","p_49_11","p_49_12","p_49_13","p_49_14","p_49_15"],"emoji":"🏳️","bonus":{"PASE":2},"style":"vikingo_directo"},
  {"id":"team_brasil_1982","name":"Brasil 1982","style":"samba_total","players":["p_team_brasil_1982_0","p_team_brasil_1982_1","p_team_brasil_1982_2","p_team_brasil_1982_3","p_team_brasil_1982_4","p_team_brasil_1982_5","p_team_brasil_1982_6","p_team_brasil_1982_7","p_team_brasil_1982_8","p_team_brasil_1982_9","p_team_brasil_1982_10","p_team_brasil_1982_11","p_team_brasil_1982_12","p_team_brasil_1982_13","p_team_brasil_1982_14","p_team_brasil_1982_15"]},
  {"id":"team_argentina_1978","name":"Argentina 1978","style":"magia_individual","players":["p_team_argentina_1978_0","p_team_argentina_1978_1","p_team_argentina_1978_2","p_team_argentina_1978_3","p_team_argentina_1978_4","p_team_argentina_1978_5","p_team_argentina_1978_6","p_team_argentina_1978_7","p_team_argentina_1978_8","p_team_argentina_1978_9","p_team_argentina_1978_10","p_team_argentina_1978_11","p_team_argentina_1978_12","p_team_argentina_1978_13","p_team_argentina_1978_14","p_team_argentina_1978_15"]},
  {"id":"team_senegal_2002","name":"Senegal 2002","style":"superaguilas","players":["p_team_senegal_2002_0","p_team_senegal_2002_1","p_team_senegal_2002_2","p_team_senegal_2002_3","p_team_senegal_2002_4","p_team_senegal_2002_5","p_team_senegal_2002_6","p_team_senegal_2002_7","p_team_senegal_2002_8","p_team_senegal_2002_9","p_team_senegal_2002_10","p_team_senegal_2002_11","p_team_senegal_2002_12","p_team_senegal_2002_13","p_team_senegal_2002_14","p_team_senegal_2002_15"]},
  {"id":"team_costa_rica_2014","name":"Costa Rica 2014","style":"catenaccio","players":["p_team_costa_rica_2014_0","p_team_costa_rica_2014_1","p_team_costa_rica_2014_2","p_team_costa_rica_2014_3","p_team_costa_rica_2014_4","p_team_costa_rica_2014_5","p_team_costa_rica_2014_6","p_team_costa_rica_2014_7","p_team_costa_rica_2014_8","p_team_costa_rica_2014_9","p_team_costa_rica_2014_10","p_team_costa_rica_2014_11","p_team_costa_rica_2014_12","p_team_costa_rica_2014_13","p_team_costa_rica_2014_14","p_team_costa_rica_2014_15"]},
  {"id":"team_ghana_2010","name":"Ghana 2010","style":"superaguilas","players":["p_team_ghana_2010_0","p_team_ghana_2010_1","p_team_ghana_2010_2","p_team_ghana_2010_3","p_team_ghana_2010_4","p_team_ghana_2010_5","p_team_ghana_2010_6","p_team_ghana_2010_7","p_team_ghana_2010_8","p_team_ghana_2010_9","p_team_ghana_2010_10","p_team_ghana_2010_11","p_team_ghana_2010_12","p_team_ghana_2010_13","p_team_ghana_2010_14","p_team_ghana_2010_15"]},
  {"id":"team_uruguay_2010","name":"Uruguay 2010","style":"garra_charrua","players":["p_team_uruguay_2010_0","p_team_uruguay_2010_1","p_team_uruguay_2010_2","p_team_uruguay_2010_3","p_team_uruguay_2010_4","p_team_uruguay_2010_5","p_team_uruguay_2010_6","p_team_uruguay_2010_7","p_team_uruguay_2010_8","p_team_uruguay_2010_9","p_team_uruguay_2010_10","p_team_uruguay_2010_11","p_team_uruguay_2010_12","p_team_uruguay_2010_13","p_team_uruguay_2010_14","p_team_uruguay_2010_15"]},
  {"id":"team_suecia_1994","name":"Suecia 1994","style":"vikingo_directo","players":["p_team_suecia_1994_0","p_team_suecia_1994_1","p_team_suecia_1994_2","p_team_suecia_1994_3","p_team_suecia_1994_4","p_team_suecia_1994_5","p_team_suecia_1994_6","p_team_suecia_1994_7","p_team_suecia_1994_8","p_team_suecia_1994_9","p_team_suecia_1994_10","p_team_suecia_1994_11","p_team_suecia_1994_12","p_team_suecia_1994_13","p_team_suecia_1994_14","p_team_suecia_1994_15"]},
  {"id":"team_holanda_1988","name":"Holanda 1988","style":"total_football","players":["p_team_holanda_1988_0","p_team_holanda_1988_1","p_team_holanda_1988_2","p_team_holanda_1988_3","p_team_holanda_1988_4","p_team_holanda_1988_5","p_team_holanda_1988_6","p_team_holanda_1988_7","p_team_holanda_1988_8","p_team_holanda_1988_9","p_team_holanda_1988_10","p_team_holanda_1988_11","p_team_holanda_1988_12","p_team_holanda_1988_13","p_team_holanda_1988_14","p_team_holanda_1988_15"]}
];
const STYLES = {
 tiki_taka:{name:"Tiki-Taka",bonuses:{passing:10,pace:5}},
 samba_total:{name:"Samba Total",bonuses:{attack:8,technique:7}},
 ataque_letal:{name:"Ataque Letal",bonuses:{attack:10,pace:5}},
 maquinaria_alemana:{name:"Maquinaria Alemana",bonuses:{defense:8,technique:4,passing:3}},
 gegenpressing:{name:"Gegenpressing",bonuses:{pace:9,defense:6}},
 magia_individual:{name:"Magia Albiceleste",bonuses:{attack:10,technique:5}},
 la_scaloneta:{name:"La Scaloneta",bonuses:{defense:9,passing:6}},
 solidez_francesa:{name:"Solidez Francesa",bonuses:{defense:8,passing:4,pace:3}},
 velocidad_punzante:{name:"Velocidad Punzante",bonuses:{pace:10,attack:5}},
 catenaccio:{name:"Catenaccio",bonuses:{defense:12,passing:3}},
 total_football:{name:"Fútbol Total",bonuses:{passing:6,technique:6,pace:3}},
 naranja_mecanica:{name:"Naranja Mecánica",bonuses:{technique:8,passing:5,pace:2}},
 futbol_directo:{name:"Fútbol Directo",bonuses:{pace:8,attack:4,defense:3}},
 garra_lusa:{name:"Garra Lusa",bonuses:{defense:7,technique:4,pace:4}},
 muralla_balcanica:{name:"Muralla Balcánica",bonuses:{defense:12,technique:3}},
 garra_charrua:{name:"Garra Charrúa",bonuses:{defense:8,attack:5,pace:2}},
 once_oro_magiar:{name:"Once de Oro Magiar",bonuses:{technique:10,passing:5}},
 dinamita_danesa:{name:"Dinamita Danesa",bonuses:{pace:8,attack:6}},
 tricolor_tecnico:{name:"Tricolor Técnico",bonuses:{technique:8,passing:5}},
 garra_yanqui:{name:"Garra Yanqui",bonuses:{defense:8,pace:5}},
 disciplina_nipona:{name:"Disciplina Nipona",bonuses:{passing:8,technique:5}},
 muralla_atlas:{name:"Muralla del Atlas",bonuses:{defense:10,pace:4}},
 superaguilas:{name:"Superáguilas",bonuses:{pace:8,attack:6}},
 leones_indomables:{name:"Leones Indomables",bonuses:{attack:8,defense:5}},
 garra_chilena:{name:"Garra Chilena",bonuses:{attack:7,technique:5}},
 muralla_guarani:{name:"Muralla Guaraní",bonuses:{defense:11,passing:3}},
 fiesta_cafetera:{name:"Fiesta Cafetera",bonuses:{attack:8,technique:5}},
 vendaval_incaico:{name:"Vendaval Incaico",bonuses:{attack:8,pace:5}},
 disciplina_vikinga:{name:"Disciplina Vikinga",bonuses:{defense:7,pace:5}},
 tecnica_centroeuropea:{name:"Técnica Centroeuropea",bonuses:{technique:8,passing:5}},
 tecnica_balcanica:{name:"Técnica Balcánica",bonuses:{technique:9,passing:4}},
 wunderteam:{name:"Wunderteam",bonuses:{attack:9,technique:4}},
 sistema_cerrojo:{name:"Sistema del Cerrojo",bonuses:{defense:10,passing:4}},
 furia_otomana:{name:"Furia Otomana",bonuses:{pace:8,defense:5}},
 milagro_defensivo:{name:"Milagro Defensivo",bonuses:{defense:12,passing:2}},
 magia_carpatica:{name:"Magia Cárpata",bonuses:{technique:9,attack:4}},
 furia_tartan:{name:"Furia Tartán",bonuses:{attack:7,pace:5}},
 muralla_celta:{name:"Muralla Celta",bonuses:{defense:8,technique:4}},
 punta_lanza:{name:"Punta de Lanza",bonuses:{attack:9,pace:4}},
 vikingo_directo:{name:"Vikingo Directo",bonuses:{defense:8,pace:5}}
};
const STAT_LABELS={attack:"ATAQUE",defense:"DEFENSA",pace:"RITMO",passing:"PASE",technique:"TÉCNICA"};

/* ========= MATCH STRATEGIES (chosen before each match) ========= */
// Each strategy can be played, and "counters" points to the strategy key it beats.
// Counter logic is based on real footballing logic:
//  - Tiki-Taka breaks Bloque Bajo (patience unlocks low blocks) and is broken by Presión Alta
//  - Catenaccio is broken by Ataque por Bandas (wide play opens compact centers)
//  - Gegenpressing is broken by Juego Directo (skip the press with long balls)
//  - etc.
const STRATEGIES = {
  tiki_taka:      { name:"Tiki-Taka",          desc:"Prioriza los pases cortos y la posesión para desgastar al rival y crear espacios.", counters:"bloque_bajo", partialCounters:["gegenpressing","presion_alta"] },
  contraataque:   { name:"Contraataque",        desc:"Defiende con orden y busca atacar rápidamente tras recuperar el balón.", counters:"ataque_bandas", partialCounters:["posesion","presion_alta"] },
  catenaccio:     { name:"Catenaccio",          desc:"Centra sus esfuerzos en la defensa y aprovecha las pocas oportunidades de ataque.", counters:"juego_directo", partialCounters:["ataque_bandas","presion_alta"] },
  presion_alta:   { name:"Presión Alta",        desc:"Presiona al rival en su campo para recuperar el balón cuanto antes.", counters:"tiki_taka", partialCounters:["juego_directo","catenaccio"] },
  gegenpressing:  { name:"Gegenpressing",       desc:"Tras perder la posesión, todo el equipo intenta recuperarla inmediatamente.", counters:"posesion", partialCounters:["catenaccio","juego_directo"] },
  posesion:       { name:"Juego de Posesión",   desc:"Mantiene el control del balón para dominar el ritmo del partido.", counters:"contraataque", partialCounters:["presion_alta","gegenpressing"] },
  juego_directo:  { name:"Juego Directo",       desc:"Busca llegar al área rival con rapidez y el menor número de pases posible.", counters:"gegenpressing", partialCounters:["catenaccio","bloque_bajo"] },
  futbol_total:   { name:"Fútbol Total",        desc:"Los jugadores intercambian posiciones constantemente para generar superioridades.", counters:"catenaccio", partialCounters:["bloque_bajo","contraataque"] },
  bloque_bajo:    { name:"Bloque Bajo",         desc:"Repliega al equipo cerca de su área para cerrar espacios y dificultar los ataques rivales.", counters:"futbol_total", partialCounters:["posesion","catenaccio"] },
  ataque_bandas:  { name:"Ataque por Bandas",   desc:"Utiliza las bandas para crear peligro mediante desbordes y centros al área.", counters:"presion_alta", partialCounters:["contraataque","gegenpressing"] },
};
const STRATEGY_ORDER=["tiki_taka","contraataque","catenaccio","presion_alta","gegenpressing","posesion","juego_directo","futbol_total","bloque_bajo","ataque_bandas"];

// Map each of the 38 narrative team styles to one of the 10 match strategies,
// based on which strategy best reflects that team's footballing identity.
const TEAM_STYLE_TO_STRATEGY={
  tiki_taka:"tiki_taka", samba_total:"futbol_total", ataque_letal:"juego_directo",
  maquinaria_alemana:"presion_alta", gegenpressing:"gegenpressing", magia_individual:"contraataque",
  la_scaloneta:"contraataque", solidez_francesa:"bloque_bajo", velocidad_punzante:"ataque_bandas",
  catenaccio:"catenaccio", total_football:"futbol_total", naranja_mecanica:"tiki_taka",
  futbol_directo:"juego_directo", garra_lusa:"contraataque", muralla_balcanica:"catenaccio",
  garra_charrua:"bloque_bajo", once_oro_magiar:"tiki_taka", dinamita_danesa:"ataque_bandas",
  tricolor_tecnico:"posesion", garra_yanqui:"bloque_bajo", disciplina_nipona:"posesion",
  muralla_atlas:"catenaccio", superaguilas:"ataque_bandas", leones_indomables:"contraataque",
  garra_chilena:"presion_alta", muralla_guarani:"catenaccio", fiesta_cafetera:"posesion",
  vendaval_incaico:"ataque_bandas", disciplina_vikinga:"bloque_bajo", tecnica_centroeuropea:"posesion",
  tecnica_balcanica:"tiki_taka", wunderteam:"juego_directo", sistema_cerrojo:"catenaccio",
  furia_otomana:"presion_alta", milagro_defensivo:"bloque_bajo", magia_carpatica:"posesion",
  furia_tartan:"presion_alta", muralla_celta:"bloque_bajo", punta_lanza:"juego_directo",
  vikingo_directo:"juego_directo",
};
let selectedMatchStrategy=null; // strategy key chosen by the player for the upcoming match

let teams = rawTeams.map(function(t){
 const styleInfo = STYLES[t.style];
 return {
  name:t.name,
  flag:"es",
  _styleKey:t.style||"",
  style:styleInfo?styleInfo.name:(t.style?"Clásico":"Clásico"),
  bonuses:styleInfo?styleInfo.bonuses:(t.bonus?{attack:(t.bonus.ATAQUE||0),defense:(t.bonus.DEFENSA||0),pace:(t.bonus.RITMO||0),passing:(t.bonus.PASE||0),technique:(t.bonus.TÉCNICA||0)}:{}),
  players:t.players.map(function(pid){var p=playersDB.find(x=>x.id===pid); return p?{name:p.name,positions:p.positions||["MC"],rating:p.overall||75}:null;}).filter(Boolean)
 };
});
let dataLoaded=true;
console.log("Loaded",teams.length,"teams locally");

/* ========================================================
   GOAL2GOAT — GAME LOGIC
   ======================================================== */

/* ---------- AUDIO SYSTEM (synthesized, no files needed) ---------- */
let audioEnabled=true;
try{
  const savedAudio=localStorage.getItem('g2g_audioEnabled');
  if(savedAudio!==null) audioEnabled=(savedAudio==='true');
}catch(e){}
let audioCtx=null;
function getAudioCtx(){
  if(!audioCtx){
    try{ audioCtx=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ audioCtx=null; }
  }
  if(audioCtx&&audioCtx.state==='suspended') audioCtx.resume();
  return audioCtx;
}
function tone(ctx, freq, start, dur, type, gainPeak, gainEnd){
  const osc=ctx.createOscillator();
  const gain=ctx.createGain();
  osc.type=type||'sine';
  osc.frequency.setValueAtTime(freq, ctx.currentTime+start);
  gain.gain.setValueAtTime(0.0001, ctx.currentTime+start);
  gain.gain.exponentialRampToValueAtTime(gainPeak||0.2, ctx.currentTime+start+0.01);
  gain.gain.exponentialRampToValueAtTime(gainEnd||0.0001, ctx.currentTime+start+dur);
  osc.connect(gain); gain.connect(ctx.destination);
  osc.start(ctx.currentTime+start);
  osc.stop(ctx.currentTime+start+dur+0.02);
}
function playSound(name){
  if(!audioEnabled) return;
  const ctx=getAudioCtx();
  if(!ctx) return;
  switch(name){
    case 'select': // simple menu click
      tone(ctx, 880, 0, 0.07, 'square', 0.08, 0.0001);
      break;
    case 'spin': // slot-machine tick (called repeatedly while reels spin)
      tone(ctx, 520+Math.random()*120, 0, 0.045, 'square', 0.05, 0.0001);
      break;
    case 'reveal': // result of the spin lands
      tone(ctx, 660, 0, 0.09, 'triangle', 0.12, 0.0001);
      tone(ctx, 990, 0.05, 0.12, 'triangle', 0.10, 0.0001);
      break;
    case 'goal': // football-style rising "goooal" sting
      tone(ctx, 440, 0, 0.12, 'sawtooth', 0.10, 0.0001);
      tone(ctx, 660, 0.1, 0.12, 'sawtooth', 0.10, 0.0001);
      tone(ctx, 880, 0.2, 0.18, 'sawtooth', 0.12, 0.0001);
      break;
    case 'victory': // upbeat fanfare arpeggio
      [523,659,784,1046,1318].forEach((f,i)=>tone(ctx, f, i*0.11, 0.28, 'triangle', 0.14, 0.0001));
      break;
    case 'defeat': // descending sad tone + low thud
      [392,349,294,196].forEach((f,i)=>tone(ctx, f, i*0.16, 0.35, 'sawtooth', 0.10, 0.0001));
      tone(ctx, 80, 0.5, 0.4, 'sine', 0.18, 0.0001);
      break;
    case 'whistle': // referee whistle for match start/end accents
      tone(ctx, 1800, 0, 0.18, 'square', 0.06, 0.0001);
      tone(ctx, 2000, 0.16, 0.16, 'square', 0.06, 0.0001);
      break;
    case 'scratch_good': // casilla buena al rascar — pitch pasado como data
      tone(ctx, 520, 0, 0.06, 'sine', 0.10, 0.0001);
      tone(ctx, 780, 0.04, 0.09, 'sine', 0.08, 0.0001);
      break;
    case 'scratch_star': // casilla cabra — más dramático
      [520,660,880,1100].forEach((f,i)=>tone(ctx, f, i*0.06, 0.10, 'triangle', 0.12, 0.0001));
      break;
    case 'scratch_bomb': // casilla bomba — sonido de derrumbe
      [300,240,180,120].forEach((f,i)=>tone(ctx, f, i*0.07, 0.15, 'sawtooth', 0.12, 0.0001));
      tone(ctx, 80, 0.28, 0.4, 'sine', 0.18, 0.0001);
      break;
  }
}

/* ---------- STYLE HINTS for rivals ---------- */
const STYLE_HINTS = {
  jogo_bonito:"El fútbol más bonito y creativo. Sus jugadores pueden resolver el partido en cualquier momento.",
  gegenpress:"Presión tras pérdida y transiciones rápidas. No dan descanso al rival.",
  defensivo:"Bloque compacto y salida rápida. Peligrosos en el contragolpe.",
  directo:"Juego vertical y ritmo alto. No dan tiempo a pensar.",
  contraataque:"Espera y golpea. Letales cuando tienen espacios.",
  tiki_taka:"Dominan el balón y presionan en campo rival desde el primer minuto, pero un bloque bajo y bien plantado les incomoda, y la velocidad a la espalda les genera muchos problemas.",
  samba_total:"Su ataque desborda con calidad individual, pero a cambio dejan huecos enormes en defensa que cualquier transición rápida puede aprovechar.",
  catenaccio:"Apenas conceden ocasiones claras, un bloque bajo y compacto que sostiene el resultado durante los noventa minutos sin apenas despeinarse.",
  gegenpressing:"Presionan sin descanso y recuperan el balón muy arriba, agotando físicamente al rival que intenta jugar con calma desde atrás.",
  total_football:"Rotan posiciones constantemente y atacan desde cualquier zona del campo, lo que exige mantener el orden colectivo en todo momento.",
  maquinaria_alemana:"Eficientes y disciplinados, sin apenas fisuras durante el partido, un rival que no perdona los errores propios.",
  magia_individual:"Casi todo su peligro pasa por un par de jugadores desequilibrantes; el resto del equipo pasa bastante desapercibido.",
  garra_charrua:"Entrega física y mentalidad guerrera por encima de todo, aunque a veces les falta algo de calidad con el balón en los pies.",
  ataque_letal:"Tienen una delantera que castiga cualquier error, aunque su defensa concede más ocasiones de las que debería.",
  solidez_francesa:"Defensa muy sólida y poco vistosa, pero les cuesta generar peligro real cuando tienen el balón.",
  velocidad_punzante:"Transiciones rapidísimas que castigan cualquier espacio dejado a la espalda de la defensa.",
  garra_lusa:"Intensidad física y calidad individual en los duelos uno contra uno por todo el campo.",
  futbol_directo:"Apuestan por el juego directo y los balones largos, con pocas florituras pero mucha insistencia en los duelos aéreos.",
  naranja_mecanica:"Creativos y técnicos, capaces de generar peligro desde cualquier posición del campo.",
  muralla_balcanica:"Una defensa paciente y muy difícil de superar, que espera su momento sin precipitarse.",
  muralla_atlas:"Su organización defensiva ha sorprendido a selecciones mucho más reputadas en los últimos torneos.",
  once_oro_magiar:"Uno de los ataques más prolíficos de la historia, capaz de anotar con facilidad ante cualquier rival.",
  dinamita_danesa:"Un equipo impredecible que, en su mejor versión, puede complicarle la vida a cualquiera.",
  garra_española:"Energía y lucha constante, aunque a veces la pasión les pesa más que la calidad técnica.",
  disciplina_nipona:"Muy organizados y trabajadores, aunque con poco peligro real cuando llegan al área rival.",
  disciplina_vikinga:"Un bloque ordenado y físico, sin demasiadas individualidades que desequilibren el partido.",
  fiesta_cafetera:"Mucho talento técnico y ofensivo, aunque su defensa muestra dudas de vez en cuando.",
  furia_otomana:"Juegan con mucha intensidad y pasión, al límite en cada disputa del partido.",
  furia_tartan:"Carácter combativo y fuertes en el choque, aunque algo limitados con el balón en los pies.",
  garra_chilena:"Compensan con actitud y lucha lo que les pueda faltar en calidad técnica.",
  garra_yanqui:"Físicos, disciplinados y muy difíciles de batir por la mínima diferencia.",
  la_scaloneta:"Un bloque sólido con un líder de clase mundial arriba, muy completos en todas las líneas.",
  leones_indomables:"Explosivos físicamente y muy peligrosos cuando encuentran espacios para correr al contraataque.",
  magia_carpatica:"Jugadores con mucho talento individual, aunque algo inconsistentes como conjunto.",
  milagro_defensivo:"Un bloque muy disciplinado que ya ha frenado a algunos de los mejores ataques del mundo.",
  muralla_celta:"Defensa férrea y muy compacta, conceden muy pocas ocasiones claras durante el partido.",
  muralla_guarani:"Defensa sacrificada y muy ordenada, suben pocos jugadores cuando atacan.",
  punta_lanza:"Su peligro ofensivo depende en gran medida de un delantero de referencia que marca la diferencia.",
  sistema_cerrojo:"Un bloque ultra defensivo cuya prioridad absoluta es no encajar goles, cueste lo que cueste.",
  tecnica_balcanica:"Buen toque de balón y jugadores con clase, aunque defensivamente pueden mostrar algunas dudas.",
  tecnica_centroeuropea:"Técnica depurada y buen juego colectivo, con un ritmo de partido más bien pausado.",
  tricolor_tecnico:"Habilidosos y vistosos con el balón, aunque pueden verse superados ante la intensidad.",
  vendaval_incaico:"Buen toque de balón y jugadores desequilibrantes cuando llegan a campo rival.",
  vikingo_directo:"Físicos y directos, especialmente peligrosos en el juego aéreo.",
  superaguilas:"Explosivos físicamente, con jugadores desequilibrantes que aprovechan los espacios a la carrera.",
  wunderteam:"Un equipo técnico y ofensivo con una gran tradición histórica a sus espaldas.",
};

/* ---------- TEAM SCOUT HINTS ---------- */
function getScoutHint(team){
  const s = team._styleKey || '';
  // Purely descriptive — never names the strategy or tells the player what to pick.
  // The player must read between the lines and deduce the right counter themselves.
  return STYLE_HINTS[s] || "Información de scouting no disponible. Prepárate para cualquier escenario.";
}

/* ---------- STATE ---------- */
const teamStats = { attack:0, defense:0, pace:0, passing:0, technique:0 };
let selectedPlayer = null;
let phase = "draft"; // draft | bench | ready
let usedPlayers = [];
let bench = [];
let draftedCount = 0;
let baseTeamOVR = null;
let benchCount = 0;
let nextOpponent = null;
let swapsUsedThisMatch = 0;

/* ========= ROGUELIKE SYSTEMS STATE ========= */
// Morale: -50 to +50, starts at 0, affects match lambda
let teamMorale = 0;
window.CHEATS_ACTIVE = false;
const CHEAT_USER = 'jesuslor85@gmail.com';
// Scorer streaks: map playerName -> consecutive matches scored
let scorerStreaks = {};
// Current match weather
let currentWeather = null;
// Inherited players from previous run (names)
let inheritedPlayers = [];
// Best knockout round reached in current run (for chain run reward)
let bestRoundReached = -1; // -1=none, 0=groups, 1=octavos, 2=cuartos, 3=semis, 4=final
const WEATHER_TYPES = [
  { id:'sunny',    label:'☀ Soleado',         desc:'Calor intenso · RITMO -15% ambos equipos',    effect:{pace:-0.10} },
  { id:'cloudy',   label:'⛅ Nublado',          desc:'Condiciones neutras',                          effect:{} },
  { id:'rain',     label:'🌧 Lluvia',           desc:'Campo pesado · RITMO -20%, TÉCNICA -10%',     effect:{pace:-0.15, technique:-0.08} },
  { id:'wind',     label:'💨 Viento fuerte',    desc:'Juego directo · PASE -15%',                   effect:{passing:-0.12} },
  { id:'hot',      label:'🌡 Calor extremo',    desc:'Fatiga máxima · RITMO -25%, DEFENSA -10%',    effect:{pace:-0.20, defense:-0.08} },
];
/* Predictive pre-match press questions: shown when the rival is revealed,
   BEFORE the match is played. Each answer is a prediction (positive/neutral/
   negative). After the match, the prediction is checked against the real
   result: correct guess -> moral up, wrong guess -> moral down, neutral
   answer -> moral stays the same regardless of outcome. */
const PRESS_PREDICTIONS = [
  {
    q: "«¿Dejaréis la portería a cero en este encuentro?»",
    answers: [
      { text: "«Sí, vamos a por la portería a cero.»", stance: "positive", label: "Confiado",
        check: (r) => r.oppGoals === 0 },
      { text: "«Es difícil de prometer, ya veremos.»", stance: "neutral", label: "Prudente",
        check: () => null },
      { text: "«Lo veo complicado, encajaremos.»", stance: "negative", label: "Pesimista",
        check: (r) => r.oppGoals > 0 },
    ]
  },
  {
    q: "«¿Vais a ganar por tres goles o más?»",
    answers: [
      { text: "«Sí, vamos a golear.»", stance: "positive", label: "Ambicioso",
        check: (r) => (r.myGoals - r.oppGoals) >= 3 },
      { text: "«No me atrevo a predecir el marcador.»", stance: "neutral", label: "Cauto",
        check: () => null },
      { text: "«No, será un partido ajustado.»", stance: "negative", label: "Realista",
        check: (r) => (r.myGoals - r.oppGoals) < 3 },
    ]
  },
  {
    q: "«Lleváis varios partidos viendo tarjetas. ¿Seguiréis acumulando en este encuentro?»",
    answers: [
      { text: "«No, vamos a jugar limpio esta vez.»", stance: "positive", label: "Comprometido",
        check: (r) => r.cardsCount === 0 },
      { text: "«No puedo controlar lo que pite el árbitro.»", stance: "neutral", label: "Evasivo",
        check: () => null },
      { text: "«Es probable, el rival nos hará cometer faltas.»", stance: "negative", label: "Sincero",
        check: (r) => r.cardsCount > 0 },
    ]
  },
  {
    q: "«¿Marcaréis en la primera mitad?»",
    answers: [
      { text: "«Sí, saldremos a por todas desde el inicio.»", stance: "positive", label: "Decidido",
        check: (r) => r.myGoals > 0 },
      { text: "«El plan de partido lo decide el míster.»", stance: "neutral", label: "Diplomático",
        check: () => null },
      { text: "«Seremos pacientes, no hay prisa por marcar.»", stance: "negative", label: "Paciente",
        check: (r) => r.myGoals === 0 },
    ]
  },
  {
    q: "«¿Va a generar más ocasiones el rival que vosotros?»",
    answers: [
      { text: "«No, vamos a dominar nosotros el partido.»", stance: "positive", label: "Dominante",
        check: (r) => r.myGoals >= r.oppGoals },
      { text: "«Cada partido es distinto, lo veremos en el campo.»", stance: "neutral", label: "Flexible",
        check: () => null },
      { text: "«Es un rival fuerte, nos costará contenerlo.»", stance: "negative", label: "Respetuoso",
        check: (r) => r.oppGoals > r.myGoals },
    ]
  },
  {
    q: "«¿Se va a decidir esto en los 90 minutos, sin penaltis?»",
    answers: [
      { text: "«Sí, lo resolveremos en el tiempo reglamentario.»", stance: "positive", label: "Seguro",
        check: (r) => !r.penalties },
      { text: "«Lo importante es resolverlo, como sea.»", stance: "neutral", label: "Pragmático",
        check: () => null },
      { text: "«Puede decidirse en los detalles, incluso en penaltis.»", stance: "negative", label: "Cauteloso",
        check: (r) => r.penalties },
    ]
  },
  {
    q: "«¿Vais a marcar más de un gol en este partido?»",
    answers: [
      { text: "«Sí, tenemos gol en las botas.»", stance: "positive", label: "Ofensivo",
        check: (r) => r.myGoals > 1 },
      { text: "«Con uno nos conformamos si hace falta.»", stance: "neutral", label: "Pragmático",
        check: () => null },
      { text: "«Va a costarnos encontrar el gol hoy.»", stance: "negative", label: "Cauteloso",
        check: (r) => r.myGoals <= 1 },
    ]
  },
  {
    q: "«¿Encajaréis dos goles o más en este partido?»",
    answers: [
      { text: "«No, vamos a estar sólidos atrás.»", stance: "positive", label: "Defensivo",
        check: (r) => r.oppGoals < 2 },
      { text: "«El fútbol siempre da sorpresas.»", stance: "neutral", label: "Filosófico",
        check: () => null },
      { text: "«El rival tiene mucho gol, puede pasar.»", stance: "negative", label: "Realista",
        check: (r) => r.oppGoals >= 2 },
    ]
  },
  {
    q: "«¿Terminará el partido en empate?»",
    answers: [
      { text: "«No, vamos a buscar la victoria hasta el final.»", stance: "positive", label: "Ambicioso",
        check: (r) => !r.draw },
      { text: "«Cualquier resultado es posible en este torneo.»", stance: "neutral", label: "Realista",
        check: () => null },
      { text: "«Puede que ninguno consiga abrir la lata.»", stance: "negative", label: "Cauteloso",
        check: (r) => r.draw },
    ]
  },
  {
    q: "«¿Marcará alguno de vuestros delanteros estrella?»",
    answers: [
      { text: "«Sí, va a estar fino delante de la portería.»", stance: "positive", label: "Confiado",
        check: (r) => r.myGoals > 0 },
      { text: "«El gol es cosa de todo el equipo.»", stance: "neutral", label: "Colectivo",
        check: () => null },
      { text: "«El rival lo va a tener vigilado de cerca.»", stance: "negative", label: "Precavido",
        check: (r) => r.myGoals === 0 },
    ]
  },
  {
    q: "«¿Va a ser un partido con mucho juego físico?»",
    answers: [
      { text: "«No, queremos jugar al fútbol, no a la guerra.»", stance: "positive", label: "Conciliador",
        check: (r) => r.cardsCount === 0 },
      { text: "«Eso lo decide el árbitro, no nosotros.»", stance: "neutral", label: "Evasivo",
        check: () => null },
      { text: "«Va a ser un partido muy disputado, sin duda.»", stance: "negative", label: "Realista",
        check: (r) => r.cardsCount > 0 },
    ]
  },
  {
    q: "«¿Va a ser un partido de muchas ocasiones para ambos equipos?»",
    answers: [
      { text: "«Sí, esto va a ser ida y vuelta.»", stance: "positive", label: "Espectáculo",
        check: (r) => (r.myGoals + r.oppGoals) >= 3 },
      { text: "«Depende de cómo se plantee el partido.»", stance: "neutral", label: "Flexible",
        check: () => null },
      { text: "«Va a ser un partido cerrado y táctico.»", stance: "negative", label: "Realista",
        check: (r) => (r.myGoals + r.oppGoals) < 3 },
    ]
  },
];
const MAX_SWAPS_PER_MATCH = 5;

/* ========= COMPETITION STATE (World Cup format) ========= */
const ROUND_NAMES = ["Octavos de Final","Cuartos de Final","Semifinal","Final"];
let stage = "group";        // "group" | "knockout" | "done"
let groupOpponents = [];    // 3 team objects for this group
let groupMatchIdx = 0;       // 0,1,2 — which group match is next
let groupTable = [];         // standings rows: {name, team|null, played, won, drawn, lost, gf, ga, pts}
let knockoutRound = 0;       // 0=Octavos,1=Cuartos,2=Semis,3=Final
let knockoutPool = [];       // remaining pool of teams for future knockout rounds
let matchResults = [];       // flat history of all matches played, for display

/* ---------- FORMATIONS ---------- */
// Formations are now PURELY visual/layout — they define where the 11 pitch
// slots are placed, but give NO stat bonus. The stat bonus now comes from
// the per-match STRATEGY chosen against each rival (see STRATEGIES above).
const FORMATIONS = {
  ofensiva:[
    {code:"3-4-3",label:"Ataque total",bonus:{attack:13,defense:3,passing:7,pace:11,technique:6}},
    {code:"3-4-1-2",label:"Mediapunta creativo",bonus:{attack:9,defense:4,passing:12,pace:7,technique:8}},
    {code:"4-2-4",label:"Brasil clásico",bonus:{attack:16,defense:6,passing:4,pace:10,technique:4}},
    {code:"4-3-3",label:"Tridente Ofensivo",bonus:{attack:11,defense:5,passing:8,pace:7,technique:9}},
    {code:"4-2-3-1",label:"Extremos al ataque",bonus:{attack:8,defense:6,passing:11,pace:9,technique:6}},
    {code:"3-5-2",label:"Superioridad central",bonus:{attack:7,defense:4,passing:13,pace:8,technique:8}},
    {code:"2-3-5",label:"Vintage ofensivo",bonus:{attack:15,defense:2,passing:6,pace:13,technique:4}},
  ],
  equilibrada:[
    {code:"4-4-2",label:"El clásico",bonus:{attack:8,defense:8,passing:8,pace:8,technique:8}},
    {code:"4-3-3",label:"Posesión y ataque",bonus:{attack:12,defense:5,passing:9,pace:8,technique:6}},
    {code:"4-1-4-1",label:"Sólido en todo",bonus:{attack:6,defense:10,passing:12,pace:5,technique:7}},
    {code:"4-2-3-1",label:"Fútbol moderno",bonus:{attack:7,defense:7,passing:13,pace:6,technique:7}},
    {code:"4-3-1-2",label:"Control + 2 puntas",bonus:{attack:10,defense:6,passing:10,pace:7,technique:7}},
    {code:"3-5-2",label:"Carrileros activos",bonus:{attack:8,defense:5,passing:11,pace:9,technique:7}},
    {code:"4-5-1",label:"Defensivo+contragol",bonus:{attack:5,defense:11,passing:10,pace:6,technique:8}},
  ],
  defensiva:[
    {code:"5-4-1",label:"Fortaleza",bonus:{attack:4,defense:16,passing:8,pace:5,technique:7}},
    {code:"5-3-2",label:"5 atrás + 2 arriba",bonus:{attack:7,defense:18,passing:6,pace:5,technique:4}},
    {code:"4-5-1",label:"Bloque compacto",bonus:{attack:4,defense:12,passing:11,pace:4,technique:9}},
    {code:"4-1-4-1",label:"Pivote protector",bonus:{attack:5,defense:14,passing:9,pace:4,technique:8}},
    {code:"3-6-1",label:"Muro defensivo",bonus:{attack:3,defense:9,passing:15,pace:3,technique:10}},
    {code:"5-2-2-1",label:"Contragolpe",bonus:{attack:6,defense:17,passing:5,pace:8,technique:4}},
    {code:"6-3-1",label:"Ultra defensivo",bonus:{attack:3,defense:22,passing:6,pace:4,technique:5}},
  ]
};
const CAT_NAMES={ofensiva:"Ofensiva",equilibrada:"Equilibrada",defensiva:"Defensiva"};
// Short, neutral one-line description per formation code (shown after the squad is locked)
const FORMATION_DESC={
  "3-4-3":"Tres centrales y tres delanteros: máxima presencia ofensiva.",
  "3-4-1-2":"Línea de 3 con un mediapunta libre entre líneas.",
  "4-2-4":"Cuatro atacantes apoyados por solo dos centrocampistas.",
  "4-3-3":"Equilibrio clásico entre posesión y ancho ofensivo.",
  "4-2-3-1":"Doble pivote y un enganche que conecta con la punta.",
  "3-5-2":"Carrileros que suben por banda y dos puntas arriba.",
  "2-3-5":"Formación vintage con cinco hombres en ataque.",
  "4-4-2":"El dibujo más clásico: simetría y bloques compactos.",
  "4-1-4-1":"Pivote defensivo que protege la línea de cuatro.",
  "4-3-1-2":"Mediocentro creativo entre la medular y la delantera.",
  "4-5-1":"Línea de cinco en el centro, un único punta de referencia.",
  "5-4-1":"Cinco defensas para cerrar todos los espacios.",
  "5-3-2":"Bloque de cinco atrás con doble delantero al contragolpe.",
  "3-6-1":"Seis hombres en el medio, máxima cautela ofensiva.",
  "5-2-2-1":"Defensa numerosa pensada para salir rápido a la contra.",
  "6-3-1":"El mayor número de defensas posible en el campo.",
};
let currentFormation={category:"equilibrada",code:"4-4-2"};
let currentFormationBonus={};
let formationIsLocked=false; // set true the moment SELECCIONAR JUGADOR/EQUIPO RÁPIDO is pressed

/* ---------- DOM REFS ---------- */
const rollBtn = document.getElementById("rollBtn");
// Use the correct card container based on viewport
function getPlayerCardEl(){
  return window.innerWidth<=1050
    ? document.getElementById("playerCard")
    : document.getElementById("playerCardDesktop");
}
const playerCardEl = document.getElementById("playerCardDesktop"); // desktop: right panel
const pitchEl = document.getElementById("pitch");

/* Scroll the relevant area into view on mobile/tablet, so the user always
   sees what just happened (slot machine, roster, pitch placement...). */
function scrollToEl(id, delay, block){
  if(window.innerWidth>1050) return;
  setTimeout(()=>{
    const el=document.getElementById(id);
    if(el) el.scrollIntoView({behavior:"smooth", block: block||"start"});
  }, delay||30);
}
function scrollToCenter(id, delay){
  scrollToEl(id, delay, "center");
}

/* Explicit, tactically-correct layout per formation code. Each entry lists
   the line-by-line position labels exactly as a real formation would be
   drawn — e.g. a 4-3-3's midfield trio is three central midfielders (MC),
   not a winger-mediocentro-winger line (that would be a 4-3-3 with wide
   forwards instead, which is already represented by the EI/DC/ED attack
   line). This replaces the old generic n-based heuristic that mislabeled
   several formations (e.g. 4-3-3 showed EI/MC/ED instead of MC/MC/MC).
   Only the 8 position codes that exist in the player database are used
   (POR, DFC, LI, LD, MC, EI, ED, DC) — no MCD/MP, since no player owns
   those labels and it would make those slots impossible to fill with a★. */
const FORMATION_LAYOUTS = {
  "2-3-5":    [["POR"],["DFC","DFC"],["MC","MC","MC"],["EI","DC","DC","DC","ED"]],
  "3-4-3":    [["POR"],["DFC","DFC","DFC"],["LI","MC","MC","LD"],["EI","DC","ED"]],
  "3-4-1-2":  [["POR"],["DFC","DFC","DFC"],["LI","MC","MC","LD"],["MC"],["DC","DC"]],
  "3-5-2":    [["POR"],["DFC","DFC","DFC"],["LI","MC","MC","MC","LD"],["DC","DC"]],
  "3-6-1":    [["POR"],["DFC","DFC","DFC"],["LI","MC","MC","MC","MC","LD"],["DC"]],
  "4-1-4-1":  [["POR"],["LI","DFC","DFC","LD"],["MC"],["EI","MC","MC","ED"],["DC"]],
  "4-2-3-1":  [["POR"],["LI","DFC","DFC","LD"],["MC","MC"],["EI","MC","ED"],["DC"]],
  "4-2-4":    [["POR"],["LI","DFC","DFC","LD"],["MC","MC"],["EI","DC","DC","ED"]],
  "4-3-1-2":  [["POR"],["LI","DFC","DFC","LD"],["MC","MC","MC"],["MC"],["DC","DC"]],
  "4-3-3":    [["POR"],["LI","DFC","DFC","LD"],["MC","MC","MC"],["EI","DC","ED"]],
  "4-4-2":    [["POR"],["LI","DFC","DFC","LD"],["EI","MC","MC","ED"],["DC","DC"]],
  "4-5-1":    [["POR"],["LI","DFC","DFC","LD"],["LI","MC","MC","MC","LD"],["DC"]],
  "5-2-2-1":  [["POR"],["LI","DFC","DFC","DFC","LD"],["MC","MC"],["EI","ED"],["DC"]],
  "5-3-2":    [["POR"],["LI","DFC","DFC","DFC","LD"],["MC","MC","MC"],["DC","DC"]],
  "5-4-1":    [["POR"],["LI","DFC","DFC","DFC","LD"],["LI","MC","MC","LD"],["DC"]],
  "6-3-1":    [["POR"],["LI","DFC","DFC","DFC","DFC","LD"],["MC","MC","MC"],["DC"]],
};


/* ---------- INIT ---------- */
// Sync the profile's "NOTAS DE LA VERSIÓN" tab label with the actual
// version tag in the header, so they never go out of sync.
(function(){
  const versionTagEl=document.querySelector(".version-tag");
  const profileVersionEl=document.getElementById("profileVersionLabel");
  if(versionTagEl && profileVersionEl) profileVersionEl.textContent=versionTagEl.textContent;
})();
const inheritedBonus=restoreInheritedFormation();
applyFormationBonus(inheritedBonus || FORMATIONS.equilibrada.find(f=>f.code==="4-4-2").bonus);
renderPitch(currentFormation.code);
renderFormationList(currentFormation.category);
// Sync the category tab buttons (Ofensiva/Equilibrada/Defensiva) with
// whichever category the restored (or default) formation belongs to.
document.querySelectorAll(".formation-tab").forEach(tab=>{
  tab.classList.toggle("active", tab.dataset.cat===currentFormation.category);
});
updateStats();
updateDraftCounter();
renderMobileFormationInfo();
relocateFormationPickerForViewport();
window.addEventListener("resize", relocateFormationPickerForViewport);

/* On mobile, the formation picker must be reachable from the FORMACIÓN tab
   (center-panel, which is always visible) — not buried inside the EQUIPO
   tab's left-panel (hidden by default). We physically move the DOM node. */
/* On desktop, CÓMO JUGAR and PARA QUÉ SIRVE are collapsible accordions —
   open by default, collapse to a compact title bar on click. Mobile shows
   the same content inside the INFORMACIÓN tab instead (always expanded). */
function toggleCollapsible(boxId){
  const box=document.getElementById(boxId);
  if(!box) return;
  playSound('select');
  box.classList.toggle("collapsed");
}

/* ========= ¿SABÍAS QUÉ...? TIPS ========= */
const GAME_TIPS=[
  "💡 Regístrate para guardar tu progreso y acceder a contenido exclusivo.",
  "💡 Un jugador cansado rendirá peor en el campo, controla su resistencia.",
  "💡 Conoce a tu rival. Elegir una buena estrategia puede marcar la diferencia.",
];
let currentTipIndex=0;
let tipRotationTimer=null;
function renderCurrentTip(){
  const el=document.getElementById("tipText");
  if(!el) return;
  el.classList.add("tip-fading");
  setTimeout(()=>{
    el.textContent=GAME_TIPS[currentTipIndex];
    el.classList.remove("tip-fading");
  },200);
}
function showNextTip(){
  currentTipIndex=(currentTipIndex+1)%GAME_TIPS.length;
  renderCurrentTip();
  // Clicking manually resets the 15s auto-rotation timer, so it doesn't
  // immediately jump again right after a manual click.
  restartTipRotation();
}
function restartTipRotation(){
  if(tipRotationTimer) clearInterval(tipRotationTimer);
  tipRotationTimer=setInterval(()=>{
    currentTipIndex=(currentTipIndex+1)%GAME_TIPS.length;
    renderCurrentTip();
  },15000);
}
window.showNextTip=showNextTip;
// Start the rotation now that the whole tip system is defined.
renderCurrentTip();
restartTipRotation();

function relocateFormationPickerForViewport(){
  const picker=document.getElementById("formationPickerBox");
  const teamProfile=document.getElementById("teamProfileBox");
  const convocadosBox=document.getElementById("convocadosBox");
  const isMobile=window.innerWidth<=1050;
  const centerPanel=document.querySelector(".center-panel");
  const leftPanel=document.querySelector(".left-panel");
  // Formation is locked once SELECCIONAR JUGADOR / EQUIPO RÁPIDO was pressed
  const formationLocked = formationIsLocked;

  if(picker){
    if(isMobile && centerPanel && picker.parentElement!==centerPanel){
      // Append at the END of center-panel — keeps pitch, LED scoreboard
      // and SELECCIONAR JUGADOR/JUGAR right after the pitch, with the
      // formation picker below all of that.
      centerPanel.appendChild(picker);
    } else if(!isMobile && leftPanel && picker.parentElement!==leftPanel){
      if(teamProfile) teamProfile.insertAdjacentElement("beforebegin", picker);
      else leftPanel.appendChild(picker);
    }
  }

  // PERFIL DEL EQUIPO: while the formation is still being chosen (pre-draft),
  // it sits in the CAMPO tab right below the picker. Once the formation
  // locks (drafting started), it moves to the EQUIPO tab, right after
  // CONVOCADOS — same place it always has on desktop.
  if(teamProfile){
    if(isMobile && !formationLocked && picker && teamProfile.parentElement!==picker.parentElement){
      picker.insertAdjacentElement("afterend", teamProfile);
    } else if(isMobile && formationLocked && convocadosBox && teamProfile.parentElement!==convocadosBox.parentElement){
      convocadosBox.insertAdjacentElement("afterend", teamProfile);
    } else if(!isMobile && leftPanel && teamProfile.parentElement!==leftPanel){
      leftPanel.appendChild(teamProfile);
    }
  }

  // ¿SABÍAS QUÉ...? + CÓMO JUGAR + PARA QUÉ SIRVE: live in the right panel
  // on desktop (as collapsible accordions), but move into the dedicated
  // INFORMACIÓN tab panel on mobile, always expanded there. The tip box
  // goes in FIRST, so it sits above the other two tutorials.
  const tipsBox=document.getElementById("tipsBox");
  const howTo=document.getElementById("howToPlayBox");
  const statsGuide=document.getElementById("statsGuideBox");
  const infoPanel=document.getElementById("infoPanel");
  const rightPanel=document.querySelector(".right-panel");
  if(isMobile && infoPanel){
    if(tipsBox && tipsBox.parentElement!==infoPanel){ tipsBox.classList.remove("collapsed"); infoPanel.appendChild(tipsBox); }
    if(howTo && howTo.parentElement!==infoPanel){ howTo.classList.remove("collapsed"); infoPanel.appendChild(howTo); }
    if(statsGuide && statsGuide.parentElement!==infoPanel){ statsGuide.classList.remove("collapsed"); infoPanel.appendChild(statsGuide); }
  } else if(!isMobile && rightPanel){
    if(tipsBox && tipsBox.parentElement!==rightPanel) rightPanel.appendChild(tipsBox);
    if(howTo && howTo.parentElement!==rightPanel) rightPanel.appendChild(howTo);
    if(statsGuide && statsGuide.parentElement!==rightPanel) rightPanel.appendChild(statsGuide);
  }
}

/* ---------- ROLL BUTTON ---------- */
rollBtn.addEventListener("click",()=>{
  if(rollBtn.disabled) return;
  if(maybeShowMobileFormationGate(()=>rollBtn.click())) return; // pauses for confirmation on mobile, first time only
  // Hide quick-build option once player starts manual draft
  const qbw=document.getElementById("quickBuildWrap");
  if(qbw) qbw.style.display="none";
  // Lock the formation choice the moment drafting actually begins —
  // not just once the squad is fully built. The player should see
  // immediately that they can no longer change it.
  if(phase==="draft"&&draftedCount===0) lockFormationDisplay();
  if(phase==="draft") rollTeams();
  else if(phase==="bench") rollBench();
});

/* Mobile-only safeguard: before the FIRST draft action (manual or quick-build),
   make sure the player has consciously seen/confirmed their formation choice.
   Shown only once per session — never interrupts again afterwards. */
let _formationGateShown=false;
function maybeShowMobileFormationGate(retryFn){
  if(window.innerWidth>1050) return false;       // desktop: never show
  if(_formationGateShown) return false;           // already shown this session
  if(phase!=="draft"||draftedCount>0) return false; // only before drafting starts
  _formationGateShown=true;
  playSound('select');
  document.getElementById("matchOverlay").innerHTML=`
  <div class="match-modal">
    <h3>Confirma tu formación</h3>
    <div class="match-summary">
      Vas a jugar con <strong>${currentFormation.code} · ${CAT_NAMES[currentFormation.category]}</strong>.
      ${FORMATION_DESC[currentFormation.code]?`<br>${FORMATION_DESC[currentFormation.code]}`:''}
      <br><br>Recuerda: la formación <strong>solo puede elegirse ahora</strong>, antes de empezar a fichar jugadores. Después quedará fija para todo el torneo.
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
      <button class="modal-btn" id="gateContinueBtn">CONTINUAR CON ESTA FORMACIÓN</button>
      <button class="modal-btn danger" id="gateChangeBtn">CAMBIAR FORMACIÓN</button>
    </div>
  </div>`;
  document.getElementById("gateContinueBtn").addEventListener("click",()=>{
    playSound('select');
    document.getElementById("matchOverlay").innerHTML="";
    retryFn();
  });
  document.getElementById("gateChangeBtn").addEventListener("click",()=>{
    playSound('select');
    document.getElementById("matchOverlay").innerHTML="";
    switchMobileTab('campo');
    setTimeout(()=>{
      const fb=document.getElementById('formationPickerBox');
      if(fb) fb.scrollIntoView({behavior:'smooth',block:'start'});
    },80);
  });
  return true;
}

/* ---------- FORMATION TABS ---------- */
document.querySelectorAll(".formation-tab").forEach(tab=>{
  tab.addEventListener("click",()=>{
    if(phase!=="draft"||draftedCount>0) return; // locked once drafting starts
    playSound('select');
    document.querySelectorAll(".formation-tab").forEach(t=>t.classList.remove("active"));
    tab.classList.add("active");
    renderFormationList(tab.dataset.cat);
  });
});

/* ========= ROLL TEAMS (show 2 random teams, 8 random players each) ========= */
function revealPreDraftBoxes(){
  // CONVOCADOS and PERFIL DEL EQUIPO are visible from the start now —
  // kept as a no-op so existing call sites don't need to change.
}
function rollTeams(){
  rollBtn.disabled=true;
  revealPreDraftBoxes();
  const pool=teams.slice();
  shuffle(pool);
  const t1=pool[0], t2=pool[1];
  const p1=randomPick(t1.players,5), p2=randomPick(t2.players,5);
  window._lastTeamChoice={t1,p1,t2,p2,isBench:false};
  showTeamChoice(t1,p1,t2,p2);
}

function rollBench(){
  rollBtn.disabled=true;
  const pool=teams.slice();
  shuffle(pool);
  const t1=pool[0], t2=pool[1];
  const already=new Set([...usedPlayers.map(p=>p.name),...bench.map(p=>p.name)]);
  const p1=randomPick(t1.players.filter(p=>!already.has(p.name)),5);
  const p2=randomPick(t2.players.filter(p=>!already.has(p.name)),5);
  window._lastTeamChoice={t1,p1,p2,t2,isBench:true};
  showTeamChoice(t1,p1,t2,p2,true);
}

function randomPick(arr,n){
  const a=[...arr]; shuffle(a); return a.slice(0,Math.min(n,a.length));
}
function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]; } }

function showTeamChoice(t1,p1,t2,p2,isBench=false){
  const title=isBench?"ELIGE JUGADOR DE BANQUILLO":"ELIGE UNA SELECCIÓN";
  const isMobile=window.innerWidth<=1050;
  const targetEl=isMobile?document.getElementById("playerCard"):playerCardEl;

  // Slot-machine reveal: shuffle random flags for ~1s before showing the real choices
  targetEl.innerHTML=`
  <div class="box" style="margin-bottom:0">
    <div class="selection-title">${title}</div>
    <div class="team-choice slot-spin">
      <div class="team-option slot-reel"><div class="flag-wrap"><div class="slot-strip" id="reel1"></div></div></div>
      <div class="team-option slot-reel"><div class="flag-wrap"><div class="slot-strip" id="reel2"></div></div></div>
    </div>
  </div>`;

  if(isMobile){
    // Active tab = RIVAL during shuffling (center panel with the card is always visible regardless)
    switchMobileTab('rival');
    setTimeout(()=>{ if(targetEl) targetEl.scrollIntoView({behavior:'smooth',block:'start'}); }, 80);
    setTimeout(()=>{ if(targetEl) targetEl.scrollIntoView({behavior:'smooth',block:'start'}); }, 1000);
  } else {
    scrollToEl("playerCardDesktop", 30);
    scrollToEl("playerCardDesktop", 950);
  }
  const pool=teams.slice();
  const reel1=document.getElementById("reel1");
  const reel2=document.getElementById("reel2");
  let i=0;
  const spin=setInterval(()=>{
    const r1=pool[Math.floor(Math.random()*pool.length)];
    const r2=pool[Math.floor(Math.random()*pool.length)];
    reel1.innerHTML=flagEmoji(r1.name,56);
    reel2.innerHTML=flagEmoji(r2.name,56);
    playSound('spin');
    i++;
  },80);
  setTimeout(()=>{
    clearInterval(spin);
    playSound('reveal');
    targetEl.innerHTML=`
    <div class="box" style="margin-bottom:0">
      <div class="selection-title">${title}</div>
      <div class="team-choice">
        ${teamOptionHTML(t1,p1)}
        ${teamOptionHTML(t2,p2)}
      </div>
    </div>`;
  },900);
}

function teamOptionHTML(team,players){
  const pid=CSS.escape(team.name);
  return `<div class="team-option" onclick="selectTeam('${esc(team.name)}')">
    <div class="flag-wrap">${flagEmoji(team.name)}</div>
    <h3>${team.name}</h3>
    ${renderBonuses(team)}
    <div class="style-label">Estilo de juego</div>
    <p class="style-text">${team.style}</p>
  </div>`;
}
function esc(s){ return s.replace(/'/g,"&#39;"); }
function renderBonuses(team){
  let h="";
  for(let k in team.bonuses){
    const v=team.bonuses[k];
    if(!v) continue;
    h+=`<div class="bonus-line">${STAT_LABELS[k]||k.toUpperCase()} ${v>0?'+':''}${v}</div>`;
  }
  return h;
}

/* ========= SELECT TEAM → show 8 players ========= */
function selectTeam(teamName){
  const team=teams.find(t=>t.name===teamName);
  if(!team) return;
  playSound('select');
  applyBonuses(team);
  const already=new Set([...usedPlayers.map(p=>p.name),...bench.map(p=>p.name)]);
  const available=team.players.filter(p=>!already.has(p.name));
  const show=randomPick(available,5);
  window._lastRoster={team, players:show}; // store for VOLVER
  showRosterModal(team,show);
}

function showRosterModal(team,players){
  let rows="";
  const emptySlotLabels = phase==="draft"
    ? new Set(getPitchSlots().filter(s=>!s.classList.contains("locked")).map(s=>s.dataset.label))
    : null;
  players.forEach((p,i)=>{
    const safeP=JSON.stringify(p).replace(/"/g,"&quot;");
    const safePos=JSON.stringify(p.positions||[]).replace(/"/g,"&quot;");
    const dorsal=p.dorsal||(i+1);
    const noFreeSpot = emptySlotLabels && (p.positions||[]).every(pos=>!emptySlotLabels.has(pos));
    const pickBtnClass = noFreeSpot ? "pick-btn pick-btn-warn" : "pick-btn";
    rows+=`<tr>
      <td class="dorsal-cell">${dorsal}</td>
      <td>${p.name}</td>
      <td>${(p.positions||[]).join(' / ')}</td>
      <td>${p.rating||0}</td>
      <td><button class="${pickBtnClass}" 
        onmouseover="highlightPos(${safePos})"
        onmouseout="clearHighlights()"
        onclick="pickPlayer(${safeP})">Elegir</button></td>
    </tr>`;
  });
  const rosterTarget=window.innerWidth<=1050?document.getElementById("playerCard"):playerCardEl;
  rosterTarget.innerHTML=`
  <div class="box roster-modal" style="margin-bottom:0">
    <div class="roster-header">
      ${flagEmoji(team.name,40)}
      <div class="selection-title" style="margin:0">${team.name}</div>
    </div>
    <table class="roster-table">
      <thead><tr><th>#</th><th>Jugador</th><th>Pos.</th><th>★</th><th></th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
  if(window.innerWidth<=1050){
    setTimeout(()=>{ if(rosterTarget) rosterTarget.scrollIntoView({behavior:'smooth',block:'start'}); },60);
  }
}

/* ========= PICK PLAYER ========= */
function pickPlayer(player){
  playSound('select');
  const rosterTarget=window.innerWidth<=1050?document.getElementById("playerCard"):playerCardEl;
  if(phase==="bench"){
    bench.push({...player});
    benchCount++;
    if(rosterTarget) rosterTarget.innerHTML="";
    updateBenchTable();
    if(benchCount>=5){
      phase="ready";
      rollBtn.style.display="none";
      const tipsBox=document.getElementById("tipsBox");
      const howTo=document.getElementById("howToPlayBox");
      const statsGuide=document.getElementById("statsGuideBox");
      lockFormationDisplay();
      // Collapse (don't hide) the tutorial boxes — still consultable on
      // desktop once the squad is built, just compact at the bottom.
      if(tipsBox) tipsBox.classList.add("collapsed");
      if(howTo) howTo.classList.add("collapsed");
      if(statsGuide) statsGuide.classList.add("collapsed");
      updateConvocadosTable();
      updateBenchTable();
      startMatchPhase();
      startLedLoop();
    } else {
      rollBtn.disabled=false;
      rollBtn.textContent=`BANQUILLO ${benchCount}/5`;
      scrollToCenter("rollBtn");
    }
    return;
  }
  // Draft phase: select for pitch — hide the roster (whichever container
  // it's currently shown in) and show the "JUGADOR SELECCIONADO" banner
  // in its place.
  selectedPlayer={...player};
  if(rosterTarget) rosterTarget.innerHTML="";
  highlightPos(selectedPlayer.positions||[]);
  showSelectedPlayerBanner(selectedPlayer);
  scrollToEl("pitch");
  // On mobile: switch to campo tab so pitch is visible for placement
  if(typeof switchMobileTab==='function') switchMobileTab('campo');
}

function showSelectedPlayerBanner(p){
  const el=document.getElementById("selectedPlayerBanner");
  if(!el) return;
  el.style.display="block";
  el.innerHTML=`
  <div class="box selected-player-banner">
    <div class="selection-title">JUGADOR SELECCIONADO</div>
    <div class="spb-row">
      <span class="spb-name">${p.name}</span>
      <span class="spb-rating">★${p.rating||0}</span>
    </div>
    <div class="spb-positions">Posiciones: ${(p.positions||[]).join(' / ')}</div>
    <div class="hint-line">Colócalo en una posición resaltada del campo.</div>
    <button class="spb-back-btn" onclick="volverASeleccion()">↩ VOLVER</button>
  </div>`;
}
function hideSelectedPlayerBanner(){
  const el=document.getElementById("selectedPlayerBanner");
  if(!el) return;
  el.style.display="none";
  el.innerHTML="";
}

function volverASeleccion(){
  playSound('select');
  selectedPlayer=null;
  clearHighlights();
  hideSelectedPlayerBanner();
  // Restore the same 5 players from the last selected team
  if(window._lastRoster){
    const {team, players}=window._lastRoster;
    showRosterModal(team, players);
  }
  // Same as when teams are first shuffled: the active tab becomes RIVAL,
  // since that's where the team/player selection card is shown on mobile.
  if(window.innerWidth<=1050 && typeof switchMobileTab==='function'){
    switchMobileTab('rival');
  }
}

/* ========= POSITION SLOTS ========= */
function renderSlotContent(slot, player, label, rating, starHTML){
  const statusIcons=getSlotStatusIconsHTML(player);
  slot.innerHTML=`${statusIcons}<span class="pos-rating">${rating}</span><div class="player-info">${player.name}${starHTML}<div class="player-pos-label">${label}</div></div>`;
}
/* Small status icon row shown ABOVE the pitch circle — injury, card, and
   scorer streak, so the player's situation is visible at a glance without
   having to check the convocados table. */
function getSlotStatusIconsHTML(p){
  const icons=[];
  if(p.injury) icons.push(`<span class="pitch-status-icon pitch-status-injury" title="Lesionado">✚</span>`);
  if(p.suspended) icons.push(`<span class="pitch-status-icon" title="Sancionado">🚫</span>`);
  else if((p.yellowCount||0)>=1) icons.push(`<span class="pitch-status-icon" title="Tarjeta amarilla acumulada">🟨</span>`);
  const streak=scorerStreaks[p.name]||0;
  if(streak>0) icons.push(`<span class="pitch-status-icon" title="Racha goleadora">🔥</span>`);
  if(!icons.length) return "";
  return `<div class="pitch-status-row">${icons.join("")}</div>`;
}

/* Refresh the on-pitch rating/star display for every starter based on their
   current effRating (e.g. after an injury is sustained or recovered from). */
function refreshPitchRatings(){
  getPitchSlots().forEach(slot=>{
    const p=slot._player;
    if(!p) return;
    const label=slot.dataset.label;
    const inPos=p.positions&&p.positions.includes(label);
    const star=inPos&&p.positions[0]===label?' <span class="star">★</span>':'';
    renderSlotContent(slot, p, label, effRating(p), star);
  });
}

function lineLabels(n,isDef,isAtt){
  if(isDef){
    if(n===2)return["DFC","DFC"];if(n===3)return["DFC","DFC","DFC"];
    if(n===4)return["LI","DFC","DFC","LD"];if(n===5)return["LI","DFC","DFC","DFC","LD"];
    if(n===6)return["LI","DFC","DFC","DFC","DFC","LD"];
  }
  if(isAtt){
    if(n===1)return["DC"];if(n===2)return["DC","DC"];if(n===3)return["EI","DC","ED"];
    if(n===4)return["EI","DC","DC","ED"];if(n===5)return["EI","DC","DC","DC","ED"];
  }
  if(n===1)return["MC"];if(n===2)return["MC","MC"];if(n===3)return["EI","MC","ED"];
  if(n===4)return["EI","MC","MC","ED"];if(n===5)return["EI","MC","MC","MC","ED"];
  if(n===6)return["EI","MC","MC","MC","MC","ED"];
  return Array(n).fill("MC");
}
function buildFormationSlots(code){
  const layout=FORMATION_LAYOUTS[code];
  const GK_TOP=88;
  if(!layout){
    // Fallback for any unmapped code: keep the old generic behaviour so
    // nothing crashes, though every formation actually used in the game
    // is covered above.
    const lines=code.split("-").map(Number);
    const slots=[{label:"POR",left:50,top:GK_TOP}];
    const T=lines.length;
    lines.forEach((n,i)=>{
      const isDef=i===0,isAtt=i===T-1;
      const labels=lineLabels(n,isDef,isAtt);
      const top=T===1?45:78-i*(78-14)/(T-1);
      addArcedLine(slots,labels,top,i===0,isAtt);
    });
    return slots;
  }
  const slots=[];
  const fieldLines=layout.length-1; // excludes goalkeeper
  // Explicit zone tops per line count — every formation in this game has
  // either 3 field lines (def/mid/att) or 4 (def/mid/mid-or-AMC/att).
  // The midfield line sits right at the halfway line (50%) when there's
  // only one midfield line, straddling it when there are two.
  let zoneTops;
  if(fieldLines===3)      zoneTops=[74, 50, 22];
  else if(fieldLines===4) zoneTops=[74, 58, 42, 22];
  else {
    // Safety fallback for any unexpected line count: spread evenly.
    zoneTops=[];
    for(let i=0;i<fieldLines;i++) zoneTops.push(74-(i*(74-22))/(fieldLines-1||1));
  }
  layout.forEach((labels,i)=>{
    if(i===0){ slots.push({label:"POR",left:50,top:GK_TOP}); return; }
    const top=zoneTops[i-1];
    const isAttackLine=(i===layout.length-1);
    addArcedLine(slots,labels,top,false,isAttackLine);
  });
  return slots;
}
/* Adds a line of players with a natural arc instead of a flat row. The
   curve is based on each player's horizontal distance from the pitch's
   absolute center (50% width) — NOT from the line's own midpoint — so the
   whole line forms one smooth, continuous arc regardless of player count
   (odd or even).

   Defense and midfield lines curve CONCAVE toward their own goal: the
   wide players (touchline side) push forward, the central players stay
   back — like a smile opening toward the opponent's goal.

   The ATTACK line curves the OPPOSITE way (CONVEX): the central striker(s)
   push forward toward goal, the wide forwards stay back — forming a spear
   point toward the opponent's goal, matching real tactical board visuals. */
function addArcedLine(slots,labels,baseTop,isGoalkeeperLine,isAttackLine){
  const n=labels.length;
  // The opponent's penalty box top edge sits at 16.4% of pitch height —
  // no attacking player should be pushed further forward than that, or
  // they'd visually sit on top of / past the box line.
  const ATTACK_MIN_TOP=17;
  labels.forEach((label,j)=>{
    const left=(j+1)/(n+1)*100;
    let top=baseTop;
    if(!isGoalkeeperLine && n>1){
      // Distance from the pitch's horizontal center (50%), normalized 0..1
      const distFromPitchCenter=Math.abs(left-50)/50;
      // Stronger, more visible curvature than before.
      const arcDepth=Math.min(11, 5+n*0.9);
      // Concave (defense/midfield): wide players forward -> -depth*dist
      // Convex (attack): central players forward -> -depth*(1-dist)
      if(isAttackLine){
        top=baseTop - (1-distFromPitchCenter)*arcDepth;
        top=Math.max(ATTACK_MIN_TOP, top); // never push past the box edge
      } else {
        top=baseTop - distFromPitchCenter*arcDepth;
      }
    }
    slots.push({label,left,top});
  });
}
function renderPitch(code){
  pitchEl.querySelectorAll(".position").forEach(el=>el.remove());
  buildFormationSlots(code).forEach(s=>{
    const div=document.createElement("div");
    div.className="position";
    div.dataset.label=s.label;
    div.style.left=s.left+"%";
    div.style.top=s.top+"%";
    div.innerHTML=`<span class="pos-label-inside">${s.label}</span>`;
    div.addEventListener("click",()=>onSlotClick(div));
    pitchEl.appendChild(div);
  });
}

function onSlotClick(slot){
  // Any player can go anywhere — penalty if out of position
  if(!selectedPlayer) return;
  if(slot.classList.contains("locked")) return;
  playSound('select');
  const label=slot.dataset.label;
  const p=selectedPlayer;
  p.placedPos=label;
  const inPos=p.positions&&p.positions.includes(label);
  const r=inPos ? (p.rating||70) : Math.round((p.rating||70)*0.85);
  const starHTML=inPos&&p.positions[0]===label?' <span class="star">★</span>':'';
  renderSlotContent(slot, p, label, r, starHTML);
  hideSelectedPlayerBanner();
  slot.classList.add("locked");
  slot._player=p;
  usedPlayers.push(p);
  draftedCount++;
  selectedPlayer=null;
  clearHighlights();
  updateDraftCounter();
  updateConvocadosTable();
  updateStats();
  if(draftedCount>=11){
    baseTeamOVR=computeTeamOVR();
    phase="bench";
    rollBtn.textContent="BANQUILLO 0/5";
    rollBtn.disabled=false;
    document.getElementById("benchSection").style.display="block";
    playerCardEl.innerHTML="";
  } else {
    rollBtn.disabled=false;
  }
}

/* ========= HIGHLIGHTS ========= */
function highlightPos(positions){
  document.querySelectorAll("#pitch .position:not(.locked)").forEach(s=>{
    if(positions.includes(s.dataset.label)){
      s.classList.add("highlight-pos");
    } else {
      s.classList.remove("highlight-pos");
      s.style.borderColor="";s.style.boxShadow="";
    }
  });
}
function clearHighlights(){
  document.querySelectorAll("#pitch .position:not(.locked)").forEach(s=>{
    s.classList.remove("highlight-pos");
    s.style.borderColor="";s.style.boxShadow="";
  });
}

/* ========= DRAFT COUNTER & TABLES ========= */
function updateDraftCounter(){
  const el=document.getElementById("draftCounter");
  if(el) el.textContent=draftedCount+"/11";
}
function effRating(p){
  const r=p.rating||70;
  if(!p.placedPos) return r;
  const inPos=p.positions&&p.positions.includes(p.placedPos);
  const positionFactor=inPos?1:0.85; // 15% penalty when out of position
  const injuryFactor=p.injury?0.6:1;
  const fatigueFactor=getFatigueFactor(p);
  return Math.round(r*positionFactor*injuryFactor*fatigueFactor);
}

/* ========= FATIGUE SYSTEM ========= */
// Each player has a 0-100 "freshness" bar. 100 = fully rested (green).
// Above 75: no penalty at all. Below that, rating decays gradually down
// to a maximum -30% penalty once fatigue is fully in the red (≤25).
function getFatigueFactor(p){
  const f=(p.fatigue===undefined)?100:p.fatigue;
  if(f>=75) return 1;
  // Linear decay from 1.0 at f=75 down to 0.70 at f=0
  const factor=0.70+(f/75)*0.30;
  return Math.max(0.70, Math.min(1, factor));
}
function getFatigueColor(p){
  const f=(p.fatigue===undefined)?100:p.fatigue;
  if(f>=75) return 'green';
  if(f>=40) return 'yellow';
  return 'red';
}
// Positions more involved in attacking strategies tire faster when those
// strategies are actually used — wingers/forwards covering more ground
// in an offensive setup, defenders working harder under defensive ones.
function applyMatchFatigue(){
  const myKey=selectedMatchStrategy;
  const attackingStrategies=['tiki_taka','presion_alta','gegenpressing','futbol_total','ataque_bandas','juego_directo'];
  const isAttackingStrategy=myKey&&attackingStrategies.includes(myKey);

  // Track which player(s) scored this match — they tire a bit more from
  // the extra effort (sprints, pressing to get the goal), a nod to the
  // "tired goalscorer" pattern without overdoing it.
  const scorers=new Set(generateMatchSummary._scorers||[]);

  usedPlayers.forEach(p=>{
    if(!p.placedPos) return;

    // Goalkeepers barely tire — minimal running involved in a real match.
    if(p.placedPos==='POR'){
      p.fatigue=Math.max(0, Math.round((p.fatigue===undefined?100:p.fatigue)-(2+Math.random()*3)));
      return;
    }

    // Base random fatigue loss per match: gentle, 4-9 points — a player
    // can comfortably go 6-8 matches before needing real concern.
    let loss=4+Math.random()*5;

    // Central defenders cover the least ground — lightest loss.
    if(p.placedPos==='DFC'){
      loss*=0.6;
    }
    // Full-backs/wingers/forwards/midfielders run more, especially when
    // the active strategy demands it.
    const runningPositions=['EI','ED','DC','MC','LI','LD'];
    if(isAttackingStrategy&&runningPositions.includes(p.placedPos)){
      loss+=Math.random()*4; // small extra, 0-4
    }
    // A player who scored works a bit harder than average that match.
    if(scorers.has(p.name)){
      loss+=Math.random()*3;
    }
    p.fatigue=Math.max(0, Math.round((p.fatigue===undefined?100:p.fatigue)-loss));
  });
  // Bench players who DIDN'T play fully recover
  bench.forEach(p=>{ p.fatigue=100; });
}
function computeTeamOVR(){
  if(!usedPlayers.length) return null;
  const base=Math.round(usedPlayers.reduce((s,p)=>s+effRating(p),0)/usedPlayers.length);
  return base; // stars give a hidden match bonus, not inflating the displayed OVR
}
// Returns a 0..1 bonus factor from star players, used internally in match calc
function starMatchBonus(){
  const stars=usedPlayers.filter(p=>p.positions&&p.placedPos&&p.positions[0]===p.placedPos).length;
  return stars*0.012; // each ★ = +1.2% lambda boost, up to +13.2% with 11 stars
}
let swapSelection=null;

function renderCenterSummary(){
  const el=document.getElementById("centerSummary");
  if(!el) return;
  if(!el) return;
  if(baseTeamOVR===null) { el.innerHTML=""; return; }
  const stars=usedPlayers.filter(p=>p.positions&&p.placedPos&&p.positions[0]===p.placedPos).length;
  el.innerHTML=`
  <div class="box center-summary-box">
    <div class="center-summary-row">
      <span class="center-summary-name">${myTeamName}</span>
      <span class="center-summary-ovr">${baseTeamOVR}</span>
    </div>
    <div class="hint-line">${stars} jugador${stars===1?'':'es'} en su posición ★ · ${stageLabel()}</div>
  </div>`;
}
function stageLabel(){
  if(stage==="group") return `Fase de grupos · partido ${groupMatchIdx+1}/3`;
  if(stage==="knockout") return ROUND_NAMES[knockoutRound]||"Eliminatorias";
  return "Torneo completado";
}

function getFatigueBarHTML(p){
  const f=(p.fatigue===undefined)?100:p.fatigue;
  const color=getFatigueColor(p);
  return `<div class="fatigue-bar-wrap" title="Resistencia: ${f}%"><div class="fatigue-bar fatigue-${color}" style="width:${f}%"></div></div>`;
}
function updateConvocadosTable(){
  const el=document.getElementById("convocadosTable");
  if(!el) return;
  const swapsLeft=MAX_SWAPS_PER_MATCH-swapsUsedThisMatch;
  const canSwap=(phase==='ready')&&swapsLeft>0;
  let rows="",stars=0;
  usedPlayers.forEach((p,i)=>{
    const inPrimary=p.positions&&p.placedPos&&p.positions[0]===p.placedPos;
    if(inPrimary) stars++;
    const injuryTag=p.injury?` <span class="cross" title="Lesionado">✚(-${p.injury.remaining})</span> `:'';
    const cross=p.injury?injuryTag:'';
    const cardBadge=getCardBadge(p);
    const star=inPrimary?'<span class="star" title="Posición principal ★">★</span>':'';
    const r=effRating(p);
    const streak=getStreakBadge(p.name);
    const fatigueBar=getFatigueBarHTML(p);
    const sel=(swapSelection&&swapSelection.source==='conv'&&swapSelection.index===i)?' class="row-selected"':'';
    const clickable=canSwap?` onclick="onConvocadoClick(${i})" style="cursor:pointer"`:'';
    rows+=`<tr${sel}${clickable}><td>${i+1}</td><td>${p.name}${cross}${cardBadge}${streak}</td><td>${fatigueBar}</td><td>${p.placedPos||'?'} ${star}</td><td>${r}</td></tr>`;
  });
  el.innerHTML=rows?`<table><thead><tr><th>#</th><th>Jugador</th><th title="Resistencia">Resistencia</th><th>Pos</th><th>★</th></tr></thead><tbody>${rows}</tbody></table>`:"";
  // Update star bonus display
  const sbEl=document.getElementById("starBonus");
  const sbVal=document.getElementById("starBonusVal");
  if(sbEl&&sbVal){ sbEl.style.display=stars>0?"block":"none"; sbVal.textContent=stars; }
  // Update OVR (total already includes +1 per star)
  if(usedPlayers.length){
    const avg=(baseTeamOVR!==null)?baseTeamOVR:computeTeamOVR();
    const el2=document.getElementById("teamOVR");
    if(el2) el2.textContent=avg;
  }
  // Swap counter hint
  const swapHint=document.getElementById("swapHint");
  if(swapHint){
    if(phase==='ready'){
      swapHint.style.display="block";
      swapHint.textContent=swapsLeft>0
        ? `Cambios disponibles antes del próximo partido: ${swapsLeft}/${MAX_SWAPS_PER_MATCH}`
        : `Ya has usado tu cambio para este partido.`;
    } else {
      swapHint.style.display="none";
    }
  }
}
function updateBenchTable(){
  const el=document.getElementById("benchTable");
  const cnt=document.getElementById("benchCounter");
  if(cnt) cnt.textContent=bench.length+"/5";
  if(!el) return;
  const swapsLeft=MAX_SWAPS_PER_MATCH-swapsUsedThisMatch;
  const canSwap=(phase==='ready')&&swapsLeft>0;
  let rows="";
  bench.forEach((p,i)=>{
    const injuryTag=p.injury?` <span class="cross">✚(-${p.injury.remaining})</span> `:'';
    const cross=p.injury?injuryTag:'';
    const cardBadge=getCardBadge(p);
    const fatigueBar=getFatigueBarHTML(p);
    const sel=(swapSelection&&swapSelection.source==='bench'&&swapSelection.index===i)?' class="row-selected"':'';
    const isBlocked=p.suspended;
    const clickable=(canSwap&&!isBlocked)?` onclick="onBenchClick(${i})" style="cursor:pointer"`:(isBlocked?` style="opacity:.55;cursor:not-allowed"`:'');
    rows+=`<tr${sel}${clickable}><td>${p.name}${cross}${cardBadge}</td><td>${fatigueBar}</td><td>${(p.positions||[]).join('/')}</td><td>${p.rating||0}</td></tr>`;
  });
  el.innerHTML=rows?`<table><thead><tr><th>Jugador</th><th title="Resistencia">Resistencia</th><th>Pos</th><th>★</th></tr></thead><tbody>${rows}</tbody></table>`:"";
}

/* ========= PRE-MATCH SWAPS (convocados <-> bench) ========= */
function onConvocadoClick(i){
  if(phase!=='ready'||swapsUsedThisMatch>=MAX_SWAPS_PER_MATCH) return;
  if(swapSelection&&swapSelection.source==='bench'){
    // bench → conv swap
    const benchIdx=swapSelection.index;
    swapSelection=null;
    performSwap(benchIdx, i);
    return;
  }
  if(swapSelection&&swapSelection.source==='conv'){
    if(swapSelection.index===i){
      // Deselect
      swapSelection=null;
    } else {
      // conv → conv: swap two titulars' pitch positions
      const idxA=swapSelection.index, idxB=i;
      swapSelection=null;
      performConvConvSwap(idxA, idxB);
      return;
    }
  } else {
    swapSelection={source:'conv',index:i};
  }
  updateConvocadosTable();
  updateBenchTable();
}
function onBenchClick(i){
  if(phase!=='ready'||swapsUsedThisMatch>=MAX_SWAPS_PER_MATCH) return;
  // A suspended player cannot be brought onto the pitch — they must serve
  // their sanction. Clicking them does nothing until the suspension lifts.
  if(bench[i]&&bench[i].suspended) return;
  if(swapSelection&&swapSelection.source==='conv'){
    const convIdx=swapSelection.index;
    swapSelection=null;
    performSwap(i, convIdx);
    return;
  }
  if(swapSelection&&swapSelection.source==='bench'&&swapSelection.index===i){
    swapSelection=null;
  } else {
    swapSelection={source:'bench',index:i};
  }
  updateConvocadosTable();
  updateBenchTable();
}
function performSwap(benchIdx, convIdx){
  const benchPlayer=bench[benchIdx];
  const convPlayer=usedPlayers[convIdx];
  if(!benchPlayer||!convPlayer) return;
  const slot=getPitchSlots().find(s=>s._player===convPlayer);
  if(!slot) return;
  const label=slot.dataset.label;
  benchPlayer.placedPos=label;
  delete convPlayer.placedPos;
  // Swap arrays
  bench[benchIdx]=convPlayer;
  usedPlayers[convIdx]=benchPlayer;
  slot._player=benchPlayer;
  const inPos=benchPlayer.positions&&benchPlayer.positions.includes(label);
  const r=inPos?(benchPlayer.rating||70):Math.round((benchPlayer.rating||70)*0.85);
  const star=inPos&&benchPlayer.positions[0]===label?' <span class="star">★</span>':'';
  renderSlotContent(slot, benchPlayer, label, r, star);
  baseTeamOVR=computeTeamOVR();
  swapsUsedThisMatch++;
  playSound('select');
  updateConvocadosTable();
  updateBenchTable();
  renderCenterSummary();
  updateLed();
}

function performConvConvSwap(idxA, idxB){
  // Swap two titulars' pitch positions with each other
  const pA=usedPlayers[idxA], pB=usedPlayers[idxB];
  if(!pA||!pB) return;
  const slots=getPitchSlots();
  const slotA=slots.find(s=>s._player===pA);
  const slotB=slots.find(s=>s._player===pB);
  if(!slotA||!slotB) return;
  const labelA=slotA.dataset.label, labelB=slotB.dataset.label;
  // Swap placed positions
  pA.placedPos=labelB; pB.placedPos=labelA;
  slotA._player=pB;    slotB._player=pA;
  // Re-render both slots
  [{ slot:slotA, p:pB, label:labelB }, { slot:slotB, p:pA, label:labelA }].forEach(({slot,p,label})=>{
    const inPos=p.positions&&p.positions.includes(label);
    const r=inPos?(p.rating||70):Math.round((p.rating||70)*0.85);
    const star=inPos&&p.positions[0]===label?' <span class="star">★</span>':'';
    renderSlotContent(slot, p, label, r, star);
  });
  baseTeamOVR=computeTeamOVR();
  swapsUsedThisMatch++;
  playSound('select');
  updateConvocadosTable();
  updateBenchTable();
  renderCenterSummary();
  updateLed();
}
function applyBonuses(team){
  for(let k in team.bonuses) teamStats[k]=(teamStats[k]||0)+team.bonuses[k];
  updateStats();
}
function applyFormationBonus(bonus){
  for(let k in currentFormationBonus) teamStats[k]=(teamStats[k]||0)-currentFormationBonus[k];
  for(let k in bonus) teamStats[k]=(teamStats[k]||0)+bonus[k];
  currentFormationBonus=bonus;
  updateStats();
}
function updateStats(){
  // Formation (and later, drafted players) shape ATAQUE/DEFENSA/etc. directly.
  // The NUMBER shown is always the real value (can be negative — e.g. a very
  // defensive formation before any player is drafted). Only the BAR's width
  // is clamped to 0-100%, since a bar can't visually go negative.
  ["attack","defense","pace","passing","technique"].forEach(k=>{
    const real=Math.round(teamStats[k]||0);
    const barPct=Math.max(0,Math.min(100,real));
    const v=document.getElementById(k+"Value");
    const b=document.getElementById(k+"Bar");
    if(v){
      v.textContent=real;
      v.classList.toggle("stat-negative", real<0);
    }
    if(b) b.style.width=barPct+"%";
  });
}

/* ========= FORMATIONS ========= */
function renderFormationList(cat){
  const list=document.getElementById("formationList");
  if(!list) return;
  list.innerHTML="";
  FORMATIONS[cat].forEach(f=>{
    const sel=currentFormation.category===cat&&currentFormation.code===f.code;
    const d=document.createElement("div");
    d.className="formation-option"+(sel?" selected":"");
    d.innerHTML=`<span class="f-code">${f.code}</span><span class="f-badge">${f.label}</span>`;
    d.addEventListener("click",()=>selectFormation(cat,f.code));
    list.appendChild(d);
  });
}
function selectFormation(cat,code){
  // Formation can ONLY be changed during initial setup, before SELECCIONAR
  // JUGADOR / EQUIPO RÁPIDO has been pressed. Once the draft has started
  // (draftedCount>0) or finished (phase==="ready"/"bench"), it's locked.
  if(phase!=="draft"||draftedCount>0) return;
  const f=FORMATIONS[cat].find(x=>x.code===code);
  if(!f) return;
  playSound('select');
  const badge=document.getElementById("formationBadge");
  if(badge) badge.style.display="none";
  currentFormation={category:cat,code};
  applyFormationBonus(f.bonus);
  renderPitch(code);
  resetDraft();
  renderFormationList(cat);
  const el=document.getElementById("currentFormation");
  if(el) el.textContent=`${code} · ${CAT_NAMES[cat]}`;
  renderMobileFormationInfo();
}
function lockFormationDisplay(){
  // Called as soon as drafting starts (SELECCIONAR JUGADOR / EQUIPO RÁPIDO
  // pressed for the first time) — formation can no longer change from here.
  // Hide the picker box (left panel), show the read-only info card instead
  // (center panel, below the LED board).
  formationIsLocked=true;
  const picker=document.getElementById("formationPickerBox");
  const infoCard=document.getElementById("formationInfoCard");
  if(picker)   picker.style.display="none";
  if(infoCard) infoCard.style.display="block";
  const el=document.getElementById("currentFormation");
  if(el) el.textContent=`${currentFormation.code} · ${CAT_NAMES[currentFormation.category]}`;
  const descEl=document.getElementById("formationDesc");
  if(descEl) descEl.textContent=FORMATION_DESC[currentFormation.code]||"";
  const badge=document.getElementById("formationBadge");
  if(badge) badge.style.display="none";
  renderMobileFormationInfo();
  // Now that the formation is locked, PERFIL DEL EQUIPO moves from the
  // CAMPO tab (next to the picker) to the EQUIPO tab (after CONVOCADOS).
  if(typeof relocateFormationPickerForViewport==="function") relocateFormationPickerForViewport();
}

function renderMobileFormationInfo(){
  // Mobile-only compact card shown under the pitch, in the FORMACIÓN tab
  const el=document.getElementById("mobileFormationInfo");
  if(!el) return;
  if(phase==="draft" && draftedCount===0){
    el.classList.add("empty");
    el.innerHTML=`Elige tu <strong>formación</strong> justo debajo, antes de empezar a seleccionar jugadores.`;
  } else {
    el.classList.remove("empty");
    const desc=FORMATION_DESC[currentFormation.code]||"";
    el.innerHTML=`<strong>${currentFormation.code} · ${CAT_NAMES[currentFormation.category]}</strong><br>${desc}`;
  }
}

function resetDraft(){
  usedPlayers=[]; draftedCount=0;
  updateDraftCounter();
  updateConvocadosTable();
  rollBtn.disabled=false;
  rollBtn.textContent="SELECCIONAR JUGADOR";
  selectedPlayer=null;
  playerCardEl.innerHTML="";
}
function getPitchSlots(){ return Array.from(document.querySelectorAll("#pitch .position")); }
function reassignSquad(code){
  const pool=[...getPitchSlots().map(s=>s._player).filter(Boolean),...bench];
  renderPitch(code);
  const slots=getPitchSlots();
  const remaining=[...pool];
  slots.forEach(slot=>{
    const label=slot.dataset.label;
    let idx=remaining.findIndex(p=>p.positions&&p.positions[0]===label);
    if(idx<0) idx=remaining.findIndex(p=>p.positions&&p.positions.includes(label));
    if(idx<0) idx=remaining.findIndex(p=>!p.injury);
    if(idx<0) idx=0;
    if(idx>=0){
      const p=remaining.splice(idx,1)[0];
      p.placedPos=label;
      slot._player=p;
      const inPos=p.positions&&p.positions.includes(label);
      const r=inPos?(p.rating||70):Math.round((p.rating||70)*0.85);
      const star=inPos&&p.positions[0]===label?' <span class="star">★</span>':'';
      renderSlotContent(slot, p, label, r, star);
      slot.classList.add("locked");
    }
  });
  bench=remaining;
  usedPlayers=[];
  slots.forEach(slot=>{ if(slot._player) usedPlayers.push(slot._player); });
  updateConvocadosTable();
  updateBenchTable();
}

/* ========= MATCH PHASE ========= */
let myTeamName = "TU EQUIPO";

function startMatchPhase(){
  document.getElementById("benchSection").style.display="block";
  document.getElementById("rivalBox").style.display="block";
  document.getElementById("matchHistoryBox").style.display="block";
  document.getElementById("playMatchBtn").style.display="block";
  document.getElementById("moraleSection").style.display="block";
  renderMorale();
  const qb=document.getElementById("quickBuildWrap");
  if(qb) qb.style.display="none";
  playerCardEl.innerHTML="";
  showTeamNameModal();
}
function showTeamNameModal(){
  // If the logged-in user has chosen to always use a fixed team name,
  // skip the popup entirely and use that name directly.
  if(window.useFixedTeamName && window.preferredTeamName){
    myTeamName=window.preferredTeamName;
    if(typeof firebase!=='undefined'){
      try{
        const user=firebase.auth().currentUser;
        if(user) firebase.firestore().collection("users").doc(user.uid)
          .set({lastTeamName:myTeamName},{merge:true});
      }catch(e){}
    }
    setupGroupStage();
    renderCenterSummary();
    pickNextOpponent();
    return;
  }
  document.getElementById("matchOverlay").innerHTML=`
  <div class="match-modal">
    <h3>¡Equipo completo!</h3>
    <div class="match-summary">Tu plantilla GOAT está lista. ¡Dale un nombre a tu equipo antes de empezar el torneo! Empezarás en la <strong>Fase de Grupos</strong>: 3 partidos, los 2 primeros del grupo avanzan a octavos de final.</div>
    <input type="text" id="teamNameInput" maxlength="24" placeholder="Ej: Dream Team FC" class="team-name-input" value="${esc(myTeamName==='TU EQUIPO'?'':myTeamName)}">
    <span id="teamNameErr" style="display:none;color:#e74c3c;font-size:11px;margin-top:4px">El nombre del equipo no puede estar vacío.</span>
    <button class="modal-btn" id="teamNameConfirmBtn">CONFIRMAR</button>
  </div>`;
  const inp=document.getElementById("teamNameInput");
  inp.focus();
  const confirmFn=()=>{
    const val=inp.value.trim();
    if(!val){
      document.getElementById("teamNameErr").style.display="block";
      inp.focus();
      return;
    }
    myTeamName=val.toUpperCase();
    document.getElementById("matchOverlay").innerHTML="";
    // Save team name to Firebase profile if logged in
    if(typeof firebase!=='undefined'){
      try{
        const user=firebase.auth().currentUser;
        if(user) firebase.firestore().collection("users").doc(user.uid)
          .set({lastTeamName:myTeamName},{merge:true});
      }catch(e){}
    }
    setupGroupStage();
    renderCenterSummary();
    pickNextOpponent();
  };
  document.getElementById("teamNameConfirmBtn").addEventListener("click",confirmFn);
  inp.addEventListener("keydown",e=>{ if(e.key==="Enter") confirmFn(); });
}

/* ---------- GROUP STAGE SETUP ---------- */
function setupGroupStage(){
  const pool=teams.slice();
  shuffle(pool);
  groupOpponents=pool.slice(0,3);
  groupMatchIdx=0;
  groupTable=[
    {name:myTeamName, isMe:true, team:null, played:0, won:0, drawn:0, lost:0, gf:0, ga:0, pts:0},
    ...groupOpponents.map(t=>({name:t.name, isMe:false, team:t, played:0, won:0, drawn:0, lost:0, gf:0, ga:0, pts:0}))
  ];
  // Reserve a pool of further teams for the knockout bracket (16 slots, excluding group teams)
  const used=new Set([myTeamName, ...groupOpponents.map(t=>t.name)]);
  knockoutPool=teams.filter(t=>!used.has(t.name));
  shuffle(knockoutPool);
}

/* ---------- OPPONENT SELECTION ---------- */
function pickNextOpponent(){
  selectedMatchStrategy=null; // fresh strategy choice for each new match
  applyPendingSuspensions(); // activate/lift card suspensions for the upcoming match
  updateConvocadosTable();
  updateBenchTable();
  if(stage==="group"){
    nextOpponent=groupOpponents[groupMatchIdx];
  } else if(stage==="knockout"){
    nextOpponent=knockoutPool[knockoutRound] || teams[Math.floor(Math.random()*teams.length)];
  } else {
    return;
  }
  renderCenterSummary();
  if(window.innerWidth<=1050 && typeof switchMobileTab==='function'){
    switchMobileTab('rival');
  }
  spinRivalReveal();
  scrollToEl("rivalBox", 30);
  scrollToEl("rivalBox", 950); // re-anchor after the reveal settles and content height changes
}
function spinRivalReveal(){
  const rivalInfo=document.getElementById("rivalInfo");
  const rivalHint=document.getElementById("rivalHint");
  rivalHint.textContent="";
  rivalInfo.innerHTML=`<div class="rival-card"><div class="team-option slot-reel rival-slot-reel"><div class="flag-wrap"><div class="slot-strip" id="rivalReel"></div></div></div></div>`;
  const reel=document.getElementById("rivalReel");
  const pool=teams;
  const spin=setInterval(()=>{
    const r=pool[Math.floor(Math.random()*pool.length)];
    reel.innerHTML=flagEmoji(r.name,56);
    playSound('spin');
  },80);
  setTimeout(()=>{
    clearInterval(spin);
    playSound('reveal');
    renderRivalBox();
    rollWeather();
    renderWeather();
    updateLed();
    if(typeof notifyMobileRivalTab==='function') notifyMobileRivalTab();
    updateLed();
    // Predictive press conference: shown right as the rival appears,
    // BEFORE the match is played — the prediction is resolved against
    // the real result once this match finishes.
    setTimeout(()=>{ maybeShowPressConference(()=>{}); }, 600);
  },900);
}
function renderRivalBox(){
  if(!nextOpponent) return;
  const power=computeOppPower(nextOpponent);
  const hint=getScoutHint(nextOpponent);
  document.getElementById("rivalInfo").innerHTML=`
    <div class="rival-card">
      <div class="rival-stage-tag">${stageLabel()}</div>
      <div class="rival-flag">${flagEmoji(nextOpponent.name,48)}</div>
      <h4>${nextOpponent.name}</h4>
      <div class="rival-power-bar">
        <div class="rival-power-label">PODER RIVAL</div>
        <div class="rival-power-value">${Math.round(power)}</div>
        <div class="rival-power-track"><div class="rival-power-fill" style="width:${Math.min(100,power)}%"></div></div>
      </div>
      <div class="style-label" style="margin-top:10px">Estilo de juego</div>
      <div class="rival-style-tag">${nextOpponent.style}</div>
    </div>`;
  document.getElementById("rivalHint").textContent=hint;
  renderStrategySelector();
}

/* ========= MATCH STRATEGY SELECTOR ========= */
function renderStrategySelector(){
  const el=document.getElementById("strategySelector");
  if(!el) return;
  el.innerHTML=`
    <div class="style-label" style="margin-top:12px">Elige tu estrategia para este partido</div>
    <div class="strategy-grid">
      ${STRATEGY_ORDER.map(key=>{
        const s=STRATEGIES[key];
        const sel=selectedMatchStrategy===key?' selected':'';
        return `<button class="strategy-btn${sel}" data-key="${key}" onclick="chooseMatchStrategy('${key}')" title="${esc(s.desc)}">${s.name}</button>`;
      }).join('')}
    </div>
    ${selectedMatchStrategy?`<div class="strategy-desc">${STRATEGIES[selectedMatchStrategy].desc}</div>`:'<div class="strategy-desc strategy-desc-empty">Sin estrategia elegida: sin bonus ni penalización.</div>'}
  `;
}
function chooseMatchStrategy(key){
  if(!STRATEGIES[key]) return;
  playSound('select');
  selectedMatchStrategy = (selectedMatchStrategy===key) ? null : key; // click again to deselect
  renderStrategySelector();
}
window.chooseMatchStrategy=chooseMatchStrategy;

/* ---------- HISTORY / GROUP TABLE / BRACKET DISPLAY ---------- */
function renderMatchHistory(){
  const el=document.getElementById("matchHistoryTable");
  const prog=document.getElementById("matchProgress");
  if(!el) return;
  if(prog) prog.textContent=stage==="group"?"FASE DE GRUPOS":(ROUND_NAMES[knockoutRound]||"ELIMINATORIAS");
  let html="";
  // Always show group table once there are group matches
  if(groupTable.length && matchResults.some(r=>r.stage==="group")){
    html+=renderGroupTableHTML();
  }
  // Show knockout results below the group table
  const knockoutMatches=matchResults.filter(r=>r.stage==="knockout");
  if(knockoutMatches.length){
    html+=renderBracketHTML(knockoutMatches);
  }
  if(!html) html="";
  el.innerHTML=html;
}
function sortedGroupTable(){
  return [...groupTable].sort((a,b)=>{
    if(b.pts!==a.pts) return b.pts-a.pts;
    const gdA=a.gf-a.ga, gdB=b.gf-b.ga;
    if(gdB!==gdA) return gdB-gdA;
    return b.gf-a.gf;
  });
}
function renderGroupTableHTML(){
  if(!groupTable.length) return "";
  const sorted=sortedGroupTable();
  let rows="";
  sorted.forEach((r,i)=>{
    const qualified=i<2;
    const cls=r.isMe?"group-row-me":"";
    rows+=`<tr class="${cls}${qualified?' group-row-qualified':''}">
      <td>${i+1}</td>
      <td>${r.isMe?('<span class="flag-emoji goat-emoji">🐐</span> '+r.name):(flagEmoji(r.name,18)+' '+r.name)}</td>
      <td>${r.played}</td>
      <td>${r.won}</td>
      <td>${r.drawn}</td>
      <td>${r.lost}</td>
      <td>${r.gf}-${r.ga}</td>
      <td><strong>${r.pts}</strong></td>
    </tr>`;
  });
  return `<table class="group-table"><thead><tr><th>#</th><th>Equipo</th><th>PJ</th><th>G</th><th>E</th><th>P</th><th>GF-GC</th><th>Pts</th></tr></thead><tbody>${rows}</tbody></table>
  <div class="hint-line">Los 2 primeros avanzan a Octavos de Final.</div>`;
}
function renderBracketHTML(knockoutMatches){
  let rows="";
  knockoutMatches.forEach(r=>{
    const cls=r.won?"res-win":"res-lose";
    const tag=r.won?"V":"D";
    rows+=`<tr><td>${r.roundName}</td><td>${flagEmoji(r.rival,16)} ${r.rival}</td><td>${r.score}</td><td class="${cls}">${tag}</td></tr>`;
  });
  const nextRound=ROUND_NAMES[knockoutRound];
  return `<div class="hint-line" style="margin-top:10px;font-weight:700">ELIMINATORIAS</div>
  <table><thead><tr><th>Ronda</th><th>Rival</th><th>Resultado</th><th>Res</th></tr></thead><tbody>${rows}</tbody></table>
  <div class="hint-line">${nextRound&&stage==="knockout"?('Próxima ronda: '+nextRound):'¡Final completada!'}</div>`;
}

/* ========= MATCH SIMULATION ========= */
const STAT_BASELINE=50;
function computeMyPower(){
  if(!usedPlayers.length) return 60;
  const baseAvg=usedPlayers.reduce((s,p)=>s+effRating(p),0)/usedPlayers.length;
  const statsAvg=Object.values(teamStats).reduce((a,b)=>a+(b||0),0)/5;
  return baseAvg + statsAvg*0.04;
}
function myStatProfile(){
  // teamStats already holds absolute 0-100 values (clamped)
  const out={};
  ["attack","defense","pace","passing","technique"].forEach(k=>{
    out[k]=Math.max(0,Math.min(100,teamStats[k]||0));
  });
  return out;
}
function oppStatProfile(team){
  const out={};
  ["attack","defense","pace","passing","technique"].forEach(k=>{
    out[k]=Math.max(0,Math.min(100,STAT_BASELINE+(team.bonuses&&team.bonuses[k]||0)));
  });
  return out;
}
function computeOppPower(team){
  const pl=team.players.slice(0,11);
  const avg=pl.length?pl.reduce((s,p)=>s+(p.rating||75),0)/pl.length:75;
  const bonusBoost=Object.values(team.bonuses||{}).reduce((a,b)=>a+(Math.abs(b)||0),0)*0.12;
  // Rival fatigue: mirrors player fatigue accumulation across the tournament.
  // Group stage: slight fatigue by match 2-3. Knockout: accumulates each round.
  // This balances the fact that the player manages fatigue but the AI doesn't.
  let fatiguePenalty=0;
  if(stage==='group'){
    // Match 1: fresh (0), Match 2: minor (-0.4), Match 3: noticeable (-0.9)
    fatiguePenalty=[0,0.4,0.9][groupMatchIdx]||0;
  } else {
    // Octavos(0):-1.2, Cuartos(1):-2.0, Semis(2):-2.8, Final(3):-3.5
    fatiguePenalty=[1.2,2.0,2.8,3.5][knockoutRound]||1.2;
  }
  return avg + bonusBoost - fatiguePenalty;
}
/* Tactical matchup: returns a small lambda modifier for each side based on
   attack-vs-defense and supporting stats. Capped so it nudges, not dominates. */
function tacticalModifier(myStats,oppStats){
  // Positive = favors "me" scoring more / conceding less
  const atkVsDef=(myStats.attack - oppStats.defense)/100;       // my attack vs their defense
  const theirAtkVsMyDef=(oppStats.attack - myStats.defense)/100; // their attack vs my defense
  const supportMine=(myStats.passing+myStats.technique+myStats.pace - (oppStats.passing+oppStats.technique+oppStats.pace))/300;
  // My scoring boost: my attack beating their defense, plus a bit of support
  const myScoreMod = atkVsDef*0.35 + supportMine*0.15;
  // Their scoring boost: their attack beating my defense, minus my support edge
  const oppScoreMod = theirAtkVsMyDef*0.35 - supportMine*0.15;
  return {
    myScoreMod: Math.max(-0.4, Math.min(0.4, myScoreMod)),
    oppScoreMod: Math.max(-0.4, Math.min(0.4, oppScoreMod)),
  };
}
/* Counter-strategy: compares the MATCH STRATEGY chosen by the player
   (Tiki-Taka, Catenaccio, etc., picked fresh before each match) against
   the rival's narrative style mapped to one of the 10 strategies. Picking
   the correct counter gives a meaningful lambda bonus; mirroring the
   rival's own strategy gives a small penalty. */
function getRivalStrategyKey(team){
  // Map the rival's narrative style to one of the 10 match strategies
  return TEAM_STYLE_TO_STRATEGY[team._styleKey] || "posesion";
}
function counterStrategyModifier(){
  // Bonus if the player picked the strategy that counters the rival's strategy.
  // Picking the SAME strategy as the rival (mirroring) gives a small penalty —
  // mirroring an opponent's approach rarely creates an advantage.
  if(!nextOpponent) return {myScoreMod:0, oppScoreMod:0};
  const rivalKey=getRivalStrategyKey(nextOpponent);
  const myKey=selectedMatchStrategy;
  if(!myKey) return {myScoreMod:0, oppScoreMod:0}; // no strategy chosen = neutral
  const rivalStrat=STRATEGIES[rivalKey];
  const myStrat=STRATEGIES[myKey];
  const rivalCountersMe = rivalStrat && rivalStrat.counters===myKey;
  const iCounterRival    = myStrat && myStrat.counters===rivalKey;
  const iPartiallyCounterRival = myStrat && myStrat.partialCounters && myStrat.partialCounters.includes(rivalKey);
  let mod=0;
  if(iCounterRival)             mod=+0.16;  // perfect read of the opponent
  else if(iPartiallyCounterRival) mod=+0.08; // good read, but not the ideal answer
  else if(rivalCountersMe)      mod=-0.10; // picked the strategy the rival naturally beats
  else if(myKey===rivalKey)     mod=-0.04; // mirroring rarely pays off
  return { myScoreMod:mod, oppScoreMod:-mod*0.5, level: iCounterRival?'perfect':iPartiallyCounterRival?'partial':(rivalCountersMe?'countered':(myKey===rivalKey?'mirror':'neutral')) };
}
function poissonSample(lambda){
  const L=Math.exp(-lambda); let k=0,p=1;
  do{ k++; p*=Math.random(); }while(p>L);
  return k-1;
}
function playMatch(){
  if(!nextOpponent) return;
  swapsUsedThisMatch=0;
  swapSelection=null;
  // Tick injury timers
  const recovered=[];
  [...usedPlayers,...bench].forEach(p=>{
    if(p.injury){ p.injury.remaining--;
      if(p.injury.remaining<=0){ p.injury=null; p.forcedInjured=false; recovered.push(p.name); }
    }
  });
  refreshPitchRatings();
  baseTeamOVR=computeTeamOVR();
  updateConvocadosTable();
  updateBenchTable();
  const myPower=computeMyPower();
  const oppPower=computeOppPower(nextOpponent);
  // Base difference from overall player quality — dampened so matches stay close
  const diff=(myPower-oppPower)*0.03;
  // Tactical matchup from stats (attack vs defense, etc.) — meaningful but not dominant
  const tactical=tacticalModifier(myStatProfile(), oppStatProfile(nextOpponent));
  const counter=counterStrategyModifier();
  // Early-game cushion: the first 2 matches of EACH stage (group stage and
  // knockout stage) are a bit gentler, so a run of bad luck right at the
  // start of a new stage doesn't end the run instantly.
  const stageMatchIdx = stage==="group" ? groupMatchIdx : knockoutRound;
  // Early cushion per stage: the first 2 matches of groups AND knockout
  // are gentler so bad luck doesn't end the run immediately.
  const earlyBoost = stageMatchIdx===0 ? 0.18 : (stageMatchIdx===1 ? 0.10 : 0);
  // Small persistent nudge: groups favour qualification, knockout gives
  // a modest ongoing advantage so reaching the semis/final feels achievable.
  const groupNudge = stage==="group" ? 0.05 : 0.03;
  const starBonus=starMatchBonus();
  const moraleBonus=moraleLambdaBonus();
  const streakBonus=getStreakLambdaBonus();
  const weatherDelta=weatherLambdaEffect(); // weather was rolled when rival was revealed
  const myLambda=Math.max(0.25, 1.15+diff+tactical.myScoreMod+counter.myScoreMod+earlyBoost+groupNudge+starBonus+moraleBonus+streakBonus+weatherDelta);
  const oppLambda=Math.max(0.25, 1.15-diff+tactical.oppScoreMod+counter.oppScoreMod-earlyBoost*0.6-groupNudge*0.6+weatherDelta);
  let myGoals=window.CHEATS_ACTIVE ? (3+Math.floor(Math.random()*3)) : poissonSample(myLambda);
  let oppGoals=window.CHEATS_ACTIVE ? 0 : poissonSample(oppLambda);
  // Match narrative
  let summary=generateMatchSummary(myGoals,oppGoals,nextOpponent.name);
  updateScorerStreaks(generateMatchSummary._scorers||[]);
  // Injuries y tarjetas propias
  const newInjuries=rollInjuries(myPower,oppPower);
  const newCards=rollCards();
  // Eventos del rival (lesiones y tarjetas)
  const oppEvents=rollOppEvents(oppPower,myPower);
  // Si el rival tiene una expulsión, su lambda se reduce proporcionalmente
  // desde el minuto de la roja: reducción promedio de ~11% (10/11 jugadores)
  let adjOppLambda=oppLambda;
  if(oppEvents.redMinute!==null){
    // Fracción del partido que juegan con 10: (90-redMinute)/90
    const fracWith10=Math.max(0,(90-oppEvents.redMinute)/90);
    adjOppLambda=oppLambda*(1-fracWith10*0.11);
  }
  // Recalcular goles del rival con el lambda ajustado
  if(!window.CHEATS_ACTIVE && oppEvents.redMinute!==null){
    oppGoals=poissonSample(adjOppLambda);
  }
  // Fatigue y tabla se actualizan al TERMINAR el partido (en showPostMatch)
  // para que la tabla de convocados no cambie mientras se simula

  let won, draw=false, penaltyInfo=null, scoreLabel;
  if(stage==="group"){
    // Group stage: draws are allowed, no penalty shootout.
    if(myGoals===oppGoals){ draw=true; won=false; }
    else won=myGoals>oppGoals;
    scoreLabel=`${myGoals}-${oppGoals}`;
  } else {
    // Knockout: a draw must be resolved via penalties.
    won=myGoals>oppGoals;
    if(myGoals===oppGoals){
      penaltyInfo=simulatePenalties(myPower,oppPower);
      won=penaltyInfo.myWon;
      const myShotsHTML=penaltyInfo.myShots.map(s=>`<li>${s.scored?'✅':'❌'} ${s.name}</li>`).join('');
      const oppShotsHTML=penaltyInfo.oppShots.map(s=>`<li>${s.scored?'✅':'❌'} ${s.name}</li>`).join('');
      summary+=`<br><br><strong>⚽ TANDA DE PENALTIS: ${myTeamName} ${penaltyInfo.myScore} – ${penaltyInfo.oppScore} ${nextOpponent.name}</strong>
      <div class="goals-columns">
        <div class="goals-col">
          <div class="goals-col-header"><span class="flag-emoji goat-emoji">🐐</span> ${myTeamName}</div>
          <ul class="goals-list pen-shots">${myShotsHTML}</ul>
        </div>
        <div class="goals-col">
          <div class="goals-col-header">${flagEmoji(nextOpponent.name,20)} ${nextOpponent.name}</div>
          <ul class="goals-list pen-shots">${oppShotsHTML}</ul>
        </div>
      </div>`;
    }
    scoreLabel = penaltyInfo ? `${myGoals}-${oppGoals} (pen. ${penaltyInfo.myScore}-${penaltyInfo.oppScore})` : `${myGoals}-${oppGoals}`;
  }

  if(stage==="group"){
    updateGroupTable(myGoals,oppGoals,won,draw);
    matchResults.push({stage:"group", roundName:"Fase de Grupos", rival:nextOpponent.name, score:scoreLabel, won, draw});
    groupMatchIdx++;
    if(groupMatchIdx>=3) simulateRivalMatches();
  } else {
    matchResults.push({stage:"knockout", roundName:ROUND_NAMES[knockoutRound], rival:nextOpponent.name, score:scoreLabel, won, draw:false});
  }

  // Update morale based on result
  // Morale: goals scored/conceded affect it directly
  const moralGoals   = myGoals  * 3;   // +3 per goal scored
  const moralConceded= oppGoals * (-4); // -4 per goal conceded
  // Result bonus (reduced — goals already carry most of the swing)
  const moralResult  = won ? 6 : draw ? 1 : -8;
  changeMorale(moralGoals + moralConceded + moralResult);

  // Save match stats to Firebase if logged in
  if(typeof window.saveMatchStat==="function"){
    window.saveMatchStat(won, draw, myGoals, oppGoals);
  }

  // Track best round for chain run rewards
  if(stage==="group") bestRoundReached=Math.max(bestRoundReached,0);
  else bestRoundReached=Math.max(bestRoundReached, knockoutRound+1);

  // Resolve any pending press prediction against the real match result
  const predictionResult=resolvePendingPrediction({
    myGoals, oppGoals, won, draw,
    penalties: !!penaltyInfo,
    cardsCount: newCards.length,
  });

  renderMatchHistory();
  updateLed();
  showLiveMatch(myGoals,oppGoals,summary,recovered,newInjuries,won,draw,penaltyInfo,newCards,predictionResult,oppEvents);
}
document.getElementById("playMatchBtn").addEventListener("click",playMatch);

/* Update the group table after a group-stage match for both "me" and the
   specific opponent faced. */
function updateGroupTable(myGoals,oppGoals,won,draw){
  const meRow=groupTable.find(r=>r.isMe);
  const oppRow=groupTable.find(r=>r.team===nextOpponent);
  meRow.played++; oppRow.played++;
  meRow.gf+=myGoals; meRow.ga+=oppGoals;
  oppRow.gf+=oppGoals; oppRow.ga+=myGoals;
  if(draw){
    meRow.drawn++; oppRow.drawn++;
    meRow.pts+=1; oppRow.pts+=1;
  } else if(won){
    meRow.won++; meRow.pts+=3;
    oppRow.lost++;
  } else {
    meRow.lost++;
    oppRow.won++; oppRow.pts+=3;
  }
}

/* Simulate the 3 inter-rival matches that don't involve the player
   (A vs B, A vs C, B vs C), so the group table is fully populated.
   Called once after the player finishes their 3rd group match. */
function simulateRivalMatches(){
  const rivals=[groupOpponents[0], groupOpponents[1], groupOpponents[2]];
  const pairs=[[0,1],[0,2],[1,2]];
  pairs.forEach(([ai,bi])=>{
    const a=rivals[ai], b=rivals[bi];
    const pa=computeOppPower(a), pb=computeOppPower(b);
    const diff=(pa-pb)*0.03;
    const la=Math.max(0.25, 1.1+diff);
    const lb=Math.max(0.25, 1.1-diff);
    const ga=poissonSample(la), gb=poissonSample(lb);
    const rowA=groupTable.find(r=>r.team===a);
    const rowB=groupTable.find(r=>r.team===b);
    rowA.played++; rowB.played++;
    rowA.gf+=ga; rowA.ga+=gb;
    rowB.gf+=gb; rowB.ga+=ga;
    if(ga>gb){
      rowA.won++; rowA.pts+=3; rowB.lost++;
    } else if(gb>ga){
      rowB.won++; rowB.pts+=3; rowA.lost++;
    } else {
      rowA.drawn++; rowA.pts+=1;
      rowB.drawn++; rowB.pts+=1;
    }
  });
}

function simulatePenalties(myPower,oppPower){
  // Probability of scoring a penalty, slightly influenced by overall power
  const myProb=Math.min(0.92,Math.max(0.65,0.78+(myPower-oppPower)*0.01));
  const oppProb=Math.min(0.92,Math.max(0.65,0.78+(oppPower-myPower)*0.01));
  let myScore=0,oppScore=0;
  // Pick takers from my squad (prioritize attackers/midfielders)
  const priority=usedPlayers.filter(p=>p.placedPos&&["DC","EI","ED","MC"].includes(p.placedPos));
  const rest=usedPlayers.filter(p=>!priority.includes(p));
  const order=[...priority,...rest].slice(0,Math.max(5,0));
  // Pick takers from rival squad (prioritize attackers/midfielders)
  const oppPriority=nextOpponent.players.filter(p=>p.positions&&p.positions.some(pos=>["DC","EI","ED","MC"].includes(pos)));
  const oppRest=nextOpponent.players.filter(p=>!oppPriority.includes(p));
  const oppOrder=[...oppPriority,...oppRest];
  const myShots=[]; const oppShots=[];
  // Best-of-5 rounds, then sudden death
  for(let i=0;i<5;i++){
    const taker=order[i%order.length]||{name:myTeamName};
    const scored=Math.random()<myProb;
    if(scored) myScore++;
    myShots.push({name:taker.name,scored});
    const oppTaker=oppOrder[i%oppOrder.length]||{name:nextOpponent.name};
    const oppScored=Math.random()<oppProb;
    if(oppScored) oppScore++;
    oppShots.push({name:oppTaker.name,scored:oppScored});
  }
  let rounds=0;
  while(myScore===oppScore && rounds<10){
    const taker=order[(5+rounds)%order.length]||{name:myTeamName};
    const scored=Math.random()<myProb;
    if(scored) myScore++;
    myShots.push({name:taker.name,scored});
    const oppTaker=oppOrder[(5+rounds)%oppOrder.length]||{name:nextOpponent.name};
    const oppScored=Math.random()<oppProb;
    if(oppScored) oppScore++;
    oppShots.push({name:oppTaker.name,scored:oppScored});
    rounds++;
  }
  if(myScore===oppScore){ // extremely unlikely fallback
    if(Math.random()<0.5) myScore++; else oppScore++;
  }
  return {myScore,oppScore,myWon:myScore>oppScore,myShots,oppShots};
}

function generateMatchSummary(myGoals,oppGoals,rivalName){
  const possession=Math.round(45+Math.random()*20);
  const oppPoss=100-possession;
  const shots=myGoals*2+Math.floor(Math.random()*5)+3;
  const oppShots=oppGoals*2+Math.floor(Math.random()*4)+2;
  // Distribute goals across 90 min
  const myMinutes=[]; const oppMinutes=[];
  for(let i=0;i<myGoals;i++) myMinutes.push(Math.floor(5+Math.random()*85));
  for(let i=0;i<oppGoals;i++) oppMinutes.push(Math.floor(5+Math.random()*85));
  myMinutes.sort((a,b)=>a-b); oppMinutes.sort((a,b)=>a-b);
  // Pick random scorers from usedPlayers (mine) and the rival's squad
  const attackers=usedPlayers.filter(p=>p.placedPos&&["DC","EI","ED","MC"].includes(p.placedPos));
  const oppAttackers=nextOpponent.players.filter(p=>p.positions&&p.positions.some(pos=>["DC","EI","ED","MC"].includes(pos)));
  const oppPool=oppAttackers.length?oppAttackers:nextOpponent.players;
  const lastMatchScorers=[]; // store scorer names for streak tracking
  const myGoalLines=myMinutes.map(min=>{
    const scorer=attackers[Math.floor(Math.random()*attackers.length)]||usedPlayers[0];
    if(scorer) lastMatchScorers.push(scorer.name);
    // Buscar el emoji del equipo del goleador usando su id
    const scorerTeamEmoji=(()=>{
      if(!scorer||!scorer.id) return '';
      const parts=scorer.id.split('_');
      // id format: p_TEAMID_N o p_team_NAME_N
      let teamId;
      if(parts[1]==='team') teamId=null; // equipos especiales
      else teamId='team_'+parts[1];
      if(teamId){
        const t=teams.find(x=>x.id===teamId);
        return t?t.emoji||'':'';
      }
      return '';
    })();
    return `<li>⚽ ${scorerTeamEmoji} ${scorer?scorer.name:'Desconocido'} <span class="goal-min">(${min}')</span></li>`;
  });
  generateMatchSummary._scorers=lastMatchScorers;
  const oppGoalLines=oppMinutes.map(min=>{
    const scorer=oppPool[Math.floor(Math.random()*oppPool.length)];
    const oppEmoji=nextOpponent?nextOpponent.emoji||'':'';
    return `<li>⚽ ${oppEmoji} ${scorer?scorer.name:rivalName} <span class="goal-min">(${min}')</span></li>`;
  });

  const goalsHTML=`
  <div class="goals-columns">
    <div class="goals-col">
      <div class="goals-col-header"><span class="flag-emoji goat-emoji">🐐</span> ${myTeamName}</div>
      <ul class="goals-list">${myGoalLines.length?myGoalLines.join(''):'<li class="no-goal">Sin goles</li>'}</ul>
    </div>
    <div class="goals-col">
      <div class="goals-col-header">${flagEmoji(rivalName,20)} ${rivalName}</div>
      <ul class="goals-list">${oppGoalLines.length?oppGoalLines.join(''):'<li class="no-goal">Sin goles</li>'}</ul>
    </div>
  </div>`;

  return `<strong>Posesión:</strong> ${myTeamName} ${possession}% · ${rivalName} ${oppPoss}%<br>
<strong>Tiros a puerta:</strong> ${shots} – ${oppShots}
${goalsHTML}`;
}

function rollInjuries(myPower,oppPower){
  const fb=currentFormationBonus||{};
  // Recalibrated for the 40-point formation system, where almost every
  // formation has SOME skew — using a higher, fixed threshold so only
  // truly extreme picks (very lopsided attack/defense split) count as risky.
  const extreme=Math.abs((fb.attack||0)-(fb.defense||0));
  let risk=0.02;
  if(extreme>=16) risk=0.032;
  if((fb.defense||0)<(fb.attack||0)&&oppPower>myPower) risk+=0.008;
  const injured=[];
  usedPlayers.forEach(p=>{
    if(injured.length>=1||p.injury) return;
    if(Math.random()<risk){
      const r=Math.random();
      let type,remaining;
      if(r<0.5){type="leve";remaining=1;}
      else if(r<0.85){type="básica";remaining=2;}
      else{type="grave";remaining=3;}
      p.injury={type,remaining};
      injured.push(p);
    }
  });
  return injured;
}

/* ========= CARD SYSTEM (yellow/red, real World Cup rules) ========= */
// Per-player risk calibrated to real World Cup averages: ~1.8 yellow cards
// and ~0.1 red cards per TEAM per match (11 players), based on historical
// editions (1990: 3.71 yellows/match total both teams; 2006: ~5.4 — we use
// a middle-ground average, split evenly between both teams).
const YELLOW_RISK_PER_PLAYER = 0.017;
const RED_RISK_PER_PLAYER    = 0.010;

function rollCards(){
  const cardedThisMatch=[]; // {player, type: 'yellow'|'second_yellow_match'|'yellow2'|'red'}
  const yellowedThisMatch=new Set();
  usedPlayers.forEach(p=>{
    if(p.suspended) return; // already suspended this match, can't play/get carded (shouldn't be on pitch anyway)
    const r=Math.random();
    if(r<RED_RISK_PER_PLAYER){
      // Straight red — automatic suspension for the NEXT match
      p.suspendedNextMatch=true;
      p.cardStatus='red';
      cardedThisMatch.push({player:p, type:'red'});
    } else if(r<RED_RISK_PER_PLAYER+YELLOW_RISK_PER_PLAYER){
      yellowedThisMatch.add(p);
      p.yellowCount=(p.yellowCount||0)+1;
      if(p.yellowCount>=2){
        // Second yellow in DIFFERENT matches = accumulation suspension
        p.suspendedNextMatch=true;
        p.cardStatus='yellow2';
        cardedThisMatch.push({player:p, type:'yellow2'});
        p.yellowCount=0; // reset after serving the suspension trigger
      } else {
        p.cardStatus='yellow1';
        cardedThisMatch.push({player:p, type:'yellow'});
      }
    }
  });
  // Rare second pass: a player already booked this match has a small chance
  // of picking up a SECOND yellow in the SAME match (real "doble amarilla"
  // rule) — straight expulsion + suspension for the next match, regardless
  // of their accumulation count.
  const SAME_MATCH_SECOND_YELLOW_RISK=0.05; // 5% of those already booked this match
  yellowedThisMatch.forEach(p=>{
    if(p.suspendedNextMatch) return; // already sent off via accumulation or red
    if(Math.random()<SAME_MATCH_SECOND_YELLOW_RISK){
      p.suspendedNextMatch=true;
      p.cardStatus='double_yellow';
      cardedThisMatch.push({player:p, type:'double_yellow'});
    }
  });
  return cardedThisMatch;
}

/* ========= EVENTOS DEL RIVAL (lesiones y tarjetas) ========= */
function rollOppEvents(oppPower, myPower){
  const opp=nextOpponent;
  if(!opp||!opp.players||!opp.players.length) return {injuries:[], cards:[], redMinute:null};

  const pool=opp.players.filter(p=>p.positions&&!p.positions.includes('POR'));
  const allPool=opp.players;

  // Lesiones del rival — probabilidad similar a la del jugador
  const injRisk=0.025;
  const oppInjuries=[];
  const injPlayer=allPool[Math.floor(Math.random()*allPool.length)];
  if(injPlayer && Math.random()<injRisk){
    oppInjuries.push(injPlayer);
  }

  // Tarjetas del rival
  const oppCards=[];
  let redMinute=null; // minuto de expulsión si hay roja
  const yellowRisk=0.017;
  const redRisk=0.010;
  const yellowed=[];

  pool.forEach(p=>{
    const r=Math.random();
    if(r<redRisk){
      oppCards.push({player:p, type:'red'});
      // El minuto de expulsión: entre 10' y 80'
      if(!redMinute) redMinute=Math.floor(10+Math.random()*70);
    } else if(r<redRisk+yellowRisk){
      yellowed.push(p);
      oppCards.push({player:p, type:'yellow'});
    }
  });
  // Doble amarilla rara
  yellowed.forEach(p=>{
    if(Math.random()<0.05 && !oppCards.find(c=>c.player===p&&c.type==='red')){
      oppCards.push({player:p, type:'double_yellow'});
      if(!redMinute) redMinute=Math.floor(10+Math.random()*70);
    }
  });

  return {injuries:oppInjuries, cards:oppCards, redMinute};
}

function clearYellowCardsAfterQuarterfinals(){
  // FIFA rule: accumulated yellow cards are wiped after the quarterfinals,
  // so nobody misses a final purely from earlier accumulation.
  usedPlayers.forEach(p=>{ p.yellowCount=0; if(p.cardStatus==='yellow1') p.cardStatus=null; });
  bench.forEach(p=>{ p.yellowCount=0; if(p.cardStatus==='yellow1') p.cardStatus=null; });
}

function applyPendingSuspensions(){
  // Called right before a new match starts — converts "suspended for next
  // match" flags into an active suspension that blocks that player from
  // being fielded, then clears the flag once served.
  [...usedPlayers, ...bench].forEach(p=>{
    if(p.suspendedNextMatch){
      p.suspended=true;
      p.suspendedNextMatch=false;
    } else if(p.suspended){
      // Suspension already served last match — lift it now
      p.suspended=false;
      p.cardStatus=null;
    }
  });
  // Any starting player who is now suspended must be moved to the bench
  // automatically — this does NOT consume one of the player's swaps, since
  // it's outside their control. If no bench player is free to swap in,
  // the slot is simply left empty until the user manually resolves it.
  forceSwapSuspendedStarters();
}

function forceSwapSuspendedStarters(){
  const slots=getPitchSlots();
  usedPlayers.forEach((convPlayer,convIdx)=>{
    if(!convPlayer || !convPlayer.suspended) return;
    // Find a bench player who is NOT suspended/injured to bring on
    const benchIdx=bench.findIndex(b=>b && !b.suspended);
    const slot=slots.find(s=>s._player===convPlayer);
    if(!slot) return;
    const label=slot.dataset.label;
    if(benchIdx===-1){
      // No eligible bench replacement — leave the slot, but it stays
      // visibly flagged as suspended in the table so the user notices.
      return;
    }
    const benchPlayer=bench[benchIdx];
    benchPlayer.placedPos=label;
    delete convPlayer.placedPos;
    bench[benchIdx]=convPlayer;
    usedPlayers[convIdx]=benchPlayer;
    slot._player=benchPlayer;
    const inPos=benchPlayer.positions&&benchPlayer.positions.includes(label);
    const r=inPos?(benchPlayer.rating||70):Math.round((benchPlayer.rating||70)*0.85);
    const star=inPos&&benchPlayer.positions[0]===label?' <span class="star">★</span>':'';
    renderSlotContent(slot, benchPlayer, label, r, star);
  });
  baseTeamOVR=computeTeamOVR();
}

/* ========= LIVE MATCH SIMULATION — diseño match-modal + animación secuencial =========
   Usa el diseño visual de match-modal pero muestra todo de forma secuencial.
   Los eventos ocurren en sus minutos reales, incluyendo tiempo de descuento. */
function showLiveMatch(myGoals,oppGoals,summary,recovered,newInjuries,won,draw,penaltyInfo,newCards,predictionResult,oppEvents){
  const overlay=document.getElementById("matchOverlay");
  const oppName=nextOpponent?nextOpponent.name:'Rival';

  // ── Parsear eventos del resumen HTML ──
  const tempDiv=document.createElement('div');
  tempDiv.innerHTML=summary;
  const goalCols=tempDiv.querySelectorAll('.goals-col');
  const allEvents=[];
  if(goalCols.length>=2){
    goalCols[0].querySelectorAll('li').forEach(li=>{
      const txt=li.textContent;
      const m=txt.match(/(\d+)'\)/);
      if(m) allEvents.push({minute:parseInt(m[1]),type:'mygoal',icon:'⚽',
        text:`<strong>${txt.replace(/⚽/,'').replace(/\(\d+'\)/,'').trim()}</strong>`});
    });
    goalCols[1].querySelectorAll('li').forEach(li=>{
      const txt=li.textContent;
      const m=txt.match(/(\d+)'\)/);
      if(m) allEvents.push({minute:parseInt(m[1]),type:'oppgoal',icon:'⚽',
        text:`<strong>${txt.replace(/⚽/,'').replace(/\(\d+'\)/,'').trim()}</strong> <span style="color:var(--red);font-size:10px">(${oppName})</span>`});
    });
  }
  // Tarjetas e lesiones con minutos realistas (pueden caer en descuento)
  const CICONS={yellow:'🟨',yellow2:'🟨🟨',double_yellow:'🟨🟥',red:'🟥'};
  if(newCards&&newCards.length){
    newCards.forEach(c=>allEvents.push({
      minute:Math.floor(5+Math.random()*90), // pueden llegar a 90+
      type:'card',icon:CICONS[c.type]||'🟨',
      text:`<strong>${c.player.name}</strong>`
    }));
  }
  if(newInjuries&&newInjuries.length){
    newInjuries.forEach(p=>allEvents.push({
      minute:Math.floor(20+Math.random()*75),
      type:'injury',icon:'✚',
      text:`<strong>${p.name}</strong>`
    }));
  }
  // Eventos del rival (lesiones y tarjetas)
  if(oppEvents){
    const CICONS={yellow:'🟨',double_yellow:'🟨🟥',red:'🟥'};
    if(oppEvents.injuries&&oppEvents.injuries.length){
      oppEvents.injuries.forEach(p=>allEvents.push({
        minute:Math.floor(20+Math.random()*65),
        type:'oppcard',icon:'✚',
        text:`<strong>${p.name}</strong>`
      }));
    }
    if(oppEvents.cards&&oppEvents.cards.length){
      oppEvents.cards.forEach(c=>allEvents.push({
        minute:c.type==='red'||c.type==='double_yellow'?(oppEvents.redMinute||Math.floor(10+Math.random()*70)):Math.floor(5+Math.random()*85),
        type:'oppcard',icon:CICONS[c.type]||'🟨',
        text:`<strong>${c.player.name}</strong>`
      }));
    }
  }
  allEvents.sort((a,b)=>a.minute-b.minute);

  // Tiempos de descuento
  const inj1=Math.floor(1+Math.random()*4);
  const inj2=Math.floor(2+Math.random()*5);
  const MAX_MIN=90+inj2;

  // Resultado
  const wasShootout=!!penaltyInfo;
  let resultText,resultClass;
  if(draw){ resultText="EMPATE"; resultClass="res-draw-tag"; }
  else {
    resultText=won?(wasShootout?"¡VICTORIA EN PENALTIS!":"¡VICTORIA!"):(wasShootout?"DERROTA EN PENALTIS":"DERROTA");
    resultClass=won?"res-win-tag":"res-lose-tag";
  }

  // ── HTML inicial — diseño match-modal ──
  overlay.innerHTML=`
  <div class="match-modal" style="overflow:hidden;display:flex;flex-direction:column;max-height:85vh">
    <div class="match-header">
      <div class="match-side">
        <span class="match-flag">🐐</span>
        <span class="match-team-name">${myTeamName}</span>
      </div>
      <div style="text-align:center;flex:0 0 auto">
        <div class="match-scoreline" id="liveScore" style="font-size:42px;letter-spacing:4px">0 – 0</div>
        <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:4px">
          <div style="font-family:'Bebas Neue',Impact,sans-serif;font-size:20px;color:var(--gold)" id="liveClock">0'</div>
          <div style="font-size:9px;font-weight:700;background:var(--accent);color:#fff;padding:2px 7px;letter-spacing:1px;text-transform:uppercase" id="liveHalf">1ª PARTE</div>
        </div>
        <div style="height:4px;background:#eee;border-radius:2px;margin-top:6px;overflow:hidden">
          <div id="liveFill" style="height:100%;background:var(--accent);border-radius:2px;width:0%;transition:width .15s linear"></div>
        </div>
      </div>
      <div class="match-side">
        ${flagEmoji(nextOpponent.name)}
        <span class="match-team-name">${oppName}</span>
      </div>
    </div>
    <div id="liveEvents" style="flex:1;overflow-y:auto;display:flex;flex-direction:column;align-items:stretch;gap:2px;padding:4px 0;min-height:80px;max-height:260px"></div>
  </div>`;

  const eventsEl=document.getElementById('liveEvents');
  const clockEl=document.getElementById('liveClock');
  const halfEl=document.getElementById('liveHalf');
  const fillEl=document.getElementById('liveFill');
  const scoreEl=document.getElementById('liveScore');
  let curMy=0,curOpp=0;

  function flashScore(){ scoreEl.classList.remove('goal-flash'); void scoreEl.offsetWidth; scoreEl.classList.add('goal-flash'); }

  function addSep(text){
    const sep=document.createElement('div');
    sep.style.cssText='text-align:center;font-size:10px;font-weight:700;color:var(--accent);letter-spacing:2px;padding:4px 0;border-top:1px solid #eee;border-bottom:1px solid #eee;margin:2px 0;text-transform:uppercase';
    sep.textContent=text;
    eventsEl.appendChild(sep);
    eventsEl.scrollTop=eventsEl.scrollHeight;
  }

  function addEvt(icon,text,minLabel,type){
    const item=document.createElement('div');
    item.style.cssText='display:grid;grid-template-columns:1fr 44px 1fr;align-items:center;width:100%;font-size:12px;animation:slideInEvent .3s ease;opacity:0;animation-fill-mode:forwards;padding:3px 0;border-bottom:1px solid rgba(0,0,0,.05)';
    const isMe=type==='mygoal'||type==='card'||type==='injury'||type==='pen_me';
    const isOpp=type==='oppgoal'||type==='pen_opp'||type==='oppcard';
    const myColor=type==='mygoal'||type==='pen_me'?'var(--accent)':type==='card'?'#a07a00':type==='injury'?'#e74c3c':'var(--text)';
    const oppColor=type==='oppgoal'||type==='pen_opp'?'var(--red)':type==='oppcard'?'#a07a00':'var(--text)';
    // Centro: minuto
    const center=`<span style="font-family:'Bebas Neue',Impact,sans-serif;font-size:12px;color:#999;text-align:center;display:block">${minLabel}</span>`;
    if(isMe){
      item.innerHTML=`<span style="text-align:right;padding-right:6px;color:${myColor};line-height:1.3">${text} <span style="font-size:14px">${icon}</span></span>${center}<span></span>`;
    } else if(isOpp){
      item.innerHTML=`<span></span>${center}<span style="text-align:left;padding-left:6px;color:${oppColor};line-height:1.3"><span style="font-size:14px">${icon}</span> ${text}</span>`;
    } else {
      // penalti neutro o separador inline
      item.innerHTML=`<span style="text-align:right;padding-right:6px;color:var(--text);line-height:1.3">${text} ${icon}</span>${center}<span></span>`;
    }
    eventsEl.appendChild(item);
    eventsEl.scrollTop=eventsEl.scrollHeight;
  }

  // ── Animación — fase 1 reglamento (9s) ──────────────────────────────────
  const REG_DURATION=9000;
  const HT_S=0.47,HT_E=0.53;
  let eventIdx=0,htShown=false;
  const regStart=performance.now();

  function tickReg(now){
    const frac=Math.min((now-regStart)/REG_DURATION,1);
    if(frac>=HT_S&&frac<HT_E){
      if(!htShown){
        htShown=true;
        clockEl.textContent=`45+${inj1}'`;
        halfEl.textContent='DESCANSO';
        halfEl.style.background='#a07a00';
        fillEl.style.width='50%';
        addSep(`Descanso — 45+${inj1}'`);
        playSound('whistle');
      }
      requestAnimationFrame(tickReg); return;
    }
    let minute;
    if(frac<HT_S){
      minute=Math.min(45+inj1,Math.floor(frac/HT_S*(45+inj1)));
      halfEl.textContent='1ª PARTE'; halfEl.style.background='var(--accent)';
      fillEl.style.width=`${(frac/HT_S)*50}%`;
      clockEl.textContent=minute>45?`45+${minute-45}'`:`${minute}'`;
    } else {
      const f2=(frac-HT_E)/(1-HT_E);
      minute=46+Math.floor(f2*(MAX_MIN-46));
      minute=Math.min(minute,MAX_MIN);
      halfEl.textContent='2ª PARTE'; halfEl.style.background='var(--accent)';
      fillEl.style.width=`${50+f2*50}%`;
      clockEl.textContent=minute>90?`90+${minute-90}'`:`${minute}'`;
    }
    while(eventIdx<allEvents.length&&allEvents[eventIdx].minute<=minute){
      const ev=allEvents[eventIdx++];
      const label=ev.minute>90?`90+${ev.minute-90}'`:ev.minute>45&&ev.minute<=45+inj1?`45+${ev.minute-45}'`:`${ev.minute}'`;
      addEvt(ev.icon,ev.text,label,ev.type);
      if(ev.type==='mygoal'){ curMy++; scoreEl.textContent=`${curMy} – ${curOpp}`; flashScore(); playSound('goal'); }
      else if(ev.type==='oppgoal'){ curOpp++; scoreEl.textContent=`${curMy} – ${curOpp}`; flashScore(); playSound('goal'); }
    }
    if(frac<1){ requestAnimationFrame(tickReg); return; }
    // Fin reglamento
    clockEl.textContent=`90+${inj2}'`; fillEl.style.width='100%';
    halfEl.textContent='FIN'; halfEl.style.background='#555';
    playSound('whistle');
    if(penaltyInfo) setTimeout(startExtraTime,900);
    else { playSound(won||draw?'victory':'defeat'); setTimeout(showPostMatch,800); }
  }
  requestAnimationFrame(tickReg);

  // ── Fase 3: Prórroga ────────────────────────────────────────────────────
  function startExtraTime(){
    halfEl.textContent='PRÓRROGA'; halfEl.style.background='#7a3a0a';
    addSep('— PRÓRROGA —');
    const ET=4000,ET_S=0.47,ET_E=0.53;
    let etHt=false;
    const etStart=performance.now();
    function tickET(now){
      const frac=Math.min((now-etStart)/ET,1);
      if(frac>=ET_S&&frac<ET_E){
        if(!etHt){ etHt=true; clockEl.textContent="105'"; halfEl.textContent='DESCANSO P.'; halfEl.style.background='#a07a00'; addSep("Descanso prórroga — 105'"); playSound('whistle'); }
        requestAnimationFrame(tickET); return;
      }
      if(frac<ET_S){ clockEl.textContent=`${91+Math.floor((frac/ET_S)*14)}'`; halfEl.textContent='PRÓRROGA 1ª'; halfEl.style.background='#7a3a0a'; }
      else { const f2=(frac-ET_E)/(1-ET_E); clockEl.textContent=`${106+Math.floor(f2*14)}'`; halfEl.textContent='PRÓRROGA 2ª'; halfEl.style.background='#7a3a0a'; }
      if(frac<1){ requestAnimationFrame(tickET); return; }
      clockEl.textContent="120'"; halfEl.textContent='FIN PRÓRROGA'; halfEl.style.background='#555';
      playSound('whistle'); setTimeout(startPenalties,900);
    }
    requestAnimationFrame(tickET);
  }

  // ── Fase 4: Penaltis ────────────────────────────────────────────────────
  function startPenalties(){
    halfEl.textContent='PENALTIS'; halfEl.style.background='#3a0a5a'; clockEl.textContent='—';
    addSep('— TANDA DE PENALTIS —');
    const myShots=penaltyInfo.myShots,oppShots=penaltyInfo.oppShots;
    const maxLen=Math.max(myShots.length,oppShots.length);
    const sequence=[];
    for(let i=0;i<maxLen;i++){
      if(i<myShots.length) sequence.push({team:'me',shot:myShots[i],round:i+1});
      if(i<oppShots.length) sequence.push({team:'opp',shot:oppShots[i],round:i+1});
    }
    let penMy=0,penOpp=0,seqIdx=0;
    function label(r){ return r<=5?`P${r}`:'SD'; }
    function updatePenScore(){ scoreEl.textContent=`${curMy}(${penMy}) – ${curOpp}(${penOpp})`; }
    updatePenScore();
    function nextPen(){
      if(seqIdx>=sequence.length){ finishPenalties(); return; }
      const {team,shot,round}=sequence[seqIdx++];
      setTimeout(()=>{
        if(team==='me'){
          if(shot.scored) penMy++;
          addEvt(shot.scored?'✅':'❌',`<strong>${shot.name}</strong>`,label(round),'pen_me');
        } else {
          if(shot.scored) penOpp++;
          addEvt(shot.scored?'✅':'❌',`<strong>${shot.name}</strong> <span style="font-size:10px;color:var(--red)">${oppName}</span>`,label(round),'pen');
        }
        updatePenScore();
        if(shot.scored) playSound('goal');
        const myRem=myShots.filter((_,i)=>i>=Math.ceil(seqIdx/2)).length;
        const oppRem=oppShots.filter((_,i)=>i>=Math.floor(seqIdx/2)).length;
        const diff=penMy-penOpp;
        if(diff>oppRem||-diff>myRem){ setTimeout(finishPenalties,600); return; }
        setTimeout(nextPen,700);
      },600);
    }
    function finishPenalties(){
      const penWon=penMy>penOpp;
      addSep(`${penWon?'🏆':'💔'} ${penWon?myTeamName:oppName} gana la tanda ${penMy}–${penOpp}`);
      playSound(penWon?'victory':'defeat');
      setTimeout(showPostMatch,1200);
    }
    setTimeout(nextPen,500);
  }

  // ── Post-partido: añadir info al mismo modal ─────────────────────────────
  function showPostMatch(){
    const modal=overlay.querySelector('.match-modal');
    if(!modal) return;
    modal.style.overflowY='auto';

    // Banner resultado
    const banner=document.createElement('div');
    banner.className=`match-result-tag ${resultClass}`;
    banner.textContent=resultText;
    banner.style.animation='slideInEvent .4s ease forwards';
    modal.insertBefore(banner, eventsEl.nextSibling);

    // Info post-partido (lesiones, tarjetas, prensa, estrategia)
    const infoWrap=document.createElement('div');
    infoWrap.style.cssText='display:flex;flex-direction:column;gap:6px;margin-top:8px';

    // Estadísticas del partido: posesión + tiros (primeras 2 líneas del summary)
    const summaryDiv=document.createElement('div');
    summaryDiv.className='match-summary';
    // Extraer la parte de estadísticas (antes del bloque goals-columns)
    // El summary tiene el formato: "Posesión:...<br>Tiros:...\n<div class=goals-columns>..."
    const goalsColIdx=summary.indexOf('<div class="goals-columns">');
    const statsRaw=goalsColIdx>0 ? summary.substring(0,goalsColIdx) : summary;
    // Limpiar: el statsRaw ya tiene HTML válido con <strong> y <br>
    summaryDiv.innerHTML=statsRaw.trim();
    infoWrap.appendChild(summaryDiv);
    // Los goles ya aparecen en el feed secuencial arriba, no se duplican aquí

    // Recuperados
    if(recovered.length){
      const r=document.createElement('div');
      r.className='match-summary recovered-box';
      r.innerHTML=`<strong>✅ Recuperados:</strong> ${recovered.join(', ')}`;
      infoWrap.appendChild(r);
    }

    // Lesiones
    if(newInjuries.length){
      const ILABELS={leve:'leve (1 partido)',básica:'básica (2 partidos)',grave:'grave (3 partidos)'};
      const inj=document.createElement('div');
      inj.className='injury-section';
      inj.innerHTML=`<p>⚠ Lesiones en ${myTeamName}:</p><ul>${newInjuries.map(p=>`<li><span style="color:#e74c3c">✚</span> ${p.name}: lesión ${ILABELS[p.injury.type]||''}</li>`).join('')}</ul>`;
      infoWrap.appendChild(inj);
    }

    // Tarjetas
    if(newCards&&newCards.length){
      const CARD_LABELS={yellow:{icon:'🟨',text:'amarilla'},yellow2:{icon:'🟨🟨',text:'2ª amarilla — sancionado'},double_yellow:{icon:'🟨🟥',text:'doble amarilla — sancionado'},red:{icon:'🟥',text:'roja directa — sancionado'}};
      const cd=document.createElement('div');
      cd.className='card-section';
      cd.innerHTML=`<p>📋 Tarjetas:</p><ul>${newCards.map(c=>{const l=CARD_LABELS[c.type];return `<li>${l.icon} ${c.player.name}: ${l.text}</li>`;}).join('')}</ul>`;
      infoWrap.appendChild(cd);
    }

    // Entrevista de prensa
    if(predictionResult){
      const cls=predictionResult.outcome==='correct'?'press-prediction-good':predictionResult.outcome==='wrong'?'press-prediction-bad':'press-prediction-neutral';
      const pr=document.createElement('div');
      pr.className=`press-prediction-section ${cls}`;
      pr.textContent=predictionResult.text;
      infoWrap.appendChild(pr);
    }

    // Estrategia
    if(selectedMatchStrategy&&nextOpponent){
      const rivalKey=getRivalStrategyKey(nextOpponent);
      const myKey=selectedMatchStrategy;
      const myStrat=STRATEGIES[myKey];
      const iCounter=myStrat&&myStrat.counters===rivalKey;
      const iPartial=myStrat&&myStrat.partialCounters&&myStrat.partialCounters.includes(rivalKey);
      const counteredBy=STRATEGIES[rivalKey]&&STRATEGIES[rivalKey].counters===myKey;
      let stratMsg,stratClass;
      if(iCounter){stratMsg=`✓ Tu estrategia (${myStrat.name}) contrarrestó perfectamente a ${oppName}.`;stratClass='strategy-feedback-good';}
      else if(iPartial){stratMsg=`✓ Tu estrategia (${myStrat.name}) controló bien a ${oppName}.`;stratClass='strategy-feedback-good';}
      else if(counteredBy){stratMsg=`✗ ${oppName} aprovechó el enfrentamiento táctico.`;stratClass='strategy-feedback-bad';}
      else if(myKey===rivalKey){stratMsg=`= Ambos jugaron con un enfoque similar (${myStrat.name}).`;stratClass='strategy-feedback-neutral';}
      else{stratMsg=`Estrategia neutral: ${myStrat.name}, sin ventaja táctica clara.`;stratClass='strategy-feedback-neutral';}
      const sf=document.createElement('div');
      sf.className=`strategy-feedback ${stratClass}`;
      sf.textContent=stratMsg;
      infoWrap.appendChild(sf);
    }

    modal.appendChild(infoWrap);

    // Aplicar efectos del partido ahora que ha terminado
    applyMatchFatigue();
    refreshPitchRatings();
    baseTeamOVR=computeTeamOVR();
    updateConvocadosTable();
    updateBenchTable();

    // Botón continuar
    let btnLabel,outcome;
    if(stage==='group'){
      if(groupMatchIdx>=3){btnLabel='VER RESULTADOS DE GRUPO';outcome='groupDone';}
      else{btnLabel='SIGUIENTE PARTIDO';outcome='nextGroupMatch';}
    } else {
      if(!won){btnLabel='FIN DEL TORNEO';outcome='knockoutLost';}
      else if(knockoutRound>=ROUND_NAMES.length-1){btnLabel='VER RESUMEN FINAL';outcome='champion';}
      else{btnLabel='SIGUIENTE RONDA';outcome='nextKnockoutMatch';}
    }
    const btn=document.createElement('button');
    btn.className='modal-btn';
    btn.textContent=btnLabel;
    btn.style.marginTop='10px';
    btn.addEventListener('click',()=>{
      overlay.innerHTML='';
      switch(outcome){
        case 'nextGroupMatch': pickNextOpponent(); break;
        case 'groupDone': renderMatchHistory(); showGroupResultsPopup(); break;
        case 'nextKnockoutMatch': if(knockoutRound===1)clearYellowCardsAfterQuarterfinals(); knockoutRound++; pickNextOpponent(); break;
        case 'champion': showVictory(); break;
        case 'knockoutLost': showEliminated(); break;
      }
    });
    modal.appendChild(btn);

    // Scroll al final para ver el banner y la info
    setTimeout(()=>{ overlay.querySelector('.match-modal').scrollTop=9999; },100);
  }
}


function showMatchModal(myGoals,oppGoals,summary,recovered,newInjuries,won,draw,penaltyInfo,newCards,predictionResult){
  const wasShootout=!!penaltyInfo;
  let resultText, resultClass;
  if(draw){
    resultText="EMPATE"; resultClass="res-draw-tag";
  } else {
    resultText=won?(wasShootout?"¡VICTORIA EN PENALTIS!":"¡VICTORIA!"):(wasShootout?"DERROTA EN PENALTIS":"DERROTA");
    resultClass=won?"res-win-tag":"res-lose-tag";
  }
  playSound(won||draw?'victory':'defeat');
  let extraHTML="";
  if(recovered.length){
    extraHTML+=`<div class="match-summary recovered-box"><strong>Recuperados:</strong> ${recovered.join(", ")}</div>`;
  }
  if(newInjuries.length){
    const ILABELS={leve:"leve (1 partido)",básica:"básica (2 partidos)",grave:"grave (3 partidos)"};
    extraHTML+=`<div class="injury-section"><p>⚠ Lesiones en ${myTeamName} tras el partido:</p><ul>${newInjuries.map(p=>`<li>${p.name}: lesión ${ILABELS[p.injury.type]}</li>`).join('')}</ul><p class="injury-note">Recuerda: puedes hacer hasta <strong>5 cambios</strong> entre Convocados y Banquillo antes del próximo partido. Hazlo manualmente desde las tablas de la izquierda.</p></div>`;
  }
  if(newCards&&newCards.length){
    const CARD_LABELS={
      yellow:       {icon:"🟨", text:"amarilla"},
      yellow2:      {icon:"🟨🟨", text:"2ª amarilla (acumulación) — sancionado el próximo partido"},
      double_yellow:{icon:"🟨🟥", text:"doble amarilla — expulsado, sancionado el próximo partido"},
      red:          {icon:"🟥", text:"roja directa — sancionado el próximo partido"},
    };
    extraHTML+=`<div class="card-section"><p>📋 Tarjetas en ${myTeamName} tras el partido:</p><ul>${newCards.map(c=>{
      const lbl=CARD_LABELS[c.type];
      return `<li>${lbl.icon} ${c.player.name}: ${lbl.text}</li>`;
    }).join('')}</ul></div>`;
  }
  if(predictionResult){
    const cls=predictionResult.outcome==='correct'?'press-prediction-good':
               predictionResult.outcome==='wrong'?'press-prediction-bad':'press-prediction-neutral';
    extraHTML+=`<div class="press-prediction-section ${cls}">${predictionResult.text}</div>`;
  }
  // Strategy result feedback
  if(selectedMatchStrategy && nextOpponent){
    const rivalKey=getRivalStrategyKey(nextOpponent);
    const myKey=selectedMatchStrategy;
    const myStrat=STRATEGIES[myKey];
    const iCounter = myStrat && myStrat.counters===rivalKey;
    const iPartialCounter = myStrat && myStrat.partialCounters && myStrat.partialCounters.includes(rivalKey);
    const counteredByRival = STRATEGIES[rivalKey] && STRATEGIES[rivalKey].counters===myKey;
    let stratMsg, stratClass;
    if(iCounter){ stratMsg=`✓ Tu estrategia (${myStrat.name}) contrarrestó perfectamente a ${nextOpponent.name}.`; stratClass="strategy-feedback-good"; }
    else if(iPartialCounter){ stratMsg=`✓ Tu estrategia (${myStrat.name}) controló bien a ${nextOpponent.name}, aunque no era la elección perfecta.`; stratClass="strategy-feedback-good"; }
    else if(counteredByRival){ stratMsg=`✗ ${nextOpponent.name} aprovechó mejor el enfrentamiento táctico esta vez.`; stratClass="strategy-feedback-bad"; }
    else if(myKey===rivalKey){ stratMsg=`= Ambos equipos jugaron con un enfoque similar (${myStrat.name}).`; stratClass="strategy-feedback-neutral"; }
    else { stratMsg=`Estrategia neutral: ${myStrat.name}, sin ventaja táctica clara.`; stratClass="strategy-feedback-neutral"; }
    extraHTML+=`<div class="strategy-feedback ${stratClass}">${stratMsg}</div>`;
  }

  // Determine continue-button label and the outcome it leads to
  let btnLabel, outcome;
  if(stage==="group"){
    if(groupMatchIdx>=3) btnLabel="VER RESULTADOS DE GRUPO", outcome="groupDone";
    else btnLabel="SIGUIENTE PARTIDO", outcome="nextGroupMatch";
  } else { // knockout
    if(!won){ btnLabel="FIN DEL TORNEO"; outcome="knockoutLost"; }
    else if(knockoutRound>=ROUND_NAMES.length-1){ btnLabel="VER RESUMEN FINAL"; outcome="champion"; }
    else { btnLabel="SIGUIENTE RONDA"; outcome="nextKnockoutMatch"; }
  }

  document.getElementById("matchOverlay").innerHTML=`
  <div class="match-modal">
    <div class="match-header">
      <div class="match-side">
        <span class="flag-emoji match-flag">🐐</span>
        <span class="match-team-name">${myTeamName}</span>
      </div>
      <div class="match-scoreline">${myGoals} – ${oppGoals}</div>
      <div class="match-side">
        ${flagEmoji(nextOpponent.name)}
        <span class="match-team-name">${nextOpponent.name}</span>
      </div>
    </div>
    <div class="match-result-tag ${resultClass}">${resultText}</div>
    <div class="match-summary">${summary}</div>
    ${extraHTML}
    <button class="modal-btn" id="matchContinueBtn">${btnLabel}</button>
  </div>`;
  document.getElementById("matchContinueBtn").addEventListener("click",()=>{
    document.getElementById("matchOverlay").innerHTML="";
    switch(outcome){
      case "nextGroupMatch":
        pickNextOpponent();
        break;
      case "groupDone":
        renderMatchHistory();
        showGroupResultsPopup();
        break;
      case "nextKnockoutMatch":
        // If we're moving FROM Cuartos de Final (index 1) TO Semifinal (index 2),
        // wipe accumulated yellow cards per FIFA rules — nobody should miss
        // a final purely from earlier-round accumulation.
        if(knockoutRound===1) clearYellowCardsAfterQuarterfinals();
        knockoutRound++;
        pickNextOpponent();
        break;
      case "champion":
        showVictory();
        break;
      case "knockoutLost":
        showEliminated();
        break;
    }
  });
}

/* ---------- PROGRESSIVE GROUP RESULTS POPUP ---------- */
function showGroupResultsPopup(){
  const sorted=sortedGroupTable();
  const meIdx=sorted.findIndex(r=>r.isMe);
  const qualified=meIdx<2;
  document.getElementById("matchOverlay").innerHTML=`
  <div class="match-modal">
    <h3>FASE DE GRUPOS — RESULTADOS</h3>
    <div class="match-summary">Así queda la tabla de tu grupo:</div>
    <div id="groupResultsTableWrap"></div>
    <button class="modal-btn" id="groupResultsContinueBtn" style="display:none">CONTINUAR</button>
  </div>`;
  const wrap=document.getElementById("groupResultsTableWrap");
  let i=0;
  function revealNext(){
    const shown=sorted.slice(0,i+1);
    let rows="";
    shown.forEach((r,idx)=>{
      const qual=idx<2;
      const cls=(r.isMe?"group-row-me":"")+(qual?' group-row-qualified':'');
      rows+=`<tr class="${cls}">
        <td>${idx+1}</td>
        <td>${r.isMe?('<span class="flag-emoji goat-emoji">🐐</span> '+r.name):(flagEmoji(r.name,18)+' '+r.name)}</td>
        <td>${r.played}</td><td>${r.won}</td><td>${r.drawn}</td><td>${r.lost}</td>
        <td>${r.gf}-${r.ga}</td><td><strong>${r.pts}</strong></td>
      </tr>`;
    });
    wrap.innerHTML=`<table class="group-table"><thead><tr><th>#</th><th>Equipo</th><th>PJ</th><th>G</th><th>E</th><th>P</th><th>GF-GC</th><th>Pts</th></tr></thead><tbody>${rows}</tbody></table>`;
    playSound('reveal');
    i++;
    if(i<sorted.length){
      setTimeout(revealNext, 600);
    } else {
      const btn=document.getElementById("groupResultsContinueBtn");
      const summary=document.createElement("div");
      summary.className="match-result-tag "+(qualified?"res-win-tag":"res-lose-tag");
      summary.textContent=qualified
        ? `¡${myTeamName} clasificado para Octavos de Final! (${meIdx+1}º del grupo)`
        : `${myTeamName} eliminado en la fase de grupos (${meIdx+1}º del grupo)`;
      wrap.parentNode.insertBefore(summary, btn);
      btn.style.display="block";
      btn.addEventListener("click",()=>{
        document.getElementById("matchOverlay").innerHTML="";
        if(qualified){
          stage="knockout";
          knockoutRound=0;
          renderMatchHistory();
          renderCenterSummary();
          pickNextOpponent();
        } else {
          showEliminatedGroupStage();
        }
      });
    }
  }
  setTimeout(revealNext, 300);
}

/* ---------- END SCREENS ---------- */
function showEliminatedGroupStage(){
  const sc=computeFinalScore(false);
  if(typeof window.saveMatchStat==="function") window.saveMatchStat(false,false,0,0);
  if(typeof window.saveFinalScore==="function") window.saveFinalScore(sc.total);
  document.getElementById("matchOverlay").innerHTML=`
  <div class="match-modal">
    <h3>FASE DE GRUPOS</h3>
    <div class="match-result-tag res-lose-tag">ELIMINADO EN FASE DE GRUPOS</div>
    <div class="match-summary">${myTeamName} no ha conseguido clasificarse entre los 2 primeros del grupo.</div>
    <div class="victory-score-wrap" style="border-top:1px solid #333;margin-top:12px;padding-top:12px">
      <div class="victory-score-label">PUNTUACIÓN</div>
      <div class="victory-score-num" style="font-size:48px">${sc.total}</div>
    </div>
    <button class="modal-btn danger" onclick="location.reload()">NUEVA PARTIDA</button>
  </div>`;
}
function showEliminated(){
  const round=ROUND_NAMES[knockoutRound];
  const sc=computeFinalScore(false);
  if(typeof window.saveFinalScore==="function") window.saveFinalScore(sc.total);
  const grade=sc.total>=750?"ÉLITE":sc.total>=550?"MUY BUENO":sc.total>=350?"BUENO":"MEJORABLE";
  // Run encadenada según la ronda alcanzada:
  // Cuartos (1) → 1 slot, Semis (2) → 2 slots, Final (3) → 3 slots
  const chainSlotsByRound={1:1, 2:2, 3:3};
  const slots=chainSlotsByRound[knockoutRound]||0;
  const chainBtn=slots>0
    ?`<button class="modal-btn" onclick="document.getElementById('matchOverlay').innerHTML='';showChainRunModal()">🔗 CONSERVAR ${slots} JUGADOR${slots>1?"ES":""}</button>`
    :"";
  document.getElementById("matchOverlay").innerHTML=`
  <div class="match-modal">
    <h3>${round?round.toUpperCase():"ELIMINATORIAS"}</h3>
    <div class="match-result-tag res-lose-tag">ELIMINADO EN ${round?round.toUpperCase():"ELIMINATORIAS"}</div>
    <div class="victory-score-wrap" style="border:1px solid #333;margin:12px 0;padding:12px">
      <div class="victory-score-label">PUNTUACIÓN FINAL</div>
      <div class="victory-score-num" style="font-size:52px">${sc.total}</div>
      <div class="victory-grade" style="color:#aaa;font-size:16px">${grade}</div>
    </div>
    ${slots>0?`<p style="font-size:12px;color:var(--gold);margin-bottom:8px">🔗 Run Encadenada: conserva ${slots} jugador${slots>1?"es":""} para el siguiente intento</p>`:""}
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      ${chainBtn}
      <button class="modal-btn danger" onclick="location.reload()">NUEVA PARTIDA</button>
    </div>
  </div>`;
}
function computeFinalScore(champion){
  const scores={};

  // Stage factor: how far you got scales ALL quality metrics
  // This ensures early elimination truly hurts — not just a small penalty
  let stageFactor, stageBonus;
  if(champion){
    stageFactor=1.0; stageBonus=250;
  } else if(stage==="knockout"){
    const factors=[0.45, 0.60, 0.75, 0.88];
    stageFactor=factors[Math.min(knockoutRound,3)]||0.45;
    const bonuses=[60, 100, 150, 200];
    stageBonus=bonuses[Math.min(knockoutRound,3)]||60;
  } else {
    stageFactor=0.20; stageBonus=20; // groups → harsh penalty
  }
  scores.stage=stageBonus;

  // Team quality (OVR) — scaled by stageFactor
  scores.ovr=Math.round((baseTeamOVR||60)/100*150*stageFactor);

  // Goals scored
  const totalGoals=matchResults.reduce((s,r)=>{const g=parseInt(r.score)||0;return s+g;},0);
  scores.goals=Math.round(Math.min(80*stageFactor, totalGoals/12*80*stageFactor));

  // Defensive solidity
  const totalConceded=matchResults.reduce((s,r)=>{
    const parts=r.score.split('-'); return s+(parseInt(parts[1])||0);
  },0);
  scores.defense=Math.round(Math.max(0,(1-Math.min(totalConceded,10)/10)*60*stageFactor));

  // Morale
  scores.morale=Math.round(Math.max(0,(teamMorale+50)/100*50*stageFactor));

  // Star players in position
  const stars=usedPlayers.filter(p=>p.positions&&p.placedPos&&p.positions[0]===p.placedPos).length;
  scores.stars=Math.round(stars*(60/11)*stageFactor);

  // Scorer streaks
  const streakTotal=Object.values(scorerStreaks).reduce((s,v)=>s+Math.min(v,MAX_STREAK_BONUS),0);
  scores.streaks=Math.round(Math.min(60*stageFactor, streakTotal*12*stageFactor));

  // Penalty wins (reward for drama — not scaled, it's hard enough to earn)
  const penWins=matchResults.filter(r=>r.won&&r.score.includes('pen.')).length;
  scores.penalties=Math.min(80, penWins*30);

  // Clean sheets
  const cleanSheets=matchResults.filter(r=>{
    const parts=r.score.split('-');
    return r.won&&(parseInt(parts[1])||0)===0;
  }).length;
  scores.cleanSheets=Math.round(Math.min(60*stageFactor, cleanSheets*12*stageFactor));

  const raw=Object.values(scores).reduce((a,b)=>a+b,0);
  const total=Math.min(1000, Math.round(raw));
  return {total, breakdown:scores, penWins, totalGoals, totalConceded, stars, cleanSheets, stageFactor};
}
function showVictory(){
  const sc=computeFinalScore(true);
  if(typeof window.saveVictoryStat==="function") window.saveVictoryStat(sc.total);
  if(typeof window.saveFinalScore==="function") window.saveFinalScore(sc.total);
  const grade=sc.total>=900?"LEGENDARIO":sc.total>=750?"ÉLITE":sc.total>=600?"EXCELENTE":sc.total>=450?"MUY BUENO":"BUENO";
  const gradeColor=sc.total>=900?"#f0c419":sc.total>=750?"#e67e22":sc.total>=600?"#0f6b3b":"#3498db";

  document.getElementById("matchOverlay").innerHTML=`
  <div class="match-modal victory-modal">
    <div class="match-result-tag res-win-tag">¡¡CAMPEÓN DEL MUNDO!!</div>
    <div class="victory-score-wrap">
      <div class="victory-score-label">PUNTUACIÓN FINAL</div>
      <div class="victory-score-num">${sc.total}</div>
      <div class="victory-grade" style="color:${gradeColor}">${grade}</div>
    </div>
    <div class="victory-breakdown">
      <div class="vb-row"><span>Calidad del equipo (OVR ${baseTeamOVR||0})</span><span class="vb-pts">${sc.breakdown.ovr} pts</span></div>
      <div class="vb-row"><span>Goles marcados (${sc.totalGoals})</span><span class="vb-pts">${sc.breakdown.goals} pts</span></div>
      <div class="vb-row"><span>Solidez defensiva (${sc.totalConceded} goles encajados)</span><span class="vb-pts">${sc.breakdown.defense} pts</span></div>
      <div class="vb-row"><span>Gestión de moral (${teamMorale>0?"+":""}${teamMorale})</span><span class="vb-pts">${sc.breakdown.morale} pts</span></div>
      <div class="vb-row"><span>Portería a cero (${sc.cleanSheets} partidos)</span><span class="vb-pts">${sc.breakdown.cleanSheets} pts</span></div>
      <div class="vb-row"><span>Jugadores en posición ★ (${sc.stars}/11)</span><span class="vb-pts">${sc.breakdown.stars} pts</span></div>
      <div class="vb-row"><span>Rachas de goleador</span><span class="vb-pts">${sc.breakdown.streaks} pts</span></div>
      ${sc.penWins?`<div class="vb-row"><span>Victorias en penaltis (${sc.penWins})</span><span class="vb-pts">${sc.breakdown.penalties} pts</span></div>`:''}
    </div>
    <button class="modal-btn" onclick="window._launchGoldenAndReload()">FINALIZAR CAMPEONATO</button>
  </div>`;
}

window._launchGoldenAndReload=function(){ showGoldenTicket(); };

/* ── TICKET DORADO: solo cabras y una X roja. Se gasta al instante. ── */
function showGoldenTicket(){
  const GOLD_GRID=9;
  // 1 bomba, 8 cabras (3pts cada una → max 24pts)
  const bombIdx=Math.floor(Math.random()*GOLD_GRID);
  const cellsData=[];
  for(let i=0;i<GOLD_GRID;i++){
    cellsData.push(i===bombIdx ? {type:'bomb',value:0} : {type:'star',value:3});
  }

  // Crear overlay encima del modal de victoria
  const wrap=document.createElement('div');
  wrap.id='goldenTicketWrap';
  wrap.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:60000;display:flex;align-items:center;justify-content:center;overflow-y:auto;padding:20px 0;';

  const serial=String(Math.floor(1000+Math.random()*8999))+'-'+String(Math.floor(1000+Math.random()*8999));
  wrap.innerHTML=`
  <div style="position:relative;width:340px;background:linear-gradient(180deg,#3a2a00 0%,#1a1200 100%);border-radius:18px;box-shadow:0 0 0 2px #f0c419,0 30px 60px -10px rgba(0,0,0,.9);overflow:hidden;">
    <button onclick=\"window.gtClose(0)\" style=\"position:absolute;top:10px;right:12px;background:none;border:none;color:rgba(240,196,25,.5);font-size:20px;cursor:pointer;z-index:10;line-height:1;padding:4px\" title=\"Cerrar\">✕</button>
    <div style="padding:26px 22px 22px;">
      <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:2px;">
        <span style="font-size:18px">🏆</span>
        <span style="font-family:Bebas Neue,Impact,sans-serif;font-size:22px;letter-spacing:2px;color:#f0c419;text-shadow:0 0 12px rgba(240,196,25,.6)">TICKET GOAT</span>
        <span style="font-size:18px">🏆</span>
      </div>
      <div style="text-align:center;font-size:10px;letter-spacing:3px;color:rgba(240,196,25,.6);text-transform:uppercase;margin-bottom:16px;font-weight:700">Premio por ganar el Mundial</div>
      <div style="height:1px;background:repeating-linear-gradient(90deg,rgba(240,196,25,.5) 0 6px,transparent 6px 12px);margin:14px 0"></div>
      <div style="display:flex;justify-content:space-between;font-size:9px;letter-spacing:1px;color:rgba(240,196,25,.4);text-transform:uppercase;margin-bottom:14px;">
        <span>Nº <b style="color:rgba(240,196,25,.7)">${serial}</b></span><span>EDICIÓN ORO</span>
      </div>
      <div style="text-align:center;margin-bottom:18px;">
        <div style="font-size:9px;letter-spacing:3px;text-transform:uppercase;color:rgba(240,196,25,.5);margin-bottom:4px;font-weight:700">Puntos acumulados</div>
        <div id="gtPrize" style="font-family:'Bebas Neue',Impact,sans-serif;font-size:40px;color:#f0c419;text-shadow:0 0 12px rgba(240,196,25,.4);">0 <span style="font-size:20px;opacity:.85">PTS</span></div>
      </div>
      <div id="gtGrid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:18px;"></div>
      <div id="gtDots" style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:16px;flex-wrap:wrap;">
        <span style="font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(240,196,25,.5);font-weight:700;margin-right:4px;">Casillas rascadas</span>
      </div>
      <button id="gtCashBtn" disabled onclick="gtCashOut(false)" style="width:100%;border:none;border-radius:0;font-family:'Bebas Neue',Impact,sans-serif;font-size:22px;letter-spacing:2px;padding:14px;cursor:pointer;background:linear-gradient(180deg,#ffe27a,#f0c419 55%,#c9960c);color:#08160d;box-shadow:0 6px 0 #8a6a08;opacity:.35;pointer-events:none;">PLANTARSE</button>
      <div style="text-align:center;font-size:9px;color:rgba(240,196,25,.35);margin-top:14px;letter-spacing:.5px;line-height:1.5">
        Solo cabras 🐐 (+3 pts) y una casilla ❌.<br>Premio especial por ganar el Mundial. ¡No se acumula!
      </div>
    </div>
  </div>
  <div id="gtResultOverlay" style="display:none;position:fixed;inset:0;z-index:70000;background:rgba(0,0,0,.8);align-items:center;justify-content:center;padding:20px;"></div>`;
  document.body.appendChild(wrap);

  let gtPoints=0, gtScratched=0, gtOver=false;

  function gtUpdateUI(){
    const p=$id('gtPrize'); if(p) p.innerHTML=`${gtPoints} <span style="font-size:20px;opacity:.85">PTS</span>`;
    const cb=$id('gtCashBtn'); const ca=$id('gtCashAmt');
    if(ca) ca.textContent=gtPoints;
    if(cb){
      const ok=gtPoints>0&&!gtOver;
      cb.disabled=!ok; cb.style.opacity=ok?'1':'.35'; cb.style.pointerEvents=ok?'auto':'none';
    }
  }

  const grid=$id('gtGrid');
  const dotsRow=$id('gtDots');

  for(let i=0;i<GOLD_GRID;i++){
    const data=cellsData[i];
    const cell=document.createElement('div');
    cell.style.cssText='position:relative;aspect-ratio:1;border-radius:10px;overflow:hidden;background:#2a1f00;box-shadow:inset 0 0 0 2px rgba(240,196,25,.3);';
    cell.dataset.index=i;
    const res=document.createElement('div');
    res.style.cssText='position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:2px;font-family:"Bebas Neue",Impact,sans-serif;background:#1a1200;';
    if(data.type==='bomb'){
      res.innerHTML=`<span style="font-size:26px">❌</span><span style="font-size:13px;color:#f87171;letter-spacing:.5px">PIERDE</span>`;
    } else {
      res.innerHTML=`<span style="font-size:26px">🐐</span><span style="font-size:13px;color:#f0c419;letter-spacing:.5px">+4 PTS</span>`;
    }
    cell.appendChild(res);
    const canvas=document.createElement('canvas');
    canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;cursor:pointer;touch-action:none;';
    cell.appendChild(canvas);
    grid.appendChild(cell);

    const dot=document.createElement('span');
    dot.style.cssText='width:9px;height:9px;border-radius:50%;background:rgba(240,196,25,.18);display:inline-block;transition:all .25s ease;';
    dot.dataset.di=i;
    dotsRow.appendChild(dot);

    // Init canvas (misma lógica pero dorada)
    const dpr=window.devicePixelRatio||1;
    const rect=cell.getBoundingClientRect()||{width:80,height:80};
    const w=Math.max(rect.width,80), h=Math.max(rect.height,80);
    canvas.width=w*dpr; canvas.height=h*dpr;
    canvas.style.width=w+'px'; canvas.style.height=h+'px';
    const ctx=canvas.getContext('2d');
    ctx.scale(dpr,dpr);
    const grad=ctx.createLinearGradient(0,0,w,h);
    grad.addColorStop(0,'#c9960c'); grad.addColorStop(.5,'#f0c419'); grad.addColorStop(1,'#c9960c');
    ctx.fillStyle=grad; ctx.fillRect(0,0,w,h);
    ctx.strokeStyle='rgba(255,220,50,.4)'; ctx.lineWidth=2;
    for(let x=-h;x<w;x+=6){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+h,h);ctx.stroke();}
    ctx.font='20px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.globalAlpha=.5; ctx.fillStyle='#000'; ctx.fillText('🐐',w/2,h/2); ctx.globalAlpha=1;
    ctx.globalCompositeOperation='destination-out';

    let scratching=false;
    function scratchAt(cx,cy){
      const r=canvas.getBoundingClientRect();
      ctx.beginPath(); ctx.arc(cx-r.left,cy-r.top,18,0,Math.PI*2); ctx.fill();
      const d=ctx.getImageData(0,0,canvas.width,canvas.height).data;
      let cl=0,s=0;
      for(let p=3;p<d.length;p+=160){s++;if(d[p]<80)cl++;}
      if(cl/s>0.5&&!cell.dataset.revealed) gtReveal(cell,i,canvas);
    }
    canvas.addEventListener('mousedown',e=>{scratching=true;scratchAt(e.clientX,e.clientY);e.preventDefault();});
    canvas.addEventListener('mousemove',e=>{if(!scratching)return;scratchAt(e.clientX,e.clientY);e.preventDefault();});
    window.addEventListener('mouseup',()=>{if(scratching&&!cell.dataset.revealed)gtReveal(cell,i,canvas);scratching=false;});
    canvas.addEventListener('touchstart',e=>{scratching=true;scratchAt(e.touches[0].clientX,e.touches[0].clientY);e.preventDefault();},{passive:false});
    canvas.addEventListener('touchmove',e=>{if(!scratching)return;scratchAt(e.touches[0].clientX,e.touches[0].clientY);e.preventDefault();},{passive:false});
    canvas.addEventListener('touchend',()=>{if(scratching&&!cell.dataset.revealed)gtReveal(cell,i,canvas);scratching=false;});
  }

  function gtReveal(cell,idx,canvas){
    if(cell.dataset.revealed) return;
    cell.dataset.revealed='1';
    canvas.style.opacity='0'; canvas.style.transition='opacity .35s ease'; canvas.style.pointerEvents='none';
    const data=cellsData[idx];
    const dot=dotsRow.querySelector(`[data-di="${idx}"]`);
    gtScratched++;
    if(data.type==='bomb'){
      if(dot){dot.style.background='#f87171';dot.style.boxShadow='0 0 6px rgba(248,113,113,.7)';}
      gtOver=true;
      Array.from(grid.children).forEach(c=>{
        if(!c.dataset.revealed){c.dataset.revealed='1';const cv=c.querySelector('canvas');if(cv){cv.style.opacity='0';cv.style.pointerEvents='none';}}
      });
      gtUpdateUI();
      setTimeout(()=>gtShowResult(false,0),600);
    } else {
      gtPoints+=data.value;
      if(dot){dot.style.background='#f0c419';dot.style.boxShadow='0 0 6px rgba(240,196,25,.7)';}
      gtUpdateUI();
      if(gtScratched>=GOLD_GRID) setTimeout(()=>gtCashOut(true),500);
    }
  }

  window.gtCashOut=function(auto){
    if(gtOver||gtPoints<=0) return;
    gtOver=true; gtUpdateUI();
    gtShowResult(true,gtPoints,auto);
  };

  function gtShowResult(win,pts,auto){
    const ro=$id('gtResultOverlay'); if(!ro) return;
    ro.style.display='flex';
    if(win) playSound('victory');
    else playSound('scratch_bomb');
    ro.innerHTML=`
    <div style="background:linear-gradient(180deg,#3a2a00,#1a1200);border-radius:18px;padding:30px 26px;text-align:center;max-width:300px;width:90%;box-shadow:0 0 0 2px #f0c419,0 30px 60px -10px rgba(0,0,0,.9);animation:popIn .3s cubic-bezier(.2,1.4,.4,1)">
      <style>@keyframes popIn{0%{transform:scale(.7);opacity:0}100%{transform:scale(1);opacity:1}}</style>
      <span style="font-size:54px;display:block;margin-bottom:10px">${win?(auto?'🏆':'💰'):'❌'}</span>
      <h2 style="font-family:'Bebas Neue',Impact,sans-serif;font-size:26px;letter-spacing:1px;color:${win?'#f0c419':'#f87171'};margin-bottom:6px">${win?(auto?'¡TICKET PREMIADO!':'¡TICKET PREMIADO!'):'TICKET ANULADO'}</h2>
      <p style="font-size:12px;color:rgba(240,196,25,.7);line-height:1.5;margin-bottom:12px">${win?'Tus puntos de campeón han sido guardados.':'La casilla mala te ha quitado los puntos. ¡Casi!'}</p>
      <div style="font-family:'Bebas Neue',Impact,sans-serif;font-size:34px;color:${win?'#f0c419':'#f87171'};margin-bottom:18px">${(win && pts>0)?'+'+pts+' PTS':win?'0 PTS':''}</div>
      <button onclick="gtClose(${win?pts:0})" style="width:100%;border:none;border-radius:0;padding:12px;font-family:'Bebas Neue',Impact,sans-serif;font-size:15px;letter-spacing:1.5px;background:linear-gradient(180deg,#ffe27a,#f0c419 55%,#c9960c);color:#08160d;cursor:pointer;">CERRAR</button>
    </div>`;
  }

  window.gtClose=async function(ptsEarned){
    // Guardar puntos directamente (no consume boleto acumulado)
    if(ptsEarned>0&&window._fbAuth&&window._fbAuth.currentUser){
      try{
        const user=window._fbAuth.currentUser;
        const snap=await window._fbDb.collection('users').doc(user.uid).get();
        const d=snap.exists?snap.data():{};
        const newPts=(d.scratchPoints||0)+ptsEarned;
        const newEarned=(d.scratchPointsEarned||0)+ptsEarned;
        await window._fbDb.collection('users').doc(user.uid).set({scratchPoints:newPts,scratchPointsEarned:newEarned},{merge:true});
        const pse=$id('pstat-scratch-pts'); if(pse) pse.textContent=newPts;
      }catch(e){console.warn('Error guardando pts golden ticket:',e);}
    }
    const w=$id('goldenTicketWrap'); if(w) w.remove();
    // Recargar para nueva partida
    setTimeout(()=>location.reload(), 400);
  };
}


/* ========= MORALE SYSTEM ========= */
function clampMorale(v){ return Math.max(-50, Math.min(50, v)); }
function changeMorale(delta){
  teamMorale=clampMorale(teamMorale+delta);
  renderMorale();
  updateLed();
}
function renderMorale(){
  const section=document.getElementById("moraleSection");
  const valEl=document.getElementById("moraleValue");
  const fill=document.getElementById("moraleFill");
  if(!section||!valEl||!fill) return;
  section.style.display="block";
  valEl.textContent=(teamMorale>0?"+":"")+teamMorale;
  const pct=Math.abs(teamMorale)/50*50; // 0-50% width
  fill.style.width=pct+"%";
  fill.style.height="100%";
  if(teamMorale>=0){
    fill.classList.add("positive"); fill.classList.remove("negative");
    fill.style.left="50%";
  } else {
    fill.classList.add("negative"); fill.classList.remove("positive");
    fill.style.left=(50-pct)+"%";
  }
}
function moraleLambdaBonus(){
  // Morale gives up to ±0.15 on the scoring lambda
  return (teamMorale/50)*0.15;
}

/* ========= WEATHER SYSTEM ========= */
function rollWeather(){
  // Cloudy is more common (neutral), others less so
  const weights=[1.5, 4, 2, 1.5, 1]; // hot,cloudy,rain,wind,hot_extreme
  // Actually use WEATHER_TYPES indices
  const w=[2,2,1,1.5,1]; // probabilities matching WEATHER_TYPES order
  const total=w.reduce((a,b)=>a+b,0);
  let r=Math.random()*total;
  for(let i=0;i<WEATHER_TYPES.length;i++){
    r-=w[i]; if(r<=0){ currentWeather=WEATHER_TYPES[i]; return; }
  }
  currentWeather=WEATHER_TYPES[1]; // fallback cloudy
}
function renderWeather(){
  const el=document.getElementById("weatherDisplay");
  if(!el||!currentWeather) return;
  el.style.display="flex";
  el.innerHTML=`
    <span class="weather-icon">${currentWeather.label.split(' ')[0]}</span>
    <div class="weather-block">
      <span>${currentWeather.label.slice(currentWeather.label.indexOf(' ')+1)}</span>
      <span class="weather-desc">${currentWeather.desc}</span>
    </div>`;
}
function weatherStatModifier(){
  // Returns a delta to apply to myStatProfile and oppStatProfile
  // Weather affects both teams equally (fair)
  if(!currentWeather) return {};
  return currentWeather.effect;
}
function weatherLambdaEffect(){
  // Converts stat modifiers to a lambda delta (small effect)
  const eff=weatherStatModifier();
  let delta=0;
  if(eff.pace) delta+=eff.pace*0.3;
  if(eff.technique) delta+=eff.technique*0.2;
  if(eff.passing) delta+=eff.passing*0.15;
  if(eff.defense) delta+=eff.defense*0.15;
  return delta; // applied to BOTH lambdas equally (same conditions)
}

/* ========= SCORER STREAK SYSTEM ========= */
const MAX_STREAK_BONUS = 3;
function getStreakLambdaBonus(){
  // Sum bonus from all attackers currently in squad
  let bonus=0;
  usedPlayers.forEach(p=>{
    if(p.placedPos&&["DC","EI","ED","MC"].includes(p.placedPos)){
      const streak=scorerStreaks[p.name]||0;
      bonus+=Math.min(streak,MAX_STREAK_BONUS)*0.015; // +1.5% per streak level
    }
  });
  return bonus;
}
function updateScorerStreaks(scorerNames){
  const scorerSet=new Set(scorerNames);
  usedPlayers.forEach(p=>{
    if(!["DC","EI","ED","MC"].includes(p.placedPos)) return; // only track attackers/mids
    if(scorerSet.has(p.name)){
      scorerStreaks[p.name]=(scorerStreaks[p.name]||0)+1;
    } else {
      scorerStreaks[p.name]=0; // reset if didn't score
    }
  });
}
function getStreakBadge(playerName){
  const s=scorerStreaks[playerName]||0;
  if(s<=0) return "";
  const fire="🔥".repeat(Math.min(s,MAX_STREAK_BONUS));
  return `<span class="streak-badge" title="Racha Goleadora">${fire}+${Math.min(s,MAX_STREAK_BONUS)}</span>`;
}
function getCardBadge(p){
  // Shows the player's active card status: a single yellow on file (not
  // yet suspended), or an active suspension (yellow2/double_yellow/red).
  if(p.suspended){
    return `<span class="card-badge card-badge-suspended" title="Sancionado este partido">🚫</span>`;
  }
  if((p.yellowCount||0)>=1){
    return `<span class="card-badge card-badge-yellow" title="Tarjeta amarilla acumulada">🟨</span>`;
  }
  return "";
}

/* ========= PRE-MATCH PREDICTIVE PRESS CONFERENCE ========= */
let pendingPrediction=null; // {event, answerIdx} set when player answers, resolved after the match

function maybeShowPressConference(callback){
  const chance=stage==="knockout"?0.40:0.25;
  if(Math.random()>chance){ callback(); return; }
  const event=PRESS_PREDICTIONS[Math.floor(Math.random()*PRESS_PREDICTIONS.length)];
  showPressEventModal(event, callback);
}
function showPressEventModal(event, callback){
  document.getElementById("matchOverlay").innerHTML=`
  <div class="press-modal">
    <span class="press-icon">🎙</span>
    <h3>RUEDA DE PRENSA · ANTES DEL PARTIDO</h3>
    <p class="press-question">${event.q}</p>
    <div class="press-answers">
      ${event.answers.map((a,i)=>`
        <button class="press-answer-btn" onclick="choosePressAnswer(${i})">
          <span>${a.text}</span>
          <span class="press-answer-label">${a.label}</span>
        </button>`).join('')}
    </div>
    <div class="press-timer-track"><div class="press-timer-fill" id="pressTimerFill"></div></div>
  </div>`;
  window._pressCallback=callback;
  window._pressEvent=event;
  window._pressAnswered=false;

  // 8-second countdown — if the player doesn't answer in time, the press
  // conference closes as if it never happened: no prediction is stored,
  // so the result later carries no morale effect at all.
  const DURATION=8000;
  const fill=document.getElementById("pressTimerFill");
  if(fill){
    // Force the browser to paint the initial width:100% state BEFORE
    // starting the transition — a single requestAnimationFrame can fire
    // before the first paint on slower devices (common on mobile), which
    // skips the animation entirely and makes the bar invisible. Double
    // rAF guarantees one full paint cycle has happened first.
    fill.style.transition="none";
    fill.style.width="100%";
    requestAnimationFrame(()=>{
      requestAnimationFrame(()=>{
        fill.style.transition=`width ${DURATION}ms linear`;
        fill.style.width="0%";
      });
    });
  }
  window._pressTimerId=setTimeout(()=>{
    if(window._pressAnswered) return;
    window._pressAnswered=true;
    document.getElementById("matchOverlay").innerHTML="";
    pendingPrediction=null; // no answer given — no prediction to resolve later
    showToast("No respondiste a tiempo — la prensa se queda sin declaraciones.", "toast-neutral");
    if(window._pressCallback) window._pressCallback();
  }, DURATION);
}
window.choosePressAnswer=function(idx){
  if(window._pressAnswered) return; // already timed out or answered
  window._pressAnswered=true;
  if(window._pressTimerId){ clearTimeout(window._pressTimerId); window._pressTimerId=null; }
  const event=window._pressEvent;
  const answer=event.answers[idx];
  document.getElementById("matchOverlay").innerHTML="";
  // Store the prediction — it will be checked against the real result
  // once this match is played, and resolved in the match result modal.
  pendingPrediction={event, answer};
  showToast(`Promesa hecha: "${answer.label}"`, "toast-neutral");
  setTimeout(()=>{ if(window._pressCallback) window._pressCallback(); }, 700);
};

/* Resolves the pending prediction against the real match result.
   Returns {label, text, delta} for display, or null if there was no
   pending prediction for this match. */
function resolvePendingPrediction(matchResult){
  if(!pendingPrediction) return null;
  const {event, answer}=pendingPrediction;
  pendingPrediction=null; // consume it — one prediction per match

  if(answer.stance==="neutral"){
    return {label:answer.label, outcome:"neutral", delta:0,
      text:`🎙 Respuesta neutral: la moral no se ve afectada.`};
  }
  const correct=answer.check(matchResult);
  if(correct===true){
    const delta=8;
    changeMorale(delta);
    return {label:answer.label, outcome:"correct", delta,
      text:`🎙 Promesa cumplida ("${answer.label}"): +${delta} moral.`};
  } else {
    const delta=-8;
    changeMorale(delta);
    return {label:answer.label, outcome:"wrong", delta,
      text:`🎙 Promesa incumplida ("${answer.label}"): ${delta} moral.`};
  }
}

/* ========= TOAST NOTIFICATION ========= */
function showToast(msg, cls){
  let t=document.getElementById("gameToast");
  if(!t){ t=document.createElement("div"); t.id="gameToast"; document.body.appendChild(t); }
  t.className="game-toast "+(cls||"");
  t.textContent=msg;
  t.style.opacity="1";
  clearTimeout(t._tid);
  t._tid=setTimeout(()=>{ t.style.opacity="0"; }, 2200);
}

/* ========= CHAIN RUN SYSTEM ========= */
function getChainSlots(){
  // Slots based on best round reached: octavos=1, cuartos=2, semis=3
  if(bestRoundReached>=3) return 3; // semis or final
  if(bestRoundReached>=2) return 2; // cuartos
  if(bestRoundReached>=1) return 1; // octavos
  return 0;
}
function showChainRunModal(){
  const slots=getChainSlots();
  if(slots<=0){ location.reload(); return; }
  const allPlayers=[...usedPlayers,...bench];
  document.getElementById("matchOverlay").innerHTML=`
  <div class="chain-modal">
    <h3>RUN ENCADENADA</h3>
    <p class="chain-subtitle">Has llegado a ${bestRoundReached>=3?"Semifinales":bestRoundReached>=2?"Cuartos de Final":"Octavos de Final"}. Puedes conservar <strong>${slots} jugador${slots>1?"es":""}</strong> para el siguiente intento. Elige sabiamente.</p>
    <div class="chain-player-grid" id="chainPlayerGrid">
      ${allPlayers.map((p,i)=>`
        <div class="chain-player-card" id="cpc_${i}" onclick="toggleChainPlayer(${i}, ${slots})">
          <div class="cpname">${p.name}</div>
          <div class="cprating">${p.rating||0}</div>
          <div class="cppos">${(p.positions||[]).join('/')}</div>
        </div>`).join('')}
    </div>
    <div class="chain-actions">
      <button class="modal-btn" id="chainConfirmBtn" disabled onclick="confirmChainRun()">CONTINUAR CON ${slots} JUGADOR${slots>1?"ES":""}</button>
      <button class="modal-btn danger" onclick="location.reload()">NUEVA PARTIDA</button>
    </div>
  </div>`;
  window._chainSelected=[];
  window._chainPlayers=allPlayers;
  window._chainSlots=slots;
}
window.toggleChainPlayer=function(idx, slots){
  const sel=window._chainSelected;
  const card=document.getElementById("cpc_"+idx);
  const alreadyIdx=sel.indexOf(idx);
  if(alreadyIdx>=0){
    sel.splice(alreadyIdx,1);
    card.classList.remove("selected");
    card.querySelector(".chain-selected-mark")?.remove();
  } else {
    if(sel.length>=slots) return;
    sel.push(idx);
    card.classList.add("selected");
    const mark=document.createElement("div");
    mark.className="chain-selected-mark"; mark.textContent=sel.length;
    card.appendChild(mark);
  }
  const btn=document.getElementById("chainConfirmBtn");
  if(btn) btn.disabled=sel.length!==slots;
};
window.confirmChainRun=function(){
  const selected=window._chainSelected.map(i=>window._chainPlayers[i]);
  // Save full player objects so the next run can pre-place them, plus the
  // formation that was used — the new run will suggest the same one.
  try{
    sessionStorage.setItem('g2g_inherited', JSON.stringify(selected));
    sessionStorage.setItem('g2g_inherited_formation', JSON.stringify(currentFormation));
  }catch(e){}
  location.reload();
};
function restoreInheritedFormation(){
  // Restore the formation used in the previous run, if this is a chain
  // run continuation — called BEFORE the initial pitch render, so the
  // correct formation shows from the very first frame.
  try{
    const rawF=sessionStorage.getItem('g2g_inherited_formation');
    if(rawF){
      const savedFormation=JSON.parse(rawF);
      if(savedFormation && savedFormation.category && savedFormation.code){
        const f=FORMATIONS[savedFormation.category]?.find(x=>x.code===savedFormation.code);
        if(f){
          currentFormation={category:savedFormation.category, code:savedFormation.code};
          return f.bonus;
        }
      }
    }
  }catch(e){}
  return null;
}
function loadInheritedPlayers(){
  try{
    const raw=sessionStorage.getItem('g2g_inherited');
    if(!raw){ inheritedPlayers=[]; return; }
    inheritedPlayers=JSON.parse(raw);
    sessionStorage.removeItem('g2g_inherited');
  }catch(e){ inheritedPlayers=[]; }
  try{ sessionStorage.removeItem('g2g_inherited_formation'); }catch(e){}
}
loadInheritedPlayers();

/* If there are inherited players from a chain run, auto-place them on the
   pitch at their primary position, skipping that many draft picks. */
/* ========= SETTINGS DROPDOWN (header, shown only when logged out) ========= */
function toggleSettingsMenu(){
  const dd=document.getElementById("settingsDropdown");
  const btn=document.getElementById("settingsToggle");
  if(!dd||!btn) return;
  if(dd.classList.contains("open")){
    dd.classList.remove("open");
    return;
  }
  const rect=btn.getBoundingClientRect();
  dd.style.top=(rect.bottom+6)+"px";
  dd.style.right=(window.innerWidth-rect.right)+"px";
  dd.classList.add("open");
}
document.addEventListener("click", function(e){
  const menu=document.getElementById("settingsMenu");
  if(menu && !menu.contains(e.target)){
    const dd=document.getElementById("settingsDropdown");
    if(dd) dd.classList.remove("open");
  }
});

function applyInheritedPlayers(){
  if(!inheritedPlayers.length) return;
  const slots=getPitchSlots();

  // Process highest-rated players FIRST, so when two inherited players
  // compete for the same primary position, the better one gets it and
  // the other is reassigned sensibly (their own secondary position, or
  // a position they can actually play) — never an unrelated slot like
  // POR for an outfield player.
  const ordered=[...inheritedPlayers].sort((a,b)=>(b.rating||0)-(a.rating||0));

  ordered.forEach(p=>{
    const positions=p.positions||[];
    let slot=null;

    // 1) Try every position this player can actually play, in priority
    //    order (primary first, then secondary), picking the first free slot.
    for(const pos of positions){
      slot=slots.find(s=>!s.classList.contains('locked')&&s.dataset.label===pos);
      if(slot) break;
    }

    // 2) If none of the player's own positions are free, find the closest
    //    sensible alternative: prefer a slot in the same "zone" as their
    //    primary position (defense/midfield/attack), never goalkeeper for
    //    an outfield player and never an outfield slot for a keeper.
    if(!slot && positions.length){
      const ZONES={
        POR:['POR'],
        DFC:['DFC','LI','LD'], LI:['LI','DFC','LD'], LD:['LD','DFC','LI'],
        MC:['MC','EI','ED'], EI:['EI','MC','ED'], ED:['ED','MC','EI'],
        DC:['DC','EI','ED'],
      };
      const zone=ZONES[positions[0]]||[];
      for(const pos of zone){
        slot=slots.find(s=>!s.classList.contains('locked')&&s.dataset.label===pos);
        if(slot) break;
      }
    }

    // 3) Absolute last resort: any free slot that is NOT goalkeeper unless
    //    the player actually is a keeper, and not an outfield slot for a
    //    keeper either. This avoids the "Maradona en portería" bug.
    if(!slot){
      const isKeeper=positions.includes('POR');
      slot=slots.find(s=>!s.classList.contains('locked') &&
        (isKeeper ? s.dataset.label==='POR' : s.dataset.label!=='POR'));
    }
    if(!slot) return; // no sensible slot available at all — skip

    const label=slot.dataset.label;
    const inPos=positions.includes(label);
    const star=inPos&&positions[0]===label?' <span class="star">★</span>':'';
    const r=inPos?(p.rating||70):Math.round((p.rating||70)*0.85);
    p.placedPos=label;
    // Fresh start for a new chain run — fully rested, no carried-over injury/cards.
    const playerObj={...p, placedPos:label, fatigue:100, injury:null, suspended:false, suspendedNextMatch:false, yellowCount:0, cardStatus:null};
    slot._player=playerObj;
    slot.classList.add('locked');
    renderSlotContent(slot, playerObj, label, r, star);
    usedPlayers.push(playerObj); // same reference as slot._player
    draftedCount++;
  });
  updateDraftCounter();
  updateConvocadosTable();
  updateStats();
  // Show a toast so the player knows inherited players are ready
  showToast(`${inheritedPlayers.length} jugador${inheritedPlayers.length>1?'es':''}  heredado${inheritedPlayers.length>1?'s':''} colocado${inheritedPlayers.length>1?'s':''} en el campo`, 'toast-pos');
  inheritedPlayers=[];
}

/* ========= LED SCOREBOARD ========= */
function buildLedMessages(){
  const SEP = "   ·   ";
  const msgs = [];

  // Always: team name + OVR
  if(baseTeamOVR!==null){
    msgs.push(`🐐 ${myTeamName}  NOTA ${baseTeamOVR}`);
  } else {
    msgs.push("GOAL2GOAT  ·  MONTA TU EQUIPO LEGENDARIO Y CONQUISTA EL MUNDIAL");
  }

  // Stage info
  if(stage==="group" && groupOpponents.length){
    msgs.push(`FASE DE GRUPOS  ·  PARTIDO ${groupMatchIdx+1}/3`);
  } else if(stage==="knockout"){
    msgs.push(`ELIMINATORIAS  ·  ${(ROUND_NAMES[knockoutRound]||"").toUpperCase()}`);
  }

  // Last match result
  const last = matchResults[matchResults.length-1];
  if(last){
    const res = last.won?"VICTORIA":last.draw?"EMPATE":"DERROTA";
    msgs.push(`ÚLTIMO PARTIDO  ${res}  vs ${last.rival.toUpperCase()}  ${last.score}`);
  }

  // Next opponent
  if(nextOpponent){
    msgs.push(`PRÓXIMO RIVAL  ${nextOpponent.name.toUpperCase()}`);
  }

  // Injured players
  const injured = usedPlayers.filter(p=>p.injury);
  if(injured.length){
    msgs.push(`LESIONADOS  ${injured.map(p=>`${p.name.split(' ')[0]} (${p.injury.remaining}P)`).join('  ')}`);
  }

  // Top scorer (player with most goals in match history — proxy: highest rated attacker)
  const attackers = usedPlayers.filter(p=>p.placedPos&&["DC","EI","ED"].includes(p.placedPos));
  if(attackers.length){
    const top = attackers.reduce((a,b)=>effRating(a)>=effRating(b)?a:b);
    msgs.push(`MÁXIMO GOLEADOR  ${top.name.toUpperCase()}  ★${effRating(top)}`);
  }

  // Morale
  if(baseTeamOVR!==null){
    const sign=teamMorale>=0?"+":"";
    msgs.push(`MORAL  ${sign}${teamMorale}`);
  }

  // Weather
  if(currentWeather && currentWeather.id!=='cloudy'){
    msgs.push(`CLIMA  ${currentWeather.label.replace(/[^\w\s]/g,'').trim().toUpperCase()}`);
  }

  // Scorer streaks
  const onStreak=usedPlayers.filter(p=>(scorerStreaks[p.name]||0)>0);
  if(onStreak.length){
    msgs.push(`EN RACHA  ${onStreak.map(p=>`${p.name.split(' ')[0].toUpperCase()} x${scorerStreaks[p.name]}`).join('  ')}`);
  }

  return msgs.join(SEP + "   ");
}

function updateLed(){
  const el = document.getElementById("ledText");
  if(!el) return;
  el.textContent = buildLedMessages();
  // Reset animation so it restarts smoothly from the right
  el.style.animation="none";
  void el.offsetWidth; // reflow trigger
  el.style.animation="";
}

// Update LED whenever game state changes meaningfully
let _ledInterval = null;
function startLedLoop(){
  updateLed();
  if(_ledInterval) clearInterval(_ledInterval);
  _ledInterval = setInterval(updateLed, 8000);
}

/* ========= UTILS ========= */
// Augment teams with _styleKey for hint lookup
teams=teams.map(t=>{
  const raw=rawTeams.find(r=>r.name===t.name);
  return {...t,_styleKey:raw?raw.style:''};
});

/* ========= QUICK BUILD ========= */
(function setupQuickBuild(){
  const btn=document.getElementById("quickBuildWrap");
  if(!btn) return;
  btn.addEventListener("click",quickBuild);
})();

function quickBuild(){
  if(phase!=="draft"&&phase!=="bench") return;
  if(maybeShowMobileFormationGate(()=>quickBuild())) return; // pauses for confirmation on mobile, first time only
  // Lock the formation choice the moment quick-build is used, same as
  // manual drafting — the formation is no longer changeable from here on.
  if(phase==="draft"&&draftedCount===0) lockFormationDisplay();
  revealPreDraftBoxes();
  const btn=document.getElementById("quickBuildWrap");
  if(btn){ btn.disabled=true; btn.textContent="Generando..."; }

  // Always show the spin animation in the center/pitch area, visible on both mobile and desktop
  // We overlay a temporary fullscreen-ish modal so scroll is irrelevant
  const spinOverlay=document.createElement("div");
  spinOverlay.id="quickBuildSpinOverlay";
  spinOverlay.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:9999;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:16px";
  spinOverlay.innerHTML=`
    <div style="font-family:'Bebas Neue',Impact,sans-serif;font-size:22px;letter-spacing:2px;color:#c9a227">GENERANDO EQUIPO...</div>
    <div style="display:flex;gap:24px;align-items:center">
      <div id="reel1" style="font-size:56px;min-width:80px;text-align:center"></div>
      <div style="font-family:'Bebas Neue',Impact,sans-serif;font-size:28px;color:#555">VS</div>
      <div id="reel2" style="font-size:56px;min-width:80px;text-align:center"></div>
    </div>`;
  document.body.appendChild(spinOverlay);

  const pool=teams.slice();
  const r1=document.getElementById("reel1");
  const r2=document.getElementById("reel2");
  const spin=setInterval(()=>{
    const ta=pool[Math.floor(Math.random()*pool.length)];
    const tb=pool[Math.floor(Math.random()*pool.length)];
    if(r1) r1.innerHTML=flagEmoji(ta.name,56);
    if(r2) r2.innerHTML=flagEmoji(tb.name,56);
    playSound('spin');
  },80);

  setTimeout(()=>{
    clearInterval(spin);
    playSound('reveal');
    // Remove overlay
    const ov=document.getElementById("quickBuildSpinOverlay");
    if(ov) ov.remove();
    playerCardEl.innerHTML="";
    _executeQuickBuild();
    if(btn){ btn.style.display="none"; }
  }, 700);
}

function _executeQuickBuild(){
  // Simulate the REAL draft process: random team pairs → pick best team → pick best fitting player
  // This mirrors what an optimal player would do given the random draws they get
  const usedNames=new Set();
  const pickedTeamNames=new Set();
  const pitchSlots=getPitchSlots().filter(s=>!s.classList.contains("locked"));

  function drawTeamPair(){
    // Draw 2 random teams not already heavily used
    const pool=teams.filter(t=>!pickedTeamNames.has(t.name));
    shuffle(pool);
    return [pool[0], pool[1]||pool[0]];
  }
  function pickBestPlayer(teamPlayers, neededPos){
    // From 5 random players from a team, pick the best for the needed position
    const available=teamPlayers.filter(p=>!usedNames.has(p.name));
    if(!available.length) return null;
    shuffle(available);
    const hand=available.slice(0,5);
    // Score: primary position match = big bonus, secondary match = smaller, any = base rating
    hand.sort((a,b)=>{
      const scoreA=(a.positions&&a.positions[0]===neededPos?200:a.positions&&a.positions.includes(neededPos)?100:0)+(a.rating||70);
      const scoreB=(b.positions&&b.positions[0]===neededPos?200:b.positions&&b.positions.includes(neededPos)?100:0)+(b.rating||70);
      return scoreB-scoreA;
    });
    return hand[0];
  }

  // Fill each pitch slot
  pitchSlots.forEach(slot=>{
    const label=slot.dataset.label;
    const [t1,t2]=drawTeamPair();
    // Pick the team whose players better cover the needed position
    const t1best=pickBestPlayer(t1.players,label);
    const t2best=pickBestPlayer(t2.players,label);
    let chosenTeam, chosenPlayer;
    if(!t1best){ chosenTeam=t2; chosenPlayer=t2best; }
    else if(!t2best){ chosenTeam=t1; chosenPlayer=t1best; }
    else {
      const s1=(t1best.positions&&t1best.positions[0]===label?200:t1best.positions&&t1best.positions.includes(label)?100:0)+(t1best.rating||70);
      const s2=(t2best.positions&&t2best.positions[0]===label?200:t2best.positions&&t2best.positions.includes(label)?100:0)+(t2best.rating||70);
      chosenTeam=s1>=s2?t1:t2; chosenPlayer=s1>=s2?t1best:t2best;
    }
    if(!chosenPlayer) return;

    pickedTeamNames.add(chosenTeam.name);
    usedNames.add(chosenPlayer.name);
    applyBonuses({bonuses:chosenTeam.bonuses||{}});

    const inPos=chosenPlayer.positions&&chosenPlayer.positions.includes(label);
    const r=inPos?(chosenPlayer.rating||70):Math.round((chosenPlayer.rating||70)*0.85);
    const star=inPos&&chosenPlayer.positions[0]===label?' <span class="star">★</span>':'';
    const playerObj={...chosenPlayer, placedPos:label};
    slot._player=playerObj;
    slot.classList.add("locked");
    renderSlotContent(slot, playerObj, label, r, star);
    usedPlayers.push(playerObj);
    draftedCount++;
  });

  // Fill bench (3 players) — simulate 3 more draws
  const benchNeeded=5-bench.length;
  for(let i=0;i<benchNeeded;i++){
    const [t1,t2]=drawTeamPair();
    const pool1=t1.players.filter(p=>!usedNames.has(p.name));
    const pool2=t2.players.filter(p=>!usedNames.has(p.name));
    shuffle(pool1); shuffle(pool2);
    const hand=[...(pool1.slice(0,3)), ...(pool2.slice(0,3))];
    if(!hand.length) continue;
    hand.sort((a,b)=>(b.rating||70)-(a.rating||70));
    const best=hand[0];
    usedNames.add(best.name);
    bench.push({...best});
    benchCount++;
  }

  // Freeze OVR and transition to ready phase
  baseTeamOVR=computeTeamOVR();
  phase="ready";
  rollBtn.style.display="none";
  const tipsBox=document.getElementById("tipsBox");
  const howTo=document.getElementById("howToPlayBox");
  const statsGuide=document.getElementById("statsGuideBox");
  lockFormationDisplay();
  // Collapse (don't hide) the tutorial boxes — still consultable on
  // desktop once the squad is built, just compact at the bottom.
  if(tipsBox) tipsBox.classList.add("collapsed");
  if(howTo) howTo.classList.add("collapsed");
  if(statsGuide) statsGuide.classList.add("collapsed");

  updateDraftCounter();
  updateConvocadosTable();
  updateBenchTable();
  updateStats();
  refreshPitchRatings();
  document.getElementById("benchSection").style.display="block";
  startMatchPhase();
  startLedLoop();
  showToast("¡Equipo generado! OVR "+baseTeamOVR, "toast-pos");
}

/* ========= TOP BAR: AUDIO & THEME TOGGLES ========= */
// Two sets of buttons control the same preferences: one inside the
// profile modal (AJUSTES tab, for logged-in users) and one in the header
// (visible only when logged OUT — see the auth state listener below).
// Both are kept in sync on every interaction.
const audioToggleBtn=document.getElementById("audioToggle");
const themeToggleBtn=document.getElementById("themeToggle");
const audioToggleHeaderBtn=document.getElementById("audioToggleHeader");
const themeToggleHeaderBtn=document.getElementById("themeToggleHeader");
const audioToggleBtns=[audioToggleBtn, audioToggleHeaderBtn].filter(Boolean);
const themeToggleBtns=[themeToggleBtn, themeToggleHeaderBtn].filter(Boolean);

function syncAudioToggleUI(){
  audioToggleBtns.forEach(btn=>{
    btn.querySelector(".topbar-dot").classList.toggle("on",audioEnabled);
    btn.classList.toggle("off",!audioEnabled);
  });
}
function syncThemeToggleUI(isDark){
  themeToggleBtns.forEach(btn=>{
    btn.querySelector(".topbar-dot").classList.toggle("on",isDark);
    btn.querySelector(".topbar-label").textContent=isDark?"TEMA OSCURO":"TEMA CLARO";
  });
}

// Restore saved preferences on load
(function restorePrefs(){
  // Welcome popup: always show on load
  try{
    const o=document.getElementById("welcomeOverlay");
    if(o) o.style.display="flex";
  }catch(e){}
  syncAudioToggleUI();
  // Theme: dark is the default; only go light if explicitly saved as light
  let isDark=true;
  try{
    const saved=localStorage.getItem('g2g_darkTheme');
    if(saved!==null) isDark=(saved==='true');
  }catch(e){}
  if(isDark) document.body.classList.add("dark-theme");
  else document.body.classList.remove("dark-theme");
  // Activar transiciones solo después de aplicar el tema inicial
  requestAnimationFrame(()=>document.body.classList.add("theme-loaded"));
  syncThemeToggleUI(isDark);
})();

audioToggleBtns.forEach(btn=>{
  btn.addEventListener("click",()=>{
    audioEnabled=!audioEnabled;
    syncAudioToggleUI();
    try{ localStorage.setItem('g2g_audioEnabled', audioEnabled); }catch(e){}
    if(audioEnabled) playSound('select');
  });
});
themeToggleBtns.forEach(btn=>{
  btn.addEventListener("click",()=>{
    const isDark=document.body.classList.toggle("dark-theme");
    syncThemeToggleUI(isDark);
    try{ localStorage.setItem('g2g_darkTheme', isDark); }catch(e){}
    playSound('select');
  });
});

// Apply inherited players from a chain run (runs after DOM is fully ready)
setTimeout(applyInheritedPlayers, 100);

/* ========= FIREBASE AUTH ========= */
function initFirebaseAuth(){
  if(typeof firebase==='undefined'){
    console.warn('Firebase not available - auth disabled');
    return;
  }
  const auth=firebase.auth();
  const db=firebase.firestore();
  window._fbAuth=auth;
  window._fbDb=db;

  /* ─── VALIDATION ─── */
  function vUsername(v){
    if(!v) return "Nombre de usuario obligatorio.";
    if(v.length<3) return "Mínimo 3 caracteres.";
    if(v.length>20) return "Máximo 20 caracteres.";
    if(!/^[a-zA-Z0-9_]+$/.test(v)) return "Solo letras, números y _ (guión bajo).";
    return "";
  }
  function vEmail(v){
    if(!v) return "Correo obligatorio.";
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Formato de correo no válido.";
    return "";
  }
  function vPassword(v){
    if(!v) return "Contraseña obligatoria.";
    if(v.length<8) return "Mínimo 8 caracteres.";
    return "";
  }
  function $id(id){return document.getElementById(id);}
  window.$id=$id;
  function setErr(id,msg){
    const el=$id(id); if(!el) return;
    el.textContent=msg||""; el.style.display=msg?"block":"none";
  }
  function clearAll(){
    ["loginIdentifierErr","loginPasswordErr","loginGlobalErr",
     "regUsernameErr","regEmailErr","regPasswordErr","regPassword2Err","regGlobalErr"]
    .forEach(id=>setErr(id,""));
  }
  function setBtnLoading(id,loading){
    const btn=$id(id); if(!btn) return;
    btn.disabled=loading;
    btn.textContent=loading?"...":(id==="loginSubmitBtn"?"ENTRAR":"CREAR CUENTA");
  }
  function fbErr(code){
    return({"auth/email-already-in-use":"Este correo ya está registrado.",
      "auth/invalid-email":"Correo no válido.",
      "auth/weak-password":"Contraseña demasiado débil.",
      "auth/user-not-found":"Usuario o contraseña incorrectos.",
      "auth/wrong-password":"Usuario o contraseña incorrectos.",
      "auth/invalid-credential":"Usuario o contraseña incorrectos.",
      "auth/too-many-requests":"Demasiados intentos. Espera un momento.",
      "auth/network-request-failed":"Sin conexión. Comprueba tu red.",
    })[code]||"Error inesperado. Inténtalo de nuevo.";
  }

  /* ─── MODAL ─── */
  window.showAuthModal=function(tab){
    const o=$id("authOverlay"); if(o) o.style.display="flex";
    window.switchAuthTab(tab||"login");
    clearAll();
  };
  window.closeAuthModal=function(){
    const o=$id("authOverlay"); if(o) o.style.display="none";
    clearAll();
  };
  window.switchAuthTab=function(tab){
    const login=$id("authLogin"), reg=$id("authRegister");
    const tl=$id("tabLogin"), tr=$id("tabRegister");
    if(login) login.style.display=tab==="login"?"block":"none";
    if(reg)   reg.style.display=tab==="register"?"block":"none";
    if(tl)    tl.classList.toggle("auth-tab-active",tab==="login");
    if(tr)    tr.classList.toggle("auth-tab-active",tab==="register");
  };

  /* ─── REGISTER ─── */
  window.submitRegister=async function(){
    const username=($id("regUsername")||{}).value?.trim()||"";
    const email=($id("regEmail")||{}).value?.trim()||"";
    const pass=($id("regPassword")||{}).value||"";
    const pass2=($id("regPassword2")||{}).value||"";
    const uErr=vUsername(username),eErr=vEmail(email),
          pErr=vPassword(pass),p2Err=pass!==pass2?"Las contraseñas no coinciden.":"";
    setErr("regUsernameErr",uErr); setErr("regEmailErr",eErr);
    setErr("regPasswordErr",pErr); setErr("regPassword2Err",p2Err);
    setErr("regGlobalErr","");
    if(uErr||eErr||pErr||p2Err) return;
    setBtnLoading("regSubmitBtn",true);
    try{
      const snap=await db.collection("users").where("username_lower","==",username.toLowerCase()).get();
      if(!snap.empty){setErr("regUsernameErr","Este nombre de usuario ya está en uso.");setBtnLoading("regSubmitBtn",false);return;}
      const cred=await auth.createUserWithEmailAndPassword(email,pass);
      await db.collection('users').doc(cred.user.uid).set({
        username,username_lower:username.toLowerCase(),email,
        createdAt:new Date().toISOString(),
        ticketCount:1, ticketLastRegen:Date.now(), scratchPoints:0, scratchPointsEarned:0, scratchPointsSpent:0,
        stats:{gamesPlayed:0,wins:0,draws:0,losses:0,goalsFor:0,goalsAgainst:0,bestScore:0,titles:0}
      });
      if(window._initTicketSystem) window._initTicketSystem(cred.user, true);
      window.closeAuthModal();
    }catch(err){
      console.error('Firebase register error:', err.code, err.message);
      setErr("regGlobalErr",fbErr(err.code));
      setBtnLoading("regSubmitBtn",false);
    }
  };

  /* ─── LOGIN ─── */
  window.submitLogin=async function(){
    const identifier=($id("loginIdentifier")||{}).value?.trim()||"";
    const pass=($id("loginPassword")||{}).value||"";
    setErr("loginIdentifierErr",""); setErr("loginPasswordErr",""); setErr("loginGlobalErr","");
    if(!identifier){setErr("loginIdentifierErr","Campo obligatorio.");return;}
    if(!pass){setErr("loginPasswordErr","Campo obligatorio.");return;}
    setBtnLoading("loginSubmitBtn",true);
    try{
      let email=identifier;
      if(!identifier.includes("@")){
        const snap=await db.collection("users").where("username_lower","==",identifier.toLowerCase()).get();
        if(snap.empty){setErr("loginIdentifierErr","Usuario no encontrado.");setBtnLoading("loginSubmitBtn",false);return;}
        email=snap.docs[0].data().email;
      }
      await auth.signInWithEmailAndPassword(email,pass);
      window.closeAuthModal();
    }catch(err){setErr("loginGlobalErr",fbErr(err.code));setBtnLoading("loginSubmitBtn",false);}
  };

  /* ─── LOGOUT ─── */
  window.authLogout=async function(){await auth.signOut();};

  /* ─── AUTH STATE ─── */
  auth.onAuthStateChanged(async user=>{
    const authBtn=$id("authBtn");
    const profileBtn=$id("profileBtn");
    const settingsMenu=$id("settingsMenu");
    if(user){
      const snap=await db.collection("users").doc(user.uid).get();
      const username=snap.exists?snap.data().username:user.email;
      if(authBtn)    authBtn.style.display="none";
      if(profileBtn){ profileBtn.style.display=""; profileBtn.textContent="👤 "+username; }
      if(settingsMenu) settingsMenu.style.display="none";
      // Mostrar botón de tickets en desktop
      const hBtn=$id("headerTicketBtn"); if(hBtn) hBtn.style.display="";
      const pun=$id("profileUsername"); if(pun) pun.textContent=username;
      window.currentUsername=username;
      const data=snap.exists?snap.data():{};
      window.preferredTeamName=data.preferredTeamName||"";
      window.useFixedTeamName=!!data.useFixedTeamName;
      // Inicializar sistema de boletos
      if(window._initTicketSystem) window._initTicketSystem(user, false);
    }else{
      if(authBtn)    authBtn.style.display="";
      if(profileBtn) profileBtn.style.display="none";
      if(settingsMenu) settingsMenu.style.display="";
      const hBtn=$id("headerTicketBtn"); if(hBtn) hBtn.style.display="none";
      window.currentUsername=null;
      window.preferredTeamName="";
      window.useFixedTeamName=false;
      // Sin sesión: mensaje diferenciado en el welcome overlay
      const wt=$id("welcomeText");
      const wrb=$id("welcomeRegisterBtn");
      if(wt) wt.innerHTML='Bienvenido a <strong style="color:var(--gold)">Goal2Goat</strong>, <strong style="color:var(--gold)">REGÍSTRATE</strong> para guardar tu progreso y tener acceso a contenido exclusivo.<br><br>Goal2Goat es un manager de fútbol con alma de roguelike. Tu apoyo nos ayuda a seguir mejorando el juego, añadiendo contenido nuevo y manteniéndolo libre de publicidad invasiva.';
      if(wrb){
        wrb.style.display='block';
        wrb.onclick=()=>{
          const wo=$id("welcomeOverlay"); if(wo) wo.style.display="none";
          window.showAuthModal&&window.showAuthModal('register');
        };
      }
      updateTicketBadge(0);
    }
  });

  /* ─── PROFILE MODAL ─── */
  window.showProfileModal=async function(){
    const o=$id("profileOverlay"); if(o) o.style.display="flex";
    const user=auth.currentUser;
    if(!user) return;
    // Show loading state
    ["pstat-games","pstat-wins","pstat-draws","pstat-losses",
     "pstat-gf","pstat-ga","pstat-best","pstat-titles"]
    .forEach(id=>{ const el=$id(id); if(el) el.textContent="..."; });
    try{
      const snap=await db.collection("users").doc(user.uid).get();
      if(!snap.exists) return;
      const s=snap.data().stats||{};
      // If missing fields (old account), patch them silently
      const needsPatch=s.draws===undefined||s.losses===undefined||s.goalsFor===undefined;
      if(needsPatch){
        await db.collection("users").doc(user.uid).update({
          "stats.draws":s.draws||0,"stats.losses":s.losses||0,
          "stats.goalsFor":s.goalsFor||0,"stats.goalsAgainst":s.goalsAgainst||0,
          "stats.titles":s.titles||0
        });
      }
      // Self-heal: reconcile bestScore against this user's actual run history,
      // in case an old race condition left a stale (too low) bestScore stored.
      let displayBest=s.bestScore||0;
      try{
        const myScoresSnap=await db.collection("scores").where("uid","==",user.uid).get();
        let actualBest=0;
        myScoresSnap.forEach(d=>{ const sc=d.data().score||0; if(sc>actualBest) actualBest=sc; });
        if(actualBest>displayBest){
          displayBest=actualBest;
          await db.collection("users").doc(user.uid).set({stats:{bestScore:actualBest}},{merge:true});
          console.log("Reconciled bestScore:", actualBest);
        }
      }catch(e){ console.warn("bestScore reconciliation skipped:", e.code); }
      const n=(v)=>v||0;
      const set=(id,v)=>{ const el=$id(id); if(el) el.textContent=n(v); };
      set("pstat-games",  s.gamesPlayed);
      set("pstat-wins",   s.wins);
      set("pstat-draws",  s.draws);
      set("pstat-losses", s.losses);
      set("pstat-gf",     s.goalsFor);
      set("pstat-ga",     s.goalsAgainst);
      set("pstat-best",   displayBest);
      set("pstat-titles", s.titles);
      // Puntos rasca y gana
      const spEl=$id("pstat-scratch-pts");
      if(spEl) spEl.textContent=snap.data().scratchPoints||0;

      // Load team-name preference (USUARIO tab)
      const data=snap.data();
      const nameInp=$id("preferredTeamNameInput");
      const checkbox=$id("useFixedTeamNameCheckbox");
      if(nameInp)  nameInp.value=data.preferredTeamName||"";
      if(checkbox) checkbox.checked=!!data.useFixedTeamName;
      // Cheats: solo visible y funcional para tiopops (jesuslor85@gmail.com)
      const cheatsSection=$id("cheatsSection");
      const isCheatUser=(data.email||'').toLowerCase()===CHEAT_USER.toLowerCase();
      if(cheatsSection) cheatsSection.style.display=isCheatUser?"block":"none";
      if(isCheatUser){
        // Clonar para eliminar listeners previos acumulados
        const oldCb=$id("cheatsCheckbox");
        if(oldCb){
          const newCb=oldCb.cloneNode(true);
          oldCb.parentNode.replaceChild(newCb, oldCb);
          newCb.checked=!!window.CHEATS_ACTIVE;
          newCb.addEventListener('change',function(){
            window.CHEATS_ACTIVE=this.checked;
            updateTicketBadge(window.CHEATS_ACTIVE?3:undefined);
            if(window.CHEATS_ACTIVE){const pse=$id('pstat-scratch-pts');if(pse)pse.textContent=100;}
            showToast(window.CHEATS_ACTIVE?"⚙️ Cheats ON — ganas todos, tickets 3/3, pts 100":"⚙️ Cheats OFF — juego normal","toast-pos");
          });
        }
      }
    }catch(e){
      console.warn("Stats load error:", e);
      ["pstat-games","pstat-wins","pstat-draws","pstat-losses",
       "pstat-gf","pstat-ga","pstat-best","pstat-titles"]
      .forEach(id=>{ const el=$id(id); if(el) el.textContent="—"; });
    }
  };
  window.closeProfileModal=function(){
    const o=$id("profileOverlay"); if(o) o.style.display="none";
  };

  // Save the team-name preference (preferredTeamName + useFixedTeamName).
  // Auto-saves on checkbox toggle / input blur — no separate button needed.
  window.saveTeamNamePreference=async function(silent){
    const user=auth.currentUser; if(!user) return;
    const nameInp=$id("preferredTeamNameInput");
    const checkbox=$id("useFixedTeamNameCheckbox");
    const preferredTeamName=(nameInp?nameInp.value.trim():"").toUpperCase();
    const useFixedTeamName=!!(checkbox&&checkbox.checked);
    if(useFixedTeamName&&!preferredTeamName){
      if(checkbox) checkbox.checked=false; // can't activate without a name
      showToast("Escribe un nombre de equipo antes de activar la opción.", "toast-neg");
      return;
    }
    try{
      await db.collection("users").doc(user.uid).set({
        preferredTeamName, useFixedTeamName
      },{merge:true});
      // CRITICAL: also update the live global variables — showTeamNameModal
      // reads these directly, and they're otherwise only set once at login.
      window.preferredTeamName=preferredTeamName;
      window.useFixedTeamName=useFixedTeamName;
      if(!silent) showToast(useFixedTeamName?"Nombre fijo activado.":"Preferencia guardada.", "toast-pos");
    }catch(e){
      console.warn("saveTeamNamePreference error:", e);
      showToast("No se pudo guardar la preferencia.", "toast-neg");
    }
  };

  window.switchProfileTab=function(tab){
    const tabs={
      stats: {btn:$id("profileTabStats"), pane:$id("profileStatsPane")},
      user:  {btn:$id("profileTabUser"),  pane:$id("profileUserPane")},
      notes: {btn:$id("profileTabNotes"), pane:$id("profileNotesPane")},
    };
    Object.entries(tabs).forEach(([key,{btn,pane}])=>{
      const active=(key===tab);
      btn?.classList.toggle("auth-tab-active", active);
      pane?.classList.toggle("profile-tab-pane-active", active);
    });
  };

  // Save match result to Firestore
  window.saveMatchStat=async function(won, draw, goalsFor, goalsAgainst){
    const user=auth.currentUser; if(!user) return;
    try{
      const inc=firebase.firestore.FieldValue.increment;
      const ref=db.collection("users").doc(user.uid);
      // Use set+merge so missing fields get created automatically
      await ref.set({
        stats:{
          gamesPlayed: inc(1),
          wins:        inc(won?1:0),
          draws:       inc(draw?1:0),
          losses:      inc(!won&&!draw?1:0),
          goalsFor:    inc(goalsFor||0),
          goalsAgainst:inc(goalsAgainst||0),
        }
      },{merge:true});
      console.log("Stat saved:", {won,draw,goalsFor,goalsAgainst});
    }catch(e){ console.warn("Stat save error:", e.code, e.message); }
  };

  window.saveVictoryStat=async function(score){
    const user=auth.currentUser; if(!user) return;
    try{
      const inc=firebase.firestore.FieldValue.increment;
      await db.collection("users").doc(user.uid)
        .set({stats:{titles:inc(1)}},{merge:true});
    }catch(e){ console.warn("Victory stat error:", e.code, e.message); }
  };

  // Save score for any run — updates bestScore only if better, always adds to scores collection
  // Save score for any run — updates bestScore only if better (atomic via transaction
  // to avoid race conditions when multiple runs finish in quick succession), always
  // adds this run's score to the global 'scores' collection.
  window.saveFinalScore=async function(score){
    const user=auth.currentUser; if(!user) return;
    if(!score||score<=0) return;
    try{
      const userRef=db.collection("users").doc(user.uid);

      // 1. Atomically update bestScore only if this score is higher than whatever
      //    is currently stored — a transaction prevents two near-simultaneous
      //    runs from both reading a stale value and one overwriting the other.
      const username = await db.runTransaction(async (tx)=>{
        const snap=await tx.get(userRef);
        const data=snap.exists?snap.data():{};
        const s=data.stats||{};
        const currentBest=s.bestScore||0;
        if(score>currentBest){
          tx.set(userRef,{
            stats:{bestScore:score},
            bestTeamName:typeof myTeamName!=='undefined'?myTeamName:'—'
          },{merge:true});
        }
        return data.username||'—';
      });

      // 2. Always add this score to the global 'scores' collection (one doc per run)
      //    The ranking reads from this collection, so ALL scores are preserved
      await db.collection("scores").add({
        uid:       user.uid,
        username:  username,
        teamName:  typeof myTeamName!=='undefined'?myTeamName:'—',
        score:     score,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      console.log("Score saved:", score);
    }catch(e){ console.warn("saveFinalScore error:", e.code, e.message); }
  };

  // Load top 50 from the 'scores' collection — all runs, all users, ordered desc
  window.loadRanking=async function(targetId){
    const el=document.getElementById(targetId||'rankingTable');
    if(!el) return;
    el.innerHTML='<p class="ranking-loading">Cargando ranking...</p>';
    try{
      const snap=await db.collection("scores")
        .orderBy("score","desc")
        .limit(50)
        .get();
      if(snap.empty){
        el.innerHTML='<p class="ranking-loading">Aún no hay puntuaciones. ¡Sé el primero!</p>';
        return;
      }
      let rows=''; let pos=0;
      snap.docs.forEach(doc=>{
        const d=doc.data();
        if(!d.score||d.score<=0) return;
        pos++;
        const posClass=pos===1?'gold':pos===2?'silver':pos===3?'bronze':'';
        const medal=pos===1?'🥇':pos===2?'🥈':pos===3?'🥉':'';
        rows+=`<tr>
          <td class="rank-pos ${posClass}">${medal||pos}</td>
          <td class="rank-name">${d.username||'—'}<br>
            <span style="font-size:10px;color:var(--text-muted);font-weight:400">${d.teamName||'—'}</span>
          </td>
          <td class="rank-score">${d.score}</td>
        </tr>`;
      });
      el.innerHTML=rows
        ?`<table class="ranking-table">
            <thead><tr><th>#</th><th>JUGADOR / EQUIPO</th><th style="text-align:right">PTS</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>`
        :'<p class="ranking-loading">Aún no hay puntuaciones. ¡Juega y sé el primero!</p>';
    }catch(e){
      console.warn("Ranking load error:", e);
      el.innerHTML='<p class="ranking-loading">Error al cargar el ranking.</p>';
    }
  };

  window.showRankingModal=function(){
    const o=document.getElementById('rankingOverlay');
    if(o){ o.style.display='flex'; window.loadRanking('rankingTableDesktop'); }
    // Mostrar botón de limpiar solo en modo debug
    const dbz=document.getElementById('rankingDebugZone');
    if(dbz) dbz.style.display=window.CHEATS_ACTIVE?'block':'none';
  };

  window.clearRanking=async function(){
    if(!window.CHEATS_ACTIVE) return;
    if(!confirm('¿Borrar TODAS las entradas del ranking? Esta acción no se puede deshacer.')) return;
    try{
      const btn=document.querySelector('#rankingDebugZone button');
      if(btn) btn.textContent='Borrando...';
      const snap=await window._fbDb.collection('scores').get();
      const batch=window._fbDb.batch();
      snap.docs.forEach(doc=>batch.delete(doc.ref));
      await batch.commit();
      if(btn) btn.textContent='⚙️ LIMPIAR RANKING COMPLETO';
      window.loadRanking('rankingTableDesktop');
    }catch(e){
      console.error('Error limpiando ranking:',e);
      alert('Error: '+e.message);
    }
  };

  /* ─── CLOSE ON BACKDROP ─── */
  document.addEventListener("click",e=>{
    const auth=$id("authOverlay");
    if(auth&&e.target===auth) window.closeAuthModal();
    const prof=$id("profileOverlay");
    if(prof&&e.target===prof) window.closeProfileModal();
    const rank=$id("rankingOverlay");
    if(rank&&e.target===rank) rank.style.display='none';
  });

  /* ─── WIRE BUTTONS ─── */
  function wire(id,fn){ const el=$id(id); if(el) el.addEventListener("click",fn); }
  wire("authBtn",          ()=>window.showAuthModal("login"));
  wire("profileBtn",       ()=>window.showProfileModal());
  wire("authCloseBtn",     ()=>window.closeAuthModal());
  wire("profileCloseBtn",  ()=>window.closeProfileModal());
  wire("profileLogoutBtn", ()=>{ window.authLogout(); window.closeProfileModal(); });
  wire("profileTabStats",  ()=>window.switchProfileTab("stats"));
  wire("profileTabUser",   ()=>window.switchProfileTab("user"));
  wire("profileTabNotes",  ()=>window.switchProfileTab("notes"));
  // Auto-save the team-name preference: checkbox toggles save immediately,
  // the text field saves when the user leaves it (blur) or presses Enter.
  (function(){
    const checkbox=$id("useFixedTeamNameCheckbox");
    const nameInp=$id("preferredTeamNameInput");
    if(checkbox) checkbox.addEventListener("change", ()=>window.saveTeamNamePreference());
    if(nameInp){
      nameInp.addEventListener("blur", ()=>window.saveTeamNamePreference(true));
      nameInp.addEventListener("keydown", e=>{ if(e.key==="Enter") window.saveTeamNamePreference(); });
    }
  })();
  wire("tabLogin",         ()=>window.switchAuthTab("login"));
  wire("tabRegister",      ()=>window.switchAuthTab("register"));
  wire("loginSubmitBtn",   ()=>window.submitLogin());
  wire("regSubmitBtn",     ()=>window.submitRegister());

  // Enter key support for auth forms
  function addEnterKey(inputId, submitFn){
    const el=$id(inputId);
    if(el) el.addEventListener("keydown",e=>{ if(e.key==="Enter") submitFn(); });
  }
  // Login: Enter on any field submits
  ["loginIdentifier","loginPassword"].forEach(id=>addEnterKey(id,window.submitLogin));
  // Register: Enter on last field submits
  ["regUsername","regEmail","regPassword","regPassword2"].forEach(id=>addEnterKey(id,window.submitRegister));
  // Welcome popup
  wire("welcomeStartBtn",  ()=>{
    const o=$id("welcomeOverlay"); if(o) o.style.display="none";
  });
}

// initFirebaseAuth() is called by firebase.js once all Firebase SDKs are loaded

/* ========= MOBILE TAB NAVIGATION ========= */
function switchMobileTab(tab){
  if(window.innerWidth>1050) return;

  document.querySelectorAll('.mob-tab').forEach(btn=>{
    btn.classList.toggle('active', btn.dataset.tab===tab);
  });

  const left=document.querySelector('.left-panel');
  const right=document.querySelector('.right-panel');
  const ranking=document.getElementById('rankingPanel');
  const info=document.getElementById('infoPanel');
  if(left)    left.classList.remove('mob-active');
  if(right)   right.classList.remove('mob-active');
  if(ranking) ranking.classList.remove('mob-active');
  if(info)    info.classList.remove('mob-active');

  if(tab==='campo'){
    if(typeof renderMobileFormationInfo==='function') renderMobileFormationInfo();
    setTimeout(()=>{
      const p=document.getElementById('pitchBox')||document.getElementById('pitch');
      if(p) p.scrollIntoView({behavior:'smooth',block:'start'});
    },50);
  } else if(tab==='equipo'){
    if(left) left.classList.add('mob-active');
    setTimeout(()=>{
      // Before the formation is locked, FORMACIÓN + PERFIL DEL EQUIPO
      // still live in the center panel — scroll there instead of
      // CONVOCADOS (which has no relevant content to show yet).
      if(!formationIsLocked){
        const fp=document.getElementById('formationPickerBox');
        if(fp) fp.scrollIntoView({behavior:'smooth',block:'start'});
        return;
      }
      const cb=document.getElementById('convocadosBox')||left;
      if(cb) cb.scrollIntoView({behavior:'smooth',block:'start'});
    },50);
  } else if(tab==='rival'){
    if(right) right.classList.add('mob-active');
    const badge=document.querySelector('.mob-tab[data-tab="rival"] .mob-tab-badge');
    if(badge) badge.style.display='none';
    setTimeout(()=>{
      const rb=document.getElementById('rivalBox');
      if(rb) rb.scrollIntoView({behavior:'smooth',block:'start'});
      else if(right) right.scrollIntoView({behavior:'smooth',block:'start'});
    },50);
  } else if(tab==='historial'){
    if(right) right.classList.add('mob-active');
    setTimeout(()=>{
      const mh=document.getElementById('matchHistoryBox');
      if(mh) mh.scrollIntoView({behavior:'smooth',block:'start'});
      else if(right) right.scrollIntoView({behavior:'smooth',block:'start'});
    },80);
  } else if(tab==='info'){
    if(info){
      info.classList.add('mob-active');
      setTimeout(()=>info.scrollIntoView({behavior:'smooth',block:'start'}),50);
    }
    // Auto-expand all three tutorial boxes when entering INFORMACIÓN
    const tipsBox=document.getElementById("tipsBox");
    const howTo=document.getElementById("howToPlayBox");
    const statsGuide=document.getElementById("statsGuideBox");
    if(tipsBox) tipsBox.classList.remove("collapsed");
    if(howTo) howTo.classList.remove("collapsed");
    if(statsGuide) statsGuide.classList.remove("collapsed");
  } else {
    // Any other tab: re-collapse the tutorial boxes (they live off-screen
    // in infoPanel, but keep the collapsed state consistent for next visit
    // and for when they relocate back to the right panel on desktop).
    const tipsBox=document.getElementById("tipsBox");
    const howTo=document.getElementById("howToPlayBox");
    const statsGuide=document.getElementById("statsGuideBox");
    if(tipsBox) tipsBox.classList.add("collapsed");
    if(howTo) howTo.classList.add("collapsed");
    if(statsGuide) statsGuide.classList.add("collapsed");
  }
  if(tab==='ranking'){
    if(ranking){
      ranking.classList.add('mob-active');
      setTimeout(()=>ranking.scrollIntoView({behavior:'smooth',block:'start'}),50);
    }
    if(typeof window.loadRanking==='function') window.loadRanking('rankingTable');
  }
}
function notifyMobileRivalTab(){
  if(window.innerWidth>1050) return;
  const badge=document.querySelector('.mob-tab[data-tab="rival"] .mob-tab-badge');
  if(badge){ badge.style.display='flex'; }
  const btn=document.querySelector('.mob-tab[data-tab="rival"]');
  if(btn) btn.style.color='var(--gold)';
}
// Clear rival badge when tab is opened
document.addEventListener('click', e=>{
  if(e.target.closest('.mob-tab[data-tab="rival"]')){
    const badge=document.querySelector('.mob-tab[data-tab="rival"] .mob-tab-badge');
    if(badge) badge.style.display='none';
  }
});

// Add badge HTML to rival tab on init
(function(){
  const rivalTab=document.querySelector('.mob-tab[data-tab="rival"]');
  if(rivalTab && !rivalTab.querySelector('.mob-tab-badge')){
    const badge=document.createElement('span');
    badge.className='mob-tab-badge';
    badge.style.display='none';
    badge.textContent='!';
    rivalTab.appendChild(badge);
  }
})();

/* ============================================================
   SISTEMA DE BOLETOS RASCA Y GANA
   - 1 boleto cada 4h, máximo 3 acumulados
   - Al crear cuenta: 1 boleto inicial
   - Premios: 🪙 moneda = 1 pt, 🐐 cabra = 3 pts, ❌ = pierde todo
   - 2 casillas X roja, 1 cabra, resto monedas (9 casillas total)
   - Puntos se guardan en Firestore: users/{uid}.scratchPoints
   ============================================================ */

const TICKET_MAX = 3;
const TICKET_FIXED_HOURS = [0, 4, 8, 12, 16, 20]; // horas locales de recarga

/* Devuelve el timestamp local del próximo slot de recarga a partir de 'now' */
function nextTicketSlot(now){
  const d = new Date(now);
  const h = d.getHours(), m = d.getMinutes(), s = d.getSeconds(), ms = d.getMilliseconds();
  const minutesNow = h * 60 + m;
  // Buscar el próximo slot en el mismo día
  for(const fh of TICKET_FIXED_HOURS){
    if(fh * 60 > minutesNow){
      const next = new Date(d);
      next.setHours(fh, 0, 0, 0);
      return next.getTime();
    }
  }
  // Si ya pasaron todos los slots de hoy → primer slot de mañana
  const next = new Date(d);
  next.setDate(next.getDate() + 1);
  next.setHours(TICKET_FIXED_HOURS[0], 0, 0, 0);
  return next.getTime();
}

/* Cuántos slots han pasado entre lastChecked y now */
function slotsBetween(lastChecked, now){
  let count = 0;
  let cursor = lastChecked;
  while(true){
    const slot = nextTicketSlot(cursor);
    if(slot > now) break;
    count++;
    cursor = slot;
  }
  return count;
}

function computeCurrentTickets(count, lastChecked){
  const now = Date.now();
  const gained = slotsBetween(lastChecked, now);
  if(gained <= 0) return { count, lastChecked };
  const newCount = Math.min(TICKET_MAX, count + gained);
  // lastChecked avanza al último slot consumido
  let cursor = lastChecked;
  for(let i = 0; i < gained; i++) cursor = nextTicketSlot(cursor);
  return { count: newCount, lastChecked: cursor };
}

/* ── Leer/escribir estado de boletos en Firestore ── */
async function getTicketState(){
  const auth=window._fbAuth; const db=window._fbDb;
  if(!auth||!db) return null;
  const user=auth.currentUser;
  if(!user) return null;
  if(window.CHEATS_ACTIVE) return {count:3, lastChecked:Date.now(), scratchPoints:100};
  const snap=await db.collection('users').doc(user.uid).get();
  if(!snap.exists) return null;
  const d=snap.data();
  return {
    count: d.ticketCount !== undefined ? d.ticketCount : 1,
    lastChecked: d.ticketLastRegen || Date.now(),
    scratchPoints: d.scratchPoints || 0,
    scratchPointsEarned: d.scratchPointsEarned || 0,
    scratchPointsSpent: d.scratchPointsSpent || 0,
  };
}

async function saveTicketState(count, lastChecked, scratchPoints){
  const auth=window._fbAuth; const db=window._fbDb;
  if(!auth||!db) return;
  const user=auth.currentUser;
  if(!user) return;
  await db.collection('users').doc(user.uid).set({
    ticketCount: count,
    ticketLastRegen: lastChecked,
    scratchPoints: scratchPoints,
  },{merge:true});
}

/* ── Actualizar badge en la tab de móvil ── */
function updateTicketBadge(count){
  // Si cheats activos, siempre mostrar 3
  if(window.CHEATS_ACTIVE) count=3;
  if(count===undefined||count===null) return; // sin datos aún
  // Mobile tab badge
  const el=$id('ticketCountBadge');
  if(el){
    el.textContent=`${count}/${TICKET_MAX}`;
    el.style.color=count>0?'var(--gold)':'#666';
  }
  // Desktop header button
  const hBtn=$id('headerTicketBtn');
  const hCount=$id('headerTicketCount');
  const hAlert=$id('headerTicketAlert');
  if(hCount) hCount.textContent=`${count}/${TICKET_MAX}`;
  if(hAlert) hAlert.style.display=count>0?'block':'none';
  // Punto de alerta en tab móvil
  const btn=$id('ticketTabBtn');
  if(btn){
    let dot=btn.querySelector('.mob-tab-badge');
    if(count>0&&!dot){
      dot=document.createElement('span');
      dot.className='mob-tab-badge';
      dot.style.cssText='background:#f87171;width:8px;height:8px;border-radius:50%;padding:0;min-width:unset;';
      btn.appendChild(dot);
    } else if(count<=0&&dot){
      dot.remove();
    }
  }
}

/* ── Abrir / cerrar overlay de tickets ── */
window.openTicketOverlay = function() {
  var ov = document.getElementById('ticketOverlay');
  if (ov) ov.style.display = 'block';
  var mt = document.getElementById('ticketMountPoint');
  if (!mt) return;

  var auth = window._fbAuth;
  if (!auth) {
    mt.innerHTML = '<div style="padding:40px;color:#f87171;text-align:center">Firebase no disponible. Recarga la página.</div>';
    return;
  }

  var user = auth.currentUser;
  if (!user) {
    mt.innerHTML = "<div style='text-align:center;color:#ccc;padding:40px 20px'><div style='font-size:48px'>🔒</div><div style='font-size:20px;color:#f0c419;margin:10px 0;font-family:Bebas Neue,sans-serif'>INICIA SESIÓN</div><p style='font-size:12px;color:#aaa'>Necesitas cuenta para usar los tickets.</p><button onclick='window.closeTicketOverlay()' style='margin-top:16px;border:1px solid #444;background:none;color:#aaa;padding:8px 20px;cursor:pointer;font-size:13px'>CERRAR</button></div>";
    return;
  }

  mt.innerHTML = '<div style="text-align:center;padding:40px;color:#aaa">Cargando...</div>';

  getTicketState().then(function(state) {
    if (!state) {
      mt.innerHTML = '<div style="padding:40px;color:#f87171;text-align:center">Error cargando tickets.</div>';
      return;
    }
    var updated = computeCurrentTickets(state.count, state.lastChecked);
    if (updated.count !== state.count || updated.lastChecked !== state.lastChecked) {
      saveTicketState(updated.count, updated.lastChecked, state.scratchPoints);
    }
    updateTicketBadge(updated.count);
    if (updated.count <= 0) {
      var nextSlot = nextTicketSlot(Date.now());
      var d = new Date(nextSlot);
      var hh = String(d.getHours()).padStart(2,'0');
      var mm = String(d.getMinutes()).padStart(2,'0');
      var msLeft = nextSlot - Date.now();
      var hLeft = Math.floor(msLeft / 3600000);
      var mLeft = Math.floor((msLeft % 3600000) / 60000);
      var sLeft = Math.floor((msLeft % 60000) / 1000);
      // Diseño de modal de perfil con temporizador en vivo
      mt.innerHTML = `<div class="auth-modal" style="max-width:340px;text-align:center;padding:28px 24px">
        <div style="font-size:48px;margin-bottom:8px">🎟️</div>
        <div style="font-family:'Bebas Neue',Impact,sans-serif;font-size:22px;letter-spacing:2px;color:var(--gold);margin-bottom:20px">SIN TICKETS</div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;letter-spacing:1px;text-transform:uppercase">Próximo ticket en</div>
        <div id="ticketCountdown" style="font-family:'Bebas Neue',Impact,sans-serif;font-size:48px;color:#fff;letter-spacing:4px;margin-bottom:24px">--:--:--</div>
        <button onclick="window.closeTicketOverlay()" style="width:100%;border:none;background:#c0392b;color:#fff;padding:12px;cursor:pointer;font-family:'Bebas Neue',Impact,sans-serif;font-size:16px;letter-spacing:1.5px;transition:.15s" onmouseover="this.style.background='#e74c3c'" onmouseout="this.style.background='#c0392b'">CERRAR</button>
      </div>`;
      // Arrancar cuenta atrás en vivo
      function _tickCountdown(){
        const el = document.getElementById('ticketCountdown');
        if(!el) return; // overlay cerrado
        const left = nextTicketSlot(Date.now()) - Date.now();
        if(left <= 0){ el.textContent = '00:00:00'; return; }
        const h = Math.floor(left/3600000);
        const m = Math.floor((left%3600000)/60000);
        const s = Math.floor((left%60000)/1000);
        el.textContent = String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
        setTimeout(_tickCountdown, 1000);
      }
      _tickCountdown();
      return;
    }
    buildTicketInMount(mt, updated.count, updated.lastChecked, state.scratchPoints);
  }).catch(function(e) {
    console.error('openTicketOverlay error:', e);
    mt.innerHTML = '<div style="padding:40px;color:#f87171;text-align:center">Error: ' + e.message + '</div>';
  });
};

window.closeTicketOverlay = function() {
  var ov = document.getElementById('ticketOverlay');
  if (ov) ov.style.display = 'none';
};

/* ── Construir el boleto dentro del mount point ── */
function buildTicketInMount(mount, ticketCount, lastRegen, currentScratchPts){
  const GRID_SIZE=9;
  // Composición fija: 2 X rojas, 1 cabra (5pts), 6 monedas (1pt cada una)
  const indices=Array.from({length:GRID_SIZE},(_,i)=>i);
  // Barajar Fisher-Yates
  for(let i=indices.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [indices[i],indices[j]]=[indices[j],indices[i]];
  }
  const bombSet=new Set([indices[0],indices[1]]);
  const starIdx=indices[2];

  const cellsData=[];
  for(let i=0;i<GRID_SIZE;i++){
    if(bombSet.has(i))       cellsData.push({type:'bomb', value:0});
    else if(i===starIdx)     cellsData.push({type:'star', value:4});
    else                     cellsData.push({type:'coin', value:1});
  }

  let scratchedCount=0, totalPoints=0, gameOver=false;
  const serial=String(Math.floor(1000+Math.random()*8999))+'-'+String(Math.floor(1000+Math.random()*8999));

  mount.innerHTML=`
  <div class="ticket" id="ticketCard" style="position:relative;width:340px;background:linear-gradient(180deg,#0f3d24 0%,#0c2e1c 100%);border-radius:0;box-shadow:0 30px 60px -20px rgba(0,0,0,.7),0 0 0 1px rgba(240,196,25,.15);overflow:visible">
    <div style="display:flex;justify-content:space-around;margin:0 -4px;position:relative;z-index:2">${Array.from({length:12},()=>'<div style="width:16px;height:16px;border-radius:50%;background:#0a1212;border:1px solid rgba(246,241,227,.1);flex-shrink:0"></div>').join('')}</div>
    <button onclick=\"window.closeTicketOverlay()\" style=\"position:absolute;top:10px;right:12px;background:none;border:none;color:rgba(246,241,227,.5);font-size:20px;cursor:pointer;z-index:10;line-height:1;padding:4px\" title=\"Cerrar\">✕</button>

    <div style="padding:26px 22px 22px;">
      <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:2px;">
        <span style="font-size:18px">⚽</span>
        <span style="font-family:'Bebas Neue',Impact,sans-serif;font-size:22px;letter-spacing:2px;color:#f0c419;text-shadow:0 2px 0 rgba(0,0,0,.4)">GOAL2GOAT</span>
        <span style="font-size:18px">🐐</span>
      </div>
      <div style="text-align:center;font-size:10px;letter-spacing:3px;color:rgba(246,241,227,.55);text-transform:uppercase;margin-bottom:16px;font-weight:700">Ticket de GoatPoints</div>
      <div style="height:1px;background:repeating-linear-gradient(90deg,rgba(240,196,25,.35) 0 6px,transparent 6px 12px);margin:14px 0"></div>
      <div style="display:flex;justify-content:space-between;font-size:9px;letter-spacing:1px;color:rgba(246,241,227,.4);text-transform:uppercase;margin-bottom:14px;">
        <span>Nº <b style="color:rgba(246,241,227,.65)">${serial}</b></span>
        <span>Boleto ${TICKET_MAX+1-ticketCount}/${TICKET_MAX}</span>
      </div>
      <div style="text-align:center;margin-bottom:18px;">
        <div style="font-size:9px;letter-spacing:3px;text-transform:uppercase;color:rgba(246,241,227,.5);margin-bottom:4px;font-weight:700">Puntos acumulados en el boleto</div>
        <div id="tPrize" style="font-family:'Bebas Neue',Impact,sans-serif;font-size:40px;color:#f0c419;text-shadow:0 3px 0 rgba(0,0,0,.35);">0 <span style="font-size:20px;opacity:.85">PTS</span></div>
      </div>
      <div class="scratch-grid" id="tGrid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:18px;"></div>
      <div id="tDots" style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:16px;flex-wrap:wrap;">
        <span style="font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(246,241,227,.5);font-weight:700;margin-right:4px;">Casillas rascadas</span>
      </div>
      <div style="margin-bottom:18px;">
        <div style="display:flex;justify-content:space-between;font-size:9px;letter-spacing:1px;text-transform:uppercase;color:rgba(246,241,227,.5);font-weight:700;margin-bottom:5px;">
          <span>Riesgo de la próxima casilla</span>
          <span style="color:#d94f3d;font-weight:800" id="tRiskVal">8%</span>
        </div>
        <div style="height:6px;border-radius:4px;background:rgba(246,241,227,.12);overflow:hidden;">
          <div id="tRiskFill" style="height:100%;border-radius:4px;background:linear-gradient(90deg,#e8b923,#d94f3d);width:8%;transition:width .4s ease;"></div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;">
        <button id="tCashBtn" disabled onclick="ticketCashOut(false)" style="border:none;border-radius:0;font-family:'Bebas Neue',Impact,sans-serif;font-size:22px;letter-spacing:2px;padding:14px;cursor:pointer;background:linear-gradient(180deg,#ffe27a,#f0c419 55%,#c9960c);color:#08160d;box-shadow:0 6px 0 #8a6a08,0 10px 18px -6px rgba(0,0,0,.5);opacity:.35;pointer-events:none;">PLANTARSE</button>

      </div>
      
    </div>
  </div>
  <div id="tResultOverlay" style="display:none;position:fixed;inset:0;z-index:50000;background:rgba(0,0,0,.75);align-items:center;justify-content:center;padding:20px;"></div>`;

  // Construir grid
  const grid=$id('tGrid');
  const dotsRow=$id('tDots');
  for(let i=0;i<GRID_SIZE;i++){
    const data=cellsData[i];
    const cell=document.createElement('div');
    cell.style.cssText='position:relative;aspect-ratio:1;border-radius:10px;overflow:hidden;background:#f6f1e3;box-shadow:inset 0 0 0 2px rgba(8,22,13,.25);';
    cell.dataset.index=i;

    const res=document.createElement('div');
    res.style.cssText='position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:2px;font-family:"Bebas Neue",Impact,sans-serif;background:#fff;';
    if(data.type==='bomb'){
      res.style.background='#fff0ee';
      res.innerHTML=`<span style="font-size:26px">❌</span><span style="font-size:13px;color:#d94f3d;letter-spacing:.5px">PIERDE</span>`;
    } else if(data.type==='star'){
      res.style.background='#fff9e0';
      res.innerHTML=`<span style="font-size:26px">🐐</span><span style="font-size:13px;color:#0c2e1c;letter-spacing:.5px">+4 PTS</span>`;
    } else {
      res.innerHTML=`<span style="font-size:26px">🪙</span><span style="font-size:13px;color:#0c2e1c;letter-spacing:.5px">+1 PT</span>`;
    }
    cell.appendChild(res);

    const canvas=document.createElement('canvas');
    canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;cursor:pointer;touch-action:none;';
    cell.appendChild(canvas);
    grid.appendChild(cell);

    // Dot indicador
    const dot=document.createElement('span');
    dot.style.cssText='width:9px;height:9px;border-radius:50%;background:rgba(246,241,227,.18);display:inline-block;transition:all .25s ease;';
    dot.dataset.dotIdx=i;
    dotsRow.appendChild(dot);

    initTicketCell(cell, canvas, i);
  }

  function riskForAttempt(n){
    return [8,16,26,38,52,68,86,99][Math.min(n,7)];
  }

  function updateUI(){
    const prizeEl=$id('tPrize');
    if(prizeEl) prizeEl.innerHTML=`${totalPoints} <span style="font-size:20px;opacity:.85">PTS</span>`;
    const cashBtn=$id('tCashBtn');
    const cashAmt=$id('tCashAmt');
    const riskBtn=null; // eliminado
    const riskVal=$id('tRiskVal');
    const riskFill=$id('tRiskFill');
    if(cashAmt) cashAmt.textContent=totalPoints;
    if(cashBtn){
      if(totalPoints>0&&!gameOver){
        cashBtn.disabled=false;
        cashBtn.style.opacity='1';
        cashBtn.style.pointerEvents='auto';
      } else {
        cashBtn.disabled=true;
        cashBtn.style.opacity='.35';
        cashBtn.style.pointerEvents='none';
      }
    }
    const risk=riskForAttempt(scratchedCount);
    if(riskVal) riskVal.textContent=risk+'%';
    if(riskFill) riskFill.style.width=risk+'%';
    if(riskBtn){
      if(gameOver) riskBtn.textContent='BOLETO CERRADO';
      else if(scratchedCount>=GRID_SIZE) riskBtn.textContent='BOLETO COMPLETO';
      else if(scratchedCount===0) riskBtn.textContent='';
      else riskBtn.innerHTML=`SIGUIENTE RASCADO · <b style="color:#d94f3d">${risk}% riesgo</b>`;
    }
  }

  function initTicketCell(cell, canvas, idx){
    const dpr=window.devicePixelRatio||1;
    const rect=cell.getBoundingClientRect();
    canvas.width=Math.max(rect.width,80)*dpr;
    canvas.height=Math.max(rect.height,80)*dpr;
    canvas.style.width=(Math.max(rect.width,80))+'px';
    canvas.style.height=(Math.max(rect.height,80))+'px';
    const ctx=canvas.getContext('2d');
    ctx.scale(dpr,dpr);
    const w=canvas.width/dpr, h=canvas.height/dpr;
    // Capa metálica
    const grad=ctx.createLinearGradient(0,0,w,h);
    grad.addColorStop(0,'#e3e8ea');
    grad.addColorStop(.5,'#9aa5ab');
    grad.addColorStop(1,'#c4cbce');
    ctx.fillStyle=grad;
    ctx.fillRect(0,0,w,h);
    ctx.strokeStyle='rgba(180,190,195,.5)';
    ctx.lineWidth=2;
    for(let x=-h;x<w;x+=6){ ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+h,h);ctx.stroke(); }
    ctx.font='20px sans-serif';
    ctx.textAlign='center';
    ctx.textBaseline='middle';
    ctx.globalAlpha=.5;
    ctx.fillStyle='#333';
    ctx.fillText('⚽',w/2,h/2);
    ctx.globalAlpha=1;
    ctx.globalCompositeOperation='destination-out';

    let isScratching=false;
    let hasMoved=false;

    function scratchAt(cx,cy){
      const r=canvas.getBoundingClientRect();
      ctx.beginPath();
      ctx.arc(cx-r.left,cy-r.top,18,0,Math.PI*2);
      ctx.fill();
      // Check reveal %
      const imgData=ctx.getImageData(0,0,canvas.width,canvas.height).data;
      let cleared=0,sampled=0;
      for(let p=3;p<imgData.length;p+=160){sampled++;if(imgData[p]<80)cleared++;}
      if(cleared/sampled>0.5&&!cell.dataset.revealed) revealTicketCell(cell,idx,canvas);
    }

    canvas.addEventListener('mousedown',e=>{isScratching=true;hasMoved=false;scratchAt(e.clientX,e.clientY);e.preventDefault();});
    canvas.addEventListener('mousemove',e=>{if(!isScratching)return;hasMoved=true;scratchAt(e.clientX,e.clientY);e.preventDefault();});
    window.addEventListener('mouseup',()=>{
      if(isScratching&&!cell.dataset.revealed) revealTicketCell(cell,idx,canvas);
      isScratching=false;
    });
    canvas.addEventListener('touchstart',e=>{isScratching=true;hasMoved=false;scratchAt(e.touches[0].clientX,e.touches[0].clientY);e.preventDefault();},{passive:false});
    canvas.addEventListener('touchmove',e=>{if(!isScratching)return;hasMoved=true;scratchAt(e.touches[0].clientX,e.touches[0].clientY);e.preventDefault();},{passive:false});
    canvas.addEventListener('touchend',()=>{
      if(isScratching&&!cell.dataset.revealed) revealTicketCell(cell,idx,canvas);
      isScratching=false;
    });
  }

  function revealTicketCell(cell,idx,canvas){
    if(cell.dataset.revealed) return;
    cell.dataset.revealed='1';
    canvas.style.opacity='0';
    canvas.style.transition='opacity .35s ease';
    canvas.style.pointerEvents='none';

    const data=cellsData[idx];
    const dot=dotsRow.querySelector(`[data-dot-idx="${idx}"]`);

    scratchedCount++;
    if(data.type==='bomb'){
      if(dot){ dot.style.background='#d94f3d'; dot.style.boxShadow='0 0 6px rgba(217,79,61,.7)'; }
      playSound('scratch_bomb');
      handleTicketBomb();
    } else if(data.type==='star'){
      totalPoints+=data.value;
      if(dot){ dot.style.background='#f0c419'; dot.style.boxShadow='0 0 6px rgba(240,196,25,.6)'; }
      playSound('scratch_star');
      updateUI();
      if(scratchedCount>=GRID_SIZE) setTimeout(()=>ticketCashOut(true),500);
    } else {
      totalPoints+=data.value;
      if(dot){ dot.style.background='#f0c419'; dot.style.boxShadow='0 0 6px rgba(240,196,25,.6)'; }
      // Pitch progresivo: cada casilla buena sube el tono
      if(audioEnabled&&getAudioCtx()){
        const baseFreq=400+(scratchedCount*40);
        tone(getAudioCtx(), baseFreq, 0, 0.06, 'sine', 0.10, 0.0001);
        tone(getAudioCtx(), baseFreq*1.5, 0.04, 0.08, 'sine', 0.07, 0.0001);
      }
      updateUI();
      if(scratchedCount>=GRID_SIZE) setTimeout(()=>ticketCashOut(true),500);
    }
  }

  function handleTicketBomb(){
    gameOver=true;
    const stamp=$id('ticketStamp');
    if(stamp){stamp.textContent='PERDISTE';stamp.style.background='#d94f3d';}
    // Revelar todas las celdas restantes
    Array.from(grid.children).forEach(c=>{
      if(!c.dataset.revealed){
        c.dataset.revealed='1';
        const cv=c.querySelector('canvas');
        if(cv){cv.style.opacity='0';cv.style.pointerEvents='none';}
      }
    });
    updateUI();
    setTimeout(()=>showTicketResult(false,0),600);
  }

  window.ticketCashOut=function(auto){
    if(gameOver||totalPoints<=0) return;
    gameOver=true;
    const stamp=$id('ticketStamp');
    if(stamp){stamp.textContent='COBRADO';stamp.style.background='#3fae5c';}
    const pts=totalPoints;
    updateUI();
    showTicketResult(true,pts,auto);
  };

  function showTicketResult(win,pts,auto){
    const overlay=$id('tResultOverlay');
    if(!overlay) return;
    overlay.style.display='flex';
    // Sonido según resultado
    if(win) playSound('victory');
    else playSound('scratch_bomb');
    overlay.innerHTML=`
    <div style="background:linear-gradient(180deg,#0f3d24,#0c2e1c);border-radius:18px;padding:30px 26px;text-align:center;max-width:300px;width:90%;box-shadow:0 30px 60px -10px rgba(0,0,0,.8),0 0 0 1px rgba(240,196,25,.2);animation:popIn .3s cubic-bezier(.2,1.4,.4,1)">
      <style>@keyframes popIn{0%{transform:scale(.7);opacity:0}100%{transform:scale(1);opacity:1}}</style>
      <span style="font-size:54px;display:block;margin-bottom:10px">${win?(auto?'🏆':'💰'):'❌'}</span>
      <h2 style="font-family:'Bebas Neue',Impact,sans-serif;font-size:26px;letter-spacing:1px;color:${win?'#f0c419':'#d94f3d'};margin-bottom:6px">${win?(auto?'¡TICKET PREMIADO!':'¡TICKET PREMIADO!'):'TICKET ANULADO'}</h2>
      <p style="font-size:12px;color:rgba(246,241,227,.7);line-height:1.5;margin-bottom:12px">${win?(auto?'Rascaste todo el boleto. Premio máximo.':'¡Buena jugada! Te has retirado a tiempo'):'Has perdido los puntos acumulados en este boleto.'}</p>
      <div style="font-family:'Bebas Neue',Impact,sans-serif;font-size:34px;color:${win?'#f0c419':'#d94f3d'};margin-bottom:18px">${(win && pts>0)?'+'+pts+' PTS':win?'0 PTS':''}</div>
      <button onclick="closeTicketAndSave(${win?pts:0})" style="width:100%;border:none;border-radius:0;padding:12px;font-family:'Bebas Neue',Impact,sans-serif;font-size:15px;letter-spacing:1.5px;background:linear-gradient(180deg,#ffe27a,#f0c419 55%,#c9960c);color:#08160d;cursor:pointer;">CERRAR</button>
    </div>`;
  }

  window.closeTicketAndSave=async function(ptsEarned){
    // En cheats aún guardamos los puntos ganados realmente
    if(window._fbAuth&&window._fbAuth.currentUser){
      try{
        const user=window._fbAuth.currentUser;
        const db=window._fbDb;
        // Leer estado actual de Firestore para no perder puntos por estado desactualizado
        const snap=await db.collection('users').doc(user.uid).get();
        const currentData=snap.exists?snap.data():{};
        const currentPts=currentData.scratchPoints||0;
        const newPts=currentPts+ptsEarned;
        const newEarned=(currentData.scratchPointsEarned||0)+ptsEarned;
        // Calcular nuevo contador de tickets
        const updated=computeCurrentTickets(
          currentData.ticketCount!==undefined?currentData.ticketCount:1,
          currentData.ticketLastRegen||Date.now()
        );
        const newCount=Math.max(0,updated.count-1);
        await db.collection('users').doc(user.uid).set({
          ticketCount:newCount,
          ticketLastRegen:updated.lastChecked,
          scratchPoints:newPts,
          scratchPointsEarned:newEarned
        },{merge:true});
        const displayCount=window.CHEATS_ACTIVE?3:newCount;
        updateTicketBadge(displayCount);
        const pse=$id('pstat-scratch-pts');
        if(pse) pse.textContent=newPts;
      }catch(e){ console.warn('Error guardando boleto:',e); }
    }
    window.closeTicketOverlay();
  };
}

/* ── Inicializar boletos cuando el usuario se loguea ── */
async function initTicketSystem(user, isNewUser){
  if(!user) return;
  const db=window._fbDb;
  if(!db) return;
  const snap=await db.collection('users').doc(user.uid).get();
  const data=snap.exists?snap.data():{};

  if(isNewUser || data.ticketCount===undefined){
    await db.collection('users').doc(user.uid).set({
      ticketCount:1,
      ticketLastRegen:Date.now(),
      scratchPoints:0,
      scratchPointsEarned:0,
      scratchPointsSpent:0,
    },{merge:true});
    updateTicketBadge(1);
  } else {
    const updated=computeCurrentTickets(data.ticketCount, data.ticketLastRegen||Date.now());
    if(updated.count!==data.ticketCount||updated.lastChecked!==data.ticketLastRegen){
      await saveTicketState(updated.count, updated.lastChecked, data.scratchPoints||0);
    }
    updateTicketBadge(updated.count);
  }
}

/* ── Hook en onAuthStateChanged para inicializar boletos ── */
// Se llamará desde el listener de auth ya existente
window._initTicketSystem=initTicketSystem;
