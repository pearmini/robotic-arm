import * as THREE from "three";
import GUI from "lil-gui";
import "./style.css";

const armParams = {
  theta0: 0,
  theta1: 0,
  theta2: 0,
  theta3: 0,
  theta4: 0,
  theta5: 0,
  x: 0,
  y: 0,
  z: 0,
};

displayGUI();
displayScene();

function displayScene() {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  document.body.appendChild(renderer.domElement);

  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  camera.position.z = 5;

  function animate() {
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    renderer.render(scene, camera);
  }
}

function displayGUI() {
  const gui = new GUI();
  gui.add(armParams, "theta0", 0, 360);
  gui.add(armParams, "theta1", 0, 360);
  gui.add(armParams, "theta2", 0, 360);
  gui.add(armParams, "theta3", 0, 360);
  gui.add(armParams, "theta4", 0, 360);
  gui.add(armParams, "theta5", 0, 360);
  gui.add(armParams, "x", -10, 10);
  gui.add(armParams, "y", -10, 10);
  gui.add(armParams, "z", -10, 10);
}
