// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  Buffer,
  type CommandEncoder,
  type Device,
  type Framebuffer,
  type RenderPass,
  type RenderPipelineParameters,
  Texture
} from '@luma.gl/core';
import {Computation, Model} from '@luma.gl/engine';
import type {Matrix4Like, NumberArray3} from '@math.gl/core';
import type {SpectralCausticsProps} from './spectral-caustics';
import {
  SPECTRAL_CAUSTICS_SPLAT_BINDINGS,
  SPECTRAL_CAUSTICS_SPLAT_BYTE_LENGTH,
  SPECTRAL_CAUSTICS_SPLAT_SHADER,
  SPECTRAL_CAUSTICS_TRACE_BINDINGS,
  SPECTRAL_CAUSTICS_TRACE_SHADER,
  SPECTRAL_CAUSTICS_UNIFORM_BYTE_LENGTH,
  SPECTRAL_CAUSTICS_UNIFORM_OFFSETS,
  SPECTRAL_CAUSTICS_WAVELENGTH_COUNT,
  SPECTRAL_CAUSTICS_WORKGROUP_SIZE
} from './spectral-caustics-renderer-shaders';

const SPECTRAL_CAUSTICS_COLOR_FORMAT = 'rgba16float';
const SPECTRAL_CAUSTICS_DEPTH_FORMAT = 'depth32float';
const DEFAULT_CAPTURE_SIZE = 128;
const DEFAULT_MAP_SIZE = 512;
const DEFAULT_SPLAT_RADIUS = 2;

/** Construction options for {@link SpectralCausticsRenderer}. */
export type SpectralCausticsRendererProps = {
  /** Prefix used for owned GPU resource labels. */
  id?: string;
  /** Square light-space front/back capture dimension. */
  captureSize?: number;
  /** Square XYZ caustic-map dimension. */
  mapSize?: number;
  /** Gaussian photon footprint radius in caustic-map pixels. */
  splatRadius?: number;
};

/** Result returned by {@link getSpectralCausticsSupport}. */
export type SpectralCausticsSupport = {
  supported: boolean;
  reason?: string;
};

/** Front or back refractor surface capture. */
export type SpectralCausticsCaptureFace = 'front' | 'back';

/** Resources supplied before a refractor capture render pass opens. */
export type SpectralCausticsPrepareContext = {
  commandEncoder: CommandEncoder;
  face: SpectralCausticsCaptureFace;
  lightViewProjectionMatrix: Readonly<Matrix4Like>;
  captureSize: number;
  captureParameters: Readonly<RenderPipelineParameters>;
};

/** Active capture pass supplied to the application-owned refractor draw. */
export type SpectralCausticsDrawContext = Omit<SpectralCausticsPrepareContext, 'commandEncoder'> & {
  renderPass: RenderPass;
};

/** Per-frame geometry, receiver, and optical inputs consumed by `encode()`. */
export type SpectralCausticsRendererEncodeOptions = {
  /** Light clip-from-world transform using WebGPU's zero-to-one clip-depth range. */
  lightViewProjectionMatrix: Readonly<Matrix4Like>;
  /** Exact world-from-light-clip inverse of `lightViewProjectionMatrix`. */
  inverseLightViewProjectionMatrix: Readonly<Matrix4Like>;
  /** World-space center of the planar receiver. */
  receiverOrigin: Readonly<NumberArray3>;
  /** Unit receiver axis mapped to texture U. */
  receiverTangent: Readonly<NumberArray3>;
  /** Unit receiver axis mapped to texture V. */
  receiverBitangent: Readonly<NumberArray3>;
  /** Unit normal of the planar receiver. */
  receiverNormal: Readonly<NumberArray3>;
  /** World-space receiver span along `receiverTangent`. */
  receiverWidth: number;
  /** World-space receiver span along `receiverBitangent`. */
  receiverHeight: number;
  /** Refractive index at 550nm. Defaults to 1.5. */
  refractiveIndex?: number;
  /** Cauchy-style visible-spectrum dispersion strength. Defaults to 0.02. */
  dispersion?: number;
  /** RGB Beer-Lambert absorption coefficients per world-space unit. */
  absorption?: Readonly<NumberArray3>;
  /** HDR radiance multiplier. Defaults to 1. */
  intensity?: number;
  /**
   * Applies the supplied culling/depth parameters and prepares application models before a
   * capture pass opens. Capture fragment shaders must write encoded world normals to location 0.
   */
  prepareRefractor?: (context: SpectralCausticsPrepareContext) => void;
  /** Draws the closed convex refractor into the active front or back capture. */
  drawRefractor: (context: SpectralCausticsDrawContext) => void;
};

type ResolvedSpectralCausticsRendererProps = Required<SpectralCausticsRendererProps>;

type SpectralCausticsRendererResources = {
  frontNormalTexture: Texture;
  frontDepthTexture: Texture;
  frontFramebuffer: Framebuffer;
  backNormalTexture: Texture;
  backDepthTexture: Texture;
  backFramebuffer: Framebuffer;
  causticMap: Texture;
  causticFramebuffer: Framebuffer;
  photonSplats: Buffer;
  uniformBuffer: Buffer;
  traceComputation: Computation;
  splatModel: Model;
};

const FRONT_CAPTURE_PARAMETERS = Object.freeze({
  blend: false,
  cullMode: 'back',
  depthWriteEnabled: true,
  depthCompare: 'less'
} satisfies RenderPipelineParameters);

const BACK_CAPTURE_PARAMETERS = Object.freeze({
  blend: false,
  cullMode: 'front',
  depthWriteEnabled: true,
  depthCompare: 'greater'
} satisfies RenderPipelineParameters);

const SPLAT_PARAMETERS = Object.freeze({
  blend: true,
  blendColorOperation: 'add',
  blendColorSrcFactor: 'one',
  blendColorDstFactor: 'one',
  blendAlphaOperation: 'add',
  blendAlphaSrcFactor: 'one',
  blendAlphaDstFactor: 'one'
} satisfies RenderPipelineParameters);

/**
 * Traces spectrally dispersed photons through application-drawn convex geometry on WebGPU.
 *
 * The renderer owns its front/back light-space captures, photon records, and HDR XYZ map. It
 * records onto the supplied encoder and never submits it. The returned props can be passed
 * directly to the `spectralCaustics` receiver shader module.
 */
export class SpectralCausticsRenderer {
  readonly device: Device;
  readonly id: string;
  readonly captureSize: number;
  readonly mapSize: number;
  readonly splatRadius: number;

  private resources: SpectralCausticsRendererResources | null;

  constructor(device: Device, props: SpectralCausticsRendererProps = {}) {
    const support = getSpectralCausticsSupport(device);
    if (!support.supported) {
      throw new Error(support.reason);
    }

    const resolvedProps = resolveSpectralCausticsRendererProps(device, props);
    this.device = device;
    this.id = resolvedProps.id;
    this.captureSize = resolvedProps.captureSize;
    this.mapSize = resolvedProps.mapSize;
    this.splatRadius = resolvedProps.splatRadius;
    this.resources = createSpectralCausticsRendererResources(device, resolvedProps);
  }

  /** Additively accumulated D65 XYZ caustic radiance. */
  get causticMap(): Texture {
    return this.getResources().causticMap;
  }

  /**
   * Records front/back captures, spectral tracing, and additive photon splats.
   *
   * The caller owns submission. The refractor must be closed and convex; capture shaders write
   * `worldNormal * 0.5 + 0.5` to the first color attachment.
   */
  encode(
    commandEncoder: CommandEncoder,
    options: SpectralCausticsRendererEncodeOptions
  ): SpectralCausticsProps {
    const resources = this.getResources();
    if (commandEncoder.device !== this.device) {
      throw new Error('Spectral caustics command encoder belongs to a different device.');
    }
    validateSpectralCausticsEncodeOptions(options);

    this.device.writeBufferViaCommandEncoder(
      commandEncoder,
      resources.uniformBuffer,
      makeSpectralCausticsUniformData(options, {
        captureSize: this.captureSize,
        mapSize: this.mapSize,
        splatRadius: this.splatRadius
      })
    );

    this.encodeCapture(commandEncoder, options, 'front');
    this.encodeCapture(commandEncoder, options, 'back');

    resources.traceComputation.predraw(commandEncoder);
    const computePass = commandEncoder.beginComputePass({id: `${this.id}-trace-pass`});
    try {
      resources.traceComputation.dispatch(
        computePass,
        Math.ceil((this.captureSize * this.captureSize) / SPECTRAL_CAUSTICS_WORKGROUP_SIZE)
      );
    } finally {
      computePass.end();
    }

    resources.splatModel.predraw(commandEncoder);
    const splatPass = commandEncoder.beginRenderPass({
      id: `${this.id}-splat-pass`,
      framebuffer: resources.causticFramebuffer,
      clearColor: [0, 0, 0, 0]
    });
    try {
      resources.splatModel.draw(splatPass);
    } finally {
      splatPass.end();
    }

    return {
      causticMap: resources.causticMap,
      receiverOrigin: options.receiverOrigin,
      receiverTangent: options.receiverTangent,
      receiverBitangent: options.receiverBitangent,
      receiverWidth: options.receiverWidth,
      receiverHeight: options.receiverHeight
    };
  }

  /** Destroys all owned pipelines, buffers, framebuffers, and textures. */
  destroy(): void {
    const resources = this.resources;
    if (!resources) {
      return;
    }
    this.resources = null;
    destroySpectralCausticsRendererResources(resources);
  }

  private encodeCapture(
    commandEncoder: CommandEncoder,
    options: SpectralCausticsRendererEncodeOptions,
    face: SpectralCausticsCaptureFace
  ): void {
    const resources = this.getResources();
    const captureParameters = face === 'front' ? FRONT_CAPTURE_PARAMETERS : BACK_CAPTURE_PARAMETERS;
    const prepareContext: SpectralCausticsPrepareContext = {
      commandEncoder,
      face,
      lightViewProjectionMatrix: options.lightViewProjectionMatrix,
      captureSize: this.captureSize,
      captureParameters
    };
    options.prepareRefractor?.(prepareContext);

    const renderPass = commandEncoder.beginRenderPass({
      id: `${this.id}-${face}-capture-pass`,
      framebuffer: face === 'front' ? resources.frontFramebuffer : resources.backFramebuffer,
      clearColor: [0.5, 0.5, 1, 0],
      clearDepth: face === 'front' ? 1 : 0
    });
    try {
      options.drawRefractor({
        face,
        lightViewProjectionMatrix: options.lightViewProjectionMatrix,
        captureSize: this.captureSize,
        captureParameters,
        renderPass
      });
    } finally {
      renderPass.end();
    }
  }

  private getResources(): SpectralCausticsRendererResources {
    if (!this.resources) {
      throw new Error('SpectralCausticsRenderer has been destroyed.');
    }
    return this.resources;
  }
}

/** Returns whether a device can run the spectral trace and blend its HDR XYZ output. */
export function getSpectralCausticsSupport(device: Device): SpectralCausticsSupport {
  if (device.type !== 'webgpu') {
    return {supported: false, reason: 'SpectralCausticsRenderer requires WebGPU.'};
  }
  const colorCapabilities = device.getTextureFormatCapabilities(SPECTRAL_CAUSTICS_COLOR_FORMAT);
  if (!colorCapabilities.create || !colorCapabilities.render) {
    return {supported: false, reason: 'Spectral caustics require renderable rgba16float textures.'};
  }
  if (!colorCapabilities.blend) {
    return {supported: false, reason: 'Spectral caustics require blendable rgba16float textures.'};
  }
  if (!colorCapabilities.filter) {
    return {supported: false, reason: 'Spectral caustics require filterable rgba16float textures.'};
  }
  const depthCapabilities = device.getTextureFormatCapabilities(SPECTRAL_CAUSTICS_DEPTH_FORMAT);
  if (!depthCapabilities.create) {
    return {
      supported: false,
      reason: 'Spectral caustics require depth32float textures.'
    };
  }
  return {supported: true};
}

/** Packs one frame of trace inputs using the WGSL uniform layout. */
export function makeSpectralCausticsUniformData(
  options: Omit<SpectralCausticsRendererEncodeOptions, 'prepareRefractor' | 'drawRefractor'>,
  dimensions: {captureSize: number; mapSize: number; splatRadius: number}
): ArrayBuffer {
  validateSpectralCausticsEncodeOptions({...options, drawRefractor: () => {}});
  validateSpectralCausticsUniformDimensions(dimensions);
  const arrayBuffer = new ArrayBuffer(SPECTRAL_CAUSTICS_UNIFORM_BYTE_LENGTH);
  const values = new Float32Array(arrayBuffer);
  values.set(
    options.inverseLightViewProjectionMatrix,
    SPECTRAL_CAUSTICS_UNIFORM_OFFSETS.inverseLightViewProjection
  );
  values.set(
    options.lightViewProjectionMatrix,
    SPECTRAL_CAUSTICS_UNIFORM_OFFSETS.lightViewProjection
  );
  values.set(
    [...options.receiverOrigin, options.receiverWidth],
    SPECTRAL_CAUSTICS_UNIFORM_OFFSETS.receiverOriginWidth
  );
  values.set(
    [...options.receiverTangent, options.receiverHeight],
    SPECTRAL_CAUSTICS_UNIFORM_OFFSETS.receiverTangentHeight
  );
  values.set(
    [...options.receiverBitangent, options.intensity ?? 1],
    SPECTRAL_CAUSTICS_UNIFORM_OFFSETS.receiverBitangentIntensity
  );
  values.set(
    [...options.receiverNormal, options.refractiveIndex ?? 1.5],
    SPECTRAL_CAUSTICS_UNIFORM_OFFSETS.receiverNormalRefractiveIndex
  );
  values.set(
    [...(options.absorption ?? [0, 0, 0]), options.dispersion ?? 0.02],
    SPECTRAL_CAUSTICS_UNIFORM_OFFSETS.absorptionDispersion
  );
  values.set(
    [dimensions.captureSize, dimensions.mapSize, dimensions.splatRadius, 0],
    SPECTRAL_CAUSTICS_UNIFORM_OFFSETS.targetSizes
  );
  return arrayBuffer;
}

function resolveSpectralCausticsRendererProps(
  device: Device,
  props: SpectralCausticsRendererProps
): ResolvedSpectralCausticsRendererProps {
  const resolvedProps = {
    id: props.id ?? 'spectral-caustics',
    captureSize: props.captureSize ?? DEFAULT_CAPTURE_SIZE,
    mapSize: props.mapSize ?? DEFAULT_MAP_SIZE,
    splatRadius: props.splatRadius ?? DEFAULT_SPLAT_RADIUS
  };
  validateTextureDimension(device, 'captureSize', resolvedProps.captureSize);
  validateTextureDimension(device, 'mapSize', resolvedProps.mapSize);
  if (!(resolvedProps.splatRadius > 0) || !Number.isFinite(resolvedProps.splatRadius)) {
    throw new Error('Spectral caustics splatRadius must be positive and finite.');
  }

  const photonBufferByteLength =
    resolvedProps.captureSize *
    resolvedProps.captureSize *
    SPECTRAL_CAUSTICS_WAVELENGTH_COUNT *
    SPECTRAL_CAUSTICS_SPLAT_BYTE_LENGTH;
  if (
    !Number.isSafeInteger(photonBufferByteLength) ||
    photonBufferByteLength > device.limits.maxBufferSize ||
    photonBufferByteLength > device.limits.maxStorageBufferBindingSize
  ) {
    throw new Error('Spectral caustics photon buffer exceeds this device storage limit.');
  }
  const traceWorkgroupCount = Math.ceil(
    (resolvedProps.captureSize * resolvedProps.captureSize) / SPECTRAL_CAUSTICS_WORKGROUP_SIZE
  );
  if (traceWorkgroupCount > device.limits.maxComputeWorkgroupsPerDimension) {
    throw new Error('Spectral caustics captureSize exceeds this device compute dispatch limit.');
  }
  return resolvedProps;
}

function createSpectralCausticsRendererResources(
  device: Device,
  props: ResolvedSpectralCausticsRendererProps
): SpectralCausticsRendererResources {
  const cleanupActions: Array<() => void> = [];
  const own = <Resource extends {destroy(): void}>(resource: Resource): Resource => {
    cleanupActions.push(() => resource.destroy());
    return resource;
  };

  try {
    const frontNormalTexture = own(
      createCaptureNormalTexture(device, `${props.id}-front-normal`, props.captureSize)
    );
    const frontDepthTexture = own(
      createCaptureDepthTexture(device, `${props.id}-front-depth`, props.captureSize)
    );
    const frontFramebuffer = own(
      device.createFramebuffer({
        id: `${props.id}-front-framebuffer`,
        width: props.captureSize,
        height: props.captureSize,
        colorAttachments: [frontNormalTexture],
        depthStencilAttachment: frontDepthTexture
      })
    );
    const backNormalTexture = own(
      createCaptureNormalTexture(device, `${props.id}-back-normal`, props.captureSize)
    );
    const backDepthTexture = own(
      createCaptureDepthTexture(device, `${props.id}-back-depth`, props.captureSize)
    );
    const backFramebuffer = own(
      device.createFramebuffer({
        id: `${props.id}-back-framebuffer`,
        width: props.captureSize,
        height: props.captureSize,
        colorAttachments: [backNormalTexture],
        depthStencilAttachment: backDepthTexture
      })
    );
    const causticMap = own(
      device.createTexture({
        id: `${props.id}-xyz-map`,
        width: props.mapSize,
        height: props.mapSize,
        format: SPECTRAL_CAUSTICS_COLOR_FORMAT,
        usage: Texture.SAMPLE | Texture.RENDER | Texture.COPY_SRC,
        sampler: {magFilter: 'linear', minFilter: 'linear'}
      })
    );
    const causticFramebuffer = own(
      device.createFramebuffer({
        id: `${props.id}-xyz-framebuffer`,
        width: props.mapSize,
        height: props.mapSize,
        colorAttachments: [causticMap]
      })
    );
    const photonBufferByteLength =
      props.captureSize *
      props.captureSize *
      SPECTRAL_CAUSTICS_WAVELENGTH_COUNT *
      SPECTRAL_CAUSTICS_SPLAT_BYTE_LENGTH;
    const photonSplats = own(
      device.createBuffer({
        id: `${props.id}-photon-splats`,
        byteLength: photonBufferByteLength,
        usage: Buffer.STORAGE | Buffer.COPY_SRC
      })
    );
    const uniformBuffer = own(
      device.createBuffer({
        id: `${props.id}-uniforms`,
        byteLength: SPECTRAL_CAUSTICS_UNIFORM_BYTE_LENGTH,
        usage: Buffer.UNIFORM | Buffer.COPY_DST
      })
    );
    const traceComputation = own(
      new Computation(device, {
        id: `${props.id}-trace`,
        source: SPECTRAL_CAUSTICS_TRACE_SHADER,
        shaderLayout: {bindings: [...SPECTRAL_CAUSTICS_TRACE_BINDINGS]},
        bindings: {
          frontNormalTexture,
          frontDepthTexture,
          backNormalTexture,
          backDepthTexture,
          photonSplats,
          uniforms: uniformBuffer
        }
      })
    );
    const splatModel = own(
      new Model(device, {
        id: `${props.id}-splat`,
        source: SPECTRAL_CAUSTICS_SPLAT_SHADER,
        shaderLayout: {attributes: [], bindings: [...SPECTRAL_CAUSTICS_SPLAT_BINDINGS]},
        bindings: {photonSplats},
        topology: 'triangle-list',
        vertexCount: 6,
        instanceCount: props.captureSize * props.captureSize * SPECTRAL_CAUSTICS_WAVELENGTH_COUNT,
        isInstanced: true,
        colorAttachmentFormats: [SPECTRAL_CAUSTICS_COLOR_FORMAT],
        parameters: SPLAT_PARAMETERS
      })
    );

    return {
      frontNormalTexture,
      frontDepthTexture,
      frontFramebuffer,
      backNormalTexture,
      backDepthTexture,
      backFramebuffer,
      causticMap,
      causticFramebuffer,
      photonSplats,
      uniformBuffer,
      traceComputation,
      splatModel
    };
  } catch (error) {
    for (const cleanup of cleanupActions.reverse()) {
      try {
        cleanup();
      } catch {
        // Preserve the construction error after attempting every owned cleanup.
      }
    }
    throw error;
  }
}

function createCaptureNormalTexture(device: Device, id: string, size: number): Texture {
  return device.createTexture({
    id,
    width: size,
    height: size,
    format: SPECTRAL_CAUSTICS_COLOR_FORMAT,
    usage: Texture.SAMPLE | Texture.RENDER,
    sampler: {magFilter: 'nearest', minFilter: 'nearest'}
  });
}

function createCaptureDepthTexture(device: Device, id: string, size: number): Texture {
  return device.createTexture({
    id,
    width: size,
    height: size,
    format: SPECTRAL_CAUSTICS_DEPTH_FORMAT,
    usage: Texture.SAMPLE | Texture.RENDER,
    sampler: {magFilter: 'nearest', minFilter: 'nearest'}
  });
}

function destroySpectralCausticsRendererResources(
  resources: SpectralCausticsRendererResources
): void {
  let firstError: unknown;
  const destroy = (resource: {destroy(): void}) => {
    try {
      resource.destroy();
    } catch (error) {
      firstError ??= error;
    }
  };

  destroy(resources.splatModel);
  destroy(resources.traceComputation);
  destroy(resources.uniformBuffer);
  destroy(resources.photonSplats);
  destroy(resources.causticFramebuffer);
  destroy(resources.backFramebuffer);
  destroy(resources.frontFramebuffer);
  destroy(resources.causticMap);
  destroy(resources.backDepthTexture);
  destroy(resources.backNormalTexture);
  destroy(resources.frontDepthTexture);
  destroy(resources.frontNormalTexture);
  if (firstError) {
    throw firstError;
  }
}

function validateSpectralCausticsEncodeOptions(
  options: SpectralCausticsRendererEncodeOptions
): void {
  validateNumericArray('lightViewProjectionMatrix', options.lightViewProjectionMatrix, 16);
  validateNumericArray(
    'inverseLightViewProjectionMatrix',
    options.inverseLightViewProjectionMatrix,
    16
  );
  validateNumericArray('receiverOrigin', options.receiverOrigin, 3);
  validateUnitVector('receiverTangent', options.receiverTangent);
  validateUnitVector('receiverBitangent', options.receiverBitangent);
  validateUnitVector('receiverNormal', options.receiverNormal);
  if (
    Math.abs(dot3(options.receiverTangent, options.receiverBitangent)) > 0.01 ||
    Math.abs(dot3(options.receiverTangent, options.receiverNormal)) > 0.01 ||
    Math.abs(dot3(options.receiverBitangent, options.receiverNormal)) > 0.01
  ) {
    throw new Error('Spectral caustics receiver axes must be orthogonal.');
  }
  if (
    !Number.isFinite(options.receiverWidth) ||
    !Number.isFinite(options.receiverHeight) ||
    !(options.receiverWidth > 0) ||
    !(options.receiverHeight > 0)
  ) {
    throw new Error('Spectral caustics receiver dimensions must be positive and finite.');
  }
  const refractiveIndex = options.refractiveIndex ?? 1.5;
  const dispersion = options.dispersion ?? 0.02;
  const intensity = options.intensity ?? 1;
  if (!Number.isFinite(refractiveIndex) || refractiveIndex <= 1) {
    throw new Error('Spectral caustics refractiveIndex must be finite and greater than one.');
  }
  if (!Number.isFinite(dispersion) || dispersion < 0) {
    throw new Error('Spectral caustics dispersion must be finite and non-negative.');
  }
  if (!Number.isFinite(intensity) || intensity < 0) {
    throw new Error('Spectral caustics intensity must be finite and non-negative.');
  }
  const absorption = options.absorption ?? [0, 0, 0];
  validateNumericArray('absorption', absorption, 3);
  if (absorption.some(coefficient => coefficient < 0)) {
    throw new Error('Spectral caustics absorption must be non-negative.');
  }
}

function validateSpectralCausticsUniformDimensions(dimensions: {
  captureSize: number;
  mapSize: number;
  splatRadius: number;
}): void {
  if (!Number.isSafeInteger(dimensions.captureSize) || dimensions.captureSize < 1) {
    throw new Error('Spectral caustics captureSize must be a positive integer.');
  }
  if (!Number.isSafeInteger(dimensions.mapSize) || dimensions.mapSize < 1) {
    throw new Error('Spectral caustics mapSize must be a positive integer.');
  }
  if (!(dimensions.splatRadius > 0) || !Number.isFinite(dimensions.splatRadius)) {
    throw new Error('Spectral caustics splatRadius must be positive and finite.');
  }
}

function validateTextureDimension(device: Device, name: string, value: number): void {
  if (!Number.isSafeInteger(value) || value < 1 || value > device.limits.maxTextureDimension2D) {
    throw new Error(
      `Spectral caustics ${name} must be an integer from 1 to ${device.limits.maxTextureDimension2D}.`
    );
  }
}

function validateNumericArray(name: string, values: ArrayLike<number>, length: number): void {
  if (values.length !== length) {
    throw new Error(`Spectral caustics ${name} must contain ${length} values.`);
  }
  for (let valueIndex = 0; valueIndex < length; valueIndex++) {
    if (!Number.isFinite(values[valueIndex])) {
      throw new Error(`Spectral caustics ${name} values must be finite.`);
    }
  }
}

function validateUnitVector(name: string, vector: Readonly<NumberArray3>): void {
  validateNumericArray(name, vector, 3);
  const length = Math.sqrt(dot3(vector, vector));
  if (Math.abs(length - 1) > 0.01) {
    throw new Error(`Spectral caustics ${name} must have unit length.`);
  }
}

function dot3(left: Readonly<NumberArray3>, right: Readonly<NumberArray3>): number {
  return left[0] * right[0] + left[1] * right[1] + left[2] * right[2];
}
