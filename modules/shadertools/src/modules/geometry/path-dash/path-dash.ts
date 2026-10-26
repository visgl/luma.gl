// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ShaderModule} from '../../../lib/shader-module/shader-module';

export type PathDashUniforms = {dashLength: number; gapLength: number; offset: number};
export type PathDashProps = Partial<PathDashUniforms>;
const DEFAULT_UNIFORMS: PathDashUniforms = {dashLength: 12, gapLength: 8, offset: 0};

/** Filtered dash coverage from cumulative path distance, independent of coordinate units. */
export const pathDash: ShaderModule<PathDashProps, PathDashUniforms> = {
  name: 'pathDash',
  bindingLayout: [{name: 'pathDash', group: 3}],
  firstBindingSlot: 0,
  uniformTypes: {dashLength: 'f32', gapLength: 'f32', offset: 'f32'},
  defaultUniforms: DEFAULT_UNIFORMS,
  getUniforms(props = {}, previousUniforms = DEFAULT_UNIFORMS) {
    const uniforms = {...DEFAULT_UNIFORMS, ...previousUniforms};
    if (props.dashLength !== undefined) uniforms.dashLength = Math.max(0, props.dashLength);
    if (props.gapLength !== undefined) uniforms.gapLength = Math.max(0, props.gapLength);
    if (props.offset !== undefined) uniforms.offset = props.offset;
    return uniforms;
  },
  fs: /* glsl */ `
layout(std140) uniform pathDashUniforms {
  float dashLength;
  float gapLength;
  float offset;
} pathDash;
float pathDash_integral(float coordinate, float fraction) {
  return floor(coordinate) * fraction + min(fract(coordinate), fraction);
}
float pathDash_getCoverage(float distanceAlongPath) {
  float period = max(pathDash.dashLength + pathDash.gapLength, 0.0001);
  float coordinate = (distanceAlongPath + pathDash.offset) / period;
  float extent = max(fwidth(coordinate), 0.0001);
  float center = fract(coordinate);
  float fraction = pathDash.dashLength / period;
  float coverage = (pathDash_integral(center + extent * 0.5, fraction) - pathDash_integral(center - extent * 0.5, fraction)) / extent;
  if (pathDash.gapLength <= 0.0) return 1.0;
  if (pathDash.dashLength <= 0.0) return 0.0;
  return clamp(coverage, 0.0, 1.0);
}
`,
  source: /* wgsl */ `
struct pathDashUniforms {
  dashLength: f32,
  gapLength: f32,
  offset: f32,
};
@group(3) @binding(auto) var<uniform> pathDash: pathDashUniforms;
fn pathDash_integral(coordinate: f32, fraction: f32) -> f32 {
  return floor(coordinate) * fraction + min(fract(coordinate), fraction);
}
fn pathDash_getCoverage(distanceAlongPath: f32) -> f32 {
  let period = max(pathDash.dashLength + pathDash.gapLength, 0.0001);
  let coordinate = (distanceAlongPath + pathDash.offset) / period;
  let extent = max(fwidth(coordinate), 0.0001);
  let center = fract(coordinate);
  let fraction = pathDash.dashLength / period;
  let coverage = (pathDash_integral(center + extent * 0.5, fraction) - pathDash_integral(center - extent * 0.5, fraction)) / extent;
  if (pathDash.gapLength <= 0.0) { return 1.0; }
  if (pathDash.dashLength <= 0.0) { return 0.0; }
  return clamp(coverage, 0.0, 1.0);
}
`
};
