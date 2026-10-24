// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Matrix4} from '@math.gl/core';
import {decomposePhysicsTransform} from '@luma.gl/engine';
import {ScenegraphPhysicsProperties, type GPURigidBodyWorld} from '@luma.gl/graph/gpu-physics';
import type {GLTFPhysicsDescription, GLTFPhysicsDocument} from './physics-types';
import {makeGLTFPhysicsProperties} from './property-bindings';

/** Export a settled revision as native draft glTF JSON, preserving source assets and provenance.
 * This explicit editing operation reads GPU state. It is not a simulation/render bridge.
 * Geometry/topology changes must first be reimported so the description matches the live world.
 * Animation clips remain authored: replaying a clip can intentionally replace the saved pose.
 */
export async function exportGLTFPhysicsState<T extends GLTFPhysicsDocument>(
  source: T,
  description: GLTFPhysicsDescription,
  world: GPURigidBodyWorld
): Promise<T> {
  if (world.count !== description.bodies.length)
    throw new Error('Recook before exporting topology');
  const output = structuredClone(source);
  const nodes = output.nodes ?? [];
  const parents = new Map<number, number>();
  for (const [index, node] of nodes.entries())
    for (const child of node.children ?? []) {
      if (parents.has(child)) throw new Error('Ambiguous export hierarchy');
      parents.set(child, index);
    }
  const states = await world.readState();
  const matrices = new Map<number, Matrix4>();
  const locals = new Map<number, Matrix4>();
  const bodyMatrices = new Map<number, Matrix4>();
  const visiting = new Set<number>();
  const authored = (index: number): Matrix4 => {
    const cached = matrices.get(index);
    if (cached) return cached;
    const node = nodes[index];
    if (!node || visiting.has(index)) throw new Error('Invalid export hierarchy');
    visiting.add(index);
    const local = node.matrix
      ? new Matrix4(node.matrix)
      : new Matrix4()
          .translate(node.translation ?? [0, 0, 0])
          .multiplyRight(new Matrix4().fromQuaternion(node.rotation ?? [0, 0, 0, 1]))
          .scale(node.scale ?? [1, 1, 1]);
    locals.set(index, local);
    const parent = parents.get(index);
    const matrix = parent === undefined ? local : authored(parent).clone().multiplyRight(local);
    visiting.delete(index);
    matrices.set(index, matrix);
    return matrix;
  };
  nodes.forEach((_, index) => authored(index));
  const properties = makeGLTFPhysicsProperties(world, description);
  // Native object-model pointers preserve shared references. Reject divergent low-level edits
  // instead of silently exporting only the first collider/joint of a shared resource.
  for (const [pointer, target] of properties.targets) {
    if (target.type === 'motion') continue;
    const value = properties.get(pointer);
    if (!value) continue;
    if (target.type === 'material') {
      const expected = JSON.stringify(value);
      for (const collider of target.colliders) {
        const binding = new Map([[pointer, {...target, colliders: [collider]}]]);
        const candidate = new ScenegraphPhysicsProperties(world, binding);
        if (JSON.stringify(candidate.get(pointer)) !== expected)
          throw new Error('Shared material diverged');
      }
    }
    if (target.type === 'shape' || target.type === 'joint') {
      const candidates =
        target.type === 'shape'
          ? target.colliders.map(collider => ({...target, colliders: [collider]}))
          : target.joints.map(joint => ({...target, joints: [joint]}));
      for (const candidate of candidates) {
        const binding = new ScenegraphPhysicsProperties(world, new Map([[pointer, candidate]]));
        if (JSON.stringify(binding.get(pointer)) !== JSON.stringify(value))
          throw new Error('Shared physics resource diverged');
      }
    }
    if (target.type === 'shape') {
      for (const collider of target.colliders) {
        if (world.getColliderShapeScale(collider.index).some(component => component !== 1))
          throw new Error('Recook animated scale before exporting');
      }
    }
    writePointer(output, pointer, value.length === 1 ? value[0] : value);
  }
  for (const body of description.bodies) {
    if (body.nodeIndex < 0) continue;
    const state = states[body.bodyIndex];
    const rotation = new Matrix4().fromQuaternion(state.orientation);
    const center = rotation.transformAsVector(
      world.getBodyParameters(body.bodyIndex).centerOfMass ?? [0, 0, 0]
    );
    const matrix = new Matrix4()
      .translate(state.position.map((value, axis) => value - center[axis]))
      .multiplyRight(rotation)
      .scale(decomposePhysicsTransform(new Matrix4(body.worldMatrix)).scale);
    bodyMatrices.set(body.nodeIndex, matrix);
  }
  matrices.clear();
  const currentWorld = (index: number): Matrix4 => {
    const existing = bodyMatrices.get(index) ?? matrices.get(index);
    if (existing) return existing;
    const parent = parents.get(index);
    const matrix =
      parent === undefined
        ? locals.get(index)!
        : new Matrix4(currentWorld(parent)).multiplyRight(locals.get(index)!);
    matrices.set(index, matrix);
    return matrix;
  };
  const bodyNodes = new Set(description.bodies.map(body => body.nodeIndex));
  for (const body of description.bodies) {
    if (body.nodeIndex < 0) continue;
    const matrix = currentWorld(body.nodeIndex);
    const parent = parents.get(body.nodeIndex);
    const local =
      parent === undefined
        ? matrix
        : new Matrix4(currentWorld(parent)).invert().multiplyRight(matrix);
    const mode = world.getBodyMode(body.bodyIndex);
    // Without motion, a nested collider is folded into its nearest ancestor body on import.
    let ancestorBody = parent;
    while (ancestorBody !== undefined && !bodyNodes.has(ancestorBody))
      ancestorBody = parents.get(ancestorBody);
    let promote = mode === 'static' && ancestorBody !== undefined;
    let transform: ReturnType<typeof decomposePhysicsTransform>;
    try {
      transform = decomposePhysicsTransform(local);
    } catch (error) {
      if (parent === undefined) throw error;
      promote = true;
      transform = decomposePhysicsTransform(matrix);
    }
    if (promote && parent !== undefined) {
      // A rigid world rotation under unequal ancestor scale needs local shear. glTF TRS
      // cannot represent it: keep the node index and subtree, but promote it to a scene root.
      transform = decomposePhysicsTransform(matrix);
      const ancestors = new Set<number>();
      let ancestor: number | undefined = parent;
      while (ancestor !== undefined) {
        ancestors.add(ancestor);
        ancestor = parents.get(ancestor);
      }
      nodes[parent].children = nodes[parent].children?.filter(index => index !== body.nodeIndex);
      for (const scene of output.scenes ?? []) {
        if (
          scene.nodes?.some(index => ancestors.has(index)) &&
          !scene.nodes.includes(body.nodeIndex)
        )
          scene.nodes = [...scene.nodes, body.nodeIndex];
      }
    }
    const node = nodes[body.nodeIndex];
    delete node.matrix;
    node.translation = transform.position;
    node.rotation = transform.rotation;
    node.scale = transform.scale;
    if (mode === 'static') {
      const extension = node.extensions?.['KHR_physics_rigid_bodies'] as
        | Record<string, unknown>
        | undefined;
      if (extension) delete extension['motion'];
    } else {
      const motion = `/nodes/${body.nodeIndex}/extensions/KHR_physics_rigid_bodies/motion/`;
      const parameters = world.getBodyParameters(body.bodyIndex, {deriveInertia: false});
      const scale = decomposePhysicsTransform(matrix).scale;
      if (
        parameters.inertiaDiagonal !== undefined &&
        Math.max(...scale) - Math.min(...scale) > 1e-5 * Math.max(...scale)
      )
        throw new Error(
          'Cannot export explicit inertia under unequal scale; recook geometry first'
        );
      const motionValues = {
        isKinematic: mode === 'kinematic',
        mass: parameters.mass,
        gravityFactor: parameters.gravityFactor,
        centerOfMass: parameters.centerOfMass?.map((value, axis) => value / scale[axis]),
        inertiaDiagonal: parameters.inertiaDiagonal,
        inertiaOrientation: parameters.inertiaOrientation
      };
      // Replace the declaration so absent derived inertia remains implicit after recooking.
      writePointer(
        output,
        motion.slice(0, -1),
        Object.fromEntries(Object.entries(motionValues).filter(([, value]) => value !== undefined))
      );

      writePointer(
        output,
        `${motion}linearVelocity`,
        new Matrix4(matrix).invert().transformAsVector(states[body.bodyIndex].velocity)
      );
      writePointer(
        output,
        `${motion}angularVelocity`,
        new Matrix4()
          .fromQuaternion(states[body.bodyIndex].orientation)
          .invert()
          .transformAsVector(states[body.bodyIndex].angularVelocity)
      );
    }
  }
  return output;
}

function writePointer(document: object, pointer: string, value: unknown): void {
  const keys = pointer.slice(1).split('/');
  let object: Record<string, unknown> = document as Record<string, unknown>;
  for (const key of keys.slice(0, -1)) {
    const current = object[key];
    if (current === undefined) object[key] = {};
    if (typeof object[key] !== 'object' || object[key] === null)
      throw new Error('Invalid export pointer');
    object = object[key] as Record<string, unknown>;
  }
  object[keys[keys.length - 1]] = value;
}
