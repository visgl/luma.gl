// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {type TypedArray} from '@math.gl/core/types';
import {
  type RenderPipelineProps,
  type RenderPipelineParameters,
  type BufferLayout,
  type TextureFormatColor,
  type TextureFormatDepthStencil,
  type Shader,
  type VertexArray,
  type TransformFeedback,
  type CommandEncoder,
  type AttributeInfo,
  type Binding,
  type BindingsByGroup,
  type ComputeShaderLayout,
  type PrimitiveTopology,
  type ShaderLayout,
  type AttributeShaderType,
  Device,
  Buffer,
  ExternalTexture,
  Texture,
  TextureView,
  RenderPipeline,
  RenderPass,
  PipelineFactory,
  ShaderFactory,
  UniformStore,
  assert,
  log,
  dataTypeDecoder,
  getAttributeInfosFromLayouts,
  normalizeBindingsByGroup
} from '@luma.gl/core';

import type {
  ShaderBindingDebugRow,
  ShaderModule,
  ShaderPlugin,
  GLSLShaderAssembler,
  WGSLShaderAssembler
} from '@luma.gl/shadertools';
import {
  mergeShaderPluginModules,
  resolveShaderPlugins,
  ShaderAssembler
} from '@luma.gl/shadertools';

import {getDebugTableForShaderLayout} from '../debug/debug-shader-layout';
import {debugFramebuffer} from '../debug/debug-framebuffer';
import {deepEqual} from '../utils/deep-equal';
import {BufferLayoutHelper} from '../utils/buffer-layout-helper';
import {sortedBufferLayoutByShaderSourceLocations} from '../utils/buffer-layout-order';
import {
  getShaderModuleUniformBlockLayouts,
  mergeInferredShaderLayout,
  mergeShaderModules,
  mergeShaderModuleBindingsIntoLayout,
  shaderModuleHasUniforms
} from '../utils/shader-module-utils';
import {getPlatformInfo} from '../utils/get-platform-info';
import {uid} from '../utils/uid';
import {
  getGPUVectorModelBatches,
  validateGPUVectorModelLayouts,
  type GPUVectorModelCount,
  type GPUVectorModelData,
  type GPUVectorModelInput,
  type GPUVectorModelInputs,
  type GPUVectorModelDrawBatchesOptions
} from './gpu-vector-model-batches';
export {
  getGPUVectorModelBatches,
  type GPUVectorModelCount,
  type GPUVectorModelData,
  type GPUVectorModelInput,
  type GPUVectorModelInputs,
  type GPUVectorModelBatch,
  type GPUVectorModelDrawBatchesOptions
} from './gpu-vector-model-batches';

import {validateGPUVectorBatchStructure} from '../utils/gpu-vector-batch-structure';
import {drawGPUVectorGroups} from './gpu-vector-draw-batches';
import {GPUVectorGeometry} from '../geometry/gpu-vector-geometry';
import {GPUVectorBindings, type GPUVectorModelAttributes} from './gpu-vector-bindings';
import {ShaderInputs} from '../shader-inputs';
import {
  DynamicBuffer,
  type DynamicBufferRange,
  isBufferRangeBinding,
  resolveBufferRangeBinding
} from '../dynamic-buffer/dynamic-buffer';
import {
  getTextureBindingLayout,
  isTextureBindingSource,
  type TextureBindingSource
} from '../dynamic-texture/texture-binding-source';

const LOG_DRAW_PRIORITY = 2;
const LOG_DRAW_TIMEOUT = 10000;
const PIPELINE_INITIALIZATION_FAILED = 'render pipeline initialization failed';
const DEPTH_STENCIL_ATTACHMENT_FORMATS: TextureFormatDepthStencil[] = [
  'stencil8',
  'depth16unorm',
  'depth24plus',
  'depth24plus-stencil8',
  'depth32float',
  'depth32float-stencil8'
];
/** Resource accepted by one model binding slot. */
export type ModelBinding = Binding | TextureBindingSource | DynamicBuffer | DynamicBufferRange;
type ModelBuffer = Buffer | DynamicBuffer;
/** Shader layout subset needed while resolving texture binding sources. */
export type AnyShaderLayout = Pick<ShaderLayout | ComputeShaderLayout, 'bindings'>;

export type GPUVectorModelProps = Omit<RenderPipelineProps, 'vs' | 'fs' | 'bindings'> & {
  /** GPU-only mesh inputs, indices, and topology. */
  geometry?: GPUVectorGeometry | null;
  /** Supplemental vertex or instance vectors and constants. */
  attributeVectors?: GPUVectorModelAttributes;
  /** Draw count updated from each vector batch. Defaults to `instance`. */
  gpuVectorCount?: GPUVectorModelCount;
  source?: string;
  /** Input language compiled by the application-registered shader assembler transpiler. */
  sourceLanguage?: string;
  vs?: string | null;
  fs?: string | null;

  /** Shadertools shader modules added to shader code. */
  modules?: ShaderModule<any, any, any>[];
  /** Shadertools boolean or numeric preprocessor defines that configure shader code. */
  defines?: Record<string, boolean | number>;
  /** Reusable shader assembly plugins resolved for the active GLSL or WGSL backend. */
  plugins?: ShaderPlugin[];

  /** Shader inputs, used to generate uniform buffers and bindings. */
  shaderInputs?: ShaderInputs;
  /** Shader resource bindings, including dynamic buffers and dynamic textures. */
  bindings?: Record<string, ModelBinding>;
  /** WebGL-only uniforms */
  uniforms?: Record<string, unknown>;
  /** Parameters that are built into the pipeline */
  parameters?: RenderPipelineParameters;

  /** @deprecated Use instanced rendering? Will be auto-detected in 9.1 */
  isInstanced?: boolean;
  /** instance count */
  instanceCount?: number;
  /** Vertex count */
  vertexCount?: number;

  /** Optional index buffer. Dynamic buffers are rebound when resized. */
  indexBuffer?: ModelBuffer | null;
  /** Optional indexed draw count. Defaults to vertexCount, then the full bound index buffer length. */
  indexCount?: number;
  /** First vertex byte offset for WebGL indexed draws or first vertex for non-indexed draws. */
  firstVertex?: number;
  /** First index element for WebGPU indexed draws. */
  firstIndex?: number;
  /** Buffer-valued attributes. Dynamic buffers are rebound when resized. */
  attributes?: Record<string, ModelBuffer>;
  /**   */
  constantAttributes?: Record<string, TypedArray>;

  /** Some applications intentionally supply unused attributes and bindings, and want to disable warnings */
  disableWarnings?: boolean;

  /** @internal For use with {@link TransformFeedback}, WebGL only. */
  varyings?: string[];

  transformFeedback?: TransformFeedback;

  /** Show shader source in browser? */
  debugShaders?: 'never' | 'errors' | 'warnings' | 'always';

  /** Factory used to create a {@link RenderPipeline}. Defaults to {@link Device} default factory. */
  pipelineFactory?: PipelineFactory;
  /** Factory used to create a {@link Shader}. Defaults to {@link Device} default factory. */
  shaderFactory?: ShaderFactory;
  /** Shader assembler. Defaults to the shared assembler for the device's shader language. */
  shaderAssembler?: ShaderAssembler;
};

/**
 * High level draw API for luma.gl.
 *
 * A `GPUVectorModel` encapsulates shaders, geometry attributes, bindings and render
 * pipeline state into a single object. It automatically reuses and rebuilds
 * pipelines as render parameters change and exposes convenient hooks for
 * updating uniforms and attributes.
 *
 * Features:
 * - Reuses and lazily recompiles {@link RenderPipeline | pipelines} as needed.
 * - Integrates with `@luma.gl/shadertools` to assemble GLSL or WGSL from shader modules.
 * - Manages geometry attributes and buffer bindings.
 * - Accepts textures, samplers and uniform buffers as bindings, including texture binding sources.
 * - Provides detailed debug logging and optional shader source inspection.
 */
export class GPUVectorModel {
  /** Creates a model while allowing the backend to compile its render pipeline asynchronously. */
  static async createAsync<ModelType extends GPUVectorModel, Props = GPUVectorModelProps>(
    this: new (
      device: Device,
      props: Props
    ) => ModelType,
    device: Device,
    props: Props
  ): Promise<ModelType> {
    const ownsCompilation = !PipelineFactory.getAsyncCompilation(device);
    const asyncCompilation = ownsCompilation
      ? PipelineFactory.beginAsyncCompilation(device)
      : PipelineFactory.getAsyncCompilation(device)!;
    let model: ModelType;
    try {
      model = new this(device, props);
    } finally {
      if (ownsCompilation) PipelineFactory.endAsyncCompilation(device, asyncCompilation);
    }
    try {
      if (ownsCompilation) {
        await Promise.all(asyncCompilation);
      } else {
        await model._pipelineInitialization;
      }
      return model;
    } catch (error) {
      model.destroy();
      throw error;
    }
  }

  static defaultProps: Required<GPUVectorModelProps> = {
    ...RenderPipeline.defaultProps,
    gpuVectorCount: 'instance',
    geometry: null,
    attributeVectors: undefined!,
    source: undefined!,
    sourceLanguage: undefined!,
    vs: null,
    fs: null,
    id: 'unnamed',
    handle: undefined,
    userData: {},
    defines: {},
    modules: [],
    plugins: [],
    indexBuffer: null,
    indexCount: undefined!,
    firstVertex: 0,
    firstIndex: 0,
    attributes: {},
    constantAttributes: {},
    bindings: {},
    uniforms: {},
    varyings: [],

    isInstanced: undefined!,
    instanceCount: 0,
    vertexCount: 0,

    shaderInputs: undefined!,
    pipelineFactory: undefined!,
    shaderFactory: undefined!,
    transformFeedback: undefined!,
    shaderAssembler: ShaderAssembler.getDefaultShaderAssembler('glsl'),

    debugShaders: undefined!,
    disableWarnings: undefined!
  };

  /** Device that created this model */
  readonly device: Device;
  /** Application provided identifier */
  readonly id: string;
  /** WGSL shader source when using unified shader */
  // @ts-expect-error assigned in function called from constructor
  readonly source: string;
  /** GLSL vertex shader source */
  // @ts-expect-error assigned in function called from constructor
  readonly vs: string;
  /** GLSL fragment shader source */
  // @ts-expect-error assigned in function called from constructor
  readonly fs: string;
  /** Factory used to create render pipelines */
  readonly pipelineFactory: PipelineFactory;
  /** Factory used to create shaders */
  readonly shaderFactory: ShaderFactory;
  /** User-supplied per-model data */
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
  /** Indexed draw count override. Undefined uses vertexCount, then the full bound index buffer. */
  indexCount: number | undefined;
  /** First vertex byte offset for WebGL indexed draws or first vertex for non-indexed draws. */
  firstVertex: number;
  /** First index element for WebGPU indexed draws. */
  firstIndex: number;

  /** Index buffer */
  indexBuffer: Buffer | null = null;
  /** Buffer-valued attributes */
  bufferAttributes: Record<string, Buffer> = {};
  /** Constant-valued attributes */
  constantAttributes: Record<string, TypedArray> = {};
  /** Bindings (textures, samplers, uniform buffers) */
  bindings: Record<string, ModelBinding> = {};

  /**
   * VertexArray
   * @note not implemented: if bufferLayout is updated, vertex array has to be rebuilt!
   * @todo - allow application to define multiple vertex arrays?
   * */
  vertexArray!: VertexArray;

  /** TransformFeedback, WebGL 2 only. */
  transformFeedback: TransformFeedback | null = null;

  /** The underlying GPU "program". @note May be recreated if parameters change */
  pipeline!: RenderPipeline;

  /** ShaderInputs instance */
  // @ts-expect-error Assigned in function called by constructor
  shaderInputs: ShaderInputs;
  // @ts-expect-error Assigned in function called by constructor
  _uniformStore: UniformStore;

  _attributeInfos: Record<string, AttributeInfo> = {};
  protected props: Required<GPUVectorModelProps>;
  private geometryVectorBindings!: GPUVectorBindings;
  private attributeVectorBindings!: GPUVectorBindings;
  private explicitBufferLayout: BufferLayout[] = [];
  private constructorDrawCounts: Pick<GPUVectorModelProps, 'vertexCount' | 'instanceCount'>;
  private constructorDrawOffsets: Pick<GPUVectorModelProps, 'firstVertex' | 'firstIndex'>;
  private drawingVectorBatches = false;
  private indexVector: GPUVectorModelInput | null = null;
  private currentAttributes: NonNullable<GPUVectorModelProps['attributes']> = {};
  private currentAttributeByteOffsets: Record<string, number> = {};
  private _dynamicIndexBufferSource: {source: DynamicBuffer; generation: number} | null = null;
  private _dynamicAttributeBufferSources: Record<
    number,
    {source: DynamicBuffer; generation: number; byteOffset: number}
  > = {};
  private _colorAttachmentFormats: (TextureFormatColor | null)[] | undefined;
  private _depthStencilAttachmentFormat: TextureFormatDepthStencil | undefined;

  _pipelineNeedsUpdate: string | false = 'newly created';
  private _needsRedraw: string | false = 'initializing';
  private _drawBlockedReason: string | false = false;
  private _destroyed = false;
  private _vertexCountSet = false;

  /** "Time" of last draw. Monotonically increasing timestamp */
  _lastDrawTimestamp: number = -1;
  private _bindingTable: ShaderBindingDebugRow[] = [];
  private _pipelineInitialization?: Promise<void>;

  get [Symbol.toStringTag](): string {
    return 'Model';
  }

  toString(): string {
    return `Model(${this.id})`;
  }

  constructor(device: Device, props: GPUVectorModelProps) {
    this.constructorDrawOffsets = {firstVertex: props.firstVertex, firstIndex: props.firstIndex};
    const defaultProps = (this.constructor as typeof GPUVectorModel).defaultProps;
    this.constructorDrawCounts = {
      vertexCount: props.vertexCount ?? (defaultProps.vertexCount || undefined),
      instanceCount: props.instanceCount ?? (defaultProps.instanceCount || undefined)
    };
    const defaultShaderAssembler = defaultProps.shaderAssembler;
    const vertexCountSet = Object.hasOwn(props, 'vertexCount');
    this.props = {
      ...defaultProps,
      ...props,
      shaderAssembler:
        props.shaderAssembler ??
        (isShaderAssemblerForLanguage(defaultShaderAssembler, device.info.shadingLanguage)
          ? defaultShaderAssembler
          : ShaderAssembler.getDefaultShaderAssembler(device.info.shadingLanguage))
    };
    this._vertexCountSet = vertexCountSet;
    props = this.props;
    this.id = props.id || uid('model');
    this.device = device;

    Object.assign(this.userData, props.userData);

    this.vertexCount = this.props.vertexCount;
    this.indexCount = this.props.indexCount;
    this.firstVertex = this.props.firstVertex;
    this.firstIndex = this.props.firstIndex;
    this.instanceCount = this.props.instanceCount;

    this.topology = this.props.topology;
    this.bufferLayout = this.props.bufferLayout;
    this.parameters = this.props.parameters;
    // Seed attachment formats before creating the initial WebGPU pipeline. This is required for
    // depth-only models whose intentional empty color target list must not fall back to the canvas
    // format before the first render pass can synchronize attachment state.
    this._colorAttachmentFormats = this.props.colorAttachmentFormats;
    this._depthStencilAttachmentFormat = this.props.depthStencilAttachmentFormat;

    this.isInstanced = props.isInstanced ?? (props.instanceCount ? true : undefined);
    this.explicitBufferLayout = this.bufferLayout;
    this.geometryVectorBindings = new GPUVectorBindings(device, `${this.id}-geometry`);
    this.attributeVectorBindings = new GPUVectorBindings(device, `${this.id}-attributes`);
    this._initializeProps(props);

    const platformInfo = getPlatformInfo(device);
    const resolvedPlugins = resolveShaderPlugins(this.props.plugins, platformInfo.shaderLanguage);

    // Setup shader module inputs
    const shaderInputModules = mergeShaderPluginModules(
      this.props.modules,
      resolvedPlugins.modules
    );
    const moduleMap = Object.fromEntries(shaderInputModules.map(module => [module.name, module]));

    const shaderInputs =
      props.shaderInputs ||
      new ShaderInputs(moduleMap, {disableWarnings: this.props.disableWarnings});
    if (props.shaderInputs && resolvedPlugins.modules.length > 0) {
      shaderInputs.addModules(resolvedPlugins.modules);
    }
    // @ts-ignore
    this.setShaderInputs(shaderInputs);

    // Setup shader assembler
    const modules = mergeShaderModules(this.props.modules, shaderInputs.getModules());
    const defines = {...resolvedPlugins.defines, ...this.props.defines};

    if (this.device.type === 'webgl') {
      this.props._uniformBlockLayouts = getShaderModuleUniformBlockLayouts(modules);
    }

    this.props.shaderLayout =
      mergeShaderModuleBindingsIntoLayout(this.props.shaderLayout, modules) || null;

    const isWebGPU = this.device.type === 'webgpu';

    // WebGPU
    // TODO - hack to support unified WGSL shader
    // TODO - this is wrong, compile a single shader
    if (isWebGPU && this.props.source) {
      // WGSL
      const shaderAssembler = this.props.shaderAssembler;
      // WGSL sources require an assembler with WGSL-specific hooks and binding state.
      assert(isShaderAssemblerForLanguage(shaderAssembler, 'wgsl'));
      const {
        source,
        getUniforms,
        bindingTable,
        entryPoints = {},
        shaderLayout: assembledShaderLayout
      } = shaderAssembler.assembleWGSLShader({
        platformInfo,
        ...this.props,
        modules,
        defines,
        pluginInjections: resolvedPlugins.injections,
        pluginVertexInputs: resolvedPlugins.vertexInputs,
        pluginVaryings: resolvedPlugins.varyings
      });
      this.source = source;
      this.props.vertexEntryPoint = entryPoints.vertex || this.props.vertexEntryPoint;
      this.props.fragmentEntryPoint = entryPoints.fragment || this.props.fragmentEntryPoint;
      // @ts-expect-error
      this._getModuleUniforms = getUniforms;
      this._bindingTable = bindingTable;
      // Infer the layout after modules have been added so their bindings are included.
      const scannedOrReflectedShaderLayout =
        assembledShaderLayout ??
        (device as Device & {getShaderLayout?: (source: string) => any}).getShaderLayout?.(
          this.source
        );
      const inferredShaderLayout = normalizeShaderPluginAttributeNames(
        scannedOrReflectedShaderLayout,
        resolvedPlugins.vertexInputs
      );
      const shaderLayout = mergeInferredShaderLayout(
        this.props.shaderLayout,
        inferredShaderLayout,
        Object.keys(resolvedPlugins.vertexInputs)
      );
      this.props.shaderLayout =
        mergeShaderModuleBindingsIntoLayout(shaderLayout || null, modules) || null;
    } else {
      // GLSL
      const shaderAssembler = this.props.shaderAssembler;
      // GLSL shader pairs require an assembler with GLSL-specific hooks.
      assert(isShaderAssemblerForLanguage(shaderAssembler, 'glsl'));
      const {vs, fs, getUniforms} = shaderAssembler.assembleGLSLShaderPair({
        platformInfo,
        ...this.props,
        modules,
        defines,
        pluginInjections: resolvedPlugins.injections,
        pluginVertexInputs: resolvedPlugins.vertexInputs,
        pluginVaryings: resolvedPlugins.varyings
      });

      this.vs = vs;
      this.fs = fs;
      // @ts-expect-error
      this._getModuleUniforms = getUniforms;
      this._bindingTable = [];
    }

    this.pipelineFactory =
      props.pipelineFactory || PipelineFactory.getDefaultPipelineFactory(this.device);
    this.shaderFactory = props.shaderFactory || ShaderFactory.getDefaultShaderFactory(this.device);

    const asyncCompilation = PipelineFactory.getAsyncCompilation(this.device);
    if (asyncCompilation) {
      this._pipelineInitialization = this._initializePipelineAsync(props);
      asyncCompilation.push(this._pipelineInitialization);
    } else {
      this.pipeline = this._updatePipeline();
      this._initializePipelineResources(props);
    }
  }

  /** Initializes subclass input policies before shader and pipeline creation. */
  protected _initializeProps(props: GPUVectorModelProps): void {
    if (props.geometry) this.setGeometry(props.geometry);
    if (props.attributeVectors) this.setAttributeVectors(props.attributeVectors);
  }

  /** Whether this model manages the uniform buffer for a shader-input module. */
  protected _usesManagedUniformBuffer(moduleName: string): boolean {
    void moduleName;
    return true;
  }

  private async _initializePipelineAsync(props: GPUVectorModelProps): Promise<void> {
    await this._updatePipelineAsync();
    this._initializePipelineResources(props);
  }

  /** Initializes subclass attributes before explicit constructor bindings are applied. */
  protected _initializeAttributes(): void {
    this.applyVectorAttributes();
    if (this.indexVector) this.bindIndexVector();
  }

  private _initializePipelineResources(props: GPUVectorModelProps): void {
    this.vertexArray = this.device.createVertexArray({
      shaderLayout: this.pipeline.shaderLayout,
      bufferLayout: this.pipeline.bufferLayout
    });
    this._initializeAttributes();
    if (props.indexBuffer) this.setIndexBuffer(props.indexBuffer);
    if (props.indexCount !== undefined) this.setIndexCount(props.indexCount);
    if (this.constructorDrawOffsets.firstVertex !== undefined)
      this.firstVertex = this.constructorDrawOffsets.firstVertex;
    if (this.constructorDrawOffsets.firstIndex !== undefined)
      this.firstIndex = this.constructorDrawOffsets.firstIndex;
    if (props.isInstanced !== undefined) this.isInstanced = props.isInstanced;
    if (this.constructorDrawCounts.instanceCount !== undefined)
      this.setInstanceCount(this.constructorDrawCounts.instanceCount);
    if (this.constructorDrawCounts.vertexCount !== undefined)
      this.setVertexCount(this.constructorDrawCounts.vertexCount);
    if (props.attributes) this.setAttributes(props.attributes);
    if (props.constantAttributes) this.setConstantAttributes(props.constantAttributes);
    if (props.bindings) this.setBindings(props.bindings);
    if (props.transformFeedback) this.transformFeedback = props.transformFeedback;
  }

  destroy(): void {
    if (!this._destroyed) {
      // Release pipeline before we destroy the shaders used by the pipeline
      if (this.pipeline) {
        this.pipelineFactory.release(this.pipeline);
        // Release the shaders
        this.shaderFactory.release(this.pipeline.vs);
        if (this.pipeline.fs && this.pipeline.fs !== this.pipeline.vs) {
          this.shaderFactory.release(this.pipeline.fs);
        }
      }
      this.geometryVectorBindings.destroy();
      this.attributeVectorBindings.destroy();
      this._uniformStore.destroy();
      this._destroyed = true;
    }
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

  /** Returns WGSL binding debug rows for the assembled shader. Returns an empty array for GLSL models. */
  getBindingDebugTable(): readonly ShaderBindingDebugRow[] {
    return this._bindingTable;
  }

  /**
   * Updates uniforms and pipeline state before opening a render pass.
   *
   * @param commandEncoder - Encoder that should own any GPU uploads emitted
   * during draw preparation.
   */
  predraw(commandEncoder: CommandEncoder): void {
    // Update uniform buffers if needed
    this._syncDynamicBuffers();
    this.updateShaderInputs(commandEncoder);
    // Check if the pipeline is invalidated
    this.pipeline = this._updatePipeline();
  }

  /**
   * Issue one draw call.
   * @param renderPass - render pass to draw into
   * @returns `true` if the draw call was executed, `false` if resources were not ready.
   */
  draw(renderPass: RenderPass): boolean {
    if (this.indexVector?.length === 0) {
      this._lastDrawTimestamp = this.device.timestamp;
      this._needsRedraw = false;
      return true;
    }
    if (
      !this.drawingVectorBatches &&
      (this.geometryVectorBindings.batchCount !== 1 ||
        this.attributeVectorBindings.batchCount !== 1)
    ) {
      return this.drawVectorGroups(renderPass);
    }
    if (this._drawBlockedReason && !this._pipelineNeedsUpdate) {
      log.info(LOG_DRAW_PRIORITY, `>>> DRAWING ABORTED ${this.id}: ${this._drawBlockedReason}`)();
      return false;
    }

    const loadingBinding = this._areBindingsLoading();
    if (loadingBinding) {
      log.info(LOG_DRAW_PRIORITY, `>>> DRAWING ABORTED ${this.id}: ${loadingBinding} not loaded`)();
      return false;
    }

    this._syncAttachmentFormats(renderPass);

    try {
      renderPass.pushDebugGroup(`${this}.predraw(${renderPass})`);
      if (this.device.type === 'webgpu') {
        // WebGPU uploads cannot be encoded once the render pass is already open.
        // Keep the implicit draw() path working for existing callers by falling
        // back to immediate writes here; callers that need upload ordering
        // across multiple draws/viewports must call predraw(commandEncoder)
        // before beginRenderPass().
        this.updateShaderInputs();
        this._syncDynamicBuffers();
        this.pipeline = this._updatePipeline();
      } else {
        this.predraw(this.device.commandEncoder);
      }
    } finally {
      renderPass.popDebugGroup();
    }

    let drawSuccess: boolean;
    let pipelineErrored = this.pipeline.isErrored;
    try {
      renderPass.pushDebugGroup(`${this}.draw(${renderPass})`);
      this._logDrawCallStart();

      // Update the pipeline if invalidated
      // TODO - inside RenderPass is likely the worst place to do this from performance perspective.
      // Application can call GPUVectorModel.predraw() to avoid this.
      this.pipeline = this._updatePipeline();
      pipelineErrored = this.pipeline.isErrored;

      if (pipelineErrored) {
        log.info(
          LOG_DRAW_PRIORITY,
          `>>> DRAWING ABORTED ${this.id}: ${PIPELINE_INITIALIZATION_FAILED}`
        )();
        drawSuccess = false;
      } else {
        const drawValidationError = this.vertexArray.getDrawValidationError();
        if (drawValidationError) {
          log.info(LOG_DRAW_PRIORITY, `>>> DRAWING ABORTED ${this.id}: ${drawValidationError}`)();
          this._drawBlockedReason = drawValidationError;
          drawSuccess = false;
        } else {
          const shaderLayout = this._getCurrentShaderLayout();
          const syncBindings = this._getBindings(shaderLayout);
          const syncBindGroups = this._getBindGroups(shaderLayout, syncBindings);

          const {indexBuffer} = this.vertexArray;
          const indexCount = indexBuffer
            ? (this.indexCount ??
              (this._vertexCountSet
                ? this.vertexCount
                : indexBuffer.byteLength / (indexBuffer.indexType === 'uint32' ? 4 : 2)))
            : undefined;

          renderPass.setPipeline(this.pipeline);
          renderPass.setBindings(syncBindGroups, {
            _bindGroupCacheKeys: this._getBindGroupCacheKeys()
          });
          renderPass.setVertexArray(this.vertexArray);
          const hasNoInstances = this.isInstanced === true && this.instanceCount === 0;
          drawSuccess = hasNoInstances
            ? true
            : renderPass.draw({
                isInstanced: this.isInstanced,
                vertexCount: this.vertexCount,
                instanceCount: this.isInstanced ? this.instanceCount : undefined,
                indexCount,
                firstVertex: this.firstVertex,
                firstIndex: this.firstIndex,
                transformFeedback: this.transformFeedback || undefined,
                uniforms: this.props.uniforms,
                // WebGL shares underlying cached programs even for models that have different
                // parameters and topology, so those compatibility overrides remain per draw.
                parameters: this.parameters,
                topology: this.topology
              });
        }
      }
    } finally {
      renderPass.popDebugGroup();
      this._logDrawCallEnd();
    }
    this._logFramebuffer(renderPass);

    // Update needsRedraw flag
    if (drawSuccess) {
      this._lastDrawTimestamp = this.device.timestamp;
      this._needsRedraw = false;
    } else if (pipelineErrored) {
      this._needsRedraw = PIPELINE_INITIALIZATION_FAILED;
      this._drawBlockedReason = PIPELINE_INITIALIZATION_FAILED;
    } else if (this._drawBlockedReason) {
      this._needsRedraw = this._drawBlockedReason;
    } else {
      this._needsRedraw = 'waiting for resource initialization';
    }
    return drawSuccess;
  }

  /** Binds a GPU-only mesh. CPU geometry adaptation belongs in Model. */
  setGeometry(geometry: GPUVectorGeometry | null): void {
    if (geometry) this.setTopology(geometry.topology);
    this.setGeometryVectors(geometry?.attributes ?? {}, geometry?.bufferLayout);
    this.setIndexVector(geometry?.indices ?? null);
    if (geometry?.vertexCount !== undefined) this.setVertexCount(geometry.vertexCount);
  }

  /** Replaces per-vertex mesh vectors while preserving supplemental attributes. */
  setGeometryVectors(vectors: GPUVectorModelAttributes, bufferLayouts?: BufferLayout[]): void {
    bufferLayouts ??=
      this.getExplicitVectorLayouts(vectors) ??
      this.getExplicitVectorLayouts(vectors, this.geometryVectorBindings.sourceLayouts);
    validateGPUVectorBatchStructure(vectors);
    if (!this.isInstanced || this.attributeVectorBindings.vertexCount !== undefined)
      validateGPUVectorBatchStructure([
        ...Object.values(vectors),
        ...Object.values(this.attributeVectorBindings.inputs)
      ]);
    this.geometryVectorBindings.setInputs(vectors, bufferLayouts, 'vertex');
    this.claimVectorLayouts(this.geometryVectorBindings);
    this.syncVectorBindings();
    const rowCount = this.geometryVectorBindings.rowCount;
    assert(
      rowCount === undefined ||
        this.attributeVectorBindings.vertexCount === undefined ||
        rowCount === this.attributeVectorBindings.vertexCount
    );
    this.setVertexCount(rowCount ?? this.attributeVectorBindings.vertexCount ?? 0);
  }

  /** Replaces supplemental vectors; instanced models default these inputs to instance step mode. */
  setAttributeVectors(vectors: GPUVectorModelAttributes, bufferLayouts?: BufferLayout[]): void {
    bufferLayouts ??=
      this.getExplicitVectorLayouts(vectors) ??
      this.getExplicitVectorLayouts(vectors, this.attributeVectorBindings.sourceLayouts);
    if (
      this.isInstanced === undefined &&
      (bufferLayouts?.some(layout => layout.stepMode === 'instance') ||
        Object.values(vectors).some(
          vector => vector && 'data' in vector && vector.bufferLayout?.stepMode === 'instance'
        ))
    )
      this.isInstanced = true;
    const usesVertexRows =
      !this.isInstanced ||
      Object.entries(vectors).some(
        ([name, vector]) =>
          vector &&
          'data' in vector &&
          (bufferLayouts?.find(
            layout =>
              layout.name === name ||
              layout.attributes?.some(attribute => attribute.attribute === name)
          )?.stepMode ?? vector.bufferLayout?.stepMode) === 'vertex'
      );
    if (usesVertexRows)
      validateGPUVectorBatchStructure([
        ...Object.values(this.geometryVectorBindings.inputs),
        ...Object.values(vectors)
      ]);
    this.attributeVectorBindings.setInputs(
      vectors,
      bufferLayouts,
      this.isInstanced ? 'instance' : 'vertex'
    );
    this.claimVectorLayouts(this.attributeVectorBindings);
    this.syncVectorBindings();
    if (this.attributeVectorBindings.instanceCount !== undefined)
      this.setInstanceCount(this.attributeVectorBindings.instanceCount);
    const vertexCount = this.attributeVectorBindings.vertexCount;
    if (vertexCount !== undefined) {
      const geometryRowCount = this.geometryVectorBindings.rowCount;
      // Supplemental vertex columns describe the same rows as the geometry columns.
      assert(geometryRowCount === undefined || geometryRowCount === vertexCount);
      if (geometryRowCount === undefined) this.setVertexCount(vertexCount);
    }
  }

  /** Binds typed columns using caller-resolved layouts, including packed groups. */
  setGPUAttributes(vectors: GPUVectorModelAttributes, bufferLayouts: BufferLayout[]): void {
    this.setAttributeVectors(vectors, bufferLayouts);
  }

  /** Replaces the borrowed contiguous uint16/uint32 index vector. */
  setIndexVector(vector: GPUVectorModelInput | null): void {
    if (vector) {
      // Indexed draws consume one contiguous, tightly packed index stream.
      assert(vector.format === 'uint8' || vector.format === 'uint16' || vector.format === 'uint32');
      assert(vector.data.length <= 1);
      assert(
        vector.byteStride === (vector.format === 'uint32' ? 4 : vector.format === 'uint16' ? 2 : 1)
      );
    }
    this.indexVector = vector;
    if (this.vertexArray) this.bindIndexVector();
  }

  private bindIndexVector(): void {
    const vector = this.indexVector;
    const chunk = vector?.data[0];
    if (chunk && this.indexVector) {
      const buffer = chunk.buffer instanceof DynamicBuffer ? chunk.buffer.buffer : chunk.buffer;
      // Core index-buffer metadata must agree with the vector format and aligned byte offset.
      assert(
        buffer.indexType === this.indexVector.format &&
          chunk.byteOffset % this.indexVector.byteStride === 0
      );
    }
    this.indexVector = null;
    this.setIndexBuffer(chunk?.buffer ?? null);
    this.indexVector = vector;
    this.indexCount = vector?.length;
    this.setDrawOffsets({
      firstVertex: chunk?.byteOffset ?? 0,
      firstIndex: chunk ? chunk.byteOffset / this.indexVector!.byteStride : 0
    });
  }

  private claimVectorLayouts(group: GPUVectorBindings): void {
    this.explicitBufferLayout = this.explicitBufferLayout.filter(
      layout =>
        !group.claimedNames.has(layout.name) &&
        !layout.attributes?.some(attribute => group.claimedNames.has(attribute.attribute))
    );
  }

  private getExplicitVectorLayouts(
    vectors: GPUVectorModelAttributes,
    sourceLayouts: BufferLayout[] = this.explicitBufferLayout
  ): BufferLayout[] | undefined {
    const names = new Set(Object.keys(vectors));
    const layouts = sourceLayouts.filter(
      layout =>
        names.has(layout.name) ||
        layout.attributes?.some(attribute => names.has(attribute.attribute))
    );
    return layouts.length ? layouts : undefined;
  }

  private getVectorBufferLayout(): BufferLayout[] {
    const groups = [this.geometryVectorBindings, this.attributeVectorBindings];
    const explicitLayouts = this.explicitBufferLayout.filter(
      layout =>
        !groups.some(
          group =>
            group.claimedNames.has(layout.name) ||
            layout.attributes?.some(attribute => group.claimedNames.has(attribute.attribute))
        )
    );
    return [
      ...explicitLayouts,
      ...this.geometryVectorBindings.layouts,
      ...this.attributeVectorBindings.layouts
    ];
  }

  private syncVectorBindings(): void {
    const layouts = this.getVectorBufferLayout();
    if (this.vertexArray) {
      this.applyBufferLayout(layouts);
      this.applyVectorAttributes();
    } else this.bufferLayout = layouts;
  }

  private applyVectorAttributes(): void {
    const activeNames = new Set(this.bufferLayout.map(layout => layout.name));
    for (const name of Object.keys(this.currentAttributes)) {
      if (!activeNames.has(name)) delete this.currentAttributes[name];
    }
    this.setAttributes(
      {
        ...this.currentAttributes,
        ...this.geometryVectorBindings.buffers,
        ...this.attributeVectorBindings.buffers
      },
      {
        byteOffsets: {
          ...this.currentAttributeByteOffsets,
          ...this.geometryVectorBindings.byteOffsets,
          ...this.attributeVectorBindings.byteOffsets
        },
        disableWarnings: true
      }
    );
    if (this.device.type === 'webgl')
      this.setConstantAttributes({
        ...this.geometryVectorBindings.constants,
        ...this.attributeVectorBindings.constants
      });
  }

  /** Binds contiguous borrowed vectors; use drawBatches() for multi-chunk inputs. */
  setGPUVectors(vectors: GPUVectorModelInputs, options?: {count?: GPUVectorModelCount}): void {
    const batches = getGPUVectorModelBatches(this.id, vectors);
    // Direct binding requires one physical chunk per vector; never concatenate implicitly.
    assert(batches.length <= 1);
    validateGPUVectorModelLayouts(this.id, vectors, this.bufferLayout);
    if (batches[0]) this.setGPUData(batches[0].data);
    this.setBatchDrawCount(batches[0]?.rowCount ?? 0, options?.count);
  }

  private drawVectorGroups(renderPass: RenderPass): boolean {
    const drawingVectorBatches = this.drawingVectorBatches;
    const vertexCountSet = this._vertexCountSet;
    this.drawingVectorBatches = true;
    try {
      const success = drawGPUVectorGroups(
        this,
        this.geometryVectorBindings,
        this.attributeVectorBindings,
        () => this.syncVectorBindings(),
        () => GPUVectorModel.prototype.draw.call(this, renderPass)
      );
      if (success) {
        this._lastDrawTimestamp = this.device.timestamp;
        this._needsRedraw = false;
      }
      return success;
    } finally {
      this._vertexCountSet = vertexCountSet;
      this.drawingVectorBatches = drawingVectorBatches;
    }
  }

  /** Draws each aligned physical chunk without retaining or taking ownership of input vectors. */
  drawBatches<Inputs extends GPUVectorModelInputs = GPUVectorModelInputs>(
    renderPass: RenderPass,
    {vectors, onBatch}: GPUVectorModelDrawBatchesOptions<Inputs>
  ): boolean {
    const batches = getGPUVectorModelBatches(this.id, vectors);
    validateGPUVectorModelLayouts(this.id, vectors, this.bufferLayout);
    for (const name of Object.keys(vectors)) {
      // Transient batches replace existing attributes so every binding can be restored afterward.
      assert(!vectors[name] || this.currentAttributes[name]);
    }
    const previousAttributes = {...this.currentAttributes};
    const previousAttributeByteOffsets = {...this.currentAttributeByteOffsets};
    const previousBindings = {...this.bindings};
    const previousInstanceCount = this.instanceCount;
    const previousVertexCount = this.vertexCount;
    const previousIsInstanced = this.isInstanced;
    const previousVertexCountSet = this._vertexCountSet;
    const drawingVectorBatches = this.drawingVectorBatches;
    this.drawingVectorBatches = true;
    let drawSuccess = true;
    try {
      for (const batch of batches) {
        this.setGPUData(batch.data);
        this.setBatchDrawCount(batch.rowCount);
        onBatch?.(batch);
        drawSuccess = GPUVectorModel.prototype.draw.call(this, renderPass) && drawSuccess;
      }
    } finally {
      this.setAttributes(previousAttributes, {byteOffsets: previousAttributeByteOffsets});
      for (const name of Object.keys(this.bindings)) {
        if (!(name in previousBindings)) delete this.bindings[name];
      }
      this.setBindings(previousBindings);
      this.setInstanceCount(previousInstanceCount);
      this.setVertexCount(previousVertexCount);
      this.isInstanced = previousIsInstanced;
      this._vertexCountSet = previousVertexCountSet;
      this.drawingVectorBatches = drawingVectorBatches;
    }
    return drawSuccess;
  }

  private setGPUData(data: Record<string, GPUVectorModelData>): void {
    this.setAttributes(
      Object.fromEntries(Object.entries(data).map(([name, chunk]) => [name, chunk.buffer])),
      {
        byteOffsets: Object.fromEntries(
          Object.entries(data).map(([name, chunk]) => {
            const layout = this.bufferLayout.find(layout => layout.name === name);
            const byteOffset = chunk.byteOffset - (layout?.attributes?.[0]?.byteOffset ?? 0);
            // The layout offset and binding offset together address the start of the chunk.
            assert(byteOffset >= 0);
            return [name, byteOffset];
          })
        )
      }
    );
  }

  private setBatchDrawCount(
    rowCount: number,
    count: GPUVectorModelCount = this.props.gpuVectorCount
  ): void {
    if (count === 'instance') {
      this.setInstanceCount(rowCount);
    } else if (count === 'vertex') {
      this.setVertexCount(rowCount);
    }
  }

  // Update fixed fields (can trigger pipeline rebuild)

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
    this.explicitBufferLayout = bufferLayout;
    const geometry = this.geometryVectorBindings;
    const attributes = this.attributeVectorBindings;
    const geometryLayouts =
      this.getExplicitVectorLayouts(geometry.inputs) ?? geometry.sourceLayouts;
    const attributeLayouts =
      this.getExplicitVectorLayouts(attributes.inputs) ?? attributes.sourceLayouts;
    geometry.setInputs(geometry.inputs, geometryLayouts, 'vertex');
    attributes.setInputs(
      attributes.inputs,
      attributeLayouts,
      this.isInstanced ? 'instance' : 'vertex'
    );
    if (!this.isInstanced || attributes.vertexCount !== undefined)
      validateGPUVectorBatchStructure([
        ...Object.values(geometry.inputs),
        ...Object.values(attributes.inputs)
      ]);
    this.claimVectorLayouts(geometry);
    this.claimVectorLayouts(attributes);
    this.applyBufferLayout(this.getVectorBufferLayout());
  }

  private applyBufferLayout(nextBufferLayout: BufferLayout[]): void {
    nextBufferLayout = sortedBufferLayoutByShaderSourceLocations(
      this.pipeline.shaderLayout,
      nextBufferLayout
    );
    if (deepEqual(nextBufferLayout, this.bufferLayout, -1)) {
      return;
    }

    this.bufferLayout = nextBufferLayout;
    this._setPipelineNeedsUpdate('bufferLayout');

    // Recreate the pipeline
    this.pipeline = this._updatePipeline();

    // vertex array needs to be updated if we update buffer layout,
    // but not if we update parameters
    this.vertexArray = this.device.createVertexArray({
      shaderLayout: this.pipeline.shaderLayout,
      bufferLayout: this.pipeline.bufferLayout
    });
    this._dynamicAttributeBufferSources = {};
    this.applyVectorAttributes();
    if (this.indexBuffer) this.vertexArray.setIndexBuffer(this.indexBuffer);
  }

  /**
   * Set GPU parameters.
   * @note Can trigger a pipeline rebuild / pipeline cache fetch on WebGPU.
   * On WebGL, parameters are applied at each draw call, so the pipeline is kept.
   * @param parameters
   */
  setParameters(parameters: RenderPipelineParameters) {
    if (!deepEqual(parameters, this.parameters, 2)) {
      this.parameters = parameters;
      if (this.device.type === 'webgl') {
        this.setNeedsRedraw('parameters');
      } else {
        this._setPipelineNeedsUpdate('parameters');
      }
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
    this._vertexCountSet = true;
    this.setNeedsRedraw('vertexCount');
  }

  /** Updates the indexed draw count override. */
  setIndexCount(indexCount: number | undefined): void {
    this.indexCount = indexCount;
    this.setNeedsRedraw('indexCount');
  }

  /** Updates the first indexed/non-indexed draw offsets. */
  setDrawOffsets({firstVertex, firstIndex}: {firstVertex: number; firstIndex: number}): void {
    this.firstVertex = firstVertex;
    this.firstIndex = firstIndex;
    this.setNeedsRedraw('drawOffsets');
  }

  /** Set the shader inputs */
  setShaderInputs(shaderInputs: ShaderInputs): void {
    this.shaderInputs = shaderInputs;
    this._uniformStore = new UniformStore(this.device, this.shaderInputs.modules);
    // Create uniform buffer bindings for all modules that actually have uniforms
    for (const [moduleName, module] of Object.entries(this.shaderInputs.modules)) {
      if (shaderModuleHasUniforms(module) && this._usesManagedUniformBuffer(moduleName)) {
        const uniformBuffer = this._uniformStore.getManagedUniformBuffer(moduleName);
        this.bindings[`${moduleName}Uniforms`] = uniformBuffer;
      }
    }
    this.setNeedsRedraw('shaderInputs');
  }

  /** Update uniform buffers from the model's shader inputs */
  /**
   * Flushes current shader-input values into managed uniform buffers and
   * resource bindings.
   *
   * @param commandEncoder - Optional encoder used to order uniform uploads with
   * subsequent draw commands.
   */
  updateShaderInputs(commandEncoder?: CommandEncoder): void {
    this._uniformStore.setUniforms(this.shaderInputs.getUniformValues(), commandEncoder);
    this.setBindings(this._getShaderInputBindings());
    // TODO - this is already tracked through buffer/texture update times?
    this.setNeedsRedraw('shaderInputs');
  }

  /** Resolves resource bindings supplied by shader inputs. */
  protected _getShaderInputBindings(): Record<string, ModelBinding> {
    return this.shaderInputs.getBindingValues();
  }

  /**
   * Sets bindings (textures, samplers, uniform buffers)
   */
  setBindings(bindings: Record<string, ModelBinding>): void {
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
  setIndexBuffer(indexBuffer: ModelBuffer | null): void {
    if (this.indexVector) {
      this.indexCount = undefined;
      this.firstVertex = 0;
      this.firstIndex = 0;
    }
    this.indexVector = null;
    const resolvedIndexBuffer =
      indexBuffer instanceof DynamicBuffer ? indexBuffer.buffer : indexBuffer;
    this.indexBuffer = resolvedIndexBuffer;
    this._dynamicIndexBufferSource =
      indexBuffer instanceof DynamicBuffer
        ? {source: indexBuffer, generation: indexBuffer.generation}
        : null;
    this.vertexArray.setIndexBuffer(resolvedIndexBuffer);
    this.setNeedsRedraw('indexBuffer');
  }

  /**
   * Sets attributes (buffers)
   * @param options.byteOffsets Optional byte offsets, keyed by buffer name, where each buffer's
   * vertex data starts. Buffers without an entry are bound at offset 0.
   * @note Overrides any attributes previously set with the same name
   */
  setAttributes(
    buffers: Record<string, ModelBuffer>,
    options?: {disableWarnings?: boolean; byteOffsets?: Record<string, number>}
  ): void {
    Object.assign(this.currentAttributes, buffers);
    for (const name of Object.keys(buffers)) {
      this.currentAttributeByteOffsets[name] = options?.byteOffsets?.[name] ?? 0;
    }
    this._drawBlockedReason = false;
    const disableWarnings = options?.disableWarnings ?? this.props.disableWarnings;
    if (buffers['indices']) {
      log.warn(
        `Model:${this.id} setAttributes() - indexBuffer should be set using setIndexBuffer()`
      )();
    }

    // ensure bufferLayout order matches source layout so we bind
    // the correct buffers to the correct indices in webgpu.
    this.bufferLayout = sortedBufferLayoutByShaderSourceLocations(
      this.pipeline.shaderLayout,
      this.bufferLayout
    );
    const bufferLayoutHelper = new BufferLayoutHelper(this.bufferLayout);

    // Check if all buffers have a layout
    for (const [bufferName, buffer] of Object.entries(buffers)) {
      const resolvedBuffer = buffer instanceof DynamicBuffer ? buffer.buffer : buffer;
      const bufferLayout = bufferLayoutHelper.getBufferLayout(bufferName);
      if (!bufferLayout) {
        if (!disableWarnings) {
          log.warn(`Model(${this.id}): Missing layout for buffer "${bufferName}".`)();
        }
        continue; // eslint-disable-line no-continue
      }

      // In WebGL, for an interleaved attribute we may need to set multiple attributes
      // but in WebGPU, we set it according to the buffer's position in the vertexArray
      const attributeNames = bufferLayoutHelper.getAttributeNamesForBuffer(bufferLayout);
      let set = false;
      for (const attributeName of attributeNames) {
        const attributeInfo = this._attributeInfos[attributeName];
        if (attributeInfo) {
          const bufferSlot =
            this.device.type === 'webgpu'
              ? this.vertexArray.getBufferSlot(attributeInfo.bufferName)
              : attributeInfo.location;
          if (bufferSlot === null) {
            if (!disableWarnings) {
              log.warn(
                `Model(${this.id}): Missing vertex array slot for buffer "${attributeInfo.bufferName}".`
              )();
            }
            continue; // eslint-disable-line no-continue
          }

          const byteOffset = options?.byteOffsets?.[bufferName] ?? 0;
          this.vertexArray.setBuffer(bufferSlot, resolvedBuffer, byteOffset);
          if (buffer instanceof DynamicBuffer) {
            this._dynamicAttributeBufferSources[bufferSlot] = {
              source: buffer,
              generation: buffer.generation,
              byteOffset
            };
          } else {
            delete this._dynamicAttributeBufferSources[bufferSlot];
          }
          set = true;
        }
      }
      if (!set && !disableWarnings) {
        log.warn(
          `Model(${this.id}): Ignoring buffer "${resolvedBuffer.id}" for unknown attribute "${bufferName}"`
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

  // INTERNAL METHODS

  /** Check that bindings are loaded. Returns id of first binding that is still loading. */
  _areBindingsLoading(): string | false {
    for (const binding of Object.values(this.bindings)) {
      if (isTextureBindingSource(binding) && !binding.isReady) {
        return binding.id;
      }
    }
    return false;
  }

  /**
   * Resolves ready model bindings for the current shader layout.
   * @param shaderLayout Reflected bindings used to select copied or external texture resolution.
   */
  _getBindings(
    shaderLayout: AnyShaderLayout = this._getCurrentShaderLayout()
  ): Record<string, Binding> {
    const validBindings: Record<string, Binding> = {};

    for (const [name, binding] of Object.entries(this.bindings)) {
      const resolvedBinding = resolveModelBinding(name, binding, shaderLayout);
      if (resolvedBinding) {
        validBindings[name] = resolvedBinding;
      }
    }

    return validBindings;
  }

  /**
   * Groups resolved resource bindings for the current shader layout.
   * @param shaderLayout Reflected bindings used to group logical binding names.
   * @param bindings GPUVectorModel bindings already resolved for this draw preparation.
   */
  _getBindGroups(
    shaderLayout: AnyShaderLayout = this._getCurrentShaderLayout(),
    bindings: Record<string, Binding> = this._getBindings(shaderLayout)
  ): BindingsByGroup {
    return shaderLayout.bindings.length
      ? normalizeBindingsByGroup(shaderLayout, bindings)
      : {0: bindings};
  }

  _getBindGroupCacheKeys(): Partial<Record<number, object>> {
    return {};
  }

  /** Get the timestamp of the latest updated bound GPU memory resource (buffer/texture). */
  _getBindingsUpdateTimestamp(): number {
    let timestamp = 0;
    if (this._dynamicIndexBufferSource) {
      timestamp = Math.max(timestamp, this._dynamicIndexBufferSource.source.updateTimestamp);
    }
    for (const entry of Object.values(this._dynamicAttributeBufferSources)) {
      timestamp = Math.max(timestamp, entry.source.updateTimestamp);
    }
    for (const binding of Object.values(this.bindings)) {
      if (binding instanceof TextureView) {
        timestamp = Math.max(timestamp, binding.texture.updateTimestamp);
      } else if (
        binding instanceof Buffer ||
        binding instanceof Texture ||
        binding instanceof ExternalTexture
      ) {
        timestamp = Math.max(timestamp, binding.updateTimestamp);
      } else if (binding instanceof DynamicBuffer) {
        timestamp = Math.max(timestamp, binding.updateTimestamp);
      } else if (isTextureBindingSource(binding)) {
        timestamp = binding.isReady
          ? Math.max(timestamp, binding.updateTimestamp)
          : // The texture will become available in the future
            Infinity;
      } else if (isBufferRangeBinding(binding)) {
        timestamp = Math.max(
          timestamp,
          binding.buffer instanceof DynamicBuffer
            ? binding.buffer.updateTimestamp
            : binding.buffer.updateTimestamp
        );
      }
    }
    return timestamp;
  }

  /** Mark pipeline as needing update */
  _setPipelineNeedsUpdate(reason: string): void {
    this._pipelineNeedsUpdate ||= reason;
    this._drawBlockedReason = false;
    this.setNeedsRedraw(reason);
  }

  /** Update pipeline if needed */
  _updatePipeline(): RenderPipeline {
    const update = this._preparePipelineUpdate();
    if (update) {
      this.pipeline = this.pipelineFactory.createRenderPipeline(update.props);
      this._finishPipelineUpdate(update);
    }
    return this.pipeline;
  }

  /** Creates or replaces the render pipeline through the backend's asynchronous compilation path. */
  async _updatePipelineAsync(): Promise<RenderPipeline> {
    const update = this._preparePipelineUpdate();
    if (update) {
      try {
        this.pipeline = await this.pipelineFactory.createRenderPipelineAsync(update.props);
      } catch (error) {
        this._releasePipelineShaders(update.vertexShader, update.fragmentShader);
        this._pipelineNeedsUpdate = 'asynchronous pipeline creation failed';
        throw error;
      }
      this._finishPipelineUpdate(update);
    }
    return this.pipeline;
  }

  private _preparePipelineUpdate(): {
    props: RenderPipelineProps;
    vertexShader: Shader;
    fragmentShader: Shader | null;
    previousVertexShader: Shader | null;
    previousFragmentShader: Shader | null;
  } | null {
    if (!this._pipelineNeedsUpdate) return null;
    const previousVertexShader = this.pipeline?.vs ?? null;
    const previousFragmentShader = this.pipeline?.fs ?? null;
    if (this.pipeline) {
      log.log(
        1,
        `GPUVectorModel ${this.id}: Recreating pipeline because "${this._pipelineNeedsUpdate}".`
      )();
    }
    this._pipelineNeedsUpdate = false;

    const vertexShader = this.shaderFactory.createShader({
      id: `${this.id}-vertex`,
      stage: 'vertex',
      source: this.source || this.vs,
      debugShaders: this.props.debugShaders
    });
    let fragmentShader: Shader | null = null;
    if (this.source) {
      fragmentShader = vertexShader;
    } else if (this.fs) {
      fragmentShader = this.shaderFactory.createShader({
        id: `${this.id}-fragment`,
        stage: 'fragment',
        source: this.fs,
        debugShaders: this.props.debugShaders
      });
    }
    return {
      props: {
        ...this.props,
        bindings: undefined,
        bufferLayout: this.bufferLayout,
        colorAttachmentFormats: this._colorAttachmentFormats,
        depthStencilAttachmentFormat: this._depthStencilAttachmentFormat,
        topology: this.topology,
        parameters: this.parameters,
        bindGroups: undefined,
        vs: vertexShader,
        fs: fragmentShader
      },
      vertexShader,
      fragmentShader,
      previousVertexShader,
      previousFragmentShader
    };
  }

  private _finishPipelineUpdate(update: {
    previousVertexShader: Shader | null;
    previousFragmentShader: Shader | null;
  }): void {
    this._attributeInfos = getAttributeInfosFromLayouts(
      this.pipeline.shaderLayout,
      this.bufferLayout
    );
    this._releasePipelineShaders(update.previousVertexShader, update.previousFragmentShader);
  }

  private _releasePipelineShaders(
    vertexShader: Shader | null,
    fragmentShader: Shader | null
  ): void {
    if (vertexShader) this.shaderFactory.release(vertexShader);
    if (fragmentShader && fragmentShader !== vertexShader) {
      this.shaderFactory.release(fragmentShader);
    }
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
    const framebuffer = renderPass.props.framebuffer;
    debugFramebuffer(renderPass, framebuffer, {
      id: framebuffer?.id || `${this.id}-framebuffer`,
      minimap: true
    });
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
      table['indices'] = {
        name: 'indices',
        type: indexBuffer.indexType,
        values: values.toString()
      };
    }
    return table;
  }

  // TODO - fix typing of luma data types
  _getBufferOrConstantValues(attribute: Buffer | TypedArray, dataType: any): string {
    const TypedArrayConstructor = dataTypeDecoder.getTypedArrayConstructor(dataType);
    const typedArray =
      attribute instanceof Buffer ? new TypedArrayConstructor(attribute.debugData) : attribute;
    return typedArray.toString();
  }

  /** Returns the current reflected shader layout or the pre-reflection empty layout. */
  protected _getCurrentShaderLayout(): AnyShaderLayout {
    return this.pipeline?.shaderLayout || this.props.shaderLayout || {bindings: []};
  }

  private _syncDynamicBuffers(): void {
    if (
      this._dynamicIndexBufferSource &&
      this._dynamicIndexBufferSource.generation !== this._dynamicIndexBufferSource.source.generation
    ) {
      const resolvedIndexBuffer = this._dynamicIndexBufferSource.source.buffer;
      this.indexBuffer = resolvedIndexBuffer;
      this.vertexArray.setIndexBuffer(resolvedIndexBuffer);
      this._dynamicIndexBufferSource.generation = this._dynamicIndexBufferSource.source.generation;
      this.setNeedsRedraw('dynamic index buffer');
    }

    for (const [locationKey, entry] of Object.entries(this._dynamicAttributeBufferSources)) {
      if (entry.generation !== entry.source.generation) {
        this.vertexArray.setBuffer(Number(locationKey), entry.source.buffer, entry.byteOffset);
        entry.generation = entry.source.generation;
        this.setNeedsRedraw('dynamic attribute buffer');
      }
    }
  }
  private _syncAttachmentFormats(renderPass: RenderPass): void {
    if (this.device.type !== 'webgpu') {
      return;
    }

    const framebuffer =
      (
        renderPass as RenderPass & {
          framebuffer?: {
            colorAttachments?: Array<{texture?: {format?: TextureFormatColor}} | null>;
            depthStencilAttachment?: {texture?: {format?: TextureFormatDepthStencil}} | null;
          };
        }
      ).framebuffer || renderPass.props.framebuffer;
    const renderBundleProps = renderPass.props as RenderPass['props'] & {
      colorAttachmentFormats?: (TextureFormatColor | null)[];
      depthStencilAttachmentFormat?: TextureFormatDepthStencil | false;
    };

    const nextColorAttachmentFormats =
      renderBundleProps.colorAttachmentFormats ??
      framebuffer?.colorAttachments?.map(colorAttachment =>
        asColorAttachmentFormat(colorAttachment?.texture?.format)
      );
    const nextDepthStencilAttachmentFormat =
      renderBundleProps.depthStencilAttachmentFormat === false
        ? undefined
        : (renderBundleProps.depthStencilAttachmentFormat ??
          asDepthStencilAttachmentFormat(framebuffer?.depthStencilAttachment?.texture?.format));

    if (
      !deepEqual(this._colorAttachmentFormats, nextColorAttachmentFormats, 1) ||
      this._depthStencilAttachmentFormat !== nextDepthStencilAttachmentFormat
    ) {
      this._colorAttachmentFormats = nextColorAttachmentFormats;
      this._depthStencilAttachmentFormat = nextDepthStencilAttachmentFormat;
      this._setPipelineNeedsUpdate('attachment formats');
    }
  }
}

// HELPERS

function isShaderAssemblerForLanguage(
  shaderAssembler: ShaderAssembler,
  shaderLanguage: 'glsl'
): shaderAssembler is GLSLShaderAssembler;
function isShaderAssemblerForLanguage(
  shaderAssembler: ShaderAssembler,
  shaderLanguage: 'wgsl'
): shaderAssembler is WGSLShaderAssembler;
function isShaderAssemblerForLanguage(
  shaderAssembler: ShaderAssembler,
  shaderLanguage: 'glsl' | 'wgsl'
): shaderAssembler is GLSLShaderAssembler | WGSLShaderAssembler;
function isShaderAssemblerForLanguage(
  shaderAssembler: ShaderAssembler,
  shaderLanguage: 'glsl' | 'wgsl'
): boolean {
  if (
    shaderAssembler.shaderLanguage !== undefined &&
    shaderAssembler.shaderLanguage !== shaderLanguage
  ) {
    return false;
  }

  return shaderLanguage === 'glsl'
    ? 'assembleGLSLShaderPair' in shaderAssembler &&
        typeof shaderAssembler.assembleGLSLShaderPair === 'function'
    : 'assembleWGSLShader' in shaderAssembler &&
        typeof shaderAssembler.assembleWGSLShader === 'function';
}

function normalizeShaderPluginAttributeNames(
  shaderLayout: ShaderLayout | null | undefined,
  vertexInputs: Record<string, AttributeShaderType>
): ShaderLayout | null | undefined {
  if (!shaderLayout || Object.keys(vertexInputs).length === 0) {
    return shaderLayout;
  }

  return {
    ...shaderLayout,
    attributes: shaderLayout.attributes.map(attribute => {
      const publicName = attribute.name.startsWith('_luma_')
        ? attribute.name.slice('_luma_'.length)
        : null;
      return publicName && vertexInputs[publicName] ? {...attribute, name: publicName} : attribute;
    })
  };
}

/**
 * Resolves one model binding against the current shader layout.
 * @param bindingName Logical model binding name.
 * @param binding GPUVectorModel binding or deferred engine binding source.
 * @param shaderLayout Reflected bindings used to select copied or external texture resolution.
 * @returns Concrete core binding, or `null` while a deferred source is unavailable.
 */
function resolveModelBinding(
  bindingName: string,
  binding: ModelBinding,
  shaderLayout: AnyShaderLayout
): Binding | null {
  if (isTextureBindingSource(binding)) {
    const bindingLayout = getTextureBindingLayout(shaderLayout, bindingName, {
      fallbackGroup: 0
    });
    return bindingLayout ? binding.resolveTextureBinding(bindingLayout) : null;
  }

  if (binding instanceof DynamicBuffer) {
    return binding.buffer;
  }

  if (isBufferRangeBinding(binding)) {
    return resolveBufferRangeBinding(binding);
  }

  return binding;
}
function asColorAttachmentFormat(format?: string | null): TextureFormatColor | null {
  return format && !isDepthStencilAttachmentFormat(format) ? (format as TextureFormatColor) : null;
}

function asDepthStencilAttachmentFormat(
  format?: string | null
): TextureFormatDepthStencil | undefined {
  return format && isDepthStencilAttachmentFormat(format) ? format : undefined;
}

function isDepthStencilAttachmentFormat(format: string): format is TextureFormatDepthStencil {
  return DEPTH_STENCIL_ATTACHMENT_FORMATS.includes(format as TextureFormatDepthStencil);
}
