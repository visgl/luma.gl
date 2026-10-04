// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {SlangType, Variable} from './ast';
import {SlangTranspileError} from './diagnostics';
import type {SlangStorageTextureFormat, SlangTextureLayout} from './types';

export function isSlangTexture(type: SlangType): boolean {
  return /^(RW|W)?Texture(1D|2D|2DArray|2DMS|Cube|CubeArray|3D)$/.test(type.name);
}
const FORMATS: Record<string, {wgsl: SlangStorageTextureFormat; scalar: string}> = {
  rgba8: {wgsl: 'rgba8unorm', scalar: 'float'},
  rgba8_snorm: {wgsl: 'rgba8snorm', scalar: 'float'},
  rgba16f: {wgsl: 'rgba16float', scalar: 'float'},
  rgba32f: {wgsl: 'rgba32float', scalar: 'float'},
  rgba32i: {wgsl: 'rgba32sint', scalar: 'int'},
  rgba32ui: {wgsl: 'rgba32uint', scalar: 'uint'},
  r32f: {wgsl: 'r32float', scalar: 'float'},
  r32i: {wgsl: 'r32sint', scalar: 'int'},
  r32ui: {wgsl: 'r32uint', scalar: 'uint'}
};
export function getSlangTextureLayout(
  variable: Variable,
  comparison: boolean,
  sourceName: string
): SlangTextureLayout {
  const scalar = /^(float|int|uint)([2-4])?$/.exec(variable.type.element?.name || '');
  if (!scalar)
    throw new SlangTranspileError(
      'Texture elements must be numeric scalars or vectors',
      variable.location,
      sourceName
    );
  const dimension = variable.type.name.endsWith('1D')
    ? '1d'
    : variable.type.name.endsWith('CubeArray')
      ? 'cube-array'
      : variable.type.name.endsWith('2DArray')
        ? '2d-array'
        : variable.type.name.endsWith('Cube')
          ? 'cube'
          : variable.type.name.endsWith('3D')
            ? '3d'
            : '2d';
  const storage = /^(RW|W)Texture/.test(variable.type.name);
  const format = variable.attributes.find(attribute => attribute.name === 'format');
  const multisampled = variable.type.name.endsWith('2DMS');
  if (storage && (dimension === 'cube' || dimension === 'cube-array' || multisampled))
    throw new SlangTranspileError(
      'Storage textures support 1D, 2D, 2DArray and 3D dimensions',
      variable.location,
      sourceName
    );
  if (
    comparison &&
    (scalar[1] !== 'float' ||
      scalar[2] ||
      dimension === '3d' ||
      dimension === '1d' ||
      multisampled ||
      storage)
  )
    throw new SlangTranspileError(
      'Comparison sampling requires a scalar float depth texture',
      variable.location,
      sourceName
    );
  if (
    storage &&
    (!format ||
      format.arguments.length !== 1 ||
      !FORMATS[format.arguments[0]] ||
      FORMATS[format.arguments[0]].scalar !== scalar[1])
  )
    throw new SlangTranspileError(
      'Storage textures require a matching [format("rgba8"|"rgba32f"|"r32ui"|...)] attribute',
      variable.location,
      sourceName
    );
  if (!storage && format)
    throw new SlangTranspileError('format requires a storage texture', format.location, sourceName);
  return {
    dimension,
    ...(multisampled ? {multisampled: true} : {}),
    sampleType: comparison
      ? 'depth'
      : scalar[1] === 'float'
        ? 'float'
        : scalar[1] === 'int'
          ? 'sint'
          : 'uint',
    components: Number(scalar[2] || 1),
    ...(storage
      ? {
          format: FORMATS[format!.arguments[0]].wgsl,
          glslFormat: format!.arguments[0],
          access: variable.type.name.startsWith('RW') ? ('read_write' as const) : ('write' as const)
        }
      : {})
  };
}
export function getWGSLTextureType(layout: SlangTextureLayout): string {
  const dimension = layout.dimension.replace('-', '_');
  if (layout.format) return `texture_storage_${dimension}<${layout.format}, ${layout.access}>`;
  if (layout.sampleType === 'depth') return `texture_depth_${dimension}`;
  return `texture_${layout.multisampled ? 'multisampled_' : ''}${dimension}<${layout.sampleType === 'float' ? 'f32' : layout.sampleType === 'sint' ? 'i32' : 'u32'}>`;
}
export function getGLSLTextureType(layout: SlangTextureLayout): string {
  const dimension = {
    '1d': '1D',
    '2d': '2D',
    '2d-array': '2DArray',
    cube: 'Cube',
    'cube-array': 'CubeArray',
    '3d': '3D'
  }[layout.dimension];
  const prefix = layout.sampleType === 'sint' ? 'i' : layout.sampleType === 'uint' ? 'u' : '';
  return `${prefix}${layout.format ? 'image' : 'sampler'}${dimension}${layout.multisampled ? 'MS' : ''}${layout.sampleType === 'depth' ? 'Shadow' : ''}`;
}

/** Slang includes an array layer in the coordinate, unlike WGSL. */
export function getTextureCoordinateWidth(layout: SlangTextureLayout): number {
  return layout.dimension === '1d'
    ? 1
    : layout.dimension === '2d'
      ? 2
      : layout.dimension === 'cube-array'
        ? 4
        : 3;
}
