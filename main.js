import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';


/* =========================================================
   MOOP GANG
   UNDERGROUND ENVIRONMENT
   ========================================================= */

/* =========================================================
   01. DOM ELEMENTS
   ========================================================= */

const container = document.querySelector('#scene-container');
const loadingScreen = document.querySelector('#loading-screen');
const archivePanel = document.querySelector('#archive-panel');

const closeButton = document.querySelector('#close-archive');
const returnButton = document.querySelector('#return-button');


/* =========================================================
   02. SCENE SETUP
   ========================================================= */

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x080a08);

scene.fog = new THREE.FogExp2(
    0x080a08,
    0.032
);


/* =========================================================
   03. CAMERA
   ========================================================= */

const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    100
);

camera.position.set(0, 2.4, 9);

camera.lookAt(0, 2, -3);


/* =========================================================
   04. RENDERER
   ========================================================= */

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance'
});

renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
);

renderer.shadowMap.enabled = true;

renderer.shadowMap.type = THREE.PCFSoftShadowMap;

renderer.outputColorSpace = THREE.SRGBColorSpace;

renderer.toneMapping = THREE.ACESFilmicToneMapping;

renderer.toneMappingExposure = 1.15;

container.appendChild(renderer.domElement);


// ===================================
// FIRST PERSON CONTROLS
// ===================================

const controls = new PointerLockControls(
    camera,
    renderer.domElement
);



// Starting camera height
camera.position.y = 1.65;

// Movement settings
const movement = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false
};

const WALK_SPEED = 4;
const SPRINT_SPEED = 8;

// Room boundaries - adjust to fit your room
const ROOM_LIMIT_X = 8;
const ROOM_LIMIT_Z = 8;

// Lock mouse when clicking the scene
const explorePrompt = document.getElementById('explore-prompt');

explorePrompt.addEventListener('click', () => {
    console.log('Explore clicked');

    controls.lock();
});

controls.addEventListener('lock', () => {
    console.log('Pointer locked!');
});

controls.addEventListener('unlock', () => {
    console.log('Pointer unlocked!');
});

controls.addEventListener('lock', () => {
    explorePrompt.classList.add('hidden');
});

controls.addEventListener('unlock', () => {
    explorePrompt.classList.remove('hidden');
});

// Keyboard input
document.addEventListener('keydown', (event) => {
    switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
            movement.forward = true;
            break;

        case 'KeyS':
        case 'ArrowDown':
            movement.backward = true;
            break;

        case 'KeyA':
        case 'ArrowLeft':
            movement.left = true;
            break;

        case 'KeyD':
        case 'ArrowRight':
            movement.right = true;
            break;

        case 'ShiftLeft':
        case 'ShiftRight':
            movement.sprint = true;
            break;
    }
});

document.addEventListener('keyup', (event) => {
    switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
            movement.forward = false;
            break;

        case 'KeyS':
        case 'ArrowDown':
            movement.backward = false;
            break;

        case 'KeyA':
        case 'ArrowLeft':
            movement.left = false;
            break;

        case 'KeyD':
        case 'ArrowRight':
            movement.right = false;
            break;

        case 'ShiftLeft':
        case 'ShiftRight':
            movement.sprint = false;
            break;
    }
});

/* =========================================================
   05. GLOBAL VARIABLES
   ========================================================= */

const clock = new THREE.Clock();

const raycaster = new THREE.Raycaster();

const mouse = new THREE.Vector2();

const clickableObjects = [];

const animatedObjects = [];

const screenMaterials = [];

let mouseX = 0;
let mouseY = 0;

let audioStarted = false;


/* =========================================================
   06. MATERIALS
   ========================================================= */

const materials = {

    concrete: new THREE.MeshStandardMaterial({
        color: 0x464a40,
        roughness: 0.98
    }),

    darkConcrete: new THREE.MeshStandardMaterial({
        color: 0x20251f,
        roughness: 0.95
    }),

    metal: new THREE.MeshStandardMaterial({
        color: 0x353a35,
        roughness: 0.65,
        metalness: 0.7
    }),

    blackMetal: new THREE.MeshStandardMaterial({
        color: 0x101310,
        roughness: 0.55,
        metalness: 0.65
    }),

    rubber: new THREE.MeshStandardMaterial({
        color: 0x080a08,
        roughness: 1
    }),

    green: new THREE.MeshStandardMaterial({
        color: 0xa6ff35,
        emissive: 0x70d800,
        emissiveIntensity: 2.2
    }),

    pink: new THREE.MeshStandardMaterial({
        color: 0xff2ca8,
        emissive: 0xa50059,
        emissiveIntensity: 2
    }),

    blue: new THREE.MeshStandardMaterial({
        color: 0x37cfff,
        emissive: 0x006b9c,
        emissiveIntensity: 2
    })

};


/* =========================================================
   07. OBJECT HELPERS
   ========================================================= */

function createBox(
    name,
    width,
    height,
    depth,
    x,
    y,
    z,
    material,
    parent = scene
) {

    const geometry = new THREE.BoxGeometry(
        width,
        height,
        depth
    );

    const mesh = new THREE.Mesh(
        geometry,
        material
    );

    mesh.name = name;

    mesh.position.set(x, y, z);

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    parent.add(mesh);

    return mesh;

}


function createCylinder(
    name,
    radius,
    height,
    x,
    y,
    z,
    material,
    rotation = [0, 0, 0],
    parent = scene
) {

    const geometry = new THREE.CylinderGeometry(
        radius,
        radius,
        height,
        16
    );

    const mesh = new THREE.Mesh(
        geometry,
        material
    );

    mesh.name = name;

    mesh.position.set(x, y, z);

    mesh.rotation.set(...rotation);

    mesh.castShadow = true;

    parent.add(mesh);

    return mesh;

}


function createLight(
    color,
    intensity,
    x,
    y,
    z,
    distance
) {

    const light = new THREE.PointLight(
        color,
        intensity,
        distance,
        2
    );

    light.position.set(x, y, z);

    scene.add(light);

    return light;

}


/* =========================================================
   08. LIGHTING
   ========================================================= */

// General ambient illumination.

scene.add(
    new THREE.HemisphereLight(
        0x87947b,
        0x171b16,
        1.1
    )
);

// Main green light.

const greenLight = createLight(
    0xa6ff35,
    85,
    -3,
    4,
    -3,
    12
);

// Pink light.

createLight(
    0xff2ca8,
    30,
    4,
    3,
    -5,
    8
);

// Blue light.

createLight(
    0x37cfff,
    22,
    -6,
    2,
    -6,
    8
);

// Directional lighting.

const directionalLight = new THREE.DirectionalLight(
    0xd0d6bd,
    1.2
);

directionalLight.position.set(3, 8, 5);

directionalLight.castShadow = true;

directionalLight.shadow.mapSize.set(2048, 2048);

scene.add(directionalLight);


/* =========================================================
   09. ROOM CONSTRUCTION
   ========================================================= */

function buildRoom() {

    // FLOOR

    createBox(
        'Concrete Floor',
        16, 0.4, 19,
        0, -0.2, -1.5,
        materials.concrete
    );


    // BACK WALL

    createBox(
        'Back Wall',
        16, 7, 0.4,
        0, 3.3, -11,
        materials.darkConcrete
    );


    // LEFT WALL

    createBox(
        'Left Wall',
        0.4, 7, 19,
        -8, 3.3, -1.5,
        materials.darkConcrete
    );


    // RIGHT WALL

    createBox(
        'Right Wall',
        0.4, 7, 19,
        8, 3.3, -1.5,
        materials.darkConcrete
    );


    // CEILING

    createBox(
        'Ceiling',
        16, 0.4, 19,
        0, 6.8, -1.5,
        materials.darkConcrete
    );

}


/* =========================================================
   10. INDUSTRIAL DETAILS
   ========================================================= */

function buildIndustrialDetails() {

    // CEILING BEAMS

    for (let z = -10; z <= 5; z += 3) {

        createBox(
            'Ceiling Beam',
            16, 0.25, 0.3,
            0, 6.45, z,
            materials.metal
        );

    }


    // CEILING SUPPORTS

    for (let x = -6; x <= 6; x += 3) {

        createBox(
            'Ceiling Support',
            0.18, 0.2, 18,
            x, 6.35, -1.5,
            materials.metal
        );

    }


    // WALL SUPPORTS

    for (let z = -9; z <= 5; z += 3) {

        createBox(
            'Wall Support',
            0.2, 6.5, 0.2,
            -7.75, 3.3, z,
            materials.metal
        );

        createBox(
            'Wall Support',
            0.2, 6.5, 0.2,
            7.75, 3.3, z,
            materials.metal
        );

    }


    // EXPOSED PIPES

    createCylinder(
        'Ceiling Pipe',
        0.09, 15,
        -5.8, 6.05, -2,
        materials.metal,
        [Math.PI / 2, 0, 0]
    );

    createCylinder(
        'Green Pipe',
        0.055, 15,
        5.9, 6.05, -2,
        materials.green,
        [Math.PI / 2, 0, 0]
    );

    createCylinder(
        'Drain Pipe',
        0.12, 5,
        7.4, 3.3, -7,
        materials.metal
    );


    // FLOOR GRATE

    for (let i = 0; i < 15; i++) {

        createBox(
            'Floor Grate',
            0.07, 0.035, 1.4,
            -6 + i * 0.17,
            0.025,
            4,
            materials.blackMetal
        );

    }


    // FLUORESCENT LIGHT HOUSING

    createBox(
        'Light Housing',
        3, 0.2, 0.5,
        -1.5, 5.9, -5,
        materials.blackMetal
    );

    createBox(
        'Fluorescent Tube',
        2.7, 0.06, 0.12,
        -1.5, 5.77, -5,
        materials.green
    );

    createLight(
        0xa6ff35,
        25,
        -1.5, 5.4, -5,
        7
    );

}


/* =========================================================
   11. PROCEDURAL WALL GRAFFITI
   ========================================================= */

function createGraffitiTexture(title, subtitle, color) {

    const canvas = document.createElement('canvas');

    canvas.width = 512;
    canvas.height = 256;

    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#080b08';
    ctx.fillRect(0, 0, 512, 256);

    ctx.globalAlpha = 0.9;

    ctx.strokeStyle = color;
    ctx.lineWidth = 8;
    ctx.strokeRect(15, 15, 482, 226);

    // TITLE TEXT - automatically scales to fit
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const maxWidth = 420;
    const maxHeight = 100;

    let fontSize = 72;

    do {
        ctx.font = `900 ${fontSize}px sans-serif`;
        fontSize--;
    } while (
        ctx.measureText(title).width > maxWidth &&
        fontSize > 10
    );

    ctx.fillText(title, 256, 115);

    // SUBTITLE
    ctx.fillStyle = '#eeeeee';
    ctx.font = 'bold 19px monospace';
    ctx.textAlign = 'center';

    ctx.fillText(subtitle, 256, 180, 440);

    const texture = new THREE.CanvasTexture(canvas);

    texture.colorSpace = THREE.SRGBColorSpace;

    return texture;
}


function createWallSign(
    title,
    subtitle,
    color,
    x,
    y,
    z,
    width,
    height
) {

    const texture = createGraffitiTexture(
        title,
        subtitle,
        color
    );

    const material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide
    });

    const sign = new THREE.Mesh(
        new THREE.PlaneGeometry(width, height),
        material
    );

    sign.position.set(x, y, z);

    scene.add(sign);

    return sign;

}


function buildGraffiti() {

    createWallSign(
        'MOOP GANG',
        'NO SLEEP // NO RULES',
        '#a6ff35',
        -4.5, 4.1, -10.77,
        3.8, 1.9
    );

    createWallSign(
        'STAY WEIRD',
        'AUTHORIZED PERSONNEL ONLY',
        '#ff2ca8',
        5, 3.8, -10.77,
        3, 1.5
    );

}


/* =========================================================
   12. CRT MONITOR SYSTEM
   ========================================================= */

function createScreenTexture(label, color) {

    const canvas = document.createElement('canvas');

    canvas.width = 512;
    canvas.height = 384;

    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#020602';

    ctx.fillRect(0, 0, 512, 384);

    // CRT scanlines

    ctx.fillStyle = color;

    ctx.globalAlpha = 0.15;

    for (let y = 0; y < 384; y += 5) {

        ctx.fillRect(0, y, 512, 1);

    }

    ctx.globalAlpha = 1;

    // Screen border

    ctx.strokeStyle = color;

    ctx.lineWidth = 5;

    ctx.strokeRect(15, 15, 482, 354);

    // Screen text

    ctx.textAlign = 'center';

    ctx.fillStyle = color;

    ctx.font = '900 52px monospace';

    ctx.fillText(label, 256, 165);

    ctx.font = '18px monospace';

    ctx.fillText(
        'MOOP GANG // LIVE FEED',
        256, 215
    );

    ctx.font = '15px monospace';

    ctx.fillText(
        'CLICK TO CONNECT',
        256, 300
    );

    const texture = new THREE.CanvasTexture(canvas);

    texture.colorSpace = THREE.SRGBColorSpace;

    return texture;

}


function createCRT(
    parent,
    x,
    y,
    z,
    width,
    height,
    label,
    color,
    interactive = false
) {

    const monitor = new THREE.Group();

    monitor.position.set(x, y, z);

    parent.add(monitor);


    // Monitor housing

    const housing = new THREE.Mesh(
        new THREE.BoxGeometry(
            width,
            height,
            0.75
        ),
        new THREE.MeshStandardMaterial({
            color: 0x20231f,
            roughness: 0.55
        })
    );

    housing.castShadow = true;

    monitor.add(housing);


    // Black bezel

    const bezel = new THREE.Mesh(
        new THREE.BoxGeometry(
            width * 0.87,
            height * 0.79,
            0.09
        ),
        materials.blackMetal
    );

    bezel.position.z = 0.4;

    monitor.add(bezel);


    // Screen

    const screenMaterial = new THREE.MeshBasicMaterial({
        map: createScreenTexture(label, color)
    });

    const screen = new THREE.Mesh(
        new THREE.PlaneGeometry(
            width * 0.79,
            height * 0.69
        ),
        screenMaterial
    );

    screen.position.z = 0.45;

    monitor.add(screen);

    screenMaterials.push(screenMaterial);


    // Power LED

    const led = new THREE.Mesh(
        new THREE.SphereGeometry(0.035, 10, 10),
        color === '#a6ff35' ? materials.green : materials.pink
    );

    led.position.set(
        width * 0.39,
        -height * 0.35,
        0.45
    );

    monitor.add(led);


    // Invisible clickable surface

    if (interactive) {

        const hitbox = new THREE.Mesh(
            new THREE.BoxGeometry(
                width * 1.1,
                height * 1.1,
                1
            ),
            new THREE.MeshBasicMaterial({
                transparent: true,
                opacity: 0,
                depthWrite: false
            })
        );

        hitbox.position.z = 0.05;

        monitor.add(hitbox);

        clickableObjects.push(hitbox);

    }

    return monitor;

}


/* =========================================================
   13. CENTRAL ELECTRONICS STACK
   ========================================================= */

function buildCRTStack() {

    const stack = new THREE.Group();

    stack.position.set(0, 0, -5.5);

    scene.add(stack);


    // Equipment cabinet

    createBox(
        'Equipment Cabinet',
        4.8, 0.7, 1.7,
        0, 0.45, 0,
        materials.rubber,
        stack
    );


    // Metal rack front

    createBox(
        'Rack Front',
        4.3, 0.2, 0.08,
        0, 0.45, 0.87,
        materials.metal,
        stack
    );


    // Rack feet

    for (const x of [-1.5, 1.5]) {

        createBox(
            'Rack Foot',
            0.15, 0.45, 0.15,
            x, 1, 0,
            materials.metal,
            stack
        );

    }


    // Monitor arrangement

    createCRT(
        stack,
        -1.4, 2.1, 0,
        1.8, 1.5,
        'MG-TV',
        '#ff2ca8'
    );

    createCRT(
        stack,
        0.7, 2.1, 0,
        1.8, 1.5,
        'MOOP',
        '#a6ff35',
        true
    );

    createCRT(
        stack,
        -0.35, 3.65, -0.1,
        2, 1.4,
        'ARCHIVE',
        '#37cfff'
    );

    createCRT(
        stack,
        -2.2, 0.95, -0.05,
        1.2, 0.95,
        '909',
        '#ff2ca8'
    );

    createCRT(
        stack,
        2.05, 0.95, -0.05,
        1.2, 0.95,
        'FM',
        '#a6ff35'
    );

}


/* =========================================================
   14. SPEAKER CABINETS
   ========================================================= */

function createSpeaker(x, z) {

    const speaker = new THREE.Group();

    speaker.position.set(x, 0, z);

    scene.add(speaker);


    createBox(
        'Speaker Cabinet',
        1.2, 2.1, 0.9,
        0, 1.05, 0,
        materials.rubber,
        speaker
    );


    // Two speaker cones

    for (const [y, radius] of [
        [0.65, 0.28],
        [1.45, 0.18]
    ]) {

        const cone = new THREE.Mesh(
            new THREE.CylinderGeometry(
                radius,
                radius,
                0.12,
                24
            ),
            materials.metal
        );

        cone.rotation.x = Math.PI / 2;

        cone.position.set(0, y, 0.49);

        speaker.add(cone);

    }

    return speaker;

}


function buildSpeakers() {

    createSpeaker(-3.8, -5.3);

    createSpeaker(3.8, -5.3);

}


/* =========================================================
   15. CABLES
   ========================================================= */

function createCable(points, color = 0x080a08) {

    const curve = new THREE.CatmullRomCurve3(
        points.map(point =>
            new THREE.Vector3(...point)
        )
    );

    const geometry = new THREE.TubeGeometry(
        curve,
        48,
        0.035,
        8,
        false
    );

    const cable = new THREE.Mesh(
        geometry,
        new THREE.MeshStandardMaterial({
            color,
            roughness: 0.95
        })
    );

    cable.position.y = 0.05;

    scene.add(cable);

}


function buildCables() {

    createCable([
        [-5, 0, 1],
        [-3, 0, 0.5],
        [-2, 0, 1.8],
        [0, 0, 1.2],
        [2, 0, 0.8],
        [4, 0, 1.5]
    ]);

    createCable([
        [5, 0, -2],
        [4, 0, -1.5],
        [3, 0, -2.5],
        [2, 0, -3.5],
        [1, 0, -4.5]
    ]);

}


/* =========================================================
   16. SCATTERED OBJECTS
   ========================================================= */

function buildJunk() {

    const crate = createBox(
        'Abandoned Crate',
        1, 0.8, 0.9,
        -5.3, 0.4, -2.5,
        materials.metal
    );

    crate.rotation.y = 0.3;


    const equipment = createBox(
        'Old Equipment',
        0.9, 0.55, 0.7,
        5.3, 0.28, 1.5,
        materials.rubber
    );

    equipment.rotation.y = -0.4;


    createCylinder(
        'Discarded Can',
        0.17,
        0.5,
        4.5, 0.2, -0.3,
        materials.metal,
        [0, 0, Math.PI / 2]
    );

}


/* =========================================================
   17. DUST PARTICLES
   ========================================================= */

function buildDust() {

    const count = 300;

    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {

        positions[i * 3] =
            (Math.random() - 0.5) * 14;

        positions[i * 3 + 1] =
            Math.random() * 6;

        positions[i * 3 + 2] =
            -10 + Math.random() * 16;

    }

    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(positions, 3)
    );

    const material = new THREE.PointsMaterial({
        color: 0xc2d5a7,
        size: 0.025,
        transparent: true,
        opacity: 0.5
    });

    const particles = new THREE.Points(
        geometry,
        material
    );

    scene.add(particles);

    animatedObjects.push(particles);

}


/* =========================================================
   18. EXTERNAL ASSET LOADING
   ========================================================= */

// This allows us to start bringing in your own models.
//
// Put your GLB/GLTF files inside assets/models.
//
// Example:
// assets/models/electronics/old_tv.glb
//
// Then add that path to the model manifest below.

const gltfLoader = new GLTFLoader();

const textureLoader = new THREE.TextureLoader();

//test load//

const gltfLoader1 = new GLTFLoader();

gltfLoader1.load(
    './assets/models/test-cube.glb',

    (gltf) => {
        const cube = gltf.scene;

        cube.position.set(0, 1, -3);
        cube.scale.set(1, 1, 1);

        scene.add(cube);

        console.log("Blender asset loaded!", cube);
    },

    undefined,

    (error) => {
        console.error("Error loading Blender asset:", error);
    }
);



function loadModel(path, position, scale = 1) {

    return new Promise((resolve, reject) => {

        gltfLoader.load(
            path,

            (gltf) => {

                const model = gltf.scene;

                model.position.set(...position);

                model.scale.setScalar(scale);

                model.traverse((child) => {

                    if (child.isMesh) {

                        child.castShadow = true;
                        child.receiveShadow = true;

                    }

                });

                scene.add(model);

                resolve(model);

            },

            undefined,

            (error) => {

                console.error(
                    'Could not load model:',
                    path,
                    error
                );

                reject(error);

            }
        );

    });

}


function loadTexture(path) {

    return new Promise((resolve, reject) => {

        textureLoader.load(
            path,

            (texture) => {

                texture.colorSpace = THREE.SRGBColorSpace;

                resolve(texture);

            },

            undefined,

            reject
        );

    });

}


// EXAMPLE ASSET MANIFEST
//
// Uncomment and change these paths to match your real files.
//
// const models = [
//     {
//         path: './assets/models/electronics/old_tv.glb',
//         position: [0, 1, -4],
//         scale: 1
//     },
//     {
//         path: './assets/models/props/crate.glb',
//         position: [-4, 0, -2],
//         scale: 1
//     }
// ];
//
// for (const model of models) {
//     loadModel(
//         model.path,
//         model.position,
//         model.scale
//     ).catch(() => {});
// }


/* =========================================================
   19. AUDIO SYSTEM
   ========================================================= */

// Browsers require user interaction before audio playback.
//
// Place your audio files in assets/sounds.
//
// Example:
// assets/sounds/ambience/room_ambience.mp3

const listener = new THREE.AudioListener();

camera.add(listener);

const ambientSound = new THREE.Audio(listener);

const audioLoader = new THREE.AudioLoader();


function startAmbientAudio() {

    if (audioStarted) return;

    audioStarted = true;

    audioLoader.load(
        './assets/sounds/ambience/room_ambience.mp3',

        (buffer) => {

            ambientSound.setBuffer(buffer);

            ambientSound.setLoop(true);

            ambientSound.setVolume(0.25);

            ambientSound.play();

        },

        undefined,

        (error) => {

            console.warn(
                'Ambient audio unavailable:',
                error
            );

        }
    );

}

window.addEventListener(
    'pointerdown',
    startAmbientAudio,
    { once: true }
);


/* =========================================================
   20. INTERACTION SYSTEM
   ========================================================= */

function openArchive() {

    archivePanel.classList.remove('hidden');

}


function closeArchive() {

    archivePanel.classList.add('hidden');

}


closeButton.addEventListener(
    'click',
    closeArchive
);

returnButton.addEventListener(
    'click',
    closeArchive
);


// Mouse movement

window.addEventListener('pointermove', (event) => {

    mouseX =
        (event.clientX / window.innerWidth - 0.5) * 0.4;

    mouseY =
        (event.clientY / window.innerHeight - 0.5) * 0.15;

});


// Raycasting

renderer.domElement.addEventListener('click', (event) => {

    mouse.x =
        (event.clientX / window.innerWidth) * 2 - 1;

    mouse.y =
        -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersections = raycaster.intersectObjects(
        clickableObjects,
        false
    );

    if (intersections.length > 0) {

        openArchive();

    }

});


/* =========================================================
   21. ANIMATION LOOP
   ========================================================= */

function animate() {

    requestAnimationFrame(animate);


    const delta = Math.min(clock.getDelta(), 0.05);
    const elapsed = clock.elapsedTime;

if (controls.isLocked) {

    const speed = movement.sprint ? SPRINT_SPEED : WALK_SPEED;

    if (movement.forward) {
        controls.moveForward(speed * delta);
    }

    if (movement.backward) {
        controls.moveForward(-speed * delta);
    }

    if (movement.left) {
        controls.moveRight(-speed * delta);
    }

    if (movement.right) {
        controls.moveRight(speed * delta);
    }

    // Keep the player inside the room
    camera.position.x = THREE.MathUtils.clamp(
        camera.position.x,
        -ROOM_LIMIT_X,
        ROOM_LIMIT_X
    );

    camera.position.z = THREE.MathUtils.clamp(
        camera.position.z,
        -ROOM_LIMIT_Z,
        ROOM_LIMIT_Z
    );

    // Keep the camera at eye level
    camera.position.y = 1.65;
}

    // Green light flicker

    greenLight.intensity =
        82 + Math.sin(elapsed * 2) * 4;


    // CRT animation

    screenMaterials.forEach((material, index) => {

        material.opacity =
            0.94 + Math.sin(elapsed * (7 + index)) * 0.04;

    });


    // Dust movement

    animatedObjects.forEach((object) => {

        object.rotation.y += 0.0001;

    });


    renderer.render(scene, camera);

}


/* =========================================================
   22. RESPONSIVE RESIZE
   ========================================================= */

window.addEventListener('resize', () => {

    camera.aspect =
        window.innerWidth / window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

    renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, 2)
    );

});


/* =========================================================
   23. BUILD THE ENVIRONMENT
   ========================================================= */

function initializeWorld() {

    buildRoom();

    buildIndustrialDetails();

    buildGraffiti();

    buildCRTStack();

    buildSpeakers();

    buildCables();

    buildJunk();

    buildDust();

    animate();

    loadingScreen.classList.add('loaded');

    setTimeout(() => {

        loadingScreen.remove();

    }, 900);

}

console.log('MAIN JS IS RUNNING');

const testPrompt = document.getElementById('explore-prompt');

console.log('EXPLORE PROMPT:', testPrompt);

if (testPrompt) {
    testPrompt.addEventListener('click', () => {
        console.log('PROMPT CLICK REGISTERED');
    });
}

initializeWorld();


/* =========================================================
   END MOOP GANG
   ========================================================= */
