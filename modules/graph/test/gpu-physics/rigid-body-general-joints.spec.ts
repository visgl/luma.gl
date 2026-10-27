// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {GPUCommandGraph} from '../../src/gpu-core';
import {GPURigidBodyWorld, type GPURigidBodyJoint} from '../../src/gpu-physics';
import {ScenegraphPhysicsProperties} from '@luma.gl/engine/physics';

it.for([
  1, 2, 3
])('holds a loaded %s-dimensional zero-radius attachment', async (dimensions, context) => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const world = new GPURigidBodyWorld({
    timeStep: 1 / 120,
    iterations: 16,
    gravity: [4, 3, 2],
    failurePolicy: 'rollback',
    bodies: [
      {mode: 'static', position: [0, 0, 0], colliders: []},
      {position: [0, 0, 0], mass: 1, shape: {type: 'sphere', radius: 0.2}}
    ],
    joints: [
      {type: 'general', first: 0, second: 1, axes: [0, 1, 2].slice(0, dimensions), maximum: 0}
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
    for (let axis = 0; axis < dimensions; axis++)
      expect(Math.abs(state.position[axis])).toBeLessThan(0.01);
    expect((await world.readSimulationDiagnostics()).complete).toBe(true);
  } finally {
    graph.destroy();
    world.destroy();
  }
});

it.for([
  'force',
  'acceleration'
] as const)('qualifies %s drives against an implicit spring reference', async (mode, context) => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const timeStep = 1 / 120;
  const mass = 4;
  const stiffness = 3;
  const damping = 2;
  const joint: GPURigidBodyJoint = {
    type: 'general',
    first: 0,
    second: 1,
    axes: [0],
    drive: {mode, positionTarget: 1, stiffness, damping}
  };
  const world = new GPURigidBodyWorld({
    timeStep,
    iterations: 8,
    gravity: [0, 0, 0],
    linearDamping: 0,
    joints: [joint],
    bodies: [
      {mode: 'static', position: [0, 0, 0], colliders: []},
      {position: [0, 0, 0], mass, shape: {type: 'sphere', radius: 0.2}}
    ]
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  try {
    let position = 0;
    let velocity = 0;
    const inverseMass = mode === 'force' ? 1 / mass : 1;
    const encoder = device.createCommandEncoder();
    for (let step = 0; step < 120; step++) {
      // Implicit drive solve followed by semi-implicit position integration.
      velocity +=
        (timeStep *
          (stiffness * (1 - position - timeStep * velocity) - damping * velocity) *
          inverseMass) /
        (1 + timeStep * (damping + timeStep * stiffness) * inverseMass);
      position += velocity * timeStep;
      graph.encode(encoder, {parameters: undefined});
    }
    device.submit(encoder.finish());
    const state = (await world.readState())[1];
    expect(state.position[0]).toBeCloseTo(position, 3);
    expect(state.velocity[0]).toBeCloseTo(velocity, 3);
  } finally {
    graph.destroy();
    world.destroy();
  }
});

it('updates live drive targets and restores their captured state without rebuilding shaders', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const joint: GPURigidBodyJoint = {
    type: 'general',
    first: 0,
    second: 1,
    axes: [0],
    drive: {mode: 'force', velocityTarget: 1, damping: 10, maximumForce: 2}
  };
  const world = new GPURigidBodyWorld({
    gravity: [0, 0, 0],
    joints: [joint],
    bodies: [
      {mode: 'static', position: [0, 0, 0], colliders: []},
      {mass: 1, position: [0, 0, 0], shape: {type: 'sphere', radius: 0.2}}
    ]
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  const advance = async () => {
    const encoder = device.createCommandEncoder();
    for (let step = 0; step < 60; step++) graph.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    return (await world.readState())[1];
  };
  try {
    const initial = await world.captureState();
    const positive = await advance();
    expect(positive.velocity[0]).toBeGreaterThan(0.1);
    world.restoreState(initial);
    world.setJointParameters(0, {...joint, drive: {...joint.drive, velocityTarget: -1}});
    const negative = await advance();
    expect(negative.velocity[0]).toBeCloseTo(-positive.velocity[0], 4);
    world.restoreState(initial);
    expect((await advance()).velocity[0]).toBeCloseTo(positive.velocity[0], 4);
  } finally {
    graph.destroy();
    world.destroy();
  }
});

it('uses the twist coordinate gradient when an angular drive has a large swing offset', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const timeStep = 1 / 120;
  const world = new GPURigidBodyWorld({
    gravity: [0, 0, 0],
    timeStep,
    iterations: 1,
    bodies: [
      {position: [0, 0, 0], mode: 'static', colliders: []},
      {
        position: [0, 0, 0],
        orientation: [0, Math.SQRT1_2, 0, Math.SQRT1_2],
        inertiaDiagonal: [1, 1, 1],
        shape: {type: 'sphere', radius: 0.2}
      }
    ],
    joints: [
      {
        type: 'general',
        first: 0,
        second: 1,
        angular: true,
        axes: [0],
        drive: {mode: 'force', velocityTarget: 1, damping: 10}
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
    const state = (await world.readState())[1];
    // d(twistX)/d(rotation) = [1, 0, -1] at a 90-degree Y swing.
    const impulse = (timeStep * 10) / (1 + timeStep * 10 * 2);
    expect(state.angularVelocity[0]).toBeCloseTo(impulse, 4);
    expect(state.angularVelocity[1]).toBeCloseTo(0, 4);
    expect(state.angularVelocity[2]).toBeCloseTo(-impulse, 4);
  } finally {
    graph.destroy();
    world.destroy();
  }
});

it.for([
  1, 2, 3
])('enforces the %s-dimensional angular limit metric', async (dimensions, context) => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const world = new GPURigidBodyWorld({
    gravity: [0, 0, 0],
    timeStep: 1 / 120,
    bodies: [
      {position: [0, 0, 0], mode: 'static', colliders: []},
      {
        position: [0, 0, 0],
        orientation: [Math.sin(0.6), 0, 0, Math.cos(0.6)],
        shape: {type: 'sphere', radius: 0.2}
      }
    ],
    joints: [
      {
        type: 'general',
        first: 0,
        second: 1,
        axes: [0, 1, 2].slice(0, dimensions),
        angular: true,
        maximum: 0.4
      }
    ]
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  try {
    const encoder = device.createCommandEncoder();
    for (let step = 0; step < 240; step++) graph.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    const rotation = (await world.readState())[1].orientation;
    const angle =
      dimensions === 1
        ? 2 * Math.atan2(rotation[0], rotation[3])
        : dimensions === 2
          ? Math.acos(Math.max(-1, Math.min(1, 1 - 2 * (rotation[0] ** 2 + rotation[1] ** 2))))
          : 2 * Math.atan2(Math.hypot(...rotation.slice(0, 3)), Math.abs(rotation[3]));
    expect(angle).toBeLessThanOrEqual(0.401);
    expect(Math.hypot(...rotation)).toBeCloseTo(1, 5);
    expect((await world.readSimulationDiagnostics()).complete).toBe(true);
  } finally {
    graph.destroy();
    world.destroy();
  }
});

it('settles a compliant general limit at its independent gravity-load equilibrium', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const world = new GPURigidBodyWorld({
    gravity: [1, 0, 0],
    timeStep: 1 / 120,
    bodies: [
      {position: [0, 0, 0], mode: 'static', colliders: []},
      {position: [0, 0, 0], mass: 1, shape: {type: 'sphere', radius: 0.2}}
    ],
    joints: [
      {type: 'general', first: 0, second: 1, axes: [0], maximum: 0, stiffness: 20, damping: 4}
    ]
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  try {
    const encoder = device.createCommandEncoder();
    for (let step = 0; step < 600; step++) graph.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    const state = (await world.readState())[1];
    expect(state.position[0]).toBeCloseTo(1 / 20, 2);
    expect(Math.abs(state.velocity[0])).toBeLessThan(0.01);
  } finally {
    graph.destroy();
    world.destroy();
  }
});

it.for([
  'force',
  'acceleration'
] as const)('caps %s drive impulses independently of solver iterations', async (mode, context) => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  for (const angular of [false, true])
    for (const iterations of [1, 16]) {
      const world = new GPURigidBodyWorld({
        gravity: [0, 0, 0],
        timeStep: 1 / 120,
        iterations,
        bodies: [
          {mode: 'static', position: [0, 0, 0], colliders: []},
          {
            position: [0, 0, 0],
            mass: 4,
            inertiaDiagonal: [2, 2, 2],
            shape: {type: 'sphere', radius: 0.2}
          }
        ],
        joints: [
          {
            type: 'general',
            first: 0,
            second: 1,
            axes: [0],
            angular,
            drive: {mode, velocityTarget: 100, damping: 1000, maximumForce: 3}
          }
        ]
      });
      const definition = new GPUCommandGraph(device);
      world.addToGraph(definition);
      const graph = await definition.compileAsync();
      try {
        const encoder = device.createCommandEncoder();
        for (let step = 0; step < 60; step++) graph.encode(encoder, {parameters: undefined});
        device.submit(encoder.finish());
        const state = (await world.readState())[1];
        // Force/torque cap is physical even when the drive uses acceleration gain scaling.
        expect((angular ? state.angularVelocity : state.velocity)[0]).toBeCloseTo(
          (3 * 0.5) / (angular ? 2 : 4),
          4
        );
        expect((await world.readSimulationDiagnostics()).complete).toBe(true);
      } finally {
        graph.destroy();
        world.destroy();
      }
    }
});

it.for([
  1, 2, 3
])('resolves a %s-dimensional angular limit from a half-turn', async (dimensions, context) => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const world = new GPURigidBodyWorld({
    gravity: [0, 0, 0],
    timeStep: 1 / 120,
    bodies: [
      {mode: 'static', position: [0, 0, 0], colliders: []},
      {position: [0, 0, 0], orientation: [1, 0, 0, 0], shape: {type: 'sphere', radius: 0.2}}
    ],
    joints: [
      {
        type: 'general',
        first: 0,
        second: 1,
        axes: [0, 1, 2].slice(0, dimensions),
        angular: true,
        maximum: 0.3,
        minimum: dimensions === 1 ? -0.3 : 0
      }
    ]
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  try {
    const encoder = device.createCommandEncoder();
    for (let step = 0; step < 480; step++) graph.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    const state = (await world.readState())[1];
    const angle =
      2 * Math.atan2(Math.hypot(...state.orientation.slice(0, 3)), Math.abs(state.orientation[3]));
    expect(angle).toBeLessThan(0.31);
    expect((await world.readSimulationDiagnostics()).complete).toBe(true);
  } finally {
    graph.destroy();
    world.destroy();
  }
});

it.for([
  2, 3
])('enforces nonzero inner and outer radii for a %s-dimensional linear limit', async (dimensions, context) => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const world = new GPURigidBodyWorld({
    gravity: [0, 0, 0],
    timeStep: 1 / 120,
    bodies: [
      {mode: 'static', position: [0, 0, 0], colliders: []},
      {position: [0.1, 0.1, 0.1], shape: {type: 'sphere', radius: 0.1}}
    ],
    joints: [
      {
        type: 'general',
        first: 0,
        second: 1,
        axes: [0, 1, 2].slice(0, dimensions),
        minimum: 1,
        maximum: 2
      }
    ]
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  try {
    const encoder = device.createCommandEncoder();
    for (let step = 0; step < 480; step++) graph.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    const radius = Math.hypot(...(await world.readState())[1].position.slice(0, dimensions));
    expect(radius).toBeGreaterThan(0.999);
    expect(radius).toBeLessThan(2.001);
  } finally {
    graph.destroy();
    world.destroy();
  }
});

it.for([
  1, 2, 3
])('balances a capped torque against a compliant %s-dimensional angular limit', async (dimensions, context) => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const world = new GPURigidBodyWorld({
    gravity: [0, 0, 0],
    timeStep: 1 / 120,
    bodies: [
      {mode: 'static', position: [0, 0, 0], colliders: []},
      {position: [0, 0, 0], inertiaDiagonal: [1, 1, 1], shape: {type: 'sphere', radius: 0.1}}
    ],
    joints: [
      {
        type: 'general',
        first: 0,
        second: 1,
        axes: [0, 1, 2].slice(0, dimensions),
        angular: true,
        maximum: 0,
        stiffness: 20,
        damping: 4
      },
      {
        type: 'general',
        first: 0,
        second: 1,
        axes: [0],
        angular: true,
        drive: {mode: 'force', maximumForce: 1, velocityTarget: 100, damping: 100}
      }
    ]
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  try {
    const encoder = device.createCommandEncoder();
    for (let step = 0; step < 600; step++) graph.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    const state = (await world.readState())[1];
    expect(2 * Math.atan2(state.orientation[0], state.orientation[3])).toBeCloseTo(1 / 20, 2);
    expect(Math.abs(state.angularVelocity[0])).toBeLessThan(0.01);
  } finally {
    graph.destroy();
    world.destroy();
  }
});

it.for([
  2, 3
])('uses the radial spring metric for a large %s-dimensional zero-cone error', async (dimensions, context) => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const axis = [
    1 / Math.sqrt(dimensions),
    1 / Math.sqrt(dimensions),
    dimensions === 3 ? 1 / Math.sqrt(3) : 0
  ];
  const angle = 1.2;
  const timeStep = 1 / 120;
  const world = new GPURigidBodyWorld({
    gravity: [0, 0, 0],
    timeStep,
    iterations: 1,
    bodies: [
      {mode: 'static', position: [0, 0, 0], colliders: []},
      {
        position: [0, 0, 0],
        orientation: [
          axis[0] * Math.sin(angle / 2),
          axis[1] * Math.sin(angle / 2),
          axis[2] * Math.sin(angle / 2),
          Math.cos(angle / 2)
        ],
        inertiaDiagonal: [1, 1, 1],
        shape: {type: 'sphere', radius: 0.1}
      }
    ],
    joints: [
      {
        type: 'general',
        first: 0,
        second: 1,
        axes: [0, 1, 2].slice(0, dimensions),
        angular: true,
        maximum: 0,
        stiffness: 2,
        damping: 0
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
    const velocity = (await world.readState())[1].angularVelocity;
    const speed = (-timeStep * 2 * angle) / (1 + timeStep * timeStep * 2);
    for (let component = 0; component < 3; component++)
      expect(velocity[component]).toBeCloseTo(speed * axis[component], 5);
  } finally {
    graph.destroy();
    world.destroy();
  }
});

it('keeps disabled joints disabled through property edits and checkpoint restoration', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const world = new GPURigidBodyWorld({
    gravity: [0, 0, 0],
    joints: [
      {
        type: 'general',
        first: 0,
        second: 1,
        axes: [0],
        drive: {velocityTarget: 1, damping: 10, maximumForce: 2}
      }
    ],
    bodies: [
      {mode: 'static', position: [0, 0, 0], colliders: []},
      {position: [0, 0, 0], shape: {type: 'sphere', radius: 0.2}}
    ]
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  const checkpoint = world.createGPUCheckpoint();
  const properties = new ScenegraphPhysicsProperties(
    world,
    new Map([['drive', {type: 'joint', joints: [0], property: 'velocityTarget', drive: true}]])
  );
  const advance = async () => {
    const encoder = device.createCommandEncoder();
    for (let step = 0; step < 10; step++) graph.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    return (await world.readState())[1];
  };
  try {
    world.setJointEnabled(0, false);
    expect(world.getJointParameters(0).enabled).toBe(false);
    properties.set('drive', [2]);
    expect(world.getJointParameters(0).enabled).toBe(false);
    expect((await advance()).velocity[0]).toBe(0);
    checkpoint.save();
    world.setJointEnabled(0, true);
    expect(world.getJointParameters(0).enabled).toBe(true);
    expect((await advance()).velocity[0]).toBeGreaterThan(0);
    checkpoint.restore();
    expect(world.getJointParameters(0).enabled).toBe(false);
    properties.set('drive', [3]);
    expect((await advance()).velocity[0]).toBe(0);
  } finally {
    checkpoint.destroy();
    graph.destroy();
    world.destroy();
  }
});
