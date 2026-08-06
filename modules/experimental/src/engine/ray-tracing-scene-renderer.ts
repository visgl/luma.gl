// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device, Texture} from '@luma.gl/core';
import {Computation, type Geometry, Model} from '@luma.gl/engine';
import type {Light} from '@luma.gl/shadertools';
import {Matrix4} from '@math.gl/core';
import {GPUBVH} from '../gpu-primitives/gpu-bvh';
import {GPUCommandGraph, type CompiledGPUCommandGraph} from '../gpu-primitives/gpu-command-graph';
import {createTransientView, getViewBinding} from '../gpu-primitives/graph-data-view-utils';
import {
  RAY_TRACING_BOUNDS_SHADER,
  RAY_TRACING_SCENE_SHADER,
  getRayTracingScenePresentationShader
} from './ray-tracing-scene-shaders';
import type {SceneRenderOptions, SceneRenderStatistics, SceneSurface} from './scene-renderer';

const PRIMITIVE_FLOAT_COUNT = 48;
const TRIANGLE_FLOAT_COUNT = 24;
const LIGHT_FLOAT_COUNT = 16;
const UNIFORM_FLOAT_COUNT = 40;

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
};

type RayTracingScene = {
  primitives: Float32Array;
  triangles: Float32Array;
  lights: Float32Array;
  primitiveCount: number;
  lightCount: number;
  triangleCount: number;
};

type RayTracingFrameResources = {
  width: number;
  height: number;
  uniformBuffer: Buffer;
  primitiveBuffer: Buffer;
  triangleBuffer: Buffer;
  lightBuffer: Buffer;
  historyTexture: Texture;
  graph: CompiledGPUCommandGraph;
  sceneRevision: string;
  renderRevision: string;
  accumulatedFrameCount: number;
  primitiveCount: number;
  primitiveCapacity: number;
  leafCapacity: number;
  lightCount: number;
  triangleCount: number;
};

type CompiledRayGeometry = {
  triangleStart: number;
  triangleCount: number;
  bounds: readonly [number, number, number, number];
};

/** Shared WebGPU software ray tracer consuming the canonical retained-scene contract. */
export class RayTracingSceneRenderer {
  private readonly device: Device;
  private readonly frames = new Map<string, RayTracingFrameResources>();

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
    const width = options.width ?? defaultWidth;
    const height = options.height ?? defaultHeight;
    const lights = options.lights ?? [];
    const sceneRevision = getSceneRevision(options);
    let resources = this.frames.get(options.id);
    if (resources && (resources.width !== width || resources.height !== height)) {
      this.destroyFrame(options.id);
      resources = undefined;
    }

    if (!resources || resources.sceneRevision !== sceneRevision) {
      const scene = makeRayTracingScene(options.surfaces, lights, options.primitives ?? {});
      if (
        resources &&
        (resources.primitiveBuffer.byteLength < scene.primitives.byteLength ||
          resources.triangleBuffer.byteLength < scene.triangles.byteLength ||
          resources.lightBuffer.byteLength < scene.lights.byteLength)
      ) {
        this.destroyFrame(options.id);
        resources = undefined;
      }
      if (!resources) {
        resources = this.createFrameResources(options.id, width, height, scene);
        this.frames.set(options.id, resources);
      } else {
        resources.primitiveBuffer.write(scene.primitives);
        resources.triangleBuffer.write(scene.triangles);
        resources.lightBuffer.write(scene.lights);
      }
      resources.sceneRevision = sceneRevision;
      resources.primitiveCount = scene.primitiveCount;
      resources.lightCount = scene.lightCount;
      resources.triangleCount = scene.triangleCount;
      resources.accumulatedFrameCount = 0;
    }

    const inverseViewProjection = new Matrix4(options.camera.projectionMatrix)
      .multiplyRight(options.camera.viewMatrix)
      .invert();
    const renderRevision = getRenderRevision(options, inverseViewProjection);
    if (resources.renderRevision !== renderRevision) {
      resources.renderRevision = renderRevision;
      resources.accumulatedFrameCount = 0;
    }

    const progressive = options.progressive ?? true;
    const accumulatedFrameCount = progressive ? resources.accumulatedFrameCount : 0;
    resources.uniformBuffer.write(
      makeUniformData({
        options,
        inverseViewProjection,
        width,
        height,
        primitiveCount: resources.primitiveCount,
        primitiveCapacity: resources.primitiveCapacity,
        leafCapacity: resources.leafCapacity,
        lightCount: resources.lightCount,
        accumulatedFrameCount
      })
    );

    resources.graph.encode(this.device.commandEncoder, {parameters: undefined});
    resources.accumulatedFrameCount = progressive ? accumulatedFrameCount + 1 : 0;

    return {
      surfaceCount: options.surfaces.length,
      instanceCount: options.surfaces.reduce(
        (count, surface) => count + surface.transforms.length,
        0
      ),
      drawCount: 1,
      triangleCount: resources.triangleCount
    };
  }

  destroyFrame(frameIdentifier: string): void {
    const resources = this.frames.get(frameIdentifier);
    if (!resources) {
      return;
    }
    resources.graph.destroy();
    resources.uniformBuffer.destroy();
    resources.primitiveBuffer.destroy();
    resources.triangleBuffer.destroy();
    resources.lightBuffer.destroy();
    resources.historyTexture.destroy();
    this.frames.delete(frameIdentifier);
  }

  destroy(): void {
    for (const frameIdentifier of Array.from(this.frames.keys())) {
      this.destroyFrame(frameIdentifier);
    }
  }

  private createFrameResources(
    frameIdentifier: string,
    width: number,
    height: number,
    scene: RayTracingScene
  ): RayTracingFrameResources {
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
    const historyTexture = this.device.createTexture({
      id: `${frameIdentifier}-ray-tracing-history`,
      width,
      height,
      format: 'rgba16float',
      usage: Texture.SAMPLE | Texture.COPY_DST
    });
    const primitiveCapacity = Math.max(
      1,
      Math.floor(
        primitiveBuffer.byteLength / (PRIMITIVE_FLOAT_COUNT * Float32Array.BYTES_PER_ELEMENT)
      )
    );
    const leafCapacity = 2 ** Math.ceil(Math.log2(primitiveCapacity));
    const graph = this.createCommandGraph({
      frameIdentifier,
      width,
      height,
      uniformBuffer,
      primitiveBuffer,
      primitiveCapacity,
      leafCapacity,
      triangleBuffer,
      lightBuffer,
      historyTexture
    });

    return {
      width,
      height,
      uniformBuffer,
      primitiveBuffer,
      triangleBuffer,
      lightBuffer,
      historyTexture,
      graph,
      sceneRevision: '',
      renderRevision: '',
      accumulatedFrameCount: 0,
      primitiveCount: scene.primitiveCount,
      primitiveCapacity,
      leafCapacity,
      lightCount: scene.lightCount,
      triangleCount: scene.triangleCount
    };
  }

  private createCommandGraph(props: {
    frameIdentifier: string;
    width: number;
    height: number;
    uniformBuffer: Buffer;
    primitiveBuffer: Buffer;
    primitiveCapacity: number;
    leafCapacity: number;
    triangleBuffer: Buffer;
    lightBuffer: Buffer;
    historyTexture: Texture;
  }): CompiledGPUCommandGraph {
    const graph = new GPUCommandGraph(this.device, {
      id: `scene-${props.frameIdentifier}-ray-tracing`
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
    const history = graph.importTexture(
      {
        id: 'history',
        format: 'rgba16float',
        width: props.width,
        height: props.height,
        usage: Texture.SAMPLE | Texture.COPY_DST
      },
      props.historyTexture
    );
    const output = graph.createTransientTexture({
      id: 'output',
      format: 'rgba16float',
      width: props.width,
      height: props.height,
      usage: Texture.STORAGE | Texture.SAMPLE | Texture.COPY_SRC
    });
    const historyView = graph.createTextureView(history);
    const outputView = graph.createTextureView(output);
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
    const nodeMinima = createTransientView(graph, 'node-minima', 'float32x3', nodeCount);
    const nodeMaxima = createTransientView(graph, 'node-maxima', 'float32x3', nodeCount);
    const nodeChildren = createTransientView(graph, 'node-children', 'uint32x2', nodeCount);
    const leafIds = createTransientView(graph, 'leaf-ids', 'uint32', props.leafCapacity);
    const acceleration = new GPUBVH({
      id: `${props.frameIdentifier}-ray-tracing-bvh`,
      minima: primitiveMinima,
      maxima: primitiveMaxima,
      leafCapacity: props.leafCapacity,
      nodeMinima,
      nodeMaxima,
      nodeChildren,
      leafIds,
      count: createTransientView(graph, 'bvh-count', 'uint32', 1),
      overflow: createTransientView(graph, 'bvh-overflow', 'uint32', 1)
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
        {texture: outputView, usage: 'storage-write'}
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
                name: 'outputImage',
                type: 'storage',
                group: 0,
                location: 7,
                access: 'write-only',
                format: 'rgba16float'
              }
            ]
          }
        });
        return {
          encode: ({computePass, getBuffer, getTextureView}) => {
            computation.setBindings({
              uniforms: getBuffer(uniforms),
              primitives: getBuffer(primitives),
              triangles: getBuffer(triangles),
              lights: getBuffer(lights),
              nodeMinima: getViewBinding(nodeMinima, getBuffer),
              nodeMaxima: getViewBinding(nodeMaxima, getBuffer),
              historyImage: getTextureView(historyView),
              outputImage: getTextureView(outputView)
            });
            computation.dispatch(
              computePass,
              Math.ceil(props.width / 8),
              Math.ceil(props.height / 8),
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
        {texture: historyView, usage: 'copy-destination'}
      ],
      compile: () => ({
        encode: ({commandEncoder, getTexture}) => {
          commandEncoder.copyTextureToTexture({
            sourceTexture: getTexture(outputView),
            destinationTexture: getTexture(historyView),
            width: props.width,
            height: props.height
          });
        }
      })
    });

    return graph.compile();
  }
}

function getSceneRevision(options: RayTracingSceneRenderOptions): string {
  const surfaceRevisions = options.surfaces.map(surface => [
    surface.id,
    surface.geometry.id,
    surface.geometryVersion,
    surface.material.id,
    surface.material.version,
    surface.transforms.map(transform => Array.from(transform)),
    surface.morphWeights,
    options.primitives?.[surface.id]
  ]);
  return JSON.stringify([surfaceRevisions, options.lights]);
}

function getRenderRevision(
  options: RayTracingSceneRenderOptions,
  inverseViewProjection: Matrix4
): string {
  // Scene adapters may recommit an unchanged camera every animation tick.
  return JSON.stringify([
    options.cameraProjection,
    Array.from(inverseViewProjection),
    Array.from(options.camera.position),
    options.background,
    options.exposure,
    options.fogColor,
    options.fogDensity,
    options.samplesPerPixel,
    options.maxBounces,
    options.progressive,
    options.shadows
  ]);
}

function makeRayTracingScene(
  surfaces: readonly SceneSurface[],
  lights: readonly Light[],
  primitives: Readonly<Record<string, RayTracingScenePrimitive>>
): RayTracingScene {
  const primitiveValues: number[] = [];
  const triangleValues: number[] = [];
  const compiledGeometries = new Map<string, CompiledRayGeometry>();
  let triangleCount = 0;

  for (const surface of surfaces) {
    const primitive = primitives[surface.id];
    const sphereRadius = primitive?.type === 'sphere' ? primitive.radius : 0;
    const compiledGeometry =
      sphereRadius > 0
        ? undefined
        : compileRayGeometry(surface, compiledGeometries, triangleValues);
    const bounds = compiledGeometry?.bounds ?? [0, 0, 0, sphereRadius];
    const materialUniforms = surface.material.uniforms;
    const baseColor = materialUniforms?.baseColorFactor ?? [0.8, 0.8, 0.8, 1];
    const emissive = materialUniforms?.emissiveFactor ?? [0, 0, 0];
    const emissiveStrength = materialUniforms?.emissiveStrength ?? 1;
    const metallicRoughness = materialUniforms?.metallicRoughnessValues ?? [0, 0.5];

    for (const sourceTransform of surface.transforms) {
      const transform = new Matrix4(sourceTransform);
      const inverseTransform = new Matrix4(transform).invert();
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
        compiledGeometry?.triangleStart ?? 0,
        compiledGeometry?.triangleCount ?? 0,
        bounds[0],
        bounds[1],
        bounds[2],
        bounds[3]
      );
      triangleCount += compiledGeometry?.triangleCount ?? 0;
    }
  }

  return {
    primitives: makeStorageData(primitiveValues, PRIMITIVE_FLOAT_COUNT),
    triangles: makeStorageData(triangleValues, TRIANGLE_FLOAT_COUNT),
    lights: makeLightData(lights),
    primitiveCount: primitiveValues.length / PRIMITIVE_FLOAT_COUNT,
    lightCount: lights.length,
    triangleCount
  };
}

function compileRayGeometry(
  surface: SceneSurface,
  compiledGeometries: Map<string, CompiledRayGeometry>,
  triangleValues: number[]
): CompiledRayGeometry {
  const engineGeometry = surface.geometry;
  const geometryIdentifier = `${engineGeometry.id}:${surface.geometryVersion ?? 0}`;
  const cachedGeometry = compiledGeometries.get(geometryIdentifier);
  if (cachedGeometry) {
    return cachedGeometry;
  }

  const positions = engineGeometry.attributes['POSITION']?.value;
  const normals = engineGeometry.attributes['NORMAL']?.value;
  if (!positions || !normals) {
    throw new Error('Ray tracing scene geometry requires positions and normals.');
  }

  const bounds = getGeometryBounds(engineGeometry);
  const indices = engineGeometry.indices?.value;
  const vertexCount = indices?.length ?? positions.length / 3;
  const triangleStart = triangleValues.length / TRIANGLE_FLOAT_COUNT;
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
    triangleStart,
    triangleCount: triangleValues.length / TRIANGLE_FLOAT_COUNT - triangleStart,
    bounds
  };
  compiledGeometries.set(geometryIdentifier, compiledGeometry);
  return compiledGeometry;
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
  width: number;
  height: number;
  primitiveCount: number;
  primitiveCapacity: number;
  leafCapacity: number;
  lightCount: number;
  accumulatedFrameCount: number;
}): Float32Array {
  const data = new Float32Array(UNIFORM_FLOAT_COUNT);
  const unsignedData = new Uint32Array(data.buffer);
  const background = props.options.background ?? [0.015, 0.018, 0.038, 1];
  const fogColor = props.options.fogColor ?? [0.025, 0.035, 0.075];

  data.set(props.inverseViewProjection, 0);
  data.set(props.options.camera.position, 16);
  data[19] = props.options.cameraProjection === 'orthographic' ? 1 : 0;
  data.set(background, 20);
  unsignedData[24] = props.width;
  unsignedData[25] = props.height;
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
  unsignedData[39] = 0;
  return data;
}
