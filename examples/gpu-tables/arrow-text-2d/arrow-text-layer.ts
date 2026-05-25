// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type CommandEncoder, type Device, type ShaderLayout} from '@luma.gl/core';
import {type ShaderInputs} from '@luma.gl/engine';
import {getArrowVectorByteLength, makeArrowGPURecordBatch, makeArrowGPUTable} from '@luma.gl/arrow';
import {GPUVector, GPUTable} from '@luma.gl/tables';
import {
  AttributeTextModel,
  DictionaryTextModel,
  StorageTextModel,
  type ArrowUtf8TextType,
  type ArrowUtf8TextVector,
  convertArrowTextToAttribute,
  convertArrowTextToAttributeState,
  convertArrowTextToDictionary,
  convertArrowTextToDictionaryState,
  convertArrowTextToStorage,
  convertArrowTextToStorageState,
  type ArrowDictionaryStorageTextInputProps,
  type ArrowStorageTextInputProps,
  type ArrowTextModelProps,
  type ConvertedArrowTextData,
  type PreparedAttributeTextModelProps,
  type PreparedDictionaryTextModelProps,
  type PreparedStorageTextModelProps,
  type FontSettings
} from '@luma.gl/text';
import * as arrow from 'apache-arrow';
import {STREAMING_TEXT_INPUT_SHADER_LAYOUT} from './arrow-text-shaders';

export type ArrowTextLayerModel = 'attribute' | 'storage' | 'dictionary' | 'auto';
export type ArrowTextLayerResolvedModel = Exclude<ArrowTextLayerModel, 'auto'>;
export type ArrowTextRowColorType = arrow.FixedSizeList<arrow.Uint8>;
export type ArrowTextCharacterColorType = arrow.List<arrow.FixedSizeList<arrow.Uint8>>;
export type ArrowTextColorType = ArrowTextRowColorType | ArrowTextCharacterColorType;
export type ArrowTextLayerActiveModel = AttributeTextModel | StorageTextModel | DictionaryTextModel;

export type ArrowTextLayerColumns = {
  positions?: string;
  text?: string;
  clipRects?: string;
  colors?: string;
  angles?: string;
  sizes?: string;
  pixelOffsets?: string;
};

export type ArrowTextLayerSourceVectors = {
  positions: arrow.Vector<arrow.FixedSizeList<arrow.Float32>>;
  texts: ArrowUtf8TextVector;
  colors?: arrow.Vector<ArrowTextColorType>;
  angles?: arrow.Vector<arrow.Float32>;
  sizes?: arrow.Vector<arrow.Float32>;
  pixelOffsets?: arrow.Vector<arrow.FixedSizeList<arrow.Float32>>;
  clipRects?: arrow.Vector<arrow.FixedSizeList<arrow.Int16>>;
};

export type ArrowTextLayerData = ConvertedArrowTextData;

export type ArrowTextLayerSource = {
  sourceVectors: ArrowTextLayerSourceVectors;
  arrowVectorByteLength: number;
  arrowVectorBuildTimeMs: number;
};

export type ArrowTextLayerInput = ArrowTextLayerData & {
  clipRects: GPUVector<arrow.FixedSizeList<arrow.Int16>>;
  colors: GPUVector<ArrowTextColorType>;
  angles: GPUVector<arrow.Float32>;
  sizes: GPUVector<arrow.Float32>;
  arrowVectorByteLength: number;
  arrowVectorBuildTimeMs: number;
};

export type ArrowTextLayerPrepareDataProps = {
  sourceVectors: ArrowTextLayerSourceVectors;
  columns?: ArrowTextLayerColumns;
};

export type ArrowTextLayerPrepareGPUTableDataProps = {
  gpuTable: GPUTable;
  recordBatches: arrow.RecordBatch[];
  columns?: ArrowTextLayerColumns;
};

export type ArrowTextLayerProps = {
  id?: string;
  data: ArrowTextLayerData;
  model?: ArrowTextLayerModel;
  clippingEnabled?: boolean;
  colorsEnabled?: boolean;
  anglesEnabled?: boolean;
  sizesEnabled?: boolean;
  characterSet?: string;
  fontSettings?: FontSettings;
  color?: [number, number, number, number];
  source: string;
  vs?: string;
  fs?: string;
  shaderLayout: ShaderLayout;
  shaderInputs: ShaderInputs<any>;
  modules?: unknown[];
  parameters?: Record<string, unknown>;
  storageSource?: string;
  storageShaderLayout?: ShaderLayout;
  dictionarySource?: string;
  dictionaryShaderLayout?: ShaderLayout;
};

export type ArrowTextLayerSetPropsResult = {
  modelChanged: boolean;
};

export type ArrowTextLayerStreamingSession = {
  version: number;
};

export type ArrowTextLayerRecordBatchStreamUpdate = {
  textInput: ArrowTextLayerInput;
  loadedBatchCount: number;
  isFirstBatch: boolean;
  setPropsResult: ArrowTextLayerSetPropsResult;
};

export type ArrowTextLayerRecordBatchStreamProps = {
  recordBatchIterator: AsyncIterator<arrow.RecordBatch>;
  arrowVectorBuildTimeMs: number;
  model?: ArrowTextLayerModel | ((textInput: ArrowTextLayerInput) => ArrowTextLayerModel);
  streamingSession?: ArrowTextLayerStreamingSession;
  startRedrawReason?: string;
  appendRedrawReason?: string;
  onBatch?: (update: ArrowTextLayerRecordBatchStreamUpdate) => void;
};

type ArrowTextLayerSetPropsOptions = {
  preserveStreaming?: boolean;
};

const DEFAULT_COLUMNS: Required<ArrowTextLayerColumns> = {
  positions: 'positions',
  text: 'texts',
  clipRects: 'clipRects',
  colors: 'colors',
  angles: 'angles',
  sizes: 'sizes',
  pixelOffsets: 'pixelOffsets'
};

export class ArrowTextLayer {
  readonly device: Device;
  props: ArrowTextLayerProps;
  model: ArrowTextLayerActiveModel;
  resolvedModel: ArrowTextLayerResolvedModel;
  private activeStreamingTextTable: GPUTable | null = null;
  private streamingSessionVersion = 0;
  private isDestroyed = false;

  constructor(device: Device, props: ArrowTextLayerProps) {
    this.device = device;
    this.props = {
      clippingEnabled: true,
      colorsEnabled: true,
      anglesEnabled: true,
      sizesEnabled: true,
      ...props
    };
    this.resolvedModel = this.resolveModel(this.props.model ?? 'auto', this.props.data);
    this.model = this.createModel(this.resolvedModel, this.props);
  }

  get clippingEnabled(): boolean {
    return this.props.clippingEnabled !== false;
  }

  get colorsEnabled(): boolean {
    return this.props.colorsEnabled !== false;
  }

  get anglesEnabled(): boolean {
    return this.props.anglesEnabled !== false;
  }

  get sizesEnabled(): boolean {
    return this.props.sizesEnabled !== false;
  }

  static prepareData(device: Device, props: ArrowTextLayerPrepareDataProps): ArrowTextLayerData {
    const hasCharacterColors = isArrowTextCharacterColorType(props.sourceVectors.colors?.type);
    if (arrow.DataType.isDictionary(props.sourceVectors.texts.type) && !hasCharacterColors) {
      return convertArrowTextToDictionary(device, props);
    }
    if (!hasCharacterColors) {
      return convertArrowTextToStorage(device, props);
    }
    return convertArrowTextToAttribute(device, props);
  }

  static prepareDataFromGPUTable(
    props: ArrowTextLayerPrepareGPUTableDataProps
  ): ArrowTextLayerData {
    const columns = {...DEFAULT_COLUMNS, ...props.columns};
    const sourceTable = new arrow.Table(props.recordBatches);
    const positions = getRequiredArrowVector<arrow.FixedSizeList<arrow.Float32>>(
      sourceTable,
      columns.positions
    );
    const texts = getRequiredArrowVector<ArrowUtf8TextType>(sourceTable, columns.text);
    const clipRects = getOptionalArrowVector<arrow.FixedSizeList<arrow.Int16>>(
      sourceTable,
      columns.clipRects
    );
    const colors = getOptionalArrowVector<ArrowTextColorType>(sourceTable, columns.colors);
    const angles = getOptionalArrowVector<arrow.Float32>(sourceTable, columns.angles);
    const sizes = getOptionalArrowVector<arrow.Float32>(sourceTable, columns.sizes);
    const pixelOffsets = getOptionalArrowVector<arrow.FixedSizeList<arrow.Float32>>(
      sourceTable,
      columns.pixelOffsets
    );

    return {
      positions: getRequiredGPUVector<arrow.FixedSizeList<arrow.Float32>>(
        props.gpuTable,
        columns.positions
      ),
      texts: getRequiredGPUVector<ArrowUtf8TextType>(props.gpuTable, columns.text),
      ...(clipRects
        ? {
            clipRects: getRequiredGPUVector<arrow.FixedSizeList<arrow.Int16>>(
              props.gpuTable,
              columns.clipRects
            )
          }
        : {}),
      ...(colors
        ? {colors: getRequiredGPUVector<ArrowTextColorType>(props.gpuTable, columns.colors)}
        : {}),
      ...(angles
        ? {angles: getRequiredGPUVector<arrow.Float32>(props.gpuTable, columns.angles)}
        : {}),
      ...(sizes ? {sizes: getRequiredGPUVector<arrow.Float32>(props.gpuTable, columns.sizes)} : {}),
      ...(pixelOffsets
        ? {
            pixelOffsets: getRequiredGPUVector<arrow.FixedSizeList<arrow.Float32>>(
              props.gpuTable,
              columns.pixelOffsets
            )
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

  setProps(
    props: Partial<ArrowTextLayerProps>,
    redrawReason = 'ArrowTextLayer props changed',
    options: ArrowTextLayerSetPropsOptions = {}
  ): ArrowTextLayerSetPropsResult {
    const previousProps = this.props;
    const nextProps = {...this.props, ...props};
    const shouldCancelStreaming =
      !options.preserveStreaming && props.data !== undefined && props.data !== previousProps.data;
    const streamingTextTableToDestroy = shouldCancelStreaming
      ? this.activeStreamingTextTable
      : null;
    if (shouldCancelStreaming) {
      this.streamingSessionVersion++;
      this.activeStreamingTextTable = null;
    }
    const nextModel = this.resolveModel(
      nextProps.model ?? this.props.model ?? 'auto',
      nextProps.data
    );
    const modelChanged =
      (props.data !== undefined && props.data !== previousProps.data) ||
      (props.model !== undefined && props.model !== previousProps.model) ||
      (props.colorsEnabled !== undefined && props.colorsEnabled !== previousProps.colorsEnabled) ||
      (props.anglesEnabled !== undefined && props.anglesEnabled !== previousProps.anglesEnabled) ||
      (props.sizesEnabled !== undefined && props.sizesEnabled !== previousProps.sizesEnabled) ||
      nextModel !== this.resolvedModel;
    const needsRedraw =
      modelChanged ||
      (props.clippingEnabled !== undefined &&
        props.clippingEnabled !== previousProps.clippingEnabled);

    if (!modelChanged) {
      this.props = nextProps;
      if (needsRedraw) {
        this.model.setNeedsRedraw(redrawReason);
      }
      streamingTextTableToDestroy?.destroy();
      return {modelChanged};
    }

    const previousModel = this.model;
    const nextTextModel = this.createModel(nextModel, nextProps);
    this.props = nextProps;
    this.resolvedModel = nextModel;
    this.model = nextTextModel;
    previousModel.destroy();
    streamingTextTableToDestroy?.destroy();
    this.model.setNeedsRedraw(redrawReason);
    return {modelChanged};
  }

  appendTextBatches(data: ArrowTextLayerData, redrawReason: string): ArrowTextLayerSetPropsResult {
    return this.setProps({data}, redrawReason);
  }

  beginRecordBatchStream(): ArrowTextLayerStreamingSession {
    this.streamingSessionVersion++;
    return {version: this.streamingSessionVersion};
  }

  cancelRecordBatchStream(): void {
    this.streamingSessionVersion++;
  }

  async streamRecordBatches({
    recordBatchIterator,
    arrowVectorBuildTimeMs,
    model: requestedModel,
    streamingSession = this.beginRecordBatchStream(),
    startRedrawReason = 'streaming text dataset started',
    appendRedrawReason = 'streaming Arrow record batch appended',
    onBatch
  }: ArrowTextLayerRecordBatchStreamProps): Promise<void> {
    const sourceRecordBatches: arrow.RecordBatch[] = [];
    let streamingTextTable: GPUTable | null = null;

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

      const recordBatch = recordBatchResult.value;
      if (!streamingTextTable) {
        const previousStreamingTextTable = this.activeStreamingTextTable;
        streamingTextTable = createArrowTextGPUTable(this.device, recordBatch);
        this.activeStreamingTextTable = streamingTextTable;
        sourceRecordBatches.push(recordBatch);
        const textInput = prepareArrowTextInputFromGPUTable(
          streamingTextTable,
          sourceRecordBatches,
          arrowVectorBuildTimeMs
        );
        const model =
          typeof requestedModel === 'function' ? requestedModel(textInput) : requestedModel;
        const setPropsResult = this.setProps(
          {data: textInput, ...(model ? {model} : {})},
          startRedrawReason,
          {preserveStreaming: true}
        );
        previousStreamingTextTable?.destroy();
        onBatch?.({
          textInput,
          loadedBatchCount: streamingTextTable.batches.length,
          isFirstBatch: true,
          setPropsResult
        });
        continue;
      }

      appendArrowTextGPUTableBatch(this.device, streamingTextTable, recordBatch);
      sourceRecordBatches.push(recordBatch);
      const textInput = prepareArrowTextInputFromGPUTable(
        streamingTextTable,
        sourceRecordBatches,
        arrowVectorBuildTimeMs
      );
      const setPropsResult = this.setProps({data: textInput}, appendRedrawReason, {
        preserveStreaming: true
      });
      onBatch?.({
        textInput,
        loadedBatchCount: streamingTextTable.batches.length,
        isFirstBatch: false,
        setPropsResult
      });
    }
  }

  needsRedraw(): string | false {
    return this.model.needsRedraw();
  }

  setNeedsRedraw(reason: string): void {
    this.model.setNeedsRedraw(reason);
  }

  predraw(commandEncoder: CommandEncoder): void {
    this.model.predraw(commandEncoder);
  }

  draw(renderPass: Parameters<ArrowTextLayerActiveModel['draw']>[0]): void {
    this.model.draw(renderPass);
  }

  destroy(): void {
    this.isDestroyed = true;
    this.streamingSessionVersion++;
    const streamingTextTable = this.activeStreamingTextTable;
    this.activeStreamingTextTable = null;
    this.model.destroy();
    streamingTextTable?.destroy();
  }

  private createModel(
    modelKind: ArrowTextLayerResolvedModel,
    props: ArrowTextLayerProps
  ): ArrowTextLayerActiveModel {
    const commonProps = {
      id: props.id,
      characterSet: props.characterSet,
      fontSettings: props.fontSettings,
      source: props.source,
      vs: props.vs,
      fs: props.fs,
      shaderLayout: props.shaderLayout,
      shaderInputs: props.shaderInputs,
      modules: props.modules as never,
      parameters: props.parameters
    };

    if (modelKind === 'dictionary') {
      const dictionaryInputProps = {
        ...this.getStorageInputProps(props.data, props),
        ...commonProps,
        color: props.color
      } as unknown as ArrowDictionaryStorageTextInputProps;
      const storageState = convertArrowTextToDictionaryState(this.device, dictionaryInputProps);
      return new DictionaryTextModel(this.device, {
        id: props.id,
        color: props.color,
        characterSet: props.characterSet,
        fontSettings: props.fontSettings,
        source: props.dictionarySource ?? props.storageSource ?? props.source,
        shaderLayout:
          props.dictionaryShaderLayout ?? props.storageShaderLayout ?? props.shaderLayout,
        shaderInputs: props.shaderInputs,
        modules: props.modules as never,
        parameters: props.parameters,
        storageState,
        ownsStorageState: true
      } as PreparedDictionaryTextModelProps);
    }

    if (modelKind === 'storage') {
      const storageInputProps = {
        ...this.getStorageInputProps(props.data, props),
        ...commonProps,
        color: props.color
      } as unknown as ArrowStorageTextInputProps;
      const storageState = convertArrowTextToStorageState(this.device, storageInputProps);
      return new StorageTextModel(this.device, {
        id: props.id,
        color: props.color,
        characterSet: props.characterSet,
        fontSettings: props.fontSettings,
        source: props.storageSource ?? props.source,
        shaderLayout: props.storageShaderLayout ?? props.shaderLayout,
        shaderInputs: props.shaderInputs,
        modules: props.modules as never,
        parameters: props.parameters,
        storageState,
        ownsStorageState: true
      } as PreparedStorageTextModelProps);
    }

    const attributeInputProps = {
      ...this.getInputProps(props.data, props),
      ...commonProps
    } as unknown as ArrowTextModelProps;
    const attributeState = convertArrowTextToAttributeState(this.device, attributeInputProps);
    return new AttributeTextModel(this.device, {
      ...commonProps,
      attributeState
    } as PreparedAttributeTextModelProps);
  }

  private resolveModel(
    modelKind: ArrowTextLayerModel,
    data: ArrowTextLayerData
  ): ArrowTextLayerResolvedModel {
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

  private isRecordBatchStreamActive(streamingSession: ArrowTextLayerStreamingSession): boolean {
    return !this.isDestroyed && streamingSession.version === this.streamingSessionVersion;
  }

  private getInputProps(
    data: ArrowTextLayerData,
    props: ArrowTextLayerProps
  ): Partial<ArrowTextModelProps> {
    const inputProps = {
      positions: data.positions,
      texts: data.texts,
      sourceVectors: data.sourceVectors,
      ...(data.clipRects ? {clipRects: data.clipRects} : {}),
      ...(data.colors ? {colors: data.colors} : {}),
      ...(props.anglesEnabled !== false && data.angles ? {angles: data.angles} : {}),
      ...(props.sizesEnabled !== false && data.sizes ? {sizes: data.sizes} : {}),
      ...(data.pixelOffsets ? {pixelOffsets: data.pixelOffsets} : {})
    };
    return inputProps as unknown as Partial<ArrowTextModelProps>;
  }

  private getStorageInputProps(
    data: ArrowTextLayerData,
    props: ArrowTextLayerProps
  ): Partial<ArrowStorageTextInputProps & ArrowDictionaryStorageTextInputProps> {
    const inputProps = {
      positions: data.positions,
      texts: data.texts,
      sourceVectors: {
        texts: data.sourceVectors.texts,
        ...(data.sourceVectors.clipRects ? {clipRects: data.sourceVectors.clipRects} : {})
      },
      ...(data.clipRects ? {clipRects: data.clipRects} : {}),
      ...(props.colorsEnabled !== false && data.colors
        ? {colors: data.colors as GPUVector<arrow.FixedSizeList<arrow.Uint8>>}
        : {}),
      ...(props.anglesEnabled !== false && data.angles ? {angles: data.angles} : {}),
      ...(props.sizesEnabled !== false && data.sizes ? {sizes: data.sizes} : {}),
      ...(data.pixelOffsets ? {pixelOffsets: data.pixelOffsets} : {})
    };
    return inputProps as unknown as Partial<
      ArrowStorageTextInputProps & ArrowDictionaryStorageTextInputProps
    >;
  }
}

export function prepareArrowTextInput(
  device: Device,
  textSource: ArrowTextLayerSource
): ArrowTextLayerInput {
  const prepared = ArrowTextLayer.prepareData(device, {
    sourceVectors: textSource.sourceVectors
  });
  return {
    ...prepared,
    clipRects: prepared.clipRects!,
    colors: prepared.colors!,
    angles: prepared.angles!,
    sizes: prepared.sizes!,
    arrowVectorByteLength: textSource.arrowVectorByteLength,
    arrowVectorBuildTimeMs: textSource.arrowVectorBuildTimeMs
  };
}

export function createArrowTextGPUTable(device: Device, recordBatch: arrow.RecordBatch): GPUTable {
  return makeArrowGPUTable(device, new arrow.Table([recordBatch]), {
    shaderLayout: STREAMING_TEXT_INPUT_SHADER_LAYOUT
  });
}

export function appendArrowTextGPUTableBatch(
  device: Device,
  gpuTable: GPUTable,
  recordBatch: arrow.RecordBatch
): void {
  gpuTable.addBatch(
    makeArrowGPURecordBatch(device, recordBatch, {
      shaderLayout: STREAMING_TEXT_INPUT_SHADER_LAYOUT
    })
  );
}

export function prepareArrowTextInputFromGPUTable(
  gpuTable: GPUTable,
  recordBatches: arrow.RecordBatch[],
  arrowVectorBuildTimeMs: number
): ArrowTextLayerInput {
  const sourceTable = new arrow.Table(recordBatches);
  const texts = sourceTable.getChild('texts');
  if (!texts) {
    throw new Error('Streaming Arrow text input requires complete CPU source vectors');
  }
  const prepared = ArrowTextLayer.prepareDataFromGPUTable({
    gpuTable,
    recordBatches
  });
  return {
    ...prepared,
    clipRects: prepared.clipRects!,
    colors: prepared.colors!,
    angles: prepared.angles!,
    sizes: prepared.sizes!,
    arrowVectorByteLength: getArrowVectorByteLength(texts as ArrowUtf8TextVector),
    arrowVectorBuildTimeMs
  };
}

function getRequiredArrowVector<T extends arrow.DataType>(
  table: arrow.Table,
  columnName: string
): arrow.Vector<T> {
  const vector = table.getChild(columnName);
  if (!vector) {
    throw new Error(`ArrowTextLayer data is missing Arrow column "${columnName}"`);
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

function getRequiredGPUVector<T extends arrow.DataType>(
  gpuTable: GPUTable,
  columnName: string
): GPUVector<T> {
  const vector = gpuTable.gpuVectors[columnName];
  if (!vector) {
    throw new Error(`ArrowTextLayer data is missing GPU column "${columnName}"`);
  }
  return vector as GPUVector<T>;
}

function isArrowTextCharacterColorType(
  type: arrow.DataType | undefined
): type is ArrowTextCharacterColorType {
  return Boolean(type) && arrow.DataType.isList(type);
}
