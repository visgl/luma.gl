// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {
  ScenegraphNode,
  ScenegraphJoint,
  ScenegraphJointLimit,
  ScenegraphJointDrive
} from '@luma.gl/engine';
const EXTENSION = 'KHR_physics_rigid_bodies';
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Expected joint object');
  return value as Record<string, unknown>;
}
function fields(value: Record<string, unknown>, names: string[]): void {
  for (const name of Object.keys(value)) {
    if (!names.includes(name) && !['extras', 'name'].includes(name))
      throw new Error(`Unsupported joint field: ${name}`);
  }
}
function optionalNumber(value: unknown): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'number' || !Number.isFinite(value))
    throw new Error('Expected joint number');
  return value;
}
function list(value: unknown): unknown[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new Error('Expected joint list');
  return value;
}

export function parseGLTFJointDeclarations(
  document: {
    nodes?: readonly {extensions?: Record<string, unknown>}[];
    extensions?: Record<string, unknown>;
  },
  sceneNodes: ReadonlyMap<number, ScenegraphNode>
) {
  const nodes = document.nodes ?? [];
  const root = object(document.extensions?.[EXTENSION] ?? {});
  const definitions = list(root['physicsJoints']);
  const declarations: {
    nodeIndex: number;
    connectedNodeIndex: number;
    jointIndex: number;
    joint: ScenegraphJoint;
  }[] = [];
  const issues: {code: string; path: string; message: string}[] = [];
  for (const nodeIndex of sceneNodes.keys()) {
    const value = nodes[nodeIndex].extensions?.[EXTENSION];
    const reference = value === undefined ? undefined : object(value)['joint'];
    if (reference === undefined) continue;
    try {
      const source = object(reference);
      fields(source, ['joint', 'connectedNode', 'enableCollision']);
      const definitionIndex = optionalNumber(source['joint']);
      const connectedNode = optionalNumber(source['connectedNode']);
      if (
        definitionIndex === undefined ||
        !Number.isInteger(definitionIndex) ||
        !definitions[definitionIndex] ||
        connectedNode === undefined
      )
        throw new Error('Invalid joint reference');
      if (source['enableCollision'] !== undefined && typeof source['enableCollision'] !== 'boolean')
        throw new Error('Invalid connected collision flag');
      const definition = object(definitions[definitionIndex]);
      fields(definition, ['limits', 'drives']);
      const first = sceneNodes.get(nodeIndex);
      const second = sceneNodes.get(connectedNode);
      if (!first || !second) throw new Error('Joint attachment must be in the selected scene');
      const limits: ScenegraphJointLimit[] = [];
      const drives: ScenegraphJointDrive[] = [];
      for (const value of list(definition['limits'])) {
        const limit = object(value);
        fields(limit, ['linearAxes', 'angularAxes', 'min', 'max', 'stiffness', 'damping']);
        if ((limit['linearAxes'] === undefined) === (limit['angularAxes'] === undefined))
          throw new Error('A limit needs exactly one axis kind');
        const axes = list(limit['linearAxes'] ?? limit['angularAxes']).map(axis => {
          if (typeof axis !== 'number') throw new Error('Invalid limit axis');
          return axis;
        });
        limits.push({
          axes,
          angular: limit['angularAxes'] !== undefined,
          minimum: optionalNumber(limit['min']),
          maximum: optionalNumber(limit['max']),
          stiffness: optionalNumber(limit['stiffness']),
          damping: optionalNumber(limit['damping'])
        });
      }
      for (const value of list(definition['drives'])) {
        const drive = object(value);
        fields(drive, [
          'type',
          'mode',
          'axis',
          'maxForce',
          'positionTarget',
          'velocityTarget',
          'stiffness',
          'damping'
        ]);
        if (
          !['linear', 'angular'].includes(String(drive['type'])) ||
          (drive['mode'] !== 'force' && drive['mode'] !== 'acceleration')
        )
          throw new Error('Invalid drive type');
        if (
          (drive['positionTarget'] === undefined) !== (drive['stiffness'] === undefined) ||
          (drive['velocityTarget'] === undefined) !== (drive['damping'] === undefined)
        )
          throw new Error('Drive targets require matching response coefficients');
        const axis = optionalNumber(drive['axis']);
        if (axis === undefined) throw new Error('Missing drive axis');
        drives.push({
          angular: drive['type'] === 'angular',
          axis,
          mode: drive['mode'] === 'acceleration' ? 'acceleration' : 'force',
          maximumForce: optionalNumber(drive['maxForce']),
          positionTarget: optionalNumber(drive['positionTarget']),
          velocityTarget: optionalNumber(drive['velocityTarget']),
          stiffness: optionalNumber(drive['stiffness']),
          damping: optionalNumber(drive['damping'])
        });
      }
      declarations.push({
        nodeIndex,
        connectedNodeIndex: connectedNode,
        jointIndex: definitionIndex,
        joint: {first, second, limits, drives, collideConnected: source['enableCollision'] === true}
      });
    } catch (error) {
      issues.push({
        code: 'unsupported-or-invalid-joint',
        path: `/nodes/${nodeIndex}/extensions/${EXTENSION}/joint`,
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }
  return {declarations, issues};
}
