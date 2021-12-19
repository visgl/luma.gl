/// <reference types="@webgpu/types" />

import {RenderPipeline, RenderPipelineProps, cast } from '@luma.gl/api';

import WebGPUDevice from './webgpu-device';

import {getRenderPipelineDescriptor} from './helpers/webgpu-parameters';
// import {mapAccessorToWebGPUFormat} from './helpers/accessor-to-format';
import {WebGPUShader} from '..';
// import type {BufferAccessors} from './webgpu-pipeline';

// BIND GROUP LAYOUTS

type Binding = {
  binding: number;
  visibility: number;

  buffer?: {
    type?: 'uniform' | 'storage' | 'read-only-storage';
    hasDynamicOffset?: false;
    minBindingSize?: number;
  };
  sampler?: {
    type?: 'filtering' | 'non-filtering' | 'comparison';
  };
  texture?: {
    viewDimension?: '1d' | '2d' | '2d-array' | 'cube' | 'cube-array' | '3d';
    sampleType?: 'float' | 'unfilterable-float' | 'depth' | 'sint' | 'uint';
    multisampled?: boolean;
  };
  storageTexture?: {
    viewDimension?: '1d' | '2d' | '2d-array' | 'cube' | 'cube-array' | '3d';
    access: 'read-only' | 'write-only';
    format: string;
  };
};


// RENDER PIPELINE

/** Creates a new render pipeline when parameters change */
export default class WebGPURenderPipeline extends RenderPipeline {
  device: WebGPUDevice;
  handle: GPURenderPipeline;

  constructor(device: WebGPUDevice, props: RenderPipelineProps) {
    super(device, props);
    this.device = device;
    this.handle = this.props.handle as GPURenderPipeline || this.createHandle();
    this.handle.label = this.props.id;
  }

  protected createHandle(): GPURenderPipeline {
    if (this.props.handle) {
      return this.props.handle;
    }

    const vertex: GPUVertexState = {
      module: cast<WebGPUShader>(this.props.vertexShader).handle,
      entryPoint: this.props.vertexShaderEntryPoint || 'main'
    };

    let fragment: GPUFragmentState | undefined;
    if (this.props.fragmentShader) {
      fragment = {
        module: cast<WebGPUShader>(this.props.fragmentShader).handle,
        entryPoint: this.props.fragmentShaderEntryPoint || 'main',
        targets: [
          {
            format: this.device.presentationFormat,
          }
        ]
      };
    }

    const descriptor: GPURenderPipelineDescriptor = {
      vertex,
      fragment,
      primitive: {
        topology: this.props.primitiveTopology
      }

      // WebGPU spec seems updated
      // primitive: {
      //   topology: this.props.primitiveTopology
      // },

    };

    // const ceDescriptor: GPUCommandEncoderDescriptor;
    // const commandEncoder = this.device.handle.createCommandEncoder({
    //   // label
    //   // measureExecutionTime
    // });

    getRenderPipelineDescriptor(this.props.parameters, descriptor);

    const renderPipeline = this.device.handle.createRenderPipeline(descriptor);
    return renderPipeline;
  }

  destroy() {
    // this.handle.destroy();
  }

  /** For internal use in render passes */
  _getBindGroupLayout() {
    // TODO: Cache
    return this.handle.getBindGroupLayout(0);
  }
}

// PIPELINE

/*
export class WebGPUPipeline<Props> extends WebGPUResource<Props> implements Pipeline {
  device: WebGPUDevice;

  protected needsRebuild = true;

  constructor(device: WebGPUDevice, props: WebGPUPipelineProps) {
    super(props, DEFAULT_PIPELINE_PROPS);
    const {
      vs,
      fs,
      primitiveTopology,
      parameters,
      bufferAccessors
    } = this.props;

    // this.vs = vs;
    // this.fs = fs;
    // this.drawMode = primitiveTopology;
    // this.parameters = parameters;
    // this.bufferAccessors = bufferAccessors;

    this.createIfNeeded();
  }

  setProps(props) {
    // if ('vs' in props && props.vs !== this.vs) {
    //   this.vs = props.vs;
    //   this.needsRebuild = true;
    // }
    // if ('fs' in props && props.fs !== this.fs) {
    //   this.needsRebuild = true;
    // }
  }

  createIfNeeded(): GPUPipelineBase {
    // GPURenderPipelineDescriptor
    if (this.needsRebuild) {
      this.handle = this._createPipeline();
      this.needsRebuild = false;
    }
    return this.pipeline;
  }

  destroy(): void {
    this.handle.destroy();
  }

  _createPipeline(): GPUPipelineBase {
    primitiveTopology: "triangle-list",

    colorStates: [
      {
        format: swapChainFormat,
      },
    ],

    const vertexState = {
      vertexBuffers: getVertexBuffers(this.bufferAccessors)
    };
  }
}

export class ComputePipeline {
  constructor(device, {
  }) {
    // GPUComputePipelineDescriptor
  }
}
*/
