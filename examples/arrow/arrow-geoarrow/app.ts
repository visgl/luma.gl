// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {AnimationLoopTemplate} from '@luma.gl/engine';
import {GeoArrowControlPanel, makeGeoArrowControlPanelHtml} from './control-panel';
import {makeGeoArrowExampleData, type GeoArrowExampleData} from './geoarrow-data';
import {GeoArrowRenderer} from './geoarrow-renderer';

export const title = 'GeoArrow';
export const description =
  'Mixed GeoArrow DenseUnion Point, LineString, MultiLineString, Polygon, and MultiPolygon rows rendered by composing the Arrow point, line, and polygon renderers.';

export default class GeoArrowAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeGeoArrowControlPanelHtml();

  static props = {useDevicePixels: true};

  readonly device: Device;
  readonly controlPanel = new GeoArrowControlPanel();
  readonly renderer: GeoArrowRenderer;
  exampleData: GeoArrowExampleData | null = null;
  isFinalized = false;

  constructor({device}: AnimationProps) {
    super();
    this.device = device as Device;
    this.renderer = new GeoArrowRenderer(this.device);
  }

  override async onInitialize(): Promise<void> {
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
    this.controlPanel.setMetrics(this.renderer.getMetrics(), exampleData.arrowByteLength);
  }

  override onRender({aspect, device}: AnimationProps): void {
    const renderPass = device.beginRenderPass({clearColor: [0.018, 0.034, 0.07, 1]});
    this.renderer.draw(renderPass, {aspect});
    renderPass.end();
  }

  override onFinalize(): void {
    this.isFinalized = true;
    this.renderer.destroy();
  }
}
