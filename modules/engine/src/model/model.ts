// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// A lot of imports, but then Model is where it all comes together...
import type {TypedArray, RenderPipelineProps, RenderPipelineParameters} from '@luma.gl/core';
import type {BufferLayout, Shader, VertexArray, TransformFeedback} from '@luma.gl/core';
import type {AttributeInfo, Binding, UniformValue, PrimitiveTopology} from '@luma.gl/core';
import {Device, DeviceFeature, Buffer, Texture, TextureView, Sampler} from '@luma.gl/core';
import {RenderPipeline, RenderPass, UniformStore} from '@luma.gl/core';
import {log, uid, deepEqual, isObjectEmpty, splitUniformsAndBindings} from '@luma.gl/core';
import {getTypedArrayFromDataType, getAttributeInfosFromLayouts} from '@luma.gl/core';

import type {ShaderModule, PlatformInfo} from '@luma.gl/shadertools';
import {ShaderAssembler, getShaderLayoutFromWGSL} from '@luma.gl/shadertools';

import type {Geometry} from '../geometry/geometry';
import {GPUGeometry, makeGPUGeometry} from '../geometry/gpu-geometry';
import {ShaderInputs} from '../shader-inputs';
import {PipelineFactory} from '../lib/pipeline-factory';
import {ShaderFactory} from '../lib/shader-factory';
import {getDebugTableForShaderLayout} from '../debug/debug-shader-layout';
import {debugFramebuffer} from '../debug/debug-framebuffer';

const LOG_DRAW_PRIORITY = 2;
const LOG_DRAW_TIMEOUT = 10000;

export type ModelProps = Omit<RenderPipelineProps, 'vs' | 'fs'> & {
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
  /** Some applications intentionally supply unused attributes */
  ignoreUnknownAttributes?: boolean;

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
    source: null,
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
    shaderFactory: undefined!,
    transformFeedback: undefined,
    shaderAssembler: ShaderAssembler.getDefaultShaderAssembler(),

    debugShaders: undefined,
    ignoreUnknownAttributes: undefined
  };

  readonly device: Device;
  readonly id: string;
  readonly source: string;
  readonly vs: string;
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

  _attributeInfos: Record<string, AttributeInfo> = {};
  _gpuGeometry: GPUGeometry | null = null;
  private _getModuleUniforms: (props?: Record<string, Record<string, any>>) => Record<string, any>;
  private props: Required<ModelProps>;

  _pipelineNeedsUpdate: string | false = 'newly created';
  private _needsRedraw: string | false = 'initializing';
  private _destroyed = false;

  /** "Time" of last draw. Monotonically increasing timestamp */
  _lastDrawTimestamp: number = -1;

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
    this.setShaderInputs(props.shaderInputs || new ShaderInputs(moduleMap));

    // Setup shader assembler
    const platformInfo = getPlatformInfo(device);

    // Extract modules from shader inputs if not supplied
    const modules =
      (this.props.modules?.length > 0 ? this.props.modules : this.shaderInputs?.getModules()) || [];

    const isWebGPU = this.device.type === 'webgpu';

    // WebGPU
    // TODO - hack to support unified WGSL shader
    // TODO - this is wrong, compile a single shader
    if (isWebGPU && this.props.source) {
      // WGSL
      this.props.shaderLayout ||= getShaderLayoutFromWGSL(this.props.source);
      const {source, getUniforms} = this.props.shaderAssembler.assembleShader({
        platformInfo,
        ...this.props,
        modules
      });
      this.source = source;
      this._getModuleUniforms = getUniforms;
    } else {
      // GLSL
      const {vs, fs, getUniforms} = this.props.shaderAssembler.assembleShaderPair({
        platformInfo,
        ...this.props,
        modules
      });

      this.vs = vs;
      this.fs = fs;
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
      this.setAttributes(props.attributes, {
        ignoreUnknownAttributes: props.ignoreUnknownAttributes
      });
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
      log.warn('Model.props.moduleSettings is deprecated. Use Model.shaderInputs.setProps()')();
      this.updateModuleSettings(props.moduleSettings);
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

  predraw() {
    // Update uniform buffers if needed
    this.updateShaderInputs();
    // Check if the pipeline is invalidated
    this.pipeline = this._updatePipeline();
  }

  draw(renderPass: RenderPass): boolean {
    this.predraw();

    let drawSuccess: boolean;
    try {
      this._logDrawCallStart();

      // Update the pipeline if invalidated
      // TODO - inside RenderPass is likely the worst place to do this from performance perspective.
      // Application can call Model.predraw() to avoid this.
      this.pipeline = this._updatePipeline();

      // Set pipeline state, we may be sharing a pipeline so we need to set all state on every draw
      // Any caching needs to be done inside the pipeline functions
      this.pipeline.setBindings(this.bindings);
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
        vertexCount: this.vertexCount,
        instanceCount: this.instanceCount,
        indexCount,
        transformFeedback: this.transformFeedback
      });
    } finally {
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
      this.bufferLayout = mergeBufferLayouts(gpuGeometry.bufferLayout, this.bufferLayout);
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
    this.setNeedsRedraw('vertexCount');
  }

  /**
   * Updates the instance count (used in draw calls)
   * @note Any attributes with stepMode=instance need to be at least this big
   */
  setInstanceCount(instanceCount: number): void {
    this.instanceCount = instanceCount;
    this.setNeedsRedraw('instanceCount');
  }

  setShaderInputs(shaderInputs: ShaderInputs): void {
    this.shaderInputs = shaderInputs;
    this._uniformStore = new UniformStore(this.shaderInputs.modules);
    // Create uniform buffer bindings for all modules
    for (const moduleName of Object.keys(this.shaderInputs.modules)) {
      const uniformBuffer = this._uniformStore.getManagedUniformBuffer(this.device, moduleName);
      this.bindings[`${moduleName}Uniforms`] = uniformBuffer;
    }
    this.setNeedsRedraw('shaderInputs');
  }

  updateShaderInputs(): void {
    this._uniformStore.setUniforms(this.shaderInputs.getUniformValues());
    // TODO - this is already tracked through buffer/texture update times?
    this.setNeedsRedraw('shaderInputs');
  }

  /**
   * Sets bindings (textures, samplers, uniform buffers)
   */
  setBindings(bindings: Record<string, Binding>): void {
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
  setAttributes(
    buffers: Record<string, Buffer>,
    options?: {ignoreUnknownAttributes?: boolean}
  ): void {
    if (buffers.indices) {
      log.warn(
        `Model:${this.id} setAttributes() - indexBuffer should be set using setIndexBuffer()`
      )();
    }
    for (const [bufferName, buffer] of Object.entries(buffers)) {
      const bufferLayout = this.bufferLayout.find(layout =>
        getAttributeNames(layout).includes(bufferName)
      );
      if (!bufferLayout) {
        log.warn(`Model(${this.id}): Missing layout for buffer "${bufferName}".`)();
        continue; // eslint-disable-line no-continue
      }

      // For an interleaved attribute we may need to set multiple attributes
      const attributeNames = getAttributeNames(bufferLayout);
      let set = false;
      for (const attributeName of attributeNames) {
        const attributeInfo = this._attributeInfos[attributeName];
        if (attributeInfo) {
          this.vertexArray.setBuffer(attributeInfo.location, buffer);
          set = true;
        }
      }
      if (!set && (options?.ignoreUnknownAttributes || this.props.ignoreUnknownAttributes)) {
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
  setConstantAttributes(attributes: Record<string, TypedArray>): void {
    for (const [attributeName, value] of Object.entries(attributes)) {
      const attributeInfo = this._attributeInfos[attributeName];
      if (attributeInfo) {
        this.vertexArray.setConstantWebGL(attributeInfo.location, value);
      } else {
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
    if (!isObjectEmpty(uniforms)) {
      this.pipeline.setUniformsWebGL(uniforms);
      Object.assign(this.uniforms, uniforms);
    }
    this.setNeedsRedraw('uniforms');
  }

  /**
   * @deprecated Updates shader module settings (which results in uniforms being set)
   */
  updateModuleSettings(props: Record<string, any>): void {
    log.warn('Model.updateModuleSettings is deprecated. Use Model.shaderInputs.setProps()')();
    const {bindings, uniforms} = splitUniformsAndBindings(this._getModuleUniforms(props));
    Object.assign(this.bindings, bindings);
    Object.assign(this.uniforms, uniforms);
    this.setNeedsRedraw('moduleSettings');
  }

  // Internal methods

  /** Get the timestamp of the latest updated bound GPU memory resource (buffer/texture). */
  _getBindingsUpdateTimestamp(): number {
    let timestamp = 0;
    for (const binding of Object.values(this.bindings)) {
      if (binding instanceof TextureView) {
        timestamp = Math.max(timestamp, binding.texture.updateTimestamp);
      } else if (binding instanceof Buffer || binding instanceof Texture) {
        timestamp = Math.max(timestamp, binding.updateTimestamp);
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
    this.setIndexBuffer(gpuGeometry.indices);
    this.setAttributes(gpuGeometry.attributes, {ignoreUnknownAttributes: true});
    this.setAttributes(attributes, {ignoreUnknownAttributes: this.props.ignoreUnknownAttributes});

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
        debug: this.props.debugShaders
      });

      let fs: Shader | null = null;
      if (this.source) {
        fs = vs;
      } else if (this.fs) {
        fs = this.shaderFactory.createShader({
          id: `${this.id}-fragment`,
          stage: 'fragment',
          source: this.source || this.fs,
          debug: this.props.debugShaders
        });
      }

      this.pipeline = this.pipelineFactory.createRenderPipeline({
        ...this.props,
        bufferLayout: this.bufferLayout,
        topology: this.topology,
        parameters: this.parameters,
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
    const debugFramebuffers = log.get('framebuffer');
    this._drawCount++;
    // Update first 3 frames and then every 60 frames
    if (!debugFramebuffers || (this._drawCount++ > 3 && this._drawCount % 60)) {
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
      table[attributeInfo.location] = {
        name,
        type: attributeInfo.shaderType,
        values: this._getBufferOrConstantValues(
          this.vertexArray.attributes[attributeInfo.location],
          attributeInfo.bufferDataType
        )
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
    type: device.type,
    shaderLanguage: device.info.shadingLanguage,
    shaderLanguageVersion: device.info.shadingLanguageVersion as 100 | 300,
    gpu: device.info.gpu,
    // HACK - we pretend that the DeviceFeatures is a Set, it has a similar API
    features: device.features as unknown as Set<DeviceFeature>
  };
}

/** Get attribute names from a BufferLayout */
function getAttributeNames(bufferLayout: BufferLayout): string[] {
  return bufferLayout.attributes
    ? bufferLayout.attributes?.map(layout => layout.attribute)
    : [bufferLayout.name];
}
