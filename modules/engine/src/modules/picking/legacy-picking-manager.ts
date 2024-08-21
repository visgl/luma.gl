// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Device, Framebuffer} from '@luma.gl/core';
import {picking} from '@luma.gl/shadertools';
import {ShaderInputs} from '../../shader-inputs';
import {NumberArray3} from '@math.gl/types';

/**
 * Helper class for using the legacy picking module
 */
export class LegacyPickingManager {
  device: Device;
  framebuffer: Framebuffer | null = null;
  shaderInputs: ShaderInputs<{picking: typeof picking.props}>;

  constructor(device: Device, shaderInputs: ShaderInputs) {
    this.device = device;
    this.shaderInputs = shaderInputs as ShaderInputs<{picking: typeof picking.props}>;
  }

  destroy() {
    this.framebuffer?.destroy();
  }

  getFramebuffer() {
    if (!this.framebuffer) {
      this.framebuffer = this.device.createFramebuffer({
        colorAttachments: ['rgba8unorm'],
        depthStencilAttachment: 'depth24plus'
      });
    }
    return this.framebuffer;
  }

  /** Clear highlighted / picked object */
  clearPickState() {
    this.shaderInputs.setProps({picking: {highlightedObjectColor: null}});
  }

  /** Prepare for rendering picking colors */
  beginRenderPass() {
    const framebuffer = this.getFramebuffer();
    framebuffer.resize(this.device.getCanvasContext().getPixelSize());

    this.shaderInputs.setProps({picking: {isActive: true}});

    const pickingPass = this.device.beginRenderPass({
      framebuffer,
      clearColor: [0, 0, 0, 0],
      clearDepth: 1
    });

    return pickingPass;
  }

  updatePickState(mousePosition: [number, number]) {
    const framebuffer = this.getFramebuffer();

    // use the center pixel location in device pixel range
    const [pickX, pickY] = this.getPickPosition(mousePosition);

    // Read back
    const color255 = this.device.readPixelsToArrayWebGL(framebuffer, {
      sourceX: pickX,
      sourceY: pickY,
      sourceWidth: 1,
      sourceHeight: 1
    });
    // console.log(color255);

    // Check if we have
    let highlightedObjectColor: NumberArray3 | null = [...color255].map(
      x => x / 255
    ) as NumberArray3;
    const isHighlightActive =
      highlightedObjectColor[0] + highlightedObjectColor[1] + highlightedObjectColor[2] > 0;

    if (!isHighlightActive) {
      highlightedObjectColor = null;
    }

    this.shaderInputs.setProps({
      picking: {isActive: false, highlightedObjectColor}
    });
  }

  /**
   * Get pick position in device pixel range
   * use the center pixel location in device pixel range
   */
  getPickPosition(mousePosition: number[]): [number, number] {
    const devicePixels = this.device.getCanvasContext().cssToDevicePixels(mousePosition);
    const pickX = devicePixels.x + Math.floor(devicePixels.width / 2);
    const pickY = devicePixels.y + Math.floor(devicePixels.height / 2);
    return [pickX, pickY];
  }
}
