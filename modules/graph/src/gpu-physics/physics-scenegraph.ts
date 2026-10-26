// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {CubeGeometry, GroupNode, ScenegraphNode, type Geometry} from '@luma.gl/engine';
import {Matrix4} from '@math.gl/core';
import {makeConvexHullGeometry, makeTriangleMeshGeometry} from './rigid-body-mesh';
import {normalizeRigidBodyRotation, type GPURigidBody} from './rigid-body-properties';
import type {GPURigidBodyBounds} from './rigid-body-publication';

export type PhysicsGeometryNodeProps = ConstructorParameters<typeof ScenegraphNode>[0] & {
  geometry: Geometry;
  /** Explicit world-space body, or false to opt out. Default: infer from geometry. */
  collision?: GPURigidBody | false;
  body?: {
    mode?: 'static' | 'dynamic' | 'kinematic';
    mass?: number;
    restitution?: number;
    friction?: number;
  };
  /** Concave surfaces must be requested explicitly; defaults to convex hull cooking. */
  geometryMode?: 'convex-hull' | 'triangle-mesh';
};

/** Retains CPU geometry for both renderer creation and physics cooking. */
export class PhysicsGeometryNode extends ScenegraphNode {
  readonly geometry: Geometry;
  readonly physics: PhysicsGeometryNodeProps;
  constructor(props: PhysicsGeometryNodeProps) {
    super(props);
    this.geometry = props.geometry;
    this.physics = props;
  }
}

export type PhysicsScenegraphSnapshot = {
  bodies: GPURigidBody[];
  publicationBounds: GPURigidBodyBounds[];
  bindings: {node: ScenegraphNode; body: number; localMatrix: Matrix4}[];
};

/** Snapshot authored geometry and accumulated transforms. Rebuild explicitly after topology/geometry edits. */
export function makePhysicsScenegraph(root: GroupNode): PhysicsScenegraphSnapshot {
  const result: PhysicsScenegraphSnapshot = {bodies: [], publicationBounds: [], bindings: []};
  const identifiers = new Set<string>();
  root.traverse((node, {worldMatrix}) => {
    if (!(node instanceof PhysicsGeometryNode) || node.physics.collision === false) return;
    if (identifiers.has(node.id)) throw new Error('Duplicate physics node');
    identifiers.add(node.id);
    const world = new Matrix4(worldMatrix).multiplyRight(node.matrix);
    const override = node.physics.collision;
    const position = override?.position ?? ([world[12], world[13], world[14]] as const);
    const bodyMatrix = new Matrix4()
      .translate(position)
      .multiplyRight(
        new Matrix4().fromQuaternion(normalizeRigidBodyRotation(override?.orientation))
      );
    const localMatrix = new Matrix4(bodyMatrix).invert().multiplyRight(world);
    const attribute = node.geometry.attributes['POSITION'];
    if (!attribute || attribute.size !== 3 || attribute.value.length < 9)
      throw new Error('Invalid physics geometry');
    const vertices: number[] = [];
    for (let index = 0; index < attribute.value.length; index += 3)
      vertices.push(
        ...localMatrix.transformAsPoint([
          attribute.value[index],
          attribute.value[index + 1],
          attribute.value[index + 2]
        ])
      );
    const minimum: [number, number, number] = [Infinity, Infinity, Infinity];
    const maximum: [number, number, number] = [-Infinity, -Infinity, -Infinity];
    for (let index = 0; index < vertices.length; index++) {
      minimum[index % 3] = Math.min(minimum[index % 3], vertices[index]);
      maximum[index % 3] = Math.max(maximum[index % 3], vertices[index]);
    }
    if (![...minimum, ...maximum].every(Number.isFinite))
      throw new Error('Invalid geometry transform');
    const centeredBox =
      node.geometry instanceof CubeGeometry &&
      [1, 2, 4, 6, 8, 9, 12, 13, 14].every(index => Math.abs(localMatrix[index]) < 1e-8);
    const makeShape = () =>
      centeredBox
        ? {type: 'box' as const, halfExtents: maximum}
        : node.physics.geometryMode === 'triangle-mesh'
          ? {
              type: 'triangle-mesh' as const,
              geometry: makeTriangleMeshGeometry(
                vertices,
                node.geometry.indices
                  ? Array.from(node.geometry.indices.value)
                  : Array.from({length: vertices.length / 3}, (_, index) => index)
              )
            }
          : {type: 'convex-hull' as const, geometry: makeConvexHullGeometry(vertices)};
    const mode =
      node.physics.body?.mode ?? ((node.physics.body?.mass ?? 0) === 0 ? 'static' : 'dynamic');
    result.bindings.push({node, body: result.bodies.length, localMatrix});
    result.bodies.push(
      override
        ? structuredClone(override)
        : {
            position,
            shape: makeShape(),
            mode,
            mass: mode === 'static' ? 0 : 1,
            ...node.physics.body
          }
    );
    result.publicationBounds.push([minimum, maximum]);
  });
  return result;
}
