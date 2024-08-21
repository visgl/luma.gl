// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TypedArray} from '@math.gl/types';
import type {VertexFormat} from '@luma.gl/shadertypes';

/** Holds one geometry */
export type GeometryTable = {
  length: number;
  schema?: Record<string, VertexFormat>;
  attributes: {
    POSITION: TypedArray;
    NORMAL: TypedArray;
    TEXCOORD_0: TypedArray;
    [key: string]: TypedArray;
  };
  indices?: Uint16Array | Uint32Array;
  topology?: 'point-list' | 'line-list' | 'line-strip' | 'triangle-list' | 'triangle-strip';
};
