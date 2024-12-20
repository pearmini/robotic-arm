import * as THREE from "three";
import GUI from "lil-gui";
import "./style.css";

const armParams = {
  a1: 0,
  a2: 0,
  a3: 0,
  a4: 0,
  a5: 0,
  a6: 0,
  x: 0,
  y: 0,
  z: 0,
};

const links = [];
const joins = [];
const linkLength = 1.2;
const jointRadius = 0.2;
const linkRadius = 0.1;

const gui = new GUI();
const guiA1 = gui.add(armParams, "a1", -180, 180);
const guiA2 = gui.add(armParams, "a2", -180, 180);
const guiA3 = gui.add(armParams, "a3", -180, 180);
const guiA4 = gui.add(armParams, "a4", -180, 180);
const guiA5 = gui.add(armParams, "a5", -180, 180);
const guiA6 = gui.add(armParams, "a6", -180, 180);
const guiX = gui.add(armParams, "x", -10, 10);
const guiY = gui.add(armParams, "y", -10, 10);
const guiZ = gui.add(armParams, "z", -10, 10);

handleForwardKinematics(guiA1);
handleForwardKinematics(guiA2);
handleForwardKinematics(guiA3);
handleForwardKinematics(guiA4);
handleForwardKinematics(guiA5);
handleForwardKinematics(guiA6);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(5, 5, 10);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5;
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0x404040, 1);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(5, 10, 7.5);
directionalLight.castShadow = true;
scene.add(directionalLight);

const pointLight = new THREE.PointLight(0xffffff, 1, 100);
pointLight.position.set(10, 10, 10);
scene.add(pointLight);

const arm = createArm();
scene.add(arm);
updatePosition();

animate();

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

function handleForwardKinematics(controller) {
  controller.onChange(updatePosition);
}

function updatePosition() {
  const positions = forwardKinematics();

  const last = positions[positions.length - 1][0];

  armParams.x = round(last.x);
  armParams.y = round(last.y);
  armParams.z = round(last.z);
  guiX.updateDisplay();
  guiY.updateDisplay();
  guiZ.updateDisplay();

  let previousJoint = null;
  for (let i = 0; i < 7; i++) {
    const joint = joins[i];
    const position = positions[i];
    if (!position) continue;
    if (Array.isArray(position)) {
      const [p, p0, p1] = position;
      joint.position.set(p.x, p.y, p.z);
      joint.lookAt(previousJoint ? previousJoint.position : new THREE.Vector3(0, 0, 0));

      // Compute the angle between the two vertices of the rectangular prism
      const dx = p1.x - p0.x;
      const dy = p1.y - p0.y;
      const angle = Math.atan2(dy, dx);
      joint.rotation.z = angle;
    } else {
      joint.position.set(position.x, position.y, position.z);
    }

    if (previousJoint) {
      const link = links[i - 1];
      link.position.set(
        (previousJoint.position.x + joint.position.x) / 2,
        (previousJoint.position.y + joint.position.y) / 2,
        (previousJoint.position.z + joint.position.z) / 2
      );
      link.lookAt(joint.position);
      link.rotateX(Math.PI / 2);
    }

    previousJoint = joint;
  }
}

function createArm() {
  const armGroup = new THREE.Group();

  for (let i = 0; i < 7; i++) {
    const color = colorof(i);
    const joint = i === 6 ? createEndEffector(jointRadius * 4, color) : createJoint(jointRadius, color);
    armGroup.add(joint);
    joins.push(joint);
  }

  for (let i = 0; i < 6; i++) {
    const link = createLink(linkLength, linkRadius, 0x00ff00);
    links.push(link);
    armGroup.add(link);
  }

  return armGroup;
}

function createJoint(radius, color) {
  const geometry = new THREE.SphereGeometry(radius, 32, 32);
  const material = new THREE.MeshStandardMaterial({color});
  const joint = new THREE.Mesh(geometry, material);
  return joint;
}

function createEndEffector(radius, color) {
  const geometry = new THREE.BoxGeometry(radius, radius / 8, radius);
  const material = new THREE.MeshStandardMaterial({color});
  const joint = new THREE.Mesh(geometry, material);
  return joint;
}

function createLink(length, radius, color) {
  const geometry = new THREE.CylinderGeometry(radius, radius, length, 32);
  const material = new THREE.MeshStandardMaterial({color});
  const link = new THREE.Mesh(geometry, material);
  return link;
}

function colorof(i) {
  if (i === 0 || i === 3 || i === 5) return 0xff0000;
  if (i === 6) return 0xffff00;
  else return 0x0000ff;
}

function forwardKinematics() {
  const a1 = (armParams.a1 / 180) * Math.PI;
  const a2 = (armParams.a2 / 180) * Math.PI;
  const a3 = (armParams.a3 / 180) * Math.PI;
  const a4 = (armParams.a4 / 180) * Math.PI;
  const a5 = (armParams.a5 / 180) * Math.PI;
  const a6 = (armParams.a6 / 180) * Math.PI;

  const T1 = dhTransform(a1 - Math.PI / 2, -Math.PI / 2, linkLength, 0);
  const T2 = dhTransform(a2 - Math.PI / 2, 0, 0, linkLength);
  const T3 = dhTransform(a3, 0, 0, linkLength);
  const T4 = dhTransform(0, a4, 0, linkLength);
  const T5 = dhTransform(a5, 0, 0, linkLength);
  const T6 = dhTransform(0, a6, 0, linkLength);

  const T01 = T1;
  const T02 = new THREE.Matrix4().multiplyMatrices(T01, T2);
  const T03 = new THREE.Matrix4().multiplyMatrices(T02, T3);
  const T04 = new THREE.Matrix4().multiplyMatrices(T03, T4);
  const T05 = new THREE.Matrix4().multiplyMatrices(T04, T5);
  const T06 = new THREE.Matrix4().multiplyMatrices(T05, T6);

  const p0 = new THREE.Vector3(0, 0, 0);
  const p1 = new THREE.Vector3().applyMatrix4(T01);
  const p2 = new THREE.Vector3().applyMatrix4(T02);
  const p3 = new THREE.Vector3().applyMatrix4(T03);
  const p4 = new THREE.Vector3().applyMatrix4(T04);
  const p5 = new THREE.Vector3().applyMatrix4(T05);
  const p6 = new THREE.Vector3().applyMatrix4(T06);

  // Compute the two vertices of the rectangular prism
  const size = jointRadius * 2;
  const p60 = new THREE.Vector3(-size, 0, -size).applyMatrix4(T06);
  const p61 = new THREE.Vector3(-size, 0, size).applyMatrix4(T06);

  return [p0, p1, p2, p3, p4, p5, [p6, p60, p61]];
}

function dhTransform(theta, alpha, d, a) {
  // prettier-ignore
  return new THREE.Matrix4(
    Math.cos(theta), -Math.sin(theta) * Math.cos(alpha), Math.sin(theta) * Math.sin(alpha), a * Math.cos(theta),
    Math.sin(theta), Math.cos(theta) * Math.cos(alpha), -Math.cos(theta) * Math.sin(alpha), a * Math.sin(theta),
    0, Math.sin(alpha), Math.cos(alpha), d,
    0, 0, 0, 1
  );
}

function round(n) {
  return (Math.round(n * 1e12) / 1e12).toFixed(2);
}
