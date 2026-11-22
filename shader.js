import * as THREE from 'three';

const hexToRGBA = (hex) => {
  const cleanHex = hex.split('#')[1]
  return( {
    r: parseInt(cleanHex.slice(0,2), 16)/256,
    g: parseInt(cleanHex.slice(2,4), 16)/256,
    b: parseInt(cleanHex.slice(4,6), 16)/256,
    a: 1.0
  })
}

const createASCIIShader = (ASCII_TEXTURE_DATA, COLOR_DATA) => {
    const rgbaCOLOR = hexToRGBA(COLOR_DATA.CHAR_COLOR)
    return new THREE.ShaderMaterial({
        uniforms: {
            'videoFrame': { value: null },
            'asciiImage': { value: ASCII_TEXTURE_DATA.texture },
            'u_charCount': { value: ASCII_TEXTURE_DATA.count },
            'u_cellSize': { value: new THREE.Vector2(ASCII_TEXTURE_DATA.cellSize, ASCII_TEXTURE_DATA.cellSize) },
            'uResolution': { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
            'u_invert': { value: COLOR_DATA.INVERT},
            'u_foreground_color': {value: new THREE.Vector4(rgbaCOLOR.r, rgbaCOLOR.g, rgbaCOLOR.b, rgbaCOLOR.a )},
            'u_char_transparency': {value: COLOR_DATA.CHAR_TRANSPARENCY},
            'u_background_transparency': {value: COLOR_DATA.BACKGROUND_TRANSPARENCY},
            'u_brightness': {value: COLOR_DATA.BRIGHTNESS/100}
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
    uniform bool u_invert;
    uniform vec4 u_foreground_color;
    uniform float u_char_transparency;
    uniform float u_background_transparency;
    uniform float u_brightness;

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
      vec4 pixelized = min(max(texture(videoFrame, cellCenter/uResolution) + vec4(greyscale(vec3(u_brightness)), 0.0), 0.0),1.0); // this has the data of the center of current pixel's cell's
      float greyscaled = greyscale(pixelized.rgb, 1.0).r; // give a number between 0 & 1  
      float characterIndex;
      float charsPerRow = floor(uResolution.x/u_cellSize.x);

      if(u_invert) {
        characterIndex = u_charCount - 1.0 - floor((u_charCount - 1.0) * greyscaled);
      } else {
        characterIndex = floor((u_charCount - 1.0) * greyscaled);
      }

      float charPosX = mod(characterIndex , charsPerRow) * u_cellSize.x;
      float charPosY = uResolution.y - u_cellSize.y * (1.0 + floor(characterIndex/charsPerRow));
      vec2 insideCellOffset = mod(uv, u_cellSize);

      // in px
      float xPos = insideCellOffset.x  + charPosX;
      float yPos = charPosY + insideCellOffset.y;

      float spaceXPos = xPos/uResolution.x;
      float spaceYPos = yPos/uResolution.y;

      vec2 charUV = vec2(spaceXPos, spaceYPos); //position of the pixel in asciiimage to be painted in the output
      vec4 asciiCharacter = texture(asciiImage, charUV);

      // for character trasparency
      if(all(lessThan(abs(asciiCharacter - u_foreground_color), vec4(0.4)))) {
        gl_FragColor = mix(asciiCharacter,pixelized,u_char_transparency/100.0);
      } else {
        gl_FragColor = mix(asciiCharacter,pixelized, u_background_transparency/100.0);
      }
    }
  `
    })
}

const updateShader = (ASCII_SHADER, TEXTURE_DATA, COLOR_DATA ) => {
    const rgbaCOLOR = hexToRGBA(COLOR_DATA.CHAR_COLOR)
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
    ASCII_SHADER.uniforms.u_invert.value = COLOR_DATA.INVERT;
    ASCII_SHADER.uniforms.u_char_transparency.value = COLOR_DATA.CHAR_TRANSPARENCY
    ASCII_SHADER.uniforms.u_background_transparency.value = COLOR_DATA.BACKGROUND_TRANSPARENCY
    ASCII_SHADER.uniforms.u_foreground_color.value = new THREE.Vector4(rgbaCOLOR.r, rgbaCOLOR.g, rgbaCOLOR.b, rgbaCOLOR.a )
    ASCII_SHADER.uniforms.u_brightness.value = COLOR_DATA.BRIGHTNESS/100

}

export { createASCIIShader, updateShader }