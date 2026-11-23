// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {GPUCommandGraph} from '../../src/gpu-core';
import {GPUArticulationTree, type GPUArticulationLink} from '../../src/gpu-physics';

const rod: GPUArticulationLink = {
  id: 'rod',
  parent: -1,
  parentAnchor: [0, 0, 0],
  childAnchor: [-0.5, 0, 0],
  axis: [0, 1, 0],
  mass: 1,
  inertia: [0.02, 1 / 12, 1 / 12]
};

it('rejects a cyclic topology, invalid inertia and duplicate drive identities', () => {
  expect(() => new GPUArticulationTree({links: [{...rod, parent: 0}]})).toThrow();
  expect(() => new GPUArticulationTree({links: [{...rod, inertia: [0, 1, 1]}]})).toThrow();
  expect(() => new GPUArticulationTree({links: [rod, {...rod, parent: 0}]})).toThrow();
});

it('couples both branches through their shared moving parent', async context => {
  const device = await getWebGPUTestDevice('core');
  if (!device) return context.skip('WebGPU unavailable');
  const timeStep = 1 / 120;
  // At zero angle both branches extend a meter past the root link, offset in Y.
  // In the Y hinge coordinates M00=5, M01=M02=5/6, M11=M22=1/3, M12=0.
  const child = (id: string, y: number): GPUArticulationLink => ({
    ...rod,
    id,
    parent: 0,
    parentAnchor: [0.5, y, 0]
  });
  const tree = new GPUArticulationTree({
    links: [rod, child('left', -0.2), child('right', 0.2)],
    gravity: [0, 0, 0],
    timeStep
  });
  const graph = new GPUCommandGraph(device);
  tree.addToGraph(graph);
  const compiled = await graph.compileAsync();
  try {
    tree.setDrive('left', {angle: 1, stiffness: 100, damping: 0, maximumTorque: 1});
    const encoder = device.createCommandEncoder();
    compiled.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    const [parent, left, right] = await tree.readState();
    // M qdd = [0,1,0]. Root acceleration = -3; the passive sibling responds at +7.5 relative.
    expect(parent.angularVelocity[1] / timeStep).toBeCloseTo(-3, 3);
    expect((right.angularVelocity[1] - parent.angularVelocity[1]) / timeStep).toBeCloseTo(7.5, 3);
    expect((left.angularVelocity[1] - parent.angularVelocity[1]) / timeStep).toBeCloseTo(10.5, 3);
    expect(await tree.readTorque('left')).toBeCloseTo(1, 5);
    expect(await tree.readTorque('right')).toBe(0);
    expect(await tree.readSimulationDiagnostics()).toEqual({steps: 1, complete: true});
  } finally {
    compiled.destroy();
    tree.destroy();
  }
});

it('matches the first pendulum acceleration and conserves energy over a free swing', async context => {
  const device = await getWebGPUTestDevice('core');
  if (!device) return context.skip('WebGPU unavailable');
  const timeStep = 1 / 240;
  const tree = new GPUArticulationTree({links: [rod], gravity: [0, 0, -9.81], timeStep});
  const graph = new GPUCommandGraph(device);
  tree.addToGraph(graph);
  const compiled = await graph.compileAsync();
  const advance = (steps: number) => {
    const encoder = device.createCommandEncoder();
    for (let index = 0; index < steps; index++) compiled.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
  };
  try {
    advance(1);
    const [initial] = await tree.readState();
    expect(initial.angularVelocity[1] / timeStep).toBeCloseTo(9.81 * 1.5, 4);
    for (let interval = 0; interval < 20; interval++) {
      advance(48);
      const [body] = await tree.readState();
      const energy = 9.81 * body.position[2] + body.angularVelocity[1] ** 2 / 6;
      expect(Math.abs(energy)).toBeLessThan(0.09);
      expect(Math.hypot(...body.position)).toBeCloseTo(0.5, 5);
    }
  } finally {
    compiled.destroy();
    tree.destroy();
  }
});

it('transports welded offsets and nonparallel hinge axes in the moving parent frame', async context => {
  const device = await getWebGPUTestDevice('core');
  if (!device) return context.skip('WebGPU unavailable');
  // A root spinning about Z carries a Y-axis bearing whose child has a welded tool.
  const links: GPUArticulationLink[] = [
    {...rod, id: 'turntable', axis: [0, 0, 1], angle: Math.PI / 2, speed: 0.5},
    {...rod, id: 'bearing', parent: 0, parentAnchor: [0.5, 0, 0], angle: 0.3},
    {
      ...rod,
      id: 'tool',
      parent: 1,
      parentAnchor: [0.5, 0, 0],
      childAnchor: [0, 0, 0],
      axis: undefined,
      restOrientation: [Math.SQRT1_2, 0, 0, Math.SQRT1_2]
    }
  ];
  const tree = new GPUArticulationTree({links, base: [2, 3, 4], gravity: [0, 0, 0]});
  const definition = new GPUCommandGraph(device);
  tree.addToGraph(definition);
  const graph = await definition.compileAsync();
  try {
    const encoder = device.createCommandEncoder();
    for (let index = 0; index < 96; index++) graph.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    const [turntable, bearing, tool] = await tree.readState();
    const [x, y, z, w] = bearing.orientation;
    const tip = bearing.position.map(
      (value, index) => value + [0.5 - y * y - z * z, x * y + w * z, x * z - w * y][index]
    );
    for (let axis = 0; axis < 3; axis++) {
      expect(tool.position[axis]).toBeCloseTo(tip[axis], 5);
      expect(tool.angularVelocity[axis]).toBeCloseTo(bearing.angularVelocity[axis], 5);
    }
    expect(turntable.position[0]).toBeLessThan(2);
    expect(await tree.readSimulationDiagnostics()).toEqual({steps: 96, complete: true});
  } finally {
    graph.destroy();
    tree.destroy();
  }
});
