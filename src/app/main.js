import {
  DoubleSide,
  LoadingManager,
  MeshStandardMaterial,
  OrthographicCamera,
  Raycaster,
  Scene,
  Vector2,
  WebGLRenderer,
} from "three";
import OrbitControls from "three-orbitcontrols";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import _ from "lodash";

// @ts-ignore
import rainMeshObj from "url:../assets/rain_mesh.obj";
// @ts-ignore
import oasisMeshObj from "url:../assets/oasis_mesh.obj";
// @ts-ignore
import nestMeshObj from "url:../assets/nest_mesh.obj";

import { setUpCamera, setUpLights, setUpRenderer } from "./setUpEnv";
import { createNewScene, resetScene } from "./drawFirst";
import {
  onWindowResize,
  onDocumentMouseMove,
  onButtonNextClick,
} from "./actions";

export var camera, controls, scene, renderer, mouseRaycaster;

export var mouse = new Vector2(),
  INTERSECTED;

export var currentProject = "rain";

export var objList = {
  rain: { name: "rain", loadedObj: null, nextObjKey: "oasis" },
  oasis: { name: "oasis", loadedObj: null, nextObjKey: "nest" },
  nest: { name: "nest", loadedObj: null, nextObjKey: "rain" },
};

var urlObj = {
  rain: { importUrl: rainMeshObj },
  oasis: { importUrl: oasisMeshObj },
  nest: { importUrl: nestMeshObj },
};

export var orderedProjectKey = Object.keys(objList);

export var boxMeshFloorArray = [];
export var boxMeshUpArray = [];
export var boxMeshAllArray = [];
export var socleMeshArray = [];
export var intersectArray;

//GRID SETTINGS//
export var cubeYSize = 30;

//OBJ IMPORT PLACEMENT//
export var archiObjPosX = 65;
export var archiObjPosZ = 50;

//CAM SETTINGS//
export var frustumSize = 60;
//
export var cubeFloorMaterial = new MeshStandardMaterial({
  side: DoubleSide,
  color: 0xffffff,
});

export default function () {
  var container = document.createElement("div");
  document.body.appendChild(container);

  var info = document.createElement("div");
  container.appendChild(info);

  scene = new Scene();
  var aspect = window.innerWidth / window.innerHeight;
  camera = new OrthographicCamera(
    (frustumSize * aspect) / -2,
    (frustumSize * aspect) / 2,
    frustumSize / 2,
    frustumSize / -2,
    1,
    1000
  );
  renderer = new WebGLRenderer({ antialias: true, alpha: true });
  setUpCamera();
  setUpRenderer();
  setUpLights();

  document.body.appendChild(renderer.domElement);

  window.addEventListener("resize", onWindowResize, false);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(archiObjPosX, 0, archiObjPosZ);
  controls.update();

  mouse.x = window.innerWidth * 2 - 1;
  mouse.y = -window.innerHeight * 2 + 1;
  mouseRaycaster = new Raycaster();
  document.addEventListener("mousemove", onDocumentMouseMove, false);
  document.addEventListener("DOMContentLoaded", (event) => {
    var nextButton = document.getElementById("buttonNext");
    if (nextButton.disabled == false) {
      nextButton.addEventListener("click", onButtonNextClick);
      nextButton.disabled = true;
      document.getElementById("buttonPrevious").disabled = true;
    }
  });
  loadOBJ();
}

export function loadOBJ() {
  var manager = new LoadingManager();
  var loader = new OBJLoader(manager);
  var safeCurrentProject = currentProject;

  if (!objList.oasis.loadedObj && !objList.rain.loadedObj) {
    if (objList[safeCurrentProject] && !objList[safeCurrentProject].loadedObj) {
      loader.load(urlObj[safeCurrentProject].importUrl, (obj) => {
        objList[safeCurrentProject].loadedObj = obj;
        createNewScene(obj);
      });
    }
  } else if (
    objList[safeCurrentProject] &&
    !objList[safeCurrentProject].loadedObj
  ) {
    loader.load(urlObj[safeCurrentProject].importUrl, (obj) => {
      objList[safeCurrentProject].loadedObj = obj;
      resetScene(obj);
    });
  }
}
