// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {AnimationLoopTemplate} from '@luma.gl/engine';
import {GeoArrowControlPanel} from './control-panel';
import {makeGeoArrowExampleData, type GeoArrowExampleData} from './geoarrow-data';
import {GeoArrowRenderer} from './geoarrow-renderer';
import {ArrowExamplePanelManager, makeArrowExamplePanelHostHtml} from '../arrow-example-panels';

export const title = 'GeoArrow';
export const description =
  'Mixed GeoArrow DenseUnion Point, LineString, MultiLineString, Polygon, and MultiPolygon rows rendered by composing the Arrow point, line, and polygon renderers.';

export default class GeoArrowAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeArrowExamplePanelHostHtml();

  static props = {useDevicePixels: true};

  readonly device: Device;
  readonly controlPanel = new GeoArrowControlPanel();
  readonly panels = new ArrowExamplePanelManager({
    descriptionPanel: () => this.controlPanel.makeDescriptionPanel()
  });
  readonly renderer: GeoArrowRenderer;
  exampleData: GeoArrowExampleData | null = null;
  isFinalized = false;

  constructor({device}: AnimationProps) {
    super();
    this.device = device as Device;
    this.renderer = new GeoArrowRenderer(this.device);
  }

  override async onInitialize(): Promise<void> {
    this.panels.mount();
    this.controlPanel.initialize();
    const exampleData = makeGeoArrowExampleData();
    this.exampleData = exampleData;
    await this.renderer.setProps({
      data: exampleData.table,
      geometries: 'geometries',
      colors: 'colors',
      widths: 'widths',
      radii: 'radii',
      center: [0, 0],
      scale: 1
    });
    if (this.isFinalized) {
      return;
    }
    const inspectionTables = this.renderer.getInspectionTables();
    this.panels.setTableEntries([
      {
        id: 'geoarrow-source',
        label: 'Mixed geometry source',
        kind: 'source',
        table: exampleData.table
      },
      {
        id: 'geoarrow-points',
        label: 'Point rows',
        kind: 'derived',
        table: inspectionTables.pointTable
      },
      {
        id: 'geoarrow-lines',
        label: 'Line rows',
        kind: 'derived',
        table: inspectionTables.lineTable
      },
      {
        id: 'geoarrow-polygons',
        label: 'Polygon rows',
        kind: 'derived',
        table: inspectionTables.polygonTable
      }
    ]);
    this.controlPanel.setMetrics(this.renderer.getMetrics(), exampleData.arrowByteLength);
  }

  override onRender({aspect, device}: AnimationProps): void {
    const renderPass = device.beginRenderPass({clearColor: [0.018, 0.034, 0.07, 1]});
    this.renderer.draw(renderPass, {aspect});
    renderPass.end();
  }

  override onFinalize(): void {
    this.isFinalized = true;
    this.panels.finalize();
    this.renderer.destroy();
  }
}
