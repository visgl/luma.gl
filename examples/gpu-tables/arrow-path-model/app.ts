// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {AnimationLoopTemplate} from '@luma.gl/engine';
import type * as arrow from 'apache-arrow';
import {ArrowPathModelControlPanel, makeArrowPathModelControlPanelHtml} from './control-panel';
import {
  createStreamingPathRecordBatchIterator,
  getTemporalCurrentTimeMilliseconds,
  getValidPathModelKindForTimeKind,
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
  type ArrowPathJointKind,
  type ArrowPathRowCountKind,
  type ArrowPathTimeKind
} from './arrow-path-data';
import {DECK_PATH_ATTRIBUTE_BYTES_PER_SEGMENT, getArrowPathMetrics} from './arrow-path-metrics';
import {
  ArrowPathRenderer,
  prepareArrowPathInputFromRecordBatches,
  type ArrowPathRendererInput,
  type ArrowPathRendererModel,
  type ArrowPathRendererProps,
  type ArrowPathRendererRecordBatchStreamUpdate,
  type ArrowPathRendererSetPropsResult,
  type ArrowPathRendererStreamingSession
} from './arrow-path-renderer';

export const title = 'Paths: XYZM + List<Timestamp>';
export const description =
  'Variable-length Arrow XYZM path rows rendered through attribute-backed and storage-backed path models, plus aligned List<Timestamp> rows for Trips-style temporal filtering.';

type PathRendererUpdateOptions = {
  syncControls?: boolean;
  updateMetrics?: boolean;
};

export default class ArrowPathModelAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeArrowPathModelControlPanelHtml({
    rowLabels: {
      '240-stream': PATH_DATASETS['240'].label,
      '2400-stream': PATH_DATASETS['2400'].label
    },
    deckPathAttributeBytesPerSegment: DECK_PATH_ATTRIBUTE_BYTES_PER_SEGMENT
  });

  static props = {useDevicePixels: true};

  readonly device: Device;
  activeRowCountKind: ArrowPathRowCountKind = '240-stream';
  activeCoordinateKind: ArrowPathCoordinateKind = 'float32';
  activeColorKind: ArrowPathColorKind = 'vertex-colors';
  activeTimeKind: ArrowPathTimeKind = 'xyzm';
  activePathModelKind: ArrowPathRendererModel = 'auto';
  activePathInput!: ArrowPathRendererInput;
  activeArrowVectorBuildTimeMs = 0;
  activeStreamingPathBatchCount = 0;
  initialStreamingPathInput: ArrowPathRendererInput | null = null;
  pathRenderer!: ArrowPathRenderer;
  measureSweepEnabled = true;
  widthsEnabled = true;
  capKind: ArrowPathCapKind = 'square';
  jointKind: ArrowPathJointKind = 'miter';
  miterLimit = 4;
  measureTime = 0;
  lastRenderSeconds: number | null = null;
  isFinalized = false;
  controlPanel!: ArrowPathModelControlPanel;

  constructor({device}: AnimationProps) {
    super();
    this.device = device as Device;
  }

  override async onInitialize(): Promise<void> {
    const {pathInput, recordBatches, arrowVectorBuildTimeMs} = await this.createInitialPathInput(
      this.activeRowCountKind,
      this.activeCoordinateKind,
      this.activeColorKind,
      this.activeTimeKind
    );
    if (this.isFinalized) {
      pathInput.destroy();
      return;
    }
    this.activePathInput = pathInput;
    this.activeArrowVectorBuildTimeMs = arrowVectorBuildTimeMs;
    this.initialStreamingPathInput = pathInput;
    this.pathRenderer = this.createPathRenderer(this.activePathModelKind);
    this.initializeControlPanel();
    this.updateMetricLabels();
    this.streamPathRecordBatches(
      recordBatches,
      arrowVectorBuildTimeMs,
      this.activeTimeKind,
      this.activePathModelKind,
      this.pathRenderer.beginRecordBatchStream()
    );
  }

  override onRender({aspect, device, time}: AnimationProps): void {
    if (!this.pathRenderer) {
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
    if (this.pathRenderer.resolvedModel === 'trips') {
      this.pathRenderer.setProps({
        currentTime: getTemporalCurrentTimeMilliseconds(this.measureTime)
      });
    }

    this.pathRenderer.shaderInputs.setProps({
      pathViewport: {
        viewportScale: [1 / Math.max(aspect, 0.2), 1],
        time: this.activeTimeKind === 'none' ? -1 : this.measureTime,
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
    this.pathRenderer.draw(renderPass);
    renderPass.end();
  }

  override onFinalize(): void {
    this.isFinalized = true;
    this.controlPanel?.destroy();
    this.pathRenderer?.destroy();
    this.initialStreamingPathInput?.destroy();
    this.initialStreamingPathInput = null;
  }

  createPathRenderer(modelKind: ArrowPathRendererModel): ArrowPathRenderer {
    return new ArrowPathRenderer(this.device, {
      id: 'arrow-path-model',
      data: this.activePathInput,
      model: modelKind,
      timeColumn: this.activeTimeKind,
      currentTime: getTemporalCurrentTimeMilliseconds(this.measureTime),
      trailLength: TEMPORAL_TRAIL_LENGTH_MILLISECONDS,
      color: [199, 219, 245, 235],
      width: 0.0035
    });
  }

  async createInitialPathInput(
    rowCountKind: ArrowPathRowCountKind,
    coordinateKind: ArrowPathCoordinateKind,
    colorKind: ArrowPathColorKind,
    timeKind: ArrowPathTimeKind
  ): Promise<{
    pathInput: ArrowPathRendererInput;
    recordBatches: arrow.RecordBatch[];
    arrowVectorBuildTimeMs: number;
  }> {
    const {recordBatches, arrowVectorBuildTimeMs} = this.createPathStreamSource(
      rowCountKind,
      coordinateKind,
      colorKind,
      timeKind
    );
    const firstRecordBatch = recordBatches[0];
    if (!firstRecordBatch) {
      throw new Error('Arrow path streaming example requires at least one record batch');
    }
    const pathInput = await prepareArrowPathInputFromRecordBatches(this.device, [firstRecordBatch]);
    return {pathInput, recordBatches, arrowVectorBuildTimeMs};
  }

  createPathStreamSource(
    rowCountKind: ArrowPathRowCountKind,
    coordinateKind: ArrowPathCoordinateKind,
    colorKind: ArrowPathColorKind,
    timeKind: ArrowPathTimeKind
  ): {
    recordBatches: arrow.RecordBatch[];
    arrowVectorBuildTimeMs: number;
  } {
    const datasetKind = getStreamingPathDatasetKind(rowCountKind);
    const sourceData = makeArrowPathSourceData(
      PATH_DATASETS[datasetKind],
      coordinateKind,
      colorKind,
      timeKind,
      STREAMING_PATH_ROWS_PER_CHUNK
    );
    return {
      recordBatches: makeArrowPathRecordBatches(sourceData).slice(0, STREAMING_PATH_BATCH_COUNT),
      arrowVectorBuildTimeMs: sourceData.arrowVectorBuildTimeMs ?? 0
    };
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
    this.controlPanel?.setMetricValues(
      getArrowPathMetrics(
        this.pathRenderer,
        this.activePathInput,
        this.activeArrowVectorBuildTimeMs
      )
    );
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

  readonly handleModelSelection = (requestedPathModelKind: ArrowPathRendererModel): void => {
    const nextPathModelKind = getValidPathModelKindForTimeKind(
      requestedPathModelKind,
      this.activeTimeKind
    );
    if (nextPathModelKind === this.activePathModelKind) {
      return;
    }
    this.updatePathRendererProps({model: nextPathModelKind});
  };

  async replacePathInput(
    nextRowCountKind: ArrowPathRowCountKind,
    nextCoordinateKind: ArrowPathCoordinateKind,
    nextColorKind: ArrowPathColorKind,
    nextTimeKind: ArrowPathTimeKind,
    nextPathModelKind = this.activePathModelKind
  ): Promise<void> {
    const resolvedPathModelKind = getValidPathModelKindForTimeKind(nextPathModelKind, nextTimeKind);
    const {recordBatches, arrowVectorBuildTimeMs} = this.createPathStreamSource(
      nextRowCountKind,
      nextCoordinateKind,
      nextColorKind,
      nextTimeKind
    );
    if (this.isFinalized) {
      return;
    }
    this.streamPathRecordBatches(
      recordBatches,
      arrowVectorBuildTimeMs,
      nextTimeKind,
      resolvedPathModelKind,
      this.pathRenderer.beginRecordBatchStream()
    );
    this.updateActiveSelection(
      nextRowCountKind,
      nextCoordinateKind,
      nextColorKind,
      nextTimeKind,
      resolvedPathModelKind
    );
  }

  streamPathRecordBatches(
    recordBatches: arrow.RecordBatch[],
    arrowVectorBuildTimeMs: number,
    timeKind: ArrowPathTimeKind,
    modelKind: ArrowPathRendererModel,
    streamingSession: ArrowPathRendererStreamingSession
  ): void {
    this.activeArrowVectorBuildTimeMs = arrowVectorBuildTimeMs;
    this.activeStreamingPathBatchCount = recordBatches.length;
    this.controlPanel?.setStreamingBatchStatus(0, this.activeStreamingPathBatchCount);
    void this.pathRenderer.streamRecordBatches({
      recordBatchIterator: createStreamingPathRecordBatchIterator(recordBatches),
      model: modelKind,
      timeColumn: timeKind,
      streamingSession,
      onBatch: update => this.handleStreamingPathBatch(update)
    });
  }

  handleStreamingPathBatch(update: ArrowPathRendererRecordBatchStreamUpdate): void {
    if (this.isFinalized) {
      return;
    }
    this.activePathInput = update.pathInput;
    this.controlPanel?.setStreamingBatchStatus(
      update.loadedBatchCount,
      this.activeStreamingPathBatchCount
    );
    if (update.isFirstBatch) {
      this.initialStreamingPathInput?.destroy();
      this.initialStreamingPathInput = null;
    }
    this.handlePathRendererUpdate(update.setPropsResult, {syncControls: update.isFirstBatch});
  }

  updateActiveSelection(
    rowCountKind: ArrowPathRowCountKind,
    coordinateKind: ArrowPathCoordinateKind,
    colorKind: ArrowPathColorKind,
    timeKind: ArrowPathTimeKind,
    modelKind: ArrowPathRendererModel
  ): void {
    this.activeRowCountKind = rowCountKind;
    this.activeCoordinateKind = coordinateKind;
    this.activeColorKind = colorKind;
    this.activeTimeKind = timeKind;
    this.activePathModelKind = modelKind;
    this.controlPanel?.syncControls(this.getControlPanelState());
  }

  updatePathRendererProps(
    props: Partial<ArrowPathRendererProps>,
    options: PathRendererUpdateOptions = {}
  ): void {
    const updateResult = this.pathRenderer.setProps(props);
    if (props.model !== undefined) {
      this.activePathModelKind = props.model;
    }
    if (props.timeColumn !== undefined) {
      this.activeTimeKind = props.timeColumn;
    }
    this.handlePathRendererUpdate(updateResult, options);
  }

  handlePathRendererUpdate(
    _updateResult: ArrowPathRendererSetPropsResult,
    {syncControls = true, updateMetrics = true}: PathRendererUpdateOptions = {}
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

function getStreamingPathDatasetKind(rowCountKind: ArrowPathRowCountKind): '240' | '2400' {
  return rowCountKind === '240-stream' ? '240' : '2400';
}
