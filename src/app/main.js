import THREE, {
    AmbientLight,
    ArrowHelper,
    AxesHelper,
    BackSide,
    Box3,
    BoxHelper,
    BoxBufferGeometry,
    BufferGeometry,
    CameraHelper,
    Color,
    DirectionalLightHelper,
    DoubleSide,
    DirectionalLight,
    Euler,
    ExtrudeBufferGeometry,
    Face3,
    GridHelper,
    LineBasicMaterial,
    LineDashedMaterial,
    LoadingManager,
    MeshPhysicalMaterial,
    Mesh,
    MeshBasicMaterial,
    MeshLambertMaterial,
    MeshPhongMaterial,
    MeshStandardMaterial,
    NearestFilter,
    OrthographicCamera,
    PerspectiveCamera,
    PlaneBufferGeometry,
    PlaneGeometry,
    Points,
    PointsMaterial,
    Ray,
    Raycaster,
    RepeatWrapping,
    MirroredRepeatWrapping,
    Scene,
    ShadowMaterial,
    Shape,
    ShapeGeometry,
    SpotLight,
    SpotLightHelper,
    TextureLoader,
    Vector2,
    Vector3,
    WebGLRenderer,
    Geometry,
    Line
} from 'three'
import OrbitControls from 'three-orbitcontrols'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import _, { delay } from 'lodash'
import gsap, { TimelineMax } from "gsap";

import { EasePack } from "gsap/EasePack";
gsap.registerPlugin(EasePack);

import archiObjImport from '../assets/test.obj';

import textureImpDiff from '../assets/textures/concrete_diffuse.gif';
// import textureImpNorm from '../assets/textures/concrete_norm.gif';
// import textureImpDisp from '../assets/textures/concrete_disp.gif';
// import textureImpOccl from '../assets/textures/concrete_occ.gif';
// import textureImpRough from '../assets/textures/concrete_rough.gif';

var archiObj
var camera
var controls
var renderer
var scene
var dirLightScene
var dirLightSceneHelper
var aspect = window.innerWidth / window.innerHeight;

var SquareLen = 2.5;
var SquareWdth = SquareLen;
var frustumSize = 60;
var numberOfSquares = 1520;
var rowNum = 40;
var boxHoleNum = 1;

var archiObjPosX = 65;
var archiObjPosZ = 50;
var cubeYSize = 10;
var cameraPosSet = new Vector3(110, 94, 113);

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

    scene.add(new AmbientLight(0xf0f0f0));
    var light = new SpotLight(0xffffff, 0.2);
    light.position.set(-200, 200, 200);
    light.angle = Math.PI * 0.2;
    light.castShadow = true;
    light.shadow.camera.near = 100;
    light.shadow.camera.far = 450;
    light.shadow.bias = -0.0022;
    light.shadow.mapSize.width = 1080;
    light.shadow.mapSize.height = 1080;
    scene.add(light);

    var shadowCameraHelper = new CameraHelper(light.shadow.camera);
    shadowCameraHelper.visible = true;
    scene.add(shadowCameraHelper);
}

function onWindowResize() {

    var aspect = window.innerWidth / window.innerHeight;
    camera.left = -frustumSize * aspect / 2;
    camera.right = frustumSize * aspect / 2;
    camera.top = frustumSize / 2;
    camera.bottom = -frustumSize / 2;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
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
    controls.update();

    createNewScene();
}

function drawBasePlanes() {

    var planeGeo = new PlaneBufferGeometry(2000, 2000);
    planeGeo.rotateX(-Math.PI / 2);
    var planeMaterial = new ShadowMaterial({ opacity: 0.2 });
    var plane = new Mesh(planeGeo, planeMaterial);
    plane.position.y = 0;
    plane.receiveShadow = true;
    scene.add(plane);

    var gridGeo = new GridHelper(2000, 100);
    gridGeo.position.y = 0.1;
    gridGeo.material.opacity = 0.25;
    gridGeo.material.transparent = true;
    scene.add(gridGeo);
}

function createNewScene() {

    drawBasePlanes();
    loadOBJ();
}

function loadOBJ() {

    //Manager from ThreeJs to track a loader and its status
    var manager = new LoadingManager();
    //Loader for Obj from Three.js
    var loader = new OBJLoader(manager);
    loader.load(archiObjImport, addObjInScene);
};

function disposeOfUnsused(archiObj) {
    archiObj.dispose;
}

var addObjInScene = function(object) {
    archiObj = object;
    archiObj.position.x = archiObjPosX;
    archiObj.position.z = archiObjPosZ;
    //Go through all children of the loaded object and search for a Mesh
    object.traverse(function(child) {
        //This allow us to check if the children is an instance of the Mesh constructor
        if (child instanceof Mesh) {
            child.material.color = new Color(0X8d9db6);
            //Sometimes there are some vertex normals missing in the .obj files, ThreeJs will compute them
            child.geometry.computeVertexNormals();
            // child.geometry.computeBoundingBox();
            child.material.side = DoubleSide;
        }
    });
    // scene.add(archiObj);
    targetCameraToObj();
    // boxHelper(camera, archiObj);
    extrudeSquareGrid(createSquareGrid(), archiObj);
    disposeOfUnsused(archiObj);
    render();
};

function targetCameraToObj() {
    var archiObjCenterPoint = findObjectCenterPoint(archiObj);

    controls.target.set(60, 0, 60);
    // camera.position.copy(cameraPosSet);
    // camera.updateProjectionMatrix();
}

function boxHelper(archiObj) {

    var boxHelper = new BoxHelper(archiObj);
    boxHelper.material = new LineDashedMaterial({
        color: 0x581845,
        dashSize: 300,
        gapSize: 3,
        scale: 1,
    });

}

function findObjectCenterPoint(object) {

    var objectCenterPoint = new Vector3();
    var objectBB = new Box3().setFromObject(object);

    objectCenterPoint.x = (objectBB.max.x + objectBB.min.x) / 2;
    objectCenterPoint.y = (objectBB.max.y + objectBB.min.y) / 2;
    objectCenterPoint.z = (objectBB.max.z + objectBB.min.z) / 2;
    return objectCenterPoint;
}

function drawSquare(x1, y1, x2, y2) {

    var square = new Geometry();
    square.vertices.push(new Vector3(x1, 0, y1));
    square.vertices.push(new Vector3(x1, 0, y2));
    square.vertices.push(new Vector3(x2, 0, y1));
    square.vertices.push(new Vector3(x2, 0, y2));

    square.faces.push(new Face3(0, 1, 2));
    square.faces.push(new Face3(1, 2, 3));
    return square;
}

function drawBoxMesh(width, height, depth, i) {
    var boxGeo = new BoxBufferGeometry(width - boxHoleNum, height, depth - boxHoleNum, 3, 3, 3);

    var cube = new Mesh();
    var loader = new TextureLoader();
    loader.crossOrigin = "";

    // var textureNorm = loader.load(textureImpNorm);
    // var textureDis = loader.load(textureImpDisp);
    // var textureOccl = loader.load(textureImpOccl);
    // var textureRough = loader.load(textureImpRough);

    loader.load(textureImpDiff, function(textureDiff) {
            textureDiff.minFilter = NearestFilter;

            var material = new MeshStandardMaterial({
                // map: textureDiff,
                // normalMap: textureNorm,
                // displacementMap: textureDis,
                // displacementBias: -0.6,
                // aoMap: textureOccl,
                // roughnessMap: textureRough,
                // side: DoubleSide,
                // metalness: 0.2,
                // emissive: 0xF3F3F3,
                // emissiveIntensity: 0.5,
                color: 0x6A00F4,
            });
            cube.geometry = boxGeo;
            cube.material = material;
            // add mesh to scene:
            scene.add(cube);
        },
        function() { console.log("yay") }, // onProgress function
        function(error) { console.log(error) }
    );

    cube.position.x = (width / 2) + ((i % rowNum) * SquareWdth);
    cube.position.y = -height / 2;
    cube.position.z = (depth / 2) + (Math.floor(i / rowNum) * SquareWdth);

    cube.castShadow = true;
    cube.receiveShadow = true;

    return (cube);
}

function createSquareGrid() {

    var material = new MeshBasicMaterial({ color: 0x00ff00 });
    var squareGeometry = drawSquare(SquareLen, SquareLen, 0, 0);

    var centerPoint = new Geometry();
    var centerPointMaterial = new PointsMaterial({ size: 10, sizeAttenuation: false, color: 0xF6831E });
    centerPoint.vertices.push(new Vector3(SquareWdth / 2, 0, SquareWdth / 2));

    var squareMaterial = new MeshBasicMaterial({ color: 0xfbefcc, side: DoubleSide });

    return _.range(numberOfSquares).map(function(i) {

        var x = ((i % rowNum) * SquareWdth) + (SquareWdth / 2);
        var z = (Math.floor(i / rowNum) * SquareWdth) + (SquareWdth / 2);
        var squareCenters = new Vector3(x, 0, z);
        centerPoint.vertices.push(squareCenters);
        var pointMesh = new Points(centerPoint, centerPointMaterial);
        // scene.add(pointMesh);

        var squareMesh = new Mesh(squareGeometry, squareMaterial);
        squareMesh.position.x = (i % rowNum) * SquareWdth;
        squareMesh.position.z = Math.floor(i / rowNum) * SquareWdth;
        // scene.add(squareMesh);

        var boxMeshArray = drawBoxMesh(SquareWdth, cubeYSize, SquareLen, i);
        // scene.add(boxMeshArray);

        return {
            squareGeometry,
            squareMesh,
            pointMesh,
            boxMeshArray,
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

        intersectArray.map((intersectArray) => {
            // displayPoint(intersectArray.point)
            // console.log(intersectArray.point);
        });
        // scene.add(new ArrowHelper(RayDirection, squareCentersPoints, 3, 0xffff00));
        return {
            intersectArray,
        }
    })
}

function extrudeSquareGrid(squareGrid, archiObj) {

    var intersectArray = findIntersectGridToObj(squareGrid, archiObj);
    var gsap = new TimelineMax().delay(.5);
    var boxMesh;

    let i = 0;

    while (i < numberOfSquares) {
        boxMesh = squareGrid[i].boxMeshArray;
        boxMesh.position.y = 0.2 / 2;
        boxMesh.scale.set(1, 0.2 / cubeYSize, 1);
        scene.add(boxMesh);
        if (typeof intersectArray[i].intersectArray[1] !== 'undefined') {
            var distance = intersectArray[i].intersectArray[1].distance;
            scene.add(boxMesh);
            gsap.to(boxMesh.position, { y: distance / 2, duration: 1.5, ease: "elastic.out(1, 0.3)" }, 0);
            gsap.to(boxMesh.scale, { y: distance / cubeYSize, duration: 1.5, ease: "elastic.out(1, 0.3)" }, 0);
            scene.add(boxMesh);
        };
        i++;
    }
}

var render = function() {
    requestAnimationFrame(render);
    renderer.setPixelRatio(window.devicePixelRatio);
    camera.updateMatrixWorld();
    controls.update();
    // console.log(camera.position);
    // console.log(camera.rotation);

    renderer.render(scene, camera);
};