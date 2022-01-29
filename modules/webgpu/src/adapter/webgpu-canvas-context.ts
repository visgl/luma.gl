import type {Texture, TextureFormat, CanvasContextProps} from '@luma.gl/api';
import {CanvasContext, log} from '@luma.gl/api';
import {getWebGPUTextureFormat} from './helpers/convert-texture-format';
import WebGPUDevice from './webgpu-device';
import WEBGPUFramebuffer from './resources/webgpu-framebuffer';

/** 
 * Holds a WebGPU Canvas Context which handles resizing etc 
 */
export default class WebGPUCanvasContext extends CanvasContext {
  readonly device: WebGPUDevice;
  readonly gpuCanvasContext: GPUCanvasContext;
  readonly format: TextureFormat;
  width: number = -1;
  height: number = -1;
  depthStencilFormat: TextureFormat = 'depth24plus';
  sampleCount: number = 1;

  private depthStencilAttachment: Texture;

  constructor(device: WebGPUDevice, adapter: GPUAdapter, props: CanvasContextProps) {
    super(props);
    this.device = device;
    this.gpuCanvasContext = this.canvas.getContext('webgpu') as GPUCanvasContext;
    this.format = this.gpuCanvasContext.getPreferredFormat(adapter);
  }

  destroy() {
    this.gpuCanvasContext.unconfigure();
  }

  /** Update framebuffer with properly resized "swap chain" texture views */
  getCurrentFramebuffer(): WEBGPUFramebuffer {
    // Ensure the canvas context size is updated
    this.update();

    // Wrap the current canvas context texture in a luma.gl texture 
    const currentColorAttachment = this.device.createTexture({
      id: 'default-render-target',
      handle: this.gpuCanvasContext.getCurrentTexture(),
      format: this.format,
      width: this.width,
      height: this.height
    });

    // Resize the depth stencil attachment
    this._createDepthStencilAttachment();

    return new WEBGPUFramebuffer(this.device, {
      colorAttachments: [currentColorAttachment],
      depthStencilAttachment: this.depthStencilAttachment
    });
  }

  /** Resizes and updates render targets if necessary */
  update() {
    const [width, height] = this.getPixelSize();

    const sizeChanged = width !== this.width || height !== this.height;

    if (sizeChanged) {
      this.width = width;
      this.height = height;

      if (this.depthStencilAttachment) {
        this.depthStencilAttachment.destroy();
        this.depthStencilAttachment = undefined;
      }

      // Reconfigure the canvas size.
      // https://www.w3.org/TR/webgpu/#canvas-configuration
      this.gpuCanvasContext.configure({
        device: this.device.handle,
        format: getWebGPUTextureFormat(this.format),
        size: [this.width, this.height],
        colorSpace: this.props.colorSpace,
        compositingAlphaMode: this.props.compositingAlphaMode
      });

      log.log(1, `Resized to ${this.width}x${this.height}px`)();
    }

  }

  resize(options?: {width?: number; height?: number; useDevicePixels?: boolean | number}): void {
    this.update();
  }

  /** We build render targets on demand (i.e. not when size changes but when about to render) */
  _createDepthStencilAttachment() {
    if (!this.depthStencilAttachment) {
      this.depthStencilAttachment = this.device.createTexture({
        id: 'depth-stencil-target',
        format: this.depthStencilFormat,
        width: this.width,
        height: this.height,
        usage: GPUTextureUsage.RENDER_ATTACHMENT
      });
    }
    return this.depthStencilAttachment;
  }
}
