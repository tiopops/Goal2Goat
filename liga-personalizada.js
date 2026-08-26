/* ============================================================
   GOAL2GOAT — Liga Personalizada: importación de equipos y escudos
   ------------------------------------------------------------
   Archivo aparte y autocontenido — liga-manager.js solo lo llama
   desde la pantalla nueva del flujo de inicio (LIGA PERSONALIZADA).

   Lee el Excel de equipos directamente en el navegador con SheetJS
   (cargado vía CDN en index.html), sin ningún servidor de por medio.
   Valida estructura, posiciones y rango de estadísticas, y reporta
   cualquier error de forma esquemática (equipo, fila, campo, qué
   falla, cómo arreglarlo) — nunca un error genérico sin más.

   Los escudos se validan (formato PNG, tamaño máximo 500KB,
   1500×1500px máximo) y se emparejan por nombre de archivo contra
   los equipos ya importados del Excel.

   NOTA IMPORTANTE SOBRE EL GUARDADO: los ESCUDOS se guardan en
   localStorage del propio dispositivo, no en Firebase — Firestore
   tiene un límite de 1MB por documento, y varios escudos de hasta
   500KB cada uno lo superarían enseguida. Guardar los escudos de
   verdad en la cuenta del jugador (para que le aparezcan igual en
   otro dispositivo) necesitaría Firebase Storage, que este proyecto
   no tiene configurado todavía.

   Los DATOS de equipos y jugadores (nombres, posiciones, estadísticas
   — nunca imágenes) sí se pueden guardar con nombre en la cuenta del
   jugador, hasta 3 configuraciones — el tamaño real es mínimo (unos
   pocos KB incluso con una liga de 20 equipos completos), muy lejos
   del límite de 1MB. Al recuperar una configuración guardada en otro
   dispositivo, los escudos habría que volver a subirlos ahí, ya que
   esa parte sigue sin sincronizarse entre dispositivos.
   ============================================================ */

window.G2G_LigaPersonalizada = (function(){

  const STORAGE_KEY_TEAMS='g2g_ligaPersonalizada_equipos';
  const STORAGE_KEY_CRESTS='g2g_ligaPersonalizada_escudos';
  const VALID_POSITIONS=['GK','CB','LB','RB','LWB','RWB','CDM','CM','CAM','LM','RM','LW','RW','ST','CF'];
  const MAX_CREST_BYTES=500*1024;
  const MAX_CREST_DIM=1500;

  // Envoltorio seguro sobre window.t (i18n.js) — todos los mensajes de
  // error de este módulo pasan por aquí para traducirse a los 6
  // idiomas del juego, con una frase de emergencia en español si por
  // lo que fuera i18n.js no estuviera cargado todavía.
  function tr(key, ...args){
    if(typeof window.t==='function') return window.t(key, ...args);
    return key;
  }

  let equipos=[];   // [{key, displayName, xi:[...11], bench:[...5-7]}]
  let crests={};    // {key: dataURL}

  function cargarDesdeStorage(){
    try{ const t=localStorage.getItem(STORAGE_KEY_TEAMS); if(t) equipos=JSON.parse(t); }catch(e){}
    try{ const c=localStorage.getItem(STORAGE_KEY_CRESTS); if(c) crests=JSON.parse(c); }catch(e){}
  }
  function guardarEnStorage(){
    try{ localStorage.setItem(STORAGE_KEY_TEAMS, JSON.stringify(equipos)); }catch(e){}
    try{ localStorage.setItem(STORAGE_KEY_CRESTS, JSON.stringify(crests)); }catch(e){}
  }
  cargarDesdeStorage();

  function leerCelda(ws, fila, col){
    const addr=XLSX.utils.encode_cell({r:fila-1, c:col-1});
    const cell=ws[addr];
    return cell?cell.v:undefined;
  }

  // Estructura FIJA esperada (la misma que genera la plantilla): once
  // inicial en las filas 8-18, banquillo en las filas 24-30, columnas
  // A-H = Position/Number/Player Name/Attack/Defense/Passing/Pace/Technique.
  function parsearEquipo(ws, nombreHoja){
    const errores=[];
    const displayNameRaw=leerCelda(ws, 1, 1);
    const displayName=(typeof displayNameRaw==='string' && displayNameRaw.trim())?displayNameRaw.trim():nombreHoja;
    const key=nombreHoja.trim().toLowerCase().replace(/\s+/g,'').replace(/[^a-z0-9_-]/g,'');

    function leerBloque(filaInicio, filaFin){
      const jugadores=[];
      for(let r=filaInicio; r<=filaFin; r++){
        const pos=leerCelda(ws,r,1), num=leerCelda(ws,r,2), nombre=leerCelda(ws,r,3);
        const atk=leerCelda(ws,r,4), def=leerCelda(ws,r,5), pas=leerCelda(ws,r,6), pace=leerCelda(ws,r,7), tech=leerCelda(ws,r,8);
        const vacio=[pos,num,nombre,atk,def,pas,pace,tech].every(v=>v===undefined||v==='');
        if(vacio) continue;
        if(typeof nombre!=='string' || !nombre.trim()){
          errores.push({equipo:displayName, fila:r, campo:'Player Name', problema:tr('lm.lp_nombre_vacio'), sugerencia:tr('lm.lp_nombre_vacio_sugerencia')});
        }
        if(!VALID_POSITIONS.includes(pos)){
          errores.push({equipo:displayName, fila:r, campo:'Position', problema:tr('lm.lp_posicion_invalida', pos===undefined?'—':pos), sugerencia:tr('lm.lp_posicion_invalida_sugerencia', VALID_POSITIONS.join(', '))});
        }
        [['Attack',atk],['Defense',def],['Passing',pas],['Pace',pace],['Technique',tech]].forEach(([campo,val])=>{
          if(typeof val!=='number' || val<0 || val>99 || !Number.isInteger(val)){
            errores.push({equipo:displayName, fila:r, campo, problema:tr('lm.lp_valor_rango', val===undefined?'—':val), sugerencia:tr('lm.lp_valor_rango_sugerencia')});
          }
        });
        if(typeof num!=='number' || num<1 || num>99){
          errores.push({equipo:displayName, fila:r, campo:'Number', problema:tr('lm.lp_dorsal_invalido', num===undefined?'—':num), sugerencia:tr('lm.lp_dorsal_invalido_sugerencia')});
        }
        jugadores.push({pos, num, nombre, atk, def, pas, pace, tech});
      }
      return jugadores;
    }

    const xi=leerBloque(8, 18);
    const bench=leerBloque(24, 30);

    if(xi.length!==11){
      errores.push({equipo:displayName, fila:null, campo:'STARTING XI', problema:tr('lm.lp_xi_numero', xi.length), sugerencia:tr('lm.lp_xi_numero_sugerencia')});
    }
    if(bench.length<5 || bench.length>7){
      errores.push({equipo:displayName, fila:null, campo:'BENCH', problema:tr('lm.lp_banquillo_numero', bench.length), sugerencia:tr('lm.lp_banquillo_numero_sugerencia')});
    }
    const porteros=xi.filter(j=>j.pos==='GK').length;
    if(porteros!==1){
      errores.push({equipo:displayName, fila:null, campo:'STARTING XI', problema:tr('lm.lp_porteros_numero', porteros), sugerencia:tr('lm.lp_porteros_numero_sugerencia')});
    }

    return {key, displayName, xi, bench, errores};
  }

  function importarExcel(file){
    return new Promise((resolve)=>{
      if(!file){ resolve({ok:false, errores:[{problema:tr('lm.lp_sin_archivo')}]}); return; }
      if(!/\.xlsx?$/i.test(file.name)){
        resolve({ok:false, errores:[{problema:tr('lm.lp_no_es_xlsx', file.name), sugerencia:tr('lm.lp_no_es_xlsx_sugerencia')}]});
        return;
      }
      if(typeof XLSX==='undefined'){
        resolve({ok:false, errores:[{problema:tr('lm.lp_sin_lector'), sugerencia:tr('lm.lp_sin_lector_sugerencia')}]});
        return;
      }
      const reader=new FileReader();
      reader.onload=(e)=>{
        try{
          const wb=XLSX.read(e.target.result, {type:'array'});
          const nombresHojas=wb.SheetNames.filter(n=>n.trim().toLowerCase()!=='tutorial');
          if(!nombresHojas.length){
            resolve({ok:false, errores:[{problema:tr('lm.lp_sin_pestanas'), sugerencia:tr('lm.lp_sin_pestanas_sugerencia')}]});
            return;
          }
          const equiposParseados=[];
          let todosLosErrores=[];
          const clavesVistas={};
          nombresHojas.forEach(nombre=>{
            const ws=wb.Sheets[nombre];
            const resultado=parsearEquipo(ws, nombre);
            if(clavesVistas[resultado.key]){
              resultado.errores.push({equipo:resultado.displayName, fila:null, campo:'Sheet name', problema:tr('lm.lp_nombre_repetido', nombre), sugerencia:tr('lm.lp_nombre_repetido_sugerencia')});
            }
            clavesVistas[resultado.key]=true;
            equiposParseados.push(resultado);
            todosLosErrores=todosLosErrores.concat(resultado.errores);
          });
          resolve({ok:todosLosErrores.length===0, equipos:equiposParseados, errores:todosLosErrores});
        }catch(err){
          resolve({ok:false, errores:[{problema:tr('lm.lp_error_lectura', err.message), sugerencia:tr('lm.lp_error_lectura_sugerencia')}]});
        }
      };
      reader.onerror=()=>resolve({ok:false, errores:[{problema:tr('lm.lp_error_disco')}]});
      reader.readAsArrayBuffer(file);
    });
  }

  function validarEscudo(file){
    return new Promise((resolve)=>{
      if(!/\.png$/i.test(file.name)){
        resolve({ok:false, nombre:file.name, problema:tr('lm.lp_escudo_no_png', file.name), sugerencia:tr('lm.lp_escudo_no_png_sugerencia')});
        return;
      }
      if(file.size>MAX_CREST_BYTES){
        resolve({ok:false, nombre:file.name, problema:tr('lm.lp_escudo_pesado', file.name, (file.size/1024).toFixed(0)), sugerencia:tr('lm.lp_escudo_pesado_sugerencia')});
        return;
      }
      const reader=new FileReader();
      reader.onload=(e)=>{
        const img=new Image();
        img.onload=()=>{
          if(img.naturalWidth>MAX_CREST_DIM || img.naturalHeight>MAX_CREST_DIM){
            resolve({ok:false, nombre:file.name, problema:tr('lm.lp_escudo_dimensiones', file.name, img.naturalWidth, img.naturalHeight), sugerencia:tr('lm.lp_escudo_dimensiones_sugerencia')});
            return;
          }
          resolve({ok:true, nombre:file.name, dataUrl:e.target.result});
        };
        img.onerror=()=>resolve({ok:false, nombre:file.name, problema:tr('lm.lp_escudo_no_imagen', file.name), sugerencia:tr('lm.lp_escudo_no_imagen_sugerencia')});
        img.src=e.target.result;
      };
      reader.onerror=()=>resolve({ok:false, nombre:file.name, problema:tr('lm.lp_escudo_error_disco', file.name)});
      reader.readAsDataURL(file);
    });
  }

  async function importarEscudos(fileList){
    const archivos=Array.from(fileList);
    const resultados=await Promise.all(archivos.map(validarEscudo));
    const clavesEquipos=equipos.map(e=>e.key);
    const errores=[];
    let importados=0;
    resultados.forEach(r=>{
      if(!r.ok){ errores.push(r); return; }
      const clave=r.nombre.replace(/\.png$/i,'').trim().toLowerCase();
      if(!clavesEquipos.includes(clave)){
        errores.push({ok:false, nombre:r.nombre, problema:tr('lm.lp_escudo_sin_match', r.nombre), sugerencia:clavesEquipos.length?tr('lm.lp_escudo_sin_match_sugerencia', clavesEquipos.join(', ')+'.png'):tr('lm.lp_importa_excel_primero')});
        return;
      }
      crests[clave]=r.dataUrl;
      importados++;
    });
    guardarEnStorage();
    const faltantes=clavesEquipos.filter(k=>!crests[k]);
    return {importados, errores, faltantes};
  }

  function setEquipos(nuevosEquipos){
    equipos=nuevosEquipos;
    guardarEnStorage();
  }
  // Fija un escudo directamente, sin pasar por la validación de subida
  // de archivo — se usa para escudos GENERADOS por el propio juego
  // (Liga Aleatoria, ver generarLigaAleatoria() en liga-manager.js),
  // que son siempre válidos por construcción (nunca necesitan
  // comprobarse contra el límite de tamaño/dimensiones, que es una
  // validación pensada solo para archivos que sube el propio usuario).
  function setCrestDirecto(key, dataUrl){
    crests[key]=dataUrl;
    guardarEnStorage();
  }
  function getEquipos(){ return equipos; }
  function getCrest(key){ return crests[key]||null; }
  function faltanEscudos(){ return equipos.map(e=>e.key).filter(k=>!crests[k]); }
  function limpiarTodo(){
    equipos=[]; crests={};
    try{ localStorage.removeItem(STORAGE_KEY_TEAMS); localStorage.removeItem(STORAGE_KEY_CRESTS); }catch(e){}
  }

  /* ---------- Configuraciones guardadas en la nube (Firestore) ----------
     Se guardan solo los DATOS (nombres, posiciones, estadísticas) — los
     escudos NUNCA se suben aquí, siguen viviendo en localStorage de
     este dispositivo (ver la nota grande al principio del archivo). Un
     documento típico ocupa unos pocos KB incluso con una liga de 20
     equipos completos — muy lejos del límite de 1MB por documento de
     Firestore, así que guardar hasta 3 configuraciones por cuenta es
     perfectamente seguro en tamaño. El límite de 3 es una decisión de
     interfaz (no abrumar con demasiadas), no una limitación técnica. */
  const MAX_CONFIGURACIONES_GUARDADAS=3;
  const MAX_LONGITUD_NOMBRE=40;

  function usuarioActual(){
    return (window._fbAuth && window._fbAuth.currentUser) || null;
  }

  async function listarConfiguracionesGuardadas(){
    const user=usuarioActual();
    if(!user || !window._fbDb) return [];
    try{
      const snap=await window._fbDb.collection('users').doc(user.uid).get();
      const data=snap.exists?snap.data():{};
      return data.ligasPersonalizadasGuardadas||[];
    }catch(e){ return []; }
  }

  // nombre admite cualquier texto, incluidos emojis (son caracteres
  // Unicode normales, no necesitan ningún tratamiento especial) — solo
  // se recorta la longitud y se comprueba que no esté vacío.
  async function guardarConfiguracion(nombre){
    const user=usuarioActual();
    if(!user || !window._fbDb){
      return {ok:false, error:tr('lm.lp_guardar_sin_sesion')};
    }
    const nombreLimpio=(nombre||'').trim().slice(0, MAX_LONGITUD_NOMBRE);
    if(!nombreLimpio){
      return {ok:false, error:tr('lm.lp_guardar_nombre_vacio')};
    }
    if(!equipos.length){
      return {ok:false, error:tr('lm.lp_guardar_sin_equipos')};
    }
    const actuales=await listarConfiguracionesGuardadas();
    if(actuales.length>=MAX_CONFIGURACIONES_GUARDADAS){
      return {ok:false, error:tr('lm.lp_guardar_limite', MAX_CONFIGURACIONES_GUARDADAS)};
    }
    const nueva={
      id:'cfg'+Date.now()+Math.floor(Math.random()*100000),
      nombre:nombreLimpio,
      fecha:new Date().toISOString(),
      numEquipos:equipos.length,
      // Se guarda una copia limpia sin ninguna referencia a escudos.
      equipos:equipos.map(e=>({key:e.key, displayName:e.displayName, xi:e.xi, bench:e.bench})),
    };
    try{
      await window._fbDb.collection('users').doc(user.uid).set({
        ligasPersonalizadasGuardadas:[...actuales, nueva],
      }, {merge:true});
      return {ok:true, configuracion:nueva};
    }catch(e){
      return {ok:false, error:tr('lm.lp_guardar_error', e.message||'')};
    }
  }

  async function cargarConfiguracionGuardada(id){
    const actuales=await listarConfiguracionesGuardadas();
    const encontrada=actuales.find(c=>c.id===id);
    if(!encontrada) return {ok:false, error:tr('lm.lp_cargar_no_encontrada')};
    setEquipos(encontrada.equipos);
    return {ok:true, faltanEscudos:faltanEscudos()};
  }

  async function borrarConfiguracionGuardada(id){
    const user=usuarioActual();
    if(!user || !window._fbDb) return {ok:false};
    const actuales=await listarConfiguracionesGuardadas();
    const restantes=actuales.filter(c=>c.id!==id);
    try{
      await window._fbDb.collection('users').doc(user.uid).set({
        ligasPersonalizadasGuardadas:restantes,
      }, {merge:true});
      return {ok:true};
    }catch(e){ return {ok:false}; }
  }

  return {
    importarExcel, importarEscudos, setEquipos, getEquipos, getCrest, faltanEscudos, limpiarTodo, setCrestDirecto,
    listarConfiguracionesGuardadas, guardarConfiguracion, cargarConfiguracionGuardada, borrarConfiguracionGuardada,
    MAX_CONFIGURACIONES_GUARDADAS,
  };
})();
