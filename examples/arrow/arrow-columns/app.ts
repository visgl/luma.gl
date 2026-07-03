// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type Device, type Framebuffer, Texture} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {AnimationLoopTemplate, BackgroundTextureModel} from '@luma.gl/engine';
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
  private sceneFramebuffer: Framebuffer;
  private readonly presentModel: BackgroundTextureModel;
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
    this.sceneFramebuffer = createSceneFramebuffer(this.device, 1, 1);
    this.presentModel = new BackgroundTextureModel(this.device, {
      id: 'arrow-columns-present',
      backgroundTexture: this.sceneFramebuffer.colorAttachments[0].texture,
      flipY: this.device.type === 'webgpu'
    });
    this.source = new ArrowColumnSource(
      sourceData => void this.initializeLayer(sourceData),
      () => this.source.setRenderingStatus()
    );
  }

  override async onInitialize(): Promise<void> {
    await this.source.initialize();
  }

  override onRender({aspect, device, time}: AnimationProps): void {
    const [width, height] = device.getCanvasContext().getDrawingBufferSize();
    this.resizeSceneFramebuffer(width, height);
    const clearPass = device.beginRenderPass({
      framebuffer: this.sceneFramebuffer,
      clearColor: [0.012, 0.024, 0.045, 1],
      clearDepth: 1
    });
    clearPass.end();

    let outputTexture = this.sceneFramebuffer.colorAttachments[0].texture;
    if (this.source.transparencyMode === 'a-buffer') {
      outputTexture = this.aBufferRenderer.render({
        sourceTexture: outputTexture,
        opaqueDepthTexture: this.sceneFramebuffer.depthStencilAttachment!,
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
      outputTexture = this.wboitRenderer.render({
        sourceTexture: outputTexture,
        drawOpaqueDepth: () => {},
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
        framebuffer: this.sceneFramebuffer,
        clearColor: false,
        clearDepth: false
      });
      this.layer?.draw(renderPass, {time, aspect});
      renderPass.end();
    }

    this.presentModel.setProps({backgroundTexture: outputTexture});
    this.presentModel.predraw(device.commandEncoder);
    const presentPass = device.beginRenderPass({
      clearColor: [0.012, 0.024, 0.045, 1],
      clearDepth: 1
    });
    this.presentModel.draw(presentPass);
    presentPass.end();
    if (this.layer)
      this.source.setActiveTimeBucket(formatActiveTimeBucket(this.layer.getActiveTimeBucket()));
  }

  override onFinalize(): void {
    this.source.finalize();
    this.aBufferRenderer.destroy();
    this.wboitRenderer.destroy();
    destroySceneFramebuffer(this.sceneFramebuffer);
    this.presentModel.destroy();
    this.layer?.destroy();
  }

  private resizeSceneFramebuffer(width: number, height: number): void {
    if (this.sceneFramebuffer.width === width && this.sceneFramebuffer.height === height) {
      return;
    }
    destroySceneFramebuffer(this.sceneFramebuffer);
    this.sceneFramebuffer = createSceneFramebuffer(this.device, width, height);
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

function createSceneFramebuffer(device: Device, width: number, height: number): Framebuffer {
  const colorTexture = device.createTexture({
    id: 'arrow-columns-scene-color',
    width,
    height,
    format: 'rgba8unorm',
    usage: Texture.SAMPLE | Texture.RENDER
  });
  const depthTexture = device.createTexture({
    id: 'arrow-columns-scene-depth',
    width,
    height,
    format: 'depth24plus',
    usage: Texture.SAMPLE | Texture.RENDER
  });
  return device.createFramebuffer({
    id: 'arrow-columns-scene-framebuffer',
    width,
    height,
    colorAttachments: [colorTexture],
    depthStencilAttachment: depthTexture
  });
}

function destroySceneFramebuffer(framebuffer: Framebuffer): void {
  const colorTexture = framebuffer.colorAttachments[0].texture;
  const depthTexture = framebuffer.depthStencilAttachment?.texture;
  framebuffer.destroy();
  colorTexture.destroy();
  depthTexture?.destroy();
}
