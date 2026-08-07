// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {type Device, type Framebuffer, Texture} from '@luma.gl/core';
import {
  bloomShaderPassPipeline,
  createCameraReprojectionTAAShaderPassPipeline
} from '@luma.gl/effects';
import {ShaderPassRenderer} from '@luma.gl/engine';
import {
  DeferredSceneRenderer,
  SceneRenderer,
  type SceneRenderOptions
} from '@luma.gl/experimental';
import {Matrix4, type NumericArray} from '@math.gl/core';
import type {ANARIFrame} from './anari-objects';
import type {ANARIRendererRuntime} from './anari-renderer-runtime';
import {ANARISceneAdapter, getFrameSize} from './anari-scene-adapter';
import type {ANARIFrameStatistics} from './anari-types';

type TemporalAntialiasingState = {
  frameIndex: number;
  previousViewProjectionMatrix: Matrix4 | null;
  previousViewMatrix: Matrix4 | null;
  previousProjectionMatrix: Matrix4 | null;
  previousJitter: [number, number];
  topologySignature: string | null;
};

type FrameResources = {
  framebuffer: Framebuffer | null;
  colorTexture: Texture | null;
  depthTexture: Texture | null;
  bloomRenderer: ShaderPassRenderer | null;
  temporalAntialiasingRenderer: ShaderPassRenderer | null;
  temporalAntialiasingState: TemporalAntialiasingState;
};

type TemporalAntialiasingFrame = {
  currentViewMatrix: Matrix4;
  currentProjectionMatrix: Matrix4;
  currentViewProjectionMatrix: Matrix4;
  previousViewProjectionMatrix: Matrix4;
  jitteredProjectionMatrix: Matrix4;
  currentJitter: [number, number];
  previousJitter: [number, number];
  topologySignature: string;
  resetHistory: boolean;
  nextFrameIndex: number;
};

const TEMPORAL_ANTIALIASING_SEQUENCE_LENGTH = 8;
const CAMERA_CUT_MATRIX_DIFFERENCE = 0.5;

/** Adapts ANARI handles and optional postprocessing into shared scene renderers. */
export class ANARIRenderingRuntime implements ANARIRendererRuntime {
  private readonly device: Device;
  private readonly adapter = new ANARISceneAdapter();
  private readonly renderer: SceneRenderer | DeferredSceneRenderer;
  private readonly frames = new Map<ANARIFrame, FrameResources>();

  constructor(device: Device, {deferred = false}: {deferred?: boolean} = {}) {
    this.device = device;
    this.renderer = deferred ? new DeferredSceneRenderer(device) : new SceneRenderer(device);
  }

  render(frame: ANARIFrame): ANARIFrameStatistics {
    const renderOptions = this.adapter.makeRenderOptions(frame);
    const renderer = frame.getParameter('renderer');
    if (!renderOptions || !renderer) {
      return {surfaceCount: 0, instanceCount: 0, drawCount: 0, triangleCount: 0};
    }

    const bloomIntensity =
      renderOptions.renderMode === 'default'
        ? (renderer.getParameter('bloomIntensity') ?? 0)
        : 0;
    const temporalAntialiasingEnabled =
      this.device.type === 'webgpu' &&
      renderOptions.renderMode === 'default' &&
      (renderer.getParameter('temporalAntialiasing') ?? true);
    const frameResources =
      temporalAntialiasingEnabled || bloomIntensity > 0 ? this.getFrameResources(frame) : null;
    let framebufferResized = false;
    let temporalAntialiasingFrame: TemporalAntialiasingFrame | null = null;

    if (frameResources) {
      const framebufferResult = this.getFramebuffer(
        frame,
        frameResources,
        temporalAntialiasingEnabled
      );
      renderOptions.framebuffer = framebufferResult.framebuffer;
      framebufferResized = framebufferResult.resized;
    }

    if (temporalAntialiasingEnabled && frameResources) {
      temporalAntialiasingFrame = prepareTemporalAntialiasingFrame(
        renderOptions,
        frameResources.temporalAntialiasingState,
        framebufferResized
      );
      renderOptions.camera = {
        ...renderOptions.camera,
        projectionMatrix: temporalAntialiasingFrame.jitteredProjectionMatrix
      };
    } else if (frameResources) {
      invalidateTemporalAntialiasingState(frameResources.temporalAntialiasingState);
    }

    const statistics = this.renderer.render(renderOptions);
    if (!frameResources || !renderOptions.framebuffer) {
      return statistics;
    }

    let presentationTexture = renderOptions.framebuffer.colorAttachments[0].texture;
    if (temporalAntialiasingFrame) {
      const temporalAntialiasingRenderer = this.getTemporalAntialiasingRenderer(frameResources);
      const [width, height] = getFrameSize(frame, this.device);
      temporalAntialiasingRenderer.resize([width, height]);
      const depthTexture = this.getTemporalAntialiasingDepthTexture(frame.id, frameResources);
      const temporalAntialiasingOptions = {
        sourceTexture: presentationTexture,
        bindings: {depthTexture},
        uniforms: {
          cameraReprojectionTaaResolve: {
            inverseViewProjectionMatrix: new Matrix4(
              temporalAntialiasingFrame.currentViewProjectionMatrix
            ).invert(),
            previousViewProjectionMatrix:
              temporalAntialiasingFrame.previousViewProjectionMatrix,
            currentJitter: temporalAntialiasingFrame.currentJitter,
            previousJitter: temporalAntialiasingFrame.previousJitter
          }
        },
        resetHistory: temporalAntialiasingFrame.resetHistory
      };

      if (bloomIntensity > 0) {
        const resolvedTexture = temporalAntialiasingRenderer.renderToTexture(
          temporalAntialiasingOptions
        );
        if (resolvedTexture) {
          presentationTexture = resolvedTexture;
        }
      } else {
        temporalAntialiasingRenderer.renderToScreen(temporalAntialiasingOptions);
      }
      commitTemporalAntialiasingFrame(
        frameResources.temporalAntialiasingState,
        temporalAntialiasingFrame
      );
    }

    if (bloomIntensity > 0) {
      const bloomRenderer = this.getBloomRenderer(frameResources);
      bloomRenderer.resize(getFrameSize(frame, this.device));
      bloomRenderer.renderToScreen({
        sourceTexture: presentationTexture,
        uniforms: {
          bloomExtract: {threshold: renderer.getParameter('bloomThreshold') ?? 0.62},
          bloomBlur: {radius: renderer.getParameter('bloomRadius') ?? 7},
          bloomComposite: {intensity: bloomIntensity}
        }
      });
    }

    return statistics;
  }

  destroyFrame(frame: ANARIFrame): void {
    this.renderer.destroyFrame(frame.id);
    const frameResources = this.frames.get(frame);
    if (!frameResources) {
      return;
    }

    frameResources.framebuffer?.destroy();
    frameResources.colorTexture?.destroy();
    frameResources.depthTexture?.destroy();
    frameResources.bloomRenderer?.destroy();
    frameResources.temporalAntialiasingRenderer?.destroy();
    this.frames.delete(frame);
  }

  destroy(): void {
    for (const frame of Array.from(this.frames.keys())) {
      this.destroyFrame(frame);
    }
    this.renderer.destroy();
    this.adapter.destroy();
  }

  private getFrameResources(frame: ANARIFrame): FrameResources {
    let frameResources = this.frames.get(frame);
    if (!frameResources) {
      frameResources = {
        framebuffer: null,
        colorTexture: null,
        depthTexture: null,
        bloomRenderer: null,
        temporalAntialiasingRenderer: null,
        temporalAntialiasingState: createTemporalAntialiasingState()
      };
      this.frames.set(frame, frameResources);
    }
    return frameResources;
  }

  private getFramebuffer(
    frame: ANARIFrame,
    frameResources: FrameResources,
    sampleableDepth: boolean
  ): {framebuffer: Framebuffer; resized: boolean} {
    const [width, height] = getFrameSize(frame, this.device);
    // Keep the raster path's existing canvas-referred color management. TAA history itself stays
    // rgba16float, but forcing the scene capture to float would skip the PBR presentation tone map.
    const colorFormat = this.device.preferredColorFormat;
    const needsReplacement =
      frameResources.framebuffer &&
      (frameResources.framebuffer.width !== width ||
        frameResources.framebuffer.height !== height ||
        frameResources.colorTexture?.format !== colorFormat ||
        Boolean(frameResources.depthTexture) !== sampleableDepth);
    if (needsReplacement) {
      destroyFramebufferResources(frameResources);
    }

    if (!frameResources.framebuffer) {
      frameResources.colorTexture = this.device.createTexture({
        id: `anari-${frame.id}-color-texture`,
        width,
        height,
        format: colorFormat,
        usage: Texture.RENDER_ATTACHMENT | Texture.SAMPLE
      });
      frameResources.depthTexture = sampleableDepth
        ? this.device.createTexture({
            id: `anari-${frame.id}-depth-texture`,
            width,
            height,
            format: 'depth24plus',
            usage: Texture.RENDER_ATTACHMENT | Texture.SAMPLE,
            sampler: {
              minFilter: 'nearest',
              magFilter: 'nearest',
              addressModeU: 'clamp-to-edge',
              addressModeV: 'clamp-to-edge'
            }
          })
        : null;
      frameResources.framebuffer = this.device.createFramebuffer({
        id: `anari-${frame.id}-color`,
        width,
        height,
        colorAttachments: [frameResources.colorTexture],
        depthStencilAttachment: frameResources.depthTexture || 'depth24plus'
      });
    }
    return {framebuffer: frameResources.framebuffer, resized: Boolean(needsReplacement)};
  }

  private getTemporalAntialiasingDepthTexture(
    frameIdentifier: string,
    frameResources: FrameResources
  ): Texture {
    if (this.renderer instanceof DeferredSceneRenderer) {
      const deferredDepthTexture = this.renderer.getLastDepthTexture(frameIdentifier);
      if (deferredDepthTexture) {
        return deferredDepthTexture;
      }
    }
    if (!frameResources.depthTexture) {
      throw new Error('ANARI temporal antialiasing requires a sampleable scene depth texture.');
    }
    return frameResources.depthTexture;
  }

  private getBloomRenderer(frameResources: FrameResources): ShaderPassRenderer {
    frameResources.bloomRenderer ||= new ShaderPassRenderer(this.device, {
      shaderPasses: [bloomShaderPassPipeline]
    });
    return frameResources.bloomRenderer;
  }

  private getTemporalAntialiasingRenderer(frameResources: FrameResources): ShaderPassRenderer {
    frameResources.temporalAntialiasingRenderer ||= new ShaderPassRenderer(this.device, {
      shaderPasses: [createCameraReprojectionTAAShaderPassPipeline()],
      colorFormat: 'rgba16float'
    });
    return frameResources.temporalAntialiasingRenderer;
  }
}

function createTemporalAntialiasingState(): TemporalAntialiasingState {
  return {
    frameIndex: 0,
    previousViewProjectionMatrix: null,
    previousViewMatrix: null,
    previousProjectionMatrix: null,
    previousJitter: [0, 0],
    topologySignature: null
  };
}

function invalidateTemporalAntialiasingState(state: TemporalAntialiasingState): void {
  state.frameIndex = 0;
  state.previousViewProjectionMatrix = null;
  state.previousViewMatrix = null;
  state.previousProjectionMatrix = null;
  state.previousJitter = [0, 0];
  state.topologySignature = null;
}

function prepareTemporalAntialiasingFrame(
  options: SceneRenderOptions,
  state: TemporalAntialiasingState,
  resized: boolean
): TemporalAntialiasingFrame {
  const currentViewMatrix = new Matrix4(options.camera.viewMatrix);
  const currentProjectionMatrix = new Matrix4(options.camera.projectionMatrix);
  const currentViewProjectionMatrix = new Matrix4(currentProjectionMatrix).multiplyRight(
    currentViewMatrix
  );
  const topologySignature = getSceneTopologySignature(options);
  const resetHistory =
    resized ||
    !state.previousViewProjectionMatrix ||
    state.topologySignature !== topologySignature ||
    hasCameraCut(state, currentViewMatrix, currentProjectionMatrix);
  const frameIndex = resetHistory ? 0 : state.frameIndex;
  const currentJitter = getTemporalAntialiasingJitter(
    frameIndex,
    options.width || 1,
    options.height || 1
  );

  return {
    currentViewMatrix,
    currentProjectionMatrix,
    currentViewProjectionMatrix,
    previousViewProjectionMatrix: resetHistory
      ? currentViewProjectionMatrix
      : state.previousViewProjectionMatrix!,
    jitteredProjectionMatrix: makeJitteredProjectionMatrix(
      currentProjectionMatrix,
      currentJitter
    ),
    currentJitter,
    previousJitter: resetHistory ? currentJitter : state.previousJitter,
    topologySignature,
    resetHistory,
    nextFrameIndex: (frameIndex + 1) % TEMPORAL_ANTIALIASING_SEQUENCE_LENGTH
  };
}

function commitTemporalAntialiasingFrame(
  state: TemporalAntialiasingState,
  frame: TemporalAntialiasingFrame
): void {
  state.frameIndex = frame.nextFrameIndex;
  state.previousViewProjectionMatrix = frame.currentViewProjectionMatrix;
  state.previousViewMatrix = frame.currentViewMatrix;
  state.previousProjectionMatrix = frame.currentProjectionMatrix;
  state.previousJitter = frame.currentJitter;
  state.topologySignature = frame.topologySignature;
}

function hasCameraCut(
  state: TemporalAntialiasingState,
  currentViewMatrix: Matrix4,
  currentProjectionMatrix: Matrix4
): boolean {
  return (
    (state.previousViewMatrix !== null &&
      getMaximumMatrixDifference(state.previousViewMatrix, currentViewMatrix) >
        CAMERA_CUT_MATRIX_DIFFERENCE) ||
    (state.previousProjectionMatrix !== null &&
      getMaximumMatrixDifference(state.previousProjectionMatrix, currentProjectionMatrix) >
        CAMERA_CUT_MATRIX_DIFFERENCE)
  );
}

function getMaximumMatrixDifference(
  firstMatrix: Readonly<NumericArray>,
  secondMatrix: Readonly<NumericArray>
): number {
  let maximumDifference = 0;
  for (let index = 0; index < 16; index++) {
    maximumDifference = Math.max(
      maximumDifference,
      Math.abs((firstMatrix[index] || 0) - (secondMatrix[index] || 0))
    );
  }
  return maximumDifference;
}

function getSceneTopologySignature(options: SceneRenderOptions): string {
  return options.surfaces
    .map(
      surface =>
        `${surface.id}:${surface.geometryVersion ?? 0}:${surface.material.id}:${surface.material.version ?? 0}:${surface.transforms.length}:${surface.instanceIds?.join(',') || ''}`
    )
    .sort()
    .join('|');
}

/** @internal Returns the centered Halton jitter in texture-coordinate units. */
export function getTemporalAntialiasingJitter(
  frameIndex: number,
  width: number,
  height: number
): [number, number] {
  const sequenceIndex = (frameIndex % TEMPORAL_ANTIALIASING_SEQUENCE_LENGTH) + 1;
  return [
    (getHaltonValue(sequenceIndex, 2) - 0.5) / Math.max(width, 1),
    (getHaltonValue(sequenceIndex, 3) - 0.5) / Math.max(height, 1)
  ];
}

/** @internal Applies a UV-space projection jitter without mutating the caller's matrix. */
export function makeJitteredProjectionMatrix(
  projectionMatrix: Readonly<NumericArray>,
  jitter: readonly [number, number]
): Matrix4 {
  const jitteredProjectionMatrix = new Matrix4(projectionMatrix);
  const normalizedDeviceCoordinateOffsetX = jitter[0] * 2;
  const normalizedDeviceCoordinateOffsetY = jitter[1] * -2;
  for (let columnIndex = 0; columnIndex < 4; columnIndex++) {
    const columnOffset = columnIndex * 4;
    const clipWCoefficient = jitteredProjectionMatrix[columnOffset + 3];
    jitteredProjectionMatrix[columnOffset] +=
      normalizedDeviceCoordinateOffsetX * clipWCoefficient;
    jitteredProjectionMatrix[columnOffset + 1] +=
      normalizedDeviceCoordinateOffsetY * clipWCoefficient;
  }
  return jitteredProjectionMatrix;
}

function getHaltonValue(index: number, base: number): number {
  let result = 0;
  let fraction = 1;
  let quotient = index;
  while (quotient > 0) {
    fraction /= base;
    result += fraction * (quotient % base);
    quotient = Math.floor(quotient / base);
  }
  return result;
}

function destroyFramebufferResources(frameResources: FrameResources): void {
  frameResources.framebuffer?.destroy();
  frameResources.colorTexture?.destroy();
  frameResources.depthTexture?.destroy();
  frameResources.framebuffer = null;
  frameResources.colorTexture = null;
  frameResources.depthTexture = null;
}
