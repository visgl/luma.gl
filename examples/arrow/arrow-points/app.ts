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
  type ArrowPointRowCountKind,
  type ArrowPointSourceKind,
  type ArrowPointTimeKind
} from './arrow-point-data';
import {ArrowPointRenderer, type ArrowPointRendererPickingInfo} from './arrow-point-renderer';
import {ArrowPointControlPanel, makeArrowPointControlPanelHtml} from './control-panel';

export const title = 'Points: XY/XYM/XYZM';
export const description =
  'Arrow FixedSizeList<Float32, 2 | 3 | 4> and DenseUnion point rows rendered as ScatterplotLayer-style circle impostors with temporal M or timestamp animation and picking.';

export default class ArrowPointAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeArrowPointControlPanelHtml();

  static props = {useDevicePixels: true};

  readonly device: Device;
  readonly controlPanel: ArrowPointControlPanel;
  readonly layer: ArrowPointRenderer;
  rowCountKind: ArrowPointRowCountKind = '10k-stream';
  sourceKind: ArrowPointSourceKind = 'xym';
  timeKind: ArrowPointTimeKind = 'm';
  colorKind: ArrowPointColorKind = 'row-colors';
  animate = true;
  currentTimeMilliseconds = 0;
  lastRenderSeconds: number | null = null;
  isFinalized = false;

  constructor({device}: AnimationProps) {
    super();
    this.device = device as Device;
    this.layer = new ArrowPointRenderer(this.device, {onPick: this.handlePointPicked});
    this.controlPanel = new ArrowPointControlPanel({
      initialState: this.getControlPanelState(),
      handlers: {
        onRowCountKindChange: this.handleRowCountKindChange,
        onSourceKindChange: this.handleSourceKindChange,
        onTimeKindChange: this.handleTimeKindChange,
        onColorKindChange: this.handleColorKindChange,
        onAnimateChange: this.handleAnimateChange
      }
    });
  }

  override async onInitialize(): Promise<void> {
    this.controlPanel.initialize();
    this.streamPointInput(this.rowCountKind, this.sourceKind, this.timeKind, this.colorKind);
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
    this.layer.pick(_mousePosition);
    this.controlPanel.setCurrentTimeLabel(
      this.timeKind === 'none' ? '-' : formatPointCurrentTimeLabel(this.currentTimeMilliseconds)
    );
  }

  override onFinalize(): void {
    this.isFinalized = true;
    this.controlPanel.destroy();
    this.layer.destroy();
  }

  private getControlPanelState() {
    return {
      rowCountKind: this.rowCountKind,
      sourceKind: this.sourceKind,
      timeKind: this.timeKind,
      colorKind: this.colorKind,
      animate: this.animate
    };
  }

  private streamPointInput(
    rowCountKind: ArrowPointRowCountKind,
    sourceKind: ArrowPointSourceKind,
    timeKind: ArrowPointTimeKind,
    colorKind: ArrowPointColorKind
  ): void {
    const effectiveTimeKind = getEffectivePointTimeKind(sourceKind, timeKind);
    this.rowCountKind = rowCountKind;
    this.sourceKind = sourceKind;
    this.timeKind = effectiveTimeKind;
    this.colorKind = colorKind;
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
      center: [0, 0],
      scale: 1
    });
    this.controlPanel.syncControls({
      rowCountKind,
      sourceKind,
      timeKind: effectiveTimeKind,
      colorKind
    });
    this.controlPanel.setPickedLabel('Hover point');
    this.controlPanel.setCurrentTimeLabel(
      effectiveTimeKind === 'none' ? '-' : formatPointCurrentTimeLabel(this.currentTimeMilliseconds)
    );
    this.controlPanel.setStreamingBatchStatus(0, sourceData.batchCount);
    const streamingSession = this.layer.beginRecordBatchStream();
    this.updateMetrics();

    void this.layer.streamRecordBatches({
      streamingSession,
      recordBatchIterator: createStreamingPointRecordBatchIterator(sourceData.recordBatches)[
        Symbol.asyncIterator
      ](),
      onBatch: ({loadedBatchCount, metrics}) => {
        if (this.isFinalized) {
          return;
        }
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
    this.streamPointInput(rowCountKind, this.sourceKind, this.timeKind, this.colorKind);
  };

  private readonly handleSourceKindChange = (sourceKind: ArrowPointSourceKind): void => {
    if (sourceKind === this.sourceKind) {
      return;
    }
    this.streamPointInput(this.rowCountKind, sourceKind, this.timeKind, this.colorKind);
  };

  private readonly handleTimeKindChange = (timeKind: ArrowPointTimeKind): void => {
    if (timeKind === this.timeKind) {
      return;
    }
    this.streamPointInput(this.rowCountKind, this.sourceKind, timeKind, this.colorKind);
  };

  private readonly handleColorKindChange = (colorKind: ArrowPointColorKind): void => {
    if (colorKind === this.colorKind) {
      return;
    }
    this.streamPointInput(this.rowCountKind, this.sourceKind, this.timeKind, colorKind);
  };

  private readonly handleAnimateChange = (enabled: boolean): void => {
    this.animate = enabled;
  };

  private readonly handlePointPicked = ({
    batchIndex,
    rowIndex,
    batchRowIndex
  }: ArrowPointRendererPickingInfo): void => {
    this.controlPanel.setPickedLabel(
      batchIndex === null || rowIndex === null
        ? 'Hover point'
        : `rowIndex ${rowIndex.toLocaleString()} / batch ${(batchIndex + 1).toLocaleString()} / batch row ${
            batchRowIndex === null ? '-' : batchRowIndex.toLocaleString()
          }`
    );
  };
}
