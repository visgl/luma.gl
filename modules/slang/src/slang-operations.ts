// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {isSlangTexture} from './textures';
import type {Expression} from './ast';
import type {ShaderOperation} from './ir';

const INTRINSIC_OPERATIONS: Record<string, ShaderOperation> = {
  lerp: 'mix',
  frac: 'fract',
  fract: 'fract',
  rsqrt: 'inverse-sqrt',
  ddx: 'derivative-x',
  ddy: 'derivative-y',
  atan2: 'atan2'
};
const TEXTURE_OPERATIONS: Record<string, ShaderOperation> = {
  Sample: 'texture-sample',
  SampleLevel: 'texture-sample-level',
  SampleGrad: 'texture-sample-gradient',
  SampleBias: 'texture-sample-bias',
  SampleCmp: 'texture-sample-compare',
  SampleCmpLevelZero: 'texture-sample-compare-level',
  Load: 'texture-load',
  GetDimensions: 'texture-dimensions',
  Gather: 'texture-gather',
  GatherRed: 'texture-gather',
  GatherGreen: 'texture-gather',
  GatherBlue: 'texture-gather',
  GatherAlpha: 'texture-gather',
  GatherCmp: 'texture-gather-compare'
};

export function lowerSlangOperation(expression: Expression): ShaderOperation | undefined {
  if (expression.kind === 'cast' || expression.resolvedCall?.kind === 'constructor')
    return 'convert';
  if (expression.kind !== 'call' || expression.resolvedCall?.kind === 'function') return undefined;
  if (expression.callee.kind === 'member') {
    const resource = expression.callee.object.resolvedType;
    return resource?.kind === 'struct' && isSlangTexture({name: resource.name})
      ? TEXTURE_OPERATIONS[expression.callee.member]
      : undefined;
  }
  return expression.callee.kind === 'identifier'
    ? INTRINSIC_OPERATIONS[expression.callee.value]
    : undefined;
}
