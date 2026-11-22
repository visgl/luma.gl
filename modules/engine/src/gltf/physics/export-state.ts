// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Matrix4} from '@math.gl/core/matrix';
import {decomposePhysicsTransform, readPhysicsRotation, type ScenegraphNode} from '@luma.gl/engine';
import {ScenegraphPhysicsProperties} from '@luma.gl/engine/physics';
import {type GPURigidBodyWorld} from '@luma.gl/graph/gpu-physics';
import type {GLTFPhysicsDescription, GLTFPhysicsDocument} from './physics-types';
import {makeGLTFPhysicsProperties} from './property-bindings';

/** Authored input from the same settled session as the GPU world. */
export type GLTFPhysicsExportOptions = {
  /** Current local scene transforms for animated analytic collider frames and scales. */
  sceneNodes?: ReadonlyMap<number, ScenegraphNode>;
};

/** Export a settled revision as native draft glTF JSON, preserving source assets and provenance.
 * This explicit editing operation reads GPU state. It is not a simulation/render bridge.
 * Recook mesh deformation and topology changes first. Current analytic animation can
 * be exported directly when the scene node map represents the same accepted revision.
 * Animation clips remain authored: replaying a clip can intentionally replace the saved pose.
 */
export async function exportGLTFPhysicsState<T extends GLTFPhysicsDocument>(
  source: T,
  description: GLTFPhysicsDescription,
  world: GPURigidBodyWorld,
  {sceneNodes}: GLTFPhysicsExportOptions = {}
): Promise<T> {
  if (world.count !== description.bodies.length)
    throw new Error('Recook before exporting topology');
  const output = structuredClone(source);
  const nodes = output.nodes ?? [];
  if (sceneNodes) writeLiveTransforms(output, sceneNodes);
  const parents = new Map<number, number>();
  for (const [index, node] of nodes.entries())
    for (const child of node.children ?? []) {
      if (parents.has(child)) throw new Error('Ambiguous export hierarchy');
      parents.set(child, index);
    }
  /** Capture the local-frame origin before queuing the corresponding GPU state read. */
  const origin = world.origin;
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
          .multiplyRight(new Matrix4().fromQuaternion(readPhysicsRotation(node.rotation)))
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
        if (!equalProperty(binding.get(pointer), value))
          throw new Error('Shared physics resource diverged');
      }
    }
    writePointer(output, pointer, value.length === 1 ? value[0] : value);
  }
  for (const body of description.bodies) {
    if (body.nodeIndex < 0) continue;
    const state = states[body.bodyIndex];
    const rotation = new Matrix4().fromQuaternion(readPhysicsRotation(state.orientation));
    const center = rotation.transformAsVector(
      world.getBodyParameters(body.bodyIndex).centerOfMass ?? [0, 0, 0]
    );
    const matrix = new Matrix4()
      .translate(state.position.map((value, axis) => value - center[axis]))
      .multiplyRight(rotation)
      .scale(decomposePhysicsTransform(authored(body.nodeIndex)).scale);
    bodyMatrices.set(body.nodeIndex, matrix);
  }
  matrices.clear();
  /** Compose the accepted hierarchy near the simulation origin to preserve small local offsets. */
  const currentWorld = (index: number): Matrix4 => {
    const existing = bodyMatrices.get(index) ?? matrices.get(index);
    if (existing) return existing;
    /** Articulated and static descendants inherit the same origin-relative frame. */
    const parent = parents.get(index);
    /** The source local matrix is needed later and must stay in its authored frame. */
    const local = locals.get(index)!;
    /** Rebase an authored root by changing its world translation directly. */
    const matrix =
      parent === undefined ? local.clone() : new Matrix4(currentWorld(parent)).multiplyRight(local);
    if (parent === undefined) {
      matrix[12] -= origin[0];
      matrix[13] -= origin[1];
      matrix[14] -= origin[2];
    }
    matrices.set(index, matrix);
    return matrix;
  };
  validateColliderFrames(description, world, currentWorld, parents, locals);
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
    // Only scene roots need world-space positions. Child TRS is already relative to its parent.
    node.translation =
      parent === undefined || promote
        ? transform.position.map((value, axis) => value + origin[axis])
        : transform.position;
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
          .fromQuaternion(readPhysicsRotation(states[body.bodyIndex].orientation))
          .invert()
          .transformAsVector(states[body.bodyIndex].angularVelocity)
      );
    }
  }
  return output;
}

/** Keep animated nodes in TRS form so their existing channels remain valid glTF. */
function writeLiveTransforms(
  output: GLTFPhysicsDocument,
  sceneNodes: ReadonlyMap<number, ScenegraphNode>
): void {
  /** Only node TRS channels require decomposition of a supplied local transform. */
  const animated = new Set<number>();
  for (const animation of output.animations ?? []) {
    for (const {target} of animation.channels) {
      if (
        target.node !== undefined &&
        ['translation', 'rotation', 'scale'].includes(target.path ?? '')
      )
        animated.add(target.node);
      /** KHR_animation_pointer can target the same authored TRS fields. */
      const extension = target.extensions?.['KHR_animation_pointer'];
      if (
        extension &&
        typeof extension === 'object' &&
        'pointer' in extension &&
        typeof extension.pointer === 'string'
      ) {
        /** Snapshot node indices remain identical to source indices. */
        const match = /^\/nodes\/(\d+)\/(translation|rotation|scale)(?:\/\d+)?$/.exec(
          extension.pointer
        );
        if (match) animated.add(Number(match[1]));
      }
    }
  }
  for (const [index, current] of sceneNodes) {
    /** Render-only matrices retain their exact affine transform. */
    const node = output.nodes?.[index];
    if (!node) throw new Error('Unknown export scene node');
    if (animated.has(index)) {
      /** Retain valid glTF authoring channels for non-body animated descendants as well. */
      const transform = getLiveNodeComponents(current, node);
      delete node.matrix;
      node.translation = transform.position;
      node.rotation = transform.rotation;
      node.scale = transform.scale;
    } else {
      node.matrix = Array.from(current.matrix);
      delete node.translation;
      delete node.rotation;
      delete node.scale;
    }
  }
}

/** Preserve signed and zero scales when the local matrix comes from known TRS. */
function getLiveNodeComponents(
  current: ScenegraphNode,
  source: NonNullable<GLTFPhysicsDocument['nodes']>[number]
): {position: readonly number[]; rotation: readonly number[]; scale: readonly number[]} {
  /** Live local translation from the scenegraph component API. */
  const position = Array.from(current.position);
  /** Keep each axis sign, including axes collapsed by animation. */
  const scale = Array.from(current.scale);
  /** Convert either quaternion or Euler components with the scenegraph convention. */
  const rotationMatrix = new Matrix4();
  if (current.rotation.length === 4) rotationMatrix.fromQuaternion(current.rotation);
  else rotationMatrix.rotateXYZ(current.rotation);
  /** Verify that the components still describe the matrix used by the scene. */
  const liveMatrix = new Matrix4().translate(position).multiplyRight(rotationMatrix).scale(scale);
  if (liveMatrix.every((value, index) => value === current.matrix[index])) {
    /** glTF rotation channels always use quaternions. */
    const rotation =
      current.rotation.length === 4
        ? Array.from(current.rotation)
        : decomposePhysicsTransform(rotationMatrix).rotation;
    return {position, rotation, scale};
  }

  // Some imported nodes initialize only the matrix. Retain the source TRS when it still matches.
  if (!source.matrix) {
    /** Authored local translation with the glTF identity default. */
    const authoredPosition = source.translation ?? [0, 0, 0];
    /** Normalize exactly as the physics importer does when initializing the local matrix. */
    const authoredRotation = readPhysicsRotation(source.rotation);
    /** Authored scale with the glTF identity default. */
    const authoredScale = source.scale ?? [1, 1, 1];
    /** Match the import-time matrix before using source components. */
    const authoredMatrix = new Matrix4()
      .translate(authoredPosition)
      .multiplyRight(new Matrix4().fromQuaternion(authoredRotation))
      .scale(authoredScale);
    if (authoredMatrix.every((value, index) => value === current.matrix[index]))
      return {position: authoredPosition, rotation: authoredRotation, scale: authoredScale};
  }
  return decomposePhysicsTransform(new Matrix4(current.matrix));
}

/** Check that the native scene reproduces the live collider geometry and placement. */
function validateColliderFrames(
  description: GLTFPhysicsDescription,
  world: GPURigidBodyWorld,
  getWorldMatrix: (index: number) => Matrix4,
  parents: ReadonlyMap<number, number>,
  locals: ReadonlyMap<number, Matrix4>
): void {
  for (const collider of description.colliders) {
    /** The importer assigns the collider to its nearest rigid body ancestor. */
    const body = description.bodies[collider.bodyIndex];
    /** Begin at the authored collider placement, including any baked mesh center. */
    const matrix = new Matrix4(collider.localMatrix);
    if (body.nodeIndex < 0) {
      matrix.multiplyLeft(getWorldMatrix(collider.nodeIndex));
    } else {
      /** Walk only body-local matrices to retain offsets even in distant parts of the world. */
      let nodeIndex = collider.nodeIndex;
      while (nodeIndex !== body.nodeIndex) {
        matrix.multiplyLeft(locals.get(nodeIndex)!);
        /** Collider ownership must still match the settled scene hierarchy. */
        const parent = parents.get(nodeIndex);
        if (parent === undefined) throw new Error('Recook before exporting collider ownership');
        nodeIndex = parent;
      }
      /** Cooked collider frames include body scale and exclude rigid world motion. */
      const {scale} = decomposePhysicsTransform(getWorldMatrix(body.nodeIndex));
      matrix.multiplyLeft(new Matrix4().scale(scale));
    }
    /** Inspect the dimensions and pose in the same frame as the cooked collider. */
    const authored = decomposePhysicsTransform(matrix);
    /** Authored absolute scale must match the live cooked dimensions without baking scale twice. */
    const liveScale = world.getColliderShapeScale(collider.colliderIndex);
    if (
      !authored.scale.every((value, axis) =>
        closeComponent(Math.abs(value), collider.cookedScale[axis] * liveScale[axis], 1e-15)
      )
    )
      throw new Error(
        'Export scene scale does not match the live collider. Supply the settled scene nodes or recook.'
      );
    if (collider.shapeIndex === undefined && liveScale.some(component => component !== 1))
      throw new Error('Recook mesh geometry before export');

    if (body.nodeIndex < 0) continue;
    /** The two quaternion signs represent the same accepted collider orientation. */
    const live = world.getColliderTransform(collider.colliderIndex);
    /** Quaternion alignment tests orientation independently of quaternion sign. */
    const alignment = authored.rotation.reduce(
      (sum, value, axis) => sum + value * live.orientation[axis],
      0
    );
    if (
      !authored.position.every((value, axis) => closeComponent(value, live.position[axis])) ||
      !closeComponent(Math.abs(alignment), 1)
    )
      throw new Error(
        'Export scene pose does not match the live collider. Supply the settled scene nodes or recook.'
      );
  }
}

/** Allow roundoff when a shared value has been independently scaled and unscaled. */
function equalProperty(
  actual: readonly unknown[] | undefined,
  expected: readonly unknown[]
): boolean {
  return (
    actual?.length === expected.length &&
    actual.every((value, index) => {
      /** Boolean pointer values must still match exactly. */
      const other = expected[index];
      return typeof value === 'number' && typeof other === 'number'
        ? closeComponent(value, other, 1e-15)
        : value === other;
    })
  );
}

/** Browser GPU poses are float32 while source transforms and export are JavaScript numbers. */
function closeComponent(first: number, second: number, minimumMagnitude = 1): boolean {
  return (
    Math.abs(first - second) <= Math.max(minimumMagnitude, Math.abs(first), Math.abs(second)) * 2e-6
  );
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
