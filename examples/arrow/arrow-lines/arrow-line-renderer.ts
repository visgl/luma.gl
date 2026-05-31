// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  AttributePathModel,
  StoragePathModel,
  StorageTripsPathModel,
  convertArrowPathsToAttribute,
  getArrowVectorByteLength,
  makeArrowFixedSizeListVector,
  prepareArrowTemporalGPUVector,
  type ArrowPathPreparedState
} from '@luma.gl/arrow';
import {type CommandEncoder, type Device} from '@luma.gl/core';
import {GPURenderable, type GPUVector, type VertexList} from '@luma.gl/tables';
import * as arrow from 'apache-arrow';
import {
  createArrowLineShaderInputs,
  FS_GLSL,
  PATH_SHADER_LAYOUT,
  STORAGE_PATH_SHADER_LAYOUT,
  STORAGE_WGSL_SHADER,
  TRIPS_STORAGE_WGSL_SHADER,
  VS_GLSL,
  WGSL_SHADER
} from './arrow-line-shaders';

/** Path rendering path selected by the Arrow path example layer. */
export type ArrowLineRendererModel = 'attribute' | 'storage' | 'trips' | 'auto';
/** Concrete path rendering path after resolving `auto`. */
export type ArrowLineRendererResolvedModel = Exclude<ArrowLineRendererModel, 'auto'>;
/** Source time column mode used by the Arrow path example. */
export type ArrowLineRendererTimeColumn = 'none' | 'xyzm' | 'timestamps';
/** DenseUnion geometry extraction mode used by the example renderer. */
export type ArrowLineRendererMode = 'lines' | 'polygons';
/** GPU-ready Float32 variable-length path coordinate type. */
export type ArrowLineCoordinateType = arrow.List<arrow.FixedSizeList<arrow.Float32>>;
/** CPU Float64 source path coordinate type converted before rendering. */
export type ArrowLineFloat64CoordinateType = arrow.List<arrow.FixedSizeList<arrow.Float64>>;
/**
 * DenseUnion source path coordinate type normalized by the example renderer.
 *
 * Top-level DenseUnion rows are converted one-for-one into prepared list rows so generated
 * segment row indices continue to refer to the full source table row.
 */
export type ArrowLineDenseUnionCoordinateType = arrow.DenseUnion;
/**
 * CPU source path coordinate type accepted by preparation helpers.
 *
 * DenseUnion inputs are accepted at the example renderer boundary and normalized into
 * `List<FixedSizeList<Float32, 4>>` before the core path models prepare GPU vectors.
 */
export type ArrowLineSourceCoordinateType =
  | ArrowLineCoordinateType
  | ArrowLineFloat64CoordinateType
  | ArrowLineDenseUnionCoordinateType;
/** GPU-ready per-vertex relative timestamp type. */
export type ArrowLineTimestampType = arrow.List<arrow.Float32>;
/** CPU source per-vertex absolute timestamp type. */
export type ArrowLineSourceTimestampType = arrow.List<arrow.TimestampMillisecond>;
/** Packed RGBA8 row color type. */
export type ArrowLineRowColorType = arrow.FixedSizeList<arrow.Uint8>;
/** Packed RGBA8 per-vertex color type. */
export type ArrowLineVertexColorType = arrow.List<arrow.FixedSizeList<arrow.Uint8>>;
/** Row or per-vertex path color source type. */
export type ArrowLineColorType = ArrowLineRowColorType | ArrowLineVertexColorType;
/** Concrete luma.gl path models owned by {@link ArrowLineRenderer}. */
export type ArrowLineRendererActiveModel =
  | AttributePathModel
  | StoragePathModel
  | StorageTripsPathModel;

/** CPU Arrow vectors accepted by Arrow path preparation helpers. */
export type ArrowLineRendererSourceVectors = {
  /** Variable-length path coordinate rows, or DenseUnion rows normalized by this example layer. */
  paths: arrow.Vector<ArrowLineSourceCoordinateType>;
  /** Optional row or per-vertex packed path colors. */
  colors?: arrow.Vector<ArrowLineColorType>;
  /** Optional per-row path widths. */
  widths?: arrow.Vector<arrow.Float32>;
  /** Optional per-vertex absolute timestamp rows. */
  timestamps?: arrow.Vector<ArrowLineSourceTimestampType>;
};

type ArrowLineRendererNormalizedSourceVectors = Omit<ArrowLineRendererSourceVectors, 'paths'> & {
  paths: arrow.Vector<ArrowLineCoordinateType | ArrowLineFloat64CoordinateType>;
};

type DenseUnionNormalizedLines = {
  paths: arrow.Vector<ArrowLineCoordinateType>;
  sourceRowIndexChunks: Int32Array[];
  sourceRowCount: number;
};

type DenseUnionGeometryKind =
  | 'Point'
  | 'LineString'
  | 'Polygon'
  | 'MultiPoint'
  | 'MultiLineString'
  | 'MultiPolygon'
  | 'GeometryCollection';

/** Prepared GPUVector data consumed by Arrow path models. */
export type ArrowLineRendererData = {
  /** GPU path coordinate rows. */
  paths: GPUVector<VertexList<'float32x2' | 'float32x3' | 'float32x4'>>;
  /** Optional GPU row or per-vertex colors. */
  colors?: GPUVector<'unorm8x4' | VertexList<'unorm8x4'>>;
  /** Optional GPU per-row widths. */
  widths?: GPUVector<'float32'>;
  /** Optional GPU per-vertex relative timestamps. */
  timestamps?: GPUVector<'vertex-list<float32>'>;
  /** Optional view origins generated during coordinate normalization. */
  viewOrigins?: GPUVector<'float32x4'>;
  /** Prepared path state shared by attribute path rendering. */
  pathState: ArrowPathPreparedState;
  /** Releases all resources owned by this prepared data object. */
  destroy: () => void;
};

/** Prepared path data plus byte-size metrics shown by the example control panel. */
export type ArrowLineRendererInput = ArrowLineRendererData & {
  /** Required prepared widths vector for the example metrics and render paths. */
  widths: GPUVector<'float32'>;
  /** Bytes occupied by path coordinate and timestamp Arrow source vectors. */
  pathArrowByteLength: number;
  /** Bytes occupied by style Arrow source vectors. */
  styleArrowByteLength: number;
};

/** CPU Arrow source plus metric metadata used by example data generation helpers. */
export type ArrowLineRendererSourceData = {
  /** Source vectors with required widths included by the example data generator. */
  sourceVectors: ArrowLineRendererSourceVectors & {
    widths: arrow.Vector<arrow.Float32>;
  };
  /** Bytes occupied by path coordinate and timestamp Arrow source vectors. */
  pathArrowByteLength: number;
  /** Bytes occupied by style Arrow source vectors. */
  styleArrowByteLength: number;
  /** CPU time spent building the generated Arrow source vectors. */
  arrowVectorBuildTimeMs?: number;
};

/** Props for preparing GPUVector path data from explicit Arrow source vectors. */
export type ArrowLineRendererPrepareDataProps = {
  /** Source Arrow vectors to prepare. */
  sourceVectors: ArrowLineRendererSourceVectors;
  /** DenseUnion extraction mode. Defaults to `lines`. */
  mode?: ArrowLineRendererMode;
  /** Optional resource id prefix. */
  id?: string;
};

/** Notification emitted when a path record batch stream updates the layer. */
export type ArrowLineRendererRecordBatchStreamUpdate = {
  /** Full prepared input for all batches loaded so far. */
  pathInput: ArrowLineRendererInput;
  /** Number of loaded record batches. */
  loadedBatchCount: number;
  /** True for the first batch in a stream. */
  isFirstBatch: boolean;
  /** Result of applying the batch to layer props. */
  setPropsResult: ArrowLineRendererSetPropsResult;
};

/** Props for incrementally streaming Arrow path record batches. */
export type ArrowLineRendererRecordBatchStreamProps = {
  /** Async iterator that yields Arrow path record batches. */
  recordBatchIterator: AsyncIterator<arrow.RecordBatch>;
  /** Optional model selection applied when the first batch arrives. */
  model?: ArrowLineRendererModel;
  /** Optional time-column mode applied when the first batch arrives. */
  timeColumn?: ArrowLineRendererTimeColumn;
  /** DenseUnion extraction mode applied when batches are prepared. */
  mode?: ArrowLineRendererMode;
  /** Optional stream session used to cancel stale async streams. */
  streamingSession?: ArrowLineRendererStreamingSession;
  /** Redraw reason used for the first batch. */
  startRedrawReason?: string;
  /** Redraw reason used for appended batches. */
  appendRedrawReason?: string;
  /** Callback fired after each batch is prepared and applied. */
  onBatch?: (update: ArrowLineRendererRecordBatchStreamUpdate) => void;
};

/** Result returned by Arrow path layer prop updates. */
export type ArrowLineRendererSetPropsResult = {
  /** True when a new underlying path model was constructed. */
  modelChanged: boolean;
};

/** Arrow or prepared GPU data accepted by {@link ArrowLineRenderer}. */
export type ArrowLineRendererDataInput =
  | ArrowLineRendererData
  | ArrowLineRendererSourceVectors
  | ArrowLineRendererSourceData;

/** Token used to cancel stale Arrow path streaming work. */
export type ArrowLineRendererStreamingSession = {
  /** Monotonic stream version owned by the layer. */
  version: number;
};

type ArrowLineRendererSetPropsOptions = {
  preserveStreaming?: boolean;
};

/** Public configuration for the Arrow path example layer. */
export type ArrowLineRendererProps = {
  /** Debug label used for generated model resources. */
  id?: string;
  /** Arrow source vectors or prepared GPU path data consumed by the layer. */
  data: ArrowLineRendererDataInput;
  /** Path rendering path. */
  model?: ArrowLineRendererModel;
  /** Source time column mode. */
  timeColumn?: ArrowLineRendererTimeColumn;
  /** DenseUnion extraction mode. Defaults to `lines`. */
  mode?: ArrowLineRendererMode;
  /** Current Trips timestamp in relative milliseconds. */
  currentTime?: number;
  /** Trips trail length in relative milliseconds. */
  trailLength?: number;
  /** Constant fallback RGBA path color. */
  color?: [number, number, number, number];
  /** Constant fallback path width. */
  width?: number;
};

type PreparedArrowLineRendererProps = Omit<ArrowLineRendererProps, 'data'> & {
  data: ArrowLineRendererData;
};

const DEFAULT_PATH_COLOR: [number, number, number, number] = [199, 219, 245, 235];
const DEFAULT_PATH_WIDTH = 0.0035;
const DEFAULT_PATH_TOPOLOGY = 'triangle-list' as const;
const DEFAULT_PATH_VERTEX_COUNT = 12;
const DEFAULT_RENDER_PARAMETERS = {
  depthWriteEnabled: false,
  blend: true,
  blendColorOperation: 'add',
  blendAlphaOperation: 'add',
  blendColorSrcFactor: 'src-alpha',
  blendColorDstFactor: 'one-minus-src-alpha',
  blendAlphaSrcFactor: 'one',
  blendAlphaDstFactor: 'one-minus-src-alpha'
} as const satisfies Record<string, unknown>;

/** Example layer that renders variable-length Arrow paths through attribute or storage models. */
export class ArrowLineRenderer extends GPURenderable<
  [Parameters<ArrowLineRendererActiveModel['draw']>[0]]
> {
  readonly device: Device;
  readonly shaderInputs = createArrowLineShaderInputs();
  props: ArrowLineRendererProps;
  model: ArrowLineRendererActiveModel | null = null;
  resolvedModel: ArrowLineRendererResolvedModel;
  private ownedPathInput: ArrowLineRendererData | null = null;
  private activeStreamingPathInput: ArrowLineRendererInput | null = null;
  private streamingSessionVersion = 0;
  private preparationVersion = 0;
  private isDestroyed = false;

  constructor(device: Device, props: ArrowLineRendererProps) {
    super();
    this.device = device;
    this.props = props;
    this.resolvedModel = this.resolveModel(props.model ?? 'auto', props.timeColumn ?? 'xyzm');
    this.setPreparedOrPendingProps(props, true);
  }

  /**
   * Prepares Arrow source vectors for path rendering.
   *
   * DenseUnion path coordinates are normalized to one prepared path row per top-level DenseUnion
   * row. Row-aligned style and timestamp columns remain unchanged.
   */
  static async prepareData(
    device: Device,
    props: ArrowLineRendererPrepareDataProps
  ): Promise<ArrowLineRendererData> {
    const sourceVectors = normalizeArrowLineSourceVectors(
      props.sourceVectors,
      props.mode ?? 'lines'
    );
    const preparedTimestamps = sourceVectors.timestamps
      ? await prepareArrowTemporalGPUVector(device, sourceVectors.timestamps, {
          name: 'timestamps',
          id: `${props.id ?? 'arrow-line-renderer'}-timestamps`
        })
      : null;
    const prepared = await convertArrowPathsToAttribute(
      device,
      {
        paths: sourceVectors.paths,
        ...(sourceVectors.colors ? {colors: sourceVectors.colors} : {}),
        ...(sourceVectors.widths ? {widths: sourceVectors.widths} : {})
      },
      {
        id: props.id ?? 'arrow-line-renderer'
      }
    );

    return {
      paths: prepared.paths,
      ...(prepared.colors ? {colors: prepared.colors} : {}),
      ...(prepared.widths ? {widths: prepared.widths} : {}),
      ...(preparedTimestamps ? {timestamps: preparedTimestamps.temporal} : {}),
      ...(prepared.viewOrigins ? {viewOrigins: prepared.viewOrigins} : {}),
      pathState: prepared.pathProps.pathState,
      destroy: () => {
        prepared.destroy();
        preparedTimestamps?.destroy();
      }
    };
  }

  setProps(
    props: Partial<ArrowLineRendererProps>,
    options: ArrowLineRendererSetPropsOptions = {}
  ): ArrowLineRendererSetPropsResult {
    const nextProps = {...this.props, ...props};
    const shouldCancelStreaming =
      !options.preserveStreaming && props.data !== undefined && props.data !== this.props.data;
    const streamingPathInputToDestroy = shouldCancelStreaming
      ? this.activeStreamingPathInput
      : null;
    if (shouldCancelStreaming) {
      this.streamingSessionVersion++;
      this.activeStreamingPathInput = null;
    }
    this.props = nextProps;

    if (props.currentTime !== undefined && this.model instanceof StorageTripsPathModel) {
      this.model.setProps({currentTime: props.currentTime});
    }

    const nextModel = this.resolveModel(
      nextProps.model ?? this.props.model ?? 'auto',
      nextProps.timeColumn ?? this.props.timeColumn ?? 'xyzm'
    );
    const modelChanged =
      props.data !== undefined ||
      props.model !== undefined ||
      props.timeColumn !== undefined ||
      nextModel !== this.resolvedModel;

    if (!modelChanged) {
      streamingPathInputToDestroy?.destroy();
      return {modelChanged};
    }

    this.setPreparedOrPendingProps(nextProps, true);
    streamingPathInputToDestroy?.destroy();
    return {modelChanged};
  }

  beginRecordBatchStream(): ArrowLineRendererStreamingSession {
    this.streamingSessionVersion++;
    return {version: this.streamingSessionVersion};
  }

  cancelRecordBatchStream(): void {
    this.streamingSessionVersion++;
  }

  async streamRecordBatches({
    recordBatchIterator,
    model,
    timeColumn,
    mode,
    streamingSession = this.beginRecordBatchStream(),
    onBatch
  }: ArrowLineRendererRecordBatchStreamProps): Promise<void> {
    const sourceRecordBatches: arrow.RecordBatch[] = [];

    if (!this.isRecordBatchStreamActive(streamingSession)) {
      return;
    }

    for (
      let recordBatchResult = await recordBatchIterator.next();
      !recordBatchResult.done;
      recordBatchResult = await recordBatchIterator.next()
    ) {
      if (!this.isRecordBatchStreamActive(streamingSession)) {
        return;
      }

      sourceRecordBatches.push(recordBatchResult.value);
      const pathInput = await prepareArrowLineInputFromRecordBatches(
        this.device,
        sourceRecordBatches,
        mode ?? 'lines'
      );
      if (!this.isRecordBatchStreamActive(streamingSession)) {
        pathInput.destroy();
        return;
      }

      const previousStreamingPathInput = this.activeStreamingPathInput;
      this.activeStreamingPathInput = pathInput;
      const isFirstBatch = sourceRecordBatches.length === 1;
      const setPropsResult = this.setProps(
        {
          data: pathInput,
          ...(isFirstBatch && model ? {model} : {}),
          ...(isFirstBatch && timeColumn ? {timeColumn} : {}),
          ...(isFirstBatch && mode ? {mode} : {})
        },
        {preserveStreaming: true}
      );
      previousStreamingPathInput?.destroy();
      onBatch?.({
        pathInput,
        loadedBatchCount: sourceRecordBatches.length,
        isFirstBatch,
        setPropsResult
      });
    }
  }

  override needsRedraw(): false | string {
    const rendererNeedsRedraw = super.needsRedraw();
    const modelNeedsRedraw = this.model?.needsRedraw() ?? false;
    return rendererNeedsRedraw || modelNeedsRedraw;
  }

  override setNeedsRedraw(reason: string): void {
    super.setNeedsRedraw(reason);
    this.model?.setNeedsRedraw(reason);
  }

  override predraw(commandEncoder: CommandEncoder): void {
    this.model?.predraw(commandEncoder);
  }

  override draw(renderPass: Parameters<ArrowLineRendererActiveModel['draw']>[0]): void {
    this.model?.draw(renderPass);
  }

  destroy(): void {
    this.isDestroyed = true;
    this.streamingSessionVersion++;
    const streamingPathInput = this.activeStreamingPathInput;
    this.activeStreamingPathInput = null;
    this.model?.destroy();
    this.ownedPathInput?.destroy();
    streamingPathInput?.destroy();
  }

  private resolveModel(
    modelKind: ArrowLineRendererModel,
    timeColumn: ArrowLineRendererTimeColumn
  ): ArrowLineRendererResolvedModel {
    if (modelKind === 'auto') {
      if (this.device.type !== 'webgpu') {
        return 'attribute';
      }
      return timeColumn === 'timestamps' ? 'trips' : 'storage';
    }
    if (modelKind !== 'attribute' && this.device.type !== 'webgpu') {
      return 'attribute';
    }
    if (modelKind === 'storage' && timeColumn === 'timestamps') {
      return 'trips';
    }
    return modelKind;
  }

  private isRecordBatchStreamActive(streamingSession: ArrowLineRendererStreamingSession): boolean {
    return !this.isDestroyed && streamingSession.version === this.streamingSessionVersion;
  }

  private setPreparedOrPendingProps(
    props: ArrowLineRendererProps,
    preservePreparedInput: boolean
  ): void {
    const preparationVersion = ++this.preparationVersion;
    if (isPreparedArrowLineRendererData(props.data)) {
      this.setPreparedProps({...props, data: props.data}, preservePreparedInput);
      return;
    }

    void this.prepareAndSetProps(props, preparationVersion);
  }

  private async prepareAndSetProps(
    props: ArrowLineRendererProps,
    preparationVersion: number
  ): Promise<void> {
    const preparedData = await prepareArrowLineRendererDataInput(this.device, props);
    if (this.isDestroyed || preparationVersion !== this.preparationVersion) {
      preparedData.destroy();
      return;
    }
    this.setPreparedProps({...props, data: preparedData}, false);
  }

  private setPreparedProps(
    props: PreparedArrowLineRendererProps,
    preservePreparedInput: boolean
  ): void {
    const nextModel = this.resolveModel(props.model ?? 'auto', props.timeColumn ?? 'xyzm');
    const previousModel = this.model;
    const previousOwnedPathInput = this.ownedPathInput;
    this.resolvedModel = nextModel;
    this.model = this.createModel(nextModel, props);
    previousModel?.destroy();
    this.ownedPathInput = preservePreparedInput ? null : props.data;
    if (previousOwnedPathInput && previousOwnedPathInput !== props.data) {
      previousOwnedPathInput.destroy();
    }
  }

  private createModel(
    modelKind: ArrowLineRendererResolvedModel,
    props: PreparedArrowLineRendererProps
  ): ArrowLineRendererActiveModel {
    const commonProps = {
      id: props.id,
      paths: props.data.paths,
      ...(props.data.colors ? {colors: props.data.colors} : {}),
      ...(props.data.widths ? {widths: props.data.widths} : {}),
      ...(props.data.viewOrigins ? {viewOrigins: props.data.viewOrigins} : {}),
      shaderInputs: this.shaderInputs,
      topology: DEFAULT_PATH_TOPOLOGY,
      vertexCount: DEFAULT_PATH_VERTEX_COUNT,
      parameters: DEFAULT_RENDER_PARAMETERS
    };

    if (modelKind === 'storage') {
      return new StoragePathModel(this.device, {
        ...commonProps,
        color: props.color ?? DEFAULT_PATH_COLOR,
        width: props.width ?? DEFAULT_PATH_WIDTH,
        source: STORAGE_WGSL_SHADER,
        shaderLayout: STORAGE_PATH_SHADER_LAYOUT
      });
    }

    if (modelKind === 'trips') {
      if (!props.data.timestamps) {
        throw new Error('ArrowLineRenderer trips model requires a timestamps column');
      }
      return new StorageTripsPathModel(this.device, {
        ...commonProps,
        timestamps: props.data.timestamps,
        currentTime: props.currentTime ?? 0,
        trailLength: props.trailLength ?? 0,
        color: props.color ?? DEFAULT_PATH_COLOR,
        width: props.width ?? DEFAULT_PATH_WIDTH,
        source: TRIPS_STORAGE_WGSL_SHADER,
        shaderLayout: STORAGE_PATH_SHADER_LAYOUT
      });
    }

    return new AttributePathModel(this.device, {
      ...commonProps,
      pathState: props.data.pathState,
      source: WGSL_SHADER,
      vs: VS_GLSL,
      fs: FS_GLSL,
      shaderLayout: PATH_SHADER_LAYOUT
    });
  }
}

async function prepareArrowLineRendererDataInput(
  device: Device,
  props: ArrowLineRendererProps
): Promise<ArrowLineRendererData> {
  if (isPreparedArrowLineRendererData(props.data)) {
    return props.data;
  }
  if (isArrowLineRendererSourceData(props.data)) {
    return prepareArrowLineInput(device, props.data, props.mode ?? 'lines');
  }
  return ArrowLineRenderer.prepareData(device, {
    id: props.id ?? 'arrow-line-renderer',
    sourceVectors: props.data,
    mode: props.mode
  });
}

function isPreparedArrowLineRendererData(
  data: ArrowLineRendererDataInput
): data is ArrowLineRendererData {
  return 'pathState' in data;
}

function isArrowLineRendererSourceData(
  data: ArrowLineRendererDataInput
): data is ArrowLineRendererSourceData {
  return 'sourceVectors' in data;
}

/** Prepares generated Arrow path source data into the renderer input used by the example. */
export async function prepareArrowLineInput(
  device: Device,
  sourceData: ArrowLineRendererSourceData,
  mode: ArrowLineRendererMode = 'lines'
): Promise<ArrowLineRendererInput> {
  const {sourceVectors} = sourceData;
  const prepared = await ArrowLineRenderer.prepareData(device, {
    id: 'arrow-lines',
    sourceVectors,
    mode
  });
  if (!prepared.widths) {
    throw new Error('Arrow path example expected prepared width GPU vectors');
  }
  if (sourceVectors.timestamps && !prepared.timestamps) {
    throw new Error('Arrow path example expected prepared timestamp GPU vectors');
  }

  return {
    paths: prepared.paths,
    ...(prepared.colors ? {colors: prepared.colors} : {}),
    widths: prepared.widths,
    ...(prepared.timestamps ? {timestamps: prepared.timestamps} : {}),
    ...(prepared.viewOrigins ? {viewOrigins: prepared.viewOrigins} : {}),
    pathState: prepared.pathState,
    pathArrowByteLength: sourceData.pathArrowByteLength,
    styleArrowByteLength: sourceData.styleArrowByteLength,
    destroy: prepared.destroy
  };
}

/**
 * Builds a source table from record batches, then prepares it for path rendering.
 *
 * This preserves full-table row identity because each input record-batch row remains one logical
 * path row after DenseUnion normalization.
 */
export async function prepareArrowLineInputFromRecordBatches(
  device: Device,
  recordBatches: arrow.RecordBatch[],
  mode: ArrowLineRendererMode = 'lines'
): Promise<ArrowLineRendererInput> {
  const sourceTable = new arrow.Table(recordBatches);
  const paths = getRequiredArrowVector<ArrowLineSourceCoordinateType>(sourceTable, 'paths');
  const colors = getOptionalArrowVector<ArrowLineColorType>(sourceTable, 'colors');
  const widths = getRequiredArrowVector<arrow.Float32>(sourceTable, 'widths');
  const timestamps = getOptionalArrowVector<ArrowLineSourceTimestampType>(
    sourceTable,
    'timestamps'
  );

  return prepareArrowLineInput(
    device,
    {
      sourceVectors: {
        paths,
        ...(colors ? {colors} : {}),
        widths,
        ...(timestamps ? {timestamps} : {})
      },
      pathArrowByteLength:
        getArrowVectorByteLength(paths) + (timestamps ? getArrowVectorByteLength(timestamps) : 0),
      styleArrowByteLength:
        (colors ? getArrowVectorByteLength(colors) : 0) + getArrowVectorByteLength(widths)
    },
    mode
  );
}

function normalizeArrowLineSourceVectors(
  sourceVectors: ArrowLineRendererSourceVectors,
  mode: ArrowLineRendererMode
): ArrowLineRendererNormalizedSourceVectors {
  if (!arrow.DataType.isDenseUnion(sourceVectors.paths.type)) {
    return sourceVectors as ArrowLineRendererNormalizedSourceVectors;
  }
  const normalized = normalizeDenseUnionLineVector(
    sourceVectors.paths as arrow.Vector<ArrowLineDenseUnionCoordinateType>,
    mode
  );
  return {
    ...sourceVectors,
    paths: normalized.paths,
    ...(sourceVectors.colors
      ? {colors: normalizeDenseUnionLineColors(sourceVectors.colors, normalized)}
      : {}),
    ...(sourceVectors.widths
      ? {widths: repeatFloat32Rows(sourceVectors.widths, normalized.sourceRowIndexChunks)}
      : {}),
    ...(sourceVectors.timestamps
      ? {timestamps: normalizeDenseUnionLineTimestamps(sourceVectors.timestamps, normalized)}
      : {})
  };
}

function normalizeDenseUnionLineVector(
  paths: arrow.Vector<ArrowLineDenseUnionCoordinateType>,
  mode: ArrowLineRendererMode
): DenseUnionNormalizedLines {
  const sourceRowIndexChunks: Int32Array[] = [];
  let sourceRowIndexBase = 0;
  const dataChunks = paths.data.map(data => {
    const normalizedData = normalizeDenseUnionLineData(data, mode, sourceRowIndexBase);
    sourceRowIndexBase += data.length;
    sourceRowIndexChunks.push(normalizedData.sourceRowIndices);
    return normalizedData.paths;
  });
  return {paths: new arrow.Vector(dataChunks), sourceRowIndexChunks, sourceRowCount: paths.length};
}

function normalizeDenseUnionLineData(
  data: arrow.Data<ArrowLineDenseUnionCoordinateType>,
  mode: ArrowLineRendererMode,
  sourceRowIndexBase: number
): {paths: arrow.Data<ArrowLineCoordinateType>; sourceRowIndices: Int32Array} {
  const valueOffsets: number[] = [0];
  const values: number[] = [];
  const sourceRowIndices: number[] = [];

  for (let localRowIndex = 0; localRowIndex < data.length; localRowIndex++) {
    appendDenseUnionLineRows({
      data,
      localRowIndex,
      sourceRowIndex: sourceRowIndexBase + localRowIndex,
      mode,
      valueOffsets,
      values,
      sourceRowIndices
    });
  }

  return {
    paths: makePathListData(Int32Array.from(valueOffsets), Float32Array.from(values)),
    sourceRowIndices: Int32Array.from(sourceRowIndices)
  };
}

function appendDenseUnionLineRows(props: {
  data: arrow.Data<ArrowLineDenseUnionCoordinateType>;
  localRowIndex: number;
  sourceRowIndex: number;
  mode: ArrowLineRendererMode;
  valueOffsets: number[];
  values: number[];
  sourceRowIndices: number[];
}): void {
  const {data, localRowIndex, sourceRowIndex, mode, valueOffsets, values, sourceRowIndices} = props;
  const typeIds = data.typeIds as ArrayLike<number>;
  const denseUnionValueOffsets = data.valueOffsets as ArrayLike<number>;
  const denseUnionType = data.type as arrow.DenseUnion & {
    typeIdToChildIndex: Record<number, number | undefined>;
  };
  const dataRowIndex = (data.offset ?? 0) + localRowIndex;
  const typeId = typeIds[dataRowIndex];
  const childIndex = denseUnionType.typeIdToChildIndex[typeId];
  if (childIndex === undefined) {
    throw new Error(`ArrowLineRenderer DenseUnion has unsupported type id ${typeId}`);
  }

  const geometryKind = getDenseUnionGeometryKind(denseUnionType, typeId, childIndex);
  if (!isGeometryKindEnabled(geometryKind, mode)) {
    return;
  }

  const childData = data.children[childIndex];
  const childRowIndex = denseUnionValueOffsets[dataRowIndex];
  if (!childData.getValid(childRowIndex)) {
    return;
  }
  const childValueOffset = (childData.offset ?? 0) + childRowIndex;

  if (geometryKind === 'LineString') {
    appendLineStringRow(childData as arrow.Data<ArrowLineCoordinateType>, childValueOffset, {
      sourceRowIndex,
      closeLine: false,
      valueOffsets,
      values,
      sourceRowIndices
    });
    return;
  }

  if (geometryKind === 'MultiLineString' || geometryKind === 'Polygon') {
    appendNestedLineRows(
      childData as arrow.Data<arrow.List<ArrowLineCoordinateType>>,
      childValueOffset,
      {
        sourceRowIndex,
        closeLine: geometryKind === 'Polygon',
        valueOffsets,
        values,
        sourceRowIndices
      }
    );
    return;
  }

  if (geometryKind === 'MultiPolygon') {
    appendMultiPolygonLineRows(
      childData as arrow.Data<arrow.List<arrow.List<ArrowLineCoordinateType>>>,
      childValueOffset,
      {sourceRowIndex, valueOffsets, values, sourceRowIndices}
    );
  }
}

function appendNestedLineRows(
  data: arrow.Data<arrow.List<ArrowLineCoordinateType>>,
  localRowIndex: number,
  props: {
    sourceRowIndex: number;
    closeLine: boolean;
    valueOffsets: number[];
    values: number[];
    sourceRowIndices: number[];
  }
): void {
  assertDenseUnionChildListData(data, 'nested line rows');
  const lineData = data.children[0] as arrow.Data<ArrowLineCoordinateType>;
  const lineStart = data.valueOffsets[localRowIndex] ?? 0;
  const lineEnd = data.valueOffsets[localRowIndex + 1] ?? lineStart;
  for (let lineIndex = lineStart; lineIndex < lineEnd; lineIndex++) {
    appendLineStringRow(lineData, (lineData.offset ?? 0) + lineIndex, props);
  }
}

function appendMultiPolygonLineRows(
  data: arrow.Data<arrow.List<arrow.List<ArrowLineCoordinateType>>>,
  localRowIndex: number,
  props: {
    sourceRowIndex: number;
    valueOffsets: number[];
    values: number[];
    sourceRowIndices: number[];
  }
): void {
  assertDenseUnionChildListData(data, 'MultiPolygon rows');
  const polygonData = data.children[0] as arrow.Data<arrow.List<ArrowLineCoordinateType>>;
  const polygonStart = data.valueOffsets[localRowIndex] ?? 0;
  const polygonEnd = data.valueOffsets[localRowIndex + 1] ?? polygonStart;
  for (let polygonIndex = polygonStart; polygonIndex < polygonEnd; polygonIndex++) {
    appendNestedLineRows(polygonData, (polygonData.offset ?? 0) + polygonIndex, {
      ...props,
      closeLine: true
    });
  }
}

function appendLineStringRow(
  data: arrow.Data<ArrowLineCoordinateType>,
  localRowIndex: number,
  props: {
    sourceRowIndex: number;
    closeLine: boolean;
    valueOffsets: number[];
    values: number[];
    sourceRowIndices: number[];
  }
): void {
  const {coordinateData, coordinateValues, coordinateComponentCount} =
    getDenseUnionChildCoordinateData(data);
  const pointStart = data.valueOffsets[localRowIndex] ?? 0;
  const pointEnd = data.valueOffsets[localRowIndex + 1] ?? pointStart;
  if (pointEnd <= pointStart) {
    return;
  }

  const lineStartValueCount = props.values.length / 4;
  for (let pointIndex = pointStart; pointIndex < pointEnd; pointIndex++) {
    appendDenseUnionCoordinate(
      props.values,
      coordinateData,
      coordinateValues,
      coordinateComponentCount,
      pointIndex
    );
  }
  if (
    props.closeLine &&
    pointEnd - pointStart >= 2 &&
    !areOutputCoordinatesEqual(props.values, lineStartValueCount, props.values.length / 4 - 1)
  ) {
    props.values.push(
      props.values[lineStartValueCount * 4] ?? 0,
      props.values[lineStartValueCount * 4 + 1] ?? 0,
      props.values[lineStartValueCount * 4 + 2] ?? 0,
      props.values[lineStartValueCount * 4 + 3] ?? 0
    );
  }
  props.valueOffsets.push(props.values.length / 4);
  props.sourceRowIndices.push(props.sourceRowIndex);
}

function appendDenseUnionCoordinate(
  values: number[],
  coordinateData: arrow.Data<arrow.FixedSizeList<arrow.Float32 | arrow.Float64>>,
  coordinateValues: Float32Array | Float64Array,
  coordinateComponentCount: 2 | 3 | 4,
  pointIndex: number
): void {
  const sourceOffset = ((coordinateData.offset ?? 0) + pointIndex) * coordinateComponentCount;
  const x = Number(coordinateValues[sourceOffset] ?? 0);
  const y = Number(coordinateValues[sourceOffset + 1] ?? 0);
  if (coordinateComponentCount === 3) {
    values.push(x, y, 0, Number(coordinateValues[sourceOffset + 2] ?? 0));
    return;
  }
  values.push(
    x,
    y,
    coordinateComponentCount >= 4 ? Number(coordinateValues[sourceOffset + 2] ?? 0) : 0,
    coordinateComponentCount >= 4 ? Number(coordinateValues[sourceOffset + 3] ?? 0) : 0
  );
}

function getDenseUnionChildCoordinateData(
  childPathData: arrow.Data<arrow.List<arrow.FixedSizeList<arrow.Float32 | arrow.Float64>>>
): {
  coordinateData: arrow.Data<arrow.FixedSizeList<arrow.Float32 | arrow.Float64>>;
  coordinateValues: Float32Array | Float64Array;
  coordinateComponentCount: 2 | 3 | 4;
} {
  if (!arrow.DataType.isList(childPathData.type)) {
    throw new Error('ArrowLineRenderer DenseUnion children must be List path rows');
  }
  const coordinateType = childPathData.type.children[0]?.type;
  if (!arrow.DataType.isFixedSizeList(coordinateType)) {
    throw new Error('ArrowLineRenderer DenseUnion path children must contain FixedSizeList rows');
  }
  const coordinateComponentCount = coordinateType.listSize;
  const coordinateValueType = coordinateType.children[0]?.type;
  if (
    (coordinateComponentCount !== 2 &&
      coordinateComponentCount !== 3 &&
      coordinateComponentCount !== 4) ||
    (!(coordinateValueType instanceof arrow.Float32) &&
      !(coordinateValueType instanceof arrow.Float64))
  ) {
    throw new Error(
      'ArrowLineRenderer DenseUnion path children must be List<FixedSizeList<Float32|Float64, 2 | 3 | 4>>'
    );
  }

  const coordinateData = childPathData.children[0] as arrow.Data<
    arrow.FixedSizeList<arrow.Float32 | arrow.Float64>
  >;
  const coordinateValueData = coordinateData.children[0] as
    | arrow.Data<arrow.Float32>
    | arrow.Data<arrow.Float64>;
  const coordinateValues = coordinateValueData.values;
  if (!(coordinateValues instanceof Float32Array) && !(coordinateValues instanceof Float64Array)) {
    throw new Error('ArrowLineRenderer DenseUnion path child values must be Float32 or Float64');
  }
  return {coordinateData, coordinateValues, coordinateComponentCount};
}

function normalizeDenseUnionLineColors(
  colors: arrow.Vector<ArrowLineColorType>,
  normalized: DenseUnionNormalizedLines
): arrow.Vector<ArrowLineColorType> {
  if (arrow.DataType.isFixedSizeList(colors.type)) {
    return repeatRowColorRows(
      colors as arrow.Vector<ArrowLineRowColorType>,
      normalized.sourceRowIndexChunks
    );
  }
  if (isDenseUnionLineRowMappingIdentity(normalized)) {
    return colors;
  }
  throw new Error(
    'ArrowLineRenderer DenseUnion split rows require row colors; vertex colors are only supported when each geometry row produces one line row'
  );
}

function normalizeDenseUnionLineTimestamps(
  timestamps: arrow.Vector<ArrowLineSourceTimestampType>,
  normalized: DenseUnionNormalizedLines
): arrow.Vector<ArrowLineSourceTimestampType> {
  if (isDenseUnionLineRowMappingIdentity(normalized)) {
    return timestamps;
  }
  throw new Error(
    'ArrowLineRenderer DenseUnion split rows do not support separate timestamp lists'
  );
}

function repeatFloat32Rows(
  source: arrow.Vector<arrow.Float32>,
  sourceRowIndexChunks: readonly Int32Array[]
): arrow.Vector<arrow.Float32> {
  const dataChunks = sourceRowIndexChunks.map(sourceRowIndices => {
    const values = new Float32Array(sourceRowIndices.length);
    for (let rowIndex = 0; rowIndex < sourceRowIndices.length; rowIndex++) {
      values[rowIndex] = Number(source.get(sourceRowIndices[rowIndex] ?? 0) ?? 0);
    }
    return arrow.makeData({
      type: new arrow.Float32(),
      length: values.length,
      data: values
    }) as arrow.Data<arrow.Float32>;
  });
  return new arrow.Vector(dataChunks);
}

function repeatRowColorRows(
  source: arrow.Vector<ArrowLineRowColorType>,
  sourceRowIndexChunks: readonly Int32Array[]
): arrow.Vector<ArrowLineRowColorType> {
  const dataChunks = sourceRowIndexChunks.map(sourceRowIndices => {
    const values = new Uint8Array(sourceRowIndices.length * 4);
    for (let rowIndex = 0; rowIndex < sourceRowIndices.length; rowIndex++) {
      const color = source.get(sourceRowIndices[rowIndex] ?? 0);
      if (!isVectorLike(color) || color.length !== 4) {
        throw new Error('ArrowLineRenderer row colors must be FixedSizeList<Uint8, 4>');
      }
      const valueOffset = rowIndex * 4;
      values[valueOffset] = Number(color.get(0) ?? 0);
      values[valueOffset + 1] = Number(color.get(1) ?? 0);
      values[valueOffset + 2] = Number(color.get(2) ?? 0);
      values[valueOffset + 3] = Number(color.get(3) ?? 0);
    }
    return makeArrowFixedSizeListVector(new arrow.Uint8(), 4, values)
      .data[0] as arrow.Data<ArrowLineRowColorType>;
  });
  return new arrow.Vector(dataChunks);
}

function isDenseUnionLineRowMappingIdentity(normalized: DenseUnionNormalizedLines): boolean {
  let outputRowIndex = 0;
  for (const sourceRowIndices of normalized.sourceRowIndexChunks) {
    for (const sourceRowIndex of sourceRowIndices) {
      if (sourceRowIndex !== outputRowIndex) {
        return false;
      }
      outputRowIndex++;
    }
  }
  return outputRowIndex === normalized.sourceRowCount;
}

function getDenseUnionGeometryKind(
  denseUnionType: arrow.DenseUnion,
  typeId: number,
  childIndex: number
): DenseUnionGeometryKind {
  const childName = denseUnionType.children[childIndex]?.name.toLowerCase().replace(/[^a-z]/g, '');
  if (childName?.includes('multilinestring')) {
    return 'MultiLineString';
  }
  if (childName?.includes('linestring')) {
    return 'LineString';
  }
  if (childName?.includes('multipolygon')) {
    return 'MultiPolygon';
  }
  if (childName?.includes('polygon')) {
    return 'Polygon';
  }
  return getGeoArrowGeometryKindFromTypeId(typeId);
}

function getGeoArrowGeometryKindFromTypeId(typeId: number): DenseUnionGeometryKind {
  switch (typeId % 10) {
    case 1:
      return 'Point';
    case 2:
      return 'LineString';
    case 3:
      return 'Polygon';
    case 4:
      return 'MultiPoint';
    case 5:
      return 'MultiLineString';
    case 6:
      return 'MultiPolygon';
    case 7:
      return 'GeometryCollection';
    default:
      throw new Error(`ArrowLineRenderer DenseUnion has unsupported GeoArrow type id ${typeId}`);
  }
}

function isGeometryKindEnabled(
  geometryKind: DenseUnionGeometryKind,
  mode: ArrowLineRendererMode
): boolean {
  return mode === 'polygons'
    ? geometryKind === 'Polygon' || geometryKind === 'MultiPolygon'
    : geometryKind === 'LineString' || geometryKind === 'MultiLineString';
}

function assertDenseUnionChildListData(data: arrow.Data, label: string): void {
  if (!arrow.DataType.isList(data.type)) {
    throw new Error(`ArrowLineRenderer DenseUnion ${label} must use List nesting`);
  }
}

function areOutputCoordinatesEqual(
  values: number[],
  firstPointIndex: number,
  secondPointIndex: number
): boolean {
  const firstOffset = firstPointIndex * 4;
  const secondOffset = secondPointIndex * 4;
  return (
    values[firstOffset] === values[secondOffset] &&
    values[firstOffset + 1] === values[secondOffset + 1] &&
    values[firstOffset + 2] === values[secondOffset + 2] &&
    values[firstOffset + 3] === values[secondOffset + 3]
  );
}

function isVectorLike(value: unknown): value is {
  length: number;
  get: (index: number) => unknown;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'length' in value &&
    'get' in value &&
    typeof (value as {get?: unknown}).get === 'function'
  );
}

function makePathListData(
  valueOffsets: Int32Array,
  values: Float32Array
): arrow.Data<ArrowLineCoordinateType> {
  const coordinateData = makeArrowFixedSizeListVector(new arrow.Float32(), 4, values)
    .data[0] as arrow.Data<arrow.FixedSizeList<arrow.Float32>>;
  const pathType = new arrow.List(new arrow.Field('coordinates', coordinateData.type, false));
  return new arrow.Data(
    pathType,
    0,
    valueOffsets.length - 1,
    0,
    {[arrow.BufferType.OFFSET]: valueOffsets},
    [coordinateData]
  ) as arrow.Data<ArrowLineCoordinateType>;
}

function getRequiredArrowVector<T extends arrow.DataType>(
  table: arrow.Table,
  columnName: string
): arrow.Vector<T> {
  const vector = table.getChild(columnName);
  if (!vector) {
    throw new Error(`ArrowLineRenderer data is missing Arrow column "${columnName}"`);
  }
  return vector as arrow.Vector<T>;
}

function getOptionalArrowVector<T extends arrow.DataType>(
  table: arrow.Table,
  columnName: string
): arrow.Vector<T> | undefined {
  const vector = table.getChild(columnName);
  return vector ? (vector as arrow.Vector<T>) : undefined;
}
