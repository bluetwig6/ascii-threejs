import * as THREE from 'three';
const createASCIIShader = (ASCII_TEXTURE_DATA, COLOR_DATA, INVERT_DATA) => {
    return new THREE.ShaderMaterial({
        uniforms: {
            'videoFrame': { value: null },
            'asciiImage': { value: ASCII_TEXTURE_DATA.texture },
            'u_charCount': { value: ASCII_TEXTURE_DATA.count },
            'u_cellSize': { value: new THREE.Vector2(ASCII_TEXTURE_DATA.cellSize, ASCII_TEXTURE_DATA.cellSize) },
            'uResolution': { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
            'u_use_video_color_for_foreground': { value: COLOR_DATA.PICK_CHAR_COLOR_FROM_VIDEO },
            'u_PICK_BG_COLOR_FROM_VIDEO': { value: COLOR_DATA.PICK_BG_COLOR_FROM_VIDEO },
            'u_invert': { value: INVERT_DATA.ENABLED}
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
    uniform bool u_PICK_BG_COLOR_FROM_VIDEO;
    uniform bool u_invert;

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
      float characterIndex;
      
      
      if(u_invert) {
        characterIndex = floor((u_charCount - 1.0) * (1.0- greyscaled));
      } else {
        characterIndex = floor((u_charCount - 1.0) * greyscaled);
      }

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
        if(u_invert) {
          if(asciiCharacter.r > 0.0) {
            gl_FragColor = asciiCharacter;
          } else {
            gl_FragColor = pixelized;
          }
        }
      } else if(u_PICK_BG_COLOR_FROM_VIDEO) {
        if(asciiCharacter.r > 0.0) {
          gl_FragColor = asciiCharacter * pixelized;
        } else {
          gl_FragColor = vec4(pixelized.r*0.5,pixelized.g*0.5,pixelized.b*0.5,pixelized.a);
        }
      } 
      else {
        gl_FragColor = asciiCharacter;
      }
    }
  `
    })
}

const updateShader = (ASCII_SHADER, TEXTURE_DATA, COLOR_DATA, INVERT_DATA ) => {
    if (ASCII_SHADER.uniforms.asciiImage.value) {
        ASCII_SHADER.uniforms.asciiImage.value.dispose();
    }
    ASCII_SHADER.uniforms.asciiImage.value = TEXTURE_DATA.texture;
    ASCII_SHADER.uniforms.u_cellSize.value.set(
        TEXTURE_DATA.cellSize,
        TEXTURE_DATA.cellSize
    );
    ASCII_SHADER.uniforms.uResolution.value = new THREE.Vector2(window.innerWidth, window.innerHeight)
    ASCII_SHADER.uniforms.u_charCount.value = TEXTURE_DATA.count;
    ASCII_SHADER.uniforms.u_use_video_color_for_foreground.value = COLOR_DATA.PICK_CHAR_COLOR_FROM_VIDEO
    ASCII_SHADER.uniforms.u_PICK_BG_COLOR_FROM_VIDEO.value = COLOR_DATA.PICK_BG_COLOR_FROM_VIDEO;
    ASCII_SHADER.uniforms.u_invert.value = INVERT_DATA.ENABLED;
}

export { createASCIIShader, updateShader }