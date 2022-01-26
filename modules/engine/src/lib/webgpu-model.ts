/*
import type {
  Device,
  Buffer,
  RenderPipelineProps,
  RenderPipelineParameters,
  RenderPass,
  PrimitiveTopology,
  Binding
} from '@luma.gl/api';
import {Shader, assert, cast, log, RenderPipeline} from '@luma.gl/api';
import {WebGPUShader} from '..';
import WebGPUDevice from '../adapter/webgpu-device';
import WebGPUBuffer from '../adapter/resources/webgpu-buffer';
import WebGPURenderPipeline from '../adapter/resources/webgpu-render-pipeline';
import WebGPURenderPass from '../adapter/resources/webgpu-render-pass';

export type ModelProps = Omit<RenderPipelineProps, 'vs' | 'fs'> & {
  // Model also accepts a string
  vs?: {glsl?: string; wgsl?: string} | Shader | string;
  fs?: {glsl?: string; wgsl?: string} | Shader | string;
  pipeline?: RenderPipeline;
};

const DEFAULT_MODEL_PROPS: Required<ModelProps> = {
  id: 'unnamed',
  handle: undefined,
  userData: {},

  ...RenderPipeline._DEFAULT_PROPS,
  vs: undefined,
  vsEntryPoint: undefined,
  vsConstants: undefined,
  fs: undefined,
  fsEntryPoint: undefined,
  fsConstants: undefined,
  pipeline: undefined,
  layout: {attributes: [], bindings: []},

  topology: 'triangle-list',
  // targets:

  vertexCount: 0,
  instanceCount: 1,
  parameters: {},

  attributes: {},
  bindings: {}
};

export default class Model {
  device: WebGPUDevice;
  pipeline: WebGPURenderPipeline;
  vs: WebGPUShader;
  fs: WebGPUShader | undefined;
  props: Required<ModelProps>;

  _bindGroup: GPUBindGroup;

  constructor(device: Device, props: ModelProps) {
    this.props = {...DEFAULT_MODEL_PROPS, ...props};
    props = this.props;
    this.device = cast<WebGPUDevice>(device);

    // Create the pipeline
    if (props.pipeline) {
      this.pipeline = cast<WebGPURenderPipeline>(props.pipeline);
    } else {
      this.vs = getShader(this.device, props.vs, 'vertex');
      if (props.fs) {
        this.fs = getShader(this.device, props.fs, 'fragment');
      }

      this.pipeline = this.device.createRenderPipeline({
        ...this.props,
        vs: this.vs,
        fs: this.fs,
        topology: props.topology,
        parameters: props.parameters,
        // Geometry in the vertex shader!
        layout: props.layout
      });
    }

    this.setAttributes(this.props.attributes);
    this.setBindings(this.props.bindings);
  }

  destroy(): void {
    // this.pipeline.destroy();
  }

  draw(renderPass?: RenderPass) {
    renderPass = renderPass || this.device.getDefaultRenderPass();
    const webgpuRenderPass = cast<WebGPURenderPass>(renderPass);
    webgpuRenderPass.handle.setPipeline(this.pipeline.handle);

    this._setAttributeBuffers(renderPass);

    // Set up bindings (uniform buffers, textures etc)
    if (this.pipeline._getBindGroup()) {
      // @ts-expect-error TODO model must not depend on webgpu
      renderPass.handle.setBindGroup(0, this.pipeline._getBindGroup());
    }

    // @ts-expect-error TODO model must not depend on webgpu
    renderPass.handle.draw(this.props.vertexCount, this.props.instanceCount, 0, 0); // firstVertex, firstInstance);
  }

  setProps(props: ModelProps) {
    if (props.attributes) {
      this.setAttributes(props.attributes);
    }
    // if (props.indices) {
    //   this.setIndices(props.indices);
    // }
    if (props.bindings) {
      this.setAttributes(props.bindings);
    }
  }

  setInd(indices) {
    // this.pipeline.setIndices(indices)
    // this._indices = indices;
  }

  setAttributes(attributes) {
    this.pipeline.setAttributes(attributes);
    Object.assign(this.props.attributes, attributes);
  }

  /** Set the bindings *
  setBindings(bindings: Record<string, Binding>): void {
    this.pipeline.setBindings(bindings);
    Object.assign(this.props.bindings, bindings);
  }

  _setAttributeBuffers(renderPass: RenderPass) {
    const webgpuRenderPass = cast<WebGPURenderPass>(renderPass);
    const buffers = this.pipeline._getBuffers();
    for (let i = 0; i < buffers.length; ++i) {
      const buffer = cast<WebGPUBuffer>(buffers[i]);
      webgpuRenderPass.handle.setVertexBuffer(i, buffer.handle);
    }
    /*
    for (const [bufferName, attributeMapping] of Object.entries(this.props.bufferMap)) {
      const buffer = cast<WebGPUBuffer>(this.props.attributes[bufferName]);
      if (!buffer) {
        log.warn(`Missing buffer for buffer map ${bufferName}`)();
        continue;
      }

      if ('location' in attributeMapping) {
        // @ts-expect-error TODO model must not depend on webgpu
        renderPass.handle.setVertexBuffer(layout.location, buffer.handle);
      } else {
        for (const [bufferName, mapping] of Object.entries(attributeMapping)) {
          // @ts-expect-error TODO model must not depend on webgpu
          renderPass.handle.setVertexBuffer(field.location, buffer.handle);
        }
      }
    }
    *
  }

  /*
  setUniformBuffer(binding, buffer, byteOffset, byteLength) {
    this._bindings[binding] = {binding, resource: {buffer, offset: byteOffset, size: byteLength}};
  }

  setUniformTexture(binding, textureView) {
    this._bindings[binding] = {binding, resource: textureView};
  }

  setUniformSampler(binding, sampler) {
    this._bindings[binding] = {binding, resource: sampler};
  }
  *
}

/** Create a shader from the different overloads *
function getShader(
  device: WebGPUDevice,
  shader: Shader | string | {glsl?: string; wgsl?: string},
  stage: 'vertex' | 'fragment'
): WebGPUShader {
  if (shader instanceof Shader) {
    return cast<WebGPUShader>(shader);
  }
  if (typeof shader === 'string') {
    return new WebGPUShader(device, {stage, source: shader});
  }
  if (shader?.wgsl) {
    return new WebGPUShader(device, {stage, source: shader.wgsl});
  }
  throw new Error('WebGPU GLSL support not implemented');
}
*/