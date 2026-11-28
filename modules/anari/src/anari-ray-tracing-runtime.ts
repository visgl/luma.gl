// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {
  exportRayTracingImage,
  exportRayTracingRadiance,
  RayTracingSceneRenderer,
  type RayTracingImageExportOptions,
  type RayTracingImageTile,
  type RayTracingSceneRenderOptions
} from './renderers';
import type {ANARIFrame} from './anari-objects';
import type {ANARIRendererRuntime} from './anari-renderer-runtime';
import {ANARISceneAdapter} from './anari-scene-adapter';
import type {
  ANARIFrameStatistics,
  ANARIPickResult,
  ANARIFrameChannels,
  ANARIFrameRadiance
} from './anari-types';

/** Adapts retained ANARI objects into the reusable shared ray-tracing scene renderer. */
export class ANARIRayTracingRuntime implements ANARIRendererRuntime {
  private readonly adapter = new ANARISceneAdapter();
  private readonly renderer: RayTracingSceneRenderer;
  private readonly framePlacements = new Map<
    string,
    ReturnType<ANARISceneAdapter['getPickPlacements']>
  >();

  constructor(device: Device) {
    this.renderer = new RayTracingSceneRenderer(device);
  }

  render(frame: ANARIFrame): ANARIFrameStatistics {
    const options = this.makeRenderOptions(this.adapter, frame);
    const world = frame.getParameter('world');
    if (!options || !world) {
      return {surfaceCount: 0, instanceCount: 0, drawCount: 0, triangleCount: 0};
    }
    this.framePlacements.set(frame.id, this.adapter.getPickPlacements(world));
    return this.renderer.render(options);
  }

  async *exportTiles(
    frame: ANARIFrame,
    options: RayTracingImageExportOptions,
    format: 'rgba8' | 'rgba16float'
  ): AsyncGenerator<RayTracingImageTile> {
    const adapter = new ANARISceneAdapter();
    try {
      options.signal?.throwIfAborted();
      const scene = this.makeRenderOptions(adapter, frame, [options.width, options.height]);
      if (!scene) throw new Error('Ray tracing export requires a world, camera, and renderer.');
      const exportTiles =
        format === 'rgba16float' ? exportRayTracingRadiance : exportRayTracingImage;
      yield* exportTiles(frame.device.device, scene, options);
    } finally {
      adapter.destroy();
    }
  }

  private makeRenderOptions(
    adapter: ANARISceneAdapter,
    frame: ANARIFrame,
    size?: readonly [number, number]
  ): RayTracingSceneRenderOptions | null {
    const options = adapter.makeRenderOptions(frame, size);
    const world = frame.getParameter('world');
    const camera = frame.getParameter('camera');
    const renderer = frame.getParameter('renderer');
    if (!options || !world || !camera || !renderer) {
      return null;
    }

    return {
      ...options,
      primitives: adapter.getAnalyticPrimitives(world),
      cameraProjection: camera.subtype,
      samplesPerPixel: renderer.getParameter('samplesPerPixel'),
      samplingSeed: renderer.getParameter('samplingSeed'),
      historySampleLimit: renderer.getParameter('historySampleLimit'),
      denoiseRadius: renderer.getParameter('denoiseRadius'),
      varianceGuidance: renderer.getParameter('varianceGuidance'),
      debugView: renderer.getParameter('debugView'),
      maxBounces: renderer.getParameter('maxBounces'),
      transportMode: renderer.getParameter('transportMode'),
      environmentRadiance: renderer.getParameter('environmentRadiance'),
      environmentMap: renderer.getParameter('environmentMap'),
      emitterSampling: renderer.getParameter('emitterSampling'),
      emitterSelection: renderer.getParameter('emitterSelection'),
      progressive: renderer.getParameter('progressive'),
      shadows: renderer.getParameter('shadows'),
      filteredCutouts: renderer.getParameter('filteredCutouts'),
      transmissiveShadows: renderer.getParameter('transmissiveShadows'),
      roughDielectricTransmission: renderer.getParameter('roughDielectricTransmission'),
      resolutionScale: renderer.getParameter('resolutionScale'),
      minimumResolutionScale: renderer.getParameter('minimumResolutionScale'),
      adaptiveResolution: renderer.getParameter('adaptiveResolution'),
      targetFrameTimeMilliseconds: renderer.getParameter('targetFrameTimeMilliseconds'),
      previousFrameExecutionMilliseconds: renderer.getParameter(
        'previousFrameExecutionMilliseconds'
      ),
      rayBatchPhaseCount: renderer.getParameter('rayBatchPhaseCount'),
      temporalReprojection: renderer.getParameter('temporalReprojection'),
      shadowSamplesPerFrame: renderer.getParameter('shadowSamplesPerFrame')
    };
  }

  async pick(frame: ANARIFrame, x: number, y: number): Promise<ANARIPickResult | null> {
    // Capture the last rendered frame's object mapping before asynchronous readback.
    const placements = this.framePlacements.get(frame.id);
    if (!placements) {
      return null;
    }
    const hit = await this.renderer.pick(frame.id, x, y);
    const placement = hit ? placements.get(hit.placementId) : undefined;
    return hit && placement
      ? {
          surface: placement.surface,
          ...(placement.instance ? {instance: placement.instance} : {}),
          placementId: hit.placementId,
          position: hit.position,
          normal: hit.normal,
          distance: hit.distance
        }
      : null;
  }

  captureChannels(frame: ANARIFrame): ANARIFrameChannels | null {
    const placements = this.framePlacements.get(frame.id);
    if (!placements) return null;
    const channels = this.renderer.captureChannels(frame.id);
    if (!channels) return null;
    return {
      ...channels,
      identifiers: channels.identifiers.map(identity => {
        const placement = placements.get(identity.placementId)!;
        return {
          surface: placement.surface,
          ...(placement.instance ? {instance: placement.instance} : {}),
          placementId: identity.placementId
        };
      })
    };
  }

  /** Reads the submitted ray-tracing history before presentation. */
  readRadiance(frame: ANARIFrame): Promise<ANARIFrameRadiance | null> {
    return this.renderer.readRadiance(frame.id);
  }

  destroyFrame(frame: ANARIFrame): void {
    this.framePlacements.delete(frame.id);
    this.renderer.destroyFrame(frame.id);
  }

  destroy(): void {
    this.framePlacements.clear();
    this.renderer.destroy();
    this.adapter.destroy();
  }
}
