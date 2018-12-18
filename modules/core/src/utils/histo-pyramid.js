// TODO: move to gpgpu module.

import Transform from '../core/transform';
import Buffer from '../webgl/buffer';
import {cloneTextureFrom} from '../webgl-utils/texture-utils';
import {assert} from '../utils';
import GL from '../constants';

// Following methods implement Histopyramid operations as described in 'High‐speed marching cubes using histopyramids' by Dyken C, Ziegler G, Theobalt C and Seidel H
// Link to the paper: http://olmozavala.com/Custom/OpenGL/Tutorials/OpenGL4_Examples/MarchingCubes_Dyken/Dyken_et_al-2008-Computer_Graphics_Forum.pdf

export const HISTOPYRAMID_BUILD_VS_UTILS = `\
// Get current vertex pixel indices for a given size
vec2 histoPyramid_getPixelIndices(vec2 size) {
  vec2 pixelOffset = transform_getPixelSizeHalf(size);
  vec2 pixelIndices = transform_getPixelIndices(size, pixelOffset);
  return pixelIndices;
}

// returns the top left texture coordiante corresponding to 4X4 block in higher level texture.
// size: lower level texture size
// scale: usually (2, 2)
// offset: offset with-in 4X4 block of higher level texture
vec2 histoPyramid_getTexCoord(vec2 size, vec2 scale, vec2 offset) {
  // use actual (scaled) texture size to calcualte offset (multiplied by scale)
  vec2 scaledSize = size * scale;

  // use minified texture size to find corresponding pixel index in out texture

  // vec2 pixelOffset = transform_getPixelSizeHalf(size);
  // // use the minified texture size to generate indices
  // vec2 pixelIndices = transform_getPixelIndices(size, pixelOffset);
  vec2 pixelIndices = histoPyramid_getPixelIndices(size);

  // now scale the indices to point to correct 4X4 block
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
// offset: offset with-in 4X4 block of higher level texture
vec4 histoPyramid_getInput(sampler2D texSampler, vec2 size, vec2 scale, vec2 offset) {
  vec2 texCoord = histoPyramid_getTexCoord(size, scale, offset);
  // to handle the padding, when texture is padded to nearest power of two some indices may be outside of input texture
  // if (texCoord.x > 1. || texCoord.y > 1.) {
  //   return vec4(0., 0., 0., 0);
  // }
  vec4 textureColor = texture2D(texSampler, texCoord);
  return textureColor;
}
`;

// Vertex shader to build histopyramid
const HISTOPYRAMID_BUILD_VS = `\
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
const HISTOPYRAMID_BASE_BUILD_VS = `\
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
  // vec2 pixelOffset = transform_getPixelSizeHalf(size);
  // vec2 pixelIndices = transform_getPixelIndices(size, pixelOffset);
  vec2 pixelIndices = histoPyramid_getPixelIndices(size);
  // now scale the indices padded size to point to correct 4X4 block
  pixelIndices = pixelIndices * vec2(2, 2);

  vec2 baseLevelSize = transform_uSize_inTexture;

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

// Maps index in 4X4 block to texture coordiante
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


const HISTOPYRAMID_TRAVERSAL_VS = `\
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

    // // _HACK
    // // locationAndIndex = weights;
    // locationAndIndex = vec4(-1.);
    // locationAndIndex.r = float(i);
    // locationAndIndex.g = currentKey;
    // locationAndIndex.b = lowerBound;
    // if (level == 0) { break; } // Work around for const expression restriction on for loops
    // currentKey -= lowerBound;
    // locationAndIndex.a = currentKey;
  }
  locationAndIndex = vec4(p, currentKey, keyIndex);
}
`;

function isPowerOfTwo(x) {
    return ((x !== 0) && !(x & (x - 1)));
}

function nextPowerOfTwo(x) {
  const p = Math.ceil(Math.log2(x));
  return Math.pow(2, p);
}


const channelToIndexMap = {
  ['r']: 0,
  ['x']: 0,
  ['g']: 1,
  ['y']: 1,
  ['b']: 2,
  ['z']: 2,
  ['a']: 3,
  ['w']: 3
};

// returns a base level texture that packs given weight into a texture
// each 4 X 4 region is mapped into RGBA channels of single pixel
// returned texture is a squred power of two sized texture
// R -> lower left, G -> lower right B -> upper left A -> upper right
export function buildHistopyramidBaseLevel(gl, opts) {
  const {texture, channel = 'r', _readData = false} = opts;
  let {width, height} = texture;
  width = nextPowerOfTwo(width);
  height = nextPowerOfTwo(height);
  // Use sqaured next power of two size, then use half of it since we are packing 4X4 group into a single RGBA pixel
  const size = (width > height ? width : height) / 2;
  const baseTexture = cloneTextureFrom(texture, {
    width: size,
    height: size
  });

  // build individual pyramid textures
  const transform = new Transform(gl, {
    _sourceTextures: {
      inTexture: texture
    },
    _targetTexture: baseTexture,
    _targetTextureVarying: 'outTexture',
    vs: `${HISTOPYRAMID_BUILD_VS_UTILS}${HISTOPYRAMID_BASE_BUILD_VS}`,
    elementCount: baseTexture.width * baseTexture.height
  });
  transform.run({
    uniforms: {
      channel: channelToIndexMap[channel] || 0,
      padingPixelValue: [0, 0, 0, 0]
    }
  });
  // _readData is debug only option
  let textureData;
  // when base textuer size is 1X1, there are no more level to be generated
  // so read the texture data to be provided as base level data.
  if (_readData || size === 1) {
    textureData = transform.getData({packed: true});
  }
  const flatPyramidSize = size * 2;
  const flatPyramidTexture = cloneTextureFrom(texture, {
    width: flatPyramidSize,
    height: flatPyramidSize,
    parameters: {
      [GL.TEXTURE_MAG_FILTER]: GL.NEAREST,
      [GL.TEXTURE_MIN_FILTER]: GL.NEAREST
    },
  });
  const framebuffer = transform.getFramebuffer();
  framebuffer.copyToTexture({
    texture: flatPyramidTexture,
    xoffset: 0,
    width: size,
    height: size
  });

  return {textureData, baseTexture, flatPyramidTexture};
}

// builds histopyramid for a given texture and returns individual levels and flatended pyramid texture
// Returns object
// * pyramidTextures: Array with all individual mip levels
// * flatPyramidTexture: Texture with all mip levels laid out horizontally
export function getHistoPyramid(gl, opts) {
  const {textureData, baseTexture, flatPyramidTexture} = buildHistopyramidBaseLevel(gl, opts);
  // texture = baseTexture;
  // Texture must be a power of two sized square texture
  const {width, height} = baseTexture;
  assert(width === height && isPowerOfTwo(width));
  // {
  //   log.error(`getHistoPyramid: texture: ${opts.texture.id} is not a square power of two texture`)();
  //   return null;
  // }
  const levelCount = Math.log2(width) + 1;
  const pyramidTextures = [baseTexture];

  let topLevelData = textureData;
  if (levelCount > 1) {
    // build empty textures for rest of the pyramid
    for (let i = 1; i < levelCount; i++) {
      const size = width / Math.pow(2, i);
      pyramidTextures.push(cloneTextureFrom(baseTexture, {
        width: size,
        height: size
      }));
    }

    // build individual pyramid textures
    const transform = new Transform(gl, {
      _sourceTextures: {
        inTexture: pyramidTextures[0]
      },
      _targetTexture: pyramidTextures[1],
      _targetTextureVarying: 'outTexture',
      vs: `${HISTOPYRAMID_BUILD_VS_UTILS}${HISTOPYRAMID_BUILD_VS}`,
      elementCount: pyramidTextures[1].width * pyramidTextures[1].height
    });

    let flatOffset = width;
    for (let i = 1; i < levelCount; i++) {
      const outSize = [pyramidTextures[i].width, pyramidTextures[i].height];
      transform.update({
        _sourceTextures: {inTexture: pyramidTextures[i - 1]},
        _targetTexture: pyramidTextures[i],
        elementCount: pyramidTextures[i].width * pyramidTextures[i].height
      });
      transform.run();

      // copy the result to the flaten pyramid texture
      const framebuffer = transform.getFramebuffer();
      framebuffer.copyToTexture({
        texture: flatPyramidTexture,
        xoffset: flatOffset,
        width: outSize[0],
        height: outSize[1]
      });

      flatOffset += outSize[0];
    }
    topLevelData =  transform.getData();
  }

  return {pyramidTextures, flatPyramidTexture, levelCount, topLevelData};
}

export function histoPyramidGenerateIndices(gl, opts) {

  const {flatPyramidTexture, levelCount, topLevelData} = getHistoPyramid(gl, opts);

  const keyIndexCount = topLevelData[0] + topLevelData[1] + topLevelData[2] + topLevelData[3];
  const keyIndex = new Buffer(gl, new Float32Array(keyIndexCount).map((_, index) => index));
  const locationAndIndex = new Buffer(gl, keyIndexCount * 4 * 4); // 4 floats for each key index

  const transform = new Transform(gl, {
    sourceBuffers: {
      keyIndex,
    },
    _sourceTextures: {
      flatPyramidTexture
    },
    feedbackBuffers: {
      locationAndIndex
    },
    varyings: ['locationAndIndex'],
    vs: `${HISTOPYRAMID_TRAVERSAL_UTILS}${HISTOPYRAMID_TRAVERSAL_VS}`,
    elementCount: keyIndexCount
  });
  transform.run({
    uniforms: {
      numLevels: levelCount
    }
  });

  return {locationAndIndexBuffer: locationAndIndex}
}
