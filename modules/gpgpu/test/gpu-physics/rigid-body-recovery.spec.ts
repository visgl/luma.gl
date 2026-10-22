// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, it} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {GPURigidBodyRecoveryRunner, type GPURigidBodyWorldProps} from '../../src/gpu-physics';

function makeProps(maximumPairs: number): GPURigidBodyWorldProps {
  return {
    broadPhase: 'hierarchical-grid',
    maximumPairs,
    gravity: [0, 0, 0],
    bodies: Array.from({length: 4}, (_, index) => ({
      position: [index * 0.7, 0, 0],
      shape: {type: 'sphere', radius: 0.5},
      restitution: 0,
      friction: 0
    }))
  };
}
it('automatically grows pair capacity and replays to the generous-budget result', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const runner = await GPURigidBodyRecoveryRunner.create(device, makeProps(1));
  const reference = await GPURigidBodyRecoveryRunner.create(device, makeProps(64));
  try {
    const commands = [{type: 'impulse' as const, body: 0, impulse: [0.1, 0, 0] as const}];
    const recovered = await runner.advance(commands);
    expect(recovered.accepted).toBe(true);
    expect(recovered.retries).toBeGreaterThan(0);
    expect(recovered.tick).toBe(1);
    expect((await reference.advance(commands)).accepted).toBe(true);
    const actual = await runner.world.readState();
    const expected = await reference.world.readState();
    for (let body = 0; body < actual.length; body++)
      for (let axis = 0; axis < 3; axis++) {
        expect(actual[body].position[axis]).toBeCloseTo(expected[body].position[axis], 4);
        expect(actual[body].velocity[axis]).toBeCloseTo(expected[body].velocity[axis], 4);
      }
    expect((await runner.advance()).accepted).toBe(true);
    expect(runner.tick).toBe(2);
  } finally {
    runner.destroy();
    reference.destroy();
  }
}, 120000);

it('rejects without advancing the tick when recovery retries are exhausted', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const runner = await GPURigidBodyRecoveryRunner.create(device, makeProps(1), {maximumRetries: 0});
  try {
    const initial = await runner.world.readState();
    expect(await runner.advance([{type: 'impulse', body: 0, impulse: [3, 0, 0]}])).toMatchObject({
      accepted: false,
      tick: 0,
      retries: 0
    });
    expect(await runner.world.readState()).toEqual(initial);
    await expect(runner.advance()).rejects.toThrow('unavailable');
  } finally {
    runner.destroy();
  }
});

it('bounds history and allocation before accepting work', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  await expect(
    GPURigidBodyRecoveryRunner.create(device, makeProps(64), {maximumOwnedBufferBytes: 1})
  ).rejects.toThrow('memory budget');
  const runner = await GPURigidBodyRecoveryRunner.create(device, makeProps(64), {
    maximumReplayTicks: 1
  });
  try {
    await runner.advance();
    await expect(runner.advance()).rejects.toThrow('unavailable');
    expect(runner.tick).toBe(1);
  } finally {
    runner.destroy();
  }
});

it('replays earlier ticks and kinematic targets after a later capacity failure', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const props: GPURigidBodyWorldProps = {
    broadPhase: 'hierarchical-grid',
    maximumPairs: 1,
    gravity: [0, 0, 0],
    bodies: Array.from({length: 4}, (_, index) => ({
      mode: index === 0 ? 'dynamic' : 'kinematic',
      position: [index * 3, 0, 0],
      shape: {type: 'sphere', radius: 0.5}
    }))
  };
  const runner = await GPURigidBodyRecoveryRunner.create(device, props);
  const reference = await GPURigidBodyRecoveryRunner.create(device, {...props, maximumPairs: 64});
  try {
    await runner.advance();
    await reference.advance();
    const commands = [1, 2, 3].map(body => ({
      type: 'kinematic-target' as const,
      body,
      position: [body * 0.2, 0, 0] as const,
      orientation: [0, 0, 0, 1] as const
    }));
    await runner.advance(commands);
    await reference.advance(commands);
    const result = await runner.advance();
    await reference.advance();
    expect(result).toMatchObject({accepted: true, tick: 3});
    expect(result.retries).toBeGreaterThan(0);
    expect(result.replayedTicks).toBeGreaterThan(1);
    const actual = await runner.world.readState(),
      expected = await reference.world.readState();
    for (let body = 0; body < actual.length; body++)
      for (let axis = 0; axis < 3; axis++)
        expect(actual[body].position[axis]).toBeCloseTo(expected[body].position[axis], 4);
  } finally {
    runner.destroy();
    reference.destroy();
  }
}, 120000);
