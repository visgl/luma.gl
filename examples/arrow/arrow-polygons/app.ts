// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {AnimationLoopTemplate} from '@luma.gl/engine';
import {ArrowPolygonRenderer, type ArrowPolygonRendererPickingInfo} from '@luma.gl/arrow';
import type {ArrowPolygonViewState} from './arrow-polygon-data';
import {ArrowPolygonDataSource} from './arrow-polygon-data-source';
import {makeArrowExamplePanelHostHtml} from '../arrow-example-panels';

export const title = 'Polygons';
export const description =
  'Tessellates Arrow polygon, multipolygon, and geoarrow.geometry DenseUnion rows with math.gl earcut, including holes, row colors, and vertex colors.';

export default class ArrowPolygonAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeArrowExamplePanelHostHtml();
  static props = {useDevicePixels: true};
  readonly layer: ArrowPolygonRenderer;
  readonly dataSource: ArrowPolygonDataSource;
  viewState: ArrowPolygonViewState | null = null;
  animationSeconds = 0;
  lastRenderSeconds: number | null = null;

  constructor({device}: AnimationProps) {
    super();
    this.layer = new ArrowPolygonRenderer(device as Device, {
      model: 'attribute',
      onPick: this.handlePolygonPicked
    });
    this.dataSource = new ArrowPolygonDataSource(
      device as Device,
      update => {
        this.viewState = update.viewState;
        this.animationSeconds = 0;
        this.lastRenderSeconds = null;
        this.layer.setProps(update);
      },
      props => this.layer.setProps(props)
    );
  }

  override async onInitialize(): Promise<void> {
    this.dataSource.initialize();
  }

  override onRender({aspect, device, time, _mousePosition}: AnimationProps): void {
    const seconds = time / 1000;
    if (this.lastRenderSeconds === null) this.lastRenderSeconds = seconds;
    this.animationSeconds += Math.max(seconds - this.lastRenderSeconds, 0);
    this.lastRenderSeconds = seconds;
    this.layer.setProps({center: this.getScrollCenter(), scale: this.viewState?.scale ?? 1});
    const renderPass = device.beginRenderPass({clearColor: [0.02, 0.04, 0.08, 1]});
    this.layer.draw(renderPass, {aspect});
    renderPass.end();
    this.layer.pick(_mousePosition, {force: true});
  }

  override onFinalize(): void {
    this.dataSource.finalize();
    this.layer.destroy();
  }

  private getScrollCenter(): [number, number] {
    if (!this.viewState) return [0, 0];
    const cycleDurationSeconds = this.viewState.scrollDurationSeconds * 2;
    const cyclePosition =
      cycleDurationSeconds > 0
        ? (this.animationSeconds % cycleDurationSeconds) / cycleDurationSeconds
        : 0;
    const scrollProgress = cyclePosition <= 0.5 ? cyclePosition * 2 : (1 - cyclePosition) * 2;
    const progress = scrollProgress * scrollProgress * (3 - 2 * scrollProgress);
    return [
      this.viewState.startCenter[0] +
        (this.viewState.endCenter[0] - this.viewState.startCenter[0]) * progress,
      this.viewState.startCenter[1] +
        (this.viewState.endCenter[1] - this.viewState.startCenter[1]) * progress
    ];
  }

  private readonly handlePolygonPicked = ({
    batchIndex,
    rowIndex
  }: ArrowPolygonRendererPickingInfo): void => {
    this.dataSource.setPickedRow(batchIndex, rowIndex);
  };
}
