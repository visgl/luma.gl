// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  Buffer,
  type Binding,
  type BufferLayout,
  type Device,
  type RenderPass,
  type ShaderLayout
} from '@luma.gl/core';
import {DynamicBuffer, Model} from '@luma.gl/engine';
import {GPUVector, planGeneratedBufferBatches} from '@luma.gl/tables';
import * as arrow from 'apache-arrow';
import type {ArrowModelProps} from './arrow-model';
import {makeArrowFixedSizeListVector} from './arrow-fixed-size-list';
import {makeArrowGPUVector} from './arrow-gpu-table-adapters';
import {
  createGpuPathExpansionInput,
  createGpuPathGeneratedState,
  dispatchGpuPathExpansionCompute
} from './gpu-path-expansion';
import {
  resolveArrowStoragePathInputs,
  type ResolvedArrowStoragePathBatchInputs
} from './arrow-storage-path-gpu-vectors';

const SEGMENT_START_POINT_INDICES_COLUMN = 'segmentStartPointIndices';
const SEGMENT_END_POINT_INDICES_COLUMN = 'segmentEndPointIndices';
const SEGMENT_PREVIOUS_POINT_INDICES_COLUMN = 'segmentPreviousPointIndices';
const SEGMENT_NEXT_POINT_INDICES_COLUMN = 'segmentNextPointIndices';
const SEGMENT_FLAGS_COLUMN = 'segmentFlags';
const ROW_INDICES_COLUMN = 'rowIndices';
const COMPACT_PATH_VERTEX_DATA = 'compactPathVertexData';

const INDEXED_PATH_VERTEX_BYTE_STRIDE = Uint32Array.BYTES_PER_ELEMENT * 6;
const SEGMENT_END_POINT_INDICES_BYTE_OFFSET = Uint32Array.BYTES_PER_ELEMENT;
const SEGMENT_PREVIOUS_POINT_INDICES_BYTE_OFFSET = Uint32Array.BYTES_PER_ELEMENT * 2;
const SEGMENT_NEXT_POINT_INDICES_BYTE_OFFSET = Uint32Array.BYTES_PER_ELEMENT * 3;
const SEGMENT_FLAGS_BYTE_OFFSET = Uint32Array.BYTES_PER_ELEMENT * 4;
const ROW_INDICES_BYTE_OFFSET = Uint32Array.BYTES_PER_ELEMENT * 5;

const DEFAULT_STORAGE_PATH_COLOR: [number, number, number, number] = [255, 255, 255, 255];
const DEFAULT_STORAGE_PATH_WIDTH = 1;

type ArrowPathCoordinateType = arrow.List<arrow.FixedSizeList<arrow.Float32>>;
type ArrowPathColorType = arrow.FixedSizeList<arrow.Uint8>;
type StoragePathOwnedResource = Pick<GPUVector, 'destroy'> | Pick<DynamicBuffer, 'destroy'>;

const DEFAULT_STORAGE_ARROW_PATH_SHADER_LAYOUT: ShaderLayout = {
  attributes: [
    {name: SEGMENT_START_POINT_INDICES_COLUMN, location: 0, type: 'u32', stepMode: 'instance'},
    {name: SEGMENT_END_POINT_INDICES_COLUMN, location: 1, type: 'u32', stepMode: 'instance'},
    {name: ROW_INDICES_COLUMN, location: 2, type: 'u32', stepMode: 'instance'}
  ],
  bindings: []
};

const DEFAULT_STORAGE_ARROW_PATH_SOURCE = /* wgsl */ `
@group(0) @binding(auto) var<storage, read> pathValues : array<f32>;
@group(0) @binding(auto) var<storage, read> pathRowColors : array<u32>;
@group(0) @binding(auto) var<storage, read> pathRowWidths : array<f32>;

struct PathStorageStyleConfig {
  constantColor : vec4<f32>,
  constantWidth : f32,
  useRowColors : u32,
  useRowWidths : u32,
  batchRowIndexBase : u32,
  pathComponentCount : u32,
  _padding0 : u32,
  _padding1 : u32,
  _padding2 : u32,
};

@group(0) @binding(auto) var<uniform> pathStorageStyleConfig : PathStorageStyleConfig;

struct VertexInputs {
  @builtin(vertex_index) vertexIndex : u32,
  @location(0) segmentStartPointIndices : u32,
  @location(1) segmentEndPointIndices : u32,
  @location(2) rowIndices : u32,
};

struct FragmentInputs {
  @builtin(position) position : vec4<f32>,
  @location(0) color : vec4<f32>,
};

fn unpackPathColor(colorWord: u32) -> vec4<f32> {
  return vec4<f32>(
    f32(colorWord & 0xffu),
    f32((colorWord >> 8u) & 0xffu),
    f32((colorWord >> 16u) & 0xffu),
    f32((colorWord >> 24u) & 0xffu)
  ) / 255.0;
}

fn readPathComponent(pointIndex: u32, componentIndex: u32) -> f32 {
  if (componentIndex >= pathStorageStyleConfig.pathComponentCount) {
    return 0.0;
  }
  return pathValues[pointIndex * pathStorageStyleConfig.pathComponentCount + componentIndex];
}

fn readPathPoint(pointIndex: u32) -> vec4<f32> {
  return vec4<f32>(
    readPathComponent(pointIndex, 0u),
    readPathComponent(pointIndex, 1u),
    readPathComponent(pointIndex, 2u),
    readPathComponent(pointIndex, 3u)
  );
}

@vertex
fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  let rowIndex = inputs.rowIndices - pathStorageStyleConfig.batchRowIndexBase;
  let pathWidth = select(
    pathStorageStyleConfig.constantWidth,
    pathRowWidths[rowIndex],
    pathStorageStyleConfig.useRowWidths != 0u
  );
  let pathPosition = select(
    readPathPoint(inputs.segmentStartPointIndices),
    readPathPoint(inputs.segmentEndPointIndices),
    (inputs.vertexIndex & 1u) == 1u
  );
  var outputs : FragmentInputs;
  outputs.position = vec4<f32>(
    pathPosition.xyz + vec3<f32>(0.0, 0.0, pathWidth * 0.0),
    1.0
  );
  outputs.color = pathStorageStyleConfig.constantColor;
  if (pathStorageStyleConfig.useRowColors != 0u) {
    outputs.color = unpackPathColor(pathRowColors[rowIndex]);
  }
  return outputs;
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4<f32> {
  return inputs.color;
}
`;

/** GPU vectors used by the storage-backed path model. */
export type ArrowStoragePathInputProps = Omit<
  ArrowModelProps,
  'arrowTable' | 'arrowGPUTable' | 'arrowCount'
> & {
  /** Variable-length Float32 XY, XYZ, or XYZM path coordinates, one Arrow row per path. */
  paths: GPUVector<ArrowPathCoordinateType>;
  /** Optional packed RGBA8 path colors, one Arrow row per path. */
  colors?: GPUVector<ArrowPathColorType>;
  /** Optional per-path widths, one Arrow row per path. */
  widths?: GPUVector<arrow.Float32>;
  /** Constant fallback path color used when `colors` is absent. */
  color?: [number, number, number, number];
  /** Constant fallback path width used when `widths` is absent. */
  width?: number;
};

type ArrowStoragePathRenderProps = Omit<
  ArrowStoragePathInputProps,
  'paths' | 'colors' | 'widths' | 'color' | 'width'
>;

export type ArrowStoragePathBatchState = {
  batchRowIndexBase: number;
  rowCount: number;
  segmentCount: number;
  pathValuesBinding: Binding;
  rowColorsBinding: Binding;
  rowWidthsBinding: Binding;
  styleConfigBuffer: DynamicBuffer;
};

export type ArrowStoragePathRenderBatchState = {
  rowBindingBatchIndex: number;
  rowStart: number;
  rowEnd: number;
  segmentCount: number;
  compactPathVertexData: Buffer;
};

export type ArrowStoragePathState = {
  segmentCount: number;
  pathRangeBuildTimeMs: number;
  compactPathVertexByteLength: number;
  generatedRenderBufferByteLength: number;
  rowStorageByteLength: number;
  transientComputeInputByteLength: number;
  batches: ArrowStoragePathBatchState[];
  renderBatches: ArrowStoragePathRenderBatchState[];
  ownedRowBindingResources: StoragePathOwnedResource[];
  rowColorsBinding: Binding;
  rowWidthsBinding: Binding;
  styleConfigBuffer: DynamicBuffer;
  compactPathVertexData: Buffer;
  destroy: () => void;
};

export type ArrowStoragePathModelProps =
  | (ArrowStoragePathInputProps & {storageState?: never})
  | (ArrowStoragePathRenderProps & {storageState: ArrowStoragePathState});

type StoragePathDefaultBindings = {
  colorsBinding: Binding;
  widthsBinding: Binding;
  byteLength: number;
  ownedResources: StoragePathOwnedResource[];
};

type StoragePathBatchRowState = {
  rowColorsBinding: Binding;
  rowWidthsBinding: Binding;
  styleConfigBuffer: DynamicBuffer;
  ownedResources: StoragePathOwnedResource[];
  ownedByteLength: number;
};

/**
 * WebGPU-only path model that expands nested Arrow path rows through compute,
 * while keeping per-row style values as storage-buffer reads during rendering.
 */
export class ArrowStoragePathModel extends Model {
  segmentCount!: number;
  pathRangeBuildTimeMs!: number;
  compactPathVertexByteLength!: number;
  generatedRenderBufferByteLength!: number;
  rowStorageByteLength!: number;
  transientComputeInputByteLength!: number;
  batches!: ArrowStoragePathBatchState[];
  renderBatches!: ArrowStoragePathRenderBatchState[];
  rowColorsBinding!: Binding;
  rowWidthsBinding!: Binding;
  styleConfigBuffer!: DynamicBuffer;
  compactPathVertexData!: Buffer;
  storageState: ArrowStoragePathState;
  private pathProps: ArrowStoragePathModelProps;
  private ownsStorageState: boolean;

  constructor(device: Device, props: ArrowStoragePathModelProps) {
    if (device.type !== 'webgpu') {
      throw new Error('ArrowStoragePathModel is WebGPU-only');
    }
    const ownsStorageState = !hasArrowStoragePathState(props);
    const storageState = ownsStorageState
      ? createArrowStoragePathState(device, props)
      : props.storageState;
    super(device, createArrowStoragePathModelProps(props, storageState));
    this.pathProps = props;
    this.storageState = storageState;
    this.ownsStorageState = ownsStorageState;
    this.applyStorageState(storageState);
  }

  setProps(props: Partial<ArrowStoragePathModelProps>): void {
    const nextProps = {...this.pathProps, ...props} as ArrowStoragePathModelProps;
    const nextUsesExternalState = hasArrowStoragePathState(nextProps);
    const pathProps = props as Partial<ArrowStoragePathInputProps>;
    const shouldReplaceExternalState = 'storageState' in props && props.storageState !== undefined;
    const shouldReplaceState = shouldReplaceExternalState || pathProps.paths !== undefined;
    const shouldRefreshRowBindings =
      !nextUsesExternalState &&
      (pathProps.colors !== undefined ||
        pathProps.widths !== undefined ||
        pathProps.color !== undefined ||
        pathProps.width !== undefined);

    this.pathProps = nextProps;
    if (!shouldReplaceState) {
      if (shouldRefreshRowBindings) {
        refreshArrowStoragePathRowBindings(this.device, nextProps, this.storageState);
        this.applyStorageState(this.storageState);
        const firstBatch = getFirstArrowStoragePathBatch(this.storageState);
        this.setBindings(createArrowStoragePathBindings(nextProps, firstBatch));
        this.setNeedsRedraw('Arrow storage path row bindings updated');
      }
      return;
    }

    const nextStorageState = nextUsesExternalState
      ? nextProps.storageState
      : createArrowStoragePathState(this.device, nextProps);
    if (this.ownsStorageState) {
      this.storageState.destroy();
    }
    this.storageState = nextStorageState;
    this.ownsStorageState = !nextUsesExternalState;
    this.applyStorageState(nextStorageState);
    const firstBatch = getFirstArrowStoragePathBatch(nextStorageState);
    const firstRenderBatch = getFirstArrowStoragePathRenderBatch(nextStorageState);
    this.setAttributes({
      [COMPACT_PATH_VERTEX_DATA]: firstRenderBatch.compactPathVertexData
    });
    this.setBindings(createArrowStoragePathBindings(nextProps, firstBatch));
    this.setInstanceCount(firstRenderBatch.segmentCount);
    this.setNeedsRedraw('Arrow storage path state updated');
  }

  override draw(renderPass: RenderPass): boolean {
    let drawSuccess = true;
    for (const renderBatch of this.storageState.renderBatches) {
      const batch = this.storageState.batches[renderBatch.rowBindingBatchIndex];
      if (!batch) {
        throw new Error('ArrowStoragePathModel render batch is missing its row-binding batch');
      }
      this.setAttributes({
        [COMPACT_PATH_VERTEX_DATA]: renderBatch.compactPathVertexData
      });
      this.setBindings(createArrowStoragePathBindings(this.pathProps, batch));
      this.setInstanceCount(renderBatch.segmentCount);
      drawSuccess = super.draw(renderPass) && drawSuccess;
    }
    const firstBatch = getFirstArrowStoragePathBatch(this.storageState);
    const firstRenderBatch = getFirstArrowStoragePathRenderBatch(this.storageState);
    this.setAttributes({
      [COMPACT_PATH_VERTEX_DATA]: firstRenderBatch.compactPathVertexData
    });
    this.setBindings(createArrowStoragePathBindings(this.pathProps, firstBatch));
    this.setInstanceCount(this.storageState.segmentCount);
    return drawSuccess;
  }

  override destroy(): void {
    if (this.ownsStorageState) {
      this.storageState.destroy();
    }
    super.destroy();
  }

  private applyStorageState(storageState: ArrowStoragePathState): void {
    this.segmentCount = storageState.segmentCount;
    this.pathRangeBuildTimeMs = storageState.pathRangeBuildTimeMs;
    this.compactPathVertexByteLength = storageState.compactPathVertexByteLength;
    this.generatedRenderBufferByteLength = storageState.generatedRenderBufferByteLength;
    this.rowStorageByteLength = storageState.rowStorageByteLength;
    this.transientComputeInputByteLength = storageState.transientComputeInputByteLength;
    this.batches = storageState.batches;
    this.renderBatches = storageState.renderBatches;
    this.rowColorsBinding = storageState.rowColorsBinding;
    this.rowWidthsBinding = storageState.rowWidthsBinding;
    this.styleConfigBuffer = storageState.styleConfigBuffer;
    this.compactPathVertexData = storageState.compactPathVertexData;
  }
}

export function createArrowStoragePathState(
  device: Device,
  props: ArrowStoragePathInputProps
): ArrowStoragePathState {
  if (device.type !== 'webgpu') {
    throw new Error('createArrowStoragePathState requires a WebGPU device');
  }
  const pathRangeBuildStartTime = getNow();
  const pathInputs = resolveArrowStoragePathInputs(props);
  const defaultBindings = createStoragePathDefaultBindings(device, props);
  const ownedRowBindingResources: StoragePathOwnedResource[] = [...defaultBindings.ownedResources];
  const batches: ArrowStoragePathBatchState[] = [];
  const renderBatches: ArrowStoragePathRenderBatchState[] = [];
  let segmentCount = 0;
  let generatedRenderBufferByteLength = 0;
  let rowStorageByteLength = defaultBindings.byteLength;
  let transientComputeInputByteLength = 0;

  for (const [rowBindingBatchIndex, batchInput] of pathInputs.batches.entries()) {
    const rowState = createStoragePathBatchRowState(device, props, batchInput, defaultBindings);
    const generatedBufferBatches = planGeneratedBufferBatches({
      device,
      recordOffsets: batchInput.recordOffsets,
      recordByteStride: INDEXED_PATH_VERTEX_BYTE_STRIDE,
      maxBatchByteLength: device.limits.maxStorageBufferBindingSize,
      resourceLabel: 'ArrowStoragePathModel indexed generated path vertex data'
    });

    for (const generatedBufferBatch of generatedBufferBatches) {
      const expansionInput = createGpuPathExpansionInput(
        device,
        {id: props.id},
        {
          valueOffsets: batchInput.valueOffsets,
          recordOffsets: batchInput.recordOffsets,
          generatedBufferBatch,
          batchRowIndexBase: batchInput.batchRowIndexBase,
          componentCount: batchInput.componentCount
        }
      );
      const generated = createGpuPathGeneratedState(
        device,
        {id: props.id},
        generatedBufferBatch.recordCount
      );
      dispatchGpuPathExpansionCompute(
        device,
        {id: props.id},
        {
          pathValues: batchInput.pathValuesBinding,
          expansionInput,
          generated,
          rowCount: generatedBufferBatch.rowEnd - generatedBufferBatch.rowStart,
          segmentCount: generatedBufferBatch.recordCount
        }
      );
      renderBatches.push({
        rowBindingBatchIndex,
        rowStart: generatedBufferBatch.rowStart,
        rowEnd: generatedBufferBatch.rowEnd,
        segmentCount: generatedBufferBatch.recordCount,
        compactPathVertexData: generated.compactPathVertexData
      });
      generatedRenderBufferByteLength += generated.byteLength;
      transientComputeInputByteLength += expansionInput.byteLength;
      expansionInput.pathRangesBuffer.destroy();
      expansionInput.expansionConfigBuffer.destroy();
    }

    batches.push({
      ...rowState,
      batchRowIndexBase: batchInput.batchRowIndexBase,
      rowCount: batchInput.rowCount,
      segmentCount: batchInput.segmentCount,
      pathValuesBinding: batchInput.pathValuesBinding
    });
    ownedRowBindingResources.push(...rowState.ownedResources);
    rowStorageByteLength += rowState.ownedByteLength;
    segmentCount += batchInput.segmentCount;
  }

  const firstBatch = getFirstArrowStoragePathBatch({batches});
  const firstRenderBatch = getFirstArrowStoragePathRenderBatch({renderBatches});
  let destroyed = false;
  return {
    segmentCount,
    pathRangeBuildTimeMs: getNow() - pathRangeBuildStartTime,
    compactPathVertexByteLength: generatedRenderBufferByteLength,
    generatedRenderBufferByteLength,
    rowStorageByteLength,
    transientComputeInputByteLength,
    batches,
    renderBatches,
    ownedRowBindingResources,
    rowColorsBinding: firstBatch.rowColorsBinding,
    rowWidthsBinding: firstBatch.rowWidthsBinding,
    styleConfigBuffer: firstBatch.styleConfigBuffer,
    compactPathVertexData: firstRenderBatch.compactPathVertexData,
    destroy: () => {
      if (destroyed) {
        return;
      }
      destroyed = true;
      destroyStoragePathResources(ownedRowBindingResources);
      for (const renderBatch of renderBatches) {
        renderBatch.compactPathVertexData.destroy();
      }
    }
  };
}

function createArrowStoragePathModelProps(
  props: ArrowStoragePathModelProps,
  storageState: ArrowStoragePathState
): ArrowModelProps {
  const shaderLayout = props.shaderLayout ?? DEFAULT_STORAGE_ARROW_PATH_SHADER_LAYOUT;
  const firstBatch = getFirstArrowStoragePathBatch(storageState);
  const firstRenderBatch = getFirstArrowStoragePathRenderBatch(storageState);
  return {
    ...props,
    source: props.source ?? DEFAULT_STORAGE_ARROW_PATH_SOURCE,
    shaderLayout,
    bindings: createArrowStoragePathBindings(props, firstBatch),
    attributes: {
      ...(props.attributes || {}),
      [COMPACT_PATH_VERTEX_DATA]: firstRenderBatch.compactPathVertexData
    },
    bufferLayout: [...(props.bufferLayout || []), createCompactPathBufferLayout(shaderLayout)],
    topology: props.topology ?? 'line-list',
    vertexCount: props.vertexCount ?? 2,
    instanceCount: firstRenderBatch.segmentCount
  };
}

function createArrowStoragePathBindings(
  props: ArrowStoragePathModelProps,
  batch: ArrowStoragePathBatchState
): NonNullable<ArrowModelProps['bindings']> {
  return {
    ...(props.bindings || {}),
    pathValues: batch.pathValuesBinding,
    pathRowColors: batch.rowColorsBinding,
    pathRowWidths: batch.rowWidthsBinding,
    pathStorageStyleConfig: batch.styleConfigBuffer
  };
}

function createCompactPathBufferLayout(shaderLayout: ShaderLayout): BufferLayout {
  const shaderAttributeNames = new Set(shaderLayout.attributes.map(attribute => attribute.name));
  const attributes: NonNullable<BufferLayout['attributes']> = [];
  if (shaderAttributeNames.has(SEGMENT_START_POINT_INDICES_COLUMN)) {
    attributes.push({
      attribute: SEGMENT_START_POINT_INDICES_COLUMN,
      format: 'uint32',
      byteOffset: 0
    });
  }
  if (shaderAttributeNames.has(SEGMENT_END_POINT_INDICES_COLUMN)) {
    attributes.push({
      attribute: SEGMENT_END_POINT_INDICES_COLUMN,
      format: 'uint32',
      byteOffset: SEGMENT_END_POINT_INDICES_BYTE_OFFSET
    });
  }
  if (shaderAttributeNames.has(SEGMENT_PREVIOUS_POINT_INDICES_COLUMN)) {
    attributes.push({
      attribute: SEGMENT_PREVIOUS_POINT_INDICES_COLUMN,
      format: 'uint32',
      byteOffset: SEGMENT_PREVIOUS_POINT_INDICES_BYTE_OFFSET
    });
  }
  if (shaderAttributeNames.has(SEGMENT_NEXT_POINT_INDICES_COLUMN)) {
    attributes.push({
      attribute: SEGMENT_NEXT_POINT_INDICES_COLUMN,
      format: 'uint32',
      byteOffset: SEGMENT_NEXT_POINT_INDICES_BYTE_OFFSET
    });
  }
  if (shaderAttributeNames.has(SEGMENT_FLAGS_COLUMN)) {
    attributes.push({
      attribute: SEGMENT_FLAGS_COLUMN,
      format: 'uint32',
      byteOffset: SEGMENT_FLAGS_BYTE_OFFSET
    });
  }
  if (shaderAttributeNames.has(ROW_INDICES_COLUMN)) {
    attributes.push({
      attribute: ROW_INDICES_COLUMN,
      format: 'uint32',
      byteOffset: ROW_INDICES_BYTE_OFFSET
    });
  }
  return {
    name: COMPACT_PATH_VERTEX_DATA,
    stepMode: 'instance',
    byteStride: INDEXED_PATH_VERTEX_BYTE_STRIDE,
    attributes
  };
}

function createStoragePathDefaultBindings(
  device: Device,
  props: ArrowStoragePathInputProps
): StoragePathDefaultBindings {
  const id = props.id || 'arrow-storage-path-model';
  const colorsVector = createStoragePathOwnedGpuVector(
    device,
    `${id}-default-row-colors`,
    makeArrowFixedSizeListVector(
      new arrow.Uint8(),
      4,
      new Uint8Array(props.color ?? DEFAULT_STORAGE_PATH_COLOR)
    )
  );
  const widthsVector = createStoragePathOwnedGpuVector(
    device,
    `${id}-default-row-widths`,
    arrow.vectorFromArray([props.width ?? DEFAULT_STORAGE_PATH_WIDTH], new arrow.Float32())
  );
  return {
    colorsBinding: getStoragePathGpuVectorBinding(colorsVector),
    widthsBinding: getStoragePathGpuVectorBinding(widthsVector),
    byteLength: Uint8Array.BYTES_PER_ELEMENT * 4 + Float32Array.BYTES_PER_ELEMENT,
    ownedResources: [colorsVector, widthsVector]
  };
}

function createStoragePathBatchRowState(
  device: Device,
  props: ArrowStoragePathInputProps,
  batchInput: ResolvedArrowStoragePathBatchInputs,
  defaultBindings: StoragePathDefaultBindings
): StoragePathBatchRowState {
  const styleConfigData = createStoragePathStyleConfigData(
    props,
    batchInput.batchRowIndexBase,
    batchInput.componentCount
  );
  const styleConfigBuffer = new DynamicBuffer(device, {
    id: `${props.id || 'arrow-storage-path-model'}-style-config-${batchInput.batchRowIndexBase}`,
    usage: Buffer.UNIFORM | Buffer.COPY_DST | Buffer.COPY_SRC,
    data: styleConfigData
  });
  return {
    rowColorsBinding: batchInput.colorsBinding ?? defaultBindings.colorsBinding,
    rowWidthsBinding: batchInput.widthsBinding ?? defaultBindings.widthsBinding,
    styleConfigBuffer,
    ownedResources: [styleConfigBuffer],
    ownedByteLength: styleConfigData.byteLength
  };
}

function createStoragePathOwnedGpuVector<T extends arrow.DataType>(
  device: Device,
  name: string,
  vector: arrow.Vector<T>
): GPUVector<T> {
  return makeArrowGPUVector(device, vector, {
    name,
    id: name,
    usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC
  });
}

function getStoragePathGpuVectorBinding(vector: GPUVector): Binding {
  const buffer = vector.buffer;
  return buffer instanceof DynamicBuffer ? buffer.buffer : buffer;
}

function createStoragePathStyleConfigData(
  props: ArrowStoragePathInputProps,
  batchRowIndexBase: number,
  pathComponentCount: number
): Uint32Array {
  const arrayBuffer = new ArrayBuffer(48);
  const floatValues = new Float32Array(arrayBuffer);
  const uintValues = new Uint32Array(arrayBuffer);
  const color = props.color ?? DEFAULT_STORAGE_PATH_COLOR;
  floatValues[0] = color[0] / 255;
  floatValues[1] = color[1] / 255;
  floatValues[2] = color[2] / 255;
  floatValues[3] = color[3] / 255;
  floatValues[4] = props.width ?? DEFAULT_STORAGE_PATH_WIDTH;
  uintValues[5] = props.colors ? 1 : 0;
  uintValues[6] = props.widths ? 1 : 0;
  uintValues[7] = batchRowIndexBase;
  uintValues[8] = pathComponentCount;
  return uintValues;
}

function refreshArrowStoragePathRowBindings(
  device: Device,
  props: ArrowStoragePathInputProps,
  storageState: ArrowStoragePathState
): void {
  const pathInputs = resolveArrowStoragePathInputs(props);
  assertStoragePathRowBindingRefreshCompatible(storageState, pathInputs.batches);
  const nextOwnedRowBindingResources: StoragePathOwnedResource[] = [];
  const defaultBindings = createStoragePathDefaultBindings(device, props);
  nextOwnedRowBindingResources.push(...defaultBindings.ownedResources);
  let rowStorageByteLength = defaultBindings.byteLength;

  const nextBatches = pathInputs.batches.map((batchInput, batchIndex) => {
    const previousBatch = storageState.batches[batchIndex];
    const rowState = createStoragePathBatchRowState(device, props, batchInput, defaultBindings);
    nextOwnedRowBindingResources.push(...rowState.ownedResources);
    rowStorageByteLength += rowState.ownedByteLength;
    return {
      ...rowState,
      batchRowIndexBase: previousBatch.batchRowIndexBase,
      rowCount: previousBatch.rowCount,
      segmentCount: previousBatch.segmentCount,
      pathValuesBinding: previousBatch.pathValuesBinding
    };
  });

  replaceOwnedStoragePathResources(
    storageState.ownedRowBindingResources,
    nextOwnedRowBindingResources
  );
  storageState.batches = nextBatches;
  storageState.rowStorageByteLength = rowStorageByteLength;
  syncArrowStoragePathStateFirstBatch(storageState);
}

function assertStoragePathRowBindingRefreshCompatible(
  storageState: ArrowStoragePathState,
  batches: ResolvedArrowStoragePathBatchInputs[]
): void {
  if (batches.length !== storageState.batches.length) {
    throw new Error('ArrowStoragePathModel row-binding updates must preserve path batch count');
  }
  for (const [batchIndex, batchInput] of batches.entries()) {
    const existingBatch = storageState.batches[batchIndex];
    if (
      !existingBatch ||
      existingBatch.batchRowIndexBase !== batchInput.batchRowIndexBase ||
      existingBatch.rowCount !== batchInput.rowCount ||
      existingBatch.segmentCount !== batchInput.segmentCount
    ) {
      throw new Error('ArrowStoragePathModel row-binding updates must preserve path batch rows');
    }
  }
}

function syncArrowStoragePathStateFirstBatch(storageState: ArrowStoragePathState): void {
  const firstBatch = getFirstArrowStoragePathBatch(storageState);
  const firstRenderBatch = getFirstArrowStoragePathRenderBatch(storageState);
  storageState.rowColorsBinding = firstBatch.rowColorsBinding;
  storageState.rowWidthsBinding = firstBatch.rowWidthsBinding;
  storageState.styleConfigBuffer = firstBatch.styleConfigBuffer;
  storageState.compactPathVertexData = firstRenderBatch.compactPathVertexData;
}

function destroyStoragePathResources(resources: StoragePathOwnedResource[]): void {
  for (const resource of resources) {
    resource.destroy();
  }
}

function replaceOwnedStoragePathResources(
  currentResources: StoragePathOwnedResource[],
  nextResources: StoragePathOwnedResource[]
): void {
  destroyStoragePathResources(currentResources);
  currentResources.splice(0, currentResources.length, ...nextResources);
}

function getFirstArrowStoragePathBatch(
  storageState: Pick<ArrowStoragePathState, 'batches'>
): ArrowStoragePathBatchState {
  const firstBatch = storageState.batches[0];
  if (!firstBatch) {
    throw new Error('ArrowStoragePathState requires at least one row-binding batch');
  }
  return firstBatch;
}

function getFirstArrowStoragePathRenderBatch(
  storageState: Pick<ArrowStoragePathState, 'renderBatches'>
): ArrowStoragePathRenderBatchState {
  const firstRenderBatch = storageState.renderBatches[0];
  if (!firstRenderBatch) {
    throw new Error('ArrowStoragePathState requires at least one render batch');
  }
  return firstRenderBatch;
}

function hasArrowStoragePathState(
  props: ArrowStoragePathModelProps
): props is ArrowStoragePathRenderProps & {storageState: ArrowStoragePathState} {
  return 'storageState' in props && props.storageState !== undefined;
}

function getNow(): number {
  return typeof performance === 'undefined' ? Date.now() : performance.now();
}
