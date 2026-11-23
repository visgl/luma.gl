// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {WgslReflect} from 'wgsl_reflect';
import {SELECTION_OUTLINE_SHADER} from '../../src/rendering/selection-outline-shaders';

it('selection outline uses exact integer IDs and the declared 32-byte uniform layout', () => {
  const reflection = new WgslReflect(SELECTION_OUTLINE_SHADER);
  const uniforms = reflection.uniforms[0];
  expect(uniforms.size).toBe(32);
  expect(uniforms.members?.map(member => [member.name, member.offset])).toEqual([
    ['color', 0],
    ['selectedIdentifier', 16],
    ['width', 20],
    ['viewportOrigin', 24]
  ]);
  expect(reflection.textures[0].type.name).toBe('texture_2d');
  expect(reflection.entry.vertex[0].name).toBe('vertexMain');
  expect(reflection.entry.fragment[0].name).toBe('fragmentMain');
});
