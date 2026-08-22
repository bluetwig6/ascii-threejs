import * as THREE from 'three';
import Stats from 'stats.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { GUI } from 'lil-gui'
import { paintASCIITexture } from './createASCIITexture';

const TEXTURE_DATA = {
  FONT_SIZE: 100,
  CELL_SIZE: 100
}

let ASCII_TEXTURE_DATA = paintASCIITexture(window.innerWidth, window.innerHeight, TEXTURE_DATA.CELL_SIZE, TEXTURE_DATA.FONT_SIZE)

const ASCII_SHADER = new THREE.ShaderMaterial({
  uniforms: {
    'videoFrame': { value: null },
    'asciiImage': { value: ASCII_TEXTURE_DATA.texture },
    'u_charCount': { value: ASCII_TEXTURE_DATA.count },
    'u_cellSize': { value: new THREE.Vector2(ASCII_TEXTURE_DATA.cellSize, ASCII_TEXTURE_DATA.cellSize) },
    'uResolution': { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
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
      float yPos = insideCellOffset.y;

      float spaceXPos = xPos/uResolution.x;
      float spaceYPos = yPos/uResolution.y;

      vec2 charUV = vec2(spaceXPos, spaceYPos); //position of the pixel in asciiimage to be painted in the output
      vec4 asciiCharacter = texture(asciiImage, charUV);

      gl_FragColor = vec4(pixelized.rgb * asciiCharacter.r, 1.0);
    }
  `
})

const cellGui = new GUI();
cellGui.add(TEXTURE_DATA, 'FONT_SIZE', 0, 100, 2).onChange(value => {
  ASCII_TEXTURE_DATA = paintASCIITexture(window.innerWidth, window.innerHeight, TEXTURE_DATA.CELL_SIZE, TEXTURE_DATA.FONT_SIZE)
})
cellGui.add(TEXTURE_DATA, 'CELL_SIZE', 0, 100, 2).onChange(value => {
  ASCII_TEXTURE_DATA = paintASCIITexture(window.innerWidth, window.innerHeight, TEXTURE_DATA.CELL_SIZE, TEXTURE_DATA.FONT_SIZE)
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