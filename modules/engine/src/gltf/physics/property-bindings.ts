// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Matrix4} from '@math.gl/core';
import {decomposePhysicsTransform} from '@luma.gl/engine';
import {ScenegraphPhysicsProperties, type PhysicsPropertyTarget} from '@luma.gl/engine/physics';
import {type GPURigidBodyWorld} from '@luma.gl/graph/gpu-physics';
import type {GLTFPhysicsDescription} from './physics-types';

/** Resolve draft pointers once. All mutation and GPU work lives in the shared physics runtime. */
export function makeGLTFPhysicsProperties(
  world: GPURigidBodyWorld,
  description: GLTFPhysicsDescription
): ScenegraphPhysicsProperties {
  const targets = new Map<string, PhysicsPropertyTarget>();
  const extension = 'KHR_physics_rigid_bodies';
  for (const body of description.bodies) {
    if (body.nodeIndex < 0 || body.body.mode === 'static') continue;
    const transform = decomposePhysicsTransform(new Matrix4(body.worldMatrix));
    const rotation = new Matrix4().fromQuaternion(transform.rotation);
    const centerTransform = new Matrix4(rotation)
      .invert()
      .multiplyRight(new Matrix4(body.worldMatrix));
    const fields = {
      isKinematic: 'mode',
      mass: 'mass',
      centerOfMass: 'centerOfMass',
      inertiaDiagonal: 'inertiaDiagonal',
      inertiaOrientation: 'inertiaOrientation',
      linearVelocity: 'velocity',
      angularVelocity: 'angularVelocity',
      gravityFactor: 'gravityFactor'
    } as const;
    for (const [source, property] of Object.entries(fields)) {
      targets.set(`/nodes/${body.nodeIndex}/extensions/${extension}/motion/${source}`, {
        type: 'motion',
        body: body.bodyIndex,
        property,
        transform:
          property === 'velocity'
            ? body.worldMatrix
            : property === 'angularVelocity'
              ? Array.from(rotation)
              : property === 'centerOfMass'
                ? Array.from(centerTransform)
                : undefined
      });
    }
  }
  for (const material of new Set(description.colliders.map(collider => collider.materialIndex))) {
    if (material === undefined) continue;
    const colliders = description.colliders
      .filter(collider => collider.materialIndex === material)
      .map(collider => collider.colliderIndex);
    for (const property of ['staticFriction', 'dynamicFriction', 'restitution'] as const)
      targets.set(`/extensions/${extension}/physicsMaterials/${material}/${property}`, {
        type: 'material',
        colliders,
        property
      });
  }
  // Source indices and unit conversion belong to the importer; runtime mutation is shared.
  const shapes =
    (
      description.source.extensions?.['KHR_implicit_shapes'] as
        | {shapes?: Record<string, unknown>[]}
        | undefined
    )?.shapes ?? [];
  for (const [shapeIndex, source] of shapes.entries()) {
    const type = source['type'];
    const fields =
      type === 'sphere'
        ? {radius: 'radius'}
        : type === 'box'
          ? {size: 'halfExtents'}
          : type === 'plane'
            ? {sizeX: 'sizeX', sizeZ: 'sizeZ', doubleSided: 'doubleSided'}
            : type === 'capsule' || type === 'cylinder'
              ? {height: 'height', radiusBottom: 'radiusBottom', radiusTop: 'radiusTop'}
              : {};
    const definitions = description.colliders.filter(
      collider => collider.shapeIndex === shapeIndex
    );
    if (!definitions.length) continue;
    for (const [field, property] of Object.entries(fields)) {
      if (!property) continue;
      const colliders = definitions.map(definition => {
        const scale = definition.cookedScale;
        return {
          index: definition.colliderIndex,
          scaleAxes:
            field === 'doubleSided'
              ? undefined
              : field === 'size'
                ? [0, 1, 2]
                : [field === 'height' ? 1 : field === 'sizeZ' ? 2 : 0],
          scale:
            field === 'size'
              ? scale.map(component => component / 2)
              : [
                  field === 'doubleSided'
                    ? 1
                    : field === 'height'
                      ? scale[1]
                      : field === 'sizeZ'
                        ? scale[2]
                        : scale[0]
                ]
        };
      });
      targets.set(`/extensions/KHR_implicit_shapes/shapes/${shapeIndex}/${type}/${field}`, {
        type: 'shape',
        colliders,
        property: property as Extract<PhysicsPropertyTarget, {type: 'shape'}>['property']
      });
    }
  }
  const rowCounts = new Map<number, {limits: number; drives: number}>();
  const mergeJoint = (pointer: string, target: Extract<PhysicsPropertyTarget, {type: 'joint'}>) => {
    const previous = targets.get(pointer);
    targets.set(pointer, {
      ...target,
      joints: [...(previous?.type === 'joint' ? previous.joints : []), ...target.joints]
    });
  };
  for (const [index, definition] of description.joints.entries()) {
    const joint = definition.joint;
    mergeJoint(`/nodes/${definition.nodeIndex}/extensions/${extension}/joint/enableCollision`, {
      type: 'joint',
      joints: [index],
      property: 'collideConnected'
    });
    if (joint.type !== 'general') continue;
    if (
      !joint.drive &&
      !description.sceneJoints.find(
        item => item.first === description.sceneNodes.get(definition.nodeIndex)
      )?.limits?.length
    )
      continue;
    const rows = rowCounts.get(definition.nodeIndex) ?? {limits: 0, drives: 0};
    rowCounts.set(definition.nodeIndex, rows);
    const drive = Boolean(joint.drive);
    const row = drive ? rows.drives++ : rows.limits++;
    const fields = drive
      ? ({
          maxForce: 'maximumForce',
          positionTarget: 'positionTarget',
          velocityTarget: 'velocityTarget',
          stiffness: 'stiffness',
          damping: 'damping'
        } as const)
      : ({min: 'minimum', max: 'maximum', stiffness: 'stiffness', damping: 'damping'} as const);
    for (const [source, property] of Object.entries(fields))
      mergeJoint(
        `/extensions/${extension}/physicsJoints/${definition.jointIndex}/${drive ? 'drives' : 'limits'}/${row}/${source}`,
        {type: 'joint', joints: [index], property, drive}
      );
  }
  const root = description.source.extensions?.[extension] as Record<string, unknown> | undefined;
  const constants = new Map<string, readonly unknown[]>();
  for (const field of ['physicsMaterials', 'physicsJoints', 'collisionFilters'])
    constants.set(`/extensions/${extension}/${field}.length`, [
      Array.isArray(root?.[field]) ? root[field].length : 0
    ]);
  return new ScenegraphPhysicsProperties(world, targets, constants);
}
