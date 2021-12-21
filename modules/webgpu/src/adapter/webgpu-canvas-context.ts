import type {TextureFormat, CanvasContextProps} from '@luma.gl/api';
import {CanvasContext} from '@luma.gl/api';

/** 
 * Holds a WebGPU Canvas Context which handles resizing etc 
 */
export default class WebGPUCanvasContext extends CanvasContext {
  readonly device: GPUDevice;
  readonly context: GPUCanvasContext;
  readonly presentationFormat: TextureFormat;
  presentationSize: [number, number];
  depthStencilFormat: TextureFormat = 'depth24plus';
  sampleCount: number = 1;

  renderTarget: GPUTexture;
  depthStencilTarget: GPUTexture
  depthStencilView: GPUTextureView;

  constructor(device: GPUDevice, adapter: GPUAdapter, props: CanvasContextProps) {
    super(props);
    this.device = device;
    this.context = this.canvas.getContext('webgpu');
    this.presentationFormat = this.context.getPreferredFormat(adapter);
    this.presentationSize = [-1, -1];
    this.update();
  }

  /**  */
  getRenderTargets() {
    return {
      colorAttachment: this.context.getCurrentTexture().createView(),
      depthStencil: this.depthStencilView
    };
  }

  /** Resizes and updates render targets if necessary */
  update() {
    const size = this.getPixelSize();

    const sizeChanged = size[0] !== this.presentationSize[0] || size[1] !== this.presentationSize[1];

    if (sizeChanged) {
      this.presentationSize = size;

      // Reconfigure the canvas size.
      this.context.configure({
        device: this.device,
        format: this.presentationFormat,
        size: this.presentationSize,
      });

      // Destroy the previous render targets
      if (this.renderTarget !== undefined) {
        this.renderTarget.destroy();
      }

      if (this.depthStencilTarget !== undefined) {
        this.renderTarget.destroy();
      }

      this.renderTarget = this.device.createTexture({
        size: this.presentationSize,
        sampleCount: this.sampleCount,
        format: this.presentationFormat,
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
      });

      this.depthStencilTarget = this.device.createTexture({
        size: this.presentationSize,
        format: this.depthStencilFormat,
        usage: GPUTextureUsage.RENDER_ATTACHMENT
      });
  
      this.depthStencilView = this.depthStencilTarget.createView();
      this.depthStencilView.label = 'depth-stencil-attachment';  
    }
  }
}
