/* eslint-disable max-len */
import test from 'tape-promise/tape';
import {fixture} from 'test/setup';

import GL from '@luma.gl/constants';
import {isWebGL2} from '@luma.gl/webgl-legacy';
import {Buffer, Texture2D, getKey, readPixelsToArray} from '@luma.gl/webgl-legacy';

type WebGLTextureInfo = {
  dataFormat: number;
  types: number[];
  gl2?: boolean;
  gl1?: boolean | string;
  compressed?: boolean;
}

const WEBGL_TEXTURE_FORMATS: Record<string, WebGLTextureInfo> = {
  // Unsized texture format - more performance
  [GL.RGB]: {dataFormat: GL.RGB, types: [GL.UNSIGNED_BYTE, GL.UNSIGNED_SHORT_5_6_5]},
  // TODO: format: GL.RGBA type: GL.FLOAT is supported in WebGL1 when 'OES_texure_float' is suported
  // we need to update this table structure to specify extensions (gl1ext: 'OES_texure_float', gl2ext: false) for each type.
  [GL.RGBA]: {
    dataFormat: GL.RGBA,
    types: [GL.UNSIGNED_BYTE, GL.UNSIGNED_SHORT_4_4_4_4, GL.UNSIGNED_SHORT_5_5_5_1]
  },

  // 32 bit floats
  // [GL.R32F]: {dataFormat: GL.RED, types: [GL.FLOAT], gl2: true},
  // [GL.RG32F]: {dataFormat: GL.RG, types: [GL.FLOAT], gl2: true},
  // [GL.RGB32F]: {dataFormat: GL.RGB, types: [GL.FLOAT], gl2: true},
  // [GL.RGBA32F]: {dataFormat: GL.RGBA, types: [GL.FLOAT], gl2: true}
};

export const SAMPLER_PARAMETERS = {
  [GL.TEXTURE_MIN_FILTER]: {
    [GL.LINEAR]: 'interpolated texel',
    [GL.NEAREST]: 'nearest texel',
    [GL.NEAREST_MIPMAP_NEAREST]: 'nearest texel in closest mipmap',
    [GL.LINEAR_MIPMAP_NEAREST]: 'interpolated texel in closest mipmap',
    [GL.NEAREST_MIPMAP_LINEAR]: 'average texel from two closest mipmaps',
    [GL.LINEAR_MIPMAP_LINEAR]: 'interpolated texel from two closest mipmaps'
  },

  [GL.TEXTURE_MAG_FILTER]: {
    [GL.LINEAR]: 'interpolated texel',
    [GL.NEAREST]: 'nearest texel'
  },

  [GL.TEXTURE_WRAP_S]: {
    [GL.REPEAT]: 'use fractional part of texture coordinates',
    [GL.CLAMP_TO_EDGE]: 'clamp texture coordinates',
    [GL.MIRRORED_REPEAT]:
      'use fractional part of texture coordinate if integer part is odd, otherwise `1 - frac'
  },

  [GL.TEXTURE_WRAP_T]: {
    [GL.REPEAT]: 'use fractional part of texture coordinates',
    [GL.CLAMP_TO_EDGE]: 'clamp texture coordinates',
    [GL.MIRRORED_REPEAT]:
      'use fractional part of texture coordinate if integer part is odd, otherwise `1 - frac'
  }
};

export const SAMPLER_PARAMETERS_WEBGL2 = {
  [GL.TEXTURE_WRAP_R]: {
    [GL.REPEAT]: 'use fractional part of texture coordinates',
    [GL.CLAMP_TO_EDGE]: 'clamp texture coordinates',
    [GL.MIRRORED_REPEAT]:
      'use fractional part of texture coordinate if integer part is odd, otherwise `1 - frac'
  },

  [GL.TEXTURE_COMPARE_MODE]: {
    [GL.NONE]: 'no comparison of `r` coordinate is performed',
    [GL.COMPARE_REF_TO_TEXTURE]:
      'interpolated and clamped `r` texture coordinate is compared to currently bound depth texture, result is assigned to the red channel'
  },

  [GL.TEXTURE_COMPARE_FUNC]: {
    [GL.LEQUAL]: 'result = 1.0 0.0, r <= D t r > D t',
    [GL.GEQUAL]: 'result = 1.0 0.0, r >= D t r < D t',
    [GL.LESS]: 'result = 1.0 0.0, r < D t r >= D t',
    [GL.GREATER]: 'result = 1.0 0.0, r > D t r <= D t',
    [GL.EQUAL]: 'result = 1.0 0.0, r = D t r ≠ D t',
    [GL.NOTEQUAL]: 'result = 1.0 0.0, r ≠ D t r = D t',
    [GL.ALWAYS]: 'result = 1.0',
    [GL.NEVER]: 'result = 0.0'
  }
};

test('WebGL#Texture2D construct/delete', (t) => {
  const {gl} = fixture;

  t.throws(
    // @ts-expect-error
    () => new Texture2D(),
    /.*WebGLRenderingContext.*/,
    'Texture2D throws on missing gl context'
  );

  const texture = new Texture2D(gl);
  t.ok(texture instanceof Texture2D, 'Texture2D construction successful');

  t.comment(JSON.stringify(texture.getParameters({keys: true})));

  texture.destroy();
  t.ok(texture instanceof Texture2D, 'Texture2D delete successful');

  texture.destroy();
  t.ok(texture instanceof Texture2D, 'Texture2D repeated delete successful');

  t.end();
});

function isFormatSupported(format, glContext) {
  format = Number(format);
  const opts = Object.assign({format}, WEBGL_TEXTURE_FORMATS[format]);
  if (!Texture2D.isSupported(glContext, {format}) || (!isWebGL2(glContext) && opts.compressed)) {
    return false;
  }
  return true;
}

test('WebGL#Texture2D check formats', (t) => {
  const {gl, gl2} = fixture;

  const WEBGL1_FORMATS = [GL.RGB, GL.RGBA];
  const WEBGL2_FORMATS = [GL.R32F, GL.RG32F, GL.RGB32F, GL.RGBA32F];

  let unSupportedFormats = [];
  WEBGL1_FORMATS.forEach((format) => {
    if (!isFormatSupported(format, gl)) {
      unSupportedFormats.push(format);
    }
  });

  t.deepEqual(unSupportedFormats, [], 'All WebGL1 formats are supported');

  if (gl2) {
    const gl2Formats = WEBGL1_FORMATS.concat(WEBGL2_FORMATS);
    unSupportedFormats = [];
    gl2Formats.forEach((format) => {
      if (!isFormatSupported(format, gl2)) {
        unSupportedFormats.push(format);
      }
    });

    t.deepEqual(unSupportedFormats, [], 'All WebGL2 formats are supported');
  } else {
    t.comment('WebGL2 not available, skipping tests');
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

function testFormatCreation(t, glContext, withData = false) {
  for (const formatName in WEBGL_TEXTURE_FORMATS) {
    const formatInfo = WEBGL_TEXTURE_FORMATS[formatName];
    for (let type of formatInfo.types) {
      const format = Number(formatName);
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
        t.ok(
          texture,
          `Texture2D({format: ${getKey(glContext, texture.format)}, type: ${getKey(
            glContext,
            type
          )}, dataFormat: ${getKey(glContext, options.dataFormat)}) created`
        );
        // t.equals(
        //   texture.format,
        //   format,
        //   `Texture2D({format: ${getKey(gl, format)}, type: ${getKey(
        //     GL,
        //     type
        //   )}, dataFormat: ${getKey(gl, options.dataFormat)}) created`
        // );
        texture.destroy();
      }
    }
  }
}

function testFormatDeduction(t, glContext) {
  for (const format in WEBGL_TEXTURE_FORMATS) {
    const formatInfo = WEBGL_TEXTURE_FORMATS[format];
    const expectedType = formatInfo.types[0];
    const expectedDataFormat = formatInfo.dataFormat;
    const options = {
      format: Number(format),
      height: 1,
      width: 1,
      mipmaps: Number(format) !== GL.RGB32F
    };
    if (Texture2D.isSupported(glContext, {format: Number(format)})) {
      const texture = new Texture2D(glContext, options);
      const msg = `Texture2D({format: ${getKey(glContext, format)}}) created`;
      t.equals(texture.glFormat, Number(format), msg);
      t.equals(texture.type, expectedType, msg);
      t.equals(texture.dataFormat, expectedDataFormat, msg);
      texture.destroy();
    }
  }
}

test('WebGL#Texture2D format deduction', (t) => {
  const {gl, gl2} = fixture;
  testFormatDeduction(t, gl);
  if (gl2) {
    testFormatDeduction(t, gl2);
  } else {
    t.comment('WebGL2 not available, skipping tests');
  }
  t.end();
});

test('WebGL#Texture2D format creation', (t) => {
  const {gl, gl2} = fixture;
  testFormatCreation(t, gl);
  if (gl2) {
    // testFormatCreation(t, gl2);
  } else {
    t.comment('WebGL2 not available, skipping tests');
  }
  t.end();
});

test('WebGL#Texture2D format creation with data', (t) => {
  const {gl, gl2} = fixture;
  if (gl2) {
    testFormatCreation(t, gl2, true);
  } else {
    t.comment('WebGL2 not available, skipping tests');
  }
  testFormatCreation(t, gl, true);
  t.end();
});

/*
test('WebGL#Texture2D WebGL1 extension format creation', t => {
  const {gl} = fixture;

  for (const format of WEBGL_TEXTURE_FORMATS) {
  }
  let texture = new Texture2D(gl, {});
  t.ok(texture instanceof Texture2D, 'Texture2D construction successful');

  texture = texture.destroy();
  t.ok(texture instanceof Texture2D, 'Texture2D delete successful');

  t.end();
});

test('WebGL#Texture2D WebGL2 format creation', t => {
  const {gl} = fixture;

  for (const format in WEBGL_TEXTURE_FORMATS) {
    if (!WEBGL1_FORMATS.indexOf(format)) {
    }

  }
  let texture = new Texture2D(gl, {});
  t.ok(texture instanceof Texture2D, 'Texture2D construction successful');

  texture = texture.destroy();
  t.ok(texture instanceof Texture2D, 'Texture2D delete successful');

  t.end();
});
*/

test('WebGL#Texture2D setParameters', (t) => {
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
    `Texture2D.setParameters({[${getKey(gl, parameter)}]: ${getKey(gl, value)}})`);
  */

  texture.destroy();
  t.ok(texture instanceof Texture2D, 'Texture2D delete successful');

  t.end();
});

test('WebGL2#Texture2D setParameters', (t) => {
  const {gl2} = fixture;

  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  let texture = new Texture2D(gl2, {});
  t.ok(texture instanceof Texture2D, 'Texture2D construction successful');

  testSamplerParameters({t, texture, parameters: SAMPLER_PARAMETERS_WEBGL2});

  texture.destroy();
  t.ok(texture instanceof Texture2D, 'Texture2D delete successful');

  t.end();
});

test('WebGL#Texture2D NPOT Workaround: texture creation', (t) => {
  const {gl} = fixture;

  // Create NPOT texture with no parameters
  let texture = new Texture2D(gl, {data: null, width: 500, height: 512});
  t.ok(texture instanceof Texture2D, 'Texture2D construction successful');

  // Default parameters should be changed to supported NPOT parameters.
  let minFilter = texture.getParameter(GL.TEXTURE_MIN_FILTER);
  t.equals(minFilter, GL.LINEAR, 'NPOT texture min filter is set to LINEAR');
  let wrapS = texture.getParameter(GL.TEXTURE_WRAP_S);
  t.equals(wrapS, GL.CLAMP_TO_EDGE, 'NPOT texture wrap_s is set to CLAMP_TO_EDGE');
  let wrapT = texture.getParameter(GL.TEXTURE_WRAP_T);
  t.equals(wrapT, GL.CLAMP_TO_EDGE, 'NPOT texture wrap_t is set to CLAMP_TO_EDGE');

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
  t.equals(minFilter, GL.NEAREST, 'NPOT texture min filter is set to NEAREST');
  wrapS = texture.getParameter(GL.TEXTURE_WRAP_S);
  t.equals(wrapS, GL.CLAMP_TO_EDGE, 'NPOT texture wrap_s is set to CLAMP_TO_EDGE');
  wrapT = texture.getParameter(GL.TEXTURE_WRAP_T);
  t.equals(wrapT, GL.CLAMP_TO_EDGE, 'NPOT texture wrap_t is set to CLAMP_TO_EDGE');

  t.end();
});

test('WebGL#Texture2D NPOT Workaround: setParameters', (t) => {
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
  t.equals(minFilter, GL.LINEAR, 'NPOT texture min filter is set to LINEAR');
  const wrapS = texture.getParameter(GL.TEXTURE_WRAP_S);
  t.equals(wrapS, GL.CLAMP_TO_EDGE, 'NPOT texture wrap_s is set to CLAMP_TO_EDGE');
  const wrapT = texture.getParameter(GL.TEXTURE_WRAP_T);
  t.equals(wrapT, GL.CLAMP_TO_EDGE, 'NPOT texture wrap_t is set to CLAMP_TO_EDGE');

  t.end();
});

test('WebGL2#Texture2D NPOT Workaround: texture creation', (t) => {
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
    'NPOT texture min filter is set to NEAREST_MIPMAP_LINEAR'
  );
  let wrapS = texture.getParameter(GL.TEXTURE_WRAP_S);
  t.equals(wrapS, GL.REPEAT, 'NPOT texture wrap_s is set to REPEAT');
  let wrapT = texture.getParameter(GL.TEXTURE_WRAP_T);
  t.equals(wrapT, GL.REPEAT, 'NPOT texture wrap_t is set to REPEAT');

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
  t.equals(minFilter, GL.NEAREST, 'NPOT texture min filter is set to NEAREST');
  wrapS = texture.getParameter(GL.TEXTURE_WRAP_S);
  t.equals(wrapS, GL.REPEAT, 'NPOT texture wrap_s is set to REPEAT');
  wrapT = texture.getParameter(GL.TEXTURE_WRAP_T);
  t.equals(wrapT, GL.MIRRORED_REPEAT, 'NPOT texture wrap_t is set to MIRRORED_REPEAT');

  t.end();
});

test('WebGL2#Texture2D NPOT Workaround: setParameters', (t) => {
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
    'NPOT texture min filter is set to LINEAR_MIPMAP_NEAREST'
  );
  const wrapS = texture.getParameter(GL.TEXTURE_WRAP_S);
  t.equals(wrapS, GL.MIRRORED_REPEAT, 'NPOT texture wrap_s is set to MIRRORED_REPEAT');
  const wrapT = texture.getParameter(GL.TEXTURE_WRAP_T);
  t.equals(wrapT, GL.REPEAT, 'NPOT texture wrap_t is set to REPEAT');

  t.end();
});

test('WebGL1#Texture2D setImageData', (t) => {
  const {gl} = fixture;

  const texture = new Texture2D(gl, {data: null, width: 2, height: 1, mipmaps: false});
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
    const ctx = canvas.getContext('2d')!;
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

test('WebGL2#Texture2D setImageData', (t) => {
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
    mipmaps: false
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

test('WebGL1#Texture2D setSubImageData', (t) => {
  const {gl} = fixture;

  // data: null
  const texture = new Texture2D(gl, {data: null, width: 2, height: 1, mipmaps: false});
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

test('WebGL2#Texture2D setSubImageData', (t) => {
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

test('WebGL2#Texture2D resize', (t) => {
  const {gl} = fixture;
  let texture = new Texture2D(gl, {
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

  texture = new Texture2D(gl, {
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

test('WebGL2#Texture2D generateMipmap', (t) => {
  const {gl} = fixture;
  let texture = new Texture2D(gl, {
    data: null,
    width: 3,
    height: 3,
    mipmaps: false
  });

  texture.generateMipmap();
  t.notOk(texture.mipmaps, 'Should not turn on mipmaps for NPOT.');

  texture = new Texture2D(gl, {
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
      const newValue = texture.getParameter(parameter);
      t.equals(
        newValue,
        value,
        // `${name}.setParameters({[${getKey(gl, parameter)}]: ${getKey(gl, value)}}) read back OK`
        `${name}.setParameters({[${parameter}]: ${value}}) read back OK`
      );
    }
  }
}
