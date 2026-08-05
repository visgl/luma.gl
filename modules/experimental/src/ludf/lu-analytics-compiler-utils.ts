// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type Binding, type Device} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {
  GPUData,
  GPURecordBatch,
  GPUTable,
  GPUVector,
  type GPUField,
  type GPUTypeMap
} from '@luma.gl/tables';
import {
  GraphVectorView,
  type GPUCommandGraph,
  type GraphBufferUse,
  type GraphDataView
} from '../gpu-primitives/gpu-command-graph';
import {GPUMask} from '../gpu-primitives/gpu-mask';
import {
  createTransientVectorView,
  createTransientView,
  getViewBinding
} from '../gpu-primitives/graph-data-view-utils';
import type {LuDataFrame} from './lu-data-frame';
import type {
  LuDataFrameQueryExtensionContext,
  LuDataFrameQueryParameters
} from './lu-query-compiler';

/** Portable scalar GPU formats accepted by global analytics and numeric histograms. @internal */
export type LuAnalyticsScalarFormat = 'float32' | 'sint32' | 'uint32';

/** Portable compute-group size shared by source-aligned analytics helper passes. @internal */
export const LU_ANALYTICS_WORKGROUP_SIZE = 256;

const UINT32_BYTE_LENGTH = Uint32Array.BYTES_PER_ELEMENT;
const MAXIMUM_UINT32 = 0xffffffff;

/** Rejects unsupported constants, unknown source nullability, and possible uint32-count overflow. */
export function validateLuAnalyticsSource<Source extends GPUTypeMap>(
  source: LuDataFrame<Source>,
  columnNames: readonly string[]
): void {
  if (source.numRows > MAXIMUM_UINT32) {
    throw new Error('LuDataFrame analytics counts cannot represent more than uint32 source rows');
  }
  for (const name of new Set(columnNames)) {
    if (source.table.gpuConstants[name]) {
      throw new Error(`LuDataFrame analytics column "${name}" must contain GPU vector data`);
    }
    const vector = source.table.gpuVectors[name];
    if (vector) {
      validateLuAnalyticsVectorLayout(vector, name);
    }
    const field = source.schema.fields.find(candidate => candidate.name === name);
    if (field?.nullable && source.numRows > 0 && !source.validity[name as keyof Source & string]) {
      throw new Error(`LuDataFrame nullable analytics column "${name}" requires GPU validity`);
    }
  }
}

/** Validates dense output storage and existing one-dimensional histogram dispatch constraints. */
export function validateLuAnalyticsOutputLength(
  graph: GPUCommandGraph<LuDataFrameQueryParameters>,
  length: number
): void {
  if (!Number.isSafeInteger(length) || length <= 0 || length > MAXIMUM_UINT32) {
    throw new Error('LuDataFrame analytics output requires a positive uint32 length');
  }
  if (length > graph.device.limits.maxComputeWorkgroupsPerDimension * LU_ANALYTICS_WORKGROUP_SIZE) {
    throw new Error('LuDataFrame analytics output exceeds the supported dispatch capacity');
  }
  const byteLength = length * UINT32_BYTE_LENGTH;
  if (
    byteLength > graph.device.limits.maxBufferSize ||
    byteLength > graph.device.limits.maxStorageBufferBindingSize
  ) {
    throw new Error('LuDataFrame analytics output exceeds available GPU buffer capacity');
  }
}

/** Resolves one packed selected source/derived vector or a schema-only empty vector. */
export function getLuAnalyticsVector<Selection extends GPUTypeMap>(
  context: LuDataFrameQueryExtensionContext<Selection>,
  name: string
): GPUVector<LuAnalyticsScalarFormat> {
  if (context.table.gpuConstants[name]) {
    throw new Error(`LuDataFrame analytics column "${name}" must contain GPU vector data`);
  }
  const field = context.table.schema.fields.find(candidate => candidate.name === name);
  const vector = context.table.gpuVectors[name];
  const format = vector?.format ?? field?.format;
  if (
    !field ||
    (format !== 'float32' && format !== 'sint32' && format !== 'uint32') ||
    (!vector && context.table.batches.length > 0)
  ) {
    throw new Error(`LuDataFrame analytics column "${name}" requires a 32-bit scalar GPU vector`);
  }
  if (!vector) {
    return new GPUVector({type: 'data', name, format, data: [], ownsData: false});
  }
  validateLuAnalyticsVectorLayout(vector, name);
  return vector as GPUVector<LuAnalyticsScalarFormat>;
}

/** Rejects interleaved, padded, or misaligned rows before packed scalar shaders can consume them. */
function validateLuAnalyticsVectorLayout(vector: GPUVector, name: string): void {
  if (
    vector.bufferLayout ||
    vector.stride !== 1 ||
    vector.byteStride !== UINT32_BYTE_LENGTH ||
    vector.rowByteLength !== UINT32_BYTE_LENGTH ||
    vector.data.some(
      chunk =>
        chunk.stride !== 1 ||
        chunk.byteStride !== UINT32_BYTE_LENGTH ||
        chunk.rowByteLength !== UINT32_BYTE_LENGTH ||
        chunk.byteOffset % UINT32_BYTE_LENGTH !== 0
    )
  ) {
    throw new Error(
      `LuDataFrame analytics column "${name}" requires packed, uint32-aligned scalar GPU data`
    );
  }
}

/** Intersects query selection with an explicit nullable source/derived validity sidecar. */
export function getLuAnalyticsSelectionMask<Selection extends GPUTypeMap>(
  context: LuDataFrameQueryExtensionContext<Selection>,
  name: string,
  id: string
): GraphVectorView<'uint32'> {
  const field = context.table.schema.fields.find(candidate => candidate.name === name);
  if (!field?.nullable) {
    return context.selectionMask;
  }
  const validity = context.validity[name as keyof Selection & string];
  if (!validity) {
    if (context.selectionMask.length === 0) {
      return context.selectionMask;
    }
    throw new Error(`LuDataFrame nullable analytics column "${name}" requires GPU validity`);
  }
  const validityView = context.graph.importGPUVector(`${id}-validity`, validity);
  const output = createTransientVectorView(
    context.graph,
    `${id}-combined-mask`,
    context.selectionMask
  );
  new GPUMask({
    id: `${id}-combine-validity`,
    inputs: [context.selectionMask, validityView],
    output
  }).addToGraph(context.graph);
  return output;
}

/** Creates graph-owned scalar scratch while retaining exact source row and batch topology. */
export function createLuAnalyticsTransientVector<Format extends LuAnalyticsScalarFormat>(
  graph: GPUCommandGraph<LuDataFrameQueryParameters>,
  id: string,
  template: GraphVectorView,
  format: Format
): GraphVectorView<Format> {
  let emptyChunk: GraphDataView<Format> | undefined;
  const data = template.data.map((chunk, chunkIndex) => {
    if (chunk.length === 0) {
      emptyChunk ??= createTransientView(graph, `${id}-empty`, format, 0);
      return emptyChunk;
    }
    return createTransientView(graph, `${id}-chunk-${chunkIndex}`, format, chunk.length);
  });
  return new GraphVectorView({
    id,
    name: id,
    format,
    length: template.length,
    valueLength: template.length,
    stride: 1,
    byteStride: UINT32_BYTE_LENGTH,
    rowByteLength: UINT32_BYTE_LENGTH,
    data
  });
}

/** Allocates one explicitly owned, renderer-compatible scalar result vector. */
export function createLuAnalyticsOutputVector<Format extends LuAnalyticsScalarFormat>(
  device: Device,
  name: string,
  format: Format,
  length: number
): GPUVector<Format> {
  const buffer = device.createBuffer({
    id: name,
    byteLength: Math.max(length, 1) * UINT32_BYTE_LENGTH,
    usage: Buffer.STORAGE | Buffer.VERTEX | Buffer.COPY_SRC | Buffer.COPY_DST
  });
  try {
    const data = new GPUData({buffer, format, length, ownsBuffer: true});
    return new GPUVector({type: 'data', name, format, data: [data], ownsData: true});
  } catch (error) {
    buffer.destroy();
    throw error;
  }
}

/** Builds one dense output batch from borrowed wrappers while preserving source schema metadata. */
export function createLuAnalyticsResultTable<Source extends GPUTypeMap, Result extends GPUTypeMap>(
  source: GPUTable<Source>,
  fields: readonly GPUField[],
  vectors: ReadonlyMap<string, GPUVector<LuAnalyticsScalarFormat>>
): GPUTable<Result> {
  const gpuData: Record<string, GPUData> = {};
  for (const field of fields) {
    const data = vectors.get(field.name)?.data[0];
    if (!data) {
      throw new Error(`LuDataFrame analytics result is missing column "${field.name}"`);
    }
    gpuData[field.name] = new GPUData({
      buffer: data.buffer,
      format: data.format,
      length: data.length,
      ownsBuffer: false
    });
  }
  const batch = new GPURecordBatch<Result>({
    gpuData,
    fields: [...fields],
    metadata: new Map(source.schema.metadata)
  });
  try {
    return new GPUTable<Result>({batches: [batch]});
  } catch (error) {
    batch.destroy();
    throw error;
  }
}

/** Adds one safely bound scalar computation without changing graph ownership or submission. */
export function addLuAnalyticsComputePass(
  graph: GPUCommandGraph<LuDataFrameQueryParameters>,
  props: {
    id: string;
    source: string;
    resources: readonly GraphBufferUse[];
    bindings: Readonly<Record<string, GraphDataView>>;
    length: number;
  }
): void {
  graph.addComputePass({
    id: props.id,
    resources: [...props.resources],
    compile: ({device}) => {
      const computation = new Computation(device, {
        id: props.id,
        source: props.source,
        shaderLayout: {
          bindings: Object.keys(props.bindings).map((name, location) => ({
            name,
            type: 'storage' as const,
            group: 0,
            location
          }))
        }
      });
      return {
        encode: ({computePass, getBuffer}) => {
          const bindings: Record<string, Binding> = {};
          for (const [name, view] of Object.entries(props.bindings)) {
            bindings[name] = getViewBinding(view, getBuffer);
          }
          computation.setBindings(bindings);
          computation.dispatch(
            computePass,
            Math.max(1, Math.ceil(props.length / LU_ANALYTICS_WORKGROUP_SIZE))
          );
        },
        destroy: () => computation.destroy()
      };
    }
  });
}

/** Maps only closed scalar storage formats to native WGSL scalar names. */
export function getLuAnalyticsShaderType(format: LuAnalyticsScalarFormat): 'f32' | 'i32' | 'u32' {
  switch (format) {
    case 'float32':
      return 'f32';
    case 'sint32':
      return 'i32';
    case 'uint32':
      return 'u32';
  }
}
