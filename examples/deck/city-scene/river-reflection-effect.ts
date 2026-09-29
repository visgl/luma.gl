// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Effect, EffectContext, PostRenderOptions, PreRenderOptions} from '@deck.gl/core';
import {type Device, type Framebuffer, Texture} from '@luma.gl/core';
import {BackgroundTextureModel, ShaderPassRenderer} from '@luma.gl/engine';
import {ssrTrace, ssrSpatial, ssrComposite} from '@luma.gl/effects';
import {Matrix4} from '@math.gl/core';
import {WaterSurfaceLayer} from '@deck.gl-community/gpu-layers';
import {CityMeshLayer} from './city-mesh-layer';

/** Opt-in auxiliary passes for this single-view, opaque city fixture. */
export class RiverReflectionEffect implements Effect {
  readonly id = 'city-river-reflections';
  readonly props = {};
  readonly useInPicking = false;
  frameCount = 0;
  debugMode = 0;
  private device: Device | null = null;
  private renderer: ShaderPassRenderer | null = null;
  private sceneFramebuffer: Framebuffer | null = null;
  private normalFramebuffer: Framebuffer | null = null;
  private colorTexture: Texture | null = null;
  private depthTexture: Texture | null = null;
  private normalTexture: Texture | null = null;
  private presenter: BackgroundTextureModel | null = null;

  setup({device}: EffectContext): void {
    this.device = device;
    // Reuse the shared tracer and spatial filters. This fixture has no motion buffer;
    // omit temporal accumulation rather than reprojecting with incorrect velocities.
    this.renderer = new ShaderPassRenderer(device, {
      shaderPasses: [
        {
          name: 'cityWaterReflections',
          renderTargets: {
            reflectionRaw: {format: 'rgba16float', scale: [0.5, 0.5]},
            reflectionScratch: {format: 'rgba16float', scale: [0.5, 0.5]},
            reflectionFiltered: {format: 'rgba16float', scale: [0.5, 0.5]}
          },
          steps: [
            {shaderPass: ssrTrace, inputs: {sourceTexture: 'previous'}, output: 'reflectionRaw'},
            {
              shaderPass: ssrSpatial,
              inputs: {sourceTexture: 'reflectionRaw'},
              output: 'reflectionScratch',
              uniforms: {direction: [1, 0]}
            },
            {
              shaderPass: ssrSpatial,
              inputs: {sourceTexture: 'reflectionScratch'},
              output: 'reflectionFiltered',
              uniforms: {direction: [0, 1]}
            },
            {
              shaderPass: ssrComposite,
              inputs: {sourceTexture: 'previous', reflectionTexture: 'reflectionFiltered'},
              output: 'previous'
            }
          ]
        }
      ],
      colorFormat: 'rgba16float',
      flipY: true
    });
  }

  preRender(_options: PreRenderOptions): void {}

  postRender(options: PostRenderOptions): Framebuffer {
    const device = this.device!;
    const renderer = this.renderer!;
    const viewport = options.viewports[0];
    if (!viewport) return options.inputBuffer;
    const {width, height} = options.inputBuffer;
    if (this.sceneFramebuffer?.width !== width || this.sceneFramebuffer?.height !== height) {
      this.destroyBuffers();
      this.createBuffers(width, height);
      renderer.resize([width, height]);
    }
    const layers = options.layers.filter(
      layer =>
        layer.props.visible &&
        (layer instanceof CityMeshLayer || layer instanceof WaterSurfaceLayer)
    );
    const models = layers.flatMap(layer => layer.getModels());
    const commandEncoder = device.commandEncoder;
    const parameters = models.map(model => ({...model.parameters}));
    const viewRect: [number, number, number, number] = [0, 0, width, height];

    // Deck's postprocess input has no depth attachment. Re-render the participating
    // opaque layers so both the color source and ray-hit depth preserve occlusion.
    for (const layer of layers) layer.setShaderModuleProps({surfaceBuffer: {enabled: 0}});
    for (const model of models) {
      model.setParameters({
        ...model.parameters,
        blend: false,
        blendColorSrcFactor: 'one',
        blendColorDstFactor: 'zero',
        blendAlphaSrcFactor: 'one',
        blendAlphaDstFactor: 'zero',
        depthWriteEnabled: true,
        depthCompare: 'less-equal'
      });
      model.predraw(commandEncoder);
    }
    const scenePass = commandEncoder.beginRenderPass({
      id: 'city-reflection-scene',
      framebuffer: this.sceneFramebuffer!,
      parameters: {viewport: viewRect},
      clearColor: [0, 0, 0, 0],
      clearDepth: 1
    });
    for (const model of models) model.draw(scenePass);
    scenePass.end();

    // Buildings supply hit normals with roughness 1; only water starts reflection rays.
    for (const layer of layers) {
      layer.setShaderModuleProps({surfaceBuffer: {enabled: 1, viewMatrix: viewport.viewMatrix}});
    }
    for (const model of models) model.predraw(commandEncoder);
    const normalPass = commandEncoder.beginRenderPass({
      id: 'city-reflection-normals',
      framebuffer: this.normalFramebuffer!,
      parameters: {viewport: viewRect},
      clearColor: [0.5, 0.5, 1, 1],
      clearDepth: false
    });
    for (const model of models) model.draw(normalPass);
    normalPass.end();
    for (const layer of layers) layer.setShaderModuleProps({surfaceBuffer: {enabled: 0}});
    models.forEach((model, index) => model.setParameters(parameters[index]));

    // Deck stores OpenGL clip depth and normalizes view distances by viewport size.
    // The shared SSR tracer expects WebGPU clip depth and metre-sized view positions.
    const viewMatrix = viewport.viewMatrix;
    const viewUnitsPerMeter =
      viewport.distanceScales.unitsPerMeter[2] *
      Math.hypot(viewMatrix[8], viewMatrix[9], viewMatrix[10]);
    const projectionMatrix = new Matrix4([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.5, 0, 0, 0, 0.5, 1])
      .multiplyRight(viewport.projectionMatrix)
      .scale(viewUnitsPerMeter);
    const inverseProjectionMatrix = new Matrix4(projectionMatrix).invert();
    const outputTexture = renderer.renderToTexture({
      sourceTexture: this.colorTexture!,
      bindings: {depthTexture: this.depthTexture!, normalTexture: this.normalTexture!},
      uniforms: {
        ssrTrace: {
          projectionMatrix,
          inverseProjectionMatrix,
          intensity: 1.5,
          maxDistance: 450,
          thickness: 1.5,
          sampleCount: 96,
          maxRoughness: 0.8,
          frameIndex: 0
        },
        ssrSpatial: {inverseProjectionMatrix, maxRadius: 2},
        ssrComposite: {inverseProjectionMatrix, strength: 1, debugMode: this.debugMode}
      }
    });
    if (!outputTexture) return options.inputBuffer;
    this.frameCount++;
    this.presenter ??= new BackgroundTextureModel(device, {
      id: 'city-reflection-presenter',
      backgroundTexture: outputTexture,
      flipY: true
    });
    this.presenter.setProps({backgroundTexture: outputTexture});
    this.presenter.predraw(commandEncoder);
    // This example installs one final postprocess effect. Single-canvas Deck does not
    // pass a target here, so resolve the current canvas explicitly.
    const outputFramebuffer = options.target ?? device.getCanvasContext().getCurrentFramebuffer();
    const compositePass = commandEncoder.beginRenderPass({
      id: 'city-reflection-composite',
      framebuffer: outputFramebuffer,
      parameters: {viewport: viewRect},
      clearColor: false,
      clearDepth: false
    });
    this.presenter.draw(compositePass);
    compositePass.end();
    // This Deck version submits its WebGPU layer pass before postRender runs.
    // Submit the final effect here so the current canvas texture is presented this frame.
    device.submit();
    return outputFramebuffer;
  }

  cleanup(): void {
    this.renderer?.destroy();
    this.presenter?.destroy();
    this.destroyBuffers();
    this.renderer = null;
    this.presenter = null;
    this.device = null;
  }

  private createBuffers(width: number, height: number): void {
    const device = this.device!;
    const textureProps = {width, height, usage: Texture.RENDER | Texture.SAMPLE};
    this.colorTexture = device.createTexture({
      ...textureProps,
      id: 'city-reflection-color',
      format: 'rgba8unorm'
    });
    this.depthTexture = device.createTexture({
      ...textureProps,
      id: 'city-reflection-depth',
      format: 'depth24plus'
    });
    this.normalTexture = device.createTexture({
      ...textureProps,
      id: 'city-reflection-normal',
      format: 'rgba8unorm'
    });
    this.sceneFramebuffer = device.createFramebuffer({
      id: 'city-reflection-scene',
      width,
      height,
      colorAttachments: [this.colorTexture],
      depthStencilAttachment: this.depthTexture
    });
    this.normalFramebuffer = device.createFramebuffer({
      id: 'city-reflection-normal',
      width,
      height,
      colorAttachments: [this.normalTexture],
      depthStencilAttachment: this.depthTexture
    });
  }

  private destroyBuffers(): void {
    this.sceneFramebuffer?.destroy();
    this.normalFramebuffer?.destroy();
    this.colorTexture?.destroy();
    this.depthTexture?.destroy();
    this.normalTexture?.destroy();
    this.sceneFramebuffer = null;
    this.normalFramebuffer = null;
    this.colorTexture = null;
    this.depthTexture = null;
    this.normalTexture = null;
  }
}
