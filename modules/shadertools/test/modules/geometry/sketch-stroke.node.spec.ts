// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {
  getShaderModuleUniformLayoutValidationResult,
  getShaderModuleUniforms,
  sketchStroke
} from '@luma.gl/shadertools';

test('sketch stroke uniforms agree with both shader layouts', () => {
  for (const stage of ['vertex', 'fragment', 'wgsl'] as const) {
    expect(getShaderModuleUniformLayoutValidationResult(sketchStroke, stage)?.matches).toBe(true);
  }
});

test('solid strokes and zero extension remain explicit overrides', () => {
  const values = getShaderModuleUniforms(
    sketchStroke,
    {sketch: 0, extension: 0, width: 4, minimumAntialias: 0},
    {}
  );
  expect(values.sketch).toBe(0);
  expect(values.extension).toBe(0);
  expect(values.width).toBe(4);
  expect(values.minimumAntialias).toBe(0);
  expect(sketchStroke.defaultUniforms.minimumAntialias).toBe(0.7);
  expect(sketchStroke.defaultUniforms.width).toBe(2);
});
