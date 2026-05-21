// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  Buffer,
  type BufferLayout,
  type Device,
  type RenderPass,
  type ShaderLayout
} from '@luma.gl/core';
import {GPUVector, planGeneratedBufferBatches, type GeneratedBufferBatch} from '@luma.gl/tables';
import * as arrow from 'apache-arrow';
import {ArrowModel, type ArrowModelProps} from './arrow-model';
import {makeArrowGPUVector, readArrowGPUVectorAsync} from './arrow-gpu-table-adapters';
import {expandArrowVector} from './arrow-vector-utils';
import {
  getArrowDataBufferSource,
  getArrowVariableLengthAttributeDataBufferSource,
  getArrowVectorBufferSource
} from './arrow-gpu-data';
import {makeArrowFixedSizeListVector} from './arrow-fixed-size-list';
import {closeArrowPaths} from './close-arrow-paths';
import {
  isInstanceArrowType,
  isVariableLengthAttributeArrowType,
  type NumericArrowType
} from './arrow-types';

const SEGMENT_START_POSITIONS_COLUMN = 'segmentStartPositions';
const SEGMENT_END_POSITIONS_COLUMN = 'segmentEndPositions';
const SEGMENT_PREVIOUS_POSITIONS_COLUMN = 'segmentPreviousPositions';
const SEGMENT_NEXT_POSITIONS_COLUMN = 'segmentNextPositions';
const SEGMENT_FLAGS_COLUMN = 'segmentFlags';
const ROW_INDICES_COLUMN = 'rowIndices';
const EXPANDED_PATH_VERTEX_DATA = 'expandedPathVertexData';
const PATH_VIEW_ORIGINS_COLUMN = 'pathViewOrigins';
const PATH_VIEW_ORIGIN_DATA = 'pathViewOriginData';

const PATH_SEGMENT_FIRST = 1;
const PATH_SEGMENT_LAST = 2;
const PATH_SEGMENT_CLOSED = 4;

const EXPANDED_PATH_VERTEX_BYTE_STRIDE =
  Float32Array.BYTES_PER_ELEMENT * 16 + Uint32Array.BYTES_PER_ELEMENT * 2;
const SEGMENT_END_POSITIONS_BYTE_OFFSET = Float32Array.BYTES_PER_ELEMENT * 4;
const SEGMENT_PREVIOUS_POSITIONS_BYTE_OFFSET = Float32Array.BYTES_PER_ELEMENT * 8;
const SEGMENT_NEXT_POSITIONS_BYTE_OFFSET = Float32Array.BYTES_PER_ELEMENT * 12;
const SEGMENT_FLAGS_BYTE_OFFSET = Float32Array.BYTES_PER_ELEMENT * 16;
const ROW_INDICES_BYTE_OFFSET = SEGMENT_FLAGS_BYTE_OFFSET + Uint32Array.BYTES_PER_ELEMENT;
const IDENTITY_MATRIX4 = Object.freeze([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

type ArrowPathCoordinateType = arrow.List<arrow.FixedSizeList<arrow.Float32>>;
type ArrowPathFloat64CoordinateType = arrow.List<arrow.FixedSizeList<arrow.Float64>>;
type ArrowPathSourceCoordinateType = ArrowPathCoordinateType | ArrowPathFloat64CoordinateType;
type ArrowPathColorType = arrow.FixedSizeList<arrow.Uint8>;
type ArrowPathViewOriginType = arrow.FixedSizeList<arrow.Float32>;
type ArrowPathViewOriginChunk = {
  rowStart: number;
  rowEnd: number;
  values: Float32Array;
};
type ArrowPathViewOriginRows = {
  chunks: ArrowPathViewOriginChunk[];
  currentChunkIndex: number;
};

const DEFAULT_ARROW_PATH_SHADER_LAYOUT: ShaderLayout = {
  attributes: [
    {name: SEGMENT_START_POSITIONS_COLUMN, location: 0, type: 'vec4<f32>', stepMode: 'instance'},
    {name: SEGMENT_END_POSITIONS_COLUMN, location: 1, type: 'vec4<f32>', stepMode: 'instance'},
    {name: PATH_VIEW_ORIGINS_COLUMN, location: 2, type: 'vec4<f32>', stepMode: 'instance'}
  ],
  bindings: []
};

const DEFAULT_ARROW_PATH_VS = `#version 300 es
precision highp float;

in vec4 segmentStartPositions;
in vec4 segmentEndPositions;
in vec4 pathViewOrigins;

void main() {
  vec4 pathDelta = gl_VertexID % 2 == 0 ? segmentStartPositions : segmentEndPositions;
  vec4 pathPosition = pathViewOrigins + pathDelta;
  gl_Position = vec4(pathPosition.xyz, 1.0);
}
`;

const DEFAULT_ARROW_PATH_FS = `#version 300 es
precision highp float;

out vec4 fragColor;

void main() {
  fragColor = vec4(1.0);
}
`;

/** CPU Arrow vectors retained explicitly while path rows expand into segment attributes. */
export type ArrowPathSourceVectors = {
  paths: arrow.Vector<ArrowPathSourceCoordinateType>;
  colors?: arrow.Vector<ArrowPathColorType>;
  widths?: arrow.Vector<arrow.Float32>;
  closed?: arrow.Vector<arrow.Bool>;
};

export type PrepareArrowPathGPUVectorsOptions = {
  id?: string;
  closeEpsilon?: number;
};

export type ArrowPathViewOriginUpdateProps = {
  modelViewMatrix: readonly number[];
};

export type PreparedArrowPathGPUVectors = {
  paths: GPUVector<ArrowPathCoordinateType>;
  colors?: GPUVector<ArrowPathColorType>;
  widths?: GPUVector<arrow.Float32>;
  viewOrigins?: GPUVector<ArrowPathViewOriginType>;
  sourceOrigins?: Float64Array;
  pathProps: ArrowPathModelProps;
  storagePathProps: {
    paths: GPUVector<ArrowPathCoordinateType>;
    colors?: GPUVector<ArrowPathColorType>;
    widths?: GPUVector<arrow.Float32>;
    viewOrigins?: GPUVector<ArrowPathViewOriginType>;
  };
  updateViewOrigins: (props: ArrowPathViewOriginUpdateProps) => void;
  destroy: () => void;
};

/** Props for the CPU-expanded attribute-backed Arrow path renderer. */
export type ArrowPathModelProps = Omit<
  ArrowModelProps,
  'arrowTable' | 'arrowGPUTable' | 'arrowCount'
> & {
  /** Variable-length Float32 XY, XYZ, or XYZM path coordinates, one Arrow row per path. */
  paths: GPUVector<ArrowPathCoordinateType>;
  /** Optional packed RGBA8 path colors, one Arrow row per path. */
  colors?: GPUVector<ArrowPathColorType>;
  /** Optional per-path widths, one Arrow row per path. */
  widths?: GPUVector<arrow.Float32>;
  /** Optional per-path view-space origins, one Arrow row per path. */
  viewOrigins?: GPUVector<ArrowPathViewOriginType>;
  /** Prepared path expansion state produced by `prepareArrowPathGPUVectors()`. */
  pathState: ArrowPathPreparedState;
};

/** CPU-generated segment geometry for one expanded Arrow path table. */
export type ArrowPathSegmentLayout = {
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
};

/** Expanded Arrow table plus generated path layout diagnostics. */
export type ArrowPathSegmentTable = {
  table: arrow.Table;
  segmentLayout: ArrowPathSegmentLayout;
  segmentAttributeBuildTimeMs: number;
  attributeByteLength: number;
};

/** Generated render-batch state consumed by {@link ArrowPathModel}. */
export type ArrowPathRenderBatchState = {
  rowStart: number;
  rowEnd: number;
  segmentCount: number;
  expandedPathVertexData: Buffer;
  pathViewOriginData: Buffer;
};

export type ArrowPathPreparedState = {
  segmentTable: ArrowPathSegmentTable;
  expandedPathVertexData: Buffer;
  pathViewOriginData: Buffer;
  renderBatches: ArrowPathRenderBatchState[];
  generatedBufferBatches: GeneratedBufferBatch[];
  destroy: () => void;
};

/** Arrow-backed path renderer that expands one logical path row into segment instances. */
export class ArrowPathModel extends ArrowModel {
  static async prepareGPUVectors(
    device: Device,
    sourceVectors: ArrowPathSourceVectors,
    options: PrepareArrowPathGPUVectorsOptions = {}
  ): Promise<PreparedArrowPathGPUVectors> {
    return prepareArrowPathGPUVectors(device, sourceVectors, options);
  }

  segmentLayout: ArrowPathSegmentLayout;
  segmentTable: arrow.Table;
  segmentAttributeBuildTimeMs: number;
  segmentAttributeByteLength: number;
  expandedPathVertexData: Buffer;
  pathViewOriginData: Buffer;
  renderBatches: ArrowPathRenderBatchState[];
  private pathProps: ArrowPathModelProps;
  private pathShaderLayout: ShaderLayout;

  constructor(device: Device, props: ArrowPathModelProps) {
    const prepared = prepareArrowPathModel(device, props);
    super(device, prepared.modelProps);
    this.pathProps = props;
    this.pathShaderLayout = prepared.modelProps.shaderLayout!;
    this.segmentLayout = prepared.segmentTable.segmentLayout;
    this.segmentTable = prepared.segmentTable.table;
    this.segmentAttributeBuildTimeMs = prepared.segmentTable.segmentAttributeBuildTimeMs;
    this.segmentAttributeByteLength = prepared.segmentTable.attributeByteLength;
    this.expandedPathVertexData = prepared.expandedPathVertexData;
    this.pathViewOriginData = prepared.pathViewOriginData;
    this.renderBatches = prepared.renderBatches;
  }

  /** Replace generated segment records with a new prepared path state. */
  override setProps(props: Partial<ArrowPathModelProps>): void {
    const nextProps = {...this.pathProps, ...props};
    const shouldRebuild = props.pathState !== undefined;

    this.pathProps = nextProps;
    if (!shouldRebuild) {
      super.setProps({});
      return;
    }

    const prepared = prepareArrowPathModel(this.device, nextProps);
    this.segmentLayout = prepared.segmentTable.segmentLayout;
    this.segmentTable = prepared.segmentTable.table;
    this.segmentAttributeBuildTimeMs = prepared.segmentTable.segmentAttributeBuildTimeMs;
    this.segmentAttributeByteLength = prepared.segmentTable.attributeByteLength;
    this.expandedPathVertexData = prepared.expandedPathVertexData;
    this.pathViewOriginData = prepared.pathViewOriginData;
    this.renderBatches = prepared.renderBatches;
    this.pathShaderLayout = prepared.modelProps.shaderLayout!;

    super.setProps({arrowTable: prepared.modelProps.arrowTable as arrow.Table});
    this.setAttributes(getArrowPathModelAttributes(prepared.modelProps.shaderLayout!, prepared));
    this.setInstanceCount(prepared.segmentTable.segmentLayout.segmentCount);
    this.setNeedsRedraw('Arrow path segment table updated');
  }

  override draw(renderPass: RenderPass): boolean {
    const arrowBatches = this.arrowGPUTable?.batches || [];
    if (arrowBatches.length > 0 && arrowBatches.length !== this.renderBatches.length) {
      throw new Error('ArrowPathModel draw batches must align with generated path render batches');
    }

    let drawSuccess = true;
    try {
      for (const [batchIndex, renderBatch] of this.renderBatches.entries()) {
        const arrowBatch = arrowBatches[batchIndex];
        this.setAttributes({
          ...(arrowBatch?.attributes || {}),
          ...getArrowPathModelBatchAttributes(this.pathShaderLayout, renderBatch)
        });
        this.setInstanceCount(renderBatch.segmentCount);
        drawSuccess = super.draw(renderPass) && drawSuccess;
      }
    } finally {
      this.setAttributes({
        ...(this.arrowGPUTable?.attributes || {}),
        ...getArrowPathModelAttributes(this.pathShaderLayout, {
          expandedPathVertexData: this.expandedPathVertexData,
          pathViewOriginData: this.pathViewOriginData
        })
      });
      this.setInstanceCount(this.segmentLayout.segmentCount);
    }

    return drawSuccess;
  }

  override destroy(): void {
    super.destroy();
  }
}

/** Expand path rows into per-segment Arrow rows without creating a GPU Model. */
export function buildArrowPathSegmentTable(props: {
  rowTable: arrow.Table;
  paths: arrow.Vector<ArrowPathCoordinateType>;
  viewOrigins?: arrow.Vector<ArrowPathViewOriginType>;
  rowIndexBase?: number;
}): ArrowPathSegmentTable {
  if (props.rowTable.schema.fields.length > 0 && props.rowTable.numRows !== props.paths.length) {
    throw new Error('ArrowPathModel requires rowTable rows to match path rows');
  }
  assertArrowPathColumnAvailable(props.rowTable, SEGMENT_START_POSITIONS_COLUMN);
  assertArrowPathColumnAvailable(props.rowTable, SEGMENT_END_POSITIONS_COLUMN);
  assertArrowPathColumnAvailable(props.rowTable, SEGMENT_PREVIOUS_POSITIONS_COLUMN);
  assertArrowPathColumnAvailable(props.rowTable, SEGMENT_NEXT_POSITIONS_COLUMN);
  assertArrowPathColumnAvailable(props.rowTable, SEGMENT_FLAGS_COLUMN);
  assertArrowPathColumnAvailable(props.rowTable, ROW_INDICES_COLUMN);
  assertArrowPathColumnAvailable(props.rowTable, PATH_VIEW_ORIGINS_COLUMN);

  const segmentAttributeBuildStartTime = getNow();
  const segmentLayout = buildArrowPathSegmentLayout(props.paths, props.viewOrigins);
  const segmentRowIndices = makeArrowPathRowIndices(segmentLayout.startIndices, props.rowIndexBase);
  const localSegmentRowIndices = makeArrowPathRowIndices(segmentLayout.startIndices);
  const fields: arrow.Field[] = [];
  const columns: Record<string, arrow.Vector> = {};

  for (const field of props.rowTable.schema.fields) {
    const vector = props.rowTable.getChild(field.name);
    if (!vector || !isInstanceArrowType(vector.type)) {
      continue;
    }
    fields.push(field);
    columns[field.name] = expandArrowVector(vector as arrow.Vector<any>, localSegmentRowIndices);
  }

  fields.push(makeFixedSizeListFloatField(SEGMENT_START_POSITIONS_COLUMN, 4));
  fields.push(makeFixedSizeListFloatField(SEGMENT_END_POSITIONS_COLUMN, 4));
  fields.push(makeFixedSizeListFloatField(SEGMENT_PREVIOUS_POSITIONS_COLUMN, 4));
  fields.push(makeFixedSizeListFloatField(SEGMENT_NEXT_POSITIONS_COLUMN, 4));
  fields.push(new arrow.Field(SEGMENT_FLAGS_COLUMN, new arrow.Uint32(), false));
  fields.push(new arrow.Field(ROW_INDICES_COLUMN, new arrow.Uint32(), false));
  columns[SEGMENT_START_POSITIONS_COLUMN] = makeArrowFixedSizeListVector(
    new arrow.Float32(),
    4,
    segmentLayout.segmentStartPositions
  );
  columns[SEGMENT_END_POSITIONS_COLUMN] = makeArrowFixedSizeListVector(
    new arrow.Float32(),
    4,
    segmentLayout.segmentEndPositions
  );
  columns[SEGMENT_PREVIOUS_POSITIONS_COLUMN] = makeArrowFixedSizeListVector(
    new arrow.Float32(),
    4,
    segmentLayout.segmentPreviousPositions
  );
  columns[SEGMENT_NEXT_POSITIONS_COLUMN] = makeArrowFixedSizeListVector(
    new arrow.Float32(),
    4,
    segmentLayout.segmentNextPositions
  );
  columns[SEGMENT_FLAGS_COLUMN] = makeNumericArrowVector(
    new arrow.Uint32(),
    segmentLayout.segmentFlags
  );
  columns[ROW_INDICES_COLUMN] = makeNumericArrowVector(new arrow.Uint32(), segmentRowIndices);

  const segmentAttributeBuildTimeMs = getNow() - segmentAttributeBuildStartTime;
  const attributeByteLength = getGeneratedAttributeByteLength(columns);

  return {
    table: new arrow.Table(new arrow.Schema(fields, props.rowTable.schema.metadata), columns),
    segmentLayout,
    segmentAttributeBuildTimeMs,
    attributeByteLength
  };
}

export function createArrowPathPreparedState(
  device: Device,
  props: {
    id?: string;
    rowTable: arrow.Table;
    paths: arrow.Vector<ArrowPathCoordinateType>;
    viewOrigins?: arrow.Vector<ArrowPathViewOriginType>;
  }
): ArrowPathPreparedState {
  const segmentTable = buildArrowPathSegmentTable({
    rowTable: props.rowTable,
    paths: props.paths,
    viewOrigins: props.viewOrigins
  });
  const generatedBufferBatches = planGeneratedBufferBatches({
    device,
    recordOffsets: segmentTable.segmentLayout.startIndices,
    recordByteStride: EXPANDED_PATH_VERTEX_BYTE_STRIDE,
    resourceLabel: 'ArrowPathModel expanded path vertex data'
  });
  const expandedPathVertexStates = generatedBufferBatches.map(generatedBufferBatch =>
    createExpandedPathVertexData(
      device,
      {id: props.id},
      {
        segmentTable,
        generatedBufferBatch
      }
    )
  );
  const pathViewOriginStates = generatedBufferBatches.map(generatedBufferBatch =>
    createPathViewOriginData(device, {id: props.id}, segmentTable, generatedBufferBatch)
  );
  const firstExpandedPathVertexState = expandedPathVertexStates[0];
  const firstPathViewOriginState = pathViewOriginStates[0];
  if (!firstExpandedPathVertexState || !firstPathViewOriginState) {
    throw new Error('ArrowPathModel requires at least one generated path render batch');
  }
  const renderBatches = generatedBufferBatches.map((generatedBufferBatch, batchIndex) => ({
    rowStart: generatedBufferBatch.rowStart,
    rowEnd: generatedBufferBatch.rowEnd,
    segmentCount: generatedBufferBatch.recordCount,
    expandedPathVertexData: expandedPathVertexStates[batchIndex]!.buffer,
    pathViewOriginData: pathViewOriginStates[batchIndex]!.buffer
  }));
  let destroyed = false;

  return {
    segmentTable,
    expandedPathVertexData: firstExpandedPathVertexState.buffer,
    pathViewOriginData: firstPathViewOriginState.buffer,
    renderBatches,
    generatedBufferBatches,
    destroy: () => {
      if (destroyed) {
        return;
      }
      destroyed = true;
      destroyArrowPathRenderBatches(renderBatches);
    }
  };
}

export async function prepareArrowPathGPUVectors(
  device: Device,
  sourceVectors: ArrowPathSourceVectors,
  options: PrepareArrowPathGPUVectorsOptions = {}
): Promise<PreparedArrowPathGPUVectors> {
  assertArrowPathSourceVectorTypes(sourceVectors);
  assertArrowPathSourceVectorRows(sourceVectors);

  const id = options.id || 'arrow-path-model';
  const preparedCoordinateData = prepareArrowPathCoordinateData(sourceVectors.paths);
  const sourceOriginValues = preparedCoordinateData.sourceOrigins;
  let paths = makeArrowGPUVector(device, preparedCoordinateData.paths, {
    name: 'paths',
    id: `${id}-paths`
  });
  let pathsForSegmentTable = preparedCoordinateData.paths;

  if (sourceVectors.closed) {
    const normalizedPaths = await closeArrowPaths(device, {
      paths,
      closed: sourceVectors.closed,
      epsilon: options.closeEpsilon ?? 0,
      id: `${id}-closed`
    });
    paths.destroy();
    paths = normalizedPaths;
    pathsForSegmentTable = await readArrowGPUVectorAsync(paths);
  }

  const colors = sourceVectors.colors
    ? makeArrowGPUVector(device, sourceVectors.colors, {name: 'colors', id: `${id}-colors`})
    : undefined;
  const widths = sourceVectors.widths
    ? makeArrowGPUVector(device, sourceVectors.widths, {name: 'widths', id: `${id}-widths`})
    : undefined;
  const viewOriginValues = new Float32Array(sourceVectors.paths.length * 4);
  const viewOrigins = sourceOriginValues
    ? makeArrowGPUVector(device, makeArrowPathViewOriginVector(viewOriginValues), {
        name: PATH_VIEW_ORIGINS_COLUMN,
        id: `${id}-view-origins`
      })
    : undefined;

  if (sourceOriginValues) {
    updateViewOriginValues(viewOriginValues, sourceOriginValues, IDENTITY_MATRIX4);
    viewOrigins!.buffer.write(viewOriginValues);
  }

  const rowColumns: Record<string, arrow.Vector> = {};
  if (sourceVectors.colors) {
    rowColumns['colors'] = sourceVectors.colors;
  }
  if (sourceVectors.widths) {
    rowColumns['widths'] = sourceVectors.widths;
  }

  const pathState = createArrowPathPreparedState(device, {
    id,
    rowTable: new arrow.Table(rowColumns),
    paths: pathsForSegmentTable,
    viewOrigins: sourceOriginValues ? makeArrowPathViewOriginVector(viewOriginValues) : undefined
  });

  const pathProps: ArrowPathModelProps = {
    id,
    paths,
    ...(colors ? {colors} : {}),
    ...(widths ? {widths} : {}),
    ...(viewOrigins ? {viewOrigins} : {}),
    pathState
  };
  const storagePathProps = {
    paths,
    ...(colors ? {colors} : {}),
    ...(widths ? {widths} : {}),
    ...(viewOrigins ? {viewOrigins} : {})
  };
  let destroyed = false;

  const updateViewOrigins = ({modelViewMatrix}: ArrowPathViewOriginUpdateProps): void => {
    if (!sourceOriginValues || !viewOrigins) {
      return;
    }
    updateViewOriginValues(viewOriginValues, sourceOriginValues, modelViewMatrix);
    viewOrigins.buffer.write(viewOriginValues);
    updateArrowPathPreparedStateViewOrigins(pathState, viewOriginValues);
  };

  return {
    paths,
    ...(colors ? {colors} : {}),
    ...(widths ? {widths} : {}),
    ...(viewOrigins ? {viewOrigins} : {}),
    ...(sourceOriginValues ? {sourceOrigins: sourceOriginValues} : {}),
    pathProps,
    storagePathProps,
    updateViewOrigins,
    destroy: () => {
      if (destroyed) {
        return;
      }
      destroyed = true;
      pathState.destroy();
      paths.destroy();
      colors?.destroy();
      widths?.destroy();
      viewOrigins?.destroy();
    }
  };
}

function prepareArrowPathModel(
  _device: Device,
  props: ArrowPathModelProps
): {
  modelProps: ArrowModelProps;
  segmentTable: ArrowPathSegmentTable;
  expandedPathVertexData: Buffer;
  pathViewOriginData: Buffer;
  renderBatches: ArrowPathRenderBatchState[];
} {
  assertArrowPathVectorTypes(props);
  assertArrowPathVectorRowAlignment(props);
  assertArrowPathPreparedStateAlignment(props);
  const segmentTable = props.pathState.segmentTable;
  const shaderLayout = props.shaderLayout ?? DEFAULT_ARROW_PATH_SHADER_LAYOUT;
  const firstRenderBatch = props.pathState.renderBatches[0];
  if (!firstRenderBatch) {
    throw new Error('ArrowPathModel requires at least one prepared path render batch');
  }

  return {
    modelProps: {
      ...props,
      vs: props.vs ?? DEFAULT_ARROW_PATH_VS,
      fs: props.fs ?? DEFAULT_ARROW_PATH_FS,
      shaderLayout,
      attributes: {
        ...(props.attributes || {}),
        ...getArrowPathModelBatchAttributes(shaderLayout, firstRenderBatch)
      },
      bufferLayout: [...(props.bufferLayout || []), ...createArrowPathBufferLayouts(shaderLayout)],
      topology: props.topology ?? 'line-list',
      vertexCount: props.vertexCount ?? 2,
      instanceCount: segmentTable.segmentLayout.segmentCount,
      arrowTable: createArrowPathRenderTable(
        segmentTable.table,
        props.pathState.generatedBufferBatches
      ),
      arrowCount: 'none'
    },
    segmentTable,
    expandedPathVertexData: firstRenderBatch.expandedPathVertexData,
    pathViewOriginData: firstRenderBatch.pathViewOriginData,
    renderBatches: props.pathState.renderBatches
  };
}

function assertArrowPathVectorTypes(props: ArrowPathModelProps): void {
  assertArrowPathCoordinateType(props.paths.type, 'paths');
  if (
    props.colors &&
    (!arrow.DataType.isFixedSizeList(props.colors.type) ||
      props.colors.type.listSize !== 4 ||
      !(props.colors.type.children[0]?.type instanceof arrow.Uint8))
  ) {
    throw new Error('ArrowPathModel colors must be GPUVector<FixedSizeList<Uint8>[4]>');
  }
  if (props.widths && !(props.widths.type instanceof arrow.Float32)) {
    throw new Error('ArrowPathModel widths must be GPUVector<Float32>');
  }
  if (
    props.viewOrigins &&
    (!arrow.DataType.isFixedSizeList(props.viewOrigins.type) ||
      props.viewOrigins.type.listSize !== 4 ||
      !(props.viewOrigins.type.children[0]?.type instanceof arrow.Float32))
  ) {
    throw new Error('ArrowPathModel viewOrigins must be GPUVector<FixedSizeList<Float32>[4]>');
  }
}

function assertArrowPathSourceVectorTypes(sourceVectors: ArrowPathSourceVectors): void {
  assertArrowPathSourceCoordinateType(sourceVectors.paths.type, 'paths');
  if (
    sourceVectors.colors &&
    (!arrow.DataType.isFixedSizeList(sourceVectors.colors.type) ||
      sourceVectors.colors.type.listSize !== 4 ||
      !(sourceVectors.colors.type.children[0]?.type instanceof arrow.Uint8))
  ) {
    throw new Error('prepareArrowPathGPUVectors colors must be Vector<FixedSizeList<Uint8>[4]>');
  }
  if (sourceVectors.widths && !(sourceVectors.widths.type instanceof arrow.Float32)) {
    throw new Error('prepareArrowPathGPUVectors widths must be Vector<Float32>');
  }
  if (sourceVectors.closed && !(sourceVectors.closed.type instanceof arrow.Bool)) {
    throw new Error('prepareArrowPathGPUVectors closed flags must be Vector<Bool>');
  }
}

function assertArrowPathSourceVectorRows(sourceVectors: ArrowPathSourceVectors): void {
  const rowInputs: Array<[string, arrow.Vector | undefined]> = [
    ['colors', sourceVectors.colors],
    ['widths', sourceVectors.widths],
    ['closed', sourceVectors.closed]
  ];
  for (const [name, vector] of rowInputs) {
    if (vector && vector.length !== sourceVectors.paths.length) {
      throw new Error(
        `prepareArrowPathGPUVectors ${name} rows must match paths rows (${vector.length} !== ${sourceVectors.paths.length})`
      );
    }
  }
}

function assertArrowPathCoordinateType(type: arrow.DataType, name: string): void {
  if (
    !isVariableLengthAttributeArrowType(type) ||
    !arrow.DataType.isFixedSizeList(type.children[0].type) ||
    type.children[0].type.listSize < 2 ||
    type.children[0].type.listSize > 4 ||
    !(type.children[0].type.children[0]?.type instanceof arrow.Float32)
  ) {
    throw new Error(`ArrowPathModel ${name} must be GPUVector<List<FixedSizeList<Float32>[2..4]>>`);
  }
}

function assertArrowPathSourceCoordinateType(type: arrow.DataType, name: string): void {
  const coordinateValueType = getArrowPathCoordinateValueType(type);
  if (
    !isVariableLengthAttributeArrowType(type) ||
    !arrow.DataType.isFixedSizeList(type.children[0].type) ||
    type.children[0].type.listSize < 2 ||
    type.children[0].type.listSize > 4 ||
    (!(coordinateValueType instanceof arrow.Float32) &&
      !(coordinateValueType instanceof arrow.Float64))
  ) {
    throw new Error(
      `prepareArrowPathGPUVectors ${name} must be Vector<List<FixedSizeList<Float32|Float64>[2..4]>>`
    );
  }
}

function getArrowPathCoordinateValueType(type: arrow.DataType): arrow.DataType | undefined {
  const pathElementType = type.children[0]?.type;
  return arrow.DataType.isFixedSizeList(pathElementType)
    ? pathElementType.children[0]?.type
    : undefined;
}

function assertArrowPathVectorRowAlignment(props: ArrowPathModelProps): void {
  const rowInputs = getArrowPathRowInputs(props);
  const [referenceName, referenceVector] = rowInputs[0];
  for (const [name, vector] of rowInputs.slice(1)) {
    if (vector.length !== referenceVector.length) {
      throw new Error(
        `ArrowPathModel ${name} rows must match ${referenceName} rows (${vector.length} !== ${referenceVector.length})`
      );
    }
    if (vector.data.length !== referenceVector.data.length) {
      throw new Error(`ArrowPathModel ${name} batch count must match ${referenceName} batch count`);
    }
    for (let batchIndex = 0; batchIndex < vector.data.length; batchIndex++) {
      if (vector.data[batchIndex].length !== referenceVector.data[batchIndex].length) {
        throw new Error(
          `ArrowPathModel ${name} batch ${batchIndex} rows must match ${referenceName}`
        );
      }
    }
  }
}

function getArrowPathRowInputs(props: ArrowPathModelProps): Array<[string, GPUVector<any>]> {
  return [
    ['paths', props.paths],
    ['colors', props.colors],
    ['widths', props.widths],
    ['viewOrigins', props.viewOrigins]
  ].filter(([, vector]) => vector !== undefined) as Array<[string, GPUVector<any>]>;
}

function assertArrowPathPreparedStateAlignment(props: ArrowPathModelProps): void {
  if (!props.pathState) {
    throw new Error('ArrowPathModel requires pathState prepared by prepareArrowPathGPUVectors()');
  }
  const preparedRowCount = props.pathState.segmentTable.segmentLayout.startIndices.length - 1;
  if (preparedRowCount !== props.paths.length) {
    throw new Error(
      `ArrowPathModel prepared path rows must match path GPU rows (${preparedRowCount} !== ${props.paths.length})`
    );
  }
}

function buildArrowPathSegmentLayout(
  paths: arrow.Vector<ArrowPathCoordinateType>,
  viewOrigins?: arrow.Vector<ArrowPathViewOriginType>
): ArrowPathSegmentLayout {
  assertArrowPathCoordinateType(paths.type, 'paths');
  if (viewOrigins) {
    assertArrowPathViewOriginVector(viewOrigins, paths.length);
  }
  const pathComponentCount = getArrowPathCoordinateComponentCount(paths.type);
  const startIndices: number[] = [0];
  for (const data of paths.data) {
    const valueOffsets = data.valueOffsets as Int32Array | undefined;
    if (!valueOffsets) {
      throw new Error('ArrowPathModel source path chunks require Arrow list offsets');
    }
    for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
      const pathStart = valueOffsets[rowIndex] ?? 0;
      const pathEnd = valueOffsets[rowIndex + 1] ?? pathStart;
      const segmentCount = Math.max(0, pathEnd - pathStart - 1);
      startIndices.push((startIndices[startIndices.length - 1] ?? 0) + segmentCount);
    }
  }

  const segmentCount = startIndices[startIndices.length - 1] ?? 0;
  const segmentStartPositions = new Float32Array(segmentCount * 4);
  const segmentEndPositions = new Float32Array(segmentCount * 4);
  const segmentPreviousPositions = new Float32Array(segmentCount * 4);
  const segmentNextPositions = new Float32Array(segmentCount * 4);
  const segmentViewOrigins = new Float32Array(segmentCount * 4);
  const segmentFlags = new Uint32Array(segmentCount);
  const viewOriginRows = makeArrowPathViewOriginRows(viewOrigins);
  let globalSegmentIndex = 0;
  let globalRowIndex = 0;

  for (const data of paths.data) {
    const valueOffsets = data.valueOffsets as Int32Array | undefined;
    if (!valueOffsets) {
      throw new Error('ArrowPathModel source path chunks require Arrow list offsets');
    }
    const pathValues = getArrowVariableLengthAttributeDataBufferSource(
      data as arrow.Data<ArrowPathCoordinateType>
    ) as Float32Array;
    const firstElementOffset = valueOffsets[0] ?? 0;

    for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
      const pathStart = (valueOffsets[rowIndex] ?? firstElementOffset) - firstElementOffset;
      const pathEnd = (valueOffsets[rowIndex + 1] ?? pathStart) - firstElementOffset;
      const pointCount = Math.max(0, pathEnd - pathStart);
      const rowSegmentCount = Math.max(0, pointCount - 1);
      const closedPath = isClosedArrowPath(pathValues, pathComponentCount, pathStart, pointCount);
      copyArrowPathViewOriginRow(
        segmentViewOrigins,
        startIndices[globalRowIndex] ?? globalSegmentIndex,
        rowSegmentCount,
        viewOriginRows,
        globalRowIndex
      );

      for (let segmentOffset = 0; segmentOffset < rowSegmentCount; segmentOffset++) {
        const segmentStartPointIndex = pathStart + segmentOffset;
        const segmentEndPointIndex = segmentStartPointIndex + 1;
        const previousPointIndex =
          segmentOffset === 0
            ? closedPath
              ? pathEnd - 2
              : segmentStartPointIndex
            : segmentStartPointIndex - 1;
        const nextPointIndex =
          segmentOffset === rowSegmentCount - 1
            ? closedPath
              ? pathStart + 1
              : segmentEndPointIndex
            : segmentEndPointIndex + 1;
        copyArrowPathPoint(
          segmentStartPositions,
          globalSegmentIndex,
          pathValues,
          segmentStartPointIndex,
          pathComponentCount
        );
        copyArrowPathPoint(
          segmentEndPositions,
          globalSegmentIndex,
          pathValues,
          segmentEndPointIndex,
          pathComponentCount
        );
        copyArrowPathPoint(
          segmentPreviousPositions,
          globalSegmentIndex,
          pathValues,
          previousPointIndex,
          pathComponentCount
        );
        copyArrowPathPoint(
          segmentNextPositions,
          globalSegmentIndex,
          pathValues,
          nextPointIndex,
          pathComponentCount
        );

        let pathSegmentFlags = closedPath ? PATH_SEGMENT_CLOSED : 0;
        if (segmentOffset === 0) {
          pathSegmentFlags |= PATH_SEGMENT_FIRST;
        }
        if (segmentOffset === rowSegmentCount - 1) {
          pathSegmentFlags |= PATH_SEGMENT_LAST;
        }
        segmentFlags[globalSegmentIndex] = pathSegmentFlags;
        globalSegmentIndex++;
      }
      globalRowIndex++;
    }
  }

  return {
    startIndices,
    segmentCount,
    segmentStartPositions,
    segmentEndPositions,
    segmentPreviousPositions,
    segmentNextPositions,
    segmentViewOrigins,
    segmentFlags
  };
}

function assertArrowPathViewOriginVector(
  viewOrigins: arrow.Vector<ArrowPathViewOriginType>,
  rowCount: number
): void {
  if (
    !arrow.DataType.isFixedSizeList(viewOrigins.type) ||
    viewOrigins.type.listSize !== 4 ||
    !(viewOrigins.type.children[0]?.type instanceof arrow.Float32)
  ) {
    throw new Error('ArrowPathModel view origins must be Vector<FixedSizeList<Float32>[4]>');
  }
  if (viewOrigins.length !== rowCount) {
    throw new Error(
      `ArrowPathModel view origin rows must match path rows (${viewOrigins.length} !== ${rowCount})`
    );
  }
}

function getArrowPathCoordinateComponentCount(type: arrow.DataType): number {
  const pathElementType = type.children[0]?.type;
  if (!pathElementType || !arrow.DataType.isFixedSizeList(pathElementType)) {
    throw new Error('ArrowPathModel paths require FixedSizeList coordinate elements');
  }
  return pathElementType.listSize;
}

function prepareArrowPathCoordinateData(paths: arrow.Vector<ArrowPathSourceCoordinateType>): {
  paths: arrow.Vector<ArrowPathCoordinateType>;
  sourceOrigins?: Float64Array;
} {
  const coordinateValueType = getArrowPathCoordinateValueType(paths.type);
  if (coordinateValueType instanceof arrow.Float32) {
    return {paths: paths as arrow.Vector<ArrowPathCoordinateType>};
  }
  if (!(coordinateValueType instanceof arrow.Float64)) {
    throw new Error('prepareArrowPathGPUVectors paths must contain Float32 or Float64 coordinates');
  }

  const componentCount = getArrowPathCoordinateComponentCount(paths.type);
  const pathType = makeArrowPathCoordinateType(componentCount);
  const sourceOrigins = new Float64Array(paths.length * 4);
  const outputData: arrow.Data<ArrowPathCoordinateType>[] = [];
  let rowIndexBase = 0;

  for (const data of paths.data) {
    const valueOffsets = data.valueOffsets as Int32Array | undefined;
    if (!valueOffsets) {
      throw new Error('prepareArrowPathGPUVectors Float64 paths require Arrow list offsets');
    }
    const pathValues = getArrowVariableLengthAttributeDataBufferSource(
      data as arrow.Data<ArrowPathFloat64CoordinateType>
    ) as Float64Array;
    const firstElementOffset = valueOffsets[0] ?? 0;
    const normalizedValueOffsets = new Int32Array(valueOffsets.length);
    const outputValues = new Float32Array(pathValues.length);

    for (let offsetIndex = 0; offsetIndex < valueOffsets.length; offsetIndex++) {
      normalizedValueOffsets[offsetIndex] =
        (valueOffsets[offsetIndex] ?? firstElementOffset) - firstElementOffset;
    }

    for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
      const globalRowIndex = rowIndexBase + rowIndex;
      const pathStart = (valueOffsets[rowIndex] ?? firstElementOffset) - firstElementOffset;
      const pathEnd = (valueOffsets[rowIndex + 1] ?? firstElementOffset) - firstElementOffset;
      const pointCount = Math.max(0, pathEnd - pathStart);
      let originX = 0;
      let originY = 0;
      let originZ = 0;
      let originW = 0;
      if (pointCount > 0) {
        const originOffset = pathStart * componentCount;
        originX = pathValues[originOffset] ?? 0;
        originY = pathValues[originOffset + 1] ?? 0;
        if (componentCount > 2) {
          originZ = pathValues[originOffset + 2] ?? 0;
        }
        if (componentCount > 3) {
          originW = pathValues[originOffset + 3] ?? 0;
        }
      }
      const sourceOriginOffset = globalRowIndex * 4;
      sourceOrigins[sourceOriginOffset] = originX;
      sourceOrigins[sourceOriginOffset + 1] = originY;
      sourceOrigins[sourceOriginOffset + 2] = originZ;
      sourceOrigins[sourceOriginOffset + 3] = originW;
      for (let pointIndex = pathStart; pointIndex < pathEnd; pointIndex++) {
        const valueOffset = pointIndex * componentCount;
        outputValues[valueOffset] = (pathValues[valueOffset] ?? 0) - originX;
        outputValues[valueOffset + 1] = (pathValues[valueOffset + 1] ?? 0) - originY;
        if (componentCount > 2) {
          outputValues[valueOffset + 2] = (pathValues[valueOffset + 2] ?? 0) - originZ;
        }
        if (componentCount > 3) {
          outputValues[valueOffset + 3] = (pathValues[valueOffset + 3] ?? 0) - originW;
        }
      }
    }

    outputData.push(makeArrowPathData(pathType, normalizedValueOffsets, outputValues));
    rowIndexBase += data.length;
  }

  return {paths: new arrow.Vector<ArrowPathCoordinateType>(outputData), sourceOrigins};
}

function makeArrowPathCoordinateType(componentCount: number): ArrowPathCoordinateType {
  const coordinateType = new arrow.FixedSizeList(
    componentCount,
    new arrow.Field('values', new arrow.Float32(), false)
  );
  return new arrow.List(
    new arrow.Field('coordinates', coordinateType, false)
  ) as ArrowPathCoordinateType;
}

function makeArrowPathData(
  type: ArrowPathCoordinateType,
  valueOffsets: Int32Array,
  values: Float32Array
): arrow.Data<ArrowPathCoordinateType> {
  const coordinateType = type.children[0].type as arrow.FixedSizeList<arrow.Float32>;
  const coordinateValueData = new arrow.Data<arrow.Float32>(
    new arrow.Float32(),
    0,
    values.length,
    0,
    {[arrow.BufferType.DATA]: values}
  );
  const coordinateData = new arrow.Data<arrow.FixedSizeList<arrow.Float32>>(
    coordinateType,
    0,
    coordinateType.listSize === 0 ? 0 : values.length / coordinateType.listSize,
    0,
    {},
    [coordinateValueData]
  );
  return new arrow.Data<ArrowPathCoordinateType>(
    type,
    0,
    valueOffsets.length - 1,
    0,
    {[arrow.BufferType.OFFSET]: valueOffsets},
    [coordinateData]
  );
}

export function makeArrowPathViewOriginVector(
  values: Float32Array
): arrow.Vector<ArrowPathViewOriginType> {
  return makeArrowFixedSizeListVector(new arrow.Float32(), 4, values);
}

export function updateViewOriginValues(
  target: Float32Array,
  sourceOrigins: Float64Array,
  modelViewMatrix: readonly number[]
): void {
  if (modelViewMatrix.length < 16) {
    throw new Error('prepareArrowPathGPUVectors updateViewOrigins requires a 4x4 modelViewMatrix');
  }
  for (let rowIndex = 0; rowIndex < sourceOrigins.length / 4; rowIndex++) {
    const originOffset = rowIndex * 4;
    const x = sourceOrigins[originOffset] ?? 0;
    const y = sourceOrigins[originOffset + 1] ?? 0;
    const z = sourceOrigins[originOffset + 2] ?? 0;
    target[originOffset] =
      (modelViewMatrix[0] ?? 0) * x +
      (modelViewMatrix[4] ?? 0) * y +
      (modelViewMatrix[8] ?? 0) * z +
      (modelViewMatrix[12] ?? 0);
    target[originOffset + 1] =
      (modelViewMatrix[1] ?? 0) * x +
      (modelViewMatrix[5] ?? 0) * y +
      (modelViewMatrix[9] ?? 0) * z +
      (modelViewMatrix[13] ?? 0);
    target[originOffset + 2] =
      (modelViewMatrix[2] ?? 0) * x +
      (modelViewMatrix[6] ?? 0) * y +
      (modelViewMatrix[10] ?? 0) * z +
      (modelViewMatrix[14] ?? 0);
    target[originOffset + 3] = sourceOrigins[originOffset + 3] ?? 0;
  }
}

function updateArrowPathPreparedStateViewOrigins(
  pathState: ArrowPathPreparedState,
  viewOriginValues: Float32Array
): void {
  const {segmentLayout} = pathState.segmentTable;
  for (let rowIndex = 0; rowIndex < segmentLayout.startIndices.length - 1; rowIndex++) {
    const segmentStart = segmentLayout.startIndices[rowIndex] ?? 0;
    const segmentEnd = segmentLayout.startIndices[rowIndex + 1] ?? segmentStart;
    const viewOriginOffset = rowIndex * 4;
    for (let segmentIndex = segmentStart; segmentIndex < segmentEnd; segmentIndex++) {
      segmentLayout.segmentViewOrigins.set(
        viewOriginValues.subarray(viewOriginOffset, viewOriginOffset + 4),
        segmentIndex * 4
      );
    }
  }

  for (const [batchIndex, generatedBufferBatch] of pathState.generatedBufferBatches.entries()) {
    const renderBatch = pathState.renderBatches[batchIndex];
    if (!renderBatch) {
      continue;
    }
    const values = new Float32Array(Math.max(generatedBufferBatch.recordCount * 4, 4));
    values.set(
      segmentLayout.segmentViewOrigins.subarray(
        generatedBufferBatch.recordStart * 4,
        generatedBufferBatch.recordEnd * 4
      )
    );
    renderBatch.pathViewOriginData.write(values);
  }
}

function isClosedArrowPath(
  values: Float32Array,
  componentCount: number,
  pointStart: number,
  pointCount: number
): boolean {
  if (pointCount < 3) {
    return false;
  }
  const firstPointOffset = pointStart * componentCount;
  const lastPointOffset = (pointStart + pointCount - 1) * componentCount;
  for (let componentIndex = 0; componentIndex < componentCount; componentIndex++) {
    if (values[firstPointOffset + componentIndex] !== values[lastPointOffset + componentIndex]) {
      return false;
    }
  }
  return true;
}

function makeArrowPathViewOriginRows(
  viewOrigins: arrow.Vector<ArrowPathViewOriginType> | undefined
): ArrowPathViewOriginRows | undefined {
  if (!viewOrigins) {
    return undefined;
  }
  const chunks: ArrowPathViewOriginChunk[] = [];
  let rowStart = 0;
  for (const data of viewOrigins.data) {
    const rowEnd = rowStart + data.length;
    chunks.push({
      rowStart,
      rowEnd,
      values: getArrowDataBufferSource(data as arrow.Data<ArrowPathViewOriginType>) as Float32Array
    });
    rowStart = rowEnd;
  }
  return {chunks, currentChunkIndex: 0};
}

function copyArrowPathViewOriginRow(
  target: Float32Array,
  targetSegmentStart: number,
  segmentCount: number,
  viewOriginRows: ArrowPathViewOriginRows | undefined,
  rowIndex: number
): void {
  if (!viewOriginRows || segmentCount === 0) {
    return;
  }
  const viewOriginChunk = getArrowPathViewOriginChunk(viewOriginRows, rowIndex);
  const sourceOffset = (rowIndex - viewOriginChunk.rowStart) * 4;
  const values = viewOriginChunk.values;
  const originX = values[sourceOffset] ?? 0;
  const originY = values[sourceOffset + 1] ?? 0;
  const originZ = values[sourceOffset + 2] ?? 0;
  const originW = values[sourceOffset + 3] ?? 0;
  for (let segmentOffset = 0; segmentOffset < segmentCount; segmentOffset++) {
    const targetOffset = (targetSegmentStart + segmentOffset) * 4;
    target[targetOffset] = originX;
    target[targetOffset + 1] = originY;
    target[targetOffset + 2] = originZ;
    target[targetOffset + 3] = originW;
  }
}

function getArrowPathViewOriginChunk(
  viewOriginRows: ArrowPathViewOriginRows,
  rowIndex: number
): ArrowPathViewOriginChunk {
  let chunk = viewOriginRows.chunks[viewOriginRows.currentChunkIndex];
  while (chunk && rowIndex >= chunk.rowEnd) {
    viewOriginRows.currentChunkIndex++;
    chunk = viewOriginRows.chunks[viewOriginRows.currentChunkIndex];
  }
  if (chunk && rowIndex >= chunk.rowStart && rowIndex < chunk.rowEnd) {
    return chunk;
  }
  throw new Error(`ArrowPathModel view origin row ${rowIndex} is missing`);
}

function copyArrowPathPoint(
  target: Float32Array,
  targetSegmentIndex: number,
  source: Float32Array,
  sourcePointIndex: number,
  componentCount: number
): void {
  const targetOffset = targetSegmentIndex * 4;
  const sourceOffset = sourcePointIndex * componentCount;
  for (let componentIndex = 0; componentIndex < componentCount; componentIndex++) {
    target[targetOffset + componentIndex] = source[sourceOffset + componentIndex] ?? 0;
  }
}

function createArrowPathRenderTable(
  segmentTable: arrow.Table,
  generatedBufferBatches?: GeneratedBufferBatch[]
): arrow.Table {
  const generatedColumnNames = new Set([
    SEGMENT_START_POSITIONS_COLUMN,
    SEGMENT_END_POSITIONS_COLUMN,
    SEGMENT_PREVIOUS_POSITIONS_COLUMN,
    SEGMENT_NEXT_POSITIONS_COLUMN,
    SEGMENT_FLAGS_COLUMN,
    ROW_INDICES_COLUMN
  ]);
  const fields: arrow.Field[] = [];
  const columns: Record<string, arrow.Vector> = {};

  for (const field of segmentTable.schema.fields) {
    if (generatedColumnNames.has(field.name)) {
      continue;
    }
    const vector = segmentTable.getChild(field.name);
    if (!vector) {
      continue;
    }
    fields.push(field);
    columns[field.name] = vector;
  }

  const renderTable = new arrow.Table(
    new arrow.Schema(fields, new Map(segmentTable.schema.metadata)),
    columns
  );
  if (!generatedBufferBatches || generatedBufferBatches.length <= 1 || fields.length === 0) {
    return renderTable;
  }
  const recordBatches = generatedBufferBatches.flatMap(
    batch => renderTable.slice(batch.recordStart, batch.recordEnd).batches
  );
  return new arrow.Table(renderTable.schema, recordBatches);
}

function createExpandedPathVertexData(
  device: Device,
  props: {id?: string},
  {
    segmentTable,
    generatedBufferBatch
  }: {
    segmentTable: ArrowPathSegmentTable;
    generatedBufferBatch: GeneratedBufferBatch;
  }
): {buffer: Buffer; byteLength: number} {
  const {segmentLayout} = segmentTable;
  const byteLength = generatedBufferBatch.byteLength;
  const arrayBuffer = new ArrayBuffer(Math.max(byteLength, EXPANDED_PATH_VERTEX_BYTE_STRIDE));
  const float32Values = new Float32Array(arrayBuffer);
  const uint32Values = new Uint32Array(arrayBuffer);
  const rowIndices = makeArrowPathRowIndices(segmentLayout.startIndices);

  for (
    let segmentIndex = generatedBufferBatch.recordStart;
    segmentIndex < generatedBufferBatch.recordEnd;
    segmentIndex++
  ) {
    const batchSegmentIndex = segmentIndex - generatedBufferBatch.recordStart;
    const recordFloat32Index =
      (batchSegmentIndex * EXPANDED_PATH_VERTEX_BYTE_STRIDE) / Float32Array.BYTES_PER_ELEMENT;
    const recordUint32Index =
      (batchSegmentIndex * EXPANDED_PATH_VERTEX_BYTE_STRIDE) / Uint32Array.BYTES_PER_ELEMENT;
    const segmentPositionOffset = segmentIndex * 4;

    float32Values.set(
      segmentLayout.segmentStartPositions.subarray(
        segmentPositionOffset,
        segmentPositionOffset + 4
      ),
      recordFloat32Index
    );
    float32Values.set(
      segmentLayout.segmentEndPositions.subarray(segmentPositionOffset, segmentPositionOffset + 4),
      recordFloat32Index + 4
    );
    float32Values.set(
      segmentLayout.segmentPreviousPositions.subarray(
        segmentPositionOffset,
        segmentPositionOffset + 4
      ),
      recordFloat32Index + 8
    );
    float32Values.set(
      segmentLayout.segmentNextPositions.subarray(segmentPositionOffset, segmentPositionOffset + 4),
      recordFloat32Index + 12
    );
    uint32Values[recordUint32Index + 16] = segmentLayout.segmentFlags[segmentIndex];
    uint32Values[recordUint32Index + 17] = rowIndices[segmentIndex];
  }

  return {
    buffer: device.createBuffer({
      id:
        `${props.id || 'arrow-path-model'}-expanded-path-vertex-data-` +
        `${generatedBufferBatch.rowStart}`,
      usage: Buffer.VERTEX | Buffer.COPY_DST | Buffer.COPY_SRC,
      data: new Uint8Array(arrayBuffer, 0, Math.max(byteLength, EXPANDED_PATH_VERTEX_BYTE_STRIDE))
    }),
    byteLength
  };
}

function createPathViewOriginData(
  device: Device,
  props: {id?: string},
  segmentTable: ArrowPathSegmentTable,
  generatedBufferBatch: GeneratedBufferBatch
): {buffer: Buffer; byteLength: number} {
  const byteStride = Float32Array.BYTES_PER_ELEMENT * 4;
  const byteLength = generatedBufferBatch.recordCount * byteStride;
  const values = new Float32Array(Math.max(generatedBufferBatch.recordCount * 4, 4));
  const sourceStart = generatedBufferBatch.recordStart * 4;
  const sourceEnd = generatedBufferBatch.recordEnd * 4;
  values.set(segmentTable.segmentLayout.segmentViewOrigins.subarray(sourceStart, sourceEnd));

  return {
    buffer: device.createBuffer({
      id:
        `${props.id || 'arrow-path-model'}-path-view-origin-data-` +
        `${generatedBufferBatch.rowStart}`,
      usage: Buffer.VERTEX | Buffer.COPY_DST | Buffer.COPY_SRC,
      data: values
    }),
    byteLength
  };
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

function getArrowPathModelAttributes(
  shaderLayout: ShaderLayout,
  state: Pick<ArrowPathPreparedState, 'expandedPathVertexData' | 'pathViewOriginData'>
): Record<string, Buffer> {
  const shaderAttributeNames = new Set(shaderLayout.attributes.map(attribute => attribute.name));
  return {
    [EXPANDED_PATH_VERTEX_DATA]: state.expandedPathVertexData,
    ...(shaderAttributeNames.has(PATH_VIEW_ORIGINS_COLUMN)
      ? {[PATH_VIEW_ORIGIN_DATA]: state.pathViewOriginData}
      : {})
  };
}

function getArrowPathModelBatchAttributes(
  shaderLayout: ShaderLayout,
  renderBatch: ArrowPathRenderBatchState
): Record<string, Buffer> {
  return getArrowPathModelAttributes(shaderLayout, renderBatch);
}

function makeArrowPathRowIndices(startIndices: number[], rowIndexBase: number = 0): Uint32Array {
  const segmentCount = startIndices[startIndices.length - 1] ?? 0;
  const rowIndices = new Uint32Array(segmentCount);
  for (let rowIndex = 0; rowIndex < startIndices.length - 1; rowIndex++) {
    rowIndices.fill(rowIndexBase + rowIndex, startIndices[rowIndex], startIndices[rowIndex + 1]);
  }
  return rowIndices;
}

function assertArrowPathColumnAvailable(table: arrow.Table, columnName: string): void {
  if (table.getChild(columnName)) {
    throw new Error(`ArrowPathModel rowTable column "${columnName}" is reserved`);
  }
}

function makeFixedSizeListFloatField(name: string, listSize: 4): arrow.Field {
  return new arrow.Field(
    name,
    new arrow.FixedSizeList(listSize, new arrow.Field('value', new arrow.Float32(), false)),
    false
  );
}

function makeNumericArrowVector<TypeT extends NumericArrowType>(
  type: TypeT,
  data: TypeT['TArray']
): arrow.Vector<TypeT> {
  const makeNumericData = arrow.makeData as <NumericTypeT extends NumericArrowType>(props: {
    type: NumericTypeT;
    length: number;
    data: NumericTypeT['TArray'];
  }) => arrow.Data<NumericTypeT>;
  return arrow.makeVector(
    makeNumericData({
      type,
      length: data.length,
      data
    })
  );
}

function getGeneratedAttributeByteLength(columns: Record<string, arrow.Vector>): number {
  let attributeByteLength = 0;
  for (const vector of Object.values(columns)) {
    if (!isInstanceArrowType(vector.type)) {
      continue;
    }
    attributeByteLength += getArrowVectorBufferSource(vector as arrow.Vector<any>).byteLength;
  }
  return attributeByteLength;
}

function destroyArrowPathRenderBatches(renderBatches: ArrowPathRenderBatchState[]): void {
  const buffers = new Set(
    renderBatches.flatMap(renderBatch => [
      renderBatch.expandedPathVertexData,
      renderBatch.pathViewOriginData
    ])
  );
  for (const buffer of buffers) {
    buffer.destroy();
  }
}

function getNow(): number {
  return typeof performance === 'undefined' ? Date.now() : performance.now();
}
