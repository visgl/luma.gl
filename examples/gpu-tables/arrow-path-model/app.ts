// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {AnimationLoopTemplate} from '@luma.gl/engine';
import {ArrowPathModelControlPanel, makeArrowPathModelControlPanelHtml} from './control-panel';
import {
  createStreamingPathRecordBatchIterator,
  getArrowPathInputKind,
  getBaseArrowPathRowCountKind,
  getTemporalCurrentTimeMilliseconds,
  getValidPathModelKindForTimeKind,
  isStreamingArrowPathRowCountKind,
  makeArrowPathRecordBatches,
  makeArrowPathSourceData,
  MEASURE_SWEEP_DURATION,
  PATH_DATASETS,
  STREAMING_PATH_BATCH_COUNT,
  STREAMING_PATH_ROWS_PER_CHUNK,
  TEMPORAL_TRAIL_LENGTH_MILLISECONDS,
  type ArrowPathCapKind,
  type ArrowPathColorKind,
  type ArrowPathCoordinateKind,
  type ArrowPathInputKind,
  type ArrowPathJointKind,
  type ArrowPathRowCountKind,
  type ArrowPathTimeKind
} from './arrow-path-data';
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
import {DECK_PATH_ATTRIBUTE_BYTES_PER_SEGMENT, getArrowPathMetrics} from './arrow-path-metrics';
import {
  ArrowPathLayer,
  prepareArrowPathInput,
  type ArrowPathLayerInput,
  type ArrowPathLayerModel,
  type ArrowPathLayerProps,
  type ArrowPathLayerRecordBatchStreamUpdate,
  type ArrowPathLayerSetPropsResult,
  type ArrowPathLayerStreamingSession
} from './arrow-path-layer';

export const title = 'Paths: XYZM + List<Timestamp>';
export const description =
  'Variable-length Arrow XYZM path rows rendered through attribute-backed and storage-backed path models, plus aligned List<Timestamp> rows for Trips-style temporal filtering.';

type PathLayerUpdateOptions = {
  syncControls?: boolean;
  updateMetrics?: boolean;
};

export default class ArrowPathModelAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeArrowPathModelControlPanelHtml({
    rowLabels: {
      '240': PATH_DATASETS['240'].label,
      '960': PATH_DATASETS['960'].label,
      '2400': PATH_DATASETS['2400'].label,
      '2400-stream': `${PATH_DATASETS['2400'].label} streamed`
    },
    deckPathAttributeBytesPerSegment: DECK_PATH_ATTRIBUTE_BYTES_PER_SEGMENT
  });

  static props = {useDevicePixels: true};

  readonly device: Device;
  readonly shaderInputs = createArrowPathShaderInputs();
  readonly pathInputs: Partial<Record<ArrowPathInputKind, ArrowPathLayerInput>> = {};
  activeRowCountKind: ArrowPathRowCountKind = '240';
  activeCoordinateKind: ArrowPathCoordinateKind = 'float32';
  activeColorKind: ArrowPathColorKind = 'vertex-colors';
  activeTimeKind: ArrowPathTimeKind = 'xyzm';
  activePathModelKind: ArrowPathLayerModel = 'auto';
  activePathInput!: ArrowPathLayerInput;
  pathLayer!: ArrowPathLayer;
  measureSweepEnabled = true;
  widthsEnabled = true;
  capKind: ArrowPathCapKind = 'square';
  jointKind: ArrowPathJointKind = 'miter';
  miterLimit = 4;
  measureTime = 0;
  lastRenderSeconds: number | null = null;
  pathInputRequestVersion = 0;
  isFinalized = false;
  controlPanel!: ArrowPathModelControlPanel;

  constructor({device}: AnimationProps) {
    super();
    this.device = device as Device;
  }

  override async onInitialize(): Promise<void> {
    this.activePathInput = await this.getOrCreatePathInput(
      this.activeRowCountKind,
      this.activeCoordinateKind,
      this.activeColorKind,
      this.activeTimeKind
    );
    this.pathLayer = this.createPathLayer(this.activePathModelKind);
    this.initializeControlPanel();
    this.updateMetricLabels();
  }

  override onRender({aspect, device, time}: AnimationProps): void {
    if (!this.pathLayer) {
      return;
    }

    const seconds = time / 1000;
    if (this.lastRenderSeconds === null) {
      this.lastRenderSeconds = seconds;
    }
    const elapsedSeconds = Math.max(seconds - this.lastRenderSeconds, 0);
    this.lastRenderSeconds = seconds;
    if (this.measureSweepEnabled) {
      this.measureTime += elapsedSeconds * 0.24;
      if (this.measureTime > MEASURE_SWEEP_DURATION) {
        this.measureTime -= MEASURE_SWEEP_DURATION;
      }
    }
    if (this.pathLayer.resolvedModel === 'trips') {
      this.pathLayer.setProps({
        currentTime: getTemporalCurrentTimeMilliseconds(this.measureTime)
      });
    }

    this.shaderInputs.setProps({
      pathViewport: {
        viewportScale: [1 / Math.max(aspect, 0.2), 1],
        time: this.measureTime,
        colorsEnabled: this.activeColorKind === 'none' ? 0 : 1,
        widthsEnabled: this.widthsEnabled ? 1 : 0,
        capRounded: this.capKind === 'round' ? 1 : 0,
        jointRounded: this.jointKind === 'round' ? 1 : 0,
        miterLimit: this.miterLimit
      }
    });

    const renderPass = device.beginRenderPass({
      clearColor: [0.015, 0.035, 0.07, 1]
    });
    this.pathLayer.draw(renderPass);
    renderPass.end();
  }

  override onFinalize(): void {
    this.isFinalized = true;
    this.pathInputRequestVersion++;
    this.controlPanel?.destroy();
    this.pathLayer?.destroy();
    for (const pathInput of Object.values(this.pathInputs)) {
      pathInput?.destroy();
    }
  }

  createPathLayer(modelKind: ArrowPathLayerModel): ArrowPathLayer {
    return new ArrowPathLayer(this.device, {
      id: 'arrow-path-model',
      data: this.activePathInput,
      model: modelKind,
      timeColumn: this.activeTimeKind,
      shaderInputs: this.shaderInputs,
      topology: 'triangle-list' as const,
      vertexCount: 12,
      parameters: {
        depthWriteEnabled: false,
        blend: true,
        blendColorOperation: 'add',
        blendAlphaOperation: 'add',
        blendColorSrcFactor: 'src-alpha',
        blendColorDstFactor: 'one-minus-src-alpha',
        blendAlphaSrcFactor: 'one',
        blendAlphaDstFactor: 'one-minus-src-alpha'
      } as const,
      source: WGSL_SHADER,
      vs: VS_GLSL,
      fs: FS_GLSL,
      shaderLayout: PATH_SHADER_LAYOUT,
      storageSource: STORAGE_WGSL_SHADER,
      storageShaderLayout: STORAGE_PATH_SHADER_LAYOUT,
      tripsSource: TRIPS_STORAGE_WGSL_SHADER,
      tripsShaderLayout: STORAGE_PATH_SHADER_LAYOUT,
      currentTime: getTemporalCurrentTimeMilliseconds(this.measureTime),
      trailLength: TEMPORAL_TRAIL_LENGTH_MILLISECONDS,
      color: [199, 219, 245, 235],
      width: 0.0035
    });
  }

  async getOrCreatePathInput(
    rowCountKind: ArrowPathRowCountKind,
    coordinateKind: ArrowPathCoordinateKind,
    colorKind: ArrowPathColorKind,
    timeKind: ArrowPathTimeKind
  ): Promise<ArrowPathLayerInput> {
    const inputKind = getArrowPathInputKind(rowCountKind, coordinateKind, colorKind, timeKind);
    const cachedPathInput = this.pathInputs[inputKind];
    if (cachedPathInput) {
      return cachedPathInput;
    }
    const pathInput = await prepareArrowPathInput(
      this.device,
      makeArrowPathSourceData(
        PATH_DATASETS[getBaseArrowPathRowCountKind(rowCountKind)],
        coordinateKind,
        colorKind,
        timeKind
      )
    );
    this.pathInputs[inputKind] = pathInput;
    return pathInput;
  }

  initializeControlPanel(): void {
    this.controlPanel = new ArrowPathModelControlPanel({
      device: this.device,
      initialState: this.getControlPanelState(),
      handlers: {
        onRowCountChange: this.handleRowCountSelection,
        onCoordinateChange: this.handleCoordinateSelection,
        onColorChange: this.handleColorColumnSelection,
        onTimeChange: this.handleTimeColumnSelection,
        onModelChange: this.handleModelSelection,
        onMeasureSweepChange: this.handleMeasureSweepToggle,
        onWidthChange: this.handleWidthToggle,
        onCapChange: this.handleCapSelection,
        onJointChange: this.handleJointSelection,
        onMiterLimitChange: this.handleMiterLimitInput
      }
    });
    this.controlPanel.initialize();
  }

  getControlPanelState() {
    return {
      rowCountKind: this.activeRowCountKind,
      coordinateKind: this.activeCoordinateKind,
      colorKind: this.activeColorKind,
      timeKind: this.activeTimeKind,
      modelKind: this.activePathModelKind,
      capKind: this.capKind,
      jointKind: this.jointKind,
      miterLimit: this.miterLimit
    };
  }

  updateMetricLabels(): void {
    this.controlPanel?.setMetricValues(getArrowPathMetrics(this.pathLayer, this.activePathInput));
  }

  readonly handleRowCountSelection = async (
    nextRowCountKind: ArrowPathRowCountKind
  ): Promise<void> => {
    if (nextRowCountKind === this.activeRowCountKind) {
      return;
    }
    await this.replacePathInput(
      nextRowCountKind,
      this.activeCoordinateKind,
      this.activeColorKind,
      this.activeTimeKind
    );
  };

  readonly handleCoordinateSelection = async (
    nextCoordinateKind: ArrowPathCoordinateKind
  ): Promise<void> => {
    if (nextCoordinateKind === this.activeCoordinateKind) {
      return;
    }
    await this.replacePathInput(
      this.activeRowCountKind,
      nextCoordinateKind,
      this.activeColorKind,
      this.activeTimeKind
    );
  };

  readonly handleColorColumnSelection = async (
    nextColorKind: ArrowPathColorKind
  ): Promise<void> => {
    if (nextColorKind === this.activeColorKind) {
      return;
    }
    await this.replacePathInput(
      this.activeRowCountKind,
      this.activeCoordinateKind,
      nextColorKind,
      this.activeTimeKind
    );
  };

  readonly handleTimeColumnSelection = async (nextTimeKind: ArrowPathTimeKind): Promise<void> => {
    if (nextTimeKind === this.activeTimeKind) {
      return;
    }
    await this.replacePathInput(
      this.activeRowCountKind,
      this.activeCoordinateKind,
      this.activeColorKind,
      nextTimeKind,
      getValidPathModelKindForTimeKind(this.activePathModelKind, nextTimeKind)
    );
  };

  readonly handleModelSelection = (requestedPathModelKind: ArrowPathLayerModel): void => {
    const nextPathModelKind = getValidPathModelKindForTimeKind(
      requestedPathModelKind,
      this.activeTimeKind
    );
    if (nextPathModelKind === this.activePathModelKind) {
      return;
    }
    this.updatePathLayerProps({model: nextPathModelKind});
  };

  async replacePathInput(
    nextRowCountKind: ArrowPathRowCountKind,
    nextCoordinateKind: ArrowPathCoordinateKind,
    nextColorKind: ArrowPathColorKind,
    nextTimeKind: ArrowPathTimeKind,
    nextPathModelKind = this.activePathModelKind
  ): Promise<void> {
    const requestVersion = ++this.pathInputRequestVersion;
    const resolvedPathModelKind = getValidPathModelKindForTimeKind(nextPathModelKind, nextTimeKind);

    if (isStreamingArrowPathRowCountKind(nextRowCountKind)) {
      this.startStreamingPathInput(
        nextCoordinateKind,
        nextColorKind,
        nextTimeKind,
        resolvedPathModelKind,
        this.pathLayer.beginRecordBatchStream()
      );
      this.updateActiveSelection(
        nextRowCountKind,
        nextCoordinateKind,
        nextColorKind,
        nextTimeKind,
        resolvedPathModelKind
      );
      return;
    }

    this.pathLayer.cancelRecordBatchStream();
    const nextPathInput = await this.getOrCreatePathInput(
      nextRowCountKind,
      nextCoordinateKind,
      nextColorKind,
      nextTimeKind
    );
    if (this.isFinalized || requestVersion !== this.pathInputRequestVersion) {
      return;
    }

    this.activePathInput = nextPathInput;
    this.updateActiveSelection(
      nextRowCountKind,
      nextCoordinateKind,
      nextColorKind,
      nextTimeKind,
      resolvedPathModelKind
    );
    this.updatePathLayerProps({
      data: this.activePathInput,
      model: resolvedPathModelKind,
      timeColumn: nextTimeKind
    });
  }

  startStreamingPathInput(
    coordinateKind: ArrowPathCoordinateKind,
    colorKind: ArrowPathColorKind,
    timeKind: ArrowPathTimeKind,
    modelKind: ArrowPathLayerModel,
    streamingSession: ArrowPathLayerStreamingSession
  ): void {
    const sourceData = makeArrowPathSourceData(
      PATH_DATASETS['2400'],
      coordinateKind,
      colorKind,
      timeKind,
      STREAMING_PATH_ROWS_PER_CHUNK
    );
    const recordBatches = makeArrowPathRecordBatches(sourceData).slice(
      0,
      STREAMING_PATH_BATCH_COUNT
    );
    void this.pathLayer.streamRecordBatches({
      recordBatchIterator: createStreamingPathRecordBatchIterator(recordBatches),
      arrowVectorBuildTimeMs: sourceData.arrowVectorBuildTimeMs,
      model: modelKind,
      timeColumn: timeKind,
      streamingSession,
      onBatch: update => this.handleStreamingPathBatch(update)
    });
  }

  handleStreamingPathBatch(update: ArrowPathLayerRecordBatchStreamUpdate): void {
    if (this.isFinalized) {
      return;
    }
    this.activePathInput = update.pathInput;
    this.handlePathLayerUpdate(update.setPropsResult, {syncControls: update.isFirstBatch});
  }

  updateActiveSelection(
    rowCountKind: ArrowPathRowCountKind,
    coordinateKind: ArrowPathCoordinateKind,
    colorKind: ArrowPathColorKind,
    timeKind: ArrowPathTimeKind,
    modelKind: ArrowPathLayerModel
  ): void {
    this.activeRowCountKind = rowCountKind;
    this.activeCoordinateKind = coordinateKind;
    this.activeColorKind = colorKind;
    this.activeTimeKind = timeKind;
    this.activePathModelKind = modelKind;
    this.controlPanel?.syncControls(this.getControlPanelState());
  }

  updatePathLayerProps(
    props: Partial<ArrowPathLayerProps>,
    options: PathLayerUpdateOptions = {}
  ): void {
    const updateResult = this.pathLayer.setProps(props);
    if (props.model !== undefined) {
      this.activePathModelKind = props.model;
    }
    if (props.timeColumn !== undefined) {
      this.activeTimeKind = props.timeColumn;
    }
    this.handlePathLayerUpdate(updateResult, options);
  }

  handlePathLayerUpdate(
    _updateResult: ArrowPathLayerSetPropsResult,
    {syncControls = true, updateMetrics = true}: PathLayerUpdateOptions = {}
  ): void {
    if (syncControls) {
      this.controlPanel?.syncControls(this.getControlPanelState());
    }
    if (updateMetrics) {
      this.updateMetricLabels();
    }
  }

  readonly handleMeasureSweepToggle = (enabled: boolean): void => {
    this.measureSweepEnabled = enabled;
  };

  readonly handleWidthToggle = (enabled: boolean): void => {
    this.widthsEnabled = enabled;
  };

  readonly handleCapSelection = (nextCapKind: ArrowPathCapKind): void => {
    this.capKind = nextCapKind;
    this.controlPanel.syncControls(this.getControlPanelState());
  };

  readonly handleJointSelection = (nextJointKind: ArrowPathJointKind): void => {
    this.jointKind = nextJointKind;
    this.controlPanel.syncControls(this.getControlPanelState());
  };

  readonly handleMiterLimitInput = (nextMiterLimit: number): void => {
    this.miterLimit = nextMiterLimit;
    this.controlPanel.syncControls(this.getControlPanelState());
  };
}
