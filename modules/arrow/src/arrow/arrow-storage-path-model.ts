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
import {DynamicBuffer, Model, type ModelProps} from '@luma.gl/engine';
import {GPUVector, planGeneratedBufferBatches} from '@luma.gl/tables';
import {DataType, FixedSizeList, Float32, List, Uint8, Vector, vectorFromArray} from 'apache-arrow';
import {makeArrowFixedSizeListVector} from './arrow-fixed-size-list';
import {makeGPUVectorFromArrow} from './arrow-gpu-table-adapters';
import {
  createGpuPathExpansionInput,
  createGpuPathGeneratedState,
  createGpuPathRangeState,
  dispatchGpuPathExpansionCompute
} from './gpu-path-expansion';
import {
  prepareArrowStoragePathGPUVectors,
  resolveArrowStoragePathInputs,
  type PreparedArrowStoragePathGPUVectors,
  type ResolvedArrowStoragePathBatchInputs
} from './arrow-storage-path-gpu-vectors';
import type {ArrowPathSourceVectors, PrepareArrowPathGPUVectorsOptions} from './arrow-path-model';

/** Re-export storage path vector preparation helpers with the storage path model surface. */
export {
  prepareArrowStoragePathGPUVectors,
  type PreparedArrowStoragePathGPUVectors
} from './arrow-storage-path-gpu-vectors';

const SEGMENT_START_POINT_INDICES_COLUMN = 'segmentStartPointIndices';
const SEGMENT_END_POINT_INDICES_COLUMN = 'segmentEndPointIndices';
const SEGMENT_PREVIOUS_POINT_INDICES_COLUMN = 'segmentPreviousPointIndices';
const SEGMENT_NEXT_POINT_INDICES_COLUMN = 'segmentNextPointIndices';
const SEGMENT_FLAGS_COLUMN = 'segmentFlags';
const ROW_INDICES_COLUMN = 'rowIndices';
const COMPACT_PATH_VERTEX_DATA = 'compactPathVertexData';
const PATH_RANGES_COLUMN = 'pathRanges';
const PATH_VIEW_ORIGINS_COLUMN = 'pathViewOrigins';

const COMPACT_PATH_VERTEX_BYTE_STRIDE = Uint32Array.BYTES_PER_ELEMENT * 3;
const LEGACY_PATH_VERTEX_BYTE_STRIDE = Uint32Array.BYTES_PER_ELEMENT * 6;
const LEGACY_SEGMENT_END_POINT_INDICES_BYTE_OFFSET = Uint32Array.BYTES_PER_ELEMENT;
const LEGACY_SEGMENT_PREVIOUS_POINT_INDICES_BYTE_OFFSET = Uint32Array.BYTES_PER_ELEMENT * 2;
const LEGACY_SEGMENT_NEXT_POINT_INDICES_BYTE_OFFSET = Uint32Array.BYTES_PER_ELEMENT * 3;
const LEGACY_SEGMENT_FLAGS_BYTE_OFFSET = Uint32Array.BYTES_PER_ELEMENT * 4;
const LEGACY_ROW_INDICES_BYTE_OFFSET = Uint32Array.BYTES_PER_ELEMENT * 5;
const COMPACT_SEGMENT_FLAGS_BYTE_OFFSET = Uint32Array.BYTES_PER_ELEMENT;
const COMPACT_ROW_INDICES_BYTE_OFFSET = Uint32Array.BYTES_PER_ELEMENT * 2;

const DEFAULT_STORAGE_PATH_COLOR: [number, number, number, number] = [255, 255, 255, 255];
const DEFAULT_STORAGE_PATH_WIDTH = 1;

type ArrowPathRowColorType = FixedSizeList<Uint8>;
type ArrowPathVertexColorType = List<FixedSizeList<Uint8>>;
type StoragePathOwnedResource =
  | Pick<GPUVector, 'destroy'>
  | Pick<DynamicBuffer, 'destroy'>
  | Pick<Buffer, 'destroy'>;
type StoragePathRecordMode = 'compact' | 'legacy';

const DEFAULT_STORAGE_ARROW_PATH_SHADER_LAYOUT: ShaderLayout = {
  attributes: [
    {name: SEGMENT_START_POINT_INDICES_COLUMN, location: 0, type: 'u32', stepMode: 'instance'},
    {name: SEGMENT_FLAGS_COLUMN, location: 1, type: 'u32', stepMode: 'instance'},
    {name: ROW_INDICES_COLUMN, location: 2, type: 'u32', stepMode: 'instance'}
  ],
  bindings: []
};

const DEFAULT_STORAGE_ARROW_PATH_SOURCE = /* wgsl */ `
  @group(0) @binding(auto) var<storage, read> pathValues : array<f32>;
  @group(0) @binding(auto) var<storage, read> pathRanges : array<vec4<u32>>;
  @group(0) @binding(auto) var<storage, read> pathViewOrigins : array<vec4<f32>>;
  @group(0) @binding(auto) var<storage, read> pathRowColors : array<u32>;
  @group(0) @binding(auto) var<storage, read> pathVertexColors : array<u32>;
  @group(0) @binding(auto) var<storage, read> pathRowWidths : array<f32>;

struct PathStorageStyleConfig {
  constantColor : vec4<f32>,
  constantWidth : f32,
  useRowColors : u32,
  useRowWidths : u32,
  batchRowIndexBase : u32,
  pathComponentCount : u32,
  useViewOrigins : u32,
  useVertexColors : u32,
  _padding1 : u32,
};

@group(0) @binding(auto) var<uniform> pathStorageStyleConfig : PathStorageStyleConfig;

struct VertexInputs {
  @builtin(vertex_index) vertexIndex : u32,
  @location(0) segmentStartPointIndices : u32,
  @location(1) segmentFlags : u32,
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

fn readPathRange(globalRowIndex: u32) -> vec4<u32> {
  return pathRanges[globalRowIndex - pathStorageStyleConfig.batchRowIndexBase];
}

fn readPathViewOrigin(rowIndex: u32) -> vec4<f32> {
  if (pathStorageStyleConfig.useViewOrigins == 0u) {
    return vec4<f32>(0.0);
  }
  return pathViewOrigins[rowIndex];
}

@vertex
fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  let rowIndex = inputs.rowIndices - pathStorageStyleConfig.batchRowIndexBase;
  let pathRange = readPathRange(inputs.rowIndices);
  let segmentEndPointIndex = min(inputs.segmentStartPointIndices + 1u, pathRange.y - 1u);
  let pathWidth = select(
    pathStorageStyleConfig.constantWidth,
    pathRowWidths[rowIndex],
    pathStorageStyleConfig.useRowWidths != 0u
  );
  let pathPosition = select(
    readPathPoint(inputs.segmentStartPointIndices),
    readPathPoint(segmentEndPointIndex),
    (inputs.vertexIndex & 1u) == 1u
  ) + readPathViewOrigin(rowIndex);
  var outputs : FragmentInputs;
  outputs.position = vec4<f32>(
    pathPosition.xyz + vec3<f32>(0.0, 0.0, pathWidth * 0.0),
    1.0
  );
  outputs.color = pathStorageStyleConfig.constantColor;
  if (pathStorageStyleConfig.useVertexColors != 0u) {
    outputs.color = mix(
      unpackPathColor(pathVertexColors[inputs.segmentStartPointIndices]),
      unpackPathColor(pathVertexColors[segmentEndPointIndex]),
      f32(inputs.vertexIndex & 1u)
    );
  } else if (pathStorageStyleConfig.useRowColors != 0u) {
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
export type ArrowStoragePathInputProps = Omit<ModelProps, 'instanceCount'> & {
  /** Variable-length Float32 XY, XYZ, or XYZM path coordinates, one Arrow row per path. */
  paths: GPUVector;
  /** Optional packed RGBA8 path colors, either one per path row or one per path vertex. */
  colors?: GPUVector;
  /** Optional per-path widths, one Arrow row per path. */
  widths?: GPUVector;
  /** Optional per-path Float32 temporal stream aligned with path vertices. */
  timestamps?: GPUVector;
  /** Optional per-path view-space origins, one Arrow row per path. */
  viewOrigins?: GPUVector;
  /** Global source row index assigned to the first prepared path row. */
  rowIndexBase?: number;
  /** Constant fallback path color used when `colors` is absent. */
  color?: [number, number, number, number];
  /** Constant fallback path width used when `widths` is absent. */
  width?: number;
};

type ArrowStoragePathRenderProps = Omit<
  ArrowStoragePathInputProps,
  'paths' | 'colors' | 'widths' | 'viewOrigins' | 'color' | 'width'
>;

/** Per-source-batch storage bindings retained by {@link ArrowStoragePathState}. */
export type ArrowStoragePathBatchState = {
  /** Global source path row index assigned to local row zero. */
  batchRowIndexBase: number;
  /** Source path rows included in this storage batch. */
  rowCount: number;
  /** Generated segment records drawn from this storage batch. */
  segmentCount: number;
  /** Read-only storage binding for flattened prepared path values. */
  pathValuesBinding: Binding;
  /** Read-only storage binding for persistent per-path ranges. */
  pathRangesBinding: Binding;
  /** Read-only storage binding for Float32 path view origins. */
  pathViewOriginsBinding: Binding;
  /** Read-only storage binding for packed per-row RGBA8 path colors. */
  rowColorsBinding: Binding;
  /** Read-only storage binding for packed per-vertex RGBA8 path colors. */
  vertexColorsBinding: Binding;
  /** Read-only storage binding for Float32 path widths. */
  rowWidthsBinding: Binding;
  /** Optional read-only storage binding for prepared Float32 path timestamps. */
  pathTimestampsBinding?: Binding;
  /** Uniform buffer selecting row style bindings and path component count. */
  styleConfigBuffer: DynamicBuffer;
};

/** Generated storage path render-batch state. */
export type ArrowStoragePathRenderBatchState = {
  /** Source storage batch whose row bindings feed this generated render batch. */
  rowBindingBatchIndex: number;
  /** First source path row included in this generated render batch. */
  rowStart: number;
  /** Source path row after the last row included in this generated render batch. */
  rowEnd: number;
  /** Generated segment records drawn by this render batch. */
  segmentCount: number;
  /** Generated compact or legacy path segment vertex buffer. */
  compactPathVertexData: Buffer;
};

/** Reusable WebGPU storage path expansion and row-binding state. */
export type ArrowStoragePathState = {
  /** Generated segment records across all preserved render batches. */
  segmentCount: number;
  /** CPU time spent constructing persistent path range metadata. */
  pathRangeBuildTimeMs: number;
  /** Bytes occupied by persistent per-path range buffers. */
  pathRangeByteLength: number;
  /** Bytes occupied by one generated path segment record. */
  pathRecordByteStride: number;
  /** Logical bytes occupied by the first generated path segment buffer. */
  compactPathVertexByteLength: number;
  /** Logical bytes occupied by all generated path segment buffers. */
  generatedRenderBufferByteLength: number;
  /** Bytes occupied by retained row style/default binding resources. */
  rowStorageByteLength: number;
  /** Bytes occupied by transient compute input buffers released after expansion. */
  transientComputeInputByteLength: number;
  /** Per-source-batch storage bindings and persistent range state. */
  batches: ArrowStoragePathBatchState[];
  /** Generated render batches preserved for device buffer-size limits. */
  renderBatches: ArrowStoragePathRenderBatchState[];
  /** Row/default binding resources owned by this storage state. */
  ownedRowBindingResources: StoragePathOwnedResource[];
  /** First batch packed per-row RGBA8 color binding. */
  rowColorsBinding: Binding;
  /** First batch packed per-vertex RGBA8 color binding. */
  vertexColorsBinding: Binding;
  /** First batch Float32 path width binding. */
  rowWidthsBinding: Binding;
  /** First batch path style config uniform buffer. */
  styleConfigBuffer: DynamicBuffer;
  /** First generated compact or legacy path segment vertex buffer. */
  compactPathVertexData: Buffer;
  /** Releases owned generated path, range, and row-binding resources. */
  destroy: () => void;
};

/** Props for constructing or rebinding a WebGPU storage-backed Arrow path model. */
export type ArrowStoragePathModelProps =
  | (ArrowStoragePathInputProps & {storageState?: never})
  | (ArrowStoragePathRenderProps & {storageState: ArrowStoragePathState});

type StoragePathDefaultBindings = {
  colorsBinding: Binding;
  vertexColorsBinding: Binding;
  widthsBinding: Binding;
  viewOriginsBinding: Binding;
  byteLength: number;
  ownedResources: StoragePathOwnedResource[];
};

type StoragePathBatchRowState = {
  pathViewOriginsBinding: Binding;
  rowColorsBinding: Binding;
  vertexColorsBinding: Binding;
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
  /** Prepares raw Arrow path/style vectors for storage-backed path rendering. */
  static async prepareGPUVectors(
    device: Device,
    sourceVectors: ArrowPathSourceVectors,
    options: PrepareArrowPathGPUVectorsOptions = {}
  ): Promise<PreparedArrowStoragePathGPUVectors> {
    return prepareArrowStoragePathGPUVectors(device, sourceVectors, options);
  }

  /** Generated segment records across all preserved render batches. */
  segmentCount!: number;
  /** CPU time spent constructing persistent path range metadata. */
  pathRangeBuildTimeMs!: number;
  /** Bytes occupied by persistent per-path range buffers. */
  pathRangeByteLength!: number;
  /** Bytes occupied by one generated path segment record. */
  pathRecordByteStride!: number;
  /** Logical bytes occupied by the first generated path segment buffer. */
  compactPathVertexByteLength!: number;
  /** Logical bytes occupied by all generated path segment buffers. */
  generatedRenderBufferByteLength!: number;
  /** Bytes occupied by retained row style/default binding resources. */
  rowStorageByteLength!: number;
  /** Bytes occupied by transient compute input buffers released after expansion. */
  transientComputeInputByteLength!: number;
  /** Per-source-batch storage bindings and persistent range state. */
  batches!: ArrowStoragePathBatchState[];
  /** Generated render batches preserved for device buffer-size limits. */
  renderBatches!: ArrowStoragePathRenderBatchState[];
  /** First batch packed per-row RGBA8 color binding. */
  rowColorsBinding!: Binding;
  /** First batch packed per-vertex RGBA8 color binding. */
  vertexColorsBinding!: Binding;
  /** First batch Float32 path width binding. */
  rowWidthsBinding!: Binding;
  /** First batch path style config uniform buffer. */
  styleConfigBuffer!: DynamicBuffer;
  /** First generated compact or legacy path segment vertex buffer. */
  compactPathVertexData!: Buffer;
  /** Reusable storage path expansion and row-binding state currently bound by the model. */
  storageState: ArrowStoragePathState;
  private pathProps: ArrowStoragePathModelProps;
  private ownsStorageState: boolean;

  /** Creates a WebGPU storage-backed Arrow path model. */
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

  /** Updates storage path props, rebuilding state only when path/layout inputs change. */
  setProps(props: Partial<ArrowStoragePathModelProps>): void {
    const nextProps = {...this.pathProps, ...props} as ArrowStoragePathModelProps;
    const nextUsesExternalState = hasArrowStoragePathState(nextProps);
    const pathProps = props as Partial<ArrowStoragePathInputProps>;
    const shouldReplaceExternalState = 'storageState' in props && props.storageState !== undefined;
    const shouldReplaceState =
      shouldReplaceExternalState ||
      pathProps.paths !== undefined ||
      pathProps.shaderLayout !== undefined ||
      pathProps.rowIndexBase !== undefined;
    const shouldRefreshRowBindings =
      !nextUsesExternalState &&
      (pathProps.colors !== undefined ||
        pathProps.widths !== undefined ||
        pathProps.timestamps !== undefined ||
        pathProps.viewOrigins !== undefined ||
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

  /** Draws each generated storage path render batch against the supplied render pass. */
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

  /** Releases owned storage path state plus inherited model resources. */
  override destroy(): void {
    if (this.ownsStorageState) {
      this.storageState.destroy();
    }
    super.destroy();
  }

  private applyStorageState(storageState: ArrowStoragePathState): void {
    this.segmentCount = storageState.segmentCount;
    this.pathRangeBuildTimeMs = storageState.pathRangeBuildTimeMs;
    this.pathRangeByteLength = storageState.pathRangeByteLength;
    this.pathRecordByteStride = storageState.pathRecordByteStride;
    this.compactPathVertexByteLength = storageState.compactPathVertexByteLength;
    this.generatedRenderBufferByteLength = storageState.generatedRenderBufferByteLength;
    this.rowStorageByteLength = storageState.rowStorageByteLength;
    this.transientComputeInputByteLength = storageState.transientComputeInputByteLength;
    this.batches = storageState.batches;
    this.renderBatches = storageState.renderBatches;
    this.rowColorsBinding = storageState.rowColorsBinding;
    this.vertexColorsBinding = storageState.vertexColorsBinding;
    this.rowWidthsBinding = storageState.rowWidthsBinding;
    this.styleConfigBuffer = storageState.styleConfigBuffer;
    this.compactPathVertexData = storageState.compactPathVertexData;
  }
}

function getStoragePathRecordMode(shaderLayout: ShaderLayout): StoragePathRecordMode {
  const shaderAttributeNames = new Set(shaderLayout.attributes.map(attribute => attribute.name));
  return shaderRequestsLegacySegmentAttributes(shaderAttributeNames) ? 'legacy' : 'compact';
}

function shaderRequestsLegacySegmentAttributes(shaderAttributeNames: Set<string>): boolean {
  return (
    shaderAttributeNames.has(SEGMENT_END_POINT_INDICES_COLUMN) ||
    shaderAttributeNames.has(SEGMENT_PREVIOUS_POINT_INDICES_COLUMN) ||
    shaderAttributeNames.has(SEGMENT_NEXT_POINT_INDICES_COLUMN)
  );
}

function getStoragePathRecordByteStride(recordMode: StoragePathRecordMode): number {
  return recordMode === 'legacy' ? LEGACY_PATH_VERTEX_BYTE_STRIDE : COMPACT_PATH_VERTEX_BYTE_STRIDE;
}

/** Builds reusable WebGPU storage path expansion and row-binding state. */
export function createArrowStoragePathState(
  device: Device,
  props: ArrowStoragePathInputProps
): ArrowStoragePathState {
  if (device.type !== 'webgpu') {
    throw new Error('createArrowStoragePathState requires a WebGPU device');
  }
  const pathRangeBuildStartTime = getNow();
  const shaderLayout = props.shaderLayout ?? DEFAULT_STORAGE_ARROW_PATH_SHADER_LAYOUT;
  const pathRecordMode = getStoragePathRecordMode(shaderLayout);
  const pathRecordByteStride = getStoragePathRecordByteStride(pathRecordMode);
  const pathRecordWordCount = pathRecordByteStride / Uint32Array.BYTES_PER_ELEMENT;
  const pathInputs = resolveArrowStoragePathInputs(props);
  const defaultBindings = createStoragePathDefaultBindings(device, props);
  const ownedRowBindingResources: StoragePathOwnedResource[] = [...defaultBindings.ownedResources];
  const ownedPathRangeResources: StoragePathOwnedResource[] = [];
  const batches: ArrowStoragePathBatchState[] = [];
  const renderBatches: ArrowStoragePathRenderBatchState[] = [];
  let segmentCount = 0;
  let pathRangeByteLength = 0;
  let generatedRenderBufferByteLength = 0;
  let rowStorageByteLength = defaultBindings.byteLength;
  let transientComputeInputByteLength = 0;

  for (const [rowBindingBatchIndex, batchInput] of pathInputs.batches.entries()) {
    const pathRangeState = createGpuPathRangeState(
      device,
      {id: props.id},
      {
        valueOffsets: batchInput.valueOffsets,
        recordOffsets: batchInput.recordOffsets,
        batchRowIndexBase: batchInput.batchRowIndexBase,
        rowCount: batchInput.rowCount
      }
    );
    ownedPathRangeResources.push(pathRangeState);
    pathRangeByteLength += pathRangeState.byteLength;
    const rowState = createStoragePathBatchRowState(device, props, batchInput, defaultBindings);
    const generatedBufferBatches = planGeneratedBufferBatches({
      device,
      recordOffsets: batchInput.recordOffsets,
      recordByteStride: pathRecordByteStride,
      maxBatchByteLength: device.limits.maxStorageBufferBindingSize,
      resourceLabel: 'ArrowStoragePathModel indexed generated path vertex data'
    });

    for (const generatedBufferBatch of generatedBufferBatches) {
      const expansionInput = createGpuPathExpansionInput(
        device,
        {id: props.id},
        {
          generatedBufferBatch,
          componentCount: batchInput.componentCount,
          recordWordCount: pathRecordWordCount
        }
      );
      const generated = createGpuPathGeneratedState(
        device,
        {id: props.id},
        generatedBufferBatch.recordCount,
        pathRecordWordCount
      );
      dispatchGpuPathExpansionCompute(
        device,
        {id: props.id},
        {
          pathValues: batchInput.pathValuesBinding,
          pathRanges: pathRangeState.pathRangesBuffer,
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
      expansionInput.expansionConfigBuffer.destroy();
    }

    batches.push({
      ...rowState,
      batchRowIndexBase: batchInput.batchRowIndexBase,
      rowCount: batchInput.rowCount,
      segmentCount: batchInput.segmentCount,
      pathValuesBinding: batchInput.pathValuesBinding,
      pathRangesBinding: pathRangeState.pathRangesBuffer,
      ...(batchInput.timestampsBinding
        ? {pathTimestampsBinding: batchInput.timestampsBinding}
        : {}),
      pathViewOriginsBinding: rowState.pathViewOriginsBinding
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
    pathRangeByteLength,
    pathRecordByteStride,
    compactPathVertexByteLength: generatedRenderBufferByteLength,
    generatedRenderBufferByteLength,
    rowStorageByteLength,
    transientComputeInputByteLength,
    batches,
    renderBatches,
    ownedRowBindingResources,
    rowColorsBinding: firstBatch.rowColorsBinding,
    vertexColorsBinding: firstBatch.vertexColorsBinding,
    rowWidthsBinding: firstBatch.rowWidthsBinding,
    styleConfigBuffer: firstBatch.styleConfigBuffer,
    compactPathVertexData: firstRenderBatch.compactPathVertexData,
    destroy: () => {
      if (destroyed) {
        return;
      }
      destroyed = true;
      destroyStoragePathResources(ownedRowBindingResources);
      destroyStoragePathResources(ownedPathRangeResources);
      for (const renderBatch of renderBatches) {
        renderBatch.compactPathVertexData.destroy();
      }
    }
  };
}

function createArrowStoragePathModelProps(
  props: ArrowStoragePathModelProps,
  storageState: ArrowStoragePathState
): ModelProps {
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
    bufferLayout: [
      ...(props.bufferLayout || []),
      createCompactPathBufferLayout(shaderLayout, storageState.pathRecordByteStride)
    ],
    topology: props.topology ?? 'line-list',
    vertexCount: props.vertexCount ?? 2,
    instanceCount: firstRenderBatch.segmentCount
  };
}

function createArrowStoragePathBindings(
  props: ArrowStoragePathModelProps,
  batch: ArrowStoragePathBatchState
): NonNullable<ModelProps['bindings']> {
  return {
    ...(props.bindings || {}),
    pathValues: batch.pathValuesBinding,
    [PATH_RANGES_COLUMN]: batch.pathRangesBinding,
    [PATH_VIEW_ORIGINS_COLUMN]: batch.pathViewOriginsBinding,
    pathRowColors: batch.rowColorsBinding,
    pathVertexColors: batch.vertexColorsBinding,
    pathRowWidths: batch.rowWidthsBinding,
    ...(batch.pathTimestampsBinding ? {pathTimestamps: batch.pathTimestampsBinding} : {}),
    pathStorageStyleConfig: batch.styleConfigBuffer
  };
}

function createCompactPathBufferLayout(
  shaderLayout: ShaderLayout,
  pathRecordByteStride: number
): BufferLayout {
  const shaderAttributeNames = new Set(shaderLayout.attributes.map(attribute => attribute.name));
  const useLegacyRecordLayout = pathRecordByteStride === LEGACY_PATH_VERTEX_BYTE_STRIDE;
  const attributes: NonNullable<BufferLayout['attributes']> = [];
  if (shaderAttributeNames.has(SEGMENT_START_POINT_INDICES_COLUMN)) {
    attributes.push({
      attribute: SEGMENT_START_POINT_INDICES_COLUMN,
      format: 'uint32',
      byteOffset: 0
    });
  }
  if (!useLegacyRecordLayout && shaderRequestsLegacySegmentAttributes(shaderAttributeNames)) {
    throw new Error(
      'ArrowStoragePathModel storageState uses compact path records, but the shader layout requests legacy segment neighbor attributes'
    );
  }
  if (useLegacyRecordLayout && shaderAttributeNames.has(SEGMENT_END_POINT_INDICES_COLUMN)) {
    attributes.push({
      attribute: SEGMENT_END_POINT_INDICES_COLUMN,
      format: 'uint32',
      byteOffset: LEGACY_SEGMENT_END_POINT_INDICES_BYTE_OFFSET
    });
  }
  if (useLegacyRecordLayout && shaderAttributeNames.has(SEGMENT_PREVIOUS_POINT_INDICES_COLUMN)) {
    attributes.push({
      attribute: SEGMENT_PREVIOUS_POINT_INDICES_COLUMN,
      format: 'uint32',
      byteOffset: LEGACY_SEGMENT_PREVIOUS_POINT_INDICES_BYTE_OFFSET
    });
  }
  if (useLegacyRecordLayout && shaderAttributeNames.has(SEGMENT_NEXT_POINT_INDICES_COLUMN)) {
    attributes.push({
      attribute: SEGMENT_NEXT_POINT_INDICES_COLUMN,
      format: 'uint32',
      byteOffset: LEGACY_SEGMENT_NEXT_POINT_INDICES_BYTE_OFFSET
    });
  }
  if (shaderAttributeNames.has(SEGMENT_FLAGS_COLUMN)) {
    attributes.push({
      attribute: SEGMENT_FLAGS_COLUMN,
      format: 'uint32',
      byteOffset: useLegacyRecordLayout
        ? LEGACY_SEGMENT_FLAGS_BYTE_OFFSET
        : COMPACT_SEGMENT_FLAGS_BYTE_OFFSET
    });
  }
  if (shaderAttributeNames.has(ROW_INDICES_COLUMN)) {
    attributes.push({
      attribute: ROW_INDICES_COLUMN,
      format: 'uint32',
      byteOffset: useLegacyRecordLayout
        ? LEGACY_ROW_INDICES_BYTE_OFFSET
        : COMPACT_ROW_INDICES_BYTE_OFFSET
    });
  }
  return {
    name: COMPACT_PATH_VERTEX_DATA,
    stepMode: 'instance',
    byteStride: pathRecordByteStride,
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
      new Uint8(),
      4,
      new Uint8Array(props.color ?? DEFAULT_STORAGE_PATH_COLOR)
    )
  );
  const widthsVector = createStoragePathOwnedGpuVector(
    device,
    `${id}-default-row-widths`,
    vectorFromArray([props.width ?? DEFAULT_STORAGE_PATH_WIDTH], new Float32())
  );
  const viewOriginsVector = createStoragePathOwnedGpuVector(
    device,
    `${id}-default-view-origins`,
    makeArrowFixedSizeListVector(new Float32(), 4, new Float32Array(4))
  );
  return {
    colorsBinding: getStoragePathGpuVectorBinding(colorsVector),
    vertexColorsBinding: getStoragePathGpuVectorBinding(colorsVector),
    widthsBinding: getStoragePathGpuVectorBinding(widthsVector),
    viewOriginsBinding: getStoragePathGpuVectorBinding(viewOriginsVector),
    byteLength:
      Uint8Array.BYTES_PER_ELEMENT * 4 +
      Float32Array.BYTES_PER_ELEMENT +
      Float32Array.BYTES_PER_ELEMENT * 4,
    ownedResources: [colorsVector, widthsVector, viewOriginsVector]
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
    pathViewOriginsBinding: batchInput.viewOriginsBinding ?? defaultBindings.viewOriginsBinding,
    rowColorsBinding:
      props.colors && isArrowPathRowColorType(props.colors.type) && batchInput.colorsBinding
        ? batchInput.colorsBinding
        : defaultBindings.colorsBinding,
    vertexColorsBinding:
      props.colors && isArrowPathVertexColorType(props.colors.type) && batchInput.colorsBinding
        ? batchInput.colorsBinding
        : defaultBindings.vertexColorsBinding,
    rowWidthsBinding: batchInput.widthsBinding ?? defaultBindings.widthsBinding,
    styleConfigBuffer,
    ownedResources: [styleConfigBuffer],
    ownedByteLength: styleConfigData.byteLength
  };
}

function createStoragePathOwnedGpuVector<T extends DataType>(
  device: Device,
  name: string,
  vector: Vector<T>
): GPUVector {
  return makeGPUVectorFromArrow(device, vector, {
    name,
    id: name,
    usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC
  });
}

function getStoragePathGpuVectorBinding(vector: GPUVector): Binding {
  const [data, ...remainingData] = vector.data;
  if (!data || remainingData.length > 0) {
    throw new Error(`Storage path vector "${vector.name}" requires exactly one GPUData chunk`);
  }
  const buffer = data.buffer;
  return buffer instanceof DynamicBuffer ? buffer.buffer : buffer;
}

function isArrowPathRowColorType(type: DataType): type is ArrowPathRowColorType {
  return (
    DataType.isFixedSizeList(type) && type.listSize === 4 && type.children[0]?.type instanceof Uint8
  );
}

function isArrowPathVertexColorType(type: DataType): type is ArrowPathVertexColorType {
  return DataType.isList(type) && isArrowPathRowColorType(type.children[0]?.type);
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
  uintValues[5] = props.colors && isArrowPathRowColorType(props.colors.type) ? 1 : 0;
  uintValues[6] = props.widths ? 1 : 0;
  uintValues[7] = batchRowIndexBase;
  uintValues[8] = pathComponentCount;
  uintValues[9] = props.viewOrigins ? 1 : 0;
  uintValues[10] = props.colors && isArrowPathVertexColorType(props.colors.type) ? 1 : 0;
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
      pathValuesBinding: previousBatch.pathValuesBinding,
      pathRangesBinding: previousBatch.pathRangesBinding,
      ...(batchInput.timestampsBinding
        ? {pathTimestampsBinding: batchInput.timestampsBinding}
        : {}),
      pathViewOriginsBinding: rowState.pathViewOriginsBinding
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
  storageState.vertexColorsBinding = firstBatch.vertexColorsBinding;
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
