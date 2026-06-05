// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {AnimationLoopTemplate} from '@luma.gl/engine';
import {
  createStreamingPolygonRecordBatchIterator,
  type ArrowPolygonColorKind,
  type ArrowPolygonRowCountKind,
  type ArrowPolygonSourceKind,
  type ArrowPolygonViewState,
  makeArrowPolygonExampleData
} from './arrow-polygon-data';
import {ArrowPolygonRenderer, type ArrowPolygonRendererPickingInfo} from './arrow-polygon-renderer';
import {ArrowExamplePanelManager, makeArrowExamplePanelHostHtml} from '../arrow-example-panels';
import {ArrowPolygonControlPanel, makeArrowPolygonControlPanelHtml} from './control-panel';

export const title = 'Polygons';
export const description =
  'Tessellates Arrow polygon, multipolygon, and geoarrow.geometry DenseUnion rows with math.gl earcut, including holes, row colors, and vertex colors.';

export default class ArrowPolygonAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeArrowExamplePanelHostHtml();

  static props = {useDevicePixels: true};

  readonly device: Device;
  readonly controlPanel: ArrowPolygonControlPanel;
  readonly panels = new ArrowExamplePanelManager({
    controlsHtml: makeArrowPolygonControlPanelHtml()
  });
  layer: ArrowPolygonRenderer;
  rowCountKind: ArrowPolygonRowCountKind = '10k-stream';
  sourceKind: ArrowPolygonSourceKind = 'polygon';
  colorKind: ArrowPolygonColorKind = 'row-colors';
  viewState: ArrowPolygonViewState | null = null;
  animationSeconds = 0;
  lastRenderSeconds: number | null = null;
  isFinalized = false;

  constructor({device}: AnimationProps) {
    super();
    this.device = device as Device;
    this.layer = new ArrowPolygonRenderer(this.device, {onPick: this.handlePolygonPicked});
    this.controlPanel = new ArrowPolygonControlPanel({
      initialState: {
        rowCountKind: this.rowCountKind,
        sourceKind: this.sourceKind,
        colorKind: this.colorKind
      },
      handlers: {
        onRowCountKindChange: this.handleRowCountKindChange,
        onSourceKindChange: this.handleSourceKindChange,
        onColorKindChange: this.handleColorKindChange
      }
    });
  }

  override async onInitialize(): Promise<void> {
    this.panels.mount();
    this.controlPanel.initialize();
    this.streamPolygonInput(this.rowCountKind, this.sourceKind, this.colorKind);
  }

  override onRender({aspect, device, time, _mousePosition}: AnimationProps): void {
    this.updateAnimationTime(time);
    this.layer.setProps({
      center: this.getScrollCenter(),
      scale: this.viewState?.scale ?? 1
    });

    const renderPass = device.beginRenderPass({clearColor: [0.02, 0.04, 0.08, 1]});
    this.layer.draw(renderPass, {aspect});
    renderPass.end();
    this.layer.pick(_mousePosition);
  }

  override onFinalize(): void {
    this.isFinalized = true;
    this.controlPanel.destroy();
    this.panels.finalize();
    this.layer.destroy();
  }

  private streamPolygonInput(
    rowCountKind: ArrowPolygonRowCountKind,
    sourceKind: ArrowPolygonSourceKind,
    colorKind: ArrowPolygonColorKind
  ): void {
    const effectiveColorKind = getEffectiveColorKind(sourceKind, colorKind);
    this.rowCountKind = rowCountKind;
    this.sourceKind = sourceKind;
    this.colorKind = effectiveColorKind;
    const sourceData = makeArrowPolygonExampleData(rowCountKind, sourceKind, effectiveColorKind);
    this.viewState = sourceData.viewState;
    this.animationSeconds = 0;
    this.lastRenderSeconds = null;
    this.layer.setProps({
      tessellated: sourceData.tessellated,
      colors: effectiveColorKind === 'constant' ? null : undefined,
      center: sourceData.viewState.startCenter,
      scale: sourceData.viewState.scale
    });
    this.controlPanel.syncControls({rowCountKind, sourceKind, colorKind: effectiveColorKind});
    this.controlPanel.setPickedLabel('Hover polygon');
    this.controlPanel.setStreamingBatchStatus(0, sourceData.batchCount);
    this.updateMetrics();
    const polygonTableStream = this.panels.beginLoadedTableStream({
      id: 'polygons-source',
      label: 'Loaded polygon source',
      kind: 'source',
      recordBatches: sourceData.recordBatches
    });

    this.layer.setProps({
      data: createStreamingPolygonRecordBatchIterator(sourceData.recordBatches)[
        Symbol.asyncIterator
      ](),
      onDataBatch: ({loadedBatchCount, metrics}) => {
        if (this.isFinalized) {
          return;
        }
        polygonTableStream.setLoadedBatchCount(loadedBatchCount);
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
    this.animationSeconds += elapsedSeconds;
  }

  private getScrollCenter(): [number, number] {
    if (!this.viewState) {
      return [0, 0];
    }

    const cycleDurationSeconds = this.viewState.scrollDurationSeconds * 2;
    const cyclePosition =
      cycleDurationSeconds > 0
        ? (this.animationSeconds % cycleDurationSeconds) / cycleDurationSeconds
        : 0;
    const scrollProgress = cyclePosition <= 0.5 ? cyclePosition * 2 : (1 - cyclePosition) * 2;
    const easedProgress = scrollProgress * scrollProgress * (3 - 2 * scrollProgress);
    return [
      interpolate(this.viewState.startCenter[0], this.viewState.endCenter[0], easedProgress),
      interpolate(this.viewState.startCenter[1], this.viewState.endCenter[1], easedProgress)
    ];
  }

  private readonly handleRowCountKindChange = (rowCountKind: ArrowPolygonRowCountKind): void => {
    if (rowCountKind === this.rowCountKind) {
      return;
    }
    this.streamPolygonInput(rowCountKind, this.sourceKind, this.colorKind);
  };

  private readonly handleSourceKindChange = (sourceKind: ArrowPolygonSourceKind): void => {
    if (sourceKind === this.sourceKind) {
      return;
    }
    this.streamPolygonInput(this.rowCountKind, sourceKind, this.colorKind);
  };

  private readonly handleColorKindChange = (colorKind: ArrowPolygonColorKind): void => {
    if (colorKind === this.colorKind) {
      return;
    }
    this.streamPolygonInput(this.rowCountKind, this.sourceKind, colorKind);
  };

  private readonly handlePolygonPicked = ({
    batchIndex,
    rowIndex
  }: ArrowPolygonRendererPickingInfo): void => {
    this.controlPanel.setPickedLabel(
      batchIndex === null || rowIndex === null
        ? 'Hover polygon'
        : `row ${rowIndex.toLocaleString()} / batch ${(batchIndex + 1).toLocaleString()}`
    );
  };
}

function interpolate(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

function getEffectiveColorKind(
  sourceKind: ArrowPolygonSourceKind,
  colorKind: ArrowPolygonColorKind
): ArrowPolygonColorKind {
  return sourceKind === 'dense-union' && colorKind === 'vertex-colors' ? 'row-colors' : colorKind;
}
