import type {Device, Buffer, RenderPipelineProps, RenderPass, Binding} from '@luma.gl/api';
import {RenderPipeline, Shader, cast} from '@luma.gl/api';
import type { ShaderModule } from '@luma.gl/shadertools';
import type Geometry from '../geometry/geometry';
import {getAttributeBuffersFromGeometry, getIndexBufferFromGeometry} from './model-utils';
import PipelineFactory from './pipeline-factory';

export type ModelProps = Omit<RenderPipelineProps, 'vs' | 'fs'> & {
  // Model also accepts a string
  vs?: {glsl?: string; wgsl?: string} | string;
  fs?: {glsl?: string; wgsl?: string} | string;
  modules?: ShaderModule[];
  moduleSettings?: Record<string, Record<string, any>>;
  geometry?: Geometry;
};

const DEFAULT_MODEL_PROPS: Required<ModelProps> = {
  ...RenderPipeline._DEFAULT_PROPS,
  vs: undefined,
  fs: undefined,
  id: 'unnamed',
  handle: undefined,
  userData: {},
  modules: [],
  moduleSettings: {},
  geometry: undefined
};

/** v9 API */
export default class Model {
  readonly device: Device;
  readonly pipeline: RenderPipeline;
  readonly id: string;
  readonly vs: string;
  readonly fs: string | undefined;
  readonly topology: string;
  readonly vertexCount;
  props: Required<ModelProps>;

  constructor(device: Device, props: ModelProps) {
    this.props = {...DEFAULT_MODEL_PROPS, ...props};
    props = this.props;
    this.id = props.id;
    this.device = device;

    // Create the pipeline
    this.vs = getShaderSource(this.device, props.vs);
    if (props.fs) {
      this.fs = getShaderSource(this.device, props.fs);
    }

    this.vertexCount = this.props.vertexCount;
    this.topology = this.props.topology;

    if (this.props.geometry) {
      this.vertexCount = this.props.geometry.vertexCount;
      this.topology = this.props.geometry.topology;
    }

    this.pipeline = PipelineFactory.getDefaultPipelineFactory(this.device).createRenderPipeline({
      ...this.props,
      vs: this.vs,
      fs: this.fs,
      topology: this.topology,
      parameters: props.parameters,
      // Geometry in the vertex shader!
      // @ts-expect-error
      layout: props.layout
    });


    if (this.props.geometry) {
      this._setGeometry(this.props.geometry);
    }
    this.setAttributes(this.props.attributes);
    this.setBindings(this.props.bindings);
    this.setUniforms(this.props.uniforms);
  }

  destroy(): void {
    this.pipeline.destroy();
  }

  draw(renderPass?: RenderPass) {
    this.pipeline.draw({
      renderPass,
      vertexCount: this.vertexCount,
      instanceCount: this.props.instanceCount
    });
  }

  setProps(props: ModelProps) {
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
  }

  setIndexBuffer(indices: Buffer) {
    this.pipeline.setIndexBuffer(indices);
    // this._indices = indices;
  }

  setAttributes(attributes: Record<string, Buffer>) {
    this.pipeline.setAttributes(attributes);
    Object.assign(this.props.attributes, attributes);
  }

  /** Set the bindings */
  setBindings(bindings: Record<string, Binding>): void {
    this.pipeline.setBindings(bindings);
    Object.assign(this.props.bindings, bindings);
  }

  setUniforms(uniforms: Record<string, any>): void {
    this.pipeline.setUniforms(uniforms);
    Object.assign(this.props.uniforms, uniforms);
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
function getShader(
  device: Device,
  shader: Shader | string | {glsl?: string; wgsl?: string},
  stage: 'vertex' | 'fragment'
): Shader {
  if (shader instanceof Shader) {
    return cast<Shader>(shader);
  }

  // TODO - detect WGSL/GLSL and throw an error if not supported
  if (typeof shader === 'string') {
    return device.createShader({stage, source: shader});
  }

  switch (device.info.type) {
    case 'webgpu':
      if (shader?.wgsl) {
        return device.createShader({stage, source: shader.wgsl});
      }
      throw new Error('WebGPU does not support GLSL shaders');

    default:
      if (shader?.glsl) {
        return device.createShader({stage, source: shader.glsl});
      }
      throw new Error('WebGL does not support WGSL shaders');
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
