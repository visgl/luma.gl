// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils/device';
import {GPUCommandGraph} from '../../src/gpu-core';
import {
  GPURigidBodyWorld,
  GPURigidBodyCommandJournal,
  replayRigidBodyCommands,
  type GPURigidBodyJoint
} from '../../src/gpu-physics';

it.for([
  'distance',
  'fixed',
  'hinge',
  'slider'
] as const)('constrains a gravity-loaded %s with complete diagnostics', async (kind, context) => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const joint: GPURigidBodyJoint =
    kind === 'distance'
      ? {type: kind, first: 0, second: 1, distance: 2}
      : {
          type: kind,
          first: 0,
          second: 1,
          secondFrame: {position: [0, 0, 2]},
          ...(kind === 'slider' ? {limits: [-0.5, 0.5] as const} : {})
        };
  const world = new GPURigidBodyWorld({
    failurePolicy: 'rollback',
    iterations: 32,
    joints: [joint],
    gravity: [0, 0, -10],
    bodies: [
      {position: [0, 0, 3], mass: 0, shape: {type: 'box', halfExtents: [0.1, 0.1, 0.1]}},
      {position: [0, 0, 1], shape: {type: 'box', halfExtents: [0.3, 0.3, 0.3]}}
    ]
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  try {
    const encoder = device.createCommandEncoder();
    for (let step = 0; step < 180; step++) graph.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    const state = (await world.readState())[1];
    expect(state.position[2]).toBeCloseTo(kind === 'slider' ? 0.5 : 1, 2);
    expect((await world.readSimulationDiagnostics()).complete).toBe(true);
    expect(Math.abs(state.velocity[2])).toBeLessThan(0.05);
  } finally {
    graph.destroy();
    world.destroy();
  }
});

it('restores caches and diagnostics to reproduce a joint trajectory', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const world = new GPURigidBodyWorld({
    failurePolicy: 'rollback',
    gravity: [0, 0, 0],
    joints: [
      {
        type: 'hinge',
        first: 0,
        second: 1,
        limits: [-0.4, 0.4],
        motor: {velocity: 2, maximumForce: 0.5}
      }
    ],
    bodies: [
      {position: [0, 0, 0], mass: 0, shape: {type: 'sphere', radius: 0.1}},
      {position: [0, 0, 0], shape: {type: 'box', halfExtents: [1, 0.2, 0.2]}}
    ]
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  const advance = async () => {
    const encoder = device.createCommandEncoder();
    for (let step = 0; step < 120; step++) graph.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    return world.readState();
  };
  try {
    const capture = structuredClone(await world.captureState());
    const first = await advance();
    const diagnostics = await world.readSimulationDiagnostics();
    expect(2 * Math.atan2(first[1].orientation[2], first[1].orientation[3])).toBeCloseTo(0.4, 2);
    world.restoreState(capture);
    expect(await advance()).toEqual(first);
    expect(await world.readSimulationDiagnostics()).toEqual(diagnostics);
    // Reconstructed configurations may have different insertion order at every object level.
    const reordered = structuredClone(capture);
    reordered.props = {
      ...reordered.props,
      bodies: reordered.props.bodies.map(body => {
        const {position, ...properties} = body;
        return {...properties, position};
      })
    };
    reordered.props = {
      ...Object.fromEntries(Object.entries(reordered.props).reverse()),
      bodies: reordered.props.bodies
    };
    world.restoreState(reordered);
    expect(await advance()).toEqual(first);
    const incompatible = structuredClone(capture);
    incompatible.props.timeStep = 0.125;
    expect(() => world.restoreState(incompatible)).toThrow();
    expect(await world.readState()).toEqual(first);
    const invalid = structuredClone(capture);
    invalid.buffers[0].data = new Uint8Array(4);
    expect(() => world.restoreState(invalid)).toThrow();
    expect(await world.readState()).toEqual(first);
  } finally {
    graph.destroy();
    world.destroy();
  }
});

it.for([
  1, 32
])('caps slider motor force independently of %s iterations', async (iterations, context) => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const world = new GPURigidBodyWorld({
    iterations,
    timeStep: 0.1,
    gravity: [0, 0, 0],
    joints: [{type: 'slider', first: 0, second: 1, motor: {velocity: 10, maximumForce: 0.3}}],
    bodies: [
      {position: [0, 0, 0], mass: 0, shape: {type: 'sphere', radius: 0.2}},
      {position: [0, 0, 0], mass: 1, shape: {type: 'sphere', radius: 0.2}}
    ]
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  try {
    const encoder = device.createCommandEncoder();
    graph.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    const state = (await world.readState())[1];
    expect(state.velocity[2]).toBeCloseTo(0.03, 6);
    expect(state.angularVelocity).toEqual([0, 0, 0]);
  } finally {
    graph.destroy();
    world.destroy();
  }
});

it.for([
  false,
  true
])('preserves explicit connected-body collision policy %s and event replay', async (collideConnected, context) => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const world = new GPURigidBodyWorld({
    eventCapacity: 16,
    gravity: [0, 0, 0],
    joints: [{type: 'distance', first: 0, second: 1, distance: 0.8, collideConnected}],
    bodies: [
      {position: [0, 0, 0], shape: {type: 'sphere', radius: 0.5}},
      {position: [0.8, 0, 0], shape: {type: 'sphere', radius: 0.5}}
    ]
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  const advance = async () => {
    const encoder = device.createCommandEncoder();
    graph.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    return world.readContactEvents();
  };
  try {
    const capture = await world.captureState();
    const events = await advance();
    expect(events.events.length > 0).toBe(collideConnected);
    world.restoreState(capture);
    expect(await advance()).toEqual(events);
    const warmCapture = await world.captureState();
    const continuedEvents = await advance();
    const continuedState = await world.readState();
    world.restoreState(warmCapture);
    expect(await advance()).toEqual(continuedEvents);
    expect(await world.readState()).toEqual(continuedState);
  } finally {
    graph.destroy();
    world.destroy();
  }
});

it('retains a rotated hinge anchor with offset COM during contact-loaded motion', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const orientation: readonly [number, number, number, number] = [Math.SQRT1_2, 0, 0, Math.SQRT1_2];
  const world = new GPURigidBodyWorld({
    failurePolicy: 'rollback',
    iterations: 32,
    gravity: [0, 0, -10],
    joints: [
      {
        type: 'hinge',
        first: 0,
        second: 1,
        firstFrame: {orientation},
        secondFrame: {position: [0, 0, 2], orientation},
        limits: [-0.8, 0.8],
        motor: {velocity: 1, maximumForce: 8}
      }
    ],
    bodies: [
      {position: [0, 0, 3], mass: 0, shape: {type: 'sphere', radius: 0.1}},
      {
        position: [0, 0, 1],
        centerOfMass: [0.2, 0, 0],
        shape: {type: 'box', halfExtents: [0.3, 0.3, 0.5]}
      },
      {position: [1.1, 0, 0.5], shape: {type: 'box', halfExtents: [0.5, 0.5, 0.5]}},
      {position: [0, 0, -0.5], mass: 0, shape: {type: 'box', halfExtents: [5, 5, 0.5]}}
    ]
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  try {
    const encoder = device.createCommandEncoder();
    for (let step = 0; step < 240; step++) graph.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    const state = (await world.readState())[1];
    const [first, second, third, scalar] = state.orientation;
    // Independent quaternion matrix applied to the COM-relative attachment [-.2,0,2].
    const anchor = [
      state.position[0] -
        0.2 * (1 - 2 * (second * second + third * third)) +
        4 * (first * third + scalar * second),
      state.position[1] -
        0.4 * (first * second + scalar * third) +
        4 * (second * third - scalar * first),
      state.position[2] -
        0.4 * (first * third - scalar * second) +
        2 * (1 - 2 * (first * first + second * second))
    ];
    expect(Math.hypot(anchor[0], anchor[1], anchor[2] - 3)).toBeLessThan(0.05);
    expect(Math.abs(first) + Math.abs(third)).toBeLessThan(0.03);
    expect((await world.readSimulationDiagnostics()).complete).toBe(true);
  } finally {
    graph.destroy();
    world.destroy();
  }
});

it('moves an offset slider with its rotating kinematic axis', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const world = new GPURigidBodyWorld({
    timeStep: 0.01,
    gravity: [0, 0, 0],
    joints: [{type: 'slider', first: 0, second: 1}],
    bodies: [
      {
        position: [0, 0, 0],
        mode: 'kinematic',
        angularVelocity: [0, 0.5, 0],
        shape: {type: 'sphere', radius: 0.1}
      },
      {position: [0, 0, 2], shape: {type: 'sphere', radius: 0.2}}
    ]
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  try {
    const encoder = device.createCommandEncoder();
    graph.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    const state = (await world.readState())[1];
    expect(state.velocity[0]).toBeCloseTo(1, 4);
    expect(state.angularVelocity[1]).toBeCloseTo(0.5, 4);
  } finally {
    graph.destroy();
    world.destroy();
  }
});

it('settles a damped suspension at the gravity-loaded spring equilibrium', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const world = new GPURigidBodyWorld({
    gravity: [0, 0, -10],
    timeStep: 1 / 120,
    joints: [
      {type: 'distance', first: 0, second: 1, distance: 1, spring: {stiffness: 100, damping: 10}}
    ],
    bodies: [
      {position: [0, 0, 3], mass: 0, shape: {type: 'sphere', radius: 0.1}},
      {position: [0, 0, 1.5], mass: 1, shape: {type: 'sphere', radius: 0.1}}
    ]
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  try {
    const encoder = device.createCommandEncoder();
    for (let step = 0; step < 600; step++) graph.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    const body = (await world.readState())[1];
    expect(body.position[2]).toBeCloseTo(1.9, 2);
    expect(Math.abs(body.velocity[2])).toBeLessThan(0.02);
  } finally {
    graph.destroy();
    world.destroy();
  }
});

it('replays position drives and joint toggles from a warm checkpoint', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const world = new GPURigidBodyWorld({
    gravity: [0, 0, 0],
    timeStep: 1 / 120,
    joints: [
      {
        type: 'hinge',
        first: 0,
        second: 1,
        motor: {position: 0.6, stiffness: 40, damping: 8, maximumForce: 10}
      }
    ],
    bodies: [
      {position: [0, 0, 0], mass: 0, shape: {type: 'sphere', radius: 0.1}},
      {position: [0, 0, 0], shape: {type: 'box', halfExtents: [1, 0.2, 0.2]}}
    ]
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  const advance = async (steps = 1) => {
    for (let start = 0; start < steps; start += 20) {
      const encoder = device.createCommandEncoder();
      for (let step = start; step < Math.min(steps, start + 20); step++)
        graph.encode(encoder, {parameters: undefined});
      device.submit(encoder.finish());
    }
  };
  try {
    // No commands or assertions intervene during settling; retain all 240 simulation steps.
    await advance(240);
    const settled = (await world.readState())[1];
    expect(2 * Math.atan2(settled.orientation[2], settled.orientation[3])).toBeCloseTo(0.6, 2);
    const journal = new GPURigidBodyCommandJournal(world);
    await journal.begin();
    journal.apply(0, {type: 'joint-enabled', joint: 0, enabled: false});
    journal.apply(0, {type: 'impulse', body: 1, impulse: [1, 0, 0]});
    await advance();
    journal.apply(1, {type: 'joint-enabled', joint: 0, enabled: true});
    await advance();
    const expected = await world.readState();
    await replayRigidBodyCommands(world, journal.export(), 2, () => advance());
    expect(await world.readState()).toEqual(expected);
    expect(() => journal.apply(0, {type: 'joint-enabled', joint: 0, enabled: false})).toThrow();
  } finally {
    graph.destroy();
    world.destroy();
  }
});

it('publishes body-node matrices and rotated visual bounds with an offset center of mass', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const world = new GPURigidBodyWorld({
    gravity: [0, 0, 0],
    publicationBounds: [
      [
        [-1, -2, -3],
        [1, 2, 3]
      ]
    ],
    bodies: [
      {
        position: [4, 5, 6],
        centerOfMass: [1, 0, 0],
        orientation: [0, 0, Math.SQRT1_2, Math.SQRT1_2],
        shape: {type: 'box', halfExtents: [1, 2, 3]}
      }
    ]
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  try {
    const encoder = device.createCommandEncoder();
    graph.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    const matrices = new Float32Array((await world.poseMatrices!.readAsync()).buffer);
    const bounds = new Float32Array((await world.poseBounds!.readAsync()).buffer);
    [0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1, 0, 4, 5, 6, 1].forEach((value, index) =>
      expect(matrices[index]).toBeCloseTo(value, 5)
    );
    [2, 4, 3, 0, 6, 6, 9, 0].forEach((value, index) => expect(bounds[index]).toBeCloseTo(value, 5));
  } finally {
    graph.destroy();
    world.destroy();
  }
});

it('sleeps passive connected bodies and wakes their joint island on impulse', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const world = new GPURigidBodyWorld({
    gravity: [0, 0, 0],
    timeStep: 1 / 60,
    sleepAfter: 0.1,
    joints: [{type: 'distance', first: 0, second: 1, distance: 2}],
    bodies: [
      {position: [0, 0, 0], shape: {type: 'sphere', radius: 0.1}},
      {position: [2, 0, 0], shape: {type: 'sphere', radius: 0.1}}
    ]
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  try {
    const encoder = device.createCommandEncoder();
    for (let tick = 0; tick < 30; tick++) graph.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    expect((await world.readState()).map(body => body.sleeping)).toEqual([true, true]);
    world.applyImpulse(0, [1, 0, 0]);
    const resumed = device.createCommandEncoder();
    graph.encode(resumed, {parameters: undefined});
    device.submit(resumed.finish());
    const states = await world.readState();
    expect(states.map(body => body.sleeping)).toEqual([false, false]);
    expect(states[0].velocity[0]).toBeCloseTo(0.5, 4);
    expect(states[1].velocity[0]).toBeCloseTo(0.5, 4);
  } finally {
    graph.destroy();
    world.destroy();
  }
});

it('combines dormant joints with extended contacts, CCD and trigger sampling', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const world = new GPURigidBodyWorld({
    failurePolicy: 'rollback',
    gravity: [0, 0, 0],
    continuous: {bodies: [0]},
    triggers: [{colliders: [2], targets: [0]}],
    joints: [{type: 'distance', first: 0, second: 1, distance: 3, enabled: false}],
    bodies: [
      {position: [0, 0, 0], shape: {type: 'sphere', radius: 0.2}},
      {
        position: [3, 0, 0],
        shape: {type: 'capsule', height: 1, radiusTop: 0.2, radiusBottom: 0.2}
      },
      {
        position: [0, 0, 0],
        mode: 'static',
        colliders: [{shape: {type: 'sphere', radius: 1}, isTrigger: true}]
      }
    ]
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  try {
    const encoder = device.createCommandEncoder();
    graph.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    expect((await world.readSimulationDiagnostics()).complete).toBe(true);
    expect((await world.readTriggerEvents()).events.map(event => event.phase)).toEqual(['enter']);
    expect((await world.readState())[0].position).toEqual([0, 0, 0]);
  } finally {
    graph.destroy();
    world.destroy();
  }
}, 120000);
