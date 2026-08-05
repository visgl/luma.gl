// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  Buffer,
  type BufferLayout,
  type Device,
  type Framebuffer,
  type RenderPass,
  type Texture
} from '@luma.gl/core';
import {
  type Light,
  type PBRMaterialBindings,
  type PBRMaterialUniforms,
  pbrMaterial,
  pbrScene
} from '@luma.gl/shadertools';
import {Matrix4, type NumericArray} from '@math.gl/core';
import type {Geometry} from '../geometry/geometry';
import {
  createPBRMaterial,
  createPBRMaterialFactory,
  getPBRMaterialMapUniforms,
  type PBRMaterial
} from '../material/pbr-material';
import type {Model, ModelProps} from '../model/model';
import {createPBRModel} from '../models/pbr-model';
import {ShaderInputs} from '../shader-inputs';

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
  /** Scene exposure multiplier. */
  exposure?: number;
  /** Shared scene tone-mapping mode. */
  toneMapMode?: number;
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
  depth: number;
};

type SceneFrameResources = {
  surfaces: Map<string, CompiledSceneSurface>;
};

/** Prepared scene data available to specialized renderers before opening a render pass. */
export type PreparedScene = {
  /** Prepared opaque and blended model batches in draw order. */
  surfaces: readonly {model: Model; alphaMode: SceneAlphaMode; depth: number}[];
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
    const scene = this.prepareScene(options);
    const background = options.background || [0, 0, 0, 1];
    const renderPass = this.device.beginRenderPass({
      id: `scene-${options.id}`,
      framebuffer: options.framebuffer,
      clearColor: [background[0], background[1], background[2], background[3] ?? 1],
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
    this.frames.delete(frameIdentifier);
  }

  /** Releases all engine-owned scene models, materials, and instance buffers. */
  destroy(): void {
    for (const frameIdentifier of Array.from(this.frames.keys())) {
      this.destroyFrame(frameIdentifier);
    }
  }

  /** Creates or updates all models and uploads uniforms before a render pass begins. */
  protected prepareScene(options: SceneRenderOptions): PreparedScene {
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

      const compiledSurface = this.getCompiledSurface(resources, surface, options);
      updateInstanceTransforms(compiledSurface, surface.transforms);
      compiledSurface.material.setProps({
        pbrMaterial: {
          ...getPBRMaterialMapUniforms(surface.material.bindings || {}),
          ...surface.material.uniforms,
          alphaCutoffEnabled: compiledSurface.alphaMode === 'MASK',
          IBLenabled: hasCompleteEnvironment(options.environment)
        }
      });
      setSceneShaderInputs(compiledSurface.model, options);
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
    options: SceneRenderOptions
  ): CompiledSceneSurface {
    const alphaMode = getSceneAlphaMode(surface.material);
    const signature = getSceneSurfaceSignature(surface, options, alphaMode);
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
      const model = createPBRModel(this.device, {
        id: `${surface.id}-model`,
        geometry: surface.geometry,
        topology: surface.geometry.topology,
        material,
        attributes,
        bufferLayout,
        instanceCount: surface.transforms.length,
        shaderInputs: new ShaderInputs({pbrMaterial, pbrScene}),
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
          DEBUG_NORMALS: options.renderMode === 'debugNormals',
          DEBUG_DEPTH: options.renderMode === 'debugDepth',
          ...surface.material.defines,
          ...overrides.defines
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
        depth: 0
      };
      resources.surfaces.set(surface.id, compiledSurface);
    }

    compiledSurface.source = surface;
    return compiledSurface;
  }
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
  alphaMode: SceneAlphaMode
): string {
  return JSON.stringify({
    geometryVersion: surface.geometryVersion,
    material: surface.material.id,
    instanceCount: surface.transforms.length,
    alphaMode,
    doubleSided: Boolean(surface.material.doubleSided),
    defines: Object.entries(surface.material.defines || {}).sort(([first], [second]) =>
      first.localeCompare(second)
    ),
    environment: hasCompleteEnvironment(options.environment),
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

function setSceneShaderInputs(model: Model, options: SceneRenderOptions): void {
  const viewMatrix = new Matrix4(options.camera.viewMatrix);
  const projectionMatrix = new Matrix4(options.camera.projectionMatrix);
  const framebufferWidth = options.framebuffer?.width || options.width || 1;
  const framebufferHeight = options.framebuffer?.height || options.height || 1;

  model.shaderInputs.setProps({
    pbrProjection: {
      modelViewProjectionMatrix: new Matrix4(projectionMatrix).multiplyRight(viewMatrix),
      modelMatrix: IDENTITY_MATRIX,
      normalMatrix: IDENTITY_MATRIX,
      camera: options.camera.position
    },
    pbrScene: {
      exposure: options.exposure ?? 1,
      toneMapMode: options.toneMapMode ?? 2,
      environmentIntensity: options.environment?.intensity ?? 1,
      environmentRotation: options.environment?.rotation ?? 0,
      framebufferSize: [framebufferWidth, framebufferHeight],
      viewMatrix,
      projectionMatrix
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
