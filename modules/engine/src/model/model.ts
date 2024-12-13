// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// A lot of imports, but then Model is where it all comes together...
import type {TypedArray} from '@math.gl/types';
import type {
  RenderPipelineProps,
  RenderPipelineParameters,
  BufferLayout,
  Shader,
  VertexArray,
  TransformFeedback,
  AttributeInfo,
  Binding,
  UniformValue,
  PrimitiveTopology
} from '@luma.gl/core';
import {
  Device,
  DeviceFeature,
  Buffer,
  Texture,
  TextureView,
  Sampler,
  RenderPipeline,
  RenderPass,
  UniformStore,
  log,
  getTypedArrayFromDataType,
  getAttributeInfosFromLayouts,
  _BufferLayoutHelper
} from '@luma.gl/core';

import type {ShaderModule, PlatformInfo} from '@luma.gl/shadertools';
import {ShaderAssembler, getShaderLayoutFromWGSL} from '@luma.gl/shadertools';

import type {Geometry} from '../geometry/geometry';
import {GPUGeometry, makeGPUGeometry} from '../geometry/gpu-geometry';
import {PipelineFactory} from '../factories/pipeline-factory';
import {ShaderFactory} from '../factories/shader-factory';
import {getDebugTableForShaderLayout} from '../debug/debug-shader-layout';
import {debugFramebuffer} from '../debug/debug-framebuffer';
import {deepEqual} from '../utils/deep-equal';
import {uid} from '../utils/uid';
import {ShaderInputs} from '../shader-inputs';
// import type {AsyncTextureProps} from '../async-texture/async-texture';
import {AsyncTexture} from '../async-texture/async-texture';

import {splitUniformsAndBindings} from './split-uniforms-and-bindings';

const LOG_DRAW_PRIORITY = 2;
const LOG_DRAW_TIMEOUT = 10000;

export type ModelProps = Omit<RenderPipelineProps, 'vs' | 'fs' | 'bindings'> & {
  source?: string;
  vs: string | null;
  fs: string | null;

  /** shadertool shader modules (added to shader code) */
  modules?: ShaderModule[];
  /** Shadertool module defines (configures shader code)*/
  defines?: Record<string, string | number | boolean>;
  // TODO - injections, hooks etc?

  /** Shader inputs, used to generated uniform buffers and bindings */
  shaderInputs?: ShaderInputs;
  /** Bindings */
  bindings?: Record<string, Binding | AsyncTexture>;
  /** Parameters that are built into the pipeline */
  parameters?: RenderPipelineParameters;

  /** Geometry */
  geometry?: GPUGeometry | Geometry | null;

  /** @deprecated Use instanced rendering? Will be auto-detected in 9.1 */
  isInstanced?: boolean;
  /** instance count */
  instanceCount?: number;
  /** Vertex count */
  vertexCount?: number;

  indexBuffer?: Buffer | null;
  /** @note this is really a map of buffers, not a map of attributes */
  attributes?: Record<string, Buffer>;
  /**   */
  constantAttributes?: Record<string, TypedArray>;

  /** Some applications intentionally supply unused attributes and bindings, and want to disable warnings */
  disableWarnings?: boolean;

  /** @internal For use with {@link TransformFeedback}, WebGL only. */
  varyings?: string[];

  transformFeedback?: TransformFeedback;

  /** Mapped uniforms for shadertool modules */
  moduleSettings?: Record<string, Record<string, any>>;

  /** Show shader source in browser? */
  debugShaders?: 'never' | 'errors' | 'warnings' | 'always';

  /** Factory used to create a {@link RenderPipeline}. Defaults to {@link Device} default factory. */
  pipelineFactory?: PipelineFactory;
  /** Factory used to create a {@link Shader}. Defaults to {@link Device} default factory. */
  shaderFactory?: ShaderFactory;
  /** Shader assembler. Defaults to the ShaderAssembler.getShaderAssembler() */
  shaderAssembler?: ShaderAssembler;
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
    source: undefined!,
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

    isInstanced: undefined!,
    instanceCount: 0,
    vertexCount: 0,

    shaderInputs: undefined!,
    pipelineFactory: undefined!,
    shaderFactory: undefined!,
    transformFeedback: undefined!,
    shaderAssembler: ShaderAssembler.getDefaultShaderAssembler(),

    debugShaders: undefined!,
    disableWarnings: undefined!
  };

  readonly device: Device;
  readonly id: string;
  // @ts-expect-error assigned in function called from constructor
  readonly source: string;
  // @ts-expect-error assigned in function called from constructor
  readonly vs: string;
  // @ts-expect-error assigned in function called from constructor
  readonly fs: string;
  readonly pipelineFactory: PipelineFactory;
  readonly shaderFactory: ShaderFactory;
  userData: {[key: string]: any} = {};

  // Fixed properties (change can trigger pipeline rebuild)

  /** The render pipeline GPU parameters, depth testing etc */
  parameters: RenderPipelineParameters;

  /** The primitive topology */
  topology: PrimitiveTopology;
  /** Buffer layout */
  bufferLayout: BufferLayout[];

  // Dynamic properties

  /** Use instanced rendering */
  isInstanced: boolean | undefined = undefined;
  /** instance count. `undefined` means not instanced */
  instanceCount: number = 0;
  /** Vertex count */
  vertexCount: number;

  /** Index buffer */
  indexBuffer: Buffer | null = null;
  /** Buffer-valued attributes */
  bufferAttributes: Record<string, Buffer> = {};
  /** Constant-valued attributes */
  constantAttributes: Record<string, TypedArray> = {};
  /** Bindings (textures, samplers, uniform buffers) */
  bindings: Record<string, Binding | AsyncTexture> = {};
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
  // @ts-expect-error Assigned in function called by constructor
  shaderInputs: ShaderInputs;
  // @ts-expect-error Assigned in function called by constructor
  _uniformStore: UniformStore;

  _attributeInfos: Record<string, AttributeInfo> = {};
  _gpuGeometry: GPUGeometry | null = null;
  private _getModuleUniforms: (props?: Record<string, Record<string, any>>) => Record<string, any>;
  private props: Required<ModelProps>;

  _pipelineNeedsUpdate: string | false = 'newly created';
  private _needsRedraw: string | false = 'initializing';
  private _destroyed = false;

  /** "Time" of last draw. Monotonically increasing timestamp */
  _lastDrawTimestamp: number = -1;

  get [Symbol.toStringTag](): string {
    return 'Model';
  }

  toString(): string {
    return `Model(${this.id})`;
  }

  constructor(device: Device, props: ModelProps) {
    this.props = {...Model.defaultProps, ...props};
    props = this.props;
    this.id = props.id || uid('model');
    this.device = device;

    Object.assign(this.userData, props.userData);

    // Setup shader module inputs
    const moduleMap = Object.fromEntries(
      this.props.modules?.map(module => [module.name, module]) || []
    );

    const shaderInputs =
      props.shaderInputs ||
      new ShaderInputs(moduleMap, {disableWarnings: this.props.disableWarnings});
    // @ts-ignore
    this.setShaderInputs(shaderInputs);

    // Setup shader assembler
    const platformInfo = getPlatformInfo(device);

    // Extract modules from shader inputs if not supplied
    const modules =
      // @ts-ignore shaderInputs is assigned in setShaderInputs above.
      (this.props.modules?.length > 0 ? this.props.modules : this.shaderInputs?.getModules()) || [];

    const isWebGPU = this.device.type === 'webgpu';

    // WebGPU
    // TODO - hack to support unified WGSL shader
    // TODO - this is wrong, compile a single shader
    if (isWebGPU && this.props.source) {
      // WGSL
      this.props.shaderLayout ||= getShaderLayoutFromWGSL(this.props.source);
      const {source, getUniforms} = this.props.shaderAssembler.assembleWGSLShader({
        platformInfo,
        ...this.props,
        modules
      });
      this.source = source;
      // @ts-expect-error
      this._getModuleUniforms = getUniforms;
    } else {
      // GLSL
      const {vs, fs, getUniforms} = this.props.shaderAssembler.assembleGLSLShaderPair({
        platformInfo,
        ...this.props,
        modules
      });

      this.vs = vs;
      this.fs = fs;
      // @ts-expect-error
      this._getModuleUniforms = getUniforms;
    }

    this.vertexCount = this.props.vertexCount;
    this.instanceCount = this.props.instanceCount;

    this.topology = this.props.topology;
    this.bufferLayout = this.props.bufferLayout;
    this.parameters = this.props.parameters;

    // Geometry, if provided, sets topology and vertex cound
    if (props.geometry) {
      this.setGeometry(props.geometry);
    }

    this.pipelineFactory =
      props.pipelineFactory || PipelineFactory.getDefaultPipelineFactory(this.device);
    this.shaderFactory = props.shaderFactory || ShaderFactory.getDefaultShaderFactory(this.device);

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
    if ('isInstanced' in props) {
      this.isInstanced = props.isInstanced;
    }

    if (props.instanceCount) {
      this.setInstanceCount(props.instanceCount);
    }
    if (props.vertexCount) {
      this.setVertexCount(props.vertexCount);
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
      this.setUniformsWebGL(props.uniforms);
    }
    if (props.moduleSettings) {
      // log.warn('Model.props.moduleSettings is deprecated. Use Model.shaderInputs.setProps()')();
      this.updateModuleSettingsWebGL(props.moduleSettings);
    }
    if (props.transformFeedback) {
      this.transformFeedback = props.transformFeedback;
    }

    // Catch any access to non-standard props
    Object.seal(this);
  }

  destroy(): void {
    if (this._destroyed) return;
    this.pipelineFactory.release(this.pipeline);
    this.shaderFactory.release(this.pipeline.vs);
    if (this.pipeline.fs) {
      this.shaderFactory.release(this.pipeline.fs);
    }
    this._uniformStore.destroy();
    // TODO - mark resource as managed and destroyIfManaged() ?
    this._gpuGeometry?.destroy();
    this._destroyed = true;
  }

  // Draw call

  /** Query redraw status. Clears the status. */
  needsRedraw(): false | string {
    // Catch any writes to already bound resources
    if (this._getBindingsUpdateTimestamp() > this._lastDrawTimestamp) {
      this.setNeedsRedraw('contents of bound textures or buffers updated');
    }
    const needsRedraw = this._needsRedraw;
    this._needsRedraw = false;
    return needsRedraw;
  }

  /** Mark the model as needing a redraw */
  setNeedsRedraw(reason: string): void {
    this._needsRedraw ||= reason;
  }

  predraw(): void {
    // Update uniform buffers if needed
    this.updateShaderInputs();
    // Check if the pipeline is invalidated
    this.pipeline = this._updatePipeline();
  }

  draw(renderPass: RenderPass): boolean {
    const loadingBinding = this._areBindingsLoading();
    if (loadingBinding) {
      log.info(LOG_DRAW_PRIORITY, `>>> DRAWING ABORTED ${this.id}: ${loadingBinding} not loaded`)();
      return false;
    }

    try {
      renderPass.pushDebugGroup(`${this}.predraw(${renderPass})`);
      this.predraw();
    } finally {
      renderPass.popDebugGroup();
    }

    let drawSuccess: boolean;
    try {
      renderPass.pushDebugGroup(`${this}.draw(${renderPass})`);
      this._logDrawCallStart();

      // Update the pipeline if invalidated
      // TODO - inside RenderPass is likely the worst place to do this from performance perspective.
      // Application can call Model.predraw() to avoid this.
      this.pipeline = this._updatePipeline();

      // Set pipeline state, we may be sharing a pipeline so we need to set all state on every draw
      // Any caching needs to be done inside the pipeline functions
      // TODO this is a busy initialized check for all bindings every frame

      const syncBindings = this._getBindings();
      this.pipeline.setBindings(syncBindings, {
        disableWarnings: this.props.disableWarnings
      });
      if (!isObjectEmpty(this.uniforms)) {
        this.pipeline.setUniformsWebGL(this.uniforms);
      }

      const {indexBuffer} = this.vertexArray;
      const indexCount = indexBuffer
        ? indexBuffer.byteLength / (indexBuffer.indexType === 'uint32' ? 4 : 2)
        : undefined;

      drawSuccess = this.pipeline.draw({
        renderPass,
        vertexArray: this.vertexArray,
        isInstanced: this.isInstanced,
        vertexCount: this.vertexCount,
        instanceCount: this.instanceCount,
        indexCount,
        transformFeedback: this.transformFeedback || undefined,
        // WebGL shares underlying cached pipelines even for models that have different parameters and topology,
        // so we must provide our unique parameters to each draw
        // (In WebGPU most parameters are encoded in the pipeline and cannot be changed per draw call)
        parameters: this.parameters,
        topology: this.topology
      });
    } finally {
      renderPass.popDebugGroup();
      this._logDrawCallEnd();
    }
    this._logFramebuffer(renderPass);

    // Update needsRedraw flag
    if (drawSuccess) {
      this._lastDrawTimestamp = this.device.timestamp;
      this._needsRedraw = false;
    } else {
      this._needsRedraw = 'waiting for resource initialization';
    }
    return drawSuccess;
  }

  // Update fixed fields (can trigger pipeline rebuild)

  /**
   * Updates the optional geometry
   * Geometry, set topology and bufferLayout
   * @note Can trigger a pipeline rebuild / pipeline cache fetch on WebGPU
   */
  setGeometry(geometry: GPUGeometry | Geometry | null): void {
    this._gpuGeometry?.destroy();
    const gpuGeometry = geometry && makeGPUGeometry(this.device, geometry);
    if (gpuGeometry) {
      this.setTopology(gpuGeometry.topology || 'triangle-list');
      const bufferLayoutHelper = new _BufferLayoutHelper(this.bufferLayout);
      this.bufferLayout = bufferLayoutHelper.mergeBufferLayouts(
        gpuGeometry.bufferLayout,
        this.bufferLayout
      );
      if (this.vertexArray) {
        this._setGeometryAttributes(gpuGeometry);
      }
    }
    this._gpuGeometry = gpuGeometry;
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
   * @note Triggers a pipeline rebuild / pipeline cache fetch
   */
  setBufferLayout(bufferLayout: BufferLayout[]): void {
    const bufferLayoutHelper = new _BufferLayoutHelper(this.bufferLayout);
    this.bufferLayout = this._gpuGeometry
      ? bufferLayoutHelper.mergeBufferLayouts(bufferLayout, this._gpuGeometry.bufferLayout)
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
   * Updates the instance count (used in draw calls)
   * @note Any attributes with stepMode=instance need to be at least this big
   */
  setInstanceCount(instanceCount: number): void {
    this.instanceCount = instanceCount;
    // luma.gl examples don't set props.isInstanced and rely on auto-detection
    // but deck.gl sets instanceCount even for models that are not instanced.
    if (this.isInstanced === undefined && instanceCount > 0) {
      this.isInstanced = true;
    }
    this.setNeedsRedraw('instanceCount');
  }

  /**
   * Updates the vertex count (used in draw calls)
   * @note Any attributes with stepMode=vertex need to be at least this big
   */
  setVertexCount(vertexCount: number): void {
    this.vertexCount = vertexCount;
    this.setNeedsRedraw('vertexCount');
  }

  /** Set the shader inputs */
  setShaderInputs(shaderInputs: ShaderInputs): void {
    this.shaderInputs = shaderInputs;
    this._uniformStore = new UniformStore(this.shaderInputs.modules);
    // Create uniform buffer bindings for all modules that actually have uniforms
    for (const [moduleName, module] of Object.entries(this.shaderInputs.modules)) {
      if (shaderModuleHasUniforms(module)) {
        const uniformBuffer = this._uniformStore.getManagedUniformBuffer(this.device, moduleName);
        this.bindings[`${moduleName}Uniforms`] = uniformBuffer;
      }
    }
    this.setNeedsRedraw('shaderInputs');
  }

  /** Update uniform buffers from the model's shader inputs */
  updateShaderInputs(): void {
    this._uniformStore.setUniforms(this.shaderInputs.getUniformValues());
    this.setBindings(this.shaderInputs.getBindingValues());
    // TODO - this is already tracked through buffer/texture update times?
    this.setNeedsRedraw('shaderInputs');
  }

  /**
   * Sets bindings (textures, samplers, uniform buffers)
   */
  setBindings(bindings: Record<string, Binding | AsyncTexture>): void {
    Object.assign(this.bindings, bindings);
    this.setNeedsRedraw('bindings');
  }

  /**
   * Updates optional transform feedback. WebGL only.
   */
  setTransformFeedback(transformFeedback: TransformFeedback | null): void {
    this.transformFeedback = transformFeedback;
    this.setNeedsRedraw('transformFeedback');
  }

  /**
   * Sets the index buffer
   * @todo - how to unset it if we change geometry?
   */
  setIndexBuffer(indexBuffer: Buffer | null): void {
    this.vertexArray.setIndexBuffer(indexBuffer);
    this.setNeedsRedraw('indexBuffer');
  }

  /**
   * Sets attributes (buffers)
   * @note Overrides any attributes previously set with the same name
   */
  setAttributes(buffers: Record<string, Buffer>, options?: {disableWarnings?: boolean}): void {
    const disableWarnings = options?.disableWarnings ?? this.props.disableWarnings;
    if (buffers.indices) {
      log.warn(
        `Model:${this.id} setAttributes() - indexBuffer should be set using setIndexBuffer()`
      )();
    }

    const bufferLayoutHelper = new _BufferLayoutHelper(this.bufferLayout);

    // Check if all buffers have a layout
    for (const [bufferName, buffer] of Object.entries(buffers)) {
      const bufferLayout = bufferLayoutHelper.getBufferLayout(bufferName);
      if (!bufferLayout) {
        if (!disableWarnings) {
          log.warn(`Model(${this.id}): Missing layout for buffer "${bufferName}".`)();
        }
        continue; // eslint-disable-line no-continue
      }

      // For an interleaved attribute we may need to set multiple attributes
      const attributeNames = bufferLayoutHelper.getAttributeNamesForBuffer(bufferLayout);
      let set = false;
      for (const attributeName of attributeNames) {
        const attributeInfo = this._attributeInfos[attributeName];
        if (attributeInfo) {
          this.vertexArray.setBuffer(attributeInfo.location, buffer);
          set = true;
        }
      }
      if (!set && !disableWarnings) {
        log.warn(
          `Model(${this.id}): Ignoring buffer "${buffer.id}" for unknown attribute "${bufferName}"`
        )();
      }
    }
    this.setNeedsRedraw('attributes');
  }

  /**
   * Sets constant attributes
   * @note Overrides any attributes previously set with the same name
   * Constant attributes are only supported in WebGL, not in WebGPU
   * Any attribute that is disabled in the current vertex array object
   * is read from the context's global constant value for that attribute location.
   * @param constantAttributes
   */
  setConstantAttributes(
    attributes: Record<string, TypedArray>,
    options?: {disableWarnings?: boolean}
  ): void {
    for (const [attributeName, value] of Object.entries(attributes)) {
      const attributeInfo = this._attributeInfos[attributeName];
      if (attributeInfo) {
        this.vertexArray.setConstantWebGL(attributeInfo.location, value);
      } else if (!(options?.disableWarnings ?? this.props.disableWarnings)) {
        log.warn(
          `Model "${this.id}: Ignoring constant supplied for unknown attribute "${attributeName}"`
        )();
      }
    }
    this.setNeedsRedraw('constants');
  }

  // DEPRECATED METHODS

  /**
   * Sets individual uniforms
   * @deprecated WebGL only, use uniform buffers for portability
   * @param uniforms
   */
  setUniforms(uniforms: Record<string, UniformValue>): void {
    this.setUniformsWebGL(uniforms);
  }

  /**
   * Sets individual uniforms
   * @deprecated WebGL only, use uniform buffers for portability
   * @param uniforms
   */
  setUniformsWebGL(uniforms: Record<string, UniformValue>): void {
    if (!isObjectEmpty(uniforms)) {
      this.pipeline.setUniformsWebGL(uniforms);
      Object.assign(this.uniforms, uniforms);
    }
    this.setNeedsRedraw('uniforms');
  }

  /**
   * @deprecated Updates shader module settings (which results in uniforms being set)
   */
  updateModuleSettingsWebGL(props: Record<string, any>): void {
    // log.warn('Model.updateModuleSettings is deprecated. Use Model.shaderInputs.setProps()')();
    const {bindings, uniforms} = splitUniformsAndBindings(this._getModuleUniforms(props));
    Object.assign(this.bindings, bindings);
    Object.assign(this.uniforms, uniforms);
    this.setNeedsRedraw('moduleSettings');
  }

  // Internal methods

  /** Check that bindings are loaded. Returns id of first binding that is still loading. */
  _areBindingsLoading(): string | false {
    for (const binding of Object.values(this.bindings)) {
      if (binding instanceof AsyncTexture && !binding.isReady) {
        return binding.id;
      }
    }
    return false;
  }

  /** Extracts texture view from loaded async textures. Returns null if any textures have not yet been loaded. */
  _getBindings(): Record<string, Binding> {
    const validBindings: Record<string, Binding> = {};

    for (const [name, binding] of Object.entries(this.bindings)) {
      if (binding instanceof AsyncTexture) {
        // Check that async textures are loaded
        if (binding.isReady) {
          validBindings[name] = binding.texture;
        }
      } else {
        validBindings[name] = binding;
      }
    }

    return validBindings;
  }

  /** Get the timestamp of the latest updated bound GPU memory resource (buffer/texture). */
  _getBindingsUpdateTimestamp(): number {
    let timestamp = 0;
    for (const binding of Object.values(this.bindings)) {
      if (binding instanceof TextureView) {
        timestamp = Math.max(timestamp, binding.texture.updateTimestamp);
      } else if (binding instanceof Buffer || binding instanceof Texture) {
        timestamp = Math.max(timestamp, binding.updateTimestamp);
      } else if (binding instanceof AsyncTexture) {
        timestamp = binding.texture
          ? Math.max(timestamp, binding.texture.updateTimestamp)
          : // The texture will become available in the future
            Infinity;
      } else if (!(binding instanceof Sampler)) {
        timestamp = Math.max(timestamp, binding.buffer.updateTimestamp);
      }
    }
    return timestamp;
  }

  /**
   * Updates the optional geometry attributes
   * Geometry, sets several attributes, indexBuffer, and also vertex count
   * @note Can trigger a pipeline rebuild / pipeline cache fetch on WebGPU
   */
  _setGeometryAttributes(gpuGeometry: GPUGeometry): void {
    // Filter geometry attribute so that we don't issue warnings for unused attributes
    const attributes = {...gpuGeometry.attributes};
    for (const [attributeName] of Object.entries(attributes)) {
      if (
        !this.pipeline.shaderLayout.attributes.find(layout => layout.name === attributeName) &&
        attributeName !== 'positions'
      ) {
        delete attributes[attributeName];
      }
    }

    // TODO - delete previous geometry?
    this.vertexCount = gpuGeometry.vertexCount;
    this.setIndexBuffer(gpuGeometry.indices || null);
    this.setAttributes(gpuGeometry.attributes, {disableWarnings: true});
    this.setAttributes(attributes, {disableWarnings: this.props.disableWarnings});

    this.setNeedsRedraw('geometry attributes');
  }

  /** Mark pipeline as needing update */
  _setPipelineNeedsUpdate(reason: string): void {
    this._pipelineNeedsUpdate ||= reason;
    this.setNeedsRedraw(reason);
  }

  /** Update pipeline if needed */
  _updatePipeline(): RenderPipeline {
    if (this._pipelineNeedsUpdate) {
      let prevShaderVs: Shader | null = null;
      let prevShaderFs: Shader | null = null;
      if (this.pipeline) {
        log.log(
          1,
          `Model ${this.id}: Recreating pipeline because "${this._pipelineNeedsUpdate}".`
        )();
        prevShaderVs = this.pipeline.vs;
        prevShaderFs = this.pipeline.fs;
      }

      this._pipelineNeedsUpdate = false;

      const vs = this.shaderFactory.createShader({
        id: `${this.id}-vertex`,
        stage: 'vertex',
        source: this.source || this.vs,
        debugShaders: this.props.debugShaders
      });

      let fs: Shader | null = null;
      if (this.source) {
        fs = vs;
      } else if (this.fs) {
        fs = this.shaderFactory.createShader({
          id: `${this.id}-fragment`,
          stage: 'fragment',
          source: this.source || this.fs,
          debugShaders: this.props.debugShaders
        });
      }

      this.pipeline = this.pipelineFactory.createRenderPipeline({
        ...this.props,
        bufferLayout: this.bufferLayout,
        topology: this.topology,
        parameters: this.parameters,
        // TODO - why set bindings here when we reset them every frame?
        // Should we expose a BindGroup abstraction?
        bindings: this._getBindings(),
        vs,
        fs
      });

      this._attributeInfos = getAttributeInfosFromLayouts(
        this.pipeline.shaderLayout,
        this.bufferLayout
      );

      if (prevShaderVs) this.shaderFactory.release(prevShaderVs);
      if (prevShaderFs) this.shaderFactory.release(prevShaderFs);
    }
    return this.pipeline;
  }

  /** Throttle draw call logging */
  _lastLogTime = 0;
  _logOpen = false;

  _logDrawCallStart(): void {
    // IF level is 4 or higher, log every frame.
    const logDrawTimeout = log.level > 3 ? 0 : LOG_DRAW_TIMEOUT;
    if (log.level < 2 || Date.now() - this._lastLogTime < logDrawTimeout) {
      return;
    }

    this._lastLogTime = Date.now();
    this._logOpen = true;

    log.group(LOG_DRAW_PRIORITY, `>>> DRAWING MODEL ${this.id}`, {collapsed: log.level <= 2})();
  }

  _logDrawCallEnd(): void {
    if (this._logOpen) {
      const shaderLayoutTable = getDebugTableForShaderLayout(this.pipeline.shaderLayout, this.id);

      // log.table(logLevel, attributeTable)();
      // log.table(logLevel, uniformTable)();
      log.table(LOG_DRAW_PRIORITY, shaderLayoutTable)();

      const uniformTable = this.shaderInputs.getDebugTable();
      // Add any global uniforms
      for (const [name, value] of Object.entries(this.uniforms)) {
        uniformTable[name] = {value};
      }
      log.table(LOG_DRAW_PRIORITY, uniformTable)();

      const attributeTable = this._getAttributeDebugTable();
      log.table(LOG_DRAW_PRIORITY, this._attributeInfos)();
      log.table(LOG_DRAW_PRIORITY, attributeTable)();

      log.groupEnd(LOG_DRAW_PRIORITY)();
      this._logOpen = false;
    }
  }

  protected _drawCount = 0;
  _logFramebuffer(renderPass: RenderPass): void {
    const debugFramebuffers = this.device.props.debugFramebuffers;
    this._drawCount++;
    // Update first 3 frames and then every 60 frames
    if (!debugFramebuffers) {
      // } || (this._drawCount++ > 3 && this._drawCount % 60)) {
      return;
    }
    // TODO - display framebuffer output in debug window
    const framebuffer = renderPass.props.framebuffer;
    if (framebuffer) {
      debugFramebuffer(framebuffer, {id: framebuffer.id, minimap: true});
      // log.image({logLevel: LOG_DRAW_PRIORITY, message: `${framebuffer.id} %c sup?`, image})();
    }
  }

  _getAttributeDebugTable(): Record<string, Record<string, unknown>> {
    const table: Record<string, Record<string, unknown>> = {};
    for (const [name, attributeInfo] of Object.entries(this._attributeInfos)) {
      const values = this.vertexArray.attributes[attributeInfo.location];
      table[attributeInfo.location] = {
        name,
        type: attributeInfo.shaderType,
        values: values
          ? this._getBufferOrConstantValues(values, attributeInfo.bufferDataType)
          : 'null'
      };
    }
    if (this.vertexArray.indexBuffer) {
      const {indexBuffer} = this.vertexArray;
      const values =
        indexBuffer.indexType === 'uint32'
          ? new Uint32Array(indexBuffer.debugData)
          : new Uint16Array(indexBuffer.debugData);
      table.indices = {
        name: 'indices',
        type: indexBuffer.indexType,
        values: values.toString()
      };
    }
    return table;
  }

  // TODO - fix typing of luma data types
  _getBufferOrConstantValues(attribute: Buffer | TypedArray, dataType: any): string {
    const TypedArrayConstructor = getTypedArrayFromDataType(dataType);
    const typedArray =
      attribute instanceof Buffer ? new TypedArrayConstructor(attribute.debugData) : attribute;
    return typedArray.toString();
  }
}

function shaderModuleHasUniforms(module: ShaderModule): boolean {
  return Boolean(module.uniformTypes && !isObjectEmpty(module.uniformTypes));
}

// HELPERS

/** Create a shadertools platform info from the Device */
export function getPlatformInfo(device: Device): PlatformInfo {
  return {
    type: device.type,
    shaderLanguage: device.info.shadingLanguage,
    shaderLanguageVersion: device.info.shadingLanguageVersion as 100 | 300,
    gpu: device.info.gpu,
    // HACK - we pretend that the DeviceFeatures is a Set, it has a similar API
    features: device.features as unknown as Set<DeviceFeature>
  };
}

/** Returns true if given object is empty, false otherwise. */
function isObjectEmpty(obj: object): boolean {
  // @ts-ignore key is unused
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for (const key in obj) {
    return false;
  }
  return true;
}
