// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type Binding, type Device, type ShaderLayout} from '@luma.gl/core';
import {Computation, DynamicBuffer} from '@luma.gl/engine';
import {fp64arithmetic, type ShaderModule} from '@luma.gl/shadertools';
import {GPUData, GPUVector} from '@luma.gl/tables';
import {FixedSizeList, Float32, Vector} from 'apache-arrow';
import {getArrowVectorBufferSource} from '../gpu/arrow-gpu-data';
import {
  getArrowMatrixVectorInfo,
  makeArrowMatrixVector,
  type ArrowMatrixValueType,
  type ArrowMatrixVectorInfo
} from './arrow-matrix-vector';

type ArrowMatrixVector = Vector<FixedSizeList<ArrowMatrixValueType>>;
type ArrowMatrixGPUVector = GPUVector;

/** Options used when converting one Arrow matrix column for GPU consumption. */
export type ConvertArrowMatrixToGPUVectorOptions = {
  /** Stable GPU vector name. Defaults to `matrix`. */
  name?: string;
  /** Stable resource id prefix. Defaults to the vector name. */
  id?: string;
};

/** Canonical Float32 matrix GPU vector plus recovered source/output metadata. */
export type PreparedArrowMatrixGPUVector = {
  /** Canonical column-major WGSL-storage matrix GPU vector. */
  matrix: GPUVector;
  /** Alias for callers that prefer the generic vector name. */
  vector: GPUVector;
  /** Source matrix metadata recovered before conversion. */
  sourceInfo: ArrowMatrixVectorInfo;
  /** Canonical output matrix metadata. */
  matrixInfo: ArrowMatrixVectorInfo;
  /** Releases owned GPU resources. */
  destroy: () => void;
};

const MATRIX_CONVERSION_SHADER_LAYOUT: ShaderLayout = {
  bindings: [
    {name: 'sourceMatrixValues', type: 'read-only-storage', group: 0, location: 0},
    {name: 'matrixConversionConfig', type: 'read-only-storage', group: 0, location: 1},
    {name: 'preparedMatrixValues', type: 'storage', group: 0, location: 2}
  ],
  attributes: []
};

/** Convert one metadata-tagged Arrow matrix column to canonical Float32 GPU storage. */
export async function convertArrowMatrixToGPUVector(
  device: Device,
  source: ArrowMatrixVector | ArrowMatrixGPUVector,
  options: ConvertArrowMatrixToGPUVectorOptions = {}
): Promise<PreparedArrowMatrixGPUVector> {
  const sourceInfo = getRequiredArrowMatrixVectorInfo(source);
  const name = options.name || 'matrix';
  const id = options.id || name;

  if (source instanceof GPUVector) {
    if (isCanonicalFloat32Matrix(sourceInfo)) {
      const matrix = source as GPUVector;
      return createPreparedArrowMatrixGPUVector(matrix, sourceInfo, false);
    }
    if (device.type !== 'webgpu') {
      throw new Error(
        'convertArrowMatrixToGPUVector requires WebGPU for non-canonical GPU matrices'
      );
    }
    return convertArrowMatrixToGPUVectorOnGPU(device, source, sourceInfo, {name, id});
  }

  const canonicalVector = isCanonicalFloat32Matrix(sourceInfo)
    ? (source as Vector<FixedSizeList<Float32>>)
    : makeCanonicalArrowMatrixVector(source, sourceInfo);
  const matrix = makeArrowMatrixGPUVector(device, canonicalVector, {name, id});
  return createPreparedArrowMatrixGPUVector(matrix, sourceInfo, true);
}

function createPreparedArrowMatrixGPUVector(
  matrix: GPUVector,
  sourceInfo: ArrowMatrixVectorInfo,
  ownsMatrix: boolean
): PreparedArrowMatrixGPUVector {
  const matrixInfo = getRequiredArrowMatrixVectorInfo(matrix);
  let destroyed = false;
  return {
    matrix,
    vector: matrix,
    sourceInfo,
    matrixInfo,
    destroy: () => {
      if (!ownsMatrix || destroyed) {
        return;
      }
      destroyed = true;
      matrix.destroy();
    }
  };
}

async function convertArrowMatrixToGPUVectorOnGPU(
  device: Device,
  source: ArrowMatrixGPUVector,
  sourceInfo: ArrowMatrixVectorInfo,
  options: Required<Pick<ConvertArrowMatrixToGPUVectorOptions, 'name' | 'id'>>
): Promise<PreparedArrowMatrixGPUVector> {
  const outputType = makeArrowMatrixVector(
    sourceInfo.shape,
    new Float32Array(sourceInfo.logicalComponentCount)
  ).type;
  const outputInfo = getRequiredArrowMatrixVectorInfo({type: outputType});
  const outputData: GPUData[] = [];
  const transientResources: Array<{destroy: () => void}> = [];

  for (const [chunkIndex, sourceData] of source.data.entries()) {
    const configBuffer = device.createBuffer({
      id: `${options.id}-matrix-config-${chunkIndex}`,
      usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      data: new Uint32Array([
        sourceData.length,
        sourceInfo.columns,
        sourceInfo.rows,
        sourceInfo.physicalComponentCount,
        sourceInfo.columnStride,
        outputInfo.physicalComponentCount,
        outputInfo.columnStride,
        sourceInfo.order === 'row-major' ? 1 : 0
      ])
    });
    const outputBuffer = new DynamicBuffer(device, {
      id: `${options.id}-matrix-values-${chunkIndex}`,
      usage: Buffer.VERTEX | Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      byteLength: Math.max(
        Float32Array.BYTES_PER_ELEMENT,
        sourceData.length * outputInfo.byteStride
      )
    });
    dispatchArrowMatrixConversion(device, sourceInfo, {
      id: options.id,
      chunkIndex,
      scalarCount: sourceData.length * outputInfo.physicalComponentCount,
      sourceMatrixValues: getGPUDataBinding(sourceData),
      matrixConversionConfig: configBuffer,
      preparedMatrixValues: outputBuffer
    });
    outputData.push(
      new GPUData({
        buffer: outputBuffer,
        dataType: outputType,
        format: 'float32x4',
        length: sourceData.length,
        stride: outputInfo.physicalComponentCount,
        byteStride: outputInfo.byteStride,
        rowByteLength: outputInfo.byteStride,
        ownsBuffer: true
      })
    );
    transientResources.push(configBuffer);
  }

  await waitForSubmittedWork(device);
  for (const resource of transientResources) {
    resource.destroy();
  }

  const matrix = new GPUVector({
    type: 'data',
    name: options.name,
    dataType: outputType,
    format: 'float32x4',
    data: outputData,
    stride: outputInfo.physicalComponentCount,
    byteStride: outputInfo.byteStride,
    rowByteLength: outputInfo.byteStride,
    ownsData: true
  });
  return createPreparedArrowMatrixGPUVector(matrix, sourceInfo, true);
}

function dispatchArrowMatrixConversion(
  device: Device,
  sourceInfo: ArrowMatrixVectorInfo,
  props: {
    id: string;
    chunkIndex: number;
    scalarCount: number;
    sourceMatrixValues: Binding;
    matrixConversionConfig: Binding;
    preparedMatrixValues: Binding;
  }
): void {
  const computation = new Computation(device, {
    id: `${props.id}-matrix-conversion-${props.chunkIndex}`,
    source: getArrowMatrixConversionSource(sourceInfo),
    ...(sourceInfo.valueType === 'float64' ? {modules: [fp64arithmetic as ShaderModule]} : {}),
    shaderLayout: MATRIX_CONVERSION_SHADER_LAYOUT,
    bindings: {
      sourceMatrixValues: props.sourceMatrixValues,
      matrixConversionConfig: props.matrixConversionConfig,
      preparedMatrixValues: props.preparedMatrixValues
    }
  });
  if (props.scalarCount > 0) {
    const computePass = device.beginComputePass({});
    computation.dispatch(computePass, Math.ceil(props.scalarCount / 64));
    computePass.end();
    device.submit();
  }
  computation.destroy();
}

function getArrowMatrixConversionSource(sourceInfo: ArrowMatrixVectorInfo): string {
  const sourceType = sourceInfo.valueType === 'float64' ? 'array<vec2<u32>>' : 'array<f32>';
  const readSourceScalar =
    sourceInfo.valueType === 'float64'
      ? `
fn readSourceScalar(scalarIndex : u32) -> f32 {
  return sub_fp64u32_to_f32(sourceMatrixValues[scalarIndex].yx, vec2<u32>(0u, 0u));
}
`
      : `
fn readSourceScalar(scalarIndex : u32) -> f32 {
  return sourceMatrixValues[scalarIndex];
}
`;
  return /* wgsl */ `
@group(0) @binding(0) var<storage, read> sourceMatrixValues : ${sourceType};
@group(0) @binding(1) var<storage, read> matrixConversionConfig : array<u32>;
@group(0) @binding(2) var<storage, read_write> preparedMatrixValues : array<f32>;

${readSourceScalar}

fn getSourceScalarIndex(matrixIndex : u32, columnIndex : u32, rowIndex : u32) -> u32 {
  let columns = matrixConversionConfig[1];
  let sourcePhysicalComponentCount = matrixConversionConfig[3];
  let sourceColumnStride = matrixConversionConfig[4];
  let sourceOrder = matrixConversionConfig[7];
  let matrixOffset = matrixIndex * sourcePhysicalComponentCount;
  if (sourceOrder == 0u) {
    return matrixOffset + columnIndex * sourceColumnStride + rowIndex;
  }
  return matrixOffset + rowIndex * columns + columnIndex;
}

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) globalInvocationId : vec3<u32>) {
  let scalarIndex = globalInvocationId.x;
  let rowCount = matrixConversionConfig[0];
  let columns = matrixConversionConfig[1];
  let rows = matrixConversionConfig[2];
  let targetPhysicalComponentCount = matrixConversionConfig[5];
  let targetColumnStride = matrixConversionConfig[6];
  if (scalarIndex >= rowCount * targetPhysicalComponentCount) {
    return;
  }

  let matrixIndex = scalarIndex / targetPhysicalComponentCount;
  let matrixScalarIndex = scalarIndex % targetPhysicalComponentCount;
  let columnIndex = matrixScalarIndex / targetColumnStride;
  let rowIndex = matrixScalarIndex % targetColumnStride;
  if (columnIndex >= columns || rowIndex >= rows) {
    preparedMatrixValues[scalarIndex] = 0.0;
    return;
  }
  preparedMatrixValues[scalarIndex] = readSourceScalar(
    getSourceScalarIndex(matrixIndex, columnIndex, rowIndex)
  );
}
`;
}

function makeCanonicalArrowMatrixVector(
  source: ArrowMatrixVector,
  sourceInfo: ArrowMatrixVectorInfo
): Vector<FixedSizeList<Float32>> {
  const sourceValues = getArrowVectorBufferSource(source as Vector<any>) as
    | Float32Array
    | Float64Array;
  const canonicalValues = new Float32Array(source.length * sourceInfo.logicalComponentCount);

  for (let matrixIndex = 0; matrixIndex < source.length; matrixIndex++) {
    const targetMatrixOffset = matrixIndex * sourceInfo.logicalComponentCount;
    for (let columnIndex = 0; columnIndex < sourceInfo.columns; columnIndex++) {
      for (let rowIndex = 0; rowIndex < sourceInfo.rows; rowIndex++) {
        canonicalValues[targetMatrixOffset + columnIndex * sourceInfo.rows + rowIndex] = Number(
          sourceValues[getMatrixSourceScalarIndex(sourceInfo, matrixIndex, columnIndex, rowIndex)]
        );
      }
    }
  }

  return makeArrowMatrixVector(sourceInfo.shape, canonicalValues);
}

function makeArrowMatrixGPUVector(
  device: Device,
  vector: Vector<FixedSizeList<Float32>>,
  options: Required<Pick<ConvertArrowMatrixToGPUVectorOptions, 'name' | 'id'>>
): GPUVector {
  const matrixInfo = getRequiredArrowMatrixVectorInfo(vector);
  const buffer = new DynamicBuffer(device, {
    id: options.id,
    usage: Buffer.VERTEX | Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
    data: getArrowVectorBufferSource(vector as Vector<any>) as Float32Array
  });
  return new GPUVector({
    type: 'data',
    name: options.name,
    dataType: vector.type,
    format: 'float32x4',
    data: [
      new GPUData({
        buffer,
        dataType: vector.type,
        format: 'float32x4',
        length: vector.length,
        valueLength: vector.data.reduce(
          (totalValueLength, chunk) => totalValueLength + chunk.length,
          0
        ),
        stride: matrixInfo.physicalComponentCount,
        byteStride: matrixInfo.byteStride,
        rowByteLength: matrixInfo.byteStride,
        ownsBuffer: true
      })
    ],
    stride: matrixInfo.physicalComponentCount,
    byteStride: matrixInfo.byteStride,
    rowByteLength: matrixInfo.byteStride,
    ownsData: true
  });
}

function getMatrixSourceScalarIndex(
  matrixInfo: ArrowMatrixVectorInfo,
  matrixIndex: number,
  columnIndex: number,
  rowIndex: number
): number {
  const matrixOffset = matrixIndex * matrixInfo.physicalComponentCount;
  return matrixInfo.order === 'column-major'
    ? matrixOffset + columnIndex * matrixInfo.columnStride + rowIndex
    : matrixOffset + rowIndex * matrixInfo.columns + columnIndex;
}

function getRequiredArrowMatrixVectorInfo(
  vector: Pick<Vector, 'type'> | Pick<GPUVector, 'dataType'>
): ArrowMatrixVectorInfo {
  const matrixInfo = getArrowMatrixVectorInfo(vector);
  if (!matrixInfo) {
    throw new Error(
      'convertArrowMatrixToGPUVector requires FixedSizeList<Float32|Float64> matrix metadata'
    );
  }
  return matrixInfo;
}

function isCanonicalFloat32Matrix(matrixInfo: ArrowMatrixVectorInfo): boolean {
  return (
    matrixInfo.valueType === 'float32' &&
    matrixInfo.order === 'column-major' &&
    matrixInfo.layout === 'wgsl-storage'
  );
}

function getGPUDataBinding(data: GPUData): Binding {
  return {
    buffer: getGPUDataBuffer(data),
    offset: data.byteOffset,
    size: data.length * data.byteStride
  };
}

function getGPUDataBuffer(data: GPUData): Buffer {
  return data.buffer instanceof DynamicBuffer ? data.buffer.buffer : data.buffer;
}

async function waitForSubmittedWork(device: Device): Promise<void> {
  const queue = (
    device as Device & {handle?: {queue?: {onSubmittedWorkDone?: () => Promise<void>}}}
  ).handle?.queue;
  await queue?.onSubmittedWorkDone?.();
}
