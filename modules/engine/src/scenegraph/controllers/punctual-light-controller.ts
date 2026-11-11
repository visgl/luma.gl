// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Matrix4} from '@math.gl/core';
import {
  normalizeByteColor3,
  type DirectionalLight,
  type Light,
  type PointLight,
  type SpotLight
} from '@luma.gl/shaders';
import type {ScenegraphNode} from '../scenegraph-node';

/** Light parameters in local space with normalized RGB color. */
export type PunctualLightDefinition = {
  type: 'directional' | 'point' | 'spot';
  color?: [number, number, number];
  intensity?: number;
  range?: number;
  spot?: {innerConeAngle?: number; outerConeAngle?: number};
};

/** A light and its root-to-light scenegraph path. */
export type PunctualLightBinding = {
  path: readonly ScenegraphNode[];
  definition: PunctualLightDefinition;
};

/** Projects bound lights using live node transforms and inherited visibility. */
export class PunctualLightController {
  readonly lights: Light[] = [];

  constructor(
    private readonly bindings: readonly PunctualLightBinding[],
    private readonly useByteColors = true
  ) {
    this.update();
  }

  /** Refreshes the stable light array after node or light properties change. */
  update(): void {
    this.lights.length = 0;
    for (const {path, definition} of this.bindings) {
      if (!path.length || path.some(node => !node.display)) continue;
      const worldMatrix = new Matrix4();
      for (const node of path) worldMatrix.multiplyRight(node.matrix);
      const light = makePunctualLight(definition, worldMatrix, this.useByteColors);
      if (light) this.lights.push(light);
    }
  }
}

/** Projects a local light definition into the shader's world-space light format. */
export function makePunctualLight(
  definition: PunctualLightDefinition,
  worldMatrix: Matrix4,
  useByteColors: boolean
): Light | undefined {
  const color = normalizePunctualLightColor(definition.color || [1, 1, 1], useByteColors);
  const intensity = definition.intensity ?? 1;
  switch (definition.type) {
    case 'directional':
      return makeDirectionalLight(worldMatrix, color, intensity);
    case 'point':
      return makePointLight(worldMatrix, color, intensity, definition.range);
    case 'spot':
      return makeSpotLight(worldMatrix, color, intensity, definition.range, definition.spot);
    default:
      return undefined;
  }
}

/**
 * Converts normalized colors from the 0-1 spec range to the configured luma light convention.
 */
function normalizePunctualLightColor(
  color: [number, number, number],
  useByteColors: boolean
): [number, number, number] {
  if (useByteColors) {
    return color.map(component => component * 255) as [number, number, number];
  }
  return normalizeByteColor3(color, false) as [number, number, number];
}

/**
 * Converts a punctual light attached to a node into a point light.
 */
function makePointLight(
  worldMatrix: Matrix4,
  color: [number, number, number],
  intensity: number,
  range?: number
): PointLight {
  const position = getLightPosition(worldMatrix);

  let attenuation: Readonly<[number, number, number]> = [1, 0, 0];
  if (range !== undefined && range > 0) {
    attenuation = [1, 0, 1 / (range * range)] as [number, number, number];
  }

  return {
    type: 'point',
    position,
    color,
    intensity,
    attenuation
  };
}

/**
 * Converts a punctual light attached to a node into a directional light.
 */
function makeDirectionalLight(
  worldMatrix: Matrix4,
  color: [number, number, number],
  intensity: number
): DirectionalLight {
  const direction = getLightDirection(worldMatrix);

  return {
    type: 'directional',
    direction,
    color,
    intensity
  };
}

/**
 * Converts a punctual light attached to a node into a spot light.
 */
function makeSpotLight(
  worldMatrix: Matrix4,
  color: [number, number, number],
  intensity: number,
  range?: number,
  spot: {innerConeAngle?: number; outerConeAngle?: number} = {}
): SpotLight {
  const position = getLightPosition(worldMatrix);
  const direction = getLightDirection(worldMatrix);

  let attenuation: Readonly<[number, number, number]> = [1, 0, 0];
  if (range !== undefined && range > 0) {
    attenuation = [1, 0, 1 / (range * range)] as [number, number, number];
  }

  return {
    type: 'spot',
    position,
    direction,
    color,
    intensity,
    attenuation,
    innerConeAngle: spot.innerConeAngle ?? 0,
    outerConeAngle: spot.outerConeAngle ?? Math.PI / 4
  };
}

/**
 * Resolves the world-space position of a light node.
 */
function getLightPosition(worldMatrix: Matrix4): [number, number, number] {
  return worldMatrix.transformAsPoint([0, 0, 0]) as [number, number, number];
}

/**
 * Resolves the world-space forward direction of a light node.
 */
function getLightDirection(worldMatrix: Matrix4): [number, number, number] {
  return worldMatrix.transformAsVector([0, 0, -1]) as [number, number, number];
}
