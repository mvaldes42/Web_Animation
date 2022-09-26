// @ts-ignore
import { Timeline } from "gsap/gsap-core";
import {
  renderer,
  controls,
  camera,
  mouseRaycaster,
  scene,
  boxMeshUpArray,
  INTERSECTED,
  mouse,
} from "./main";

var mouseIntersects;

export var render = function () {
  var gsap2 = new Timeline();
  gsap2.smoothChildTiming = true;

  // renderer.info.autoReset = false;
  // console.log(renderer.info);
  // console.log(document.getElementById("buttonNext").disabled);

  requestAnimationFrame(render);

  renderer.setPixelRatio(window.devicePixelRatio);
  controls.update();

  camera.updateMatrixWorld();

  mouseRaycaster.setFromCamera(mouse, camera);
  mouseIntersects = mouseRaycaster.intersectObjects(boxMeshUpArray);

  if (mouseIntersects.length > 0) {
    if (INTERSECTED != mouseIntersects[0].object) {
      // if (INTERSECTED) INTERSECTED.material.emissive = INTERSECTED.currentHex;
      // if (INTERSECTED) INTERSECTED.material.wireframe = INTERSECTED.currenWire;

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

      // INTERSECTED.currentHex = INTERSECTED.material.emissive;
      // INTERSECTED.currenWire = INTERSECTED.material.wireframe;
      // INTERSECTED.material.emissive = INTERSECTED.material.color;
      // INTERSECTED.material.wireframe = true;
    }
  } else {
    // if (INTERSECTED) INTERSECTED.material.emissive = INTERSECTED.currentHex;
    // if (INTERSECTED) INTERSECTED.material.wireframe = INTERSECTED.currenWire;
    INTERSECTED = null;
  }

  renderer.render(scene, camera);
};
