// prettier-ignore
import {ComputePipeline, ComputePipelineProps, cast} from '@luma.gl/api';

import WebGPUDevice from '../webgpu-device';
import WebGPUShader from './webgpu-shader';

// COMPUTE PIPELINE

/** Creates a new compute pipeline when parameters change */
export default class WebGPUComputePipeline extends ComputePipeline {
  device: WebGPUDevice;
  handle: GPUComputePipeline;

  constructor(device: WebGPUDevice, props: ComputePipelineProps) {
    super(device, props);
    this.device = device;

    const module = cast<WebGPUShader>(this.props.cs).handle;
    this.handle = this.props.handle || this.device.handle.createComputePipeline({
      label: this.props.id,
      compute: {
        module,
        entryPoint: this.props.csEntryPoint,
        // constants: this.props.csConstants
      },
      layout: 'auto'
    });
  }

  /** For internal use in render passes */
  _getBindGroupLayout() {
    // TODO: Cache?
    return this.handle.getBindGroupLayout(0);
  }
}
