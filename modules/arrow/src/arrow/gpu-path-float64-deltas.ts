// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type Binding, type Device, type ShaderLayout} from '@luma.gl/core';
import {Computation, DynamicBuffer} from '@luma.gl/engine';
import {fp64arithmetic, type ShaderModule} from '@luma.gl/shadertools';
import {GPUData, GPUVector} from '@luma.gl/tables';
import {Data, DataType, Field, FixedSizeList, Float32, Float64, List, Vector} from 'apache-arrow';
import {getArrowVariableLengthAttributeDataBufferSource} from './arrow-gpu-data';

type ArrowPathCoordinateType = List<FixedSizeList<Float32>>;
type ArrowPathFloat64CoordinateType = List<FixedSizeList<Float64>>;

/** Stable resource naming options for WebGPU Float64 path delta preparation. */
export type GpuPathFloat64DeltaPreparationOptions = {
  /** Stable resource id prefix. */
  id?: string;
};

/** Prepared Float32 path deltas plus retained Float64 source origins. */
export type GpuPathFloat64DeltaPreparation = {
  /** Prepared Float32 path deltas, one Arrow row per path. */
  paths: GPUVector<ArrowPathCoordinateType>;
  /** First Float64 source point per path row, padded to four components. */
  sourceOrigins: Float64Array;
};

const GPU_PATH_FLOAT64_DELTA_COMPUTE_SOURCE = /* wgsl */ `
@group(0) @binding(0) var<storage, read> sourcePathValues : array<vec2<u32>>;
@group(0) @binding(1) var<storage, read> sourcePathValueOffsets : array<u32>;
@group(0) @binding(2) var<storage, read> pathDeltaConfig : array<u32>;
@group(0) @binding(3) var<storage, read_write> pathDeltaValues : array<f32>;

fn readSourcePathValueBits(scalarIndex : u32) -> vec2<u32> {
  // Float64Array uploads preserve host word order. Browser and Node WebGPU
  // runtimes are little-endian, while fp64u32 helpers consume canonical hi/lo.
  return sourcePathValues[scalarIndex].yx;
}

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) globalInvocationId : vec3<u32>) {
  let rowIndex = globalInvocationId.x;
  let rowCount = pathDeltaConfig[0];
  if (rowIndex >= rowCount) {
    return;
  }

  let componentCount = pathDeltaConfig[1];
  let pathStart = sourcePathValueOffsets[rowIndex];
  let pathEnd = sourcePathValueOffsets[rowIndex + 1u];
  if (pathEnd <= pathStart) {
    return;
  }

  var pointIndex = pathStart;
  loop {
    if (pointIndex >= pathEnd) {
      break;
    }
    var componentIndex = 0u;
    loop {
      if (componentIndex >= componentCount) {
        break;
      }
      let scalarIndex = pointIndex * componentCount + componentIndex;
      let originScalarIndex = pathStart * componentCount + componentIndex;
      pathDeltaValues[scalarIndex] = sub_fp64u32_to_f32(
        readSourcePathValueBits(scalarIndex),
        readSourcePathValueBits(originScalarIndex)
      );
      componentIndex += 1u;
    }
    pointIndex += 1u;
  }
}
`;

const GPU_PATH_FLOAT64_DELTA_SHADER_LAYOUT: ShaderLayout = {
  bindings: [
    {name: 'sourcePathValues', type: 'read-only-storage', group: 0, location: 0},
    {name: 'sourcePathValueOffsets', type: 'read-only-storage', group: 0, location: 1},
    {name: 'pathDeltaConfig', type: 'read-only-storage', group: 0, location: 2},
    {name: 'pathDeltaValues', type: 'storage', group: 0, location: 3}
  ],
  attributes: []
};

/** Converts Float64 Arrow path rows into per-row Float32 deltas with WebGPU compute. */
export async function prepareGpuPathFloat64DeltaVector(
  device: Device,
  paths: Vector<ArrowPathFloat64CoordinateType>,
  options: GpuPathFloat64DeltaPreparationOptions = {}
): Promise<GpuPathFloat64DeltaPreparation> {
  if (device.type !== 'webgpu') {
    throw new Error('prepareGpuPathFloat64DeltaVector requires a WebGPU device');
  }

  const componentCount = getArrowPathCoordinateComponentCount(paths.type);
  const pathType = makeArrowPathCoordinateType(componentCount);
  const outputData: GPUData<ArrowPathCoordinateType>[] = [];
  const sourceOrigins = new Float64Array(paths.length * 4);
  const transientResources: Array<{destroy: () => void}> = [];
  let rowIndexBase = 0;

  for (const [chunkIndex, data] of paths.data.entries()) {
    const pathValues = getArrowVariableLengthAttributeDataBufferSource(data) as Float64Array;
    const valueOffsets = getNormalizedArrowPathValueOffsets(data);
    copyArrowPathChunkSourceOrigins(
      sourceOrigins,
      rowIndexBase,
      pathValues,
      valueOffsets,
      componentCount
    );
    const sourcePathValuesBuffer = new DynamicBuffer(device, {
      id: `${options.id || 'arrow-storage-path-model'}-source-path-values-${chunkIndex}`,
      usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      ...(pathValues.length > 0 ? {data: pathValues} : {byteLength: Float64Array.BYTES_PER_ELEMENT})
    });
    const sourcePathValueOffsetsBuffer = device.createBuffer({
      id: `${options.id || 'arrow-storage-path-model'}-source-path-value-offsets-${chunkIndex}`,
      usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      data: new Uint32Array(valueOffsets)
    });
    const pathDeltaConfigBuffer = device.createBuffer({
      id: `${options.id || 'arrow-storage-path-model'}-path-delta-config-${chunkIndex}`,
      usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      data: new Uint32Array([data.length, componentCount])
    });
    const outputPathValuesBuffer = new DynamicBuffer(device, {
      id: `${options.id || 'arrow-storage-path-model'}-path-delta-values-${chunkIndex}`,
      usage: Buffer.VERTEX | Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      byteLength: Math.max(
        Float32Array.BYTES_PER_ELEMENT,
        pathValues.length * Float32Array.BYTES_PER_ELEMENT
      )
    });
    dispatchGpuPathFloat64DeltaCompute(device, options, {
      chunkIndex,
      rowCount: data.length,
      sourcePathValues: sourcePathValuesBuffer,
      sourcePathValueOffsets: sourcePathValueOffsetsBuffer,
      pathDeltaConfig: pathDeltaConfigBuffer,
      pathDeltaValues: outputPathValuesBuffer
    });
    outputData.push(
      new GPUData({
        buffer: outputPathValuesBuffer,
        dataType: pathType,
        length: data.length,
        stride: componentCount,
        byteStride: componentCount * Float32Array.BYTES_PER_ELEMENT,
        rowByteLength: componentCount * Float32Array.BYTES_PER_ELEMENT,
        ownsBuffer: true,
        readbackMetadata: {
          kind: 'variable-length-attribute',
          valueOffsets,
          nullCount: 0,
          valueByteLength: pathValues.length * Float32Array.BYTES_PER_ELEMENT
        }
      })
    );
    transientResources.push(
      sourcePathValuesBuffer,
      sourcePathValueOffsetsBuffer,
      pathDeltaConfigBuffer
    );
    rowIndexBase += data.length;
  }

  await waitForSubmittedWork(device);
  for (const resource of transientResources) {
    resource.destroy();
  }

  return {
    paths: new GPUVector({
      type: 'data',
      name: 'paths',
      dataType: pathType,
      data: outputData,
      stride: componentCount,
      byteStride: componentCount * Float32Array.BYTES_PER_ELEMENT,
      rowByteLength: componentCount * Float32Array.BYTES_PER_ELEMENT,
      ownsData: true
    }),
    sourceOrigins
  };
}

function dispatchGpuPathFloat64DeltaCompute(
  device: Device,
  options: GpuPathFloat64DeltaPreparationOptions,
  props: {
    chunkIndex: number;
    rowCount: number;
    sourcePathValues: Binding;
    sourcePathValueOffsets: Binding;
    pathDeltaConfig: Binding;
    pathDeltaValues: Binding;
  }
): void {
  const computation = new Computation(device, {
    id: `${options.id || 'arrow-storage-path-model'}-path-delta-compute-${props.chunkIndex}`,
    source: GPU_PATH_FLOAT64_DELTA_COMPUTE_SOURCE,
    modules: [fp64arithmetic as ShaderModule],
    shaderLayout: GPU_PATH_FLOAT64_DELTA_SHADER_LAYOUT,
    bindings: {
      sourcePathValues: props.sourcePathValues,
      sourcePathValueOffsets: props.sourcePathValueOffsets,
      pathDeltaConfig: props.pathDeltaConfig,
      pathDeltaValues: props.pathDeltaValues
    }
  });
  if (props.rowCount > 0) {
    const computePass = device.beginComputePass({});
    computation.dispatch(computePass, Math.ceil(props.rowCount / 64));
    computePass.end();
    device.submit();
  }
  computation.destroy();
}

function getArrowPathCoordinateComponentCount(type: DataType): number {
  const pathElementType = type.children[0]?.type;
  if (!pathElementType || !DataType.isFixedSizeList(pathElementType)) {
    throw new Error('Float64 path preparation requires FixedSizeList coordinate elements');
  }
  return pathElementType.listSize;
}

function makeArrowPathCoordinateType(componentCount: number): ArrowPathCoordinateType {
  const coordinateType = new FixedSizeList(
    componentCount,
    new Field('values', new Float32(), false)
  );
  return new List(new Field('coordinates', coordinateType, false)) as ArrowPathCoordinateType;
}

function getNormalizedArrowPathValueOffsets(
  data: Data<ArrowPathFloat64CoordinateType>
): Int32Array {
  const valueOffsets = data.valueOffsets as Int32Array | undefined;
  if (!valueOffsets) {
    throw new Error('Float64 path preparation requires Arrow list offsets');
  }
  const firstElementOffset = valueOffsets[0] ?? 0;
  return Int32Array.from(valueOffsets, valueOffset => valueOffset - firstElementOffset);
}

function copyArrowPathChunkSourceOrigins(
  target: Float64Array,
  rowIndexBase: number,
  pathValues: Float64Array,
  valueOffsets: Int32Array,
  componentCount: number
): void {
  for (let rowIndex = 0; rowIndex < valueOffsets.length - 1; rowIndex++) {
    const pathStart = valueOffsets[rowIndex] ?? 0;
    const pathEnd = valueOffsets[rowIndex + 1] ?? pathStart;
    const pointCount = Math.max(0, pathEnd - pathStart);
    const sourceOriginOffset = (rowIndexBase + rowIndex) * 4;
    if (pointCount === 0) {
      continue;
    }
    const pathOriginOffset = pathStart * componentCount;
    target[sourceOriginOffset] = pathValues[pathOriginOffset] ?? 0;
    target[sourceOriginOffset + 1] = pathValues[pathOriginOffset + 1] ?? 0;
    if (componentCount > 2) {
      target[sourceOriginOffset + 2] = pathValues[pathOriginOffset + 2] ?? 0;
    }
    if (componentCount > 3) {
      target[sourceOriginOffset + 3] = pathValues[pathOriginOffset + 3] ?? 0;
    }
  }
}

async function waitForSubmittedWork(device: Device): Promise<void> {
  const queue = (
    device as Device & {handle?: {queue?: {onSubmittedWorkDone?: () => Promise<void>}}}
  ).handle?.queue;
  await queue?.onSubmittedWorkDone?.();
}
