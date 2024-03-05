// TODO - fix
// @ts-nocheck
/* eslint-disable */

import test from 'tape-promise/tape';
import {webglDevice, getTestDevices} from '@luma.gl/test-utils';

import {Device, Texture, TextureFormat, cast} from '@luma.gl/core';
import {GL} from '@luma.gl/constants';

// TODO(v9): Avoid import from `@luma.gl/webgl` in core tests.
import {TEXTURE_FORMATS} from '@luma.gl/webgl/adapter/converters/texture-formats';
import {SAMPLER_PARAMETERS} from './sampler.spec';

import {WEBGLTexture} from '@luma.gl/webgl/adapter/resources/webgl-texture';
// import {convertToSamplerProps} from '@luma.gl/webgl/adapter/converters/sampler-parameters';

test('Device#isTextureFormatSupported()', async t => {
  const FORMATS: Record<string, TextureFormat[]> = {
    webgl: ['rgba8unorm', 'r32float', 'rg32float', 'rgb32float-webgl', 'rgba32float'],
    webgpu: []
  };

  for (const device of await getTestDevices()) {
    const unSupportedFormats = [];
    FORMATS[device.type].forEach(format => {
      if (!device.isTextureFormatSupported(format)) {
        unSupportedFormats.push(format);
      }
    });

    t.deepEqual(unSupportedFormats, [], `All ${device.type} formats are supported`);
  }

  t.end();
});

test('Texture#construct/delete', async t => {
  for (const device of await getTestDevices()) {
    const texture = device.createTexture({});
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
      const texture = device.createTexture({format});
      t.ok(texture instanceof Texture, `Texture ${format} construction successful`);
    }
  }
  t.end();
});

test.skip('Texture#format deduction', async t => {
  for (const device of await getTestDevices()) {
    testFormatDeduction(t, device);
  }
  t.end();
});

const DEFAULT_TEXTURE_DATA = new Uint8Array([
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
]);
const DATA = [1, 0.5, 0.25, 0.125];
const UINT8_DATA = new Uint8Array(DATA);
const UINT16_DATA = new Uint16Array(DATA);
const FLOAT_DATA = new Float32Array(DATA);
const TEXTURE_DATA = {
  [GL.UNSIGNED_BYTE]: UINT8_DATA, // RGB_TO[GL.UNSIGNED_BYTE](DATA)),
  [GL.UNSIGNED_SHORT_5_6_5]: UINT16_DATA, // RGB_TO[GL.UNSIGNED_SHORT_5_6_5](DATA))
  [GL.UNSIGNED_SHORT_4_4_4_4]: UINT16_DATA, // RGB_TO[GL.UNSIGNED_SHORT_5_6_5](DATA))
  [GL.UNSIGNED_SHORT_5_5_5_1]: UINT16_DATA, // RGB_TO[GL.UNSIGNED_SHORT_5_6_5](DATA))
  [GL.FLOAT]: FLOAT_DATA
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
  for (const [textureFormat, formatInfo] of Object.entries(TEXTURE_FORMATS)) {
    const format = textureFormat as TextureFormat;
    if (device.isTextureFormatSupported(format)) {
      try {
        const data = withData ? TEXTURE_DATA[type] || DEFAULT_TEXTURE_DATA : null;
        // TODO: for some reason mipmap generation failing for RGB32F format
        const mipmaps =
          device.isTextureFormatRenderable(format) && device.isTextureFormatFilterable(format);
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
          `Texture(${format}) created with mipmaps=${mipmaps}`
        );
        texture.destroy();
      } catch (error) {
        t.comment(`Texture(${format}) creation FAILED ${error}`);
      }
    } else {
      t.comment(`Texture(${format}) not supported in ${device.type}`);
    }
  }
}

function testFormatDeduction(t, device: Device) {
  for (const [formatName, formatInfo] of Object.entries(TEXTURE_FORMATS)) {
    const expectedType = formatInfo.types[0];
    const expectedDataFormat = formatInfo.dataFormat;
    const options = {
      format: Number(format),
      height: 1,
      width: 1
    };
    if (device.isTextureFormatSupported({format})) {
      const texture = device.createTexture(options);
      const msg = `Texture({format: ${device.getGLKey(format)}}) created`;
      t.equals(texture.format, Number(format), msg);
      t.equals(texture.type, expectedType, msg);
      t.equals(texture.dataFormat, expectedDataFormat, msg);
      texture.destroy();
    }
  }
}

test.skip('Texture#format deduction', async t => {
  for (const device of await getTestDevices()) {
    testFormatDeduction(t, device);
  }
  t.end();
});

test.skip('Texture#format creation', async t => {
  for (const device of await getTestDevices()) {
    testFormatCreation(t, device);
  }
  t.end();
});

test.skip('Texture#format creation with data', async t => {
  for (const device of await getTestDevices()) {
    testFormatCreation(t, device, true);
  }
  t.end();
});

/*
test.skip('Texture#WebGL2 format creation', t => {

  for (const format in TEXTURE_FORMATS) {
  }
  let texture = webglDevice.createTexture({});
  t.ok(texture instanceof Texture, 'Texture construction successful');

  texture = texture.destroy();
  t.ok(texture instanceof Texture, 'Texture delete successful');

  t.end();
});
*/

test.skip('Texture#setParameters', t => {
  const texture = webglDevice.createTexture({});
  t.ok(texture instanceof Texture, 'Texture construction successful');

  testSamplerParameters({t, texture, parameters: SAMPLER_PARAMETERS});

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

test.skip('WebGL2#Texture setParameters', t => {
  const texture = webglDevice.createTexture({});
  t.ok(texture instanceof Texture, 'Texture construction successful');

  testSamplerParameters({t, texture, parameters: SAMPLER_PARAMETERS_WEBGL2});

  texture.destroy();
  t.ok(texture instanceof Texture, 'Texture delete successful');

  t.end();
});

test.skip('Texture#NPOT Workaround: texture creation', t => {
  // Create NPOT texture with no parameters
  let texture = webglDevice.createTexture({data: null, width: 500, height: 512});
  t.ok(texture instanceof Texture, 'Texture construction successful');

  // Default parameters should be changed to supported NPOT parameters.
  let minFilter = getParameter(texture, 'minFilter');
  t.equals(minFilter, GL.LINEAR, 'NPOT texture min filter is set to LINEAR');
  let wrapS = getParameter(texture, 'addressModeU');
  t.equals(wrapS, 'clamp-to-edge', 'NPOT texture wrap_s is set to CLAMP_TO_EDGE');
  let wrapT = getParameter(texture, 'addressModeV');
  t.equals(wrapT, 'clamp-to-edge', 'NPOT texture wrap_t is set to CLAMP_TO_EDGE');

  const parameters = {
    ['minFilter']: 'nearest',
    ['addressModeU']: 'repeat',
    ['addressModeV']: 'mirrored-repeat'
  };

  // Create NPOT texture with parameters
  texture = webglDevice.createTexture({
    data: null,
    width: 512,
    height: 600,
    parameters
  });
  t.ok(texture instanceof Texture, 'Texture construction successful');

  // Above parameters should be changed to supported NPOT parameters.
  minFilter = getParameter(texture, 'minFilter');
  t.equals(minFilter, 'nearest', 'NPOT texture min filter is set to NEAREST');
  wrapS = getParameter(texture, 'addressModeU');
  t.equals(wrapS, 'clamp-to-edge', 'NPOT texture wrap_s is set to CLAMP_TO_EDGE');
  wrapT = getParameter(texture, 'addressModeV');
  t.equals(wrapT, 'clamp-to-edge', 'NPOT texture wrap_t is set to CLAMP_TO_EDGE');

  t.end();
});

test.skip('Texture#NPOT Workaround: setParameters', t => {
  // Create NPOT texture
  const texture = webglDevice.createTexture({data: null, width: 100, height: 100});
  t.ok(texture instanceof Texture, 'Texture construction successful');

  const invalidNPOTParameters = {
    ['minFilter']: 'linear',
    ['mipmapFilter']: 'nearest',
    ['addressModeU']: 'mirrored-repeat',
    ['addressModeV']: 'repeat'
  };
  texture.setParameters(invalidNPOTParameters);

  // Above parameters should be changed to supported NPOT parameters.
  const minFilter = getParameter(texture, 'minFilter');
  t.equals(minFilter, 'linear', 'NPOT texture min filter is set to LINEAR');
  const wrapS = getParameter(texture, 'addressModeU');
  t.equals(wrapS, 'clamp-to-edge', 'NPOT texture wrap_s is set to CLAMP_TO_EDGE');
  const wrapT = getParameter(texture, 'addressModeV');
  t.equals(wrapT, 'clamp-to-edge', 'NPOT texture wrap_t is set to CLAMP_TO_EDGE');

  t.end();
});

test.skip('WebGL2#Texture setImageData', t => {
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
  data = new Float32Array([0.1, 0.2, -3, -2, 0, 0.5, 128, 255]);
  texture.setImageData({data});
  t.deepEquals(readPixelsToArray(texture), data, 'Pixels are set correctly');

  // data: buffer
  data = new Float32Array([21, 0.82, 0, 1, 0, 255, 128, 3.333]);
  const buffer = webglDevice.createByffer({data, accessor: {size: 4, type: GL.FLOAT}});
  texture.setImageData({data: buffer});
  t.deepEquals(readPixelsToArray(texture), data, 'Pixels are set correctly');

  // data: canvas
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    ctx.fillRect(0, 0, 2, 1);
    texture.setImageData({data: canvas});
    t.deepEquals(
      readPixelsToArray(texture),
      new Float32Array([0, 0, 0, 1, 0, 0, 0, 1]),
      'Pixels are set correctly'
    );
  }

  t.end();
});

test.skip('WebGL2#Texture setSubImageData', t => {
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

/*
test.skip('WebGL2#Texture resize', (t) => {
  let texture = webglDevice.createTexture({
    data: null,
    width: 2,
    height: 2,
    mipmaps: true
  });

  texture.resize({
    width: 4,
    height: 4,
    mipmaps: true
  });

  t.ok(texture.mipmaps, 'mipmaps should set to true for POT.');

  texture.resize({
    width: 3,
    height: 3,
    mipmaps: true
  });

  t.notOk(texture.mipmaps, 'mipmaps should set to false when resizing to NPOT.');

  texture = webglDevice.createTexture({
    data: null,
    width: 2,
    height: 2,
    mipmaps: true
  });

  texture.resize({
    width: 4,
    height: 4
  });

  t.notOk(texture.mipmaps, 'mipmaps should set to false when resizing.');

  t.end();
});
*/

test.skip('WebGL2#Texture generateMipmap', t => {
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

// Shared with texture*.spec.js
export function testSamplerParameters({t, texture, parameters}) {
  for (const parameterName in parameters) {
    const values = parameters[parameterName];
    const parameter = Number(parameterName);
    for (const valueName in values) {
      const value = Number(valueName);
      texture.setParameters({
        [parameter]: value
      });
      const name = texture.constructor.name;
      const newValue = getParameter(texture, parameter);
      t.equals(
        newValue,
        value,
        `${name}.setParameters({[${device.getGLKey(parameter)}]: ${device.getGLKey(
          value
        )}}) read back OK`
      );
    }
  }
}

// 2D TEXTURES

test.skip('Texture#construct/delete', t => {
  t.throws(
    // @ts-expect-error
    () => new Texture(),
    /.*WebGLRenderingContext.*/,
    'Texture throws on missing gl context'
  );

  const texture = webglDevice.createTexture();
  t.ok(texture instanceof Texture, 'Texture construction successful');

  t.comment(JSON.stringify(texture.getParameters({keys: true})));

  texture.destroy();
  t.ok(texture instanceof Texture, 'Texture delete successful');

  texture.destroy();
  t.ok(texture instanceof Texture, 'Texture repeated delete successful');

  t.end();
});

test.skip('Texture#async constructor', t => {
  let texture = webglDevice.createTexture();
  t.ok(texture instanceof Texture, 'Synchronous Texture construction successful');
  t.equal(texture.loaded, true, 'Sync Texture marked as loaded');
  texture.destroy();

  let loadCompleted;
  const loadPromise = new Promise(resolve => {
    loadCompleted = resolve; // eslint-disable-line
  });
  texture = new Texture(gl, loadPromise);
  t.ok(texture instanceof Texture, 'Asynchronous Texture construction successful');
  t.equal(texture.loaded, false, 'Async Texture initially marked as not loaded');

  loadPromise.then(() => {
    t.equal(texture.loaded, true, 'Async Texture marked as loaded on promise completion');
    t.end();
  });

  // @ts-expect-error
  loadCompleted(null);
});

test.skip('Texture#buffer update', t => {
  let texture = webglDevice.createTexture();
  t.ok(texture instanceof Texture, 'Texture construction successful');

  texture = texture.destroy();
  t.ok(texture instanceof Texture, 'Texture delete successful');

  t.end();
});

// CUBE TEXTURES

test.skip('WebGL#TextureCube construct/delete', t => {
  t.throws(
    // @ts-expect-error
    () => new TextureCube(),
    /.*WebGLRenderingContext.*/,
    'TextureCube throws on missing gl context'
  );

  const texture = webglDevice.createTexture({dimension: 'cube'});
  t.ok(texture instanceof Texture, 'TextureCube construction successful');

  // t.comment(JSON.stringify(texture.getParameters({keys: true})));

  texture.destroy();
  t.ok(texture instanceof Texture, 'TextureCube delete successful');

  texture.destroy();
  t.ok(texture instanceof Texture, 'TextureCube repeated delete successful');

  t.end();
});

test.skip('WebGL#TextureCube buffer update', t => {
  const texture = webglDevice.createTexture({dimension: 'cube'});
  t.ok(texture instanceof Texture, 'TextureCube construction successful');

  texture.destroy();
  t.ok(texture instanceof Texture, 'TextureCube delete successful');

  t.end();
});

test.skip('WebGL#TextureCube multiple LODs', t => {
  const texture = webglDevice.createTexture(
    {dimension: 'cube'},
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

test.skip('WebGL#Texture3D construct/delete', t => {
  t.throws(
    () => webglDevice.createTexture({dimension: '3d'}),
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

// HELPERS

function getParameter(texture: Texture, pname: number): any {
  const webglTexture = cast<WEBGLTexture>(texture);
  webglTexture.gl.bindTexture(webglTexture.target, webglTexture.handle);
  const value = webglTexture.gl.getTexParameter(webglTexture.target, pname);
  webglTexture.gl.bindTexture(webglTexture.target, null);
  return value;
}
