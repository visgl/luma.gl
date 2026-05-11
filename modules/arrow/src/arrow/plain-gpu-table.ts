// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, Device, type BufferLayout, type ShaderLayout} from '@luma.gl/core';
import * as arrow from 'apache-arrow';
import {getArrowFieldByPath, getArrowVectorByPath} from './arrow-paths';
import {getArrowBufferLayout, type ArrowVertexFormatOptions} from './arrow-shader-layout';
import type {AttributeArrowType} from './arrow-types';
import {ArrowGPUVector, type ArrowGPUVectorProps} from './arrow-gpu-vector';

/** Options for creating GPU buffers from shader-compatible Arrow table columns. */
export type ArrowGPUTableProps = ArrowVertexFormatOptions & {
  /** Shader layout that selects which Arrow columns should be uploaded. */
  shaderLayout: ShaderLayout;
  /** Maps shader attribute names to Arrow column paths. Defaults to using the attribute name. */
  arrowPaths?: Record<string, string>;
  /** Buffer props applied to every Arrow-backed GPU vector. */
  bufferProps?: ArrowGPUVectorProps;
};

/**
 * GPU memory and Arrow schema metadata derived from selected Arrow table columns.
 *
 * The Arrow table is a construction input only. ArrowGPUTable does not retain
 * the source table; it owns GPU buffers, a BufferLayout, and a GPU-facing Arrow
 * schema that describes the selected columns.
 */
export class ArrowGPUTable {
  /** GPU-facing schema for the selected shader attribute columns. */
  readonly schema: arrow.Schema;
  /** Number of rows in the source Arrow table at construction time. */
  readonly numRows: number;
  /** Number of selected GPU columns in {@link schema}. */
  readonly numCols: number;
  /** Number of null rows in the source Arrow table at construction time. */
  readonly nullCount: number;
  /** Buffer layout derived from the selected Arrow columns and shader layout. */
  readonly bufferLayout: BufferLayout[];
  /** GPU vectors keyed by shader attribute name. */
  readonly gpuVectors: Record<string, ArrowGPUVector> = {};
  /** Model-ready attribute buffers keyed by shader attribute name. */
  readonly attributes: Record<string, Buffer> = {};

  /** Creates GPU buffers and a GPU-facing schema from an Arrow table. */
  constructor(device: Device, table: arrow.Table, props: ArrowGPUTableProps) {
    this.numRows = table.numRows;
    this.nullCount = table.nullCount;
    this.bufferLayout = getArrowBufferLayout(props.shaderLayout, {
      arrowTable: table,
      arrowPaths: props.arrowPaths,
      allowWebGLOnlyFormats: props.allowWebGLOnlyFormats
    });

    const fields: arrow.Field[] = [];
    for (const bufferLayout of this.bufferLayout) {
      const arrowPath = props.arrowPaths?.[bufferLayout.name] || bufferLayout.name;
      const vector = getArrowVectorByPath(table, arrowPath);
      const sourceField = getArrowFieldByPath(table, arrowPath);
      const field = new arrow.Field(
        bufferLayout.name,
        vector.type,
        sourceField.nullable,
        new Map(sourceField.metadata)
      );
      const gpuVector = new ArrowGPUVector(
        device,
        vector as arrow.Vector<AttributeArrowType>,
        props.bufferProps
      );

      fields.push(field);
      this.gpuVectors[bufferLayout.name] = gpuVector;
      this.attributes[bufferLayout.name] = gpuVector.buffer;
    }

    this.schema = new arrow.Schema(fields, new Map(table.schema.metadata));
    this.numCols = this.schema.fields.length;
  }

  destroy(): void {
    for (const gpuVector of Object.values(this.gpuVectors)) {
      gpuVector.destroy();
    }
  }
}
