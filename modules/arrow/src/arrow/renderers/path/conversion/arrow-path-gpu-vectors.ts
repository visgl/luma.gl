// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type Device, type ShaderLayout} from '@luma.gl/core';
import {
  planGeneratedBufferBatches,
  type GeneratedBufferBatch,
  type VertexList
} from '@luma.gl/tables';
import {
  Bool,
  BufferType,
  Data,
  DataType,
  Field,
  FixedSizeList,
  Float32,
  Float64,
  List,
  Schema,
  Table,
  Uint32,
  Uint8,
  Vector,
  makeData,
  makeVector
} from 'apache-arrow';
import {
  makeGPUTableFromArrowTable,
  makeGPUVectorFromArrow,
  readArrowGPUVectorAsync
} from '../../../gpu/arrow-gpu-table-adapters';
import {expandArrowVector} from '../../../vectors/arrow-vector-utils';
import {
  getArrowDataBufferSource,
  getArrowVariableLengthAttributeDataBufferSource,
  getArrowVectorBufferSource
} from '../../../gpu/arrow-gpu-data';
import {makeArrowFixedSizeListVector} from '../../../vectors/arrow-fixed-size-list';
import {closeArrowPaths} from '../transforms/close-arrow-paths';
import type {ArrowTemporalColumnType} from '../../../vectors/arrow-temporal-gpu-vector';
import {
  isInstanceArrowType,
  isVariableLengthAttributeArrowType,
  type NumericArrowType
} from '../../../arrow-utils/arrow-types';
import type {ArrowVertexFormatOptions} from '../../../engine/arrow-shader-layout';
import type {
  PathAttributeModelProps,
  PathAttributeModelState,
  PathRenderBatchState,
  PathSegmentLayout
} from '@luma.gl/tables';
import {
  makeArrowPathViewOriginVector,
  type ArrowPathViewOriginType,
  type ArrowPathViewOriginUpdateProps,
  updateViewOriginValues,
  writeArrowPathViewOriginGPUVector
} from '../transforms/path-view-origins';

export type {ArrowPathViewOriginUpdateProps} from '../transforms/path-view-origins';

const SEGMENT_START_POSITIONS_COLUMN = 'segmentStartPositions';
const SEGMENT_END_POSITIONS_COLUMN = 'segmentEndPositions';
const SEGMENT_PREVIOUS_POSITIONS_COLUMN = 'segmentPreviousPositions';
const SEGMENT_NEXT_POSITIONS_COLUMN = 'segmentNextPositions';
const SEGMENT_START_COLORS_COLUMN = 'segmentStartColors';
const SEGMENT_END_COLORS_COLUMN = 'segmentEndColors';
const SEGMENT_FLAGS_COLUMN = 'segmentFlags';
const ROW_INDICES_COLUMN = 'rowIndices';
const PATH_VIEW_ORIGINS_COLUMN = 'pathViewOrigins';

const PATH_SEGMENT_FIRST = 1;
const PATH_SEGMENT_LAST = 2;
const PATH_SEGMENT_CLOSED = 4;

const EXPANDED_PATH_VERTEX_BYTE_STRIDE =
  Float32Array.BYTES_PER_ELEMENT * 16 + Uint32Array.BYTES_PER_ELEMENT * 4;
const IDENTITY_MATRIX4 = Object.freeze([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

type ArrowPathCoordinateType = List<FixedSizeList<Float32>>;
type ArrowPathFloat64CoordinateType = List<FixedSizeList<Float64>>;
type ArrowPathSourceCoordinateType = ArrowPathCoordinateType | ArrowPathFloat64CoordinateType;
type ArrowPathRowColorType = FixedSizeList<Uint8>;
type ArrowPathVertexColorType = List<FixedSizeList<Uint8>>;
type ArrowPathColorType = ArrowPathRowColorType | ArrowPathVertexColorType;
type ArrowPathViewOriginChunk = {
  rowStart: number;
  rowEnd: number;
  values: Float32Array;
};
type ArrowPathViewOriginRows = {
  chunks: ArrowPathViewOriginChunk[];
  currentChunkIndex: number;
};
type ArrowPathColorChunk =
  | {
      kind: 'row';
      rowStart: number;
      rowEnd: number;
      values: Uint8Array;
    }
  | {
      kind: 'vertex';
      rowStart: number;
      rowEnd: number;
      valueOffsets: Int32Array;
      values: Uint8Array;
    };
type ArrowPathColorRows = {
  chunks: ArrowPathColorChunk[];
  currentChunkIndex: number;
};

const DEFAULT_ARROW_PATH_SHADER_LAYOUT: ShaderLayout = {
  attributes: [
    {name: SEGMENT_START_POSITIONS_COLUMN, location: 0, type: 'vec4<f32>', stepMode: 'instance'},
    {name: SEGMENT_END_POSITIONS_COLUMN, location: 1, type: 'vec4<f32>', stepMode: 'instance'},
    {name: SEGMENT_START_COLORS_COLUMN, location: 2, type: 'u32', stepMode: 'instance'},
    {name: SEGMENT_END_COLORS_COLUMN, location: 3, type: 'u32', stepMode: 'instance'},
    {name: PATH_VIEW_ORIGINS_COLUMN, location: 4, type: 'vec4<f32>', stepMode: 'instance'}
  ],
  bindings: []
};

/** CPU Arrow vectors retained explicitly while path rows expand into segment attributes. */
export type ArrowPathSourceVectors = {
  /** Variable-length Float32 or Float64 XY, XYZ, or XYZM coordinates, one Arrow row per path. */
  paths: Vector<ArrowPathSourceCoordinateType>;
  /** Optional packed RGBA8 path colors, either one per path row or one per path vertex. */
  colors?: Vector<ArrowPathColorType>;
  /** Optional per-path widths, one Arrow row per path. */
  widths?: Vector<Float32>;
  /** Optional per-path closed flags used by path normalization. */
  closed?: Vector<Bool>;
  /** Optional per-path temporal stream aligned with path vertices. */
  timestamps?: Vector<ArrowTemporalColumnType>;
};

/** Options used when converting Arrow path source vectors for GPU rendering. */
export type ConvertArrowPathToGPUVectorsOptions = {
  /** Stable resource id prefix. Defaults to `arrow-path-model`. */
  id?: string;
  /** Endpoint epsilon used when appending explicit closing vertices. Defaults to `0`. */
  closeEpsilon?: number;
  /** Global source row index assigned to the first prepared path row. Defaults to `0`. */
  rowIndexBase?: number;
};

/** Flat prepared GPU props accepted before the Arrow renderer creates the attribute model table. */
export type ArrowPathPreparedGPUVectorProps = Omit<PathAttributeModelProps, 'table'> &
  ArrowVertexFormatOptions & {
    /** Prepared path expansion state produced by `convertArrowPathToGPUVectors()`. */
    pathState: ArrowPathPreparedState;
  };

/** Prepared flat props for {@link PathAttributeModel} plus retained update/destruction helpers. */
export type PreparedArrowPathGPUVectors = ArrowPathPreparedGPUVectorProps & {
  /** Optional retained Float64 source origins used to refresh view-space origins. */
  sourceOrigins?: Float64Array;
  /** Refreshes prepared Float32 view origins after a model-view matrix change. */
  updateViewOrigins: (props: ArrowPathViewOriginUpdateProps) => void;
  /** Releases owned prepared vectors and generated path state. */
  destroy: () => void;
};

/** Expanded Arrow table plus generated path layout diagnostics. */
export type ArrowPathSegmentTable = {
  table: Table;
  segmentLayout: PathSegmentLayout;
  segmentAttributeBuildTimeMs: number;
  attributeByteLength: number;
};

/** Generated attribute-path buffers retained independently from model construction. */
export type ArrowPathPreparedState = PathAttributeModelState & {
  /** Expanded Arrow segment table used to build generated buffers. */
  segmentTable: ArrowPathSegmentTable;
  /** Releases owned generated path buffers. */
  destroy: () => void;
};

/** Expand path rows into per-segment Arrow rows without creating a GPU Model. */
export function buildArrowPathSegmentTable(props: {
  /** Source row table whose instance-compatible columns expand with each path segment. */
  rowTable: Table;
  /** Prepared Float32 path coordinates, one Arrow row per path. */
  paths: Vector<ArrowPathCoordinateType>;
  /** Optional Float32 view-space origins aligned with source path rows. */
  viewOrigins?: Vector<ArrowPathViewOriginType>;
  /** Optional global row index base stored in generated segment row indices. */
  rowIndexBase?: number;
}): ArrowPathSegmentTable {
  if (props.rowTable.schema.fields.length > 0 && props.rowTable.numRows !== props.paths.length) {
    throw new Error('PathAttributeModel requires rowTable rows to match path rows');
  }
  assertArrowPathColumnAvailable(props.rowTable, SEGMENT_START_POSITIONS_COLUMN);
  assertArrowPathColumnAvailable(props.rowTable, SEGMENT_END_POSITIONS_COLUMN);
  assertArrowPathColumnAvailable(props.rowTable, SEGMENT_PREVIOUS_POSITIONS_COLUMN);
  assertArrowPathColumnAvailable(props.rowTable, SEGMENT_NEXT_POSITIONS_COLUMN);
  assertArrowPathColumnAvailable(props.rowTable, SEGMENT_START_COLORS_COLUMN);
  assertArrowPathColumnAvailable(props.rowTable, SEGMENT_END_COLORS_COLUMN);
  assertArrowPathColumnAvailable(props.rowTable, SEGMENT_FLAGS_COLUMN);
  assertArrowPathColumnAvailable(props.rowTable, ROW_INDICES_COLUMN);
  assertArrowPathColumnAvailable(props.rowTable, PATH_VIEW_ORIGINS_COLUMN);

  const segmentAttributeBuildStartTime = getNow();
  const pathColors = getArrowPathColorVector(props.rowTable);
  const segmentLayout = buildPathSegmentLayout(props.paths, props.viewOrigins, pathColors);
  const segmentRowIndices = makeArrowPathRowIndices(segmentLayout.startIndices, props.rowIndexBase);
  const localSegmentRowIndices = makeArrowPathRowIndices(segmentLayout.startIndices);
  const fields: Field[] = [];
  const columns: Record<string, Vector> = {};

  for (const field of props.rowTable.schema.fields) {
    const vector = props.rowTable.getChild(field.name);
    if (!vector || !isInstanceArrowType(vector.type)) {
      continue;
    }
    fields.push(field);
    columns[field.name] = expandArrowVector(vector as Vector<any>, localSegmentRowIndices);
  }

  fields.push(makeFixedSizeListFloatField(SEGMENT_START_POSITIONS_COLUMN, 4));
  fields.push(makeFixedSizeListFloatField(SEGMENT_END_POSITIONS_COLUMN, 4));
  fields.push(makeFixedSizeListFloatField(SEGMENT_PREVIOUS_POSITIONS_COLUMN, 4));
  fields.push(makeFixedSizeListFloatField(SEGMENT_NEXT_POSITIONS_COLUMN, 4));
  fields.push(new Field(SEGMENT_FLAGS_COLUMN, new Uint32(), false));
  fields.push(new Field(ROW_INDICES_COLUMN, new Uint32(), false));
  columns[SEGMENT_START_POSITIONS_COLUMN] = makeArrowFixedSizeListVector(
    new Float32(),
    4,
    segmentLayout.segmentStartPositions
  );
  columns[SEGMENT_END_POSITIONS_COLUMN] = makeArrowFixedSizeListVector(
    new Float32(),
    4,
    segmentLayout.segmentEndPositions
  );
  columns[SEGMENT_PREVIOUS_POSITIONS_COLUMN] = makeArrowFixedSizeListVector(
    new Float32(),
    4,
    segmentLayout.segmentPreviousPositions
  );
  columns[SEGMENT_NEXT_POSITIONS_COLUMN] = makeArrowFixedSizeListVector(
    new Float32(),
    4,
    segmentLayout.segmentNextPositions
  );
  columns[SEGMENT_FLAGS_COLUMN] = makeNumericArrowVector(new Uint32(), segmentLayout.segmentFlags);
  columns[ROW_INDICES_COLUMN] = makeNumericArrowVector(new Uint32(), segmentRowIndices);

  const segmentAttributeBuildTimeMs = getNow() - segmentAttributeBuildStartTime;
  const attributeByteLength = getGeneratedAttributeByteLength(columns);

  return {
    table: new Table(new Schema(fields, props.rowTable.schema.metadata), columns),
    segmentLayout,
    segmentAttributeBuildTimeMs,
    attributeByteLength
  };
}

/** Builds generated path segment buffers without constructing an {@link PathAttributeModel}. */
export function createArrowPathPreparedState(
  device: Device,
  props: {
    /** Stable resource id prefix. */
    id?: string;
    /** Source row table whose instance-compatible columns expand with each path segment. */
    rowTable: Table;
    /** Prepared Float32 path coordinates, one Arrow row per path. */
    paths: Vector<ArrowPathCoordinateType>;
    /** Optional Float32 view-space origins aligned with source path rows. */
    viewOrigins?: Vector<ArrowPathViewOriginType>;
    /** Global source row index assigned to the first prepared path row. */
    rowIndexBase?: number;
  }
): ArrowPathPreparedState {
  const segmentTable = buildArrowPathSegmentTable({
    rowTable: props.rowTable,
    paths: props.paths,
    viewOrigins: props.viewOrigins,
    rowIndexBase: props.rowIndexBase
  });
  const generatedBufferBatches = planGeneratedBufferBatches({
    device,
    recordOffsets: segmentTable.segmentLayout.startIndices,
    recordByteStride: EXPANDED_PATH_VERTEX_BYTE_STRIDE,
    resourceLabel: 'PathAttributeModel expanded path vertex data'
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
    throw new Error('PathAttributeModel requires at least one generated path render batch');
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
    segmentLayout: segmentTable.segmentLayout,
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

/** Converts Arrow-prepared path GPU vectors and render state into GPU-only model props. */
export function makePathAttributeModelProps(
  device: Device,
  props: ArrowPathPreparedGPUVectorProps
): PathAttributeModelProps {
  if (!props.pathState) {
    throw new Error(
      'makePathAttributeModelProps requires pathState prepared by convertArrowPathToGPUVectors()'
    );
  }
  const {allowWebGLOnlyFormats, ...modelProps} = props;
  const shaderLayout = props.shaderLayout ?? DEFAULT_ARROW_PATH_SHADER_LAYOUT;
  return {
    ...modelProps,
    shaderLayout,
    ownsTable: true,
    table: makeGPUTableFromArrowTable(
      device,
      createArrowPathRenderTable(
        props.pathState.segmentTable.table,
        props.pathState.generatedBufferBatches
      ),
      {shaderLayout, allowWebGLOnlyFormats}
    )
  };
}

/** Converts raw Arrow path/style columns for attribute-backed path rendering. */
export async function convertArrowPathToGPUVectors(
  device: Device,
  sourceVectors: ArrowPathSourceVectors,
  options: ConvertArrowPathToGPUVectorsOptions = {}
): Promise<PreparedArrowPathGPUVectors> {
  assertArrowPathSourceVectorTypes(sourceVectors);
  assertArrowPathSourceVectorRows(sourceVectors);

  const id = options.id || 'arrow-path-model';
  const preparedCoordinateData = convertArrowPathCoordinateData(sourceVectors.paths);
  const sourceOriginValues = preparedCoordinateData.sourceOrigins;
  const pathChunkRowCounts = preparedCoordinateData.paths.data.map(data => data.length);
  const pathFormat = getArrowPathCoordinateFormat(preparedCoordinateData.paths.type);
  let paths = makeGPUVectorFromArrow(device, preparedCoordinateData.paths, {
    name: 'paths',
    id: `${id}-paths`,
    format: pathFormat
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
    ? makeGPUVectorFromArrow(device, sourceVectors.colors, {
        name: 'colors',
        id: `${id}-colors`,
        format: getArrowPathColorFormat(sourceVectors.colors.type),
        preserveDataChunks: true
      })
    : undefined;
  const widths = sourceVectors.widths
    ? makeGPUVectorFromArrow(device, sourceVectors.widths, {
        name: 'widths',
        id: `${id}-widths`,
        format: 'float32',
        preserveDataChunks: true
      })
    : undefined;
  const viewOriginValues = new Float32Array(sourceVectors.paths.length * 4);
  const viewOriginVector = sourceOriginValues
    ? makeArrowPathViewOriginVector(viewOriginValues, pathChunkRowCounts)
    : undefined;
  const viewOrigins = sourceOriginValues
    ? makeGPUVectorFromArrow(device, viewOriginVector!, {
        name: PATH_VIEW_ORIGINS_COLUMN,
        id: `${id}-view-origins`,
        format: 'float32x4',
        preserveDataChunks: true
      })
    : undefined;

  if (sourceOriginValues) {
    updateViewOriginValues(viewOriginValues, sourceOriginValues, IDENTITY_MATRIX4);
    writeArrowPathViewOriginGPUVector(viewOrigins!, viewOriginValues);
  }

  const rowColumns: Record<string, Vector> = {};
  if (sourceVectors.colors) {
    rowColumns['colors'] = sourceVectors.colors;
  }
  if (sourceVectors.widths) {
    rowColumns['widths'] = sourceVectors.widths;
  }

  const pathState = createArrowPathPreparedState(device, {
    id,
    rowTable: new Table(rowColumns),
    paths: pathsForSegmentTable,
    viewOrigins: viewOriginVector,
    rowIndexBase: options.rowIndexBase
  });

  let destroyed = false;

  const updateViewOrigins = ({modelViewMatrix}: ArrowPathViewOriginUpdateProps): void => {
    if (!sourceOriginValues || !viewOrigins) {
      return;
    }
    updateViewOriginValues(viewOriginValues, sourceOriginValues, modelViewMatrix);
    writeArrowPathViewOriginGPUVector(viewOrigins, viewOriginValues);
    updateArrowPathPreparedStateViewOrigins(pathState, viewOriginValues);
  };

  return {
    id,
    paths,
    ...(colors ? {colors} : {}),
    ...(widths ? {widths} : {}),
    ...(viewOrigins ? {viewOrigins} : {}),
    pathState,
    ...(sourceOriginValues ? {sourceOrigins: sourceOriginValues} : {}),
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

function assertArrowPathSourceVectorTypes(sourceVectors: ArrowPathSourceVectors): void {
  assertArrowPathSourceCoordinateType(sourceVectors.paths.type, 'paths');
  if (sourceVectors.colors && !isArrowPathColorType(sourceVectors.colors.type)) {
    throw new Error(
      'convertArrowPathToGPUVectors colors must be Vector<FixedSizeList<Uint8>[4]> or Vector<List<FixedSizeList<Uint8>[4]>>'
    );
  }
  if (sourceVectors.widths && !(sourceVectors.widths.type instanceof Float32)) {
    throw new Error('convertArrowPathToGPUVectors widths must be Vector<Float32>');
  }
  if (sourceVectors.closed && !(sourceVectors.closed.type instanceof Bool)) {
    throw new Error('convertArrowPathToGPUVectors closed flags must be Vector<Bool>');
  }
}

function assertArrowPathSourceVectorRows(sourceVectors: ArrowPathSourceVectors): void {
  const rowInputs: Array<[string, Vector | undefined]> = [
    ['colors', sourceVectors.colors],
    ['widths', sourceVectors.widths],
    ['closed', sourceVectors.closed],
    ['timestamps', sourceVectors.timestamps]
  ];
  for (const [name, vector] of rowInputs) {
    if (vector && vector.length !== sourceVectors.paths.length) {
      throw new Error(
        `convertArrowPathToGPUVectors ${name} rows must match paths rows (${vector.length} !== ${sourceVectors.paths.length})`
      );
    }
  }
  if (sourceVectors.colors && isArrowPathVertexColorType(sourceVectors.colors.type)) {
    assertArrowPathVertexColorVectorAlignment(
      sourceVectors.paths,
      sourceVectors.colors as Vector<ArrowPathVertexColorType>
    );
  }
}

function assertArrowPathCoordinateType(type: DataType, name: string): void {
  if (
    !isVariableLengthAttributeArrowType(type) ||
    !DataType.isFixedSizeList(type.children[0].type) ||
    type.children[0].type.listSize < 2 ||
    type.children[0].type.listSize > 4 ||
    !(type.children[0].type.children[0]?.type instanceof Float32)
  ) {
    throw new Error(
      `PathAttributeModel ${name} must be GPUVector<List<FixedSizeList<Float32>[2..4]>>`
    );
  }
}

function assertArrowPathSourceCoordinateType(type: DataType, name: string): void {
  const coordinateValueType = getArrowPathCoordinateValueType(type);
  if (
    !isVariableLengthAttributeArrowType(type) ||
    !DataType.isFixedSizeList(type.children[0].type) ||
    type.children[0].type.listSize < 2 ||
    type.children[0].type.listSize > 4 ||
    (!(coordinateValueType instanceof Float32) && !(coordinateValueType instanceof Float64))
  ) {
    throw new Error(
      `convertArrowPathToGPUVectors ${name} must be Vector<List<FixedSizeList<Float32|Float64>[2..4]>>`
    );
  }
}

function getArrowPathCoordinateValueType(type: DataType): DataType | undefined {
  const pathElementType = type.children[0]?.type;
  return DataType.isFixedSizeList(pathElementType) ? pathElementType.children[0]?.type : undefined;
}

function getArrowPathColorVector(rowTable: Table): Vector<ArrowPathColorType> | undefined {
  const colors = rowTable.getChild('colors');
  if (!colors) {
    return undefined;
  }
  return isArrowPathColorType(colors.type) ? (colors as Vector<ArrowPathColorType>) : undefined;
}

function buildPathSegmentLayout(
  paths: Vector<ArrowPathCoordinateType>,
  viewOrigins?: Vector<ArrowPathViewOriginType>,
  colors?: Vector<ArrowPathColorType>
): PathSegmentLayout {
  assertArrowPathCoordinateType(paths.type, 'paths');
  if (viewOrigins) {
    assertArrowPathViewOriginVector(viewOrigins, paths.length);
  }
  if (colors) {
    assertArrowPathColorVector(colors, paths);
  }
  const pathComponentCount = getArrowPathCoordinateComponentCount(paths.type);
  const startIndices: number[] = [0];
  for (const data of paths.data) {
    const valueOffsets = data.valueOffsets as Int32Array | undefined;
    if (!valueOffsets) {
      throw new Error('PathAttributeModel source path chunks require Arrow list offsets');
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
  const segmentStartColors = new Uint32Array(segmentCount);
  const segmentEndColors = new Uint32Array(segmentCount);
  segmentStartColors.fill(0xffffffff);
  segmentEndColors.fill(0xffffffff);
  const viewOriginRows = makeArrowPathViewOriginRows(viewOrigins);
  const colorRows = makeArrowPathColorRows(colors);
  let globalSegmentIndex = 0;
  let globalRowIndex = 0;

  for (const data of paths.data) {
    const valueOffsets = data.valueOffsets as Int32Array | undefined;
    if (!valueOffsets) {
      throw new Error('PathAttributeModel source path chunks require Arrow list offsets');
    }
    const pathValues = getArrowVariableLengthAttributeDataBufferSource<Float32>(
      data as Data<ArrowPathCoordinateType>
    );
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
      copyArrowPathColorRow(
        segmentStartColors,
        segmentEndColors,
        startIndices[globalRowIndex] ?? globalSegmentIndex,
        rowSegmentCount,
        colorRows,
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
    segmentFlags,
    segmentStartColors,
    segmentEndColors
  };
}

function isArrowPathRowColorType(type: DataType): type is ArrowPathRowColorType {
  return (
    DataType.isFixedSizeList(type) && type.listSize === 4 && type.children[0]?.type instanceof Uint8
  );
}

function isArrowPathVertexColorType(type: DataType): type is ArrowPathVertexColorType {
  return DataType.isList(type) && isArrowPathRowColorType(type.children[0]?.type);
}

function isArrowPathColorType(type: DataType): type is ArrowPathColorType {
  return isArrowPathRowColorType(type) || isArrowPathVertexColorType(type);
}

function getArrowPathCoordinateFormat(
  type: ArrowPathCoordinateType
): VertexList<'float32x2' | 'float32x3' | 'float32x4'> {
  switch (getArrowPathCoordinateComponentCount(type)) {
    case 2:
      return 'vertex-list<float32x2>';
    case 3:
      return 'vertex-list<float32x3>';
    case 4:
      return 'vertex-list<float32x4>';
    default:
      throw new Error('PathAttributeModel paths require 2, 3, or 4 coordinate components');
  }
}

function getArrowPathColorFormat(type: ArrowPathColorType): 'unorm8x4' | VertexList<'unorm8x4'> {
  return isArrowPathVertexColorType(type) ? 'vertex-list<unorm8x4>' : 'unorm8x4';
}

function assertArrowPathColorVector(
  colors: Vector<ArrowPathColorType>,
  paths: Vector<ArrowPathCoordinateType>
): void {
  if (!isArrowPathColorType(colors.type)) {
    throw new Error(
      'PathAttributeModel colors must be Vector<FixedSizeList<Uint8>[4]> or Vector<List<FixedSizeList<Uint8>[4]>>'
    );
  }
  if (colors.length !== paths.length) {
    throw new Error(
      `PathAttributeModel color rows must match path rows (${colors.length} !== ${paths.length})`
    );
  }
  if (isArrowPathVertexColorType(colors.type)) {
    assertArrowPathVertexColorVectorAlignment(paths, colors as Vector<ArrowPathVertexColorType>);
  }
}

function assertArrowPathVertexColorVectorAlignment(
  paths: Vector<ArrowPathSourceCoordinateType>,
  colors: Vector<ArrowPathVertexColorType>
): void {
  if (paths.data.length !== colors.data.length) {
    throw new Error('PathAttributeModel vertex color batch count must match path batch count');
  }
  for (let batchIndex = 0; batchIndex < paths.data.length; batchIndex++) {
    const pathOffsets = paths.data[batchIndex]?.valueOffsets as Int32Array | undefined;
    const colorOffsets = colors.data[batchIndex]?.valueOffsets as Int32Array | undefined;
    if (!pathOffsets || !colorOffsets || !areArrowPathOffsetsEqual(pathOffsets, colorOffsets)) {
      throw new Error('PathAttributeModel vertex colors must align with path vertex offsets');
    }
  }
}

function areArrowPathOffsetsEqual(left: Int32Array, right: Int32Array): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function assertArrowPathViewOriginVector(
  viewOrigins: Vector<ArrowPathViewOriginType>,
  rowCount: number
): void {
  if (
    !DataType.isFixedSizeList(viewOrigins.type) ||
    viewOrigins.type.listSize !== 4 ||
    !(viewOrigins.type.children[0]?.type instanceof Float32)
  ) {
    throw new Error('PathAttributeModel view origins must be Vector<FixedSizeList<Float32>[4]>');
  }
  if (viewOrigins.length !== rowCount) {
    throw new Error(
      `PathAttributeModel view origin rows must match path rows (${viewOrigins.length} !== ${rowCount})`
    );
  }
}

function getArrowPathCoordinateComponentCount(type: DataType): number {
  const pathElementType = type.children[0]?.type;
  if (!pathElementType || !DataType.isFixedSizeList(pathElementType)) {
    throw new Error('PathAttributeModel paths require FixedSizeList coordinate elements');
  }
  return pathElementType.listSize;
}

function convertArrowPathCoordinateData(paths: Vector<ArrowPathSourceCoordinateType>): {
  paths: Vector<ArrowPathCoordinateType>;
  sourceOrigins?: Float64Array;
} {
  const coordinateValueType = getArrowPathCoordinateValueType(paths.type);
  if (coordinateValueType instanceof Float32) {
    return {paths: paths as Vector<ArrowPathCoordinateType>};
  }
  if (!(coordinateValueType instanceof Float64)) {
    throw new Error('convertArrowPathToGPUVectors paths must contain Float32 or Float64 coordinates');
  }

  const componentCount = getArrowPathCoordinateComponentCount(paths.type);
  const pathType = makeArrowPathCoordinateType(componentCount);
  const sourceOrigins = new Float64Array(paths.length * 4);
  const outputData: Data<ArrowPathCoordinateType>[] = [];
  let rowIndexBase = 0;

  for (const data of paths.data) {
    const valueOffsets = data.valueOffsets as Int32Array | undefined;
    if (!valueOffsets) {
      throw new Error('convertArrowPathToGPUVectors Float64 paths require Arrow list offsets');
    }
    const pathValues = getArrowVariableLengthAttributeDataBufferSource(
      data as Data<ArrowPathFloat64CoordinateType>
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

  return {paths: new Vector<ArrowPathCoordinateType>(outputData), sourceOrigins};
}

function makeArrowPathCoordinateType(componentCount: number): ArrowPathCoordinateType {
  const coordinateType = new FixedSizeList(
    componentCount,
    new Field('values', new Float32(), false)
  );
  return new List(new Field('coordinates', coordinateType, false)) as ArrowPathCoordinateType;
}

function makeArrowPathData(
  type: ArrowPathCoordinateType,
  valueOffsets: Int32Array,
  values: Float32Array
): Data<ArrowPathCoordinateType> {
  const coordinateType = type.children[0].type as FixedSizeList<Float32>;
  const coordinateValueData = new Data<Float32>(new Float32(), 0, values.length, 0, {
    [BufferType.DATA]: values
  });
  const coordinateData = new Data<FixedSizeList<Float32>>(
    coordinateType,
    0,
    coordinateType.listSize === 0 ? 0 : values.length / coordinateType.listSize,
    0,
    {},
    [coordinateValueData]
  );
  return new Data<ArrowPathCoordinateType>(
    type,
    0,
    valueOffsets.length - 1,
    0,
    {[BufferType.OFFSET]: valueOffsets},
    [coordinateData]
  );
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
  viewOrigins: Vector<ArrowPathViewOriginType> | undefined
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
      values: getArrowDataBufferSource<Float32>(data as Data<ArrowPathViewOriginType>)
    });
    rowStart = rowEnd;
  }
  return {chunks, currentChunkIndex: 0};
}

function makeArrowPathColorRows(
  colors: Vector<ArrowPathColorType> | undefined
): ArrowPathColorRows | undefined {
  if (!colors) {
    return undefined;
  }
  const chunks: ArrowPathColorChunk[] = [];
  let rowStart = 0;
  for (const data of colors.data) {
    const rowEnd = rowStart + data.length;
    if (isArrowPathVertexColorType(data.type)) {
      const valueOffsets = data.valueOffsets as Int32Array | undefined;
      if (!valueOffsets) {
        throw new Error('PathAttributeModel vertex colors require Arrow list offsets');
      }
      chunks.push({
        kind: 'vertex',
        rowStart,
        rowEnd,
        valueOffsets,
        values: getArrowVariableLengthAttributeDataBufferSource<Uint8>(
          data as Data<ArrowPathVertexColorType>
        )
      });
    } else {
      chunks.push({
        kind: 'row',
        rowStart,
        rowEnd,
        values: getArrowDataBufferSource<Uint8>(data as Data<ArrowPathRowColorType>)
      });
    }
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
  throw new Error(`PathAttributeModel view origin row ${rowIndex} is missing`);
}

function copyArrowPathColorRow(
  startTarget: Uint32Array,
  endTarget: Uint32Array,
  targetSegmentStart: number,
  segmentCount: number,
  colorRows: ArrowPathColorRows | undefined,
  rowIndex: number
): void {
  if (!colorRows || segmentCount === 0) {
    return;
  }
  const colorChunk = getArrowPathColorChunk(colorRows, rowIndex);
  const localRowIndex = rowIndex - colorChunk.rowStart;

  if (colorChunk.kind === 'row') {
    const sourceOffset = localRowIndex * 4;
    const color = packArrowPathColor(colorChunk.values, sourceOffset);
    startTarget.fill(color, targetSegmentStart, targetSegmentStart + segmentCount);
    endTarget.fill(color, targetSegmentStart, targetSegmentStart + segmentCount);
    return;
  }

  const firstElementOffset = colorChunk.valueOffsets[0] ?? 0;
  const colorStart =
    (colorChunk.valueOffsets[localRowIndex] ?? firstElementOffset) - firstElementOffset;
  const colorEnd = (colorChunk.valueOffsets[localRowIndex + 1] ?? colorStart) - firstElementOffset;
  if (colorEnd - colorStart < segmentCount + 1) {
    throw new Error('PathAttributeModel vertex colors must provide one color per path vertex');
  }

  for (let segmentOffset = 0; segmentOffset < segmentCount; segmentOffset++) {
    const targetIndex = targetSegmentStart + segmentOffset;
    startTarget[targetIndex] = packArrowPathColor(
      colorChunk.values,
      (colorStart + segmentOffset) * 4
    );
    endTarget[targetIndex] = packArrowPathColor(
      colorChunk.values,
      (colorStart + segmentOffset + 1) * 4
    );
  }
}

function getArrowPathColorChunk(
  colorRows: ArrowPathColorRows,
  rowIndex: number
): ArrowPathColorChunk {
  let chunk = colorRows.chunks[colorRows.currentChunkIndex];
  while (chunk && rowIndex >= chunk.rowEnd) {
    colorRows.currentChunkIndex++;
    chunk = colorRows.chunks[colorRows.currentChunkIndex];
  }
  if (chunk && rowIndex >= chunk.rowStart && rowIndex < chunk.rowEnd) {
    return chunk;
  }
  throw new Error(`PathAttributeModel color row ${rowIndex} is missing`);
}

function packArrowPathColor(values: Uint8Array, offset: number): number {
  return (
    ((values[offset] ?? 255) |
      ((values[offset + 1] ?? 255) << 8) |
      ((values[offset + 2] ?? 255) << 16) |
      ((values[offset + 3] ?? 255) << 24)) >>>
    0
  );
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
  segmentTable: Table,
  generatedBufferBatches?: GeneratedBufferBatch[]
): Table {
  const generatedColumnNames = new Set([
    SEGMENT_START_POSITIONS_COLUMN,
    SEGMENT_END_POSITIONS_COLUMN,
    SEGMENT_PREVIOUS_POSITIONS_COLUMN,
    SEGMENT_NEXT_POSITIONS_COLUMN,
    SEGMENT_START_COLORS_COLUMN,
    SEGMENT_END_COLORS_COLUMN,
    SEGMENT_FLAGS_COLUMN,
    ROW_INDICES_COLUMN
  ]);
  const fields: Field[] = [];
  const columns: Record<string, Vector> = {};

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

  const renderTable = new Table(new Schema(fields, new Map(segmentTable.schema.metadata)), columns);
  if (!generatedBufferBatches || generatedBufferBatches.length <= 1 || fields.length === 0) {
    return renderTable;
  }
  const recordBatches = generatedBufferBatches.flatMap(
    batch => renderTable.slice(batch.recordStart, batch.recordEnd).batches
  );
  return new Table(renderTable.schema, recordBatches);
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
    uint32Values[recordUint32Index + 18] = segmentLayout.segmentStartColors[segmentIndex];
    uint32Values[recordUint32Index + 19] = segmentLayout.segmentEndColors[segmentIndex];
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

function makeArrowPathRowIndices(startIndices: number[], rowIndexBase: number = 0): Uint32Array {
  const segmentCount = startIndices[startIndices.length - 1] ?? 0;
  const rowIndices = new Uint32Array(segmentCount);
  for (let rowIndex = 0; rowIndex < startIndices.length - 1; rowIndex++) {
    rowIndices.fill(rowIndexBase + rowIndex, startIndices[rowIndex], startIndices[rowIndex + 1]);
  }
  return rowIndices;
}

function assertArrowPathColumnAvailable(table: Table, columnName: string): void {
  if (table.getChild(columnName)) {
    throw new Error(`PathAttributeModel rowTable column "${columnName}" is reserved`);
  }
}

function makeFixedSizeListFloatField(name: string, listSize: 4): Field {
  return new Field(
    name,
    new FixedSizeList(listSize, new Field('value', new Float32(), false)),
    false
  );
}

function makeNumericArrowVector<TypeT extends NumericArrowType>(
  type: TypeT,
  data: TypeT['TArray']
): Vector<TypeT> {
  const makeNumericData = makeData as <NumericTypeT extends NumericArrowType>(props: {
    type: NumericTypeT;
    length: number;
    data: NumericTypeT['TArray'];
  }) => Data<NumericTypeT>;
  return makeVector(
    makeNumericData({
      type,
      length: data.length,
      data
    })
  );
}

function getGeneratedAttributeByteLength(columns: Record<string, Vector>): number {
  let attributeByteLength = 0;
  for (const vector of Object.values(columns)) {
    if (!isInstanceArrowType(vector.type)) {
      continue;
    }
    attributeByteLength += getArrowVectorBufferSource(vector as Vector<any>).byteLength;
  }
  return attributeByteLength;
}

function destroyArrowPathRenderBatches(renderBatches: PathRenderBatchState[]): void {
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
