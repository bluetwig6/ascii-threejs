import * as THREE from 'three';
import Stats from 'stats.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { paintASCIITexture, updateASCIITexture } from './createASCIITexture';
import { createASCIIShader, updateShader } from './shader';
import GUI from 'lil-gui';

const TEXTURE_SELECT = {
  MODE: "TEXT"
}

const SHAPE_TEXTURE_DATA = {
  STEPS: 20,
  CELL_SIZE: 12,
  ANGLE: 45,
}

const TEXT_TEXTURE_DATA = {
  FONT_SIZE: 12,
  CELL_SIZE: 14,
}

const COLOR_DATA = {
  COLOR: "#FFFFFF",
  PICK_CHAR_COLOR_FROM_VIDEO: false, // todo: hook this up inside the shader
  PICK_BG_COLOR_FROM_VIDEO: false
}

let ASCII_TEXTURE_DATA = paintASCIITexture(window.innerWidth, window.innerHeight, TEXT_TEXTURE_DATA.CELL_SIZE, TEXT_TEXTURE_DATA.FONT_SIZE, COLOR_DATA.COLOR)
const ASCII_SHADER = createASCIIShader(ASCII_TEXTURE_DATA, COLOR_DATA)

const controlsGUI = new GUI();
const textureMode = controlsGUI.addFolder('TEXTURE MODE')
const textFolder = controlsGUI.addFolder('TEXT');
const shapeFolder = controlsGUI.addFolder('SHAPE')
const colorFolder = controlsGUI.addFolder('COLOR')

const refreshTextureAndShader = () => {
  const newTextureData = updateASCIITexture(TEXT_TEXTURE_DATA, SHAPE_TEXTURE_DATA, COLOR_DATA, TEXTURE_SELECT)
  updateShader(ASCII_SHADER, newTextureData, COLOR_DATA)
}

textFolder.add(TEXT_TEXTURE_DATA, 'FONT_SIZE', 1, 100, 1).onChange(value => {
  refreshTextureAndShader()
})
textFolder.add(TEXT_TEXTURE_DATA, 'CELL_SIZE', 1, 100, 1).onChange(value => {
  refreshTextureAndShader()
})

textureMode.add(TEXTURE_SELECT, 'MODE', ['TEXT', 'SHAPE']).onChange(value => {
  if (value === 'TEXT') {
    refreshTextureAndShader()
    textFolder.controllers.forEach(controller => controller.enable())
    shapeFolder.controllers.forEach(controller => controller.disable())
  }
  if (value === 'SHAPE') {
    refreshTextureAndShader()
    textFolder.controllers.forEach(controller => controller.disable())
    shapeFolder.controllers.forEach(controller => controller.enable())
  }
})

shapeFolder.add(SHAPE_TEXTURE_DATA, 'CELL_SIZE', 1, 100, 1).onChange(value => {
  refreshTextureAndShader()
})
shapeFolder.add(SHAPE_TEXTURE_DATA, 'STEPS', 1, 100, 1).onChange(value => {
  refreshTextureAndShader()
})
shapeFolder.add(SHAPE_TEXTURE_DATA, 'ANGLE', 0, 360, 1).onChange(value => {
  refreshTextureAndShader()
})

shapeFolder.controllers.forEach(controller => controller.disable())

const colorController = colorFolder.addColor(COLOR_DATA, 'COLOR').onChange(value => {
  refreshTextureAndShader()
})
colorFolder.add(COLOR_DATA, 'PICK_CHAR_COLOR_FROM_VIDEO').onChange(value => {
  COLOR_DATA.COLOR = '#FFFFFF'
  refreshTextureAndShader()
  if (value) {
    colorController.disable()
  } else {
    colorController.enable()
  }
})

colorFolder.add(COLOR_DATA, 'PICK_BG_COLOR_FROM_VIDEO').onChange(value => {
  COLOR_DATA.COLOR = '#FFFFFF'
  refreshTextureAndShader()
  if (value) {
    colorController.disable()
  } else {
    colorController.enable()
  }
})


const canvas = document.querySelector('#c');
const video = document.getElementById('video');
video.play();

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(100, window.innerWidth / window.innerHeight, 0.2, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({
  powerPreference: "high-performance",
  antialias: false,
  stencil: false,
  depth: false,
  canvas
});

const geometry = new THREE.PlaneGeometry(1, 1);
const texture = new THREE.VideoTexture(video);
texture.colorSpace = THREE.SRGBColorSpace;
texture.minFilter = THREE.LinearFilter;
texture.magFilter = THREE.LinearFilter;
const material = new THREE.MeshBasicMaterial({ map: texture });
const plane = new THREE.Mesh(geometry, material);
scene.add(plane);

// post-processing
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera))
const asciiPass = new ShaderPass(ASCII_SHADER, 'videoFrame');
composer.addPass(asciiPass);

function resizeVideoPlane(camera, plane, videoWidth, videoHeight) {
  const windowAspect = window.innerWidth / window.innerHeight;
  const videoAspect = videoWidth / videoHeight;

  const distance = Math.abs(camera.position.z - plane.position.z);
  const vFov = (camera.fov * Math.PI) / 180;
  const visibleHeight = 2 * Math.tan(vFov / 2) * distance;
  const visibleWidth = visibleHeight * windowAspect;

  let scaleX, scaleY;
  if (windowAspect < videoAspect) {
    scaleX = visibleWidth;
    scaleY = visibleWidth / videoAspect;
  } else {
    scaleX = visibleHeight * videoAspect;
    scaleY = visibleHeight;
  }

  plane.scale.set(scaleX, scaleY, 1);
}

function handleResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  renderer.setSize(width, height, false);
  composer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  if (video.videoWidth > 0) {
    resizeVideoPlane(camera, plane, video.videoWidth, video.videoHeight);
  }
}

window.addEventListener('resize', handleResize);
video.addEventListener('loadedmetadata', handleResize);

handleResize();

const stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);

renderer.setAnimationLoop(animate);



function animate() {
  stats.begin();

  composer.render()

  stats.end();
}