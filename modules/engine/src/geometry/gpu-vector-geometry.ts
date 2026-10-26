// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {BufferLayout, PrimitiveTopology} from '@luma.gl/core';
import type {GPUVectorModelInput} from '../model/gpu-vector-model-batches';
import type {GPUVectorModelAttributes} from '../model/gpu-vector-bindings';

/** Borrowed GPU vectors defining a mesh and its draw metadata. */
export type GPUVectorGeometryProps = {
  attributes: GPUVectorModelAttributes;
  indices?: GPUVectorModelInput | null;
  topology?: PrimitiveTopology;
  vertexCount?: number;
  bufferLayout?: BufferLayout[];
};

/** Reusable GPU-only geometry. Input vectors remain caller-owned. */
export class GPUVectorGeometry {
  readonly attributes: GPUVectorModelAttributes;
  readonly indices: GPUVectorModelInput | null;
  readonly topology: PrimitiveTopology;
  readonly vertexCount?: number;
  readonly bufferLayout?: BufferLayout[];

  constructor(props: GPUVectorGeometryProps) {
    this.attributes = props.attributes;
    this.indices = props.indices ?? null;
    this.topology = props.topology ?? 'triangle-list';
    this.vertexCount = props.vertexCount;
    this.bufferLayout = props.bufferLayout;
  }
}
