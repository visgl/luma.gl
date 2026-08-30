// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  convertSampler,
  convertSamplerToGLTF
} from '@luma.gl/gltf/webgl-to-webgpu/convert-webgl-sampler';
import {GLEnum} from '@luma.gl/gltf/webgl-to-webgpu/gltf-webgl-constants';
import {convertSamplerParametersToWebGL} from '@luma.gl/webgl/adapter/converters/sampler-parameters';
import {expect, it} from 'vitest';

export function registerConvertWebGLSamplerTests(): void {
  it('pbr#convertSampler#minFilter', () => {
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

      expect(glValues.length, 'Should return 1 value').toBe(1);
      expect(glValues[0], 'Value matches minFilter').toBe(minFilter);
    });

    expect(convertSampler({}), 'undefined sampler values are omitted').toEqual({});
  });

  it('pbr#convertSampler#magFilter', () => {
    [GLEnum.NEAREST, GLEnum.LINEAR].forEach(magFilter => {
      const props = convertSampler({magFilter});
      const gl = convertSamplerParametersToWebGL(props);
      const glValues = Object.values(gl);

      expect(glValues.length, 'Should return 1 value').toBe(1);
      expect(glValues[0], 'Value matches magFilter').toBe(magFilter);
    });
  });

  it('pbr#convertSampler#wrap', () => {
    [GLEnum.CLAMP_TO_EDGE, GLEnum.REPEAT, GLEnum.MIRRORED_REPEAT].forEach(wrap => {
      const props = convertSampler({wrapS: wrap, wrapT: wrap});
      const gl = convertSamplerParametersToWebGL(props);
      const glValues = Object.values(gl);

      expect(glValues.length, 'Should return 2 values').toBe(2);
      expect(glValues[0], 'Value matches wrapT').toBe(wrap);
      expect(glValues[1], 'Value matches wrapS').toBe(wrap);
    });

    const mixed = convertSampler({
      wrapS: GLEnum.REPEAT,
      wrapT: GLEnum.CLAMP_TO_EDGE,
      minFilter: GLEnum.LINEAR_MIPMAP_LINEAR,
      magFilter: GLEnum.LINEAR
    });
    expect(mixed, 'mixed sampler props are converted without dropping fields').toEqual({
      addressModeU: 'repeat',
      addressModeV: 'clamp-to-edge',
      minFilter: 'linear',
      mipmapFilter: 'linear',
      magFilter: 'linear'
    });
  });

  it('pbr#convertSampler preserves postprocessed loaders.gl sampler parameters', () => {
    const sampler = convertSampler({
      parameters: {
        [GLEnum.TEXTURE_WRAP_S]: GLEnum.CLAMP_TO_EDGE,
        [GLEnum.TEXTURE_WRAP_T]: GLEnum.MIRRORED_REPEAT,
        [GLEnum.TEXTURE_MAG_FILTER]: GLEnum.NEAREST,
        [GLEnum.TEXTURE_MIN_FILTER]: GLEnum.NEAREST_MIPMAP_LINEAR
      }
    });

    expect(
      sampler,
      'numeric postprocessed WebGL parameter keys preserve filtering and wrapping'
    ).toEqual({
      addressModeU: 'clamp-to-edge',
      addressModeV: 'mirror-repeat',
      magFilter: 'nearest',
      minFilter: 'nearest',
      mipmapFilter: 'linear'
    });
    expect(
      convertSampler({
        wrapS: GLEnum.REPEAT,
        parameters: {[GLEnum.TEXTURE_WRAP_S]: GLEnum.CLAMP_TO_EDGE}
      }),
      'explicit source glTF fields override postprocessed fallback values'
    ).toEqual({addressModeU: 'repeat'});
  });

  it('pbr#convertSamplerToGLTF preserves every minification and mipmap combination', () => {
    for (const minFilter of [
      GLEnum.NEAREST,
      GLEnum.LINEAR,
      GLEnum.NEAREST_MIPMAP_NEAREST,
      GLEnum.LINEAR_MIPMAP_NEAREST,
      GLEnum.NEAREST_MIPMAP_LINEAR,
      GLEnum.LINEAR_MIPMAP_LINEAR
    ]) {
      expect(
        convertSamplerToGLTF(convertSampler({minFilter})).minFilter,
        'glTF filtering round-trips through canonical portable sampler props'
      ).toBe(minFilter);
    }

    expect(
      convertSamplerToGLTF({
        addressModeU: 'clamp-to-edge',
        addressModeV: 'mirror-repeat',
        magFilter: 'nearest',
        minFilter: 'linear',
        mipmapFilter: 'nearest'
      }),
      'authored portable sampler settings serialize into glTF WebGL enums'
    ).toEqual({
      wrapS: GLEnum.CLAMP_TO_EDGE,
      wrapT: GLEnum.MIRRORED_REPEAT,
      magFilter: GLEnum.NEAREST,
      minFilter: GLEnum.LINEAR_MIPMAP_NEAREST
    });
  });
}
