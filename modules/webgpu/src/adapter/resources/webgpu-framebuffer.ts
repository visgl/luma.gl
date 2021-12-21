import WebGPUDevice from "../webgpu-device";

export type FramebufferProps = { // ResourceProps & {
  width: number;
  height: number;
  attachments?: Record<string, any>;
  readBuffer?: number;
  drawBuffers?: number[];
  check?: boolean;
};

export class WebGPUFramebuffer {
  readonly device: WebGPUDevice;
  renderPassDescriptor: GPURenderPassDescriptor;

  constructor(device: WebGPUDevice, props: FramebufferProps) {
    this.device = device;

    const depthTexture = this.device.createTexture({
      id: "depth-stencil",
      width: props.width,
      height: props.height,
      depth: 1,
      format: "depth24plus",
      usage: GPUTextureUsage.RENDER_ATTACHMENT
    });

    const depthStencilAttachment = depthTexture.handle.createView();
    depthStencilAttachment.label = 'depth-stencil-attachment';

    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [{
        // @ts-expect-error
        attachment: undefined, // Assigned later
        loadValue: { r: 0.5, g: 0.5, b: 0.5, a: 1.0 },
      }],

      depthStencil: {
        attachment: depthStencilAttachment,
        depthLoadValue: 1.0,
        depthStoreOp: "store",
        // stencilLoadValue: 0,
        // stencilStoreOp: "store",
      }
    };


  }


}