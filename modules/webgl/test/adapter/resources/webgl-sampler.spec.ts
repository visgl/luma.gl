import test, {Test} from 'tape-promise/tape';
import {webgl1Device, webgl2Device} from '@luma.gl/test-utils';

import {Device, Sampler} from '@luma.gl/api';

// Sampler Parameters

export const SAMPLER_PARAMETERS = {
  minFilter: {
    linear: 'interpolated texel',
    nearest: 'nearest texel',
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
    'repeat': 'use fractional part of texture coordinates',
    'clamp-to-edge': 'clamp texture coordinates',
    'mirrored-repeat': 'use fractional part of texture coordinate if integer part is odd, otherwise `1 - frac'
  },

  addressModeV: {
    'repeat': 'use fractional part of texture coordinates',
    'clamp-to-edge': 'clamp texture coordinates',
    'mirrored-repeat': 'use fractional part of texture coordinate if integer part is odd, otherwise `1 - frac'
  },

  addressModeW: {
    'repeat': 'use fractional part of texture coordinates',
    'clamp-to-edge': 'clamp texture coordinates',
    'mirrored-repeat': 'use fractional part of texture coordinate if integer part is odd, otherwise `1 - frac'
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
  testSampler(t, webgl1Device);
  testSampler(t, webgl2Device);
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
      t.ok(sampler instanceof Sampler, `${device.info.type} new Sampler({${pname}: ${valueString}}) constructed.`);
      sampler.destroy();
    }
  }
}
