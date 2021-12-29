import type {FramebufferProps, TextureFormat, DepthStencilTextureFormat} from '@luma.gl/api';
import {Framebuffer, cast} from '@luma.gl/api';
import WebGPUDevice from '../webgpu-device';
// import WebGPUCanvasContext from '../webgpu-canvas-context';
import WEBGPUTexture from './webgpu-texture';
import WebGPUTexture from './webgpu-texture';

const DEFAULT_DEPTH_STENCIL_FORMAT: DepthStencilTextureFormat = 'depth24plus';

// TEST CODE
function f(device: WebGPUDevice) {
  // A standard default framebuffer
  // const defaultFramebuffer = device.createFramebuffer({canvasContext, depth: true, clearColor: });
  // const framebuffer2 = device.createFramebuffer({width, height});
  //   depthStencil: {
  //     Format:
  //   })
  // }
}

const MAX_COLOR_ATTACHMENTS = 8;

/**
 * Create new textures with correct size for all attachments. 
 * @note resize() destroys existing textures (if size has changed). 
 */
export default class WebGPUFramebuffer extends Framebuffer {
  readonly device: WebGPUDevice;

  colorTextures: WebGPUTexture[] = [];
  depthStencilTexture: WebGPUTexture;

  /** Partial render pass descriptor. Used by WebGPURenderPass */
  renderPassDescriptor: {
    colorAttachments: GPURenderPassColorAttachment[];
    depthStencilAttachment?: GPURenderPassDepthStencilAttachment;
  };

  constructor(device: WebGPUDevice, props: FramebufferProps) {
    super(props);
    this.device = device;

    if (props.depthStencilAttachment) {
      this.depthStencilTexture = this.createDepthStencilTexture(props);

      this.renderPassDescriptor.depthStencilAttachment = {
        view: this.depthStencilTexture.handle.createView(),
        depthLoadValue: 1.0,
        depthStoreOp: 'store',
        stencilLoadValue: 0,
        stencilStoreOp: 'store',
      }
    }
  }

  /** 
   * Create new textures with correct size for all attachments. 
   * @note destroys existing textures. 
   */
  protected _resize(width: number, height: number): void {
    for (let i = 0; i < MAX_COLOR_ATTACHMENTS; ++i) {
      if (this.colorTextures[i]) {
        const resizedTexture = this.device.createTexture({...this.colorTextures[i].props, width, height})
        this.colorTextures[i].destroy();
        this.colorTextures[i] = resizedTexture;
        this.renderPassDescriptor.colorAttachments[i].view = resizedTexture.handle.createView();
      }
    }

    if (this.depthStencilTexture) {
       const resizedTexture = this.device.createTexture({...this.depthStencilTexture.props, width, height})
       this.depthStencilTexture.destroy();
       this.depthStencilTexture = resizedTexture;
       this.renderPassDescriptor.depthStencilAttachment.view = resizedTexture.handle.createView();
    }
  }

  /** Create depth stencil texture */
  private createDepthStencilTexture(props: FramebufferProps): WEBGPUTexture {
    if (props.depthStencilAttachment instanceof WEBGPUTexture) {
      return props.depthStencilAttachment;
    }

    let format;
    if (typeof props.depthStencilAttachment === 'string') {
      format = props.depthStencilAttachment;
    } else if (props.depthStencilAttachment === true) {
      format = DEFAULT_DEPTH_STENCIL_FORMAT;
    }

    const depthTexture = this.device.createTexture({
      id: 'depth-stencil',
      width: props.width,
      height: props.height,
      depth: 1,
      format,
      usage: GPUTextureUsage.RENDER_ATTACHMENT
    });

    return depthTexture;
  }

  private createDefaultAttachments(props: FramebufferProps) {
    const depthTexture = this.device.createTexture({
      id: 'depth-stencil',
      width: props.width,
      height: props.height,
      depth: 1,
      format: 'depth24plus',
      usage: GPUTextureUsage.RENDER_ATTACHMENT
    });

    const depthStencilAttachment = depthTexture.handle.createView();
    depthStencilAttachment.label = 'depth-stencil-attachment';

    this.renderPassDescriptor = {
      // @ts-expect-error `view` field is assigned later
      colorAttachments: [{
        view: undefined, //  Assigned later
        loadValue: { r: 0.5, g: 0.5, b: 0.5, a: 1.0 },
      }],

    }
  }

}
