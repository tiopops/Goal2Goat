/* ═══════════════════════════════════════════════════════════════
   CRÓNICA DEL PARTIDO — generador real, a partir de los datos de un
   partido de Liga Manager ya jugado (eventos reales: goleadores,
   tarjetas, resultado...). Archivo aparte, como pidió Jesús, para
   poder tocar el diseño sin arriesgar nada del motor del juego.

   Uso: window.G2G_Cronica.generarHTML(datos) devuelve el HTML
   completo de la crónica ya rellena, lista para abrir en una pestaña
   nueva o guardar.
   ═══════════════════════════════════════════════════════════════ */
(function(){

  // Banco de fotos, separado por resultado. El banco "general" (las 4
  // fotos genéricas, sin celebración ni disgusto marcados) es neutro
  // y se suma TANTO al de victoria como al de derrota — así no se
  // repiten siempre las mismas 3 fotos exclusivas de cada caso, hay
  // más variedad para elegir en los dos. Añadir más fotos a cualquiera
  // de los tres bancos es tan sencillo como sumar su ruta aquí (y el
  // archivo correspondiente en assets/images/) — no hace falta tocar
  // nada más.
  const IMAGENES_GENERAL=[
    'assets/images/general-01.png',
    'assets/images/general-02.png',
    'assets/images/general-03.png',
    'assets/images/general-04.png',
  ];
  const IMAGENES_VICTORIA_PROPIAS=[
    'assets/images/victoria-01.png',
    'assets/images/victoria-02.png',
    'assets/images/victoria-03.png',
  ];
  const IMAGENES_DERROTA_PROPIAS=[
    'assets/images/derrota-01.png',
    'assets/images/derrota-02.png',
    'assets/images/derrota-03.png',
  ];
  const IMAGENES_VICTORIA=IMAGENES_VICTORIA_PROPIAS.concat(IMAGENES_GENERAL);
  const IMAGENES_DERROTA=IMAGENES_DERROTA_PROPIAS.concat(IMAGENES_GENERAL);

  const POS_ABREV={POR:'POR', DFC:'DFC', LI:'LI', LD:'LD', MC:'MC', EI:'EI', ED:'ED', DC:'DC'};

  function escaparHTML(s){
    return String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  // Envoltorios de traducción — se ejecutan en la ventana del JUEGO
  // (donde i18n.js ya está cargado), aunque el HTML final resultante
  // se escriba luego en una pestaña nueva. Por eso es seguro llamar a
  // window.t aquí directamente: en el momento en que estas funciones
  // se ejecutan, siguen corriendo en el contexto de la propia partida.
  function t(clave){ return (typeof window.t==='function') ? window.t(clave) : clave; }
  function tp(clave, vars){
    let texto=t(clave);
    if(vars) Object.keys(vars).forEach(k=>{ texto=texto.split('{'+k+'}').join(vars[k]); });
    return texto;
  }

  // ---------- Narrativa del partido: quién estuvo por delante en
  // algún momento, para poder distinguir una remontada de una
  // victoria tranquila, o un pinchazo de un empate normal. ----------
  function detectarNarrativa(datos){
    const eventos=(datos.eventos||[]).filter(e=>e.type==='goal').sort((a,b)=>a.minute-b.minute);
    let gL=0, gV=0, localGanoAlgunaVez=false, visitanteGanoAlgunaVez=false;
    eventos.forEach(e=>{
      if(e.team==='home') gL++; else gV++;
      if(gL>gV) localGanoAlgunaVez=true;
      if(gV>gL) visitanteGanoAlgunaVez=true;
    });
    const ganaLocal=datos.golesLocal>datos.golesVisitante;
    const ganaVisitante=datos.golesVisitante>datos.golesLocal;
    const empate=datos.golesLocal===datos.golesVisitante;
    return {
      ganaLocal, ganaVisitante, empate,
      remontadaLocal: ganaLocal && visitanteGanoAlgunaVez,
      remontadaVisitante: ganaVisitante && localGanoAlgunaVez,
      pinchazoLocal: (empate||ganaVisitante) && localGanoAlgunaVez,
      pinchazoVisitante: (empate||ganaLocal) && visitanteGanoAlgunaVez,
    };
  }

  // ---------- Titular: varias posibilidades por cada tipo de
  // resultado (remontada, empate con sabor a poco, empate normal,
  // victoria amplia, victoria ajustada...), elegido al azar entre las
  // disponibles para ese caso concreto — así dos partidos con el
  // mismo marcador no salen siempre con el mismo titular. ----------
  function elegirTitular(datos){
    const nar=detectarNarrativa(datos);
    const diff=Math.abs(datos.golesLocal-datos.golesVisitante);
    const ganador = nar.ganaLocal?datos.nombreLocal:(nar.ganaVisitante?datos.nombreVisitante:null);
    const perdedor = nar.ganaLocal?datos.nombreVisitante:(nar.ganaVisitante?datos.nombreLocal:null);
    const vars={ganador, perdedor, local:datos.nombreLocal, visitante:datos.nombreVisitante};

    let claves;
    if(nar.remontadaLocal || nar.remontadaVisitante){
      claves=['cr.tit.remontada1','cr.tit.remontada2'];
    } else if(nar.empate && (nar.pinchazoLocal||nar.pinchazoVisitante)){
      claves=['cr.tit.escapa1','cr.tit.escapa2'];
      vars.equipo = nar.pinchazoLocal?datos.nombreLocal:datos.nombreVisitante;
      vars.rival = nar.pinchazoLocal?datos.nombreVisitante:datos.nombreLocal;
    } else if(nar.empate){
      claves=['cr.tit.empate1','cr.tit.empate2'];
    } else if(diff>=3){
      claves=['cr.tit.amplia1','cr.tit.amplia2'];
    } else {
      claves=['cr.tit.ajustada1','cr.tit.ajustada2'];
    }
    const claveElegida=claves[Math.floor(Math.random()*claves.length)];
    return tp(claveElegida, vars);
  }

  // ---------- Construcción de la crónica (prosa) a partir de eventos reales ----------
  // datos.eventos: [{minute, team:'home'|'away', type:'goal'|'card', tarjeta, jugador:{name}}]
  function construirCronica(datos){
    const {nombreLocal, nombreVisitante, golesLocal, golesVisitante, eventos} = datos;
    const goles=(eventos||[]).filter(e=>e.type==='goal').sort((a,b)=>a.minute-b.minute);
    const ganaLocal=golesLocal>golesVisitante, ganaVisitante=golesVisitante>golesLocal, empate=golesLocal===golesVisitante;
    const equipoGanador = ganaLocal?nombreLocal:(ganaVisitante?nombreVisitante:null);
    const equipoPerdedor = ganaLocal?nombreVisitante:(ganaVisitante?nombreLocal:null);

    const parrafos=[];

    // Párrafo 1: contexto de cómo arrancó/se decidió el partido
    if(goles.length===0){
      parrafos.push(tp('cr.pocas_ocasiones', {estadio:escaparHTML(datos.estadio||t('cr.final')), local:escaparHTML(nombreLocal), visitante:escaparHTML(nombreVisitante)}));
    } else {
      const primerGol=goles[0];
      const equipoPrimerGol = primerGol.team==='home' ? nombreLocal : nombreVisitante;
      parrafos.push(tp('cr.abre_marcador', {
        minuto:primerGol.minute,
        jugador:`<b>${escaparHTML(primerGol.jugador && primerGol.jugador.name || 'Jugador')}</b>`,
        equipo:escaparHTML(equipoPrimerGol), estadio:escaparHTML(datos.estadio||''),
      }));
    }

    // Párrafo 2: resto de goles, con jugador+equipo siempre identificados
    // y variando la frase para no repetir siempre el mismo verbo.
    if(goles.length>1){
      const verbos=[t('cr.verbo1'),t('cr.verbo2'),t('cr.verbo3'),t('cr.verbo4'),t('cr.verbo5'),t('cr.verbo6')];
      const resto=goles.slice(1).map((g,i)=>{
        const equipo = g.team==='home' ? nombreLocal : nombreVisitante;
        const verbo=verbos[i%verbos.length];
        return `<b>${escaparHTML(g.jugador && g.jugador.name || 'Jugador')}</b> (${escaparHTML(equipo)}) ${verbo} en el ${g.minute}'`;
      });
      const frase = resto.length===1 ? resto[0] : (resto.slice(0,-1).join(', ') + ' y ' + resto[resto.length-1]);
      parrafos.push(`${frase}, ${t('cr.no_dio_tregua')}`);
    }

    // Párrafo 3: cierre, con veredicto
    if(empate){
      parrafos.push(tp('cr.cierre_empate', {golesLocal, golesVisitante}));
    } else {
      parrafos.push(tp('cr.cierre_victoria', {
        ganador:`<b>${escaparHTML(equipoGanador)}</b>`, perdedor:escaparHTML(equipoPerdedor),
        golesGanador:Math.max(golesLocal,golesVisitante), golesPerdedor:Math.min(golesLocal,golesVisitante),
      }));
    }

    // Párrafo 4 (opcional): si hubo rueda de prensa previa esta
    // jornada, se menciona si la promesa se cumplió o no.
    if(datos.prensa && datos.prensa.outcome && datos.prensa.outcome!=='neutral' && datos.prensaEquipo){
      const clave = datos.prensa.outcome==='correct' ? 'cr.prensa_acierto' : 'cr.prensa_fallo';
      parrafos.push(tp(clave, {equipo:`<b>${escaparHTML(datos.prensaEquipo)}</b>`, promesa:escaparHTML(datos.prensa.label||'')}));
    }

    return parrafos.map(p=>`<p>${p}</p>`).join('\n');
  }

  // ---------- MVP: el goleador del gol decisivo si hay ganador claro,
  // si no el jugador con más goles del partido, y si tampoco hay
  // ninguno, el primer jugador de la alineación local. ----------
  function elegirMVP(datos){
    const goles=(datos.eventos||[]).filter(e=>e.type==='goal');
    if(!goles.length) return {nombre:'—', equipo:'', detalle:t('cr.sin_goles')};
    const ganaLocal=datos.golesLocal>datos.golesVisitante, ganaVisitante=datos.golesVisitante>datos.golesLocal;
    let candidatos=goles;
    if(ganaLocal) candidatos=goles.filter(g=>g.team==='home');
    else if(ganaVisitante) candidatos=goles.filter(g=>g.team==='away');
    const elegido = candidatos[candidatos.length-1] || goles[goles.length-1];
    const equipo = elegido.team==='home' ? datos.nombreLocal : datos.nombreVisitante;
    const numGoles = goles.filter(g=>g.jugador && elegido.jugador && g.jugador.name===elegido.jugador.name).length;
    return {
      nombre: (elegido.jugador && elegido.jugador.name) || 'Jugador',
      equipo,
      detalle: numGoles>1 ? tp('cr.goles_en_partido', {n:numGoles}) : t('cr.gol_decisivo'),
    };
  }

  function filaTarjetas(datos){
    const tarjetas=(datos.eventos||[]).filter(e=>e.type==='card').sort((a,b)=>a.minute-b.minute);
    if(!tarjetas.length) return '';
    const items=tarjetas.map(tj=>{
      const equipo = tj.team==='home' ? datos.nombreLocal : datos.nombreVisitante;
      const icono = tj.tarjeta==='roja' ? '🟥' : '🟨';
      return `<div class="incidencia-item">${icono} ${tj.minute}' <b>${escaparHTML(tj.jugador && tj.jugador.name || 'Jugador')}</b> <span>${escaparHTML(equipo)}</span></div>`;
    }).join('');
    return `<div class="incidencias"><div class="incidencias-titulo">${t('cr.amonestados')}</div>${items}</div>`;
  }

  function filaAlineacion(alineacion){
    if(!alineacion || !alineacion.length) return `<li>${t('cr.alineacion_no_disponible')}</li>`;
    const mejorNota = Math.max(...alineacion.map(j=>j.overall||0));
    return alineacion.map((j,i)=>{
      const nota=j.overall!=null?j.overall:null;
      const esTop = nota!=null && nota===mejorNota;
      return `<li><span class="jug-nombre">Nº${escaparHTML(j.numero!=null?j.numero:(i+1))} · ${escaparHTML(POS_ABREV[j.position]||j.position||'')} · ${escaparHTML(j.name||'—')}</span>${nota!=null?`<span class="jug-nota${esTop?' jug-nota-top':''}">${nota}</span>`:''}</li>`;
    }).join('');
  }

  // Media del equipo = media de los "overall" del once titular, misma
  // cuenta que la ficha "ONCE TITULAR" del propio juego.
  function mediaEquipo(alineacion){
    const validos=(alineacion||[]).filter(j=>j.overall!=null);
    if(!validos.length) return null;
    return Math.round(validos.reduce((s,j)=>s+j.overall,0)/validos.length);
  }
  function bloqueMediaEquipo(nombre, alineacion){
    const media=mediaEquipo(alineacion);
    return `<h4>${escaparHTML(nombre)}</h4>${media!=null?`<span class="equipo-media-inline">${media}<small>${t('cr.media')}</small></span>`:''}`;
  }

  // ---------- Generación del HTML completo ----------
  // datos = {
  //   nombreLocal, nombreVisitante, crestLocal, crestVisitante,
  //   golesLocal, golesVisitante, eventos:[...], jornada, temporada,
  //   estadio, espectadores, clima, posesionLocal, tirosLocal, tirosVisitante,
  //   cornersLocal, cornersVisitante, alineacionLocal:[...11], alineacionVisitante:[...11],
  //   prensa:{label, outcome:'correct'|'wrong'|'neutral'}, prensaEquipo,
  // }
  function generarHTML(datos){
    const cuerpoCronica = construirCronica(datos);
    const mvp = elegirMVP(datos);
    const tarjetasHTML = filaTarjetas(datos);
    const empate = datos.golesLocal===datos.golesVisitante;
    const ganaLocal = datos.golesLocal>datos.golesVisitante;
    const equipoGanador = empate ? null : (ganaLocal?datos.nombreLocal:datos.nombreVisitante);

    const titular = elegirTitular(datos);
    const entradilla = empate
      ? tp('cr.entradilla_empate', {local:escaparHTML(datos.nombreLocal), visitante:escaparHTML(datos.nombreVisitante), jornada:escaparHTML(datos.jornada||'')})
      : tp('cr.entradilla_mvp', {jugador:`<b>${escaparHTML(mvp.nombre)}</b>`, equipo:escaparHTML(mvp.equipo), ganador:escaparHTML(equipoGanador), jornada:escaparHTML(datos.jornada||'')});

    return `<!DOCTYPE html>
<html lang="${escaparHTML((typeof window!=='undefined'&&window.LANG)||'es')}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${t('cr.cronica_del_partido')} — GOAL 2 GOAT</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Oswald:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=PT+Serif:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
<style>${CSS_CRONICA}</style>
</head>
<body>

<div class="btn-imprimir-wrap">
  <button class="btn-imprimir" id="btnDescargarCronica" title="${escaparHTML(t('cr.imprimir_pdf'))}" aria-label="${escaparHTML(t('cr.imprimir_pdf'))}">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
  </button>
  <span>${escaparHTML(t('cr.imprimir_pdf'))}</span>
</div>

<div class="periodico">
  <div class="masthead">
    <hr class="regla-doble oro">
    <div class="wordmark-fila"><span class="wordmark">GOAL<span class="dos">2</span>GOAT</span></div>
  </div>
  <div class="subfranja">
    <span>Nº 001 · ${escaparHTML(t('cr.edicion_historica'))}</span>
    <span>${escaparHTML(tp('cr.liga_jornada', {jornada:datos.jornada||''}))}</span>
    ${datos.temporada?`<span>${escaparHTML(tp('cr.temporada', {temporada:datos.temporada}))}</span>`:'<span></span>'}
  </div>

  <div class="portada">
    <div class="eyebrow">${escaparHTML(t('cr.cronica_del_partido'))}</div>
    <h1 class="titular">${titular}</h1>

    <!-- Marcador destacado, para que el resultado se vea de un
         vistazo sin tener que bajar hasta la entrada de más abajo. -->
    <div class="resultado-destacado">
      <span class="rd-etiqueta">${escaparHTML(t('cr.resultado_final'))}</span>
      <div class="rd-fila">
        <span class="rd-equipo ${ganaLocal&&!empate?'rd-ganador':''}">${escaparHTML(datos.nombreLocal)}</span>
        <span class="rd-marcador">${datos.golesLocal} <i>–</i> ${datos.golesVisitante}</span>
        <span class="rd-equipo ${!ganaLocal&&!empate?'rd-ganador':''}">${escaparHTML(datos.nombreVisitante)}</span>
      </div>
    </div>

    <p class="entradilla">${entradilla}</p>
    <div class="firma-linea">
      <span>${escaparHTML(t('cr.por_redaccion'))}</span>
      <span>${escaparHTML(datos.estadio||'')} · ${datos.espectadores?escaparHTML(datos.espectadores)+' '+escaparHTML(t('cr.espectadores')):''}</span>
    </div>
  </div>

  <div class="hero-bloque">
    <div>
      <div class="foto-wrap">
        <img id="foto-hero" src="" alt="Jugada del partido">
        <div class="foto-marco"></div>
      </div>
      <div class="pie-foto"><b>${escaparHTML(datos.nombreLocal)}</b> · <b>${escaparHTML(datos.nombreVisitante)}</b></div>
    </div>

    <div class="entrada">
      <div class="entrada-cab">
        <div class="liga">${escaparHTML(tp('cr.liga_jornada', {jornada:datos.jornada||''}))}</div>
        <div class="equipos">${escaparHTML(datos.nombreLocal)}&nbsp;&nbsp;vs&nbsp;&nbsp;${escaparHTML(datos.nombreVisitante)}</div>
      </div>
      <div class="marcador-grande">${datos.golesLocal}<span>—</span>${datos.golesVisitante}</div>
      <div class="estado-final">${escaparHTML(t('cr.final'))}</div>
      <div class="stats-lista">
        ${datos.posesionLocal!=null?`<div class="stat-fila"><span class="nombre">${escaparHTML(t('cr.posesion'))}</span><span class="valor">${datos.posesionLocal}% – ${100-datos.posesionLocal}%</span></div>
        <div class="stat-barra"><i style="width:${datos.posesionLocal}%"></i></div>`:''}
        ${datos.tirosLocal!=null?`<div class="stat-fila"><span class="nombre">${escaparHTML(t('cr.tiros_puerta'))}</span><span class="valor">${datos.tirosLocal} – ${datos.tirosVisitante}</span></div>`:''}
        ${datos.cornersLocal!=null?`<div class="stat-fila"><span class="nombre">${escaparHTML(t('cr.corners'))}</span><span class="valor">${datos.cornersLocal} – ${datos.cornersVisitante}</span></div>`:''}
        ${datos.clima?`<div class="stat-fila"><span class="nombre">${escaparHTML(t('cr.clima'))}</span><span class="valor">${escaparHTML(datos.clima)}</span></div>`:''}
      </div>
      ${tarjetasHTML}
    </div>
  </div>

  <div class="cuerpo"><div class="columnas">${cuerpoCronica}</div></div>

  <div class="franja-mvp">
    <div class="mini-titulo">${escaparHTML(t('cr.mvp_partido'))}</div>
    <div class="mvp-fila">
      <div>
        <div class="mvp-nombre">${escaparHTML(mvp.nombre)}</div>
        <div class="mvp-equipo">${escaparHTML(mvp.equipo)}</div>
      </div>
      <div class="mvp-detalle">${escaparHTML(mvp.detalle)}</div>
    </div>
  </div>
  <div class="franja-alineaciones">
    <div class="mini-titulo">${escaparHTML(t('cr.alineaciones_titulo'))}</div>
    <div class="alineacion-cols">
      <div>${bloqueMediaEquipo(datos.nombreLocal, datos.alineacionLocal)}<ol>${filaAlineacion(datos.alineacionLocal)}</ol></div>
      <div>${bloqueMediaEquipo(datos.nombreVisitante, datos.alineacionVisitante)}<ol>${filaAlineacion(datos.alineacionVisitante)}</ol></div>
    </div>
  </div>

  <div class="pie-periodico">
    <div class="texto">${escaparHTML(t('cr.pie_goal2goat'))}</div>
  </div>
</div>

<script>
  const IMAGENES_DISPONIBLES = ${JSON.stringify(
    datos.resultadoJugador==='derrota' ? IMAGENES_DERROTA :
    datos.resultadoJugador==='victoria' ? IMAGENES_VICTORIA :
    IMAGENES_GENERAL
  )};
  document.getElementById('foto-hero').src = IMAGENES_DISPONIBLES[Math.floor(Math.random() * IMAGENES_DISPONIBLES.length)];

  // Guardar como imagen en vez de PDF: se captura tal cual se ve en
  // pantalla el "periódico" (con html2canvas, cargado en el <head>) y
  // se descarga directamente como JPG — mejor relación calidad/peso
  // que un PNG para una página con tanto texto y una sola foto, sin
  // artefactos visibles a esta calidad (.92).
  (function(){
    const btn = document.getElementById('btnDescargarCronica');
    const etiqueta = document.querySelector('.btn-imprimir-wrap span');
    if(!btn) return;
    const textoOriginal = etiqueta ? etiqueta.textContent : '';
    btn.addEventListener('click', function(){
      if(btn.disabled) return;
      if(typeof html2canvas!=='function'){
        // Sin conexión al CDN por lo que sea: no dejar el botón
        // muerto sin explicación, caer de vuelta al diálogo de
        // impresión nativo del navegador (que sí puede guardar como
        // PDF sin depender de nada externo).
        window.print();
        return;
      }
      btn.disabled = true;
      if(etiqueta) etiqueta.textContent = ${JSON.stringify(t('cr.generando_imagen'))};
      const periodico = document.querySelector('.periodico');
      // Espera a que las tipografías de Google Fonts hayan terminado
      // de cargar de verdad antes de capturar — si el jugador pulsa
      // el botón nada más abrirse la crónica, sin esto podía
      // capturarse un instante con la tipografía de reserva del
      // sistema en vez de la real.
      const listoTipografias = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
      // scale:2 para que el texto salga nítido en pantallas de alta
      // densidad (retina) en vez de un poco borroso — el peso extra
      // lo compensa igualmente la compresión JPG de abajo.
      listoTipografias.then(function(){
        return html2canvas(periodico, {scale:2, backgroundColor:'#f0efed', useCORS:true});
      }).then(function(canvas){
        const enlace = document.createElement('a');
        enlace.download = 'cronica-goal2goat.jpg';
        enlace.href = canvas.toDataURL('image/jpeg', 0.92);
        enlace.click();
      }).catch(function(err){
        console.error('Error generando la imagen de la crónica:', err);
        window.print();
      }).finally(function(){
        btn.disabled = false;
        if(etiqueta) etiqueta.textContent = textoOriginal;
      });
    });
  })();
</script>
</body>
</html>`;
  }

  const CSS_CRONICA = `
  :root{ --papel:#f0efed; --tinta:#1a1a1a; --tinta-suave:#3a3836; --gris-agata:#6b6862; --gris-linea:#c9c6bf; --oro:#ae8b4c; --rojo-marcador:#8c2f2f; }
  *{box-sizing:border-box} html,body{margin:0;padding:0}
  body{ background:#d8d5cd; font-family:'PT Serif',Georgia,serif; color:var(--tinta); padding:36px 16px; display:flex; justify-content:center; }
  .btn-imprimir-wrap{ position:fixed; top:26px; left:calc(50% + 450px + 18px); display:flex; flex-direction:column; align-items:center; gap:7px; z-index:50; }
  .btn-imprimir{ width:48px; height:48px; border-radius:50%; background:var(--tinta); color:var(--papel); border:none; display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 4px 14px rgba(0,0,0,.35); transition:transform .15s ease, background .15s ease; }
  .btn-imprimir:hover{ background:var(--rojo-marcador); transform:translateY(-2px); }
  .btn-imprimir svg{ width:21px; height:21px; }
  .btn-imprimir-wrap span{ font-family:'Oswald',sans-serif; font-size:9px; letter-spacing:1.3px; text-transform:uppercase; color:var(--gris-agata); text-align:center; width:76px; }
  @media (max-width: 1060px){ .btn-imprimir-wrap{ top:auto; bottom:26px; left:auto; right:26px; } }
  .periodico{ width:100%; max-width:900px; background:var(--papel); box-shadow:0 2px 4px rgba(0,0,0,.15), 0 24px 60px rgba(0,0,0,.35); position:relative; overflow:hidden; }
  .masthead{ padding:26px 34px 0; }
  .regla-doble{ border:none; border-top:2.5px solid var(--tinta); border-bottom:1px solid var(--tinta); height:5px; margin:0; }
  .regla-doble.oro{ border-top-color:var(--oro); }
  .wordmark-fila{ display:flex; align-items:center; justify-content:center; padding:14px 0 10px; }
  .wordmark{ font-family:'Oswald',sans-serif; font-weight:700; font-style:italic; font-size:40px; letter-spacing:1px; text-transform:uppercase; color:var(--tinta); transform:skewX(-6deg); display:flex; gap:8px; }
  .wordmark .dos{ color:var(--oro); }
  .subfranja{ display:flex; align-items:center; justify-content:space-between; font-family:'Oswald',sans-serif; font-weight:500; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:var(--gris-agata); padding:9px 34px; border-top:1px solid var(--tinta); border-bottom:1px solid var(--tinta); }
  .subfranja span:nth-child(2){ color:var(--tinta); font-weight:600; }
  .portada{ padding:24px 34px 6px; }
  .eyebrow{ font-family:'Oswald',sans-serif; font-weight:600; font-size:12.5px; letter-spacing:3px; text-transform:uppercase; color:var(--rojo-marcador); margin-bottom:8px; display:flex; align-items:center; gap:9px; }
  .eyebrow::before{ content:''; width:26px; height:2px; background:var(--rojo-marcador); }
  h1.titular{ font-family:'Anton',sans-serif; font-weight:400; text-transform:uppercase; font-size:44px; line-height:0.98; letter-spacing:.5px; margin:0 0 13px; }
  .resultado-destacado{ background:var(--tinta); color:var(--papel); padding:12px 20px; margin:0 0 16px; display:flex; flex-direction:column; align-items:center; gap:4px; }
  .rd-etiqueta{ font-family:'Oswald',sans-serif; font-size:9.5px; letter-spacing:2.5px; color:var(--oro); }
  .rd-fila{ display:flex; align-items:center; gap:16px; width:100%; justify-content:center; }
  .rd-equipo{ font-family:'Oswald',sans-serif; font-weight:500; font-size:13px; text-transform:uppercase; letter-spacing:.5px; color:#bbb; flex:1; text-align:center; }
  .rd-equipo.rd-ganador{ color:#fff; font-weight:700; }
  .rd-marcador{ font-family:'Anton',sans-serif; font-size:30px; letter-spacing:1px; flex-shrink:0; white-space:nowrap; }
  .rd-marcador i{ font-style:normal; color:var(--oro); margin:0 4px; }
  p.entradilla{ font-style:italic; font-size:17px; line-height:1.45; color:var(--tinta-suave); max-width:660px; margin:0 0 4px; border-left:3px solid var(--oro); padding-left:16px; }
  .firma-linea{ display:flex; justify-content:space-between; align-items:baseline; font-family:'Oswald',sans-serif; font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:var(--gris-agata); margin:14px 0 0; }
  .firma-linea b{ color:var(--tinta); font-weight:600; }
  .hero-bloque{ display:flex; gap:22px; padding:18px 34px 8px; }
  .hero-bloque > div:first-child{ flex:1; min-width:0; }
  .foto-wrap{ position:relative; }
  .foto-wrap img{ width:100%; display:block; filter:contrast(1.04) saturate(0.96); }
  .foto-marco{ position:absolute; inset:0; border:1px solid rgba(0,0,0,.5); pointer-events:none; }
  .pie-foto{ font-family:'Oswald',sans-serif; font-size:11px; color:var(--gris-agata); padding-top:6px; line-height:1.4; border-top:1px solid var(--gris-linea); }
  .pie-foto b{ color:var(--tinta-suave); font-weight:500; }
  .entrada{ width:226px; flex-shrink:0; background:var(--papel); border:1.5px solid var(--tinta); position:relative; font-family:'Oswald',sans-serif; }
  .entrada-cab{ text-align:center; padding:14px 10px 9px; border-bottom:1px dashed var(--gris-linea); }
  .entrada-cab .liga{ font-size:9.5px; letter-spacing:2px; color:var(--gris-agata); text-transform:uppercase; }
  .entrada-cab .equipos{ font-size:12.5px; font-weight:600; text-transform:uppercase; margin:7px 0 3px; }
  .marcador-grande{ font-family:'Anton',sans-serif; font-size:42px; letter-spacing:1px; color:var(--rojo-marcador); text-align:center; padding:9px 0 3px; line-height:1; }
  .marcador-grande span{ font-size:21px; color:var(--gris-agata); margin:0 6px; font-family:'Oswald',sans-serif; }
  .estado-final{ text-align:center; font-size:9.5px; letter-spacing:2px; color:var(--gris-agata); text-transform:uppercase; padding-bottom:11px; border-bottom:1px dashed var(--gris-linea); }
  .stats-lista{ padding:11px 16px 8px; display:flex; flex-direction:column; gap:8px; }
  .stat-fila{ display:flex; justify-content:space-between; font-size:11px; }
  .stat-fila .nombre{ color:var(--gris-agata); letter-spacing:1px; text-transform:uppercase; font-size:9.5px; }
  .stat-fila .valor{ font-weight:600; }
  .stat-barra{ height:4px; background:var(--gris-linea); position:relative; margin-top:3px; }
  .stat-barra i{ position:absolute; left:0; top:0; bottom:0; background:var(--oro); }
  .incidencias{ padding:2px 16px 16px; border-top:1px dashed var(--gris-linea); }
  .incidencias-titulo{ font-size:9px; letter-spacing:1.3px; text-transform:uppercase; color:var(--gris-agata); padding:10px 0 7px; }
  .incidencia-item{ font-size:10.5px; line-height:1.8; display:flex; justify-content:space-between; gap:6px; }
  .incidencia-item b{ font-weight:600; }
  .incidencia-item span{ color:var(--gris-agata); font-size:9px; text-transform:uppercase; white-space:nowrap; }
  .cuerpo{ padding:18px 34px 6px; border-top:1px solid var(--tinta); margin-top:16px; }
  .columnas{ columns:3; column-gap:26px; column-rule:1px solid var(--gris-linea); font-size:13.5px; line-height:1.55; color:var(--tinta-suave); text-align:justify; }
  .columnas p{ margin:0 0 11px; }
  .columnas p:first-of-type::first-letter{ font-family:'Anton',sans-serif; font-size:50px; line-height:.8; float:left; margin:4px 6px 0 0; color:var(--tinta); }
  .columnas b{ color:var(--tinta); font-weight:700; }
  .franja-mvp{ border-top:1px solid var(--tinta); margin:4px 34px 0; padding:14px 20px; }
  .mini-titulo{ font-family:'Oswald',sans-serif; font-weight:700; font-size:10.5px; letter-spacing:2.5px; text-transform:uppercase; color:var(--rojo-marcador); margin:0 0 9px; }
  .mvp-fila{ display:flex; align-items:baseline; justify-content:space-between; gap:14px; flex-wrap:wrap; }
  .mvp-nombre{ font-family:'Anton',sans-serif; font-size:20px; text-transform:uppercase; }
  .mvp-equipo{ font-family:'Oswald',sans-serif; font-size:10.5px; letter-spacing:1.5px; text-transform:uppercase; color:var(--oro); font-weight:600; }
  .mvp-detalle{ font-family:'Oswald',sans-serif; font-size:11px; color:var(--gris-agata); white-space:nowrap; }
  .franja-alineaciones{ border-top:1px solid var(--gris-linea); margin:0 34px; padding:14px 20px 18px; }
  .alineacion-cols{ display:flex; gap:30px; font-family:'Oswald',sans-serif; font-size:11.5px; }
  .alineacion-cols > div{ flex:1; min-width:0; }
  .alineacion-cols h4{ margin:0 0 3px; font-size:10px; letter-spacing:1.5px; text-transform:uppercase; color:var(--tinta); font-weight:600; }
  .equipo-media-inline{ display:block; margin:0 0 6px; padding-bottom:6px; border-bottom:1px solid var(--gris-linea); font-family:'Anton',sans-serif; letter-spacing:.5px; color:var(--oro); font-size:16px; }
  .equipo-media-inline small{ font-family:'Oswald',sans-serif; font-size:8px; letter-spacing:1px; color:var(--gris-agata); font-weight:500; margin-left:4px; }
  .alineacion-cols ol{ margin:0; padding:0 0 0 16px; color:var(--tinta-suave); }
  .alineacion-cols li{ display:flex; align-items:baseline; justify-content:space-between; gap:8px; padding:3.5px 0; }
  .alineacion-cols li:not(:last-child){ border-bottom:1px solid rgba(0,0,0,.05); }
  .jug-nombre{ flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .jug-nota{ font-weight:600; color:var(--tinta); flex-shrink:0; font-variant-numeric:tabular-nums; }
  .jug-nota-top{ color:var(--oro); }
  .pie-periodico{ padding:16px 34px 24px; text-align:center; }
  .pie-periodico .texto{ font-family:'Oswald',sans-serif; font-size:9.5px; letter-spacing:2px; text-transform:uppercase; color:var(--gris-agata); }
  @media (max-width:720px){
    h1.titular{ font-size:32px; } .hero-bloque{ flex-direction:column; } .entrada{ width:100%; margin:0; }
    .rd-marcador{ font-size:24px; } .rd-fila{ gap:8px; } .rd-equipo{ font-size:11px; }
    .columnas{ columns:1; } .alineacion-cols{ flex-direction:column; gap:16px; } .mvp-fila{ flex-direction:column; align-items:flex-start; gap:4px; }
    .wordmark{ font-size:30px; } .subfranja{ padding:9px 18px; font-size:9.5px; }
    .masthead,.portada,.hero-bloque,.cuerpo{ padding-left:18px; padding-right:18px; } .franja-mvp,.franja-alineaciones{ margin-left:18px; margin-right:18px; }
  }
  @media print{ body{ background:#d8d5cd; padding:0; display:block; -webkit-print-color-adjust:exact; print-color-adjust:exact; } .btn-imprimir-wrap{ display:none; } .periodico{ box-shadow:none; max-width:none; width:100%; -webkit-print-color-adjust:exact; print-color-adjust:exact; } @page{ margin:12mm; } }
  `;

  window.G2G_Cronica = { generarHTML, construirCronica, elegirMVP, elegirTitular };

})();
