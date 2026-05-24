// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {DggsCellEncoding} from '@luma.gl/arrow';
import type {Device} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {AnimationLoopTemplate} from '@luma.gl/engine';
import {formatDggsPolygonMetrics} from './arrow-dggs-polygon-metrics';
import {ArrowDggsPolygonLayer, type DggsSourceKind} from './arrow-dggs-polygon-layer';
import {DggsGpuPolygonsControlPanel, makeDggsGpuPolygonsControlPanelHtml} from './control-panel';

export const title = 'Global Grids: Uint64, Utf8';
export const description =
  'Parses geohash, quadkey, S2, A5, and H3 cell ids into Uint64 keys on the GPU, generates boundary paths, and renders them through the storage-backed Arrow path model.';

export default class DggsGpuPolygonsAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeDggsGpuPolygonsControlPanelHtml();

  static props = {useDevicePixels: true};

  readonly device: Device;
  readonly controlPanel: DggsGpuPolygonsControlPanel;
  activeEncoding: DggsCellEncoding = 'geohash';
  activeSourceKind: DggsSourceKind = 'uint64';
  layer: ArrowDggsPolygonLayer | null = null;

  constructor({device}: AnimationProps) {
    super();
    this.device = device as Device;
    this.controlPanel = new DggsGpuPolygonsControlPanel({
      initialState: {
        encoding: this.activeEncoding,
        sourceKind: this.activeSourceKind
      },
      handlers: {
        onEncodingChange: this.handleEncodingSelection,
        onSourceChange: this.handleSourceSelection
      }
    });
  }

  override async onInitialize(): Promise<void> {
    this.layer = new ArrowDggsPolygonLayer(this.device, {
      encoding: this.activeEncoding,
      sourceKind: this.activeSourceKind
    });
    this.controlPanel.initialize();
    this.updateLabels();
  }

  override onRender({aspect, device}: AnimationProps): void {
    const renderPass = device.beginRenderPass({clearColor: [0.015, 0.035, 0.07, 1]});
    this.layer?.draw(renderPass, {aspect});
    renderPass.end();
  }

  override onFinalize(): void {
    this.controlPanel.destroy();
    this.layer?.destroy();
  }

  updateLabels(): void {
    if (!this.layer) {
      return;
    }
    this.controlPanel.setMetricValues(formatDggsPolygonMetrics(this.layer.getMetrics()));
  }

  replaceInput(encoding: DggsCellEncoding, sourceKind: DggsSourceKind): void {
    if (encoding === this.activeEncoding && sourceKind === this.activeSourceKind) {
      return;
    }
    this.activeEncoding = encoding;
    this.activeSourceKind = sourceKind;
    this.controlPanel.syncControls({encoding, sourceKind});
    this.layer?.setProps({encoding, sourceKind});
    this.updateLabels();
  }

  readonly handleEncodingSelection = (encoding: DggsCellEncoding): void => {
    this.replaceInput(encoding, this.activeSourceKind);
  };

  readonly handleSourceSelection = (sourceKind: DggsSourceKind): void => {
    this.replaceInput(this.activeEncoding, sourceKind);
  };
}
