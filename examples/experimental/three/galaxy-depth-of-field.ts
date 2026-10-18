// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {type Device, type Texture, type TextureFormat} from '@luma.gl/core';
import {ShaderPassRenderer} from '@luma.gl/engine';
import {dofCompositeShaderPass} from '@luma.gl/effects';
import {ExternalTexture, type Texture as ThreeTexture, type WebGPURenderer} from 'three/webgpu';

// The example pins Three r185. Keep its private native-texture lookup at this adapter boundary.
type TextureBackend = {get(texture: ThreeTexture): {texture: GPUTexture}};

/** Run the existing luma DOF pass on borrowed Three textures, on the same GPU queue. */
export class GalaxyDepthOfField {
  readonly output = new ExternalTexture();
  private readonly passes: ShaderPassRenderer;
  private readonly backend: TextureBackend;
  private source?: Texture;
  private depth?: Texture;
  private sourceHandle?: GPUTexture;
  private outputHandle?: GPUTexture;

  constructor(
    private readonly device: Device,
    renderer: WebGPURenderer
  ) {
    this.backend = renderer.backend as unknown as TextureBackend;
    this.output.flipY = false;
    this.passes = new ShaderPassRenderer(device, {
      // Keep HDR starlight through the existing pass's scratch target as well.
      shaderPasses: [
        {...dofCompositeShaderPass, renderTargets: {blurScratch: {format: 'rgba16float'}}}
      ],
      colorFormat: 'rgba16float',
      flipY: true
    });
  }

  render(
    color: ThreeTexture,
    depth: ThreeTexture,
    focusDistance: number,
    aperture: number,
    depthRange: [number, number]
  ): void {
    const sourceHandle = this.backend.get(color).texture;
    if (this.sourceHandle !== sourceHandle) {
      this.source?.destroy();
      this.depth?.destroy();
      this.sourceHandle = sourceHandle;
      this.source = this.borrowTexture(sourceHandle);
      this.depth = this.borrowTexture(this.backend.get(depth).texture);
      // The seed model uses canvas dimensions to preserve source aspect ratio.
      // Keep this detached context in step with the borrowed scene textures too.
      this.device.getCanvasContext().setDrawingBufferSize(sourceHandle.width, sourceHandle.height);
      this.passes.resize([sourceHandle.width, sourceHandle.height]);
    }
    const result = this.passes.renderToTexture({
      sourceTexture: this.source!,
      bindings: {depthTexture: this.depth!},
      uniforms: {
        dof: {
          depthRange,
          focusDistance,
          blurCoefficient: aperture * 24,
          pixelsPerMillimeter: sourceHandle.height / 850
        }
      }
    });
    this.device.submit();
    const outputHandle = result!.handle as GPUTexture;
    if (this.outputHandle !== outputHandle) {
      // r185 requires releasing cached texture metadata before rebinding a resized handle.
      // ExternalTexture disposal does not destroy the luma-owned GPU texture.
      if (this.outputHandle) this.output.dispose();
      this.outputHandle = outputHandle;
      this.output.sourceTexture = outputHandle;
      this.output.needsUpdate = true;
    }
  }

  dispose(): void {
    this.output.dispose();
    this.source?.destroy();
    this.depth?.destroy();
    this.passes.destroy();
  }

  private borrowTexture(handle: GPUTexture): Texture {
    return this.device.createTexture({
      handle,
      _isHandleBorrowed: true,
      width: handle.width,
      height: handle.height,
      format: handle.format as TextureFormat,
      sampler: {minFilter: 'nearest', magFilter: 'nearest'}
    });
  }
}
