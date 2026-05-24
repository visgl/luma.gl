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
import {ArrowText2DControlPanel, makeArrowText2DControlPanelHtml} from './control-panel';
import {
  createStreamingRecordBatchIterator,
  getEagerTextDatasetKind,
  getTextDatasetKind,
  getTextDatasetRowCountKind,
  getTextDatasetSourceKind,
  getTextInputKind,
  getTextTableSizeKind,
  isArrowTextCharacterColorType,
  isArrowTextDictionarySource,
  isStreamingTextDatasetKind,
  isTextDatasetKind,
  LABEL_COLUMN_COUNT,
  LABEL_FIELD_WIDTH,
  LABEL_ROW_SPACING,
  makeArrowTextSourceAsync,
  makeStreamingArrowTextSourceAsync,
  STREAMING_TEXT_BATCH_COUNT,
  TEXT_DATASETS,
  type EagerTextDatasetKind,
  type StreamingTextDatasetKind,
  type TextColorKind,
  type TextDatasetKind,
  type TextInputKind,
  type TextSourceKind,
  type TextTableSizeKind
} from './arrow-text-data';
import {
  createArrowTextPickingManager,
  createArrowTextPickingModel,
  drawArrowTextPickingPass,
  getArrowTextRenderModules,
  supportsTextIndexPicking
} from './arrow-text-picking';
import {
  DECK_CHARACTER_ATTRIBUTE_BYTES_PER_GLYPH,
  getArrowTextLayerMetrics
} from './arrow-text-metrics';
import {
  CAMERA_PAN_SPEED_X,
  CAMERA_PAN_SPEED_Y,
  CHARACTER_SET,
  createArrowTextShaderInputs,
  DICTIONARY_STORAGE_TEXT_SHADER_LAYOUT,
  DICTIONARY_STORAGE_WGSL_SHADER,
  FS_GLSL,
  GLYPH_WORLD_SCALE,
  STORAGE_INDEXED_TEXT_SHADER_LAYOUT,
  STORAGE_INDEXED_WGSL_SHADER,
  TEXT_SHADER_LAYOUT,
  VIEW_HEIGHT,
  VS_GLSL,
  WGSL_SHADER
} from './arrow-text-shaders';
import {
  ArrowTextLayer,
  prepareArrowTextInput,
  type ArrowTextLayerActiveModel,
  type ArrowTextLayerInput,
  type ArrowTextLayerModel,
  type ArrowTextLayerRecordBatchStreamUpdate,
  type ArrowTextLayerProps,
  type ArrowTextLayerSetPropsResult,
  type ArrowTextLayerStreamingSession
} from './arrow-text-layer';

export const title = 'Text: Utf8/Dictionary<Utf8>';
export const description = 'Generated Arrow UTF-8 labels expanded into GPU glyph instances.';

type ActiveTextModel = ArrowTextLayerActiveModel;
type TextModelKind = ArrowTextLayerModel;
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

  readonly shaderInputs = createArrowTextShaderInputs();
  readonly device: Device;
  readonly textInputs: Partial<Record<TextInputKind, ArrowTextLayerInput>> = {};
  readonly textInputPromises: Partial<Record<TextInputKind, Promise<ArrowTextLayerInput>>> = {};
  textInput!: ArrowTextLayerInput;
  textLayer!: ArrowTextLayer;
  controlPanel!: ArrowText2DControlPanel;
  pickingModel: Model | null = null;
  picker: PickingManager | null = null;
  textModelKind: TextModelKind = 'auto';
  textDatasetKind: TextDatasetKind = '100k';
  textColorKind: TextColorKind = 'string-colors';
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
    return this.textLayer?.clippingEnabled ?? true;
  }

  get colorEnabled(): boolean {
    return this.textLayer?.colorsEnabled ?? true;
  }

  get sizeEnabled(): boolean {
    return this.textLayer?.sizesEnabled ?? true;
  }

  get angleEnabled(): boolean {
    return this.textLayer?.anglesEnabled ?? true;
  }

  getControlPanelState() {
    return {
      rowCountKind: getTextTableSizeKind(this.textDatasetKind),
      sourceKind: getTextDatasetSourceKind(this.textDatasetKind),
      colorKind: this.textColorKind,
      modelKind: this.textModelKind,
      animate: this.animate,
      clippingEnabled: this.clippingEnabled,
      colorEnabled: this.colorEnabled,
      sizeEnabled: this.sizeEnabled,
      angleEnabled: this.angleEnabled
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
        onModelChange: this.handleModelSelection,
        onAnimateChange: this.handleAnimateToggle,
        onClippingChange: this.handleClippingToggle,
        onColorChange: this.handleColorToggle,
        onSizeChange: this.handleSizeToggle,
        onAngleChange: this.handleAngleToggle
      }
    });
    this.controlPanel.initialize();
  }

  syncControlPanel(): void {
    this.controlPanel?.syncControls(this.getControlPanelState());
  }

  override async onInitialize(): Promise<void> {
    this.setActiveTextInput(
      await this.getOrCreateTextInput(
        getEagerTextDatasetKind(this.textDatasetKind),
        this.textColorKind
      )
    );
    if (this.isFinalized) {
      return;
    }

    this.textLayer = this.createTextLayer(this.textModelKind);
    this.pickingModel = this.createPickingModel();
    this.picker = createArrowTextPickingManager(
      this.device,
      this.shaderInputs,
      this.handleObjectPicked
    );

    this.initializeControlPanel();
    this.updateMetricLabels();
    this.updateStreamingBatchStatus(null);

    void this.getOrCreateTextInput('500k', this.textColorKind);
    void this.getOrCreateTextInput('1m', this.textColorKind);
  }

  async getOrCreateTextInput(
    textDatasetKind: EagerTextDatasetKind,
    textColorKind: TextColorKind
  ): Promise<ArrowTextLayerInput> {
    const textInputKind = getTextInputKind(textDatasetKind, textColorKind);
    const cachedTextInput = this.textInputs[textInputKind];
    if (cachedTextInput) {
      return cachedTextInput;
    }

    const cachedPromise = this.textInputPromises[textInputKind];
    if (cachedPromise) {
      return cachedPromise;
    }

    const textInputPromise = makeArrowTextSourceAsync(TEXT_DATASETS[textDatasetKind], textColorKind)
      .then(textSource => prepareArrowTextInput(this.device, textSource))
      .then(textInput => {
        this.textInputs[textInputKind] = textInput;
        delete this.textInputPromises[textInputKind];
        this.syncControlPanel();
        return textInput;
      });
    this.textInputPromises[textInputKind] = textInputPromise;
    this.syncControlPanel();
    return textInputPromise;
  }

  setActiveTextInput(textInput: ArrowTextLayerInput): void {
    this.textInput = textInput;
  }

  createTextLayer(modelKind: TextModelKind): ArrowTextLayer {
    return new ArrowTextLayer(this.device, {
      id: 'arrow-text-2d',
      data: this.textInput,
      model: modelKind,
      clippingEnabled: this.clippingEnabled,
      colorsEnabled: this.colorEnabled,
      anglesEnabled: this.angleEnabled,
      sizesEnabled: this.sizeEnabled,
      characterSet: CHARACTER_SET,
      fontSettings: {
        fontFamily: 'Monaco, Menlo, monospace',
        fontWeight: '600',
        fontSize: 64,
        buffer: 6,
        sdf: true,
        radius: 12
      },
      source: WGSL_SHADER,
      vs: VS_GLSL,
      fs: FS_GLSL,
      shaderLayout: TEXT_SHADER_LAYOUT,
      shaderInputs: this.shaderInputs,
      modules: getArrowTextRenderModules(this.device) as never,
      parameters: {
        depthWriteEnabled: false,
        blend: true,
        blendColorOperation: 'add',
        blendAlphaOperation: 'add',
        blendColorSrcFactor: 'src-alpha',
        blendColorDstFactor: 'one-minus-src-alpha',
        blendAlphaSrcFactor: 'one',
        blendAlphaDstFactor: 'one-minus-src-alpha'
      },
      color: [210, 232, 255, 255],
      storageSource: STORAGE_INDEXED_WGSL_SHADER,
      storageShaderLayout: STORAGE_INDEXED_TEXT_SHADER_LAYOUT,
      dictionarySource: DICTIONARY_STORAGE_WGSL_SHADER,
      dictionaryShaderLayout: DICTIONARY_STORAGE_TEXT_SHADER_LAYOUT
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

    this.shaderInputs.setProps({
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
    this.shaderInputs.setProps({picking: {batchIndex: 0}});
    this.textModel.draw(renderPass);
    renderPass.end();
  }

  override onFinalize(): void {
    this.isFinalized = true;
    this.controlPanel?.destroy();
    this.picker?.destroy();
    this.pickingModel?.destroy();
    this.textLayer?.destroy();
    for (const textInput of Object.values(this.textInputs)) {
      textInput?.destroy();
    }
  }

  pickLabel(mousePosition: number[] | null | undefined): void {
    if (!this.picker || !this.picker.shouldPick(mousePosition as [number, number] | null)) {
      return;
    }

    this.shaderInputs.setProps({picking: {batchIndex: 0}});
    this.pickingModel?.predraw(this.device.commandEncoder);
    const pickingPass = this.picker.beginRenderPass();
    if (this.pickingModel) {
      drawArrowTextPickingPass(pickingPass, this.pickingModel, this.textModel);
    }
    pickingPass.end();
    this.shaderInputs.setProps({picking: {isActive: false}});
    void this.picker.updatePickInfo(mousePosition as [number, number]);
  }

  createPickingModel(): Model | null {
    return supportsTextIndexPicking(this.device)
      ? createArrowTextPickingModel(this.device, this.textModel, this.shaderInputs)
      : null;
  }

  resolveAvailableModelKind(modelKind: TextModelKind): TextModelKind {
    if (modelKind === 'auto') {
      return modelKind;
    }
    if (modelKind !== 'attribute' && this.device.type !== 'webgpu') {
      return 'auto';
    }
    if (modelKind === 'dictionary' && !isArrowTextDictionarySource(this.textInput.sourceVectors)) {
      return 'auto';
    }
    if (
      modelKind !== 'attribute' &&
      isArrowTextCharacterColorType(this.textInput.sourceVectors.colors?.type)
    ) {
      return 'auto';
    }
    return modelKind;
  }

  handleModelSelection = (requestedModelKind: TextModelKind): void => {
    const nextModelKind = this.resolveAvailableModelKind(requestedModelKind);
    if (nextModelKind === this.textModelKind) {
      this.syncControlPanel();
      return;
    }
    this.updateTextLayerProps({model: nextModelKind}, 'text model selector changed', {
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
    const nextTableSizeKind =
      textColorKind === 'character-colors' && isStreamingTextDatasetKind(tableSizeKind)
        ? getTextDatasetRowCountKind(this.textDatasetKind)
        : tableSizeKind;
    await this.selectTextInput(getTextDatasetKind(nextTableSizeKind, sourceKind), textColorKind);
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
      await this.startStreamingTextDataset(nextDatasetKind, 'string-colors', streamingSession);
      return;
    }

    this.textLayer.cancelRecordBatchStream();
    this.setActiveTextInput(await this.getOrCreateTextInput(nextDatasetKind, nextColorKind));
    if (this.isFinalized) {
      return;
    }
    this.textDatasetKind = nextDatasetKind;
    this.textColorKind = nextColorKind;
    this.updateStreamingBatchStatus(null);
    this.updateTextLayerProps(
      {
        data: this.textInput,
        model: this.resolveAvailableModelKind(this.textModelKind)
      },
      'text dataset selector changed',
      {resetPickedLabel: true}
    );
  }

  async startStreamingTextDataset(
    textDatasetKind: StreamingTextDatasetKind,
    textColorKind: TextColorKind,
    streamingSession: ArrowTextLayerStreamingSession
  ): Promise<void> {
    const streamingSource = await makeStreamingArrowTextSourceAsync(
      TEXT_DATASETS[getEagerTextDatasetKind(textDatasetKind)]
    );
    if (this.isFinalized) {
      return;
    }

    const recordBatchIterator = createStreamingRecordBatchIterator(streamingSource.recordBatches)[
      Symbol.asyncIterator
    ]();
    void this.textLayer.streamRecordBatches({
      recordBatchIterator,
      arrowVectorBuildTimeMs: streamingSource.arrowVectorBuildTimeMs,
      model: textInput => {
        this.setActiveTextInput(textInput);
        return this.resolveAvailableModelKind(this.textModelKind);
      },
      streamingSession,
      onBatch: update => this.handleStreamingTextBatch(update, textDatasetKind, textColorKind)
    });
  }

  handleStreamingTextBatch(
    update: ArrowTextLayerRecordBatchStreamUpdate,
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
      this.textModelKind = this.textLayer.props.model ?? this.textModelKind;
    }
    this.handleTextLayerUpdate(update.setPropsResult, {
      resetPickedLabel: update.isFirstBatch,
      syncControls: update.isFirstBatch
    });
    this.updateStreamingBatchStatus(update.loadedBatchCount);
  }

  updateTextLayerProps(
    props: Partial<ArrowTextLayerProps>,
    redrawReason: string,
    options: TextLayerUpdateOptions = {}
  ): void {
    const updateResult = this.textLayer.setProps(props, redrawReason);
    if (props.model !== undefined) {
      this.textModelKind = props.model;
    }
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
    this.controlPanel?.setMetricValues(getArrowTextLayerMetrics(this.textLayer, this.textInput));
  }

  handleAnimateToggle = (enabled: boolean): void => {
    this.animate = enabled;
  };

  handleClippingToggle = (enabled: boolean): void => {
    this.updateTextLayerProps({clippingEnabled: enabled}, 'text clipping toggled', {
      syncControls: false,
      updateMetrics: false
    });
  };

  handleColorToggle = (enabled: boolean): void => {
    this.updateTextLayerProps({colorsEnabled: enabled}, 'text row colors toggled', {
      resetPickedLabel: true
    });
  };

  handleSizeToggle = (enabled: boolean): void => {
    this.updateTextLayerProps({sizesEnabled: enabled}, 'text row sizes toggled', {
      resetPickedLabel: true
    });
  };

  handleAngleToggle = (enabled: boolean): void => {
    this.updateTextLayerProps({anglesEnabled: enabled}, 'text row angles toggled', {
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
