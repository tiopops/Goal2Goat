/* ============================================================
   GOAL2GOAT — Liga Manager: dados 3D con físicas propias
   ------------------------------------------------------------
   v2: se elimina la dependencia de Cannon-es. Los dos intentos
   anteriores con Cannon-es fallaron en el navegador real (se
   distribuye como módulo ES puro, sin build de script clásico
   fiable) — en vez de seguir dependiendo de dos librerías
   externas con dos estrategias de carga distintas, esto usa
   SOLO Three.js (carga estándar, un único script clásico) y una
   integración física propia y sencilla (gravedad, rebote,
   fricción, rotación angular) — suficiente para un dado, sin
   necesitar un motor de físicas de propósito general.
   ============================================================ */
(function(){

  var threeLoaded = null;

  function loadScript(src){
    return new Promise(function(resolve, reject){
      var s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = function(){ reject(new Error('No se pudo cargar '+src)); };
      document.head.appendChild(s);
    });
  }

  function ensureThree(){
    if(threeLoaded) return threeLoaded;
    threeLoaded = window.THREE
      ? Promise.resolve()
      : loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js');
    return threeLoaded;
  }

  function faceTexture(n){
    var c = document.createElement('canvas');
    c.width = c.height = 256;
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#f2ede4';
    ctx.beginPath();
    ctx.moveTo(24,0); ctx.arcTo(256,0,256,256,24); ctx.arcTo(256,256,0,256,24);
    ctx.arcTo(0,256,0,0,24); ctx.arcTo(0,0,256,0,24); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#1a1a1a';
    var pos = {
      1: [[128,128]],
      2: [[80,80],[176,176]],
      3: [[72,72],[128,128],[184,184]],
      4: [[80,80],[176,80],[80,176],[176,176]],
      5: [[80,80],[176,80],[128,128],[80,176],[176,176]],
      6: [[80,64],[176,64],[80,128],[176,128],[80,192],[176,192]]
    }[n];
    pos.forEach(function(p){ ctx.beginPath(); ctx.arc(p[0],p[1],20,0,Math.PI*2); ctx.fill(); });
    return new window.THREE.CanvasTexture(c);
  }

  /**
   * Lanza N dados con una integración física propia (gravedad + rebote +
   * fricción + rotación angular) dentro de "container". Llama a
   * onComplete(valores[]) cuando terminan de asentarse.
   */
  function rollDice3D(container, count, onComplete){
    ensureThree().then(function(){
      var THREE = window.THREE;
      var W = container.clientWidth || 280, H = container.clientHeight || 200;

      var scene = new THREE.Scene();
      var camera = new THREE.PerspectiveCamera(40, W/H, 0.1, 100);
      camera.position.set(0, 6.2, 6.6);
      camera.lookAt(0, 0.3, 0);
      var renderer = new THREE.WebGLRenderer({antialias:true, alpha:true});
      renderer.setSize(W,H);
      renderer.setPixelRatio(window.devicePixelRatio||1);
      container.innerHTML='';
      container.appendChild(renderer.domElement);

      scene.add(new THREE.AmbientLight(0xffffff, 0.65));
      var dl = new THREE.DirectionalLight(0xffffff, 0.75);
      dl.position.set(4,8,5);
      scene.add(dl);

      var ground = new THREE.Mesh(
        new THREE.PlaneGeometry(10,10),
        new THREE.MeshStandardMaterial({color:0x15181a, transparent:true, opacity:0.35})
      );
      ground.rotation.x = -Math.PI/2;
      scene.add(ground);

      var materials = [
        new THREE.MeshStandardMaterial({map:faceTexture(2)}), // +X
        new THREE.MeshStandardMaterial({map:faceTexture(5)}), // -X
        new THREE.MeshStandardMaterial({map:faceTexture(1)}), // +Y
        new THREE.MeshStandardMaterial({map:faceTexture(6)}), // -Y
        new THREE.MeshStandardMaterial({map:faceTexture(3)}), // +Z
        new THREE.MeshStandardMaterial({map:faceTexture(4)})  // -Z
      ];
      var FACES = [
        {axis:new THREE.Vector3(1,0,0), value:2},
        {axis:new THREE.Vector3(-1,0,0), value:5},
        {axis:new THREE.Vector3(0,1,0), value:1},
        {axis:new THREE.Vector3(0,-1,0), value:6},
        {axis:new THREE.Vector3(0,0,1), value:3},
        {axis:new THREE.Vector3(0,0,-1), value:4}
      ];

      var SIZE = 0.9, HALF = SIZE/2;
      var GRAVITY = -14, RESTITUTION = 0.42, FRICTION = 0.78, ANG_DAMPING = 0.9;

      var dice = [];
      for(var i=0;i<count;i++){
        var mesh = new THREE.Mesh(new THREE.BoxGeometry(SIZE,SIZE,SIZE), materials);
        mesh.position.set((Math.random()-0.5)*2.4, 3.2+i*1.1, (Math.random()-0.5)*2.4);
        mesh.rotation.set(Math.random()*Math.PI*2, Math.random()*Math.PI*2, Math.random()*Math.PI*2);
        scene.add(mesh);
        dice.push({
          mesh: mesh,
          vel: new THREE.Vector3((Math.random()-0.5)*2.5, 0, (Math.random()-0.5)*2.5),
          angVel: new THREE.Vector3((Math.random()-0.5)*12, (Math.random()-0.5)*12, (Math.random()-0.5)*12),
          bounces: 0,
          settled: false
        });
      }

      var start = performance.now();
      var last = start;
      var MAX_DURATION = 3400;
      var SETTLE_BOUNCES = 3;

      function integrarRotacion(mesh, angVel, dt){
        // Rotación por velocidad angular usando un quaternion incremental —
        // evita el gimbal lock de sumar euler ángulos directamente.
        var angle = angVel.length()*dt;
        if(angle < 1e-6) return;
        var axis = angVel.clone().normalize();
        var dq = new THREE.Quaternion().setFromAxisAngle(axis, angle);
        mesh.quaternion.premultiply(dq);
      }

      function snapCaraArriba(mesh){
        // Al terminar, se ajusta la orientación para que una cara quede
        // perfectamente plana hacia arriba (la física real nunca deja el
        // cubo matemáticamente perfecto, así que se "encaja" al final,
        // igual que hacen la mayoría de juegos con dados 3D).
        var best=null, bestDot=-Infinity;
        FACES.forEach(function(f){
          var v = f.axis.clone().applyQuaternion(mesh.quaternion);
          var d = v.dot(new THREE.Vector3(0,1,0));
          if(d>bestDot){ bestDot=d; best=f; }
        });
        // Rotar el quaternion actual para que "best.axis" apunte exactamente a +Y
        var current = best.axis.clone().applyQuaternion(mesh.quaternion).normalize();
        var target = new THREE.Vector3(0,1,0);
        var correction = new THREE.Quaternion().setFromUnitVectors(current, target);
        mesh.quaternion.premultiply(correction);
        return best.value;
      }

      function tick(now){
        var dt = Math.min((now-last)/1000, 1/30);
        last = now;
        var elapsed = now-start;
        var todosAsentados = true;

        dice.forEach(function(d){
          if(d.settled){ return; }
          todosAsentados = false;

          d.vel.y += GRAVITY*dt;
          d.mesh.position.x += d.vel.x*dt;
          d.mesh.position.y += d.vel.y*dt;
          d.mesh.position.z += d.vel.z*dt;
          integrarRotacion(d.mesh, d.angVel, dt);

          if(d.mesh.position.y <= HALF){
            d.mesh.position.y = HALF;
            d.vel.y = -d.vel.y*RESTITUTION;
            d.vel.x *= FRICTION;
            d.vel.z *= FRICTION;
            d.angVel.multiplyScalar(ANG_DAMPING);
            d.bounces++;
            if(Math.abs(d.vel.y) < 0.4 && d.bounces>=SETTLE_BOUNCES){
              d.vel.set(0,0,0);
              d.angVel.set(0,0,0);
              d.settled = true;
              d.value = snapCaraArriba(d.mesh);
            }
          }
        });

        renderer.render(scene, camera);

        if((!todosAsentados) && elapsed < MAX_DURATION){
          requestAnimationFrame(tick);
        } else {
          // Si se agota el tiempo máximo sin asentar del todo (raro), se
          // fuerza el encaje final de los que sigan en el aire.
          var resultados = dice.map(function(d){
            if(d.value===undefined) d.value = snapCaraArriba(d.mesh);
            return d.value;
          });
          renderer.render(scene, camera);
          onComplete(resultados);
        }
      }
      requestAnimationFrame(tick);

    }).catch(function(err){
      console.error('No se pudo cargar Three.js para el dado 3D:', err);
      var resultados = [];
      for(var i=0;i<count;i++) resultados.push(1+Math.floor(Math.random()*6));
      onComplete(resultados);
    });
  }

  window.G2G_rollDice3D = rollDice3D;

})();
