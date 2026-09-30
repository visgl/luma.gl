// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Effect, EffectContext, PostRenderOptions, PreRenderOptions} from '@deck.gl/core';
import type {Device, Framebuffer, Texture} from '@luma.gl/core';
import {BackgroundTextureModel, ShaderPassRenderer} from '@luma.gl/engine';
import {
  ssrTrace,
  ssrSpatial,
  ssrComposite,
  ssrCameraTemporal,
  ssrCameraDepthHistoryCopy,
  ssrNormalHistoryCopy
} from '@luma.gl/effects';
import {Matrix4} from '@math.gl/core';
import type {SceneBufferEffect} from '@deck.gl-community/gpu-layers';

/** Final reflection composite consuming the shared capture for this single-view fixture. */
export class RiverReflectionEffect implements Effect {
  readonly id = 'city-river-reflections';
  readonly props = {};
  readonly useInPicking = false;
  frameCount = 0;
  debugMode = 0;
  historyFrames = 0;
  private previousViewProjection: Matrix4 | null = null;
  private previousView: Matrix4 | null = null;
  private previousInverseProjection: Matrix4 | null = null;
  private device: Device | null = null;
  private renderer: ShaderPassRenderer | null = null;
  private capturedColor: Texture | null = null;
  private presenter: BackgroundTextureModel | null = null;

  constructor(readonly capture: SceneBufferEffect) {}

  setup({device}: EffectContext): void {
    this.device = device;
    // Geometry is static; camera reprojection validates depth and animated water normals.
    this.renderer = new ShaderPassRenderer(device, {
      shaderPasses: [
        {
          name: 'cityWaterReflections',
          renderTargets: {
            reflectionRaw: {format: 'rgba16float', scale: [0.5, 0.5]},
            reflectionHistory: {
              format: 'rgba16float',
              scale: [0.5, 0.5],
              lifetime: 'history',
              initialize: {clearColor: [0, 0, 0, 0]}
            },
            depthHistory: {
              format: 'rgba8unorm',
              lifetime: 'history',
              initialize: {clearColor: [1, 1, 1, 1]}
            },
            normalHistory: {
              format: 'rgba8unorm',
              lifetime: 'history',
              initialize: {clearColor: [0.5, 0.5, 1, 1]}
            },
            reflectionScratch: {format: 'rgba16float', scale: [0.5, 0.5]},
            reflectionFiltered: {format: 'rgba16float', scale: [0.5, 0.5]}
          },
          steps: [
            {shaderPass: ssrTrace, inputs: {sourceTexture: 'previous'}, output: 'reflectionRaw'},
            {
              shaderPass: ssrCameraTemporal,
              inputs: {
                sourceTexture: 'reflectionRaw',
                historyTexture: 'reflectionHistory',
                previousDepthTexture: 'depthHistory',
                previousNormalTexture: 'normalHistory'
              },
              output: 'reflectionHistory'
            },
            {
              shaderPass: ssrCameraDepthHistoryCopy,
              inputs: {sourceTexture: 'previous'},
              output: 'depthHistory'
            },
            {
              shaderPass: ssrNormalHistoryCopy,
              inputs: {sourceTexture: 'previous'},
              output: 'normalHistory'
            },
            {
              shaderPass: ssrSpatial,
              inputs: {sourceTexture: 'reflectionHistory'},
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
    const frame = this.capture.getFrame(viewport.id);
    if (!frame) return options.inputBuffer;
    const {buffer} = frame;
    const {width, height} = buffer;
    if (this.capturedColor !== buffer.colorTexture) {
      this.capturedColor = buffer.colorTexture;
      renderer.resize([width, height]);
      this.resetHistory();
    }
    const commandEncoder = device.commandEncoder;
    const viewRect: [number, number, number, number] = [0, 0, width, height];

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
    const clipDepthConversion = new Matrix4([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.5, 0, 0, 0, 0.5, 1]);
    const viewProjection = new Matrix4(clipDepthConversion).multiplyRight(
      viewport.viewProjectionMatrix
    );
    const currentClipToPreviousClip = this.previousViewProjection
      ? new Matrix4(this.previousViewProjection).multiplyRight(new Matrix4(viewProjection).invert())
      : new Matrix4();
    // Large camera changes have little overlapping history. Reset instead of leaving stale radiance.
    if (
      currentClipToPreviousClip.some(
        (value, index) => Math.abs(value - (index % 5 === 0 ? 1 : 0)) > 0.5
      )
    ) {
      this.resetHistory();
    }
    const outputTexture = renderer.renderToTexture({
      sourceTexture: buffer.colorTexture,
      bindings: {depthTexture: buffer.depthTexture, normalTexture: buffer.normalRoughnessTexture},
      uniforms: {
        ssrTrace: {
          projectionMatrix,
          inverseProjectionMatrix,
          intensity: 1.5,
          maxDistance: 450,
          thickness: 1.5,
          sampleCount: 96,
          maxRoughness: 0.8,
          frameIndex: this.historyFrames
        },
        ssrCameraTemporal: {
          currentClipToPreviousClip,
          currentViewToPreviousView: this.previousView
            ? new Matrix4(this.previousView).multiplyRight(new Matrix4(viewMatrix).invert())
            : new Matrix4(),
          previousInverseProjectionMatrix:
            this.previousInverseProjection ?? inverseProjectionMatrix,
          historyWeight: this.historyFrames ? 0.8 : 0,
          depthThreshold: 0.01,
          normalThreshold: 0.96
        },
        ssrSpatial: {inverseProjectionMatrix, maxRadius: 2},
        ssrComposite: {inverseProjectionMatrix, strength: 1, debugMode: this.debugMode}
      }
    });
    if (!outputTexture) return options.inputBuffer;
    this.frameCount++;
    this.historyFrames++;
    this.previousViewProjection = viewProjection;
    this.previousView = new Matrix4(viewMatrix);
    this.previousInverseProjection = inverseProjectionMatrix;
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

  resetHistory(): void {
    this.renderer?.resetHistory();
    this.historyFrames = 0;
    this.previousViewProjection = null;
    this.previousView = null;
    this.previousInverseProjection = null;
  }

  cleanup(): void {
    this.resetHistory();
    this.renderer?.destroy();
    this.presenter?.destroy();
    this.capturedColor = null;
    this.renderer = null;
    this.presenter = null;
    this.device = null;
  }
}
