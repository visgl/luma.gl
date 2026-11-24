// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getGLSLLanguageFeatures} from '@luma.gl/core/webgl/context/helpers/webgl-extensions';

it('maps supported WebGL extensions to unique GLSL directive names', () => {
  const gl = {
    getSupportedExtensions: () => [
      'WEBGL_clip_cull_distance',
      'WEBGL_multi_draw',
      'WEBGL_multi_draw_instanced_base_vertex_base_instance',
      'EXT_conservative_depth',
      'KHR_parallel_shader_compile'
    ]
  };

  expect(getGLSLLanguageFeatures(gl)).toEqual(
    new Set(['GL_ANGLE_clip_cull_distance', 'GL_ANGLE_multi_draw', 'GL_EXT_conservative_depth'])
  );
});

it('returns an empty set when the context does not report extensions', () => {
  expect(getGLSLLanguageFeatures({getSupportedExtensions: () => null}).size).toBe(0);
});
