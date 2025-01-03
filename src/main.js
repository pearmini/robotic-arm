import * as THREE from "three";
import GUI from "lil-gui";
import "./style.css";

const armParams = {
  a1: 175,
  a2: -50,
  a3: 64,
  a4: 0,
  a5: 64,
  a6: -30,
  x: 0,
  y: 0,
  z: 0,
  az: 0,
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
const guiZ = gui.add(armParams, "z", 0, 10);
const guiAz = gui.add(armParams, "az", -180, 180);

handleForwardKinematics(guiA1);
handleForwardKinematics(guiA2);
handleForwardKinematics(guiA3);
handleForwardKinematics(guiA4);
handleForwardKinematics(guiA5);
handleForwardKinematics(guiA6);

handleInverseKinematics(guiX);
handleInverseKinematics(guiY);
handleInverseKinematics(guiZ);
handleInverseKinematics(guiAz);

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
  controller.onChange(() => updatePosition(true));
}

function handleInverseKinematics(controller) {
  controller.onChange(() => {
    const {x, y, z, az} = armParams;
    const {angles} = inverseKinematics([x, y, z, 0, 0, THREE.MathUtils.degToRad(az)]);
    if (!angles) return;
    armParams.a1 = angles[0] === null ? armParams.a1 : THREE.MathUtils.radToDeg(angles[0]);
    armParams.a2 = angles[1] === null ? armParams.a2 : THREE.MathUtils.radToDeg(angles[1]);
    armParams.a3 = angles[2] === null ? armParams.a3 : THREE.MathUtils.radToDeg(angles[2]);
    armParams.a4 = angles[3] === null ? armParams.a4 : THREE.MathUtils.radToDeg(angles[3]);
    armParams.a5 = angles[4] === null ? armParams.a5 : THREE.MathUtils.radToDeg(angles[4]);
    armParams.a6 = angles[5] === null ? armParams.a6 : THREE.MathUtils.radToDeg(angles[5]);
    guiA1.updateDisplay();
    guiA2.updateDisplay();
    guiA3.updateDisplay();
    guiA4.updateDisplay();
    guiA5.updateDisplay();
    guiA6.updateDisplay();
    updatePosition(false);
  });
}

function updatePosition(updateGUI = true) {
  const a1 = THREE.MathUtils.degToRad(armParams.a1);
  const a2 = THREE.MathUtils.degToRad(armParams.a2);
  const a3 = THREE.MathUtils.degToRad(armParams.a3);
  const a4 = THREE.MathUtils.degToRad(armParams.a4);
  const a5 = THREE.MathUtils.degToRad(armParams.a5);
  const a6 = THREE.MathUtils.degToRad(armParams.a6);

  const {positions, angles} = forwardKinematics([a1, a2, a3, a4, a5, a6]);

  if (updateGUI) {
    const last = positions[positions.length - 1];
    armParams.x = round(last.x);
    armParams.y = round(last.y);
    armParams.z = round(last.z);
    armParams.az = round(THREE.MathUtils.radToDeg(angles.z));
    guiX.updateDisplay();
    guiY.updateDisplay();
    guiZ.updateDisplay();
    guiAz.updateDisplay();
  }

  let previousJoint = null;
  for (let i = 0; i < 7; i++) {
    const joint = joins[i];
    const position = positions[i];
    joint.position.set(position.x, position.y, position.z);
    joint.lookAt(previousJoint ? previousJoint.position : new THREE.Vector3(0, 0, 0));

    // Rotate end effector
    if (i === 6) joint.rotation.z = angles.z;

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
  const geometry = new THREE.BoxGeometry(radius, radius / 4, radius);
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

function forwardKinematics([a1, a2, a3, a4, a5, a6]) {
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

  const size = jointRadius * 2;
  const p60 = new THREE.Vector3(-size, 0, -size).applyMatrix4(T06);
  const p61 = new THREE.Vector3(-size, 0, size).applyMatrix4(T06);
  const dx = p61.x - p60.x;
  const dy = p61.y - p60.y;
  const angle = Math.atan2(dy, dx);

  return {
    positions: [p0, p1, p2, p3, p4, p5, p6],
    angles: {z: angle},
  };
}

function inverseKinematics([x, y, z, rotateX, rotateY, rotateZ]) {
  const dz = Math.sqrt(x * x + y * y);
  const az = Math.atan2(x, y);
  const angles = inverseKinematics3(z - linkLength, dz, linkLength, linkLength * 2, linkLength * 2);
  return {
    angles: [az, angles[0], angles[1], 0, angles[2], rotateZ],
  };
}

function inverseKinematics2(px, py, a1, a2) {
  const c2 = (px * px + py * py - a2 * a2 - a1 * a1) / (2 * a1 * a2);

  if (c2 > 1) return [0, 0];
  if (c2 < -1) return [0, Math.PI];

  const s2 = Math.sqrt(1 - c2 * c2);
  const t2 = Math.atan2(s2, c2);
  const t1 = Math.atan2(py, px) - Math.atan2(a2 * s2, a1 + a2 * c2);
  return [t1, t2];
}

function inverseKinematics3(px, py, a1, a2, a3) {
  const r = Math.sqrt(px * px + py * py);
  if (r > a1 && r < a1 + a2 + a3) {
    const t1 = Math.atan2(py, px);
    const npx = px - a1 * Math.cos(t1);
    const npy = py - a1 * Math.sin(t1);
    const [t2, t3] = inverseKinematics2(npx, npy, a2, a3);
    return [t1, t2, t3];
  }
  return [null, null, null];
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
  return +(Math.round(n * 1e12) / 1e12).toFixed(2);
}
