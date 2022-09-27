import {
  AmbientLight,
  BoxBufferGeometry,
  Color,
  DoubleSide,
  Geometry,
  GridHelper,
  LoadingManager,
  Mesh,
  MeshBasicMaterial,
  MeshNormalMaterial,
  MeshStandardMaterial,
  PlaneBufferGeometry,
  Points,
  PointsMaterial,
  Raycaster,
  Scene,
  ShadowMaterial,
  SpotLight,
  Vector2,
  Vector3,
} from "three";
import OrbitControls from "three-orbitcontrols";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import _ from "lodash";
import { Timeline } from "gsap/gsap-core";

import rainMeshObj from "url:../assets/rain_mesh.obj";
import oasisMeshObj from "url:../assets/oasis_mesh.obj";
import nestMeshObj from "url:../assets/nest_mesh.obj";
import { setUpCamera, setUpRenderer, setUpLights } from "./setUpScene";

var camera, controls, scene, renderer, mouseRaycaster;

var mouse = new Vector2(),
  INTERSECTED;

var currentProject = "rain";

var objList = {
  rain: { name: "rain", loadedObj: null, nextObjKey: "oasis" },
  oasis: { name: "oasis", loadedObj: null, nextObjKey: "nest" },
  nest: { name: "nest", loadedObj: null, nextObjKey: "rain" },
};

var orderedProjectKey = Object.keys(objList);

var urlObj = {
  rain: { importUrl: rainMeshObj },
  oasis: { importUrl: oasisMeshObj },
  nest: { importUrl: nestMeshObj },
};

var boxMeshFloorArray = [];
var boxMeshUpArray = [];
var boxMeshAllArray = [];
var socleMeshArray = [];
var intersectArray;

//GRID SETTINGS//
var numberOfSquares = 3000;
var rowNum = 60;
var SquareLen = 2;
var SquareWdth = SquareLen;
var boxHoleNum = 1;

var cubeYSize = 30;

//OBJ IMPORT PLACEMENT//
var archiObjPosX = 65;
var archiObjPosZ = 50;

//CAM SETTINGS//
var cameraPosSet = new Vector3(110, 94, 113);
var frustumSize = 60;

//
var boxGeoArray;

var maxYArray = [];
var minYArray = [];

var intersectPointArray;

var cubeFloorMaterial = new MeshStandardMaterial({
  side: DoubleSide,
  color: 0xffffff,
});

function onWindowResize() {
  var aspect = window.innerHeight / window.innerWidth;

  camera.left = frustumSize / -2;
  camera.right = frustumSize / 2;
  camera.top = (frustumSize * aspect) / 2;
  camera.bottom = (-frustumSize * aspect) / 2;

  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onDocumentMouseMove(event) {
  event.preventDefault();

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

export default function () {
  var container = document.createElement("div");
  document.body.appendChild(container);

  var info = document.createElement("div");
  container.appendChild(info);

  scene = new Scene();
  camera = setUpCamera(camera, frustumSize, cameraPosSet);
  scene.add(camera);
  renderer = setUpRenderer(render);
  scene.add(new AmbientLight(0xf0f0f0, 0.7));
  var light = new SpotLight(0xffffff, 1);
  light = setUpLights(light, archiObjPosZ);
  scene.add(light);
  light.target.position.set(archiObjPosX, 0, archiObjPosZ);
  scene.add(light.target);

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
    if (document.getElementById("buttonNext").disabled == false) {
      document
        .getElementById("buttonNext")
        .addEventListener("click", onButtonNextClick);
      document.getElementById("buttonNext").disabled = true;
      document.getElementById("buttonPrevious").disabled = true;
    }
  });
  loadOBJ();
}

function onButtonNextClick() {
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
  )
    resetScene(objList[orderedProjectKey[nextProjectId]].loadedObj);
  else loadOBJ();
}

function drawBasePlanes() {
  var planeGeo = new PlaneBufferGeometry(2000, 2000);
  planeGeo.rotateX(-Math.PI / 2);
  var shadow = new ShadowMaterial({ opacity: 0.3 });
  var shadowPlane = new Mesh(planeGeo, shadow);
  shadowPlane.position.y = 0.01;
  shadowPlane.receiveShadow = true;
  scene.add(shadowPlane);

  var planeMaterial = new MeshBasicMaterial({});
  var plane = new Mesh(planeGeo, planeMaterial);
  plane.position.y = 0;
  plane.receiveShadow = true;
  scene.add(plane);

  var gridGeo = new GridHelper(2000, 100);
  gridGeo.position.y = 0.011;
  gridGeo.material.opacity = 0.25;
  gridGeo.material.transparent = true;
  scene.add(gridGeo);
}

function loadOBJ() {
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

function resetScene(objectObj) {
  document.getElementById("buttonNext").disabled = true;
  document.getElementById("buttonPrevious").disabled = true;
  animateBackToOrigin();

  setTimeout(() => {
    var archiObjLoaded;
    archiObjLoaded = addObjInScene(objectObj);

    boxMeshUpArray.splice(0, boxMeshUpArray.length);
    socleMeshArray.splice(0, socleMeshArray.length);

    for (let i = scene.children.length - 1; i >= 0; i--) {
      if (scene.children[i].type === "Mesh") {
        scene.children[i].truePosY = null;
      }
    }

    dispatchBoxMeshArray(boxMeshAllArray, archiObjLoaded);
    animateBoxGeo();
    disposeOfUnsused(archiObjLoaded);
  }, 1850);
}

function animateBackToOrigin() {
  var gsap = new Timeline().delay(0.3);
  gsap.smoothChildTiming = true;

  let i = 0;
  while (boxMeshUpArray[i]) {
    var boxMesh = boxMeshUpArray[i];
    var ease = "bounce.out";
    gsap.to(
      boxMesh.material.color,
      {
        r: cubeFloorMaterial.color.r,
        g: cubeFloorMaterial.color.g,
        b: cubeFloorMaterial.color.b,
        duration: 1.5,
        ease: ease,
      },
      0
    );
    gsap.to(boxMesh.position, { y: 0.2 / 2, duration: 1.5, ease: ease }, 0);
    gsap.to(
      boxMesh.scale,
      { y: 0.2 / cubeYSize, duration: 1.5, ease: ease },
      0
    );
    scene.add(boxMesh);

    var socleMesh = socleMeshArray[i];
    gsap.to(socleMesh.position, { y: 0, duration: 1.5, ease: ease }, 0);
    gsap.to(socleMesh.scale, { y: 0, duration: 1.5, ease: ease }, 0);
    scene.add(socleMesh);

    i++;
  }
  setTimeout(() => {
    var i = 0;
    while (socleMeshArray[i]) {
      socleMeshArray[i].geometry.dispose();
      socleMeshArray[i].material.dispose();
      scene.remove(socleMeshArray[i]);
      i++;
    }
  }, 1500);
}

function createNewScene(objectObj) {
  var archiObjLoaded;
  drawBasePlanes();
  archiObjLoaded = addObjInScene(objectObj);

  boxGeoArray = createBoxGeoGrid();
  drawBoxMesh();
  dispatchBoxMeshArray(boxMeshAllArray, archiObjLoaded);
  animateBoxGeo();
  disposeOfUnsused(archiObjLoaded);
  render();
}

var addObjInScene = function (object) {
  var archiObj;
  archiObj = object;
  archiObj.position.x = archiObjPosX;
  archiObj.position.z = archiObjPosZ;
  object.traverse(function (child) {
    if (child instanceof Mesh) {
      child.material.color = new Color(0x8d9db6);
      child.geometry.computeVertexNormals();
      child.material.side = DoubleSide;
    }
  });
  return archiObj;
};

function disposeOfUnsused(archiObj) {
  archiObj.traverse(function (child) {
    if (child.geometry !== undefined) {
      child.geometry.dispose();
      child.material.dispose();
      scene.remove(child);
    }
  });
}

function drawBoxGeo(width, height, depth, i) {
  var boxGeo = new BoxBufferGeometry(
    width - boxHoleNum,
    height,
    depth - boxHoleNum,
    1,
    5,
    1
  );

  var x = width / 2 + (i % rowNum) * SquareWdth;
  var y = -height / 2;
  var z = depth / 2 + Math.floor(i / rowNum) * SquareWdth;
  boxGeo.position = new Vector3(x, y, z);

  return boxGeo;
}

function createBoxGeoGrid() {
  return _.range(numberOfSquares).map(function (i) {
    var x = (i % rowNum) * SquareWdth + SquareWdth / 2;
    var z = Math.floor(i / rowNum) * SquareWdth + SquareWdth / 2;

    var squareCenters = new Vector3(x, 0, z);

    var boxGeoArray = drawBoxGeo(SquareWdth, cubeYSize, SquareLen, i);

    return {
      squareCenters,
      boxGeoArray,
    };
  });
}

function findIntersectArray(archiObjLoaded) {
  return boxGeoArray.map((box) => {
    var squareCentersPoints = new Vector3();
    squareCentersPoints = box.squareCenters;

    var RayDirection = new Vector3(0, 1, 0);
    RayDirection.normalize();
    archiObjLoaded.updateMatrixWorld();

    var raycaster = new Raycaster(squareCentersPoints, RayDirection);
    var intersectArray = raycaster.intersectObject(archiObjLoaded, true);
    return {
      intersectArray,
    };
  });
}

function findDistanceArray() {
  var j = 0;

  return intersectArray.reduce((acc, distance) => {
    if (distance.intersectArray[0] && distance.intersectArray.length >= 2) {
      var i = 0;
      var distanceY = [];

      while (distance.intersectArray[i]) {
        distanceY.push(distance.intersectArray[i].point.y);
        i++;
      }

      var maxY = Math.max(...distanceY);
      var minY;

      if (
        distance.intersectArray.length == 2 &&
        (distance.intersectArray[0].point.y == 0 ||
          distance.intersectArray[1].point.y == 0)
      ) {
        minY = maxY - 2;
      } else {
        minY = Math.min.apply(null, distanceY.filter(Boolean));
      }

      minYArray[j] = minY;
      maxYArray[j] = maxY;
      j++;

      acc.push(maxY - minY);
    }
    return acc;
  }, []);
}

function findIntersectPointArray(intersectArray) {
  return intersectArray.reduce((acc, distance) => {
    if (distance.intersectArray[0] && distance.intersectArray.length >= 2) {
      distance.intersectArray[0].point.y = 0;
      acc.push(distance.intersectArray[0].point);
    }
    return acc;
  }, []);
}

function findBoxGeo() {
  return boxGeoArray.reduce((acc, box) => {
    if (box.boxGeoArray) {
      acc.push(box.boxGeoArray);
    }
    return acc;
  }, []);
}

function findBoxGeoPoint() {
  return boxGeoArray.reduce((acc, box) => {
    if (box.squareCenters) {
      acc.push(box.squareCenters);
    }
    return acc;
  }, []);
}

function findIndexPoint(intersectPoint, boxGeoPoint) {
  var indexes = [],
    i,
    j;
  i = 0;
  while (intersectPoint[i]) {
    j = 0;
    while (boxGeoPoint[j]) {
      if (intersectPoint[i] && intersectPoint[i].equals(boxGeoPoint[j])) {
        indexes.push(j);
        i++;
      }
      j++;
    }
  }
  return indexes;
}

function dispatchBoxMeshArray(boxMeshAllArray, archiObjLoaded) {
  intersectArray = findIntersectArray(archiObjLoaded);
  intersectPointArray = findIntersectPointArray(intersectArray);
  var indexes = findIndexPoint(intersectPointArray, findBoxGeoPoint());

  let i = 0;

  while (i < numberOfSquares) {
    if (indexes.includes(i)) {
      boxMeshUpArray.push(boxMeshAllArray[i]);
    } else {
      boxMeshFloorArray.push(boxMeshAllArray[i]);
    }
    i++;
  }
}

function drawBoxMesh() {
  let i = 0;

  var boxGeo = findBoxGeo();

  while (boxGeo[i]) {
    var boxMesh = new Mesh(boxGeo[i], cubeFloorMaterial);
    boxMesh.castShadow = true;
    boxMesh.receiveShadow = true;
    boxMesh.position.copy(boxGeo[i].position);
    scene.add(boxMesh);
    boxMesh.position.y = 0.2 / 2;
    boxMesh.scale.set(1, 0.2 / cubeYSize, 1);
    scene.add(boxMesh);
    boxMeshAllArray.push(boxMesh);
    i++;
  }
}

function animateBoxGeo() {
  var gsap = new Timeline().delay(0.5);
  gsap.smoothChildTiming = true;

  var distanceArray = findDistanceArray(intersectArray);
  var distanceMax = Math.max(...maxYArray);
  var distanceMin = Math.min(...maxYArray);

  let i = 0;

  while (boxMeshUpArray[i]) {
    //SOCLE
    var socleMesh = boxMeshUpArray[i].clone();
    var socleMaterial = new MeshStandardMaterial({
      side: DoubleSide,
      color: 0xf7fdfe,
      transparent: true,
      opacity: 0.6,
      // metalness: 0.1,
    });
    socleMesh.castShadow = true;
    socleMesh.receiveShadow = true;
    socleMesh.material = socleMaterial;
    socleMesh.y = 0;
    socleMesh.position.y = 0;
    socleMesh.scale.z = 1.3;
    socleMesh.scale.x = 1.3;
    scene.add(socleMesh);
    gsap.to(
      socleMesh.position,
      { y: minYArray[i] / 2 + 0.2, duration: 1.5, ease: "elastic.out(1, 0.3)" },
      0
    );
    gsap.to(
      socleMesh.scale,
      {
        y: (minYArray[i] + 0.3) / cubeYSize,
        duration: 1.5,
        ease: "elastic.out(1, 0.3)",
      },
      0
    );
    scene.add(socleMesh);
    socleMeshArray[i] = socleMesh;

    var boxMesh = boxMeshUpArray[i];
    var distance = distanceArray[i];

    var color = new Color(
      getColour("#85B4FF", "#9b5de5", distanceMin, distanceMax, maxYArray[i])
    );
    var cubeUpMaterial = new MeshStandardMaterial({
      side: DoubleSide,
      color: 0xffffff,
    });

    boxMesh.material = cubeUpMaterial;
    scene.add(boxMesh);
    gsap.to(
      boxMesh.material.color,
      {
        r: color.r,
        b: color.b,
        g: color.g,
        duration: 1.5,
        ease: "elastic.out(1, 0.3)",
      },
      0
    );
    gsap.to(
      boxMesh.position,
      {
        y: minYArray[i] + distance / 2,
        duration: 1.5,
        ease: "elastic.out(1, 0.3)",
      },
      0
    );
    gsap.to(
      boxMesh.scale,
      { y: distance / cubeYSize, duration: 1.5, ease: "elastic.out(1, 0.3)" },
      0
    );
    scene.add(boxMesh);

    boxMeshUpArray[i] = boxMesh;
    i++;
  }
  gsap.eventCallback("onComplete", () => {
    document.getElementById("buttonNext").disabled = false;
    document.getElementById("buttonPrevious").disabled = false;
  });
}

var mouseIntersects;

var render = function () {
  var gsap2 = new Timeline();
  gsap2.smoothChildTiming = true;

  requestAnimationFrame(render);

  renderer.setPixelRatio(window.devicePixelRatio);
  controls.update();

  camera.updateMatrixWorld();

  mouseRaycaster.setFromCamera(mouse, camera);
  mouseIntersects = mouseRaycaster.intersectObjects(boxMeshUpArray);

  if (mouseIntersects.length > 0) {
    if (INTERSECTED != mouseIntersects[0].object) {
      INTERSECTED = mouseIntersects[0].object;

      if (!INTERSECTED.truePosY) {
        INTERSECTED.truePosY = INTERSECTED.position.y;
      }
      gsap2.to(
        INTERSECTED.position,
        { y: INTERSECTED.truePosY - 1.5, duration: 0.3, ease: "back.out(1.7)" },
        0
      );
      gsap2.to(
        INTERSECTED.position,
        { y: INTERSECTED.truePosY, duration: 1, ease: "elastic.out(1, 0.3)" },
        0.3
      );
    }
  } else {
    INTERSECTED = null;
  }

  renderer.render(scene, camera);
};

function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function map(value, fromSource, toSource, fromTarget, toTarget) {
  return (
    ((value - fromSource) / (toSource - fromSource)) * (toTarget - fromTarget) +
    fromTarget
  );
}

function getColour(startColour, endColour, min, max, value) {
  var startRGB = hexToRgb(startColour);
  var endRGB = hexToRgb(endColour);
  var percentFade = map(value, min, max, 0, 1);

  var diffRed = endRGB.r - startRGB.r;
  var diffGreen = endRGB.g - startRGB.g;
  var diffBlue = endRGB.b - startRGB.b;

  diffRed = diffRed * percentFade + startRGB.r;
  diffGreen = diffGreen * percentFade + startRGB.g;
  diffBlue = diffBlue * percentFade + startRGB.b;

  var result =
    "rgb(" +
    Math.round(diffRed) +
    ", " +
    Math.round(diffGreen) +
    ", " +
    Math.round(diffBlue) +
    ")";
  return result;
}
