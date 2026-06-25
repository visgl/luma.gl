// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {DggsCellEncoding} from '@luma.gl/arrow';
import type {Device} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {AnimationLoopTemplate} from '@luma.gl/engine';
import {formatDggsPolygonMetrics} from './arrow-dggs-polygon-metrics';
import {ArrowDggsPolygonRenderer, type DggsSourceKind} from './arrow-dggs-polygon-renderer';
import {ArrowDggsPolygonsControlPanel} from './control-panel';
import {ArrowExamplePanelManager, makeArrowExamplePanelHostHtml} from '../arrow-example-panels';

export const title = 'Global Grids: Uint64, Utf8';
export const description =
  'Parses geohash, quadkey, S2, A5, and H3 cell ids into Uint64 keys on the GPU, generates boundary paths, and renders them through the storage-backed Arrow path model.';

export class ArrowDggsPolygonSourceController extends AnimationLoopTemplate {
  static info = makeArrowExamplePanelHostHtml();

  static props = {useDevicePixels: true};

  readonly device: Device;
  readonly controlPanel: ArrowDggsPolygonsControlPanel;
  readonly panels = new ArrowExamplePanelManager({
    descriptionPanel: () => this.controlPanel.makeDescriptionPanel(),
    settingsPanel: () => this.controlPanel.makeSettingsPanel()
  });
  activeEncoding: DggsCellEncoding = 'geohash';
  activeSourceKind: DggsSourceKind = 'uint64';
  layer: ArrowDggsPolygonRenderer | null = null;

  constructor({device}: AnimationProps) {
    super();
    this.device = device as Device;
    this.controlPanel = new ArrowDggsPolygonsControlPanel({
      initialState: {
        encoding: this.activeEncoding,
        sourceKind: this.activeSourceKind
      },
      handlers: {
        onEncodingChange: this.handleEncodingSelection,
        onSourceChange: this.handleSourceSelection
      },
      onRefresh: () => this.panels.refresh()
    });
  }

  override async onInitialize(): Promise<void> {
    this.layer = new ArrowDggsPolygonRenderer(this.device, {
      encoding: this.activeEncoding,
      sourceKind: this.activeSourceKind
    });
    this.panels.mount();
    this.controlPanel.initialize();
    this.panels.setTableEntries([
      {
        id: 'dggs-uint64',
        label: 'Packed Uint64 keys',
        kind: 'source',
        table: this.layer.uint64Table
      },
      {
        id: 'dggs-utf8',
        label: 'Utf8 keys',
        kind: 'source',
        table: this.layer.stringTable
      }
    ]);
    this.updateLabels();
  }

  override onRender({aspect, device}: AnimationProps): void {
    const renderPass = device.beginRenderPass({clearColor: [0.015, 0.035, 0.07, 1]});
    this.layer?.draw(renderPass, {aspect});
    renderPass.end();
  }

  override onFinalize(): void {
    this.controlPanel.destroy();
    this.panels.finalize();
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
