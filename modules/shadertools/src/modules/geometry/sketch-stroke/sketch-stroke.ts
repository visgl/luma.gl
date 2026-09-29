// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ShaderModule} from '../../../lib/shader-module/shader-module';

export type SketchStrokeProps = {
  /** Full stroke width in device-independent pixels. */
  width?: number;
  /** Maximum centerline displacement in pixels. */
  jitter?: number;
  /** Fractional width variation, from zero to one. */
  variation?: number;
  /** Strength of pencil grain, from zero to one. */
  grain?: number;
  /** Endpoint overshoot in pixels; geometry must reserve this space. */
  extension?: number;
  /** Zero gives a solid stroke; one enables sketch shading. */
  sketch?: number;
};

const defaults = {width: 2, jitter: 0.7, variation: 0.35, grain: 0.45, extension: 3, sketch: 1};
const uniformBlock = `
layout(std140) uniform sketchStrokeUniforms {
  float width;
  float jitter;
  float variation;
  float grain;
  float extension;
  float sketch;
} sketchStroke;
`;
const functions = `
float sketchStroke_noise(float coordinate) {
  float cell = floor(coordinate);
  float fraction = fract(coordinate);
  float first = fract(sin(cell * 127.1) * 43758.5453);
  float second = fract(sin((cell + 1.0) * 127.1) * 43758.5453);
  return mix(first, second, fraction * fraction * (3.0 - 2.0 * fraction));
}
// coordinates.x is normalized distance along a segment, y is signed pixel distance.
// Seeds belong to the geometry; neither camera position nor time changes the grain.
float sketchStroke_getCoverage(vec2 coordinates, float lengthPixels, float seed) {
  float along = coordinates.x;
  float center = (sketchStroke_noise(along * 17.0 + seed * 19.0) * 2.0 - 1.0) * sketchStroke.jitter * sketchStroke.sketch;
  float variation = mix(1.0, 0.55 + sketchStroke_noise(along * 31.0 + seed * 7.0) * 0.75, sketchStroke.variation * sketchStroke.sketch);
  float radius = sketchStroke.width * 0.5 * variation;
  float endDistance = max(-along, along - 1.0) * lengthPixels - sketchStroke.extension;
  float distance = max(abs(coordinates.y - center) - radius, endDistance);
  float antialias = max(fwidth(distance), 0.7);
  float coverage = 1.0 - smoothstep(-antialias * 0.5, antialias * 0.5, distance);
  float paper = sketchStroke_noise(along * 237.0 + seed * 41.0 + floor(coordinates.y * 3.0) * 13.0);
  return coverage * (1.0 - sketchStroke.grain * sketchStroke.sketch * paper);
}
`;

const source = `
struct sketchStrokeUniforms {
  width: f32,
  jitter: f32,
  variation: f32,
  grain: f32,
  extension: f32,
  sketch: f32,
};
@group(3) @binding(auto) var<uniform> sketchStroke: sketchStrokeUniforms;
fn sketchStroke_noise(coordinate: f32) -> f32 {
  let cell = floor(coordinate);
  let fraction = fract(coordinate);
  let first = fract(sin(cell * 127.1) * 43758.5453);
  let second = fract(sin((cell + 1.0) * 127.1) * 43758.5453);
  return mix(first, second, fraction * fraction * (3.0 - 2.0 * fraction));
}
fn sketchStroke_getCoverage(coordinates: vec2<f32>, lengthPixels: f32, seed: f32) -> f32 {
  let along = coordinates.x;
  let center = (sketchStroke_noise(along * 17.0 + seed * 19.0) * 2.0 - 1.0) * sketchStroke.jitter * sketchStroke.sketch;
  let variation = mix(1.0, 0.55 + sketchStroke_noise(along * 31.0 + seed * 7.0) * 0.75, sketchStroke.variation * sketchStroke.sketch);
  let radius = sketchStroke.width * 0.5 * variation;
  let endDistance = max(-along, along - 1.0) * lengthPixels - sketchStroke.extension;
  let distance = max(abs(coordinates.y - center) - radius, endDistance);
  let antialias = max(fwidth(distance), 0.7);
  let coverage = 1.0 - smoothstep(-antialias * 0.5, antialias * 0.5, distance);
  let paper = sketchStroke_noise(along * 237.0 + seed * 41.0 + floor(coordinates.y * 3.0) * 13.0);
  return coverage * (1.0 - sketchStroke.grain * sketchStroke.sketch * paper);
}
`;

/** Fragment coverage for geometry-anchored pencil strokes and solid architectural lines. */
export const sketchStroke = {
  name: 'sketchStroke',
  bindingLayout: [{name: 'sketchStroke', group: 3}],
  source,
  vs: uniformBlock,
  fs: uniformBlock + functions,
  uniformTypes: {
    width: 'f32',
    jitter: 'f32',
    variation: 'f32',
    grain: 'f32',
    extension: 'f32',
    sketch: 'f32'
  },
  defaultUniforms: defaults,
  getUniforms(props: SketchStrokeProps = {}) {
    return {...defaults, ...props};
  }
} as const satisfies ShaderModule<SketchStrokeProps, SketchStrokeProps>;
