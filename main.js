import * as THREE from 'three';
import Stats from 'stats.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { GUI } from 'lil-gui'
import { paintASCIILineTexture, paintASCIITexture } from './createASCIITexture';

const TEXTURE_SELECT = {
  MODE: "TEXT"
} 

const SHAPE_TEXTURE_DATA = {
  STEPS: 20,
  CELL_SIZE: 12,
  ANGLE: 45,
}

const COLOR_DATA = {
  COLOR: "#FFFFFF",
  PICK_CHAR_COLOR_FROM_VIDEO: false, // todo: hook this up inside the shader
}

const TEXT_TEXTURE_DATA = {
  FONT_SIZE: 12,
  CELL_SIZE: 14,
}

let ASCII_TEXTURE_DATA = paintASCIITexture(window.innerWidth, window.innerHeight, TEXT_TEXTURE_DATA.CELL_SIZE, TEXT_TEXTURE_DATA.FONT_SIZE, COLOR_DATA.COLOR)

const ASCII_SHADER = new THREE.ShaderMaterial({
  uniforms: {
    'videoFrame': { value: null },
    'asciiImage': { value: ASCII_TEXTURE_DATA.texture },
    'u_charCount': { value: ASCII_TEXTURE_DATA.count },
    'u_cellSize': { value: new THREE.Vector2(ASCII_TEXTURE_DATA.cellSize, ASCII_TEXTURE_DATA.cellSize) },
    'uResolution': { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    'u_use_video_color_for_foreground' : {value: COLOR_DATA.PICK_CHAR_COLOR_FROM_VIDEO}
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D videoFrame; // original image
    uniform sampler2D asciiImage; // ascii image
    uniform float u_charCount;
    uniform vec2 u_cellSize; // cellsize eg: (8,8)
    uniform vec2 uResolution; // resolution eg: (1024,1024)
    uniform bool u_use_video_color_for_foreground;
    vec3 greyscale(vec3 color, float strength) {
        float g = dot(color, vec3(0.299, 0.587, 0.114));
        return mix(color, vec3(g), strength);
    }

    vec3 greyscale(vec3 color) {
        return greyscale(color, 1.0);
    }

    void main() { 
      vec2 uv = gl_FragCoord.xy; // current pixel in x,y eg 1000,1000

      vec2 cellCenter = (floor(uv/u_cellSize) + 0.5 ) * u_cellSize;
      vec4 pixelized = texture(videoFrame, cellCenter/uResolution); // this has the data of the center of current pixel's cell's

      float greyscaled = greyscale(pixelized.rgb).r; // give a number between 0 & 1  
      float characterIndex = floor((u_charCount - 1.0) * greyscaled);

      vec2 insideCellOffset = mod(uv, u_cellSize);

      // in px
      float xPos = insideCellOffset.x  + (characterIndex * u_cellSize.x);
      float yPos = (uResolution.y - u_cellSize.y) + insideCellOffset.y;;

      float spaceXPos = xPos/uResolution.x;
      float spaceYPos = yPos/uResolution.y;

      vec2 charUV = vec2(spaceXPos, spaceYPos); //position of the pixel in asciiimage to be painted in the output
      vec4 asciiCharacter = texture(asciiImage, charUV);
      if(u_use_video_color_for_foreground) {
        gl_FragColor = asciiCharacter * pixelized;
      } else {
        gl_FragColor = asciiCharacter;
      }
    }
  `
})

const updateASCIITexture = () => {
  if (ASCII_SHADER.uniforms.asciiImage.value) {
    ASCII_SHADER.uniforms.asciiImage.value.dispose();
  }

  if(TEXTURE_SELECT.MODE === "TEXT") {
    ASCII_TEXTURE_DATA = paintASCIITexture(window.innerWidth, window.innerHeight, TEXT_TEXTURE_DATA.CELL_SIZE, TEXT_TEXTURE_DATA.FONT_SIZE, COLOR_DATA.COLOR)
  } else if (TEXTURE_SELECT.MODE === 'SHAPE') {
    ASCII_TEXTURE_DATA = paintASCIILineTexture(window.innerWidth, window.innerHeight, SHAPE_TEXTURE_DATA.CELL_SIZE, SHAPE_TEXTURE_DATA.STEPS, SHAPE_TEXTURE_DATA.ANGLE, COLOR_DATA.COLOR)
  }


  ASCII_SHADER.uniforms.asciiImage.value = ASCII_TEXTURE_DATA.texture;
  ASCII_SHADER.uniforms.u_cellSize.value.set(
    ASCII_TEXTURE_DATA.cellSize,
    ASCII_TEXTURE_DATA.cellSize
  );
  ASCII_SHADER.uniforms.u_charCount.value = ASCII_TEXTURE_DATA.count;
  ASCII_SHADER.uniforms.u_use_video_color_for_foreground.value = COLOR_DATA.PICK_CHAR_COLOR_FROM_VIDEO
}

const controlsGUI = new GUI();
const textureMode = controlsGUI.addFolder('TEXTURE MODE')
const textFolder = controlsGUI.addFolder( 'TEXT' );
const shapeFolder = controlsGUI.addFolder('SHAPE')
const colorFolder = controlsGUI.addFolder('COLOR')

textFolder.add(TEXT_TEXTURE_DATA, 'FONT_SIZE', 1, 100, 1).onChange(value => {
  updateASCIITexture()
})
textFolder.add(TEXT_TEXTURE_DATA, 'CELL_SIZE', 1, 100, 1).onChange(value => {
  updateASCIITexture()
})


textureMode.add(TEXTURE_SELECT, 'MODE', ['TEXT', 'SHAPE']).onChange(value => {
  if(value === 'TEXT') {
    updateASCIITexture()
    textFolder.controllers.forEach(controller => controller.enable())
    shapeFolder.controllers.forEach(controller => controller.disable())
  }
  if(value === 'SHAPE') {
    updateASCIITexture()
    textFolder.controllers.forEach(controller => controller.disable())
    shapeFolder.controllers.forEach(controller => controller.enable())
  }
})

shapeFolder.add(SHAPE_TEXTURE_DATA, 'CELL_SIZE', 1, 100, 1).onChange(value => {
  updateASCIITexture()
})
shapeFolder.add(SHAPE_TEXTURE_DATA, 'STEPS', 1, 100, 1).onChange(value => {
  updateASCIITexture()
})
shapeFolder.add(SHAPE_TEXTURE_DATA, 'ANGLE', 0,360,1).onChange(value => {
  updateASCIITexture()
})

shapeFolder.controllers.forEach(controller => controller.disable())

const colorController = colorFolder.addColor(COLOR_DATA, 'COLOR').onChange(value => {
  updateASCIITexture()
})
colorFolder.add(COLOR_DATA, 'PICK_CHAR_COLOR_FROM_VIDEO').onChange(value => {
    COLOR_DATA.COLOR = '#FFFFFF'
    updateASCIITexture()
    if(value) {
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