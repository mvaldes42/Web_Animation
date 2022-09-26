import _ from "lodash";
import {
  PlaneBufferGeometry,
  ShadowMaterial,
  Mesh,
  GridHelper,
  Color,
  DoubleSide,
  Vector3,
  BoxBufferGeometry,
  Raycaster,
} from "three";
import { animateBoxGeo, animateBackToOrigin } from "./animateBox";
import {
  archiObjPosX,
  archiObjPosZ,
  boxMeshAllArray,
  boxMeshFloorArray,
  boxMeshUpArray,
  cubeFloorMaterial,
  cubeYSize,
  intersectArray,
  scene,
  socleMeshArray,
} from "./main";
import { render } from "./render";

//GRID SETTINGS//
var numberOfSquares = 3000;
var rowNum = 60;
var SquareLen = 2;
var SquareWdth = SquareLen;
var boxHoleNum = 1;

var boxGeoArray;
var intersectPointArray;

export function createNewScene(objectObj) {
  var archiObjLoaded;
  drawBasePlanes();
  archiObjLoaded = addObjInScene(objectObj);
  // scene.add(archiObjLoaded);

  boxGeoArray = createBoxGeoGrid();
  drawBoxMesh();
  dispatchBoxMeshArray(boxMeshAllArray, archiObjLoaded);
  animateBoxGeo();
  disposeOfUnsused(archiObjLoaded);
  render();
}

export function resetScene(objectObj) {
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
    // render();
  }, 1850);
}

export function drawBasePlanes() {
  var planeGeo = new PlaneBufferGeometry(2000, 2000);
  planeGeo.rotateX(-Math.PI / 2);
  var planeMaterial = new ShadowMaterial({ opacity: 0.3 });
  var plane = new Mesh(planeGeo, planeMaterial);
  plane.position.y = -0.02;
  plane.receiveShadow = true;
  scene.add(plane);

  var gridGeo = new GridHelper(2000, 100);
  gridGeo.position.y = -0.01;
  gridGeo.material.opacity = 0.25;
  gridGeo.material.transparent = true;
  scene.add(gridGeo);
}

var addObjInScene = function (object) {
  var archiObj;
  archiObj = object;
  archiObj.position.x = archiObjPosX;
  archiObj.position.z = archiObjPosZ;
  object.traverse(function (child) {
    if (child instanceof Mesh) {
      child.material.color = new Color(0x8d9db6);
      // child.material.transparent = true;
      // child.material.opacity = 0.5;
      child.geometry.computeVertexNormals();
      child.material.side = DoubleSide;
    }
  });
  return archiObj;
};

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
function disposeOfUnsused(archiObj) {
  archiObj.traverse(function (child) {
    if (child.geometry !== undefined) {
      child.geometry.dispose();
      child.material.dispose();
      scene.remove(child);
    }
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

function findIntersectPointArray(intersectArray) {
  return intersectArray.reduce((previous, distance) => {
    if (distance.intersectArray[0] && distance.intersectArray.length >= 2) {
      distance.intersectArray[0].point.y = 0;
      previous.push(distance.intersectArray[0].point);
    }
    return previous;
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
