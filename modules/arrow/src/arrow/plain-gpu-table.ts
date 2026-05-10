// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, Device, type BufferLayout, type ShaderLayout} from '@luma.gl/core';
import * as arrow from 'apache-arrow';
import {getArrowVectorByPath} from './arrow-paths';
import {getArrowBufferLayout, type ArrowVertexFormatOptions} from './arrow-shader-layout';
import type {AttributeArrowType} from './arrow-types';
import {ArrowGPUVector, type ArrowGPUVectorProps} from './arrow-gpu-vector';

export type ArrowGPUTableProps = ArrowVertexFormatOptions & {
  /** Shader layout that selects which Arrow columns should be uploaded. */
  shaderLayout: ShaderLayout;
  /** Maps shader attribute names to Arrow column paths. Defaults to using the attribute name. */
  arrowPaths?: Record<string, string>;
  /** Buffer props applied to every Arrow-backed GPU vector. */
  bufferProps?: ArrowGPUVectorProps;
};

/** GPU buffers backed by Arrow table columns selected by a shader layout. */
export class ArrowGPUTable {
  readonly table: arrow.Table;
  readonly bufferLayout: BufferLayout[];
  readonly gpuVectors: Record<string, ArrowGPUVector> = {};
  readonly attributes: Record<string, Buffer> = {};

  constructor(device: Device, table: arrow.Table, props: ArrowGPUTableProps) {
    this.table = table;
    this.bufferLayout = getArrowBufferLayout(props.shaderLayout, {
      arrowTable: table,
      arrowPaths: props.arrowPaths,
      allowWebGLOnlyFormats: props.allowWebGLOnlyFormats
    });

    for (const bufferLayout of this.bufferLayout) {
      const arrowPath = props.arrowPaths?.[bufferLayout.name] || bufferLayout.name;
      const vector = getArrowVectorByPath(table, arrowPath);
      const gpuVector = new ArrowGPUVector(
        device,
        vector as arrow.Vector<AttributeArrowType>,
        props.bufferProps
      );

      this.gpuVectors[bufferLayout.name] = gpuVector;
      this.attributes[bufferLayout.name] = gpuVector.buffer;
    }
  }

  destroy(): void {
    for (const gpuVector of Object.values(this.gpuVectors)) {
      gpuVector.destroy();
    }
  }
}
