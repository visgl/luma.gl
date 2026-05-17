// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {AnimationLoopTemplate, AnimationProps, Model} from '@luma.gl/engine';
import type {ShaderExtension} from '@luma.gl/shadertools';

const FillPattern = {
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

type FillPatternType = (typeof FillPattern)[keyof typeof FillPattern];

type PatternTriangle = {
  center: [number, number];
  fillPattern: FillPatternType;
  fillPatternSize: [number, number];
};

const PATTERN_TRIANGLES: PatternTriangle[] = [
  {center: [-0.68, 0.64], fillPattern: FillPattern.none, fillPatternSize: [0.12, 0.07]},
  {center: [0, 0.64], fillPattern: FillPattern.hash0, fillPatternSize: [0.12, 0.07]},
  {center: [0.68, 0.64], fillPattern: FillPattern.hash45, fillPatternSize: [0.12, 0.07]},
  {center: [-0.68, 0], fillPattern: FillPattern.hash90, fillPatternSize: [0.12, 0.07]},
  {center: [0, 0], fillPattern: FillPattern.hash135, fillPatternSize: [0.12, 0.07]},
  {center: [0.68, 0], fillPattern: FillPattern.checker0, fillPatternSize: [0.12, 0.07]},
  {center: [-0.68, -0.64], fillPattern: FillPattern.checker45, fillPatternSize: [0.12, 0.07]},
  {center: [0, -0.64], fillPattern: FillPattern.dotgrid, fillPatternSize: [0.12, 0.12]},
  {center: [0.68, -0.64], fillPattern: FillPattern.dotgrid45, fillPatternSize: [0.12, 0.12]}
];

const TRIANGLE_VERTICES = [
  {position: [-0.24, -0.2] as [number, number], uv: [0, 0] as [number, number]},
  {position: [0.24, -0.2] as [number, number], uv: [1, 0] as [number, number]},
  {position: [0, 0.26] as [number, number], uv: [0.5, 1] as [number, number]}
];

const source = /* wgsl */ `\
struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) fillPatternType: f32,
  @location(1) fillPatternSize: vec2<f32>,
  @location(2) fillPatternUv: vec2<f32>,
};

@vertex
fn vertexMain(
  @location(0) position: vec2<f32>,
  @location(1) fillPatternType: f32,
  @location(2) fillPatternSize: vec2<f32>,
  @location(3) fillPatternUv: vec2<f32>
) -> VertexOutput {
  var output: VertexOutput;
  output.position = vec4<f32>(position, 0.0, 1.0);
  output.fillPatternType = fillPatternType;
  output.fillPatternSize = fillPatternSize;
  output.fillPatternUv = fillPatternUv;
  return output;
}

@fragment
fn fragmentMain(inputs: VertexOutput) -> @location(0) vec4<f32> {
  let fillColor = vec4<f32>(0.08, 0.09, 0.11, 1.0);
  return extensionApplyFillPattern(
    fillColor,
    inputs.fillPatternType,
    inputs.fillPatternUv,
    inputs.fillPatternSize
  );
}
`;

const vs = /* glsl */ `\
#version 300 es

in vec2 position;
in float fillPatternType;
in vec2 fillPatternSize;
in vec2 fillPatternUv;

out float vFillPatternType;
out vec2 vFillPatternSize;
out vec2 vFillPatternUv;

void main() {
  vFillPatternType = fillPatternType;
  vFillPatternSize = fillPatternSize;
  vFillPatternUv = fillPatternUv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fs = /* glsl */ `\
#version 300 es
precision highp float;

in float vFillPatternType;
in vec2 vFillPatternSize;
in vec2 vFillPatternUv;

out vec4 fragColor;

void main() {
  vec4 fillColor = vec4(0.08, 0.09, 0.11, 1.0);
  fragColor = extension_applyFillPattern(
    fillColor,
    vFillPatternType,
    vFillPatternUv,
    vFillPatternSize
  );
}
`;

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = `
Reusable procedural fill patterns with ShaderExtension
`;

  model: Model;
  positionBuffer: Buffer;
  fillPatternTypeBuffer: Buffer;
  fillPatternSizeBuffer: Buffer;
  fillPatternUvBuffer: Buffer;

  constructor({device}: AnimationProps) {
    super();

    const triangleAttributes = createPatternTriangleAttributes(PATTERN_TRIANGLES);
    this.positionBuffer = device.createBuffer(triangleAttributes.positions);
    this.fillPatternTypeBuffer = device.createBuffer(triangleAttributes.fillPatternTypes);
    this.fillPatternSizeBuffer = device.createBuffer(triangleAttributes.fillPatternSizes);
    this.fillPatternUvBuffer = device.createBuffer(triangleAttributes.fillPatternUvs);

    this.model = new Model(device, {
      id: 'fill-pattern-triangles',
      source,
      vs,
      fs,
      extensions: [createFillPatternExtension()],
      bufferLayout: [
        {name: 'position', format: 'float32x2'},
        {name: 'fillPatternType', format: 'float32'},
        {name: 'fillPatternSize', format: 'float32x2'},
        {name: 'fillPatternUv', format: 'float32x2'}
      ],
      attributes: {
        position: this.positionBuffer,
        fillPatternType: this.fillPatternTypeBuffer,
        fillPatternSize: this.fillPatternSizeBuffer,
        fillPatternUv: this.fillPatternUvBuffer
      },
      parameters: {
        blend: true,
        blendColorOperation: 'add',
        blendColorSrcFactor: 'src-alpha',
        blendColorDstFactor: 'one-minus-src-alpha',
        blendAlphaOperation: 'add',
        blendAlphaSrcFactor: 'one',
        blendAlphaDstFactor: 'one-minus-src-alpha'
      },
      vertexCount: PATTERN_TRIANGLES.length * TRIANGLE_VERTICES.length
    });
  }

  onFinalize(): void {
    this.model.destroy();
    this.positionBuffer.destroy();
    this.fillPatternTypeBuffer.destroy();
    this.fillPatternSizeBuffer.destroy();
    this.fillPatternUvBuffer.destroy();
  }

  onRender({device}: AnimationProps): void {
    const renderPass = device.beginRenderPass({clearColor: [0.97, 0.96, 0.94, 1]});
    this.model.draw(renderPass);
    renderPass.end();
  }
}

function createPatternTriangleAttributes(triangles: PatternTriangle[]): {
  positions: Float32Array;
  fillPatternTypes: Float32Array;
  fillPatternSizes: Float32Array;
  fillPatternUvs: Float32Array;
} {
  const positions: number[] = [];
  const fillPatternTypes: number[] = [];
  const fillPatternSizes: number[] = [];
  const fillPatternUvs: number[] = [];

  for (const triangle of triangles) {
    for (const vertex of TRIANGLE_VERTICES) {
      positions.push(
        triangle.center[0] + vertex.position[0],
        triangle.center[1] + vertex.position[1]
      );
      fillPatternTypes.push(triangle.fillPattern);
      fillPatternSizes.push(triangle.fillPatternSize[0], triangle.fillPatternSize[1]);
      fillPatternUvs.push(vertex.uv[0], vertex.uv[1]);
    }
  }

  return {
    positions: new Float32Array(positions),
    fillPatternTypes: new Float32Array(fillPatternTypes),
    fillPatternSizes: new Float32Array(fillPatternSizes),
    fillPatternUvs: new Float32Array(fillPatternUvs)
  };
}

function createFillPatternExtension(): ShaderExtension {
  return {
    name: 'fill-pattern-extension',
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
  };
}

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

float extension_fillPatternStripeMask(float position, vec2 size) {
  float stepLength = max(size.x + size.y, 0.0001);
  float wrappedPosition = fract(position / stepLength) * stepLength;
  float edgeWidth = 0.0025;
  return 1.0 - smoothstep(size.x - edgeWidth, size.x + edgeWidth, wrappedPosition);
}

float extension_fillPatternDotGridMask(vec2 uv, vec2 size) {
  float stepLength = max(size.x + size.y, 0.0001);
  float radius = size.x * 0.5;
  vec2 wrappedUv = fract((uv + vec2(stepLength * 0.5)) / stepLength) * stepLength;
  vec2 cellOffset = abs(wrappedUv - vec2(stepLength * 0.5));
  float distanceToDot = length(cellOffset);
  float edgeWidth = 0.0025;
  return 1.0 - smoothstep(radius - edgeWidth, radius + edgeWidth, distanceToDot);
}

vec4 extension_applyFillPattern(vec4 color, float fillPatternType, vec2 uv, vec2 size) {
  int patternType = int(fillPatternType + 0.5);
  float maskOpacity = 1.0;

  if (patternType == FILL_PATTERN_HASH0) {
    maskOpacity = extension_fillPatternStripeMask(uv.y, size);
  }
  if (patternType == FILL_PATTERN_HASH45) {
    maskOpacity = extension_fillPatternStripeMask(uv.x + uv.y, size);
  }
  if (patternType == FILL_PATTERN_HASH90) {
    maskOpacity = extension_fillPatternStripeMask(uv.x, size);
  }
  if (patternType == FILL_PATTERN_HASH135) {
    maskOpacity = extension_fillPatternStripeMask(uv.x - uv.y, size);
  }
  if (patternType == FILL_PATTERN_CHECKER0) {
    maskOpacity = max(
      extension_fillPatternStripeMask(uv.y, size),
      extension_fillPatternStripeMask(uv.x, size)
    );
  }
  if (patternType == FILL_PATTERN_CHECKER45) {
    maskOpacity = max(
      extension_fillPatternStripeMask(uv.x + uv.y, size),
      extension_fillPatternStripeMask(uv.x - uv.y, size)
    );
  }
  if (patternType == FILL_PATTERN_DOTGRID) {
    maskOpacity = extension_fillPatternDotGridMask(uv, size);
  }
  if (patternType == FILL_PATTERN_DOTGRID45) {
    const float INV_SQRT2 = 0.7071067811865475;
    vec2 rotatedUv = vec2((uv.x - uv.y) * INV_SQRT2, (uv.x + uv.y) * INV_SQRT2);
    maskOpacity = extension_fillPatternDotGridMask(rotatedUv, size);
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

fn extensionFillPatternStripeMask(position: f32, size: vec2<f32>) -> f32 {
  let stepLength = max(size.x + size.y, 0.0001);
  let wrappedPosition = fract(position / stepLength) * stepLength;
  let edgeWidth = 0.0025;
  return 1.0 - smoothstep(size.x - edgeWidth, size.x + edgeWidth, wrappedPosition);
}

fn extensionFillPatternDotGridMask(uv: vec2<f32>, size: vec2<f32>) -> f32 {
  let stepLength = max(size.x + size.y, 0.0001);
  let radius = size.x * 0.5;
  let wrappedUv =
    fract((uv + vec2<f32>(stepLength * 0.5)) / stepLength) * stepLength;
  let cellOffset = abs(wrappedUv - vec2<f32>(stepLength * 0.5));
  let distanceToDot = length(cellOffset);
  let edgeWidth = 0.0025;
  return 1.0 - smoothstep(radius - edgeWidth, radius + edgeWidth, distanceToDot);
}

fn extensionApplyFillPattern(
  color: vec4<f32>,
  fillPatternType: f32,
  uv: vec2<f32>,
  size: vec2<f32>
) -> vec4<f32> {
  let patternType = i32(fillPatternType + 0.5);
  var maskOpacity = 1.0;

  if (patternType == FILL_PATTERN_HASH0) {
    maskOpacity = extensionFillPatternStripeMask(uv.y, size);
  }
  if (patternType == FILL_PATTERN_HASH45) {
    maskOpacity = extensionFillPatternStripeMask(uv.x + uv.y, size);
  }
  if (patternType == FILL_PATTERN_HASH90) {
    maskOpacity = extensionFillPatternStripeMask(uv.x, size);
  }
  if (patternType == FILL_PATTERN_HASH135) {
    maskOpacity = extensionFillPatternStripeMask(uv.x - uv.y, size);
  }
  if (patternType == FILL_PATTERN_CHECKER0) {
    maskOpacity = max(
      extensionFillPatternStripeMask(uv.y, size),
      extensionFillPatternStripeMask(uv.x, size)
    );
  }
  if (patternType == FILL_PATTERN_CHECKER45) {
    maskOpacity = max(
      extensionFillPatternStripeMask(uv.x + uv.y, size),
      extensionFillPatternStripeMask(uv.x - uv.y, size)
    );
  }
  if (patternType == FILL_PATTERN_DOTGRID) {
    maskOpacity = extensionFillPatternDotGridMask(uv, size);
  }
  if (patternType == FILL_PATTERN_DOTGRID45) {
    let inverseSquareRootTwo = 0.7071067811865475;
    let rotatedUv = vec2<f32>(
      (uv.x - uv.y) * inverseSquareRootTwo,
      (uv.x + uv.y) * inverseSquareRootTwo
    );
    maskOpacity = extensionFillPatternDotGridMask(rotatedUv, size);
  }

  return vec4<f32>(color.rgb, color.a * maskOpacity);
}
`;
