// TODO: move to gpgpu module.

// Following shaders implement Histopyramid operations as described in 'High‐speed marching cubes using histopyramids' by Dyken C, Ziegler G, Theobalt C and Seidel H
// Link to the paper: http://olmozavala.com/Custom/OpenGL/Tutorials/OpenGL4_Examples/MarchingCubes_Dyken/Dyken_et_al-2008-Computer_Graphics_Forum.pdf

export const HISTOPYRAMID_BUILD_VS_UTILS = `\
// Get current pixel indices for a given size
vec2 histoPyramid_getPixelIndices(vec2 size) {
  vec2 pixelOffset = transform_getPixelSizeHalf(size);
  vec2 pixelIndices = transform_getPixelIndices(size, pixelOffset);
  return pixelIndices;
}

// returns the top left texture coordiante corresponding to 2X2 block in higher level texture.
// size: lower level texture size
// scale: usually (2, 2)
// offset: offset with-in 2X2 block of higher level texture
vec2 histoPyramid_getTexCoord(vec2 size, vec2 scale, vec2 offset) {
  // use actual (scaled) texture size to calcualte offset (multiplied by scale)
  vec2 scaledSize = size * scale;

  // use minified texture size to find corresponding pixel index in out texture
  vec2 pixelIndices = histoPyramid_getPixelIndices(size);

  // now scale the indices to point to correct 2X2 block
  pixelIndices = pixelIndices * scale;

  // generate tex coordinate using actual size
  vec2 texCoord = pixelIndices / scaledSize;
  vec2 inPixelOffset = transform_getPixelSizeHalf(scaledSize);

  return texCoord + (offset / scaledSize) + inPixelOffset;
}

// returns pixel value from higher level texture based on scale and offset
// texSampler: higher level texture sampler
// size: lower level texture size
// scale: usually (2, 2)
// offset: offset with-in 2X2 block of higher level texture
vec4 histoPyramid_getInput(sampler2D texSampler, vec2 size, vec2 scale, vec2 offset) {
  vec2 texCoord = histoPyramid_getTexCoord(size, scale, offset);
  vec4 textureColor = texture2D(texSampler, texCoord);
  return textureColor;
}
`;

// Vertex shader to build histopyramid
export const HISTOPYRAMID_BUILD_VS = `\
attribute vec4 inTexture;
varying vec4 outTexture;

void main()
{
  vec2 size = transform_uSize_outTexture;
  vec2 scale = vec2(2., 2.);
  vec4 pixel = histoPyramid_getInput(transform_uSampler_inTexture, size, scale, vec2(0, 0));
  vec4 rightPixel = histoPyramid_getInput(transform_uSampler_inTexture, size, scale, vec2(1, 0));
  vec4 bottomPixel = histoPyramid_getInput(transform_uSampler_inTexture, size, scale, vec2(0, 1));
  vec4 rightBottomPixel = histoPyramid_getInput(transform_uSampler_inTexture, size, scale, vec2(1, 1));
  // outTexture = pixel + rightPixel + bottomPixel + rightBottomPixel;
  outTexture = vec4(
    pixel.r + pixel.g + pixel.b + pixel.a,
    rightPixel.r + rightPixel.g + rightPixel.b + rightPixel.a,
    bottomPixel.r + bottomPixel.g + bottomPixel.b + bottomPixel.a,
    rightBottomPixel.r + rightBottomPixel.g + rightBottomPixel.b + rightBottomPixel.a
  );
}
`;

// Vertex shader to build histopyramid
export const HISTOPYRAMID_BASE_BUILD_VS = `\
attribute vec4 inTexture;
varying vec4 outTexture;
uniform int channel;
uniform vec4 padingPixelValue;

void main()
{
  vec2 size = transform_uSize_outTexture;
  // vec2 scale = vec2(2., 2.);
  vec2 scale = transform_uSize_inTexture / transform_uSize_outTexture;

  // Verify if reference to a input texture pixel is out of bounds, if so treat the pixel as (0, 0)
  vec2 pixelIndices = histoPyramid_getPixelIndices(size);
  // now scale the indices padded size to point to correct 2X2 block
  pixelIndices = pixelIndices * vec2(2, 2);

  vec2 baseLevelSize = transform_uSize_inTexture;

  // For all pixels outside of original texture size, return paddingPixelValue
  bool xInside = pixelIndices.x < baseLevelSize.x;
  bool yInside = pixelIndices.y < baseLevelSize.y;
  bool xPlusOneInside = pixelIndices.x + 1. < baseLevelSize.x;
  bool yPlusOneInside = pixelIndices.y + 1. < baseLevelSize.y;

  vec4 pixel = (xInside && yInside)
    ? histoPyramid_getInput(transform_uSampler_inTexture, size, scale, vec2(0, 0))
    : padingPixelValue;

  vec4 rightPixel = (xPlusOneInside && yInside)
    ? histoPyramid_getInput(transform_uSampler_inTexture, size, scale, vec2(1, 0))
    : padingPixelValue;

  vec4 topPixel = (xInside && yPlusOneInside)
    ? histoPyramid_getInput(transform_uSampler_inTexture, size, scale, vec2(0, 1))
    : padingPixelValue;

  vec4 rightTopPixel = (xPlusOneInside && yPlusOneInside)
    ? histoPyramid_getInput(transform_uSampler_inTexture, size, scale, vec2(1, 1))
    : padingPixelValue;

  if (channel == 0) {
    outTexture = vec4(pixel.r, rightPixel.r, topPixel.r, rightTopPixel.r);
  }
  if (channel == 1) {
    outTexture = vec4(pixel.g, rightPixel.g, topPixel.g, rightTopPixel.g);
  }
  if (channel == 2) {
    outTexture = vec4(pixel.b, rightPixel.b, topPixel.b, rightTopPixel.b);
  }
  if (channel == 3) {
    outTexture = vec4(pixel.a, rightPixel.a, topPixel.a, rightTopPixel.a);
  }
}
`;

export const HISTOPYRAMID_TRAVERSAL_UTILS = `\
// Check 2X2 texture block to find relative index the given key index falls into
// 2X2 block is represented by a single RGBA weight
int histopyramid_traversal_findRangeIndex(float currentKey, vec4 weights, out float lowerBound) {
  lowerBound = 0.;
  float higherBound = 0.;
  int relativeIndex = 0;
  for (int i = 0; i < 4; i++) {
    higherBound = lowerBound + weights[i];
    relativeIndex = i;
    if (currentKey >= lowerBound && currentKey < higherBound) {
      break;
    }
    lowerBound = higherBound;
  }
  return relativeIndex;
}

// Maps index in 2X2 block to texture coordiante
// Assumes the traversal order of lower-left -> lower->right -> upper-left -> upper->right
vec2 histopyramid_traversal_mapIndexToCoord(int index) {
  // relativeIndex ->  relativeCoordiante
  // 0 -> (0, 0)
  // 1 -> (1, 0)
  // 2 -> (0, 1)
  // 3 -> (1, 1)
  float relativeX = mod(float(index), 2.);
  float relativeY = (index > 1) ? 1. : 0.;
  return vec2(relativeX, relativeY);
}

// Reads weight value from flat histopyramid
vec4 histopyramid_traversal_getWeight(sampler2D flatPyramid, vec2 size, int level, int numLevels, vec2 offset) {
  // horizontal offset in flat pyramid for current level
  float xOffset = pow(2., float(numLevels)) - pow(2., float(numLevels - level));
  vec2 lowerLeft = vec2(xOffset, 0.);
  vec2 pixelIndices = lowerLeft + offset;

  vec2 pixelSizeHalf = transform_getPixelSizeHalf(size);
  vec2 coord = pixelIndices / size + pixelSizeHalf;

  return texture2D(flatPyramid, coord);
}
`;

export const HISTOPYRAMID_TRAVERSAL_VS = `\
attribute float keyIndex;
attribute vec4 flatPyramidTexture;
varying vec4 locationAndIndex;
const int MAX_LEVELS = 12; // assuming max texture size of 4K

uniform int numLevels;

void main()
{
  vec2 p = vec2(0., 0.);
  float currentKey = keyIndex;
  // for(int level = numLevels - 1; level <= 0; level--) {
  for(int i = 1; i <= MAX_LEVELS; i++) {
    int level = numLevels - i;
    // #1. Get the current pixel values based on current level and current p
    vec4 weights = histopyramid_traversal_getWeight(transform_uSampler_flatPyramidTexture, transform_uSize_flatPyramidTexture, level, numLevels, p);

    // #2. Check the all weights in current 2X2 (4 values in RGBA channels) and determine the relative coordinate
    float lowerBound = 0.;
    int relativeIndex = histopyramid_traversal_findRangeIndex(currentKey, weights, lowerBound);
    vec2 relativeCoord = histopyramid_traversal_mapIndexToCoord(relativeIndex);

    //#3. Update P and key-index
    p = 2.0 * p + relativeCoord;
    currentKey -= lowerBound;
    if (level == 0) { break; } // Work around for const expression restriction on for loops
  }
  locationAndIndex = vec4(p, currentKey, keyIndex);
}
`;
