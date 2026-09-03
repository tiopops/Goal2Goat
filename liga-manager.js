/* ============================================================
   GOAL2GOAT — LIGA MANAGER (v0.4)
   ------------------------------------------------------------
   AÑADIDO EN ESTA VERSIÓN respecto a v0.3:
   - Dado del médico ahora en 3D DE VERDAD, con físicas reales
     (Cannon-es + Three.js, cargados solo cuando hace falta — ver
     liga-manager-dice3d.js, módulo aparte y autocontenido).
   - Fondo de dados por partido: 3 (cambiado desde el 2 que
     teníamos anotado en el diseño — Jesús lo confirmó explícitamente
     en esta sesión). Antes de tirar, se puede elegir cuántos de los
     dados disponibles se quieren invertir en el intento.
   - La ventana del dilema ya NO se cierra sola a los pocos segundos:
     ahora hay un botón "CONTINUAR" que hay que pulsar.
   - Campo (pitch) reutilizado tal cual de Copa Leyendas (mismo SVG),
     de momento decorativo/estructural — Liga Manager aún no tiene
     alineación ni posiciones de jugadores implementadas.
   - Tabla de clasificación con las zonas de descenso/Champions/
     Europa League/Conference resaltadas.

   SIGUE FUERA DE ALCANCE: editor de escudo por capas real,
   presupuesto/salarios/sobres, resto del cuerpo técnico, afinidad,
   potencial de entrenamiento, misiones de acumulación, alineación
   real sobre el campo. Persistencia sigue en localStorage.
   ============================================================ */
(function(){

  const SAVE_KEY = 'g2g_liga_manager_v13';
  // Identidad del club (nombre + escudo) — PERSISTE entre partidas, no se
  // pierde al abandonar/descender. Si ya existe, el flujo de entrada no
  // vuelve a pedir nombre ni escudo (solo liga y moneda cada vez).
  const IDENTITY_KEY = 'g2g_liga_manager_identity';
  const DICE_POOL_PER_MATCH = 5;

  /* ---------- 1. Equipos rivales — La Liga 2026-27 real, 19 clubes ---------- */
  const ESCUDOS_DIR='assets/escudos_liga_española/';
  // Los datos de equipos y jugadores de la temporada viven en su propio
  // archivo (teams-data.js, cargado ANTES que este script) para poder
  // actualizarlos cada temporada nueva sin tocar nada de esta lógica.
  const LM_RIVALS = window.LM_RIVALS || [];
  // Aforo aproximado del estadio real de cada uno de los 20 equipos —
  // solo se usa cuando el jugador elige convertirse en uno de ellos
  // ("equipo ya existente"), nunca para un club propio (ahí el aforo
  // modesto de un recién ascendido sigue siendo el correcto). Cifras
  // redondeadas a la capacidad habitual de cada estadio; cuando un
  // estadio está en obras/reforma en la temporada real (p.ej. el Camp
  // Nou) se usa su aforo de referencia una vez terminado, no el
  // aforo reducido y temporal de las obras.
  const AFORO_REAL_POR_EQUIPO = {
    lm_1: 78000,  // Real Madrid — Santiago Bernabéu
    lm_2: 99000,  // FC Barcelona — Spotify Camp Nou (aforo de referencia, no el reducido por obras)
    lm_3: 70000,  // Atlético de Madrid — Riyadh Air Metropolitano
    lm_4: 53000,  // Athletic Club — San Mamés
    lm_5: 23000,  // Villarreal CF — Estadio de la Cerámica
    lm_6: 60000,  // Real Betis — Benito Villamarín
    lm_7: 39500,  // Real Sociedad — Reale Arena
    lm_8: 43000,  // Sevilla FC — Ramón Sánchez-Pizjuán
    lm_9: 29000,  // RC Celta — Balaídos
    lm_10: 49000, // Valencia CF — Mestalla
    lm_11: 14700, // Rayo Vallecano — Campo de Vallecas
    lm_12: 23500, // CA Osasuna — El Sadar
    lm_13: 17000, // Getafe CF — Coliseum
    lm_14: 40000, // RCD Espanyol — RCDE Stadium
    lm_15: 33500, // Elche CF — Martínez Valero
    lm_16: 26000, // Levante UD — Ciutat de València
    lm_17: 19800, // Deportivo Alavés — Mendizorroza
    lm_18: 23000, // RCD Mallorca — Son Moix
    lm_19: 30500, // Real Oviedo — Carlos Tartiere
    lm_20: 14600, // Girona FC — Montilivi
  };

  const MONEDAS = {
    EUR:{symbol:'€', label:'Euro'},
    GBP:{symbol:'£', label:'Libra'},
    USD:{symbol:'$', label:'Dólar'}
  };

  // Estado del campo de cada rival — no se simula partido a partido (los
  // rivales no tienen su propio departamento de mantenimiento gestionable),
  // se estima a partir de su nivel medio: los clubes con más presupuesto
  // suelen cuidar mejor sus instalaciones. Sirve tanto para mostrarlo en
  // la ficha del rival como para el efecto de clima+campo cuando jugamos
  // en su estadio.
  function campoRivalEstimado(rival){
    const media=(rival.attack+rival.defense+rival.pace+rival.passing+rival.technique)/5;
    return Math.max(30, Math.min(95, Math.round((media-58)*1.8+35)));
  }
  // Describe el estilo de juego real del rival a partir de su perfil de
  // estadísticas — el mismo desequilibrio ataque/defensa que usa
  // simularPartido() para dar ventaja o penalización según tu
  // formación, así el texto es un reflejo fiel de la mecánica real, no
  // solo ambientación.
  function estiloDeJuegoRival(rival){
    const desequilibrio=rival.attack-rival.defense;
    const posesion=rival.passing+rival.technique;
    let base, consejo;
    if(desequilibrio>15){
      base=t('lm.estilo_muy_ofensivo');
      consejo='Una formación defensiva aprovecha bien esos huecos al contragolpe.';
    } else if(desequilibrio>8){
      base=t('lm.estilo_prioriza_ataque');
      consejo='Plantear un bloque defensivo puede darte ventaja en las transiciones.';
    } else if(desequilibrio<-15){
      base=t('lm.estilo_muy_defensivo');
      consejo='Ir con una formación muy ofensiva contra ellos suele costar más de lo esperado.';
    } else if(desequilibrio<-8){
      base=t('lm.estilo_solido_atras');
      consejo='Un planteamiento ofensivo choca con su principal virtud: la defensa.';
    } else if(posesion>=175){
      base=t('lm.estilo_posesion');
      consejo='Presionar arriba puede incomodarles más que esperar atrás.';
    } else if(rival.pace>=85){
      base=t('lm.estilo_rapido_directo');
      consejo='Una defensa bien colocada limita mucho su principal arma.';
    } else {
      base=t('lm.estilo_equilibrado');
      consejo='Cualquier planteamiento razonable debería servir contra ellos.';
    }
    return {base, consejo};
  }

  const LIGAS_DISPONIBLES = [
    {id:'es', nombre:'España — La Liga', flagImg:'assets/flags/1f1ea-1f1f8.png', activa:true},
    {id:'en', nombre:'Inglaterra — Premier League', flagImg:'assets/flags/1f1ec-1f1e7.png', activa:false},
    {id:'it', nombre:'Italia — Serie A', flagImg:'assets/flags/1f1ee-1f1f9.png', activa:false},
    {id:'de', nombre:'Alemania — Bundesliga', flagImg:'assets/flags/1f1e9-1f1ea.png', activa:false},
    {id:'fr', nombre:'Francia — Ligue 1', flagImg:'assets/flags/1f1eb-1f1f7.png', activa:false}
  ];

  // Zonas de la clasificación (posiciones 1-indexadas, 20 equipos, criterio
  // habitual de La Liga: 1-4 Champions, 5 Europa League, 6 Conference,
  // 18-20 descenso). Simplificado — la asignación real varía cada
  // temporada según plazas extra de coeficiente UEFA.
  function zonaClasificacion(pos){
    if(pos<=4) return 'champions';
    if(pos===5) return 'europa';
    if(pos===6) return 'conference';
    if(pos>=18) return 'descenso';
    return '';
  }

  const PITCH_SVG = `      <svg class="pitch-svg" viewBox="0 0 480 640" xmlns="http://www.w3.org/2000/svg">
        <rect width="480" height="640" fill="#2f7c42"/>
        <rect y="38" width="480" height="38" fill="#246f38"/>
        <rect y="114" width="480" height="38" fill="#246f38"/>
        <rect y="190" width="480" height="38" fill="#246f38"/>
        <rect y="266" width="480" height="38" fill="#246f38"/>
        <rect y="342" width="480" height="38" fill="#246f38"/>
        <rect y="418" width="480" height="38" fill="#246f38"/>
        <rect y="494" width="480" height="38" fill="#246f38"/>
        <rect y="570" width="480" height="38" fill="#246f38"/>
        <!-- halfway -->
        <line x1="0" y1="320" x2="480" y2="320" stroke="rgba(255,255,255,.5)" stroke-width="2"/>
        <circle cx="240" cy="320" r="73" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="2.5"/>
        <circle cx="240" cy="320" r="4" fill="rgba(255,255,255,.55)"/>
        <!-- top penalty area -->
        <rect x="100" y="0" width="280" height="105" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="2.5"/>
        <rect x="180" y="0" width="120" height="45" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="2.5"/>
        <circle cx="240" cy="65" r="4" fill="rgba(255,255,255,.55)"/>
        <path d="M210 105 A30 30 0 0 0 270 105" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="2.5"/>
        <!-- bottom penalty area -->
        <rect x="100" y="535" width="280" height="105" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="2.5"/>
        <rect x="180" y="595" width="120" height="45" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="2.5"/>
        <circle cx="240" cy="575" r="4" fill="rgba(255,255,255,.55)"/>
        <path d="M210 535 A30 30 0 0 1 270 535" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="2.5"/>
        <!-- corner flags - sharp corners, no border -->
        <line x1="0" y1="0" x2="480" y2="0" stroke="rgba(255,255,255,.3)" stroke-width="2"/>
        <line x1="0" y1="640" x2="480" y2="640" stroke="rgba(255,255,255,.3)" stroke-width="2"/>
        <line x1="0" y1="0" x2="0" y2="640" stroke="rgba(255,255,255,.3)" stroke-width="2"/>
        <line x1="480" y1="0" x2="480" y2="640" stroke="rgba(255,255,255,.3)" stroke-width="2"/>
      </svg>
`;

  /* ---------- 2. Mini-plantilla de ejemplo (para el Médico) ---------- */
  // Nombres reutilizados tanto para la plantilla inicial como para los
  // jugadores que salen de los sobres de fichajes del Director Deportivo.
  const NOMBRES_JUGADOR=["Álvaro","Adrián","Hugo","Mario","Pablo","Marcos","Diego","Sergio","Iker","Nacho","Bruno","Izan","Rubén","Guillermo","Álex","Raúl","Daniel","Carlos","Javier","Óscar","Manuel","Antonio","Francisco","José","David","Jorge","Víctor","Iván","Enrique","Ismael","Rodrigo","Samuel","Gonzalo","Fernando","Miguel","Andrés","Emilio","Tomás","Lucas","Gabriel","Martín","Xabi","Unai","Ander","Aitor","Eneko"];
  const APELLIDOS_JUGADOR=["García","Fernández","López","Martínez","Sánchez","Pérez","Gómez","Ruiz","Díaz","Moreno","Torres","Ramos","Molina","Ortega","Vázquez","Serrano","Castro","Romero","Navarro","Iglesias","Domínguez","Vidal","Santos","Cano","Prieto","Vega","Herrera","Cabrera","Rubio","Marín","Delgado","Soto","Campos","Reyes","Blanco","Suárez","Peña","Flores","Nieto","Cortés","Aguilar","Ibáñez","Lozano","Cruz","Pascual"];
  // Nombres femeninos — el cuerpo técnico (médico, mantenimiento y los
  // dos directores) puede ser hombre o mujer; los jugadores de la
  // plantilla siguen siendo siempre hombres (mismos apellidos para
  // ambos géneros, solo cambia el nombre de pila).
  const NOMBRES_MUJER=["Ana","Laura","Marta","Sara","Elena","Lucía","Paula","Andrea","Carmen","Irene","Claudia","Sofía","Alba","Nuria","Cristina","Beatriz","Silvia","Patricia","Rocío","Julia","María","Isabel","Raquel","Eva","Noelia","Sandra","Natalia","Alicia","Verónica","Yolanda","Pilar","Teresa","Mónica","Cristina","Esther","Gloria","Inés","Marina","Celia","Aitana","Vega","Daniela","Valeria","Olivia"];
  function nombreTrabajadorAleatorio(){
    const genero = Math.random()<0.5 ? 'hombre' : 'mujer';
    const nombres = genero==='mujer' ? NOMBRES_MUJER : NOMBRES_JUGADOR;
    const nombre = nombres[Math.floor(Math.random()*nombres.length)]+' '+APELLIDOS_JUGADOR[Math.floor(Math.random()*APELLIDOS_JUGADOR.length)];
    // Variante de foto (1, 2 o 3) — cada puesto del cuerpo técnico tiene
    // hasta 3 fotos distintas por género (archivo_hombre.png/mujer.png,
    // _hombre2/_mujer2, _hombre3/_mujer3), así que dos trabajadores del
    // mismo género no salen siempre con la misma cara. Se decide UNA vez
    // aquí (al generarse el nombre) y se guarda con el resto de sus
    // datos, nunca se vuelve a sortear en cada render — si no, la foto
    // "parpadearía" a otra persona distinta cada vez que se repintara la
    // pantalla.
    const fotoVariante = 1+Math.floor(Math.random()*3);
    return {nombre, genero, fotoVariante};
  }
  function nombreJugadorAleatorio(usados){
    let nombre;
    do{ nombre=NOMBRES_JUGADOR[Math.floor(Math.random()*NOMBRES_JUGADOR.length)]+' '+APELLIDOS_JUGADOR[Math.floor(Math.random()*APELLIDOS_JUGADOR.length)]; }while(usados && usados.has(nombre));
    if(usados) usados.add(nombre);
    return nombre;
  }
  // Salario mensual a partir del overall — escala pensada para que una
  // plantilla modesta (48-65) cueste en torno a 190.000-215.000€/mes en
  // total, coherente con el capital inicial y el aforo modestos: con esa
  // nómina, un solo partido en casa (con el aforo/asistencia típicos de
  // un recién ascendido) ya NO cubre el mes entero por sí solo, y ni
  // siquiera un mes "normal" de dos partidos en casa deja demasiado
  // margen — hace falta gestionar bien (precio de entrada, plantilla,
  // patrocinios) para que el balance vaya mejorando mes a mes.
  // (Antes el multiplicador era 260, lo que dejaba una nómina real de
  // ~68.000€/mes muy por debajo de este objetivo y hacía que el primer
  // mes fuera ampliamente positivo incluso sin fichar a nadie del
  // cuerpo técnico — contradecía la propia intención de diseño.)
  function calcularSalario(overall){
    return Math.round(Math.max(1200, (overall-40)*800));
  }
  function generarMiniPlantilla(){
    const usados=new Set();
    function nombreUnico(){ return nombreJugadorAleatorio(usados); }
    const numerosUsados=new Set();
    function numeroUnico(){
      let n;
      do{ n=1+Math.floor(Math.random()*30); }while(numerosUsados.has(n));
      numerosUsados.add(n);
      return n;
    }
    function nuevoJugador(id, position, esSuplente){
      const overall=48+Math.floor(Math.random()*18); // 48-65, coherente con "plantilla modesta, recién ascendido"
      const variar=()=>Math.max(30,Math.min(80, overall+Math.floor(Math.random()*11)-5));
      return {
        id, name:nombreUnico(), numero:numeroUnico(), position, overall,
        attack:variar(), defense:variar(), pace:variar(), passing:variar(), technique:variar(),
        fatigue:100, racha:0, esSuplente:!!esSuplente,
        injured:false, injuryWeeks:0, injurySeverity:null,
        salario:calcularSalario(overall)
      };
    }

    // 11 jugadores de plantilla principal (posiciones base del 4-3-3)
    const POSICIONES_TITULARES=["POR","DFC","DFC","LI","LD","MC","MC","MC","EI","ED","DC"];
    const plantilla=POSICIONES_TITULARES.map((pos,i)=>nuevoJugador('p'+i, pos, false));

    // Banquillo: tamaño según la mejora "Banquillo" comprada (5 de base,
    // hasta 10 con el nivel máximo) con posiciones al azar que no se
    // repiten entre ellas mientras queden posiciones libres.
    const TODAS_POSICIONES=["POR","DFC","LI","LD","MC","EI","ED","DC"];
    const posiciones=TODAS_POSICIONES.slice();
    for(let i=posiciones.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      const tmp=posiciones[i]; posiciones[i]=posiciones[j]; posiciones[j]=tmp;
    }
    const tamanoBanquillo=lmMaxBanquillo();
    for(let i=0;i<tamanoBanquillo;i++){ plantilla.push(nuevoJugador('b'+i, posiciones[i%posiciones.length], true)); }

    return plantilla;
  }

  /* ---------- Liga Aleatoria: clubes, escudos y jugadores 100%
     generados por el propio juego (sin ningún nombre, jugador ni
     escudo real) — pensada como alternativa a la liga española real
     de cara a poder vender el juego sin problemas de derechos de
     marcas/jugadores reales. El nombre de cada club se elige con
     coherencia respecto al icono que le toca en el escudo (p.ej. un
     escudo con una estrella -> algo tipo "Stars FC"), igual que pidió
     Jesús. ---------- */
  // Un tema de nombre por cada icono posible del editor de escudos
  // (ver CREST_ICONS en crest-editor.js) — nombres genéricos de club,
  // ninguno copiado de un equipo real, para evitar cualquier parecido.
  const TEMA_POR_ICONO_CLUB={
    ninguno:['Union','Sporting','Central','Unity'],
    'ph-star':['Stars','Starlight','Comet'],
    'ph-crown':['Royals','Crown','Monarchs'],
    'ph-shield':['Shield','Guardians','Defenders'],
    'ph-lightning':['Thunder','Bolt','Volt'],
    'ph-trophy':['Champions','Victors','Trophy'],
    'ph-fire':['Flames','Fire','Blaze'],
    'ph-mountains':['Peaks','Summit','Highland'],
    'ph-anchor':['Anchors','Harbor','Maritime'],
    'ph-sword':['Blades','Sabres','Steel'],
    'ph-horse':['Stallions','Mustangs','Colts'],
    'ph-bird':['Eagles','Hawks','Falcons'],
    'ph-cat':['Panthers','Wildcats','Tigers'],
    'ph-tree':['Oaks','Forest','Timber'],
    'ph-sun':['Solar','Sunrise','Radiant'],
    'ph-waves':['Waves','Tide','Current'],
    'ph-diamonds-four':['Diamonds','Gems','Crystal'],
    'ph-medal':['Elite','Medalists','Honor'],
    'ph-skull':['Reapers','Renegades','Skulls'],
    'ph-rocket':['Rockets','Comets','Orbit'],
    'ph-fish':['Marlins','Sharks','Current'],
    'ph-moon-stars':['Nighthawks','Lunar','Midnight'],
    'ph-globe':['Cosmos','World','Global'],
    'ph-hand-fist':['Fists','Warriors','Titans'],
    'ph-flag':['Banner','Pioneers','Vanguard'],
    'ph-compass':['Voyagers','Compass','Explorers'],
    'ph-heart':['Pride','Hearts','Spirit'],
    'ph-hand-peace':['Unity','Harmony','Alliance'],
    'ph-basketball':['Dynamo','Rebound','Rally'],
    'ph-eye':['Watchers','Vision','Sentinel'],
  };
  const SUFIJOS_CLUB_ALEATORIO=['FC','CF','United','City','Athletic','Rovers','Wanderers','SC','Town','Sporting'];
  function nombreClubAleatorio(icono, usados){
    const temas=TEMA_POR_ICONO_CLUB[icono]||TEMA_POR_ICONO_CLUB.ninguno;
    let nombre, intentos=0;
    do{
      const tema=temas[Math.floor(Math.random()*temas.length)];
      const sufijo=SUFIJOS_CLUB_ALEATORIO[Math.floor(Math.random()*SUFIJOS_CLUB_ALEATORIO.length)];
      nombre=`${tema} ${sufijo}`;
      intentos++;
    }while(usados.has(nombre) && intentos<40);
    usados.add(nombre);
    return nombre;
  }
  // Utilidades de contraste WCAG (mismo estándar de accesibilidad
  // web) — se usan para no dejar nunca un icono o una decoración casi
  // invisible sobre el color de fondo que le haya tocado al escudo.
  function hexALuminancia(hex){
    hex=hex.replace('#','');
    const r=parseInt(hex.substr(0,2),16)/255, g=parseInt(hex.substr(2,2),16)/255, b=parseInt(hex.substr(4,2),16)/255;
    const lin=(c)=>c<=0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4);
    return 0.2126*lin(r)+0.7152*lin(g)+0.0722*lin(b);
  }
  function ratioContraste(hex1, hex2){
    const l1=hexALuminancia(hex1), l2=hexALuminancia(hex2);
    const claro=Math.max(l1,l2), oscuro=Math.min(l1,l2);
    return (claro+0.05)/(oscuro+0.05);
  }
  // Elige un color de la paleta que se lea bien (contraste >= 3.0,
  // mínimo habitual para elementos gráficos) contra TODOS los fondos
  // que se le pasen — un escudo con patrón de dos colores (rayas,
  // cuartos...) puede tener el icono encima de cualquiera de los dos,
  // así que se exige contraste contra ambos, no solo contra uno. Si
  // por lo que fuera ningún color de la paleta cumpliera (no debería
  // pasar, la paleta tiene bastante variedad clara/oscura), se cae
  // con cualquiera antes que reventar.
  function elegirColorConContraste(pool, contraFondos, minimo){
    const puntuados=pool.map(c=>({c, minRatio:Math.min(...contraFondos.map(fondo=>ratioContraste(c,fondo)))}));
    const validos=puntuados.filter(p=>p.minRatio>=minimo);
    if(validos.length) return validos[Math.floor(Math.random()*validos.length)].c;
    // Puede pasar que NINGÚN color de la paleta llegue al mínimo para
    // esta combinación de fondos en concreto (matemáticamente
    // imposible cuando los dos fondos del escudo son extremos
    // opuestos entre sí, p.ej. amarillo muy claro + negro muy
    // oscuro — cualquier color intermedio se queda corto contra
    // alguno de los dos). En ese caso, en vez de caer en un color
    // cualquiera al azar (que fue justo lo que causaba escudos poco
    // legibles antes), se elige el MEJOR disponible de verdad.
    puntuados.sort((a,b)=>b.minRatio-a.minRatio);
    const mejorRatio=puntuados[0].minRatio;
    const mejores=puntuados.filter(p=>p.minRatio>=mejorRatio-0.05);
    return mejores[Math.floor(Math.random()*mejores.length)].c;
  }
  // Escudo por capas 100% al azar, generado con el MISMO sistema del
  // editor de escudos (crest-editor.js, cargado antes que este
  // archivo y accesible como global) — nunca una imagen real.
  // - Icono central SIEMPRE presente (nunca "ninguno"), porque el
  //   nombre del club depende de cuál le toque.
  // - Decoración/rango: NO todos los escudos la llevan (a propósito,
  //   para que no todos los clubes tengan el mismo aire de "combo") —
  //   cuando aparece, combina con el icono central y le da más
  //   personalidad; cuando no, el escudo se queda más simple, que
  //   también tiene su sitio.
  // - iconoForzado/rankForzado: para que una liga entera pueda repartir
  //   los iconos SIN repetir ninguno entre sus equipos (ver
  //   generarLigaAleatoria más abajo). rankForzado puede venir como
  //   'ninguno' a propósito (decisión ya tomada por quien llama) — solo
  //   si no se pasa NADA (undefined) se decide aquí mismo al azar.
  // - Los colores de icono y decoración se eligen SIEMPRE con
  //   contraste suficiente contra el fondo del escudo, para que nunca
  //   queden apagados o casi invisibles.
  function generarEscudoAleatorio(iconoForzado, rankForzado){
    if(typeof CREST_SHAPE_KEYS==='undefined' || typeof buildCrestSVGInner!=='function'){
      return {icon:'ninguno', rank:'ninguno', dataUri:null}; // red de seguridad si el editor de escudos no llegó a cargar
    }
    const formas=CREST_SHAPE_KEYS.filter(s=>s!=='ninguno');
    const iconos=CREST_ICONS.filter(i=>i!=='ninguno');
    const ranks=CREST_RANKS.filter(r=>r!=='ninguno' && r!=='laurel'); // "laurel" es un dibujo propio, no un icono Phosphor — se deja fuera para que la decoración combine siempre con un icono real
    const shape=formas[Math.floor(Math.random()*formas.length)];
    const pattern=CREST_PATTERNS[Math.floor(Math.random()*CREST_PATTERNS.length)];
    const icon=iconoForzado||iconos[Math.floor(Math.random()*iconos.length)];
    const rank=(rankForzado!==undefined) ? rankForzado : (Math.random()<0.5 ? ranks[Math.floor(Math.random()*ranks.length)] : 'ninguno');
    const bgColor=CREST_COLORS[Math.floor(Math.random()*CREST_COLORS.length)];
    let bg2Color=CREST_COLORS[Math.floor(Math.random()*CREST_COLORS.length)];
    let intentosColor=0;
    while(bg2Color===bgColor && intentosColor<10){ bg2Color=CREST_COLORS[Math.floor(Math.random()*CREST_COLORS.length)]; intentosColor++; }
    const iconColor=elegirColorConContraste(CREST_COLORS, [bgColor, bg2Color], 3.0);
    const rankColor=elegirColorConContraste(CREST_COLORS, [bgColor, bg2Color], 3.0);
    const data={
      shape, pattern, bgColor, bg2Color, shapeScale:100, shapeRotate:0,
      icon, iconColor, iconScale:100, iconRotate:0, iconX:0, iconY:0,
      rank, rankColor, rankScale:100, rankRotate:0, rankX:0, rankY:0,
    };
    const svgFull=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">${buildCrestSVGInner(data)}</svg>`;
    return {icon, rank, dataUri:'data:image/svg+xml;utf8,'+encodeURIComponent(svgFull)};
  }
  // Genera la liga entera: N clubes con nombre+escudo coherentes entre
  // sí y sus plantillas completas (11+5), con variedad real de nivel
  // entre clubes (unos pocos "grandes" y bastantes "modestos", como en
  // una liga real) en vez de que todos salgan igual de flojos.
  const TIERS_LIGA_ALEATORIA=[
    {min:45, max:58, peso:5}, {min:52, max:65, peso:6}, {min:58, max:72, peso:5},
    {min:65, max:78, peso:3}, {min:74, max:88, peso:1},
  ];
  function elegirTierAleatorio(){
    const pesoTotal=TIERS_LIGA_ALEATORIA.reduce((s,t)=>s+t.peso,0);
    let r=Math.random()*pesoTotal;
    for(const tier of TIERS_LIGA_ALEATORIA){ r-=tier.peso; if(r<=0) return tier; }
    return TIERS_LIGA_ALEATORIA[0];
  }
  // Baraja de Fisher-Yates — usada para repartir iconos sin repetir
  // entre los equipos de una misma liga generada (antes cada equipo
  // sorteaba su icono de forma independiente, y con solo 30 posibles
  // para 20 equipos las coincidencias eran casi seguras).
  function barajarArray(arr){
    const a=arr.slice();
    for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); const tmp=a[i]; a[i]=a[j]; a[j]=tmp; }
    return a;
  }
  function generarLigaAleatoria(numEquipos){
    numEquipos=numEquipos||20;
    const nombresUsados=new Set();
    const clavesUsadas=new Set();
    const equiposGenerados=[];
    const POS_XI_ALEATORIA=['GK','CB','CB','LB','RB','CDM','CM','CAM','LW','RW','ST'];
    const POS_BANCA_ALEATORIA=['GK','CB','CM','RW','ST'];
    // Iconos barajados una vez para TODA la liga — con 29 posibles y
    // como mucho 20 equipos, cada uno se queda siempre con uno
    // distinto a todos los demás de su misma liga. Las decoraciones
    // (solo 7 posibles) sí pueden llegar a repetirse si hay más de 7
    // equipos — es un elemento secundario, no tan determinante como
    // el icono principal (que además es el que da nombre al club).
    const iconosBarajados=(typeof CREST_ICONS!=='undefined')?barajarArray(CREST_ICONS.filter(i=>i!=='ninguno')):[];
    const ranksBarajados=(typeof CREST_RANKS!=='undefined')?barajarArray(CREST_RANKS.filter(r=>r!=='ninguno' && r!=='laurel')):[];
    let siguienteRankIdx=0; // solo avanza para los equipos que SÍ llevan decoración
    // Escudos reales (assets/escudos_random/), barajados sin repetir
    // mientras alcance — si hay más equipos que escudos disponibles,
    // se recicla la baraja (mismo patrón que ya usa iconosBarajados de
    // arriba) en vez de fallar. Si el manifiesto aún no ha terminado
    // de cargar (o la carpeta está vacía), se cae de vuelta al escudo
    // procedural de siempre, sin que la liga deje de generarse.
    const escudosRealesBarajados=(ESCUDOS_RANDOM_CACHE && ESCUDOS_RANDOM_CACHE.length) ? barajarArray(ESCUDOS_RANDOM_CACHE) : [];
    for(let i=0;i<numEquipos;i++){
      const iconoAsignado=iconosBarajados.length?iconosBarajados[i%iconosBarajados.length]:null;
      // No todos los escudos llevan decoración a propósito — cuando le
      // toca a un equipo, se saca de la baraja (sin repetir mientras
      // alcance); si no le toca, el escudo se queda solo con el icono
      // central, más simple, que también tiene su sitio.
      let rankAsignado='ninguno';
      if(ranksBarajados.length && Math.random()<0.5){
        rankAsignado=ranksBarajados[siguienteRankIdx%ranksBarajados.length];
        siguienteRankIdx++;
      }
      let icon, dataUri, nombre;
      if(escudosRealesBarajados.length){
        const archivoEscudo=escudosRealesBarajados[i%escudosRealesBarajados.length];
        dataUri='assets/escudos_random/'+archivoEscudo;
        nombre=nombreClubDesdeArchivoEscudo(archivoEscudo);
        icon=null;
        // Si hay más equipos que escudos distintos y toca reciclar
        // alguno, el nombre puede repetirse — se distingue igual que
        // el resto de nombres generados, añadiendo un sufijo numérico.
        let sufijoNombre=2;
        const nombreBase=nombre;
        while(nombresUsados.has(nombre)){ nombre=nombreBase+' '+sufijoNombre; sufijoNombre++; }
        nombresUsados.add(nombre);
      } else {
        const generado=generarEscudoAleatorio(iconoAsignado, rankAsignado);
        icon=generado.icon; dataUri=generado.dataUri;
        nombre=nombreClubAleatorio(icon, nombresUsados);
      }
      let key=nombre.toLowerCase().replace(/\s+/g,'').replace(/[^a-z0-9]/g,'');
      let sufijoClave=2;
      while(clavesUsadas.has(key)){ key=nombre.toLowerCase().replace(/\s+/g,'').replace(/[^a-z0-9]/g,'')+sufijoClave; sufijoClave++; }
      clavesUsadas.add(key);
      const tier=elegirTierAleatorio();
      // Estilo de equipo: reparte el mismo overall total de forma
      // distinta según ataque/defensa (y en menor medida pase/ritmo) —
      // antes TODAS las estadísticas de todos los equipos se repartían
      // exactamente igual, dando plantillas siempre "equilibradas" sin
      // ninguna variedad real entre un equipo y otro.
      const ESTILOS_EQUIPO=[
        {id:'equilibrado', atk:0, def:0, pas:0},
        {id:'ofensivo',    atk:9, def:-9, pas:3},
        {id:'defensivo',   atk:-9, def:9, pas:-2},
        {id:'tecnico',     atk:2, def:-4, pas:8},
      ];
      const estiloEquipo=ESTILOS_EQUIPO[Math.floor(Math.random()*ESTILOS_EQUIPO.length)];
      const numerosUsados=new Set();
      const nombresJugUsados=new Set();
      function numeroUnicoAleatorio(){
        let n; do{ n=1+Math.floor(Math.random()*30); }while(numerosUsados.has(n));
        numerosUsados.add(n); return n;
      }
      function jugadorAleatorioLiga(pos){
        const overall=tier.min+Math.floor(Math.random()*(tier.max-tier.min+1));
        const variar=(sesgo)=>Math.max(20,Math.min(99, overall+(sesgo||0)+Math.floor(Math.random()*11)-5));
        return {pos, num:numeroUnicoAleatorio(), nombre:nombreJugadorAleatorio(nombresJugUsados),
          atk:variar(estiloEquipo.atk), def:variar(estiloEquipo.def), pace:variar(estiloEquipo.pas*0.4),
          pas:variar(estiloEquipo.pas), tech:variar(estiloEquipo.pas*0.6)};
      }
      const xi=POS_XI_ALEATORIA.map(p=>jugadorAleatorioLiga(p));
      const bench=POS_BANCA_ALEATORIA.map(p=>jugadorAleatorioLiga(p));
      equiposGenerados.push({key, displayName:nombre, xi, bench, estilo:estiloEquipo.id});
      if(dataUri && window.G2G_LigaPersonalizada) window.G2G_LigaPersonalizada.setCrestDirecto(key, dataUri);
    }
    if(window.G2G_LigaPersonalizada) window.G2G_LigaPersonalizada.setEquipos(equiposGenerados);
    return equiposGenerados;
  }

  // Genera tu plantilla a partir de un equipo real elegido en vez de
  // crear el tuyo propio — mismos 16 jugadores (11+5) con nombres y
  // dorsales reales de esa plantilla, y estadísticas individuales
  // repartidas alrededor del perfil real del equipo (igual que se hace
  // para generar el once ficticio de los rivales).
  function generarPlantillaDesdeEquipoReal(equipo){
    const tamanoBanquillo=lmMaxBanquillo();
    const porteros=(equipo.plantilla||[]).filter(j=>j.pos==='POR');
    const resto=(equipo.plantilla||[]).filter(j=>j.pos!=='POR');
    const jugadores=[...porteros, ...resto].slice(0,11+tamanoBanquillo);
    function statVariada(base){ return Math.max(35, Math.min(97, Math.round(base+Math.floor(Math.random()*13)-6))); }
    function jugadorDe(id, idx, pos, esSuplente){
      const j=jugadores[idx];
      const tieneStatsReales = j && j.attack!==undefined;
      const attack = tieneStatsReales ? j.attack : statVariada(equipo.attack);
      const defense = tieneStatsReales ? j.defense : statVariada(equipo.defense);
      const pace = tieneStatsReales ? j.pace : statVariada(equipo.pace);
      const passing = tieneStatsReales ? j.passing : statVariada(equipo.passing);
      const technique = tieneStatsReales ? j.technique : statVariada(equipo.technique);
      const overall=Math.round((attack+defense+pace+passing+technique)/5);
      return {
        id, name: j?j.name:('Jugador '+(idx+1)), numero: j?j.n:(idx+1), position:pos, overall,
        attack, defense, pace, passing, technique,
        fatigue:100, racha:0, esSuplente:!!esSuplente,
        injured:false, injuryWeeks:0, injurySeverity:null,
        salario:calcularSalario(overall)
      };
    }
    const POSICIONES_TITULARES=["POR","DFC","DFC","LI","LD","MC","MC","MC","EI","ED","DC"];
    const POSICIONES_BANQUILLO_BASE=["POR","DFC","MC","ED","DC"];
    const plantilla=POSICIONES_TITULARES.map((pos,i)=>jugadorDe('p'+i, i, pos, false));
    for(let i=0;i<tamanoBanquillo;i++){ plantilla.push(jugadorDe('b'+i, 11+i, POSICIONES_BANQUILLO_BASE[i%POSICIONES_BANQUILLO_BASE.length], true)); }
    return plantilla;
  }

  // Traduce los códigos de posición en inglés del Excel de Liga
  // Personalizada (GK, CB, LB...) a los códigos internos en español
  // que usa el resto del juego para las formaciones (POR, DFC, LI...).
  const POS_EXCEL_A_INTERNA={
    GK:'POR', CB:'DFC', LB:'LI', RB:'LD', LWB:'LI', RWB:'LD',
    CDM:'MC', CM:'MC', CAM:'MC', LM:'MC', RM:'MC',
    LW:'EI', RW:'ED', ST:'DC', CF:'DC',
  };
  // A partir de un equipo importado del Excel de Liga Personalizada
  // (once inicial + banquillo, con posición y las 5 estadísticas
  // reales que rellenó el jugador), genera la plantilla completa en
  // el mismo formato que usa el resto del juego. Cada jugador
  // importado se asigna al hueco de formación (POR/DFC/LI/LD/MC/EI/
  // ED/DC) cuya posición traducida coincida mejor — si sobra algún
  // hueco sin coincidencia exacta, se rellena igualmente con quien
  // quede libre, para no dejar nunca una plaza vacía.
  function generarPlantillaDesdeEquipoCustom(equipoCustom){
    const tamanoBanquillo=lmMaxBanquillo();
    function traducirPos(posExcel){ return POS_EXCEL_A_INTERNA[posExcel]||'MC'; }
    function jugadorDe(id, j, posInterna, esSuplente){
      const overall=Math.round((j.atk+j.def+j.pace+j.pas+j.tech)/5);
      return {
        id, name:j.nombre, numero:j.num, position:posInterna, overall,
        attack:j.atk, defense:j.def, pace:j.pace, passing:j.pas, technique:j.tech,
        fatigue:100, racha:0, esSuplente:!!esSuplente,
        injured:false, injuryWeeks:0, injurySeverity:null,
        salario:calcularSalario(overall)
      };
    }
    function asignarPorSlots(jugadoresOrigen, slots){
      const disponibles=jugadoresOrigen.slice();
      return slots.map(slot=>{
        let idx=disponibles.findIndex(j=>traducirPos(j.pos)===slot);
        if(idx===-1) idx=0; // sin coincidencia exacta -> se usa quien quede, nunca se deja el hueco vacío
        const j=disponibles.splice(idx,1)[0];
        return {j, slot};
      });
    }
    const POSICIONES_TITULARES=["POR","DFC","DFC","LI","LD","MC","MC","MC","EI","ED","DC"];
    const POSICIONES_BANQUILLO_BASE=["POR","DFC","MC","ED","DC"];
    const asignXI=asignarPorSlots(equipoCustom.xi, POSICIONES_TITULARES);
    const plantilla=asignXI.map((a,i)=>jugadorDe('p'+i, a.j, a.slot, false));

    const bancaFuente=equipoCustom.bench.length?equipoCustom.bench:equipoCustom.xi;
    const numBanca=Math.min(tamanoBanquillo, bancaFuente.length);
    const bancaSlots=[]; for(let i=0;i<numBanca;i++) bancaSlots.push(POSICIONES_BANQUILLO_BASE[i%POSICIONES_BANQUILLO_BASE.length]);
    const asignBanca=asignarPorSlots(bancaFuente, bancaSlots);
    asignBanca.forEach((a,i)=>plantilla.push(jugadorDe('b'+i, a.j, a.slot, true)));

    return plantilla;
  }
  // Convierte un equipo importado a un objeto "rival" con la MISMA
  // forma que los de teams-data.js (LM_RIVALS) — así el resto del
  // motor del juego (clima, simulación, historial, máximo goleador
  // de la liga...) puede tratar a los equipos personalizados
  // exactamente igual que a los reales, sin ninguna rama de código
  // aparte. Las estadísticas de equipo son la media real de su once
  // inicial (no un número inventado).
  function equipoCustomARival(equipoCustom){
    const media=(campo)=>Math.round(equipoCustom.xi.reduce((s,j)=>s+j[campo],0)/equipoCustom.xi.length);
    const plantilla=equipoCustom.xi.concat(equipoCustom.bench).map(j=>{
      const jug={n:j.num, name:j.nombre, attack:j.atk, defense:j.def, pace:j.pace, passing:j.pas, technique:j.tech};
      if(j.pos==='GK') jug.pos='POR';
      return jug;
    });
    return {
      id:equipoCustom.key, name:equipoCustom.displayName,
      attack:media('atk'), defense:media('def'), pace:media('pace'), passing:media('pas'), technique:media('tech'),
      crestImg:(window.G2G_LigaPersonalizada?window.G2G_LigaPersonalizada.getCrest(equipoCustom.key):null),
      plantilla,
    };
  }

  /* ---------- 3b. Formaciones seleccionables — a diferencia de Copa
     Leyendas (fija al empezar), aquí se puede elegir antes de cada
     partido. Coordenadas en % sobre el mismo campo (480×640). ---------- */
  /* ---------- 3b. Formaciones — MISMAS que en Copa Leyendas (3 categorías
     × 7 códigos cada una = 21 en total). Las coordenadas de cada posición
     se generan automáticamente a partir del código (ej. "4-2-3-1"), en
     vez de definir las 21 a mano — un generador genérico reparte cada
     línea de jugadores en el campo (480×640, igual que Copa Leyendas). ---------- */
  const FORMATION_CODES = {
    ofensiva:   ['3-4-3','3-4-1-2','4-2-4','4-3-3','4-2-3-1','3-5-2','2-3-5'],
    equilibrada:['4-4-2','4-3-3','4-1-4-1','4-2-3-1','4-3-1-2','3-5-2','4-5-1'],
    defensiva:  ['5-4-1','5-3-2','4-5-1','4-1-4-1','3-6-1','5-2-2-1','6-3-1']
  };
  const CAT_LABELS = {ofensiva:'OFENSIVA', equilibrada:'EQUILIBRADA', defensiva:'DEFENSIVA'};

  // Posición genérica de una línea — SOLO se usa como red de seguridad si
  // algún código de formación no estuviera en el FORMATION_LAYOUTS real de
  // Copa Leyendas (no debería pasar: los 21 códigos de FORMATION_CODES
  // están todos ahí), para no dejar nunca el campo sin generar.
  function posParaFila(rowIdx, nFilas, i, count){
    if(rowIdx===0){
      if(count>=2 && i===0) return 'LI';
      if(count>=2 && i===count-1) return 'LD';
      return 'DFC';
    }
    if(rowIdx===nFilas-1){
      if(count>=3 && i===0) return 'EI';
      if(count>=3 && i===count-1) return 'ED';
      return 'DC';
    }
    if(count>=4 && i===0) return 'EI';
    if(count>=4 && i===count-1) return 'ED';
    return 'MC';
  }
  function generarSlotsFormacionFallback(code){
    const filas=code.split('-').map(n=>parseInt(n,10));
    const slots=[{slot:'POR', x:50, y:90.6}];
    const nFilas=filas.length;
    const contador={};
    filas.forEach((count,rowIdx)=>{
      const y = 75 - (nFilas<=1?0:(rowIdx/(nFilas-1))*55);
      for(let i=0;i<count;i++){
        const x = count===1?50:10+(i/(count-1))*80;
        const base=posParaFila(rowIdx,nFilas,i,count);
        contador[base]=(contador[base]||0)+1;
        slots.push({slot:base+contador[base], x, y});
      }
    });
    return slots;
  }
  // Generación REAL de las posiciones: CALCO exacto de Copa Leyendas — se
  // reutiliza literalmente su buildFormationSlots()/FORMATION_LAYOUTS (líneas
  // arqueadas, no rectas, y coordenadas idénticas a las del campo de Copa
  // Leyendas), disponibles como globales porque game.js se carga antes que
  // este archivo. Solo se añade un sufijo numérico a cada etiqueta repetida
  // para tener una clave única por posición (Liga Manager necesita guardar
  // la alineación como diccionario serializable, a diferencia de Copa
  // Leyendas que la guarda en el propio DOM).
  function generarSlotsFormacion(code){
    if(typeof buildFormationSlots!=='function' || !FORMATION_LAYOUTS[code]){
      return generarSlotsFormacionFallback(code);
    }
    const layout=buildFormationSlots(code);
    const contador={};
    return layout.map(s=>{
      contador[s.label]=(contador[s.label]||0)+1;
      return {slot:s.label+contador[s.label], x:s.left, y:s.top};
    });
  }
  function formacionActual(){
    const code=(state.formacionCode)||'4-3-3';
    return {code, slots:generarSlotsFormacion(code)};
  }

  // Media de las 5 categorías de los titulares asignados (si no hay
  // ninguno asignado todavía, usa la media de toda la plantilla como
  // valor por defecto, para que la simulación nunca se quede sin datos).
  // Bonus real de la formación activa — mismos valores que usa Copa
  // Leyendas (FORMATIONS[cat].bonus), sumados directamente a las 5
  // estadísticas del once titular: elegir formación ahora afecta de
  // verdad al ataque/defensa/etc., no es solo un dibujo visual.
  function formacionBonusActual(){
    const cat=FORMATIONS[state.formacionCategoria] ? state.formacionCategoria : 'equilibrada';
    const f=(FORMATIONS[cat]||[]).find(x=>x.code===state.formacionCode);
    return f ? f.bonus : {attack:0,defense:0,pace:0,passing:0,technique:0};
  }
  // Ventana de días editables del calendario de entrenamiento — los días
  // entre el partido anterior (exclusive) y el próximo (exclusive). La
  // jornada 1 no tiene semana previa, así que no hay días que preparar.
  function ventanaEntrenoActual(){
    if(!state.jornadaActual || state.jornadaActual>38) return null;
    const proxima=fechaJornadaLM(state.jornadaActual);
    if(!proxima) return null;
    let anterior;
    if(state.jornadaActual<=1){
      // Antes del primer partido no hay "jornada anterior" — la semana
      // de preparación empieza exactamente 7 días antes del primer
      // partido, NUNCA en el día real de hoy: con fechas de temporada
      // realistas (agosto), "hoy" puede estar meses antes del inicio
      // de la liga, lo que dejaba una ventana de entrenamiento
      // gigantesca en vez de la semana previa habitual.
      anterior=new Date(proxima); anterior.setHours(0,0,0,0); anterior.setDate(anterior.getDate()-7);
    } else {
      anterior=fechaJornadaLM(state.jornadaActual-1);
    }
    if(!anterior) return null;
    if(anterior.getTime()>=proxima.getTime()) return null; // sin margen (la liga arranca hoy mismo)
    return {desde:anterior, hasta:proxima};
  }
  function fechaEsEditable(fecha){
    // Si la semana ya se resolvió (primer SEGUIR ya dado), toca jugar el
    // partido y el calendario de esa semana se queda fijo — no tiene
    // sentido seguir tocándolo con el entrenamiento ya procesado.
    if(state.semanaResueltaParaJornada===state.jornadaActual) return false;
    const v=ventanaEntrenoActual();
    if(!v) return false;
    const t=fecha.getTime();
    return t>v.desde.getTime() && t<v.hasta.getTime();
  }
  /* ═══════════════════════════════════════════════════════════════
     SEMANA DE NODOS — Fase 1: barras de estado + contadores de icono
     con sus hitos canjeables. El camino de nodos en sí (Fase 2) irá
     sumando +1 al contador correspondiente cada vez que el jugador
     elija ese tipo de nodo — de momento esta fase construye el
     "banco" (contar, mostrar progreso, canjear recompensa) para que
     la Fase 2 solo tenga que preocuparse de sumar.
     ═══════════════════════════════════════════════════════════════ */

  // ---------- Las 4 barras de estado ----------
  // Todas se calculan a partir de datos que YA existen en el juego —
  // no se inventa ningún número nuevo, solo se hacen visibles de cara
  // al jugador para que pueda decidir con criterio qué nodo conviene.
  // Previsión de fatiga media, teniendo en cuenta los nodos de
  // entreno/descanso ya elegidos esta semana (aunque el motor real de
  // procesarEntrenamientoSemanal() no los aplique hasta el final de la
  // semana). Se calcula aparte, SIN tocar state.plantilla[].fatigue de
  // verdad — solo es una previsión visual, para que las barras se
  // sientan reactivas a cada elección sin arriesgarse a que el efecto
  // real se aplique dos veces cuando la semana se resuelva de verdad.
  // Usa exactamente los mismos números que ese motor real (-3.6 los
  // del plan del preparador físico, -2.2 el resto, +4 en descanso).
  function fatigaProyectadaEstaSemana(){
    const plantilla=state.plantilla||[];
    const fatigaBase = plantilla.length ? plantilla.reduce((s,p)=>s+(p.fatigue==null?100:p.fatigue),0)/plantilla.length : 100;
    if(!state.semanaNodos) return fatigaBase;
    const idsEnPlan=new Set((state.pfPlanEntrenamiento||[]).map(e=>e.jugadorId));
    const numEnPlan=plantilla.filter(p=>idsEnPlan.has(p.id)).length;
    const numFuera=plantilla.length-numEnPlan;
    const desgastePromedio=plantilla.length ? (numEnPlan*3.6+numFuera*2.2)/plantilla.length : 2.5;
    let proyeccion=fatigaBase;
    // La barra "Forma física" representa lo en forma que está el
    // equipo de cara al partido (sube entrenando, baja descansando) —
    // a propósito en sentido contrario al valor real de fatiga que
    // maneja procesarEntrenamientoSemanal() por dentro (que sí baja
    // entrenando y sube descansando, porque ese es literalmente el
    // desgaste físico del cuerpo). Son dos cosas distintas: una es la
    // "forma"/soltura de estar entrenando, la otra el cansancio real.
    state.semanaNodos.dias.forEach(dia=>{
      if(dia.elegido==null) return;
      const nodo=dia.nodos[dia.elegido];
      if(nodo.tipo==='entreno' || nodo.tipo==='amistoso') proyeccion+=desgastePromedio;
      else if(nodo.tipo==='descanso') proyeccion-=4;
    });
    return Math.max(0, Math.min(100, proyeccion));
  }

  // Riesgo de lesión proyectado: parte del riesgo base según el nivel
  // de prevención del médico (fijo, no cambia día a día), y le suma o
  // resta según las elecciones ya hechas esta semana — el entreno
  // intenso sube el riesgo de verdad, el descanso lo baja.
  function riesgoLesionProyectado(){
    const nivelesMed=state.medicoNiveles||{};
    const factorPrevencion=Math.pow(0.85, (nivelesMed.prevencionMuscular||0)+(nivelesMed.prevencionOsea||0));
    const riesgoBase=Math.min(100, 45*factorPrevencion);
    if(!state.semanaNodos) return riesgoBase;
    let proyeccion=riesgoBase;
    state.semanaNodos.dias.forEach(dia=>{
      if(dia.elegido==null) return;
      const nodo=dia.nodos[dia.elegido];
      if(nodo.tipo==='entreno' && nodo.subtipo==='intenso') proyeccion+=8;
      else if(nodo.tipo==='descanso') proyeccion-=8;
    });
    return Math.max(0, Math.min(100, proyeccion));
  }

  function calcularBarrasEstado(){
    const fatigaMedia = fatigaProyectadaEstaSemana();
    const riesgoLesionPct=Math.round(riesgoLesionProyectado());
    return {
      formaFisica:{ pct:Math.round(fatigaMedia), color:fatigaMedia>=60?'#4caf7a':(fatigaMedia>=30?'#e6c94a':'#e24b4a') },
      riesgoLesion:{ pct:riesgoLesionPct, color:riesgoLesionPct<=15?'#4caf7a':(riesgoLesionPct<=30?'#e6c94a':'#e24b4a') },
      moral:{ pct:Math.round(((state.moral||0)+50)/100*100), color:(state.moral||0)>=10?'#4caf7a':((state.moral||0)>=-10?'#e6c94a':'#e24b4a') },
      aficion:{ pct:Math.round((((state.estadio&&state.estadio.satisfaccion)||0)+100)/200*100), color:((state.estadio&&state.estadio.satisfaccion)||0)>=10?'#4caf7a':((((state.estadio&&state.estadio.satisfaccion)||0)>=-20)?'#e6c94a':'#e24b4a') },
    };
  }

  // ---------- Definición de los 7 tipos de icono y sus 3 hitos ----------
  // Los hitos NO se resetean al canjearse — son marcas permanentes de
  // progreso a lo largo de toda la temporada, así el contador de
  // "entreno" sigue subiendo después de canjear el hito de 10, rumbo
  // al de 20, en vez de volver a empezar de cero.
  const HITOS_NODOS={
    entreno:{icon:'ph-barbell', color:'#e08a3e', hitos:[
      {umbral:5, tipo:'bandera', bandera:'boostEntrenoSemana'},
      {umbral:10, tipo:'subida_stats_uno'},
    ]},
    descanso:{icon:'ph-bed', color:'#5eead4', hitos:[
      {umbral:5, tipo:'recuperar_fatiga_parcial'},
      {umbral:10, tipo:'recuperar_fatiga_todos'},
    ]},
    // Sin ningún hito de recompensa (array vacío a propósito) — pero
    // sigue necesitando su propia entrada aquí, porque este mismo
    // objeto también define el icono/color de cada tipo de nodo Y de
    // aquí sale la lista de tipos que se pueden sortear en el árbol
    // (Object.keys(HITOS_NODOS)). Quitar la entrada entera (en vez de
    // solo vaciar sus hitos) rompía la quiniela como nodo del árbol
    // por completo, no solo sus recompensas — ya no puede volver a
    // pasar, porque asegurarQuinielaCadaSemana() de abajo no depende
    // de esto para saber que "quiniela" es un tipo válido.
    quiniela:{icon:'ph-ticket', color:'#c9a227', hitos:[]},
    scouting:{icon:'ph-binoculars', color:'#8a7fd6', hitos:[
      {umbral:5, tipo:'sobre_calidad_boost'},
      {umbral:10, tipo:'bandera', bandera:'sobreNivelSuperior'},
    ]},
    amistoso:{icon:'ph-soccer-ball', color:'#4caf7a', hitos:[
      {umbral:5, tipo:'moral_bonus_permanente'},
      {umbral:10, tipo:'reducir_perdidas_balon_liga'},
    ]},
    medios:{icon:'ph-microphone-stage', color:'#e2807f', hitos:[
      {umbral:5, tipo:'satisfaccion_empujon_leve'},
      {umbral:10, tipo:'satisfaccion_empujon'},
    ]},
    tactica:{icon:'ph-clipboard-text', color:'#5b9bd5', hitos:[
      {umbral:5, tipo:'ventaja_duelos_proximo_partido'},
      {umbral:10, tipo:'ventaja_posesion_proximo_partido'},
    ]},
  };
  // Tipos de hito que necesitan que el jugador elija a quién aplicar
  // el efecto (uno o dos jugadores de la plantilla) — la interfaz usa
  // esta lista para saber cuándo debe pedir esa elección antes de
  // canjear.
  const TIPOS_HITO_NECESITAN_JUGADOR={subida_stats_uno:1, curar_lesionado:1, subida_stats_dos:2, jugador_como_nuevo:1, experiencia_extra_jugador:1, partido_leyenda:1};

  function progresoNodo(tipoIcono){
    const def=HITOS_NODOS[tipoIcono];
    if(!def) return null;
    const acumulado=(state.nodosAcumulados&&state.nodosAcumulados[tipoIcono])||0;
    // El contador es un "saldo" que se gana (+1 por nodo elegido) y se
    // GASTA al reclamar — cada hito cuesta exactamente su propio
    // umbral (5 o 10), nunca solo el de nivel más alto. Con eso ya no
    // hace falta llevar la cuenta de "qué se ha reclamado ya": un
    // hito deja de estar disponible en cuanto se paga su coste, sin
    // trampas de doble cobro, y vuelve a estarlo en cuanto el saldo
    // vuelve a alcanzarlo con puntos nuevos — así el ciclo 5/10 se
    // repite solo, de forma natural.
    // Si el saldo alcanza para más de un hito a la vez (típicamente al
    // llegar de golpe a 10, sin haber reclamado antes el de 5), se
    // ofrece SIEMPRE el más caro de los que ya se pueden pagar — nunca
    // se obliga a reclamar primero el de nivel 1 cuando ya te mereces
    // directamente el de nivel 2.
    const reclamablesAhora=def.hitos.filter(h=>acumulado>=h.umbral);
    const siguiente = reclamablesAhora.length
      ? reclamablesAhora.reduce((mejor,h)=>h.umbral>mejor.umbral?h:mejor)
      : def.hitos[0];
    const disponible = reclamablesAhora.length>0;
    return {def, acumulado, siguiente, disponible};
  }

  // Aplica de verdad el efecto de un hito ya alcanzado. jugadorIds es
  // un array (0, 1 o 2 elementos según el tipo de hito) con los ids de
  // los jugadores elegidos, para los hitos que lo necesiten.
  function reclamarHitoNodo(tipoIcono, umbral, opcionElegida, jugadorIds){
    const def=HITOS_NODOS[tipoIcono];
    if(!def) return {ok:false, error:'tipo_desconocido'};
    const hito=def.hitos.find(h=>h.umbral===umbral);
    if(!hito) return {ok:false, error:'hito_desconocido'};
    const acumulado=(state.nodosAcumulados&&state.nodosAcumulados[tipoIcono])||0;
    // El saldo disponible es la única guardia que hace falta: si no
    // llega para pagar este hito, no se puede reclamar — sin eso no
    // hay forma de reclamarlo dos veces con los mismos puntos.
    if(acumulado<umbral) return {ok:false, error:'no_alcanzado'};

    const tipoEfectivo=hito.tipo==='eleccion' ? opcionElegida : hito.tipo;
    if(hito.tipo==='eleccion' && !hito.opciones.includes(opcionElegida)) return {ok:false, error:'opcion_invalida'};

    switch(tipoEfectivo){
      case 'bandera':
        if(!state.nodosBanderasPendientes) state.nodosBanderasPendientes={};
        state.nodosBanderasPendientes[hito.bandera]=true;
        break;
      case 'subida_stats_uno': {
        const j=(state.plantilla||[]).find(p=>p.id===(jugadorIds&&jugadorIds[0]));
        if(!j) return {ok:false, error:'jugador_no_valido'};
        ['attack','defense','pace','passing','technique'].forEach(s=>{ j[s]=Math.min(99,(j[s]||50)+1); });
        j.overall=Math.round((j.attack+j.defense+j.pace+j.passing+j.technique)/5);
        break;
      }
      case 'subida_stats_dos': {
        const ids=(jugadorIds||[]).slice(0,2);
        if(ids.length<2) return {ok:false, error:'faltan_jugadores'};
        ids.forEach(id=>{
          const j=(state.plantilla||[]).find(p=>p.id===id);
          if(j){ ['attack','defense','pace','passing','technique'].forEach(s=>{ j[s]=Math.min(99,(j[s]||50)+1); }); j.overall=Math.round((j.attack+j.defense+j.pace+j.passing+j.technique)/5); }
        });
        break;
      }
      case 'curar_lesionado': {
        const j=(state.plantilla||[]).find(p=>p.id===(jugadorIds&&jugadorIds[0]));
        if(!j || !j.injured) return {ok:false, error:'jugador_no_valido'};
        j.injured=false; j.injurySeverity=null; j.injuryWeeks=0;
        if(typeof cerrarLesionHistorial==='function') cerrarLesionHistorial(j, 'Hito de entrenamiento acumulado');
        break;
      }
      case 'recuperar_fatiga_parcial':
        // 30% de recuperación de resistencia — a diferencia del nivel
        // 10 (recuperación total), este solo recupera una parte, para
        // que haya una progresión real entre los dos niveles del
        // mismo icono.
        (state.plantilla||[]).forEach(p=>{
          const actual=p.fatigue===undefined?100:p.fatigue;
          p.fatigue=Math.min(100, Math.round(actual+(100-actual)*0.30));
        });
        break;
      case 'recuperar_fatiga_todos':
        (state.plantilla||[]).forEach(p=>{ p.fatigue=100; });
        break;
      case 'resetear_riesgo_sobrecarga':
        state.diasEntrenoSeguidosAcumulado=0;
        break;
      case 'jugador_como_nuevo': {
        const j=(state.plantilla||[]).find(p=>p.id===(jugadorIds&&jugadorIds[0]));
        if(!j) return {ok:false, error:'jugador_no_valido'};
        j.fatigue=100;
        state.moral=Math.max(-50, Math.min(50, (state.moral||0)+3));
        break;
      }
      case 'moral_bonus_permanente':
        state.amistosoBonusMoralExtra=(state.amistosoBonusMoralExtra||0)+1;
        break;
      case 'satisfaccion_empujon_leve':
        // Versión más suave del empujón de afición de nivel 10 — así
        // hay una progresión real dentro del mismo icono (leve en el
        // 5, notable en el 10), en vez de repetir el mismo efecto que
        // el resto de iconos ya usan para su propia moral.
        if(!state.estadio) state.estadio={campo:90, satisfaccion:10, aforoTotal:12000, ultimaAsistencia:null};
        state.estadio.satisfaccion=Math.max(-100, Math.min(100, state.estadio.satisfaccion+4));
        break;
      case 'sobre_calidad_boost':
        // A diferencia de una garantía única (todo o nada), este
        // contador sube la probabilidad Y la calidad del próximo
        // sobre — y si se llega a acumular más de una vez antes de
        // que el sobre llegue de verdad, el beneficio se suma. Solo
        // se reinicia a 0 cuando un sobre se genera de verdad (ver
        // intentarGenerarSobreFichajes), nunca en un intento fallido.
        state.sobreCalidadAcumulada=(state.sobreCalidadAcumulada||0)+1;
        break;
      case 'informe_rival': {
        // Un informe táctico de verdad sobre el rival de la próxima
        // jornada — revela su punto más flojo real, no un empujón de
        // ánimo genérico. Encaja con lo que hace de verdad una sesión
        // táctica: estudiar al rival antes de decidir cómo plantear
        // el partido.
        const rival=typeof obtenerRivalProximaJornada==='function' ? obtenerRivalProximaJornada() : null;
        if(!rival || rival.attack===undefined) return {ok:true, textoExtra:t('lm.hito_resultado_informe_sin_rival')};
        const stats={attack:rival.attack, defense:rival.defense, passing:rival.passing, pace:rival.pace, technique:rival.technique};
        const peor=Object.keys(stats).reduce((a,b)=>stats[a]<=stats[b]?a:b);
        return {ok:true, textoExtra:tp('lm.hito_resultado_informe_rival', {rival:rival.name, stat:t('lm.stat_'+peor), valor:stats[peor]})};
      }
      case 'reducir_perdidas_balon_liga':
        // Bandera de un solo uso — se consume en el visor real de
        // partidos (liga-manager-partido-visor.js), ese mismo módulo
        // solo se usa para partidos de LIGA, nunca amistosos (esos se
        // resuelven aparte, de forma instantánea), así que el efecto
        // siempre cae en el próximo partido de liga como corresponde.
        state.amistosoBoostPaseProximoPartido=true;
        break;
      case 'partido_leyenda': {
        const premio=15000+Math.floor(Math.random()*10000);
        state.capital=(state.capital||0)+premio;
        state.moral=Math.max(-50, Math.min(50, (state.moral||0)+10));
        if(typeof registrarMovimientoFinanciero==='function') registrarMovimientoFinanciero('Partido de leyenda (hito de amistosos)', premio, state.jornadaActual);
        const id=jugadorIds&&jugadorIds[0];
        if(id && LM_RASGOS_DEFS.length){
          const elegido=LM_RASGOS_DEFS[Math.floor(Math.random()*LM_RASGOS_DEFS.length)];
          if(elegido) asignarRasgoJugador(id, elegido.id);
        }
        break;
      }
      case 'satisfaccion_empujon':
        if(!state.estadio) state.estadio={campo:90, satisfaccion:10, aforoTotal:12000, ultimaAsistencia:null};
        state.estadio.satisfaccion=Math.max(-100, Math.min(100, state.estadio.satisfaccion+8));
        break;
      case 'carisma_permanente':
        state.mediosCarismaPermanente=(state.mediosCarismaPermanente||0)+1;
        break;
      case 'moral_empujon_fijo':
        state.moral=Math.max(-50, Math.min(50, (state.moral||0)+3));
        break;
      case 'ventaja_duelos_proximo_partido':
        // Ventaja notable en los duelos individuales del próximo
        // partido — se guarda como bandera de un solo uso, y la
        // consume jugarJornada() al construir el contexto real de MI
        // partido (mismo mecanismo que ya usa el bonus de moral,
        // sumando al ritmo goleador esperado de mi equipo).
        state.tacticaBoostProximoPartido=true;
        break;
      case 'ventaja_posesion_proximo_partido':
        // Bandera de un solo uso — se consume en el visor real de
        // partidos de liga (probPosesionMia), nunca afecta a
        // amistosos.
        state.tacticaBoostPosesionProximoPartido=true;
        break;
      case 'moral_base_permanente':
        // Este hito es el de mayor nivel (20) del icono de sesión
        // táctica — un empujón grande y permanente de moral, distinto
        // de lo que dan los otros dos niveles de este mismo icono
        // (subida de estadísticas y ventaja en el próximo partido).
        // No hace falta un
        // sistema aparte de "base permanente" que nunca se llegaba a
        // aplicar a ningún cálculo real; un empujón directo mayor
        // consigue lo mismo de forma mucho más simple.
        state.moral=Math.max(-50, Math.min(50, (state.moral||0)+10));
        break;
      default:
        return {ok:false, error:'tipo_desconocido'};
    }

    // Se paga el coste de ESTE hito — sea el de nivel 1 (5) o el de
    // nivel 2 (10) — descontándolo del saldo. Antes solo se descontaba
    // al reclamar el de nivel más alto, así que reclamar el de 5
    // (p.ej. con 7/10) no restaba nada y dejaba el contador clavado en
    // 7 en vez de en los 2 que de verdad quedaban sin gastar. Lo que
    // sobre por encima del coste nunca se pierde: sigue contando para
    // el próximo hito que se pueda pagar, del mismo icono o de nivel
    // superior, sin necesidad de ningún reseteo aparte — el ciclo 5/10
    // se repite solo, de forma natural, en cuanto el saldo vuelve a
    // alcanzar cada umbral.
    state.nodosAcumulados[tipoIcono]=Math.max(0, acumulado-umbral);
    guardarEstado();
    return {ok:true};
  }


  // ---------- Leyenda de los 7 iconos de nodo — mismo patrón que la
  // leyenda de iconos ya existente durante el partido en directo. ----------
  function mostrarLeyendaIconosNodos(){
    const existente=document.getElementById('lmNodosLeyendaOverlay');
    if(existente){ existente.remove(); return; }
    const overlay=document.createElement('div');
    overlay.id='lmNodosLeyendaOverlay';
    overlay.className='lm-visor-leyenda-overlay-standalone';
    const tipos=Object.keys(HITOS_NODOS);
    overlay.innerHTML=`
      <div class="lm-visor-leyenda-card">
        <div class="lm-visor-leyenda-titulo">${t('lm.leyenda_iconos_nodos_titulo')}</div>
        <div class="lm-visor-leyenda-lista">
          ${tipos.map(tipo=>{
            const def=HITOS_NODOS[tipo];
            return `<div class="lm-visor-leyenda-fila">
              <span class="lm-visor-leyenda-icono" style="background:${def.color}22;color:${def.color}"><i class="ph ph-bold ${def.icon}"></i></span>
              <div class="lm-visor-leyenda-texto"><strong>${t('lm.nodo_'+tipo)}</strong><span>${t('lm.nodo_desc_'+tipo)}</span></div>
            </div>`;
          }).join('')}
        </div>
        <button class="mode-card-btn mode-card-btn-gold" data-cerrar-leyenda-nodos style="margin-top:10px">${t('lm.entendido_btn')}</button>
      </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e)=>{ if(e.target===overlay) overlay.remove(); });
    overlay.querySelector('[data-cerrar-leyenda-nodos]').addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      overlay.remove();
    });
  }

  // ---------- Popup de canje de un hito — si el hito es de elección
  // (ej. entreno·10: subir stats O curar lesionado) primero pregunta
  // cuál; si el tipo resultante necesita jugador(es), pide elegirlos
  // de la plantilla antes de aplicar el efecto de verdad. ----------
  function abrirCanjeHitoNodo(tipoIcono, umbral){
    const def=HITOS_NODOS[tipoIcono];
    const hito=def && def.hitos.find(h=>h.umbral===umbral);
    if(!hito) return;
    const existente=document.getElementById('lmCanjeHitoOverlay');
    if(existente) existente.remove();
    const overlay=document.createElement('div');
    overlay.id='lmCanjeHitoOverlay';
    overlay.className='lm-visor-leyenda-overlay-standalone';
    document.body.appendChild(overlay);

    function cerrar(){ overlay.remove(); }
    overlay.addEventListener('click', (e)=>{ if(e.target===overlay) cerrar(); });

    function pintarEleccion(){
      overlay.innerHTML=`
        <div class="lm-dilemma-card" style="max-width:320px">
          <div class="lm-dilemma-title"><i class="ph ph-bold ${def.icon}" style="color:${def.color}"></i> ${t('lm.canje_titulo')}</div>
          <p class="lm-setup-desc">${t('lm.canje_elegir_opcion')}</p>
          <div class="lm-popup-actions" style="flex-direction:column;gap:8px">
            ${hito.opciones.map(op=>`<button class="mode-card-btn mode-card-btn-secondary" data-elegir-opcion="${op}" style="text-align:left;white-space:normal;height:auto;padding:10px 14px">${t('lm.hito_opcion_'+op)}</button>`).join('')}
          </div>
        </div>`;
      overlay.querySelectorAll('[data-elegir-opcion]').forEach(b=>{
        b.addEventListener('click', ()=>{
          if(typeof window.playSound==='function') window.playSound('select');
          continuarConTipo(b.getAttribute('data-elegir-opcion'));
        });
      });
    }

    function continuarConTipo(tipoEfectivo){
      const numJugadores=TIPOS_HITO_NECESITAN_JUGADOR[tipoEfectivo]||0;
      if(numJugadores===0){
        aplicarYFinalizar(hito.tipo==='eleccion'?tipoEfectivo:null, []);
        return;
      }
      pintarSelectorJugadores(tipoEfectivo, numJugadores);
    }

    function pintarSelectorJugadores(tipoEfectivo, numJugadores){
      const soloLesionados=tipoEfectivo==='curar_lesionado';
      const candidatos=(state.plantilla||[]).filter(p=>!soloLesionados||p.injured);
      if(!candidatos.length){
        overlay.innerHTML=`
          <div class="lm-dilemma-card" style="max-width:320px">
            <div class="lm-dilemma-title"><i class="ph ph-bold ph-warning-circle"></i> ${t('lm.canje_titulo')}</div>
            <p class="lm-setup-desc">${t('lm.canje_sin_lesionados')}</p>
            <div class="lm-popup-actions"><button class="mode-card-btn mode-card-btn-gold" data-cerrar-canje>${t('lm.entendido_btn')}</button></div>
          </div>`;
        overlay.querySelector('[data-cerrar-canje]').addEventListener('click', ()=>{
          if(typeof window.playSound==='function') window.playSound('select');
          cerrar();
        });
        return;
      }
      const elegidos=[];
      overlay.innerHTML=`
        <div class="lm-dilemma-card lm-seguridad-card" style="max-width:300px;text-align:left">
          <div class="lm-dilemma-title"><i class="ph ph-bold ${def.icon}" style="color:${def.color}"></i> ${t('lm.canje_titulo')}</div>
          <p class="lm-setup-desc">${numJugadores>1?t('lm.canje_elegir_dos_jugadores'):t('lm.canje_elegir_jugador')}</p>
          <div class="lm-canje-lista-jugadores">
            ${candidatos.map(j=>`<label class="lm-canje-jugador-fila">
              <input type="checkbox" data-jugador-id="${j.id}">
              <span>${j.name}${j.injured?` <i class=\"ph ph-bold ph-bandaids\" style=\"color:#e24b4a\"></i>`:''}</span>
              <i class="ph ph-bold ph-check-circle lm-canje-jugador-check"></i>
            </label>`).join('')}
          </div>
          <div class="lm-popup-actions"><button class="mode-card-btn mode-card-btn-gold" data-confirmar-jugadores disabled>${t('lm.canje_confirmar')}</button></div>
        </div>`;
      const confirmarBtn=overlay.querySelector('[data-confirmar-jugadores]');
      overlay.querySelectorAll('[data-jugador-id]').forEach(chk=>{
        chk.addEventListener('change', ()=>{
          const id=chk.getAttribute('data-jugador-id');
          if(typeof window.playSound==='function') window.playSound('select');
          if(chk.checked){
            // Si ya se llegó al máximo de jugadores permitidos, el
            // más reciente sustituye al que se eligió primero — antes
            // esto simplemente se rechazaba (el checkbox se
            // desmarcaba solo) y había que desmarcar a mano el
            // anterior antes de poder elegir a otro, lo cual no era
            // nada intuitivo, sobre todo cuando solo hace falta
            // elegir a un único jugador.
            while(elegidos.length>=numJugadores){
              const idAntiguo=elegidos.shift();
              const chkAntiguo=overlay.querySelector(`[data-jugador-id="${idAntiguo}"]`);
              if(chkAntiguo) chkAntiguo.checked=false;
            }
            elegidos.push(id);
          } else {
            const idx=elegidos.indexOf(id);
            if(idx>=0) elegidos.splice(idx,1);
          }
          confirmarBtn.disabled=elegidos.length!==numJugadores;
        });
      });
      confirmarBtn.addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        aplicarYFinalizar(hito.tipo==='eleccion'?tipoEfectivo:null, elegidos);
      });
    }

    function aplicarYFinalizar(opcionElegida, jugadorIds){
      const resultado=reclamarHitoNodo(tipoIcono, umbral, opcionElegida, jugadorIds);
      if(!resultado.ok){
        cerrar();
        return;
      }
      // Reclamar una recompensa merece una fanfarria de verdad, no el
      // "reveal" genérico que se usa para cualquier otra cosa — misma
      // fanfarria ascendente que ya usa el juego para las victorias.
      if(typeof window.playSound==='function') window.playSound('victory');
      // Si era un hito de elección, se describe la opción concreta que
      // se eligió (no el "elige entre X o Y" genérico, que ya no
      // aplica una vez decidido) — el resto usa la descripción normal
      // del hito.
      const descripcionFinal = resultado.textoExtra ? resultado.textoExtra : (opcionElegida ? t('lm.hito_opcion_'+opcionElegida) : descripcionHitoNodo(tipoIcono, umbral));
      overlay.innerHTML=`
        <div class="lm-dilemma-card" style="max-width:300px">
          <i class="ph ph-bold ph-check-circle" style="font-size:40px;color:${def.color};margin-bottom:8px"></i>
          <div class="lm-dilemma-title" style="justify-content:center">${t('lm.canje_exito')}</div>
          <p class="lm-setup-desc" style="margin:0 0 12px">${descripcionFinal}</p>
          <div class="lm-popup-actions"><button class="mode-card-btn mode-card-btn-gold" data-cerrar-canje-ok>${t('lm.entendido_btn')}</button></div>
        </div>`;
      overlay.querySelector('[data-cerrar-canje-ok]').addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        cerrar();
        // render() reemplaza todo el contenido de la pantalla, lo que
        // reinicia el scroll a 0 sin avisar — eso era lo que hacía que
        // la columna "saltase" justo cuando más falta hacía verla
        // quieta, para poder apreciar cómo suben o bajan las barras
        // de arriba tras reclamar. Se guarda la posición exacta antes
        // de repintar y se restaura justo después, en el mismo sitio.
        const scrollContenedor=document.getElementById('ligaManagerScreen');
        const scrollGuardado=scrollContenedor?scrollContenedor.scrollTop:0;
        render();
        requestAnimationFrame(()=>{
          const contenedorNuevo=document.getElementById('ligaManagerScreen');
          if(contenedorNuevo) contenedorNuevo.scrollTop=scrollGuardado;
        });
      });
    }

    if(hito.tipo==='eleccion') pintarEleccion();
    else continuarConTipo(hito.tipo);
  }

  /* ═══════════════════════════════════════════════════════════════
     SEMANA DE NODOS — Fase 2: generación real del camino semanal y
     resolución de cada tipo de nodo al elegirlo.
     ═══════════════════════════════════════════════════════════════ */

  function barajarArrayNodos(arr){
    const a=arr.slice();
    for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
    return a;
  }

  // Genera las opciones de UN día — 2 o 3 tipos distintos (nunca
  // repetidos el mismo día), con subtipo cuando corresponda (entreno
  // estándar/intenso, dificultad del amistoso).
  // numOpciones: cuántas opciones generar. poolTipos: de qué tipos
  // elegir (si no se indica, usa los 7 tipos normales). Se usa para
  // poder restringir qué tipos pueden salir cada día (el primer día
  // solo entreno/descanso, la entrevista solo en el último).
  function generarOpcionesDiaNodo(numOpciones, poolTipos, tipoForzado){
    const pool=poolTipos || Object.keys(HITOS_NODOS);
    let tipos;
    if(tipoForzado && pool.includes(tipoForzado)){
      // Se garantiza que este tipo concreto esté entre las opciones
      // del día — el resto de huecos se rellena al azar con lo que
      // quede del resto del pool.
      const resto=barajarArrayNodos(pool.filter(t=>t!==tipoForzado)).slice(0, Math.max(0, Math.min(numOpciones,pool.length)-1));
      tipos=barajarArrayNodos([tipoForzado, ...resto]);
    } else {
      tipos=barajarArrayNodos(pool).slice(0, Math.min(numOpciones, pool.length));
    }
    return tipos.map(tipo=>{
      const nodo={tipo};
      if(tipo==='entreno') nodo.subtipo = Math.random()<0.5 ? 'estandar' : 'intenso';
      if(tipo==='amistoso') nodo.subtipo = ['facil','normal','dificil'][Math.floor(Math.random()*3)];
      return nodo;
    });
  }

  // Conecta cada nodo de un día con un SUBCONJUNTO de los del día
  // siguiente (no con todos) — así hay caminos de verdad exclusivos:
  // elegir uno u otro nodo hoy puede llevar a opciones distintas
  // mañana. Se garantiza que ningún nodo del día siguiente se quede
  // sin ninguna conexión de entrada (inalcanzable).
  // Regla de conexión: reparto de verdad (partición), no que un nodo
  // siempre lo cubra todo. Cada opción del día siguiente se asigna a
  // UN SOLO nodo concreto de hoy — por ejemplo, con 2 nodos hoy y 3
  // mañana, uno de hoy puede llevar a 1 de mañana y el otro a los 2
  // restantes. Entre todos los nodos de hoy se cubre siempre el 100%
  // de mañana, pero ninguno necesita cubrirlo él solo.
  function asignarConexionesExclusivas(diaOrigen, diaDestino){
    const numOrigen=diaOrigen.nodos.length, numDestino=diaDestino.nodos.length;
    diaOrigen.nodos.forEach(nodo=>{ nodo.siguientes=[]; });
    if(numOrigen===1){
      // Único origen posible (día 1): no hay nada que repartir, tiene
      // que llevar a todas las opciones del día siguiente.
      diaOrigen.nodos[0].siguientes=diaDestino.nodos.map((_,idx)=>idx);
      return;
    }
    // Se baraja el orden de los destinos y se reparten uno a uno entre
    // los nodos de hoy (round robin) — así cada destino cae en un solo
    // origen, sin duplicarse entre varios.
    const destinosBarajados=barajarArrayNodos(diaDestino.nodos.map((_,idx)=>idx));
    destinosBarajados.forEach((destinoIdx, i)=>{
      diaOrigen.nodos[i%numOrigen].siguientes.push(destinoIdx);
    });
    // Si hay más nodos hoy que opciones mañana, algún nodo de hoy
    // podría quedarse sin ningún destino tras el reparto — se le da
    // uno al azar para que nunca se quede sin salida.
    diaOrigen.nodos.forEach(nodo=>{
      if(nodo.siguientes.length===0) nodo.siguientes.push(Math.floor(Math.random()*numDestino));
    });
  }

  // Con la regla generosa de arriba, cada nodo alcanzable de un día
  // deja alcanzable a casi todos los del siguiente — así que, salvo
  // casos de mala suerte extrema, ya no hace falta parchear nada aquí.
  // Se mantiene igualmente como red de seguridad final: recorre la
  // semana entera con los caminos reales que se pueden seguir desde el
  // día 1, y si pese a todo algún nodo quedara sin cobertura real,
  // lo conecta directamente desde el propio día 1 (que siempre está
  // garantizado alcanzable de por sí).
  function garantizarAlcanzabilidadGlobal(dias){
    if(!dias.length) return;
    let alcanzables=dias[0].nodos.map((_,i)=>i); // día 1: siempre los dos alcanzables
    for(let i=1;i<dias.length;i++){
      const diaAnterior=dias[i-1], diaActual=dias[i];
      const nuevoAlcanzable=new Set();
      alcanzables.forEach(oi=>{
        (diaAnterior.nodos[oi].siguientes||[]).forEach(di=>nuevoAlcanzable.add(di));
      });
      diaActual.nodos.forEach((_,di)=>{
        if(!nuevoAlcanzable.has(di)){
          const origenAlcanzable=alcanzables[Math.floor(Math.random()*alcanzables.length)];
          diaAnterior.nodos[origenAlcanzable].siguientes.push(di);
          nuevoAlcanzable.add(di);
        }
      });
      alcanzables=[...nuevoAlcanzable];
    }
  }

  // Genera el árbol completo de la semana actual, a partir de la
  // ventana real de días entre el partido anterior y el próximo — las
  // mismas fechas que ya usaba el calendario de entrenamiento de
  // siempre, así que la duración de la semana es siempre coherente
  // con el resto del juego (nunca inventa días de más o de menos).
  function generarSemanaNodos(){
    const ventana=ventanaEntrenoActual();
    if(!ventana){ state.semanaNodos=null; return; }
    const fechas=[];
    const cur=new Date(ventana.desde); cur.setDate(cur.getDate()+1);
    while(cur.getTime()<ventana.hasta.getTime()){ fechas.push(new Date(cur)); cur.setDate(cur.getDate()+1); }
    const n=fechas.length;
    if(n===0){ state.semanaNodos=null; return; }
    const TIPOS_SIN_MEDIOS=Object.keys(HITOS_NODOS).filter(t=>t!=='medios');
    // La quiniela debe aparecer SIEMPRE exactamente una vez por
    // semana — nunca cero (antes dependía de que el sorteo la
    // incluyera por suerte, así que algunas semanas se quedaban sin
    // ninguna) ni más de una. Se elige al azar cuál de los días
    // intermedios será "el día de la quiniela" antes de generar nada.
    const diasIntermedios=Math.max(0, n-2); // entre el primero y el ultimo, ambos con pool fijo
    const diaQuinielaIdx = diasIntermedios>0 ? 1+Math.floor(Math.random()*diasIntermedios) : -1;
    let quinielaYaOfrecida=false;
    const dias=fechas.map((fecha,i)=>{
      const esPrimero = i===0, esUltimo = i===n-1;
      let numOpciones, pool;
      if(esPrimero){ numOpciones=2; pool=['entreno','descanso']; }
      else if(esUltimo){ numOpciones=1; pool=['medios']; }
      else {
        numOpciones=2+Math.floor(Math.random()*2);
        pool = quinielaYaOfrecida ? TIPOS_SIN_MEDIOS.filter(t=>t!=='quiniela') : TIPOS_SIN_MEDIOS;
      }
      const nodos=generarOpcionesDiaNodo(numOpciones, pool, i===diaQuinielaIdx?'quiniela':null);
      if(nodos.some(nd=>nd.tipo==='quiniela')) quinielaYaOfrecida=true;
      return {fecha:fechaISO(fecha), nodos, elegido:null};
    });
    for(let i=0;i<dias.length-1;i++) asignarConexionesExclusivas(dias[i], dias[i+1]);
    garantizarAlcanzabilidadGlobal(dias);
    state.semanaNodos={jornada:state.jornadaActual, dias};
  }

  // Índices de las opciones del día actual que de verdad se pueden
  // elegir — para el primer día son todas (no hay día anterior), para
  // el resto solo las que el nodo elegido ayer conecta hacia adelante
  // (los "caminos exclusivos"). Las demás siguen apareciendo en el
  // árbol pero ya no son alcanzables esta semana.
  function nodosAlcanzablesHoy(){
    const idx=diaActualIndiceSemanaNodos();
    if(idx<0 || !state.semanaNodos) return [];
    const diaHoy=state.semanaNodos.dias[idx];
    if(idx===0) return diaHoy.nodos.map((_,i)=>i);
    const diaAnterior=state.semanaNodos.dias[idx-1];
    const elegidoAyer=diaAnterior && diaAnterior.nodos[diaAnterior.elegido];
    return (elegidoAyer && elegidoAyer.siguientes) ? elegidoAyer.siguientes.slice() : diaHoy.nodos.map((_,i)=>i);
  }

  // Si no existe arbol para la jornada actual (primera vez, o cambio
  // de jornada), lo genera. Nunca regenera uno ya empezado.
  function asegurarSemanaNodos(){
    if(!state.semanaNodos || state.semanaNodos.jornada!==state.jornadaActual) generarSemanaNodos();

  }

  function diaActualIndiceSemanaNodos(){
    if(!state.semanaNodos) return -1;
    return state.semanaNodos.dias.findIndex(d=>d.elegido===null);
  }

  // Simulación rápida de un amistoso — sin visor de partido completo,
  // solo un resultado con su repercusión real (fatiga, riesgo de
  // lesión escalado por la dificultad elegida, moral si se gana).
  function resolverAmistosoRapido(dificultad){
    const misStats=(typeof calcularStatsEquipoLM==='function') ? calcularStatsEquipoLM() : {overall:60};
    const ajuste = dificultad==='facil' ? -15 : (dificultad==='dificil' ? 15 : 0);
    const miOverall = misStats.overall || 60;
    const rivalOverall = Math.max(30, Math.min(90, miOverall+ajuste));
    const probGanar = 1/(1+Math.pow(10,(rivalOverall-miOverall)/18));
    const rollResultado=Math.random();
    const resultado = rollResultado<probGanar ? 'victoria' : (rollResultado<probGanar+0.22 ? 'empate' : 'derrota');
    // Marcador simple, solo de cara al pop-up de resultado — no es un
    // partido simulado evento a evento como los de verdad, es la
    // resolución rápida propia del árbol de nodos.
    let misGoles, susGoles;
    if(resultado==='victoria'){ misGoles=1+Math.floor(Math.random()*3); susGoles=Math.max(0, misGoles-1-Math.floor(Math.random()*2)); }
    else if(resultado==='derrota'){ susGoles=1+Math.floor(Math.random()*3); misGoles=Math.max(0, susGoles-1-Math.floor(Math.random()*2)); }
    else { misGoles=susGoles=Math.floor(Math.random()*3); }

    // OJO: la fatiga NO se aplica aquí todavía — igual que moral y
    // afición, se calcula y se guarda (fatigaDeltas) para aplicarse de
    // verdad en aplicarConsecuenciasAmistoso(), al cerrar el pop-up con
    // ENTENDIDO. Antes esta línea mutaba p.fatigue al instante, así que
    // la barra de forma física ya se movía en el mismo segundo de
    // elegir el nodo, spoileando el amistoso igual que hacía la barra
    // de afición antes de arreglarse.
    const fatigaDeltas=(state.plantilla||[]).map(p=>({id:p.id, delta:15}));

    // Los amistosos NUNCA generan tarjetas (no hay ningún código de
    // tarjetas en esta función, a propósito) — pero SÍ pueden dejar
    // lesiones, con probabilidad Y gravedad que suben con la
    // dificultad elegida para el amistoso: uno "fácil" apenas arriesga
    // nada, uno "difícil" se juega de verdad al mismo nivel de riesgo
    // que un partido de competición.
    const nivelesMed=state.medicoNiveles||{};
    const factorPrevencion=Math.pow(0.85, (nivelesMed.prevencionMuscular||0)+(nivelesMed.prevencionOsea||0));
    const probLesionBase = dificultad==='dificil' ? 0.10 : (dificultad==='normal' ? 0.06 : 0.03);
    let lesionadoNombre=null;
    if(Math.random()<probLesionBase*factorPrevencion && state.plantilla && state.plantilla.length){
      const candidato=state.plantilla[Math.floor(Math.random()*state.plantilla.length)];
      if(candidato && !candidato.injured){
        // Gravedad ponderada según la dificultad: en "fácil" casi
        // siempre leve, en "difícil" hay hueco real para algo grave —
        // antes toda lesión de amistoso era fija "leve"/1 semana pase
        // lo que pase, sin distinguir un amistoso de entrenamiento
        // suave de uno exigente de pretemporada.
        const TABLA_SEVERIDAD_AMISTOSO = {
          facil:   [{label:'leve', weeks:1, peso:0.92},{label:'moderada', weeks:2, peso:0.08}],
          normal:  [{label:'leve', weeks:1, peso:0.65},{label:'moderada', weeks:2, peso:0.30},{label:'grave', weeks:4, peso:0.05}],
          dificil: [{label:'leve', weeks:1, peso:0.45},{label:'moderada', weeks:2, peso:0.38},{label:'grave', weeks:4, peso:0.17}],
        };
        const tabla=TABLA_SEVERIDAD_AMISTOSO[dificultad]||TABLA_SEVERIDAD_AMISTOSO.normal;
        let rSev=Math.random(), sevAmistoso=tabla[tabla.length-1];
        for(const s of tabla){ if(rSev<s.peso){ sevAmistoso=s; break;} rSev-=s.peso; }
        const nivelCuracion = Math.random()<0.5 ? (nivelesMed.curacionMuscular||0) : (nivelesMed.curacionOsea||0);
        candidato.injured=true;
        candidato.injurySeverity=sevAmistoso.label;
        candidato.injuryWeeks=Math.max(1, sevAmistoso.weeks-nivelCuracion);
        candidato.injuryFamilia='muscular';
        lesionadoNombre=candidato.name;
      }
    }
    // Moral y afición NO se aplican aquí — solo se calcula cuánto
    // tocaría cambiar cada una, y se guarda para aplicarse de verdad
    // cuando el jugador cierre el resultado (aplicarConsecuenciasAmistoso),
    // así las barras de arriba no cambian hasta que el amistoso
    // termina de verdad, no en el mismo instante de elegir el nodo.
    // Ganar: sube moral y afición. Perder: baja solo la afición, la
    // moral no se toca. Empatar: ninguna de las dos cambia.
    let moralDelta=0, aficionDelta=0;
    if(resultado==='victoria'){
      const bonusExtra=state.amistosoBonusMoralExtra||0;
      moralDelta=5+bonusExtra;
      aficionDelta=6;
    } else if(resultado==='derrota'){
      aficionDelta=-6;
    }
    state.ultimoAmistosoResultado={dificultad, resultado, lesionado:lesionadoNombre, misGoles, susGoles, moralDelta, aficionDelta, fatigaDeltas, consecuenciasAplicadas:false};
    return state.ultimoAmistosoResultado;
  }

  // Aplica de verdad moral, afición y fatiga del último amistoso — se
  // llama al cerrar el pop-up de resultado, nunca antes, para que las
  // barras de arriba (forma física incluida) no se muevan hasta que el
  // jugador vea el resultado completo del amistoso.
  function aplicarConsecuenciasAmistoso(){
    const r=state.ultimoAmistosoResultado;
    if(!r || r.consecuenciasAplicadas) return;
    if(r.moralDelta) state.moral=Math.max(-50, Math.min(50, (state.moral||0)+r.moralDelta));
    if(r.aficionDelta){
      if(!state.estadio) state.estadio={campo:90, satisfaccion:10, aforoTotal:12000, ultimaAsistencia:null};
      state.estadio.satisfaccion=Math.max(-100, Math.min(100, (state.estadio.satisfaccion||0)+r.aficionDelta));
    }
    if(r.fatigaDeltas && r.fatigaDeltas.length){
      r.fatigaDeltas.forEach(fd=>{
        const p=(state.plantilla||[]).find(pl=>pl.id===fd.id);
        if(p) p.fatigue=Math.max(0,(p.fatigue==null?100:p.fatigue)-fd.delta);
      });
    }
    r.consecuenciasAplicadas=true;
    guardarEstado();
  }

  // Aplica de verdad el efecto de un nodo elegido. fechaISOdia es la
  // fecha real de ese día concreto (para entreno/descanso, que siguen
  // usando el mismo calendarioEntrenamiento de siempre por debajo).
  function aplicarEfectoNodoSemana(nodo, fechaISOdia, onMediosCerrado, onQuinielaCerrada, onScoutingCerrado){
    // Registro aparte de qué nodo se eligió ese día concreto — solo
    // de cara a pintar el icono correcto sobre el calendario después.
    // No sustituye a calendarioEntrenamiento (que sigue siendo la
    // fuente real que usa procesarEntrenamientoSemanal), es solo un
    // reflejo visual.
    if(!state.calendarioNodoElegido) state.calendarioNodoElegido={};
    state.calendarioNodoElegido[fechaISOdia]={tipo:nodo.tipo, subtipo:nodo.subtipo||null};
    switch(nodo.tipo){
      case 'entreno':
        if(!state.calendarioEntrenamiento) state.calendarioEntrenamiento={};
        state.calendarioEntrenamiento[fechaISOdia]=true;
        if(nodo.subtipo==='intenso'){
          if(!state.diasEntrenoIntenso) state.diasEntrenoIntenso={};
          state.diasEntrenoIntenso[fechaISOdia]=true;
        }
        break;
      case 'descanso':
        // No hace falta marcar nada especial — un día sin
        // calendarioEntrenamiento[fecha]=true ya cuenta como descanso
        // para procesarEntrenamientoSemanal(), la lógica ya existente.
        break;
      case 'quiniela':
        state.quinielaDisponibleEstaJornada=true;
        // Elegir este nodo genera el boletín de la jornada que viene
        // (si no existe uno ya listo sin rellenar) y lo abre ahí
        // mismo — ya no depende de "cada 3 victorias", es el propio
        // nodo semanal el que la trae, una vez por jornada.
        // El índice se pasa como jornadaActual-1 (no el valor por
        // defecto) porque este nodo se elige DURANTE la semana previa
        // a esa misma jornada — jugarJornada() resuelve más tarde esa
        // jornada con j=jornadaActual-1, así que el boletín tiene que
        // guardarse con ese mismo índice para que coincidan y la
        // quiniela se resuelva y se muestre de verdad al final del
        // partido (antes se generaba con el índice sin restar, que
        // solo encajaba con el disparador antiguo de "cada 3
        // victorias", generado una jornada antes de resolverse).
        if((!state.quinielaBoleto || state.quinielaBoleto.rellenado) && typeof generarBoletoQuiniela==='function'){
          generarBoletoQuiniela(state.jornadaActual-1);
        }
        if(state.quinielaBoleto && !state.quinielaBoleto.rellenado && typeof abrirBoletoQuiniela==='function'){
          // Igual que con la entrevista: si este nodo resulta ser el
          // último día pendiente de la semana, el resumen no debe
          // aparecer hasta que el jugador termine de verdad con el
          // boletín (lo rellene o lo cierre) — antes esto no estaba
          // conectado, así que el árbol podía cerrarse solo y saltar
          // al resumen mientras el boletín seguía abierto encima, sin
          // resolver de ninguna manera.
          abrirBoletoQuiniela(onQuinielaCerrada);
        } else if(typeof onQuinielaCerrada==='function'){
          onQuinielaCerrada();
        }
        break;
      case 'scouting':
        // Minijuego de scouting (activable/desactivable con
        // LM_MINIJUEGO_SCOUTING_ACTIVO, ver más abajo) — si está
        // desactivado, se mantiene EXACTAMENTE el comportamiento de
        // siempre (tirada automática e invisible), así que apagar la
        // constante basta para volver atrás sin tocar nada más.
        if(LM_MINIJUEGO_SCOUTING_ACTIVO && typeof abrirMinijuegoScouting==='function'){
          // Igual que "medios"/"quiniela": el efecto real (la tirada)
          // no ocurre aquí mismo, sino al cerrar el minijuego — por eso
          // se abre en un setTimeout(0), DESPUÉS de que elegirNodoSemana
          // termine de aplicar su propia contabilidad (nodosAcumulados,
          // guardarEstado) más abajo. Así el callback de cierre siempre
          // encuentra el estado ya consistente, nunca a mitad de
          // actualizar.
          setTimeout(()=>{
            abrirMinijuegoScouting(()=>{ if(typeof onScoutingCerrado==='function') onScoutingCerrado(); });
          }, 0);
        } else {
          state.scoutingBoostEstaSemana=(state.scoutingBoostEstaSemana||0)+1;
          if(typeof intentarGenerarSobreFichajes==='function') intentarGenerarSobreFichajes();
        }
        break;
      case 'amistoso':
        resolverAmistosoRapido(nodo.subtipo);
        break;
      case 'medios': {
        state.ruedaPrensaDisponibleEstaJornada=true;
        // Se lanza la rueda de prensa de verdad, ahí mismo, en cuanto
        // se elige el nodo — antes solo se marcaba una bandera que
        // nunca llegaba a usarse, dejando la elección sin ningún
        // efecto visible.
        if(!state.lmPendingPrediction && typeof mostrarRuedaPrensaLM==='function'){
          const rival=typeof obtenerRivalProximaJornada==='function' ? obtenerRivalProximaJornada() : null;
          const overlayPrensa=document.createElement('div');
          overlayPrensa.id='lmPrensaNodoOverlay';
          overlayPrensa.className='lm-visor-leyenda-overlay-standalone';
          document.body.appendChild(overlayPrensa);
          mostrarRuedaPrensaLM(overlayPrensa, rival?rival.name:null, ()=>{
            overlayPrensa.remove();
            // Como la entrevista es siempre el último día, el resumen
            // de la semana no debe aparecer hasta que el jugador
            // termine de verdad la rueda de prensa — no antes.
            if(typeof onMediosCerrado==='function') onMediosCerrado();
          });
          // Ya se ha resuelto aquí mismo — que el resumen animado de
          // fin de semana no vuelva a lanzar otra entrevista el mismo
          // día por su cuenta.
          state.lmPrensaResueltaPorNodo=true;
        } else if(typeof onMediosCerrado==='function'){
          onMediosCerrado();
        }
        break;
      }
      case 'tactica':
        state.moral=Math.max(-50, Math.min(50, (state.moral||0)+4));
        break;
    }
  }

  // Punto de entrada único al elegir un nodo — valida que sea
  // realmente el día que toca (nunca se puede elegir un día futuro ni
  // repetir uno ya resuelto), aplica el efecto, suma al contador de
  // ese icono, y guarda.
  function elegirNodoSemana(diaIdx, nodoIdx, onMediosCerrado, onQuinielaCerrada, onScoutingCerrado){
    if(!state.semanaNodos) return {ok:false, error:'sin_semana'};
    const diaActualIdx=diaActualIndiceSemanaNodos();
    if(diaIdx!==diaActualIdx) return {ok:false, error:'no_es_el_dia_actual'};
    // No basta con pertenecer al día actual — con caminos exclusivos,
    // solo son elegibles los nodos a los que la elección de ayer da
    // paso de verdad.
    if(!nodosAlcanzablesHoy().includes(nodoIdx)) return {ok:false, error:'no_alcanzable'};
    const dia=state.semanaNodos.dias[diaIdx];
    const nodo=dia && dia.nodos[nodoIdx];
    if(!nodo) return {ok:false, error:'nodo_invalido'};
    dia.elegido=nodoIdx;
    aplicarEfectoNodoSemana(nodo, dia.fecha, onMediosCerrado, onQuinielaCerrada, onScoutingCerrado);
    if(!state.nodosAcumulados) state.nodosAcumulados={};
    // Para los amistosos, el contador de progreso NO se suma aquí —
    // se difiere hasta que se cierra el pop-up de resultado (botón
    // ENTENDIDO, ver aplicarIncrementoNodoAmistoso), igual que ya se
    // hacía con la moral y la afición. Sumarlo aquí mismo, al elegir
    // el nodo, repintaba las barras del árbol con el nuevo valor ANTES
    // de que el jugador viera el resultado del amistoso — un
    // spoiler real de si algo bueno había pasado.
    if(nodo.tipo!=='amistoso'){
      state.nodosAcumulados[nodo.tipo]=(state.nodosAcumulados[nodo.tipo]||0)+1;
    }
    guardarEstado();
    return {ok:true, nodo};
  }

  // Aplica de verdad el incremento del contador de progreso del nodo
  // "amistoso" — se llama al cerrar el pop-up de resultado (botón
  // ENTENDIDO), nunca antes, para que las barras de recompensas del
  // árbol no se muevan hasta que el jugador vea el resultado completo
  // del amistoso. Protegido contra doble aplicación (p.ej. si el
  // jugador pudiera cerrar el pop-up dos veces).
  function aplicarIncrementoNodoAmistoso(){
    const r=state.ultimoAmistosoResultado;
    if(!r || r.nodoAcumuladoAplicado) return;
    if(!state.nodosAcumulados) state.nodosAcumulados={};
    state.nodosAcumulados.amistoso=(state.nodosAcumulados.amistoso||0)+1;
    r.nodoAcumuladoAplicado=true;
    guardarEstado();
  }


  function contarEntrenoSemanaActual(){
    const v=ventanaEntrenoActual();
    if(!v) return {entreno:0, descanso:0, dias:0};
    let entreno=0, dias=0;
    const cur=new Date(v.desde); cur.setDate(cur.getDate()+1);
    while(cur.getTime()<v.hasta.getTime()){
      dias++;
      if(state.calendarioEntrenamiento && state.calendarioEntrenamiento[fechaISO(cur)]) entreno++;
      cur.setDate(cur.getDate()+1);
    }
    return {entreno, descanso:dias-entreno, dias};
  }
  // Procesa la semana de entrenamiento día a día: solo los jugadores
  // elegidos en el PLAN DE ENTRENAMIENTO mejoran de verdad (permanente,
  // sube su valor real), y entrenar muchos días seguidos sube el riesgo
  // de lesión por sobrecarga — mitigado por la prevención del médico.
  // Devuelve la lista de eventos día a día para el visionado rápido de
  // la semana antes del partido.
  function procesarEntrenamientoSemanal(){
    const v=ventanaEntrenoActual();
    const eventosDias=[];
    if(!v) return eventosDias;
    const NOMBRE_STAT={
      get attack(){return t('lm.stat_attack');}, get defense(){return t('lm.stat_defense');},
      get pace(){return t('lm.stat_pace');}, get passing(){return t('lm.stat_passing');}, get technique(){return t('lm.stat_technique');}
    };
    const plan=(state.pfPlanEntrenamiento||[])
      .map(entry=>{
        const jugador=state.plantilla.find(p=>p.id===entry.jugadorId);
        return jugador ? {jugador, stat:entry.stat} : null;
      })
      .filter(Boolean);
    const nivelesMed=state.medicoNiveles||{};
    const bonusPlanificacion=1+nivelDePF('planificacionSemanal')*0.25;
    // Hito de entreno acumulado (5 nodos): sube la probabilidad de
    // mejora de TODA la semana que se procesa ahora — se consume una
    // sola vez, al empezar a procesar esta semana en concreto.
    let bonusHitoSemana=1;
    if(state.nodosBanderasPendientes && state.nodosBanderasPendientes.boostEntrenoSemana){
      bonusHitoSemana=1.5;
      state.nodosBanderasPendientes.boostEntrenoSemana=false;
    }
    // Hito de amistoso (10 nodos): un jugador concreto tiene mejor
    // probabilidad en su próximo entreno — se consume la primera vez
    // que ese jugador entrena esta semana, salga bien o mal la tirada.
    let jugadorConExperienciaExtra = (state.nodosBanderasPendientes && state.nodosBanderasPendientes.experienciaExtraJugadorId) || null;
    const cur=new Date(v.desde); cur.setDate(cur.getDate()+1);
    let seguidos=0;
    // Seguimiento agregado de toda la semana, para el resumen final
    // condensado (no hace falta guardar el detalle día a día ahí).
    const mejorasPorJugador={}; // id -> {nombre, stats:{campo:cantidad}}
    const lesionesSemana=[]; // {nombre, familia}
    let diasEntreno=0, diasDescanso=0;
    while(cur.getTime()<v.hasta.getTime()){
      const iso=fechaISO(cur);
      const esEntreno=!!(state.calendarioEntrenamiento && state.calendarioEntrenamiento[iso]);
      const textos=[];
      if(esEntreno){
        diasEntreno++;
        seguidos++;
        const idsEnPlanHoy=new Set(plan.map(({jugador:j})=>j.id));
        // Jugadores del Plan de Entrenamiento del preparador físico:
        // probabilidad ALTA de mejorar justo la estadística elegida
        // para cada uno.
        plan.forEach(({jugador:j, stat:campo})=>{
          if(!campo) return; // sin enfoque elegido, no entrena de verdad
          const bonusJugador = (jugadorConExperienciaExtra && j.id===jugadorConExperienciaExtra) ? 1.5 : 1;
          if(Math.random()<0.30*bonusPlanificacion*bonusHitoSemana*bonusJugador){
            j[campo]=Math.min(99, Math.round((j[campo]||50)+1));
            // Recalcular el overall del jugador cada vez que mejora una
            // estadística — antes la estadística subía pero la
            // puntuación general se quedaba con el valor antiguo, y por
            // extensión también la media del equipo (que se calcula a
            // partir del overall de cada jugador) hasta que algo más
            // la refrescara por otro motivo.
            j.overall=Math.round((j.attack+j.defense+j.pace+j.passing+j.technique)/5);
            textos.push(tp('lm.dia_mejora_stat', {nombre:j.name, stat:t('lm.stat_'+campo)}));
            if(!mejorasPorJugador[j.id]) mejorasPorJugador[j.id]={nombre:j.name, stats:{}};
            mejorasPorJugador[j.id].stats[campo]=(mejorasPorJugador[j.id].stats[campo]||0)+1;
          }
          if(jugadorConExperienciaExtra && j.id===jugadorConExperienciaExtra){
            jugadorConExperienciaExtra=null;
            state.nodosBanderasPendientes.experienciaExtraJugadorId=null;
          }
        });
        // El resto de la plantilla (once + banquillo) también entrena
        // ese día, solo que sin un plan específico detrás — tienen una
        // probabilidad de mejora MUCHO más baja que los del Plan de
        // Entrenamiento (aprox. 1/8), y cuando mejoran lo hacen en su
        // estadística más floja en vez de en una elegida a propósito,
        // ya que nadie les está entrenando ese punto en concreto.
        state.plantilla.forEach(j=>{
          if(idsEnPlanHoy.has(j.id) || j.injured) return;
          const bonusJugador = (jugadorConExperienciaExtra && j.id===jugadorConExperienciaExtra) ? 1.5 : 1;
          if(Math.random()<0.0375*bonusPlanificacion*bonusHitoSemana*bonusJugador){
            const stats=['attack','defense','pace','passing','technique'];
            const campo=stats.reduce((peor,s)=>(j[s]||50)<(j[peor]||50)?s:peor, stats[0]);
            j[campo]=Math.min(99, Math.round((j[campo]||50)+1));
            j.overall=Math.round((j.attack+j.defense+j.pace+j.passing+j.technique)/5);
            textos.push(tp('lm.dia_mejora_stat', {nombre:j.name, stat:t('lm.stat_'+campo)}));
            if(!mejorasPorJugador[j.id]) mejorasPorJugador[j.id]={nombre:j.name, stats:{}};
            mejorasPorJugador[j.id].stats[campo]=(mejorasPorJugador[j.id].stats[campo]||0)+1;
          }
          if(jugadorConExperienciaExtra && j.id===jugadorConExperienciaExtra){
            jugadorConExperienciaExtra=null;
            state.nodosBanderasPendientes.experienciaExtraJugadorId=null;
          }
        });
        // Entrenar 3+ días seguidos empieza a pasar factura — la
        // prevención del médico (muscular y ósea) reduce este riesgo,
        // igual que hace con las lesiones de partido. Cualquier jugador
        // puede resentirse (entrena toda la plantilla esa semana), pero
        // los del Plan de Entrenamiento llevan mucha más carga extra y
        // por eso tienen bastante más papeletas.
        const factorPrevencion=Math.pow(0.85, (nivelesMed.prevencionMuscular||0)+(nivelesMed.prevencionOsea||0));
        const riesgoSobrecarga=Math.max(0, seguidos-2)*0.05*factorPrevencion;
        if(riesgoSobrecarga>0 && Math.random()<riesgoSobrecarga){
          const idsEnPlan=new Set(plan.map(p=>p.jugador.id));
          const pool=[];
          state.plantilla.forEach(p=>{
            if(p.injured) return;
            const peso=idsEnPlan.has(p.id)?4:1;
            for(let i=0;i<peso;i++) pool.push(p);
          });
          if(pool.length){
            const jugador=pool[Math.floor(Math.random()*pool.length)];
            const familia=Math.random()<0.5?'muscular':'osea';
            const sev={label:'leve', weeks:1, dificultad:7};
            jugador.injured=true; jugador.injurySeverity=sev.label; jugador.injuryWeeks=sev.weeks; jugador.injuryFamilia=familia;
            jugador.lesionLogId=registrarLesionHistorial(jugador, sev, 'Sobrecarga por exceso de entrenamiento', 'el propio entrenamiento', familia);
            // Igual que con las lesiones de partido: el médico recomienda
            // tratarla cuanto antes (antes esto solo pasaba en las
            // lesiones ocurridas jugando, nunca en las de entrenamiento).
            if(!state.medicoNotificacion){
              state.medicoNotificacion={jugadorId:jugador.id, dificultad:sev.dificultad, severidad:sev.label};
            }
            textos.push(tp('lm.dia_sobrecarga_entreno', {nombre:jugador.name}));
            lesionesSemana.push({nombre:jugador.name, familia});
          }
        }
        if(!textos.length) textos.push(t('lm.dia_entreno_sin_incidencias'));
        // La fatiga baja para TODA la plantilla ese día (todos entrenan
        // de una forma u otra), pero los del Plan de Entrenamiento
        // llevan una carga de trabajo específica bastante más dura, así
        // que se cansan notablemente más que el resto.
        state.plantilla.forEach(p=>{
          const desgaste = idsEnPlanHoy.has(p.id) ? 3.6 : 2.2;
          p.fatigue=Math.max(0, Math.min(100, Math.round((p.fatigue===undefined?100:p.fatigue)-desgaste)));
        });
      } else {
        diasDescanso++;
        seguidos=0;
        textos.push(t('lm.dia_descanso_texto'));
        state.plantilla.forEach(p=>{ p.fatigue=Math.max(0, Math.min(100, Math.round((p.fatigue===undefined?100:p.fatigue)+4))); });
      }
      eventosDias.push({fecha:new Date(cur), iso, tipo:esEntreno?'entreno':'descanso', textos});
      cur.setDate(cur.getDate()+1);
    }
    eventosDias.resumenSemanal={
      diasEntreno, diasDescanso,
      mejoras:Object.values(mejorasPorJugador),
      lesiones:lesionesSemana,
      NOMBRE_STAT
    };
    if(typeof window.unlockLMAchievement==='function' && diasEntreno>0) window.unlockLMAchievement('lm_first_training', false);
    guardarEstado();
    return eventosDias;
  }

  // Procesa la semana de verdad (mejoras, fatiga, lesiones) y enseña
  // un resumen con quién ha mejorado y qué ha pasado — se llama tanto
  // al cerrar el árbol de nodos nada más completarlo, como desde el
  // botón SEGUIR (por si acaso llega a verse alguna vez sin árbol de
  // por medio). Tras el resumen, todo queda listo para pulsar JUGAR
  // directamente, sin pedir un segundo SEGUIR.
  function procesarSemanaYMostrarResumen(){
    const eventosDias=procesarEntrenamientoSemanal();
    state.semanaResueltaParaJornada=state.jornadaActual;
    guardarEstado();
    mostrarResumenSemanaPopup(eventosDias.resumenSemanal, ()=>{ render(); });
  }

  function mostrarResumenSemanaPopup(resumen, onCerrar){
    if(!resumen){ if(typeof onCerrar==='function') onCerrar(); return; }
    const overlay=document.createElement('div');
    overlay.id='lmResumenSemanaOverlay';
    overlay.className='lm-visor-leyenda-overlay-standalone lm-resumen-semana-overlay';
    document.body.appendChild(overlay);

    const mejoras=resumen.mejoras||[];
    const lesiones=resumen.lesiones||[];
    const NOMBRE_STAT=resumen.NOMBRE_STAT||{};

    const filasMejoras = mejoras.length ? mejoras.map(m=>{
      const stats=Object.keys(m.stats||{}).map(campo=>`<span class="lm-resumen-stat-chip">+${m.stats[campo]} ${NOMBRE_STAT[campo]||campo}</span>`).join('');
      return `<div class="lm-resumen-fila lm-resumen-fila-buena">
        <i class="ph ph-bold ph-trend-up"></i>
        <div class="lm-resumen-fila-texto"><strong>${m.nombre}</strong><div class="lm-resumen-stats-chips">${stats}</div></div>
      </div>`;
    }).join('') : `<div class="lm-resumen-vacio">${t('lm.resumen_sin_mejoras')}</div>`;

    const filasLesiones = lesiones.length ? lesiones.map(l=>`
      <div class="lm-resumen-fila lm-resumen-fila-mala">
        <i class="ph ph-bold ph-bandaids"></i>
        <div class="lm-resumen-fila-texto"><strong>${l.nombre}</strong><span>${l.familia==='muscular'?t('lm.sobrecarga_muscular'):t('lm.sobrecarga_osea')}</span></div>
      </div>`).join('') : '';

    overlay.innerHTML=`
      <div class="lm-resumen-semana-card">
        <div class="lm-resumen-semana-titulo"><i class="ph ph-bold ph-chart-line-up"></i> ${t('lm.resumen_semana_titulo')}</div>
        <div class="lm-resumen-semana-sub">${tp('lm.resumen_semana_sub',{entreno:resumen.diasEntreno, descanso:resumen.diasDescanso})}</div>
        <div class="lm-resumen-bloque-titulo">${t('lm.resumen_mejoras_titulo')}</div>
        <div class="lm-resumen-lista">${filasMejoras}</div>
        ${lesiones.length?`<div class="lm-resumen-bloque-titulo lm-resumen-bloque-titulo-mala">${t('lm.resumen_lesiones_titulo')}</div><div class="lm-resumen-lista">${filasLesiones}</div>`:''}
        <button class="mode-card-btn mode-card-btn-gold" data-cerrar-resumen>${t('lm.resumen_listo_btn')}</button>
      </div>`;
    overlay.querySelector('[data-cerrar-resumen]').addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      overlay.remove();
      if(typeof onCerrar==='function') onCerrar();
    });
    if(typeof window.playSound==='function') window.playSound(lesiones.length?'reveal':'victory');
  }

  // Días de un mes concreto para pintar la rejilla del calendario —
  // semana empezando en lunes, huecos en blanco antes del día 1. Se
  // apoya solo en Date nativo, así que sigue siendo correcto pintando
  // cualquier año futuro sin tocar nada.
  function generarDiasMes(year, month){
    const primerDia=new Date(year, month, 1);
    const ultimoDia=new Date(year, month+1, 0);
    let offset=primerDia.getDay()-1; if(offset<0) offset=6;
    const dias=[];
    for(let i=0;i<offset;i++) dias.push(null);
    for(let d=1; d<=ultimoDia.getDate(); d++) dias.push(new Date(year, month, d));
    return dias;
  }
  // ¿Juega mi equipo ese día? Recorre las 38 jornadas (barato, nada que
  // optimizar) y devuelve el rival si coincide la fecha.
  function partidoMioEnFecha(isoStr){
    for(let n=1;n<=38;n++){
      const f=fechaJornadaLM(n);
      if(!f || fechaISO(f)!==isoStr) continue;
      const jornada=state.calendario[n-1];
      if(!jornada) return null;
      const miPartido=jornada.find(p=>p.home.id==='lm_0'||p.away.id==='lm_0');
      if(!miPartido) return null;
      const esLocal=miPartido.home.id==='lm_0';
      return {jornada:n, rival: esLocal?miPartido.away:miPartido.home, esLocal};
    }
    return null;
  }
  let calendarioMesVisto=null; // {year,month} — se fija la primera vez que se pinta, en el mes del próximo partido
  let calendarioJornadaSincronizada=null; // controla cuándo hay que saltar de mes automáticamente
  function calendarioHTML(){
    if(!state.fechaInicioLiga) return '';
    // El calendario avanza solo: cada vez que cambia la jornada actual
    // (se ha jugado un partido), si el próximo cae en otro mes, salta a
    // ese mes automáticamente. Mientras la jornada no cambie, el usuario
    // puede navegar libremente con las flechas sin que se le reinicie.
    if(!calendarioMesVisto || calendarioJornadaSincronizada!==state.jornadaActual){
      // Usamos el primer día realmente editable de la ventana (el día
      // siguiente al partido anterior) como referencia, no la fecha del
      // propio partido — así el calendario muestra siempre el mes donde
      // de verdad se pueden marcar entrenamientos, aunque el partido
      // caiga ya en el mes siguiente.
      const ventana=ventanaEntrenoActual();
      let base;
      if(ventana){ base=new Date(ventana.desde); base.setDate(base.getDate()+1); }
      else { base=fechaJornadaLM(Math.min(state.jornadaActual,(state.calendario||[]).length||38)) || new Date(state.fechaInicioLiga+'T00:00:00'); }
      calendarioMesVisto={year:base.getFullYear(), month:base.getMonth()};
      calendarioJornadaSincronizada=state.jornadaActual;
    }
    const {year, month}=calendarioMesVisto;
    const dias=generarDiasMes(year, month);
    const celdas=dias.map(d=>{
      if(!d) return `<div class="lm-cal-celda lm-cal-vacia"></div>`;
      const iso=fechaISO(d);
      const partido=partidoMioEnFecha(iso);
      // El calendario ya NO se puede marcar directamente — el árbol de
      // nodos es quien decide entreno/descanso de cada día ahora. Se
      // deja de pasar "editable" para que el calendario sea de solo
      // lectura (un resumen visual de lo ya elegido en el árbol).
      const editable=false;
      const entrenado=!!(state.calendarioEntrenamiento && state.calendarioEntrenamiento[iso]);
      const nodoElegidoDia=state.calendarioNodoElegido && state.calendarioNodoElegido[iso];
      let contenido='';
      if(partido){
        contenido=`<div class="lm-cal-partido" title="${t('lm.cal_jornada_vs')} ${partido.jornada} — ${partido.esLocal?t('lm.cal_vs'):t('lm.cal_fuera_vs')} ${partido.rival.name}">${rivalCrestHTML(40, partido.rival.crestImg)}</div>`;
      } else if(nodoElegidoDia){
        // Se pinta el icono real del nodo que se eligió ese día en el
        // árbol (mismo icono y color que ahí), no siempre la
        // mancuerna genérica de "entreno".
        const {icon,color}=iconoYColorNodo(nodoElegidoDia);
        contenido=`<i class="ph ph-bold ${icon} lm-cal-entreno-icon" style="color:${color}" title="${t('lm.nodo_'+nodoElegidoDia.tipo)}"></i>`;
      } else if(entrenado){
        contenido=`<i class="ph ph-bold ph-barbell lm-cal-entreno-icon"></i>`;
      }
      const clases=['lm-cal-celda'];
      if(partido) clases.push('lm-cal-dia-partido');
      // El día del propio partido nunca debe verse "desactivado" — no
      // es que esté bloqueado, es la jornada contra el rival que
      // toca, así que se deja con su aspecto normal aunque el resto
      // del calendario ya no sea editable. Lo mismo para el resto de
      // días de la semana activa actual (entre el último partido y el
      // próximo) — es la semana en la que el jugador está tomando
      // decisiones de verdad en el árbol, así que tampoco debe verse
      // apagada como el resto de semanas futuras/pasadas.
      const ventanaActual=ventanaEntrenoActual();
      const fechaCelda=new Date(iso+'T00:00:00');
      const enSemanaActiva = ventanaActual && fechaCelda.getTime()>ventanaActual.desde.getTime() && fechaCelda.getTime()<ventanaActual.hasta.getTime();
      if(!editable && !partido && !enSemanaActiva) clases.push('lm-cal-bloqueado');
      if(enSemanaActiva && !partido) clases.push('lm-cal-semana-activa');
      return `<div class="${clases.join(' ')}" ${editable?`data-cal-dia="${iso}"`:''} title="${editable?t('lm.cal_tocar_entrenamiento'):''}">
        <span class="lm-cal-num">${d.getDate()}</span>
        ${contenido}
      </div>`;
    }).join('');
    return `<div class="lm-calendario-box">
      <div class="bench-title" id="lmCalendarioHeaderBtn" style="margin:0 0 10px;cursor:pointer" title="${t('lm.arbol_elige_camino')}"><span><i class="ph ph-bold ph-calendar-blank" style="color:var(--gold);margin-right:6px"></i>${t("lm.calendario")} <i class="ph ph-bold ph-tree-structure" style="font-size:12px;color:#777;margin-left:4px"></i></span></div>
      <div class="lm-cal-header">
        <button class="lm-cal-nav" data-cal-nav="-1" title="${t('lm.tt_mes_anterior')}"><i class="ph ph-bold ph-caret-left"></i></button>
        <span class="lm-cal-titulo">${MESES_LARGO[month].toUpperCase()} ${year}</span>
        <button class="lm-cal-nav" data-cal-nav="1" title="${t('lm.tt_mes_siguiente')}"><i class="ph ph-bold ph-caret-right"></i></button>
      </div>
      <div class="lm-cal-semana-dias"><span>L</span><span>M</span><span>X</span><span>J</span><span>V</span><span>S</span><span>D</span></div>
      <div class="lm-cal-grid">${celdas}</div>
      <p class="lm-setup-desc" style="text-align:center;margin-top:4px">${t('lm.cal_descripcion')}</p>
      ${renderBarrasEstadoHTML()}
      ${renderAcumuladosNodosHTML()}
    </div>`;
  }

  // ---------- Las 4 barras de estado, en la propia pantalla del
  // calendario — ayudan a decidir con criterio antes de elegir nodo. ----------
  function renderBarrasEstadoHTML(){
    const b=calcularBarrasEstado();
    const filas=[
      {key:'formaFisica', icon:'ph-heartbeat', label:t('lm.barra_forma_fisica')},
      {key:'riesgoLesion', icon:'ph-bandaids', label:t('lm.barra_riesgo_lesion')},
      {key:'moral', icon:'ph-hand-fist', label:t('lm.barra_moral')},
      {key:'aficion', icon:'ph-megaphone', label:t('lm.barra_aficion')},
    ];
    return `<div class="lm-barras-estado">
      <div class="lm-barras-estado-titulo">${t('lm.barras_estado_titulo')}</div>
      ${filas.map(f=>{
        const d=b[f.key];
        return `<div class="lm-barra-fila">
          <i class="ph ph-bold ${f.icon}" style="color:${d.color}"></i>
          <span class="lm-barra-label">${f.label}</span>
          <div class="lm-barra-track"><div class="lm-barra-fill" style="width:${d.pct}%;background:${d.color}"></div></div>
        </div>`;
      }).join('')}
    </div>`;
  }

  // ---------- Contadores de icono acumulados + botón de canje cuando
  // se alcanza un hito. Sustituye a la antigua leyenda del calendario. ----------
  // Describe con texto claro qué da de verdad un hito concreto —
  // usado tanto al pulsar la tarjeta (mensaje informativo) como en el
  // pop-up de "recompensa aplicada" tras canjearlo.
  function descripcionHitoNodo(tipoIcono, umbral){
    const def=HITOS_NODOS[tipoIcono];
    const hito=def && def.hitos.find(h=>h.umbral===umbral);
    if(!hito) return '';
    if(hito.tipo==='eleccion'){
      return tp('lm.hito_desc_eleccion_entreno', {op1:t('lm.hito_opcion_'+hito.opciones[0]), op2:t('lm.hito_opcion_'+hito.opciones[1])});
    }
    if(hito.tipo==='bandera'){
      return t('lm.hito_desc_'+hito.bandera);
    }
    return t('lm.hito_desc_'+hito.tipo);
  }

  // Al pulsar una tarjeta de progreso, se enseña debajo del bloque de
  // acumulados qué da exactamente ese hito — se llama tanto desde
  // dentro del árbol como desde el calendario principal, así que
  // recibe el contenedor (root) donde buscar la zona del mensaje.
  function mostrarMensajeRecompensaHito(tipoIcono, umbral, root){
    const zona=root.querySelector('#lmNodosMensajeRecompensa');
    if(!zona) return;
    const def=HITOS_NODOS[tipoIcono];
    if(!def) return;
    const desc=descripcionHitoNodo(tipoIcono, umbral);
    // Se muestra "Nivel 1"/"Nivel 2" en vez del umbral en bruto (5/10)
    // — el número de puntos ya se ve en la propia tarjeta de progreso,
    // aquí lo que importa es de qué nivel de recompensa se trata.
    const nivelHito=def.hitos.findIndex(h=>h.umbral===umbral)+1;
    zona.innerHTML=`<i class="ph ph-bold ${def.icon}" style="color:${def.color}"></i> <strong>${t('lm.nodo_'+tipoIcono)} · ${t('lm.nivel_n_de_x')} ${nivelHito}</strong><span>${desc}</span>`;
    zona.classList.add('lm-nodos-mensaje-visible');
  }

  function renderAcumuladosNodosHTML(){
    // La quiniela sigue existiendo en HITOS_NODOS (icono, color, y
    // para que pueda salir sorteada como nodo), pero no tiene ningún
    // hito de recompensa — se excluye explícitamente de esta rejilla
    // para no mostrarla como si estuviera "completada" (que es lo que
    // pasaría al no tener ningún hito pendiente que mostrar).
    const tipos=Object.keys(HITOS_NODOS).filter(t=>t!=='quiniela');
    return `<div class="lm-nodos-acumulados">
      <div class="lm-nodos-acumulados-cab">
        <span>${t('lm.nodos_acumulados_titulo')}</span>
        <button class="lm-nodos-leyenda-btn" data-nodos-leyenda title="${t('lm.tt_leyenda_iconos_nodos')}"><i class="ph ph-bold ph-question"></i></button>
      </div>
      <div class="lm-nodos-grid">
        ${tipos.map(tipo=>{
          const p=progresoNodo(tipo);
          if(!p) return '';
          const nombreIcono=t('lm.nodo_'+tipo);
          if(!p.siguiente){
            // Los 3 hitos ya canjeados — icono en dorado permanente, sin barra de progreso.
            return `<div class="lm-nodo-acumulado lm-nodo-acumulado-completo" title="${nombreIcono}">
              <i class="ph ph-bold ${p.def.icon}" style="color:${p.def.color}"></i>
              <span class="lm-nodo-acumulado-num">${p.acumulado}</span>
              <i class="ph ph-bold ph-check-circle lm-nodo-acumulado-check"></i>
            </div>`;
          }
          const pct=Math.min(100, Math.round((p.acumulado/p.siguiente.umbral)*100));
          // El número mostrado usa como denominador el umbral FINAL
          // de este icono (el del último nivel, ahora 10 en vez de
          // 5), no el del hito más próximo — así al llegar a 5/10 el
          // jugador entiende que hay un nivel más por delante, en vez
          // de ver "5/5" y pensar que ya está completo del todo. La
          // barra de progreso (el relleno) sigue llenándose respecto
          // al hito más próximo, para que se vea "llena" justo cuando
          // ya se puede reclamar ese nivel concreto.
          const umbralFinal=p.def.hitos[p.def.hitos.length-1].umbral;
          const numMostrado=Math.min(p.acumulado, umbralFinal);
          return `<div class="lm-nodo-acumulado ${p.disponible?'lm-nodo-acumulado-disponible':''}" title="${nombreIcono}" data-ver-recompensa="${tipo}" data-ver-recompensa-umbral="${p.siguiente.umbral}">
            <i class="ph ph-bold ${p.def.icon}" style="color:${p.def.color}"></i>
            <span class="lm-nodo-acumulado-num">${numMostrado}/${umbralFinal}</span>
            <div class="lm-nodo-acumulado-track"><div class="lm-nodo-acumulado-fill" style="width:${pct}%;background:${p.def.color}"></div></div>
            ${p.disponible?`<button class="lm-nodo-reclamar-btn" data-reclamar-nodo="${tipo}" data-reclamar-umbral="${p.siguiente.umbral}">${t('lm.reclamar_btn')}</button>`:''}
          </div>`;
        }).join('')}
      </div>
      <div class="lm-nodos-mensaje-recompensa" id="lmNodosMensajeRecompensa"></div>
    </div>`;
  }


  /* ═══════════════════════════════════════════════════════════════
     ÁRBOL DE NODOS — pantalla real de la semana roguelike.
     ═══════════════════════════════════════════════════════════════ */

  // Rival real de la próxima jornada — mismo patrón que ya usa el
  // resto del juego para encontrar "mi" partido dentro del calendario.
  function obtenerRivalProximaJornada(){
    const j=state.jornadaActual-1;
    if(j<0 || j>=38 || !state.calendario) return null;
    const jornada=state.calendario[j];
    if(!jornada) return null;
    const miPartido=jornada.find(p=>p.home.id==='lm_0'||p.away.id==='lm_0');
    if(!miPartido) return null;
    return miPartido.home.id==='lm_0' ? miPartido.away : miPartido.home;
  }

  const NODO_ICONO_X=520, NODO_ICONO_Y_ALTO=260;

  // Convierte state.semanaNodos en coordenadas de dibujo — X por día,
  // Y por cada opción dentro de ese día (centradas verticalmente según
  // cuántas opciones tenga: 1, 2 o 3).
  function construirCoordenadasArbol(){
    const dias=(state.semanaNodos&&state.semanaNodos.dias)||[];
    const n=dias.length;
    if(!n) return {puntos:[], conexiones:[]};
    // Un poco de margen extra a los lados para que el día actual se
    // pueda centrar de verdad al abrir el árbol, incluso cuando es el
    // primer o último día de la semana (antes se quedaba pegado al
    // borde porque no había margen suficiente para desplazar hasta
    // el centro).
    // Se reparten los N días + el rival como N+1 puntos EQUIESPACIADOS
    // dentro del mismo margen simétrico a ambos lados — antes el
    // rival usaba una fórmula fija aparte que no tenía en cuenta el
    // margen de los días, así que al ajustar ese margen (para poder
    // centrar el día 1) el lado derecho se quedaba mucho más estrecho
    // que el izquierdo, dando la sensación de árbol descuadrado hacia
    // la derecha.
    const totalPuntos=n+1, margen=55;
    const anchoUtil=NODO_ICONO_X-margen*2;
    const paso=totalPuntos>0 ? anchoUtil/totalPuntos : 0;
    const centroY=NODO_ICONO_Y_ALTO/2;
    // Carriles fijos (arriba / medio / abajo) para los días de 3
    // opciones, así se alinean entre sí en forma de rejilla — pero
    // cuando solo hay 2 opciones no hace falta separarlas tanto (no
    // hay carril medio que las obligue a abrirse), así que van más
    // juntas entre sí para leerse mejor de un vistazo.
    const carrilArriba=centroY-80, carrilAbajo=centroY+80;
    const patronesY={1:[centroY], 2:[centroY-40,centroY+40], 3:[carrilArriba,centroY,carrilAbajo]};

    const puntos=dias.map((dia,i)=>{
      const x=margen+paso*i+paso/2;
      const ys=patronesY[dia.nodos.length]||patronesY[1];
      return {x, dia, nodos:dia.nodos.map((nodo,ni)=>({...nodo, y:ys[ni]}))};
    });
    // Punto final: escudo del rival de la próxima jornada — usa
    // exactamente el mismo paso que los días, en la posición N (justo
    // después del último día), para que quede tan simétrico como
    // ellos respecto al margen.
    puntos.push({x:margen+paso*n+paso/2, rival:true, nodos:[{y:centroY, tipo:'rival'}]});

    // Solo se dibujan las conexiones que de verdad existen (guardadas
    // al generar la semana, no todo-con-todo) — así hay caminos
    // exclusivos de verdad, no un abanico completo desde cada nodo.
    const conexiones=[];
    for(let i=0;i<puntos.length-1;i++){
      const actual=puntos[i], siguiente=puntos[i+1];
      const diaActual=actual.dia;
      const esTramoHaciaRival = !!siguiente.rival;
      if(diaActual && diaActual.elegido!=null){
        // Día ya resuelto: se dibuja la conexión real del nodo
        // elegido en dorado, PERO también las del resto de nodos de
        // ese mismo día en gris — antes esas otras simplemente
        // desaparecían al resolver el día, cuando lo correcto es que
        // se queden visibles en su gris inicial, igual que un día
        // aún sin resolver.
        const oi=diaActual.elegido;
        diaActual.nodos.forEach((nodo,ni)=>{
          const destinos = esTramoHaciaRival ? siguiente.nodos.map((_,idx)=>idx) : (nodo.siguientes||siguiente.nodos.map((_,idx)=>idx));
          destinos.forEach(di=>{
            conexiones.push({a:{x:actual.x,y:actual.nodos[ni].y}, b:{x:siguiente.x,y:siguiente.nodos[di].y}, activa:ni===oi});
          });
        });
      } else {
        // Día sin resolver: se dibuja el mapa completo de posibilidades
        // (en gris) usando la conectividad exclusiva ya guardada.
        actual.nodos.forEach((nodo,oi)=>{
          const destinos = esTramoHaciaRival ? siguiente.nodos.map((_,idx)=>idx) : (nodo.siguientes||siguiente.nodos.map((_,idx)=>idx));
          destinos.forEach(di=>{
            conexiones.push({a:{x:actual.x,y:actual.nodos[oi].y}, b:{x:siguiente.x,y:siguiente.nodos[di].y}, activa:false});
          });
        });
      }
    }
    return {puntos, conexiones};
  }

  // Icono, color y (si aplica) distintivo de dificultad — el color
  // SIEMPRE es el mismo que en la leyenda de iconos para ese tipo, en
  // cualquier estado del nodo (bloqueado, disponible o ya elegido),
  // para que comparar con la leyenda sea siempre coherente.
  function iconoYColorNodo(nodo){
    if(nodo.tipo==='rival') return {icon:'ph-shield', color:'#6a86c2'};
    const def=HITOS_NODOS[nodo.tipo];
    const base={icon:(def&&def.icon)||'ph-question', color:(def&&def.color)||'#888'};
    if(nodo.tipo==='entreno' && nodo.subtipo==='intenso') base.icon='ph-fire';
    if(nodo.tipo==='amistoso'){
      // Insignia de dificultad — mismo icono (balón) para las 3, pero
      // un punto de color distinto en la esquina para distinguirlas de
      // un vistazo sin tener que leer el panel de "HOY".
      base.badgeColor = nodo.subtipo==='facil' ? '#4caf7a' : (nodo.subtipo==='dificil' ? '#e24b4a' : '#e6c94a');
    }
    return base;
  }

  function renderArbolNodosSVGyPuntos(){
    const {puntos, conexiones}=construirCoordenadasArbol();
    const diaActualIdx=diaActualIndiceSemanaNodos();
    const alcanzablesHoy=nodosAlcanzablesHoy();
    const rival=obtenerRivalProximaJornada();
    let svgHTML='';
    conexiones.forEach(c=>{
      const midX=(c.a.x+c.b.x)/2;
      svgHTML+=`<path d="M${c.a.x} ${c.a.y} C ${midX} ${c.a.y}, ${midX} ${c.b.y}, ${c.b.x} ${c.b.y}" fill="none" stroke="${c.activa?'#c9a227':'#2a2f32'}" stroke-width="${c.activa?3:2}"/>`;
    });
    let nodosHTML='';
    puntos.forEach((punto,pIdx)=>{
      const esRival=!!punto.rival;
      if(esRival){
        const yPct=punto.nodos[0].y/NODO_ICONO_Y_ALTO*100;
        nodosHTML+=`<div class="lm-arbol-nodo lm-arbol-nodo-rival" style="left:${punto.x/NODO_ICONO_X*100}%;top:${yPct}%">${rivalCrestHTML(40, rival&&rival.crestImg)}</div>`;
        const etiquetaRival = rival ? rival.name : '';
        // El nombre se ata directamente a la posición Y del propio
        // escudo (un poco por debajo), en vez de usar un porcentaje
        // "bottom" independiente que podía desacoplarse del nodo.
        nodosHTML+=`<div class="lm-arbol-dia-num lm-arbol-rival-nombre" style="left:${punto.x/NODO_ICONO_X*100}%;top:calc(${yPct}% + 34px)">${etiquetaRival}</div>`;
        return;
      }
      punto.nodos.forEach((nodo,nIdx)=>{
        const {icon,color,badgeColor}=iconoYColorNodo(nodo);
        const esHoyEsteDia = pIdx===diaActualIdx;
        const esAlcanzable = esHoyEsteDia && alcanzablesHoy.includes(nIdx);
        let clase='lm-arbol-nodo';
        if(punto.dia.elegido===nIdx) clase+=' lm-arbol-nodo-completado';
        else if(punto.dia.elegido==null && esAlcanzable) clase+=' lm-arbol-nodo-disponible';
        else clase+=' lm-arbol-nodo-bloqueado';
        const clickable = (punto.dia.elegido==null && esAlcanzable);
        nodosHTML+=`<div class="${clase}" style="left:${punto.x/NODO_ICONO_X*100}%;top:${nodo.y/NODO_ICONO_Y_ALTO*100}%;${color?`--nc:${color}`:''}" ${clickable?`data-elegir-dia="${pIdx}" data-elegir-nodo="${nIdx}"`:''}>
          <i class="ph ph-bold ${icon}"></i>
          ${badgeColor?`<span class="lm-arbol-nodo-badge" style="background:${badgeColor}"></span>`:''}
        </div>`;
      });
      const esHoy = pIdx===diaActualIdx;
      const etiqueta = diaSemanaCortoI18n(new Date(punto.dia.fecha+'T00:00:00'));
      nodosHTML+=`<div class="lm-arbol-dia-num ${esHoy?'lm-arbol-dia-hoy':''}" style="left:${punto.x/NODO_ICONO_X*100}%">${etiqueta}</div>`;
    });
    return {svgHTML, nodosHTML};
  }

  function nombreYDescNodo(nodo){
    if(nodo.tipo==='entreno'){
      const sub=nodo.subtipo==='intenso'?'intenso':'estandar';
      return {nombre:t(nodo.subtipo==='intenso'?'lm.entreno_intenso':'lm.entreno_estandar'), desc:t('lm.nodo_desc_entreno'), gana:t('lm.gana_entreno_'+sub), cuesta:t('lm.cuesta_entreno_'+sub)};
    }
    if(nodo.tipo==='amistoso'){
      const sub=nodo.subtipo==='facil'?'facil':(nodo.subtipo==='dificil'?'dificil':'normal');
      const claveNombre=nodo.subtipo==='facil'?'lm.amistoso_facil':(nodo.subtipo==='dificil'?'lm.amistoso_dificil':'lm.amistoso_normal');
      return {nombre:t(claveNombre), desc:t('lm.nodo_desc_amistoso'), gana:t('lm.gana_amistoso_'+sub), cuesta:t('lm.cuesta_amistoso_'+sub)};
    }
    return {nombre:t('lm.nodo_'+nodo.tipo), desc:t('lm.nodo_desc_'+nodo.tipo), gana:t('lm.gana_'+nodo.tipo), cuesta:t('lm.cuesta_'+nodo.tipo)};
  }

  function renderHoyPanelHTML(){
    const diaActualIdx=diaActualIndiceSemanaNodos();
    const dia=state.semanaNodos && state.semanaNodos.dias[diaActualIdx];
    if(!dia){
      // Ya no queda ningún día por elegir — en vez de dejar esta zona
      // vacía (sin ninguna pista de qué hacer a continuación), se
      // avisa claramente de que la semana está completa y se invita a
      // cerrar para pasar a gestionar la plantilla antes del partido.
      if(state.semanaNodos && state.semanaNodos.dias.every(d=>d.elegido!=null)){
        return `<div class="lm-arbol-hoy-panel lm-arbol-hoy-panel-completa">
          <div class="lm-arbol-hoy-titulo"><i class="ph ph-bold ph-check-circle"></i> ${t('lm.arbol_semana_completa')}</div>
          <p class="lm-setup-desc" style="margin:0 0 10px">${t('lm.arbol_semana_completa_desc')}</p>
          <button class="mode-card-btn mode-card-btn-gold" data-cerrar-arbol>${t('lm.arbol_continuar_btn')}</button>
        </div>`;
      }
      return '';
    }
    return `<div class="lm-arbol-hoy-panel">
      <div class="lm-arbol-hoy-titulo"><i class="ph ph-bold ph-map-pin"></i> ${t('lm.arbol_elige_camino')}</div>
      ${nodosAlcanzablesHoy().map(ni=>{
        const nodo=dia.nodos[ni];
        const {icon,color}=iconoYColorNodo(nodo);
        const {nombre,gana,cuesta}=nombreYDescNodo(nodo);
        return `<div class="lm-arbol-hoy-opcion" data-elegir-dia="${diaActualIdx}" data-elegir-nodo="${ni}">
          <div class="lm-arbol-hoy-opcion-icono" style="border-color:${color};color:${color}"><i class="ph ph-bold ${icon}"></i></div>
          <div class="lm-arbol-hoy-opcion-texto">
            <strong>${nombre}</strong>
            <span class="lm-arbol-hoy-gana"><i class="ph ph-bold ph-plus-circle"></i> ${t('lm.hoy_gana_label')}: ${gana}</span>
            <span class="lm-arbol-hoy-arriesga"><i class="ph ph-bold ph-warning"></i> ${t('lm.hoy_arriesga_label')}: ${cuesta}</span>
          </div>
        </div>`;
      }).join('')}
    </div>`;
  }

  function renderArbolNodosOverlayHTML(){
    const {svgHTML, nodosHTML}=renderArbolNodosSVGyPuntos();
    return `<div class="lm-arbol-pantalla">
      <div class="lm-dilemma-title" style="justify-content:center"><i class="ph ph-bold ph-tree-structure"></i> ${t('lm.calendario')||'SEMANA'}</div>
      ${renderBarrasEstadoHTML()}
      <div class="lm-arbol-wrap" id="lmArbolWrap">
        <div class="lm-arbol-svg-capa">
          <svg viewBox="0 0 ${NODO_ICONO_X} ${NODO_ICONO_Y_ALTO}">${svgHTML}</svg>
          <div class="lm-arbol-nodos-capa">${nodosHTML}</div>
        </div>
      </div>
      ${renderHoyPanelHTML()}
      <div class="lm-arbol-leyenda-fila">
        <button class="lm-nodos-leyenda-btn-texto" data-nodos-leyenda><i class="ph ph-bold ph-question"></i> ${t('lm.arbol_ver_leyenda')}</button>
      </div>
    </div>`;
  }

  function pintarArbolNodos(instantaneo){
    const overlay=document.getElementById('lmArbolNodosOverlay');
    if(!overlay) return;
    // El repintado reconstruye TODO el contenido del overlay
    // (innerHTML), lo que crea un #lmArbolWrap totalmente nuevo con
    // scrollLeft=0 aunque el jugador ya estuviera viendo el árbol
    // desplazado a la derecha. Sin guardar y restaurar esa posición
    // aquí, la comprobación de "el escudo rival ya se ve entero" de
    // más abajo se evaluaba siempre contra un scroll en 0 (falso), así
    // que volvía a lanzar el desplazamiento suave en cada repintado —
    // el salto que se veía aunque el nodo final ya estuviera visible.
    const wrapPrevio=overlay.querySelector('#lmArbolWrap');
    const scrollLeftPrevio=wrapPrevio ? wrapPrevio.scrollLeft : 0;
    overlay.innerHTML=renderArbolNodosOverlayHTML();
    cablearEventosArbolNodos(overlay);
    // En escritorio el lienzo se ajusta al ancho real disponible para
    // que quepa entero sin scroll — en móvil se deja el tamaño fijo
    // de siempre (más grande, con scroll horizontal suave hacia el
    // día actual), que es como prefieres verlo ahí.
    const capa=overlay.querySelector('.lm-arbol-svg-capa');
    const esEscritorio = window.matchMedia && window.matchMedia('(min-width: 700px)').matches;
    if(capa && esEscritorio){
      const numColumnas=((state.semanaNodos&&state.semanaNodos.dias.length)||6)+1; // +1 por el rival
      // El ancho ideal (105px por columna) nunca debe superar lo que
      // la ventana puede mostrar de verdad — si no cupiera así, se
      // reduce el espacio por columna hasta que quepa entero, en vez
      // de dejar que se salga y siga haciendo falta scroll.
      const margenDisponible=Math.max(560, window.innerWidth-60);
      const anchoIdeal=Math.max(560, numColumnas*105);
      const anchoDeseado=Math.min(anchoIdeal, margenDisponible);
      capa.style.width=anchoDeseado+'px';
      capa.style.height=Math.round(anchoDeseado/2)+'px';
      // La tarjeta entera también se ajusta al mismo ancho (más el
      // relleno de los contenedores que la envuelven) — si no, se
      // quedaba estirada a su ancho máximo aunque el árbol necesitara
      // mucho menos, dejando un hueco vacío enorme a los lados.
      const pantalla=overlay.querySelector('.lm-arbol-pantalla');
      if(pantalla) pantalla.style.width=Math.min(anchoDeseado+32, window.innerWidth-24)+'px';
    }
    // Auto-centrar el scroll horizontal en el dia de hoy, para que en
    // movil el jugador no tenga que buscarlo manualmente al entrar.
    const wrap=overlay.querySelector('#lmArbolWrap');
    if(wrap) wrap.scrollLeft=scrollLeftPrevio;
    const diaActualIdx=diaActualIndiceSemanaNodos();
    if(wrap && diaActualIdx>=0){
      const {puntos}=construirCoordenadasArbol();
      const punto=puntos[diaActualIdx];
      if(punto){
        requestAnimationFrame(()=>{
          const capaEl=wrap.querySelector('.lm-arbol-svg-capa');
          const escala=capaEl.offsetWidth/NODO_ICONO_X;
          // Si el último punto del árbol (el escudo del rival) ya
          // está COMPLETAMENTE visible dentro del hueco actual, no
          // hace falta desplazar nada más — quedarse quieto es
          // siempre mejor que un micro-ajuste que apenas se nota pero
          // sí se siente como un salto molesto. Esto es justo lo que
          // pedías: una vez se ve entero el nodo final, se acabó el
          // scroll, para siempre, en esa apertura del árbol.
          const puntoRival=puntos[puntos.length-1];
          const radioRival=30; // mitad del ancho del círculo del rival + margen
          const xRivalIzq=puntoRival.x*escala-radioRival;
          const xRivalDer=puntoRival.x*escala+radioRival;
          const rivalYaVisibleEntero = xRivalIzq>=wrap.scrollLeft && xRivalDer<=wrap.scrollLeft+wrap.clientWidth;
          if(rivalYaVisibleEntero) return;
          // El destino nunca debe superar el máximo real de scroll —
          // si no, al llegar cerca del final (el escudo del rival),
          // el destino calculado pedía desplazarse más de lo que el
          // navegador puede recorrer de verdad, así que quedaba
          // recortado por el propio navegador. La comprobación de
          // "ya está en su sitio" comparaba entonces contra ese valor
          // sin recortar, veía una diferencia grande que en realidad
          // no existía, y volvía a intentar desplazarse una y otra
          // vez — de ahí los saltos aunque ya se viera todo entero.
          const maximoScroll=Math.max(0, wrap.scrollWidth-wrap.clientWidth);
          const destino=Math.min(maximoScroll, Math.max(0, punto.x*escala - wrap.clientWidth/2));
          // Al abrir el árbol por primera vez, el centrado en el día
          // actual es instantáneo (no tiene sentido animar un
          // deslizamiento justo al entrar en la pantalla) — pero al
          // avanzar de día tras elegir un nodo, sí se desliza suave,
          // para que se note el paso de un día al siguiente.
          if(instantaneo) wrap.scrollLeft=destino;
          // Si ya está prácticamente en la posición de destino, no se
          // repite la animación — evita el efecto de "salto" al
          // volver a pintar el árbol cuando en realidad no hace falta
          // moverse nada (mismo día ya centrado).
          else if(Math.abs(wrap.scrollLeft-destino)>4){
            if(typeof wrap.scrollTo==='function') wrap.scrollTo({left:destino, behavior:'smooth'});
            else wrap.scrollLeft=destino;
          }
        });
      }
    }
  }

  function crearRippleArbol(el, evento){
    const rect=el.getBoundingClientRect();
    const tam=Math.max(rect.width, rect.height)*1.4;
    const x=(evento&&evento.clientX!=null ? evento.clientX : rect.left+rect.width/2)-rect.left-tam/2;
    const y=(evento&&evento.clientY!=null ? evento.clientY : rect.top+rect.height/2)-rect.top-tam/2;
    const span=document.createElement('span');
    span.className='lm-arbol-ripple';
    span.style.width=span.style.height=tam+'px';
    span.style.left=x+'px'; span.style.top=y+'px';
    el.appendChild(span);
  }

  // ---------- Pop-up de resultado del amistoso ----------
  // Se ve justo tras elegir el nodo, con la dificultad bien visible
  // (mismo color que la insignia del propio nodo), el marcador, y lo
  // que ha costado/ganado de verdad — moral y, si ha tocado, lesión.
  // Baraja "mio"/"rival" tantas veces como goles tenga cada uno, para
  // simular el orden en que caerían los goles del amistoso — es solo
  // de cara al pop-up, no afecta al resultado ya decidido de antemano.
  function generarSecuenciaGolesAmistoso(misGoles, susGoles){
    const eventos=[];
    for(let i=0;i<misGoles;i++) eventos.push('mio');
    for(let i=0;i<susGoles;i++) eventos.push('rival');
    return barajarArrayNodos(eventos);
  }

  function mostrarResultadoAmistosoPopup(resultado, onCerrar){
    const existente=document.getElementById('lmAmistosoResultadoOverlay');
    if(existente) existente.remove();
    const overlay=document.createElement('div');
    overlay.id='lmAmistosoResultadoOverlay';
    overlay.className='lm-visor-leyenda-overlay-standalone lm-amistoso-resultado-overlay';
    document.body.appendChild(overlay);

    const colorDificultad = resultado.dificultad==='facil' ? '#4caf7a' : (resultado.dificultad==='dificil' ? '#e24b4a' : '#e6c94a');
    const claveDificultad = resultado.dificultad==='facil' ? 'lm.amistoso_facil' : (resultado.dificultad==='dificil' ? 'lm.amistoso_dificil' : 'lm.amistoso_normal');
    const secuencia=generarSecuenciaGolesAmistoso(resultado.misGoles, resultado.susGoles);
    let misGolesVistos=0, susGolesVistos=0, indiceEvento=0;

    // Cada "tick" pinta el marcador tal como va en ese momento de la
    // simulación gol a gol — se reutiliza tanto para el 0-0 inicial
    // como para cada gol que va cayendo.
    function pintarTick(destacar){
      overlay.innerHTML=`
        <div class="lm-amistoso-resultado-card lm-amistoso-suspense">
          <div class="lm-amistoso-dificultad-badge" style="border-color:${colorDificultad};color:${colorDificultad}">
            <i class="ph ph-bold ph-soccer-ball"></i> ${t(claveDificultad).toUpperCase()}
          </div>
          <div class="lm-amistoso-marcador-vivo ${destacar?'lm-amistoso-marcador-vivo-destello':''}">
            ${crestHTML(state.escudo||null,26)}
            <span class="lm-amistoso-marcador-vivo-num">${misGolesVistos}</span>
            <span class="lm-amistoso-marcador-guion">-</span>
            <span class="lm-amistoso-marcador-vivo-num">${susGolesVistos}</span>
            <span class="lm-amistoso-marcador-rival"><i class="ph ph-bold ph-shield"></i></span>
          </div>
          <div class="lm-amistoso-jugando-texto">${t('lm.amistoso_jugando')}</div>
        </div>`;
    }

    function pintarResultadoFinal(){
      const colorResultado = resultado.resultado==='victoria' ? '#4caf7a' : (resultado.resultado==='derrota' ? '#e24b4a' : '#e6c94a');
      const claveResultado = resultado.resultado==='victoria' ? 'lm.amistoso_resultado_victoria' : (resultado.resultado==='derrota' ? 'lm.amistoso_resultado_derrota' : 'lm.amistoso_resultado_empate');
      const iconoResultado = resultado.resultado==='victoria' ? 'ph-trophy' : (resultado.resultado==='derrota' ? 'ph-x-circle' : 'ph-equals');
      overlay.innerHTML=`
        <div class="lm-amistoso-resultado-card">
          <button class="lm-popup-close-x" data-cerrar-amistoso title="${t('common.close')||'Cerrar'}">×</button>
          <div class="lm-amistoso-dificultad-badge" style="border-color:${colorDificultad};color:${colorDificultad}">
            <i class="ph ph-bold ph-soccer-ball"></i> ${t(claveDificultad).toUpperCase()}
          </div>
          <div class="lm-amistoso-resultado-titulo" style="color:${colorResultado}">
            <i class="ph ph-bold ${iconoResultado}"></i> ${t(claveResultado)}
          </div>
          <div class="lm-amistoso-marcador">
            ${crestHTML(state.escudo||null,34)}
            <span class="lm-amistoso-marcador-num">${resultado.misGoles}</span>
            <span class="lm-amistoso-marcador-guion">-</span>
            <span class="lm-amistoso-marcador-num">${resultado.susGoles}</span>
            <span class="lm-amistoso-marcador-rival"><i class="ph ph-bold ph-shield"></i></span>
          </div>
          <div class="lm-amistoso-consecuencias">
            ${resultado.moralDelta>0?`<div class="lm-amistoso-consecuencia lm-amistoso-consecuencia-buena"><i class="ph ph-bold ph-hand-fist"></i> ${tp('lm.amistoso_moral_ganada',{n:resultado.moralDelta})}</div>`:''}
            ${resultado.aficionDelta>0?`<div class="lm-amistoso-consecuencia lm-amistoso-consecuencia-buena"><i class="ph ph-bold ph-megaphone"></i> ${t('lm.amistoso_aficion_ganada')}</div>`:''}
            ${resultado.aficionDelta<0?`<div class="lm-amistoso-consecuencia lm-amistoso-consecuencia-mala"><i class="ph ph-bold ph-megaphone"></i> ${t('lm.amistoso_aficion_perdida')}</div>`:''}
            ${resultado.lesionado?`<div class="lm-amistoso-consecuencia lm-amistoso-consecuencia-mala"><i class="ph ph-bold ph-bandaids"></i> ${tp('lm.amistoso_lesion_texto',{nombre:resultado.lesionado})}</div>`:''}
            <div class="lm-amistoso-consecuencia"><i class="ph ph-bold ph-heartbeat"></i> ${t('lm.amistoso_fatiga_texto')}</div>
          </div>
          <button class="mode-card-btn mode-card-btn-gold" data-cerrar-amistoso>${t('lm.entendido_btn')}</button>
        </div>`;
      overlay.querySelectorAll('[data-cerrar-amistoso]').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          if(typeof window.playSound==='function') window.playSound('select');
          // Justo aquí, al cerrar, es cuando de verdad se aplican la
          // moral y la afición del amistoso — no antes, para que las
          // barras de arriba no cambien hasta que el jugador vea el
          // resultado completo.
          if(typeof aplicarConsecuenciasAmistoso==='function') aplicarConsecuenciasAmistoso();
          if(typeof aplicarIncrementoNodoAmistoso==='function') aplicarIncrementoNodoAmistoso();
          overlay.remove();
          if(typeof onCerrar==='function') onCerrar();
        });
      });
      // Victoria y derrota usan las fanfarrias ya existentes del juego
      // (arpegio ascendente / tono descendente) — el empate se queda
      // con el "reveal" genérico, al no ser premio ni castigo.
      if(typeof window.playSound==='function'){
        window.playSound(resultado.resultado==='victoria'?'victory':(resultado.resultado==='derrota'?'defeat':'reveal'));
      }
    }

    // Cada segundo se resuelve un gol de la secuencia (si el partido
    // acaba 0-0 no hay ninguno que resolver, y se pasa directamente a
    // un pequeño suspense fijo antes de revelar el resultado). El tono
    // del "goool" sube un poco en cada gol sucesivo de la racha, para
    // que la tensión suba cuanto más ajustado o goleador es el
    // amistoso — nunca sabes si el siguiente segundo trae otro gol.
    function siguienteTick(){
      if(indiceEvento>=secuencia.length){
        pintarResultadoFinal();
        return;
      }
      const evento=secuencia[indiceEvento];
      if(evento==='mio') misGolesVistos++; else susGolesVistos++;
      pintarTick(true);
      if(typeof window.playSound==='function') window.playSound('goal_escalado', {indice:indiceEvento});
      indiceEvento++;
      setTimeout(siguienteTick, 1000);
    }

    pintarTick(false);
    if(typeof window.playSound==='function') window.playSound('whistle');
    setTimeout(siguienteTick, secuencia.length ? 1000 : 1300);

    overlay.addEventListener('click', (e)=>{
      if(e.target===overlay && overlay.querySelector('[data-cerrar-amistoso]')){
        if(typeof aplicarConsecuenciasAmistoso==='function') aplicarConsecuenciasAmistoso();
        overlay.remove();
        if(typeof onCerrar==='function') onCerrar();
      }
    });
  }

  function cablearEventosArbolNodos(overlay){
    overlay.querySelectorAll('[data-elegir-dia]').forEach(el=>{
      el.addEventListener('click', (e)=>{
        const diaIdx=parseInt(el.getAttribute('data-elegir-dia'),10);
        const nodoIdx=parseInt(el.getAttribute('data-elegir-nodo'),10);
        const diaObj=state.semanaNodos && state.semanaNodos.dias[diaIdx];
        const nodoElegido=diaObj && diaObj.nodos[nodoIdx];
        const eraMedios = nodoElegido && nodoElegido.tipo==='medios';
        const eraQuinielaNodo = nodoElegido && nodoElegido.tipo==='quiniela';
        // El minijuego de scouting (si está activo) también necesita
        // que el árbol espere a que se cierre antes de decidir si la
        // semana ya está completa — igual que la quiniela, el nodo de
        // scouting puede caer en cualquier día, no solo en el último.
        const eraScoutingConMinijuego = nodoElegido && nodoElegido.tipo==='scouting' && LM_MINIJUEGO_SCOUTING_ACTIVO;
        const cerrarArbolYRender=()=>{
          const ov=document.getElementById('lmArbolNodosOverlay');
          if(ov) ov.remove();
          // En cuanto se cierra el árbol, se procesa la semana de
          // verdad (mejoras/fatiga/lesiones) y se enseña el
          // resumen ahí mismo — ya no hace falta pulsar SEGUIR
          // una segunda vez, al cerrar el resumen queda listo
          // para pulsar JUGAR directamente.
          procesarSemanaYMostrarResumen();
        };
        // Si el nodo elegido es "medios" (siempre el último día
        // garantizado), cerrar su interfaz SIEMPRE coincide con
        // completar la semana. La quiniela, en cambio, NUNCA está
        // garantizada como último día — puede caer en cualquier día
        // intermedio — así que su callback de cierre comprueba de
        // verdad, en el momento real en que el jugador termina con el
        // boletín (que puede ser bastante después, mientras lo
        // rellena con calma), si la semana ya está completa entonces.
        // Si no lo está, simplemente repinta el árbol para seguir
        // eligiendo el resto de días con normalidad — antes se
        // cerraba el árbol entero pasara lo que pasara, cortando la
        // semana en seco en cuanto la quiniela caía en un día que no
        // era el último.
        const onQuinielaCerrada=()=>{
          if(diaActualIndiceSemanaNodos()===-1){
            cerrarArbolYRender();
          } else {
            pintarArbolNodos();
            if(typeof render==='function') render();
          }
        };
        // Mismo patrón que la quiniela: el minijuego de scouting puede
        // caer en cualquier día de la semana, así que su cierre
        // comprueba en ese momento si ya se ha completado la semana.
        const onScoutingCerrada=()=>{
          if(diaActualIndiceSemanaNodos()===-1){
            cerrarArbolYRender();
          } else {
            pintarArbolNodos();
            if(typeof render==='function') render();
          }
        };
        const resultado=elegirNodoSemana(diaIdx, nodoIdx, eraMedios?cerrarArbolYRender:undefined, eraQuinielaNodo?onQuinielaCerrada:undefined, eraScoutingConMinijuego?onScoutingCerrada:undefined);
        if(!resultado.ok) return;
        if(typeof window.playSound==='function') window.playSound('select');
        // La onda necesita un instante para verse antes de que el
        // repintado sustituya este nodo por el siguiente estado — sin
        // este pequeño retraso, el clic se sentía "seco" porque el
        // elemento desaparecía justo cuando la onda debía empezar.
        crearRippleArbol(el, e);
        const eraAmistoso = resultado.nodo && resultado.nodo.tipo==='amistoso';
        setTimeout(()=>{
          const semanaYaCompleta = diaActualIndiceSemanaNodos()===-1;
          // En cuanto se completa la semana, el árbol se cierra solo
          // y el botón de fuera pasa directamente a JUGAR — ya no hay
          // ninguna pantalla intermedia de "semana completa" que
          // cerrar a mano.
          if(semanaYaCompleta){
            if(eraMedios || eraQuinielaNodo || eraScoutingConMinijuego){
              // Ya se encadenó arriba: cerrarArbolYRender() se llama
              // al cerrar la rueda de prensa, el boletín de la
              // quiniela o el minijuego de scouting, no aquí — solo
              // hace falta repintar el árbol de fondo mientras tanto.
              pintarArbolNodos();
            } else if(eraAmistoso && state.ultimoAmistosoResultado){
              mostrarResultadoAmistosoPopup(state.ultimoAmistosoResultado, cerrarArbolYRender);
            } else {
              cerrarArbolYRender();
            }
          } else {
            pintarArbolNodos();
            if(typeof render==='function') render();
            // Aquí también hace falta repintar DESPUÉS de aplicar las
            // consecuencias del amistoso (moral/afición) — antes solo
            // se pintaba justo antes de abrir este pop-up, así que la
            // barra de afición se quedaba con el valor de antes del
            // partido hasta la siguiente vez que algo más disparase
            // un repintado por su cuenta.
            if(eraAmistoso && state.ultimoAmistosoResultado){
              mostrarResultadoAmistosoPopup(state.ultimoAmistosoResultado, ()=>{
                if(typeof render==='function') render();
              });
            }
          }
        }, 220);
      });
    });
    overlay.querySelectorAll('[data-cerrar-arbol]').forEach(cerrarBtn=>{
      cerrarBtn.addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        document.getElementById('lmArbolNodosOverlay').remove();
        if(typeof render==='function') render();
      });
    });
    const leyendaBtn=overlay.querySelector('[data-nodos-leyenda]');
    if(leyendaBtn) leyendaBtn.addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      mostrarLeyendaIconosNodos();
    });
    overlay.querySelectorAll('[data-reclamar-nodo]').forEach(btn=>{
      btn.addEventListener('click', (e)=>{
        e.stopPropagation();
        if(typeof window.playSound==='function') window.playSound('select');
        abrirCanjeHitoNodo(btn.getAttribute('data-reclamar-nodo'), parseInt(btn.getAttribute('data-reclamar-umbral'),10));
      });
    });
    overlay.querySelectorAll('[data-ver-recompensa]').forEach(card=>{
      card.addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        mostrarMensajeRecompensaHito(card.getAttribute('data-ver-recompensa'), parseInt(card.getAttribute('data-ver-recompensa-umbral'),10), overlay);
      });
    });
  }

  // Punto de entrada público — se llama tanto al tocar el calendario
  // como al pulsar SEGUIR mientras quede semana por resolver.
  function abrirArbolNodosSemana(){
    asegurarSemanaNodos();
    if(!state.semanaNodos) return false;
    let overlay=document.getElementById('lmArbolNodosOverlay');
    if(!overlay){
      overlay=document.createElement('div');
      overlay.id='lmArbolNodosOverlay';
      overlay.className='lm-visor-leyenda-overlay-standalone lm-arbol-overlay';
      document.body.appendChild(overlay);
    }
    pintarArbolNodos(true);
    return true;
  }


  function calcularStatsEquipo(){
    const ids=Object.values(state.alineacion||{}).filter(Boolean);
    // Un sancionado NUNCA cuenta aquí — su hueco queda directamente
    // fuera de la media, como si la posición estuviera vacía, hasta que
    // se le sustituya (ver mostrarPopupSancionesAntesDeJugar).
    const titulares = ids.map(id=>state.plantilla.find(p=>p.id===id)).filter(p=>p && !p.suspendido);
    const base = titulares.length ? titulares : state.plantilla;
    const baseFinal = base.length ? base : state.plantilla; // último recurso: si la plantilla está vacía
    const suma = {attack:0,defense:0,pace:0,passing:0,technique:0};
    baseFinal.forEach(p=>{
      // Un jugador lesionado SÍ puede jugar, pero rinde peor — mismo
      // factor de penalización (0.6) que efectivoOverall().
      const f=p.injured?0.6:1;
      suma.attack+=p.attack*f; suma.defense+=p.defense*f; suma.pace+=p.pace*f; suma.passing+=p.passing*f; suma.technique+=p.technique*f;
    });
    const n=baseFinal.length||1;
    const bonus=formacionBonusActual();
    const tecPF=nivelDePF('potencialTecnico')*2, fisPF=nivelDePF('potencialFisico')*2;
    return {
      attack:suma.attack/n+(bonus.attack||0), defense:suma.defense/n+(bonus.defense||0), pace:suma.pace/n+(bonus.pace||0)+fisPF,
      passing:suma.passing/n+(bonus.passing||0), technique:suma.technique/n+(bonus.technique||0)+tecPF
    };
  }


  /* ---------- 3. Calendario ida/vuelta (método del círculo) ---------- */
  /* ---------- 2b. Fechas reales del calendario de entrenamiento — se
     apoya siempre en el objeto Date nativo del navegador, nunca en
     tablas de días fijas, así que sigue siendo correcto dentro de 20 o
     50 años sin tocar una línea. La liga arranca el sábado más cercano
     (hoy mismo si hoy ya es sábado) a partir del día en que se crea la
     partida, y cada jornada siguiente cae 7 días después. ---------- */
  function fechaISO(d){
    const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0'), day=String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
  }
  // Etiqueta de temporada tipo "26/27" — a partir del año de la fecha
  // real de inicio de la liga (jornada 1, siempre en agosto). Como el
  // calendario ya usa fechas realistas de temporada de fútbol
  // (agosto → mayo/junio del año siguiente), esto es simplemente los
  // dos últimos dígitos de ese año y del siguiente.
  function temporadaLabel(){
    if(!state.fechaInicioLiga) return '';
    const anioInicio=parseInt(state.fechaInicioLiga.slice(0,4), 10);
    if(!anioInicio) return '';
    const dosDigitos=n=>String(n%100).padStart(2,'0');
    return `${dosDigitos(anioInicio)}/${dosDigitos(anioInicio+1)}`;
  }
  // Fecha de inicio de temporada realista: en vez de arrancar la
  // jornada 1 "el próximo sábado desde hoy" (lo que podía situar una
  // liga entera en cualquier época del año, sin relación con un
  // calendario real de fútbol), se usa el tercer sábado de agosto —
  // fecha habitual de inicio de LaLiga — del año en curso. Con eso, 38
  // jornadas semanales terminan de forma natural a finales de mayo del
  // año siguiente, igual que una temporada real (agosto → mayo/junio).
  // Si esa fecha de agosto ya ha quedado atrás este año, se usa la del
  // año siguiente — nunca se puede arrancar una jornada 1 en el pasado.
  function inicioTemporadaRealista(){
    function tercerSabadoDeAgosto(year){
      const d=new Date(year, 7, 1); // 1 de agosto
      const diasHastaPrimerSabado=(6-d.getDay()+7)%7;
      d.setDate(1+diasHastaPrimerSabado+14); // +2 semanas = tercer sábado
      return d;
    }
    const hoy=new Date(); hoy.setHours(0,0,0,0);
    let candidato=tercerSabadoDeAgosto(hoy.getFullYear());
    // Mismo margen mínimo de 5 días que ya usaba proximoSabadoDesde,
    // como red de seguridad heredada.
    const diasMargen=(candidato-hoy)/86400000;
    if(diasMargen<5) candidato=tercerSabadoDeAgosto(hoy.getFullYear()+1);
    return candidato;
  }
  // Reparto real de LaLiga: cada jornada se juega entre viernes y lunes
  // (a veces incluso más días por aplazamientos, pero nos quedamos con
  // el núcleo habitual), con la mayoría de partidos en sábado y domingo,
  // algo menos el viernes, y solo alguno el lunes — igual que en la
  // competición real. El día se calcula con un hash determinista a
  // partir del número de jornada, así que siempre sale el mismo sin
  // tener que guardar nada aparte en el estado.
  function offsetDiaJornada(n){
    let h=(n*2654435761)%2147483647; if(h<0) h+=2147483647;
    const r=h/2147483647; // 0..1 estable para cada jornada
    if(r<0.12) return -1; // viernes
    if(r<0.52) return 0;  // sábado
    if(r<0.90) return 1;  // domingo
    return 2;              // lunes
  }
  function fechaJornadaLM(n){
    if(!state.fechaInicioLiga) return null;
    const inicio=new Date(state.fechaInicioLiga+'T00:00:00');
    // La jornada 1 se queda fija en el sábado de inicio de liga — así
    // nunca puede caer antes de hoy (el offset de las demás jornadas sí
    // puede adelantar o atrasar el día, pero la 1ª no tiene semana previa
    // que mover hacia atrás sin arriesgarse a caer en el pasado).
    if(n<=1) return inicio;
    const f=new Date(inicio);
    f.setDate(inicio.getDate()+(n-1)*7+offsetDiaJornada(n));
    return f;
  }
  function diaSemanaCorto(d){
    return ['DOM','LUN','MAR','MIÉ','JUE','VIE','SÁB'][d.getDay()];
  }
  // Version traducible del dia de la semana, para el arbol de nodos —
  // a diferencia de diaSemanaCorto() (uso interno del calendario,
  // siempre en español), esta usa el idioma real del jugador.
  function diaSemanaCortoI18n(d){
    const claves=['lm.dia_abrev_dom','lm.dia_abrev_lun','lm.dia_abrev_mar','lm.dia_abrev_mie','lm.dia_abrev_jue','lm.dia_abrev_vie','lm.dia_abrev_sab'];
    return t(claves[d.getDay()]);
  }
  const MESES_LARGO=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

  // Generador de calendario tipo "todos contra todos" (ida y vuelta).
  // Soporta CUALQUIER número de equipos, par o impar: con un número
  // impar (habitual en ligas personalizadas pequeñas) se añade un
  // hueco fantasma para completar el algoritmo estándar del método
  // del círculo, y el equipo que le toque enfrentarse a ese hueco en
  // cada jornada simplemente descansa esa jornada — nunca se genera
  // un partido de un equipo contra sí mismo, que es justo lo que
  // rompía la clasificación (y el propio partido) con un número
  // impar de equipos. El descanso va rotando de forma natural entre
  // todos los equipos, jornada tras jornada, gracias al propio
  // algoritmo.
  function generarCalendario(teamsOriginal){
    const esImpar = teamsOriginal.length % 2 !== 0;
    const teams = esImpar ? [...teamsOriginal, null] : teamsOriginal.slice();
    const n=teams.length, rounds=n-1, half=n/2;
    let arr=teams.slice(1);
    const ida=[];
    for(let r=0;r<rounds;r++){
      const roundTeams=[teams[0],...arr];
      const round=[];
      for(let i=0;i<half;i++){
        const a=roundTeams[i], b=roundTeams[n-1-i];
        if(a===null || b===null) continue; // el equipo que le toca frente al hueco descansa esta jornada
        round.push(r%2===0 ? {home:a,away:b} : {home:b,away:a});
      }
      ida.push(round);
      arr.unshift(arr.pop());
    }
    const vuelta=ida.map(round=>round.map(p=>({home:p.away,away:p.home})));
    return [...ida,...vuelta];
  }

  /* ---------- 4. Simulación de un partido (motor genérico reutilizado) ---------- */
  // Efecto de clima+campo sobre el resultado — un campo bien cuidado
  // mitiga buena parte del impacto del mal tiempo para el equipo QUE
  // JUEGA EN SU CASA (lo conoce, entrena en él); el visitante sufre el
  // impacto completo del clima, algo agravado si además el campo del
  // anfitrión está descuidado (peor agarre, terreno irregular).
  function factorClimaCampo(weatherId, campoAnfitrion, esAnfitrion){
    if(!weatherId || weatherId==='cloudy' || campoAnfitrion===undefined) return 1;
    const impacto={sunny:0.02, rain:0.07, wind:0.035, hot:0.055, snow:0.06}[weatherId] || 0;
    if(esAnfitrion){
      const mitigacion=(campoAnfitrion/100)*0.75; // un campo perfecto mitiga hasta el 75% del impacto del clima
      return 1-(impacto*(1-mitigacion));
    }
    const agravante=1+(100-campoAnfitrion)/100*0.4; // hasta un 40% más de impacto si el campo rival está muy descuidado
    return 1-(impacto*agravante);
  }
  function simularPartido(teamA, teamB, contexto){
    const statsA = teamA.id==='lm_0' ? calcularStatsEquipo() : {attack:teamA.attack,defense:teamA.defense,pace:teamA.pace,passing:teamA.passing,technique:teamA.technique};
    const statsB = teamB.id==='lm_0' ? calcularStatsEquipo() : {attack:teamB.attack,defense:teamB.defense,pace:teamB.pace,passing:teamB.passing,technique:teamB.technique};
    const mod=window.tacticalModifier(statsA,statsB);
    let lambdaA=Math.max(0.25, 1.15+mod.myScoreMod);
    let lambdaB=Math.max(0.25, 1.15+mod.oppScoreMod);
    // Leer el partido y elegir bien la formación importa: un
    // planteamiento defensivo (contragolpe) saca mucho más partido a un
    // rival muy ofensivo y flojo atrás — se abren espacios a la contra
    // que una formación defensiva está hecha para aprovechar. Al revés,
    // jugar ofensivo contra un equipo muy defensivo cuesta más goles de
    // los que parece que deberían caer solo por diferencia de nivel.
    const miEsA = teamA.id==='lm_0', miEsB = teamB.id==='lm_0';
    if(miEsA || miEsB){
      const misStats = miEsA ? statsA : statsB;
      const statsRival = miEsA ? statsB : statsA;
      const miFormacion = state.formacionCategoria;
      const miFormacionCode = state.formacionCode;
      const desequilibrioRival = statsRival.attack - statsRival.defense; // positivo = ofensivo y flojo atrás
      let bonusPropio=0, penalizacionRival=0;
      if(miFormacion==='defensiva' && desequilibrioRival>8){
        bonusPropio=Math.min(0.35, (desequilibrioRival-8)*0.022);
        // Dentro de las defensivas, el 5-2-2-1 (Contragolpe) es la
        // formación perfecta contra un rival muy ofensivo y flojo
        // atrás — aprovecha justo ese desequilibrio al máximo.
        if(miFormacionCode==='5-2-2-1') bonusPropio+=0.10;
      } else if(miFormacion==='ofensiva' && desequilibrioRival<-8){
        // Rival muy defensivo y yo jugando ofensivo: cuesta más de lo
        // que la diferencia de nivel sugeriría, el rival está hecho para
        // encerrarse justo contra este tipo de planteamiento.
        penalizacionRival=Math.min(0.28, (-desequilibrioRival-8)*0.018);
        // Dentro de las ofensivas, el 3-5-2 (Superioridad central) es la
        // formación perfecta para romper un bloque bajo — el extra de
        // pase compensa parte de esa penalización.
        if(miFormacionCode==='3-5-2') penalizacionRival=Math.max(0, penalizacionRival-0.10);
      }
      if(miEsA){ lambdaA=Math.max(0.15,lambdaA+bonusPropio-penalizacionRival); }
      else { lambdaB=Math.max(0.15,lambdaB+bonusPropio-penalizacionRival); }
    }
    if(contexto && contexto.climaId){
      const climaSkillActiva = typeof lmSkillActiva==='function' && lmSkillActiva('lm_meteorologo');
      let factorA=factorClimaCampo(contexto.climaId, contexto.campoAnfitrion, contexto.anfitrionA);
      let factorB=factorClimaCampo(contexto.climaId, contexto.campoAnfitrion, !contexto.anfitrionA);
      // Especialista en Clima: la penalización (la distancia hasta 1.0)
      // se reduce a la mitad, solo para mi equipo.
      if(climaSkillActiva && miEsA) factorA = 1 - (1-factorA)*0.5;
      if(climaSkillActiva && miEsB) factorB = 1 - (1-factorB)*0.5;
      lambdaA=Math.max(0.15, lambdaA*factorA);
      lambdaB=Math.max(0.15, lambdaB*factorB);
    }
    if(contexto && contexto.moralBonus){
      // Mismo espíritu que moraleLambdaBonus() en Copa Leyendas, pero más
      // moderado (±0.08 frente a ±0.15) al ya sumarse al efecto de
      // clima+campo — solo afecta a MI equipo, nunca al rival.
      if(contexto.esMiEquipoA) lambdaA=Math.max(0.15, lambdaA+contexto.moralBonus);
      else lambdaB=Math.max(0.15, lambdaB+contexto.moralBonus);
    }
    if(contexto && contexto.tacticaBoost){
      // Hito de sesión táctica (nivel 10): ventaja notable en los
      // duelos individuales del próximo partido — mismo mecanismo que
      // el bonus de moral (empuja el ritmo goleador esperado de mi
      // equipo), pero por un motivo distinto y solo para ESE partido.
      if(contexto.esMiEquipoA) lambdaA=Math.max(0.15, lambdaA+contexto.tacticaBoost);
      else lambdaB=Math.max(0.15, lambdaB+contexto.tacticaBoost);
    }
    // Habilidades de Liga Manager — todas de ámbito táctico/de partido,
    // nunca tocan lo que resuelven las cartas del cuerpo técnico.
    if(contexto && (miEsA || miEsB) && typeof lmSkillActiva==='function'){
      const yoSoyLocal = miEsA ? contexto.anfitrionA : !contexto.anfitrionA;
      if(yoSoyLocal && lmSkillActiva('lm_factor_campo')){
        if(miEsA) lambdaA=Math.max(0.15, lambdaA+0.10); else lambdaB=Math.max(0.15, lambdaB+0.10);
      }
      if(!yoSoyLocal && lmSkillActiva('lm_contraataque_letal')){
        // Jugando fuera, defiendes mejor: reduces el ataque del rival.
        if(miEsA) lambdaB=Math.max(0.15, lambdaB-0.08); else lambdaA=Math.max(0.15, lambdaA-0.08);
      }
      if((state.rachaResultados||0)>=3 && lmSkillActiva('lm_mentalidad_ganadora')){
        if(miEsA) lambdaA=Math.max(0.15, lambdaA+0.08); else lambdaB=Math.max(0.15, lambdaB+0.08);
      }
      if((state.rachaResultados||0)===-1 && lmSkillActiva('lm_revancha')){
        // Justo tras perder el partido anterior — el equipo sale con
        // hambre de resarcirse.
        if(miEsA) lambdaA=Math.max(0.15, lambdaA+0.09); else lambdaB=Math.max(0.15, lambdaB+0.09);
      }
    }
    const golesA=window.poissonSample(lambdaA);
    const golesB=window.poissonSample(lambdaB);
    // Posesión del partido — mismo criterio que ya usa el visor
    // manager para decidir quién tiene más el balón: un equipo con
    // mejor pase y técnica controla más el partido. Se guarda como
    // parte del resultado para poder mostrarla y mencionarla luego,
    // tanto en modo automático como en modo manager.
    const calidadA=(statsA.passing+statsA.technique)/2, calidadB=(statsB.passing+statsB.technique)/2;
    const posesionA=Math.max(32, Math.min(68, Math.round(50+(calidadA-calidadB)/1.6)));
    return {golesA,golesB,posesionA,posesionB:100-posesionA};
  }

  /* ---------- 5. Estado persistente (localStorage, prototipo) ---------- */
  let state=null;
  let setupStep=1;
  let formacionCategoriaVista=null; // categoría que se está viendo en el selector (no siempre coincide con la activa)
  let seleccionJugador=null; // id del jugador seleccionado en la plantilla/banquillo/campo, a la espera del segundo clic
  // Ordenación de la tabla PLANTILLA — mismo sistema de 3 modos que
  // CONVOCADOS en Copa Leyendas (LLEGADA/POSICIÓN/PUNTOS, un botón cíclico).
  let lmSortMode='position';
  const LM_SORT_LABELS={arrival:'LLEGADA', position:'POSICIÓN', rating:'PUNTOS', numero:'DORSAL'};
  const LM_SORT_NEXT={arrival:'position', position:'rating', rating:'numero', numero:'arrival'};
  // Los catálogos de cartas (MEDICO_CARTAS_BASE, etc.) son const que se
  // evalúan una sola vez al cargar el archivo — si el nombre/descripción
  // se tradujera AL DEFINIR la carta, se quedaría congelado en el
  // idioma que estuviera activo en ese momento. Por eso se resuelve
  // aquí, cada vez que se muestra, con el texto en español original
  // como respaldo si falta la clave.
  function tc(prefix, id, campo, fallback){
    const key=prefix+'.'+id+'.'+campo;
    const val=(typeof window.t==='function') ? window.t(key) : null;
    return (val && val!==key) ? val : fallback;
  }
  // Traduce una clave de texto y sustituye marcadores {nombre} por los
  // valores reales pasados en un objeto — usado sobre todo en los
  // correos internos, que mezclan texto fijo con datos de la partida.
  function tp(key, vars){
    let texto=(typeof window.t==='function') ? window.t(key) : key;
    if(vars) Object.keys(vars).forEach(k=>{ texto=texto.split('{'+k+'}').join(vars[k]); });
    return texto;
  }
  let clasifColapsada=false; // la clasificación empieza desplegada
  // ---- Rasgos de jugador ----
  // Se ganan a través de la quiniela (nunca se compran) y se quedan
  // para siempre en el jugador que los recibe. La mayoría suman +5 a
  // una de sus 5 estadísticas; Versátil es especial: quita la
  // penalización de jugar fuera de su posición natural.
  // ---- Guardias de seguridad ----
  // 12 zonas reales del estadio (gradas.png), con su posición aproximada
  // sobre la imagen para poder pintar la insignia y los botones +/- en
  // el sitio correcto.
  const LM_ZONAS_ESTADIO=[
    {id:'norte', get label(){return t('lm.zona_norte');}, left:49, top:13, w:64, h:20},
    {id:'este_1',  get label(){return t('lm.zona_este_1');}, left:87, top:33, w:15, h:26},
    {id:'este_2',  get label(){return t('lm.zona_este_2');}, left:87, top:60, w:15, h:26},
    {id:'sur',   get label(){return t('lm.zona_sur');}, left:49, top:80, w:64, h:20},
    {id:'oeste_2', get label(){return t('lm.zona_oeste_2');}, left:9,  top:60, w:15, h:26},
    {id:'oeste_1', get label(){return t('lm.zona_oeste_1');}, left:9, top:33, w:15, h:26},
  ];
  const LM_DISTURBIO_LABEL={get 0(){return t('lm.disturbio_0');},get 1(){return t('lm.disturbio_1');},get 2(){return t('lm.disturbio_2');},get 3(){return t('lm.disturbio_3');}};
  const LM_DISTURBIO_COLOR={0:null,1:'#e6c94a',2:'#e88a2e',3:'#e24b4a'};
  // Coste base del guardia y descuento por trabajador de nivel alto —
  // igual que el resto del cuerpo técnico, 3 estrellas abarata las cosas.
  const GUARDIA_SALARIO_BASE=1000;
  const GUARDIA_FINIQUITO=1000;
  function guardiaSalarioActual(){
    const trab=state.trabajadores && state.trabajadores.mantenimiento;
    const nivel=trab?trab.nivel:1;
    const descuento = nivel>=3 ? 0.25 : (nivel===2 ? 0.10 : 0);
    return Math.round(GUARDIA_SALARIO_BASE*(1-descuento));
  }
  function guardiasAsignadosTotal(){
    return Object.values(state.guardiasZonas||{}).reduce((a,b)=>a+(b||0),0);
  }
  function guardiasDisponibles(){
    return Math.max(0, (state.guardiasContratados||0)-guardiasAsignadosTotal());
  }
  function contratarGuardia(){
    state.guardiasContratados=(state.guardiasContratados||0)+1;
    guardarEstado();
  }
  function despedirGuardiaDisponible(){
    if(guardiasDisponibles()<=0) return false;
    // Despedir tiene un finiquito real de 1000€ — se descuenta de las
    // finanzas del club de verdad (registrarMovimientoFinanciero solo
    // anota el movimiento en el historial, no toca el capital por su
    // cuenta) y se avisa al jugador con un toast.
    state.capital=(state.capital||0)-GUARDIA_FINIQUITO;
    if(typeof registrarMovimientoFinanciero==='function'){
      registrarMovimientoFinanciero(t('lm.concepto_finiquito_guardia'), -GUARDIA_FINIQUITO, state.jornadaActual);
    }
    if(typeof showToast==='function') showToast(tp('lm.aviso_finiquito_guardia', {n:GUARDIA_FINIQUITO}));
    state.guardiasContratados=Math.max(0,(state.guardiasContratados||0)-1);
    guardarEstado();
    return true;
  }
  function asignarGuardiaZona(zonaId){
    if(guardiasDisponibles()<=0) return false;
    if(!state.guardiasZonas) state.guardiasZonas={};
    if((state.guardiasZonas[zonaId]||0)>=3) return false;
    state.guardiasZonas[zonaId]=(state.guardiasZonas[zonaId]||0)+1;
    guardarEstado();
    return true;
  }
  function quitarGuardiaZona(zonaId){
    if(!state.guardiasZonas || !(state.guardiasZonas[zonaId]>0)) return false;
    state.guardiasZonas[zonaId]--;
    guardarEstado();
    return true;
  }
  // Se llama una vez por jornada jugada como local — las zonas sin
  // guardias van acumulando disturbios si la afición está descontenta;
  // más guardias en una zona reducen o frenan ese avance. Una zona que
  // llega a GRAVE sin ningún guardia puede estallar en disturbios de
  // verdad, con daños económicos reales.
  function procesarDisturbiosTrasPartido(){
    if(!state.disturbiosZonas) return;
    const satisfaccion=(state.estadio&&state.estadio.satisfaccion)||0;
    // Cuanto peor esté la afición, más probable que una zona sin
    // vigilancia empeore; con buena satisfacción, las zonas tienden a
    // calmarse solas con el tiempo.
    const probabilidadEmpeorar = satisfaccion<=-40 ? 0.55 : (satisfaccion<=-10 ? 0.32 : (satisfaccion<10 ? 0.12 : 0));
    // Vigilancia Extra: reduce ligeramente la probabilidad de que
    // empeore una zona sin guardias — nunca sustituye a los guardias
    // de verdad, solo la nudge un poco a favor.
    const probabilidadEmpeorarFinal = (typeof lmSkillActiva==='function' && lmSkillActiva('lm_vigilancia_extra')) ? probabilidadEmpeorar*0.8 : probabilidadEmpeorar;
    const probabilidadMejorar = satisfaccion>=10 ? 0.4 : 0.15;
    let zonaEstallada=null;
    LM_ZONAS_ESTADIO.forEach(z=>{
      const guardias=state.guardiasZonas[z.id]||0;
      let nivel=state.disturbiosZonas[z.id]||0;
      if(guardias>0){
        // Cada guardia asignado da más probabilidad de que la zona
        // mejore un nivel, y ninguna de que empeore.
        if(nivel>0 && Math.random()<0.25+guardias*0.2) nivel=Math.max(0, nivel-1);
      } else {
        if(nivel<3 && Math.random()<probabilidadEmpeorarFinal) nivel=Math.min(3, nivel+1);
        else if(nivel>0 && Math.random()<probabilidadMejorar) nivel=Math.max(0, nivel-1);
        // Una zona GRAVE, sin ningún guardia, puede estallar de verdad.
        if(nivel>=3 && !zonaEstallada && Math.random()<0.3) zonaEstallada=z;
      }
      state.disturbiosZonas[z.id]=nivel;
    });
    // Penalización a satisfacción y moral mientras haya disturbios
    // activos en cualquier zona — cuanto más graves en conjunto, más
    // castigo. Antes los disturbios solo importaban si llegaban a
    // estallar del todo; ahora ya se notan desde el nivel "leve".
    const severidadTotal = LM_ZONAS_ESTADIO.reduce((s,z)=>s+(state.disturbiosZonas[z.id]||0), 0);
    if(severidadTotal>0){
      if(!state.estadio) state.estadio={campo:90, satisfaccion:10, aforoTotal:12000, ultimaAsistencia:null};
      state.estadio.satisfaccion=Math.max(-100, state.estadio.satisfaccion-severidadTotal*1.5);
      state.moral=Math.max(-50, (state.moral||0)-severidadTotal);
    }
    if(zonaEstallada) resolverEstallidoDisturbios(zonaEstallada);
  }
  function resolverEstallidoDisturbios(zona){
    const daño=1200+Math.floor(Math.random()*2600);
    state.capital=(state.capital||0)-daño;
    registrarMovimientoFinanciero('Daños por disturbios en '+zona.label, -daño, state.jornadaActual);
    state.disturbiosZonas[zona.id]=1; // vuelve a leve tras el suceso, no a cero — el ambiente sigue algo caldeado
    enviarCorreo('mantenimiento', tp('correo.incidentes_zona.asunto', {zona:zona.label}),
      tp('correo.incidentes_zona.cuerpo', {zona:zona.label, dano:formatoDinero(daño)}),
      {asunto:'correo.incidentes_zona.asunto', paramsAsunto:{zona:zona.label}, cuerpo:'correo.incidentes_zona.cuerpo', paramsCuerpo:{zona:zona.label, dano:formatoDinero(daño)}});
  }
  const LM_RASGOS_DEFS=[
    {id:'killer', icon:'ph-target', stat:'attack', get name(){return t('rasgo.killer.nombre');}, get desc(){return t('rasgo.killer.desc');}},
    {id:'muro_defensivo', icon:'ph-shield', stat:'defense', get name(){return t('rasgo.muro_defensivo.nombre');}, get desc(){return t('rasgo.muro_defensivo.desc');}},
    {id:'velocista', icon:'ph-lightning', stat:'pace', get name(){return t('rasgo.velocista.nombre');}, get desc(){return t('rasgo.velocista.desc');}},
    {id:'lider', icon:'ph-brain', stat:'passing', get name(){return t('rasgo.lider.nombre');}, get desc(){return t('rasgo.lider.desc');}},
    {id:'especialista_balon_parado', icon:'ph-soccer-ball', stat:'technique', get name(){return t('rasgo.especialista_balon_parado.nombre');}, get desc(){return t('rasgo.especialista_balon_parado.desc');}},
    {id:'incansable', icon:'ph-battery-charging', stat:'pace', get name(){return t('rasgo.incansable.nombre');}, get desc(){return t('rasgo.incansable.desc');}},
    {id:'versatil', icon:'ph-arrows-out-cardinal', stat:null, get name(){return t('rasgo.versatil.nombre');}, get desc(){return t('rasgo.versatil.desc');}},
  ];
  function rasgoDef(id){ return LM_RASGOS_DEFS.find(r=>r.id===id); }
  // Asigna un rasgo a un jugador de la plantilla — si ya lo tenía, no
  // hace nada (nunca se duplica). Los rasgos de estadística suman +5 de
  // forma permanente, con tope en 99.
  function asignarRasgoJugador(jugadorId, rasgoId){
    const jugador=(state.plantilla||[]).find(p=>p.id===jugadorId);
    const def=rasgoDef(rasgoId);
    if(!jugador || !def) return false;
    if(!jugador.rasgos) jugador.rasgos=[];
    if(jugador.rasgos.includes(rasgoId)) return false;
    jugador.rasgos.push(rasgoId);
    if(def.stat){
      jugador[def.stat]=Math.min(99, (jugador[def.stat]||0)+5);
      // El overall del jugador se recalcula a partir de sus 5
      // estadísticas reales — así la media del equipo (que se calcula a
      // partir de esto) y su valor de venta (que usa overall
      // directamente al generar ofertas) quedan siempre al día, sin
      // quedarse con un número antiguo.
      jugador.overall=Math.round((jugador.attack+jugador.defense+jugador.pace+jugador.passing+jugador.technique)/5);
      jugador.salario=calcularSalario(jugador.overall);
    }
    guardarEstado();
    return true;
  }
  // Icono(s) de rasgo en miniatura para mostrar junto al nombre del
  // jugador en listas y en el campo.
  function rasgosIconosHTML(jugador){
    if(!jugador || !jugador.rasgos || !jugador.rasgos.length) return '';
    return jugador.rasgos.map(id=>{
      const def=rasgoDef(id);
      if(!def) return '';
      return `<i class="ph ph-bold ${def.icon} lm-rasgo-icono" title="${def.name} — ${def.desc}"></i>`;
    }).join('');
  }

  // ---- Quiniela ----
  // Cada 3 victorias llega un correo del Director General con un boletín
  // para la PRÓXIMA jornada — se eligen 1/X/2 para cada partido de la
  // ronda completa. Se resuelve en cuanto esa jornada se juega de
  // verdad, mostrándose justo después de cerrar el resultado del
  // siguiente partido: premio económico siempre, y si se acierta más de
  // la mitad, también 1-3 rasgos a repartir entre tu plantilla.
  function generarBoletoQuiniela(jornadaIndexForzado){
    // Normalmente esto se llama a mitad de jugarJornada(), antes de
    // incrementar jornadaActual — el índice 0-based de jornadaActual
    // apunta entonces a la PRÓXIMA jornada de verdad. La única
    // excepción es el regalo de bienvenida (se llama antes de jugar
    // absolutamente nada), donde se fuerza a la jornada 1 (índice 0).
    const jSiguiente = jornadaIndexForzado!==undefined ? jornadaIndexForzado : state.jornadaActual;
    if(jSiguiente>=38) return;
    const partidos=state.calendario[jSiguiente];
    if(!partidos || !partidos.length) return;
    state.quinielaBoleto={
      jornadaIndex:jSiguiente,
      partidos:partidos.map(p=>({homeId:p.home.id, homeName:p.home.name, homeCrest:p.home.crestImg||null, homeEsMio:p.home.id==='lm_0',
        awayId:p.away.id, awayName:p.away.name, awayCrest:p.away.crestImg||null, awayEsMio:p.away.id==='lm_0'})),
      predicciones:{}, rellenado:false
    };
    // Hito de scouting... no, de quiniela (5 nodos acumulados): una
    // pista real para MI propio partido de ese boletín, si aparece en
    // él — compara mi plantilla real contra la del rival (datos ya
    // existentes, no inventa nada) y marca quién parte favorito.
    if(state.nodosBanderasPendientes && state.nodosBanderasPendientes.quinielaConPista){
      const miPartido=partidos.find(p=>p.home.id==='lm_0'||p.away.id==='lm_0');
      if(miPartido){
        const rivalEquipo = miPartido.home.id==='lm_0' ? miPartido.away : miPartido.home;
        const miOverall=(typeof calcularStatsEquipoLM==='function' ? calcularStatsEquipoLM().overall : null);
        const rivalOverall = rivalEquipo && rivalEquipo.attack!==undefined
          ? Math.round((rivalEquipo.attack+rivalEquipo.defense+rivalEquipo.pace+rivalEquipo.passing+rivalEquipo.technique)/5)
          : null;
        if(miOverall!=null && rivalOverall!=null){
          const miEntradaBoleto=state.quinielaBoleto.partidos.find(bp=>bp.homeId==='lm_0'||bp.awayId==='lm_0');
          if(miEntradaBoleto) miEntradaBoleto.pista = miOverall>rivalOverall+3 ? 'gano' : (rivalOverall>miOverall+3 ? 'pierdo' : 'empate');
        }
      }
      state.nodosBanderasPendientes.quinielaConPista=false;
    }
  }
  function resultadoPartidoQuiniela(res){
    if(res.golesA>res.golesB) return '1';
    if(res.golesA<res.golesB) return '2';
    return 'X';
  }
  // El propio equipo no tiene una URL de escudo como los rivales (usa
  // state.escudo con su propio formato) — este helper elige la forma
  // correcta según quién sea, para poder mostrar SIEMPRE un escudo en
  // la quiniela, sea rival o el mío.
  function quinielaEscudoHTML(esMio, crestUrl, size){
    if(esMio) return crestHTML(state.escudo, size);
    if(crestUrl) return `<img src="${crestUrl}" alt="" style="width:${size}px;height:${size}px;object-fit:contain">`;
    return '';
  }
  // Se llama al final de cada jugarJornada() — si hay un boleto
  // rellenado esperando justo esta jornada, calcula aciertos, premio y
  // rasgos, y lo deja guardado para mostrarse en cuanto se cierre el
  // resultado del partido.
  function resolverQuinielaSiToca(jIndexJugado){
    const boleto=state.quinielaBoleto;
    if(!boleto || !boleto.rellenado || boleto.jornadaIndex!==jIndexJugado) return;
    let aciertos=0;
    const detalle=boleto.partidos.map(p=>{
      const key=jIndexJugado+'-'+p.homeId+'-'+p.awayId;
      const res=state.resultados[key];
      const real = res ? resultadoPartidoQuiniela(res) : null;
      // Con los cheats activados, la quiniela sale siempre perfecta —
      // se muestra la predicción como si hubiera acertado el resultado
      // real en todos los partidos.
      const prediccionReal=boleto.predicciones[jIndexJugado+'-'+p.homeId+'-'+p.awayId];
      const prediccion = window.CHEATS_ACTIVE ? real : prediccionReal;
      const acierto = window.CHEATS_ACTIVE ? !!real : (real && prediccionReal===real);
      if(acierto) aciertos++;
      return {...p, prediccion, real, acierto};
    });
    const total=detalle.length;
    let premio=Math.round((aciertos/total)*aciertos*3500); // crece más que proporcional cuantos más aciertas
    const banderas=state.nodosBanderasPendientes||{};
    if(banderas.quinielaMultiplicador){ premio=Math.round(premio*1.5); banderas.quinielaMultiplicador=false; }
    const rasgosGanados=[];
    if(aciertos/total>0.5){
      let numRasgos=aciertos===total?3:(aciertos/total>=0.75?2:1);
      if(banderas.quinielaHitosGarantizados){ numRasgos=3; banderas.quinielaHitosGarantizados=false; }
      const catalogoDisponible=LM_RASGOS_DEFS.slice();
      for(let i=0;i<numRasgos;i++){
        const elegido=catalogoDisponible.splice(Math.floor(Math.random()*catalogoDisponible.length),1)[0];
        if(elegido) rasgosGanados.push(elegido.id);
      }
    }
    state.capital=(state.capital||0)+premio;
    if(premio>0) registrarMovimientoFinanciero('Premio de quiniela ('+aciertos+'/'+total+' aciertos)', premio, state.jornadaActual);
    state.quinielaResultadoPendiente={aciertos, total, premio, rasgosGanados, detalle};
    state.quinielaBoleto=null;
    if(typeof window.unlockLMAchievement==='function') window.unlockLMAchievement('lm_first_quiniela', false);
    // Racha de quinielas perfectas (todas acertadas) seguidas — se
    // reinicia en cuanto una quiniela resuelta no es perfecta.
    if(aciertos===total && total>0){
      state.quinielaRachaPerfecta=(state.quinielaRachaPerfecta||0)+1;
      if(state.quinielaRachaPerfecta>=3 && typeof window.unlockLMAchievement==='function') window.unlockLMAchievement('lm_quiniela_streak', false);
    } else {
      state.quinielaRachaPerfecta=0;
    }
    guardarEstado();
  }
  // Historial real ganados/empatados/perdidos de un equipo concreto —
  // recorre todo el calendario ya jugado, comparando cada resultado
  // guardado contra los goles del propio equipo en ese partido.
  function calcularHistorialEquipo(equipoId){
    const historial={ganados:0, empatados:0, perdidos:0, jugados:0};
    (state.calendario||[]).forEach((jornada, j)=>{
      jornada.forEach(partido=>{
        const esLocal = partido.home.id===equipoId, esVisitante = partido.away.id===equipoId;
        if(!esLocal && !esVisitante) return;
        const key=j+'-'+partido.home.id+'-'+partido.away.id;
        const resultado=state.resultados[key];
        if(!resultado) return;
        const misGoles = esLocal ? resultado.golesA : resultado.golesB;
        const susGoles = esLocal ? resultado.golesB : resultado.golesA;
        historial.jugados++;
        if(misGoles>susGoles) historial.ganados++;
        else if(misGoles===susGoles) historial.empatados++;
        else historial.perdidos++;
      });
    });
    return historial;
  }
  function mostrarHistorialEquipoQuiniela(equipoId, nombreEquipo, crestImg){
    const h=calcularHistorialEquipo(equipoId);
    const overlay=document.createElement('div');
    // Se usa un id propio con z-index de máxima prioridad, no la clase
    // genérica de siempre (z-index:200) — este pop-up se abre desde
    // dentro de la quiniela, que ya tiene z-index:250 por sí sola, así
    // que con la clase genérica se quedaba siempre por detrás.
    overlay.id='lmHistorialEquipoOverlay';
    const pctBarra=(valor)=>h.jugados ? Math.round(valor/h.jugados*100) : 0;
    overlay.innerHTML=`
      <div class="lm-dilemma-card lm-historial-equipo-card" style="max-width:320px">
        <div class="lm-historial-equipo-cab">
          ${rivalCrestHTML(48, crestImg)}
          <div>
            <div class="lm-historial-equipo-nombre">${nombreEquipo}</div>
            <div class="lm-historial-equipo-sub">${tp('lm.historial_partidos_jugados', {n:h.jugados})}</div>
          </div>
        </div>
        ${h.jugados===0 ? `<p class="lm-setup-desc" style="text-align:center;margin:16px 0">${t('lm.historial_sin_partidos')}</p>` : `
        <div class="lm-historial-fila">
          <span class="lm-historial-fila-label lm-historial-fila-label-ganado"><i class="ph ph-bold ph-check-circle"></i> ${t('lm.historial_ganados')}</span>
          <div class="lm-historial-track"><div class="lm-historial-fill lm-historial-fill-ganado" style="width:${pctBarra(h.ganados)}%"></div></div>
          <span class="lm-historial-num">${h.ganados}</span>
        </div>
        <div class="lm-historial-fila">
          <span class="lm-historial-fila-label lm-historial-fila-label-empatado"><i class="ph ph-bold ph-minus-circle"></i> ${t('lm.historial_empatados')}</span>
          <div class="lm-historial-track"><div class="lm-historial-fill lm-historial-fill-empatado" style="width:${pctBarra(h.empatados)}%"></div></div>
          <span class="lm-historial-num">${h.empatados}</span>
        </div>
        <div class="lm-historial-fila">
          <span class="lm-historial-fila-label lm-historial-fila-label-perdido"><i class="ph ph-bold ph-x-circle"></i> ${t('lm.historial_perdidos')}</span>
          <div class="lm-historial-track"><div class="lm-historial-fill lm-historial-fill-perdido" style="width:${pctBarra(h.perdidos)}%"></div></div>
          <span class="lm-historial-num">${h.perdidos}</span>
        </div>`}
        <button class="mode-card-btn mode-card-btn-gold" data-cerrar-historial style="margin-top:16px">${t('lm.cerrar')}</button>
      </div>`;
    document.body.appendChild(overlay);
    const cerrar=()=>overlay.remove();
    habilitarCierreOverlay(overlay, cerrar);
    overlay.querySelector('[data-cerrar-historial]').addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      cerrar();
    });
  }
  function abrirBoletoQuiniela(onCerrar){
    const boleto=state.quinielaBoleto;
    if(!boleto || boleto.rellenado){ if(typeof onCerrar==='function') onCerrar(); return; }
    const overlay=document.createElement('div');
    overlay.id='lmQuinielaOverlay';
    function pintar(){
      const todasRellenas=boleto.partidos.every(p=>boleto.predicciones[boleto.jornadaIndex+'-'+p.homeId+'-'+p.awayId]);
      overlay.innerHTML=`
        <div class="lm-dilemma-card lm-quiniela-card">
          ${xCerrarHTML()}
          <div class="lm-quiniela-header">
            <i class="ph ph-bold ph-ticket"></i>
            <div><div class="lm-quiniela-titulo">${t('lm.quiniela_titulo')} ${boleto.jornadaIndex+1}</div><div class="lm-quiniela-subtitulo">${t('lm.quiniela_subtitulo')}</div></div>
          </div>
          <div class="lm-quiniela-lista">
            ${boleto.partidos.map((p,i)=>{
              const key=boleto.jornadaIndex+'-'+p.homeId+'-'+p.awayId;
              const elegido=boleto.predicciones[key];
              // Blindaje final, en el propio pintado: si por lo que
              // sea los dos nombres coinciden exactos (con IDs
              // distintos), se distingue aquí mismo, en el momento de
              // mostrarlo — así es imposible que la interfaz llegue a
              // enseñar "X vs X", pase lo que pase con el dato de
              // origen o con cualquier reparación anterior.
              let nombreLocalMostrado=p.homeName, nombreVisitanteMostrado=p.awayName;
              if(p.homeName && p.awayName
                 && p.homeName.trim().toLowerCase()===p.awayName.trim().toLowerCase()){
                if(p.homeEsMio) nombreVisitanteMostrado=p.awayName.trim()+' (2)';
                else nombreLocalMostrado=p.homeName.trim()+' (2)';
              }
              return `<div class="lm-quiniela-fila">
                ${p.pista?`<div class="lm-quiniela-pista"><i class="ph ph-bold ph-lightbulb-filament"></i> ${t('lm.quiniela_pista_'+p.pista)}</div>`:''}
                <div class="lm-quiniela-equipo lm-quiniela-equipo-local">${quinielaEscudoHTML(p.homeEsMio, p.homeCrest, 26)}<span>${nombreLocalMostrado}</span><button class="lm-historial-info-btn" data-historial-equipo="${p.homeId}" data-historial-nombre="${nombreLocalMostrado.replace(/"/g,'&quot;')}" data-historial-crest="${p.homeCrest?p.homeCrest.replace(/"/g,'&quot;'):''}" title="${t('lm.tt_ver_historial')}"><i class="ph ph-bold ph-info"></i></button></div>
                <div class="lm-quiniela-opciones">
                  <button class="lm-quiniela-btn ${elegido==='1'?'lm-quiniela-btn-activa':''}" data-qk="${key}" data-qv="1">1</button>
                  <button class="lm-quiniela-btn ${elegido==='X'?'lm-quiniela-btn-activa':''}" data-qk="${key}" data-qv="X">X</button>
                  <button class="lm-quiniela-btn ${elegido==='2'?'lm-quiniela-btn-activa':''}" data-qk="${key}" data-qv="2">2</button>
                </div>
                <div class="lm-quiniela-equipo lm-quiniela-equipo-visitante"><button class="lm-historial-info-btn" data-historial-equipo="${p.awayId}" data-historial-nombre="${nombreVisitanteMostrado.replace(/"/g,'&quot;')}" data-historial-crest="${p.awayCrest?p.awayCrest.replace(/"/g,'&quot;'):''}" title="${t('lm.tt_ver_historial')}"><i class="ph ph-bold ph-info"></i></button><span>${nombreVisitanteMostrado}</span>${quinielaEscudoHTML(p.awayEsMio, p.awayCrest, 26)}</div>
              </div>`;
            }).join('')}
          </div>
          <div id="lmQuinielaAviso" class="lm-quiniela-aviso" style="display:none">${t('lm.quiniela_incompleta')}</div>
          <div class="lm-popup-actions">
            <button id="lmQuinielaAutoRellenar" class="mode-card-btn mode-card-btn-secondary"><i class="ph ph-bold ph-shuffle"></i> ${t('lm.quiniela_rellenar_auto_btn')}</button>
          </div>
          <div class="lm-popup-actions"><button id="lmQuinielaConfirmar" class="mode-card-btn mode-card-btn-gold">${t('lm.confirmar_quiniela')}</button></div>
        </div>`;
      const autoRellenarBtn=document.getElementById('lmQuinielaAutoRellenar');
      if(autoRellenarBtn) autoRellenarBtn.addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        // Rellena TODOS los partidos con una predicción al azar (1/X/2)
        // de golpe — no toca los que ya estuvieran elegidos a mano, se
        // sobrescriben igual que el resto, para que sea un "empezar de
        // cero al azar" claro y predecible.
        const opciones=['1','X','2'];
        boleto.partidos.forEach(p=>{
          const key=boleto.jornadaIndex+'-'+p.homeId+'-'+p.awayId;
          boleto.predicciones[key]=opciones[Math.floor(Math.random()*opciones.length)];
        });
        pintar();
      });
      overlay.querySelectorAll('[data-qk]').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          if(typeof window.playSound==='function') window.playSound('select');
          boleto.predicciones[btn.getAttribute('data-qk')]=btn.getAttribute('data-qv');
          pintar();
        });
      });
      overlay.querySelectorAll('[data-historial-equipo]').forEach(btn=>{
        btn.addEventListener('click', (e)=>{
          e.stopPropagation();
          if(typeof window.playSound==='function') window.playSound('select');
          mostrarHistorialEquipoQuiniela(
            btn.getAttribute('data-historial-equipo'),
            btn.getAttribute('data-historial-nombre'),
            btn.getAttribute('data-historial-crest')||null
          );
        });
      });
      const confirmar=document.getElementById('lmQuinielaConfirmar');
      if(confirmar) confirmar.addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        if(!todasRellenas){
          const aviso=document.getElementById('lmQuinielaAviso');
          if(aviso) aviso.style.display='block';
          return;
        }
        boleto.rellenado=true;
        guardarEstado();
        overlay.remove();
        render();
        if(typeof onCerrar==='function') onCerrar();
      });
      habilitarCierreOverlay(overlay, ()=>{
        overlay.remove();
        // Si se cierra sin haber terminado de rellenar el boletín
        // (por la X o tocando fuera), se avisa por correo de que
        // queda pendiente — antes este correo se enviaba SIEMPRE al
        // generarse el boletín, aunque el jugador lo rellenara ahí
        // mismo sin cerrar nada, lo cual no tenía sentido.
        if(!boleto.rellenado){
          enviarCorreo('directorGeneral', t('lm.correo_quiniela_asunto'), t('lm.correo_quiniela_cuerpo'),
            {asunto:'lm.correo_quiniela_asunto', cuerpo:'lm.correo_quiniela_cuerpo'});
          const ultimo=state.correoInterno && state.correoInterno[0];
          if(ultimo){ ultimo.tipoEspecial='quiniela_lista'; }
        }
        if(typeof onCerrar==='function') onCerrar();
      });
      const xBtn=overlay.querySelector('[data-cerrar-x]');
      if(xBtn) xBtn.addEventListener('click', ()=>{
        overlay.remove();
        if(!boleto.rellenado){
          enviarCorreo('directorGeneral', t('lm.correo_quiniela_asunto'), t('lm.correo_quiniela_cuerpo'),
            {asunto:'lm.correo_quiniela_asunto', cuerpo:'lm.correo_quiniela_cuerpo'});
          const ultimo=state.correoInterno && state.correoInterno[0];
          if(ultimo){ ultimo.tipoEspecial='quiniela_lista'; }
        }
        if(typeof onCerrar==='function') onCerrar();
      });
    }
    // A diferencia del resto de ventanas de Liga Manager (que se
    // añaden dentro de #ligaManagerScreen), esta se añade directamente
    // al body — cuando se abre desde el árbol de nodos, el propio
    // árbol dispara un render() 220ms después que reemplaza TODO el
    // contenido de #ligaManagerScreen, lo que borraba este popup nada
    // más abrirse si vivía ahí dentro.
    document.body.appendChild(overlay);
    pintar();
  }
  // Muestra el resultado de la quiniela (premio + rasgos) si hay uno
  // pendiente — se llama justo después de cerrar la ventana de
  // resultado del partido siguiente, tal como se pidió.
  function mostrarResolucionQuinielaSiToca(){
    const r=state.quinielaResultadoPendiente;
    if(!r) return;
    state.quinielaResultadoPendiente=null;
    guardarEstado();
    const overlay=document.createElement('div');
    overlay.id='lmQuinielaResultadoOverlay';
    const exito=r.aciertos/r.total>0.5;
    const jugadoresElegibles=(state.plantilla||[]);
    overlay.innerHTML=`
      <div class="lm-dilemma-card lm-quiniela-resultado-card">
        <div class="lm-quiniela-resultado-header ${exito?'lm-quiniela-resultado-exito':''}">
          <i class="ph ph-bold ph-ticket"></i>
          <div class="lm-quiniela-resultado-titulo">${t('lm.resultado_quiniela')}</div>
          <div class="lm-quiniela-resultado-aciertos">${r.aciertos}<span>/${r.total} ${t('lm.aciertos')}</span></div>
        </div>
        <div class="lm-quiniela-premio-box">
          <i class="ph ph-bold ph-coins"></i>
          <div><div class="lm-quiniela-premio-val">${formatoDinero(r.premio)}</div><div class="lm-quiniela-premio-label">${t('lm.premio_economico')}</div></div>
        </div>
        <div class="lm-quiniela-detalle-lista">
          ${r.detalle.map(d=>`
            <div class="lm-quiniela-detalle-fila ${d.acierto?'lm-quiniela-detalle-acierto':'lm-quiniela-detalle-fallo'}">
              <i class="ph ph-bold ${d.acierto?'ph-check-circle':'ph-x-circle'}"></i>
              <div class="lm-quiniela-detalle-equipos">
                <span class="lm-quiniela-detalle-equipo">${quinielaEscudoHTML(d.homeEsMio, d.homeCrest, 22)}${d.homeName}</span>
                <span class="lm-quiniela-detalle-vs">vs</span>
                <span class="lm-quiniela-detalle-equipo">${d.awayName}${quinielaEscudoHTML(d.awayEsMio, d.awayCrest, 22)}</span>
              </div>
              <div class="lm-quiniela-detalle-pronosticos">
                <span class="lm-quiniela-detalle-tu">${t('lm.quiniela_tu')}: <strong>${d.prediccion}</strong></span>
                <span class="lm-quiniela-detalle-real">${t('lm.quiniela_real')}: <strong>${d.real}</strong></span>
              </div>
            </div>`).join('')}
        </div>
        ${r.rasgosGanados.length?`
        <div class="lm-quiniela-rasgos-titulo"><i class="ph ph-bold ph-sparkle"></i> ${t('lm.mas_mitad_acertados')} ${r.rasgosGanados.length} ${r.rasgosGanados.length>1?t('lm.rasgos_plural'):t('lm.rasgo_singular')}</div>
        <div class="lm-quiniela-rasgos-lista">
          ${r.rasgosGanados.map((rid,i)=>{
            const def=rasgoDef(rid);
            return `<div class="lm-rasgo-card">
              <i class="ph ph-bold ${def.icon}"></i>
              <div class="lm-rasgo-card-nombre">${def.name}</div>
              <div class="lm-rasgo-card-desc">${def.desc}</div>
              <select class="lm-rasgo-select" data-rasgo-idx="${i}" data-rasgo-id="${rid}">
                <option value="">${t('lm.elige_jugador')}</option>
                ${jugadoresElegibles.map(p=>`<option value="${p.id}" ${p.rasgos&&p.rasgos.includes(rid)?'disabled':''}>${p.name}${p.rasgos&&p.rasgos.includes(rid)?' '+t('lm.ya_lo_tiene'):''}</option>`).join('')}
              </select>
            </div>`;
          }).join('')}
        </div>` : ''}
        <div class="lm-popup-actions"><button id="lmQuinielaResultadoCerrar" class="mode-card-btn mode-card-btn-gold">${t('lm.continuar')}</button></div>
      </div>`;
    document.getElementById('ligaManagerScreen').appendChild(overlay);
    overlay.querySelectorAll('.lm-rasgo-select').forEach(sel=>{
      sel.addEventListener('change', ()=>{
        if(sel.value){
          asignarRasgoJugador(sel.value, sel.getAttribute('data-rasgo-id'));
          if(typeof window.playSound==='function') window.playSound('select');
          Array.from(sel.options).forEach(o=>{ if(o.value===sel.value) o.textContent=o.textContent.replace(' (ya lo tiene)','')+' ✔'; });
          sel.disabled=true;
        }
      });
    });
    document.getElementById('lmQuinielaResultadoCerrar').addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      // Si ganó algún rasgo y todavía queda alguno sin asignar a un
      // jugador (su <select> sigue habilitado porque nunca se eligió
      // nada), avisar antes de cerrar de verdad — cerrando aquí sin más
      // ese rasgo se perdía en silencio, sin que el jugador se diera
      // cuenta de que se le había olvidado.
      const pendientes=overlay.querySelectorAll('.lm-rasgo-select:not(:disabled)').length;
      if(pendientes>0){
        mostrarAvisoRasgosSinAsignar(pendientes, ()=>{ overlay.remove(); render(); });
        return;
      }
      overlay.remove();
      render();
    });
  }
  // Aviso antes de cerrar la pantalla de resultado de la quiniela si
  // todavía queda algún rasgo ganado sin asignar a ningún jugador —
  // igual en espíritu al aviso de "quiniela sin rellenar", pero aquí lo
  // que está en juego es la recompensa ya ganada, no la propia quiniela.
  function mostrarAvisoRasgosSinAsignar(cantidad, confirmarCallback){
    const overlay=document.createElement('div');
    overlay.id='lmAvisoRasgosSinAsignarOverlay';
    const aviso = cantidad>1 ? tp('lm.rasgos_sin_asignar_aviso_plural', {n:cantidad}) : t('lm.rasgos_sin_asignar_aviso_singular');
    overlay.innerHTML=`
      <div class="lm-dilemma-card" style="max-width:400px">
        <div class="lm-dilemma-title"><i class="ph ph-bold ph-sparkle"></i>${t('lm.rasgos_sin_asignar_titulo')}</div>
        <div class="lm-dilemma-text" style="margin:10px 0 16px">${aviso}</div>
        <div class="lm-popup-actions lm-popup-actions-compact">
          <button id="lmAvisoRasgosContinuar" class="mode-card-btn mode-card-btn-secondary">${t('lm.continuar_sin_asignar_btn')}</button>
          <button id="lmAvisoRasgosVolver" class="mode-card-btn mode-card-btn-gold">${t('lm.volver_a_elegir_btn')}</button>
        </div>
      </div>`;
    document.getElementById('ligaManagerScreen').appendChild(overlay);
    const cerrar=()=>overlay.remove();
    habilitarCierreOverlay(overlay, cerrar);
    document.getElementById('lmAvisoRasgosVolver').addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      cerrar();
    });
    document.getElementById('lmAvisoRasgosContinuar').addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      cerrar();
      confirmarCallback();
    });
  }
  // ---- Sistema de mejoras (GOAT Points) de Liga Manager ----
  // Comparte la MISMA moneda que Copa Leyendas (scratchPoints, en
  // Firestore users/{uid}) pero los niveles comprados se guardan por
  // separado (users/{uid}.ligaManagerUpgrades) — gastar puntos aquí no
  // añade ni quita niveles a las mejoras de Copa Leyendas, y viceversa.
  const LM_UPGRADE_DEFS=[
    {id:'lm_bench', phIcon:'ph-users-three', get name(){return t('mejora.bench.nombre');}, get desc(){return t('mejora.bench.desc');},
      baseCost:5, maxLevel:5, baseValue:5, tooltip:(lvl)=>t('mejora.bench.tooltip').replace('{n}', 5+lvl)},
    {id:'lm_dice', phIcon:'ph-dice-five', get name(){return t('mejora.dice.nombre');}, get desc(){return t('mejora.dice.desc');},
      baseCost:5, maxLevel:5, baseValue:5, tooltip:(lvl)=>t('mejora.dice.tooltip').replace('{n}', 5+lvl)},
    {id:'lm_rerolls', phIcon:'ph-arrows-clockwise', get name(){return t('mejora.rerolls.nombre');}, get desc(){return t('mejora.rerolls.desc');},
      baseCost:5, maxLevel:5, baseValue:1, tooltip:(lvl)=>t('mejora.rerolls.tooltip').replace('{n}', 1+lvl).replace('{s}', lvl?'s':'')},
    {id:'lm_cardswap', phIcon:'ph-cards', get name(){return t('mejora.cardswap.nombre');}, get desc(){return t('mejora.cardswap.desc');},
      baseCost:5, maxLevel:3, baseValue:1, tooltip:(lvl)=>t('mejora.cardswap.tooltip').replace('{n}', 1+lvl).replace('{s}', lvl>0?'s':'')},
    {id:'lm_sobredescuento', phIcon:'ph-percent', get name(){return t('mejora.sobredescuento.nombre');}, get desc(){return t('mejora.sobredescuento.desc');},
      baseCost:5, maxLevel:5, baseValue:0, tooltip:(lvl)=>lvl===0?t('mejora.sin_descuento'):t('mejora.sobredescuento.tooltip').replace('{n}', lvl*10)},
    {id:'lm_girotactico', phIcon:'ph-notebook', get name(){return t('mejora.girotactico.nombre');}, get desc(){return t('mejora.girotactico.desc');},
      baseCost:5, maxLevel:5, baseValue:5, tooltip:(lvl)=>t('mejora.girotactico.tooltip').replace('{n}', 5+lvl)},
  ];
  function lmUpgradeLevelCost(def, toLevel){ return def.baseCost*Math.pow(2, toLevel-1); }
  function lmNivelMejora(id){ return (window._lmUpgradeCache && window._lmUpgradeCache[id]) || 0; }
  function lmMaxBanquillo(){ return LM_UPGRADE_DEFS[0].baseValue + lmNivelMejora('lm_bench'); }
  function lmDicePoolPorPartido(){ return LM_UPGRADE_DEFS[1].baseValue + lmNivelMejora('lm_dice'); }
  function lmRerollsPorPartido(){ return LM_UPGRADE_DEFS[2].baseValue + lmNivelMejora('lm_rerolls'); }
  function lmCambiosCartaPorPartido(){ return LM_UPGRADE_DEFS[3].baseValue + lmNivelMejora('lm_cardswap'); }
  function lmDescuentoSobres(){ return lmNivelMejora('lm_sobredescuento')*0.10; } // 0, .10, .20, .30, .40, .50
  // Usos de Giro Táctico disponibles por CADA media temporada (19
  // jornadas): 5 de base, +1 por cada nivel de la mejora "Plan de
  // Giro Táctico" comprada aquí mismo, con puntos desde el menú de
  // perfil — igual que el resto de mejoras de Liga Manager, nunca una
  // carta del Director General.
  function getMaxGiroTacticoLM(){ return 5 + lmNivelMejora('lm_girotactico') + (lmSkillActiva('lm_ultimo_cartucho')?1:0); }
  async function lmCargarUpgradeCache(){
    try{
      const user=window._fbAuth && window._fbAuth.currentUser;
      if(!user){ window._lmUpgradeCache={}; return; }
      const snap=await window._fbDb.collection('users').doc(user.uid).get();
      const data=snap.exists?snap.data():{};
      window._lmUpgradeCache=data.ligaManagerUpgrades||{};
      window._lmScratchPoints=data.scratchPoints||0;
    }catch(e){ window._lmUpgradeCache=window._lmUpgradeCache||{}; }
  }
  // Evita el salto de scroll al principio que ocurría cada vez que se
  // pulsaba un botón en las pestañas de mejoras/logros/habilidades del
  // perfil: al vaciar la lista para mostrar "Cargando..." antes de
  // reconstruirla, el contenedor se quedaba momentáneamente muy bajo
  // de altura y el navegador recortaba el scroll a 0 — al reconstruir
  // el contenido completo, esa posición ya no se restauraba sola.
  // Aquí se guarda el scroll del panel ANTES y se reaplica DESPUÉS.
  async function reRenderPanelConservandoScroll(paneId, renderFn){
    const pane=document.getElementById(paneId);
    const scrollPrevio=pane?pane.scrollTop:0;
    await renderFn();
    if(pane) pane.scrollTop=scrollPrevio;
  }
  async function renderLigaManagerUpgradesTab(){
    await reRenderPanelConservandoScroll('lmProfileUpgradesPane', renderLigaManagerUpgradesTabImpl);
  }
  async function renderLigaManagerUpgradesTabImpl(){
    const list=document.getElementById('lmUpgradesList');
    const pointsEl=document.getElementById('lmUpgradePointsDisplay');
    if(!list) return;
    list.innerHTML=`<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:12px">${t('lm.cargando')}</div>`;
    await lmCargarUpgradeCache();
    const user=window._fbAuth && window._fbAuth.currentUser;
    if(!user){
      list.innerHTML=`<div style="text-align:center;padding:20px;color:var(--text-muted)">${t('lm.inicia_sesion_mejoras')}</div>`;
      return;
    }
    let currentPts=window._lmScratchPoints||0;
    if(pointsEl) pointsEl.textContent=currentPts;
    list.innerHTML='';
    LM_UPGRADE_DEFS.forEach(def=>{
      const currentLevel=lmNivelMejora(def.id);
      const nextCost=currentLevel<def.maxLevel ? lmUpgradeLevelCost(def, currentLevel+1) : null;
      const prevRefund=currentLevel>0 ? lmUpgradeLevelCost(def, currentLevel) : null;
      const canUpgrade=nextCost!==null && currentPts>=nextCost;
      const canDowngrade=currentLevel>0;
      const bars=Array.from({length:def.maxLevel},(_,i)=>`<div class="upgrade-bar ${i<currentLevel?'filled':''}"></div>`).join('');
      const costHtml=nextCost!==null ? `<span class="cost-star">★</span>${nextCost}` : `<span style="font-size:9px;color:var(--text-muted);letter-spacing:1px">MAX</span>`;
      const row=document.createElement('div');
      row.className='upgrade-row';
      row.id=`lm-upgrade-row-${def.id}`;
      row.innerHTML=`
        <div class="upgrade-row-top">
          <div class="upgrade-icon" style="color:var(--accent);font-size:22px;display:flex;align-items:center;justify-content:center"><i class="ph ph-bold ${def.phIcon}"></i></div>
          <div class="upgrade-label-block">
            <div class="upgrade-name">${def.name}</div>
            <div class="upgrade-desc">${def.desc}</div>
          </div>
          <div class="upgrade-value-pill">${def.tooltip(currentLevel)}</div>
        </div>
        <div class="upgrade-row-bottom">
          <div class="upgrade-bars">${bars}</div>
          <div class="upgrade-controls">
            <div class="upgrade-cost-badge">${costHtml}</div>
            <button class="upgrade-btn minus" data-lmid="${def.id}" title="Recuperar ${prevRefund||0} pts" ${canDowngrade?'':'disabled'}>−</button>
            <button class="upgrade-btn plus" data-lmid="${def.id}" title="Coste: ${nextCost||0} pts" ${canUpgrade?'':'disabled'}>+</button>
          </div>
        </div>`;
      list.appendChild(row);
    });
    list.querySelectorAll('.upgrade-btn').forEach(btn=>{
      btn.addEventListener('click', async ()=>{
        const id=btn.getAttribute('data-lmid');
        const def=LM_UPGRADE_DEFS.find(d=>d.id===id);
        if(!def) return;
        const currentLevel=lmNivelMejora(id);
        const esCompra=btn.classList.contains('plus');
        if(typeof window.playSound==='function') window.playSound('select');
        if(esCompra){
          if(currentLevel>=def.maxLevel) return;
          const cost=lmUpgradeLevelCost(def, currentLevel+1);
          if((window._lmScratchPoints||0)<cost) return;
          window._lmUpgradeCache[id]=currentLevel+1;
          window._lmScratchPoints=(window._lmScratchPoints||0)-cost;
          if(typeof window.unlockLMAchievement==='function') window.unlockLMAchievement('lm_first_upgrade', false);
        } else {
          if(currentLevel<=0) return;
          const refund=lmUpgradeLevelCost(def, currentLevel);
          window._lmUpgradeCache[id]=currentLevel-1;
          window._lmScratchPoints=(window._lmScratchPoints||0)+refund;
        }
        try{
          const u=window._fbAuth && window._fbAuth.currentUser;
          if(u) await window._fbDb.collection('users').doc(u.uid).set({ligaManagerUpgrades:window._lmUpgradeCache, scratchPoints:window._lmScratchPoints}, {merge:true});
        }catch(e){}
        renderLigaManagerUpgradesTab();
      });
    });
  }
  window.renderLigaManagerUpgradesTab = renderLigaManagerUpgradesTab;

  // ---- Logros de Liga Manager ----
  // Catálogo propio (no comparte progreso con los de Copa Leyendas),
  // pero desbloquearlos SÍ suma a los mismos GOAT Points compartidos.
  const LM_TIER_COLOR={'básico':'#7bbf7b','intermedio':'#5b9bd5','difícil':'#c9a227','mítico':'#e67e22'};
  const LM_ACHIEVEMENT_DEFS=[
    {id:'lm_first_match',    tier:'básico', pts:1, icon:'ph-megaphone',      get name(){return t('lmach.first_match.nombre');}, get desc(){return t('lmach.first_match.desc');}},
    {id:'lm_first_win',      tier:'básico', pts:1, icon:'ph-trophy',         get name(){return t('lmach.first_win.nombre');}, get desc(){return t('lmach.first_win.desc');}},
    {id:'lm_first_sobre',    tier:'básico', pts:1, icon:'ph-envelope-open',  get name(){return t('lmach.first_sobre.nombre');}, get desc(){return t('lmach.first_sobre.desc');}},
    {id:'lm_first_sale',     tier:'básico', pts:1, icon:'ph-handshake',      get name(){return t('lmach.first_sale.nombre');}, get desc(){return t('lmach.first_sale.desc');}},
    {id:'lm_first_worker',   tier:'básico', pts:1, icon:'ph-user-plus',      get name(){return t('lmach.first_worker.nombre');}, get desc(){return t('lmach.first_worker.desc');}},
    {id:'lm_clean_sheet',    tier:'básico', pts:1, icon:'ph-shield-check',   get name(){return t('lmach.clean_sheet.nombre');}, get desc(){return t('lmach.clean_sheet.desc');}},
    {id:'lm_win_streak_3',   tier:'intermedio', pts:2, icon:'ph-trend-up',   get name(){return t('lmach.win_streak_3.nombre');}, get desc(){return t('lmach.win_streak_3.desc');}},
    {id:'lm_star_signing',   tier:'intermedio', pts:2, icon:'ph-star',       get name(){return t('lmach.star_signing.nombre');}, get desc(){return t('lmach.star_signing.desc');}},
    {id:'lm_top4',           tier:'intermedio', pts:2, icon:'ph-medal',      get name(){return t('lmach.top4.nombre');}, get desc(){return t('lmach.top4.desc');}},
    {id:'lm_win_10',         tier:'intermedio', pts:2, icon:'ph-soccer-ball', get name(){return t('lmach.win_10.nombre');}, get desc(){return t('lmach.win_10.desc');}},
    {id:'lm_season_complete',tier:'difícil', pts:3, icon:'ph-flag-checkered', get name(){return t('lmach.season_complete.nombre');}, get desc(){return t('lmach.season_complete.desc');}},
    {id:'lm_champion',       tier:'mítico', pts:5, icon:'ph-crown',          get name(){return t('lmach.champion.nombre');}, get desc(){return t('lmach.champion.desc');}},
    // --- Nuevos (esta ronda): 24 logros más, triplicando el total ---
    {id:'lm_first_goal',     tier:'básico', pts:1, icon:'ph-soccer-ball',    get name(){return t('lmach.first_goal.nombre');}, get desc(){return t('lmach.first_goal.desc');}},
    {id:'lm_first_defeat',   tier:'básico', pts:1, icon:'ph-thumbs-down',    get name(){return t('lmach.first_defeat.nombre');}, get desc(){return t('lmach.first_defeat.desc');}},
    {id:'lm_first_draw',     tier:'básico', pts:1, icon:'ph-equals',         get name(){return t('lmach.first_draw.nombre');}, get desc(){return t('lmach.first_draw.desc');}},
    {id:'lm_first_injury',   tier:'básico', pts:1, icon:'ph-first-aid-kit',  get name(){return t('lmach.first_injury.nombre');}, get desc(){return t('lmach.first_injury.desc');}},
    {id:'lm_first_upgrade',  tier:'básico', pts:1, icon:'ph-trend-up',       get name(){return t('lmach.first_upgrade.nombre');}, get desc(){return t('lmach.first_upgrade.desc');}},
    {id:'lm_first_training', tier:'básico', pts:1, icon:'ph-barbell',        get name(){return t('lmach.first_training.nombre');}, get desc(){return t('lmach.first_training.desc');}},
    {id:'lm_first_quiniela', tier:'básico', pts:1, icon:'ph-ticket',         get name(){return t('lmach.first_quiniela.nombre');}, get desc(){return t('lmach.first_quiniela.desc');}},
    {id:'lm_first_sponsor',  tier:'básico', pts:1, icon:'ph-handshake',      get name(){return t('lmach.first_sponsor.nombre');}, get desc(){return t('lmach.first_sponsor.desc');}},
    {id:'lm_5_wins',         tier:'intermedio', pts:2, icon:'ph-fire',       get name(){return t('lmach.5_wins.nombre');}, get desc(){return t('lmach.5_wins.desc');}},
    {id:'lm_10_goals',       tier:'intermedio', pts:2, icon:'ph-target',     get name(){return t('lmach.10_goals.nombre');}, get desc(){return t('lmach.10_goals.desc');}},
    {id:'lm_no_injuries_month', tier:'intermedio', pts:2, icon:'ph-heart',   get name(){return t('lmach.no_injuries_month.nombre');}, get desc(){return t('lmach.no_injuries_month.desc');}},
    {id:'lm_full_stadium',   tier:'intermedio', pts:2, icon:'ph-users-three',    get name(){return t('lmach.full_stadium.nombre');}, get desc(){return t('lmach.full_stadium.desc');}},
    {id:'lm_quiniela_streak', tier:'intermedio', pts:2, icon:'ph-brain',     get name(){return t('lmach.quiniela_streak.nombre');}, get desc(){return t('lmach.quiniela_streak.desc');}},
    {id:'lm_5_signings',     tier:'intermedio', pts:2, icon:'ph-arrows-left-right', get name(){return t('lmach.5_signings.nombre');}, get desc(){return t('lmach.5_signings.desc');}},
    {id:'lm_max_level_dept', tier:'intermedio', pts:2, icon:'ph-graduation-cap', get name(){return t('lmach.max_level_dept.nombre');}, get desc(){return t('lmach.max_level_dept.desc');}},
    {id:'lm_positive_balance', tier:'intermedio', pts:2, icon:'ph-bank',     get name(){return t('lmach.positive_balance.nombre');}, get desc(){return t('lmach.positive_balance.desc');}},
    {id:'lm_undefeated_5',   tier:'difícil', pts:3, icon:'ph-shield-check',   get name(){return t('lmach.undefeated_5.nombre');}, get desc(){return t('lmach.undefeated_5.desc');}},
    {id:'lm_all_departments', tier:'difícil', pts:3, icon:'ph-users-three',  get name(){return t('lmach.all_departments.nombre');}, get desc(){return t('lmach.all_departments.desc');}},
    {id:'lm_stadium_max',    tier:'difícil', pts:3, icon:'ph-buildings',     get name(){return t('lmach.stadium_max.nombre');}, get desc(){return t('lmach.stadium_max.desc');}},
    {id:'lm_20_wins',        tier:'difícil', pts:3, icon:'ph-trophy',        get name(){return t('lmach.20_wins.nombre');}, get desc(){return t('lmach.20_wins.desc');}},
    {id:'lm_top_half',       tier:'difícil', pts:3, icon:'ph-chart-bar',     get name(){return t('lmach.top_half.nombre');}, get desc(){return t('lmach.top_half.desc');}},
    {id:'lm_all_skills',     tier:'difícil', pts:3, icon:'ph-lightning',     get name(){return t('lmach.all_skills.nombre');}, get desc(){return t('lmach.all_skills.desc');}},
    {id:'lm_perfect_season', tier:'mítico', pts:5, icon:'ph-sparkle',        get name(){return t('lmach.perfect_season.nombre');}, get desc(){return t('lmach.perfect_season.desc');}},
    {id:'lm_dynasty',        tier:'mítico', pts:5, icon:'ph-medal-military',   get name(){return t('lmach.dynasty.nombre');}, get desc(){return t('lmach.dynasty.desc');}},
    // --- Nuevos (esta ronda): ligados al Giro Táctico y a momentos
    // dramáticos de partido que antes no tenían ningún logro asociado.
    {id:'lm_giro_primera_vez', tier:'básico', pts:1, icon:'ph-arrows-clockwise', get name(){return t('lmach.giro_primera_vez.nombre');}, get desc(){return t('lmach.giro_primera_vez.desc');}},
    {id:'lm_giro_remontada', tier:'intermedio', pts:2, icon:'ph-arrow-u-up-left', get name(){return t('lmach.giro_remontada.nombre');}, get desc(){return t('lmach.giro_remontada.desc');}},
    {id:'lm_giro_agotado',   tier:'intermedio', pts:2, icon:'ph-battery-warning', get name(){return t('lmach.giro_agotado.nombre');}, get desc(){return t('lmach.giro_agotado.desc');}},
    {id:'lm_gol_ultimo_minuto', tier:'intermedio', pts:2, icon:'ph-clock-countdown', get name(){return t('lmach.gol_ultimo_minuto.nombre');}, get desc(){return t('lmach.gol_ultimo_minuto.desc');}},
    {id:'lm_canterano_joya', tier:'intermedio', pts:2, icon:'ph-diamond', get name(){return t('lmach.canterano_joya.nombre');}, get desc(){return t('lmach.canterano_joya.desc');}},
    {id:'lm_fenix_liga',     tier:'difícil', pts:3, icon:'ph-fire-simple', get name(){return t('lmach.fenix_liga.nombre');}, get desc(){return t('lmach.fenix_liga.desc');}},
    {id:'lm_giro_leyenda',   tier:'mítico', pts:5, icon:'ph-crown-simple', get name(){return t('lmach.giro_leyenda.nombre');}, get desc(){return t('lmach.giro_leyenda.desc');}},
  ];
  async function unlockLMAchievement(id, mostrarInmediatamente){
    if(mostrarInmediatamente===undefined) mostrarInmediatamente=true;
    if(!window._lmAchievementsCache) window._lmAchievementsCache=new Set();
    if(window._lmAchievementsCache.has(id)) return;
    const user=window._fbAuth && window._fbAuth.currentUser;
    if(!user) return;
    const def=LM_ACHIEVEMENT_DEFS.find(a=>a.id===id);
    if(!def) return;
    window._lmAchievementsCache.add(id);
    try{
      const snap=await window._fbDb.collection('users').doc(user.uid).get();
      const d=snap.exists?snap.data():{};
      const current=d.ligaManagerAchievements||[];
      if(current.includes(id)) return;
      const newPts=(d.scratchPoints||0)+def.pts;
      await window._fbDb.collection('users').doc(user.uid).set({
        ligaManagerAchievements:[...current,id],
        scratchPoints:newPts,
        scratchPointsEarned:(d.scratchPointsEarned||0)+def.pts
      },{merge:true});
      window._lmScratchPoints=newPts;
      if(mostrarInmediatamente){
        if(typeof window.showAchievementToast==='function') window.showAchievementToast(def);
      } else {
        if(!window._lmLogrosParaMostrar) window._lmLogrosParaMostrar=[];
        window._lmLogrosParaMostrar.push(def);
      }
      const lab=document.getElementById('lmAchievementsBadge');
      if(lab) lab.style.display='inline-block';
    }catch(e){ console.warn('LM achievement error:', e); }
  }
  window.unlockLMAchievement = unlockLMAchievement;
  // Expuesta globalmente para que liga-manager-partido-visor.js (otro
  // archivo) pueda consultar habilidades activas al ofrecer el Giro
  // Táctico — mismo patrón que unlockLMAchievement, justo arriba.
  window.lmSkillActiva = lmSkillActiva;
  // Los logros conseguidos DURANTE la simulación de un partido no se
  // muestran al instante (podrían chivar el resultado antes de que el
  // jugador vea la animación) — se guardan en cola y se sueltan aquí,
  // justo después de cerrar la ventana de resultado del partido.
  function mostrarLogrosPendientes(){
    const pendientes=window._lmLogrosParaMostrar;
    if(!pendientes || !pendientes.length) return;
    window._lmLogrosParaMostrar=[];
    pendientes.forEach((def,i)=>{
      setTimeout(()=>{
        if(typeof window.showAchievementToast==='function') window.showAchievementToast(def);
      }, i*1400);
    });
  }
  async function renderLigaManagerAchievementsTab(){
    await reRenderPanelConservandoScroll('lmProfileAchievementsPane', renderLigaManagerAchievementsTabImpl);
  }
  async function renderLigaManagerAchievementsTabImpl(){
    const list=document.getElementById('lmAchievementsList');
    if(!list) return;
    list.innerHTML=`<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:12px">${t('lm.cargando')}</div>`;
    const user=window._fbAuth && window._fbAuth.currentUser;
    if(!user){ list.innerHTML=`<div style="text-align:center;padding:20px;color:var(--text-muted)">${t('lm.inicia_sesion_logros')}</div>`; return; }
    const snap=await window._fbDb.collection('users').doc(user.uid).get();
    const unlocked=new Set((snap.exists && snap.data().ligaManagerAchievements)||[]);
    window._lmAchievementsCache=unlocked;
    const total=LM_ACHIEVEMENT_DEFS.length;
    const done=[...unlocked].filter(id=>LM_ACHIEVEMENT_DEFS.find(a=>a.id===id)).length;
    const countBadge=document.getElementById('lmAchievementsCountDisplay');
    if(countBadge) countBadge.textContent=`${done}/${total}`;
    list.innerHTML='';
    list.style.paddingRight='12px';
    const progress=document.createElement('div');
    progress.style.cssText='display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;font-family:"Bebas Neue",Impact,sans-serif';
    progress.innerHTML=`<span style="font-size:13px;color:var(--text-muted);letter-spacing:1px">${done} / ${total} LOGROS</span>
      <span style="font-size:13px;color:var(--gold)">${LM_ACHIEVEMENT_DEFS.filter(a=>unlocked.has(a.id)).reduce((s,a)=>s+a.pts,0)} PTS GANADOS</span>`;
    list.appendChild(progress);
    const resetBtn=document.createElement('button');
    resetBtn.textContent='REINICIAR MIS LOGROS';
    resetBtn.style.cssText='display:block;margin:0 0 12px;padding:6px 10px;font-size:10px;letter-spacing:1px;background:transparent;border:1px solid var(--line);color:var(--text-muted);cursor:pointer;font-family:"Bebas Neue",Impact,sans-serif';
    resetBtn.addEventListener('click', async ()=>{
      if(!confirm('¿Seguro que quieres reiniciar todos tus logros de Liga Manager? Los puntos ya ganados no se descuentan, solo se vuelve a marcar todo como bloqueado.')) return;
      try{
        await window._fbDb.collection('users').doc(user.uid).set({ligaManagerAchievements:[]}, {merge:true});
        window._lmAchievementsCache=new Set();
        renderLigaManagerAchievementsTab();
      }catch(e){ console.error(e); }
    });
    list.appendChild(resetBtn);
    const grid=document.createElement('div');
    grid.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:6px;padding-right:4px';
    list.appendChild(grid);
    LM_ACHIEVEMENT_DEFS.forEach(def=>{
      const isUnlocked=unlocked.has(def.id);
      const isLight=document.body.classList.contains('light-theme');
      const card=document.createElement('div');
      const lockedBg=isLight?'#ede8df':'#1a1e20';
      const unlockedBg=isLight?'#e8f4ec':'rgba(0,0,0,.3)';
      const borderColor=isUnlocked?LM_TIER_COLOR[def.tier]:(isLight?'#d4cec4':'var(--line)');
      card.style.cssText='display:flex;align-items:center;gap:10px;padding:10px;border:1px solid '+borderColor+';background:'+(isUnlocked?unlockedBg:lockedBg)+';position:relative;overflow:hidden';
      const iconColor=isUnlocked?'#c9a227':(isLight?'#bbb':'var(--text-muted)');
      const iconHtml='<i class="ph ph-bold '+def.icon+'" style="font-size:26px;flex-shrink:0;color:'+iconColor+';'+(isUnlocked?'':' opacity:.5')+'"></i>';
      const checkHtml=isUnlocked?'<i class="ph ph-bold ph-check" style="position:absolute;top:5px;right:6px;font-size:12px;color:'+(LM_TIER_COLOR[def.tier]||'#c9a227')+'"></i>':'';
      const tierColor=LM_TIER_COLOR[def.tier]||'#aaa';
      const nameColor=isUnlocked?(isLight?'#1a1a1a':'#fff'):(isLight?'#333':'var(--text-muted)');
      const descColor=isUnlocked?(isLight?'#444':'#aaa'):(isLight?'#666':'var(--text-muted)');
      card.innerHTML=iconHtml+checkHtml+
        '<div style="min-width:0;flex:1">'+
        '<div style="font-size:12px;letter-spacing:.8px;color:'+nameColor+';line-height:1.2;font-weight:700">'+def.name+'</div>'+
        '<div style="font-size:11px;color:'+descColor+';line-height:1.4;margin-top:2px">'+def.desc+'</div>'+
        '<div style="font-size:9px;color:'+tierColor+';letter-spacing:1px;margin-top:3px">'+t('lmach.tier.'+def.tier)+'</div>'+
        '</div>';
      grid.appendChild(card);
    });
    const lab=document.getElementById('lmAchievementsBadge');
    if(lab) lab.style.display='none';
  }
  window.renderLigaManagerAchievementsTab = renderLigaManagerAchievementsTab;

  // ---- Habilidades de Liga Manager ----
  // Se activan/desactivan (no tienen niveles), igual que en Copa
  // Leyendas — comparten la misma moneda (scratchPoints) pero se
  // guardan en un campo propio (ligaManagerSkills) que no interfiere
  // con las habilidades de Copa Leyendas.
  const LM_SKILL_DEFS=[
    {id:'lm_mentalidad_ganadora', get category(){return t('skill.categoria_tactica');}, get name(){return t('skill.mentalidad_ganadora.nombre');}, cost:35, phIcon:'ph-trend-up',
      get tooltip(){return t('skill.mentalidad_ganadora.tooltip');}},
    {id:'lm_revancha', get category(){return t('skill.categoria_tactica');}, get name(){return t('skill.revancha.nombre');}, cost:35, phIcon:'ph-arrow-clockwise',
      get tooltip(){return t('skill.revancha.tooltip');}},
    {id:'lm_factor_campo', get category(){return t('skill.categoria_tactica');}, get name(){return t('skill.factor_campo.nombre');}, cost:30, phIcon:'ph-house',
      get tooltip(){return t('skill.factor_campo.tooltip');}},
    {id:'lm_meteorologo', get category(){return t('skill.categoria_gestion');}, get name(){return t('skill.meteorologo.nombre');}, cost:30, phIcon:'ph-cloud-sun',
      get tooltip(){return t('skill.meteorologo.tooltip');}},
    {id:'lm_temple_competitivo', get category(){return t('skill.categoria_gestion');}, get name(){return t('skill.temple_competitivo.nombre');}, cost:30, phIcon:'ph-shield-star',
      get tooltip(){return t('skill.temple_competitivo.tooltip');}},
    {id:'lm_contraataque_letal', get category(){return t('skill.categoria_gestion');}, get name(){return t('skill.contraataque_letal.nombre');}, cost:35, phIcon:'ph-lightning',
      get tooltip(){return t('skill.contraataque_letal.tooltip');}},
    // --- Nuevas (esta ronda): 6 habilidades más, doblando el total.
    // Categoría propia "Apoyo al cuerpo técnico" — a propósito, para
    // que quede claro que complementan a cada departamento, nunca lo
    // sustituyen ni lo eclipsan.
    {id:'lm_ojo_clinico', get category(){return t('skill.categoria_apoyo');}, get name(){return t('skill.ojo_clinico.nombre');}, cost:30, phIcon:'ph-binoculars',
      get tooltip(){return t('skill.ojo_clinico.tooltip');}},
    {id:'lm_negociador_nato', get category(){return t('skill.categoria_apoyo');}, get name(){return t('skill.negociador_nato.nombre');}, cost:30, phIcon:'ph-handshake',
      get tooltip(){return t('skill.negociador_nato.tooltip');}},
    {id:'lm_manos_de_seda', get category(){return t('skill.categoria_apoyo');}, get name(){return t('skill.manos_de_seda.nombre');}, cost:30, phIcon:'ph-first-aid-kit',
      get tooltip(){return t('skill.manos_de_seda.tooltip');}},
    {id:'lm_discurso_motivador', get category(){return t('skill.categoria_apoyo');}, get name(){return t('skill.discurso_motivador.nombre');}, cost:30, phIcon:'ph-megaphone',
      get tooltip(){return t('skill.discurso_motivador.tooltip');}},
    {id:'lm_vigilancia_extra', get category(){return t('skill.categoria_apoyo');}, get name(){return t('skill.vigilancia_extra.nombre');}, cost:25, phIcon:'ph-shield-checkered',
      get tooltip(){return t('skill.vigilancia_extra.tooltip');}},
    {id:'lm_gestion_vestuario', get category(){return t('skill.categoria_apoyo');}, get name(){return t('skill.gestion_del_vestuario.nombre');}, cost:35, phIcon:'ph-users-three',
      get tooltip(){return t('skill.gestion_del_vestuario.tooltip');}},
    // --- Nuevas (esta ronda): ligadas al Giro Táctico, categoría
    // propia para que quede claro que giran en torno al descanso.
    {id:'lm_lectura_partido', get category(){return t('skill.categoria_giro');}, get name(){return t('skill.lectura_partido.nombre');}, cost:30, phIcon:'ph-eye',
      get tooltip(){return t('skill.lectura_partido.tooltip');}},
    {id:'lm_ultimo_cartucho', get category(){return t('skill.categoria_giro');}, get name(){return t('skill.ultimo_cartucho.nombre');}, cost:35, phIcon:'ph-battery-charging',
      get tooltip(){return t('skill.ultimo_cartucho.tooltip');}},
    {id:'lm_ojeador_estrella', get category(){return t('skill.categoria_giro');}, get name(){return t('skill.ojeador_estrella.nombre');}, cost:30, phIcon:'ph-binoculars',
      get tooltip(){return t('skill.ojeador_estrella.tooltip');}},
    {id:'lm_mano_dura', get category(){return t('skill.categoria_giro');}, get name(){return t('skill.mano_dura.nombre');}, cost:25, phIcon:'ph-hand-palm',
      get tooltip(){return t('skill.mano_dura.tooltip');}},
  ];
  async function lmCargarSkillsCache(){
    try{
      const user=window._fbAuth && window._fbAuth.currentUser;
      if(!user){ window._lmSkillsCache={}; return; }
      const snap=await window._fbDb.collection('users').doc(user.uid).get();
      const data=snap.exists?snap.data():{};
      window._lmSkillsCache=data.ligaManagerSkills||{};
    }catch(e){ window._lmSkillsCache=window._lmSkillsCache||{}; }
  }
  function lmSkillActiva(id){ return !!(window._lmSkillsCache && window._lmSkillsCache[id]); }
  async function renderLigaManagerSkillsTab(omitirRecarga){
    await reRenderPanelConservandoScroll('lmProfileNotesPane', ()=>renderLigaManagerSkillsTabImpl(omitirRecarga));
  }
  async function renderLigaManagerSkillsTabImpl(omitirRecarga){
    const list=document.getElementById('lmSkillsList');
    const pointsEl=document.getElementById('lmSkillPointsDisplay');
    if(!list) return;
    if(!list.children.length) list.innerHTML=`<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:12px">${t('lm.cargando')}</div>`;
    const user=window._fbAuth && window._fbAuth.currentUser;
    if(!user){ list.innerHTML=`<div style="text-align:center;padding:20px;color:var(--text-muted)">${t('lm.inicia_sesion_habilidades')}</div>`; return; }
    // Justo después de pulsar una habilidad, window._lmSkillsCache ya
    // tiene el estado correcto en memoria (se acaba de cambiar ahí
    // mismo) — recargarlo de Firestore en ese momento podía crear una
    // condición de carrera real: si la lectura llegaba antes de que
    // la escritura se hubiera asentado del todo, devolvía el estado
    // VIEJO y deshacía visualmente el cambio que se acababa de hacer
    // (la habilidad activada parecía no desactivarse nunca, y
    // viceversa). Se omite esa recarga en ese caso concreto —
    // sí se recarga de verdad la primera vez que se abre la pestaña.
    if(!omitirRecarga) await lmCargarSkillsCache();
    let pts=window._lmScratchPoints;
    if(pts===undefined){
      const snap=await window._fbDb.collection('users').doc(user.uid).get();
      pts=(snap.exists?snap.data().scratchPoints:0)||0;
      window._lmScratchPoints=pts;
    }
    if(pointsEl) pointsEl.textContent=pts;
    list.innerHTML='';
    list.style.overflowX='hidden';
    list.style.width='100%';
    list.style.paddingRight='12px';
    const categorias=[...new Set(LM_SKILL_DEFS.map(d=>d.category))];
    categorias.forEach(cat=>{
      const label=document.createElement('div');
      label.style.cssText='font-family:"Bebas Neue",Impact,sans-serif;font-size:11px;letter-spacing:2px;color:var(--text-muted);border-bottom:1px solid var(--line);padding-bottom:4px;margin:12px 0 8px';
      label.textContent=cat;
      list.appendChild(label);
      const grid=document.createElement('div');
      grid.className='skill-grid';
      grid.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:6px';
      list.appendChild(grid);
      LM_SKILL_DEFS.filter(d=>d.category===cat).forEach(def=>{
        const active=lmSkillActiva(def.id);
        const btn=document.createElement('button');
        btn.className='skill-toggle-btn';
        btn.dataset.lmid=def.id;
        btn.style.cssText=`display:flex;flex-direction:column;align-items:center;justify-content:space-between;gap:0;border:2px solid ${active?'var(--gold)':'var(--line)'};background:${active?'rgba(201,162,39,.12)':'var(--panel)'};color:${active?'var(--gold)':'var(--text)'};cursor:pointer;transition:.15s;text-align:center;width:100%;box-sizing:border-box;overflow:hidden;height:200px`;
        const iconPart=`<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;padding:12px 8px 8px;flex:1">
          <i class="ph ph-bold ${def.phIcon}" style="font-size:26px;color:${active?'var(--gold)':'var(--accent)'}"></i>
          <span style="font-family:'Bebas Neue',Impact,sans-serif;font-size:13px;letter-spacing:.8px;color:${active?'var(--gold)':'var(--text)'};line-height:1.1">${def.name}</span>
          <span style="font-size:12px;color:${active?'var(--accent)':'var(--text-muted)'};line-height:1.4;padding:0 4px">${def.tooltip}</span>
        </div>`;
        const footerPart=`<div style="width:100%;padding:6px;background:${active?'rgba(201,162,39,.15)':'rgba(0,0,0,.15)'};border-top:1px solid ${active?'rgba(201,162,39,.3)':'var(--line)'}">
          <span style="font-family:'Bebas Neue',Impact,sans-serif;font-size:12px;color:${active?'var(--gold)':'var(--text-muted)'};letter-spacing:1px">${active?'✓ ACTIVA · PULSA PARA DESACTIVAR':'★ '+def.cost+' PTS'}</span>
        </div>`;
        btn.innerHTML=iconPart+footerPart;
        btn.addEventListener('click', async ()=>{
          btn.disabled=true;
          if(typeof window.playSound==='function') window.playSound('select');
          if(!window._lmSkillsCache) window._lmSkillsCache={};
          if(window._lmSkillsCache[def.id]){
            delete window._lmSkillsCache[def.id];
            window._lmScratchPoints=(window._lmScratchPoints||0)+def.cost;
          } else {
            if((window._lmScratchPoints||0)<def.cost){ btn.disabled=false; return; }
            window._lmSkillsCache[def.id]=true;
            window._lmScratchPoints=(window._lmScratchPoints||0)-def.cost;
          }
          if(typeof window.unlockLMAchievement==='function' && LM_SKILL_DEFS.every(d=>lmSkillActiva(d.id))) window.unlockLMAchievement('lm_all_skills', false);
          try{
            await window._fbDb.collection('users').doc(user.uid).set({ligaManagerSkills:window._lmSkillsCache, scratchPoints:window._lmScratchPoints}, {merge:true});
          }catch(e){}
          renderLigaManagerSkillsTab(true);
        });
        grid.appendChild(btn);
      });
    });
  }
  window.renderLigaManagerSkillsTab = renderLigaManagerSkillsTab;
  let perfilEquipoColapsado=false;
  let correoExpandido=null;
  let ordenColumnasSaveTimer=null; // el orden de columnas se persiste solo tras 60s sin más cambios
  let acabaDeReordenarColumnas=false;
  // Pulso sutil del botón JUGAR JORNADA tras 1 minuto sin tocarlo ni
  // pasar el ratón por encima — un único intervalo para toda la sesión,
  // que revisa el botón actual cada pocos segundos (el DOM se rehace en
  // cada render(), así que no sirve guardar la referencia al elemento).
  let jugarBtnUltimaInteraccion=Date.now();
  let jugarBtnPulseInterval=null;
  function marcarInteraccionJugarBtn(){
    jugarBtnUltimaInteraccion=Date.now();
    const btn=document.getElementById('lmJugarBtn');
    if(btn) btn.classList.remove('lm-btn-jugar-pulse');
  }
  function iniciarPulseJugarBtn(){
    if(jugarBtnPulseInterval) return;
    jugarBtnPulseInterval=setInterval(()=>{
      const btn=document.getElementById('lmJugarBtn');
      if(!btn) return;
      if(Date.now()-jugarBtnUltimaInteraccion>60000) btn.classList.add('lm-btn-jugar-pulse');
    }, 3000);
  }
  // Indicador sutil de "hay más contenido abajo" — si pasan 30s sin
  // hacer scroll en una columna Y esa columna todavía no está desplazada
  // del todo hasta el final, aparece un puntito con un pulso discreto en
  // su esquina inferior derecha. En cuanto se scrollea (o se llega al
  // final) se oculta otra vez. Se guarda por columna (clave = su
  // className, estable entre renders) porque el DOM se rehace entero
  // cada vez que se llama a render().
  let colScrollUltimaInteraccion={};
  let colScrollHintInterval=null;
  function marcarScrollColumna(clave){
    colScrollUltimaInteraccion[clave]=Date.now();
  }
  function iniciarHintScrollColumnas(){
    if(colScrollHintInterval) return;
    colScrollHintInterval=setInterval(()=>{
      document.querySelectorAll('.lm-panel, .lm-center-panel').forEach(el=>{
        const clave=el.className;
        const hint=el.querySelector(':scope > [data-scroll-hint]');
        if(!hint) return;
        // El que de verdad scrollea es el div interior (envuelto por JS
        // en render() con position:absolute) cuando existe; si por lo
        // que sea todavía no se ha envuelto, cae en la propia columna.
        const scrollEl=el.querySelector(':scope > .lm-col-scroll-inner')||el;
        const quedaContenido = scrollEl.scrollHeight-scrollEl.scrollTop > scrollEl.clientHeight+6;
        const ultima=colScrollUltimaInteraccion[clave]||0;
        const inactivaMasDe30s=Date.now()-ultima>30000;
        hint.classList.toggle('lm-scroll-hint-visible', quedaContenido && inactivaMasDe30s);
      });
    }, 1500);
  }
  // Flechas de reordenar columnas — se vuelven invisibles tras 10s sin
  // tocarlas (clic o simplemente pasar el ratón por encima), y
  // reaparecen en cuanto se vuelve a interactuar con ellas.
  let colArrowsUltimaInteraccion=Date.now();
  let colArrowsFadeInterval=null;
  function marcarInteraccionColArrows(){
    colArrowsUltimaInteraccion=Date.now();
    document.querySelectorAll('.lm-col-reorder').forEach(el=>el.classList.remove('lm-col-reorder-oculto'));
  }
  function iniciarFadeColArrows(){
    if(colArrowsFadeInterval) return;
    colArrowsFadeInterval=setInterval(()=>{
      if(Date.now()-colArrowsUltimaInteraccion>10000){
        document.querySelectorAll('.lm-col-reorder').forEach(el=>el.classList.add('lm-col-reorder-oculto'));
      }
    }, 1000);
  }
  let setupData={liga:'es', moneda:null, nombre:'', escudo:null, modo:null, equipoElegidoId:null};
  let lpEstado={erroresExcel:[], erroresEscudos:[]}; // estado transitorio de la pantalla de Liga Personalizada
  let lpConfiguraciones=null; // null = todavía no se ha consultado a Firestore; luego un array
  let lpMostrarFormularioGuardar=false;
  let lpGuardando=false;

  function nuevoEstadoSinEmpezar(){ return { setupComplete:false }; }

  // Deriva la posición "genérica" de un slot de formación (quita el
  // número final y aplica algún alias) para poder casarlo con la
  // posición natural de un jugador, sea cual sea la formación elegida.
  function basePos(slotCode){
    const sinNumero=slotCode.replace(/[0-9]/g,'');
    const alias={MI:'EI', MD:'ED'};
    return alias[sinNumero]||sinNumero;
  }

  // Alineación automática de partida: coloca a cada jugador generado en
  // el primer hueco de su posición natural — así el equipo no arranca
  // con el campo vacío, aunque luego se pueda cambiar a mano.
  function alineacionAutomatica(plantilla, slots){
    const usados=new Set();
    const alineacion={};
    // 1ª pasada: casar por posición natural exacta.
    slots.forEach(def=>{
      const posGenerica=basePos(def.slot);
      const candidato=plantilla.find(p=>!usados.has(p.id) && p.position===posGenerica);
      if(candidato){ alineacion[def.slot]=candidato.id; usados.add(candidato.id); }
    });
    // 2ª pasada: si una formación pide más jugadores de una posición de
    // los que hay en la plantilla con esa posición EXACTA (ej. una
    // formación con 2 DC cuando solo se generó 1 DC natural), el hueco
    // se rellena con cualquier jugador que quede libre — igual que en
    // Copa Leyendas nunca queda una posición vacía en el campo: se
    // acepta la penalización de jugar fuera de posición antes que dejar
    // un hueco sin nadie (y sin nombre) como pasaba antes.
    slots.forEach(def=>{
      if(alineacion[def.slot]) return;
      const candidato=plantilla.find(p=>!usados.has(p.id));
      if(candidato){ alineacion[def.slot]=candidato.id; usados.add(candidato.id); }
    });
    return alineacion;
  }

  // Rating efectivo — CALCO de effRating() de Copa Leyendas: penaliza un
  // 15% si el jugador juega fuera de su posición natural, un 40% extra
  // si está lesionado, y aplica el mismo factor de fatiga por resistencia
  // (sin penalización por encima de 75, hasta -30% con la barra a 0).
  function getFatigueFactorLM(p){
    const f=(p.fatigue===undefined)?100:p.fatigue;
    if(f>=75) return 1;
    return Math.max(0.70, Math.min(1, 0.70+(f/75)*0.30));
  }
  function efectivoOverall(p){
    const base=p.overall||70;
    const slot=slotDeJugador(p.id);
    const inPos=!slot || basePos(slot)===p.position;
    const esVersatil = p.rasgos && p.rasgos.includes('versatil');
    const positionFactor=(inPos||esVersatil)?1:0.85;
    const injuryFactor=p.injured?0.6:1;
    const fatigueFactor=getFatigueFactorLM(p);
    return Math.round(base*positionFactor*injuryFactor*fatigueFactor);
  }

  // Estadísticas de equipo — misma interfaz visual de "PERFIL DEL EQUIPO"
  // que Copa Leyendas (ATAQUE/DEFENSA/RITMO/PASE/TÉCNICA + nota media),
  // pero calculada como la media de TODA la plantilla (16 jugadores), no
  // solo de los 11 titulares — así refleja el fondo de armario real.
  function calcularStatsEquipoLM(){
    const lista=state.plantilla||[];
    if(!lista.length) return {attack:0,defense:0,pace:0,passing:0,technique:0,overall:0};
    const n=lista.length;
    const sum=lista.reduce((acc,p)=>{
      acc.attack+=p.attack; acc.defense+=p.defense; acc.pace+=p.pace;
      acc.passing+=p.passing; acc.technique+=p.technique; acc.overall+=p.overall;
      return acc;
    }, {attack:0,defense:0,pace:0,passing:0,technique:0,overall:0});
    return {
      attack:Math.round(sum.attack/n), defense:Math.round(sum.defense/n), pace:Math.round(sum.pace/n),
      passing:Math.round(sum.passing/n), technique:Math.round(sum.technique/n), overall:Math.round(sum.overall/n)
    };
  }

  function empezarTemporada(nombreEquipo, moneda, liga, escudo, equipoRealElegidoId){
    calendarioMesVisto=null; // nueva liga: el calendario debe volver a fijarse en el mes de inicio, no arrastrar el de una partida anterior
    calendarioJornadaSincronizada=null;
    // Marca que se acaba de crear una liga nueva, para que el
    // tutorial de Liga Manager se reproduzca de nuevo — a diferencia
    // de un simple "visto una vez", el jugador debe verlo cada vez
    // que empieza una liga desde cero, aunque ya hubiera jugado otras
    // antes. sessionStorage (no localStorage) porque solo debe
    // disparar en ESTA sesión, justo tras crear la liga.
    try{ sessionStorage.setItem('g2g_tut_lm_new_league','1'); }catch(e){}
    const miEquipo={id:'lm_0', name:nombreEquipo};
    // LaLiga tiene 20 equipos — LM_RIVALS ya contiene los 20 reales de
    // la temporada. Tu equipo ocupa SIEMPRE una de esas 20 plazas:
    // - Si eliges ser un club real, se quita ESE club de la lista de
    //   rivales (te conviertes en él) — quedan 19 rivales + tú = 20.
    // - Si creas un club inventado, se sortea al azar UNO de los 20
    //   reales para cederte su plaza en la tabla — quedan 19 rivales +
    //   tú = 20. Nunca se duplica ningún nombre ni se deja un número
    //   impar de equipos, que es lo que rompía el calendario antes
    //   (con 19 equipos, el generador no podía funcionar y acababa
    //   emparejando a un equipo consigo mismo, jornada tras jornada).
    // En Liga Personalizada el mismo patrón se aplica sobre los
    // equipos importados del Excel en vez de sobre LM_RIVALS — por
    // eso la pantalla de importación exige un número PAR de equipos.
    const esCustomLiga = liga==='custom';
    const poolRivales = esCustomLiga
      ? (window.G2G_LigaPersonalizada?window.G2G_LigaPersonalizada.getEquipos():[]).map(equipoCustomARival)
      : LM_RIVALS;
    const idAExcluir = equipoRealElegidoId || poolRivales[Math.floor(Math.random()*poolRivales.length)].id;
    const rivalesBarajados=poolRivales.filter(r=>r.id!==idAExcluir).slice();
    if(typeof shuffle==='function') shuffle(rivalesBarajados); // shuffle() muta en el sitio, no devuelve nada
    const teams=[miEquipo, ...rivalesBarajados];
    const equipoRealElegido = equipoRealElegidoId ? poolRivales.find(r=>r.id===equipoRealElegidoId) : null;
    const plantilla = esCustomLiga
      ? (equipoRealElegidoId ? generarPlantillaDesdeEquipoCustom((window.G2G_LigaPersonalizada.getEquipos()||[]).find(e=>e.key===equipoRealElegidoId)) : generarMiniPlantilla())
      : (equipoRealElegido ? generarPlantillaDesdeEquipoReal(equipoRealElegido) : generarMiniPlantilla());
    state={
      setupComplete:true,
      liga, moneda, nombreEquipo, escudo,
      jornadaActual:1,
      calendario:generarCalendario(teams),
      fechaInicioLiga:fechaISO(inicioTemporadaRealista()),
      calendarioEntrenamiento:{},
      // ---- Semana de nodos (Fase 1: contadores + canje de hitos) ----
      // Cada vez que se elija un nodo del camino semanal (Fase 2,
      // todavía sin construir), se sumará +1 al contador de su tipo
      // aquí. Los hitos (5/10/20) se pueden canjear una sola vez cada
      // uno en cuanto se alcanzan, sin resetear el contador — así el
      // jugador ve claramente su progreso acumulado a lo largo de toda
      // la temporada, no solo de una semana.
      nodosAcumulados:{entreno:0, descanso:0, quiniela:0, scouting:0, amistoso:0, medios:0, tactica:0},
      nodosHitosReclamados:{entreno:[], descanso:[], quiniela:[], scouting:[], amistoso:[], medios:[], tactica:[]},
      // Banderas de efectos "para la próxima vez que corresponda" —
      // las consumirá el propio sistema afectado la próxima vez que se
      // dé la circunstancia (ej. boostEntrenoSemana lo consume la
      // resolución semanal de entrenamiento de la Fase 2 en cuanto
      // exista). Por ahora solo se guardan, listas para ese momento.
      nodosBanderasPendientes:{boostEntrenoSemana:false, quinielaConPista:false, quinielaMultiplicador:false, quinielaHitosGarantizados:false, sobreGarantizado:false, sobreNivelSuperior:false, sobreDobleEleccion:false},
      // Árbol de nodos de la semana actual — se regenera cada vez que
      // cambia de jornada. dias[i].elegido = indice del nodo elegido
      // ese día (null hasta que se elige). gestionInicialHecha marca si
      // ya se pasó por la gestión de plantilla previa a la semana.
      semanaNodos:null,
      pfPlanEntrenamiento:[],
      lmPendingPrediction:null,
      resultados:{},
      plantilla,
      formacionCategoria:'equilibrada',
      formacionCode:'4-3-3',
      alineacion:alineacionAutomatica(plantilla, generarSlotsFormacion('4-3-3')),
      medicoNotificacion:null,
      diceAvailable:lmDicePoolPorPartido(),
      medicoCartas:[],
      medicoCambiosUsados:0,
      medicoCartasAgotadas:[],
      medicoBonos:{},
      medicoHistorial:[],
      medicoNiveles:{curacionMuscular:0, curacionOsea:0, prevencionMuscular:0, prevencionOsea:0},
      // Aforo inicial deliberadamente modesto para un club PROPIO — un
      // club recién ascendido a Primera no suele tener un estadio
      // grande (referencia real: Eibar ~8.000, Huesca ~7.600, Leganés
      // ~12.500). Si en cambio el jugador ha elegido convertirse en
      // uno de los 20 equipos reales, se usa el aforo real aproximado
      // de SU estadio de verdad en vez de este valor por defecto —
      // antes todos los equipos (incluido el Real Madrid) empezaban
      // con el mismo estadio de 12.000 asientos, sin ningún sentido.
      // La satisfacción de la afición también arranca más baja para un
      // club propio (recién ascendido, sin trayectoria ni cartel
      // todavía) que para uno de los 20 reales (afición ya fiel y
      // asentada) — afecta directamente a la asistencia real a cada
      // partido, y por tanto a los ingresos por entradas.
      estadio:{campo:90, satisfaccion:equipoRealElegidoId?10:-15, aforoTotal:(equipoRealElegidoId && AFORO_REAL_POR_EQUIPO[equipoRealElegidoId]) || 12000, ultimaAsistencia:null},
      moral:0,
      rachaResultados:0,
      victoriasQuiniela:0,
      quinielaBoleto:null,
      quinielaResultadoPendiente:null,
      mantenimientoCartas:[],
      mantenimientoCambiosUsados:0,
      mantenimientoCartasAgotadas:[],
      mantenimientoHistorial:[],
      mantenimientoNiveles:{prevencionDesgaste:0, recuperacionCesped:0, boostSatisfaccion:0, proteccionSatisfaccion:0},
      // ---- Guardias de seguridad ----
      // guardiasContratados: cuántos guardias tienes en plantilla en total.
      // guardiasZonas: cuántos de esos están asignados a cada zona (máx 3).
      // Los "disponibles" son contratados menos asignados.
      // disturbiosZonas: nivel de disturbios de cada zona del estadio.
      // Las 6 zonas de aquí son las MISMAS (y con los MISMOS ids) que
      // usa de verdad la interfaz en LM_ZONAS_ESTADIO — antes este
      // objeto inicial traía 12 zonas con ids distintos
      // (norte_1/2/3, sur_1/2/3, este_1/2/3, oeste_1/2/3) que nunca
      // llegaban a usarse en ningún sitio, quedando como datos
      // huérfanos sin ningún propósito.
      guardiasContratados:0,
      modoVisualPartido:'auto',
      guardiasZonas:{norte:0, sur:0, este_1:0, este_2:0, oeste_1:0, oeste_2:0},
      disturbiosZonas:{norte:0, sur:0, este_1:0, este_2:0, oeste_1:0, oeste_2:0},
      dadoRerollsDisponibles:lmRerollsPorPartido(),
      // ---- Economía ----
      // Capital inicial: mucho más ajustado para un club PROPIO (modo
      // difícil, recién ascendido) que para hacerte cargo de uno de los
      // 20 equipos reales ya establecidos. Con la nómina real de una
      // plantilla modesta (~190.000-215.000€/mes, ver calcularSalario) y
      // el cuerpo técnico aún sin contratar, estos 200.000€ dan menos de
      // un mes de colchón si no entrara nada de dinero: el jugador
      // depende de verdad de la recaudación de los partidos en casa
      // desde la primera jornada, y un mal sorteo de calendario (pocos
      // partidos en casa en el primer mes) puede dejar el balance en
      // números rojos. El aviso de quiebra grave (comprobarInsolvenciaGrave)
      // exige 3 meses seguidos por debajo de -3x la nómina mensual antes
      // de declarar la quiebra, así que hay margen real para recuperarse
      // mientras se aprende a gestionar precio de entrada, fichajes y
      // patrocinios — difícil de dominar, pero nunca injusto.
      capital:equipoRealElegidoId?400000:200000,
      // Préstamo bancario activo (null si no hay ninguno pedido). Ver
      // solicitarPrestamo()/procesarCuotaPrestamo() más abajo.
      prestamoBancario:null,
      precioEntrada:15,
      mesesPagados:0,
      finanzasHistorial:[],
      directorGeneralCartas:[],
      directorGeneralCambiosUsados:0,
      directorGeneralCartasAgotadas:[],
      directorGeneralHistorial:[],
      directorGeneralNiveles:{aforoExtra:0, ingresoPatrocinio:0, ingresoMerchandising:0, toleranciaPrecio:0},
      // Giro Táctico (adaptado de Copa Leyendas): usos disponibles se
      // reinician cada media temporada (jornadas 1-19 / 20-38), nunca
      // por partido ni por temporada completa — giroTacticoMitad
      // registra de cuál de las dos mitades es el contador actual,
      // para saber cuándo toca reiniciarlo.
      giroTacticoUsosRestantes:5,
      giroTacticoMitad:1,
      directorDeportivoCartas:[],
      directorDeportivoCambiosUsados:0,
      directorDeportivoCartasAgotadas:[],
      directorDeportivoHistorial:[],
      directorDeportivoNiveles:{calidadOjeo:0, ahorroSalarial:0, sobresFichajes:0, costeSobres:0},
      // Sobres de fichajes: ya NO se abren directamente desde la tarjeta.
      // Se generan solos con el tiempo (más a menudo cuanto más subida
      // esté la carta "Sobres de Fichajes") y avisan por correo cuando
      // están listos — desde ahí se abren. Máximo 3 sin abrir a la vez.
      sobresFichajesPendientes:[],
      // Jugadores reales de otros equipos ya fichados en ESTA partida —
      // desaparecen de su equipo de origen (no vuelven a aparecer como
      // goleadores/alineación suyos) en cuanto se fichan.
      jugadoresRealesFichados:[],
      // ---- Trabajadores del cuerpo técnico ----
      trabajadores:{
        medico:null,
        mantenimiento:null,
        directorGeneral:null,
        directorDeportivo:null,
        preparadorFisico:null
      },
      candidatosTrabajo:[],
      mesTrabajadoresGenerado:0,
      correoInterno:[],
      correoUltimoEnviado:{},
      posicionObjetivoOjeo:'any',
      preparadorFisicoCartas:[],
      preparadorFisicoCambiosUsados:0,
      preparadorFisicoCartasAgotadas:[],
      preparadorFisicoHistorial:[],
      preparadorFisicoNiveles:{resistenciaBase:0, recuperacionSemanal:0, potencialTecnico:0, potencialFisico:0, planificacionSemanal:0},
      ordenColumnas:['left','center','right','staff']
    };
    state.medicoCartas = inicializarCartasMedico();
    state.mantenimientoCartas = inicializarCartasMantenimiento();
    state.directorGeneralCartas = inicializarCartasDG();
    state.directorDeportivoCartas = inicializarCartasDD();
    state.preparadorFisicoCartas = inicializarCartasPF();
    // Regalo de bienvenida para todos: un sobre de fichajes gratuito ya
    // esperando desde el primer día, avisado por correo como cualquier
    // otro — se abre igual, pero sin coste al abrirlo.
    {
      const idRegalo='sobre_regalo_'+Date.now();
      state.sobresFichajesPendientes.push({id:idRegalo, nivel:1, jornadaGenerado:1, gratis:true});
      enviarCorreo('directorDeportivo', t('correo.bienvenida_sobre.asunto'),
        t('correo.bienvenida_sobre.cuerpo'),
        {asunto:'correo.bienvenida_sobre.asunto', cuerpo:'correo.bienvenida_sobre.cuerpo'});
      const ultimoCorreo=state.correoInterno && state.correoInterno[0];
      if(ultimoCorreo){ ultimoCorreo.tipoEspecial='sobre_listo'; ultimoCorreo.sobreId=idRegalo; }
    }
    guardarEstado();
  }


  function cargarEstado(){
    try{
      const raw=localStorage.getItem(SAVE_KEY);
      if(raw){
        const s=JSON.parse(raw);
        repararColisionNombresCalendario(s);
        return s;
      }
    }catch(e){}
    return nuevoEstadoSinEmpezar();
  }
  // Reparación para partidas YA EXISTENTES (el arreglo en
  // empezarTemporada solo protege ligas nuevas — esto cubre las que ya
  // tenían el calendario generado con la colisión de nombres, como
  // "Sevilla FC vs Sevilla FC"). Solo toca el NOMBRE mostrado, nunca
  // los IDs ni los resultados/predicciones ya guardados, que se
  // referencian por ID — así es 100% seguro aplicarlo con partidas en
  // curso sin invalidar nada.
  function repararColisionNombresCalendario(s){
    if(!s) return;
    let reparado=false;
    if(s.calendario && Array.isArray(s.calendario)){
      s.calendario.forEach(jornada=>{
        if(!Array.isArray(jornada)) return;
        jornada.forEach(partido=>{
          if(partido && partido.home && partido.away && partido.home.id!==partido.away.id
             && partido.home.name && partido.away.name
             && partido.home.name.trim().toLowerCase()===partido.away.name.trim().toLowerCase()){
            const esMiaLaLocal = partido.home.id==='lm_0';
            if(esMiaLaLocal) partido.away.name=partido.away.name.trim()+' (rival)';
            else partido.home.name=partido.home.name.trim()+' (rival)';
            reparado=true;
          }
        });
      });
    }
    // La quiniela guarda su PROPIA copia de los nombres (homeName/
    // awayName), tomada en el momento de generar el boleto — separada
    // por completo del calendario. Sin repararla aquí también, el
    // arreglo de arriba no llegaba nunca a lo que se ve en pantalla en
    // la quiniela, que es justo donde seguía fallando.
    if(s.quinielaBoleto && Array.isArray(s.quinielaBoleto.partidos)){
      s.quinielaBoleto.partidos.forEach(p=>{
        if(p && p.homeId!==p.awayId && p.homeName && p.awayName
           && p.homeName.trim().toLowerCase()===p.awayName.trim().toLowerCase()){
          if(p.homeEsMio) p.awayName=p.awayName.trim()+' (rival)';
          else p.homeName=p.homeName.trim()+' (rival)';
          reparado=true;
        }
      });
    }
    if(reparado){ try{ localStorage.setItem(SAVE_KEY, JSON.stringify(s)); }catch(e){} }
  }
  function guardarEstado(){ try{ localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }catch(e){} }
  function borrarEstado(){ try{ localStorage.removeItem(SAVE_KEY); }catch(e){} }

  /* ---------- 6. Identidad persistente (nombre+escudo) — separada del
     progreso de la run (SAVE_KEY). Se guarda cuando se confirma en el
     flujo de entrada, y se reutiliza automáticamente en la siguiente
     partida sin volver a preguntar, tal como pidió Jesús. ---------- */
  function cargarIdentidad(){
    try{
      const raw=localStorage.getItem(IDENTITY_KEY);
      if(raw) return JSON.parse(raw);
    }catch(e){}
    return null;
  }
  function guardarIdentidad(nombre, crest){
    try{ localStorage.setItem(IDENTITY_KEY, JSON.stringify({nombre, crest})); }catch(e){}
  }
  // Si todavía no hay identidad propia de Liga Manager guardada (primera
  // vez que se entra), se reutiliza la preferencia global ya definida en
  // Ajustes de Copa Leyendas (checkbox "usar siempre como nombre de
  // equipo" + el escudo guardado) — así no se pregunta dos veces lo
  // mismo si el jugador ya lo dejó configurado ahí.
  function identidadPorDefecto(){
    const propia=cargarIdentidad();
    if(propia && propia.nombre && propia.crest) return propia;
    if(window.useFixedTeamName && window.preferredTeamName){
      const crestGlobal = window._myCrestImage
        ? {type:'image', data:window._myCrestImage}
        : (window._myCrestData ? {type:'layers', data:window._myCrestData} : null);
      if(crestGlobal) return {nombre:window.preferredTeamName, crest:crestGlobal};
    }
    return null;
  }

  // Escudo — reutiliza DE VERDAD el motor de dibujo de crest-editor.js
  // (buildCrestSVGInner vía renderCrestThumb), tanto para el escudo por
  // capas como para una imagen subida. Nunca toca window._myCrestData
  // (eso es de Copa Leyendas) — aquí solo se LEE con datos propios.
  // Texto narrativo del histórico del partido — en lenguaje claro y
  // ameno, a partir de los eventos REALES de ese partido concreto
  // (nunca inventado). Compartida entre modo automático y modo
  // manager, para que ambos muestren exactamente el mismo resumen.
  function generarHistoricoPartidoTexto(info, miEsLocal, posesionRealMia){
    const miNombre = state.nombreEquipo || state.escudo && state.escudo.nombre || 'Tu equipo';
    const rivalNombre = miEsLocal ? info.away.name : info.home.name;
    const golesMio = miEsLocal ? info.resultado.golesA : info.resultado.golesB;
    const golesRival = miEsLocal ? info.resultado.golesB : info.resultado.golesA;
    const miLado = miEsLocal ? 'home' : 'away';
    const eventos = (info.eventos||[]).slice().sort((a,b)=>a.minute-b.minute);
    const goles = eventos.filter(e=>e.type==='goal');
    const tarjetas = eventos.filter(e=>e.type==='card');
    const lesiones = eventos.filter(e=>e.type==='injury');
    const posMio = posesionRealMia!=null ? posesionRealMia : (info.resultado.posesionA!=null ? (miEsLocal?info.resultado.posesionA:info.resultado.posesionB) : null);
    const posRival = posMio!=null ? 100-posMio : null;

    const partes=[];
    // Apertura: resultado en una frase, elegida al azar entre varias
    // formas distintas de contarlo — así la crónica no suena siempre
    // exactamente igual, como un periodista que varía su redacción.
    function elegir(...claves){ return claves[Math.floor(Math.random()*claves.length)]; }
    if(golesMio>golesRival) partes.push(tp(elegir('lm.hist_gano','lm.hist_gano2','lm.hist_gano3'), {miNombre, rivalNombre, golesMio, golesRival}));
    else if(golesMio<golesRival) partes.push(tp(elegir('lm.hist_perdio','lm.hist_perdio2'), {miNombre, rivalNombre, golesMio, golesRival}));
    else partes.push(tp(elegir('lm.hist_empato','lm.hist_empato2'), {miNombre, rivalNombre, golesMio}));

    // Posesión — una frase que da color y contexto a lo que se vio.
    if(posMio!=null){
      if(Math.abs(posMio-posRival)>=8){
        const dominador = posMio>posRival ? miNombre : rivalNombre;
        const domPos = posMio>posRival ? posMio : posRival;
        const domPosRival = posMio>posRival ? posRival : posMio;
        const dominadoRival = posMio>posRival ? rivalNombre : miNombre;
        partes.push(tp('lm.hist_posesion_dominio', {equipo:dominador, pos:domPos, posRival:domPosRival, rivalEquipo:dominadoRival}));
      } else {
        partes.push(tp('lm.hist_posesion_equilibrada', {pos:posMio, posRival}));
      }
    }

    // Clima — solo si tuvo algo de protagonismo real en el partido.
    const climaId = info.climaId;
    const claveClima = {rain:'lm.hist_clima_lluvia', wind:'lm.hist_clima_viento', hot:'lm.hist_clima_calor', snow:'lm.hist_clima_nieve'}[climaId];
    if(claveClima) partes.push(t(claveClima));

    // Goles, contados como una pequeña crónica.
    if(goles.length){
      const frasesGoles = goles.map(g=>{
        const equipo = g.team===miLado ? miNombre : rivalNombre;
        const nombreJ = g.jugador ? g.jugador.name : equipo;
        const claveConector = elegir('lm.hist_gol_de','lm.hist_gol_de2','lm.hist_gol_de3','lm.hist_gol_de4');
        return `${nombreJ} (${equipo}) ${tp(claveConector,{min:g.minute})}`;
      });
      partes.push(`**${t('lm.hist_goles_titulo')}**\n${frasesGoles.join('. ')}.`);
    } else {
      partes.push(`**${t('lm.hist_goles_titulo')}**\n${t('lm.hist_sin_goles')}`);
    }

    // Tarjetas.
    if(tarjetas.length){
      const frasesTarjetas = tarjetas.map(c=>{
        const equipo = c.team===miLado ? miNombre : rivalNombre;
        const nombreJ = c.jugador ? c.jugador.name : equipo;
        const claveT = c.tarjeta==='roja' ? 'lm.hist_roja_de' : 'lm.hist_amarilla_de';
        return `${nombreJ} (${equipo}) ${tp(claveT,{min:c.minute})}`;
      });
      partes.push(`**${t('lm.hist_tarjetas_titulo')}**\n${frasesTarjetas.join('. ')}.`);
    } else {
      partes.push(`**${t('lm.hist_tarjetas_titulo')}**\n${t('lm.hist_sin_tarjetas')}`);
    }

    // Lesiones, solo si hubo alguna — no hace falta un párrafo vacío.
    if(lesiones.length){
      const frasesLesiones = lesiones.map(l=>{
        const equipo = l.team===miLado ? miNombre : rivalNombre;
        const nombreJ = l.jugador ? l.jugador.name : equipo;
        return `${nombreJ} (${equipo}) ${tp('lm.hist_lesion_de',{min:l.minute})}`;
      });
      partes.push(`**${t('lm.hist_lesiones_titulo')}**\n${frasesLesiones.join('. ')}.`);
    }

    // Rueda de prensa — si hubo una promesa hecha antes del partido,
    // se menciona si se cumplió o no.
    const prensa = state.ultimaPrensaResuelta;
    if(prensa && prensa.outcome!=='neutral'){
      partes.push(tp(prensa.outcome==='correct' ? 'lm.hist_prensa_cumplida' : 'lm.hist_prensa_incumplida', {label:prensa.label, delta:prensa.delta}));
    }

    // Cierre breve.
    partes.push(Math.abs(golesMio-golesRival)<=1 ? t('lm.hist_cierre_ajustado') : t('lm.hist_cierre_claro'));

    return partes.join('\n\n');
  }
  function mostrarHistoricoPartido(info, miEsLocal, posesionRealMia){
    // Evita que se acumulen varias ventanas si se pulsa el botón más
    // de una vez — se quita cualquier histórico ya abierto antes de
    // crear uno nuevo.
    const existente=document.getElementById('lmHistoricoOverlay');
    if(existente) existente.remove();
    const texto = generarHistoricoPartidoTexto(info, miEsLocal, posesionRealMia);
    const htmlTexto = texto.split('\n\n').map(p=>{
      if(p.startsWith('**')){
        const [titulo, ...resto] = p.split('\n');
        return `<div class="lm-historico-subtitulo">${titulo.replace(/\*\*/g,'')}</div><p class="lm-historico-parrafo">${resto.join(' ')}</p>`;
      }
      return `<p class="lm-historico-parrafo">${p}</p>`;
    }).join('');
    const overlay=document.createElement('div');
    overlay.id='lmHistoricoOverlay';
    overlay.innerHTML=`
      <div class="lm-dilemma-card" style="width:480px;max-width:92vw;text-align:left;max-height:80vh;display:flex;flex-direction:column">
        <div class="lm-dilemma-title"><i class="ph ph-bold ph-notebook"></i> ${t('lm.historico_partido_btn')}</div>
        <div style="overflow-y:auto;flex:1;padding-right:4px">${htmlTexto}</div>
        <div class="lm-popup-actions" style="margin-top:12px"><button id="lmHistoricoCerrar" class="mode-card-btn mode-card-btn-gold">${t('lm.continuar')}</button></div>
      </div>`;
    document.getElementById('ligaManagerScreen').appendChild(overlay);
    const cerrar=()=>overlay.remove();
    if(typeof habilitarCierreOverlay==='function') habilitarCierreOverlay(overlay, cerrar);
    overlay.querySelector('#lmHistoricoCerrar').addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      cerrar();
    });
  }

  function crestHTML(crest, sizePx){
    sizePx=sizePx||28;
    if(!crest) return `<i class="ph ph-bold ph-shield" style="font-size:${sizePx*0.6}px;color:#888"></i>`;
    if(crest.type==='image'){
      return `<img src="${crest.data}" style="width:${sizePx}px;height:${sizePx}px;object-fit:cover;border-radius:4px;vertical-align:middle">`;
    }
    if(crest.type==='layers' && typeof window.renderCrestThumb==='function'){
      return window.renderCrestThumb(sizePx, crest.data);
    }
    return `<i class="ph ph-bold ph-shield" style="font-size:${sizePx*0.6}px;color:#888"></i>`;
  }
  function rivalCrestHTML(sizePx, crestImg){
    sizePx=sizePx||28;
    if(crestImg) return `<img src="${crestImg}" alt="" style="width:${sizePx}px;height:${sizePx}px;object-fit:contain;vertical-align:middle">`;
    return `<i class="ph ph-bold ph-shield" style="font-size:${sizePx*0.6}px;color:#8a95a0"></i>`;
  }

  // Clima del próximo partido — reutiliza LITERALMENTE el catálogo
  // WEATHER_TYPES de Copa Leyendas (mismas probabilidades, mismos
  // textos/iconos) en vez de duplicarlo, ya que game.js se carga antes
  // que este archivo y queda accesible como global. Se sortea una vez
  // por jornada (no en cada render) y se guarda en el estado.
  function climaDelPartido(){
    if(typeof WEATHER_TYPES==='undefined') return null;
    if(state.climaJornada!==state.jornadaActual || !state.climaId){
      const pesos=[2,2,1,1.5,1,0.6]; // mismo orden/pesos que rollWeather(): sunny,cloudy,rain,wind,hot,snow
      const total=pesos.reduce((a,b)=>a+b,0);
      let r=Math.random()*total, idx=1;
      for(let i=0;i<pesos.length;i++){ r-=pesos[i]; if(r<=0){ idx=i; break; } }
      state.climaJornada=state.jornadaActual;
      state.climaId=(WEATHER_TYPES[idx]||WEATHER_TYPES[1]).id;
      guardarEstado();
    }
    return WEATHER_TYPES.find(w=>w.id===state.climaId) || WEATHER_TYPES[1];
  }
  function weatherDisplayHTML(clima){
    if(!clima) return '';
    return `<div class="weather-display" style="display:flex">
      <span class="weather-icon">${clima.label.split(' ')[0]}</span>
      <div class="weather-block">
        <span>${clima.label.slice(clima.label.indexOf(' ')+1)}</span>
        <span class="weather-desc">${clima.desc}</span>
      </div>
    </div>`;
  }
  // Efecto visual del clima sobre el campo de Liga Manager — CALCO exacto
  // de applyPitchWeatherVisual() de Copa Leyendas (mismas clases CSS:
  // weather-fx-X/weather-sheen/weather-drop/weather-splash/weather-flake/
  // weather-gust, todas genéricas y no atadas al #pitch de Copa Leyendas),
  // aplicado sobre #lmPitchBox/#lmWeatherLayer en vez de #pitch.
  function aplicarClimaVisualLM(weatherId){
    const pitch=document.getElementById('lmPitchBox');
    const layer=document.getElementById('lmWeatherLayer');
    if(!pitch||!layer) return;
    pitch.className = pitch.className.replace(/\bweather-fx-\S+/g, '').trim();
    layer.innerHTML='';
    if(!weatherId || weatherId==='cloudy') return;
    pitch.classList.add('weather-fx-'+weatherId);
    if(weatherId==='rain' || weatherId==='hot' || weatherId==='sunny'){
      const sheen=document.createElement('div');
      sheen.className='weather-sheen';
      layer.appendChild(sheen);
    }
    if(weatherId==='rain'){
      for(let i=0;i<40;i++){
        const drop=document.createElement('div');
        drop.className='weather-drop';
        const left=Math.random()*100, duration=0.5+Math.random()*0.4;
        const negDelay=-Math.random()*duration;
        drop.style.left=left+'%';
        drop.style.animationDuration=duration+'s';
        drop.style.animationDelay=negDelay+'s';
        drop.style.opacity=0.4+Math.random()*0.4;
        layer.appendChild(drop);
        const splash=document.createElement('div');
        splash.className='weather-splash';
        splash.style.left=left+'%'; splash.style.top=(10+Math.random()*82)+'%';
        splash.style.animationDuration=(0.9+Math.random()*0.8)+'s';
        splash.style.animationDelay=(-Math.random()*1.6)+'s';
        layer.appendChild(splash);
      }
    }
    if(weatherId==='snow'){
      for(let i=0;i<28;i++){
        const flake=document.createElement('div');
        flake.className='weather-flake';
        const left=Math.random()*100, duration=3+Math.random()*3, size=6+Math.random()*7;
        const negDelay=-Math.random()*duration;
        flake.textContent='❄';
        flake.style.left=left+'%';
        flake.style.fontSize=size+'px';
        flake.style.animationDuration=duration+'s';
        flake.style.animationDelay=negDelay+'s';
        flake.style.opacity=0.55+Math.random()*0.4;
        layer.appendChild(flake);
      }
    }
    if(weatherId==='wind'){
      for(let i=0;i<3;i++){
        const gust=document.createElement('div');
        gust.className='weather-gust';
        gust.style.animationDelay=(i*1.1)+'s';
        layer.appendChild(gust);
      }
    }
  }

  /* Abre el editor de escudos REAL de Copa Leyendas (crest-editor.js), sin
     modificarlo ni un carácter: se intercambia temporalmente el estado
     global que usa (window._myCrestData / _myCrestImage) y se sustituyen
     sus funciones de guardado por unas propias que escriben en la
     identidad de Liga Manager en vez de en Firestore/Copa Leyendas. Al
     cerrar el editor (detectado por sondeo, ya que no expone un evento
     de cierre), se restaura todo tal como estaba. */
  function openLigaManagerCrestEditor(nombreActual, crestActual, onDone){
    if(typeof window.openCrestEditor !== 'function'){
      if(typeof window.showToast==='function') window.showToast('El editor de escudos no está disponible', 'toast-neutral');
      return;
    }
    const prevData = window._myCrestData;
    const prevImage = window._myCrestImage;
    const prevSaveData = window.saveMyCrestData;
    const prevSaveImage = window.saveMyCrestImage;
    const nameInput = document.getElementById('preferredTeamNameInput');
    const prevNameVal = nameInput ? nameInput.value : null;

    window._myCrestData = (crestActual && crestActual.type==='layers') ? crestActual.data : null;
    window._myCrestImage = (crestActual && crestActual.type==='image') ? crestActual.data : null;
    if(nameInput) nameInput.value = nombreActual || '';

    let guardado = null;
    window.saveMyCrestData = async function(data){
      window._myCrestData = data; window._myCrestImage = null;
      guardado = {type:'layers', data};
      if(typeof window.refreshAllCrestThumbs==='function') window.refreshAllCrestThumbs();
    };
    window.saveMyCrestImage = async function(dataUrl){
      window._myCrestImage = dataUrl; window._myCrestData = null;
      guardado = {type:'image', data:dataUrl};
      if(typeof window.refreshAllCrestThumbs==='function') window.refreshAllCrestThumbs();
    };

    function restaurar(){
      window._myCrestData = prevData;
      window._myCrestImage = prevImage;
      window.saveMyCrestData = prevSaveData;
      window.saveMyCrestImage = prevSaveImage;
      if(nameInput) nameInput.value = prevNameVal;
      if(typeof window.refreshAllCrestThumbs==='function') window.refreshAllCrestThumbs();
    }

    window.openCrestEditor();

    // El editor no expone un callback/evento de cierre — se sondea la
    // presencia de su overlay para saber cuándo el jugador ha terminado.
    const poll=setInterval(function(){
      if(!document.getElementById('crestEditorOverlay')){
        clearInterval(poll);
        restaurar();
        onDone(guardado || crestActual);
      }
    }, 250);
  }

  /* ---------- 7. Clasificación calculada a partir de resultados ---------- */
  // Devuelve los equipos rivales que REALMENTE forman parte de la
  // liga actual (derivados del propio calendario ya generado, nunca
  // de LM_RIVALS a pelo) — funciona igual de bien en la liga
  // española que en cualquier Liga Personalizada, sin tener que
  // saber de antemano qué lista tocaba usar en cada caso.
  function equiposDeLaLigaActual(){
    const vistos={};
    const lista=[];
    (state.calendario||[]).forEach(jornada=>{
      jornada.forEach(partido=>{
        [partido.home, partido.away].forEach(eq=>{
          if(eq.id!=='lm_0' && !vistos[eq.id]){ vistos[eq.id]=true; lista.push(eq); }
        });
      });
    });
    return lista;
  }

  function calcularClasificacion(){
    const tabla={};
    function asegurarFila(equipo){
      if(!tabla[equipo.id]){
        tabla[equipo.id]={id:equipo.id, name:equipo.name, crestImg:equipo.crestImg, pj:0,pg:0,pe:0,pp:0,gf:0,gc:0,pts:0};
      }
      return tabla[equipo.id];
    }
    asegurarFila({id:'lm_0', name:state.nombreEquipo, crestImg:null});
    (state.calendario||[]).forEach(jornada=>{ jornada.forEach(partido=>{ asegurarFila(partido.home); asegurarFila(partido.away); }); });
    for(let j=0;j<state.jornadaActual-1;j++){
      (state.calendario[j]||[]).forEach(partido=>{
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

  /* ---------- 8. Jugar la jornada actual ---------- */
  /* ---------- 8. Generar eventos del partido: goles con GOLEADOR real
     (de tu alineación, con sesgo hacia posiciones ofensivas) + posible
     lesión durante el propio partido — todo con minuto real, igual que
     hace Copa Leyendas, en vez de un aviso aparte tras la jornada. ---------- */
  function elegirGoleador(){
    const idsAlineados=Object.values(state.alineacion||{}).filter(Boolean);
    const titulares=idsAlineados.map(id=>state.plantilla.find(p=>p.id===id)).filter(p=>p && !p.injured);
    if(!titulares.length) return null;
    const sinPortero=titulares.filter(p=>p.position!=='POR');
    const ofensivos=sinPortero.filter(p=>['DC','EI','ED','MC'].includes(p.position));
    const pool = ofensivos.length ? ofensivos : (sinPortero.length ? sinPortero : titulares);
    return pool[Math.floor(Math.random()*pool.length)];
  }

  function elegirJugadorAlineado(excluirIds){
    excluirIds = excluirIds || new Set();
    const idsAlineados=Object.values(state.alineacion||{}).filter(Boolean).filter(id=>!excluirIds.has(id));
    const titulares=idsAlineados.map(id=>state.plantilla.find(p=>p.id===id)).filter(p=>p && !p.injured);
    if(!titulares.length) return null;
    // Elección PONDERADA, no uniforme: un jugador que ya acumula
    // amarillas pesa más en el sorteo, igual que en la vida real hay
    // jugadores "propensos a la tarjeta" que repiten mucho más que el
    // resto de la plantilla. Con un sorteo uniforme entre ~15-20
    // titulares, las 35 amarillas de temporada (35% x 38 jornadas)
    // se repartían tan finas que casi nadie llegaba nunca a las 5
    // necesarias para la sanción por acumulación — la norma existía
    // en el código pero era casi inalcanzable en la práctica. Con
    // este sesgo, una vez un jugador empieza a acumular, tiene más
    // números de seguir acumulando, así que la sanción se ve de
    // verdad a lo largo de una temporada, no solo en la teoría.
    const pesos=titulares.map(p=>1+(p.amarillasAcumuladas||0)*1.6);
    const pesoTotal=pesos.reduce((a,b)=>a+b,0);
    let r=Math.random()*pesoTotal;
    for(let i=0;i<titulares.length;i++){
      r-=pesos[i];
      if(r<=0) return titulares[i];
    }
    return titulares[titulares.length-1];
  }

  // Elige un nombre real al azar de la plantilla del rival concreto —
  // si por lo que sea no tiene plantilla cargada, cae en el nombre del
  // propio club para no dejar el hueco en blanco. Extraída como
  // función de nivel superior (antes vivía solo dentro de
  // generarEventosPartido) para poder reutilizarla también desde la
  // re-simulación de la segunda parte del Giro Táctico.
  function jugadorRivalAleatorio(rival){
    if(rival && rival.plantilla && rival.plantilla.length){
      const disponibles = plantillaEfectivaRival(rival);
      // Nunca el portero, y con preferencia clara por posiciones
      // ofensivas — antes se elegía entre los 11 sin ningún filtro,
      // así que el portero rival podía "marcar" con la misma
      // probabilidad que un delantero. Nada realista.
      const sinPortero = disponibles.filter(j=>j.pos!=='POR');
      const ofensivos = sinPortero.filter(j=>['DC','EI','ED','MC'].includes(j.pos));
      const pool = ofensivos.length ? ofensivos : (sinPortero.length ? sinPortero : disponibles);
      const elegido=pool[Math.floor(Math.random()*pool.length)];
      return {name: elegido.name||elegido, numero: elegido.n};
    }
    return {name: rival ? rival.name : 'Rival'};
  }
  function generarEventosPartido(resultado, miEsLocal, campoRelevante, rival){
    // "home"/"away" se refiere SIEMPRE al equipo local/visitante real del
    // partido — mi equipo puede ser cualquiera de los dos según el
    // calendario. Antes se asumía que "home" era siempre yo, así que
    // cuando jugaba fuera mis propios goleadores/tarjetas/lesiones
    // aparecían del lado del rival.
    const misLado = miEsLocal ? 'home' : 'away';
    const rivalLado = miEsLocal ? 'away' : 'home';
    const eventos=[];
    for(let i=0;i<resultado.golesA;i++){
      const goleador = miEsLocal ? elegirGoleador() : jugadorRivalAleatorio(rival);
      eventos.push({minute:5+Math.floor(Math.random()*85), team:'home', type:'goal', jugador:goleador});
    }
    for(let i=0;i<resultado.golesB;i++){
      const goleador = miEsLocal ? jugadorRivalAleatorio(rival) : elegirGoleador();
      eventos.push({minute:5+Math.floor(Math.random()*85), team:'away', type:'goal', jugador:goleador});
    }
    // Tarjetas amarillas/rojas — probabilidades subidas respecto a
    // antes (35%/35%/6%, con tope de una amarilla por equipo), que se
    // quedaban muy por debajo de la media real de un partido de liga
    // (2-4 amarillas repartidas entre los dos equipos, roja bastante
    // más habitual que 1 cada ~16 partidos). Ahora cada equipo puede
    // recibir más de una amarilla en el mismo partido (segunda tirada
    // independiente tras la primera), y las rojas suben a un ~12%.
    let amarillasMiEquipo=0, amarillasRival=0;
    if(Math.random()<0.55){
      const jugador=elegirJugadorAlineado();
      eventos.push({minute:10+Math.floor(Math.random()*78), team:misLado, type:'card', tarjeta:'amarilla', jugador: jugador||{name:state.nombreEquipo}});
      amarillasMiEquipo++;
    }
    if(Math.random()<0.55){
      eventos.push({minute:10+Math.floor(Math.random()*78), team:rivalLado, type:'card', tarjeta:'amarilla', jugador:jugadorRivalAleatorio(rival)});
      amarillasRival++;
    }
    // Segunda amarilla por equipo: bastante menos probable que la
    // primera (un partido con 2 tarjetas para el mismo equipo no es
    // lo normal, pero tampoco debe ser rarísimo).
    if(amarillasMiEquipo>0 && Math.random()<0.22){
      const jugador2=elegirJugadorAlineado();
      eventos.push({minute:10+Math.floor(Math.random()*78), team:misLado, type:'card', tarjeta:'amarilla', jugador: jugador2||{name:state.nombreEquipo}});
    }
    if(amarillasRival>0 && Math.random()<0.22){
      eventos.push({minute:10+Math.floor(Math.random()*78), team:rivalLado, type:'card', tarjeta:'amarilla', jugador:jugadorRivalAleatorio(rival)});
    }
    if(Math.random()<0.12){
      const jugador=elegirJugadorAlineado();
      eventos.push({minute:20+Math.floor(Math.random()*68), team:misLado, type:'card', tarjeta:'roja', jugador: jugador||{name:state.nombreEquipo}});
    }
    if(Math.random()<0.12){
      eventos.push({minute:20+Math.floor(Math.random()*68), team:rivalLado, type:'card', tarjeta:'roja', jugador:jugadorRivalAleatorio(rival)});
    }
    // Lesión: puede pasar DURANTE tu propio partido, no como aviso aparte
    // después de la jornada — mismo espíritu que Copa Leyendas. Existen dos
    // FAMILIAS de lesión independientes (muscular: musculares, esguinces y
    // ligamentos / ósea: fisuras, fracturas y menisco), cada una con su
    // propio riesgo de aparición y velocidad de curación, moduladas por los
    // niveles de equipo médico correspondientes (state.medicoNiveles).
    const nivelesMed=state.medicoNiveles||{};
    const bonos=state.medicoBonos||{};
    // Un césped descuidado aumenta el riesgo de lesión — se usa el estado
    // del campo relevante para este partido (el propio si juegas en casa,
    // el del rival si juegas fuera), hasta un +40% con el campo a 0.
    const factorCampo = (campoRelevante===undefined||campoRelevante===null) ? 1 : (1+Math.max(0,(100-campoRelevante))*0.004);
    // Subido de 0.18 a 0.30 — con el médico invertido (que reduce este
    // riesgo un 15% por nivel en cada familia) el jugador debe notar
    // de verdad la diferencia entre tener o no tener equipo médico; con
    // el valor anterior las lesiones eran tan raras que invertir en el
    // médico apenas cambiaba nada perceptible en una temporada.
    const riesgoBase=0.30*(bonos.riesgoLesionSiguiente||1)*factorCampo;
    if(bonos.riesgoLesionSiguiente){ state.medicoBonos.riesgoLesionSiguiente=1; } // se consume tras un partido
    const riesgoMuscular=riesgoBase*0.55*Math.pow(0.85, nivelesMed.prevencionMuscular||0);
    const riesgoOsea=riesgoBase*0.45*Math.pow(0.85, nivelesMed.prevencionOsea||0);
    if(!state.medicoNotificacion && Math.random()<(riesgoMuscular+riesgoOsea)){
      const idsAlineados=Object.values(state.alineacion||{}).filter(Boolean);
      const titularesSanos=idsAlineados.map(id=>state.plantilla.find(p=>p.id===id)).filter(p=>p && !p.injured);
      const pool = titularesSanos.length ? titularesSanos : state.plantilla.filter(p=>!p.injured);
      if(pool.length){
        const jugador=pool[Math.floor(Math.random()*pool.length)];
        const familia = Math.random()<(riesgoMuscular/(riesgoMuscular+riesgoOsea)) ? 'muscular' : 'osea';
        const TIPOS_LESION_POR_FAMILIA={
          muscular:{
            leve:['Sobrecarga muscular','Molestias en el isquiotibial','Contractura en el gemelo'],
            moderada:['Distensión muscular','Esguince de tobillo','Elongación en el aductor'],
            grave:['Rotura fibrilar','Rotura de ligamentos','Rotura del ligamento cruzado']
          },
          osea:{
            leve:['Contusión ósea en la tibia','Molestias en el pubis','Golpe óseo en el tobillo'],
            moderada:['Fisura costal','Inflamación del menisco','Golpe óseo en la rodilla'],
            grave:['Fractura de peroné','Rotura de menisco','Fisura en el metatarso']
          }
        };
        const severidades=[
          {label:'leve', weeks:1, dificultad:7},
          {label:'moderada', weeks:2, dificultad:10},
          {label:'grave', weeks:4, dificultad:13}
        ];
        let sev=severidades[Math.floor(Math.random()*severidades.length)];
        // Manos de Seda: pequeña probabilidad de que, si ha tocado
        // "grave", en realidad se quede en "moderada" — nunca mejora
        // más de un escalón, y nunca toca lesiones ya "leve".
        if(sev.label==='grave' && typeof lmSkillActiva==='function' && lmSkillActiva('lm_manos_de_seda') && Math.random()<0.30){
          sev=severidades[1];
        }
        const nivelCuracion = familia==='muscular' ? (nivelesMed.curacionMuscular||0) : (nivelesMed.curacionOsea||0);
        let weeks=Math.max(1, sev.weeks-nivelCuracion);
        const tipoLesion=TIPOS_LESION_POR_FAMILIA[familia][sev.label][Math.floor(Math.random()*TIPOS_LESION_POR_FAMILIA[familia][sev.label].length)];
        eventos.push({minute:20+Math.floor(Math.random()*65), team:misLado, type:'injury', jugador, sev:{...sev, weeks}, tipoLesion, familia});
      }
    }
    // Jugar ya lesionado ahora está permitido, pero no es gratis: hay
    // riesgo de que la lesión se agrave durante el propio partido (más
    // aún si el campo está en mal estado).
    const idsParaAgravar=Object.values(state.alineacion||{}).filter(Boolean);
    idsParaAgravar.forEach(id=>{
      const p=state.plantilla.find(x=>x.id===id);
      if(!p || !p.injured) return;
      const riesgoAgravar=0.14*factorCampo*(bonos.riesgoLesionSiguiente||1);
      if(Math.random()>=riesgoAgravar) return;
      const orden=['leve','moderada','grave'];
      const idxActual=orden.indexOf(p.injurySeverity);
      let severidadNueva=p.injurySeverity, semanasExtra=2;
      if(idxActual>=0 && idxActual<orden.length-1){
        severidadNueva=orden[idxActual+1];
        semanasExtra=severidadNueva==='grave'?3:2;
        p.injurySeverity=severidadNueva;
      }
      p.injuryWeeks=(p.injuryWeeks||0)+semanasExtra;
      if(p.lesionLogId && state.medicoHistorial){
        const entry=state.medicoHistorial.find(h=>h.id===p.lesionLogId);
        if(entry){ entry.severidad=severidadNueva; entry.semanasPrevistas=(entry.semanasPrevistas||0)+semanasExtra; }
      }
      if(state.trabajadores && state.trabajadores.medico && typeof enviarCorreo==='function' &&
         (!state.correoUltimoEnviado || state.correoUltimoEnviado.medico!==state.jornadaActual)){
        enviarCorreo('medico', tp('correo.agrava_lesion.asunto', {jugador:p.name}),
          tp('correo.agrava_lesion.cuerpo', {jugador:p.name, severidad:severidadNueva, semanas:p.injuryWeeks+' '+t('lm.jornada').toLowerCase()+(p.injuryWeeks===1?'':'s')}),
          {asunto:'correo.agrava_lesion.asunto', paramsAsunto:{jugador:p.name}, cuerpo:'correo.agrava_lesion.cuerpo', paramsCuerpo:{jugador:p.name, severidad:severidadNueva, semanas:p.injuryWeeks+' '+t('lm.jornada').toLowerCase()+(p.injuryWeeks===1?'':'s')}});
      }
    });
    // Actualizar rachas de gol: quien marca suma, el resto de titulares que
    // NO marcaron este partido pierden la racha (mismo concepto que el
    // "streak" de goleador ya usado en Copa Leyendas).
    const marcadoresIds=new Set(eventos.filter(e=>e.type==='goal'&&e.jugador).map(e=>e.jugador.id));
    // Total de goles de la temporada por jugador — a diferencia de
    // marcadoresIds (un Set, solo sirve para saber SI marcó), aquí se
    // cuenta cada gol individualmente, para poder mostrar un máximo
    // goleador real en el resumen de fin de temporada. Solo se cuentan
    // los goles de MI equipo (los del rival usan un jugador ajeno, no
    // guardado en mi plantilla).
    eventos.filter(e=>e.type==='goal' && e.team===misLado && e.jugador && e.jugador.id).forEach(e=>{
      const p=state.plantilla.find(x=>x.id===e.jugador.id);
      if(p) p.golesTemporada=(p.golesTemporada||0)+1;
    });
    const idsAlineados=Object.values(state.alineacion||{}).filter(Boolean);
    idsAlineados.forEach(id=>{
      const p=state.plantilla.find(x=>x.id===id);
      if(!p) return;
      if(marcadoresIds.has(id)) p.racha=(p.racha||0)+1;
      else p.racha=0;
    });
    eventos.sort((a,b)=>a.minute-b.minute);
    return eventos;
  }

  // Actualiza el estado del estadio (césped + satisfacción) tras jugar mi
  // partido de la jornada. El césped solo se desgasta si jugué en casa
  // (es mi terreno el que se pisa); la recuperación natural del
  // mantenimiento habitual se aplica siempre. La satisfacción sube con
  // las victorias y baja con las derrotas, agravada si el césped está
  // descuidado — tal y como se pidió: "un campo mal cuidado aumenta...
  // el descontento de la afición".
  // Asistencia al estadio — depende de la satisfacción de la afición, la
  // moral del equipo y el clima del día. Todavía solo simbólico (no
  // genera ingresos), pero deja ver de un vistazo cómo responde la
  // afición a cómo va la temporada.
  // Fracción del aforo total que queda bloqueada (sin generar
  // ingresos por entradas) porque alguna zona está en disturbios
  // graves — proporcional al tamaño de esa zona respecto al estadio
  // completo. Una zona grave se considera cerrada al público hasta
  // que se calme.
  function fraccionAforoBloqueadoPorDisturbios(){
    if(!state.disturbiosZonas) return 0;
    const areaTotal=LM_ZONAS_ESTADIO.reduce((s,z)=>s+z.w*z.h, 0);
    if(areaTotal<=0) return 0;
    return LM_ZONAS_ESTADIO.reduce((s,z)=>{
      const nivel=state.disturbiosZonas[z.id]||0;
      return nivel>=3 ? s+(z.w*z.h)/areaTotal : s;
    }, 0);
  }
  function calcularAsistencia(weatherId){
    const est=state.estadio||{};
    const aforo=est.aforoTotal||12000;
    const baseSatisfaccion=0.35+((est.satisfaccion||0)+100)/200*0.55; // 35% a 90% según satisfacción
    const bonusMoral=(state.moral||0)/50*0.08; // hasta ±8% según moral del equipo
    const penalizacionClima = weatherId ? ({sunny:0, cloudy:0, rain:0.12, wind:0.05, hot:0.08, snow:0.15}[weatherId]||0) : 0;
    // Precio de la entrada: por encima de un precio de referencia (10€)
    // cada euro de más resta asistencia — mitigado por el nivel de
    // Relaciones con la Afición del Director General (el "caché" del
    // club: cuanto más grande eres, mejor toleras subir el precio).
    const precio=state.precioEntrada===undefined?15:state.precioEntrada;
    const tolerancia=nivelDeDG('toleranciaPrecio');
    const penalizacionPrecio=Math.max(0,(precio-10))*0.012*(1-tolerancia*0.22);
    let pct=baseSatisfaccion+bonusMoral-penalizacionClima-penalizacionPrecio;
    if(state.directorGeneralBonos && state.directorGeneralBonos.boostAsistencia){ pct+=state.directorGeneralBonos.boostAsistencia; }
    pct=Math.max(0.15, Math.min(0.99, pct));
    const aforoBloqueado=fraccionAforoBloqueadoPorDisturbios();
    return {asistentes:Math.round(aforo*pct*(1-aforoBloqueado)), aforo, pct, aforoBloqueado};
  }
  // Moral del equipo (-50..50) — CALCO del rango y espíritu del sistema
  // de moral de Copa Leyendas (teamMorale), pero propio de Liga Manager:
  // sube con las victorias y baja con las derrotas, amplificado si se
  // encadenan varios resultados seguidos del mismo signo (una racha
  // pesa más que un resultado suelto).
  function actualizarMoralTrasPartido(miGoles, suGoles){
    let delta=0;
    if(miGoles>suGoles){ delta=6; state.rachaResultados=Math.max(1,(state.rachaResultados||0)+1); }
    else if(miGoles===suGoles){ delta=0; state.rachaResultados=0; }
    else { delta=-7; state.rachaResultados=Math.min(-1,(state.rachaResultados||0)-1); }
    const rachaAbs=Math.abs(state.rachaResultados||0);
    if(rachaAbs>=2){
      const extra=(rachaAbs-1)*1.5;
      delta += delta>0 ? extra : (delta<0 ? -extra : 0);
    }
    // La satisfacción de la afición también pesa en la moral del
    // vestuario — un ambiente hostil (aficionados descontentos) hace
    // mella incluso ganando, y una grada volcada anima al equipo.
    const satisfaccion=(state.estadio && state.estadio.satisfaccion) || 0;
    delta += satisfaccion/12;
    // Gestión del Vestuario: pequeño extra de moral tras una victoria
    // — complementa a todo el cuerpo técnico, no sustituye su trabajo.
    if(miGoles>suGoles && typeof lmSkillActiva==='function' && lmSkillActiva('lm_gestion_vestuario')) delta+=3;
    delta = Math.round(delta);
    // Temple Competitivo: si el partido se decide por la mínima (un gol
    // de diferencia) y vas perdiendo, la caída de moral es menor.
    if(miGoles<suGoles && (suGoles-miGoles)===1 && typeof lmSkillActiva==='function' && lmSkillActiva('lm_temple_competitivo')){
      delta=Math.round(delta*0.5);
    }
    state.ultimoCambioMoral = delta;
    state.moral=Math.max(-50, Math.min(50, (state.moral||0)+delta));
  }

  function actualizarEstadioTrasPartido(miEsLocal, resultado, clima){
    if(!state.estadio) state.estadio={campo:90, satisfaccion:10, aforoTotal:12000, ultimaAsistencia:null};
    const est=state.estadio;
    // La asistencia se calcula ANTES de actualizar satisfacción/moral con
    // el resultado de hoy — refleja quién decidió venir sabiendo cómo
    // estaban las cosas hasta el partido anterior, no el resultado que
    // aún no se conocía.
    if(miEsLocal){
      const asistenciaInfo=calcularAsistencia(clima?clima.id:null);
      est.ultimaAsistencia={...asistenciaInfo, jornada:state.jornadaActual};
      if(typeof window.unlockLMAchievement==='function' && asistenciaInfo.asistentes>=est.aforoTotal) window.unlockLMAchievement('lm_full_stadium', false);
      if(state.directorGeneralBonos && state.directorGeneralBonos.boostAsistencia){ state.directorGeneralBonos.boostAsistencia=0; }
      const precio=state.precioEntrada===undefined?15:state.precioEntrada;
      const ingresoEntradas=asistenciaInfo.asistentes*precio;
      const ingresoMerch=Math.round(asistenciaInfo.asistentes*(2+nivelDeDG('ingresoMerchandising')*1.5));
      state.capital=Math.round((state.capital||0)+ingresoEntradas+ingresoMerch);
      registrarMovimientoFinanciero('Entradas', ingresoEntradas, state.jornadaActual);
      registrarMovimientoFinanciero('Merchandising', ingresoMerch, state.jornadaActual);
    }
    const campoAntes=est.campo;
    if(miEsLocal && clima){
      const desgasteBase={sunny:10, cloudy:6, rain:20, wind:11, hot:16, snow:19}[clima.id] || 6;
      const reduccion=nivelDeM('prevencionDesgaste')*1.4;
      const desgaste=Math.max(0, desgasteBase-reduccion);
      est.campo=Math.max(0, est.campo-desgaste);
    }
    const recuperacion=1+nivelDeM('recuperacionCesped')*2;
    est.campo=Math.min(100, Math.round(est.campo+recuperacion));
    state.ultimoCambioCampo=Math.round(est.campo-campoAntes);

    const miGoles = miEsLocal ? resultado.golesA : resultado.golesB;
    const suGoles = miEsLocal ? resultado.golesB : resultado.golesA;
    const boostVictoria=1+nivelDeM('boostSatisfaccion')*0.25;
    const proteccion=1-nivelDeM('proteccionSatisfaccion')*0.2;
    let delta=0;
    const margen=miGoles-suGoles;
    if(margen>0) delta=(14+Math.min(margen-1,3)*4)*boostVictoria; // gana: 14 base, más cuanto más goleada
    else if(margen===0) delta=1;
    else delta=(-18-Math.min(-margen-1,3)*4)*proteccion; // pierde: -18 base, más cuanto más goleada en contra
    if(est.campo<40) delta-=(40-est.campo)*0.15*proteccion;
    if(delta<0 && state.mantenimientoBonos && state.mantenimientoBonos.amortiguarPerdida){
      delta*=0.5;
      state.mantenimientoBonos.amortiguarPerdida=false;
    }
    // Bajar mucho el precio de la entrada es un gesto que la afición
    // agradece — cuanto más por debajo de los 15€ de referencia, mayor
    // el extra de satisfacción (con tope para no desequilibrar).
    const precioActual=state.precioEntrada===undefined?15:state.precioEntrada;
    if(precioActual<15){
      delta += Math.min(15, (15-precioActual)*1.2);
    }
    delta=Math.round(delta);
    state.ultimoCambioSatisfaccion=delta;
    est.satisfaccion=Math.max(-100, Math.min(100, est.satisfaccion+delta));
    actualizarMoralTrasPartido(miGoles, suGoles);
    if(miEsLocal){ try{ procesarDisturbiosTrasPartido(); }catch(e){ console.error('procesarDisturbiosTrasPartido:', e); } }
  }

  // ============================================================
  // El visor de partido en Modo Manager vive en su propio archivo
  // (liga-manager-partido-visor.js), igual que los dados 3D — aquí
  // solo se le pasan las piezas que necesita de este módulo.
  function abrirVisorPartidoManager(info, onFinish){
    if(typeof window.G2G_abrirVisorPartidoManager!=='function') return;
    window.G2G_abrirVisorPartidoManager(info, onFinish, {
      state, t, formacionActual, generarSlotsFormacion, climaDelPartido, calcularStatsEquipo, plantillaEfectivaRival, crestHTML, rivalCrestHTML, mostrarHistoricoPartido,
      guardarEstado, getMaxGiroTacticoLM, jugadorRivalAleatorio, elegirGoleador, elegirJugadorAlineado
    });
  }


  // ---------- Sustitución automática por sanción de tarjetas ----------
  // Un jugador sancionado (amarillasAcumuladas>=5 o roja) NUNCA debe
  // disputar el partido ni contar en la media del once titular — su
  // hueco debe cubrirlo el mejor jugador disponible del banquillo, o
  // quedarse vacío si no hay ninguno elegible. Se detecta y se resuelve
  // aquí mismo, con una pequeña interfaz de confirmación, justo antes
  // de que jugarJornada() simule el partido — así el resto del motor
  // (goleador, tarjetas, riesgo de lesión, medias, etc.) ni siquiera
  // necesita saber que existió una sanción: para cuando se juega, ese
  // jugador simplemente ya no está en state.alineacion.
  function titularesSancionadosEnAlineacion(){
    const resultado=[];
    Object.keys(state.alineacion||{}).forEach(slot=>{
      const pid=state.alineacion[slot];
      if(!pid) return;
      const jugador=(state.plantilla||[]).find(p=>p.id===pid);
      if(jugador && jugador.suspendido) resultado.push({slot, jugador});
    });
    return resultado;
  }

  function mejorReemplazoParaSlot(slot, excluirIds){
    const posGenerica=basePos(slot);
    const titularIds=new Set(Object.values(state.alineacion||{}).filter(Boolean));
    const candidatos=(state.plantilla||[]).filter(p=>
      !titularIds.has(p.id) && !p.injured && !p.suspendido && !excluirIds.has(p.id)
    );
    if(!candidatos.length) return null;
    const mismaPosicion=candidatos.filter(p=>p.position===posGenerica);
    const pool=mismaPosicion.length?mismaPosicion:candidatos;
    return pool.reduce((mejor,p)=>(!mejor || efectivoOverall(p)>efectivoOverall(mejor)) ? p : mejor, null);
  }

  // Popup "AAA" de sustitución: enseña, para cada sancionado, quién sale
  // y la mejor opción sugerida para entrar (ya calculada), con un único
  // botón para aplicar todos los cambios de golpe y continuar hacia el
  // partido. Si no hay ningún sancionado en el once, se salta del todo
  // y llama a onListo() de inmediato.
  function mostrarPopupSancionesAntesDeJugar(onListo){
    const sancionados=titularesSancionadosEnAlineacion();
    if(!sancionados.length){ onListo(); return; }
    const usadosComoRefuerzo=new Set();
    const propuestas=sancionados.map(({slot,jugador})=>{
      const reemplazo=mejorReemplazoParaSlot(slot, usadosComoRefuerzo);
      if(reemplazo) usadosComoRefuerzo.add(reemplazo.id);
      return {slot, jugador, reemplazo};
    });
    const overlay=document.createElement('div');
    overlay.id='lmSancionSustitucionOverlay';
    overlay.className='lm-visor-leyenda-overlay-standalone';
    document.body.appendChild(overlay);
    overlay.innerHTML=`
      <div class="lm-dilemma-card lm-sancion-sustitucion-card" style="max-width:420px;text-align:left">
        <div class="lm-dilemma-title" style="justify-content:center;text-align:center"><i class="ph ph-bold ph-flag-banner-fold" style="color:#e24b4a"></i> ${t('lm.sancion_sustitucion_titulo')}</div>
        <p class="lm-setup-desc" style="text-align:center;margin:0 0 10px">${t('lm.sancion_sustitucion_desc')}</p>
        <div class="lm-sancion-lista">
          ${propuestas.map(p=>`
            <div class="lm-sancion-fila">
              <div class="lm-sancion-fila-sale"><i class="ph ph-bold ph-x-circle"></i> <span>${p.jugador.name}</span><span class="lm-sancion-fila-tag">${t('lm.sancionado_tag')}</span></div>
              <i class="ph ph-bold ph-arrow-down lm-sancion-fila-flecha"></i>
              <div class="lm-sancion-fila-entra">${p.reemplazo?`<i class="ph ph-bold ph-check-circle"></i> <span>${p.reemplazo.name}</span><span class="lm-sancion-fila-overall">${efectivoOverall(p.reemplazo)}</span>`:`<span class="lm-sancion-sin-reemplazo">${t('lm.sin_sustituto_disponible')}</span>`}</div>
            </div>`).join('')}
        </div>
        <div class="lm-popup-actions"><button id="lmAplicarSancionBtn" class="mode-card-btn mode-card-btn-gold">${t('lm.aplicar_cambios_btn')}</button></div>
      </div>`;
    const btn=document.getElementById('lmAplicarSancionBtn');
    if(btn) btn.addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      propuestas.forEach(p=>{
        if(p.reemplazo){ state.alineacion[p.slot]=p.reemplazo.id; }
        else { delete state.alineacion[p.slot]; }
      });
      guardarEstado();
      overlay.remove();
      onListo();
    });
  }

  function jugarJornada(){
    if(state.jornadaActual>38) return null;
    actualizarUsosGiroTacticoLM();
    const j=state.jornadaActual-1;
    const jornada=state.calendario[j];
    let miPartidoInfo=null;
    let jugadorLesionadoEstaJornada=null;
    const jugadoresSancionadosEstaJornada=new Set();
    const clima=climaDelPartido();
    jornada.forEach(partido=>{
      const key=j+'-'+partido.home.id+'-'+partido.away.id;
      if(state.resultados[key]) return;
      const esMiPartido = partido.home.id==='lm_0' || partido.away.id==='lm_0';
      let contexto=null, campoRelevante=null, miEsLocalDeEste=null;
      if(esMiPartido){
        miEsLocalDeEste = partido.home.id==='lm_0';
        campoRelevante = miEsLocalDeEste ? (state.estadio?state.estadio.campo:100) : campoRivalEstimado(miEsLocalDeEste?partido.away:partido.home);
        contexto = {
          climaId: clima ? clima.id : null,
          campoAnfitrion: campoRelevante,
          anfitrionA: miEsLocalDeEste,
          esMiEquipoA: miEsLocalDeEste,
          moralBonus: ((state.moral||0)/50)*0.08,
          tacticaBoost: state.tacticaBoostProximoPartido ? 0.06 : 0,
        };
        // El boost de la sesión táctica es de un solo uso — se
        // consume aquí mismo, justo al construir el contexto de MI
        // partido, para que nunca se aplique dos veces por error.
        if(state.tacticaBoostProximoPartido) state.tacticaBoostProximoPartido=false;
      }
      const resultado=simularPartido(partido.home, partido.away, contexto);
      state.resultados[key]=resultado;
      if(esMiPartido){
        const rivalDeEstePartido = miEsLocalDeEste ? partido.away : partido.home;
        const eventos=generarEventosPartido(resultado, miEsLocalDeEste, campoRelevante, rivalDeEstePartido);
        // Aplicar la lesión generada (si la hay) al estado real del jugador
        const evInjury=eventos.find(e=>e.type==='injury');
        if(evInjury){
          evInjury.jugador.injured=true;
          evInjury.jugador.injuryWeeks = evInjury.sev.weeks;
          evInjury.jugador.injurySeverity=evInjury.sev.label;
          evInjury.jugador.injuryFamilia=evInjury.familia;
          jugadorLesionadoEstaJornada=evInjury.jugador.id;
          state.medicoNotificacion={jugadorId:evInjury.jugador.id, dificultad:evInjury.sev.dificultad, severidad:evInjury.sev.label};
          const rivalDeEsta = partido.home.id==='lm_0' ? partido.away.name : partido.home.name;
          evInjury.jugador.lesionLogId=registrarLesionHistorial(evInjury.jugador, evInjury.sev, evInjury.tipoLesion, rivalDeEsta, evInjury.familia);
          if(typeof window.unlockLMAchievement==='function') window.unlockLMAchievement('lm_first_injury', false);
        }
        // Aplicar tarjetas MÍAS al estado real del jugador — reglas de
        // La Liga: 5 amarillas acumuladas = 1 partido de sanción (el
        // contador se reinicia al sancionar), roja directa = 1
        // partido de sanción inmediata. Antes las tarjetas eran solo
        // un evento cosmético del visor, sin ningún efecto real.
        // "misLado" es la etiqueta 'home'/'away' que usa
        // generarEventosPartido() para marcar de quién es cada
        // evento — se recalcula aquí con el mismo criterio
        // (miEsLocalDeEste), porque esa variable vive dentro de esa
        // OTRA función y no está disponible en este ámbito.
        const misLadoJornada = miEsLocalDeEste ? 'home' : 'away';
        eventos.filter(e=>e.type==='card' && e.team===misLadoJornada && e.jugador && e.jugador.id).forEach(evCard=>{
          const j=evCard.jugador;
          if(evCard.tarjeta==='amarilla'){
            j.amarillasAcumuladas=(j.amarillasAcumuladas||0)+1;
            if(j.amarillasAcumuladas>=5){
              j.amarillasAcumuladas=0;
              j.suspendido=true; j.partidosSancion=(j.partidosSancion||0)+1;
              jugadoresSancionadosEstaJornada.add(j.id);
              if(typeof enviarCorreo==='function') enviarCorreo('preparadorFisico',
                tp('correo.sancion_tarjetas.asunto',{jugador:j.name}),
                tp('correo.sancion_tarjetas.cuerpo',{jugador:j.name, n:j.partidosSancion}),
                {asunto:'correo.sancion_tarjetas.asunto', paramsAsunto:{jugador:j.name}, cuerpo:'correo.sancion_tarjetas.cuerpo', paramsCuerpo:{jugador:j.name, n:j.partidosSancion}});
            }
          } else if(evCard.tarjeta==='roja'){
            j.suspendido=true; j.partidosSancion=(j.partidosSancion||0)+1;
            jugadoresSancionadosEstaJornada.add(j.id);
            if(typeof enviarCorreo==='function') enviarCorreo('preparadorFisico',
              tp('correo.sancion_roja.asunto',{jugador:j.name}),
              tp('correo.sancion_roja.cuerpo',{jugador:j.name, n:j.partidosSancion}),
              {asunto:'correo.sancion_roja.asunto', paramsAsunto:{jugador:j.name}, cuerpo:'correo.sancion_roja.cuerpo', paramsCuerpo:{jugador:j.name, n:j.partidosSancion}});
          }
        });
        miPartidoInfo={ home:partido.home, away:partido.away, resultado, eventos, climaId: clima?clima.id:null, jornadaIndex:j };
        actualizarEstadioTrasPartido(miEsLocalDeEste, resultado, clima);
        const misGoles=miEsLocalDeEste?resultado.golesA:resultado.golesB, susGoles=miEsLocalDeEste?resultado.golesB:resultado.golesA;
        // Se resuelve aquí, en el origen común de los dos modos de
        // visualización — antes solo se resolvía dentro del código
        // específico del modo automático, así que en modo manager la
        // predicción de la rueda de prensa nunca se comprobaba: ni
        // afectaba a la moral, ni aparecía en el resumen ni en el
        // histórico del partido. Llamarla aquí también es segura para
        // el modo automático (que la vuelve a llamar más abajo), ya
        // que resolverPrensaLM no hace nada si ya se había resuelto.
        state._prensaResueltaEstePartido=false;
        resolverPrensaLM(misGoles, susGoles);
        if(typeof window.unlockLMAchievement==='function'){
          window.unlockLMAchievement('lm_first_match', false);
          if(misGoles>susGoles){
            window.unlockLMAchievement('lm_first_win', false);
            if(susGoles===0) window.unlockLMAchievement('lm_clean_sheet', false);
            if((state.rachaResultados||0)+1>=3) window.unlockLMAchievement('lm_win_streak_3', false);
          }
        }
        // La quiniela ya no se genera cada 3 victorias — ahora es el
        // propio nodo del árbol semanal el que la genera y la abre,
        // una vez por jornada (ver aplicarEfectoNodoSemana, caso
        // 'quiniela').
      }
    });

    // Fondo de dados: se resetea cada jornada — los que no se usaron en
    // la jornada anterior se pierden (use-it-or-lose-it, ya definido).
    // Médico y Mantenimiento COMPARTEN este mismo fondo de dados: hay que
    // repartir entre las dos plantillas de cartas cada partido.
    state.diceAvailable = lmDicePoolPorPartido();
    state.medicoCambiosUsados = 0;
    state.mantenimientoCambiosUsados = 0;
    state.directorGeneralCambiosUsados = 0;
    state.directorDeportivoCambiosUsados = 0;
    state.preparadorFisicoCambiosUsados = 0;
    state.dadoRerollsDisponibles = lmRerollsPorPartido();
    // Cada partido trae caras nuevas: la mano de cartas de los 5
    // departamentos se renueva por completo (respetando las que ya
    // están agotadas por haber llegado a nivel máximo).
    state.medicoCartas = inicializarCartasMedico();
    state.mantenimientoCartas = inicializarCartasMantenimiento();
    state.directorGeneralCartas = inicializarCartasDG();
    state.directorDeportivoCartas = inicializarCartasDD();
    state.preparadorFisicoCartas = inicializarCartasPF();

    // Nómina mensual — se cobra una vez al entrar en cada mes (cada 4
    // jornadas: J1, J5, J9...), jugadores + los 4 departamentos técnicos.
    const mesDeEstaJornada=Math.floor((state.jornadaActual-1)/4)+1;
    if(mesDeEstaJornada>(state.mesesPagados||0)){
      aplicarNominaMensual();
      state.mesesPagados=mesDeEstaJornada;
      try{ comprobarInsolvenciaGrave(); }catch(e){ console.error('comprobarInsolvenciaGrave:', e); }
    }
    if(mesDeEstaJornada>(state.mesTrabajadoresGenerado||0)){
      regenerarCandidatosTrabajo();
      state.mesTrabajadoresGenerado=mesDeEstaJornada;
      enviarCorreo('directorGeneral', t('correo.nuevos_candidatos.asunto'),
        t('correo.nuevos_candidatos.cuerpo'),
        {asunto:'correo.nuevos_candidatos.asunto', cuerpo:'correo.nuevos_candidatos.cuerpo'});
      state.correoInterno[0].tipoEspecial='nuevos_candidatos';
    }

    state.plantilla.forEach(p=>{
      if(p.id===jugadorLesionadoEstaJornada) return; // se acaba de lesionar ahora mismo: su cuenta atrás empieza la próxima jornada, no esta
      if(p.injured && p.injuryWeeks>0){
        p.injuryWeeks--;
        if(p.injuryWeeks<=0){
          p.injured=false; p.injurySeverity=null;
          cerrarLesionHistorial(p, 'Tiempo natural');
        }
      }
      // Sanción por tarjetas: se descuenta un partido cumplido cada vez
      // que se resuelve una jornada — antes las tarjetas eran solo
      // cosméticas (se veían en el visor pero nunca se acumulaban ni
      // causaban ninguna sanción real, por eso nunca se veían
      // reflejadas en la plantilla). Igual que con la lesión, si la
      // sanción se acaba de imponer ESTA misma jornada, su cuenta
      // atrás empieza la próxima, no ahora mismo.
      if(jugadoresSancionadosEstaJornada.has(p.id)) return;
      if(p.suspendido && p.partidosSancion>0){
        p.partidosSancion--;
        if(p.partidosSancion<=0) p.suspendido=false;
      }
    });

    // Fatiga real — CALCO del concepto de applyMatchFatigue() de Copa
    // Leyendas: quien ha jugado esta jornada (los 11 del campo) pierde
    // resistencia (el portero apenas se cansa, los centrales son los que
    // menos corren), y quien se queda en el banquillo recupera del todo.
    // El efecto del calendario de entrenamiento (entrenar cansa, descansar
    // recupera) ya se resuelve antes, en procesarEntrenamientoSemanal(),
    // así se nota en el acto y no hay que esperar a jugar el partido.
    if(miPartidoInfo){
      const titularIdsJornada=new Set(Object.values(state.alineacion||{}).filter(Boolean));
      const factorResistencia=1-nivelDePF('resistenciaBase')*0.12;
      // Discurso Motivador: pequeño extra de recuperación tras CADA
      // partido, encima de lo que ya da el Preparador Físico — nunca
      // sustituye su plan, solo lo complementa.
      const recuperacionExtra=nivelDePF('recuperacionSemanal')*5 + ((typeof lmSkillActiva==='function' && lmSkillActiva('lm_discurso_motivador')) ? 4 : 0);
      state.plantilla.forEach(p=>{
        const actual=(p.fatigue===undefined)?100:p.fatigue;
        if(!titularIdsJornada.has(p.id)){ p.fatigue=100; return; }
        if(p.position==='POR'){ p.fatigue=Math.max(0, Math.min(100, Math.round(actual-(2+Math.random()*4)*factorResistencia+recuperacionExtra))); return; }
        let loss=8+Math.random()*6;
        if(p.position==='DFC') loss*=0.65;
        p.fatigue=Math.max(0, Math.min(100, Math.round(actual-loss*factorResistencia+recuperacionExtra)));
      });
    }

    // Blindado: un fallo aquí (correo/ofertas) NUNCA debe impedir que la
    // jornada avance — antes un error sin capturar aquí dejaba todo el
    // juego bloqueado sin ningún aviso.
    try{ procesarOfertasTraspaso(); }catch(e){ console.error('procesarOfertasTraspaso:', e); }
    try{ generarCorreosTrasJornada(); }catch(e){ console.error('generarCorreosTrasJornada:', e); }
    try{ resolverQuinielaSiToca(j); }catch(e){ console.error('resolverQuinielaSiToca:', e); }
    try{ procesarCuotaPrestamo(); }catch(e){ console.error('procesarCuotaPrestamo:', e); }

    state.jornadaActual++;
    // Red de seguridad: si la temporada acaba de terminar y quedara
    // saldo de préstamo pendiente (no debería, ver
    // paquetesPrestamoDisponibles(), pero por si acaso), se liquida de
    // golpe aquí — nunca es posible "correr el reloj" para librarse de
    // una deuda.
    if(state.jornadaActual>38){ try{ saldarPrestamoFinTemporada(); }catch(e){ console.error('saldarPrestamoFinTemporada:', e); } }
    if(typeof window.unlockLMAchievement==='function'){
      try{
        const clasif=calcularClasificacion();
        const miPos=clasif.findIndex(t=>t.id==='lm_0')+1;
        const misDatos=clasif.find(t=>t.id==='lm_0');
        // Rastreo para el Ave Fénix: si en algún momento de la
        // temporada se estuvo en zona de descenso, se marca aquí —
        // reiniciado al empezar cada temporada nueva.
        if(miPos>=18) state.estuvoEnDescensoEstaTemporada=true;
        if(miPos>0 && miPos<=4) window.unlockLMAchievement('lm_top4', false);
        if(misDatos && misDatos.pg>=10) window.unlockLMAchievement('lm_win_10', false);
        if(misDatos && misDatos.pg>=5) window.unlockLMAchievement('lm_5_wins', false);
        if(misDatos && misDatos.pg>=20) window.unlockLMAchievement('lm_20_wins', false);
        if(misDatos && misDatos.gf>=10) window.unlockLMAchievement('lm_10_goals', false);
        // Resultado del partido que se acaba de jugar — primer gol,
        // primera derrota, primer empate.
        if(miPartidoInfo){
          const miEsLocalDeEste2 = miPartidoInfo.home.id==='lm_0';
          const misGolesDeEste = miEsLocalDeEste2 ? miPartidoInfo.resultado.golesA : miPartidoInfo.resultado.golesB;
          const rivalGolesDeEste = miEsLocalDeEste2 ? miPartidoInfo.resultado.golesB : miPartidoInfo.resultado.golesA;
          if(misGolesDeEste>0) window.unlockLMAchievement('lm_first_goal', false);
          if(misGolesDeEste<rivalGolesDeEste) window.unlockLMAchievement('lm_first_defeat', false);
          if(misGolesDeEste===rivalGolesDeEste) window.unlockLMAchievement('lm_first_draw', false);
          // Gol en el descuento que decide una victoria — minuto 85+.
          if(misGolesDeEste>rivalGolesDeEste){
            const miLadoEste = miEsLocalDeEste2 ? 'home' : 'away';
            const huboGolTardio=(miPartidoInfo.eventos||[]).some(e=>e.type==='goal' && e.team===miLadoEste && e.minute>=85);
            if(huboGolTardio) window.unlockLMAchievement('lm_gol_ultimo_minuto', false);
          }
        }
        // Racha sin perder — reutiliza state.rachaResultados, que ya se
        // actualiza en otro punto tras cada partido.
        if(state.rachaResultados>=5) window.unlockLMAchievement('lm_undefeated_5', false);
        // Jornadas seguidas sin ninguna lesión — se reinicia en cuanto
        // hay una (jugadorLesionadoEstaJornada, ya calculado más
        // arriba en esta misma función).
        if(jugadorLesionadoEstaJornada) state.jornadasSinLesion=0;
        else state.jornadasSinLesion=(state.jornadasSinLesion||0)+1;
        if(state.jornadasSinLesion>=4) window.unlockLMAchievement('lm_no_injuries_month', false);
        // Cuerpo técnico y estadio — comprobables directamente desde el
        // estado en cualquier momento, no solo tras jugar.
        const rolesContratados=['medico','mantenimiento','directorGeneral','directorDeportivo','preparadorFisico'].filter(r=>state.trabajadores && state.trabajadores[r]);
        if(rolesContratados.length>=5) window.unlockLMAchievement('lm_all_departments', false);
        // Departamento de élite: TODAS las pistas de nivel de un mismo
        // departamento en el máximo a la vez (no basta con una sola).
        const deptosNiveles=[state.medicoNiveles, state.mantenimientoNiveles, state.directorGeneralNiveles, state.directorDeportivoNiveles, state.preparadorFisicoNiveles];
        if(deptosNiveles.some(niv=>niv && Object.values(niv).length>0 && Object.values(niv).every(n=>n>=NIVEL_MAXIMO_EQUIPO))) window.unlockLMAchievement('lm_max_level_dept', false);
        // Estadio de primer nivel: césped y satisfacción prácticamente
        // al máximo a la vez (no existe un "nivel 1-5" único de
        // estadio como tal — esta es la aproximación más fiel).
        if(state.estadio && state.estadio.campo>=99 && state.estadio.satisfaccion>=99) window.unlockLMAchievement('lm_stadium_max', false);
        // Cuentas saneadas: simplificación deliberada de "cierra un mes
        // en positivo" — se comprueba el capital actual cada vez que
        // se juega, no solo en el límite exacto de cada mes.
        if((state.capital||0)>=0) window.unlockLMAchievement('lm_positive_balance', false);
        if(state.estadio && rolesContratados.length>=5){ /* estadio de nivel máximo: pendiente de una comprobación fiable, no bloquea el resto */ }
        if(state.jornadaActual>38){
          window.unlockLMAchievement('lm_season_complete', false);
          if(miPos===1){
            window.unlockLMAchievement('lm_champion', false);
            // Dinastía: 2 ligas ganadas con el mismo club — solo tiene
            // sentido contarlo si la partida sigue viva (se continúa
            // con progreso), nunca si se empieza una liga nueva desde
            // cero, que ya seria otro club.
            state.titulosGanados=(state.titulosGanados||0)+1;
            if(state.titulosGanados>=2) window.unlockLMAchievement('lm_dynasty', false);
          }
          if(miPos<=10) window.unlockLMAchievement('lm_top_half', false);
          if(misDatos && misDatos.pp===0) window.unlockLMAchievement('lm_perfect_season', false);
          // Ave Fénix: estuvo en descenso en algún momento de esta
          // misma temporada y ha terminado fuera de esa zona.
          if(state.estuvoEnDescensoEstaTemporada && miPos<18) window.unlockLMAchievement('lm_fenix_liga', false);
          state.estuvoEnDescensoEstaTemporada=false;
        }
      }catch(e){}
    }
    guardarEstado();
    return miPartidoInfo;
  }

  /* ---------- 8a. Herramienta de desarrollo (SOLO cuenta jesuslor85@gmail.com):
     simula al instante, sin ninguna interfaz de partido, todas las jornadas
     que quedan hasta dejar la liga justo en la ÚLTIMA jornada (38) sin
     jugar todavía. Todos los partidos de todos los equipos se resuelven al
     azar con el mismo motor (simularPartido), EXCEPTO los de mi equipo,
     cuyo resultado se fuerza a victoria o derrota (marcador aleatorio
     dentro de ese resultado forzado). No reproduce el resto de sistemas
     de una jornada normal (fichas médicas, nómina, correo, fatiga...) —
     es una herramienta de depuración, no una simulación fiel jornada a
     jornada. ---------- */
  function lmDevSimularHastaUltimaJornada(forzar){
    // forzar: 'ganar' | 'perder'
    const ULTIMA_SIN_JUGAR = 38; // se deja esta jornada sin resolver
    for(let j=state.jornadaActual-1; j<ULTIMA_SIN_JUGAR-1; j++){
      const jornada=state.calendario[j];
      if(!jornada) break;
      jornada.forEach(partido=>{
        const key=j+'-'+partido.home.id+'-'+partido.away.id;
        if(state.resultados[key]) return;
        const miEsLocal = partido.home.id==='lm_0';
        const esMiPartido = miEsLocal || partido.away.id==='lm_0';
        let resultado;
        if(esMiPartido){
          let misGoles, susGoles;
          if(forzar==='ganar'){
            misGoles=1+Math.floor(Math.random()*4);
            susGoles=Math.floor(Math.random()*misGoles);
          }else{
            susGoles=1+Math.floor(Math.random()*4);
            misGoles=Math.floor(Math.random()*susGoles);
          }
          resultado = miEsLocal ? {golesA:misGoles,golesB:susGoles,posesionA:50,posesionB:50} : {golesA:susGoles,golesB:misGoles,posesionA:50,posesionB:50};
        }else{
          resultado = simularPartido(partido.home, partido.away, null);
        }
        state.resultados[key]=resultado;
      });
    }
    state.jornadaActual = ULTIMA_SIN_JUGAR;
    guardarEstado();
    render();
  }

  /* ---------- 8b. Partido en vivo — CALCO exacto de Copa Leyendas: mismas
     clases CSS (.match-modal/.match-header/.match-side/.match-team-name/
     .match-scoreline), dos tiempos claramente separados con descanso,
     goles con goleador real, lesiones durante el propio partido, y
     badge de racha (🔥) si el goleador lleva varios partidos marcando. ---------- */
  // Vista rápida de la semana antes del partido — avanza sola día a día
  // (mismo espíritu que el minutero del partido en vivo, pero con los
  // días de la semana), mostrando qué ha pasado en cada uno según el
  // calendario. Al llegar al final, hay que pulsar para jugar el partido.
  const DIAS_LARGO_KEYS=['lm.dia_domingo','lm.dia_lunes','lm.dia_martes','lm.dia_miercoles','lm.dia_jueves','lm.dia_viernes','lm.dia_sabado'];
  function diaLargo(idx){ return t(DIAS_LARGO_KEYS[idx]); }
  // Rueda de prensa de Liga Manager — MISMA mecánica e interfaz que Copa
  // Leyendas (mismas clases CSS .press-modal, mismo temporizador de 8s),
  // pero con preguntas reescritas para encajar en el contexto de una
  // liga regular (jornadas, clasificación, rival concreto) en vez de un
  // torneo de eliminatorias. check(r) se evalúa después del partido
  // contra {myGoals, oppGoals, draw}.
  const LM_PRESS_EVENTS=[
    { get q(){return t('lm.prensa.q1');}, answers:[
      { get text(){return t('lm.prensa.q1.a1');}, stance:'positive', get label(){return t('lm.prensa.q1.a1_label');}, check:(r)=>r.oppGoals===0 },
      { get text(){return t('lm.prensa.q1.a2');}, stance:'neutral', get label(){return t('lm.prensa.q1.a2_label');}, check:()=>null },
      { get text(){return t('lm.prensa.q1.a3');}, stance:'negative', get label(){return t('lm.prensa.q1.a3_label');}, check:(r)=>r.oppGoals>0 },
    ]},
    { get q(){return t('lm.prensa.q2');}, answers:[
      { get text(){return t('lm.prensa.q2.a1');}, stance:'positive', get label(){return t('lm.prensa.q2.a1_label');}, check:(r)=>(r.myGoals-r.oppGoals)>=3 },
      { get text(){return t('lm.prensa.q2.a2');}, stance:'neutral', get label(){return t('lm.prensa.q2.a2_label');}, check:()=>null },
      { get text(){return t('lm.prensa.q2.a3');}, stance:'negative', get label(){return t('lm.prensa.q2.a3_label');}, check:(r)=>(r.myGoals-r.oppGoals)<3 },
    ]},
    { get q(){return t('lm.prensa.q3');}, answers:[
      { get text(){return t('lm.prensa.q3.a1');}, stance:'positive', get label(){return t('lm.prensa.q3.a1_label');}, check:(r)=>r.myGoals>r.oppGoals },
      { get text(){return t('lm.prensa.q3.a2');}, stance:'neutral', get label(){return t('lm.prensa.q3.a2_label');}, check:()=>null },
      { get text(){return t('lm.prensa.q3.a3');}, stance:'negative', get label(){return t('lm.prensa.q3.a3_label');}, check:(r)=>r.myGoals<=r.oppGoals },
    ]},
    { get q(){return t('lm.prensa.q4');}, answers:[
      { get text(){return t('lm.prensa.q4.a1');}, stance:'positive', get label(){return t('lm.prensa.q4.a1_label');}, check:(r)=>r.myGoals>0 },
      { get text(){return t('lm.prensa.q4.a2');}, stance:'neutral', get label(){return t('lm.prensa.q4.a2_label');}, check:()=>null },
      { get text(){return t('lm.prensa.q4.a3');}, stance:'negative', get label(){return t('lm.prensa.q4.a3_label');}, check:(r)=>r.myGoals===0 },
    ]},
    { get q(){return t('lm.prensa.q5');}, answers:[
      { get text(){return t('lm.prensa.q5.a1');}, stance:'positive', get label(){return t('lm.prensa.q5.a1_label');}, check:(r)=>r.myGoals>=r.oppGoals },
      { get text(){return t('lm.prensa.q5.a2');}, stance:'neutral', get label(){return t('lm.prensa.q5.a2_label');}, check:()=>null },
      { get text(){return t('lm.prensa.q5.a3');}, stance:'negative', get label(){return t('lm.prensa.q5.a3_label');}, check:(r)=>r.oppGoals>r.myGoals },
    ]},
    { get q(){return t('lm.prensa.q6');}, answers:[
      { get text(){return t('lm.prensa.q6.a1');}, stance:'positive', get label(){return t('lm.prensa.q6.a1_label');}, check:(r)=>r.myGoals>r.oppGoals },
      { get text(){return t('lm.prensa.q6.a2');}, stance:'neutral', get label(){return t('lm.prensa.q6.a2_label');}, check:()=>null },
      { get text(){return t('lm.prensa.q6.a3');}, stance:'negative', get label(){return t('lm.prensa.q6.a3_label');}, check:(r)=>r.myGoals<r.oppGoals },
    ]},
    { get q(){return t('lm.prensa.q7');}, answers:[
      { get text(){return t('lm.prensa.q7.a1');}, stance:'positive', get label(){return t('lm.prensa.q7.a1_label');}, check:(r)=>r.myGoals>1 },
      { get text(){return t('lm.prensa.q7.a2');}, stance:'neutral', get label(){return t('lm.prensa.q7.a2_label');}, check:()=>null },
      { get text(){return t('lm.prensa.q7.a3');}, stance:'negative', get label(){return t('lm.prensa.q7.a3_label');}, check:(r)=>r.myGoals<=1 },
    ]},
    { get q(){return t('lm.prensa.q8');}, answers:[
      { get text(){return t('lm.prensa.q8.a1');}, stance:'positive', get label(){return t('lm.prensa.q8.a1_label');}, check:(r)=>r.oppGoals<2 },
      { get text(){return t('lm.prensa.q8.a2');}, stance:'neutral', get label(){return t('lm.prensa.q8.a2_label');}, check:()=>null },
      { get text(){return t('lm.prensa.q8.a3');}, stance:'negative', get label(){return t('lm.prensa.q8.a3_label');}, check:(r)=>r.oppGoals>=2 },
    ]},
    { get q(){return t('lm.prensa.q9');}, answers:[
      { get text(){return t('lm.prensa.q9.a1');}, stance:'positive', get label(){return t('lm.prensa.q9.a1_label');}, check:(r)=>!r.draw },
      { get text(){return t('lm.prensa.q9.a2');}, stance:'neutral', get label(){return t('lm.prensa.q9.a2_label');}, check:()=>null },
      { get text(){return t('lm.prensa.q9.a3');}, stance:'negative', get label(){return t('lm.prensa.q9.a3_label');}, check:(r)=>r.draw },
    ]},
  ];
  // Devuelve una pregunta al azar, ya con el nombre del rival incrustado
  // donde corresponde, para que la entrevista se sienta específica de
  // ese partido concreto.
  function elegirPreguntaPrensaLM(rivalName){
    const idx=Math.floor(Math.random()*LM_PRESS_EVENTS.length);
    const def=LM_PRESS_EVENTS[idx];
    // Solo la pregunta 2 (sobre ganar por tres goles) incrusta el
    // nombre del rival — usa tp() con marcador {rival} en vez de
    // buscar y sustituir texto en español, que dejaba de funcionar
    // en cualquier otro idioma.
    const q = idx===1 ? tp('lm.prensa.q2', {rival:rivalName||'el rival'}) : def.q;
    return {...def, q, eventIdx:idx};
  }
  // Muestra la rueda de prensa reutilizando literalmente las mismas
  // clases CSS que Copa Leyendas (.press-modal/.press-icon/...), con el
  // mismo temporizador de 8s. Al responder o agotarse el tiempo, guarda
  // la promesa pendiente en el estado y continúa el flujo de la semana.
  function mostrarRuedaPrensaLM(overlay, rivalName, onDone){
    const event=elegirPreguntaPrensaLM(rivalName);
    overlay.innerHTML=`
      <div class="press-modal">
        <h3>${t('lm.rueda_prensa')}</h3>
        <img src="assets/images/rueda_prensa.png" class="press-image" alt="Rueda de prensa">
        <p class="press-question">${event.q}</p>
        <div class="press-answers">
          ${event.answers.map((a,i)=>`
            <button class="press-answer-btn" data-lm-press-answer="${i}">
              <span>${a.text}</span>
              <span class="press-answer-label">${a.label}</span>
            </button>`).join('')}
        </div>
        <div class="press-timer-track"><div class="press-timer-fill" id="lmPressTimerFill"></div></div>
      </div>`;
    let respondido=false;
    const DURATION=8000;
    const fill=document.getElementById('lmPressTimerFill');
    const beepTimers=[5,4,3,2,1].map(secLeft=>setTimeout(()=>{
      if(respondido) return;
      if(typeof checkCountdownBeep==='function') checkCountdownBeep(secLeft, 'lmPressConference');
    }, DURATION-secLeft*1000));
    if(fill){
      fill.style.transition='none';
      fill.style.width='100%';
      requestAnimationFrame(()=>{
        requestAnimationFrame(()=>{
          fill.style.transition=`width ${DURATION}ms linear`;
          fill.style.width='0%';
        });
      });
    }
    const timerId=setTimeout(()=>{
      if(respondido) return;
      respondido=true;
      // Aunque se agote el tiempo sin responder, la imagen también
      // cambia (a la neutral) y se deja ver 1 segundo antes de
      // cerrar — igual que cuando sí se responde.
      const imgEl=overlay.querySelector('.press-image');
      if(imgEl){
        imgEl.classList.add('fading');
        setTimeout(()=>{
          imgEl.src='assets/images/rueda_prensa_neutral.png';
          imgEl.classList.remove('fading');
        }, 220);
      }
      if(typeof showToast==='function') showToast('No respondiste a tiempo — la prensa se queda sin declaraciones.', 'toast-neutral');
      setTimeout(onDone, 1000);
    }, DURATION);
    overlay.querySelectorAll('[data-lm-press-answer]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        if(respondido) return;
        respondido=true;
        clearTimeout(timerId);
        beepTimers.forEach(id=>clearTimeout(id));
        const idx=parseInt(btn.getAttribute('data-lm-press-answer'),10);
        const answer=event.answers[idx];
        // Cambia la imagen de cabecera a la que corresponda al tono
        // de la respuesta elegida, con un fundido rápido — mismo
        // efecto que en Copa Leyendas.
        const imgEl=overlay.querySelector('.press-image');
        if(imgEl){
          const archivo = answer.stance==='positive' ? 'rueda_prensa_optimista.png'
            : answer.stance==='negative' ? 'rueda_prensa_pesimista.png'
            : 'rueda_prensa_neutral.png';
          imgEl.classList.add('fading');
          setTimeout(()=>{
            imgEl.src='assets/images/'+archivo;
            imgEl.classList.remove('fading');
          }, 220);
        }
        // Se guardan solo los ÍNDICES (números, serializables de
        // verdad), nunca el objeto "answer" completo — ese objeto
        // lleva una función (check) para evaluar la promesa, y
        // JSON.stringify (lo que usa guardarEstado()) elimina en
        // silencio cualquier propiedad que sea una función. Si el
        // jugador guardaba la partida justo tras elegir una
        // respuesta y la recargaba antes de jugar el partido, esa
        // función desaparecía y resolverPrensaLM() lanzaba un error
        // al intentar llamarla — eso interrumpía sin aviso todo el
        // resto de jugarJornada(), dando la sensación de que el
        // partido "no se reproducía" al pulsar JUGAR. Reconstruir el
        // objeto completo (con su función) a partir de estos índices
        // y del catálogo LM_PRESS_EVENTS, justo en el momento de
        // resolver, evita el problema de raíz.
        state.lmPendingPrediction={eventIdx:event.eventIdx, answerIdx:idx};
        guardarEstado();
        if(typeof window.playSound==='function') window.playSound('select');
        if(typeof showToast==='function') showToast(`Promesa hecha: "${answer.label}"`, 'toast-neutral');
        setTimeout(onDone, 1700);
      });
    });
  }
  // Resuelve la promesa pendiente contra el resultado real del partido
  // — mismo efecto que Copa Leyendas: ±8 de moral, o 0 si fue neutral.
  function resolverPrensaLM(miGoles, suGoles){
    // Esta función puede llamarse más de una vez en el mismo partido
    // (una desde el origen común, otra de forma redundante en el
    // código específico del modo automático) — la marca evita que la
    // segunda llamada, al encontrar lmPendingPrediction ya vacío por
    // la primera, borre por error el resultado que la primera ya
    // había guardado correctamente.
    if(state._prensaResueltaEstePartido) return null;
    if(!state.lmPendingPrediction){
      // Sin rueda de prensa en este partido concreto — se limpia el
      // resultado guardado, para que el histórico de ESTE partido
      // nunca muestre por error la promesa de una jornada anterior.
      state.ultimaPrensaResuelta=null;
      state._prensaResueltaEstePartido=true;
      return null;
    }
    state._prensaResueltaEstePartido=true;
    // Se reconstruye el objeto completo (con su función check) a
    // partir de los índices guardados y del catálogo original — ver
    // el comentario en el punto donde se guarda la promesa para el
    // porqué de este paso. Si por cualquier motivo los índices ya no
    // encajan (versión antigua guardada, catálogo cambiado...), se
    // trata igual que "sin rueda de prensa" en vez de fallar.
    const eventDef=LM_PRESS_EVENTS[state.lmPendingPrediction.eventIdx];
    const answer=eventDef && eventDef.answers[state.lmPendingPrediction.answerIdx];
    state.lmPendingPrediction=null;
    if(!answer){
      state.ultimaPrensaResuelta=null;
      return null;
    }
    if(answer.stance==='neutral'){
      const r={label:answer.label, outcome:'neutral', delta:0, texto:'🎙 Respuesta neutral: la afición no se ve afectada.'};
      state.ultimaPrensaResuelta=r;
      return r;
    }
    const correcto=answer.check({myGoals:miGoles, oppGoals:suGoles, draw:miGoles===suGoles});
    let delta=correcto?8:-8;
    // Hito más alto (nivel 20 de este mismo icono): carisma
    // permanente — cada punto acumulado suaviza un poco más el golpe
    // de una promesa incumplida, sin llegar nunca a eliminarlo del
    // todo. Todo el sistema de medios gira en torno a la afición, no
    // a la moral del vestuario (esa la tocan otros iconos).
    if(!correcto && state.mediosCarismaPermanente){
      delta=Math.min(-1, delta + state.mediosCarismaPermanente*1.5);
    }
    if(!state.estadio) state.estadio={campo:90, satisfaccion:10, aforoTotal:12000, ultimaAsistencia:null};
    state.estadio.satisfaccion=Math.max(-100,Math.min(100,(state.estadio.satisfaccion||0)+delta));
    const r={
      label:answer.label, outcome:correcto?'correct':'wrong', delta,
      texto: correcto
        ? `🎙 Promesa cumplida ("${answer.label}"): +${delta} afición.`
        : `🎙 Promesa incumplida ("${answer.label}"): ${delta} afición.`
    };
    // Se guarda aparte (no solo se devuelve), para que el histórico
    // del partido pueda mencionarlo aunque se abra más tarde, cuando
    // state.lmPendingPrediction ya se haya vaciado.
    state.ultimaPrensaResuelta=r;
    return r;
  }

  function mostrarSemanaEnVivo(eventosDias, onAceptar){
    const overlay=document.createElement('div');
    overlay.id='lmSemanaOverlay';
    document.getElementById('ligaManagerScreen').appendChild(overlay);
    const rival=(()=>{
      const j=state.jornadaActual-1;
      const jornada=j>=0 && j<38 ? state.calendario[j] : null;
      const miPartido=jornada?jornada.find(p=>p.home.id==='lm_0'||p.away.id==='lm_0'):null;
      if(!miPartido) return null;
      return miPartido.home.id==='lm_0'?miPartido.away:miPartido.home;
    })();
    // Historial final — resumen de TODO lo ocurrido en la semana, con un
    // único botón ACEPTAR que solo cierra esta ventana. El partido no se
    // juega aquí: hace falta un segundo SEGUIR aparte para eso.
    function pantallaResumen(){
      const r=eventosDias.resumenSemanal || {diasEntreno:0, diasDescanso:0, mejoras:[], lesiones:[], NOMBRE_STAT:{}};
      const totalMejoras=r.mejoras.reduce((s,m)=>s+Object.values(m.stats).reduce((a,b)=>a+b,0), 0);
      const filasMejoras=r.mejoras.map(m=>{
        const detalle=Object.entries(m.stats).map(([campo,cant])=>`${r.NOMBRE_STAT[campo]||campo} +${cant}`).join(', ');
        return `<div class="lm-resumen-fila">
          <i class="ph ph-bold ph-trend-up" style="color:#5dcaa5"></i>
          <span><strong>${m.nombre}</strong> — ${detalle}</span>
        </div>`;
      }).join('');
      const filasLesiones=r.lesiones.map(l=>`
        <div class="lm-resumen-fila">
          <i class="ph ph-bold ph-first-aid-kit" style="color:#e24b4a"></i>
          <span><strong>${l.nombre}</strong> — ${l.familia==='muscular'?t('lm.sobrecarga_muscular'):t('lm.sobrecarga_osea')}</span>
        </div>`).join('');
      overlay.innerHTML=`
        <div class="lm-dilemma-card lm-semana-card-fija" style="width:420px;max-width:92vw;text-align:left">
          <div class="lm-dilemma-title"><i class="ph ph-bold ph-flag-checkered"></i> ${t('lm.semana_completada')}</div>
          ${rival?`<div class="lm-rival-crest-block" style="margin:6px auto 12px">${rivalCrestHTML(56, rival.crestImg)}<span class="lm-title" style="font-size:13px">${t('lm.proximo_corto')} ${rival.name}</span></div>`:''}
          <div class="lm-resumen-stats-row">
            <div class="lm-resumen-stat"><i class="ph ph-bold ph-barbell" style="color:#e08a3e"></i><strong>${r.diasEntreno}</strong><span>${t('lm.resumen_entreno')}</span></div>
            <div class="lm-resumen-stat"><i class="ph ph-bold ph-bed" style="color:#5dcaa5"></i><strong>${r.diasDescanso}</strong><span>${t('lm.resumen_descanso')}</span></div>
            <div class="lm-resumen-stat"><i class="ph ph-bold ph-trend-up" style="color:#5dcaa5"></i><strong>${totalMejoras}</strong><span>${t('lm.resumen_mejoras')}</span></div>
            <div class="lm-resumen-stat"><i class="ph ph-bold ph-first-aid-kit" style="color:#e24b4a"></i><strong>${r.lesiones.length}</strong><span>${t('lm.resumen_lesiones')}</span></div>
          </div>
          ${(filasMejoras||filasLesiones)?`<div class="lm-resumen-lista">${filasMejoras}${filasLesiones}</div>`:`<p class="lm-setup-desc" style="text-align:center">${t('lm.semana_sin_incidencias')}</p>`}
          <div class="lm-popup-actions" style="justify-content:center">
            <button id="lmSemanaAceptarBtn" class="mode-card-btn mode-card-btn-gold" style="width:auto;padding:10px 30px">${t('lm.aceptar')}</button>
          </div>
        </div>`;
      document.getElementById('lmSemanaAceptarBtn').addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        overlay.remove();
        onAceptar();
      });
    }
    if(!eventosDias || !eventosDias.length){ pantallaResumen(); return; }
    // Rueda de prensa — un día al azar de esta semana, antes del
    // partido, con un 35% de probabilidad (si no hay ya una promesa
    // pendiente de una semana anterior sin resolver). Pausa el flujo de
    // días hasta que se responda o se agote el tiempo.
    // Rueda de prensa — si el jugador eligió el nodo "día de medios" en
    // el árbol de esta semana, la entrevista pasa DE VERDAD ese día
    // concreto (decisión propia, no azar). Si el nodo ya se resolvió
    // en el momento de elegirlo (ver aplicarEfectoNodoSemana), no se
    // vuelve a lanzar aquí — se marca -1 directamente. Si por lo que
    // sea no hay ningún día así esta semana, se conserva el
    // comportamiento anterior como reserva (un día al azar, 50%).
    const diaMedios = state.semanaNodos && state.semanaNodos.dias.find(d=>d.elegido!=null && d.nodos[d.elegido].tipo==='medios');
    const diaPrensaIdx = state.lmPrensaResueltaPorNodo ? -1 : ((rival && !state.lmPendingPrediction)
      ? (diaMedios ? eventosDias.findIndex(e=>e.iso===diaMedios.fecha) : (Math.random()<0.5 ? Math.floor(Math.random()*eventosDias.length) : -1))
      : -1);
    state.lmPrensaResueltaPorNodo=false;
    let idx=0;
    function pintarDia(){
      if(idx===diaPrensaIdx){
        mostrarRuedaPrensaLM(overlay, rival?rival.name:null, ()=>{
          idx++;
          if(idx<eventosDias.length) pintarDia(); else pantallaResumen();
        });
        return;
      }
      const ev=eventosDias[idx];
      const nombreDia=diaLargo(ev.fecha.getDay());
      if(typeof window.playSound==='function') window.playSound(ev.tipo==='entreno'?'training_day':'rest_day');
      overlay.innerHTML=`
        <div class="lm-dilemma-card lm-semana-card-fija" style="width:380px;max-width:92vw">
          <div class="lm-dilemma-title" style="text-transform:uppercase;justify-content:center;text-align:center">${nombreDia} ${ev.fecha.getDate()}</div>
          <div class="lm-semana-dia-icono ${ev.tipo==='entreno'?'lm-semana-entreno':'lm-semana-descanso'}">
            <i class="ph ph-bold ${ev.tipo==='entreno'?'ph-barbell':'ph-bed'}"></i>
          </div>
          <div class="lm-semana-dia-tag">${ev.tipo==='entreno'?t('lm.dia_entrenamiento'):t('lm.dia_descanso')}</div>
          <div class="lm-semana-dia-textos">
            ${ev.textos.map(txt=>`<p>${txt}</p>`).join('')}
          </div>
          <div class="lm-semana-progreso">
            ${eventosDias.map((_,i)=>`<span class="lm-semana-punto ${i<=idx?'lm-semana-punto-activo':''}"></span>`).join('')}
          </div>
        </div>`;
      setTimeout(()=>{
        idx++;
        if(idx<eventosDias.length) pintarDia();
        else pantallaResumen();
      }, 700);
    }
    pintarDia();
  }

  function mostrarPartidoEnVivo(info, onFinish){
    const miEsLocal = info.home.id==='lm_0';
    const overlay=document.createElement('div');
    overlay.id='lmMatchOverlay';
    overlay.innerHTML=`
      <div class="match-modal" style="overflow:hidden;display:flex;flex-direction:column;max-height:85vh">
        <div class="match-header">
          <div class="match-side">
            ${miEsLocal?crestHTML(state.escudo,92):rivalCrestHTML(92, info.home.crestImg)}
            <span class="match-team-name">${info.home.name}</span>
          </div>
          <div style="text-align:center;flex:0 0 auto">
            <div class="match-scoreline" id="lmLiveScore" style="font-size:42px;letter-spacing:4px">0 – 0</div>
            <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:4px">
              <div style="font-family:'Bebas Neue',Impact,sans-serif;font-size:20px;color:var(--gold)" id="lmLiveClock">0'</div>
              <div style="font-size:9px;font-weight:700;background:var(--accent);color:#fff;padding:2px 7px;letter-spacing:1px;text-transform:uppercase" id="lmLiveHalf">1ª PARTE</div>
            </div>
            <div style="height:4px;background:#eee;border-radius:2px;margin-top:6px;overflow:hidden">
              <div id="lmLiveFill" style="height:100%;background:var(--accent);border-radius:2px;width:0%;transition:width .15s linear"></div>
            </div>
          </div>
          <div class="match-side">
            ${!miEsLocal?crestHTML(state.escudo,92):rivalCrestHTML(92, info.away.crestImg)}
            <span class="match-team-name">${info.away.name}</span>
          </div>
        </div>
        <div id="lmLiveEvents" style="flex:1;overflow-y:auto;display:flex;flex-direction:column;align-items:stretch;gap:2px;padding:4px 0;min-height:80px;max-height:260px"></div>
        <div id="lmPostMatchInfo"></div>
        <button id="lmHistoricoBtn" class="mode-card-btn mode-card-btn-secondary" style="display:none;width:100%;margin-top:8px"><i class="ph ph-bold ph-notebook"></i> ${t('lm.historico_partido_btn')}</button>
        <button id="lmCronicaAutoBtn" class="mode-card-btn mode-card-btn-secondary" style="display:none;width:100%;margin-top:8px"><i class="ph ph-bold ph-newspaper"></i> ${t('lm.cronica_partido_btn')}</button>
        <button id="lmLiveContinuar" class="mode-card-btn mode-card-btn-gold" style="display:none;width:100%;padding:11px;margin-top:10px">${t('lm.continuar')}</button>
      </div>`;
    document.getElementById('ligaManagerScreen').appendChild(overlay);

    const eventsEl=document.getElementById('lmLiveEvents');
    const clockEl=document.getElementById('lmLiveClock');
    const halfEl=document.getElementById('lmLiveHalf');
    const fillEl=document.getElementById('lmLiveFill');
    const scoreEl=document.getElementById('lmLiveScore');
    let curHome=0, curOpp=0, idx=0;

    function flashScore(){ scoreEl.classList.remove('goal-flash'); void scoreEl.offsetWidth; scoreEl.classList.add('goal-flash'); }

    function addSep(text){
      const sep=document.createElement('div');
      sep.style.cssText='text-align:center;font-size:10px;font-weight:700;color:var(--accent);letter-spacing:2px;padding:4px 0;border-top:1px solid #eee;border-bottom:1px solid #eee;margin:2px 0;text-transform:uppercase';
      sep.textContent=text;
      eventsEl.appendChild(sep);
      eventsEl.scrollTop=eventsEl.scrollHeight;
    }

    function addEvt(icon,text,minLabel,esLocal,colorOverride){
      const item=document.createElement('div');
      item.style.cssText='display:grid;grid-template-columns:1fr 44px 1fr;align-items:center;width:100%;font-size:12px;animation:slideInEvent .3s ease;opacity:0;animation-fill-mode:forwards;padding:3px 0;border-bottom:1px solid rgba(0,0,0,.05)';
      const center=`<span style="font-family:'Bebas Neue',Impact,sans-serif;font-size:15px;color:#aaa;text-align:center;display:block;letter-spacing:.5px">${minLabel}</span>`;
      const color = colorOverride || (esLocal ? 'var(--accent)' : 'var(--red)');
      if(esLocal){
        item.innerHTML=`<span style="text-align:right;padding-right:6px;color:${color};line-height:1.3">${text} <span style="font-size:14px">${icon}</span></span>${center}<span></span>`;
      }else{
        item.innerHTML=`<span></span>${center}<span style="text-align:left;padding-left:6px;color:${color};line-height:1.3"><span style="font-size:14px">${icon}</span> ${text}</span>`;
      }
      eventsEl.appendChild(item);
      eventsEl.scrollTop=eventsEl.scrollHeight;
    }

    if(typeof window.playSound==='function') window.playSound('whistle');

    // Dos tiempos claramente diferenciados, igual que Copa Leyendas:
    // 1ª PARTE (0-47%) → DESCANSO (47-53%) → 2ª PARTE (53-100%).
    const DURATION=8000;
    const HT_S=0.47, HT_E=0.53;
    let start=performance.now();
    let htShown=false;

    function tick(now){
      const frac=Math.min((now-start)/DURATION,1);

      if(frac>=HT_S && frac<HT_E){
        if(!htShown){
          htShown=true;
          clockEl.textContent="45'";
          halfEl.textContent='DESCANSO';
          halfEl.style.background='#a07a00';
          fillEl.style.width='50%';
          addSep("Descanso — 45'");
          if(typeof window.playSound==='function') window.playSound('whistle');
          // Oferta de Giro Táctico — solo si vamos perdiendo al
          // descanso y quedan usos disponibles esta media temporada.
          // Se pausa aquí (no se programa el siguiente
          // requestAnimationFrame) hasta que el jugador decida.
          const miGolesHT = miEsLocal?curHome:curOpp, rivalGolesHT = miEsLocal?curOpp:curHome;
          // Por defecto, pierdiendo O empatado al descanso. Con la
          // habilidad Lectura de Partido, incluso ganando por la
          // mínima (protege una ventaja corta).
          const vaMalAlDescansoAuto = lmSkillActiva('lm_lectura_partido') ? miGolesHT<=rivalGolesHT+1 : miGolesHT<=rivalGolesHT;
          if(vaMalAlDescansoAuto && (state.giroTacticoUsosRestantes||0)>0 && typeof window.LMGiroTactico!=='object'){
            console.error('[Liga Manager] Giro Táctico no disponible: liga-manager-giro-tactico.js no se ha cargado (revisa que el archivo y el <script> en index.html estén subidos al servidor).');
          }
          if(typeof window.LMGiroTactico==='object' && vaMalAlDescansoAuto && (state.giroTacticoUsosRestantes||0)>0){
            const misStatsHT = calcularStatsEquipo();
            const rivalTeamObjHT = miEsLocal ? info.away : info.home;
            const pausaInicioTs=performance.now();
            const reanudar=()=>{ start+=(performance.now()-pausaInicioTs); requestAnimationFrame(tick); };
            window.LMGiroTactico.ofrecerSiProcede({
              contenedor: document.getElementById('ligaManagerScreen'),
              t, usosRestantes: state.giroTacticoUsosRestantes,
              misStats: misStatsHT, rivalStats:{attack:rivalTeamObjHT.attack,defense:rivalTeamObjHT.defense,pace:rivalTeamObjHT.pace,passing:rivalTeamObjHT.passing,technique:rivalTeamObjHT.technique},
              rivalTeamObj: rivalTeamObjHT, esMiEquipoLocal: miEsLocal, miNombre: state.nombreEquipo, rivalNombre: rivalTeamObjHT.name,
              manoDuraActiva: lmSkillActiva('lm_mano_dura'),
              golesMiosPrimeraParte: miGolesHT, golesRivalPrimeraParte: rivalGolesHT,
              elegirGoleador, jugadorRivalAleatorio, elegirJugadorAlineado,
              onConsumirUso: ()=>{
                state.giroTacticoUsosRestantes=Math.max(0,(state.giroTacticoUsosRestantes||0)-1);
                if(typeof window.unlockLMAchievement==='function') window.unlockLMAchievement('lm_giro_primera_vez', false);
                if(state.giroTacticoUsosRestantes<=0 && typeof window.unlockLMAchievement==='function') window.unlockLMAchievement('lm_giro_agotado', false);
                guardarEstado();
              },
              onResultadoFinal: (golesMios2P, golesRival2P, nuevosEventos2P)=>{
                const miLadoEv = miEsLocal ? 'home' : 'away';
                info.eventos.filter(e=>e.minute>45 && e.team===miLadoEv && e.jugador && e.jugador.id).forEach(e=>{
                  const p=(state.plantilla||[]).find(x=>x.id===e.jugador.id);
                  if(p && p.golesTemporada) p.golesTemporada=Math.max(0,p.golesTemporada-1);
                });
                nuevosEventos2P.filter(e=>e.type==='goal' && e.team===miLadoEv && e.jugador && e.jugador.id).forEach(e=>{
                  const p=(state.plantilla||[]).find(x=>x.id===e.jugador.id);
                  if(p) p.golesTemporada=(p.golesTemporada||0)+1;
                });
                info.eventos = info.eventos.filter(e=>e.minute<=45).concat(nuevosEventos2P).sort((a,b)=>a.minute-b.minute);
                const nuevoGolesA = miEsLocal ? (curHome+golesMios2P) : (curHome+golesRival2P);
                const nuevoGolesB = miEsLocal ? (curOpp+golesRival2P) : (curOpp+golesMios2P);
                info.resultado.golesA=nuevoGolesA; info.resultado.golesB=nuevoGolesB;
                if(info.jornadaIndex!==undefined){
                  const key=info.jornadaIndex+'-'+info.home.id+'-'+info.away.id;
                  if(state.resultados[key]) state.resultados[key]={...state.resultados[key], golesA:nuevoGolesA, golesB:nuevoGolesB};
                }
                const misGolesFinalesAuto = miEsLocal ? nuevoGolesA : nuevoGolesB;
                const rivalGolesFinalesAuto = miEsLocal ? nuevoGolesB : nuevoGolesA;
                if(misGolesFinalesAuto>rivalGolesFinalesAuto && typeof window.unlockLMAchievement==='function'){
                  window.unlockLMAchievement('lm_giro_remontada', false);
                  state.giroRemontadasTotales=(state.giroRemontadasTotales||0)+1;
                  if(state.giroRemontadasTotales>=3) window.unlockLMAchievement('lm_giro_leyenda', false);
                }
                guardarEstado();
                reanudar();
              },
              onCancelado: reanudar
            });
            return;
          }
        }
        requestAnimationFrame(tick);
        return;
      }

      let minute;
      if(frac<HT_S){
        minute=Math.floor((frac/HT_S)*45);
        halfEl.textContent='1ª PARTE'; halfEl.style.background='var(--accent)';
      }else{
        const f2=(frac-HT_E)/(1-HT_E);
        minute=45+Math.floor(f2*45);
        halfEl.textContent='2ª PARTE'; halfEl.style.background='var(--accent)';
      }
      clockEl.textContent=minute+"'";
      fillEl.style.width=(frac*100)+'%';

      while(idx<info.eventos.length && info.eventos[idx].minute<=minute){
        const ev=info.eventos[idx++];
        const esLocal = ev.team==='home';
        if(ev.type==='goal'){
          if(esLocal) curHome++; else curOpp++;
          scoreEl.textContent=curHome+' – '+curOpp;
          flashScore();
          const equipoGol = esLocal ? info.home.name : info.away.name;
          const racha = ev.jugador && ev.jugador.racha>=2 ? ` <span title="${t('lm.tt_racha_gol')}">🔥${ev.jugador.racha}</span>` : '';
          const nombre = ev.jugador ? ev.jugador.name : equipoGol;
          addEvt('⚽', `<strong>${nombre}</strong>${racha}`, ev.minute+"'", esLocal);
          if(typeof window.playSound==='function') window.playSound('goal');
          if(window.G2GMusica) window.G2GMusica.reproducirGol();
        } else if(ev.type==='injury'){
          addEvt('✚', `<strong>${ev.jugador.name}</strong> <span style="font-size:10px;color:var(--red)">(lesión ${ev.sev.label})</span>`, ev.minute+"'", esLocal, 'var(--red)');
        } else if(ev.type==='card'){
          const icon = ev.tarjeta==='roja' ? '🟥' : '🟨';
          addEvt(icon, `<strong>${ev.jugador.name}</strong>`, ev.minute+"'", ev.team==='home');
        }
      }

      if(frac<1){ requestAnimationFrame(tick); }
      else{
        clockEl.textContent='FIN';
        halfEl.textContent='FINAL';
        halfEl.style.background='#555';
        fillEl.style.width='100%';
        if(typeof window.playSound==='function') window.playSound('whistle');

        // Resultado final desde tu perspectiva — mismo banner que Copa
        // Leyendas (.match-result-tag + .res-win-tag/.res-draw-tag/.res-lose-tag).
        const miGoles = miEsLocal?curHome:curOpp;
        const suGoles = miEsLocal?curOpp:curHome;
        let resultClass, resultText;
        if(miGoles===suGoles){ resultClass='res-draw-tag'; resultText='EMPATE'; }
        else if(miGoles>suGoles){ resultClass='res-win-tag'; resultText='¡VICTORIA!'; }
        else { resultClass='res-lose-tag'; resultText='DERROTA'; }
        const golesA=info.eventos.filter(e=>e.type==='goal').length;
        const tarjetasA=info.eventos.filter(e=>e.type==='card').length;
        const lesionA=info.eventos.find(e=>e.type==='injury');
        const prensaResuelta=resolverPrensaLM(miGoles, suGoles);
        if(prensaResuelta) guardarEstado();
        const posMioFinal2 = info.resultado.posesionA!=null ? (miEsLocal?info.resultado.posesionA:info.resultado.posesionB) : null;
        const barraPosesion2 = posMioFinal2!=null ? `
          <div class="lm-visor-posesion-titulo">${t('lm.posesion_titulo')}</div>
          <div class="lm-visor-posesion-barra">
            <div class="lm-visor-posesion-mia" style="width:${posMioFinal2}%">${posMioFinal2}%</div>
            <div class="lm-visor-posesion-rival" style="width:${100-posMioFinal2}%">${100-posMioFinal2}%</div>
          </div>` : '';
        document.getElementById('lmPostMatchInfo').innerHTML=`
          <div class="match-result-tag ${resultClass}">${resultText}</div>
          <div class="match-summary">
            <strong>${state.nombreEquipo}</strong> ${miGoles} – ${suGoles} <strong>${info.home.id==='lm_0'?info.away.name:info.home.name}</strong><br>
            ${golesA} gol${golesA===1?'':'es'} en total · ${tarjetasA} tarjeta${tarjetasA===1?'':'s'}${lesionA?` · 1 lesión (${lesionA.jugador.name})`:''}
          </div>
          ${barraPosesion2}
          ${prensaResuelta?`<div class="press-prediction-section ${prensaResuelta.outcome==='correct'?'press-prediction-good':prensaResuelta.outcome==='wrong'?'press-prediction-bad':'press-prediction-neutral'}">${prensaResuelta.texto}</div>`:''}`;

        document.getElementById('lmLiveContinuar').style.display='block';
        document.getElementById('lmHistoricoBtn').style.display='block';
        const cronicaAutoBtn=document.getElementById('lmCronicaAutoBtn');
        if(cronicaAutoBtn && window.G2G_Cronica) cronicaAutoBtn.style.display='block';
      }
    }
    requestAnimationFrame(tick);

    const cronicaAutoBtnEl=document.getElementById('lmCronicaAutoBtn');
    if(cronicaAutoBtnEl){
      // Misma crónica que en el visor manager, disponible también en
      // modo automático — jugarJornada() genera exactamente los mismos
      // datos (eventos, resultado, posesión) para los dos modos de
      // visualización, así que no hace falta simular nada aparte: solo
      // faltaba este botón para abrirla desde aquí.
      cronicaAutoBtnEl.addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        try{
          const rival = miEsLocal ? info.away : info.home;
          const miNombre = state.nombreEquipo;
          const rivalNombre = rival.name;
          const posMioFinal = info.resultado.posesionA!=null ? (miEsLocal?info.resultado.posesionA:info.resultado.posesionB) : 50;
          const titularIds=new Set(Object.values(state.alineacion||{}).filter(Boolean));
          const alineacionMia=(state.plantilla||[]).filter(j=>titularIds.has(j.id))
            .map(j=>({numero:j.numero, position:j.position, name:j.name, overall:j.overall}));
          const disponiblesRival=(typeof plantillaEfectivaRival==='function') ? plantillaEfectivaRival(rival) : [];
          const alineacionRival=(disponiblesRival||[]).slice(0,11)
            .map((j,i)=>({numero:j.n||(i+1), position:j.position||'', name:j.name, overall:j.overall}));
          const datosLocal = miEsLocal
            ? {nombre:miNombre, goles:info.resultado.golesA, alineacion:alineacionMia}
            : {nombre:rivalNombre, goles:info.resultado.golesA, alineacion:alineacionRival};
          const datosVisitante = miEsLocal
            ? {nombre:rivalNombre, goles:info.resultado.golesB, alineacion:alineacionRival}
            : {nombre:miNombre, goles:info.resultado.golesB, alineacion:alineacionMia};
          const climaActual=(typeof climaDelPartido==='function') ? climaDelPartido() : null;
          const datosPartido={
            nombreLocal:datosLocal.nombre, nombreVisitante:datosVisitante.nombre,
            golesLocal:datosLocal.goles, golesVisitante:datosVisitante.goles,
            jornada:state.jornadaActual, temporada:state.temporadaEtiqueta||'',
            estadio:(state.nombreEstadio || (miEsLocal?miNombre:rivalNombre)+' Arena'),
            espectadores: state.estadio && state.estadio.ultimaAsistencia ? state.estadio.ultimaAsistencia.toLocaleString('es-ES') : null,
            clima: climaActual ? climaActual.label : null,
            posesionLocal: miEsLocal ? posMioFinal : (100-posMioFinal),
            eventos: info.eventos||[],
            alineacionLocal: datosLocal.alineacion,
            alineacionVisitante: datosVisitante.alineacion,
            prensa: state.ultimaPrensaResuelta || null,
            prensaEquipo: state.ultimaPrensaResuelta ? miNombre : null,
            resultadoJugador: (()=>{
              const golesMios = miEsLocal ? info.resultado.golesA : info.resultado.golesB;
              const golesRival = miEsLocal ? info.resultado.golesB : info.resultado.golesA;
              if(golesMios>golesRival) return 'victoria';
              if(golesMios<golesRival) return 'derrota';
              return 'empate';
            })(),
          };
          const html=window.G2G_Cronica.generarHTML(datosPartido);
          const ventana=window.open('', '_blank');
          if(ventana){ ventana.document.write(html); ventana.document.close(); }
        }catch(e){ console.error('Error generando la crónica del partido (modo automático):', e); }
      });
    }
    document.getElementById('lmHistoricoBtn').addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      mostrarHistoricoPartido(info, miEsLocal);
    });
    document.getElementById('lmLiveContinuar').addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      overlay.remove();
      onFinish();
    });
  }

  /* ---------- 9. Resolver el dilema del médico con N dados (se SUMAN) ---------- */
  /* ---------- 9a. Historial del médico — registra cada lesión (cuándo,
     contra quién, tipo) y cómo se resolvió (tiempo natural, dado urgente
     o una carta concreta), más el progreso de las cartas de acumulación.
     Se muestra ordenado de más reciente a más antiguo. ---------- */
  function registrarLesionHistorial(jugador, sev, tipoLesion, rival, familia){
    state.medicoHistorial = state.medicoHistorial||[];
    const id = 'h'+Date.now()+Math.floor(Math.random()*1000);
    state.medicoHistorial.push({
      id, tipo:'lesion',
      jugador: jugador.name, jugadorId: jugador.id, jornadaInicio: state.jornadaActual, rival,
      severidad: sev.label, tipoLesion, familia, semanasPrevistas: sev.weeks,
      resuelta:false, resueltoPor:null, jornadasReales:null
    });
    // El médico avisa por correo de cualquier lesión nueva, no solo las
    // graves — así el aviso llega siempre, no solo en los casos más raros.
    if(state.trabajadores && state.trabajadores.medico && typeof enviarCorreo==='function'){
      enviarCorreo('medico', tp('correo.se_lesiona.asunto', {jugador:jugador.name}),
        tp('correo.se_lesiona.cuerpo', {jugador:jugador.name, tipo:tipoLesion?tipoLesion.toLowerCase():'una lesión', severidad:sev.label, semanas:sev.weeks+' '+t('lm.jornada').toLowerCase()+(sev.weeks===1?'':'s')}),
        {asunto:'correo.se_lesiona.asunto', paramsAsunto:{jugador:jugador.name}, cuerpo:'correo.se_lesiona.cuerpo', paramsCuerpo:{jugador:jugador.name, tipo:tipoLesion?tipoLesion.toLowerCase():'una lesión', severidad:sev.label, semanas:sev.weeks+' '+t('lm.jornada').toLowerCase()+(sev.weeks===1?'':'s')}});
    }
    return id;
  }
  function cerrarLesionHistorial(jugador, resueltoPor){
    // El aviso URGENTE (con su botón ATENDER) apunta a un jugador
    // concreto — si se recupera por cualquier vía (tiempo natural,
    // carta, dado urgente...) antes de haberlo atendido, hay que
    // limpiarlo aquí también, o se queda pidiendo dados para curar a
    // alguien que ya está sano.
    if(state.medicoNotificacion && state.medicoNotificacion.jugadorId===jugador.id){
      state.medicoNotificacion=null;
    }
    if(!jugador.lesionLogId || !state.medicoHistorial) return;
    const entry=state.medicoHistorial.find(h=>h.id===jugador.lesionLogId);
    if(entry && !entry.resuelta){
      entry.resuelta=true;
      entry.resueltoPor=resueltoPor;
      entry.jornadasReales=Math.max(1, state.jornadaActual-entry.jornadaInicio+1);
    }
    jugador.lesionLogId=null;
    jugador.injuryFamilia=null;
    // El médico avisa por correo de que el jugador ya está disponible —
    // así deja de tener sentido seguir ofreciendo tratarlo (ya no
    // aparece en jugadoresLesionadosPara al no estar "injured").
    if(state.trabajadores && state.trabajadores.medico && typeof enviarCorreo==='function' &&
       (!state.correoUltimoEnviado || state.correoUltimoEnviado.medico!==state.jornadaActual)){
      enviarCorreo('medico', tp('correo.recupera_disponibilidad.asunto', {jugador:jugador.name}), tp('correo.recupera_disponibilidad.cuerpo', {jugador:jugador.name}), {asunto:'correo.recupera_disponibilidad.asunto', paramsAsunto:{jugador:jugador.name}, cuerpo:'correo.recupera_disponibilidad.cuerpo', paramsCuerpo:{jugador:jugador.name}});
    }
  }
  function registrarProgresoHistorial(texto){
    state.medicoHistorial = state.medicoHistorial||[];
    state.medicoHistorial.push({id:'h'+Date.now()+Math.floor(Math.random()*1000), tipo:'progreso', jornada:state.jornadaActual, texto});
  }

  function resolverDilemaMedico(numDados, tiradas){
    if(!state.medicoNotificacion) return null;
    const suma = tiradas.reduce((a,b)=>a+b,0);
    const exito = state.medicoNotificacion ? (suma >= state.medicoNotificacion.dificultad) : false;
    if(exito){
      const jugador=state.plantilla.find(p=>p.id===state.medicoNotificacion.jugadorId);
      if(jugador){
        jugador.injuryWeeks=Math.max(0, jugador.injuryWeeks-1);
        if(jugador.injuryWeeks<=0){ jugador.injured=false; jugador.injurySeverity=null; cerrarLesionHistorial(jugador, 'Dado urgente'); }
      }
    }
    state.diceAvailable = Math.max(0, state.diceAvailable - numDados);
    const resultado={tiradas, suma, dificultad:state.medicoNotificacion?state.medicoNotificacion.dificultad:0, exito};
    state.medicoNotificacion=null;
    guardarEstado();
    return resultado;
  }

  /* ---------- 9b. CARTAS DE MISIÓN DEL CUERPO TÉCNICO (Médico) ----------
     10 cartas base. Tres tipos:
     - "directa": se resuelve al momento (dados sumados vs dificultad).
       Si falla, la carta se queda tal cual, se puede reintentar cuando
       se pueda. Si tiene éxito, se aplica el efecto y se cambia por una
       carta nueva al azar automáticamente.
     - "nivel": mejora permanente de una de las 4 especialidades del
       equipo médico (curación muscular, curación ósea, prevención
       muscular, prevención ósea). Se resuelve al momento igual que una
       carta directa (dados vs dificultad, sin fallo posible en la
       tirada en sí más allá de no alcanzar la dificultad) — si tiene
       éxito, sube un nivel esa especialidad y la carta se sustituye por
       otra al azar; si esa misma carta vuelve a salir más adelante, un
       nuevo éxito la sube otro nivel (dificultad más alta cada vez).
       Al alcanzar el nivel máximo (3) la carta queda agotada para
       siempre y ya no puede volver a salir.
     - "acumulacion": los dados invertidos SIEMPRE suman puntos a un
       proyecto (no hay fallo posible en la tirada en sí); tiene varios
       niveles con umbral creciente — completar por etapas sale más
       barato en total que si solo existiera un umbral alto directo.
     Puedes cambiar 1 carta (de las 3 en mano) por partido: se descarta
     y se reemplaza por otra al azar del resto del catálogo. ---------- */
  const MEDICO_CARTAS_BASE = [
    {id:'urgente',      tipo:'directa',     nombre:'Recuperación Exprés',      icon:'ph-first-aid-kit',    dificultad:8,  requiereLesion:true,  desc:'Reduce a la mitad el tiempo de recuperación de un jugador lesionado'},
    {id:'milagro',      tipo:'directa',     nombre:'Milagro de Vestuario',     icon:'ph-sparkle',          dificultad:15, requiereLesion:true,  desc:'Cura al instante cualquier lesión, sea cual sea su gravedad'},
    {id:'consulta',     tipo:'directa',     nombre:'Consulta Rápida',          icon:'ph-stethoscope',      dificultad:5,  requiereLesion:true,  desc:'Reduce en 1 semana el tiempo de recuperación'},
    {id:'cirugia',      tipo:'directa',     nombre:'Cirugía de Precisión',     icon:'ph-scissors',         dificultad:12, requiereLesion:'grave',desc:'Convierte una lesión grave en moderada'},
    {id:'prevencion_t', tipo:'directa',     nombre:'Prevención Táctica',       icon:'ph-shield-check',     dificultad:7,  requiereLesion:false, desc:'Reduce el riesgo de lesión en el próximo partido'},
    {id:'chequeo',      tipo:'directa',     nombre:'Chequeo de Plantilla',     icon:'ph-clipboard-text',   dificultad:6,  requiereLesion:false, desc:'Mejora la resistencia de toda la plantilla este partido'},
    {id:'fisio_muscular',    tipo:'nivel', track:'curacionMuscular',   nombre:'Unidad de Fisioterapia',        icon:'ph-person-simple-run', dificultadBase:8, dificultadPaso:4, desc:'Acelera la recuperación de lesiones musculares, esguinces y de ligamentos'},
    {id:'fisio_osea',        tipo:'nivel', track:'curacionOsea',       nombre:'Unidad de Traumatología',       icon:'ph-bandaids',          dificultadBase:9, dificultadPaso:4, desc:'Acelera la recuperación de fisuras, fracturas y lesiones de menisco'},
    {id:'prevencion_muscular',tipo:'nivel', track:'prevencionMuscular', nombre:'Programa de Prevención Muscular', icon:'ph-heartbeat',        dificultadBase:8, dificultadPaso:4, desc:'Reduce el riesgo de lesiones musculares (partido y sobrecarga por exceso de entrenamiento)'},
    {id:'prevencion_osea',   tipo:'nivel', track:'prevencionOsea',     nombre:'Protocolo de Protección Ósea',  icon:'ph-shield-plus',       dificultadBase:9, dificultadPaso:4, desc:'Reduce el riesgo de lesiones óseas (partido y sobrecarga por exceso de entrenamiento)'}
  ];

  const NIVEL_MAXIMO_EQUIPO=3;
  function nivelDe(track){ return (state.medicoNiveles && state.medicoNiveles[track]) || 0; }
  // Cuantas más estrellas (nivel 1-3) tenga el trabajador contratado en
  // ese puesto, más fáciles son las tiradas de dados de sus cartas —
  // 1★ no reduce nada, 2★ resta 1 punto de dificultad, 3★ resta 2.
  // Se aplica por igual a cartas de nivel y de misión, en los 5
  // departamentos del cuerpo técnico.
  function bonusEstrellasTrabajador(rol){
    const t=state.trabajadores && state.trabajadores[rol];
    return (t && t.nivel) ? Math.max(0, t.nivel-1) : 0;
  }
  function dificultadActualNivel(def){ return Math.max(3, def.dificultadBase + nivelDe(def.track)*def.dificultadPaso - bonusEstrellasTrabajador('medico')); }

  // Resumen del equipo médico por especialidad — CONDENSADO a propósito:
  // una fila por especialidad con su nivel actual en estrellas, nunca un
  // listado de cada mejora conseguida. Se reutiliza tanto en la propia
  // ficha del equipo médico como en la pestaña INSTALACIONES del
  // historial.
  const NIVELES_EQUIPO_INFO=[
    {track:'curacionMuscular',   label:'Fisioterapia',          icon:'ph-person-simple-run', desc:'Recuperación de lesiones musculares'},
    {track:'curacionOsea',       label:'Traumatología',         icon:'ph-bandaids',          desc:'Recuperación de lesiones óseas'},
    {track:'prevencionMuscular', label:'Prevención muscular',   icon:'ph-heartbeat',         desc:'Lesión muscular en partido o por sobrecarga de entreno'},
    {track:'prevencionOsea',     label:'Protección ósea',       icon:'ph-shield-plus',       desc:'Lesión ósea en partido o por sobrecarga de entreno'}
  ];
  function estrellasNivel(n, max){ max=max||NIVEL_MAXIMO_EQUIPO; n=Math.max(0,Math.min(max,n)); return '★'.repeat(n) + '☆'.repeat(max-n); }
  function renderNivelesEquipoHTML(){
    return `<div class="med-niveles-grid">${NIVELES_EQUIPO_INFO.map(info=>{
      const n=nivelDe(info.track);
      const completado=n>=NIVEL_MAXIMO_EQUIPO;
      return `<div class="med-nivel-row${completado?' med-nivel-completado':''}">
        ${completado?`<i class="ph ph-bold ph-check-circle med-nivel-check" title="${t('lm.tt_proyecto_completado')}"></i>`:''}
        <i class="ph ph-bold ${info.icon}"></i>
        <div class="med-nivel-info">
          <div class="med-nivel-label">${info.label}</div>
          <div class="med-nivel-desc">${info.desc}</div>
        </div>
        <div class="med-nivel-stars" title="${t('lm.nivel_n_de_x')} ${n}/${NIVEL_MAXIMO_EQUIPO}">${estrellasNivel(n)}</div>
      </div>`;
    }).join('')}</div>`;
  }

  function cartaDef(id){ return MEDICO_CARTAS_BASE.find(c=>c.id===id); }

  function generarCartaAleatoria(excluirIds){
    excluirIds = excluirIds || [];
    const agotadas = state.medicoCartasAgotadas||[];
    const disponibles = MEDICO_CARTAS_BASE.filter(c=>!excluirIds.includes(c.id) && !agotadas.includes(c.id));
    const pool = disponibles.length ? disponibles : MEDICO_CARTAS_BASE.filter(c=>!agotadas.includes(c.id));
    if(!pool.length) return null;
    const def=pool[Math.floor(Math.random()*pool.length)];
    return {cartaId:def.id, progreso:0, nivelActual:1};
  }

  function inicializarCartasMedico(){
    const cartas=[];
    for(let i=0;i<3;i++){
      const nueva=generarCartaAleatoria(cartas.map(c=>c.cartaId));
      if(nueva) cartas.push(nueva);
    }
    return cartas;
  }

  function cambiarCartaMedico(idx){
    if((state.medicoCambiosUsados||0)>=lmCambiosCartaPorPartido()) return false;
    const otras=state.medicoCartas.filter((c,i)=>i!==idx).map(c=>c.cartaId);
    const nueva=generarCartaAleatoria(otras);
    if(!nueva) return false;
    state.medicoCartas[idx]=nueva;
    state.medicoCambiosUsados=(state.medicoCambiosUsados||0)+1;
    guardarEstado();
    return true;
  }

  // Aplica el efecto de una carta DIRECTA al tener éxito. Devuelve un
  // texto corto describiendo lo ocurrido, para mostrarlo en el resultado.
  function textoReduccion(antes, despues){
    if(antes===null||antes===undefined) return '';
    const reduccion=antes-Math.max(0,despues);
    if(reduccion<=0) return '';
    if(despues<=0) return ` — vuelve a estar disponible (${reduccion} jornada${reduccion===1?'':'s'} menos)`;
    return ` — pasa de ${antes} a ${despues} jornada${despues===1?'':'s'} de baja (-${reduccion})`;
  }
  function aplicarEfectoDirecta(def, jugadorObjetivo){
    const antes = jugadorObjetivo ? jugadorObjetivo.injuryWeeks : null;
    switch(def.id){
      case 'urgente':
        if(jugadorObjetivo){
          jugadorObjetivo.injuryWeeks=Math.max(0,Math.floor(jugadorObjetivo.injuryWeeks/2));
          if(jugadorObjetivo.injuryWeeks<=0){ jugadorObjetivo.injured=false; jugadorObjetivo.injurySeverity=null; cerrarLesionHistorial(jugadorObjetivo, 'Carta: '+def.nombre); }
        }
        return jugadorObjetivo?`${jugadorObjetivo.name} recorta a la mitad su tiempo de baja${textoReduccion(antes,jugadorObjetivo.injuryWeeks)}`:'Aplicado';
      case 'milagro':
        if(jugadorObjetivo){ jugadorObjetivo.injured=false; jugadorObjetivo.injuryWeeks=0; jugadorObjetivo.injurySeverity=null; cerrarLesionHistorial(jugadorObjetivo, 'Carta: '+def.nombre); }
        return jugadorObjetivo?`${jugadorObjetivo.name} recupera la disponibilidad al instante${textoReduccion(antes,0)}`:'Aplicado';
      case 'consulta':
        if(jugadorObjetivo){
          jugadorObjetivo.injuryWeeks=Math.max(0,jugadorObjetivo.injuryWeeks-1);
          if(jugadorObjetivo.injuryWeeks<=0){ jugadorObjetivo.injured=false; jugadorObjetivo.injurySeverity=null; cerrarLesionHistorial(jugadorObjetivo, 'Carta: '+def.nombre); }
        }
        return jugadorObjetivo?`${jugadorObjetivo.name} se recupera 1 semana antes${textoReduccion(antes,jugadorObjetivo.injuryWeeks)}`:'Aplicado';
      case 'cirugia':
        if(jugadorObjetivo){ jugadorObjetivo.injurySeverity='moderada'; jugadorObjetivo.injuryWeeks=Math.min(jugadorObjetivo.injuryWeeks,2); }
        return jugadorObjetivo?`La lesión de ${jugadorObjetivo.name} pasa a moderada${textoReduccion(antes,jugadorObjetivo.injuryWeeks)}`:'Aplicado';
      case 'prevencion_t':
        state.medicoBonos.riesgoLesionSiguiente = (state.medicoBonos.riesgoLesionSiguiente||1)*0.5;
        return 'Riesgo de lesión reducido para el próximo partido';
      case 'chequeo':
        state.plantilla.forEach(p=>{ p.fatigue=Math.min(100,(p.fatigue===undefined?100:p.fatigue)+15); });
        return 'La plantilla llega más fresca a este partido';
      default: return 'Aplicado';
    }
  }

  // Aplica el efecto PERMANENTE de una carta de ACUMULACIÓN al completar
  // un nivel (se acumula con niveles anteriores de la misma carta), y lo
  // deja anotado en el historial del médico.
  function aplicarNivelAcumulacion(def, nivel){
    switch(def.id){
      case 'sala_fisio': state.medicoBonos.recuperacionExtra=(state.medicoBonos.recuperacionExtra||0)+1; break;
      case 'prevencion_p': state.medicoBonos.riesgoLesionMultiplier=(state.medicoBonos.riesgoLesionMultiplier||1)*0.85; break;
      case 'especialista': state.medicoBonos.graveMultiplier=(state.medicoBonos.graveMultiplier||1)*0.5; break;
      case 'equipo_fisios': state.medicoBonos.recuperacionExtra=(state.medicoBonos.recuperacionExtra||0)+1; break;
    }
    registrarProgresoHistorial(`${def.nombre} actualizado a nivel ${nivel} — ${def.desc}`);
  }

  // Aplica el efecto PERMANENTE de una carta de NIVEL al tener éxito: sube
  // un nivel la especialidad correspondiente (curación/prevención ×
  // muscular/ósea), hasta un máximo de 3. Al llegar al máximo, la carta
  // queda agotada para siempre (no puede volver a salir en la mano).
  function aplicarNivelMejora(def){
    if(!state.medicoNiveles) state.medicoNiveles={curacionMuscular:0, curacionOsea:0, prevencionMuscular:0, prevencionOsea:0};
    const nivelNuevo=Math.min(NIVEL_MAXIMO_EQUIPO, nivelDe(def.track)+1);
    state.medicoNiveles[def.track]=nivelNuevo;
    const maxAlcanzado=nivelNuevo>=NIVEL_MAXIMO_EQUIPO;
    if(maxAlcanzado){
      state.medicoCartasAgotadas = state.medicoCartasAgotadas||[];
      state.medicoCartasAgotadas.push(def.id);
    }
    return {nivelNuevo, maxAlcanzado};
  }

  // Resuelve una tirada ya hecha (tiradas[] de dados de 6) sobre la carta
  // en la posición idx de la mano. Devuelve info para pintar el resultado.
  function resolverCartaMedico(idx, tiradas, jugadorObjetivoId){
    const instancia=state.medicoCartas[idx];
    const def=cartaDef(instancia.cartaId);
    if(!def) return {tipo:'error', texto:'No se encontró la carta — prueba a cambiarla.'};
    const suma=tiradas.reduce((a,b)=>a+b,0);
    let resultado;

    if(def.tipo==='directa'){
      const dificultadEfectiva=Math.max(3, def.dificultad - bonusEstrellasTrabajador('medico'));
      const exito = suma>=dificultadEfectiva;
      const jugadorObjetivo = jugadorObjetivoId ? state.plantilla.find(p=>p.id===jugadorObjetivoId) : null;
      if(exito){
        const texto=aplicarEfectoDirecta(def, jugadorObjetivo);
        state.medicoCartas[idx]=generarCartaAleatoria(state.medicoCartas.map(c=>c.cartaId)) || instancia;
        resultado={tipo:'directa', exito:true, suma, dificultad:dificultadEfectiva, texto};
      } else {
        resultado={tipo:'directa', exito:false, suma, dificultad:dificultadEfectiva, texto:'La carta se queda en tu mano — puedes reintentarlo más adelante'};
      }
    } else if(def.tipo==='nivel'){
      const dificultadActual=dificultadActualNivel(def);
      const exito = suma>=dificultadActual;
      if(exito){
        const {nivelNuevo, maxAlcanzado}=aplicarNivelMejora(def);
        state.medicoCartas[idx]=generarCartaAleatoria(state.medicoCartas.map(c=>c.cartaId)) || instancia;
        resultado={tipo:'nivel', exito:true, suma, dificultad:dificultadActual, nivelNuevo, maxAlcanzado, nombre:def.nombre};
      } else {
        resultado={tipo:'nivel', exito:false, suma, dificultad:dificultadActual, nombre:def.nombre, texto:'La carta se queda en tu mano — puedes reintentarlo más adelante'};
      }
    } else {
      // Acumulación: SIEMPRE suma, nunca "falla" la tirada en sí.
      instancia.progreso += suma;
      const umbral=def.niveles[instancia.nivelActual-1];
      let subioNivel=false, completada=false;
      while(instancia.progreso>=umbral && !completada){
        aplicarNivelAcumulacion(def, instancia.nivelActual);
        subioNivel=true;
        if(instancia.nivelActual>=def.niveles.length){
          completada=true;
        } else {
          instancia.progreso -= umbral;
          instancia.nivelActual++;
        }
      }
      if(completada){
        state.medicoCartasAgotadas = state.medicoCartasAgotadas||[];
        state.medicoCartasAgotadas.push(def.id);
        state.medicoCartas[idx]=generarCartaAleatoria(state.medicoCartas.map(c=>c.cartaId)) || instancia;
      }
      resultado={tipo:'acumulacion', suma, subioNivel, completada, nivelActual:instancia.nivelActual, umbral:def.niveles[Math.min(instancia.nivelActual,def.niveles.length)-1], progreso:instancia.progreso};
    }
    guardarEstado();
    return resultado;
  }

  /* ---------- 9c. CARTAS DE MISIÓN DEL EQUIPO DE MANTENIMIENTO Y SEGURIDAD ----------
     Mismo sistema que el Médico (10 cartas: 6 directa + 4 nivel, comparte
     el mismo fondo de dados por partido y su propio cambio de carta), pero
     aplicado al estadio en vez de a la plantilla. Dos frentes:
     - CÉSPED: estado 0-100, se desgasta con el mal tiempo cuando juegas en
       casa, se recupera un poco cada semana con el mantenimiento normal.
     - AFICIÓN: satisfacción -100..100, sube con las victorias y baja con
       las derrotas y con un césped descuidado. ---------- */
  const MANTENIMIENTO_CARTAS_BASE = [
    {id:'riego_emergencia',  tipo:'directa', nombre:'Riego de Emergencia',           icon:'ph-drop',              dificultad:6,  desc:'Recupera 20 puntos del estado del césped al instante'},
    {id:'renovacion_cesped', tipo:'directa', nombre:'Renovación Total del Césped',   icon:'ph-sparkle',           dificultad:15, desc:'Deja el césped en condiciones perfectas al instante'},
    {id:'revision_terreno',  tipo:'directa', nombre:'Revisión del Terreno de Juego', icon:'ph-magnifying-glass',  dificultad:5,  desc:'Recupera 10 puntos del estado del césped'},
    {id:'evento_aficion',    tipo:'directa', nombre:'Jornada de Puertas Abiertas',   icon:'ph-confetti',          dificultad:7,  desc:'Sube al instante la satisfacción de la afición'},
    {id:'gestion_crisis',    tipo:'directa', nombre:'Gestión de Crisis con Peñas',   icon:'ph-megaphone',         dificultad:12, requiereCrisis:true, desc:'Calma a una afición muy descontenta y estabiliza la satisfacción'},
    {id:'plan_comunicacion', tipo:'directa', nombre:'Plan de Comunicación',         icon:'ph-shield-check',      dificultad:7,  desc:'Amortigua la pérdida de satisfacción si el resultado no acompaña en el próximo partido'},
    {id:'sistema_riego',     tipo:'nivel', track:'prevencionDesgaste',    nombre:'Sistema de Riego Automático',  icon:'ph-drop-half-bottom', dificultadBase:8, dificultadPaso:4, desc:'Reduce el desgaste del césped por las inclemencias del tiempo'},
    {id:'greenkeeping',      tipo:'nivel', track:'recuperacionCesped',    nombre:'Servicio de Greenkeeping',     icon:'ph-plant',            dificultadBase:8, dificultadPaso:4, desc:'Acelera la recuperación natural del césped entre partidos'},
    {id:'experiencia_socio', tipo:'nivel', track:'boostSatisfaccion',     nombre:'Experiencia del Aficionado',   icon:'ph-ticket',           dificultadBase:8, dificultadPaso:4, desc:'Aumenta la satisfacción que genera cada victoria'},
    {id:'seguridad_grada',   tipo:'nivel', track:'proteccionSatisfaccion',nombre:'Seguridad y Grada Organizada', icon:'ph-shield-star',      dificultadBase:9, dificultadPaso:4, desc:'Reduce el descontento que genera una derrota o un césped descuidado'}
  ];
  function cartaDefM(id){ return MANTENIMIENTO_CARTAS_BASE.find(c=>c.id===id); }
  function nivelDeM(track){ return (state.mantenimientoNiveles && state.mantenimientoNiveles[track]) || 0; }
  function dificultadActualNivelM(def){ return Math.max(3, def.dificultadBase + nivelDeM(def.track)*def.dificultadPaso - bonusEstrellasTrabajador('mantenimiento')); }

  const NIVELES_MANTENIMIENTO_INFO=[
    {track:'prevencionDesgaste',     get label(){return t('nivel.mant.riego.label');},      icon:'ph-drop-half-bottom', get desc(){return t('nivel.mant.riego.desc');}},
    {track:'recuperacionCesped',     get label(){return t('nivel.mant.green.label');},          icon:'ph-plant',            get desc(){return t('nivel.mant.green.desc');}},
    {track:'boostSatisfaccion',      get label(){return t('nivel.mant.experiencia.label');}, icon:'ph-ticket',           get desc(){return t('nivel.mant.experiencia.desc');}},
    {track:'proteccionSatisfaccion', get label(){return t('nivel.mant.seguridad.label');},     icon:'ph-shield-star',      get desc(){return t('nivel.mant.seguridad.desc');}}
  ];
  function renderNivelesMantenimientoHTML(){
    return `<div class="med-niveles-grid">${NIVELES_MANTENIMIENTO_INFO.map(info=>{
      const n=nivelDeM(info.track);
      const completado=n>=NIVEL_MAXIMO_EQUIPO;
      return `<div class="med-nivel-row${completado?' med-nivel-completado':''}">
        ${completado?`<i class="ph ph-bold ph-check-circle med-nivel-check" title="${t('lm.tt_proyecto_completado')}"></i>`:''}
        <i class="ph ph-bold ${info.icon}"></i>
        <div class="med-nivel-info">
          <div class="med-nivel-label">${info.label}</div>
          <div class="med-nivel-desc">${info.desc}</div>
        </div>
        <div class="med-nivel-stars" title="${t('lm.nivel_n_de_x')} ${n}/${NIVEL_MAXIMO_EQUIPO}">${estrellasNivel(n)}</div>
      </div>`;
    }).join('')}</div>`;
  }

  function generarCartaAleatoriaMantenimiento(excluirIds){
    excluirIds = excluirIds || [];
    const agotadas = state.mantenimientoCartasAgotadas||[];
    const disponibles = MANTENIMIENTO_CARTAS_BASE.filter(c=>!excluirIds.includes(c.id) && !agotadas.includes(c.id));
    const pool = disponibles.length ? disponibles : MANTENIMIENTO_CARTAS_BASE.filter(c=>!agotadas.includes(c.id));
    if(!pool.length) return null;
    const def=pool[Math.floor(Math.random()*pool.length)];
    return {cartaId:def.id, progreso:0, nivelActual:1};
  }
  function inicializarCartasMantenimiento(){
    const cartas=[];
    for(let i=0;i<3;i++){
      const nueva=generarCartaAleatoriaMantenimiento(cartas.map(c=>c.cartaId));
      if(nueva) cartas.push(nueva);
    }
    return cartas;
  }
  function cambiarCartaMantenimiento(idx){
    if((state.mantenimientoCambiosUsados||0)>=lmCambiosCartaPorPartido()) return false;
    const otras=state.mantenimientoCartas.filter((c,i)=>i!==idx).map(c=>c.cartaId);
    const nueva=generarCartaAleatoriaMantenimiento(otras);
    if(!nueva) return false;
    state.mantenimientoCartas[idx]=nueva;
    state.mantenimientoCambiosUsados=(state.mantenimientoCambiosUsados||0)+1;
    guardarEstado();
    return true;
  }

  function mantenimientoBloqueadaPorEstado(def){
    if(def.id==='gestion_crisis') return !(state.estadio && state.estadio.satisfaccion<=-50);
    return false;
  }

  function textoCambioValor(label, antes, despues){
    const delta=despues-antes;
    if(delta===0) return '';
    return ` — ${label} ${antes} → ${despues} (${delta>0?'+':''}${delta})`;
  }
  function aplicarEfectoDirectaMantenimiento(def){
    const est=state.estadio;
    switch(def.id){
      case 'riego_emergencia': {
        const antes=est.campo; est.campo=Math.min(100, est.campo+20);
        return `El césped mejora su estado${textoCambioValor('campo',antes,est.campo)}`;
      }
      case 'renovacion_cesped': {
        const antes=est.campo; est.campo=100;
        return `El césped queda en condiciones perfectas${textoCambioValor('campo',antes,est.campo)}`;
      }
      case 'revision_terreno': {
        const antes=est.campo; est.campo=Math.min(100, est.campo+10);
        return `Pequeñas mejoras en el terreno de juego${textoCambioValor('campo',antes,est.campo)}`;
      }
      case 'evento_aficion': {
        const antes=est.satisfaccion; est.satisfaccion=Math.max(-100,Math.min(100, est.satisfaccion+15));
        return `La afición responde bien al evento${textoCambioValor('satisfacción',antes,est.satisfaccion)}`;
      }
      case 'gestion_crisis': {
        const antes=est.satisfaccion; est.satisfaccion=Math.max(est.satisfaccion, -30);
        return `Se calma el ambiente con las peñas${textoCambioValor('satisfacción',antes,est.satisfaccion)}`;
      }
      case 'plan_comunicacion':
        state.mantenimientoBonos = state.mantenimientoBonos||{};
        state.mantenimientoBonos.amortiguarPerdida = true;
        return 'La pérdida de satisfacción por un mal resultado quedará amortiguada en el próximo partido';
      default: return 'Aplicado';
    }
  }
  function aplicarNivelMejoraMantenimiento(def){
    if(!state.mantenimientoNiveles) state.mantenimientoNiveles={prevencionDesgaste:0, recuperacionCesped:0, boostSatisfaccion:0, proteccionSatisfaccion:0};
    const nivelNuevo=Math.min(NIVEL_MAXIMO_EQUIPO, nivelDeM(def.track)+1);
    state.mantenimientoNiveles[def.track]=nivelNuevo;
    const maxAlcanzado=nivelNuevo>=NIVEL_MAXIMO_EQUIPO;
    if(maxAlcanzado){
      state.mantenimientoCartasAgotadas = state.mantenimientoCartasAgotadas||[];
      state.mantenimientoCartasAgotadas.push(def.id);
    }
    return {nivelNuevo, maxAlcanzado};
  }

  function resolverCartaMantenimiento(idx, tiradas){
    const instancia=state.mantenimientoCartas[idx];
    const def=cartaDefM(instancia.cartaId);
    if(!def) return {tipo:'error', texto:'No se encontró la carta — prueba a cambiarla.'};
    const suma=tiradas.reduce((a,b)=>a+b,0);
    let resultado;
    if(def.tipo==='directa'){
      const dificultadEfectiva=Math.max(3, def.dificultad - bonusEstrellasTrabajador('mantenimiento'));
      const exito = suma>=dificultadEfectiva;
      if(exito){
        const texto=aplicarEfectoDirectaMantenimiento(def);
        state.mantenimientoCartas[idx]=generarCartaAleatoriaMantenimiento(state.mantenimientoCartas.map(c=>c.cartaId)) || instancia;
        resultado={tipo:'directa', exito:true, suma, dificultad:dificultadEfectiva, texto};
      } else {
        resultado={tipo:'directa', exito:false, suma, dificultad:dificultadEfectiva, texto:'La carta se queda en tu mano — puedes reintentarlo más adelante'};
      }
    } else {
      const dificultadActual=dificultadActualNivelM(def);
      const exito = suma>=dificultadActual;
      if(exito){
        const {nivelNuevo, maxAlcanzado}=aplicarNivelMejoraMantenimiento(def);
        state.mantenimientoCartas[idx]=generarCartaAleatoriaMantenimiento(state.mantenimientoCartas.map(c=>c.cartaId)) || instancia;
        resultado={tipo:'nivel', exito:true, suma, dificultad:dificultadActual, nivelNuevo, maxAlcanzado, nombre:def.nombre};
      } else {
        resultado={tipo:'nivel', exito:false, suma, dificultad:dificultadActual, nombre:def.nombre, texto:'La carta se queda en tu mano — puedes reintentarlo más adelante'};
      }
    }
    guardarEstado();
    return resultado;
  }

  function colorCampo(valor){ if(valor>=70) return 'green'; if(valor>=40) return 'yellow'; return 'red'; }
  // Cierre universal de popups: botón X en la esquina + clic fuera de la
  // tarjeta (sobre el fondo oscuro) también cierra.
  function xCerrarHTML(){ return '<button class="lm-popup-close-x" data-cerrar-x title="Cerrar">×</button>'; }
  function habilitarCierreOverlay(overlay, cerrarFn){
    overlay.addEventListener('click', (e)=>{ if(e.target===overlay){ if(typeof window.playSound==='function') window.playSound('select'); cerrarFn(); } });
  }
  // Aviso propio del juego — sustituye al alert() nativo del navegador
  // (ese "www.goal2goat.com dice" no pinta nada aquí).
  // Botón "MOSTRAR INFORMACIÓN" de cada hub — un clic la abre, y se
  // cierra con la X, con CERRAR, o clicando fuera (igual que el resto
  // de ventanas del juego). Cada función abrirInfoFn ya trae su propio
  // cierre completo cuando se le pasa "false" (modo normal, no efímero).
  function mostrarInfoHTML(){
    return `<button type="button" class="mode-card-btn mode-card-btn-secondary lm-mostrar-info-btn" data-mostrar-info><i class="ph ph-bold ph-eye"></i> ${t('lm.mostrar_informacion')}</button>`;
  }
  function wireMostrarInfoHold(container, abrirInfoFn){
    const btn=container.querySelector('[data-mostrar-info]');
    if(!btn) return;
    btn.addEventListener('click', (e)=>{
      e.preventDefault();
      if(typeof window.playSound==='function') window.playSound('select');
      abrirInfoFn(false);
    });
  }
  // Genera un once + banquillo del rival a partir de su plantilla real y
  // su nivel medio de equipo — no tenemos stats individuales de los
  // rivales, así que se reparten con una pequeña variación alrededor de
  // su media, con una formación genérica razonable.
  function generarOnceRivalFicticio(rival){
    const nombres=plantillaEfectivaRival(rival);
    function statVariada(base){ return Math.max(35, Math.min(97, Math.round(base+Math.floor(Math.random()*13)-6))); }
    function jugadorDe(entry, idx, pos, offsetExtra){
      const nombre = entry ? (entry.name||entry) : `Jugador ${idx+1}${offsetExtra||''}`;
      const numero = entry ? entry.n : null;
      // Si el jugador ya tiene estadísticas individuales reales cargadas
      // en teams-data.js, se usan tal cual — solo se generan al azar
      // alrededor de la media del equipo para los jugadores que todavía
      // no las tienen (plantillas pendientes de completar).
      const tieneStatsReales = entry && entry.attack!==undefined;
      return {
        name:nombre, numero, position:pos,
        attack: tieneStatsReales ? entry.attack : statVariada(rival.attack),
        defense: tieneStatsReales ? entry.defense : statVariada(rival.defense),
        pace: tieneStatsReales ? entry.pace : statVariada(rival.pace),
        passing: tieneStatsReales ? entry.passing : statVariada(rival.passing),
        technique: tieneStatsReales ? entry.technique : statVariada(rival.technique)
      };
    }
    const posicionesTitulares=['POR','DFC','DFC','LI','LD','MC','MC','MC','EI','ED','DC'];
    const titulares=posicionesTitulares.map((pos,i)=>jugadorDe(nombres[i], i, pos));
    const posicionesBanquillo=['POR','DFC','MC','ED','DC'];
    const banquillo=posicionesBanquillo.map((pos,i)=>jugadorDe(nombres[11+i], i, pos));
    return {titulares, banquillo};
  }
  // Versión independiente de la revelación del sobre, para poder
  // abrirlo directamente desde el correo (sin pasar por la interfaz del
  // Director Deportivo). Misma animación de barajado y misma mecánica
  // de fichar, pero con un overlay propio — y con el destacado especial
  // para el FICHAJE ESTRELLA cuando aparece un jugador real de otro
  // equipo en vez de un canterano inventado.
  // Reparte una cara aleatoria por jugador de las 3 tarjetas del sobre,
  // sin repetir entre ellas — porteros usan siempre una imagen "portero",
  // el resto de posiciones usan una imagen "jugador".
  const SOBRE_CARAS_JUGADOR=['jugador1','jugador2','jugador3','jugador4','jugador5','jugador6'];
  const SOBRE_CARAS_PORTERO=['portero1','portero2','portero3','portero4'];
  function asignarCarasSobre(jugadores){
    const jBarajado=SOBRE_CARAS_JUGADOR.slice(); if(typeof shuffle==='function') shuffle(jBarajado);
    const pBarajado=SOBRE_CARAS_PORTERO.slice(); if(typeof shuffle==='function') shuffle(pBarajado);
    let jIdx=0, pIdx=0;
    return jugadores.map(j=>{
      if(j.position==='POR'){ const f=pBarajado[pIdx%pBarajado.length]; pIdx++; return 'assets/sobres/'+f+'.png'; }
      const f=jBarajado[jIdx%jBarajado.length]; jIdx++; return 'assets/sobres/'+f+'.png';
    });
  }
  function mostrarRevelacionSobreDesdeCorreo(jugadores, onCerrar){
    const overlay=document.createElement('div');
    overlay.id='lmSobreCorreoOverlay';
    overlay.innerHTML=`
      <div class="lm-sobre-apertura-wrap">
        <div class="lm-sobre-apertura-titulo">${t('lm.sobre_titulo')}</div>
        <div class="lm-sobre-apertura-stage">
          <img src="assets/sobres/sobre.png" class="lm-sobre-img-flotante" id="lmSobreImgArrastrable" draggable="false">
          <div class="lm-sobre-rasga-zona" id="lmSobreGrabZone">
            <span class="lm-sobre-rasga-barrido"></span>
          </div>
        </div>
        <div class="lm-sobre-apertura-hint" id="lmSobreHint">${t('lm.sobre_arrastra')}</div>
      </div>`;
    document.getElementById('ligaManagerScreen').appendChild(overlay);

    const img=overlay.querySelector('#lmSobreImgArrastrable');
    const zona=overlay.querySelector('#lmSobreGrabZone');
    const hint=overlay.querySelector('#lmSobreHint');
    const UMBRAL_APERTURA=180; // px que hay que arrastrar — casi todo el recorrido de la franja, para que no se abra al mínimo roce
    let arrastrando=false, startX=0, abierto=false, ultimaEstelaTs=0, ultimoSonidoTs=0;

    function posX(e){ return (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX; }
    function posY(e){ return (e.touches && e.touches[0]) ? e.touches[0].clientY : e.clientY; }
    // Estela amarilla que sigue al puntero mientras se arrastra — una
    // mota nueva cada pocos milisegundos, que se desvanece sola.
    function crearEstela(x, y){
      const punto=document.createElement('div');
      punto.className='lm-sobre-estela-punto';
      punto.style.left=x+'px';
      punto.style.top=y+'px';
      document.body.appendChild(punto);
      requestAnimationFrame(()=>{ punto.style.opacity='0'; punto.style.transform='translate(-50%,-50%) scale(2.2)'; });
      setTimeout(()=>punto.remove(), 450);
    }

    function onMove(e){
      if(!arrastrando || abierto) return;
      const deltaCrudo=posX(e)-startX; // negativo = hacia la izquierda, positivo = hacia la derecha
      const delta=Math.abs(deltaCrudo);
      const progreso=Math.min(1, delta/UMBRAL_APERTURA);
      img.style.transform=`translateX(${deltaCrudo*0.5}px) scale(${1+progreso*0.05})`;
      img.style.filter=`brightness(${1+progreso*0.35})`;
      zona.style.opacity=String(1-progreso*0.7);
      hint.style.opacity=String(1-progreso);
      const ahora=Date.now();
      if(ahora-ultimaEstelaTs>28){ ultimaEstelaTs=ahora; crearEstela(posX(e), posY(e)); }
      if(ahora-ultimoSonidoTs>90){ ultimoSonidoTs=ahora; if(typeof window.playSound==='function') window.playSound('envelope_drag', progreso); }
      if(delta>=UMBRAL_APERTURA) completarApertura(deltaCrudo>0?1:-1);
    }
    function onUp(){
      if(abierto) return;
      arrastrando=false;
      // No llegó al umbral: el sobre vuelve suavemente a su sitio.
      img.style.transition='transform .3s ease, filter .3s ease';
      img.style.transform='';
      img.style.filter='';
      zona.style.opacity='1';
      hint.style.opacity='1';
      setTimeout(()=>{ if(img) img.style.transition=''; }, 300);
    }
    function completarApertura(direccion){
      if(abierto) return;
      abierto=true;
      if(typeof window.playSound==='function') window.playSound('select');
      img.style.transition='transform .35s ease, opacity .35s ease';
      img.style.transform=`translateX(${direccion*220}px) scale(1.1)`;
      img.style.opacity='0';
      zona.style.transition='opacity .2s ease';
      zona.style.opacity='0';
      hint.style.transition='opacity .2s ease';
      hint.style.opacity='0';
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchend', onUp);
      setTimeout(()=>{ mostrarSpinDeSobre(overlay, jugadores, onCerrar); }, 320);
    }
    zona.addEventListener('mousedown', (e)=>{ e.preventDefault(); arrastrando=true; startX=posX(e); });
    zona.addEventListener('touchstart', (e)=>{ arrastrando=true; startX=posX(e); }, {passive:true});
    document.addEventListener('mousemove', onMove);
    document.addEventListener('touchmove', onMove, {passive:true});
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchend', onUp);
  }

  // Segunda mitad de la apertura del sobre: la tirada de cartas de
  // siempre, reutilizando el mismo overlay ya abierto.
  function mostrarSpinDeSobre(overlay, jugadores, onCerrar){
    const carasBarajado=[...SOBRE_CARAS_JUGADOR, ...SOBRE_CARAS_PORTERO];
    const posicionesBarajado=['POR','DFC','LI','LD','MC','EI','ED','DC'];
    overlay.innerHTML=`
      <div class="lm-dilemma-card lm-dilemma-card-dd lm-sobre-popup-ancho" style="max-width:860px">
        <div class="lm-dilemma-title"><i class="ph ph-bold ph-envelope-open"></i> ${t('lm.sobre_titulo')}</div>
        <div id="lmSobreReveloZoneCorreo" class="lm-sobre-cards">
          ${jugadores.map((j,i)=>`
          <div class="lm-sobre-card lm-sobre-card-barajando" id="lmSobreReelC${i}" style="animation-delay:${i*0.35}s">
            <div class="lm-sobre-cara"><img id="lmSobreCaraBarajo${i}" src="assets/sobres/${carasBarajado[Math.floor(Math.random()*carasBarajado.length)]}.png" alt=""><span class="lm-sobre-pos-badge" id="lmSobrePosBarajo${i}">?</span></div>
            <div class="lm-sobre-nombre" id="lmSobreNombreBarajo${i}">···</div>
            <div class="lm-sobre-overall" id="lmSobreOverallBarajo${i}">??</div>
            <div class="lm-sobre-stats-fila">
              <span><b>··</b>ATA</span><span><b>··</b>DEF</span><span><b>··</b>RIT</span><span><b>··</b>PAS</span><span><b>··</b>TEC</span>
            </div>
          </div>`).join('')}
        </div>
        <div id="lmSobreResultadoCorreo"></div>
      </div>`;
    let ticks=0;
    const totalTicks=11+Math.floor(Math.random()*4);
    const spin=setInterval(()=>{
      jugadores.forEach((j,i)=>{
        const nombreEl=document.getElementById('lmSobreNombreBarajo'+i);
        const caraEl=document.getElementById('lmSobreCaraBarajo'+i);
        const posEl=document.getElementById('lmSobrePosBarajo'+i);
        const overallEl=document.getElementById('lmSobreOverallBarajo'+i);
        if(nombreEl) nombreEl.textContent=nombreJugadorAleatorio();
        if(caraEl) caraEl.src='assets/sobres/'+carasBarajado[Math.floor(Math.random()*carasBarajado.length)]+'.png';
        if(posEl) posEl.textContent=posicionesBarajado[Math.floor(Math.random()*posicionesBarajado.length)];
        if(overallEl) overallEl.textContent=40+Math.floor(Math.random()*55);
      });
      if(typeof window.playSound==='function') window.playSound('spin');
      ticks++;
      if(ticks>=totalTicks){
        clearInterval(spin);
        // El fichaje estrella se anuncia con más fanfarria — sonido y
        // vibración visual propios, para que destaque de verdad frente
        // a un canterano cualquiera.
        const hayEstrella=jugadores.some(j=>j.esFichajeEstrella);
        if(typeof window.playSound==='function') window.playSound(hayEstrella?'victory':'reveal');
        const zonaReels=document.getElementById('lmSobreReveloZoneCorreo');
        if(zonaReels) zonaReels.innerHTML='';
        const zona=document.getElementById('lmSobreResultadoCorreo');
        const caras=asignarCarasSobre(jugadores);
        zona.innerHTML=`${hayEstrella?`<div class="lm-fichaje-estrella-banner"><i class="ph ph-bold ph-sparkle"></i> ${t('lm.hay_fichaje_estrella')} <i class="ph ph-bold ph-sparkle"></i></div>`:''}
          <div class="lm-sobre-cards" id="lmSobreCardsRow">${jugadores.map((j,i)=>`
          <div class="lm-sobre-card ${j.esFichajeEstrella?'lm-sobre-card-estrella':''}" data-jugador="${i}" style="animation-delay:${i*0.35}s">
            ${j.esFichajeEstrella?`<div class="lm-fichaje-estrella-tag"><i class="ph ph-bold ph-star"></i> ${t('lm.fichaje_estrella')}</div>`:''}
            ${(!j.esFichajeEstrella && j.esOportunidad)?`<div class="lm-trab-chollo-badge lm-sobre-oportunidad-badge"><i class="ph ph-bold ph-seal-percent"></i> ${t('lm.oportunidad')}</div>`:''}
            <div class="lm-sobre-cara"><img src="${caras[i]}" alt="${j.position}"><span class="lm-sobre-pos-badge">${j.position}</span></div>
            <div class="lm-sobre-nombre">${j.numero?('#'+j.numero+' '):''}${j.name}</div>
            ${j.esFichajeEstrella?`<div class="lm-sobre-procedencia">${t('lm.actualmente_en')} ${j.equipoOrigenName}</div>`:''}
            <div class="lm-sobre-overall">${j.overall} <span>${t('lm.puntuacion')}</span></div>
            ${(typeof lmSkillActiva==='function' && lmSkillActiva('lm_ojo_clinico')) ? `<div class="lm-sobre-potencial"><i class="ph ph-bold ph-binoculars"></i> ${t('lm.potencial_techo')}: <b>${j.potencial||j.overall}</b></div>` : ''}
            <div class="lm-sobre-stats-fila">
              <span><b>${j.attack}</b>${t('lm.stat_ata')}</span><span><b>${j.defense}</b>${t('lm.stat_def')}</span><span><b>${j.pace}</b>${t('lm.stat_rit')}</span><span><b>${j.passing}</b>${t('lm.stat_pas')}</span><span><b>${j.technique}</b>${t('lm.stat_tec')}</span>
            </div>
            <div class="lm-sobre-salario">${formatoDinero(j.salario)}/mes</div>
            <button class="mode-card-btn mode-card-btn-gold lm-sobre-fichar" data-fichar="${i}">${t('lm.fichar_btn')}</button>
          </div>`).join('')}</div>
          <div class="lm-popup-actions" style="margin-top:12px"><button id="lmSobreCerrarCorreo" class="mode-card-btn lm-btn-rojo">${t('lm.cerrar_sobre')}</button></div>`;
        const filaCards=zona.querySelector('#lmSobreCardsRow');
        filaCards.querySelectorAll('.lm-sobre-card').forEach(carta=>{
          carta.addEventListener('click', (e)=>{
            if(e.target.closest('[data-fichar]')) return; // el botón FICHAR tiene su propio manejador
            if(typeof window.playSound==='function') window.playSound('select');
            const yaEnfocada=carta.classList.contains('lm-sobre-card-focused');
            filaCards.querySelectorAll('.lm-sobre-card').forEach(c=>c.classList.remove('lm-sobre-card-focused'));
            filaCards.classList.toggle('lm-sobre-cards-con-foco', !yaEnfocada);
            if(!yaEnfocada) carta.classList.add('lm-sobre-card-focused');
          });
        });
        let fichadoNombre=null;
        const botonesFichar=zona.querySelectorAll('[data-fichar]');
        botonesFichar.forEach(btn=>{
          btn.addEventListener('click', ()=>{
            const i=parseInt(btn.getAttribute('data-fichar'),10);
            if(typeof window.playSound==='function') window.playSound('select');
            ficharJugadorSobre(jugadores[i]);
            fichadoNombre=jugadores[i].name;
            btn.textContent='FICHADO ✔';
            btn.closest('.lm-sobre-card').classList.add('lm-sobre-card-fichado');
            // Solo se puede fichar UNO de los 3 — los otros dos quedan
            // bloqueados en cuanto se confirma uno.
            botonesFichar.forEach(otro=>{
              otro.disabled=true;
              if(otro!==btn) otro.textContent='NO ELEGIDO';
            });
          });
        });
        document.getElementById('lmSobreCerrarCorreo').addEventListener('click', ()=>{
          if(typeof window.playSound==='function') window.playSound('select');
          overlay.remove();
          onCerrar(fichadoNombre);
        });
      }
    },85);
  }

  // Clasificación como ventana emergente — se abre desde el botón del
  // header que antes era "RANKING" (ahora "CLASIFICACIÓN" mientras estás
  // en Liga Manager). Ya no vive fija dentro de ninguna columna.
  function abrirClasificacionLM(){
    if(!state || !state.setupComplete) return;
    const overlay=document.createElement('div');
    overlay.id='lmClasifOverlay';
    const clasif=calcularClasificacion();
    overlay.innerHTML=`
      <div class="lm-dilemma-card lm-clasif-popup-card" style="max-width:600px">
        ${xCerrarHTML()}
        <div class="lm-dilemma-title"><i class="ph ph-bold ph-ranking"></i> ${t('lm.clasificacion')}</div>
        <div class="lm-clasif-scroll-area">
          <div class="lm-table-wrap">
            <table class="lm-table lm-table-grande">
              <thead><tr><th></th><th>#</th><th>${t('lm.tabla_equipo')}</th><th>${t('lm.tabla_pj')}</th><th>${t('lm.tabla_g')}</th><th>${t('lm.tabla_e')}</th><th>${t('lm.tabla_p')}</th><th>${t('lm.tabla_pts')}</th></tr></thead>
              <tbody>
                ${clasif.map((t2,i)=>`<tr class="${t2.id==='lm_0'?'lm-myteam':''} lm-zona-${zonaClasificacion(i+1)}">
                  <td>${t2.id==='lm_0'?crestHTML(state.escudo,20):rivalCrestHTML(20, t2.crestImg)}</td>
                  <td>${i+1}</td><td>${t2.name}</td><td>${t2.pj}</td><td>${t2.pg}</td><td>${t2.pe}</td><td>${t2.pp}</td><td><strong>${t2.pts}</strong></td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
        <div class="lm-legend">
          <span><i class="lm-legend-dot lm-zona-champions"></i>${t('lm.zona_champions')}</span>
          <span><i class="lm-legend-dot lm-zona-europa"></i>${t('lm.zona_europa')}</span>
          <span><i class="lm-legend-dot lm-zona-conference"></i>${t('lm.zona_conference')}</span>
          <span><i class="lm-legend-dot lm-zona-descenso"></i>${t('lm.zona_descenso')}</span>
        </div>
        <div class="lm-popup-actions"><button id="lmClasifCerrarBtn" class="mode-card-btn mode-card-btn-gold">${t('lm.cerrar')}</button></div>
      </div>`;
    document.getElementById('ligaManagerScreen').appendChild(overlay);
    habilitarCierreOverlay(overlay, ()=>overlay.remove());
    overlay.querySelector('[data-cerrar-x]').addEventListener('click', ()=>overlay.remove());
    overlay.querySelector('#lmClasifCerrarBtn').addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      overlay.remove();
    });
  }
  window.abrirClasificacionLM = abrirClasificacionLM;
  // El botón del header decide qué abrir según el modo actual — el
  // ranking online de Copa Leyendas, o la clasificación de Liga Manager.
  window.handleRankingOrClasificacionClick = function(){
    if(document.body.classList.contains('liga-manager-screen')){
      if(typeof window.playSound==='function') window.playSound('select');
      window.abrirClasificacionLM();
    } else if(typeof window.showRankingModal==='function'){
      window.showRankingModal();
    }
  };

  /* ---------- 7b. Resumen de fin de temporada ---------- */
  // Recorre las 38 jornadas ya jugadas buscando el partido de mayor
  // margen de victoria y el de mayor margen de derrota de MI equipo —
  // usado en el resumen final de temporada. Se recalcula sobre
  // state.resultados (nunca se guarda aparte), igual que la propia
  // clasificación.
  function calcularResultadosDestacadosTemporada(){
    let mejorVictoria=null, peorDerrota=null;
    for(let j=0;j<38;j++){
      const jornada=state.calendario[j];
      if(!jornada) continue;
      jornada.forEach(partido=>{
        if(partido.home.id!=='lm_0' && partido.away.id!=='lm_0') return;
        const key=j+'-'+partido.home.id+'-'+partido.away.id;
        const res=state.resultados[key];
        if(!res) return;
        const miEsLocal=partido.home.id==='lm_0';
        const misGoles = miEsLocal?res.golesA:res.golesB;
        const susGoles = miEsLocal?res.golesB:res.golesA;
        const rivalNombre = miEsLocal?partido.away.name:partido.home.name;
        const diff=misGoles-susGoles;
        if(diff>0 && (!mejorVictoria || diff>mejorVictoria.diff)) mejorVictoria={misGoles, susGoles, rivalNombre, diff, jornada:j+1};
        else if(diff<0 && (!peorDerrota || diff<peorDerrota.diff)) peorDerrota={misGoles, susGoles, rivalNombre, diff, jornada:j+1};
      });
    }
    return {mejorVictoria, peorDerrota};
  }
  // Popup de fin de temporada — mismo patrón visual que el resto de la
  // interfaz (.lm-dilemma-card / .lm-clasif-popup-card, con su zona de
  // scroll interna para que quepa en cualquier pantalla), a modo de
  // resumen esquemático de toda la temporada: clasificación, resultados
  // destacados, máximo goleador, balance financiero y proyectos
  // conseguidos por el cuerpo técnico.
  // Recoge los 20 equipos (el mío + los 19 rivales) ya presentes en el
  // calendario de la temporada que acaba de terminar — así una nueva
  // temporada con progreso mantiene la misma liga, sin volver a
  // sortear rivales ni arriesgarse a duplicar o perder ninguno.
  function extraerEquiposCalendarioActual(){
    const mapa=new Map();
    (state.calendario||[]).forEach(jornada=>{
      (jornada||[]).forEach(partido=>{
        mapa.set(partido.home.id, partido.home);
        mapa.set(partido.away.id, partido.away);
      });
    });
    return [...mapa.values()];
  }
  // Nueva temporada MANTENIENDO todo el progreso (plantilla, mejoras,
  // capital, logros, escudo...) — solo se reinician los elementos
  // propios de una temporada concreta: el calendario (nuevos
  // emparejamientos), el marcador de jornada, los resultados
  // acumulados, la fecha de inicio (la siguiente temporada real) y el
  // contador de goles de la temporada de cada jugador (para que el
  // resumen del año que viene empiece de cero, no arrastre los goles
  // del año anterior).
  function iniciarNuevaTemporadaConProgreso(){
    const teams=extraerEquiposCalendarioActual();
    state.jornadaActual=1;
    state.calendario=generarCalendario(teams);
    state.resultados={};
    state.fechaInicioLiga=fechaISO(inicioTemporadaRealista());
    state.semanaResueltaParaJornada=undefined;
    calendarioMesVisto=null;
    calendarioJornadaSincronizada=null;
    (state.plantilla||[]).forEach(p=>{ p.golesTemporada=0; });
    state.giroTacticoUsosRestantes=getMaxGiroTacticoLM();
    state.giroTacticoMitad=1;
    state.estuvoEnDescensoEstaTemporada=false;
    guardarEstado();
    render();
  }
  // Premio económico de fin de temporada: depende de dónde se termine
  // en la clasificación Y de la complejidad de lo conseguido durante
  // la partida (los logros más difíciles pesan más que los básicos,
  // reutilizando directamente los "pts" ya asignados a cada tier).
  // Solo se paga si se puede continuar (nunca en caso de descenso o
  // números rojos — el club no sobrevive, no hay nada que premiar).
  // Texto para compartir el resumen de fin de temporada — mismo
  // patrón que buildTeamShareText()/shareMyTeam() de Copa Leyendas
  // (game.js): navigator.share si está disponible, si no portapapeles,
  // y si tampoco un alert como último recurso. Aquí vive en un
  // archivo propio de Liga Manager para no tocar game.js.
  // Texto para compartir el resumen de fin de temporada -- mismo
  // patron que buildTeamShareText()/shareMyTeam() de Copa Leyendas
  // (game.js): navigator.share si esta disponible, si no portapapeles,
  // y si tampoco un alert como ultimo recurso. Aqui vive en un
  // archivo propio de Liga Manager para no tocar game.js.
  //
  // Reescrito para ser un informe completo y profesional en vez de
  // 4 lineas sueltas con emojis -- estructurado por secciones, con
  // encabezados en mayusculas y separadores, pensado para poder
  // pegarse tal cual en un chat o una red social y leerse con
  // seriedad, no como una notificacion rapida.
  // Texto para compartir el resumen de fin de temporada -- mismo
  // patron que buildTeamShareText()/shareMyTeam() de Copa Leyendas
  // (game.js): navigator.share si esta disponible, si no portapapeles,
  // y si tampoco un alert como ultimo recurso. Aqui vive en un
  // archivo propio de Liga Manager para no tocar game.js.
  //
  // Informe completo por secciones, con algun emoji puntual de
  // cabecera (no en cada linea) para que se lea bien en redes/chat
  // sin perder seriedad ni completitud.
  function buildLMResumenShareText(datos){
    const {miPos, misDatos, claveValoracion, mejorVictoria, peorDerrota, maxGoleador, premioTemporada, estrellasTotal, estrellasMax, dptos, ingresosTotales, gastosTotales, balanceNeto, capitalFinal, claveVeredicto, finDeLaPartida}=datos;
    const sep='---------------------------';
    const lines=[
      `\ud83c\udfc6 GOAL2GOAT . LIGA MANAGER`,
      `Informe de fin de temporada -- ${state.nombreEquipo.toUpperCase()}`,
      sep,
      `${t(claveValoracion)}`,
      '',
      '\ud83d\udcca CLASIFICACION',
      `Posicion final: ${miPos}o`,
      `Puntos: ${misDatos?misDatos.pts:0}`,
      `Balance: ${misDatos?misDatos.pg:0}G ${misDatos?misDatos.pe:0}E ${misDatos?misDatos.pp:0}P`,
      `Goles: ${misDatos?misDatos.gf:0} a favor, ${misDatos?misDatos.gc:0} en contra (diferencia ${misDatos?((misDatos.gf-misDatos.gc>0?'+':'')+(misDatos.gf-misDatos.gc)):0})`,
      sep,
      '\u26bd RESULTADOS DESTACADOS',
      mejorVictoria ? `Mayor victoria: ${state.nombreEquipo} ${mejorVictoria.misGoles}-${mejorVictoria.susGoles} ${mejorVictoria.rivalNombre} (jornada ${mejorVictoria.jornada})` : 'Mayor victoria: sin victorias registradas',
      peorDerrota ? `Peor derrota: ${state.nombreEquipo} ${peorDerrota.misGoles}-${peorDerrota.susGoles} ${peorDerrota.rivalNombre} (jornada ${peorDerrota.jornada})` : 'Peor derrota: sin derrotas registradas',
      `Maximo goleador: ${(maxGoleador && maxGoleador.golesTemporada>0) ? `${maxGoleador.name} (${maxGoleador.golesTemporada} goles)` : 'sin goles registrados'}`,
      sep,
      '\ud83d\udcb0 BALANCE FINANCIERO',
      premioTemporada ? `Premio de temporada: +${formatoDinero(premioTemporada.total)}` : null,
      `Ingresos totales: +${formatoDinero(ingresosTotales)}`,
      `Gastos totales: -${formatoDinero(gastosTotales)}`,
      `Balance neto: ${balanceNeto>=0?'+':''}${formatoDinero(balanceNeto)}`,
      `Capital final: ${formatoDinero(capitalFinal)}`,
      sep,
      '\ud83c\udfdf\ufe0f CUERPO TECNICO',
      `Mejoras conseguidas: ${estrellasTotal}/${estrellasMax}`,
      ...dptos.map(d=>`${d.nombre}: ${d.n}/${d.nMax}`),
      sep,
      finDeLaPartida ? `${t(claveVeredicto)}` : `\u2705 ${t('lm.resumen_temporada_puede_continuar')}`,
      '',
      '\u26bd goal2goat.com',
    ].filter(l=>l!==null);
    return lines.join('\n');
  }
  async function shareLMResumenTemporada(datos){
    const text=buildLMResumenShareText(datos);
    if(navigator.share){
      try{ await navigator.share({text}); }catch(e){ /* cancelado por el usuario, nada que hacer */ }
    }else{
      try{
        await navigator.clipboard.writeText(text);
        if(typeof showToast==='function') showToast('\ud83d\udccb Copiado al portapapeles', 'toast-pos');
      }catch(e){
        alert(text);
      }
    }
  }
  // Informe imprimible / "Guardar como PDF" -- documento HTML
  // independiente con diseno moderno de informe deportivo de datos
  // (estilo "matchday report" de analitica de futbol del siglo XXI):
  // tipografia de palo, cabecera con marca de color, tarjetas de
  // estadisticas en cuadricula, tablas con cabecera oscura y filas
  // alternas, franjas de color para cada bloque. Abre el dialogo de
  // impresion del propio navegador (con "Guardar como PDF" ya
  // disponible ahi en Chrome, Edge, Safari, etc. sin libreria externa).
  function buildLMResumenPrintHTML(datos){
    const {miPos, misDatos, claveValoracion, mejorVictoria, peorDerrota, maxGoleador, premioTemporada, estrellasTotal, estrellasMax, dptos, ingresosTotales, gastosTotales, balanceNeto, capitalFinal, claveVeredicto, finDeLaPartida}=datos;
    const fecha=new Date().toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'});
    const dg = misDatos ? (misDatos.gf-misDatos.gc) : 0;
    const statCard=(numero,label)=>`<div class="stat-card"><div class="stat-num">${numero}</div><div class="stat-label">${label}</div></div>`;
    const filaTabla=(label,valor,clase)=>`<tr><td>${label}</td><td class="val ${clase||''}">${valor}</td></tr>`;
    const dptosFilas = dptos.map(d=>{
      const pct = Math.round((d.n/Math.max(1,d.nMax))*100);
      return `<tr><td>${d.nombre}</td><td class="val">${d.n}/${d.nMax}</td><td class="barcell"><div class="barbg"><div class="barfill" style="width:${pct}%"></div></div></td></tr>`;
    }).join('');
    return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<title>Informe de temporada -- ${state.nombreEquipo}</title>
<style>
  @page{ margin:12mm 14mm; }
  *{ box-sizing:border-box; }
  body{
    font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif; color:#1c1f24;
    max-width:780px; margin:0 auto; padding:0; font-size:12.5px; line-height:1.4;
  }
  .band{ background:#12151a; color:#fff; padding:18px 32px; border-radius:0 0 14px 14px; margin-bottom:0; text-align:center; }
  .band .eyebrow{ font-size:10px; letter-spacing:3px; color:#d9b23c; text-transform:uppercase; font-weight:700; margin-bottom:5px; }
  .band h1{ font-size:24px; margin:0 0 3px; font-weight:800; letter-spacing:-.5px; }
  .band .sub{ font-size:11px; color:#a7adb6; }
  .valoracion-strip{
    background:#d9b23c; color:#12151a; text-align:center; padding:8px 12px;
    font-weight:800; font-size:12px; letter-spacing:.5px; text-transform:uppercase;
  }
  .content{ padding:16px 30px 4px; }
  .stats-grid{ display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin-bottom:4px; }
  .stat-card{ background:#f4f5f7; border-radius:10px; padding:10px 8px; text-align:center; }
  .stat-num{ font-size:19px; font-weight:800; color:#12151a; }
  .stat-label{ font-size:8.5px; letter-spacing:.5px; text-transform:uppercase; color:#777; margin-top:2px; }
  h2{
    font-size:11.5px; letter-spacing:1.5px; text-transform:uppercase; font-weight:800;
    color:#12151a; margin:16px 0 8px; padding-left:10px; border-left:4px solid #d9b23c;
  }
  table{ width:100%; border-collapse:collapse; font-size:12px; margin-bottom:2px; }
  thead td{ display:none; }
  tbody tr:nth-child(odd){ background:#f7f7f8; }
  td{ padding:6px 10px; }
  td.val{ text-align:right; font-weight:700; }
  td.positivo{ color:#1a7a3c; }
  td.negativo{ color:#c0392b; }
  .barcell{ width:110px; }
  .barbg{ background:#e6e6e6; border-radius:4px; height:7px; overflow:hidden; }
  .barfill{ background:#d9b23c; height:100%; }
  .destacados{ display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:4px; }
  .destacado-card{ background:#f4f5f7; border-radius:10px; padding:10px 14px; }
  .destacado-card .tag{ font-size:8.5px; letter-spacing:1px; text-transform:uppercase; color:#999; font-weight:700; display:block; margin-bottom:3px; }
  .destacado-card .cont{ font-size:12px; font-weight:600; }
  .destacado-card.full{ grid-column:1/3; }
  .footer{ margin-top:14px; padding:10px 30px; text-align:center; font-size:9.5px; color:#999; border-top:1px solid #eee; }
  @media print{ .band{ border-radius:0; } }
</style></head><body>
  <div class="band">
    <div class="eyebrow">Goal2Goat &middot; Liga Manager</div>
    <h1>${state.nombreEquipo.toUpperCase()}</h1>
    <div class="sub">Informe oficial de fin de temporada &middot; ${fecha}</div>
  </div>
  <div class="valoracion-strip">${t(claveValoracion)}</div>

  <div class="content">
    <h2>Clasificacion final</h2>
    <div class="stats-grid">
      ${statCard(miPos+'&ordm;','Posicion')}
      ${statCard(misDatos?misDatos.pts:0,'Puntos')}
      ${statCard(`${misDatos?misDatos.pg:0}-${misDatos?misDatos.pe:0}-${misDatos?misDatos.pp:0}`,'G-E-P')}
      ${statCard((dg>0?'+':'')+dg,'Dif. de goles')}
    </div>

    <h2>Resultados destacados</h2>
    <div class="destacados">
      <div class="destacado-card"><span class="tag">Mayor victoria</span><div class="cont">${mejorVictoria ? `${state.nombreEquipo} ${mejorVictoria.misGoles}-${mejorVictoria.susGoles} ${mejorVictoria.rivalNombre}<br><small style="color:#999">Jornada ${mejorVictoria.jornada}</small>` : 'Sin victorias registradas'}</div></div>
      <div class="destacado-card"><span class="tag">Peor derrota</span><div class="cont">${peorDerrota ? `${state.nombreEquipo} ${peorDerrota.misGoles}-${peorDerrota.susGoles} ${peorDerrota.rivalNombre}<br><small style="color:#999">Jornada ${peorDerrota.jornada}</small>` : 'Sin derrotas registradas'}</div></div>
      <div class="destacado-card full"><span class="tag">Maximo goleador</span><div class="cont">${(maxGoleador && maxGoleador.golesTemporada>0) ? `${maxGoleador.name} &mdash; ${maxGoleador.golesTemporada} goles` : 'Sin goles registrados esta temporada'}</div></div>
    </div>

    <h2>Balance financiero</h2>
    <table><tbody>
      ${premioTemporada ? filaTabla('Premio de temporada', '+'+formatoDinero(premioTemporada.total), 'positivo') : ''}
      ${filaTabla('Ingresos totales', '+'+formatoDinero(ingresosTotales), 'positivo')}
      ${filaTabla('Gastos totales', '-'+formatoDinero(gastosTotales), 'negativo')}
      ${filaTabla('Balance neto', (balanceNeto>=0?'+':'')+formatoDinero(balanceNeto), balanceNeto>=0?'positivo':'negativo')}
      ${filaTabla('Capital final', formatoDinero(capitalFinal))}
    </tbody></table>

    <h2>Cuerpo tecnico &mdash; ${estrellasTotal}/${estrellasMax} mejoras conseguidas</h2>
    <table><tbody>
      ${dptosFilas}
    </tbody></table>
  </div>

  <div class="footer">Generado automaticamente por Goal2Goat &middot; goal2goat.com</div>
</body></html>`;
  }
  function imprimirLMResumenTemporada(datos){
    const ventana=window.open('', '_blank');
    if(!ventana){ alert(t('lm.popup_bloqueado_pdf')); return; }
    ventana.document.write(buildLMResumenPrintHTML(datos));
    ventana.document.close();
    ventana.focus();
    setTimeout(()=>{ ventana.print(); }, 350);
  }
    function calcularPremioFinTemporada(miPos){
    const basePorPosicion = miPos===1?150000 : miPos<=4?90000 : miPos===5?65000 : miPos===6?50000 : miPos<=10?30000 : 15000;
    // Complejidad de lo logrado: suma de los "pts" (1 básico, 2
    // intermedio, 3 difícil, 5 mítico) de todos los logros de Liga
    // Manager ya desbloqueados. window._lmAchievementsCache solo
    // refleja con certeza lo desbloqueado EN ESTA SESIÓN si nunca se
    // ha abierto la pestaña de logros del perfil — una aproximación
    // razonable, no una cuenta perfecta desde Firestore.
    const cache=window._lmAchievementsCache;
    const puntosLogros = cache ? LM_ACHIEVEMENT_DEFS.reduce((s,d)=> s+(cache.has(d.id)?d.pts:0), 0) : 0;
    const bonusComplejidad = puntosLogros*800;
    return {basePorPosicion, bonusComplejidad, total: basePorPosicion+bonusComplejidad};
  }
  function mostrarResumenTemporada(){
    const overlay=document.createElement('div');
    overlay.id='lmResumenTemporadaOverlay';
    const clasif=calcularClasificacion();
    const miPos=clasif.findIndex(t2=>t2.id==='lm_0')+1;
    const misDatos=clasif.find(t2=>t2.id==='lm_0');
    const zona=zonaClasificacion(miPos);
    let claveValoracion='lm.resumen_temporada_valoracion_media';
    if(miPos===1) claveValoracion='lm.resumen_temporada_valoracion_campeon';
    else if(zona==='champions') claveValoracion='lm.resumen_temporada_valoracion_champions';
    else if(zona==='europa') claveValoracion='lm.resumen_temporada_valoracion_europa';
    else if(zona==='conference') claveValoracion='lm.resumen_temporada_valoracion_conference';
    else if(zona==='descenso') claveValoracion='lm.resumen_temporada_valoracion_descenso';
    // Veredicto de la temporada, calculado aquí (antes que las cifras
    // financieras de más abajo) porque el premio, si toca, debe
    // reflejarse en el capital final e ingresos totales que se
    // muestran a continuación. El mismo cálculo (con el capital DE
    // ANTES del premio) es el que decide si la partida continúa o
    // termina — nunca se vuelve a comprobar después de pagar el
    // premio, para que un premio grande no pueda "salvar" a última
    // hora una temporada que ya se había perdido.
    const enDescenso = zona==='descenso';
    const enNumerosRojos = (state.capital||0)<0;
    const finDeLaPartida = enDescenso || enNumerosRojos;
    let premioTemporada=null;
    if(!finDeLaPartida){
      premioTemporada=calcularPremioFinTemporada(miPos);
      state.capital=(state.capital||0)+premioTemporada.total;
      registrarMovimientoFinanciero('Premio de fin de temporada', premioTemporada.total, state.jornadaActual);
      guardarEstado();
    }
    const {mejorVictoria, peorDerrota}=calcularResultadosDestacadosTemporada();
    const golesFilaHTML = (r, claveVacio)=> !r ? `<div class="lm-resumen-temp-fila-vacia">${t(claveVacio)}</div>`
      : `<div class="lm-resumen-temp-fila"><span>${state.nombreEquipo} ${r.misGoles} - ${r.susGoles} ${r.rivalNombre}</span><span class="lm-resumen-temp-jornada">${t('lm.jornada')} ${r.jornada}</span></div>`;
    const maxGoleador = (state.plantilla||[]).reduce((max,p)=>(p.golesTemporada||0)>(max?max.golesTemporada||0:0) ? p : max, null);
    const goleadorHTML = (maxGoleador && maxGoleador.golesTemporada>0)
      ? `<div class="lm-resumen-temp-fila"><span><strong>${maxGoleador.name}</strong></span><span class="lm-resumen-temp-jornada">${tp('lm.resumen_temporada_goleador_goles',{n:maxGoleador.golesTemporada})}</span></div>`
      : `<div class="lm-resumen-temp-fila-vacia">${t('lm.resumen_temporada_sin_goleador')}</div>`;
    const historialFin=(state.finanzasHistorial||[]);
    const ingresosTotales=historialFin.filter(h=>h.monto>=0).reduce((s,h)=>s+h.monto,0);
    const gastosTotales=historialFin.filter(h=>h.monto<0).reduce((s,h)=>s+Math.abs(h.monto),0);
    const balanceNeto=ingresosTotales-gastosTotales;
    const {total:estrellasTotal, max:estrellasMax}=calcularEstrellasClub();
    const dptos=[
      ['lm.resumen_temporada_dpto_medico', state.medicoNiveles],
      ['lm.resumen_temporada_dpto_mantenimiento', state.mantenimientoNiveles],
      ['lm.resumen_temporada_dpto_dg', state.directorGeneralNiveles],
      ['lm.resumen_temporada_dpto_dd', state.directorDeportivoNiveles],
      ['lm.resumen_temporada_dpto_pf', state.preparadorFisicoNiveles],
    ];
    // Versión con los datos ya resueltos (nombre traducido, nivel
    // conseguido, nivel máximo posible) — reutilizada tanto para
    // compartir como para el informe imprimible, en vez de repetir
    // este cálculo en cada sitio.
    const dptosResueltos = dptos.map(([clave, niveles])=>({
      nombre: t(clave),
      n: nivelTotalDe(niveles),
      nMax: Object.keys(niveles||{}).length*NIVEL_MAXIMO_EQUIPO,
    }));
    const dptosHTML = dptos.map(([clave, niveles])=>{
      const n=nivelTotalDe(niveles);
      const nMax=Object.keys(niveles||{}).length*NIVEL_MAXIMO_EQUIPO;
      return `<div class="lm-resumen-temp-fila"><span>${t(clave)}</span><span class="lm-resumen-temp-jornada">${estrellasNivel(Math.round((n/Math.max(1,nMax))*NIVEL_MAXIMO_EQUIPO))}</span></div>`;
    }).join('');
    let claveVeredicto=null;
    if(enDescenso && enNumerosRojos) claveVeredicto='lm.resumen_temporada_fin_ambos';
    else if(enDescenso) claveVeredicto='lm.resumen_temporada_fin_descenso';
    else if(enNumerosRojos) claveVeredicto='lm.resumen_temporada_fin_numeros_rojos';
    const veredictoHTML = finDeLaPartida
      ? `<div class="lm-resumen-temp-veredicto lm-resumen-temp-veredicto-negativo"><i class="ph ph-bold ph-skull"></i>${t(claveVeredicto)}</div>`
      : `<div class="lm-resumen-temp-veredicto lm-resumen-temp-veredicto-positivo"><i class="ph ph-bold ph-check-circle"></i>${t('lm.resumen_temporada_puede_continuar')}</div>`;
    overlay.innerHTML=`
      <div class="lm-dilemma-card lm-clasif-popup-card lm-resumen-temp-card" style="max-width:520px;position:relative">
        <button id="lmResumenTemporadaImprimirBtn" title="${t('lm.imprimir_resumen')}" style="display:flex;position:absolute;top:14px;right:56px;z-index:6;width:34px;height:34px;border-radius:50%;background:rgba(0,0,0,.45);border:1px solid rgba(255,255,255,.5);color:#fff;align-items:center;justify-content:center;cursor:pointer;padding:0">
          <i class="ph ph-bold ph-printer" style="font-size:17px"></i>
        </button>
        <button id="lmResumenTemporadaCompartirBtn" title="${t('lm.compartir_resumen')}" style="display:flex;position:absolute;top:14px;right:14px;z-index:6;width:34px;height:34px;border-radius:50%;background:rgba(0,0,0,.45);border:1px solid rgba(255,255,255,.5);color:#fff;align-items:center;justify-content:center;cursor:pointer;padding:0">
          <i class="ph ph-bold ph-share-network" style="font-size:17px"></i>
        </button>
        <div class="lm-dilemma-title" style="justify-content:center;text-align:center"><i class="ph ph-bold ph-trophy"></i>${t('lm.resumen_temporada_titulo')}</div>
        <div class="lm-clasif-scroll-area">
          <div class="lm-resumen-temp-header">
            ${crestHTML(state.escudo, 56)}
            <div>
              <div class="lm-resumen-temp-club">${state.nombreEquipo.toUpperCase()}</div>
              <div class="lm-resumen-temp-valoracion lm-zona-${zona}">${t(claveValoracion)}</div>
            </div>
          </div>
          <div class="lm-resumen-temp-stats-grid">
            <div class="lm-resumen-temp-stat"><span class="lm-resumen-temp-stat-num">${miPos}º</span><span class="lm-resumen-temp-stat-label">${t('lm.resumen_temporada_posicion')}</span></div>
            <div class="lm-resumen-temp-stat"><span class="lm-resumen-temp-stat-num">${misDatos?misDatos.pts:0}</span><span class="lm-resumen-temp-stat-label">${t('lm.tabla_pts')}</span></div>
            <div class="lm-resumen-temp-stat"><span class="lm-resumen-temp-stat-num">${misDatos?misDatos.pg:0}-${misDatos?misDatos.pe:0}-${misDatos?misDatos.pp:0}</span><span class="lm-resumen-temp-stat-label">${t('lm.tabla_g')}-${t('lm.tabla_e')}-${t('lm.tabla_p')}</span></div>
            <div class="lm-resumen-temp-stat"><span class="lm-resumen-temp-stat-num">${misDatos?(misDatos.gf-misDatos.gc>0?'+':'')+(misDatos.gf-misDatos.gc):0}</span><span class="lm-resumen-temp-stat-label">${t('lm.resumen_temporada_dg')}</span></div>
          </div>
          <div class="lm-resumen-temp-subtitulo">${t('lm.resumen_temporada_resultados_titulo')}</div>
          ${golesFilaHTML(mejorVictoria,'lm.resumen_temporada_sin_victorias')}
          ${golesFilaHTML(peorDerrota,'lm.resumen_temporada_sin_derrotas')}
          <div class="lm-resumen-temp-subtitulo">${t('lm.resumen_temporada_goleador_titulo')}</div>
          ${goleadorHTML}
          <div class="lm-resumen-temp-subtitulo">${t('lm.resumen_temporada_financiero_titulo')}</div>
          ${premioTemporada ? `<div class="lm-resumen-temp-fila"><span><i class="ph ph-bold ph-medal"></i> ${t('lm.resumen_temporada_premio')}</span><span class="lm-resumen-temp-jornada lm-resumen-temp-positivo">+${formatoDinero(premioTemporada.total)}</span></div>` : ''}
          <div class="lm-resumen-temp-fila"><span>${t('lm.resumen_temporada_capital_final')}</span><span class="lm-resumen-temp-jornada">${formatoDinero(state.capital)}</span></div>
          <div class="lm-resumen-temp-fila"><span>${t('lm.resumen_temporada_ingresos')}</span><span class="lm-resumen-temp-jornada lm-resumen-temp-positivo">+${formatoDinero(ingresosTotales)}</span></div>
          <div class="lm-resumen-temp-fila"><span>${t('lm.resumen_temporada_gastos')}</span><span class="lm-resumen-temp-jornada lm-resumen-temp-negativo">-${formatoDinero(gastosTotales)}</span></div>
          <div class="lm-resumen-temp-fila"><span>${t('lm.resumen_temporada_balance_neto')}</span><span class="lm-resumen-temp-jornada ${balanceNeto>=0?'lm-resumen-temp-positivo':'lm-resumen-temp-negativo'}">${balanceNeto>=0?'+':''}${formatoDinero(balanceNeto)}</span></div>
          <div class="lm-resumen-temp-subtitulo">${t('lm.resumen_temporada_cuerpo_tecnico_titulo')}</div>
          <div class="lm-resumen-temp-fila"><span>${t('lm.resumen_temporada_estrellas_totales')}</span><span class="lm-resumen-temp-jornada">${estrellasTotal}/${estrellasMax}</span></div>
          ${dptosHTML}
          ${veredictoHTML}
        </div>
        <div class="lm-popup-actions"><button id="lmResumenTemporadaCerrarBtn" class="mode-card-btn mode-card-btn-gold">${finDeLaPartida?t('lm.finalizar'):t('lm.continuar')}</button></div>
      </div>`;
    document.getElementById('ligaManagerScreen').appendChild(overlay);
    // Datos completos, compartidos entre el botón de compartir y el
    // de imprimir/PDF — así ambos muestran exactamente la misma
    // información, solo en formato distinto.
    const datosInforme = {miPos, misDatos, zona, claveValoracion, mejorVictoria, peorDerrota, maxGoleador, premioTemporada, estrellasTotal, estrellasMax, dptos:dptosResueltos, ingresosTotales, gastosTotales, balanceNeto, capitalFinal: state.capital, claveVeredicto, finDeLaPartida};
    const compartirBtn=overlay.querySelector('#lmResumenTemporadaCompartirBtn');
    if(compartirBtn) compartirBtn.addEventListener('click', (e)=>{
      e.stopPropagation();
      if(typeof window.playSound==='function') window.playSound('select');
      shareLMResumenTemporada(datosInforme);
    });
    const imprimirBtn=overlay.querySelector('#lmResumenTemporadaImprimirBtn');
    if(imprimirBtn) imprimirBtn.addEventListener('click', (e)=>{
      e.stopPropagation();
      if(typeof window.playSound==='function') window.playSound('select');
      imprimirLMResumenTemporada(datosInforme);
    });
    // A propósito SIN habilitarCierreOverlay: este popup decide si la
    // partida termina o continúa a una nueva temporada — un clic fuera
    // accidental no puede saltarse esa decisión sin pasar por el botón
    // explícito, a diferencia del resto de popups informativos del
    // juego, que sí se pueden cerrar tocando fuera.
    overlay.querySelector('#lmResumenTemporadaCerrarBtn').addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      overlay.remove();
      if(finDeLaPartida){
        // Fin de la partida: se borra el progreso y se vuelve al menú
        // de selección de modo — mismo camino de salida que ya usa
        // "abandonar liga", reutilizado aquí porque el efecto es
        // idéntico (la partida ya no puede continuar).
        borrarEstado();
        state=nuevoEstadoSinEmpezar();
        setupStep=1;
        setupData={liga:'es', moneda:null, nombre:'', escudo:null, modo:null, equipoElegidoId:null};
        document.body.classList.remove('liga-manager-screen');
        document.body.classList.add('menu-screen');
        return;
      }
      mostrarFelicitacionNuevaTemporada();
    });
  }
  // Popup de felicitación antes de arrancar la nueva temporada con
  // todo el progreso conservado — mismo estilo que el resto de la
  // interfaz, a modo de reconocimiento por una buena temporada antes
  // de continuar la aventura.
  function mostrarFelicitacionNuevaTemporada(){
    const overlay=document.createElement('div');
    overlay.id='lmFelicitacionTemporadaOverlay';
    overlay.innerHTML=`
      <div class="lm-dilemma-card" style="max-width:420px">
        <div class="lm-dilemma-title" style="justify-content:center;text-align:center"><i class="ph ph-bold ph-confetti"></i>${t('lm.resumen_temporada_felicidades_titulo')}</div>
        <div class="lm-dilemma-text" style="margin:10px 0 16px;text-align:center">${t('lm.resumen_temporada_felicidades_texto')}</div>
        <div class="lm-popup-actions"><button id="lmFelicitacionEmpezarBtn" class="mode-card-btn mode-card-btn-gold">${t('lm.resumen_temporada_empezar_temporada_btn')}</button></div>
      </div>`;
    document.getElementById('ligaManagerScreen').appendChild(overlay);
    overlay.querySelector('#lmFelicitacionEmpezarBtn').addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      overlay.remove();
      iniciarNuevaTemporadaConProgreso();
    });
  }

  // Suma todas las estrellas de nivel conseguidas en los proyectos de
  // los 5 departamentos del cuerpo técnico (máximo 3★ cada track) —
  // determina el nivel visual del estadio: 5 niveles de imagen, y solo
  // tenerlas TODAS al máximo da el nivel 5.
  function calcularEstrellasClub(){
    const grupos=[
      state.medicoNiveles, state.mantenimientoNiveles, state.directorGeneralNiveles,
      state.directorDeportivoNiveles, state.preparadorFisicoNiveles
    ];
    let total=0, max=0;
    grupos.forEach(g=>{
      if(!g) return;
      Object.values(g).forEach(v=>{ total+=(v||0); max+=NIVEL_MAXIMO_EQUIPO; });
    });
    const ratio = max>0 ? total/max : 0;
    let nivelEstadio;
    if(ratio>=1) nivelEstadio=5;
    else if(ratio>=0.75) nivelEstadio=4;
    else if(ratio>=0.5) nivelEstadio=3;
    else if(ratio>=0.25) nivelEstadio=2;
    else nivelEstadio=1;
    return {total, max, nivelEstadio};
  }
  function abrirInfoClub(){
    const overlay=document.createElement('div');
    overlay.id='lmInfoClubOverlay';
    const {total, max, nivelEstadio}=calcularEstrellasClub();
    const estadio=state.estadio||{campo:100,satisfaccion:0,aforoTotal:0,ultimaAsistencia:null};
    const monedaInfo=MONEDAS[state.moneda]||MONEDAS.EUR;
    overlay.innerHTML=`
      <div class="lm-dilemma-card lm-infoclub-card">
        ${xCerrarHTML()}
        <div class="lm-dilemma-title"><i class="ph ph-bold ph-magnifying-glass"></i> INFORMACIÓN DEL CLUB</div>
        <div class="lm-infoclub-estadio">
          <img src="assets/estadio/estadio_nivel${nivelEstadio}.png" alt="Estadio nivel ${nivelEstadio}">
          <div class="lm-infoclub-estadio-nivel"><i class="ph ph-bold ph-star"></i> ${t('lm.nivel_estadio')} ${nivelEstadio}/5</div>
          <div class="lm-infoclub-estrellas-bar"><div class="lm-infoclub-estrellas-fill" style="width:${Math.min(100,(total/max)*100)}%"></div></div>
          <div class="lm-infoclub-estrellas-txt">${total}/${max} estrellas de proyectos conseguidas</div>
        </div>
        <div class="lm-infoclub-stats-grid">
          <div class="lm-infoclub-stat">
            <div class="lm-infoclub-stat-top"><i class="ph ph-bold ph-coins"></i><div class="lm-infoclub-stat-val">${formatoDinero(state.capital||0)}</div></div><div class="lm-infoclub-stat-label">${t('lm.capital')}</div>
          </div>
          <div class="lm-infoclub-stat">
            <div class="lm-infoclub-stat-top"><i class="ph ph-bold ph-users"></i><div class="lm-infoclub-stat-val">${(estadio.aforoTotal||0).toLocaleString('es-ES')}</div></div><div class="lm-infoclub-stat-label">${t('lm.aforo_maximo')}</div>
          </div>
          <div class="lm-infoclub-stat">
            <div class="lm-infoclub-stat-top"><i class="ph ph-bold ph-ticket"></i><div class="lm-infoclub-stat-val">${((estadio.ultimaAsistencia&&estadio.ultimaAsistencia.asistentes)||0).toLocaleString('es-ES')}</div></div><div class="lm-infoclub-stat-label">${t('lm.ultima_asistencia')}</div>
          </div>
          <div class="lm-infoclub-stat">
            <div class="lm-infoclub-stat-top"><i class="ph ph-bold ph-money"></i><div class="lm-infoclub-stat-val">${monedaInfo.symbol}${state.precioEntrada||0}</div></div><div class="lm-infoclub-stat-label">${t('lm.precio_entrada')}</div>
          </div>
          <div class="lm-infoclub-stat">
            <div class="lm-infoclub-stat-top"><i class="ph ph-bold ph-smiley"></i><div class="lm-infoclub-stat-val">${estadio.satisfaccion||0}</div></div><div class="lm-infoclub-stat-label">${t('lm.satisfaccion_afición')}</div>
          </div>
          <div class="lm-infoclub-stat">
            <div class="lm-infoclub-stat-top"><i class="ph ph-bold ph-heartbeat"></i><div class="lm-infoclub-stat-val">${state.moral||0}</div></div><div class="lm-infoclub-stat-label">${t('lm.moral_equipo')}</div>
          </div>
          <div class="lm-infoclub-stat">
            <div class="lm-infoclub-stat-top"><i class="ph ph-bold ph-grass"></i><div class="lm-infoclub-stat-val">${estadio.campo||0}%</div></div><div class="lm-infoclub-stat-label">${t('lm.estado_cesped')}</div>
          </div>
          <div class="lm-infoclub-stat">
            <div class="lm-infoclub-stat-top"><i class="ph ph-bold ph-users-three"></i><div class="lm-infoclub-stat-val">${(state.plantilla||[]).length}</div></div><div class="lm-infoclub-stat-label">${t('lm.plantilla')}</div>
          </div>
        </div>
        <div class="lm-popup-actions"><button id="lmInfoClubCerrar" class="mode-card-btn mode-card-btn-gold">${t('lm.cerrar')}</button></div>
      </div>`;
    document.getElementById('ligaManagerScreen').appendChild(overlay);
    habilitarCierreOverlay(overlay, ()=>overlay.remove());
    overlay.querySelector('[data-cerrar-x]').addEventListener('click', ()=>overlay.remove());
    overlay.querySelector('#lmInfoClubCerrar').addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      overlay.remove();
    });
  }

  function abrirOnceRival(rival){
    const overlay=document.createElement('div');
    overlay.id='lmOnceRivalOverlay';
    const {titulares, banquillo}=generarOnceRivalFicticio(rival);
    const filaJugadorRival=j=>`<tr>
      <td class="lm-td-numero">${j.numero||'-'}</td>
      <td>${j.name}</td>
      <td><strong>${j.position}</strong></td>
      <td>${j.attack}</td><td>${j.defense}</td><td>${j.pace}</td><td>${j.passing}</td><td>${j.technique}</td>
      <td><strong>${Math.round((j.attack+j.defense+j.pace+j.passing+j.technique)/5)}</strong></td>
    </tr>`;
    overlay.innerHTML=`
      <div class="lm-dilemma-card" style="width:560px;max-width:94vw;text-align:left">
        ${xCerrarHTML()}
        <div class="lm-dilemma-title">${rivalCrestHTML(26, rival.crestImg)}<span style="margin-left:6px">${rival.name.toUpperCase()}</span></div>
        <div class="bench-title" style="margin-top:6px"><span><i class="ph ph-bold ph-t-shirt" style="color:var(--gold);margin-right:6px"></i>${t("lm.once_titular")}</span></div>
        <div>
          <table class="roster-table">
            <thead><tr><th>#</th><th>${t('lm.tabla_jugador')}</th><th>Pos</th><th>${t('lm.stat_ata')}</th><th>${t('lm.stat_def')}</th><th>${t('lm.stat_rit')}</th><th>${t('lm.stat_pas')}</th><th>${t('lm.stat_tec')}</th><th>${t('lm.tabla_punt')}</th></tr></thead>
            <tbody>${titulares.map(filaJugadorRival).join('')}</tbody>
          </table>
        </div>
        <div class="bench-title" style="margin-top:14px"><span><i class="ph ph-bold ph-chair" style="color:var(--gold);margin-right:6px"></i>${t("lm.banquillo")}</span></div>
        <div>
          <table class="roster-table">
            <thead><tr><th>#</th><th>${t('lm.tabla_jugador')}</th><th>Pos</th><th>${t('lm.stat_ata')}</th><th>${t('lm.stat_def')}</th><th>${t('lm.stat_rit')}</th><th>${t('lm.stat_pas')}</th><th>${t('lm.stat_tec')}</th><th>${t('lm.tabla_punt')}</th></tr></thead>
            <tbody>${banquillo.map(filaJugadorRival).join('')}</tbody>
          </table>
        </div>
        <div class="lm-popup-actions lm-popup-actions-compact">
          <button id="lmOnceRivalCerrar" class="mode-card-btn mode-card-btn-gold">${t('lm.cerrar')}</button>
        </div>
      </div>`;
    document.getElementById('ligaManagerScreen').appendChild(overlay);
    habilitarCierreOverlay(overlay, ()=>overlay.remove());
    const xBtn=overlay.querySelector('[data-cerrar-x]');
    if(xBtn) xBtn.addEventListener('click', ()=>overlay.remove());
    document.getElementById('lmOnceRivalCerrar').addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      overlay.remove();
    });
  }
  // Aviso de plantilla técnica incompleta — a diferencia del aviso
  // genérico de un solo botón, este tiene dos opciones reales:
  // decidirlo más tarde (sigue jugando sin más) o ir directo a
  // contratar. Mismo patrón visual que el aviso de quiniela pendiente,
  // para que ambos popups mantengan homogeneidad entre sí.
  function mostrarAvisoPlantillaTecnicaIncompleta(continuarCallback){
    const overlay=document.createElement('div');
    overlay.id='lmAvisoPlantillaTecnicaOverlay';
    overlay.innerHTML=`
      <div class="lm-dilemma-card" style="max-width:400px">
        <div class="lm-dilemma-title"><i class="ph ph-bold ph-warning-circle"></i>${t('lm.plantilla_tecnica_incompleta_titulo')}</div>
        <div class="lm-dilemma-text" style="margin:10px 0 16px">${t('lm.plantilla_tecnica_incompleta_msg')}</div>
        <div class="lm-popup-actions lm-popup-actions-compact">
          <button id="lmAvisoPlantillaTecnicaMasTarde" class="mode-card-btn mode-card-btn-secondary">${t('lm.decidir_mas_tarde_btn')}</button>
          <button id="lmAvisoPlantillaTecnicaContratar" class="mode-card-btn mode-card-btn-gold">${t('lm.contratar_ahora_btn')}</button>
        </div>
      </div>`;
    document.getElementById('ligaManagerScreen').appendChild(overlay);
    const cerrar=()=>overlay.remove();
    habilitarCierreOverlay(overlay, cerrar);
    document.getElementById('lmAvisoPlantillaTecnicaContratar').addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      cerrar();
      abrirTrabajadores();
    });
    document.getElementById('lmAvisoPlantillaTecnicaMasTarde').addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      cerrar();
      // Sigue encadenando al siguiente aviso pendiente (quiniela,
      // entrenamiento sin plan...) en vez de cortar aquí el flujo —
      // antes había que pulsar SEGUIR una vez por cada aviso
      // distinto, en vez de verlos todos seguidos en el mismo clic.
      if(typeof continuarCallback==='function') continuarCallback();
    });
  }
  // Aviso de entrenamiento sin plan asignado — mismo patrón visual que
  // los otros dos popups (plantilla técnica incompleta y quiniela
  // pendiente): decidirlo más tarde (sigue la semana sin más) o ir
  // directo a planificar el entrenamiento.
  function mostrarAvisoEntrenamientoSinPlan(continuarCallback){
    const overlay=document.createElement('div');
    overlay.id='lmAvisoEntrenamientoSinPlanOverlay';
    overlay.innerHTML=`
      <div class="lm-dilemma-card" style="max-width:400px">
        <div class="lm-dilemma-title"><i class="ph ph-bold ph-barbell"></i>${t('lm.plan_entrenamiento_titulo')}</div>
        <div class="lm-dilemma-text" style="margin:10px 0 16px">${t('lm.confirmar_seguir_sin_pf')}</div>
        <div class="lm-popup-actions lm-popup-actions-compact">
          <button id="lmAvisoEntrenamientoMasTarde" class="mode-card-btn mode-card-btn-secondary">${t('lm.decidir_mas_tarde_btn')}</button>
          <button id="lmAvisoEntrenamientoPlanificar" class="mode-card-btn mode-card-btn-gold">${t('lm.planificar_entrenamiento_btn')}</button>
        </div>
      </div>`;
    document.getElementById('ligaManagerScreen').appendChild(overlay);
    const cerrar=()=>overlay.remove();
    habilitarCierreOverlay(overlay, cerrar);
    document.getElementById('lmAvisoEntrenamientoPlanificar').addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      cerrar();
      abrirPreparadorFisico();
    });
    document.getElementById('lmAvisoEntrenamientoMasTarde').addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      cerrar();
      continuarCallback();
    });
  }

  // Se muestra la primera vez que se intenta despedir a un guardia en
  // toda la partida — a partir de ahí, ya no se vuelve a preguntar
  // (state.avisoFiniquitoGuardiaMostrado queda marcado para siempre).
  function mostrarAvisoDespedirGuardia(confirmarCallback){
    const overlay=document.createElement('div');
    overlay.id='lmAvisoFiniquitoGuardiaOverlay';
    // Antes usaba la clase genérica compartida (z-index:200), que se
    // quedaba por detrás de Seguridad del Estadio (z-index:220) —
    // ahora usa una regla propia por su propio id, con z-index de
    // máxima prioridad, por encima de cualquier otra interfaz, sea
    // cual sea desde la que se abra.
    overlay.innerHTML=`
      <div class="lm-dilemma-card" style="max-width:380px">
        <div class="lm-dilemma-title"><i class="ph ph-bold ph-user-minus"></i>${t('lm.despedir_guardia_titulo')}</div>
        <div class="lm-dilemma-text" style="margin:10px 0 16px">${tp('lm.confirmar_despedir_guardia', {n:GUARDIA_FINIQUITO})}</div>
        <div class="lm-popup-actions lm-popup-actions-compact">
          <button id="lmAvisoFiniquitoCancelar" class="mode-card-btn mode-card-btn-secondary">${t('lm.cancelar_btn')}</button>
          <button id="lmAvisoFiniquitoConfirmar" class="mode-card-btn mode-card-btn-gold">${t('lm.aceptar_btn')}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    const cerrar=()=>overlay.remove();
    habilitarCierreOverlay(overlay, cerrar);
    document.getElementById('lmAvisoFiniquitoCancelar').addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      cerrar();
    });
    document.getElementById('lmAvisoFiniquitoConfirmar').addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      state.avisoFiniquitoGuardiaMostrado=true;
      guardarEstado();
      cerrar();
      confirmarCallback();
    });
  }

  function mostrarAvisoJuego(mensaje, titulo){
    const overlay=document.createElement('div');
    overlay.id='lmAvisoOverlay';
    overlay.innerHTML=`
      <div class="lm-dilemma-card" style="max-width:400px">
        <div class="lm-dilemma-title"><i class="ph ph-bold ph-warning-circle"></i>${titulo||'AVISO DEL CLUB'}</div>
        <div class="lm-dilemma-text" style="margin:10px 0 16px">${mensaje}</div>
        <div class="lm-popup-actions lm-popup-actions-compact">
          <button id="lmAvisoCerrar" class="mode-card-btn mode-card-btn-gold">${t('lm.entendido')}</button>
        </div>
      </div>`;
    document.getElementById('ligaManagerScreen').appendChild(overlay);
    const cerrar=()=>overlay.remove();
    habilitarCierreOverlay(overlay, cerrar);
    document.getElementById('lmAvisoCerrar').addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      cerrar();
    });
  }
  // Aviso de quiniela pendiente justo antes de jugar el partido — la
  // quiniela se entrega para usarse en ESA jornada, así que si el
  // jugador intenta jugar sin haberla rellenado, se le da la opción de
  // rellenarla ahí mismo o seguir jugando (perdiéndola).
  function mostrarAvisoQuinielaPendienteAntesDeJugar(continuarCallback){
    const overlay=document.createElement('div');
    overlay.id='lmAvisoQuinielaOverlay';
    overlay.innerHTML=`
      <div class="lm-dilemma-card" style="max-width:400px">
        <div class="lm-dilemma-title"><i class="ph ph-bold ph-ticket"></i>${t('lm.quiniela_pendiente_titulo')}</div>
        <div class="lm-dilemma-text" style="margin:10px 0 16px">${t('lm.quiniela_pendiente_aviso')}</div>
        <div class="lm-popup-actions lm-popup-actions-compact">
          <button id="lmAvisoQuinielaSeguir" class="mode-card-btn mode-card-btn-secondary">${t('lm.seguir_sin_quiniela_btn')}</button>
          <button id="lmAvisoQuinielaRellenar" class="mode-card-btn mode-card-btn-gold">${t('lm.rellenar_quiniela_btn')}</button>
        </div>
      </div>`;
    document.getElementById('ligaManagerScreen').appendChild(overlay);
    const cerrar=()=>overlay.remove();
    habilitarCierreOverlay(overlay, cerrar);
    document.getElementById('lmAvisoQuinielaRellenar').addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      cerrar();
      abrirBoletoQuiniela();
    });
    document.getElementById('lmAvisoQuinielaSeguir').addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      // Se pierde de verdad: se borra del correo interno y del estado,
      // no tiene sentido conservar una quiniela para una jornada que
      // ya se ha jugado.
      state.quinielaBoleto=null;
      guardarEstado();
      cerrar();
      continuarCallback();
    });
  }
  // Si has despedido a quien ocupaba un puesto (o todavía no lo has
  // cubierto), en vez de un aviso genérico abrimos directamente
  // TRABAJADORES ya filtrado a ese puesto concreto.
  function bloqueadoPorVacante(rol){
    if(!state.trabajadores || !state.trabajadores[rol]){
      if(typeof window.playSound==='function') window.playSound('select');
      abrirTrabajadores(rol);
      return true;
    }
    return false;
  }
  // Foto de un puesto del cuerpo técnico — si está vacante (despedido o
  // todavía sin cubrir), se usa la variante en blanco y negro cuyo
  // nombre de archivo termina en "_escenario" en vez de la foto normal.
  // Foto de un puesto del cuerpo técnico — nombres de archivo reales del
  // proyecto: {carpeta}/{archivo}_hombre.png o _mujer.png según quién lo
  // ocupe, y {archivo}_escenario.png (sin género) en blanco y negro
  // cuando el puesto está vacante (despedido o sin cubrir todavía).
  //
  // Variantes por género: algunos puestos tienen varias fotos distintas
  // para el mismo género (_hombre.png/_hombre2.png/_hombre3.png, igual
  // en mujer) — "variante" (1, 2 o 3) elige cuál, decidida una sola vez
  // al generar al trabajador (ver nombreTrabajadorAleatorio) y guardada
  // con él, así que no cambia de cara en cada render. La variante 1 usa
  // el nombre de archivo de siempre sin número, para no romper partidas
  // guardadas antes de este cambio ni puestos (Director General/
  // Deportivo) que todavía solo tienen una foto por género: si el
  // archivo numerado no existe, el onerror reintenta automáticamente con
  // el archivo base antes de rendirse y mostrar el icono de repuesto.
  function staffFotoHTML(carpeta, archivoBase, alt, iconoFallback, genero, vacante, variante){
    const g = genero==='mujer' ? 'mujer' : 'hombre';
    const sufijoVariante = (!vacante && variante>1) ? variante : '';
    const rutaBase = `assets/equipo_tecnico/${carpeta}/${archivoBase}_${g}.png`;
    const ruta = vacante
      ? `assets/equipo_tecnico/${carpeta}/${archivoBase}_escenario.png`
      : `assets/equipo_tecnico/${carpeta}/${archivoBase}_${g}${sufijoVariante}.png`;
    const estiloGris = vacante ? ' style="filter:grayscale(1)"' : '';
    const onerrorAttr = sufijoVariante
      ? `onerror="if(this.dataset.fbTried){this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex';}else{this.dataset.fbTried='1';this.src='${rutaBase}';}"`
      : `onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex';"`;
    return `<img src="${ruta}" alt="${alt}"${vacante?` title="${t('lm.tt_puesto_vacante')}"`:''} class="lm-staff-photo-img"${estiloGris} ${onerrorAttr}>
      <div class="lm-staff-photo-fallback${vacante?' lm-staff-photo-vacante':''}" style="display:none"><i class="ph ph-bold ${iconoFallback}"></i></div>`;
  }
  // Cuánto se "seca" visualmente el campo — nada sutil a propósito: con
  // el césped perfecto (100) no hay overlay, y va ganando marrón de forma
  // lineal y notoria a medida que baja, hasta quedar claramente reseco
  // cerca de 0. Coexiste con el clima porque es una capa aparte dentro de
  // #lmPitchBox (igual que la capa de lluvia/nieve): el filtro de clima
  // se sigue aplicando sobre #lmPitchBox entero, por encima de esto.
  function campoOpacidadDesgaste(campo){
    const c=Math.max(0,Math.min(100, campo===undefined?100:campo));
    return Math.max(0, (100-c)/100*0.85).toFixed(2);
  }
  function campoBarraHTML(valor, mini){
    const wrap = mini ? 'lm-campo-bar-wrap-mini' : 'lm-campo-bar-wrap';
    return `<div class="${wrap}"><div class="fatigue-bar fatigue-${colorCampo(valor)}" style="width:${Math.max(0,Math.min(100,valor))}%"></div></div>${mini?'':ultimoCambioHTML(state.ultimoCambioCampo)}`;
  }
  // Etiqueta discreta y oscura con el último cambio de una barra (moral,
  // satisfacción, césped...) — mismo tono que la propia barra pero
  // apagado, para verlo de un vistazo sin que grite más que el número
  // principal.
  function ultimoCambioHTML(delta, compacto){
    if(delta===undefined || delta===null || delta===0) return '';
    const positivo=delta>0;
    return `<div class="lm-ultimo-cambio ${positivo?'lm-ultimo-cambio-pos':'lm-ultimo-cambio-neg'}${compacto?' lm-ultimo-cambio-mini':''}">
      <i class="ph ph-bold ${positivo?'ph-trend-up':'ph-trend-down'}"></i>último: ${positivo?'+':''}${delta}
    </div>`;
  }
  // Barra bidireccional — CALCO exacto de la barra de MORAL de Copa
  // Leyendas (.morale-track/.morale-fill), reutilizada tanto para la
  // satisfacción de la afición (-100..100) como para la moral del propio
  // equipo (-50..50). "claseExtra" permite un acento de color distinto
  // para cada una (oro para afición, verde/rojo de siempre para moral),
  // así las tres barras del estadio quedan bien diferenciadas entre sí.
  function bidireccionalBarraHTML(valor, rango, claseExtra, ultimoCambio){
    const pct=Math.min(50, Math.abs(valor)/rango*50);
    const positivo=valor>=0;
    const left = positivo ? '50%' : (50-pct)+'%';
    return `<div class="morale-track">
      <div class="morale-neg-zone"></div>
      <div class="morale-pos-zone"></div>
      <div class="morale-center"></div>
      <div class="morale-fill ${claseExtra||''} ${positivo?'positive':'negative'}" style="width:${pct}%;left:${left}"></div>
      <div class="morale-zero-marker"></div>
    </div>${ultimoCambioHTML(ultimoCambio)}`;
  }
  function satisfaccionBarraHTML(valor){ return bidireccionalBarraHTML(valor, 100, 'lm-sat-fill', state.ultimoCambioSatisfaccion); }
  function moralBarraHTML(valor){ return bidireccionalBarraHTML(valor, 50, '', state.ultimoCambioMoral); }

  function formatoDinero(v){ return Math.round(v||0).toLocaleString('es-ES')+'€'; }
  function registrarMovimientoFinanciero(concepto, monto, jornada){
    state.finanzasHistorial = state.finanzasHistorial||[];
    state.finanzasHistorial.push({concepto, monto:Math.round(monto), jornada, mes:Math.floor((jornada-1)/4)+1});
    if(state.finanzasHistorial.length>250) state.finanzasHistorial=state.finanzasHistorial.slice(-250);
  }
  function nivelTotalDe(niveles){ return Object.values(niveles||{}).reduce((a,b)=>a+b,0); }

  /* ---------- Préstamos bancarios ---------- */
  // Tres paquetes fijos (pequeño/medio/grande) — más plazo = más interés,
  // como en un banco real. El plazo se cuenta en JORNADAS, no en meses,
  // y la cuota se descuenta una fracción igual cada jornada (no de golpe
  // al mes) para que el impacto sea más gradual y predecible.
  const PAQUETES_PRESTAMO=[
    {id:'pequeno', monto:60000,  interes:0.08, plazoJornadas:6},
    {id:'medio',   monto:150000, interes:0.14, plazoJornadas:10},
    {id:'grande',  monto:300000, interes:0.22, plazoJornadas:16},
  ];
  // Solo se ofrecen los paquetes cuyo plazo cabe ENTERO dentro de lo que
  // queda de temporada — así nunca es posible pedir un préstamo tan
  // tarde que la liga termine antes de devolverlo del todo. Por debajo
  // de 3 jornadas restantes no se ofrece ninguno: no tendría sentido un
  // préstamo con 1-2 cuotas que además el propio jugador podría intentar
  // usar para "colar" dinero fácil justo al final.
  function paquetesPrestamoDisponibles(){
    const jornadasRestantes=Math.max(0, 38-(state.jornadaActual-1));
    if(jornadasRestantes<3) return [];
    return PAQUETES_PRESTAMO.filter(p=>p.plazoJornadas<=jornadasRestantes);
  }
  function solicitarPrestamo(paqueteId){
    if(state.prestamoBancario) return false; // solo un préstamo activo a la vez
    const paquete=paquetesPrestamoDisponibles().find(p=>p.id===paqueteId);
    if(!paquete) return false;
    const totalADevolver=Math.round(paquete.monto*(1+paquete.interes));
    const cuotaPorJornada=Math.round(totalADevolver/paquete.plazoJornadas);
    state.prestamoBancario={
      montoOriginal:paquete.monto, interes:paquete.interes,
      plazoJornadas:paquete.plazoJornadas, jornadaInicio:state.jornadaActual,
      cuotaPorJornada, saldoRestante:totalADevolver, cuotasPagadas:0,
    };
    state.capital=Math.round((state.capital||0)+paquete.monto);
    registrarMovimientoFinanciero('Préstamo bancario', paquete.monto, state.jornadaActual);
    if(typeof window.playSound==='function') window.playSound('loan_granted');
    guardarEstado();
    return true;
  }
  // Se llama una vez por jornada jugada (nunca en jornadas de descanso
  // sin partido) — descuenta la cuota fija, y si con la última cuota el
  // saldo queda saldado, cierra el préstamo del todo.
  function procesarCuotaPrestamo(){
    const p=state.prestamoBancario;
    if(!p) return;
    const cuota=Math.min(p.cuotaPorJornada, p.saldoRestante);
    state.capital=Math.round((state.capital||0)-cuota);
    p.saldoRestante=Math.round(p.saldoRestante-cuota);
    p.cuotasPagadas=(p.cuotasPagadas||0)+1;
    registrarMovimientoFinanciero('Cuota de préstamo', -cuota, state.jornadaActual);
    if(typeof window.playSound==='function') window.playSound('loan_payment');
    if(p.saldoRestante<=0) state.prestamoBancario=null;
  }
  // Red de seguridad definitiva contra el "préstamo de última hora": si
  // por cualquier motivo (paquete elegido justo en el límite, redondeos)
  // quedara saldo pendiente al llegar al final de la temporada, se cobra
  // TODO de golpe aquí — nunca es posible terminar la liga con una
  // deuda sin pagar, pase lo que pase.
  function saldarPrestamoFinTemporada(){
    const p=state.prestamoBancario;
    if(!p || p.saldoRestante<=0){ state.prestamoBancario=null; return; }
    state.capital=Math.round((state.capital||0)-p.saldoRestante);
    registrarMovimientoFinanciero('Liquidación de préstamo (fin de temporada)', -p.saldoRestante, 38);
    state.prestamoBancario=null;
  }
  // Contenido del bloque de préstamo bancario, dentro del popup del
  // Director General — o bien la oferta de paquetes disponibles, o el
  // estado del préstamo activo si ya hay uno pedido.
  function renderPrestamoHTML(){
    const p=state.prestamoBancario;
    if(p){
      const jornadasPagadas=p.cuotasPagadas||0;
      const progreso=Math.min(100, Math.round(jornadasPagadas/p.plazoJornadas*100));
      return `
        <div class="lm-estadio-bar-label"><i class="ph ph-bold ph-bank"></i><span>${t('lm.prestamo_activo_titulo')}</span><span class="${p.saldoRestante>0?'lm-capital-neg':''}">${formatoDinero(p.saldoRestante)}</span></div>
        <div class="lm-prestamo-progreso-track"><div class="lm-prestamo-progreso-fill" style="width:${progreso}%"></div></div>
        <div class="lm-aforo-nota">${tp('lm.prestamo_cuota_nota', {cuota:formatoDinero(p.cuotaPorJornada), pagadas:jornadasPagadas, total:p.plazoJornadas})}</div>
      `;
    }
    const paquetes=paquetesPrestamoDisponibles();
    if(!paquetes.length){
      return `
        <div class="lm-estadio-bar-label"><i class="ph ph-bold ph-bank"></i><span>${t('lm.prestamo_titulo')}</span></div>
        <div class="lm-aforo-nota">${t('lm.prestamo_no_disponible')}</div>
      `;
    }
  // Icono distinto por nivel de préstamo, para diferenciarlos de un
  // vistazo (mismo espíritu que un juego triple A: cuanto mayor el
  // paquete, más "peso" visual del icono).
  const PRESTAMO_ICONOS={pequeno:'ph-coin', medio:'ph-coins', grande:'ph-money'};
  return `
      <div class="lm-estadio-bar-label"><i class="ph ph-bold ph-bank"></i><span>${t('lm.prestamo_titulo')}</span></div>
      <div class="lm-prestamo-paquetes">
        ${paquetes.map(paq=>{
          const totalADevolver=Math.round(paq.monto*(1+paq.interes));
          return `
          <button type="button" class="lm-prestamo-paquete" data-prestamo="${paq.id}">
            <i class="ph ph-bold ${PRESTAMO_ICONOS[paq.id]||'ph-coin'} lm-prestamo-paquete-icon"></i>
            <span class="lm-prestamo-paquete-monto">+${formatoDinero(paq.monto)}</span>
            <span class="lm-prestamo-paquete-detalle">${tp('lm.prestamo_detalle', {interes:Math.round(paq.interes*100), plazo:paq.plazoJornadas})}</span>
            <span class="lm-prestamo-paquete-total">${tp('lm.prestamo_total_devolver', {total:formatoDinero(totalADevolver)})}</span>
          </button>`;
        }).join('')}
      </div>
    `;
  }

  /* ---------- Quiebra del club (fin de la partida por mala gestión) ----------
     Criterio elegido, razonado sobre la propia nómina del club (no un
     número fijo arbitrario, para que se ajuste igual de bien a un club
     modesto que a uno grande):
     - UMBRAL GRAVE: capital por debajo de -3 veces la nómina mensual
       total (jugadores + cuerpo técnico) — equivalente a deber más de
       tres meses de sueldos que no se pueden pagar, una crisis de
       verdad, no un simple mal mes.
     - DURACIÓN: si esa situación se mantiene 3 MESES SEGUIDOS (12
       jornadas) sin recuperarse por encima del umbral en ningún
       momento, la partida termina por quiebra.
     - AVISOS: el primer correo (ya existente, "números rojos") avisa
       en cuanto el capital baja de 0 — un aviso temprano y suave. En
       cuanto se cruza el umbral GRAVE se manda un aviso mucho más
       serio con la cuenta atrás exacta, y se repite cada mes que se
       siga por debajo, para que nunca llegue de sorpresa. Si en algún
       momento se recupera por encima del umbral, la cuenta atrás se
       reinicia del todo y se avisa también del respiro. */
  function comprobarInsolvenciaGrave(){
    if(state.quiebraDeclarada) return; // ya terminó, no hay nada más que comprobar
    const nomina=calcularNominaMensual();
    const umbral=-3*nomina.total;
    const enCrisisGrave=(state.capital||0)<umbral;
    const mesesPrevios=state.mesesInsolvenciaGrave||0;
    if(!enCrisisGrave){
      if(mesesPrevios>0){
        enviarCorreo('sistema', t('correo.quiebra_recuperado.asunto'), t('correo.quiebra_recuperado.cuerpo'),
          {asunto:'correo.quiebra_recuperado.asunto', cuerpo:'correo.quiebra_recuperado.cuerpo'});
      }
      state.mesesInsolvenciaGrave=0;
      return;
    }
    const mesesNuevos=mesesPrevios+1;
    state.mesesInsolvenciaGrave=mesesNuevos;
    const mesesRestantes=Math.max(0, 3-mesesNuevos);
    if(mesesNuevos>=3){
      declararQuiebra();
      return;
    }
    enviarCorreo('sistema', t('correo.quiebra_aviso.asunto'),
      tp('correo.quiebra_aviso.cuerpo', {capital:formatoDinero(state.capital), umbral:formatoDinero(umbral), meses:mesesRestantes}),
      {asunto:'correo.quiebra_aviso.asunto', cuerpo:'correo.quiebra_aviso.cuerpo', paramsCuerpo:{capital:formatoDinero(state.capital), umbral:formatoDinero(umbral), meses:mesesRestantes}});
  }
  function declararQuiebra(){
    state.quiebraDeclarada=true;
    guardarEstado();
    if(typeof window.playSound==='function') window.playSound('defeat');
  }

  // Nómina mensual — jugadores + los 4 departamentos técnicos. Cuanto más
  // nivel tenga un departamento, más cuesta mantenerlo (igual que un
  // jugador de sobre mejor es más caro). Se cobra una vez al entrar en
  // cada mes (cada 4 jornadas).
  // Mantenimiento del estadio — SOLO para clubes reales (nunca para un
  // club propio, cuyo aforo modesto y fijo ya está calibrado aparte para
  // que apriete desde el minuto uno). Un club real hereda gratis el
  // aforo de su estadio de verdad, que puede ser 6-7 veces mayor que el
  // de un club propio recién ascendido — sin ningún coste asociado a esa
  // ventaja, hasta un club real modesto llenaba caja con la simple
  // recaudación de taquilla, sin necesitar tocar ni una sola estrella de
  // los proyectos económicos del Director General. Este gasto mensual,
  // proporcional al aforo, hace que ESE tamaño de estadio también cueste
  // mantenerlo — y su coste baja con el nivel de "Relaciones con la
  // Afición" (más eficiencia operativa cuanto mejor gestionada está la
  // relación con el club), dándole a ese proyecto una razón de ser más
  // allá de tolerar precios de entrada más altos. Con esto, solo los
  // clubes con el aforo más grande de verdad (Real Madrid, Barcelona,
  // Atlético...) siguen siendo cómodos por defecto — el resto nota la
  // presión igual que un club propio, tal y como debe ser para que
  // subir esos proyectos económicos tenga sentido.
  const GASTO_ESTADIO_POR_ASIENTO=6;
  function calcularGastoEstadio(){
    if(!state.equipoRealElegidoId) return 0;
    const aforo=(state.estadio && state.estadio.aforoTotal) || 0;
    const descuento=Math.min(0.45, nivelDeDG('toleranciaPrecio')*0.15);
    return Math.round(aforo*GASTO_ESTADIO_POR_ASIENTO*(1-descuento));
  }
  function calcularNominaMensual(){
    const nominaJugadores=(state.plantilla||[]).reduce((s,p)=>s+(p.salario||0),0);
    const trab=state.trabajadores||{};
    const nominaMedico=(trab.medico?trab.medico.sueldo:0)+nivelTotalDe(state.medicoNiveles)*1200;
    const nominaMantenimiento=(trab.mantenimiento?trab.mantenimiento.sueldo:0)+nivelTotalDe(state.mantenimientoNiveles)*1200;
    const nominaGuardias=(state.guardiasContratados||0)*guardiaSalarioActual();
    const nominaDG=(trab.directorGeneral?trab.directorGeneral.sueldo:0)+nivelTotalDe(state.directorGeneralNiveles)*1500;
    const nominaDD=(trab.directorDeportivo?trab.directorDeportivo.sueldo:0)+nivelTotalDe(state.directorDeportivoNiveles)*1500;
    const nominaPF=(trab.preparadorFisico?trab.preparadorFisico.sueldo:0)+nivelTotalDe(state.preparadorFisicoNiveles)*1200;
    const nominaStaff=nominaMedico+nominaMantenimiento+nominaGuardias+nominaDG+nominaDD+nominaPF;
    const ingresoPatrocinio=nivelDeDG('ingresoPatrocinio')*15000;
    const gastoEstadio=calcularGastoEstadio();
    return {nominaJugadores, nominaStaff, ingresoPatrocinio, gastoEstadio, total:nominaJugadores+nominaStaff+gastoEstadio};
  }
  function aplicarNominaMensual(){
    const n=calcularNominaMensual();
    let nominaJugadores=n.nominaJugadores;
    if(state.directorDeportivoBonos && state.directorDeportivoBonos.descuentoNomina){
      nominaJugadores=Math.round(nominaJugadores*(1-state.directorDeportivoBonos.descuentoNomina));
      state.directorDeportivoBonos.descuentoNomina=0;
    }
    let nominaStaff=n.nominaStaff;
    if(state.directorGeneralBonos && state.directorGeneralBonos.descuentoNomina){
      nominaStaff=Math.round(nominaStaff*(1-state.directorGeneralBonos.descuentoNomina));
      state.directorGeneralBonos.descuentoNomina=0;
    }
    const gastoEstadio=n.gastoEstadio||0;
    state.capital=Math.round((state.capital||0)-nominaJugadores-nominaStaff-gastoEstadio+n.ingresoPatrocinio);
    registrarMovimientoFinanciero('Nómina de jugadores', -nominaJugadores, state.jornadaActual);
    registrarMovimientoFinanciero('Nómina del cuerpo técnico', -nominaStaff, state.jornadaActual);
    if(gastoEstadio>0) registrarMovimientoFinanciero('Mantenimiento del estadio', -gastoEstadio, state.jornadaActual);
    if(n.ingresoPatrocinio>0) registrarMovimientoFinanciero('Patrocinio mensual', n.ingresoPatrocinio, state.jornadaActual);
    // Aviso mensual de nóminas pagadas, con acceso directo al balance
    // económico completo desde el propio correo.
    const netoMes=n.ingresoPatrocinio-nominaJugadores-nominaStaff-gastoEstadio;
    if(typeof enviarCorreo==='function'){
      enviarCorreo('directorGeneral', t('correo.nominas_pagadas.asunto'),
        tp('correo.nominas_pagadas.cuerpo', {jugadores:formatoDinero(nominaJugadores), staff:formatoDinero(nominaStaff), estadio:gastoEstadio>0?tp('correo.nominas_estadio',{estadio:formatoDinero(gastoEstadio)}):'', patrocinio:n.ingresoPatrocinio>0?tp('correo.nominas_patrocinio',{patrocinio:formatoDinero(n.ingresoPatrocinio)}):'', balance:(netoMes>=0?'+':'')+formatoDinero(netoMes), capital:formatoDinero(state.capital)}),
        {asunto:'correo.nominas_pagadas.asunto', cuerpo:'correo.nominas_pagadas.cuerpo', paramsCuerpo:{jugadores:formatoDinero(nominaJugadores), staff:formatoDinero(nominaStaff), estadio:gastoEstadio>0?tp('correo.nominas_estadio',{estadio:formatoDinero(gastoEstadio)}):'', patrocinio:n.ingresoPatrocinio>0?tp('correo.nominas_patrocinio',{patrocinio:formatoDinero(n.ingresoPatrocinio)}):'', balance:(netoMes>=0?'+':'')+formatoDinero(netoMes), capital:formatoDinero(state.capital)}});
      const ultimo=state.correoInterno && state.correoInterno[0];
      if(ultimo) ultimo.tipoEspecial='balance_mensual';
    }
  }

  /* ---------- 9c-bis. TRABAJADORES del cuerpo técnico — cada uno de los
     4 puestos (médico, mantenimiento, director general, director
     deportivo) lo ocupa una persona con su propio nivel (1-5★) y sueldo.
     Cada mes aparece un puñado de candidatos nuevos para poder comparar
     si compensa cambiar; despedir deja el puesto vacante (sin sueldo,
     pero también sin nadie al mando) hasta contratar a otra persona. ---------- */
  const ROLES_TRABAJO=['directorGeneral','directorDeportivo','medico','preparadorFisico','mantenimiento'];
  const SUELDO_BASE_ROL={medico:4000, mantenimiento:4000, directorGeneral:5000, directorDeportivo:5000, preparadorFisico:4200};
  const NOMBRE_ROL={
    get medico(){return t('lm.titulo_medico');},
    get mantenimiento(){return t('lm.titulo_mantenimiento');},
    get directorGeneral(){return t('lm.titulo_dg');},
    get directorDeportivo(){return t('lm.titulo_dd');},
    get preparadorFisico(){return t('lm.titulo_pf');},
    get sistema(){return t('lm.remitente_banco');}
  };
  function nivelAleatorioTrabajador(){
    // 1★ es lo más común, 5★ muy raro — igual de espíritu que la rareza
    // de un sobre de fichajes.
    const pesos=[40,28,18,10,4]; // nivel 1..5
    const total=pesos.reduce((a,b)=>a+b,0);
    let r=Math.random()*total;
    for(let i=0;i<pesos.length;i++){ r-=pesos[i]; if(r<=0) return i+1; }
    return 1;
  }
  function generarCandidatoTrabajo(rol, nivelFijo){
    const nivel=nivelFijo||nivelAleatorioTrabajador();
    // De vez en cuando (solo en niveles 2-3) aparece un auténtico chollo:
    // el mismo nivel de siempre, pero a un sueldo muy por debajo de lo
    // normal — poco probable, pero conviene fijarse en TODOS los
    // candidatos de cada mes por si acaso.
    const esChollo = nivel>=2 && nivel<=3 && Math.random()<0.07;
    const factorSueldo = esChollo ? (0.55+Math.random()*0.12) : (0.9+Math.random()*0.2);
    const sueldo=Math.round(SUELDO_BASE_ROL[rol]*(0.55+nivel*0.55)*factorSueldo);
    return {id:'cand'+Date.now()+Math.floor(Math.random()*100000), rol, ...nombreTrabajadorAleatorio(), nivel, sueldo, chollo:esChollo};
  }
  // Un candidato de CADA nivel (1★ a 3★) por puesto, para poder elegir a
  // conciencia cada mes — no un sorteo con posibilidad de repetir nivel.
  function regenerarCandidatosTrabajo(){
    const candidatos=[];
    ROLES_TRABAJO.forEach(rol=>{
      for(let nivel=1;nivel<=3;nivel++) candidatos.push(generarCandidatoTrabajo(rol, nivel));
    });
    state.candidatosTrabajo=candidatos;
  }
  function contratarTrabajador(rol, candidatoId){
    const candidato=(state.candidatosTrabajo||[]).find(c=>c.id===candidatoId && c.rol===rol);
    if(!candidato) return false;
    if(!state.trabajadores) state.trabajadores={};
    const actual=state.trabajadores[rol];
    if(actual){
      const finiquito=calcularFiniquito(actual);
      state.capital=Math.round((state.capital||0)-finiquito);
      registrarMovimientoFinanciero('Finiquito de '+actual.nombre, -finiquito, state.jornadaActual);
    }
    // Si quien entra es del mismo sexo que quien ocupaba el puesto
    // antes, se evita que le toque exactamente la misma variante de
    // foto — si no, la ficha del cuerpo técnico enseñaría la misma cara
    // de siempre aunque acabes de fichar a otra persona distinta. Se
    // resortea solo la variante (nunca el género, que ya viene fijado
    // por el candidato elegido) entre las otras 2 disponibles.
    let fotoVariante=candidato.fotoVariante;
    if(actual && actual.genero===candidato.genero && actual.fotoVariante===fotoVariante){
      const otras=[1,2,3].filter(v=>v!==fotoVariante);
      fotoVariante=otras[Math.floor(Math.random()*otras.length)];
    }
    state.trabajadores[rol]={id:'t'+Date.now(), nombre:candidato.nombre, genero:candidato.genero, fotoVariante, nivel:candidato.nivel, sueldo:candidato.sueldo};
    state.candidatosTrabajo=state.candidatosTrabajo.filter(c=>c.id!==candidatoId);
    if(typeof window.unlockLMAchievement==='function' && ROLES_TRABAJO.every(r=>state.trabajadores[r])) window.unlockLMAchievement('lm_first_worker');
    guardarEstado();
    return true;
  }
  // Finiquito — dos meses de sueldo, igual que una indemnización real.
  function calcularFiniquito(trabajador){
    return trabajador ? Math.round(trabajador.sueldo*2) : 0;
  }
  function despedirTrabajador(rol){
    if(!state.trabajadores) return;
    const actual=state.trabajadores[rol];
    if(!actual) return;
    const finiquito=calcularFiniquito(actual);
    state.capital=Math.round((state.capital||0)-finiquito);
    registrarMovimientoFinanciero('Finiquito de '+actual.nombre, -finiquito, state.jornadaActual);
    state.trabajadores[rol]=null;
    guardarEstado();
  }

  /* ---------- 9c-ter. CORREO INTERNO — cada trabajador puede mandar un
     correo con algo importante, pero como mucho uno por jornada, y solo
     si de verdad hay algo que contar (no todas las jornadas). Textos
     cortos y directos, pensados para leerse de un vistazo. ---------- */
  const CORREO_ICONOS={medico:'ph-first-aid-kit', mantenimiento:'ph-flag-pennant', directorGeneral:'ph-briefcase', directorDeportivo:'ph-binoculars', preparadorFisico:'ph-barbell', sistema:'ph-bank'};
  function enviarCorreo(rol, asunto, cuerpo, claves){
    if(!state.correoInterno) state.correoInterno=[];
    if(!state.correoUltimoEnviado) state.correoUltimoEnviado={};
    const mail={id:'mail'+Date.now()+Math.floor(Math.random()*100000), rol, asunto, cuerpo, jornada:state.jornadaActual, leido:false};
    // Si se pasan las claves de traducción originales, se guardan
    // también — así el correo se puede volver a traducir al idioma
    // que esté activo en el momento de leerlo, en vez de quedarse
    // congelado para siempre en el idioma en que se envió.
    if(claves){ mail.claveAsunto=claves.asunto; mail.paramsAsunto=claves.paramsAsunto; mail.claveCuerpo=claves.cuerpo; mail.paramsCuerpo=claves.paramsCuerpo; }
    state.correoInterno.unshift(mail);
    state.correoUltimoEnviado[rol]=state.jornadaActual;
    if(state.correoInterno.length>40) state.correoInterno=state.correoInterno.slice(0,40);
  }
  // Traduce un correo al idioma actual si se guardaron sus claves
  // originales; si es un correo antiguo sin claves (de antes de este
  // arreglo), usa el texto ya guardado tal cual.
  function correoAsuntoActual(c){ return c.claveAsunto ? (c.paramsAsunto?tp(c.claveAsunto,c.paramsAsunto):t(c.claveAsunto)) : c.asunto; }
  function correoCuerpoActual(c){ return c.claveCuerpo ? (c.paramsCuerpo?tp(c.claveCuerpo,c.paramsCuerpo):t(c.claveCuerpo)) : c.cuerpo; }
  function borrarCorreo(mailId){
    if(!state.correoInterno) return;
    state.correoInterno=state.correoInterno.filter(c=>c.id!==mailId);
    if(correoExpandido===mailId) correoExpandido=null;
    guardarEstado();
  }
  function borrarTodoElCorreo(){
    state.correoInterno=[];
    correoExpandido=null;
    guardarEstado();
  }
  function generarCorreosTrasJornada(){
    if(!state.correoInterno) state.correoInterno=[];
    if(!state.correoUltimoEnviado) state.correoUltimoEnviado={};
    const trab=state.trabajadores||{};
    const yaEnviado=(rol)=>state.correoUltimoEnviado[rol]===state.jornadaActual;

    if(trab.mantenimiento && !yaEnviado('mantenimiento')){
      const est=state.estadio||{};
      if(est.campo<40){
        enviarCorreo('mantenimiento', t('correo.cesped_preocupante.asunto'),
          tp('correo.cesped_preocupante.cuerpo', {n:Math.round(est.campo)}),
          {asunto:'correo.cesped_preocupante.asunto', cuerpo:'correo.cesped_preocupante.cuerpo', paramsCuerpo:{n:Math.round(est.campo)}});
      } else if(est.satisfaccion<-30){
        enviarCorreo('mantenimiento', t('correo.grada_descontenta.asunto'),
          tp('correo.grada_descontenta.cuerpo', {n:est.satisfaccion}),
          {asunto:'correo.grada_descontenta.asunto', cuerpo:'correo.grada_descontenta.cuerpo', paramsCuerpo:{n:est.satisfaccion}});
        // Este correo lleva un botón directo a la interfaz de
        // Seguridad del Estadio — antes solo informaba del problema
        // sin dar ninguna forma rápida de ir a solucionarlo.
        const ultimoCorreo=state.correoInterno && state.correoInterno[0];
        if(ultimoCorreo) ultimoCorreo.tipoEspecial='grada_descontenta';
      }
    }
    if(trab.medico && !yaEnviado('medico')){
      const lesionados=(state.plantilla||[]).filter(p=>p.injured);
      const graves=lesionados.filter(p=>p.injurySeverity==='grave');
      if(graves.length){
        enviarCorreo('medico', tp('correo.lesion_grave.asunto', {jugador:graves[0].name}),
          tp('correo.lesion_grave.cuerpo', {jugador:graves[0].name}),
          {asunto:'correo.lesion_grave.asunto', paramsAsunto:{jugador:graves[0].name}, cuerpo:'correo.lesion_grave.cuerpo', paramsCuerpo:{jugador:graves[0].name}});
      } else if(lesionados.length>=3){
        enviarCorreo('medico', tp('correo.multiples_lesionados.asunto', {n:lesionados.length}),
          tp('correo.multiples_lesionados.cuerpo', {n:lesionados.length}),
          {asunto:'correo.multiples_lesionados.asunto', paramsAsunto:{n:lesionados.length}, cuerpo:'correo.multiples_lesionados.cuerpo', paramsCuerpo:{n:lesionados.length}});
      }
    }
    if(trab.directorGeneral && !yaEnviado('directorGeneral')){
      if((state.capital||0)<0){
        enviarCorreo('directorGeneral', t('correo.numeros_rojos.asunto'),
          tp('correo.numeros_rojos.cuerpo', {n:formatoDinero(state.capital)}),
          {asunto:'correo.numeros_rojos.asunto', cuerpo:'correo.numeros_rojos.cuerpo', paramsCuerpo:{n:formatoDinero(state.capital)}});
      } else {
        const nomina=calcularNominaMensual();
        if((state.capital||0)<nomina.total){
          enviarCorreo('directorGeneral', t('correo.nomina_problema.asunto'),
            tp('correo.nomina_problema.cuerpo', {capital:formatoDinero(state.capital), nomina:formatoDinero(nomina.total)}),
            {asunto:'correo.nomina_problema.asunto', cuerpo:'correo.nomina_problema.cuerpo', paramsCuerpo:{capital:formatoDinero(state.capital), nomina:formatoDinero(nomina.total)}});
        }
      }
    }
    if(trab.directorDeportivo){
      intentarGenerarSobreFichajes();
    }
    guardarEstado();
  }

  // Los sobres de fichajes se generan solos con el tiempo — más a menudo
  // cuanto más subida esté la Red de Ojeadores del Director Deportivo.
  // Máximo 3 sin abrir a la vez: si no abres los que tienes, no llegan
  // más nuevos hasta que hagas hueco. Cada uno avisa por correo en
  // cuanto está listo, y se abre directamente desde ahí.
  //
  // Probabilidad "de base" (nivel de Red de Ojeadores + calidad
  // acumulada), SIN el boost temporal de haber elegido nodos de
  // scouting esta semana — la usan tanto la tirada automática de
  // siempre (intentarGenerarSobreFichajes) como el minijuego de
  // scouting interactivo (que aplica su propio empujón manual encima
  // de este mismo punto de partida, en vez del +15% fijo por nodo).
  function calcularProbabilidadBaseSobreFichajes(){
    const nivel=nivelDeDD('sobresFichajes');
    let probabilidad=0.08+nivel*0.07; // 8% base, hasta ~29% a nivel máximo
    const calidadAcumulada=state.sobreCalidadAcumulada||0;
    if(calidadAcumulada>0){
      probabilidad=Math.min(0.95, probabilidad + calidadAcumulada*0.18);
    }
    return probabilidad;
  }
  // Resuelve DE VERDAD la tirada de un sobre con una probabilidad ya
  // decidida de antemano (por calcularProbabilidadBaseSobreFichajes +
  // boost automático, o por el resultado final del minijuego de
  // scouting) — separado de la parte que CALCULA esa probabilidad para
  // que ambos caminos (automático e interactivo) compartan exactamente
  // la misma lógica de éxito/nivel del sobre/correo de aviso. Devuelve
  // true si ha salido sobre, false si no (o si no había hueco).
  function resolverTiradaSobreFichajes(probabilidad){
    if(!state.sobresFichajesPendientes) state.sobresFichajesPendientes=[];
    if(state.sobresFichajesPendientes.length>=3) return false;
    const nivel=nivelDeDD('sobresFichajes');
    const banderas=state.nodosBanderasPendientes||{};
    const calidadAcumulada=state.sobreCalidadAcumulada||0;
    const exito=Math.random()<probabilidad;
    if(exito){
      let nivelSobre=Math.max(1, nivel);
      if(calidadAcumulada>=2) nivelSobre+=1;
      if(banderas.sobreNivelSuperior){ nivelSobre+=1; banderas.sobreNivelSuperior=false; }
      state.sobreCalidadAcumulada=0;
      const id='sobre'+Date.now()+Math.floor(Math.random()*100000);
      state.sobresFichajesPendientes.push({id, nivel:nivelSobre, jornadaGenerado:state.jornadaActual});
      enviarCorreo('directorDeportivo', t('correo.sobre_listo.asunto'),
        tp('correo.sobre_listo.cuerpo', {n:nivelSobre}),
        {asunto:'correo.sobre_listo.asunto', cuerpo:'correo.sobre_listo.cuerpo', paramsCuerpo:{n:nivelSobre}});
      const ultimo=state.correoInterno && state.correoInterno[0];
      if(ultimo){ ultimo.tipoEspecial='sobre_listo'; ultimo.sobreId=id; }
    }
    return exito;
  }
  function intentarGenerarSobreFichajes(){
    if(!state.sobresFichajesPendientes) state.sobresFichajesPendientes=[];
    if(state.sobresFichajesPendientes.length>=3) return;
    let probabilidad=calcularProbabilidadBaseSobreFichajes();
    // Boost temporal por elegir nodos de scouting en el árbol de esta
    // semana (solo aplica cuando el minijuego interactivo está
    // desactivado — con él activo, cada nodo de scouting resuelve su
    // propia tirada al momento y nunca llega a tocar esta bandera) —
    // cada uno sube la probabilidad de ESTA tirada en concreto; se
    // consume siempre, salga bien o mal la tirada.
    if(state.scoutingBoostEstaSemana){
      probabilidad=Math.min(0.95, probabilidad + state.scoutingBoostEstaSemana*0.15);
      state.scoutingBoostEstaSemana=0;
    }
    resolverTiradaSobreFichajes(probabilidad);
  }

  // ---------------------------------------------------------------
  // MINIJUEGO DE SCOUTING (push-your-luck / "empuja o plántate") —
  // PROTOTIPO. Poner esta constante a false restaura EXACTAMENTE el
  // comportamiento clásico del nodo de scouting (tirada automática e
  // invisible, +15% de boost fijo por nodo elegido esta semana) sin
  // tocar nada más: es el único interruptor que hace falta para
  // volver atrás si no convence.
  const LM_MINIJUEGO_SCOUTING_ACTIVO = true;

  // Abre el minijuego del nodo de scouting: empieza mostrando la
  // MISMA probabilidad base que usaría la tirada automática
  // (calcularProbabilidadBaseSobreFichajes — nivel de Red de
  // Ojeadores + calidad acumulada). El jugador puede EMPUJAR hasta 3
  // veces para intentar subirla más, o PLANTARSE en cualquier
  // momento para resolver la tirada YA con lo que lleve acumulado.
  // Empujar es un riesgo real: si se agotan los 3 intentos sin haber
  // pulsado plantarse antes, la codicia sale cara y la tirada se
  // pierde entera (0%, sin sobre). Reutiliza resolverTiradaSobreFichajes
  // para que el resultado (nivel del sobre, correo de aviso...) sea
  // idéntico tanto si sale del minijuego como de la tirada automática.
  function abrirMinijuegoScouting(onCerrado){
    const MAX_EMPUJONES=3;
    let probActual=calcularProbabilidadBaseSobreFichajes();
    let empujones=0;
    let fase='jugando'; // 'jugando' | 'animando' | 'resuelto'
    let resultadoExito=null;
    let agotado=false;

    const overlay=document.createElement('div');
    overlay.id='lmScoutingMinijuegoOverlay';
    // A document.body, NUNCA a #ligaManagerScreen: el árbol de nodos
    // repinta ese contenedor (pintarArbolNodos()/render() sustituyen su
    // innerHTML entero) mientras el minijuego sigue abierto encima —
    // colgado de #ligaManagerScreen se borraba solo a los pocos
    // instantes de abrirse, igual que el resto de overlays del juego
    // que deben sobrevivir a un repintado (p.ej. el boletín de la
    // quiniela, más abajo).
    document.body.appendChild(overlay);

    function claseMeterParaProb(p){
      if(p>=0.5) return 'lm-scout-mini-meter-fill-alta';
      if(p>=0.25) return 'lm-scout-mini-meter-fill-media';
      return 'lm-scout-mini-meter-fill-baja';
    }

    function pintar(){
      const pct=Math.round(probActual*100);
      const intentosRestantes=Math.max(0, MAX_EMPUJONES-empujones);
      const puedeEmpujar = fase==='jugando' && empujones<MAX_EMPUJONES;
      const puedePlantarse = fase==='jugando';
      let resultadoTexto='';
      if(fase==='resuelto'){
        resultadoTexto = resultadoExito ? t('lm.scoutmini_resultado_exito')
          : (agotado ? t('lm.scoutmini_resultado_agotado') : t('lm.scoutmini_resultado_fallo'));
      }
      overlay.innerHTML=`
        <div class="lm-dilemma-card lm-scout-mini-card">
          <div class="lm-dilemma-title lm-scout-mini-title"><i class="ph ph-bold ph-binoculars"></i>${t('lm.scoutmini_titulo')}</div>
          ${fase!=='resuelto' ? `<div class="lm-dilemma-text lm-scout-mini-desc">${t('lm.scoutmini_desc')}</div>` : ''}
          <div class="lm-scout-mini-meter-wrap">
            <div class="lm-scout-mini-meter-track">
              <div class="lm-scout-mini-meter-fill ${claseMeterParaProb(probActual)}" id="lmScoutMeterFill" style="width:${pct}%"></div>
            </div>
            <div class="lm-scout-mini-pct" id="lmScoutMeterPct">${pct}%</div>
          </div>
          <div class="lm-scout-mini-intentos">
            ${Array.from({length:MAX_EMPUJONES}).map((_,i)=>`<span class="lm-scout-mini-intento-pip${i<empujones?' lm-scout-mini-intento-pip-usado':''}"></span>`).join('')}
            ${fase==='jugando' ? `<span class="lm-scout-mini-intentos-label">${tp('lm.scoutmini_intentos_restantes',{n:intentosRestantes})}</span>` : ''}
          </div>
          ${fase==='resuelto' ? `<div class="lm-scout-mini-resultado ${resultadoExito?'lm-scout-mini-resultado-exito':'lm-scout-mini-resultado-fallo'}">${resultadoTexto}</div>` : ''}
          <div class="lm-scout-mini-actions">
            ${fase==='resuelto'
              ? `<button type="button" id="lmScoutBtnContinuar" class="mode-card-btn mode-card-btn-gold">${t('lm.continuar')}</button>`
              : `<button type="button" id="lmScoutBtnPlantarse" class="mode-card-btn mode-card-btn-gold" ${puedePlantarse?'':'disabled'}><i class="ph ph-bold ph-hand-palm"></i> ${t('lm.scoutmini_plantarse')}</button>
                 <button type="button" id="lmScoutBtnEmpujar" class="mode-card-btn mode-card-btn-secondary" ${puedeEmpujar?'':'disabled'}><i class="ph ph-bold ph-arrow-fat-lines-up"></i> ${t('lm.scoutmini_empujar')}</button>`}
          </div>
        </div>`;
      cablear();
    }

    function cablear(){
      const btnPlantarse=overlay.querySelector('#lmScoutBtnPlantarse');
      const btnEmpujar=overlay.querySelector('#lmScoutBtnEmpujar');
      const btnContinuar=overlay.querySelector('#lmScoutBtnContinuar');
      if(btnPlantarse) btnPlantarse.addEventListener('click', ()=>{
        if(fase!=='jugando') return;
        if(typeof window.playSound==='function') window.playSound('select');
        resolver(probActual, false);
      });
      if(btnEmpujar) btnEmpujar.addEventListener('click', ()=>{
        if(fase!=='jugando' || empujones>=MAX_EMPUJONES) return;
        if(typeof window.playSound==='function') window.playSound('select');
        empujar();
      });
      if(btnContinuar) btnContinuar.addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        overlay.remove();
        if(typeof onCerrado==='function') onCerrado();
      });
    }

    function empujar(){
      fase='animando';
      pintar();
      empujones++;
      const bonus=0.06+Math.random()*0.09; // cada empujón sube entre +6% y +15%
      const nuevaProb=Math.min(0.95, probActual+bonus);
      const fillEl=overlay.querySelector('#lmScoutMeterFill');
      const pctEl=overlay.querySelector('#lmScoutMeterPct');
      const desde=Math.round(probActual*100);
      const hasta=Math.round(nuevaProb*100);
      let paso=0; const pasos=10;
      const spin=setInterval(()=>{
        paso++;
        const val=Math.round(desde+(hasta-desde)*(paso/pasos));
        if(fillEl) fillEl.style.width=val+'%';
        if(pctEl) pctEl.textContent=val+'%';
        if(typeof window.playSound==='function') window.playSound('spin');
        if(paso>=pasos){
          clearInterval(spin);
          probActual=nuevaProb;
          if(typeof window.playSound==='function') window.playSound('reveal');
          if(empujones>=MAX_EMPUJONES){
            // 3 empujones sin plantarse: la codicia sale cara — la
            // probabilidad conseguida se pierde entera.
            probActual=0;
            resolver(0, true);
          } else {
            fase='jugando';
            pintar();
          }
        }
      },70);
    }

    function resolver(probFinal, seAgoto){
      fase='resuelto';
      agotado=seAgoto;
      resultadoExito = probFinal>0 ? resolverTiradaSobreFichajes(probFinal) : false;
      guardarEstado();
      pintar();
    }

    // A propósito SIN habilitarCierreOverlay mientras se juega: un
    // clic fuera accidental no puede saltarse la decisión de
    // plantarse/empujar. Solo se cierra con el botón explícito
    // ("CONTINUAR", una vez resuelto), igual que las pantallas de
    // tirada de dados del resto del juego.
    pintar();
  }

  /* ---------- 9d. CARTAS DEL DIRECTOR GENERAL (dorado) — economía y
     marca del club: patrocinios, merchandising, aforo y precio de
     entrada. Mismo sistema de 10 cartas que médico/mantenimiento. ---------- */
  const DIRECTOR_GENERAL_CARTAS_BASE = [
    {id:'patrocinio_puntual',    tipo:'directa', nombre:'Acuerdo de Patrocinio Puntual', icon:'ph-handshake',      dificultad:6, desc:'Ingreso instantáneo de capital por un acuerdo puntual'},
    {id:'venta_especial',        tipo:'directa', nombre:'Venta Especial de Merchandising', icon:'ph-t-shirt',      dificultad:5, desc:'Ingreso instantáneo por una campaña de camisetas'},
    {id:'renegociacion_gastos',  tipo:'directa', nombre:'Renegociación de Contratos',    icon:'ph-file-text',      dificultad:8, desc:'La nómina del próximo mes será más barata'},
    {id:'evento_corporativo',    tipo:'directa', nombre:'Evento Corporativo',            icon:'ph-confetti',       dificultad:7, desc:'Ingreso instantáneo de capital y un pequeño impulso a la satisfacción'},
    {id:'auditoria_financiera',  tipo:'directa', nombre:'Auditoría Financiera',          icon:'ph-chart-line-up',  dificultad:9, desc:'Ingreso instantáneo de capital, mayor que el habitual'},
    {id:'campana_socios',        tipo:'directa', nombre:'Campaña de Socios',             icon:'ph-megaphone',      dificultad:6, desc:'Impulsa la asistencia prevista del próximo partido en casa'},
    {id:'ampliacion_grada',      tipo:'nivel', track:'aforoExtra',         nombre:'Ampliación de Grada',          icon:'ph-stairs',       dificultadBase:9, dificultadPaso:5, desc:'Amplía permanentemente el aforo del estadio'},
    {id:'cartera_patrocinadores',tipo:'nivel', track:'ingresoPatrocinio',  nombre:'Cartera de Patrocinadores',    icon:'ph-handshake',    dificultadBase:8, dificultadPaso:4, desc:'Aumenta el ingreso fijo por patrocinio cada mes'},
    {id:'tienda_merchandising',  tipo:'nivel', track:'ingresoMerchandising',nombre:'Tienda y Merchandising',      icon:'ph-t-shirt',      dificultadBase:8, dificultadPaso:4, desc:'Aumenta lo recaudado en merchandising por cada asistente'},
    {id:'relaciones_aficion',    tipo:'nivel', track:'toleranciaPrecio',   nombre:'Relaciones con la Afición',    icon:'ph-users-three',  dificultadBase:8, dificultadPaso:4, desc:'Permite subir el precio de la entrada con menos enfado de la afición'}
  ];
  function cartaDefDG(id){ return DIRECTOR_GENERAL_CARTAS_BASE.find(c=>c.id===id); }
  function nivelDeDG(track){ return (state.directorGeneralNiveles && state.directorGeneralNiveles[track]) || 0; }
  // Reinicia los usos del Giro Táctico al cruzar de la primera mitad
  // de temporada (jornadas 1-19) a la segunda (20-38) — se llama al
  // principio de jugarJornada(), así siempre está al día antes de
  // jugar cualquier partido. También sirve de inicialización perezosa
  // para partidas guardadas antes de que existiera este sistema.
  function actualizarUsosGiroTacticoLM(){
    const mitadReal = state.jornadaActual<=19 ? 1 : 2;
    if(state.giroTacticoUsosRestantes===undefined || state.giroTacticoMitad!==mitadReal){
      state.giroTacticoUsosRestantes=getMaxGiroTacticoLM();
      state.giroTacticoMitad=mitadReal;
    }
  }
  function dificultadActualNivelDG(def){ return Math.max(3, def.dificultadBase + nivelDeDG(def.track)*def.dificultadPaso - bonusEstrellasTrabajador('directorGeneral')); }
  function generarCartaAleatoriaDG(excluirIds){
    excluirIds=excluirIds||[];
    const agotadas=state.directorGeneralCartasAgotadas||[];
    const disponibles=DIRECTOR_GENERAL_CARTAS_BASE.filter(c=>!excluirIds.includes(c.id) && !agotadas.includes(c.id));
    const pool=disponibles.length?disponibles:DIRECTOR_GENERAL_CARTAS_BASE.filter(c=>!agotadas.includes(c.id));
    if(!pool.length) return null;
    const def=pool[Math.floor(Math.random()*pool.length)];
    return {cartaId:def.id, progreso:0, nivelActual:1};
  }
  function inicializarCartasDG(){
    const cartas=[];
    for(let i=0;i<3;i++){ const nueva=generarCartaAleatoriaDG(cartas.map(c=>c.cartaId)); if(nueva) cartas.push(nueva); }
    return cartas;
  }
  function cambiarCartaDG(idx){
    if((state.directorGeneralCambiosUsados||0)>=lmCambiosCartaPorPartido()) return false;
    const otras=state.directorGeneralCartas.filter((c,i)=>i!==idx).map(c=>c.cartaId);
    const nueva=generarCartaAleatoriaDG(otras);
    if(!nueva) return false;
    state.directorGeneralCartas[idx]=nueva;
    state.directorGeneralCambiosUsados=(state.directorGeneralCambiosUsados||0)+1;
    guardarEstado();
    return true;
  }
  function aplicarEfectoDirectaDG(def){
    switch(def.id){
      case 'patrocinio_puntual': {
        const monto=18000+Math.round(Math.random()*7000);
        state.capital=(state.capital||0)+monto;
        registrarMovimientoFinanciero('Patrocinio puntual', monto, state.jornadaActual);
        if(typeof window.unlockLMAchievement==='function') window.unlockLMAchievement('lm_first_sponsor', false);
        return `Ingreso de ${formatoDinero(monto)}`;
      }
      case 'venta_especial': {
        const monto=9000+Math.round(Math.random()*4000);
        state.capital=(state.capital||0)+monto;
        registrarMovimientoFinanciero('Venta especial de merchandising', monto, state.jornadaActual);
        return `Ingreso de ${formatoDinero(monto)}`;
      }
      case 'renegociacion_gastos':
        state.directorGeneralBonos=state.directorGeneralBonos||{};
        state.directorGeneralBonos.descuentoNomina=0.15;
        return 'La nómina del cuerpo técnico del próximo mes será un 15% más barata';
      case 'evento_corporativo': {
        const monto=12000+Math.round(Math.random()*5000);
        state.capital=(state.capital||0)+monto;
        state.estadio.satisfaccion=Math.max(-100,Math.min(100, state.estadio.satisfaccion+4));
        registrarMovimientoFinanciero('Evento corporativo', monto, state.jornadaActual);
        return `Ingreso de ${formatoDinero(monto)} y la afición lo agradece`;
      }
      case 'auditoria_financiera': {
        const monto=25000+Math.round(Math.random()*10000);
        state.capital=(state.capital||0)+monto;
        registrarMovimientoFinanciero('Auditoría financiera', monto, state.jornadaActual);
        return `Ingreso de ${formatoDinero(monto)}`;
      }
      case 'campana_socios':
        state.directorGeneralBonos=state.directorGeneralBonos||{};
        state.directorGeneralBonos.boostAsistencia=0.10;
        return 'La asistencia del próximo partido en casa subirá algo más de lo habitual';
      default: return 'Aplicado';
    }
  }
  function aplicarNivelMejoraDG(def){
    if(!state.directorGeneralNiveles) state.directorGeneralNiveles={aforoExtra:0, ingresoPatrocinio:0, ingresoMerchandising:0, toleranciaPrecio:0};
    const nivelNuevo=Math.min(NIVEL_MAXIMO_EQUIPO, nivelDeDG(def.track)+1);
    state.directorGeneralNiveles[def.track]=nivelNuevo;
    if(def.track==='aforoExtra'){
      state.estadio.aforoTotal=(state.estadio.aforoTotal||12000)+1500;
    }
    const maxAlcanzado=nivelNuevo>=NIVEL_MAXIMO_EQUIPO;
    if(maxAlcanzado){
      state.directorGeneralCartasAgotadas=state.directorGeneralCartasAgotadas||[];
      state.directorGeneralCartasAgotadas.push(def.id);
    }
    return {nivelNuevo, maxAlcanzado};
  }
  function resolverCartaDG(idx, tiradas){
    const instancia=state.directorGeneralCartas[idx];
    const def=cartaDefDG(instancia.cartaId);
    if(!def) return {tipo:'error', texto:'No se encontró la carta — prueba a cambiarla.'};
    const suma=tiradas.reduce((a,b)=>a+b,0);
    let resultado;
    if(def.tipo==='directa'){
      const dificultadEfectiva=Math.max(3, def.dificultad - bonusEstrellasTrabajador('directorGeneral'));
      const exito=suma>=dificultadEfectiva;
      if(exito){
        const texto=aplicarEfectoDirectaDG(def);
        state.directorGeneralCartas[idx]=generarCartaAleatoriaDG(state.directorGeneralCartas.map(c=>c.cartaId)) || instancia;
        resultado={tipo:'directa', exito:true, suma, dificultad:dificultadEfectiva, texto};
      } else {
        resultado={tipo:'directa', exito:false, suma, dificultad:dificultadEfectiva, texto:'La carta se queda en tu mano — puedes reintentarlo más adelante'};
      }
    } else {
      const dificultadActual=dificultadActualNivelDG(def);
      const exito=suma>=dificultadActual;
      if(exito){
        const {nivelNuevo, maxAlcanzado}=aplicarNivelMejoraDG(def);
        state.directorGeneralCartas[idx]=generarCartaAleatoriaDG(state.directorGeneralCartas.map(c=>c.cartaId)) || instancia;
        resultado={tipo:'nivel', exito:true, suma, dificultad:dificultadActual, nivelNuevo, maxAlcanzado, nombre:def.nombre};
      } else {
        resultado={tipo:'nivel', exito:false, suma, dificultad:dificultadActual, nombre:def.nombre, texto:'La carta se queda en tu mano — puedes reintentarlo más adelante'};
      }
    }
    guardarEstado();
    return resultado;
  }

  /* ---------- 9e. CARTAS DEL DIRECTOR DEPORTIVO (plata) — fichajes.
     La pieza especial es "Sobres de Fichajes" (tipo 'sobre'): sube de
     nivel con dados igual que una carta de nivel normal, pero además
     lleva un botón propio de "ABRIR SOBRE" siempre visible una vez
     alcanzado un nivel — se puede abrir cuando se quiera (pagando un
     coste de capital), sin depender de la tirada. Al completar el nivel
     3 se abre automáticamente un sobre de máxima calidad gratis, como
     recompensa. ---------- */
  const DIRECTOR_DEPORTIVO_CARTAS_BASE = [
    {id:'ojeo_urgente',            tipo:'directa', nombre:'Ojeo Urgente',            icon:'ph-binoculars',   dificultad:8, desc:'Trae gratis un sobre de fichajes al nivel actual de tus Sobres'},
    {id:'venta_jugador',           tipo:'directa', nombre:'Venta de Jugador',        icon:'ph-hand-coins',   dificultad:6, desc:'Vende a tu peor suplente por un ingreso de capital'},
    {id:'prestamo_breve',          tipo:'directa', nombre:'Préstamo Breve',          icon:'ph-bank',         dificultad:6, desc:'Ingreso instantáneo de capital'},
    {id:'negociacion_salarial',    tipo:'directa', nombre:'Negociación Salarial',    icon:'ph-file-text',    dificultad:9, desc:'La nómina de jugadores del próximo mes será más barata'},
    {id:'informe_ojeo',            tipo:'directa', nombre:'Informe de Ojeo Exprés', icon:'ph-magnifying-glass', dificultad:7, desc:'El próximo sobre que abras traerá mejor calidad de la habitual'},
    {id:'gira_promocional',        tipo:'directa', nombre:'Gira Promocional',        icon:'ph-airplane-tilt',dificultad:6, desc:'Ingreso instantáneo de capital y un pequeño impulso a la moral'},
    {id:'sobres_fichajes',   tipo:'nivel', track:'sobresFichajes', nombre:'Red de Ojeadores Activa',      icon:'ph-envelope-open', dificultadBase:9, dificultadPaso:5, desc:'Acorta el tiempo entre sobres de fichajes — llegarán con más frecuencia por correo. A nivel alto, aumenta también la posibilidad de que aparezca un fichaje estrella real'},
    {id:'red_ojeadores',     tipo:'nivel', track:'calidadOjeo',    nombre:'Red de Ojeadores',        icon:'ph-binoculars',    dificultadBase:8, dificultadPaso:4, desc:'Mejora la calidad de los jugadores que salen en los sobres'},
    {id:'negociacion_contratos',tipo:'nivel', track:'ahorroSalarial', nombre:'Negociación de Contratos', icon:'ph-handshake', dificultadBase:8, dificultadPaso:4, desc:'Reduce el salario de los jugadores fichados por sobre'},
    {id:'formacion_cantera', tipo:'nivel', track:'costeSobres',    nombre:'Formación de Cantera',    icon:'ph-graduation-cap',dificultadBase:8, dificultadPaso:4, desc:'Tu academia forma talento desde la base: cada canterano que llega por sobre nace con un nivel superior al habitual'}
  ];
  function cartaDefDD(id){ return DIRECTOR_DEPORTIVO_CARTAS_BASE.find(c=>c.id===id); }
  function nivelDeDD(track){ return (state.directorDeportivoNiveles && state.directorDeportivoNiveles[track]) || 0; }
  function dificultadActualNivelDD(def){
    let d=def.dificultadBase + nivelDeDD(def.track)*def.dificultadPaso - bonusEstrellasTrabajador('directorDeportivo');
    return Math.max(4, d);
  }
  function generarCartaAleatoriaDD(excluirIds){
    excluirIds=excluirIds||[];
    const agotadas=state.directorDeportivoCartasAgotadas||[];
    const disponibles=DIRECTOR_DEPORTIVO_CARTAS_BASE.filter(c=>!excluirIds.includes(c.id) && !agotadas.includes(c.id));
    const pool=disponibles.length?disponibles:DIRECTOR_DEPORTIVO_CARTAS_BASE.filter(c=>!agotadas.includes(c.id));
    if(!pool.length) return null;
    const def=pool[Math.floor(Math.random()*pool.length)];
    return {cartaId:def.id, progreso:0, nivelActual:1};
  }
  function inicializarCartasDD(){
    const cartas=[];
    for(let i=0;i<3;i++){ const nueva=generarCartaAleatoriaDD(cartas.map(c=>c.cartaId)); if(nueva) cartas.push(nueva); }
    return cartas;
  }
  function cambiarCartaDD(idx){
    if((state.directorDeportivoCambiosUsados||0)>=lmCambiosCartaPorPartido()) return false;
    const otras=state.directorDeportivoCartas.filter((c,i)=>i!==idx).map(c=>c.cartaId);
    const nueva=generarCartaAleatoriaDD(otras);
    if(!nueva) return false;
    state.directorDeportivoCartas[idx]=nueva;
    state.directorDeportivoCambiosUsados=(state.directorDeportivoCambiosUsados||0)+1;
    guardarEstado();
    return true;
  }
  const SOBRE_COSTES={1:5000, 2:12000, 3:25000};
  // Genera un jugador de sobre: cuanto mayor el nivel del sobre y la Red
  // de Ojeadores, mejor (y más caro de mantener) — tal como se pidió. Si
  // hay una posición objetivo marcada desde el Director Deportivo, los
  // ojeadores se centran en ella en vez de salir al azar.
  function generarJugadorSobre(nivelSobre, posicionForzada){
    const calidad=nivelDeDD('calidadOjeo');
    const canteraBonus=nivelDeDD('costeSobres')*3;
    const bonusInforme = (state.directorDeportivoBonos && state.directorDeportivoBonos.bonusCalidadSobre) ? 8 : 0;
    // OPORTUNIDAD: el canterano sale con una nota algo superior a la
    // habitual, pero pidiendo un sueldo más bajo del que le
    // correspondería por esa nota. Cuanto más subido esté "Red de
    // Ojeadores", más fácil es que aparezca — de un 5% base a un 25%
    // con la Red de Ojeadores al máximo.
    const esOportunidad = Math.random()<(0.05+calidad*0.02);
    const overall=Math.max(45, Math.min(96, 50+nivelSobre*10+calidad*4+canteraBonus+bonusInforme+(esOportunidad?6:0)+Math.floor(Math.random()*8)));
    const posiciones=['POR','DFC','LI','LD','MC','EI','ED','DC'];
    const position = (posicionForzada && posiciones.includes(posicionForzada)) ? posicionForzada : posiciones[Math.floor(Math.random()*posiciones.length)];
    const variar=()=>Math.max(30,Math.min(96, overall+Math.floor(Math.random()*13)-6));
    const ahorro=nivelDeDD('ahorroSalarial')*0.12;
    const descuentoOportunidad = esOportunidad ? 0.35 : 0;
    const salario=Math.round(calcularSalario(overall)*(1-ahorro)*(1-descuentoOportunidad));
    return {
      id:'s'+Date.now()+Math.floor(Math.random()*100000), name:nombreJugadorAleatorio(), position, overall,
      attack:variar(), defense:variar(), pace:variar(), passing:variar(), technique:variar(),
      fatigue:100, racha:0, esSuplente:true,
      injured:false, injuryWeeks:0, injurySeverity:null,
      // Techo de potencial — dato que existe siempre para cada
      // candidato, pero que solo se MUESTRA al jugador si tiene activa
      // la habilidad Ojo Clínico (ver render de la carta del sobre).
      potencial: Math.max(overall, Math.min(99, overall+8+Math.floor(Math.random()*12))),
      salario, nivelSobre, esFichajeEstrella:false, esOportunidad
    };
  }
  // FICHAJE ESTRELLA — con la Red de Ojeadores bien subida de nivel
  // (2-3 estrellas), a veces uno de los 3 candidatos del sobre no es un
  // canterano inventado, sino un jugador REAL de otro equipo de la
  // liga, listo para ficharlo. Si se ficha, desaparece de su equipo de
  // origen el resto de la partida (registrado en
  // state.jugadoresRealesFichados).
  function jugadorYaFichado(equipoId, nombre){
    return (state.jugadoresRealesFichados||[]).some(j=>j.equipoId===equipoId && j.nombre===nombre);
  }
  // Aunque un equipo tenga más jugadores investigados en teams-data.js
  // (algunos llegan a 25-29), en el terreno de juego un rival SOLO usa
  // sus 16 mejores (11 titulares + 5 banquillo) — los mismos que se
  // muestran en la lupa y los únicos que pueden salir como goleadores.
  // El resto queda "en la recámara": si uno de esos 16 se ficha (sale
  // del equipo), el siguiente mejor disponible ocupa su hueco solo,
  // sin que el jugador tenga que hacer nada. Esto NUNCA afecta a tu
  // propia plantilla, solo a la de los rivales.
  function plantillaEfectivaRival(equipo){
    const disponibles=(equipo.plantilla||[]).filter(j=>!jugadorYaFichado(equipo.id, j.name));
    const puntuacion=j=> j.attack!==undefined
      ? Math.round((j.attack+j.defense+j.pace+j.passing+j.technique)/5)
      : Math.round((equipo.attack+equipo.defense+equipo.pace+equipo.passing+equipo.technique)/5);
    // El portero real del equipo SIEMPRE debe ocupar la portería, nunca
    // un jugador de campo — por eso se separan y se ordena cada grupo
    // por su cuenta, con el portero (o los porteros, si hay varios)
    // siempre por delante del resto.
    const porteros=disponibles.filter(j=>j.pos==='POR').sort((a,b)=>puntuacion(b)-puntuacion(a));
    const resto=disponibles.filter(j=>j.pos!=='POR').sort((a,b)=>puntuacion(b)-puntuacion(a));
    return [...porteros, ...resto].slice(0,16);
  }
  function generarJugadorFichajeEstrella(posicionForzada){
    const equiposConHueco = LM_RIVALS.filter(eq=>(eq.plantilla||[]).some(j=>!jugadorYaFichado(eq.id, j.name)));
    if(!equiposConHueco.length) return null;
    const equipo = equiposConHueco[Math.floor(Math.random()*equiposConHueco.length)];
    const candidatos = equipo.plantilla.filter(j=>!jugadorYaFichado(equipo.id, j.name));
    const jugadorReal = candidatos[Math.floor(Math.random()*candidatos.length)];
    const posiciones=['POR','DFC','LI','LD','MC','EI','ED','DC'];
    const position = (posicionForzada && posiciones.includes(posicionForzada)) ? posicionForzada : posiciones[Math.floor(Math.random()*posiciones.length)];
    function statVariada(base){ return Math.max(50, Math.min(97, Math.round(base+Math.floor(Math.random()*11)-5))); }
    const tieneStatsReales = jugadorReal.attack!==undefined;
    const attack = tieneStatsReales ? jugadorReal.attack : statVariada(equipo.attack);
    const defense = tieneStatsReales ? jugadorReal.defense : statVariada(equipo.defense);
    const pace = tieneStatsReales ? jugadorReal.pace : statVariada(equipo.pace);
    const passing = tieneStatsReales ? jugadorReal.passing : statVariada(equipo.passing);
    const technique = tieneStatsReales ? jugadorReal.technique : statVariada(equipo.technique);
    const overall=Math.round((attack+defense+pace+passing+technique)/5);
    return {
      id:'s'+Date.now()+Math.floor(Math.random()*100000), name:jugadorReal.name, numero:jugadorReal.n, position, overall,
      attack, defense, pace, passing, technique,
      fatigue:100, racha:0, esSuplente:true,
      injured:false, injuryWeeks:0, injurySeverity:null,
      potencial: Math.max(overall, Math.min(99, overall+4+Math.floor(Math.random()*8))), // un fichaje estrella ya está más cerca de su techo real
      salario:calcularSalario(overall),
      esFichajeEstrella:true, equipoOrigenId:equipo.id, equipoOrigenName:equipo.name
    };
  }
  function posicionObjetivoOjeoActual(){
    return (state.posicionObjetivoOjeo && state.posicionObjetivoOjeo!=='any') ? state.posicionObjetivoOjeo : null;
  }
  // Abre un sobre concreto de la cola de pendientes (por id) — ya no se
  // abre "por nivel" desde una tarjeta, sino un sobre específico que ya
  // estaba esperando, avisado por correo.
  function abrirSobrePorId(sobreId){
    const idx=(state.sobresFichajesPendientes||[]).findIndex(s=>s.id===sobreId);
    if(idx===-1) return null;
    const sobre=state.sobresFichajesPendientes[idx];
    const costeBase=sobre.gratis ? 0 : (SOBRE_COSTES[sobre.nivel]||SOBRE_COSTES[1]);
    // Negociador Nato: pequeño descuento extra en cada sobre con coste
    // real, mientras la habilidad esté activa — igual que el resto de
    // habilidades del juego (bonus continuo, no de un solo uso).
    const descuentoNegociador = (costeBase>0 && typeof lmSkillActiva==='function' && lmSkillActiva('lm_negociador_nato')) ? 0.08 : 0;
    const coste=Math.round(costeBase*(1-lmDescuentoSobres()-descuentoNegociador));
    if((state.capital||0)<coste) return null;
    if(coste>0){
      state.capital-=coste;
      registrarMovimientoFinanciero('Sobre de fichajes (nivel '+sobre.nivel+')', -coste, state.jornadaActual);
    }
    state.sobresFichajesPendientes.splice(idx,1);
    if(typeof window.unlockLMAchievement==='function') window.unlockLMAchievement('lm_first_sobre');
    const posObjetivo=posicionObjetivoOjeoActual();
    // Probabilidad de fichaje estrella: nula a nivel 0-1, y creciente a
    // partir de nivel 2 de la Red de Ojeadores — como se pidió.
    const nivelRed=nivelDeDD('sobresFichajes');
    const probEstrellaBase = nivelRed>=3 ? 0.35 : (nivelRed===2 ? 0.18 : 0);
    // Ojeador Estrella: pequeño extra de probabilidad, pero solo tiene
    // efecto si la Red de Ojeadores ya está en nivel 2 o más — a nivel
    // 0-1 sigue siendo imposible, tal y como se diseñó esa mejora.
    const bonusOjeadorEstrella = (nivelRed>=2 && lmSkillActiva('lm_ojeador_estrella')) ? 0.05 : 0;
    const probEstrella = probEstrellaBase+bonusOjeadorEstrella;
    let huboEstrella=false;
    // Un sobre ya ofrece 3 candidatos de por sí — el hito de scouting
    // acumulado (20 nodos) añade un cuarto candidato extra a elegir,
    // en vez de "sustituir" un sistema de elección única que en
    // realidad nunca existió.
    const numCandidatos = (state.nodosBanderasPendientes && state.nodosBanderasPendientes.sobreDobleEleccion) ? 4 : 3;
    if(numCandidatos===4 && state.nodosBanderasPendientes) state.nodosBanderasPendientes.sobreDobleEleccion=false;
    const jugadores=Array.from({length:numCandidatos}, ()=>{
      if(!huboEstrella && Math.random()<probEstrella){
        const estrella=generarJugadorFichajeEstrella(posObjetivo);
        if(estrella){ huboEstrella=true; return estrella; }
      }
      return generarJugadorSobre(sobre.nivel, posObjetivo);
    });
    if(state.directorDeportivoBonos && state.directorDeportivoBonos.bonusCalidadSobre){ state.directorDeportivoBonos.bonusCalidadSobre=false; }
    guardarEstado();
    return jugadores;
  }
  // Busca el primer dorsal libre (1-99) en tu plantilla actual — si el
  // jugador ya trae un número real (p.ej. un fichaje estrella) y ese
  // número está libre, se respeta; si ya lo tiene otro, se le asigna el
  // siguiente disponible.
  function asignarNumeroDisponible(numeroPreferido){
    const usados=new Set((state.plantilla||[]).map(p=>p.numero).filter(n=>n!=null));
    if(numeroPreferido && !usados.has(numeroPreferido)) return numeroPreferido;
    for(let n=1;n<=99;n++){ if(!usados.has(n)) return n; }
    return null;
  }
  function ficharJugadorSobre(jugador){
    const numero=asignarNumeroDisponible(jugador.numero);
    state.plantilla.push({...jugador, numero, esSuplente:true});
    if(jugador.esFichajeEstrella && jugador.equipoOrigenId){
      if(!state.jugadoresRealesFichados) state.jugadoresRealesFichados=[];
      state.jugadoresRealesFichados.push({equipoId:jugador.equipoOrigenId, nombre:jugador.name});
      if(typeof window.unlockLMAchievement==='function') window.unlockLMAchievement('lm_star_signing');
    }
    if(!state.directorDeportivoHistorial) state.directorDeportivoHistorial=[];
    state.directorDeportivoHistorial.unshift({tipo:'fichaje', nombre:jugador.name, position:jugador.position, overall:jugador.overall, estrella:!!jugador.esFichajeEstrella, procedencia:jugador.equipoOrigenName||null, jornada:state.jornadaActual});
    if(typeof window.unlockLMAchievement==='function' && state.directorDeportivoHistorial.filter(h=>h.tipo==='fichaje').length>=5) window.unlockLMAchievement('lm_5_signings', false);
    if(typeof window.unlockLMAchievement==='function' && jugador.potencial && (jugador.potencial-jugador.overall)>=15) window.unlockLMAchievement('lm_canterano_joya', false);
    guardarEstado();
  }
  // Poner en venta / ofertas de traspaso — blindado igual que antes para
  // no dejar nunca la plantilla sin gente para jugar: nunca por debajo
  // de 11 en total, y siempre al menos 11 SANOS disponibles.
  function puedeVenderJugador(jugadorId){
    const plantilla=state.plantilla||[];
    if(plantilla.length<=11) return {ok:false, motivo:'No puedes bajar de 11 jugadores en la plantilla'};
    const sanosSinEste=plantilla.filter(p=>p.id!==jugadorId && !p.injured).length;
    if(sanosSinEste<11) return {ok:false, motivo:'Necesitas al menos 11 jugadores sanos disponibles después de la venta'};
    return {ok:true};
  }
  // Poner un jugador en venta no da dinero al momento: el Director
  // Deportivo tantea el mercado y, en 1-3 jornadas, avisa por correo de
  // qué clubes se han interesado — se elige la oferta a aceptar (o
  // ninguna) desde el propio correo.
  function ponerJugadorEnVenta(jugadorId){
    const jugador=(state.plantilla||[]).find(p=>p.id===jugadorId);
    if(!jugador) return {ok:false, motivo:'Ese jugador ya no está en la plantilla'};
    if(jugador.enVenta) return {ok:false, motivo:'Ese jugador ya está en venta'};
    const chequeo=puedeVenderJugador(jugadorId);
    if(!chequeo.ok) return chequeo;
    jugador.enVenta=true;
    jugador.ventaResolverJornada=state.jornadaActual+1+Math.floor(Math.random()*3);
    guardarEstado();
    return {ok:true};
  }
  function quitarJugadorDeVenta(jugadorId){
    const jugador=(state.plantilla||[]).find(p=>p.id===jugadorId);
    if(!jugador) return;
    jugador.enVenta=false;
    jugador.ventaResolverJornada=null;
    guardarEstado();
  }
  // Comprueba si ha llegado el plazo de algún jugador puesto en venta y,
  // si es así, genera las ofertas de 1-3 clubes rivales y manda el
  // correo del Director Deportivo con los botones para elegir.
  function procesarOfertasTraspaso(){
    if(!state.trabajadores || !state.trabajadores.directorDeportivo) return;
    if(state.correoUltimoEnviado && state.correoUltimoEnviado.directorDeportivo===state.jornadaActual) return;
    const jugador=(state.plantilla||[]).find(p=>p.enVenta && p.ventaResolverJornada<=state.jornadaActual);
    if(!jugador) return;
    const numOfertas=1+Math.floor(Math.random()*3);
    const clubesDisponibles=equiposDeLaLigaActual();
    if(typeof shuffle==='function') shuffle(clubesDisponibles); // shuffle() muta en el sitio, no devuelve nada
    const ofertas=clubesDisponibles.slice(0,numOfertas).map(c=>({
      club:c.name, monto:Math.round(jugador.overall*(280+Math.random()*220))
    })).sort((a,b)=>b.monto-a.monto);
    jugador.enVenta=false;
    jugador.ventaResolverJornada=null;
    const cuerpo = ofertas.length
      ? `Hemos tanteado el mercado con ${jugador.name} y han llegado ${ofertas.length} oferta${ofertas.length===1?'':'s'}. Elige cuál aceptar — si ninguna te convence, se queda en la plantilla.`
      : `No ha llegado ninguna oferta seria por ${jugador.name}. De momento sigue en la plantilla.`;
    if(!state.correoInterno) state.correoInterno=[];
    if(!state.correoUltimoEnviado) state.correoUltimoEnviado={};
    state.correoInterno.unshift({
      id:'mail'+Date.now()+Math.floor(Math.random()*100000), rol:'directorDeportivo',
      asunto: ofertas.length?`Ofertas por ${jugador.name}`:`Sin ofertas por ${jugador.name}`,
      cuerpo, jornada:state.jornadaActual, leido:false,
      tipoEspecial:'oferta_jugador', jugadorId:jugador.id, jugadorNombre:jugador.name, ofertas, resuelto:false
    });
    if(state.correoInterno.length>40) state.correoInterno=state.correoInterno.slice(0,40);
    state.correoUltimoEnviado.directorDeportivo=state.jornadaActual;
    guardarEstado();
  }
  function aceptarOfertaTraspaso(mailId, ofertaIdx){
    const mail=(state.correoInterno||[]).find(m=>m.id===mailId);
    if(!mail || mail.resuelto) return {ok:false};
    const jugador=(state.plantilla||[]).find(p=>p.id===mail.jugadorId);
    if(!jugador) return {ok:false, motivo:'Ese jugador ya no está en la plantilla'};
    const chequeo=puedeVenderJugador(jugador.id);
    if(!chequeo.ok) return chequeo;
    const oferta=mail.ofertas[ofertaIdx];
    if(!oferta) return {ok:false};
    state.plantilla=state.plantilla.filter(p=>p.id!==jugador.id);
    if(state.alineacion){ Object.keys(state.alineacion).forEach(k=>{ if(state.alineacion[k]===jugador.id) delete state.alineacion[k]; }); }
    state.capital=(state.capital||0)+oferta.monto;
    registrarMovimientoFinanciero('Traspaso de '+jugador.name+' a '+oferta.club, oferta.monto, state.jornadaActual);
    if(!state.directorDeportivoHistorial) state.directorDeportivoHistorial=[];
    state.directorDeportivoHistorial.unshift({tipo:'venta', nombre:jugador.name, position:jugador.position, overall:jugador.overall, destino:oferta.club, monto:oferta.monto, jornada:state.jornadaActual});
    if(typeof window.unlockLMAchievement==='function') window.unlockLMAchievement('lm_first_sale');
    mail.resuelto=true;
    mail.resultadoTexto=`Aceptaste la oferta de ${oferta.club} por ${formatoDinero(oferta.monto)}.`;
    guardarEstado();
    return {ok:true, oferta};
  }
  function rechazarOfertasTraspaso(mailId){
    const mail=(state.correoInterno||[]).find(m=>m.id===mailId);
    if(!mail || mail.resuelto) return;
    mail.resuelto=true;
    mail.resultadoTexto='Rechazaste todas las ofertas — el jugador sigue en la plantilla.';
    guardarEstado();
  }
  function aplicarEfectoDirectaDD(def){
    switch(def.id){
      case 'ojeo_urgente': {
        const nivelSobre=Math.max(1, nivelDeDD('sobresFichajes'));
        const jugadores=[1,2,3].map(()=>generarJugadorSobre(nivelSobre, posicionObjetivoOjeoActual()));
        return {texto:`Tu ojeador de urgencia trae un sobre de nivel ${nivelSobre} gratis`, sobreAbierto:jugadores};
      }
      case 'venta_jugador': {
        const peor=state.plantilla.length?[...state.plantilla].sort((a,b)=>a.overall-b.overall)[0]:null;
        if(!peor) return {texto:'No queda ningún jugador que vender'};
        const monto=Math.max(3000, Math.round(peor.overall*400));
        state.plantilla=state.plantilla.filter(p=>p.id!==peor.id);
        if(state.alineacion){ Object.keys(state.alineacion).forEach(k=>{ if(state.alineacion[k]===peor.id) delete state.alineacion[k]; }); }
        state.capital=(state.capital||0)+monto;
        registrarMovimientoFinanciero('Venta de '+peor.name, monto, state.jornadaActual);
        return {texto:`${peor.name} sale del club por ${formatoDinero(monto)}`};
      }
      case 'prestamo_breve': {
        const monto=15000+Math.round(Math.random()*6000);
        state.capital=(state.capital||0)+monto;
        registrarMovimientoFinanciero('Préstamo breve', monto, state.jornadaActual);
        return {texto:`Ingreso de ${formatoDinero(monto)}`};
      }
      case 'negociacion_salarial':
        state.directorDeportivoBonos=state.directorDeportivoBonos||{};
        state.directorDeportivoBonos.descuentoNomina=0.15;
        return {texto:'La nómina de jugadores del próximo mes será un 15% más barata'};
      case 'informe_ojeo':
        state.directorDeportivoBonos=state.directorDeportivoBonos||{};
        state.directorDeportivoBonos.bonusCalidadSobre=true;
        return {texto:'El próximo sobre que abras traerá jugadores de mejor calidad'};
      case 'gira_promocional': {
        const monto=10000+Math.round(Math.random()*4000);
        state.capital=(state.capital||0)+monto;
        state.moral=Math.max(-50,Math.min(50,(state.moral||0)+3));
        registrarMovimientoFinanciero('Gira promocional', monto, state.jornadaActual);
        return {texto:`Ingreso de ${formatoDinero(monto)} y un empujón a la moral`};
      }
      default: return {texto:'Aplicado'};
    }
  }
  function aplicarNivelMejoraDD(def){
    if(!state.directorDeportivoNiveles) state.directorDeportivoNiveles={calidadOjeo:0, ahorroSalarial:0, sobresFichajes:0, costeSobres:0};
    const nivelNuevo=Math.min(NIVEL_MAXIMO_EQUIPO, nivelDeDD(def.track)+1);
    state.directorDeportivoNiveles[def.track]=nivelNuevo;
    const maxAlcanzado=nivelNuevo>=NIVEL_MAXIMO_EQUIPO;
    if(maxAlcanzado){
      state.directorDeportivoCartasAgotadas=state.directorDeportivoCartasAgotadas||[];
      state.directorDeportivoCartasAgotadas.push(def.id);
    }
    let sobreAutomatico=null;
    if(def.track==='sobresFichajes' && maxAlcanzado){
      sobreAutomatico=[1,2,3].map(()=>generarJugadorSobre(3, posicionObjetivoOjeoActual()));
    }
    return {nivelNuevo, maxAlcanzado, sobreAutomatico};
  }
  function resolverCartaDD(idx, tiradas){
    const instancia=state.directorDeportivoCartas[idx];
    const def=cartaDefDD(instancia.cartaId);
    if(!def) return {tipo:'error', texto:'No se encontró la carta — prueba a cambiarla.'};
    const suma=tiradas.reduce((a,b)=>a+b,0);
    let resultado;
    if(def.tipo==='directa'){
      const dificultadEfectiva=Math.max(3, def.dificultad - bonusEstrellasTrabajador('directorDeportivo'));
      const exito=suma>=dificultadEfectiva;
      if(exito){
        const efecto=aplicarEfectoDirectaDD(def);
        state.directorDeportivoCartas[idx]=generarCartaAleatoriaDD(state.directorDeportivoCartas.map(c=>c.cartaId)) || instancia;
        resultado={tipo:'directa', exito:true, suma, dificultad:dificultadEfectiva, texto:efecto.texto, sobreAbierto:efecto.sobreAbierto||null};
      } else {
        resultado={tipo:'directa', exito:false, suma, dificultad:dificultadEfectiva, texto:'La carta se queda en tu mano — puedes reintentarlo más adelante'};
      }
    } else {
      const dificultadActual=dificultadActualNivelDD(def);
      const exito=suma>=dificultadActual;
      if(exito){
        const {nivelNuevo, maxAlcanzado, sobreAutomatico}=aplicarNivelMejoraDD(def);
        state.directorDeportivoCartas[idx]=generarCartaAleatoriaDD(state.directorDeportivoCartas.map(c=>c.cartaId)) || instancia;
        resultado={tipo:'nivel', exito:true, suma, dificultad:dificultadActual, nivelNuevo, maxAlcanzado, nombre:def.nombre, sobreAbierto:sobreAutomatico};
      } else {
        resultado={tipo:'nivel', exito:false, suma, dificultad:dificultadActual, nombre:def.nombre, texto:'La carta se queda en tu mano — puedes reintentarlo más adelante'};
      }
    }
    guardarEstado();
    return resultado;
  }

  /* ---------- 9g. CARTAS DEL PREPARADOR FÍSICO — mejora las estadísticas
     de los jugadores de formas originales: entrenamientos individuales
     que suben stats concretas de un jugador al azar de forma PERMANENTE,
     más 4 programas de nivel con bonus pasivo de equipo (resistencia,
     recuperación, técnica y ritmo). Mismo sistema de 10 cartas que el
     resto de departamentos. ---------- */
  const PREPARADOR_FISICO_CARTAS_BASE=[
    {id:'entrenamiento_tecnico', tipo:'directa', nombre:'Entrenamiento Técnico',   icon:'ph-target',        dificultad:6, desc:'+3 de TÉCNICA permanente a un jugador al azar de la plantilla'},
    {id:'entrenamiento_fisico',  tipo:'directa', nombre:'Entrenamiento Físico',    icon:'ph-person-simple-run', dificultad:6, desc:'+3 de RITMO permanente a un jugador al azar de la plantilla'},
    {id:'entrenamiento_tactico', tipo:'directa', nombre:'Entrenamiento de Pase',   icon:'ph-arrows-split',  dificultad:7, desc:'+3 de PASE permanente a un jugador al azar de la plantilla'},
    {id:'pretemporada_intensiva',tipo:'directa', nombre:'Pretemporada Intensiva', icon:'ph-barbell',       dificultad:9, desc:'+2 a TODAS las estadísticas de un jugador al azar, de forma permanente'},
    {id:'recuperacion_expres',   tipo:'directa', nombre:'Recuperación Exprés',    icon:'ph-battery-charging', dificultad:5, desc:'Restaura al instante la resistencia de toda la plantilla'},
    {id:'charla_motivacional',   tipo:'directa', nombre:'Charla Motivacional',    icon:'ph-megaphone-simple', dificultad:5, desc:'Pequeño impulso a la moral del equipo'},
    {id:'sesion_doble',          tipo:'directa', nombre:'Sesión Doble',           icon:'ph-calendar-plus',    dificultad:7, desc:'Mejora la probabilidad de progreso de los entrenos que elijas esta semana en el árbol'},
    {id:'resistencia_base',      tipo:'nivel', track:'resistenciaBase',    nombre:'Programa de Resistencia',   icon:'ph-heartbeat',         dificultadBase:8, dificultadPaso:4, desc:'Reduce la resistencia que se pierde al jugar cada partido'},
    {id:'recuperacion_semanal',  tipo:'nivel', track:'recuperacionSemanal',nombre:'Recuperación Semanal',      icon:'ph-clock-clockwise',   dificultadBase:8, dificultadPaso:4, desc:'Los días de descanso del calendario recuperan más resistencia'},
    {id:'potencial_tecnico',     tipo:'nivel', track:'potencialTecnico',   nombre:'Potencial Técnico',         icon:'ph-soccer-ball',       dificultadBase:8, dificultadPaso:4, desc:'Sube la TÉCNICA de todo el equipo de forma permanente'},
    {id:'potencial_fisico',      tipo:'nivel', track:'potencialFisico',    nombre:'Potencial Físico',          icon:'ph-lightning',         dificultadBase:8, dificultadPaso:4, desc:'Sube el RITMO de todo el equipo de forma permanente'},
    {id:'planificacion_semanal', tipo:'nivel', track:'planificacionSemanal',nombre:'Planificación Semanal',    icon:'ph-calendar-check',    dificultadBase:9, dificultadPaso:4, desc:'Cada día de entrenamiento marcado en el calendario rinde más'}
  ];
  function cartaDefPF(id){ return PREPARADOR_FISICO_CARTAS_BASE.find(c=>c.id===id); }
  function nivelDePF(track){ return (state.preparadorFisicoNiveles && state.preparadorFisicoNiveles[track]) || 0; }
  function dificultadActualNivelPF(def){ return Math.max(3, def.dificultadBase + nivelDePF(def.track)*def.dificultadPaso - bonusEstrellasTrabajador('preparadorFisico')); }
  function generarCartaAleatoriaPF(excluirIds){
    excluirIds=excluirIds||[];
    const agotadas=state.preparadorFisicoCartasAgotadas||[];
    const disponibles=PREPARADOR_FISICO_CARTAS_BASE.filter(c=>!excluirIds.includes(c.id) && !agotadas.includes(c.id));
    const pool=disponibles.length?disponibles:PREPARADOR_FISICO_CARTAS_BASE.filter(c=>!agotadas.includes(c.id));
    if(!pool.length) return null;
    const def=pool[Math.floor(Math.random()*pool.length)];
    return {cartaId:def.id, progreso:0, nivelActual:1};
  }
  function inicializarCartasPF(){
    const cartas=[];
    for(let i=0;i<3;i++){ const nueva=generarCartaAleatoriaPF(cartas.map(c=>c.cartaId)); if(nueva) cartas.push(nueva); }
    return cartas;
  }
  function cambiarCartaPF(idx){
    if((state.preparadorFisicoCambiosUsados||0)>=lmCambiosCartaPorPartido()) return false;
    const otras=state.preparadorFisicoCartas.filter((c,i)=>i!==idx).map(c=>c.cartaId);
    const nueva=generarCartaAleatoriaPF(otras);
    if(!nueva) return false;
    state.preparadorFisicoCartas[idx]=nueva;
    state.preparadorFisicoCambiosUsados=(state.preparadorFisicoCambiosUsados||0)+1;
    guardarEstado();
    return true;
  }
  // Entrena a un jugador al azar (no lesionado) subiéndole una estadística
  // de forma permanente — la "manera original" de mejorar jugadores que
  // se pidió, en vez de solo bonus de equipo.
  function entrenarJugadorAleatorio(campos, cantidad){
    const elegibles=(state.plantilla||[]).filter(p=>!p.injured);
    if(!elegibles.length) return null;
    const jugador=elegibles[Math.floor(Math.random()*elegibles.length)];
    campos.forEach(campo=>{ jugador[campo]=Math.min(99, Math.round(jugador[campo]+cantidad)); });
    if(!state.preparadorFisicoHistorial) state.preparadorFisicoHistorial=[];
    const NOMBRE_STAT={
      get attack(){return t('lm.stat_attack');}, get defense(){return t('lm.stat_defense');},
      get pace(){return t('lm.stat_pace');}, get passing(){return t('lm.stat_passing');}, get technique(){return t('lm.stat_technique');}
    };
    const detalle=campos.map(c=>NOMBRE_STAT[c]||c).join(', ');
    state.preparadorFisicoHistorial.unshift({id:'ent'+Date.now()+Math.floor(Math.random()*10000), jugador:jugador.name, detalle, cantidad, jornada:state.jornadaActual});
    if(state.preparadorFisicoHistorial.length>30) state.preparadorFisicoHistorial=state.preparadorFisicoHistorial.slice(0,30);
    return jugador;
  }
  function aplicarEfectoDirectaPF(def){
    switch(def.id){
      case 'entrenamiento_tecnico': {
        const j=entrenarJugadorAleatorio(['technique'],3);
        return j?{texto:`${j.name} mejora su técnica permanentemente (ahora ${j.technique})`}:{texto:'No hay jugadores disponibles para entrenar'};
      }
      case 'entrenamiento_fisico': {
        const j=entrenarJugadorAleatorio(['pace'],3);
        return j?{texto:`${j.name} mejora su ritmo permanentemente (ahora ${j.pace})`}:{texto:'No hay jugadores disponibles para entrenar'};
      }
      case 'entrenamiento_tactico': {
        const j=entrenarJugadorAleatorio(['passing'],3);
        return j?{texto:`${j.name} mejora su pase permanentemente (ahora ${j.passing})`}:{texto:'No hay jugadores disponibles para entrenar'};
      }
      case 'pretemporada_intensiva': {
        const j=entrenarJugadorAleatorio(['attack','defense','pace','passing','technique'],2);
        return j?{texto:`${j.name} completa una pretemporada excelente — mejora en todas sus estadísticas`}:{texto:'No hay jugadores disponibles para entrenar'};
      }
      case 'recuperacion_expres':
        (state.plantilla||[]).forEach(p=>{ p.fatigue=100; });
        return {texto:'Toda la plantilla recupera su resistencia al máximo'};
      case 'charla_motivacional':
        state.moral=Math.max(-50,Math.min(50,(state.moral||0)+4));
        return {texto:'El vestuario responde bien a la charla — sube la moral'};
      case 'sesion_doble': {
        // Ya no puede marcar un día de entreno directamente en el
        // calendario — eso ahora es cosa exclusiva del árbol de
        // nodos. En su lugar, potencia la probabilidad de mejora de
        // los entrenos que el jugador SÍ elija esta semana (mismo
        // sistema que ya usa el hito de 5 entrenos acumulados).
        if(!state.nodosBanderasPendientes) state.nodosBanderasPendientes={};
        state.nodosBanderasPendientes.boostEntrenoSemana=true;
        return {texto:'Los entrenos que elijas esta semana tendrán mejor probabilidad de mejora'};
      }
      default: return {texto:'Aplicado'};
    }
  }
  function aplicarNivelMejoraPF(def){
    if(!state.preparadorFisicoNiveles) state.preparadorFisicoNiveles={resistenciaBase:0, recuperacionSemanal:0, potencialTecnico:0, potencialFisico:0, planificacionSemanal:0};
    const nivelNuevo=Math.min(NIVEL_MAXIMO_EQUIPO, nivelDePF(def.track)+1);
    state.preparadorFisicoNiveles[def.track]=nivelNuevo;
    const maxAlcanzado=nivelNuevo>=NIVEL_MAXIMO_EQUIPO;
    if(maxAlcanzado){
      state.preparadorFisicoCartasAgotadas=state.preparadorFisicoCartasAgotadas||[];
      state.preparadorFisicoCartasAgotadas.push(def.id);
    }
    return {nivelNuevo, maxAlcanzado};
  }
  function resolverCartaPF(idx, tiradas){
    const instancia=state.preparadorFisicoCartas[idx];
    const def=cartaDefPF(instancia.cartaId);
    if(!def) return {tipo:'error', texto:'No se encontró la carta — prueba a cambiarla.'};
    const suma=tiradas.reduce((a,b)=>a+b,0);
    let resultado;
    if(def.tipo==='directa'){
      const dificultadEfectiva=Math.max(3, def.dificultad - bonusEstrellasTrabajador('preparadorFisico'));
      const exito=suma>=dificultadEfectiva;
      if(exito){
        const efecto=aplicarEfectoDirectaPF(def);
        state.preparadorFisicoCartas[idx]=generarCartaAleatoriaPF(state.preparadorFisicoCartas.map(c=>c.cartaId)) || instancia;
        resultado={tipo:'directa', exito:true, suma, dificultad:dificultadEfectiva, texto:efecto.texto};
      } else {
        resultado={tipo:'directa', exito:false, suma, dificultad:dificultadEfectiva, texto:'La carta se queda en tu mano — puedes reintentarlo más adelante'};
      }
    } else {
      const dificultadActual=dificultadActualNivelPF(def);
      const exito=suma>=dificultadActual;
      if(exito){
        const {nivelNuevo, maxAlcanzado}=aplicarNivelMejoraPF(def);
        state.preparadorFisicoCartas[idx]=generarCartaAleatoriaPF(state.preparadorFisicoCartas.map(c=>c.cartaId)) || instancia;
        resultado={tipo:'nivel', exito:true, suma, dificultad:dificultadActual, nivelNuevo, maxAlcanzado, nombre:def.nombre};
      } else {
        resultado={tipo:'nivel', exito:false, suma, dificultad:dificultadActual, nombre:def.nombre, texto:'La carta se queda en tu mano — puedes reintentarlo más adelante'};
      }
    }
    guardarEstado();
    return resultado;
  }

  /* ---------- 10. Abandonar la liga ---------- */
  function abandonarLiga(){
    function proceder(){
      borrarEstado();
      state=nuevoEstadoSinEmpezar();
      setupStep=1;
      setupData={liga:'es', moneda:null, nombre:'', escudo:null, modo:null, equipoElegidoId:null};
      document.body.classList.remove('liga-manager-screen');
      document.body.classList.add('menu-screen');
    }
    if(typeof window.showConfirmPopup==='function'){
      window.showConfirmPopup(t('lm.confirmar_abandonar_liga'), proceder, t('lm.abandonar_btn'));
    } else if(confirm(t('lm.confirmar_abandonar_liga'))){
      proceder();
    }
  }

  /* ---------- 10.5 Liga Personalizada: pantalla de importación ---------- */
  function renderLigaPersonalizadaScreen(){
    const equipos=(window.G2G_LigaPersonalizada?window.G2G_LigaPersonalizada.getEquipos():[])||[];
    const faltantes=(window.G2G_LigaPersonalizada?window.G2G_LigaPersonalizada.faltanEscudos():[])||[];
    // El generador de calendario ya soporta cualquier número de
    // equipos, par o impar (con rotación de descansos automática si
    // es impar) — solo hace falta que haya al menos 2, para que
    // exista algún rival contra quien jugar.
    const pocosEquipos=equipos.length>0 && equipos.length<2;
    const tieneEquipos=equipos.length>=2;
    const importacionCompleta=tieneEquipos && faltantes.length===0;
    const usuarioLogueado=!!(window._fbAuth && window._fbAuth.currentUser);

    function bloqueError(titulo, problema, sugerencia){
      return `
        <div class="lm-lp-error-item">
          <i class="ph ph-bold ph-warning-circle"></i>
          <div>
            <div class="lm-lp-error-titulo">${titulo}</div>
            <div class="lm-lp-error-problema">${problema}</div>
            ${sugerencia?`<div class="lm-lp-error-sugerencia"><i class="ph ph-bold ph-lightbulb"></i> ${sugerencia}</div>`:''}
          </div>
        </div>`;
    }
    const erroresExcelHTML=lpEstado.erroresExcel.map(e=>bloqueError(
      e.equipo?`${e.equipo}${e.fila?` — ${t('lm.fila')} ${e.fila}`:''}${e.campo?` (${e.campo})`:''}`:'Excel',
      e.problema, e.sugerencia,
    )).join('');
    const erroresEscudosHTML=lpEstado.erroresEscudos.map(e=>bloqueError(e.nombre||t('lm.escudo_generico'), e.problema, e.sugerencia)).join('');
    const errorPocosHTML=pocosEquipos?bloqueError('Excel', t('lm.lp_pocos_equipos'), t('lm.lp_pocos_equipos_sugerencia')):'';
    const errorGuardarHTML=lpEstado.errorGuardar?bloqueError(t('lm.lp_guardar_titulo'), lpEstado.errorGuardar, null):'';
    const hayErrores=lpEstado.erroresExcel.length || lpEstado.erroresEscudos.length || pocosEquipos || lpEstado.errorGuardar;

    const estadoHTML=tieneEquipos?`
      <div class="lm-lp-estado ${faltantes.length?'lm-lp-estado-aviso':'lm-lp-estado-ok'}">
        <i class="ph ph-bold ${faltantes.length?'ph-warning-circle':'ph-check-circle'}"></i>
        ${t('lm.lp_equipos_importados', equipos.length)}${faltantes.length?` — ${t('lm.lp_faltan_escudos', faltantes.length)}: ${faltantes.join('.png, ')}.png`:` — ${t('lm.lp_todos_escudos_ok')}`}
      </div>`:'';

    // Guardar esta configuración en la nube — solo cuando el Excel Y
    // los escudos están del todo completos, y solo si hay sesión
    // iniciada (es un guardado ligado a la cuenta, no tendría sentido
    // sin usuario). Los escudos NUNCA se suben aquí, se avisa de ello
    // con toda claridad.
    let guardarHTML='';
    if(importacionCompleta){
      if(!usuarioLogueado){
        guardarHTML=`
          <div class="lm-lp-guardar-box">
            <div class="lm-lp-guardar-titulo"><i class="ph ph-bold ph-cloud-slash"></i> ${t('lm.lp_guardar_titulo')}</div>
            <div class="lm-aforo-nota">${t('lm.lp_guardar_sin_sesion')}</div>
          </div>`;
      } else if(lpMostrarFormularioGuardar){
        guardarHTML=`
          <div class="lm-lp-guardar-box">
            <div class="lm-lp-guardar-titulo"><i class="ph ph-bold ph-cloud-arrow-up"></i> ${t('lm.lp_guardar_titulo')}</div>
            <input type="text" id="lmLpNombreConfig" class="lm-setup-input" maxlength="40" placeholder="${t('lm.lp_guardar_placeholder')}">
            <div class="lm-aforo-nota">${t('lm.lp_guardar_nota_escudos')}</div>
            <div class="lm-lp-botones" style="margin-top:8px">
              <button id="lmLpGuardarConfirmar" class="mode-card-btn mode-card-btn-gold" ${lpGuardando?'disabled':''}><i class="ph ph-bold ph-floppy-disk"></i> ${lpGuardando?t('lm.lp_guardando'):t('lm.lp_guardar_confirmar')}</button>
              <button id="lmLpGuardarCancelar" class="mode-card-btn mode-card-btn-secondary">${t('lm.cancelar')}</button>
            </div>
          </div>`;
      } else {
        guardarHTML=`
          <button type="button" id="lmLpGuardarAbrir" class="mode-card-btn mode-card-btn-secondary" style="width:100%;margin-bottom:12px">
            <i class="ph ph-bold ph-cloud-arrow-up"></i> ${t('lm.lp_guardar_titulo')}
          </button>`;
      }
    }

    // Lista de configuraciones ya guardadas — se consulta a Firestore
    // de forma asíncrona la primera vez que se entra en esta pantalla
    // (ver wireLigaPersonalizadaScreen), así que mientras no ha
    // llegado la respuesta (lpConfiguraciones===null) simplemente no
    // se muestra nada todavía, sin bloquear el resto de la pantalla.
    let guardadasHTML='';
    if(usuarioLogueado && Array.isArray(lpConfiguraciones)){
      guardadasHTML=`
        <div class="lm-lp-guardadas-box">
          <div class="lm-lp-guardar-titulo"><i class="ph ph-bold ph-folder-open"></i> ${t('lm.lp_mis_ligas_guardadas')} (${lpConfiguraciones.length}/${window.G2G_LigaPersonalizada.MAX_CONFIGURACIONES_GUARDADAS})</div>
          ${lpConfiguraciones.length?lpConfiguraciones.map(c=>`
            <div class="lm-lp-guardada-item">
              <div class="lm-lp-guardada-info">
                <span class="lm-lp-guardada-nombre">${c.nombre}</span>
                <span class="lm-lp-guardada-detalle">${tp('lm.lp_guardada_detalle', {n:c.numEquipos})}</span>
              </div>
              <button type="button" class="lm-lp-guardada-cargar" data-cargar-config="${c.id}" title="${t('lm.lp_cargar')}"><i class="ph ph-bold ph-download-simple"></i></button>
              <button type="button" class="lm-lp-guardada-borrar" data-borrar-config="${c.id}" title="${t('lm.borrar')}"><i class="ph ph-bold ph-trash"></i></button>
            </div>`).join(''):`<div class="lm-aforo-nota">${t('lm.lp_sin_guardadas')}</div>`}
        </div>`;
    }

    return `
      <div class="lm-setup-title">${t('lm.liga_personalizada')}</div>
      <p class="lm-setup-desc">${t('lm.liga_personalizada_desc')}</p>
      <a href="assets/templates/Goal2Goat_Custom_League_Base.xlsx" download class="lm-lp-descarga">
        <i class="ph ph-bold ph-file-arrow-down"></i> ${t('lm.descargar_plantilla')}
      </a>
      ${guardadasHTML}
      ${estadoHTML}
      <div class="lm-lp-botones">
        <button id="lmLpImportarEquipos" class="mode-card-btn mode-card-btn-secondary"><i class="ph ph-bold ph-file-xls"></i> ${t('lm.importar_equipos')}</button>
        <button id="lmLpImportarEscudos" class="mode-card-btn mode-card-btn-secondary" ${tieneEquipos?'':'disabled'}><i class="ph ph-bold ph-image"></i> ${t('lm.importar_escudos')}</button>
      </div>
      ${guardarHTML}
      ${hayErrores?`<div class="lm-lp-errores">${errorPocosHTML}${erroresExcelHTML}${erroresEscudosHTML}${errorGuardarHTML}</div>`:''}
      <input type="file" id="lmLpFileExcel" accept=".xlsx" style="display:none">
      <input type="file" id="lmLpFileEscudos" accept=".png" multiple style="display:none">
      <div class="lm-popup-actions">
        <button id="lmSetupNext" class="mode-card-btn mode-card-btn-gold" ${tieneEquipos?'':'disabled'}>${t('lm.continuar')}</button>
      </div>
      <div class="lm-popup-actions" style="margin-top:8px"><button id="lmSetupAtras" class="mode-card-btn mode-card-btn-secondary">${t('lm.atras')}</button></div>
    `;
  }

  function wireLigaPersonalizadaScreen(root){
    const btnExcel=document.getElementById('lmLpImportarEquipos');
    const inputExcel=document.getElementById('lmLpFileExcel');
    if(btnExcel && inputExcel && !btnExcel.dataset.wired){
      btnExcel.dataset.wired='1';
      btnExcel.addEventListener('click', ()=>{ if(typeof window.playSound==='function') window.playSound('select'); inputExcel.click(); });
      inputExcel.addEventListener('change', async ()=>{
        const file=inputExcel.files[0];
        if(!file) return;
        btnExcel.disabled=true;
        const resultado=await window.G2G_LigaPersonalizada.importarExcel(file);
        lpEstado.erroresExcel=resultado.errores||[];
        if(resultado.ok && resultado.equipos){
          window.G2G_LigaPersonalizada.setEquipos(resultado.equipos);
        }
        inputExcel.value='';
        renderSetup();
      });
    }
    const btnEscudos=document.getElementById('lmLpImportarEscudos');
    const inputEscudos=document.getElementById('lmLpFileEscudos');
    if(btnEscudos && inputEscudos && !btnEscudos.dataset.wired){
      btnEscudos.dataset.wired='1';
      btnEscudos.addEventListener('click', ()=>{ if(typeof window.playSound==='function') window.playSound('select'); inputEscudos.click(); });
      inputEscudos.addEventListener('change', async ()=>{
        if(!inputEscudos.files.length) return;
        btnEscudos.disabled=true;
        const resultado=await window.G2G_LigaPersonalizada.importarEscudos(inputEscudos.files);
        lpEstado.erroresEscudos=resultado.errores||[];
        inputEscudos.value='';
        renderSetup();
      });
    }
    // Carga inicial (solo una vez por entrada a esta pantalla) de las
    // configuraciones ya guardadas en la nube, para poder mostrarlas.
    // Se dispara sola en segundo plano; en cuanto llega la respuesta
    // se vuelve a renderizar para mostrarlas.
    if(lpConfiguraciones===null && window._fbAuth && window._fbAuth.currentUser && window.G2G_LigaPersonalizada){
      lpConfiguraciones=[]; // evita relanzar la consulta mientras está en vuelo
      window.G2G_LigaPersonalizada.listarConfiguracionesGuardadas().then(lista=>{
        lpConfiguraciones=lista;
        if(setupStep===1.5) renderSetup();
      });
    }
    const btnGuardarAbrir=document.getElementById('lmLpGuardarAbrir');
    if(btnGuardarAbrir) btnGuardarAbrir.addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      lpMostrarFormularioGuardar=true;
      lpEstado.errorGuardar=null;
      renderSetup();
    });
    const btnGuardarCancelar=document.getElementById('lmLpGuardarCancelar');
    if(btnGuardarCancelar) btnGuardarCancelar.addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      lpMostrarFormularioGuardar=false;
      lpEstado.errorGuardar=null;
      renderSetup();
    });
    const btnGuardarConfirmar=document.getElementById('lmLpGuardarConfirmar');
    if(btnGuardarConfirmar) btnGuardarConfirmar.addEventListener('click', async ()=>{
      const input=document.getElementById('lmLpNombreConfig');
      const nombre=input?input.value:'';
      if(typeof window.playSound==='function') window.playSound('select');
      lpGuardando=true;
      lpEstado.errorGuardar=null;
      renderSetup();
      const resultado=await window.G2G_LigaPersonalizada.guardarConfiguracion(nombre);
      lpGuardando=false;
      if(resultado.ok){
        lpMostrarFormularioGuardar=false;
        lpConfiguraciones=await window.G2G_LigaPersonalizada.listarConfiguracionesGuardadas();
        if(typeof window.playSound==='function') window.playSound('reveal');
      } else {
        lpEstado.errorGuardar=resultado.error;
      }
      renderSetup();
    });
    root.querySelectorAll('[data-cargar-config]').forEach(btn=>{
      btn.addEventListener('click', async ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        const id=btn.getAttribute('data-cargar-config');
        const resultado=await window.G2G_LigaPersonalizada.cargarConfiguracionGuardada(id);
        if(resultado.ok){
          lpEstado={erroresExcel:[], erroresEscudos:[]};
          renderSetup();
        }
      });
    });
    root.querySelectorAll('[data-borrar-config]').forEach(btn=>{
      btn.addEventListener('click', async ()=>{
        const id=btn.getAttribute('data-borrar-config');
        if(typeof window.showConfirmPopup==='function'){
          window.showConfirmPopup(t('lm.lp_confirmar_borrar'), async ()=>{
            if(typeof window.playSound==='function') window.playSound('select');
            await window.G2G_LigaPersonalizada.borrarConfiguracionGuardada(id);
            lpConfiguraciones=await window.G2G_LigaPersonalizada.listarConfiguracionesGuardadas();
            renderSetup();
          }, t('lm.borrar'));
        } else if(confirm(t('lm.lp_confirmar_borrar'))){
          await window.G2G_LigaPersonalizada.borrarConfiguracionGuardada(id);
          lpConfiguraciones=await window.G2G_LigaPersonalizada.listarConfiguracionesGuardadas();
          renderSetup();
        }
      });
    });
    const next=document.getElementById('lmSetupNext');
    if(next) next.addEventListener('click', ()=>{
      if(!window.G2G_LigaPersonalizada.getEquipos().length) return;
      if(typeof window.playSound==='function') window.playSound('select');
      setupStep=2;
      renderSetup();
    });
    const atras=document.getElementById('lmSetupAtras');
    if(atras) atras.addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      setupStep=1;
      renderSetup();
    });
  }

  /* ---------- 11. Render: flujo de entrada (liga → moneda → nombre → escudo) ---------- */
  function renderSetup(){
    const root=document.getElementById('ligaManagerScreen');
    let inner='';

    if(setupStep===1){
      inner=`
        <div class="lm-setup-title">${t('lm.elige_liga')}</div>
        <div class="lm-setup-list">
          <div class="lm-setup-option active" data-liga="custom">
            <i class="ph ph-bold ph-sliders-horizontal" style="width:22px;text-align:center;vertical-align:middle;margin-right:10px;color:var(--gold)"></i>${t('lm.liga_personalizada')}
          </div>
          <div class="lm-setup-option active" data-liga="aleatoria">
            <i class="ph ph-bold ph-shuffle" style="width:22px;text-align:center;vertical-align:middle;margin-right:10px;color:var(--gold)"></i>${t('lm.liga_aleatoria')}
          </div>
          ${LIGAS_DISPONIBLES.filter(l=>l.activa).map(l=>`
            <div class="lm-setup-option active selected" data-liga="${l.id}">
              <img src="${l.flagImg}" alt="" style="width:22px;height:16px;object-fit:cover;border-radius:2px;vertical-align:middle;margin-right:10px">${l.nombre}
            </div>`).join('')}
        </div>
        <div class="lm-popup-actions"><button id="lmSetupNext" class="mode-card-btn mode-card-btn-gold">${t('lm.siguiente')}</button></div>
      `;
    } else if(setupStep===1.5){
      inner=renderLigaPersonalizadaScreen();
    } else if(setupStep===2){
      inner=`
        <div class="lm-setup-title">${t('lm.elige_moneda')}</div>
        <div class="lm-setup-list lm-setup-list-row">
          ${Object.keys(MONEDAS).map(k=>`
            <div class="lm-setup-option lm-setup-option-currency ${setupData.moneda===k?'selected':''}" data-moneda="${k}">
              <span style="font-size:22px">${MONEDAS[k].symbol}</span><br>${MONEDAS[k].label}
            </div>`).join('')}
        </div>
        <div class="lm-popup-actions"><button id="lmSetupNext" class="mode-card-btn mode-card-btn-gold" ${setupData.moneda?'':'disabled'}>${t('lm.siguiente')}</button></div>
      `;
    } else if(setupStep===2.5){
      inner=`
        <div class="lm-setup-title">${t('lm.como_empezar')}</div>
        <div class="lm-setup-list">
          <div class="lm-setup-option ${setupData.modo==='propio'?'selected':''}" data-modo="propio">
            <i class="ph ph-bold ph-shield-plus" style="margin-right:10px;color:var(--gold)"></i>${t('lm.crear_equipo_propio')}
          </div>
          <div class="lm-setup-option ${setupData.modo==='existente'?'selected':''}" data-modo="existente">
            <i class="ph ph-bold ph-users-three" style="margin-right:10px;color:var(--gold)"></i>${t('lm.elegir_equipo_existente')}
          </div>
        </div>
        <p class="lm-setup-desc">${t('lm.como_empezar_desc')}</p>
        ${setupData.modo==='propio'?`
          <div class="lm-modo-dificil-aviso">
            <div class="lm-modo-dificil-titulo"><i class="ph ph-bold ph-fire"></i> ${t('lm.modo_dificil_titulo')}</div>
            <div class="lm-modo-dificil-texto">${t('lm.modo_dificil_texto')}</div>
          </div>`:''}
        <div class="lm-popup-actions"><button id="lmSetupNext" class="mode-card-btn mode-card-btn-gold" ${setupData.modo?'':'disabled'}>${t('lm.siguiente')}</button></div>
      `;
    } else if(setupStep===2.6){
      const esCustomListaEquipos=setupData.liga==='custom';
      const listaEquiposElegir=esCustomListaEquipos
        ? (window.G2G_LigaPersonalizada.getEquipos()||[]).map(e=>({id:e.key, name:e.displayName, crestImg:window.G2G_LigaPersonalizada.getCrest(e.key)}))
        : LM_RIVALS;
      inner=`
        <div class="lm-setup-title">${t('lm.elige_tu_equipo')}</div>
        <p class="lm-setup-desc">${t('lm.elige_tu_equipo_desc')}</p>
        <div class="lm-setup-list lm-setup-equipos-list">
          ${listaEquiposElegir.map(r=>`
            <div class="lm-setup-option lm-setup-option-equipo ${setupData.equipoElegidoId===r.id?'selected':''}" data-equipo="${r.id}">
              ${rivalCrestHTML(44, r.crestImg)}<span>${r.name}</span>
            </div>`).join('')}
        </div>
        <div class="lm-popup-actions"><button id="lmSetupNext" class="mode-card-btn mode-card-btn-gold" ${setupData.equipoElegidoId?'':'disabled'}>${t('lm.empezar_temporada')}</button></div>
        <div class="lm-popup-actions" style="margin-top:8px"><button id="lmSetupAtras" class="mode-card-btn mode-card-btn-secondary">${t('lm.atras')}</button></div>
      `;
    } else if(setupStep===3.5){
      inner=`
        <div class="lm-setup-title">${t('lm.club_ya_creado')}</div>
        <p class="lm-setup-desc">${t('lm.club_ya_creado_desc')}</p>
        <div class="lm-crest-preview">${crestHTML(setupData.escudo, 64)}</div>
        <div class="lm-setup-title" style="font-size:16px;margin:6px 0 22px">${setupData.nombre}</div>
        <div class="lm-popup-actions">
          <button id="lmSetupConfirm" class="mode-card-btn mode-card-btn-gold">${t('lm.empezar_temporada')}</button>
          <button id="lmSetupCambiar" class="mode-card-btn mode-card-btn-secondary">${t('lm.cambiar_nombre_escudo')}</button>
        </div>
      `;
    } else if(setupStep===3){
      inner=`
        <div class="lm-setup-title">${t('lm.nombre_de_tu_equipo')}</div>
        <p class="lm-setup-desc">${t('lm.nombre_de_tu_equipo_desc')}</p>
        <input id="lmSetupNombre" type="text" maxlength="24" placeholder="${t('lm.nombre_placeholder')}" class="lm-setup-input" value="${setupData.nombre||''}">
        <div class="lm-popup-actions"><button id="lmSetupNext" class="mode-card-btn mode-card-btn-gold" ${setupData.nombre&&setupData.nombre.trim()?'':'disabled'}>${t('lm.siguiente')}</button></div>
      `;
    } else if(setupStep===4){
      inner=`
        <div class="lm-setup-title">${t('lm.crea_tu_escudo')}</div>
        <p class="lm-setup-desc">${t('lm.crea_tu_escudo_desc')}</p>
        <div class="lm-crest-preview">${crestHTML(setupData.escudo, 64)}</div>
        <div class="lm-popup-actions"><button id="lmAbrirEditorBtn" class="mode-card-btn mode-card-btn-gold">${t('lm.abrir_editor_escudos')}</button></div>
        <div class="lm-popup-actions">
          <button id="lmSetupConfirm" class="mode-card-btn mode-card-btn-gold" ${setupData.escudo?'':'disabled'}>${t('lm.empezar_temporada')}</button>
        </div>
      `;
    }

    root.innerHTML = `
      <div class="lm-wrap">
        <div class="lm-setup-card">
          <div class="lm-setup-header">${t('lm.setup_header')}</div>
          ${inner}
        </div>
      </div>`;

    if(setupStep===1){
      root.querySelectorAll('[data-liga].active').forEach(el=>{
        el.addEventListener('click', ()=>{
          setupData.liga=el.getAttribute('data-liga');
          if(typeof window.playSound==='function') window.playSound('select');
          root.querySelectorAll('[data-liga]').forEach(o=>o.classList.remove('selected'));
          el.classList.add('selected');
        });
      });
      const next=document.getElementById('lmSetupNext');
      if(next) next.addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        if(setupData.liga==='aleatoria'){
          // La Liga Aleatoria se genera entera de golpe aquí mismo (sin
          // pantalla de importación, no hay nada que subir) y a partir
          // de este punto se trata exactamente igual que una Liga
          // Personalizada ya importada — mismo motor por debajo, así
          // que no hace falta tocar ningún otro punto del código que
          // ya sabe manejar "custom".
          if(typeof window.playSound==='function') window.playSound('reveal');
          generarLigaAleatoria(20);
          setupData.liga='custom';
          setupStep=2;
        } else {
          setupStep = setupData.liga==='custom' ? 1.5 : 2;
        }
        renderSetup();
      });
    } else if(setupStep===1.5){
      wireLigaPersonalizadaScreen(root);
    } else if(setupStep===2){
      root.querySelectorAll('[data-moneda]').forEach(el=>{
        el.addEventListener('click', ()=>{
          setupData.moneda=el.getAttribute('data-moneda');
          if(typeof window.playSound==='function') window.playSound('select');
          renderSetup();
        });
      });
      const next=document.getElementById('lmSetupNext');
      if(next) next.addEventListener('click', ()=>{
        if(!setupData.moneda) return;
        if(typeof window.playSound==='function') window.playSound('select');
        setupStep=2.5;
        renderSetup();
      });
    } else if(setupStep===2.5){
      root.querySelectorAll('[data-modo]').forEach(el=>{
        el.addEventListener('click', ()=>{
          setupData.modo=el.getAttribute('data-modo');
          if(typeof window.playSound==='function') window.playSound('select');
          renderSetup();
        });
      });
      const next=document.getElementById('lmSetupNext');
      if(next) next.addEventListener('click', ()=>{
        if(!setupData.modo) return;
        if(typeof window.playSound==='function') window.playSound('select');
        if(setupData.modo==='existente'){
          setupStep=2.6;
          renderSetup();
          return;
        }
        // Crear equipo propio — mismo flujo de siempre (identidad
        // guardada, o nombre + escudo desde cero).
        const identidad=identidadPorDefecto();
        if(identidad && identidad.nombre && identidad.crest){
          setupData.nombre=identidad.nombre;
          setupData.escudo=identidad.crest;
          setupStep=3.5;
        }else{
          setupStep=3;
        }
        renderSetup();
      });
    } else if(setupStep===2.6){
      root.querySelectorAll('[data-equipo]').forEach(el=>{
        el.addEventListener('click', ()=>{
          setupData.equipoElegidoId=el.getAttribute('data-equipo');
          if(typeof window.playSound==='function') window.playSound('select');
          // FIX real del salto de scroll: en vez de volver a construir
          // todo el HTML de la pantalla (innerHTML=...), que siempre
          // reinicia el scroll al recrear el contenido, se cambia la
          // clase "selected" directamente sobre los elementos que ya
          // existen en el DOM — cero repintado, cero salto posible.
          root.querySelectorAll('[data-equipo].selected').forEach(s=>s.classList.remove('selected'));
          el.classList.add('selected');
          const nextBtn=document.getElementById('lmSetupNext');
          if(nextBtn) nextBtn.disabled=false;
        });
      });
      const next=document.getElementById('lmSetupNext');
      if(next) next.addEventListener('click', ()=>{
        if(!setupData.equipoElegidoId) return;
        if(typeof window.playSound==='function') window.playSound('select');
        const esCustomElegir=setupData.liga==='custom';
        const equipo=esCustomElegir
          ? (()=>{ const e=(window.G2G_LigaPersonalizada.getEquipos()||[]).find(x=>x.key===setupData.equipoElegidoId); return e?{name:e.displayName, id:e.key, crestImg:window.G2G_LigaPersonalizada.getCrest(e.key)}:null; })()
          : LM_RIVALS.find(r=>r.id===setupData.equipoElegidoId);
        if(!equipo) return;
        const escudo={type:'image', data:equipo.crestImg};
        empezarTemporada(equipo.name, setupData.moneda, setupData.liga, escudo, equipo.id);
        render();
      });
      const atras=document.getElementById('lmSetupAtras');
      if(atras) atras.addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        setupStep=2.5;
        renderSetup();
      });
    } else if(setupStep===3.5){
      const confirmBtn=document.getElementById('lmSetupConfirm');
      if(confirmBtn) confirmBtn.addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        guardarIdentidad(setupData.nombre, setupData.escudo);
        empezarTemporada(setupData.nombre, setupData.moneda, setupData.liga, setupData.escudo);
        render();
      });
      const cambiarBtn=document.getElementById('lmSetupCambiar');
      if(cambiarBtn) cambiarBtn.addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        setupData.nombre=''; setupData.escudo=null;
        setupStep=3; renderSetup();
      });
    } else if(setupStep===3){
      const input=document.getElementById('lmSetupNombre');
      const next=document.getElementById('lmSetupNext');
      if(input) input.addEventListener('input', ()=>{
        setupData.nombre=input.value;
        if(next) next.disabled = !input.value.trim();
      });
      if(next) next.addEventListener('click', ()=>{
        if(!setupData.nombre || !setupData.nombre.trim()) return;
        if(typeof window.playSound==='function') window.playSound('select');
        setupStep=4; renderSetup();
      });
    } else if(setupStep===4){
      const abrirBtn=document.getElementById('lmAbrirEditorBtn');
      if(abrirBtn) abrirBtn.addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        openLigaManagerCrestEditor(setupData.nombre, setupData.escudo, function(crest){
          setupData.escudo=crest;
          renderSetup();
        });
      });
      const confirmBtn=document.getElementById('lmSetupConfirm');
      if(confirmBtn) confirmBtn.addEventListener('click', ()=>{
        if(!setupData.escudo) return;
        if(typeof window.playSound==='function') window.playSound('select');
        guardarIdentidad(setupData.nombre.trim(), setupData.escudo);
        empezarTemporada(setupData.nombre.trim(), setupData.moneda, setupData.liga, setupData.escudo);
        render();
      });
    }
  }

  /* ---------- 12. Render: hub principal (una vez empezada la temporada) ---------- */
  function renderInner(){
    const root=document.getElementById('ligaManagerScreen');
    if(!root) return;

    if(!state || !state.setupComplete){
      renderSetup();
      return;
    }
    // Quiebra declarada a mitad de temporada por insolvencia grave
    // sostenida (ver comprobarInsolvenciaGrave()) — se reutiliza el
    // mismo popup de resumen de temporada que ya sabe mostrar el
    // veredicto de "fin de partida por números rojos" y cerrar la
    // partida correctamente, en vez de construir una pantalla nueva
    // aparte solo para esto. Se comprueba que no esté ya abierto para
    // no acabar apilando el mismo aviso varias veces.
    if(state.quiebraDeclarada && !document.getElementById('lmResumenTemporadaOverlay')){
      mostrarResumenTemporada();
      return;
    }
    // Red de seguridad: si el estado guardado viene de una versión anterior
    // y le faltan campos nuevos, se rellenan con valores por defecto en vez
    // de dejar que el render entero se rompa (pantalla en negro).
    if(!state.formacionCategoria || !FORMATION_CODES[state.formacionCategoria]) state.formacionCategoria='equilibrada';
    if(!state.formacionCode) state.formacionCode='4-3-3';
    if(!state.alineacion) state.alineacion={};
    if(!state.medicoCartas || !state.medicoCartas.length) state.medicoCartas=inicializarCartasMedico();
    if(!state.medicoBonos) state.medicoBonos={};
    if(!state.medicoCartasAgotadas) state.medicoCartasAgotadas=[];
    if(!state.medicoHistorial) state.medicoHistorial=[];
    if(!state.medicoNiveles) state.medicoNiveles={curacionMuscular:0, curacionOsea:0, prevencionMuscular:0, prevencionOsea:0};
    if(!state.estadio) state.estadio={campo:90, satisfaccion:10, aforoTotal:12000, ultimaAsistencia:null};
    if(state.estadio.aforoTotal===undefined) state.estadio.aforoTotal=12000;
    if(state.estadio.ultimaAsistencia===undefined) state.estadio.ultimaAsistencia=null;
    if(state.moral===undefined) state.moral=0;
    if(state.rachaResultados===undefined) state.rachaResultados=0;
    if(state.capital===undefined) state.capital=400000;
    if(state.precioEntrada===undefined) state.precioEntrada=15;
    if(state.mesesPagados===undefined) state.mesesPagados=0;
    if(!state.finanzasHistorial) state.finanzasHistorial=[];
    if(!state.directorGeneralCartas || !state.directorGeneralCartas.length) state.directorGeneralCartas=inicializarCartasDG();
    if(!state.directorGeneralCartasAgotadas) state.directorGeneralCartasAgotadas=[];
    if(!state.directorGeneralHistorial) state.directorGeneralHistorial=[];
    if(!state.directorGeneralNiveles) state.directorGeneralNiveles={aforoExtra:0, ingresoPatrocinio:0, ingresoMerchandising:0, toleranciaPrecio:0};
    if(!state.directorGeneralBonos) state.directorGeneralBonos={};
    if(!state.directorDeportivoCartas || !state.directorDeportivoCartas.length) state.directorDeportivoCartas=inicializarCartasDD();
    if(!state.directorDeportivoCartasAgotadas) state.directorDeportivoCartasAgotadas=[];
    if(!state.directorDeportivoHistorial) state.directorDeportivoHistorial=[];
    if(!state.directorDeportivoNiveles) state.directorDeportivoNiveles={calidadOjeo:0, ahorroSalarial:0, sobresFichajes:0, costeSobres:0};
    if(!state.directorDeportivoBonos) state.directorDeportivoBonos={};
    if(!state.trabajadores){
      state.trabajadores={
        medico:{id:'t0', ...nombreTrabajadorAleatorio(), nivel:1, sueldo:4400},
        mantenimiento:{id:'t1', ...nombreTrabajadorAleatorio(), nivel:1, sueldo:4400},
        directorGeneral:{id:'t2', ...nombreTrabajadorAleatorio(), nivel:1, sueldo:5500},
        directorDeportivo:{id:'t3', ...nombreTrabajadorAleatorio(), nivel:1, sueldo:5500}
      };
    }
    // Partidas guardadas de antes de tener género: se les asigna uno al
    // azar la primera vez que se cargan, para no romper el render.
    Object.keys(state.trabajadores||{}).forEach(rol=>{
      const t=state.trabajadores[rol];
      if(t && !t.genero) t.genero = Math.random()<0.5 ? 'hombre' : 'mujer';
    });
    if(!state.candidatosTrabajo || !state.candidatosTrabajo.length) regenerarCandidatosTrabajo();
    if(state.mesTrabajadoresGenerado===undefined) state.mesTrabajadoresGenerado=Math.floor((state.jornadaActual-1)/4)+1;
    if(!state.correoInterno) state.correoInterno=[];
    if(!state.correoUltimoEnviado) state.correoUltimoEnviado={};
    if(!state.posicionObjetivoOjeo) state.posicionObjetivoOjeo='any';
    if(!state.ordenColumnas || state.ordenColumnas.length!==4) state.ordenColumnas=['left','center','right','staff'];
    if(!state.preparadorFisicoCartas || !state.preparadorFisicoCartas.length) state.preparadorFisicoCartas=inicializarCartasPF();
    if(!state.preparadorFisicoCartasAgotadas) state.preparadorFisicoCartasAgotadas=[];
    if(!state.preparadorFisicoHistorial) state.preparadorFisicoHistorial=[];
    if(!state.preparadorFisicoNiveles) state.preparadorFisicoNiveles={resistenciaBase:0, recuperacionSemanal:0, potencialTecnico:0, potencialFisico:0, planificacionSemanal:0};
    if(state.trabajadores && state.trabajadores.preparadorFisico===undefined) state.trabajadores.preparadorFisico=null;
    if(!state.fechaInicioLiga) state.fechaInicioLiga=fechaISO(inicioTemporadaRealista());
    if(!state.calendarioEntrenamiento) state.calendarioEntrenamiento={};
    if(!state.pfPlanEntrenamiento) state.pfPlanEntrenamiento=[];
    // Migración desde el formato antiguo (solo lista de ids, sin
    // estadística elegida) — se les asigna un enfoque sugerido según su
    // posición para no perder la selección.
    state.pfPlanEntrenamiento=state.pfPlanEntrenamiento.map(entry=>{
      if(typeof entry==='string'){
        const p=state.plantilla.find(x=>x.id===entry);
        return {jugadorId:entry, stat:statSugeridaPorPosicion(p?p.position:'')};
      }
      return entry;
    }).filter(e=>e && e.jugadorId);
    if(!state.mantenimientoCartas || !state.mantenimientoCartas.length) state.mantenimientoCartas=inicializarCartasMantenimiento();
    if(!state.mantenimientoCartasAgotadas) state.mantenimientoCartasAgotadas=[];
    if(!state.mantenimientoHistorial) state.mantenimientoHistorial=[];
    if(!state.mantenimientoNiveles) state.mantenimientoNiveles={prevencionDesgaste:0, recuperacionCesped:0, boostSatisfaccion:0, proteccionSatisfaccion:0};
    if(!state.mantenimientoBonos) state.mantenimientoBonos={};
    if(state.dadoRerollsDisponibles===undefined) state.dadoRerollsDisponibles=1;

    // Botones de simulación instantánea de temporada — SOLO visibles para
    // la cuenta de desarrollo (jesuslor85@gmail.com), nunca para el resto
    // de usuarios. Llevan la liga hasta la última jornada (38) dejándola
    // sin jugar, con todas las jornadas anteriores resueltas al azar y el
    // resultado de MI equipo forzado a victoria (verde) o derrota (roja).
    const esCuentaDevCheat = !!(window._fbAuth && window._fbAuth.currentUser && window._fbAuth.currentUser.email==='jesuslor85@gmail.com');
    const clasif=calcularClasificacion();
    const j=state.jornadaActual-1;
    const proximaJornada= j<38 ? state.calendario[j] : null;
    const miPartido= proximaJornada ? proximaJornada.find(p=>p.home.id==='lm_0'||p.away.id==='lm_0') : null;
    const rival= miPartido ? (miPartido.home.id==='lm_0' ? miPartido.away : miPartido.home) : null;
    const esLocal= miPartido ? miPartido.home.id==='lm_0' : null;
    const clima= rival ? climaDelPartido() : null;
    const notif=state.medicoNotificacion;
    const notifMant = !!(state.estadio && (state.estadio.satisfaccion<=-50 || state.estadio.campo<=20));
    const notifDG = (state.capital||0)<0;
    const notifDD = (state.sobresFichajesPendientes||[]).length>0;
    const hayVacantes = ROLES_TRABAJO.some(r=>!state.trabajadores[r]);
    const monedaInfo=MONEDAS[state.moneda]||MONEDAS.EUR;

    function fatigueColor(f){ if(f>=75) return 'green'; if(f>=40) return 'yellow'; return 'red'; }
    // Verde/amarillo/rojo según lo cerca que esté de la sanción por
    // acumulación (5 amarillas) — mismo lenguaje de "semáforo" que la
    // barra de resistencia, para que se lea de un vistazo el riesgo
    // real, no solo el número seco.
    function colorTarjetaAcumulada(n){ if(n>=4) return 'red'; if(n>=2) return 'yellow'; return 'green'; }
    function fatigueBarHTML(p){
      const f=(p.fatigue===undefined)?100:p.fatigue;
      return `<div class="fatigue-bar-wrap" title="Resistencia: ${f}%"><div class="fatigue-bar fatigue-${fatigueColor(f)}" style="width:${f}%"></div></div>`;
    }
    function filaJugador(p){
      const cross=p.injured?` <span class="cross" title="${t('lm.tt_lesionado')}">✚</span>`:'';
      const tarjetaSancion=p.suspendido?` <span class="lm-tarjeta-sancion" title="${tp('lm.tt_sancionado',{n:p.partidosSancion})}">🟥</span>`:'';
      // Amarillas acumuladas (solo si no está ya sancionado — en cuanto
      // llega a 5 el contador se resetea y pasa a mostrar el 🟥 de
      // arriba en su lugar, nunca los dos a la vez).
      const amarillasAcum=(!p.suspendido && (p.amarillasAcumuladas||0)>0)
        ? ` <span class="lm-tarjeta-acumulada lm-tarjeta-acumulada-${colorTarjetaAcumulada(p.amarillasAcumuladas)}" title="${tp('lm.tt_amarillas_acumuladas',{n:p.amarillasAcumuladas})}">🟨${p.amarillasAcumuladas}</span>`
        : '';
      const racha=p.racha>=2?` <span title="${t('lm.tt_racha_gol')}">🔥${p.racha}</span>`:'';
      const star=titularIds.has(p.id)?`<span class="star" title="${t('lm.tt_titular')}">★</span>`:'';
      const claseFila=[p.id===seleccionJugador?'lm-row-selected':'', (p.injured||p.suspendido)?'lm-row-injured':''].filter(Boolean).join(' ');
      // Posición JUGADA (la del slot del campo si está alineado) frente a
      // su posición natural — mismo tratamiento que Copa Leyendas en
      // CONVOCADOS: si difieren, la jugada se marca en rojo y la natural
      // aparece debajo en gris pequeño.
      const slotAsignado=slotDeJugador(p.id);
      const posJugada=slotAsignado?basePos(slotAsignado):p.position;
      const fueraDePos=slotAsignado && posJugada!==p.position;
      const posCell=`<span style="font-weight:700${fueraDePos?';color:#e24b4a':''}">${posJugada}</span>${star}${fueraDePos?`<br><span style="font-size:9px;color:#888">${p.position}</span>`:''}`;
      return `<tr data-pid="${p.id}" class="${claseFila}">
        <td class="lm-td-numero">${p.numero||'-'}</td>
        <td>${p.name}${rasgosIconosHTML(p)}${cross}${tarjetaSancion}${amarillasAcum}${racha}</td>
        <td>${fatigueBarHTML(p)}</td>
        <td>${posCell}</td>
        <td>${p.attack}</td><td>${p.defense}</td><td>${p.pace}</td><td>${p.passing}</td><td>${p.technique}</td>
        <td><strong>${efectivoOverall(p)}</strong></td>
      </tr>`;
    }
    const titularIds=new Set(Object.values(state.alineacion||{}).filter(Boolean));
    const statsEquipo=calcularStatsEquipoLM();
    // PLANTILLA = quienes están AHORA MISMO en el campo, BANQUILLO = el
    // resto — igual que CONVOCADOS/BANQUILLO en Copa Leyendas, donde un
    // cambio mueve de verdad al jugador de una lista a la otra. Antes se
    // usaba la etiqueta fija "esSuplente" de la generación inicial, que
    // no se actualizaba al hacer cambios y dejaba las tablas
    // desincronizadas del campo real.
    const posOrderLM=['POR','DFC','LI','LD','MC','EI','ED','DC'];
    function posicionEfectiva(p){
      const slot=slotDeJugador(p.id);
      return slot?basePos(slot):p.position;
    }
    function ordenarPlantilla(lista){
      if(lmSortMode==='position'){
        return [...lista].sort((a,b)=>{
          const ai=posOrderLM.indexOf(posicionEfectiva(a)), bi=posOrderLM.indexOf(posicionEfectiva(b));
          return (ai===-1?99:ai)-(bi===-1?99:bi);
        });
      }
      if(lmSortMode==='rating') return [...lista].sort((a,b)=>efectivoOverall(b)-efectivoOverall(a));
      if(lmSortMode==='numero') return [...lista].sort((a,b)=>(a.numero||99)-(b.numero||99));
      return lista; // 'arrival' = orden de llegada = orden del array tal cual
    }
    const plantillaPrincipal=ordenarPlantilla(state.plantilla.filter(p=>titularIds.has(p.id)));
    // Para la media del once, un sancionado no cuenta — su hueco pesa
    // como si estuviera vacío, no como un jugador normal.
    const plantillaPrincipalSinSancion=plantillaPrincipal.filter(p=>!p.suspendido);
    const banquillo=state.plantilla.filter(p=>!titularIds.has(p.id));
    const filasPlantilla=plantillaPrincipal.map(filaJugador).join('');
    const filasBanquillo=banquillo.map(filaJugador).join('');

    // El scroll de cada columna es independiente y se pierde cada vez que
    // se reconstruye el HTML entero — se guarda aquí y se restaura al
    // final, para que marcar un día del calendario (o cualquier otra
    // acción) no salte la columna arriba de golpe.
    const scrollGuardado={};
    root.querySelectorAll('.lm-panel, .lm-center-panel').forEach(el=>{
      const clave=el.className;
      const scrollReal=el.querySelector(':scope > .lm-col-scroll-inner')||el;
      if(clave) scrollGuardado[clave]=scrollReal.scrollTop;
    });

    root.innerHTML = `
      <div class="lm-app-grid ${acabaDeReordenarColumnas?'lm-col-reordering':''}">
        <div id="lmPanelEquipo" class="lm-panel lm-left-panel" style="${columnaOrderStyle('left')}">${columnaControlesHTML('left')}<div class="lm-scroll-hint" data-scroll-hint title="${t('lm.tt_mas_contenido')}"><i class="ph ph-bold ph-caret-down"></i></div>
          <div class="lm-header-team">
            ${crestHTML(state.escudo, 76)}
            <div style="flex:1;min-width:0">
              <div class="lm-title">${state.nombreEquipo.toUpperCase()}</div>
              <div class="lm-sub">${t('lm.jornada').charAt(0)+t('lm.jornada').slice(1).toLowerCase()} ${Math.min(state.jornadaActual,(state.calendario||[]).length||38)} ${t('lm.jornada_de')} ${(state.calendario||[]).length||38}${temporadaLabel()?` <span class="lm-sub-punto">·</span> <span class="lm-sub-temporada">${temporadaLabel()}</span>`:''}</div>
            </div>
            <div class="lm-modo-visual-toggle">
              <button type="button" class="lm-modo-visual-btn ${(!state.modoVisualPartido||state.modoVisualPartido==='auto')?'lm-modo-visual-activo':''}" data-modo-visual="auto"><i class="ph ph-bold ph-fast-forward"></i>${t('lm.modo_automatico')}</button>
              <button type="button" class="lm-modo-visual-btn ${state.modoVisualPartido==='manager'?'lm-modo-visual-activo':''}" data-modo-visual="manager"><i class="ph ph-bold ph-strategy"></i>${t('lm.modo_manager')}</button>
            </div>
            <button id="lmJugarBtn" class="lm-btn-jugar-icon" ${state.jornadaActual>38?'disabled':''} title="${state.jornadaActual>38?t('lm.tt_temporada_completa'):(hayVacantes?t('lm.tt_falta_cuerpo_tecnico'):t('lm.tt_jugar_jornada'))}">
              <i class="ph ph-bold ph-play-circle"></i>
              <span>${state.jornadaActual>38?t('lm.fin_btn'):(state.semanaResueltaParaJornada===state.jornadaActual?t('lm.jugar_btn'):t('lm.seguir_btn'))}</span>
            </button>
            ${esCuentaDevCheat && state.jornadaActual<38 ? `
            <div class="lm-cheat-dev-wrap">
              <button id="lmCheatPerderBtn" type="button" class="lm-cheat-dev-btn lm-cheat-dev-btn-rojo" title="DEV: simular hasta la última jornada, todo perdido">
                <i class="ph ph-bold ph-skull"></i>
              </button>
              <button id="lmCheatGanarBtn" type="button" class="lm-cheat-dev-btn lm-cheat-dev-btn-verde" title="DEV: simular hasta la última jornada, todo ganado">
                <i class="ph ph-bold ph-trophy"></i>
              </button>
            </div>` : ''}
          </div>
          <div class="bench-title">
            <span class="lm-once-titular-label-wrap">
              <span><i class="ph ph-bold ph-t-shirt" style="color:var(--gold);margin-right:6px"></i>${t("lm.once_titular")}</span>
              <span class="lm-once-media-chip" title="${t('lm.media_once_titular_tt')}">
                <span class="lm-once-media-num">${plantillaPrincipalSinSancion.length?Math.round(plantillaPrincipalSinSancion.reduce((s,p)=>s+(p.overall||0),0)/plantillaPrincipalSinSancion.length):0}</span>
                <span class="lm-once-media-lbl">${t('lm.media_equipo')}</span>
              </span>
            </span>
            <span style="display:flex;align-items:center;gap:8px">
              <button id="lmSortBtn" class="lm-sort-btn" title="${t('lm.tt_cambiar_orden')}" aria-label="Cambiar orden">
                <span id="lmSortLabel">${LM_SORT_LABELS[lmSortMode]}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M7 12h10M11 18h2"/></svg>
              </button>
              <span>${plantillaPrincipal.length}</span>
            </span>
          </div>
          <div>
            <table class="roster-table">
              <thead><tr><th>#</th><th>${t('lm.tabla_jugador')}</th><th>${t('lm.tabla_resist')}</th><th>Pos</th><th>${t('lm.stat_ata')}</th><th>${t('lm.stat_def')}</th><th>${t('lm.stat_rit')}</th><th>${t('lm.stat_pas')}</th><th>${t('lm.stat_tec')}</th><th>${t('lm.tabla_punt')}</th></tr></thead>
              <tbody>${filasPlantilla}</tbody>
            </table>
          </div>
          <div class="bench-title"><span><i class="ph ph-bold ph-chair" style="color:var(--gold);margin-right:6px"></i>${t("lm.banquillo")}</span><span>${banquillo.length}</span></div>
          <div>
            <table class="roster-table">
              <thead><tr><th>#</th><th>${t('lm.tabla_jugador')}</th><th>${t('lm.tabla_resist')}</th><th>Pos</th><th>${t('lm.stat_ata')}</th><th>${t('lm.stat_def')}</th><th>${t('lm.stat_rit')}</th><th>${t('lm.stat_pas')}</th><th>${t('lm.stat_tec')}</th><th>${t('lm.tabla_punt')}</th></tr></thead>
              <tbody>${filasBanquillo}</tbody>
            </table>
          </div>

          <div class="team-profile box" style="margin-top:14px">
            <h3 id="lmPerfilEquipoHeader" class="lm-perfil-header"><i class="ph ph-bold ph-chart-bar" style="color:var(--gold);margin-right:6px"></i>${t('lm.perfil_equipo')} <span class="lm-perfil-arrow ${perfilEquipoColapsado?'':'lm-perfil-arrow-open'}">▾</span></h3>
            <div class="lm-perfil-nota-grande">${statsEquipo.overall}</div>
            ${!perfilEquipoColapsado?`
            ${[['attack','ATAQUE'],['defense','DEFENSA'],['pace','RITMO'],['passing','PASE'],['technique','TÉCNICA']].map(([k,label])=>`
              <div class="stat-row"><span>${label}</span><span>${statsEquipo[k]}</span></div>
              <div class="stat-bar-row"><div class="stat-bar"><div style="width:${Math.max(0,Math.min(100,statsEquipo[k]))}%"></div></div></div>
            `).join('')}
            <p class="lm-setup-desc" style="text-align:left;margin-top:6px">Media de los ${state.plantilla.length} jugadores de la plantilla.</p>
            `:''}
          </div>
        </div>

        <div id="lmPanelCampo" class="lm-center-panel" style="${columnaOrderStyle('center')}">${columnaControlesHTML('center')}<div class="lm-scroll-hint" data-scroll-hint title="${t('lm.tt_mas_contenido')}"><i class="ph ph-bold ph-caret-down"></i></div>
          <div id="lmPitchBox"><button type="button" id="lmInfoClubBtn" class="lm-pitch-lupa-btn" title="${t('lm.info_club_tooltip')}"><i class="ph ph-bold ph-magnifying-glass"></i></button>${PITCH_SVG}<div id="lmCampoLayer" style="opacity:${campoOpacidadDesgaste(state.estadio?state.estadio.campo:100)}"></div><div id="lmWeatherLayer"></div>${formacionActual().slots.map(def=>{
            const pid=state.alineacion&&state.alineacion[def.slot];
            const jugador=pid?state.plantilla.find(p=>p.id===pid):null;
            const vacio=!jugador;
            const lesionado=jugador&&jugador.injured;
            const sancionado=jugador&&jugador.suspendido;
            const seleccionado=jugador && jugador.id===seleccionJugador;
            const label=basePos(def.slot);
            // Calco exacto de renderSlotContent() de Copa Leyendas: círculo
            // con el rating dentro, nombre + estrella + etiqueta de posición
            // DEBAJO del círculo (.player-info), reutilizando las mismas
            // clases globales (.position/.locked/.player-info/.pos-rating/
            // .player-pos-label/.star) en vez de un sistema aparte.
            let inner;
            if(vacio){
              inner=`<span class="pos-label-inside">${label}</span>`;
            }else{
              const inPos=jugador.position===label;
              const star=inPos?' <span class="star">★</span>':'';
              const statusIcons=(lesionado||sancionado)?`<div class="pitch-status-row">${lesionado?`<span class="pitch-status-icon pitch-status-injury" title="${t('lm.tt_lesionado')}">✚</span>`:''}${sancionado?`<span class="pitch-status-icon pitch-status-sancion" title="${tp('lm.tt_sancionado',{n:jugador.partidosSancion||1})}">🟥</span>`:''}</div>`:'';
              inner=`${statusIcons}<span class="pos-rating">${efectivoOverall(jugador)}</span><div class="player-info"><div class="lm-player-name-row"><span class="lm-player-name-text">${jugador.name}${rasgosIconosHTML(jugador)}</span>${star}</div><div class="player-pos-label${inPos?'':' out-of-position'}">${label}</div></div>`;
            }
            const clases=['position', vacio?'empty-slot':'locked', lesionado?'lm-pos-injured':'', sancionado?'lm-pos-sancionado':'', seleccionado?'highlight-pos':''].filter(Boolean).join(' ');
            return `<div class="${clases}" data-slot="${def.slot}" style="left:${def.x}%;top:${def.y}%" title="${jugador?jugador.name+' ('+efectivoOverall(jugador)+')':'Vacío'}">${inner}</div>`;
          }).join('')}</div>

          <div class="bench-title" style="margin-top:14px"><span><i class="ph ph-bold ph-strategy" style="color:var(--gold);margin-right:6px"></i>${t('lm.formacion')}</span><span>${state.formacionCode}</span></div>
          <div class="formation-tabs">
            ${Object.keys(FORMATIONS).map(cat=>`<div class="formation-tab ${(formacionCategoriaVista||state.formacionCategoria)===cat?'active':''}" data-categoria="${cat}">${CAT_NAMES[cat]}</div>`).join('')}
          </div>
          <div id="formationList">
            ${FORMATIONS[formacionCategoriaVista||state.formacionCategoria].map(f=>`
              <div class="formation-option ${state.formacionCode===f.code?'selected':''}" data-formacion-codigo="${f.code}">
                <span class="f-code">${f.code}</span>
                <span class="f-badge">${f.label}</span>
              </div>`).join('')}
          </div>
        </div>

        <div id="lmPanelRival" class="lm-panel lm-right-panel" style="${columnaOrderStyle('right')}">${columnaControlesHTML('right')}<div class="lm-scroll-hint" data-scroll-hint title="${t('lm.tt_mas_contenido')}"><i class="ph ph-bold ph-caret-down"></i></div>
          <div class="lm-nextmatch-box">
            ${rival ? `
              <div class="lm-rival-top-row">
                <div class="lm-rival-crest-block">
                  <div class="lm-rival-crest-img-wrap">
                    ${rivalCrestHTML(88, rival.crestImg)}
                    <button class="lm-rival-lupa-btn" id="lmVerOnceRivalBtn" title="${t('lm.tt_ver_once_banquillo')}"><i class="ph ph-bold ph-magnifying-glass"></i></button>
                  </div>
                  <span class="lm-title" style="font-size:15px">${rival.name}</span>
                  <div class="lm-perfil-nota-grande">${Math.round((rival.attack+rival.defense+rival.pace+rival.passing+rival.technique)/5)}</div>
                </div>
                <div class="lm-rival-info-col">
                  <h3 class="lm-nextrival-header" style="text-align:left;margin:0 0 4px"><i class="ph ph-bold ph-flag" style="color:var(--gold);margin-right:6px"></i>${t("lm.proximo_rival")}</h3>
                  <div class="lm-vs-label" style="text-align:left;margin-bottom:6px;display:flex;align-items:center;justify-content:space-between;gap:8px">
                    <span>${esLocal?t('lm.juegas_en_casa'):t('lm.juegas_fuera')}</span>
                    ${(()=>{ const climaPartido=(typeof climaDelPartido==='function')?climaDelPartido():null; return climaPartido ? `<span style="font-size:13px;font-weight:600;color:#ccc;white-space:nowrap">${climaPartido.label}</span>` : ''; })()}
                  </div>
                  ${(()=>{
                    const climaPartido=(typeof climaDelPartido==='function')?climaDelPartido():null;
                    if(!climaPartido || !climaPartido.effect || !Object.keys(climaPartido.effect).length) return '';
                    return `<div class="lm-clima-repercusion"><i class="ph ph-bold ph-info"></i> ${climaPartido.desc}</div>`;
                  })()}
                  ${(()=>{
                    const fila=calcularClasificacion();
                    const idx=fila.findIndex(t=>t.id===rival.id);
                    const datos=fila[idx]||{pj:0,pg:0,pe:0,pp:0,pts:0,gf:0,gc:0};
                    const dg=datos.gf-datos.gc;
                    return `<table class="lm-rival-mini-table">
                      <tr><td>${t('lm.tabla_posicion')}</td><td><strong>${idx+1}º</strong></td></tr>
                      <tr><td>${t('lm.tabla_puntos')}</td><td><strong>${datos.pts}</strong></td></tr>
                      <tr><td>${t('lm.tabla_pj_jugados')}</td><td>${datos.pj}</td></tr>
                      <tr><td>${t('lm.tabla_g_ganados')}</td><td>${datos.pg}</td></tr>
                      <tr><td>${t('lm.tabla_e_empatados')}</td><td>${datos.pe}</td></tr>
                      <tr><td>${t('lm.tabla_p_perdidos')}</td><td>${datos.pp}</td></tr>
                      <tr><td>${t('lm.goles_fc')}</td><td>${datos.gf}:${datos.gc} <span style="color:${dg>=0?'#5dcaa5':'#e24b4a'}">(${dg>=0?'+':''}${dg})</span></td></tr>
                    </table>`;
                  })()}
                </div>
              </div>
              ${(()=>{
                const estilo=estiloDeJuegoRival(rival);
                return `<div class="lm-estilo-juego-box">
                  <div class="lm-estilo-juego-titulo"><i class="ph ph-bold ph-strategy"></i> ${t('lm.estilo_de_juego')}</div>
                  <div class="lm-estilo-juego-texto">${estilo.base}</div>
                </div>`;
              })()}
              ${(()=>{
                const campoRival=campoRivalEstimado(rival);
                return `<div style="margin-top:6px">
                  <div class="lm-estadio-bar-label" style="font-size:10px"><i class="ph ph-bold ph-plant" style="font-size:12px"></i><span>${t('lm.estado_su_campo')}${esLocal?'':' '+t('lm.hoy_juegas_aqui')}</span><span>${campoRival}/100</span></div>
                  ${campoBarraHTML(campoRival, true)}
                </div>`;
              })()}
              <div class="lm-rival-profile">
                ${[[t('lm.stat_ataque_lbl'),'attack'],[t('lm.stat_defensa_lbl'),'defense'],[t('lm.stat_ritmo_lbl'),'pace'],[t('lm.stat_pase_lbl'),'passing'],[t('lm.stat_tecnica_lbl'),'technique']].map(([label,k])=>`
                  <div class="stat-row"><span>${label}</span><span>${rival[k]}</span></div>
                  <div class="stat-bar-row"><div class="stat-bar"><div style="width:${Math.max(0,Math.min(100,rival[k]))}%"></div></div></div>
                `).join('')}
              </div>` : `<div class="lm-vs-label" style="text-align:center">${t('lm.temporada_finalizada')}</div>`}
          </div>
          ${calendarioHTML()}
        </div>

        <div id="lmPanelTecnicos" class="lm-panel lm-staff-panel" style="${columnaOrderStyle('staff')}">${columnaControlesHTML('staff')}<div class="lm-scroll-hint" data-scroll-hint title="${t('lm.tt_mas_contenido')}"><i class="ph ph-bold ph-caret-down"></i></div>
          <div class="lm-staff-bar-header">
            <div class="lm-staff-bar-title"><i class="ph ph-bold ph-users-three"></i> ${t("lm.cuerpo_tecnico")}</div>
            <div class="lm-staff-bar-capital" title="${t('lm.tt_dados_rerolls')}">
              <span><i class="ph ph-bold ph-dice-five"></i> ${t('lm.dados')}: <strong>${state.diceAvailable}</strong></span>
              <span><i class="ph ph-bold ph-arrows-clockwise"></i> ${t('lm.rerrolls')}: <strong>${state.dadoRerollsDisponibles||0}</strong></span>
            </div>
          </div>
          ${hayVacantes?`<div class="lm-staff-warning"><i class="ph ph-bold ph-warning"></i> ${t('lm.falta_cuerpo_tecnico_msg')}</div>`:''}
          <button id="lmTrabajadoresBtn" class="lm-btn-trabajadores" style="width:100%;margin-bottom:10px"><i class="ph ph-bold ph-user-plus"></i> ${t('lm.contratar_btn')}</button>
          <div class="lm-staff-bar-row">
            ${staffTileHTML('directorGeneral', {btnId:'lmDirectorGeneralBtn', infoId:'lmDirectorGeneralInfoBtn', infoTitle:t('lm.info_dg'), notif:notifDG, badgeTexto:'!', carpeta:'director_general', archivo:'director_general', alt:'Director General', icono:'ph-briefcase', rolLabel:t('lm.rol_dg'), acento:'lm-staff-tile-dg', desc:t('lm.desc_dg')})}
            ${staffTileHTML('directorDeportivo', {btnId:'lmDirectorDeportivoBtn', infoId:'lmDirectorDeportivoInfoBtn', infoTitle:t('lm.info_dd'), notif:notifDD, badgeTexto:'!', carpeta:'director_deportivo', archivo:'director_deportivo', alt:'Director Deportivo', icono:'ph-binoculars', rolLabel:t('lm.rol_dd'), acento:'lm-staff-tile-dd', desc:t('lm.desc_dd')})}
            ${staffTileHTML('medico', {btnId:'lmMedicoBtn', infoId:'lmMedicoInfoBtn', infoTitle:t('lm.info_medico'), notif:notif, badgeTexto:'1', carpeta:'medico', archivo:'medico', alt:'Equipo médico', icono:'ph-first-aid-kit', rolLabel:t('lm.rol_medico'), desc:t('lm.desc_medico'), acento:'lm-staff-tile-medico'})}
            ${staffTileHTML('preparadorFisico', {btnId:'lmPreparadorFisicoBtn', infoId:'lmPreparadorFisicoInfoBtn', infoTitle:t('lm.info_pf'), notif:false, badgeTexto:'', carpeta:'preparador_fisico', archivo:'preparador_fisico', alt:'Preparador Físico', icono:'ph-barbell', rolLabel:t('lm.rol_pf'), desc:t('lm.desc_pf'), acento:'lm-staff-tile-pf'})}
            ${staffTileHTML('mantenimiento', {btnId:'lmMantenimientoBtn', infoId:'lmMantenimientoInfoBtn', infoTitle:t('lm.info_mant'), notif:notifMant, badgeTexto:'!', carpeta:'mantenimiento', archivo:'mantenimiento_y_seguridad', alt:'Mantenimiento y seguridad', icono:'ph-flag-pennant', rolLabel:t('lm.rol_mant'), desc:t('lm.desc_mant'), acento:'lm-staff-tile-mant'})}
          </div>
          ${(()=>{
            try{
              const lista=state.correoInterno||[];
              const sinLeer=lista.filter(c=>c && !c.leido).length;
              const filas=lista.length?lista.slice(0,10).map(c=>{
                if(!c || !c.id) return '';
                let cuerpoExtra='';
                if(correoExpandido===c.id){
                  let extra='';
                  if(c.tipoEspecial==='oferta_jugador' && !c.resuelto && Array.isArray(c.ofertas)){
                    extra=`<div class="lm-correo-ofertas">
                      ${c.ofertas.map((o,i)=>`<button class="lm-correo-oferta-btn" data-aceptar-oferta="${c.id}" data-oferta-idx="${i}">${o.club} — ${formatoDinero(o.monto)}</button>`).join('')}
                      ${c.ofertas.length?`<button class="lm-correo-oferta-rechazar" data-rechazar-oferta="${c.id}">${t('lm.rechazar_todas')}</button>`:''}
                    </div>`;
                  } else if(c.tipoEspecial==='oferta_jugador' && c.resuelto){
                    extra=`<div class="lm-correo-resultado">${c.resultadoTexto||''}</div>`;
                  } else if(c.tipoEspecial==='balance_mensual'){
                    extra=`<div class="lm-correo-ofertas"><button class="lm-correo-oferta-btn" data-ver-finanzas="1">${t('lm.ver_finanzas')}</button></div>`;
                  } else if(c.tipoEspecial==='sobre_listo' && !c.resuelto){
                    const sobrePendiente=(state.sobresFichajesPendientes||[]).find(s=>s.id===c.sobreId);
                    if(sobrePendiente){
                      const coste=sobrePendiente.gratis ? 0 : Math.round((SOBRE_COSTES[sobrePendiente.nivel]||SOBRE_COSTES[1])*(1-lmDescuentoSobres()));
                      extra=`<div class="lm-correo-ofertas">
                        <button class="lm-correo-oferta-btn lm-sobre-abrir-btn" data-abrir-sobre-correo="${c.id}" data-sobre-id="${sobrePendiente.id}" ${((state.capital||0)<coste)?'disabled':''}>
                          <i class="ph ph-bold ph-envelope-open"></i> ${t('lm.abrir_sobre')} ${sobrePendiente.gratis?`(${t('lm.gratis')})`:'('+formatoDinero(coste)+')'}
                        </button>
                      </div>`;
                    } else {
                      extra=`<div class="lm-correo-resultado">${t('lm.sobre_ya_abierto')}</div>`;
                    }
                  } else if(c.tipoEspecial==='sobre_listo' && c.resuelto){
                    extra=`<div class="lm-correo-resultado">${c.resultadoTexto||t('lm.sobre_ya_abierto')}</div>`;
                  } else if(c.tipoEspecial==='quiniela_lista'){
                    if(state.quinielaBoleto && !state.quinielaBoleto.rellenado){
                      extra=`<div class="lm-correo-ofertas"><button class="lm-correo-oferta-btn" data-abrir-quiniela="1"><i class="ph ph-bold ph-ticket"></i> ${t('lm.rellenar_quiniela')}</button></div>`;
                    } else {
                      extra=`<div class="lm-correo-resultado">${t('lm.quiniela_ya_rellenada')}</div>`;
                    }
                  } else if(c.tipoEspecial==='nuevos_candidatos'){
                    extra=`<div class="lm-correo-ofertas"><button class="lm-correo-oferta-btn" data-ir-contratar="1"><i class="ph ph-bold ph-user-plus"></i> ${t('lm.contratar_btn')}</button></div>`;
                  } else if(c.tipoEspecial==='grada_descontenta'){
                    extra=`<div class="lm-correo-ofertas"><button class="lm-correo-oferta-btn" data-ir-seguridad="1"><i class="ph ph-bold ph-shield-check"></i> ${t('lm.seguridad_estadio')}</button></div>`;
                  }
                  cuerpoExtra=`<div class="lm-correo-cuerpo">${correoCuerpoActual(c)||''}${extra}</div>`;
                }
                return `<div class="lm-correo-item ${c.leido?'':'lm-correo-no-leido'} ${correoExpandido===c.id?'lm-correo-expandido':''}" data-correo="${c.id}">
                  <div class="lm-correo-item-top">
                    <i class="ph ph-bold ${CORREO_ICONOS[c.rol]||'ph-envelope'}"></i>
                    <div class="lm-correo-item-info">
                      <div class="lm-correo-remitente">${NOMBRE_ROL[c.rol]||t('lm.club_generico')}</div>
                      <div class="lm-correo-asunto">${correoAsuntoActual(c)||''}</div>
                    </div>
                    <button class="lm-correo-borrar" data-borrar-correo="${c.id}" title="${t('lm.borrar_mensaje')}"><i class="ph ph-bold ph-trash"></i></button>
                  </div>
                  ${cuerpoExtra}
                </div>`;
              }).join('') : '';
              return `<div class="lm-correo-box">
                ${sinLeer?'<span class="lm-correo-notif-dot"></span>':''}
                <div class="lm-correo-header">
                  <span><i class="ph ph-bold ph-envelope"></i> ${t("lm.correo_interno")}</span>
                  ${sinLeer?`<span class="lm-correo-badge">${sinLeer}</span>`:''}
                  ${(state.correoInterno&&state.correoInterno.length)?`<button class="lm-correo-borrar-todos" id="lmCorreoBorrarTodos">${t('lm.borrar_todos')}</button>`:''}
                </div>
                <div class="lm-correo-list">
                  ${filas||`<p class="lm-setup-desc" style="text-align:center;padding:10px 0">${t('lm.bandeja_vacia')}</p>`}
                </div>
              </div>`;
            }catch(e){
              console.error('Error pintando el correo interno:', e);
              return `<div class="lm-correo-box"><div class="lm-correo-header"><span><i class="ph ph-bold ph-envelope"></i> ${t("lm.correo_interno")}</span></div><div class="lm-correo-list"><p class="lm-setup-desc" style="text-align:center;padding:10px 0">${t('lm.correo_error_carga')}</p></div></div>`;
            }
          })()}
          <div class="box collapsible-box collapsed" id="lmHowToPlayBox">
            <h3 class="collapsible-header" onclick="toggleCollapsible('lmHowToPlayBox')"><span>${t('lm.howto_titulo')}</span> <span class="collapse-arrow">▾</span></h3>
            <div class="howto-content">
              <div class="howto-step"><span class="howto-num">1</span><div>${t('lm.howto_paso1')}</div></div>
              <div class="howto-step"><span class="howto-num">2</span><div>${t('lm.howto_paso2')}</div></div>
              <div class="howto-step"><span class="howto-num">3</span><div>${t('lm.howto_paso3')}</div></div>
              <div class="howto-step"><span class="howto-num">4</span><div>${t('lm.howto_paso4')}</div></div>
              <div class="howto-step"><span class="howto-num">5</span><div>${t('lm.howto_paso5')}</div></div>
              <div class="howto-step"><span class="howto-num">6</span><div>${t('lm.howto_paso6')}</div></div>
              <button id="lmReplayTutorialBtn" style="width:100%;margin-top:12px;font-family:'Bebas Neue',Impact,sans-serif;letter-spacing:1px;font-size:16px;background:none;border:1px solid var(--gold);color:var(--gold);border-radius:6px;padding:9px 14px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px">
                <i class="ph ph-bold ph-play-circle" style="font-size:20px"></i> ${t('lm.howto_ver_tutorial')}
              </button>
            </div>
          </div>
          <div class="box collapsible-box collapsed" id="lmStatsGuideBox">
            <h3 class="collapsible-header" onclick="toggleCollapsible('lmStatsGuideBox')"><span>${t('lm.stats_guide_titulo')}</span> <span class="collapse-arrow">▾</span></h3>
            <div class="howto-content">
              <div class="howto-step"><span class="howto-num stat-num stat-attack">A</span><div><strong>${t('lm.stat_ataque_lbl')}</strong> — ${t('lm.stat_ataque_desc')}</div></div>
              <div class="howto-step"><span class="howto-num stat-num stat-defense">D</span><div><strong>${t('lm.stat_defensa_lbl')}</strong> — ${t('lm.stat_defensa_desc')}</div></div>
              <div class="howto-step"><span class="howto-num stat-num stat-pace">R</span><div><strong>${t('lm.stat_ritmo_lbl')}</strong> — ${t('lm.stat_ritmo_desc')}</div></div>
              <div class="howto-step"><span class="howto-num stat-num stat-passing">P</span><div><strong>${t('lm.stat_pase_lbl')}</strong> — ${t('lm.stat_pase_desc')}</div></div>
              <div class="howto-step"><span class="howto-num stat-num stat-technique">T</span><div><strong>${t('lm.stat_tecnica_lbl')}</strong> — ${t('lm.stat_tecnica_desc')}</div></div>
            </div>
          </div>
          <div class="box collapsible-box collapsed" id="lmGlossaryBox">
            <h3 class="collapsible-header" onclick="toggleCollapsible('lmGlossaryBox')"><span>${t('lm.glosario_titulo')}</span> <span class="collapse-arrow">▾</span></h3>
            <div class="howto-content">
              <table class="glossary-table"><tbody>
                ${['jornada','quiniela','cuerpo_tecnico','proyectos','moral','fichajes','sobres','traspasos','capital','rasgos','mejoras_habilidades','guardias','rueda_prensa','estadio','sancion','entrenamiento'].map(k=>`<tr><td class="glossary-term">${t('lm.gloss_'+k+'_term')}</td><td class="glossary-desc">${t('lm.gloss_'+k)}</td></tr>`).join('')}
              </tbody></table>
            </div>
          </div>
        </div>

      </div>
    `;

    if(clima) aplicarClimaVisualLM(clima.id);
    acabaDeReordenarColumnas=false;
    // Scroll de columna a prueba de balas: en vez de confiar en que la
    // altura en % se calcule bien a través de flex+grid (que en esta
    // columna concreta llevaba fallando pese a varios intentos), se
    // envuelve TODO el contenido de cada columna en un div interior con
    // position:absolute;inset:0 — su tamaño se calcula solo a partir del
    // propio contenedor (position:relative), sin depender para nada de
    // cómo se comporte el grid por fuera. Es una técnica distinta a
    // todo lo probado hasta ahora.
    try{
      document.querySelectorAll('#ligaManagerScreen .lm-app-grid > .lm-panel, #ligaManagerScreen .lm-app-grid > .lm-center-panel').forEach(col=>{
        if(col.querySelector(':scope > .lm-col-scroll-inner')) return; // ya envuelta en este mismo render
        const hijos=Array.from(col.childNodes).filter(h=>{
          if(h.nodeType!==1) return true; // texto/comentarios, da igual, se mueven
          return !h.classList.contains('lm-col-reorder') && !h.classList.contains('lm-scroll-hint');
        });
        const inner=document.createElement('div');
        inner.className='lm-col-scroll-inner';
        hijos.forEach(h=>inner.appendChild(h));
        col.appendChild(inner);
        col.classList.add('lm-col-scroll-outer');
      });
    }catch(e){ console.error('Error envolviendo columnas para scroll:', e); }
    root.querySelectorAll('.lm-panel, .lm-center-panel').forEach(el=>{
      const clave=el.className;
      const scrollTarget=el.querySelector('.lm-col-scroll-inner')||el;
      if(clave && scrollGuardado[clave]!==undefined) scrollTarget.scrollTop=scrollGuardado[clave];
      marcarScrollColumna(clave);
      scrollTarget.addEventListener('scroll', ()=>marcarScrollColumna(clave));
    });
    iniciarHintScrollColumnas();

    const medicoInfoBtn=document.getElementById('lmMedicoInfoBtn');
    if(medicoInfoBtn) medicoInfoBtn.addEventListener('click', (e)=>{
      e.stopPropagation();
      if(bloqueadoPorVacante('medico')) return;
      if(typeof window.playSound==='function') window.playSound('select');
      abrirHistorialMedico();
    });

    root.querySelectorAll('[data-categoria]').forEach(el=>{
      el.addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        formacionCategoriaVista=el.getAttribute('data-categoria');
        render();
      });
    });
    root.querySelectorAll('[data-formacion-codigo]').forEach(el=>{
      el.addEventListener('click', ()=>{
        const code=el.getAttribute('data-formacion-codigo');
        if(code===state.formacionCode) return;
        if(typeof window.playSound==='function') window.playSound('select');
        state.formacionCode=code;
        state.formacionCategoria=formacionCategoriaVista||state.formacionCategoria;
        state.alineacion=alineacionAutomatica(state.plantilla, generarSlotsFormacion(code));
        guardarEstado();
        render();
      });
    });

    root.querySelectorAll('[data-modo-visual]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        state.modoVisualPartido=btn.getAttribute('data-modo-visual');
        guardarEstado();
        render();
      });
    });

    const jugarBtn=document.getElementById('lmJugarBtn');
    if(jugarBtn){
      jugarBtn.addEventListener('click', ()=>{
        // Blindaje contra doble clic: jugarJornada() avanza la
        // jornada de forma SÍNCRONA, antes incluso de que el visor
        // del partido termine de abrirse — si el botón se queda
        // activo aunque sea un instante, un segundo clic (accidental
        // o por impaciencia) cae en la rama equivocada, porque
        // jornadaActual ya subió pero semanaResueltaParaJornada
        // todavía no, así que "SEGUIR" se dispara para la jornada
        // SIGUIENTE sin haber visto el partido de la actual. Se
        // deshabilita aquí mismo, de inmediato, y solo se vuelve a
        // habilitar con el siguiente render() de verdad (que llega al
        // cerrar el visor, o de inmediato si por lo que sea no hay
        // partido que jugar).
        if(jugarBtn.disabled) return;
        jugarBtn.disabled=true;
        marcarInteraccionJugarBtn();
        if(typeof window.playSound==='function') window.playSound('select');
        // Red de seguridad definitiva: si CUALQUIER cosa de todo este
        // flujo lanza un error sin capturar (aquí mismo o en cualquier
        // función que llame), el botón deshabilitado de arriba se
        // quedaría así para siempre, sin ningún aviso — exactamente la
        // sensación de "juego colgado". Con este blindaje, un fallo
        // real se ve en la consola Y se reactiva el botón para poder
        // reintentar, en vez de dejar la partida completamente
        // bloqueada sin ninguna forma de seguir.
        try{
        const jugarAhora=()=>{
          // Si la semana de esta jornada ya se resolvió (primer SEGUIR),
          // este segundo SEGUIR juega directamente el partido.
          if(state.semanaResueltaParaJornada===state.jornadaActual){
            // Antes de simular nada: si hay algún titular sancionado por
            // tarjetas, se resuelve su sustitución (con la mejor opción
            // ya sugerida) — jugarJornada() solo se llama DESPUÉS, para
            // que el sancionado ya no exista en state.alineacion cuando
            // se juegue el partido de verdad.
            mostrarPopupSancionesAntesDeJugar(()=>{
              const info=jugarJornada();
              if(info){
                const alTerminar=()=>{
                  render();
                  mostrarLogrosPendientes();
                  mostrarResolucionQuinielaSiToca();
                  // Se acaba de cruzar de la jornada 38 a la 39: la
                  // temporada ha terminado justo ahora — se muestra el
                  // resumen una única vez, aquí mismo, nunca en renders
                  // posteriores (el botón JUGAR/SEGUIR queda deshabilitado
                  // en cuanto jornadaActual>38, así que este callback no
                  // puede volver a dispararse para la misma temporada).
                  if(state.jornadaActual>38) mostrarResumenTemporada();
                };
                if(state.modoVisualPartido==='manager'){ abrirVisorPartidoManager(info, alTerminar); }
                else { mostrarPartidoEnVivo(info, alTerminar); }
              } else { render(); }
            });
            return;
          }
          const continuarSemana=procesarSemanaYMostrarResumen;
          // Si el árbol de nodos de esta semana todavía no está
          // completo (quedan días sin elegir), se abre esa pantalla en
          // vez de procesar la semana de golpe como antes — cada
          // "SEGUIR" mientras quede camino por recorrer simplemente
          // continúa donde se dejó, sin ningún aviso de por medio (el
          // aviso de que se va a empezar a gestionar la semana ya se
          // ve la primera vez, al abrir el árbol).
          asegurarSemanaNodos();
          if(state.semanaNodos && diaActualIndiceSemanaNodos()!==-1){
            abrirArbolNodosSemana();
            return;
          }
          // Si hay días de entrenamiento marcados en el calendario pero no
          // hay nadie en el Plan de Entrenamiento del Preparador Físico,
          // esos días no mejorarían a ningún jugador — se avisa (solo la
          // primera vez que pase en toda la partida) y se le da la
          // oportunidad de corregirlo antes de seguir.
          const {entreno}=contarEntrenoSemanaActual();
          const sinPlan=!(state.pfPlanEntrenamiento && state.pfPlanEntrenamiento.length);
          if(entreno>0 && sinPlan && !state.avisoSinPlanMostrado){
            state.avisoSinPlanMostrado=true;
            guardarEstado();
            mostrarAvisoEntrenamientoSinPlan(continuarSemana);
            return;
          }
          continuarSemana();
        };
        // Los avisos van encadenados: cada uno, al cerrarse (con
        // "decidir más tarde" o similar), pasa directamente al
        // siguiente pendiente en vez de cortar el flujo — antes había
        // que pulsar SEGUIR una vez por cada aviso distinto para
        // verlos todos, cuando deberían aparecer uno tras otro en el
        // mismo clic. Cada aviso sigue mostrándose como mucho una vez
        // en toda la partida.
        const pasoQuiniela=()=>{
          // Aviso de quiniela pendiente: la quiniela se entrega para
          // usarse en ESA jornada concreta — si el jugador intenta jugar
          // el partido sin haberla rellenado, se le avisa y se le da la
          // opción de rellenarla ahí mismo, o seguir jugando (en cuyo
          // caso la quiniela se pierde y se borra del correo interno,
          // ya que no tiene sentido conservarla para una jornada que ya
          // ha pasado).
          if(state.quinielaBoleto && !state.quinielaBoleto.rellenado){
            mostrarAvisoQuinielaPendienteAntesDeJugar(jugarAhora);
            return;
          }
          jugarAhora();
        };
        const faltaCuerpoTecnico=ROLES_TRABAJO.some(r=>!state.trabajadores[r]);
        if(faltaCuerpoTecnico && !state.avisoCuerpoTecnicoMostrado){
          state.avisoCuerpoTecnicoMostrado=true;
          guardarEstado();
          mostrarAvisoPlantillaTecnicaIncompleta(pasoQuiniela);
          return;
        }
        pasoQuiniela();
        }catch(errJugar){
          console.error('jugarBtn click:', errJugar);
          jugarBtn.disabled=false;
          if(typeof showToast==='function') showToast(t('lm.error_jugar_reintentar')||'Ha ocurrido un error — inténtalo de nuevo', 'toast-error');
        }
      });
      jugarBtn.addEventListener('mouseenter', marcarInteraccionJugarBtn);
      jugarBtn.addEventListener('mousemove', marcarInteraccionJugarBtn);
      if(Date.now()-jugarBtnUltimaInteraccion>60000) jugarBtn.classList.add('lm-btn-jugar-pulse');
      iniciarPulseJugarBtn();
    }
    // Botones DEV (solo jesuslor85@gmail.com) — simulan al instante hasta
    // la última jornada, forzando todos mis partidos ganados o perdidos.
    const cheatPerderBtn=document.getElementById('lmCheatPerderBtn');
    if(cheatPerderBtn) cheatPerderBtn.addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      lmDevSimularHastaUltimaJornada('perder');
    });
    const cheatGanarBtn=document.getElementById('lmCheatGanarBtn');
    if(cheatGanarBtn) cheatGanarBtn.addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      lmDevSimularHastaUltimaJornada('ganar');
    });
    const trabajadoresBtn=document.getElementById('lmTrabajadoresBtn');
    if(trabajadoresBtn) trabajadoresBtn.addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      abrirTrabajadores();
    });
    const verOnceRivalBtn=document.getElementById('lmVerOnceRivalBtn');
    if(verOnceRivalBtn) verOnceRivalBtn.addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      if(rival) abrirOnceRival(rival);
    });
    root.querySelectorAll('[data-mover-col]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        if(btn.disabled) return;
        marcarInteraccionColArrows();
        const key=btn.getAttribute('data-mover-col');
        const dir=parseInt(btn.getAttribute('data-mover-dir'),10);
        if(typeof window.playSound==='function') window.playSound('select');
        moverColumna(key, dir);
      });
    });
    root.querySelectorAll('.lm-col-reorder').forEach(el=>{
      el.addEventListener('mouseenter', marcarInteraccionColArrows);
      el.addEventListener('touchstart', marcarInteraccionColArrows, {passive:true});
      if(Date.now()-colArrowsUltimaInteraccion>10000) el.classList.add('lm-col-reorder-oculto');
    });
    iniciarFadeColArrows();
    // El calendario ya no permite marcar días directamente — eso lo
    // decide el árbol de nodos. Se deja de cablear el clic sobre los
    // días del calendario por completo.
    const calendarioHeaderBtn=root.querySelector('#lmCalendarioHeaderBtn');
    if(calendarioHeaderBtn) calendarioHeaderBtn.addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      abrirArbolNodosSemana();
    });
    root.querySelectorAll('[data-cal-nav]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        const dir=parseInt(btn.getAttribute('data-cal-nav'),10);
        if(!calendarioMesVisto){
          const base=fechaJornadaLM(Math.min(state.jornadaActual,(state.calendario||[]).length||38)) || new Date(state.fechaInicioLiga+'T00:00:00');
          calendarioMesVisto={year:base.getFullYear(), month:base.getMonth()};
        }
        let {year, month}=calendarioMesVisto;
        month+=dir;
        if(month<0){ month=11; year--; } else if(month>11){ month=0; year++; }
        calendarioMesVisto={year, month};
        render();
      });
    });
    root.querySelectorAll('[data-reclamar-nodo]').forEach(btn=>{
      btn.addEventListener('click', (e)=>{
        e.stopPropagation();
        if(typeof window.playSound==='function') window.playSound('select');
        abrirCanjeHitoNodo(btn.getAttribute('data-reclamar-nodo'), parseInt(btn.getAttribute('data-reclamar-umbral'),10));
      });
    });
    root.querySelectorAll('[data-ver-recompensa]').forEach(card=>{
      card.addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        mostrarMensajeRecompensaHito(card.getAttribute('data-ver-recompensa'), parseInt(card.getAttribute('data-ver-recompensa-umbral'),10), root);
      });
    });
    const nodosLeyendaBtn=root.querySelector('[data-nodos-leyenda]');
    if(nodosLeyendaBtn) nodosLeyendaBtn.addEventListener('click', (e)=>{
      e.stopPropagation();
      if(typeof window.playSound==='function') window.playSound('select');
      mostrarLeyendaIconosNodos();
    });
    const perfilHeader=document.getElementById('lmPerfilEquipoHeader');
    if(perfilHeader) perfilHeader.addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      perfilEquipoColapsado=!perfilEquipoColapsado;
      render();
    });
    root.querySelectorAll('[data-correo]').forEach(el=>{
      el.addEventListener('click', ()=>{
        const id=el.getAttribute('data-correo');
        if(typeof window.playSound==='function') window.playSound('select');
        const correo=(state.correoInterno||[]).find(c=>c.id===id);
        if(correo && !correo.leido){ correo.leido=true; guardarEstado(); }
        correoExpandido = correoExpandido===id ? null : id;
        render();
      });
    });
    root.querySelectorAll('[data-aceptar-oferta]').forEach(btn=>{
      btn.addEventListener('click', (e)=>{
        e.stopPropagation();
        const mailId=btn.getAttribute('data-aceptar-oferta');
        const idx=parseInt(btn.getAttribute('data-oferta-idx'),10);
        const mail=(state.correoInterno||[]).find(m=>m.id===mailId);
        const proceder=()=>{
          if(typeof window.playSound==='function') window.playSound('select');
          const r=aceptarOfertaTraspaso(mailId, idx);
          if(r && !r.ok && r.motivo) mostrarAvisoJuego(r.motivo);
          render();
        };
        if(mail && typeof window.showConfirmPopup==='function'){
          window.showConfirmPopup(`¿Aceptar la oferta de ${mail.ofertas[idx].club} por ${formatoDinero(mail.ofertas[idx].monto)}? El jugador se irá al club rival.`, proceder, 'ACEPTAR');
        } else {
          proceder();
        }
      });
    });
    root.querySelectorAll('[data-rechazar-oferta]').forEach(btn=>{
      btn.addEventListener('click', (e)=>{
        e.stopPropagation();
        const mailId=btn.getAttribute('data-rechazar-oferta');
        if(typeof window.playSound==='function') window.playSound('select');
        rechazarOfertasTraspaso(mailId);
        render();
      });
    });
    const btnInfoClub=document.getElementById('lmInfoClubBtn');
    if(btnInfoClub) btnInfoClub.addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      abrirInfoClub();
    });
    root.querySelectorAll('[data-ver-finanzas]').forEach(btn=>{
      btn.addEventListener('click', (e)=>{
        e.stopPropagation();
        if(typeof window.playSound==='function') window.playSound('select');
        abrirFinanzasDG();
      });
    });
    root.querySelectorAll('[data-ir-contratar]').forEach(btn=>{
      btn.addEventListener('click', (e)=>{
        e.stopPropagation();
        if(typeof window.playSound==='function') window.playSound('select');
        abrirTrabajadores();
      });
    });
    root.querySelectorAll('[data-ir-seguridad]').forEach(btn=>{
      btn.addEventListener('click', (e)=>{
        e.stopPropagation();
        if(typeof window.playSound==='function') window.playSound('select');
        abrirSeguridadEstadio();
      });
    });
    root.querySelectorAll('[data-abrir-sobre-correo]').forEach(btn=>{
      btn.addEventListener('click', (e)=>{
        e.stopPropagation();
        if(typeof window.playSound==='function') window.playSound('select');
        const mailId=btn.getAttribute('data-abrir-sobre-correo');
        const sobreId=btn.getAttribute('data-sobre-id');
        const jugadores=abrirSobrePorId(sobreId);
        if(!jugadores){ render(); return; }
        mostrarRevelacionSobreDesdeCorreo(jugadores, (fichadoNombre)=>{
          const mail=(state.correoInterno||[]).find(m=>m.id===mailId);
          if(mail){
            mail.resuelto=true;
            mail.resultadoTexto = fichadoNombre
              ? `Sobre abierto — fichaste a ${fichadoNombre}.`
              : 'Sobre abierto — no se fichó a nadie esta vez.';
          }
          guardarEstado();
          render();
        });
      });
    });
    root.querySelectorAll('[data-abrir-quiniela]').forEach(btn=>{
      btn.addEventListener('click', (e)=>{
        e.stopPropagation();
        if(typeof window.playSound==='function') window.playSound('select');
        abrirBoletoQuiniela();
      });
    });
    root.querySelectorAll('[data-borrar-correo]').forEach(btn=>{
      btn.addEventListener('click', (e)=>{
        e.stopPropagation();
        const mailId=btn.getAttribute('data-borrar-correo');
        if(typeof window.playSound==='function') window.playSound('select');
        borrarCorreo(mailId);
        render();
      });
    });
    const btnBorrarTodos=root.querySelector('#lmCorreoBorrarTodos');
    if(btnBorrarTodos) btnBorrarTodos.addEventListener('click', (e)=>{
      e.stopPropagation();
      if(typeof window.playSound==='function') window.playSound('select');
      const proceder=()=>{ borrarTodoElCorreo(); render(); };
      if(typeof window.showConfirmPopup==='function'){
        window.showConfirmPopup(t('lm.confirmar_borrar_todos'), proceder, t('lm.borrar_todos').toUpperCase());
      } else if(confirm(t('lm.confirmar_borrar_todos'))){
        proceder();
      }
    });
    const sortBtn=document.getElementById('lmSortBtn');
    if(sortBtn) sortBtn.addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      lmSortMode=LM_SORT_NEXT[lmSortMode];
      render();
    });
    const medicoBtn=document.getElementById('lmMedicoBtn');
    if(medicoBtn) medicoBtn.addEventListener('click', ()=>{
      if(bloqueadoPorVacante('medico')) return;
      if(typeof window.playSound==='function') window.playSound('select');
      abrirMedico();
    });
    const mantenimientoBtn=document.getElementById('lmMantenimientoBtn');
    if(mantenimientoBtn) mantenimientoBtn.addEventListener('click', ()=>{
      if(bloqueadoPorVacante('mantenimiento')) return;
      if(typeof window.playSound==='function') window.playSound('select');
      abrirMantenimiento();
    });
    const mantenimientoInfoBtn=document.getElementById('lmMantenimientoInfoBtn');
    if(mantenimientoInfoBtn) mantenimientoInfoBtn.addEventListener('click', (e)=>{
      e.stopPropagation();
      if(bloqueadoPorVacante('mantenimiento')) return;
      if(typeof window.playSound==='function') window.playSound('select');
      abrirEstadoEstadio();
    });
    const dgBtn=document.getElementById('lmDirectorGeneralBtn');
    if(dgBtn) dgBtn.addEventListener('click', ()=>{
      if(bloqueadoPorVacante('directorGeneral')) return;
      if(typeof window.playSound==='function') window.playSound('select');
      abrirDirectorGeneral();
    });
    const dgInfoBtn=document.getElementById('lmDirectorGeneralInfoBtn');
    if(dgInfoBtn) dgInfoBtn.addEventListener('click', (e)=>{
      e.stopPropagation();
      if(bloqueadoPorVacante('directorGeneral')) return;
      if(typeof window.playSound==='function') window.playSound('select');
      abrirFinanzasDG();
    });
    const ddBtn=document.getElementById('lmDirectorDeportivoBtn');
    if(ddBtn) ddBtn.addEventListener('click', ()=>{
      if(bloqueadoPorVacante('directorDeportivo')) return;
      if(typeof window.playSound==='function') window.playSound('select');
      abrirDirectorDeportivo();
    });
    const ddInfoBtn=document.getElementById('lmDirectorDeportivoInfoBtn');
    if(ddInfoBtn) ddInfoBtn.addEventListener('click', (e)=>{
      e.stopPropagation();
      if(bloqueadoPorVacante('directorDeportivo')) return;
      if(typeof window.playSound==='function') window.playSound('select');
      abrirHistorialFichajesDD();
    });
    const pfBtn=document.getElementById('lmPreparadorFisicoBtn');
    if(pfBtn) pfBtn.addEventListener('click', ()=>{
      if(bloqueadoPorVacante('preparadorFisico')) return;
      if(typeof window.playSound==='function') window.playSound('select');
      abrirPreparadorFisico();
    });
    const pfInfoBtn=document.getElementById('lmPreparadorFisicoInfoBtn');
    if(pfInfoBtn) pfInfoBtn.addEventListener('click', (e)=>{
      e.stopPropagation();
      if(bloqueadoPorVacante('preparadorFisico')) return;
      if(typeof window.playSound==='function') window.playSound('select');
      abrirHistorialPF();
    });
    root.querySelectorAll('#lmPitchBox .position').forEach(el=>{
      el.addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        manejarClicSlot(el.getAttribute('data-slot'));
      });
    });
    root.querySelectorAll('.roster-table tr[data-pid]').forEach(el=>{
      el.addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        manejarClicJugador(el.getAttribute('data-pid'));
      });
    });
    if(typeof reiniciarAvisoInactividadCampo==='function') reiniciarAvisoInactividadCampo();
  }
  // Envoltorio de seguridad: si renderInner() falla por CUALQUIER
  // motivo, en vez de dejar la pantalla en negro en silencio, se
  // muestra el error exacto directamente en pantalla — así se puede
  // ver y copiar el problema real sin necesitar herramientas de
  // desarrollador ni conexión USB.
  function render(){
    try{
      renderInner();
    }catch(e){
      console.error('Error en render() de Liga Manager:', e);
      const root=document.getElementById('ligaManagerScreen');
      if(root){
        root.innerHTML=`
          <div style="padding:24px;color:#fff;font-family:monospace;font-size:13px;line-height:1.6;max-width:100%;overflow-wrap:break-word">
            <div style="color:#e24b4a;font-size:16px;font-weight:bold;margin-bottom:12px">⚠️ Error al cargar Liga Manager</div>
            <div style="color:#ccc;margin-bottom:12px">${t('lm.copia_mensaje_dev')}</div>
            <div style="background:#1a1a1a;border:1px solid #e24b4a;border-radius:6px;padding:12px;color:#ffb3b3;user-select:text">${(e && e.message) ? e.message : String(e)}${(e && e.stack) ? '<br><br>'+e.stack.replace(/\\n/g,'<br>') : ''}</div>
          </div>`;
      }
    }
  }

  /* ---------- 12a. Selección unificada campo ↔ plantilla/banquillo,
     igual que Copa Leyendas: un clic selecciona, el siguiente clic (en
     otro jugador o en una posición) coloca/intercambia. Un jugador
     lesionado no se puede seleccionar para jugar. ---------- */
  function slotDeJugador(playerId){
    return Object.keys(state.alineacion||{}).find(s=>state.alineacion[s]===playerId) || null;
  }

  function manejarClicJugador(playerId){
    const jugador=state.plantilla.find(p=>p.id===playerId);
    // Un jugador lesionado SÍ se puede alinear — juega con más riesgo de
    // agravar la lesión (se resuelve en el propio partido), ya no se
    // bloquea aquí como antes.
    if(seleccionJugador===playerId){ seleccionJugador=null; render(); return; }
    if(seleccionJugador){
      // Si NINGUNO de los dos ocupa una posición en el campo no hay nada
      // que intercambiar sobre el campo (igual que en Copa Leyendas, dos
      // suplentes seguidos no producen swap) — mover la selección al
      // nuevo jugador en vez de deseleccionar sin más, que es lo que
      // pasaba antes y parecía que el intercambio "no hacía nada".
      const slotA=slotDeJugador(seleccionJugador), slotB=slotDeJugador(playerId);
      if(!slotA && !slotB){
        seleccionJugador=playerId;
        render();
        return;
      }
      intercambiarJugadores(seleccionJugador, playerId);
      seleccionJugador=null;
      render();
      return;
    }
    seleccionJugador=playerId;
    render();
  }

  function manejarClicSlot(slot){
    const ocupanteId=state.alineacion[slot];
    if(seleccionJugador){
      asignarJugadorASlot(seleccionJugador, slot);
      seleccionJugador=null;
      render();
      return;
    }
    if(ocupanteId){
      seleccionJugador=ocupanteId;
      render();
      return;
    }
    // Slot vacío sin selección previa: no hace nada — el jugador primero
    // selecciona a alguien de la plantilla/banquillo y luego toca aquí.
  }

  function asignarJugadorASlot(playerId, slot){
    const slotAnterior=slotDeJugador(playerId);
    const ocupanteActual=state.alineacion[slot];
    if(slotAnterior===slot) return;
    if(slotAnterior){
      if(ocupanteActual) state.alineacion[slotAnterior]=ocupanteActual;
      else delete state.alineacion[slotAnterior];
    }
    state.alineacion[slot]=playerId;
    guardarEstado();
  }

  function intercambiarJugadores(idA, idB){
    const slotA=slotDeJugador(idA), slotB=slotDeJugador(idB);
    if(slotA && slotB){ state.alineacion[slotA]=idB; state.alineacion[slotB]=idA; }
    else if(slotA && !slotB){ state.alineacion[slotA]=idB; }
    else if(!slotA && slotB){ state.alineacion[slotB]=idA; }
    guardarEstado();
  }

  /* ---------- 9c. Historial médico — modal con el listado de lesiones
     tratadas (jornada, rival, tipo, cómo se resolvió) y el progreso de
     las cartas de acumulación, más reciente primero. ---------- */
  let histTab='tratamientos';
  function abrirHistorialMedico(esModoMantener){
    const overlay=document.createElement('div');
    overlay.id='lmHistorialOverlay';
    const historial=(state.medicoHistorial||[]).slice().reverse(); // más reciente primero
    const tratamientos=historial.filter(h=>h.tipo!=='progreso');
    const totalEstrellas=NIVELES_EQUIPO_INFO.reduce((s,info)=>s+nivelDe(info.track),0);

    function pintar(){
      const filas = tratamientos.map(h=>{
        let estado;
        if(h.resuelta){
          estado=`Se recuperó gracias a <strong>${h.resueltoPor}</strong> — estuvo ${h.jornadasReales} jornada${h.jornadasReales===1?'':'s'} sin jugar`;
        } else {
          // Ojo: semanasPrevistas es la previsión del DÍA de la lesión y
          // nunca cambia — hay que mirar al jugador real para reflejar
          // que un tratamiento le ha adelantado la recuperación.
          const jugadorReal = h.jugadorId ? state.plantilla.find(p=>p.id===h.jugadorId) : null;
          const restante = jugadorReal ? jugadorReal.injuryWeeks : h.semanasPrevistas;
          const tratado = jugadorReal && restante < h.semanasPrevistas;
          estado=`<span style="color:#e24b4a">${t('lm.todavia_de_baja')}</span> (le quedan ${restante} jornada${restante===1?'':'s'}${tratado?` — <span style="color:#5dcaa5">${t('lm.tratamiento_adelantado')}</span>`:''})`;
        }
        return `<div class="lm-hist-item">
          <i class="ph ph-bold ph-first-aid-kit" style="color:${h.resuelta?'#5dcaa5':'#e24b4a'}"></i>
          <div>
            <div class="lm-hist-title">${h.jugador} — ${h.tipoLesion} <span class="lm-hist-tag">${h.severidad}</span> ${h.familia?`<span class="lm-hist-tag lm-hist-tag-familia">${h.familia==='muscular'?'muscular':'ósea'}</span>`:''}</div>
            <div class="lm-hist-meta">Jornada ${h.jornadaInicio} contra ${h.rival}</div>
            <div class="lm-hist-desc">${estado}</div>
          </div>
        </div>`;
      }).join('');

      overlay.innerHTML=`
        <div class="lm-dilemma-card lm-dilemma-card-medico" style="width:480px;max-width:90vw;text-align:left">
          ${xCerrarHTML()}
          <div class="lm-dilemma-title"><i class="ph ph-bold ph-clock-counter-clockwise"></i> HISTORIAL MÉDICO</div>
          <div class="lm-tab-content">
            <div class="lm-hist-list">
              ${tratamientos.length?filas:`<p class="lm-setup-desc" style="text-align:center">${t('lm.sin_historial_medico')}</p>`}
            </div>
          </div>
          ${esModoMantener?'':`<div class="lm-popup-actions lm-popup-actions-compact">
            <button id="lmHistorialCerrar" class="mode-card-btn mode-card-btn-gold">${t('lm.cerrar')}</button>
          </div>`}
        </div>`;
      overlay.querySelectorAll('[data-histtab]').forEach(el=>{
        el.addEventListener('click', ()=>{
          if(typeof window.playSound==='function') window.playSound('select');
          histTab=el.getAttribute('data-histtab');
          pintar();
        });
      });
      const cerrarHist=()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        overlay.remove();
      };
      const btnCerrarHist=document.getElementById('lmHistorialCerrar');
      if(btnCerrarHist) btnCerrarHist.addEventListener('click', cerrarHist);
      const xBtnHist=overlay.querySelector('[data-cerrar-x]');
      if(xBtnHist) xBtnHist.addEventListener('click', cerrarHist);
    }
    document.getElementById('ligaManagerScreen').appendChild(overlay);
    habilitarCierreOverlay(overlay, ()=>overlay.remove());
    pintar();
  }

  // Caras de dado con PIPS (puntos), no números — blancas y con esquinas
  // redondeadas, tamaño grande para que se lea de un vistazo.
  const LM_DICE_PIPS={
    1:[[50,50]],
    2:[[27,27],[73,73]],
    3:[[27,27],[50,50],[73,73]],
    4:[[27,27],[73,27],[27,73],[73,73]],
    5:[[27,27],[73,27],[50,50],[27,73],[73,73]],
    6:[[27,25],[73,25],[27,50],[73,50],[27,75],[73,75]]
  };
  function dadoPipsHTML(valor){
    const pips=LM_DICE_PIPS[valor]||LM_DICE_PIPS[1];
    return `<svg viewBox="0 0 100 100" class="lm-dice-pips-svg">${pips.map(([x,y])=>`<circle cx="${x}" cy="${y}" r="9"></circle>`).join('')}</svg>`;
  }

  // Barajado de las caras del dado — CALCO del slot-machine de selección
  // de equipos del draft de Copa Leyendas (mismos sonidos spin/reveal),
  // ahora mostrando pips en vez de números, en el mismo estilo/tamaño
  // que se usará luego para el resultado (sin caja punteada aparte).
  function iniciarBarajadoDados(container, numDados, onDone){
    const tiradasFinal=[]; for(let i=0;i<numDados;i++) tiradasFinal.push(1+Math.floor(Math.random()*6));
    container.innerHTML = Array.from({length:numDados}).map((_,i)=>
      `<div class="lm-dice-face lm-dice-face-shuffling" id="lmDiceFace${i}">${dadoPipsHTML(1+Math.floor(Math.random()*6))}</div>`
    ).join('');
    let ticks=0;
    const totalTicks=11+Math.floor(Math.random()*4); // ~950-1275ms de barajado
    const spin=setInterval(()=>{
      for(let i=0;i<numDados;i++){
        const faceEl=document.getElementById('lmDiceFace'+i);
        if(faceEl) faceEl.innerHTML=dadoPipsHTML(1+Math.floor(Math.random()*6));
      }
      if(typeof window.playSound==='function') window.playSound('spin');
      ticks++;
      if(ticks>=totalTicks){
        clearInterval(spin);
        for(let i=0;i<numDados;i++){
          const faceEl=document.getElementById('lmDiceFace'+i);
          if(faceEl){ faceEl.innerHTML=dadoPipsHTML(tiradasFinal[i]); faceEl.classList.remove('lm-dice-face-shuffling'); }
        }
        if(typeof window.playSound==='function') window.playSound('reveal');
        onDone(tiradasFinal);
      }
    },85);
  }

  // Anima UN dado concreto (reroll) con el mismo barajado, hasta fijarse
  // en un valor nuevo al azar.
  function animarRerollUnDado(faceEl, onNuevoValor){
    let ticks=0;
    const totalTicks=7+Math.floor(Math.random()*3);
    faceEl.classList.add('lm-dice-face-shuffling');
    const spin=setInterval(()=>{
      faceEl.innerHTML=dadoPipsHTML(1+Math.floor(Math.random()*6));
      if(typeof window.playSound==='function') window.playSound('spin');
      ticks++;
      if(ticks>=totalTicks){
        clearInterval(spin);
        const nuevoValor=1+Math.floor(Math.random()*6);
        faceEl.innerHTML=dadoPipsHTML(nuevoValor);
        faceEl.classList.remove('lm-dice-face-shuffling');
        if(typeof window.playSound==='function') window.playSound('reveal');
        onNuevoValor(nuevoValor);
      }
    },85);
  }

  // Texto de resultado a partir de lo que devuelven resolverCartaMedico/
  // Mantenimiento/DG/DD/resolverDilemaMedico — formas ligeramente
  // distintas, unificadas aquí en un único formateador.
  function formatearResultadoDados(r){
    if(!r) return '';
    if(r.tipo==='error'){
      return `<span style="color:#e6c94a">${r.texto}</span>`;
    }
    if(r.tipo==='directa'){
      return `Suma <strong>${r.suma}</strong> (necesitabas ${r.dificultad}+) — <span style="color:${r.exito?'#5dcaa5':'#e24b4a'}">${r.exito?'✔ ÉXITO — '+r.texto:'✘ FALLO — '+r.texto}</span>`;
    }
    if(r.tipo==='nivel'){
      return r.exito
        ? `Suma <strong>${r.suma}</strong> (necesitabas ${r.dificultad}+) — <span style="color:#5dcaa5">✔ ÉXITO</span> — ${r.nombre} sube a nivel ${r.nivelNuevo}/${NIVEL_MAXIMO_EQUIPO}${r.maxAlcanzado?` — <strong>${t('lm.nivel_maximo_alcanzado')}</strong>`:''}`
        : `Suma <strong>${r.suma}</strong> (necesitabas ${r.dificultad}+) — <span style="color:#e24b4a">✘ FALLO</span> — ${r.texto}`;
    }
    // Forma de resolverDilemaMedico (dado urgente): {suma,dificultad,exito}
    return `Suma <strong>${r.suma}</strong> (necesitabas ${r.dificultad}+) — <span style="color:${r.exito?'#5dcaa5':'#e24b4a'}">${r.exito?'✔ ÉXITO, recuperación acelerada':'✘ FALLO, sigue el tiempo previsto'}</span>`;
  }

  // Pantalla ÚNICA de resultado de una tirada — sustituye a la antigua
  // pareja "revisa tu tirada" + "resultado" (dos pantallas, dos clics
  // para lo mismo): los dados grandes con pips y la SUMA en grande se ven
  // desde el primer momento; si queda reroll disponible, cada dado es
  // tocable (con su propio barajado) para repetirlo; un único botón
  // aplica el efecto Y enseña el resultado a la vez, y solo hace falta
  // un segundo toque para cerrar y volver al hub.
  function mostrarResultadoDados(zonaEl, tiradas, resolverFn, onCerrar){
    let resultado=null;
    function pintar(){
      const suma=tiradas.reduce((a,b)=>a+b,0);
      const puedeReroll = !resultado && (state.dadoRerollsDisponibles||0)>0;
      zonaEl.innerHTML=`
        <div class="lm-dice-result-row">${tiradas.map((v,i)=>`<div class="lm-dice-face${puedeReroll?' lm-dice-face-reroll':''}" data-reroll-i="${i}" id="lmDiceResultFace${i}" ${puedeReroll?`title="${t('lm.tt_repetir_dado')}"`:''}>${dadoPipsHTML(v)}</div>`).join('')}</div>
        <div class="lm-dice-suma-grande">${suma}</div>
        ${puedeReroll?`<div class="lm-setup-desc">${t('lm.toca_dado_repetirlo')} <strong>${state.dadoRerollsDisponibles}/${lmRerollsPorPartido()}</strong></div>`:''}
        ${resultado?`<div class="lm-dice-resultado-texto">${formatearResultadoDados(resultado)}</div>`:''}
        <div class="lm-popup-actions"><button id="lmDiceAccionBtn" class="mode-card-btn mode-card-btn-gold">${resultado?'CERRAR':'CONTINUAR'}</button></div>`;
      if(puedeReroll){
        zonaEl.querySelectorAll('[data-reroll-i]').forEach(el=>{
          el.addEventListener('click', ()=>{
            if(resultado || (state.dadoRerollsDisponibles||0)<=0) return;
            const i=parseInt(el.getAttribute('data-reroll-i'),10);
            animarRerollUnDado(el, (nuevoValor)=>{
              state.dadoRerollsDisponibles--;
              tiradas[i]=nuevoValor;
              guardarEstado();
              pintar();
            });
          });
        });
      }
      document.getElementById('lmDiceAccionBtn').addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        if(!resultado){
          try{
            resultado=resolverFn(tiradas);
          }catch(e){
            console.error('Error al resolver la tirada:', e);
            resultado={tipo:'error', texto:`Hubo un problema al aplicar el resultado, pero tu tirada se ha registrado. Detalle técnico (cópialo si vuelve a pasar): ${(e&&e.message)||e}`};
          }
          if(!resultado) resultado={tipo:'error', texto:'No se pudo aplicar el resultado.'};
          pintar();
        } else {
          onCerrar(resultado);
        }
      });
    }
    pintar();
  }

  // Animación de "rerroll" sobre la propia tarjeta al cambiarla — mismo
  // espíritu que el slot-machine de selección de equipos de Copa
  // Leyendas: icono y nombre van cambiando al azar un instante (mismos
  // sonidos spin/reveal) antes de fijarse en la carta nueva de verdad.
  function animarRerollCarta(overlay, idx, catalogo, onDone){
    const cardEl = overlay.querySelector(`.med-card[data-idx="${idx}"]`);
    if(!cardEl){ onDone(); return; }
    const iconEl = cardEl.querySelector('.med-card-icon');
    const titleEl = cardEl.querySelector('.med-card-title');
    const tagEl = cardEl.querySelector('.med-card-tag');
    const descEl = cardEl.querySelector('.med-card-desc');
    const dificultadEl = cardEl.querySelector('.med-card-dificultad');
    const swapBtn = cardEl.querySelector('.med-card-swap');
    if(!iconEl || !titleEl){ onDone(); return; }
    if(swapBtn) swapBtn.disabled=true;
    cardEl.classList.add('med-card-spinning');
    let ticks=0;
    const totalTicks=9+Math.floor(Math.random()*3); // ~810-1080ms de barajado
    const spin=setInterval(()=>{
      const rnd=catalogo[Math.floor(Math.random()*catalogo.length)];
      iconEl.className=`ph ph-bold ${rnd.icon} med-card-icon`;
      titleEl.textContent=rnd.nombre;
      if(tagEl) tagEl.textContent = rnd.tipo==='nivel' ? t('lm.tag_proyecto') : (rnd.tipo==='sobre' ? t('lm.tag_proyecto_especial') : t('lm.tag_accion'));
      if(descEl) descEl.textContent = rnd.desc;
      // La dificultad también tiene que barajarse en vivo como el
      // resto de elementos de la carta — antes se quedaba parada en
      // el valor de la carta anterior hasta que el sorteo terminaba
      // del todo, dando la sensación de que ese dato no rerolleaba.
      // Aquí se usa el valor base del catálogo (sin el bono de
      // estrellas del trabajador, que no aplica igual a todo tipo de
      // carta) — el valor final correcto, ya con el bono aplicado, se
      // pinta al asentarse el sorteo, como siempre.
      if(dificultadEl && typeof rnd.dificultad==='number'){
        dificultadEl.textContent=`${t('lm.dificultad_lbl')} ${rnd.dificultad}+`;
      }
      if(typeof window.playSound==='function') window.playSound('spin');
      ticks++;
      if(ticks>=totalTicks){
        clearInterval(spin);
        cardEl.classList.remove('med-card-spinning');
        if(typeof window.playSound==='function') window.playSound('reveal');
        onDone();
      }
    },90);
  }

  // Ficha horizontal de un puesto del cuerpo técnico, para la barra
  // superior "CUERPO TÉCNICO" — foto (con el género correcto o la
  // variante en blanco y negro si está vacante), rol, nombre de quien lo
  // ocupa y su nivel en estrellas, con badge de aviso y burbuja de info.
  // Columnas intercambiables (solo escritorio) — flechitas ‹ › en la
  // esquina de cada columna para moverla a izquierda/derecha. El nuevo
  // orden se ve al instante, pero solo se GUARDA en el estado si pasa 1
  // minuto entero sin que el usuario vuelva a tocar nada (debounce), para
  // no escribir en cada clic mientras está todavía "probando" el orden.
  function moverColumna(key, direccion){
    if(!state.ordenColumnas || state.ordenColumnas.length!==4) state.ordenColumnas=['left','center','right','staff'];
    const arr=state.ordenColumnas;
    const idx=arr.indexOf(key);
    const nuevoIdx=idx+direccion;
    if(idx<0 || nuevoIdx<0 || nuevoIdx>=arr.length) return;
    const tmp=arr[idx]; arr[idx]=arr[nuevoIdx]; arr[nuevoIdx]=tmp;
    if(ordenColumnasSaveTimer) clearTimeout(ordenColumnasSaveTimer);
    ordenColumnasSaveTimer=setTimeout(()=>{ guardarEstado(); ordenColumnasSaveTimer=null; }, 60000);
    acabaDeReordenarColumnas=true;
    render();
  }
  function columnaControlesHTML(key){
    const arr=state.ordenColumnas||['left','center','right','staff'];
    const idx=arr.indexOf(key);
    const esPrimera=idx<=0, esUltima=idx>=arr.length-1;
    return `<div class="lm-col-reorder">
      <button class="lm-col-arrow" data-mover-col="${key}" data-mover-dir="-1" ${esPrimera?'disabled':''} title="${t('lm.tt_mover_izquierda')}">‹</button>
      <button class="lm-col-arrow" data-mover-col="${key}" data-mover-dir="1" ${esUltima?'disabled':''} title="${t('lm.tt_mover_derecha')}">›</button>
    </div>`;
  }
  function columnaOrderStyle(key){
    const arr=state.ordenColumnas||['left','center','right','staff'];
    const idx=arr.indexOf(key);
    return idx>=0 ? `order:${idx}` : '';
  }

  function staffTileHTML(rol, o){
    const trab=state.trabajadores[rol];
    return `
    <div class="lm-staff-tile ${o.acento||''} ${trab?'':'lm-staff-tile-vacante'}" id="${o.btnId}">
      <i class="ph ph-bold ${o.icono} lm-staff-tile-rol-icon"></i>
      <div class="lm-staff-tile-photo">
        ${staffFotoHTML(o.carpeta, o.archivo, o.alt, o.icono, trab?trab.genero:'hombre', !trab, trab?trab.fotoVariante:1)}
        ${o.notif?`<span class="lm-staff-tile-badge">${o.badgeTexto}</span>`:''}
        <button class="lm-staff-tile-info-btn" id="${o.infoId}" title="${o.infoTitle}"><i class="ph ph-bold ph-info"></i></button>
        <div class="lm-staff-tile-photo-fade"></div>
      </div>
      <div class="lm-staff-tile-body">
        <div class="lm-staff-tile-rol">${o.rolLabel}</div>
        <div class="lm-staff-tile-nombre">${trab?trab.nombre:'VACANTE'}</div>
        ${trab?`<div class="lm-staff-tile-estrellas">${estrellasNivel(trab.nivel, 3)}</div>`:`<div class="lm-staff-tile-vacante-txt">${t('lm.contratar_en_trabajadores')}</div>`}
        <div class="lm-staff-tile-desc">${o.desc}</div>
      </div>
    </div>`;
  }

  function abrirMedico(){
    const overlay=document.createElement('div');
    overlay.id='lmMedicoOverlay';
    document.getElementById('ligaManagerScreen').appendChild(overlay);
    habilitarCierreOverlay(overlay, ()=>{ overlay.remove(); render(); });
    // Delegado: cualquier X que aparezca dentro de este overlay en
    // cualquier pantalla (selector de dados, tirada, etc.) lo cierra.
    overlay.addEventListener('click', (e)=>{
      const xEl = e.target.closest && e.target.closest('[data-cerrar-x]');
      if(xEl){ if(typeof window.playSound==='function') window.playSound('select'); overlay.remove(); render(); }
    });

    function jugadoresLesionadosPara(def){
      if(!def.requiereLesion) return [];
      return state.plantilla.filter(p=>p.injured && (def.requiereLesion==='grave' ? p.injurySeverity==='grave' : true));
    }

    function renderHub(){
      let notif=state.medicoNotificacion;
      let jugadorUrgente=notif?state.plantilla.find(p=>p.id===notif.jugadorId):null;
      if(notif && (!jugadorUrgente || !jugadorUrgente.injured)){
        state.medicoNotificacion=null;
        notif=null; jugadorUrgente=null;
      }

      const cartasHTML=state.medicoCartas.map((instancia,idx)=>{
        const def=cartaDef(instancia.cartaId);
        const candidatos=jugadoresLesionadosPara(def);
        const sinLesionNecesaria = def.requiereLesion && candidatos.length===0;
        const dificultadEfectiva = def.tipo==='nivel' ? dificultadActualNivel(def) : Math.max(3, def.dificultad - bonusEstrellasTrabajador('medico'));
        const maxPosible = state.diceAvailable*6;
        const imposiblePorDados = (def.tipo==='directa'||def.tipo==='nivel') && maxPosible < dificultadEfectiva;
        const nivelMaximoYa = def.tipo==='nivel' && nivelDe(def.track)>=NIVEL_MAXIMO_EQUIPO;
        const bloqueada = sinLesionNecesaria || imposiblePorDados || nivelMaximoYa;
        const cambioDisponible=(state.medicoCambiosUsados||0)<lmCambiosCartaPorPartido();
        let cuerpo;
        if(def.tipo==='nivel'){
          const n=nivelDe(def.track);
          cuerpo=`<div class="med-card-progress-label" style="text-align:center;letter-spacing:2px;color:var(--gold)">${estrellasNivel(n)}</div>
                  <div class="med-card-dificultad">${t('lm.dificultad_lbl')} ${dificultadEfectiva}+ ${t('lm.para_subir_a_nivel')} ${n+1}/${NIVEL_MAXIMO_EQUIPO}</div>`;
        } else if(def.tipo==='acumulacion'){
          const umbral=def.niveles[instancia.nivelActual-1];
          cuerpo=`<div class="med-card-progress"><div class="med-card-progress-fill" style="width:${Math.min(100,100*instancia.progreso/umbral)}%"></div></div>
                  <div class="med-card-progress-label">${t('lm.nivel_n_de_x')} ${instancia.nivelActual}/${def.niveles.length} — ${instancia.progreso}/${umbral}</div>`;
        } else {
          cuerpo=`<div class="med-card-dificultad">Dificultad ${Math.max(3, def.dificultad - bonusEstrellasTrabajador('medico'))}+</div>`;
        }
        return `
        <div class="med-card med-card-medico ${bloqueada?'med-card-bloqueada':''}" data-idx="${idx}">
          <button class="med-card-swap" data-swap="${idx}" title="${t('lm.tt_cambiar_carta')}" ${cambioDisponible?'':'disabled'}><i class="ph ph-bold ph-arrows-clockwise"></i></button>
          <div class="med-card-tag">${def.tipo==='nivel'?t('lm.tag_proyecto'):(def.tipo==='acumulacion'?t('lm.tag_proyecto'):t('lm.tag_accion'))}</div>
          <i class="ph ph-bold ${def.icon} med-card-icon"></i>
          <div class="med-card-title">${tc('med', def.id, 'nombre', def.nombre)}</div>
          <div class="med-card-divider"></div>
          <div class="med-card-desc">${tc('med', def.id, 'desc', def.desc)}</div>
          ${cuerpo}
          ${bloqueada?`<div class="med-card-bloqueada-label">${sinLesionNecesaria?t('lm.necesita_lesion_activa'):(nivelMaximoYa?t('lm.especialidad_maxima'):t('lm.imposible_dados'))}</div>`:`<button class="mode-card-btn mode-card-btn-gold med-card-btn" data-usar="${idx}" style="padding:7px;font-size:11px">${t('lm.usar_btn')}</button>`}
        </div>`;
      }).join('');

      overlay.innerHTML=`
        <div class="lm-dilemma-card lm-dilemma-card-medico" style="max-width:640px">
          ${xCerrarHTML()}
          <div class="lm-dilemma-title"><i class="ph ph-bold ph-first-aid-kit"></i> ${t('lm.titulo_medico')}</div>
          ${notif?`
          <div class="lm-urgente-row">
            <div class="lm-urgente-texto"><strong style="color:#e24b4a">${t('lm.urgente')}</strong> ${jugadorUrgente?jugadorUrgente.name:'Un jugador'} tiene una lesión ${notif.severidad}.</div>
            ${(state.diceAvailable*6 < notif.dificultad)
              ? `<div class="med-card-bloqueada-label" style="margin:0">${t('lm.imposible_dados')}</div>`
              : `<button id="lmAtenderUrgente" class="mode-card-btn mode-card-btn-gold">ATENDER (sumar ${notif.dificultad}+)</button>`}
          </div>` : ''}
          ${renderNivelesEquipoHTML()}
          <div class="lm-staff-bar-capital" style="justify-content:center;margin:10px 0 8px"><span><i class="ph ph-bold ph-dice-five"></i> ${t('lm.dados')}: <strong>${state.diceAvailable}</strong></span><span><i class="ph ph-bold ph-arrows-clockwise"></i> ${t('lm.rerrolls')}: <strong>${state.dadoRerollsDisponibles||0}</strong></span><span><i class="ph ph-bold ph-cards"></i> ${t('lm.cambios')}: <strong>${Math.max(0,lmCambiosCartaPorPartido()-(state.medicoCambiosUsados||0))}/${lmCambiosCartaPorPartido()}</strong></span></div>
          <div class="med-card-grid">${cartasHTML}</div>
          <div class="lm-popup-actions lm-popup-actions-compact">
            ${mostrarInfoHTML()}
            <button id="lmMedicoCerrar" class="mode-card-btn mode-card-btn-secondary">${t('lm.cerrar')}</button>
          </div>
        </div>`;

      wireMostrarInfoHold(overlay, abrirHistorialMedico, 'lmHistorialOverlay');
      const xBtnMed=overlay.querySelector('[data-cerrar-x]');
      if(xBtnMed) xBtnMed.addEventListener('click', ()=>{ overlay.remove(); render(); });
      const cerrarBtn=document.getElementById('lmMedicoCerrar');
      if(cerrarBtn) cerrarBtn.addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        overlay.remove();
        render();
      });

      const atenderBtn=document.getElementById('lmAtenderUrgente');
      if(atenderBtn) atenderBtn.addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        renderSelectorUrgente();
      });
      overlay.querySelectorAll('[data-swap]').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const idx=parseInt(btn.getAttribute('data-swap'),10);
          if((state.medicoCambiosUsados||0)>=lmCambiosCartaPorPartido()) return;
          if(typeof window.playSound==='function') window.playSound('select');
          animarRerollCarta(overlay, idx, MEDICO_CARTAS_BASE, ()=>{
            cambiarCartaMedico(idx);
            renderHub();
          });
        });
      });
      overlay.querySelectorAll('[data-usar]').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const idx=parseInt(btn.getAttribute('data-usar'),10);
          if(typeof window.playSound==='function') window.playSound('select');
          const def=cartaDef(state.medicoCartas[idx].cartaId);
          const candidatos=jugadoresLesionadosPara(def);
          if(def.requiereLesion && candidatos.length>1){
            renderSelectorJugador(idx, candidatos);
          } else {
            renderSelectorCarta(idx, candidatos[0]?candidatos[0].id:null);
          }
        });
      });
    }

    function renderSelectorJugador(idx, candidatos){
      overlay.innerHTML=`
        <div class="lm-dilemma-card lm-dilemma-card-medico">
            ${xCerrarHTML()}
          <div class="lm-dilemma-title" style="justify-content:center;text-align:center">¿SOBRE QUIÉN?</div>
          <div class="lm-slot-list">
            ${candidatos.map(p=>`<div class="lm-slot-option" data-pid="${p.id}"><span>${p.name}</span><span style="color:#e24b4a">${p.injurySeverity} · ${p.injuryWeeks} jornada${p.injuryWeeks===1?'':'s'} restante${p.injuryWeeks===1?'':'s'}</span></div>`).join('')}
          </div>
        </div>`;
      overlay.querySelectorAll('[data-pid]').forEach(el=>{
        el.addEventListener('click', ()=>{
          if(typeof window.playSound==='function') window.playSound('select');
          renderSelectorCarta(idx, el.getAttribute('data-pid'));
        });
      });
    }

    function renderSelectorCarta(idx, jugadorObjetivoId){
      const def=cartaDef(state.medicoCartas[idx].cartaId);
      const jugadorObjetivo = jugadorObjetivoId ? state.plantilla.find(p=>p.id===jugadorObjetivoId) : null;
      let dadosElegidos=Math.min(1, state.diceAvailable);
      function pintar(){
        overlay.innerHTML=`
          <div class="lm-dilemma-card lm-dilemma-card-medico">
            ${xCerrarHTML()}
            <i class="ph ph-bold ${def.icon}" style="font-size:26px;color:#5dcaa5"></i>
            <div class="lm-dilemma-title" style="justify-content:center;text-align:center">${tc('med', def.id, 'nombre', def.nombre).toUpperCase()}</div>
            <div class="lm-dilemma-text">${tc('med', def.id, 'desc', def.desc)}${def.tipo==='directa'?` — necesitas sumar <strong class="lm-dificultad-destacada">${Math.max(3, def.dificultad - bonusEstrellasTrabajador('medico'))}+</strong>`:(def.tipo==='nivel'?` — necesitas sumar <strong class="lm-dificultad-destacada">${dificultadActualNivel(def)}+</strong> para subir a nivel ${nivelDe(def.track)+1}/${NIVEL_MAXIMO_EQUIPO}`:' — los dados invertidos siempre suman al proyecto')}</div>
            ${jugadorObjetivo?`<div class="lm-setup-desc" style="margin-top:-4px"><strong>${jugadorObjetivo.name}</strong> — ${jugadorObjetivo.injurySeverity} · ${jugadorObjetivo.injuryWeeks} ${t('lm.jornada').toLowerCase()}${jugadorObjetivo.injuryWeeks===1?'':'s'} restante${jugadorObjetivo.injuryWeeks===1?'':'s'}</div>`:''}
            <div class="lm-dice-selector">
              <button id="lmDiceMinus" class="lm-dice-stepper">−</button>
              <span id="lmDiceCount">${dadosElegidos}</span>
              <button id="lmDicePlus" class="lm-dice-stepper">+</button>
            </div>
            <div class="lm-setup-desc">dados disponibles: ${state.diceAvailable}</div>
            <div class="lm-popup-actions">
              <button id="lmTirarBtn" class="mode-card-btn mode-card-btn-gold" ${state.diceAvailable<1?'disabled':''}>TIRAR ${dadosElegidos} DADO${dadosElegidos>1?'S':''}</button>
              <button id="lmCancelarCartaBtn" class="lm-btn-cancelar">${t('lm.cancelar')}</button>
            </div>
          </div>`;
        const minus=document.getElementById('lmDiceMinus');
        const plus=document.getElementById('lmDicePlus');
        const tirarBtn=document.getElementById('lmTirarBtn');
        const cancelarBtn=document.getElementById('lmCancelarCartaBtn');
        if(minus) minus.addEventListener('click', ()=>{ if(dadosElegidos>1){ dadosElegidos--; pintar(); } });
        if(plus) plus.addEventListener('click', ()=>{ if(dadosElegidos<state.diceAvailable){ dadosElegidos++; pintar(); } });
        if(cancelarBtn) cancelarBtn.addEventListener('click', ()=>{
          if(typeof window.playSound==='function') window.playSound('select');
          renderHub();
        });
        if(tirarBtn) tirarBtn.addEventListener('click', ()=>{
          if(typeof window.playSound==='function') window.playSound('select');
          renderRolloCarta(idx, dadosElegidos, jugadorObjetivoId);
        });
      }
      pintar();
    }

    // Barajado 2D de las caras del dado — CALCO del slot-machine que ya se
    function renderRolloCarta(idx, numDados, jugadorObjetivoId){
      const cartaObjetivo=cartaDef(state.medicoCartas[idx].cartaId);
      const dificultadObjetivo = cartaObjetivo.tipo==='directa'
        ? Math.max(3, cartaObjetivo.dificultad - bonusEstrellasTrabajador('medico'))
        : (cartaObjetivo.tipo==='nivel' ? dificultadActualNivel(cartaObjetivo) : null);
      overlay.innerHTML=`
        <div class="lm-dilemma-card lm-dilemma-card-medico lm-dice-roll-card">
            ${xCerrarHTML()}
          <div class="lm-dilemma-title" id="lmDiceTitle" style="justify-content:center;text-align:center">TIRANDO ${numDados} DADO${numDados>1?'S':''}...</div>
          ${dificultadObjetivo!==null?`<div class="lm-dice-objetivo lm-dice-objetivo-medico">${t('lm.necesitas_sumar')} <strong>${dificultadObjetivo}+</strong></div>`:''}
          <div id="lmDice2DRow" class="lm-dice2d-row"></div>
          <div id="lmDiceResultZone"></div>
        </div>`;
      const box=document.getElementById('lmDice2DRow');
      iniciarBarajadoDados(box, numDados, (tiradas)=>{
        const tituloEl=document.getElementById('lmDiceTitle');
        if(tituloEl) tituloEl.textContent='TU TIRADA';
        box.innerHTML='';
        const zona=document.getElementById('lmDiceResultZone');
        mostrarResultadoDados(zona, tiradas,
          (tiradasFinales)=>{
            state.diceAvailable=Math.max(0, state.diceAvailable-numDados);
            return resolverCartaMedico(idx, tiradasFinales, jugadorObjetivoId);
          },
          ()=>{ renderHub(); }
        );
      });
    }

    // ---- Flujo de la notificación urgente (lesión recién ocurrida) ----
    function renderSelectorUrgente(){
      const jugador=state.plantilla.find(p=>p.id===state.medicoNotificacion.jugadorId);
      const dificultad=state.medicoNotificacion.dificultad;
      let dadosElegidos=Math.min(1, state.diceAvailable);
      function pintar(){
        overlay.innerHTML=`
          <div class="lm-dilemma-card lm-dilemma-card-medico">
            ${xCerrarHTML()}
            <i class="ph ph-bold ph-first-aid-kit" style="font-size:26px;color:#e24b4a"></i>
            <div class="lm-dilemma-title" style="justify-content:center;text-align:center">${t('lm.medico_te_consulta')}</div>
            <div class="lm-dilemma-text">${jugador?jugador.name:'Un jugador'} tiene una lesión ${state.medicoNotificacion.severidad}. Necesitas sumar <strong class="lm-dificultad-destacada">${dificultad}+</strong> para acelerar su recuperación.</div>
            <div class="lm-dice-selector">
              <button id="lmDiceMinus" class="lm-dice-stepper">−</button>
              <span id="lmDiceCount">${dadosElegidos}</span>
              <button id="lmDicePlus" class="lm-dice-stepper">+</button>
            </div>
            <div class="lm-setup-desc">dados disponibles: ${state.diceAvailable}</div>
            <div class="lm-popup-actions">
              <button id="lmTirarBtn" class="mode-card-btn mode-card-btn-gold" ${state.diceAvailable<1?'disabled':''}>TIRAR ${dadosElegidos} DADO${dadosElegidos>1?'S':''}</button>
            </div>
          </div>`;
        const minus=document.getElementById('lmDiceMinus');
        const plus=document.getElementById('lmDicePlus');
        const tirarBtn=document.getElementById('lmTirarBtn');
        if(minus) minus.addEventListener('click', ()=>{ if(dadosElegidos>1){ dadosElegidos--; pintar(); } });
        if(plus) plus.addEventListener('click', ()=>{ if(dadosElegidos<state.diceAvailable){ dadosElegidos++; pintar(); } });
        if(tirarBtn) tirarBtn.addEventListener('click', ()=>{
          if(typeof window.playSound==='function') window.playSound('select');
          renderRolloUrgente(dadosElegidos);
        });
      }
      pintar();
    }

    function renderRolloUrgente(numDados){
      overlay.innerHTML=`
        <div class="lm-dilemma-card lm-dilemma-card-medico lm-dice-roll-card">
            ${xCerrarHTML()}
          <div class="lm-dilemma-title" id="lmDiceTitle" style="justify-content:center;text-align:center">TIRANDO ${numDados} DADO${numDados>1?'S':''}...</div>
          <div id="lmDice2DRow" class="lm-dice2d-row"></div>
          <div id="lmDiceResultZone"></div>
        </div>`;
      const box=document.getElementById('lmDice2DRow');
      iniciarBarajadoDados(box, numDados, (tiradas)=>{
        const tituloEl=document.getElementById('lmDiceTitle');
        if(tituloEl) tituloEl.textContent='TU TIRADA';
        box.innerHTML='';
        const zona=document.getElementById('lmDiceResultZone');
        mostrarResultadoDados(zona, tiradas,
          (tiradasFinales)=>resolverDilemaMedico(numDados, tiradasFinales),
          ()=>{ renderHub(); render(); }
        );
      });
    }

    renderHub();
  }

  /* ---------- 13b. Interfaz de Mantenimiento y Seguridad — mismo patrón que el
     equipo médico (misma mano de 3 cartas, mismo fondo de dados
     compartido, mismo barajado 2D), pero sin selección de jugador ya
     que las cartas actúan directamente sobre el estadio. ---------- */
  function abrirSeguridadEstadio(){
    const overlay=document.createElement('div');
    overlay.id='lmSeguridadEstadioOverlay';
    function pintar(){
      const contratados=state.guardiasContratados||0;
      const disponibles=guardiasDisponibles();
      const salario=guardiaSalarioActual();
      const bloqueado = state.guardiasConfigGuardadaEnJornada===state.jornadaActual;
      overlay.innerHTML=`
        <div class="lm-dilemma-card lm-seguridad-card">
          ${xCerrarHTML()}
          <div class="lm-dilemma-title"><i class="ph ph-bold ph-shield-check"></i> ${t('lm.seguridad_estadio')}</div>
          <div style="margin-bottom:10px">
            <div style="display:flex;justify-content:space-between;font-size:10px;color:#999;margin-bottom:2px"><span><i class="ph ph-bold ph-grass"></i> ${t('lm.estado_cesped')}</span><span>${(state.estadio&&state.estadio.campo)||0}%</span></div>
            ${campoBarraHTML((state.estadio&&state.estadio.campo)||0, true)}
          </div>
          <div class="lm-seguridad-resumen">
            <div class="lm-seguridad-resumen-item">
              <i class="ph ph-bold ph-users-three"></i>
              <div><div class="lm-seguridad-resumen-val">${contratados}</div><div class="lm-seguridad-resumen-label">${t('lm.guardias_contratados')}</div></div>
            </div>
            <div class="lm-seguridad-resumen-item">
              <i class="ph ph-bold ph-user-plus"></i>
              <div><div class="lm-seguridad-resumen-val">${disponibles}</div><div class="lm-seguridad-resumen-label">${t('lm.sin_asignar')}</div></div>
            </div>
            <div class="lm-seguridad-resumen-item">
              <i class="ph ph-bold ph-coins"></i>
              <div><div class="lm-seguridad-resumen-val">${formatoDinero(salario)}</div><div class="lm-seguridad-resumen-label">${t('lm.sueldo_guardia_mes')}</div></div>
            </div>
          </div>
          <div class="lm-seguridad-contratar-row">
            <button id="lmContratarGuardiaBtn" class="mode-card-btn mode-card-btn-gold"><i class="ph ph-bold ph-plus"></i> ${t('lm.contratar_guardia')}</button>
            <button id="lmDespedirGuardiaBtn" class="mode-card-btn mode-card-btn-secondary" ${disponibles<=0?'disabled':''}><i class="ph ph-bold ph-minus"></i> ${t('lm.despedir_uno_libre')}</button>
          </div>
          <div class="lm-seguridad-mapa-wrap">
            <img src="assets/estadio/gradas.png" alt="Estadio" class="lm-seguridad-mapa-img">
            ${LM_ZONAS_ESTADIO.map(z=>{
              const guardiasZona=state.guardiasZonas[z.id]||0;
              const nivel=state.disturbiosZonas[z.id]||0;
              const color=LM_DISTURBIO_COLOR[nivel];
              const claseLado = z.left<40 ? 'lm-zona-marcador-izq' : (z.left>60 ? 'lm-zona-marcador-der' : '');
              return `<div class="lm-zona-marcador ${claseLado} ${nivel===3?'lm-zona-marcador-grave':''}" style="left:${z.left}%;top:${z.top}%;${color?`--zona-color:${color}`:''}">
                ${color?`<div class="lm-zona-tinte" style="background:${color}"></div>`:''}
                <div class="lm-zona-etiqueta">
                  <div class="lm-zona-nombre">${z.label}</div>
                  ${nivel>0?`<div class="lm-zona-disturbio" style="color:${color}">${LM_DISTURBIO_LABEL[nivel]}</div>`:''}
                  <div class="lm-zona-guardias-fila">
                    <button class="lm-zona-btn" data-zona-quitar="${z.id}" ${(guardiasZona<=0||bloqueado)?'disabled':''}><i class="ph ph-bold ph-minus"></i></button>
                    <span class="lm-zona-guardias-num"><i class="ph ph-bold ph-shield"></i> ${guardiasZona}/3</span>
                    <button class="lm-zona-btn" data-zona-anadir="${z.id}" ${(guardiasZona>=3||disponibles<=0||bloqueado)?'disabled':''}><i class="ph ph-bold ph-plus"></i></button>
                  </div>
                </div>
              </div>`;
            }).join('')}
          </div>
          <div class="lm-seguridad-mapa-mini-wrap">
            <img src="assets/estadio/gradas.png" alt="Estadio" class="lm-seguridad-mapa-mini">
            ${LM_ZONAS_ESTADIO.map(z=>`<button type="button" class="lm-zona-hotspot" data-zona-jump="${z.id}" style="left:${z.left}%;top:${z.top}%;width:${z.w}%;height:${z.h}%" aria-label="${z.label}"></button>`).join('')}
          </div>
          <div class="lm-seguridad-lista-movil">
            ${LM_ZONAS_ESTADIO.map(z=>{
              const guardiasZona=state.guardiasZonas[z.id]||0;
              const nivel=state.disturbiosZonas[z.id]||0;
              const color=LM_DISTURBIO_COLOR[nivel];
              return `<div class="lm-zona-fila-movil" id="lmZonaFila_${z.id}" ${color?`style="--zona-color:${color}"`:''}>
                <div class="lm-zona-fila-color ${nivel===3?'lm-zona-fila-color-grave':''}" style="background:${color||'#333'}"></div>
                <div class="lm-zona-fila-info">
                  <div class="lm-zona-fila-nombre">${z.label}</div>
                  <div class="lm-zona-fila-estado" style="color:${color||'#666'}">${nivel>0?LM_DISTURBIO_LABEL[nivel]:t('lm.disturbio_0')}</div>
                </div>
                <button class="lm-zona-btn-movil" data-zona-quitar="${z.id}" ${(guardiasZona<=0||bloqueado)?'disabled':''}><i class="ph ph-bold ph-minus"></i></button>
                <span class="lm-zona-fila-num"><i class="ph ph-bold ph-shield"></i> ${guardiasZona}/3</span>
                <button class="lm-zona-btn-movil" data-zona-anadir="${z.id}" ${(guardiasZona>=3||disponibles<=0||bloqueado)?'disabled':''}><i class="ph ph-bold ph-plus"></i></button>
              </div>`;
            }).join('')}
          </div>
          <div class="lm-setup-desc" style="text-align:center;margin-top:8px">${t('lm.zonas_sin_guardia_desc')}</div>
          ${state.guardiasConfigGuardadaEnJornada===state.jornadaActual?`<div class="lm-setup-desc" style="text-align:center;color:var(--gold)"><i class="ph ph-bold ph-lock-simple"></i> ${t('lm.guardias_bloqueado_desc')}</div>`:''}
          <div class="lm-popup-actions lm-popup-actions-compact">
            <button id="lmSeguridadGuardarBtn" class="mode-card-btn mode-card-btn-gold" ${state.guardiasConfigGuardadaEnJornada===state.jornadaActual?'disabled':''}><i class="ph ph-bold ph-floppy-disk"></i> ${t('lm.guardar_btn')}</button>
            <button id="lmSeguridadCerrarBtn" class="mode-card-btn mode-card-btn-secondary">${t('lm.cerrar')}</button>
          </div>
        </div>`;
      document.getElementById('lmContratarGuardiaBtn').addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        contratarGuardia();
        pintar();
      });
      const despedirBtn=document.getElementById('lmDespedirGuardiaBtn');
      if(despedirBtn) despedirBtn.addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        // La primera vez que se intenta despedir a un guardia en toda
        // la partida, se avisa de la consecuencia real (el finiquito)
        // y se pide confirmación explícita — a partir de ahí, ya no
        // se vuelve a preguntar, se despide directamente.
        if(!state.avisoFiniquitoGuardiaMostrado){
          mostrarAvisoDespedirGuardia(()=>{
            despedirGuardiaDisponible();
            pintar();
          });
          return;
        }
        despedirGuardiaDisponible();
        pintar();
      });
      const guardarBtn=document.getElementById('lmSeguridadGuardarBtn');
      if(guardarBtn) guardarBtn.addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('victory');
        // Guardar aplica un efecto calmante real e inmediato a toda
        // zona que tenga guardias asignados (no solo evita que
        // empeore, como ya hacía el sistema de fondo — ahora también
        // mejora directamente en el momento) y bloquea la colocación
        // hasta el siguiente partido, para que el efecto se note de
        // verdad y no se pueda reconfigurar sin parar.
        LM_ZONAS_ESTADIO.forEach(z=>{
          const guardiasZona=state.guardiasZonas[z.id]||0;
          const nivelActual=state.disturbiosZonas[z.id]||0;
          if(guardiasZona>0 && nivelActual>0){
            state.disturbiosZonas[z.id]=Math.max(0, nivelActual-1);
          }
        });
        state.guardiasConfigGuardadaEnJornada=state.jornadaActual;
        guardarEstado();
        if(typeof showToast==='function') showToast(t('lm.guardias_guardado_aviso'));
        pintar();
      });
      overlay.querySelectorAll('[data-zona-jump]').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          if(typeof window.playSound==='function') window.playSound('select');
          const fila=document.getElementById('lmZonaFila_'+btn.getAttribute('data-zona-jump'));
          if(fila){
            fila.scrollIntoView({behavior:'smooth', block:'center'});
            fila.classList.add('lm-zona-fila-resaltada');
            setTimeout(()=>fila.classList.remove('lm-zona-fila-resaltada'), 1600);
          }
        });
      });
      overlay.querySelectorAll('[data-zona-anadir]').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          if(typeof window.playSound==='function') window.playSound('select');
          asignarGuardiaZona(btn.getAttribute('data-zona-anadir'));
          pintar();
        });
      });
      overlay.querySelectorAll('[data-zona-quitar]').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          if(typeof window.playSound==='function') window.playSound('select');
          quitarGuardiaZona(btn.getAttribute('data-zona-quitar'));
          pintar();
        });
      });
      habilitarCierreOverlay(overlay, ()=>overlay.remove());
      const xBtn=overlay.querySelector('[data-cerrar-x]');
      if(xBtn) xBtn.addEventListener('click', ()=>overlay.remove());
      document.getElementById('lmSeguridadCerrarBtn').addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        overlay.remove();
      });
    }
    document.getElementById('ligaManagerScreen').appendChild(overlay);
    pintar();
  }

  function abrirMantenimiento(){
    const overlay=document.createElement('div');
    overlay.id='lmMantenimientoOverlay';
    document.getElementById('ligaManagerScreen').appendChild(overlay);
    habilitarCierreOverlay(overlay, ()=>{ overlay.remove(); render(); });
    // Delegado: cualquier X que aparezca dentro de este overlay en
    // cualquier pantalla (selector de dados, tirada, etc.) lo cierra.
    overlay.addEventListener('click', (e)=>{
      const xEl = e.target.closest && e.target.closest('[data-cerrar-x]');
      if(xEl){ if(typeof window.playSound==='function') window.playSound('select'); overlay.remove(); render(); }
    });

    function renderHub(){
      const est=state.estadio||{campo:90,satisfaccion:0};
      const cartasHTML=state.mantenimientoCartas.map((instancia,idx)=>{
        const def=cartaDefM(instancia.cartaId);
        const bloqueadaPorEstado=mantenimientoBloqueadaPorEstado(def);
        const dificultadEfectiva = def.tipo==='nivel' ? dificultadActualNivelM(def) : Math.max(3, def.dificultad - bonusEstrellasTrabajador('mantenimiento'));
        const maxPosible = state.diceAvailable*6;
        const imposiblePorDados = maxPosible < dificultadEfectiva;
        const nivelMaximoYa = def.tipo==='nivel' && nivelDeM(def.track)>=NIVEL_MAXIMO_EQUIPO;
        const bloqueada = bloqueadaPorEstado || imposiblePorDados || nivelMaximoYa;
        const cambioDisponible=(state.mantenimientoCambiosUsados||0)<lmCambiosCartaPorPartido();
        let cuerpo;
        if(def.tipo==='nivel'){
          const n=nivelDeM(def.track);
          cuerpo=`<div class="med-card-progress-label" style="text-align:center;letter-spacing:2px;color:var(--gold)">${estrellasNivel(n)}</div>
                  <div class="med-card-dificultad">${t('lm.dificultad_lbl')} ${dificultadEfectiva}+ ${t('lm.para_subir_a_nivel')} ${n+1}/${NIVEL_MAXIMO_EQUIPO}</div>`;
        } else {
          cuerpo=`<div class="med-card-dificultad">Dificultad ${Math.max(3, def.dificultad - bonusEstrellasTrabajador('mantenimiento'))}+</div>`;
        }
        return `
        <div class="med-card med-card-mantenimiento ${bloqueada?'med-card-bloqueada':''}" data-idx="${idx}">
          <button class="med-card-swap" data-swap="${idx}" title="${t('lm.tt_cambiar_carta')}" ${cambioDisponible?'':'disabled'}><i class="ph ph-bold ph-arrows-clockwise"></i></button>
          <div class="med-card-tag">${def.tipo==='nivel'?t('lm.tag_proyecto'):t('lm.tag_accion')}</div>
          <i class="ph ph-bold ${def.icon} med-card-icon"></i>
          <div class="med-card-title">${tc('mant', def.id, 'nombre', def.nombre)}</div>
          <div class="med-card-divider"></div>
          <div class="med-card-desc">${tc('mant', def.id, 'desc', def.desc)}</div>
          ${cuerpo}
          ${bloqueada?`<div class="med-card-bloqueada-label">${bloqueadaPorEstado?t('lm.necesita_aficion_descontenta'):(nivelMaximoYa?t('lm.especialidad_maxima'):t('lm.imposible_dados'))}</div>`:`<button class="mode-card-btn mode-card-btn-gold med-card-btn" data-usar="${idx}" style="padding:7px;font-size:11px">${t('lm.usar_btn')}</button>`}
        </div>`;
      }).join('');

      overlay.innerHTML=`
        <div class="lm-dilemma-card lm-dilemma-card-mant" style="max-width:640px">
          ${xCerrarHTML()}
          <div class="lm-dilemma-title"><i class="ph ph-bold ph-flag-pennant"></i> ${t('lm.titulo_mantenimiento')}</div>
          <button type="button" class="mode-card-btn mode-card-btn-gold" id="lmSeguridadEstadioBtn" style="width:100%;margin-bottom:4px"><i class="ph ph-bold ph-shield-check"></i> ${t('lm.seguridad_estadio')}</button>
          <div style="margin-bottom:10px">
            <div style="display:flex;justify-content:space-between;font-size:10px;color:#999;margin-bottom:2px"><span><i class="ph ph-bold ph-grass"></i> ${t('lm.estado_cesped')}</span><span>${est.campo||0}%</span></div>
            ${campoBarraHTML(est.campo||0, true)}
          </div>
          ${renderNivelesMantenimientoHTML()}
          <div class="lm-staff-bar-capital" style="justify-content:center;margin:10px 0 8px"><span><i class="ph ph-bold ph-dice-five"></i> ${t('lm.dados')}: <strong>${state.diceAvailable}</strong></span><span><i class="ph ph-bold ph-arrows-clockwise"></i> ${t('lm.rerrolls')}: <strong>${state.dadoRerollsDisponibles||0}</strong></span><span><i class="ph ph-bold ph-cards"></i> ${t('lm.cambios')}: <strong>${Math.max(0,lmCambiosCartaPorPartido()-(state.mantenimientoCambiosUsados||0))}/${lmCambiosCartaPorPartido()}</strong></span></div>
          <div class="med-card-grid">${cartasHTML}</div>
          <div class="lm-popup-actions lm-popup-actions-compact">
            ${mostrarInfoHTML()}
            <button id="lmMantenimientoCerrar" class="mode-card-btn mode-card-btn-secondary">${t('lm.cerrar')}</button>
          </div>
        </div>`;
        wireMostrarInfoHold(overlay, abrirEstadoEstadio, 'lmEstadoEstadioOverlay');
        const btnSeguridad=overlay.querySelector('#lmSeguridadEstadioBtn');
        if(btnSeguridad) btnSeguridad.addEventListener('click', ()=>{
          if(typeof window.playSound==='function') window.playSound('select');
          abrirSeguridadEstadio();
        });

      const xBtnMant=overlay.querySelector('[data-cerrar-x]');
      if(xBtnMant) xBtnMant.addEventListener('click', ()=>{ overlay.remove(); render(); });
      const cerrarBtn=document.getElementById('lmMantenimientoCerrar');
      if(cerrarBtn) cerrarBtn.addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        overlay.remove();
        render();
      });
      overlay.querySelectorAll('[data-swap]').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const idx=parseInt(btn.getAttribute('data-swap'),10);
          if((state.mantenimientoCambiosUsados||0)>=lmCambiosCartaPorPartido()) return;
          if(typeof window.playSound==='function') window.playSound('select');
          animarRerollCarta(overlay, idx, MANTENIMIENTO_CARTAS_BASE, ()=>{
            cambiarCartaMantenimiento(idx);
            renderHub();
          });
        });
      });
      overlay.querySelectorAll('[data-usar]').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const idx=parseInt(btn.getAttribute('data-usar'),10);
          if(typeof window.playSound==='function') window.playSound('select');
          renderSelectorCarta(idx);
        });
      });
    }

    function renderSelectorCarta(idx){
      const def=cartaDefM(state.mantenimientoCartas[idx].cartaId);
      let dadosElegidos=Math.min(1, state.diceAvailable);
      function pintar(){
        overlay.innerHTML=`
          <div class="lm-dilemma-card lm-dilemma-card-mant">
            ${xCerrarHTML()}
            <i class="ph ph-bold ${def.icon}" style="font-size:26px;color:#5dcaa5"></i>
            <div class="lm-dilemma-title" style="justify-content:center;text-align:center">${tc('mant', def.id, 'nombre', def.nombre).toUpperCase()}</div>
            <div class="lm-dilemma-text">${tc('mant', def.id, 'desc', def.desc)}${def.tipo==='directa'?` — necesitas sumar <strong class="lm-dificultad-destacada">${Math.max(3, def.dificultad - bonusEstrellasTrabajador('mantenimiento'))}+</strong>`:` — necesitas sumar <strong class="lm-dificultad-destacada">${dificultadActualNivelM(def)}+</strong> para subir a nivel ${nivelDeM(def.track)+1}/${NIVEL_MAXIMO_EQUIPO}`}</div>
            <div class="lm-dice-selector">
              <button id="lmDiceMinus" class="lm-dice-stepper">−</button>
              <span id="lmDiceCount">${dadosElegidos}</span>
              <button id="lmDicePlus" class="lm-dice-stepper">+</button>
            </div>
            <div class="lm-setup-desc">dados disponibles: ${state.diceAvailable}</div>
            <div class="lm-popup-actions">
              <button id="lmTirarBtn" class="mode-card-btn mode-card-btn-gold" ${state.diceAvailable<1?'disabled':''}>TIRAR ${dadosElegidos} DADO${dadosElegidos>1?'S':''}</button>
              <button id="lmCancelarCartaBtn" class="lm-btn-cancelar">${t('lm.cancelar')}</button>
            </div>
          </div>`;
        const minus=document.getElementById('lmDiceMinus');
        const plus=document.getElementById('lmDicePlus');
        const tirarBtn=document.getElementById('lmTirarBtn');
        const cancelarBtn=document.getElementById('lmCancelarCartaBtn');
        if(minus) minus.addEventListener('click', ()=>{ if(dadosElegidos>1){ dadosElegidos--; pintar(); } });
        if(plus) plus.addEventListener('click', ()=>{ if(dadosElegidos<state.diceAvailable){ dadosElegidos++; pintar(); } });
        if(cancelarBtn) cancelarBtn.addEventListener('click', ()=>{
          if(typeof window.playSound==='function') window.playSound('select');
          renderHub();
        });
        if(tirarBtn) tirarBtn.addEventListener('click', ()=>{
          if(typeof window.playSound==='function') window.playSound('select');
          renderRolloCarta(idx, dadosElegidos);
        });
      }
      pintar();
    }

    function renderRolloCarta(idx, numDados){
      const cartaObjetivo=cartaDefM(state.mantenimientoCartas[idx].cartaId);
      const dificultadObjetivo = cartaObjetivo.tipo==='directa'
        ? Math.max(3, cartaObjetivo.dificultad - bonusEstrellasTrabajador('mantenimiento'))
        : dificultadActualNivelM(cartaObjetivo);
      overlay.innerHTML=`
        <div class="lm-dilemma-card lm-dilemma-card-mant lm-dice-roll-card">
            ${xCerrarHTML()}
          <div class="lm-dilemma-title" id="lmDiceTitle" style="justify-content:center;text-align:center">TIRANDO ${numDados} DADO${numDados>1?'S':''}...</div>
          <div class="lm-dice-objetivo lm-dice-objetivo-mantenimiento">${t('lm.necesitas_sumar')} <strong>${dificultadObjetivo}+</strong></div>
          <div id="lmDice2DRow" class="lm-dice2d-row"></div>
          <div id="lmDiceResultZone"></div>
        </div>`;
      const box=document.getElementById('lmDice2DRow');
      iniciarBarajadoDados(box, numDados, (tiradas)=>{
        const tituloEl=document.getElementById('lmDiceTitle');
        if(tituloEl) tituloEl.textContent='TU TIRADA';
        box.innerHTML='';
        const zona=document.getElementById('lmDiceResultZone');
        mostrarResultadoDados(zona, tiradas,
          (tiradasFinales)=>{
            state.diceAvailable=Math.max(0, state.diceAvailable-numDados);
            return resolverCartaMantenimiento(idx, tiradasFinales);
          },
          ()=>{ renderHub(); }
        );
      });
    }

    renderHub();
  }

  /* ---------- 13c. Estado del estadio — burbuja "i" de Mantenimiento y
     Seguridad: las 3 barras (césped/satisfacción/moral) y el panel de
     aforo, que antes vivían en el hub de cartas y ahora quedan aparte
     como consulta rápida, igual que el historial médico. ---------- */
  function abrirEstadoEstadio(esModoMantener){
    const overlay=document.createElement('div');
    overlay.id='lmEstadoEstadioOverlay';
    const est=state.estadio||{campo:90, satisfaccion:0, aforoTotal:12000, ultimaAsistencia:null};
    const climaActual=climaDelPartido();
    const prevista=calcularAsistencia(climaActual?climaActual.id:null);
    const ultima=est.ultimaAsistencia;
    overlay.innerHTML=`
      <div class="lm-dilemma-card lm-dilemma-card-mant" style="max-width:480px;text-align:left">
        ${xCerrarHTML()}
        <div class="lm-dilemma-title"><i class="ph ph-bold ph-buildings"></i> ${t('lm.estado_estadio_titulo')}</div>
        <div class="lm-estadio-bars">
          <div>
            <div class="lm-estadio-bar-label"><i class="ph ph-bold ph-plant"></i><span>${t('lm.estado_cesped')}</span><span>${Math.round(est.campo)}/100</span></div>
            ${campoBarraHTML(est.campo)}
          </div>
          <div>
            <div class="lm-estadio-bar-label"><i class="ph ph-bold ph-users-three"></i><span>${t('lm.satisfaccion_de_la_afición')}</span><span>${est.satisfaccion>0?'+':''}${est.satisfaccion}</span></div>
            ${satisfaccionBarraHTML(est.satisfaccion)}
          </div>
          <div>
            <div class="lm-estadio-bar-label"><i class="ph ph-bold ph-trend-up"></i><span>${t('lm.moral_equipo')}</span><span>${(state.moral||0)>0?'+':''}${state.moral||0}</span></div>
            ${moralBarraHTML(state.moral||0)}
          </div>
        </div>
        <div class="lm-aforo-box">
          <i class="ph ph-bold ph-ticket lm-aforo-icon"></i>
          <div class="lm-aforo-info">
            <div class="lm-aforo-title"><span>${t('lm.aforo_estadio')}</span><strong>${est.aforoTotal.toLocaleString('es-ES')} asientos</strong></div>
            <div class="lm-aforo-bar-wrap"><div class="lm-aforo-bar-fill" style="width:${Math.round(prevista.pct*100)}%"></div></div>
            <div class="lm-aforo-nota">
              Previsión próximo partido en casa: <strong>${prevista.asistentes.toLocaleString('es-ES')}</strong> asientos (${Math.round(prevista.pct*100)}%)
              ${ultima?` · Último partido en casa (J${ultima.jornada}): <strong>${ultima.asistentes.toLocaleString('es-ES')}</strong> (${Math.round(ultima.pct*100)}%)`:''}
            </div>
          </div>
        </div>
        ${esModoMantener?'':`<div class="lm-popup-actions lm-popup-actions-compact">
          <button id="lmEstadoEstadioCerrar" class="mode-card-btn mode-card-btn-gold">${t('lm.cerrar')}</button>
        </div>`}
      </div>`;
    document.getElementById('ligaManagerScreen').appendChild(overlay);
    habilitarCierreOverlay(overlay, ()=>overlay.remove());
    const xBtnEstadio=overlay.querySelector('[data-cerrar-x]');
    if(xBtnEstadio) xBtnEstadio.addEventListener('click', ()=>overlay.remove());
    const btnCerrarEstadio=document.getElementById('lmEstadoEstadioCerrar');
    if(btnCerrarEstadio) btnCerrarEstadio.addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      overlay.remove();
    });
  }

  /* ---------- 13d. Interfaz del Director General — capital, precio de
     entrada (control manual) y sus 10 cartas, mismo patrón que médico y
     mantenimiento. ---------- */
  function abrirDirectorGeneral(){
    const overlay=document.createElement('div');
    overlay.id='lmDirectorGeneralOverlay';
    document.getElementById('ligaManagerScreen').appendChild(overlay);
    habilitarCierreOverlay(overlay, ()=>{ overlay.remove(); render(); });
    // Delegado: cualquier X que aparezca dentro de este overlay en
    // cualquier pantalla (selector de dados, tirada, etc.) lo cierra.
    overlay.addEventListener('click', (e)=>{
      const xEl = e.target.closest && e.target.closest('[data-cerrar-x]');
      if(xEl){ if(typeof window.playSound==='function') window.playSound('select'); overlay.remove(); render(); }
    });

    function renderHub(){
      const cartasHTML=state.directorGeneralCartas.map((instancia,idx)=>{
        const def=cartaDefDG(instancia.cartaId);
        const dificultadEfectiva = def.tipo==='nivel' ? dificultadActualNivelDG(def) : Math.max(3, def.dificultad - bonusEstrellasTrabajador('directorGeneral'));
        const maxPosible = state.diceAvailable*6;
        const imposiblePorDados = maxPosible < dificultadEfectiva;
        const nivelMaximoYa = def.tipo==='nivel' && nivelDeDG(def.track)>=NIVEL_MAXIMO_EQUIPO;
        const bloqueada = imposiblePorDados || nivelMaximoYa;
        const cambioDisponible=(state.directorGeneralCambiosUsados||0)<lmCambiosCartaPorPartido();
        let cuerpo;
        if(def.tipo==='nivel'){
          const n=nivelDeDG(def.track);
          cuerpo=`<div class="med-card-progress-label" style="text-align:center;letter-spacing:2px;color:var(--gold)">${estrellasNivel(n)}</div>
                  <div class="med-card-dificultad">${t('lm.dificultad_lbl')} ${dificultadEfectiva}+ ${t('lm.para_subir_a_nivel')} ${n+1}/${NIVEL_MAXIMO_EQUIPO}</div>`;
        } else {
          cuerpo=`<div class="med-card-dificultad">Dificultad ${Math.max(3, def.dificultad - bonusEstrellasTrabajador('directorGeneral'))}+</div>`;
        }
        return `
        <div class="med-card med-card-dg ${bloqueada?'med-card-bloqueada':''}" data-idx="${idx}">
          <button class="med-card-swap" data-swap="${idx}" title="${t('lm.tt_cambiar_carta')}" ${cambioDisponible?'':'disabled'}><i class="ph ph-bold ph-arrows-clockwise"></i></button>
          <div class="med-card-tag">${def.tipo==='nivel'?t('lm.tag_proyecto'):t('lm.tag_accion')}</div>
          <i class="ph ph-bold ${def.icon} med-card-icon"></i>
          <div class="med-card-title">${tc('dg', def.id, 'nombre', def.nombre)}</div>
          <div class="med-card-divider"></div>
          <div class="med-card-desc">${tc('dg', def.id, 'desc', def.desc)}</div>
          ${cuerpo}
          ${bloqueada?`<div class="med-card-bloqueada-label">${nivelMaximoYa?t('lm.especialidad_maxima'):t('lm.imposible_dados')}</div>`:`<button class="mode-card-btn mode-card-btn-gold med-card-btn" data-usar="${idx}" style="padding:7px;font-size:11px">${t('lm.usar_btn')}</button>`}
        </div>`;
      }).join('');

      overlay.innerHTML=`
        <div class="lm-dilemma-card lm-dilemma-card-dg" style="max-width:640px">
          ${xCerrarHTML()}
          <div class="lm-dilemma-title"><i class="ph ph-bold ph-briefcase"></i> ${t('lm.titulo_dg')}</div>
          <div class="lm-capital-box">
            <i class="ph ph-bold ph-coins lm-capital-icon"></i>
            <div class="lm-capital-info">
              <div class="lm-capital-title"><span>${t('lm.capital_del_club')}</span><strong class="${(state.capital||0)<0?'lm-capital-neg':''}">${formatoDinero(state.capital)}</strong></div>
              <div class="lm-aforo-nota">Próxima nómina en la jornada ${Math.max(1,(state.mesesPagados||0)*4+1)}</div>
            </div>
          </div>
          <div class="lm-prestamo-box">${renderPrestamoHTML()}</div>
          <div class="lm-precio-box">
            <div class="lm-estadio-bar-label"><i class="ph ph-bold ph-ticket"></i><span>${t('lm.precio_de_la_entrada')}</span><span>${formatoDinero(state.precioEntrada)}</span></div>
            <input type="range" id="lmPrecioEntradaSlider" min="5" max="60" step="1" value="${state.precioEntrada}" class="lm-precio-slider">
            <div class="lm-aforo-nota">Más caro = más ingreso por entrada, pero menos afición vendrá a verte (se nota menos cuanto más nivel tengas en Relaciones con la Afición).</div>
          </div>
          ${renderNivelesDGHTML()}
          <div class="lm-staff-bar-capital" style="justify-content:center;margin:10px 0 8px"><span><i class="ph ph-bold ph-dice-five"></i> ${t('lm.dados')}: <strong>${state.diceAvailable}</strong></span><span><i class="ph ph-bold ph-arrows-clockwise"></i> ${t('lm.rerrolls')}: <strong>${state.dadoRerollsDisponibles||0}</strong></span><span><i class="ph ph-bold ph-cards"></i> ${t('lm.cambios')}: <strong>${Math.max(0,lmCambiosCartaPorPartido()-(state.directorGeneralCambiosUsados||0))}/${lmCambiosCartaPorPartido()}</strong></span></div>
          <div class="med-card-grid">${cartasHTML}</div>
          <div class="lm-popup-actions lm-popup-actions-compact">
            ${(state.quinielaBoleto&&!state.quinielaBoleto.rellenado)?`<button type="button" class="mode-card-btn mode-card-btn-secondary lm-pendientes-indicador" id="lmQuinielaPendienteBtn"><i class="ph ph-bold ph-ticket lm-pendientes-pulso"></i> ${t('lm.quiniela_pendiente')}</button>`:''}
            ${mostrarInfoHTML()}
            <button id="lmDirectorGeneralCerrar" class="mode-card-btn mode-card-btn-secondary">${t('lm.cerrar')}</button>
          </div>
        </div>`;
        wireMostrarInfoHold(overlay, abrirFinanzasDG, 'lmFinanzasOverlay');

      const slider=document.getElementById('lmPrecioEntradaSlider');
      if(slider) slider.addEventListener('change', ()=>{
        state.precioEntrada=parseInt(slider.value,10);
        if(typeof window.playSound==='function') window.playSound('select');
        guardarEstado();
        renderHub();
      });
      overlay.querySelectorAll('[data-prestamo]').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const paqueteId=btn.getAttribute('data-prestamo');
          if(solicitarPrestamo(paqueteId)){
            renderHub();
            overlay.remove();
            abrirDirectorGeneral(); // reabre el popup ya con el préstamo activo mostrado
          }
        });
      });
      const xBtnDG=overlay.querySelector('[data-cerrar-x]');
      if(xBtnDG) xBtnDG.addEventListener('click', ()=>{ overlay.remove(); render(); });
      const btnQuinielaPendiente=document.getElementById('lmQuinielaPendienteBtn');
      if(btnQuinielaPendiente) btnQuinielaPendiente.addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        overlay.remove();
        abrirBoletoQuiniela();
      });
      const cerrarBtn=document.getElementById('lmDirectorGeneralCerrar');
      if(cerrarBtn) cerrarBtn.addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        overlay.remove();
        render();
      });
      overlay.querySelectorAll('[data-swap]').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const idx=parseInt(btn.getAttribute('data-swap'),10);
          if((state.directorGeneralCambiosUsados||0)>=lmCambiosCartaPorPartido()) return;
          if(typeof window.playSound==='function') window.playSound('select');
          animarRerollCarta(overlay, idx, DIRECTOR_GENERAL_CARTAS_BASE, ()=>{
            cambiarCartaDG(idx);
            renderHub();
          });
        });
      });
      overlay.querySelectorAll('[data-usar]').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const idx=parseInt(btn.getAttribute('data-usar'),10);
          if(typeof window.playSound==='function') window.playSound('select');
          renderSelectorCarta(idx);
        });
      });
    }

    function renderSelectorCarta(idx){
      const def=cartaDefDG(state.directorGeneralCartas[idx].cartaId);
      let dadosElegidos=Math.min(1, state.diceAvailable);
      function pintar(){
        overlay.innerHTML=`
          <div class="lm-dilemma-card lm-dilemma-card-dg">
            ${xCerrarHTML()}
            <i class="ph ph-bold ${def.icon}" style="font-size:26px;color:#e6c94a"></i>
            <div class="lm-dilemma-title" style="justify-content:center;text-align:center">${tc('dg', def.id, 'nombre', def.nombre).toUpperCase()}</div>
            <div class="lm-dilemma-text">${tc('dg', def.id, 'desc', def.desc)}${def.tipo==='directa'?` — necesitas sumar <strong class="lm-dificultad-destacada">${Math.max(3, def.dificultad - bonusEstrellasTrabajador('directorGeneral'))}+</strong>`:` — necesitas sumar <strong class="lm-dificultad-destacada">${dificultadActualNivelDG(def)}+</strong> para subir a nivel ${nivelDeDG(def.track)+1}/${NIVEL_MAXIMO_EQUIPO}`}</div>
            <div class="lm-dice-selector">
              <button id="lmDiceMinus" class="lm-dice-stepper">−</button>
              <span id="lmDiceCount">${dadosElegidos}</span>
              <button id="lmDicePlus" class="lm-dice-stepper">+</button>
            </div>
            <div class="lm-setup-desc">dados disponibles: ${state.diceAvailable}</div>
            <div class="lm-popup-actions">
              <button id="lmTirarBtn" class="mode-card-btn mode-card-btn-gold" ${state.diceAvailable<1?'disabled':''}>TIRAR ${dadosElegidos} DADO${dadosElegidos>1?'S':''}</button>
              <button id="lmCancelarCartaBtn" class="lm-btn-cancelar">${t('lm.cancelar')}</button>
            </div>
          </div>`;
        const minus=document.getElementById('lmDiceMinus');
        const plus=document.getElementById('lmDicePlus');
        const tirarBtn=document.getElementById('lmTirarBtn');
        const cancelarBtn=document.getElementById('lmCancelarCartaBtn');
        if(minus) minus.addEventListener('click', ()=>{ if(dadosElegidos>1){ dadosElegidos--; pintar(); } });
        if(plus) plus.addEventListener('click', ()=>{ if(dadosElegidos<state.diceAvailable){ dadosElegidos++; pintar(); } });
        if(cancelarBtn) cancelarBtn.addEventListener('click', ()=>{
          if(typeof window.playSound==='function') window.playSound('select');
          renderHub();
        });
        if(tirarBtn) tirarBtn.addEventListener('click', ()=>{
          if(typeof window.playSound==='function') window.playSound('select');
          renderRolloCarta(idx, dadosElegidos);
        });
      }
      pintar();
    }

    function renderRolloCarta(idx, numDados){
      const cartaObjetivo=cartaDefDG(state.directorGeneralCartas[idx].cartaId);
      const dificultadObjetivo = cartaObjetivo.tipo==='directa'
        ? Math.max(3, cartaObjetivo.dificultad - bonusEstrellasTrabajador('directorGeneral'))
        : dificultadActualNivelDG(cartaObjetivo);
      overlay.innerHTML=`
        <div class="lm-dilemma-card lm-dilemma-card-dg lm-dice-roll-card">
            ${xCerrarHTML()}
          <div class="lm-dilemma-title" id="lmDiceTitle" style="justify-content:center;text-align:center">TIRANDO ${numDados} DADO${numDados>1?'S':''}...</div>
          <div class="lm-dice-objetivo lm-dice-objetivo-dg">${t('lm.necesitas_sumar')} <strong>${dificultadObjetivo}+</strong></div>
          <div id="lmDice2DRow" class="lm-dice2d-row"></div>
          <div id="lmDiceResultZone"></div>
        </div>`;
      const box=document.getElementById('lmDice2DRow');
      iniciarBarajadoDados(box, numDados, (tiradas)=>{
        const tituloEl=document.getElementById('lmDiceTitle');
        if(tituloEl) tituloEl.textContent='TU TIRADA';
        box.innerHTML='';
        const zona=document.getElementById('lmDiceResultZone');
        mostrarResultadoDados(zona, tiradas,
          (tiradasFinales)=>{
            state.diceAvailable=Math.max(0, state.diceAvailable-numDados);
            return resolverCartaDG(idx, tiradasFinales);
          },
          ()=>{ renderHub(); }
        );
      });
    }

    renderHub();
  }

  const NIVELES_DG_INFO=[
    {track:'aforoExtra',          get label(){return t('nivel.dg.grada.label');},   icon:'ph-stairs',       get desc(){return t('nivel.dg.grada.desc');}},
    {track:'ingresoPatrocinio',   get label(){return t('nivel.dg.patrocinadores.label');},        icon:'ph-handshake',    get desc(){return t('nivel.dg.patrocinadores.desc');}},
    {track:'ingresoMerchandising',get label(){return t('nivel.dg.tienda.label');},icon:'ph-t-shirt',      get desc(){return t('nivel.dg.tienda.desc');}},
    {track:'toleranciaPrecio',    get label(){return t('nivel.dg.relaciones.label');},icon:'ph-users-three',get desc(){return t('nivel.dg.relaciones.desc');}}
  ];
  function renderNivelesDGHTML(){
    return `<div class="med-niveles-grid">${NIVELES_DG_INFO.map(info=>{
      const n=nivelDeDG(info.track);
      const completado=n>=NIVEL_MAXIMO_EQUIPO;
      return `<div class="med-nivel-row${completado?' med-nivel-completado':''}">
        ${completado?`<i class="ph ph-bold ph-check-circle med-nivel-check" title="${t('lm.tt_proyecto_completado')}"></i>`:''}
        <i class="ph ph-bold ${info.icon}"></i>
        <div class="med-nivel-info">
          <div class="med-nivel-label">${info.label}</div>
          <div class="med-nivel-desc">${info.desc}</div>
        </div>
        <div class="med-nivel-stars" title="${t('lm.nivel_n_de_x')} ${n}/${NIVEL_MAXIMO_EQUIPO}">${estrellasNivel(n)}</div>
      </div>`;
    }).join('')}</div>`;
  }

  const NIVELES_DD_INFO=[
    {track:'calidadOjeo',     get label(){return t('nivel.dd.red_ojeadores.label');},        icon:'ph-binoculars',      get desc(){return t('nivel.dd.red_ojeadores.desc');}},
    {track:'ahorroSalarial',  get label(){return t('nivel.dd.negociacion.label');},icon:'ph-handshake',       get desc(){return t('nivel.dd.negociacion.desc');}},
    {track:'sobresFichajes',  get label(){return t('nivel.dd.red_activa.label');}, icon:'ph-envelope-open',   get desc(){return t('nivel.dd.red_activa.desc');}},
    {track:'costeSobres',     get label(){return t('nivel.dd.cantera.label');},    icon:'ph-graduation-cap',  get desc(){return t('nivel.dd.cantera.desc');}}
  ];
  function renderNivelesDDHTML(){
    return `<div class="med-niveles-grid">${NIVELES_DD_INFO.map(info=>{
      const n=nivelDeDD(info.track);
      const completado=n>=NIVEL_MAXIMO_EQUIPO;
      return `<div class="med-nivel-row${completado?' med-nivel-completado':''}">
        ${completado?`<i class="ph ph-bold ph-check-circle med-nivel-check" title="${t('lm.tt_proyecto_completado')}"></i>`:''}
        <i class="ph ph-bold ${info.icon}"></i>
        <div class="med-nivel-info">
          <div class="med-nivel-label">${info.label}</div>
          <div class="med-nivel-desc">${info.desc}</div>
        </div>
        <div class="med-nivel-stars" title="${t('lm.nivel_n_de_x')} ${n}/${NIVEL_MAXIMO_EQUIPO}">${estrellasNivel(n)}</div>
      </div>`;
    }).join('')}</div>`;
  }

  /* ---------- 13e. Finanzas del Director General — burbuja "i": tabla
     mensual de ingresos/gastos con mini barras, agrupada por mes. ---------- */
  function abrirFinanzasDG(esModoMantener){
    const overlay=document.createElement('div');
    overlay.id='lmFinanzasOverlay';
    const historial=state.finanzasHistorial||[];
    const meses={};
    historial.forEach(h=>{
      if(!meses[h.mes]) meses[h.mes]={ingresos:0, gastos:0, movimientos:[]};
      if(h.monto>=0) meses[h.mes].ingresos+=h.monto; else meses[h.mes].gastos+=Math.abs(h.monto);
      meses[h.mes].movimientos.push(h);
    });
    const mesesOrdenadosDesc=Object.keys(meses).map(Number).sort((a,b)=>b-a);
    const mesActual=mesesOrdenadosDesc[0];
    const mesesHistoricos=mesesOrdenadosDesc.slice(1).sort((a,b)=>a-b); // resto, de más antiguo a más reciente para el gráfico
    let filaMesActual=`<p class="lm-setup-desc" style="text-align:center">${t('lm.sin_movimientos_mes')}</p>`;
    let desgloseIngresos='', desgloseGastos='';
    if(mesActual!==undefined){
      const d=meses[mesActual];
      const neto=d.ingresos-d.gastos;
      const maxValor=Math.max(1, d.ingresos, d.gastos);
      filaMesActual=`<div class="lm-fin-mes">
        <div class="lm-fin-mes-title"><span>MES ${mesActual} (ACTUAL)</span><span style="color:${neto>=0?'#5dcaa5':'#e24b4a'}">${neto>=0?'+':''}${formatoDinero(neto)}</span></div>
        <div class="lm-fin-bar-row"><span class="lm-fin-bar-label">${t('lm.ingresos')}</span><div class="lm-fin-bar-wrap"><div class="lm-fin-bar-fill lm-fin-bar-ingreso" style="width:${Math.round(d.ingresos/maxValor*100)}%"></div></div><span class="lm-fin-bar-valor">${formatoDinero(d.ingresos)}</span></div>
        <div class="lm-fin-bar-row"><span class="lm-fin-bar-label">${t('lm.gastos')}</span><div class="lm-fin-bar-wrap"><div class="lm-fin-bar-fill lm-fin-bar-gasto" style="width:${Math.round(d.gastos/maxValor*100)}%"></div></div><span class="lm-fin-bar-valor">${formatoDinero(d.gastos)}</span></div>
      </div>`;
      // Desglose por concepto — de dónde viene cada ingreso y a dónde
      // va cada gasto, no solo el total agregado. Se agrupan por el
      // texto exacto del concepto (ya guardado en cada movimiento
      // desde que se registró) y se ordenan de mayor a menor, con una
      // mini barra de proporción dentro de su propio grupo — así se ve
      // de un vistazo cuál es la partida que más pesa.
      const gruposIngreso={}, gruposGasto={};
      d.movimientos.forEach(m=>{
        const grupo = m.monto>=0 ? gruposIngreso : gruposGasto;
        grupo[m.concepto]=(grupo[m.concepto]||0)+Math.abs(m.monto);
      });
      function filasDesglose(grupo, colorClase){
        const entradas=Object.entries(grupo).sort((a,b)=>b[1]-a[1]);
        if(!entradas.length) return `<div class="lm-fin-desglose-vacio">${t('lm.sin_movimientos_mes')}</div>`;
        const max=Math.max(...entradas.map(e=>e[1]));
        return entradas.map(([concepto,monto])=>`
          <div class="lm-fin-desglose-fila">
            <span class="lm-fin-desglose-concepto">${concepto}</span>
            <div class="lm-fin-desglose-track"><div class="lm-fin-desglose-fill ${colorClase}" style="width:${Math.round(monto/max*100)}%"></div></div>
            <span class="lm-fin-desglose-valor">${formatoDinero(monto)}</span>
          </div>`).join('');
      }
      desgloseIngresos=filasDesglose(gruposIngreso, 'lm-fin-desglose-fill-ingreso');
      desgloseGastos=filasDesglose(gruposGasto, 'lm-fin-desglose-fill-gasto');
    }
    // Histórico de meses anteriores — gráfico de barras (neto por mes),
    // en vez de repetir la misma tabla detallada para cada mes.
    let graficoHistorico=`<p class="lm-setup-desc" style="text-align:center">${t('lm.sin_historico_meses')}</p>`;
    if(mesesHistoricos.length){
      const netos=mesesHistoricos.map(m=>meses[m].ingresos-meses[m].gastos);
      const maxAbs=Math.max(1, ...netos.map(n=>Math.abs(n)));
      const w=420, h=150, midY=h/2, hueco=(w-20)/mesesHistoricos.length, barW=Math.min(34, hueco-8);
      const barras=mesesHistoricos.map((m,i)=>{
        const neto=netos[i];
        const barH=Math.max(2, Math.round(Math.abs(neto)/maxAbs*(h/2-14)));
        const x=10+i*hueco+(hueco-barW)/2;
        const y=neto>=0 ? midY-barH : midY;
        const color=neto>=0 ? '#5dcaa5' : '#e24b4a';
        return `<rect x="${x.toFixed(1)}" y="${y}" width="${barW.toFixed(1)}" height="${barH}" fill="${color}" rx="2"></rect>
                <text x="${(x+barW/2).toFixed(1)}" y="${h-3}" font-size="8" fill="#888" text-anchor="middle">M${m}</text>`;
      }).join('');
      graficoHistorico=`<svg viewBox="0 0 ${w} ${h}" style="width:100%;height:150px">
        <line x1="0" y1="${midY}" x2="${w}" y2="${midY}" stroke="#3a3f42" stroke-width="1"></line>
        ${barras}
      </svg>`;
    }
    overlay.innerHTML=`
      <div class="lm-dilemma-card lm-dilemma-card-dg" style="max-width:480px;text-align:left">
        ${xCerrarHTML()}
        <div class="lm-dilemma-title"><i class="ph ph-bold ph-chart-line-up"></i> ${t('lm.finanzas_club_titulo')}</div>
        <div class="lm-capital-box" style="margin-bottom:12px">
          <i class="ph ph-bold ph-coins lm-capital-icon"></i>
          <div class="lm-capital-info">
            <div class="lm-capital-title"><span>${t('lm.capital_actual')}</span><strong class="${(state.capital||0)<0?'lm-capital-neg':''}">${formatoDinero(state.capital)}</strong></div>
          </div>
        </div>
        ${filaMesActual}
        <div class="lm-fin-tabs">
          <button type="button" class="lm-fin-tab-btn lm-fin-tab-activa" data-fin-tab="ingresos">${t('lm.ingresos')}</button>
          <button type="button" class="lm-fin-tab-btn" data-fin-tab="gastos">${t('lm.gastos')}</button>
        </div>
        <div class="lm-fin-desglose" data-fin-panel="ingresos">${desgloseIngresos}</div>
        <div class="lm-fin-desglose" data-fin-panel="gastos" style="display:none">${desgloseGastos}</div>
        <p class="lm-setup-desc" style="text-align:left;margin:12px 0 4px">${t('lm.historico_meses_anteriores')}</p>
        ${graficoHistorico}
        ${esModoMantener?'':`<div class="lm-popup-actions lm-popup-actions-compact">
          <button id="lmFinanzasCerrar" class="mode-card-btn mode-card-btn-gold">${t('lm.cerrar')}</button>
        </div>`}
      </div>`;
    document.getElementById('ligaManagerScreen').appendChild(overlay);
    overlay.querySelectorAll('[data-fin-tab]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        const tab=btn.getAttribute('data-fin-tab');
        overlay.querySelectorAll('[data-fin-tab]').forEach(b=>b.classList.toggle('lm-fin-tab-activa', b===btn));
        overlay.querySelectorAll('[data-fin-panel]').forEach(p=>{ p.style.display = p.getAttribute('data-fin-panel')===tab ? '' : 'none'; });
      });
    });
    habilitarCierreOverlay(overlay, ()=>overlay.remove());
    const xBtnFin=overlay.querySelector('[data-cerrar-x]');
    if(xBtnFin) xBtnFin.addEventListener('click', ()=>overlay.remove());
    const btnCerrarFin=document.getElementById('lmFinanzasCerrar');
    if(btnCerrarFin) btnCerrarFin.addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      overlay.remove();
    });
  }

  /* ---------- 13f. Interfaz del Director Deportivo — sus 10 cartas
     (incluida la especial "Sobres de Fichajes", con botón propio de abrir
     sobre siempre visible a partir de nivel 1) y la revelación de
     jugadores al abrir un sobre, con el mismo barajado 2D que los dados. ---------- */
  function abrirDirectorDeportivo(){
    const overlay=document.createElement('div');
    overlay.id='lmDirectorDeportivoOverlay';
    document.getElementById('ligaManagerScreen').appendChild(overlay);
    habilitarCierreOverlay(overlay, ()=>{ overlay.remove(); render(); });
    // Delegado: cualquier X que aparezca dentro de este overlay en
    // cualquier pantalla (selector de dados, tirada, etc.) lo cierra.
    overlay.addEventListener('click', (e)=>{
      const xEl = e.target.closest && e.target.closest('[data-cerrar-x]');
      if(xEl){ if(typeof window.playSound==='function') window.playSound('select'); overlay.remove(); render(); }
    });

    function renderHub(){
      const nivelSobre=nivelDeDD('sobresFichajes');
      const cartasHTML=state.directorDeportivoCartas.map((instancia,idx)=>{
        const def=cartaDefDD(instancia.cartaId);
        const esSobre=def.tipo==='sobre';
        const dificultadEfectiva = (def.tipo==='nivel'||esSobre) ? dificultadActualNivelDD(def) : Math.max(3, def.dificultad - bonusEstrellasTrabajador('directorDeportivo'));
        const maxPosible = state.diceAvailable*6;
        const imposiblePorDados = maxPosible < dificultadEfectiva;
        const nivelActualTrack = (def.tipo==='nivel'||esSobre) ? nivelDeDD(def.track) : 0;
        const nivelMaximoYa = (def.tipo==='nivel'||esSobre) && nivelActualTrack>=NIVEL_MAXIMO_EQUIPO;
        const bloqueada = imposiblePorDados || nivelMaximoYa;
        const cambioDisponible=(state.directorDeportivoCambiosUsados||0)<lmCambiosCartaPorPartido();
        let cuerpo;
        if(def.tipo==='nivel'||esSobre){
          cuerpo=`<div class="med-card-progress-label" style="text-align:center;letter-spacing:2px;color:var(--gold)">${estrellasNivel(nivelActualTrack)}</div>
                  <div class="med-card-dificultad">${nivelMaximoYa?t('lm.nivel_maximo_alcanzado'):`${t('lm.dificultad_lbl')} ${dificultadEfectiva}+ ${t('lm.para_subir_a_nivel')} ${nivelActualTrack+1}/${NIVEL_MAXIMO_EQUIPO}`}</div>`;
        } else {
          cuerpo=`<div class="med-card-dificultad">Dificultad ${Math.max(3, def.dificultad - bonusEstrellasTrabajador('directorDeportivo'))}+</div>`;
        }
        const botonAccion = bloqueada
          ? (nivelMaximoYa ? '' : `<div class="med-card-bloqueada-label">${t('lm.imposible_dados')}</div>`)
          : `<button class="mode-card-btn mode-card-btn-gold med-card-btn" data-usar="${idx}" style="padding:7px;font-size:11px">${t('lm.usar_btn')}</button>`;
        return `
        <div class="med-card med-card-dd ${bloqueada&&!nivelMaximoYa?'med-card-bloqueada':''}" data-idx="${idx}">
          <button class="med-card-swap" data-swap="${idx}" title="${t('lm.tt_cambiar_carta')}" ${cambioDisponible?'':'disabled'}><i class="ph ph-bold ph-arrows-clockwise"></i></button>
          <div class="med-card-tag">${def.tipo==='nivel'?t('lm.tag_proyecto'):t('lm.tag_accion')}</div>
          <i class="ph ph-bold ${def.icon} med-card-icon"></i>
          <div class="med-card-title">${tc('dd', def.id, 'nombre', def.nombre)}</div>
          <div class="med-card-divider"></div>
          <div class="med-card-desc">${tc('dd', def.id, 'desc', def.desc)}</div>
          ${cuerpo}
          ${botonAccion}
        </div>`;
      }).join('');

      overlay.innerHTML=`
        <div class="lm-dilemma-card lm-dilemma-card-dd" style="max-width:640px">
          ${xCerrarHTML()}
          <div class="lm-dilemma-title"><i class="ph ph-bold ph-binoculars"></i> ${t('lm.titulo_dd')}</div>
          <button type="button" class="mode-card-btn mode-card-btn-gold" id="lmInfoPlantillaDDBtn" style="width:100%;margin:10px 0"><i class="ph ph-bold ph-scroll"></i> ${t('lm.info_plantilla_btn')}</button>
          <div class="lm-precio-box">
            <div class="lm-estadio-bar-label"><i class="ph ph-bold ph-magnifying-glass"></i><span>${t('lm.posicion_objetivo_ojeadores')}</span></div>
            <select id="lmPosicionOjeoSelect" class="lm-ojeo-select">
              <option value="any" ${(!state.posicionObjetivoOjeo||state.posicionObjetivoOjeo==='any')?'selected':''}>${t('lm.cualquiera_defecto')}</option>
              ${['POR','DFC','LI','LD','MC','EI','ED','DC'].map(p=>`<option value="${p}" ${state.posicionObjetivoOjeo===p?'selected':''}>${p}</option>`).join('')}
            </select>
            <div class="lm-aforo-nota">Los ojeadores se centrarán en esta posición para los próximos sobres que abras.</div>
          </div>
          ${renderNivelesDDHTML()}
          <div class="lm-staff-bar-capital" style="justify-content:center;margin:10px 0 8px"><span><i class="ph ph-bold ph-dice-five"></i> ${t('lm.dados')}: <strong>${state.diceAvailable}</strong></span><span><i class="ph ph-bold ph-arrows-clockwise"></i> ${t('lm.rerrolls')}: <strong>${state.dadoRerollsDisponibles||0}</strong></span><span><i class="ph ph-bold ph-cards"></i> ${t('lm.cambios')}: <strong>${Math.max(0,lmCambiosCartaPorPartido()-(state.directorDeportivoCambiosUsados||0))}/${lmCambiosCartaPorPartido()}</strong></span></div>
          <div class="med-card-grid">${cartasHTML}</div>
          <div class="lm-popup-actions lm-popup-actions-compact">
            ${(state.sobresFichajesPendientes&&state.sobresFichajesPendientes.length)?`<button type="button" class="mode-card-btn mode-card-btn-secondary lm-pendientes-indicador" id="lmSobresPendientesBtn"><i class="ph ph-bold ph-envelope-simple-open lm-pendientes-pulso"></i> ${t('lm.sobres_pendientes')} ${state.sobresFichajesPendientes.length}/3</button>`:''}
            ${mostrarInfoHTML()}
            <button id="lmDirectorDeportivoCerrar" class="mode-card-btn mode-card-btn-secondary">${t('lm.cerrar')}</button>
          </div>
        </div>`;
        wireMostrarInfoHold(overlay, abrirHistorialFichajesDD, 'lmHistorialFichajesDDOverlay');
        const btnInfoPlantillaDD=overlay.querySelector('#lmInfoPlantillaDDBtn');
        if(btnInfoPlantillaDD) btnInfoPlantillaDD.addEventListener('click', ()=>{
          if(typeof window.playSound==='function') window.playSound('select');
          abrirSalariosDD(false);
        });

      const xBtnDD=overlay.querySelector('[data-cerrar-x]');
      const posicionOjeoSelect=document.getElementById('lmPosicionOjeoSelect');
      if(posicionOjeoSelect) posicionOjeoSelect.addEventListener('change', ()=>{
        state.posicionObjetivoOjeo=posicionOjeoSelect.value;
        if(typeof window.playSound==='function') window.playSound('select');
        guardarEstado();
      });
      if(xBtnDD) xBtnDD.addEventListener('click', ()=>{ overlay.remove(); render(); });
      const btnSobresPendientes=document.getElementById('lmSobresPendientesBtn');
      if(btnSobresPendientes) btnSobresPendientes.addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        const lista=state.sobresFichajesPendientes||[];
        if(!lista.length) return;
        const sobreId=lista[lista.length-1].id;
        const jugadores=abrirSobrePorId(sobreId);
        if(!jugadores){ render(); return; }
        mostrarRevelacionSobreDesdeCorreo(jugadores, ()=>{ guardarEstado(); overlay.remove(); render(); });
      });
      const cerrarBtn=document.getElementById('lmDirectorDeportivoCerrar');
      if(cerrarBtn) cerrarBtn.addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        overlay.remove();
        render();
      });
      overlay.querySelectorAll('[data-swap]').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const idx=parseInt(btn.getAttribute('data-swap'),10);
          if((state.directorDeportivoCambiosUsados||0)>=lmCambiosCartaPorPartido()) return;
          if(typeof window.playSound==='function') window.playSound('select');
          animarRerollCarta(overlay, idx, DIRECTOR_DEPORTIVO_CARTAS_BASE, ()=>{
            cambiarCartaDD(idx);
            renderHub();
          });
        });
      });
      overlay.querySelectorAll('[data-usar]').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const idx=parseInt(btn.getAttribute('data-usar'),10);
          if(typeof window.playSound==='function') window.playSound('select');
          renderSelectorCarta(idx);
        });
      });
    }

    function renderSelectorCarta(idx){
      const def=cartaDefDD(state.directorDeportivoCartas[idx].cartaId);
      const esSobre=def.tipo==='sobre';
      let dadosElegidos=Math.min(1, state.diceAvailable);
      function pintar(){
        overlay.innerHTML=`
          <div class="lm-dilemma-card lm-dilemma-card-dd">
            ${xCerrarHTML()}
            <i class="ph ph-bold ${def.icon}" style="font-size:26px;color:#c9c9c9"></i>
            <div class="lm-dilemma-title" style="justify-content:center;text-align:center">${tc('dd', def.id, 'nombre', def.nombre).toUpperCase()}</div>
            <div class="lm-dilemma-text">${tc('dd', def.id, 'desc', def.desc)}${def.tipo==='directa'?` — necesitas sumar <strong class="lm-dificultad-destacada">${Math.max(3, def.dificultad - bonusEstrellasTrabajador('directorDeportivo'))}+</strong>`:` — necesitas sumar <strong class="lm-dificultad-destacada">${dificultadActualNivelDD(def)}+</strong> para subir a nivel ${nivelDeDD(def.track)+1}/${NIVEL_MAXIMO_EQUIPO}`}</div>
            <div class="lm-dice-selector">
              <button id="lmDiceMinus" class="lm-dice-stepper">−</button>
              <span id="lmDiceCount">${dadosElegidos}</span>
              <button id="lmDicePlus" class="lm-dice-stepper">+</button>
            </div>
            <div class="lm-setup-desc">dados disponibles: ${state.diceAvailable}</div>
            <div class="lm-popup-actions">
              <button id="lmTirarBtn" class="mode-card-btn mode-card-btn-gold" ${state.diceAvailable<1?'disabled':''}>TIRAR ${dadosElegidos} DADO${dadosElegidos>1?'S':''}</button>
              <button id="lmCancelarCartaBtn" class="lm-btn-cancelar">${t('lm.cancelar')}</button>
            </div>
          </div>`;
        const minus=document.getElementById('lmDiceMinus');
        const plus=document.getElementById('lmDicePlus');
        const tirarBtn=document.getElementById('lmTirarBtn');
        const cancelarBtn=document.getElementById('lmCancelarCartaBtn');
        if(minus) minus.addEventListener('click', ()=>{ if(dadosElegidos>1){ dadosElegidos--; pintar(); } });
        if(plus) plus.addEventListener('click', ()=>{ if(dadosElegidos<state.diceAvailable){ dadosElegidos++; pintar(); } });
        if(cancelarBtn) cancelarBtn.addEventListener('click', ()=>{
          if(typeof window.playSound==='function') window.playSound('select');
          renderHub();
        });
        if(tirarBtn) tirarBtn.addEventListener('click', ()=>{
          if(typeof window.playSound==='function') window.playSound('select');
          renderRolloCarta(idx, dadosElegidos, esSobre);
        });
      }
      pintar();
    }

    function renderRolloCarta(idx, numDados, esSobre){
      const cartaObjetivo=cartaDefDD(state.directorDeportivoCartas[idx].cartaId);
      const dificultadObjetivo = cartaObjetivo.tipo==='directa'
        ? Math.max(3, cartaObjetivo.dificultad - bonusEstrellasTrabajador('directorDeportivo'))
        : dificultadActualNivelDD(cartaObjetivo);
      overlay.innerHTML=`
        <div class="lm-dilemma-card lm-dilemma-card-dd lm-dice-roll-card">
            ${xCerrarHTML()}
          <div class="lm-dilemma-title" id="lmDiceTitle" style="justify-content:center;text-align:center">TIRANDO ${numDados} DADO${numDados>1?'S':''}...</div>
          <div class="lm-dice-objetivo lm-dice-objetivo-dd">${t('lm.necesitas_sumar')} <strong>${dificultadObjetivo}+</strong></div>
          <div id="lmDice2DRow" class="lm-dice2d-row"></div>
          <div id="lmDiceResultZone"></div>
        </div>`;
      const box=document.getElementById('lmDice2DRow');
      iniciarBarajadoDados(box, numDados, (tiradas)=>{
        const tituloEl=document.getElementById('lmDiceTitle');
        if(tituloEl) tituloEl.textContent='TU TIRADA';
        box.innerHTML='';
        const zona=document.getElementById('lmDiceResultZone');
        mostrarResultadoDados(zona, tiradas,
          (tiradasFinales)=>{
            state.diceAvailable=Math.max(0, state.diceAvailable-numDados);
            return resolverCartaDD(idx, tiradasFinales);
          },
          (resultado)=>{
            if(resultado && resultado.sobreAbierto && resultado.sobreAbierto.length){
              mostrarRevelacionSobreDesdeCorreo(resultado.sobreAbierto, renderHub);
            } else {
              renderHub();
            }
          }
        );
      });
    }

    // Revelación de los 3 jugadores de un sobre — mismo barajado 2D que
    // los dados/las cartas de rerroll, mostrando la posición en grande
    // (todavía sin imagen) y permitiendo fichar al momento.
    function mostrarRevelacionSobre(jugadores, onCerrar){
      overlay.innerHTML=`
        <div class="lm-dilemma-card lm-dilemma-card-dd" style="max-width:640px">
          <div class="lm-dilemma-title"><i class="ph ph-bold ph-envelope-open"></i> ${t('lm.sobre_titulo')}</div>
          <div id="lmSobreReveloZone" class="lm-sobre-grid">
            ${jugadores.map((j,i)=>`<div class="slot-reel lm-sobre-reel" id="lmSobreReel${i}"><div class="slot-strip lm-sobre-face">?</div></div>`).join('')}
          </div>
          <div id="lmSobreResultado"></div>
        </div>`;
      let ticks=0;
      const totalTicks=11+Math.floor(Math.random()*4);
      // Se barajan NOMBRES de jugador al azar (no posiciones): lo que se
      // está sorteando es a qué jugador vas a fichar, no en qué posición
      // va a jugar (eso ya lo trae fijo cada carta del sobre).
      const spin=setInterval(()=>{
        jugadores.forEach((j,i)=>{
          const el=document.getElementById('lmSobreReel'+i);
          if(el) el.querySelector('.lm-sobre-face').textContent=nombreJugadorAleatorio();
        });
        if(typeof window.playSound==='function') window.playSound('spin');
        ticks++;
        if(ticks>=totalTicks){
          clearInterval(spin);
          if(typeof window.playSound==='function') window.playSound('reveal');
          // La fila de barajado ya no hace falta — el resultado real se
          // pinta debajo con las fichas completas; si se deja aquí se
          // queda "temblando" para siempre (la animación de pulso no se
          // detiene sola).
          const zonaReels=document.getElementById('lmSobreReveloZone');
          if(zonaReels) zonaReels.innerHTML='';
          const zona=document.getElementById('lmSobreResultado');
          zona.innerHTML=`<div class="lm-sobre-cards">${jugadores.map((j,i)=>`
            <div class="lm-sobre-card" data-jugador="${i}">
              <div class="lm-sobre-pos">${j.position}</div>
              <div class="lm-sobre-nombre">${j.name}</div>
              <div class="lm-sobre-overall">${j.overall} <span>${t('lm.puntuacion')}</span></div>
              ${(typeof lmSkillActiva==='function' && lmSkillActiva('lm_ojo_clinico')) ? `<div class="lm-sobre-potencial"><i class="ph ph-bold ph-binoculars"></i> ${t('lm.potencial_techo')}: <b>${j.potencial||j.overall}</b></div>` : ''}
              <div class="lm-sobre-stats">
                <span>ATA ${j.attack}</span><span>DEF ${j.defense}</span><span>RIT ${j.pace}</span>
                <span>PAS ${j.passing}</span><span>TEC ${j.technique}</span>
              </div>
              <div class="lm-sobre-salario">${formatoDinero(j.salario)}/mes</div>
              <button class="mode-card-btn mode-card-btn-gold lm-sobre-fichar" data-fichar="${i}">${t('lm.fichar_btn')}</button>
            </div>`).join('')}</div>
            <div class="lm-popup-actions" style="margin-top:12px"><button id="lmSobreCerrar" class="mode-card-btn mode-card-btn-secondary">${t('lm.cerrar_sobre')}</button></div>`;
          zona.querySelectorAll('[data-fichar]').forEach(btn=>{
            btn.addEventListener('click', ()=>{
              const i=parseInt(btn.getAttribute('data-fichar'),10);
              if(typeof window.playSound==='function') window.playSound('select');
              ficharJugadorSobre(jugadores[i]);
              btn.textContent='FICHADO ✔';
              btn.disabled=true;
              btn.closest('.lm-sobre-card').classList.add('lm-sobre-card-fichado');
            });
          });
          document.getElementById('lmSobreCerrar').addEventListener('click', ()=>{
            if(typeof window.playSound==='function') window.playSound('select');
            onCerrar();
          });
        }
      },85);
    }

    renderHub();
  }

  /* ---------- 13g. Salarios de la plantilla — burbuja "i" del Director
     Deportivo: lista completa de jugadores con su salario mensual. ---------- */
  function abrirHistorialFichajesDD(esModoMantener){
    const overlay=document.createElement('div');
    overlay.id='lmHistorialFichajesDDOverlay';
    const historial=state.directorDeportivoHistorial||[];
    overlay.innerHTML=`
      <div class="lm-dilemma-card lm-dilemma-card-dd" style="max-width:520px;text-align:left">
        ${esModoMantener?'':xCerrarHTML()}
        <div class="lm-dilemma-title"><i class="ph ph-bold ph-clock-counter-clockwise"></i> ${t('lm.historico_fichajes_titulo')}</div>
        ${historial.length ? `
        <div class="lm-historial-dd-lista">
          ${historial.slice(0,12).map(h=>`
            <div class="lm-historial-dd-item ${h.tipo==='venta'?'lm-historial-dd-venta':'lm-historial-dd-fichaje'}">
              <i class="ph ph-bold ${h.tipo==='venta'?'ph-arrow-circle-up':'ph-arrow-circle-down'}"></i>
              <div class="lm-historial-dd-texto">
                ${h.tipo==='venta'
                  ? `Vendiste a <strong>${h.nombre}</strong> (${h.position}, ${h.overall}) a ${h.destino} por <strong>${formatoDinero(h.monto)}</strong>`
                  : `Fichaste a <strong>${h.nombre}</strong> (${h.position}, ${h.overall})${h.estrella?` — fichaje estrella, procedente de ${h.procedencia}`:' desde un sobre'}`}
              </div>
              <span class="lm-historial-dd-jornada">J${h.jornada}</span>
            </div>`).join('')}
        </div>` : `<div class="lm-historial-dd-vacio">${t('lm.sin_fichajes_ventas')}</div>`}
        ${esModoMantener?'':`<div class="lm-popup-actions lm-popup-actions-compact"><button id="lmHistorialFichajesDDCerrar" class="mode-card-btn mode-card-btn-gold">${t('lm.cerrar')}</button></div>`}
      </div>`;
    document.getElementById('ligaManagerScreen').appendChild(overlay);
    if(!esModoMantener){
      habilitarCierreOverlay(overlay, ()=>overlay.remove());
      const xBtn=overlay.querySelector('[data-cerrar-x]');
      if(xBtn) xBtn.addEventListener('click', ()=>overlay.remove());
      const btnCerrar=document.getElementById('lmHistorialFichajesDDCerrar');
      if(btnCerrar) btnCerrar.addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        overlay.remove();
      });
    }
  }
  function abrirSalariosDD(esModoMantener){
    const overlay=document.createElement('div');
    overlay.id='lmSalariosOverlay';
    function pintar(){
      const jugadores=[...(state.plantilla||[])].sort((a,b)=>(b.salario||0)-(a.salario||0));
      const totalNomina=jugadores.reduce((s,p)=>s+(p.salario||0),0);
      const filas=jugadores.map(p=>{
        const chequeo=puedeVenderJugador(p.id);
        let accion;
        if(p.enVenta){
          accion=`<span class="lm-venta-estado">EN VENTA (J${p.ventaResolverJornada})</span> <button class="lm-salario-btn lm-salario-btn-retirar" data-retirar-venta="${p.id}">${t('lm.retirar')}</button>`;
        } else {
          accion=`<button class="lm-salario-btn" data-venta="${p.id}" title="${chequeo.ok?'':chequeo.motivo}" ${chequeo.ok?'':'disabled'}>${t('lm.poner_en_venta')}</button>`;
        }
        return `<tr>
          <td>${p.name}${p.injured?` <span class="cross" title="${t('lm.tt_lesionado')}">✚</span>`:''}</td>
          <td>${p.position}</td>
          <td>${p.overall}</td>
          <td>${formatoDinero(p.salario||0)}</td>
          <td class="lm-salario-accion-td">${accion}</td>
        </tr>`;
      }).join('');
      overlay.innerHTML=`
        <div class="lm-dilemma-card lm-dilemma-card-dd" style="max-width:640px;text-align:left">
          ${xCerrarHTML()}
          <div class="lm-dilemma-title"><i class="ph ph-bold ph-file-text"></i> SALARIOS DE LA PLANTILLA</div>
          <div class="lm-setup-desc" style="text-align:center;margin-bottom:8px">${t('lm.nomina_total')} <strong>${formatoDinero(totalNomina)}/mes</strong> · plantilla: <strong>${jugadores.length}</strong> · al poner en venta, el Director Deportivo avisará por correo en 1-3 jornadas con las ofertas que lleguen.</div>
          <div class="lm-salarios-tabla-wrap">
            <table class="lm-salarios-tabla">
              <thead><tr><th>${t('lm.tabla_jugador')}</th><th>Pos</th><th>${t('lm.tabla_punt')}</th><th>${t('lm.tabla_salario')}</th><th></th></tr></thead>
              <tbody>${filas || `<tr><td colspan="5" style="text-align:center">${t('lm.sin_jugadores_plantilla')}</td></tr>`}</tbody>
            </table>
          </div>
          <div class="lm-popup-actions lm-popup-actions-compact">
            ${esModoMantener?'':`<button id="lmSalariosCerrar" class="mode-card-btn mode-card-btn-gold">${t('lm.cerrar')}</button>`}
          </div>
        </div>`;
      const xBtnSal=overlay.querySelector('[data-cerrar-x]');
      if(xBtnSal) xBtnSal.addEventListener('click', ()=>overlay.remove());
      const btnCerrarSal=document.getElementById('lmSalariosCerrar');
      if(btnCerrarSal) btnCerrarSal.addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        overlay.remove();
      });
      overlay.querySelectorAll('[data-venta]').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const jugadorId=btn.getAttribute('data-venta');
          const jugador=(state.plantilla||[]).find(p=>p.id===jugadorId);
          if(!jugador) return;
          const proceder=()=>{
            const r=ponerJugadorEnVenta(jugadorId);
            if(typeof window.playSound==='function') window.playSound('select');
            if(!r.ok && r.motivo) mostrarAvisoJuego(r.motivo);
            pintar();
          };
          if(typeof window.showConfirmPopup==='function'){
            window.showConfirmPopup(`¿Poner a ${jugador.name} en venta? En 1-3 jornadas el Director Deportivo te avisará por correo de las ofertas que lleguen.`, proceder, 'PONER EN VENTA');
          } else if(confirm(`¿Poner a ${jugador.name} en venta?`)){
            proceder();
          }
        });
      });
      overlay.querySelectorAll('[data-retirar-venta]').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const jugadorId=btn.getAttribute('data-retirar-venta');
          if(typeof window.playSound==='function') window.playSound('select');
          quitarJugadorDeVenta(jugadorId);
          pintar();
        });
      });
    }
    document.getElementById('ligaManagerScreen').appendChild(overlay);
    habilitarCierreOverlay(overlay, ()=>overlay.remove());
    pintar();
  }

  const NIVELES_PF_INFO=[
    {track:'resistenciaBase',     get label(){return t('nivel.pf.resistencia.label');}, icon:'ph-heartbeat',       get desc(){return t('nivel.pf.resistencia.desc');}},
    {track:'recuperacionSemanal', get label(){return t('nivel.pf.recuperacion.label');},    icon:'ph-clock-clockwise', get desc(){return t('nivel.pf.recuperacion.desc');}},
    {track:'potencialTecnico',    get label(){return t('nivel.pf.tecnico.label');},       icon:'ph-soccer-ball',     get desc(){return t('nivel.pf.tecnico.desc');}},
    {track:'potencialFisico',     get label(){return t('nivel.pf.fisico.label');},        icon:'ph-lightning',       get desc(){return t('nivel.pf.fisico.desc');}}
  ];
  function renderNivelesPFHTML(){
    return `<div class="med-niveles-grid">${NIVELES_PF_INFO.map(info=>{
      const n=nivelDePF(info.track);
      const completado=n>=NIVEL_MAXIMO_EQUIPO;
      return `<div class="med-nivel-row${completado?' med-nivel-completado':''}">
        ${completado?`<i class="ph ph-bold ph-check-circle med-nivel-check" title="${t('lm.tt_proyecto_completado')}"></i>`:''}
        <i class="ph ph-bold ${info.icon}"></i>
        <div class="med-nivel-info">
          <div class="med-nivel-label">${info.label}</div>
          <div class="med-nivel-desc">${info.desc}</div>
        </div>
        <div class="med-nivel-stars" title="${t('lm.nivel_n_de_x')} ${n}/${NIVEL_MAXIMO_EQUIPO}">${estrellasNivel(n)}</div>
      </div>`;
    }).join('')}</div>`;
  }
  // Resumen compacto del PLAN DE ENTRENAMIENTO — los hasta 3 jugadores
  // elegidos son los únicos que mejoran de verdad al marcar días de
  // entrenamiento en el calendario.
  const STATS_ENTRENO=[
    {key:'attack', label:'Ataque',   icon:'ph-sword'},
    {key:'defense', label:'Defensa', icon:'ph-shield'},
    {key:'pace', label:'Ritmo',      icon:'ph-lightning'},
    {key:'passing', label:'Pase',    icon:'ph-arrows-split'},
    {key:'technique', label:'Técnica', icon:'ph-soccer-ball'}
  ];
  // Sugerencia de enfoque según la posición — un punto de partida
  // razonable que el usuario siempre puede cambiar a mano.
  function statSugeridaPorPosicion(pos){
    if(pos==='DC'||pos==='ED'||pos==='EI') return 'attack';
    if(pos==='DFC'||pos==='LD'||pos==='LI'||pos==='POR') return 'defense';
    if(pos==='MC') return 'passing';
    return 'technique';
  }
  function renderPlanEntrenamientoResumenHTML(){
    const plan=state.pfPlanEntrenamiento||[];
    const chips=plan.map(entry=>{
      const p=(state.plantilla||[]).find(x=>x.id===entry.jugadorId);
      if(!p) return '';
      const statInfo=STATS_ENTRENO.find(s=>s.key===entry.stat);
      return `<span class="lm-plan-chip"><i class="ph ph-bold ${statInfo?statInfo.icon:'ph-question'}"></i>${p.name} <em>${statInfo?statInfo.label:'sin enfoque'}</em></span>`;
    }).filter(Boolean).join('');
    return `<div class="lm-plan-resumen">
      <div class="lm-plan-resumen-texto">
        <i class="ph ph-bold ph-clipboard-text"></i>
        ${chips?`<div class="lm-plan-chips">${chips}</div>`:`<span>${t('lm.sin_elegido_entrenar')}</span>`}
      </div>
      <button id="lmPlanEntrenoBtn" class="mode-card-btn mode-card-btn-gold" style="padding:9px 16px;font-size:13px;white-space:nowrap">${t('lm.plan_entrenamiento')}</button>
    </div>`;
  }

  /* ---------- 13i. Interfaz del Preparador Físico — mismo patrón de
     hub con cartas que médico/mantenimiento/directores. ---------- */
  function abrirPreparadorFisico(){
    const overlay=document.createElement('div');
    overlay.id='lmPreparadorFisicoOverlay';
    document.getElementById('ligaManagerScreen').appendChild(overlay);
    habilitarCierreOverlay(overlay, ()=>{ overlay.remove(); render(); });
    // Delegado: cualquier X que aparezca dentro de este overlay en
    // cualquier pantalla (selector de dados, tirada, etc.) lo cierra.
    overlay.addEventListener('click', (e)=>{
      const xEl = e.target.closest && e.target.closest('[data-cerrar-x]');
      if(xEl){ if(typeof window.playSound==='function') window.playSound('select'); overlay.remove(); render(); }
    });

    function renderHub(){
      const cartasHTML=state.preparadorFisicoCartas.map((instancia,idx)=>{
        const def=cartaDefPF(instancia.cartaId);
        const dificultadEfectiva = def.tipo==='nivel' ? dificultadActualNivelPF(def) : Math.max(3, def.dificultad - bonusEstrellasTrabajador('preparadorFisico'));
        const maxPosible = state.diceAvailable*6;
        const imposiblePorDados = maxPosible < dificultadEfectiva;
        const nivelMaximoYa = def.tipo==='nivel' && nivelDePF(def.track)>=NIVEL_MAXIMO_EQUIPO;
        const bloqueada = imposiblePorDados || nivelMaximoYa;
        const cambioDisponible=(state.preparadorFisicoCambiosUsados||0)<lmCambiosCartaPorPartido();
        let cuerpo;
        if(def.tipo==='nivel'){
          const n=nivelDePF(def.track);
          cuerpo=`<div class="med-card-progress-label" style="text-align:center;letter-spacing:2px;color:var(--gold)">${estrellasNivel(n)}</div>
                  <div class="med-card-dificultad">${nivelMaximoYa?t('lm.nivel_maximo_alcanzado'):`${t('lm.dificultad_lbl')} ${dificultadEfectiva}+ ${t('lm.para_subir_a_nivel')} ${n+1}/${NIVEL_MAXIMO_EQUIPO}`}</div>`;
        } else {
          cuerpo=`<div class="med-card-dificultad">Dificultad ${Math.max(3, def.dificultad - bonusEstrellasTrabajador('preparadorFisico'))}+</div>`;
        }
        return `
        <div class="med-card med-card-pf ${bloqueada&&!nivelMaximoYa?'med-card-bloqueada':''}" data-idx="${idx}">
          <button class="med-card-swap" data-swap="${idx}" title="${t('lm.tt_cambiar_carta')}" ${cambioDisponible?'':'disabled'}><i class="ph ph-bold ph-arrows-clockwise"></i></button>
          <div class="med-card-tag">${def.tipo==='nivel'?t('lm.tag_proyecto'):t('lm.tag_accion')}</div>
          <i class="ph ph-bold ${def.icon} med-card-icon"></i>
          <div class="med-card-title">${tc('pf', def.id, 'nombre', def.nombre)}</div>
          <div class="med-card-divider"></div>
          <div class="med-card-desc">${tc('pf', def.id, 'desc', def.desc)}</div>
          ${cuerpo}
          ${(bloqueada&&!nivelMaximoYa)?`<div class="med-card-bloqueada-label">${t('lm.imposible_dados')}</div>`:(nivelMaximoYa?'':`<button class="mode-card-btn mode-card-btn-gold med-card-btn" data-usar="${idx}" style="padding:7px;font-size:11px">${t('lm.usar_btn')}</button>`)}
        </div>`;
      }).join('');

      overlay.innerHTML=`
        <div class="lm-dilemma-card lm-dilemma-card-pf" style="max-width:640px">
          ${xCerrarHTML()}
          <div class="lm-dilemma-title"><i class="ph ph-bold ph-barbell"></i> ${t('lm.titulo_pf')}</div>
          ${renderPlanEntrenamientoResumenHTML()}
          ${renderNivelesPFHTML()}
          <div class="lm-staff-bar-capital" style="justify-content:center;margin:10px 0 8px"><span><i class="ph ph-bold ph-dice-five"></i> ${t('lm.dados')}: <strong>${state.diceAvailable}</strong></span><span><i class="ph ph-bold ph-arrows-clockwise"></i> ${t('lm.rerrolls')}: <strong>${state.dadoRerollsDisponibles||0}</strong></span><span><i class="ph ph-bold ph-cards"></i> ${t('lm.cambios')}: <strong>${Math.max(0,lmCambiosCartaPorPartido()-(state.preparadorFisicoCambiosUsados||0))}/${lmCambiosCartaPorPartido()}</strong></span></div>
          <div class="med-card-grid">${cartasHTML}</div>
          <div class="lm-popup-actions lm-popup-actions-compact">
            ${mostrarInfoHTML()}
            <button id="lmPreparadorFisicoCerrar" class="mode-card-btn mode-card-btn-secondary">${t('lm.cerrar')}</button>
          </div>
        </div>`;
        wireMostrarInfoHold(overlay, abrirHistorialPF, 'lmHistorialPFOverlay');

      const xBtnPF=overlay.querySelector('[data-cerrar-x]');
      if(xBtnPF) xBtnPF.addEventListener('click', ()=>{ overlay.remove(); render(); });
      const cerrarBtn=document.getElementById('lmPreparadorFisicoCerrar');
      if(cerrarBtn) cerrarBtn.addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        overlay.remove();
        render();
      });
      overlay.querySelectorAll('[data-swap]').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const idx=parseInt(btn.getAttribute('data-swap'),10);
          if((state.preparadorFisicoCambiosUsados||0)>=lmCambiosCartaPorPartido()) return;
          if(typeof window.playSound==='function') window.playSound('select');
          animarRerollCarta(overlay, idx, PREPARADOR_FISICO_CARTAS_BASE, ()=>{
            cambiarCartaPF(idx);
            renderHub();
          });
        });
      });
      overlay.querySelectorAll('[data-usar]').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const idx=parseInt(btn.getAttribute('data-usar'),10);
          if(typeof window.playSound==='function') window.playSound('select');
          renderSelectorCarta(idx);
        });
      });
      const planBtn=document.getElementById('lmPlanEntrenoBtn');
      if(planBtn) planBtn.addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        renderSelectorPlanEntrenamiento();
      });
    }

    function renderSelectorPlanEntrenamiento(){
      // slots: hasta 3 huecos, cada uno {jugadorId, stat} o null si está vacío.
      const guardado=(state.pfPlanEntrenamiento||[]).slice(0,3);
      const slots=[0,1,2].map(i=>guardado[i]?{...guardado[i]}:null);

      function pintarPrincipal(){
        const huecos=slots.map((slot,i)=>{
          if(!slot){
            return `<div class="lm-plan-slot lm-plan-slot-vacio" data-plan-slot-add="${i}">
              <i class="ph ph-bold ph-plus-circle"></i>
              <span>${t('lm.anadir_jugador')}</span>
            </div>`;
          }
          const p=state.plantilla.find(x=>x.id===slot.jugadorId);
          if(!p) return `<div class="lm-plan-slot lm-plan-slot-vacio" data-plan-slot-add="${i}"><i class="ph ph-bold ph-plus-circle"></i><span>${t('lm.anadir_jugador')}</span></div>`;
          return `<div class="lm-plan-slot">
            <div class="lm-plan-slot-top">
              <div class="lm-plan-slot-jugador">
                <strong>${p.name}</strong>
                <span class="lm-hist-tag">${p.position}</span>
              </div>
              <button class="lm-plan-slot-quitar" data-plan-slot-quitar="${i}" title="${t('lm.tt_quitar_del_plan')}"><i class="ph ph-bold ph-x"></i></button>
            </div>
            <div class="lm-plan-slot-label">${t('lm.enfoque_entrenamiento')}</div>
            <div class="lm-plan-stat-row">
              ${STATS_ENTRENO.map(s=>`<button class="lm-plan-stat-btn ${slot.stat===s.key?'lm-plan-stat-activo':''}" data-plan-slot-stat="${i}" data-plan-stat-key="${s.key}" title="${s.label}"><i class="ph ph-bold ${s.icon}"></i><span>${s.label}</span></button>`).join('')}
            </div>
          </div>`;
        }).join('');
        const completos=slots.filter(s=>s && s.stat).length;
        overlay.innerHTML=`
          <div class="lm-dilemma-card lm-dilemma-card-pf" style="width:520px;max-width:92vw;text-align:left">
            ${xCerrarHTML()}
            <div class="lm-dilemma-title"><i class="ph ph-bold ph-clipboard-text"></i> ${t('lm.plan_entrenamiento_titulo')}</div>
            <p class="lm-setup-desc" style="text-align:center;margin-bottom:10px">Elige hasta 3 jugadores y, para cada uno, QUÉ estadística quieres mejorar — un delantero puede entrenar ataque, un central defensa, etc. Solo mejoran de verdad los días de entrenamiento marcados en el calendario.</p>
            <div class="lm-plan-slots">${huecos}</div>
            <div class="lm-popup-actions">
              <button id="lmPlanGuardar" class="mode-card-btn mode-card-btn-gold">GUARDAR (${completos}/3)</button>
              <button id="lmPlanCancelar" class="lm-btn-cancelar">${t('lm.cerrar')}</button>
            </div>
          </div>`;
        overlay.querySelectorAll('[data-plan-slot-add]').forEach(el=>{
          el.addEventListener('click', ()=>{
            const i=parseInt(el.getAttribute('data-plan-slot-add'),10);
            if(typeof window.playSound==='function') window.playSound('select');
            pintarElegirJugador(i);
          });
        });
        overlay.querySelectorAll('[data-plan-slot-quitar]').forEach(el=>{
          el.addEventListener('click', ()=>{
            const i=parseInt(el.getAttribute('data-plan-slot-quitar'),10);
            if(typeof window.playSound==='function') window.playSound('select');
            slots[i]=null;
            pintarPrincipal();
          });
        });
        overlay.querySelectorAll('[data-plan-slot-stat]').forEach(el=>{
          el.addEventListener('click', ()=>{
            const i=parseInt(el.getAttribute('data-plan-slot-stat'),10);
            const key=el.getAttribute('data-plan-stat-key');
            if(typeof window.playSound==='function') window.playSound('select');
            slots[i].stat=key;
            pintarPrincipal();
          });
        });
        document.getElementById('lmPlanCancelar').addEventListener('click', ()=>{
          if(typeof window.playSound==='function') window.playSound('select');
          renderHub();
        });
        document.getElementById('lmPlanGuardar').addEventListener('click', ()=>{
          if(typeof window.playSound==='function') window.playSound('select');
          state.pfPlanEntrenamiento=slots.filter(s=>s && s.jugadorId && s.stat);
          guardarEstado();
          renderHub();
        });
      }

      function pintarElegirJugador(slotIdx){
        const yaElegidosOtros=slots.filter((s,i)=>i!==slotIdx && s).map(s=>s.jugadorId);
        const filas=(state.plantilla||[]).filter(p=>!yaElegidosOtros.includes(p.id)).map(p=>`
          <div class="lm-slot-option" data-plan-elegir-pid="${p.id}">
            <span>${p.name} <span class="lm-hist-tag">${p.position}</span></span>
            <span>Punt. ${p.overall}</span>
          </div>`).join('');
        overlay.innerHTML=`
          <div class="lm-dilemma-card lm-dilemma-card-pf" style="width:480px;max-width:90vw;text-align:left">
            ${xCerrarHTML()}
            <div class="lm-dilemma-title"><i class="ph ph-bold ph-user-focus"></i> ELEGIR JUGADOR</div>
            <div class="lm-slot-list">${filas}</div>
            <div class="lm-popup-actions">
              <button id="lmPlanVolver" class="lm-btn-cancelar">${t('lm.volver')}</button>
            </div>
          </div>`;
        overlay.querySelectorAll('[data-plan-elegir-pid]').forEach(el=>{
          el.addEventListener('click', ()=>{
            const pid=el.getAttribute('data-plan-elegir-pid');
            const p=state.plantilla.find(x=>x.id===pid);
            if(typeof window.playSound==='function') window.playSound('select');
            slots[slotIdx]={jugadorId:pid, stat:statSugeridaPorPosicion(p?p.position:'')};
            pintarPrincipal();
          });
        });
        document.getElementById('lmPlanVolver').addEventListener('click', ()=>{
          if(typeof window.playSound==='function') window.playSound('select');
          pintarPrincipal();
        });
      }

      pintarPrincipal();
    }


    function renderSelectorCarta(idx){
      const def=cartaDefPF(state.preparadorFisicoCartas[idx].cartaId);
      let dadosElegidos=Math.min(1, state.diceAvailable);
      function pintar(){
        overlay.innerHTML=`
          <div class="lm-dilemma-card lm-dilemma-card-pf">
            ${xCerrarHTML()}
            <i class="ph ph-bold ${def.icon}" style="font-size:26px;color:#e08a3e"></i>
            <div class="lm-dilemma-title" style="justify-content:center;text-align:center">${tc('pf', def.id, 'nombre', def.nombre).toUpperCase()}</div>
            <div class="lm-dilemma-text">${tc('pf', def.id, 'desc', def.desc)}${def.tipo==='directa'?` — necesitas sumar <strong class="lm-dificultad-destacada">${Math.max(3, def.dificultad - bonusEstrellasTrabajador('preparadorFisico'))}+</strong>`:` — necesitas sumar <strong class="lm-dificultad-destacada">${dificultadActualNivelPF(def)}+</strong> para subir a nivel ${nivelDePF(def.track)+1}/${NIVEL_MAXIMO_EQUIPO}`}</div>
            <div class="lm-dice-selector">
              <button id="lmDiceMinus" class="lm-dice-stepper">−</button>
              <span id="lmDiceCount">${dadosElegidos}</span>
              <button id="lmDicePlus" class="lm-dice-stepper">+</button>
            </div>
            <div class="lm-setup-desc">dados disponibles: ${state.diceAvailable}</div>
            <div class="lm-popup-actions">
              <button id="lmTirarBtn" class="mode-card-btn mode-card-btn-gold" ${state.diceAvailable<1?'disabled':''}>TIRAR ${dadosElegidos} DADO${dadosElegidos>1?'S':''}</button>
              <button id="lmCancelarCartaBtn" class="lm-btn-cancelar">${t('lm.cancelar')}</button>
            </div>
          </div>`;
        const minus=document.getElementById('lmDiceMinus');
        const plus=document.getElementById('lmDicePlus');
        const tirarBtn=document.getElementById('lmTirarBtn');
        const cancelarBtn=document.getElementById('lmCancelarCartaBtn');
        if(minus) minus.addEventListener('click', ()=>{ if(dadosElegidos>1){ dadosElegidos--; pintar(); } });
        if(plus) plus.addEventListener('click', ()=>{ if(dadosElegidos<state.diceAvailable){ dadosElegidos++; pintar(); } });
        if(cancelarBtn) cancelarBtn.addEventListener('click', ()=>{
          if(typeof window.playSound==='function') window.playSound('select');
          renderHub();
        });
        if(tirarBtn) tirarBtn.addEventListener('click', ()=>{
          if(typeof window.playSound==='function') window.playSound('select');
          renderRolloCarta(idx, dadosElegidos);
        });
      }
      pintar();
    }

    function renderRolloCarta(idx, numDados){
      const cartaObjetivo=cartaDefPF(state.preparadorFisicoCartas[idx].cartaId);
      const dificultadObjetivo = cartaObjetivo.tipo==='directa'
        ? Math.max(3, cartaObjetivo.dificultad - bonusEstrellasTrabajador('preparadorFisico'))
        : dificultadActualNivelPF(cartaObjetivo);
      overlay.innerHTML=`
        <div class="lm-dilemma-card lm-dilemma-card-pf lm-dice-roll-card">
            ${xCerrarHTML()}
          <div class="lm-dilemma-title" id="lmDiceTitle" style="justify-content:center;text-align:center">TIRANDO ${numDados} DADO${numDados>1?'S':''}...</div>
          <div class="lm-dice-objetivo lm-dice-objetivo-pf">${t('lm.necesitas_sumar')} <strong>${dificultadObjetivo}+</strong></div>
          <div id="lmDice2DRow" class="lm-dice2d-row"></div>
          <div id="lmDiceResultZone"></div>
        </div>`;
      const box=document.getElementById('lmDice2DRow');
      iniciarBarajadoDados(box, numDados, (tiradas)=>{
        const tituloEl=document.getElementById('lmDiceTitle');
        if(tituloEl) tituloEl.textContent='TU TIRADA';
        box.innerHTML='';
        const zona=document.getElementById('lmDiceResultZone');
        mostrarResultadoDados(zona, tiradas,
          (tiradasFinales)=>{
            state.diceAvailable=Math.max(0, state.diceAvailable-numDados);
            return resolverCartaPF(idx, tiradasFinales);
          },
          ()=>{ renderHub(); }
        );
      });
    }

    renderHub();
  }

  /* ---------- 13j. Historial de entrenamientos — burbuja "i" del
     Preparador Físico. ---------- */
  function abrirHistorialPF(esModoMantener){
    const overlay=document.createElement('div');
    overlay.id='lmHistorialPFOverlay';
    const hist=state.preparadorFisicoHistorial||[];
    const filas=hist.map(h=>`
      <div class="lm-hist-item">
        <i class="ph ph-bold ph-barbell" style="color:#e08a3e"></i>
        <div style="flex:1">
          <div class="lm-hist-title">${h.jugador} <span class="lm-hist-tag">+${h.cantidad}</span></div>
          <div class="lm-hist-meta">${h.detalle} · Jornada ${h.jornada}</div>
        </div>
      </div>`).join('');
    overlay.innerHTML=`
      <div class="lm-dilemma-card lm-dilemma-card-pf" style="max-width:480px;text-align:left">
        ${xCerrarHTML()}
        <div class="lm-dilemma-title"><i class="ph ph-bold ph-clock-counter-clockwise"></i> ${t('lm.historial_entrenamientos_titulo')}</div>
        <p class="lm-setup-desc" style="text-align:left;margin:10px 0 4px">${t('lm.mejoras_individuales')}</p>
        <div class="lm-hist-list">${filas||`<p class="lm-setup-desc" style="text-align:center">${t('lm.sin_entrenar_nadie')}</p>`}</div>
        ${esModoMantener?'':`<div class="lm-popup-actions lm-popup-actions-compact">
          <button id="lmHistorialPFCerrar" class="mode-card-btn mode-card-btn-gold">${t('lm.cerrar')}</button>
        </div>`}
      </div>`;
    document.getElementById('ligaManagerScreen').appendChild(overlay);
    habilitarCierreOverlay(overlay, ()=>overlay.remove());
    const xBtnHPF=overlay.querySelector('[data-cerrar-x]');
    if(xBtnHPF) xBtnHPF.addEventListener('click', ()=>overlay.remove());
    const btnCerrarHPF=document.getElementById('lmHistorialPFCerrar');
    if(btnCerrarHPF) btnCerrarHPF.addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      overlay.remove();
    });
  }

  /* ---------- 13h. TRABAJADORES — contratar y despedir al cuerpo
     técnico. Cada mes se renuevan 2 candidatos por puesto (mismo momento
     que la nómina), con nivel y sueldo acordes; despedir deja el puesto
     vacante (sin sueldo) hasta contratar a alguien. ---------- */
  function abrirTrabajadores(rolFiltrado){
    const overlay=document.createElement('div');
    overlay.id='lmTrabajadoresOverlay';
    document.getElementById('ligaManagerScreen').appendChild(overlay);
    habilitarCierreOverlay(overlay, ()=>{ overlay.remove(); render(); });
    // Delegado: cualquier X que aparezca dentro de este overlay en
    // cualquier pantalla (selector de dados, tirada, etc.) lo cierra.
    overlay.addEventListener('click', (e)=>{
      const xEl = e.target.closest && e.target.closest('[data-cerrar-x]');
      if(xEl){ if(typeof window.playSound==='function') window.playSound('select'); overlay.remove(); render(); }
    });

    function fichaTrabajadorHTML(rol){
      const actual=state.trabajadores[rol];
      const candidatos=(state.candidatosTrabajo||[]).filter(c=>c.rol===rol).sort((a,b)=>a.nivel-b.nivel);
      const chipActual = actual ? `
        <div class="lm-trab-chip lm-trab-chip-actual">
          <div class="lm-trab-chip-top"><span class="lm-trab-nombre">${actual.nombre}</span><span class="lm-trab-estrellas">${estrellasNivel(actual.nivel, 3)}</span></div>
          <div class="lm-trab-sueldo">${formatoDinero(actual.sueldo)}/mes</div>
          <button class="lm-trab-despedir" data-despedir="${rol}">DESPEDIR (${formatoDinero(calcularFiniquito(actual))})</button>
        </div>` : `
        <div class="lm-trab-chip lm-trab-chip-vacante"><i class="ph ph-bold ph-user-circle-minus"></i><span>${t('lm.vacante')}</span></div>`;
      const chipsCandidatos = candidatos.map(c=>`
        <div class="lm-trab-chip ${c.chollo?'lm-trab-chip-chollo':''}">
          ${c.chollo?'<div class="lm-trab-chollo-badge"><i class="ph ph-bold ph-seal-percent"></i> OPORTUNIDAD</div>':''}
          <div class="lm-trab-chip-top"><span class="lm-trab-nombre">${c.nombre}</span><span class="lm-trab-estrellas">${estrellasNivel(c.nivel, 3)}</span></div>
          <div class="lm-trab-sueldo">${formatoDinero(c.sueldo)}/mes</div>
          <button class="lm-trab-contratar" data-contratar="${c.id}" data-rol="${rol}">${t('lm.contratar')}</button>
        </div>`).join('');
      // Siempre 3 huecos de candidato aunque falten (p.ej. tras contratar
      // a uno este mes) — una ficha genérica gris y desactivada en vez de
      // dejar que la fila se reajuste horizontalmente.
      const huecos=Math.max(0, 3-candidatos.length);
      const chipsGenericos=Array.from({length:huecos}).map(()=>`
        <div class="lm-trab-chip lm-trab-chip-generica">
          <div class="lm-trab-chip-top"><span class="lm-trab-nombre">—</span></div>
          <div class="lm-trab-sueldo">${t('lm.sin_candidato')}</div>
          <button class="lm-trab-generica-btn" disabled>—</button>
        </div>`).join('');
      return `
      <div class="lm-trab-rol-row">
        <div class="lm-trab-rol-titulo"><i class="ph ph-bold ${CORREO_ICONOS[rol]||'ph-user'}"></i><span>${NOMBRE_ROL[rol]}</span></div>
        <div class="lm-trab-chips">${chipActual}${chipsCandidatos}${chipsGenericos}</div>
      </div>`;
    }

    function pintar(){
      const roles = rolFiltrado ? [rolFiltrado] : ROLES_TRABAJO;
      // El overlay entero se reconstruye (innerHTML) cada vez que se
      // contrata/despide o se cambia de filtro, lo que reseteaba su
      // propio scroll a 0 — en móvil eso se sentía como si TODA la
      // pantalla "saltara arriba" de golpe al pulsar un candidato.
      // Guardando y restaurando aquí su scrollTop, la posición se
      // queda exactamente donde estaba el jugador.
      const scrollTopPrevio=overlay.scrollTop;
      overlay.innerHTML=`
        <div class="lm-dilemma-card" style="width:960px;max-width:94vw;text-align:left">
          ${xCerrarHTML()}
          <div class="lm-dilemma-title"><i class="ph ph-bold ph-user-plus"></i> ${t('lm.contratar_btn')}${rolFiltrado?` — ${NOMBRE_ROL[rolFiltrado]}`:''}</div>
          <p class="lm-setup-desc" style="text-align:center;margin-bottom:10px">${t('lm.candidatos_mensuales_msg')}${rolFiltrado?` <span id="lmTrabVerTodos" style="color:var(--gold);cursor:pointer;text-decoration:underline">${t('lm.ver_todos_puestos')}</span>`:''}</p>
          <div class="lm-trab-grid">
            ${roles.map(fichaTrabajadorHTML).join('')}
          </div>
          <div class="lm-popup-actions lm-popup-actions-compact">
            <button id="lmTrabajadoresCerrar" class="mode-card-btn mode-card-btn-gold">${t('lm.cerrar')}</button>
          </div>
        </div>`;
      overlay.scrollTop=scrollTopPrevio;
      const xBtnTrab=overlay.querySelector('[data-cerrar-x]');
      if(xBtnTrab) xBtnTrab.addEventListener('click', ()=>{ overlay.remove(); render(); });
      document.getElementById('lmTrabajadoresCerrar').addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        overlay.remove();
        render();
      });
      const verTodos=document.getElementById('lmTrabVerTodos');
      if(verTodos) verTodos.addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        rolFiltrado=null;
        pintar();
      });
      overlay.querySelectorAll('[data-despedir]').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          if(typeof window.playSound==='function') window.playSound('select');
          const rol=btn.getAttribute('data-despedir');
          const actual=state.trabajadores[rol];
          const proceder=()=>{ despedirTrabajador(rol); pintar(); };
          if(typeof window.showConfirmPopup==='function'){
            window.showConfirmPopup(`¿Despedir a ${actual.nombre} (${NOMBRE_ROL[rol]})? Costará un finiquito de ${formatoDinero(calcularFiniquito(actual))} y el puesto quedará vacante hasta que contrates a otra persona.`, proceder, 'DESPEDIR');
          } else if(confirm(`¿Despedir a ${actual.nombre} por ${formatoDinero(calcularFiniquito(actual))} de finiquito?`)){
            proceder();
          }
        });
      });
      overlay.querySelectorAll('[data-contratar]').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const candidatoId=btn.getAttribute('data-contratar');
          const rol=btn.getAttribute('data-rol');
          const actual=state.trabajadores[rol];
          const proceder=()=>{
            if(typeof window.playSound==='function') window.playSound('select');
            contratarTrabajador(rol, candidatoId);
            pintar();
          };
          if(actual){
            const finiquito=calcularFiniquito(actual);
            if(typeof window.showConfirmPopup==='function'){
              window.showConfirmPopup(`Ya tienes a ${actual.nombre} en este puesto. Al contratar a otra persona se le despedirá (finiquito de ${formatoDinero(finiquito)}). ¿Continuar?`, proceder, t('lm.contratar_btn'));
            } else if(confirm(`¿Despedir a ${actual.nombre} (finiquito ${formatoDinero(finiquito)}) para contratar al nuevo candidato?`)){
              proceder();
            }
          } else {
            proceder();
          }
        });
      });
    }
    pintar();
  }

  /* ---------- 14. Inicialización ---------- */
  // Rellena el panel ESTADÍSTICAS del menú de perfil con los datos
  // reales de la temporada de Liga Manager en curso — mismo estilo que
  // Copa Leyendas, pero con sus propios números.
  function renderLigaManagerProfileStats(){
    if(!state || !state.setupComplete) return;
    const set=(id,val)=>{ const el=document.getElementById(id); if(el) el.textContent=val; };
    let pj=0,pg=0,pe=0,pp=0,gf=0,gc=0;
    for(let j=0;j<state.jornadaActual-1;j++){
      (state.calendario[j]||[]).forEach(partido=>{
        if(partido.home.id!=='lm_0' && partido.away.id!=='lm_0') return;
        const key=j+'-'+partido.home.id+'-'+partido.away.id;
        const res=state.resultados[key];
        if(!res) return;
        pj++;
        const esLocal=partido.home.id==='lm_0';
        const misGoles=esLocal?res.golesA:res.golesB, susGoles=esLocal?res.golesB:res.golesA;
        gf+=misGoles; gc+=susGoles;
        if(misGoles>susGoles) pg++; else if(misGoles===susGoles) pe++; else pp++;
      });
    }
    const clasif=calcularClasificacion();
    const posicion=clasif.findIndex(t=>t.id==='lm_0')+1;
    set('lmpstat-jornada', Math.min(state.jornadaActual,(state.calendario||[]).length||38)+'/'+((state.calendario||[]).length||38));
    set('lmpstat-posicion', posicion>0?(posicion+'º'):'—');
    set('lmpstat-games', pj);
    set('lmpstat-wins', pg);
    set('lmpstat-draws', pe);
    set('lmpstat-losses', pp);
    set('lmpstat-gf', gf);
    set('lmpstat-ga', gc);
    set('lmpstat-plantilla', (state.plantilla||[]).length);
    const racha=state.rachaResultados||0;
    set('lmpstat-racha', racha===0 ? '—' : (racha>0 ? `${racha}V` : `${Math.abs(racha)}D`));
    set('lmpstat-capital', formatoDinero(state.capital||0));
  }
  window.renderLigaManagerProfileStats = renderLigaManagerProfileStats;

  // Caché de los escudos aleatorios reales (assets/escudos_random/) —
  // Cloudflare Pages no puede listar el contenido de una carpeta en
  // tiempo real (alojamiento 100% estático), así que se lee un
  // manifest.json con la lista de archivos, generado de antemano.
  // Para añadir más escudos en el futuro: basta con soltar el .png
  // nuevo en esa carpeta y añadir su nombre de archivo a
  // manifest.json — el juego no necesita ningún otro cambio.
  let ESCUDOS_RANDOM_CACHE=null;
  async function cargarEscudosRandomManifest(){
    try{
      const resp=await fetch('assets/escudos_random/manifest.json');
      if(!resp.ok) throw new Error('sin manifest');
      const lista=await resp.json();
      ESCUDOS_RANDOM_CACHE=Array.isArray(lista) ? lista : [];
    }catch(e){ ESCUDOS_RANDOM_CACHE=[]; }
  }
  // Convierte "80's_legends.png" -> "80's Legends" — guiones bajos
  // por espacios, primera letra de cada palabra en mayúscula (el
  // resto en minúscula). Los dígitos/símbolos que ya empiecen la
  // palabra (como "80's") se quedan igual, no tienen mayúscula que
  // aplicar.
  function nombreClubDesdeArchivoEscudo(nombreArchivo){
    const sinExtension=nombreArchivo.replace(/\.png$/i, '');
    return sinExtension.split('_').map(palabra=>{
      if(!palabra) return palabra;
      return palabra.charAt(0).toUpperCase()+palabra.slice(1).toLowerCase();
    }).join(' ');
  }

  function init(){
    try{
      state=cargarEstado();
      setupStep=1;
      formacionCategoriaVista=null;
      seleccionJugador=null;
      lmCargarUpgradeCache().then(()=>render());
      lmCargarSkillsCache();
      cargarEscudosRandomManifest();
      render();
      inicializarBarraMovilLM();
      // Si el jugador cerró el navegador a mitad de una semana del
      // árbol de nodos, al volver a cargar la partida retoma justo
      // donde lo dejó — el árbol es obligatorio, así que se reabre
      // solo en vez de esperar a que el jugador lo busque.
      if(state.semanaNodos && state.semanaNodos.dias.some(d=>d.elegido==null) && typeof abrirArbolNodosSemana==='function'){
        abrirArbolNodosSemana();
      }
    }catch(e){
      console.error('Error en init() de Liga Manager:', e);
      const root=document.getElementById('ligaManagerScreen');
      if(root){
        root.innerHTML=`
          <div style="padding:24px;color:#fff;font-family:monospace;font-size:13px;line-height:1.6;max-width:100%;overflow-wrap:break-word">
            <div style="color:#e24b4a;font-size:16px;font-weight:bold;margin-bottom:12px">⚠️ Error al iniciar Liga Manager</div>
            <div style="color:#ccc;margin-bottom:12px">${t('lm.copia_mensaje_dev')}</div>
            <div style="background:#1a1a1a;border:1px solid #e24b4a;border-radius:6px;padding:12px;color:#ffb3b3;user-select:text">${(e && e.message) ? e.message : String(e)}${(e && e.stack) ? '<br><br>'+e.stack.replace(/\\n/g,'<br>') : ''}</div>
          </div>`;
      }
    }
  }

  // Barra de pestañas móvil de Liga Manager. Los botones CAMPO/EQUIPO/
  // RIVAL/TÉCNICOS son enlaces de ancla nativos (<a href="#id">) — el
  // propio navegador hace el scroll, así que aquí NUNCA se fuerza ese
  // scroll desde JavaScript (eso era lo que causaba que siempre
  // "volviera a CAMPO" en cada actualización). Esta función solo se
  // encarga de: 1) resaltar en amarillo la pestaña que se acaba de
  // pulsar, 2) cerrar cualquier ventana emergente que estuviera
  // abierta, para que no se quede tapando el contenido al navegar.
  // Aviso de inactividad: si pasan 30s sin pulsar JUGAR/SEGUIR, se
  // enciende una notificación roja sobre el icono CAMPO de la barra
  // móvil, para que quede claro que hay una acción pendiente ahí.
  let timerInactividadLM=null;
  function reiniciarAvisoInactividadCampo(){
    if(timerInactividadLM) clearTimeout(timerInactividadLM);
    const badge=document.getElementById('lmCampoBadge');
    if(badge) badge.style.display='none';
    timerInactividadLM=setTimeout(()=>{
      const b=document.getElementById('lmCampoBadge');
      if(b) b.style.display='flex';
    }, 30000);
  }
  function inicializarBarraMovilLM(){
    const barra=document.getElementById('lmMobileTabBar');
    if(!barra || barra.dataset.wired) return; // solo una vez, la barra es HTML estático
    barra.dataset.wired='1';
    // JUGAR/SEGUIR se regenera en cada render() — se delega el evento
    // sobre el contenedor fijo para no perder el cableado nunca.
    const screen=document.getElementById('ligaManagerScreen');
    if(screen) screen.addEventListener('click', (e)=>{
      if(e.target.closest && (e.target.closest('#lmJugarBtn') || e.target.closest('#lmLiveContinuar'))){
        reiniciarAvisoInactividadCampo();
      }
    });
    barra.querySelectorAll('.mob-tab[data-lmtab]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        if(typeof window.playSound==='function') window.playSound('select');
        barra.querySelectorAll('.mob-tab').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        if(btn.dataset.lmtab==='tecnicos'){
          const badge=document.getElementById('lmTecnicosBadge');
          if(badge) badge.style.display='none';
        }
        if(btn.dataset.lmtab==='equipo'){
          const badgeCampo=document.getElementById('lmCampoBadge');
          if(badgeCampo) badgeCampo.style.display='none';
        }
        // Cierra cualquier popup de Liga Manager que estuviera abierto,
        // para que la navegación a la sección no se quede tapada detrás
        // — EXCEPTO el partido en curso (modo automático o manager),
        // que nunca se puede cerrar mientras se está reproduciendo.
        document.querySelectorAll('#ligaManagerScreen [id$="Overlay"]').forEach(ov=>{
          const liveContinuarBtn=document.getElementById('lmLiveContinuar');
          const partidoAutoEnCurso = ov.id==='lmMatchOverlay' && liveContinuarBtn && liveContinuarBtn.style.display==='none';
          const resumenBoxLM=document.getElementById('lmVisorResumenBox');
          const partidoManagerEnCurso = ov.id==='lmVisorPartidoOverlay' && resumenBoxLM && resumenBoxLM.style.display==='none';
          if(partidoAutoEnCurso || partidoManagerEnCurso) return;
          ov.remove();
        });
        // Y también el ticket, si estuviera abierto — vive fuera de
        // Liga Manager, así que se cierra aparte.
        if(typeof window.closeTicketOverlay==='function') window.closeTicketOverlay();
      });
    });
    // TICKETS y CLASIF. también cuentan como "pestaña" a efectos de
    // resaltado, aunque abran una ventana en vez de desplazar la vista.
    ['lmTicketTabBtn','lmClasifTabBtn'].forEach(id=>{
      const btn=document.getElementById(id);
      if(btn) btn.addEventListener('click', ()=>{
        barra.querySelectorAll('.mob-tab').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        if(id==='lmClasifTabBtn' && typeof window.closeTicketOverlay==='function') window.closeTicketOverlay();
      });
    });
  }

  window.rerenderLigaManager = function(){
    if(state && state.setupComplete){
      try{ render(); }catch(e){ console.error('Error al redibujar Liga Manager:', e); }
    }
  };
  window.G2G_LigaManager={ init, abandonarLiga };

})();
