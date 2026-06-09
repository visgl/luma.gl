// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  type Buffer,
  type BufferLayout,
  type Device,
  type RenderPass,
  type ShaderLayout
} from '@luma.gl/core';
import {GPUTableModel, type GPUTableModelProps} from '../../engine/gpu-table-model';
import type {GPUTable} from '../../table/gpu-table';
import type {GPUVector} from '../../table/gpu-vector';
import {isVertexListGPUVectorFormat, type VertexList} from '../../table/gpu-vector-format';
import type {GeneratedBufferBatch} from '../../utils/generated-buffer-batches';
import {
  assertModelGPUVectorInputs,
  type ModelGPUInputSchema
} from '../../engine/gpu-table-model-input-schema';

const SEGMENT_START_POSITIONS_COLUMN = 'segmentStartPositions';
const SEGMENT_END_POSITIONS_COLUMN = 'segmentEndPositions';
const SEGMENT_PREVIOUS_POSITIONS_COLUMN = 'segmentPreviousPositions';
const SEGMENT_NEXT_POSITIONS_COLUMN = 'segmentNextPositions';
const SEGMENT_START_COLORS_COLUMN = 'segmentStartColors';
const SEGMENT_END_COLORS_COLUMN = 'segmentEndColors';
const SEGMENT_FLAGS_COLUMN = 'segmentFlags';
const ROW_INDICES_COLUMN = 'rowIndices';
const EXPANDED_PATH_VERTEX_DATA = 'expandedPathVertexData';
const PATH_VIEW_ORIGINS_COLUMN = 'pathViewOrigins';
const PATH_VIEW_ORIGIN_DATA = 'pathViewOriginData';

const EXPANDED_PATH_VERTEX_BYTE_STRIDE =
  Float32Array.BYTES_PER_ELEMENT * 16 + Uint32Array.BYTES_PER_ELEMENT * 4;
const SEGMENT_END_POSITIONS_BYTE_OFFSET = Float32Array.BYTES_PER_ELEMENT * 4;
const SEGMENT_PREVIOUS_POSITIONS_BYTE_OFFSET = Float32Array.BYTES_PER_ELEMENT * 8;
const SEGMENT_NEXT_POSITIONS_BYTE_OFFSET = Float32Array.BYTES_PER_ELEMENT * 12;
const SEGMENT_FLAGS_BYTE_OFFSET = Float32Array.BYTES_PER_ELEMENT * 16;
const ROW_INDICES_BYTE_OFFSET = SEGMENT_FLAGS_BYTE_OFFSET + Uint32Array.BYTES_PER_ELEMENT;
const SEGMENT_START_COLORS_BYTE_OFFSET = ROW_INDICES_BYTE_OFFSET + Uint32Array.BYTES_PER_ELEMENT;
const SEGMENT_END_COLORS_BYTE_OFFSET =
  SEGMENT_START_COLORS_BYTE_OFFSET + Uint32Array.BYTES_PER_ELEMENT;

/** Prepared GPU inputs consumed by the attribute-backed path model. */
export const PATH_ATTRIBUTE_GPU_INPUT_SCHEMA = [
  {
    name: 'paths',
    kind: 'positions',
    required: true,
    formats: ['vertex-list<float32x2>', 'vertex-list<float32x3>', 'vertex-list<float32x4>'],
    source: 'source-mappable'
  },
  {
    name: 'colors',
    kind: 'colors',
    required: false,
    formats: ['unorm8x4', 'vertex-list<unorm8x4>'],
    source: 'source-mappable'
  },
  {
    name: 'widths',
    kind: 'scalars',
    required: false,
    formats: ['float32'],
    source: 'source-mappable'
  },
  {
    name: 'viewOrigins',
    kind: 'positions',
    required: false,
    formats: ['float32x4'],
    source: 'generated'
  }
] as const satisfies ModelGPUInputSchema;

const DEFAULT_PATH_SHADER_LAYOUT: ShaderLayout = {
  attributes: [
    {name: SEGMENT_START_POSITIONS_COLUMN, location: 0, type: 'vec4<f32>', stepMode: 'instance'},
    {name: SEGMENT_END_POSITIONS_COLUMN, location: 1, type: 'vec4<f32>', stepMode: 'instance'},
    {name: SEGMENT_START_COLORS_COLUMN, location: 2, type: 'u32', stepMode: 'instance'},
    {name: SEGMENT_END_COLORS_COLUMN, location: 3, type: 'u32', stepMode: 'instance'},
    {name: PATH_VIEW_ORIGINS_COLUMN, location: 4, type: 'vec4<f32>', stepMode: 'instance'}
  ],
  bindings: []
};

const DEFAULT_PATH_VS = `#version 300 es
precision highp float;

in vec4 segmentStartPositions;
in vec4 segmentEndPositions;
in uint segmentStartColors;
in uint segmentEndColors;
in vec4 pathViewOrigins;

void main() {
  vec4 pathDelta = gl_VertexID % 2 == 0 ? segmentStartPositions : segmentEndPositions;
  vec4 pathPosition = pathViewOrigins + pathDelta;
  gl_Position = vec4(pathPosition.xyz, 1.0);
}
`;

const DEFAULT_PATH_FS = `#version 300 es
precision highp float;

out vec4 fragColor;

void main() {
  fragColor = vec4(1.0);
}
`;

/** CPU-generated segment geometry diagnostics retained by prepared path render state. */
export type PathSegmentLayout = {
  /** Cumulative segment offsets, length = source path rows + 1. */
  startIndices: number[];
  /** Number of generated segment records. */
  segmentCount: number;
  /** Generated segment starts, padded to four Float32 lanes per segment. */
  segmentStartPositions: Float32Array;
  /** Generated segment ends, padded to four Float32 lanes per segment. */
  segmentEndPositions: Float32Array;
  /** Previous coordinate used for join/cap decisions, padded to four Float32 lanes. */
  segmentPreviousPositions: Float32Array;
  /** Next coordinate used for join/cap decisions, padded to four Float32 lanes. */
  segmentNextPositions: Float32Array;
  /** Per-segment view-space path origin, padded to four Float32 lanes. */
  segmentViewOrigins: Float32Array;
  /** Packed first/last/closed flags for each generated segment. */
  segmentFlags: Uint32Array;
  /** Packed RGBA8 color at each generated segment start point. */
  segmentStartColors: Uint32Array;
  /** Packed RGBA8 color at each generated segment end point. */
  segmentEndColors: Uint32Array;
};

/** Generated render-batch state consumed by {@link PathAttributeModel}. */
export type PathRenderBatchState = {
  /** First source path row included in this generated render batch. */
  rowStart: number;
  /** Source path row after the last row included in this generated render batch. */
  rowEnd: number;
  /** Generated segment records drawn by this render batch. */
  segmentCount: number;
  /** Generated packed segment vertex attribute buffer. */
  expandedPathVertexData: Buffer;
  /** Generated per-segment Float32 view-origin attribute buffer. */
  pathViewOriginData: Buffer;
};

/** GPU-only path render state prepared before constructing {@link PathAttributeModel}. */
export type PathAttributeModelState = {
  /** Generated path segment layout diagnostics. */
  segmentLayout: PathSegmentLayout;
  /** Generated render batches preserved for device buffer-size limits. */
  renderBatches: PathRenderBatchState[];
  /** Planning metadata for generated render batches. */
  generatedBufferBatches: GeneratedBufferBatch[];
  /** First generated packed segment vertex attribute buffer. */
  expandedPathVertexData: Buffer;
  /** First generated per-segment Float32 view-origin attribute buffer. */
  pathViewOriginData: Buffer;
};

/** Props for the GPU-only attribute-backed path renderer. */
export type PathAttributeModelProps = Omit<GPUTableModelProps, 'table' | 'tableCount'> & {
  /** GPU table supplying already prepared segment-compatible row attributes. */
  table: GPUTable;
  /** Whether the model should destroy its prepared GPU table. Defaults to `false`. */
  ownsTable?: boolean;
  /** Variable-length Float32 XY, XYZ, or XYZM path coordinates, one GPU row per path. */
  paths: GPUVector<VertexList<'float32x2' | 'float32x3' | 'float32x4'>>;
  /** Optional packed RGBA8 path colors, either one per path row or one per path vertex. */
  colors?: GPUVector<'unorm8x4' | VertexList<'unorm8x4'>>;
  /** Optional per-path widths, one GPU row per path. */
  widths?: GPUVector<'float32'>;
  /** Optional per-path view-space origins, one GPU row per path. */
  viewOrigins?: GPUVector<'float32x4'>;
  /** Prepared GPU-only path expansion state. */
  pathState: PathAttributeModelState;
};

type PreparedPathAttributeModel = {
  modelProps: GPUTableModelProps;
  segmentLayout: PathSegmentLayout;
  expandedPathVertexData: Buffer;
  pathViewOriginData: Buffer;
  renderBatches: PathRenderBatchState[];
};

/** GPU-only path renderer that consumes already prepared path GPU vectors and render state. */
export class PathAttributeModel extends GPUTableModel {
  /** Prepared GPU vectors consumed by the attribute-backed path model. */
  static readonly gpuInputSchema = PATH_ATTRIBUTE_GPU_INPUT_SCHEMA;

  /** Generated path segment layout diagnostics. */
  segmentLayout: PathSegmentLayout;
  /** First generated packed segment vertex attribute buffer. */
  expandedPathVertexData: Buffer;
  /** First generated per-segment Float32 view-origin attribute buffer. */
  pathViewOriginData: Buffer;
  /** Generated render batches preserved for device buffer-size limits. */
  renderBatches: PathRenderBatchState[];
  private pathProps: PathAttributeModelProps;
  private pathShaderLayout: ShaderLayout;
  private pathTable: GPUTable;
  private ownsPathTable: boolean;

  /** Creates an attribute-backed path model from prepared GPU props. */
  constructor(device: Device, props: PathAttributeModelProps) {
    const prepared = preparePathAttributeModel(props);
    super(device, prepared.modelProps);
    this.pathTable = props.table;
    this.ownsPathTable = props.ownsTable ?? false;
    this.pathProps = props;
    this.pathShaderLayout = prepared.modelProps.shaderLayout!;
    this.segmentLayout = prepared.segmentLayout;
    this.expandedPathVertexData = prepared.expandedPathVertexData;
    this.pathViewOriginData = prepared.pathViewOriginData;
    this.renderBatches = prepared.renderBatches;
  }

  /** Replace generated segment records with new prepared GPU path state. */
  override setProps(props: Partial<PathAttributeModelProps>): void {
    const nextProps = {...this.pathProps, ...props};
    const shouldRebuild =
      props.pathState !== undefined || props.table !== undefined || props.ownsTable !== undefined;

    this.pathProps = nextProps;
    if (!shouldRebuild) {
      super.setProps({});
      return;
    }

    const prepared = preparePathAttributeModel(nextProps);
    this.segmentLayout = prepared.segmentLayout;
    this.expandedPathVertexData = prepared.expandedPathVertexData;
    this.pathViewOriginData = prepared.pathViewOriginData;
    this.renderBatches = prepared.renderBatches;
    this.pathShaderLayout = prepared.modelProps.shaderLayout!;

    const previousPathTable = this.pathTable;
    const previousOwnsPathTable = this.ownsPathTable;
    this.pathTable = nextProps.table;
    this.ownsPathTable = nextProps.ownsTable ?? false;
    super.setProps({table: this.pathTable});
    if (previousOwnsPathTable && previousPathTable !== this.pathTable) {
      previousPathTable.destroy();
    }
    this.setAttributes(
      getPathAttributeModelAttributes(prepared.modelProps.shaderLayout!, prepared)
    );
    this.setInstanceCount(prepared.segmentLayout.segmentCount);
    this.setNeedsRedraw('Path segment state updated');
  }

  /** Draws each generated path render batch against the supplied render pass. */
  override draw(renderPass: RenderPass): boolean {
    const tableBatches = this.table?.batches || [];
    if (tableBatches.length > 0 && tableBatches.length !== this.renderBatches.length) {
      throw new Error(
        'PathAttributeModel draw batches must align with generated path render batches'
      );
    }

    let drawSuccess = true;
    try {
      for (const [batchIndex, renderBatch] of this.renderBatches.entries()) {
        const tableBatch = tableBatches[batchIndex];
        this.setAttributes({
          ...(tableBatch?.attributes || {}),
          ...getPathAttributeModelBatchAttributes(this.pathShaderLayout, renderBatch)
        });
        this.setInstanceCount(renderBatch.segmentCount);
        drawSuccess = super.draw(renderPass) && drawSuccess;
      }
    } finally {
      this.setAttributes({
        ...(this.table?.attributes || {}),
        ...getPathAttributeModelAttributes(this.pathShaderLayout, {
          expandedPathVertexData: this.expandedPathVertexData,
          pathViewOriginData: this.pathViewOriginData
        })
      });
      this.setInstanceCount(this.segmentLayout.segmentCount);
    }

    return drawSuccess;
  }

  /** Releases inherited model resources. Prepared GPU path state remains caller-owned. */
  override destroy(): void {
    super.destroy();
    if (this.ownsPathTable) {
      this.pathTable.destroy();
      this.ownsPathTable = false;
    }
  }
}

function preparePathAttributeModel(props: PathAttributeModelProps): PreparedPathAttributeModel {
  assertArrowPathVectorTypes(props);
  assertArrowPathVectorRowAlignment(props);
  assertArrowPathPreparedStateAlignment(props);
  const shaderLayout = props.shaderLayout ?? DEFAULT_PATH_SHADER_LAYOUT;
  const firstRenderBatch = props.pathState.renderBatches[0];
  if (!firstRenderBatch) {
    throw new Error('PathAttributeModel requires at least one prepared path render batch');
  }

  return {
    modelProps: {
      ...props,
      vs: props.vs ?? DEFAULT_PATH_VS,
      fs: props.fs ?? DEFAULT_PATH_FS,
      shaderLayout,
      attributes: {
        ...(props.attributes || {}),
        ...getPathAttributeModelBatchAttributes(shaderLayout, firstRenderBatch)
      },
      bufferLayout: [...(props.bufferLayout || []), ...createArrowPathBufferLayouts(shaderLayout)],
      topology: props.topology ?? 'line-list',
      vertexCount: props.vertexCount ?? 2,
      instanceCount: props.pathState.segmentLayout.segmentCount,
      table: props.table,
      tableCount: 'none'
    },
    segmentLayout: props.pathState.segmentLayout,
    expandedPathVertexData: firstRenderBatch.expandedPathVertexData,
    pathViewOriginData: firstRenderBatch.pathViewOriginData,
    renderBatches: props.pathState.renderBatches
  };
}

function assertArrowPathVectorTypes(props: PathAttributeModelProps): void {
  assertModelGPUVectorInputs('PathAttributeModel', PathAttributeModel.gpuInputSchema, {
    paths: props.paths,
    colors: props.colors,
    widths: props.widths,
    viewOrigins: props.viewOrigins
  });
}

function assertArrowPathVectorRowAlignment(props: PathAttributeModelProps): void {
  const rowInputs = getArrowPathRowInputs(props);
  const [referenceName, referenceVector] = rowInputs[0];
  for (const [name, vector] of rowInputs.slice(1)) {
    if (vector.length !== referenceVector.length) {
      throw new Error(
        `PathAttributeModel ${name} rows must match ${referenceName} rows (${vector.length} !== ${referenceVector.length})`
      );
    }
    if (vector.data.length !== referenceVector.data.length) {
      throw new Error(
        `PathAttributeModel ${name} batch count must match ${referenceName} batch count`
      );
    }
    for (let batchIndex = 0; batchIndex < vector.data.length; batchIndex++) {
      if (vector.data[batchIndex].length !== referenceVector.data[batchIndex].length) {
        throw new Error(
          `PathAttributeModel ${name} batch ${batchIndex} rows must match ${referenceName}`
        );
      }
    }
  }
  if (props.colors && isPathVertexColorGPUVector(props.colors)) {
    assertArrowPathVertexColorGpuVectorAlignment(props.paths, props.colors);
  }
}

function getArrowPathRowInputs(props: PathAttributeModelProps): Array<[string, GPUVector]> {
  return [
    ['paths', props.paths],
    ['colors', props.colors],
    ['widths', props.widths],
    ['viewOrigins', props.viewOrigins]
  ].filter(([, vector]) => vector !== undefined) as Array<[string, GPUVector]>;
}

function isPathVertexColorGPUVector(
  colors: NonNullable<PathAttributeModelProps['colors']>
): boolean {
  return colors.format !== undefined && isVertexListGPUVectorFormat(colors.format);
}

function assertArrowPathPreparedStateAlignment(props: PathAttributeModelProps): void {
  if (!props.pathState) {
    throw new Error('PathAttributeModel requires prepared pathState');
  }
  const preparedRowCount = props.pathState.segmentLayout.startIndices.length - 1;
  if (preparedRowCount !== props.paths.length) {
    throw new Error(
      `PathAttributeModel prepared path rows must match path GPU rows (${preparedRowCount} !== ${props.paths.length})`
    );
  }
}

function assertArrowPathVertexColorGpuVectorAlignment(paths: GPUVector, colors: GPUVector): void {
  for (let batchIndex = 0; batchIndex < paths.data.length; batchIndex++) {
    const pathMetadata = paths.data[batchIndex]?.readbackMetadata;
    const colorMetadata = colors.data[batchIndex]?.readbackMetadata;
    if (
      pathMetadata?.kind !== 'variable-length-attribute' ||
      colorMetadata?.kind !== 'variable-length-attribute' ||
      !areArrowPathOffsetsEqual(pathMetadata.valueOffsets, colorMetadata.valueOffsets)
    ) {
      throw new Error('PathAttributeModel vertex colors must align with path vertex offsets');
    }
  }
}

function areArrowPathOffsetsEqual(left: Int32Array, right: Int32Array): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function createArrowPathBufferLayouts(shaderLayout: ShaderLayout): BufferLayout[] {
  const shaderAttributeNames = new Set(shaderLayout.attributes.map(attribute => attribute.name));
  const expandedAttributes: NonNullable<BufferLayout['attributes']> = [];
  if (shaderAttributeNames.has(SEGMENT_START_POSITIONS_COLUMN)) {
    expandedAttributes.push({
      attribute: SEGMENT_START_POSITIONS_COLUMN,
      format: 'float32x4',
      byteOffset: 0
    });
  }
  if (shaderAttributeNames.has(SEGMENT_END_POSITIONS_COLUMN)) {
    expandedAttributes.push({
      attribute: SEGMENT_END_POSITIONS_COLUMN,
      format: 'float32x4',
      byteOffset: SEGMENT_END_POSITIONS_BYTE_OFFSET
    });
  }
  if (shaderAttributeNames.has(SEGMENT_PREVIOUS_POSITIONS_COLUMN)) {
    expandedAttributes.push({
      attribute: SEGMENT_PREVIOUS_POSITIONS_COLUMN,
      format: 'float32x4',
      byteOffset: SEGMENT_PREVIOUS_POSITIONS_BYTE_OFFSET
    });
  }
  if (shaderAttributeNames.has(SEGMENT_NEXT_POSITIONS_COLUMN)) {
    expandedAttributes.push({
      attribute: SEGMENT_NEXT_POSITIONS_COLUMN,
      format: 'float32x4',
      byteOffset: SEGMENT_NEXT_POSITIONS_BYTE_OFFSET
    });
  }
  if (shaderAttributeNames.has(SEGMENT_FLAGS_COLUMN)) {
    expandedAttributes.push({
      attribute: SEGMENT_FLAGS_COLUMN,
      format: 'uint32',
      byteOffset: SEGMENT_FLAGS_BYTE_OFFSET
    });
  }
  if (shaderAttributeNames.has(ROW_INDICES_COLUMN)) {
    expandedAttributes.push({
      attribute: ROW_INDICES_COLUMN,
      format: 'uint32',
      byteOffset: ROW_INDICES_BYTE_OFFSET
    });
  }
  if (shaderAttributeNames.has(SEGMENT_START_COLORS_COLUMN)) {
    expandedAttributes.push({
      attribute: SEGMENT_START_COLORS_COLUMN,
      format: 'uint32',
      byteOffset: SEGMENT_START_COLORS_BYTE_OFFSET
    });
  }
  if (shaderAttributeNames.has(SEGMENT_END_COLORS_COLUMN)) {
    expandedAttributes.push({
      attribute: SEGMENT_END_COLORS_COLUMN,
      format: 'uint32',
      byteOffset: SEGMENT_END_COLORS_BYTE_OFFSET
    });
  }

  const bufferLayouts: BufferLayout[] = [
    {
      name: EXPANDED_PATH_VERTEX_DATA,
      byteStride: EXPANDED_PATH_VERTEX_BYTE_STRIDE,
      stepMode: 'instance',
      attributes: expandedAttributes
    }
  ];

  if (shaderAttributeNames.has(PATH_VIEW_ORIGINS_COLUMN)) {
    bufferLayouts.push({
      name: PATH_VIEW_ORIGIN_DATA,
      byteStride: Float32Array.BYTES_PER_ELEMENT * 4,
      stepMode: 'instance',
      attributes: [
        {
          attribute: PATH_VIEW_ORIGINS_COLUMN,
          format: 'float32x4',
          byteOffset: 0
        }
      ]
    });
  }

  return bufferLayouts;
}

function getPathAttributeModelAttributes(
  shaderLayout: ShaderLayout,
  state: Pick<PathAttributeModelState, 'expandedPathVertexData' | 'pathViewOriginData'>
): Record<string, Buffer> {
  const shaderAttributeNames = new Set(shaderLayout.attributes.map(attribute => attribute.name));
  return {
    [EXPANDED_PATH_VERTEX_DATA]: state.expandedPathVertexData,
    ...(shaderAttributeNames.has(PATH_VIEW_ORIGINS_COLUMN)
      ? {[PATH_VIEW_ORIGIN_DATA]: state.pathViewOriginData}
      : {})
  };
}

function getPathAttributeModelBatchAttributes(
  shaderLayout: ShaderLayout,
  renderBatch: PathRenderBatchState
): Record<string, Buffer> {
  return getPathAttributeModelAttributes(shaderLayout, renderBatch);
}
