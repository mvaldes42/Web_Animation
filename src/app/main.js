import THREE, {
    AmbientLight,
    Box3,
    BoxBufferGeometry,
    CameraHelper,
    Color,
    DoubleSide,
    DirectionalLight,
    Geometry,
    GridHelper,
    LoadingManager,
    Mesh,
    MeshStandardMaterial,
    MeshBasicMaterial,
    NearestFilter,
    OrthographicCamera,
    PlaneBufferGeometry,
    Points,
    PointLight,
    PointLightHelper,
    PointsMaterial,
    Raycaster,
    Scene,
    ShadowMaterial,
    SpotLight,
    SphereBufferGeometry,
    TextureLoader,
    Vector2,
    Vector3,
    WebGLRenderer,
} from 'three'
import OrbitControls from 'three-orbitcontrols'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import _, { delay } from 'lodash'
import gsap, { TimelineMax } from "gsap";
import { EasePack } from "gsap/EasePack";

import archiObjImport from '../assets/test.obj';


var camera, controls, scene, renderer, mouseRaycaster;

var mouse = new Vector2(),
    INTERSECTED;

//GRID SETTINGS//
var numberOfSquares = 1520;
var rowNum = 40;
var SquareLen = 2.5;
var SquareWdth = SquareLen;
var boxHoleNum = 1;

var cubeYSize = 10;

//OBJ IMPORT PLACEMENT//
var archiObjPosX = 65;
var archiObjPosZ = 50;

//CAM SETTINGS//
var cameraPosSet = new Vector3(110, 94, 113);
var frustumSize = 60;

function onMouseMove(event) {

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

}

function displayPoint(point) {

    var pointGeo = new Geometry();
    pointGeo.vertices.push(point);
    var pointMaterial = new PointsMaterial({ size: 8, sizeAttenuation: false, color: 0xF6831E });
    var pointMesh = new Points(pointGeo, pointMaterial);
    scene.add(pointMesh);
}

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
    document.body.innerHTML = ''
    document.body.appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize, false);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(archiObjPosX, 0, archiObjPosZ);
    controls.update();

    mouse.x = (window.innerWidth) * 2 - 1;
    mouse.y = -(window.innerHeight) * 2 + 1;
    mouseRaycaster = new Raycaster();
    document.addEventListener('mousemove', onDocumentMouseMove, false);
    createNewScene();
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

function createNewScene() {

    drawBasePlanes();
    loadOBJ();
}

function loadOBJ() {

    var manager = new LoadingManager();
    var loader = new OBJLoader(manager);
    loader.load(archiObjImport, addObjInScene);
};

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
    // Move those functions to createnewScene
    var boxesGeoArray = dispatchBoxGeometry(createSquareGrid(), archiObj);
    disposeOfUnsused(archiObj);
    animateBoxGeo(boxesGeoArray);
    render();
};

function disposeOfUnsused(archiObj) {
    archiObj.dispose;
}

function drawBoxMesh(width, height, depth, i) {
    var boxGeo = new BoxBufferGeometry(width - boxHoleNum, height, depth - boxHoleNum, 1, 5, 1);

    var x = (width / 2) + ((i % rowNum) * SquareWdth);
    var y = -height / 2;
    var z = (depth / 2) + (Math.floor(i / rowNum) * SquareWdth);
    boxGeo.position = new Vector3(x, y, z);
    return (boxGeo);
}

function createSquareGrid() {

    return _.range(numberOfSquares).map(function(i) {

        var x = ((i % rowNum) * SquareWdth) + (SquareWdth / 2);
        var z = (Math.floor(i / rowNum) * SquareWdth) + (SquareWdth / 2);

        var squareCenters = new Vector3(x, 0, z);

        var boxGeoArray = drawBoxMesh(SquareWdth, cubeYSize, SquareLen, i);

        return {
            boxGeoArray: boxGeoArray,
            squareCenters,
        }
    })
}

function findIntersectGridToObj(squareGrid, archiObj) {

    return squareGrid.map((square) => {

        var squareCentersPoints = new Vector3();
        squareCentersPoints = square.squareCenters;

        var RayDirection = new Vector3(0, 1, 0)
        RayDirection.normalize();
        archiObj.updateMatrixWorld();

        var raycaster = new Raycaster(squareCentersPoints, RayDirection);
        var intersectArray = raycaster.intersectObject(archiObj, true);
        return {
            intersectArray,
        }
    })
}

function findDistanceArray(intersectArray) {

    return intersectArray.reduce((acc, distance) => {
        if (distance.intersectArray[1]) {
            acc.push(distance.intersectArray[1].distance);
        }
        return acc;
    }, [])
}

function findIntersectPointArray(intersectArray) {

    return intersectArray.reduce((acc, distance) => {
        if (distance.intersectArray[1]) {
            distance.intersectArray[1].point.y = 0;
            acc.push(distance.intersectArray[1].point);
        }
        return acc;
    }, [])
}

function findBoxGeo(squareGrid) {

    return squareGrid.reduce((acc, grid) => {
        if (grid.boxGeoArray) {
            acc.push(grid.boxGeoArray);
        }
        return acc;
    }, [])
}

function findBoxGeoPoint(squareGrid) {

    return squareGrid.reduce((acc, grid) => {
        if (grid.boxGeoArray) {
            acc.push(grid.squareCenters);
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

function dispatchBoxGeometry(squareGrid, archiObj) {

    var intersectArray = findIntersectGridToObj(squareGrid, archiObj);
    var boxGeo = findBoxGeo(squareGrid);
    var indexes = findIndexPoint(findIntersectPointArray(intersectArray), findBoxGeoPoint(squareGrid));

    var boxGeoFloorArray = [];
    var boxGeoUpArray = [];

    let i = 0;

    while (i < numberOfSquares) {
        if (indexes.includes(i)) {
            boxGeoUpArray.push(boxGeo[i]);
        } else {
            boxGeoFloorArray.push(boxGeo[i]);
        }
        i++;
    }
    return {
        boxGeoFloorArray,
        boxGeoUpArray,
        intersectArray
    }
}

var boxMeshFloorArray = [];
var boxMeshUpArray = [];

function animateBoxGeo(boxesGeoArray) {

    var gsap = new TimelineMax().delay(.5);

    var boxGeoFloorArray = boxesGeoArray.boxGeoFloorArray;
    var boxGeoUpArray = boxesGeoArray.boxGeoUpArray;

    var distanceArray = findDistanceArray(boxesGeoArray.intersectArray);
    var distanceMax = Math.max(...distanceArray);
    var distanceMin = Math.min(...distanceArray);

    let i = 0;
    let j = 0;

    while (boxGeoFloorArray[i]) {
        var cubeFloorMaterial = new MeshStandardMaterial({
            side: DoubleSide,
            color: 0x2D00F7,
        });
        var boxMesh = new Mesh(boxGeoFloorArray[i], cubeFloorMaterial);
        boxMesh.castShadow = true;
        boxMesh.receiveShadow = true;
        boxMesh.position.copy(boxGeoFloorArray[i].position);
        scene.add(boxMesh);
        boxMesh.position.y = 0.2 / 2;
        boxMesh.scale.set(1, 0.2 / cubeYSize, 1);
        scene.add(boxMesh);
        boxMeshFloorArray.push(boxMesh);
        i++;
    }

    i = 0;

    while (boxGeoUpArray[i]) {

        var cubeFloorMaterial = new MeshStandardMaterial({
            side: DoubleSide,
            color: 0x2D00F7,
        });
        var boxMesh = new Mesh(boxGeoUpArray[i], cubeFloorMaterial);
        boxMesh.castShadow = true;
        boxMesh.receiveShadow = true;
        boxMesh.position.copy(boxGeoUpArray[i].position);
        scene.add(boxMesh);
        boxMesh.position.y = 0.2 / 2;
        boxMesh.scale.set(1, 0.2 / cubeYSize, 1);
        scene.add(boxMesh);
        boxMeshUpArray.push(boxMesh);

        var distance = distanceArray[j];
        var color = new Color(getColour('#2D00F7', '#F20089', distanceMin, distanceMax, distance));
        var cubeUpMaterial = new MeshStandardMaterial({
            side: DoubleSide,
            color: color,
            emissive: null,
            emissiveIntensity: 0.3,
            roughness: null,
            wireframe: false,

        });
        boxMesh.material = cubeUpMaterial;
        gsap.to(boxMesh.position, { y: distance / 2, duration: 1.5, ease: "elastic.out(1, 0.3)" }, 0);
        gsap.to(boxMesh.scale, { y: distance / cubeYSize, duration: 1.5, ease: "elastic.out(1, 0.3)" }, 0);
        scene.add(boxMesh);
        boxMeshUpArray.push(boxMesh);
        i++;
        j++;
    }
}

var render = function() {
    var gsap2 = new TimelineMax();

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

// USE FOR IF CUBES NEED A TEXTURE //

// var loader = new TextureLoader();
// loader.crossOrigin = "";
// var textureNorm = loader.load(textureImpNorm);
// var textureDis = loader.load(textureImpDisp);
// var textureOccl = loader.load(textureImpOccl);
// var textureRough = loader.load(textureImpRough);

// loader.load(textureImpDiff, function(textureDiff) {
//         textureDiff.minFilter = NearestFilter;
//         var material = new MeshStandardMaterial({
//             // map: textureDiff,
//             // normalMap: textureNorm,
//             // displacementMap: textureDis,
//             // displacementBias: -0.6,
//             // aoMap: textureOccl,
//             // roughnessMap: textureRough,
//             // side: DoubleSide,
//             color: 0x6A00F4,
//         });
//         cube.geometry = boxGeo;
//         cube.material = material;
//         scene.add(cube);
//     },
//     function() { console.log("on progress") },
//     function(error) { console.log(error) }
// );

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