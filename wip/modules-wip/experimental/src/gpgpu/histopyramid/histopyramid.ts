// luma.gl, MIT license

<<<<<<< HEAD:wip/modules-wip/experimental/src/gpgpu/histopyramid/histopyramid.ts
import type { Device } from '@luma.gl/core';
import {Buffer, copyToTexture, cloneTextureFrom} from '@luma.gl/webgl-legacy';
import {GL, Transform} from '@luma.gl/webgl-legacy';
=======
import type { Device } from '@luma.gl/api';
import {GL, Buffer, copyToTexture, cloneTextureFrom} from '@luma.gl/webgl-legacy';
import {Transform} from '@luma.gl/engine';
>>>>>>> 83ca9c03d (feat(webgl): Add VertexArray and TransformFeedback as first class objects):modules/experimental/src/gpgpu/histopyramid/histopyramid.ts
import {
  HISTOPYRAMID_BUILD_VS_UTILS,
  HISTOPYRAMID_TRAVERSAL_UTILS,
  HISTOPYRAMID_BASE_BUILD_VS,
  HISTOPYRAMID_BUILD_VS,
  HISTOPYRAMID_TRAVERSAL_VS
} from './histopyramid-shaders';

// Following methods implement Histopyramid operations as described in 'High‐speed marching cubes using histopyramids' by Dyken C, Ziegler G, Theobalt C and Seidel H
// Link to the paper: http://olmozavala.com/Custom/OpenGL/Tutorials/OpenGL4_Examples/MarchingCubes_Dyken/Dyken_et_al-2008-Computer_Graphics_Forum.pdf

// TODO: enable to assert on texture dimension
// function isPowerOfTwo(x) {
//     return ((x !== 0) && !(x & (x - 1)));
// }

function nextPowerOfTwo(x) {
  const p = Math.ceil(Math.log2(x));
  return Math.pow(2, p);
}

const channelToIndexMap = {
  r: 0,
  x: 0,
  g: 1,
  y: 1,
  b: 2,
  z: 2,
  a: 3,
  w: 3
};


/**
 * Returns a base level texture that packs given weight into a texture
 * each 2X2 region is mapped into RGBA channels of single pixel
 * returned texture is a squred power of two sized texture
 * R -> lower left, G -> lower right B -> upper left A -> upper right
 */
export function buildHistopyramidBaseLevel(
  device: Device,
  opts: any
): {
  textureData: any;
  baseTexture: any;
  flatPyramidTexture: any;
} {
  const {texture, channel = 'r', _readData = false} = opts;
  let {width, height} = texture;
  width = nextPowerOfTwo(width);
  height = nextPowerOfTwo(height);
  // Use squared next power of two size, then use half of it since we are packing 2X2 group into a single RGBA pixel
  const size = (width > height ? width : height) / 2;
  const baseTexture = cloneTextureFrom(texture, {
    width: size,
    height: size
  });

  // build individual pyramid textures
  const transform = new Transform(device, {
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
  // when base texture size is 1X1, there are no more level to be generated
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
    }
  });
  const framebuffer = transform.getFramebuffer();
  // @ts-ignore TODO fix
  copyToTexture(framebuffer, flatPyramidTexture, {
    targetX: 0,
    width: size,
    height: size
  });

  return {textureData, baseTexture, flatPyramidTexture};
}

/**
 * builds histopyramid for a given texture and returns individual levels and flatended pyramid texture
 * Returns object
 * * pyramidTextures: Array with all individual mip levels
 * * flatPyramidTexture: Texture with all mip levels laid out horizontally
 */
export function getHistoPyramid(
  device: Device,
  opts: any
): {
  pyramidTextures: any[];
  flatPyramidTexture: any;
  levelCount: number;
  topLevelData: any;
} {
  const {textureData, baseTexture, flatPyramidTexture} = buildHistopyramidBaseLevel(device, opts);
  const {width} = baseTexture;
  // assert(width === height && isPowerOfTwo(width));
  const levelCount = Math.log2(width) + 1;
  const pyramidTextures = [baseTexture];

  let topLevelData = textureData;
  if (levelCount > 1) {
    // build empty textures for rest of the pyramid
    for (let i = 1; i < levelCount; i++) {
      const size = width / Math.pow(2, i);
      pyramidTextures.push(
        cloneTextureFrom(baseTexture, {
          width: size,
          height: size
        })
      );
    }

    // build individual pyramid textures
    const transform = new Transform(device, {
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
      copyToTexture(framebuffer, flatPyramidTexture, {
        targetX: flatOffset,
        width: outSize[0],
        height: outSize[1]
      });

      flatOffset += outSize[0];
    }
    topLevelData = transform.getData();
  }

  return {pyramidTextures, flatPyramidTexture, levelCount, topLevelData};
}

/**
 * builds and traverses a histopyramid for a given texture and returns pixel locations and local-key index for each non zero weight in input texture
 * Returns object
 * *locationAndIndexBuffer : Buffer contains one vec4 for each non zero weight. XY represent loation, Z represents local-key index and W represent key-index
 */
export function histoPyramidGenerateIndices(
  device: Device,
  opts: any
): {
  locationAndIndexBuffer: any;
} {
  const {flatPyramidTexture, levelCount, topLevelData} = getHistoPyramid(device, opts);

  const keyIndexCount = topLevelData[0] + topLevelData[1] + topLevelData[2] + topLevelData[3];
  const keyIndex = new Buffer(
    device,
    new Float32Array(keyIndexCount).map((_, index) => index)
  );
  const locationAndIndex = new Buffer(device, keyIndexCount * 4 * 4); // 4 floats for each key index

  const transform = new Transform(device, {
    sourceBuffers: {
      keyIndex
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

  return {locationAndIndexBuffer: locationAndIndex};
}
