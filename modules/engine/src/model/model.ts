// luma.gl, MIT license
// Copyright (c) vis.gl contributors

import type {TypedArray, RenderPipelineProps, RenderPipelineParameters} from '@luma.gl/core';
import type {BufferLayout, VertexArray, TransformFeedback} from '@luma.gl/core';
import type {AttributeInfo, Binding, UniformValue, PrimitiveTopology} from '@luma.gl/core';
import {Device, Buffer, RenderPipeline, RenderPass, UniformStore} from '@luma.gl/core';
import {log, uid, deepEqual, splitUniformsAndBindings} from '@luma.gl/core';
import {getAttributeInfosFromLayouts, getDebugTableForShaderLayout} from '@luma.gl/core';
import type {ShaderModule, PlatformInfo} from '@luma.gl/shadertools';
import {ShaderAssembler} from '@luma.gl/shadertools';
import {ShaderInputs} from '../shader-inputs';
import type {Geometry} from '../geometry/geometry';
import {GPUGeometry, makeGPUGeometry} from '../geometry/gpu-geometry';
import {PipelineFactory} from '../lib/pipeline-factory';

const LOG_DRAW_PRIORITY = 2;
const LOG_DRAW_TIMEOUT = 10000;

export type ModelProps = Omit<RenderPipelineProps, 'vs' | 'fs'> & {
  // Model also accepts a string shaders
  vs: {glsl?: string; wgsl?: string} | string | null;
  fs: {glsl?: string; wgsl?: string} | string | null;
  /** shadertool shader modules (added to shader code) */
  modules?: ShaderModule[];
  /** Shadertool module defines (configures shader code)*/
  defines?: Record<string, string | number | boolean>;
  // TODO - injections, hooks etc?

  /** Shader inputs, used to generated uniform buffers and bindings */
  shaderInputs?: ShaderInputs;
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

  /** @internal For use with {@link TransformFeedback}, WebGL 2 only. */
  varyings?: string[];

  transformFeedback?: TransformFeedback;

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
    moduleSettings: undefined!,
    geometry: null,
    indexBuffer: null,
    attributes: {},
    constantAttributes: {},
    varyings: [],

    shaderInputs: undefined!,
    pipelineFactory: undefined!,
    transformFeedback: undefined,
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

  /**
   * VertexArray
   * @note not implemented: if bufferLayout is updated, vertex array has to be rebuilt!
   * @todo - allow application to define multiple vertex arrays?
   * */
  vertexArray: VertexArray;

  /** TransformFeedback, WebGL 2 only. */
  transformFeedback: TransformFeedback | null = null;

  /** The underlying GPU "program". @note May be recreated if parameters change */
  pipeline: RenderPipeline;

  /** ShaderInputs instance */
  shaderInputs: ShaderInputs;

  _uniformStore: UniformStore;

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

    // Setup shader module inputs
    const moduleMap = Object.fromEntries(this.props.modules?.map(module => [module.name, module]) || []);
    this.setShaderInputs(props.shaderInputs || new ShaderInputs(moduleMap));

    // Setup shader assembler
    const platformInfo = getPlatformInfo(device);
    const modules = (this.props.modules?.length > 0 ? this.props.modules : this.shaderInputs?.getModules()) || [];
    const {vs, fs, getUniforms} = this.props.shaderAssembler.assembleShaders({platformInfo, ...this.props, modules});

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
      // eslint-disable-next-line no-console
      console.warn('Model.props.moduleSettings is deprecated. Use Model.shaderInputs.setProps()');
      this.updateModuleSettings(props.moduleSettings);
    }
    if (props.transformFeedback) {
      this.transformFeedback = props.transformFeedback;
    }

    // WebGL1?
    // this.setUniforms(this._getModuleUniforms()); // Get all default module uniforms

    // Catch any access to non-standard props
    Object.seal(this);
  }

  destroy(): void {
    this.pipelineFactory.release(this.pipeline);
    this._uniformStore.destroy();
  }

  // Draw call

  predraw() {
    // Update uniform buffers if needed
    this.updateShaderInputs();
  }

  draw(renderPass: RenderPass): void {
    this.predraw();

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
      instanceCount: this.instanceCount,
      transformFeedback: this.transformFeedback
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

  setShaderInputs(shaderInputs: ShaderInputs): void {
    this.shaderInputs = shaderInputs;
    this._uniformStore = new UniformStore(this.shaderInputs.modules);
    // Create uniform buffer bindings for all modules
    for (const moduleName of Object.keys(this.shaderInputs.modules)) {
      const uniformBuffer = this._uniformStore.getManagedUniformBuffer(
        this.device,
        moduleName
      );
      this.bindings[`${moduleName}Uniforms`] = uniformBuffer;
    }
  }

  updateShaderInputs(): void {
    this._uniformStore.setUniforms(this.shaderInputs.getUniformValues());
  }

  /**
   * @deprecated Updates shader module settings (which results in uniforms being set)
   */
  updateModuleSettings(props: Record<string, any>): void {
    // eslint-disable-next-line no-console
    console.warn('Model.updateModuleSettings is deprecated. Use Model.shaderInputs.setProps()');
    const {bindings, uniforms} = splitUniformsAndBindings(this._getModuleUniforms(props));
    Object.assign(this.bindings, bindings);
    Object.assign(this.uniforms, uniforms);
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
   * Updates optional transform feedback. WebGL 2 only.
   */
  setTransformFeedback(transformFeedback: TransformFeedback | null): void {
    this.transformFeedback = transformFeedback;
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
        log.warn(`Model(${this.id}): Missing layout for buffer "${bufferName}".`)();
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

  /** Throttle draw call logging */
  _lastLogTime = 0;

  _logDrawCallStart(logLevel: number): number {
    const logDrawTimeout = logLevel > 3 ? 0 : LOG_DRAW_TIMEOUT;
    if (Date.now() - this._lastLogTime < logDrawTimeout) {
      return undefined;
    }

    this._lastLogTime = Date.now();

    log.group(LOG_DRAW_PRIORITY, `>>> DRAWING MODEL ${this.id}`, {collapsed: log.level <= 2})();

    return logLevel;
  }

  _logDrawCallEnd(logLevel: number): void {
    // HACK: logLevel === undefined means logDrawCallStart didn't run
    if (logLevel === undefined) {
      return;
    }

    const shaderLayoutTable = getDebugTableForShaderLayout(this.pipeline.shaderLayout);

    // log.table(logLevel, attributeTable)();
    // log.table(logLevel, uniformTable)();
    log.table(logLevel + 1, shaderLayoutTable)();

    log.groupEnd(LOG_DRAW_PRIORITY)();
  }
}

// HELPERS

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

/** Create a shadertools platform info from the Device */
export function getPlatformInfo(device: Device): PlatformInfo {
  return {
    type: device.info.type,
    shaderLanguage: device.info.shadingLanguage,
    shaderLanguageVersion: device.info.shadingLanguageVersion as 100 | 300,
    gpu: device.info.gpu,
    features: device.features
  };
}
