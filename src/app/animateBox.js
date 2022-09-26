import { Timeline } from "gsap/gsap-core";
import { MeshStandardMaterial, DoubleSide, Color } from "three";
import {
  boxMeshUpArray,
  cubeFloorMaterial,
  cubeYSize,
  intersectArray,
  scene,
  socleMeshArray,
} from "./main";

var maxYArray = [];
var minYArray = [];

export function animateBoxGeo() {
  var gsap = new Timeline().delay(0.5);
  gsap.smoothChildTiming = true;

  var distanceArray = findDistanceArray();
  var distanceMax = Math.max(...maxYArray);
  var distanceMin = Math.min(...maxYArray);

  let i = 0;

  while (boxMeshUpArray[i]) {
    //SOCLE
    var socleMesh = boxMeshUpArray[i].clone();
    var socleMaterial = new MeshStandardMaterial({
      side: DoubleSide,
      color: 0xf5f5f5,
      transparent: true,
      opacity: 0.2,
      // roughness: 0.7,
      metalness: 0.1,
    });
    socleMesh.castShadow = false;
    socleMesh.receiveShadow = false;
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

    // MAIN

    var boxMesh = boxMeshUpArray[i];
    var distance = distanceArray[i];

    var color = new Color(
      getColour("#FFFFFF", "#F20089", distanceMin, distanceMax, maxYArray[i])
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

export function animateBackToOrigin() {
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

    // SOCLE
    var socleMesh = socleMeshArray[i];
    // gsap.to(socleMesh.material.color, { r: 255, g: 255, b: 255, duration: 1.5, ease: ease }, 0);
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
