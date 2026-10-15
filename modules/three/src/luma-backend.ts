// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  Buffer,
  Texture,
  type Device,
  type BindingsByGroup,
  type ShaderLayout,
  type BufferLayout,
  type RenderPass,
  type ComputePass,
  type TextureFormatColor,
  type RenderPipelineParameters,
  type AttributeShaderType
} from '@luma.gl/core';
import {
  Backend,
  WGSLNodeBuilder,
  GLSLNodeBuilder,
  WebGLCoordinateSystem,
  WebGPUCoordinateSystem,
  FloatType,
  HalfFloatType,
  UnsignedByteType,
  RGBAFormat,
  RedFormat,
  RGFormat,
  LessEqualCompare,
  Compatibility,
  SRGBColorSpace,
  NearestFilter,
  LinearFilter,
  NearestMipmapNearestFilter,
  NearestMipmapLinearFilter,
  LinearMipmapNearestFilter,
  LinearMipmapLinearFilter,
  RepeatWrapping,
  MirroredRepeatWrapping,
  Vector2,
  type Renderer
} from 'three/webgpu';
import {translateBinding, translateVertexFormat, translateMaterial} from './translate';

// Three's Backend declarations omit most runtime hooks. Keep its untyped internal
// contracts confined to this version-pinned adapter; the public API stays typed.
type ThreeInternal = any;

export class LumaBackend extends Backend {
  readonly device: Device;
  readonly compatibilityMode = false;
  readonly isWebGLBackend: boolean;
  readonly extensions;
  readonly capabilities;
  readonly utils = {
    getTextureSampleData: (_texture: ThreeInternal) => ({primarySamples: 1, samples: 1})
  };
  private readonly states = new Map<object, ThreeInternal>();
  private readonly resources = new Set<{destroy(): void}>();
  private renderPass: RenderPass | null = null;
  private borrowedPass: RenderPass | null = null;
  private borrowedParameters?: RenderPipelineParameters;
  private readonly borrowedRenderCounts = new WeakMap<object, number>();
  private borrowedRenderIndex = 0;
  private borrowedRenderVersion = 0;
  private renderContext: ThreeInternal | null = null;
  private readonly renderContextStack: ThreeInternal[] = [];
  private computePass: ComputePass | null = null;

  constructor(device: Device) {
    super({canvas: device.getDefaultCanvasContext().canvas});
    this.device = device;
    this.isWebGLBackend = device.type === 'webgl';
    const extensionCache = new Map<string, unknown>();
    const getExtension = (name: string) => {
      if (!extensionCache.has(name))
        extensionCache.set(
          name,
          this.isWebGLBackend ? (device.handle as WebGL2RenderingContext).getExtension(name) : null
        );
      return extensionCache.get(name);
    };
    this.extensions = {has: (name: string) => Boolean(getExtension(name)), get: getExtension};
    this.capabilities = {
      getUniformBufferLimit: () => device.limits.maxUniformBufferBindingSize,
      getMaxAnisotropy: () => 1
    };
    // Abstract upstream hooks are empty methods. Fail explicitly until supported.
    for (const method of [
      'setXRTarget',
      'copyTextureToTexture',
      'isOccluded',
      'createIndirectStorageAttribute'
    ]) {
      Object.defineProperty(this, method, {
        value: () => {
          throw new Error(`LumaBackend: ${method} is not supported`);
        }
      });
    }
  }

  override get coordinateSystem() {
    return this.isWebGLBackend ? WebGLCoordinateSystem : WebGPUCoordinateSystem;
  }
  override async init(renderer: Renderer): Promise<void> {
    this.renderer = renderer;
  }
  get(object: object): ThreeInternal {
    let state = this.states.get(object);
    if (!state) {
      state = {};
      this.states.set(object, state);
    }
    return state;
  }
  has(object: object): boolean {
    return this.states.has(object);
  }
  delete(object: object): void {
    this.states.delete(object);
  }
  private own<ResourceType extends {destroy(): void}>(resource: ResourceType): ResourceType {
    this.resources.add(resource);
    return resource;
  }
  private release(resource: {destroy(): void} | undefined): void {
    if (resource && this.resources.delete(resource)) resource.destroy();
  }
  /** Record final scene draws only; never clear, end or submit the caller's pass. */
  withRenderPass(
    pass: RenderPass,
    render: () => void,
    parameters?: RenderPipelineParameters
  ): void {
    const framebuffer = pass.props.framebuffer;
    if (
      this.borrowedPass ||
      this.renderContext ||
      this.computePass ||
      pass.device !== this.device ||
      !framebuffer ||
      framebuffer.colorAttachments.length !== 1 ||
      !framebuffer.depthStencilAttachment ||
      framebuffer.colorAttachments[0].texture.samples !== 1 ||
      framebuffer.depthStencilAttachment.texture.samples !== 1 ||
      pass.props.depthReadOnly
    )
      throw new Error(
        'LumaBackend: expected an idle backend and a compatible single-sample caller pass'
      );
    // Keep slots distinct across all passes queued on the default encoder before submission.
    const uniformScope = this.device.commandEncoder || pass;
    this.borrowedRenderIndex = this.borrowedRenderCounts.get(uniformScope) || 0;
    this.borrowedRenderCounts.set(uniformScope, this.borrowedRenderIndex + 1);
    this.borrowedRenderVersion++;
    this.borrowedPass = pass;
    this.borrowedParameters = parameters;
    try {
      render();
    } finally {
      this.renderPass = null;
      this.renderContext = null;
      this.borrowedPass = null;
      this.borrowedParameters = undefined;
    }
  }
  dispose(): void {
    if (!this.borrowedPass) this.renderPass?.end();
    this.computePass?.end();
    this.renderPass = null;
    this.borrowedPass = null;
    this.renderContext = null;
    this.renderContextStack.length = 0;
    this.computePass = null;
    for (const resource of this.resources) resource.destroy();
    this.resources.clear();
    this.states.clear();
  }
  getContext(): unknown {
    return this.isWebGLBackend ? this.device.handle : this.device.canvasContext?.handle;
  }
  updateSize(): void {
    const size = this.renderer!.getDrawingBufferSize(new Vector2());
    this.device.getDefaultCanvasContext().setDrawingBufferSize(size.x, size.y);
  }
  hasFeature(name: string): boolean {
    const features: Record<string, string> = {
      'float32-filterable': 'float32-filterable',
      'shader-f16': 'shader-f16'
    };
    return Boolean(features[name] && this.device.features.has(features[name] as ThreeInternal));
  }
  async hasFeatureAsync(name: string): Promise<boolean> {
    return this.hasFeature(name);
  }
  hasCompatibility(name: string): boolean {
    return name === Compatibility.TEXTURE_COMPARE;
  }
  setScissorTest(): void {
    /* The renderer supplies scissor state in each render context. */
  }
  createNodeBuilder(object: ThreeInternal, renderer: Renderer): WGSLNodeBuilder | GLSLNodeBuilder {
    return this.isWebGLBackend
      ? new GLSLNodeBuilder(object, renderer)
      : new WGSLNodeBuilder(object, renderer);
  }
  createProgram(program: ThreeInternal): void {
    if (this.isWebGLBackend && program.stage === 'compute')
      throw new Error(
        'LumaBackend: WebGL2 compute is not supported; transform-feedback translation is deferred'
      );
    this.get(program).shader = this.own(
      this.device.createShader({stage: program.stage, source: program.code})
    );
  }
  destroyProgram(program: ThreeInternal): void {
    this.release(this.get(program).shader);
    this.delete(program);
  }
  private getAttributeSource(attribute: ThreeInternal): ThreeInternal {
    return attribute.isInterleavedBufferAttribute ? attribute.data : attribute;
  }
  private createBuffer(attribute: ThreeInternal, usage: number): void {
    const source = this.getAttributeSource(attribute);
    const state = this.get(source);
    if (state.buffer) {
      if ((state.buffer.usage & usage) !== usage)
        throw new Error('LumaBackend: attribute buffer usage cannot change');
      state.attributes.add(attribute);
      return;
    }
    state.attributes = new Set([attribute]);
    const array = source.array;
    state.buffer = this.own(
      this.device.createBuffer({
        data: array,
        byteLength: Math.ceil(array.byteLength / 4) * 4,
        usage: usage | Buffer.COPY_DST | Buffer.COPY_SRC,
        indexType:
          usage & Buffer.INDEX ? (array instanceof Uint32Array ? 'uint32' : 'uint16') : undefined
      })
    );
  }
  createAttribute(attribute: ThreeInternal): void {
    this.createBuffer(attribute, Buffer.VERTEX);
  }
  createIndexAttribute(attribute: ThreeInternal): void {
    if (!(attribute.array instanceof Uint16Array || attribute.array instanceof Uint32Array)) {
      throw new Error('LumaBackend: indices must be uint16 or uint32');
    }
    this.createBuffer(attribute, Buffer.INDEX);
  }
  createStorageAttribute(attribute: ThreeInternal): void {
    this.createBuffer(attribute, Buffer.STORAGE | Buffer.VERTEX);
  }
  updateAttribute(attribute: ThreeInternal): void {
    const source = this.getAttributeSource(attribute);
    const buffer = this.get(source).buffer as Buffer;
    if (source.array.byteLength > buffer.byteLength)
      throw new Error('LumaBackend: buffer resizing requires a new attribute');
    if (!this.isWebGLBackend && source.array.byteLength % 4) {
      const padded = new Uint8Array(Math.ceil(source.array.byteLength / 4) * 4);
      padded.set(
        new Uint8Array(source.array.buffer, source.array.byteOffset, source.array.byteLength)
      );
      buffer.write(padded);
    } else buffer.write(source.array);
    source.clearUpdateRanges();
  }
  destroyAttribute(attribute: ThreeInternal): void {
    const source = this.getAttributeSource(attribute);
    if (!this.has(source)) return;
    const state = this.get(source);
    if (!state.attributes.delete(attribute) || state.attributes.size) return;
    this.release(state.buffer);
    this.delete(source);
  }
  createUniformBuffer(binding: ThreeInternal): void {
    this.get(binding).buffer = this.own(
      this.device.createBuffer({
        byteLength: binding.byteLength,
        usage: Buffer.UNIFORM | Buffer.COPY_DST,
        data: binding.buffer
      })
    );
  }
  destroyUniformBuffer(binding: ThreeInternal): void {
    const state = this.get(binding);
    this.release(state.buffer);
    for (const snapshot of state.borrowedUniforms || []) {
      if (snapshot) this.release(snapshot.buffer);
    }
    this.delete(binding);
  }
  private getUniformBuffer(binding: ThreeInternal): Buffer {
    const state = this.get(binding);
    if (!this.borrowedPass || this.isWebGLBackend) return state.buffer;
    // Uniform writes precede submission of all queued passes. Keep earlier draws from
    // reading the last camera/material values written by a later scene.
    state.borrowedUniforms ||= [];
    const snapshots = state.borrowedUniforms;
    let snapshot = snapshots[this.borrowedRenderIndex];
    if (!snapshot) {
      snapshot = {
        buffer: this.own(
          this.device.createBuffer({
            byteLength: binding.byteLength,
            usage: Buffer.UNIFORM | Buffer.COPY_DST,
            data: binding.buffer
          })
        ),
        version: this.borrowedRenderVersion
      };
      snapshots[this.borrowedRenderIndex] = snapshot;
    } else if (snapshot.version !== this.borrowedRenderVersion) {
      snapshot.buffer.write(binding.buffer);
      snapshot.version = this.borrowedRenderVersion;
    }
    return snapshot.buffer;
  }
  updateBinding(binding: ThreeInternal): void {
    this.get(binding).buffer.write(binding.buffer);
    binding.clearUpdateRanges?.();
  }
  async getArrayBufferAsync(
    attribute: ThreeInternal,
    target: ArrayBuffer | null = null,
    offset = 0,
    count = -1
  ): Promise<ArrayBuffer> {
    this.device.submit();
    const source = this.getAttributeSource(attribute);
    const array = source.array;
    if (target && !(target instanceof ArrayBuffer))
      throw new Error('LumaBackend: ReadbackBuffer targets are not supported');
    const bytes = await (this.get(source).buffer as Buffer).readAsync(
      offset,
      count < 0 ? array.byteLength - offset : count
    );
    const result = target || new ArrayBuffer(bytes.byteLength);
    new Uint8Array(result).set(bytes);
    return result;
  }
  createBindings(bindGroup: ThreeInternal): void {
    this.get(bindGroup).initialized = true;
  }
  updateBindings(bindGroup: ThreeInternal): void {
    this.createBindings(bindGroup);
  }
  deleteBindGroupData(bindGroup: ThreeInternal): void {
    this.delete(bindGroup);
  }
  private getBindingLayout(groups: ThreeInternal[]): ShaderLayout['bindings'] {
    return groups.flatMap((group, groupIndex) =>
      group.bindings.map((binding: ThreeInternal, location: number) =>
        this.translateBackendBinding(binding, groupIndex, location)
      )
    );
  }
  private translateBackendBinding(binding: ThreeInternal, group: number, location: number) {
    const declaration = translateBinding(
      binding,
      group,
      location,
      this.hasFeature('float32-filterable')
    );
    return this.isWebGLBackend ? {...declaration, name: binding.name} : declaration;
  }
  private getBindings(groups: ThreeInternal[]): BindingsByGroup {
    const result: BindingsByGroup = {};
    groups.forEach((group, groupIndex) => {
      const values: NonNullable<BindingsByGroup[number]> = {};
      group.bindings.forEach((binding: ThreeInternal, location: number) => {
        const declaration = this.translateBackendBinding(binding, groupIndex, location);
        if (this.isWebGLBackend && binding.isSampledTexture) this.updateSampler(binding);
        values[declaration.name] = binding.isStorageBuffer
          ? this.get(binding.attribute).buffer
          : binding.isSampledTexture
            ? this.get(binding.texture).texture
            : binding.isSampler
              ? this.get(binding).sampler
              : this.getUniformBuffer(binding);
      });
      result[groupIndex] = values;
    });
    return result;
  }
  private getTextureFormat(texture: ThreeInternal): TextureFormatColor {
    if (texture.format === RedFormat) {
      if (texture.type === FloatType) return 'r32float';
      if (texture.type === HalfFloatType) return 'r16float';
      if (texture.type === UnsignedByteType) return 'r8unorm';
    }
    if (texture.format === RGFormat) {
      if (texture.type === FloatType) return 'rg32float';
      if (texture.type === HalfFloatType) return 'rg16float';
      if (texture.type === UnsignedByteType) return 'rg8unorm';
    }
    if (texture.format !== RGBAFormat) throw new Error('LumaBackend: unsupported texture format');
    if (texture.type === HalfFloatType) return 'rgba16float';
    if (texture.type === FloatType) return 'rgba32float';
    if (texture.type === UnsignedByteType)
      return texture.colorSpace === SRGBColorSpace ? 'rgba8unorm-srgb' : 'rgba8unorm';
    throw new Error('LumaBackend: unsupported texture type');
  }
  createDefaultTexture(texture: ThreeInternal): void {
    this.createTexture(texture, {width: 1, height: 1, levels: 1});
    if (!texture.isDepthTexture && !texture.isDataArrayTexture)
      this.get(texture).texture.copyImageData({
        data: new Uint8Array([0, 0, 0, 255]),
        width: 1,
        height: 1
      });
  }
  createTexture(texture: ThreeInternal, options: ThreeInternal = {}): void {
    if (
      texture.isCubeTexture ||
      texture.isData3DTexture ||
      (texture.isArrayTexture && !texture.isDataArrayTexture) ||
      texture.isStorageTexture ||
      texture.isCompressedTexture
    ) {
      throw new Error('LumaBackend: only 2D and data-array textures are supported');
    }
    const state = this.get(texture);
    const width = options.width || texture.image?.width || 1;
    const height = options.height || texture.image?.height || 1;
    const depth = texture.isDataArrayTexture ? options.depth || texture.image?.depth || 1 : 1;
    const format = texture.isDepthTexture ? 'depth24plus' : this.getTextureFormat(texture);
    if (
      state.texture?.width === width &&
      state.texture?.height === height &&
      state.texture?.depth === depth &&
      state.texture?.format === format
    )
      return;
    this.release(state.texture);
    state.texture = this.own(
      this.device.createTexture({
        width,
        height,
        depth,
        dimension: texture.isDataArrayTexture ? '2d-array' : '2d',
        format,
        mipLevels: options.levels || 1,
        usage: Texture.TEXTURE | Texture.RENDER_ATTACHMENT | Texture.COPY_SRC | Texture.COPY_DST
      })
    );
  }
  updateTexture(texture: ThreeInternal, options: ThreeInternal = {}): void {
    const image = options.image || texture.image;
    const target = this.get(texture).texture as Texture;
    if (image.data)
      target.copyImageData({
        data: image.data,
        width: target.width,
        height: target.height,
        depthOrArrayLayers: target.depth
      });
    else
      target.copyExternalImage({
        image,
        width: target.width,
        height: target.height,
        flipY: texture.flipY,
        premultipliedAlpha: texture.premultiplyAlpha
      });
  }
  destroyTexture(texture: ThreeInternal): void {
    this.release(this.get(texture).texture);
    this.delete(texture);
  }
  generateMipmaps(texture: ThreeInternal): void {
    if (this.borrowedPass)
      throw new Error('LumaBackend: prepare texture mipmaps before borrowing a render pass');
    // Uploads can request mipmaps between draws. Finish the active pass before
    // the mipmap helper uses the device encoder; subsequent draws load attachments.
    if (this.renderPass) {
      this.renderPass.end();
      this.renderPass = null;
      this.device.submit();
    }
    if (this.isWebGLBackend) this.get(texture).texture.generateMipmapsWebGL();
    else this.device.generateMipmapsWebGPU(this.get(texture).texture);
  }
  updateSampler(binding: ThreeInternal): string {
    const texture = binding.texture;
    if (texture.compareFunction != null && texture.compareFunction !== LessEqualCompare)
      throw new Error('LumaBackend: unsupported texture comparison function');
    if (
      ![
        NearestFilter,
        LinearFilter,
        NearestMipmapNearestFilter,
        NearestMipmapLinearFilter,
        LinearMipmapNearestFilter,
        LinearMipmapLinearFilter
      ].includes(texture.minFilter) ||
      ![NearestFilter, LinearFilter].includes(texture.magFilter)
    )
      throw new Error('LumaBackend: unsupported sampler filter');
    const addressMode = (wrap: number) =>
      wrap === RepeatWrapping
        ? 'repeat'
        : wrap === MirroredRepeatWrapping
          ? 'mirror-repeat'
          : 'clamp-to-edge';
    const properties = {
      type: texture.compareFunction != null ? 'comparison-sampler' : 'color-sampler',
      compare: texture.compareFunction != null ? 'less-equal' : undefined,
      minFilter: [NearestFilter, NearestMipmapNearestFilter, NearestMipmapLinearFilter].includes(
        texture.minFilter
      )
        ? 'nearest'
        : 'linear',
      mipmapFilter: [NearestMipmapNearestFilter, LinearMipmapNearestFilter].includes(
        texture.minFilter
      )
        ? 'nearest'
        : 'linear',
      lodMaxClamp: [NearestFilter, LinearFilter].includes(texture.minFilter) ? 0 : 32,
      magFilter: texture.magFilter === NearestFilter ? 'nearest' : 'linear',
      addressModeU: addressMode(texture.wrapS),
      addressModeV: addressMode(texture.wrapT)
    } as const;
    const key = JSON.stringify(properties);
    const state = this.get(binding);
    if (state.key !== key) {
      this.release(state.sampler);
      state.sampler = this.own(this.device.createSampler(properties));
      state.key = key;
    }
    if (this.isWebGLBackend && this.get(texture).texture)
      this.get(texture).texture.setSampler(state.sampler);
    return key;
  }
  destroySampler(binding: ThreeInternal): void {
    this.release(this.get(binding).sampler);
    this.delete(binding);
  }
  initRenderTarget(context: ThreeInternal): void {
    this.getFramebuffer(context);
  }
  private getFramebuffer(context: ThreeInternal): ThreeInternal {
    if (this.borrowedPass) {
      if (context.textures)
        throw new Error(
          'LumaBackend: auxiliary render targets must be prepared before borrowing a pass'
        );
      return this.borrowedPass.props.framebuffer;
    }
    if (
      context.sampleCount > 1 ||
      context.stencil ||
      context.activeMipmapLevel ||
      context.activeCubeFace ||
      context.occlusionQueryCount
    )
      throw new Error('LumaBackend: unsupported render target configuration');
    if (!context.textures)
      return this.device
        .getDefaultCanvasContext()
        .getCurrentFramebuffer({depthStencilFormat: context.depth ? 'depth24plus' : false});
    const state = this.get(context);
    const colors = context.textures.map((texture: ThreeInternal) => this.get(texture).texture);
    const depth = context.depthTexture ? this.get(context.depthTexture).texture : null;
    if (
      !state.framebuffer ||
      state.colors.some((texture: Texture, index: number) => texture !== colors[index]) ||
      state.depth !== depth
    ) {
      this.release(state.framebuffer);
      state.framebuffer = this.own(
        this.device.createFramebuffer({colorAttachments: colors, depthStencilAttachment: depth})
      );
      state.colors = colors;
      state.depth = depth;
    }
    return state.framebuffer;
  }
  beginRender(context: ThreeInternal): void {
    if (this.borrowedPass) {
      if (this.renderContext || context.textures)
        throw new Error('LumaBackend: nested rendering in a borrowed pass is unsupported');
      this.renderContext = context;
      this.renderPass = this.borrowedPass;
      context.width = this.borrowedPass.props.framebuffer!.width;
      context.height = this.borrowedPass.props.framebuffer!.height;
      return;
    }
    if (this.renderContext) {
      this.renderPass?.end();
      this.renderPass = null;
      this.device.submit();
      this.renderContextStack.push(this.renderContext);
    }
    this.renderContext = context;
    this.openRenderPass(true);
  }
  private openRenderPass(clearAttachments: boolean): void {
    const context = this.renderContext;
    const framebuffer = this.getFramebuffer(context);
    const color = context.clearColorValue;
    this.renderPass = this.device.beginRenderPass({
      framebuffer,
      clearColor:
        clearAttachments && context.clearColor ? [color.r, color.g, color.b, color.a] : false,
      clearDepth:
        clearAttachments && context.depth && context.clearDepth ? context.clearDepthValue : false,
      clearStencil: false
    });
    this.updateViewport(context);
  }
  updateViewport(context: ThreeInternal): void {
    if (this.borrowedPass) return; // The caller owns viewport/scissor state.
    const viewport = context.viewportValue;
    const viewportY = this.isWebGLBackend ? context.height - viewport.w - viewport.y : viewport.y;
    this.renderPass?.setParameters({viewport: [viewport.x, viewportY, viewport.z, viewport.w]});
    if (context.scissor) {
      const rectangle = context.scissorValue;
      this.renderPass?.setParameters({
        scissorRect: [
          rectangle.x,
          this.isWebGLBackend ? context.height - rectangle.w - rectangle.y : rectangle.y,
          rectangle.z,
          rectangle.w
        ]
      });
    }
  }
  finishRender(): void {
    if (this.borrowedPass) {
      this.renderPass = null;
      this.renderContext = null;
      return;
    }
    this.renderPass?.end();
    this.renderPass = null;
    this.renderContext = this.renderContextStack.pop() || null;
    this.device.submit();
  }
  copyFramebufferToTexture(
    texture: ThreeInternal,
    context: ThreeInternal,
    rectangle: ThreeInternal
  ): void {
    if (this.borrowedPass)
      throw new Error(
        'LumaBackend: framebuffer copies/transmission are unsupported in a borrowed pass'
      );
    if (texture.isDepthTexture)
      throw new Error('LumaBackend: depth framebuffer copies are not supported');
    const source = this.getFramebuffer(context).colorAttachments[0].texture as Texture;
    const destination = this.get(texture).texture as Texture;
    if (source.format !== destination.format)
      throw new Error('LumaBackend: framebuffer copy formats must match');
    this.renderPass?.end();
    this.renderPass = null;
    this.device.commandEncoder.copyTextureToTexture({
      sourceTexture: source,
      destinationTexture: destination,
      origin: [rectangle.x, rectangle.y, 0],
      width: rectangle.z,
      height: rectangle.w
    });
    this.device.submit();
    if (texture.generateMipmaps) this.generateMipmaps(texture);
    // The next draw resumes the current context with color and depth loaded.
  }
  clear(color: boolean, depth: boolean, stencil: boolean, context?: ThreeInternal): void {
    if (this.borrowedPass) throw new Error('LumaBackend: the caller owns borrowed-pass clearing');
    if (stencil) throw new Error('LumaBackend: stencil is not supported');
    const clearColor = (this as ThreeInternal).getClearColor();
    const framebuffer = context
      ? this.getFramebuffer(context)
      : this.device.getDefaultCanvasContext().getCurrentFramebuffer();
    const pass = this.device.beginRenderPass({
      framebuffer,
      clearColor: color ? [clearColor.r, clearColor.g, clearColor.b, clearColor.a] : false,
      clearDepth: depth ? 1 : false,
      clearStencil: false
    });
    pass.end();
    this.device.submit();
  }
  private getPipelineState(renderObject: ThreeInternal): ThreeInternal {
    const {material, object, context} = renderObject;
    const parameters = translateMaterial(material, object.matrixWorld.determinant() < 0);
    if (!context.depth) {
      delete parameters.depthWriteEnabled;
      delete parameters.depthCompare;
    }
    return {
      parameters: {...parameters, ...this.borrowedParameters},
      formats: this.borrowedPass
        ? this.borrowedPass.props.framebuffer!.colorAttachments.map(
            attachment => attachment.texture.format
          )
        : context.textures
          ? context.textures.map((texture: ThreeInternal) => this.getTextureFormat(texture))
          : [this.device.preferredColorFormat],
      depth: this.borrowedPass
        ? this.borrowedPass.props.framebuffer!.depthStencilAttachment?.texture.format
        : context.depth
          ? 'depth24plus'
          : undefined
    };
  }
  getRenderCacheKey(renderObject: ThreeInternal): string {
    return JSON.stringify([
      this.getPipelineState(renderObject),
      renderObject.getGeometryCacheKey(),
      renderObject.clippingContextCacheKey
    ]);
  }
  needsRenderUpdate(renderObject: ThreeInternal): boolean {
    const state = this.get(renderObject);
    const key = this.getRenderCacheKey(renderObject);
    const changed = state.key !== key || state.version !== renderObject.material.version;
    state.key = key;
    state.version = renderObject.material.version;
    return changed;
  }
  createRenderPipeline(renderObject: ThreeInternal, promises: Promise<unknown>[] | null): void {
    const {pipeline} = renderObject;
    const attributes = renderObject.getAttributes();
    const nodeAttributes = renderObject.getNodeBuilderState().nodeAttributes;
    const buffers = renderObject.getVertexBuffers();
    const shaderLayout: ShaderLayout = {
      attributes: [],
      bindings: this.getBindingLayout(renderObject.getBindings())
    };
    const bufferLayout: BufferLayout[] = buffers.map((_buffer: ThreeInternal, index: number) => ({
      name: `buffer${index}`,
      attributes: []
    }));
    attributes.forEach((attribute: ThreeInternal, location: number) => {
      const node = nodeAttributes[location];
      const source = this.getAttributeSource(attribute);
      const bufferIndex = buffers.indexOf(source);
      const bytes = source.array.BYTES_PER_ELEMENT;
      const layout = bufferLayout[bufferIndex];
      layout.stepMode =
        attribute.isInstancedBufferAttribute || source.isInstancedInterleavedBuffer
          ? 'instance'
          : 'vertex';
      if (source.meshPerAttribute > 1)
        throw new Error('LumaBackend: instance attribute divisors are not supported');
      layout.byteStride = (source.stride || attribute.itemSize) * bytes;
      layout.attributes!.push({
        attribute: node.name,
        format: translateVertexFormat(source.array, attribute.itemSize, attribute.normalized),
        byteOffset: (attribute.offset || 0) * bytes
      });
      const scalar =
        node.type.startsWith('i') || node.type === 'int'
          ? 'i32'
          : node.type.startsWith('u') || node.type === 'uint'
            ? 'u32'
            : 'f32';
      shaderLayout.attributes.push({
        name: node.name,
        location,
        type: (attribute.itemSize === 1
          ? scalar
          : `vec${attribute.itemSize}<${scalar}>`) as AttributeShaderType
      });
    });
    const state = this.getPipelineState(renderObject);
    const properties = {
      vs: this.get(pipeline.vertexProgram).shader,
      fs: this.get(pipeline.fragmentProgram).shader,
      vertexEntryPoint: 'main',
      fragmentEntryPoint: 'main',
      shaderLayout,
      bufferLayout,
      topology: 'triangle-list' as const,
      colorAttachmentFormats: state.formats,
      depthStencilAttachmentFormat: state.depth,
      parameters: state.parameters
    };
    if (!renderObject.object.isMesh || renderObject.material.wireframe)
      throw new Error('LumaBackend: only triangle meshes are supported');
    const target = this.get(pipeline);
    const setPipeline = (resource: ThreeInternal) => {
      target.pipeline = this.own(resource);
    };
    if (promises)
      promises.push(this.device.createRenderPipelineAsync(properties).then(setPipeline));
    else setPipeline(this.device.createRenderPipeline(properties));
  }
  draw(renderObject: ThreeInternal, info: ThreeInternal): void {
    if (!this.renderPass) this.openRenderPass(false);
    if (renderObject.object.isBatchedMesh || renderObject.camera.isArrayCamera)
      throw new Error('LumaBackend: batched meshes and array cameras are not supported');
    const parameters = renderObject.getDrawParameters();
    if (!parameters) return;
    const pipeline = this.get(renderObject.pipeline).pipeline;
    const state = this.get(renderObject);
    if (state.pipeline !== pipeline) {
      this.release(state.vertexArray);
      state.vertexArray = this.own(
        this.device.createVertexArray({
          shaderLayout: pipeline.shaderLayout,
          bufferLayout: pipeline.bufferLayout
        })
      );
      state.pipeline = pipeline;
    }
    if (this.isWebGLBackend) {
      // WebGL binds per attribute location; WebGPU binds per vertex-buffer slot.
      const nodes = renderObject.getNodeBuilderState().nodeAttributes;
      renderObject.getAttributes().forEach((attribute: ThreeInternal, index: number) => {
        const location = pipeline.shaderLayout.attributes.find(
          (declaration: ThreeInternal) => declaration.name === nodes[index].name
        )?.location;
        if (location !== undefined)
          state.vertexArray.setBuffer(
            location,
            this.get(this.getAttributeSource(attribute)).buffer
          );
      });
    } else {
      renderObject
        .getVertexBuffers()
        .forEach((attribute: ThreeInternal, index: number) =>
          state.vertexArray.setBuffer(index, this.get(attribute).buffer)
        );
    }
    const index = renderObject.getIndex();
    state.vertexArray.setIndexBuffer(index ? this.get(index).buffer : null);
    const pass = this.renderPass!;
    pass.setPipeline(pipeline);
    pass.setBindings(this.getBindings(renderObject.getBindings()));
    pass.setVertexArray(state.vertexArray);
    pass.draw(
      index
        ? {
            indexCount: parameters.vertexCount,
            firstIndex: parameters.firstVertex,
            firstVertex: this.isWebGLBackend
              ? parameters.firstVertex * index.array.BYTES_PER_ELEMENT
              : undefined,
            isInstanced: parameters.instanceCount > 1,
            instanceCount: parameters.instanceCount
          }
        : {...parameters, isInstanced: parameters.instanceCount > 1}
    );
    info.update(renderObject.object, parameters.vertexCount, parameters.instanceCount);
  }
  createComputePipeline(pipeline: ThreeInternal, bindings: ThreeInternal[]): void {
    if (this.isWebGLBackend)
      throw new Error(
        'LumaBackend: WebGL2 compute is not supported; transform-feedback translation is deferred'
      );
    this.get(pipeline).pipeline = this.own(
      this.device.createComputePipeline({
        shader: this.get(pipeline.computeProgram).shader,
        shaderLayout: {bindings: this.getBindingLayout(bindings)}
      })
    );
  }
  beginCompute(): void {
    if (this.borrowedPass)
      throw new Error('LumaBackend: compute cannot run inside a borrowed pass');
    if (this.isWebGLBackend)
      throw new Error(
        'LumaBackend: WebGL2 compute is not supported; transform-feedback translation is deferred'
      );
    this.computePass = this.device.beginComputePass();
  }
  compute(
    _group: ThreeInternal,
    node: ThreeInternal,
    bindings: ThreeInternal[],
    pipeline: ThreeInternal,
    dispatchSize?: number | number[]
  ): void {
    const pass = this.computePass!;
    pass.setPipeline(this.get(pipeline).pipeline);
    pass.setBindings(this.getBindings(bindings));
    const dispatch = dispatchSize ?? node.dispatchSize ?? node.count;
    const dimensions =
      typeof dispatch === 'number'
        ? [
            Math.ceil(
              dispatch /
                node.workgroupSize.reduce((product: number, value: number) => product * value, 1)
            ),
            1,
            1
          ]
        : dispatch;
    if (!Array.isArray(dimensions))
      throw new Error('LumaBackend: indirect compute dispatch is not supported');
    pass.dispatch(dimensions[0], dimensions[1] || 1, dimensions[2] || 1);
  }
  finishCompute(): void {
    this.computePass!.end();
    this.computePass = null;
    this.device.submit();
  }
  async copyTextureToBuffer(
    texture: ThreeInternal,
    x: number,
    y: number,
    width: number,
    height: number,
    faceIndex = 0
  ): Promise<Uint8Array> {
    if (this.borrowedPass) throw new Error('LumaBackend: readback cannot submit a borrowed pass');
    if (faceIndex) throw new Error('LumaBackend: array texture readback is not supported');
    const resource = this.get(texture).texture as Texture;
    const layout = resource.computeMemoryLayout({width, height});
    const rowByteLength = width * layout.bytesPerPixel;
    const buffer = this.device.createBuffer({
      byteLength: layout.byteLength,
      usage: Buffer.COPY_DST | Buffer.COPY_SRC
    });
    try {
      this.device.submit();
      resource.readBuffer({x, y, width, height}, buffer);
      const bytes = await buffer.readAsync();
      const result = new Uint8Array(rowByteLength * height);
      for (let row = 0; row < height; row++)
        result.set(
          bytes.subarray(row * layout.bytesPerRow, row * layout.bytesPerRow + rowByteLength),
          row * rowByteLength
        );
      return result;
    } finally {
      buffer.destroy();
    }
  }
}
