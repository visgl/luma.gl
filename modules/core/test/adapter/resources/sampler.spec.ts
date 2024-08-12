// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test, {Test} from 'tape-promise/tape';
import {webglDevice} from '@luma.gl/test-utils';

import {Device, Sampler} from '@luma.gl/core';

// Sampler Parameters

export const SAMPLER_PARAMETERS = {
  minFilter: {
    linear: 'interpolated texel',
    nearest: 'nearest texel'
  },

  magFilter: {
    linear: 'interpolated texel',
    nearest: 'nearest texel'
  },

  mipmapFilter: {
    linear: 'interpolated between mipmaps',
    nearest: 'nearest mipmap'
  },

  addressModeU: {
    repeat: 'use fractional part of texture coordinates',
    'clamp-to-edge': 'clamp texture coordinates',
    'mirrored-repeat':
      'use fractional part of texture coordinate if integer part is odd, otherwise `1 - frac'
  },

  addressModeV: {
    repeat: 'use fractional part of texture coordinates',
    'clamp-to-edge': 'clamp texture coordinates',
    'mirrored-repeat':
      'use fractional part of texture coordinate if integer part is odd, otherwise `1 - frac'
  },

  addressModeW: {
    repeat: 'use fractional part of texture coordinates',
    'clamp-to-edge': 'clamp texture coordinates',
    'mirrored-repeat':
      'use fractional part of texture coordinate if integer part is odd, otherwise `1 - frac'
  }

  /*
  TEXTUR_COMPARE_MODE]: {
    NONE]: 'no comparison of `r` coordinate is performed',
    COMPARE_REF_TO_TEXTURE]:
      'interpolated and clamped `r` texture coordinate is compared to currently bound depth texture, result is assigned to the red channel'
  },

  COMPARE_FUNC]: {
    LEQUAL]: 'result = 1.0 0.0, r <= D t r > D t',
    GEQUAL]: 'result = 1.0 0.0, r >= D t r < D t',
    LESS]: 'result = 1.0 0.0, r < D t r >= D t',
    GREATER]: 'result = 1.0 0.0, r > D t r <= D t',
    EQUAL]: 'result = 1.0 0.0, r = D t r ≠ D t',
    NOTEQUAL]: 'result = 1.0 0.0, r ≠ D t r = D t',
    ALWAYS]: 'result = 1.0',
    NEVER]: 'result = 0.0'
  }
  */
};

test('WebGL#Sampler setParameters', t => {
  testSampler(t, webglDevice);
  testSampler(t, webglDevice);
  // testSampler(t, webgpuDevice);
  t.end();
});

function testSampler(t: Test, device: Device): void {
  for (const pname in SAMPLER_PARAMETERS) {
    const parameter = Number(pname);
    const values = SAMPLER_PARAMETERS[parameter];
    for (const valueString in values) {
      const value = Number(valueString);
      const sampler = device.createSampler({[parameter]: value});
      t.ok(
        sampler instanceof Sampler,
        `${device.type} new Sampler({${pname}: ${valueString}}) constructed.`
      );
      sampler.destroy();
    }
  }
}

/*
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

function getParameter(texture: Texture, pname: number): any {
  const webglTexture = texture as WEBGLTexture;
  webglTexture.gl.bindTexture(webglTexture.target, webglTexture.handle);
  const value = webglTexture.gl.getTexParameter(webglTexture.target, pname);
  webglTexture.gl.bindTexture(webglTexture.target, null);
  return value;
}
test.skip('WebGL2#Texture setParameters', t => {
  const texture = webglDevice.createTexture({});
  t.ok(texture instanceof Texture, 'Texture construction successful');

  testSamplerParameters({t, texture, parameters: SAMPLER_PARAMETERS_WEBGL2});

  texture.destroy();
  t.ok(texture instanceof Texture, 'Texture delete successful');

  t.end();
});

*/
