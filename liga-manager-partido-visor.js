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
    const {state, t, formacionActual, generarSlotsFormacion, climaDelPartido, calcularStatsEquipo, plantillaEfectivaRival, crestHTML, rivalCrestHTML} = deps;
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

    // Franjas de siega del césped — MISMOS colores y proporciones
    // exactas que el campo real de Copa Leyendas/Liga Manager
    // (PITCH_SVG: base #2f7c42, franjas #246f38, 8 franjas).
    const NFRANJAS=8;
    let franjasHTML='';
    const anchoLargo = esEscritorio ? ANCHO : ALTO; // dimensión a lo largo del eje de ataque
    for(let i=0;i<NFRANJAS;i++){
      const clara = i%2===0;
      const pos = (5.9375 + i*11.71875)/100*anchoLargo;
      const grosor = 5.9375/100*anchoLargo;
      if(esEscritorio){
        franjasHTML+=`<rect x="${pos}" y="0" width="${grosor}" height="${ALTO}" fill="${clara?'#246f38':'#2f7c42'}"/>`;
      } else {
        franjasHTML+=`<rect x="0" y="${pos}" width="${ANCHO}" height="${grosor}" fill="${clara?'#246f38':'#2f7c42'}"/>`;
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

    const clima = (typeof climaDelPartido==='function') ? climaDelPartido() : null;
    const climaClase = clima ? `lm-visor-clima-${clima.id}` : '';

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
          ${(clima&&clima.id==='rain')?`<div class="lm-visor-lluvia">${Array.from({length:26}).map((_,i)=>`<span style="left:${Math.random()*100}%;animation-delay:${(Math.random()*1.4).toFixed(2)}s;animation-duration:${(0.55+Math.random()*0.35).toFixed(2)}s"></span>`).join('')}</div>`:''}
          ${(clima&&clima.id==='snow')?`<div class="lm-visor-nieve">${Array.from({length:22}).map((_,i)=>`<span style="left:${Math.random()*100}%;animation-delay:${(Math.random()*3).toFixed(2)}s;animation-duration:${(2.4+Math.random()*1.6).toFixed(2)}s"></span>`).join('')}</div>`:''}
          ${(clima&&clima.id==='wind')?`<div class="lm-visor-viento">${Array.from({length:9}).map((_,i)=>`<span style="top:${Math.random()*100}%;animation-delay:${(Math.random()*2.2).toFixed(2)}s;animation-duration:${(1.1+Math.random()*0.6).toFixed(2)}s"></span>`).join('')}</div>`:''}
        </div>
        <div class="lm-visor-info-bar" id="lmVisorInfoBar">${t('lm.viendo_partido')}</div>
        <div id="lmVisorResumenBox" style="display:none"></div>
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
      balon.style.transition=`cx ${durReal}ms ease-in-out, cy ${durReal}ms ease-in-out`;
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
        resalte.setAttribute('opacity','0.9');
        resalte.style.transition='opacity .6s ease-out';
        setTimeout(()=>resalte.setAttribute('opacity','0'), 30);
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
    const multEmpujeMio = catTacticaMia==='ofensiva' ? 1.35 : (catTacticaMia==='defensiva' ? 0.65 : 1);
    const multRiesgoMio = catTacticaMia==='ofensiva' ? 1.25 : (catTacticaMia==='defensiva' ? 0.7 : 1);
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
    function actualizarFormacionDinamica(atacaMio, idxExcluirMio, idxExcluirRival, balonPos){
      function reubicarEquipo(esMio, idxExcluir){
        const slots = esMio?misSlots:rivalSlots;
        const pos = esMio?posMia:posRival;
        const avance = esMio?avanceMio:avanceRival;
        const roles = esMio?rolesMios:rolesRival;
        const golRival = esMio?rivalGolXY:miGolXY;
        const propioGol = esMio?miGolXY:rivalGolXY;
        const yoAtaco = esMio===atacaMio;
        const multEmpuje = esMio ? multEmpujeMio : 1;
        const cercanos = yoAtaco ? [] : pos.map((p,i)=>({i,d:Math.hypot(p.x-balonPos.x,p.y-balonPos.y)}))
          .filter(o=>o.i!==0 && o.i!==idxExcluir).sort((a,b)=>a.d-b.d).slice(0,2).map(o=>o.i);
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
          if(i===idxExcluir) continue;
          const base=slots[i];
          // Al atacar, TODO el equipo sube de línea para apoyar — los
          // delanteros más, pero defensas y centrocampistas también
          // acompañan de verdad (antes apenas se movían, dando la
          // sensación de que solo atacaban 2-3 jugadores mientras el
          // resto se quedaba plantado atrás, algo sin sentido en un
          // equipo real). Al defender, si se repliega más disciplinado.
          const factorRol = roles[i]==='def' ? 0.75 : (roles[i]==='fwd' ? 1.25 : 1.05);
          const empuje = yoAtaco ? (0.09+avance[i]*0.16)*factorRol*multEmpuje : 0.06;
          const objetivo = yoAtaco ? golRival : propioGol;
          let x=base.x+(objetivo.x-base.x)*empuje;
          let y=base.y+(objetivo.y-base.y)*empuje;
          if(cercanos.includes(i)){
            // Presiona de verdad: se acerca al balón, no solo a su gol
            x = x+(balonPos.x-x)*0.5;
            y = y+(balonPos.y-y)*0.5;
          }
          // Separación: si el destino cae demasiado cerca de otro
          // compañero que ya se ha colocado en este mismo instante, se
          // aparta un poco — evita que dos jugadores acaben pegados.
          destinos.forEach(d=>{
            const dist=Math.hypot(x-d.x,y-d.y);
            if(dist<9 && dist>0.01){
              const empujeSep=(9-dist)/2;
              x += (x-d.x)/dist*empujeSep;
              y += (y-d.y)/dist*empujeSep;
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
          setTimeout(()=>moverJugador(esMio, i, x, y, 950+Math.random()*450), real(Math.random()*350));
        }
      }
      reubicarEquipo(true, idxExcluirMio);
      reubicarEquipo(false, idxExcluirRival);
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
        tiempoTranscurrido+=1300;
        setTimeout(tick, real(1300));
        return;
      }
      if(golIdx<planGoles.length && tiempoTranscurrido>=planGoles[golIdx]-200){
        const evento=eventosGol[golIdx]; golIdx++;
        const esMio = evento.team===miLado;
        const balonPos0={x:parseFloat(balon.getAttribute('cx')), y:parseFloat(balon.getAttribute('cy'))};
        actualizarFormacionDinamica(esMio, esMio?idxConBalonMio:undefined, esMio?undefined:idxConBalonRival, balonPos0);
        const destinoGol = esMio ? rivalGolXY : miGolXY;
        moverBalon(destinoGol.x, destinoGol.y, 850);
        setTimeout(()=>{
          if(esMio) marcadorMio++; else marcadorRival++;
          resEl.textContent=`${miEsLocal?marcadorMio:marcadorRival} - ${miEsLocal?marcadorRival:marcadorMio}`;
          const nombreGoleador = evento.jugador ? evento.jugador.name : '';
          infoBar.textContent=`⚽ ${t('lm.visor_gol')} ${nombreGoleador} (${esMio?miNombre:rivalNombre})`;
          mostrarTextoGrande(t('lm.visor_gol'), real(1800));
          if(typeof window.playSound==='function') window.playSound('goal');
          setTimeout(()=>{
            moverBalon(centroCampo.x,centroCampo.y,700);
            posesionMia=!esMio; tiempoTranscurrido+=2750;
            setTimeout(tick, real(750));
          }, real(1300));
        }, real(850));
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
      const dur=1100+Math.random()*900;
      let siguientePosesionMia=posesionMia, siguienteIdxMio=idxConBalonMio, siguienteIdxRival=idxConBalonRival;

      if(distRival<7 && Math.random()<(zona<0.35?0.38:0.28)){
        // Presión de cerca: el rival se lleva el balón de verdad — más
        // probable en el último tercio, donde la defensa aprieta más.
        moverBalon(equipoDefiende[rivalCercanoIdx].x, equipoDefiende[rivalCercanoIdx].y, dur*0.7);
        infoBar.textContent=`${nombreDefiende} recupera el balón con una entrada`;
        siguientePosesionMia=!posesionMia;
        if(siguientePosesionMia) siguienteIdxMio=rivalCercanoIdx; else siguienteIdxRival=rivalCercanoIdx;
      } else if(zona<0.24 && Math.random()<0.38*(posesionMia?multRiesgoMio:1)){
        // Cerca del área: intento de disparo (sin gol, salvo que
        // coincida con un gol real programado, gestionado aparte). El
        // portero contrario reacciona hacia el disparo.
        moverBalon(golObjetivo.x, golObjetivo.y, dur*0.65);
        infoBar.textContent=`¡${nombreAtaca} dispara a portería!`;
        const portero = posesionMia?posRival:posMia;
        const porteroEsMio = !posesionMia;
        const desvio=(Math.random()-0.5)*7;
        setTimeout(()=>{
          moverJugador(porteroEsMio, 0, portero[0].x+desvio, portero[0].y, dur*0.4);
          setTimeout(()=>moverJugador(porteroEsMio, 0, (porteroEsMio?miGolXY:rivalGolXY).x, (porteroEsMio?miGolXY:rivalGolXY).y, 600), real(dur*0.4));
        }, real(dur*0.5));
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
          const cornerX = esEscritorio ? (golObjetivo.x<CENTRO_X?4:ANCHO-4) : (Math.random()<0.5?4:ANCHO-4);
          const cornerY = esEscritorio ? (Math.random()<0.5?4:ALTO-4) : (golObjetivo.y<CENTRO_Y?4:ALTO-4);
          setTimeout(()=>{
            moverBalon(cornerX, cornerY, 500);
            infoBar.textContent=`Saque de esquina para ${nombreAtaca}`;
            setTimeout(()=>{
              const areaX = golObjetivo.x + (golObjetivo.x<CENTRO_X?8:-8);
              moverBalon(areaX, golObjetivo.y, 900);
              infoBar.textContent=`${nombreAtaca} centra desde el córner`;
              setTimeout(()=>{
                moverBalon(centroCampo.x, centroCampo.y, 700);
                asignarBalonSuelto(centroCampo.x, centroCampo.y);
                tiempoTranscurrido+=dur+500+700+900+700+900;
                setTimeout(tick, real(600));
              }, real(900));
            }, real(700));
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
          const bonusRol = (zona<0.4 && rolesAtaca[i]==='fwd') ? 2.5 : 0;
          const bloqueo=lineaBloqueada(p.x,p.y);
          const penalizBloqueo = bloqueo<4 ? (4-bloqueo)*4.5 : 0;
          const punt = avanceAtaca[i]*9 - d*0.12 + distMarca*0.35 + bonusRol - penalizBloqueo + Math.random()*3;
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
          siguientePosesionMia=!posesionMia;
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
          siguientePosesionMia=!posesionMia;
          if(siguientePosesionMia) siguienteIdxMio=interceptorIdx; else siguienteIdxRival=interceptorIdx;
        } else {
        let destino=equipoAtaca[mejor];
        if(zona<0.45){
          // Pase filtrado: se envía un poco más adelantado que la
          // posición actual del compañero, hacia la portería rival.
          const factor=0.18;
          destino={x:destino.x+(golObjetivo.x-destino.x)*factor, y:destino.y+(golObjetivo.y-destino.y)*factor};
        }
        moverBalon(destino.x, destino.y, dur);
        resaltarReceptor(destino.x, destino.y, dur);
        infoBar.textContent=`${nombreAtaca} ${FRASES_PASE[Math.floor(Math.random()*FRASES_PASE.length)]}`;
        if(posesionMia) siguienteIdxMio=mejor; else siguienteIdxRival=mejor;
        }
      }

      actualizarFormacionDinamica(posesionMia, posesionMia?idxConBalon:undefined, posesionMia?undefined:idxConBalon, posActual);

      setTimeout(()=>{
        posesionMia=siguientePosesionMia; idxConBalonMio=siguienteIdxMio; idxConBalonRival=siguienteIdxRival;
        tiempoTranscurrido+=dur;
        tick();
      }, real(dur));
    }
    // El balón empieza pegado de verdad al jugador que saca de centro,
    // no flotando solo en el punto exacto del centro del campo.
    const equipoInicial = posesionMia?posMia:posRival;
    const idxInicial = posesionMia?idxConBalonMio:idxConBalonRival;
    moverBalon(equipoInicial[idxInicial].x, equipoInicial[idxInicial].y, 1);
    if(typeof window.playSound==='function') window.playSound('whistle');
    setTimeout(tick, real(600));

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
          icono='🩹'; texto=`${t('lm.resumen_lesion')} (${ev.sev?ev.sev.label:''})`; clase='lm-visor-resumen-lesion';
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
      if(typeof window.playSound==='function') window.playSound('whistle');

      partidoTerminado=true;
      cerrarBtn.textContent = t('lm.continuar');
    }
    cerrarBtn.addEventListener('click', ()=>{
      if(typeof window.playSound==='function') window.playSound('select');
      if(!partidoTerminado){
        mostrarResumenFinal();
        return;
      }
      clearInterval(minuteroInterval);
      overlay.remove();
      if(onFinish) onFinish();
    });
  }

  window.G2G_abrirVisorPartidoManager = abrirVisorPartidoManager;

})();
