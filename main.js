
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

// --------------------------------
// Scene
// --------------------------------

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x050505);
scene.fog = new THREE.FogExp2(0x050505, 0.035);

// --------------------------------
// Camera
// --------------------------------

const camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

camera.position.set(0, 3, 9);

// --------------------------------
// Renderer
// --------------------------------

const canvas = document.querySelector('#webgl');

const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

// --------------------------------
// Lighting
// --------------------------------

const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);

const greenLight = new THREE.PointLight(0xb6ff00, 50, 20);
greenLight.position.set(0, 3, 3);
scene.add(greenLight);

const blueLight = new THREE.PointLight(0x0033ff, 30, 20);
blueLight.position.set(-4, 2, -3);
scene.add(blueLight);

// --------------------------------
// Floor
// --------------------------------

const floorGeometry = new THREE.PlaneGeometry(200, 200);

const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.8,
    metalness: 0.2
});

const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -1;
floor.receiveShadow = true;
scene.add(floor);

// Grid
const grid = new THREE.GridHelper(100, 100, 0x334400, 0x151515);
grid.position.y = -0.99;
scene.add(grid);

// --------------------------------
// Main object
// --------------------------------

const geometry = new THREE.IcosahedronGeometry(1.5, 1);

const material = new THREE.MeshStandardMaterial({
    color: 0x88cc00,
    emissive: 0x334400,
    metalness: 0.6,
    roughness: 0.25,
    flatShading: true
});

const mainObject = new THREE.Mesh(geometry, material);
mainObject.position.y = 1;
mainObject.castShadow = true;
scene.add(mainObject);

// Wireframe shell
const wireframe = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({
        color: 0xb6ff00,
        wireframe: true
    })
);

wireframe.scale.setScalar(1.02);
mainObject.add(wireframe);

// --------------------------------
// Ring
// --------------------------------

const ringGeometry = new THREE.TorusGeometry(2.5, 0.035, 8, 100);

const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0xb6ff00
});

const ring = new THREE.Mesh(ringGeometry, ringMaterial);
ring.position.y = 1;
ring.rotation.x = Math.PI / 2.5;
scene.add(ring);

// --------------------------------
// Mouse camera movement
// --------------------------------

let mouseX = 0;
let mouseY = 0;

window.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = (event.clientY / window.innerHeight) * 2 - 1;
});

// --------------------------------
// Animation
// --------------------------------

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const time = clock.getElapsedTime();

    mainObject.rotation.x = time * 0.3;
    mainObject.rotation.y = time * 0.5;

    mainObject.position.y = 1 + Math.sin(time * 1.5) * 0.25;

    ring.rotation.z = time * 0.25;

    camera.position.x += (mouseX * 1.5 - camera.position.x) * 0.02;
    camera.position.y += (3 + mouseY * -1 - camera.position.y) * 0.02;

    camera.lookAt(0, 0.5, 0);

    renderer.render(scene, camera);
}

animate();

// --------------------------------
// Resize handling
// --------------------------------

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
