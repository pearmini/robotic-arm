import * as THREE from "three";
import GUI from "lil-gui";
import "./style.css";

const armParams = {
  a0: 0,
  a1: 0,
  a2: 0,
  a3: 0,
  a4: 0,
  a5: 0,
  x: 0,
  y: 0,
  z: 0,
};

displayGUI();
displayScene();

function displayScene() {
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

  const createJoint = (radius, color, rect) => {
    let geometry = new THREE.SphereGeometry(radius, 32, 32);
    if (rect) {
      geometry = new THREE.BoxGeometry(radius * 4, radius / 2, radius * 4);
    }
    const material = new THREE.MeshStandardMaterial({color});
    const joint = new THREE.Mesh(geometry, material);
    return joint;
  };

  const createLink = (length, radius, color) => {
    const geometry = new THREE.CylinderGeometry(radius, radius, length, 32);
    const material = new THREE.MeshStandardMaterial({color});
    const link = new THREE.Mesh(geometry, material);
    return link;
  };

  const createArm = () => {
    const armGroup = new THREE.Group();

    const jointRadius = 0.2;
    const linkRadius = 0.1;

    let previousJoint = null;

    const getColor = (i) => {
      if (i === 0 || i === 3 || i === 5) return 0xff0000;
      if (i === 6) return 0xffff00;
      else return 0x0000ff;
    };

    const getRect = (i) => {
      if (i === 6) return true;
      else return false;
    };

    for (let i = 0; i < 7; i++) {
      const joint = createJoint(jointRadius, getColor(i), getRect(i));
      joint.position.set(i * 1.5, 0, 0);
      armGroup.add(joint);

      if (previousJoint) {
        const link = createLink(1.5, linkRadius, 0x00ff00);

        link.position.set(
          (previousJoint.position.x + joint.position.x) / 2,
          (previousJoint.position.y + joint.position.y) / 2,
          (previousJoint.position.z + joint.position.z) / 2
        );
        link.lookAt(joint.position);

        link.rotateX(Math.PI / 2);

        armGroup.add(link);
      }

      previousJoint = joint;
    }

    return armGroup;
  };

  const arm = createArm();
  scene.add(arm);

  const animate = () => {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  };

  animate();
}

function displayGUI() {
  const gui = new GUI();
  gui.add(armParams, "a0", 0, 360);
  gui.add(armParams, "a1", 0, 360);
  gui.add(armParams, "a2", 0, 360);
  gui.add(armParams, "a3", 0, 360);
  gui.add(armParams, "a4", 0, 360);
  gui.add(armParams, "a5", 0, 360);
  gui.add(armParams, "x", -10, 10);
  gui.add(armParams, "y", -10, 10);
  gui.add(armParams, "z", -10, 10);
}
