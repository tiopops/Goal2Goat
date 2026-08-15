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
  // Marcador de versión — visible en la consola del navegador nada
  // más cargar la página. Si al abrir las herramientas de desarrollo
  // (F12 → Console) NO ves esta línea, o ves una fecha antigua, este
  // archivo concreto no se ha actualizado en el servidor todavía
  // (aunque el resto del juego sí esté al día) — es la explicación
  // más probable si el Giro Táctico funciona en modo automático
  // (código en liga-manager.js) pero no en modo manager (código
  // aquí, en liga-manager-partido-visor.js).
  console.log('[Liga Manager] liga-manager-partido-visor.js cargado — versión 2026-08-15-giro-timing-fix');

  function elegirFormacionRivalVisor(rival){
    const desequilibrio=rival.attack-rival.defense;
    if(desequilibrio>10) return '4-3-3';
    if(desequilibrio<-10) return '5-3-2';
    return '4-4-2';
  }

  function abrirVisorPartidoManager(info, onFinish, deps){
    const {state, t, formacionActual, generarSlotsFormacion, climaDelPartido, calcularStatsEquipo, plantillaEfectivaRival, crestHTML, rivalCrestHTML, mostrarHistoricoPartido,
      guardarEstado, getMaxGiroTacticoLM, jugadorRivalAleatorio, elegirGoleador, elegirJugadorAlineado} = deps;
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
    // Margen de seguridad: ningún jugador (sobre todo el portero, que
    // se coloca más cerca del borde que nadie) debe quedar tan pegado
    // al límite del campo que su círculo o su nombre se salgan del
    // lienzo visible. Se aplica DESPUÉS de las fórmulas de arriba,
    // igual en las dos orientaciones, así cubre cualquier jugador,
    // no solo el portero.
    const MARGEN_BORDE = 8.5;
    // El nombre del jugador se dibuja siempre HACIA ABAJO del círculo
    // (nunca hacia arriba ni a los lados por igual), así que el borde
    // inferior necesita más margen que los demás — si no, aunque el
    // círculo quepa bien, el nombre se sale por abajo.
    const MARGEN_BORDE_INFERIOR = 13;
    function aplicarMargenBorde(slots){
      return slots.map(s=>({
        x: Math.max(MARGEN_BORDE, Math.min(ANCHO-MARGEN_BORDE, s.x)),
        y: Math.max(MARGEN_BORDE, Math.min(ALTO-MARGEN_BORDE_INFERIOR, s.y))
      }));
    }
    misSlots = aplicarMargenBorde(misSlots);
    rivalSlots = aplicarMargenBorde(rivalSlots);

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
      // El nombre normalmente se dibuja hacia abajo del círculo, pero
      // el portero de mi equipo en móvil (orientación vertical) está
      // situado abajo del todo del campo — ahí, dibujar el nombre
      // hacia abajo lo sacaría del lienzo visible. En ese caso
      // concreto (y solo ese), el nombre se dibuja hacia ARRIBA en su
      // lugar.
      const nombreHaciaArriba = !esEscritorio && esGK && esMio;
      const nombreY = nombreHaciaArriba ? -(r+2.3) : (r+2.3);
      return `<g class="lm-visor-jugador-g" id="${id}" transform="translate(${s.x},${s.y})">
        <circle cx="0" cy="0" r="${r}" class="lm-visor-punto ${claseEquipo}${esGK?' lm-visor-punto-gk':''}"/>
        <text x="0" y="0" class="lm-visor-numero${esGK?' lm-visor-numero-gk':''}">${num}</text>
        ${nombreCompleto?`<text x="0" y="${nombreY}" class="lm-visor-nombre-jugador">${nombreCompleto}</text>`:''}
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
        <div class="lm-visor-scroll-mid">
        <div class="lm-visor-marcador-linea"></div>
        <div class="lm-visor-minutero" id="lmVisorMinutero">0'</div>
        <div class="lm-visor-posesion-directo">
          <div class="lm-visor-posesion-directo-mia" id="lmVisorPosesionMia" style="width:50%">50%</div>
          <div class="lm-visor-posesion-directo-rival" id="lmVisorPosesionRival" style="width:50%">50%</div>
        </div>
        ${clima?`<div class="lm-visor-clima-bar">${clima.label}</div>`:''}
        <div id="lmVisorGiroDebug" class="lm-visor-giro-debug"></div>
        <div class="lm-visor-campo-wrap ${climaClase}">
          <svg class="lm-visor-campo-svg" viewBox="0 0 ${ANCHO} ${ALTO}" preserveAspectRatio="xMidYMid meet">
            ${franjasHTML}
            ${lineasCampo}
            <circle cx="${CENTRO_X}" cy="${CENTRO_Y}" r="0.8" fill="#eaf5ea" opacity="0.9"/>
            <g id="lmVisorGrupoRival">${rivalSlots.map((s,i)=>puntoJugadorHTML(s, i===0, false, i, rivalNumeros[i], rivalNombres[i])).join('')}</g>
            <g id="lmVisorGrupoMio">${misSlots.map((s,i)=>puntoJugadorHTML(s, i===0, true, i, misNumeros[i], misNombres[i])).join('')}</g>
            <ellipse cx="${CENTRO_X}" cy="${CENTRO_Y}" rx="1.3" ry="0.55" id="lmVisorBalonSombra" fill="rgba(0,0,0,.38)" style="filter:blur(.4px)"/>
            <circle cx="${CENTRO_X}" cy="${CENTRO_Y}" r="1.3" class="lm-visor-balon" id="lmVisorBalon"/>
            <circle cx="${CENTRO_X}" cy="${CENTRO_Y}" r="3.6" class="lm-visor-resalte" id="lmVisorResalte" opacity="0"/>
            <g id="lmVisorAlerta" opacity="0" style="pointer-events:none">
              <circle id="lmVisorAlertaPulso" cx="0" cy="0" r="4.8" fill="none" stroke="#e6362f" stroke-width="0.4" class="lm-visor-alerta-pulso"/>
              <circle id="lmVisorAlertaFondo" cx="0" cy="0" r="4.8" fill="#e6362f" stroke="#fff" stroke-width="0.45"/>
              <foreignObject x="-3.6" y="-3.6" width="7.2" height="7.2">
                <div xmlns="http://www.w3.org/1999/xhtml" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center">
                  <i id="lmVisorAlertaIcono" class="ph ph-bold ph-hand-fist" style="font-size:4.2px;color:#fff;line-height:1"></i>
                </div>
              </foreignObject>
            </g>
          </svg>
          <div class="lm-visor-anuncio" id="lmVisorAnuncio"></div>
          <button id="lmVisorLeyendaBtn" class="lm-visor-leyenda-btn" title="${t('lm.leyenda_iconos_titulo')}" type="button"><i class="ph ph-bold ph-question"></i></button>
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
        </div>
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
    // Posesión en directo: se muestrea el estado actual (quién tiene
    // el balón) en cada uno de estos mismos ticks — con el partido
    // entero muestreado cada 250ms, el porcentaje acumulado converge
    // de forma fiable hacia la posesión real del partido, sin
    // necesitar ningún reloj ni contador aparte.
    let muestrasPosesionMia=0, muestrasPosesionTotal=0;
    // Vigilante anti-cuelgue: guarda cuándo entró tick() por última
    // vez de verdad. Si el partido se queda colgado por cualquier
    // motivo (un camino de código que no programa el siguiente
    // setTimeout, por ejemplo), este vigilante lo detecta y reactiva
    // el partido — no soluciona la causa de fondo si la hay, pero
    // evita que el jugador se quede con un partido roto sin ninguna
    // forma de continuar.
    let ultimoTickReal = performance.now();
    const posesionMiaEl=overlay.querySelector('#lmVisorPosesionMia');
    const posesionRivalEl=overlay.querySelector('#lmVisorPosesionRival');
    const minuteroInterval=setInterval(()=>{
      const minuto=Math.max(0, Math.min(90, Math.floor((tiempoTranscurrido/DURACION_TOTAL)*90)));
      minuteroEl.textContent=(minuto>=90?'90+':minuto)+"'";
      if(!partidoDetenido){
        muestrasPosesionTotal++;
        if(posesionMia) muestrasPosesionMia++;
        if(muestrasPosesionTotal>4 && posesionMiaEl && posesionRivalEl){
          const pctMia=Math.round((muestrasPosesionMia/muestrasPosesionTotal)*100);
          posesionMiaEl.style.width=pctMia+'%';
          posesionMiaEl.textContent=pctMia+'%';
          posesionRivalEl.style.width=(100-pctMia)+'%';
          posesionRivalEl.textContent=(100-pctMia)+'%';
        }
      }
    }, 250);
    // Vigilante anti-cuelgue: comprueba cada 3 segundos si tick() lleva
    // demasiado tiempo sin entrar de nuevo (más de 15 segundos reales,
    // un margen generoso que nunca debería alcanzarse con una pausa
    // legítima, ni siquiera a la velocidad más lenta). Si detecta que
    // el partido está atascado sin haberse detenido ni terminado a
    // propósito, fuerza que continúe — no arregla la causa de fondo si
    // la hubiera, pero garantiza que el jugador nunca se quede con un
    // partido roto sin ninguna forma de seguir.
    const vigilanteInterval=setInterval(()=>{
      if(partidoDetenido || partidoTerminado || pausadoPorGiroTactico) return;
      if(performance.now()-ultimoTickReal>15000){
        console.warn('[Liga Manager] El partido llevaba más de 15s sin avanzar — reactivado por el vigilante.');
        tick();
      }
    }, 3000);
    const desplazamientoMio = esEscritorio ? 'translateX(6px)' : 'translateY(-6px)';
    const desplazamientoRival = esEscritorio ? 'translateX(-6px)' : 'translateY(6px)';

    // ── Animación continua del balón, por fotograma ──
    // Antes el balón se movía con una transición CSS: el navegador
    // interpolaba visualmente, pero el ATRIBUTO cx/cy del SVG pasaba a
    // valer el DESTINO final al instante, no la posición real en
    // pantalla durante el trayecto. Como el resto del código consulta
    // esa posición con getAttribute('cx'/'cy') para decidir dónde está
    // el balón "ahora mismo" (recuperaciones, disputas, golden rule),
    // en la práctica siempre se leía el destino, nunca la posición
    // visual real — de ahí buena parte de la sensación de "balón en
    // tierra de nadie" o "imán": el código pensaba que el balón ya
    // había llegado antes de que se viera llegar.
    // Con este cambio, el balón se anima con requestAnimationFrame,
    // recalculando su posición real cada fotograma (~60 veces por
    // segundo) y escribiéndola en cx/cy — así getAttribute siempre
    // devuelve la posición REAL en pantalla en ese instante, no un
    // destino adelantado. La curva de movimiento (easeOutCubic) imita
    // la misma física de "sale rápido, frena progresivamente" que ya
    // teníamos con CSS, así que el aspecto visual no cambia — lo que
    // cambia es que ahora es de verdad, fotograma a fotograma, no una
    // ilusión del navegador.
    let ballAnim = {startX:CENTRO_X, startY:CENTRO_Y, targetX:CENTRO_X, targetY:CENTRO_Y, startTime:0, duration:1, active:false};
    function easeOutCubic(t){ return 1-Math.pow(1-t,3); }
    let ballAnimFrameId=null;
    const balonSombra = overlay.querySelector('#lmVisorBalonSombra');
    function ballAnimFrame(now){
      if(ballAnim.active){
        const elapsed=now-ballAnim.startTime;
        const t=Math.min(1, elapsed/ballAnim.duration);
        const eased=easeOutCubic(t);
        const curX=ballAnim.startX+(ballAnim.targetX-ballAnim.startX)*eased;
        const curY=ballAnim.startY+(ballAnim.targetY-ballAnim.startY)*eased;
        balon.setAttribute('cx', curX);
        balon.setAttribute('cy', curY);
        if(balonSombra){ balonSombra.setAttribute('cx', curX); balonSombra.setAttribute('cy', curY); }
        if(t>=1) ballAnim.active=false;
      }
      ballAnimFrameId=requestAnimationFrame(ballAnimFrame);
    }
    ballAnimFrameId=requestAnimationFrame(ballAnimFrame);
    // Congela al instante cualquier animación en marcha (balón y
    // jugadores) — se llama justo al pausar el partido para el Giro
    // Táctico. Sin esto, el temporizador del partido se paraba pero
    // cualquier movimiento que ya estuviera en marcha (un jugador
    // corriendo, el balón volando) seguía completándose visualmente
    // de fondo, detrás del popup, dando la sensación de que el
    // partido no estaba realmente parado.
    function finalizarTodasLasAnimacionesEnCurso(){
      if(ballAnim.active){
        balon.setAttribute('cx', ballAnim.targetX);
        balon.setAttribute('cy', ballAnim.targetY);
        if(balonSombra){ balonSombra.setAttribute('cx', ballAnim.targetX); balonSombra.setAttribute('cy', ballAnim.targetY); }
        ballAnim.active=false;
      }
      for(const key in jugadorAnims){
        const a=jugadorAnims[key];
        if(a.active && a.el){
          a.el.setAttribute('transform', `translate(${a.targetX},${a.targetY})`);
          a.active=false;
        }
      }
    }

    function moverBalon(x,y,durMs){
      const durReal=real(durMs);
      // Simula un pase alto sin animar ningún giro (mucho más simple
      // y seguro): en un trayecto largo, el balón crece en la primera
      // mitad del recorrido y encoge en la segunda — una parábola de
      // verdad, con el punto más grande justo en el centro del
      // trayecto, no una meseta que se queda grande un rato y luego
      // encoge de golpe. Esto sigue usando CSS porque es un atributo
      // aparte (r, el radio) que no interfiere con la posición.
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
        balon.style.transition=`r ${mitadReal}ms ease-out`;
        balon.setAttribute('r', radioAlto);
        // La sombra en el suelo crece y se difumina a la vez que el
        // balón "sube" — en la vida real, cuanto más alto vuela un
        // balón, más grande y más tenue se ve su sombra proyectada.
        // Al aterrizar, sombra y balón vuelven a coincidir en tamaño y
        // opacidad, dando la sensación de que ha tocado el suelo de
        // verdad.
        if(balonSombra){
          balonSombra.style.transition=`rx ${mitadReal}ms ease-out, ry ${mitadReal}ms ease-out, opacity ${mitadReal}ms ease-out`;
          balonSombra.setAttribute('rx', (1.3+factorAltura*1.4).toFixed(2));
          balonSombra.setAttribute('ry', (0.55+factorAltura*0.35).toFixed(2));
          balonSombra.style.opacity = (0.38-factorAltura*0.22).toFixed(2);
        }
        setTimeout(()=>{
          balon.style.transition=`r ${mitadReal}ms ease-out`;
          balon.setAttribute('r', radioBase);
          if(balonSombra){
            balonSombra.style.transition=`rx ${mitadReal}ms ease-out, ry ${mitadReal}ms ease-out, opacity ${mitadReal}ms ease-out`;
            balonSombra.setAttribute('rx','1.3'); balonSombra.setAttribute('ry','0.55');
            balonSombra.style.opacity='0.38';
          }
        }, real(durMs/2));
      }
      ballAnim.startX=cxActual; ballAnim.startY=cyActual;
      ballAnim.targetX=x; ballAnim.targetY=y;
      ballAnim.startTime=performance.now();
      ballAnim.duration=Math.max(1, durReal);
      ballAnim.active=true;
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
    // Exclamación roja tipo "alerta" (Metal Gear Solid): un único
    // pulso, aparece de golpe (sin transición de entrada, para que se
    // note el sobresalto) justo encima del punto del evento, se
    // mantiene un instante, y se desvanece — para leer visualmente el
    // momento exacto de una disputa de balón, una falta o una parada,
    // sin depender solo del texto de la barra de información. El
    // icono cambia según el tipo de evento, siempre con iconos
    // Phosphor reales (nunca texto suelto).
    const alertaEl = overlay.querySelector('#lmVisorAlerta');
    const alertaIconoEl = overlay.querySelector('#lmVisorAlertaIcono');
    const alertaFondoEl = overlay.querySelector('#lmVisorAlertaFondo');
    const alertaPulsoEl = overlay.querySelector('#lmVisorAlertaPulso');
    function mostrarAlertaEvento(x,y,iconoClase,colorFondo,colorIcono){
      if(!alertaEl) return;
      if(alertaIconoEl){
        alertaIconoEl.setAttribute('class', `ph ph-bold ${iconoClase}`);
        alertaIconoEl.style.color = colorIcono || '#fff';
      }
      if(alertaFondoEl) alertaFondoEl.setAttribute('fill', colorFondo || '#e6362f');
      if(alertaPulsoEl) alertaPulsoEl.setAttribute('stroke', colorFondo || '#e6362f');
      // Consciente de los 4 bordes del campo, no solo el superior: si
      // el punto está cerca de cualquier borde (por ejemplo, junto al
      // área o junto a la banda), la alerta se desplaza hacia el
      // CENTRO del campo en la dirección que haga falta para quedar
      // siempre completamente visible, en vez de arriesgarse a salir
      // del lienzo por cualquiera de los cuatro lados.
      const RADIO_ALERTA=4.8, MARGEN_ALERTA=RADIO_ALERTA+2.2;
      const cercaBordeSuperior = y<MARGEN_ALERTA+6.8;
      const desplazamiento = cercaBordeSuperior ? 8 : -8;
      const desplazamientoInicial = cercaBordeSuperior ? 6.8 : -6.8;
      const xClamp = Math.max(MARGEN_ALERTA, Math.min(ANCHO-MARGEN_ALERTA, x));
      const yFinal = y+desplazamiento;
      const yFinalClamp = Math.max(MARGEN_ALERTA, Math.min(ALTO-MARGEN_ALERTA, yFinal));
      const yInicialClamp = Math.max(MARGEN_ALERTA, Math.min(ALTO-MARGEN_ALERTA, y+desplazamientoInicial));
      alertaEl.style.transition='none';
      alertaEl.setAttribute('transform', `translate(${xClamp},${yInicialClamp}) scale(0.4)`);
      alertaEl.setAttribute('opacity','0');
      // Reinicia la animación de pulso del anillo — quitando y
      // volviendo a poner la clase se fuerza a que arranque desde
      // cero cada vez, en vez de quedarse "congelada" a mitad si ya
      // estaba corriendo de un evento anterior.
      if(alertaPulsoEl){
        alertaPulsoEl.style.animation='none';
        void alertaPulsoEl.getBoundingClientRect();
        alertaPulsoEl.style.animation='';
      }
      void alertaEl.getBoundingClientRect(); // fuerza el repintado antes de animar
      alertaEl.style.transition='transform .18s cubic-bezier(.34,1.56,.64,1), opacity .12s ease-out';
      alertaEl.setAttribute('transform', `translate(${xClamp},${yFinalClamp}) scale(1)`);
      alertaEl.setAttribute('opacity','1');
      setTimeout(()=>{
        alertaEl.style.transition='opacity .45s ease-in';
        alertaEl.setAttribute('opacity','0');
      }, 550);
    }
    // Alias por tipo de evento — nombres claros en cada punto donde se
    // usan, en vez de tener que recordar qué icono y qué color
    // corresponde a cada situación cada vez que se llama. No todos los
    // eventos son igual de "graves": la disputa y la falta son rojas
    // (contacto/físico), el regate es una jugada positiva (amarillo,
    // icono negro) y la parada es más neutra (gris claro, icono negro).
    function mostrarAlertaDisputa(x,y){ mostrarAlertaEvento(x,y,'ph-hand-fist','#e6362f','#fff'); if(typeof window.playSound==='function') window.playSound('tackle_thud'); }
    function mostrarAlertaFalta(x,y){ mostrarAlertaEvento(x,y,'ph-warning','#e6362f','#fff'); }
    function mostrarAlertaParada(x,y){ mostrarAlertaEvento(x,y,'ph-hands-clapping','#d8d8d8','#1a1a1a'); if(typeof window.playSound==='function') window.playSound('save_catch'); }
    function mostrarAlertaLesion(x,y){ mostrarAlertaEvento(x,y,'ph-first-aid-kit','#e6362f','#fff'); if(typeof window.playSound==='function') window.playSound('injury_alert'); }
    function mostrarAlertaSaqueBanda(x,y){ mostrarAlertaEvento(x,y,'ph-arrow-bend-up-right','#4a4a4a','#fff'); if(typeof window.playSound==='function') window.playSound('throwin_short'); }
    function mostrarAlertaFueraDeJuego(x,y){ mostrarAlertaEvento(x,y,'ph-flag-pennant','#3a6bd8','#fff'); if(typeof window.playSound==='function') window.playSound('whistle_short'); }
    function mostrarAlertaRobo(x,y){ mostrarAlertaEvento(x,y,'ph-hand-palm','#2d9c6f','#fff'); if(typeof window.playSound==='function') window.playSound('ball_steal'); }
    function mostrarAlertaDespeje(x,y){ mostrarAlertaEvento(x,y,'ph-boot','#4a4a4a','#fff'); if(typeof window.playSound==='function') window.playSound('clearance_boot'); }
    function mostrarAlertaGolCelebracion(x,y){ mostrarAlertaEvento(x,y,'ph-confetti','#f0c419','#1a1a1a'); }
    // Leyenda de iconos del HUD — consultable en cualquier momento del
    // partido sin pausar ni interrumpir nada, tal como haría un juego
    // deportivo serio con su glosario de HUD. Un botón fijo y discreto
    // en la esquina del campo abre un panel compacto con los 10
    // iconos, su color y su significado.
    const LEYENDA_ICONOS=[
      {icono:'ph-hand-fist', color:'#e6362f', nombre:t('lm.leyenda_disputa_nombre'), desc:t('lm.leyenda_disputa_desc')},
      {icono:'ph-warning', color:'#e6362f', nombre:t('lm.leyenda_falta_nombre'), desc:t('lm.leyenda_falta_desc')},
      {icono:'ph-hands-clapping', color:'#d8d8d8', colorIcono:'#1a1a1a', nombre:t('lm.leyenda_parada_nombre'), desc:t('lm.leyenda_parada_desc')},
      {icono:'ph-first-aid-kit', color:'#e6362f', nombre:t('lm.leyenda_lesion_nombre'), desc:t('lm.leyenda_lesion_desc')},
      {icono:'ph-arrow-bend-up-right', color:'#4a4a4a', nombre:t('lm.leyenda_banda_nombre'), desc:t('lm.leyenda_banda_desc')},
      {icono:'ph-flag-pennant', color:'#3a6bd8', nombre:t('lm.leyenda_fuerajuego_nombre'), desc:t('lm.leyenda_fuerajuego_desc')},
      {icono:'ph-hand-palm', color:'#2d9c6f', nombre:t('lm.leyenda_robo_nombre'), desc:t('lm.leyenda_robo_desc')},
      {icono:'ph-boot', color:'#4a4a4a', nombre:t('lm.leyenda_despeje_nombre'), desc:t('lm.leyenda_despeje_desc')},
      {icono:'ph-confetti', color:'#f0c419', colorIcono:'#1a1a1a', nombre:t('lm.leyenda_gol_nombre'), desc:t('lm.leyenda_gol_desc')},
      {icono:'ph-sneaker-move', color:'#f0c419', colorIcono:'#1a1a1a', nombre:t('lm.leyenda_regate_nombre'), desc:t('lm.leyenda_regate_desc')}
    ];
    function mostrarLeyendaIconos(){
      const existente=document.getElementById('lmVisorLeyendaOverlay');
      if(existente){ existente.remove(); return; }
      const leyendaOverlay=document.createElement('div');
      leyendaOverlay.id='lmVisorLeyendaOverlay';
      leyendaOverlay.innerHTML=`
        <div class="lm-visor-leyenda-card">
          <div class="lm-visor-leyenda-titulo">${t('lm.leyenda_iconos_titulo')}</div>
          <div class="lm-visor-leyenda-lista">
            ${LEYENDA_ICONOS.map(it=>`
              <div class="lm-visor-leyenda-fila">
                <span class="lm-visor-leyenda-icono" style="background:${it.color};color:${it.colorIcono||'#fff'}"><i class="ph ph-bold ${it.icono}"></i></span>
                <div class="lm-visor-leyenda-texto"><strong>${it.nombre}</strong><span>${it.desc}</span></div>
              </div>`).join('')}
          </div>
        </div>`;
      overlay.appendChild(leyendaOverlay);
      leyendaOverlay.addEventListener('click', (e)=>{ if(e.target===leyendaOverlay) leyendaOverlay.remove(); });
    }
    const leyendaBtn = overlay.querySelector('#lmVisorLeyendaBtn');
    if(leyendaBtn) leyendaBtn.addEventListener('click', (e)=>{
      e.stopPropagation();
      if(typeof window.playSound==='function') window.playSound('select');
      mostrarLeyendaIconos();
    });
    // Explosión de anillos dorados en el momento del gol — el
    // instante de más impacto de todo el partido, se lo merece un
    // refuerzo visual a la altura. Tres anillos con un pequeño retraso
    // entre sí, se crean y se destruyen solos (no dejan rastro en el
    // DOM una vez terminada la animación).
    const svgVisor = overlay.querySelector('.lm-visor-campo-svg');
    function mostrarExplosionGol(x,y){
      if(!svgVisor) return;
      [0,120,240].forEach(delay=>{
        setTimeout(()=>{
          const anillo=document.createElementNS('http://www.w3.org/2000/svg','circle');
          anillo.setAttribute('cx',x); anillo.setAttribute('cy',y); anillo.setAttribute('r','2.2');
          anillo.setAttribute('class','lm-visor-gol-anillo');
          svgVisor.appendChild(anillo);
          setTimeout(()=>anillo.remove(), 950);
        }, real(delay));
      });
    }
    function mostrarAlertaRegate(x,y){ mostrarAlertaEvento(x,y,'ph-sneaker-move','#f0c419','#1a1a1a'); if(typeof window.playSound==='function') window.playSound('dribble_flick'); }
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
    // ── Animación continua de los jugadores, por fotograma ──
    // Misma idea que con el balón, pero con una diferencia deliberada
    // y muy importante: aquí SOLO se hace continuo el aspecto VISUAL
    // (cómo se ve moverse el jugador en el campo). La posición LÓGICA
    // (arr[idx], la que usa toda la lógica de decisiones — marcaje,
    // distancias, fuera de juego, elegir a quién pasar) se sigue
    // actualizando al instante, exactamente igual que antes. Cambiar
    // también eso habría alterado sutilmente el comportamiento de
    // decisiones ya probado y ajustado durante muchas rondas — un
    // riesgo que no merece la pena para lo que se pidió, que es que
    // el MOVIMIENTO se vea fluido, no rehacer cómo deciden los
    // jugadores.
    const jugadorAnims = {}; // clave: "mio-3" / "rival-7" → {startX,startY,targetX,targetY,startTime,duration,active,el}
    // Bloqueo temporal del reposicionamiento ambiental (reubicarEquipo,
    // más abajo) durante una reorganización completa del equipo —
    // saque inicial, gol o inicio de la segunda parte. Sin esto, el
    // bucle de fondo (flujoContinuoInterval, cada 230ms) podía asignar
    // un destino nuevo a algún jugador a mitad de la reorganización,
    // así que el equipo nunca llegaba a completar bien la formación.
    let bloqueoReformacionHasta=0;
    let jugadorAnimFrameId=null;
    function jugadorAnimFrame(now){
      for(const key in jugadorAnims){
        const a=jugadorAnims[key];
        if(!a.active) continue;
        const elapsed=now-a.startTime;
        const t=Math.min(1, elapsed/a.duration);
        // Curva por defecto suave (easeInOutCubic) para el movimiento
        // ambiental normal — arranque y frenado progresivos, sin
        // sobresaltos. Solo los movimientos marcados explícitamente
        // como 'out' (los que van sincronizados con el balón: recibir
        // un pase, conducir/regatear con el balón en los pies) usan
        // la misma curva rápida que el balón (easeOutCubic), para que
        // ambos lleguen juntos. Antes se forzó easeOutCubic para
        // TODOS los jugadores por igual para arreglar el desajuste
        // con el balón, pero eso hacía que las correcciones de
        // posición pequeñas y frecuentes (porteros, marcaje) se
        // vieran a golpecitos nerviosos en vez de suaves — con la
        // curva normal de vuelta para esos casos, y la rápida solo
        // donde hace falta, se arreglan los dos problemas a la vez.
        const eased = a.easing==='out' ? (1-Math.pow(1-t,3)) : (t<0.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2);
        const curX=a.startX+(a.targetX-a.startX)*eased;
        const curY=a.startY+(a.targetY-a.startY)*eased;
        if(a.el) a.el.setAttribute('transform', `translate(${curX},${curY})`);
        if(t>=1){
          a.active=false;
          // Aviso de finalización — usado por la reorganización tras
          // gol/descanso para saber con certeza cuándo TODOS los
          // jugadores han llegado de verdad a su sitio, en vez de
          // confiar en un tiempo fijo calculado a ojo.
          if(typeof a.onComplete==='function'){ const cb=a.onComplete; a.onComplete=null; cb(); }
        }
      }
      jugadorAnimFrameId=requestAnimationFrame(jugadorAnimFrame);
    }
    jugadorAnimFrameId=requestAnimationFrame(jugadorAnimFrame);

    function moverJugador(esMio, idx, x, y, dur, easing, onComplete){
      const arr = esMio?posMia:posRival;
      // Blindaje real: si por lo que sea idx llega inválido (-1 u
      // otro fuera de rango — puede pasar en algún caso límite de las
      // jugadas más elaboradas, con varias exclusiones de jugador
      // encadenadas), esta función antes lanzaba un error real al
      // intentar leer arr[idx].x sobre "undefined". Ese error,
      // ocurriendo dentro de un setTimeout, detenía silenciosamente
      // TODO el bucle del partido sin ningún aviso — el reloj y el
      // partido se quedaban "colgados" para siempre, sin ningún
      // mensaje de fallo visible. Ahora, si el índice no es válido,
      // simplemente no se hace nada (en vez de reventar todo el
      // partido por un único cálculo puntual mal resuelto).
      if(idx<0 || idx>=arr.length || !arr[idx]){
        // Igual que con el índice inválido: si no se puede animar,
        // se avisa igualmente de "terminado" para no dejar colgado
        // para siempre a quien esté esperando a que todos lleguen.
        if(typeof onComplete==='function') onComplete();
        return;
      }
      const el=elJugador(esMio, idx);
      if(el){
        const durReal=real(dur);
        const key=(esMio?'mio-':'rival-')+idx;
        const actual=jugadorAnims[key];
        // Parte SIEMPRE desde la posición visual real en la que esté
        // en ESTE instante (si ya estaba a mitad de otro movimiento,
        // continúa desde ahí, no desde el destino de la animación
        // anterior) — así los cambios de dirección se ven naturales,
        // sin saltos.
        const startX = (actual && actual.active) ? (actual.startX+(actual.targetX-actual.startX)*Math.min(1,(performance.now()-actual.startTime)/actual.duration)) : arr[idx].x;
        const startY = (actual && actual.active) ? (actual.startY+(actual.targetY-actual.startY)*Math.min(1,(performance.now()-actual.startTime)/actual.duration)) : arr[idx].y;
        jugadorAnims[key] = {startX, startY, targetX:x, targetY:y, startTime:performance.now(), duration:Math.max(1,durReal), active:true, el, easing:easing||'inout', onComplete};
      } else if(typeof onComplete==='function'){
        onComplete();
      }
      arr[idx]={x,y};
    }
    // Reorganización completa (saque inicial, gol, segunda parte):
    // en vez de fiarse de un tiempo fijo calculado a ojo (que podía
    // desincronizarse si algún jugador tardaba un poco más de lo
    // previsto), esto espera de verdad a que los 22 jugadores hayan
    // terminado su propio movimiento antes de llamar a "callback" —
    // el partido no puede seguir hasta que todos estén realmente
    // colocados donde toca, sea cual sea la distancia de cada uno.
    function reorganizarYEsperar(dur, callback){
      let pendientes = misSlots.length + rivalSlots.length;
      let avisado=false;
      function unoListo(){
        pendientes--;
        if(pendientes<=0 && !avisado){ avisado=true; callback(); }
      }
      misSlots.forEach((s,i)=>moverJugador(true, i, s.x, s.y, dur, 'out', unoListo));
      rivalSlots.forEach((s,i)=>moverJugador(false, i, s.x, s.y, dur, 'out', unoListo));
      // Red de seguridad: si por lo que sea algún aviso se perdiera
      // (nunca debería pasar, pero un partido no puede quedarse
      // colgado para siempre por un solo callback fallido), se
      // fuerza la continuación pasado un margen generoso por encima
      // de la duración real del movimiento.
      setTimeout(()=>{ if(!avisado){ avisado=true; callback(); } }, real(dur+800));
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
    // Categoría táctica del RIVAL, derivada de sus propias
    // estadísticas (mismo criterio que ya usa el panel de "estilo de
    // juego" que se le muestra al jugador antes del partido) — antes
    // esta categoría solo existía para el equipo del jugador, así que
    // el rival SIEMPRE se comportaba de forma neutra en la
    // simulación, sin importar si el panel decía que jugaba "muy
    // ofensivo" o "muy defensivo". Ahora ese estilo mostrado se
    // refleja de verdad en cómo presiona, empuja y se repliega.
    const desequilibrioRival = rival.attack-rival.defense;
    const catTacticaRival = desequilibrioRival>8 ? 'ofensiva' : (desequilibrioRival<-8 ? 'defensiva' : 'equilibrada');
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
    // Multiplicador base según la categoría táctica del rival — igual
    // que multEmpujeMioBase/multRiesgoMioBase para el jugador, pero
    // derivado de las estadísticas reales del rival en vez de una
    // formación elegida a mano.
    const multEmpujeRivalBase = catTacticaRival==='ofensiva' ? 1.35 : (catTacticaRival==='defensiva' ? 0.65 : 1);
    const multRiesgoRivalBase = catTacticaRival==='ofensiva' ? 1.25 : (catTacticaRival==='defensiva' ? 0.7 : 1);
    function urgenciaPartidoRival(){
      const diferencia = marcadorMio - marcadorRival; // positivo = el rival va perdiendo
      const progreso = Math.min(1, tiempoTranscurrido/DURACION_TOTAL);
      let base = 1;
      if(diferencia>0) base = 1 + Math.min(0.5, diferencia*0.18*progreso);
      else if(diferencia<0) base = 1 - Math.min(0.32, Math.abs(diferencia)*0.13*progreso);
      return base*multEmpujeRivalBase;
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
    function actualizarFormacionDinamica(atacaMio, idxExcluirMio, idxExcluirRival, balonPos, idxExcluirMio2, idxExcluirRival2, idxExcluirMio3, idxExcluirRival3){
      function reubicarEquipo(esMio, idxExcluir, idxExcluir2, idxExcluir3){
        // Ninguna reubicación ambiental mientras el equipo se está
        // reorganizando de verdad (saque inicial, tras un gol, o al
        // empezar la segunda parte) — ver bloqueoReformacionHasta.
        if(performance.now()<bloqueoReformacionHasta) return;
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
        // Adelanto real de línea (portero-líbero moderno): cuando el
        // propio equipo ataca a fondo en campo contrario, sin peligro
        // inmediato sobre la propia portería, el portero se adelanta
        // unos pasos de su línea para cubrir el espacio de detrás de
        // la defensa — antes se quedaba siempre clavado en su sitio,
        // sin importar lo lejos que estuviera el balón. El avance es
        // deliberadamente modesto y siempre vuelve a la línea en
        // cuanto el propio equipo pierde la posesión.
        const distBalonPropiaGK = Math.hypot(balonPos.x-golPropioGK.x, balonPos.y-golPropioGK.y);
        const diagonalCampoGK = Math.hypot(ANCHO, ALTO);
        const adelantoGK = (yoAtaco && distBalonPropiaGK>diagonalCampoGK*0.55) ? Math.min(9, (distBalonPropiaGK/diagonalCampoGK-0.55)*22) : 0;
        const dirAdelantoX = esEscritorio ? (esMio?1:-1) : 0;
        const dirAdelantoY = esEscritorio ? 0 : (esMio?-1:1);
        const gkX = (esEscritorio ? golPropioGK.x : golPropioGK.x+desvioLateralGK) + dirAdelantoX*adelantoGK;
        const gkY = (esEscritorio ? golPropioGK.y+desvioLateralGK : golPropioGK.y) + dirAdelantoY*adelantoGK;
        if(idxExcluir!==0) setTimeout(()=>moverJugador(esMio, 0, gkX, gkY, 900), real(200));

        const destinos=[]; // para la separación: no dejar que dos caigan en el mismo punto
        for(let i=1;i<pos.length;i++){
          if(i===idxExcluir || i===idxExcluir2 || i===idxExcluir3) continue;
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
          const catTacticaAqui = esMio ? catTacticaMia : catTacticaRival;
          const replieguDefensivoBase = catTacticaAqui==='defensiva' ? 0.09 : (catTacticaAqui==='ofensiva' ? 0.035 : 0.06);
          // Urgencia del repliegue: cuanto más cerca esté el balón de
          // la propia portería, más rápido reacciona TODO el equipo
          // replegándose — antes se replegaba siempre a la misma
          // velocidad fija, sin importar si el rival estaba
          // construyendo tranquilamente en su campo o ya encarando el
          // área. Un equipo real no reacciona igual en ambos casos.
          const propioGolRef = esMio?miGolXY:rivalGolXY;
          const distBalonPropiaPorteria = Math.hypot(balonPos.x-propioGolRef.x, balonPos.y-propioGolRef.y);
          const diagonalCampo = Math.hypot(ANCHO, ALTO);
          const urgenciaRepliegue = 1 + Math.max(0, (1-(distBalonPropiaPorteria/diagonalCampo))*1.3);
          const replieguDefensivo = replieguDefensivoBase*urgenciaRepliegue;
          const empuje = yoAtaco ? (0.09+avance[i]*0.16)*factorRol*multEmpuje : replieguDefensivo;
          // Al atacar, el objetivo es la portería rival (avance real);
          // al defender, el objetivo es su propia casilla de
          // formación, ligeramente desplazada hacia la portería propia
          // según la categoría táctica (más profunda si es defensiva,
          // casi sin desplazar si es ofensiva) — vuelta gradual a su
          // sitio, nunca un salto directo a la portería.
          const desplazamientoProfundidad = catTacticaAqui==='defensiva' ? 0.22 : (catTacticaAqui==='ofensiva' ? 0.04 : 0.12);
          // Compactación real entre líneas: un equipo bien organizado
          // no solo repliega uniformemente a todos por igual — los
          // mediocentros se cierran ALGO MÁS hacia la línea defensiva
          // de lo que marcaría su propia casilla de formación, para no
          // dejar espacio explotable entre líneas. Antes cada jugador
          // solo volvía a su propia casilla proporcionalmente, sin
          // ninguna relación entre la profundidad de unos y otros —
          // así podían quedar huecos grandes entre defensa y medio
          // campo, algo que un equipo real jamás permite a propósito.
          const compactacionExtra = (!yoAtaco && roles[i]==='mid') ? desplazamientoProfundidad*0.55*urgenciaRepliegue : 0;
          const desplazamientoProfundidadFinal = Math.min(0.5, desplazamientoProfundidad+compactacionExtra);
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
              x: slots[i].x+(propioGol.x-slots[i].x)*desplazamientoProfundidadFinal,
              y: slots[i].y+(propioGol.y-slots[i].y)*desplazamientoProfundidadFinal
            };
          let x=base.x+(objetivo.x-base.x)*empuje;
          let y=base.y+(objetivo.y-base.y)*empuje;
          // Los delanteros evitan activamente el fuera de juego: si su
          // posición calculada quedaría por delante del último defensa
          // rival, se retrasan un poco para quedarse en línea — como
          // haría un delantero real que vigila constantemente dónde
          // está el linier, en vez de correr sin más hacia la
          // portería sin importarle la posición de la defensa.
          if(yoAtaco && roles[i]==='fwd'){
            const equipoRivalOffside = esMio?posRival:posMia;
            const ultimoDefensorOffside = equipoRivalOffside.reduce((max,rv,ri)=>{
              if(ri===0) return max;
              const prof = esEscritorio ? (esMio?rv.x:ANCHO-rv.x) : (esMio?ALTO-rv.y:rv.y);
              return Math.max(max, prof);
            }, -Infinity);
            const profJugador = esEscritorio ? (esMio?x:ANCHO-x) : (esMio?ALTO-y:y);
            if(profJugador>ultimoDefensorOffside-1.5){
              const profCorregida=ultimoDefensorOffside-1.5-((i*37)%10)/10*3; // margen fijo por jugador (no aleatorio en cada refresco, para no generar temblor), pero variado entre ellos
              if(esEscritorio) x = esMio?profCorregida:ANCHO-profCorregida;
              else y = esMio?ALTO-profCorregida:profCorregida;
            }
          }
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
              const posAtacanteMarcado = equipoRivalRef[objetivoMarcaje];
              // Marcaje inteligente de verdad: no se va directo a la
              // posición del rival — se coloca EN LA LÍNEA entre el
              // balón y el rival, ligeramente sesgado hacia el propio
              // lado de la portería, para cortar la línea de pase de
              // verdad (goal-side marking). Un defensa real nunca se
              // queda "delante" del rival respecto a su propia
              // portería, ni tampoco solo "al lado" sin más — se mete
              // entre el peligro (el balón) y su hombre.
              const puntoIntermedio = {
                x: posAtacanteMarcado.x + (balonPos.x-posAtacanteMarcado.x)*0.32,
                y: posAtacanteMarcado.y + (balonPos.y-posAtacanteMarcado.y)*0.32
              };
              const puntoMarcajeReal = {
                x: puntoIntermedio.x + (propioGol.x-puntoIntermedio.x)*0.16,
                y: puntoIntermedio.y + (propioGol.y-puntoIntermedio.y)*0.16
              };
              x = x+(puntoMarcajeReal.x-x)*0.22;
              y = y+(puntoMarcajeReal.y-y)*0.22;
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
          // Antes esta reubicación se relanzaba en CADA pasada de este
          // bucle (cada ~230ms desde flujoContinuoInterval, además de
          // en cada decisión de tick()) — cada llamada le daba a
          // moverJugador un destino nuevo con una duración de
          // 950-1400ms, así que casi ningún jugador llegaba a
          // completar un movimiento antes de que llegara el siguiente,
          // que lo redirigía a mitad de camino. El resultado visual
          // era justo la sensación de "golpecitos rápidos y bruscos"
          // reportada: nunca una zancada fluida, siempre un cambio de
          // rumbo constante. Ahora, si el jugador ya tiene un
          // movimiento en marcha que no ha llegado ni a sus 3/4 partes,
          // se le deja terminarlo con naturalidad antes de asignarle
          // un nuevo destino — igual que un jugador real no cambia de
          // dirección en mitad de cada paso.
          const keyAnimActual=(esMio?'mio-':'rival-')+i;
          const animActual=jugadorAnims[keyAnimActual];
          const yaEnMovimientoReciente = animActual && animActual.active && (performance.now()-animActual.startTime) < animActual.duration*0.75;
          if(!yaEnMovimientoReciente){
            setTimeout(()=>moverJugador(esMio, i, x, y, (950+Math.random()*450)*fatigaMov), real(Math.random()*350));
          }
        }
      }
      reubicarEquipo(true, idxExcluirMio, idxExcluirMio2, idxExcluirMio3);
      reubicarEquipo(false, idxExcluirRival, idxExcluirRival2, idxExcluirRival3);
    }

    let eventosGol=(info.eventos||[]).filter(e=>e.type==='goal').sort((a,b)=>a.minute-b.minute);
    let planGoles=[];
    function recalcularPlanGoles(){
      // Misma lógica de reparto que la construcción inicial, extraída
      // aquí para poder reconstruir el calendario de goles cuando el
      // Giro Táctico sustituye los de la segunda parte al descanso.
      let tCursorPlanR=0, evIdxPlanR=0;
      const nuevoPlan=[];
      while(tCursorPlanR<DURACION_TOTAL){
        const tProximoGolR = evIdxPlanR<eventosGol.length ? (eventosGol[evIdxPlanR].minute/90)*DURACION_TOTAL : Infinity;
        if(tProximoGolR<=tCursorPlanR+1600){ nuevoPlan.push(tProximoGolR); evIdxPlanR++; tCursorPlanR=tProximoGolR+1400; }
        else { tCursorPlanR+=1600; }
      }
      while(evIdxPlanR<eventosGol.length){ nuevoPlan.push(DURACION_TOTAL); evIdxPlanR++; }
      planGoles=nuevoPlan;
    }
    recalcularPlanGoles();

    // Tarjetas reales del partido — se muestran en su momento
    // proporcional, sin interrumpir la simulación como un gol.
    let eventosTarjeta=(info.eventos||[]).filter(e=>e.type==='card').sort((a,b)=>a.minute-b.minute)
      .map(e=>({...e, tMostrar:(e.minute/90)*DURACION_TOTAL, mostrado:false}));
    // Lesiones reales del partido — antes solo se mostraban en el
    // resumen final, nunca en directo durante el partido. Mismo
    // patrón que las tarjetas: se muestran en su momento proporcional,
    // sin interrumpir la simulación. (El Giro Táctico NUNCA toca las
    // lesiones: ya están médicamente registradas antes de que empiece
    // el visor, así que se dejan siempre tal cual, pase lo que pase al
    // descanso.)
    const eventosLesionVisor=(info.eventos||[]).filter(e=>e.type==='injury').sort((a,b)=>a.minute-b.minute)
      .map(e=>({...e, tMostrar:(e.minute/90)*DURACION_TOTAL, mostrado:false}));

    let marcadorMio=0, marcadorRival=0;
    let tiempoTranscurrido=0, golIdx=0;
    // Antes, saltos grandes de tiempo (sobre todo tras un gol: pases
    // de construcción + vuelo del disparo + celebración +
    // reorganización pueden sumar varios "minutos" de golpe) podían
    // cruzar de largo el descanso sin que el propio código del
    // descanso tuviera ocasión de activarse hasta el siguiente
    // tick() — así el reloj podía anunciar "descanso" ya en el
    // minuto 51 en vez de en el 45. avanzarTiempo() recorta
    // cualquier salto justo en la frontera del descanso (o del
    // final del partido) para que el reloj nunca se pase de largo.
    function avanzarTiempo(delta){
      const previo=tiempoTranscurrido;
      tiempoTranscurrido+=delta;
      if(!descansoMostrado && previo<DURACION_TOTAL/2 && tiempoTranscurrido>DURACION_TOTAL/2){
        tiempoTranscurrido=DURACION_TOTAL/2;
      } else if(tiempoTranscurrido>DURACION_TOTAL){
        tiempoTranscurrido=DURACION_TOTAL;
      }
    }
    let posesionMia = Math.random()<probPosesionMia;
    // El saque inicial lo pone en juego un centrocampista, nunca el
    // portero — antes empezaba siempre en el índice 0 (el portero),
    // sin ningún sentido para el saque de centro.
    function primerMedioCentro(roles){
      // A pesar del nombre de la función (histórico), ahora elige a un
      // DELANTERO para el saque de centro — en la vida real son los
      // delanteros quienes se sitúan en el círculo central para
      // sacar, y luego tocan el balón hacia atrás a un compañero
      // (esto último ya lo hace sacarDeCentro).
      const idxFwd=roles.findIndex(r=>r==='fwd');
      if(idxFwd>=0) return idxFwd;
      const idxMid=roles.findIndex(r=>r==='mid');
      return idxMid>=0 ? idxMid : Math.floor(roles.length/2);
    }
    let idxConBalonMio=primerMedioCentro(rolesMios), idxConBalonRival=primerMedioCentro(rolesRival);
    // Índice del jugador que va a recibir un pase actualmente en
    // vuelo (si lo hay) — declarada aquí, al mismo nivel que
    // idxConBalonMio/Rival y NO dentro de tickInner() como antes,
    // porque flujoContinuoInterval (más abajo) la necesita y vive
    // FUERA de tickInner, en esta misma función exterior que solo se
    // ejecuta una vez por partido. Al estar declarada dentro de
    // tickInner, cada 230ms ese intervalo lanzaba un ReferenceError
    // SIN CAPTURAR (los setInterval no pasan por el try/catch de
    // tick()) desde el primer segundo del partido y durante los 90
    // minutos enteros — miles de excepciones seguidas, suficientes
    // para dejar el partido dando la sensación de estar completamente
    // congelado en pantalla aunque el resultado final se calculara
    // bien por su cuenta, exactamente el síntoma reportado.
    let receptorPaseIdx=-1;
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
    // Cuenta cuántas disputas de balón seguidas han ocurrido sin que
    // nadie se haga con el control claro — un forcejeo real no dura
    // eternamente, así que a partir de la segunda disputa consecutiva
    // (unos 3 segundos) se fuerza una resolución definitiva basada en
    // la técnica de los implicados, en vez de dejar que el azar siga
    // alargando el forcejeo indefinidamente.
    let disputasConsecutivas=0;
    const FRASES_PASE=[t('lm.visor_construye'), t('lm.visor_avanza')];
    let descansoMostrado=false;
    let partidoDetenido=false; // se activa al pulsar "terminar y mostrar resultados"
    let partidoTerminado=false; // el partido llegó a su fin, ya sea jugado entero o forzado
    // Mientras se decide el Giro Táctico (oferta de 5s + hasta 10s del
    // selector de cartas), el partido está deliberadamente pausado —
    // sin esta marca, el vigilante anti-cuelgue de más abajo (que
    // reactiva el partido si pasan 15s sin que tick() avance) lo
    // interpretaba como un cuelgue real y forzaba tick() a mitad de
    // la decisión, corrompiendo el estado justo entre la primera y la
    // segunda parte — por eso el Giro Táctico en modo manager ni se
    // quedaba pausado de verdad ni llegaba a completarse limpiamente.
    let pausadoPorGiroTactico=false;

    function tick(){
      try{
        tickInner();
      }catch(err){
        // Red de seguridad definitiva: si CUALQUIER error inesperado
        // ocurriera aquí dentro (no solo los que ya se han encontrado
        // y arreglado), antes se perdía TODO el bucle del partido sin
        // ningún aviso — el reloj y el partido se quedaban colgados
        // para siempre. Ahora se registra el error en la consola (para
        // poder diagnosticarlo si se repite) y el partido se recupera
        // solo con un reinicio seguro tipo saque de centro, en vez de
        // quedarse roto sin ninguna forma de continuar.
        console.error('[Liga Manager] Error inesperado en tick(), recuperando con saque de centro:', err);
        try{
          moverBalon(centroCampo.x, centroCampo.y, 500);
          avanzarTiempo(900);
          setTimeout(tick, real(900));
        }catch(errRecuperacion){
          console.error('[Liga Manager] Fallo también en la recuperación de emergencia:', errRecuperacion);
        }
      }
    }
    function tickInner(){
      ultimoTickReal = performance.now();
      if(partidoDetenido) return; // el jugador ha forzado el final — no se programa nada más
      // Descanso: al cruzar la mitad del partido, se pausa un
      // instante con el aviso de "FIN DE LA PRIMERA PARTE" en grande.
      if(!descansoMostrado && tiempoTranscurrido>=DURACION_TOTAL/2){
        descansoMostrado=true;
        mostrarTextoGrande(t('lm.visor_descanso'), real(2400));
        infoBar.textContent=t('lm.visor_descanso');
        if(typeof window.playSound==='function') window.playSound('whistle');
        // Segunda parte: cambio de campo, reorganización y saque —
        // extraído a una función aparte porque, si toca ofrecer el
        // Giro Táctico (deps.giro), esta parte debe esperar a que el
        // jugador decida (aceptar/cancelar/agotar el tiempo) antes de
        // reanudarse, en vez de arrancar la segunda parte al mismo
        // tiempo que el popup de oferta.
        function continuarSegundaParte(){
          // Se reactiva el vigilante anti-cuelgue — la pausa
          // deliberada por el Giro Táctico (si la hubo) ya ha
          // terminado, sea cual sea el motivo (aceptado, cancelado o
          // agotado el tiempo). Es IMPRESCINDIBLE refrescar también
          // ultimoTickReal aquí: si no, el vigilante ve que ha pasado
          // toda la duración de la pausa (10-15s o más) desde el
          // último tick() real, y dispara un tick() extra e
          // inmediato justo en el mismo instante en que esta función
          // ya está reanudando el partido por su cuenta — dos
          // caminos de código chocando a la vez, exactamente lo que
          // hacía que el Giro Táctico pareciera "no pausar ni
          // completarse" en modo manager.
          pausadoPorGiroTactico=false;
          ultimoTickReal=performance.now();
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
          //
          // El partido queda bloqueado hasta que TODOS los 22
          // jugadores confirmen haber llegado de verdad a su sitio
          // (reorganizarYEsperar, no un tiempo fijo calculado a ojo) —
          // solo entonces se mueve el balón y se reanuda el saque.
          bloqueoReformacionHasta=performance.now()+real(2500);
          posesionMia=!posesionMia;
          idxConBalonMio=primerMedioCentro(rolesMios);
          idxConBalonRival=primerMedioCentro(rolesRival);
          pasesJugadaActual=0; historialMio=[]; historialRival=[];
          reorganizarYEsperar(450, ()=>{
            const equipoSaca2P = posesionMia?posMia:posRival;
            const idxSaca2P = posesionMia?idxConBalonMio:idxConBalonRival;
            moverBalon(equipoSaca2P[idxSaca2P].x, equipoSaca2P[idxSaca2P].y, 400);
            setTimeout(()=>sacarDeCentro(posesionMia, idxSaca2P), real(500));
          });
        }
        // Oferta de Giro Táctico — solo si vamos perdiendo al descanso
        // y quedan usos disponibles esta media temporada. Pausa aquí
        // mismo (no se llama a continuarSegundaParte todavía) hasta que
        // el jugador decida o se agote el tiempo de la oferta.
        // Lectura de Partido: con esta habilidad, la oferta también
        // aparece si se llega empatado al descanso, no solo perdiendo.
        // Ahora, por defecto, la oferta aparece si vas perdiendo O
        // empatado al descanso — antes el empate solo contaba con la
        // habilidad Lectura de Partido activa. Esa habilidad ahora va
        // un paso más allá: con ella activa, la oferta llega incluso
        // ganando por la mínima (un solo gol), para proteger una
        // ventaja corta en vez de solo remontar.
        const vaMalAlDescansoM = (typeof window.lmSkillActiva==='function' && window.lmSkillActiva('lm_lectura_partido'))
          ? marcadorMio<=marcadorRival+1
          : marcadorMio<=marcadorRival;
        // Diagnóstico SIEMPRE visible al llegar al descanso (no solo
        // cuando algo falla) — así, si el Giro Táctico no aparece, se
        // puede ver en la consola (F12) exactamente cuál de las tres
        // condiciones no se cumplió, en vez de tener que adivinarlo.
        console.log('[Liga Manager] Descanso alcanzado — comprobación Giro Táctico:', {
          marcadorMio, marcadorRival, vaMalAlDescansoM,
          usosRestantes: state.giroTacticoUsosRestantes,
          LMGiroTacticoCargado: typeof window.LMGiroTactico==='object'
        });
        // Aviso EN LA PROPIA INTERFAZ del partido (justo debajo del
        // clima) — no en un toast que podría no verse ni depender de
        // herramientas de desarrollador. Queda fijo en pantalla hasta
        // que el partido continúa, para confirmar sin ninguna duda si
        // este archivo actualizado está realmente cargado o no.
        const giroDebugEl=overlay.querySelector('#lmVisorGiroDebug');
        if(giroDebugEl){
          giroDebugEl.textContent = '🔄 GIRO TÁCTICO — '+(typeof window.LMGiroTactico==='object'?'archivo cargado ✔':'ARCHIVO NO CARGADO ✘')+' · marcador '+marcadorMio+'-'+marcadorRival+' · usos:'+(state.giroTacticoUsosRestantes!==undefined?state.giroTacticoUsosRestantes:'?')+' · debería ofrecerse: '+(vaMalAlDescansoM?'SÍ':'NO');
          giroDebugEl.style.display='block';
        }
        if(typeof window.LMGiroTactico!=='object'){
          console.error('[Liga Manager] Giro Táctico no disponible: liga-manager-giro-tactico.js no se ha cargado (revisa que el archivo y el <script> en index.html estén subidos al servidor).');
        }
        if(typeof window.LMGiroTactico==='object' && vaMalAlDescansoM && (state.giroTacticoUsosRestantes||0)>0){
          pausadoPorGiroTactico=true;
          finalizarTodasLasAnimacionesEnCurso();
          window.LMGiroTactico.ofrecerSiProcede({
            contenedor: document.getElementById('ligaManagerScreen'),
            t, usosRestantes: state.giroTacticoUsosRestantes,
            misStats: Object.assign({}, misStatsReales), rivalStats:{attack:rival.attack,defense:rival.defense,pace:rival.pace,passing:rival.passing,technique:rival.technique},
            rivalTeamObj: rival, esMiEquipoLocal: miEsLocal, miNombre, rivalNombre,
            manoDuraActiva: typeof window.lmSkillActiva==='function' && window.lmSkillActiva('lm_mano_dura'),
            golesMiosPrimeraParte: marcadorMio, golesRivalPrimeraParte: marcadorRival,
            elegirGoleador, jugadorRivalAleatorio, elegirJugadorAlineado,
            onConsumirUso: ()=>{
              state.giroTacticoUsosRestantes=Math.max(0,(state.giroTacticoUsosRestantes||0)-1);
              if(typeof window.unlockLMAchievement==='function') window.unlockLMAchievement('lm_giro_primera_vez', false);
              if(state.giroTacticoUsosRestantes<=0 && typeof window.unlockLMAchievement==='function') window.unlockLMAchievement('lm_giro_agotado', false);
              guardarEstado();
            },
            onResultadoFinal: (golesMios2P, golesRival2P, nuevosEventos2P)=>{
              // Reconciliar el total de goles de temporada de MIS
              // jugadores: se restan los goles que iban a marcar en la
              // segunda parte original (ya no ocurren) y se suman los
              // de la segunda parte recién generada. La racha
              // (p.racha) y el resto de efectos que ya se aplicaron
              // antes de abrir el visor (nómina, logros, lesión de
              // este partido si la hay) se dejan tal cual estaban —
              // deshacerlos seria un cambio muy delicado que toca
              // demasiados sistemas para lo que aporta.
              const miLadoEv = miEsLocal ? 'home' : 'away';
              eventosGol.filter(e=>e.minute>45 && e.team===miLadoEv && e.jugador && e.jugador.id).forEach(e=>{
                const p=(state.plantilla||[]).find(x=>x.id===e.jugador.id);
                if(p && p.golesTemporada) p.golesTemporada=Math.max(0,p.golesTemporada-1);
              });
              nuevosEventos2P.filter(e=>e.type==='goal' && e.team===miLadoEv && e.jugador && e.jugador.id).forEach(e=>{
                const p=(state.plantilla||[]).find(x=>x.id===e.jugador.id);
                if(p) p.golesTemporada=(p.golesTemporada||0)+1;
              });
              // Se sustituyen SOLO los eventos de la segunda parte
              // (minuto>45) por los recién generados, conservando los
              // de la primera parte tal cual ya se jugaron. Las
              // lesiones (eventosLesionVisor) nunca se tocan.
              eventosGol = eventosGol.filter(e=>e.minute<=45).concat(nuevosEventos2P.filter(e=>e.type==='goal')).sort((a,b)=>a.minute-b.minute);
              eventosTarjeta = eventosTarjeta.filter(e=>e.minute<=45).concat(nuevosEventos2P.filter(e=>e.type==='card').map(e=>({...e, tMostrar:(e.minute/90)*DURACION_TOTAL, mostrado:false}))).sort((a,b)=>a.minute-b.minute);
              recalcularPlanGoles();
              // Marcador y resultado final actualizados — tanto la
              // cabecera visible del partido como lo que se guarda en
              // el calendario de la liga deben reflejar el nuevo
              // resultado a partir de ahora.
              const nuevoGolesA = miEsLocal ? (marcadorMio+golesMios2P) : (marcadorRival+golesRival2P);
              const nuevoGolesB = miEsLocal ? (marcadorRival+golesRival2P) : (marcadorMio+golesMios2P);
              info.resultado.golesA=nuevoGolesA; info.resultado.golesB=nuevoGolesB;
              if(info.jornadaIndex!==undefined){
                const key=info.jornadaIndex+'-'+info.home.id+'-'+info.away.id;
                if(state.resultados[key]) state.resultados[key]={...state.resultados[key], golesA:nuevoGolesA, golesB:nuevoGolesB};
              }
              // Remontada de verdad gracias al Giro Táctico: se iba
              // perdiendo al descanso y el resultado final ya es una
              // victoria. state.giroRemontadasTotales es un contador
              // persistente de toda la partida (no de la temporada),
              // para el logro mítico de "3 remontadas distintas".
              const misGolesFinales = miEsLocal ? nuevoGolesA : nuevoGolesB;
              const rivalGolesFinales = miEsLocal ? nuevoGolesB : nuevoGolesA;
              if(misGolesFinales>rivalGolesFinales && typeof window.unlockLMAchievement==='function'){
                window.unlockLMAchievement('lm_giro_remontada', false);
                state.giroRemontadasTotales=(state.giroRemontadasTotales||0)+1;
                if(state.giroRemontadasTotales>=3) window.unlockLMAchievement('lm_giro_leyenda', false);
              }
              guardarEstado();
              continuarSegundaParte();
            },
            onCancelado: continuarSegundaParte
          });
          return;
        }
        continuarSegundaParte();
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
        const posAlertaFalta={x:parseFloat(balon.getAttribute('cx')), y:parseFloat(balon.getAttribute('cy'))};
        mostrarAlertaFalta(posAlertaFalta.x, posAlertaFalta.y);
        if(typeof window.playSound==='function') window.playSound('whistle_short');
        avanzarTiempo(1300);
        setTimeout(tick, real(1300));
        return;
      }
      // Lesión real de este partido, si toca ya — mismo patrón que la
      // tarjeta: se muestra un instante sin pausar la simulación.
      // Antes las lesiones solo aparecían en el resumen final, sin
      // ningún momento visible durante el partido en sí.
      const lesionAhora = eventosLesionVisor.find(e=>!e.mostrado && tiempoTranscurrido>=e.tMostrar);
      if(lesionAhora){
        lesionAhora.mostrado=true;
        const esMiaLesion = lesionAhora.team===miLado;
        const nombreJLesion = lesionAhora.jugador ? lesionAhora.jugador.name : '';
        infoBar.textContent=`✚ ${nombreJLesion} se duele en el suelo (${esMiaLesion?miNombre:rivalNombre})`;
        const posAlertaLesion={x:parseFloat(balon.getAttribute('cx')), y:parseFloat(balon.getAttribute('cy'))};
        mostrarAlertaLesion(posAlertaLesion.x, posAlertaLesion.y);
        avanzarTiempo(1300);
        setTimeout(tick, real(1300));
        return;
      }
      if(golIdx<planGoles.length && tiempoTranscurrido>=planGoles[golIdx]-200){
        const evento=eventosGol[golIdx];
        const esMio = evento.team===miLado;
        // Si el equipo que tiene el balón AHORA MISMO en la simulación
        // visual no es el que le toca marcar, primero se muestra una
        // recuperación real de balón (una entrada/intercepción, igual
        // que en el juego normal) antes de construir la jugada de gol
        // — sin esto, el balón "saltaba" de golpe de un equipo a otro
        // sin ninguna jugada visible de por medio, dando la sensación
        // de que el pase lo daba el equipo contrario, o de un balón
        // que aparece imantado en los pies de otro jugador.
        if(posesionMia!==esMio){
          const equipoRecupera = esMio?posMia:posRival;
          const nombreRecupera = esMio?miNombre:rivalNombre;
          const balonPosAntes={x:parseFloat(balon.getAttribute('cx')), y:parseFloat(balon.getAttribute('cy'))};
          const recuperadorIdx = jugadorMasCercano(equipoRecupera, balonPosAntes.x, balonPosAntes.y, 0);
          // Para que "recuperar el balón" signifique de verdad estar AL
          // LADO del balón (nunca robarlo a distancia), se comprueba lo
          // lejos que está de verdad el jugador más cercano del equipo
          // que va a recuperarlo. Si ya está cerca, se resuelve directo
          // (igual que antes). Si está lejos, primero CORRE de verdad
          // hasta la posición del balón — el balón no se mueve hasta que
          // el jugador ha llegado, en vez de teletransportarse a sus pies.
          const distRecuperador = Math.hypot(equipoRecupera[recuperadorIdx].x-balonPosAntes.x, equipoRecupera[recuperadorIdx].y-balonPosAntes.y);
          const UMBRAL_RECUPERACION_CERCA = 14; // misma idea que la presión normal en juego abierto (9.5), algo más generosa porque aquí la recuperación siempre tiene que resolverse a favor de quien va a marcar
          const completarRecuperacion=(esperaExtra)=>{
            posesionMia=esMio;
            if(esMio) idxConBalonMio=recuperadorIdx; else idxConBalonRival=recuperadorIdx;
            pasesJugadaActual=0; historialMio=[]; historialRival=[];
            actualizarFormacionDinamica(posesionMia, undefined, undefined, balonPosAntes);
            setTimeout(()=>{
              avanzarTiempo(550+esperaExtra);
              tick();
            }, real(550));
          };
          if(distRecuperador<=UMBRAL_RECUPERACION_CERCA){
            moverBalon(equipoRecupera[recuperadorIdx].x, equipoRecupera[recuperadorIdx].y, 550);
            infoBar.textContent=`${nombreRecupera} recupera el balón`;
            completarRecuperacion(0);
          } else {
            infoBar.textContent=`${nombreRecupera} presiona para recuperar el balón`;
            moverJugador(esMio, recuperadorIdx, balonPosAntes.x, balonPosAntes.y, 700);
            setTimeout(()=>{
              infoBar.textContent=`${nombreRecupera} recupera el balón`;
              completarRecuperacion(150);
            }, real(700));
          }
          return;
        }
        golIdx++;
        const balonPos0={x:parseFloat(balon.getAttribute('cx')), y:parseFloat(balon.getAttribute('cy'))};
        const equipoAnotaPos = esMio?posMia:posRival;
        const objetivoGol = esMio ? rivalGolXY : miGolXY;
        // Jugador que tiene el balón justo antes de esta jugada de gol —
        // variable propia de este bloque (nunca la `const idxConBalon`
        // de más abajo, que aún no se ha inicializado en este punto de
        // la función: usarla aquí lanzaba un ReferenceError de zona
        // muerta temporal en CADA gol, capturado en silencio por el
        // try/catch de tick() y "recuperado" con un reinicio al centro
        // — por eso nunca se veía ningún gol en directo aunque el
        // resultado final sí los contara todos correctamente).
        const idxConBalonGol = esMio ? idxConBalonMio : idxConBalonRival;
        // Roles y equipo defensor del gol — declarados aquí, a nivel de
        // todo el bloque de gol (antes vivían SOLO dentro del if de
        // "distAlGolYa>distanciaCerca", como const de bloque), porque
        // lanzarJugadaDeGol() y su corregirFueraJuego() interno los usan
        // SIEMPRE, sea cual sea el camino que lleve hasta ellos —
        // incluida la llamada directa (cuando el balón ya está cerca) y
        // la llamada retrasada dentro de un setTimeout tras los pases de
        // construcción. Al estar fuera de su scope, cada intento de
        // marcar lanzaba un ReferenceError: en la llamada directa
        // (síncrona) el try/catch de tick() lo capturaba en silencio,
        // así que el gol nunca se veía; en la llamada retrasada (dentro
        // de un setTimeout, fuera de ese try/catch) el error quedaba
        // TOTALMENTE sin capturar y detenía el partido entero para
        // siempre — el jugador se quedaba congelado donde estuviera y
        // el reloj dejaba de avanzar, exactamente el síntoma reportado.
        const rolesAtaca2 = esMio?rolesMios:rolesRival;
        const equipoDefiendeGol = esMio?posRival:posMia;
        // El gol SIEMPRE debe salir desde cerca del área rival, nunca
        // desde donde estuviera el balón por casualidad al llegar el
        // minuto programado (a veces medio campo, o incluso más
        // atrás) — si el balón no está ya cerca, primero se acerca un
        // delantero real + el balón a una posición de remate creíble,
        // y SOLO ENTONCES se dispara a portería.
        const distAlGolYa = Math.hypot(balonPos0.x-objetivoGol.x, balonPos0.y-objetivoGol.y);
        const distanciaCerca = Math.hypot(ANCHO,ALTO)*0.07; // ~7% de la diagonal del campo — de verdad cerca del área, no una zona amplia
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
            mostrarExplosionGol(objetivoGol.x, objetivoGol.y);
            mostrarAlertaGolCelebracion(objetivoGol.x, objetivoGol.y);
            if(typeof window.playSound==='function') window.playSound('goal');
            setTimeout(()=>{
              // Reorganización real tras el gol: todos los jugadores
              // vuelven a su posición de formación de saque, igual que
              // al empezar el partido o la segunda parte — antes solo
              // se movía el balón al centro, y los 22 jugadores se
              // quedaban donde estuvieran en el momento del gol.
              //
              // El partido queda bloqueado hasta que TODOS los 22
              // jugadores confirmen haber llegado de verdad a su sitio
              // (reorganizarYEsperar, no un tiempo fijo calculado a
              // ojo) — solo entonces se reanuda el saque.
              bloqueoReformacionHasta=performance.now()+real(2500);
              posesionMia=!esMio; avanzarTiempo(2750+esperaExtra); pasesJugadaActual=0; historialMio=[]; historialRival=[];
              idxConBalonMio=primerMedioCentro(rolesMios);
              idxConBalonRival=primerMedioCentro(rolesRival);
              reorganizarYEsperar(450, ()=>{
                const equipoSacaGol = posesionMia?posMia:posRival;
                const idxSacaGol = posesionMia?idxConBalonMio:idxConBalonRival;
                moverBalon(equipoSacaGol[idxSacaGol].x, equipoSacaGol[idxSacaGol].y, 400);
                setTimeout(()=>sacarDeCentro(posesionMia, idxSacaGol), real(450));
              });
            }, real(1300));
          }, real(duracionVueloGol+120));
        }
        if(distAlGolYa>distanciaCerca){
          // Construcción gradual real: si el balón está todavía lejos
          // de la portería rival (en el propio campo o en el centro),
          // antes de repartir entre los 5 tipos de jugada de remate se
          // juegan 2-3 pases cortos de construcción de verdad,
          // avanzando progresivamente por el centro del campo — antes
          // el balón podía saltar directamente desde el propio campo
          // hasta cerca del área rival en un único pase larguísimo,
          // algo que casi nunca pasa en un partido real. Un equipo de
          // verdad hace circular el balón hasta ganar terreno, no
          // lanza balonazos de 60 metros en cada jugada de gol.
          const profundidadActual = esEscritorio
            ? (esMio ? balonPos0.x/ANCHO : 1-balonPos0.x/ANCHO)
            : (esMio ? 1-balonPos0.y/ALTO : balonPos0.y/ALTO);
          if(profundidadActual<0.55){
            const numPasesConstruccion = profundidadActual<0.3 ? 3 : 2;
            let jugadorAnteriorIdx = idxConBalonGol;
            let posActualConstruccion = {x:balonPos0.x, y:balonPos0.y};
            let retrasoAcumulado = 0;
            for(let pc=1; pc<=numPasesConstruccion; pc++){
              const objetivoProgreso = pc/(numPasesConstruccion+1); // avanza gradualmente, sin llegar aún al remate
              const puntoConstruccion = {
                x: balonPos0.x+(objetivoGol.x-balonPos0.x)*objetivoProgreso*0.75+(Math.random()-0.5)*10,
                y: balonPos0.y+(objetivoGol.y-balonPos0.y)*objetivoProgreso*0.75+(Math.random()-0.5)*10
              };
              let jugadorConstruccionIdx = jugadorMasCercano(equipoAnotaPos, puntoConstruccion.x, puntoConstruccion.y, jugadorAnteriorIdx);
              const duracionPaseConstruccion = 550+Math.random()*200;
              retrasoAcumulado += (pc===1?0:duracionPaseConstruccion);
              const jaCapturado=jugadorAnteriorIdx, jcCapturado=jugadorConstruccionIdx, pcCapturado={...posActualConstruccion};
              setTimeout(()=>{
                actualizarFormacionDinamica(esMio, esMio?jaCapturado:undefined, esMio?undefined:jaCapturado, pcCapturado,
                  esMio?jcCapturado:undefined, esMio?undefined:jcCapturado);
                moverJugador(esMio, jcCapturado, puntoConstruccion.x, puntoConstruccion.y, duracionPaseConstruccion);
                moverBalon(puntoConstruccion.x, puntoConstruccion.y, duracionPaseConstruccion);
                infoBar.textContent=`${esMio?miNombre:rivalNombre} hace circular el balón`;
              }, real(retrasoAcumulado));
              jugadorAnteriorIdx = jugadorConstruccionIdx;
              posActualConstruccion = puntoConstruccion;
            }
            retrasoAcumulado += 550;
            setTimeout(()=>{
              if(esMio) idxConBalonMio=jugadorAnteriorIdx; else idxConBalonRival=jugadorAnteriorIdx;
              lanzarJugadaDeGol(posActualConstruccion, jugadorAnteriorIdx);
            }, real(retrasoAcumulado));
            return;
          }
          lanzarJugadaDeGol(balonPos0, idxConBalonGol);
          return;
        }
        function lanzarJugadaDeGol(balonPos0, idxConBalon){
          // Comprueba y corrige el fuera de juego de una posición de
          // remate concreta, retrasándola hasta la línea del último
          // defensa si hiciera falta — se reutiliza en TODOS los tipos
          // de jugada, para que ninguno pueda producir un remate
          // adelantado, sea cual sea el camino que tome la jugada.
          function corregirFueraJuego(pos){
            const ultimoDefensorGol = equipoDefiendeGol.reduce((max,rv,ri)=>{
              if(ri===0) return max;
              const prof = esEscritorio ? (esMio?rv.x:ANCHO-rv.x) : (esMio?ALTO-rv.y:rv.y);
              return Math.max(max, prof);
            }, -Infinity);
            const prof = esEscritorio ? (esMio?pos.x:ANCHO-pos.x) : (esMio?ALTO-pos.y:pos.y);
            if(prof>ultimoDefensorGol-2){
              const profCorregida=ultimoDefensorGol-2;
              const posCorregida = esEscritorio
                ? {x: esMio?profCorregida:ANCHO-profCorregida, y:pos.y}
                : {x:pos.x, y: esMio?ALTO-profCorregida:profCorregida};
              // Se avisa de verdad cuando la corrección es apreciable
              // (no un simple redondeo de medio metro) — la jugada
              // estuvo a punto de anularse por fuera de juego, y el
              // jugador se frena justo a tiempo en la línea legal.
              if(Math.abs(prof-profCorregida)>1.5) mostrarAlertaFueraDeJuego(posCorregida.x, posCorregida.y);
              return posCorregida;
            }
            return pos;
          }
          // Variedad real de jugadas de gol: antes SIEMPRE era la misma
          // secuencia (un delantero corre, recibe, dispara) — ahora se
          // elige al azar entre 5 tipos de jugada distintos, cada uno
          // con su propia lógica y su propio texto, para que dos goles
          // seguidos no se vean nunca calcados el uno del otro.
          const tipoJugada = Math.floor(Math.random()*5);

          if(tipoJugada===0){
            // 1) Carrera individual: un delantero se desmarca y recibe
            // directamente cerca del área.
            let delanteroIdx = rolesAtaca2.findIndex(r=>r==='fwd');
            if(delanteroIdx<0) delanteroIdx = jugadorMasCercano(equipoAnotaPos, objetivoGol.x, objetivoGol.y, 0);
            const posRemate = corregirFueraJuego({ x: objetivoGol.x + (objetivoGol.x<CENTRO_X?12:-12), y: objetivoGol.y + (Math.random()-0.5)*14 });
            actualizarFormacionDinamica(esMio, esMio?idxConBalonMio:undefined, esMio?undefined:idxConBalonRival, balonPos0,
              esMio?delanteroIdx:undefined, esMio?undefined:delanteroIdx);
            moverJugador(esMio, delanteroIdx, posRemate.x, posRemate.y, 900);
            setTimeout(()=>{
              moverBalon(posRemate.x, posRemate.y, 650);
              infoBar.textContent=`${esMio?miNombre:rivalNombre} se escapa y llega con peligro al área`;
              setTimeout(()=>dispararAGol(posRemate.x, posRemate.y, 900+650), real(650));
            }, real(900));
            return;
          }

          if(tipoJugada===1){
            // 2) Pase al hueco: un mediocentro lanza un pase filtrado a
            // la carrera del delantero, que llega a rematar de primeras.
            let medioIdx = rolesAtaca2.findIndex(r=>r==='mid');
            if(medioIdx<0) medioIdx = jugadorMasCercano(equipoAnotaPos, balonPos0.x, balonPos0.y, 0);
            let delanteroIdx = rolesAtaca2.findIndex((r,ri)=>r==='fwd' && ri!==medioIdx);
            if(delanteroIdx<0) delanteroIdx = jugadorMasCercano(equipoAnotaPos, objetivoGol.x, objetivoGol.y, medioIdx);
            const posRemate = corregirFueraJuego({ x: objetivoGol.x + (objetivoGol.x<CENTRO_X?9:-9), y: objetivoGol.y + (Math.random()-0.5)*18 });
            infoBar.textContent=`${esMio?miNombre:rivalNombre} busca el pase al hueco`;
            actualizarFormacionDinamica(esMio, esMio?idxConBalonMio:undefined, esMio?undefined:idxConBalonRival, balonPos0,
              esMio?delanteroIdx:undefined, esMio?undefined:delanteroIdx);
            moverJugador(esMio, delanteroIdx, posRemate.x, posRemate.y, 750);
            setTimeout(()=>{
              moverBalon(posRemate.x, posRemate.y, 550);
              infoBar.textContent=`¡Pase filtrado! ${esMio?miNombre:rivalNombre} se planta solo`;
              setTimeout(()=>dispararAGol(posRemate.x, posRemate.y, 750+550), real(550));
            }, real(750));
            return;
          }

          if(tipoJugada===2){
            // 3) Centro desde banda: el balón se abre a una zona ancha
            // antes de centrar al área, donde espera un rematador.
            const bandaY = esEscritorio ? (Math.random()<0.5?8:ALTO-8) : balonPos0.y;
            const bandaX = esEscritorio ? balonPos0.x : (Math.random()<0.5?8:ANCHO-8);
            const puntoBanda={x:bandaX, y:bandaY};
            let extremoIdx = jugadorMasCercano(equipoAnotaPos, puntoBanda.x, puntoBanda.y, 0);
            const posRemate = corregirFueraJuego({ x: objetivoGol.x + (objetivoGol.x<CENTRO_X?10:-10), y: objetivoGol.y + (Math.random()-0.5)*10 });
            let rematadorIdx = rolesAtaca2.findIndex((r,ri)=>r==='fwd' && ri!==extremoIdx);
            if(rematadorIdx<0) rematadorIdx = jugadorMasCercano(equipoAnotaPos, posRemate.x, posRemate.y, extremoIdx);
            infoBar.textContent=`${esMio?miNombre:rivalNombre} se abre hacia la banda`;
            moverJugador(esMio, extremoIdx, puntoBanda.x, puntoBanda.y, 700);
            setTimeout(()=>{
              moverBalon(puntoBanda.x, puntoBanda.y, 500);
              setTimeout(()=>{
                actualizarFormacionDinamica(esMio, esMio?extremoIdx:undefined, esMio?undefined:extremoIdx, puntoBanda,
                  esMio?rematadorIdx:undefined, esMio?undefined:rematadorIdx);
                moverJugador(esMio, rematadorIdx, posRemate.x, posRemate.y, 650);
                infoBar.textContent=`${esMio?miNombre:rivalNombre} centra desde la banda`;
                setTimeout(()=>{
                  moverBalon(posRemate.x, posRemate.y, 480);
                  setTimeout(()=>dispararAGol(posRemate.x, posRemate.y, 700+500+650+480), real(480));
                }, real(650));
              }, real(500));
            }, real(700));
            return;
          }

          if(tipoJugada===3){
            // 4) Contraataque rápido: 2 pases seguidos avanzando por el
            // centro del campo antes de llegar al área.
            let medioIdx = rolesAtaca2.findIndex(r=>r==='mid');
            if(medioIdx<0) medioIdx = jugadorMasCercano(equipoAnotaPos, balonPos0.x, balonPos0.y, 0);
            const puntoIntermedio = { x: balonPos0.x+(objetivoGol.x-balonPos0.x)*0.55, y: balonPos0.y+(objetivoGol.y-balonPos0.y)*0.55 };
            let delanteroIdx = rolesAtaca2.findIndex((r,ri)=>r==='fwd' && ri!==medioIdx);
            if(delanteroIdx<0) delanteroIdx = jugadorMasCercano(equipoAnotaPos, objetivoGol.x, objetivoGol.y, medioIdx);
            const posRemate = corregirFueraJuego({ x: objetivoGol.x + (objetivoGol.x<CENTRO_X?11:-11), y: objetivoGol.y + (Math.random()-0.5)*16 });
            infoBar.textContent=`¡Contraataque de ${esMio?miNombre:rivalNombre}!`;
            moverJugador(esMio, medioIdx, puntoIntermedio.x, puntoIntermedio.y, 600);
            setTimeout(()=>{
              moverBalon(puntoIntermedio.x, puntoIntermedio.y, 450);
              setTimeout(()=>{
                actualizarFormacionDinamica(esMio, esMio?medioIdx:undefined, esMio?undefined:medioIdx, puntoIntermedio,
                  esMio?delanteroIdx:undefined, esMio?undefined:delanteroIdx);
                moverJugador(esMio, delanteroIdx, posRemate.x, posRemate.y, 650);
                infoBar.textContent=`${esMio?miNombre:rivalNombre} tira del contraataque`;
                setTimeout(()=>{
                  moverBalon(posRemate.x, posRemate.y, 480);
                  setTimeout(()=>dispararAGol(posRemate.x, posRemate.y, 600+450+650+480), real(480));
                }, real(650));
              }, real(450));
            }, real(600));
            return;
          }

          // 5) Rechace / segunda jugada: un primer remate se topa con un
          // rechace, y un segundo jugador llega para empujarla dentro.
          let rematador1Idx = rolesAtaca2.findIndex(r=>r==='fwd');
          if(rematador1Idx<0) rematador1Idx = jugadorMasCercano(equipoAnotaPos, objetivoGol.x, objetivoGol.y, 0);
          const posRemate1 = corregirFueraJuego({ x: objetivoGol.x + (objetivoGol.x<CENTRO_X?15:-15), y: objetivoGol.y + (Math.random()-0.5)*12 });
          let rematador2Idx = rolesAtaca2.findIndex((r,ri)=>ri!==rematador1Idx && (r==='fwd'||r==='mid'));
          if(rematador2Idx<0) rematador2Idx = jugadorMasCercano(equipoAnotaPos, posRemate1.x, posRemate1.y, rematador1Idx);
          const posRemate2 = corregirFueraJuego({ x: posRemate1.x + (posRemate1.x<CENTRO_X?6:-6), y: posRemate1.y + (Math.random()-0.5)*10 });
          actualizarFormacionDinamica(esMio, esMio?idxConBalonMio:undefined, esMio?undefined:idxConBalonRival, balonPos0,
            esMio?rematador1Idx:undefined, esMio?undefined:rematador1Idx);
          moverJugador(esMio, rematador1Idx, posRemate1.x, posRemate1.y, 850);
          moverJugador(esMio, rematador2Idx, posRemate2.x, posRemate2.y, 950);
          setTimeout(()=>{
            moverBalon(posRemate1.x, posRemate1.y, 600);
            infoBar.textContent=`${esMio?miNombre:rivalNombre} remata... ¡y el rechace queda suelto en el área!`;
            setTimeout(()=>{
              moverBalon(posRemate2.x, posRemate2.y, 380);
              setTimeout(()=>dispararAGol(posRemate2.x, posRemate2.y, 850+600+380), real(380));
            }, real(600));
          }, real(850));
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
      // Despeje de emergencia: un jugador muy presionado cerca de su
      // propia área, o que se encuentra en clara inferioridad numérica
      // (más rivales que compañeros cerca), no siempre intenta un pase
      // calculado y preciso — a veces simplemente se quita el balón de
      // encima con un pelotazo hacia el campo contrario, como haría
      // cualquier jugador real bajo esa presión, no solo un central.
      // El balón sale largo y sin destino calculado, y cualquiera de
      // los dos equipos puede quedarse con él después.
      const companerosCercaDespeje = equipoAtaca.filter((p2,i2)=>i2!==idxConBalon && i2!==0 && Math.hypot(p2.x-posActual.x,p2.y-posActual.y)<16).length;
      const rivalesCercaDespeje = equipoDefiende.filter(rv=>Math.hypot(rv.x-posActual.x,rv.y-posActual.y)<16).length;
      const superioridadRivalDespeje = rivalesCercaDespeje>=companerosCercaDespeje+2 && rivalesCercaDespeje>=2;
      const muyCercaPropiaArea = zona>0.85 && distRival<10;
      if((muyCercaPropiaArea || (superioridadRivalDespeje && zona>0.6)) && Math.random()<0.3){
        const anguloDespeje=(Math.random()-0.5)*1.2;
        const dirX=(golObjetivo.x-posActual.x), dirY=(golObjetivo.y-posActual.y);
        const dirLen=Math.hypot(dirX,dirY)||1;
        const rotX=dirX/dirLen*Math.cos(anguloDespeje)-dirY/dirLen*Math.sin(anguloDespeje);
        const rotY=dirX/dirLen*Math.sin(anguloDespeje)+dirY/dirLen*Math.cos(anguloDespeje);
        const alcance=28+Math.random()*16;
        // Coordenada SIN recortar, para saber de verdad si el despeje
        // se iría fuera por la banda — antes siempre se recortaba a la
        // fuerza para quedarse dentro del campo, así que el balón
        // nunca salía de verdad por banda, algo que en un partido real
        // pasa constantemente (es de hecho la interrupción más
        // habitual, más que los córners).
        const destinoDespejeCrudo={x: posActual.x+rotX*alcance, y: posActual.y+rotY*alcance};
        const anchoCoord = esEscritorio ? destinoDespejeCrudo.y : destinoDespejeCrudo.x;
        const anchoLimite = esEscritorio ? ALTO : ANCHO;
        const seVaFuera = anchoCoord<-3 || anchoCoord>anchoLimite+3;
        if(seVaFuera){
          // Saque de banda real: posesión para el equipo que NO ha
          // sacado el balón, desde el punto de la línea de banda por
          // donde salió.
          const puntoBanda = esEscritorio
            ? {x: Math.max(4, Math.min(ANCHO-4, destinoDespejeCrudo.x)), y: anchoCoord<0?2:ALTO-2}
            : {x: anchoCoord<0?2:ANCHO-2, y: Math.max(4, Math.min(ALTO-4, destinoDespejeCrudo.y))};
          moverBalon(puntoBanda.x, puntoBanda.y, 500);
          infoBar.textContent=`${nombreAtaca} despeja y el balón sale por banda`;
          pasesJugadaActual=0; historialMio=[]; historialRival=[];
          actualizarFormacionDinamica(posesionMia, posesionMia?idxConBalon:undefined, posesionMia?undefined:idxConBalon, posActual);
          setTimeout(()=>{
            const equipoSaqueBanda = posesionMia?posRival:posMia; // saca el equipo contrario a quien despejó
            const idxSaqueBanda = jugadorMasCercano(equipoSaqueBanda, puntoBanda.x, puntoBanda.y, 0);
            posesionMia = !posesionMia;
            if(posesionMia) idxConBalonMio=idxSaqueBanda; else idxConBalonRival=idxSaqueBanda;
            moverJugador(posesionMia, idxSaqueBanda, puntoBanda.x, puntoBanda.y, 550);
            infoBar.textContent=`${t('lm.visor_saque_banda')||'Saque de banda'} (${posesionMia?miNombre:rivalNombre})`;
            mostrarAlertaSaqueBanda(puntoBanda.x, puntoBanda.y);
            avanzarTiempo(900);
            setTimeout(tick, real(650));
          }, real(500));
          return;
        }
        const destinoDespeje={
          x: Math.max(2, Math.min(ANCHO-2, destinoDespejeCrudo.x)),
          y: Math.max(2, Math.min(ALTO-2, destinoDespejeCrudo.y))
        };
        duracionEfectiva=Math.max(400, Math.min(1100, Math.hypot(destinoDespeje.x-posActual.x, destinoDespeje.y-posActual.y)*17));
        moverBalon(destinoDespeje.x, destinoDespeje.y, duracionEfectiva);
        infoBar.textContent=`${nombreAtaca} despeja el peligro`;
        mostrarAlertaDespeje(posActual.x, posActual.y);
        pasesJugadaActual=0; historialMio=[]; historialRival=[];
        actualizarFormacionDinamica(posesionMia, posesionMia?idxConBalon:undefined, posesionMia?undefined:idxConBalon, posActual);
        setTimeout(()=>{
          const dMioD=jugadorMasCercano(posMia, destinoDespeje.x, destinoDespeje.y, -1);
          const dRivalD=jugadorMasCercano(posRival, destinoDespeje.x, destinoDespeje.y, -1);
          const distMioD=Math.hypot(posMia[dMioD].x-destinoDespeje.x, posMia[dMioD].y-destinoDespeje.y);
          const distRivalD=Math.hypot(posRival[dRivalD].x-destinoDespeje.x, posRival[dRivalD].y-destinoDespeje.y);
          posesionMia = distMioD<=distRivalD;
          const distCorredorD = posesionMia?distMioD:distRivalD;
          const duracionCorredorD = Math.max(400, Math.min(1500, distCorredorD*26));
          if(posesionMia){ idxConBalonMio=dMioD; moverJugador(true, dMioD, destinoDespeje.x, destinoDespeje.y, duracionCorredorD); }
          else { idxConBalonRival=dRivalD; moverJugador(false, dRivalD, destinoDespeje.x, destinoDespeje.y, duracionCorredorD); }
          avanzarTiempo(duracionEfectiva+400);
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
      // (Reasignación de la variable compartida declarada más arriba,
      // fuera de tickInner — NUNCA un "let" nuevo aquí: eso crearía una
      // sombra local que dejaría a flujoContinuoInterval leyendo
      // siempre el valor inicial sin actualizar nunca.)
      receptorPaseIdx=-1;
      // Igual que con el receptor de un pase, el jugador que INTERCEPTA
      // el balón (entrada, presión) también debe quedarse quieto en el
      // sitio donde lo recibe — antes solo el receptor de un pase tenía
      // este blindaje, así que un jugador que ganaba el balón con una
      // entrada podía moverse a la vez que el balón viajaba hacia su
      // posición, y el balón acababa "cayendo" en un punto vacío que el
      // jugador ocupaba solo un instante después.
      let interceptorPendienteIdx=-1;

      const probBase = zona<0.35?0.26:0.18;
      const probPresion = probBase + Math.max(0,presionadores-1)*0.16; // +16pp por cada presionador extra
      if(distRival<9.5 && Math.random()<probPresion){
        // Presión de cerca: el rival se lleva el balón de verdad — más
        // probable en el último tercio, donde la defensa aprieta más,
        // y mucho más probable si hay varios rivales presionando juntos.
        // Disputa real: no siempre el balón va limpio al presionador —
        // en un porcentaje real de los casos queda SUELTO un instante
        // (rechace, disputa físca) y se lo puede llevar cualquiera de
        // los dos equipos, el que llegue antes — como una pelea de
        // balón de verdad, no una recuperación perfecta siempre.
        const esDisputaSuelta = disputasConsecutivas<2 && Math.random()<0.10;
        if(esDisputaSuelta){
          disputasConsecutivas++;
          const puntoDisputa={
            x: (posActual.x+equipoDefiende[rivalCercanoIdx].x)/2 + (Math.random()-0.5)*6,
            y: (posActual.y+equipoDefiende[rivalCercanoIdx].y)/2 + (Math.random()-0.5)*6
          };
          moverBalon(puntoDisputa.x, puntoDisputa.y, dur*0.45);
          infoBar.textContent=`Disputa de balón entre ${nombreAtaca} y ${nombreDefiende}`;
          mostrarAlertaDisputa(puntoDisputa.x, puntoDisputa.y);
          pasesJugadaActual=0; historialMio=[]; historialRival=[];
          actualizarFormacionDinamica(posesionMia, posesionMia?idxConBalon:undefined, posesionMia?undefined:idxConBalon, posActual);
          setTimeout(()=>{
            const dMioS=jugadorMasCercano(posMia, puntoDisputa.x, puntoDisputa.y, -1);
            const dRivalS=jugadorMasCercano(posRival, puntoDisputa.x, puntoDisputa.y, -1);
            const distMioS=Math.hypot(posMia[dMioS].x-puntoDisputa.x, posMia[dMioS].y-puntoDisputa.y);
            const distRivalS=Math.hypot(posRival[dRivalS].x-puntoDisputa.x, posRival[dRivalS].y-puntoDisputa.y);
            // Ventaja real por técnica: la disputa no se resuelve solo
            // por cercanía pura — el equipo con más técnica tiene una
            // ventaja real (no decisiva del todo) para llevarse el
            // balón suelto, como en un forcejeo real donde el control
            // del balón importa tanto como quién llega antes.
            const ventajaTecnicaMia = (misStatsReales.technique-rival.technique)*0.045;
            posesionMia = (distMioS-ventajaTecnicaMia) <= distRivalS;
            disputasConsecutivas=0; // se ha resuelto con claridad, la cuenta se reinicia para la próxima vez
            if(posesionMia){ idxConBalonMio=dMioS; moverJugador(true, dMioS, puntoDisputa.x, puntoDisputa.y, 420); }
            else { idxConBalonRival=dRivalS; moverJugador(false, dRivalS, puntoDisputa.x, puntoDisputa.y, 420); }
            avanzarTiempo(dur*0.45+400);
            setTimeout(tick, real(450));
          }, real(dur*0.45));
          return;
        }
        moverBalon(equipoDefiende[rivalCercanoIdx].x, equipoDefiende[rivalCercanoIdx].y, dur*0.7);
        infoBar.textContent = presionadores>=2
          ? `${nombreDefiende} recupera el balón con una presión conjunta`
          : `${nombreDefiende} recupera el balón con una entrada`;
        mostrarAlertaRobo(equipoDefiende[rivalCercanoIdx].x, equipoDefiende[rivalCercanoIdx].y);
        siguientePosesionMia=!posesionMia;
        pasesJugadaActual=0;
        if(siguientePosesionMia) siguienteIdxMio=rivalCercanoIdx; else siguienteIdxRival=rivalCercanoIdx;
        interceptorPendienteIdx=rivalCercanoIdx;
      } else if(zona<0.24 && (()=>{
        // El rol del que lleva el balón importa de verdad: un
        // delantero cerca del área dispara mucho más que un defensa
        // que haya llegado hasta ahí de forma puntual — en la vida
        // real son los delanteros quienes generan la mayoría de las
        // ocasiones de gol, no cualquier jugador que pase por la zona.
        const rolesEnAtaque = posesionMia?rolesMios:rolesRival;
        const rolPortador = rolesEnAtaque[idxConBalon];
        const factorRolDisparo = rolPortador==='fwd' ? 1.35 : (rolPortador==='def' ? 0.45 : 0.9);
        // Ángulo de disparo real: antes solo se tenía en cuenta la
        // distancia a portería, nunca el ángulo — un disparo desde
        // una posición central y abierta hacia el gol es muy distinto
        // de uno desde cerca de la línea de fondo con un ángulo
        // cerrado, aunque la distancia en línea recta sea parecida.
        // Se calcula cuánto se desvía el jugador del centro de la
        // portería en relación a lo cerca que está de la línea de
        // fondo — cuanto más cerca de la línea de fondo Y más
        // desviado del centro, peor el ángulo.
        const anchoCoordDisparo = esEscritorio ? posActual.y : posActual.x;
        const centroPorteriaCoord = esEscritorio ? CENTRO_Y : CENTRO_X;
        const desvioCentroDisparo = Math.abs(anchoCoordDisparo-centroPorteriaCoord);
        const profundidadRestanteDisparo = esEscritorio
          ? Math.abs(posActual.x-golObjetivo.x)
          : Math.abs(posActual.y-golObjetivo.y);
        // Solo penaliza de verdad cuando el desvío lateral es grande Y
        // encima se está ya muy cerca de la línea de fondo (el caso
        // clásico del ángulo cerrado) — un desvío moderado con
        // distancia normal apenas se nota, como en la vida real.
        const factorAngulo = 1-Math.max(0, Math.min(0.55, (desvioCentroDisparo-14)/26)*Math.max(0, 1-(profundidadRestanteDisparo/12)));
        // Solo ante el portero: si no hay NINGÚN defensa de campo cerca
        // (solo el guardameta), la decisión real es clarísima —
        // rematar, no dudar con un pase. Antes esta situación tan
        // evidente se resolvía con la misma probabilidad que
        // cualquier otro disparo cercano, y a veces el jugador se
        // quedaba solo frente al portero sin definir la jugada.
        const defensorMasCercanoDisparo = equipoDefiende.filter((rv,ri)=>ri!==0).reduce((min,rv)=>Math.min(min,Math.hypot(rv.x-posActual.x,rv.y-posActual.y)),Infinity);
        if(zona<0.17 && defensorMasCercanoDisparo>10) return Math.random()<0.94*Math.max(0.55,factorAngulo);
        // Cerca del área, sin rivales DEMASIADO cerca (aunque no esté
        // completamente solo): también debe disparar con mucha más
        // decisión que un disparo genérico con marca encima.
        if(zona<0.24 && defensorMasCercanoDisparo>6) return Math.random()<0.7*Math.max(0.55,factorAngulo);
        return Math.random()<(0.38+Math.min(0.18,pasesJugadaActual*0.03))*(posesionMia?multRiesgoMioActual():urgenciaPartidoRival())*factorRolDisparo*factorAngulo;
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
          mostrarAlertaParada(portero[0].x+desvio, portero[0].y);
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
          // Duración de la carrera proporcional a la distancia real —
          // antes era un tiempo fijo (500ms) sin importar si el
          // jugador estaba a 2 unidades o a 40 de un balón suelto, así
          // que un jugador lejano parecía aparecer por arte de magia
          // en vez de correr de verdad a por él.
          const distCorredor = esMio?distMio:distRival;
          const duracionCorredor = Math.max(400, Math.min(1500, distCorredor*26));
          if(esMio){ idxConBalonMio=dMio; moverJugador(true, dMio, px, py, duracionCorredor); }
          else { idxConBalonRival=dRival; moverJugador(false, dRival, px, py, duracionCorredor); }
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
                    // Remate real de cabeza: antes el córner siempre
                    // se reiniciaba sin más tras el centro, cuando en
                    // la vida real es una fuente real de goles. Ahora
                    // hay una probabilidad genuina de rematar a
                    // puerta, mayor si quien remata es un rematador
                    // aéreo natural (defensa central o delantero).
                    const rolRematador = (posesionMia?rolesMios:rolesRival)[rematadorIdx];
                    const probRemate = rolRematador==='def' ? 0.42 : (rolRematador==='fwd' ? 0.48 : 0.3);
                    if(Math.random()<probRemate){
                      infoBar.textContent=`¡${nombreAtaca} remata de cabeza!`;
                      const destinoRemateGol = golObjetivo;
                      const duracionRemate=380;
                      moverBalon(destinoRemateGol.x, destinoRemateGol.y, duracionRemate);
                      const porteroRemate = posesionMia?posRival:posMia;
                      const porteroRemateEsMio = !posesionMia;
                      const desvioRemate=(Math.random()-0.5)*7;
                      setTimeout(()=>{
                        moverJugador(porteroRemateEsMio, 0, porteroRemate[0].x+desvioRemate, porteroRemate[0].y, 350);
                        setTimeout(()=>moverJugador(porteroRemateEsMio, 0, (porteroRemateEsMio?miGolXY:rivalGolXY).x, (porteroRemateEsMio?miGolXY:rivalGolXY).y, 600), real(350));
                      }, real(180));
                      setTimeout(()=>{
                        moverBalon(centroCampo.x, centroCampo.y, 700);
                        asignarBalonSuelto(centroCampo.x, centroCampo.y);
                        avanzarTiempo(dur+500+350+700+700+700+900+duracionRemate);
                        setTimeout(tick, real(600));
                      }, real(duracionRemate+400));
                      return;
                    }
                    moverBalon(centroCampo.x, centroCampo.y, 700);
                    asignarBalonSuelto(centroCampo.x, centroCampo.y);
                    avanzarTiempo(dur+500+350+700+700+700+900);
                    setTimeout(tick, real(600));
                  }, real(700));
                }, real(120));
              }, real(700));
            }, real(450));
          }, real(dur*0.65));
        } else {
          setTimeout(()=>{
            // El portero SE QUEDA con el balón tras una parada normal
            // — antes se reiniciaba como un balón suelto en el centro
            // del campo, que cualquiera de los dos equipos podía ganar
            // por cercanía, algo que no tiene ningún sentido: un
            // portero que para el balón limpiamente lo controla, no lo
            // suelta al aire para que se dispute. Ahora distribuye de
            // verdad a un defensa cercano, con la misma prudencia que
            // ya tiene el resto de la distribución del portero.
            const equipoPortero = porteroEsMio?posMia:posRival;
            const rolesPortero = porteroEsMio?rolesMios:rolesRival;
            let receptorDistribucion = rolesPortero.findIndex((r,ri)=>ri!==0 && r==='def');
            if(receptorDistribucion<0) receptorDistribucion = jugadorMasCercano(equipoPortero, equipoPortero[0].x, equipoPortero[0].y, 0);
            posesionMia = porteroEsMio;
            if(porteroEsMio){ idxConBalonMio=receptorDistribucion; } else { idxConBalonRival=receptorDistribucion; }
            infoBar.textContent=`${porteroEsMio?miNombre:rivalNombre} saca desde atrás con el balón controlado`;
            moverBalon(equipoPortero[receptorDistribucion].x, equipoPortero[receptorDistribucion].y, 750);
            moverJugador(porteroEsMio, receptorDistribucion, equipoPortero[receptorDistribucion].x, equipoPortero[receptorDistribucion].y, 750);
            pasesJugadaActual=0; historialMio=[]; historialRival=[];
            avanzarTiempo(dur+750);
            setTimeout(tick, real(750));
          }, real(dur*0.65));
        }
        // Este disparo gestiona su propio final (arriba) — se corta
        // aquí para que el cierre genérico de más abajo no pise la
        // posesión/jugador que se acaba de asignar con datos viejos.
        return;
      } else {
        // Conducción libre: si el CAMINO hacia la portería está
        // despejado, el jugador no tiene por qué pasar de inmediato —
        // en la vida real, cuando encuentras espacio libre por
        // delante, sigues corriendo con el balón en los pies para
        // ganar terreno, y solo decides pasar cuando un defensa
        // empieza a interponerse de verdad. Antes se exigía que NO
        // hubiera NINGÚN rival cerca en cualquier dirección — muy
        // restrictivo, porque con 11 rivales en el campo casi siempre
        // hay alguno cerca en algún lado, aunque no esté bloqueando el
        // camino real hacia portería. Ahora se comprueba de verdad si
        // hay algún defensa interponiéndose en la línea directa hacia
        // el gol, no solo "cerca en general".
        const dirCaminoX = golObjetivo.x-posActual.x, dirCaminoY = golObjetivo.y-posActual.y;
        const dirCaminoLen = Math.hypot(dirCaminoX, dirCaminoY)||1;
        const defensorEnCamino = equipoDefiende.some((rv,ri)=>{
          if(ri===0) return false; // el portero no cuenta como obstáculo hasta el remate final
          // Proyección del rival sobre la línea directa al gol: cuánto
          // se ha adelantado en esa dirección, y cuánto se desvía a
          // los lados de esa línea recta.
          const relX=rv.x-posActual.x, relY=rv.y-posActual.y;
          const avanceProyectado = (relX*dirCaminoX+relY*dirCaminoY)/dirCaminoLen;
          const desvioLateral = Math.abs(relX*dirCaminoY-relY*dirCaminoX)/dirCaminoLen;
          return avanceProyectado>0 && avanceProyectado<dirCaminoLen*0.85 && desvioLateral<7.5;
        });
        const rolPortadorLibre = (posesionMia?rolesMios:rolesRival)[idxConBalon];
        if(!defensorEnCamino && zona>0.15 && rolPortadorLibre!=='def' && Math.random()<0.85){
          const avanceLibre = Math.min(0.30, 0.14+((posesionMia?misStatsReales.pace:rival.pace)-50)/300);
          const destinoConduccion={
            x: posActual.x+(golObjetivo.x-posActual.x)*avanceLibre,
            y: posActual.y+(golObjetivo.y-posActual.y)*avanceLibre
          };
          pasesJugadaActual=Math.max(0,pasesJugadaActual-1); // conducir no es lo mismo que pasar, no cuenta para la urgencia de disparo
          moverBalon(destinoConduccion.x, destinoConduccion.y, dur*0.75);
          // El jugador debe conducir de verdad con el balón en los
          // pies — antes solo se movía el balón (moverBalon), dejando
          // la ficha del jugador clavada mientras el balón "flotaba"
          // solo hacia delante (mismo bug que ya se corrigió en el
          // regate 1 contra 1).
          moverJugador(posesionMia, idxConBalon, destinoConduccion.x, destinoConduccion.y, dur*0.75, 'out');
          infoBar.textContent=`${nombreAtaca} avanza con el balón, sin oposición cerca`;
          actualizarFormacionDinamica(posesionMia, posesionMia?idxConBalon:undefined, posesionMia?undefined:idxConBalon, posActual);
          setTimeout(()=>{
            avanzarTiempo(dur*0.75);
            tick();
          }, real(dur*0.75));
          return;
        }
        // Regate 1 contra 1: si el que lleva el balón encara a UN SOLO
        // defensa aislado (no hay presión coordinada de varios a la
        // vez), puede intentar superarlo directamente en vez de pasar
        // siempre — variedad real, no solo "pase o disparo".
        const defensaAislado = jugadorMasCercano(equipoDefiende, posActual.x, posActual.y, -1);
        const distDefensaAislado = Math.hypot(equipoDefiende[defensaAislado].x-posActual.x, equipoDefiende[defensaAislado].y-posActual.y);
        const presionAquiAhora = equipoDefiende.filter(rv=>Math.hypot(rv.x-posActual.x, rv.y-posActual.y)<14).length;
        const ritmoAtaca = posesionMia ? misStatsReales.pace : rival.pace;
        if(distDefensaAislado<13 && presionAquiAhora===1 && zona>0.15 && Math.random()<(ritmoAtaca-30)/90){
          const avanzaHacia = golObjetivo;
          const destinoRegate={x:posActual.x+(avanzaHacia.x-posActual.x)*0.22, y:posActual.y+(avanzaHacia.y-posActual.y)*0.22};
          const regateExitoso = Math.random()<0.68;
          pasesJugadaActual=0;
          if(regateExitoso){
            moverBalon(destinoRegate.x, destinoRegate.y, dur*0.8);
            // El jugador debe adelantarse de verdad tras superar a su
            // marcador — antes solo se movía el balón (moverBalon), así
            // que el balón avanzaba "solo" mientras la ficha del
            // jugador se quedaba clavada en el sitio donde encaró al
            // rival. Se le excluye de la reubicación dinámica genérica
            // de más abajo (como ya se hacía) precisamente porque este
            // movimiento explícito es el que debe llevarlo con el
            // balón en los pies, adelantado respecto al defensa al que
            // acaba de regatear.
            moverJugador(posesionMia, idxConBalon, destinoRegate.x, destinoRegate.y, dur*0.8, 'out');
            infoBar.textContent=`${nombreAtaca} encara y supera a su marcador`;
            mostrarAlertaRegate(destinoRegate.x, destinoRegate.y);
            actualizarFormacionDinamica(posesionMia, posesionMia?idxConBalon:undefined, posesionMia?undefined:idxConBalon, posActual);
            setTimeout(()=>{
              avanzarTiempo(dur);
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
              avanzarTiempo(dur);
              tick();
            }, real(dur));
          }
          return;
        }
        // Jugada individual por falta de opciones: si el portador ya
        // está en zona avanzada (aprox. mitad del campo rival en
        // adelante) y NINGÚN compañero cercano ofrece un pase legal
        // (todos estarían en fuera de juego), en vez de forzarse un
        // pase inválido el jugador prueba por su cuenta — avanza
        // driblando hacia portería y, si consigue acercarse lo
        // suficiente, dispara él mismo. Antes esta situación se
        // resolvía igualmente con un pase (el sistema de puntuación
        // siempre elegía "el menos malo", aunque estuviera en fuera de
        // juego), dando la sensación de que el equipo intentaba un
        // pase imposible en vez de resolverlo un jugador real.
        if(zona>0.5){
          const ultimoDefensorProfIndiv = equipoDefiende.reduce((max,rv,ri)=>{
            if(ri===0) return max;
            const prof = esEscritorio ? (posesionMia?rv.x:ANCHO-rv.x) : (posesionMia?ALTO-rv.y:rv.y);
            return Math.max(max, prof);
          }, -Infinity);
          const companerosCercanosIndiv = equipoAtaca.filter((p,i)=>i!==idxConBalon && Math.hypot(p.x-posActual.x,p.y-posActual.y)<42);
          const hayPaseLegalIndiv = companerosCercanosIndiv.some(p=>{
            const profP = esEscritorio ? (posesionMia?p.x:ANCHO-p.x) : (posesionMia?ALTO-p.y:p.y);
            return profP<=ultimoDefensorProfIndiv+1.5;
          });
          if(companerosCercanosIndiv.length>0 && !hayPaseLegalIndiv){
            const avanceIndiv = Math.min(0.28, 0.13+((posesionMia?misStatsReales.pace:rival.pace)-50)/280);
            const destinoIndiv={
              x: posActual.x+(golObjetivo.x-posActual.x)*avanceIndiv,
              y: posActual.y+(golObjetivo.y-posActual.y)*avanceIndiv
            };
            pasesJugadaActual=Math.max(0,pasesJugadaActual-1);
            moverBalon(destinoIndiv.x, destinoIndiv.y, dur*0.75);
            moverJugador(posesionMia, idxConBalon, destinoIndiv.x, destinoIndiv.y, dur*0.75, 'out');
            infoBar.textContent=`${nombreAtaca} no encuentra un pase legal y se lanza en jugada individual`;
            actualizarFormacionDinamica(posesionMia, posesionMia?idxConBalon:undefined, posesionMia?undefined:idxConBalon, posActual);
            setTimeout(()=>{
              avanzarTiempo(dur*0.75);
              tick();
            }, real(dur*0.75));
            return;
          }
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
          // Fuera de juego reforzado: margen de tolerancia más
          // ajustado y penalización más fuerte — antes dejaba pasar
          // situaciones demasiado adelantadas con facilidad.
          const penalizFueraJuego = (profReceptor>ultimoDefensorProf+1.5) ? (profReceptor-ultimoDefensorProf)*1.9 : 0;
          // Penalización real por retroceder: si el propio portador ya
          // está en zona de ataque prometedora (cerca del área rival) y
          // el receptor candidato está claramente MÁS ATRÁS que él, se
          // penaliza — antes solo se premiaba avanzar, pero nada
          // desincentivaba específicamente ceder terreno ya ganado
          // pasando hacia atrás sin necesidad real.
          const penalizRetroceso = (zona<0.35 && avanceAtaca[i]<avanceAtaca[idxConBalon]-0.12) ? (avanceAtaca[idxConBalon]-avanceAtaca[i])*8 : 0;
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
          // Contraataque real: justo tras recuperar el balón (el
          // historial de esta posesión está vacío, la primera
          // decisión), se prioriza mucho más avanzar hacia delante —
          // el rival todavía está descolocado tras perder el balón, y
          // un equipo real busca aprovechar ese instante en vez de
          // simplemente evitar el pase hacia atrás. Sin este bono,
          // recuperar el balón no se traducía en ningún incentivo
          // extra para atacar rápido, solo en la puntuación normal.
          const bonusContraataque = (historialAtaca.length===0 && avanceAtaca[i]>0.55) ? (avanceAtaca[i]-0.55)*14 : 0;
          const punt = avanceAtaca[i]*9 - penalizDistancia + distMarca*0.35 + bonusRol - penalizBloqueo - penalizBalonLargoDef - penalizBucle + bonusPorteroSeguro - penalizPorteroArriesgado - penalizFueraJuego - penalizRetroceso + bonusContraataque + Math.random()*3;
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
            avanzarTiempo(dur);
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
        // El desmarque se cronometra de verdad: la carrera prevista
        // busca el hueco de forma agresiva, pero sin pasarse de la
        // línea del último defensa rival — como haría un delantero
        // real que calcula el momento exacto de arrancar la carrera
        // para no quedarse en fuera de juego. Antes esta carrera no
        // comprobaba nada, así que un receptor elegido en posición
        // legal podía terminar adelantado solo por la propia
        // previsión de desmarque.
        const equipoDefiendePredictivo = posesionMia?posRival:posMia;
        const ultimoDefensorPredictivo = equipoDefiendePredictivo.reduce((max,rv,ri)=>{
          if(ri===0) return max;
          const prof = esEscritorio ? (posesionMia?rv.x:ANCHO-rv.x) : (posesionMia?ALTO-rv.y:rv.y);
          return Math.max(max, prof);
        }, -Infinity);
        const profDestinoPredictivo = esEscritorio ? (posesionMia?destino.x:ANCHO-destino.x) : (posesionMia?ALTO-destino.y:destino.y);
        if(profDestinoPredictivo>ultimoDefensorPredictivo-1.5){
          const profCorregidaPredictiva=ultimoDefensorPredictivo-1.5;
          if(esEscritorio) destino={x: posesionMia?profCorregidaPredictiva:ANCHO-profCorregidaPredictiva, y:destino.y};
          else destino={x:destino.x, y: posesionMia?ALTO-profCorregidaPredictiva:profCorregidaPredictiva};
        }
        // El balón viaja a una velocidad más o menos constante, no
        // siempre en el mismo tiempo fijo — un pase corto es rápido,
        // uno largo tarda de verdad más, como un balón real. Se
        // recalcula con la distancia FINAL (ya con la previsión de
        // carrera incluida), para que la duración visual coincida de
        // verdad con el recorrido real del balón.
        const distanciaPaseReal=Math.hypot(destino.x-posActual.x, destino.y-posActual.y);
        // Velocidad de pase variable según el contexto real: antes
        // siempre era la misma velocidad relativa a la distancia, sin
        // importar si el pasador tenía un rival encima o si el equipo
        // estaba lanzado en una transición rápida — en la vida real,
        // un pase bajo presión o en un contraataque sale mucho más
        // directo y rápido que uno de construcción tranquila sin
        // oposición cerca.
        const rivalMasCercanoVelocidad = jugadorMasCercano(equipoDefiende, posActual.x, posActual.y, -1);
        const distPresionVelocidad = Math.hypot(equipoDefiende[rivalMasCercanoVelocidad].x-posActual.x, equipoDefiende[rivalMasCercanoVelocidad].y-posActual.y);
        const esContraataqueVelocidad = (posesionMia?historialMio:historialRival).length===0;
        let factorVelocidadPase = 1;
        if(distPresionVelocidad<8) factorVelocidadPase *= 0.72; // presión encima, pase rápido y directo
        if(esContraataqueVelocidad) factorVelocidadPase *= 0.85; // primera decisión tras robar, urgencia real
        duracionEfectiva=Math.max(340, Math.min(1900, distanciaPaseReal*32*factorVelocidadPase));
        // Pase impreciso bajo presión: antes, una vez decidido, un
        // pase SIEMPRE llegaba perfecto a su destino, sin importar si
        // quien lo daba tenía un rival encima respirándole en la nuca.
        // En un partido real, un pase bajo presión se puede desviar,
        // quedarse corto o irse directo al rival — no es solo el
        // rival quien puede "fallar" la jugada interceptando, el
        // propio pasador también puede errar el pase. La probabilidad
        // depende de la presión real (distancia al rival más cercano)
        // y de la calidad de pase del equipo — un equipo con mejor
        // pase falla mucho menos bajo la misma presión.
        const rivalMasCercanoPasador = jugadorMasCercano(equipoDefiende, posActual.x, posActual.y, -1);
        const distPresionPasador = Math.hypot(equipoDefiende[rivalMasCercanoPasador].x-posActual.x, equipoDefiende[rivalMasCercanoPasador].y-posActual.y);
        const calidadPaseEquipo = posesionMia ? misStatsReales.passing : rival.passing;
        const probImprecision = distPresionPasador<9 ? Math.max(0, (9-distPresionPasador)/9)*Math.max(0.08, (78-calidadPaseEquipo)/220) : 0;
        if(Math.random()<probImprecision){
          const anguloError=(Math.random()-0.5)*2.2;
          const dirErrX=(destino.x-posActual.x), dirErrY=(destino.y-posActual.y);
          const dirErrLen=Math.hypot(dirErrX,dirErrY)||1;
          const alcanceError=dirErrLen*(0.35+Math.random()*0.4);
          const destinoImpreciso={
            x: posActual.x+(dirErrX/dirErrLen*Math.cos(anguloError)-dirErrY/dirErrLen*Math.sin(anguloError))*alcanceError,
            y: posActual.y+(dirErrX/dirErrLen*Math.sin(anguloError)+dirErrY/dirErrLen*Math.cos(anguloError))*alcanceError
          };
          // Un pase impreciso de verdad ya NO es un pase normal que el
          // receptor persigue perfectamente — se convierte en un
          // balón suelto real, que cualquiera de los dos equipos
          // puede ganar según quién llegue antes, cortando aquí el
          // flujo normal en vez de seguir como si el pase hubiera
          // salido bien.
          const duracionImprecision=Math.max(350, Math.min(1200, alcanceError*30));
          moverBalon(destinoImpreciso.x, destinoImpreciso.y, duracionImprecision);
          infoBar.textContent=`${nombreAtaca} pierde precisión en el pase, presionado`;
          pasesJugadaActual=0; historialMio=[]; historialRival=[];
          actualizarFormacionDinamica(posesionMia, posesionMia?idxConBalon:undefined, posesionMia?undefined:idxConBalon, posActual);
          setTimeout(()=>{
            const dMioImp=jugadorMasCercano(posMia, destinoImpreciso.x, destinoImpreciso.y, -1);
            const dRivalImp=jugadorMasCercano(posRival, destinoImpreciso.x, destinoImpreciso.y, -1);
            const distMioImp=Math.hypot(posMia[dMioImp].x-destinoImpreciso.x, posMia[dMioImp].y-destinoImpreciso.y);
            const distRivalImp=Math.hypot(posRival[dRivalImp].x-destinoImpreciso.x, posRival[dRivalImp].y-destinoImpreciso.y);
            posesionMia = distMioImp<=distRivalImp;
            if(posesionMia){ idxConBalonMio=dMioImp; moverJugador(true, dMioImp, destinoImpreciso.x, destinoImpreciso.y, 420); }
            else { idxConBalonRival=dRivalImp; moverJugador(false, dRivalImp, destinoImpreciso.x, destinoImpreciso.y, 420); }
            avanzarTiempo(duracionImprecision+400);
            setTimeout(tick, real(420));
          }, real(duracionImprecision));
          return;
        }
        moverBalon(destino.x, destino.y, duracionEfectiva);
        // El receptor corre de verdad hacia la posición prevista, con
        // la misma duración que el balón — sin esto, el balón iría a
        // un punto por delante del jugador mientras él se queda quieto
        // en su sitio antiguo, recreando el mismo fallo que se quería
        // arreglar (el balón "cae donde no hay nadie"), solo que más
        // lejos de lo que estaba antes.
        moverJugador(posesionMia, mejor, destino.x, destino.y, duracionEfectiva, 'out');
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
        posesionMia?receptorPaseIdx:undefined, posesionMia?undefined:receptorPaseIdx,
        posesionMia?undefined:interceptorPendienteIdx, posesionMia?interceptorPendienteIdx:undefined);

      setTimeout(()=>{
        posesionMia=siguientePosesionMia; idxConBalonMio=siguienteIdxMio; idxConBalonRival=siguienteIdxRival;
        avanzarTiempo(duracionEfectiva);
        tick();
      }, real(duracionEfectiva));
    }
    // Saque de centro realista: en la vida real, quien saca de centro
    // SIEMPRE toca el balón hacia atrás o hacia un lado a un
    // compañero cercano — nunca hacia delante, porque los rivales
    // deben quedarse fuera del círculo central hasta que el balón se
    // mueve, y el equipo que saca busca una posición estable antes de
    // construir el ataque. Antes, tras el pitido, se dejaba que la IA
    // normal decidiera el primer pase, que podía perfectamente elegir
    // una opción hacia delante — algo que no ocurre nunca en un saque
    // de centro real.
    function sacarDeCentro(esMioQueSaca, idxQueSaca){
      const equipoQueSaca = esMioQueSaca?posMia:posRival;
      const rolesQueSaca = esMioQueSaca?rolesMios:rolesRival;
      const nombreQueSaca = esMioQueSaca?miNombre:rivalNombre;
      // Compañero cercano al centro para el toque inicial: otro
      // mediocentro si lo hay, o el más cercano al punto de saque que
      // no sea el propio sacador ni el portero.
      let companeroIdx = rolesQueSaca.findIndex((r,ri)=>r==='mid' && ri!==idxQueSaca);
      if(companeroIdx<0) companeroIdx = jugadorMasCercano(equipoQueSaca, centroCampo.x, centroCampo.y, idxQueSaca);
      if(companeroIdx===0 || companeroIdx<0 || companeroIdx===idxQueSaca){
        // Sin compañero válido cerca (caso extremo) — se deja pasar
        // directamente a la IA normal, sin forzar nada raro.
        tick();
        return;
      }
      const posSlotCompanero = (esMioQueSaca?misSlots:rivalSlots)[companeroIdx];
      // Garantía real de la regla actual (IFAB): solo el jugador que
      // saca puede estar dentro del círculo central en el momento del
      // saque — antiguamente hacían falta dos, pero esa regla cambió
      // hace años. Si la casilla de formación del compañero cayera
      // por casualidad dentro del radio del círculo (9.15 unidades),
      // se aparta un poco hacia su propia portería para quedar fuera
      // de verdad, en vez de confiar en que su posición normal ya
      // caiga fuera por sí sola.
      const distCompaneroCentro = Math.hypot(posSlotCompanero.x-centroCampo.x, posSlotCompanero.y-centroCampo.y);
      const RADIO_CIRCULO_CENTRAL = 9.5;
      let posCompaneroReal = posSlotCompanero;
      if(distCompaneroCentro<RADIO_CIRCULO_CENTRAL){
        const propioGolQueSaca = esMioQueSaca?miGolXY:rivalGolXY;
        const dirFueraX=(propioGolQueSaca.x-centroCampo.x), dirFueraY=(propioGolQueSaca.y-centroCampo.y);
        const dirFueraLen=Math.hypot(dirFueraX,dirFueraY)||1;
        posCompaneroReal = {
          x: centroCampo.x+(dirFueraX/dirFueraLen)*RADIO_CIRCULO_CENTRAL,
          y: centroCampo.y+(dirFueraY/dirFueraLen)*RADIO_CIRCULO_CENTRAL
        };
      }
      // El toque va hacia la posición de formación del compañero, casi
      // siempre detrás o al lado del punto de centro, nunca hacia la
      // portería rival.
      moverBalon(posCompaneroReal.x, posCompaneroReal.y, 500);
      infoBar.textContent=`${nombreQueSaca} pone el balón en juego`;
      setTimeout(()=>{
        if(esMioQueSaca){ idxConBalonMio=companeroIdx; } else { idxConBalonRival=companeroIdx; }
        avanzarTiempo(650);
        setTimeout(tick, real(150));
      }, real(500));
    }
    // El balón empieza pegado de verdad al jugador que saca de centro,
    // no flotando solo en el punto exacto del centro del campo.
    // Reorganización inicial explícita: los 22 jugadores van a su
    // posición exacta de formación antes del pitido, con el mismo
    // bloqueo anti-interferencias que el resto de reorganizaciones
    // completas (gol, segunda parte) — así el saque inicial arranca
    // siempre con el equipo completo bien colocado.
    bloqueoReformacionHasta=performance.now()+real(950);
    misSlots.forEach((s,i)=>moverJugador(true, i, s.x, s.y, 1));
    rivalSlots.forEach((s,i)=>moverJugador(false, i, s.x, s.y, 1));
    const equipoInicial = posesionMia?posMia:posRival;
    const idxInicial = posesionMia?idxConBalonMio:idxConBalonRival;
    moverBalon(equipoInicial[idxInicial].x, equipoInicial[idxInicial].y, 1);
    if(typeof window.playSound==='function') window.playSound('whistle');
    setTimeout(()=>sacarDeCentro(posesionMia, idxInicial), real(600));

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
    }, real(230));

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
      clearInterval(vigilanteInterval);
      clearInterval(flujoContinuoInterval);
      if(ballAnimFrameId!==null) cancelAnimationFrame(ballAnimFrameId);
      if(jugadorAnimFrameId!==null) cancelAnimationFrame(jugadorAnimFrameId);
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
      // Usa el MISMO dato que la barra en directo (muestreado tick a
      // tick durante la simulación real), no la fórmula aparte basada
      // en estadísticas de info.resultado — antes podían no coincidir
      // porque eran dos cálculos completamente independientes entre
      // sí, dando dos porcentajes de posesión distintos para el mismo
      // partido.
      const posMioFinal = muestrasPosesionTotal>4 ? Math.round((muestrasPosesionMia/muestrasPosesionTotal)*100) : 50;
      const barraPosesion = posMioFinal!=null ? `
        <div class="lm-visor-posesion-titulo">${t('lm.posesion_titulo')}</div>
        <div class="lm-visor-posesion-barra">
          <div class="lm-visor-posesion-mia" style="width:${posMioFinal}%">${posMioFinal}%</div>
          <div class="lm-visor-posesion-rival" style="width:${100-posMioFinal}%">${100-posMioFinal}%</div>
        </div>` : '';
      // La predicción de la rueda de prensa (si hubo alguna esta
      // jornada) antes solo se mostraba en el resumen del modo
      // automático — el modo manager no la mostraba en absoluto,
      // aunque el partido fuera exactamente el mismo.
      const prensaResueltaVisor = state.ultimaPrensaResuelta;
      const bloquePrensaVisor = (prensaResueltaVisor && prensaResueltaVisor.outcome!=='neutral') ? `
        <div class="press-prediction-section ${prensaResueltaVisor.outcome==='correct'?'press-prediction-good':'press-prediction-bad'}">${prensaResueltaVisor.texto}</div>` : '';
      resumenBox.innerHTML = `
        <div class="lm-visor-resultado-banner ${resultadoClase}">${resultadoTexto}</div>
        <div class="lm-visor-resumen-titulo">${t('lm.resumen_partido_titulo')}</div>
        ${filas || ''}
        ${barraPosesion}
        ${bloquePrensaVisor}
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
          if(typeof mostrarHistoricoPartido==='function'){
            const posesionRealActual = muestrasPosesionTotal>4 ? Math.round((muestrasPosesionMia/muestrasPosesionTotal)*100) : null;
            mostrarHistoricoPartido(info, miEsLocal, posesionRealActual);
          }
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
      clearInterval(vigilanteInterval);
      clearInterval(flujoContinuoInterval);
      if(ballAnimFrameId!==null) cancelAnimationFrame(ballAnimFrameId);
      if(jugadorAnimFrameId!==null) cancelAnimationFrame(jugadorAnimFrameId);
      overlay.remove();
      if(onFinish) onFinish();
    });
  }

  window.G2G_abrirVisorPartidoManager = abrirVisorPartidoManager;

})();
