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
  ENABLED: false,
  WIDTH: 1
}

let TEXTURE_DATA = {
  STEPS: 20,
  CELL_SIZE: 10,
  ANGLE: 45,
  FONT_SIZE: 7
}

let COLOR_DATA = {
  CHAR_TRANSPARENCY: 0,
  BACKGROUND_TRANSPARENCY: 0,
  PICK_BG_COLOR_FROM_VIDEO: false,
  INVERT: false,
  CHAR_COLOR: "#5edd86",
  BG_COLOR: "#414866"
}

let VIDEO_FIT = {
  COVER: false
}

const returnTexureArgs = () => {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    drawOutline: OUTLINE_DATA.ENABLED,
    outlineWidth: OUTLINE_DATA.WIDTH,
    ...(TEXTURE_SELECT.MODE === 'TEXT' ? ({
      fontSize: TEXTURE_DATA.FONT_SIZE,
      cellSize: TEXTURE_DATA.CELL_SIZE
    }): ({
      steps: TEXTURE_DATA.STEPS,
      angle: TEXTURE_DATA.ANGLE,
      cellSize: TEXTURE_DATA.CELL_SIZE,
    })),
    charColor: COLOR_DATA.CHAR_COLOR,
    bgColor: COLOR_DATA.BG_COLOR,
    mode: TEXTURE_SELECT.MODE
  }
}

// ASCII TEXTURE AND SHADER STUFF
let ASCII_TEXTURE_DATA = paintASCIITexture({...returnTexureArgs()})
const ASCII_SHADER = createASCIIShader(ASCII_TEXTURE_DATA, COLOR_DATA, COLOR_DATA.INVERT)
const refreshTextureAndShader = () => {
  console.log(TEXTURE_SELECT.MODE)
  const newTextureData = updateASCIITexture({...returnTexureArgs()})
  updateShader(ASCII_SHADER, newTextureData, COLOR_DATA, COLOR_DATA.INVERT)
}


// LOAD font for HTML canvas
 const font = new FontFace("Inter", 'url("./fonts/Inter-VariableFont_opsz,wght.ttf")', {
    style: "normal",
    weight: "400",
    stretch: "condensed",
  });
font.load().then((font) => {
    document.fonts.add(font)
    const newTextureData = updateASCIITexture({...returnTexureArgs()})
    updateShader(ASCII_SHADER, newTextureData, COLOR_DATA, COLOR_DATA.INVERT)
  });

// CONTROLS UI
const controlsGUI = new GUI({width: 500});
const textureMode = controlsGUI.addFolder('TEXTURE MODE')
const textureDataFolder = controlsGUI.addFolder('TEXTURE_DATA');
const colorFolder = controlsGUI.addFolder('COLOR')
const outlineFolder = controlsGUI.addFolder('OUTLINE')
const videoFitFolder = controlsGUI.addFolder('VIDEO FIT')


const fontSizeController = textureDataFolder.add(TEXTURE_DATA, 'FONT_SIZE', 1, 100, 1).onChange(value => {
  refreshTextureAndShader()
})

const cellSizeController = textureDataFolder.add(TEXTURE_DATA, 'CELL_SIZE', 1, 100, 1).onChange(value => {
  refreshTextureAndShader()
})

const stepsController = textureDataFolder.add(TEXTURE_DATA, 'STEPS', 1, 100, 1).onChange(value => {
  refreshTextureAndShader()
})

const angleController = textureDataFolder.add(TEXTURE_DATA, 'ANGLE', 0, 360, 1).onChange(value => {
  refreshTextureAndShader()
})

const modeControllerMap = {
  "SHAPE":[stepsController, angleController],
  "TEXT": [fontSizeController]
}

const disableControllersOnModeSwitch = (mode = null) => {
  if(mode) {
    Object.keys(modeControllerMap).forEach(key => {
      if(key === mode) {
        modeControllerMap[key].forEach(controller => controller.enable())
      } else {
        modeControllerMap[key].forEach(controller => controller.disable())
      }
    })
  }
}

const invertColors = () => {
  const temp = COLOR_DATA.CHAR_COLOR
  COLOR_DATA.CHAR_COLOR = COLOR_DATA.BG_COLOR
  COLOR_DATA.BG_COLOR = temp
}

textureMode.add(TEXTURE_SELECT, 'MODE', ['TEXT', 'SHAPE']).onChange(value => {
  refreshTextureAndShader()
  disableControllersOnModeSwitch(value)
})

disableControllersOnModeSwitch(TEXTURE_SELECT.MODE)

colorFolder.addColor(COLOR_DATA, 'CHAR_COLOR').onChange(value => {
  refreshTextureAndShader()
}).listen()

colorFolder.addColor(COLOR_DATA, 'BG_COLOR').onChange(value => {
  refreshTextureAndShader()
}).listen()

colorFolder.add(COLOR_DATA, 'CHAR_TRANSPARENCY', 0,100,1).onChange(value => {
  refreshTextureAndShader()
})

colorFolder.add(COLOR_DATA, 'BACKGROUND_TRANSPARENCY', 0,100,1).onChange(value => {
  refreshTextureAndShader()
})

colorFolder.add(COLOR_DATA, 'INVERT').onChange(value => {
  invertColors()
  refreshTextureAndShader()
})

outlineFolder.add(OUTLINE_DATA, 'ENABLED').onChange(value => {
  refreshTextureAndShader()
})

outlineFolder.add(OUTLINE_DATA, 'WIDTH', 1,20,0.5).onChange(value => {
  refreshTextureAndShader()
})

videoFitFolder.add(VIDEO_FIT, 'COVER').onChange(value => {
  handleResize()
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
  resizeScene(renderer, composer, camera, plane, video, VIDEO_FIT.COVER)
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