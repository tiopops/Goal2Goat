/* ═══════════════════════════════════════════════════════════════
   GIRO TÁCTICO — LIGA MANAGER (archivo aparte, no toca game.js ni
   liga-manager.js más allá de un puñado de líneas de enganche).

   Adaptación de la mecánica de Giro Táctico de Copa Leyendas al
   descanso de un partido de Liga Manager. Diferencia clave de
   arquitectura: en Copa Leyendas el partido se simula EN VIVO (el
   Giro cambia una lambda de Poisson que todavía no se ha usado). En
   Liga Manager el resultado COMPLETO ya está decidido antes de que
   el visor empiece a reproducirlo (jugarJornada() ya llamó a
   simularPartido() para las 90 minutos). Por eso, para que el Giro
   sea de verdad funcional (no solo cosmético), este archivo
   RE-SIMULA la segunda parte entera con las estadísticas ya
   modificadas por la carta elegida, y quien lo llama (el visor) se
   encarga de sustituir los eventos de la segunda parte y actualizar
   el resultado guardado.

   Todo lo que vive aquí es autocontenido: datos de las cartas, estilo
   visual propio (inyectado una sola vez, sin tocar style.css) y la
   lógica de oferta + selección + re-simulación. Para corregir o
   reequilibrar el Giro Táctico de Liga Manager, todo está en este
   único archivo.
   ═══════════════════════════════════════════════════════════════ */

(function(){

  /* ---------- 1. Cartas — adaptadas de las 20 de Copa Leyendas ----------
     Cada carta modifica directamente las 5 estadísticas de equipo
     (ATA/DEF/RIT/PAS/TEC, escala 0-100) que ya usa Liga Manager, en
     vez de la lambda de Poisson de Copa Leyendas. Los efectos que en
     Copa Leyendas dependían de conceptos que Liga Manager no tiene
     igual (resistencia como valor de equipo, riesgo de lesión
     persistente) se han adaptado a lo que SÍ existe aquí: resistencia
     → un empujón de ritmo (piernas más frescas), riesgo de lesión →
     un pequeño riesgo extra de tarjeta (más intensidad, más roce),
     nunca una lesión real nueva — las lesiones de Liga Manager ya
     están decididas y registradas médicamente antes de este momento,
     y no es seguro tocarlas desde aquí. */
  const LM_GIRO_CARDS = [
    { id:'presion_alta', name:'PRESIÓN ALTA', icon:'ph-arrow-fat-lines-up',
      pos:'+8 ataque', neg:'−5 ritmo',
      effect:{ata:8, rit:-5} },
    { id:'cierre_atras', name:'CIERRE ATRÁS', icon:'ph-shield-check',
      pos:'+9 defensa', neg:'−5 ataque',
      effect:{def:9, ata:-5} },
    { id:'hidratacion', name:'PAUSA DE HIDRATACIÓN', icon:'ph-drop',
      pos:'+7 ritmo (piernas frescas)', neg:'−3 pase',
      effect:{rit:7, pas:-3} },
    { id:'golpe_pizarra', name:'GOLPE DE PIZARRA', icon:'ph-chalkboard-teacher',
      pos:'+6 ataque y +6 defensa', neg:'−6 ritmo',
      effect:{ata:6, def:6, rit:-6} },
    { id:'grito_capitan', name:'GRITO DEL CAPITÁN', icon:'ph-megaphone',
      pos:'+12 moral', neg:'más riesgo de tarjeta propia',
      effect:{moral:12, riesgoTarjeta:0.08} },
    { id:'tiquitaca', name:'TIQUI-TACA FORZADO', icon:'ph-arrows-clockwise',
      pos:'+9 pase', neg:'−4 defensa (te expones al contragolpe)',
      effect:{pas:9, def:-4} },
    { id:'contragolpe', name:'CONTRAGOLPE RELÁMPAGO', icon:'ph-lightning',
      pos:'+9 ritmo', neg:'−5 defensa',
      effect:{rit:9, def:-5} },
    { id:'muro', name:'MURO DEFENSIVO', icon:'ph-wall',
      pos:'+11 defensa', neg:'−5 pase',
      effect:{def:11, pas:-5} },
    { id:'orden_banquillo', name:'ORDEN DEL BANQUILLO', icon:'ph-clipboard-text',
      pos:'+6 ritmo (piernas frescas)', neg:'−4 moral',
      effect:{rit:6, moral:-4} },
    { id:'estrella', name:'ESTRELLA DEL PARTIDO', icon:'ph-star',
      pos:'+5 ataque y +5 técnica', neg:'más riesgo de tarjeta propia',
      effect:{ata:5, tec:5, riesgoTarjeta:0.03} },
    { id:'fuera_juego', name:'FUERA DE JUEGO PROVOCADO', icon:'ph-flag',
      pos:'+8 defensa', neg:'−4 técnica',
      effect:{def:8, tec:-4} },
    { id:'balon_parado', name:'BALÓN PARADO ENSAYADO', icon:'ph-target',
      pos:'+9 ataque', neg:'−4 pase',
      effect:{ata:9, pas:-4} },
    { id:'presion_asfixiante', name:'PRESIÓN ASFIXIANTE', icon:'ph-wind',
      pos:'+7 defensa y +5 ritmo', neg:'−6 pase',
      effect:{def:7, rit:5, pas:-6} },
    { id:'rondo', name:'RONDO DE VESTUARIO', icon:'ph-circle-dashed',
      pos:'+8 técnica', neg:'−3 defensa (algo de riesgo)',
      effect:{tec:8, def:-3} },
    { id:'lectura_arbitro', name:'LECTURA DEL ÁRBITRO', icon:'ph-eye',
      pos:'mucho menos riesgo de tarjeta propia', neg:'−3 ataque',
      effect:{ata:-3, riesgoTarjeta:-0.10} },
    { id:'viento_favor', name:'VIENTO A FAVOR', icon:'ph-wind',
      pos:'+7 ritmo y +5 pase', neg:'−4 técnica',
      effect:{rit:7, pas:5, tec:-4} },
    { id:'grada_favor', name:'GRADA A FAVOR', icon:'ph-users-three',
      pos:'+10 moral', neg:'−4 ritmo',
      effect:{moral:10, rit:-4} },
    { id:'tiempo_controlado', name:'TIEMPO CONTROLADO', icon:'ph-hourglass-medium',
      pos:'+6 ritmo (control del esfuerzo)', neg:'−3 ataque',
      effect:{rit:6, ata:-3} },
    { id:'prorroga_mental', name:'PRÓRROGA MENTAL', icon:'ph-brain',
      pos:'+4 en las 5 estadísticas', neg:'−3 moral',
      effect:{ata:4, def:4, rit:4, pas:4, tec:4, moral:-3} },
    { id:'ultima_bala', name:'ÚLTIMA BALA', icon:'ph-fire',
      pos:'+14 ataque', neg:'−9 defensa',
      effect:{ata:14, def:-9} },
  ];

  const OFERTA_MS = 5000;
  const PICKER_MS = 10000;

  function clamp(n){ return Math.max(1, Math.min(99, n)); }
  function shuffle(arr){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; } return arr; }

  /* ---------- 2. Estilos propios (inyectados una sola vez) ---------- */
  function ensureStyles(){
    if(document.getElementById('lmGiroStylesTag')) return;
    const style=document.createElement('style');
    style.id='lmGiroStylesTag';
    style.textContent=`
      #lmGiroOfertaOverlay{
        position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:32000;
        display:flex;align-items:center;justify-content:center;
      }
      #lmGiroOfertaOverlay .press-modal{ text-align:center; }
      #lmGiroOfertaOverlay .lm-giro-oferta-usos{ font-size:12px;color:#999;margin-bottom:14px; }
      #lmGiroOfertaOverlay .lm-giro-oferta-btns{ display:flex;gap:10px;justify-content:center; }
      #lmGiroOfertaOverlay .lm-giro-oferta-btns button{ flex:1;max-width:190px; }
      #lmGiroPickerPanel{
        position:fixed;inset:0;background:rgba(10,10,10,.97);z-index:95000;
        display:flex;flex-direction:column;align-items:center;justify-content:center;
        padding:14px;gap:8px;overflow:hidden;
      }
      #lmGiroPickerPanel .g-card{
        position:absolute;top:50%;left:50%;width:96px;height:150px;margin:-75px 0 0 -48px;
        cursor:pointer;-webkit-tap-highlight-color:transparent;will-change:transform;z-index:2;
      }
      #lmGiroPickerPanel .g-card.focused{ z-index:30; }
      #lmGiroPickerPanel .g-card.dimmed .g-card-face{ filter:brightness(.55) saturate(.6); }
      #lmGiroPickerPanel .g-card-face{
        width:100%;height:100%;border-radius:12px;
        background:radial-gradient(120% 100% at 50% -10%, rgba(232,185,35,.10), transparent 55%),
                   linear-gradient(160deg,#1c1c1c,#161616);
        border:1px solid #2a2a2a;
        box-shadow:0 8px 20px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.03);
        display:flex;flex-direction:column;align-items:center;padding:9px 7px 7px;
        position:relative;overflow:hidden;transition:box-shadow .25s ease,filter .25s ease;
      }
      #lmGiroPickerPanel .g-card-face::before{
        content:"";position:absolute;inset:5px;border:1px solid rgba(232,185,35,.35);
        border-radius:8px;pointer-events:none;
      }
      #lmGiroPickerPanel .g-card.focused .g-card-face{ box-shadow:0 14px 30px rgba(0,0,0,.6), 0 0 0 2px var(--gold); }
      #lmGiroPickerPanel .g-card-tag{
        font-family:'Bebas Neue',Impact,sans-serif;font-size:7.5px;letter-spacing:1.5px;
        color:#7a621a;margin-bottom:5px;text-transform:uppercase;
      }
      #lmGiroPickerPanel .g-card-icon{ font-size:20px;color:var(--gold);margin-bottom:5px;
        filter:drop-shadow(0 0 6px rgba(232,185,35,.3)); }
      #lmGiroPickerPanel .g-card-title{
        font-family:'Bebas Neue',Impact,sans-serif;font-size:10px;letter-spacing:.4px;
        color:#fff;text-align:center;margin-bottom:5px;line-height:1.15;
      }
      #lmGiroPickerPanel .g-card-divider{ width:22px;height:2px;background:#7a621a;margin-bottom:5px;border-radius:2px; }
      #lmGiroPickerPanel .g-effect{ width:100%;font-size:8.5px;line-height:1.25;text-align:center;padding:0 1px; }
      #lmGiroPickerPanel .g-effect-pos{ color:#bfe8c9;margin-bottom:5px; }
      #lmGiroPickerPanel .g-effect-pos b{ color:var(--accent);font-weight:700; }
      #lmGiroPickerPanel .g-effect-neg{ color:#f3c6c1;padding-top:5px;border-top:1px dashed #333;margin-top:auto; }
      #lmGiroPickerPanel .g-effect-neg b{ color:var(--red);font-weight:700; }
      @keyframes lmGiroPulse{ 0%{transform:scale(1)} 35%{transform:scale(1.09)} 60%{transform:scale(.97)} 100%{transform:scale(1.03)} }
      #lmGiroPickerPanel .g-card.confirmed .g-card-face{ animation:lmGiroPulse .45s ease; transform-origin:center; }
      @keyframes lmGiroVanish{ to{ opacity:0; transform:scale(.85); } }
      #lmGiroStage.vanishing .g-card{ animation:lmGiroVanish .5s ease forwards; }
      #lmGiroStage.vanishing .g-card:nth-child(1){ animation-delay:0s; }
      #lmGiroStage.vanishing .g-card:nth-child(2){ animation-delay:.08s; }
      #lmGiroStage.vanishing .g-card:nth-child(3){ animation-delay:.16s; }
    `;
    document.head.appendChild(style);
  }

  /* ---------- 3. Popup de oferta (5s, mismo estilo que la rueda de
     prensa: .press-modal/.press-icon/.press-timer-track/.press-timer-fill,
     clases ya existentes y compartidas — solo se define aquí el
     contenedor fijo que las centra en pantalla). ---------- */
  function mostrarOferta(opts){
    ensureStyles();
    const overlay=document.createElement('div');
    overlay.id='lmGiroOfertaOverlay';
    const t=opts.t;
    overlay.innerHTML=`
      <div class="press-modal">
        <i class="ph ph-bold ph-arrows-clockwise press-icon" style="color:var(--gold)"></i>
        <h3>${t('lm.giro_oferta_titulo')}</h3>
        <p class="press-question">${t('lm.giro_oferta_texto')}</p>
        <div class="lm-giro-oferta-usos">${t('lm.giro_usos_restantes')}: ${opts.usosRestantes}</div>
        <div class="lm-giro-oferta-btns">
          <button class="mode-card-btn mode-card-btn-secondary" id="lmGiroCancelarBtn">${t('lm.giro_oferta_cancelar_btn')}</button>
          <button class="mode-card-btn mode-card-btn-gold" id="lmGiroUsarBtn">${t('lm.giro_oferta_usar_btn')}</button>
        </div>
        <div class="press-timer-track"><div class="press-timer-fill" id="lmGiroOfertaTimerFill"></div></div>
      </div>`;
    opts.contenedor.appendChild(overlay);
    let resuelto=false;
    const fill=document.getElementById('lmGiroOfertaTimerFill');
    if(fill){
      fill.style.transition='none';
      fill.style.width='100%';
      requestAnimationFrame(()=>{
        requestAnimationFrame(()=>{
          fill.style.transition=`width ${OFERTA_MS}ms linear`;
          fill.style.width='0%';
        });
      });
    }
    // Mismos pitidos de cuenta atrás que el resto de temporizadores del
    // juego (rueda de prensa, Giro Táctico de Copa Leyendas...) — se
    // cancelan si se resuelve antes de tiempo (CANCELAR/USAR).
    const beepTimers=[5,4,3,2,1].filter(s=>s*1000<=OFERTA_MS).map(secLeft=>setTimeout(()=>{
      if(resuelto) return;
      if(typeof checkCountdownBeep==='function') checkCountdownBeep(secLeft, 'lmGiroOferta');
    }, OFERTA_MS-secLeft*1000));
    const timerId=setTimeout(()=>{
      if(resuelto) return;
      resuelto=true;
      overlay.remove();
      opts.onCancelado();
    }, OFERTA_MS);
    document.getElementById('lmGiroCancelarBtn').addEventListener('click', ()=>{
      if(resuelto) return;
      resuelto=true;
      clearTimeout(timerId);
      beepTimers.forEach(clearTimeout);
      if(typeof window.playSound==='function') window.playSound('select');
      overlay.remove();
      opts.onCancelado();
    });
    document.getElementById('lmGiroUsarBtn').addEventListener('click', ()=>{
      if(resuelto) return;
      resuelto=true;
      clearTimeout(timerId);
      beepTimers.forEach(clearTimeout);
      if(typeof window.playSound==='function') window.playSound('select');
      overlay.remove();
      opts.onConsumirUso();
      mostrarSelector(opts);
    });
  }

  /* ---------- 4. Selector de 3 cartas — clon visual y de animación
     del de Copa Leyendas (barajado, enfoque/atenuado, temporizador de
     10s), con clases e ids propios para no interferir con el de Copa
     Leyendas si algún día coinciden en la misma pantalla. ---------- */
  function mostrarSelector(opts){
    const t=opts.t;
    const pool=shuffle(LM_GIRO_CARDS.slice());
    const picks=pool.slice(0,3);

    const panel=document.createElement('div');
    panel.id='lmGiroPickerPanel';
    panel.innerHTML=`
      <div style="font-family:'Bebas Neue',Impact,sans-serif;color:var(--gold);letter-spacing:1.2px;font-size:14px">${t('lm.giro_picker_titulo')}</div>
      <div style="width:80%;max-width:280px;height:4px;background:#222;border-radius:3px;overflow:hidden">
        <div id="lmGiroTimerFill" style="height:100%;width:100%;background:var(--gold);transition:width .1s linear"></div>
      </div>
      <div id="lmGiroSub" style="font-size:11px;color:var(--text-muted);min-height:14px">${t('lm.giro_picker_sub_barajando')}</div>
      <div id="lmGiroStageWrap" style="position:relative;width:100%;flex:1;display:flex;align-items:center;justify-content:center;min-height:0"></div>
    `;
    opts.contenedor.appendChild(panel);

    const stageWrap=panel.querySelector('#lmGiroStageWrap');
    const stage=document.createElement('div');
    stage.id='lmGiroStage';
    const baseW=300;
    const availW=Math.min(window.innerWidth*0.92, 480);
    const stageScale=Math.max(1, availW/baseW);
    stage.style.cssText=`position:relative;width:${baseW}px;height:160px;flex:none;transform:scale(${stageScale});transform-origin:center center`;
    stageWrap.appendChild(stage);
    const sub=panel.querySelector('#lmGiroSub');
    const keys=['a','b','c'];
    const REST={a:{x:-78,rot:-4},b:{x:0,rot:0},c:{x:78,rot:4}};
    const PATHS={
      a:[{x:0,y:0,rot:0,s:.94},{x:30,y:-8,rot:12,s:.97},{x:-25,y:4,rot:-10,s:.97},
         {x:50,y:-6,rot:14,s:.98},{x:-36,y:3,rot:-8,s:.98},{x:21,y:-4,rot:6,s:.98},
         {x:-88,y:-6,rot:-6,s:1.03},{x:REST.a.x,y:0,rot:REST.a.rot,s:1}],
      b:[{x:0,y:0,rot:0,s:.94},{x:-29,y:5,rot:-11,s:.96},{x:23,y:-6,rot:9,s:.97},
         {x:-45,y:2,rot:-13,s:.98},{x:34,y:-4,rot:8,s:.98},{x:-20,y:4,rot:-6,s:.98},
         {x:5,y:-6,rot:2,s:1.03},{x:REST.b.x,y:0,rot:REST.b.rot,s:1}],
      c:[{x:0,y:0,rot:0,s:.94},{x:-30,y:-6,rot:-12,s:.97},{x:25,y:4,rot:10,s:.97},
         {x:-50,y:-5,rot:-14,s:.98},{x:36,y:3,rot:8,s:.98},{x:-21,y:-3,rot:-6,s:.98},
         {x:88,y:-6,rot:6,s:1.03},{x:REST.c.x,y:0,rot:REST.c.rot,s:1}]
    };
    const STEP_MS=90;
    function setT(el,x,y,rot,s){ el.style.transform=`translate(${x}px,${y}px) rotate(${rot}deg) scale(${s})`; }

    const cardEls=[];
    picks.forEach((card,i)=>{
      const key=keys[i];
      const el=document.createElement('div');
      el.className='g-card';
      el.dataset.key=key;
      el.innerHTML=`
        <div class="g-card-face">
          <div class="g-card-tag">${t('lm.giro_tag')}</div>
          <i class="ph ph-bold ${card.icon} g-card-icon"></i>
          <div class="g-card-title">${card.name}</div>
          <div class="g-card-divider"></div>
          <div class="g-effect g-effect-pos"><b>${card.pos}</b></div>
          <div class="g-effect g-effect-neg"><b>${card.neg}</b></div>
        </div>`;
      el.style.transition=`transform ${STEP_MS}ms cubic-bezier(.4,0,.2,1)`;
      stage.appendChild(el);
      cardEls.push({el,card,key});
    });

    let ready=false, focusedKey=null, resolved=false, hoveredKey=null, idleActive=false;
    const hoverState={a:{s:1,l:0},b:{s:1,l:0},c:{s:1,l:0}};
    const idlePhase={a:0,b:2.1,c:4.2};

    function idleTick(tt){
      if(!idleActive) return;
      cardEls.forEach(({el,key})=>{
        if(focusedKey!==null) return;
        const r=REST[key];
        const bob=Math.sin(tt/650+idlePhase[key])*5;
        const hs=hoverState[key];
        const targetS=(hoveredKey===key)?1.08:1;
        hs.s+=(targetS-hs.s)*0.2;
        const hoverLift=(hoveredKey===key)?-5:0;
        setT(el, r.x, bob+hoverLift, r.rot, hs.s);
      });
      requestAnimationFrame(idleTick);
    }
    function startIdle(){ idleActive=true; cardEls.forEach(({el})=>el.style.transition='none'); requestAnimationFrame(idleTick); }

    function runShuffle(){
      let i=0;
      const maxSteps=PATHS.a.length;
      const iv=setInterval(()=>{
        if(typeof window.playSound==='function') window.playSound('spin');
        cardEls.forEach(({el,key})=>{
          const p=PATHS[key][Math.min(i,PATHS[key].length-1)];
          setT(el,p.x,p.y,p.rot,p.s);
        });
        i++;
        if(i>=maxSteps){
          clearInterval(iv);
          cardEls.forEach(({el,key})=>{
            el.style.transition='transform .3s cubic-bezier(.34,1.56,.64,1)';
            setT(el,REST[key].x,0,REST[key].rot,1);
          });
          setTimeout(()=>{ ready=true; if(sub) sub.textContent=t('lm.giro_picker_sub_toca'); startIdle(); },260);
        }
      },STEP_MS);
    }
    setTimeout(runShuffle,150);

    function focusCard(key){
      idleActive=false;
      focusedKey=key;
      const others=keys.filter(k=>k!==key);
      cardEls.forEach(({el,key:k})=>{
        el.style.transition='transform .32s cubic-bezier(.34,1.56,.64,1)';
        if(k===key){ el.classList.add('focused'); el.classList.remove('dimmed'); setT(el,0,-3,0,1.16); }
        else{
          el.classList.remove('focused'); el.classList.add('dimmed');
          const peekX=(others.indexOf(k)===0)?-52:52;
          setT(el,peekX,10,REST[k].rot,.8);
        }
      });
      if(sub) sub.textContent=t('lm.giro_picker_sub_confirma');
    }
    function unfocusAll(){
      focusedKey=null;
      cardEls.forEach(({el})=>el.classList.remove('focused','dimmed'));
      cardEls.forEach(({el,key})=>{
        el.style.transition='transform .3s cubic-bezier(.34,1.56,.64,1)';
        setT(el,REST[key].x,0,REST[key].rot,1);
      });
      if(sub) sub.textContent=t('lm.giro_picker_sub_toca');
      setTimeout(()=>{ if(focusedKey===null) startIdle(); },320);
    }

    cardEls.forEach(({el,key})=>{
      el.addEventListener('mouseenter', ()=>{ hoveredKey=key; });
      el.addEventListener('mouseleave', ()=>{ if(hoveredKey===key) hoveredKey=null; });
      el.addEventListener('click',(e)=>{
        e.stopPropagation();
        if(!ready||resolved) return;
        if(focusedKey===key){ doResolve(cardEls.find(c=>c.key===key)); return; }
        focusCard(key);
      });
    });
    panel.addEventListener('click',()=>{
      if(!ready||resolved||focusedKey===null) return;
      unfocusAll();
    });

    const giroStart=performance.now();
    const fill=panel.querySelector('#lmGiroTimerFill');
    // Mismo pitido de cuenta atrás que el selector de Giro Táctico de
    // Copa Leyendas — comparación por segundo exacto, no por
    // intervalo, para no repetir el mismo pitido varias veces.
    let lastBeepSec=null;
    const timerHandle=setInterval(()=>{
      const remainMs=Math.max(0, PICKER_MS-(performance.now()-giroStart));
      const remainSec=Math.ceil(remainMs/1000);
      if(remainSec!==lastBeepSec){ lastBeepSec=remainSec; if(typeof checkCountdownBeep==='function') checkCountdownBeep(remainSec, 'lmGiroPicker'); }
      if(fill) fill.style.width=(remainMs/PICKER_MS*100)+'%';
      if(remainMs<=0){
        clearInterval(timerHandle);
        handleTimeout();
      }
    },100);

    function doResolve(entry){
      if(resolved||!entry) return;
      resolved=true;
      idleActive=false;
      clearInterval(timerHandle);
      if(typeof window.playSound==='function') window.playSound('select');
      entry.el.classList.add('confirmed');
      if(sub) sub.textContent=t('lm.giro_picker_aplicando');
      setTimeout(()=>{ stage.classList.add('vanishing'); }, 250);
      setTimeout(()=>{ panel.remove(); aplicarCarta(entry.card, opts); }, 750);
    }
    // Si se agota el tiempo sin confirmar ninguna carta, el uso YA se
    // consumió al pulsar "USAR" en la oferta — como penalización por
    // no decidir a tiempo, se elige una carta al azar entre las 3
    // mostradas (nunca se pierde el uso sin ningún efecto).
    function handleTimeout(){
      if(resolved) return;
      resolved=true;
      idleActive=false;
      panel.remove();
      const azar=picks[Math.floor(Math.random()*picks.length)];
      aplicarCarta(azar, opts);
    }
  }

  /* ---------- 5. Re-simulación de la segunda parte con la carta
     elegida y generación de sus eventos (goles + tarjetas). ---------- */
  function aplicarCarta(card, opts){
    const e=card.effect||{};
    const stMios={
      attack:clamp(opts.misStats.attack+(e.ata||0)),
      defense:clamp(opts.misStats.defense+(e.def||0)),
      pace:clamp(opts.misStats.pace+(e.rit||0)),
      passing:clamp(opts.misStats.passing+(e.pas||0)),
      technique:clamp(opts.misStats.technique+(e.tec||0)),
    };
    const mod=window.tacticalModifier(stMios, opts.rivalStats);
    // Se re-simula solo la mitad que queda: misma base (1.15) que usa
    // simularPartido(), escalada a 45 de los 90 minutos.
    const lambdaMios=Math.max(0.15, (1.15+mod.myScoreMod)*0.5);
    const lambdaRival=Math.max(0.15, (1.15+mod.oppScoreMod)*0.5);
    const golesMios2P=window.poissonSample(lambdaMios);
    const golesRival2P=window.poissonSample(lambdaRival);

    const miLado = opts.esMiEquipoLocal ? 'home' : 'away';
    const rivalLado = opts.esMiEquipoLocal ? 'away' : 'home';
    const eventos=[];
    for(let i=0;i<golesMios2P;i++){
      const goleador = opts.elegirGoleador ? opts.elegirGoleador() : null;
      eventos.push({minute:46+Math.floor(Math.random()*44), team:miLado, type:'goal', jugador:goleador});
    }
    for(let i=0;i<golesRival2P;i++){
      const goleador = opts.jugadorRivalAleatorio ? opts.jugadorRivalAleatorio(opts.rivalTeamObj) : null;
      eventos.push({minute:46+Math.floor(Math.random()*44), team:rivalLado, type:'goal', jugador:goleador});
    }
    const riesgoTarjetaMia=Math.max(0.05, Math.min(0.7, 0.35+(e.riesgoTarjeta||0)-(opts.manoDuraActiva?0.12:0)));
    if(Math.random()<riesgoTarjetaMia){
      const jugador = opts.elegirJugadorAlineado ? opts.elegirJugadorAlineado() : null;
      eventos.push({minute:50+Math.floor(Math.random()*38), team:miLado, type:'card', tarjeta:'amarilla', jugador: jugador||{name:opts.miNombre}});
    }
    if(Math.random()<0.35){
      const jugador = opts.jugadorRivalAleatorio ? opts.jugadorRivalAleatorio(opts.rivalTeamObj) : {name:opts.rivalNombre};
      eventos.push({minute:50+Math.floor(Math.random()*38), team:rivalLado, type:'card', tarjeta:'amarilla', jugador});
    }
    eventos.sort((a,b)=>a.minute-b.minute);
    opts.onResultadoFinal(golesMios2P, golesRival2P, eventos, card);
  }

  /* ---------- 6. Punto de entrada público ---------- */
  window.LMGiroTactico = {
    // opts: {contenedor, t, usosRestantes, misStats, rivalStats,
    //   rivalTeamObj, esMiEquipoLocal, miNombre, rivalNombre,
    //   golesMiosPrimeraParte, golesRivalPrimeraParte,
    //   elegirGoleador, jugadorRivalAleatorio, elegirJugadorAlineado,
    //   onConsumirUso, onResultadoFinal, onCancelado}
    // El propio llamante ya comprueba "vamos perdiendo" y "quedan
    // usos" antes de invocar esto — aquí solo se muestra la oferta.
    ofrecerSiProcede(opts){
      ensureStyles();
      mostrarOferta(opts);
    }
  };

})();
