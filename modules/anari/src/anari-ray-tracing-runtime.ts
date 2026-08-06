// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {RayTracingSceneRenderer, type RayTracingScenePrimitive} from '@luma.gl/experimental';
import {
  ANARIArray,
  ANARIGroup,
  type ANARIFrame,
  type ANARIInstance,
  type ANARISurface,
  type ANARIWorld
} from './anari-objects';
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

    return this.renderer.render({
      ...options,
      primitives: getAnalyticPrimitives(world),
      cameraProjection: camera.subtype,
      samplesPerPixel: renderer.getParameter('samplesPerPixel'),
      maxBounces: renderer.getParameter('maxBounces'),
      progressive: renderer.getParameter('progressive'),
      shadows: renderer.getParameter('shadows')
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

/** Preserve analytic sphere identity while the shared adapter owns canonical mesh translation. */
function getAnalyticPrimitives(world: ANARIWorld): Record<string, RayTracingScenePrimitive> {
  const primitives: Record<string, RayTracingScenePrimitive> = {};
  const parameters = world.getParameters();
  const directSurfaces = resolveObjectArray(parameters.surface, parameters.surfaces);
  for (const surface of directSurfaces) {
    addAnalyticPrimitive(surface, primitives);
  }

  for (const instance of resolveObjectArray(parameters.instance, parameters.instances)) {
    const groupValue = instance.getParameter('group');
    const groups =
      groupValue instanceof ANARIArray
        ? groupValue.data
        : Array.isArray(groupValue)
          ? groupValue
          : groupValue
            ? [groupValue]
            : [];
    for (const group of groups) {
      if (!(group instanceof ANARIGroup)) {
        continue;
      }
      const groupParameters = group.getParameters();
      for (const surface of resolveObjectArray(groupParameters.surface, groupParameters.surfaces)) {
        addAnalyticPrimitive(surface, primitives);
      }
    }
  }
  return primitives;
}

function addAnalyticPrimitive(
  surface: ANARISurface,
  primitives: Record<string, RayTracingScenePrimitive>
): void {
  const geometry = surface.getParameter('geometry');
  if (geometry?.subtype === 'sphere') {
    primitives[surface.id] = {type: 'sphere', radius: geometry.getParameter('radius') ?? 1};
  }
}

function resolveObjectArray<ObjectType extends ANARISurface | ANARIInstance>(
  canonicalValue: readonly ObjectType[] | ANARIArray | undefined,
  friendlyValue: readonly ObjectType[] | undefined
): ObjectType[] {
  const value = canonicalValue || friendlyValue || [];
  if (value instanceof ANARIArray) {
    const data = value.data;
    if (ArrayBuffer.isView(data)) {
      return [];
    }
    return data.filter(
      (item): item is ObjectType => typeof item === 'object' && item !== null && 'type' in item
    );
  }
  return Array.from(value);
}
