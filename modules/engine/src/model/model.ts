// luma.gl, MIT license
// Copyright (c) vis.gl contributors

import type {
  TypedArray,
  RenderPipelineProps,
  RenderPipelineParameters,
  BufferLayout,
  VertexArray,
  AttributeInfo
} from '@luma.gl/core';
import type {Binding, UniformValue, PrimitiveTopology} from '@luma.gl/core';
import {
  Device,
  Buffer,
  RenderPipeline,
  RenderPass,
  log,
  uid,
  deepEqual,
  splitUniformsAndBindings
} from '@luma.gl/core';
import {getAttributeInfosFromLayouts} from '@luma.gl/core';
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

  /** Parameters that are built into the pipeline */
  parameters?: RenderPipelineParameters;

  /** Geometry */
  geometry?: GPUGeometry | Geometry | null;

  /** Vertex count */
  vertexCount?: number;
  /** instance count */
  instanceCount?: number;

  indexBuffer?: Buffer | null;
  /** @note this is really a map of buffers, not a map of attributes */
  attributes?: Record<string, Buffer>;
  /**   */
  constantAttributes?: Record<string, TypedArray>;

  /** Mapped uniforms for shadertool modules */
  moduleSettings?: Record<string, Record<string, any>>;
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
    indexBuffer: null,
    attributes: {},
    constantAttributes: {},

    pipelineFactory: undefined!,
    shaderAssembler: ShaderAssembler.getDefaultShaderAssembler()
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
  indexBuffer: Buffer | null = null;
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

  /**
   * VertexArray
   * @note not implemented: if bufferLayout is updated, vertex array has to be rebuilt!
   * @todo - allow application to define multiple vertex arrays?
   * */
  vertexArray: VertexArray;

  _pipelineNeedsUpdate: string | false = 'newly created';
  _attributeInfos: Record<string, AttributeInfo> = {};
  _gpuGeometry: GPUGeometry | null = null;
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

    const {vs, fs, getUniforms} = this.props.shaderAssembler.assembleShaders(
      platformInfo,
      this.props
    );
    this.vs = vs;
    this.fs = fs;
    this._getModuleUniforms = getUniforms;

    this.vertexCount = this.props.vertexCount;
    this.instanceCount = this.props.instanceCount;

    this.topology = this.props.topology;
    this.bufferLayout = this.props.bufferLayout;
    this.parameters = this.props.parameters;

    // Geometry, if provided, sets topology and vertex cound
    if (props.geometry) {
      this._gpuGeometry = this.setGeometry(props.geometry);
    }

    this.pipelineFactory =
      props.pipelineFactory || PipelineFactory.getDefaultPipelineFactory(this.device);

    // Create the pipeline
    // @note order is important
    this.pipeline = this._updatePipeline();

    this.vertexArray = device.createVertexArray({
      renderPipeline: this.pipeline
    });

    // Now we can apply geometry attributes
    if (this._gpuGeometry) {
      this._setGeometryAttributes(this._gpuGeometry);
    }

    // Apply any dynamic settings that will not trigger pipeline change
    if (props.vertexCount) {
      this.setVertexCount(props.vertexCount);
    }
    if (props.instanceCount) {
      this.setInstanceCount(props.instanceCount);
    }
    // @ts-expect-error
    if (props.indices) {
      throw new Error('Model.props.indices removed. Use props.indexBuffer');
    }
    if (props.indexBuffer) {
      this.setIndexBuffer(props.indexBuffer);
    }
    if (props.attributes) {
      this.setAttributes(props.attributes);
    }
    if (props.constantAttributes) {
      this.setConstantAttributes(props.constantAttributes);
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
    this.pipeline.setBindings(this.bindings);
    this.pipeline.setUniforms(this.uniforms);

    this.pipeline.draw({
      renderPass,
      vertexArray: this.vertexArray,
      vertexCount: this.vertexCount,
      instanceCount: this.instanceCount
    });
  }

  // Update fixed fields (can trigger pipeline rebuild)

  /**
   * Updates the optional geometry
   * Geometry, set topology and bufferLayout
   * @note Can trigger a pipeline rebuild / pipeline cache fetch on WebGPU
   */
  setGeometry(geometry: GPUGeometry | Geometry): GPUGeometry {
    const gpuGeometry = geometry && makeGPUGeometry(this.device, geometry);
    this.setTopology(gpuGeometry.topology || 'triangle-list');
    this.bufferLayout = mergeBufferLayouts(this.bufferLayout, gpuGeometry.bufferLayout);
    if (this.vertexArray) {
      this._setGeometryAttributes(gpuGeometry);
    }
    return gpuGeometry;
  }

  /**
   * Updates the optional geometry attributes
   * Geometry, sets several attributes, indexBuffer, and also vertex count
   * @note Can trigger a pipeline rebuild / pipeline cache fetch on WebGPU
   */
  _setGeometryAttributes(gpuGeometry: GPUGeometry): void {
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
      this._setPipelineNeedsUpdate('topology');
    }
  }

  /**
   * Updates the buffer layout.
   * @note Triggers a pipeline rebuild / pipeline cache fetch on WebGPU
   */
  setBufferLayout(bufferLayout: BufferLayout[]): void {
    this.bufferLayout = this._gpuGeometry
      ? mergeBufferLayouts(bufferLayout, this._gpuGeometry.bufferLayout)
      : bufferLayout;
    this._setPipelineNeedsUpdate('bufferLayout');

    // Recreate the pipeline
    this.pipeline = this._updatePipeline();

    // vertex array needs to be updated if we update buffer layout,
    // but not if we update parameters
    this.vertexArray = this.device.createVertexArray({
      renderPipeline: this.pipeline
    });

    // Reapply geometry attributes to the new vertex array
    if (this._gpuGeometry) {
      this._setGeometryAttributes(this._gpuGeometry);
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
      this._setPipelineNeedsUpdate('parameters');
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
   * Updates shader module settings (which results in bindings & uniforms being set)
   */
  setShaderModuleProps(props: Record<string, any>): void {
    const {bindings, uniforms} = splitUniformsAndBindings(this._getModuleUniforms(props));
    Object.assign(this.bindings, bindings);
    Object.assign(this.uniforms, uniforms);
  }

  /**
   * @deprecated Updates shader module settings (which results in uniforms being set)
   */
  updateModuleSettings(props: Record<string, any>): void {
    this.setShaderModuleProps(props);
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

  /**
   * Sets the index buffer
   * @todo - how to unset it if we change geometry?
   */
  setIndexBuffer(indexBuffer: Buffer | null): void {
    this.vertexArray.setIndexBuffer(indexBuffer);
  }

  /**
   * Sets attributes (buffers)
   * @note Overrides any attributes previously set with the same name
   */
  setAttributes(buffers: Record<string, Buffer>): void {
    if (buffers.indices) {
      log.warn(
        `Model:${this.id} setAttributes() - indexBuffer should be set using setIndexBuffer()`
      );
    }
    for (const [bufferName, buffer] of Object.entries(buffers)) {
      const bufferLayout = this.bufferLayout.find(layout => layout.name === bufferName);
      if (!bufferLayout) {
        continue; // eslint-disable-line no-continue
      }

      // For an interleaved attribute we may need to set multiple attributes
      const attributeNames = bufferLayout.attributes
        ? bufferLayout.attributes?.map(layout => layout.attribute)
        : [bufferLayout.name];
      let set = false;
      for (const attributeName of attributeNames) {
        const attributeInfo = this._attributeInfos[attributeName];
        if (attributeInfo) {
          this.vertexArray.setBuffer(attributeInfo.location, buffer);
          set = true;
        }
      }
      if (!set) {
        log.warn(
          `Model(${this.id}): Ignoring buffer "${buffer.id}" for unknown attribute "${bufferName}"`
        )();
      }
    }
  }

  /**
   * Sets constant attributes
   * @note Overrides any attributes previously set with the same name
   * Constant attributes are only supported in WebGL, not in WebGPU
   * Any attribute that is disabled in the current vertex array object
   * is read from the context's global constant value for that attribute location.
   * @param constantAttributes
   */
  setConstantAttributes(attributes: Record<string, TypedArray>): void {
    for (const [attributeName, value] of Object.entries(attributes)) {
      const attributeInfo = this._attributeInfos[attributeName];
      if (attributeInfo) {
        this.vertexArray.setConstant(attributeInfo.location, value);
      } else {
        log.warn(
          `Model "${this.id}: Ignoring constant supplied for unknown attribute "${attributeName}"`
        )();
      }
    }
  }

  _setPipelineNeedsUpdate(reason: string): void {
    this._pipelineNeedsUpdate = this._pipelineNeedsUpdate || reason;
  }

  _updatePipeline(): RenderPipeline {
    if (this._pipelineNeedsUpdate) {
      if (this.pipeline) {
        log.log(
          1,
          `Model ${this.id}: Recreating pipeline because "${this._pipelineNeedsUpdate}".`
        )();
      }
      this._pipelineNeedsUpdate = false;
      this.pipeline = this.device.createRenderPipeline({
        ...this.props,
        bufferLayout: this.bufferLayout,
        topology: this.topology,
        parameters: this.parameters,
        vs: this.device.createShader({id: '{$this.id}-vertex', stage: 'vertex', source: this.vs}),
        fs: this.fs
          ? this.device.createShader({
              id: '{$this.id}-fragment',
              stage: 'fragment',
              source: this.fs
            })
          : null
      });
      this._attributeInfos = getAttributeInfosFromLayouts(
        this.pipeline.shaderLayout,
        this.bufferLayout
      );
    }
    return this.pipeline;
  }
}

/** TODO - move to core, document add tests */
function mergeBufferLayouts(layouts1: BufferLayout[], layouts2: BufferLayout[]): BufferLayout[] {
  const layouts = [...layouts1];
  for (const attribute of layouts2) {
    const index = layouts.findIndex(attribute2 => attribute2.name === attribute.name);
    if (index < 0) {
      layouts.push(attribute);
    } else {
      layouts[index] = attribute;
    }
  }
  return layouts;
}
