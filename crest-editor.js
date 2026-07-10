/* ═══════════════════════════════════════════════════════════════
   ESCUDO PERSONALIZADO — archivo separado de game.js (extraído tal
   cual, sin cambios de comportamiento) como parte del plan de dividir
   el proyecto en archivos más pequeños y manejables. Se carga como
   un <script> normal justo después de game.js, compartiendo el mismo
   ámbito global — el resto del juego lo sigue viendo exactamente
   igual que antes de moverlo aquí.
   ═══════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════
   ESCUDO PERSONALIZADO — el jugador diseña el escudo de su equipo
   combinando 3 capas (forma+fondo, icono, detalle de rango). Se
   guarda en el perfil (Firestore + caché local) y sustituye a la
   cabra 🐐 en la cabecera de partido en modo un jugador, además de
   mostrarse en miniatura en el perfil.
   ═══════════════════════════════════════════════════════════════ */
const CREST_COLORS = ['#f0c419','#e74c3c','#2ecc71','#3498db','#9b59b6','#1a1a1a','#ffffff','#e67e22','#1abc9c','#34495e','#e91e63','#795548'];

const CREST_SHAPES = {
  classic: 'M100 10 L180 35 V95 C180 145 145 175 100 195 C55 175 20 145 20 95 V35 Z',
  round:   'M100 10 A90 90 0 1 1 99.99 10 Z',
  modern:  'M100 12 L175 45 L175 120 C175 165 140 188 100 196 C60 188 25 165 25 120 L25 45 Z',
  banner:  'M25 20 H175 V150 L100 190 L25 150 Z',
  hexagon: 'M100 8 L182 55 V145 L100 192 L18 145 V55 Z',
  diamond: 'M100 6 L194 100 L100 194 L6 100 Z',
  oval:    'M100 6 C150 6 176 46 176 100 C176 154 150 194 100 194 C50 194 24 154 24 100 C24 46 50 6 100 6 Z',
  arch:    'M20 190 V70 C20 25 60 6 100 6 C140 6 180 25 180 70 V190 Z',
};
const CREST_SHAPE_KEYS = ['ninguno', ...Object.keys(CREST_SHAPES)];
const CREST_SHAPE_LABELS = {ninguno:'Ninguno',classic:'Clásico',round:'Redondo',modern:'Moderno',banner:'Bandera',hexagon:'Hexágono',diamond:'Rombo',oval:'Óvalo',arch:'Arco'};

const CREST_PATTERNS = ['solid','stripes','half','quarters','diagonal','border','dots','cross'];
const CREST_PATTERN_LABELS = {solid:'Liso',stripes:'Rayas',half:'Mitad',quarters:'Cuartos',diagonal:'Diagonal',border:'Borde',dots:'Lunares',cross:'Cruz'};

const CREST_ICONS = [
  'ninguno','ph-star','ph-crown','ph-shield','ph-lightning','ph-trophy',
  'ph-fire','ph-mountains','ph-anchor','ph-sword','ph-horse','ph-bird',
  'ph-cat','ph-tree','ph-sun','ph-waves','ph-diamonds-four','ph-medal',
  'ph-skull','ph-rocket','ph-fish','ph-moon-stars','ph-globe','ph-hand-fist',
  'ph-flag','ph-compass','ph-heart','ph-hand-peace','ph-basketball','ph-eye',
];
// "ph-bat" y "ph-dragon" no existían de verdad en Phosphor (por eso salían
// vacíos) — los quité y puse "ph-heart" (pedido) y "ph-eye" en su lugar.

const CREST_RANKS = ['ninguno','laurel','ph-crown','ph-star','ph-trophy','ph-medal','ph-seal-check','ph-flag','ph-shield-star'];
const CREST_RANK_LABELS = {
  ninguno:'Ninguno', laurel:'Laurel', 'ph-crown':'Corona', 'ph-star':'Estrella', 'ph-trophy':'Copa',
  'ph-medal':'Medalla', 'ph-seal-check':'Sello', 'ph-flag':'Bandera', 'ph-shield-star':'Escudo'
};

function defaultCrestData(){
  return {
    shape:'classic', pattern:'solid', bgColor:'#1a1a1a', bg2Color:'#f0c419', shapeScale:100, shapeRotate:0,
    icon:'ph-star', iconColor:'#f0c419', iconScale:100, iconRotate:0, iconX:0, iconY:0,
    rank:'ninguno', rankColor:'#f0c419', rankScale:100, rankRotate:0, rankX:0, rankY:0,
  };
}

const CREST_STAR_PATH = 'M0 -9 L2.6 -2.8 9 -2.8 3.8 1.1 5.9 7.7 0 3.8 -5.9 7.7 -3.8 1.1 -9 -2.8 -2.6 -2.8 Z';

function buildCrestBackgroundLayer(d){
  const shapeKey = d.shape;
  const path = CREST_SHAPES[shapeKey];
  if(!path) return {defs:'', inner:''};
  let defsExtra = '';
  let fillAttr = d.bgColor;

  if(d.pattern==='stripes'){
    defsExtra = `<pattern id="pat" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="22" height="22" fill="${d.bgColor}"/><rect width="11" height="22" fill="${d.bg2Color}"/>
    </pattern>`;
    fillAttr = 'url(#pat)';
  } else if(d.pattern==='dots'){
    defsExtra = `<pattern id="pat" width="24" height="24" patternUnits="userSpaceOnUse">
      <rect width="24" height="24" fill="${d.bgColor}"/><circle cx="12" cy="12" r="5" fill="${d.bg2Color}"/>
    </pattern>`;
    fillAttr = 'url(#pat)';
  }

  const clipDef = `<clipPath id="crestClipShape"><path d="${path}"/></clipPath>`;
  let inner = '';
  if(d.pattern==='solid' || d.pattern==='stripes' || d.pattern==='dots'){
    inner = `<path d="${path}" fill="${fillAttr}" stroke="#000" stroke-width="3" stroke-opacity=".25"/>`;
  } else if(d.pattern==='half'){
    inner = `<g clip-path="url(#crestClipShape)">
      <rect x="0" y="0" width="100" height="200" fill="${d.bgColor}"/>
      <rect x="100" y="0" width="100" height="200" fill="${d.bg2Color}"/>
    </g><path d="${path}" fill="none" stroke="#000" stroke-width="3" stroke-opacity=".25"/>`;
  } else if(d.pattern==='quarters'){
    inner = `<g clip-path="url(#crestClipShape)">
      <rect x="0" y="0" width="100" height="100" fill="${d.bgColor}"/>
      <rect x="100" y="0" width="100" height="100" fill="${d.bg2Color}"/>
      <rect x="0" y="100" width="100" height="100" fill="${d.bg2Color}"/>
      <rect x="100" y="100" width="100" height="100" fill="${d.bgColor}"/>
    </g><path d="${path}" fill="none" stroke="#000" stroke-width="3" stroke-opacity=".25"/>`;
  } else if(d.pattern==='diagonal'){
    inner = `<g clip-path="url(#crestClipShape)">
      <rect x="0" y="0" width="200" height="200" fill="${d.bgColor}"/>
      <polygon points="0,0 200,0 0,200" fill="${d.bg2Color}"/>
    </g><path d="${path}" fill="none" stroke="#000" stroke-width="3" stroke-opacity=".25"/>`;
  } else if(d.pattern==='cross'){
    inner = `<g clip-path="url(#crestClipShape)">
      <rect x="0" y="0" width="200" height="200" fill="${d.bgColor}"/>
      <rect x="78" y="0" width="44" height="200" fill="${d.bg2Color}"/>
      <rect x="0" y="78" width="200" height="44" fill="${d.bg2Color}"/>
    </g><path d="${path}" fill="none" stroke="#000" stroke-width="3" stroke-opacity=".25"/>`;
  } else if(d.pattern==='border'){
    inner = `<path d="${path}" fill="${d.bg2Color}"/>
      <g transform="translate(100 100) scale(0.86) translate(-100 -100)"><path d="${path}" fill="${d.bgColor}"/></g>`;
  }
  return {defs: clipDef + defsExtra, inner};
}

function buildCrestRankLayer(d){
  if(!d.rank || d.rank==='ninguno') return '';
  const scale = (d.rankScale||100)/100;
  const tx = d.rankX||0, ty = d.rankY||0;
  const rot = d.rankRotate||0;
  const rc = d.rankColor||'#f0c419';

  if(d.rank==='laurel'){
    const leaf = (x,y,r)=>`<ellipse cx="${x}" cy="${y}" rx="6" ry="3" fill="${rc}" stroke="#000" stroke-opacity=".2" stroke-width=".6" transform="rotate(${r} ${x} ${y})"/>`;
    let leaves = '';
    for(let i=0;i<5;i++){
      const yy = -i*11;
      leaves += leaf(-30+i*2, yy, -40+i*6);
      leaves += leaf(30-i*2, yy, 40-i*6);
    }
    return `<g transform="translate(${100+tx} ${172+ty}) rotate(${rot}) scale(${scale})">${leaves}</g>`;
  }

  const box = 46 * scale;
  const cx = 100 + tx, cy = 26 + ty;
  return `<foreignObject x="${cx-box/2}" y="${cy-box/2}" width="${box}" height="${box}" transform="rotate(${rot} ${cx} ${cy})">
    <div xmlns="http://www.w3.org/1999/xhtml" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:${rc};font-size:${box*0.8}px;filter:drop-shadow(0 1px 2px rgba(0,0,0,.5))"><i class="ph ph-bold ${d.rank}"></i></div>
  </foreignObject>`;
}

function buildCrestSVGInner(d){
  if(!d) d = defaultCrestData();
  let defs = '', bgLayer = '';
  if(d.shape && d.shape!=='ninguno'){
    const bg = buildCrestBackgroundLayer(d);
    defs = bg.defs;
    const shapeScaleF = (d.shapeScale||100)/100;
    bgLayer = `<g transform="translate(100 100) rotate(${d.shapeRotate||0}) scale(${shapeScaleF}) translate(-100 -100)">${bg.inner}</g>`;
  }
  const rankLayer = buildCrestRankLayer(d);
  let iconLayer = '';
  if(d.icon && d.icon!=='ninguno'){
    const iScale = (d.iconScale||100)/100;
    const iconBoxSize = 90*iScale;
    const iconX = 100+(d.iconX||0)-iconBoxSize/2;
    const iconY = 100+(d.iconY||0)-iconBoxSize/2;
    const iconCx = 100+(d.iconX||0), iconCy = 100+(d.iconY||0);
    iconLayer = `<foreignObject x="${iconX}" y="${iconY}" width="${iconBoxSize}" height="${iconBoxSize}" transform="rotate(${d.iconRotate||0} ${iconCx} ${iconCy})">
      <div xmlns="http://www.w3.org/1999/xhtml" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center">
        <i class="ph ph-bold ${d.icon}" style="color:${d.iconColor};font-size:${58*iScale}px;filter:drop-shadow(0 2px 3px rgba(0,0,0,.5))"></i>
      </div>
    </foreignObject>`;
  }
  return `<defs>${defs}</defs>${bgLayer}${rankLayer}${iconLayer}`;
}

function renderCrestInto(svgEl, data){
  if(!svgEl) return;
  try{ svgEl.innerHTML = buildCrestSVGInner(data); }
  catch(e){ console.error('[Escudo] error al dibujar:', e); }
}

/* Miniatura del escudo actual, para usar en la cabecera de partido y
   en las esquinas del perfil. Si no hay escudo guardado, no pinta
   nada (el llamador debe mostrar el emoji de cabra como hasta ahora). */
function renderCrestThumb(sizePx, data){
  // Si el usuario subió una imagen propia, esa tiene prioridad sobre
  // el escudo por capas — son dos modos que no conviven a la vez.
  if(!data && window._myCrestImage){
    return `<img src="${window._myCrestImage}" class="crest-thumb-svg" style="width:${sizePx}px;height:${sizePx}px;display:inline-block;vertical-align:middle;border-radius:4px;object-fit:cover">`;
  }
  data = data || window._myCrestData;
  if(!data) return '';
  return `<svg viewBox="0 0 200 200" style="width:${sizePx}px;height:${sizePx}px;display:inline-block;vertical-align:middle" class="crest-thumb-svg">${buildCrestSVGInner(data)}</svg>`;
}
function renderRivalCrestThumb(sizePx){
  if(window._rivalCrestImage){
    return `<img src="${window._rivalCrestImage}" class="crest-rival-thumb-svg" style="width:${sizePx}px;height:${sizePx}px;display:inline-block;vertical-align:middle;border-radius:4px;object-fit:cover">`;
  }
  if(!window._rivalCrestData) return '';
  return `<svg viewBox="0 0 200 200" style="width:${sizePx}px;height:${sizePx}px;display:inline-block;vertical-align:middle" class="crest-rival-thumb-svg">${buildCrestSVGInner(window._rivalCrestData)}</svg>`;
}
function refreshAllCrestThumbs(){
  document.querySelectorAll('.crest-thumb-svg').forEach(el=>{
    const sizePx = parseInt(el.style.width)||36;
    el.outerHTML = renderCrestThumb(sizePx);
  });
  document.querySelectorAll('.crest-rival-thumb-svg').forEach(el=>{
    const sizePx = parseInt(el.style.width)||36;
    el.outerHTML = renderRivalCrestThumb(sizePx);
  });
  document.querySelectorAll('.crest-header-icon').forEach(el=>{
    el.innerHTML = (window._myCrestData||window._myCrestImage)
      ? renderCrestThumb(36)
      : '<i class="ph ph-bold ph-user" style="font-size:22px;color:#7b9cff"></i>';
  });
}

/* Cargar el escudo guardado (caché local instantánea + Firestore real) */
/* Ventana de confirmación reutilizable (mismo diseño que "borrar
   escudo") — evita depender de confirm() nativo, que no funciona
   dentro del WebView de Android sin configuración extra. */
function showConfirmPopup(message, onConfirm, confirmLabel){
  const confirmOv = document.createElement('div');
  confirmOv.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:80000;display:flex;align-items:center;justify-content:center;padding:20px';
  confirmOv.innerHTML = `
    <div style="background:var(--card-bg);border:2px solid #e74c3c;border-radius:8px;padding:20px;max-width:320px;text-align:center">
      <p style="color:var(--text);font-size:13px;margin:0 0 16px">${message}</p>
      <div style="display:flex;gap:10px">
        <button id="genConfirmCancel" style="flex:1;background:none;border:1px solid var(--line);color:var(--text);border-radius:6px;padding:8px;cursor:pointer;font-family:'Bebas Neue',Impact,sans-serif;letter-spacing:1px">CANCELAR</button>
        <button id="genConfirmYes" style="flex:1;background:#e74c3c;border:none;color:#fff;border-radius:6px;padding:8px;cursor:pointer;font-family:'Bebas Neue',Impact,sans-serif;letter-spacing:1px">${confirmLabel||'OK'}</button>
      </div>
    </div>`;
  document.body.appendChild(confirmOv);
  document.getElementById('genConfirmCancel').addEventListener('click', ()=>{ playSound('select'); confirmOv.remove(); });
  document.getElementById('genConfirmYes').addEventListener('click', ()=>{
    playSound('select');
    confirmOv.remove();
    onConfirm();
  });
}

function loadMyCrestData(){
  try{
    const cached = localStorage.getItem('g2g_crest_data');
    if(cached) window._myCrestData = JSON.parse(cached);
    const cachedImg = localStorage.getItem('g2g_crest_image');
    if(cachedImg) window._myCrestImage = cachedImg;
  }catch(e){}
  const auth = window._fbAuth, db = window._fbDb;
  const user = auth && auth.currentUser;
  if(user && db){
    db.collection('users').doc(user.uid).get().then(snap=>{
      const data = snap.exists ? snap.data() : {};
      if(data.customCrestImage){
        window._myCrestImage = data.customCrestImage;
        window._myCrestData = null;
        try{ localStorage.setItem('g2g_crest_image', data.customCrestImage); localStorage.removeItem('g2g_crest_data'); }catch(e){}
      }else if(data.customCrest){
        window._myCrestData = data.customCrest;
        window._myCrestImage = null;
        try{ localStorage.setItem('g2g_crest_data', JSON.stringify(data.customCrest)); localStorage.removeItem('g2g_crest_image'); }catch(e){}
      }
      refreshAllCrestThumbs();
    }).catch(e=>console.error('[Escudo] carga falló:', e));
  }
}

async function saveMyCrestData(data){
  window._myCrestData = data;
  window._myCrestImage = null; // el editor por capas y la imagen subida no conviven — se borra la anterior
  try{ localStorage.setItem('g2g_crest_data', JSON.stringify(data)); localStorage.removeItem('g2g_crest_image'); }catch(e){}
  const auth = window._fbAuth, db = window._fbDb;
  const user = auth && auth.currentUser;
  if(user && db){
    try{ await db.collection('users').doc(user.uid).set({customCrest:data, customCrestImage: firebase.firestore.FieldValue.delete()}, {merge:true}); }
    catch(e){ console.error('[Escudo] guardado falló:', e); }
  }
  refreshAllCrestThumbs();
}

/* Guardar una imagen subida por el usuario como escudo — sustituye por
   completo al escudo por capas (se borra el anterior, nunca conviven
   los dos a la vez, tal como se guarda solo un campo por usuario). */
async function saveMyCrestImage(dataUrl){
  window._myCrestImage = dataUrl;
  window._myCrestData = null;
  try{ localStorage.setItem('g2g_crest_image', dataUrl); localStorage.removeItem('g2g_crest_data'); }catch(e){}
  const auth = window._fbAuth, db = window._fbDb;
  const user = auth && auth.currentUser;
  if(user && db){
    try{ await db.collection('users').doc(user.uid).set({customCrestImage:dataUrl, customCrest: firebase.firestore.FieldValue.delete()}, {merge:true}); }
    catch(e){ console.error('[Escudo] guardado de imagen falló:', e); }
  }
  refreshAllCrestThumbs();
}

async function resetMyCrestData(){
  window._myCrestData = null;
  window._myCrestImage = null;
  try{ localStorage.removeItem('g2g_crest_data'); localStorage.removeItem('g2g_crest_image'); }catch(e){}
  const auth = window._fbAuth, db = window._fbDb;
  const user = auth && auth.currentUser;
  if(user && db){
    try{ await db.collection('users').doc(user.uid).set({customCrest: firebase.firestore.FieldValue.delete(), customCrestImage: firebase.firestore.FieldValue.delete()}, {merge:true}); }
    catch(e){ console.error('[Escudo] borrado falló:', e); }
  }
  refreshAllCrestThumbs();
  return null;
}

/* ===== Recortador de imagen subida (selección 1:1) ===== */
function openCrestCropModal(imageDataUrl, parentOverlay){
  const VIEWPORT = 260; // tamaño del visor cuadrado, en px de pantalla
  const OUTPUT = 300;   // resolución del PNG final guardado

  const cropOv = document.createElement('div');
  cropOv.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:71000;display:flex;align-items:center;justify-content:center;padding:16px';
  cropOv.innerHTML = `
    <div style="width:100%;max-width:340px;background:var(--card-bg);border:2px solid var(--gold);border-radius:8px;padding:18px;box-sizing:border-box;text-align:center">
      <h2 style="font-family:'Bebas Neue',Impact,sans-serif;letter-spacing:1px;color:var(--gold);font-size:15px;margin:0 0 12px">RECORTAR IMAGEN</h2>
      <div id="cropViewport" style="width:${VIEWPORT}px;height:${VIEWPORT}px;margin:0 auto;border-radius:8px;overflow:hidden;position:relative;background:#000;touch-action:none;cursor:grab">
        <img id="cropImg" src="${imageDataUrl}" style="position:absolute;top:0;left:0;transform-origin:0 0;user-select:none;-webkit-user-drag:none">
      </div>
      <input type="range" id="cropZoom" min="1" max="3" step="0.01" value="1" style="width:100%;margin-top:14px;accent-color:var(--gold)">
      <div style="font-size:10px;color:var(--text-muted);margin-top:2px">Arrastra para mover · desliza para acercar</div>
      <div style="display:flex;gap:10px;margin-top:16px">
        <button id="cropCancelBtn" style="flex:1;background:none;border:1px solid var(--line);color:var(--text);border-radius:6px;padding:9px;cursor:pointer;font-family:'Bebas Neue',Impact,sans-serif;letter-spacing:1px">CANCELAR</button>
        <button id="cropConfirmBtn" style="flex:1;background:var(--gold);border:none;color:#000;border-radius:6px;padding:9px;cursor:pointer;font-family:'Bebas Neue',Impact,sans-serif;letter-spacing:1px">CONFIRMAR</button>
      </div>
    </div>`;
  document.body.appendChild(cropOv);

  const viewport = document.getElementById('cropViewport');
  const img = document.getElementById('cropImg');
  const zoomSlider = document.getElementById('cropZoom');
  let baseScale=1, naturalW=0, naturalH=0, zoom=1, offsetX=0, offsetY=0;
  let dragging=false, dragStartX=0, dragStartY=0, dragOffX=0, dragOffY=0;

  function clampOffsets(){
    const dispW = naturalW*baseScale*zoom, dispH = naturalH*baseScale*zoom;
    offsetX = Math.min(0, Math.max(VIEWPORT-dispW, offsetX));
    offsetY = Math.min(0, Math.max(VIEWPORT-dispH, offsetY));
  }
  function applyTransform(){
    clampOffsets();
    img.style.transform = `translate(${offsetX}px,${offsetY}px) scale(${baseScale*zoom})`;
  }
  img.onload = () => {
    naturalW = img.naturalWidth; naturalH = img.naturalHeight;
    baseScale = Math.max(VIEWPORT/naturalW, VIEWPORT/naturalH);
    zoom = 1;
    // Centrado inicial
    offsetX = (VIEWPORT - naturalW*baseScale)/2;
    offsetY = (VIEWPORT - naturalH*baseScale)/2;
    applyTransform();
  };

  zoomSlider.addEventListener('input', ()=>{
    zoom = parseFloat(zoomSlider.value);
    applyTransform();
  });

  function pointerDown(x,y){ dragging=true; dragStartX=x; dragStartY=y; dragOffX=offsetX; dragOffY=offsetY; viewport.style.cursor='grabbing'; }
  function pointerMove(x,y){
    if(!dragging) return;
    offsetX = dragOffX + (x-dragStartX);
    offsetY = dragOffY + (y-dragStartY);
    applyTransform();
  }
  function pointerUp(){ dragging=false; viewport.style.cursor='grab'; }

  viewport.addEventListener('mousedown', e=>{ pointerDown(e.clientX,e.clientY); e.preventDefault(); });
  window.addEventListener('mousemove', e=>pointerMove(e.clientX,e.clientY));
  window.addEventListener('mouseup', pointerUp);
  viewport.addEventListener('touchstart', e=>{ const t=e.touches[0]; pointerDown(t.clientX,t.clientY); }, {passive:true});
  viewport.addEventListener('touchmove', e=>{ const t=e.touches[0]; pointerMove(t.clientX,t.clientY); e.preventDefault(); }, {passive:false});
  viewport.addEventListener('touchend', pointerUp);

  function cleanup(){
    window.removeEventListener('mousemove', pointerMove);
    window.removeEventListener('mouseup', pointerUp);
    cropOv.remove();
  }
  document.getElementById('cropCancelBtn').addEventListener('click', cleanup);
  document.getElementById('cropConfirmBtn').addEventListener('click', ()=>{
    const effScale = baseScale*zoom;
    const cropX = -offsetX/effScale, cropY = -offsetY/effScale;
    const cropSize = VIEWPORT/effScale;
    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT; canvas.height = OUTPUT;
    const ctx = canvas.getContext('2d');
    // PNG (no JPEG) para conservar la transparencia si la imagen la tiene.
    ctx.drawImage(img, cropX, cropY, cropSize, cropSize, 0, 0, OUTPUT, OUTPUT);
    const dataUrl = canvas.toDataURL('image/png');
    // Solo se deja preparada — igual que un cambio de forma/color en el
    // editor por capas, no se guarda de verdad en Firestore hasta que
    // el jugador pulse GUARDAR ESCUDO. Si no, subir la imagen y luego
    // pulsar GUARDAR ESCUDO sin querer sobrescribía la imagen recién
    // subida con el escudo por capas por defecto.
    _crestEditImagePending = dataUrl;
    const svgPrev = document.getElementById('crestSvg');
    const imgPrev = document.getElementById('crestImgPreview');
    if(svgPrev) svgPrev.style.display = 'none';
    if(imgPrev){ imgPrev.src = dataUrl; imgPrev.style.display = 'block'; }
    cleanup();
  });
}

/* ===== Ventana del editor ===== */
let _crestEditState = null;
let _crestEditImagePending = null; // imagen recién recortada, pendiente de confirmar con GUARDAR ESCUDO
function openCrestEditor(){
  _crestEditState = window._myCrestData ? JSON.parse(JSON.stringify(window._myCrestData)) : defaultCrestData();
  if(!_crestEditState.rankColor) _crestEditState.rankColor = '#f0c419';
  const overlay = document.createElement('div');
  overlay.id = 'crestEditorOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.82);z-index:70000;display:flex;align-items:center;justify-content:center;padding:16px';
  overlay.innerHTML = `
    <div id="crestWindow" style="width:100%;max-width:680px;height:710px;max-height:92vh;background:var(--card-bg);border:2px solid var(--gold);border-radius:8px;display:flex;flex-direction:column;overflow:hidden;padding:18px;box-sizing:border-box;position:relative">
      <button id="crestCloseBtn" class="auth-close" style="position:absolute;top:10px;right:12px">✕</button>
      <h1 style="font-family:'Bebas Neue',Impact,sans-serif;letter-spacing:1.5px;color:var(--gold);font-size:18px;margin:0 0 12px;display:flex;align-items:center;gap:8px"><i class="ph ph-bold ph-shield-star"></i> PERSONALIZAR ESCUDO</h1>
      <div style="display:flex;flex-direction:column;gap:14px;flex:1;min-height:0;overflow-y:auto;padding-right:8px" id="crestBodySplit">
        <div id="crestPreviewCol" style="flex-shrink:0;display:flex;flex-direction:row;align-items:center;gap:14px;position:sticky;top:0;background:var(--card-bg);z-index:5;padding-bottom:8px">
          <div style="width:110px;height:110px;flex-shrink:0;position:relative">
            <div style="width:110px;height:110px;display:flex;align-items:center;justify-content:center;background:var(--panel);border-radius:10px;border:1px solid var(--line);overflow:hidden">
              <svg id="crestSvg" viewBox="0 0 200 200" width="90" height="90"></svg>
              <img id="crestImgPreview" style="display:none;width:100%;height:100%;object-fit:cover">
            </div>
            <div style="position:absolute;bottom:-6px;right:-6px;width:30px;height:30px;border-radius:50%;background:#1a1d1f;border:2px solid var(--gold);color:var(--gold);display:flex;align-items:center;justify-content:center;pointer-events:none">
              <i class="ph ph-bold ph-pencil-simple" style="font-size:14px"></i>
            </div>
            <input type="file" id="crestImageInput" accept="image/*" title="Subir imagen propia"
              style="position:absolute;bottom:-6px;right:-6px;width:30px;height:30px;border-radius:50%;opacity:0;cursor:pointer;-webkit-appearance:none;appearance:none;padding:0;margin:0;font-size:0">
          </div>
          <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:8px">
            <input type="text" id="crestTeamNameInput" maxlength="24" placeholder="Nombre del equipo" style="width:100%;background:var(--dark);border:1px solid var(--line);color:var(--text);padding:7px 9px;border-radius:6px;font-size:12px;font-family:'Bebas Neue',Impact,sans-serif;letter-spacing:.5px">
            <label style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--text-muted)">
              <input type="checkbox" id="crestUseFixedNameCheckbox"> Usar siempre como nombre de equipo
            </label>
            <div style="display:flex;gap:8px">
              <button id="crestSaveBtn" style="flex:1;font-family:'Bebas Neue',Impact,sans-serif;letter-spacing:1px;font-size:12px;background:var(--gold);color:#000;border:none;border-radius:6px;padding:9px 14px;cursor:pointer"><i class="ph ph-bold ph-check-circle"></i> GUARDAR ESCUDO</button>
              <button id="crestResetBtn" title="Borrar diseño y volver al básico" style="width:38px;flex-shrink:0;background:none;border:1px solid #e74c3c;color:#e74c3c;border-radius:6px;cursor:pointer;font-size:16px"><i class="ph ph-bold ph-trash"></i></button>
            </div>
          </div>
        </div>
        <div id="crestControlsCol" style="flex:1;min-width:0"></div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // Prellenar nombre de equipo desde los campos ya existentes del perfil
  const teamInput = document.getElementById('crestTeamNameInput');
  const fixedCheckbox = document.getElementById('crestUseFixedNameCheckbox');
  const existingNameInput = document.getElementById('preferredTeamNameInput');
  const existingFixedCheckbox = document.getElementById('useFixedTeamNameCheckbox');
  if(existingNameInput) teamInput.value = existingNameInput.value || '';
  if(existingFixedCheckbox) fixedCheckbox.checked = existingFixedCheckbox.checked;
  teamInput.addEventListener('input', ()=>{ if(existingNameInput) existingNameInput.value = teamInput.value; });
  fixedCheckbox.addEventListener('change', ()=>{ if(existingFixedCheckbox){ existingFixedCheckbox.checked = fixedCheckbox.checked; existingFixedCheckbox.dispatchEvent(new Event('change')); } });

  buildCrestControlsUI(document.getElementById('crestControlsCol'));
  crestRenderAll();
  _crestEditImagePending = window._myCrestImage || null;
  if(window._myCrestImage){
    const svgPrev = document.getElementById('crestSvg');
    const imgPrev = document.getElementById('crestImgPreview');
    if(svgPrev) svgPrev.style.display = 'none';
    if(imgPrev){ imgPrev.src = window._myCrestImage; imgPrev.style.display = 'block'; }
  }

  document.getElementById('crestCloseBtn').addEventListener('click', ()=>overlay.remove());
  document.getElementById('crestImageInput').addEventListener('change', (e)=>{
    const file = e.target.files && e.target.files[0];
    e.target.value = ''; // permite volver a elegir el mismo archivo después
    if(!file) return;
    if(!file.type.startsWith('image/')){ showToast('Elige un archivo de imagen', 'toast-neg'); return; }
    if(file.size > 10*1024*1024){ showToast('La imagen es demasiado grande (máx. 10MB)', 'toast-neg'); return; }
    const reader = new FileReader();
    reader.onload = () => openCrestCropModal(reader.result, overlay);
    reader.onerror = () => showToast('No se pudo leer la imagen', 'toast-neg');
    reader.readAsDataURL(file);
  });
  document.getElementById('crestSaveBtn').addEventListener('click', async()=>{
    if(_crestEditImagePending){
      await saveMyCrestImage(_crestEditImagePending);
    }else{
      await saveMyCrestData(_crestEditState);
    }
    if(existingNameInput && typeof existingNameInput.dispatchEvent==='function') existingNameInput.dispatchEvent(new Event('input'));
    showToast('✅ Escudo guardado', 'toast-pos');
    overlay.remove();
  });
  document.getElementById('crestResetBtn').addEventListener('click', ()=>{
    const confirmOv = document.createElement('div');
    confirmOv.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:80000;display:flex;align-items:center;justify-content:center;padding:20px';
    confirmOv.innerHTML = `
      <div style="background:var(--card-bg);border:2px solid #e74c3c;border-radius:8px;padding:20px;max-width:320px;text-align:center">
        <p style="color:var(--text);font-size:13px;margin:0 0 16px">¿Borrar el escudo actual?</p>
        <div style="display:flex;gap:10px">
          <button id="crestConfirmCancel" style="flex:1;background:none;border:1px solid var(--line);color:var(--text);border-radius:6px;padding:8px;cursor:pointer;font-family:'Bebas Neue',Impact,sans-serif;letter-spacing:1px">CANCELAR</button>
          <button id="crestConfirmYes" style="flex:1;background:#e74c3c;border:none;color:#fff;border-radius:6px;padding:8px;cursor:pointer;font-family:'Bebas Neue',Impact,sans-serif;letter-spacing:1px">OK</button>
        </div>
      </div>`;
    document.body.appendChild(confirmOv);
    document.getElementById('crestConfirmCancel').addEventListener('click', ()=>confirmOv.remove());
    document.getElementById('crestConfirmYes').addEventListener('click', async()=>{
      confirmOv.remove();
      await resetMyCrestData();
      _crestEditState = defaultCrestData();
      buildCrestControlsUI(document.getElementById('crestControlsCol'));
      crestRenderAll();
      showToast('🗑️ Escudo eliminado', 'toast-pos');
    });
  });
}

function crestRenderAll(){
  renderCrestInto(document.getElementById('crestSvg'), _crestEditState);
  // Si se estaba mostrando la imagen subida y el usuario toca un
  // control de capas, se entiende que quiere volver al escudo por
  // capas — se cancela la imagen pendiente y se enseña el SVG de
  // nuevo (nada de esto toca Firestore todavía; eso solo pasa al
  // pulsar GUARDAR ESCUDO).
  _crestEditImagePending = null;
  const svgPrev = document.getElementById('crestSvg');
  const imgPrev = document.getElementById('crestImgPreview');
  if(svgPrev) svgPrev.style.display = '';
  if(imgPrev) imgPrev.style.display = 'none';
}

function buildCrestControlsUI(container){
  container.innerHTML = `
    <div class="panel crest-panel" id="crestPanel1" style="background:var(--panel);border:1px solid var(--line);border-radius:8px;margin-bottom:10px;overflow:hidden">
      <div class="crest-panel-header" data-panel="crestPanel1" style="display:flex;align-items:center;gap:8px;padding:12px 14px;cursor:pointer;font-family:'Bebas Neue',Impact,sans-serif;letter-spacing:.5px;font-size:13px;color:var(--gold)">
        <span class="crest-layer-num">1</span> FORMA Y FONDO <i class="ph ph-bold ph-caret-down chev" style="margin-left:auto"></i>
      </div>
      <div class="crest-panel-body" style="max-height:0;overflow:hidden;transition:max-height .25s ease;padding:0 14px">
        <label class="crest-field-label">Silueta</label>
        <div class="crest-option-grid" id="crestShapeOptions"></div>
        <label class="crest-field-label">Patrón</label>
        <div class="crest-option-grid wide" id="crestPatternOptions"></div>
        <label class="crest-field-label">Color principal</label>
        <div class="crest-option-grid" id="crestBgColorOptions"></div>
        <label class="crest-field-label" id="crestSecondColorLabel" style="display:none">Color secundario</label>
        <div class="crest-option-grid" id="crestBg2ColorOptions" style="display:none"></div>
        <div class="crest-slider-group">
          <div class="crest-slider-row"><label>Tamaño</label><input type="range" id="crestShapeScale" min="40" max="220" value="100"></div>
          <div class="crest-slider-row"><label>Rotar</label><input type="range" id="crestShapeRotate" min="0" max="360" value="0"></div>
        </div>
      </div>
    </div>
    <div class="panel crest-panel" id="crestPanel2" style="background:var(--panel);border:1px solid var(--line);border-radius:8px;margin-bottom:10px;overflow:hidden">
      <div class="crest-panel-header" data-panel="crestPanel2" style="display:flex;align-items:center;gap:8px;padding:12px 14px;cursor:pointer;font-family:'Bebas Neue',Impact,sans-serif;letter-spacing:.5px;font-size:13px;color:var(--gold)">
        <span class="crest-layer-num">2</span> ICONO CENTRAL <i class="ph ph-bold ph-caret-down chev" style="margin-left:auto"></i>
      </div>
      <div class="crest-panel-body" style="max-height:0;overflow:hidden;transition:max-height .25s ease;padding:0 14px">
        <label class="crest-field-label">Icono</label>
        <div class="crest-option-grid" id="crestIconOptions"></div>
        <label class="crest-field-label">Color</label>
        <div class="crest-option-grid" id="crestIconColorOptions"></div>
        <div class="crest-slider-group">
          <div class="crest-slider-row"><label>Tamaño</label><input type="range" id="crestIconScale" min="20" max="280" value="100"></div>
          <div class="crest-slider-row"><label>Rotar</label><input type="range" id="crestIconRotate" min="0" max="360" value="0"></div>
          <div class="crest-slider-row"><label>Mover X</label><input type="range" id="crestIconX" min="-200" max="200" value="0"></div>
          <div class="crest-slider-row"><label>Mover Y</label><input type="range" id="crestIconY" min="-200" max="200" value="0"></div>
        </div>
      </div>
    </div>
    <div class="panel crest-panel" id="crestPanel3" style="background:var(--panel);border:1px solid var(--line);border-radius:8px;margin-bottom:10px;overflow:hidden">
      <div class="crest-panel-header" data-panel="crestPanel3" style="display:flex;align-items:center;gap:8px;padding:12px 14px;cursor:pointer;font-family:'Bebas Neue',Impact,sans-serif;letter-spacing:.5px;font-size:13px;color:var(--gold)">
        <span class="crest-layer-num">3</span> DETALLE DE RANGO <i class="ph ph-bold ph-caret-down chev" style="margin-left:auto"></i>
      </div>
      <div class="crest-panel-body" style="max-height:0;overflow:hidden;transition:max-height .25s ease;padding:0 14px">
        <label class="crest-field-label">Tipo</label>
        <div class="crest-option-grid" id="crestRankOptions"></div>
        <label class="crest-field-label">Color</label>
        <div class="crest-option-grid" id="crestRankColorOptions"></div>
        <div class="crest-slider-group">
          <div class="crest-slider-row"><label>Tamaño</label><input type="range" id="crestRankScale" min="20" max="280" value="100"></div>
          <div class="crest-slider-row"><label>Rotar</label><input type="range" id="crestRankRotate" min="0" max="360" value="0"></div>
          <div class="crest-slider-row"><label>Mover X</label><input type="range" id="crestRankX" min="-200" max="200" value="0"></div>
          <div class="crest-slider-row"><label>Mover Y</label><input type="range" id="crestRankY" min="-200" max="200" value="0"></div>
        </div>
      </div>
    </div>
  `;

  // Estilos puntuales (una sola vez para todo el documento)
  if(!document.getElementById('crestEditorStylesTag')){
    const st = document.createElement('style');
    st.id = 'crestEditorStylesTag';
    st.textContent = `
      .crest-panel-body.open{max-height:1200px !important;padding:0 14px 14px !important}
      .crest-panel-header .chev{transition:transform .2s;color:var(--text-muted);font-size:14px}
      .crest-panel-body.open ~ .crest-panel-header .chev, .crest-panel.open .chev{transform:rotate(180deg)}
      .crest-layer-num{width:16px;height:16px;border-radius:50%;background:var(--gold);color:#000;display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0}
      .crest-option-grid{display:grid;grid-template-columns:repeat(auto-fill, minmax(38px, 1fr));gap:7px;margin-bottom:10px}
      .crest-option-grid.wide{grid-template-columns:repeat(auto-fill, minmax(64px, 1fr))}
      .crest-swatch{width:100%;aspect-ratio:1;border-radius:50%;cursor:pointer;border:2px solid transparent;transition:.15s;max-width:30px;justify-self:center}
      .crest-swatch.active{border-color:#fff;transform:scale(1.12)}
      .crest-icon-btn{width:100%;aspect-ratio:1;border-radius:7px;background:var(--card-bg);border:1px solid var(--line);color:var(--text-muted);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:15px;transition:.15s;max-width:38px}
      .crest-icon-btn:hover{border-color:var(--gold);color:var(--gold)}
      .crest-icon-btn.active{background:rgba(240,196,25,.12);border-color:var(--gold);color:var(--gold)}
      .crest-icon-btn.wide{max-width:none;aspect-ratio:auto;padding:8px 4px;font-size:9px;text-transform:uppercase;text-align:center}
      .crest-shape-btn{width:100%;aspect-ratio:1;border-radius:7px;background:var(--card-bg);border:1px solid var(--line);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:.15s;max-width:46px}
      .crest-shape-btn svg{width:60%;height:60%;display:block}
      .crest-shape-btn:hover{border-color:var(--gold)}
      .crest-shape-btn.active{background:rgba(240,196,25,.12);border-color:var(--gold)}
      .crest-field-label{font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;display:block;margin:10px 0 6px}
      .crest-slider-row{display:flex;align-items:center;gap:8px;margin-bottom:6px}
      .crest-slider-row label{font-size:10px;color:var(--text-muted);width:48px;flex-shrink:0}
      .crest-slider-row input[type=range]{flex:1;accent-color:var(--gold)}
      .crest-slider-group{display:grid;grid-template-columns:1fr;gap:0;margin-top:10px;padding-top:10px;border-top:1px dashed var(--line)}
      @media(min-width:480px){ .crest-slider-group{grid-template-columns:1fr 1fr;gap:0 14px} }
    `;
    document.head.appendChild(st);
  }

  container.querySelectorAll('.crest-panel-header').forEach(h=>{
    h.addEventListener('click', ()=>{
      const body = h.nextElementSibling;
      body.classList.toggle('open');
      h.classList.toggle('open');
    });
  });
  container.querySelector('#crestPanel1 .crest-panel-body').classList.add('open');
  container.querySelector('#crestPanel1 .crest-panel-header').classList.add('open');

  crestBuildOptions('crestShapeOptions', CREST_SHAPE_KEYS, k=>k===_crestEditState.shape, k=>_crestEditState.shape=k, k=>{
    const b = document.createElement('div'); b.className='crest-shape-btn'; b.title = CREST_SHAPE_LABELS[k];
    b.innerHTML = k==='ninguno' ? `<i class="ph ph-bold ph-prohibit" style="color:#666;font-size:16px"></i>` : `<svg viewBox="0 0 200 200"><path d="${CREST_SHAPES[k]}" fill="#8a9094"/></svg>`;
    return b;
  });
  crestBuildOptions('crestPatternOptions', CREST_PATTERNS, p=>p===_crestEditState.pattern, p=>{
    _crestEditState.pattern=p;
    const showSecond = p!=='solid';
    document.getElementById('crestSecondColorLabel').style.display = showSecond?'block':'none';
    document.getElementById('crestBg2ColorOptions').style.display = showSecond?'grid':'none';
  }, p=>{ const b=document.createElement('div'); b.className='crest-icon-btn wide'; b.textContent=CREST_PATTERN_LABELS[p]; return b; });
  crestBuildOptions('crestBgColorOptions', CREST_COLORS, c=>c===_crestEditState.bgColor, c=>_crestEditState.bgColor=c, c=>{ const b=document.createElement('div'); b.className='crest-swatch'; b.style.background=c; return b; });
  crestBuildOptions('crestBg2ColorOptions', CREST_COLORS, c=>c===_crestEditState.bg2Color, c=>_crestEditState.bg2Color=c, c=>{ const b=document.createElement('div'); b.className='crest-swatch'; b.style.background=c; return b; });
  const showSecond0 = _crestEditState.pattern!=='solid';
  document.getElementById('crestSecondColorLabel').style.display = showSecond0?'block':'none';
  document.getElementById('crestBg2ColorOptions').style.display = showSecond0?'grid':'none';

  crestBuildOptions('crestIconOptions', CREST_ICONS, ic=>ic===_crestEditState.icon, ic=>_crestEditState.icon=ic, ic=>{
    const b=document.createElement('div'); b.className='crest-icon-btn';
    b.innerHTML = ic==='ninguno' ? `<i class="ph ph-bold ph-prohibit" style="color:#666"></i>` : `<i class="ph ph-bold ${ic}"></i>`;
    return b;
  });
  crestBuildOptions('crestIconColorOptions', CREST_COLORS, c=>c===_crestEditState.iconColor, c=>_crestEditState.iconColor=c, c=>{ const b=document.createElement('div'); b.className='crest-swatch'; b.style.background=c; return b; });

  crestBuildOptions('crestRankOptions', CREST_RANKS, r=>r===_crestEditState.rank, r=>_crestEditState.rank=r, r=>{
    const b=document.createElement('div'); b.className='crest-icon-btn'; b.title=CREST_RANK_LABELS[r];
    const iconClass = r==='ninguno' ? 'ph-prohibit' : r==='laurel' ? 'ph-plant' : r;
    b.innerHTML = `<i class="ph ph-bold ${iconClass}" style="${r==='ninguno'?'color:#666':''}"></i>`;
    return b;
  });
  crestBuildOptions('crestRankColorOptions', CREST_COLORS, c=>c===_crestEditState.rankColor, c=>_crestEditState.rankColor=c, c=>{ const b=document.createElement('div'); b.className='crest-swatch'; b.style.background=c; return b; });

  crestBindSlider('crestShapeScale','shapeScale'); crestBindSlider('crestShapeRotate','shapeRotate');
  crestBindSlider('crestIconScale','iconScale'); crestBindSlider('crestIconRotate','iconRotate');
  crestBindSlider('crestIconX','iconX'); crestBindSlider('crestIconY','iconY');
  crestBindSlider('crestRankScale','rankScale'); crestBindSlider('crestRankRotate','rankRotate');
  crestBindSlider('crestRankX','rankX'); crestBindSlider('crestRankY','rankY');
}

function crestBuildOptions(containerId, items, isActive, onClick, renderItem){
  const c = document.getElementById(containerId);
  c.innerHTML = '';
  items.forEach(item=>{
    const el = renderItem(item);
    if(isActive(item)) el.classList.add('active');
    el.addEventListener('click', ()=>{
      onClick(item);
      // Actualizar solo el estado "activo" dentro de ESTA rejilla, sin
      // reconstruir el resto de la interfaz — así no se cierran los
      // desplegables que ya estaban abiertos.
      Array.from(c.children).forEach(ch=>ch.classList.remove('active'));
      el.classList.add('active');
      crestRenderAll();
    });
    c.appendChild(el);
  });
}
function crestBindSlider(id, key){
  const el = document.getElementById(id);
  if(!el) return;
  el.value = _crestEditState[key] || 0;
  el.addEventListener('input', ()=>{
    _crestEditState[key] = parseInt(el.value, 10);
    crestRenderAll();
  });
}
window.openCrestEditor = openCrestEditor;
