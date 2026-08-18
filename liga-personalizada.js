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

   NOTA IMPORTANTE SOBRE EL GUARDADO: esto se guarda en localStorage
   del propio dispositivo, no en Firebase — Firestore tiene un límite
   de 1MB por documento, y varios escudos de hasta 500KB cada uno lo
   superarían enseguida. Guardar los escudos de verdad en la cuenta
   del jugador (para que le aparezcan igual en otro dispositivo)
   necesitaría Firebase Storage, que este proyecto no tiene
   configurado todavía — de momento la liga personalizada vive en
   este dispositivo.
   ============================================================ */

window.G2G_LigaPersonalizada = (function(){

  const STORAGE_KEY_TEAMS='g2g_ligaPersonalizada_equipos';
  const STORAGE_KEY_CRESTS='g2g_ligaPersonalizada_escudos';
  const VALID_POSITIONS=['GK','CB','LB','RB','LWB','RWB','CDM','CM','CAM','LM','RM','LW','RW','ST','CF'];
  const MAX_CREST_BYTES=500*1024;
  const MAX_CREST_DIM=1500;

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
          errores.push({equipo:displayName, fila:r, campo:'Player Name', problema:'Nombre de jugador vacío o no es texto.', sugerencia:'Escribe el nombre del jugador en la columna "Player Name" de esa fila.'});
        }
        if(!VALID_POSITIONS.includes(pos)){
          errores.push({equipo:displayName, fila:r, campo:'Position', problema:`Posición "${pos===undefined?'(vacía)':pos}" no reconocida.`, sugerencia:`Usa uno de estos códigos: ${VALID_POSITIONS.join(', ')}.`});
        }
        [['Attack',atk],['Defense',def],['Passing',pas],['Pace',pace],['Technique',tech]].forEach(([campo,val])=>{
          if(typeof val!=='number' || val<0 || val>99 || !Number.isInteger(val)){
            errores.push({equipo:displayName, fila:r, campo, problema:`Valor "${val===undefined?'(vacío)':val}" fuera de rango.`, sugerencia:'Debe ser un número entero entre 0 y 99.'});
          }
        });
        if(typeof num!=='number' || num<1 || num>99){
          errores.push({equipo:displayName, fila:r, campo:'Number', problema:`Dorsal "${num===undefined?'(vacío)':num}" inválido.`, sugerencia:'Debe ser un número entero entre 1 y 99.'});
        }
        jugadores.push({pos, num, nombre, atk, def, pas, pace, tech});
      }
      return jugadores;
    }

    const xi=leerBloque(8, 18);
    const bench=leerBloque(24, 30);

    if(xi.length!==11){
      errores.push({equipo:displayName, fila:null, campo:'STARTING XI', problema:`Tiene ${xi.length} jugador(es) en el once inicial — deberían ser exactamente 11.`, sugerencia:'Completa o elimina filas del bloque ONCE INICIAL hasta tener exactamente 11 jugadores.'});
    }
    if(bench.length<5 || bench.length>7){
      errores.push({equipo:displayName, fila:null, campo:'BENCH', problema:`Tiene ${bench.length} jugador(es) en el banquillo — deberían ser entre 5 y 7.`, sugerencia:'Ajusta el número de filas rellenas en el bloque BANQUILLO (mínimo 5, máximo 7).'});
    }
    const porteros=xi.filter(j=>j.pos==='GK').length;
    if(porteros!==1){
      errores.push({equipo:displayName, fila:null, campo:'STARTING XI', problema:`El once inicial tiene ${porteros} portero(s) (GK) — debería tener exactamente 1.`, sugerencia:'Revisa que exactamente un jugador del once inicial tenga la posición GK.'});
    }

    return {key, displayName, xi, bench, errores};
  }

  function importarExcel(file){
    return new Promise((resolve)=>{
      if(!file){ resolve({ok:false, errores:[{problema:'No se ha seleccionado ningún archivo.'}]}); return; }
      if(!/\.xlsx?$/i.test(file.name)){
        resolve({ok:false, errores:[{problema:`El archivo "${file.name}" no es un Excel (.xlsx).`, sugerencia:'Sube el archivo .xlsx generado a partir de la plantilla descargable.'}]});
        return;
      }
      if(typeof XLSX==='undefined'){
        resolve({ok:false, errores:[{problema:'No se ha podido cargar el lector de Excel.', sugerencia:'Comprueba tu conexión a internet y vuelve a intentarlo.'}]});
        return;
      }
      const reader=new FileReader();
      reader.onload=(e)=>{
        try{
          const wb=XLSX.read(e.target.result, {type:'array'});
          const nombresHojas=wb.SheetNames.filter(n=>n.trim().toLowerCase()!=='tutorial');
          if(!nombresHojas.length){
            resolve({ok:false, errores:[{problema:'El archivo no contiene ninguna pestaña de equipo (aparte de "Tutorial").', sugerencia:'Añade al menos una pestaña de equipo, duplicando la pestaña de ejemplo de la plantilla.'}]});
            return;
          }
          const equiposParseados=[];
          let todosLosErrores=[];
          const clavesVistas={};
          nombresHojas.forEach(nombre=>{
            const ws=wb.Sheets[nombre];
            const resultado=parsearEquipo(ws, nombre);
            if(clavesVistas[resultado.key]){
              resultado.errores.push({equipo:resultado.displayName, fila:null, campo:'Sheet name', problema:`El nombre de pestaña "${nombre}" está repetido o da lugar al mismo nombre de archivo.`, sugerencia:'Cada pestaña de equipo debe tener un nombre único.'});
            }
            clavesVistas[resultado.key]=true;
            equiposParseados.push(resultado);
            todosLosErrores=todosLosErrores.concat(resultado.errores);
          });
          resolve({ok:todosLosErrores.length===0, equipos:equiposParseados, errores:todosLosErrores});
        }catch(err){
          resolve({ok:false, errores:[{problema:'No se ha podido leer el archivo Excel: '+err.message, sugerencia:'Comprueba que el archivo no esté dañado y que sea un .xlsx válido, exportado desde Excel o Google Sheets.'}]});
        }
      };
      reader.onerror=()=>resolve({ok:false, errores:[{problema:'Error al leer el archivo del disco.'}]});
      reader.readAsArrayBuffer(file);
    });
  }

  function validarEscudo(file){
    return new Promise((resolve)=>{
      if(!/\.png$/i.test(file.name)){
        resolve({ok:false, nombre:file.name, problema:`"${file.name}" no es un PNG.`, sugerencia:'Sube el escudo en formato PNG (se recomienda con fondo transparente).'});
        return;
      }
      if(file.size>MAX_CREST_BYTES){
        resolve({ok:false, nombre:file.name, problema:`"${file.name}" ocupa ${(file.size/1024).toFixed(0)}KB — el máximo son 500KB.`, sugerencia:'Comprime la imagen o redúcela de tamaño antes de subirla.'});
        return;
      }
      const reader=new FileReader();
      reader.onload=(e)=>{
        const img=new Image();
        img.onload=()=>{
          if(img.naturalWidth>MAX_CREST_DIM || img.naturalHeight>MAX_CREST_DIM){
            resolve({ok:false, nombre:file.name, problema:`"${file.name}" mide ${img.naturalWidth}×${img.naturalHeight}px — el máximo son 1500×1500px.`, sugerencia:'Redimensiona la imagen a 1500×1500px o menos antes de subirla.'});
            return;
          }
          resolve({ok:true, nombre:file.name, dataUrl:e.target.result});
        };
        img.onerror=()=>resolve({ok:false, nombre:file.name, problema:`"${file.name}" no se ha podido abrir como imagen.`, sugerencia:'Comprueba que el archivo no esté dañado y sea realmente un PNG.'});
        img.src=e.target.result;
      };
      reader.onerror=()=>resolve({ok:false, nombre:file.name, problema:`No se ha podido leer "${file.name}" del disco.`});
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
        errores.push({ok:false, nombre:r.nombre, problema:`"${r.nombre}" no coincide con el nombre de ningún equipo importado del Excel.`, sugerencia:clavesEquipos.length?`Nombres de equipo esperados: ${clavesEquipos.join(', ')}.png`:'Importa primero el Excel de equipos.'});
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
  function getEquipos(){ return equipos; }
  function getCrest(key){ return crests[key]||null; }
  function faltanEscudos(){ return equipos.map(e=>e.key).filter(k=>!crests[k]); }
  function limpiarTodo(){
    equipos=[]; crests={};
    try{ localStorage.removeItem(STORAGE_KEY_TEAMS); localStorage.removeItem(STORAGE_KEY_CRESTS); }catch(e){}
  }

  return { importarExcel, importarEscudos, setEquipos, getEquipos, getCrest, faltanEscudos, limpiarTodo };
})();
