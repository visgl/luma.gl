// prettier-ignore
import {
  Parameters,
  Buffer, BufferProps,
  Resource, ResourceProps,
  Shader,
  RenderPipeline, RenderPipelineProps, Binding
} from '@luma.gl/api';
import {Program} from '@luma.gl/webgl';
import WebGLDevice from '../webgl-device';

// import {getRenderPipelineDescriptor} from '../converters/convert-parameters';
// import {mapAccessorToWebGPUFormat} from '../helpers/accessor-to-format';
// import type {BufferAccessors} from './webgpu-pipeline';

/** Creates a new render pipeline when parameters change */
export default class WEBGLRenderPipeline extends RenderPipeline {
  device: WebGLDevice;
  handle: WebGLProgram;
  program: Program;
  parameters: Parameters;

  constructor(device: WebGLDevice, props: RenderPipelineProps) {
    super(device, props);
    this.device = device;
    this.handle = this.props.handle || this.createHandle();
    this.parameters = this.props.parameters;
  }

  protected createHandle(): RenderPipeline {
    this.program = new Program(this.device.gl, {
      id: this.props.id,
      vs: this.props.vs,
      fs: this.props.fs
    });
    return this.program.handle;
  }

  setAttributes(attributes: Record<string, Buffer>): void {}
  setBindings(bindings: Record<string, Binding>): void {}
}

// COMPUTE PIPELINE

// @ts-expect-error
const DEFAULT_COMPUTE_PIPELINE_PROPS: Required<RenderPipelineProps> = {
  id: undefined,
  handle: undefined,
  userData: {},
  // byteLength: 0,
  // usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
  // mappedAtCreation: true
};
