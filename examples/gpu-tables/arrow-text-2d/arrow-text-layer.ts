// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type CommandEncoder, type Device, type ShaderLayout} from '@luma.gl/core';
import {type ShaderInputs} from '@luma.gl/engine';
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
  type AttributeTextModelProps,
  type ConvertedArrowTextData,
  type DictionaryTextModelProps,
  type StorageTextModelProps,
  type FontSettings
} from '@luma.gl/text';
import * as arrow from 'apache-arrow';

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

  constructor(device: Device, props: ArrowTextLayerProps) {
    this.device = device;
    this.props = props;
    this.resolvedModel = this.resolveModel(props.model ?? 'auto', props.data);
    this.model = this.createModel(this.resolvedModel, props);
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

  setProps(props: Partial<ArrowTextLayerProps>): void {
    const nextProps = {...this.props, ...props};
    const nextModel = this.resolveModel(
      nextProps.model ?? this.props.model ?? 'auto',
      nextProps.data
    );
    const shouldRecreate =
      props.data !== undefined ||
      props.model !== undefined ||
      props.colorsEnabled !== undefined ||
      props.anglesEnabled !== undefined ||
      props.sizesEnabled !== undefined ||
      nextModel !== this.resolvedModel;

    this.props = nextProps;
    if (!shouldRecreate) {
      return;
    }

    const previousModel = this.model;
    this.resolvedModel = nextModel;
    this.model = this.createModel(nextModel, nextProps);
    previousModel.destroy();
  }

  appendTextBatches(data: ArrowTextLayerData, redrawReason: string): boolean {
    this.setProps({data});
    this.model.setNeedsRedraw(redrawReason);
    return true;
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
    this.model.destroy();
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
        ...this.getStorageInputProps(props.data),
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
      } as unknown as DictionaryTextModelProps);
    }

    if (modelKind === 'storage') {
      const storageInputProps = {
        ...this.getStorageInputProps(props.data),
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
      } as unknown as StorageTextModelProps);
    }

    const attributeInputProps = {
      ...this.getInputProps(props.data),
      ...commonProps
    } as unknown as ArrowTextModelProps;
    const attributeState = convertArrowTextToAttributeState(this.device, attributeInputProps);
    return new AttributeTextModel(this.device, {
      ...commonProps,
      attributeState
    } as unknown as AttributeTextModelProps);
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

  private getInputProps(data: ArrowTextLayerData): Partial<ArrowTextModelProps> {
    const inputProps = {
      positions: data.positions,
      texts: data.texts,
      sourceVectors: data.sourceVectors,
      ...(data.clipRects ? {clipRects: data.clipRects} : {}),
      ...(data.colors ? {colors: data.colors} : {}),
      ...(this.props.anglesEnabled !== false && data.angles ? {angles: data.angles} : {}),
      ...(this.props.sizesEnabled !== false && data.sizes ? {sizes: data.sizes} : {}),
      ...(data.pixelOffsets ? {pixelOffsets: data.pixelOffsets} : {})
    };
    return inputProps as unknown as Partial<ArrowTextModelProps>;
  }

  private getStorageInputProps(
    data: ArrowTextLayerData
  ): Partial<ArrowStorageTextInputProps & ArrowDictionaryStorageTextInputProps> {
    const inputProps = {
      positions: data.positions,
      texts: data.texts,
      sourceVectors: {
        texts: data.sourceVectors.texts,
        ...(data.sourceVectors.clipRects ? {clipRects: data.sourceVectors.clipRects} : {})
      },
      ...(data.clipRects ? {clipRects: data.clipRects} : {}),
      ...(this.props.colorsEnabled !== false && data.colors
        ? {colors: data.colors as GPUVector<arrow.FixedSizeList<arrow.Uint8>>}
        : {}),
      ...(this.props.anglesEnabled !== false && data.angles ? {angles: data.angles} : {}),
      ...(this.props.sizesEnabled !== false && data.sizes ? {sizes: data.sizes} : {}),
      ...(data.pixelOffsets ? {pixelOffsets: data.pixelOffsets} : {})
    };
    return inputProps as unknown as Partial<
      ArrowStorageTextInputProps & ArrowDictionaryStorageTextInputProps
    >;
  }
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
