import {expect, test} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import { GL } from '@luma.gl/constants/webgl-constants';
import { convertSampler } from '@luma.gl/gltf/webgl-to-webgpu/convert-webgl-sampler';
import { convertSamplerParametersToWebGL } from '@luma.gl/webgl/adapter/converters/sampler-parameters';
export function registerConvertWebGLSamplerTests(): void {
  test('pbr#convertSampler#minFilter', async () => {
    [GL.NEAREST, GL.LINEAR, GL.NEAREST_MIPMAP_NEAREST, GL.LINEAR_MIPMAP_NEAREST, GL.NEAREST_MIPMAP_LINEAR, GL.LINEAR_MIPMAP_LINEAR].forEach(minFilter => {
      const props = convertSampler({
        minFilter
      });
      const gl = convertSamplerParametersToWebGL(props);
      const glValues = Object.values(gl);
      expect(glValues.length, 'Should return 1 value').toBe(1);
      expect(glValues[0], 'Value matches minFilter').toBe(minFilter);
    });
    expect(convertSampler({}), 'undefined sampler values are omitted').toEqual({});
  });
  test('pbr#convertSampler#magFilter', async () => {
    [GL.NEAREST, GL.LINEAR].forEach(magFilter => {
      const props = convertSampler({
        magFilter
      });
      const gl = convertSamplerParametersToWebGL(props);
      const glValues = Object.values(gl);
      expect(glValues.length, 'Should return 1 value').toBe(1);
      expect(glValues[0], 'Value matches magFilter').toBe(magFilter);
    });
  });
  test('pbr#convertSampler#wrap', async () => {
    [GL.CLAMP_TO_EDGE, GL.REPEAT, GL.MIRRORED_REPEAT].forEach(wrap => {
      const props = convertSampler({
        wrapS: wrap,
        wrapT: wrap
      });
      const gl = convertSamplerParametersToWebGL(props);
      const glValues = Object.values(gl);
      expect(glValues.length, 'Should return 2 values').toBe(2);
      expect(glValues[0], 'Value matches wrapT').toBe(wrap);
      expect(glValues[1], 'Value matches wrapS').toBe(wrap);
    });
    const mixed = convertSampler({
      wrapS: GL.REPEAT,
      wrapT: GL.CLAMP_TO_EDGE,
      minFilter: GL.LINEAR_MIPMAP_LINEAR,
      magFilter: GL.LINEAR
    });
    expect(mixed, 'mixed sampler props are converted without dropping fields').toEqual({
      addressModeU: 'repeat',
      addressModeV: 'clamp-to-edge',
      minFilter: 'linear',
      mipmapFilter: 'linear',
      magFilter: 'linear'
    });
  });
}
