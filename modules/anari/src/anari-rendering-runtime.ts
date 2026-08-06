// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {type Device, type Framebuffer, Texture} from '@luma.gl/core';
import {bloomShaderPassPipeline} from '@luma.gl/effects';
import {ShaderPassRenderer} from '@luma.gl/engine';
import {DeferredSceneRenderer, SceneRenderer} from '@luma.gl/experimental';
import type {ANARIFrame} from './anari-objects';
import type {ANARIRendererRuntime} from './anari-renderer-runtime';
import {ANARISceneAdapter, getFrameSize} from './anari-scene-adapter';
import type {ANARIFrameStatistics} from './anari-types';

type FrameResources = {
  framebuffer: Framebuffer | null;
  colorTexture: Texture | null;
  bloomRenderer: ShaderPassRenderer | null;
};

/** Adapts ANARI handles and optional postprocessing into shared scene renderers. */
export class ANARIRenderingRuntime implements ANARIRendererRuntime {
  private readonly device: Device;
  private readonly adapter = new ANARISceneAdapter();
  private readonly renderer: SceneRenderer | DeferredSceneRenderer;
  private readonly frames = new Map<ANARIFrame, FrameResources>();
  private readonly deferred: boolean;

  constructor(device: Device, {deferred = false}: {deferred?: boolean} = {}) {
    this.device = device;
    this.deferred = deferred;
    this.renderer = deferred ? new DeferredSceneRenderer(device) : new SceneRenderer(device);
  }

  render(frame: ANARIFrame): ANARIFrameStatistics {
    const renderOptions = this.adapter.makeRenderOptions(frame);
    const renderer = frame.getParameter('renderer');
    if (!renderOptions || !renderer) {
      return {surfaceCount: 0, instanceCount: 0, drawCount: 0, triangleCount: 0};
    }

    const bloomIntensity =
      !this.deferred && renderOptions.renderMode === 'default'
        ? (renderer.getParameter('bloomIntensity') ?? 0)
        : 0;
    if (bloomIntensity > 0) {
      renderOptions.framebuffer = this.getFramebuffer(frame, this.getFrameResources(frame));
    }

    const statistics = this.renderer.render(renderOptions);
    if (renderOptions.framebuffer && bloomIntensity > 0) {
      const frameResources = this.getFrameResources(frame);
      const bloomRenderer = this.getBloomRenderer(frameResources);
      bloomRenderer.resize(getFrameSize(frame, this.device));
      bloomRenderer.renderToScreen({
        sourceTexture: renderOptions.framebuffer.colorAttachments[0].texture,
        uniforms: {
          bloomExtract: {threshold: renderer.getParameter('bloomThreshold') ?? 0.62},
          bloomBlur: {radius: renderer.getParameter('bloomRadius') ?? 7},
          bloomComposite: {intensity: bloomIntensity}
        }
      });
    }

    return statistics;
  }

  destroyFrame(frame: ANARIFrame): void {
    this.renderer.destroyFrame(frame.id);
    const frameResources = this.frames.get(frame);
    if (!frameResources) {
      return;
    }

    frameResources.framebuffer?.destroy();
    frameResources.colorTexture?.destroy();
    frameResources.bloomRenderer?.destroy();
    this.frames.delete(frame);
  }

  destroy(): void {
    for (const frame of Array.from(this.frames.keys())) {
      this.destroyFrame(frame);
    }
    this.renderer.destroy();
    this.adapter.destroy();
  }

  private getFrameResources(frame: ANARIFrame): FrameResources {
    let frameResources = this.frames.get(frame);
    if (!frameResources) {
      frameResources = {framebuffer: null, colorTexture: null, bloomRenderer: null};
      this.frames.set(frame, frameResources);
    }
    return frameResources;
  }

  private getFramebuffer(frame: ANARIFrame, frameResources: FrameResources): Framebuffer {
    const [width, height] = getFrameSize(frame, this.device);
    if (
      frameResources.framebuffer &&
      (frameResources.framebuffer.width !== width || frameResources.framebuffer.height !== height)
    ) {
      frameResources.framebuffer.destroy();
      frameResources.colorTexture?.destroy();
      frameResources.framebuffer = null;
      frameResources.colorTexture = null;
    }

    if (!frameResources.framebuffer) {
      frameResources.colorTexture = this.device.createTexture({
        id: `anari-${frame.id}-color-texture`,
        width,
        height,
        format: this.device.preferredColorFormat,
        usage: Texture.RENDER_ATTACHMENT | Texture.SAMPLE
      });
      frameResources.framebuffer = this.device.createFramebuffer({
        id: `anari-${frame.id}-color`,
        width,
        height,
        colorAttachments: [frameResources.colorTexture],
        depthStencilAttachment: 'depth24plus'
      });
    }
    return frameResources.framebuffer;
  }

  private getBloomRenderer(frameResources: FrameResources): ShaderPassRenderer {
    frameResources.bloomRenderer ||= new ShaderPassRenderer(this.device, {
      shaderPasses: [bloomShaderPassPipeline]
    });
    return frameResources.bloomRenderer;
  }
}
