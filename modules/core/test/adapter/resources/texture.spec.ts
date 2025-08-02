// TODO - fix
// @ts-nocheck
/* eslint-disable */

import test from 'tape-promise/tape';
import {getWebGLTestDevice, getTestDevices} from '@luma.gl/test-utils';

import {Device, Texture, TextureFormat, textureFormatDecoder, VertexType} from '@luma.gl/core';
// TODO(v9): Avoid import from `@luma.gl/constants` in core tests.
import {GL} from '@luma.gl/constants';
import {WebGLDevice} from '@luma.gl/webgl';

import {_getTextureFormatTable, getTextureFormatWebGL} from '@luma.gl/core';
import {SAMPLER_PARAMETERS} from './sampler.spec';

import {WEBGLTexture} from '@luma.gl/webgl/adapter/resources/webgl-texture';
import {WebGLDevice} from '../../../../webgl/dist/adapter/webgl-device';
// import {convertToSamplerProps} from '@luma.gl/webgl/adapter/converters/sampler-parameters';

test('Device#isTextureFormatSupported()', async t => {
  const UNSUPPORTED_FORMATS: Record<string, TextureFormat[]> = {
    webgl: [],
    webgpu: ['rgb32float-webgl']
  };

  for (const device of await getTestDevices()) {
    const unSupportedFormats: TextureFormat[] = [];
    UNSUPPORTED_FORMATS[device.type].forEach(format => {
      if (!device.isTextureFormatSupported(format)) {
        unSupportedFormats.push(format);
      }
    });

    unSupportedFormats.sort();
    const expected = UNSUPPORTED_FORMATS[device.type].sort();
    t.ok(
      unSupportedFormats.every(format => expected.includes(format)),
      `${device.type}: unsupported formats ${unSupportedFormats.join(',') in [expected.join(',')]}`
    );
  }

  t.end();
});

test('Device#isTextureFormatFilterable()', async t => {
  const UNSUPPORTED_FORMATS: Record<string, Record<Device['type'], TextureFormat[]>> = {
    webgl: ['rgba8unorm', 'r32float', 'rg32float', 'rgb32float-webgl', 'rgba32float'],
    webgpu: []
  };

  for (const device of await getTestDevices()) {
    const unSupportedFormats: TextureFormat[] = [];
    UNSUPPORTED_FORMATS[device.type].forEach(format => {
      if (!device.isTextureFormatFilterable(format)) {
        unSupportedFormats.push(format);
      }
    });

    unSupportedFormats.sort();
    const expected = UNSUPPORTED_FORMATS[device.type].sort();
    t.ok(
      unSupportedFormats.every(format => expected.includes(format)),
      `${device.type}: Unfilterable formats ${unSupportedFormats.join(',') in [expected.join(',')]}`
    );
  }

  t.end();
});

test('Device#isTextureFormatRenderable()', async t => {
  const UNSUPPORTED_FORMATS: Record<string, Record<Device['type'], TextureFormat[]>> = {
    webgl: ['rgba8unorm', 'r32float', 'rg32float', 'rgb32float-webgl', 'rgba32float'],
    webgpu: []
  };

  for (const device of await getTestDevices()) {
    const unSupportedFormats: TextureFormat[] = [];
    UNSUPPORTED_FORMATS[device.type].forEach(format => {
      if (!device.isTextureFormatRenderable(format)) {
        unSupportedFormats.push(format);
      }
    });

    unSupportedFormats.sort();
    const expected = UNSUPPORTED_FORMATS[device.type].sort();
    t.ok(
      unSupportedFormats.every(format => expected.includes(format)),
      `${device.type}: Unrenderable formats ${unSupportedFormats.join(',') in [expected.join(',')]}`
    );
  }

  t.end();
});

test('Texture#construct/delete', async t => {
  for (const device of await getTestDevices()) {
    const texture = device.createTexture({width: 1, height: 1});
    t.ok(texture instanceof Texture, 'Texture construction successful');
    texture.destroy();
    t.ok(texture instanceof Texture, 'Texture delete successful');
    texture.destroy();
    t.ok(texture instanceof Texture, 'Texture repeated delete successful');
  }
  t.end();
});

test('Texture#depth/stencil formats', async t => {
  const DEPTH_STENCIL_FORMATS = ['depth16unorm', 'depth24plus', 'depth24plus-stencil8'];
  for (const device of await getTestDevices()) {
    for (const format of DEPTH_STENCIL_FORMATS) {
      t.ok(device.isTextureFormatSupported(format), `${device.type} ${format} is supported`);
      t.notOk(
        device.isTextureFormatFilterable(format),
        `${device.type} ${format} is not filterable`
      );
      const texture = device.createTexture({format, width: 1, height: 1});
      t.ok(texture instanceof Texture, `Texture ${format} construction successful`);
    }
  }
  t.end();
});

test('Texture#format simple creation', async t => {
  for (const device of await getTestDevices()) {
    for (const [formatName, formatInfo] of Object.entries(_getTextureFormatTable)) {
      if (['stencil8'].includes(formatName)) {
        continue;
      }

      if (device.isTextureFormatSupported(formatName)) {
        // For compressed textures there may be a block size that we need to be a multiple of
        const decodedFormat = textureFormatDecoder.getInfo(formatName);
        const width = decodedFormat.blockWidth ?? 4;
        const height = decodedFormat.blockHeight ?? 4;

        let texture: Texture;
        t.doesNotThrow(() => {
          texture = device.createTexture({
            format: formatName,
            height,
            width
          });
        }, `Texture(${device.type},${formatName}) creation OK`);

        t.equals(texture.format, formatName, `Texture(${device.type},${formatName}).format OK`);
        texture.destroy();
      }
    }
  }
  t.end();
});

const DEFAULT_TEXTURE_DATA = new Uint8Array([
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
]);
const DATA = [1, 0.5, 0.25, 0.125];
const TEXTURE_DATA: Record<VertexType, any> = {
  uint8: new Uint8Array(DATA),
  sint8: new Int8Array(DATA),
  uint16: new Uint16Array(DATA),
  sint16: new Int16Array(DATA),
  uint32: new Uint32Array(DATA),
  sint32: new Int32Array(DATA),
  // [GL.UNSIGNED_SHORT_5_6_5]: UINT16_DATA, // RGB_TO[GL.UNSIGNED_SHORT_5_6_5](DATA))
  // [GL.UNSIGNED_SHORT_4_4_4_4]: UINT16_DATA, // RGB_TO[GL.UNSIGNED_SHORT_5_6_5](DATA))
  // [GL.UNSIGNED_SHORT_5_5_5_1]: UINT16_DATA, // RGB_TO[GL.UNSIGNED_SHORT_5_6_5](DATA))
  float16: new Uint16Array(DATA),
  float32: new Float32Array(DATA)
};
// const RGB_TO = {
//   [GL.UNSIGNED_BYTE]: (r, g, b) => [r * 256, g * 256, b * 256],
//   [GL.UNSIGNED_SHORT_5_6_5]: (r, g, b) => r * 32 << 11 + g * 64 << 6 + b * 32
// };
// const RGB_FROM = {
//   [GL.UNSIGNED_BYTE]: v => [v[0] / 256, v[1] / 256, v[2] / 256],
//   [GL.UNSIGNED_SHORT_5_6_5]: v => [v >> 11 / 32, v >> 6 % 64 / 64, v % 32 * 32]
// };

function testFormatCreation(t, device: Device, withData: boolean = false) {
  for (const [formatName, formatInfo] of Object.entries(_getTextureFormatTable)) {
    const format = formatName as TextureFormat;

    const decodedFormat = textureFormatDecoder.getInfo(formatName);
    const {dataType, packed, bitsPerChannel} = decodedFormat;

    // WebGPU texture can currently only be set from 8 bit data
    const notImplemented = device.type === 'webgpu' && bitsPerChannel !== 8;
    // console.log(formatName, bitsPerChannel);
    if (['stencil8'].includes(formatName) || notImplemented) {
      continue;
    }

    const canGenerateMipmaps = format === 'rgba8unorm';
    // device.isTextureFormatSupported(format) && !device.isTextureFormatCompressed(format);
    if (canGenerateMipmaps) {
      try {
        const data = withData && !packed ? TEXTURE_DATA[dataType] || DEFAULT_TEXTURE_DATA : null;

        const capabilities = device.getTextureFormatCapabilities(format);
        const mipmaps = capabilities.render && capabilities.filter;

        const sampler = mipmaps
          ? {
              magFilter: 'linear',
              minFilter: 'linear',
              addressModeU: 'clamp-to-edge',
              addressModeW: 'clamp-to-edge'
            }
          : {};

        const texture = device.createTexture({
          data,
          format,
          width: 1,
          height: 1,
          mipmaps,
          sampler
        });
        t.equals(
          texture.props.format,
          format,
          `Texture(${device.type},${format}) created with mipmaps=${mipmaps}`
        );
        texture.destroy();
      } catch (error) {
        t.comment(`Texture(${device.type},${format}) creation FAILED ${error}`);
      }
    } else {
      t.comment(`Texture(${device.type},${format}) not supported`);
    }
  }
}

// test.skip('Texture#format creation', async t => {
//   for (const device of await getTestDevices()) {
//     testFormatCreation(t, device);
//   }
//   t.end();
// });

test('Texture#format creation with data', async t => {
  for (const device of await getTestDevices()) {
    testFormatCreation(t, device, true);
  }
  t.end();
});

test('Texture#dimension=3d,format=r32float', async t => {
  for (const device of await getTestDevices()) {
    if (device.info.type === 'webgpu') {
      // TODO validation fails due to insufficient texture layers?
      continue;
    }
    const texture = device.createTexture({
      id: '3d-texture',
      width: 16,
      height: 16,
      depth: 16,
      dimension: '3d',
      format: 'r32float',
      mipmaps: false,
      sampler: {
        minFilter: 'linear',
        magFilterFilter: 'linear',
        addressModeU: 'clamp-to-edge',
        addressModeV: 'clamp-to-edge',
        addressModeW: 'clamp-to-edge'
      }
    });
    t.ok(texture, `${device.type}: Texture(dimension=3d,format=r32float) created`);
    t.end();
  }
});

test('Texture#copyExternalImage', async t => {
  for (const device of await getTestDevices()) {
    const texture = device.createTexture({
      width: 2,
      height: 1,
      format: 'rgba8unorm',
      mipmaps: false
    });

    if (device.info.type === 'webgl') {
      const webglDevice = device as WebGLDevice;
      t.deepEquals(
        webglDevice.readPixelsToArrayWebGL(texture),
        new Uint8Array(8),
        `${device.info.type} Pixels are initially empty`
      );
    }

    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      canvas.width = 2;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');

      // Full copy
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(0, 0, 2, 1);
      texture.copyExternalImage({image: canvas});

      if (device.info.type === 'webgl') {
        t.deepEquals(
          device.readPixelsToArrayWebGL(texture),
          new Uint8Array([255, 0, 0, 255, 255, 0, 0, 255]),
          `${device.info.type} Pixels were set correctly (full image)`
        );
      }

      // Subimage copy
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 2, 1);

      texture.copyExternalImage({image: canvas, x: 1});

      if (device.info.type === 'webgl') {
        t.deepEquals(
          device.readPixelsToArrayWebGL(texture),
          new Uint8Array([255, 0, 0, 255, 0, 0, 0, 255]),
          `${device.info.type} Pixels were set correctly (sub image)`
        );
      }

      // Subimage copy (smaller canvas)
      canvas.width = 1;
      canvas.height = 1;
      ctx.fillStyle = '#00FF00';
      ctx.fillRect(0, 0, 1, 1);

      texture.copyExternalImage({image: canvas, x: 1});

      if (device.info.type === 'webgl') {
        t.deepEquals(
          device.readPixelsToArrayWebGL(texture),
          new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255]),
          `${device.info.type} Pixels were set correctly (sub image small canvas)`
        );
      }
    }

    if (device.info.type !== 'webgl') {
      t.pass('WebGPU copyExternalImage test cannot yet read pixels');
    }
  }

  t.end();
});

test.skip('Texture#setImageData', async t => {
  const webglDevice = await getWebGLTestDevice();
  let data;

  // data: null
  const texture = webglDevice.createTexture({
    width: 2,
    height: 1,
    format: GL.RGBA32F,
    type: GL.FLOAT,
    mipmaps: false
  });
  t.deepEquals(readPixelsToArray(texture), new Float32Array(8), 'Pixels are empty');

  // data: typed array
  data = new Float32Array([0.1, 0.2, -3, -2, 0, 0.5, 128, 255]);
  texture.copyExternalImage({data});
  t.deepEquals(readPixelsToArray(texture), data, 'Pixels are set correctly');
  t.end();
});

test.skip('WebGL2#Texture setSubImageData', async t => {
  let data;

  // data: null
  const texture = webglDevice.createTexture({
    data: null,
    width: 2,
    height: 1,
    format: GL.RGBA32F,
    type: GL.FLOAT,
    mipmaps: false
  });
  t.deepEquals(readPixelsToArray(texture), new Float32Array(8), 'Pixels are empty');

  // data: typed array
  data = new Float32Array([0.1, 0.2, -3, -2]);
  texture.setSubImageData({data, x: 0, y: 0, width: 1, height: 1});
  t.deepEquals(
    readPixelsToArray(texture),
    new Float32Array([0.1, 0.2, -3, -2, 0, 0, 0, 0]),
    'Pixels are set correctly'
  );

  // data: buffer
  data = new Float32Array([-3, 255, 128, 3.333]);
  const buffer = webglDevice.createByffer({data, accessor: {size: 4, type: GL.FLOAT}});
  texture.setSubImageData({data: buffer, x: 1, y: 0, width: 1, height: 1});
  t.deepEquals(
    readPixelsToArray(texture),
    new Float32Array([0.1, 0.2, -3, -2, -3, 255, 128, 3.333]),
    'Pixels are set correctly'
  );

  // data: canvas
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    ctx.fillRect(0, 0, 1, 1);
    texture.setSubImageData({data: canvas, x: 1, y: 0, width: 1, height: 1});
    t.deepEquals(
      readPixelsToArray(texture),
      new Float32Array([0.1, 0.2, -3, -2, 0, 0, 0, 1]),
      'Pixels are set correctly'
    );
  }

  t.end();
});

test.skip('WebGL2#Texture generateMipmap', async t => {
  let texture = webglDevice.createTexture({
    data: null,
    width: 3,
    height: 3,
    mipmaps: false
  });

  texture.generateMipmap();
  t.notOk(texture.mipmaps, 'Should not turn on mipmaps for NPOT.');

  texture = webglDevice.createTexture({
    data: null,
    width: 2,
    height: 2,
    mipmaps: false
  });

  texture.generateMipmap();
  t.ok(texture.mipmaps, 'Should turn on mipmaps for POT.');

  t.end();
});

// NON-2D TEXTURES

test('Texture(dimension)#construct/delete', async t => {
  for (const device of await getTestDevices()) {
    for (const dimension of ['3d', '2d-array', 'cube']) {
      const texture = device.createTexture({dimension, width: 1, height: 1});
      t.equal(texture.dimension, dimension, `${device.info.type} Texture construction successful`);
      t.equal(
        texture.view.props.dimension,
        dimension,
        `${device.info.type} Texture view construction successful`
      );
      texture.destroy();
    }
  }

  t.end();
});

test.skip('Texture#buffer update', async t => {
  let texture = webglDevice.createTexture({width: 1, height: 1});
  t.ok(texture instanceof Texture, 'Texture construction successful');

  texture = texture.destroy();
  t.ok(texture instanceof Texture, 'Texture delete successful');

  t.end();
});

// CUBE TEXTURES

test.skip('WebGL#TextureCube construct/delete', async t => {
  t.throws(
    // @ts-expect-error
    () => new TextureCube(),
    /.*WebGLRenderingContext.*/,
    'TextureCube throws on missing gl context'
  );

  const texture = webglDevice.createTexture({dimension: 'cube', width: 1, height: 1});
  t.ok(texture instanceof Texture, 'TextureCube construction successful');

  // t.comment(JSON.stringify(texture.getParameters({keys: true})));

  texture.destroy();
  t.ok(texture instanceof Texture, 'TextureCube delete successful');

  texture.destroy();
  t.ok(texture instanceof Texture, 'TextureCube repeated delete successful');

  t.end();
});

test.skip('WebGL#TextureCube buffer update', async t => {
  const texture = webglDevice.createTexture({dimension: 'cube', width: 1, height: 1});
  t.ok(texture instanceof Texture, 'TextureCube construction successful');

  texture.destroy();
  t.ok(texture instanceof Texture, 'TextureCube delete successful');

  t.end();
});

test.skip('WebGL#TextureCube multiple LODs', async t => {
  const texture = webglDevice.createTexture(
    {dimension: 'cube', width: 1, height: 1},
    {
      pixels: {
        [GL.TEXTURE_CUBE_MAP_POSITIVE_X]: [],
        [GL.TEXTURE_CUBE_MAP_NEGATIVE_X]: [],
        [GL.TEXTURE_CUBE_MAP_POSITIVE_Y]: [],
        [GL.TEXTURE_CUBE_MAP_NEGATIVE_Y]: [],
        [GL.TEXTURE_CUBE_MAP_POSITIVE_Z]: [],
        [GL.TEXTURE_CUBE_MAP_NEGATIVE_Z]: []
      }
    }
  );
  t.ok(texture instanceof Texture, 'TextureCube construction successful');

  t.end();
});

// 3D TEXTURES

test.skip('WebGL#Texture3D construct/delete', async t => {
  t.throws(
    () => webglDevice.createTexture({dimension: '3d', width: 1, height: 1}),
    'Texture3D throws on missing gl context'
  );

  // TODO(Tarek): generating mipmaps on an empty 3D texture seems to trigger an INVALID_OPERATION
  //    error. See if this is expected behaviour.
  /*
  let texture = new Texture3D(gl);
  t.ok(texture instanceof Texture3D, 'Texture3D construction successful');
  texture.destroy();

  gl.getError(); // Reset error

  texture = new Texture3D(gl, {
    width: 4,
    height: 4,
    depth: 4,
    data: new Uint8Array(4 * 4 * 4),
    format: gl.RED,
    dataFormat: gl.R8
  });

  t.ok(gl.getError() === gl.NO_ERROR, 'Texture3D construction with array produces no errors');

  texture.destroy();
  t.ok(!gl.isTexture(texture.handle), `Texture GL object was deleted`);
  t.ok(texture instanceof Texture3D, 'Texture3D delete successful');

  const buffer = new Buffer(gl, new Uint8Array(4 * 4 * 4));

  texture = new Texture3D(gl, {
    width: 4,
    height: 4,
    depth: 4,
    data: buffer,
    format: gl.RED,
    dataFormat: gl.R8
  });

  t.ok(gl.getError() === gl.NO_ERROR, 'Texture3D construction with buffer produces no errors');

  texture.destroy();
  buffer.destroy();
  */

  t.end();
});

test.skip('Texture#setParameters', async t => {
  const texture = webglDevice.createTexture({width: 1, height: 1});
  t.ok(texture instanceof Texture, 'Texture construction successful');

  testSamplerParameters({t, texture, sampler: SAMPLER_PARAMETERS});

  /*
  // Bad tests
  const parameter = GL.TEXTURE_MAG_FILTER;
  const value = GL.LINEAR_MIPMAP_LINEAR;
  texture.setParameters({
    [parameter]: value
  });
  const newValue = getParameter(texture, GL.TEXTURE_MAG_FILTER);
  t.equals(newValue, value,
    `Texture.setParameters({[${device.getGLKey(parameter)}]: ${device.getGLKey(value)}})`);
  */

  texture.destroy();
  t.ok(texture instanceof Texture, 'Texture delete successful');

  t.end();
});
