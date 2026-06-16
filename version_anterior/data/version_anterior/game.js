

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
'ucrania':'ua'
};
for (const k in map){ if(n.includes(k)) return map[k]; }
return 'un';
}

function flagEmoji(name, size){
  const cc = flagAsset(name);
  const w = size||40;
  return `<img class="flag-emoji" src="https://flagcdn.com/w80/${cc}.png" srcset="https://flagcdn.com/w160/${cc}.png 2x" alt="${name}" title="${name}" style="width:${w}px;height:auto;display:inline-block;vertical-align:middle;border-radius:2px;box-shadow:0 0 0 1px rgba(0,0,0,.1)">`;
}

let playersDB = [{"id": "p_0_0", "name": "Iker Casillas", "positions": ["POR"], "overall": 90}, {"id": "p_0_1", "name": "Carles Puyol", "positions": ["DFC"], "overall": 88}, {"id": "p_0_2", "name": "Carlos Marchena", "positions": ["DFC"], "overall": 82}, {"id": "p_0_3", "name": "Sergio Ramos", "positions": ["DFC"], "overall": 85}, {"id": "p_0_4", "name": "Joan Capdevila", "positions": ["LI", "DFC"], "overall": 80}, {"id": "p_0_5", "name": "Álvaro Arbeloa", "positions": ["LD", "DFC"], "overall": 78}, {"id": "p_0_6", "name": "Xavi Hernández", "positions": ["MC", "DFC"], "overall": 91}, {"id": "p_0_7", "name": "Andrés Iniesta", "positions": ["MC"], "overall": 92}, {"id": "p_0_8", "name": "Marcos Senna", "positions": ["MC"], "overall": 83}, {"id": "p_0_9", "name": "Xabi Alonso", "positions": ["MC"], "overall": 87}, {"id": "p_0_10", "name": "David Silva", "positions": ["EI", "ED"], "overall": 87}, {"id": "p_0_11", "name": "David Villa", "positions": ["ED", "EI"], "overall": 90}, {"id": "p_0_12", "name": "Fernando Torres", "positions": ["DC"], "overall": 88}, {"id": "p_0_13", "name": "Daniel Güiza", "positions": ["DC"], "overall": 78}, {"id": "p_0_14", "name": "Cesc Fàbregas", "positions": ["DC", "EI"], "overall": 86}, {"id": "p_0_15", "name": "Santi Cazorla", "positions": ["DC", "ED"], "overall": 80}, {"id": "p_1_0", "name": "Iker Casillas", "positions": ["POR"], "overall": 91}, {"id": "p_1_1", "name": "Carles Puyol", "positions": ["DFC"], "overall": 87}, {"id": "p_1_2", "name": "Gerard Piqué", "positions": ["DFC"], "overall": 86}, {"id": "p_1_3", "name": "Carlos Marchena", "positions": ["DFC"], "overall": 81}, {"id": "p_1_4", "name": "Joan Capdevila", "positions": ["LI", "DFC"], "overall": 80}, {"id": "p_1_5", "name": "Sergio Ramos", "positions": ["LD", "DFC"], "overall": 86}, {"id": "p_1_6", "name": "Xavi Hernández", "positions": ["MC", "DFC"], "overall": 92}, {"id": "p_1_7", "name": "Andrés Iniesta", "positions": ["MC"], "overall": 93}, {"id": "p_1_8", "name": "Sergio Busquets", "positions": ["MC"], "overall": 83}, {"id": "p_1_9", "name": "Xabi Alonso", "positions": ["MC"], "overall": 87}, {"id": "p_1_10", "name": "Pedro Rodríguez", "positions": ["EI", "ED"], "overall": 84}, {"id": "p_1_11", "name": "David Silva", "positions": ["ED", "EI"], "overall": 87}, {"id": "p_1_12", "name": "David Villa", "positions": ["DC"], "overall": 91}, {"id": "p_1_13", "name": "Fernando Torres", "positions": ["DC"], "overall": 85}, {"id": "p_1_14", "name": "Cesc Fàbregas", "positions": ["DC", "EI"], "overall": 86}, {"id": "p_1_15", "name": "Jesús Navas", "positions": ["DC", "ED"], "overall": 78}, {"id": "p_2_0", "name": "Iker Casillas", "positions": ["POR"], "overall": 90}, {"id": "p_2_1", "name": "Gerard Piqué", "positions": ["DFC"], "overall": 87}, {"id": "p_2_2", "name": "Sergio Ramos", "positions": ["DFC"], "overall": 87}, {"id": "p_2_3", "name": "Carles Puyol", "positions": ["DFC"], "overall": 85}, {"id": "p_2_4", "name": "Jordi Alba", "positions": ["LI", "DFC"], "overall": 84}, {"id": "p_2_5", "name": "Álvaro Arbeloa", "positions": ["LD", "DFC"], "overall": 79}, {"id": "p_2_6", "name": "Xavi Hernández", "positions": ["MC", "DFC"], "overall": 91}, {"id": "p_2_7", "name": "Andrés Iniesta", "positions": ["MC"], "overall": 93}, {"id": "p_2_8", "name": "Sergio Busquets", "positions": ["MC"], "overall": 85}, {"id": "p_2_9", "name": "Xabi Alonso", "positions": ["MC"], "overall": 88}, {"id": "p_2_10", "name": "David Silva", "positions": ["EI", "ED"], "overall": 88}, {"id": "p_2_11", "name": "Jesús Navas", "positions": ["ED", "EI"], "overall": 79}, {"id": "p_2_12", "name": "Fernando Torres", "positions": ["DC"], "overall": 84}, {"id": "p_2_13", "name": "Cesc Fàbregas", "positions": ["DC"], "overall": 87}, {"id": "p_2_14", "name": "Pedro Rodríguez", "positions": ["DC", "EI"], "overall": 83}, {"id": "p_2_15", "name": "David Villa", "positions": ["DC", "ED"], "overall": 88}, {"id": "p_3_0", "name": "Félix", "positions": ["POR"], "overall": 78}, {"id": "p_3_1", "name": "Brito", "positions": ["DFC"], "overall": 80}, {"id": "p_3_2", "name": "Piazza", "positions": ["DFC"], "overall": 81}, {"id": "p_3_3", "name": "Joel Camargo", "positions": ["DFC"], "overall": 78}, {"id": "p_3_4", "name": "Everaldo", "positions": ["LI", "DFC"], "overall": 80}, {"id": "p_3_5", "name": "Carlos Alberto Torres", "positions": ["LD", "DFC"], "overall": 88}, {"id": "p_3_6", "name": "Gérson", "positions": ["MC", "DFC"], "overall": 89}, {"id": "p_3_7", "name": "Clodoaldo", "positions": ["MC"], "overall": 83}, {"id": "p_3_8", "name": "Rivelino", "positions": ["MC"], "overall": 91}, {"id": "p_3_9", "name": "Paulo César Lima", "positions": ["MC"], "overall": 82}, {"id": "p_3_10", "name": "Edu", "positions": ["EI", "ED"], "overall": 81}, {"id": "p_3_11", "name": "Jairzinho", "positions": ["ED", "EI"], "overall": 92}, {"id": "p_3_12", "name": "Pelé", "positions": ["DC"], "overall": 98}, {"id": "p_3_13", "name": "Tostão", "positions": ["DC"], "overall": 89}, {"id": "p_3_14", "name": "Roberto Miranda", "positions": ["DC", "EI"], "overall": 74}, {"id": "p_3_15", "name": "Dario", "positions": ["DC", "ED"], "overall": 75}, {"id": "p_4_0", "name": "Marcos", "positions": ["POR"], "overall": 85}, {"id": "p_4_1", "name": "Lúcio", "positions": ["DFC"], "overall": 86}, {"id": "p_4_2", "name": "Edmílson", "positions": ["DFC"], "overall": 82}, {"id": "p_4_3", "name": "Roque Júnior", "positions": ["DFC"], "overall": 78}, {"id": "p_4_4", "name": "Roberto Carlos", "positions": ["LI", "DFC"], "overall": 90}, {"id": "p_4_5", "name": "Cafu", "positions": ["LD", "DFC"], "overall": 89}, {"id": "p_4_6", "name": "Gilberto Silva", "positions": ["MC", "DFC"], "overall": 85}, {"id": "p_4_7", "name": "Kléberson", "positions": ["MC"], "overall": 80}, {"id": "p_4_8", "name": "Juninho Paulista", "positions": ["MC"], "overall": 79}, {"id": "p_4_9", "name": "Edílson", "positions": ["MC"], "overall": 76}, {"id": "p_4_10", "name": "Ronaldinho", "positions": ["EI", "ED"], "overall": 92}, {"id": "p_4_11", "name": "Rivaldo", "positions": ["ED", "EI"], "overall": 91}, {"id": "p_4_12", "name": "Ronaldo Nazário", "positions": ["DC"], "overall": 97}, {"id": "p_4_13", "name": "Edmundo", "positions": ["DC"], "overall": 78}, {"id": "p_4_14", "name": "Luizão", "positions": ["DC", "EI"], "overall": 76}, {"id": "p_4_15", "name": "Denílson", "positions": ["DC", "ED"], "overall": 79}, {"id": "p_5_0", "name": "Sepp Maier", "positions": ["POR"], "overall": 88}, {"id": "p_5_1", "name": "Franz Beckenbauer", "positions": ["DFC"], "overall": 95}, {"id": "p_5_2", "name": "Berti Vogts", "positions": ["DFC"], "overall": 83}, {"id": "p_5_3", "name": "Georg Schwarzenbeck", "positions": ["DFC"], "overall": 80}, {"id": "p_5_4", "name": "Paul Breitner", "positions": ["LI", "DFC"], "overall": 86}, {"id": "p_5_5", "name": "Rainer Bonhof", "positions": ["LD", "DFC"], "overall": 84}, {"id": "p_5_6", "name": "Wolfgang Overath", "positions": ["MC", "DFC"], "overall": 87}, {"id": "p_5_7", "name": "Uli Hoeneß", "positions": ["MC"], "overall": 84}, {"id": "p_5_8", "name": "Herbert Wimmer", "positions": ["MC"], "overall": 78}, {"id": "p_5_9", "name": "Günter Netzer", "positions": ["MC"], "overall": 86}, {"id": "p_5_10", "name": "Jürgen Grabowski", "positions": ["EI", "ED"], "overall": 82}, {"id": "p_5_11", "name": "Bernd Hölzenbein", "positions": ["ED", "EI"], "overall": 83}, {"id": "p_5_12", "name": "Gerd Müller", "positions": ["DC"], "overall": 95}, {"id": "p_5_13", "name": "Heinz Flohe", "positions": ["DC"], "overall": 76}, {"id": "p_5_14", "name": "Erwin Kremers", "positions": ["DC", "EI"], "overall": 74}, {"id": "p_5_15", "name": "Bernhard Cullmann", "positions": ["DC", "ED"], "overall": 75}, {"id": "p_6_0", "name": "Bodo Illgner", "positions": ["POR"], "overall": 84}, {"id": "p_6_1", "name": "Jürgen Kohler", "positions": ["DFC"], "overall": 86}, {"id": "p_6_2", "name": "Guido Buchwald", "positions": ["DFC"], "overall": 84}, {"id": "p_6_3", "name": "Klaus Augenthaler", "positions": ["DFC"], "overall": 82}, {"id": "p_6_4", "name": "Andreas Brehme", "positions": ["LI", "DFC"], "overall": 87}, {"id": "p_6_5", "name": "Stefan Reuter", "positions": ["LD", "DFC"], "overall": 80}, {"id": "p_6_6", "name": "Lothar Matthäus", "positions": ["MC", "DFC"], "overall": 93}, {"id": "p_6_7", "name": "Thomas Häßler", "positions": ["MC"], "overall": 85}, {"id": "p_6_8", "name": "Olaf Thon", "positions": ["MC"], "overall": 80}, {"id": "p_6_9", "name": "Pierre Littbarski", "positions": ["MC"], "overall": 81}, {"id": "p_6_10", "name": "Jürgen Klinsmann", "positions": ["EI", "ED"], "overall": 92}, {"id": "p_6_11", "name": "Rudi Völler", "positions": ["ED", "EI"], "overall": 88}, {"id": "p_6_12", "name": "Karl-Heinz Riedle", "positions": ["DC"], "overall": 78}, {"id": "p_6_13", "name": "Uwe Bein", "positions": ["DC"], "overall": 76}, {"id": "p_6_14", "name": "Frank Mill", "positions": ["DC", "EI"], "overall": 74}, {"id": "p_6_15", "name": "Thomas Berthold", "positions": ["DC", "ED"], "overall": 80}, {"id": "p_7_0", "name": "Manuel Neuer", "positions": ["POR"], "overall": 93}, {"id": "p_7_1", "name": "Mats Hummels", "positions": ["DFC"], "overall": 87}, {"id": "p_7_2", "name": "Jérôme Boateng", "positions": ["DFC"], "overall": 86}, {"id": "p_7_3", "name": "Per Mertesacker", "positions": ["DFC"], "overall": 83}, {"id": "p_7_4", "name": "Benedikt Höwedes", "positions": ["LI", "DFC"], "overall": 81}, {"id": "p_7_5", "name": "Philipp Lahm", "positions": ["LD", "DFC"], "overall": 89}, {"id": "p_7_6", "name": "Bastian Schweinsteiger", "positions": ["MC", "DFC"], "overall": 88}, {"id": "p_7_7", "name": "Toni Kroos", "positions": ["MC"], "overall": 89}, {"id": "p_7_8", "name": "Sami Khedira", "positions": ["MC"], "overall": 84}, {"id": "p_7_9", "name": "Christoph Kramer", "positions": ["MC"], "overall": 76}, {"id": "p_7_10", "name": "Mesut Özil", "positions": ["EI", "ED"], "overall": 88}, {"id": "p_7_11", "name": "Thomas Müller", "positions": ["ED", "EI"], "overall": 89}, {"id": "p_7_12", "name": "Miroslav Klose", "positions": ["DC"], "overall": 87}, {"id": "p_7_13", "name": "André Schürrle", "positions": ["DC"], "overall": 82}, {"id": "p_7_14", "name": "Mario Götze", "positions": ["DC", "EI"], "overall": 85}, {"id": "p_7_15", "name": "Lukas Podolski", "positions": ["DC", "ED"], "overall": 81}, {"id": "p_8_0", "name": "Nery Pumpido", "positions": ["POR"], "overall": 80}, {"id": "p_8_1", "name": "Oscar Ruggeri", "positions": ["DFC"], "overall": 84}, {"id": "p_8_2", "name": "José Luis Brown", "positions": ["DFC"], "overall": 81}, {"id": "p_8_3", "name": "Néstor Clausen", "positions": ["DFC"], "overall": 76}, {"id": "p_8_4", "name": "Julio Olarticoechea", "positions": ["LI", "DFC"], "overall": 79}, {"id": "p_8_5", "name": "José Luis Cuciuffo", "positions": ["LD", "DFC"], "overall": 78}, {"id": "p_8_6", "name": "Sergio Batista", "positions": ["MC", "DFC"], "overall": 80}, {"id": "p_8_7", "name": "Ricardo Giusti", "positions": ["MC"], "overall": 78}, {"id": "p_8_8", "name": "Héctor Enrique", "positions": ["MC"], "overall": 76}, {"id": "p_8_9", "name": "Jorge Burruchaga", "positions": ["MC"], "overall": 84}, {"id": "p_8_10", "name": "Jorge Valdano", "positions": ["EI", "ED"], "overall": 86}, {"id": "p_8_11", "name": "Marcelo Trobbiani", "positions": ["ED", "EI"], "overall": 73}, {"id": "p_8_12", "name": "Diego Armando Maradona", "positions": ["DC"], "overall": 98}, {"id": "p_8_13", "name": "Pedro Pasculli", "positions": ["DC"], "overall": 75}, {"id": "p_8_14", "name": "Claudio Borghi", "positions": ["DC", "EI"], "overall": 76}, {"id": "p_8_15", "name": "Ramón Díaz", "positions": ["DC", "ED"], "overall": 78}, {"id": "p_9_0", "name": "Emiliano Martínez", "positions": ["POR"], "overall": 88}, {"id": "p_9_1", "name": "Cristian Romero", "positions": ["DFC"], "overall": 85}, {"id": "p_9_2", "name": "Nicolás Otamendi", "positions": ["DFC"], "overall": 82}, {"id": "p_9_3", "name": "Lisandro Martínez", "positions": ["DFC"], "overall": 84}, {"id": "p_9_4", "name": "Nicolás Tagliafico", "positions": ["LI", "DFC"], "overall": 81}, {"id": "p_9_5", "name": "Nahuel Molina", "positions": ["LD", "DFC"], "overall": 80}, {"id": "p_9_6", "name": "Rodrigo De Paul", "positions": ["MC", "DFC"], "overall": 84}, {"id": "p_9_7", "name": "Enzo Fernández", "positions": ["MC"], "overall": 85}, {"id": "p_9_8", "name": "Alexis Mac Allister", "positions": ["MC"], "overall": 83}, {"id": "p_9_9", "name": "Leandro Paredes", "positions": ["MC"], "overall": 78}, {"id": "p_9_10", "name": "Ángel Di María", "positions": ["EI", "ED"], "overall": 86}, {"id": "p_9_11", "name": "Julián Álvarez", "positions": ["ED", "EI"], "overall": 86}, {"id": "p_9_12", "name": "Lionel Messi", "positions": ["DC"], "overall": 97}, {"id": "p_9_13", "name": "Lautaro Martínez", "positions": ["DC"], "overall": 86}, {"id": "p_9_14", "name": "Paulo Dybala", "positions": ["DC", "EI"], "overall": 82}, {"id": "p_9_15", "name": "Alejandro Gómez", "positions": ["DC", "ED"], "overall": 77}, {"id": "p_10_0", "name": "Fabien Barthez", "positions": ["POR"], "overall": 87}, {"id": "p_10_1", "name": "Laurent Blanc", "positions": ["DFC"], "overall": 86}, {"id": "p_10_2", "name": "Marcel Desailly", "positions": ["DFC"], "overall": 88}, {"id": "p_10_3", "name": "Lilian Thuram", "positions": ["DFC"], "overall": 87}, {"id": "p_10_4", "name": "Bixente Lizarazu", "positions": ["LI", "DFC"], "overall": 85}, {"id": "p_10_5", "name": "Christian Karembeu", "positions": ["LD", "DFC"], "overall": 79}, {"id": "p_10_6", "name": "Didier Deschamps", "positions": ["MC", "DFC"], "overall": 84}, {"id": "p_10_7", "name": "Emmanuel Petit", "positions": ["MC"], "overall": 85}, {"id": "p_10_8", "name": "Youri Djorkaeff", "positions": ["MC"], "overall": 86}, {"id": "p_10_9", "name": "Christophe Dugarry", "positions": ["MC"], "overall": 79}, {"id": "p_10_10", "name": "Thierry Henry", "positions": ["EI", "ED"], "overall": 88}, {"id": "p_10_11", "name": "Zinedine Zidane", "positions": ["ED", "EI"], "overall": 94}, {"id": "p_10_12", "name": "Stéphane Guivarc'h", "positions": ["DC"], "overall": 76}, {"id": "p_10_13", "name": "David Trezeguet", "positions": ["DC"], "overall": 84}, {"id": "p_10_14", "name": "Robert Pirès", "positions": ["DC", "EI"], "overall": 84}, {"id": "p_10_15", "name": "Patrick Vieira", "positions": ["DC", "ED"], "overall": 86}, {"id": "p_11_0", "name": "Hugo Lloris", "positions": ["POR"], "overall": 87}, {"id": "p_11_1", "name": "Raphaël Varane", "positions": ["DFC"], "overall": 88}, {"id": "p_11_2", "name": "Samuel Umtiti", "positions": ["DFC"], "overall": 82}, {"id": "p_11_3", "name": "Presnel Kimpembe", "positions": ["DFC"], "overall": 79}, {"id": "p_11_4", "name": "Lucas Hernández", "positions": ["LI", "DFC"], "overall": 83}, {"id": "p_11_5", "name": "Benjamin Pavard", "positions": ["LD", "DFC"], "overall": 81}, {"id": "p_11_6", "name": "N'Golo Kanté", "positions": ["MC", "DFC"], "overall": 89}, {"id": "p_11_7", "name": "Paul Pogba", "positions": ["MC"], "overall": 87}, {"id": "p_11_8", "name": "Blaise Matuidi", "positions": ["MC"], "overall": 82}, {"id": "p_11_9", "name": "Corentin Tolisso", "positions": ["MC"], "overall": 78}, {"id": "p_11_10", "name": "Kylian Mbappé", "positions": ["EI", "ED"], "overall": 91}, {"id": "p_11_11", "name": "Ousmane Dembélé", "positions": ["ED", "EI"], "overall": 81}, {"id": "p_11_12", "name": "Olivier Giroud", "positions": ["DC"], "overall": 84}, {"id": "p_11_13", "name": "Antoine Griezmann", "positions": ["DC"], "overall": 90}, {"id": "p_11_14", "name": "Steven Nzonzi", "positions": ["DC", "EI"], "overall": 80}, {"id": "p_11_15", "name": "Florian Thauvin", "positions": ["DC", "ED"], "overall": 79}, {"id": "p_12_0", "name": "Dino Zoff", "positions": ["POR"], "overall": 89}, {"id": "p_12_1", "name": "Gaetano Scirea", "positions": ["DFC"], "overall": 87}, {"id": "p_12_2", "name": "Claudio Gentile", "positions": ["DFC"], "overall": 84}, {"id": "p_12_3", "name": "Fulvio Collovati", "positions": ["DFC"], "overall": 79}, {"id": "p_12_4", "name": "Antonio Cabrini", "positions": ["LI", "DFC"], "overall": 84}, {"id": "p_12_5", "name": "Giuseppe Bergomi", "positions": ["LD", "DFC"], "overall": 81}, {"id": "p_12_6", "name": "Marco Tardelli", "positions": ["MC", "DFC"], "overall": 85}, {"id": "p_12_7", "name": "Gabriele Oriali", "positions": ["MC"], "overall": 78}, {"id": "p_12_8", "name": "Bruno Conti", "positions": ["MC"], "overall": 84}, {"id": "p_12_9", "name": "Giancarlo Antognoni", "positions": ["MC"], "overall": 84}, {"id": "p_12_10", "name": "Francesco Graziani", "positions": ["EI", "ED"], "overall": 80}, {"id": "p_12_11", "name": "Franco Causio", "positions": ["ED", "EI"], "overall": 78}, {"id": "p_12_12", "name": "Paolo Rossi", "positions": ["DC"], "overall": 89}, {"id": "p_12_13", "name": "Alessandro Altobelli", "positions": ["DC"], "overall": 82}, {"id": "p_12_14", "name": "Roberto Bettega", "positions": ["DC", "EI"], "overall": 81}, {"id": "p_12_15", "name": "Giuseppe Dossena", "positions": ["DC", "ED"], "overall": 75}, {"id": "p_13_0", "name": "Gianluigi Buffon", "positions": ["POR"], "overall": 91}, {"id": "p_13_1", "name": "Fabio Cannavaro", "positions": ["DFC"], "overall": 90}, {"id": "p_13_2", "name": "Marco Materazzi", "positions": ["DFC"], "overall": 83}, {"id": "p_13_3", "name": "Alessandro Nesta", "positions": ["DFC"], "overall": 87}, {"id": "p_13_4", "name": "Fabio Grosso", "positions": ["LI", "DFC"], "overall": 81}, {"id": "p_13_5", "name": "Gianluca Zambrotta", "positions": ["LD", "DFC"], "overall": 84}, {"id": "p_13_6", "name": "Andrea Pirlo", "positions": ["MC", "DFC"], "overall": 90}, {"id": "p_13_7", "name": "Gennaro Gattuso", "positions": ["MC"], "overall": 84}, {"id": "p_13_8", "name": "Mauro Camoranesi", "positions": ["MC"], "overall": 80}, {"id": "p_13_9", "name": "Simone Perrotta", "positions": ["MC"], "overall": 78}, {"id": "p_13_10", "name": "Francesco Totti", "positions": ["EI", "ED"], "overall": 89}, {"id": "p_13_11", "name": "Luca Toni", "positions": ["ED", "EI"], "overall": 85}, {"id": "p_13_12", "name": "Alberto Gilardino", "positions": ["DC"], "overall": 81}, {"id": "p_13_13", "name": "Alessandro Del Piero", "positions": ["DC"], "overall": 88}, {"id": "p_13_14", "name": "Vincenzo Iaquinta", "positions": ["DC", "EI"], "overall": 77}, {"id": "p_13_15", "name": "Daniele De Rossi", "positions": ["DC", "ED"], "overall": 84}, {"id": "p_14_0", "name": "Jan Jongbloed", "positions": ["POR"], "overall": 80}, {"id": "p_14_1", "name": "Ruud Krol", "positions": ["DFC"], "overall": 86}, {"id": "p_14_2", "name": "Wim Suurbier", "positions": ["DFC"], "overall": 80}, {"id": "p_14_3", "name": "Wim Rijsbergen", "positions": ["DFC"], "overall": 77}, {"id": "p_14_4", "name": "Wim Jansen", "positions": ["LI", "DFC"], "overall": 79}, {"id": "p_14_5", "name": "Arie Haan", "positions": ["LD", "DFC"], "overall": 83}, {"id": "p_14_6", "name": "Johan Neeskens", "positions": ["MC", "DFC"], "overall": 88}, {"id": "p_14_7", "name": "Wim van Hanegem", "positions": ["MC"], "overall": 85}, {"id": "p_14_8", "name": "Johan Cruyff", "positions": ["MC"], "overall": 97}, {"id": "p_14_9", "name": "Gerrie Mühren", "positions": ["MC"], "overall": 78}, {"id": "p_14_10", "name": "Rob Rensenbrink", "positions": ["EI", "ED"], "overall": 86}, {"id": "p_14_11", "name": "Piet Keizer", "positions": ["ED", "EI"], "overall": 81}, {"id": "p_14_12", "name": "Johnny Rep", "positions": ["DC"], "overall": 84}, {"id": "p_14_13", "name": "Ruud Geels", "positions": ["DC"], "overall": 78}, {"id": "p_14_14", "name": "René van de Kerkhof", "positions": ["DC", "EI"], "overall": 77}, {"id": "p_14_15", "name": "Theo de Jong", "positions": ["DC", "ED"], "overall": 75}, {"id": "p_15_0", "name": "Hans van Breukelen", "positions": ["POR"], "overall": 84}, {"id": "p_15_1", "name": "Ronald Koeman", "positions": ["DFC"], "overall": 87}, {"id": "p_15_2", "name": "Berry van Aerle", "positions": ["DFC"], "overall": 78}, {"id": "p_15_3", "name": "Adri van Tiggelen", "positions": ["DFC"], "overall": 77}, {"id": "p_15_4", "name": "Jan Wouters", "positions": ["LI", "DFC"], "overall": 80}, {"id": "p_15_5", "name": "Erwin Koeman", "positions": ["LD", "DFC"], "overall": 80}, {"id": "p_15_6", "name": "Frank Rijkaard", "positions": ["MC", "DFC"], "overall": 88}, {"id": "p_15_7", "name": "Arnold Mühren", "positions": ["MC"], "overall": 82}, {"id": "p_15_8", "name": "Gerald Vanenburg", "positions": ["MC"], "overall": 81}, {"id": "p_15_9", "name": "Aron Winter", "positions": ["MC"], "overall": 79}, {"id": "p_15_10", "name": "Wim Kieft", "positions": ["EI", "ED"], "overall": 79}, {"id": "p_15_11", "name": "John Bosman", "positions": ["ED", "EI"], "overall": 76}, {"id": "p_15_12", "name": "Marco van Basten", "positions": ["DC"], "overall": 93}, {"id": "p_15_13", "name": "Ruud Gullit", "positions": ["DC"], "overall": 92}, {"id": "p_15_14", "name": "John van't Schip", "positions": ["DC", "EI"], "overall": 76}, {"id": "p_15_15", "name": "Hans Gillhaus", "positions": ["DC", "ED"], "overall": 75}, {"id": "p_16_0", "name": "Gordon Banks", "positions": ["POR"], "overall": 88}, {"id": "p_16_1", "name": "Bobby Moore", "positions": ["DFC"], "overall": 91}, {"id": "p_16_2", "name": "Jack Charlton", "positions": ["DFC"], "overall": 84}, {"id": "p_16_3", "name": "Ray Wilson", "positions": ["DFC"], "overall": 80}, {"id": "p_16_4", "name": "George Cohen", "positions": ["LI", "DFC"], "overall": 80}, {"id": "p_16_5", "name": "Nobby Stiles", "positions": ["LD", "DFC"], "overall": 81}, {"id": "p_16_6", "name": "Bobby Charlton", "positions": ["MC", "DFC"], "overall": 92}, {"id": "p_16_7", "name": "Alan Ball", "positions": ["MC"], "overall": 85}, {"id": "p_16_8", "name": "Martin Peters", "positions": ["MC"], "overall": 84}, {"id": "p_16_9", "name": "Roger Hunt", "positions": ["MC"], "overall": 80}, {"id": "p_16_10", "name": "John Connelly", "positions": ["EI", "ED"], "overall": 76}, {"id": "p_16_11", "name": "Ian Callaghan", "positions": ["ED", "EI"], "overall": 75}, {"id": "p_16_12", "name": "Geoff Hurst", "positions": ["DC"], "overall": 90}, {"id": "p_16_13", "name": "Jimmy Greaves", "positions": ["DC"], "overall": 86}, {"id": "p_16_14", "name": "Terry Paine", "positions": ["DC", "EI"], "overall": 75}, {"id": "p_16_15", "name": "Norman Hunter", "positions": ["DC", "ED"], "overall": 78}, {"id": "p_17_0", "name": "Rui Patrício", "positions": ["POR"], "overall": 84}, {"id": "p_17_1", "name": "Pepe", "positions": ["DFC"], "overall": 84}, {"id": "p_17_2", "name": "José Fonte", "positions": ["DFC"], "overall": 81}, {"id": "p_17_3", "name": "Bruno Alves", "positions": ["DFC"], "overall": 80}, {"id": "p_17_4", "name": "Raphaël Guerreiro", "positions": ["LI", "DFC"], "overall": 81}, {"id": "p_17_5", "name": "Cédric Soares", "positions": ["LD", "DFC"], "overall": 78}, {"id": "p_17_6", "name": "William Carvalho", "positions": ["MC", "DFC"], "overall": 82}, {"id": "p_17_7", "name": "Adrien Silva", "positions": ["MC"], "overall": 79}, {"id": "p_17_8", "name": "João Moutinho", "positions": ["MC"], "overall": 83}, {"id": "p_17_9", "name": "Renato Sanches", "positions": ["MC"], "overall": 80}, {"id": "p_17_10", "name": "Nani", "positions": ["EI", "ED"], "overall": 81}, {"id": "p_17_11", "name": "Ricardo Quaresma", "positions": ["ED", "EI"], "overall": 80}, {"id": "p_17_12", "name": "Cristiano Ronaldo", "positions": ["DC"], "overall": 95}, {"id": "p_17_13", "name": "Éder", "positions": ["DC"], "overall": 76}, {"id": "p_17_14", "name": "André Silva", "positions": ["DC", "EI"], "overall": 76}, {"id": "p_17_15", "name": "João Mário", "positions": ["DC", "ED"], "overall": 78}, {"id": "p_18_0", "name": "Danijel Subašić", "positions": ["POR"], "overall": 85}, {"id": "p_18_1", "name": "Dejan Lovren", "positions": ["DFC"], "overall": 81}, {"id": "p_18_2", "name": "Domagoj Vida", "positions": ["DFC"], "overall": 80}, {"id": "p_18_3", "name": "Šime Vrsaljko", "positions": ["DFC"], "overall": 79}, {"id": "p_18_4", "name": "Ivan Strinić", "positions": ["LI", "DFC"], "overall": 77}, {"id": "p_18_5", "name": "Borna Barišić", "positions": ["LD", "DFC"], "overall": 76}, {"id": "p_18_6", "name": "Luka Modrić", "positions": ["MC", "DFC"], "overall": 93}, {"id": "p_18_7", "name": "Ivan Rakitić", "positions": ["MC"], "overall": 88}, {"id": "p_18_8", "name": "Marcelo Brozović", "positions": ["MC"], "overall": 82}, {"id": "p_18_9", "name": "Milan Badelj", "positions": ["MC"], "overall": 78}, {"id": "p_18_10", "name": "Ivan Perišić", "positions": ["EI", "ED"], "overall": 86}, {"id": "p_18_11", "name": "Ante Rebić", "positions": ["ED", "EI"], "overall": 81}, {"id": "p_18_12", "name": "Mario Mandžukić", "positions": ["DC"], "overall": 86}, {"id": "p_18_13", "name": "Andrej Kramarić", "positions": ["DC"], "overall": 81}, {"id": "p_18_14", "name": "Marko Pjaca", "positions": ["DC", "EI"], "overall": 76}, {"id": "p_18_15", "name": "Nikola Kalinić", "positions": ["DC", "ED"], "overall": 77}, {"id": "p_19_0", "name": "Roque Máspoli", "positions": ["POR"], "overall": 82}, {"id": "p_19_1", "name": "Obdulio Varela", "positions": ["DFC"], "overall": 86}, {"id": "p_19_2", "name": "Eusebio Tejera", "positions": ["DFC"], "overall": 78}, {"id": "p_19_3", "name": "Schubert Gambetta", "positions": ["DFC"], "overall": 77}, {"id": "p_19_4", "name": "Matías González", "positions": ["LI", "DFC"], "overall": 76}, {"id": "p_19_5", "name": "William Martínez", "positions": ["LD", "DFC"], "overall": 76}, {"id": "p_19_6", "name": "Víctor Rodríguez Andrade", "positions": ["MC", "DFC"], "overall": 79}, {"id": "p_19_7", "name": "Julio Pérez", "positions": ["MC"], "overall": 80}, {"id": "p_19_8", "name": "Adhemar Rodríguez", "positions": ["MC"], "overall": 75}, {"id": "p_19_9", "name": "Ernesto Vidal", "positions": ["MC"], "overall": 78}, {"id": "p_19_10", "name": "Alcides Ghiggia", "positions": ["EI", "ED"], "overall": 87}, {"id": "p_19_11", "name": "Rubén Morán", "positions": ["ED", "EI"], "overall": 78}, {"id": "p_19_12", "name": "Óscar Míguez", "positions": ["DC"], "overall": 83}, {"id": "p_19_13", "name": "Juan Alberto Schiaffino", "positions": ["DC"], "overall": 89}, {"id": "p_19_14", "name": "Javier Castro", "positions": ["DC", "EI"], "overall": 73}, {"id": "p_19_15", "name": "Eusebio Prieto", "positions": ["DC", "ED"], "overall": 73}, {"id": "p_20_0", "name": "Gyula Grosics", "positions": ["POR"], "overall": 85}, {"id": "p_20_1", "name": "Gyula Lóránt", "positions": ["DFC"], "overall": 80}, {"id": "p_20_2", "name": "Mihály Lantos", "positions": ["DFC"], "overall": 79}, {"id": "p_20_3", "name": "Jenő Buzánszky", "positions": ["DFC"], "overall": 78}, {"id": "p_20_4", "name": "Sándor Kárpáti", "positions": ["LI", "DFC"], "overall": 75}, {"id": "p_20_5", "name": "Jenő Dalnoki", "positions": ["LD", "DFC"], "overall": 74}, {"id": "p_20_6", "name": "József Bozsik", "positions": ["MC", "DFC"], "overall": 87}, {"id": "p_20_7", "name": "József Zakariás", "positions": ["MC"], "overall": 78}, {"id": "p_20_8", "name": "Nándor Hidegkuti", "positions": ["MC"], "overall": 90}, {"id": "p_20_9", "name": "László Budai", "positions": ["MC"], "overall": 80}, {"id": "p_20_10", "name": "Zoltán Czibor", "positions": ["EI", "ED"], "overall": 86}, {"id": "p_20_11", "name": "Mihály Tóth", "positions": ["ED", "EI"], "overall": 81}, {"id": "p_20_12", "name": "Ferenc Puskás", "positions": ["DC"], "overall": 96}, {"id": "p_20_13", "name": "Sándor Kocsis", "positions": ["DC"], "overall": 92}, {"id": "p_20_14", "name": "Péter Palotás", "positions": ["DC", "EI"], "overall": 74}, {"id": "p_20_15", "name": "József Tóth", "positions": ["DC", "ED"], "overall": 73}, {"id": "p_21_0", "name": "Peter Schmeichel", "positions": ["POR"], "overall": 89}, {"id": "p_21_1", "name": "Lars Olsen", "positions": ["DFC"], "overall": 82}, {"id": "p_21_2", "name": "Torben Piechnik", "positions": ["DFC"], "overall": 76}, {"id": "p_21_3", "name": "Kent Nielsen", "positions": ["DFC"], "overall": 77}, {"id": "p_21_4", "name": "Jan Heintze", "positions": ["LI", "DFC"], "overall": 79}, {"id": "p_21_5", "name": "Kim Christofte", "positions": ["LD", "DFC"], "overall": 75}, {"id": "p_21_6", "name": "John Jensen", "positions": ["MC", "DFC"], "overall": 80}, {"id": "p_21_7", "name": "Kim Vilfort", "positions": ["MC"], "overall": 83}, {"id": "p_21_8", "name": "Henrik Andersen", "positions": ["MC"], "overall": 78}, {"id": "p_21_9", "name": "Lars Elstrup", "positions": ["MC"], "overall": 76}, {"id": "p_21_10", "name": "Brian Laudrup", "positions": ["EI", "ED"], "overall": 87}, {"id": "p_21_11", "name": "Flemming Povlsen", "positions": ["ED", "EI"], "overall": 81}, {"id": "p_21_12", "name": "Henrik Larsen", "positions": ["DC"], "overall": 83}, {"id": "p_21_13", "name": "Bent Christensen", "positions": ["DC"], "overall": 76}, {"id": "p_21_14", "name": "Peter Rasmussen", "positions": ["DC", "EI"], "overall": 73}, {"id": "p_21_15", "name": "Claus Christiansen", "positions": ["DC", "ED"], "overall": 73}, {"id": "p_22_0", "name": "Thibaut Courtois", "positions": ["POR"], "overall": 89}, {"id": "p_22_1", "name": "Vincent Kompany", "positions": ["DFC"], "overall": 86}, {"id": "p_22_2", "name": "Toby Alderweireld", "positions": ["DFC"], "overall": 84}, {"id": "p_22_3", "name": "Jan Vertonghen", "positions": ["DFC"], "overall": 84}, {"id": "p_22_4", "name": "Thomas Meunier", "positions": ["LI", "DFC"], "overall": 78}, {"id": "p_22_5", "name": "Nacer Chadli", "positions": ["LD", "DFC"], "overall": 78}, {"id": "p_22_6", "name": "Axel Witsel", "positions": ["MC", "DFC"], "overall": 82}, {"id": "p_22_7", "name": "Kevin De Bruyne", "positions": ["MC"], "overall": 91}, {"id": "p_22_8", "name": "Marouane Fellaini", "positions": ["MC"], "overall": 79}, {"id": "p_22_9", "name": "Mousa Dembélé", "positions": ["MC"], "overall": 80}, {"id": "p_22_10", "name": "Eden Hazard", "positions": ["EI", "ED"], "overall": 91}, {"id": "p_22_11", "name": "Yannick Carrasco", "positions": ["ED", "EI"], "overall": 80}, {"id": "p_22_12", "name": "Romelu Lukaku", "positions": ["DC"], "overall": 87}, {"id": "p_22_13", "name": "Michy Batshuayi", "positions": ["DC"], "overall": 77}, {"id": "p_22_14", "name": "Dries Mertens", "positions": ["DC", "EI"], "overall": 82}, {"id": "p_22_15", "name": "Adnan Januzaj", "positions": ["DC", "ED"], "overall": 76}, {"id": "p_23_0", "name": "Pablo Larios", "positions": ["POR"], "overall": 78}, {"id": "p_23_1", "name": "Fernando Quirarte", "positions": ["DFC"], "overall": 79}, {"id": "p_23_2", "name": "Rafael Amador", "positions": ["DFC"], "overall": 75}, {"id": "p_23_3", "name": "Mario Villa", "positions": ["DFC"], "overall": 73}, {"id": "p_23_4", "name": "Miguel España", "positions": ["LI", "DFC"], "overall": 75}, {"id": "p_23_5", "name": "Javier López", "positions": ["LD", "DFC"], "overall": 73}, {"id": "p_23_6", "name": "Tomás Boy", "positions": ["MC", "DFC"], "overall": 80}, {"id": "p_23_7", "name": "Javier Aguirre", "positions": ["MC"], "overall": 78}, {"id": "p_23_8", "name": "Manuel Negrete", "positions": ["MC"], "overall": 81}, {"id": "p_23_9", "name": "Carlos de los Cobos", "positions": ["MC"], "overall": 74}, {"id": "p_23_10", "name": "Luis Flores", "positions": ["EI", "ED"], "overall": 76}, {"id": "p_23_11", "name": "Javier Hernández Gutiérrez", "positions": ["ED", "EI"], "overall": 74}, {"id": "p_23_12", "name": "Hugo Sánchez", "positions": ["DC"], "overall": 90}, {"id": "p_23_13", "name": "Carlos Hermosillo", "positions": ["DC"], "overall": 75}, {"id": "p_23_14", "name": "Mario Ortiz", "positions": ["DC", "EI"], "overall": 73}, {"id": "p_23_15", "name": "Sergio Lugo", "positions": ["DC", "ED"], "overall": 73}, {"id": "p_24_0", "name": "Brad Friedel", "positions": ["POR"], "overall": 82}, {"id": "p_24_1", "name": "Eddie Pope", "positions": ["DFC"], "overall": 79}, {"id": "p_24_2", "name": "Jeff Agoos", "positions": ["DFC"], "overall": 75}, {"id": "p_24_3", "name": "Gregg Berhalter", "positions": ["DFC"], "overall": 76}, {"id": "p_24_4", "name": "Tony Sanneh", "positions": ["LI", "DFC"], "overall": 75}, {"id": "p_24_5", "name": "Frankie Hejduk", "positions": ["LD", "DFC"], "overall": 76}, {"id": "p_24_6", "name": "Claudio Reyna", "positions": ["MC", "DFC"], "overall": 84}, {"id": "p_24_7", "name": "John O'Brien", "positions": ["MC"], "overall": 78}, {"id": "p_24_8", "name": "Pablo Mastroeni", "positions": ["MC"], "overall": 75}, {"id": "p_24_9", "name": "Earnie Stewart", "positions": ["MC"], "overall": 77}, {"id": "p_24_10", "name": "DaMarcus Beasley", "positions": ["EI", "ED"], "overall": 79}, {"id": "p_24_11", "name": "Landon Donovan", "positions": ["ED", "EI"], "overall": 84}, {"id": "p_24_12", "name": "Brian McBride", "positions": ["DC"], "overall": 81}, {"id": "p_24_13", "name": "Josh Wolff", "positions": ["DC"], "overall": 75}, {"id": "p_24_14", "name": "Clint Mathis", "positions": ["DC", "EI"], "overall": 77}, {"id": "p_24_15", "name": "Cobi Jones", "positions": ["DC", "ED"], "overall": 76}, {"id": "p_25_0", "name": "Yoshikatsu Kawaguchi", "positions": ["POR"], "overall": 80}, {"id": "p_25_1", "name": "Naoki Matsuda", "positions": ["DFC"], "overall": 76}, {"id": "p_25_2", "name": "Tsuneyasu Miyamoto", "positions": ["DFC"], "overall": 78}, {"id": "p_25_3", "name": "Ryuzo Morioka", "positions": ["DFC"], "overall": 75}, {"id": "p_25_4", "name": "Koji Nakata", "positions": ["LI", "DFC"], "overall": 75}, {"id": "p_25_5", "name": "Hiroaki Morishima", "positions": ["LD", "DFC"], "overall": 74}, {"id": "p_25_6", "name": "Junichi Inamoto", "positions": ["MC", "DFC"], "overall": 79}, {"id": "p_25_7", "name": "Shinji Ono", "positions": ["MC"], "overall": 81}, {"id": "p_25_8", "name": "Toshiya Fujita", "positions": ["MC"], "overall": 75}, {"id": "p_25_9", "name": "Teruyoshi Ito", "positions": ["MC"], "overall": 74}, {"id": "p_25_10", "name": "Hidetoshi Nakata", "positions": ["EI", "ED"], "overall": 86}, {"id": "p_25_11", "name": "Akinori Nishizawa", "positions": ["ED", "EI"], "overall": 76}, {"id": "p_25_12", "name": "Atsushi Yanagisawa", "positions": ["DC"], "overall": 76}, {"id": "p_25_13", "name": "Naohiro Takahara", "positions": ["DC"], "overall": 76}, {"id": "p_25_14", "name": "Masashi Nakayama", "positions": ["DC", "EI"], "overall": 78}, {"id": "p_25_15", "name": "Shoji Jo", "positions": ["DC", "ED"], "overall": 73}, {"id": "p_26_0", "name": "Lee Woon-jae", "positions": ["POR"], "overall": 81}, {"id": "p_26_1", "name": "Hong Myung-bo", "positions": ["DFC"], "overall": 84}, {"id": "p_26_2", "name": "Choi Jin-cheul", "positions": ["DFC"], "overall": 76}, {"id": "p_26_3", "name": "Kim Tae-young", "positions": ["DFC"], "overall": 76}, {"id": "p_26_4", "name": "Lee Young-pyo", "positions": ["LI", "DFC"], "overall": 80}, {"id": "p_26_5", "name": "Song Chong-gug", "positions": ["LD", "DFC"], "overall": 78}, {"id": "p_26_6", "name": "Yoo Sang-chul", "positions": ["MC", "DFC"], "overall": 81}, {"id": "p_26_7", "name": "Kim Nam-il", "positions": ["MC"], "overall": 77}, {"id": "p_26_8", "name": "Lee Chun-soo", "positions": ["MC"], "overall": 78}, {"id": "p_26_9", "name": "Park Ji-sung", "positions": ["MC"], "overall": 84}, {"id": "p_26_10", "name": "Seol Ki-hyeon", "positions": ["EI", "ED"], "overall": 79}, {"id": "p_26_11", "name": "Choi Tae-uk", "positions": ["ED", "EI"], "overall": 75}, {"id": "p_26_12", "name": "Ahn Jung-hwan", "positions": ["DC"], "overall": 82}, {"id": "p_26_13", "name": "Hwang Sun-hong", "positions": ["DC"], "overall": 78}, {"id": "p_26_14", "name": "Cha Du-ri", "positions": ["DC", "EI"], "overall": 76}, {"id": "p_26_15", "name": "Kim Do-hoon", "positions": ["DC", "ED"], "overall": 75}, {"id": "p_27_0", "name": "Yassine Bounou", "positions": ["POR"], "overall": 86}, {"id": "p_27_1", "name": "Romain Saïss", "positions": ["DFC"], "overall": 80}, {"id": "p_27_2", "name": "Nayef Aguerd", "positions": ["DFC"], "overall": 79}, {"id": "p_27_3", "name": "Achraf Dari", "positions": ["DFC"], "overall": 75}, {"id": "p_27_4", "name": "Noussair Mazraoui", "positions": ["LI", "DFC"], "overall": 80}, {"id": "p_27_5", "name": "Achraf Hakimi", "positions": ["LD", "DFC"], "overall": 86}, {"id": "p_27_6", "name": "Sofyan Amrabat", "positions": ["MC", "DFC"], "overall": 83}, {"id": "p_27_7", "name": "Azzedine Ounahi", "positions": ["MC"], "overall": 80}, {"id": "p_27_8", "name": "Selim Amallah", "positions": ["MC"], "overall": 75}, {"id": "p_27_9", "name": "Abdelhamid Sabiri", "positions": ["MC"], "overall": 76}, {"id": "p_27_10", "name": "Hakim Ziyech", "positions": ["EI", "ED"], "overall": 84}, {"id": "p_27_11", "name": "Sofiane Boufal", "positions": ["ED", "EI"], "overall": 78}, {"id": "p_27_12", "name": "Youssef En-Nesyri", "positions": ["DC"], "overall": 82}, {"id": "p_27_13", "name": "Abderrazak Hamdallah", "positions": ["DC"], "overall": 75}, {"id": "p_27_14", "name": "Walid Cheddira", "positions": ["DC", "EI"], "overall": 74}, {"id": "p_27_15", "name": "Zakaria Aboukhlal", "positions": ["DC", "ED"], "overall": 75}, {"id": "p_28_0", "name": "Peter Rufai", "positions": ["POR"], "overall": 82}, {"id": "p_28_1", "name": "Uche Okechukwu", "positions": ["DFC"], "overall": 77}, {"id": "p_28_2", "name": "Augustine Eguavoen", "positions": ["DFC"], "overall": 78}, {"id": "p_28_3", "name": "Benedict Iroha", "positions": ["DFC"], "overall": 75}, {"id": "p_28_4", "name": "Chidi Nwanu", "positions": ["LI", "DFC"], "overall": 73}, {"id": "p_28_5", "name": "Mobi Oparaku", "positions": ["LD", "DFC"], "overall": 73}, {"id": "p_28_6", "name": "Sunday Oliseh", "positions": ["MC", "DFC"], "overall": 81}, {"id": "p_28_7", "name": "Emmanuel Amunike", "positions": ["MC"], "overall": 82}, {"id": "p_28_8", "name": "Samson Siasia", "positions": ["MC"], "overall": 75}, {"id": "p_28_9", "name": "Mutiu Adepoju", "positions": ["MC"], "overall": 76}, {"id": "p_28_10", "name": "Finidi George", "positions": ["EI", "ED"], "overall": 83}, {"id": "p_28_11", "name": "Jay-Jay Okocha", "positions": ["ED", "EI"], "overall": 87}, {"id": "p_28_12", "name": "Rashidi Yekini", "positions": ["DC"], "overall": 85}, {"id": "p_28_13", "name": "Daniel Amokachi", "positions": ["DC"], "overall": 81}, {"id": "p_28_14", "name": "Victor Ikpeba", "positions": ["DC", "EI"], "overall": 79}, {"id": "p_28_15", "name": "Friday Ekpo", "positions": ["DC", "ED"], "overall": 72}, {"id": "p_29_0", "name": "Thomas N'Kono", "positions": ["POR"], "overall": 84}, {"id": "p_29_1", "name": "Stephen Tataw", "positions": ["DFC"], "overall": 78}, {"id": "p_29_2", "name": "Emmanuel Kundé", "positions": ["DFC"], "overall": 78}, {"id": "p_29_3", "name": "Benjamin Massing", "positions": ["DFC"], "overall": 75}, {"id": "p_29_4", "name": "André Kana-Biyik", "positions": ["LI", "DFC"], "overall": 76}, {"id": "p_29_5", "name": "Bertin Ebwellé", "positions": ["LD", "DFC"], "overall": 73}, {"id": "p_29_6", "name": "Cyrille Makanaky", "positions": ["MC", "DFC"], "overall": 79}, {"id": "p_29_7", "name": "Emile Mbouh", "positions": ["MC"], "overall": 75}, {"id": "p_29_8", "name": "Louis-Paul Mfedé", "positions": ["MC"], "overall": 74}, {"id": "p_29_9", "name": "Victor Ndip Akem", "positions": ["MC"], "overall": 73}, {"id": "p_29_10", "name": "François Omam-Biyik", "positions": ["EI", "ED"], "overall": 80}, {"id": "p_29_11", "name": "Jules Nyongha", "positions": ["ED", "EI"], "overall": 73}, {"id": "p_29_12", "name": "Roger Milla", "positions": ["DC"], "overall": 86}, {"id": "p_29_13", "name": "Eugène Ekéké", "positions": ["DC"], "overall": 75}, {"id": "p_29_14", "name": "Jean-Claude Pagal", "positions": ["DC", "EI"], "overall": 73}, {"id": "p_29_15", "name": "Roger Feutmba", "positions": ["DC", "ED"], "overall": 73}, {"id": "p_30_0", "name": "Misael Escuti", "positions": ["POR"], "overall": 78}, {"id": "p_30_1", "name": "Sergio Navarro", "positions": ["DFC"], "overall": 77}, {"id": "p_30_2", "name": "Eladio Rojas", "positions": ["DFC"], "overall": 78}, {"id": "p_30_3", "name": "Humberto Cruz", "positions": ["DFC"], "overall": 75}, {"id": "p_30_4", "name": "Luis Eyzaguirre", "positions": ["LI", "DFC"], "overall": 75}, {"id": "p_30_5", "name": "Hugo Berly", "positions": ["LD", "DFC"], "overall": 74}, {"id": "p_30_6", "name": "Jorge Toro", "positions": ["MC", "DFC"], "overall": 77}, {"id": "p_30_7", "name": "Raúl Sánchez", "positions": ["MC"], "overall": 77}, {"id": "p_30_8", "name": "Honorino Landa", "positions": ["MC"], "overall": 77}, {"id": "p_30_9", "name": "Alberto Fouilloux", "positions": ["MC"], "overall": 75}, {"id": "p_30_10", "name": "Jaime Ramírez", "positions": ["EI", "ED"], "overall": 76}, {"id": "p_30_11", "name": "Leonel Sánchez", "positions": ["ED", "EI"], "overall": 86}, {"id": "p_30_12", "name": "Braulio Musso", "positions": ["DC"], "overall": 76}, {"id": "p_30_13", "name": "Manuel Rodríguez", "positions": ["DC"], "overall": 75}, {"id": "p_30_14", "name": "Ramón Estay", "positions": ["DC", "EI"], "overall": 73}, {"id": "p_30_15", "name": "Mario Moreno", "positions": ["DC", "ED"], "overall": 73}, {"id": "p_31_0", "name": "Justo Villar", "positions": ["POR"], "overall": 82}, {"id": "p_31_1", "name": "Paulo da Silva", "positions": ["DFC"], "overall": 79}, {"id": "p_31_2", "name": "Antolín Alcaraz", "positions": ["DFC"], "overall": 78}, {"id": "p_31_3", "name": "Darío Verón", "positions": ["DFC"], "overall": 75}, {"id": "p_31_4", "name": "Denis Caniza", "positions": ["LI", "DFC"], "overall": 76}, {"id": "p_31_5", "name": "Claudio Morel Rodríguez", "positions": ["LD", "DFC"], "overall": 75}, {"id": "p_31_6", "name": "Víctor Cáceres", "positions": ["MC", "DFC"], "overall": 76}, {"id": "p_31_7", "name": "Cristian Riveros", "positions": ["MC"], "overall": 78}, {"id": "p_31_8", "name": "Enrique Vera", "positions": ["MC"], "overall": 76}, {"id": "p_31_9", "name": "Edgar Barreto", "positions": ["MC"], "overall": 78}, {"id": "p_31_10", "name": "Nelson Haedo Valdez", "positions": ["EI", "ED"], "overall": 78}, {"id": "p_31_11", "name": "Lucas Barrios", "positions": ["ED", "EI"], "overall": 77}, {"id": "p_31_12", "name": "Roque Santa Cruz", "positions": ["DC"], "overall": 82}, {"id": "p_31_13", "name": "Óscar Cardozo", "positions": ["DC"], "overall": 80}, {"id": "p_31_14", "name": "Edgar Benítez", "positions": ["DC", "EI"], "overall": 75}, {"id": "p_31_15", "name": "Santiago Salcedo", "positions": ["DC", "ED"], "overall": 73}, {"id": "p_32_0", "name": "David Ospina", "positions": ["POR"], "overall": 84}, {"id": "p_32_1", "name": "Mario Yepes", "positions": ["DFC"], "overall": 79}, {"id": "p_32_2", "name": "Cristián Zapata", "positions": ["DFC"], "overall": 78}, {"id": "p_32_3", "name": "Éder Álvarez Balanta", "positions": ["DFC"], "overall": 75}, {"id": "p_32_4", "name": "Pablo Armero", "positions": ["LI", "DFC"], "overall": 76}, {"id": "p_32_5", "name": "Santiago Arias", "positions": ["LD", "DFC"], "overall": 78}, {"id": "p_32_6", "name": "Carlos Sánchez", "positions": ["MC", "DFC"], "overall": 79}, {"id": "p_32_7", "name": "Abel Aguilar", "positions": ["MC"], "overall": 75}, {"id": "p_32_8", "name": "Fredy Guarín", "positions": ["MC"], "overall": 80}, {"id": "p_32_9", "name": "Juan Cuadrado", "positions": ["MC"], "overall": 82}, {"id": "p_32_10", "name": "James Rodríguez", "positions": ["EI", "ED"], "overall": 89}, {"id": "p_32_11", "name": "Juan Fernando Quintero", "positions": ["ED", "EI"], "overall": 78}, {"id": "p_32_12", "name": "Carlos Bacca", "positions": ["DC"], "overall": 81}, {"id": "p_32_13", "name": "Teófilo Gutiérrez", "positions": ["DC"], "overall": 77}, {"id": "p_32_14", "name": "Jackson Martínez", "positions": ["DC", "EI"], "overall": 80}, {"id": "p_32_15", "name": "Adrián Ramos", "positions": ["DC", "ED"], "overall": 75}, {"id": "p_33_0", "name": "Ramón Quiroga", "positions": ["POR"], "overall": 80}, {"id": "p_33_1", "name": "Héctor Chumpitaz", "positions": ["DFC"], "overall": 82}, {"id": "p_33_2", "name": "Rodulfo Manzo", "positions": ["DFC"], "overall": 76}, {"id": "p_33_3", "name": "Guillermo La Rosa", "positions": ["DFC"], "overall": 74}, {"id": "p_33_4", "name": "Rubén Toribio Díaz", "positions": ["LI", "DFC"], "overall": 75}, {"id": "p_33_5", "name": "Eloy Campos", "positions": ["LD", "DFC"], "overall": 73}, {"id": "p_33_6", "name": "César Cueto", "positions": ["MC", "DFC"], "overall": 79}, {"id": "p_33_7", "name": "José Velásquez", "positions": ["MC"], "overall": 77}, {"id": "p_33_8", "name": "Teófilo Cubillas", "positions": ["MC"], "overall": 88}, {"id": "p_33_9", "name": "Hugo Sotil", "positions": ["MC"], "overall": 80}, {"id": "p_33_10", "name": "Juan Carlos Oblitas", "positions": ["EI", "ED"], "overall": 79}, {"id": "p_33_11", "name": "Percy Rojas", "positions": ["ED", "EI"], "overall": 73}, {"id": "p_33_12", "name": "Juan José Muñante", "positions": ["DC"], "overall": 78}, {"id": "p_33_13", "name": "Franco Navarro", "positions": ["DC"], "overall": 73}, {"id": "p_33_14", "name": "Rolando Gorriti", "positions": ["DC", "EI"], "overall": 73}, {"id": "p_33_15", "name": "Roberto Rojas", "positions": ["DC", "ED"], "overall": 72}, {"id": "p_34_0", "name": "Kalle Svensson", "positions": ["POR"], "overall": 80}, {"id": "p_34_1", "name": "Orvar Bergmark", "positions": ["DFC"], "overall": 79}, {"id": "p_34_2", "name": "Sigvard Parling", "positions": ["DFC"], "overall": 76}, {"id": "p_34_3", "name": "Bengt Gustavsson", "positions": ["DFC"], "overall": 75}, {"id": "p_34_4", "name": "Sven Axbom", "positions": ["LI", "DFC"], "overall": 75}, {"id": "p_34_5", "name": "Gösta Löfgren", "positions": ["LD", "DFC"], "overall": 74}, {"id": "p_34_6", "name": "Nils Liedholm", "positions": ["MC", "DFC"], "overall": 86}, {"id": "p_34_7", "name": "Bengt Lindskog", "positions": ["MC"], "overall": 74}, {"id": "p_34_8", "name": "Gunnar Gren", "positions": ["MC"], "overall": 84}, {"id": "p_34_9", "name": "Arne Selmosson", "positions": ["MC"], "overall": 75}, {"id": "p_34_10", "name": "Lennart Skoglund", "positions": ["EI", "ED"], "overall": 84}, {"id": "p_34_11", "name": "Kurt Hamrin", "positions": ["ED", "EI"], "overall": 85}, {"id": "p_34_12", "name": "Agne Simonsson", "positions": ["DC"], "overall": 80}, {"id": "p_34_13", "name": "Bertil Berndtsson", "positions": ["DC"], "overall": 74}, {"id": "p_34_14", "name": "Hans Mild", "positions": ["DC", "EI"], "overall": 73}, {"id": "p_34_15", "name": "Gösta Sandberg", "positions": ["DC", "ED"], "overall": 72}, {"id": "p_35_0", "name": "Jan Tomaszewski", "positions": ["POR"], "overall": 84}, {"id": "p_35_1", "name": "Jerzy Gorgoń", "positions": ["DFC"], "overall": 78}, {"id": "p_35_2", "name": "Adam Musiał", "positions": ["DFC"], "overall": 77}, {"id": "p_35_3", "name": "Antoni Szymanowski", "positions": ["DFC"], "overall": 76}, {"id": "p_35_4", "name": "Władysław Żmuda", "positions": ["LI", "DFC"], "overall": 80}, {"id": "p_35_5", "name": "Zygmunt Anczok", "positions": ["LD", "DFC"], "overall": 75}, {"id": "p_35_6", "name": "Kazimierz Deyna", "positions": ["MC", "DFC"], "overall": 88}, {"id": "p_35_7", "name": "Henryk Kasperczak", "positions": ["MC"], "overall": 78}, {"id": "p_35_8", "name": "Zygmunt Maszczyk", "positions": ["MC"], "overall": 76}, {"id": "p_35_9", "name": "Grzegorz Lato", "positions": ["MC"], "overall": 86}, {"id": "p_35_10", "name": "Robert Gadocha", "positions": ["EI", "ED"], "overall": 81}, {"id": "p_35_11", "name": "Kazimierz Kmiecik", "positions": ["ED", "EI"], "overall": 76}, {"id": "p_35_12", "name": "Andrzej Szarmach", "positions": ["DC"], "overall": 85}, {"id": "p_35_13", "name": "Jan Domarski", "positions": ["DC"], "overall": 75}, {"id": "p_35_14", "name": "Marek Kusto", "positions": ["DC", "EI"], "overall": 73}, {"id": "p_35_15", "name": "Joachim Marx", "positions": ["DC", "ED"], "overall": 73}, {"id": "p_36_0", "name": "Viliam Schrojf", "positions": ["POR"], "overall": 81}, {"id": "p_36_1", "name": "Ladislav Novák", "positions": ["DFC"], "overall": 81}, {"id": "p_36_2", "name": "Jan Popluhár", "positions": ["DFC"], "overall": 79}, {"id": "p_36_3", "name": "Svatopluk Pluskal", "positions": ["DFC"], "overall": 76}, {"id": "p_36_4", "name": "František Šafránek", "positions": ["LI", "DFC"], "overall": 73}, {"id": "p_36_5", "name": "Karel Lichtnégl", "positions": ["LD", "DFC"], "overall": 73}, {"id": "p_36_6", "name": "Josef Masopust", "positions": ["MC", "DFC"], "overall": 89}, {"id": "p_36_7", "name": "Andrej Kvašňák", "positions": ["MC"], "overall": 76}, {"id": "p_36_8", "name": "Jozef Vengloš", "positions": ["MC"], "overall": 75}, {"id": "p_36_9", "name": "Adolf Scherer", "positions": ["MC"], "overall": 81}, {"id": "p_36_10", "name": "Rudolf Kučera", "positions": ["EI", "ED"], "overall": 74}, {"id": "p_36_11", "name": "Tibor Pospíchal", "positions": ["ED", "EI"], "overall": 74}, {"id": "p_36_12", "name": "Václav Mašek", "positions": ["DC"], "overall": 78}, {"id": "p_36_13", "name": "František Knebort", "positions": ["DC"], "overall": 73}, {"id": "p_36_14", "name": "Jan Brumovský", "positions": ["DC", "EI"], "overall": 72}, {"id": "p_36_15", "name": "Stefan Matlák", "positions": ["DC", "ED"], "overall": 72}, {"id": "p_37_0", "name": "Milutin Šoškić", "positions": ["POR"], "overall": 80}, {"id": "p_37_1", "name": "Novak Roganović", "positions": ["DFC"], "overall": 74}, {"id": "p_37_2", "name": "Fahrudin Jusufi", "positions": ["DFC"], "overall": 78}, {"id": "p_37_3", "name": "Ante Žanetić", "positions": ["DFC"], "overall": 75}, {"id": "p_37_4", "name": "Tomislav Knez", "positions": ["LI", "DFC"], "overall": 73}, {"id": "p_37_5", "name": "Marijan Brnčić", "positions": ["LD", "DFC"], "overall": 73}, {"id": "p_37_6", "name": "Dragoslav Šekularac", "positions": ["MC", "DFC"], "overall": 84}, {"id": "p_37_7", "name": "Vladica Popović", "positions": ["MC"], "overall": 78}, {"id": "p_37_8", "name": "Andrija Anković", "positions": ["MC"], "overall": 73}, {"id": "p_37_9", "name": "Milan Galić", "positions": ["MC"], "overall": 80}, {"id": "p_37_10", "name": "Bora Kostić", "positions": ["EI", "ED"], "overall": 78}, {"id": "p_37_11", "name": "Dražan Jerković", "positions": ["ED", "EI"], "overall": 79}, {"id": "p_37_12", "name": "Velibor Vasović", "positions": ["DC"], "overall": 76}, {"id": "p_37_13", "name": "Todor Veselinović", "positions": ["DC"], "overall": 76}, {"id": "p_37_14", "name": "Petar Radaković", "positions": ["DC", "EI"], "overall": 73}, {"id": "p_37_15", "name": "Zeljko Perušić", "positions": ["DC", "ED"], "overall": 72}, {"id": "p_38_0", "name": "Kurt Schmied", "positions": ["POR"], "overall": 80}, {"id": "p_38_1", "name": "Gerhard Hanappi", "positions": ["DFC"], "overall": 82}, {"id": "p_38_2", "name": "Ernst Happel", "positions": ["DFC"], "overall": 83}, {"id": "p_38_3", "name": "Robert Körner", "positions": ["DFC"], "overall": 75}, {"id": "p_38_4", "name": "Ernst Ocwirk", "positions": ["LI", "DFC"], "overall": 86}, {"id": "p_38_5", "name": "Karl Koller", "positions": ["LD", "DFC"], "overall": 76}, {"id": "p_38_6", "name": "Leopold Barschandt", "positions": ["MC", "DFC"], "overall": 73}, {"id": "p_38_7", "name": "Alfred Körner", "positions": ["MC"], "overall": 76}, {"id": "p_38_8", "name": "Theodor Wagner", "positions": ["MC"], "overall": 79}, {"id": "p_38_9", "name": "Erich Probst", "positions": ["MC"], "overall": 78}, {"id": "p_38_10", "name": "Karl Decker", "positions": ["EI", "ED"], "overall": 76}, {"id": "p_38_11", "name": "Hermann Stuhlfelner", "positions": ["ED", "EI"], "overall": 75}, {"id": "p_38_12", "name": "Robert Dienst", "positions": ["DC"], "overall": 78}, {"id": "p_38_13", "name": "Walter Horak", "positions": ["DC"], "overall": 75}, {"id": "p_38_14", "name": "Helmut Senekowitsch", "positions": ["DC", "EI"], "overall": 73}, {"id": "p_38_15", "name": "Adolf Knoll", "positions": ["DC", "ED"], "overall": 73}, {"id": "p_39_0", "name": "Eugène Eugster", "positions": ["POR"], "overall": 79}, {"id": "p_39_1", "name": "Roger Bocquet", "positions": ["DFC"], "overall": 78}, {"id": "p_39_2", "name": "Robert Bickel", "positions": ["DFC"], "overall": 75}, {"id": "p_39_3", "name": "André Flury", "positions": ["DFC"], "overall": 73}, {"id": "p_39_4", "name": "Werner Kernen", "positions": ["LI", "DFC"], "overall": 73}, {"id": "p_39_5", "name": "Heinz Bigler", "positions": ["LD", "DFC"], "overall": 73}, {"id": "p_39_6", "name": "Robert Ballaman", "positions": ["MC", "DFC"], "overall": 80}, {"id": "p_39_7", "name": "Eugen Meier", "positions": ["MC"], "overall": 76}, {"id": "p_39_8", "name": "Charles Antenen", "positions": ["MC"], "overall": 78}, {"id": "p_39_9", "name": "Jacques Fatton", "positions": ["MC"], "overall": 78}, {"id": "p_39_10", "name": "Josef Hügi", "positions": ["EI", "ED"], "overall": 81}, {"id": "p_39_11", "name": "Rene Bader", "positions": ["ED", "EI"], "overall": 73}, {"id": "p_39_12", "name": "Willy Steffen", "positions": ["DC"], "overall": 76}, {"id": "p_39_13", "name": "Roger Vonlanthen", "positions": ["DC"], "overall": 73}, {"id": "p_39_14", "name": "Norbert Eschmann", "positions": ["DC", "EI"], "overall": 72}, {"id": "p_39_15", "name": "Ernst Stutz", "positions": ["DC", "ED"], "overall": 72}, {"id": "p_40_0", "name": "Rüştü Reçber", "positions": ["POR"], "overall": 84}, {"id": "p_40_1", "name": "Alpay Özalan", "positions": ["DFC"], "overall": 80}, {"id": "p_40_2", "name": "Fatih Akyel", "positions": ["DFC"], "overall": 76}, {"id": "p_40_3", "name": "Bülent Korkmaz", "positions": ["DFC"], "overall": 78}, {"id": "p_40_4", "name": "Ümit Davala", "positions": ["LI", "DFC"], "overall": 78}, {"id": "p_40_5", "name": "Ogün Temizkanoğlu", "positions": ["LD", "DFC"], "overall": 73}, {"id": "p_40_6", "name": "Tugay Kerimoğlu", "positions": ["MC", "DFC"], "overall": 81}, {"id": "p_40_7", "name": "Emre Belözoğlu", "positions": ["MC"], "overall": 80}, {"id": "p_40_8", "name": "Yıldıray Baştürk", "positions": ["MC"], "overall": 77}, {"id": "p_40_9", "name": "Hasan Şaş", "positions": ["MC"], "overall": 79}, {"id": "p_40_10", "name": "İlhan Mansız", "positions": ["EI", "ED"], "overall": 78}, {"id": "p_40_11", "name": "Ümit Karan", "positions": ["ED", "EI"], "overall": 75}, {"id": "p_40_12", "name": "Hakan Şükür", "positions": ["DC"], "overall": 84}, {"id": "p_40_13", "name": "Nihat Kahveci", "positions": ["DC"], "overall": 80}, {"id": "p_40_14", "name": "Tayfun Korkut", "positions": ["DC", "EI"], "overall": 73}, {"id": "p_40_15", "name": "Tayfur Havutçu", "positions": ["DC", "ED"], "overall": 74}, {"id": "p_41_0", "name": "Antonis Nikopolidis", "positions": ["POR"], "overall": 81}, {"id": "p_41_1", "name": "Traianos Dellas", "positions": ["DFC"], "overall": 80}, {"id": "p_41_2", "name": "Michalis Kapsis", "positions": ["DFC"], "overall": 76}, {"id": "p_41_3", "name": "Takis Fyssas", "positions": ["DFC"], "overall": 76}, {"id": "p_41_4", "name": "Giourkas Seitaridis", "positions": ["LI", "DFC"], "overall": 78}, {"id": "p_41_5", "name": "Stelios Venetidis", "positions": ["LD", "DFC"], "overall": 73}, {"id": "p_41_6", "name": "Theodoros Zagorakis", "positions": ["MC", "DFC"], "overall": 82}, {"id": "p_41_7", "name": "Kostas Katsouranis", "positions": ["MC"], "overall": 78}, {"id": "p_41_8", "name": "Angelos Basinas", "positions": ["MC"], "overall": 78}, {"id": "p_41_9", "name": "Stylianos Giannakopoulos", "positions": ["MC"], "overall": 75}, {"id": "p_41_10", "name": "Vassilios Tsiartas", "positions": ["EI", "ED"], "overall": 76}, {"id": "p_41_11", "name": "Zisis Vryzas", "positions": ["ED", "EI"], "overall": 75}, {"id": "p_41_12", "name": "Angelos Charisteas", "positions": ["DC"], "overall": 81}, {"id": "p_41_13", "name": "Demis Nikolaidis", "positions": ["DC"], "overall": 77}, {"id": "p_41_14", "name": "Vassilis Lakis", "positions": ["DC", "EI"], "overall": 72}, {"id": "p_41_15", "name": "Giorgos Karagounis", "positions": ["DC", "ED"], "overall": 79}, {"id": "p_42_0", "name": "Florin Prunea", "positions": ["POR"], "overall": 79}, {"id": "p_42_1", "name": "Gheorghe Popescu", "positions": ["DFC"], "overall": 82}, {"id": "p_42_2", "name": "Miodrag Belodedici", "positions": ["DFC"], "overall": 80}, {"id": "p_42_3", "name": "Daniel Prodan", "positions": ["DFC"], "overall": 75}, {"id": "p_42_4", "name": "Dan Petrescu", "positions": ["LI", "DFC"], "overall": 80}, {"id": "p_42_5", "name": "Ioan Lupescu", "positions": ["LD", "DFC"], "overall": 78}, {"id": "p_42_6", "name": "Gheorghe Hagi", "positions": ["MC", "DFC"], "overall": 89}, {"id": "p_42_7", "name": "Cristian Dulca", "positions": ["MC"], "overall": 73}, {"id": "p_42_8", "name": "Ilie Dumitrescu", "positions": ["MC"], "overall": 80}, {"id": "p_42_9", "name": "Tibor Selymes", "positions": ["MC"], "overall": 75}, {"id": "p_42_10", "name": "Florin Răducioiu", "positions": ["EI", "ED"], "overall": 79}, {"id": "p_42_11", "name": "Adrian Ilie", "positions": ["ED", "EI"], "overall": 76}, {"id": "p_42_12", "name": "Viorel Moldovan", "positions": ["DC"], "overall": 76}, {"id": "p_42_13", "name": "Ioan Vlădoiu", "positions": ["DC"], "overall": 73}, {"id": "p_42_14", "name": "Dorinel Munteanu", "positions": ["DC", "EI"], "overall": 76}, {"id": "p_42_15", "name": "Gheorghe Craioveanu", "positions": ["DC", "ED"], "overall": 73}, {"id": "p_43_0", "name": "Packie Bonner", "positions": ["POR"], "overall": 82}, {"id": "p_43_1", "name": "Paul McGrath", "positions": ["DFC"], "overall": 85}, {"id": "p_43_2", "name": "Mick McCarthy", "positions": ["DFC"], "overall": 76}, {"id": "p_43_3", "name": "Kevin Moran", "positions": ["DFC"], "overall": 78}, {"id": "p_43_4", "name": "Chris Morris", "positions": ["LI", "DFC"], "overall": 74}, {"id": "p_43_5", "name": "Steve Staunton", "positions": ["LD", "DFC"], "overall": 77}, {"id": "p_43_6", "name": "Andy Townsend", "positions": ["MC", "DFC"], "overall": 78}, {"id": "p_43_7", "name": "Ray Houghton", "positions": ["MC"], "overall": 79}, {"id": "p_43_8", "name": "Liam Brady", "positions": ["MC"], "overall": 81}, {"id": "p_43_9", "name": "Ronnie Whelan", "positions": ["MC"], "overall": 78}, {"id": "p_43_10", "name": "John Aldridge", "positions": ["EI", "ED"], "overall": 78}, {"id": "p_43_11", "name": "Kevin Sheedy", "positions": ["ED", "EI"], "overall": 78}, {"id": "p_43_12", "name": "Niall Quinn", "positions": ["DC"], "overall": 78}, {"id": "p_43_13", "name": "Tony Cascarino", "positions": ["DC"], "overall": 76}, {"id": "p_43_14", "name": "David O'Leary", "positions": ["DC", "EI"], "overall": 77}, {"id": "p_43_15", "name": "David Kelly", "positions": ["DC", "ED"], "overall": 73}, {"id": "p_44_0", "name": "Alan Rough", "positions": ["POR"], "overall": 78}, {"id": "p_44_1", "name": "Martin Buchan", "positions": ["DFC"], "overall": 79}, {"id": "p_44_2", "name": "Tom Forsyth", "positions": ["DFC"], "overall": 75}, {"id": "p_44_3", "name": "Gordon McQueen", "positions": ["DFC"], "overall": 78}, {"id": "p_44_4", "name": "Sandy Jardine", "positions": ["LI", "DFC"], "overall": 78}, {"id": "p_44_5", "name": "Stuart Kennedy", "positions": ["LD", "DFC"], "overall": 74}, {"id": "p_44_6", "name": "Don Masson", "positions": ["MC", "DFC"], "overall": 76}, {"id": "p_44_7", "name": "Bruce Rioch", "positions": ["MC"], "overall": 77}, {"id": "p_44_8", "name": "Archie Gemmill", "positions": ["MC"], "overall": 80}, {"id": "p_44_9", "name": "Asa Hartford", "positions": ["MC"], "overall": 76}, {"id": "p_44_10", "name": "Willie Johnston", "positions": ["EI", "ED"], "overall": 76}, {"id": "p_44_11", "name": "Graeme Souness", "positions": ["ED", "EI"], "overall": 83}, {"id": "p_44_12", "name": "Kenny Dalglish", "positions": ["DC"], "overall": 87}, {"id": "p_44_13", "name": "Joe Jordan", "positions": ["DC"], "overall": 80}, {"id": "p_44_14", "name": "Derek Johnstone", "positions": ["DC", "EI"], "overall": 74}, {"id": "p_44_15", "name": "Lou Macari", "positions": ["DC", "ED"], "overall": 76}, {"id": "p_45_0", "name": "Jack Kelsey", "positions": ["POR"], "overall": 82}, {"id": "p_45_1", "name": "Stuart Williams", "positions": ["DFC"], "overall": 76}, {"id": "p_45_2", "name": "Mel Charles", "positions": ["DFC"], "overall": 79}, {"id": "p_45_3", "name": "Mel Hopkins", "positions": ["DFC"], "overall": 75}, {"id": "p_45_4", "name": "Alf Sherwood", "positions": ["LI", "DFC"], "overall": 76}, {"id": "p_45_5", "name": "Graham Williams", "positions": ["LD", "DFC"], "overall": 73}, {"id": "p_45_6", "name": "Dave Bowen", "positions": ["MC", "DFC"], "overall": 76}, {"id": "p_45_7", "name": "Derek Tapscott", "positions": ["MC"], "overall": 73}, {"id": "p_45_8", "name": "Ivor Allchurch", "positions": ["MC"], "overall": 82}, {"id": "p_45_9", "name": "Cliff Jones", "positions": ["MC"], "overall": 79}, {"id": "p_45_10", "name": "Colin Webster", "positions": ["EI", "ED"], "overall": 74}, {"id": "p_45_11", "name": "Terry Medwin", "positions": ["ED", "EI"], "overall": 76}, {"id": "p_45_12", "name": "John Charles", "positions": ["DC"], "overall": 89}, {"id": "p_45_13", "name": "Len Allchurch", "positions": ["DC"], "overall": 75}, {"id": "p_45_14", "name": "Roy Vernon", "positions": ["DC", "EI"], "overall": 75}, {"id": "p_45_15", "name": "Ron Hewitt", "positions": ["DC", "ED"], "overall": 73}, {"id": "p_46_0", "name": "Igor Akinfeev", "positions": ["POR"], "overall": 83}, {"id": "p_46_1", "name": "Sergei Ignashevich", "positions": ["DFC"], "overall": 78}, {"id": "p_46_2", "name": "Ilya Kutepov", "positions": ["DFC"], "overall": 74}, {"id": "p_46_3", "name": "Andrei Semyonov", "positions": ["DFC"], "overall": 73}, {"id": "p_46_4", "name": "Yuri Zhirkov", "positions": ["LI", "DFC"], "overall": 78}, {"id": "p_46_5", "name": "Mário Fernandes", "positions": ["LD", "DFC"], "overall": 76}, {"id": "p_46_6", "name": "Roman Zobnin", "positions": ["MC", "DFC"], "overall": 77}, {"id": "p_46_7", "name": "Alan Dzagoev", "positions": ["MC"], "overall": 76}, {"id": "p_46_8", "name": "Aleksandr Golovin", "positions": ["MC"], "overall": 81}, {"id": "p_46_9", "name": "Daler Kuzyaev", "positions": ["MC"], "overall": 75}, {"id": "p_46_10", "name": "Denis Cheryshev", "positions": ["EI", "ED"], "overall": 79}, {"id": "p_46_11", "name": "Aleksandr Samedov", "positions": ["ED", "EI"], "overall": 74}, {"id": "p_46_12", "name": "Artem Dzyuba", "positions": ["DC"], "overall": 79}, {"id": "p_46_13", "name": "Fedor Smolov", "positions": ["DC"], "overall": 76}, {"id": "p_46_14", "name": "Anton Miranchuk", "positions": ["DC", "EI"], "overall": 74}, {"id": "p_46_15", "name": "Yuri Gazinsky", "positions": ["DC", "ED"], "overall": 72}, {"id": "p_47_0", "name": "Oleksandr Shovkovskiy", "positions": ["POR"], "overall": 81}, {"id": "p_47_1", "name": "Vyacheslav Sviderskyi", "positions": ["DFC"], "overall": 75}, {"id": "p_47_2", "name": "Andriy Nesmachniy", "positions": ["DFC"], "overall": 75}, {"id": "p_47_3", "name": "Vladislav Vashchuk", "positions": ["DFC"], "overall": 76}, {"id": "p_47_4", "name": "Andriy Husin", "positions": ["LI", "DFC"], "overall": 75}, {"id": "p_47_5", "name": "Bohdan Shust", "positions": ["LD", "DFC"], "overall": 72}, {"id": "p_47_6", "name": "Anatoliy Tymoshchuk", "positions": ["MC", "DFC"], "overall": 84}, {"id": "p_47_7", "name": "Oleh Husyev", "positions": ["MC"], "overall": 76}, {"id": "p_47_8", "name": "Ruslan Rotan", "positions": ["MC"], "overall": 75}, {"id": "p_47_9", "name": "Serhiy Rebrov", "positions": ["MC"], "overall": 80}, {"id": "p_47_10", "name": "Andriy Voronin", "positions": ["EI", "ED"], "overall": 79}, {"id": "p_47_11", "name": "Maksym Kalynychenko", "positions": ["ED", "EI"], "overall": 76}, {"id": "p_47_12", "name": "Andriy Shevchenko", "positions": ["DC"], "overall": 88}, {"id": "p_47_13", "name": "Artem Milevskyi", "positions": ["DC"], "overall": 75}, {"id": "p_47_14", "name": "Andriy Vorobei", "positions": ["DC", "EI"], "overall": 73}, {"id": "p_47_15", "name": "Yevhen Levchenko", "positions": ["DC", "ED"], "overall": 72}, {"id": "p_48_0", "name": "Vladimir Stojković", "positions": ["POR"], "overall": 78}, {"id": "p_48_1", "name": "Nemanja Vidić", "positions": ["DFC"], "overall": 87}, {"id": "p_48_2", "name": "Branislav Ivanović", "positions": ["DFC"], "overall": 84}, {"id": "p_48_3", "name": "Aleksandar Luković", "positions": ["DFC"], "overall": 75}, {"id": "p_48_4", "name": "Neven Subotić", "positions": ["LI", "DFC"], "overall": 78}, {"id": "p_48_5", "name": "Ivan Obradović", "positions": ["LD", "DFC"], "overall": 73}, {"id": "p_48_6", "name": "Dejan Stanković", "positions": ["MC", "DFC"], "overall": 82}, {"id": "p_48_7", "name": "Zdravko Kuzmanović", "positions": ["MC"], "overall": 75}, {"id": "p_48_8", "name": "Miloš Krasić", "positions": ["MC"], "overall": 79}, {"id": "p_48_9", "name": "Gojko Kačar", "positions": ["MC"], "overall": 73}, {"id": "p_48_10", "name": "Milan Jovanović", "positions": ["EI", "ED"], "overall": 78}, {"id": "p_48_11", "name": "Zoran Tošić", "positions": ["ED", "EI"], "overall": 76}, {"id": "p_48_12", "name": "Marko Pantelić", "positions": ["DC"], "overall": 76}, {"id": "p_48_13", "name": "Nikola Žigić", "positions": ["DC"], "overall": 78}, {"id": "p_48_14", "name": "Danko Lazović", "positions": ["DC", "EI"], "overall": 75}, {"id": "p_48_15", "name": "Milan Smiljanić", "positions": ["DC", "ED"], "overall": 72}, {"id": "p_49_0", "name": "Frode Grodås", "positions": ["POR"], "overall": 78}, {"id": "p_49_1", "name": "Ronny Johnsen", "positions": ["DFC"], "overall": 81}, {"id": "p_49_2", "name": "Henning Berg", "positions": ["DFC"], "overall": 80}, {"id": "p_49_3", "name": "Dan Eggen", "positions": ["DFC"], "overall": 73}, {"id": "p_49_4", "name": "Erland Johnsen", "positions": ["LI", "DFC"], "overall": 75}, {"id": "p_49_5", "name": "Gunnar Halle", "positions": ["LD", "DFC"], "overall": 74}, {"id": "p_49_6", "name": "Stig Inge Bjørnebye", "positions": ["MC", "DFC"], "overall": 76}, {"id": "p_49_7", "name": "Kjetil Rekdal", "positions": ["MC"], "overall": 76}, {"id": "p_49_8", "name": "Erik Mykland", "positions": ["MC"], "overall": 74}, {"id": "p_49_9", "name": "Øyvind Leonhardsen", "positions": ["MC"], "overall": 76}, {"id": "p_49_10", "name": "Jostein Flo", "positions": ["EI", "ED"], "overall": 75}, {"id": "p_49_11", "name": "Steffen Iversen", "positions": ["ED", "EI"], "overall": 76}, {"id": "p_49_12", "name": "Tore André Flo", "positions": ["DC"], "overall": 81}, {"id": "p_49_13", "name": "Ole Gunnar Solskjær", "positions": ["DC"], "overall": 82}, {"id": "p_49_14", "name": "Egil Østenstad", "positions": ["DC", "EI"], "overall": 73}, {"id": "p_49_15", "name": "Håvard Flo", "positions": ["DC", "ED"], "overall": 72}, {"id": "p_50_0", "name": "Iribar", "positions": ["POR"], "overall": 82}, {"id": "p_50_1", "name": "Rivilla", "positions": ["DFC"], "overall": 79}, {"id": "p_50_2", "name": "Calleja", "positions": ["DFC"], "overall": 78}, {"id": "p_50_3", "name": "Olivella", "positions": ["DFC"], "overall": 80}, {"id": "p_50_4", "name": "Reija", "positions": ["LI", "DFC"], "overall": 76}, {"id": "p_50_5", "name": "Fusté", "positions": ["LD", "DFC"], "overall": 79}, {"id": "p_50_6", "name": "Amancio", "positions": ["MC", "DFC"], "overall": 85}, {"id": "p_50_7", "name": "Zoco", "positions": ["MC"], "overall": 77}, {"id": "p_50_8", "name": "Marcelino", "positions": ["MC"], "overall": 83}, {"id": "p_50_9", "name": "Gento", "positions": ["MC"], "overall": 88}, {"id": "p_50_10", "name": "Ufarte", "positions": ["EI", "ED"], "overall": 76}, {"id": "p_50_11", "name": "Collar", "positions": ["ED", "EI"], "overall": 78}, {"id": "p_50_12", "name": "Adelardo", "positions": ["DC"], "overall": 78}, {"id": "p_50_13", "name": "Zaballa", "positions": ["DC"], "overall": 75}, {"id": "p_50_14", "name": "Grosso", "positions": ["DC", "EI"], "overall": 76}, {"id": "p_50_15", "name": "Paquito", "positions": ["DC", "ED"], "overall": 73}, {"id": "p_51_0", "name": "Unai Simón", "positions": ["POR"], "overall": 84}, {"id": "p_51_1", "name": "Diego Llorente", "positions": ["DFC"], "overall": 79}, {"id": "p_51_2", "name": "Pau Torres", "positions": ["DFC"], "overall": 82}, {"id": "p_51_3", "name": "Aymeric Laporte", "positions": ["DFC"], "overall": 83}, {"id": "p_51_4", "name": "José Gayà", "positions": ["LI", "DFC"], "overall": 80}, {"id": "p_51_5", "name": "Marcos Llorente", "positions": ["LD", "DFC"], "overall": 82}, {"id": "p_51_6", "name": "Sergio Busquets", "positions": ["MC", "DFC"], "overall": 85}, {"id": "p_51_7", "name": "Koke", "positions": ["MC"], "overall": 81}, {"id": "p_51_8", "name": "Dani Olmo", "positions": ["MC"], "overall": 84}, {"id": "p_51_9", "name": "Pedri", "positions": ["MC"], "overall": 87}, {"id": "p_51_10", "name": "Ferran Torres", "positions": ["EI", "ED"], "overall": 83}, {"id": "p_51_11", "name": "Álvaro Morata", "positions": ["ED", "EI"], "overall": 81}, {"id": "p_51_12", "name": "Gerard Moreno", "positions": ["DC"], "overall": 84}, {"id": "p_51_13", "name": "Mikel Oyarzabal", "positions": ["DC"], "overall": 82}, {"id": "p_51_14", "name": "Eric García", "positions": ["DC", "EI"], "overall": 78}, {"id": "p_51_15", "name": "Thiago Alcántara", "positions": ["DC", "ED"], "overall": 85}, {"id": "p_52_0", "name": "Ramallets", "positions": ["POR"], "overall": 80}, {"id": "p_52_1", "name": "Asensi", "positions": ["DFC"], "overall": 76}, {"id": "p_52_2", "name": "Gonzalvo III", "positions": ["DFC"], "overall": 78}, {"id": "p_52_3", "name": "Puchades", "positions": ["DFC"], "overall": 75}, {"id": "p_52_4", "name": "Gonzalvo II", "positions": ["LI", "DFC"], "overall": 74}, {"id": "p_52_5", "name": "Silva", "positions": ["LD", "DFC"], "overall": 73}, {"id": "p_52_6", "name": "Basora", "positions": ["MC", "DFC"], "overall": 82}, {"id": "p_52_7", "name": "Igoa", "positions": ["MC"], "overall": 76}, {"id": "p_52_8", "name": "Zarra", "positions": ["MC"], "overall": 87}, {"id": "p_52_9", "name": "Molowny", "positions": ["MC"], "overall": 79}, {"id": "p_52_10", "name": "Gainza", "positions": ["EI", "ED"], "overall": 81}, {"id": "p_52_11", "name": "Panizo", "positions": ["ED", "EI"], "overall": 76}, {"id": "p_52_12", "name": "César", "positions": ["DC"], "overall": 79}, {"id": "p_52_13", "name": "Juncosa", "positions": ["DC"], "overall": 75}, {"id": "p_52_14", "name": "Manchón", "positions": ["DC", "EI"], "overall": 74}, {"id": "p_52_15", "name": "Epi", "positions": ["DC", "ED"], "overall": 73}, {"id": "p_53_0", "name": "Gilmar", "positions": ["POR"], "overall": 84}, {"id": "p_53_1", "name": "D. Santos", "positions": ["DFC"], "overall": 78}, {"id": "p_53_2", "name": "Bellini", "positions": ["DFC"], "overall": 80}, {"id": "p_53_3", "name": "Orlando", "positions": ["DFC"], "overall": 77}, {"id": "p_53_4", "name": "N. Santos", "positions": ["LI", "DFC"], "overall": 82}, {"id": "p_53_5", "name": "Zito", "positions": ["LD", "DFC"], "overall": 80}, {"id": "p_53_6", "name": "Didi", "positions": ["MC", "DFC"], "overall": 89}, {"id": "p_53_7", "name": "Garrincha", "positions": ["MC"], "overall": 95}, {"id": "p_53_8", "name": "Vavá", "positions": ["MC"], "overall": 85}, {"id": "p_53_9", "name": "Pelé", "positions": ["MC"], "overall": 96}, {"id": "p_53_10", "name": "Zagallo", "positions": ["EI", "ED"], "overall": 81}, {"id": "p_53_11", "name": "Julinho", "positions": ["ED", "EI"], "overall": 79}, {"id": "p_53_12", "name": "Mazzola", "positions": ["DC"], "overall": 79}, {"id": "p_53_13", "name": "Altafini", "positions": ["DC"], "overall": 83}, {"id": "p_53_14", "name": "Pepe", "positions": ["DC", "EI"], "overall": 80}, {"id": "p_53_15", "name": "Canhoteiro", "positions": ["DC", "ED"], "overall": 77}, {"id": "p_54_0", "name": "Taffarel", "positions": ["POR"], "overall": 86}, {"id": "p_54_1", "name": "Aldair", "positions": ["DFC"], "overall": 83}, {"id": "p_54_2", "name": "Marcio Santos", "positions": ["DFC"], "overall": 80}, {"id": "p_54_3", "name": "Mazinho", "positions": ["DFC"], "overall": 78}, {"id": "p_54_4", "name": "Branco", "positions": ["LI", "DFC"], "overall": 79}, {"id": "p_54_5", "name": "Leonardo", "positions": ["LD", "DFC"], "overall": 82}, {"id": "p_54_6", "name": "Mauro Silva", "positions": ["MC", "DFC"], "overall": 79}, {"id": "p_54_7", "name": "Zinho", "positions": ["MC"], "overall": 84}, {"id": "p_54_8", "name": "Romário", "positions": ["MC"], "overall": 94}, {"id": "p_54_9", "name": "Bebeto", "positions": ["MC"], "overall": 90}, {"id": "p_54_10", "name": "Rai", "positions": ["EI", "ED"], "overall": 82}, {"id": "p_54_11", "name": "Cafu", "positions": ["ED", "EI"], "overall": 85}, {"id": "p_54_12", "name": "Viola", "positions": ["DC"], "overall": 76}, {"id": "p_54_13", "name": "Müller", "positions": ["DC"], "overall": 78}, {"id": "p_54_14", "name": "Tita", "positions": ["DC", "EI"], "overall": 73}, {"id": "p_54_15", "name": "Bismarck", "positions": ["DC", "ED"], "overall": 74}, {"id": "p_55_0", "name": "Fillol", "positions": ["POR"], "overall": 83}, {"id": "p_55_1", "name": "Olguin", "positions": ["DFC"], "overall": 79}, {"id": "p_55_2", "name": "Galvan", "positions": ["DFC"], "overall": 78}, {"id": "p_55_3", "name": "Passarella", "positions": ["DFC"], "overall": 87}, {"id": "p_55_4", "name": "Tarantini", "positions": ["LI", "DFC"], "overall": 77}, {"id": "p_55_5", "name": "Ardiles", "positions": ["LD", "DFC"], "overall": 86}, {"id": "p_55_6", "name": "Gallego", "positions": ["MC", "DFC"], "overall": 79}, {"id": "p_55_7", "name": "Valencia", "positions": ["MC"], "overall": 75}, {"id": "p_55_8", "name": "Bertoni", "positions": ["MC"], "overall": 81}, {"id": "p_55_9", "name": "Luque", "positions": ["MC"], "overall": 83}, {"id": "p_55_10", "name": "Kempes", "positions": ["EI", "ED"], "overall": 90}, {"id": "p_55_11", "name": "Houseman", "positions": ["ED", "EI"], "overall": 82}, {"id": "p_55_12", "name": "Larrosa", "positions": ["DC"], "overall": 76}, {"id": "p_55_13", "name": "Ortiz", "positions": ["DC"], "overall": 75}, {"id": "p_55_14", "name": "Alonso", "positions": ["DC", "EI"], "overall": 78}, {"id": "p_55_15", "name": "Quiroga", "positions": ["DC", "ED"], "overall": 74}, {"id": "p_56_0", "name": "Oliver Kahn", "positions": ["POR"], "overall": 91}, {"id": "p_56_1", "name": "Christoph Metzelder", "positions": ["DFC"], "overall": 78}, {"id": "p_56_2", "name": "Gerald Asamoah", "positions": ["DFC"], "overall": 76}, {"id": "p_56_3", "name": "Torsten Frings", "positions": ["DFC"], "overall": 82}, {"id": "p_56_4", "name": "Stefan Effenberg", "positions": ["LI", "DFC"], "overall": 83}, {"id": "p_56_5", "name": "Carsten Ramelow", "positions": ["LD", "DFC"], "overall": 79}, {"id": "p_56_6", "name": "Michael Ballack", "positions": ["MC", "DFC"], "overall": 90}, {"id": "p_56_7", "name": "Bernd Schneider", "positions": ["MC"], "overall": 80}, {"id": "p_56_8", "name": "Oliver Neuville", "positions": ["MC"], "overall": 78}, {"id": "p_56_9", "name": "Miroslav Klose", "positions": ["MC"], "overall": 83}, {"id": "p_56_10", "name": "Marco Bode", "positions": ["EI", "ED"], "overall": 77}, {"id": "p_56_11", "name": "Jens Jeremies", "positions": ["ED", "EI"], "overall": 79}, {"id": "p_56_12", "name": "Marko Rehmer", "positions": ["DC"], "overall": 75}, {"id": "p_56_13", "name": "Christian Ziege", "positions": ["DC"], "overall": 78}, {"id": "p_56_14", "name": "Marcus Babbel", "positions": ["DC", "EI"], "overall": 77}, {"id": "p_56_15", "name": "Jörg Böhme", "positions": ["DC", "ED"], "overall": 74}, {"id": "p_57_0", "name": "Hugo Lloris", "positions": ["POR"], "overall": 86}, {"id": "p_57_1", "name": "Benjamin Pavard", "positions": ["DFC"], "overall": 80}, {"id": "p_57_2", "name": "Raphaël Varane", "positions": ["DFC"], "overall": 88}, {"id": "p_57_3", "name": "Presnel Kimpembe", "positions": ["DFC"], "overall": 79}, {"id": "p_57_4", "name": "Lucas Hernández", "positions": ["LI", "DFC"], "overall": 82}, {"id": "p_57_5", "name": "Adrien Rabiot", "positions": ["LD", "DFC"], "overall": 80}, {"id": "p_57_6", "name": "N'Golo Kanté", "positions": ["MC", "DFC"], "overall": 89}, {"id": "p_57_7", "name": "Paul Pogba", "positions": ["MC"], "overall": 85}, {"id": "p_57_8", "name": "Kylian Mbappé", "positions": ["MC"], "overall": 92}, {"id": "p_57_9", "name": "Karim Benzema", "positions": ["MC"], "overall": 91}, {"id": "p_57_10", "name": "Antoine Griezmann", "positions": ["EI", "ED"], "overall": 87}, {"id": "p_57_11", "name": "Ousmane Dembélé", "positions": ["ED", "EI"], "overall": 82}, {"id": "p_57_12", "name": "Kingsley Coman", "positions": ["DC"], "overall": 82}, {"id": "p_57_13", "name": "Olivier Giroud", "positions": ["DC"], "overall": 81}, {"id": "p_57_14", "name": "Wissam Ben Yedder", "positions": ["DC", "EI"], "overall": 79}, {"id": "p_57_15", "name": "Corentin Tolisso", "positions": ["DC", "ED"], "overall": 78}, {"id": "p_58_0", "name": "Maarten Stekelenburg", "positions": ["POR"], "overall": 82}, {"id": "p_58_1", "name": "Gregory van der Wiel", "positions": ["DFC"], "overall": 79}, {"id": "p_58_2", "name": "John Heitinga", "positions": ["DFC"], "overall": 80}, {"id": "p_58_3", "name": "Joris Mathijsen", "positions": ["DFC"], "overall": 78}, {"id": "p_58_4", "name": "Giovanni van Bronckhorst", "positions": ["LI", "DFC"], "overall": 83}, {"id": "p_58_5", "name": "Mark van Bommel", "positions": ["LD", "DFC"], "overall": 82}, {"id": "p_58_6", "name": "Nigel de Jong", "positions": ["MC", "DFC"], "overall": 80}, {"id": "p_58_7", "name": "Wesley Sneijder", "positions": ["MC"], "overall": 88}, {"id": "p_58_8", "name": "Dirk Kuyt", "positions": ["MC"], "overall": 82}, {"id": "p_58_9", "name": "Arjen Robben", "positions": ["MC"], "overall": 90}, {"id": "p_58_10", "name": "Robin van Persie", "positions": ["EI", "ED"], "overall": 89}, {"id": "p_58_11", "name": "Ibrahim Afellay", "positions": ["ED", "EI"], "overall": 77}, {"id": "p_58_12", "name": "Rafael van der Vaart", "positions": ["DC"], "overall": 83}, {"id": "p_58_13", "name": "Klaas-Jan Huntelaar", "positions": ["DC"], "overall": 83}, {"id": "p_58_14", "name": "Eljero Elia", "positions": ["DC", "EI"], "overall": 77}, {"id": "p_58_15", "name": "André Ooijer", "positions": ["DC", "ED"], "overall": 75}, {"id": "p_59_0", "name": "Diogo Costa", "positions": ["POR"], "overall": 83}, {"id": "p_59_1", "name": "João Cancelo", "positions": ["DFC"], "overall": 85}, {"id": "p_59_2", "name": "Pepe", "positions": ["DFC"], "overall": 80}, {"id": "p_59_3", "name": "Rúben Dias", "positions": ["DFC"], "overall": 88}, {"id": "p_59_4", "name": "Nuno Mendes", "positions": ["LI", "DFC"], "overall": 82}, {"id": "p_59_5", "name": "Bernardo Silva", "positions": ["LD", "DFC"], "overall": 89}, {"id": "p_59_6", "name": "Rúben Neves", "positions": ["MC", "DFC"], "overall": 83}, {"id": "p_59_7", "name": "Vitinha", "positions": ["MC"], "overall": 82}, {"id": "p_59_8", "name": "Bruno Fernandes", "positions": ["MC"], "overall": 88}, {"id": "p_59_9", "name": "Cristiano Ronaldo", "positions": ["MC"], "overall": 91}, {"id": "p_59_10", "name": "Rafael Leão", "positions": ["EI", "ED"], "overall": 86}, {"id": "p_59_11", "name": "João Félix", "positions": ["ED", "EI"], "overall": 84}, {"id": "p_59_12", "name": "Gonçalo Ramos", "positions": ["DC"], "overall": 83}, {"id": "p_59_13", "name": "André Silva", "positions": ["DC"], "overall": 77}, {"id": "p_59_14", "name": "William Carvalho", "positions": ["DC", "EI"], "overall": 80}, {"id": "p_59_15", "name": "Matheus Nunes", "positions": ["DC", "ED"], "overall": 79}, {"id": "p_60_0", "name": "Albertosi", "positions": ["POR"], "overall": 82}, {"id": "p_60_1", "name": "Burgnich", "positions": ["DFC"], "overall": 82}, {"id": "p_60_2", "name": "Cera", "positions": ["DFC"], "overall": 79}, {"id": "p_60_3", "name": "Rosato", "positions": ["DFC"], "overall": 77}, {"id": "p_60_4", "name": "Facchetti", "positions": ["LI", "DFC"], "overall": 87}, {"id": "p_60_5", "name": "Bertini", "positions": ["LD", "DFC"], "overall": 78}, {"id": "p_60_6", "name": "Mazzola", "positions": ["MC", "DFC"], "overall": 86}, {"id": "p_60_7", "name": "De Sisti", "positions": ["MC"], "overall": 79}, {"id": "p_60_8", "name": "Domenghini", "positions": ["MC"], "overall": 80}, {"id": "p_60_9", "name": "Rivera", "positions": ["MC"], "overall": 89}, {"id": "p_60_10", "name": "Riva", "positions": ["EI", "ED"], "overall": 90}, {"id": "p_60_11", "name": "Boninsegna", "positions": ["ED", "EI"], "overall": 82}, {"id": "p_60_12", "name": "Anastasi", "positions": ["DC"], "overall": 80}, {"id": "p_60_13", "name": "Juliano", "positions": ["DC"], "overall": 76}, {"id": "p_60_14", "name": "Gori", "positions": ["DC", "EI"], "overall": 74}, {"id": "p_60_15", "name": "Bercellino", "positions": ["DC", "ED"], "overall": 73}, {"id": "p_61_0", "name": "Olivieri", "positions": ["POR"], "overall": 80}, {"id": "p_61_1", "name": "Foni", "positions": ["DFC"], "overall": 78}, {"id": "p_61_2", "name": "Rava", "positions": ["DFC"], "overall": 80}, {"id": "p_61_3", "name": "Andreolo", "positions": ["DFC"], "overall": 78}, {"id": "p_61_4", "name": "Locatelli", "positions": ["LI", "DFC"], "overall": 76}, {"id": "p_61_5", "name": "Serantoni", "positions": ["LD", "DFC"], "overall": 75}, {"id": "p_61_6", "name": "Biavati", "positions": ["MC", "DFC"], "overall": 81}, {"id": "p_61_7", "name": "Meazza", "positions": ["MC"], "overall": 91}, {"id": "p_61_8", "name": "Piola", "positions": ["MC"], "overall": 88}, {"id": "p_61_9", "name": "Ferraris II", "positions": ["MC"], "overall": 77}, {"id": "p_61_10", "name": "Colaussi", "positions": ["EI", "ED"], "overall": 82}, {"id": "p_61_11", "name": "Pasinati", "positions": ["ED", "EI"], "overall": 75}, {"id": "p_61_12", "name": "Amadei", "positions": ["DC"], "overall": 79}, {"id": "p_61_13", "name": "Ferrari", "positions": ["DC"], "overall": 76}, {"id": "p_61_14", "name": "Genta", "positions": ["DC", "EI"], "overall": 74}, {"id": "p_61_15", "name": "Boffi", "positions": ["DC", "ED"], "overall": 78}];
let rawTeams = [{"id": "team_0", "name": "España 2008", "style": "tiki_taka", "players": ["p_0_0", "p_0_1", "p_0_2", "p_0_3", "p_0_4", "p_0_5", "p_0_6", "p_0_7", "p_0_8", "p_0_9", "p_0_10", "p_0_11", "p_0_12", "p_0_13", "p_0_14", "p_0_15"]}, {"id": "team_1", "name": "España 2010", "style": "tiki_taka", "players": ["p_1_0", "p_1_1", "p_1_2", "p_1_3", "p_1_4", "p_1_5", "p_1_6", "p_1_7", "p_1_8", "p_1_9", "p_1_10", "p_1_11", "p_1_12", "p_1_13", "p_1_14", "p_1_15"]}, {"id": "team_2", "name": "España 2012", "style": "tiki_taka", "players": ["p_2_0", "p_2_1", "p_2_2", "p_2_3", "p_2_4", "p_2_5", "p_2_6", "p_2_7", "p_2_8", "p_2_9", "p_2_10", "p_2_11", "p_2_12", "p_2_13", "p_2_14", "p_2_15"]}, {"id": "team_3", "name": "Brasil 1970", "style": "samba_total", "players": ["p_3_0", "p_3_1", "p_3_2", "p_3_3", "p_3_4", "p_3_5", "p_3_6", "p_3_7", "p_3_8", "p_3_9", "p_3_10", "p_3_11", "p_3_12", "p_3_13", "p_3_14", "p_3_15"]}, {"id": "team_4", "name": "Brasil 2002", "style": "ataque_letal", "players": ["p_4_0", "p_4_1", "p_4_2", "p_4_3", "p_4_4", "p_4_5", "p_4_6", "p_4_7", "p_4_8", "p_4_9", "p_4_10", "p_4_11", "p_4_12", "p_4_13", "p_4_14", "p_4_15"]}, {"id": "team_5", "name": "Alemania 1974", "style": "maquinaria_alemana", "players": ["p_5_0", "p_5_1", "p_5_2", "p_5_3", "p_5_4", "p_5_5", "p_5_6", "p_5_7", "p_5_8", "p_5_9", "p_5_10", "p_5_11", "p_5_12", "p_5_13", "p_5_14", "p_5_15"]}, {"id": "team_6", "name": "Alemania 1990", "style": "maquinaria_alemana", "players": ["p_6_0", "p_6_1", "p_6_2", "p_6_3", "p_6_4", "p_6_5", "p_6_6", "p_6_7", "p_6_8", "p_6_9", "p_6_10", "p_6_11", "p_6_12", "p_6_13", "p_6_14", "p_6_15"]}, {"id": "team_7", "name": "Alemania 2014", "style": "gegenpressing", "players": ["p_7_0", "p_7_1", "p_7_2", "p_7_3", "p_7_4", "p_7_5", "p_7_6", "p_7_7", "p_7_8", "p_7_9", "p_7_10", "p_7_11", "p_7_12", "p_7_13", "p_7_14", "p_7_15"]}, {"id": "team_8", "name": "Argentina 1986", "style": "magia_individual", "players": ["p_8_0", "p_8_1", "p_8_2", "p_8_3", "p_8_4", "p_8_5", "p_8_6", "p_8_7", "p_8_8", "p_8_9", "p_8_10", "p_8_11", "p_8_12", "p_8_13", "p_8_14", "p_8_15"]}, {"id": "team_9", "name": "Argentina 2022", "style": "la_scaloneta", "players": ["p_9_0", "p_9_1", "p_9_2", "p_9_3", "p_9_4", "p_9_5", "p_9_6", "p_9_7", "p_9_8", "p_9_9", "p_9_10", "p_9_11", "p_9_12", "p_9_13", "p_9_14", "p_9_15"]}, {"id": "team_10", "name": "Francia 1998", "style": "solidez_francesa", "players": ["p_10_0", "p_10_1", "p_10_2", "p_10_3", "p_10_4", "p_10_5", "p_10_6", "p_10_7", "p_10_8", "p_10_9", "p_10_10", "p_10_11", "p_10_12", "p_10_13", "p_10_14", "p_10_15"]}, {"id": "team_11", "name": "Francia 2018", "style": "velocidad_punzante", "players": ["p_11_0", "p_11_1", "p_11_2", "p_11_3", "p_11_4", "p_11_5", "p_11_6", "p_11_7", "p_11_8", "p_11_9", "p_11_10", "p_11_11", "p_11_12", "p_11_13", "p_11_14", "p_11_15"]}, {"id": "team_12", "name": "Italia 1982", "style": "catenaccio", "players": ["p_12_0", "p_12_1", "p_12_2", "p_12_3", "p_12_4", "p_12_5", "p_12_6", "p_12_7", "p_12_8", "p_12_9", "p_12_10", "p_12_11", "p_12_12", "p_12_13", "p_12_14", "p_12_15"]}, {"id": "team_13", "name": "Italia 2006", "style": "catenaccio", "players": ["p_13_0", "p_13_1", "p_13_2", "p_13_3", "p_13_4", "p_13_5", "p_13_6", "p_13_7", "p_13_8", "p_13_9", "p_13_10", "p_13_11", "p_13_12", "p_13_13", "p_13_14", "p_13_15"]}, {"id": "team_14", "name": "Holanda 1974", "style": "total_football", "players": ["p_14_0", "p_14_1", "p_14_2", "p_14_3", "p_14_4", "p_14_5", "p_14_6", "p_14_7", "p_14_8", "p_14_9", "p_14_10", "p_14_11", "p_14_12", "p_14_13", "p_14_14", "p_14_15"]}, {"id": "team_15", "name": "Holanda 1988", "style": "naranja_mecanica", "players": ["p_15_0", "p_15_1", "p_15_2", "p_15_3", "p_15_4", "p_15_5", "p_15_6", "p_15_7", "p_15_8", "p_15_9", "p_15_10", "p_15_11", "p_15_12", "p_15_13", "p_15_14", "p_15_15"]}, {"id": "team_16", "name": "Inglaterra 1966", "style": "futbol_directo", "players": ["p_16_0", "p_16_1", "p_16_2", "p_16_3", "p_16_4", "p_16_5", "p_16_6", "p_16_7", "p_16_8", "p_16_9", "p_16_10", "p_16_11", "p_16_12", "p_16_13", "p_16_14", "p_16_15"]}, {"id": "team_17", "name": "Portugal 2016", "style": "garra_lusa", "players": ["p_17_0", "p_17_1", "p_17_2", "p_17_3", "p_17_4", "p_17_5", "p_17_6", "p_17_7", "p_17_8", "p_17_9", "p_17_10", "p_17_11", "p_17_12", "p_17_13", "p_17_14", "p_17_15"]}, {"id": "team_18", "name": "Croacia 2018", "style": "muralla_balcanica", "players": ["p_18_0", "p_18_1", "p_18_2", "p_18_3", "p_18_4", "p_18_5", "p_18_6", "p_18_7", "p_18_8", "p_18_9", "p_18_10", "p_18_11", "p_18_12", "p_18_13", "p_18_14", "p_18_15"]}, {"id": "team_19", "name": "Uruguay 1950", "style": "garra_charrua", "players": ["p_19_0", "p_19_1", "p_19_2", "p_19_3", "p_19_4", "p_19_5", "p_19_6", "p_19_7", "p_19_8", "p_19_9", "p_19_10", "p_19_11", "p_19_12", "p_19_13", "p_19_14", "p_19_15"]}, {"id": "team_20", "name": "Hungría 1954", "style": "once_oro_magiar", "players": ["p_20_0", "p_20_1", "p_20_2", "p_20_3", "p_20_4", "p_20_5", "p_20_6", "p_20_7", "p_20_8", "p_20_9", "p_20_10", "p_20_11", "p_20_12", "p_20_13", "p_20_14", "p_20_15"]}, {"id": "team_21", "name": "Dinamarca 1992", "style": "dinamita_danesa", "players": ["p_21_0", "p_21_1", "p_21_2", "p_21_3", "p_21_4", "p_21_5", "p_21_6", "p_21_7", "p_21_8", "p_21_9", "p_21_10", "p_21_11", "p_21_12", "p_21_13", "p_21_14", "p_21_15"]}, {"id": "team_22", "name": "Bélgica 2018", "style": "velocidad_punzante", "players": ["p_22_0", "p_22_1", "p_22_2", "p_22_3", "p_22_4", "p_22_5", "p_22_6", "p_22_7", "p_22_8", "p_22_9", "p_22_10", "p_22_11", "p_22_12", "p_22_13", "p_22_14", "p_22_15"]}, {"id": "team_23", "name": "México 1986", "style": "tricolor_tecnico", "players": ["p_23_0", "p_23_1", "p_23_2", "p_23_3", "p_23_4", "p_23_5", "p_23_6", "p_23_7", "p_23_8", "p_23_9", "p_23_10", "p_23_11", "p_23_12", "p_23_13", "p_23_14", "p_23_15"]}, {"id": "team_24", "name": "Estados Unidos 2002", "style": "garra_yanqui", "players": ["p_24_0", "p_24_1", "p_24_2", "p_24_3", "p_24_4", "p_24_5", "p_24_6", "p_24_7", "p_24_8", "p_24_9", "p_24_10", "p_24_11", "p_24_12", "p_24_13", "p_24_14", "p_24_15"]}, {"id": "team_25", "name": "Japón 2002", "style": "disciplina_nipona", "players": ["p_25_0", "p_25_1", "p_25_2", "p_25_3", "p_25_4", "p_25_5", "p_25_6", "p_25_7", "p_25_8", "p_25_9", "p_25_10", "p_25_11", "p_25_12", "p_25_13", "p_25_14", "p_25_15"]}, {"id": "team_26", "name": "Corea del Sur 2002", "style": "gegenpressing", "players": ["p_26_0", "p_26_1", "p_26_2", "p_26_3", "p_26_4", "p_26_5", "p_26_6", "p_26_7", "p_26_8", "p_26_9", "p_26_10", "p_26_11", "p_26_12", "p_26_13", "p_26_14", "p_26_15"]}, {"id": "team_27", "name": "Marruecos 2022", "style": "muralla_atlas", "players": ["p_27_0", "p_27_1", "p_27_2", "p_27_3", "p_27_4", "p_27_5", "p_27_6", "p_27_7", "p_27_8", "p_27_9", "p_27_10", "p_27_11", "p_27_12", "p_27_13", "p_27_14", "p_27_15"]}, {"id": "team_28", "name": "Nigeria 1994", "style": "superaguilas", "players": ["p_28_0", "p_28_1", "p_28_2", "p_28_3", "p_28_4", "p_28_5", "p_28_6", "p_28_7", "p_28_8", "p_28_9", "p_28_10", "p_28_11", "p_28_12", "p_28_13", "p_28_14", "p_28_15"]}, {"id": "team_29", "name": "Camerún 1990", "style": "leones_indomables", "players": ["p_29_0", "p_29_1", "p_29_2", "p_29_3", "p_29_4", "p_29_5", "p_29_6", "p_29_7", "p_29_8", "p_29_9", "p_29_10", "p_29_11", "p_29_12", "p_29_13", "p_29_14", "p_29_15"]}, {"id": "team_30", "name": "Chile 1962", "style": "garra_chilena", "players": ["p_30_0", "p_30_1", "p_30_2", "p_30_3", "p_30_4", "p_30_5", "p_30_6", "p_30_7", "p_30_8", "p_30_9", "p_30_10", "p_30_11", "p_30_12", "p_30_13", "p_30_14", "p_30_15"]}, {"id": "team_31", "name": "Paraguay 2010", "style": "muralla_guarani", "players": ["p_31_0", "p_31_1", "p_31_2", "p_31_3", "p_31_4", "p_31_5", "p_31_6", "p_31_7", "p_31_8", "p_31_9", "p_31_10", "p_31_11", "p_31_12", "p_31_13", "p_31_14", "p_31_15"]}, {"id": "team_32", "name": "Colombia 2014", "style": "fiesta_cafetera", "players": ["p_32_0", "p_32_1", "p_32_2", "p_32_3", "p_32_4", "p_32_5", "p_32_6", "p_32_7", "p_32_8", "p_32_9", "p_32_10", "p_32_11", "p_32_12", "p_32_13", "p_32_14", "p_32_15"]}, {"id": "team_33", "name": "Perú 1978", "style": "vendaval_incaico", "players": ["p_33_0", "p_33_1", "p_33_2", "p_33_3", "p_33_4", "p_33_5", "p_33_6", "p_33_7", "p_33_8", "p_33_9", "p_33_10", "p_33_11", "p_33_12", "p_33_13", "p_33_14", "p_33_15"]}, {"id": "team_34", "name": "Suecia 1958", "style": "disciplina_vikinga", "players": ["p_34_0", "p_34_1", "p_34_2", "p_34_3", "p_34_4", "p_34_5", "p_34_6", "p_34_7", "p_34_8", "p_34_9", "p_34_10", "p_34_11", "p_34_12", "p_34_13", "p_34_14", "p_34_15"]}, {"id": "team_35", "name": "Polonia 1974", "style": "velocidad_punzante", "players": ["p_35_0", "p_35_1", "p_35_2", "p_35_3", "p_35_4", "p_35_5", "p_35_6", "p_35_7", "p_35_8", "p_35_9", "p_35_10", "p_35_11", "p_35_12", "p_35_13", "p_35_14", "p_35_15"]}, {"id": "team_36", "name": "Checoslovaquia 1962", "style": "tecnica_centroeuropea", "players": ["p_36_0", "p_36_1", "p_36_2", "p_36_3", "p_36_4", "p_36_5", "p_36_6", "p_36_7", "p_36_8", "p_36_9", "p_36_10", "p_36_11", "p_36_12", "p_36_13", "p_36_14", "p_36_15"]}, {"id": "team_37", "name": "Yugoslavia 1962", "style": "tecnica_balcanica", "players": ["p_37_0", "p_37_1", "p_37_2", "p_37_3", "p_37_4", "p_37_5", "p_37_6", "p_37_7", "p_37_8", "p_37_9", "p_37_10", "p_37_11", "p_37_12", "p_37_13", "p_37_14", "p_37_15"]}, {"id": "team_38", "name": "Austria 1954", "style": "wunderteam", "players": ["p_38_0", "p_38_1", "p_38_2", "p_38_3", "p_38_4", "p_38_5", "p_38_6", "p_38_7", "p_38_8", "p_38_9", "p_38_10", "p_38_11", "p_38_12", "p_38_13", "p_38_14", "p_38_15"]}, {"id": "team_39", "name": "Suiza 1954", "style": "sistema_cerrojo", "players": ["p_39_0", "p_39_1", "p_39_2", "p_39_3", "p_39_4", "p_39_5", "p_39_6", "p_39_7", "p_39_8", "p_39_9", "p_39_10", "p_39_11", "p_39_12", "p_39_13", "p_39_14", "p_39_15"]}, {"id": "team_40", "name": "Turquía 2002", "style": "furia_otomana", "players": ["p_40_0", "p_40_1", "p_40_2", "p_40_3", "p_40_4", "p_40_5", "p_40_6", "p_40_7", "p_40_8", "p_40_9", "p_40_10", "p_40_11", "p_40_12", "p_40_13", "p_40_14", "p_40_15"]}, {"id": "team_41", "name": "Grecia 2004", "style": "milagro_defensivo", "players": ["p_41_0", "p_41_1", "p_41_2", "p_41_3", "p_41_4", "p_41_5", "p_41_6", "p_41_7", "p_41_8", "p_41_9", "p_41_10", "p_41_11", "p_41_12", "p_41_13", "p_41_14", "p_41_15"]}, {"id": "team_42", "name": "Rumanía 1994", "style": "magia_carpatica", "players": ["p_42_0", "p_42_1", "p_42_2", "p_42_3", "p_42_4", "p_42_5", "p_42_6", "p_42_7", "p_42_8", "p_42_9", "p_42_10", "p_42_11", "p_42_12", "p_42_13", "p_42_14", "p_42_15"]}, {"id": "team_43", "name": "Irlanda 1990", "style": "futbol_directo", "players": ["p_43_0", "p_43_1", "p_43_2", "p_43_3", "p_43_4", "p_43_5", "p_43_6", "p_43_7", "p_43_8", "p_43_9", "p_43_10", "p_43_11", "p_43_12", "p_43_13", "p_43_14", "p_43_15"]}, {"id": "team_44", "name": "Escocia 1978", "style": "furia_tartan", "players": ["p_44_0", "p_44_1", "p_44_2", "p_44_3", "p_44_4", "p_44_5", "p_44_6", "p_44_7", "p_44_8", "p_44_9", "p_44_10", "p_44_11", "p_44_12", "p_44_13", "p_44_14", "p_44_15"]}, {"id": "team_45", "name": "Gales 1958", "style": "muralla_celta", "players": ["p_45_0", "p_45_1", "p_45_2", "p_45_3", "p_45_4", "p_45_5", "p_45_6", "p_45_7", "p_45_8", "p_45_9", "p_45_10", "p_45_11", "p_45_12", "p_45_13", "p_45_14", "p_45_15"]}, {"id": "team_46", "name": "Rusia 2018", "style": "gegenpressing", "players": ["p_46_0", "p_46_1", "p_46_2", "p_46_3", "p_46_4", "p_46_5", "p_46_6", "p_46_7", "p_46_8", "p_46_9", "p_46_10", "p_46_11", "p_46_12", "p_46_13", "p_46_14", "p_46_15"]}, {"id": "team_47", "name": "Ucrania 2006", "style": "punta_lanza", "players": ["p_47_0", "p_47_1", "p_47_2", "p_47_3", "p_47_4", "p_47_5", "p_47_6", "p_47_7", "p_47_8", "p_47_9", "p_47_10", "p_47_11", "p_47_12", "p_47_13", "p_47_14", "p_47_15"]}, {"id": "team_48", "name": "Serbia 2010", "style": "muralla_balcanica", "players": ["p_48_0", "p_48_1", "p_48_2", "p_48_3", "p_48_4", "p_48_5", "p_48_6", "p_48_7", "p_48_8", "p_48_9", "p_48_10", "p_48_11", "p_48_12", "p_48_13", "p_48_14", "p_48_15"]}, {"id": "team_49", "name": "Noruega 1998", "style": "vikingo_directo", "players": ["p_49_0", "p_49_1", "p_49_2", "p_49_3", "p_49_4", "p_49_5", "p_49_6", "p_49_7", "p_49_8", "p_49_9", "p_49_10", "p_49_11", "p_49_12", "p_49_13", "p_49_14", "p_49_15"]}, {"id": "team_50", "name": "España 1964", "style": "garra_charrua", "players": ["p_50_0", "p_50_1", "p_50_2", "p_50_3", "p_50_4", "p_50_5", "p_50_6", "p_50_7", "p_50_8", "p_50_9", "p_50_10", "p_50_11", "p_50_12", "p_50_13", "p_50_14", "p_50_15"]}, {"id": "team_51", "name": "España 2021", "style": "tiki_taka", "players": ["p_51_0", "p_51_1", "p_51_2", "p_51_3", "p_51_4", "p_51_5", "p_51_6", "p_51_7", "p_51_8", "p_51_9", "p_51_10", "p_51_11", "p_51_12", "p_51_13", "p_51_14", "p_51_15"]}, {"id": "team_52", "name": "España 1950", "style": "garra_charrua", "players": ["p_52_0", "p_52_1", "p_52_2", "p_52_3", "p_52_4", "p_52_5", "p_52_6", "p_52_7", "p_52_8", "p_52_9", "p_52_10", "p_52_11", "p_52_12", "p_52_13", "p_52_14", "p_52_15"]}, {"id": "team_53", "name": "Brasil 1958", "style": "samba_total", "players": ["p_53_0", "p_53_1", "p_53_2", "p_53_3", "p_53_4", "p_53_5", "p_53_6", "p_53_7", "p_53_8", "p_53_9", "p_53_10", "p_53_11", "p_53_12", "p_53_13", "p_53_14", "p_53_15"]}, {"id": "team_54", "name": "Brasil 1994", "style": "samba_total", "players": ["p_54_0", "p_54_1", "p_54_2", "p_54_3", "p_54_4", "p_54_5", "p_54_6", "p_54_7", "p_54_8", "p_54_9", "p_54_10", "p_54_11", "p_54_12", "p_54_13", "p_54_14", "p_54_15"]}, {"id": "team_55", "name": "Argentina 1978", "style": "magia_individual", "players": ["p_55_0", "p_55_1", "p_55_2", "p_55_3", "p_55_4", "p_55_5", "p_55_6", "p_55_7", "p_55_8", "p_55_9", "p_55_10", "p_55_11", "p_55_12", "p_55_13", "p_55_14", "p_55_15"]}, {"id": "team_56", "name": "Alemania 2002", "style": "maquinaria_alemana", "players": ["p_56_0", "p_56_1", "p_56_2", "p_56_3", "p_56_4", "p_56_5", "p_56_6", "p_56_7", "p_56_8", "p_56_9", "p_56_10", "p_56_11", "p_56_12", "p_56_13", "p_56_14", "p_56_15"]}, {"id": "team_57", "name": "Francia 2021", "style": "velocidad_punzante", "players": ["p_57_0", "p_57_1", "p_57_2", "p_57_3", "p_57_4", "p_57_5", "p_57_6", "p_57_7", "p_57_8", "p_57_9", "p_57_10", "p_57_11", "p_57_12", "p_57_13", "p_57_14", "p_57_15"]}, {"id": "team_58", "name": "Holanda 2010", "style": "total_football", "players": ["p_58_0", "p_58_1", "p_58_2", "p_58_3", "p_58_4", "p_58_5", "p_58_6", "p_58_7", "p_58_8", "p_58_9", "p_58_10", "p_58_11", "p_58_12", "p_58_13", "p_58_14", "p_58_15"]}, {"id": "team_59", "name": "Portugal 2022", "style": "garra_lusa", "players": ["p_59_0", "p_59_1", "p_59_2", "p_59_3", "p_59_4", "p_59_5", "p_59_6", "p_59_7", "p_59_8", "p_59_9", "p_59_10", "p_59_11", "p_59_12", "p_59_13", "p_59_14", "p_59_15"]}, {"id": "team_60", "name": "Italia 1970", "style": "catenaccio", "players": ["p_60_0", "p_60_1", "p_60_2", "p_60_3", "p_60_4", "p_60_5", "p_60_6", "p_60_7", "p_60_8", "p_60_9", "p_60_10", "p_60_11", "p_60_12", "p_60_13", "p_60_14", "p_60_15"]}, {"id": "team_61", "name": "Italia 1938", "style": "catenaccio", "players": ["p_61_0", "p_61_1", "p_61_2", "p_61_3", "p_61_4", "p_61_5", "p_61_6", "p_61_7", "p_61_8", "p_61_9", "p_61_10", "p_61_11", "p_61_12", "p_61_13", "p_61_14", "p_61_15"]}];
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

let teams = rawTeams.map(function(t){
 const styleInfo = STYLES[t.style];
 return {
  name:t.name,
  flag:"es",
  style:styleInfo?styleInfo.name:(t.style||"Clásico"),
  bonuses:styleInfo?styleInfo.bonuses:{},
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
  }
}

/* ---------- STYLE HINTS for rivals ---------- */
const STYLE_HINTS = {
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
const PRESS_EVENTS = {
  win: [
    { q:"«¿Crees que el rival no estaba a vuestro nivel?»", answers:[
      { text:"«Fueron un rival duro. El resultado es justo.»",           moral:+15, label:"Humilde" },
      { text:"«Honestamente, esperábamos más de ellos.»",               moral:+3,  label:"Arrogante" },
      { text:"«Tenemos suerte de ganar, la verdad.»",                    moral:-6,  label:"Inseguro" },
    ]},
    { q:"«¿Es este el mejor partido de la temporada?»", answers:[
      { text:"«Todavía podemos mejorar. El trabajo sigue.»",             moral:+12, label:"Exigente" },
      { text:"«Sí, el equipo ha rozado la perfección hoy.»",             moral:+5,  label:"Satisfecho" },
      { text:"«Prefiero no hacer valoraciones tan pronto.»",             moral:+3,  label:"Cauto" },
    ]},
    { q:"«¿Sois ya los favoritos para ganar el torneo?»", answers:[
      { text:"«Partido a partido. No miramos más allá.»",                moral:+14, label:"Profesional" },
      { text:"«¡Claro que sí! Somos el mejor equipo aquí.»",             moral:+2,  label:"Arrogante" },
      { text:"«Hay equipos muy fuertes, no cantemos victoria.»",         moral:+10, label:"Sensato" },
    ]},
    { q:"«Los aficionados están eufóricos. ¿Qué les dices?»", answers:[
      { text:"«Que sigan creyendo. Lo hacemos por ellos.»",              moral:+18, label:"Emotivo" },
      { text:"«Que esperen a ver qué hacemos en la siguiente ronda.»",   moral:+8,  label:"Comedido" },
      { text:"«Que se lo merecen. ¡Este escudo vale mucho!»",            moral:+10, label:"Apasionado" },
    ]},
  ],
  draw: [
    { q:"«¿Os ha faltado fuerza para cerrar el partido?»", answers:[
      { text:"«Nos faltó un punto de acierto, pero aprendemos.»",       moral:+8,  label:"Analítico" },
      { text:"«El empate es justo. Ambos merecíamos más.»",              moral:+5,  label:"Ecuánime" },
      { text:"«Deberíamos haber ganado. Es frustrante.»",               moral:-5,  label:"Frustrado" },
    ]},
    { q:"«¿El empate complica vuestra clasificación?»", answers:[
      { text:"«Depende de nosotros. Seguimos trabajando.»",              moral:+10, label:"Sereno" },
      { text:"«Sí, nos hace daño. Necesitamos reaccionar.»",             moral:-8,  label:"Preocupado" },
      { text:"«Un punto siempre vale. Seguimos vivos.»",                 moral:+6,  label:"Positivo" },
    ]},
    { q:"«¿Les faltó ambición al equipo hoy?»", answers:[
      { text:"«Quizás. Hablaremos internamente sobre eso.»",             moral:+4,  label:"Honesto" },
      { text:"«No, el rival fue muy sólido defensivamente.»",            moral:+7,  label:"Objetivo" },
      { text:"«El equipo lo ha dado todo, eso es indiscutible.»",        moral:+10, label:"Defensor" },
    ]},
  ],
  loss: [
    { q:"«¿Qué ha fallado hoy?»", answers:[
      { text:"«El rival fue mejor. Aprendemos y seguimos.»",             moral:+12, label:"Maduro" },
      { text:"«Los árbitros nos perjudicaron claramente.»",              moral:-8,  label:"Excusas" },
      { text:"«Fue un desastre. No tengo respuestas.»",                  moral:-18, label:"Hundido" },
    ]},
    { q:"«¿Sigues creyendo en este proyecto tras la derrota?»", answers:[
      { text:"«Absolutamente. Los malos momentos forjan equipos.»",      moral:+16, label:"Convicción" },
      { text:"«Necesito reflexionar antes de contestar.»",               moral:-3,  label:"Dubitativo" },
      { text:"«Hay decisiones que habría que replantear.»",              moral:-10, label:"Cuestionador" },
    ]},
    { q:"«¿Han bajado los brazos los jugadores?»", answers:[
      { text:"«Jamás. Se nota que están comprometidos.»",                moral:+10, label:"Defensor" },
      { text:"«Algunos sí perdieron la cabeza. Trabajaremos en ello.»",  moral:-5,  label:"Crítico" },
      { text:"«Es una pregunta que me hago yo también.»",                moral:-14, label:"Cuestionador" },
    ]},
    { q:"«¿Hay tensión en el vestuario?»", answers:[
      { text:"«El grupo está unido. Las derrotas nos hacen más fuertes.»",moral:+14, label:"Unidad" },
      { text:"«Hay reflexión, que es sano. No tensión.»",                moral:+6,  label:"Diplomático" },
      { text:"«Prefiero no entrar en detalles del vestuario.»",          moral:-2,  label:"Evasivo" },
    ]},
  ],
};
const MAX_SWAPS_PER_MATCH = 2;

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
const FORMATIONS = {
  ofensiva:[
    {code:"3-4-3",label:"Ataque total",bonus:{attack:10,pace:6,defense:-6}},
    {code:"3-4-1-2",label:"Mediapunta creativo",bonus:{attack:8,technique:7,defense:-4}},
    {code:"4-2-4",label:"Brasil clásico",bonus:{attack:12,pace:5,defense:-8}},
    {code:"4-3-3",label:"Barcelona style",bonus:{attack:7,passing:5,technique:3}},
    {code:"4-2-3-1",label:"Extremos al ataque",bonus:{attack:8,pace:5,defense:-2}},
    {code:"3-5-2",label:"Superioridad central",bonus:{passing:8,technique:5,attack:3,defense:-3}},
    {code:"2-3-5",label:"Vintage ofensivo",bonus:{attack:15,pace:5,defense:-12}},
  ],
  equilibrada:[
    {code:"4-4-2",label:"El clásico",bonus:{attack:4,defense:4,passing:3,pace:3}},
    {code:"4-3-3",label:"Posesión y ataque",bonus:{attack:6,passing:5,technique:3}},
    {code:"4-1-4-1",label:"Sólido en todo",bonus:{defense:7,passing:5,pace:2}},
    {code:"4-2-3-1",label:"Fútbol moderno",bonus:{attack:6,passing:5,pace:3}},
    {code:"4-3-1-2",label:"Control + 2 puntas",bonus:{passing:6,technique:6,attack:3}},
    {code:"3-5-2",label:"Carrileros activos",bonus:{passing:7,technique:4,pace:3}},
    {code:"4-5-1",label:"Defensivo+contragol",bonus:{defense:6,passing:4,pace:2}},
  ],
  defensiva:[
    {code:"5-4-1",label:"Fortaleza",bonus:{defense:12,passing:2,attack:-6}},
    {code:"5-3-2",label:"5 atrás + 2 arriba",bonus:{defense:10,pace:3,attack:-3}},
    {code:"4-5-1",label:"Bloque compacto",bonus:{defense:9,passing:3,attack:-3}},
    {code:"4-1-4-1",label:"Pivote protector",bonus:{defense:11,passing:3,attack:-4}},
    {code:"3-6-1",label:"Muro defensivo",bonus:{defense:9,passing:6,attack:-8}},
    {code:"5-2-2-1",label:"Contragolpe",bonus:{defense:10,pace:5,attack:-5}},
    {code:"6-3-1",label:"Ultra defensivo",bonus:{defense:15,attack:-12}},
  ]
};
const CAT_NAMES={ofensiva:"Ofensiva",equilibrada:"Equilibrada",defensiva:"Defensiva"};
let currentFormation={category:"equilibrada",code:"4-4-2"};
let currentFormationBonus={};

/* ---------- DOM REFS ---------- */
const rollBtn = document.getElementById("rollBtn");
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

/* ---------- INIT ---------- */
applyFormationBonus(FORMATIONS.equilibrada.find(f=>f.code==="4-4-2").bonus);
renderPitch("4-4-2");
renderFormationList("equilibrada");
updateStats();
updateDraftCounter();

/* ---------- ROLL BUTTON ---------- */
rollBtn.addEventListener("click",()=>{
  if(rollBtn.disabled) return;
  if(phase==="draft") rollTeams();
  else if(phase==="bench") rollBench();
});

/* ---------- FORMATION TABS ---------- */
document.querySelectorAll(".formation-tab").forEach(tab=>{
  tab.addEventListener("click",()=>{
    document.querySelectorAll(".formation-tab").forEach(t=>t.classList.remove("active"));
    tab.classList.add("active");
    renderFormationList(tab.dataset.cat);
  });
});

/* ========= ROLL TEAMS (show 2 random teams, 8 random players each) ========= */
function rollTeams(){
  rollBtn.disabled=true;
  const pool=teams.slice();
  shuffle(pool);
  const t1=pool[0], t2=pool[1];
  const p1=randomPick(t1.players,5), p2=randomPick(t2.players,5);
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
  showTeamChoice(t1,p1,t2,p2,true);
}

function randomPick(arr,n){
  const a=[...arr]; shuffle(a); return a.slice(0,Math.min(n,a.length));
}
function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]; } }

function showTeamChoice(t1,p1,t2,p2,isBench=false){
  const title=isBench?"ELIGE JUGADOR DE BANQUILLO":"ELIGE UNA SELECCIÓN";
  // Slot-machine reveal: shuffle random flags for ~1s before showing the real choices
  playerCardEl.innerHTML=`
  <div class="box" style="margin-bottom:0">
    <div class="selection-title">${title}</div>
    <div class="team-choice slot-spin">
      <div class="team-option slot-reel"><div class="flag-wrap"><div class="slot-strip" id="reel1"></div></div></div>
      <div class="team-option slot-reel"><div class="flag-wrap"><div class="slot-strip" id="reel2"></div></div></div>
    </div>
  </div>`;
  scrollToEl("playerCardDesktop", 30);
  scrollToEl("playerCardDesktop", 950);
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
    playerCardEl.innerHTML=`
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
    <p>${team.style}</p>
    ${renderBonuses(team)}
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
  playerCardEl.innerHTML=`
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
}

/* ========= PICK PLAYER ========= */
function pickPlayer(player){
  playSound('select');
  if(phase==="bench"){
    bench.push({...player});
    benchCount++;
    playerCardEl.innerHTML="";
    updateBenchTable();
    if(benchCount>=3){
      phase="ready";
      rollBtn.style.display="none";
      const howTo=document.getElementById("howToPlayBox");
      const statsGuide=document.getElementById("statsGuideBox");
      const strat=document.getElementById("strategyBox");
      if(howTo) howTo.style.display="none";
      if(statsGuide) statsGuide.style.display="none";
      if(strat) strat.style.display="block";
      updateConvocadosTable();
      updateBenchTable();
      startMatchPhase();
      startLedLoop();
    } else {
      rollBtn.disabled=false;
      rollBtn.textContent=`BANQUILLO ${benchCount}/3`;
      scrollToCenter("rollBtn");
    }
    return;
  }
  // Draft phase: select for pitch
  selectedPlayer={...player};
  playerCardEl.innerHTML="";
  highlightPos(selectedPlayer.positions||[]);
  showSelectedPlayerBanner(selectedPlayer);
  scrollToEl("pitch");
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
  </div>`;
}
function hideSelectedPlayerBanner(){
  const el=document.getElementById("selectedPlayerBanner");
  if(!el) return;
  el.style.display="none";
  el.innerHTML="";
}

/* ========= POSITION SLOTS ========= */
function renderSlotContent(slot, player, label, rating, starHTML){
  slot.innerHTML=`<span class="pos-rating">${rating}</span><div class="player-info">${player.name}${starHTML}<div class="player-pos-label">${label}</div></div>`;
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
  const lines=code.split("-").map(Number);
  const slots=[{label:"POR",left:50,top:91.4}];
  const T=lines.length;
  lines.forEach((n,i)=>{
    const isDef=i===0,isAtt=i===T-1;
    const labels=lineLabels(n,isDef,isAtt);
    const top=T===1?45:78-i*(78-14)/(T-1);
    labels.forEach((label,j)=>{
      slots.push({label,left:(j+1)/(labels.length+1)*100,top});
    });
  });
  return slots;
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
    rollBtn.textContent="BANQUILLO 0/3";
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
  return Math.round(r*positionFactor*injuryFactor);
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

function updateConvocadosTable(){
  const el=document.getElementById("convocadosTable");
  if(!el) return;
  const swapsLeft=MAX_SWAPS_PER_MATCH-swapsUsedThisMatch;
  const canSwap=(phase==='ready')&&swapsLeft>0;
  let rows="",stars=0;
  usedPlayers.forEach((p,i)=>{
    const inPrimary=p.positions&&p.placedPos&&p.positions[0]===p.placedPos;
    if(inPrimary) stars++;
    const injuryTag=p.injury?` <span class="cross">✚(-${p.injury.remaining})</span> `:'';
    const cross=p.injury?injuryTag:'';
    const star=inPrimary?'<span class="star">★</span>':'';
    const r=effRating(p);
    const streak=getStreakBadge(p.name);
    const sel=(swapSelection&&swapSelection.source==='conv'&&swapSelection.index===i)?' class="row-selected"':'';
    const clickable=canSwap?` onclick="onConvocadoClick(${i})" style="cursor:pointer"`:'';
    rows+=`<tr${sel}${clickable}><td>${i+1}</td><td>${p.name}${cross}${streak}</td><td>${p.placedPos||'?'} ${star}</td><td>${r}</td></tr>`;
  });
  el.innerHTML=rows?`<table><thead><tr><th>#</th><th>Jugador</th><th>Pos</th><th>★</th></tr></thead><tbody>${rows}</tbody></table>`:"";
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
  if(cnt) cnt.textContent=bench.length+"/3";
  if(!el) return;
  const swapsLeft=MAX_SWAPS_PER_MATCH-swapsUsedThisMatch;
  const canSwap=(phase==='ready')&&swapsLeft>0;
  let rows="";
  bench.forEach((p,i)=>{
    const injuryTag=p.injury?` <span class="cross">✚(-${p.injury.remaining})</span> `:'';
    const cross=p.injury?injuryTag:'';
    const sel=(swapSelection&&swapSelection.source==='bench'&&swapSelection.index===i)?' class="row-selected"':'';
    const clickable=canSwap?` onclick="onBenchClick(${i})" style="cursor:pointer"`:'';
    rows+=`<tr${sel}${clickable}><td>${p.name}${cross}</td><td>${(p.positions||[]).join('/')}</td><td>${p.rating||0}</td></tr>`;
  });
  el.innerHTML=rows?`<table><thead><tr><th>Jugador</th><th>Pos</th><th>★</th></tr></thead><tbody>${rows}</tbody></table>`:"";
}

/* ========= PRE-MATCH SWAPS (convocados <-> bench) ========= */
function onConvocadoClick(i){
  if(phase!=='ready'||swapsUsedThisMatch>=MAX_SWAPS_PER_MATCH) return;
  if(swapSelection&&swapSelection.source==='bench'){
    const benchIdx=swapSelection.index;
    swapSelection=null;
    performSwap(benchIdx, i);
    return;
  }
  if(swapSelection&&swapSelection.source==='conv'&&swapSelection.index===i){
    swapSelection=null;
  } else {
    swapSelection={source:'conv',index:i};
  }
  updateConvocadosTable();
  updateBenchTable();
}
function onBenchClick(i){
  if(phase!=='ready'||swapsUsedThisMatch>=MAX_SWAPS_PER_MATCH) return;
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

/* ========= STATS ========= */
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
  ["attack","defense","pace","passing","technique"].forEach(k=>{
    const displayVal=(teamStats[k]||0)-(currentFormationBonus[k]||0);
    const val=Math.max(0,Math.min(100,Math.round(displayVal)));
    const v=document.getElementById(k+"Value");
    const b=document.getElementById(k+"Bar");
    if(v) v.textContent=val;
    if(b) b.style.width=val+"%";
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
  if(phase==="bench") return;
  const f=FORMATIONS[cat].find(x=>x.code===code);
  if(!f) return;
  playSound('select');
  if(phase==="ready"){
    currentFormation={category:cat,code};
    applyFormationBonus(f.bonus);
    reassignSquad(code);
    renderFormationList(cat);
    const el=document.getElementById("currentFormation");
    if(el) el.textContent=`${code} · ${CAT_NAMES[cat]}`;
    return;
  }
  if(draftedCount>0){
    if(!confirm("Cambiar la formación reinicia la colocación. ¿Continuar?")) return;
  }
  currentFormation={category:cat,code};
  applyFormationBonus(f.bonus);
  renderPitch(code);
  resetDraft();
  renderFormationList(cat);
  const el=document.getElementById("currentFormation");
  if(el) el.textContent=`${code} · ${CAT_NAMES[cat]}`;
}
function resetDraft(){
  usedPlayers=[]; draftedCount=0;
  updateDraftCounter();
  updateConvocadosTable();
  rollBtn.disabled=false;
  rollBtn.textContent="GO!";
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
  document.getElementById("nextRivalStrip").style.display="flex";
  document.getElementById("playMatchBtn").style.display="block";
  document.getElementById("moraleSection").style.display="block";
  renderMorale();
  playerCardEl.innerHTML="";
  showTeamNameModal();
}
function showTeamNameModal(){
  document.getElementById("matchOverlay").innerHTML=`
  <div class="match-modal">
    <h3>¡Equipo completo!</h3>
    <div class="match-summary">Tu plantilla GOAT está lista. ¡Dale un nombre a tu equipo antes de empezar el torneo! Empezarás en la <strong>Fase de Grupos</strong>: 3 partidos, los 2 primeros del grupo avanzan a octavos de final.</div>
    <input type="text" id="teamNameInput" maxlength="24" placeholder="Ej: Dream Team FC" class="team-name-input" value="${esc(myTeamName==='TU EQUIPO'?'':myTeamName)}">
    <button class="modal-btn" id="teamNameConfirmBtn">CONFIRMAR</button>
  </div>`;
  const inp=document.getElementById("teamNameInput");
  inp.focus();
  const confirmFn=()=>{
    const val=inp.value.trim();
    if(val) myTeamName=val.toUpperCase();
    document.getElementById("matchOverlay").innerHTML="";
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
  if(stage==="group"){
    nextOpponent=groupOpponents[groupMatchIdx];
  } else if(stage==="knockout"){
    nextOpponent=knockoutPool[knockoutRound] || teams[Math.floor(Math.random()*teams.length)];
  } else {
    return;
  }
  renderCenterSummary();
  spinRivalReveal();
  scrollToEl("rivalBox", 30);
  scrollToEl("rivalBox", 950); // re-anchor after the reveal settles and content height changes
}
function spinRivalReveal(){
  const rivalInfo=document.getElementById("rivalInfo");
  const rivalHint=document.getElementById("rivalHint");
  const stripFlag=document.getElementById("stripFlag");
  const stripName=document.getElementById("stripName");
  rivalHint.textContent="";
  stripName.textContent="Buscando rival...";
  rivalInfo.innerHTML=`<div class="rival-card"><div class="team-option slot-reel rival-slot-reel"><div class="flag-wrap"><div class="slot-strip" id="rivalReel"></div></div></div></div>`;
  const reel=document.getElementById("rivalReel");
  const pool=teams;
  const spin=setInterval(()=>{
    const r=pool[Math.floor(Math.random()*pool.length)];
    reel.innerHTML=flagEmoji(r.name,56);
    stripFlag.innerHTML=flagEmoji(r.name,28);
    playSound('spin');
  },80);
  setTimeout(()=>{
    clearInterval(spin);
    playSound('reveal');
    renderRivalBox();
    stripFlag.innerHTML=flagEmoji(nextOpponent.name,28);
    stripName.textContent=nextOpponent.name;
    updateLed();
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
      <div class="rival-style-tag">${nextOpponent.style}</div>
      <div class="rival-power-bar">
        <div class="rival-power-label">PODER RIVAL</div>
        <div class="rival-power-value">${Math.round(power)}</div>
        <div class="rival-power-track"><div class="rival-power-fill" style="width:${Math.min(100,power)}%"></div></div>
      </div>
    </div>`;
  document.getElementById("rivalHint").textContent=hint;
}

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
  return avg + bonusBoost;
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
/* Counter-strategy: compares the tactical LEAN of your chosen formation
   (attack-defense balance from its bonus, independent of player stats —
   never shown to the player) against the rival's tactical lean (from their
   style bonuses). Picking the right counter (e.g. defensive/counter-attack
   vs a very offensive rival) nudges win probability without touching the
   visible team rating. */
function formationLean(bonus){
  return (bonus.attack||0) - (bonus.defense||0);
}
function teamLean(team){
  const b=team.bonuses||{};
  return (b.attack||0) - (b.defense||0);
}
function counterStrategyModifier(){
  const myLean=formationLean(currentFormationBonus);     // >0 offensive, <0 defensive
  const oppLean=teamLean(nextOpponent);                  // >0 rival attacks more, <0 rival defends more
  // Good counters: rival very offensive (oppLean high) + I play defensive/counter (myLean low/negative)
  //                rival very defensive (oppLean low/negative) + I play offensive (myLean high)
  // Bad picks: mirroring the rival's extreme lean (both very offensive, or both very defensive)
  const synergy = -(myLean*oppLean)/300; // opposite signs -> positive synergy
  const capped = Math.max(-0.18, Math.min(0.18, synergy));
  return {
    myScoreMod: capped,
    oppScoreMod: -capped*0.6,
  };
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
  rollWeather();
  renderWeather();
  const weatherDelta=weatherLambdaEffect(); // same for both (fair conditions)
  const myLambda=Math.max(0.25, 1.15+diff+tactical.myScoreMod+counter.myScoreMod+earlyBoost+groupNudge+starBonus+moraleBonus+streakBonus+weatherDelta);
  const oppLambda=Math.max(0.25, 1.15-diff+tactical.oppScoreMod+counter.oppScoreMod-earlyBoost*0.6-groupNudge*0.6+weatherDelta);
  const myGoals=poissonSample(myLambda);
  const oppGoals=poissonSample(oppLambda);
  // Match narrative
  let summary=generateMatchSummary(myGoals,oppGoals,nextOpponent.name);
  updateScorerStreaks(generateMatchSummary._scorers||[]);
  // Injuries
  const newInjuries=rollInjuries(myPower,oppPower);
  refreshPitchRatings();
  baseTeamOVR=computeTeamOVR();
  updateConvocadosTable();
  updateBenchTable();

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
  if(won) changeMorale(stage==="knockout"?12:8);
  else if(draw) changeMorale(2);
  else changeMorale(stage==="knockout"?-12:-7);

  // Track best round for chain run rewards
  if(stage==="group") bestRoundReached=Math.max(bestRoundReached,0);
  else bestRoundReached=Math.max(bestRoundReached, knockoutRound+1);

  renderMatchHistory();
  updateLed();
  showMatchModal(myGoals,oppGoals,summary,recovered,newInjuries,won,draw,penaltyInfo);
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
    return `<li>⚽ ${scorer?scorer.name:"Desconocido"} <span class="goal-min">(${min}')</span></li>`;
  });
  generateMatchSummary._scorers=lastMatchScorers;
  const oppGoalLines=oppMinutes.map(min=>{
    const scorer=oppPool[Math.floor(Math.random()*oppPool.length)];
    return `<li>⚽ ${scorer?scorer.name:rivalName} <span class="goal-min">(${min}')</span></li>`;
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
  const extreme=Math.abs(fb.attack||0)+Math.abs(fb.defense||0);
  let risk=0.034;
  if(extreme>=12) risk=0.075;
  if((fb.defense||0)<0&&oppPower>myPower) risk+=0.02;
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

function showMatchModal(myGoals,oppGoals,summary,recovered,newInjuries,won,draw,penaltyInfo){
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
    extraHTML+=`<div class="match-summary" style="background:#f0fff0;border-color:#0f6b3b"><strong>Recuperados:</strong> ${recovered.join(", ")}</div>`;
  }
  if(newInjuries.length){
    const ILABELS={leve:"leve (1 partido)",básica:"básica (2 partidos)",grave:"grave (3 partidos)"};
    extraHTML+=`<div class="injury-section"><p>⚠ Lesiones en ${myTeamName} tras el partido:</p><ul>${newInjuries.map(p=>`<li>${p.name}: lesión ${ILABELS[p.injury.type]}</li>`).join('')}</ul><p class="injury-note">Recuerda: puedes hacer hasta <strong>2 cambios</strong> entre Convocados y Banquillo antes del próximo partido. Hazlo manualmente desde las tablas de la izquierda.</p></div>`;
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
        maybeShowPressEvent(()=>pickNextOpponent(), won, draw);
        break;
      case "groupDone":
        renderMatchHistory();
        showGroupResultsPopup();
        break;
      case "nextKnockoutMatch":
        knockoutRound++;
        maybeShowPressEvent(()=>pickNextOpponent(), won, draw);
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
  const slots=getChainSlots();
  document.getElementById("matchOverlay").innerHTML=`
  <div class="match-modal">
    <h3>FASE DE GRUPOS</h3>
    <div class="match-result-tag res-lose-tag">ELIMINADO EN FASE DE GRUPOS</div>
    <div class="match-summary">
      ${myTeamName} no ha conseguido terminar entre los 2 primeros de su grupo.
    </div>
    <button class="modal-btn danger" onclick="location.reload()">NUEVA PARTIDA</button>
  </div>`;
}
function showEliminated(){
  const round=ROUND_NAMES[knockoutRound];
  const slots=getChainSlots();
  const chainBtn=slots>0
    ?`<button class="modal-btn" onclick="document.getElementById('matchOverlay').innerHTML='';showChainRunModal()">🔗 CONSERVAR ${slots} JUGADOR${slots>1?"ES":""}</button>`
    :"";
  document.getElementById("matchOverlay").innerHTML=`
  <div class="match-modal">
    <h3>${round?round.toUpperCase():"ELIMINATORIAS"}</h3>
    <div class="match-result-tag res-lose-tag">ELIMINADO EN ${round?round.toUpperCase():"ELIMINATORIAS"}</div>
    <div class="match-summary">
      ${myTeamName} cae eliminado en ${round||"las eliminatorias"}. Has llegado hasta ${round||"esta ronda"}.
      ${slots>0?`<br><br>🔗 <strong>Run Encadenada disponible:</strong> puedes conservar ${slots} jugador${slots>1?"es":""} para el siguiente intento.`:""}
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
      ${chainBtn}
      <button class="modal-btn danger" onclick="location.reload()">NUEVA PARTIDA</button>
    </div>
  </div>`;
}
function showVictory(){
  const knockoutWins=matchResults.filter(r=>r.stage==="knockout"&&r.won).length;
  const penWins=matchResults.filter(r=>r.won&&r.score.includes('pen.')).length;
  document.getElementById("matchOverlay").innerHTML=`
  <div class="match-modal">
    <div class="match-result-tag res-win-tag">¡¡CAMPEÓN DEL MUNDO!!</div>
    <div class="match-summary">
      ¡${myTeamName} ha conquistado el torneo completamente!<br>
      ${penWins?`Incluyendo ${penWins} eliminatoria${penWins===1?'':'s'} resuelta${penWins===1?'':'s'} en penaltis.<br>`:''}
      Moral final: ${teamMorale>0?"+":""}${teamMorale} · Eres el mejor seleccionador del planeta.
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
      <button class="modal-btn" onclick="document.getElementById('matchOverlay').innerHTML='';showChainRunModal()">🔗 CONSERVAR 3 JUGADORES</button>
      <button class="modal-btn danger" onclick="location.reload()">NUEVA PARTIDA</button>
    </div>
  </div>`;
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
  return `<span class="streak-badge">${fire}+${Math.min(s,MAX_STREAK_BONUS)}</span>`;
}

/* ========= PRESS EVENT SYSTEM ========= */
function maybeShowPressEvent(callback, won, draw){
  const chance=stage==="knockout"?0.40:0.25;
  if(Math.random()>chance){ callback(); return; }
  const key=won?"win":draw?"draw":"loss";
  const pool=PRESS_EVENTS[key];
  const event=pool[Math.floor(Math.random()*pool.length)];
  showPressEventModal(event, callback);
}
function showPressEventModal(event, callback){
  document.getElementById("matchOverlay").innerHTML=`
  <div class="press-modal">
    <span class="press-icon">🎙</span>
    <h3>RUEDA DE PRENSA</h3>
    <p class="press-question">${event.q}</p>
    <div class="press-answers">
      ${event.answers.map((a,i)=>`
        <button class="press-answer-btn" onclick="choosePressAnswer(${i})">
          <span>${a.text}</span>
          <span class="press-answer-label">${a.label}</span>
        </button>`).join('')}
    </div>
  </div>`;
  window._pressCallback=callback;
  window._pressEvent=event;
}
window.choosePressAnswer=function(idx){
  const event=window._pressEvent;
  const answer=event.answers[idx];
  const delta=answer.moral;
  document.getElementById("matchOverlay").innerHTML="";
  changeMorale(delta);
  // Brief feedback toast
  const sign=delta>0?"+":"";
  showToast(`${answer.label} · Moral ${sign}${delta}`, delta>0?"toast-pos":"toast-neg");
  setTimeout(()=>{ if(window._pressCallback) window._pressCallback(); }, 900);
};

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
  // Save full player objects so the next run can pre-place them
  try{ sessionStorage.setItem('g2g_inherited', JSON.stringify(selected)); }catch(e){}
  location.reload();
};
function loadInheritedPlayers(){
  try{
    const raw=sessionStorage.getItem('g2g_inherited');
    if(!raw){ inheritedPlayers=[]; return; }
    inheritedPlayers=JSON.parse(raw);
    sessionStorage.removeItem('g2g_inherited');
  }catch(e){ inheritedPlayers=[]; }
}
loadInheritedPlayers();

/* If there are inherited players from a chain run, auto-place them on the
   pitch at their primary position, skipping that many draft picks. */
function applyInheritedPlayers(){
  if(!inheritedPlayers.length) return;
  const slots=getPitchSlots();
  inheritedPlayers.forEach(p=>{
    // Find the first unlocked slot matching their primary position
    const primaryPos=(p.positions&&p.positions[0])||null;
    let slot=primaryPos?slots.find(s=>!s.classList.contains('locked')&&s.dataset.label===primaryPos):null;
    // Fallback: any unlocked slot
    if(!slot) slot=slots.find(s=>!s.classList.contains('locked'));
    if(!slot) return;
    const label=slot.dataset.label;
    const inPos=p.positions&&p.positions.includes(label);
    const star=inPos&&p.positions[0]===label?' <span class="star">★</span>':'';
    const r=inPos?(p.rating||70):Math.round((p.rating||70)*0.85);
    p.placedPos=label;
    slot._player={...p};
    slot.classList.add('locked');
    renderSlotContent(slot, p, label, r, star);
    usedPlayers.push({...p});
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

/* ========= TOP BAR: AUDIO & THEME TOGGLES ========= */
const audioToggleBtn=document.getElementById("audioToggle");
const themeToggleBtn=document.getElementById("themeToggle");

// Restore saved preferences on load
(function restorePrefs(){
  // Audio: reflect loaded state in the UI
  if(audioToggleBtn){
    audioToggleBtn.querySelector(".topbar-dot").classList.toggle("on",audioEnabled);
    audioToggleBtn.classList.toggle("off",!audioEnabled);
  }
  // Theme: dark is the default; only go light if explicitly saved as light
  let isDark=true;
  try{
    const saved=localStorage.getItem('g2g_darkTheme');
    if(saved!==null) isDark=(saved==='true');
  }catch(e){}
  if(isDark) document.body.classList.add("dark-theme");
  else document.body.classList.remove("dark-theme");
  if(themeToggleBtn){
    themeToggleBtn.querySelector(".topbar-dot").classList.toggle("on",isDark);
    themeToggleBtn.querySelector(".topbar-label").textContent=isDark?"TEMA OSCURO":"TEMA CLARO";
  }
})();

if(audioToggleBtn){
  audioToggleBtn.addEventListener("click",()=>{
    audioEnabled=!audioEnabled;
    audioToggleBtn.querySelector(".topbar-dot").classList.toggle("on",audioEnabled);
    audioToggleBtn.classList.toggle("off",!audioEnabled);
    try{ localStorage.setItem('g2g_audioEnabled', audioEnabled); }catch(e){}
    if(audioEnabled) playSound('select');
  });
}
if(themeToggleBtn){
  themeToggleBtn.addEventListener("click",()=>{
    const isDark=document.body.classList.toggle("dark-theme");
    themeToggleBtn.querySelector(".topbar-dot").classList.toggle("on",isDark);
    themeToggleBtn.querySelector(".topbar-label").textContent=isDark?"TEMA OSCURO":"TEMA CLARO";
    try{ localStorage.setItem('g2g_darkTheme', isDark); }catch(e){}
    playSound('select');
  });
}

// Apply inherited players from a chain run (runs after DOM is fully ready)
setTimeout(applyInheritedPlayers, 100);
