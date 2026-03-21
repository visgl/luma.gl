// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {convertSampler} from '@luma.gl/gltf/webgl-to-webgpu/convert-webgl-sampler';
import {GLEnum} from '@luma.gl/gltf/webgl-to-webgpu/gltf-webgl-constants';
import {convertSamplerParametersToWebGL} from '@luma.gl/webgl/adapter/converters/sampler-parameters';
import type {TapeTestFunction} from 'test/utils/vitest-tape';

export function registerConvertWebGLSamplerTests(test: TapeTestFunction): void {
  test('pbr#convertSampler#minFilter', async t => {
    [
      GLEnum.NEAREST,
      GLEnum.LINEAR,
      GLEnum.NEAREST_MIPMAP_NEAREST,
      GLEnum.LINEAR_MIPMAP_NEAREST,
      GLEnum.NEAREST_MIPMAP_LINEAR,
      GLEnum.LINEAR_MIPMAP_LINEAR
    ].forEach(minFilter => {
      const props = convertSampler({minFilter});
      const gl = convertSamplerParametersToWebGL(props);
      const glValues = Object.values(gl);

      t.equals(glValues.length, 1, 'Should return 1 value');
      t.equals(glValues[0], minFilter, 'Value matches minFilter');
    });

    t.deepEqual(convertSampler({}), {}, 'undefined sampler values are omitted');

    t.end();
  });

  test('pbr#convertSampler#magFilter', async t => {
    [GLEnum.NEAREST, GLEnum.LINEAR].forEach(magFilter => {
      const props = convertSampler({magFilter});
      const gl = convertSamplerParametersToWebGL(props);
      const glValues = Object.values(gl);

      t.equals(glValues.length, 1, 'Should return 1 value');
      t.equals(glValues[0], magFilter, 'Value matches magFilter');
    });

    t.end();
  });

  test('pbr#convertSampler#wrap', async t => {
    [GLEnum.CLAMP_TO_EDGE, GLEnum.REPEAT, GLEnum.MIRRORED_REPEAT].forEach(wrap => {
      const props = convertSampler({wrapS: wrap, wrapT: wrap});
      const gl = convertSamplerParametersToWebGL(props);
      const glValues = Object.values(gl);

      t.equals(glValues.length, 2, 'Should return 2 values');
      t.equals(glValues[0], wrap, 'Value matches wrapT');
      t.equals(glValues[1], wrap, 'Value matches wrapS');
    });

    const mixed = convertSampler({
      wrapS: GLEnum.REPEAT,
      wrapT: GLEnum.CLAMP_TO_EDGE,
      minFilter: GLEnum.LINEAR_MIPMAP_LINEAR,
      magFilter: GLEnum.LINEAR
    });
    t.deepEqual(
      mixed,
      {
        addressModeU: 'repeat',
        addressModeV: 'clamp-to-edge',
        minFilter: 'linear',
        mipmapFilter: 'linear',
        magFilter: 'linear'
      },
      'mixed sampler props are converted without dropping fields'
    );

    t.end();
  });
}
