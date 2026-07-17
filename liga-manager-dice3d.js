/* ============================================================
   GOAL2GOAT — Liga Manager: dados 3D con físicas reales
   ------------------------------------------------------------
   Módulo aparte y autocontenido. Carga Three.js + Cannon-es (JS
   puro, sin WASM, según lo ya decidido) SOLO la primera vez que
   se necesita un dado — así el resto del juego no paga ese peso
   si nunca se usa Liga Manager.
   ============================================================ */
(function(){

  var scriptsLoaded = null; // promesa compartida, para no cargar dos veces

  function loadScript(src){
    return new Promise(function(resolve, reject){
      var s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function ensureLibs(){
    if(scriptsLoaded) return scriptsLoaded;
    scriptsLoaded = Promise.resolve()
      .then(function(){
        if(!window.THREE) return loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js');
      })
      .then(function(){
        if(!window.CANNON) return loadScript('https://unpkg.com/cannon-es@0.20.0/dist/cannon-es.js');
      });
    return scriptsLoaded;
  }

  // Texturas de las 6 caras (pips dibujados en canvas)
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

  // Definición de caras: eje local -> valor de la cara (opuestas suman 7).
  // Se construye dentro de rollDice3D una vez que THREE está cargado.

  /**
   * Lanza N dados con físicas reales dentro de "container" (un div vacío).
   * Llama a onComplete(valores[]) cuando terminan de asentarse.
   */
  function rollDice3D(container, count, onComplete){
    ensureLibs().then(function(){
      var THREE = window.THREE, CANNON = window.CANNON;

      var W = container.clientWidth || 320, H = container.clientHeight || 220;
      var scene = new THREE.Scene();
      var camera = new THREE.PerspectiveCamera(40, W/H, 0.1, 100);
      camera.position.set(0, 6.5, 7);
      camera.lookAt(0,0,0);
      var renderer = new THREE.WebGLRenderer({antialias:true, alpha:true});
      renderer.setSize(W,H);
      renderer.setPixelRatio(window.devicePixelRatio||1);
      container.innerHTML='';
      container.appendChild(renderer.domElement);

      scene.add(new THREE.AmbientLight(0xffffff, 0.6));
      var dl = new THREE.DirectionalLight(0xffffff, 0.8);
      dl.position.set(4,8,5);
      scene.add(dl);

      // Suelo visual (semi-transparente, solo para orientar)
      var groundGeo = new THREE.PlaneGeometry(10,10);
      var groundMat = new THREE.MeshStandardMaterial({color:0x15181a, transparent:true, opacity:0.4});
      var groundMesh = new THREE.Mesh(groundGeo, groundMat);
      groundMesh.rotation.x = -Math.PI/2;
      scene.add(groundMesh);

      var materials = [
        new THREE.MeshStandardMaterial({map:faceTexture(2)}),
        new THREE.MeshStandardMaterial({map:faceTexture(5)}),
        new THREE.MeshStandardMaterial({map:faceTexture(1)}),
        new THREE.MeshStandardMaterial({map:faceTexture(6)}),
        new THREE.MeshStandardMaterial({map:faceTexture(3)}),
        new THREE.MeshStandardMaterial({map:faceTexture(4)})
      ];
      var FACES = [
        {axis:new THREE.Vector3(1,0,0), value:2},
        {axis:new THREE.Vector3(-1,0,0), value:5},
        {axis:new THREE.Vector3(0,1,0), value:1},
        {axis:new THREE.Vector3(0,-1,0), value:6},
        {axis:new THREE.Vector3(0,0,1), value:3},
        {axis:new THREE.Vector3(0,0,-1), value:4}
      ];

      // ---- Mundo físico ----
      var world = new CANNON.World();
      world.gravity.set(0,-18,0);
      world.broadphase = new CANNON.NaiveBroadphase();
      var groundBody = new CANNON.Body({mass:0, shape:new CANNON.Plane()});
      groundBody.quaternion.setFromEuler(-Math.PI/2,0,0);
      world.addBody(groundBody);

      var dieSize = 0.9;
      var dice = [];
      for(var i=0;i<count;i++){
        var mesh = new THREE.Mesh(new THREE.BoxGeometry(dieSize,dieSize,dieSize), materials);
        scene.add(mesh);
        var body = new CANNON.Body({
          mass:1,
          shape:new CANNON.Box(new CANNON.Vec3(dieSize/2,dieSize/2,dieSize/2)),
          position:new CANNON.Vec3((Math.random()-0.5)*2.2, 3+i*1.3, (Math.random()-0.5)*2.2)
        });
        body.angularVelocity.set((Math.random()-0.5)*14,(Math.random()-0.5)*14,(Math.random()-0.5)*14);
        body.velocity.set((Math.random()-0.5)*3,0,(Math.random()-0.5)*3);
        body.linearDamping = 0.35;
        body.angularDamping = 0.35;
        world.addBody(body);
        dice.push({mesh:mesh, body:body});
      }

      var start = performance.now();
      var DURATION = 2600;
      function animate(now){
        var elapsed = now-start;
        world.step(1/60);
        dice.forEach(function(d){
          d.mesh.position.copy(d.body.position);
          d.mesh.quaternion.copy(d.body.quaternion);
        });
        renderer.render(scene,camera);
        if(elapsed < DURATION){
          requestAnimationFrame(animate);
        } else {
          // Leer valor de cada dado: la cara cuyo eje local, tras rotar
          // por el quaternion final, apunta más hacia +Y (arriba) es la
          // que ha quedado boca arriba.
          var resultados = dice.map(function(d){
            var q = new THREE.Quaternion(d.body.quaternion.x,d.body.quaternion.y,d.body.quaternion.z,d.body.quaternion.w);
            var best=null, bestDot=-Infinity;
            FACES.forEach(function(f){
              var v = f.axis.clone().applyQuaternion(q);
              var dot = v.dot(new THREE.Vector3(0,1,0));
              if(dot>bestDot){ bestDot=dot; best=f.value; }
            });
            return best;
          });
          onComplete(resultados);
        }
      }
      requestAnimationFrame(animate);
    }).catch(function(err){
      console.error('No se pudieron cargar las librerías de físicas 3D:', err);
      // Fallback: si falla la carga (p.ej. sin conexión), resolvemos con
      // tiradas normales de Math.random() para que el juego nunca se
      // quede bloqueado esperando algo que no va a llegar.
      var resultados = [];
      for(var i=0;i<count;i++) resultados.push(1+Math.floor(Math.random()*6));
      onComplete(resultados);
    });
  }

  window.G2G_rollDice3D = rollDice3D;

})();
