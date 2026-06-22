// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {AnimationLoopTemplate} from '@luma.gl/engine';
import {
  CURRENT_TIME_RATE_MILLISECONDS_PER_SECOND,
  POINT_SWEEP_MILLISECONDS,
  POINT_TRAIL_LENGTH_MILLISECONDS,
  createStreamingPointRecordBatchIterator,
  formatPointCurrentTimeLabel,
  getEffectivePointTimeKind,
  getPointTimeColumn,
  makeArrowPointExampleData,
  type ArrowPointColorKind,
  type ArrowPointRadiusKind,
  type ArrowPointRowCountKind,
  type ArrowPointSourceKind,
  type ArrowPointTimeKind
} from './arrow-point-generator';
import {ArrowPointRenderer} from './arrow-point-renderer';
import {ArrowExamplePanelManager, makeArrowExamplePanelHostHtml} from '../arrow-example-panels';
import {ArrowPointControlPanel} from './control-panel';

export const title = 'Points: XY/XYM/XYZM';
export const description =
  'Arrow FixedSizeList<Float32, 2 | 3 | 4> and DenseUnion point rows rendered as ScatterplotLayer-style circle impostors with temporal M or timestamp animation and picking.';

export default class ArrowPointAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeArrowExamplePanelHostHtml();

  static props = {useDevicePixels: true};

  readonly device: Device;
  readonly controlPanel: ArrowPointControlPanel;
  readonly layer: ArrowPointRenderer;
  readonly panels = new ArrowExamplePanelManager({
    descriptionPanel: () => this.controlPanel.makeDescriptionPanel(),
    settingsPanel: () => this.controlPanel.makeSettingsPanel()
  });
  rowCountKind: ArrowPointRowCountKind = '10k-stream';
  sourceKind: ArrowPointSourceKind = 'xym';
  timeKind: ArrowPointTimeKind = 'm';
  colorKind: ArrowPointColorKind = 'row-colors';
  radiusKind: ArrowPointRadiusKind = 'row-radii';
  animate = true;
  currentTimeMilliseconds = 0;
  lastRenderSeconds: number | null = null;
  isFinalized = false;

  constructor({device}: AnimationProps) {
    super();
    this.device = device as Device;
    this.layer = new ArrowPointRenderer(this.device);
    this.controlPanel = new ArrowPointControlPanel({
      initialState: this.getControlPanelState(),
      handlers: {
        onRowCountKindChange: this.handleRowCountKindChange,
        onSourceKindChange: this.handleSourceKindChange,
        onTimeKindChange: this.handleTimeKindChange,
        onColorKindChange: this.handleColorKindChange,
        onRadiusKindChange: this.handleRadiusKindChange,
        onAnimateChange: this.handleAnimateChange
      },
      onRefresh: () => this.panels.refresh()
    });
  }

  override async onInitialize(): Promise<void> {
    this.panels.mount();
    this.controlPanel.initialize();
    this.streamPointInput(
      this.rowCountKind,
      this.sourceKind,
      this.timeKind,
      this.colorKind,
      this.radiusKind
    );
  }

  override onRender({aspect, device, time, _mousePosition}: AnimationProps): void {
    this.updateAnimationTime(time);
    this.layer.setProps({
      currentTime: this.currentTimeMilliseconds,
      trailLength: POINT_TRAIL_LENGTH_MILLISECONDS
    });

    const renderPass = device.beginRenderPass({clearColor: [0.012, 0.026, 0.055, 1]});
    this.layer.draw(renderPass, {aspect});
    renderPass.end();
    this.layer.pick(_mousePosition, {force: this.animate && this.timeKind !== 'none'});
    this.controlPanel.setCurrentTimeLabel(
      this.timeKind === 'none' ? '-' : formatPointCurrentTimeLabel(this.currentTimeMilliseconds)
    );
  }

  override onFinalize(): void {
    this.isFinalized = true;
    this.controlPanel.destroy();
    this.panels.finalize();
    this.layer.destroy();
  }

  private getControlPanelState() {
    return {
      rowCountKind: this.rowCountKind,
      sourceKind: this.sourceKind,
      timeKind: this.timeKind,
      colorKind: this.colorKind,
      radiusKind: this.radiusKind,
      animate: this.animate
    };
  }

  private streamPointInput(
    rowCountKind: ArrowPointRowCountKind,
    sourceKind: ArrowPointSourceKind,
    timeKind: ArrowPointTimeKind,
    colorKind: ArrowPointColorKind,
    radiusKind: ArrowPointRadiusKind
  ): void {
    const effectiveTimeKind = getEffectivePointTimeKind(sourceKind, timeKind);
    this.rowCountKind = rowCountKind;
    this.sourceKind = sourceKind;
    this.timeKind = effectiveTimeKind;
    this.colorKind = colorKind;
    this.radiusKind = radiusKind;
    this.currentTimeMilliseconds = 0;
    this.lastRenderSeconds = null;

    const sourceData = makeArrowPointExampleData(
      rowCountKind,
      sourceKind,
      effectiveTimeKind,
      colorKind
    );
    this.layer.setProps({
      timeColumn: getPointTimeColumn(effectiveTimeKind),
      timeOrigin: sourceData.timeOriginMilliseconds,
      colors: colorKind === 'constant' ? null : undefined,
      radii: radiusKind === 'constant' ? null : undefined,
      center: [0, 0],
      scale: 1
    });
    this.controlPanel.syncControls({
      rowCountKind,
      sourceKind,
      timeKind: effectiveTimeKind,
      colorKind,
      radiusKind
    });
    this.controlPanel.setCurrentTimeLabel(
      effectiveTimeKind === 'none' ? '-' : formatPointCurrentTimeLabel(this.currentTimeMilliseconds)
    );
    this.controlPanel.setStreamingBatchStatus(0, sourceData.batchCount);
    this.updateMetrics();
    const pointTableStream = this.panels.beginLoadedTableStream({
      id: 'points-source',
      label: 'Loaded point source',
      kind: 'source',
      recordBatches: sourceData.recordBatches
    });

    this.layer.setProps({
      data: createStreamingPointRecordBatchIterator(sourceData.recordBatches)[
        Symbol.asyncIterator
      ](),
      onDataBatch: ({loadedBatchCount, metrics}) => {
        if (this.isFinalized) {
          return;
        }
        pointTableStream.setLoadedBatchCount(loadedBatchCount);
        this.controlPanel.setStreamingBatchStatus(loadedBatchCount, sourceData.batchCount);
        this.controlPanel.setMetrics(metrics);
      }
    });
  }

  private updateMetrics(): void {
    this.controlPanel.setMetrics(this.layer.getMetrics());
  }

  private updateAnimationTime(timeMilliseconds: number): void {
    const seconds = timeMilliseconds / 1000;
    if (this.lastRenderSeconds === null) {
      this.lastRenderSeconds = seconds;
    }
    const elapsedSeconds = Math.max(seconds - this.lastRenderSeconds, 0);
    this.lastRenderSeconds = seconds;
    if (!this.animate || this.timeKind === 'none') {
      return;
    }
    this.currentTimeMilliseconds =
      (this.currentTimeMilliseconds + elapsedSeconds * CURRENT_TIME_RATE_MILLISECONDS_PER_SECOND) %
      POINT_SWEEP_MILLISECONDS;
  }

  private readonly handleRowCountKindChange = (rowCountKind: ArrowPointRowCountKind): void => {
    if (rowCountKind === this.rowCountKind) {
      return;
    }
    this.streamPointInput(
      rowCountKind,
      this.sourceKind,
      this.timeKind,
      this.colorKind,
      this.radiusKind
    );
  };

  private readonly handleSourceKindChange = (sourceKind: ArrowPointSourceKind): void => {
    if (sourceKind === this.sourceKind) {
      return;
    }
    this.streamPointInput(
      this.rowCountKind,
      sourceKind,
      this.timeKind,
      this.colorKind,
      this.radiusKind
    );
  };

  private readonly handleTimeKindChange = (timeKind: ArrowPointTimeKind): void => {
    if (timeKind === this.timeKind) {
      return;
    }
    this.streamPointInput(
      this.rowCountKind,
      this.sourceKind,
      timeKind,
      this.colorKind,
      this.radiusKind
    );
  };

  private readonly handleColorKindChange = (colorKind: ArrowPointColorKind): void => {
    if (colorKind === this.colorKind) {
      return;
    }
    this.streamPointInput(
      this.rowCountKind,
      this.sourceKind,
      this.timeKind,
      colorKind,
      this.radiusKind
    );
  };

  private readonly handleRadiusKindChange = (radiusKind: ArrowPointRadiusKind): void => {
    if (radiusKind === this.radiusKind) {
      return;
    }
    this.streamPointInput(
      this.rowCountKind,
      this.sourceKind,
      this.timeKind,
      this.colorKind,
      radiusKind
    );
  };

  private readonly handleAnimateChange = (enabled: boolean): void => {
    this.animate = enabled;
  };
}
