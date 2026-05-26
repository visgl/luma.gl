// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {
  AnimationLoopTemplate,
  type AnimationProps,
  type Model,
  type PickingManager
} from '@luma.gl/engine';
import * as arrow from 'apache-arrow';
import {
  ArrowText2DControlPanel,
  makeArrowText2DControlPanelHtml,
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
  type StreamingTextDatasetKind,
  type TextColorKind,
  type TextDatasetKind,
  type TextSourceKind,
  type TextTableSizeKind
} from './arrow-text-data';
import {
  createArrowTextPickingManager,
  createArrowTextPickingModel,
  drawArrowTextPickingPass,
  supportsTextIndexPicking
} from './arrow-text-picking';
import {
  DECK_CHARACTER_ATTRIBUTE_BYTES_PER_GLYPH,
  getArrowTextLayerMetrics
} from './arrow-text-metrics';
import {
  CAMERA_PAN_SPEED_X,
  CAMERA_PAN_SPEED_Y,
  GLYPH_WORLD_SCALE,
  VIEW_HEIGHT,
  CHARACTER_SET
} from './arrow-text-shaders';
import {
  ArrowTextLayer,
  type ArrowTextLayerActiveModel,
  type ArrowTextLayerInput,
  type ArrowTextLayerRecordBatchStreamUpdate,
  type ArrowTextLayerProps,
  type ArrowTextLayerSetPropsResult,
  type ArrowTextLayerStreamingSession
} from './arrow-text-layer';

export const title = 'Text: Utf8/Dictionary<Utf8>';
export const description = 'Generated Arrow UTF-8 labels expanded into GPU glyph instances.';

type ActiveTextModel = ArrowTextLayerActiveModel;
type TextModelKind = NonNullable<ArrowTextLayerProps['model']>;
type TextLayerUpdateOptions = {
  resetPickedLabel?: boolean;
  syncControls?: boolean;
  updateMetrics?: boolean;
};

export default class ArrowText2DAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeArrowText2DControlPanelHtml({
    streamingBatchCount: STREAMING_TEXT_BATCH_COUNT,
    deckCharacterAttributeBytesPerGlyph: DECK_CHARACTER_ATTRIBUTE_BYTES_PER_GLYPH
  });

  static props = {createFramebuffer: true, useDevicePixels: true};

  readonly device: Device;
  textInput!: ArrowTextLayerInput;
  textLayer!: ArrowTextLayer;
  controlPanel!: ArrowText2DControlPanel;
  pickingModel: Model | null = null;
  picker: PickingManager | null = null;
  loadedRecordBatches: arrow.RecordBatch[] = [];
  arrowVectorBuildTimeMs = 0;
  textModelKind: TextModelKind = 'auto';
  textDatasetKind: TextDatasetKind = '100k-stream';
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
    return this.textLayer.model;
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
      }
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

    this.loadedRecordBatches = [firstRecordBatch];
    this.arrowVectorBuildTimeMs = streamingSource.arrowVectorBuildTimeMs;
    this.textLayer = await this.createTextLayer(this.textModelKind);
    this.setActiveTextInput(this.textLayer.textInput);
    this.pickingModel = this.createPickingModel();
    this.picker = createArrowTextPickingManager(
      this.device,
      this.textLayer.shaderInputs,
      this.handleObjectPicked
    );

    this.initializeControlPanel();
    this.updateMetricLabels();
    this.startStreamingTextDatasetFromSource(
      this.textDatasetKind as StreamingTextDatasetKind,
      this.textColorKind,
      streamingSource,
      this.textLayer.beginRecordBatchStream()
    );
  }

  async createInitialStreamingSource(textDatasetKind: StreamingTextDatasetKind): Promise<{
    firstRecordBatch: arrow.RecordBatch;
    streamingSource: Awaited<ReturnType<typeof makeStreamingArrowTextSourceAsync>>;
  }> {
    const streamingSource = await makeStreamingArrowTextSourceAsync(
      TEXT_DATASETS[getEagerTextDatasetKind(textDatasetKind)],
      this.textColorKind
    );
    const firstRecordBatch = streamingSource.recordBatches[0];
    if (!firstRecordBatch) {
      throw new Error('Arrow text streaming example requires at least one record batch');
    }
    return {firstRecordBatch, streamingSource};
  }

  setActiveTextInput(textInput: ArrowTextLayerInput): void {
    this.textInput = textInput;
  }

  getLayerTextInput(textInput: ArrowTextLayerInput = this.textInput): ArrowTextLayerInput {
    return deriveArrowTextLayerData(textInput, {
      clipRects: this.clippingEnabled,
      colors: this.colorEnabled,
      angles: this.angleEnabled,
      sizes: this.sizeEnabled
    });
  }

  getLayerSourceProps(): Pick<
    ArrowTextLayerProps,
    'data' | 'colors' | 'angles' | 'sizes' | 'clipRects'
  > {
    return {
      data: this.loadedRecordBatches,
      clipRects: this.clippingEnabled ? 'clipRects' : null,
      colors: this.colorEnabled ? 'colors' : null,
      angles: this.angleEnabled ? 'angles' : null,
      sizes: this.sizeEnabled ? 'sizes' : null
    };
  }

  async createTextLayer(modelKind: TextModelKind): Promise<ArrowTextLayer> {
    return await ArrowTextLayer.create(this.device, {
      id: 'arrow-text-2d',
      ...this.getLayerSourceProps(),
      model: modelKind,
      characterSet: CHARACTER_SET,
      fontSettings: {
        fontFamily: 'Monaco, Menlo, monospace',
        fontWeight: '600',
        fontSize: 64,
        buffer: 6,
        sdf: true,
        radius: 12
      }
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

    const textModelNeedsRedraw = this.textModel.needsRedraw();
    if (this.animate || Boolean(needsRedraw) || Boolean(textModelNeedsRedraw)) {
      this.drawTextFrame(device, aspect);
    }
    this.pickLabel(_mousePosition);
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

    this.textLayer.shaderInputs.setProps({
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
    this.textModel.predraw(device.commandEncoder);

    const renderPass = device.beginRenderPass({clearColor: [0.015, 0.035, 0.07, 1]});
    this.textLayer.shaderInputs.setProps({picking: {batchIndex: 0}});
    this.textModel.draw(renderPass);
    renderPass.end();
  }

  override onFinalize(): void {
    this.isFinalized = true;
    this.controlPanel?.destroy();
    this.picker?.destroy();
    this.pickingModel?.destroy();
    this.textLayer?.destroy();
  }

  pickLabel(mousePosition: number[] | null | undefined): void {
    if (!this.picker || !this.picker.shouldPick(mousePosition as [number, number] | null)) {
      return;
    }

    this.textLayer.shaderInputs.setProps({picking: {batchIndex: 0}});
    this.pickingModel?.predraw(this.device.commandEncoder);
    const pickingPass = this.picker.beginRenderPass();
    if (this.pickingModel) {
      drawArrowTextPickingPass(pickingPass, this.pickingModel, this.textModel);
    }
    pickingPass.end();
    this.textLayer.shaderInputs.setProps({picking: {isActive: false}});
    void this.picker.updatePickInfo(mousePosition as [number, number]);
  }

  createPickingModel(): Model | null {
    return supportsTextIndexPicking(this.device)
      ? createArrowTextPickingModel(this.device, this.textModel, this.textLayer.shaderInputs)
      : null;
  }

  resolveAvailableModelKind(modelKind: TextModelKind): TextModelKind {
    const layerTextInput = this.getLayerTextInput();
    if (modelKind === 'auto') {
      return modelKind;
    }
    if (modelKind !== 'attribute' && this.device.type !== 'webgpu') {
      return 'auto';
    }
    if (modelKind === 'dictionary' && !isArrowTextDictionarySource(layerTextInput.sourceVectors)) {
      return 'auto';
    }
    if (
      modelKind !== 'attribute' &&
      isArrowTextCharacterColorType(layerTextInput.sourceVectors.colors?.type)
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
    await this.updateTextLayerProps({model: nextModelKind}, 'text model selector changed', {
      resetPickedLabel: true
    });
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
      const streamingSession = this.textLayer.beginRecordBatchStream();
      this.updateStreamingBatchStatus(0);
      await this.startStreamingTextDataset(nextDatasetKind, nextColorKind, streamingSession);
      return;
    }

    this.syncControlPanel();
  }

  async startStreamingTextDataset(
    textDatasetKind: StreamingTextDatasetKind,
    textColorKind: TextColorKind,
    streamingSession: ArrowTextLayerStreamingSession
  ): Promise<void> {
    const streamingSource = await makeStreamingArrowTextSourceAsync(
      TEXT_DATASETS[getEagerTextDatasetKind(textDatasetKind)],
      textColorKind
    );
    if (this.isFinalized) {
      return;
    }
    this.startStreamingTextDatasetFromSource(
      textDatasetKind,
      textColorKind,
      streamingSource,
      streamingSession
    );
  }

  startStreamingTextDatasetFromSource(
    textDatasetKind: StreamingTextDatasetKind,
    textColorKind: TextColorKind,
    streamingSource: Awaited<ReturnType<typeof makeStreamingArrowTextSourceAsync>>,
    streamingSession: ArrowTextLayerStreamingSession
  ): void {
    this.updateStreamingBatchStatus(0);
    const recordBatchIterator = createStreamingRecordBatchIterator(streamingSource.recordBatches)[
      Symbol.asyncIterator
    ]();
    this.arrowVectorBuildTimeMs = streamingSource.arrowVectorBuildTimeMs;
    void this.textLayer.streamRecordBatches({
      data: recordBatchIterator,
      model: textInput => {
        this.setActiveTextInput(textInput);
        return this.resolveAvailableModelKind(this.textModelKind);
      },
      mapTextInput: textInput => this.getLayerTextInput(textInput),
      streamingSession,
      onBatch: update =>
        this.handleStreamingTextBatch(update, textDatasetKind, textColorKind, streamingSource)
    });
  }

  handleStreamingTextBatch(
    update: ArrowTextLayerRecordBatchStreamUpdate,
    textDatasetKind: StreamingTextDatasetKind,
    textColorKind: TextColorKind,
    streamingSource: Awaited<ReturnType<typeof makeStreamingArrowTextSourceAsync>>
  ): void {
    if (this.isFinalized) {
      return;
    }
    this.textDatasetKind = textDatasetKind;
    this.textColorKind = textColorKind;
    this.loadedRecordBatches = streamingSource.recordBatches.slice(0, update.loadedBatchCount);
    this.setActiveTextInput(update.textInput);
    if (update.isFirstBatch) {
      this.textModelKind = this.textLayer.props.model ?? this.textModelKind;
    }
    this.handleTextLayerUpdate(update.setPropsResult, {
      resetPickedLabel: update.isFirstBatch,
      syncControls: update.isFirstBatch
    });
    this.updateStreamingBatchStatus(update.loadedBatchCount);
  }

  async updateTextLayerProps(
    props: Partial<ArrowTextLayerProps>,
    redrawReason: string,
    options: TextLayerUpdateOptions = {}
  ): Promise<void> {
    const updateResult = await this.textLayer.setProps(props, redrawReason);
    if (props.model !== undefined) {
      this.textModelKind = props.model;
    }
    this.setActiveTextInput(this.textLayer.textInput);
    this.handleTextLayerUpdate(updateResult, options);
  }

  handleTextLayerUpdate(
    updateResult: ArrowTextLayerSetPropsResult,
    {
      resetPickedLabel = updateResult.modelChanged,
      syncControls = true,
      updateMetrics = true
    }: TextLayerUpdateOptions = {}
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
      getArrowTextLayerMetrics(
        this.textLayer,
        this.getLayerTextInput(),
        this.arrowVectorBuildTimeMs
      )
    );
  }

  handleAnimateToggle = (enabled: boolean): void => {
    this.animate = enabled;
  };

  handleTextSizeSelection = (sizeKind: ArrowText2DControlPanelSizeKind): void => {
    this.textSizeKind = sizeKind;
    void this.updateTextLayerProps(this.getLayerSourceProps(), 'text row sizes changed', {
      resetPickedLabel: true
    });
  };

  handleTextAngleSelection = (angleKind: ArrowText2DControlPanelAngleKind): void => {
    this.textAngleKind = angleKind;
    void this.updateTextLayerProps(this.getLayerSourceProps(), 'text row angles changed', {
      resetPickedLabel: true
    });
  };

  handleTextClipRectsSelection = (clipRectsKind: ArrowText2DControlPanelClipRectsKind): void => {
    this.textClipRectsKind = clipRectsKind;
    void this.updateTextLayerProps(this.getLayerSourceProps(), 'text clip rects changed', {
      resetPickedLabel: true
    });
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
    this.textModel.setNeedsRedraw('picked Arrow row changed');
    this.controlPanel?.setPickedLabel(
      batchIndex === null || objectIndex === null
        ? 'Hover text'
        : 'row ' + objectIndex.toLocaleString()
    );
  };
}

function deriveArrowTextLayerData(
  data: ArrowTextLayerInput,
  options: {clipRects: boolean; colors: boolean; angles: boolean; sizes: boolean}
): ArrowTextLayerInput {
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
  } as ArrowTextLayerInput;
}
