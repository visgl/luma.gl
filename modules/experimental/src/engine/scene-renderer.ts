// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  Buffer,
  type BufferLayout,
  type Device,
  type Framebuffer,
  type RenderPass,
  Texture,
  type TextureFormatColor,
  textureFormatDecoder
} from '@luma.gl/core';
import {
  type Geometry,
  type Model,
  type ModelProps,
  type MorphTargetAttributes,
  ShaderInputs,
  updateMorphTargetBuffers
} from '@luma.gl/engine';
import {
  type Light,
  PBR_TONE_MAP_MODE,
  type PBRMaterialBindings,
  type PBRMaterialUniforms,
  pbrMaterial,
  pbrScene,
  type SkinProps,
  skin
} from '@luma.gl/shadertools';
import {Matrix4, type NumericArray} from '@math.gl/core';
import {
  createPBRMaterial,
  createPBRMaterialFactory,
  getPBRMaterialMapUniforms,
  type PBRMaterial
} from './pbr-material';
import {createPBRModel, getPBRGeometryDefines} from './pbr-model';

/** Pipeline-level alpha representation for one retained physically based scene material. */
export type SceneAlphaMode = 'OPAQUE' | 'MASK' | 'BLEND';

/** Format-independent description of one physically based scene material. */
export type SceneMaterial = {
  /** Stable material identity supplied by the scene adapter. */
  id: string;
  /** Optional adapter-owned material version; uniform changes never rebuild the pipeline. */
  version?: number;
  /** Canonical shadertools PBR uniforms, including extension factors and UV transforms. */
  uniforms?: PBRMaterialUniforms;
  /** Canonical group-3 PBR texture bindings. */
  bindings?: Partial<PBRMaterialBindings>;
  /** Opaque, alpha-masked, or alpha-blended pipeline behavior. */
  alphaMode?: SceneAlphaMode;
  /** Disables back-face culling when enabled. */
  doubleSided?: boolean;
  /** Additional shader feature definitions supplied by a scene adapter. */
  defines?: Record<string, boolean | number>;
};

/** One reusable surface and all of its world-space instance placements. */
export type SceneSurface = {
  /** Stable surface identity supplied by the scene adapter. */
  id: string;
  /** CPU geometry, preserving original semantic attribute names. */
  geometry: Geometry;
  /** Optional adapter-owned geometry version used for structural invalidation. */
  geometryVersion?: number;
  /** Physically based material used by every instance in this draw batch. */
  material: SceneMaterial;
  /** Column-major world matrices; all placements remain in a single instanced draw. */
  transforms: readonly Readonly<NumericArray>[];
  /** Optional adapter-owned joint palette for geometry with JOINTS_0 and WEIGHTS_0. */
  skin?: SkinProps;
  /** Immutable glTF-style displacement attributes for each morph target. */
  morphTargets?: readonly MorphTargetAttributes[];
  /** Current morph weights; uniform-only changes never recreate the model. */
  morphWeights?: readonly number[];
};

/** Camera state shared by forward and deferred scene renderers. */
export type SceneCamera = {
  /** World-to-view transform. */
  viewMatrix: Readonly<NumericArray>;
  /** View-to-clip transform. */
  projectionMatrix: Readonly<NumericArray>;
  /** World-space camera position. */
  position: Readonly<NumericArray>;
};

/** Optional prefiltered image-based-lighting resources. Textures remain caller-owned. */
export type SceneEnvironment = {
  /** Diffuse irradiance cubemap. */
  diffuseTexture?: Texture;
  /** Prefiltered specular cubemap. */
  specularTexture?: Texture;
  /** BRDF integration lookup texture. */
  brdfLUTTexture?: Texture;
  /** Environment radiance multiplier. */
  intensity?: number;
  /** Horizontal environment rotation in radians. */
  rotation?: number;
};

/** Portable rendering inputs consumed by shared forward and deferred renderers. */
export type SceneRenderOptions = {
  /** Stable frame identity used to retain compiled models between renders. */
  id: string;
  /** Format-independent retained surface batches. */
  surfaces: readonly SceneSurface[];
  /** Camera projection and world-space position. */
  camera: SceneCamera;
  /** Normalized scene lights. */
  lights?: readonly Light[];
  /** Linear RGBA clear color. */
  background?: readonly number[];
  /** Optional caller-owned render target. Defaults to the active canvas. */
  framebuffer?: Framebuffer;
  /** Render-target width when a framebuffer is not supplied. */
  width?: number;
  /** Render-target height when a framebuffer is not supplied. */
  height?: number;
  /** Optional complete image-based-lighting environment. */
  environment?: SceneEnvironment;
  /** Captures opaque scene color for physical transmission. Enabled automatically by default. */
  transmission?: boolean;
  /** Scene exposure multiplier. */
  exposure?: number;
  /** Zero disables tone mapping; one selects Reinhard, two Khronos PBR Neutral, three ACES. */
  toneMapMode?: number;
  /** Output transfer function; floating-point and hardware-sRGB targets default to linear. */
  outputColorSpace?: 'linear' | 'srgb';
  /** Optional world-space fog color used by deferred lighting. */
  fogColor?: readonly number[];
  /** Optional exponential fog density used by deferred lighting. */
  fogDensity?: number;
  /** Debug output selected without introducing a format-specific shader module. */
  renderMode?: 'default' | 'debugNormals' | 'debugDepth';
};

/** Draw statistics returned by the shared scene rendering contract. */
export type SceneRenderStatistics = {
  surfaceCount: number;
  instanceCount: number;
  drawCount: number;
  triangleCount: number;
};

type CompiledSceneSurface = {
  id: string;
  source: SceneSurface;
  material: PBRMaterial;
  model: Model;
  instanceBuffers: Buffer[];
  instanceColumns: Float32Array[];
  signature: string;
  textureBindings: [string, unknown][];
  triangleCount: number;
  alphaMode: SceneAlphaMode;
  transmissive: boolean;
  depth: number;
  morphWeights?: readonly number[];
};

type SceneTransmissionResources = {
  colorTexture: Texture;
  depthTexture: Texture;
  framebuffer: Framebuffer;
};

type SceneFrameResources = {
  surfaces: Map<string, CompiledSceneSurface>;
  transmission?: SceneTransmissionResources;
};

/** Prepared scene data available to specialized renderers before opening a render pass. */
export type PreparedScene = {
  /** Prepared opaque and blended model batches in draw order. */
  surfaces: readonly {
    model: Model;
    alphaMode: SceneAlphaMode;
    depth: number;
    transmissive?: boolean;
  }[];
  /** Surface, instance, and triangle counts; draw count is populated after the render pass. */
  statistics: SceneRenderStatistics;
};

const IDENTITY_MATRIX = new Matrix4();

/**
 * Renders retained physically based scene descriptions on WebGL and WebGPU.
 *
 * Resource ownership, instancing, texture specialization, and transparent ordering stay in the
 * engine while higher-level packages adapt their own handles into generic scene descriptors.
 */
export class SceneRenderer {
  /** Device that owns cached scene models and instance buffers. */
  readonly device: Device;

  private readonly materialFactory;
  private readonly frames = new Map<string, SceneFrameResources>();

  constructor(device: Device) {
    this.device = device;
    this.materialFactory = createPBRMaterialFactory(device);
  }

  /** Compiles, updates, orders, and draws one retained frame. */
  render(options: SceneRenderOptions): SceneRenderStatistics {
    const transmission = this.getTransmissionResources(options);
    const background = options.background || [0, 0, 0, 1];

    if (transmission) {
      const captureOptions: SceneRenderOptions = {
        ...options,
        id: getTransmissionCaptureIdentifier(options.id),
        surfaces: options.surfaces.filter(
          surface =>
            !isTransmissiveSurface(surface) && getSceneAlphaMode(surface.material) !== 'BLEND'
        ),
        framebuffer: transmission.framebuffer,
        exposure: 1,
        toneMapMode: PBR_TONE_MAP_MODE.NONE,
        outputColorSpace: 'linear',
        transmission: false
      };
      const capturedScene = this.prepareScene(captureOptions);
      const capturePass = this.device.beginRenderPass({
        id: `scene-${options.id}-transmission`,
        framebuffer: transmission.framebuffer,
        clearColor: [background[0], background[1], background[2], background[3] ?? 1],
        clearDepth: 1
      });
      this.drawPreparedScene(capturedScene, capturePass);
      capturePass.end();
    } else {
      this.destroyFrame(getTransmissionCaptureIdentifier(options.id));
    }

    const scene = this.prepareScene(options, transmission?.colorTexture);
    const renderPass = this.device.beginRenderPass({
      id: `scene-${options.id}`,
      framebuffer: options.framebuffer,
      clearColor: getPresentedSceneBackground(this.device, options, background),
      clearDepth: 1
    });
    scene.statistics.drawCount = this.drawPreparedScene(scene, renderPass);
    renderPass.end();
    return scene.statistics;
  }

  /** Destroys cached models and instance buffers associated with one frame identity. */
  destroyFrame(frameIdentifier: string): void {
    const resources = this.frames.get(frameIdentifier);
    if (!resources) {
      return;
    }

    for (const surface of resources.surfaces.values()) {
      destroyCompiledSceneSurface(surface);
    }
    destroyTransmissionResources(resources.transmission);
    this.frames.delete(frameIdentifier);
    if (resources.transmission) {
      this.destroyFrame(getTransmissionCaptureIdentifier(frameIdentifier));
    }
  }

  /** Releases all engine-owned scene models, materials, and instance buffers. */
  destroy(): void {
    for (const frameIdentifier of Array.from(this.frames.keys())) {
      this.destroyFrame(frameIdentifier);
    }
  }

  /** Creates or updates all models and uploads uniforms before a render pass begins. */
  protected prepareScene(
    options: SceneRenderOptions,
    transmissionTexture?: Texture
  ): PreparedScene {
    let resources = this.frames.get(options.id);
    if (!resources) {
      resources = {surfaces: new Map()};
      this.frames.set(options.id, resources);
    }

    const surfaceIdentifiers = new Set<string>();
    const preparedSurfaces: CompiledSceneSurface[] = [];
    let instanceCount = 0;
    let triangleCount = 0;

    for (const surface of options.surfaces) {
      if (surface.transforms.length === 0) {
        continue;
      }

      const surfaceTransmissionTexture = isTransmissiveSurface(surface)
        ? transmissionTexture
        : undefined;
      const compiledSurface = this.getCompiledSurface(
        resources,
        surface,
        options,
        surfaceTransmissionTexture
      );
      updateInstanceTransforms(compiledSurface, surface.transforms);
      if (hasUsableSkin(surface)) {
        compiledSurface.model.shaderInputs.setProps({skin: surface.skin});
      }
      updateMorphAttributes(compiledSurface, surface);
      compiledSurface.material.setProps({
        pbrMaterial: {
          ...getPBRMaterialMapUniforms(surface.material.bindings || {}),
          ...surface.material.uniforms,
          alphaCutoffEnabled: compiledSurface.alphaMode === 'MASK',
          IBLenabled: hasCompleteEnvironment(options.environment)
        }
      });
      setSceneShaderInputs(compiledSurface.model, options, surfaceTransmissionTexture);
      compiledSurface.model.predraw(this.device.commandEncoder);
      compiledSurface.depth = getSurfaceDepth(surface.transforms, options.camera.viewMatrix);
      surfaceIdentifiers.add(surface.id);
      preparedSurfaces.push(compiledSurface);
      instanceCount += surface.transforms.length;
      triangleCount += compiledSurface.triangleCount * surface.transforms.length;
    }

    for (const [surfaceIdentifier, compiledSurface] of resources.surfaces) {
      if (!surfaceIdentifiers.has(surfaceIdentifier)) {
        destroyCompiledSceneSurface(compiledSurface);
        resources.surfaces.delete(surfaceIdentifier);
      }
    }

    preparedSurfaces.sort((firstSurface, secondSurface) => {
      const firstIsTransparent = firstSurface.alphaMode === 'BLEND';
      const secondIsTransparent = secondSurface.alphaMode === 'BLEND';
      if (firstIsTransparent !== secondIsTransparent) {
        return firstIsTransparent ? 1 : -1;
      }
      if (!firstIsTransparent && firstSurface.transmissive !== secondSurface.transmissive) {
        return firstSurface.transmissive ? 1 : -1;
      }
      return firstIsTransparent ? secondSurface.depth - firstSurface.depth : 0;
    });

    return {
      surfaces: preparedSurfaces,
      statistics: {
        surfaceCount: preparedSurfaces.length,
        instanceCount,
        drawCount: 0,
        triangleCount
      }
    };
  }

  /** Issues all prepared draw calls into a caller-owned render pass. */
  protected drawPreparedScene(scene: PreparedScene, renderPass: RenderPass): number {
    let drawCount = 0;
    for (const surface of scene.surfaces) {
      if (surface.model.draw(renderPass)) {
        drawCount++;
      }
    }
    return drawCount;
  }

  /** Supplies specialized model properties for alternate render targets such as G-buffers. */
  protected getSurfaceModelOptions(
    _surface: SceneSurface,
    _options: SceneRenderOptions
  ): Partial<ModelProps> {
    return {};
  }

  private getCompiledSurface(
    resources: SceneFrameResources,
    surface: SceneSurface,
    options: SceneRenderOptions,
    transmissionTexture?: Texture
  ): CompiledSceneSurface {
    const alphaMode = getSceneAlphaMode(surface.material);
    const signature = getSceneSurfaceSignature(surface, options, alphaMode, transmissionTexture);
    const textureBindings = Object.entries(surface.material.bindings || {}).filter(([, texture]) =>
      Boolean(texture)
    );
    let compiledSurface = resources.surfaces.get(surface.id);

    if (
      compiledSurface &&
      (compiledSurface.source.geometry !== surface.geometry ||
        compiledSurface.signature !== signature ||
        !areTextureBindingsEqual(compiledSurface.textureBindings, textureBindings))
    ) {
      destroyCompiledSceneSurface(compiledSurface);
      resources.surfaces.delete(surface.id);
      compiledSurface = undefined;
    }

    if (!compiledSurface) {
      const material = createPBRMaterial(this.device, {
        id: surface.material.id,
        uniforms: surface.material.uniforms,
        bindings: surface.material.bindings,
        factory: this.materialFactory
      });
      const instanceBuffers: Buffer[] = [];
      const instanceColumns: Float32Array[] = [];
      const attributes: Record<string, Buffer> = {};
      const bufferLayout: BufferLayout[] = [];

      for (let columnIndex = 0; columnIndex < 4; columnIndex++) {
        const column = new Float32Array(surface.transforms.length * 4);
        const buffer = this.device.createBuffer({
          id: `${surface.id}-instance-column-${columnIndex}`,
          data: column,
          usage: Buffer.VERTEX | Buffer.COPY_DST
        });
        const attributeName = `instanceModelMatrixCol${columnIndex}`;
        attributes[attributeName] = buffer;
        bufferLayout.push({name: attributeName, format: 'float32x4', stepMode: 'instance'});
        instanceBuffers.push(buffer);
        instanceColumns.push(column);
      }

      const overrides = this.getSurfaceModelOptions(surface, options);
      const hasSkin = hasUsableSkin(surface);
      const model = createPBRModel(this.device, {
        id: `${surface.id}-model`,
        geometry: surface.geometry,
        topology: surface.geometry.topology,
        material,
        attributes,
        bufferLayout,
        instanceCount: surface.transforms.length,
        shaderInputs: new ShaderInputs({pbrMaterial, pbrScene, ...(hasSkin ? {skin} : {})}),
        colorAttachmentFormats: options.framebuffer?.colorAttachments.map(
          attachment => attachment.texture.format as TextureFormatColor
        ),
        parameters: {
          cullMode: surface.material.doubleSided ? 'none' : 'back',
          depthWriteEnabled: alphaMode !== 'BLEND',
          depthCompare: 'less-equal',
          blend: alphaMode === 'BLEND',
          blendColorSrcFactor: 'src-alpha',
          blendColorDstFactor: 'one-minus-src-alpha',
          blendAlphaSrcFactor: 'one',
          blendAlphaDstFactor: 'one-minus-src-alpha',
          ...overrides.parameters
        },
        ...overrides,
        defines: {
          HAS_INSTANCING: true,
          USE_MATERIAL_EXTENSIONS: true,
          ALPHA_CUTOFF: alphaMode === 'MASK',
          USE_IBL: hasCompleteEnvironment(options.environment),
          USE_SCENE_ENVIRONMENT: hasCompleteEnvironment(options.environment),
          USE_TEX_LOD: hasMipmappedEnvironment(options.environment),
          USE_TRANSMISSION_FRAMEBUFFER: Boolean(transmissionTexture),
          USE_SCENE_COLOR_MANAGEMENT: true,
          DEBUG_NORMALS: options.renderMode === 'debugNormals',
          DEBUG_DEPTH: options.renderMode === 'debugDepth',
          ...surface.material.defines,
          ...overrides.defines,
          HAS_SKIN: hasSkin
        }
      });

      compiledSurface = {
        id: surface.id,
        source: surface,
        material,
        model,
        instanceBuffers,
        instanceColumns,
        signature,
        textureBindings,
        triangleCount: Math.floor(
          (surface.geometry.indices?.value.length || surface.geometry.vertexCount) / 3
        ),
        alphaMode,
        transmissive: Boolean(transmissionTexture),
        depth: 0
      };
      resources.surfaces.set(surface.id, compiledSurface);
    }

    compiledSurface.source = surface;
    return compiledSurface;
  }

  private getTransmissionResources(
    options: SceneRenderOptions
  ): SceneTransmissionResources | undefined {
    const captureEnabled =
      options.transmission !== false &&
      (!options.renderMode || options.renderMode === 'default') &&
      options.surfaces.some(isTransmissiveSurface);
    let resources = this.frames.get(options.id);

    if (!captureEnabled) {
      if (resources?.transmission) {
        destroyTransmissionResources(resources.transmission);
        resources.transmission = undefined;
      }
      return undefined;
    }

    if (!resources) {
      resources = {surfaces: new Map()};
      this.frames.set(options.id, resources);
    }

    const [width, height] = getSceneRenderSize(this.device, options);
    if (
      resources.transmission &&
      (resources.transmission.colorTexture.width !== width ||
        resources.transmission.colorTexture.height !== height)
    ) {
      destroyTransmissionResources(resources.transmission);
      resources.transmission = undefined;
    }

    if (!resources.transmission) {
      const colorTexture = this.device.createTexture({
        id: `scene-${options.id}-transmission-color`,
        width,
        height,
        format: getTransmissionTextureFormat(this.device),
        usage: Texture.SAMPLE | Texture.RENDER,
        sampler: {
          minFilter: 'linear',
          magFilter: 'linear',
          addressModeU: 'clamp-to-edge',
          addressModeV: 'clamp-to-edge'
        }
      });
      const depthTexture = this.device.createTexture({
        id: `scene-${options.id}-transmission-depth`,
        width,
        height,
        format: 'depth24plus',
        usage: Texture.RENDER
      });
      const framebuffer = this.device.createFramebuffer({
        id: `scene-${options.id}-transmission-framebuffer`,
        width,
        height,
        colorAttachments: [colorTexture],
        depthStencilAttachment: depthTexture
      });
      resources.transmission = {colorTexture, depthTexture, framebuffer};
    }

    return resources.transmission;
  }
}

function updateMorphAttributes(compiledSurface: CompiledSceneSurface, surface: SceneSurface): void {
  if (!surface.morphTargets?.length) {
    return;
  }

  const weights = surface.morphWeights || [];
  if (
    compiledSurface.morphWeights?.length === weights.length &&
    compiledSurface.morphWeights.every((weight, index) => weight === weights[index])
  ) {
    return;
  }

  updateMorphTargetBuffers(compiledSurface.model, surface.geometry, surface.morphTargets, weights);
  compiledSurface.morphWeights = [...weights];
}

/** Resolves the structural alpha mode, including legacy materials that only supply opacity. */
export function getSceneAlphaMode(material: SceneMaterial): SceneAlphaMode {
  if (material.alphaMode) {
    return material.alphaMode;
  }
  return (material.uniforms?.baseColorFactor?.[3] ?? 1) < 1 ? 'BLEND' : 'OPAQUE';
}

function getSceneSurfaceSignature(
  surface: SceneSurface,
  options: SceneRenderOptions,
  alphaMode: SceneAlphaMode,
  transmissionTexture?: Texture
): string {
  return JSON.stringify({
    geometryVersion: surface.geometryVersion,
    material: surface.material.id,
    instanceCount: surface.transforms.length,
    alphaMode,
    doubleSided: Boolean(surface.material.doubleSided),
    skin: hasUsableSkin(surface),
    defines: Object.entries(surface.material.defines || {}).sort(([first], [second]) =>
      first.localeCompare(second)
    ),
    environment: hasCompleteEnvironment(options.environment),
    environmentMipmapped: hasMipmappedEnvironment(options.environment),
    transmission: Boolean(transmissionTexture),
    transmissionWidth: transmissionTexture?.width,
    transmissionHeight: transmissionTexture?.height,
    colorFormat: options.framebuffer?.colorAttachments[0]?.texture.format,
    renderMode: options.renderMode || 'default'
  });
}

function areTextureBindingsEqual(
  firstBindings: readonly [string, unknown][],
  secondBindings: readonly [string, unknown][]
): boolean {
  if (firstBindings.length !== secondBindings.length) {
    return false;
  }
  return firstBindings.every(([name, texture]) =>
    secondBindings.some(
      ([secondName, secondTexture]) => name === secondName && texture === secondTexture
    )
  );
}

function updateInstanceTransforms(
  surface: CompiledSceneSurface,
  transforms: readonly Readonly<NumericArray>[]
): void {
  for (let instanceIndex = 0; instanceIndex < transforms.length; instanceIndex++) {
    const transform = transforms[instanceIndex];
    for (let columnIndex = 0; columnIndex < 4; columnIndex++) {
      for (let componentIndex = 0; componentIndex < 4; componentIndex++) {
        surface.instanceColumns[columnIndex][instanceIndex * 4 + componentIndex] =
          transform[columnIndex * 4 + componentIndex];
      }
    }
  }

  for (let columnIndex = 0; columnIndex < 4; columnIndex++) {
    surface.instanceBuffers[columnIndex].write(surface.instanceColumns[columnIndex]);
  }
}

function setSceneShaderInputs(
  model: Model,
  options: SceneRenderOptions,
  transmissionTexture?: Texture
): void {
  const viewMatrix = new Matrix4(options.camera.viewMatrix);
  const projectionMatrix = new Matrix4(options.camera.projectionMatrix);
  const framebufferWidth =
    options.framebuffer?.width || options.width || transmissionTexture?.width || 1;
  const framebufferHeight =
    options.framebuffer?.height || options.height || transmissionTexture?.height || 1;

  model.shaderInputs.setProps({
    pbrProjection: {
      modelViewProjectionMatrix: new Matrix4(projectionMatrix).multiplyRight(viewMatrix),
      modelMatrix: IDENTITY_MATRIX,
      normalMatrix: IDENTITY_MATRIX,
      camera: options.camera.position
    },
    pbrScene: {
      exposure: options.exposure ?? 1,
      toneMapMode: getSceneToneMapMode(model.device, options),
      environmentIntensity: options.environment?.intensity ?? 1,
      environmentRotation: options.environment?.rotation ?? 0,
      environmentMipCount: options.environment?.specularTexture?.mipLevels ?? 1,
      outputEncoding: getSceneOutputEncoding(model.device, options),
      framebufferSize: [framebufferWidth, framebufferHeight],
      viewMatrix,
      projectionMatrix,
      ...(transmissionTexture ? {pbr_transmissionFramebufferSampler: transmissionTexture} : {})
    },
    lighting: {lights: Array.from(options.lights || []), useByteColors: false},
    ...(hasCompleteEnvironment(options.environment)
      ? {
          ibl: {
            pbr_diffuseEnvSampler: options.environment!.diffuseTexture,
            pbr_specularEnvSampler: options.environment!.specularTexture,
            pbr_brdfLUT: options.environment!.brdfLUTTexture
          }
        }
      : {})
  });
}

function hasCompleteEnvironment(environment?: SceneEnvironment): boolean {
  return Boolean(
    environment?.diffuseTexture && environment.specularTexture && environment.brdfLUTTexture
  );
}

function hasMipmappedEnvironment(environment?: SceneEnvironment): boolean {
  return hasCompleteEnvironment(environment) && (environment?.specularTexture?.mipLevels ?? 1) > 1;
}

function isTransmissiveSurface(surface: SceneSurface): boolean {
  return (surface.material.uniforms?.transmissionFactor ?? 0) > 0;
}

function hasUsableSkin(surface: SceneSurface): boolean {
  return Boolean(
    surface.skin?.jointMatrices?.length && getPBRGeometryDefines(surface.geometry)['HAS_SKIN']
  );
}

function getTransmissionCaptureIdentifier(frameIdentifier: string): string {
  return `${frameIdentifier}::linear-transmission-capture`;
}

function getTransmissionTextureFormat(device: Device): 'rgba16float' | 'rgba8unorm' {
  const capabilities = device.getTextureFormatCapabilities('rgba16float');
  return capabilities.render && capabilities.filter ? 'rgba16float' : 'rgba8unorm';
}

function getSceneColorFormat(device: Device, options: SceneRenderOptions): TextureFormatColor {
  return (
    (options.framebuffer?.colorAttachments[0]?.texture.format as TextureFormatColor | undefined) ||
    device.preferredColorFormat
  );
}

function isFloatingPointColorFormat(format: TextureFormatColor): boolean {
  const formatInformation = textureFormatDecoder.getInfo(format);
  return Boolean(formatInformation.dataType?.startsWith('float') || format.endsWith('ufloat'));
}

function getSceneToneMapMode(device: Device, options: SceneRenderOptions): number {
  return (
    options.toneMapMode ??
    (isFloatingPointColorFormat(getSceneColorFormat(device, options))
      ? PBR_TONE_MAP_MODE.NONE
      : PBR_TONE_MAP_MODE.KHRONOS_PBR_NEUTRAL)
  );
}

function getSceneOutputEncoding(device: Device, options: SceneRenderOptions): number {
  if (options.outputColorSpace) {
    return options.outputColorSpace === 'srgb' ? 1 : 0;
  }
  const format = getSceneColorFormat(device, options);
  return isFloatingPointColorFormat(format) || format.endsWith('-srgb') ? 0 : 1;
}

function getPresentedSceneBackground(
  device: Device,
  options: SceneRenderOptions,
  background: readonly number[]
): [number, number, number, number] {
  const exposure = Math.max(options.exposure ?? 1, 0);
  let color: [number, number, number] = [
    Math.max(background[0], 0) * exposure,
    Math.max(background[1], 0) * exposure,
    Math.max(background[2], 0) * exposure
  ];

  switch (getSceneToneMapMode(device, options)) {
    case PBR_TONE_MAP_MODE.REINHARD:
      color = color.map(channel => channel / (1 + channel)) as [number, number, number];
      break;

    case PBR_TONE_MAP_MODE.KHRONOS_PBR_NEUTRAL:
      color = toneMapSceneBackgroundNeutral(color);
      break;

    case PBR_TONE_MAP_MODE.ACES:
      color = color.map(channel =>
        Math.min(
          Math.max(
            (channel * (2.51 * channel + 0.03)) / (channel * (2.43 * channel + 0.59) + 0.14),
            0
          ),
          1
        )
      ) as [number, number, number];
      break;
  }

  if (getSceneOutputEncoding(device, options) !== 0) {
    color = color.map(channel =>
      channel <= 0.0031308 ? channel * 12.92 : 1.055 * channel ** (1 / 2.4) - 0.055
    ) as [number, number, number];
  }

  return [...color, background[3] ?? 1];
}

function toneMapSceneBackgroundNeutral(color: [number, number, number]): [number, number, number] {
  const darkestChannel = Math.min(...color);
  const offset =
    darkestChannel < 0.08 ? darkestChannel - 6.25 * darkestChannel * darkestChannel : 0.04;
  const offsetColor = color.map(channel => channel - offset) as [number, number, number];
  const peak = Math.max(...offsetColor);
  const compressionStart = 0.76;

  if (peak < compressionStart) {
    return offsetColor;
  }

  const compressionRange = 1 - compressionStart;
  const compressedPeak =
    1 - (compressionRange * compressionRange) / (peak + compressionRange - compressionStart);
  const peakScale = compressedPeak / Math.max(peak, 0.0001);
  const desaturation = 1 - 1 / (0.15 * (peak - compressedPeak) + 1);

  return offsetColor.map(
    channel => channel * peakScale * (1 - desaturation) + compressedPeak * desaturation
  ) as [number, number, number];
}

function getSceneRenderSize(device: Device, options: SceneRenderOptions): [number, number] {
  if (options.framebuffer) {
    return [options.framebuffer.width, options.framebuffer.height];
  }
  if (options.width && options.height) {
    return [options.width, options.height];
  }
  return device.getDefaultCanvasContext().getDrawingBufferSize();
}

function destroyTransmissionResources(resources?: SceneTransmissionResources): void {
  if (!resources) {
    return;
  }
  resources.framebuffer.destroy();
  resources.colorTexture.destroy();
  resources.depthTexture.destroy();
}

function getSurfaceDepth(
  transforms: readonly Readonly<NumericArray>[],
  viewMatrix: Readonly<NumericArray>
): number {
  const cameraMatrix = new Matrix4(viewMatrix);
  let depth = 0;
  for (const transform of transforms) {
    const position = cameraMatrix.transformAsPoint([transform[12], transform[13], transform[14]]);
    depth -= position[2];
  }
  return depth / transforms.length;
}

function destroyCompiledSceneSurface(surface: CompiledSceneSurface): void {
  surface.model.destroy();
  surface.material.destroy();
  for (const instanceBuffer of surface.instanceBuffers) {
    instanceBuffer.destroy();
  }
}
