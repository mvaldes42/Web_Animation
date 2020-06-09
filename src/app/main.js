import {
    AmbientLight,
    BoxBufferGeometry,
    Color,
    DoubleSide,
    Geometry,
    GridHelper,
    LoadingManager,
    Mesh,
    MeshStandardMaterial,
    OrthographicCamera,
    PlaneBufferGeometry,
    Points,
    PointsMaterial,
    Raycaster,
    Scene,
    ShadowMaterial,
    SpotLight,
    Vector2,
    Vector3,
    WebGLRenderer,
} from 'three'
import OrbitControls from 'three-orbitcontrols'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import _, { delay } from 'lodash'
import gsap, { TimelineMax } from "gsap";
import { EasePack } from "gsap/EasePack";

import rainMeshObj from '../assets/rain_mesh.obj';
import oasisMeshObj from '../assets/oasis_mesh.obj';

var camera, controls, scene, renderer, mouseRaycaster;

var mouse = new Vector2(),
    INTERSECTED;

var currentProject = 'rain';

var objList = {
    rain: { name: 'rain', loadedObj: null, nextObjKey: 'oasis' },
    oasis: { name: 'oasis', loadedObj: null, nextObjKey: 'rain' },
}

var orderedProjectKey = Object.keys(objList);

var urlObj = {
    rain: { importUrl: rainMeshObj },
    oasis: { importUrl: oasisMeshObj }
};

var boxMeshFloorArray = [];
var boxMeshUpArray = [];
var boxMeshAllArray = [];
var intersectArray;

//GRID SETTINGS//
var numberOfSquares = 3000;
var rowNum = 60;
var SquareLen = 2;
var SquareWdth = SquareLen;
var boxHoleNum = 1;

var cubeYSize = 20;

//OBJ IMPORT PLACEMENT//
var archiObjPosX = 65;
var archiObjPosZ = 50;

//CAM SETTINGS//
var cameraPosSet = new Vector3(110, 94, 113);
var frustumSize = 60;

// function displayPoint(point) {

//     var pointGeo = new Geometry();
//     pointGeo.vertices.push(point);
//     var pointMaterial = new PointsMaterial({ size: 8, sizeAttenuation: false, color: 0xF6831E });
//     var pointMesh = new Points(pointGeo, pointMaterial);
//     scene.add(pointMesh);
// }

function setUpCamera() {

    var aspect = window.innerWidth / window.innerHeight;

    camera = new OrthographicCamera(frustumSize * aspect / -2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / -2, 1, 1000);
    camera.position.copy(cameraPosSet);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = -Math.PI / 4;
    camera.rotation.x = Math.atan(-1 / Math.sqrt(2));
    scene.add(camera);
}

function setUpRenderer() {

    renderer = new WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
}

function setUpLights(scene) {

    scene.add(new AmbientLight(0xf0f0f0, 0.7));
    var light = new SpotLight(0xffffff, 1);
    light.position.set(0, 100, archiObjPosZ + 100);
    light.angle = Math.PI * 0.2;
    light.castShadow = true;
    light.shadow.camera.near = 50;
    light.shadow.camera.far = 200;
    light.shadow.bias = -0.0027;
    light.shadow.mapSize.width = 1080;
    light.shadow.mapSize.height = 1080;
    scene.add(light);

    light.target.position.set(archiObjPosX, 0, archiObjPosZ);
    scene.add(light.target);

    // var shadowCameraHelper = new CameraHelper(light.shadow.camera);
    // shadowCameraHelper.visible = true;
    // scene.add(shadowCameraHelper);
}

function onWindowResize() {

    var aspect = window.innerHeight / window.innerWidth;

    camera.left = frustumSize / -2;
    camera.right = frustumSize / 2;
    camera.top = frustumSize * aspect / 2;
    camera.bottom = -frustumSize * aspect / 2;

    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onDocumentMouseMove(event) {

    event.preventDefault();

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

}

export default function() {

    // make DOM elements:
    var container = document.createElement('div');
    document.body.appendChild(container);

    var info = document.createElement('div');
    container.appendChild(info);

    scene = new Scene();
    setUpCamera();
    setUpRenderer();
    setUpLights(scene);

    // DOM again ?
    // document.body.innerHTML = ''
    document.body.appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize, false);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(archiObjPosX, 0, archiObjPosZ);
    controls.update();

    mouse.x = (window.innerWidth) * 2 - 1;
    mouse.y = -(window.innerHeight) * 2 + 1;
    mouseRaycaster = new Raycaster();
    document.addEventListener('mousemove', onDocumentMouseMove, false);
    document.addEventListener('DOMContentLoaded', (event) => {
        if (document.getElementById("buttonNext").disabled == false) {
            document.getElementById("buttonNext").addEventListener("click", onButtonNextClick);
            document.getElementById("buttonNext").disabled = true;
            document.getElementById("buttonPrevious").disabled = true;
        }
    })
    loadOBJ();
}

function onButtonNextClick() {

    // // onClick
    const currentProjectId = orderedProjectKey.findIndex((v) => v === currentProject);
    if (currentProjectId < 0) {
        return
    }
    var nextProjectId = (currentProjectId + 1) % orderedProjectKey.length;
    currentProject = objList[orderedProjectKey[nextProjectId]].name;
    if (objList[orderedProjectKey[nextProjectId]] && objList[orderedProjectKey[nextProjectId]].loadedObj) {
        //add scene
        resetScene(objList[orderedProjectKey[nextProjectId]].loadedObj);
    } else {
        loadOBJ();
        // console.log('next is clicked');
    }
}

function drawBasePlanes() {

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
// // init
// var safeCurrentProject = currentProject;
// if (objList[safeCurrentProject] && !objList[safeCurrentProject].loadedObj) {
//     load(obj => {
//         objList[safeCurrentProject].loadedObj = obj
//     })
// }

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
        };
    } else if (objList[safeCurrentProject] && !objList[safeCurrentProject].loadedObj) {
        loader.load(urlObj[safeCurrentProject].importUrl, (obj) => {
            objList[safeCurrentProject].loadedObj = obj;
            resetScene(obj);
        });
    };
}

function resetScene(objectObj) {
    document.getElementById("buttonNext").disabled = true;
    document.getElementById("buttonPrevious").disabled = true;
    animateBackToOrigin();

    setTimeout(() => {
        boxMeshUpArray.splice(0, boxMeshUpArray.length);
        var archiObjLoaded;
        archiObjLoaded = addObjInScene(objectObj);
        dispatchBoxMeshArray(boxMeshAllArray, archiObjLoaded);
        animateBoxGeo();
        disposeOfUnsused(archiObjLoaded);
        // render();
    }, 1850);
}

function animateBackToOrigin() {
    var gsap = new TimelineMax().delay(.3);
    gsap.smoothChildTiming = true;
    let i = 0;
    while (boxMeshUpArray[i]) {
        var boxMesh = boxMeshUpArray[i];
        var ease = "bounce.out";
        gsap.to(boxMesh.material.color, { r: cubeFloorMaterial.color.r, g: cubeFloorMaterial.color.G, b: cubeFloorMaterial.color.b, duration: 1.5, ease: ease }, 0);
        gsap.to(boxMesh.position, { y: 0.2 / 2, duration: 1.5, ease: ease }, 0);
        gsap.to(boxMesh.scale, { y: 0.2 / cubeYSize, duration: 1.5, ease: ease }, 0);
        scene.add(boxMesh);
        i++;
    }
}
var boxGeoArray;

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

var addObjInScene = function(object) {
    var archiObj;
    archiObj = object;
    archiObj.position.x = archiObjPosX;
    archiObj.position.z = archiObjPosZ;
    object.traverse(function(child) {
        if (child instanceof Mesh) {
            child.material.color = new Color(0X8d9db6);
            child.geometry.computeVertexNormals();
            child.material.side = DoubleSide;
        }
    });
    return (archiObj);
};

function disposeOfUnsused(archiObj) {
    archiObj.traverse(function(child) {
        if (child.geometry !== undefined) {
            child.geometry.dispose();
            child.material.dispose();
        }
    });
}

function drawBoxGeo(width, height, depth, i) {

    var boxGeo = new BoxBufferGeometry(width - boxHoleNum, height, depth - boxHoleNum, 1, 5, 1);

    var x = (width / 2) + ((i % rowNum) * SquareWdth);
    var y = -height / 2;
    var z = (depth / 2) + (Math.floor(i / rowNum) * SquareWdth);
    boxGeo.position = new Vector3(x, y, z);

    return (boxGeo);
}

function createBoxGeoGrid() {

    return _.range(numberOfSquares).map(function(i) {

        var x = ((i % rowNum) * SquareWdth) + (SquareWdth / 2);
        var z = (Math.floor(i / rowNum) * SquareWdth) + (SquareWdth / 2);

        var squareCenters = new Vector3(x, 0, z);

        var boxGeoArray = drawBoxGeo(SquareWdth, cubeYSize, SquareLen, i);

        return {
            squareCenters,
            boxGeoArray,
        }
    })
}

function findIntersectArray(archiObjLoaded) {

    return boxGeoArray.map((box) => {

        var squareCentersPoints = new Vector3();
        squareCentersPoints = box.squareCenters;

        var RayDirection = new Vector3(0, 1, 0)
        RayDirection.normalize();
        archiObjLoaded.updateMatrixWorld();

        var raycaster = new Raycaster(squareCentersPoints, RayDirection);
        var intersectArray = raycaster.intersectObject(archiObjLoaded, true);
        return {
            intersectArray,
        }
    })
}

function findDistanceArray() {

    return intersectArray.reduce((acc, distance) => {
        if (distance.intersectArray[0]) {
            var length = distance.intersectArray.length - 1;
            acc.push(distance.intersectArray[length].distance);
        }
        return acc;
    }, [])
}

function findIntersectPointArray(intersectArray) {

    return intersectArray.reduce((acc, distance) => {
        if (distance.intersectArray[0]) {
            var length = distance.intersectArray.length - 1;
            distance.intersectArray[length].point.y = 0;
            acc.push(distance.intersectArray[length].point);
        }
        return acc;
    }, [])
}

function findBoxGeo() {

    return boxGeoArray.reduce((acc, box) => {
        if (box.boxGeoArray) {
            acc.push(box.boxGeoArray);
        }
        return acc;
    }, [])
}

function findBoxGeoPoint() {

    return boxGeoArray.reduce((acc, box) => {
        if (box.squareCenters) {
            acc.push(box.squareCenters);
        }
        return acc;
    }, [])
}

function findIndexPoint(intersectPoint, boxGeoPoint) {
    var indexes = [],
        i, j;
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
    // var boxGeo = findBoxGeo(squareGrid);
    var indexes = findIndexPoint(findIntersectPointArray(intersectArray), findBoxGeoPoint());

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

var cubeFloorMaterial = new MeshStandardMaterial({
    side: DoubleSide,
    color: 0x2D00F7,
});

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

    var gsap = new TimelineMax().delay(.5);
    gsap.smoothChildTiming = true;

    var distanceArray = findDistanceArray(intersectArray);
    var distanceMax = Math.max(...distanceArray);
    var distanceMin = Math.min(...distanceArray);

    let i = 0;

    while (boxMeshUpArray[i]) {
        var boxMesh = boxMeshUpArray[i];
        var distance = distanceArray[i];
        var color = new Color(getColour('#2D00F7', '#F20089', distanceMin, distanceMax, distance));
        var cubeUpMaterial = new MeshStandardMaterial({
            side: DoubleSide,
            color: 0x2D00F7,

        });
        boxMesh.material = cubeUpMaterial;
        scene.add(boxMesh);
        gsap.to(boxMesh.material.color, { r: color.r, b: color.b, g: color.g, duration: 1.5, ease: "elastic.out(1, 0.3)" }, 0);
        gsap.to(boxMesh.position, { y: distance / 2, duration: 1.5, ease: "elastic.out(1, 0.3)" }, 0);
        gsap.to(boxMesh.scale, { y: distance / cubeYSize, duration: 1.5, ease: "elastic.out(1, 0.3)" }, 0);
        scene.add(boxMesh);
        boxMeshUpArray[i] = boxMesh;
        i++;
    }
    gsap.eventCallback("onComplete", () => {
        document.getElementById("buttonNext").disabled = false;
        document.getElementById("buttonPrevious").disabled = false;
    });
}

var render = function() {
    var gsap2 = new TimelineMax();
    gsap2.smoothChildTiming = true;

    // renderer.info.autoReset = false;
    // console.log(renderer.info);
    console.log(document.getElementById("buttonNext").disabled);

    requestAnimationFrame(render);

    renderer.setPixelRatio(window.devicePixelRatio);
    controls.update();

    camera.updateMatrixWorld();

    mouseRaycaster.setFromCamera(mouse, camera);
    var mouseIntersects = mouseRaycaster.intersectObjects(boxMeshUpArray);

    if (mouseIntersects.length > 0) {

        if (INTERSECTED != mouseIntersects[0].object) {

            if (INTERSECTED) INTERSECTED.material.emissive = INTERSECTED.currentHex;
            if (INTERSECTED) INTERSECTED.material.wireframe = INTERSECTED.currenWire;

            INTERSECTED = mouseIntersects[0].object;

            gsap2.to(INTERSECTED.position, { y: (((INTERSECTED.scale.y * cubeYSize) / 2) + 2), duration: 0.3, ease: "back.out(1.7)" }, 0);
            gsap2.to(INTERSECTED.position, { y: (((INTERSECTED.scale.y * cubeYSize) / 2)), duration: 1, ease: "elastic.out(1, 0.3)" }, 0.3);

            INTERSECTED.currentHex = INTERSECTED.material.emissive;
            INTERSECTED.currenWire = INTERSECTED.material.wireframe;
            INTERSECTED.material.emissive = INTERSECTED.material.color;
            INTERSECTED.material.wireframe = true;
        }
    } else {
        if (INTERSECTED) INTERSECTED.material.emissive = INTERSECTED.currentHex;
        if (INTERSECTED) INTERSECTED.material.wireframe = INTERSECTED.currenWire;
        INTERSECTED = null;
    }

    renderer.render(scene, camera);
};

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function map(value, fromSource, toSource, fromTarget, toTarget) {
    return (value - fromSource) / (toSource - fromSource) * (toTarget - fromTarget) + fromTarget;
}

function getColour(startColour, endColour, min, max, value) {
    var startRGB = hexToRgb(startColour);
    var endRGB = hexToRgb(endColour);
    var percentFade = map(value, min, max, 0, 1);

    var diffRed = endRGB.r - startRGB.r;
    var diffGreen = endRGB.g - startRGB.g;
    var diffBlue = endRGB.b - startRGB.b;

    diffRed = (diffRed * percentFade) + startRGB.r;
    diffGreen = (diffGreen * percentFade) + startRGB.g;
    diffBlue = (diffBlue * percentFade) + startRGB.b;

    var result = "rgb(" + Math.round(diffRed) + ", " + Math.round(diffGreen) + ", " + Math.round(diffBlue) + ")";
    return result;
}