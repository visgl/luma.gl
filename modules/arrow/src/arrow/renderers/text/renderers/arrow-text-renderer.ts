// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type CommandEncoder, type Device, type ShaderLayout} from '@luma.gl/core';
import {
  getArrowPickingModules,
  makeArrowRecordBatchSourceInfo
} from '../../../engine/arrow-picking';
import {getArrowVectorByteLength} from '../../../vectors/arrow-vector-utils';
import {
  makeGPURecordBatchFromArrowRecordBatch,
  makeGPUTableFromArrowTable
} from '../../../gpu/arrow-gpu-table-adapters';
import {type ModelProps} from '@luma.gl/engine';
import {ShaderAssembler} from '@luma.gl/shadertools';
import {GPURenderable, GPUVector, GPUTable, getRequiredGPUVector} from '@luma.gl/tables';
import {
  TextAttributeModel,
  TextDictionaryModel,
  TextRowIndexedStorageModel,
  TextStorageModel,
  getFontAtlasShaderProps,
  supportsGpuTextExpansion,
  type FontAtlas
} from '@luma.gl/text';
import {
  type ArrowUtf8TextVector,
  type ArrowTextAttributeInputProps,
  type ArrowTextDictionaryStorageInputProps,
  type ArrowTextStorageInputProps,
  convertArrowTextToAttribute,
  convertArrowTextToAttributeModelProps,
  convertArrowTextToDictionary,
  convertArrowTextToDictionaryModelProps,
  convertArrowTextToStorage,
  convertArrowTextToStorageModelProps,
  type ConvertedArrowTextData
} from '../conversion/index';
import * as arrow from 'apache-arrow';
import {
  createArrowTextShaderInputs,
  configureArrowTextShaderAssembler,
  TEXT_DICTIONARY_STORAGE_SHADER_LAYOUT,
  TEXT_DICTIONARY_STORAGE_WGSL_SHADER,
  FS_GLSL,
  TEXT_ROW_INDEXED_STORAGE_SHADER_LAYOUT,
  TEXT_ROW_INDEXED_STORAGE_WGSL_SHADER,
  TEXT_STORAGE_INDEXED_SHADER_LAYOUT,
  TEXT_STORAGE_INDEXED_WGSL_SHADER,
  STREAMING_TEXT_INPUT_SHADER_LAYOUT,
  TEXT_SHADER_LAYOUT,
  VS_GLSL,
  WGSL_SHADER
} from './arrow-text-shaders';
import {
  getArrowRecordBatchAsyncIterator,
  supportsVertexStorageBuffers,
  type ArrowRecordBatchSource
} from '../../arrow-renderer-utils';
import {
  resolveArrowTextSourceVectors,
  type ArrowTextMappedSourceVectors,
  type ArrowTextSourceVectorSelectors,
  type CharacterColorDataType,
  type RowColorColumnDataType
} from '../source/arrow-text-source-mapping';

/**
 * Public configuration props for an Arrow text layer.
 *
 * `data` is an optional Arrow table or record-batch source. The source vector fields are top-level
 * props: pass strings to select columns from `data`, or pass Arrow vectors directly when no table
 * source is provided. Optional style behavior is inferred from the presence of the corresponding
 * source prop; set an optional source prop to `null` to disable it.
 */
export type ArrowTextRendererProps = ArrowTextSourceVectorSelectors & {
  /** Debug label used for generated model and GPU resources. */
  id?: string;
  /** Optional Arrow table, record-batch iterable, or async record-batch iterator. */
  data?: ArrowRecordBatchSource;
  /** Text model path. `auto` prefers WebGPU storage paths when the source shape supports them. */
  model?: 'attribute' | 'storage' | 'storage-row-indexed' | 'dictionary' | 'auto';
  /** Normalized atlas-backed font consumed directly by text layout and rendering. */
  fontAtlas: FontAtlas;
  /** Constant fallback RGBA color used when no row color vector is present. */
  color?: [number, number, number, number];
  /** Constant fallback row angle in degrees used when no row angle vector is present. */
  angle?: number;
  /** Constant fallback row text size used when no row size vector is present. */
  size?: number;
  /** Attribute-model shader layout override used after Arrow source preparation. */
  attributeShaderLayout?: ShaderLayout;
  /** Storage-model shader layout override used after Arrow source preparation. */
  storageShaderLayout?: ShaderLayout;
  /** Dictionary-storage shader layout override used after Arrow source preparation. */
  dictionaryStorageShaderLayout?: ShaderLayout;
  /** Called after one Arrow record batch has been prepared and appended. */
  onDataBatch?: (update: ArrowTextRendererDataBatchUpdate) => void;
  /** Called when renderer-owned Arrow batch loading fails. */
  onDataError?: (error: unknown) => void;
  /**
   * Optional shader overrides for hosts that provide their own projection modules.
   * GPUVector preparation and renderer-owned model lifecycle remain unchanged.
   */
  modelProps?: Pick<
    ModelProps,
    | 'source'
    | 'vs'
    | 'fs'
    | 'modules'
    | 'shaderInputs'
    | 'bufferLayout'
    | 'attributes'
    | 'constantAttributes'
    | 'shaderAssembler'
  >;
};

export type {CharacterColorDataType, RowColorColumnDataType};

/** Concrete luma.gl text model instances owned by {@link ArrowTextRenderer}. */
export type ArrowTextRendererActiveModel =
  | TextAttributeModel
  | TextStorageModel
  | TextDictionaryModel;

/** Prepared GPUVector text data returned by Arrow conversion helpers. */
export type ArrowTextRendererData = ConvertedArrowTextData;

/** CPU Arrow source plus byte-size metadata used by conversion helpers. */
export type ArrowTextRendererSource = ArrowTextMappedSourceVectors & {
  /** Byte length of the primary Arrow text vector. */
  arrowVectorByteLength: number;
};

/** Prepared renderer data plus source byte-size metadata. */
export type ArrowTextRendererInput = ArrowTextRendererData & {
  /** Byte length of the primary Arrow text vector. */
  arrowVectorByteLength: number;
};

/** Props for preparing GPUVector text input from an Arrow table or record-batch source. */
export type ArrowTextRendererPrepareInputProps = Pick<
  ArrowTextRendererProps,
  | 'data'
  | 'positions'
  | 'texts'
  | 'clipRects'
  | 'colors'
  | 'angles'
  | 'sizes'
  | 'pixelOffsets'
  | 'textAnchors'
  | 'alignmentBaselines'
>;

/** Props for preparing GPUVector text data from explicit Arrow vectors. */
export type ArrowTextRendererPrepareDataProps = Pick<
  ArrowTextRendererSource,
  | 'positions'
  | 'texts'
  | 'clipRects'
  | 'colors'
  | 'angles'
  | 'sizes'
  | 'pixelOffsets'
  | 'textAnchors'
  | 'alignmentBaselines'
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

/** Notification emitted after one record batch is uploaded and applied. */
export type ArrowTextRendererDataBatchUpdate = {
  /** Full prepared input for all batches loaded so far. */
  textInput: ArrowTextRendererInput;
  /** Number of uploaded GPU table batches. */
  loadedBatchCount: number;
  /** True for the first batch in a stream. */
  isFirstBatch: boolean;
  /** Result of applying the batch to layer props. */
  setPropsResult: ArrowTextRendererSetPropsResult;
};

type ArrowTextRendererSetPropsOptions = {
  preserveDataLoad?: boolean;
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
  textAnchors: string | null;
  alignmentBaselines: string | null;
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
  pixelOffsets: 'pixelOffsets',
  textAnchors: 'textAnchors',
  alignmentBaselines: 'alignmentBaselines'
};
const DEFAULT_TEXT_COLOR: [number, number, number, number] = [128, 128, 128, 255];
const DEFAULT_TEXT_ANGLE = 0;
const DEFAULT_TEXT_SIZE = 32;
const TEXT_STORAGE_VERTEX_STORAGE_BUFFER_COUNT = 8;
const TEXT_DICTIONARY_VERTEX_STORAGE_BUFFER_COUNT = 10;

/**
 * Arrow-aware renderer that chooses between attribute, WebGPU storage, row-indexed
 * storage, and dictionary text models from prepared Arrow/GPUVector inputs.
 */
export class ArrowTextRenderer extends GPURenderable<
  [Parameters<ArrowTextRendererActiveModel['draw']>[0]]
> {
  /** Device used for all GPU resources owned by this layer. */
  readonly device: Device;
  /** Shared shader inputs used by rendering, picking, and viewport uniforms. */
  readonly shaderInputs;
  /** Last applied layer props. */
  props: ArrowTextRendererProps;
  /** Prepared GPUVector text input currently consumed by the active model. */
  textInput: ArrowTextRendererInput;
  /** Active luma.gl text model. Recreated when data or model selection changes. */
  model: ArrowTextRendererActiveModel;
  /** Concrete model path after resolving `props.model === 'auto'`. */
  resolvedModel: ArrowTextRendererResolvedModel;
  private activeStreamingTextTable: GPUTable | null = null;
  private dataLoadVersion = 0;
  private isDestroyed = false;

  /** Creates a layer from Arrow source props after GPUVector conversion. */
  private constructor(
    device: Device,
    props: ArrowTextRendererProps,
    textInput: ArrowTextRendererInput
  ) {
    super();
    this.device = device;
    this.props = props;
    const hostPickingModule = props.modelProps?.modules?.find(module => module.name === 'picking');
    this.shaderInputs =
      props.modelProps?.shaderInputs ?? createArrowTextShaderInputs(hostPickingModule as never);
    if (props.modelProps?.modules) {
      this.shaderInputs.addModules(props.modelProps.modules);
    }
    this.textInput = textInput;
    this.resolvedModel = this.resolveModel(this.props.model ?? 'auto', this.textInput);
    this.model = this.createModel(this.resolvedModel, this.props, this.textInput);
  }

  /** Resolves table or record-batch source props, prepares GPUVectors, and constructs a layer. */
  static async create(device: Device, props: ArrowTextRendererProps): Promise<ArrowTextRenderer> {
    const asyncSource = props.data && Symbol.asyncIterator in props.data ? props.data : null;
    if (!asyncSource) {
      return new ArrowTextRenderer(
        device,
        props,
        await prepareArrowTextInputFromData(device, props)
      );
    }

    const iterator = getArrowRecordBatchAsyncIterator(asyncSource);
    const firstResult = await iterator.next();
    if (firstResult.done) {
      throw new Error('ArrowTextRenderer data requires at least one Arrow record batch');
    }
    const firstRecordBatch = firstResult.value;
    const initialProps = {...props, data: new arrow.Table([firstRecordBatch])};
    const renderer = new ArrowTextRenderer(
      device,
      initialProps,
      await prepareArrowTextInputFromData(device, initialProps)
    );
    const dataLoadVersion = renderer.beginDataLoad();
    void renderer.loadDataBatches(
      {...props, data: replayArrowTextRecordBatches(firstRecordBatch, iterator)},
      dataLoadVersion,
      'streamed Arrow text batch'
    );
    return renderer;
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
    const sourceTable = new arrow.Table(props.recordBatches);
    const sourceVectors = resolveArrowTextSourceVectors({
      data: sourceTable,
      selectors: props.props
    });

    return {
      positions: getRequiredGPUVector(props.gpuTable, 'positions', 'ArrowTextRenderer data'),
      texts: getRequiredGPUVector(props.gpuTable, 'texts', 'ArrowTextRenderer data'),
      ...(sourceVectors.clipRects
        ? {
            clipRects: getOptionalGPUVector(props.gpuTable, 'clipRects')
          }
        : {}),
      ...(sourceVectors.colors
        ? {
            colors: getOptionalGPUVector(props.gpuTable, 'colors')
          }
        : {}),
      ...(sourceVectors.angles ? {angles: getOptionalGPUVector(props.gpuTable, 'angles')} : {}),
      ...(sourceVectors.sizes ? {sizes: getOptionalGPUVector(props.gpuTable, 'sizes')} : {}),
      ...(sourceVectors.pixelOffsets
        ? {
            pixelOffsets: getOptionalGPUVector(props.gpuTable, 'pixelOffsets')
          }
        : {}),
      ...(sourceVectors.textAnchors
        ? {
            textAnchors: getOptionalGPUVector(props.gpuTable, 'textAnchors')
          }
        : {}),
      ...(sourceVectors.alignmentBaselines
        ? {
            alignmentBaselines: getOptionalGPUVector(props.gpuTable, 'alignmentBaselines')
          }
        : {}),
      sourceVectors,
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
    const hasDataProp = Object.prototype.hasOwnProperty.call(props, 'data');
    const dataChanged = hasDataProp && props.data !== previousProps.data;
    const hasModelPropChanged = props.model !== undefined && props.model !== previousProps.model;
    const hasSourcePropsChanged = hasArrowTextSourcePropsChanged(props);
    const hasFontPropsChanged = hasChangedProp(props, previousProps, 'fontAtlas');
    if (!options.preserveDataLoad && shouldLoadTextDataBatches(nextProps, dataChanged)) {
      const dataLoadVersion = this.beginDataLoad();
      this.props = nextProps;
      void this.loadDataBatches(nextProps, dataLoadVersion, redrawReason);
      return {modelChanged: true};
    }

    const shouldCancelStreaming =
      !options.preserveDataLoad &&
      (dataChanged || hasModelPropChanged || hasSourcePropsChanged || hasFontPropsChanged);
    const streamingTextTableToDestroy = shouldCancelStreaming
      ? this.activeStreamingTextTable
      : null;
    if (shouldCancelStreaming) {
      this.dataLoadVersion++;
      this.activeStreamingTextTable = null;
    }
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
      hasFontPropsChanged ||
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

  /** Incrementally uploads record batches and applies the growing prepared data to the layer. */
  private async loadDataBatches(
    props: ArrowTextRendererProps,
    dataLoadVersion: number,
    redrawReason: string
  ): Promise<void> {
    if (!props.data) {
      return;
    }
    const resolvedRecordBatchIterator = getArrowRecordBatchAsyncIterator(props.data);
    const sourceRecordBatches: arrow.RecordBatch[] = [];
    let streamingTextTable: GPUTable | null = null;
    let isSourceVectorStreaming = false;
    let hasStartedStreaming = false;

    if (!this.isDataLoadActive(dataLoadVersion)) {
      return;
    }

    try {
      for (
        let recordBatchResult = await resolvedRecordBatchIterator.next();
        !recordBatchResult.done;
        recordBatchResult = await resolvedRecordBatchIterator.next()
      ) {
        if (!this.isDataLoadActive(dataLoadVersion)) {
          return;
        }

        const recordBatch = recordBatchResult.value;
        const isFirstBatch = !hasStartedStreaming;
        sourceRecordBatches.push(recordBatch);

        if (isFirstBatch) {
          const previousStreamingTextTable = this.activeStreamingTextTable;
          isSourceVectorStreaming = shouldPrepareRecordBatchesFromArrowVectors(
            sourceRecordBatches,
            props
          );
          if (!isSourceVectorStreaming) {
            streamingTextTable = createArrowTextGPUTable(this.device, recordBatch, props);
            this.activeStreamingTextTable = streamingTextTable;
          } else {
            this.activeStreamingTextTable = null;
          }
          hasStartedStreaming = true;
          const textInput = isSourceVectorStreaming
            ? prepareArrowTextInputFromRecordBatches(this.device, sourceRecordBatches, props)
            : prepareArrowTextInputFromGPUTable(streamingTextTable!, sourceRecordBatches, props);
          const setPropsResult = this.setPreparedTextInput(props, textInput, redrawReason, {
            preserveDataLoad: true
          });
          previousStreamingTextTable?.destroy();
          props.onDataBatch?.({
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
          addArrowTextGPUTableBatch(this.device, streamingTextTable!, recordBatch, props);
        }
        const textInput = isSourceVectorStreaming
          ? prepareArrowTextInputFromRecordBatches(this.device, sourceRecordBatches, props)
          : prepareArrowTextInputFromGPUTable(streamingTextTable!, sourceRecordBatches, props);
        const setPropsResult = this.setPreparedTextInput(props, textInput, redrawReason, {
          preserveDataLoad: true
        });
        props.onDataBatch?.({
          textInput,
          loadedBatchCount: isSourceVectorStreaming
            ? sourceRecordBatches.length
            : streamingTextTable!.batches.length,
          isFirstBatch: false,
          setPropsResult
        });
      }
    } catch (error) {
      if (this.isDataLoadActive(dataLoadVersion)) {
        props.onDataError?.(error);
      }
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
      !options.preserveDataLoad &&
      nextProps.data !== undefined &&
      nextProps.data !== previousProps.data;
    const streamingTextTableToDestroy = shouldCancelStreaming
      ? this.activeStreamingTextTable
      : null;
    if (shouldCancelStreaming) {
      this.dataLoadVersion++;
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
    this.dataLoadVersion++;
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
    setArrowTextFontAtlasShaderProps(this.shaderInputs, props.fontAtlas);
    const shaderAssembler = configureArrowTextShaderAssembler(
      props.modelProps?.shaderAssembler ?? new ShaderAssembler(),
      this.device.info.shadingLanguage
    );
    const commonProps = {
      id: props.id,
      fontAtlas: props.fontAtlas,
      ...props.modelProps,
      shaderAssembler,
      shaderInputs: this.shaderInputs,
      modules: mergeHostShaderModules(
        getArrowTextRenderModules(this.device),
        props.modelProps?.modules ?? []
      ) as never,
      parameters: DEFAULT_RENDER_PARAMETERS,
      color,
      angle,
      size
    };

    if (modelKind === 'dictionary') {
      return new TextDictionaryModel(
        this.device,
        convertArrowTextToDictionaryModelProps(this.device, {
          ...this.getStorageInputProps(data),
          ...commonProps,
          source: props.modelProps?.source ?? TEXT_DICTIONARY_STORAGE_WGSL_SHADER,
          shaderLayout: props.dictionaryStorageShaderLayout ?? TEXT_DICTIONARY_STORAGE_SHADER_LAYOUT
        })
      );
    }

    if (modelKind === 'storage' || modelKind === 'storage-row-indexed') {
      const StorageModel =
        modelKind === 'storage-row-indexed' ? TextRowIndexedStorageModel : TextStorageModel;
      return new StorageModel(
        this.device,
        convertArrowTextToStorageModelProps(this.device, {
          ...this.getStorageInputProps(data),
          ...commonProps,
          rowIndexColumn: modelKind === 'storage-row-indexed',
          source:
            props.modelProps?.source ??
            (modelKind === 'storage-row-indexed'
              ? TEXT_ROW_INDEXED_STORAGE_WGSL_SHADER
              : TEXT_STORAGE_INDEXED_WGSL_SHADER),
          shaderLayout:
            props.storageShaderLayout ??
            (modelKind === 'storage-row-indexed'
              ? TEXT_ROW_INDEXED_STORAGE_SHADER_LAYOUT
              : TEXT_STORAGE_INDEXED_SHADER_LAYOUT)
        })
      );
    }

    return new TextAttributeModel(
      this.device,
      convertArrowTextToAttributeModelProps(this.device, {
        ...this.getInputProps(data),
        ...commonProps,
        source: props.modelProps?.source ?? WGSL_SHADER,
        vs: props.modelProps?.vs ?? VS_GLSL,
        fs: props.modelProps?.fs ?? FS_GLSL,
        shaderLayout: props.attributeShaderLayout ?? TEXT_SHADER_LAYOUT
      })
    );
  }

  private resolveModel(
    modelKind: NonNullable<ArrowTextRendererProps['model']>,
    data: ArrowTextRendererData
  ): ArrowTextRendererResolvedModel {
    const hasCharacterColors = isArrowTextCharacterColorType(data.sourceVectors.colors?.type);
    const hasTextDictionary = arrow.DataType.isDictionary(data.sourceVectors.texts.type);
    const supportsTextStorage =
      supportsVertexStorageBuffers(this.device, TEXT_STORAGE_VERTEX_STORAGE_BUFFER_COUNT) &&
      supportsGpuTextExpansion(this.device);
    const supportsTextDictionary = supportsVertexStorageBuffers(
      this.device,
      TEXT_DICTIONARY_VERTEX_STORAGE_BUFFER_COUNT
    );
    if (modelKind === 'auto') {
      if (supportsTextDictionary && hasTextDictionary && !hasCharacterColors) {
        return 'dictionary';
      }
      if (supportsTextStorage && !hasCharacterColors) {
        return 'storage';
      }
      return 'attribute';
    }
    if (modelKind !== 'attribute' && hasCharacterColors) {
      return 'attribute';
    }
    if (modelKind === 'dictionary' && !supportsTextDictionary) {
      return 'attribute';
    }
    if ((modelKind === 'storage' || modelKind === 'storage-row-indexed') && !supportsTextStorage) {
      return 'attribute';
    }
    if (modelKind === 'dictionary' && !hasTextDictionary) {
      return 'attribute';
    }
    return modelKind;
  }

  private beginDataLoad(): number {
    this.dataLoadVersion++;
    return this.dataLoadVersion;
  }

  private isDataLoadActive(dataLoadVersion: number): boolean {
    return !this.isDestroyed && dataLoadVersion === this.dataLoadVersion;
  }

  private getInputProps(
    data: ArrowTextRendererData
  ): Pick<
    ArrowTextAttributeInputProps,
    | 'positions'
    | 'texts'
    | 'sourceVectors'
    | 'clipRects'
    | 'colors'
    | 'angles'
    | 'sizes'
    | 'pixelOffsets'
  > {
    return {
      positions: data.positions,
      texts: data.texts,
      sourceVectors: data.sourceVectors,
      ...(data.clipRects ? {clipRects: data.clipRects} : {}),
      ...(data.colors ? {colors: data.colors} : {}),
      ...(data.angles ? {angles: data.angles} : {}),
      ...(data.sizes ? {sizes: data.sizes} : {}),
      ...(data.pixelOffsets ? {pixelOffsets: data.pixelOffsets} : {})
    };
  }

  private getStorageInputProps(
    data: ArrowTextRendererData
  ): Pick<
    ArrowTextStorageInputProps & ArrowTextDictionaryStorageInputProps,
    | 'positions'
    | 'texts'
    | 'sourceVectors'
    | 'clipRects'
    | 'colors'
    | 'angles'
    | 'sizes'
    | 'pixelOffsets'
    | 'textAnchors'
    | 'alignmentBaselines'
  > {
    return {
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
      ...(data.pixelOffsets ? {pixelOffsets: data.pixelOffsets} : {}),
      ...(data.textAnchors ? {textAnchors: data.textAnchors} : {}),
      ...(data.alignmentBaselines ? {alignmentBaselines: data.alignmentBaselines} : {})
    };
  }
}

function setArrowTextFontAtlasShaderProps(
  shaderInputs: ArrowTextRenderer['shaderInputs'],
  fontAtlas: FontAtlas
): void {
  const fontShaderProps = getFontAtlasShaderProps(fontAtlas.renderSettings);
  const moduleNames = new Set(shaderInputs.getModules().map(module => module.name));
  if (moduleNames.has('textViewport')) {
    shaderInputs.setProps({
      textViewport: {
        textFontRenderMode: fontShaderProps.renderMode,
        textSdfThreshold: fontShaderProps.sdfThreshold,
        textSdfSmoothing: fontShaderProps.sdfSmoothing,
        textMsdfDistanceRange: fontShaderProps.msdfDistanceRange
      }
    } as never);
  }
  if (moduleNames.has('textFont')) {
    shaderInputs.setProps({textFont: fontShaderProps} as never);
  }
}

function hasChangedProp<Props, Key extends keyof Props>(
  props: Partial<Props>,
  previousProps: Props,
  key: Key
): boolean {
  return Object.prototype.hasOwnProperty.call(props, key) && props[key] !== previousProps[key];
}

/** Uploads explicit Arrow source vectors and attaches source byte-length metadata. */
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
  const table = new arrow.Table([recordBatch]);
  const {arrowPaths, shaderLayout} = getStreamingTextInputOptions(table, props);
  return makeGPUTableFromArrowTable(device, table, {
    arrowPaths,
    shaderLayout
  });
}

/** Uploads an Arrow table as a GPU table using the text input shader layout. */
export function createArrowTextGPUTableFromTable(
  device: Device,
  table: arrow.Table,
  props: ArrowTextRendererPrepareInputProps = {}
): GPUTable {
  const {arrowPaths, shaderLayout} = getStreamingTextInputOptions(table, props);
  return makeGPUTableFromArrowTable(device, table, {
    arrowPaths,
    shaderLayout
  });
}

/** Converts one Arrow record batch and adds it to an existing streaming GPU table. */
export function addArrowTextGPUTableBatch(
  device: Device,
  gpuTable: GPUTable,
  recordBatch: arrow.RecordBatch,
  props: ArrowTextRendererPrepareInputProps = {}
): void {
  const table = new arrow.Table([recordBatch]);
  const {arrowPaths, shaderLayout} = getStreamingTextInputOptions(table, props);
  const sourceBatchIndex = gpuTable.batches.length;
  const sourceRowIndexOffset = gpuTable.batches.reduce(
    (rowIndexOffset, batch) => rowIndexOffset + (batch.sourceInfo?.sourceRowCount ?? batch.numRows),
    0
  );
  gpuTable.addBatch(
    makeGPURecordBatchFromArrowRecordBatch(device, recordBatch, {
      arrowPaths,
      shaderLayout,
      sourceInfo: makeArrowRecordBatchSourceInfo({
        sourceBatchIndex,
        sourceRowIndexOffset,
        sourceRowCount: recordBatch.numRows
      })
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
  const {texts} = resolveArrowTextSourceVectors({data: sourceTable, selectors: props});
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

async function* replayArrowTextRecordBatches(
  firstRecordBatch: arrow.RecordBatch,
  iterator: AsyncIterator<arrow.RecordBatch>
): AsyncGenerator<arrow.RecordBatch> {
  yield firstRecordBatch;
  for (let result = await iterator.next(); !result.done; result = await iterator.next()) {
    yield result.value;
  }
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
    pixelOffsets: getOptionalColumnSelector(props.pixelOffsets, DEFAULT_COLUMNS.pixelOffsets),
    textAnchors: getOptionalColumnSelector(props.textAnchors, DEFAULT_COLUMNS.textAnchors),
    alignmentBaselines: getOptionalColumnSelector(
      props.alignmentBaselines,
      DEFAULT_COLUMNS.alignmentBaselines
    )
  };
}

function getStreamingTextInputOptions(
  table: arrow.Table,
  props: ArrowTextRendererPrepareInputProps
): {
  arrowPaths: Record<string, string>;
  shaderLayout: typeof STREAMING_TEXT_INPUT_SHADER_LAYOUT;
} {
  assertArrowTextGPUTableSelectors(props);
  const sourceVectors = resolveArrowTextSourceVectors({data: table, selectors: props});
  const columns = getResolvedColumnSelectors(props);
  return {
    arrowPaths: getStreamingTextInputArrowPaths(columns, sourceVectors),
    shaderLayout: getStreamingTextInputShaderLayout(sourceVectors)
  };
}

function getStreamingTextInputArrowPaths(
  columns: ResolvedArrowTextRendererColumns,
  sourceVectors: ArrowTextMappedSourceVectors
): Record<string, string> {
  return Object.fromEntries(
    [
      ['positions', columns.positions],
      ['texts', columns.texts],
      ...(sourceVectors.clipRects ? [['clipRects', columns.clipRects]] : []),
      ...(sourceVectors.colors ? [['colors', columns.colors]] : []),
      ...(sourceVectors.angles ? [['angles', columns.angles]] : []),
      ...(sourceVectors.sizes ? [['sizes', columns.sizes]] : []),
      ...(sourceVectors.pixelOffsets ? [['pixelOffsets', columns.pixelOffsets]] : []),
      ...(sourceVectors.textAnchors ? [['textAnchors', columns.textAnchors]] : []),
      ...(sourceVectors.alignmentBaselines
        ? [['alignmentBaselines', columns.alignmentBaselines]]
        : [])
    ].filter(([, columnPath]) => columnPath !== null) as Array<[string, string]>
  );
}

function getStreamingTextInputShaderLayout(sourceVectors: ArrowTextMappedSourceVectors) {
  const enabledInputNames = new Set([
    'positions',
    'texts',
    ...(sourceVectors.clipRects ? ['clipRects'] : []),
    ...(sourceVectors.colors ? ['colors'] : []),
    ...(sourceVectors.angles ? ['angles'] : []),
    ...(sourceVectors.sizes ? ['sizes'] : []),
    ...(sourceVectors.pixelOffsets ? ['pixelOffsets'] : []),
    ...(sourceVectors.textAnchors ? ['textAnchors'] : []),
    ...(sourceVectors.alignmentBaselines ? ['alignmentBaselines'] : [])
  ]);

  return {
    ...STREAMING_TEXT_INPUT_SHADER_LAYOUT,
    attributes: STREAMING_TEXT_INPUT_SHADER_LAYOUT.attributes.filter(attribute =>
      enabledInputNames.has(attribute.name)
    ),
    bindings: STREAMING_TEXT_INPUT_SHADER_LAYOUT.bindings.filter(binding =>
      enabledInputNames.has(binding.name)
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
  return resolveArrowTextSourceVectors({selectors: props});
}

function getArrowTextSourceVectorsFromTable(
  table: arrow.Table,
  props: ArrowTextRendererPrepareInputProps
): ArrowTextRendererPrepareDataProps {
  return resolveArrowTextSourceVectors({data: table, selectors: props});
}

function shouldPrepareRecordBatchesFromArrowVectors(
  recordBatches: arrow.RecordBatch[],
  props: ArrowTextRendererPrepareInputProps
): boolean {
  if (hasDirectArrowTextSourceVectorSelectors(props)) {
    return true;
  }
  const table = new arrow.Table(recordBatches);
  const colors = resolveArrowTextSourceVectors({data: table, selectors: props}).colors;
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
    props.pixelOffsets !== undefined ||
    props.textAnchors !== undefined ||
    props.alignmentBaselines !== undefined
  );
}

function assertArrowTextGPUTableSelectors(props: ArrowTextRendererPrepareInputProps): void {
  if (hasDirectArrowTextSourceVectorSelectors(props)) {
    throw new Error('Arrow text GPU table upload requires data-backed string column selectors');
  }
}

function hasDirectArrowTextSourceVectorSelectors(
  props: ArrowTextRendererPrepareInputProps
): boolean {
  return [
    props.positions,
    props.texts,
    props.clipRects,
    props.colors,
    props.angles,
    props.sizes,
    props.pixelOffsets,
    props.textAnchors,
    props.alignmentBaselines
  ].some(selector => selector instanceof arrow.Vector);
}

function shouldLoadTextDataBatches(props: ArrowTextRendererProps, dataChanged: boolean): boolean {
  return Boolean(props.data && dataChanged);
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
  return getArrowPickingModules(device);
}

function mergeHostShaderModules(
  defaultModules: unknown[],
  hostModules: NonNullable<NonNullable<ArrowTextRendererProps['modelProps']>['modules']>
): unknown[] {
  const hostModuleNames = new Set(hostModules.map(module => module.name));
  return [
    ...defaultModules.filter(module => {
      const moduleName = (module as {name?: string}).name;
      return !moduleName || !hostModuleNames.has(moduleName);
    }),
    ...hostModules
  ];
}

async function getArrowRecordBatches(data: ArrowRecordBatchSource): Promise<arrow.RecordBatch[]> {
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
