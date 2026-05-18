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
import * as arrow from 'apache-arrow';
import {ArrowModel, type ArrowModelProps} from './arrow-model';
import {GPUVector} from './arrow-gpu-vector';
import {expandArrowVector} from './arrow-vector-utils';
import {
  getArrowVariableLengthAttributeDataBufferSource,
  getArrowVectorBufferSource
} from './arrow-gpu-data';
import {makeArrowFixedSizeListVector} from './arrow-fixed-size-list';
import {planGeneratedBufferBatches, type GeneratedBufferBatch} from './generated-buffer-batches';
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

type ArrowPathCoordinateType = arrow.List<arrow.FixedSizeList<arrow.Float32>>;
type ArrowPathColorType = arrow.FixedSizeList<arrow.Uint8>;

const DEFAULT_ARROW_PATH_SHADER_LAYOUT: ShaderLayout = {
  attributes: [
    {name: SEGMENT_START_POSITIONS_COLUMN, location: 0, type: 'vec4<f32>', stepMode: 'instance'},
    {name: SEGMENT_END_POSITIONS_COLUMN, location: 1, type: 'vec4<f32>', stepMode: 'instance'}
  ],
  bindings: []
};

const DEFAULT_ARROW_PATH_VS = `#version 300 es
precision highp float;

in vec4 segmentStartPositions;
in vec4 segmentEndPositions;

void main() {
  vec4 pathPosition = gl_VertexID % 2 == 0 ? segmentStartPositions : segmentEndPositions;
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
  paths: arrow.Vector<ArrowPathCoordinateType>;
  colors?: arrow.Vector<ArrowPathColorType>;
  widths?: arrow.Vector<arrow.Float32>;
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
  /** CPU Arrow vectors explicitly retained by the caller for segment expansion. */
  sourceVectors: ArrowPathSourceVectors;
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

/** Generated render-batch state owned by {@link ArrowPathModel}. */
export type ArrowPathRenderBatchState = {
  rowStart: number;
  rowEnd: number;
  segmentCount: number;
  expandedPathVertexData: Buffer;
};

type ResolvedArrowPathInputs = {
  rowTable: arrow.Table;
  paths: arrow.Vector<ArrowPathCoordinateType>;
};

/** Arrow-backed path renderer that expands one logical path row into segment instances. */
export class ArrowPathModel extends ArrowModel {
  segmentLayout: ArrowPathSegmentLayout;
  segmentTable: arrow.Table;
  segmentAttributeBuildTimeMs: number;
  segmentAttributeByteLength: number;
  expandedPathVertexData: Buffer;
  renderBatches: ArrowPathRenderBatchState[];
  private pathProps: ArrowPathModelProps;

  constructor(device: Device, props: ArrowPathModelProps) {
    const prepared = prepareArrowPathModel(device, props);
    super(device, prepared.modelProps);
    this.pathProps = props;
    this.segmentLayout = prepared.segmentTable.segmentLayout;
    this.segmentTable = prepared.segmentTable.table;
    this.segmentAttributeBuildTimeMs = prepared.segmentTable.segmentAttributeBuildTimeMs;
    this.segmentAttributeByteLength = prepared.segmentTable.attributeByteLength;
    this.expandedPathVertexData = prepared.expandedPathVertexData;
    this.renderBatches = prepared.renderBatches;
  }

  /** Rebuild generated segment records when path rows or CPU-visible row styles change. */
  override setProps(props: Partial<ArrowPathModelProps>): void {
    const nextProps = {...this.pathProps, ...props};
    const shouldRebuild =
      props.paths !== undefined ||
      props.colors !== undefined ||
      props.widths !== undefined ||
      props.sourceVectors !== undefined;

    this.pathProps = nextProps;
    if (!shouldRebuild) {
      super.setProps({});
      return;
    }

    const prepared = prepareArrowPathModel(this.device, nextProps);
    destroyArrowPathRenderBatches(this.renderBatches);
    this.segmentLayout = prepared.segmentTable.segmentLayout;
    this.segmentTable = prepared.segmentTable.table;
    this.segmentAttributeBuildTimeMs = prepared.segmentTable.segmentAttributeBuildTimeMs;
    this.segmentAttributeByteLength = prepared.segmentTable.attributeByteLength;
    this.expandedPathVertexData = prepared.expandedPathVertexData;
    this.renderBatches = prepared.renderBatches;

    super.setProps({arrowTable: prepared.modelProps.arrowTable as arrow.Table});
    this.setAttributes({[EXPANDED_PATH_VERTEX_DATA]: prepared.expandedPathVertexData});
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
          [EXPANDED_PATH_VERTEX_DATA]: renderBatch.expandedPathVertexData
        });
        this.setInstanceCount(renderBatch.segmentCount);
        drawSuccess = super.draw(renderPass) && drawSuccess;
      }
    } finally {
      this.setAttributes({
        ...(this.arrowGPUTable?.attributes || {}),
        [EXPANDED_PATH_VERTEX_DATA]: this.expandedPathVertexData
      });
      this.setInstanceCount(this.segmentLayout.segmentCount);
    }

    return drawSuccess;
  }

  override destroy(): void {
    destroyArrowPathRenderBatches(this.renderBatches);
    super.destroy();
  }
}

/** Expand path rows into per-segment Arrow rows without creating a GPU Model. */
export function buildArrowPathSegmentTable(props: {
  rowTable: arrow.Table;
  paths: arrow.Vector<ArrowPathCoordinateType>;
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

  const segmentAttributeBuildStartTime = getNow();
  const segmentLayout = buildArrowPathSegmentLayout(props.paths);
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

function prepareArrowPathModel(
  device: Device,
  props: ArrowPathModelProps
): {
  modelProps: ArrowModelProps;
  segmentTable: ArrowPathSegmentTable;
  expandedPathVertexData: Buffer;
  renderBatches: ArrowPathRenderBatchState[];
} {
  const pathInputs = resolveArrowPathInputs(props);
  const segmentTable = buildArrowPathSegmentTable(pathInputs);
  const shaderLayout = props.shaderLayout ?? DEFAULT_ARROW_PATH_SHADER_LAYOUT;
  const generatedBufferBatches = planGeneratedBufferBatches({
    device,
    recordOffsets: segmentTable.segmentLayout.startIndices,
    recordByteStride: EXPANDED_PATH_VERTEX_BYTE_STRIDE,
    resourceLabel: 'ArrowPathModel expanded path vertex data'
  });
  const expandedPathVertexStates = generatedBufferBatches.map(generatedBufferBatch =>
    createExpandedPathVertexData(device, props, {
      segmentTable,
      shaderLayout,
      generatedBufferBatch
    })
  );
  const firstExpandedPathVertexState = expandedPathVertexStates[0];
  if (!firstExpandedPathVertexState) {
    throw new Error('ArrowPathModel requires at least one generated path render batch');
  }
  const renderBatches = generatedBufferBatches.map((generatedBufferBatch, batchIndex) => ({
    rowStart: generatedBufferBatch.rowStart,
    rowEnd: generatedBufferBatch.rowEnd,
    segmentCount: generatedBufferBatch.recordCount,
    expandedPathVertexData: expandedPathVertexStates[batchIndex]!.buffer
  }));

  return {
    modelProps: {
      ...props,
      vs: props.vs ?? DEFAULT_ARROW_PATH_VS,
      fs: props.fs ?? DEFAULT_ARROW_PATH_FS,
      shaderLayout,
      attributes: {
        ...(props.attributes || {}),
        [EXPANDED_PATH_VERTEX_DATA]: firstExpandedPathVertexState.buffer
      },
      bufferLayout: [...(props.bufferLayout || []), firstExpandedPathVertexState.bufferLayout],
      topology: props.topology ?? 'line-list',
      vertexCount: props.vertexCount ?? 2,
      instanceCount: segmentTable.segmentLayout.segmentCount,
      arrowTable: createArrowPathRenderTable(segmentTable.table, generatedBufferBatches),
      arrowCount: 'none'
    },
    segmentTable,
    expandedPathVertexData: firstExpandedPathVertexState.buffer,
    renderBatches
  };
}

function resolveArrowPathInputs(props: ArrowPathModelProps): ResolvedArrowPathInputs {
  if (!props.sourceVectors) {
    throw new Error('ArrowPathModel requires explicit sourceVectors for CPU segment expansion');
  }
  assertArrowPathVectorTypes(props);
  assertArrowPathVectorRowAlignment(props);
  assertArrowPathSourceVectorAlignment(props);
  const columns: Record<string, arrow.Vector> = {};
  if (props.sourceVectors.colors) {
    columns['colors'] = props.sourceVectors.colors;
  }
  if (props.sourceVectors.widths) {
    columns['widths'] = props.sourceVectors.widths;
  }

  return {
    rowTable: new arrow.Table(columns),
    paths: props.sourceVectors.paths
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

function assertArrowPathSourceVectorAlignment(props: ArrowPathModelProps): void {
  const sourceInputs: Array<[string, GPUVector<any> | undefined, arrow.Vector | undefined]> = [
    ['paths', props.paths, props.sourceVectors.paths],
    ['colors', props.colors, props.sourceVectors.colors],
    ['widths', props.widths, props.sourceVectors.widths]
  ];

  for (const [name, gpuVector, sourceVector] of sourceInputs) {
    if (gpuVector && !sourceVector) {
      throw new Error(`ArrowPathModel ${name} GPU rows require matching sourceVectors rows`);
    }
    if (!gpuVector && sourceVector) {
      throw new Error(`ArrowPathModel sourceVectors.${name} requires matching GPU rows`);
    }
    if (!gpuVector || !sourceVector) {
      continue;
    }
    assertSourceVectorMatchesGPUVector(name, gpuVector, sourceVector);
  }
}

function getArrowPathRowInputs(props: ArrowPathModelProps): Array<[string, GPUVector<any>]> {
  return [
    ['paths', props.paths],
    ['colors', props.colors],
    ['widths', props.widths]
  ].filter(([, vector]) => vector !== undefined) as Array<[string, GPUVector<any>]>;
}

function assertSourceVectorMatchesGPUVector(
  vectorName: string,
  gpuVector: GPUVector<any>,
  sourceVector: arrow.Vector
): void {
  if (sourceVector.length !== gpuVector.length) {
    throw new Error(
      `ArrowPathModel sourceVectors.${vectorName} rows must match GPU rows (${sourceVector.length} !== ${gpuVector.length})`
    );
  }
  if (sourceVector.data.length !== gpuVector.data.length) {
    throw new Error(
      `ArrowPathModel sourceVectors.${vectorName} batch count must match GPU batches`
    );
  }
  for (let batchIndex = 0; batchIndex < sourceVector.data.length; batchIndex++) {
    if (sourceVector.data[batchIndex].length !== gpuVector.data[batchIndex].length) {
      throw new Error(
        `ArrowPathModel sourceVectors.${vectorName} batch ${batchIndex} rows must match GPU rows`
      );
    }
  }
}

function buildArrowPathSegmentLayout(
  paths: arrow.Vector<ArrowPathCoordinateType>
): ArrowPathSegmentLayout {
  assertArrowPathCoordinateType(paths.type, 'sourceVectors.paths');
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
  const segmentFlags = new Uint32Array(segmentCount);
  let globalSegmentIndex = 0;

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
    }
  }

  return {
    startIndices,
    segmentCount,
    segmentStartPositions,
    segmentEndPositions,
    segmentPreviousPositions,
    segmentNextPositions,
    segmentFlags
  };
}

function getArrowPathCoordinateComponentCount(type: arrow.DataType): number {
  const pathElementType = type.children[0]?.type;
  if (!pathElementType || !arrow.DataType.isFixedSizeList(pathElementType)) {
    throw new Error('ArrowPathModel paths require FixedSizeList coordinate elements');
  }
  return pathElementType.listSize;
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
  props: ArrowPathModelProps,
  {
    segmentTable,
    shaderLayout,
    generatedBufferBatch
  }: {
    segmentTable: ArrowPathSegmentTable;
    shaderLayout: ShaderLayout;
    generatedBufferBatch: GeneratedBufferBatch;
  }
): {buffer: Buffer; bufferLayout: BufferLayout; byteLength: number} {
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

  const shaderAttributeNames = new Set(shaderLayout.attributes.map(attribute => attribute.name));
  const attributes: NonNullable<BufferLayout['attributes']> = [];
  if (shaderAttributeNames.has(SEGMENT_START_POSITIONS_COLUMN)) {
    attributes.push({
      attribute: SEGMENT_START_POSITIONS_COLUMN,
      format: 'float32x4',
      byteOffset: 0
    });
  }
  if (shaderAttributeNames.has(SEGMENT_END_POSITIONS_COLUMN)) {
    attributes.push({
      attribute: SEGMENT_END_POSITIONS_COLUMN,
      format: 'float32x4',
      byteOffset: SEGMENT_END_POSITIONS_BYTE_OFFSET
    });
  }
  if (shaderAttributeNames.has(SEGMENT_PREVIOUS_POSITIONS_COLUMN)) {
    attributes.push({
      attribute: SEGMENT_PREVIOUS_POSITIONS_COLUMN,
      format: 'float32x4',
      byteOffset: SEGMENT_PREVIOUS_POSITIONS_BYTE_OFFSET
    });
  }
  if (shaderAttributeNames.has(SEGMENT_NEXT_POSITIONS_COLUMN)) {
    attributes.push({
      attribute: SEGMENT_NEXT_POSITIONS_COLUMN,
      format: 'float32x4',
      byteOffset: SEGMENT_NEXT_POSITIONS_BYTE_OFFSET
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
    buffer: device.createBuffer({
      id:
        `${props.id || 'arrow-path-model'}-expanded-path-vertex-data-` +
        `${generatedBufferBatch.rowStart}`,
      usage: Buffer.VERTEX | Buffer.COPY_DST | Buffer.COPY_SRC,
      data: new Uint8Array(arrayBuffer, 0, Math.max(byteLength, EXPANDED_PATH_VERTEX_BYTE_STRIDE))
    }),
    bufferLayout: {
      name: EXPANDED_PATH_VERTEX_DATA,
      byteStride: EXPANDED_PATH_VERTEX_BYTE_STRIDE,
      stepMode: 'instance',
      attributes
    },
    byteLength
  };
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
  const buffers = new Set(renderBatches.map(renderBatch => renderBatch.expandedPathVertexData));
  for (const buffer of buffers) {
    buffer.destroy();
  }
}

function getNow(): number {
  return typeof performance === 'undefined' ? Date.now() : performance.now();
}
