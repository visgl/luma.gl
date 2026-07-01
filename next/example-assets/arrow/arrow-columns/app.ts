// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {AnimationLoopTemplate} from '@luma.gl/engine';
import {ABufferRenderer, WBOITRenderer} from '@luma.gl/experimental';
import {ArrowColumnRenderer, formatActiveTimeBucket} from './arrow-column-renderer';
import {ArrowColumnSource} from './arrow-column-source';
import {makeArrowExamplePanelHostHtml} from '../arrow-example-panels';

export const title = 'DGGS + time';
export const description =
  'Fetches the deck.gl HexagonLayer accident dataset, converts it to Arrow H3/time/count columns, and renders animated GPU-decoded H3 columns with A-buffer order-independent transparency.';

export default class ArrowColumnRendererAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeArrowExamplePanelHostHtml();
  static props = {useDevicePixels: true, createFramebuffer: true};
  readonly device: Device;
  readonly aBufferRenderer: ABufferRenderer;
  readonly wboitRenderer: WBOITRenderer;
  readonly source: ArrowColumnSource;
  layer: ArrowColumnRenderer | null = null;

  constructor({device}: AnimationProps) {
    super();
    this.device = device as Device;
    this.aBufferRenderer = new ABufferRenderer(this.device, {
      averageFragmentsPerPixel: 16,
      maxFragmentsPerPixel: 24,
      maxBufferByteLength: 64 * 1024 * 1024
    });
    this.wboitRenderer = new WBOITRenderer(this.device);
    this.source = new ArrowColumnSource(
      sourceData => void this.initializeLayer(sourceData),
      () => this.source.setRenderingStatus()
    );
  }

  override async onInitialize(): Promise<void> {
    await this.source.initialize();
  }

  override onRender({aspect, device, time}: AnimationProps): void {
    if (this.source.transparencyMode === 'a-buffer') {
      this.aBufferRenderer.render({
        clearColor: [0.012, 0.024, 0.045, 1],
        clearDepth: 1,
        drawBase: () => {},
        prepareTranslucent: ({commandEncoder, shaderModuleProps, captureParameters}) =>
          this.layer?.prepareABufferDraw(
            commandEncoder,
            {time, aspect},
            shaderModuleProps,
            captureParameters
          ),
        drawTranslucent: renderPass => this.layer?.drawABuffer(renderPass)
      });
    } else if (this.source.transparencyMode === 'weighted-blended') {
      this.wboitRenderer.render({
        clearColor: [0.012, 0.024, 0.045, 1],
        clearDepth: 1,
        drawBase: () => {},
        prepareTranslucent: ({commandEncoder, shaderModuleProps, captureParameters}) =>
          this.layer?.prepareWBOITDraw(
            commandEncoder,
            {time, aspect},
            shaderModuleProps,
            captureParameters
          ),
        drawTranslucent: renderPass => this.layer?.drawWBOIT(renderPass)
      });
    } else {
      const renderPass = device.beginRenderPass({
        clearColor: [0.012, 0.024, 0.045, 1],
        clearDepth: 1
      });
      this.layer?.draw(renderPass, {time, aspect});
      renderPass.end();
    }
    if (this.layer)
      this.source.setActiveTimeBucket(formatActiveTimeBucket(this.layer.getActiveTimeBucket()));
  }

  override onFinalize(): void {
    this.source.finalize();
    this.aBufferRenderer.destroy();
    this.wboitRenderer.destroy();
    this.layer?.destroy();
  }

  private async initializeLayer(
    sourceData: import('./arrow-column-data').ArrowColumnSourceData
  ): Promise<void> {
    const layer = new ArrowColumnRenderer(this.device, {sourceData});
    await layer.initialize();
    this.layer?.destroy();
    this.layer = layer;
    this.source.setRenderingStatus();
    this.source.setRendererMetrics(layer.getMetrics());
  }
}
