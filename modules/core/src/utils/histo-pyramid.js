// TODO: move to gpgpu module.

import Transform from '../core/transform';
import {cloneTextureFrom} from '../webgl-utils/texture-utils';
import {log} from '../utils';
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
  outTexture = pixel + rightPixel + bottomPixel + rightBottomPixel;
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
  // Debug only, remove later
  let textureData;
  if (_readData) {
    textureData = transform.getData({packed: true});
  }
  return {textureData, baseTexture};
}

// builds histopyramid for a given texture and returns individual levels and flatended pyramid texture
// Returns object
// * pyramidTextures: Array with all individual mip levels
// * flatPyramidTexture: Texture with all mip levels laid out horizontally
export function getHistoPyramid({gl, texture}) {
  // Texture must be a power of two sized square texture
  const {width, height} = texture;
  if (width !== height || !isPowerOfTwo(width)) {
    log.error(`getHistoPyramid: texture: ${texture.id} is not a square power of two texture`)();
    return null;
  }
  const levelCount = Math.log2(width) + 1;
  const pyramidTextures = [];

  // flat pyramid should fit in original texture size as level-0 texture is half the size
  const flatPyramidSize = width;

  pyramidTextures.push(texture);
  // build empty textures
  for (let i = 1; i < levelCount; i++) {
    const size = width / Math.pow(2, i);
    pyramidTextures.push(cloneTextureFrom(texture, {
      width: size,
      height: size
    }));
  }

  const flatPyramidTexture = cloneTextureFrom(texture, {
    width: flatPyramidSize,
    height: flatPyramidSize,
    parameters: {
      [GL.TEXTURE_MAG_FILTER]: GL.NEAREST,
      [GL.TEXTURE_MIN_FILTER]: GL.NEAREST
    },
  });

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

  let flatOffset = 0;
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
  return {pyramidTextures, flatPyramidTexture};
}
