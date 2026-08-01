// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type Device, type TextureFormatColor} from '@luma.gl/core';
import {
  GBuffer,
  MAX_DEFERRED_POINT_LIGHTS,
  createDeferredLightingShaderPassPipeline,
  makeDeferredPointLightBufferData,
  type DeferredPointLight
} from '@luma.gl/experimental';
import {Material, MaterialFactory, Model, ShaderInputs, ShaderPassRenderer} from '@luma.gl/engine';
import {type Light} from '@luma.gl/shadertools';
import {Matrix4, type NumberArray3} from '@math.gl/core';
import {
  type ANARIFallbackTextures,
  type ANARIMaterialBindings,
  type ANARITransformResources,
  type SurfacePlacement,
  collectLights,
  collectSurfacePlacements,
  createFallbackTexture,
  getCameraUniforms,
  getFrameSize,
  getMaterialOpacity,
  getMaterialTextureSignature,
  groupPlacementsBySurface,
  makeEngineGeometry,
  makeMaterialBindings,
  updateMaterial,
  updateTransforms
} from './anari-rendering-runtime';
import type {ANARIRendererRuntime} from './anari-renderer-runtime';
import {ANARI_DEFERRED_WGSL_SHADER} from './anari-deferred-shaders';
import {
  anariAppModule,
  anariMaterialModule,
  type ANARIAppUniforms,
  type ANARIMaterialUniforms
} from './anari-shaders';
import type {ANARIFrame, ANARIGeometry, ANARISurface} from './anari-objects';
import type {ANARIFrameStatistics} from './anari-types';

type DeferredCompiledSurface = ANARITransformResources & {
  surface: ANARISurface;
  geometry: ANARIGeometry;
  geometryVersion: number;
  materialVersion: number;
  placementCount: number;
  model: Model;
  material: Material<{anariMaterial: ANARIMaterialUniforms}, ANARIMaterialBindings>;
  triangleCount: number;
  textureSignature: string;
};

type DeferredFrameResources = {
  compiledSurfaces: Map<string, DeferredCompiledSurface>;
  gBuffer: GBuffer | null;
};

const DEFERRED_COLOR_ATTACHMENT_FORMATS = [
  'rgba16float',
  'rgba8unorm',
  'rg16float',
  'rgba8unorm',
  'rgba16float'
] satisfies (TextureFormatColor | null)[];

const ZERO_POINT_LIGHTS = makeDeferredPointLightBufferData([], MAX_DEFERRED_POINT_LIGHTS);

export class ANARIDeferredRenderingRuntime implements ANARIRendererRuntime {
  private readonly device: Device;
  private readonly materialFactory: MaterialFactory<
    {anariMaterial: ANARIMaterialUniforms},
    ANARIMaterialBindings
  >;
  private readonly fallbackTextures: ANARIFallbackTextures;
  private readonly pointLightBuffer: Buffer;
  private readonly frames = new Map<ANARIFrame, DeferredFrameResources>();
  private readonly renderer: ShaderPassRenderer;

  constructor(device: Device) {
    if (device.type !== 'webgpu') {
      throw new Error('ANARI deferred renderer requires a WebGPU device.');
    }
    this.device = device;
    this.materialFactory = new MaterialFactory(device, {modules: [anariMaterialModule]});
    this.fallbackTextures = {
      white: createFallbackTexture(device, 'deferred-white', [255, 255, 255, 255]),
      normal: createFallbackTexture(device, 'deferred-normal', [128, 128, 255, 255]),
      black: createFallbackTexture(device, 'deferred-black', [0, 0, 0, 255])
    };
    this.pointLightBuffer = device.createBuffer({
      id: 'anari-deferred-point-lights',
      data: ZERO_POINT_LIGHTS,
      usage: Buffer.STORAGE | Buffer.COPY_DST
    });
    this.renderer = new ShaderPassRenderer(device, {
      shaderPasses: [createDeferredLightingShaderPassPipeline()],
      colorFormat: 'rgba16float',
      flipY: true
    });
  }

  render(frame: ANARIFrame): ANARIFrameStatistics {
    const world = frame.getParameter('world');
    const camera = frame.getParameter('camera');
    const renderer = frame.getParameter('renderer');
    if (!world || !camera || !renderer) {
      return {surfaceCount: 0, instanceCount: 0, drawCount: 0, triangleCount: 0};
    }

    const [width, height] = getFrameSize(frame, this.device);
    const frameResources = this.getFrameResources(frame, width, height);
    const placements = collectSurfacePlacements(world);
    const placementsBySurface = groupPlacementsBySurface(placements);
    const cameraUniforms = getCameraUniforms(camera, frame);
    const appUniforms: ANARIAppUniforms = {
      ...cameraUniforms,
      exposure: renderer.getParameter('exposure') ?? 1.35,
      fogColor: renderer.getParameter('fogColor') ?? [0.025, 0.035, 0.075],
      fogDensity: renderer.getParameter('fogDensity') ?? 0,
      renderMode: 0,
      highDynamicRange: 1,
      time: typeof performance !== 'undefined' ? performance.now() * 0.001 : 0
    };

    const liveSurfaceIdentifiers = new Set<string>();
    let triangleCount = 0;
    for (const [surface, surfacePlacements] of placementsBySurface) {
      const compiledSurface = this.getCompiledSurface(frameResources, surface, surfacePlacements);
      liveSurfaceIdentifiers.add(surface.id);
      updateTransforms(compiledSurface, surfacePlacements);
      updateMaterial(compiledSurface.material, surface.getParameter('material')!);
      compiledSurface.model.shaderInputs.setProps({anariApp: appUniforms});
      compiledSurface.model.predraw(this.device.commandEncoder);
      triangleCount += compiledSurface.triangleCount * surfacePlacements.length;
    }

    for (const [surfaceIdentifier, compiledSurface] of frameResources.compiledSurfaces) {
      if (!liveSurfaceIdentifiers.has(surfaceIdentifier)) {
        destroyDeferredCompiledSurface(compiledSurface);
        frameResources.compiledSurfaces.delete(surfaceIdentifier);
      }
    }

    const background = renderer.getParameter('background') ?? [0.015, 0.018, 0.038, 1];
    const renderPass = this.device.beginRenderPass({
      id: `anari-${frame.id}-deferred-gbuffer`,
      framebuffer: frameResources.gBuffer!.framebuffer,
      clearColors: [
        new Float32Array([background[0], background[1], background[2], background[3]]),
        new Float32Array([0.5, 0.5, 1, 1]),
        new Float32Array([0, 0, 0, 0]),
        new Float32Array([0, 0, 0, 0]),
        new Float32Array([0, 0, 0, 0])
      ],
      clearDepth: 1
    });

    let drawCount = 0;
    for (const compiledSurface of frameResources.compiledSurfaces.values()) {
      if (compiledSurface.model.draw(renderPass)) {
        drawCount++;
      }
    }
    renderPass.end();

    const deferredLights = getDeferredLights(
      collectLights(world, renderer.getParameter('ambientRadiance') ?? 0.12),
      new Matrix4(cameraUniforms.viewMatrix)
    );
    this.pointLightBuffer.write(
      makeDeferredPointLightBufferData(deferredLights.pointLights, MAX_DEFERRED_POINT_LIGHTS)
    );
    this.renderer.resize([width, height]);
    this.renderer.renderToScreen({
      sourceTexture: frameResources.gBuffer!.colorTexture,
      bindings: {
        depthTexture: frameResources.gBuffer!.depthTexture,
        normalTexture: frameResources.gBuffer!.normalRoughnessTexture,
        baseColorMetallicTexture: frameResources.gBuffer!.getExtraColorTexture('baseColorMetallic'),
        emissiveOcclusionTexture: frameResources.gBuffer!.getExtraColorTexture('emissiveOcclusion'),
        pointLights: this.pointLightBuffer
      },
      uniforms: {
        deferredLighting: {
          inverseProjectionMatrix: new Matrix4(cameraUniforms.projectionMatrix).invert(),
          ambientColor: deferredLights.ambientColor,
          exposure: appUniforms.exposure,
          fogColor: appUniforms.fogColor,
          fogDensity: appUniforms.fogDensity,
          directionalLightDirectionView: deferredLights.directionalLightDirectionView,
          directionalLightColor: deferredLights.directionalLightColor,
          directionalLightIntensity: deferredLights.directionalLightIntensity,
          pointLightCount: deferredLights.pointLights.length
        }
      }
    });

    return {
      surfaceCount: placementsBySurface.size,
      instanceCount: placements.length,
      drawCount,
      triangleCount
    };
  }

  destroyFrame(frame: ANARIFrame): void {
    const frameResources = this.frames.get(frame);
    if (!frameResources) {
      return;
    }
    for (const compiledSurface of frameResources.compiledSurfaces.values()) {
      destroyDeferredCompiledSurface(compiledSurface);
    }
    frameResources.gBuffer?.destroy();
    this.frames.delete(frame);
  }

  destroy(): void {
    for (const frame of Array.from(this.frames.keys())) {
      this.destroyFrame(frame);
    }
    this.renderer.destroy();
    this.pointLightBuffer.destroy();
    this.fallbackTextures.white.destroy();
    this.fallbackTextures.normal.destroy();
    this.fallbackTextures.black.destroy();
  }

  private getFrameResources(
    frame: ANARIFrame,
    width: number,
    height: number
  ): DeferredFrameResources {
    let frameResources = this.frames.get(frame);
    if (!frameResources) {
      frameResources = {
        compiledSurfaces: new Map(),
        gBuffer: null
      };
      this.frames.set(frame, frameResources);
    }

    if (!frameResources.gBuffer) {
      frameResources.gBuffer = new GBuffer(this.device, {
        id: `anari-${frame.id}-deferred`,
        width,
        height,
        colorFormat: 'rgba16float',
        normalRoughnessFormat: 'rgba8unorm',
        velocityFormat: 'rg16float',
        depthStencilFormat: 'depth24plus',
        extraColorAttachments: [
          {name: 'baseColorMetallic', format: 'rgba8unorm'},
          {name: 'emissiveOcclusion', format: 'rgba16float'}
        ]
      });
    } else {
      frameResources.gBuffer.resize({width, height});
    }
    return frameResources;
  }

  private getCompiledSurface(
    frameResources: DeferredFrameResources,
    surface: ANARISurface,
    placements: SurfacePlacement[]
  ): DeferredCompiledSurface {
    const geometry = surface.getParameter('geometry')!;
    const material = surface.getParameter('material')!;
    let compiledSurface = frameResources.compiledSurfaces.get(surface.id);
    if (
      compiledSurface &&
      (compiledSurface.geometry !== geometry ||
        compiledSurface.geometryVersion !== geometry.version ||
        compiledSurface.textureSignature !== getMaterialTextureSignature(material) ||
        compiledSurface.placementCount !== placements.length)
    ) {
      destroyDeferredCompiledSurface(compiledSurface);
      frameResources.compiledSurfaces.delete(surface.id);
      compiledSurface = undefined;
    }

    if (!compiledSurface) {
      const engineGeometry = makeEngineGeometry(geometry);
      const transformBuffers: Buffer[] = [];
      const transforms: Float32Array[] = [];
      const attributes: Record<string, Buffer> = {};
      const bufferLayout = [];
      for (let columnIndex = 0; columnIndex < 4; columnIndex++) {
        const transformData = new Float32Array(placements.length * 4);
        const transformBuffer = this.device.createBuffer({
          id: `${surface.id}-deferred-instance-column-${columnIndex}`,
          data: transformData,
          usage: Buffer.VERTEX | Buffer.COPY_DST
        });
        const attributeName = `instanceModelMatrixCol${columnIndex}`;
        attributes[attributeName] = transformBuffer;
        bufferLayout.push({
          name: attributeName,
          format: 'float32x4',
          stepMode: 'instance'
        } as const);
        transformBuffers.push(transformBuffer);
        transforms.push(transformData);
      }

      const engineMaterial = this.materialFactory.createMaterial({
        id: `${material.id}-deferred-material`,
        bindings: makeMaterialBindings(material, this.fallbackTextures)
      });
      updateMaterial(engineMaterial, material);

      const model = new Model(this.device, {
        id: `${surface.id}-deferred-model`,
        source: ANARI_DEFERRED_WGSL_SHADER,
        modules: [anariMaterialModule],
        shaderInputs: new ShaderInputs({anariApp: anariAppModule}),
        material: engineMaterial,
        geometry: engineGeometry,
        attributes,
        bufferLayout,
        instanceCount: placements.length,
        colorAttachmentFormats: DEFERRED_COLOR_ATTACHMENT_FORMATS,
        depthStencilAttachmentFormat: 'depth24plus',
        parameters: {
          cullMode: 'none',
          depthWriteEnabled: true,
          depthCompare: 'less-equal',
          blend: getMaterialOpacity(material) < 1,
          blendColorSrcFactor: 'src-alpha',
          blendColorDstFactor: 'one-minus-src-alpha',
          blendAlphaSrcFactor: 'one',
          blendAlphaDstFactor: 'one-minus-src-alpha'
        }
      });

      compiledSurface = {
        surface,
        geometry,
        geometryVersion: geometry.version,
        materialVersion: material.version,
        placementCount: placements.length,
        model,
        material: engineMaterial,
        transformBuffers,
        transforms,
        triangleCount: (engineGeometry.indices?.value.length ?? engineGeometry.vertexCount) / 3,
        textureSignature: getMaterialTextureSignature(material)
      };
      frameResources.compiledSurfaces.set(surface.id, compiledSurface);
    }
    return compiledSurface;
  }
}

function getDeferredLights(
  lights: readonly Light[],
  viewMatrix: Readonly<Matrix4>
): {
  ambientColor: NumberArray3;
  directionalLightDirectionView: NumberArray3;
  directionalLightColor: NumberArray3;
  directionalLightIntensity: number;
  pointLights: DeferredPointLight[];
} {
  const ambientColor: NumberArray3 = [0, 0, 0];
  const directionalLightDirectionView: NumberArray3 = [0.3, 0.75, 0.55];
  const directionalLightColor: NumberArray3 = [1, 0.95, 0.86];
  let directionalLightIntensity = 0;
  const pointLights: DeferredPointLight[] = [];

  for (const light of lights) {
    const color = normalizeColor(light.color || [1, 1, 1]);
    const intensity = light.intensity ?? 1;
    switch (light.type) {
      case 'ambient':
        ambientColor[0] += color[0] * intensity;
        ambientColor[1] += color[1] * intensity;
        ambientColor[2] += color[2] * intensity;
        break;
      case 'directional': {
        const direction = normalizeVector(
          viewMatrix.transformAsVector(light.direction) as NumberArray3
        );
        directionalLightDirectionView[0] = -direction[0];
        directionalLightDirectionView[1] = -direction[1];
        directionalLightDirectionView[2] = -direction[2];
        directionalLightColor[0] = color[0];
        directionalLightColor[1] = color[1];
        directionalLightColor[2] = color[2];
        directionalLightIntensity = intensity;
        break;
      }
      case 'point':
      case 'spot':
        if (pointLights.length < MAX_DEFERRED_POINT_LIGHTS) {
          pointLights.push({
            position: viewMatrix.transformAsPoint(light.position) as [number, number, number],
            range: Math.max(4, Math.sqrt(Math.max(intensity, 0)) * 3),
            color,
            intensity
          });
        }
        break;
    }
  }

  return {
    ambientColor,
    directionalLightDirectionView,
    directionalLightColor,
    directionalLightIntensity,
    pointLights
  };
}

function normalizeColor(color: Readonly<NumberArray3>): [number, number, number] {
  const scale = color[0] > 1 || color[1] > 1 || color[2] > 1 ? 1 / 255 : 1;
  return [color[0] * scale, color[1] * scale, color[2] * scale];
}

function normalizeVector(vector: Readonly<NumberArray3>): NumberArray3 {
  const length = Math.hypot(vector[0], vector[1], vector[2]) || 1;
  return [vector[0] / length, vector[1] / length, vector[2] / length];
}

function destroyDeferredCompiledSurface(compiledSurface: DeferredCompiledSurface): void {
  compiledSurface.model.destroy();
  compiledSurface.material.destroy();
  for (const transformBuffer of compiledSurface.transformBuffers) {
    transformBuffer.destroy();
  }
}
