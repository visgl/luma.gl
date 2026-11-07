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

/** Normalize resource ownership and access independently of target declarations. */
export function lowerSlangResource(
  type: SlangType,
  binding: {group: number; binding: number},
  textureAccess?: 'read' | 'write' | 'read_write'
): import('./ir').ShaderResource {
  const storage = type.name.endsWith('StructuredBuffer') || isByteAddressBuffer(type);
  const texture = /Texture/.test(type.name);
  const sampler = type.name === 'SamplerState' || type.name === 'SamplerComparisonState';
  return {
    ...binding,
    kind: storage ? 'storage' : texture ? 'texture' : sampler ? 'sampler' : 'uniform',
    addressSpace: storage ? 'storage' : texture || sampler ? 'handle' : 'uniform',
    access: textureAccess ?? (type.name.startsWith('RW') ? 'read_write' : 'read')
  };
}
