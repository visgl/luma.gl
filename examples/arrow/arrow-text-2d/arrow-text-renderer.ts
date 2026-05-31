// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type CommandEncoder, type Device} from '@luma.gl/core';
import {indexColorPicking, indexPicking, supportsIndexPicking} from '@luma.gl/engine';
import {getArrowVectorByteLength, makeArrowGPURecordBatch, makeArrowGPUTable} from '@luma.gl/arrow';
import {GPURenderable, GPUVector, GPUTable} from '@luma.gl/tables';
import {
  AttributeTextModel,
  type ArrowUtf8TextType,
  type ArrowUtf8TextVector,
  DictionaryTextModel,
  RowIndexedStorageTextModel,
  StorageTextModel,
  type ArrowAttributeTextInputProps,
  type ArrowDictionaryStorageTextInputProps,
  type ArrowStorageTextInputProps,
  convertArrowTextToAttribute,
  convertArrowTextToAttributeModelProps,
  convertArrowTextToDictionary,
  convertArrowTextToDictionaryModelProps,
  convertArrowTextToStorage,
  convertArrowTextToStorageModelProps,
  type ConvertedArrowTextData,
  type FontSettings
} from '@luma.gl/text';
import * as arrow from 'apache-arrow';
import {
  createArrowTextShaderInputs,
  DICTIONARY_STORAGE_TEXT_SHADER_LAYOUT,
  DICTIONARY_STORAGE_WGSL_SHADER,
  FS_GLSL,
  ROW_INDEXED_STORAGE_TEXT_SHADER_LAYOUT,
  ROW_INDEXED_STORAGE_WGSL_SHADER,
  STORAGE_INDEXED_TEXT_SHADER_LAYOUT,
  STORAGE_INDEXED_WGSL_SHADER,
  STREAMING_TEXT_INPUT_SHADER_LAYOUT,
  TEXT_SHADER_LAYOUT,
  VS_GLSL,
  WGSL_SHADER
} from './arrow-text-shaders';

/**
 * Public configuration props for an Arrow text layer.
 *
 * `data` is an optional Arrow table or record-batch source. The source vector fields are top-level
 * props: pass strings to select columns from `data`, or pass Arrow vectors directly when no table
 * source is provided. Optional style behavior is inferred from the presence of the corresponding
 * source prop; set an optional source prop to `null` to disable it.
 */
export type ArrowTextRendererProps = {
  /** Debug label used for generated model and GPU resources. */
  id?: string;
  /** Optional Arrow table, table promise, iterable, async iterable, iterator, or async iterator. */
  data?: ArrowTextRendererRecordBatchSource;
  /** Label origins, or the source table column name. Defaults to `positions` when `data` exists. */
  positions?: string | arrow.Vector<arrow.FixedSizeList<arrow.Float32>>;
  /** Text labels, or the source table column name. Defaults to `texts` when `data` exists. */
  texts?: string | ArrowUtf8TextVector;
  /** Clip rectangles, source table column name, or `null` to disable clipping. */
  clipRects?: string | arrow.Vector<arrow.FixedSizeList<arrow.Int16>> | null;
  /** Row/character colors, source table column name, or `null` to disable colors. */
  colors?: string | arrow.Vector<RowColorColumnDataType | CharacterColorDataType> | null;
  /** Row angles, source table column name, or `null` to disable per-row rotation. */
  angles?: string | arrow.Vector<arrow.Float32> | null;
  /** Row sizes, source table column name, or `null` to disable per-row sizing. */
  sizes?: string | arrow.Vector<arrow.Float32> | null;
  /** Pixel offsets, source table column name, or `null` to disable pixel offsets. */
  pixelOffsets?: string | arrow.Vector<arrow.FixedSizeList<arrow.Float32>> | null;
  /** Text model path. `auto` prefers WebGPU storage paths when the source shape supports them. */
  model?: 'attribute' | 'storage' | 'storage-row-indexed' | 'dictionary' | 'auto';
  /** Fixed character set used by text atlas/layout preparation. */
  characterSet?: string;
  /** Font atlas settings forwarded to the luma.gl text models. */
  fontSettings?: FontSettings;
  /** Constant fallback RGBA color used when no row color vector is present. */
  color?: [number, number, number, number];
  /** Constant fallback row angle in degrees used when no row angle vector is present. */
  angle?: number;
  /** Constant fallback row text size used when no row size vector is present. */
  size?: number;
};

/** Arrow row color column type: one packed RGBA8 color per text row. */
export type RowColorColumnDataType = arrow.FixedSizeList<arrow.Uint8>;

/** Arrow character color column type: one packed RGBA8 color per glyph in each text row. */
export type CharacterColorDataType = arrow.List<arrow.FixedSizeList<arrow.Uint8>>;

/** Concrete luma.gl text model instances owned by {@link ArrowTextRenderer}. */
export type ArrowTextRendererActiveModel =
  | AttributeTextModel
  | StorageTextModel
  | DictionaryTextModel;

/** Prepared GPUVector text data returned by Arrow conversion helpers. */
export type ArrowTextRendererData = ConvertedArrowTextData;

/** CPU Arrow source plus byte-size metadata used by legacy preparation helpers. */
export type ArrowTextRendererSource = {
  /** Label origins aligned row-for-row with `texts`. */
  positions: arrow.Vector<arrow.FixedSizeList<arrow.Float32>>;
  /** Plain UTF-8 or dictionary-encoded UTF-8 labels. */
  texts: ArrowUtf8TextVector;
  /** Optional row or character colors. */
  colors?: arrow.Vector<RowColorColumnDataType | CharacterColorDataType>;
  /** Optional per-row rotation angles. */
  angles?: arrow.Vector<arrow.Float32>;
  /** Optional per-row text sizes. */
  sizes?: arrow.Vector<arrow.Float32>;
  /** Optional per-row pixel offsets. */
  pixelOffsets?: arrow.Vector<arrow.FixedSizeList<arrow.Float32>>;
  /** Optional per-row clip rectangles. */
  clipRects?: arrow.Vector<arrow.FixedSizeList<arrow.Int16>>;
  /** Byte length of the primary Arrow text vector. */
  arrowVectorByteLength: number;
};

/** Prepared layer data plus source byte-size metadata shown by the example control panel. */
export type ArrowTextRendererInput = ArrowTextRendererData & {
  /** Byte length of the primary Arrow text vector. */
  arrowVectorByteLength: number;
};

/** Arrow table or record-batch source accepted by async preparation and streaming helpers. */
export type ArrowTextRendererRecordBatchSource =
  | arrow.Table
  | Promise<arrow.Table>
  | Iterable<arrow.RecordBatch>
  | AsyncIterable<arrow.RecordBatch>
  | Iterator<arrow.RecordBatch>
  | AsyncIterator<arrow.RecordBatch>;

/** Props for preparing GPUVector text input from an Arrow table or record-batch source. */
export type ArrowTextRendererPrepareInputProps = Pick<
  ArrowTextRendererProps,
  'data' | 'positions' | 'texts' | 'clipRects' | 'colors' | 'angles' | 'sizes' | 'pixelOffsets'
>;

/** Props for preparing GPUVector text data from explicit Arrow vectors. */
export type ArrowTextRendererPrepareDataProps = Pick<
  ArrowTextRendererSource,
  'positions' | 'texts' | 'clipRects' | 'colors' | 'angles' | 'sizes' | 'pixelOffsets'
>;

/** Props for preparing layer data from an existing GPU table and matching Arrow batches. */
export type ArrowTextRendererPrepareGPUTableDataProps = {
  /** GPU table containing uploaded columns selected by `columns`. */
  gpuTable: GPUTable;
  /** CPU Arrow batches that back `gpuTable` and provide text metadata. */
  recordBatches: arrow.RecordBatch[];
  /** Source vector or column selector props. */
  props: ArrowTextRendererPrepareInputProps;
};

/** Result returned by prop updates and streaming appends. */
export type ArrowTextRendererSetPropsResult = {
  /** True when a new underlying text model was constructed. */
  modelChanged: boolean;
};

/** Token used to cancel stale async streaming work. */
export type ArrowTextRendererStreamingSession = {
  /** Monotonic version owned by the layer. */
  version: number;
};

/** Notification emitted when a streaming record batch is uploaded and applied. */
export type ArrowTextRendererRecordBatchStreamUpdate = {
  /** Full prepared input for all batches loaded so far. */
  textInput: ArrowTextRendererInput;
  /** Number of uploaded GPU table batches. */
  loadedBatchCount: number;
  /** True for the first batch in a stream. */
  isFirstBatch: boolean;
  /** Result of applying the batch to layer props. */
  setPropsResult: ArrowTextRendererSetPropsResult;
};

/** Props for incrementally uploading record batches into a text layer. */
export type ArrowTextRendererRecordBatchStreamProps = {
  /** Preferred record-batch source. */
  data?: ArrowTextRendererRecordBatchSource;
  /** Deprecated alias retained for existing example code. Prefer `data`. */
  recordBatchIterator?: Iterator<arrow.RecordBatch> | AsyncIterator<arrow.RecordBatch>;
  /** Fixed model selection or callback invoked after each batch is prepared. */
  model?:
    | ArrowTextRendererProps['model']
    | ((textInput: ArrowTextRendererInput) => ArrowTextRendererProps['model']);
  /** Optional adapter for deriving render input, for example by omitting disabled style vectors. */
  mapTextInput?: (textInput: ArrowTextRendererInput) => ArrowTextRendererInput;
  /** Optional stream session used to cancel stale async streams. */
  streamingSession?: ArrowTextRendererStreamingSession;
  /** Redraw reason used for the first batch. */
  startRedrawReason?: string;
  /** Redraw reason used for appended batches. */
  appendRedrawReason?: string;
  /** Callback fired after a batch is prepared and applied. */
  onBatch?: (update: ArrowTextRendererRecordBatchStreamUpdate) => void;
};

type ArrowTextRendererSetPropsOptions = {
  preserveStreaming?: boolean;
};

type ArrowTextRendererResolvedModel = Exclude<NonNullable<ArrowTextRendererProps['model']>, 'auto'>;
type ResolvedArrowTextRendererColumns = {
  positions: string;
  texts: string;
  clipRects: string | null;
  colors: string | null;
  angles: string | null;
  sizes: string | null;
  pixelOffsets: string | null;
};

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

const DEFAULT_COLUMNS: ResolvedArrowTextRendererColumns = {
  positions: 'positions',
  texts: 'texts',
  clipRects: 'clipRects',
  colors: 'colors',
  angles: 'angles',
  sizes: 'sizes',
  pixelOffsets: 'pixelOffsets'
};
const DEFAULT_TEXT_COLOR: [number, number, number, number] = [128, 128, 128, 255];
const DEFAULT_TEXT_ANGLE = 0;
const DEFAULT_TEXT_SIZE = 32;

/**
 * Small example-layer wrapper that chooses between attribute, WebGPU storage, row-indexed
 * storage, and dictionary text models from prepared Arrow/GPUVector inputs.
 */
export class ArrowTextRenderer extends GPURenderable<
  [Parameters<ArrowTextRendererActiveModel['draw']>[0]]
> {
  /** Device used for all GPU resources owned by this layer. */
  readonly device: Device;
  /** Shared shader inputs used by rendering, picking, and viewport uniforms. */
  readonly shaderInputs = createArrowTextShaderInputs();
  /** Last applied layer props. */
  props: ArrowTextRendererProps;
  /** Prepared GPUVector text input currently consumed by the active model. */
  textInput: ArrowTextRendererInput;
  /** Active luma.gl text model. Recreated when data or model selection changes. */
  model: ArrowTextRendererActiveModel;
  /** Concrete model path after resolving `props.model === 'auto'`. */
  resolvedModel: ArrowTextRendererResolvedModel;
  private activeStreamingTextTable: GPUTable | null = null;
  private streamingSessionVersion = 0;
  private isDestroyed = false;

  /** Creates a layer from Arrow source props after GPUVector preparation. */
  private constructor(
    device: Device,
    props: ArrowTextRendererProps,
    textInput: ArrowTextRendererInput
  ) {
    super();
    this.device = device;
    this.props = props;
    this.textInput = textInput;
    this.resolvedModel = this.resolveModel(this.props.model ?? 'auto', this.textInput);
    this.model = this.createModel(this.resolvedModel, this.props, this.textInput);
  }

  /** Resolves table or record-batch source props, prepares GPUVectors, and constructs a layer. */
  static async create(device: Device, props: ArrowTextRendererProps): Promise<ArrowTextRenderer> {
    return new ArrowTextRenderer(device, props, await prepareArrowTextInputFromData(device, props));
  }

  /** Uploads explicit Arrow source vectors and selects the best prepared data representation. */
  static prepareData(
    device: Device,
    props: ArrowTextRendererPrepareDataProps
  ): ArrowTextRendererData {
    const sourceVectors = getArrowTextSourceVectors(props);
    const hasCharacterColors = isArrowTextCharacterColorType(sourceVectors.colors?.type);
    if (arrow.DataType.isDictionary(sourceVectors.texts.type) && !hasCharacterColors) {
      return convertArrowTextToDictionary(device, {sourceVectors});
    }
    if (!hasCharacterColors) {
      return convertArrowTextToStorage(device, {sourceVectors});
    }
    return convertArrowTextToAttribute(device, {sourceVectors});
  }

  /** Wraps an existing GPU table plus matching Arrow batches as prepared layer data. */
  static prepareDataFromGPUTable(
    props: ArrowTextRendererPrepareGPUTableDataProps
  ): ArrowTextRendererData {
    const columns = getResolvedColumnSelectors(props.props);
    const sourceTable = new arrow.Table(props.recordBatches);
    const positions = getRequiredArrowVector<arrow.FixedSizeList<arrow.Float32>>(
      sourceTable,
      columns.positions
    );
    const texts = getRequiredArrowVector<ArrowUtf8TextType>(sourceTable, columns.texts);
    const clipRects = getOptionalArrowVector<arrow.FixedSizeList<arrow.Int16>>(
      sourceTable,
      columns.clipRects
    );
    const colors = getOptionalArrowVector<RowColorColumnDataType | CharacterColorDataType>(
      sourceTable,
      columns.colors
    );
    const angles = getOptionalArrowVector<arrow.Float32>(sourceTable, columns.angles);
    const sizes = getOptionalArrowVector<arrow.Float32>(sourceTable, columns.sizes);
    const pixelOffsets = getOptionalArrowVector<arrow.FixedSizeList<arrow.Float32>>(
      sourceTable,
      columns.pixelOffsets
    );

    return {
      positions: getRequiredGPUVector(props.gpuTable, columns.positions),
      texts: getRequiredGPUVector(props.gpuTable, columns.texts),
      ...(clipRects
        ? {
            clipRects: getOptionalGPUVector(props.gpuTable, columns.clipRects)
          }
        : {}),
      ...(colors
        ? {
            colors: getOptionalGPUVector(props.gpuTable, columns.colors)
          }
        : {}),
      ...(angles ? {angles: getOptionalGPUVector(props.gpuTable, columns.angles)} : {}),
      ...(sizes ? {sizes: getOptionalGPUVector(props.gpuTable, columns.sizes)} : {}),
      ...(pixelOffsets
        ? {
            pixelOffsets: getOptionalGPUVector(props.gpuTable, columns.pixelOffsets)
          }
        : {}),
      sourceVectors: {
        positions,
        texts,
        ...(clipRects ? {clipRects} : {}),
        ...(colors ? {colors} : {}),
        ...(angles ? {angles} : {}),
        ...(sizes ? {sizes} : {}),
        ...(pixelOffsets ? {pixelOffsets} : {})
      },
      destroy: () => {}
    };
  }

  /**
   * Applies prop updates, prepares new Arrow/GPUVector input when the source changes, and rebuilds
   * the active model when data, model selection, or constant style fallbacks change.
   */
  async setProps(
    props: Partial<ArrowTextRendererProps>,
    redrawReason = 'ArrowTextRenderer props changed',
    options: ArrowTextRendererSetPropsOptions = {}
  ): Promise<ArrowTextRendererSetPropsResult> {
    const previousProps = this.props;
    const nextProps = {...this.props, ...props};
    const hasModelPropChanged = props.model !== undefined && props.model !== previousProps.model;
    const shouldCancelStreaming =
      !options.preserveStreaming &&
      ((props.data !== undefined && props.data !== previousProps.data) || hasModelPropChanged);
    const streamingTextTableToDestroy = shouldCancelStreaming
      ? this.activeStreamingTextTable
      : null;
    if (shouldCancelStreaming) {
      this.streamingSessionVersion++;
      this.activeStreamingTextTable = null;
    }
    const hasSourcePropsChanged = hasArrowTextSourcePropsChanged(props);
    const shouldPrepareTextInput = hasSourcePropsChanged || hasModelPropChanged;
    const nextTextInput = hasSourcePropsChanged
      ? await prepareArrowTextInputFromData(this.device, nextProps)
      : hasModelPropChanged
        ? prepareArrowTextInputFromSourceVectors(this.device, this.textInput)
        : this.textInput;
    const nextModel = this.resolveModel(
      nextProps.model ?? this.props.model ?? 'auto',
      nextTextInput
    );
    const modelChanged =
      shouldPrepareTextInput ||
      (props.model !== undefined && props.model !== previousProps.model) ||
      hasArrowTextConstantStylePropsChanged(props, previousProps) ||
      nextModel !== this.resolvedModel;
    const needsRedraw = modelChanged;

    if (!modelChanged) {
      this.props = nextProps;
      if (needsRedraw) {
        this.model.setNeedsRedraw(redrawReason);
      }
      streamingTextTableToDestroy?.destroy();
      return {modelChanged};
    }

    const previousModel = this.model;
    const previousTextInput = this.textInput;
    const nextTextModel = this.createModel(nextModel, nextProps, nextTextInput);
    this.props = nextProps;
    this.textInput = nextTextInput;
    this.resolvedModel = nextModel;
    this.model = nextTextModel;
    previousModel.destroy();
    if (previousTextInput !== nextTextInput) {
      previousTextInput.destroy();
    }
    streamingTextTableToDestroy?.destroy();
    this.model.setNeedsRedraw(redrawReason);
    return {modelChanged};
  }

  /** Replaces layer data with appended text batches. */
  appendTextBatches(
    data: ArrowTextRendererRecordBatchSource,
    redrawReason: string
  ): Promise<ArrowTextRendererSetPropsResult> {
    return this.setProps({data}, redrawReason);
  }

  /** Starts a new streaming session and invalidates any older session token. */
  beginRecordBatchStream(): ArrowTextRendererStreamingSession {
    this.streamingSessionVersion++;
    return {version: this.streamingSessionVersion};
  }

  /** Cancels any active record-batch stream. */
  cancelRecordBatchStream(): void {
    this.streamingSessionVersion++;
  }

  /** Incrementally uploads record batches and applies the growing prepared data to the layer. */
  async streamRecordBatches({
    data,
    recordBatchIterator,
    model: requestedModel,
    mapTextInput,
    streamingSession = this.beginRecordBatchStream(),
    startRedrawReason = 'streaming text dataset started',
    appendRedrawReason = 'streaming Arrow record batch appended',
    onBatch
  }: ArrowTextRendererRecordBatchStreamProps): Promise<void> {
    const resolvedRecordBatchIterator = getArrowRecordBatchAsyncIterator(
      data ?? recordBatchIterator
    );
    const sourceRecordBatches: arrow.RecordBatch[] = [];
    let streamingTextTable: GPUTable | null = null;
    let isSourceVectorStreaming = false;
    let hasStartedStreaming = false;

    if (!this.isRecordBatchStreamActive(streamingSession)) {
      return;
    }

    for (
      let recordBatchResult = await resolvedRecordBatchIterator.next();
      !recordBatchResult.done;
      recordBatchResult = await resolvedRecordBatchIterator.next()
    ) {
      if (!this.isRecordBatchStreamActive(streamingSession)) {
        return;
      }

      const recordBatch = recordBatchResult.value;
      const isFirstBatch = !hasStartedStreaming;
      sourceRecordBatches.push(recordBatch);

      if (isFirstBatch) {
        const previousStreamingTextTable = this.activeStreamingTextTable;
        isSourceVectorStreaming = shouldPrepareRecordBatchesFromArrowVectors(
          sourceRecordBatches,
          this.props
        );
        if (!isSourceVectorStreaming) {
          streamingTextTable = createArrowTextGPUTable(this.device, recordBatch, this.props);
          this.activeStreamingTextTable = streamingTextTable;
        } else {
          this.activeStreamingTextTable = null;
        }
        hasStartedStreaming = true;
        const textInput = isSourceVectorStreaming
          ? prepareArrowTextInputFromRecordBatches(this.device, sourceRecordBatches, this.props)
          : prepareArrowTextInputFromGPUTable(streamingTextTable!, sourceRecordBatches, this.props);
        const model =
          typeof requestedModel === 'function' ? requestedModel(textInput) : requestedModel;
        const layerTextInput = mapTextInput?.(textInput) ?? textInput;
        const setPropsResult = this.setPreparedTextInput(
          {
            ...this.props,
            data: sourceRecordBatches.slice(),
            ...(model ? {model} : {})
          },
          layerTextInput,
          startRedrawReason,
          {preserveStreaming: true}
        );
        previousStreamingTextTable?.destroy();
        onBatch?.({
          textInput,
          loadedBatchCount: isSourceVectorStreaming
            ? sourceRecordBatches.length
            : streamingTextTable!.batches.length,
          isFirstBatch: true,
          setPropsResult
        });
        continue;
      }

      if (!isSourceVectorStreaming) {
        appendArrowTextGPUTableBatch(this.device, streamingTextTable!, recordBatch, this.props);
      }
      const textInput = isSourceVectorStreaming
        ? prepareArrowTextInputFromRecordBatches(this.device, sourceRecordBatches, this.props)
        : prepareArrowTextInputFromGPUTable(streamingTextTable!, sourceRecordBatches, this.props);
      const layerTextInput = mapTextInput?.(textInput) ?? textInput;
      const setPropsResult = this.setPreparedTextInput(
        {...this.props, data: sourceRecordBatches.slice()},
        layerTextInput,
        appendRedrawReason,
        {preserveStreaming: true}
      );
      onBatch?.({
        textInput,
        loadedBatchCount: isSourceVectorStreaming
          ? sourceRecordBatches.length
          : streamingTextTable!.batches.length,
        isFirstBatch: false,
        setPropsResult
      });
    }
  }

  private setPreparedTextInput(
    nextProps: ArrowTextRendererProps,
    nextTextInput: ArrowTextRendererInput,
    redrawReason: string,
    options: ArrowTextRendererSetPropsOptions = {}
  ): ArrowTextRendererSetPropsResult {
    const previousProps = this.props;
    const shouldCancelStreaming =
      !options.preserveStreaming &&
      nextProps.data !== undefined &&
      nextProps.data !== previousProps.data;
    const streamingTextTableToDestroy = shouldCancelStreaming
      ? this.activeStreamingTextTable
      : null;
    if (shouldCancelStreaming) {
      this.streamingSessionVersion++;
      this.activeStreamingTextTable = null;
    }
    const nextModel = this.resolveModel(
      nextProps.model ?? this.props.model ?? 'auto',
      nextTextInput
    );
    const modelChanged =
      nextTextInput !== this.textInput ||
      nextProps.model !== previousProps.model ||
      nextModel !== this.resolvedModel;

    if (!modelChanged) {
      this.props = nextProps;
      streamingTextTableToDestroy?.destroy();
      return {modelChanged};
    }

    const previousModel = this.model;
    const previousTextInput = this.textInput;
    const nextTextModel = this.createModel(nextModel, nextProps, nextTextInput);
    this.props = nextProps;
    this.textInput = nextTextInput;
    this.resolvedModel = nextModel;
    this.model = nextTextModel;
    previousModel.destroy();
    if (previousTextInput !== nextTextInput) {
      previousTextInput.destroy();
    }
    streamingTextTableToDestroy?.destroy();
    this.model.setNeedsRedraw(redrawReason);
    return {modelChanged};
  }

  /** Returns the active model redraw reason, or `false` when no redraw is needed. */
  override needsRedraw(): string | false {
    const rendererNeedsRedraw = super.needsRedraw();
    const modelNeedsRedraw = this.model.needsRedraw();
    return rendererNeedsRedraw || modelNeedsRedraw;
  }

  /** Marks the active model as needing redraw. */
  override setNeedsRedraw(reason: string): void {
    super.setNeedsRedraw(reason);
    this.model.setNeedsRedraw(reason);
  }

  /** Runs active model pre-draw work such as compute expansion. */
  override predraw(commandEncoder: CommandEncoder): void {
    this.model.predraw(commandEncoder);
  }

  /** Draws the active text model into a render pass. */
  override draw(renderPass: Parameters<ArrowTextRendererActiveModel['draw']>[0]): void {
    this.model.draw(renderPass);
  }

  /** Destroys owned model resources and cancels active streaming work. */
  destroy(): void {
    this.isDestroyed = true;
    this.streamingSessionVersion++;
    const streamingTextTable = this.activeStreamingTextTable;
    this.activeStreamingTextTable = null;
    this.model.destroy();
    this.textInput.destroy();
    streamingTextTable?.destroy();
  }

  private createModel(
    modelKind: ArrowTextRendererResolvedModel,
    props: ArrowTextRendererProps,
    data: ArrowTextRendererData
  ): ArrowTextRendererActiveModel {
    const color = props.color ?? DEFAULT_TEXT_COLOR;
    const angle = props.angle ?? DEFAULT_TEXT_ANGLE;
    const size = props.size ?? DEFAULT_TEXT_SIZE;
    const commonProps = {
      id: props.id,
      characterSet: props.characterSet,
      fontSettings: props.fontSettings,
      shaderInputs: this.shaderInputs,
      modules: getArrowTextRenderModules(this.device) as never,
      parameters: DEFAULT_RENDER_PARAMETERS,
      color,
      angle,
      size
    };

    if (modelKind === 'dictionary') {
      return new DictionaryTextModel(
        this.device,
        convertArrowTextToDictionaryModelProps(this.device, {
          ...this.getStorageInputProps(data),
          ...commonProps,
          source: DICTIONARY_STORAGE_WGSL_SHADER,
          shaderLayout: DICTIONARY_STORAGE_TEXT_SHADER_LAYOUT
        } as unknown as ArrowDictionaryStorageTextInputProps)
      );
    }

    if (modelKind === 'storage' || modelKind === 'storage-row-indexed') {
      const StorageModel =
        modelKind === 'storage-row-indexed' ? RowIndexedStorageTextModel : StorageTextModel;
      return new StorageModel(
        this.device,
        convertArrowTextToStorageModelProps(this.device, {
          ...this.getStorageInputProps(data),
          ...commonProps,
          rowIndexColumn: modelKind === 'storage-row-indexed',
          source:
            modelKind === 'storage-row-indexed'
              ? ROW_INDEXED_STORAGE_WGSL_SHADER
              : STORAGE_INDEXED_WGSL_SHADER,
          shaderLayout:
            modelKind === 'storage-row-indexed'
              ? ROW_INDEXED_STORAGE_TEXT_SHADER_LAYOUT
              : STORAGE_INDEXED_TEXT_SHADER_LAYOUT
        } as unknown as ArrowStorageTextInputProps)
      );
    }

    return new AttributeTextModel(
      this.device,
      convertArrowTextToAttributeModelProps(this.device, {
        ...this.getInputProps(data),
        ...commonProps,
        source: WGSL_SHADER,
        vs: VS_GLSL,
        fs: FS_GLSL,
        shaderLayout: TEXT_SHADER_LAYOUT
      } as unknown as ArrowAttributeTextInputProps)
    );
  }

  private resolveModel(
    modelKind: NonNullable<ArrowTextRendererProps['model']>,
    data: ArrowTextRendererData
  ): ArrowTextRendererResolvedModel {
    const hasCharacterColors = isArrowTextCharacterColorType(data.sourceVectors.colors?.type);
    const hasDictionaryText = arrow.DataType.isDictionary(data.sourceVectors.texts.type);
    if (modelKind === 'auto') {
      if (this.device.type === 'webgpu' && hasDictionaryText && !hasCharacterColors) {
        return 'dictionary';
      }
      if (this.device.type === 'webgpu' && !hasCharacterColors) {
        return 'storage';
      }
      return 'attribute';
    }
    if (modelKind !== 'attribute' && (this.device.type !== 'webgpu' || hasCharacterColors)) {
      return 'attribute';
    }
    if (modelKind === 'dictionary' && !hasDictionaryText) {
      return 'attribute';
    }
    return modelKind;
  }

  private isRecordBatchStreamActive(streamingSession: ArrowTextRendererStreamingSession): boolean {
    return !this.isDestroyed && streamingSession.version === this.streamingSessionVersion;
  }

  private getInputProps(data: ArrowTextRendererData): Partial<ArrowAttributeTextInputProps> {
    const inputProps = {
      positions: data.positions,
      texts: data.texts,
      sourceVectors: data.sourceVectors,
      ...(data.clipRects ? {clipRects: data.clipRects} : {}),
      ...(data.colors ? {colors: data.colors} : {}),
      ...(data.angles ? {angles: data.angles} : {}),
      ...(data.sizes ? {sizes: data.sizes} : {}),
      ...(data.pixelOffsets ? {pixelOffsets: data.pixelOffsets} : {})
    };
    return inputProps as unknown as Partial<ArrowAttributeTextInputProps>;
  }

  private getStorageInputProps(
    data: ArrowTextRendererData
  ): Partial<ArrowStorageTextInputProps & ArrowDictionaryStorageTextInputProps> {
    const inputProps = {
      positions: data.positions,
      texts: data.texts,
      sourceVectors: {
        texts: data.sourceVectors.texts,
        ...(data.sourceVectors.clipRects ? {clipRects: data.sourceVectors.clipRects} : {})
      },
      ...(data.clipRects ? {clipRects: data.clipRects} : {}),
      ...(data.colors ? {colors: data.colors} : {}),
      ...(data.angles ? {angles: data.angles} : {}),
      ...(data.sizes ? {sizes: data.sizes} : {}),
      ...(data.pixelOffsets ? {pixelOffsets: data.pixelOffsets} : {})
    };
    return inputProps as unknown as Partial<
      ArrowStorageTextInputProps & ArrowDictionaryStorageTextInputProps
    >;
  }
}

/** Uploads explicit Arrow source vectors and attaches example metric metadata. */
export function prepareArrowTextInput(
  device: Device,
  textSource: ArrowTextRendererSource
): ArrowTextRendererInput {
  const prepared = ArrowTextRenderer.prepareData(device, textSource);
  return {
    ...prepared,
    arrowVectorByteLength: textSource.arrowVectorByteLength
  };
}

/** Uploads a single Arrow record batch as the first batch of a streaming GPU table. */
export function createArrowTextGPUTable(
  device: Device,
  recordBatch: arrow.RecordBatch,
  props: ArrowTextRendererPrepareInputProps = {}
): GPUTable {
  return makeArrowGPUTable(device, new arrow.Table([recordBatch]), {
    shaderLayout: getStreamingTextInputShaderLayout(props)
  });
}

/** Uploads an Arrow table as a GPU table using the text input shader layout. */
export function createArrowTextGPUTableFromTable(
  device: Device,
  table: arrow.Table,
  props: ArrowTextRendererPrepareInputProps = {}
): GPUTable {
  return makeArrowGPUTable(device, table, {
    shaderLayout: getStreamingTextInputShaderLayout(props)
  });
}

/** Appends one Arrow record batch to an existing streaming GPU table. */
export function appendArrowTextGPUTableBatch(
  device: Device,
  gpuTable: GPUTable,
  recordBatch: arrow.RecordBatch,
  props: ArrowTextRendererPrepareInputProps = {}
): void {
  gpuTable.addBatch(
    makeArrowGPURecordBatch(device, recordBatch, {
      shaderLayout: getStreamingTextInputShaderLayout(props)
    })
  );
}

/** Builds prepared text input from an existing GPU table and its matching CPU Arrow batches. */
export function prepareArrowTextInputFromGPUTable(
  gpuTable: GPUTable,
  recordBatches: arrow.RecordBatch[],
  props: ArrowTextRendererPrepareInputProps = {}
): ArrowTextRendererInput {
  const sourceTable = new arrow.Table(recordBatches);
  const resolvedColumns = getResolvedColumnSelectors(props);
  const texts = sourceTable.getChild(resolvedColumns.texts);
  if (!texts) {
    throw new Error('Streaming Arrow text input requires complete CPU source vectors');
  }
  const prepared = ArrowTextRenderer.prepareDataFromGPUTable({
    gpuTable,
    recordBatches,
    props
  });
  return {
    ...prepared,
    arrowVectorByteLength: getArrowVectorByteLength(texts as ArrowUtf8TextVector)
  };
}

function prepareArrowTextInputFromRecordBatches(
  device: Device,
  recordBatches: arrow.RecordBatch[],
  props: ArrowTextRendererPrepareInputProps
): ArrowTextRendererInput {
  const sourceVectors = getArrowTextSourceVectorsFromTable(new arrow.Table(recordBatches), props);
  const prepared = ArrowTextRenderer.prepareData(device, sourceVectors);
  return {
    ...prepared,
    arrowVectorByteLength: getArrowVectorByteLength(sourceVectors.texts)
  };
}

function prepareArrowTextInputFromSourceVectors(
  device: Device,
  textInput: ArrowTextRendererInput
): ArrowTextRendererInput {
  const prepared = ArrowTextRenderer.prepareData(device, textInput.sourceVectors);
  return {
    ...prepared,
    arrowVectorByteLength: textInput.arrowVectorByteLength
  };
}

/** Resolves table or record-batch source data, uploads it, and returns prepared text input. */
export async function prepareArrowTextInputFromData(
  device: Device,
  props: ArrowTextRendererPrepareInputProps
): Promise<ArrowTextRendererInput> {
  if (!props.data) {
    const sourceVectors = getArrowTextSourceVectors(props);
    const prepared = ArrowTextRenderer.prepareData(device, sourceVectors);
    return {
      ...prepared,
      arrowVectorByteLength: getArrowVectorByteLength(sourceVectors.texts)
    };
  }

  const recordBatches = await getArrowRecordBatches(props.data);
  if (recordBatches.length === 0) {
    throw new Error('ArrowTextRenderer data requires at least one Arrow record batch');
  }
  if (shouldPrepareRecordBatchesFromArrowVectors(recordBatches, props)) {
    return prepareArrowTextInputFromRecordBatches(device, recordBatches, props);
  }

  const table = new arrow.Table(recordBatches);
  const gpuTable = createArrowTextGPUTableFromTable(device, table, props);
  const prepared = prepareArrowTextInputFromGPUTable(gpuTable, recordBatches, props);
  const destroyPrepared = prepared.destroy;
  let destroyed = false;

  return {
    ...prepared,
    destroy: () => {
      if (destroyed) {
        return;
      }
      destroyed = true;
      destroyPrepared();
      gpuTable.destroy();
    }
  };
}

function getRequiredArrowVector<T extends arrow.DataType>(
  table: arrow.Table,
  columnName: string
): arrow.Vector<T> {
  const vector = table.getChild(columnName);
  if (!vector) {
    throw new Error(`ArrowTextRenderer data is missing Arrow column "${columnName}"`);
  }
  return vector as arrow.Vector<T>;
}

function getOptionalArrowVector<T extends arrow.DataType>(
  table: arrow.Table,
  columnName: string | null
): arrow.Vector<T> | undefined {
  if (columnName === null) {
    return undefined;
  }
  const vector = table.getChild(columnName);
  return vector ? (vector as arrow.Vector<T>) : undefined;
}

function getRequiredGPUVector(gpuTable: GPUTable, columnName: string): GPUVector {
  const vector = gpuTable.gpuVectors[columnName];
  if (!vector) {
    throw new Error(`ArrowTextRenderer data is missing GPU column "${columnName}"`);
  }
  return vector;
}

function getOptionalGPUVector(
  gpuTable: GPUTable,
  columnName: string | null
): GPUVector | undefined {
  if (columnName === null) {
    return undefined;
  }
  const vector = gpuTable.gpuVectors[columnName];
  return vector ?? undefined;
}

function getResolvedColumnSelectors(
  props: ArrowTextRendererPrepareInputProps
): ResolvedArrowTextRendererColumns {
  return {
    positions: typeof props.positions === 'string' ? props.positions : DEFAULT_COLUMNS.positions,
    texts: typeof props.texts === 'string' ? props.texts : DEFAULT_COLUMNS.texts,
    clipRects: getOptionalColumnSelector(props.clipRects, DEFAULT_COLUMNS.clipRects),
    colors: getOptionalColumnSelector(props.colors, DEFAULT_COLUMNS.colors),
    angles: getOptionalColumnSelector(props.angles, DEFAULT_COLUMNS.angles),
    sizes: getOptionalColumnSelector(props.sizes, DEFAULT_COLUMNS.sizes),
    pixelOffsets: getOptionalColumnSelector(props.pixelOffsets, DEFAULT_COLUMNS.pixelOffsets)
  };
}

function getStreamingTextInputShaderLayout(props: ArrowTextRendererPrepareInputProps) {
  const columns = getResolvedColumnSelectors(props);
  const enabledAttributeNames = new Set([
    columns.positions,
    columns.clipRects,
    columns.colors,
    columns.angles,
    columns.sizes
  ]);

  return {
    ...STREAMING_TEXT_INPUT_SHADER_LAYOUT,
    attributes: STREAMING_TEXT_INPUT_SHADER_LAYOUT.attributes.filter(attribute =>
      enabledAttributeNames.has(attribute.name)
    )
  };
}

function getOptionalColumnSelector(
  value: string | arrow.Vector | null | undefined,
  defaultColumnName: string | null
): string | null {
  if (value === null) {
    return null;
  }
  return typeof value === 'string' ? value : defaultColumnName;
}

function getArrowTextSourceVectors(
  props: ArrowTextRendererPrepareDataProps | ArrowTextRendererPrepareInputProps
): ArrowTextRendererPrepareDataProps {
  if (typeof props.positions === 'string' || !props.positions) {
    throw new Error('ArrowTextRenderer requires a positions vector or table data');
  }
  if (typeof props.texts === 'string' || !props.texts) {
    throw new Error('ArrowTextRenderer requires a texts vector or table data');
  }
  return {
    positions: props.positions,
    texts: props.texts,
    ...(props.clipRects && typeof props.clipRects !== 'string' ? {clipRects: props.clipRects} : {}),
    ...(props.colors && typeof props.colors !== 'string' ? {colors: props.colors} : {}),
    ...(props.angles && typeof props.angles !== 'string' ? {angles: props.angles} : {}),
    ...(props.sizes && typeof props.sizes !== 'string' ? {sizes: props.sizes} : {}),
    ...(props.pixelOffsets && typeof props.pixelOffsets !== 'string'
      ? {pixelOffsets: props.pixelOffsets}
      : {})
  };
}

function getArrowTextSourceVectorsFromTable(
  table: arrow.Table,
  props: ArrowTextRendererPrepareInputProps
): ArrowTextRendererPrepareDataProps {
  const columns = getResolvedColumnSelectors(props);
  const positions = getRequiredArrowVector<arrow.FixedSizeList<arrow.Float32>>(
    table,
    columns.positions
  );
  const texts = getRequiredArrowVector<ArrowUtf8TextType>(table, columns.texts);
  const clipRects = getOptionalArrowVector<arrow.FixedSizeList<arrow.Int16>>(
    table,
    columns.clipRects
  );
  const colors = getOptionalArrowVector<RowColorColumnDataType | CharacterColorDataType>(
    table,
    columns.colors
  );
  const angles = getOptionalArrowVector<arrow.Float32>(table, columns.angles);
  const sizes = getOptionalArrowVector<arrow.Float32>(table, columns.sizes);
  const pixelOffsets = getOptionalArrowVector<arrow.FixedSizeList<arrow.Float32>>(
    table,
    columns.pixelOffsets
  );

  return {
    positions,
    texts,
    ...(clipRects ? {clipRects} : {}),
    ...(colors ? {colors} : {}),
    ...(angles ? {angles} : {}),
    ...(sizes ? {sizes} : {}),
    ...(pixelOffsets ? {pixelOffsets} : {})
  };
}

function shouldPrepareRecordBatchesFromArrowVectors(
  recordBatches: arrow.RecordBatch[],
  props: ArrowTextRendererPrepareInputProps
): boolean {
  const table = new arrow.Table(recordBatches);
  const columns = getResolvedColumnSelectors(props);
  const colors = getOptionalArrowVector<RowColorColumnDataType | CharacterColorDataType>(
    table,
    columns.colors
  );
  return isArrowTextCharacterColorType(colors?.type);
}

function hasArrowTextSourcePropsChanged(props: Partial<ArrowTextRendererProps>): boolean {
  return (
    props.data !== undefined ||
    props.positions !== undefined ||
    props.texts !== undefined ||
    props.clipRects !== undefined ||
    props.colors !== undefined ||
    props.angles !== undefined ||
    props.sizes !== undefined ||
    props.pixelOffsets !== undefined
  );
}

function hasArrowTextConstantStylePropsChanged(
  props: Partial<ArrowTextRendererProps>,
  previousProps: ArrowTextRendererProps
): boolean {
  return (
    (props.color !== undefined && !areTextColorsEqual(props.color, previousProps.color)) ||
    (props.angle !== undefined && props.angle !== previousProps.angle) ||
    (props.size !== undefined && props.size !== previousProps.size)
  );
}

function areTextColorsEqual(
  color: [number, number, number, number] | undefined,
  otherColor: [number, number, number, number] | undefined
): boolean {
  return (
    color === otherColor ||
    (color !== undefined &&
      otherColor !== undefined &&
      color[0] === otherColor[0] &&
      color[1] === otherColor[1] &&
      color[2] === otherColor[2] &&
      color[3] === otherColor[3])
  );
}

function isArrowTextCharacterColorType(
  type: arrow.DataType | undefined
): type is CharacterColorDataType {
  return Boolean(type) && arrow.DataType.isList(type);
}

function getArrowTextRenderModules(device: Device): unknown[] {
  return [supportsIndexPicking(device) ? indexPicking : indexColorPicking];
}

async function getArrowRecordBatches(
  data: ArrowTextRendererRecordBatchSource
): Promise<arrow.RecordBatch[]> {
  const recordBatches: arrow.RecordBatch[] = [];
  const recordBatchIterator = getArrowRecordBatchAsyncIterator(data);
  for (
    let recordBatchResult = await recordBatchIterator.next();
    !recordBatchResult.done;
    recordBatchResult = await recordBatchIterator.next()
  ) {
    recordBatches.push(recordBatchResult.value);
  }
  return recordBatches;
}

function getArrowRecordBatchAsyncIterator(
  data:
    | ArrowTextRendererRecordBatchSource
    | Iterator<arrow.RecordBatch>
    | AsyncIterator<arrow.RecordBatch>
    | undefined
): AsyncIterator<arrow.RecordBatch> {
  if (!data) {
    throw new Error('ArrowTextRenderer streaming requires data or recordBatchIterator');
  }

  return iterateArrowRecordBatches(data)[Symbol.asyncIterator]();
}

async function* iterateArrowRecordBatches(
  data:
    | ArrowTextRendererRecordBatchSource
    | Iterator<arrow.RecordBatch>
    | AsyncIterator<arrow.RecordBatch>
): AsyncIterableIterator<arrow.RecordBatch> {
  const resolvedData = await data;

  if (resolvedData instanceof arrow.Table) {
    for (const recordBatch of resolvedData.batches) {
      yield recordBatch;
    }
    return;
  }

  if (isAsyncIterableRecordBatchSource(resolvedData)) {
    for await (const recordBatch of resolvedData) {
      yield recordBatch;
    }
    return;
  }

  if (isIterableRecordBatchSource(resolvedData)) {
    for (const recordBatch of resolvedData) {
      yield recordBatch;
    }
    return;
  }

  if (isRecordBatchIterator(resolvedData)) {
    let recordBatchResult = resolvedData.next();
    if (isPromiseLike(recordBatchResult)) {
      for (
        let awaitedRecordBatchResult = await recordBatchResult;
        !awaitedRecordBatchResult.done;
        awaitedRecordBatchResult = await (resolvedData as AsyncIterator<arrow.RecordBatch>).next()
      ) {
        yield awaitedRecordBatchResult.value;
      }
      return;
    }

    for (
      let currentRecordBatchResult = recordBatchResult;
      !currentRecordBatchResult.done;
      currentRecordBatchResult = (resolvedData as Iterator<arrow.RecordBatch>).next()
    ) {
      yield currentRecordBatchResult.value;
    }
    return;
  }

  throw new Error('ArrowTextRenderer data must be an Arrow table or record batch iterator');
}

function isAsyncIterableRecordBatchSource(data: unknown): data is AsyncIterable<arrow.RecordBatch> {
  return Boolean(
    data && typeof (data as AsyncIterable<arrow.RecordBatch>)[Symbol.asyncIterator] === 'function'
  );
}

function isIterableRecordBatchSource(data: unknown): data is Iterable<arrow.RecordBatch> {
  return Boolean(
    data && typeof (data as Iterable<arrow.RecordBatch>)[Symbol.iterator] === 'function'
  );
}

function isRecordBatchIterator(
  data: unknown
): data is Iterator<arrow.RecordBatch> | AsyncIterator<arrow.RecordBatch> {
  return Boolean(data && typeof (data as Iterator<arrow.RecordBatch>).next === 'function');
}

function isPromiseLike<T>(value: T | PromiseLike<T>): value is PromiseLike<T> {
  return Boolean(value && typeof (value as PromiseLike<T>).then === 'function');
}
