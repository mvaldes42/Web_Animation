import {
  AmbientLight,
  SpotLight,
  Vector3,
// @ts-ignore
} from "../../node_modules/three/build/three";
import { camera, scene, renderer, archiObjPosX, archiObjPosZ } from "./main";

export function setUpCamera() {
  var cameraPosSet = new Vector3(110, 94, 113);

  camera.position.copy(cameraPosSet);
  camera.rotation.order = "YXZ";
  camera.rotation.y = -Math.PI / 4;
  camera.rotation.x = Math.atan(-1 / Math.sqrt(2));
  scene.add(camera);
}

export function setUpRenderer() {
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
}

export function setUpLights() {
  scene.add(new AmbientLight(0xf0f0f0, 0.7));
  var light = new SpotLight(0xffffff, 1);
  // @ts-ignore
  light.position.set(0, 100, archiObjPosZ + 100);
  light.angle = Math.PI * 0.2;
  light.castShadow = true;
  light.shadow.camera.near = 50;
  light.shadow.camera.far = 200;
  light.shadow.bias = -0.0027;
  light.shadow.mapSize.width = 1080;
  light.shadow.mapSize.height = 1080;
  scene.add(light);

  // @ts-ignore
  light.target.position.set(archiObjPosX, 0, archiObjPosZ);
  scene.add(light.target);
}
