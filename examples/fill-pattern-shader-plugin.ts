// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ShaderPlugin} from '@luma.gl/shadertools';

export const FillPattern = {
  none: 0,
  hash0: 1,
  hash45: 2,
  hash90: 3,
  hash135: 4,
  checker0: 5,
  checker45: 6,
  dotgrid: 7,
  dotgrid45: 8
} as const;

export type FillPatternType = (typeof FillPattern)[keyof typeof FillPattern];

const GLSL_FILL_PATTERN_SOURCE = /* glsl */ `\
const int FILL_PATTERN_NONE = 0;
const int FILL_PATTERN_HASH0 = 1;
const int FILL_PATTERN_HASH45 = 2;
const int FILL_PATTERN_HASH90 = 3;
const int FILL_PATTERN_HASH135 = 4;
const int FILL_PATTERN_CHECKER0 = 5;
const int FILL_PATTERN_CHECKER45 = 6;
const int FILL_PATTERN_DOTGRID = 7;
const int FILL_PATTERN_DOTGRID45 = 8;

float plugin_fillPatternStripeMask(float position, vec2 size) {
  float stepLength = max(size.x + size.y, 0.0001);
  float wrappedPosition = fract(position / stepLength) * stepLength;
  float edgeWidth = 0.0025;
  return 1.0 - smoothstep(size.x - edgeWidth, size.x + edgeWidth, wrappedPosition);
}

float plugin_fillPatternDotGridMask(vec2 uv, vec2 size) {
  float stepLength = max(size.x + size.y, 0.0001);
  float radius = size.x * 0.5;
  vec2 wrappedUv = fract((uv + vec2(stepLength * 0.5)) / stepLength) * stepLength;
  vec2 cellOffset = abs(wrappedUv - vec2(stepLength * 0.5));
  float distanceToDot = length(cellOffset);
  float edgeWidth = 0.0025;
  return 1.0 - smoothstep(radius - edgeWidth, radius + edgeWidth, distanceToDot);
}

vec4 plugin_applyFillPattern(vec4 color, float fillPatternType, vec2 uv, vec2 size) {
  int patternType = int(fillPatternType + 0.5);
  float maskOpacity = 1.0;

  if (patternType == FILL_PATTERN_HASH0) {
    maskOpacity = plugin_fillPatternStripeMask(uv.y, size);
  }
  if (patternType == FILL_PATTERN_HASH45) {
    maskOpacity = plugin_fillPatternStripeMask(uv.x + uv.y, size);
  }
  if (patternType == FILL_PATTERN_HASH90) {
    maskOpacity = plugin_fillPatternStripeMask(uv.x, size);
  }
  if (patternType == FILL_PATTERN_HASH135) {
    maskOpacity = plugin_fillPatternStripeMask(uv.x - uv.y, size);
  }
  if (patternType == FILL_PATTERN_CHECKER0) {
    maskOpacity = max(
      plugin_fillPatternStripeMask(uv.y, size),
      plugin_fillPatternStripeMask(uv.x, size)
    );
  }
  if (patternType == FILL_PATTERN_CHECKER45) {
    maskOpacity = max(
      plugin_fillPatternStripeMask(uv.x + uv.y, size),
      plugin_fillPatternStripeMask(uv.x - uv.y, size)
    );
  }
  if (patternType == FILL_PATTERN_DOTGRID) {
    maskOpacity = plugin_fillPatternDotGridMask(uv, size);
  }
  if (patternType == FILL_PATTERN_DOTGRID45) {
    const float INV_SQRT2 = 0.7071067811865475;
    vec2 rotatedUv = vec2((uv.x - uv.y) * INV_SQRT2, (uv.x + uv.y) * INV_SQRT2);
    maskOpacity = plugin_fillPatternDotGridMask(rotatedUv, size);
  }

  return vec4(color.rgb, color.a * maskOpacity);
}
`;

const WGSL_FILL_PATTERN_SOURCE = /* wgsl */ `\
const FILL_PATTERN_NONE: i32 = 0;
const FILL_PATTERN_HASH0: i32 = 1;
const FILL_PATTERN_HASH45: i32 = 2;
const FILL_PATTERN_HASH90: i32 = 3;
const FILL_PATTERN_HASH135: i32 = 4;
const FILL_PATTERN_CHECKER0: i32 = 5;
const FILL_PATTERN_CHECKER45: i32 = 6;
const FILL_PATTERN_DOTGRID: i32 = 7;
const FILL_PATTERN_DOTGRID45: i32 = 8;

fn pluginFillPatternStripeMask(position: f32, size: vec2<f32>) -> f32 {
  let stepLength = max(size.x + size.y, 0.0001);
  let wrappedPosition = fract(position / stepLength) * stepLength;
  let edgeWidth = 0.0025;
  return 1.0 - smoothstep(size.x - edgeWidth, size.x + edgeWidth, wrappedPosition);
}

fn pluginFillPatternDotGridMask(uv: vec2<f32>, size: vec2<f32>) -> f32 {
  let stepLength = max(size.x + size.y, 0.0001);
  let radius = size.x * 0.5;
  let wrappedUv =
    fract((uv + vec2<f32>(stepLength * 0.5)) / stepLength) * stepLength;
  let cellOffset = abs(wrappedUv - vec2<f32>(stepLength * 0.5));
  let distanceToDot = length(cellOffset);
  let edgeWidth = 0.0025;
  return 1.0 - smoothstep(radius - edgeWidth, radius + edgeWidth, distanceToDot);
}

fn pluginApplyFillPattern(
  color: vec4<f32>,
  fillPatternType: f32,
  uv: vec2<f32>,
  size: vec2<f32>
) -> vec4<f32> {
  let patternType = i32(fillPatternType + 0.5);
  var maskOpacity = 1.0;

  if (patternType == FILL_PATTERN_HASH0) {
    maskOpacity = pluginFillPatternStripeMask(uv.y, size);
  }
  if (patternType == FILL_PATTERN_HASH45) {
    maskOpacity = pluginFillPatternStripeMask(uv.x + uv.y, size);
  }
  if (patternType == FILL_PATTERN_HASH90) {
    maskOpacity = pluginFillPatternStripeMask(uv.x, size);
  }
  if (patternType == FILL_PATTERN_HASH135) {
    maskOpacity = pluginFillPatternStripeMask(uv.x - uv.y, size);
  }
  if (patternType == FILL_PATTERN_CHECKER0) {
    maskOpacity = max(
      pluginFillPatternStripeMask(uv.y, size),
      pluginFillPatternStripeMask(uv.x, size)
    );
  }
  if (patternType == FILL_PATTERN_CHECKER45) {
    maskOpacity = max(
      pluginFillPatternStripeMask(uv.x + uv.y, size),
      pluginFillPatternStripeMask(uv.x - uv.y, size)
    );
  }
  if (patternType == FILL_PATTERN_DOTGRID) {
    maskOpacity = pluginFillPatternDotGridMask(uv, size);
  }
  if (patternType == FILL_PATTERN_DOTGRID45) {
    let inverseSquareRootTwo = 0.7071067811865475;
    let rotatedUv = vec2<f32>(
      (uv.x - uv.y) * inverseSquareRootTwo,
      (uv.x + uv.y) * inverseSquareRootTwo
    );
    maskOpacity = pluginFillPatternDotGridMask(rotatedUv, size);
  }

  return vec4<f32>(color.rgb, color.a * maskOpacity);
}
`;

export const fillPatternShaderPlugin = {
  name: 'fill-pattern-plugin',
  glsl: {
    injections: [
      {
        target: 'fs:#decl',
        injection: GLSL_FILL_PATTERN_SOURCE
      }
    ]
  },
  wgsl: {
    injections: [
      {
        target: 'fs:#decl',
        injection: WGSL_FILL_PATTERN_SOURCE
      }
    ]
  }
} as const satisfies ShaderPlugin;
