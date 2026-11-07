// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Internal shader metadata. This module has no frontend or runtime dependencies. */
export type SourceLocation = {offset: number; line: number; column: number; sourceName?: string};
export type ScalarKind = 'f32' | 'i32' | 'u32' | 'bool';
export type ShaderType =
  | {kind: 'void'}
  | {kind: 'scalar'; scalar: ScalarKind}
  | {kind: 'vector'; scalar: ScalarKind; width: number}
  /** Values are indexed by column, then row. Storage layout is separate. */
  | {kind: 'matrix'; scalar: 'f32'; columns: number; rows: number}
  | {kind: 'array'; element: ShaderType; length?: number}
  | {kind: 'struct'; name: string};
export type ShaderInterface = {
  builtin?: string;
  location?: number;
  interpolation: 'flat' | 'linear' | 'perspective';
  sampling: 'center' | 'centroid' | 'sample';
};
export type ShaderResource = {
  kind: 'uniform' | 'storage' | 'texture' | 'sampler';
  addressSpace: 'uniform' | 'storage' | 'handle';
  access: 'read' | 'read_write' | 'write';
  group: number;
  binding: number;
};
