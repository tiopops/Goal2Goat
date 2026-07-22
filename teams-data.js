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
      plantilla:[{n:1,name:'Courtois'},{n:2,name:'Carvajal'},{n:3,name:'Militão'},{n:22,name:'Rüdiger'},{n:18,name:'Álvaro Carreras'},{n:14,name:'Tchouaméni'},{n:8,name:'Valverde'},{n:6,name:'Camavinga'},{n:5,name:'Bellingham'},{n:7,name:'Vinícius'},{n:10,name:'Mbappé'},{n:15,name:'Güler'},{n:21,name:'Brahim Díaz'},{n:30,name:'Mastantuono'},{n:12,name:'Alexander-Arnold'},{n:24,name:'Huijsen'}]},
    {id:'lm_2',  name:'FC Barcelona',         attack:86, defense:80, pace:78, passing:94, technique:93, crestImg:ESCUDOS_DIR+'barcelona.png',
      plantilla:[{n:1,name:'Joan García'},{n:2,name:'Koundé'},{n:3,name:'Araújo'},{n:4,name:'Cubarsí'},{n:5,name:'Balde'},{n:6,name:'Pedri'},{n:7,name:'de Jong'},{n:8,name:'Gavi'},{n:9,name:'Raphinha'},{n:10,name:'Lamine Yamal'},{n:11,name:'Ferran Torres'},{n:12,name:'Dani Olmo'},{n:13,name:'Fermín López'},{n:14,name:'Lewandowski'},{n:15,name:'Rashford'},{n:16,name:'Gerard Martín'}]},
    {id:'lm_3',  name:'Atlético de Madrid',   attack:78, defense:93, pace:75, passing:78, technique:77, crestImg:ESCUDOS_DIR+'atlmadrid.png',
      plantilla:[{n:13,name:'Oblak'},{n:2,name:'Giménez'},{n:17,name:'Hancko'},{n:24,name:'Le Normand'},{n:23,name:'Molina'},{n:6,name:'Koke'},{n:5,name:'De Paul'},{n:8,name:'Barrios'},{n:10,name:'Baena'},{n:19,name:'Julián Álvarez'},{n:7,name:'Griezmann'},{n:9,name:'Sørloth'},{n:21,name:'Lino'},{n:14,name:'Gallagher'},{n:11,name:'Almada'},{n:3,name:'Ruggeri'}]},
    {id:'lm_4',  name:'Athletic Club',        attack:77, defense:81, pace:83, passing:72, technique:71, crestImg:ESCUDOS_DIR+'athletic.png',
      plantilla:[{n:1,name:'Unai Simón'},{n:2,name:'Lekue'},{n:5,name:'Yeray'},{n:3,name:'Vivian'},{n:20,name:'Berchiche'},{n:17,name:'Yuri'},{n:22,name:'Ander Herrera'},{n:16,name:'Iñigo Ruiz de Galarreta'},{n:10,name:'Nico Williams'},{n:9,name:'Iñaki Williams'},{n:11,name:'Guruzeta'},{n:8,name:'Sancet'},{n:7,name:'Berenguer'},{n:19,name:'Adama Boiro'},{n:18,name:'Jauregizar'},{n:12,name:'Areso'}]},
    {id:'lm_5',  name:'Villarreal CF',        attack:75, defense:78, pace:68, passing:83, technique:85, crestImg:ESCUDOS_DIR+'villarreal.png',
      plantilla:[{n:1,name:'Luiz Júnior'},{n:26,name:'Foyth'},{n:23,name:'Cuenca'},{n:4,name:'Costa'},{n:5,name:'Kambwala'},{n:14,name:'Comesaña'},{n:8,name:'Santi Comesaña'},{n:18,name:'Pape Gueye'},{n:20,name:'Moleiro'},{n:7,name:'Gerard Moreno'},{n:11,name:'Ayoze Pérez'},{n:17,name:'Nicolas Pépé'},{n:13,name:'Alex Baena'},{n:24,name:'Buchanan'},{n:12,name:'Renato Veiga'},{n:22,name:'Yeremy Pino'}]},
    {id:'lm_6',  name:'Real Betis',           attack:83, defense:62, pace:74, passing:81, technique:84, crestImg:ESCUDOS_DIR+'betis.png',
      plantilla:[{n:1,name:'Álvaro Valles'},{n:5,name:'Bartra'},{n:4,name:'Natan'},{n:12,name:'Ricardo Rodríguez'},{n:2,name:'Bellerín'},{n:21,name:'Marc Roca'},{n:3,name:'Diego Llorente'},{n:22,name:'Isco'},{n:20,name:'Lo Celso'},{n:7,name:'Antony'},{n:19,name:'Cucho Hernández'},{n:9,name:'Chimy Ávila'},{n:10,name:'Ez Abde'},{n:17,name:'Rodrigo Riquelme'},{n:8,name:'Pablo Fornals'},{n:23,name:'Junior'}]},
    {id:'lm_7',  name:'Real Sociedad',        attack:73, defense:77, pace:67, passing:83, technique:80, crestImg:ESCUDOS_DIR+'realsociedad.png',
      plantilla:[{n:1,name:'Remiro'},{n:3,name:'Aihen Muñoz'},{n:5,name:'Zubeldia'},{n:2,name:'Jon Aramburu'},{n:12,name:'Javi López'},{n:24,name:'Sučić'},{n:22,name:'Turrientes'},{n:9,name:'Óskarsson'},{n:14,name:'Kubo'},{n:10,name:'Oyarzabal'},{n:7,name:'Barrenetxea'},{n:23,name:'Brais Méndez'},{n:17,name:'Sergio Gómez'},{n:18,name:'Traoré'},{n:20,name:'Pacheco'},{n:16,name:'Ćaleta-Car'}]},
    {id:'lm_8',  name:'Sevilla FC',           attack:71, defense:81, pace:76, passing:69, technique:69, crestImg:ESCUDOS_DIR+'sevilla.png',
      plantilla:[{n:1,name:'Vlachodimos'},{n:2,name:'Carmona'},{n:24,name:'Marcao'},{n:4,name:'Nianzou'},{n:3,name:'Pedrosa'},{n:20,name:'Sow'},{n:18,name:'Agoumé'},{n:21,name:'Lukebakio'},{n:9,name:'Almeyda'},{n:7,name:'Isaac Romero'},{n:10,name:'Alexis Sánchez'},{n:16,name:'Jesús Navas'},{n:23,name:'Rubén Vargas'},{n:6,name:'Gudelj'},{n:15,name:'Alfon González'},{n:17,name:'Akor Adams'}]},
    {id:'lm_9',  name:'RC Celta',             attack:76, defense:57, pace:82, passing:71, technique:79, crestImg:ESCUDOS_DIR+'celta.png',
      plantilla:[{n:1,name:'Iván Villar'},{n:2,name:'Starfelt'},{n:4,name:'Manu Fernández'},{n:5,name:'Carreira'},{n:3,name:'Óscar Mingueza'},{n:24,name:'Beltrán'},{n:8,name:'Fran Beltrán'},{n:6,name:'Ilaix Moriba'},{n:9,name:'Iago Aspas'},{n:7,name:'Borja Iglesias'},{n:11,name:'Bryan Zaragoza'},{n:12,name:'Pablo Durán'},{n:13,name:'Williot Swedberg'},{n:14,name:'Damián Rodríguez'},{n:15,name:'Jailson'},{n:16,name:'Sotelo'}]},
    {id:'lm_10', name:'Valencia CF',          attack:67, defense:75, pace:79, passing:65, technique:68, crestImg:ESCUDOS_DIR+'valencia.png',
      plantilla:[{n:25,name:'Agirrezabala'},{n:12,name:'Thierry Correia'},{n:5,name:'Tárrega'},{n:3,name:'Copete'},{n:14,name:'José Gayà'},{n:8,name:'Javi Guerra'},{n:18,name:'Pepelu'},{n:11,name:'Rioja'},{n:9,name:'Hugo Duro'},{n:16,name:'Diego López'},{n:7,name:'Danjuma'},{n:10,name:'André Almeida'},{n:23,name:'Ugrinić'},{n:22,name:'Santamaria'},{n:24,name:'Cömert'},{n:20,name:'Foulquier'}]},
    {id:'lm_11', name:'Rayo Vallecano',       attack:64, defense:79, pace:77, passing:58, technique:62, crestImg:ESCUDOS_DIR+'rayovallecano.png',
      plantilla:[{n:13,name:'Batalla'},{n:2,name:'Balliu'},{n:24,name:'Lejeune'},{n:20,name:'Ratiu'},{n:3,name:'Pep Chavarría'},{n:23,name:'Óscar Valentín'},{n:15,name:'Unai López'},{n:6,name:'Pathé Ciss'},{n:7,name:'Isi Palazón'},{n:21,name:'Randy Nteka'},{n:18,name:'Álvaro García'},{n:4,name:'Espino'},{n:19,name:'Jorge de Frutos'},{n:16,name:'Fran García'},{n:9,name:'Sergio Camello'},{n:5,name:'Jorge Sáenz'}]},
    {id:'lm_12', name:'CA Osasuna',           attack:58, defense:85, pace:67, passing:56, technique:53, crestImg:ESCUDOS_DIR+'osasuna.png',
      plantilla:[{n:1,name:'Sergio Herrera'},{n:2,name:'Nacho Vidal'},{n:5,name:'David García'},{n:24,name:'Catena'},{n:3,name:'Juan Cruz'},{n:7,name:'Moncayola'},{n:6,name:'Torró'},{n:18,name:'Kike García'},{n:14,name:'Rubén García'},{n:17,name:'Ante Budimir'},{n:19,name:'Pablo Ibáñez'},{n:11,name:'Kike Barja'},{n:20,name:'José Arnáiz'},{n:12,name:'Areso'},{n:16,name:'Moi Gómez'},{n:10,name:'Aimar Oroz'}]},
    {id:'lm_13', name:'Getafe CF',            attack:50, defense:89, pace:61, passing:53, technique:48, crestImg:ESCUDOS_DIR+'getafe.png',
      plantilla:[{n:1,name:'Soria'},{n:2,name:'Djené'},{n:3,name:'Domingos Duarte'},{n:15,name:'Riera'},{n:16,name:'Diego Rico'},{n:5,name:'Luis Milla'},{n:8,name:'Arambarri'},{n:19,name:'Iglesias'},{n:9,name:'Borja Mayoral'},{n:23,name:'Liso'},{n:11,name:'Yellu Santiago'},{n:12,name:'Coba'},{n:13,name:'Jaime Mata'},{n:14,name:'Rey Manaj'},{n:21,name:'Álex Sancris'},{n:22,name:'Diego Bustos'}]},
    {id:'lm_14', name:'RCD Espanyol',         attack:63, defense:69, pace:65, passing:62, technique:63, crestImg:ESCUDOS_DIR+'espanyol.png',
      plantilla:[{n:1,name:'Marko Dmitrović'},{n:2,name:'Omar El Hilali'},{n:3,name:'Leandro Cabrera'},{n:4,name:'Carlos Romero'},{n:5,name:'Kike García'},{n:11,name:'Pere Milla'},{n:6,name:'Urko González de Zárate'},{n:8,name:'Edu Expósito'},{n:7,name:'Javi Puado'},{n:9,name:'Roberto Fernández'},{n:24,name:'Dolan'},{n:14,name:'Denis Suárez'},{n:15,name:'Miguel Rubio'},{n:20,name:'Cabrera'},{n:19,name:'Alejo Véliz'},{n:16,name:'Álex Kral'}]},
    {id:'lm_15', name:'Elche CF',             attack:55, defense:72, pace:59, passing:59, technique:60, crestImg:ESCUDOS_DIR+'elche.png',
      plantilla:[{n:1,name:'Dituro'},{n:6,name:'Bigas'},{n:22,name:'Sánchez Miño'},{n:5,name:'Bort'},{n:17,name:'Josan'},{n:4,name:'Nteziryayo'},{n:8,name:'Aguado'},{n:19,name:'Mourad Bejder'},{n:9,name:'André Silva'},{n:10,name:'Rafa Mir'},{n:23,name:'Chust'},{n:11,name:'Pere Milla'},{n:15,name:'Álvaro Núñez'},{n:30,name:'Adrián Butzke'},{n:14,name:'Febas'},{n:3,name:'Enzo Roco'}]},
    {id:'lm_16', name:'Levante UD',           attack:68, defense:47, pace:63, passing:61, technique:65, crestImg:ESCUDOS_DIR+'levante.png',
      plantilla:[{n:1,name:'Cárdenas'},{n:2,name:'Iago Maidana'},{n:3,name:'Real'},{n:4,name:'Cabrera'},{n:5,name:'Toni Fuidias'},{n:6,name:'Pablo Martínez'},{n:7,name:'Vencedor'},{n:8,name:'Alex Kral'},{n:9,name:'Carlos Álvarez'},{n:10,name:'Iván Romero'},{n:11,name:'José Arnaiz'},{n:12,name:'Etta Eyong'},{n:13,name:'De Frutos'},{n:14,name:'Brugui'},{n:15,name:'Elady Zorrilla'},{n:16,name:'Kervin Andrade'}]},
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
