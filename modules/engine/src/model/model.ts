// luma.gl, MIT license

import {
  Device,
  Buffer,
  RenderPipelineProps,
  RenderPass,
  Binding,
  PrimitiveTopology,
  log
} from '@luma.gl/core';
import {RenderPipeline} from '@luma.gl/core';
import type {ShaderModule} from '@luma.gl/shadertools';
import type {Geometry} from '../geometry/geometry';
import {getAttributeBuffersFromGeometry, getIndexBufferFromGeometry} from './model-utils';
import {PipelineFactory} from '../lib/pipeline-factory';
import {TypedArray} from '@math.gl/core';

/** @todo import type */
type UniformValue = unknown;

export type ModelProps = Omit<RenderPipelineProps, 'vs' | 'fs'> & {
  // Model also accepts a string
  vs?: {glsl?: string; wgsl?: string} | string | null;
  fs?: {glsl?: string; wgsl?: string} | string | null;
  defines?: Record<string, string | number | boolean>;
  modules?: ShaderModule[];
  moduleSettings?: Record<string, Record<string, any>>;
  geometry?: Geometry | null;
  /** deprecated pipeline factory to use to create renderpipelines */
  pipelineFactory?: PipelineFactory;
};

const DEFAULT_MODEL_PROPS: Required<ModelProps> = {
  ...RenderPipeline._DEFAULT_PROPS,
  vs: null,
  fs: null,
  id: 'unnamed',
  handle: undefined,
  userData: {},
  defines: {},
  modules: [],
  moduleSettings: {},
  geometry: null,
  pipelineFactory: undefined
};

/** v9 API */
export class Model {
  readonly device: Device;
  readonly id: string;
  readonly vs: string;
  readonly fs: string | null = null;
  readonly topology: PrimitiveTopology;
  readonly pipelineFactory: PipelineFactory;
  /** The underlying GPU "program". @note May be recreated if parameters change */
  pipeline: RenderPipeline;
  userData: {[key: string]: any} = {};

  // readonly props: Required<ModelProps>;

  /** Vertex count */
  vertexCount: number;
  /** instance count */
  instanceCount: number = 0;
  /** Buffer-valued attributes */
  bufferAttributes: Record<string, Buffer> = {};
  /** Constant-valued attributes */
  constantAttributes: Record<string, TypedArray> = {};
  /** Bindings (textures, samplers, uniform buffers) */
  bindings: Record<string, Binding> = {};
  /** Uniforms */
  uniforms: Record<string, UniformValue> = {};

  private _getModuleUniforms: (props?: Record<string, Record<string, any>>) => Record<string, any>;

  constructor(device: Device, props: ModelProps) {
    props = {...DEFAULT_MODEL_PROPS, ...props};
    this.id = props.id;
    this.device = device;

    Object.assign(this.userData, props.userData);

    // Create the pipeline
    if (!props.vs) {
      throw new Error('no vertex shader');
    }
    this.vs = getShaderSource(this.device, props.vs);
    if (props.fs) {
      this.fs = getShaderSource(this.device, props.fs);
    }

    this.vertexCount = props.vertexCount;
    this.instanceCount = props.instanceCount;
    this.topology = props.topology;

    if (props.geometry) {
      this.vertexCount = props.geometry.vertexCount;
      this.topology = props.geometry.topology || 'triangle-list';
    }

    this.pipelineFactory =
      props.pipelineFactory || PipelineFactory.getDefaultPipelineFactory(this.device);
    const {pipeline, getUniforms} = this.pipelineFactory.createRenderPipeline({
      ...props,
      vs: this.vs,
      fs: this.fs,
      topology: this.topology,
      defines: props.defines,
      parameters: props.parameters,
      layout: props.layout
    });

    this.pipeline = pipeline;
    this._getModuleUniforms = getUniforms;

    if (props.geometry) {
      this._setGeometry(props.geometry);
    }

    this.setUniforms(this._getModuleUniforms()); // Get all default module uniforms

    // Props can update any of the above, so call setProps last.
    this.setProps(props);
  }

  destroy(): void {
    this.pipelineFactory.release(this.pipeline);
  }

  draw(renderPass: RenderPass): void {
    this.pipeline.draw({
      renderPass,
      vertexCount: this.vertexCount,
      instanceCount: this.instanceCount
    });
  }

  setProps(props: ModelProps): void {
    if (props.indices) {
      this.setIndexBuffer(props.indices);
    }
    if (props.attributes) {
      this.setAttributes(props.attributes);
    }
    if (props.bindings) {
      this.setBindings(props.bindings);
    }
    if (props.uniforms) {
      this.setUniforms(props.uniforms);
    }
    if (props.moduleSettings) {
      this.updateModuleSettings(props.moduleSettings);
    }
  }

  updateModuleSettings(props: Record<string, any>): void {
    const uniforms = this._getModuleUniforms(props);
    this.setUniforms(uniforms);
  }

  setIndexBuffer(indices: Buffer): void {
    this.pipeline.setIndexBuffer(indices);
    // this._indices = indices;
  }

  setAttributes(bufferAttributes: Record<string, Buffer>): void {
    if (bufferAttributes.indices) {
      log.warn(`Model:${this.id} setAttributes() - indices should be set using setIndexBuffer()`);
    }

    this.pipeline.setAttributes(bufferAttributes);
    Object.assign(this.bufferAttributes, bufferAttributes);
  }

  setConstantAttributes(constantAttributes: Record<string, TypedArray>): void {
    // TODO - this doesn't work under WebGPU, we'll need to create buffers or inject uniforms
    this.pipeline.setConstantAttributes(constantAttributes);
    Object.assign(this.constantAttributes, constantAttributes);
  }

  /** Set the bindings */
  setBindings(bindings: Record<string, Binding>): void {
    this.pipeline.setBindings(bindings);
    Object.assign(this.bindings, bindings);
  }

  setUniforms(uniforms: Record<string, any>): void {
    this.pipeline.setUniforms(uniforms);
    Object.assign(this.uniforms, uniforms);
  }

  _setGeometry(geometry: Geometry): void {
    // this._deleteGeometryBuffers();

    const geometryBuffers = getAttributeBuffersFromGeometry(this.device, geometry);
    this.setAttributes(geometryBuffers);

    const indexBuffer = getIndexBufferFromGeometry(this.device, geometry);
    if (indexBuffer) {
      this.setIndexBuffer(indexBuffer);
    }
  }
}

/** Create a shader from the different overloads */
function getShaderSource(device: Device, shader: string | {glsl?: string; wgsl?: string}): string {
  // TODO - detect WGSL/GLSL and throw an error if not supported
  if (typeof shader === 'string') {
    return shader;
  }

  switch (device.info.type) {
    case 'webgpu':
      if (shader?.wgsl) {
        return shader.wgsl;
      }
      throw new Error('WebGPU does not support GLSL shaders');

    default:
      if (shader?.glsl) {
        return shader.glsl;
      }
      throw new Error('WebGL does not support WGSL shaders');
  }
}
