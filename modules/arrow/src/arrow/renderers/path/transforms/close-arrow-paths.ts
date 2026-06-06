// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type Binding, type Device, type ShaderLayout} from '@luma.gl/core';
import {Computation, DynamicBuffer} from '@luma.gl/engine';
import {GPUData, GPUVector, type GPUVectorFormat} from '@luma.gl/tables';
import {Bool, BufferType, Data, DataType, FixedSizeList, Float32, List, Vector} from 'apache-arrow';
import {
  getArrowVariableLengthAttributeDataBufferSource,
  type GPUDataReadbackMetadata
} from '../../../gpu/arrow-gpu-data';
import {
  makeGPUVectorFromArrow,
  readArrowGPUVectorAsync
} from '../../../gpu/arrow-gpu-table-adapters';
import {isVariableLengthAttributeArrowType} from '../../../core/arrow-types';

type ArrowPathCoordinateType = List<FixedSizeList<Float32>>;

/**
 * Inputs for {@link closeArrowPaths}.
 *
 * The path vector must use `List<FixedSizeList<Float32>>` rows with one to four
 * components per vertex. Closed flags stay CPU-side Arrow booleans so callers can
 * reuse existing row metadata while the path payload remains GPU-resident.
 */
export type CloseArrowPathsProps<Format extends GPUVectorFormat = GPUVectorFormat> = {
  /** Variable-length Float32 path coordinates, one GPU-resident Arrow row per path. */
  paths: GPUVector<Format>;
  /** Non-null closed-path flags, one Arrow Bool row per path. */
  closed: Vector<Bool>;
  /** Non-negative per-component absolute tolerance used to compare the first and last vertex. */
  epsilon: number;
  /** Optional debug id prefix for generated GPU resources. */
  id?: string;
};

type CloseArrowPathChunkState<Format extends GPUVectorFormat = GPUVectorFormat> = {
  pathData: GPUData<Format>;
  valueOffsets: Int32Array;
  valueByteLength: number;
  closedFlags: Uint32Array;
  rowIndexBase: number;
};

type ClosedPathClassificationState = {
  pathRangesBuffer: Buffer;
  closedFlagsBuffer: Buffer;
  pathClosureConfigBuffer: DynamicBuffer;
  needsInjectionBuffer: Buffer;
};

type ClosedPathScatterState = {
  pathScatterRangesBuffer: Buffer;
  pathScatterConfigBuffer: DynamicBuffer;
  outputPathValuesBuffer: DynamicBuffer;
};

const CLOSED_PATH_CLASSIFY_SOURCE = /* wgsl */ `
@group(0) @binding(0) var<storage, read> pathValues : array<f32>;
@group(0) @binding(1) var<storage, read> pathRanges : array<vec2<u32>>;
@group(0) @binding(2) var<storage, read> closedFlags : array<u32>;

struct PathClosureConfig {
  epsilon : f32,
  rowCount : u32,
  componentCount : u32,
  _padding0 : u32,
};

@group(0) @binding(3) var<uniform> pathClosureConfig : PathClosureConfig;
@group(0) @binding(4) var<storage, read_write> needsInjection : array<u32>;

fn readPathComponent(pointIndex: u32, componentIndex: u32) -> f32 {
  return pathValues[pointIndex * pathClosureConfig.componentCount + componentIndex];
}

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) globalInvocationId: vec3<u32>) {
  let rowIndex = globalInvocationId.x;
  if (rowIndex >= pathClosureConfig.rowCount) {
    return;
  }

  needsInjection[rowIndex] = 0u;
  if (closedFlags[rowIndex] == 0u) {
    return;
  }

  let pathRange = pathRanges[rowIndex];
  let pathStart = pathRange.x;
  let pathEnd = pathRange.y;
  let pointCount = select(0u, pathEnd - pathStart, pathEnd >= pathStart);
  if (pointCount <= 1u) {
    return;
  }

  let lastPointIndex = pathStart + pointCount - 1u;
  var componentIndex = 0u;
  loop {
    if (componentIndex >= pathClosureConfig.componentCount) {
      break;
    }
    let firstComponent = readPathComponent(pathStart, componentIndex);
    let lastComponent = readPathComponent(lastPointIndex, componentIndex);
    if (!(abs(firstComponent - lastComponent) <= pathClosureConfig.epsilon)) {
      needsInjection[rowIndex] = 1u;
      return;
    }
    componentIndex += 1u;
  }
}
`;

const CLOSED_PATH_CLASSIFY_SHADER_LAYOUT: ShaderLayout = {
  bindings: [
    {name: 'pathValues', type: 'read-only-storage', group: 0, location: 0},
    {name: 'pathRanges', type: 'read-only-storage', group: 0, location: 1},
    {name: 'closedFlags', type: 'read-only-storage', group: 0, location: 2},
    {name: 'pathClosureConfig', type: 'uniform', group: 0, location: 3},
    {name: 'needsInjection', type: 'storage', group: 0, location: 4}
  ],
  attributes: []
};

const CLOSED_PATH_SCATTER_SOURCE = /* wgsl */ `
@group(0) @binding(0) var<storage, read> pathValues : array<f32>;
@group(0) @binding(1) var<storage, read> pathScatterRanges : array<vec4<u32>>;

struct PathScatterConfig {
  rowCount : u32,
  componentCount : u32,
  _padding0 : u32,
  _padding1 : u32,
};

@group(0) @binding(2) var<uniform> pathScatterConfig : PathScatterConfig;
@group(0) @binding(3) var<storage, read_write> outputPathValues : array<f32>;

fn readPathComponent(pointIndex: u32, componentIndex: u32) -> f32 {
  return pathValues[pointIndex * pathScatterConfig.componentCount + componentIndex];
}

fn writePathComponent(pointIndex: u32, componentIndex: u32, value: f32) {
  outputPathValues[pointIndex * pathScatterConfig.componentCount + componentIndex] = value;
}

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) globalInvocationId: vec3<u32>) {
  let rowIndex = globalInvocationId.x;
  if (rowIndex >= pathScatterConfig.rowCount) {
    return;
  }

  let pathRange = pathScatterRanges[rowIndex];
  let pathStart = pathRange.x;
  let pathEnd = pathRange.y;
  let outputStart = pathRange.z;
  let needsInjection = pathRange.w != 0u;
  let pointCount = select(0u, pathEnd - pathStart, pathEnd >= pathStart);

  var pointOffset = 0u;
  loop {
    if (pointOffset >= pointCount) {
      break;
    }
    var componentIndex = 0u;
    loop {
      if (componentIndex >= pathScatterConfig.componentCount) {
        break;
      }
      writePathComponent(
        outputStart + pointOffset,
        componentIndex,
        readPathComponent(pathStart + pointOffset, componentIndex)
      );
      componentIndex += 1u;
    }
    pointOffset += 1u;
  }

  if (needsInjection && pointCount > 0u) {
    var componentIndex = 0u;
    loop {
      if (componentIndex >= pathScatterConfig.componentCount) {
        break;
      }
      writePathComponent(
        outputStart + pointCount,
        componentIndex,
        readPathComponent(pathStart, componentIndex)
      );
      componentIndex += 1u;
    }
  }
}
`;

const CLOSED_PATH_SCATTER_SHADER_LAYOUT: ShaderLayout = {
  bindings: [
    {name: 'pathValues', type: 'read-only-storage', group: 0, location: 0},
    {name: 'pathScatterRanges', type: 'read-only-storage', group: 0, location: 1},
    {name: 'pathScatterConfig', type: 'uniform', group: 0, location: 2},
    {name: 'outputPathValues', type: 'storage', group: 0, location: 3}
  ],
  attributes: []
};

/**
 * Returns a new nested Arrow path vector with missing explicit closing vertices appended.
 *
 * Closed paths whose first and last vertices match within `epsilon` stay unchanged. Closed paths
 * whose endpoints differ receive one appended copy of their first vertex. Open, empty, and
 * single-point paths remain unchanged.
 *
 * WebGPU devices classify and scatter path payloads on the GPU. Other devices use a CPU
 * reconstruction fallback, then upload the resulting Arrow chunks into a new {@link GPUVector}.
 *
 * @returns A new GPU vector that preserves Arrow chunk boundaries and owns its generated output data.
 */
export async function closeArrowPaths<Format extends GPUVectorFormat = GPUVectorFormat>(
  device: Device,
  props: CloseArrowPathsProps<Format>
): Promise<GPUVector<Format>> {
  const epsilon = assertCloseArrowPathsProps(props);
  const chunkStates = getCloseArrowPathChunkStates(props.paths, props.closed);

  if (device.type !== 'webgpu') {
    return closeArrowPathsOnCPU(device, props, chunkStates, epsilon);
  }

  const outputData = await Promise.all(
    chunkStates.map((chunkState, chunkIndex) =>
      closeArrowPathChunkOnGPU(device, props, chunkState, chunkIndex, epsilon)
    )
  );

  return new GPUVector<Format>({
    type: 'data',
    name: props.paths.name,
    dataType: props.paths.type,
    format: props.paths.format,
    data: outputData,
    stride: props.paths.stride,
    byteStride: props.paths.byteStride,
    rowByteLength: props.paths.rowByteLength,
    ownsData: true
  });
}

function assertCloseArrowPathsProps(props: CloseArrowPathsProps): number {
  assertCloseArrowPathCoordinateType(props.paths.type);
  if (!(props.closed.type instanceof Bool)) {
    throw new Error('closeArrowPaths closed flags must be Vector<Bool>');
  }
  if (props.closed.length !== props.paths.length) {
    throw new Error(
      `closeArrowPaths closed flag rows must match path rows (${props.closed.length} !== ${props.paths.length})`
    );
  }
  if (props.closed.data.some(data => data.nullCount > 0)) {
    throw new Error('closeArrowPaths closed flags cannot contain null rows');
  }
  if (!Number.isFinite(props.epsilon) || props.epsilon < 0) {
    throw new Error('closeArrowPaths epsilon must be a finite non-negative number');
  }
  return Math.fround(props.epsilon);
}

function assertCloseArrowPathCoordinateType(type: DataType): void {
  if (
    !isVariableLengthAttributeArrowType(type) ||
    !DataType.isFixedSizeList(type.children[0].type) ||
    type.children[0].type.listSize < 1 ||
    type.children[0].type.listSize > 4 ||
    !(type.children[0].type.children[0]?.type instanceof Float32)
  ) {
    throw new Error('closeArrowPaths paths must be GPUVector<List<FixedSizeList<Float32>[1..4]>>');
  }
}

function getCloseArrowPathChunkStates<Format extends GPUVectorFormat>(
  paths: GPUVector<Format>,
  closed: Vector<Bool>
): CloseArrowPathChunkState<Format>[] {
  const allClosedFlags = makeClosedFlagValues(closed);
  const chunkStates: CloseArrowPathChunkState<Format>[] = [];
  let rowIndexBase = 0;

  for (const pathData of paths.data) {
    const metadata = pathData.readbackMetadata;
    if (metadata?.kind !== 'variable-length-attribute') {
      throw new Error('closeArrowPaths paths require copied variable-length Arrow offset metadata');
    }
    validateValueOffsets(metadata.valueOffsets, pathData.length);
    chunkStates.push({
      pathData,
      valueOffsets: metadata.valueOffsets,
      valueByteLength: metadata.valueByteLength,
      closedFlags: allClosedFlags.subarray(rowIndexBase, rowIndexBase + pathData.length),
      rowIndexBase
    });
    rowIndexBase += pathData.length;
  }

  return chunkStates;
}

function makeClosedFlagValues(closed: Vector<Bool>): Uint32Array {
  const closedFlags = new Uint32Array(closed.length);
  for (let rowIndex = 0; rowIndex < closed.length; rowIndex++) {
    closedFlags[rowIndex] = closed.get(rowIndex) ? 1 : 0;
  }
  return closedFlags;
}

function validateValueOffsets(valueOffsets: Int32Array, rowCount: number): void {
  if (valueOffsets.length !== rowCount + 1) {
    throw new Error('closeArrowPaths path offsets must contain one trailing entry per path chunk');
  }
  let previousOffset = valueOffsets[0] ?? 0;
  if (previousOffset !== 0) {
    throw new Error('closeArrowPaths path offsets must be normalized to start at zero');
  }
  for (let offsetIndex = 1; offsetIndex < valueOffsets.length; offsetIndex++) {
    const nextOffset = valueOffsets[offsetIndex] ?? previousOffset;
    if (nextOffset < previousOffset) {
      throw new Error('closeArrowPaths path offsets must be monotonically non-decreasing');
    }
    previousOffset = nextOffset;
  }
}

async function closeArrowPathChunkOnGPU<Format extends GPUVectorFormat>(
  device: Device,
  props: CloseArrowPathsProps<Format>,
  chunkState: CloseArrowPathChunkState<Format>,
  chunkIndex: number,
  epsilon: number
): Promise<GPUData<Format>> {
  const componentCount = getPathComponentCount(props.paths.type);
  const classificationState = createClosedPathClassificationState(
    device,
    props,
    chunkState,
    chunkIndex,
    componentCount,
    epsilon
  );

  let injectionFlags: Uint32Array;
  try {
    dispatchClosedPathClassificationCompute(device, props, chunkState, classificationState);
    injectionFlags = await readInjectionFlags(
      classificationState.needsInjectionBuffer,
      chunkState.pathData.length
    );
  } finally {
    classificationState.pathRangesBuffer.destroy();
    classificationState.closedFlagsBuffer.destroy();
    classificationState.pathClosureConfigBuffer.destroy();
    classificationState.needsInjectionBuffer.destroy();
  }

  const outputOffsets = makeClosedPathOffsets(
    chunkState.valueOffsets,
    injectionFlags,
    chunkState.pathData.length
  );
  const scatterState = createClosedPathScatterState(
    device,
    props,
    chunkState,
    chunkIndex,
    componentCount,
    outputOffsets,
    injectionFlags
  );

  try {
    dispatchClosedPathScatterCompute(device, props, chunkState, scatterState);
  } finally {
    scatterState.pathScatterRangesBuffer.destroy();
    scatterState.pathScatterConfigBuffer.destroy();
  }

  const outputValueByteLength =
    (outputOffsets[outputOffsets.length - 1] ?? 0) *
    componentCount *
    Float32Array.BYTES_PER_ELEMENT;
  return new GPUData<Format>({
    buffer: scatterState.outputPathValuesBuffer,
    dataType: props.paths.type,
    format: chunkState.pathData.format,
    length: chunkState.pathData.length,
    stride: chunkState.pathData.stride,
    byteStride: chunkState.pathData.byteStride,
    rowByteLength: chunkState.pathData.rowByteLength,
    ownsBuffer: true,
    readbackMetadata: makeClosedPathReadbackMetadata(outputOffsets, outputValueByteLength)
  });
}

function createClosedPathClassificationState(
  device: Device,
  props: CloseArrowPathsProps,
  chunkState: CloseArrowPathChunkState,
  chunkIndex: number,
  componentCount: number,
  epsilon: number
): ClosedPathClassificationState {
  const rowCount = chunkState.pathData.length;
  const pathRanges = new Uint32Array(Math.max(rowCount, 1) * 2);
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    const rangeOffset = rowIndex * 2;
    const pathStart = chunkState.valueOffsets[rowIndex] ?? 0;
    const pathEnd = chunkState.valueOffsets[rowIndex + 1] ?? pathStart;
    pathRanges[rangeOffset] = pathStart;
    pathRanges[rangeOffset + 1] = Math.max(pathStart, pathEnd);
  }
  const configData = makePathClosureConfigData(epsilon, rowCount, componentCount);
  const id = props.id || 'closed-arrow-paths';
  return {
    pathRangesBuffer: device.createBuffer({
      id: `${id}-ranges-${chunkIndex}`,
      usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      data: pathRanges
    }),
    closedFlagsBuffer: device.createBuffer({
      id: `${id}-closed-flags-${chunkIndex}`,
      usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      data: padUint32Values(chunkState.closedFlags)
    }),
    pathClosureConfigBuffer: new DynamicBuffer(device, {
      id: `${id}-closure-config-${chunkIndex}`,
      usage: Buffer.UNIFORM | Buffer.COPY_DST | Buffer.COPY_SRC,
      data: configData
    }),
    needsInjectionBuffer: device.createBuffer({
      id: `${id}-needs-injection-${chunkIndex}`,
      usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      data: new Uint32Array(Math.max(rowCount, 1))
    })
  };
}

function dispatchClosedPathClassificationCompute(
  device: Device,
  props: CloseArrowPathsProps,
  chunkState: CloseArrowPathChunkState,
  state: ClosedPathClassificationState
): void {
  const computation = new Computation(device, {
    id: `${props.id || 'closed-arrow-paths'}-classify`,
    source: CLOSED_PATH_CLASSIFY_SOURCE,
    shaderLayout: CLOSED_PATH_CLASSIFY_SHADER_LAYOUT,
    bindings: {
      pathValues: getPathValuesBinding(chunkState),
      pathRanges: state.pathRangesBuffer,
      closedFlags: state.closedFlagsBuffer,
      pathClosureConfig: state.pathClosureConfigBuffer.buffer,
      needsInjection: state.needsInjectionBuffer
    }
  });
  if (chunkState.pathData.length > 0) {
    const computePass = device.beginComputePass({});
    computation.dispatch(computePass, Math.ceil(chunkState.pathData.length / 64));
    computePass.end();
    device.submit();
  }
  computation.destroy();
}

async function readInjectionFlags(buffer: Buffer, rowCount: number): Promise<Uint32Array> {
  if (rowCount === 0) {
    return new Uint32Array(0);
  }
  const bytes = await buffer.readAsync(0, rowCount * Uint32Array.BYTES_PER_ELEMENT);
  return new Uint32Array(bytes.buffer, bytes.byteOffset, rowCount).slice();
}

function createClosedPathScatterState(
  device: Device,
  props: CloseArrowPathsProps,
  chunkState: CloseArrowPathChunkState,
  chunkIndex: number,
  componentCount: number,
  outputOffsets: Int32Array,
  injectionFlags: Uint32Array
): ClosedPathScatterState {
  const rowCount = chunkState.pathData.length;
  const pathScatterRanges = new Uint32Array(Math.max(rowCount, 1) * 4);
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    const rangeOffset = rowIndex * 4;
    const pathStart = chunkState.valueOffsets[rowIndex] ?? 0;
    const pathEnd = chunkState.valueOffsets[rowIndex + 1] ?? pathStart;
    pathScatterRanges[rangeOffset] = pathStart;
    pathScatterRanges[rangeOffset + 1] = Math.max(pathStart, pathEnd);
    pathScatterRanges[rangeOffset + 2] = outputOffsets[rowIndex] ?? 0;
    pathScatterRanges[rangeOffset + 3] = injectionFlags[rowIndex] ?? 0;
  }
  const outputPointCount = outputOffsets[outputOffsets.length - 1] ?? 0;
  const outputScalarCount = outputPointCount * componentCount;
  const outputByteLength = outputScalarCount * Float32Array.BYTES_PER_ELEMENT;
  const id = props.id || 'closed-arrow-paths';
  return {
    pathScatterRangesBuffer: device.createBuffer({
      id: `${id}-scatter-ranges-${chunkIndex}`,
      usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      data: pathScatterRanges
    }),
    pathScatterConfigBuffer: new DynamicBuffer(device, {
      id: `${id}-scatter-config-${chunkIndex}`,
      usage: Buffer.UNIFORM | Buffer.COPY_DST | Buffer.COPY_SRC,
      data: new Uint32Array([rowCount, componentCount, 0, 0])
    }),
    outputPathValuesBuffer: new DynamicBuffer(device, {
      id: `${id}-closed-values-${chunkIndex}`,
      usage: Buffer.VERTEX | Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      byteLength: Math.max(outputByteLength, Float32Array.BYTES_PER_ELEMENT)
    })
  };
}

function dispatchClosedPathScatterCompute(
  device: Device,
  props: CloseArrowPathsProps,
  chunkState: CloseArrowPathChunkState,
  state: ClosedPathScatterState
): void {
  const computation = new Computation(device, {
    id: `${props.id || 'closed-arrow-paths'}-scatter`,
    source: CLOSED_PATH_SCATTER_SOURCE,
    shaderLayout: CLOSED_PATH_SCATTER_SHADER_LAYOUT,
    bindings: {
      pathValues: getPathValuesBinding(chunkState),
      pathScatterRanges: state.pathScatterRangesBuffer,
      pathScatterConfig: state.pathScatterConfigBuffer.buffer,
      outputPathValues: state.outputPathValuesBuffer.buffer
    }
  });
  if (chunkState.pathData.length > 0) {
    const computePass = device.beginComputePass({});
    computation.dispatch(computePass, Math.ceil(chunkState.pathData.length / 64));
    computePass.end();
    device.submit();
  }
  computation.destroy();
}

function getPathValuesBinding(chunkState: CloseArrowPathChunkState): Binding {
  return {
    buffer: getGPUDataBuffer(chunkState.pathData),
    offset: chunkState.pathData.byteOffset,
    ...(chunkState.valueByteLength > 0 ? {size: chunkState.valueByteLength} : {})
  };
}

function getGPUDataBuffer(data: GPUData): Buffer {
  return data.buffer instanceof DynamicBuffer ? data.buffer.buffer : data.buffer;
}

function makePathClosureConfigData(
  epsilon: number,
  rowCount: number,
  componentCount: number
): Uint32Array {
  const arrayBuffer = new ArrayBuffer(16);
  const floatValues = new Float32Array(arrayBuffer);
  const uintValues = new Uint32Array(arrayBuffer);
  floatValues[0] = epsilon;
  uintValues[1] = rowCount;
  uintValues[2] = componentCount;
  return uintValues;
}

function padUint32Values(values: Uint32Array): Uint32Array {
  return values.length > 0 ? values : new Uint32Array(1);
}

function makeClosedPathOffsets(
  valueOffsets: Int32Array,
  injectionFlags: Uint32Array,
  rowCount: number
): Int32Array {
  const outputOffsets = new Int32Array(rowCount + 1);
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    const pathStart = valueOffsets[rowIndex] ?? 0;
    const pathEnd = valueOffsets[rowIndex + 1] ?? pathStart;
    const pointCount = Math.max(0, pathEnd - pathStart);
    outputOffsets[rowIndex + 1] =
      outputOffsets[rowIndex] + pointCount + (injectionFlags[rowIndex] ? 1 : 0);
  }
  return outputOffsets;
}

function makeClosedPathReadbackMetadata(
  valueOffsets: Int32Array,
  valueByteLength: number
): GPUDataReadbackMetadata {
  return {
    kind: 'variable-length-attribute',
    valueOffsets,
    nullCount: 0,
    valueByteLength
  };
}

async function closeArrowPathsOnCPU<Format extends GPUVectorFormat>(
  device: Device,
  props: CloseArrowPathsProps<Format>,
  chunkStates: CloseArrowPathChunkState<Format>[],
  epsilon: number
): Promise<GPUVector<Format>> {
  const sourcePaths = (await readArrowGPUVectorAsync(
    props.paths
  )) as Vector<ArrowPathCoordinateType>;
  const componentCount = getPathComponentCount(props.paths.type);
  const outputData = sourcePaths.data.map((data, chunkIndex) =>
    closeArrowPathDataOnCPU(
      data as Data<ArrowPathCoordinateType>,
      chunkStates[chunkIndex],
      componentCount,
      epsilon
    )
  );
  const outputPaths = new Vector<ArrowPathCoordinateType>(outputData);
  const outputVector = props.paths.format
    ? makeGPUVectorFromArrow(device, outputPaths, {
        name: props.paths.name,
        format: props.paths.format,
        ...(props.id ? {id: `${props.id}-cpu-closed-paths`} : {})
      })
    : makeGPUVectorFromArrow(device, outputPaths, {
        name: props.paths.name,
        ...(props.id ? {id: `${props.id}-cpu-closed-paths`} : {})
      });
  return outputVector as GPUVector<Format>;
}

function closeArrowPathDataOnCPU(
  data: Data<ArrowPathCoordinateType>,
  chunkState: CloseArrowPathChunkState | undefined,
  componentCount: number,
  epsilon: number
): Data<ArrowPathCoordinateType> {
  if (!chunkState) {
    throw new Error('closeArrowPaths CPU fallback requires path chunk metadata');
  }
  const values = getArrowVariableLengthAttributeDataBufferSource(data) as Float32Array;
  const injectionFlags = classifyClosedPathsOnCPU(
    values,
    chunkState.valueOffsets,
    chunkState.closedFlags,
    componentCount,
    epsilon,
    data.length
  );
  const outputOffsets = makeClosedPathOffsets(chunkState.valueOffsets, injectionFlags, data.length);
  const outputValues = scatterClosedPathValuesOnCPU(
    values,
    chunkState.valueOffsets,
    outputOffsets,
    injectionFlags,
    componentCount,
    data.length
  );
  return makeArrowPathData(data.type, outputOffsets, outputValues);
}

function classifyClosedPathsOnCPU(
  values: Float32Array,
  valueOffsets: Int32Array,
  closedFlags: Uint32Array,
  componentCount: number,
  epsilon: number,
  rowCount: number
): Uint32Array {
  const injectionFlags = new Uint32Array(rowCount);
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    if (!closedFlags[rowIndex]) {
      continue;
    }
    const pathStart = valueOffsets[rowIndex] ?? 0;
    const pathEnd = valueOffsets[rowIndex + 1] ?? pathStart;
    const pointCount = Math.max(0, pathEnd - pathStart);
    if (pointCount <= 1) {
      continue;
    }
    const lastPointIndex = pathStart + pointCount - 1;
    for (let componentIndex = 0; componentIndex < componentCount; componentIndex++) {
      const firstValue = values[pathStart * componentCount + componentIndex] ?? 0;
      const lastValue = values[lastPointIndex * componentCount + componentIndex] ?? 0;
      if (!(Math.abs(firstValue - lastValue) <= epsilon)) {
        injectionFlags[rowIndex] = 1;
        break;
      }
    }
  }
  return injectionFlags;
}

function scatterClosedPathValuesOnCPU(
  values: Float32Array,
  valueOffsets: Int32Array,
  outputOffsets: Int32Array,
  injectionFlags: Uint32Array,
  componentCount: number,
  rowCount: number
): Float32Array {
  const outputPointCount = outputOffsets[outputOffsets.length - 1] ?? 0;
  const outputValues = new Float32Array(outputPointCount * componentCount);
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    const pathStart = valueOffsets[rowIndex] ?? 0;
    const pathEnd = valueOffsets[rowIndex + 1] ?? pathStart;
    const outputStart = outputOffsets[rowIndex] ?? 0;
    const pointCount = Math.max(0, pathEnd - pathStart);
    const sourceValueStart = pathStart * componentCount;
    const sourceValueEnd = pathEnd * componentCount;
    outputValues.set(
      values.subarray(sourceValueStart, sourceValueEnd),
      outputStart * componentCount
    );
    if (injectionFlags[rowIndex] && pointCount > 0) {
      const firstPoint = values.subarray(sourceValueStart, sourceValueStart + componentCount);
      outputValues.set(firstPoint, (outputStart + pointCount) * componentCount);
    }
  }
  return outputValues;
}

function makeArrowPathData(
  type: ArrowPathCoordinateType,
  valueOffsets: Int32Array,
  values: Float32Array
): Data<ArrowPathCoordinateType> {
  const coordinateType = type.children[0].type as FixedSizeList<Float32>;
  const coordinateValues = new Data<Float32>(new Float32(), 0, values.length, 0, {
    [BufferType.DATA]: values
  });
  const coordinates = new Data<FixedSizeList<Float32>>(
    coordinateType,
    0,
    coordinateType.listSize === 0 ? 0 : values.length / coordinateType.listSize,
    0,
    {},
    [coordinateValues]
  );
  return new Data<ArrowPathCoordinateType>(
    type,
    0,
    valueOffsets.length - 1,
    0,
    {[BufferType.OFFSET]: valueOffsets},
    [coordinates]
  );
}

function getPathComponentCount(type: ArrowPathCoordinateType): number {
  const coordinateType = type.children[0]?.type;
  if (!coordinateType || !DataType.isFixedSizeList(coordinateType)) {
    throw new Error('closeArrowPaths paths require FixedSizeList coordinate elements');
  }
  return coordinateType.listSize;
}
