// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {AnimationLoopTemplate} from '@luma.gl/engine';
import type * as arrow from 'apache-arrow';
import {ArrowLineControlPanel} from './control-panel';
import {
  createStreamingPathRecordBatchIterator,
  getTemporalCurrentTimeMilliseconds,
  getValidPathModelKindForTimeKind,
  makeArrowLineRecordBatches,
  makeArrowLineSourceData,
  MEASURE_SWEEP_DURATION,
  PATH_DATASETS,
  STREAMING_PATH_BATCH_COUNT,
  STREAMING_PATH_ROWS_PER_CHUNK,
  TEMPORAL_TRAIL_LENGTH_MILLISECONDS,
  type ArrowLineCapKind,
  type ArrowLineColorKind,
  type ArrowLineCoordinateKind,
  type ArrowLineJointKind,
  type ArrowLineMode,
  type ArrowLineRowCountKind,
  type ArrowLineTimeKind
} from './arrow-line-data';
import {DECK_PATH_ATTRIBUTE_BYTES_PER_SEGMENT, getArrowLineMetrics} from './arrow-line-metrics';
import {
  ArrowLineRenderer,
  type ArrowLineRendererDataBatchUpdate,
  type ArrowLineRendererInput,
  type ArrowLineRendererModel,
  type ArrowLineRendererProps,
  type ArrowLineRendererSetPropsResult
} from './arrow-line-renderer';
import {
  ArrowExamplePanelManager,
  makeArrowExamplePanelHostHtml,
  type ArrowExampleLoadedTableStream
} from '../arrow-example-panels';

export const title = 'Lines: DenseUnion outlines';
export const description =
  'Variable-length Arrow XYZM line rows and DenseUnion line or polygon-outline rows rendered through attribute-backed and storage-backed path models, plus aligned List<Timestamp> rows for Trips-style temporal filtering.';

type LineRendererUpdateOptions = {
  syncControls?: boolean;
  updateMetrics?: boolean;
};

export default class ArrowLineAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeArrowExamplePanelHostHtml();

  static props = {useDevicePixels: true};

  readonly device: Device;
  readonly panels = new ArrowExamplePanelManager({
    descriptionPanel: () => this.controlPanel.makeDescriptionPanel(),
    settingsPanel: () => this.controlPanel.makeSettingsPanel()
  });
  activeMode: ArrowLineMode = 'lines';
  activeRowCountKind: ArrowLineRowCountKind = '240-stream';
  activeCoordinateKind: ArrowLineCoordinateKind = 'float32';
  activeColorKind: ArrowLineColorKind = 'vertex-colors';
  activeTimeKind: ArrowLineTimeKind = 'xyzm';
  activePathModelKind: ArrowLineRendererModel = 'auto';
  activePathInput: ArrowLineRendererInput | null = null;
  activeArrowVectorBuildTimeMs = 0;
  activeStreamingPathBatchCount = 0;
  pathRenderer!: ArrowLineRenderer;
  measureSweepEnabled = true;
  widthsEnabled = true;
  capKind: ArrowLineCapKind = 'square';
  jointKind: ArrowLineJointKind = 'miter';
  miterLimit = 4;
  measureTime = 0;
  lastRenderSeconds: number | null = null;
  isFinalized = false;
  controlPanel!: ArrowLineControlPanel;
  activePathTableStream: ArrowExampleLoadedTableStream | null = null;

  constructor({device}: AnimationProps) {
    super();
    this.device = device as Device;
  }

  override async onInitialize(): Promise<void> {
    const {recordBatches, arrowVectorBuildTimeMs} = this.createPathStreamSource(
      this.activeRowCountKind,
      this.activeMode,
      this.activeCoordinateKind,
      this.activeColorKind,
      this.activeTimeKind
    );
    if (this.isFinalized) {
      return;
    }
    this.activeArrowVectorBuildTimeMs = arrowVectorBuildTimeMs;
    this.pathRenderer = this.createPathRenderer(this.activePathModelKind);
    this.initializeControlPanel();
    this.panels.mount();
    this.updateMetricLabels();
    this.streamPathRecordBatches(
      recordBatches,
      arrowVectorBuildTimeMs,
      this.activeMode,
      this.activeTimeKind,
      this.activePathModelKind
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
    this.panels.finalize();
    this.pathRenderer?.destroy();
  }

  createPathRenderer(modelKind: ArrowLineRendererModel): ArrowLineRenderer {
    return new ArrowLineRenderer(this.device, {
      id: 'arrow-lines',
      mode: this.activeMode,
      model: modelKind,
      timeColumn: this.activeTimeKind,
      currentTime: getTemporalCurrentTimeMilliseconds(this.measureTime),
      trailLength: TEMPORAL_TRAIL_LENGTH_MILLISECONDS,
      color: [199, 219, 245, 235],
      width: 0.0035
    });
  }

  createPathStreamSource(
    rowCountKind: ArrowLineRowCountKind,
    mode: ArrowLineMode,
    coordinateKind: ArrowLineCoordinateKind,
    colorKind: ArrowLineColorKind,
    timeKind: ArrowLineTimeKind
  ): {
    recordBatches: arrow.RecordBatch[];
    arrowVectorBuildTimeMs: number;
  } {
    const datasetKind = getStreamingPathDatasetKind(rowCountKind);
    const sourceData = makeArrowLineSourceData(
      PATH_DATASETS[datasetKind],
      mode,
      coordinateKind,
      colorKind,
      timeKind,
      STREAMING_PATH_ROWS_PER_CHUNK
    );
    return {
      recordBatches: makeArrowLineRecordBatches(sourceData).slice(0, STREAMING_PATH_BATCH_COUNT),
      arrowVectorBuildTimeMs: sourceData.arrowVectorBuildTimeMs ?? 0
    };
  }

  initializeControlPanel(): void {
    this.controlPanel = new ArrowLineControlPanel({
      device: this.device,
      rowLabels: {
        '240-stream': PATH_DATASETS['240'].label,
        '2400-stream': PATH_DATASETS['2400'].label
      },
      deckPathAttributeBytesPerSegment: DECK_PATH_ATTRIBUTE_BYTES_PER_SEGMENT,
      initialState: this.getControlPanelState(),
      handlers: {
        onRowCountChange: this.handleRowCountSelection,
        onModeChange: this.handleModeSelection,
        onCoordinateChange: this.handleCoordinateSelection,
        onColorChange: this.handleColorColumnSelection,
        onTimeChange: this.handleTimeColumnSelection,
        onModelChange: this.handleModelSelection,
        onMeasureSweepChange: this.handleMeasureSweepToggle,
        onWidthChange: this.handleWidthToggle,
        onCapChange: this.handleCapSelection,
        onJointChange: this.handleJointSelection,
        onMiterLimitChange: this.handleMiterLimitInput
      },
      onRefresh: () => this.panels.refresh()
    });
    this.controlPanel.initialize();
  }

  getControlPanelState() {
    return {
      mode: this.activeMode,
      rowCountKind: this.activeRowCountKind,
      coordinateKind: this.activeCoordinateKind,
      colorKind: this.activeColorKind,
      timeKind: this.activeTimeKind,
      modelKind: this.activePathModelKind,
      measureSweepEnabled: this.measureSweepEnabled,
      widthsEnabled: this.widthsEnabled,
      capKind: this.capKind,
      jointKind: this.jointKind,
      miterLimit: this.miterLimit
    };
  }

  updateMetricLabels(): void {
    if (!this.activePathInput) {
      return;
    }
    this.controlPanel?.setMetricValues(
      getArrowLineMetrics(
        this.pathRenderer,
        this.activePathInput,
        this.activeArrowVectorBuildTimeMs
      )
    );
  }

  readonly handleRowCountSelection = async (
    nextRowCountKind: ArrowLineRowCountKind
  ): Promise<void> => {
    if (nextRowCountKind === this.activeRowCountKind) {
      return;
    }
    await this.replacePathInput(
      nextRowCountKind,
      this.activeMode,
      this.activeCoordinateKind,
      this.activeColorKind,
      this.activeTimeKind
    );
  };

  readonly handleModeSelection = async (nextMode: ArrowLineMode): Promise<void> => {
    if (nextMode === this.activeMode) {
      return;
    }
    const nextSelection = getEffectiveLineSelection(
      nextMode,
      this.activeCoordinateKind,
      this.activeColorKind,
      this.activeTimeKind,
      this.activePathModelKind
    );
    await this.replacePathInput(
      this.activeRowCountKind,
      nextMode,
      nextSelection.coordinateKind,
      nextSelection.colorKind,
      nextSelection.timeKind,
      nextSelection.modelKind
    );
  };

  readonly handleCoordinateSelection = async (
    nextCoordinateKind: ArrowLineCoordinateKind
  ): Promise<void> => {
    if (nextCoordinateKind === this.activeCoordinateKind) {
      return;
    }
    await this.replacePathInput(
      this.activeRowCountKind,
      this.activeMode,
      nextCoordinateKind,
      this.activeColorKind,
      this.activeTimeKind
    );
  };

  readonly handleColorColumnSelection = async (
    nextColorKind: ArrowLineColorKind
  ): Promise<void> => {
    if (nextColorKind === this.activeColorKind) {
      return;
    }
    await this.replacePathInput(
      this.activeRowCountKind,
      this.activeMode,
      this.activeCoordinateKind,
      nextColorKind,
      this.activeTimeKind
    );
  };

  readonly handleTimeColumnSelection = async (nextTimeKind: ArrowLineTimeKind): Promise<void> => {
    if (nextTimeKind === this.activeTimeKind) {
      return;
    }
    await this.replacePathInput(
      this.activeRowCountKind,
      this.activeMode,
      this.activeCoordinateKind,
      this.activeColorKind,
      nextTimeKind,
      getValidPathModelKindForTimeKind(this.activePathModelKind, nextTimeKind)
    );
  };

  readonly handleModelSelection = async (
    requestedPathModelKind: ArrowLineRendererModel
  ): Promise<void> => {
    const nextPathModelKind = getValidPathModelKindForTimeKind(
      requestedPathModelKind,
      this.activeTimeKind
    );
    if (nextPathModelKind === this.activePathModelKind) {
      return;
    }
    await this.replacePathInput(
      this.activeRowCountKind,
      this.activeMode,
      this.activeCoordinateKind,
      this.activeColorKind,
      this.activeTimeKind,
      nextPathModelKind
    );
  };

  async replacePathInput(
    nextRowCountKind: ArrowLineRowCountKind,
    nextMode: ArrowLineMode,
    nextCoordinateKind: ArrowLineCoordinateKind,
    nextColorKind: ArrowLineColorKind,
    nextTimeKind: ArrowLineTimeKind,
    nextPathModelKind = this.activePathModelKind
  ): Promise<void> {
    const effectiveSelection = getEffectiveLineSelection(
      nextMode,
      nextCoordinateKind,
      nextColorKind,
      nextTimeKind,
      nextPathModelKind
    );
    const resolvedPathModelKind = getValidPathModelKindForTimeKind(
      effectiveSelection.modelKind,
      effectiveSelection.timeKind
    );
    const {recordBatches, arrowVectorBuildTimeMs} = this.createPathStreamSource(
      nextRowCountKind,
      nextMode,
      effectiveSelection.coordinateKind,
      effectiveSelection.colorKind,
      effectiveSelection.timeKind
    );
    if (this.isFinalized) {
      return;
    }
    this.streamPathRecordBatches(
      recordBatches,
      arrowVectorBuildTimeMs,
      nextMode,
      effectiveSelection.timeKind,
      resolvedPathModelKind
    );
    this.updateActiveSelection(
      nextRowCountKind,
      nextMode,
      effectiveSelection.coordinateKind,
      effectiveSelection.colorKind,
      effectiveSelection.timeKind,
      resolvedPathModelKind
    );
  }

  streamPathRecordBatches(
    recordBatches: arrow.RecordBatch[],
    arrowVectorBuildTimeMs: number,
    mode: ArrowLineMode,
    timeKind: ArrowLineTimeKind,
    modelKind: ArrowLineRendererModel
  ): void {
    this.activeArrowVectorBuildTimeMs = arrowVectorBuildTimeMs;
    this.activePathInput = null;
    this.activeStreamingPathBatchCount = recordBatches.length;
    this.panels.removeTableEntry('lines-segments');
    this.activePathTableStream = this.panels.beginLoadedTableStream({
      id: 'lines-source',
      label: 'Loaded line source',
      kind: 'source',
      recordBatches
    });
    this.controlPanel?.setStreamingBatchStatus(0, this.activeStreamingPathBatchCount);
    this.pathRenderer.setProps({
      data: createStreamingPathRecordBatchIterator(recordBatches),
      model: modelKind,
      timeColumn: timeKind,
      mode,
      onDataBatch: update => this.handleStreamingPathBatch(update)
    });
  }

  handleStreamingPathBatch(update: ArrowLineRendererDataBatchUpdate): void {
    if (this.isFinalized) {
      return;
    }
    this.activePathInput = update.pathInput;
    this.activePathTableStream?.setLoadedBatchCount(update.loadedBatchCount);
    if (update.pathInput.model === 'attribute') {
      this.panels.upsertTableEntry({
        id: 'lines-segments',
        label: 'Generated path segments',
        kind: 'derived',
        table: update.pathInput.pathState.segmentTable.table
      });
    } else {
      this.panels.removeTableEntry('lines-segments');
    }
    this.controlPanel?.setStreamingBatchStatus(
      update.loadedBatchCount,
      this.activeStreamingPathBatchCount
    );
    this.handlePathRendererUpdate(update.setPropsResult, {syncControls: update.isFirstBatch});
  }

  updateActiveSelection(
    rowCountKind: ArrowLineRowCountKind,
    mode: ArrowLineMode,
    coordinateKind: ArrowLineCoordinateKind,
    colorKind: ArrowLineColorKind,
    timeKind: ArrowLineTimeKind,
    modelKind: ArrowLineRendererModel
  ): void {
    this.activeRowCountKind = rowCountKind;
    this.activeMode = mode;
    this.activeCoordinateKind = coordinateKind;
    this.activeColorKind = colorKind;
    this.activeTimeKind = timeKind;
    this.activePathModelKind = modelKind;
    this.controlPanel?.syncControls(this.getControlPanelState());
  }

  updatePathRendererProps(
    props: Partial<ArrowLineRendererProps>,
    options: LineRendererUpdateOptions = {}
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
    _updateResult: ArrowLineRendererSetPropsResult,
    {syncControls = true, updateMetrics = true}: LineRendererUpdateOptions = {}
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

  readonly handleCapSelection = (nextCapKind: ArrowLineCapKind): void => {
    this.capKind = nextCapKind;
    this.controlPanel.syncControls(this.getControlPanelState());
  };

  readonly handleJointSelection = (nextJointKind: ArrowLineJointKind): void => {
    this.jointKind = nextJointKind;
    this.controlPanel.syncControls(this.getControlPanelState());
  };

  readonly handleMiterLimitInput = (nextMiterLimit: number): void => {
    this.miterLimit = nextMiterLimit;
    this.controlPanel.syncControls(this.getControlPanelState());
  };
}

function getStreamingPathDatasetKind(rowCountKind: ArrowLineRowCountKind): '240' | '2400' {
  return rowCountKind === '240-stream' ? '240' : '2400';
}

function getEffectiveLineSelection(
  mode: ArrowLineMode,
  coordinateKind: ArrowLineCoordinateKind,
  colorKind: ArrowLineColorKind,
  timeKind: ArrowLineTimeKind,
  modelKind: ArrowLineRendererModel
): {
  coordinateKind: ArrowLineCoordinateKind;
  colorKind: ArrowLineColorKind;
  timeKind: ArrowLineTimeKind;
  modelKind: ArrowLineRendererModel;
} {
  if (mode === 'polygons') {
    return {
      coordinateKind: 'dense-union',
      colorKind: colorKind === 'none' ? 'none' : 'row-colors',
      timeKind: 'none',
      modelKind: getValidPathModelKindForTimeKind(modelKind, 'none')
    };
  }
  return {
    coordinateKind,
    colorKind,
    timeKind,
    modelKind: getValidPathModelKindForTimeKind(modelKind, timeKind)
  };
}
