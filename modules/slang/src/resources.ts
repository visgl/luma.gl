// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Expression, SlangType} from './ast';

export const ATOMICS: Record<string, string> = {
  InterlockedAdd: 'atomicAdd',
  InterlockedAnd: 'atomicAnd',
  InterlockedOr: 'atomicOr',
  InterlockedXor: 'atomicXor',
  InterlockedMin: 'atomicMin',
  InterlockedMax: 'atomicMax',
  InterlockedExchange: 'atomicExchange',
  InterlockedCompareExchange: 'atomicCompareExchangeWeak',
  InterlockedCompareStore: 'atomicCompareExchangeWeak'
};
export const BARRIERS: Record<string, 'workgroup' | 'storage' | 'all'> = {
  GroupMemoryBarrierWithGroupSync: 'workgroup',
  DeviceMemoryBarrierWithGroupSync: 'storage',
  AllMemoryBarrierWithGroupSync: 'all'
};
export function isByteAddressBuffer(type: SlangType): boolean {
  return /^(RW)?ByteAddressBuffer$/.test(type.name);
}
export function isSlangResource(type: SlangType): boolean {
  return /^(ConstantBuffer|(?:RW)?StructuredBuffer|(?:RW)?ByteAddressBuffer|(?:RW|W)?Texture(?:1D|2D|2DArray|2DMS|Cube|CubeArray|3D)|SamplerState|SamplerComparisonState)$/.test(
    type.name
  );
}
export function getExpressionRoot(expression: Expression): Expression {
  while (expression.kind === 'index' || expression.kind === 'member')
    expression = expression.object;
  return expression;
}
