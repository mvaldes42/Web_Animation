import { resetScene } from "./drawFirst";
import {
  currentProject,
  camera,
  renderer,
  loadOBJ,
  objList,
  frustumSize,
  mouse,
  orderedProjectKey,
} from "./main";

export function onButtonNextClick() {
  // // onClick
  const currentProjectId = orderedProjectKey.findIndex(
    (v) => v === currentProject
  );
  if (currentProjectId < 0) {
    return;
  }
  var nextProjectId = (currentProjectId + 1) % orderedProjectKey.length;
  currentProject = objList[orderedProjectKey[nextProjectId]].name;
  if (
    objList[orderedProjectKey[nextProjectId]] &&
    objList[orderedProjectKey[nextProjectId]].loadedObj
  ) {
    resetScene(objList[orderedProjectKey[nextProjectId]].loadedObj);
  } else {
    loadOBJ();
  }
}

export function onWindowResize() {
  var aspect = window.innerHeight / window.innerWidth;

  camera.left = frustumSize / -2;
  camera.right = frustumSize / 2;
  camera.top = (frustumSize * aspect) / 2;
  camera.bottom = (-frustumSize * aspect) / 2;

  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

export function onDocumentMouseMove(event) {
  event.preventDefault();

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}
