/* eslint-disable max-len */
import test from 'tape-catch';
import 'luma.gl/headless';
import {GL, createGLContext, Texture2D, glKey} from 'luma.gl';

import {TEXTURE_FORMATS} from '../../src/webgl/texture';
import {
  testSamplerParameters, SAMPLER_PARAMETERS, SAMPLER_PARAMETERS_WEBGL2
} from './sampler.utils';

const fixture = {
  gl: createGLContext(),
  gl2: createGLContext({webgl2: true, webgl1: false, throwOnFailure: false})
};

test('WebGL#Texture2D construct/delete', t => {
  const {gl} = fixture;

  t.throws(
    () => new Texture2D(),
    /.*WebGLRenderingContext.*/,
    'Texture2D throws on missing gl context');

  const texture = new Texture2D(gl);
  t.ok(texture instanceof Texture2D, 'Texture2D construction successful');

  t.comment(JSON.stringify(texture.getParameters({keys: true})));

  texture.delete();
  t.ok(texture instanceof Texture2D, 'Texture2D delete successful');

  texture.delete();
  t.ok(texture instanceof Texture2D, 'Texture2D repeated delete successful');

  t.end();
});

test('WebGL#Texture2D check formats', t => {
  const {gl} = fixture;

  const WEBGL1_FORMATS = [GL.RGB, GL.RGBA, GL.LUMINANCE_ALPHA, GL.LUMINANCE, GL.ALPHA];

  let supportedFormats = 0;
  for (let format in TEXTURE_FORMATS) {
    format = Number(format);
    const opts = Object.assign({format}, TEXTURE_FORMATS[format]);
    if (Texture2D.isSupported(gl, {format}) && !opts.compressed) {
      supportedFormats++;
    }
  }
  t.ok(supportedFormats >= WEBGL1_FORMATS.length,
    'Texture2D - Correct number of formats supported in WebGL1');

  t.end();
});

test('WebGL#Texture2D format creation', t => {
  const {gl} = fixture;

  for (let format in TEXTURE_FORMATS) {
    const textureFormat = TEXTURE_FORMATS[format];

    format = Number(format);
    if (Texture2D.isSupported(gl, {format}) && !textureFormat.compressed) {

      // const opts = Object.assign({format}, textureFormat);
      // const texture = new Texture2D(gl, opts);
      // t.equals(texture.format, format,
      //   `Texture2D(${glKey(format)}) created with correct format`);

      // texture.delete();
    }
  }

  t.end();
});

const RGB_TO = {
  [GL.UNSIGNED_BYTE]: (r, g, b) => [r * 256, g * 256, b * 256],
  [GL.UNSIGNED_SHORT_5_6_5]: (r, g, b) => r * 32 << 11 + g * 64 << 6 + b * 32
};
// const RGB_FROM = {
//   [GL.UNSIGNED_BYTE]: v => [v[0] / 256, v[1] / 256, v[2] / 256],
//   [GL.UNSIGNED_SHORT_5_6_5]: v => [v >> 11 / 32, v >> 6 % 64 / 64, v % 32 * 32]
// };

const DATA = [1, 0.5, 0.25, 0.125];
const TEXTURE_DATA = {
  [GL.UNSIGNED_BYTE]: new Uint8Array(RGB_TO[GL.UNSIGNED_BYTE](DATA)),
  [GL.UNSIGNED_SHORT_5_6_5]: new Uint16Array(RGB_TO[GL.UNSIGNED_SHORT_5_6_5](DATA))
};
const DEFAULT_TEXTURE_DATA = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

test('WebGL2#Texture2D format creation', t => {
  const {gl2} = fixture;

  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  for (let format in TEXTURE_FORMATS) {
    const textureFormat = TEXTURE_FORMATS[format];

    const {dataFormat, types, compressed} = textureFormat;
    format = Number(format);

    if (Texture2D.isSupported(gl2, {format}) && !compressed) {

      let texture;

      for (const type of types) {
        // texture = new Texture2D(gl2, Object.assign({format, dataFormat, type}));
        // t.equals(texture.format, format,
        //   `Texture2D({format: ${glKey(format)}, type: ${glKey(type)}, dataFormat: ${glKey(dataFormat)}) created`);
        // texture.delete()
        const data = TEXTURE_DATA[type] || DEFAULT_TEXTURE_DATA;
        texture = new Texture2D(gl2, {format, dataFormat, type, data, width: 1, height: 1});
        t.equals(texture.format, format,
          `Texture2D({format: ${glKey(format)}, type: ${glKey(type)}, dataFormat: ${glKey(dataFormat)}) created`);
        texture.delete();
      }
    }
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
    `Texture2D.setParameters({[${glKey(parameter)}]: ${glKey(value)}})`);
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
