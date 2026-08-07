// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device, Texture} from '@luma.gl/core';
import {Computation, type Geometry, Model} from '@luma.gl/engine';
import type {Light} from '@luma.gl/shadertools';
import {Matrix4, type NumericArray} from '@math.gl/core';
import {GPUBVH} from '../gpu-primitives/gpu-bvh';
import {
  GPUCommandGraph,
  type CompiledGPUCommandGraph,
  type GraphDataView
} from '../gpu-primitives/gpu-command-graph';
import {createTransientView, getViewBinding} from '../gpu-primitives/graph-data-view-utils';
import {
  RAY_TRACING_BOUNDS_SHADER,
  RAY_TRACING_SCENE_SHADER,
  getRayTracingScenePresentationShader
} from './ray-tracing-scene-shaders';
import type {SceneRenderOptions, SceneRenderStatistics, SceneSurface} from './scene-renderer';

const PRIMITIVE_FLOAT_COUNT = 64;
const TRIANGLE_FLOAT_COUNT = 24;
const LIGHT_FLOAT_COUNT = 16;
const UNIFORM_FLOAT_COUNT = 68;
const DEFAULT_RESOLUTION_SCALE = 0.5;
const DEFAULT_MINIMUM_RESOLUTION_SCALE = 0.25;
const DEFAULT_TARGET_FRAME_TIME_MILLISECONDS = 33.3;
const RESOLUTION_SCALES = [0.25, 0.375, 0.5, 0.75, 1] as const;
const FRAME_BUDGET_COOLDOWN_MILLISECONDS = 750;
const OVER_BUDGET_FRAME_TIME_RATIO = 1.2;
const UNDER_BUDGET_FRAME_TIME_RATIO = 0.65;
const OVER_BUDGET_FRAME_COUNT = 6;
const UNDER_BUDGET_FRAME_COUNT = 45;
const MINIMUM_HISTORY_FRAMES_FOR_SPARSE_SCHEDULING = 8;
const MAXIMUM_HISTORY_SAMPLES = 64;

/** Optional analytic primitive supplied by a format-specific scene adapter. */
export type RayTracingScenePrimitive = {
  type: 'sphere';
  radius: number;
};

/** Shared retained-scene inputs and software ray-tracing quality controls. */
export type RayTracingSceneRenderOptions = SceneRenderOptions & {
  /** Optional analytic primitive metadata keyed by retained surface identity. */
  primitives?: Readonly<Record<string, RayTracingScenePrimitive>>;
  /** Camera projection used to choose perspective or orthographic primary rays. */
  cameraProjection?: 'perspective' | 'orthographic';
  /** Number of primary-ray samples per pixel in one encoded frame. */
  samplesPerPixel?: number;
  /** Reserved future path-tracing bounce budget. */
  maxBounces?: number;
  /** Accumulates primary-ray samples across unchanged committed frames. */
  progressive?: boolean;
  /** Traces direct-light shadow rays when enabled. */
  shadows?: boolean;
  /** Initial internal ray-tracing resolution relative to the display resolution. */
  resolutionScale?: number;
  /** Lowest internal resolution available to adaptive frame budgeting. */
  minimumResolutionScale?: number;
  /** Adjusts ray workload toward the requested frame budget when enabled. */
  adaptiveResolution?: boolean;
  /** Target animation-frame duration used by the adaptive scheduler. */
  targetFrameTimeMilliseconds?: number;
  /** Reprojects compatible history while the camera or instances move. */
  temporalReprojection?: boolean;
  /** Maximum non-ambient shadowed light samples traced per pixel in one frame. */
  shadowSamplesPerFrame?: number;
};

type RayTracingScene = {
  primitives: Float32Array;
  triangles: Float32Array;
  lights: Float32Array;
  primitiveCount: number;
  lightCount: number;
  triangleCount: number;
};

type RayTracingGeometryLayout = {
  triangleStart: number;
  triangleCount: number;
  bounds: readonly [number, number, number, number];
};

type RayTracingTopology = {
  triangles: Float32Array;
  geometryLayouts: Map<string, RayTracingGeometryLayout>;
};

type RayTracingPrimitiveData = {
  primitives: Float32Array;
  primitiveCount: number;
  triangleCount: number;
  previousTransforms: Map<string, Matrix4>;
};

type RayTracingQualityOptions = {
  resolutionScale: number;
  requestedResolutionScale: number;
  minimumResolutionScale: number;
  adaptiveResolution: boolean;
  targetFrameTimeMilliseconds: number;
};

type RayTracingTraceGraphParameters = {
  dispatchWidth: number;
};

type RayTracingFrameResources = {
  displayWidth: number;
  displayHeight: number;
  internalWidth: number;
  internalHeight: number;
  resolutionScale: number;
  requestedResolutionScale: number;
  minimumResolutionScale: number;
  adaptiveResolution: boolean;
  targetFrameTimeMilliseconds: number;
  phaseCount: number;
  phaseIndex: number;
  lastRenderTimeMilliseconds?: number;
  averageFrameTimeMilliseconds?: number;
  overBudgetFrameCount: number;
  underBudgetFrameCount: number;
  lastBudgetAdjustmentTimeMilliseconds: number;
  uniformBuffer: Buffer;
  primitiveBuffer: Buffer;
  triangleBuffer: Buffer;
  lightBuffer: Buffer;
  nodeMinimaBuffer: Buffer;
  nodeMaximaBuffer: Buffer;
  nodeChildrenBuffer: Buffer;
  leafIdsBuffer: Buffer;
  bvhCountBuffer: Buffer;
  bvhOverflowBuffer: Buffer;
  historyTexture: Texture;
  historyMetadataTexture: Texture;
  accelerationGraph: CompiledGPUCommandGraph;
  traceGraph: CompiledGPUCommandGraph<RayTracingTraceGraphParameters>;
  topologyRevision: string;
  primitiveRevision: string;
  transformRevision: string;
  lightRevision: string;
  renderRevision: string;
  geometryLayouts: Map<string, RayTracingGeometryLayout>;
  previousTransforms: Map<string, Matrix4>;
  previousTransformsNeedCommit: boolean;
  previousViewProjection: Matrix4;
  previousCameraPosition: readonly number[];
  historyNeedsReset: boolean;
  accelerationNeedsUpdate: boolean;
  frameIndex: number;
  accumulatedFrameCount: number;
  primitiveCount: number;
  primitiveCapacity: number;
  leafCapacity: number;
  lightCount: number;
  triangleCount: number;
};

type CompiledRayGeometry = {
  triangles: Float32Array;
  triangleCount: number;
  bounds: readonly [number, number, number, number];
};

type RayTracingSceneSurface = SceneSurface & {
  instanceIds?: readonly string[];
};

type RayTracingStatistics = {
  internalWidth: number;
  internalHeight: number;
  resolutionScale: number;
  sampledPixelCoverage: number;
  frameTimeMilliseconds: number;
  accumulatedSamples: number;
};

/** Shared WebGPU software ray tracer consuming the canonical retained-scene contract. */
export class RayTracingSceneRenderer {
  private readonly device: Device;
  private readonly frames = new Map<string, RayTracingFrameResources>();
  private readonly geometryCache = new Map<string, CompiledRayGeometry>();

  constructor(device: Device) {
    if (device.type !== 'webgpu') {
      throw new Error('Ray tracing scene rendering requires a WebGPU device.');
    }
    this.device = device;
  }

  render(options: RayTracingSceneRenderOptions): SceneRenderStatistics {
    const [defaultWidth, defaultHeight] = this.device
      .getDefaultCanvasContext()
      .getDrawingBufferSize();
    const displayWidth = options.width ?? defaultWidth;
    const displayHeight = options.height ?? defaultHeight;
    const lights = options.lights ?? [];
    const quality = getQualityOptions(options);
    const viewProjection = new Matrix4(options.camera.projectionMatrix).multiplyRight(
      options.camera.viewMatrix
    );
    const inverseViewProjection = new Matrix4(viewProjection).invert();
    const topologyRevision = getTopologyRevision(options);
    const primitiveRevision = getPrimitiveRevision(options);
    const transformRevision = getTransformRevision(options);
    const lightRevision = getLightRevision(lights);
    let resources = this.frames.get(options.id);
    const currentTimeMilliseconds = getTimestampMilliseconds();

    if (!resources) {
      const topology = makeRayTracingTopology(
        options.surfaces,
        options.primitives ?? {},
        this.geometryCache
      );
      const primitiveData = makePrimitiveData(
        options.surfaces,
        options.primitives ?? {},
        topology.geometryLayouts,
        new Map()
      );
      const scene = makeRayTracingScene(primitiveData, topology.triangles, lights);
      resources = this.createFrameResources({
        frameIdentifier: options.id,
        displayWidth,
        displayHeight,
        scene,
        topology,
        primitiveData,
        quality,
        viewProjection,
        cameraPosition: options.camera.position
      });
      resources.topologyRevision = topologyRevision;
      resources.primitiveRevision = primitiveRevision;
      resources.transformRevision = transformRevision;
      resources.lightRevision = lightRevision;
      this.frames.set(options.id, resources);
    } else {
      updateFrameTiming(resources, currentTimeMilliseconds);
      if (updateQualityOptions(resources, quality)) {
        resources.historyNeedsReset = true;
      }

      const topologyChanged = resources.topologyRevision !== topologyRevision;
      const primitiveChanged = resources.primitiveRevision !== primitiveRevision;
      const transformChanged = resources.transformRevision !== transformRevision;
      const lightsChanged = resources.lightRevision !== lightRevision;
      let topology: RayTracingTopology | undefined;
      let primitiveData: RayTracingPrimitiveData | undefined;
      let lightData: Float32Array | undefined;

      if (topologyChanged) {
        topology = makeRayTracingTopology(
          options.surfaces,
          options.primitives ?? {},
          this.geometryCache
        );
      }
      if (topologyChanged || primitiveChanged) {
        primitiveData = makePrimitiveData(
          options.surfaces,
          options.primitives ?? {},
          topology?.geometryLayouts ?? resources.geometryLayouts,
          resources.previousTransforms
        );
      } else if (resources.previousTransformsNeedCommit) {
        primitiveData = makePrimitiveData(
          options.surfaces,
          options.primitives ?? {},
          resources.geometryLayouts,
          resources.previousTransforms
        );
      }
      if (lightsChanged) {
        lightData = makeLightData(lights);
      }

      if (
        (primitiveData &&
          resources.primitiveBuffer.byteLength < primitiveData.primitives.byteLength) ||
        (topology && resources.triangleBuffer.byteLength < topology.triangles.byteLength) ||
        (lightData && resources.lightBuffer.byteLength < lightData.byteLength)
      ) {
        topology ??= makeRayTracingTopology(
          options.surfaces,
          options.primitives ?? {},
          this.geometryCache
        );
        primitiveData ??= makePrimitiveData(
          options.surfaces,
          options.primitives ?? {},
          topology.geometryLayouts,
          resources.previousTransforms
        );
        const scene = makeRayTracingScene(primitiveData, topology.triangles, lights);
        this.destroyFrame(options.id);
        resources = this.createFrameResources({
          frameIdentifier: options.id,
          displayWidth,
          displayHeight,
          scene,
          topology,
          primitiveData,
          quality,
          viewProjection,
          cameraPosition: options.camera.position
        });
        resources.topologyRevision = topologyRevision;
        resources.primitiveRevision = primitiveRevision;
        resources.transformRevision = transformRevision;
        resources.lightRevision = lightRevision;
        this.frames.set(options.id, resources);
      } else {
        if (topology) {
          resources.triangleBuffer.write(topology.triangles);
          resources.geometryLayouts = topology.geometryLayouts;
          resources.historyNeedsReset = true;
          resources.accelerationNeedsUpdate = true;
        }
        if (primitiveData) {
          resources.primitiveBuffer.write(primitiveData.primitives);
          resources.previousTransforms = primitiveData.previousTransforms;
          resources.previousTransformsNeedCommit = transformChanged;
          resources.primitiveCount = primitiveData.primitiveCount;
          resources.triangleCount = primitiveData.triangleCount;
          if (transformChanged) {
            resources.accelerationNeedsUpdate = true;
            if (!(options.temporalReprojection ?? true)) {
              resources.historyNeedsReset = true;
            }
          } else if (primitiveChanged) {
            resources.historyNeedsReset = true;
          }
        }
        if (lightData) {
          const lightCountChanged = resources.lightCount !== lights.length;
          resources.lightBuffer.write(lightData);
          resources.lightCount = lights.length;
          if (lightCountChanged || !(options.temporalReprojection ?? true)) {
            resources.historyNeedsReset = true;
          }
        }
        resources.topologyRevision = topologyRevision;
        resources.primitiveRevision = primitiveRevision;
        resources.transformRevision = transformRevision;
        resources.lightRevision = lightRevision;
      }
    }

    if (!resources.lastRenderTimeMilliseconds) {
      resources.lastRenderTimeMilliseconds = currentTimeMilliseconds;
    }
    const renderRevision = getRenderRevision(options, inverseViewProjection);
    if (resources.renderRevision !== renderRevision) {
      resources.renderRevision = renderRevision;
      resources.historyNeedsReset = true;
    }
    if (
      (options.temporalReprojection ?? true) &&
      isCameraCut(
        resources.previousViewProjection,
        viewProjection,
        resources.previousCameraPosition,
        options.camera.position
      )
    ) {
      resources.historyNeedsReset = true;
    }
    if (resources.displayWidth !== displayWidth || resources.displayHeight !== displayHeight) {
      resources.historyNeedsReset = true;
    }
    updateRayTracingAdaptiveBudget(resources, currentTimeMilliseconds);

    const internalDimensions = getInternalDimensions(
      displayWidth,
      displayHeight,
      resources.resolutionScale
    );
    if (
      resources.displayWidth !== displayWidth ||
      resources.displayHeight !== displayHeight ||
      resources.internalWidth !== internalDimensions.width ||
      resources.internalHeight !== internalDimensions.height
    ) {
      this.recreateTraceResources(
        options.id,
        resources,
        displayWidth,
        displayHeight,
        internalDimensions.width,
        internalDimensions.height
      );
    }

    const progressive = options.progressive ?? true;
    if (resources.historyNeedsReset) {
      resources.accumulatedFrameCount = 0;
      resources.phaseCount = 1;
      resources.phaseIndex = 0;
    }
    const activePhaseCount = resources.historyNeedsReset ? 1 : resources.phaseCount;
    const activePhaseIndex = resources.historyNeedsReset
      ? 0
      : resources.phaseIndex % activePhaseCount;
    const accumulatedFrameCount = progressive ? resources.accumulatedFrameCount : 0;
    resources.uniformBuffer.write(
      makeUniformData({
        options,
        inverseViewProjection,
        previousViewProjection: resources.previousViewProjection,
        previousCameraPosition: resources.previousCameraPosition,
        displayWidth,
        displayHeight,
        internalWidth: resources.internalWidth,
        internalHeight: resources.internalHeight,
        resolutionScale: resources.resolutionScale,
        phaseIndex: activePhaseIndex,
        phaseCount: activePhaseCount,
        primitiveCount: resources.primitiveCount,
        primitiveCapacity: resources.primitiveCapacity,
        leafCapacity: resources.leafCapacity,
        lightCount: resources.lightCount,
        accumulatedFrameCount,
        frameIndex: resources.frameIndex
      })
    );

    if (resources.accelerationNeedsUpdate) {
      resources.accelerationGraph.encode(this.device.commandEncoder, {parameters: undefined});
      resources.accelerationNeedsUpdate = false;
    }
    resources.traceGraph.encode(this.device.commandEncoder, {
      parameters: {dispatchWidth: Math.ceil(resources.internalWidth / activePhaseCount)}
    });
    resources.previousViewProjection = new Matrix4(viewProjection);
    resources.previousCameraPosition = Array.from(options.camera.position);
    resources.historyNeedsReset = false;
    resources.phaseIndex = (activePhaseIndex + 1) % resources.phaseCount;
    resources.frameIndex++;
    resources.accumulatedFrameCount = progressive ? accumulatedFrameCount + 1 : 0;
    const samplesPerPixel = getSamplesPerPixel(options);

    const statistics = {
      surfaceCount: options.surfaces.length,
      instanceCount: options.surfaces.reduce(
        (count, surface) => count + surface.transforms.length,
        0
      ),
      drawCount: 1,
      triangleCount: resources.triangleCount,
      rayTracing: {
        internalWidth: resources.internalWidth,
        internalHeight: resources.internalHeight,
        resolutionScale: resources.resolutionScale,
        sampledPixelCoverage: 1 / activePhaseCount,
        frameTimeMilliseconds:
          resources.averageFrameTimeMilliseconds ?? resources.targetFrameTimeMilliseconds,
        accumulatedSamples: progressive
          ? Math.min(resources.accumulatedFrameCount * samplesPerPixel, MAXIMUM_HISTORY_SAMPLES)
          : samplesPerPixel
      } satisfies RayTracingStatistics
    };
    return statistics as SceneRenderStatistics;
  }

  destroyFrame(frameIdentifier: string): void {
    const resources = this.frames.get(frameIdentifier);
    if (!resources) {
      return;
    }
    resources.accelerationGraph.destroy();
    resources.traceGraph.destroy();
    resources.uniformBuffer.destroy();
    resources.primitiveBuffer.destroy();
    resources.triangleBuffer.destroy();
    resources.lightBuffer.destroy();
    resources.nodeMinimaBuffer.destroy();
    resources.nodeMaximaBuffer.destroy();
    resources.nodeChildrenBuffer.destroy();
    resources.leafIdsBuffer.destroy();
    resources.bvhCountBuffer.destroy();
    resources.bvhOverflowBuffer.destroy();
    resources.historyTexture.destroy();
    resources.historyMetadataTexture.destroy();
    this.frames.delete(frameIdentifier);
  }

  destroy(): void {
    for (const frameIdentifier of Array.from(this.frames.keys())) {
      this.destroyFrame(frameIdentifier);
    }
  }

  private createFrameResources(props: {
    frameIdentifier: string;
    displayWidth: number;
    displayHeight: number;
    scene: RayTracingScene;
    topology: RayTracingTopology;
    primitiveData: RayTracingPrimitiveData;
    quality: RayTracingQualityOptions;
    viewProjection: Matrix4;
    cameraPosition: Readonly<NumericArray>;
  }): RayTracingFrameResources {
    const {frameIdentifier, scene} = props;
    const uniformBuffer = this.device.createBuffer({
      id: `${frameIdentifier}-ray-tracing-uniforms`,
      byteLength: UNIFORM_FLOAT_COUNT * Float32Array.BYTES_PER_ELEMENT,
      usage: Buffer.UNIFORM | Buffer.COPY_DST
    });
    const primitiveBuffer = this.device.createBuffer({
      id: `${frameIdentifier}-ray-tracing-primitives`,
      data: scene.primitives,
      usage: Buffer.STORAGE | Buffer.COPY_DST
    });
    const triangleBuffer = this.device.createBuffer({
      id: `${frameIdentifier}-ray-tracing-triangles`,
      data: scene.triangles,
      usage: Buffer.STORAGE | Buffer.COPY_DST
    });
    const lightBuffer = this.device.createBuffer({
      id: `${frameIdentifier}-ray-tracing-lights`,
      data: scene.lights,
      usage: Buffer.STORAGE | Buffer.COPY_DST
    });
    const primitiveCapacity = Math.max(
      1,
      Math.floor(
        primitiveBuffer.byteLength / (PRIMITIVE_FLOAT_COUNT * Float32Array.BYTES_PER_ELEMENT)
      )
    );
    const leafCapacity = 2 ** Math.ceil(Math.log2(primitiveCapacity));
    const nodeCount = leafCapacity * 2 - 1;
    const nodeMinimaBuffer = this.device.createBuffer({
      id: `${frameIdentifier}-ray-tracing-node-minima`,
      byteLength: nodeCount * 3 * Float32Array.BYTES_PER_ELEMENT,
      usage: Buffer.STORAGE
    });
    const nodeMaximaBuffer = this.device.createBuffer({
      id: `${frameIdentifier}-ray-tracing-node-maxima`,
      byteLength: nodeCount * 3 * Float32Array.BYTES_PER_ELEMENT,
      usage: Buffer.STORAGE
    });
    const nodeChildrenBuffer = this.device.createBuffer({
      id: `${frameIdentifier}-ray-tracing-node-children`,
      byteLength: nodeCount * 2 * Uint32Array.BYTES_PER_ELEMENT,
      usage: Buffer.STORAGE
    });
    const leafIdsBuffer = this.device.createBuffer({
      id: `${frameIdentifier}-ray-tracing-leaf-ids`,
      byteLength: leafCapacity * Uint32Array.BYTES_PER_ELEMENT,
      usage: Buffer.STORAGE
    });
    const bvhCountBuffer = this.device.createBuffer({
      id: `${frameIdentifier}-ray-tracing-bvh-count`,
      byteLength: Uint32Array.BYTES_PER_ELEMENT,
      usage: Buffer.STORAGE
    });
    const bvhOverflowBuffer = this.device.createBuffer({
      id: `${frameIdentifier}-ray-tracing-bvh-overflow`,
      byteLength: Uint32Array.BYTES_PER_ELEMENT,
      usage: Buffer.STORAGE
    });
    const internalDimensions = getInternalDimensions(
      props.displayWidth,
      props.displayHeight,
      props.quality.resolutionScale
    );
    const historyTexture = this.createHistoryTexture(
      frameIdentifier,
      'history',
      internalDimensions.width,
      internalDimensions.height
    );
    const historyMetadataTexture = this.createHistoryTexture(
      frameIdentifier,
      'history-metadata',
      internalDimensions.width,
      internalDimensions.height
    );
    const accelerationGraph = this.createAccelerationGraph({
      frameIdentifier,
      uniformBuffer,
      primitiveBuffer,
      primitiveCapacity,
      leafCapacity,
      nodeMinimaBuffer,
      nodeMaximaBuffer,
      nodeChildrenBuffer,
      leafIdsBuffer,
      bvhCountBuffer,
      bvhOverflowBuffer
    });
    const traceGraph = this.createTraceGraph({
      frameIdentifier,
      internalWidth: internalDimensions.width,
      internalHeight: internalDimensions.height,
      uniformBuffer,
      primitiveBuffer,
      triangleBuffer,
      lightBuffer,
      nodeMinimaBuffer,
      nodeMaximaBuffer,
      historyTexture,
      historyMetadataTexture
    });

    return {
      displayWidth: props.displayWidth,
      displayHeight: props.displayHeight,
      internalWidth: internalDimensions.width,
      internalHeight: internalDimensions.height,
      resolutionScale: props.quality.resolutionScale,
      requestedResolutionScale: props.quality.requestedResolutionScale,
      minimumResolutionScale: props.quality.minimumResolutionScale,
      adaptiveResolution: props.quality.adaptiveResolution,
      targetFrameTimeMilliseconds: props.quality.targetFrameTimeMilliseconds,
      phaseCount: 1,
      phaseIndex: 0,
      overBudgetFrameCount: 0,
      underBudgetFrameCount: 0,
      lastBudgetAdjustmentTimeMilliseconds: 0,
      uniformBuffer,
      primitiveBuffer,
      triangleBuffer,
      lightBuffer,
      nodeMinimaBuffer,
      nodeMaximaBuffer,
      nodeChildrenBuffer,
      leafIdsBuffer,
      bvhCountBuffer,
      bvhOverflowBuffer,
      historyTexture,
      historyMetadataTexture,
      accelerationGraph,
      traceGraph,
      topologyRevision: '',
      primitiveRevision: '',
      transformRevision: '',
      lightRevision: '',
      renderRevision: '',
      geometryLayouts: props.topology.geometryLayouts,
      previousTransforms: props.primitiveData.previousTransforms,
      previousTransformsNeedCommit: false,
      previousViewProjection: new Matrix4(props.viewProjection),
      previousCameraPosition: Array.from(props.cameraPosition),
      historyNeedsReset: true,
      accelerationNeedsUpdate: true,
      frameIndex: 0,
      accumulatedFrameCount: 0,
      primitiveCount: scene.primitiveCount,
      primitiveCapacity,
      leafCapacity,
      lightCount: scene.lightCount,
      triangleCount: scene.triangleCount
    };
  }

  private recreateTraceResources(
    frameIdentifier: string,
    resources: RayTracingFrameResources,
    displayWidth: number,
    displayHeight: number,
    internalWidth: number,
    internalHeight: number
  ): void {
    resources.traceGraph.destroy();
    resources.historyTexture.destroy();
    resources.historyMetadataTexture.destroy();
    resources.historyTexture = this.createHistoryTexture(
      frameIdentifier,
      'history',
      internalWidth,
      internalHeight
    );
    resources.historyMetadataTexture = this.createHistoryTexture(
      frameIdentifier,
      'history-metadata',
      internalWidth,
      internalHeight
    );
    resources.traceGraph = this.createTraceGraph({
      frameIdentifier,
      internalWidth,
      internalHeight,
      uniformBuffer: resources.uniformBuffer,
      primitiveBuffer: resources.primitiveBuffer,
      triangleBuffer: resources.triangleBuffer,
      lightBuffer: resources.lightBuffer,
      nodeMinimaBuffer: resources.nodeMinimaBuffer,
      nodeMaximaBuffer: resources.nodeMaximaBuffer,
      historyTexture: resources.historyTexture,
      historyMetadataTexture: resources.historyMetadataTexture
    });
    resources.displayWidth = displayWidth;
    resources.displayHeight = displayHeight;
    resources.internalWidth = internalWidth;
    resources.internalHeight = internalHeight;
    resources.phaseIndex = 0;
    resources.historyNeedsReset = true;
  }

  private createHistoryTexture(
    frameIdentifier: string,
    suffix: string,
    width: number,
    height: number
  ): Texture {
    return this.device.createTexture({
      id: `${frameIdentifier}-ray-tracing-${suffix}`,
      width,
      height,
      format: 'rgba16float',
      usage: Texture.SAMPLE | Texture.COPY_SRC | Texture.COPY_DST
    });
  }

  private createAccelerationGraph(props: {
    frameIdentifier: string;
    uniformBuffer: Buffer;
    primitiveBuffer: Buffer;
    primitiveCapacity: number;
    leafCapacity: number;
    nodeMinimaBuffer: Buffer;
    nodeMaximaBuffer: Buffer;
    nodeChildrenBuffer: Buffer;
    leafIdsBuffer: Buffer;
    bvhCountBuffer: Buffer;
    bvhOverflowBuffer: Buffer;
  }): CompiledGPUCommandGraph {
    const graph = new GPUCommandGraph(this.device, {
      id: `scene-${props.frameIdentifier}-ray-tracing-acceleration`
    });
    const uniforms = graph.importBuffer(
      {
        id: 'uniforms',
        byteLength: props.uniformBuffer.byteLength,
        usage: props.uniformBuffer.usage
      },
      props.uniformBuffer
    );
    const primitives = graph.importBuffer(
      {
        id: 'primitives',
        byteLength: props.primitiveBuffer.byteLength,
        usage: props.primitiveBuffer.usage
      },
      props.primitiveBuffer
    );
    const primitiveMinima = createTransientView(
      graph,
      'primitive-minima',
      'float32x3',
      props.primitiveCapacity
    );
    const primitiveMaxima = createTransientView(
      graph,
      'primitive-maxima',
      'float32x3',
      props.primitiveCapacity
    );
    const nodeCount = props.leafCapacity * 2 - 1;
    const nodeMinima = createImportedView(
      graph,
      'node-minima',
      props.nodeMinimaBuffer,
      'float32x3',
      nodeCount
    );
    const nodeMaxima = createImportedView(
      graph,
      'node-maxima',
      props.nodeMaximaBuffer,
      'float32x3',
      nodeCount
    );
    const nodeChildren = createImportedView(
      graph,
      'node-children',
      props.nodeChildrenBuffer,
      'uint32x2',
      nodeCount
    );
    const leafIds = createImportedView(
      graph,
      'leaf-ids',
      props.leafIdsBuffer,
      'uint32',
      props.leafCapacity
    );
    const acceleration = new GPUBVH({
      id: `${props.frameIdentifier}-ray-tracing-bvh`,
      minima: primitiveMinima,
      maxima: primitiveMaxima,
      leafCapacity: props.leafCapacity,
      nodeMinima,
      nodeMaxima,
      nodeChildren,
      leafIds,
      count: createImportedView(graph, 'bvh-count', props.bvhCountBuffer, 'uint32', 1),
      overflow: createImportedView(graph, 'bvh-overflow', props.bvhOverflowBuffer, 'uint32', 1)
    });

    graph.addComputePass({
      id: `${props.frameIdentifier}-build-primitive-bounds`,
      resources: [
        {buffer: uniforms, usage: 'uniform'},
        {buffer: primitives, usage: 'storage-read'},
        {buffer: primitiveMinima, usage: 'storage-write'},
        {buffer: primitiveMaxima, usage: 'storage-write'}
      ],
      compile: ({device}) => {
        const computation = new Computation(device, {
          id: `${props.frameIdentifier}-primitive-bounds-computation`,
          source: RAY_TRACING_BOUNDS_SHADER,
          shaderLayout: {
            bindings: [
              {name: 'uniforms', type: 'uniform', group: 0, location: 0},
              {name: 'primitives', type: 'read-only-storage', group: 0, location: 1},
              {name: 'primitiveMinima', type: 'storage', group: 0, location: 2},
              {name: 'primitiveMaxima', type: 'storage', group: 0, location: 3}
            ]
          }
        });
        return {
          encode: ({computePass, getBuffer}) => {
            computation.setBindings({
              uniforms: getBuffer(uniforms),
              primitives: getBuffer(primitives),
              primitiveMinima: getViewBinding(primitiveMinima, getBuffer),
              primitiveMaxima: getViewBinding(primitiveMaxima, getBuffer)
            });
            computation.dispatch(computePass, Math.ceil(props.primitiveCapacity / 128));
          },
          destroy: () => computation.destroy()
        };
      }
    });
    acceleration.addToGraph(graph);

    return graph.compile();
  }

  private createTraceGraph(props: {
    frameIdentifier: string;
    internalWidth: number;
    internalHeight: number;
    uniformBuffer: Buffer;
    primitiveBuffer: Buffer;
    triangleBuffer: Buffer;
    lightBuffer: Buffer;
    nodeMinimaBuffer: Buffer;
    nodeMaximaBuffer: Buffer;
    historyTexture: Texture;
    historyMetadataTexture: Texture;
  }): CompiledGPUCommandGraph<RayTracingTraceGraphParameters> {
    const graph = new GPUCommandGraph<RayTracingTraceGraphParameters>(this.device, {
      id: `scene-${props.frameIdentifier}-ray-tracing-trace`
    });
    const uniforms = graph.importBuffer(
      {
        id: 'uniforms',
        byteLength: props.uniformBuffer.byteLength,
        usage: props.uniformBuffer.usage
      },
      props.uniformBuffer
    );
    const primitives = graph.importBuffer(
      {
        id: 'primitives',
        byteLength: props.primitiveBuffer.byteLength,
        usage: props.primitiveBuffer.usage
      },
      props.primitiveBuffer
    );
    const triangles = graph.importBuffer(
      {
        id: 'triangles',
        byteLength: props.triangleBuffer.byteLength,
        usage: props.triangleBuffer.usage
      },
      props.triangleBuffer
    );
    const lights = graph.importBuffer(
      {id: 'lights', byteLength: props.lightBuffer.byteLength, usage: props.lightBuffer.usage},
      props.lightBuffer
    );
    const nodeCount = Math.max(
      1,
      Math.floor(props.nodeMinimaBuffer.byteLength / (3 * Float32Array.BYTES_PER_ELEMENT))
    );
    const nodeMinima = createImportedView(
      graph,
      'node-minima',
      props.nodeMinimaBuffer,
      'float32x3',
      nodeCount
    );
    const nodeMaxima = createImportedView(
      graph,
      'node-maxima',
      props.nodeMaximaBuffer,
      'float32x3',
      nodeCount
    );
    const history = graph.importTexture(
      {
        id: 'history',
        format: 'rgba16float',
        width: props.internalWidth,
        height: props.internalHeight,
        usage: Texture.SAMPLE | Texture.COPY_SRC | Texture.COPY_DST
      },
      props.historyTexture
    );
    const historyMetadata = graph.importTexture(
      {
        id: 'history-metadata',
        format: 'rgba16float',
        width: props.internalWidth,
        height: props.internalHeight,
        usage: Texture.SAMPLE | Texture.COPY_SRC | Texture.COPY_DST
      },
      props.historyMetadataTexture
    );
    const output = graph.createTransientTexture({
      id: 'output',
      format: 'rgba16float',
      width: props.internalWidth,
      height: props.internalHeight,
      usage: Texture.STORAGE | Texture.SAMPLE | Texture.COPY_SRC | Texture.COPY_DST
    });
    const outputMetadata = graph.createTransientTexture({
      id: 'output-metadata',
      format: 'rgba16float',
      width: props.internalWidth,
      height: props.internalHeight,
      usage: Texture.STORAGE | Texture.COPY_SRC | Texture.COPY_DST
    });
    const historyView = graph.createTextureView(history);
    const historyMetadataView = graph.createTextureView(historyMetadata);
    const outputView = graph.createTextureView(output);
    const outputMetadataView = graph.createTextureView(outputMetadata);

    graph.addCopyPass({
      id: `${props.frameIdentifier}-prefill-ray-tracing-history`,
      resources: [
        {texture: historyView, usage: 'copy-source'},
        {texture: outputView, usage: 'copy-destination'},
        {texture: historyMetadataView, usage: 'copy-source'},
        {texture: outputMetadataView, usage: 'copy-destination'}
      ],
      compile: () => ({
        encode: ({commandEncoder, getTexture}) => {
          commandEncoder.copyTextureToTexture({
            sourceTexture: getTexture(historyView),
            destinationTexture: getTexture(outputView),
            width: props.internalWidth,
            height: props.internalHeight
          });
          commandEncoder.copyTextureToTexture({
            sourceTexture: getTexture(historyMetadataView),
            destinationTexture: getTexture(outputMetadataView),
            width: props.internalWidth,
            height: props.internalHeight
          });
        }
      })
    });

    graph.addComputePass({
      id: `${props.frameIdentifier}-trace-rays`,
      resources: [
        {buffer: uniforms, usage: 'uniform'},
        {buffer: primitives, usage: 'storage-read'},
        {buffer: triangles, usage: 'storage-read'},
        {buffer: lights, usage: 'storage-read'},
        {buffer: nodeMinima, usage: 'storage-read'},
        {buffer: nodeMaxima, usage: 'storage-read'},
        {texture: historyView, usage: 'sampled'},
        {texture: historyMetadataView, usage: 'sampled'},
        {texture: outputView, usage: 'storage-write'},
        {texture: outputMetadataView, usage: 'storage-write'}
      ],
      compile: ({device}) => {
        const computation = new Computation(device, {
          id: `${props.frameIdentifier}-ray-tracing-computation`,
          source: RAY_TRACING_SCENE_SHADER,
          shaderLayout: {
            bindings: [
              {name: 'uniforms', type: 'uniform', group: 0, location: 0},
              {name: 'primitives', type: 'read-only-storage', group: 0, location: 1},
              {name: 'triangles', type: 'read-only-storage', group: 0, location: 2},
              {name: 'lights', type: 'read-only-storage', group: 0, location: 3},
              {name: 'nodeMinima', type: 'read-only-storage', group: 0, location: 4},
              {name: 'nodeMaxima', type: 'read-only-storage', group: 0, location: 5},
              {
                name: 'historyImage',
                type: 'texture',
                group: 0,
                location: 6,
                sampleType: 'unfilterable-float'
              },
              {
                name: 'historyMetadata',
                type: 'texture',
                group: 0,
                location: 7,
                sampleType: 'unfilterable-float'
              },
              {
                name: 'outputImage',
                type: 'storage',
                group: 0,
                location: 8,
                access: 'write-only',
                format: 'rgba16float'
              },
              {
                name: 'outputMetadata',
                type: 'storage',
                group: 0,
                location: 9,
                access: 'write-only',
                format: 'rgba16float'
              }
            ]
          }
        });
        return {
          encode: ({computePass, getBuffer, getTextureView, parameters}) => {
            computation.setBindings({
              uniforms: getBuffer(uniforms),
              primitives: getBuffer(primitives),
              triangles: getBuffer(triangles),
              lights: getBuffer(lights),
              nodeMinima: getViewBinding(nodeMinima, getBuffer),
              nodeMaxima: getViewBinding(nodeMaxima, getBuffer),
              historyImage: getTextureView(historyView),
              historyMetadata: getTextureView(historyMetadataView),
              outputImage: getTextureView(outputView),
              outputMetadata: getTextureView(outputMetadataView)
            });
            computation.dispatch(
              computePass,
              Math.ceil(parameters.dispatchWidth / 8),
              Math.ceil(props.internalHeight / 8),
              1
            );
          },
          destroy: () => computation.destroy()
        };
      }
    });

    graph.addRenderPass({
      id: `${props.frameIdentifier}-present-ray-tracing`,
      resources: [{texture: outputView, usage: 'sampled'}],
      compile: ({device}) => {
        const model = new Model(device, {
          id: `${props.frameIdentifier}-ray-tracing-presentation`,
          source: getRayTracingScenePresentationShader(
            device.preferredColorFormat === 'rgba16float'
          ),
          vertexCount: 3,
          colorAttachmentFormats: [device.preferredColorFormat],
          depthStencilAttachmentFormat: 'depth24plus',
          shaderLayout: {
            attributes: [],
            bindings: [
              {
                name: 'image',
                type: 'texture',
                group: 0,
                location: 0,
                sampleType: 'unfilterable-float'
              }
            ]
          },
          parameters: {depthWriteEnabled: false, depthCompare: 'always'}
        });
        return {
          encode: ({renderPass, getTextureView}) => {
            model.setBindings({image: getTextureView(outputView)});
            model.draw(renderPass);
          },
          destroy: () => model.destroy()
        };
      }
    });

    graph.addCopyPass({
      id: `${props.frameIdentifier}-remember-ray-tracing`,
      resources: [
        {texture: outputView, usage: 'copy-source'},
        {texture: historyView, usage: 'copy-destination'},
        {texture: outputMetadataView, usage: 'copy-source'},
        {texture: historyMetadataView, usage: 'copy-destination'}
      ],
      compile: () => ({
        encode: ({commandEncoder, getTexture}) => {
          commandEncoder.copyTextureToTexture({
            sourceTexture: getTexture(outputView),
            destinationTexture: getTexture(historyView),
            width: props.internalWidth,
            height: props.internalHeight
          });
          commandEncoder.copyTextureToTexture({
            sourceTexture: getTexture(outputMetadataView),
            destinationTexture: getTexture(historyMetadataView),
            width: props.internalWidth,
            height: props.internalHeight
          });
        }
      })
    });

    return graph.compile();
  }
}

function getTopologyRevision(options: RayTracingSceneRenderOptions): string {
  return JSON.stringify(
    options.surfaces.map(surface => [
      surface.id,
      surface.geometry.id,
      surface.geometryVersion,
      surface.transforms.length,
      surface.morphWeights,
      options.primitives?.[surface.id]
    ])
  );
}

function getPrimitiveRevision(options: RayTracingSceneRenderOptions): string {
  return JSON.stringify(
    options.surfaces.map(surface => [
      surface.id,
      surface.material.id,
      surface.material.version,
      surface.material.uniforms,
      surface.transforms.map(transform => Array.from(transform)),
      (surface as RayTracingSceneSurface).instanceIds,
      options.primitives?.[surface.id]
    ])
  );
}

function getTransformRevision(options: RayTracingSceneRenderOptions): string {
  return JSON.stringify(
    options.surfaces.map(surface => [
      surface.id,
      surface.transforms.map(transform => Array.from(transform)),
      (surface as RayTracingSceneSurface).instanceIds
    ])
  );
}

function getLightRevision(lights: readonly Light[]): string {
  return JSON.stringify(lights);
}

function getRenderRevision(
  options: RayTracingSceneRenderOptions,
  inverseViewProjection: Matrix4
): string {
  // Scene adapters may recommit an unchanged camera every animation tick. Temporal mode keeps
  // ordinary camera motion out of this reset key and rejects incompatible history in the shader.
  const cameraRevision =
    (options.temporalReprojection ?? true)
      ? undefined
      : [Array.from(inverseViewProjection), Array.from(options.camera.position)];
  return JSON.stringify([
    options.cameraProjection,
    cameraRevision,
    options.background,
    options.exposure,
    options.fogColor,
    options.fogDensity,
    options.samplesPerPixel,
    options.maxBounces,
    options.progressive,
    options.shadows,
    options.temporalReprojection,
    options.shadowSamplesPerFrame
  ]);
}

function makeRayTracingTopology(
  surfaces: readonly SceneSurface[],
  primitives: Readonly<Record<string, RayTracingScenePrimitive>>,
  geometryCache: Map<string, CompiledRayGeometry>
): RayTracingTopology {
  const triangleValues: number[] = [];
  const geometryLayouts = new Map<string, RayTracingGeometryLayout>();

  for (const surface of surfaces) {
    if (primitives[surface.id]?.type === 'sphere') {
      continue;
    }
    const geometryIdentifier = getGeometryIdentifier(surface);
    if (geometryLayouts.has(geometryIdentifier)) {
      continue;
    }
    const compiledGeometry = compileRayGeometry(surface, geometryCache);
    const triangleStart = triangleValues.length / TRIANGLE_FLOAT_COUNT;
    triangleValues.push(...compiledGeometry.triangles);
    geometryLayouts.set(geometryIdentifier, {
      triangleStart,
      triangleCount: compiledGeometry.triangleCount,
      bounds: compiledGeometry.bounds
    });
  }

  return {
    triangles: makeStorageData(triangleValues, TRIANGLE_FLOAT_COUNT),
    geometryLayouts
  };
}

function makePrimitiveData(
  surfaces: readonly SceneSurface[],
  primitives: Readonly<Record<string, RayTracingScenePrimitive>>,
  geometryLayouts: Map<string, RayTracingGeometryLayout>,
  previousTransforms: Map<string, Matrix4>
): RayTracingPrimitiveData {
  const primitiveValues: number[] = [];
  const nextPreviousTransforms = new Map<string, Matrix4>();
  let triangleCount = 0;

  for (const surface of surfaces) {
    const primitive = primitives[surface.id];
    const sphereRadius = primitive?.type === 'sphere' ? primitive.radius : 0;
    const geometryLayout =
      sphereRadius > 0 ? undefined : geometryLayouts.get(getGeometryIdentifier(surface));
    const bounds = geometryLayout?.bounds ?? [0, 0, 0, sphereRadius];
    const materialUniforms = surface.material.uniforms;
    const baseColor = materialUniforms?.baseColorFactor ?? [0.8, 0.8, 0.8, 1];
    const emissive = materialUniforms?.emissiveFactor ?? [0, 0, 0];
    const emissiveStrength = materialUniforms?.emissiveStrength ?? 1;
    const metallicRoughness = materialUniforms?.metallicRoughnessValues ?? [0, 0.5];
    const instanceIds = (surface as RayTracingSceneSurface).instanceIds;

    for (let transformIndex = 0; transformIndex < surface.transforms.length; transformIndex++) {
      const transform = new Matrix4(surface.transforms[transformIndex]);
      const inverseTransform = new Matrix4(transform).invert();
      const instanceIdentifier = instanceIds?.[transformIndex] ?? String(transformIndex);
      const placementIdentifier = `${surface.id}:${instanceIdentifier}`;
      const previousTransform = previousTransforms.get(placementIdentifier) ?? transform;
      primitiveValues.push(
        ...transform,
        ...inverseTransform,
        baseColor[0],
        baseColor[1],
        baseColor[2],
        baseColor[3] ?? 1,
        emissive[0] * emissiveStrength,
        emissive[1] * emissiveStrength,
        emissive[2] * emissiveStrength,
        metallicRoughness[0],
        metallicRoughness[1],
        sphereRadius,
        geometryLayout?.triangleStart ?? 0,
        geometryLayout?.triangleCount ?? 0,
        bounds[0],
        bounds[1],
        bounds[2],
        bounds[3],
        ...previousTransform
      );
      nextPreviousTransforms.set(placementIdentifier, new Matrix4(transform));
      triangleCount += geometryLayout?.triangleCount ?? 0;
    }
  }

  return {
    primitives: makeStorageData(primitiveValues, PRIMITIVE_FLOAT_COUNT),
    primitiveCount: primitiveValues.length / PRIMITIVE_FLOAT_COUNT,
    triangleCount,
    previousTransforms: nextPreviousTransforms
  };
}

function makeRayTracingScene(
  primitiveData: RayTracingPrimitiveData,
  triangles: Float32Array,
  lights: readonly Light[]
): RayTracingScene {
  return {
    primitives: primitiveData.primitives,
    triangles,
    lights: makeLightData(lights),
    primitiveCount: primitiveData.primitiveCount,
    lightCount: lights.length,
    triangleCount: primitiveData.triangleCount
  };
}

function compileRayGeometry(
  surface: SceneSurface,
  geometryCache: Map<string, CompiledRayGeometry>
): CompiledRayGeometry {
  const geometryIdentifier = getGeometryIdentifier(surface);
  const cachedGeometry = geometryCache.get(geometryIdentifier);
  if (cachedGeometry) {
    return cachedGeometry;
  }

  const engineGeometry = surface.geometry;
  const positions = engineGeometry.attributes['POSITION']?.value;
  const normals = engineGeometry.attributes['NORMAL']?.value;
  if (!positions || !normals) {
    throw new Error('Ray tracing scene geometry requires positions and normals.');
  }

  const triangleValues: number[] = [];
  const bounds = getGeometryBounds(engineGeometry);
  const indices = engineGeometry.indices?.value;
  const vertexCount = indices?.length ?? positions.length / 3;
  for (let vertexIndex = 0; vertexIndex + 2 < vertexCount; vertexIndex += 3) {
    for (let cornerIndex = 0; cornerIndex < 3; cornerIndex++) {
      const positionIndex =
        Number(indices?.[vertexIndex + cornerIndex] ?? vertexIndex + cornerIndex) * 3;
      triangleValues.push(
        Number(positions[positionIndex]),
        Number(positions[positionIndex + 1]),
        Number(positions[positionIndex + 2]),
        0
      );
    }
    for (let cornerIndex = 0; cornerIndex < 3; cornerIndex++) {
      const normalIndex =
        Number(indices?.[vertexIndex + cornerIndex] ?? vertexIndex + cornerIndex) * 3;
      triangleValues.push(
        Number(normals[normalIndex]),
        Number(normals[normalIndex + 1]),
        Number(normals[normalIndex + 2]),
        0
      );
    }
  }

  const compiledGeometry: CompiledRayGeometry = {
    triangles: new Float32Array(triangleValues),
    triangleCount: triangleValues.length / TRIANGLE_FLOAT_COUNT,
    bounds
  };
  geometryCache.set(geometryIdentifier, compiledGeometry);
  return compiledGeometry;
}

function getGeometryIdentifier(surface: SceneSurface): string {
  return `${surface.geometry.id}:${surface.geometryVersion ?? 0}`;
}

function getGeometryBounds(geometry: Geometry): readonly [number, number, number, number] {
  const positions = geometry.attributes['POSITION']?.value;
  if (!positions || positions.length === 0) {
    return [0, 0, 0, 0];
  }

  const minimum = [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY];
  const maximum = [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY];
  for (let positionIndex = 0; positionIndex + 2 < positions.length; positionIndex += 3) {
    for (let componentIndex = 0; componentIndex < 3; componentIndex++) {
      const position = Number(positions[positionIndex + componentIndex]);
      minimum[componentIndex] = Math.min(minimum[componentIndex], position);
      maximum[componentIndex] = Math.max(maximum[componentIndex], position);
    }
  }

  const center = minimum.map((value, componentIndex) => (value + maximum[componentIndex]) * 0.5);
  let radiusSquared = 0;
  for (let positionIndex = 0; positionIndex + 2 < positions.length; positionIndex += 3) {
    const distanceSquared =
      (Number(positions[positionIndex]) - center[0]) ** 2 +
      (Number(positions[positionIndex + 1]) - center[1]) ** 2 +
      (Number(positions[positionIndex + 2]) - center[2]) ** 2;
    radiusSquared = Math.max(radiusSquared, distanceSquared);
  }
  return [center[0], center[1], center[2], Math.sqrt(radiusSquared) + 0.0001];
}

function makeLightData(lights: readonly Light[]): Float32Array {
  const values: number[] = [];
  for (const light of lights) {
    const color = light.color ?? [1, 1, 1];
    const intensity = light.intensity ?? 1;
    const position = light.type === 'point' || light.type === 'spot' ? light.position : [0, 0, 0];
    const direction =
      light.type === 'directional' || light.type === 'spot' ? light.direction : [0, -1, 0];
    const attenuation =
      light.type === 'point' || light.type === 'spot'
        ? (light.attenuation ?? [1, 0, 0])
        : [1, 0, 0];
    const type =
      light.type === 'ambient'
        ? 0
        : light.type === 'directional'
          ? 1
          : light.type === 'point'
            ? 2
            : 3;
    const innerCone = light.type === 'spot' ? Math.cos(light.innerConeAngle ?? 0.35) : 1;
    const outerCone = light.type === 'spot' ? Math.cos(light.outerConeAngle ?? 0.5) : 0;

    values.push(
      color[0],
      color[1],
      color[2],
      intensity,
      position[0],
      position[1],
      position[2],
      innerCone,
      direction[0],
      direction[1],
      direction[2],
      type,
      attenuation[0],
      attenuation[1],
      attenuation[2],
      outerCone
    );
  }
  return makeStorageData(values, LIGHT_FLOAT_COUNT);
}

function makeStorageData(values: number[], minimumFloatCount: number): Float32Array {
  return values.length > 0 ? new Float32Array(values) : new Float32Array(minimumFloatCount);
}

function makeUniformData(props: {
  options: RayTracingSceneRenderOptions;
  inverseViewProjection: Matrix4;
  previousViewProjection: Matrix4;
  previousCameraPosition: readonly number[];
  displayWidth: number;
  displayHeight: number;
  internalWidth: number;
  internalHeight: number;
  resolutionScale: number;
  phaseIndex: number;
  phaseCount: number;
  primitiveCount: number;
  primitiveCapacity: number;
  leafCapacity: number;
  lightCount: number;
  accumulatedFrameCount: number;
  frameIndex: number;
}): Float32Array {
  const data = new Float32Array(UNIFORM_FLOAT_COUNT);
  const unsignedData = new Uint32Array(data.buffer);
  const background = props.options.background ?? [0.015, 0.018, 0.038, 1];
  const fogColor = props.options.fogColor ?? [0.025, 0.035, 0.075];

  data.set(props.inverseViewProjection, 0);
  data.set(props.options.camera.position, 16);
  data[19] = props.options.cameraProjection === 'orthographic' ? 1 : 0;
  data.set(background, 20);
  unsignedData[24] = props.internalWidth;
  unsignedData[25] = props.internalHeight;
  unsignedData[26] = props.primitiveCount;
  unsignedData[27] = props.lightCount;
  data[28] = props.options.exposure ?? 1.35;
  data[29] = props.accumulatedFrameCount;
  data[30] = props.options.samplesPerPixel ?? 1;
  data[31] = (props.options.shadows ?? true) ? 1 : 0;
  data.set(fogColor, 32);
  data[35] = props.options.fogDensity ?? 0;
  unsignedData[36] = props.leafCapacity - 1;
  unsignedData[37] = props.leafCapacity;
  unsignedData[38] = props.primitiveCapacity;
  unsignedData[39] = props.frameIndex;
  unsignedData[40] = props.displayWidth;
  unsignedData[41] = props.displayHeight;
  unsignedData[42] = props.phaseIndex;
  unsignedData[43] = props.phaseCount;
  data[44] = props.resolutionScale;
  data[45] = 1 / props.phaseCount;
  data[46] = props.options.shadowSamplesPerFrame ?? 1;
  data[47] = (props.options.temporalReprojection ?? true) ? 1 : 0;
  data.set(props.previousViewProjection, 48);
  data.set(props.previousCameraPosition, 64);
  data[67] = 1;
  return data;
}

function createImportedView<Format extends 'float32x3' | 'uint32x2' | 'uint32', Parameters>(
  graph: GPUCommandGraph<Parameters>,
  identifier: string,
  buffer: Buffer,
  format: Format,
  length: number
): GraphDataView<Format> {
  const handle = graph.importBuffer(
    {id: identifier, byteLength: buffer.byteLength, usage: buffer.usage},
    buffer
  );
  return graph.createDataView(handle, {format, length});
}

function getQualityOptions(options: RayTracingSceneRenderOptions): RayTracingQualityOptions {
  const adaptiveResolution = options.adaptiveResolution ?? true;
  const minimumResolutionScale = clampResolutionScale(
    options.minimumResolutionScale ?? DEFAULT_MINIMUM_RESOLUTION_SCALE,
    0.125,
    1
  );
  const requestedResolutionScale = clampResolutionScale(
    options.resolutionScale ?? DEFAULT_RESOLUTION_SCALE,
    minimumResolutionScale,
    1
  );
  return {
    resolutionScale: requestedResolutionScale,
    requestedResolutionScale,
    minimumResolutionScale,
    adaptiveResolution,
    targetFrameTimeMilliseconds: Math.max(
      1,
      options.targetFrameTimeMilliseconds ?? DEFAULT_TARGET_FRAME_TIME_MILLISECONDS
    )
  };
}

function updateQualityOptions(
  resources: RayTracingFrameResources,
  quality: RayTracingQualityOptions
): boolean {
  if (
    resources.minimumResolutionScale === quality.minimumResolutionScale &&
    resources.adaptiveResolution === quality.adaptiveResolution &&
    resources.targetFrameTimeMilliseconds === quality.targetFrameTimeMilliseconds &&
    resources.requestedResolutionScale === quality.requestedResolutionScale
  ) {
    return false;
  }
  resources.resolutionScale = quality.resolutionScale;
  resources.requestedResolutionScale = quality.requestedResolutionScale;
  resources.minimumResolutionScale = quality.minimumResolutionScale;
  resources.adaptiveResolution = quality.adaptiveResolution;
  resources.targetFrameTimeMilliseconds = quality.targetFrameTimeMilliseconds;
  resources.phaseCount = 1;
  resources.phaseIndex = 0;
  resources.overBudgetFrameCount = 0;
  resources.underBudgetFrameCount = 0;
  resources.averageFrameTimeMilliseconds = undefined;
  return true;
}

function updateFrameTiming(
  resources: RayTracingFrameResources,
  currentTimeMilliseconds: number
): void {
  const previousTimeMilliseconds = resources.lastRenderTimeMilliseconds;
  resources.lastRenderTimeMilliseconds = currentTimeMilliseconds;
  if (previousTimeMilliseconds === undefined) {
    return;
  }
  const frameTimeMilliseconds = currentTimeMilliseconds - previousTimeMilliseconds;
  if (frameTimeMilliseconds <= 0 || frameTimeMilliseconds > 1000) {
    return;
  }
  resources.averageFrameTimeMilliseconds =
    resources.averageFrameTimeMilliseconds === undefined
      ? frameTimeMilliseconds
      : resources.averageFrameTimeMilliseconds * 0.8 + frameTimeMilliseconds * 0.2;
}

type RayTracingAdaptiveBudgetState = Pick<
  RayTracingFrameResources,
  | 'resolutionScale'
  | 'requestedResolutionScale'
  | 'minimumResolutionScale'
  | 'adaptiveResolution'
  | 'targetFrameTimeMilliseconds'
  | 'phaseCount'
  | 'phaseIndex'
  | 'averageFrameTimeMilliseconds'
  | 'overBudgetFrameCount'
  | 'underBudgetFrameCount'
  | 'lastBudgetAdjustmentTimeMilliseconds'
  | 'historyNeedsReset'
  | 'accumulatedFrameCount'
>;

/** @internal Advances the conservative adaptive ray-work scheduler for one frame. */
export function updateRayTracingAdaptiveBudget(
  resources: RayTracingAdaptiveBudgetState,
  currentTimeMilliseconds: number
): void {
  if (resources.historyNeedsReset) {
    resources.phaseCount = 1;
    resources.phaseIndex = 0;
    resources.overBudgetFrameCount = 0;
    resources.underBudgetFrameCount = 0;
    return;
  }
  if (!resources.adaptiveResolution || resources.averageFrameTimeMilliseconds === undefined) {
    return;
  }
  const frameTimeMilliseconds = resources.averageFrameTimeMilliseconds;
  const targetFrameTimeMilliseconds = resources.targetFrameTimeMilliseconds;
  if (frameTimeMilliseconds > targetFrameTimeMilliseconds * OVER_BUDGET_FRAME_TIME_RATIO) {
    resources.overBudgetFrameCount = Math.min(
      OVER_BUDGET_FRAME_COUNT,
      resources.overBudgetFrameCount + 1
    );
    resources.underBudgetFrameCount = 0;
  } else if (frameTimeMilliseconds < targetFrameTimeMilliseconds * UNDER_BUDGET_FRAME_TIME_RATIO) {
    resources.underBudgetFrameCount = Math.min(
      UNDER_BUDGET_FRAME_COUNT,
      resources.underBudgetFrameCount + 1
    );
    resources.overBudgetFrameCount = 0;
  } else {
    resources.overBudgetFrameCount = 0;
    resources.underBudgetFrameCount = 0;
  }
  if (
    currentTimeMilliseconds - resources.lastBudgetAdjustmentTimeMilliseconds <
    FRAME_BUDGET_COOLDOWN_MILLISECONDS
  ) {
    return;
  }

  if (resources.overBudgetFrameCount >= OVER_BUDGET_FRAME_COUNT) {
    const lowerResolutionScale = getAdjacentResolutionScale(
      resources.resolutionScale,
      resources.minimumResolutionScale,
      resources.requestedResolutionScale,
      -1
    );
    if (lowerResolutionScale < resources.resolutionScale) {
      resources.resolutionScale = lowerResolutionScale;
      resources.historyNeedsReset = true;
    } else if (resources.accumulatedFrameCount >= MINIMUM_HISTORY_FRAMES_FOR_SPARSE_SCHEDULING) {
      resources.phaseCount = Math.min(4, resources.phaseCount * 2);
      resources.phaseIndex %= resources.phaseCount;
    } else {
      return;
    }
    resources.overBudgetFrameCount = 0;
    resources.lastBudgetAdjustmentTimeMilliseconds = currentTimeMilliseconds;
    return;
  }

  if (resources.underBudgetFrameCount >= UNDER_BUDGET_FRAME_COUNT) {
    if (resources.phaseCount > 1) {
      resources.phaseCount = Math.max(1, resources.phaseCount / 2);
      resources.phaseIndex %= resources.phaseCount;
    } else {
      const higherResolutionScale = getAdjacentResolutionScale(
        resources.resolutionScale,
        resources.minimumResolutionScale,
        resources.requestedResolutionScale,
        1
      );
      if (higherResolutionScale <= resources.resolutionScale) {
        resources.underBudgetFrameCount = 0;
        return;
      }
      resources.resolutionScale = higherResolutionScale;
      resources.historyNeedsReset = true;
    }
    resources.underBudgetFrameCount = 0;
    resources.lastBudgetAdjustmentTimeMilliseconds = currentTimeMilliseconds;
  }
}

function getInternalDimensions(
  displayWidth: number,
  displayHeight: number,
  resolutionScale: number
): {width: number; height: number} {
  return {
    width: Math.max(1, Math.ceil(displayWidth * resolutionScale)),
    height: Math.max(1, Math.ceil(displayHeight * resolutionScale))
  };
}

function getAdjacentResolutionScale(
  currentResolutionScale: number,
  minimumResolutionScale: number,
  maximumResolutionScale: number,
  direction: -1 | 1
): number {
  const scales = getAvailableResolutionScales(minimumResolutionScale, maximumResolutionScale);
  const currentIndex = scales.findIndex(scale => scale >= currentResolutionScale - 0.0001);
  const index = currentIndex < 0 ? scales.length - 1 : currentIndex;
  return scales[Math.max(0, Math.min(scales.length - 1, index + direction))];
}

function getAvailableResolutionScales(
  minimumResolutionScale: number,
  maximumResolutionScale: number
): number[] {
  const scales = [
    minimumResolutionScale,
    ...RESOLUTION_SCALES.filter(
      scale => scale > minimumResolutionScale && scale < maximumResolutionScale
    ),
    maximumResolutionScale
  ].sort((leftScale, rightScale) => leftScale - rightScale);
  return scales.filter(
    (scale, index) => index === 0 || Math.abs(scale - scales[index - 1]) > 0.0001
  );
}

function clampResolutionScale(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, Number.isFinite(value) ? value : minimum));
}

function getSamplesPerPixel(options: RayTracingSceneRenderOptions): number {
  return Math.max(1, Math.min(16, Math.floor(options.samplesPerPixel ?? 1)));
}

function isCameraCut(
  previousViewProjection: Matrix4,
  viewProjection: Matrix4,
  previousCameraPosition: readonly number[],
  cameraPosition: Readonly<NumericArray>
): boolean {
  let maximumMatrixDifference = 0;
  for (let index = 0; index < 16; index++) {
    maximumMatrixDifference = Math.max(
      maximumMatrixDifference,
      Math.abs(Number(previousViewProjection[index]) - Number(viewProjection[index]))
    );
  }
  const cameraDistance = Math.hypot(
    Number(previousCameraPosition[0] ?? 0) - Number(cameraPosition[0] ?? 0),
    Number(previousCameraPosition[1] ?? 0) - Number(cameraPosition[1] ?? 0),
    Number(previousCameraPosition[2] ?? 0) - Number(cameraPosition[2] ?? 0)
  );
  return maximumMatrixDifference > 0.75 || cameraDistance > 4;
}

function getTimestampMilliseconds(): number {
  return globalThis.performance?.now() ?? Date.now();
}
