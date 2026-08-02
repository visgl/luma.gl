// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  Buffer,
  type CommandEncoder,
  type Device,
  type Framebuffer,
  type Sampler,
  Texture
} from '@luma.gl/core';
import {createBloomShaderPassPipeline, toneMapping} from '@luma.gl/effects';
import {CubeGeometry, Model, ShaderInputs, ShaderPassRenderer} from '@luma.gl/engine';
import type {VolumetricFireSimulation} from '@luma.gl/experimental';
import {Matrix4, type NumberArray3} from '@math.gl/core';
import {
  VOLUMETRIC_FIRE_FORGE_BOXES,
  VOLUMETRIC_FIRE_FORGE_VOLUME_BOUNDS
} from './volumetric-fire-forge-scene';
import {
  createVolumetricFireCompositeShaderPassPipeline,
  forgeSceneUniforms,
  FORGE_SCENE_SHADER,
  getVolumetricFireDebugMode,
  type VolumetricFireDebugView
} from './volumetric-fire-forge-shaders';

export type VolumetricFireForgeRenderSettings = {
  debugView: VolumetricFireDebugView;
  sampleCount: number;
  densityAbsorption: number;
  emissionStrength: number;
  smokeScattering: number;
  shadowStrength: number;
  exposure: number;
  bloomThreshold: number;
  bloomIntensity: number;
  bloomRadius: number;
};

export type VolumetricFireForgeRenderOptions = {
  commandEncoder: CommandEncoder;
  simulation: VolumetricFireSimulation;
  viewProjectionMatrix: Matrix4;
  inverseViewProjectionMatrix: Matrix4;
  cameraPosition: Readonly<NumberArray3>;
  time: number;
  frameIndex: number;
  settings: VolumetricFireForgeRenderSettings;
};

type SceneTargets = {
  framebuffer: Framebuffer;
  colorTexture: Texture;
  depthTexture: Texture;
};

/** Owns the opaque HDR forge, depth-aware volume compositor, bloom, and fixed tone map. */
export class VolumetricFireForgeRenderer {
  readonly device: Device;
  readonly sceneColorFormat: 'rgba8unorm' | 'rgba16float';
  readonly sceneModel: Model;
  readonly volumeRenderer: ShaderPassRenderer;
  readonly postprocessingRenderer: ShaderPassRenderer;
  readonly volumeSampler: Sampler;

  sceneFramebuffer: Framebuffer;
  sceneColorTexture: Texture;
  sceneDepthTexture: Texture;
  framebufferSize: [number, number];

  private readonly instanceBuffers: Buffer[];
  private readonly worldToVolumeMatrix: Matrix4;

  constructor(device: Device, width: number, height: number) {
    if (device.type !== 'webgpu') {
      throw new Error('Volumetric Fire Forge requires WebGPU.');
    }
    this.device = device;
    this.sceneColorFormat = getVolumetricFireForgeColorFormat(device);
    this.framebufferSize = [Math.max(width, 1), Math.max(height, 1)];
    let sceneTargets: SceneTargets | undefined;
    const instanceBuffers: Buffer[] = [];
    let sceneModel: Model | undefined;
    let volumeRenderer: ShaderPassRenderer | undefined;
    let volumeSampler: Sampler | undefined;
    let postprocessingRenderer: ShaderPassRenderer | undefined;
    try {
      sceneTargets = createSceneTargets(
        device,
        this.sceneColorFormat,
        this.framebufferSize[0],
        this.framebufferSize[1]
      );
      const instanceData = makeForgeInstanceData();
      instanceBuffers.push(
        createVertexBuffer(device, 'forge-box-positions', instanceData.positions)
      );
      instanceBuffers.push(
        createVertexBuffer(device, 'forge-box-half-sizes', instanceData.halfSizes)
      );
      instanceBuffers.push(createVertexBuffer(device, 'forge-box-colors', instanceData.baseColors));
      instanceBuffers.push(
        createVertexBuffer(device, 'forge-box-materials', instanceData.materials)
      );
      instanceBuffers.push(
        createVertexBuffer(device, 'forge-box-emissive-colors', instanceData.emissiveColors)
      );
      sceneModel = new Model(device, {
        id: 'volumetric-fire-forge-scene',
        source: FORGE_SCENE_SHADER,
        geometry: new CubeGeometry({id: 'volumetric-fire-forge-box', indices: true}),
        instanceCount: VOLUMETRIC_FIRE_FORGE_BOXES.length,
        shaderInputs: new ShaderInputs({forgeScene: forgeSceneUniforms}),
        bufferLayout: [
          {name: 'instancePositions', format: 'float32x3'},
          {name: 'instanceHalfSizes', format: 'float32x3'},
          {name: 'instanceBaseColors', format: 'float32x3'},
          {name: 'instanceMaterials', format: 'float32x4'},
          {name: 'instanceEmissiveColors', format: 'float32x3'}
        ],
        attributes: {
          instancePositions: instanceBuffers[0],
          instanceHalfSizes: instanceBuffers[1],
          instanceBaseColors: instanceBuffers[2],
          instanceMaterials: instanceBuffers[3],
          instanceEmissiveColors: instanceBuffers[4]
        },
        colorAttachmentFormats: [this.sceneColorFormat],
        depthStencilAttachmentFormat: 'depth24plus',
        parameters: {
          cullMode: 'back',
          depthCompare: 'less-equal',
          depthWriteEnabled: true
        }
      });
      volumeRenderer = new ShaderPassRenderer(device, {
        shaderPasses: [createVolumetricFireCompositeShaderPassPipeline()],
        colorFormat: this.sceneColorFormat
      });
      volumeSampler = device.createSampler({
        id: 'volumetric-fire-forge-volume-sampler',
        minFilter: 'linear',
        magFilter: 'linear',
        addressModeU: 'clamp-to-edge',
        addressModeV: 'clamp-to-edge',
        addressModeW: 'clamp-to-edge'
      });
      postprocessingRenderer = new ShaderPassRenderer(device, {
        shaderPasses: [
          createBloomShaderPassPipeline({colorFormat: this.sceneColorFormat}),
          toneMapping
        ],
        colorFormat: this.sceneColorFormat
      });
      volumeRenderer.resize(this.framebufferSize);
      postprocessingRenderer.resize(this.framebufferSize);
    } catch (error) {
      postprocessingRenderer?.destroy();
      volumeSampler?.destroy();
      volumeRenderer?.destroy();
      sceneModel?.destroy();
      for (const buffer of instanceBuffers.reverse()) {
        buffer.destroy();
      }
      if (sceneTargets) {
        destroySceneTargets(sceneTargets);
      }
      throw error;
    }

    // Every handle is assigned inside the guarded allocation block or construction rethrows.
    this.sceneFramebuffer = sceneTargets!.framebuffer;
    this.sceneColorTexture = sceneTargets!.colorTexture;
    this.sceneDepthTexture = sceneTargets!.depthTexture;
    this.instanceBuffers = instanceBuffers;
    this.sceneModel = sceneModel!;
    this.volumeRenderer = volumeRenderer!;
    this.volumeSampler = volumeSampler!;
    this.postprocessingRenderer = postprocessingRenderer!;
    this.worldToVolumeMatrix = makeWorldToVolumeMatrix();
  }

  resize(width: number, height: number): void {
    const nextSize: [number, number] = [Math.max(width, 1), Math.max(height, 1)];
    if (nextSize[0] === this.framebufferSize[0] && nextSize[1] === this.framebufferSize[1]) {
      return;
    }

    const previousTargets: SceneTargets = {
      framebuffer: this.sceneFramebuffer,
      colorTexture: this.sceneColorTexture,
      depthTexture: this.sceneDepthTexture
    };
    const nextTargets = createSceneTargets(
      this.device,
      this.sceneColorFormat,
      nextSize[0],
      nextSize[1]
    );
    this.sceneFramebuffer = nextTargets.framebuffer;
    this.sceneColorTexture = nextTargets.colorTexture;
    this.sceneDepthTexture = nextTargets.depthTexture;
    this.framebufferSize = nextSize;
    this.volumeRenderer.resize(nextSize);
    this.postprocessingRenderer.resize(nextSize);
    destroySceneTargets(previousTargets);
  }

  render(options: VolumetricFireForgeRenderOptions): Texture | null {
    const {commandEncoder, settings} = options;
    this.sceneModel.shaderInputs.setProps({
      forgeScene: {
        viewProjectionMatrix: options.viewProjectionMatrix,
        cameraPosition: options.cameraPosition,
        emitterPosition: [0, 1.5, 0.25],
        time: options.time
      }
    });
    this.sceneModel.predraw(commandEncoder);
    const sceneRenderPass = commandEncoder.beginRenderPass({
      id: 'volumetric-fire-forge-opaque-scene',
      framebuffer: this.sceneFramebuffer,
      clearColor: [0.0012, 0.0016, 0.0025, 1],
      clearDepth: 1
    });
    this.sceneModel.draw(sceneRenderPass);
    sceneRenderPass.end();

    const volumeTexture = this.volumeRenderer.encodeToTexture(commandEncoder, {
      sourceTexture: this.sceneColorTexture,
      bindings: {
        combustionTexture: options.simulation.combustionTexture,
        velocityTexture: options.simulation.velocityTexture,
        obstacleTexture: options.simulation.obstacleTexture,
        depthTexture: this.sceneDepthTexture,
        volumeSampler: this.volumeSampler
      },
      uniforms: {
        volumetricFireComposite: {
          inverseViewProjectionMatrix: options.inverseViewProjectionMatrix,
          worldToVolumeMatrix: this.worldToVolumeMatrix,
          volumeDimensions: options.simulation.dimensions,
          lightDirectionWorld: [0.36, 0.88, 0.3],
          sampleCount: Math.round(settings.sampleCount),
          densityAbsorption: settings.densityAbsorption,
          emissionStrength: settings.emissionStrength,
          smokeScattering: settings.smokeScattering,
          shadowStrength: settings.shadowStrength,
          frameIndex: options.frameIndex,
          time: options.time,
          debugMode: getVolumetricFireDebugMode(settings.debugView)
        }
      }
    });
    if (!volumeTexture) {
      return null;
    }

    const didPresent = this.postprocessingRenderer.encodeToScreen(commandEncoder, {
      sourceTexture: volumeTexture,
      uniforms: {
        bloomExtract: {threshold: settings.bloomThreshold},
        bloomBlur: {radius: settings.bloomRadius},
        bloomComposite: {
          intensity: settings.debugView === 'Final' ? settings.bloomIntensity : 0
        },
        toneMapping: {
          exposure: settings.exposure,
          maximumLuminance: this.device.preferredColorFormat === 'rgba16float' ? 3.5 : 1
        }
      }
    });
    return didPresent ? volumeTexture : null;
  }

  destroy(): void {
    this.sceneModel.destroy();
    for (const buffer of this.instanceBuffers) {
      buffer.destroy();
    }
    this.volumeRenderer.destroy();
    this.postprocessingRenderer.destroy();
    this.volumeSampler.destroy();
    destroySceneTargets({
      framebuffer: this.sceneFramebuffer,
      colorTexture: this.sceneColorTexture,
      depthTexture: this.sceneDepthTexture
    });
  }
}

export function getVolumetricFireForgeColorFormat(device: Device): 'rgba8unorm' | 'rgba16float' {
  const highDynamicRangeCapabilities = device.getTextureFormatCapabilities('rgba16float');
  return highDynamicRangeCapabilities.render && highDynamicRangeCapabilities.filter
    ? 'rgba16float'
    : 'rgba8unorm';
}

function createSceneTargets(
  device: Device,
  colorFormat: 'rgba8unorm' | 'rgba16float',
  width: number,
  height: number
): SceneTargets {
  let colorTexture: Texture | undefined;
  let depthTexture: Texture | undefined;
  try {
    colorTexture = device.createTexture({
      id: 'volumetric-fire-forge-scene-color',
      width,
      height,
      format: colorFormat,
      usage: Texture.RENDER | Texture.SAMPLE,
      sampler: {minFilter: 'linear', magFilter: 'linear'}
    });
    depthTexture = device.createTexture({
      id: 'volumetric-fire-forge-scene-depth',
      width,
      height,
      format: 'depth24plus',
      usage: Texture.RENDER | Texture.SAMPLE
    });
    const framebuffer = device.createFramebuffer({
      id: 'volumetric-fire-forge-scene-framebuffer',
      width,
      height,
      colorAttachments: [colorTexture],
      depthStencilAttachment: depthTexture
    });
    return {framebuffer, colorTexture, depthTexture};
  } catch (error) {
    colorTexture?.destroy();
    depthTexture?.destroy();
    throw error;
  }
}

function destroySceneTargets(targets: SceneTargets): void {
  targets.framebuffer.destroy();
  targets.colorTexture.destroy();
  targets.depthTexture.destroy();
}

function createVertexBuffer(device: Device, id: string, data: Float32Array): Buffer {
  return device.createBuffer({id, data, usage: Buffer.VERTEX});
}

function makeForgeInstanceData(): {
  positions: Float32Array;
  halfSizes: Float32Array;
  baseColors: Float32Array;
  materials: Float32Array;
  emissiveColors: Float32Array;
} {
  return {
    positions: new Float32Array(VOLUMETRIC_FIRE_FORGE_BOXES.flatMap(box => box.center)),
    halfSizes: new Float32Array(VOLUMETRIC_FIRE_FORGE_BOXES.flatMap(box => box.halfSize)),
    baseColors: new Float32Array(VOLUMETRIC_FIRE_FORGE_BOXES.flatMap(box => box.color)),
    materials: new Float32Array(
      VOLUMETRIC_FIRE_FORGE_BOXES.flatMap(box => [
        box.roughness,
        box.metallic,
        box.emissiveTopOnly ? 1 : 0,
        box.surfaceTreatment === 'refractory-masonry' ? 1 : 0
      ])
    ),
    emissiveColors: new Float32Array(VOLUMETRIC_FIRE_FORGE_BOXES.flatMap(box => box.emissiveColor))
  };
}

function makeWorldToVolumeMatrix(): Matrix4 {
  const {minimum, maximum} = VOLUMETRIC_FIRE_FORGE_VOLUME_BOUNDS;
  const scaleX = 1 / (maximum[0] - minimum[0]);
  const scaleY = 1 / (maximum[1] - minimum[1]);
  const scaleZ = 1 / (maximum[2] - minimum[2]);
  return new Matrix4([
    scaleX,
    0,
    0,
    0,
    0,
    scaleY,
    0,
    0,
    0,
    0,
    scaleZ,
    0,
    -minimum[0] * scaleX,
    -minimum[1] * scaleY,
    -minimum[2] * scaleZ,
    1
  ]);
}
