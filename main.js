import * as THREE from 'three';
import Stats from 'stats.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { paintASCIITexture, updateASCIITexture } from './createASCIITexture';
import { createASCIIShader, updateShader } from './shader';
import CONSTANTS from './constants'
import GUI from 'lil-gui';
import { resizeScene, resizeVideoPlane } from './services';

let TEXTURE_SELECT = {
  MODE: "TEXT"
}

let OUTLINE_DATA = {
  ENABLED: true,
  WIDTH: 1
}

let SHAPE_TEXTURE_DATA = {
  STEPS: 20,
  CELL_SIZE: 22,
  ANGLE: 45,
}

let TEXT_TEXTURE_DATA = {
  FONT_SIZE: 8,
  CELL_SIZE: 21,
}

let COLOR_DATA = {
  COLOR: "#FFFFFF",
  PICK_CHAR_COLOR_FROM_VIDEO: true,
  PICK_BG_COLOR_FROM_VIDEO: false
}

let INVERT_DATA = {
  ENABLED: false
}

// ASCII TEXTURE AND SHADER STUFF
let ASCII_TEXTURE_DATA = paintASCIITexture(window.innerWidth, window.innerHeight, TEXT_TEXTURE_DATA.CELL_SIZE, TEXT_TEXTURE_DATA.FONT_SIZE, COLOR_DATA.COLOR, OUTLINE_DATA.ENABLED, OUTLINE_DATA.WIDTH, INVERT_DATA.ENABLED)
const ASCII_SHADER = createASCIIShader(ASCII_TEXTURE_DATA, COLOR_DATA, INVERT_DATA)
const refreshTextureAndShader = () => {
  const newTextureData = updateASCIITexture(TEXT_TEXTURE_DATA, SHAPE_TEXTURE_DATA, COLOR_DATA, TEXTURE_SELECT, OUTLINE_DATA.ENABLED, OUTLINE_DATA.WIDTH, INVERT_DATA.ENABLED)
  updateShader(ASCII_SHADER, newTextureData, COLOR_DATA, INVERT_DATA)
}


// LOAD font for HTML canvas
 const font = new FontFace("Inter", 'url("./fonts/Inter-VariableFont_opsz,wght.ttf")', {
    style: "normal",
    weight: "400",
    stretch: "condensed",
  });
  font.load().then((font) => {
    console.log(font)
    document.fonts.add(font)
    const newTextureData = updateASCIITexture(TEXT_TEXTURE_DATA, SHAPE_TEXTURE_DATA, COLOR_DATA, TEXTURE_SELECT, OUTLINE_DATA.ENABLED, OUTLINE_DATA.WIDTH, INVERT_DATA.ENABLED)
    updateShader(ASCII_SHADER, newTextureData, COLOR_DATA, INVERT_DATA)
  });

// CONTROLS UI
const controlsGUI = new GUI({width: 500});
const textureMode = controlsGUI.addFolder('TEXTURE MODE')
const textFolder = controlsGUI.addFolder('TEXT');
const shapeFolder = controlsGUI.addFolder('SHAPE')
const colorFolder = controlsGUI.addFolder('COLOR')
const outlineFolder = controlsGUI.addFolder('OUTLINE')
const invertFolder = controlsGUI.addFolder('INVERT')

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
  if(INVERT_DATA.ENABLED) {
    COLOR_DATA.COLOR = '#000'
  } else {
    COLOR_DATA.COLOR = '#FFFFFF'
  }
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

outlineFolder.add(OUTLINE_DATA, 'ENABLED').onChange(value => {
  refreshTextureAndShader()
})

outlineFolder.add(OUTLINE_DATA, 'WIDTH', 1,20,0.5).onChange(value => {
  refreshTextureAndShader()
})

invertFolder.add(INVERT_DATA, 'ENABLED').onChange(value => {
  if(value) {
    COLOR_DATA.COLOR = '#000'
  } else {
    COLOR_DATA.COLOR = '#FFF'
  }
  refreshTextureAndShader()
})

const reset_parameters = () => {
  controlsGUI.reset()
  refreshTextureAndShader()
}

const video = document.getElementById('video');

function setupVideo(url = "./video.mp4") {
  video.src = url
  // video.play();
  return video;
}

const canvas = document.querySelector('#c');
setupVideo()

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

const createVideoTexture = (video) => {
  let texture = new THREE.VideoTexture(video);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture
}

const videoTexture = createVideoTexture(video)
const material = new THREE.MeshBasicMaterial({ map: videoTexture });
const plane = new THREE.Mesh(geometry, material);
scene.add(plane);

// post-processing
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera))
const asciiPass = new ShaderPass(ASCII_SHADER, 'videoFrame');
composer.addPass(asciiPass);

const handleResize = () => {
  resizeScene(renderer, composer, camera, plane, video)
  refreshTextureAndShader()
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

const fileInput = document.querySelector("#fileInput");
const fileInputLabel = document.querySelector("#fileInputLabel")
const filePreview = document.querySelector('#videoControls #preview')
const pauseButton = document.querySelector("#pause-button");
const hideButton = document.querySelector("#hide-video-controls")
const showButton = document.querySelector('#show-video-controls')

const videoControls = document.querySelector('#videoControls')
hideButton.addEventListener('click', () => {
  videoControls.classList.add('hide')
  showButton.classList.remove('hide')
})

showButton.addEventListener('click', () => {
  videoControls.classList.remove('hide')
  showButton.classList.add('hide')
})


pauseButton.addEventListener('click', () => {
  if (video.paused) {
    pauseButton.innerHTML = 'PAUSE'
    renderer.setAnimationLoop(animate)
    video.play()
  } else {
    pauseButton.innerHTML = 'RESUME'
    renderer.setAnimationLoop(null)
    video.pause()
  }
})

function returnFileSize(number) {
  if (number < 1e3) {
    return `${number} bytes`;
  } else if (number >= 1e3 && number < 1e6) {
    return `${(number / 1e3).toFixed(1)} KB`;
  }
  return `${(number / 1e6).toFixed(1)} MB`;
}

fileInput.addEventListener("change", () => {
  filePreview.replaceChildren()
  if (fileInput.files.length === 1) {
    const file = fileInput.files[0];
    const reader = new FileReader();
    const para = document.createElement("p");
    para.textContent = `${file.name.toUpperCase()}, file size ${returnFileSize(
      file.size,
    )}.`;
    filePreview.append(para)
    reader.addEventListener(
      "load",
      () => {
        // convert image file to base64 string
        setupVideo(reader.result);
        reset_parameters()
      },
      false
    );

    if (file) {
      reader.readAsDataURL(file);
    }
  }
});