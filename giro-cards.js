/* ═══════════════════════════════════════════════════════════════
   GIRO TÁCTICO — datos de las 20 cartas, archivo separado de
   game.js (extraído tal cual, sin cambios de comportamiento) como
   parte del plan de dividir el proyecto en archivos más pequeños y
   manejables. Se carga como un <script> normal justo después de
   game.js, compartiendo el mismo ámbito global — el resto del
   juego lo sigue viendo exactamente igual que antes de moverlo aquí.

   La LÓGICA de pausar/elegir/aplicar una carta sigue en game.js,
   entrelazada con el motor de partido (playMatch/showLiveMatch) —
   separarla también habría significado tocar el núcleo del bucle de
   partido, con mucho más riesgo. Aquí solo viven los DATOS: nombre,
   icono, textos y el efecto numérico de cada carta. Añadir una carta
   nueva, o ajustar el equilibrio de las que hay, se hace entero
   dentro de este archivo, sin tocar game.js para nada.
   ═══════════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════════════════════════
   GIRO TÁCTICO — habilidad de un jugador: pausa el partido en
   cualquier momento y elige una de 3 cartas al azar (de estas 20).
   Cada carta tiene un beneficio y una contrapartida negativa, ambos
   aplicados a TU equipo durante lo que resta de partido.
   ════════════════════════════════════════════════════════════ */
const GIRO_CARDS = [
  { id:'presion_alta', name:'PRESIÓN ALTA', icon:'ph-arrow-fat-lines-up',
    pos:'+20% ataque', neg:'−8% resistencia (persistente)',
    apply(ctx){ ctx.myLambda+=0.14; ctx.fatigue-=8; } },
  { id:'cierre_atras', name:'CIERRE ATRÁS', icon:'ph-shield-check',
    pos:'+22% defensa', neg:'−7% ataque',
    apply(ctx){ ctx.oppLambda-=0.16; ctx.myLambda-=0.05; } },
  { id:'hidratacion', name:'PAUSA DE HIDRATACIÓN', icon:'ph-drop',
    pos:'+18% resistencia (persistente)', neg:'−4% ritmo',
    apply(ctx){ ctx.fatigue+=18; ctx.myLambda-=0.02; } },
  { id:'golpe_pizarra', name:'GOLPE DE PIZARRA', icon:'ph-chalkboard-teacher',
    pos:'+13% ataque y +13% defensa', neg:'−14% resistencia (persistente)',
    apply(ctx){ ctx.myLambda+=0.09; ctx.oppLambda-=0.09; ctx.fatigue-=14; } },
  { id:'grito_capitan', name:'GRITO DEL CAPITÁN', icon:'ph-megaphone',
    pos:'+14% moral (persistente)', neg:'más riesgo de tarjeta propia',
    apply(ctx){ ctx.morale+=14; ctx.cardRiskDelta+=0.05; } },
  { id:'tiquitaca', name:'TIQUI-TACA FORZADO', icon:'ph-arrows-clockwise',
    pos:'+16% pase y control del balón', neg:'−4% defensa (te expones al contragolpe)',
    apply(ctx){ ctx.myLambda+=0.10; ctx.oppLambda+=0.03; } },
  { id:'contragolpe', name:'CONTRAGOLPE RELÁMPAGO', icon:'ph-lightning',
    pos:'+21% ritmo', neg:'−7% defensa',
    apply(ctx){ ctx.myLambda+=0.15; ctx.oppLambda+=0.05; } },
  { id:'muro', name:'MURO DEFENSIVO', icon:'ph-wall',
    pos:'+26% defensa', neg:'−9% pase',
    apply(ctx){ ctx.oppLambda-=0.18; ctx.myLambda-=0.04; } },
  { id:'orden_banquillo', name:'ORDEN DEL BANQUILLO', icon:'ph-clipboard-text',
    pos:'+15% resistencia (persistente)', neg:'−5% moral (persistente)',
    apply(ctx){ ctx.fatigue+=15; ctx.morale-=5; } },
  { id:'estrella', name:'ESTRELLA DEL PARTIDO', icon:'ph-star',
    pos:'+25 valoración al mejor jugador y +6% ataque', neg:'más riesgo de lesión (ese jugador)',
    apply(ctx){ ctx.starBoost=25; ctx.myLambda+=0.03; ctx.injuryRiskDelta+=0.05; } },
  { id:'fuera_juego', name:'FUERA DE JUEGO PROVOCADO', icon:'ph-flag',
    pos:'+16% defensa', neg:'−6% técnica',
    apply(ctx){ ctx.oppLambda-=0.11; ctx.myLambda-=0.03; } },
  { id:'balon_parado', name:'BALÓN PARADO ENSAYADO', icon:'ph-target',
    pos:'+22% ataque', neg:'−5% pase en juego abierto',
    apply(ctx){ ctx.myLambda+=0.16; ctx.myLambda-=0.03; } },
  { id:'presion_asfixiante', name:'PRESIÓN ASFIXIANTE', icon:'ph-wind',
    pos:'+21% defensa y +11% ritmo', neg:'−14% resistencia (persistente)',
    apply(ctx){ ctx.oppLambda-=0.15; ctx.myLambda+=0.05; ctx.fatigue-=14; } },
  { id:'rondo', name:'RONDO DE VESTUARIO', icon:'ph-circle-dashed',
    pos:'+18% técnica y cohesión de equipo', neg:'−3% defensa (algo de riesgo)',
    apply(ctx){ ctx.myLambda+=0.09; ctx.oppLambda+=0.01; } },
  { id:'lectura_arbitro', name:'LECTURA DEL ÁRBITRO', icon:'ph-eye',
    pos:'mucho menos riesgo de tarjeta propia', neg:'−4% ataque',
    apply(ctx){ ctx.cardRiskDelta-=0.06; ctx.myLambda-=0.03; } },
  { id:'viento_favor', name:'VIENTO A FAVOR', icon:'ph-wind',
    pos:'+16% ritmo y +14% pase', neg:'−3% técnica',
    apply(ctx){ ctx.myLambda+=0.11; ctx.myLambda-=0.02; } },
  { id:'grada_favor', name:'GRADA A FAVOR', icon:'ph-users-three',
    pos:'+16% moral (persistente)', neg:'−8% resistencia (persistente)',
    apply(ctx){ ctx.morale+=16; ctx.fatigue-=8; } },
  { id:'tiempo_controlado', name:'TIEMPO CONTROLADO', icon:'ph-hourglass-medium',
    pos:'apenas pierdes resistencia el resto del partido (persistente)', neg:'−4% ataque',
    apply(ctx){ ctx.fatigue+=14; ctx.myLambda-=0.03; } },
  { id:'prorroga_mental', name:'PRÓRROGA MENTAL', icon:'ph-brain',
    pos:'+9% en todas las estadísticas', neg:'−10% resistencia (persistente)',
    apply(ctx){ ctx.myLambda+=0.06; ctx.oppLambda-=0.06; ctx.fatigue-=10; } },
  { id:'ultima_bala', name:'ÚLTIMA BALA', icon:'ph-fire',
    pos:'+32% ataque', neg:'−15% defensa',
    apply(ctx){ ctx.myLambda+=0.22; ctx.oppLambda+=0.10; } },
];
