// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  convertSampler,
  convertSamplerToGLTF
} from '@luma.gl/gltf/webgl-to-webgpu/convert-webgl-sampler';
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

  test('pbr#convertSampler preserves postprocessed loaders.gl sampler parameters', async t => {
    const sampler = convertSampler({
      parameters: {
        [GLEnum.TEXTURE_WRAP_S]: GLEnum.CLAMP_TO_EDGE,
        [GLEnum.TEXTURE_WRAP_T]: GLEnum.MIRRORED_REPEAT,
        [GLEnum.TEXTURE_MAG_FILTER]: GLEnum.NEAREST,
        [GLEnum.TEXTURE_MIN_FILTER]: GLEnum.NEAREST_MIPMAP_LINEAR
      }
    });

    t.deepEqual(
      sampler,
      {
        addressModeU: 'clamp-to-edge',
        addressModeV: 'mirror-repeat',
        magFilter: 'nearest',
        minFilter: 'nearest',
        mipmapFilter: 'linear'
      },
      'numeric postprocessed WebGL parameter keys preserve filtering and wrapping'
    );
    t.deepEqual(
      convertSampler({
        wrapS: GLEnum.REPEAT,
        parameters: {[GLEnum.TEXTURE_WRAP_S]: GLEnum.CLAMP_TO_EDGE}
      }),
      {addressModeU: 'repeat'},
      'explicit source glTF fields override postprocessed fallback values'
    );
    t.end();
  });

  test('pbr#convertSamplerToGLTF preserves every minification and mipmap combination', async t => {
    for (const minFilter of [
      GLEnum.NEAREST,
      GLEnum.LINEAR,
      GLEnum.NEAREST_MIPMAP_NEAREST,
      GLEnum.LINEAR_MIPMAP_NEAREST,
      GLEnum.NEAREST_MIPMAP_LINEAR,
      GLEnum.LINEAR_MIPMAP_LINEAR
    ]) {
      t.equal(
        convertSamplerToGLTF(convertSampler({minFilter})).minFilter,
        minFilter,
        'glTF filtering round-trips through canonical portable sampler props'
      );
    }

    t.deepEqual(
      convertSamplerToGLTF({
        addressModeU: 'clamp-to-edge',
        addressModeV: 'mirror-repeat',
        magFilter: 'nearest',
        minFilter: 'linear',
        mipmapFilter: 'nearest'
      }),
      {
        wrapS: GLEnum.CLAMP_TO_EDGE,
        wrapT: GLEnum.MIRRORED_REPEAT,
        magFilter: GLEnum.NEAREST,
        minFilter: GLEnum.LINEAR_MIPMAP_NEAREST
      },
      'authored portable sampler settings serialize into glTF WebGL enums'
    );
    t.end();
  });
}
