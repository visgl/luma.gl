import type {FramebufferProps} from '@luma.gl/api';
import {Framebuffer} from '@luma.gl/api';
import {WebGPUDevice} from '../webgpu-device';

/**
 * Create new textures with correct size for all attachments.
 * @note resize() destroys existing textures (if size has changed).
 */
export class WebGPUFramebuffer extends Framebuffer {
  readonly device: WebGPUDevice;

  constructor(device: WebGPUDevice, props: FramebufferProps) {
    super(device, props);
    this.device = device;

    // Auto create textures for attachments if needed
    this.autoCreateAttachmentTextures();
  }
}
