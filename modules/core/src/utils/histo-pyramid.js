import Transform from '../core/transform';
import {cloneTextureFrom} from '../webgl-utils/texture-utils';
import {log} from '../utils';
import GL from '../constants';

export const HP_BUILD_VS_UTILS = `\
// returns the top left texture coordiante corresponding to 4X4 block in higher level texture.
// size: lower level texture size
// scale: usually (2, 2)
// offset: offset with-in 4X4 block of higher level texture
vec2 hp_getTexCoord(vec2 size, vec2 scale, vec2 offset) {
  // use actual (scaled) texture size to calcualte offset (multiplied by scale)
  vec2 scaledSize = size * scale;

  // use minified texture size to find corresponding pixel index in out texture
  vec2 pixelOffset = transform_getPixelSizeHalf(size);
  // use the minified texture size to generate indices
  vec2 pixelIndices = transform_getPixelIndices(size, pixelOffset);

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
vec4 hp_getInput(sampler2D texSampler, vec2 size, vec2 scale, vec2 offset) {
  vec2 texCoord = hp_getTexCoord(size, scale, offset);
  vec4 textureColor = texture2D(texSampler, texCoord);
  return textureColor;
}
`;

// Vertex shader to build histopyramid
const HP_BUILD_VS = `\
attribute vec4 inTexture;
varying vec4 outTexture;

void main()
{
  vec2 size = transform_uSize_outTexture;
  vec2 scale = vec2(2., 2.);
  vec4 pixel = hp_getInput(transform_uSampler_inTexture, size, scale, vec2(0, 0));
  vec4 rightPixel = hp_getInput(transform_uSampler_inTexture, size, scale, vec2(1, 0));
  vec4 bottomPixel = hp_getInput(transform_uSampler_inTexture, size, scale, vec2(0, 1));
  vec4 rightBottomPixel = hp_getInput(transform_uSampler_inTexture, size, scale, vec2(1, 1));
  outTexture = pixel + rightPixel + bottomPixel + rightBottomPixel;
}
`;

function isPowerOfTwo(x){
    return ((x !== 0) && !(x & (x - 1)));
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
    vs: `${HP_BUILD_VS_UTILS}${HP_BUILD_VS}`,
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
    flatPyramidTexture.copySubFramebuffer({
      framebuffer: transform.getFramebuffer(),
      xOffset: flatOffset,
      width: outSize[0],
      height: outSize[1]
    });

    flatOffset += outSize[0];
  }
  return {pyramidTextures, flatPyramidTexture};
}
