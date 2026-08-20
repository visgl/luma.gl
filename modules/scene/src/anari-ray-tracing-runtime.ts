// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {RayTracingSceneRenderer, type RayTracingScenePrimitive} from '@luma.gl/experimental';
import type {ANARIFrame} from './anari-objects';
import type {ANARIRendererRuntime} from './anari-renderer-runtime';
import {ANARISceneAdapter} from './anari-scene-adapter';
import type {ANARIFrameStatistics} from './anari-types';

/** Adapts retained ANARI objects into the reusable shared ray-tracing scene renderer. */
export class ANARIRayTracingRuntime implements ANARIRendererRuntime {
  private readonly adapter = new ANARISceneAdapter();
  private readonly renderer: RayTracingSceneRenderer;

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

  destroyFrame(frame: ANARIFrame): void {
    this.renderer.destroyFrame(frame.id);
  }

  destroy(): void {
    this.renderer.destroy();
    this.adapter.destroy();
  }
}
