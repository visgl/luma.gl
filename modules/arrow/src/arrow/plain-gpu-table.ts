// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  Buffer,
  Device,
  type BufferLayout,
  type ShaderLayout,
  type VertexFormat
} from '@luma.gl/core';
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

/** Options for constructing an {@link ArrowGPUTable} from existing GPU vectors. */
export type ArrowGPUTableFromVectorsProps = {
  /** GPU vectors keyed by name, or a list of named GPU vectors. */
  vectors: Record<string, ArrowGPUVector> | ArrowGPUVector[];
  /** Optional table-level schema metadata. */
  metadata?: Map<string, string>;
  /** Number of null rows in the generated GPU table. */
  nullCount?: number;
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
  readonly bufferLayout: BufferLayout[] = [];
  /** GPU vectors keyed by shader attribute name. */
  readonly gpuVectors: Record<string, ArrowGPUVector> = {};
  /** Model-ready attribute buffers keyed by shader attribute name. */
  readonly attributes: Record<string, Buffer> = {};

  /** Creates GPU buffers and a GPU-facing schema from an Arrow table. */
  constructor(device: Device, table: arrow.Table, props: ArrowGPUTableProps);
  /** Creates a GPU-facing table from existing named GPU vectors. */
  constructor(props: ArrowGPUTableFromVectorsProps);
  constructor(
    deviceOrProps: Device | ArrowGPUTableFromVectorsProps,
    table?: arrow.Table,
    props?: ArrowGPUTableProps
  ) {
    if (!(deviceOrProps instanceof Device)) {
      const {vectors, metadata, nullCount = 0} = deviceOrProps;
      const gpuVectors = normalizeVectorMap(vectors);
      const vectorEntries = Object.entries(gpuVectors);
      const firstVector = vectorEntries[0]?.[1];

      if (!firstVector) {
        throw new Error('ArrowGPUTable requires at least one GPU vector');
      }

      this.numRows = firstVector.length;
      this.nullCount = nullCount;

      const fields: arrow.Field[] = [];
      for (const [name, gpuVector] of vectorEntries) {
        if (gpuVector.length !== this.numRows) {
          throw new Error(
            `ArrowGPUTable vector "${name}" length ${gpuVector.length} does not match ${this.numRows}`
          );
        }

        this.gpuVectors[name] = gpuVector;
        fields.push(new arrow.Field(name, gpuVector.type, false));

        const bufferLayout = getVectorBufferLayout(name, gpuVector);
        this.bufferLayout.push(bufferLayout);

        if (bufferLayout.attributes) {
          for (const attribute of bufferLayout.attributes) {
            this.attributes[attribute.attribute] = gpuVector.buffer;
          }
        } else {
          this.attributes[bufferLayout.name] = gpuVector.buffer;
        }
      }

      this.schema = new arrow.Schema(fields, metadata);
      this.numCols = fields.length;
      return;
    }

    const device = deviceOrProps;
    props = props!;
    table = table!;
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

function normalizeVectorMap(
  vectors: Record<string, ArrowGPUVector> | ArrowGPUVector[]
): Record<string, ArrowGPUVector> {
  if (Array.isArray(vectors)) {
    return Object.fromEntries(vectors.map(vector => [vector.name, vector]));
  }
  return vectors;
}

function getVectorBufferLayout(name: string, vector: ArrowGPUVector): BufferLayout {
  if (vector.bufferLayout) {
    return vector.bufferLayout;
  }

  const format = getArrowTypeVertexFormat(vector.type);
  if (vector.byteOffset > 0) {
    return {
      name,
      byteStride: vector.byteStride,
      attributes: [{attribute: name, format, byteOffset: vector.byteOffset}]
    };
  }

  return {
    name,
    byteStride: vector.byteStride,
    format
  };
}

function getArrowTypeVertexFormat(type: arrow.DataType): VertexFormat {
  const {numericType, components} = getArrowTypeComponents(type);
  const componentType = getArrowNumericTypeName(numericType);
  const suffix = components === 1 ? '' : `x${components}`;
  const format = `${componentType}${suffix}`;

  if (componentType === 'float16' && components === 3) {
    throw new Error('ArrowGPUTable cannot synthesize a float16x3 buffer layout');
  }
  if ((componentType === 'uint8' || componentType === 'sint8') && components === 3) {
    return `${componentType}x3-webgl` as VertexFormat;
  }
  if ((componentType === 'uint16' || componentType === 'sint16') && components === 3) {
    return `${componentType}x3-webgl` as VertexFormat;
  }
  return format as VertexFormat;
}

function getArrowTypeComponents(type: arrow.DataType): {
  numericType: arrow.Int | arrow.Float;
  components: number;
} {
  if (arrow.DataType.isFixedSizeList(type)) {
    const childType = type.children[0].type;
    if (!arrow.DataType.isInt(childType) && !arrow.DataType.isFloat(childType)) {
      throw new Error(`ArrowGPUTable cannot synthesize a layout for Arrow type ${type}`);
    }
    return {numericType: childType, components: type.listSize};
  }
  if (arrow.DataType.isInt(type) || arrow.DataType.isFloat(type)) {
    return {numericType: type, components: 1};
  }
  throw new Error(`ArrowGPUTable cannot synthesize a layout for Arrow type ${type}`);
}

function getArrowNumericTypeName(type: arrow.Int | arrow.Float): string {
  if (arrow.DataType.isInt(type)) {
    switch (type.bitWidth) {
      case 8:
      case 16:
      case 32:
        return `${type.isSigned ? 'sint' : 'uint'}${type.bitWidth}`;
      default:
        throw new Error('ArrowGPUTable does not support 64-bit integer GPU buffers');
    }
  }

  switch (type.precision) {
    case arrow.Precision.HALF:
      return 'float16';
    case arrow.Precision.SINGLE:
      return 'float32';
    default:
      throw new Error('ArrowGPUTable does not support float64 GPU buffers');
  }
}
