// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  AttributePathModel,
  StoragePathModel,
  StorageTripsPathModel,
  convertArrowPathsToAttribute,
  getArrowVectorByteLength,
  prepareArrowTemporalGPUVector,
  type ArrowPathPreparedState
} from '@luma.gl/arrow';
import {type CommandEncoder, type Device} from '@luma.gl/core';
import {GPURenderable, type GPUVector} from '@luma.gl/tables';
import * as arrow from 'apache-arrow';
import {
  createArrowPathShaderInputs,
  FS_GLSL,
  PATH_SHADER_LAYOUT,
  STORAGE_PATH_SHADER_LAYOUT,
  STORAGE_WGSL_SHADER,
  TRIPS_STORAGE_WGSL_SHADER,
  VS_GLSL,
  WGSL_SHADER
} from './arrow-path-shaders';

/** Path rendering path selected by the Arrow path example layer. */
export type ArrowPathRendererModel = 'attribute' | 'storage' | 'trips' | 'auto';
/** Concrete path rendering path after resolving `auto`. */
export type ArrowPathRendererResolvedModel = Exclude<ArrowPathRendererModel, 'auto'>;
/** Source time column mode used by the Arrow path example. */
export type ArrowPathRendererTimeColumn = 'none' | 'xyzm' | 'timestamps';
/** GPU-ready Float32 variable-length path coordinate type. */
export type ArrowPathCoordinateType = arrow.List<arrow.FixedSizeList<arrow.Float32>>;
/** CPU Float64 source path coordinate type converted before rendering. */
export type ArrowPathFloat64CoordinateType = arrow.List<arrow.FixedSizeList<arrow.Float64>>;
/** CPU source path coordinate type accepted by preparation helpers. */
export type ArrowPathSourceCoordinateType =
  | ArrowPathCoordinateType
  | ArrowPathFloat64CoordinateType;
/** GPU-ready per-vertex relative timestamp type. */
export type ArrowPathTimestampType = arrow.List<arrow.Float32>;
/** CPU source per-vertex absolute timestamp type. */
export type ArrowPathSourceTimestampType = arrow.List<arrow.TimestampMillisecond>;
/** Packed RGBA8 row color type. */
export type ArrowPathRowColorType = arrow.FixedSizeList<arrow.Uint8>;
/** Packed RGBA8 per-vertex color type. */
export type ArrowPathVertexColorType = arrow.List<arrow.FixedSizeList<arrow.Uint8>>;
/** Row or per-vertex path color source type. */
export type ArrowPathColorType = ArrowPathRowColorType | ArrowPathVertexColorType;
/** Concrete luma.gl path models owned by {@link ArrowPathRenderer}. */
export type ArrowPathRendererActiveModel =
  | AttributePathModel
  | StoragePathModel
  | StorageTripsPathModel;

/** CPU Arrow vectors accepted by Arrow path preparation helpers. */
export type ArrowPathRendererSourceVectors = {
  /** Variable-length path coordinate rows. */
  paths: arrow.Vector<ArrowPathSourceCoordinateType>;
  /** Optional row or per-vertex packed path colors. */
  colors?: arrow.Vector<ArrowPathColorType>;
  /** Optional per-row path widths. */
  widths?: arrow.Vector<arrow.Float32>;
  /** Optional per-vertex absolute timestamp rows. */
  timestamps?: arrow.Vector<ArrowPathSourceTimestampType>;
};

/** Prepared GPUVector data consumed by Arrow path models. */
export type ArrowPathRendererData = {
  /** GPU path coordinate rows. */
  paths: GPUVector<ArrowPathCoordinateType>;
  /** Optional GPU row or per-vertex colors. */
  colors?: GPUVector<ArrowPathColorType>;
  /** Optional GPU per-row widths. */
  widths?: GPUVector<arrow.Float32>;
  /** Optional GPU per-vertex relative timestamps. */
  timestamps?: GPUVector<ArrowPathTimestampType>;
  /** Optional view origins generated during coordinate normalization. */
  viewOrigins?: GPUVector<arrow.FixedSizeList<arrow.Float32>>;
  /** Prepared path state shared by attribute path rendering. */
  pathState: ArrowPathPreparedState;
  /** Releases all resources owned by this prepared data object. */
  destroy: () => void;
};

/** Prepared path data plus byte-size metrics shown by the example control panel. */
export type ArrowPathRendererInput = ArrowPathRendererData & {
  /** Required prepared widths vector for the example metrics and render paths. */
  widths: GPUVector<arrow.Float32>;
  /** Bytes occupied by path coordinate and timestamp Arrow source vectors. */
  pathArrowByteLength: number;
  /** Bytes occupied by style Arrow source vectors. */
  styleArrowByteLength: number;
};

/** CPU Arrow source plus metric metadata used by example data generation helpers. */
export type ArrowPathRendererSourceData = {
  /** Source vectors with required widths included by the example data generator. */
  sourceVectors: ArrowPathRendererSourceVectors & {
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
export type ArrowPathRendererPrepareDataProps = {
  /** Source Arrow vectors to prepare. */
  sourceVectors: ArrowPathRendererSourceVectors;
  /** Optional resource id prefix. */
  id?: string;
};

/** Notification emitted when a path record batch stream updates the layer. */
export type ArrowPathRendererRecordBatchStreamUpdate = {
  /** Full prepared input for all batches loaded so far. */
  pathInput: ArrowPathRendererInput;
  /** Number of loaded record batches. */
  loadedBatchCount: number;
  /** True for the first batch in a stream. */
  isFirstBatch: boolean;
  /** Result of applying the batch to layer props. */
  setPropsResult: ArrowPathRendererSetPropsResult;
};

/** Props for incrementally streaming Arrow path record batches. */
export type ArrowPathRendererRecordBatchStreamProps = {
  /** Async iterator that yields Arrow path record batches. */
  recordBatchIterator: AsyncIterator<arrow.RecordBatch>;
  /** Optional model selection applied when the first batch arrives. */
  model?: ArrowPathRendererModel;
  /** Optional time-column mode applied when the first batch arrives. */
  timeColumn?: ArrowPathRendererTimeColumn;
  /** Optional stream session used to cancel stale async streams. */
  streamingSession?: ArrowPathRendererStreamingSession;
  /** Redraw reason used for the first batch. */
  startRedrawReason?: string;
  /** Redraw reason used for appended batches. */
  appendRedrawReason?: string;
  /** Callback fired after each batch is prepared and applied. */
  onBatch?: (update: ArrowPathRendererRecordBatchStreamUpdate) => void;
};

/** Result returned by Arrow path layer prop updates. */
export type ArrowPathRendererSetPropsResult = {
  /** True when a new underlying path model was constructed. */
  modelChanged: boolean;
};

/** Token used to cancel stale Arrow path streaming work. */
export type ArrowPathRendererStreamingSession = {
  /** Monotonic stream version owned by the layer. */
  version: number;
};

type ArrowPathRendererSetPropsOptions = {
  preserveStreaming?: boolean;
};

/** Public configuration for the Arrow path example layer. */
export type ArrowPathRendererProps = {
  /** Debug label used for generated model resources. */
  id?: string;
  /** Prepared path data consumed by the layer. */
  data: ArrowPathRendererData;
  /** Path rendering path. */
  model?: ArrowPathRendererModel;
  /** Source time column mode. */
  timeColumn?: ArrowPathRendererTimeColumn;
  /** Current Trips timestamp in relative milliseconds. */
  currentTime?: number;
  /** Trips trail length in relative milliseconds. */
  trailLength?: number;
  /** Constant fallback RGBA path color. */
  color?: [number, number, number, number];
  /** Constant fallback path width. */
  width?: number;
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
export class ArrowPathRenderer extends GPURenderable<
  [Parameters<ArrowPathRendererActiveModel['draw']>[0]]
> {
  readonly device: Device;
  readonly shaderInputs = createArrowPathShaderInputs();
  props: ArrowPathRendererProps;
  model: ArrowPathRendererActiveModel;
  resolvedModel: ArrowPathRendererResolvedModel;
  private activeStreamingPathInput: ArrowPathRendererInput | null = null;
  private streamingSessionVersion = 0;
  private isDestroyed = false;

  constructor(device: Device, props: ArrowPathRendererProps) {
    super();
    this.device = device;
    this.props = props;
    this.resolvedModel = this.resolveModel(props.model ?? 'auto', props.timeColumn ?? 'xyzm');
    this.model = this.createModel(this.resolvedModel, props);
  }

  static async prepareData(
    device: Device,
    props: ArrowPathRendererPrepareDataProps
  ): Promise<ArrowPathRendererData> {
    const preparedTimestamps = props.sourceVectors.timestamps
      ? await prepareArrowTemporalGPUVector(device, props.sourceVectors.timestamps, {
          name: 'timestamps',
          id: `${props.id ?? 'arrow-path-renderer'}-timestamps`
        })
      : null;
    const prepared = await convertArrowPathsToAttribute(
      device,
      {
        paths: props.sourceVectors.paths,
        ...(props.sourceVectors.colors ? {colors: props.sourceVectors.colors} : {}),
        ...(props.sourceVectors.widths ? {widths: props.sourceVectors.widths} : {})
      },
      {
        id: props.id ?? 'arrow-path-renderer'
      }
    );

    return {
      paths: prepared.paths,
      ...(prepared.colors ? {colors: prepared.colors} : {}),
      ...(prepared.widths ? {widths: prepared.widths} : {}),
      ...(preparedTimestamps
        ? {timestamps: preparedTimestamps.temporal as GPUVector<ArrowPathTimestampType>}
        : {}),
      ...(prepared.viewOrigins ? {viewOrigins: prepared.viewOrigins} : {}),
      pathState: prepared.pathProps.pathState,
      destroy: () => {
        prepared.destroy();
        preparedTimestamps?.destroy();
      }
    };
  }

  setProps(
    props: Partial<ArrowPathRendererProps>,
    options: ArrowPathRendererSetPropsOptions = {}
  ): ArrowPathRendererSetPropsResult {
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
    const nextModel = this.resolveModel(
      nextProps.model ?? this.props.model ?? 'auto',
      nextProps.timeColumn ?? this.props.timeColumn ?? 'xyzm'
    );
    this.props = nextProps;

    if (props.currentTime !== undefined && this.model instanceof StorageTripsPathModel) {
      this.model.setProps({currentTime: props.currentTime});
    }

    const modelChanged =
      props.data !== undefined ||
      props.model !== undefined ||
      props.timeColumn !== undefined ||
      nextModel !== this.resolvedModel;

    if (!modelChanged) {
      streamingPathInputToDestroy?.destroy();
      return {modelChanged};
    }

    const previousModel = this.model;
    this.resolvedModel = nextModel;
    this.model = this.createModel(nextModel, nextProps);
    previousModel.destroy();
    streamingPathInputToDestroy?.destroy();
    return {modelChanged};
  }

  beginRecordBatchStream(): ArrowPathRendererStreamingSession {
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
    streamingSession = this.beginRecordBatchStream(),
    onBatch
  }: ArrowPathRendererRecordBatchStreamProps): Promise<void> {
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
      const pathInput = await prepareArrowPathInputFromRecordBatches(
        this.device,
        sourceRecordBatches
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
          ...(isFirstBatch && timeColumn ? {timeColumn} : {})
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
    const modelNeedsRedraw = this.model.needsRedraw();
    return rendererNeedsRedraw || modelNeedsRedraw;
  }

  override setNeedsRedraw(reason: string): void {
    super.setNeedsRedraw(reason);
    this.model.setNeedsRedraw(reason);
  }

  override predraw(commandEncoder: CommandEncoder): void {
    this.model.predraw(commandEncoder);
  }

  override draw(renderPass: Parameters<ArrowPathRendererActiveModel['draw']>[0]): void {
    this.model.draw(renderPass);
  }

  destroy(): void {
    this.isDestroyed = true;
    this.streamingSessionVersion++;
    const streamingPathInput = this.activeStreamingPathInput;
    this.activeStreamingPathInput = null;
    this.model.destroy();
    streamingPathInput?.destroy();
  }

  private resolveModel(
    modelKind: ArrowPathRendererModel,
    timeColumn: ArrowPathRendererTimeColumn
  ): ArrowPathRendererResolvedModel {
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

  private isRecordBatchStreamActive(streamingSession: ArrowPathRendererStreamingSession): boolean {
    return !this.isDestroyed && streamingSession.version === this.streamingSessionVersion;
  }

  private createModel(
    modelKind: ArrowPathRendererResolvedModel,
    props: ArrowPathRendererProps
  ): ArrowPathRendererActiveModel {
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
        throw new Error('ArrowPathRenderer trips model requires a timestamps column');
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

export async function prepareArrowPathInput(
  device: Device,
  sourceData: ArrowPathRendererSourceData
): Promise<ArrowPathRendererInput> {
  const {sourceVectors} = sourceData;
  const prepared = await ArrowPathRenderer.prepareData(device, {
    id: 'arrow-path-model',
    sourceVectors
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

export async function prepareArrowPathInputFromRecordBatches(
  device: Device,
  recordBatches: arrow.RecordBatch[]
): Promise<ArrowPathRendererInput> {
  const sourceTable = new arrow.Table(recordBatches);
  const paths = getRequiredArrowVector<ArrowPathSourceCoordinateType>(sourceTable, 'paths');
  const colors = getOptionalArrowVector<ArrowPathColorType>(sourceTable, 'colors');
  const widths = getRequiredArrowVector<arrow.Float32>(sourceTable, 'widths');
  const timestamps = getOptionalArrowVector<ArrowPathSourceTimestampType>(
    sourceTable,
    'timestamps'
  );

  return prepareArrowPathInput(device, {
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
  });
}

function getRequiredArrowVector<T extends arrow.DataType>(
  table: arrow.Table,
  columnName: string
): arrow.Vector<T> {
  const vector = table.getChild(columnName);
  if (!vector) {
    throw new Error(`ArrowPathRenderer data is missing Arrow column "${columnName}"`);
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
