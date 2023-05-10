// luma.gl, MIT license

import type {Device, Buffer, RenderPipelineProps, RenderPass, Binding, PrimitiveTopology} from '@luma.gl/api';
import {RenderPipeline} from '@luma.gl/api';
import type { ShaderModule } from '@luma.gl/shadertools';
import type {Geometry} from '../geometry/geometry';
import {getAttributeBuffersFromGeometry, getIndexBufferFromGeometry} from './model-utils';
import {PipelineFactory} from './pipeline-factory';

export type ModelProps = Omit<RenderPipelineProps, 'vs' | 'fs'> & {
  // Model also accepts a string
  vs?: {glsl?: string; wgsl?: string} | string | null;
  fs?: {glsl?: string; wgsl?: string} | string | null;
  modules?: ShaderModule[];
  moduleSettings?: Record<string, Record<string, any>>;
  geometry?: Geometry | null;
};

const DEFAULT_MODEL_PROPS: Required<ModelProps> = {
  ...RenderPipeline._DEFAULT_PROPS,
  vs: null,
  fs: null,
  id: 'unnamed',
  handle: undefined,
  userData: {},
  modules: [],
  moduleSettings: {},
  geometry: null
};

/** v9 API */
export class Model {
  readonly device: Device;
  readonly pipeline: RenderPipeline;
  readonly id: string;
  readonly vs: string;
  readonly fs: string | null = null;
  readonly topology: PrimitiveTopology;
  readonly vertexCount;
  props: Required<ModelProps>;

  private _getModuleUniforms: (props?: Record<string, Record<string, any>>) => Record<string, any>;

  constructor(device: Device, props: ModelProps) {
    this.props = {...DEFAULT_MODEL_PROPS, ...props};
    props = this.props;
    this.id = this.props.id;
    this.device = device;

    // Create the pipeline
    if (!props.vs) {
      throw new Error('no vertex shader');
    }
    this.vs = getShaderSource(this.device, props.vs);
    if (props.fs) {
      this.fs = getShaderSource(this.device, props.fs);
    }

    this.vertexCount = this.props.vertexCount;
    this.topology = this.props.topology;

    if (this.props.geometry) {
      this.vertexCount = this.props.geometry.vertexCount;
      this.topology = this.props.geometry.topology || 'triangle-list';
    }

    const pipelineFactory = PipelineFactory.getDefaultPipelineFactory(this.device);
    const {pipeline, getUniforms} = pipelineFactory.createRenderPipeline({
      ...this.props,
      vs: this.vs,
      fs: this.fs,
      topology: this.topology,
      parameters: props.parameters,
      layout: props.layout
    });

    this.pipeline = pipeline;
    this._getModuleUniforms = getUniforms;

    if (this.props.geometry) {
      this._setGeometry(this.props.geometry);
    }
    this.setUniforms(this._getModuleUniforms()) // Get all default module uniforms
    this.setProps(this.props);
  }

  destroy(): void {
    this.pipeline.destroy();
  }

  draw(renderPass?: RenderPass): this {
    this.pipeline.draw({
      renderPass,
      vertexCount: this.vertexCount,
      instanceCount: this.props.instanceCount
    });
    return this;
  }

  setProps(props: ModelProps): this {
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
    return this;
  }

  updateModuleSettings(props: Record<string, any>): this {
    const uniforms = this._getModuleUniforms(props);
    this.setUniforms(uniforms);
    return this;
  }

  setIndexBuffer(indices: Buffer): this {
    this.pipeline.setIndexBuffer(indices);
    // this._indices = indices;
    return this;
  }

  setAttributes(attributes: Record<string, Buffer>): this {
    this.pipeline.setAttributes(attributes);
    Object.assign(this.props.attributes, attributes);
    return this;
  }

  /** Set the bindings */
  setBindings(bindings: Record<string, Binding>): this {
    this.pipeline.setBindings(bindings);
    Object.assign(this.props.bindings, bindings);
    return this;
  }

  setUniforms(uniforms: Record<string, any>): this {
    this.pipeline.setUniforms(uniforms);
    Object.assign(this.props.uniforms, uniforms);
    return this;
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
