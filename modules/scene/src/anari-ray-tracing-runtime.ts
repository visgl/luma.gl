// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {RayTracingSceneRenderer, type RayTracingScenePrimitive} from '@luma.gl/experimental';
import type {ANARIFrame} from './anari-objects';
import type {ANARIRendererRuntime} from './anari-renderer-runtime';
import {ANARISceneAdapter} from './anari-scene-adapter';
import type {ANARIFrameStatistics, ANARIPickResult, ANARIFrameChannels} from './anari-types';

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
    const options = this.adapter.makeRenderOptions(frame);
    const world = frame.getParameter('world');
    const camera = frame.getParameter('camera');
    const renderer = frame.getParameter('renderer');
    if (!options || !world || !camera || !renderer) {
      return {surfaceCount: 0, instanceCount: 0, drawCount: 0, triangleCount: 0};
    }

    const primitives: Readonly<Record<string, RayTracingScenePrimitive>> =
      this.adapter.getAnalyticPrimitives(world);
    this.framePlacements.set(frame.id, this.adapter.getPickPlacements(world));
    return this.renderer.render({
      ...options,
      primitives,
      cameraProjection: camera.subtype,
      samplesPerPixel: renderer.getParameter('samplesPerPixel'),
      maxBounces: renderer.getParameter('maxBounces'),
      progressive: renderer.getParameter('progressive'),
      shadows: renderer.getParameter('shadows'),
      resolutionScale: renderer.getParameter('resolutionScale'),
      minimumResolutionScale: renderer.getParameter('minimumResolutionScale'),
      adaptiveResolution: renderer.getParameter('adaptiveResolution'),
      targetFrameTimeMilliseconds: renderer.getParameter('targetFrameTimeMilliseconds'),
      temporalReprojection: renderer.getParameter('temporalReprojection'),
      shadowSamplesPerFrame: renderer.getParameter('shadowSamplesPerFrame')
    });
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
