// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  assert,
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
  GroupNode,
  type ScenegraphNode,
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
} from '@luma.gl/shaders';
import {Matrix4, type NumericArray} from '@math.gl/core';
import {
  createPBRMaterial,
  createPBRMaterialFactory,
  getPBRMaterialMapUniforms,
  type PBRMaterial
} from './pbr-material';
import {createPBRModel, getPBRGeometryDefines} from './pbr-model';
import {sceneProbeCamera} from './scene-probe-camera';
import {sceneInstances} from './scene-instances';
import {ScenegraphSurfaces} from './scenegraph-surfaces';
import {
  ShadowMapRenderer,
  type SpotShadowLight,
  type ShadowRenderView,
  type ShadowShaderProps
} from '@luma.gl/engine/lighting';
import {shadow} from '@luma.gl/shaders';

/** Pipeline-level alpha representation for one retained physically based scene material. */
export type SceneAlphaMode = 'OPAQUE' | 'MASK' | 'BLEND';

/** Format-independent description of one physically based scene material. */
export type SceneMaterial = {
  /** Stable material identity supplied by the scene adapter. */
  id: string;
  /** Optional adapter-owned material version; uniform changes never rebuild the pipeline. */
  version?: number;
  /** Canonical shaders PBR uniforms, including extension factors and UV transforms. */
  uniforms?: PBRMaterialUniforms;
  /** Canonical group-3 PBR texture bindings. */
  bindings?: Partial<PBRMaterialBindings<Texture>>;
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
  /** Optional stable placement identities aligned one-to-one with transforms. */
  instanceIds?: readonly string[];
  /** Optional retained identities, aligned with instances for GPU picking. */
  nodes?: readonly ScenegraphNode[];
  /** Optional local reflection probe. */
  environment?: SceneEnvironment;
  /** Borrowed GPU matrices; transforms become mesh-to-producer local matrices. WebGPU only. */
  gpuTransforms?: {
    matrices: Buffer;
    matrixCount: number;
    revision: number;
    indices: readonly number[];
    connections?: readonly ({first: number; second: number; radius: number} | undefined)[];
  };
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
  /** WebGPU probe origin. viewMatrix contains only the face rotation. */
  gpuOrigin?: Buffer;
  near?: number;
  far?: number;
  clipDepth?: 'negative-one-to-one' | 'zero-to-one';
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
  /** Optional committed-scene revisions supplied by a retained format adapter. */
  sceneRevisions?: {
    /** Stable world identity; replacing a world must change this value. */
    identity: string;
    /** Increments when geometry, surface membership, or placement topology changes. */
    topology: number;
    /** Increments when retained placement transforms change. */
    transforms: number;
    /** Increments when material or sampler state changes. */
    materials: number;
    /** Increments when authored lights or ambient radiance changes. */
    lights: number;
    /** Stable placement identities affected by the current transform revision. */
    dirtyInstanceIds?: readonly string[];
  };
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
  /** Spot shadow slots correspond to the order of spot lights in lights. WebGPU only. */
  spotShadows?: {spotLights: readonly SpotShadowLight[]; mapSize?: number};
  /** Shared geometry/deformation path for depth and identity targets. WebGPU only. */
  rasterPass?: 'depth' | 'picking';
  /** Internal raster bias supplied by the shared shadow renderer. */
  rasterParameters?: ShadowRenderView['rasterParameters'];
};

/** Direct scenegraph input; renderer caches use the root object identity. */
export type ScenegraphRenderOptions = Omit<SceneRenderOptions, 'id' | 'surfaces'> & {
  scene: GroupNode;
};

/** Synchronous encoding costs for one graph-owned ray-tracing stage. */
export type RayTracingGraphStageStatistics = {
  /** Number of logical graph nodes encoded for this stage. */
  nodeCount: number;
  /** Number of physical compute passes opened by this stage. */
  computePassCount: number;
  /** Number of logical compute nodes merged into an existing physical pass. */
  coalescedComputeNodeCount: number;
  /** Synchronous CPU time spent recording this stage into the caller-owned encoder. */
  cpuEncodeTimeMilliseconds: number;
};

/** Per-frame graph totals and the individual stages actually encoded for a ray-traced frame. */
export type RayTracingGraphStatistics = RayTracingGraphStageStatistics & {
  /** Mesh topology construction; present only when geometry changes. */
  topology?: RayTracingGraphStageStatistics;
  /** Morton TLAS construction; mutually exclusive with `refit`. */
  acceleration?: RayTracingGraphStageStatistics;
  /** Retained-order TLAS refit; mutually exclusive with `acceleration`. */
  refit?: RayTracingGraphStageStatistics;
  /** Ray tracing, optional sparse carry, and presentation for the current frame. */
  trace: RayTracingGraphStageStatistics;
};

/** Draw statistics returned by the shared scene rendering contract. */
export type SceneRenderStatistics = {
  surfaceCount: number;
  instanceCount: number;
  drawCount: number;
  triangleCount: number;
  /** Optional interactive quality and history diagnostics for ray-traced frames. */
  rayTracing?: {
    internalWidth: number;
    internalHeight: number;
    resolutionScale: number;
    sampledPixelCoverage: number;
    frameTimeMilliseconds: number;
    accumulatedSamples: number;
    /** Logical owned allocations; excludes caller targets and driver/pipeline overhead. */
    memory?: {
      sceneBufferBytes: number;
      historyTextureBytes: number;
      graphTransientBytes: number;
      totalBytes: number;
    };

    /** Optional synchronous graph-stage diagnostics; never submits, waits, or reads back. */
    graph?: RayTracingGraphStatistics;
  };
};

type CompiledSceneSurface = {
  id: string;
  source: SceneSurface;
  material: PBRMaterial;
  model: Model;
  instanceBuffers: Buffer[];
  instanceColumns: Float32Array[];
  metadataBuffer: Buffer;
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
  private readonly scenegraphs = new Map<GroupNode, {id: string; adapter: ScenegraphSurfaces}>();
  private nextSceneIdentifier = 1;
  private readonly shadowMaps = new Map<string, ShadowMapRenderer>();
  private readonly pickNodes = new Map<number, ScenegraphNode>();
  private readonly frames = new Map<string, SceneFrameResources>();

  constructor(device: Device) {
    this.device = device;
    this.materialFactory = createPBRMaterialFactory(device);
  }

  /** Compiles, updates, orders, and draws one retained frame. */
  render(input: SceneRenderOptions | ScenegraphRenderOptions): SceneRenderStatistics {
    const options = this.resolveSceneOptions(input);
    if (options.camera.gpuOrigin) {
      const origin = options.camera.gpuOrigin;
      // GPU-origin cameras use a rotation-only view and the forward color pipeline.
      assert(
        this.device.type === 'webgpu' &&
          origin.device === this.device &&
          origin.byteLength >= 16 &&
          origin.usage & Buffer.STORAGE &&
          !options.spotShadows &&
          !options.rasterPass &&
          (options.transmission === false ||
            (options.renderMode && options.renderMode !== 'default') ||
            !options.surfaces.some(isTransmissiveSurface))
      );
    }
    let shadowProps: ShadowShaderProps | undefined;
    if (options.spotShadows && !options.rasterPass) shadowProps = this.renderShadows(options);
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
      const capturedScene = this.prepareScene(captureOptions, undefined, shadowProps);
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

    const scene = this.prepareScene(options, transmission?.colorTexture, shadowProps);
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

  /** Resolve nodes to retained batches without reading GPU poses. */
  protected resolveSceneOptions(
    input: SceneRenderOptions | ScenegraphRenderOptions
  ): SceneRenderOptions {
    if (!('scene' in input)) return input;
    let cached = this.scenegraphs.get(input.scene);
    if (!cached) {
      cached = {id: `scenegraph-${this.nextSceneIdentifier++}`, adapter: new ScenegraphSurfaces()};
      this.scenegraphs.set(input.scene, cached);
    }
    const {scene, ...options} = input;
    return {...options, id: cached.id, surfaces: cached.adapter.getSurfaces(scene)};
  }

  /** Release one retained root before disposing its producer or geometry resources. */
  destroyScene(scene: GroupNode): void {
    const cached = this.scenegraphs.get(scene);
    if (!cached) return;
    this.destroyFrame(cached.id);
    cached.adapter.destroy();
    this.scenegraphs.delete(scene);
  }

  /** Explicit asynchronous pixel readback; no body poses are read or copied to CPU nodes. */
  async pick(
    input: SceneRenderOptions | ScenegraphRenderOptions,
    pixel: {x: number; y: number}
  ): Promise<ScenegraphNode | undefined> {
    // This identity attachment uses WebGPU's top-left texture coordinates.
    assert(this.device.type === 'webgpu');
    const options = this.resolveSceneOptions(input);
    const [width, height] = getSceneRenderSize(this.device, options);
    if (
      !Number.isInteger(pixel.x) ||
      !Number.isInteger(pixel.y) ||
      pixel.x < 0 ||
      pixel.y < 0 ||
      pixel.x >= width ||
      pixel.y >= height
    )
      return undefined;
    const color = this.device.createTexture({
      width,
      height,
      format: 'rgba8unorm',
      usage: Texture.RENDER | Texture.COPY_SRC
    });
    const depth = this.device.createTexture({
      width,
      height,
      format: 'depth24plus',
      usage: Texture.RENDER
    });
    const framebuffer = this.device.createFramebuffer({
      width,
      height,
      colorAttachments: [color],
      depthStencilAttachment: depth
    });
    const layout = color.computeMemoryLayout({width: 1, height: 1});
    const readback = this.device.createBuffer({
      byteLength: layout.byteLength,
      usage: Buffer.COPY_DST | Buffer.MAP_READ
    });
    const identifier = `${options.id}-pick-${this.nextSceneIdentifier++}`;
    try {
      this.pickNodes.clear();
      this.render({
        ...options,
        id: identifier,
        framebuffer,
        rasterPass: 'picking',
        renderMode: 'default',
        spotShadows: undefined,
        transmission: false,
        background: [0, 0, 0, 0],
        environment: undefined,
        lights: [],
        outputColorSpace: 'linear',
        toneMapMode: 0
      });
      const nodes = new Map(this.pickNodes);
      this.pickNodes.clear();
      this.device.submit();
      color.readBuffer({x: pixel.x, y: pixel.y, width: 1, height: 1}, readback);
      const bytes = await readback.readAsync(0, layout.byteLength);
      const values = new Uint8Array(bytes.buffer, bytes.byteOffset, 4);
      return nodes.get(values[0] | (values[1] << 8) | (values[2] << 16));
    } finally {
      this.pickNodes.clear();
      this.destroyFrame(identifier);
      readback.destroy();
      framebuffer.destroy();
      color.destroy();
      depth.destroy();
    }
  }

  private renderShadows(options: SceneRenderOptions): ShadowShaderProps {
    // GPU storage transforms and this caster pipeline require WebGPU.
    assert(this.device.type === 'webgpu');
    let renderer = this.shadowMaps.get(options.id);
    if (!renderer) {
      renderer = new ShadowMapRenderer(this.device, {
        directionalLightCapacity: 0,
        pointLightCapacity: 0,
        spotLightCapacity: options.spotShadows!.spotLights.length,
        spotMapSize: options.spotShadows!.mapSize ?? 2048
      });
      this.shadowMaps.set(options.id, renderer);
    }
    renderer.setProps({
      spotMapSize: options.spotShadows!.mapSize ?? 2048,
      spotLightCapacity: options.spotShadows!.spotLights.length
    });
    const preparedViews = new Map<number, PreparedScene>();
    return renderer.render({
      camera: {
        viewMatrix: new Matrix4(options.camera.viewMatrix),
        projectionMatrix: new Matrix4(options.camera.projectionMatrix),
        near: options.camera.near ?? 0.1,
        far: options.camera.far ?? 1000,
        clipDepth: options.camera.clipDepth
      },
      spotLights: [...options.spotShadows!.spotLights],
      prepareShadowCasters: view => {
        const prepared = this.prepareScene({
          ...options,
          id: `${options.id}-shadow-${view.lightIndex}`,
          spotShadows: undefined,
          rasterPass: 'depth',
          transmission: false,
          environment: undefined,
          lights: [],
          framebuffer: view.framebuffer,
          camera: {
            ...options.camera,
            viewMatrix: view.camera.viewMatrix,
            projectionMatrix: view.camera.projectionMatrix
          },
          rasterParameters: view.rasterParameters
        });
        preparedViews.set(view.lightIndex, prepared);
      },
      drawShadowCasters: view => {
        this.drawPreparedScene(preparedViews.get(view.lightIndex)!, view.renderPass);
      }
    });
  }

  /** Destroys cached models and instance buffers associated with one frame identity. */
  destroyFrame(frameIdentifier: string): void {
    const resources = this.frames.get(frameIdentifier);
    if (resources) {
      for (const surface of resources.surfaces.values()) destroyCompiledSceneSurface(surface);
      destroyTransmissionResources(resources.transmission);
      this.frames.delete(frameIdentifier);
    }
    // Shadow preparation precedes the presented frame and may survive a failed color preparation.
    this.shadowMaps.get(frameIdentifier)?.destroy();
    this.shadowMaps.delete(frameIdentifier);
    for (let index = 0; index < 4; index++) {
      const shadowIdentifier = `${frameIdentifier}-shadow-${index}`;
      if (this.frames.has(shadowIdentifier) || this.shadowMaps.has(shadowIdentifier))
        this.destroyFrame(shadowIdentifier);
    }
    const captureIdentifier = getTransmissionCaptureIdentifier(frameIdentifier);
    if (this.frames.has(captureIdentifier)) this.destroyFrame(captureIdentifier);
  }

  /** Releases all engine-owned scene models, materials, and instance buffers. */
  destroy(): void {
    for (const cached of this.scenegraphs.values()) cached.adapter.destroy();
    this.scenegraphs.clear();
    this.pickNodes.clear();
    for (const frameIdentifier of Array.from(this.frames.keys())) {
      this.destroyFrame(frameIdentifier);
    }
    // Failed preparation can leave a shadow allocation without a presented frame.
    for (const renderer of this.shadowMaps.values()) renderer.destroy();
    this.shadowMaps.clear();
  }

  /** Creates or updates all models and uploads uniforms before a render pass begins. */
  protected prepareScene(
    options: SceneRenderOptions,
    transmissionTexture?: Texture,
    shadowProps?: ShadowShaderProps
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
    let nextPickIdentifier = 1;
    if (options.rasterPass === 'picking') {
      // Zero denotes background; RGB stores a 24-bit placement identity.
      assert(
        options.surfaces.reduce((count, surface) => count + surface.transforms.length, 0) <=
          0xffffff
      );
    }
    if (options.rasterPass || options.spotShadows) {
      // These auxiliary raster targets currently use the shared WebGPU entry points.
      assert(this.device.type === 'webgpu');
    }

    for (const surface of options.surfaces) {
      if (surface.transforms.length === 0) {
        continue;
      }

      const surfaceOptions = surface.environment
        ? {...options, environment: surface.environment}
        : options;
      if (surface.gpuTransforms) {
        // GPU positions cannot be sorted from authored CPU matrices.
        assert(this.device.type === 'webgpu' && getSceneAlphaMode(surface.material) !== 'BLEND');
        assert(surface.gpuTransforms.indices.length === surface.transforms.length);
        assert(surface.gpuTransforms.matrices.usage & Buffer.STORAGE);
        assert(
          Number.isSafeInteger(surface.gpuTransforms.matrixCount) &&
            surface.gpuTransforms.matrixCount > 0
        );
        assert(surface.gpuTransforms.matrices.byteLength >= surface.gpuTransforms.matrixCount * 64);
      }
      const surfaceTransmissionTexture = isTransmissiveSurface(surface)
        ? transmissionTexture
        : undefined;
      const compiledSurface = this.getCompiledSurface(
        resources,
        surface,
        surfaceOptions,
        surfaceTransmissionTexture
      );
      updateInstanceTransforms(compiledSurface, surface.transforms);
      const metadata = new Uint32Array(surface.transforms.length * 4);
      const metadataFloats = new Float32Array(metadata.buffer);
      for (let index = 0; index < surface.transforms.length; index++) {
        const matrixIndex = surface.gpuTransforms?.indices[index] ?? 0xffffffff;
        const connection = surface.gpuTransforms?.connections?.[index];
        if (surface.gpuTransforms) {
          // Producer indices must be in range before any storage-buffer access.
          assert(
            Number.isInteger(matrixIndex) &&
              matrixIndex >= 0 &&
              matrixIndex < surface.gpuTransforms.matrixCount
          );
          assert(
            !connection ||
              (connection.second >= 0 &&
                connection.second < surface.gpuTransforms.matrixCount &&
                connection.radius > 0)
          );
        }
        metadata[index * 4] = matrixIndex;
        metadata[index * 4 + 1] = connection?.second ?? 0xffffffff;
        metadata[index * 4 + 2] = nextPickIdentifier;
        metadataFloats[index * 4 + 3] = connection?.radius ?? 0;
        const node = surface.nodes?.[index];
        if (node && options.rasterPass === 'picking') this.pickNodes.set(nextPickIdentifier, node);
        nextPickIdentifier++;
      }
      compiledSurface.metadataBuffer.write(metadata);
      if (surface.gpuTransforms)
        compiledSurface.model.setBindings({sceneWorldMatrices: surface.gpuTransforms.matrices});
      if (options.camera.gpuOrigin)
        compiledSurface.model.setBindings({sceneProbeOrigin: options.camera.gpuOrigin});
      if (hasUsableSkin(surface)) {
        compiledSurface.model.shaderInputs.setProps({skin: surface.skin});
      }
      updateMorphAttributes(compiledSurface, surface);
      compiledSurface.material.setProps({
        pbrMaterial: {
          ...getPBRMaterialMapUniforms(surface.material.bindings || {}),
          ...surface.material.uniforms,
          alphaCutoffEnabled: compiledSurface.alphaMode === 'MASK',
          IBLenabled: hasCompleteEnvironment(surfaceOptions.environment)
        }
      });
      setSceneShaderInputs(compiledSurface.model, surfaceOptions, surfaceTransmissionTexture);
      if (shadowProps) compiledSurface.model.shaderInputs.setProps({shadow: shadowProps});
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

      const metadataBuffer = this.device.createBuffer({
        id: `${surface.id}-metadata`,
        data: new Uint32Array(surface.transforms.length * 4),
        usage: Buffer.VERTEX | Buffer.COPY_DST
      });
      attributes['instanceMetadata'] = metadataBuffer;
      bufferLayout.push({name: 'instanceMetadata', format: 'uint32x4', stepMode: 'instance'});
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
        modules: [
          ...(surface.gpuTransforms ? [sceneInstances] : []),
          ...(options.camera.gpuOrigin ? [sceneProbeCamera] : []),
          ...(options.spotShadows && !options.rasterPass ? [shadow] : [])
        ],
        bindings: surface.gpuTransforms ? {sceneWorldMatrices: surface.gpuTransforms.matrices} : {},
        shaderInputs: new ShaderInputs({
          pbrMaterial,
          pbrScene,
          ...(hasSkin ? {skin} : {}),
          ...(surface.gpuTransforms ? {sceneInstances} : {}),
          ...(options.camera.gpuOrigin ? {sceneProbeCamera} : {}),
          ...(options.spotShadows && !options.rasterPass ? {shadow} : {})
        }),
        colorAttachmentFormats: options.framebuffer?.colorAttachments.map(
          attachment => attachment.texture.format as TextureFormatColor
        ),
        depthStencilAttachmentFormat: getSceneDepthFormat(options.framebuffer),
        parameters: {
          ...options.rasterParameters,
          cullMode: surface.material.doubleSided ? 'none' : 'back',
          depthWriteEnabled: alphaMode !== 'BLEND',
          depthCompare: 'less-equal',
          ...(options.rasterPass === 'depth'
            ? {}
            : {
                blend: alphaMode === 'BLEND',
                blendColorSrcFactor: 'src-alpha',
                blendColorDstFactor: 'one-minus-src-alpha',
                blendAlphaSrcFactor: 'one',
                blendAlphaDstFactor: 'one-minus-src-alpha'
              }),
          ...overrides.parameters
        },
        ...overrides,
        defines: {
          HAS_INSTANCING: true,
          USE_SCENE_INSTANCES: true,
          HAS_GPU_TRANSFORMS: Boolean(surface.gpuTransforms),
          USE_SCENE_PROBE_CAMERA: Boolean(options.camera.gpuOrigin),
          USE_SCENE_SHADOWS: Boolean(options.spotShadows && !options.rasterPass),
          SCENE_DEPTH_PASS: options.rasterPass === 'depth',
          SCENE_PICK_PASS: options.rasterPass === 'picking',
          USE_LIGHTS: Boolean(options.lights?.length),
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
        metadataBuffer,
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
      !options.rasterPass &&
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
    gpuTransforms: Boolean(surface.gpuTransforms),
    gpuOrigin: Boolean(options.camera.gpuOrigin),
    rasterPass: options.rasterPass,
    shadows: Boolean(options.spotShadows),
    depthFormat: options.framebuffer?.depthStencilAttachment?.texture.format,
    rasterParameters: options.rasterParameters,
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
    lights: Boolean(options.lights?.length),
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
    lighting: {lights: getScenePBRLights(options.lights), useByteColors: false},
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

/** Combines additive ambient radiance for forward PBR without changing light directions. */
function getScenePBRLights(lights: readonly Light[] = []): Light[] {
  const adaptedLights = [...lights];
  const ambientLights = adaptedLights.filter(light => light.type === 'ambient');
  if (ambientLights.length <= 1) {
    return adaptedLights;
  }

  const ambientColor: [number, number, number] = [0, 0, 0];
  for (const ambientLight of ambientLights) {
    const color = ambientLight.color ?? [1, 1, 1];
    const intensity = ambientLight.intensity ?? 1;
    ambientColor[0] += color[0] * intensity;
    ambientColor[1] += color[1] * intensity;
    ambientColor[2] += color[2] * intensity;
  }

  return [
    {type: 'ambient', color: ambientColor, intensity: 1},
    ...adaptedLights.filter(light => light.type !== 'ambient')
  ];
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
  surface.metadataBuffer.destroy();
  surface.material.destroy();
  for (const instanceBuffer of surface.instanceBuffers) {
    instanceBuffer.destroy();
  }
}

function getSceneDepthFormat(framebuffer?: Framebuffer) {
  const format = framebuffer?.depthStencilAttachment?.texture.format;
  return format && textureFormatDecoder.isDepthStencil(format) ? format : undefined;
}
