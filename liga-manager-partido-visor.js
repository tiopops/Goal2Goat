/* ============================================================
   GOAL2GOAT — Liga Manager: visor de partido en Modo Manager
   ------------------------------------------------------------
   Módulo aparte y autocontenido (mismo patrón que
   liga-manager-dice3d.js): toda la lógica de simulación e IA del
   partido (posicionamiento, pases, disparos, córners, tarjetas,
   velocidad de reproducción) vive aquí, fuera de liga-manager.js,
   para no seguir engordando ese archivo.

   Expone una única función global:
     window.G2G_abrirVisorPartidoManager(info, onFinish, deps)

   `deps` son las piezas que este módulo necesita de liga-manager.js,
   pasadas explícitamente (nada de variables compartidas por cierre):
     - state: el estado guardado de la partida
     - t: función de traducción (también está en window, pero se pasa
       igual para que este módulo no dependa de detalles de carga)
     - formacionActual(): formación real elegida por el jugador
     - generarSlotsFormacion(code): posiciones de una formación dada
     - climaDelPartido(): clima real de la jornada en curso
     - calcularStatsEquipo(): estadísticas reales de mi equipo
   ============================================================ */
(function(){

  function elegirFormacionRivalVisor(rival){
    const desequilibrio=rival.attack-rival.defense;
    if(desequilibrio>10) return '4-3-3';
    if(desequilibrio<-10) return '5-3-2';
    return '4-4-2';
  }

  function abrirVisorPartidoManager(info, onFinish, deps){
    const {state, t, formacionActual, generarSlotsFormacion, climaDelPartido, calcularStatsEquipo, plantillaEfectivaRival, crestHTML, rivalCrestHTML, mostrarHistoricoPartido} = deps;
    const miEsLocal = info.home.id==='lm_0';
    const rival = miEsLocal ? info.away : info.home;
    const miNombre = miEsLocal ? info.home.name : info.away.name;
    const rivalNombre = rival.name;

    // Estadísticas reales de ambos equipos — un equipo con mejor pase
    // y técnica falla menos balones en la simulación, uno peor pierde
    // el balón con más frecuencia sin necesitar que el rival presione.
    const misStatsReales = (typeof calcularStatsEquipo==='function') ? calcularStatsEquipo() : {passing:60,technique:60};
    const precisionMia = Math.max(0.25, Math.min(0.95, (misStatsReales.passing+misStatsReales.technique)/200));
    const precisionRival = Math.max(0.25, Math.min(0.95, (rival.passing+rival.technique)/200));

    // En vez de rotar con CSS (frágil: el campo se veía cortado en
    // escritorio), se generan las coordenadas ya en su orientación
    // final según el dispositivo — vertical en móvil, horizontal en
    // escritorio — usando siempre el mismo sistema de referencia base
    // (formacionActual().slots, x/y de 0 a 100).
    const esEscritorio = window.matchMedia && window.matchMedia('(min-width:900px)').matches;
    const ANCHO = esEscritorio ? 150 : 100;
    const ALTO = esEscritorio ? 100 : 150;
    const CENTRO_X = ANCHO/2, CENTRO_Y = ALTO/2;

    const misSlotsBase = formacionActual().slots;
    const rivalSlotsBase = generarSlotsFormacion(elegirFormacionRivalVisor(rival));
    let misSlots, rivalSlots, miGolXY, rivalGolXY, centroCampo;
    if(esEscritorio){
      // Horizontal: yo a la izquierda atacando a la derecha (mi
      // portería en x≈4). s.y del slot original (0=línea rival,
      // 100=mi portería) pasa a ser la distancia desde la izquierda —
      // el portero (s.y alto) debe quedar CERCA de mi portería, no
      // cerca del centro (fórmula antes invertida por error).
      misSlots = misSlotsBase.map(s=>({x:4+((100-s.y)*0.71), y:s.x}));
      rivalSlots = rivalSlotsBase.map(s=>({x:ANCHO-4-((100-s.y)*0.71), y:100-s.x}));
      miGolXY={x:3,y:CENTRO_Y}; rivalGolXY={x:ANCHO-3,y:CENTRO_Y};
    } else {
      // Vertical: yo abajo atacando hacia arriba.
      misSlots = misSlotsBase.map(s=>({x:s.x, y:75+(s.y*0.75)}));
      rivalSlots = rivalSlotsBase.map(s=>({x:100-s.x, y:75-(s.y*0.75)}));
      miGolXY={x:CENTRO_X,y:147}; rivalGolXY={x:CENTRO_X,y:3};
    }
    centroCampo={x:CENTRO_X,y:CENTRO_Y};

    // Dorsal y nombre real de cada titular: se cruza la posición de la
    // formación (slot.slot, p.ej. "POR", "DFC1") con la alineación real
    // guardada, y de ahí con la plantilla, para sacar sus datos de
    // verdad — no un número ni un nombre inventado.
    const misNumeros = misSlotsBase.map(s=>{
      const pid = state.alineacion ? state.alineacion[s.slot] : null;
      const jugador = pid ? (state.plantilla||[]).find(p=>p.id===pid) : null;
      return (jugador && jugador.numero) ? jugador.numero : null;
    });
    const misNombres = misSlotsBase.map(s=>{
      const pid = state.alineacion ? state.alineacion[s.slot] : null;
      const jugador = pid ? (state.plantilla||[]).find(p=>p.id===pid) : null;
      return jugador ? jugador.name : null;
    });
    // El rival sí tiene una plantilla real de verdad (equipo de LaLiga
    // con sus jugadores reales) — se usa esa plantilla efectiva,
    // emparejada por orden con las posiciones de su formación.
    const rivalPlantillaEfectiva = (typeof plantillaEfectivaRival==='function') ? plantillaEfectivaRival(rival) : [];
    const rivalNumeros = rivalSlotsBase.map((s,i)=>(rivalPlantillaEfectiva[i]&&rivalPlantillaEfectiva[i].n) ? rivalPlantillaEfectiva[i].n : i+1);
    const rivalNombres = rivalSlotsBase.map((s,i)=>rivalPlantillaEfectiva[i] ? rivalPlantillaEfectiva[i].name : null);

    // Césped: un rectángulo de fondo cubre TODO el campo con el verde
    // claro (antes se dibujaban solo 8 franjas finas sueltas, dejando
    // huecos sin pintar entre ellas que mostraban el fondo oscuro de
    // la página por detrás — de ahí las "franjas negras"). Ahora solo
    // se dibujan encima las franjas oscuras, sobre una base ya
    // completamente cubierta.
    const NFRANJAS=8;
    let franjasHTML=`<rect x="0" y="0" width="${ANCHO}" height="${ALTO}" fill="#3e9853"/>`;
    const anchoLargo = esEscritorio ? ANCHO : ALTO; // dimensión a lo largo del eje de ataque
    for(let i=0;i<NFRANJAS;i++){
      const pos = (5.9375 + i*11.71875)/100*anchoLargo;
      const grosor = 5.9375/100*anchoLargo;
      if(esEscritorio){
        franjasHTML+=`<rect x="${pos}" y="0" width="${grosor}" height="${ALTO}" fill="#3a8f4d"/>`;
      } else {
        franjasHTML+=`<rect x="0" y="${pos}" width="${ANCHO}" height="${grosor}" fill="#3a8f4d"/>`;
      }
    }
    // Líneas del campo — mismo color y opacidad que el campo real
    // (rgba blanco, no un verde claro sólido), con las mismas
    // proporciones relativas del área, el área pequeña y el círculo.
    const COLOR_LINEA='rgba(255,255,255,.45)';
    const COLOR_BORDE='rgba(255,255,255,.3)';
    const areaAncho=58.3, areaProf=16.4, seisAncho=25, seisProf=7.03, radioCirculo=11.4, radioArco=4.7;
    const lineasCampo = esEscritorio ? `
            <rect x="0" y="0" width="${ANCHO}" height="${ALTO}" fill="none" stroke="${COLOR_BORDE}" stroke-width="0.4"/>
            <line x1="${CENTRO_X}" y1="0" x2="${CENTRO_X}" y2="${ALTO}" stroke="${COLOR_LINEA}" stroke-width="0.45"/>
            <circle cx="${CENTRO_X}" cy="${CENTRO_Y}" r="${radioCirculo/100*ALTO}" fill="none" stroke="${COLOR_LINEA}" stroke-width="0.45"/>
            <rect x="0" y="${(50-areaAncho/2)/100*ALTO}" width="${areaProf/100*ANCHO}" height="${areaAncho/100*ALTO}" fill="none" stroke="${COLOR_LINEA}" stroke-width="0.45"/>
            <rect x="${ANCHO-areaProf/100*ANCHO}" y="${(50-areaAncho/2)/100*ALTO}" width="${areaProf/100*ANCHO}" height="${areaAncho/100*ALTO}" fill="none" stroke="${COLOR_LINEA}" stroke-width="0.45"/>
            <rect x="0" y="${(50-seisAncho/2)/100*ALTO}" width="${seisProf/100*ANCHO}" height="${seisAncho/100*ALTO}" fill="none" stroke="${COLOR_LINEA}" stroke-width="0.45"/>
            <rect x="${ANCHO-seisProf/100*ANCHO}" y="${(50-seisAncho/2)/100*ALTO}" width="${seisProf/100*ANCHO}" height="${seisAncho/100*ALTO}" fill="none" stroke="${COLOR_LINEA}" stroke-width="0.45"/>
    ` : `
            <rect x="0" y="0" width="${ANCHO}" height="${ALTO}" fill="none" stroke="${COLOR_BORDE}" stroke-width="0.4"/>
            <line x1="0" y1="${CENTRO_Y}" x2="${ANCHO}" y2="${CENTRO_Y}" stroke="${COLOR_LINEA}" stroke-width="0.45"/>
            <circle cx="${CENTRO_X}" cy="${CENTRO_Y}" r="${radioCirculo/100*ANCHO}" fill="none" stroke="${COLOR_LINEA}" stroke-width="0.45"/>
            <rect x="${(50-areaAncho/2)/100*ANCHO}" y="0" width="${areaAncho/100*ANCHO}" height="${areaProf/100*ALTO}" fill="none" stroke="${COLOR_LINEA}" stroke-width="0.45"/>
            <rect x="${(50-areaAncho/2)/100*ANCHO}" y="${ALTO-areaProf/100*ALTO}" width="${areaAncho/100*ANCHO}" height="${areaProf/100*ALTO}" fill="none" stroke="${COLOR_LINEA}" stroke-width="0.45"/>
            <rect x="${(50-seisAncho/2)/100*ANCHO}" y="0" width="${seisAncho/100*ANCHO}" height="${seisProf/100*ALTO}" fill="none" stroke="${COLOR_LINEA}" stroke-width="0.45"/>
            <rect x="${(50-seisAncho/2)/100*ANCHO}" y="${ALTO-seisProf/100*ALTO}" width="${seisAncho/100*ANCHO}" height="${seisProf/100*ALTO}" fill="none" stroke="${COLOR_LINEA}" stroke-width="0.45"/>
    `;

    function puntoJugadorHTML(s, esGK, esMio, idx, numero, nombre){
      const claseEquipo = esMio ? 'lm-visor-punto-mio' : 'lm-visor-punto-rival';
      const r = esGK ? 3.1 : 2.5;
      const id = `lmVisorJ_${esMio?'m':'r'}${idx}`;
      const num = numero!=null ? numero : (idx+1);
      // Se muestra el nombre completo, igual que en el campo real de
      // Copa Leyendas/Liga Manager (player.name se pinta entero ahí).
      const nombreCompleto = nombre ? nombre.trim() : '';
      // Círculo, número y nombre viven en el MISMO grupo, movido con
      // un único transform — así nunca pueden desincronizarse entre
      // sí (antes, al animar cx/cy y x/y por separado, el número
      // podía llegar antes o después que el círculo).
      return `<g class="lm-visor-jugador-g" id="${id}" transform="translate(${s.x},${s.y})">
        <circle cx="0" cy="0" r="${r}" class="lm-visor-punto ${claseEquipo}${esGK?' lm-visor-punto-gk':''}"/>
        <text x="0" y="0" class="lm-visor-numero${esGK?' lm-visor-numero-gk':''}">${num}</text>
        ${nombreCompleto?`<text x="0" y="${r+2.3}" class="lm-visor-nombre-jugador">${nombreCompleto}</text>`:''}
      </g>`;
    }

    const clima = (info.climaId && typeof WEATHER_TYPES!=='undefined')
      ? WEATHER_TYPES.find(w=>w.id===info.climaId)
      : ((typeof climaDelPartido==='function') ? climaDelPartido() : null);
    const climaClase = clima ? `lm-visor-clima-${clima.id} weather-fx-${clima.id}` : '';

    const overlay=document.createElement('div');
    overlay.id='lmVisorPartidoOverlay';
    overlay.innerHTML=`
      <div class="lm-visor-partido-card">
        <div class="lm-visor-marcador">
          <div class="lm-visor-equipo-bloque">
            ${crestHTML ? crestHTML(state.escudo, 44) : ''}
            <span class="lm-visor-equipo lm-visor-equipo-mia">${miNombre}</span>
          </div>
          <span class="lm-visor-resultado" id="lmVisorResultado">0 - 0</span>
          <div class="lm-visor-equipo-bloque">
            ${rivalCrestHTML ? rivalCrestHTML(44, rival.crestImg) : ''}
            <span class="lm-visor-equipo lm-visor-equipo-rival">${rivalNombre}</span>
          </div>
        </div>
        <div class="lm-visor-marcador-linea"></div>
        <div class="lm-visor-minutero" id="lmVisorMinutero">0'</div>
        ${clima?`<div class="lm-visor-clima-bar">${clima.label}</div>`:''}
        <div class="lm-visor-campo-wrap ${climaClase}">
          <svg class="lm-visor-campo-svg" viewBox="0 0 ${ANCHO} ${ALTO}" preserveAspectRatio="xMidYMid meet">
            ${franjasHTML}
            ${lineasCampo}
            <circle cx="${CENTRO_X}" cy="${CENTRO_Y}" r="0.8" fill="#eaf5ea" opacity="0.9"/>
            <g id="lmVisorGrupoRival">${rivalSlots.map((s,i)=>puntoJugadorHTML(s, i===0, false, i, rivalNumeros[i], rivalNombres[i])).join('')}</g>
            <g id="lmVisorGrupoMio">${misSlots.map((s,i)=>puntoJugadorHTML(s, i===0, true, i, misNumeros[i], misNombres[i])).join('')}</g>
            <circle cx="${CENTRO_X}" cy="${CENTRO_Y}" r="1.3" class="lm-visor-balon" id="lmVisorBalon"/>
            <circle cx="${CENTRO_X}" cy="${CENTRO_Y}" r="3.6" class="lm-visor-resalte" id="lmVisorResalte" opacity="0"/>
          </svg>
          <div class="lm-visor-anuncio" id="lmVisorAnuncio"></div>
          ${(clima&&clima.id==='rain')?`<div class="lm-visor-lluvia">${Array.from({length:40}).map(()=>{
            const left=Math.random()*100, duration=(0.5+Math.random()*0.4).toFixed(2);
            const negDelay=(-Math.random()*duration).toFixed(2);
            const opacity=(0.4+Math.random()*0.4).toFixed(2);
            return `<div class="weather-drop" style="left:${left}%;animation-duration:${duration}s;animation-delay:${negDelay}s;opacity:${opacity}"></div>`;
          }).join('')}${Array.from({length:40}).map(()=>{
            const left=Math.random()*100, top=10+Math.random()*82;
            const duration=(0.9+Math.random()*0.8).toFixed(2), delay=(-Math.random()*1.6).toFixed(2);
            return `<div class="weather-splash" style="left:${left}%;top:${top}%;animation-duration:${duration}s;animation-delay:${delay}s"></div>`;
          }).join('')}</div>`:''}
          ${(clima&&clima.id==='snow')?`<div class="lm-visor-nieve">${Array.from({length:28}).map(()=>{
            const left=Math.random()*100, duration=(3+Math.random()*3).toFixed(2), size=(6+Math.random()*7).toFixed(1);
            const negDelay=(-Math.random()*duration).toFixed(2);
            const opacity=(0.55+Math.random()*0.4).toFixed(2);
            return `<div class="weather-flake" style="left:${left}%;font-size:${size}px;animation-duration:${duration}s;animation-delay:${negDelay}s;opacity:${opacity}">❄</div>`;
          }).join('')}</div>`:''}
          ${(clima&&clima.id==='wind')?`<div class="lm-visor-viento">${Array.from({length:3}).map((_,i)=>`<div class="weather-gust" style="animation-delay:${(i*1.1).toFixed(1)}s"></div>`).join('')}</div>`:''}
          ${(clima&&(clima.id==='rain'||clima.id==='hot'||clima.id==='sunny'))?`<div class="weather-sheen"></div>`:''}
        </div>
        <div class="lm-visor-info-bar" id="lmVisorInfoBar">${t('lm.viendo_partido')}</div>
        <div id="lmVisorResumenBox" style="display:none"></div>
        <button id="lmVisorHistoricoBtn" class="mode-card-btn mode-card-btn-secondary" style="display:none;width:calc(100% - 32px);margin:0 16px 8px"><i class="ph ph-bold ph-notebook"></i> ${t('lm.historico_partido_btn')}</button>
        <div class="lm-popup-actions">
          <button id="lmVisorVelocidadBtn" class="mode-card-btn mode-card-btn-secondary"><i class="ph ph-bold ph-fast-forward"></i> ${t('lm.velocidad')} 1X</button>
          <button id="lmVisorCerrarBtn" class="mode-card-btn mode-card-btn-gold">${t('lm.terminar_mostrar_resultados')}</button>
        </div>
      </div>`;
    document.getElementById('ligaManagerScreen').appendChild(overlay);

    const balon=overlay.querySelector('#lmVisorBalon');
    const infoBar=overlay.querySelector('#lmVisorInfoBar');
    const resEl=overlay.querySelector('#lmVisorResultado');
    const cerrarBtn=overlay.querySelector('#lmVisorCerrarBtn');
    const grupoMio=overlay.querySelector('#lmVisorGrupoMio');
    const grupoRival=overlay.querySelector('#lmVisorGrupoRival');
    const anuncioEl=overlay.querySelector('#lmVisorAnuncio');
    const minuteroEl=overlay.querySelector('#lmVisorMinutero');
    const miLado = miEsLocal?'home':'away';
    // 1x = el partido completo (90 minutos) se resuelve en 1 minuto
    // real. 2x y 3x aceleran el tiempo REAL de reproducción (el botón
    // de velocidad los cicla), pero el reparto de los goles reales
    // sobre los 90 minutos no cambia — solo se ve más rápido.
    let velocidadPartido=1;
    const DURACION_TOTAL=60000;
    function real(ms){ return ms/velocidadPartido; }
    // Texto grande centrado sobre el campo — GOL, descanso, final del
    // partido. Aparece un instante y se desvanece solo.
    function mostrarTextoGrande(texto, duracionMs){
      anuncioEl.textContent=texto;
      anuncioEl.classList.add('lm-visor-anuncio-activo');
      setTimeout(()=>anuncioEl.classList.remove('lm-visor-anuncio-activo'), duracionMs);
    }
    // Minutero en tiempo real: se actualiza solo, a partir del tiempo
    // de partido ya acumulado por la simulación (tiempoTranscurrido),
    // así respeta las pausas de gol/descanso sin necesitar relojes
    // aparte que se puedan desincronizar.
    const minuteroInterval=setInterval(()=>{
      const minuto=Math.max(0, Math.min(90, Math.floor((tiempoTranscurrido/DURACION_TOTAL)*90)));
      minuteroEl.textContent=(minuto>=90?'90+':minuto)+"'";
    }, 250);
    const desplazamientoMio = esEscritorio ? 'translateX(6px)' : 'translateY(-6px)';
    const desplazamientoRival = esEscritorio ? 'translateX(-6px)' : 'translateY(6px)';

    function moverBalon(x,y,durMs){
      const durReal=real(durMs);
      balon.style.transition=`cx ${durReal}ms ease-out, cy ${durReal}ms ease-out`;
      // Simula un pase alto sin animar ningún giro (mucho más simple
      // y seguro): en un trayecto largo, el balón crece en la primera
      // mitad del recorrido y encoge en la segunda — una parábola de
      // verdad, con el punto más grande justo en el centro del
      // trayecto, no una meseta que se queda grande un rato y luego
      // encoge de golpe.
      const cxActual=parseFloat(balon.getAttribute('cx'))||0;
      const cyActual=parseFloat(balon.getAttribute('cy'))||0;
      const distanciaRecorrida=Math.hypot(x-cxActual, y-cyActual);
      // Factor gradual, no un interruptor todo-o-nada: por debajo de
      // 16 unidades no pasa nada (pase raso normal), y a partir de ahí
      // el tamaño crece PROGRESIVAMENTE con la distancia real hasta un
      // máximo hacia los 46+ — así dos pases de longitud parecida se
      // ven parecidos entre sí, sin ningún salto brusco de "ahora sí,
      // ahora no" entre uno de 21 unidades y otro de 23.
      const factorAltura = Math.max(0, Math.min(1, (distanciaRecorrida-16)/30));
      if(factorAltura>0.04){
        const radioBase=1.3;
        const radioAlto=radioBase*(1+factorAltura*0.5);
        const mitadReal=(durReal/2).toFixed(0);
        // Sube como si venciera la gravedad (empieza rápido, llega
        // despacio al punto más alto) y baja acelerando (como caer),
        // igual que un balón real en el aire — no un simple ida y
        // vuelta lineal.
        balon.style.transition=`cx ${durReal}ms ease-out, cy ${durReal}ms ease-out, r ${mitadReal}ms ease-out`;
        balon.setAttribute('r', radioAlto);
        setTimeout(()=>{
          balon.style.transition=`r ${mitadReal}ms ease-out`;
          balon.setAttribute('r', radioBase);
        }, real(durMs/2));
      }
      balon.setAttribute('cx',x); balon.setAttribute('cy',y);
    }
    // Anillo dorado que aparece un instante sobre el jugador que
    // recibe el balón, justo cuando llega — ayuda a leer la jugada en
    // vez de tener 22 puntos idénticos moviéndose sin foco visual.
    const resalte=overlay.querySelector('#lmVisorResalte');
    function resaltarReceptor(x,y,retrasoMs){
      setTimeout(()=>{
        resalte.setAttribute('cx',x); resalte.setAttribute('cy',y);
        resalte.style.transition='none';
        resalte.setAttribute('opacity','0');
        // Aparece con una transición suave (antes saltaba directo a
        // opacidad 0.9 sin transición, creando un "flash" brusco justo
        // cuando el balón llegaba al receptor).
        void resalte.offsetWidth; // fuerza el repintado antes de animar
        resalte.style.transition='opacity .35s ease-out';
        resalte.setAttribute('opacity','0.9');
        setTimeout(()=>{
          resalte.style.transition='opacity .6s ease-out';
          resalte.setAttribute('opacity','0');
        }, 220);
      }, real(retrasoMs));
    }
    // ========================================================
    // IA SENCILLA DEL PARTIDO — en vez de guionizar jugadas fijas, en
    // cada instante el jugador con el balón decide qué hacer según 3
    // datos reales: qué tan cerca está de la portería rival, si tiene
    // un rival marcándole de cerca, y qué compañero está mejor situado
    // (más adelantado y más libre) para recibir un pase. El resto de
    // jugadores se reposicionan según su rol (más o menos adelantado)
    // y si su equipo ataca o defiende — así el comportamiento nace de
    // reglas simples, no de una animación escrita a mano por jugada.
    // ========================================================
    let posMia = misSlots.map(s=>({...s}));
    let posRival = rivalSlots.map(s=>({...s}));

    function elJugador(esMio, idx){ return overlay.querySelector(`#lmVisorJ_${esMio?'m':'r'}${idx}`); }
    function moverJugador(esMio, idx, x, y, dur){
      const el=elJugador(esMio, idx);
      const arr = esMio?posMia:posRival;
      if(el){
        const durReal=real(dur);
        el.style.transition=`transform ${durReal}ms ease-in-out`;
        el.setAttribute('transform', `translate(${x},${y})`);
      }
      arr[idx]={x,y};
    }
    function jugadorMasCercano(arr, x, y, excluirIdx){
      let mejor=-1, mejorDist=Infinity;
      arr.forEach((p,i)=>{
        if(i===excluirIdx) return;
        const d=Math.hypot(p.x-x, p.y-y);
        if(d<mejorDist){ mejorDist=d; mejor=i; }
      });
      return mejor;
    }
    // "Avance" de cada jugador (0 a 1): qué tan cerca nace, en su
    // posición de formación, de la portería contraria — un lateral
    // vale poco, un delantero vale casi 1. Se usa para saber a quién
    // conviene buscar con un pase y cuánto debe adelantarse cada uno
    // al atacar.
    function calcularAvance(slots, propioGol, rivalGol){
      const dTotal=Math.hypot(rivalGol.x-propioGol.x, rivalGol.y-propioGol.y);
      return slots.map(s=>{
        const d=Math.hypot(s.x-propioGol.x, s.y-propioGol.y);
        return Math.max(0.1, Math.min(1, d/dTotal));
      });
    }
    const avanceMio=calcularAvance(misSlots, miGolXY, rivalGolXY);
    const avanceRival=calcularAvance(rivalSlots, rivalGolXY, miGolXY);
    // Rol por posición (no solo un número de avance): un defensa se
    // comporta distinto a un delantero, no solo "se adelanta menos" —
    // apenas participa en jugadas de ataque, y en la línea defensiva
    // se mantiene disciplinado junto al resto de defensas.
    function calcularRoles(avance){
      return avance.map(a=> a<0.35?'def' : (a<0.65?'mid':'fwd'));
    }
    const rolesMios=calcularRoles(avanceMio);
    const rolesRival=calcularRoles(avanceRival);
    // Jugador de banda o de centro, según su posición lateral en la
    // formación (perpendicular al eje de ataque) — un lateral o
    // extremo se mantiene pegado a su carril, un central no se abre.
    function calcularBanda(slots){
      return slots.map(s=>{
        const lateral = esEscritorio ? s.y : s.x; // coordenada perpendicular al eje de ataque
        const distCentro = Math.abs(lateral-CENTRO_Y_LOCAL);
        return distCentro>28 ? (lateral<CENTRO_Y_LOCAL?'banda1':'banda2') : 'centro';
      });
    }
    const CENTRO_Y_LOCAL = esEscritorio ? ALTO/2 : ANCHO/2;
    const bandaMia=calcularBanda(misSlots);
    const bandaRival=calcularBanda(rivalSlots);
    // La categoría táctica real que el jugador ha elegido para el
    // partido (la misma que ya afecta al resultado) también cambia
    // cómo se ve el equipo en la simulación: un planteamiento
    // defensivo se repliega más y ataca a la contra; uno ofensivo
    // empuja más líneas arriba y arriesga más.
    const catTacticaMia = state.formacionCategoria;
    const multEmpujeMioBase = catTacticaMia==='ofensiva' ? 1.35 : (catTacticaMia==='defensiva' ? 0.65 : 1);
    const multRiesgoMioBase = catTacticaMia==='ofensiva' ? 1.25 : (catTacticaMia==='defensiva' ? 0.7 : 1);
    // Urgencia por marcador y minuto: si vas perdiendo y el partido
    // avanza, el equipo aprieta más de lo habitual — un equipo real no
    // se comporta igual en el minuto 10 que en el 88 perdiendo 0-1.
    // Y al revés: si vas ganando cómodo hacia el final, el equipo se
    // vuelve más conservador — protege el resultado en vez de seguir
    // arriesgando igual que en el minuto 10 con el marcador a cero.
    function urgenciaPartido(){
      const diferencia = marcadorRival - marcadorMio; // positivo = voy perdiendo
      const progreso = Math.min(1, tiempoTranscurrido/DURACION_TOTAL);
      if(diferencia>0) return 1 + Math.min(0.5, diferencia*0.18*progreso);
      if(diferencia<0) return 1 - Math.min(0.32, Math.abs(diferencia)*0.13*progreso);
      return 1;
    }
    function multEmpujeMioActual(){ return multEmpujeMioBase * urgenciaPartido(); }
    function multRiesgoMioActual(){ return multRiesgoMioBase * urgenciaPartido(); }
    // Espejo de la urgencia para el rival — antes solo mi equipo
    // respondía al marcador (más presión perdiendo, más conservador
    // ganando); el rival se comportaba siempre igual sin importar el
    // resultado, algo asimétrico y poco realista. Ahora el rival
    // también aprieta si va perdiendo y se guarda si va ganando.
    function urgenciaPartidoRival(){
      const diferencia = marcadorMio - marcadorRival; // positivo = el rival va perdiendo
      const progreso = Math.min(1, tiempoTranscurrido/DURACION_TOTAL);
      if(diferencia>0) return 1 + Math.min(0.5, diferencia*0.18*progreso);
      if(diferencia<0) return 1 - Math.min(0.32, Math.abs(diferencia)*0.13*progreso);
      return 1;
    }
    // Sesgo real de posesión: un equipo claramente mejor (ataque+pase)
    // tiende a monopolizar más el balón, uno claramente peor apenas lo
    // toca — en vez de un reparto fijo cercano al 50%.
    const calidadMia = (misStatsReales.attack+misStatsReales.passing)/2;
    const calidadRival = (rival.attack+rival.passing)/2;
    const probPosesionMia = Math.max(0.32, Math.min(0.68, 0.5+(calidadMia-calidadRival)/160));

    // Reposiciona a todos los jugadores EXCEPTO el que lleva el balón
    // en ese instante — cada uno según su propio rol (avance) y si su
    // equipo ataca o defiende, con tiempos escalonados para que nunca
    // se vea como un bloque.
    function actualizarFormacionDinamica(atacaMio, idxExcluirMio, idxExcluirRival, balonPos, idxExcluirMio2, idxExcluirRival2){
      function reubicarEquipo(esMio, idxExcluir, idxExcluir2){
        const slots = esMio?misSlots:rivalSlots;
        const pos = esMio?posMia:posRival;
        const avance = esMio?avanceMio:avanceRival;
        const roles = esMio?rolesMios:rolesRival;
        const golRival = esMio?rivalGolXY:miGolXY;
        const propioGol = esMio?miGolXY:rivalGolXY;
        const yoAtaco = esMio===atacaMio;
        const multEmpuje = esMio ? multEmpujeMioActual() : urgenciaPartidoRival();
        const cercanos = yoAtaco ? [] : pos.map((p,i)=>({i,d:Math.hypot(p.x-balonPos.x,p.y-balonPos.y)}))
          .filter(o=>o.i!==0 && o.i!==idxExcluir).sort((a,b)=>a.d-b.d).slice(0,2).map(o=>o.i);
        // Reparto de marcaje: sin esto, cada defensa buscaba
        // independientemente "el atacante más cercano" sin saber si
        // OTRO defensa ya lo estaba marcando — varios podían converger
        // sobre el mismo rival a la vez, contribuyendo al
        // amontonamiento. Se recuerda qué atacantes ya tienen marcador
        // en esta misma pasada, para repartir sobre distintos rivales.
        const atacantesYaMarcados=new Set();
        // El portero se desplaza un poco hacia el lado donde está el
        // balón (cerrar el ángulo), sin salir apenas de su portería —
        // antes se quedaba siempre clavado en el centro.
        const golPropioGK = propioGol;
        const desvioLateralGK = esEscritorio
          ? Math.max(-6,Math.min(6,(balonPos.y-golPropioGK.y)*0.18))
          : Math.max(-6,Math.min(6,(balonPos.x-golPropioGK.x)*0.18));
        const gkX = esEscritorio ? golPropioGK.x : golPropioGK.x+desvioLateralGK;
        const gkY = esEscritorio ? golPropioGK.y+desvioLateralGK : golPropioGK.y;
        if(idxExcluir!==0) setTimeout(()=>moverJugador(esMio, 0, gkX, gkY, 900), real(200));

        const destinos=[]; // para la separación: no dejar que dos caigan en el mismo punto
        for(let i=1;i<pos.length;i++){
          if(i===idxExcluir || i===idxExcluir2) continue;
          // Tanto al atacar como al defender, se parte SIEMPRE de la
          // posición ACTUAL del jugador, nunca de su casilla de
          // formación original — así el movimiento es siempre
          // gradual en ambos sentidos. Antes, al defender se saltaba
          // directo a una posición calculada desde la formación
          // original, lo que causaba un salto instantáneo visible
          // cada vez que el equipo pasaba de atacar a defender (por
          // ejemplo, justo después de marcar un gol, todo el equipo
          // "se reiniciaba" de golpe a su formación de inicio).
          const base=pos[i];
          // Al atacar, TODO el equipo sube de línea para apoyar — los
          // delanteros más, pero defensas y centrocampistas también
          // acompañan de verdad (antes apenas se movían, dando la
          // sensación de que solo atacaban 2-3 jugadores mientras el
          // resto se quedaba plantado atrás, algo sin sentido en un
          // equipo real). Al defender, si se repliega más disciplinado.
          const factorRol = roles[i]==='def' ? 0.75 : (roles[i]==='fwd' ? 1.25 : 1.05);
          // Altura de la línea al defender: depende de la categoría
          // táctica elegida — un planteamiento defensivo se repliega
          // más profundo (línea baja, clásica de bloque bajo), uno
          // ofensivo mantiene una línea más alta y comprometida, con
          // el riesgo de espacio a la espalda que eso conlleva en un
          // partido real.
          const replieguDefensivo = (esMio && catTacticaMia==='defensiva') ? 0.09 : ((esMio && catTacticaMia==='ofensiva') ? 0.035 : 0.06);
          const empuje = yoAtaco ? (0.09+avance[i]*0.16)*factorRol*multEmpuje : replieguDefensivo;
          // Al atacar, el objetivo es la portería rival (avance real);
          // al defender, el objetivo es su propia casilla de
          // formación, ligeramente desplazada hacia la portería propia
          // según la categoría táctica (más profunda si es defensiva,
          // casi sin desplazar si es ofensiva) — vuelta gradual a su
          // sitio, nunca un salto directo a la portería.
          const desplazamientoProfundidad = (esMio && catTacticaMia==='defensiva') ? 0.22 : ((esMio && catTacticaMia==='ofensiva') ? 0.04 : 0.12);
          // Al atacar, el objetivo avanza en PROFUNDIDAD hacia la
          // portería rival, pero mantiene la anchura natural de cada
          // jugador (su posición lateral de formación) — antes el
          // objetivo era literalmente el punto exacto de la portería
          // (incluida su coordenada central), así que TODO el equipo
          // convergía hacia el centro del campo al atacar, quedando
          // los 22 jugadores amontonados en una columna estrecha sin
          // anchura ni táctica real. Al defender, el objetivo sigue
          // siendo la casilla de formación (ya con su propia anchura).
          const objetivo = yoAtaco
            ? (esEscritorio ? {x: golRival.x, y: slots[i].y} : {x: slots[i].x, y: golRival.y})
            : {
              x: slots[i].x+(propioGol.x-slots[i].x)*desplazamientoProfundidad,
              y: slots[i].y+(propioGol.y-slots[i].y)*desplazamientoProfundidad
            };
          let x=base.x+(objetivo.x-base.x)*empuje;
          let y=base.y+(objetivo.y-base.y)*empuje;
          if(cercanos.includes(i)){
            // Presiona de verdad: se acerca al balón, no solo a su gol
            x = x+(balonPos.x-x)*0.5;
            y = y+(balonPos.y-y)*0.5;
          } else if(!yoAtaco && roles[i]==='def'){
            // Marcaje real: un defensa que no está presionando el
            // balón directamente, se acerca un poco al atacante rival
            // más cercano a su propia zona — "coge a su hombre", en
            // vez de plantarse siempre en el mismo punto fijo de la
            // formación pase lo que pase en el campo. Prioriza a los
            // que NADIE está marcando todavía, para repartirse entre
            // distintos rivales en vez de amontonarse sobre el mismo.
            const equipoRivalRef = esMio?posRival:posMia;
            let atacanteMasCercano=-1, distMin=Infinity;
            let atacanteLibreMasCercano=-1, distMinLibre=Infinity;
            equipoRivalRef.forEach((rv,ri)=>{
              if(ri===0) return; // nunca marca al portero rival
              const dd=Math.hypot(rv.x-x, rv.y-y);
              if(dd<distMin){ distMin=dd; atacanteMasCercano=ri; }
              if(!atacantesYaMarcados.has(ri) && dd<distMinLibre){ distMinLibre=dd; atacanteLibreMasCercano=ri; }
            });
            // Si hay un rival libre razonablemente cerca (no mucho más
            // lejos que el más cercano de todos), se marca a ese en
            // vez de al ya vigilado por otro compañero.
            const objetivoMarcaje = (atacanteLibreMasCercano>=0 && distMinLibre<distMin+10) ? atacanteLibreMasCercano : atacanteMasCercano;
            const distObjetivoMarcaje = objetivoMarcaje===atacanteLibreMasCercano ? distMinLibre : distMin;
            if(objetivoMarcaje>=0 && distObjetivoMarcaje<28){
              atacantesYaMarcados.add(objetivoMarcaje);
              x = x+(equipoRivalRef[objetivoMarcaje].x-x)*0.22;
              y = y+(equipoRivalRef[objetivoMarcaje].y-y)*0.22;
            }
          }
          // Separación: si el destino cae demasiado cerca de otro
          // compañero que ya se ha colocado en este mismo instante, se
          // aparta — evita que dos jugadores acaben pegados. Reforzada
          // de forma notable (radio y fuerza mayores) tras comprobar
          // que la versión anterior no bastaba para evitar que los 22
          // jugadores acabaran amontonados en la misma zona.
          destinos.forEach(d=>{
            const dist=Math.hypot(x-d.x,y-d.y);
            if(dist<11 && dist>0.01){
              const empujeSep=(11-dist)*0.7;
              x += (x-d.x)/dist*empujeSep;
              y += (y-d.y)/dist*empujeSep;
            }
          });
          // Separación también respecto al equipo CONTRARIO — estar
          // cerca de un rival es normal (marcaje, presión), pero
          // amontonarse encima de él no lo es. Radio y fuerza también
          // reforzados de forma notable por el mismo motivo.
          const equipoContrario = esMio?posRival:posMia;
          equipoContrario.forEach(rv=>{
            const dist=Math.hypot(x-rv.x,y-rv.y);
            if(dist<7 && dist>0.01){
              const empujeSep=(7-dist)*0.65;
              x += (x-rv.x)/dist*empujeSep;
              y += (y-rv.y)/dist*empujeSep;
            }
          });
          // Línea defensiva: un defensa que está defendiendo tiembla
          // mucho menos en el eje de profundidad (hacia/desde su
          // propia portería) que en el lateral — así la línea de
          // atrás se mantiene alineada y disciplinada, en vez de que
          // cada central esté a una altura distinta al azar.
          const esLineaDefensiva = !yoAtaco && roles[i]==='def';
          const jitterProfundidad = esLineaDefensiva ? 0.5 : 2.2;
          if(esEscritorio){ x+=(Math.random()-0.5)*jitterProfundidad*2; y+=(Math.random()-0.5)*2.2; }
          else { y+=(Math.random()-0.5)*jitterProfundidad*2; x+=(Math.random()-0.5)*2.2; }
          destinos.push({x,y});
          const fatigaMov = 1 + Math.min(0.15, (tiempoTranscurrido/DURACION_TOTAL)*0.15);
          setTimeout(()=>moverJugador(esMio, i, x, y, (950+Math.random()*450)*fatigaMov), real(Math.random()*350));
        }
      }
      reubicarEquipo(true, idxExcluirMio, idxExcluirMio2);
      reubicarEquipo(false, idxExcluirRival, idxExcluirRival2);
    }

    const eventosGol=(info.eventos||[]).filter(e=>e.type==='goal').sort((a,b)=>a.minute-b.minute);
    let tCursorPlan=0, evIdxPlan=0;
    const planGoles=[];
    while(tCursorPlan<DURACION_TOTAL){
      const tProximoGol = evIdxPlan<eventosGol.length ? (eventosGol[evIdxPlan].minute/90)*DURACION_TOTAL : Infinity;
      if(tProximoGol<=tCursorPlan+1600){ planGoles.push(tProximoGol); evIdxPlan++; tCursorPlan=tProximoGol+1400; }
      else { tCursorPlan+=1600; }
    }
    while(evIdxPlan<eventosGol.length){ planGoles.push(DURACION_TOTAL); evIdxPlan++; }

    // Tarjetas reales del partido — se muestran en su momento
    // proporcional, sin interrumpir la simulación como un gol.
    const eventosTarjeta=(info.eventos||[]).filter(e=>e.type==='card').sort((a,b)=>a.minute-b.minute)
      .map(e=>({...e, tMostrar:(e.minute/90)*DURACION_TOTAL, mostrado:false}));

    let marcadorMio=0, marcadorRival=0;
    let tiempoTranscurrido=0, golIdx=0;
    let posesionMia = Math.random()<probPosesionMia;
    // El saque inicial lo pone en juego un centrocampista, nunca el
    // portero — antes empezaba siempre en el índice 0 (el portero),
    // sin ningún sentido para el saque de centro.
    function primerMedioCentro(roles){
      const idx=roles.findIndex(r=>r==='mid');
      return idx>=0 ? idx : Math.floor(roles.length/2);
    }
    let idxConBalonMio=primerMedioCentro(rolesMios), idxConBalonRival=primerMedioCentro(rolesRival);
    // Pases seguidos de la jugada actual — le da memoria a la
    // posesión: pocos pases = todavía construyendo (juego prudente),
    // muchos pases seguidos en el último tercio = urgencia real por
    // encontrar el hueco, no una jugada mecánica idéntica siempre.
    let pasesJugadaActual=0;
    // Historial de los últimos portadores del balón (por equipo) — se
    // usa para detectar bucles de pases repetidos entre los mismos
    // dos jugadores (típicamente portero↔defensa) y penalizar
    // devolver el balón a quien te lo acaba de dar, rompiendo el
    // bucle en vez de quedarse "pillado" pasando de un lado a otro
    // indefinidamente.
    let historialMio=[], historialRival=[];
    const FRASES_PASE=[t('lm.visor_construye'), t('lm.visor_avanza')];
    let descansoMostrado=false;
    let partidoDetenido=false; // se activa al pulsar "terminar y mostrar resultados"
    let partidoTerminado=false; // el partido llegó a su fin, ya sea jugado entero o forzado

    function tick(){
      if(partidoDetenido) return; // el jugador ha forzado el final — no se programa nada más
      // Descanso: al cruzar la mitad del partido, se pausa un
      // instante con el aviso de "FIN DE LA PRIMERA PARTE" en grande.
      if(!descansoMostrado && tiempoTranscurrido>=DURACION_TOTAL/2){
        descansoMostrado=true;
        mostrarTextoGrande(t('lm.visor_descanso'), real(2400));
        infoBar.textContent=t('lm.visor_descanso');
        if(typeof window.playSound==='function') window.playSound('whistle');
        // Cambio de campo real: en un partido de verdad, los equipos
        // cambian de mitad al descanso — antes esto no se tenía en
        // cuenta, y el equipo seguía atacando en la misma dirección
        // toda la segunda parte. Se refleja toda la formación al otro
        // lado del campo y se intercambian las porterías.
        const golTemp=miGolXY; miGolXY=rivalGolXY; rivalGolXY=golTemp;
        if(esEscritorio){
          misSlots=misSlots.map(s=>({x:ANCHO-s.x, y:s.y}));
          rivalSlots=rivalSlots.map(s=>({x:ANCHO-s.x, y:s.y}));
        } else {
          misSlots=misSlots.map(s=>({x:s.x, y:ALTO-s.y}));
          rivalSlots=rivalSlots.map(s=>({x:s.x, y:ALTO-s.y}));
        }
        // Reorganización real de la segunda parte: todo el mundo
        // vuelve a su posición de formación, igual que en el saque
        // inicial — antes el partido seguía desde donde estaban los
        // 22 jugadores en ese instante, sin ningún reinicio, cuando en
        // la vida real ambos equipos se colocan de nuevo en su sitio.
        // El equipo que NO sacó en la primera parte saca ahora.
        misSlots.forEach((s,i)=>moverJugador(true, i, s.x, s.y, 900));
        rivalSlots.forEach((s,i)=>moverJugador(false, i, s.x, s.y, 900));
        posesionMia=!posesionMia;
        idxConBalonMio=primerMedioCentro(rolesMios);
        idxConBalonRival=primerMedioCentro(rolesRival);
        pasesJugadaActual=0; historialMio=[]; historialRival=[];
        const equipoSaca2P = posesionMia?posMia:posRival;
        const idxSaca2P = posesionMia?idxConBalonMio:idxConBalonRival;
        setTimeout(()=>{
          moverBalon(equipoSaca2P[idxSaca2P].x, equipoSaca2P[idxSaca2P].y, 400);
        }, real(950));
        setTimeout(tick, real(2400));
        return;
      }
      // Tarjeta real de este partido, si toca ya — se muestra un
      // instante en la barra de información sin pausar la simulación.
      const tarjetaAhora = eventosTarjeta.find(e=>!e.mostrado && tiempoTranscurrido>=e.tMostrar);
      if(tarjetaAhora){
        tarjetaAhora.mostrado=true;
        const esMia = tarjetaAhora.team===miLado;
        const emoji = tarjetaAhora.tarjeta==='roja' ? '🟥' : '🟨';
        const nombreJ = tarjetaAhora.jugador ? tarjetaAhora.jugador.name : '';
        infoBar.textContent=`${emoji} Tarjeta ${tarjetaAhora.tarjeta} para ${nombreJ} (${esMia?miNombre:rivalNombre})`;
        if(typeof window.playSound==='function') window.playSound('whistle_short');
        tiempoTranscurrido+=1300;
        setTimeout(tick, real(1300));
        return;
      }
      if(golIdx<planGoles.length && tiempoTranscurrido>=planGoles[golIdx]-200){
        const evento=eventosGol[golIdx]; golIdx++;
        const esMio = evento.team===miLado;
        const balonPos0={x:parseFloat(balon.getAttribute('cx')), y:parseFloat(balon.getAttribute('cy'))};
        const equipoAnotaPos = esMio?posMia:posRival;
        const objetivoGol = esMio ? rivalGolXY : miGolXY;
        // El gol SIEMPRE debe salir desde cerca del área rival, nunca
        // desde donde estuviera el balón por casualidad al llegar el
        // minuto programado (a veces medio campo, o incluso más
        // atrás) — si el balón no está ya cerca, primero se acerca un
        // delantero real + el balón a una posición de remate creíble,
        // y SOLO ENTONCES se dispara a portería.
        const distAlGolYa = Math.hypot(balonPos0.x-objetivoGol.x, balonPos0.y-objetivoGol.y);
        const distanciaCerca = Math.hypot(ANCHO,ALTO)*0.16; // ~16% de la diagonal del campo
        function dispararAGol(origenX, origenY, esperaExtra){
          const destinoGol = objetivoGol;
          const duracionVueloGol=850;
          moverBalon(destinoGol.x, destinoGol.y, duracionVueloGol);
          // Margen de seguridad: el aviso del gol espera un poco MÁS
          // que el vuelo visual del balón, nunca el mismo número exacto
          // — la transición CSS y el setTimeout son dos mecanismos de
          // temporización distintos, sin garantía de terminar en el
          // mismo instante exacto (sobre todo a velocidades altas,
          // donde 850ms reales pueden ser menos de 250ms). Sin este
          // margen, a veces se anunciaba el gol un instante antes de
          // que el balón hubiera llegado de verdad a la portería.
          setTimeout(()=>{
            if(esMio) marcadorMio++; else marcadorRival++;
            resEl.textContent=`${marcadorMio} - ${marcadorRival}`;
            const nombreGoleador = evento.jugador ? evento.jugador.name : '';
            infoBar.textContent=`⚽ ${t('lm.visor_gol')} ${nombreGoleador} (${esMio?miNombre:rivalNombre})`;
            mostrarTextoGrande(t('lm.visor_gol'), real(1800));
            if(typeof window.playSound==='function') window.playSound('goal');
            setTimeout(()=>{
              // Reorganización real tras el gol: todos los jugadores
              // vuelven a su posición de formación de saque, igual que
              // al empezar el partido o la segunda parte — antes solo
              // se movía el balón al centro, y los 22 jugadores se
              // quedaban donde estuvieran en el momento del gol.
              misSlots.forEach((s,i)=>moverJugador(true, i, s.x, s.y, 900));
              rivalSlots.forEach((s,i)=>moverJugador(false, i, s.x, s.y, 900));
              posesionMia=!esMio; tiempoTranscurrido+=2750+esperaExtra; pasesJugadaActual=0; historialMio=[]; historialRival=[];
              idxConBalonMio=primerMedioCentro(rolesMios);
              idxConBalonRival=primerMedioCentro(rolesRival);
              const equipoSacaGol = posesionMia?posMia:posRival;
              const idxSacaGol = posesionMia?idxConBalonMio:idxConBalonRival;
              setTimeout(()=>{
                moverBalon(equipoSacaGol[idxSacaGol].x, equipoSacaGol[idxSacaGol].y, 400);
              }, real(950));
              setTimeout(tick, real(750));
            }, real(1300));
          }, real(duracionVueloGol+120));
        }
        if(distAlGolYa>distanciaCerca){
          // Acercamiento previo: un delantero real corre hacia una
          // posición de remate cerca del área, el balón le llega, y
          // desde ahí se dispara — nunca directo desde lejos.
          const rolesAtaca2 = esMio?rolesMios:rolesRival;
          let delanteroIdx = rolesAtaca2.findIndex(r=>r==='fwd');
          if(delanteroIdx<0) delanteroIdx = jugadorMasCercano(equipoAnotaPos, objetivoGol.x, objetivoGol.y, 0);
          const posRemate = { x: objetivoGol.x + (objetivoGol.x<CENTRO_X?12:-12), y: objetivoGol.y + (Math.random()-0.5)*14 };
          actualizarFormacionDinamica(esMio, esMio?idxConBalonMio:undefined, esMio?undefined:idxConBalonRival, balonPos0,
            esMio?delanteroIdx:undefined, esMio?undefined:delanteroIdx);
          moverJugador(esMio, delanteroIdx, posRemate.x, posRemate.y, 900);
          setTimeout(()=>{
            moverBalon(posRemate.x, posRemate.y, 650);
            infoBar.textContent=`${esMio?miNombre:rivalNombre} llega con peligro al área`;
            setTimeout(()=>dispararAGol(posRemate.x, posRemate.y, 900+650), real(650));
          }, real(900));
          return;
        }
        actualizarFormacionDinamica(esMio, esMio?idxConBalonMio:undefined, esMio?undefined:idxConBalonRival, balonPos0);
        dispararAGol(balonPos0.x, balonPos0.y, 0);
        return;
      }
      if(tiempoTranscurrido>=DURACION_TOTAL && golIdx>=planGoles.length){
        mostrarResumenFinal();
        return;
      }

      const equipoAtaca = posesionMia?posMia:posRival;
      const equipoDefiende = posesionMia?posRival:posMia;
      const avanceAtaca = posesionMia?avanceMio:avanceRival;
      const idxConBalon = posesionMia?idxConBalonMio:idxConBalonRival;
      const golObjetivo = posesionMia?rivalGolXY:miGolXY;
      const propioGol = posesionMia?miGolXY:rivalGolXY;
      const nombreAtaca = posesionMia?miNombre:rivalNombre;
      const nombreDefiende = posesionMia?rivalNombre:miNombre;
      const posActual = equipoAtaca[idxConBalon];
      const distGol = Math.hypot(posActual.x-golObjetivo.x, posActual.y-golObjetivo.y);
      const distTotal = Math.hypot(propioGol.x-golObjetivo.x, propioGol.y-golObjetivo.y);
      // Zona del campo (0 = pegado a la portería rival, 1 = pegado a la
      // propia): en el último tercio se arriesga más (regates, tiros,
      // pases al espacio); en el propio tercio se prioriza un pase
      // corto y seguro, como en un partido real.
      const zona = distGol/distTotal;
      const rivalCercanoIdx = jugadorMasCercano(equipoDefiende, posActual.x, posActual.y, -1);
      const distRival = Math.hypot(equipoDefiende[rivalCercanoIdx].x-posActual.x, equipoDefiende[rivalCercanoIdx].y-posActual.y);
      // Presión COORDINADA, no solo individual: cuenta cuántos rivales
      // están cerca del balón a la vez (no solo el más próximo). Con 2
      // o más apretando juntos, la probabilidad de robo sube mucho —
      // así se nota una presión de bloque real, no un jugador aislado
      // decidiendo por su cuenta si roba o no.
      const presionadores = equipoDefiende.filter(rv=>Math.hypot(rv.x-posActual.x, rv.y-posActual.y)<14).length;
      const dur=1100+Math.random()*900;
      // Duración real de ESTA acción concreta — empieza igual que dur,
      // pero se ajusta según la distancia real del pase más abajo. El
      // resto del código sigue usando "dur" igual que siempre (para no
      // arriesgar nada de lo que ya funciona); solo la animación del
      // balón y el ritmo de la siguiente decisión usan esta duración
      // ajustada.
      let duracionEfectiva=dur;
      let siguientePosesionMia=posesionMia, siguienteIdxMio=idxConBalonMio, siguienteIdxRival=idxConBalonRival;
      // Despeje de emergencia: un defensa muy presionado cerca de su
      // propia área no siempre intenta un pase calculado y preciso —
      // a veces simplemente despeja el peligro sin pensarlo mucho,
      // como haría un central real con el rival encima cerca de su
      // portería. El balón sale largo y sin destino calculado, y
      // cualquiera de los dos equipos puede quedarse con él después.
      if(zona>0.85 && (posesionMia?rolesMios:rolesRival)[idxConBalon]==='def' && distRival<10 && Math.random()<0.3){
        const anguloDespeje=(Math.random()-0.5)*1.2;
        const dirX=(golObjetivo.x-posActual.x), dirY=(golObjetivo.y-posActual.y);
        const dirLen=Math.hypot(dirX,dirY)||1;
        const rotX=dirX/dirLen*Math.cos(anguloDespeje)-dirY/dirLen*Math.sin(anguloDespeje);
        const rotY=dirX/dirLen*Math.sin(anguloDespeje)+dirY/dirLen*Math.cos(anguloDespeje);
        const alcance=28+Math.random()*16;
        const destinoDespeje={
          x: Math.max(2, Math.min(ANCHO-2, posActual.x+rotX*alcance)),
          y: Math.max(2, Math.min(ALTO-2, posActual.y+rotY*alcance))
        };
        duracionEfectiva=Math.max(400, Math.min(1100, Math.hypot(destinoDespeje.x-posActual.x, destinoDespeje.y-posActual.y)*17));
        moverBalon(destinoDespeje.x, destinoDespeje.y, duracionEfectiva);
        infoBar.textContent=`${nombreAtaca} despeja el peligro`;
        pasesJugadaActual=0; historialMio=[]; historialRival=[];
        actualizarFormacionDinamica(posesionMia, posesionMia?idxConBalon:undefined, posesionMia?undefined:idxConBalon, posActual);
        setTimeout(()=>{
          const dMioD=jugadorMasCercano(posMia, destinoDespeje.x, destinoDespeje.y, -1);
          const dRivalD=jugadorMasCercano(posRival, destinoDespeje.x, destinoDespeje.y, -1);
          const distMioD=Math.hypot(posMia[dMioD].x-destinoDespeje.x, posMia[dMioD].y-destinoDespeje.y);
          const distRivalD=Math.hypot(posRival[dRivalD].x-destinoDespeje.x, posRival[dRivalD].y-destinoDespeje.y);
          posesionMia = distMioD<=distRivalD;
          if(posesionMia){ idxConBalonMio=dMioD; moverJugador(true, dMioD, destinoDespeje.x, destinoDespeje.y, 500); }
          else { idxConBalonRival=dRivalD; moverJugador(false, dRivalD, destinoDespeje.x, destinoDespeje.y, 500); }
          tiempoTranscurrido+=duracionEfectiva+400;
          setTimeout(tick, real(500));
        }, real(duracionEfectiva));
        return;
      }
      // Receptor del pase decidido en este tick, si lo hay — se
      // excluye del recálculo de formación de más abajo para que NO
      // se mueva mientras el balón viaja hacia él. Antes el receptor
      // arrancaba a moverse a la vez que el balón, así que cuando el
      // balón llegaba a su destino, el jugador ya se había desplazado
      // a otro sitio — de ahí la sensación de "el balón cae donde no
      // hay nadie" y el flujo a golpes del partido.
      let receptorPaseIdx=-1;

      const probBase = zona<0.35?0.48:0.36;
      const probPresion = probBase + Math.max(0,presionadores-1)*0.16; // +16pp por cada presionador extra
      if(distRival<9.5 && Math.random()<probPresion){
        // Presión de cerca: el rival se lleva el balón de verdad — más
        // probable en el último tercio, donde la defensa aprieta más,
        // y mucho más probable si hay varios rivales presionando juntos.
        moverBalon(equipoDefiende[rivalCercanoIdx].x, equipoDefiende[rivalCercanoIdx].y, dur*0.7);
        infoBar.textContent = presionadores>=2
          ? `${nombreDefiende} recupera el balón con una presión conjunta`
          : `${nombreDefiende} recupera el balón con una entrada`;
        siguientePosesionMia=!posesionMia;
        pasesJugadaActual=0;
        if(siguientePosesionMia) siguienteIdxMio=rivalCercanoIdx; else siguienteIdxRival=rivalCercanoIdx;
      } else if(zona<0.24 && (()=>{
        // El rol del que lleva el balón importa de verdad: un
        // delantero cerca del área dispara mucho más que un defensa
        // que haya llegado hasta ahí de forma puntual — en la vida
        // real son los delanteros quienes generan la mayoría de las
        // ocasiones de gol, no cualquier jugador que pase por la zona.
        const rolesEnAtaque = posesionMia?rolesMios:rolesRival;
        const rolPortador = rolesEnAtaque[idxConBalon];
        const factorRolDisparo = rolPortador==='fwd' ? 1.35 : (rolPortador==='def' ? 0.45 : 0.9);
        return Math.random()<(0.38+Math.min(0.18,pasesJugadaActual*0.03))*(posesionMia?multRiesgoMioActual():urgenciaPartidoRival())*factorRolDisparo;
      })()){
        // Cerca del área: intento de disparo (sin gol, salvo que
        // coincida con un gol real programado, gestionado aparte). El
        // portero contrario reacciona hacia el disparo. Cuantos más
        // pases lleve la jugada, más urgencia por probar suerte —
        // hasta +18 puntos de probabilidad tras varios pases seguidos.
        pasesJugadaActual=0;
        // El disparo viaja más rápido que un pase normal (más
        // potencia), pero también proporcional a la distancia real —
        // un remate desde dentro del área es casi instantáneo, uno
        // desde fuera tarda algo más, nunca el mismo tiempo fijo.
        const distanciaDisparo=Math.hypot(golObjetivo.x-posActual.x, golObjetivo.y-posActual.y);
        duracionEfectiva=Math.max(220, Math.min(950, distanciaDisparo*15));
        moverBalon(golObjetivo.x, golObjetivo.y, duracionEfectiva);
        infoBar.textContent=`¡${nombreAtaca} dispara a portería!`;
        const portero = posesionMia?posRival:posMia;
        const porteroEsMio = !posesionMia;
        const desvio=(Math.random()-0.5)*7;
        setTimeout(()=>{
          moverJugador(porteroEsMio, 0, portero[0].x+desvio, portero[0].y, duracionEfectiva*0.55);
          setTimeout(()=>moverJugador(porteroEsMio, 0, (porteroEsMio?miGolXY:rivalGolXY).x, (porteroEsMio?miGolXY:rivalGolXY).y, 600), real(duracionEfectiva*0.55));
        }, real(duracionEfectiva*0.45));
        const rebotaCorner = Math.random()<0.3;
        // Tras el reinicio (córner o disparo fallado sin más), el
        // balón NO puede quedarse "sin dueño" en el centro — se le
        // asigna de verdad al jugador más cercano a ese punto, que
        // además se desplaza físicamente hasta ahí. Sin esto, la
        // siguiente jugada parecía salir de la nada.
        function asignarBalonSuelto(px,py){
          const dMio=jugadorMasCercano(posMia, px, py, -1);
          const dRival=jugadorMasCercano(posRival, px, py, -1);
          const distMio=Math.hypot(posMia[dMio].x-px, posMia[dMio].y-py);
          const distRival=Math.hypot(posRival[dRival].x-px, posRival[dRival].y-py);
          const esMio = distMio<=distRival;
          posesionMia=esMio;
          if(esMio){ idxConBalonMio=dMio; moverJugador(true, dMio, px, py, 500); }
          else { idxConBalonRival=dRival; moverJugador(false, dRival, px, py, 500); }
        }
        if(rebotaCorner){
          // Saque de esquina: el balón va a la esquina más cercana a
          // la portería rival, y desde ahí se centra al área — una
          // jugada a balón parado propia, no solo el reinicio genérico.
          // El balón SIEMPRE parte de un jugador real: primero se
          // desplaza al sacador hasta la bandera, y el balón va A SU
          // POSICIÓN exacta, nunca a un punto vacío del campo.
          const cornerX = esEscritorio ? (golObjetivo.x<CENTRO_X?4:ANCHO-4) : (Math.random()<0.5?4:ANCHO-4);
          const cornerY = esEscritorio ? (Math.random()<0.5?4:ALTO-4) : (golObjetivo.y<CENTRO_Y?4:ALTO-4);
          setTimeout(()=>{
            const equipoSaca = posesionMia?posMia:posRival;
            const sacadorIdx = jugadorMasCercano(equipoSaca, cornerX, cornerY, 0);
            moverJugador(posesionMia, sacadorIdx, cornerX, cornerY, 450);
            setTimeout(()=>{
              moverBalon(equipoSaca[sacadorIdx].x, equipoSaca[sacadorIdx].y, 350);
              infoBar.textContent=`Saque de esquina para ${nombreAtaca}`;
              setTimeout(()=>{
                // El balón centra hacia el área — al rematador, un
                // jugador real que ya está (o se desplaza) por esa
                // zona, no a un punto geométrico vacío.
                const areaObjetivoX = golObjetivo.x + (golObjetivo.x<CENTRO_X?8:-8);
                const rematadorIdx = jugadorMasCercano(equipoSaca, areaObjetivoX, golObjetivo.y, sacadorIdx);
                moverJugador(posesionMia, rematadorIdx, areaObjetivoX, golObjetivo.y, 700);
                setTimeout(()=>{
                  moverBalon(equipoSaca[rematadorIdx].x, equipoSaca[rematadorIdx].y, 700);
                  infoBar.textContent=`${nombreAtaca} centra desde el córner`;
                  setTimeout(()=>{
                    moverBalon(centroCampo.x, centroCampo.y, 700);
                    asignarBalonSuelto(centroCampo.x, centroCampo.y);
                    tiempoTranscurrido+=dur+500+350+700+700+700+900;
                    setTimeout(tick, real(600));
                  }, real(700));
                }, real(120));
              }, real(700));
            }, real(450));
          }, real(dur*0.65));
        } else {
          setTimeout(()=>{
            moverBalon(centroCampo.x, centroCampo.y, 700);
            asignarBalonSuelto(centroCampo.x, centroCampo.y);
            tiempoTranscurrido+=dur+700;
            setTimeout(tick, real(500));
          }, real(dur*0.65));
        }
        // Este disparo gestiona su propio final (arriba) — se corta
        // aquí para que el cierre genérico de más abajo no pise la
        // posesión/jugador que se acaba de asignar con datos viejos.
        return;
      } else {
        // Regate 1 contra 1: si el que lleva el balón encara a UN SOLO
        // defensa aislado (no hay presión coordinada de varios a la
        // vez), puede intentar superarlo directamente en vez de pasar
        // siempre — variedad real, no solo "pase o disparo".
        const defensaAislado = jugadorMasCercano(equipoDefiende, posActual.x, posActual.y, -1);
        const distDefensaAislado = Math.hypot(equipoDefiende[defensaAislado].x-posActual.x, equipoDefiende[defensaAislado].y-posActual.y);
        const presionAquiAhora = equipoDefiende.filter(rv=>Math.hypot(rv.x-posActual.x, rv.y-posActual.y)<14).length;
        const ritmoAtaca = posesionMia ? misStatsReales.pace : rival.pace;
        if(distDefensaAislado<11 && presionAquiAhora===1 && zona>0.15 && Math.random()<(ritmoAtaca-40)/220){
          const avanzaHacia = golObjetivo;
          const destinoRegate={x:posActual.x+(avanzaHacia.x-posActual.x)*0.22, y:posActual.y+(avanzaHacia.y-posActual.y)*0.22};
          const regateExitoso = Math.random()<0.62;
          pasesJugadaActual=0;
          if(regateExitoso){
            moverBalon(destinoRegate.x, destinoRegate.y, dur*0.8);
            infoBar.textContent=`${nombreAtaca} encara y supera a su marcador`;
            actualizarFormacionDinamica(posesionMia, posesionMia?idxConBalon:undefined, posesionMia?undefined:idxConBalon, posActual);
            setTimeout(()=>{
              tiempoTranscurrido+=dur;
              tick();
            }, real(dur));
          } else {
            moverBalon(equipoDefiende[defensaAislado].x, equipoDefiende[defensaAislado].y, dur*0.7);
            infoBar.textContent=`${nombreDefiende} para el regate y roba el balón`;
            const posesionTrasRegate=!posesionMia;
            if(posesionTrasRegate) idxConBalonMio=defensaAislado; else idxConBalonRival=defensaAislado;
            actualizarFormacionDinamica(posesionMia, posesionMia?idxConBalon:undefined, posesionMia?undefined:idxConBalon, posActual);
            setTimeout(()=>{
              posesionMia=posesionTrasRegate;
              tiempoTranscurrido+=dur;
              tick();
            }, real(dur));
          }
          return;
        }
        // Pase: en el último tercio se busca el hueco por delante del
        // compañero (pase filtrado, simula la carrera); en el resto,
        // a su posición actual. Se puntúa por avance, distancia
        // razonable, lejanía de su marca, Y AHORA si algún rival
        // corta de verdad la línea recta del pase — un pase con la
        // trayectoria bloqueada por un rival en medio se descarta o
        // se penaliza mucho, no solo se mira si el destino está libre.
        function distanciaPuntoSegmento(px,py, ax,ay, bx,by){
          const dx=bx-ax, dy=by-ay;
          const largo2=dx*dx+dy*dy;
          let tt=largo2>0 ? ((px-ax)*dx+(py-ay)*dy)/largo2 : 0;
          tt=Math.max(0,Math.min(1,tt));
          const cx=ax+tt*dx, cy=ay+tt*dy;
          return Math.hypot(px-cx, py-cy);
        }
        function lineaBloqueada(destX, destY){
          let bloqueoMin=Infinity;
          equipoDefiende.forEach((rv,ri)=>{
            const dseg=distanciaPuntoSegmento(rv.x,rv.y, posActual.x,posActual.y, destX,destY);
            if(dseg<bloqueoMin) bloqueoMin=dseg;
          });
          return bloqueoMin; // cuanto más pequeño, más cerca pasa un rival de la trayectoria
        }
        let mejor=-1, mejorPunt=-Infinity;
        equipoAtaca.forEach((p,i)=>{
          if(i===idxConBalon) return;
          const d=Math.hypot(p.x-posActual.x, p.y-posActual.y);
          if(d>42) return;
          const marcaIdx=jugadorMasCercano(equipoDefiende, p.x, p.y, -1);
          const distMarca=Math.hypot(equipoDefiende[marcaIdx].x-p.x, equipoDefiende[marcaIdx].y-p.y);
          const rolesAtaca = posesionMia?rolesMios:rolesRival;
          // Bono por rol según la fase del juego: en el último tercio,
          // el balón busca al delantero para rematar; en la
          // construcción (todavía en campo propio o medio campo), el
          // balón busca al mediocentro para dirigir la jugada — así
          // se nota la diferencia real entre "quien construye" y
          // "quien remata", en vez de un reparto de pases uniforme.
          const bonusRol = (zona<0.4 && rolesAtaca[i]==='fwd') ? 2.5
            : (zona>0.55 && rolesAtaca[i]==='mid') ? 1.8 : 0;
          const bloqueo=lineaBloqueada(p.x,p.y);
          const penalizBloqueo = bloqueo<4 ? (4-bloqueo)*4.5 : 0;
          // Penalización real por distancia — antes era tan baja que
          // un pase muy largo podía ganar solo por el avance del
          // receptor, dando pases de un lado a otro del campo con
          // demasiada frecuencia. En un partido real el balón avanza
          // POCO A POCO, no de un extremo al otro.
          const penalizDistancia = d*0.34 + (d>26 ? (d-26)*0.5 : 0);
          // Balón largo de defensa a delantero: un defensa metiendo un
          // pase directo al delantero en campo contrario debe ser la
          // excepción, no la norma — se penaliza fuerte cuando la
          // distancia es grande de verdad.
          const penalizBalonLargoDef = (rolesAtaca[idxConBalon]==='def' && rolesAtaca[i]==='fwd' && d>30) ? (d-30)*0.9 : 0;
          // Fuera de juego real: se calcula la línea del último
          // defensa rival (el más retrasado, sin contar al portero) y
          // se penaliza fuerte pasar a un compañero que esté
          // claramente por delante de esa línea — antes no existía
          // ningún concepto de fuera de juego, así que se veían goles
          // con pinta clara de estarlo.
          const ultimoDefensorProf = equipoDefiende.reduce((max,rv,ri)=>{
            if(ri===0) return max; // el portero no cuenta como último defensa
            const prof = esEscritorio ? (posesionMia?rv.x:ANCHO-rv.x) : (posesionMia?ALTO-rv.y:rv.y);
            return Math.max(max, prof);
          }, -Infinity);
          const profReceptor = esEscritorio ? (posesionMia?p.x:ANCHO-p.x) : (posesionMia?ALTO-p.y:p.y);
          const penalizFueraJuego = (profReceptor>ultimoDefensorProf+3) ? (profReceptor-ultimoDefensorProf)*1.1 : 0;
          // Distribución segura del portero: cuando quien tiene el
          // balón es el propio portero, se prioriza mucho más la
          // opción cercana y sin marca — un portero real casi nunca
          // arriesga con un balón largo si tiene un compañero cerca y
          // libre, prefiere construir seguro desde atrás.
          const bonusPorteroSeguro = (idxConBalon===0 && d<20) ? (20-d)*0.4 + distMarca*0.25 : 0;
          const penalizPorteroArriesgado = (idxConBalon===0 && d>34) ? (d-34)*0.6 : 0;
          // Anti-bucle: si el receptor candidato es quien le acaba de
          // dar el balón al portador actual (típico bucle
          // portero↔defensa), se penaliza fuerte — así el equipo
          // busca otra opción en vez de quedarse pasando el balón de
          // un lado a otro sin avanzar nunca.
          const historialAtaca = posesionMia?historialMio:historialRival;
          const esDevolucionInmediata = historialAtaca.length && historialAtaca[historialAtaca.length-1]===i;
          const penalizBucle = esDevolucionInmediata ? 7 : 0;
          const punt = avanceAtaca[i]*9 - penalizDistancia + distMarca*0.35 + bonusRol - penalizBloqueo - penalizBalonLargoDef - penalizBucle + bonusPorteroSeguro - penalizPorteroArriesgado - penalizFueraJuego + Math.random()*3;
          if(punt>mejorPunt){ mejorPunt=punt; mejor=i; }
        });
        if(mejor===-1) mejor=jugadorMasCercano(equipoAtaca, posActual.x, posActual.y, idxConBalon);
        // Si incluso el mejor destino disponible tiene la línea de
        // pase muy cortada por un rival, existe una probabilidad real
        // de que ese rival intercepte el balón en el camino — no todo
        // pase con un hueco pequeño llega, aunque la precisión del
        // equipo sea buena.
        const bloqueoFinal = lineaBloqueada(equipoAtaca[mejor].x, equipoAtaca[mejor].y);
        if(bloqueoFinal<3 && Math.random()<0.32){
          const interceptorLinea=jugadorMasCercano(equipoDefiende, (posActual.x+equipoAtaca[mejor].x)/2, (posActual.y+equipoAtaca[mejor].y)/2, -1);
          moverBalon(equipoDefiende[interceptorLinea].x, equipoDefiende[interceptorLinea].y, dur*0.6);
          infoBar.textContent=`${nombreDefiende} corta la línea de pase`;
          siguientePosesionMia=!posesionMia; pasesJugadaActual=0; historialMio=[]; historialRival=[];
          if(siguientePosesionMia) siguienteIdxMio=interceptorLinea; else siguienteIdxRival=interceptorLinea;
          actualizarFormacionDinamica(posesionMia, posesionMia?idxConBalon:undefined, posesionMia?undefined:idxConBalon, posActual);
          setTimeout(()=>{
            posesionMia=siguientePosesionMia; idxConBalonMio=siguienteIdxMio; idxConBalonRival=siguienteIdxRival;
            tiempoTranscurrido+=dur;
            tick();
          }, real(dur));
          return;
        }
        // Fatiga: según avanza el partido, la precisión efectiva baja
        // un poco (hasta un 12% menos al final) — simula el cansancio
        // de las piernas en los últimos minutos.
        const fatiga = Math.min(0.12, (tiempoTranscurrido/DURACION_TOTAL)*0.12);
        const precisionEquipo = (posesionMia?precisionMia:precisionRival) - fatiga;
        const paseFallido = Math.random() > precisionEquipo && Math.random()<0.5;
        if(paseFallido){
          // Pase impreciso: no llega a nadie propio, el rival más
          // cercano al punto de destino se queda con el balón — un
          // equipo con peor pase/técnica falla más balones sin que
          // haga falta que el rival presione para robarlo.
          const destinoFallido=equipoAtaca[mejor];
          const interceptorIdx=jugadorMasCercano(equipoDefiende, destinoFallido.x, destinoFallido.y, -1);
          moverBalon(equipoDefiende[interceptorIdx].x, equipoDefiende[interceptorIdx].y, dur);
          infoBar.textContent=`${nombreAtaca} pierde el balón con un pase impreciso`;
          siguientePosesionMia=!posesionMia; pasesJugadaActual=0; historialMio=[]; historialRival=[];
          if(siguientePosesionMia) siguienteIdxMio=interceptorIdx; else siguienteIdxRival=interceptorIdx;
        } else {
        let destino=equipoAtaca[mejor];
        // Balón predictivo de verdad: en vez de un adelanto fijo
        // siempre igual, se calcula primero una duración aproximada
        // del pase, se usa ESE tiempo para predecir cuánto se habrá
        // desplazado el receptor de verdad cuando el balón llegue
        // (según su rol: un delantero busca el hueco de forma mucho
        // más agresiva que un central), y el balón se envía a esa
        // posición FUTURA prevista — no a donde el jugador está ahora
        // mismo ni a un adelanto fijo arbitrario.
        const distanciaAproximada=Math.hypot(destino.x-posActual.x, destino.y-posActual.y);
        const duracionAproximada=Math.max(480, Math.min(1900, distanciaAproximada*32));
        const segundosVuelo=duracionAproximada/1000;
        const rolReceptor=(posesionMia?rolesMios:rolesRival)[mejor];
        const velocidadDesmarque = rolReceptor==='fwd' ? 11 : (rolReceptor==='mid' ? 7 : 3.5); // unidades de campo por segundo aprox
        const distanciaCarrera = segundosVuelo*velocidadDesmarque;
        // La carrera prevista va hacia la portería rival — un jugador
        // que va a recibir no se queda quieto, sigue avanzando hacia
        // el hueco mientras el balón viaja hacia él.
        const dirX=golObjetivo.x-destino.x, dirY=golObjetivo.y-destino.y;
        const dirLen=Math.hypot(dirX,dirY)||1;
        destino={
          x: destino.x+(dirX/dirLen)*Math.min(distanciaCarrera, dirLen*0.6),
          y: destino.y+(dirY/dirLen)*Math.min(distanciaCarrera, dirLen*0.6)
        };
        // El balón viaja a una velocidad más o menos constante, no
        // siempre en el mismo tiempo fijo — un pase corto es rápido,
        // uno largo tarda de verdad más, como un balón real. Se
        // recalcula con la distancia FINAL (ya con la previsión de
        // carrera incluida), para que la duración visual coincida de
        // verdad con el recorrido real del balón.
        const distanciaPaseReal=Math.hypot(destino.x-posActual.x, destino.y-posActual.y);
        duracionEfectiva=Math.max(480, Math.min(1900, distanciaPaseReal*32));
        moverBalon(destino.x, destino.y, duracionEfectiva);
        // El receptor corre de verdad hacia la posición prevista, con
        // la misma duración que el balón — sin esto, el balón iría a
        // un punto por delante del jugador mientras él se queda quieto
        // en su sitio antiguo, recreando el mismo fallo que se quería
        // arreglar (el balón "cae donde no hay nadie"), solo que más
        // lejos de lo que estaba antes.
        moverJugador(posesionMia, mejor, destino.x, destino.y, duracionEfectiva);
        resaltarReceptor(destino.x, destino.y, duracionEfectiva);
        infoBar.textContent=`${nombreAtaca} ${FRASES_PASE[Math.floor(Math.random()*FRASES_PASE.length)]}`;
        pasesJugadaActual++;
        receptorPaseIdx=mejor;
        (posesionMia?historialMio:historialRival).push(idxConBalon);
        if((posesionMia?historialMio:historialRival).length>3) (posesionMia?historialMio:historialRival).shift();
        if(posesionMia) siguienteIdxMio=mejor; else siguienteIdxRival=mejor;
        // Anticipación real: mientras el balón todavía está en el
        // aire, se calcula ya (con una versión ligera de la misma
        // puntuación) quién sería el mejor apoyo desde la posición
        // FUTURA del receptor — y ese compañero ya empieza a moverse
        // hacia una posición de apoyo ahora mismo, no cuando el balón
        // llegue. Así se ve al equipo "leer" la jugada por delante,
        // como un jugador real que ya sabe dónde va a recibir su
        // compañero y se mueve para ayudar antes de que llegue.
        let mejorApoyo=-1, mejorPuntApoyo=-Infinity;
        equipoAtaca.forEach((p2,i2)=>{
          if(i2===mejor || i2===idxConBalon || i2===0) return;
          const d2=Math.hypot(p2.x-destino.x, p2.y-destino.y);
          if(d2>34) return;
          const puntApoyo=avanceAtaca[i2]*6 - d2*0.25 + Math.random()*2;
          if(puntApoyo>mejorPuntApoyo){ mejorPuntApoyo=puntApoyo; mejorApoyo=i2; }
        });
        if(mejorApoyo>=0){
          const objetivoApoyo=golObjetivo;
          const posApoyoActual=equipoAtaca[mejorApoyo];
          const xApoyo=posApoyoActual.x+(objetivoApoyo.x-posApoyoActual.x)*0.14;
          const yApoyo=posApoyoActual.y+(objetivoApoyo.y-posApoyoActual.y)*0.14;
          moverJugador(posesionMia, mejorApoyo, xApoyo, yApoyo, dur*1.1);
        }
        }
      }

      actualizarFormacionDinamica(posesionMia, posesionMia?idxConBalon:undefined, posesionMia?undefined:idxConBalon, posActual,
        posesionMia?receptorPaseIdx:undefined, posesionMia?undefined:receptorPaseIdx);

      setTimeout(()=>{
        posesionMia=siguientePosesionMia; idxConBalonMio=siguienteIdxMio; idxConBalonRival=siguienteIdxRival;
        tiempoTranscurrido+=duracionEfectiva;
        tick();
      }, real(duracionEfectiva));
    }
    // El balón empieza pegado de verdad al jugador que saca de centro,
    // no flotando solo en el punto exacto del centro del campo.
    const equipoInicial = posesionMia?posMia:posRival;
    const idxInicial = posesionMia?idxConBalonMio:idxConBalonRival;
    moverBalon(equipoInicial[idxInicial].x, equipoInicial[idxInicial].y, 1);
    if(typeof window.playSound==='function') window.playSound('whistle');
    setTimeout(tick, real(600));

    // Flujo continuo: el bucle de DECISIONES (tick) sigue corriendo
    // cada 1-2 segundos, porque ahí es donde se decide pase/disparo/
    // robo — tocar esa cadencia significaría rehacer toda la lógica
    // de juego, con mucho riesgo de romper algo que ya funciona. Pero
    // el MOVIMIENTO VISUAL de los jugadores sin balón no tiene por
    // qué esperar a cada decisión: este bucle aparte, mucho más
    // frecuente, va corrigiendo su posición constantemente entre
    // medias, así el partido se ve fluido en vez de a golpes, sin
    // tocar ni un ápice de cómo se deciden los pases o los disparos.
    const flujoContinuoInterval=setInterval(()=>{
      if(partidoDetenido || partidoTerminado) return;
      const idxBalonAhora = posesionMia?idxConBalonMio:idxConBalonRival;
      const balonPosAhora={x:parseFloat(balon.getAttribute('cx')), y:parseFloat(balon.getAttribute('cy'))};
      actualizarFormacionDinamica(posesionMia, posesionMia?idxBalonAhora:undefined, posesionMia?undefined:idxBalonAhora, balonPosAhora,
        posesionMia?receptorPaseIdx:undefined, posesionMia?undefined:receptorPaseIdx);
    }, real(420));

    const velocidadBtn=overlay.querySelector('#lmVisorVelocidadBtn');
    if(velocidadBtn) velocidadBtn.addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      velocidadPartido = velocidadPartido>=4 ? 1 : velocidadPartido+1;
      velocidadBtn.innerHTML = `<i class="ph ph-bold ph-fast-forward"></i> ${t('lm.velocidad')} ${velocidadPartido}X`;
    });
    // Salta directamente al resultado real ya decidido de antes (el
    // partido entero se calculó de golpe al principio; el visor solo
    // lo está representando poco a poco) — y muestra un resumen igual
    // que el del modo automático: goles, tarjetas, todo con su minuto.
    function mostrarResumenFinal(){
      partidoDetenido=true;
      clearInterval(minuteroInterval);
      clearInterval(flujoContinuoInterval);
      minuteroEl.textContent="90'";
      const misGolesFinal = miEsLocal ? info.resultado.golesA : info.resultado.golesB;
      const rivalGolesFinal = miEsLocal ? info.resultado.golesB : info.resultado.golesA;
      resEl.textContent = `${misGolesFinal} - ${rivalGolesFinal}`;

      const eventosOrdenados = (info.eventos||[]).slice().sort((a,b)=>a.minute-b.minute);
      let numGoles=0, numTarjetas=0, numLesiones=0;
      const filas = eventosOrdenados.map(ev=>{
        const esMio = ev.team===miLado;
        const equipo = esMio?miNombre:rivalNombre;
        let icono='⚽', texto=t('lm.resumen_gol_minuto'), clase='lm-visor-resumen-gol';
        if(ev.type==='card'){
          icono = ev.tarjeta==='roja'?'🟥':'🟨';
          texto = ev.tarjeta==='roja'?t('lm.resumen_tarjeta_roja'):t('lm.resumen_tarjeta_amarilla');
          clase = ev.tarjeta==='roja'?'lm-visor-resumen-roja':'lm-visor-resumen-amarilla';
          numTarjetas++;
        } else if(ev.type==='injury'){
          icono='✚'; texto=`${t('lm.resumen_lesion')} (${ev.sev?ev.sev.label:''})`; clase='lm-visor-resumen-lesion';
          numLesiones++;
        } else {
          numGoles++;
        }
        const nombreJ = ev.jugador?ev.jugador.name:'';
        const ladoClase = esMio ? 'lm-visor-resumen-mia' : 'lm-visor-resumen-rival';
        return `<div class="lm-visor-resumen-fila ${clase} ${ladoClase}">
          ${esMio?`<span class="lm-visor-resumen-contenido">${icono} <strong>${nombreJ}</strong></span><span class="lm-visor-resumen-min">${ev.minute}'</span><span class="lm-visor-resumen-hueco"></span>`
                 :`<span class="lm-visor-resumen-hueco"></span><span class="lm-visor-resumen-min">${ev.minute}'</span><span class="lm-visor-resumen-contenido">${icono} <strong>${nombreJ}</strong></span>`}
        </div>`;
      }).join('');

      const resultadoTexto = misGolesFinal>rivalGolesFinal ? t('lm.resultado_victoria') : (misGolesFinal<rivalGolesFinal ? t('lm.resultado_derrota') : t('lm.resultado_empate'));
      const resultadoClase = misGolesFinal>rivalGolesFinal ? 'lm-visor-resultado-victoria' : (misGolesFinal<rivalGolesFinal ? 'lm-visor-resultado-derrota' : 'lm-visor-resultado-empate');
      const partesResumen=[];
      if(numGoles) partesResumen.push(`${numGoles} ${t('lm.resumen_goles_total')}`);
      if(numTarjetas) partesResumen.push(`${numTarjetas} ${t('lm.resumen_tarjetas_total')}${numTarjetas!==1?'s':''}`);
      if(numLesiones) partesResumen.push(`${numLesiones} ${t('lm.resumen_lesiones_total')}${numLesiones!==1?'es':''}`);

      const resumenBox = document.getElementById('lmVisorResumenBox');
      resumenBox.style.display='block';
      resumenBox.innerHTML = `
        <div class="lm-visor-resultado-banner ${resultadoClase}">${resultadoTexto}</div>
        <div class="lm-visor-resumen-titulo">${t('lm.resumen_partido_titulo')}</div>
        ${filas || ''}
        ${partesResumen.length?`<div class="lm-visor-resumen-pie">${partesResumen.join(' · ')}</div>`:''}`;

      infoBar.textContent = t('lm.visor_termina');
      mostrarTextoGrande(t('lm.visor_termina'), real(2000));
      if(typeof window.playSound==='function') window.playSound('whistle_final');

      partidoTerminado=true;
      cerrarBtn.textContent = t('lm.continuar');
      const historicoBtn=overlay.querySelector('#lmVisorHistoricoBtn');
      if(historicoBtn){
        historicoBtn.style.display='block';
        historicoBtn.addEventListener('click', ()=>{
          if(typeof window.playSound==='function') window.playSound('select');
          if(typeof mostrarHistoricoPartido==='function') mostrarHistoricoPartido(info, miEsLocal);
        });
      }
    }
    cerrarBtn.addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      if(!partidoTerminado){
        mostrarResumenFinal();
        return;
      }
      clearInterval(minuteroInterval);
      clearInterval(flujoContinuoInterval);
      overlay.remove();
      if(onFinish) onFinish();
    });
  }

  window.G2G_abrirVisorPartidoManager = abrirVisorPartidoManager;

})();
