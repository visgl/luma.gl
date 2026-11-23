// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert, Texture, type Device, type Framebuffer, type RenderPass} from '@luma.gl/core';

export type PBRSurfacePassProps = {width: number; height: number};

export type PBRSurfaceRenderView = PBRSurfacePassProps & {
  framebuffer: Framebuffer;
  renderPass: RenderPass;
};

export type PBRSurfaceRenderOptions = {
  /** Create or upload per-object uniform storage before the render pass begins. */
  prepareSurfaces?: (view: Omit<PBRSurfaceRenderView, 'renderPass'>) => void;
  /** Record caller-selected surface model draws. The pass is ended by the owner. */
  drawSurfaces: (view: PBRSurfaceRenderView) => void;
};

type SurfaceResources = PBRSurfacePassProps & {
  normalTexture: Texture;
  depthTexture: Texture;
  framebuffer: Framebuffer;
};

/** Owns a single-sample camera depth/normal target, without scene traversal or submission. */
export class PBRSurfacePass {
  readonly device: Device;
  private resources: SurfaceResources;
  private destroyed = false;

  constructor(device: Device, props: PBRSurfacePassProps) {
    this.device = device;
    this.resources = createSurfaceResources(device, props);
  }

  get width(): number {
    return this.resources.width;
  }
  get height(): number {
    return this.resources.height;
  }
  /** Borrowed rgba8unorm encoded view normals; alpha zero denotes background. */
  get normalTexture(): Texture {
    return this.resources.normalTexture;
  }
  /** Borrowed depth32float hardware depth in [0,1], cleared to one. */
  get depthTexture(): Texture {
    return this.resources.depthTexture;
  }
  get framebuffer(): Framebuffer {
    return this.resources.framebuffer;
  }

  /** Replaces and destroys old attachments only when dimensions change. Rebind consumers afterward. */
  resize(props: PBRSurfacePassProps): void {
    // A destroyed surface pass cannot be reused.
    assert(!this.destroyed);
    if (props.width === this.width && props.height === this.height) return;
    const resources = createSurfaceResources(this.device, props);
    destroySurfaceResources(this.resources);
    this.resources = resources;
  }

  /** Records camera-surface draws and ends the pass even if a callback throws. Never submits. */
  render(options: PBRSurfaceRenderOptions): void {
    // A destroyed surface pass cannot be reused.
    assert(!this.destroyed);
    const view = {width: this.width, height: this.height, framebuffer: this.framebuffer};
    options.prepareSurfaces?.(view);
    const renderPass = this.device.beginRenderPass({
      framebuffer: this.framebuffer,
      clearColor: [0.5, 0.5, 1, 0],
      clearDepth: 1
    });
    try {
      renderPass.setParameters({viewport: [0, 0, this.width, this.height]});
      options.drawSurfaces({...view, renderPass});
    } finally {
      renderPass.end();
    }
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    destroySurfaceResources(this.resources);
  }
}

function createSurfaceResources(device: Device, props: PBRSurfacePassProps): SurfaceResources {
  const {width, height} = props;
  // Surface targets require positive integer dimensions; the device validates its own limits.
  assert(Number.isInteger(width) && width > 0 && Number.isInteger(height) && height > 0);
  let normalTexture: Texture | undefined;
  let depthTexture: Texture | undefined;
  let framebuffer: Framebuffer | undefined;
  try {
    const usage = Texture.RENDER_ATTACHMENT | Texture.SAMPLE | Texture.COPY_SRC;
    const sampler = {minFilter: 'nearest', magFilter: 'nearest'} as const;
    normalTexture = device.createTexture({width, height, format: 'rgba8unorm', usage, sampler});
    depthTexture = device.createTexture({width, height, format: 'depth32float', usage, sampler});
    framebuffer = device.createFramebuffer({
      width,
      height,
      colorAttachments: [normalTexture],
      depthStencilAttachment: depthTexture
    });
    return {width, height, normalTexture, depthTexture, framebuffer};
  } catch (error) {
    framebuffer?.destroy();
    depthTexture?.destroy();
    normalTexture?.destroy();
    throw error;
  }
}

function destroySurfaceResources(resources: SurfaceResources): void {
  resources.framebuffer.destroy();
  resources.depthTexture.destroy();
  resources.normalTexture.destroy();
}
