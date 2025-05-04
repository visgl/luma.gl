// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {GL} from '@luma.gl/constants/webgl-constants';
import {convertSampler} from '@luma.gl/gltf/webgl-to-webgpu/convert-webgl-sampler';
import {convertSamplerParametersToWebGL} from '@luma.gl/webgl/adapter/converters/sampler-parameters';
import test from 'tape-promise/tape';

test('pbr#convertSampler#minFilter', async t => {
  [
    GL.NEAREST,
    GL.LINEAR,
    GL.NEAREST_MIPMAP_NEAREST,
    GL.LINEAR_MIPMAP_NEAREST,
    GL.NEAREST_MIPMAP_LINEAR,
    GL.LINEAR_MIPMAP_LINEAR
  ].forEach(minFilter => {
    const props = convertSampler({minFilter});
    const gl = convertSamplerParametersToWebGL(props);
    const glValues = Object.values(gl);

    t.equals(glValues.length, 1, 'Should return 1 value');
    t.equals(glValues[0], minFilter, 'Value matches minFilter');
  });

  t.end();
});

test('pbr#convertSampler#magFilter', async t => {
  [GL.NEAREST, GL.LINEAR].forEach(magFilter => {
    const props = convertSampler({magFilter});
    const gl = convertSamplerParametersToWebGL(props);
    const glValues = Object.values(gl);

    t.equals(glValues.length, 1, 'Should return 1 value');
    t.equals(glValues[0], magFilter, 'Value matches magFilter');
  });

  t.end();
});

test('pbr#convertSampler#wrap', async t => {
  [GL.CLAMP_TO_EDGE, GL.REPEAT, GL.MIRRORED_REPEAT].forEach(wrap => {
    const props = convertSampler({wrapS: wrap, wrapT: wrap});
    const gl = convertSamplerParametersToWebGL(props);
    const glValues = Object.values(gl);

    t.equals(glValues.length, 2, 'Should return 2 values');
    t.equals(glValues[0], wrap, 'Value matches wrapT');
    t.equals(glValues[1], wrap, 'Value matches wrapS');
  });

  t.end();
});
