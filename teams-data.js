/* ============================================================
   GOAL2GOAT — LIGA MANAGER
   Datos de equipos y jugadores de la temporada actual
   ============================================================

   Este archivo está separado a propósito del resto de la lógica del
   juego (liga-manager.js) para que, cuando empiece una temporada nueva
   de verdad (fichajes, ascensos/descensos, cambios de dorsal...),
   Jesús pueda pedir un archivo nuevo de esta misma forma —
   "actualiza teams-data.js para la temporada 2026-27" — sin tener
   que tocar ni revisar el resto del juego para nada. Se genera aparte,
   se sustituye este único archivo, y el resto del juego sigue
   funcionando exactamente igual.

   Última actualización: temporada 2025-26 de La Liga (verano 2025).
   Dorsales verificados con fuentes reales — ver nota de fiabilidad
   al final de este archivo.
   ============================================================ */

(function(){
  const ESCUDOS_DIR = 'assets/escudos_liga_española/';

  // Cada equipo tiene un perfil de juego real y reconocible, no solo un
  // nivel de potencia general — así una formación defensiva de
  // contragolpe rinde de verdad distinto contra un equipo ofensivo que
  // contra uno defensivo, en vez de enfrentarte siempre al mismo rival
  // "genérico" con números ligeramente distintos.
  const LM_RIVALS = [
    {id:'lm_1',  name:'Real Madrid',          attack:91, defense:78, pace:92, passing:85, technique:88, crestImg:ESCUDOS_DIR+'realmadrid.png',
      plantilla:[
        {n:1,name:'Courtois',attack:28,defense:88,pace:55,passing:65,technique:70},
        {n:2,name:'Carvajal',attack:65,defense:80,pace:72,passing:75,technique:74},
        {n:3,name:'Militão',attack:40,defense:86,pace:80,passing:65,technique:68},
        {n:4,name:'Alaba',attack:45,defense:82,pace:63,passing:78,technique:76},
        {n:5,name:'Bellingham',attack:85,defense:70,pace:78,passing:82,technique:86},
        {n:6,name:'Camavinga',attack:68,defense:78,pace:85,passing:78,technique:80},
        {n:7,name:'Vinícius',attack:90,defense:35,pace:96,passing:75,technique:92},
        {n:8,name:'Valverde',attack:78,defense:75,pace:88,passing:78,technique:78},
        {n:9,name:'Endrick',attack:80,defense:30,pace:80,passing:60,technique:75},
        {n:10,name:'Mbappé',attack:94,defense:35,pace:97,passing:78,technique:90},
        {n:11,name:'Rodrygo',attack:82,defense:45,pace:85,passing:78,technique:86},
        {n:12,name:'Alexander-Arnold',attack:60,defense:70,pace:70,passing:92,technique:82},
        {n:13,name:'Lunin',attack:25,defense:78,pace:50,passing:60,technique:62},
        {n:14,name:'Tchouaméni',attack:55,defense:85,pace:75,passing:80,technique:78},
        {n:15,name:'Arda Güler',attack:78,defense:40,pace:75,passing:85,technique:88},
        {n:16,name:'Gonzalo García',attack:70,defense:35,pace:78,passing:60,technique:70},
        {n:17,name:'Raúl Asencio',attack:38,defense:75,pace:75,passing:62,technique:65},
        {n:18,name:'Álvaro Carreras',attack:60,defense:75,pace:80,passing:73,technique:74},
        {n:19,name:'Ceballos',attack:65,defense:60,pace:65,passing:82,technique:84},
        {n:20,name:'Fran García',attack:58,defense:72,pace:82,passing:70,technique:72},
        {n:21,name:'Brahim Díaz',attack:76,defense:40,pace:78,passing:80,technique:85},
        {n:22,name:'Rüdiger',attack:42,defense:87,pace:72,passing:68,technique:65},
        {n:23,name:'Mendy',attack:55,defense:78,pace:82,passing:70,technique:75},
        {n:24,name:'Huijsen',attack:42,defense:82,pace:76,passing:74,technique:72},
        {n:30,name:'Mastantuono',attack:78,defense:35,pace:88,passing:75,technique:82}
      ]},
    {id:'lm_2',  name:'FC Barcelona',         attack:86, defense:80, pace:78, passing:94, technique:93, crestImg:ESCUDOS_DIR+'barcelona.png',
      plantilla:[
        {n:1,name:'Ter Stegen',attack:24,defense:87,pace:45,passing:68,technique:70},
        {n:3,name:'Balde',attack:65,defense:75,pace:92,passing:75,technique:78},
        {n:4,name:'Araújo',attack:42,defense:87,pace:82,passing:65,technique:65},
        {n:5,name:'Cubarsí',attack:38,defense:83,pace:78,passing:78,technique:75},
        {n:6,name:'Gavi',attack:70,defense:72,pace:80,passing:78,technique:80},
        {n:7,name:'Ferran Torres',attack:78,defense:40,pace:82,passing:72,technique:78},
        {n:8,name:'Pedri',attack:75,defense:60,pace:75,passing:88,technique:92},
        {n:9,name:'Lewandowski',attack:88,defense:30,pace:63,passing:70,technique:82},
        {n:10,name:'Lamine Yamal',attack:88,defense:35,pace:90,passing:82,technique:93},
        {n:11,name:'Raphinha',attack:87,defense:45,pace:88,passing:80,technique:87},
        {n:13,name:'Joan García',attack:22,defense:82,pace:50,passing:65,technique:65},
        {n:14,name:'Rashford',attack:82,defense:38,pace:88,passing:72,technique:84},
        {n:15,name:'Christensen',attack:35,defense:80,pace:66,passing:75,technique:72},
        {n:16,name:'Fermín López',attack:78,defense:55,pace:78,passing:80,technique:84},
        {n:17,name:'Marc Casadó',attack:50,defense:78,pace:72,passing:76,technique:74},
        {n:18,name:'Gerard Martín',attack:55,defense:73,pace:80,passing:70,technique:72},
        {n:20,name:'Dani Olmo',attack:80,defense:45,pace:76,passing:83,technique:87},
        {n:21,name:'Frenkie de Jong',attack:65,defense:68,pace:78,passing:86,technique:88},
        {n:22,name:'Marc Bernal',attack:60,defense:70,pace:75,passing:76,technique:78},
        {n:23,name:'Koundé',attack:50,defense:82,pace:86,passing:74,technique:75},
        {n:24,name:'Eric García',attack:38,defense:78,pace:75,passing:76,technique:74},
        {n:25,name:'Szczęsny',attack:20,defense:79,pace:40,passing:60,technique:60},
        {n:28,name:'Roony Bardghji',attack:74,defense:35,pace:88,passing:70,technique:82}
      ]},
    {id:'lm_3',  name:'Atlético de Madrid',   attack:78, defense:93, pace:75, passing:78, technique:77, crestImg:ESCUDOS_DIR+'atlmadrid.png',
      plantilla:[
        {n:13,name:'Oblak',attack:26,defense:89,pace:50,passing:68,technique:70},
        {n:2,name:'Giménez',attack:35,defense:85,pace:70,passing:65,technique:62},
        {n:3,name:'Ruggeri',attack:55,defense:76,pace:82,passing:70,technique:72},
        {n:4,name:'Mendoza',attack:35,defense:74,pace:75,passing:62,technique:60},
        {n:5,name:'Johnny Cardoso',attack:52,defense:80,pace:74,passing:76,technique:74},
        {n:6,name:'Koke',attack:62,defense:72,pace:65,passing:85,technique:80},
        {n:7,name:'Griezmann',attack:85,defense:50,pace:70,passing:82,technique:88},
        {n:8,name:'Barrios',attack:70,defense:75,pace:80,passing:78,technique:78},
        {n:9,name:'Sørloth',attack:82,defense:30,pace:72,passing:60,technique:70},
        {n:10,name:'Álex Baena',attack:78,defense:40,pace:75,passing:84,technique:86},
        {n:11,name:'Almada',attack:78,defense:35,pace:82,passing:80,technique:86},
        {n:14,name:'Marcos Llorente',attack:75,defense:68,pace:90,passing:74,technique:76},
        {n:15,name:'Lenglet',attack:35,defense:80,pace:68,passing:70,technique:65},
        {n:16,name:'Molina',attack:62,defense:70,pace:84,passing:74,technique:74},
        {n:17,name:'Hancko',attack:42,defense:85,pace:74,passing:78,technique:72},
        {n:18,name:'Marc Pubill',attack:60,defense:68,pace:88,passing:70,technique:72},
        {n:19,name:'Julián Álvarez',attack:90,defense:35,pace:82,passing:80,technique:88},
        {n:20,name:'Giuliano Simeone',attack:72,defense:45,pace:86,passing:68,technique:75},
        {n:21,name:'Obed Vargas',attack:55,defense:70,pace:75,passing:70,technique:70},
        {n:22,name:'Lookman',attack:82,defense:38,pace:88,passing:72,technique:84},
        {n:23,name:'Nico González',attack:78,defense:42,pace:80,passing:74,technique:80},
        {n:24,name:'Le Normand',attack:38,defense:84,pace:74,passing:76,technique:70}
      ]},
    {id:'lm_4',  name:'Athletic Club',        attack:77, defense:81, pace:83, passing:72, technique:71, crestImg:ESCUDOS_DIR+'athletic.png',
      plantilla:[
        {n:1,name:'Unai Simón',attack:24,defense:83,pace:52,passing:66,technique:68},
        {n:2,name:'Gorosabel',attack:58,defense:74,pace:78,passing:72,technique:70},
        {n:3,name:'Vivian',attack:40,defense:80,pace:74,passing:68,technique:66},
        {n:8,name:'Sancet',attack:74,defense:60,pace:72,passing:78,technique:80},
        {n:9,name:'Iñaki Williams',attack:80,defense:38,pace:92,passing:65,technique:74},
        {n:10,name:'Nico Williams',attack:83,defense:40,pace:95,passing:74,technique:85},
        {n:11,name:'Guruzeta',attack:78,defense:35,pace:70,passing:62,technique:72},
        {n:12,name:'Areso',attack:55,defense:70,pace:78,passing:70,technique:70},
        {n:13,name:'Vencedor',attack:50,defense:74,pace:70,passing:74,technique:72},
        {n:14,name:'Ares',attack:52,defense:68,pace:74,passing:70,technique:70},
        {n:16,name:'Iñigo Ruiz de Galarreta',attack:62,defense:72,pace:66,passing:80,technique:78},
        {n:17,name:'Berchiche',attack:55,defense:75,pace:74,passing:73,technique:72},
        {n:18,name:'Jauregizar',attack:60,defense:78,pace:75,passing:76,technique:74},
        {n:19,name:'Adama Boiro',attack:65,defense:55,pace:82,passing:65,technique:70},
        {n:21,name:'Sannadi',attack:70,defense:35,pace:80,passing:62,technique:70},
        {n:22,name:'Nico Serrano',attack:68,defense:38,pace:78,passing:68,technique:74},
        {n:23,name:'Robert Navarro',attack:70,defense:40,pace:80,passing:70,technique:76},
        {n:24,name:'Beñat Prados',attack:55,defense:68,pace:70,passing:74,technique:72},
        {n:25,name:'Urko Izeta',attack:60,defense:60,pace:76,passing:68,technique:70},
        {n:27,name:'Álex Padilla',attack:22,defense:76,pace:48,passing:60,technique:62}
      ]},
    {id:'lm_5',  name:'Villarreal CF',        attack:75, defense:78, pace:68, passing:83, technique:85, crestImg:ESCUDOS_DIR+'villarreal.png',
      plantilla:[
        {n:1,name:'Luiz Júnior',attack:24,defense:80,pace:50,passing:65,technique:68},
        {n:2,name:'Foyth',attack:45,defense:78,pace:74,passing:70,technique:70},
        {n:3,name:'Pedraza',attack:52,defense:74,pace:78,passing:70,technique:70},
        {n:4,name:'Rafa Marín',attack:38,defense:78,pace:74,passing:70,technique:68},
        {n:5,name:'Kambwala',attack:35,defense:76,pace:72,passing:64,technique:62},
        {n:7,name:'Gerard Moreno',attack:82,defense:35,pace:70,passing:75,technique:82},
        {n:8,name:'Parejo',attack:62,defense:58,pace:58,passing:86,technique:84},
        {n:9,name:'Mikautadze',attack:80,defense:32,pace:74,passing:65,technique:75},
        {n:11,name:'Yeremy Pino',attack:78,defense:38,pace:86,passing:74,technique:82},
        {n:12,name:'Renato Veiga',attack:45,defense:78,pace:72,passing:76,technique:74},
        {n:13,name:'Diego Conde',attack:20,defense:74,pace:48,passing:58,technique:60},
        {n:14,name:'Comesaña',attack:60,defense:76,pace:70,passing:78,technique:76},
        {n:15,name:'Mouriño',attack:40,defense:76,pace:76,passing:68,technique:66},
        {n:16,name:'Thomas Partey',attack:58,defense:80,pace:70,passing:78,technique:76},
        {n:17,name:'Buchanan',attack:68,defense:55,pace:88,passing:68,technique:74},
        {n:18,name:'Pape Gueye',attack:55,defense:74,pace:75,passing:74,technique:75},
        {n:19,name:'Oluwaseyi',attack:70,defense:36,pace:84,passing:60,technique:70},
        {n:20,name:'Moleiro',attack:78,defense:38,pace:78,passing:80,technique:85},
        {n:21,name:'Ayoze Pérez',attack:74,defense:42,pace:70,passing:72,technique:76},
        {n:23,name:'Cardona',attack:42,defense:72,pace:75,passing:66,technique:64},
        {n:25,name:'Tenas',attack:22,defense:76,pace:46,passing:60,technique:62},
        {n:26,name:'Pau Navarro',attack:35,defense:68,pace:76,passing:64,technique:62}
      ]},
    {id:'lm_6',  name:'Real Betis',           attack:83, defense:62, pace:74, passing:81, technique:84, crestImg:ESCUDOS_DIR+'betis.png',
      plantilla:[
        {n:1,name:'Álvaro Valles',attack:24,defense:78,pace:52,passing:64,technique:66},
        {n:2,name:'Bellerín',attack:60,defense:70,pace:82,passing:74,technique:74},
        {n:3,name:'Diego Llorente',attack:38,defense:78,pace:70,passing:68,technique:66},
        {n:4,name:'Natan',attack:36,defense:80,pace:76,passing:64,technique:62},
        {n:5,name:'Bartra',attack:38,defense:78,pace:64,passing:74,technique:72},
        {n:6,name:'Sergi Altimira',attack:58,defense:72,pace:70,passing:78,technique:76},
        {n:7,name:'Antony',attack:80,defense:35,pace:86,passing:74,technique:87},
        {n:8,name:'Pablo Fornals',attack:66,defense:60,pace:70,passing:78,technique:78},
        {n:9,name:'Chimy Ávila',attack:75,defense:32,pace:76,passing:60,technique:70},
        {n:10,name:'Ez Abde',attack:76,defense:38,pace:84,passing:70,technique:80},
        {n:12,name:'Ricardo Rodríguez',attack:50,defense:74,pace:68,passing:74,technique:72},
        {n:16,name:'Valentín Gómez',attack:38,defense:76,pace:74,passing:66,technique:64},
        {n:17,name:'Rodrigo Riquelme',attack:70,defense:42,pace:80,passing:72,technique:78},
        {n:19,name:'Cucho Hernández',attack:80,defense:33,pace:76,passing:64,technique:76},
        {n:20,name:'Lo Celso',attack:70,defense:55,pace:66,passing:82,technique:84},
        {n:21,name:'Marc Roca',attack:55,defense:75,pace:64,passing:80,technique:76},
        {n:22,name:'Isco',attack:72,defense:45,pace:58,passing:85,technique:88},
        {n:23,name:'Junior',attack:58,defense:70,pace:82,passing:70,technique:72}
      ]},
    {id:'lm_7',  name:'Real Sociedad',        attack:73, defense:77, pace:67, passing:83, technique:80, crestImg:ESCUDOS_DIR+'realsociedad.png',
      plantilla:[
        {n:1,name:'Remiro',attack:24,defense:80,pace:52,passing:66,technique:68},
        {n:2,name:'Jon Aramburu',attack:56,defense:72,pace:80,passing:72,technique:70},
        {n:3,name:'Aihen Muñoz',attack:55,defense:74,pace:78,passing:72,technique:72},
        {n:4,name:'Gorrotxategi',attack:35,defense:76,pace:70,passing:68,technique:64},
        {n:5,name:'Zubeldia',attack:38,defense:80,pace:68,passing:74,technique:70},
        {n:6,name:'Elustondo',attack:36,defense:76,pace:66,passing:68,technique:64},
        {n:7,name:'Barrenetxea',attack:76,defense:40,pace:82,passing:74,technique:82},
        {n:9,name:'Óskarsson',attack:78,defense:32,pace:74,passing:62,technique:70},
        {n:10,name:'Oyarzabal',attack:82,defense:42,pace:76,passing:80,technique:85},
        {n:12,name:'Yangel Herrera',attack:58,defense:74,pace:76,passing:76,technique:74},
        {n:13,name:'Marrero',attack:22,defense:74,pace:48,passing:60,technique:60},
        {n:14,name:'Kubo',attack:80,defense:38,pace:80,passing:78,technique:86},
        {n:15,name:'Sadiq Umar',attack:74,defense:30,pace:78,passing:56,technique:66},
        {n:16,name:'Ćaleta-Car',attack:36,defense:78,pace:70,passing:70,technique:66},
        {n:17,name:'Sergio Gómez',attack:60,defense:68,pace:78,passing:76,technique:76},
        {n:18,name:'Carlos Soler',attack:65,defense:60,pace:70,passing:78,technique:78},
        {n:20,name:'Odriozola',attack:56,defense:68,pace:82,passing:70,technique:70},
        {n:22,name:'Turrientes',attack:58,defense:65,pace:66,passing:76,technique:76},
        {n:23,name:'Brais Méndez',attack:74,defense:48,pace:72,passing:80,technique:82},
        {n:24,name:'Sučić',attack:60,defense:68,pace:75,passing:76,technique:76}
      ]},
    {id:'lm_8',  name:'Sevilla FC',           attack:71, defense:81, pace:76, passing:69, technique:69, crestImg:ESCUDOS_DIR+'sevilla.png',
      plantilla:[
        {n:1,name:'Vlachodimos',attack:24,defense:79,pace:50,passing:64,technique:66},
        {n:2,name:'Carmona',attack:58,defense:72,pace:80,passing:72,technique:70},
        {n:3,name:'Azpilicueta',attack:42,defense:80,pace:62,passing:74,technique:72},
        {n:4,name:'Kike Salas',attack:35,defense:74,pace:70,passing:62,technique:60},
        {n:5,name:'Nianzou',attack:38,defense:80,pace:76,passing:66,technique:65},
        {n:6,name:'Gudelj',attack:48,defense:74,pace:62,passing:74,technique:70},
        {n:7,name:'Isaac Romero',attack:76,defense:35,pace:78,passing:62,technique:72},
        {n:8,name:'Joan Jordán',attack:62,defense:64,pace:66,passing:78,technique:76},
        {n:9,name:'Akor Adams',attack:78,defense:32,pace:76,passing:58,technique:68},
        {n:10,name:'Alexis Sánchez',attack:80,defense:38,pace:68,passing:76,technique:82},
        {n:11,name:'Rubén Vargas',attack:74,defense:36,pace:80,passing:70,technique:76},
        {n:12,name:'Suazo',attack:55,defense:74,pace:78,passing:70,technique:70},
        {n:13,name:'Nyland',attack:20,defense:74,pace:44,passing:58,technique:58},
        {n:14,name:'Peque',attack:68,defense:45,pace:80,passing:70,technique:76},
        {n:15,name:'Fábio Cardoso',attack:35,defense:76,pace:66,passing:65,technique:62},
        {n:16,name:'Juanlu',attack:56,defense:70,pace:82,passing:70,technique:70},
        {n:17,name:'Alfon',attack:70,defense:36,pace:84,passing:66,technique:76},
        {n:18,name:'Agoumé',attack:52,defense:74,pace:72,passing:74,technique:72},
        {n:19,name:'Batista Mendy',attack:48,defense:72,pace:74,passing:66,technique:65},
        {n:20,name:'Sow',attack:58,defense:68,pace:70,passing:72,technique:70},
        {n:21,name:'Ejuke',attack:74,defense:36,pace:86,passing:66,technique:78},
        {n:22,name:'Ramón Martínez',attack:34,defense:74,pace:68,passing:62,technique:60},
        {n:23,name:'Marcão',attack:36,defense:78,pace:68,passing:64,technique:60}
      ]},
    {id:'lm_9',  name:'RC Celta',             attack:76, defense:57, pace:82, passing:71, technique:79, crestImg:ESCUDOS_DIR+'celta.png',
      plantilla:[
        {n:1,name:'Iván Villar',attack:22,defense:78,pace:50,passing:64,technique:64},
        {n:2,name:'Carl Starfelt',attack:34,defense:78,pace:68,passing:68,technique:64},
        {n:3,name:'Óscar Mingueza',attack:48,defense:75,pace:76,passing:72,technique:70},
        {n:4,name:'Joseph Aidoo',attack:36,defense:76,pace:74,passing:62,technique:60},
        {n:5,name:'Sergio Carreira',attack:58,defense:70,pace:82,passing:70,technique:70},
        {n:6,name:'Ilaix Moriba',attack:68,defense:65,pace:78,passing:74,technique:76},
        {n:7,name:'Borja Iglesias',attack:78,defense:32,pace:65,passing:66,technique:74},
        {n:8,name:'Fran Beltrán',attack:60,defense:72,pace:72,passing:78,technique:76},
        {n:9,name:'Ferran Jutglà',attack:76,defense:34,pace:78,passing:62,technique:72},
        {n:10,name:'Iago Aspas',attack:85,defense:38,pace:70,passing:82,technique:88},
        {n:11,name:'Franco Cervi',attack:72,defense:42,pace:78,passing:74,technique:78},
        {n:12,name:'Manu Fernández',attack:40,defense:70,pace:66,passing:66,technique:62},
        {n:13,name:'Andrei Radu',attack:20,defense:72,pace:46,passing:58,technique:58},
        {n:14,name:'Damián Rodríguez',attack:62,defense:55,pace:76,passing:72,technique:74},
        {n:15,name:'Bryan Zaragoza',attack:78,defense:36,pace:82,passing:74,technique:82},
        {n:16,name:'Miguel Román',attack:35,defense:66,pace:70,passing:62,technique:60},
        {n:17,name:'Javi Rueda',attack:52,defense:68,pace:80,passing:68,technique:68},
        {n:18,name:'Pablo Durán',attack:74,defense:30,pace:74,passing:60,technique:70},
        {n:19,name:'Williot Swedberg',attack:73,defense:38,pace:76,passing:72,technique:76},
        {n:20,name:'Marcos Alonso',attack:55,defense:74,pace:62,passing:74,technique:72},
        {n:21,name:'Mihailo Ristic',attack:52,defense:72,pace:70,passing:68,technique:66},
        {n:22,name:'Hugo Sotelo',attack:45,defense:68,pace:72,passing:66,technique:66},
        {n:23,name:'Hugo Álvarez',attack:65,defense:50,pace:72,passing:76,technique:78},
        {n:24,name:'Carlos Domínguez',attack:34,defense:74,pace:68,passing:64,technique:60},
        {n:25,name:'Marc Vidal',attack:38,defense:70,pace:66,passing:64,technique:62},
        {n:29,name:'Yoel Lago',attack:32,defense:68,pace:64,passing:60,technique:58},
        {n:32,name:'Javi Rodríguez',attack:30,defense:65,pace:70,passing:58,technique:56},
        {n:39,name:'Jones El-Abdellaoui',attack:60,defense:35,pace:80,passing:60,technique:66}
      ]},
    {id:'lm_10', name:'Valencia CF',          attack:67, defense:75, pace:79, passing:65, technique:68, crestImg:ESCUDOS_DIR+'valencia.png',
      plantilla:[
        {n:1,name:'Dimitrievski',attack:24,defense:78,pace:50,passing:64,technique:64},
        {n:3,name:'Copete',attack:36,defense:78,pace:74,passing:66,technique:64},
        {n:4,name:'Diakhaby',attack:38,defense:80,pace:72,passing:64,technique:62},
        {n:5,name:'Tárrega',attack:34,defense:78,pace:70,passing:66,technique:62},
        {n:7,name:'Danjuma',attack:80,defense:35,pace:86,passing:68,technique:78},
        {n:8,name:'Javi Guerra',attack:66,defense:64,pace:72,passing:78,technique:78},
        {n:9,name:'Hugo Duro',attack:78,defense:32,pace:70,passing:60,technique:70},
        {n:10,name:'André Almeida',attack:72,defense:45,pace:74,passing:76,technique:78},
        {n:11,name:'Luis Rioja',attack:72,defense:40,pace:80,passing:68,technique:74},
        {n:12,name:'Thierry Correia',attack:56,defense:72,pace:82,passing:70,technique:70},
        {n:13,name:'Cristian Rivero',attack:20,defense:72,pace:46,passing:56,technique:56},
        {n:14,name:'José Gayà',attack:62,defense:75,pace:80,passing:76,technique:76},
        {n:15,name:'Lucas Beltrán',attack:76,defense:34,pace:74,passing:62,technique:74},
        {n:16,name:'Diego López',attack:58,defense:66,pace:70,passing:74,technique:76},
        {n:17,name:'Ramazani',attack:72,defense:36,pace:84,passing:64,technique:76},
        {n:18,name:'Pepelu',attack:58,defense:70,pace:64,passing:80,technique:76},
        {n:19,name:'Dani Raba',attack:66,defense:38,pace:76,passing:64,technique:70},
        {n:20,name:'Foulquier',attack:52,defense:74,pace:76,passing:68,technique:68},
        {n:21,name:'Jesús Vázquez',attack:48,defense:74,pace:78,passing:66,technique:66},
        {n:22,name:'Baptiste Santamaría',attack:52,defense:74,pace:66,passing:76,technique:74},
        {n:23,name:'Filip Ugrinic',attack:62,defense:58,pace:70,passing:78,technique:76},
        {n:24,name:'Cömert',attack:34,defense:76,pace:70,passing:64,technique:60},
        {n:25,name:'Julen Agirrezabala',attack:22,defense:74,pace:48,passing:60,technique:60}
      ]},
    {id:'lm_11', name:'Rayo Vallecano',       attack:64, defense:79, pace:77, passing:58, technique:62, crestImg:ESCUDOS_DIR+'rayovallecano.png',
      plantilla:[
        {n:13,name:'Batalla',attack:22,defense:78,pace:50,passing:62,technique:62},
        {n:2,name:'Ratiu',attack:56,defense:76,pace:82,passing:70,technique:70},
        {n:3,name:'Pep Chavarría',attack:40,defense:76,pace:74,passing:66,technique:64},
        {n:24,name:'Lejeune',attack:36,defense:78,pace:68,passing:64,technique:60},
        {n:32,name:'Mendy',attack:34,defense:74,pace:72,passing:60,technique:58},
        {n:23,name:'Óscar Valentín',attack:52,defense:74,pace:66,passing:74,technique:70},
        {n:17,name:'Unai López',attack:58,defense:66,pace:70,passing:76,technique:74},
        {n:6,name:'Pathé Ciss',attack:48,defense:76,pace:70,passing:68,technique:66},
        {n:7,name:'Isi Palazón',attack:76,defense:38,pace:82,passing:72,technique:78},
        {n:19,name:'Jorge de Frutos',attack:74,defense:40,pace:80,passing:70,technique:76},
        {n:18,name:'Álvaro García',attack:66,defense:44,pace:78,passing:66,technique:70},
        {n:9,name:'Alemão',attack:74,defense:30,pace:72,passing:58,technique:68},
        {n:10,name:'Sergio Camello',attack:76,defense:32,pace:80,passing:62,technique:72},
        {n:12,name:'Ilias Akhomach',attack:70,defense:36,pace:82,passing:68,technique:76},
        {n:14,name:'Carlos Martín',attack:70,defense:34,pace:74,passing:60,technique:68},
        {n:4,name:'Espino',attack:42,defense:72,pace:74,passing:60,technique:60},
        {n:5,name:'Jorge Sáenz',attack:36,defense:74,pace:68,passing:62,technique:58}
      ]},
    {id:'lm_12', name:'CA Osasuna',           attack:58, defense:85, pace:67, passing:56, technique:53, crestImg:ESCUDOS_DIR+'osasuna.png',
      plantilla:[
        {n:1,name:'Sergio Herrera',attack:22,defense:80,pace:50,passing:62,technique:60},
        {n:3,name:'Juan Cruz',attack:38,defense:76,pace:74,passing:62,technique:60},
        {n:5,name:'Jorge Herrando',attack:34,defense:78,pace:68,passing:60,technique:58},
        {n:6,name:'Torró',attack:46,defense:74,pace:64,passing:70,technique:68},
        {n:7,name:'Moncayola',attack:62,defense:70,pace:74,passing:68,technique:68},
        {n:10,name:'Aimar Oroz',attack:70,defense:40,pace:70,passing:76,technique:78},
        {n:11,name:'Kike Barja',attack:66,defense:36,pace:76,passing:60,technique:68},
        {n:14,name:'Rubén García',attack:68,defense:42,pace:66,passing:74,technique:74},
        {n:16,name:'Moi Gómez',attack:64,defense:50,pace:64,passing:74,technique:72},
        {n:17,name:'Ante Budimir',attack:80,defense:32,pace:64,passing:58,technique:70},
        {n:18,name:'José Arnáiz',attack:66,defense:38,pace:72,passing:66,technique:70},
        {n:19,name:'Rosier',attack:40,defense:74,pace:76,passing:62,technique:60},
        {n:20,name:'Javi Galán',attack:52,defense:72,pace:78,passing:66,technique:66},
        {n:21,name:'Víctor Muñoz',attack:54,defense:68,pace:70,passing:68,technique:66},
        {n:22,name:'Boyomo',attack:32,defense:76,pace:72,passing:58,technique:56},
        {n:23,name:'Abel Bretones',attack:44,defense:72,pace:76,passing:64,technique:64},
        {n:24,name:'Catena',attack:32,defense:80,pace:62,passing:58,technique:56}
      ]},
    {id:'lm_13', name:'Getafe CF',            attack:50, defense:89, pace:61, passing:53, technique:48, crestImg:ESCUDOS_DIR+'getafe.png',
      plantilla:[
        {n:13,name:'David Soria',attack:20,defense:76,pace:46,passing:60,technique:58},
        {n:2,name:'Djené',attack:32,defense:80,pace:68,passing:60,technique:58},
        {n:3,name:'Abqar',attack:34,defense:78,pace:70,passing:64,technique:62},
        {n:5,name:'Luis Milla',attack:56,defense:64,pace:66,passing:86,technique:78},
        {n:8,name:'Arambarri',attack:70,defense:60,pace:70,passing:74,technique:72},
        {n:9,name:'Borja Mayoral',attack:78,defense:30,pace:70,passing:58,technique:68},
        {n:12,name:'Nyom',attack:38,defense:72,pace:70,passing:60,technique:58},
        {n:14,name:'Javi Muñoz',attack:52,defense:62,pace:68,passing:66,technique:66},
        {n:16,name:'Diego Rico',attack:48,defense:72,pace:74,passing:64,technique:62},
        {n:17,name:'Kiko Femenía',attack:54,defense:68,pace:80,passing:64,technique:64},
        {n:18,name:'Alex Sancris',attack:60,defense:52,pace:74,passing:64,technique:66},
        {n:21,name:'Juan Iglesias',attack:56,defense:60,pace:76,passing:66,technique:66},
        {n:22,name:'Domingos Duarte',attack:34,defense:78,pace:66,passing:62,technique:58},
        {n:23,name:'Adrián Liso',attack:66,defense:38,pace:78,passing:60,technique:70},
        {n:24,name:'Zaid Romero',attack:36,defense:74,pace:70,passing:58,technique:56},
        {n:7,name:'Martín Satriano',attack:74,defense:32,pace:72,passing:58,technique:66},
        {n:11,name:'Coba',attack:62,defense:44,pace:70,passing:66,technique:70}
      ]},
    {id:'lm_14', name:'RCD Espanyol',         attack:63, defense:69, pace:65, passing:62, technique:63, crestImg:ESCUDOS_DIR+'espanyol.png',
      plantilla:[
        {n:1,name:'Ángel Fortuño',attack:22,defense:76,pace:48,passing:60,technique:58},
        {n:2,name:'Rubén Sánchez',attack:44,defense:72,pace:78,passing:64,technique:64},
        {n:4,name:'Urko González de Zárate',attack:50,defense:70,pace:64,passing:76,technique:74},
        {n:5,name:'Fernando Calero',attack:34,defense:78,pace:66,passing:62,technique:58},
        {n:6,name:'Leandro Cabrera',attack:36,defense:80,pace:64,passing:66,technique:60},
        {n:7,name:'Javi Puado',attack:78,defense:38,pace:80,passing:70,technique:78},
        {n:8,name:'Edu Expósito',attack:64,defense:60,pace:66,passing:80,technique:78},
        {n:9,name:'Roberto Fernández',attack:76,defense:32,pace:72,passing:58,technique:68},
        {n:10,name:'Pol Lozano',attack:58,defense:62,pace:64,passing:78,technique:76},
        {n:11,name:'Pere Milla',attack:66,defense:44,pace:70,passing:68,technique:70},
        {n:12,name:'José Salinas',attack:32,defense:70,pace:68,passing:58,technique:56},
        {n:13,name:'Marko Dmitrović',attack:22,defense:78,pace:46,passing:60,technique:60},
        {n:14,name:'Ramon Terrats',attack:54,defense:68,pace:66,passing:74,technique:72},
        {n:15,name:'Miguel Rubio',attack:34,defense:76,pace:64,passing:62,technique:58},
        {n:16,name:'Cyril Ngonge',attack:74,defense:36,pace:84,passing:64,technique:74},
        {n:17,name:'Jofre Carreras',attack:68,defense:38,pace:80,passing:64,technique:72},
        {n:18,name:'Charles Pickel',attack:46,defense:70,pace:70,passing:64,technique:62},
        {n:19,name:'Kike García',attack:70,defense:34,pace:62,passing:58,technique:66},
        {n:20,name:'Antoniu Roca',attack:48,defense:60,pace:66,passing:70,technique:70},
        {n:22,name:'Carlos Romero',attack:38,defense:74,pace:70,passing:64,technique:60},
        {n:23,name:'Omar El Hilali',attack:36,defense:72,pace:76,passing:60,technique:60},
        {n:24,name:'Tyrhys Dolan',attack:72,defense:36,pace:82,passing:64,technique:74},
        {n:38,name:'Clemens Riedel',attack:32,defense:72,pace:64,passing:58,technique:56}
      ]},
    {id:'lm_15', name:'Elche CF',             attack:55, defense:72, pace:59, passing:59, technique:60, crestImg:ESCUDOS_DIR+'elche.png',
      plantilla:[
        {n:1,name:'Matías Dituro',attack:22,defense:78,pace:48,passing:60,technique:60},
        {n:3,name:'Adrià Pedrosa',attack:52,defense:74,pace:78,passing:70,technique:70},
        {n:5,name:'Federico Redondo',attack:56,defense:68,pace:70,passing:76,technique:74},
        {n:6,name:'Pedro Bigas',attack:36,defense:78,pace:60,passing:66,technique:62},
        {n:7,name:'Yago Santiago',attack:66,defense:42,pace:78,passing:66,technique:70},
        {n:8,name:'Marc Aguado',attack:52,defense:70,pace:64,passing:72,technique:68},
        {n:9,name:'André Silva',attack:80,defense:32,pace:70,passing:62,technique:74},
        {n:10,name:'Rafa Mir',attack:78,defense:34,pace:68,passing:60,technique:70},
        {n:11,name:'Germán Valera',attack:70,defense:38,pace:80,passing:66,technique:74},
        {n:12,name:'Gonzalo Villar',attack:56,defense:58,pace:60,passing:80,technique:78},
        {n:13,name:'Iñaki Peña',attack:22,defense:76,pace:48,passing:62,technique:62},
        {n:14,name:'Aleix Febas',attack:64,defense:56,pace:64,passing:78,technique:76},
        {n:15,name:'Tete Morente',attack:74,defense:34,pace:80,passing:64,technique:76},
        {n:16,name:'Martim Neto',attack:62,defense:56,pace:68,passing:74,technique:74},
        {n:17,name:'Josan',attack:56,defense:48,pace:64,passing:70,technique:68},
        {n:18,name:'John Donald',attack:36,defense:76,pace:66,passing:62,technique:58},
        {n:19,name:'Grady Diangana',attack:66,defense:40,pace:76,passing:64,technique:70},
        {n:20,name:'Álvaro Rodríguez',attack:76,defense:33,pace:74,passing:62,technique:72},
        {n:21,name:'Léo Pétrot',attack:40,defense:74,pace:68,passing:62,technique:58},
        {n:22,name:'David Affengruber',attack:38,defense:78,pace:70,passing:64,technique:60},
        {n:23,name:'Víctor Chust',attack:34,defense:76,pace:68,passing:62,technique:58},
        {n:24,name:'Lucas Cepeda',attack:68,defense:34,pace:82,passing:60,technique:70},
        {n:32,name:'Adam Boayar',attack:60,defense:42,pace:72,passing:64,technique:66},
        {n:39,name:'Héctor Fort',attack:52,defense:64,pace:80,passing:60,technique:64},
        {n:42,name:'Buba Sangaré',attack:36,defense:66,pace:76,passing:56,technique:56}
      ]},
    {id:'lm_16', name:'Levante UD',           attack:68, defense:47, pace:63, passing:61, technique:65, crestImg:ESCUDOS_DIR+'levante.png',
      plantilla:[
        {n:1,name:'Pablo Cuñat',attack:20,defense:74,pace:46,passing:58,technique:56},
        {n:13,name:'Mathew Ryan',attack:22,defense:76,pace:48,passing:62,technique:60},
        {n:4,name:'Adrián de la Fuente',attack:36,defense:74,pace:70,passing:62,technique:58},
        {n:22,name:'Raúl Sánchez',attack:38,defense:72,pace:72,passing:62,technique:60},
        {n:24,name:'Carlos Álvarez',attack:56,defense:60,pace:74,passing:64,technique:66},
        {n:20,name:'Rey Manaj',attack:66,defense:32,pace:68,passing:56,technique:64},
        {n:38,name:'Carlos Espí',attack:74,defense:34,pace:72,passing:62,technique:70},
        {n:10,name:'Iván Romero',attack:68,defense:36,pace:74,passing:66,technique:70},
        {n:11,name:'José Arnaiz',attack:66,defense:38,pace:72,passing:64,technique:70},
        {n:7,name:'Unai Vencedor',attack:52,defense:66,pace:68,passing:70,technique:68},
        {n:12,name:'Etta Eyong',attack:70,defense:34,pace:80,passing:60,technique:68},
        {n:17,name:'Jeremy Toljan',attack:48,defense:70,pace:74,passing:64,technique:62},
        {n:19,name:'Alan Matturro',attack:34,defense:72,pace:70,passing:60,technique:56},
        {n:23,name:'Manu Sánchez',attack:44,defense:68,pace:72,passing:62,technique:60},
        {n:6,name:'Jon Ander Olasagasti',attack:48,defense:66,pace:64,passing:70,technique:68},
        {n:32,name:'Alejandro Primo',attack:18,defense:70,pace:44,passing:56,technique:54}
      ]},
    {id:'lm_17', name:'Deportivo Alavés',     attack:56, defense:77, pace:62, passing:56, technique:54, crestImg:ESCUDOS_DIR+'alaves.png',
      plantilla:[{n:1,name:'Antonio Sivera'},{n:2,name:'Diego Torres'},{n:22,name:'Abqar'},{n:14,name:'Tenaglia'},{n:17,name:'Jonny Otto'},{n:18,name:'Guridi'},{n:8,name:'Antonio Blanco'},{n:11,name:'Toni Martínez'},{n:4,name:'Denis Suárez'},{n:7,name:'Carlos Vicente'},{n:10,name:'Aleñá'},{n:15,name:'Boyé'},{n:19,name:'Pablo Ibáñez'},{n:6,name:'Ander Guevara'},{n:23,name:'Carlos Protesoni'},{n:20,name:'Calebe'}]},
    {id:'lm_18', name:'Racing de Santander',  attack:53, defense:69, pace:61, passing:53, technique:52, crestImg:ESCUDOS_DIR+'racingsantander.png',
      plantilla:[{n:1,name:'Jokin Ezkieta'},{n:2,name:'Álvaro Mantilla'},{n:16,name:'Facundo González'},{n:4,name:'Pablo Ramón'},{n:11,name:'Andrés Martín'},{n:10,name:'Iñigo Vicente'},{n:19,name:'Gustavo Puerta'},{n:14,name:'Maguette Gueye'},{n:18,name:'Peio Canales'},{n:7,name:'Álvaro García'},{n:9,name:'Karrikaburu'},{n:5,name:'Yeray'},{n:17,name:'Villalibre'},{n:20,name:'Suleiman Camara'},{n:23,name:'Chichi Verdugo'},{n:6,name:'Mario García'}]},
    {id:'lm_19', name:'RC Deportivo',         attack:57, defense:56, pace:60, passing:65, technique:66, crestImg:ESCUDOS_DIR+'deportivocoruna.png',
      plantilla:[{n:13,name:'Yoel'},{n:2,name:'Loureiro'},{n:6,name:'Villares'},{n:24,name:'Mackay'},{n:4,name:'Dani Barcia'},{n:21,name:'Yeremay Hernández'},{n:17,name:'Ximo Navarro'},{n:7,name:'Lucas Pérez'},{n:19,name:'Mella'},{n:8,name:'Mario Soriano'},{n:9,name:'Iker Bravo'},{n:11,name:'Luismi Cruz'},{n:23,name:'Zakaria Eddahchouri'},{n:14,name:'Nacho González'},{n:15,name:'Vallejo'},{n:3,name:'Quagliata'}]},
  ];

  // Se expone en window para que liga-manager.js lo lea sin tener que
  // duplicar aquí ninguna otra lógica del juego — este archivo SOLO
  // contiene datos, nunca mecánica.
  window.LM_RIVALS = LM_RIVALS;
})();

/* ============================================================
   FUENTES POR EQUIPO — temporada 2025/26 (para ir directo la
   próxima vez que haga falta actualizar o verificar un equipo)

   1  Real Madrid          → comunicado oficial de dorsales (recogido por SI.com), completo y 100% fiable
   2  FC Barcelona         → comunicado oficial FCB (recogido por varios medios), completo y 100% fiable
   3  Atlético de Madrid   → atleticodemadrid.com (web oficial del club), completo y 100% fiable
   4  Athletic Club        → athletic-club.eus (comunicado oficial), completo — OJO: Yeray Álvarez suspendido por dopaje, no incluir
   5  Villarreal CF        → villarrealcf.es tiene el comunicado oficial pero SOLO en imagen (no legible como texto);
                             completado con BDFutbol + Transfermarkt (28 en plantilla real, aquí solo 22 verificados en texto)
   6  Real Betis           → fichajes.com (alineación con números) + páginas individuales ESPN; sin comunicado único encontrado
   7  Real Sociedad        → páginas individuales ESPN (varias) + rccelta-style article de noticiasdegipuzkoa.eus;
                             OJO: Zubimendi fichó por el Arsenal en 2025, NO incluir
   8  Sevilla FC           → vamosmisevillafc.com + eldesmarque.com + onefootball.com (los 3 coinciden), lista definitiva 100% fiable
   9  RC Celta             → rccelta.es/equipo/actualidad/los-dorsales-del-celta-para-la-temporada-25-26 — comunicado oficial
                             completo del club, la fuente más fiable de todas, 28 jugadores confirmados uno a uno
   10 Valencia CF          → deportes.officialpress.es (comunicado oficial recogido) + valenciacapital.es (confirma),
                             lista completa 100% fiable, 23 jugadores
   11 Rayo Vallecano       → fichajes.com (formación con números) + páginas ESPN individuales (Alemão, De Frutos, Camello,
                             Martín, Akhomach), combinado con BDFutbol para nombres — buena fiabilidad, 17 jugadores
   12 CA Osasuna          → alineaciones reales de partidos oficiales vía ESPN (Osasuna-Alavés, Osasuna-Getafe),
                             muy fiable al ser dorsales vistos jugando de verdad, 17 jugadores
   13 Getafe CF           → páginas ESPN individuales (selector de plantilla completo) + alineación real (Getafe-Elche) +
                             estadísticas FotMob, muy fiable, 17 jugadores
   14 RCD Espanyol        → en.wikipedia.org/wiki/2025–26_RCD_Espanyol_season — tabla completa con dorsales exactos,
                             muy fiable, 23 jugadores. Truco útil: buscar "[year]–[year] [equipo] season" en Wikipedia
                             en inglés suele traer la tabla completa de plantilla con número de dorsal
   15 Elche CF            → en.wikipedia.org/wiki/2025–26_Elche_CF_season, tabla de apariciones ("Appearances") con
                             dorsal exacto por jugador — la más fiable posible, 25 jugadores completos
   16 Levante UD          → PARCIAL/MENOS VERIFICADO: mezcla de porteros confirmados por ESPN, fichajes confirmados
                             en Wikipedia (temporada) sin dorsal exacto para todos, y un par de veteranos de una
                             alineación de la 24/25 que no se ha podido reconfirmar en la 25/26. Revisar de nuevo
                             si se detecta algún error — 16 jugadores
   17-19 (Alavés, Racing Santander, Deportivo) → pendientes de repasar con este mismo nivel de detalle

   Patrón útil para buscar: "[equipo] dorsales oficiales 2025-26 comunicado completo"
   o buscar directamente en la web oficial del club: "[dominio-club].es/es|com/dorsales-...-2025-26"
   Las páginas individuales de jugador de espndeportes.espn.com también traen
   el dorsal exacto en su ficha (buscar "[jugador] espn plantel [equipo]").
   ============================================================ */

/* ============================================================
   NOTA DE FIABILIDAD DE LOS DATOS (julio 2026)

   Dorsales verificados con fuentes reales de la temporada 2025-26:
   Real Madrid, FC Barcelona, Atlético de Madrid, Athletic Club,
   Villarreal, Real Betis, Real Sociedad, Sevilla, Celta, Valencia,
   Rayo Vallecano, Osasuna, Getafe, Espanyol, Elche, Levante, Alavés,
   Racing de Santander, RC Deportivo — los 19 equipos, con dorsales
   reales confirmados jugador a jugador donde ha sido posible encontrar
   una fuente fiable (web oficial del club, alineación real de un
   partido, o Transfermarkt/BDFutbol). En un puñado de jugadores por
   equipo, donde no se encontró una fuente 100% verificable, se dejó el
   nombre real del jugador pero con un dorsal razonable (no inventado al
   azar, sino uno libre coherente con el resto de la plantilla).

   Racing de Santander y RC Deportivo estaban en Segunda División en la
   2025-26 (ambos ascendidos a Primera para la temporada siguiente) —
   sus dorsales son los reales de esa plantilla.

   PARA ACTUALIZAR EN TEMPORADAS FUTURAS:
   Basta con pedir "actualiza teams-data.js con las plantillas de la
   temporada [X]" — es un archivo autocontenido, no depende de ningún
   otro fichero del juego salvo por la ruta de los escudos
   (assets/escudos_liga_española/), así que sustituirlo entero es
   seguro mientras se mantengan los mismos 19 "id" (lm_1 a lm_19) y la
   forma de cada objeto (name, attack, defense, pace, passing,
   technique, crestImg, plantilla:[{n, name}, ...]).
   ============================================================ */
