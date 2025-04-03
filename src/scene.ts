import {
  GLTFLoader,
  GroundedSkybox,
  OrbitControls,
  RGBELoader,
  Timer,
} from "three/examples/jsm/Addons.js";
import "./style.css";
import * as THREE from "three";
import GUI from "lil-gui";
import { toggleFullscreen } from "./fullscreen";

const canvas = document.getElementById("canvas")!;
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

/* GUI */
const gui = new GUI({ title: "Tweaks", width: 375 });

/* RESIZE HANDLER */
window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
});

/* FULLSCREEN & GUI HANDLER */
window.addEventListener("keypress", (event) => {
  switch (event.key.toLowerCase()) {
    case "f":
      toggleFullscreen(renderer.domElement);
      break;
    case "h":
      gui.show(gui._hidden);
      break;
  }
});
canvas.addEventListener("dblclick", () => toggleFullscreen(canvas));

/* SCENE */
const scene = new THREE.Scene();

interface SceneParams {
  currentEnvMap: "field_1" | "field_2" | "real-time" | "light-studio";
  wireframe: boolean;
}
const sceneParams: SceneParams = {
  currentEnvMap: "field_1",
  wireframe: false,
};

// ENVIRONMENT MAPS
const rgbeLoader = new RGBELoader();

// LIGHT STUDIO ENVIRONMENT MAP
const resetSceneEnvironment = () => {
  if (blurinessTweak) blurinessTweak.hide();
  if (backgroundIntensityTweak) backgroundIntensityTweak.hide();
  if (environmentRotationTweaks) environmentRotationTweaks.show();
  if (wireframeTweak) wireframeTweak.show();
  if (orbitControls) orbitControls.maxPolarAngle = Math.PI / 2;

  if (fieldSkyBox) {
    fieldSkyBox.geometry.dispose();
    fieldSkyBox.material.dispose();
    scene.remove(fieldSkyBox);
    fieldSkyBox = null;
  }

  if (cubeCamera && cubeRenderTarget && torus) {
    cubeRenderTarget.dispose();
    torus.geometry.dispose();
    scene.remove(torus);
    cubeCamera = null;
    cubeRenderTarget = null;
    torus = null;
  }

  scene.background = null;
  scene.environment = null;
  scene.environmentIntensity = 1;
  scene.backgroundBlurriness = 0;
  scene.backgroundIntensity = 1;
  scene.backgroundRotation.set(0, 0, 0);
  scene.environmentRotation.set(0, 0, 0);
};

const setLightStudioEnvMap = () => {
  resetSceneEnvironment();
  if (wireframeTweak) wireframeTweak.hide();
  if (orbitControls) orbitControls.maxPolarAngle = Infinity;
  if (blurinessTweak) blurinessTweak.show();
  if (backgroundIntensityTweak) backgroundIntensityTweak.show();

  rgbeLoader.load("./environment_maps/custom/custom_2k.hdr", (envMap) => {
    envMap.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = envMap;
    scene.environment = envMap;

    scene.environmentIntensity = 0.75;
    scene.backgroundBlurriness = 0.8;
    scene.backgroundIntensity = 0.5;
    scene.backgroundRotation.y = 3;
    scene.environmentRotation.y = 3;

    backgroundRotationXTweak.object = scene.backgroundRotation;
    backgroundRotationYTweak.object = scene.backgroundRotation;
    backgroundRotationZTweak.object = scene.backgroundRotation;

    sceneParams.currentEnvMap = "light-studio";
  });
};

let fieldSkyBox: GroundedSkybox | null = null;
// FIELD 1 ENVIRONMENT MAP
const setFieldEnvMap = () => {
  resetSceneEnvironment();
  rgbeLoader.load("./environment_maps/field/field_2k.hdr", (envMap) => {
    envMap.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = envMap;

    scene.backgroundRotation.y = 5;
    scene.environmentRotation.y = 5;

    fieldSkyBox = new GroundedSkybox(envMap, 1, 10);

    fieldSkyBox.rotation.y = 5.55;
    fieldSkyBox.position.y = 0.95;

    scene.add(fieldSkyBox);

    if (
      backgroundRotationXTweak &&
      backgroundRotationYTweak &&
      backgroundRotationZTweak
    ) {
      backgroundRotationXTweak.object = fieldSkyBox.rotation;
      backgroundRotationYTweak.object = fieldSkyBox.rotation;
      backgroundRotationZTweak.object = fieldSkyBox.rotation;
    }

    sceneParams.currentEnvMap = "field_1";
  });
};

// FIELD 2 ENVIRONMENT MAP
const setField2EnvMap = () => {
  resetSceneEnvironment();
  rgbeLoader.load("./environment_maps/field_2/field_2k.hdr", (envMap) => {
    envMap.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = envMap;

    fieldSkyBox = new GroundedSkybox(envMap, 1, 10);

    fieldSkyBox.rotation.y = 5;
    fieldSkyBox.position.y = 0.95;

    scene.add(fieldSkyBox);

    if (
      backgroundRotationXTweak &&
      backgroundRotationYTweak &&
      backgroundRotationZTweak
    ) {
      backgroundRotationXTweak.object = fieldSkyBox.rotation;
      backgroundRotationYTweak.object = fieldSkyBox.rotation;
      backgroundRotationZTweak.object = fieldSkyBox.rotation;
    }

    sceneParams.currentEnvMap = "field_2";
  });
};

// REAL-TIME ENVIRONMENT MAP
let torus: THREE.Mesh | null = null;
let cubeRenderTarget: THREE.WebGLCubeRenderTarget | null = null;
let cubeCamera: THREE.CubeCamera | null = null;
const setRealTimeEnvMap = () => {
  resetSceneEnvironment();
  environmentRotationTweaks.hide();
  rgbeLoader.load("./environment_maps/field_3/field_2k.hdr", (envMap) => {
    envMap.mapping = THREE.EquirectangularReflectionMapping;

    fieldSkyBox = new GroundedSkybox(envMap, 1, 10);

    fieldSkyBox.rotation.y = 5;
    fieldSkyBox.position.y = 0.95;

    torus = new THREE.Mesh(
      new THREE.TorusGeometry(0.1, 0.015),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(255, 255, 255) })
    );

    torus.position.y = 0.8;

    cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256, {
      type: THREE.HalfFloatType,
    });
    scene.environment = cubeRenderTarget.texture;
    scene.environmentIntensity = 2;

    cubeCamera = new THREE.CubeCamera(0.1, 100, cubeRenderTarget);
    cubeCamera.position.y = 1.25;

    scene.add(torus, fieldSkyBox);

    if (
      backgroundRotationXTweak &&
      backgroundRotationYTweak &&
      backgroundRotationZTweak
    ) {
      backgroundRotationXTweak.object = fieldSkyBox.rotation;
      backgroundRotationYTweak.object = fieldSkyBox.rotation;
      backgroundRotationZTweak.object = fieldSkyBox.rotation;
    }

    sceneParams.currentEnvMap = "real-time";
  });
};

gui
  .add(sceneParams, "currentEnvMap")
  .options({
    skybox_field: "field_1",
    skybox_field_2: "field_2",
    real_time_env: "real-time",
    light_studio_env: "light-studio",
  })
  .onChange((selection: SceneParams["currentEnvMap"]) => {
    switch (selection) {
      case "field_1":
        setFieldEnvMap();
        break;
      case "field_2":
        setField2EnvMap();
        break;
      case "real-time":
        setRealTimeEnvMap();
        break;
      case "light-studio":
        setLightStudioEnvMap();
        break;
    }
  })
  .listen();

const wireframeTweak = gui.add(sceneParams, "wireframe").onChange(() => {
  if (fieldSkyBox) {
    fieldSkyBox.material.wireframe = sceneParams.wireframe;
  }
});

gui.add(scene, "environmentIntensity").min(0).max(3).step(0.001).listen();
const blurinessTweak = gui
  .add(scene, "backgroundBlurriness")
  .min(0)
  .max(1)
  .step(0.0001)
  .listen();
const backgroundIntensityTweak = gui
  .add(scene, "backgroundIntensity")
  .min(0)
  .max(5)
  .step(0.001)
  .listen();

const backgroundRotationTweaks = gui.addFolder("backgroundRotation");

const backgroundRotationXTweak = backgroundRotationTweaks
  .add(scene.backgroundRotation, "x")
  .min(0)
  .max(Math.PI * 2)
  .step(0.001);

const backgroundRotationYTweak = backgroundRotationTweaks
  .add(scene.backgroundRotation, "y")
  .min(0)
  .max(Math.PI * 2)
  .step(0.001)
  .listen();

const backgroundRotationZTweak = backgroundRotationTweaks
  .add(scene.backgroundRotation, "z")
  .min(0)
  .max(Math.PI * 2)
  .step(0.001);

const environmentRotationTweaks = gui.addFolder("environmentRotation");
environmentRotationTweaks
  .add(scene.environmentRotation, "x")
  .min(0)
  .max(Math.PI * 2)
  .step(0.001);
environmentRotationTweaks
  .add(scene.environmentRotation, "y")
  .min(0)
  .max(Math.PI * 2)
  .step(0.001)
  .listen();
environmentRotationTweaks
  .add(scene.environmentRotation, "z")
  .min(0)
  .max(Math.PI * 2)
  .step(0.001);

/* CAMERA */
const camera = new THREE.PerspectiveCamera(
  45,
  sizes.width / sizes.height,
  0.1,
  1000
);
camera.position.set(-0.5, 1, 2);
scene.add(camera);

/* RENDERER */
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
const render = () => {
  renderer.render(scene, camera);
};

/* ORBIT CONTROLS */
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.dampingFactor = 0.02;
orbitControls.target.set(0, 0.4, 0);
orbitControls.maxDistance = 9;

/* ANIMATION */
const timer = new Timer();

const pigPosition = new THREE.Vector3(0, 0.6, 0);
const animate = () => {
  window.requestAnimationFrame(animate);
  timer.update();
  const elapsedTime = timer.getElapsed();
  orbitControls.update();

  if (torus) {
    torus.lookAt(pigPosition);
    torus.position.x = Math.sin(elapsedTime) * 0.5;
    torus.position.z = Math.cos(elapsedTime) * 0.5;
    if (cubeCamera) cubeCamera.update(renderer, scene);
  }

  render();
};

/* OBJECTS */
const gltfLoader = new GLTFLoader();
// PIG
gltfLoader.load("./models/pig/pig.glb", (gltf) => {
  const model = gltf.scene;
  model.traverse((element) => {
    if (
      element instanceof THREE.Mesh &&
      element.material instanceof THREE.MeshStandardMaterial
    ) {
      element.material.roughness = 1;
      element.material.metalness = 0.25;
    }
  });

  model.scale.setScalar(0.1);
  scene.add(model);
});

/* RUN */
setFieldEnvMap();
animate();
