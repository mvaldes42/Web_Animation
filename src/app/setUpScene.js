import { OrthographicCamera, WebGLRenderer } from "three";

export function setUpCamera(camera, frustumSize, cameraPosSet) {
  var aspect = window.innerWidth / window.innerHeight;

  camera = new OrthographicCamera(
    (frustumSize * aspect) / -2,
    (frustumSize * aspect) / 2,
    frustumSize / 2,
    frustumSize / -2,
    1,
    1000
  );
  camera.position.copy(cameraPosSet);
  camera.rotation.order = "YXZ";
  camera.rotation.y = -Math.PI / 4;
  camera.rotation.x = Math.atan(-1 / Math.sqrt(2));
  return camera;
}

export function setUpRenderer(renderer) {
  renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  return renderer;
}

export function setUpLights(light, archiObjPosZ) {
  light.position.set(0, 100, archiObjPosZ + 100);
  light.angle = Math.PI * 0.2;
  light.castShadow = true;
  light.shadow.camera.near = 50;
  light.shadow.camera.far = 200;
  light.shadow.bias = -0.0027;
  light.shadow.mapSize.width = 1080;
  light.shadow.mapSize.height = 1080;
  return light;
}
