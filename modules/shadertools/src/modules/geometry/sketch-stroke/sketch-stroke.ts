// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ShaderModule} from '../../../lib/shader-module/shader-module';

export type SketchStrokeProps = {
  /** Full stroke width in the same units as the transverse coordinate. */
  width?: number;
  /** Maximum centerline displacement in transverse-coordinate units. */
  jitter?: number;
  /** Fractional width variation, from zero to one. */
  variation?: number;
  /** Strength of pencil grain, from zero to one. */
  grain?: number;
  /** Transverse screen-space displacement for a secondary hand-drawn pass. */
  offset?: number;
  /** Endpoint overshoot in stroke units; geometry must reserve this space. */
  extension?: number;
  /** Zero gives a solid stroke; one enables sketch shading. */
  sketch?: number;
  /** Minimum edge smoothing in stroke units. Defaults to 0.7 for pixel-sized strokes. */
  minimumAntialias?: number;
};

const defaults = {
  width: 2,
  jitter: 0.7,
  variation: 0.35,
  grain: 0.45,
  offset: 0,
  extension: 3,
  sketch: 1,
  minimumAntialias: 0.7
};
const uniformBlock = `
layout(std140) uniform sketchStrokeUniforms {
  float width;
  float jitter;
  float variation;
  float grain;
  float offset;
  float extension;
  float sketch;
  float minimumAntialias;
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
float sketchStroke_noise2(vec2 coordinate) {
  vec2 cell = floor(coordinate);
  vec2 fraction = fract(coordinate);
  fraction = fraction * fraction * (3.0 - 2.0 * fraction);
  float first = fract(sin(dot(cell, vec2(127.1, 311.7))) * 43758.5453);
  float second = fract(sin(dot(cell + vec2(1.0, 0.0), vec2(127.1, 311.7))) * 43758.5453);
  float third = fract(sin(dot(cell + vec2(0.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);
  float fourth = fract(sin(dot(cell + vec2(1.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);
  return mix(mix(first, second, fraction.x), mix(third, fourth, fraction.x), fraction.y);
}
// coordinates.x is normalized distance along a segment, y is signed transverse distance. All distances use the same units.
// Seeds belong to the geometry; neither camera position nor time changes the grain.
float sketchStroke_getCoverage(vec2 coordinates, float strokeLength, float seed) {
  float along = coordinates.x;
  float side = sketchStroke_noise(seed * 29.0) < 0.5 ? -1.0 : 1.0;
  float center = (sketchStroke_noise(along * 17.0 + seed * 19.0) * 2.0 - 1.0) * sketchStroke.jitter * sketchStroke.sketch + side * sketchStroke.offset * sketchStroke.sketch;
  float variation = mix(1.0, 0.55 + sketchStroke_noise(along * 31.0 + seed * 7.0) * 0.75, sketchStroke.variation * sketchStroke.sketch);
  vec2 grainCoordinates = vec2(along * strokeLength, coordinates.y) + vec2(seed * 17.0, seed * 53.0);
  float coarseGrain = sketchStroke_noise2(grainCoordinates * 0.55);
  float fineGrain = sketchStroke_noise2(grainCoordinates * 2.8);
  float toothGrain = sketchStroke_noise2(grainCoordinates * 6.5);
  float grainTexture = coarseGrain * 0.35 + fineGrain * 0.4 + toothGrain * 0.25;
  float edgeRoughness = (grainTexture - 0.5) * sketchStroke.grain * sketchStroke.sketch * 0.7;
  float radius = sketchStroke.width * 0.5 * variation + edgeRoughness;
  float endDistance = max(-along, along - 1.0) * strokeLength - sketchStroke.extension;
  float distance = max(abs(coordinates.y - center) - radius, endDistance);
  float antialias = max(fwidth(distance), max(sketchStroke.minimumAntialias, 0.0001));
  float coverage = 1.0 - smoothstep(-antialias * 0.5, antialias * 0.5, distance);
  // Keep the pigment opaque; grain changes the stroke edge so the paper does not show through as white flecks.
  return coverage;
}
`;

const source = `
struct sketchStrokeUniforms {
  width: f32,
  jitter: f32,
  variation: f32,
  grain: f32,
  offset: f32,
  extension: f32,
  sketch: f32,
  minimumAntialias: f32,
};
@group(3) @binding(auto) var<uniform> sketchStroke: sketchStrokeUniforms;
fn sketchStroke_noise(coordinate: f32) -> f32 {
  let cell = floor(coordinate);
  let fraction = fract(coordinate);
  let first = fract(sin(cell * 127.1) * 43758.5453);
  let second = fract(sin((cell + 1.0) * 127.1) * 43758.5453);
  return mix(first, second, fraction * fraction * (3.0 - 2.0 * fraction));
}
fn sketchStroke_noise2(coordinate: vec2<f32>) -> f32 {
  let cell = floor(coordinate);
  var fraction = fract(coordinate);
  fraction = fraction * fraction * (vec2<f32>(3.0) - 2.0 * fraction);
  let first = fract(sin(dot(cell, vec2<f32>(127.1, 311.7))) * 43758.5453);
  let second = fract(sin(dot(cell + vec2<f32>(1.0, 0.0), vec2<f32>(127.1, 311.7))) * 43758.5453);
  let third = fract(sin(dot(cell + vec2<f32>(0.0, 1.0), vec2<f32>(127.1, 311.7))) * 43758.5453);
  let fourth = fract(sin(dot(cell + vec2<f32>(1.0, 1.0), vec2<f32>(127.1, 311.7))) * 43758.5453);
  return mix(mix(first, second, fraction.x), mix(third, fourth, fraction.x), fraction.y);
}
fn sketchStroke_getCoverage(coordinates: vec2<f32>, strokeLength: f32, seed: f32) -> f32 {
  let along = coordinates.x;
  let side = select(1.0, -1.0, sketchStroke_noise(seed * 29.0) < 0.5);
  let center = (sketchStroke_noise(along * 17.0 + seed * 19.0) * 2.0 - 1.0) * sketchStroke.jitter * sketchStroke.sketch + side * sketchStroke.offset * sketchStroke.sketch;
  let variation = mix(1.0, 0.55 + sketchStroke_noise(along * 31.0 + seed * 7.0) * 0.75, sketchStroke.variation * sketchStroke.sketch);
  let grainCoordinates = vec2<f32>(along * strokeLength, coordinates.y) + vec2<f32>(seed * 17.0, seed * 53.0);
  let coarseGrain = sketchStroke_noise2(grainCoordinates * 0.55);
  let fineGrain = sketchStroke_noise2(grainCoordinates * 2.8);
  let toothGrain = sketchStroke_noise2(grainCoordinates * 6.5);
  let grainTexture = coarseGrain * 0.35 + fineGrain * 0.4 + toothGrain * 0.25;
  let edgeRoughness = (grainTexture - 0.5) * sketchStroke.grain * sketchStroke.sketch * 0.7;
  let radius = sketchStroke.width * 0.5 * variation + edgeRoughness;
  let endDistance = max(-along, along - 1.0) * strokeLength - sketchStroke.extension;
  let distance = max(abs(coordinates.y - center) - radius, endDistance);
  let antialias = max(fwidth(distance), max(sketchStroke.minimumAntialias, 0.0001));
  let coverage = 1.0 - smoothstep(-antialias * 0.5, antialias * 0.5, distance);
  // Keep the pigment opaque; grain changes the stroke edge so the paper does not show through as white flecks.
  return coverage;
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
    offset: 'f32',
    extension: 'f32',
    sketch: 'f32',
    minimumAntialias: 'f32'
  },
  defaultUniforms: defaults,
  getUniforms(props: SketchStrokeProps = {}) {
    return {...defaults, ...props};
  }
} as const satisfies ShaderModule<SketchStrokeProps, SketchStrokeProps>;
