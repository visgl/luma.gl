// luma.gl, MIT license

import type {TypedArray, RenderPipelineProps, RenderPipelineParameters, BufferLayout} from '@luma.gl/core';
import type {Binding, UniformValue, PrimitiveTopology} from '@luma.gl/core';
import {Device, Buffer, RenderPipeline, RenderPass, log, uid, deepEqual} from '@luma.gl/core';
import type {ShaderModule, PlatformInfo} from '@luma.gl/shadertools';
import {ShaderAssembler} from '@luma.gl/shadertools';
import type {Geometry} from '../geometry/geometry';
import {GPUGeometry, makeGPUGeometry} from '../geometry/gpu-geometry';
import {PipelineFactory} from '../lib/pipeline-factory';

export type ModelProps = Omit<RenderPipelineProps, 'vs' | 'fs'> & {
  // Model also accepts a string shaders
  vs: {glsl?: string; wgsl?: string} | string | null;
  fs: {glsl?: string; wgsl?: string} | string | null;
  /** shadertool shader modules (added to shader code) */
  modules?: ShaderModule[];
  /** Shadertool module defines (configures shader code)*/
  defines?: Record<string, string | number | boolean>;
  // TODO - injections, hooks etc?


  /** pipeline factory to use to create render pipelines. Defaults to default factory for the device */
  pipelineFactory?: PipelineFactory;
  /** Shader assembler. Defaults to the ShaderAssembler.getShaderAssembler() */
  shaderAssembler?: ShaderAssembler;
  
  /** Geometry */
  geometry?: GPUGeometry | Geometry | null;
  /** Parameters that are built into the pipeline */
  parameters?: RenderPipelineParameters;
  /** shadertool modules */
  moduleSettings?: Record<string, Record<string, any>>;
  /** Vertex count */
  vertexCount?: number;
  /** instance count */
  instanceCount?: number;
};

/**
 * v9 Model API
 * A model
 * - automatically reuses pipelines (programs) when possible
 * - automatically rebuilds pipelines if necessary to accommodate changed settings
 * shadertools integration
 * - accepts modules and performs shader transpilation
 */
export class Model {
  static defaultProps: Required<ModelProps> = {
    ...RenderPipeline.defaultProps,
    vs: null,
    fs: null,
    id: 'unnamed',
    handle: undefined,
    userData: {},
    defines: {},
    modules: [],
    moduleSettings: {},
    geometry: null,

    pipelineFactory: undefined!,
    shaderAssembler: ShaderAssembler.getDefaultShaderAssembler(),
  };

  readonly device: Device;
  readonly id: string;
  readonly vs: string;
  readonly fs: string;
  readonly pipelineFactory: PipelineFactory;
  userData: {[key: string]: any} = {};

  // Fixed properties (change can trigger pipeline rebuild)

  /** The render pipeline GPU parameters, depth testing etc */
  parameters: RenderPipelineParameters;

  /** The primitive topology */
  topology: PrimitiveTopology;
  /** Buffer layout */
  bufferLayout: BufferLayout[];

  // Dynamic properties

  /** Vertex count */
  vertexCount: number;
  /** instance count */
  instanceCount: number = 0;

  /** Index buffer */
  indices: Buffer | null = null;
  /** Buffer-valued attributes */
  bufferAttributes: Record<string, Buffer> = {};
  /** Constant-valued attributes */
  constantAttributes: Record<string, TypedArray> = {};
  /** Bindings (textures, samplers, uniform buffers) */
  bindings: Record<string, Binding> = {};
  /** Sets uniforms @deprecated Use uniform buffers and setBindings() for portability*/
  uniforms: Record<string, UniformValue> = {};

  /** The underlying GPU "program". @note May be recreated if parameters change */
  pipeline: RenderPipeline;
  _pipelineNeedsUpdate: string | false = 'newly created';
  private _getModuleUniforms: (props?: Record<string, Record<string, any>>) => Record<string, any>;
  private props: Required<ModelProps>;

  constructor(device: Device, props: ModelProps) {
    this.props = {...Model.defaultProps, ...props};
    props = this.props;
    this.id = props.id || uid('model');
    this.device = device;

    Object.assign(this.userData, props.userData);

    /** Create a shadertools platform info from the Device */
    const platformInfo: PlatformInfo = {
      type: device.info.type,
      shaderLanguage: device.info.shadingLanguages[0],
      gpu: device.info.gpu,
      features: device.features
    };

    const {vs, fs, getUniforms} = this.props.shaderAssembler.assembleShaders(platformInfo, this.props);
    this.vs = vs;
    this.fs = fs;
    this._getModuleUniforms = getUniforms;

    this.vertexCount = this.props.vertexCount;
    this.instanceCount = this.props.instanceCount;

    this.topology = this.props.topology;
    this.bufferLayout = this.props.bufferLayout;
    this.parameters = this.props.parameters;

    // Geometry, if provided, sets several attributes, indices, and also vertex count and topology
    if (props.geometry) {
      this.setGeometry(props.geometry);
    }

    this.pipelineFactory =
      props.pipelineFactory || PipelineFactory.getDefaultPipelineFactory(this.device);

    // Create the pipeline 
    // @note order is important
    this.pipeline = this._updatePipeline();

    // Now we can apply geometry attributes

    // Apply any dynamic settings that will not trigger pipeline change
    if (props.vertexCount) {
      this.setVertexCount(props.vertexCount);
    }
    if (props.instanceCount) {
      this.setInstanceCount(props.instanceCount);
    }
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

    this.setUniforms(this._getModuleUniforms()); // Get all default module uniforms

    // Catch any access to non-standard props
    Object.seal(this);
  }

  destroy(): void {
    this.pipelineFactory.release(this.pipeline);
  }

  // Draw call

  draw(renderPass: RenderPass): void {
    // Check if the pipeline is invalidated
    // TODO - this is likely the worst place to do this from performance perspective. Perhaps add a predraw()?
    this.pipeline = this._updatePipeline();

    // Set pipeline state, we may be sharing a pipeline so we need to set all state on every draw
    // Any caching needs to be done inside the pipeline functions
    this.pipeline.setIndexBuffer(this.indices);
    this.pipeline.setAttributes(this.bufferAttributes);
    this.pipeline.setConstantAttributes(this.constantAttributes);
    this.pipeline.setBindings(this.bindings);
    this.pipeline.setUniforms(this.uniforms);

    this.pipeline.draw({
      renderPass,
      vertexCount: this.vertexCount,
      instanceCount: this.instanceCount
    });
  }

  // Update fixed fields (can trigger pipeline rebuild)

  /** 
   * Updates the optional geometry
  * Geometry, sets several attributes, indices, and also vertex count and topology
   * @note Can trigger a pipeline rebuild / pipeline cache fetch on WebGPU
   */
  setGeometry(geometry: GPUGeometry | Geometry): void {
    const gpuGeometry = geometry && makeGPUGeometry(this.device, geometry);
    this.setTopology(gpuGeometry.topology || 'triangle-list');
    this.bufferLayout = mergeBufferLayouts(this.bufferLayout, gpuGeometry.bufferLayout);

    // TODO - delete previous geometry?
    this.vertexCount = gpuGeometry.vertexCount;
    this.setAttributes(gpuGeometry.attributes);
    this.setIndexBuffer(gpuGeometry.indices);
  }

  /** 
   * Updates the primitive topology ('triangle-list', 'triangle-strip' etc). 
   * @note Triggers a pipeline rebuild / pipeline cache fetch on WebGPU
   */
  setTopology(topology: PrimitiveTopology): void {
    if (topology !== this.topology) {
      this.topology = topology;
      // On WebGPU we need to rebuild the pipeline
      if (this.device.info.type === 'webgpu') {
        this._setPipelineNeedsUpdate('topology');
      }
    }
  }

  /** 
   * Updates the buffer layout. 
   * @note Triggers a pipeline rebuild / pipeline cache fetch on WebGPU
   */
  setBufferLayout(bufferLayout: BufferLayout[]): void {
    if (bufferLayout !== this.bufferLayout) {
      this.bufferLayout = bufferLayout;
      // On WebGPU we need to rebuild the pipeline
      if (this.device.info.type === 'webgpu') {
        this._setPipelineNeedsUpdate('bufferLayout');
      }
    }
  }

  /**
   * Set GPU parameters.
   * @note Can trigger a pipeline rebuild / pipeline cache fetch.
   * @param parameters
   */
  setParameters(parameters: RenderPipelineParameters) {
    if (!deepEqual(parameters, this.parameters, 2)) {
      this.parameters = parameters;
      // On WebGPU we need to rebuild the pipeline
      if (this.device.info.type === 'webgpu') {
        this._setPipelineNeedsUpdate('parameters');
      }
    }
  }
    
  // Update dynamic fields

  /**
   * Updates the vertex count (used in draw calls)
   * @note Any attributes with stepMode=vertex need to be at least this big
   */
  setVertexCount(vertexCount: number): void {
    this.vertexCount = vertexCount;
  }

  /**
   * Updates the instance count (used in draw calls)
   * @note Any attributes with stepMode=instance need to be at least this big
   */
  setInstanceCount(instanceCount: number): void {
    this.instanceCount = instanceCount;
  }

  /**
   * Updates shader module settings (which results in uniforms being set)
   */
  setShaderModuleProps(props: Record<string, any>): void {
    const uniforms = this._getModuleUniforms(props);
    Object.assign(this.uniforms, uniforms);
  }

  /**
   * @deprecated Updates shader module settings (which results in uniforms being set)
   */
  updateModuleSettings(props: Record<string, any>): void {
    this.setShaderModuleProps(props);
  }

  /**
   * Sets the index buffer
   * @todo - how to unset it if we change geometry?
   */
  setIndexBuffer(indices: Buffer | null): void {
    this.indices = indices;
  }

  /**
   * Sets attributes (buffers)
   * @note Overrides any attributes previously set with the same name
   */
  setAttributes(bufferAttributes: Record<string, Buffer>): void {
    if (bufferAttributes.indices) {
      log.warn(`Model:${this.id} setAttributes() - indices should be set using setIndexBuffer()`);
    }

    Object.assign(this.bufferAttributes, bufferAttributes);
  }

  /**
   * Sets constant attributes
   * @note Overrides any attributes previously set with the same name
   * @param constantAttributes
   */
  setConstantAttributes(constantAttributes: Record<string, TypedArray>): void {
    // TODO - this doesn't work under WebGPU, we'll need to create buffers or inject uniforms
    Object.assign(this.constantAttributes, constantAttributes);
  }

  /**
   * Sets bindings (textures, samplers, uniform buffers)
   */
  setBindings(bindings: Record<string, Binding>): void {
    Object.assign(this.bindings, bindings);
  }

  /**
   * Sets individual uniforms
   * @deprecated WebGL only, use uniform buffers for portability
   * @param uniforms
   * @returns self for chaining
   */
  setUniforms(uniforms: Record<string, UniformValue>): void {
    this.pipeline.setUniforms(uniforms);
    Object.assign(this.uniforms, uniforms);
  }

  _setPipelineNeedsUpdate(reason: string): void {
    this._pipelineNeedsUpdate = this._pipelineNeedsUpdate || reason;
  }

  _updatePipeline(): RenderPipeline {
    if (this._pipelineNeedsUpdate) {
      log.log(1, `Model ${this.id}: Recreating pipeline because "${this._pipelineNeedsUpdate}".`)();
      this._pipelineNeedsUpdate = false;
      this.pipeline = this.device.createRenderPipeline({
        ...this.props,
        bufferLayout: this.bufferLayout,
        topology: this.topology,
        parameters: this.parameters,
        vs: this.device.createShader({stage: 'vertex', source: this.vs}),
        fs: this.fs ? this.device.createShader({stage: 'fragment', source: this.fs}) : null
      });
    }
    return this.pipeline;
  }
}

/** TODO - move to core, document add tests */
function mergeBufferLayouts(layouts1: BufferLayout[], layouts2: BufferLayout[]): BufferLayout[] {
  const layouts = [...layouts1];
  for (const attribute of layouts2) {
    const index = layouts.findIndex(
      (attribute2) => attribute2.name === attribute.name
    );
    if (index < 0) {
      layouts.push(attribute);
    } else {
      layouts[index] = attribute;
    }
  }
  return layouts;
}