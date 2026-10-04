// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ShaderModule} from '../../../lib/shader-module/shader-module';
import {PATTERN_FILL_GLSL, PATTERN_FILL_WGSL} from './pattern-fill-shaders';

export type PatternFillUniforms = {
  patternType: number;
  spacing: number;
  width: number;
  angle: number;
  offset: readonly [number, number];
};

export type PatternFillProps = Partial<Omit<PatternFillUniforms, 'patternType'>> & {
  pattern?: 'hatch' | 'crosshatch' | 'dots';
};

const DEFAULT_UNIFORMS: PatternFillUniforms = {
  patternType: 0,
  spacing: 8,
  width: 0.12,
  angle: Math.PI / 4,
  offset: [0, 0]
};

/** Fragment coverage for coordinate-anchored, filtered hatch and dot fills. */
export const patternFill: ShaderModule<PatternFillProps, PatternFillUniforms> = {
  name: 'patternFill',
  firstBindingSlot: 0,
  bindingLayout: [{name: 'patternFill', group: 3}],
  source: PATTERN_FILL_WGSL,
  fs: PATTERN_FILL_GLSL,
  uniformTypes: {
    patternType: 'i32',
    spacing: 'f32',
    width: 'f32',
    angle: 'f32',
    offset: 'vec2<f32>'
  },
  defaultUniforms: DEFAULT_UNIFORMS,
  getUniforms(props = {}, previousUniforms = DEFAULT_UNIFORMS) {
    const uniforms = {...DEFAULT_UNIFORMS, ...previousUniforms};
    if (props.pattern !== undefined) {
      uniforms.patternType = {hatch: 0, crosshatch: 1, dots: 2}[props.pattern];
    }
    if (props.spacing !== undefined) uniforms.spacing = Math.max(props.spacing, 0.0001);
    if (props.width !== undefined) uniforms.width = Math.min(1, Math.max(0, props.width));
    if (props.angle !== undefined) uniforms.angle = props.angle;
    if (props.offset !== undefined) uniforms.offset = props.offset;
    return uniforms;
  }
};
