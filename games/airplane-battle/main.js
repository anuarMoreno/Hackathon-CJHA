// main.js
// 3D airplane battle: WASD + mouse flight, fist gesture to shoot.

let scene, camera, renderer;
let playerGroup, playerBody;
let bullets = [];
let enemies = [];
let skyDome;
let groundPlane;
let cloudGroup;
let sunLight;
let sunGlow;

const keys = { w: false, a: false, s: false, d: false };
let isPointerLocked = false;
let pitch = 0;
let yaw = 0;
let roll = 0;

let speed = 40;
const MIN_SPEED = 20;
const MAX_SPEED = 80;

let lastTime = 0;
let killCount = 0;
let shootCooldown = 0;

init();
requestAnimationFrame(animate);

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87a7ff);
  scene.fog = new THREE.Fog(0x9bbcff, 250, 1200);

  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.body.appendChild(renderer.domElement);

  // Ground/ocean layer (gives horizon + motion cues)
  const groundGeo = new THREE.PlaneGeometry(6000, 6000, 1, 1);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x0b3b6f,
    metalness: 0.05,
    roughness: 0.9,
  });
  groundPlane = new THREE.Mesh(groundGeo, groundMat);
  groundPlane.rotation.x = -Math.PI / 2;
  groundPlane.position.y = 0;
  groundPlane.receiveShadow = true;
  scene.add(groundPlane);

  const hemi = new THREE.HemisphereLight(0xe0f2fe, 0x0b1020, 0.9);
  scene.add(hemi);

  sunLight = new THREE.DirectionalLight(0xffffff, 1.15);
  sunLight.position.set(280, 420, 120);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.camera.near = 1;
  sunLight.shadow.camera.far = 1400;
  sunLight.shadow.camera.left = -700;
  sunLight.shadow.camera.right = 700;
  sunLight.shadow.camera.top = 700;
  sunLight.shadow.camera.bottom = -700;
  scene.add(sunLight);

  // Sun glow (billboarded sprite-like plane)
  const sunGlowGeo = new THREE.PlaneGeometry(140, 140);
  const sunGlowMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uColor: { value: new THREE.Color(0xfff1cc) },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform vec3 uColor;
      void main() {
        vec2 p = vUv - vec2(0.5);
        float d = length(p) * 2.0;
        float a = smoothstep(1.0, 0.0, d);
        a = pow(a, 1.8);
        gl_FragColor = vec4(uColor, a * 0.55);
      }
    `,
  });
  sunGlow = new THREE.Mesh(sunGlowGeo, sunGlowMat);
  sunGlow.position.set(520, 420, -520);
  scene.add(sunGlow);

  const skyGeo = new THREE.SphereGeometry(800, 32, 32);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
      topColor: { value: new THREE.Color(0x1d4ed8) },
      bottomColor: { value: new THREE.Color(0xbfefff) },
      offset: { value: 30.0 },
      exponent: { value: 0.75 },
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      uniform float offset;
      uniform float exponent;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition + vec3(0.0, offset, 0.0)).y;
        float t = pow(max(h, 0.0), exponent);
        vec3 col = mix(bottomColor, topColor, t);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  skyDome = new THREE.Mesh(skyGeo, skyMat);
  scene.add(skyDome);

  // Cloud layers (billboard planes) for a more "aerial" look
  cloudGroup = new THREE.Group();
  scene.add(cloudGroup);
  const cloudPlaneGeo = new THREE.PlaneGeometry(60, 40);
  const cloudPlaneMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uOpacity: { value: 0.55 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform float uOpacity;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p){
        vec2 i = floor(p);
        vec2 f = fract(p);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        vec2 u = f*f*(3.0-2.0*f);
        return mix(a, b, u.x) + (c-a)*u.y*(1.0-u.x) + (d-b)*u.x*u.y;
      }
      void main() {
        vec2 p = vUv * vec2(3.0, 2.0);
        float n = 0.0;
        float amp = 0.6;
        for (int k = 0; k < 4; k++) {
          n += noise(p) * amp;
          p *= 2.0;
          amp *= 0.5;
        }
        float edge = smoothstep(0.15, 0.85, n);
        float alpha = edge * uOpacity;
        // soften edges
        float vign = smoothstep(0.0, 0.2, vUv.x) * smoothstep(0.0, 0.2, vUv.y) *
                     smoothstep(0.0, 0.2, 1.0 - vUv.x) * smoothstep(0.0, 0.2, 1.0 - vUv.y);
        alpha *= vign;
        gl_FragColor = vec4(vec3(1.0), alpha);
      }
    `,
  });

  for (let i = 0; i < 70; i++) {
    const c = new THREE.Mesh(cloudPlaneGeo, cloudPlaneMat);
    c.position.set(
      (Math.random() - 0.5) * 1400,
      60 + Math.random() * 220,
      (Math.random() - 0.5) * 1400
    );
    c.userData = {
      drift: 2 + Math.random() * 6,
      phase: Math.random() * Math.PI * 2,
      baseY: c.position.y,
      scale: 0.7 + Math.random() * 1.7,
    };
    c.scale.setScalar(c.userData.scale);
    cloudGroup.add(c);
  }

  playerGroup = new THREE.Group();
  playerGroup.position.set(0, 80, 0);
  scene.add(playerGroup);

  const fuselageGeo = new THREE.CylinderGeometry(0.8, 1.2, 8, 16);
  const fuselageMat = new THREE.MeshStandardMaterial({
    color: 0x1f2937,
    metalness: 0.8,
    roughness: 0.3,
  });
  playerBody = new THREE.Mesh(fuselageGeo, fuselageMat);
  playerBody.rotation.z = Math.PI / 2;
  playerBody.castShadow = true;
  playerBody.receiveShadow = true;
  playerGroup.add(playerBody);

  const cockpitGeo = new THREE.SphereGeometry(1.0, 16, 16);
  const cockpitMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    metalness: 0.9,
    roughness: 0.05,
    transparent: true,
    opacity: 0.7,
  });
  const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
  cockpit.position.set(1.5, 0.6, 0);
  cockpit.castShadow = true;
  playerGroup.add(cockpit);

  const wingGeo = new THREE.BoxGeometry(0.3, 8, 1);
  const wingMat = new THREE.MeshStandardMaterial({
    color: 0x9ca3af,
    metalness: 0.7,
    roughness: 0.3,
  });
  const leftWing = new THREE.Mesh(wingGeo, wingMat);
  leftWing.position.set(0, 0, -3.5);
  leftWing.castShadow = true;
  const rightWing = leftWing.clone();
  rightWing.position.z = 3.5;
  playerGroup.add(leftWing, rightWing);

  const tailGeo = new THREE.BoxGeometry(0.3, 2.2, 1);
  const tail = new THREE.Mesh(tailGeo, wingMat);
  tail.position.set(-3.8, 1.0, 0);
  tail.castShadow = true;
  playerGroup.add(tail);

  const vTailGeo = new THREE.BoxGeometry(0.3, 0.6, 3);
  const vTail = new THREE.Mesh(vTailGeo, wingMat);
  vTail.position.set(-3.5, -0.2, 0);
  vTail.castShadow = true;
  playerGroup.add(vTail);

  const muzzleGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.9, 8);
  const muzzleMat = new THREE.MeshStandardMaterial({
    color: 0xf97316,
    metalness: 0.9,
    roughness: 0.3,
  });
  const muzzleLeft = new THREE.Mesh(muzzleGeo, muzzleMat);
  muzzleLeft.rotation.z = Math.PI / 2;
  muzzleLeft.position.set(4.2, -0.1, -0.6);
  const muzzleRight = muzzleLeft.clone();
  muzzleRight.position.z = 0.6;
  playerGroup.add(muzzleLeft, muzzleRight);

  pitch = 0;
  yaw = 0;
  roll = 0;
  updatePlayerOrientation();

  camera.position.copy(playerGroup.position);
  camera.position.add(new THREE.Vector3(-6, 2, 0));
  camera.lookAt(playerGroup.position.clone().add(new THREE.Vector3(10, 0, 0)));

  for (let i = 0; i < 8; i++) spawnEnemy();

  window.addEventListener('resize', onResize);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('mousedown', onMouseDown);

  document.body.addEventListener('click', () => {
    if (!isPointerLocked && document.body.requestPointerLock) {
      document.body.requestPointerLock();
    }
  });

  document.addEventListener('pointerlockchange', () => {
    isPointerLocked = document.pointerLockElement === document.body;
  });

  document.addEventListener('mousemove', (e) => {
    if (!isPointerLocked) return;
    const sensitivity = 0.0018;
    pitch -= e.movementY * sensitivity;
    yaw -= e.movementX * sensitivity;
    const maxPitch = Math.PI / 3;
    pitch = Math.max(-maxPitch, Math.min(maxPitch, pitch));
  });
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onKeyDown(e) {
  const k = e.key.toLowerCase();
  if (k in keys) keys[k] = true;
}

function onKeyUp(e) {
  const k = e.key.toLowerCase();
  if (k in keys) keys[k] = false;
}

function onMouseDown(e) {
  if (!isPointerLocked) return;
  if (e.button === 0) shoot();
}

window.addEventListener('contextmenu', (e) => e.preventDefault());

function updatePlayerOrientation() {
  const q = new THREE.Quaternion();
  const qPitch = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), pitch);
  const qYaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
  const qRoll = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), roll * 0.5);
  q.multiply(qYaw).multiply(qPitch).multiply(qRoll);
  playerGroup.quaternion.copy(q);
}

function updatePlayer(dt) {
  if (keys.w) speed += 30 * dt;
  if (keys.s) speed -= 30 * dt;
  speed = THREE.MathUtils.clamp(speed, MIN_SPEED, MAX_SPEED);

  if (keys.a) roll += 1.5 * dt;
  if (keys.d) roll -= 1.5 * dt;
  roll *= 0.95;

  updatePlayerOrientation();

  const forward = new THREE.Vector3(1, 0, 0).applyQuaternion(playerGroup.quaternion);
  playerGroup.position.addScaledVector(forward, speed * dt);

  const targetCameraOffset = new THREE.Vector3(-10, 3.2, 0).applyQuaternion(playerGroup.quaternion);
  const targetCameraPos = playerGroup.position.clone().add(targetCameraOffset);
  camera.position.lerp(targetCameraPos, 0.22);
  const lookAhead = playerGroup.position.clone().addScaledVector(forward, 30);
  camera.lookAt(lookAhead);

  skyDome.position.copy(playerGroup.position);
  groundPlane.position.set(playerGroup.position.x, 0, playerGroup.position.z);

  // Keep sun roughly consistent in the sky relative to player
  sunGlow.position.copy(playerGroup.position).add(new THREE.Vector3(520, 420, -520));
  sunGlow.lookAt(camera.position);

  // Move and billboard clouds
  if (cloudGroup) {
    const t = performance.now() * 0.001;
    for (const c of cloudGroup.children) {
      c.position.x += c.userData.drift * dt;
      c.position.z += c.userData.drift * 0.6 * dt;
      c.position.y = c.userData.baseY + Math.sin(t + c.userData.phase) * 2.0;
      c.lookAt(camera.position);

      // wrap around the player so clouds keep coming
      const dx = c.position.x - playerGroup.position.x;
      const dz = c.position.z - playerGroup.position.z;
      const wrap = 900;
      if (dx > wrap) c.position.x -= wrap * 2;
      if (dx < -wrap) c.position.x += wrap * 2;
      if (dz > wrap) c.position.z -= wrap * 2;
      if (dz < -wrap) c.position.z += wrap * 2;
    }
  }

  // Update HUD values (throttle, speed, altitude)
  const thr = ((speed - MIN_SPEED) / (MAX_SPEED - MIN_SPEED)) * 100;
  const thrClamped = THREE.MathUtils.clamp(thr, 0, 100);
  const thrEl = document.getElementById('throttlePct');
  const thrFill = document.getElementById('throttleFill');
  if (thrEl) thrEl.textContent = `${Math.round(thrClamped)}%`;
  if (thrFill) thrFill.style.width = `${thrClamped}%`;

  const spdEl = document.getElementById('speedReadout');
  if (spdEl) spdEl.textContent = `${Math.round(speed)}`;

  const altEl = document.getElementById('altitudeReadout');
  if (altEl) altEl.textContent = `${Math.round(playerGroup.position.y)}`;
}

function spawnEnemy() {
  const bodyGeo = new THREE.ConeGeometry(1.0, 5, 12);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x7f1d1d,
    metalness: 0.7,
    roughness: 0.35,
  });
  const enemy = new THREE.Mesh(bodyGeo, bodyMat);
  enemy.castShadow = true;
  enemy.receiveShadow = true;

  const angle = Math.random() * Math.PI * 2;
  const radius = 120 + Math.random() * 120;
  const height = 60 + Math.random() * 80;
  enemy.position.set(
    playerGroup.position.x + Math.cos(angle) * radius,
    height,
    playerGroup.position.z + Math.sin(angle) * radius
  );

  const lookAtPlayer = playerGroup.position.clone();
  enemy.lookAt(lookAtPlayer);

  enemy.userData = {
    velocity: new THREE.Vector3().subVectors(lookAtPlayer, enemy.position).setLength(18),
    health: 3,
  };

  scene.add(enemy);
  enemies.push(enemy);
}

function shoot() {
  if (shootCooldown > 0) return;
  shootCooldown = 0.15;

  const forward = new THREE.Vector3(1, 0, 0).applyQuaternion(playerGroup.quaternion);
  const right = new THREE.Vector3(0, 0, 1).applyQuaternion(playerGroup.quaternion);

  const origins = [
    playerGroup.position.clone().addScaledVector(forward, 4.5).addScaledVector(right, -0.6),
    playerGroup.position.clone().addScaledVector(forward, 4.5).addScaledVector(right, 0.6),
  ];

  const bulletGeo = new THREE.SphereGeometry(0.15, 12, 12);
  const bulletMat = new THREE.MeshStandardMaterial({
    color: 0xf97316,
    emissive: 0xf97316,
    emissiveIntensity: 1.2,
    metalness: 0.8,
    roughness: 0.2,
  });

  origins.forEach((origin) => {
    const bullet = new THREE.Mesh(bulletGeo, bulletMat);
    bullet.position.copy(origin);
    bullet.castShadow = true;
    scene.add(bullet);
    bullets.push({
      mesh: bullet,
      velocity: forward.clone().multiplyScalar(160),
      ttl: 2.0,
    });
  });
}

window.handleGestureShoot = function () {
  if (!isPointerLocked) return;
  shoot();
};

function updateBullets(dt) {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.mesh.position.addScaledVector(b.velocity, dt);
    b.ttl -= dt;
    if (b.ttl <= 0) {
      scene.remove(b.mesh);
      bullets.splice(i, 1);
    }
  }
}

function updateEnemies(dt) {
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    const vel = e.userData.velocity;
    e.position.addScaledVector(vel, dt);

    const toPlayer = new THREE.Vector3().subVectors(playerGroup.position, e.position);
    if (toPlayer.length() > 200) {
      vel.addScaledVector(toPlayer.normalize(), 10 * dt);
    }

    e.lookAt(playerGroup.position);

    for (let j = bullets.length - 1; j >= 0; j--) {
      const b = bullets[j];
      if (b.mesh.position.distanceTo(e.position) < 2) {
        e.userData.health -= 1;
        scene.remove(b.mesh);
        bullets.splice(j, 1);
        if (e.userData.health <= 0) {
          scene.remove(e);
          enemies.splice(i, 1);
          killCount++;
          const killEl = document.getElementById('killCount');
          if (killEl) killEl.textContent = killCount.toString();
          spawnEnemy();
        }
        break;
      }
    }
  }
}

function animate(now) {
  requestAnimationFrame(animate);
  if (!lastTime) lastTime = now;
  let dt = (now - lastTime) / 1000;
  lastTime = now;

  // Cap dt to avoid big jumps when tab was inactive
  dt = Math.min(dt, 1 / 30);

  shootCooldown = Math.max(0, shootCooldown - dt);

  updatePlayer(dt);
  updateBullets(dt);
  updateEnemies(dt);

  renderer.render(scene, camera);
}

