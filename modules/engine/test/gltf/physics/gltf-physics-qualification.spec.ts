// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {GLTFScenegraph} from '@loaders.gl/scene/gltf';
import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {GPUCommandGraph} from '@luma.gl/graph/gpu-core';
import {
  parseGLTFPhysics,
  createGLTFPhysicsWorld,
  makeGLTFPhysicsMeshResolver
} from '../../../src/gltf/physics';
import {makePhysicsDocument} from './physics-fixtures';

it('qualifies imported reflected nonuniform hierarchy and disabled collision on GPU', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const source = makePhysicsDocument([
    {translation: [10, 0, 0], scale: [-2, 3, 4], children: [1, 2]},
    {
      translation: [1, 0, 0],
      extensions: {KHR_physics_rigid_bodies: {collider: {geometry: {shape: 1}}}}
    },
    {
      translation: [-3, 0, 0],
      scale: [0, 0, 0],
      extensions: {KHR_physics_rigid_bodies: {collider: {geometry: {shape: 1}}}}
    }
  ]);
  const description = parseGLTFPhysics(source);
  expect(description.issues).toEqual([]);
  const world = createGLTFPhysicsWorld(description, {enableQueries: true});
  world.addToGraph(new GPUCommandGraph(device));
  try {
    // Reflected child center is 8; scaled half width is 1. Disabled child would be at 16.
    const hit = await world.raycast({origin: [4, 0, 0], direction: [1, 0, 0], maximumDistance: 20});
    expect(hit.complete).toBe(true);
    expect(hit.hits).toHaveLength(1);
    expect(hit.hits[0].distance).toBeCloseTo(3, 4);
    const disabled = await world.raycast({
      origin: [14, 0, 0],
      direction: [1, 0, 0],
      maximumDistance: 4
    });
    expect(disabled.complete).toBe(true);
    expect(disabled.hits).toHaveLength(0);
  } finally {
    world.destroy();
  }
});

it('qualifies off-scene geometry node descendants against GPU surface queries', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const source = makePhysicsDocument([
    {
      translation: [10, 0, 0],
      extensions: {KHR_physics_rigid_bodies: {collider: {geometry: {node: 1, convexHull: false}}}}
    },
    {translation: [100, 0, 0], children: [2]},
    {translation: [0, 2, 0], mesh: 0}
  ]);
  const description = parseGLTFPhysics(source, {
    resolveNodeMeshGeometry: () => ({positions: [-1, 0, -1, 1, 0, -1, 0, 0, 1], indices: [0, 2, 1]})
  });
  expect(description.issues).toEqual([]);
  const world = createGLTFPhysicsWorld(description, {enableQueries: true});
  world.addToGraph(new GPUCommandGraph(device));
  try {
    const hit = await world.raycast({
      origin: [10, 5, 0],
      direction: [0, -1, 0],
      maximumDistance: 8
    });
    expect(hit.complete).toBe(true);
    expect(hit.hits).toHaveLength(1);
    expect(hit.hits[0].distance).toBeCloseTo(3, 4);
    const miss = await world.raycast({
      origin: [110, 5, 0],
      direction: [0, -1, 0],
      maximumDistance: 8
    });
    expect(miss.complete).toBe(true);
    expect(miss.hits).toHaveLength(0);
  } finally {
    world.destroy();
  }
});

it('qualifies imported initial linear angular velocity and signed gravity against analytic motion', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const source = makePhysicsDocument([
    {
      extensions: {
        KHR_physics_rigid_bodies: {
          motion: {
            mass: 1,
            linearVelocity: [2, 0, 0],
            angularVelocity: [0, 1, 0],
            gravityFactor: -1
          },
          collider: {geometry: {shape: 0}}
        }
      }
    }
  ]);
  const description = parseGLTFPhysics(source);
  expect(description.issues).toEqual([]);
  const timeStep = 1 / 120;
  const world = createGLTFPhysicsWorld(description, {timeStep, sleepAfter: 0});
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  try {
    const encoder = device.createCommandEncoder();
    for (let step = 0; step < 30; step++) graph.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    const [state] = await world.readState();
    expect(state.position[0]).toBeCloseTo(0.5, 4);
    expect(state.velocity[1]).toBeCloseTo(9.81 / 4, 4);
    expect(state.position[1]).toBeCloseTo((9.81 * timeStep ** 2 * 30 * 31) / 2, 4);
    expect(state.angularVelocity[1]).toBeCloseTo(1, 4);
    expect(state.orientation[1]).toBeCloseTo(Math.sin(0.25 / 2), 3);
    expect((await world.readSimulationDiagnostics()).complete).toBe(true);
  } finally {
    graph.destroy();
    world.destroy();
  }
});

it('qualifies initial morph and skin deformation through imported GPU collision geometry', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const data = [
    new Float32Array([-1, 0, -1, 0, 0, 1, 1, 0, -1]),
    new Float32Array([0, 1, 0, 0, 1, 0, 0, 1, 0]),
    new Uint8Array(12),
    new Uint8Array([255, 0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0])
  ];
  const scenegraph = new GLTFScenegraph({
    json: {
      asset: {version: '2.0'},
      scene: 0,
      scenes: [{nodes: [0]}],
      buffers: data.map(buffer => ({byteLength: buffer.byteLength})),
      bufferViews: data.map((buffer, index) => ({buffer: index, byteLength: buffer.byteLength})),
      accessors: [
        {bufferView: 0, componentType: 5126, type: 'VEC3', count: 3},
        {bufferView: 1, componentType: 5126, type: 'VEC3', count: 3},
        {bufferView: 2, componentType: 5121, type: 'VEC4', count: 3},
        {bufferView: 3, componentType: 5121, type: 'VEC4', count: 3, normalized: true}
      ],
      meshes: [
        {
          primitives: [
            {attributes: {POSITION: 0, JOINTS_0: 2, WEIGHTS_0: 3}, targets: [{POSITION: 1}]}
          ]
        }
      ],
      skins: [{joints: [2]}],
      nodes: [
        {
          extensions: {
            KHR_physics_rigid_bodies: {collider: {geometry: {node: 1, convexHull: false}}}
          }
        },
        {mesh: 0, skin: 0, weights: [1]},
        {translation: [0, 2, 0]}
      ]
    },
    buffers: data.map(buffer => ({
      arrayBuffer: buffer.buffer,
      byteOffset: 0,
      byteLength: buffer.byteLength
    }))
  });
  const description = parseGLTFPhysics(scenegraph.json, {
    resolveNodeMeshGeometry: makeGLTFPhysicsMeshResolver(scenegraph)
  });
  expect(description.issues).toEqual([]);
  const world = createGLTFPhysicsWorld(description, {enableQueries: true});
  world.addToGraph(new GPUCommandGraph(device));
  try {
    // Morph raises the triangle by one, then the joint raises it by two more.
    const hit = await world.raycast({origin: [0, 5, 0], direction: [0, -1, 0], maximumDistance: 6});
    expect(hit.complete).toBe(true);
    expect(hit.hits).toHaveLength(1);
    expect(hit.hits[0].distance).toBeCloseTo(2, 4);
  } finally {
    world.destroy();
  }
});
