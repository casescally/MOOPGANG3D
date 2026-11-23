import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

/* =========================================================
   MOOP GANG CLUBHOUSE — GLB MAIN SCENE
   Model: ./assets/models/moopGangClubHousePhotoMatch1.glb
   ========================================================= */

const container = document.querySelector('#scene-container');
const loadingScreen = document.querySelector('#loading-screen');
const explorePrompt = document.querySelector('#explore-prompt');
const archivePanel = document.querySelector('#archive-panel');
const closeButton = document.querySelector('#close-archive');
const returnButton = document.querySelector('#return-button');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080a08);
scene.fog = new THREE.FogExp2(0x080a08, 0.012);

const camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, 0.1, 250);
camera.position.set(0, 1.65, 8);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
container.appendChild(renderer.domElement);

const controls = new PointerLockControls(camera, renderer.domElement);
const movement = { forward: false, backward: false, left: false, right: false, sprint: false };
const WALK_SPEED = 4, SPRINT_SPEED = 8;
const clock = new THREE.Clock();
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const clickableObjects = [];
const interactableMeshes = [];
const animatedObjects = [];
let clubhouse = null;
let pcWindowOpen = false;
let audioStarted = false;
let greenLight = null;

const lights = new THREE.Group();
scene.add(lights);
scene.add(new THREE.HemisphereLight(0x87947b, 0x171b16, 1.1));
greenLight = new THREE.PointLight(0xa6ff35, 30, 40, 2);
greenLight.position.set(-3, 4, -3);
scene.add(greenLight);
const pinkLight = new THREE.PointLight(0xff2ca8, 14, 24, 2);
pinkLight.position.set(4, 3, -5);
scene.add(pinkLight);
const blueLight = new THREE.PointLight(0x37cfff, 10, 24, 2);
blueLight.position.set(-6, 2, -6);
scene.add(blueLight);
const directionalLight = new THREE.DirectionalLight(0xd0d6bd, 1.3);
directionalLight.position.set(3, 8, 5);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(2048, 2048);
scene.add(directionalLight);

function showExplorePrompt(show = true) {
    if (!explorePrompt) return;
    explorePrompt.classList.toggle('hidden', !show);
}
function startExplore() {
    if (pcWindowOpen) return;
    controls.lock();
}
explorePrompt?.addEventListener('click', startExplore);
controls.addEventListener('lock', () => showExplorePrompt(false));
controls.addEventListener('unlock', () => {
    if (!pcWindowOpen) showExplorePrompt(true);
});
document.addEventListener('keydown', (event) => {
    if (pcWindowOpen) return;
    switch (event.code) {
        case 'KeyW': case 'ArrowUp': movement.forward = true; break;
        case 'KeyS': case 'ArrowDown': movement.backward = true; break;
        case 'KeyA': case 'ArrowLeft': movement.left = true; break;
        case 'KeyD': case 'ArrowRight': movement.right = true; break;
        case 'ShiftLeft': case 'ShiftRight': movement.sprint = true; break;
    }
});
document.addEventListener('keyup', (event) => {
    switch (event.code) {
        case 'KeyW': case 'ArrowUp': movement.forward = false; break;
        case 'KeyS': case 'ArrowDown': movement.backward = false; break;
        case 'KeyA': case 'ArrowLeft': movement.left = false; break;
        case 'KeyD': case 'ArrowRight': movement.right = false; break;
        case 'ShiftLeft': case 'ShiftRight': movement.sprint = false; break;
    }
});
window.addEventListener('blur', () => Object.keys(movement).forEach(k => movement[k] = false));

/* Virtual desktop overlay: normal cursor returns while this is open. */
function createVirtualPC() {
    const overlay = document.createElement('div');
    overlay.id = 'virtual-pc-window';
    overlay.innerHTML = `
      <div class="vp-window">
        <div class="vp-titlebar"><span>MOOP GANG // CLUBHOUSE PC</span>
          <button class="vp-close" aria-label="Close virtual computer">×</button>
        </div>
        <div class="vp-toolbar">
          <button class="vp-back" disabled>←</button><button class="vp-forward" disabled>→</button>
          <button class="vp-refresh" title="Refresh">↻</button>
          <div class="vp-address">file: /virtual-pc/index.html</div>
        </div>
        <iframe title="Virtual PC browser" src="./virtual-pc/index.html"></iframe>
      </div>`;
    Object.assign(overlay.style, {
      position: 'fixed', inset: '0', zIndex: '10000', display: 'none',
      alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.72)',
      fontFamily: 'Arial, sans-serif'
    });
    const style = document.createElement('style');
    style.textContent = `
      #virtual-pc-window .vp-window { width:min(1000px,92vw); height:min(680px,88vh); display:flex; flex-direction:column; background:#151515; border:1px solid #555; box-shadow:0 20px 70px #000; border-radius:8px; overflow:hidden; }
      #virtual-pc-window .vp-titlebar { height:38px; display:flex; align-items:center; justify-content:space-between; padding:0 12px; color:#ddd; background:#252525; font:12px monospace; letter-spacing:1px; }
      #virtual-pc-window button { cursor:pointer; color:#ddd; background:#333; border:0; padding:6px 12px; font-size:16px; }
      #virtual-pc-window .vp-close { font-size:24px; line-height:20px; background:transparent; }
      #virtual-pc-window .vp-toolbar { display:flex; align-items:center; gap:7px; padding:8px; background:#333; }
      #virtual-pc-window .vp-address { flex:1; color:#aaa; background:#222; padding:8px 12px; font:12px monospace; border-radius:3px; }
      #virtual-pc-window iframe { flex:1; width:100%; border:0; background:white; }
    `;
    document.head.appendChild(style);
    document.body.appendChild(overlay);
    const iframe = overlay.querySelector('iframe');
    overlay.querySelector('.vp-close').addEventListener('click', closeVirtualPC);
    overlay.querySelector('.vp-refresh').addEventListener('click', () => iframe.contentWindow.location.reload());
    overlay.addEventListener('pointerdown', e => e.stopPropagation());
    return overlay;
}
const virtualPC = createVirtualPC();
function openVirtualPC() {
    pcWindowOpen = true;
    controls.unlock();
    showExplorePrompt(false);
    virtualPC.style.display = 'flex';
}
function closeVirtualPC() {
    virtualPC.style.display = 'none';
    pcWindowOpen = false;
    showExplorePrompt(true);
}
window.closeVirtualPC = closeVirtualPC;

/* Identify likely monitor/screen/computer meshes by Blender object names.
   Rename the screen mesh in Blender to "PC_SCREEN" for reliable targeting. */
function registerInteractables(root) {
    root.traverse((obj) => {
        if (!obj.isMesh) return;
        const searchable = [];
        let node = obj;
        while (node && node !== root.parent) {
            searchable.push(node.name || '');
            node = node.parent;
        }
        const name = searchable.join(' ').toLowerCase();
        if (/(pc[_ -]?screen|computer[_ -]?screen|monitor[_ -]?screen|desktop[_ -]?screen|computer|desktop|monitor|pc)/i.test(name)) {
            interactableMeshes.push(obj);
            obj.userData.moopInteract = 'computer';
        }
    });
    console.info('[Moop Gang] Potential computer interactables:', interactableMeshes.map(m => m.name || '(unnamed mesh)'));
    if (!interactableMeshes.length) {
        console.warn('No named computer/monitor meshes found. In Blender, rename the screen mesh PC_SCREEN (or its parent object) to make it clickable.');
    }
}

/* GLB load + fit. Auto-normalize overall horizontal size to a manageable room scale.
   If you want to keep the Blender scale exactly, set AUTO_SCALE_MODEL = false. */
const AUTO_SCALE_MODEL = true;
const MODEL_TARGET_WIDTH = 18;
const loader = new GLTFLoader();
loader.load(
  './assets/models/moopGangClubHousePhotoMatch1.glb',
  (gltf) => {
    clubhouse = gltf.scene;
    clubhouse.traverse(obj => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
        if (obj.material) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach(m => { if (m.map) m.map.colorSpace = THREE.SRGBColorSpace; });
      }
    }});
    scene.add(clubhouse);
    if (AUTO_SCALE_MODEL) {
      const before = new THREE.Box3().setFromObject(clubhouse);
      const size = before.getSize(new THREE.Vector3());
      const horizontal = Math.max(size.x, size.z);
      if (horizontal > 0) clubhouse.scale.multiplyScalar(MODEL_TARGET_WIDTH / horizontal);
    }
    // Ground model at y=0 and center it around world origin.
    let bounds = new THREE.Box3().setFromObject(clubhouse);
    const center = bounds.getCenter(new THREE.Vector3());
    clubhouse.position.x -= center.x;
    clubhouse.position.z -= center.z;
    clubhouse.position.y -= bounds.min.y;
    bounds = new THREE.Box3().setFromObject(clubhouse);
    const size = bounds.getSize(new THREE.Vector3());
    // Spawn toward the front opening, looking into the room. Adjust spawn offset if your
    // Blender model's entrance/front is oriented differently.
    camera.position.set(0, Math.max(1.6, size.y * 0.27), size.z * 0.42);
    camera.lookAt(0, Math.max(1.5, size.y * 0.25), 0);
    console.log('[Moop Gang] Clubhouse loaded:', { size, camera: camera.position, meshes: [] });
    registerInteractables(clubhouse);
    loadingScreen?.classList.add('loaded');
    setTimeout(() => loadingScreen?.remove(), 700);
  },
  (progress) => {
    if (progress.total) console.log(`Clubhouse loading ${Math.round(progress.loaded / progress.total * 100)}%`);
  },
  (error) => {
    console.error('Failed to load clubhouse GLB:', error);
    if (loadingScreen) loadingScreen.innerHTML = '<p>Could not load clubhouse model. Check assets/models path and run through a local server.</p>';
  }
);

/* Click-to-interact: first-person click raycasts loaded mesh objects. */
renderer.domElement.addEventListener('click', (event) => {
    if (!controls.isLocked || pcWindowOpen || !clubhouse) return;
    mouse.set((event.clientX / innerWidth) * 2 - 1, -(event.clientY / innerHeight) * 2 + 1);
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(interactableMeshes, true);
    if (hits.length) openVirtualPC();
});

/* Archive compatibility with existing HTML panel IDs */
function openArchive() { archivePanel?.classList.remove('hidden'); }
function closeArchive() { archivePanel?.classList.add('hidden'); }
closeButton?.addEventListener('click', closeArchive);
returnButton?.addEventListener('click', closeArchive);

/* Audio hook retained. Place ambience at assets/sounds/ambience/room_ambience.mp3 */
const listener = new THREE.AudioListener();
camera.add(listener);
const ambientSound = new THREE.Audio(listener);
const audioLoader = new THREE.AudioLoader();
function startAmbientAudio() {
  if (audioStarted) return;
  audioStarted = true;
  audioLoader.load('./assets/sounds/ambience/room_ambience.mp3', buffer => {
    ambientSound.setBuffer(buffer); ambientSound.setLoop(true); ambientSound.setVolume(0.25); ambientSound.play();
  }, undefined, err => console.warn('Ambient audio unavailable:', err));
}
window.addEventListener('pointerdown', startAmbientAudio, { once: true });

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.elapsedTime;
  if (controls.isLocked && !pcWindowOpen) {
    const speed = movement.sprint ? SPRINT_SPEED : WALK_SPEED;
    if (movement.forward) controls.moveForward(speed * delta);
    if (movement.backward) controls.moveForward(-speed * delta);
    if (movement.left) controls.moveRight(-speed * delta);
    if (movement.right) controls.moveRight(speed * delta);
    camera.position.y = Math.max(1.6, camera.position.y);
  }
  greenLight.intensity = 28 + Math.sin(elapsed * 2) * 2;
  animatedObjects.forEach(o => o.rotation.y += 0.0001);
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
});
console.log('MOOP GANG CLUBHOUSE scene script loaded.');
