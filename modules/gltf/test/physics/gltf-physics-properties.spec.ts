// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {GPUCommandGraph} from '@luma.gl/graph';
import {GLTFAnimator} from '../../src/gltf/gltf-animator';
import {
  createGLTFPhysicsWorld,
  parseGLTFPhysics,
  makeGLTFPhysicsProperties,
  type GLTFPhysicsDocument
} from '../../src/physics';

it('binds authored motion and material pointers through shared animation and GPU mutation', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const source: GLTFPhysicsDocument = {
    scenes: [{nodes: [0]}],
    nodes: [
      {
        scale: [2, 2, 2],
        extensions: {
          KHR_physics_rigid_bodies: {
            motion: {mass: 1, inertiaDiagonal: [1, 1, 1]},
            collider: {geometry: {shape: 0}, physicsMaterial: 0}
          }
        }
      }
    ],
    extensions: {
      KHR_implicit_shapes: {shapes: [{type: 'sphere', sphere: {radius: 0.2}}]},
      KHR_physics_rigid_bodies: {
        physicsMaterials: [{restitution: 0.2, staticFriction: 0.3, dynamicFriction: 0.2}]
      }
    }
  };
  const description = parseGLTFPhysics(source);
  expect(description.issues).toEqual([]);
  const world = createGLTFPhysicsWorld(description, {gravity: [0, 0, 0], publishPoses: true});
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  const properties = makeGLTFPhysicsProperties(world, description);
  const motion = '/nodes/0/extensions/KHR_physics_rigid_bodies/motion/';
  try {
    const animator = new GLTFAnimator({
      gltfNodeIdToNodeMap: new Map(),
      properties,
      animations: [
        {
          name: 'mass',
          channels: [
            {
              type: 'property',
              pointer: `${motion}mass`,
              sampler: {input: [0, 1], output: [[1], [3]], interpolation: 'LINEAR'}
            }
          ]
        }
      ]
    });
    animator.setTime(500);
    expect(properties.get(`${motion}mass`)).toEqual([2]);
    properties.set(`${motion}centerOfMass`, [0.25, 0, 0]);
    properties.set(`${motion}linearVelocity`, [1, 0, 0]);
    expect(world.getBodyParameters(0).centerOfMass).toEqual([0.5, 0, 0]);
    expect((await world.readState())[0].velocity).toEqual([2, 0, 0]);
    expect(properties.get(`${motion}centerOfMass`)).toEqual([0.25, 0, 0]);
    properties.set('/extensions/KHR_physics_rigid_bodies/physicsMaterials/0/restitution', [0.8]);
    expect(world.getColliderMaterial(0).restitution).toBe(0.8);
    expect(properties.set('/unknown', [1])).toBe(false);
    expect(properties.get('/unknown')).toBeUndefined();
    expect(source.nodes![0].extensions).toMatchObject({
      KHR_physics_rigid_bodies: {motion: {mass: 1}}
    });
  } finally {
    graph.destroy();
    world.destroy();
  }
});

it('animates shared implicit shape pointers with per-instance scale and automatic inertia', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const pointer = '/extensions/KHR_implicit_shapes/shapes/0/sphere/radius';
  const source: GLTFPhysicsDocument = {
    scenes: [{nodes: [0, 1]}],
    nodes: [1, 2].map((scale, index) => ({
      translation: [index * 5, 0, 0],
      scale: [scale, scale, scale],
      extensions: {KHR_physics_rigid_bodies: {motion: {mass: 1}, collider: {geometry: {shape: 0}}}}
    })),
    extensions: {KHR_implicit_shapes: {shapes: [{type: 'sphere', sphere: {radius: 0.5}}]}},
    animations: [{channels: [{target: {extensions: {KHR_animation_pointer: {pointer}}}}]}]
  };
  const description = parseGLTFPhysics(source, {propertyBindings: true});
  expect(description.issues).toEqual([]);
  const world = createGLTFPhysicsWorld(description, {gravity: [0, 0, 0]});
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  const properties = makeGLTFPhysicsProperties(world, description);
  try {
    const animator = new GLTFAnimator({
      gltfNodeIdToNodeMap: new Map(),
      properties,
      animations: [
        {
          name: 'grow',
          channels: [
            {
              type: 'property',
              pointer,
              sampler: {input: [0, 1], output: [[0.5], [1.5]], interpolation: 'LINEAR'}
            }
          ]
        }
      ]
    });
    animator.setTime(500);
    expect(properties.get(pointer)).toEqual([1]);
    expect(world.getColliderShape(0)).toEqual({type: 'sphere', radius: 1});
    expect(world.getColliderShape(1)).toEqual({type: 'sphere', radius: 2});
    expect(world.getBodyParameters(0).inertiaDiagonal![0]).toBeCloseTo(0.4, 5);
    expect(world.getBodyParameters(1).inertiaDiagonal![0]).toBeCloseTo(1.6, 5);
    expect(() => properties.set(pointer, [-1])).toThrow();
    expect(properties.get(pointer)).toEqual([1]);
    expect(source.extensions).toEqual({
      KHR_implicit_shapes: {shapes: [{type: 'sphere', sphere: {radius: 0.5}}]}
    });
  } finally {
    graph.destroy();
    world.destroy();
  }
});
