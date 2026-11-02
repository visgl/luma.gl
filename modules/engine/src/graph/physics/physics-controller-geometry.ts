// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert} from '@luma.gl/core';
import {Geometry} from '@math.gl/geometry';
import {Matrix4} from '@math.gl/core';
import {
  CubeGeometry,
  GroupNode,
  IcoSphereGeometry,
  ModelNode,
  SphereGeometry,
  decomposePhysicsTransform,
  JointController,
  type ScenegraphJoint,
  type ScenegraphBounds,
  type ScenegraphNode
} from '../../index';
import {
  makeConvexHullGeometry,
  makeTriangleMeshGeometry,
  scaleRigidBodyShape
} from '@luma.gl/graph/gpu-physics';
import type {
  GPURigidBody,
  GPURigidBodyCollider,
  GPURigidBodyShape
} from '@luma.gl/graph/gpu-physics';
import type {PhysicsBodyOptions} from './physics-controller';
import type {ScenegraphPhysicsScene} from './scenegraph-session';
import {PhysicsGeometryNode} from './physics-scenegraph';
import {makeRigidBodyJointsFromScenegraph} from './scenegraph-joints';

/** Cook CPU-authored geometry once; live body poses remain independent GPU state. */
export function makePhysicsControllerScene(
  scene: GroupNode,
  definitions: ReadonlyMap<ScenegraphNode, PhysicsBodyOptions>,
  worldOptions: Omit<ScenegraphPhysicsScene['definition']['world'], 'bodies'>,
  joints: readonly ScenegraphJoint[] = []
): ScenegraphPhysicsScene {
  const matrices = new Map<ScenegraphNode, Matrix4>();
  const pending: {node: ScenegraphNode; parent: Matrix4}[] = [{node: scene, parent: new Matrix4()}];
  while (pending.length) {
    const {node, parent} = pending.pop()!;
    // Physics authoring requires a tree, including hidden nodes.
    assert(!matrices.has(node));
    const matrix = new Matrix4(parent).multiplyRight(node.matrix);
    matrices.set(node, matrix);
    if (node instanceof GroupNode) {
      for (let index = node.children.length - 1; index >= 0; index--)
        pending.push({node: node.children[index], parent: matrix});
    }
  }
  const bodies: GPURigidBody[] = [];
  const bindings = new Map<ScenegraphNode, number>();
  const geometries = new Map<
    ScenegraphNode,
    {geometry: Geometry; placements: readonly Matrix4[]}
  >();
  const localBounds = new Map<ScenegraphNode, ScenegraphBounds>();
  for (const node of matrices.keys()) {
    const source =
      definitions.get(node)?.geometry ??
      (node instanceof PhysicsGeometryNode
        ? node.geometry
        : node instanceof ModelNode
          ? node.model.sourceGeometry
          : null);
    if (!(source instanceof Geometry)) continue;
    const placements =
      node instanceof ModelNode && node.instanceMatrices
        ? node.instanceMatrices.map(matrix => new Matrix4(matrix))
        : [new Matrix4()];
    geometries.set(node, {geometry: source, placements});
    const positions = source.attributes['POSITION'];
    if (!positions || positions.size !== 3) continue;
    const minimum: [number, number, number] = [Infinity, Infinity, Infinity];
    const maximum: [number, number, number] = [-Infinity, -Infinity, -Infinity];
    for (const placement of placements)
      for (let index = 0; index < positions.value.length; index += 3) {
        const point = placement.transformAsPoint([
          positions.value[index],
          positions.value[index + 1],
          positions.value[index + 2]
        ]);
        for (let axis = 0; axis < 3; axis++) {
          minimum[axis] = Math.min(minimum[axis], point[axis]);
          maximum[axis] = Math.max(maximum[axis], point[axis]);
        }
      }
    if (placements.length) localBounds.set(node, [minimum, maximum]);
  }
  for (const [node, options] of definitions) {
    const matrix = matrices.get(node);
    if (!matrix) throw new Error(`Physics node is outside the scene: ${node.id}`);
    const {position, rotation, scale} = decomposePhysicsTransform(matrix);
    const inverse = new Matrix4()
      .translate(position)
      .multiplyRight(new Matrix4().fromQuaternion(rotation))
      .invert();
    const colliders: GPURigidBodyCollider[] = [];
    if (options.collider && options.collider !== 'geometry') {
      colliders.push({shape: scaleRigidBodyShape(options.collider, scale.map(Math.abs))});
    } else {
      const descendants = [node];
      while (descendants.length) {
        const descendant = descendants.pop()!;
        if (descendant !== node && definitions.has(descendant)) continue;
        const source = geometries.get(descendant);
        if (source) {
          for (const placement of source.placements)
            colliders.push(
              makeGeometryCollider(
                source.geometry,
                new Matrix4(inverse)
                  .multiplyRight(matrices.get(descendant)!)
                  .multiplyRight(placement),
                options.geometryMode
              )
            );
        }
        if (descendant instanceof GroupNode) {
          for (let index = descendant.children.length - 1; index >= 0; index--)
            descendants.push(descendant.children[index]);
        }
      }
    }
    if (!colliders.length)
      throw new Error(`No CPU collision geometry for physics node: ${node.id}`);
    const {motion = 'dynamic', collider, geometry, geometryMode, ...properties} = options;
    bindings.set(node, bodies.length);
    bodies.push({
      colliders,
      position,
      orientation: rotation,
      mode: motion,
      mass: motion === 'static' ? 0 : 1,
      ...properties
    });
  }
  if (!bodies.length) throw new Error('Physics scene has no bodies');
  const resolved = new JointController(joints).resolve([scene], new Set(bindings.keys()));
  let fixedWorldBody: number | undefined;
  if (resolved.some(joint => !joint.first.body || !joint.second.body)) {
    fixedWorldBody = bodies.length;
    bodies.push({mode: 'static', mass: 0, position: [0, 0, 0], colliders: []});
  }
  return {
    roots: [scene],
    localBounds,
    definition: {
      bodies: bindings,
      world: {
        ...worldOptions,
        bodies,
        joints: resolved.flatMap(joint =>
          makeRigidBodyJointsFromScenegraph(joint, bindings, fixedWorldBody)
        )
      }
    }
  };
}

function makeGeometryCollider(
  geometry: Geometry,
  matrix: Matrix4,
  mode: PhysicsBodyOptions['geometryMode']
): GPURigidBodyCollider {
  const positions = geometry.attributes['POSITION'];
  if (geometry.topology !== 'triangle-list' || !positions || positions.size !== 3)
    throw new Error('Physics cooking requires triangle-list POSITION geometry');
  const minimum = [Infinity, Infinity, Infinity];
  const maximum = [-Infinity, -Infinity, -Infinity];
  let radius = 0;
  for (let index = 0; index < positions.value.length; index += 3) {
    radius = Math.max(
      radius,
      Math.hypot(positions.value[index], positions.value[index + 1], positions.value[index + 2])
    );
    for (let axis = 0; axis < 3; axis++) {
      minimum[axis] = Math.min(minimum[axis], positions.value[index + axis]);
      maximum[axis] = Math.max(maximum[axis], positions.value[index + axis]);
    }
  }
  let shape: GPURigidBodyShape;
  const transform = decomposePhysicsTransform(matrix);
  const scale = transform.scale.map(Math.abs);
  const isBox =
    geometry instanceof CubeGeometry &&
    Array.from(positions.value).every(
      (value, index) =>
        Math.min(Math.abs(value - minimum[index % 3]), Math.abs(value - maximum[index % 3])) < 1e-6
    );
  const isSphere =
    (geometry instanceof SphereGeometry || geometry instanceof IcoSphereGeometry) &&
    scale.every(value => Math.abs(value - scale[0]) < 1e-6) &&
    Array.from({length: positions.value.length / 3}, (_, index) =>
      Math.hypot(
        positions.value[index * 3],
        positions.value[index * 3 + 1],
        positions.value[index * 3 + 2]
      )
    ).every(value => Math.abs(value - radius) < 1e-6 * Math.max(1, radius));
  if (!mode && isBox) {
    const halfExtents = maximum.map((value, axis) => ((value - minimum[axis]) * scale[axis]) / 2);
    const center = matrix.transformAsPoint(
      minimum.map((value, axis) => (value + maximum[axis]) / 2)
    );
    return {
      shape: {type: 'box', halfExtents: [halfExtents[0], halfExtents[1], halfExtents[2]]},
      position: [center[0], center[1], center[2]],
      orientation: transform.rotation
    };
  }
  if (!mode && isSphere)
    return {
      shape: {type: 'sphere', radius: radius * scale[0]},
      position: transform.position,
      orientation: transform.rotation
    };
  const vertices: number[] = [];
  for (let index = 0; index < positions.value.length; index += 3)
    vertices.push(
      ...matrix.transformAsPoint([
        positions.value[index],
        positions.value[index + 1],
        positions.value[index + 2]
      ])
    );
  if (mode === 'triangle-mesh') {
    const indices = geometry.indices
      ? Array.from(geometry.indices.value)
      : Array.from({length: vertices.length / 3}, (_, index) => index);
    if (matrix.determinant() < 0)
      for (let index = 0; index < indices.length; index += 3)
        [indices[index + 1], indices[index + 2]] = [indices[index + 2], indices[index + 1]];
    shape = {type: 'triangle-mesh', geometry: makeTriangleMeshGeometry(vertices, indices)};
  } else shape = {type: 'convex-hull', geometry: makeConvexHullGeometry(vertices)};
  return {shape};
}
