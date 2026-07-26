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

  vec2 cellCenter = (floor(uv/u_cellSize) + 0.5 ) * u_cellSize
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

  outColor = vec4(pixelized.rgb * asciiCharacter.r, 1.0);
}