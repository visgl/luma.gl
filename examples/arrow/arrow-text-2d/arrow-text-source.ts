// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {
  ArrowTextRenderer,
  clearArrowPickingState,
  createArrowTextPickingManager,
  createArrowTextPickingModel,
  drawArrowTextPickingPass,
  resolveArrowPickInfo,
  runArrowPickingPass,
  supportsTextIndexPicking,
  type ArrowTextRendererActiveModel,
  type ArrowTextRendererDataBatchUpdate,
  type ArrowTextRendererInput,
  type ArrowTextRendererProps,
  type ArrowTextRendererSetPropsResult
} from '@luma.gl/arrow';
import {
  AnimationLoopTemplate,
  type AnimationProps,
  type Model,
  type PickingManager,
  type PickingShouldPickOptions
} from '@luma.gl/engine';
import type {GPUTable} from '@luma.gl/tables';
import {buildSdfFontAtlas, type FontAtlas} from '@luma.gl/text';
import * as arrow from 'apache-arrow';
import {
  ArrowText2DControlPanel,
  type ArrowText2DControlPanelAngleKind,
  type ArrowText2DControlPanelClipRectsKind,
  type ArrowText2DControlPanelSizeKind
} from './control-panel';
import {
  createStreamingRecordBatchIterator,
  getEagerTextDatasetKind,
  getTextDatasetKind,
  getTextDatasetSourceKind,
  getTextTableSizeKind,
  isArrowTextCharacterColorType,
  isArrowTextDictionarySource,
  isStreamingTextDatasetKind,
  isTextDatasetKind,
  LABEL_COLUMN_COUNT,
  LABEL_FIELD_WIDTH,
  LABEL_ROW_SPACING,
  makeStreamingArrowTextSourceAsync,
  STREAMING_TEXT_BATCH_COUNT,
  TEXT_DATASETS,
  type ArrowTextStyleColumnOptions,
  type StreamingTextDatasetKind,
  type TextColorKind,
  type TextDatasetKind,
  type TextSourceKind,
  type TextTableSizeKind
} from './arrow-text-data';
import {
  DECK_CHARACTER_ATTRIBUTE_BYTES_PER_GLYPH,
  getArrowTextRendererMetrics
} from './arrow-text-metrics';
import {ArrowExamplePanelManager, makeArrowExamplePanelHostHtml} from '../arrow-example-panels';
import {supportsVertexStorageBuffers} from '../utils/device-limits';

export const title = 'Text: Strings/Dictionary strings';
export const description = 'Generated Arrow UTF-8 labels expanded into GPU glyph instances.';

type ActiveTextModel = ArrowTextRendererActiveModel;
type TextModelKind = NonNullable<ArrowTextRendererProps['model']>;
type TextRendererUpdateOptions = {
  resetPickedLabel?: boolean;
  syncControls?: boolean;
  updateMetrics?: boolean;
};
const GLYPH_WORLD_SCALE = 0.36;
const VIEW_HEIGHT = 820;
const CAMERA_PAN_SPEED_X = 72;
const CAMERA_PAN_SPEED_Y = 56;
const CHARACTER_SET = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/-';
let fontAtlas: FontAtlas | undefined;
const TEXT_STORAGE_VERTEX_STORAGE_BUFFER_COUNT = 8;
const TEXT_DICTIONARY_VERTEX_STORAGE_BUFFER_COUNT = 10;

function getFontAtlas(): FontAtlas {
  fontAtlas ??= buildSdfFontAtlas({
    characterSet: CHARACTER_SET,
    fontFamily: 'Monaco, Menlo, monospace',
    fontWeight: '600',
    fontSize: 64,
    buffer: 6,
    radius: 12
  });
  return fontAtlas;
}

export class ArrowText2DSourceController extends AnimationLoopTemplate {
  static info = makeArrowExamplePanelHostHtml();

  static props = {createFramebuffer: true, useDevicePixels: true};

  readonly device: Device;
  readonly panels = new ArrowExamplePanelManager({
    descriptionPanel: () =>
      this.controlPanel.makeDescriptionPanel({
        streamingBatchCount: STREAMING_TEXT_BATCH_COUNT,
        deckCharacterAttributeBytesPerGlyph: DECK_CHARACTER_ATTRIBUTE_BYTES_PER_GLYPH
      }),
    settingsPanel: () => this.controlPanel.makeSettingsPanel()
  });
  textInput!: ArrowTextRendererInput;
  textRenderer!: ArrowTextRenderer;
  controlPanel!: ArrowText2DControlPanel;
  pickingModel: Model | null = null;
  picker: PickingManager | null = null;
  arrowVectorBuildTimeMs = 0;
  textModelKind: TextModelKind = 'auto';
  textDatasetKind: TextDatasetKind = '10k-stream';
  textColorKind: TextColorKind = 'string-colors';
  textClipRectsKind: ArrowText2DControlPanelClipRectsKind = 'row-clip-rects';
  textSizeKind: ArrowText2DControlPanelSizeKind = 'row-sizes';
  textAngleKind: ArrowText2DControlPanelAngleKind = 'row-angles';
  animate = true;
  isFinalized = false;
  animationSeconds = 0;
  lastRenderSeconds: number | null = null;

  constructor({device}: AnimationProps) {
    super();
    this.device = device as Device;
  }

  get textModel(): ActiveTextModel {
    return this.textRenderer.model;
  }

  get clippingEnabled(): boolean {
    return this.textClipRectsKind !== 'none';
  }

  get colorEnabled(): boolean {
    return this.textColorKind !== 'constant';
  }

  get sizeEnabled(): boolean {
    return this.textSizeKind !== 'constant';
  }

  get angleEnabled(): boolean {
    return this.textAngleKind !== 'constant';
  }

  getControlPanelState() {
    return {
      rowCountKind: getTextTableSizeKind(this.textDatasetKind),
      sourceKind: getTextDatasetSourceKind(this.textDatasetKind),
      colorKind: this.textColorKind,
      sizeKind: this.textSizeKind,
      angleKind: this.textAngleKind,
      clipRectsKind: this.textClipRectsKind,
      modelKind: this.textModelKind,
      animate: this.animate
    };
  }

  initializeControlPanel(): void {
    this.controlPanel = new ArrowText2DControlPanel({
      device: this.device,
      initialState: this.getControlPanelState(),
      handlers: {
        onRowCountChange: this.handleRowCountSelection,
        onSourceChange: this.handleSourceSelection,
        onColorColumnChange: this.handleTextColorSelection,
        onSizeColumnChange: this.handleTextSizeSelection,
        onAngleColumnChange: this.handleTextAngleSelection,
        onClipRectsColumnChange: this.handleTextClipRectsSelection,
        onModelChange: this.handleModelSelection,
        onAnimateChange: this.handleAnimateToggle
      },
      onRefresh: () => this.panels.refresh()
    });
    this.controlPanel.initialize();
  }

  syncControlPanel(): void {
    this.controlPanel?.syncControls(this.getControlPanelState());
  }

  override async onInitialize(): Promise<void> {
    const {firstRecordBatch, streamingSource} = await this.createInitialStreamingSource(
      this.textDatasetKind as StreamingTextDatasetKind
    );
    if (this.isFinalized) {
      return;
    }

    this.arrowVectorBuildTimeMs = streamingSource.arrowVectorBuildTimeMs;
    this.textRenderer = await this.createTextRenderer(this.textModelKind, [firstRecordBatch]);
    this.setActiveTextInput(this.textRenderer.textInput);
    this.pickingModel = this.createPickingModel();
    this.picker = createArrowTextPickingManager(
      this.device,
      this.textRenderer.shaderInputs,
      this.handleObjectPicked
    );

    this.initializeControlPanel();
    this.panels.mount();
    this.updateMetricLabels();
    this.startStreamingTextDatasetFromSource(
      this.textDatasetKind as StreamingTextDatasetKind,
      this.textColorKind,
      streamingSource
    );
  }

  async createInitialStreamingSource(textDatasetKind: StreamingTextDatasetKind): Promise<{
    firstRecordBatch: arrow.RecordBatch;
    streamingSource: Awaited<ReturnType<typeof makeStreamingArrowTextSourceAsync>>;
  }> {
    const streamingSource = await makeStreamingArrowTextSourceAsync(
      TEXT_DATASETS[getEagerTextDatasetKind(textDatasetKind)],
      this.textColorKind,
      this.getTextStyleColumnOptions()
    );
    const firstRecordBatch = streamingSource.recordBatches[0];
    if (!firstRecordBatch) {
      throw new Error('Arrow text streaming example requires at least one record batch');
    }
    return {firstRecordBatch, streamingSource};
  }

  setActiveTextInput(textInput: ArrowTextRendererInput): void {
    this.textInput = textInput;
  }

  getRendererTextInput(textInput: ArrowTextRendererInput = this.textInput): ArrowTextRendererInput {
    return deriveArrowTextRendererData(textInput, {
      clipRects: this.clippingEnabled,
      colors: this.colorEnabled,
      angles: this.angleEnabled,
      sizes: this.sizeEnabled
    });
  }

  getRendererSourceProps(
    data: ArrowTextRendererProps['data']
  ): Pick<ArrowTextRendererProps, 'data' | 'colors' | 'angles' | 'sizes' | 'clipRects'> {
    return {
      data,
      ...this.getRendererStyleSourceProps()
    };
  }

  getRendererStyleSourceProps(): Pick<
    ArrowTextRendererProps,
    'colors' | 'angles' | 'sizes' | 'clipRects'
  > {
    return {
      clipRects: this.clippingEnabled ? 'clipRects' : null,
      colors: this.colorEnabled ? 'colors' : null,
      angles: this.angleEnabled ? 'angles' : null,
      sizes: this.sizeEnabled ? 'sizes' : null
    };
  }

  getTextStyleColumnOptions(): ArrowTextStyleColumnOptions {
    return {
      clipRects: this.clippingEnabled,
      angles: this.angleEnabled,
      sizes: this.sizeEnabled
    };
  }

  async createTextRenderer(
    modelKind: TextModelKind,
    data: ArrowTextRendererProps['data']
  ): Promise<ArrowTextRenderer> {
    return await ArrowTextRenderer.create(this.device, {
      id: 'arrow-text-2d',
      ...this.getRendererSourceProps(data),
      model: modelKind,
      fontAtlas: getFontAtlas()
    });
  }

  getLabelFieldHeight(): number {
    const datasetKind = getEagerTextDatasetKind(this.textDatasetKind);
    return (TEXT_DATASETS[datasetKind].labelCount / LABEL_COLUMN_COUNT) * LABEL_ROW_SPACING;
  }

  override onRender({device, aspect, time, needsRedraw, _mousePosition}: AnimationProps): void {
    const seconds = time / 1000;
    if (this.lastRenderSeconds === null) {
      this.lastRenderSeconds = seconds;
    }
    const elapsedSeconds = Math.max(seconds - this.lastRenderSeconds, 0);
    this.lastRenderSeconds = seconds;
    if (this.animate) {
      this.animationSeconds += elapsedSeconds;
    }

    const textRendererNeedsRedraw = this.textRenderer.needsRedraw();
    if (this.animate || Boolean(needsRedraw) || Boolean(textRendererNeedsRedraw)) {
      this.drawTextFrame(device, aspect);
    }
    this.pickLabel(_mousePosition, {force: this.animate});
  }

  drawTextFrame(device: Device, aspect: number): void {
    const cameraOffsetAmplitudeX = LABEL_FIELD_WIDTH * 0.43;
    const cameraOffsetAmplitudeY = this.getLabelFieldHeight() * 0.38;
    const cameraOffset: [number, number] = [
      Math.sin(this.animationSeconds * (CAMERA_PAN_SPEED_X / cameraOffsetAmplitudeX)) *
        cameraOffsetAmplitudeX,
      Math.cos(this.animationSeconds * (CAMERA_PAN_SPEED_Y / cameraOffsetAmplitudeY)) *
        cameraOffsetAmplitudeY
    ];
    const viewportWidth = VIEW_HEIGHT * Math.max(aspect, 0.2);
    const viewportScale: [number, number] = [2 / viewportWidth, 2 / VIEW_HEIGHT];

    this.textRenderer.shaderInputs.setProps({
      textViewport: {
        cameraOffset,
        viewportScale,
        glyphWorldScale: GLYPH_WORLD_SCALE,
        time: this.animationSeconds,
        clippingEnabled: this.clippingEnabled ? 1 : 0,
        colorsEnabled: this.colorEnabled ? 1 : 0
      },
      picking: {isActive: false}
    });
    this.textRenderer.predraw(device.commandEncoder);

    const renderPass = device.beginRenderPass({clearColor: [0.015, 0.035, 0.07, 1]});
    this.textRenderer.shaderInputs.setProps({picking: {batchIndex: 0}});
    this.textRenderer.draw(renderPass);
    renderPass.end();
  }

  override onFinalize(): void {
    this.isFinalized = true;
    this.controlPanel?.destroy();
    this.panels.finalize();
    this.picker?.destroy();
    this.pickingModel?.destroy();
    this.textRenderer?.destroy();
  }

  pickLabel(
    mousePosition: number[] | null | undefined,
    options: PickingShouldPickOptions = {}
  ): void {
    if (!this.picker) {
      return;
    }
    if (!mousePosition) {
      clearArrowPickingState(this.picker, this.handleObjectPicked);
      return;
    }

    this.textRenderer.shaderInputs.setProps({picking: {batchIndex: 0}});
    this.pickingModel?.predraw(this.device.commandEncoder);
    runArrowPickingPass({
      picker: this.picker,
      mousePosition,
      pickingOptions: options,
      shaderInputs: this.textRenderer.shaderInputs,
      draw: pickingPass => {
        if (!this.pickingModel) {
          return false;
        }
        drawArrowTextPickingPass(pickingPass, this.pickingModel, this.textModel, {
          onBatch: batchIndex => this.textRenderer.shaderInputs.setProps({picking: {batchIndex}})
        });
      }
    });
  }

  createPickingModel(): Model | null {
    return supportsTextIndexPicking(this.device)
      ? createArrowTextPickingModel(this.device, this.textModel, this.textRenderer.shaderInputs)
      : null;
  }

  resolveAvailableModelKind(modelKind: TextModelKind): TextModelKind {
    const rendererTextInput = this.getRendererTextInput();
    if (modelKind === 'auto') {
      return modelKind;
    }
    if (
      (modelKind === 'storage' || modelKind === 'storage-row-indexed') &&
      !supportsVertexStorageBuffers(this.device, TEXT_STORAGE_VERTEX_STORAGE_BUFFER_COUNT)
    ) {
      return 'auto';
    }
    if (
      modelKind === 'dictionary' &&
      (!supportsVertexStorageBuffers(this.device, TEXT_DICTIONARY_VERTEX_STORAGE_BUFFER_COUNT) ||
        !isArrowTextDictionarySource(rendererTextInput.sourceVectors))
    ) {
      return 'auto';
    }
    if (
      modelKind !== 'attribute' &&
      isArrowTextCharacterColorType(rendererTextInput.sourceVectors.colors?.type)
    ) {
      return 'auto';
    }
    return modelKind;
  }

  handleModelSelection = async (requestedModelKind: TextModelKind): Promise<void> => {
    const nextModelKind = this.resolveAvailableModelKind(requestedModelKind);
    if (nextModelKind === this.textModelKind) {
      this.syncControlPanel();
      return;
    }
    this.textModelKind = nextModelKind;
    await this.refreshCurrentTextData();
  };

  handleRowCountSelection = async (tableSizeKind: TextTableSizeKind): Promise<void> => {
    const sourceKind = getTextDatasetSourceKind(this.textDatasetKind);
    await this.selectTextInput(getTextDatasetKind(tableSizeKind, sourceKind), this.textColorKind);
  };

  handleSourceSelection = async (sourceKind: TextSourceKind): Promise<void> => {
    const tableSizeKind = getTextTableSizeKind(this.textDatasetKind);
    await this.selectTextInput(getTextDatasetKind(tableSizeKind, sourceKind), this.textColorKind);
  };

  handleTextColorSelection = async (textColorKind: TextColorKind): Promise<void> => {
    const sourceKind = getTextDatasetSourceKind(this.textDatasetKind);
    const tableSizeKind = getTextTableSizeKind(this.textDatasetKind);
    await this.selectTextInput(getTextDatasetKind(tableSizeKind, sourceKind), textColorKind);
  };

  async selectTextInput(
    nextDatasetKind: TextDatasetKind,
    nextColorKind: TextColorKind
  ): Promise<void> {
    if (
      (nextDatasetKind === this.textDatasetKind && nextColorKind === this.textColorKind) ||
      !isTextDatasetKind(nextDatasetKind)
    ) {
      this.syncControlPanel();
      return;
    }

    if (isStreamingTextDatasetKind(nextDatasetKind)) {
      this.updateStreamingBatchStatus(0);
      await this.startStreamingTextDataset(nextDatasetKind, nextColorKind);
      return;
    }

    this.syncControlPanel();
  }

  async startStreamingTextDataset(
    textDatasetKind: StreamingTextDatasetKind,
    textColorKind: TextColorKind
  ): Promise<void> {
    const streamingSource = await makeStreamingArrowTextSourceAsync(
      TEXT_DATASETS[getEagerTextDatasetKind(textDatasetKind)],
      textColorKind,
      this.getTextStyleColumnOptions()
    );
    if (this.isFinalized) {
      return;
    }
    this.startStreamingTextDatasetFromSource(textDatasetKind, textColorKind, streamingSource);
  }

  async refreshCurrentTextData(): Promise<void> {
    if (!isStreamingTextDatasetKind(this.textDatasetKind)) {
      this.syncControlPanel();
      return;
    }
    this.updateStreamingBatchStatus(0);
    await this.startStreamingTextDataset(this.textDatasetKind, this.textColorKind);
  }

  startStreamingTextDatasetFromSource(
    textDatasetKind: StreamingTextDatasetKind,
    textColorKind: TextColorKind,
    streamingSource: Awaited<ReturnType<typeof makeStreamingArrowTextSourceAsync>>
  ): void {
    this.updateStreamingBatchStatus(0);
    const recordBatchIterator = createStreamingRecordBatchIterator(streamingSource.recordBatches)[
      Symbol.asyncIterator
    ]();
    const textTableStream = this.panels.beginLoadedTableStream({
      id: 'text-2d-source',
      label: 'Loaded text source',
      kind: 'source',
      recordBatches: streamingSource.recordBatches
    });
    this.arrowVectorBuildTimeMs = streamingSource.arrowVectorBuildTimeMs;
    void this.textRenderer.setProps({
      data: recordBatchIterator,
      model: this.resolveAvailableModelKind(this.textModelKind),
      ...this.getRendererStyleSourceProps(),
      onDataBatch: update => {
        textTableStream.setLoadedBatchCount(update.loadedBatchCount);
        this.handleStreamingTextBatch(update, textDatasetKind, textColorKind);
      }
    });
  }

  handleStreamingTextBatch(
    update: ArrowTextRendererDataBatchUpdate,
    textDatasetKind: StreamingTextDatasetKind,
    textColorKind: TextColorKind
  ): void {
    if (this.isFinalized) {
      return;
    }
    this.textDatasetKind = textDatasetKind;
    this.textColorKind = textColorKind;
    this.setActiveTextInput(update.textInput);
    if (update.isFirstBatch) {
      this.textModelKind = this.textRenderer.props.model ?? this.textModelKind;
    }
    this.handleTextRendererUpdate(update.setPropsResult, {
      resetPickedLabel: update.isFirstBatch,
      syncControls: update.isFirstBatch
    });
    this.updateStreamingBatchStatus(update.loadedBatchCount);
  }

  async updateTextRendererProps(
    props: Partial<ArrowTextRendererProps>,
    redrawReason: string,
    options: TextRendererUpdateOptions = {}
  ): Promise<void> {
    const updateResult = await this.textRenderer.setProps(props, redrawReason);
    if (props.model !== undefined) {
      this.textModelKind = props.model;
    }
    this.setActiveTextInput(this.textRenderer.textInput);
    this.handleTextRendererUpdate(updateResult, options);
  }

  handleTextRendererUpdate(
    updateResult: ArrowTextRendererSetPropsResult,
    {
      resetPickedLabel = updateResult.modelChanged,
      syncControls = true,
      updateMetrics = true
    }: TextRendererUpdateOptions = {}
  ): void {
    if (updateResult.modelChanged) {
      const previousPickingModel = this.pickingModel;
      this.pickingModel = this.createPickingModel();
      previousPickingModel?.destroy();
    }
    if (updateResult.modelChanged || resetPickedLabel) {
      this.picker?.clearPickState();
    }
    if (resetPickedLabel) {
      this.controlPanel?.setPickedLabel('Hover text');
    }
    if (syncControls) {
      this.syncControlPanel();
    }
    if (updateMetrics) {
      this.updateMetricLabels();
    }
  }

  updateMetricLabels(): void {
    this.controlPanel?.setMetricValues(
      getArrowTextRendererMetrics(
        this.textRenderer,
        this.getRendererTextInput(),
        this.arrowVectorBuildTimeMs
      )
    );
  }

  handleAnimateToggle = (enabled: boolean): void => {
    this.animate = enabled;
  };

  handleTextSizeSelection = (sizeKind: ArrowText2DControlPanelSizeKind): void => {
    this.textSizeKind = sizeKind;
    void this.refreshCurrentTextData();
  };

  handleTextAngleSelection = (angleKind: ArrowText2DControlPanelAngleKind): void => {
    this.textAngleKind = angleKind;
    void this.refreshCurrentTextData();
  };

  handleTextClipRectsSelection = (clipRectsKind: ArrowText2DControlPanelClipRectsKind): void => {
    this.textClipRectsKind = clipRectsKind;
    void this.refreshCurrentTextData();
  };

  updateStreamingBatchStatus(loadedBatchCount: number | null): void {
    this.controlPanel?.setStreamingBatchStatus(
      loadedBatchCount === null || !isStreamingTextDatasetKind(this.textDatasetKind)
        ? null
        : loadedBatchCount,
      STREAMING_TEXT_BATCH_COUNT
    );
  }

  handleObjectPicked = ({
    batchIndex,
    objectIndex
  }: {
    batchIndex: number | null;
    objectIndex: number | null;
  }): void => {
    const pickInfo = resolveArrowPickInfo(
      {batchIndex, objectIndex},
      getTextModelTable(this.textModel)
    );
    this.textRenderer.setNeedsRedraw('picked Arrow row changed');
    this.controlPanel?.setPickedLabel(
      pickInfo.rowIndex === null
        ? 'Hover text'
        : formatTextPickingLabel(pickInfo.batchIndex, pickInfo.rowIndex, pickInfo.batchRowIndex)
    );
  };
}

function getTextModelTable(textModel: ActiveTextModel): Pick<GPUTable, 'batches'> | null {
  const table = (textModel as {table?: Pick<GPUTable, 'batches'>}).table;
  return table ?? null;
}

function formatTextPickingLabel(
  batchIndex: number | null,
  rowIndex: number,
  batchRowIndex: number | null
): string {
  if (batchIndex === null) {
    return 'row ' + rowIndex.toLocaleString();
  }
  const batchRowLabel = batchRowIndex === null ? '-' : batchRowIndex.toLocaleString();
  return `row ${rowIndex.toLocaleString()} / batch ${(batchIndex + 1).toLocaleString()} / batch row ${batchRowLabel}`;
}

function deriveArrowTextRendererData(
  data: ArrowTextRendererInput,
  options: {clipRects: boolean; colors: boolean; angles: boolean; sizes: boolean}
): ArrowTextRendererInput {
  const {
    clipRects,
    colors,
    angles,
    sizes,
    sourceVectors: {
      clipRects: sourceClipRects,
      colors: sourceColors,
      angles: sourceAngles,
      sizes: sourceSizes,
      ...sourceVectors
    },
    ...rest
  } = data;
  return {
    ...rest,
    sourceVectors: {
      ...sourceVectors,
      ...(options.clipRects && sourceClipRects ? {clipRects: sourceClipRects} : {}),
      ...(options.colors && sourceColors ? {colors: sourceColors} : {}),
      ...(options.angles && sourceAngles ? {angles: sourceAngles} : {}),
      ...(options.sizes && sourceSizes ? {sizes: sourceSizes} : {})
    },
    ...(options.clipRects && clipRects ? {clipRects} : {}),
    ...(options.colors && colors ? {colors} : {}),
    ...(options.angles && angles ? {angles} : {}),
    ...(options.sizes && sizes ? {sizes} : {})
  } as ArrowTextRendererInput;
}
