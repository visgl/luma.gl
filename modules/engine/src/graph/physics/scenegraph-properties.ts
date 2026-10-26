// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Matrix4} from '@math.gl/core';
import type {InteractivityPropertyAdapter} from '../../index';
import type {GPURigidBodyWorld, GPURigidBodyParameters} from '@luma.gl/graph/gpu-physics';
import type {GPURigidBodyGeneralConstraint} from '@luma.gl/graph/gpu-physics';

export type PhysicsPropertyTarget =
  | {
      type: 'motion';
      body: number;
      property: keyof GPURigidBodyParameters;
      transform?: readonly number[];
    }
  | {
      type: 'material';
      colliders: readonly number[];
      property: 'staticFriction' | 'dynamicFriction' | 'restitution';
    }
  | {
      type: 'shape';
      colliders: readonly {
        index: number;
        scale: readonly number[];
        scaleAxes?: readonly number[];
      }[];
      property:
        | 'radius'
        | 'halfExtents'
        | 'height'
        | 'radiusBottom'
        | 'radiusTop'
        | 'sizeX'
        | 'sizeZ'
        | 'doubleSided';
    }
  | {
      type: 'joint';
      joints: readonly number[];
      property:
        | 'minimum'
        | 'maximum'
        | 'stiffness'
        | 'damping'
        | 'positionTarget'
        | 'velocityTarget'
        | 'maximumForce'
        | 'collideConnected';
      drive?: boolean;
    };

/** Resolved property bindings shared by authored behavior and programmatic controls. */
export class ScenegraphPhysicsProperties implements InteractivityPropertyAdapter {
  constructor(
    readonly world: GPURigidBodyWorld,
    readonly targets: ReadonlyMap<string, PhysicsPropertyTarget>,
    readonly constants: ReadonlyMap<string, readonly unknown[]> = new Map()
  ) {}

  get(pointer: string): unknown[] | undefined {
    const target = this.targets.get(pointer);
    if (!target) {
      const component = this.resolveComponent(pointer);
      if (component) return [component.values[component.index]];
      const constant = this.constants.get(pointer);
      return constant ? [...constant] : undefined;
    }
    if (target.type === 'motion') {
      const parameters = this.world.getBodyParameters(target.body);
      if (target.property === 'mode') return [this.world.getBodyMode(target.body) === 'kinematic'];
      const value = parameters[target.property];
      let components: number[] = Array.isArray(value)
        ? [...value]
        : typeof value === 'number'
          ? [value]
          : target.property === 'inertiaOrientation'
            ? [0, 0, 0, 1]
            : ['velocity', 'angularVelocity', 'centerOfMass'].includes(target.property)
              ? [0, 0, 0]
              : [1];
      if (target.transform)
        components = Array.from(
          new Matrix4(target.transform).invert().transformAsVector(components)
        );
      return components;
    }
    if (target.type === 'material') {
      const value = this.world.getColliderMaterial(target.colliders[0])[target.property];
      return [value ?? (target.property === 'restitution' ? 0.1 : 0.6)];
    }
    if (target.type === 'shape') {
      const collider = target.colliders[0];
      const shape = this.world.getColliderShape(collider.index);
      const value = Reflect.get(shape, target.property);
      if (typeof value === 'boolean') return [value];
      if (value === undefined) return undefined;
      return (Array.isArray(value) ? value : [value]).map(
        (component, index) =>
          component /
          (collider.scale[index] *
            (collider.scaleAxes
              ? this.world.getColliderShapeScale(collider.index)[collider.scaleAxes[index]]
              : 1))
      );
    }
    const joint = this.world.getJointParameters(target.joints[0]);
    if (target.property === 'collideConnected') return [joint.collideConnected ?? false];
    if (joint.type !== 'general') throw new Error('Property requires a general constraint');
    const values = target.drive ? joint.drive : joint;
    const fallback =
      target.property === 'minimum'
        ? -3.402823466e38
        : ['maximum', 'maximumForce'].includes(target.property) ||
            (target.property === 'stiffness' && !target.drive)
          ? 3.402823466e38
          : 0;
    return [values?.[target.property as keyof typeof values] ?? fallback];
  }

  /** Component pointers address a declared vector; they cannot create absent fields. */
  private resolveComponent(pointer: string) {
    const match = /^(.*)\/(0|[1-9]\d*)$/.exec(pointer);
    if (!match || !this.targets.has(match[1])) return undefined;
    const values = this.get(match[1]);
    const index = Number(match[2]);
    if (!values || values.length < 2 || index >= values.length) return undefined;
    return {pointer: match[1], values, index};
  }

  set(pointer: string, value: unknown[]): boolean {
    const target = this.targets.get(pointer);
    if (!target) {
      const component = this.resolveComponent(pointer);
      if (!component) return false;
      if (value.length !== 1) throw new Error('Expected one property component');
      const values = [...component.values];
      values[component.index] = value[0];
      return this.set(component.pointer, values);
    }
    if (target.type === 'shape') {
      const boolean = target.property === 'doubleSided';
      const size = target.property === 'halfExtents' ? 3 : 1;
      if (
        value.length !== size ||
        !value.every(component =>
          boolean
            ? typeof component === 'boolean'
            : typeof component === 'number' && Number.isFinite(component)
        )
      )
        throw new Error('Invalid shape property');
      this.world.setColliderShapes(
        target.colliders.map(collider => {
          const shape = this.world.getColliderShape(collider.index);
          if (
            !(target.property in shape) &&
            !(shape.type === 'plane' && ['sizeX', 'sizeZ', 'doubleSided'].includes(target.property))
          )
            throw new Error('Incompatible shape property');
          const components = value.map((component, index) =>
            boolean
              ? component
              : Number(component) *
                collider.scale[index] *
                (collider.scaleAxes
                  ? this.world.getColliderShapeScale(collider.index)[collider.scaleAxes[index]]
                  : 1)
          );
          Reflect.set(shape, target.property, size === 1 ? components[0] : components);
          return {collider: collider.index, shape};
        })
      );
      return true;
    }
    if (target.type === 'motion' && target.property === 'mode') {
      if (value.length !== 1 || typeof value[0] !== 'boolean')
        throw new Error('Expected kinematic boolean');
      this.world.setBodyParameters(target.body, {mode: value[0] ? 'kinematic' : 'dynamic'});
      return true;
    }
    if (target.type === 'joint' && target.property === 'collideConnected') {
      if (value.length !== 1 || typeof value[0] !== 'boolean')
        throw new Error('Expected collision boolean');
      this.world.setJointParameterEdits(
        target.joints.map(index => ({
          index,
          parameters: {
            ...this.world.getJointParameters(index),
            collideConnected: value[0] as boolean
          }
        }))
      );
      return true;
    }
    if (!value.every(component => typeof component === 'number' && Number.isFinite(component)))
      throw new Error('Expected finite physics property');
    const components = value as number[];
    if (target.type === 'motion') {
      const size =
        target.property === 'inertiaOrientation'
          ? 4
          : ['velocity', 'angularVelocity', 'centerOfMass', 'inertiaDiagonal'].includes(
                target.property
              )
            ? 3
            : 1;
      if (components.length !== size) throw new Error('Invalid motion property arity');
      const transformed = target.transform
        ? new Matrix4(target.transform).transformAsVector(components)
        : components;
      this.world.setBodyParameters(target.body, {
        [target.property]: size === 1 ? transformed[0] : transformed
      });
    } else {
      if (components.length !== 1) throw new Error('Expected scalar physics property');
      if (target.type === 'material') {
        const edits = target.colliders.map(collider => ({
          collider,
          material: {
            ...this.world.getColliderMaterial(collider),
            [target.property]: components[0]
          }
        }));
        for (const edit of edits) this.world.setColliderMaterial(edit.collider, edit.material);
      } else
        this.world.setJointParameterEdits(
          target.joints.map(index => {
            const joint = this.world.getJointParameters(index);
            if (joint.type !== 'general') throw new Error('Property requires a general constraint');
            const parameters: GPURigidBodyGeneralConstraint = target.drive
              ? {...joint, drive: {...joint.drive, [target.property]: components[0]}}
              : {...joint, [target.property]: components[0]};
            return {index, parameters: {...joint, ...parameters}};
          })
        );
    }
    return true;
  }
}
