// luma.gl, MIT license

import {
  Device,
  Buffer,
  RenderPipelineProps,
  RenderPass,
  Binding,
  PrimitiveTopology
} from '@luma.gl/api';
import {RenderPipeline} from '@luma.gl/api';
import type {ShaderModule} from '@luma.gl/shadertools';
import type {Geometry} from '../geometry/geometry';
import {getAttributeBuffersFromGeometry, getIndexBufferFromGeometry} from './model-utils';
import {PipelineFactory} from '../lib/pipeline-factory';
import {TypedArray} from '@math.gl/core';

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
  readonly vertexCount;
  userData: {[key: string]: any} = {};

  readonly pipelineFactory: PipelineFactory;
  pipeline: RenderPipeline;

  props: Required<ModelProps>;

  private _getModuleUniforms: (props?: Record<string, Record<string, any>>) => Record<string, any>;

  constructor(device: Device, props: ModelProps) {
    this.props = {...DEFAULT_MODEL_PROPS, ...props};
    props = this.props;
    this.id = this.props.id;
    this.device = device;

    Object.assign(this.userData, this.props.userData);

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

    this.pipelineFactory =
      this.props.pipelineFactory || PipelineFactory.getDefaultPipelineFactory(this.device);
    const {pipeline, getUniforms} = this.pipelineFactory.createRenderPipeline({
      ...this.props,
      vs: this.vs,
      fs: this.fs,
      topology: this.topology,
      defines: props.defines,
      parameters: props.parameters,
      layout: props.layout
    });

    this.pipeline = pipeline;
    this._getModuleUniforms = getUniforms;

    if (this.props.geometry) {
      this._setGeometry(this.props.geometry);
    }
    this.setUniforms(this._getModuleUniforms()); // Get all default module uniforms
    this.setProps(this.props);
  }

  destroy(): void {
    this.pipelineFactory.release(this.pipeline);
  }

  draw(renderPass: RenderPass): this {
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

  // Temporary hack to support deck.gl's dependency on luma.gl v8 Model attribute API.
  _splitAttributes(
    attributes: Record<string, Buffer | TypedArray>,
    filterBuffers?: boolean
  ): {
    bufferAttributes: Record<string, Buffer>;
    constantAttributes: Record<string, TypedArray>;
    indices?: Buffer;
  } {
    const bufferAttributes: Record<string, Buffer> = {};
    const constantAttributes: Record<string, TypedArray> = {};
    const indices: Buffer | undefined = attributes.indices as Buffer;

    delete attributes.indices;

    for (const name in attributes) {
      let attribute = attributes[name];

      if (attribute instanceof Buffer) {
        bufferAttributes[name] = attribute;
        continue;
      }

      // The `getValue` call provides support for deck.gl `Attribute` class
      // TODO - remove once deck refactoring completes
      // @ts-ignore
      if (attribute.getValue) {
        // @ts-ignore
        attribute = attribute.getValue();
      }

      if (ArrayBuffer.isView(attribute) && !attribute) {
        constantAttributes[name] = attribute as unknown as TypedArray;
        continue;
      }

      // @ts-ignore
      if (filterBuffers && attribute[name]._buffer) {
        // @ts-ignore
        buffer[name] = attribute[name]._buffer;
      }
    }

    return {bufferAttributes, constantAttributes, indices};
  }

  setAttributes(attributes: Record<string, Buffer | TypedArray>, filterBuffers?: boolean): void {
    const {bufferAttributes, constantAttributes, indices} = this._splitAttributes(attributes, filterBuffers);

    // Temporary HACK since deck.gl v9 sets indices as part of attributes
    if (indices) {
      this.setIndexBuffer(indices);
      console.warn('luma.gl: indices should not be part of attributes');
    }

    this.pipeline.setAttributes(bufferAttributes);
    // TODO - WebGL only. We may have to allocate buffers on WebGPU
    this.pipeline.setConstantAttributes(constantAttributes);

    Object.assign(this.props.attributes, bufferAttributes, constantAttributes);
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
