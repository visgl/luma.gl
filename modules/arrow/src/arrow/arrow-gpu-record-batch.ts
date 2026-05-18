// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, Device, type BufferLayout, type ShaderLayout} from '@luma.gl/core';
import type {DynamicBuffer} from '@luma.gl/engine';
import * as arrow from 'apache-arrow';
import {getArrowFieldByPath, getArrowVectorByPath} from './arrow-paths';
import {getArrowBufferLayout, type ArrowVertexFormatOptions} from './arrow-shader-layout';
import type {AttributeArrowType} from './arrow-types';
import {
  getAppendableGPUColumnData,
  getAppendableGPUColumns,
  type AppendableGPUColumn
} from './arrow-gpu-appendable';
import {
  GPUVector,
  type GPUVectorBufferProps,
  type GPUVectorDynamicBufferProps,
  type GPUVectorProps
} from './arrow-gpu-vector';
import {createGPUVectorCollection} from './arrow-gpu-vector-collection';

/** Options for creating GPU buffers from shader-compatible Arrow record batch columns. */
export type GPURecordBatchProps = ArrowVertexFormatOptions & {
  /** Shader layout that selects which Arrow columns should be uploaded. */
  shaderLayout: ShaderLayout;
  /** Maps shader attribute names to Arrow column paths. Defaults to using the attribute name. */
  arrowPaths?: Record<string, string>;
  /** Buffer props applied to every Arrow-backed GPU vector. */
  bufferProps?: GPUVectorProps;
};

/** Options for constructing an GPURecordBatch from existing GPU vectors. */
export type GPURecordBatchFromVectorsProps = {
  /** GPU vectors keyed by name, or a list of named GPU vectors. */
  vectors: Record<string, GPUVector> | GPUVector[];
  /** Optional precomputed batch buffer layouts. */
  bufferLayout?: BufferLayout[];
  /** Optional selected schema fields. Defaults to fields synthesized from vector names and types. */
  fields?: arrow.Field[];
  /** Optional batch-level schema metadata. */
  metadata?: Map<string, string>;
  /** Number of null rows in the generated GPU record batch. */
  nullCount?: number;
};

/** Props for constructing an empty appendable GPU record batch from a selected schema. */
export type GPURecordBatchAppendableProps = ArrowVertexFormatOptions & {
  /** Discriminator for appendable record batch construction. */
  type: 'appendable';
  /** Device that creates appendable vector storage. */
  device: Device;
  /** Source schema used to select shader-compatible columns. */
  schema: arrow.Schema;
  /** Shader layout that selects which Arrow columns should be uploaded. */
  shaderLayout: ShaderLayout;
  /** Maps shader attribute names to Arrow column paths. Defaults to using the attribute name. */
  arrowPaths?: Record<string, string>;
  /** Initial row capacity for each appendable vector. */
  initialCapacityRows?: number;
  /** Appendable vector capacity growth multiplier. */
  capacityGrowthFactor?: number;
  /** Dynamic buffer props forwarded to appendable vectors. */
  bufferProps?: GPUVectorDynamicBufferProps;
};

/** GPU memory and Arrow schema metadata for one selected Arrow RecordBatch. */
export class GPURecordBatch {
  /** GPU-facing schema for the selected shader attribute columns. */
  schema: arrow.Schema;
  /** Number of rows in the source Arrow record batch. */
  numRows: number;
  /** Number of selected GPU columns in {@link schema}. */
  numCols: number;
  /** Number of null rows in the source Arrow record batch. */
  nullCount: number;
  /** Buffer layout derived from the selected Arrow columns and shader layout. */
  readonly bufferLayout: BufferLayout[] = [];
  /** GPU vectors keyed by shader attribute name. */
  readonly gpuVectors: Record<string, GPUVector> = {};
  /** Model-ready attribute buffers keyed by shader attribute name. */
  readonly attributes: Record<string, Buffer | DynamicBuffer> = {};
  /** Model-ready storage bindings keyed by shader binding name. */
  readonly bindings: Record<string, Buffer | DynamicBuffer> = {};
  private readonly appendableColumns?: AppendableGPUColumn[];

  /** Creates GPU buffers and GPU-facing schema from one Arrow record batch. */
  constructor(device: Device, recordBatch: arrow.RecordBatch, props: GPURecordBatchProps);
  /** Creates a GPU-facing record batch from existing named GPU vectors. */
  constructor(props: GPURecordBatchFromVectorsProps);
  /** Creates an empty appendable GPU record batch from a selected schema. */
  constructor(props: GPURecordBatchAppendableProps);
  constructor(
    deviceOrProps: Device | GPURecordBatchFromVectorsProps | GPURecordBatchAppendableProps,
    recordBatch?: arrow.RecordBatch,
    props?: GPURecordBatchProps
  ) {
    if (!(deviceOrProps instanceof Device)) {
      if ('type' in deviceOrProps && deviceOrProps.type === 'appendable') {
        const options = deviceOrProps;
        const appendableColumns = getAppendableGPUColumns({
          schema: options.schema,
          shaderLayout: options.shaderLayout,
          arrowPaths: options.arrowPaths,
          allowWebGLOnlyFormats: options.allowWebGLOnlyFormats
        });
        this.numRows = 0;
        this.nullCount = 0;
        this.bufferLayout.push(
          ...appendableColumns.flatMap(column => (column.bufferLayout ? [column.bufferLayout] : []))
        );
        this.appendableColumns = appendableColumns;

        const fields: arrow.Field[] = [];
        for (const column of appendableColumns) {
          const {attributeName, bufferLayout, field: sourceField} = column;
          const field = new arrow.Field(
            attributeName,
            sourceField.type,
            sourceField.nullable,
            new Map(sourceField.metadata)
          );
          const gpuVector = new GPUVector({
            type: 'appendable',
            name: attributeName,
            device: options.device,
            arrowType: sourceField.type as AttributeArrowType | arrow.Utf8,
            initialCapacityRows: options.initialCapacityRows,
            capacityGrowthFactor: options.capacityGrowthFactor,
            bufferProps: options.bufferProps
          } as any);

          fields.push(field);
          this.gpuVectors[attributeName] = gpuVector;
          if (bufferLayout) {
            this.attributes[attributeName] = gpuVector.buffer;
          } else {
            this.bindings[attributeName] = gpuVector.buffer;
          }
        }

        this.schema = new arrow.Schema(fields, new Map(options.schema.metadata));
        this.numCols = fields.length;
        return;
      }

      const {vectors, bufferLayout, fields, metadata, nullCount = 0} = deviceOrProps;
      const vectorCollection = createGPUVectorCollection({
        ownerName: 'GPURecordBatch',
        vectors,
        bufferLayout,
        fields
      });

      this.numRows = vectorCollection.numRows;
      this.nullCount = nullCount;
      Object.assign(this.gpuVectors, vectorCollection.gpuVectors);
      Object.assign(this.attributes, vectorCollection.attributes);
      this.bufferLayout.push(...vectorCollection.bufferLayout);

      this.schema = new arrow.Schema(vectorCollection.fields, metadata);
      this.numCols = vectorCollection.fields.length;
      return;
    }

    const device = deviceOrProps;
    const batch = recordBatch!;
    const options = props!;
    const table = new arrow.Table([batch]);

    this.numRows = batch.numRows;
    this.nullCount = batch.nullCount;
    this.bufferLayout = getArrowBufferLayout(options.shaderLayout, {
      arrowTable: table,
      arrowPaths: options.arrowPaths,
      allowWebGLOnlyFormats: options.allowWebGLOnlyFormats
    });

    const fields: arrow.Field[] = [];
    const selectedNames = new Set<string>();
    for (const bufferLayout of this.bufferLayout) {
      const arrowPath = options.arrowPaths?.[bufferLayout.name] || bufferLayout.name;
      const vector = getArrowVectorByPath(table, arrowPath);
      const sourceField = getArrowFieldByPath(table, arrowPath);
      const field = new arrow.Field(
        bufferLayout.name,
        vector.type,
        sourceField.nullable,
        new Map(sourceField.metadata)
      );
      const gpuVector = new GPUVector(
        device,
        vector as arrow.Vector<AttributeArrowType>,
        options.bufferProps as GPUVectorBufferProps
      );

      fields.push(field);
      selectedNames.add(bufferLayout.name);
      this.gpuVectors[bufferLayout.name] = gpuVector;
      if (bufferLayout.attributes) {
        for (const attribute of bufferLayout.attributes) {
          this.attributes[attribute.attribute] = gpuVector.buffer;
        }
      } else {
        this.attributes[bufferLayout.name] = gpuVector.buffer;
      }
    }

    for (const storageBinding of getArrowStorageBindings(options.shaderLayout)) {
      if (selectedNames.has(storageBinding.name)) {
        throw new Error(
          `GPURecordBatch shader input "${storageBinding.name}" cannot be both an attribute and a storage binding`
        );
      }
      const arrowPath = options.arrowPaths?.[storageBinding.name] || storageBinding.name;
      const vector = tryGetArrowVectorByPath(table, arrowPath);
      const sourceField = tryGetArrowFieldByPath(table, arrowPath);
      if (!vector || !sourceField) {
        continue;
      }
      const gpuVector = new GPUVector(
        device,
        vector as arrow.Vector<AttributeArrowType>,
        options.bufferProps as GPUVectorBufferProps
      );
      const field = new arrow.Field(
        storageBinding.name,
        vector.type,
        sourceField.nullable,
        new Map(sourceField.metadata)
      );

      fields.push(field);
      selectedNames.add(storageBinding.name);
      this.gpuVectors[storageBinding.name] = gpuVector;
      this.bindings[storageBinding.name] = getSingleGPUVectorDataBuffer(
        gpuVector,
        storageBinding.name
      );
    }

    this.schema = new arrow.Schema(fields, new Map(batch.schema.metadata));
    this.numCols = fields.length;
  }

  /** Appends one Arrow record batch into this appendable GPU record batch. */
  addToLastBatch(recordBatch: arrow.RecordBatch): this {
    if (!this.appendableColumns) {
      throw new Error('GPURecordBatch.addToLastBatch() requires appendable batch storage');
    }
    const pendingData = getAppendableGPUColumnData(
      recordBatch,
      this.appendableColumns,
      'GPURecordBatch.addToLastBatch()'
    );
    for (const {column, data} of pendingData) {
      const vector = this.gpuVectors[column.attributeName];
      vector.addToLastData(data as any);
    }
    this.numRows += recordBatch.numRows;
    this.nullCount += recordBatch.nullCount;
    return this;
  }

  /** Clears appendable vector rows while retaining reusable DynamicBuffer allocations. */
  resetLastBatch(): this {
    if (!this.appendableColumns) {
      throw new Error('GPURecordBatch.resetLastBatch() requires appendable batch storage');
    }
    for (const vector of Object.values(this.gpuVectors)) {
      vector.resetLastBatch();
    }
    this.numRows = 0;
    this.nullCount = 0;
    return this;
  }

  /** Destroys every owned GPU vector retained by this batch. */
  destroy(): void {
    for (const gpuVector of Object.values(this.gpuVectors)) {
      gpuVector.destroy();
    }
  }
}

function getSingleGPUVectorDataBuffer(vector: GPUVector, bindingName: string): DynamicBuffer {
  const [data, ...remainingData] = vector.data;
  if (!data || remainingData.length > 0) {
    throw new Error(
      `GPURecordBatch storage binding "${bindingName}" requires exactly one GPUData chunk`
    );
  }
  return data.buffer;
}

function getArrowStorageBindings(shaderLayout: ShaderLayout): Array<{name: string}> {
  return shaderLayout.bindings.filter(
    binding =>
      (binding.type === 'storage' || binding.type === 'read-only-storage') && !('format' in binding)
  );
}

function tryGetArrowVectorByPath(table: arrow.Table, path: string): arrow.Vector | null {
  try {
    return getArrowVectorByPath(table, path);
  } catch {
    return null;
  }
}

function tryGetArrowFieldByPath(table: arrow.Table, path: string): arrow.Field | null {
  try {
    return getArrowFieldByPath(table, path);
  } catch {
    return null;
  }
}
