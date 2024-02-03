import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer();
document.body.appendChild(renderer.domElement);

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.y = 6;
camera.position.x = -1;
camera.position.z = -5;

const grassBladeGeometry = new THREE.ConeGeometry(0.02, 0.2, 6); // Adjust dimensions as needed
const grassBladeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

const density = 0.02; // Adjust as needed

// Calculate the number of instances
const numInstances = Math.pow(20 / density, 2); // Assuming you have a 20x20 grid

// Assuming the maze is at a height of 0.5 (adjust as needed)
const mazeHeight = 0.5;

const grassField = new THREE.InstancedMesh(
  grassBladeGeometry,
  grassBladeMaterial,
  numInstances
);

for (let i = 0; i < numInstances; i++) {
  const grassBlade = new THREE.Object3D();

  const randomHeight = Math.random() * 0.03; // Adjust the height range
  grassBlade.position.y = randomHeight + mazeHeight; // Adjust based on maze height

  const randomRotation = Math.random() * Math.PI * 2;
  grassBlade.rotation.y = randomRotation;

  // Set the position of each instance
  const matrix = new THREE.Matrix4();
  matrix.makeTranslation(
    (i % 20) * density - 10,
    0,
    Math.floor(i / 20) * density - 10
  );

  // Apply the translation to the instanced mesh
  grassField.setMatrixAt(i, matrix);
}

grassField.instanceMatrix.needsUpdate = true; // Update the instance matrix

scene.add(grassField);

const floorGeometry = new THREE.PlaneGeometry(1000, 1000, 1, 1);
const floor = new THREE.Mesh(floorGeometry);
floor.rotation.x = -Math.PI / 2; // Rotate the plane to be horizontal
floor.position.y = -0.5; // Adjust the height of the floor
scene.add(floor);

// Create ambient light for the floor
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

const ballGeometry = new THREE.SphereGeometry(0.3, 32, 32);
const ballMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff }); // White color for the ball
const ball = new THREE.Mesh(ballGeometry, ballMaterial);
ball.position.z = 1;
ball.position.x = 1;
scene.add(ball);

const mazeMaterial = new THREE.MeshBasicMaterial({
  color: 0x0000ff,
});
const mazeGeometry = new THREE.BoxGeometry(1, 1, 1);
const wireframeMaterial = new THREE.LineBasicMaterial({
  color: 0x000000,
});

const walls: THREE.Mesh<THREE.BoxGeometry>[] = [];
[
  [1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 1, 1, 1],
  [1, 0, 0, 0, 1, 1, 1],
  [1, 0, 0, 0, 1, 1, 1],
  [1, 1, 0, 1, 1, 1, 1],
  [1, 1, 0, 1, 1, 1, 1],
  [1, 1, 0, 0, 0, 0, 1],
  [1, 1, 0, 0, 0, 0, 1],
  [1, 1, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1],
].map((row, rowIndex) => {
  row.map((element, colIndex) => {
    if (element === 1) {
      const maze = new THREE.Mesh(mazeGeometry, mazeMaterial);
      const wireframe = new THREE.LineSegments(
        new THREE.WireframeGeometry(mazeGeometry),
        wireframeMaterial
      );

      maze.position.x = colIndex;
      maze.position.z = rowIndex;
      wireframe.position.x = colIndex;
      wireframe.position.z = rowIndex;
      scene.add(maze);
      walls.push(maze);
      scene.add(wireframe);
    }
  });
});

// Set up ground plane to restrict camera movement
const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.5 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.5;
ground.receiveShadow = true;
scene.add(ground);

// Set up OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.screenSpacePanning = false;

// Set up camera constraints
camera.lookAt(ball.position);
controls.maxPolarAngle = Math.PI / 4;
controls.minPolarAngle = Math.PI / 4;

document.addEventListener("keydown", (event) => {
  const speed = 0.1; // Adjust the speed as needed
  const oldPosition = ball.position.clone(); // Store the old position for collision checking
  switch (event.key) {
    case "ArrowUp":
    case "w":
      ball.position.z += speed;
      break;
    case "ArrowDown":
    case "s":
      ball.position.z -= speed;
      break;
    case "ArrowLeft":
    case "a":
      ball.position.x += speed;
      break;
    case "ArrowRight":
    case "d":
      ball.position.x -= speed;
      break;
  }

  for (const wall of walls) {
    const box1 = new THREE.Box3().setFromObject(ball);
    const box2 = new THREE.Box3().setFromObject(wall);

    if (box1.intersectsBox(box2)) {
      ball.position.copy(oldPosition);
      break;
    }
  }
});

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

animate();
