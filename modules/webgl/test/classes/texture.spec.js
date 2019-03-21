/* global document */
/* eslint-disable max-len */
import test from 'tape-catch';

import GL from '@luma.gl/constants';
import {Buffer, Texture2D, getKey, isWebGL2, readPixelsToArray} from '@luma.gl/webgl';

import {TEXTURE_FORMATS} from '@luma.gl/webgl/classes/texture-formats';
import {
  testSamplerParameters,
  SAMPLER_PARAMETERS,
  SAMPLER_PARAMETERS_WEBGL2
} from './sampler.utils';

import {fixture} from 'test/setup';

test('WebGL#Texture2D construct/delete', t => {
  const {gl} = fixture;

  t.throws(
    () => new Texture2D(),
    /.*WebGLRenderingContext.*/,
    'Texture2D throws on missing gl context'
  );

  const texture = new Texture2D(gl);
  t.ok(texture instanceof Texture2D, 'Texture2D construction successful');

  t.comment(JSON.stringify(texture.getParameters({keys: true})));

  texture.delete();
  t.ok(texture instanceof Texture2D, 'Texture2D delete successful');

  texture.delete();
  t.ok(texture instanceof Texture2D, 'Texture2D repeated delete successful');

  t.end();
});

function isFormatSupported(format, glContext) {
  format = Number(format);
  const opts = Object.assign({format}, TEXTURE_FORMATS[format]);
  if (!Texture2D.isSupported(glContext, {format}) || (!isWebGL2(glContext) && opts.compressed)) {
    return false;
  }
  return true;
}
test('WebGL#Texture2D check formats', t => {
  const {gl, gl2} = fixture;

  const WEBGL1_FORMATS = [GL.RGB, GL.RGBA, GL.LUMINANCE_ALPHA, GL.LUMINANCE, GL.ALPHA];
  const WEBGL2_FORMATS = [GL.R32F, GL.RG32F, GL.RGB32F, GL.RGBA32F];

  let unSupportedFormats = [];
  WEBGL1_FORMATS.forEach(format => {
    if (!isFormatSupported(format, gl)) {
      unSupportedFormats.push(format);
    }
  });

  t.ok(unSupportedFormats.length === 0, 'All WebGL1 formats are supported');

  if (gl2) {
    const gl2Formats = WEBGL1_FORMATS.concat(WEBGL2_FORMATS);
    unSupportedFormats = [];
    gl2Formats.forEach(format => {
      if (!isFormatSupported(format, gl2)) {
        unSupportedFormats.push(format);
      }
    });

    t.ok(unSupportedFormats.length === 0, 'All WebGL2 formats are supported');
  } else {
    t.comment('WebGL2 not available, skipping tests');
  }
  t.end();
});

const DEFAULT_TEXTURE_DATA = new Uint8Array([
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0
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

function testFormatCreation(t, glContext, withData = false) {
  for (let format in TEXTURE_FORMATS) {
    const formatInfo = TEXTURE_FORMATS[format];
    for (let type of formatInfo.types) {
      format = Number(format);
      type = Number(type);
      const data = withData ? TEXTURE_DATA[type] || DEFAULT_TEXTURE_DATA : null;
      const options = Object.assign({}, formatInfo, {
        data,
        format,
        type,
        mipmaps: format !== GL.RGB32F, // TODO: for some reason mipmap generation failing for RGB32F format
        width: 1,
        height: 1
      });
      if (Texture2D.isSupported(glContext, {format})) {
        const texture = new Texture2D(glContext, options);
        t.equals(
          texture.format,
          format,
          `Texture2D({format: ${getKey(GL, format)}, type: ${getKey(
            GL,
            type
          )}, dataFormat: ${getKey(GL, options.dataFormat)}) created`
        );
        texture.delete();
      }
    }
  }
}

test('WebGL#Texture2D format creation', t => {
  const {gl, gl2} = fixture;
  testFormatCreation(t, gl);
  if (gl2) {
    testFormatCreation(t, gl2);
  } else {
    t.comment('WebGL2 not available, skipping tests');
  }
  t.end();
});

test('WebGL#Texture2D format creation with data', t => {
  const {gl, gl2} = fixture;
  testFormatCreation(t, gl, true);
  if (gl2) {
    testFormatCreation(t, gl2, true);
  } else {
    t.comment('WebGL2 not available, skipping tests');
  }
  t.end();
});

/*
test('WebGL#Texture2D WebGL1 extension format creation', t => {
  const {gl} = fixture;

  for (const format of TEXTURE_FORMATS) {
  }
  let texture = new Texture2D(gl, {});
  t.ok(texture instanceof Texture2D, 'Texture2D construction successful');

  texture = texture.delete();
  t.ok(texture instanceof Texture2D, 'Texture2D delete successful');

  t.end();
});

test('WebGL#Texture2D WebGL2 format creation', t => {
  const {gl} = fixture;

  for (const format in TEXTURE_FORMATS) {
    if (!WEBGL1_FORMATS.indexOf(format)) {
    }

  }
  let texture = new Texture2D(gl, {});
  t.ok(texture instanceof Texture2D, 'Texture2D construction successful');

  texture = texture.delete();
  t.ok(texture instanceof Texture2D, 'Texture2D delete successful');

  t.end();
});
*/

test('WebGL#Texture2D setParameters', t => {
  const {gl} = fixture;

  let texture = new Texture2D(gl, {});
  t.ok(texture instanceof Texture2D, 'Texture2D construction successful');

  testSamplerParameters({t, texture, parameters: SAMPLER_PARAMETERS});

  /*
  // Bad tests
  const parameter = GL.TEXTURE_MAG_FILTER;
  const value = GL.LINEAR_MIPMAP_LINEAR;
  texture.setParameters({
    [parameter]: value
  });
  const newValue = texture.getParameter(GL.TEXTURE_MAG_FILTER);
  t.equals(newValue, value,
    `Texture2D.setParameters({[${getKey(GL, parameter)}]: ${getKey(GL, value)}})`);
  */

  texture = texture.delete();
  t.ok(texture instanceof Texture2D, 'Texture2D delete successful');

  t.end();
});

test('WebGL2#Texture2D setParameters', t => {
  const {gl2} = fixture;

  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  let texture = new Texture2D(gl2, {});
  t.ok(texture instanceof Texture2D, 'Texture2D construction successful');

  testSamplerParameters({t, texture, parameters: SAMPLER_PARAMETERS_WEBGL2});

  texture = texture.delete();
  t.ok(texture instanceof Texture2D, 'Texture2D delete successful');

  t.end();
});

test('WebGL#Texture2D NPOT Workaround: texture creation', t => {
  const {gl} = fixture;

  // Create NPOT texture with no parameters
  let texture = new Texture2D(gl, {data: null, width: 500, height: 512});
  t.ok(texture instanceof Texture2D, 'Texture2D construction successful');

  // Default parameters should be changed to supported NPOT parameters.
  let minFilter = texture.getParameter(GL.TEXTURE_MIN_FILTER);
  t.equals(minFilter, GL.LINEAR, 'NPOT textuer min filter is set to LINEAR');
  let wrapS = texture.getParameter(GL.TEXTURE_WRAP_S);
  t.equals(wrapS, GL.CLAMP_TO_EDGE, 'NPOT textuer wrap_s is set to CLAMP_TO_EDGE');
  let wrapT = texture.getParameter(GL.TEXTURE_WRAP_T);
  t.equals(wrapT, GL.CLAMP_TO_EDGE, 'NPOT textuer wrap_t is set to CLAMP_TO_EDGE');

  const parameters = {
    [GL.TEXTURE_MIN_FILTER]: GL.NEAREST,
    [GL.TEXTURE_WRAP_S]: GL.REPEAT,
    [GL.TEXTURE_WRAP_T]: GL.MIRRORED_REPEAT
  };

  // Create NPOT texture with parameters
  texture = new Texture2D(gl, {
    data: null,
    width: 512,
    height: 600,
    parameters
  });
  t.ok(texture instanceof Texture2D, 'Texture2D construction successful');

  // Above parameters should be changed to supported NPOT parameters.
  minFilter = texture.getParameter(GL.TEXTURE_MIN_FILTER);
  t.equals(minFilter, GL.NEAREST, 'NPOT textuer min filter is set to NEAREST');
  wrapS = texture.getParameter(GL.TEXTURE_WRAP_S);
  t.equals(wrapS, GL.CLAMP_TO_EDGE, 'NPOT textuer wrap_s is set to CLAMP_TO_EDGE');
  wrapT = texture.getParameter(GL.TEXTURE_WRAP_T);
  t.equals(wrapT, GL.CLAMP_TO_EDGE, 'NPOT textuer wrap_t is set to CLAMP_TO_EDGE');

  t.end();
});

test('WebGL#Texture2D NPOT Workaround: setParameters', t => {
  const {gl} = fixture;

  // Create NPOT texture
  const texture = new Texture2D(gl, {data: null, width: 100, height: 100});
  t.ok(texture instanceof Texture2D, 'Texture2D construction successful');

  const invalidNPOTParameters = {
    [GL.TEXTURE_MIN_FILTER]: GL.LINEAR_MIPMAP_NEAREST,
    [GL.TEXTURE_WRAP_S]: GL.MIRRORED_REPEAT,
    [GL.TEXTURE_WRAP_T]: GL.REPEAT
  };
  texture.setParameters(invalidNPOTParameters);

  // Above parameters should be changed to supported NPOT parameters.
  const minFilter = texture.getParameter(GL.TEXTURE_MIN_FILTER);
  t.equals(minFilter, GL.LINEAR, 'NPOT textuer min filter is set to LINEAR');
  const wrapS = texture.getParameter(GL.TEXTURE_WRAP_S);
  t.equals(wrapS, GL.CLAMP_TO_EDGE, 'NPOT textuer wrap_s is set to CLAMP_TO_EDGE');
  const wrapT = texture.getParameter(GL.TEXTURE_WRAP_T);
  t.equals(wrapT, GL.CLAMP_TO_EDGE, 'NPOT textuer wrap_t is set to CLAMP_TO_EDGE');

  t.end();
});

test('WebGL2#Texture2D NPOT Workaround: texture creation', t => {
  // WebGL2 supports NPOT texture hence, texture parameters should not be changed.
  const {gl2} = fixture;
  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  // Create NPOT texture with no parameters
  let texture = new Texture2D(gl2, {data: null, width: 500, height: 512});
  t.ok(texture instanceof Texture2D, 'Texture2D construction successful');

  // Default values are un-changed.
  let minFilter = texture.getParameter(GL.TEXTURE_MIN_FILTER);
  t.equals(
    minFilter,
    GL.NEAREST_MIPMAP_LINEAR,
    'NPOT textuer min filter is set to NEAREST_MIPMAP_LINEAR'
  );
  let wrapS = texture.getParameter(GL.TEXTURE_WRAP_S);
  t.equals(wrapS, GL.REPEAT, 'NPOT textuer wrap_s is set to REPEAT');
  let wrapT = texture.getParameter(GL.TEXTURE_WRAP_T);
  t.equals(wrapT, GL.REPEAT, 'NPOT textuer wrap_t is set to REPEAT');

  const parameters = {
    [GL.TEXTURE_MIN_FILTER]: GL.NEAREST,
    [GL.TEXTURE_WRAP_S]: GL.REPEAT,
    [GL.TEXTURE_WRAP_T]: GL.MIRRORED_REPEAT
  };

  // Create NPOT texture with parameters
  texture = new Texture2D(gl2, {
    data: null,
    width: 512,
    height: 600,
    parameters
  });
  t.ok(texture instanceof Texture2D, 'Texture2D construction successful');

  minFilter = texture.getParameter(GL.TEXTURE_MIN_FILTER);
  t.equals(minFilter, GL.NEAREST, 'NPOT textuer min filter is set to NEAREST');
  wrapS = texture.getParameter(GL.TEXTURE_WRAP_S);
  t.equals(wrapS, GL.REPEAT, 'NPOT textuer wrap_s is set to REPEAT');
  wrapT = texture.getParameter(GL.TEXTURE_WRAP_T);
  t.equals(wrapT, GL.MIRRORED_REPEAT, 'NPOT textuer wrap_t is set to MIRRORED_REPEAT');

  t.end();
});

test('WebGL2#Texture2D NPOT Workaround: setParameters', t => {
  const {gl2} = fixture;
  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  // Create NPOT texture
  const texture = new Texture2D(gl2, {data: null, width: 100, height: 100});
  t.ok(texture instanceof Texture2D, 'Texture2D construction successful');

  const invalidNPOTParameters = {
    [GL.TEXTURE_MIN_FILTER]: GL.LINEAR_MIPMAP_NEAREST,
    [GL.TEXTURE_WRAP_S]: GL.MIRRORED_REPEAT,
    [GL.TEXTURE_WRAP_T]: GL.REPEAT
  };
  texture.setParameters(invalidNPOTParameters);

  // Above parameters are not changed for NPOT texture when using WebGL2 context.
  const minFilter = texture.getParameter(GL.TEXTURE_MIN_FILTER);
  t.equals(
    minFilter,
    GL.LINEAR_MIPMAP_NEAREST,
    'NPOT textuer min filter is set to LINEAR_MIPMAP_NEAREST'
  );
  const wrapS = texture.getParameter(GL.TEXTURE_WRAP_S);
  t.equals(wrapS, GL.MIRRORED_REPEAT, 'NPOT textuer wrap_s is set to MIRRORED_REPEAT');
  const wrapT = texture.getParameter(GL.TEXTURE_WRAP_T);
  t.equals(wrapT, GL.REPEAT, 'NPOT textuer wrap_t is set to REPEAT');

  t.end();
});

test('WebGL1#Texture2D setImageData', t => {
  const {gl} = fixture;

  // data: null
  const texture = new Texture2D(gl, {data: null, width: 2, height: 1, mipmap: false});
  t.deepEquals(readPixelsToArray(texture), new Float32Array(8), 'Pixels are empty');

  // data: typed array
  const data = new Uint8Array([0, 1, 2, 3, 128, 201, 255, 255]);
  texture.setImageData({data});
  t.deepEquals(readPixelsToArray(texture), data, 'Pixels are set correctly');

  // data: canvas
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, 2, 1);
    imageData.data[2] = 128;
    imageData.data[3] = 255;
    imageData.data[7] = 1;
    ctx.putImageData(imageData, 0, 0);
    texture.setImageData({data: canvas});
    t.deepEquals(
      readPixelsToArray(texture),
      new Uint8Array([0, 0, 128, 255, 0, 0, 0, 1]),
      'Pixels are set correctly'
    );
  }

  t.end();
});

test('WebGL2#Texture2D setImageData', t => {
  const {gl2} = fixture;
  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  let data;

  // data: null
  const texture = new Texture2D(gl2, {
    data: null,
    width: 2,
    height: 1,
    format: GL.RGBA32F,
    type: GL.FLOAT,
    mipmap: false
  });
  t.deepEquals(readPixelsToArray(texture), new Float32Array(8), 'Pixels are empty');

  // data: typed array
  data = new Float32Array([0.1, 0.2, -3, -2, 0, 0.5, 128, 255]);
  texture.setImageData({data});
  t.deepEquals(readPixelsToArray(texture), data, 'Pixels are set correctly');

  // data: buffer
  data = new Float32Array([21, 0.82, 0, 1, 0, 255, 128, 3.333]);
  const buffer = new Buffer(gl2, {data, accessor: {size: 4, type: GL.FLOAT}});
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

test('WebGL1#Texture2D setSubImageData', t => {
  const {gl} = fixture;

  // data: null
  const texture = new Texture2D(gl, {data: null, width: 2, height: 1, mipmap: false});
  t.deepEquals(readPixelsToArray(texture), new Uint8Array(8), 'Pixels are empty');

  // data: typed array
  const data = new Uint8Array([1, 2, 3, 4]);
  texture.setSubImageData({data, x: 0, y: 0, width: 1, height: 1});
  t.deepEquals(
    readPixelsToArray(texture),
    new Uint8Array([1, 2, 3, 4, 0, 0, 0, 0]),
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
      new Uint8Array([1, 2, 3, 4, 0, 0, 0, 255]),
      'Pixels are set correctly'
    );
  }

  t.end();
});

test('WebGL2#Texture2D setSubImageData', t => {
  const {gl2} = fixture;
  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  let data;

  // data: null
  const texture = new Texture2D(gl2, {
    data: null,
    width: 2,
    height: 1,
    format: GL.RGBA32F,
    type: GL.FLOAT,
    mipmap: false
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
  const buffer = new Buffer(gl2, {data, accessor: {size: 4, type: GL.FLOAT}});
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
