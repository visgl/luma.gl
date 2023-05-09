import type {FramebufferProps, ColorTextureFormat} from '@luma.gl/api';
import {Framebuffer, Texture} from '@luma.gl/api';
import {WebGPUDevice} from '../webgpu-device';
// import WebGPUCanvasContext from '../webgpu-canvas-context';
import WEBGPUTexture from './webgpu-texture';
import WebGPUTexture from './webgpu-texture';

// const DEFAULT_DEPTH_STENCIL_FORMAT: DepthStencilTextureFormat = 'depth24plus';

// const MAX_COLOR_ATTACHMENTS = 8;

/**
 * Create new textures with correct size for all attachments. 
 * @note resize() destroys existing textures (if size has changed). 
 */
export default class WebGPUFramebuffer extends Framebuffer {
  readonly device: WebGPUDevice;

  colorAttachments: WebGPUTexture[] = [];
  depthStencilAttachment: WebGPUTexture | null = null;

  /** Partial render pass descriptor. Used by WebGPURenderPass */
  renderPassDescriptor: {
    colorAttachments: GPURenderPassColorAttachment[];
    depthStencilAttachment?: GPURenderPassDepthStencilAttachment;
  } = {
    colorAttachments: []
  };

  constructor(device: WebGPUDevice, props: FramebufferProps) {
    super(device, props);
    this.device = device;

    if (props.depthStencilAttachment) {
      this.depthStencilAttachment = this.createDepthStencilTexture(props);
    }

    if (props.colorAttachments) {
      this.colorAttachments = props.colorAttachments.map(colorAttachment => this.createColorTexture(this.props, colorAttachment));
    }

    if (this.depthStencilAttachment) {
      this.renderPassDescriptor.depthStencilAttachment = {
        view: this.depthStencilAttachment.handle.createView(),
        // Add default clear values
        depthClearValue: 1.0,
        depthStoreOp: 'store',
        stencilClearValue: 0,
        stencilStoreOp: 'store',
      }
    }

    if (this.colorAttachments.length > 0) {
      this.renderPassDescriptor.colorAttachments = this.colorAttachments.map(colorAttachment => ({
        view: colorAttachment.handle.createView(),
        loadOp: 'clear',
        loadValue: [0.0, 0.0, 0.0, 0.0],
        storeOp: 'store'
      }));
    }
  }

  /** Create depth stencil texture */
  private createDepthStencilTexture(props: FramebufferProps): WEBGPUTexture {
    if (props.depthStencilAttachment instanceof WEBGPUTexture) {
      return props.depthStencilAttachment;
    }

    if (typeof props.depthStencilAttachment === 'string') {
      return this.device._createTexture({
        id: 'depth-stencil-attachment',
        format: props.depthStencilAttachment,
        width: props.width,
        height: props.height,
        usage: Texture.RENDER_ATTACHMENT
      });
    }

    throw new Error('type');
  }

  private createColorTexture(props: FramebufferProps, texture: Texture | ColorTextureFormat): WEBGPUTexture {
    if (texture instanceof WEBGPUTexture) {
      return texture;
    }

    if (typeof texture === 'string') {
      return this.device._createTexture({
        id: 'color-attachment',
        format: texture,
        width: props.width,
        height: props.height,
        usage: Texture.RENDER_ATTACHMENT
      });
    }

    throw new Error('type');
  }

  /**
   * Create new textures with correct size for all attachments.
   * @note destroys existing textures.
   */
  protected _resizeAttachments(width: number, height: number): void {
    for (let i = 0; i < this.colorAttachments.length; ++i) {
      if (this.colorAttachments[i]) {
        const resizedTexture = this.device._createTexture({...this.colorAttachments[i].props, width, height})
        this.colorAttachments[i].destroy();
        this.colorAttachments[i] = resizedTexture;
        this.renderPassDescriptor.colorAttachments[i].view = resizedTexture.handle.createView();
      }
    }

    if (this.depthStencilAttachment) {
      const resizedTexture = this.device._createTexture({...this.depthStencilAttachment.props, width, height})
      this.depthStencilAttachment.destroy();
      this.depthStencilAttachment = resizedTexture;
      this.renderPassDescriptor.depthStencilAttachment.view = resizedTexture.handle.createView();
    }
  }
}
