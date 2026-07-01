// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {AnimationLoopTemplate} from '@luma.gl/engine';
import {GeoArrowRenderer} from './geoarrow-renderer';
import {GeoArrowSource} from './geoarrow-source';
import {makeArrowExamplePanelHostHtml} from '../arrow-example-panels';

export const title = 'GeoArrow';
export const description =
  'Mixed GeoArrow DenseUnion Point, LineString, MultiLineString, Polygon, and MultiPolygon rows rendered by composing the Arrow point, line, and polygon renderers.';

export default class GeoArrowAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeArrowExamplePanelHostHtml();
  static props = {useDevicePixels: true};
  readonly renderer: GeoArrowRenderer;
  readonly source: GeoArrowSource;

  constructor({device}: AnimationProps) {
    super();
    this.renderer = new GeoArrowRenderer(device as Device);
    this.source = new GeoArrowSource(async data => {
      await this.renderer.setProps({
        data: data.table,
        geometries: 'geometries',
        colors: 'colors',
        widths: 'widths',
        radii: 'radii',
        center: [0, 0],
        scale: 1
      });
      this.source.setRendererResult(this.renderer, data);
    });
  }

  override async onInitialize(): Promise<void> {
    await this.source.initialize();
  }

  override onRender({aspect, device}: AnimationProps): void {
    const renderPass = device.beginRenderPass({clearColor: [0.018, 0.034, 0.07, 1]});
    this.renderer.draw(renderPass, {aspect});
    renderPass.end();
  }

  override onFinalize(): void {
    this.source.finalize();
    this.renderer.destroy();
  }
}
