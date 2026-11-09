// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, it} from 'vitest';
import {
  ScientificFlowGraph,
  type ScientificVectorFieldInput
} from '@luma.gl/graph/experimental/simulation';
import {getTestDevice} from '@luma.gl/core/test-utils';

function makeUniformField(speed: number, valid = 1): ScientificVectorFieldInput {
  return {
    dimensions: ['y', 'x'],
    shape: [2, 2],
    eastward: new Float32Array(4).fill(speed),
    northward: new Float32Array(4),
    valid: new Uint8Array(4).fill(valid)
  };
}

async function readParticle(graph: ScientificFlowGraph): Promise<Float32Array> {
  const bytes = await graph.output.readAsync();
  return new Float32Array(bytes.buffer, bytes.byteOffset, 4);
}

for (const integrator of ['rk2', 'rk4'] as const) {
  it(`ScientificFlowGraph ${integrator} samples stage times and rotates snapshots`, async context => {
    const device = await getTestDevice('webgpu');
    if (!device) return context.skip();
    // x'(t) = 0.2(t - epoch). Large timestamps must not lose subsecond precision on GPU.
    const epoch = 1700000000;
    const graph = new ScientificFlowGraph(device, {
      input: makeUniformField(0),
      nextInput: makeUniformField(0.2),
      timeRange: [epoch, epoch + 1],
      bounds: [0, 0, 1, 1],
      particleCount: 1,
      lifetime: 10,
      integrator
    });
    try {
      graph.output.write(new Float32Array([0.2, 0.5, 0, 4]));
      expect(() => graph.setNextSnapshot(makeUniformField(0.4), epoch + 2)).toThrow();
      expect(() => graph.advance(1.01)).toThrow();
      expect(graph.time).toBe(epoch);
      graph.advance(1);
      expect((await readParticle(graph))[0]).toBeCloseTo(0.3, 6);
      expect(graph.time).toBe(epoch + 1);
      const oldTexture = graph.field.texture;
      graph.setNextSnapshot(makeUniformField(0.4), epoch + 2);
      expect(oldTexture.destroyed).toBe(true);
      graph.advance(1);
      const particle = await readParticle(graph);
      expect(particle[0]).toBeCloseTo(0.6, 6);
      expect(particle[2]).toBeCloseTo(2, 5);
      expect(particle[3]).toBe(4);
      expect(graph.time).toBe(epoch + 2);
    } finally {
      graph.destroy();
    }
  });
}

it('ScientificFlowGraph batches the same deterministic substeps without uniform overwrite', async context => {
  const device = await getTestDevice('webgpu');
  if (!device) return context.skip();
  const props = {
    input: makeUniformField(0.1),
    nextInput: makeUniformField(0.3),
    timeRange: [0, 1] as const,
    bounds: [0, 0, 1, 1] as const,
    particleCount: 129,
    lifetime: 0.1,
    seed: 5
  };
  const batched = new ScientificFlowGraph(device, props);
  const separate = new ScientificFlowGraph(device, props);
  try {
    batched.advance(0.5);
    for (let index = 0; index < 15; index++) separate.step(1 / 30);
    const first = await batched.output.readAsync();
    const second = await separate.output.readAsync();
    const firstState = new Float32Array(first.buffer, first.byteOffset, 129 * 4);
    const secondState = new Float32Array(second.buffer, second.byteOffset, 129 * 4);
    for (let index = 0; index < firstState.length; index++) {
      expect(firstState[index]).toBeCloseTo(secondState[index], 6);
    }
    expect(batched.time).toBeCloseTo(separate.time, 12);
    for (const deltaTime of [NaN, Infinity, -1, 10000]) {
      expect(() => batched.advance(deltaTime)).toThrow();
    }
  } finally {
    batched.destroy();
    separate.destroy();
  }
});

it('ScientificFlowGraph uses only contributing masks at temporal endpoints', async context => {
  const device = await getTestDevice('webgpu');
  if (!device) return context.skip();
  const graph = new ScientificFlowGraph(device, {
    input: makeUniformField(0.1),
    nextInput: makeUniformField(0.2, 0),
    timeRange: [0, 1],
    bounds: [0, 0, 1, 1],
    particleCount: 1
  });
  try {
    graph.output.write(new Float32Array([0.2, 0.5, 0, 4]));
    graph.step(0);
    expect((await readParticle(graph))[3]).toBe(4);
    graph.step(1 / 30);
    const particle = await readParticle(graph);
    expect(particle[2]).toBe(-1);
    expect(particle[3]).toBe(5);
    graph.advance(1 - graph.time);
    graph.setNextSnapshot(makeUniformField(0.2), 2);
    graph.advance(1);
    expect((await readParticle(graph))[2]).toBe(0);
    graph.step(0);
    expect((await readParticle(graph))[2]).toBe(0);
  } finally {
    graph.destroy();
  }
});

it('ScientificFlowGraph rejects incompatible temporal grids without changing state', async context => {
  const device = await getTestDevice('webgpu');
  if (!device) return context.skip();
  const graph = new ScientificFlowGraph(device, {
    input: makeUniformField(0),
    nextInput: makeUniformField(0),
    timeRange: [0, 1],
    bounds: [0, 0, 1, 1],
    particleCount: 1
  });
  try {
    graph.advance(1);
    const field = graph.field;
    expect(() => graph.setNextSnapshot(makeUniformField(0), 1)).toThrow();
    expect(() =>
      graph.setNextSnapshot(
        {
          ...makeUniformField(0),
          shape: [2, 3],
          eastward: new Float32Array(6),
          northward: new Float32Array(6),
          valid: new Uint8Array(6)
        },
        2
      )
    ).toThrow();
    expect(graph.field).toBe(field);
    expect(field.texture.destroyed).toBe(false);
    expect(graph.time).toBe(1);
  } finally {
    graph.destroy();
  }
});

for (const integrator of ['rk2', 'rk4'] as const) {
  it(`ScientificFlowGraph ${integrator} converges for an accelerating rotation`, async context => {
    const device = await getTestDevice('webgpu');
    if (!device) return context.skip();
    function makeRotation(time: number): ScientificVectorFieldInput {
      // Bilinear interpolation is exact for this linear spatial field.
      return {
        ...makeUniformField(0),
        eastward: new Float32Array([0.5, 0.5, -0.5, -0.5]).map(value => value * (4 + time)),
        northward: new Float32Array([-0.5, 0.5, -0.5, 0.5]).map(value => value * (4 + time))
      };
    }
    const errors: number[] = [];
    for (const steps of [30, 60]) {
      const graph = new ScientificFlowGraph(device, {
        input: makeRotation(0),
        nextInput: makeRotation(1),
        timeRange: [0, 1],
        bounds: [0, 0, 1, 1],
        particleCount: 1,
        lifetime: 10,
        integrator
      });
      try {
        graph.output.write(new Float32Array([0.75, 0.5, 0, 3]));
        for (let index = 0; index < steps; index++) graph.step(1 / steps);
        const particle = await readParticle(graph);
        errors.push(
          Math.hypot(
            particle[0] - (0.5 + 0.25 * Math.cos(4.5)),
            particle[1] - (0.5 + 0.25 * Math.sin(4.5))
          )
        );
        expect(particle[3]).toBe(3);
      } finally {
        graph.destroy();
      }
    }
    expect(errors[0]).toBeLessThan(integrator === 'rk4' ? 0.00001 : 0.005);
    expect(errors[1]).toBeLessThan(errors[0] / (integrator === 'rk4' ? 3 : 3.5));
  });
}

it('ScientificFlowGraph follows an unsteady double gyre against an independent CPU trajectory', async context => {
  const device = await getTestDevice('webgpu');
  if (!device) return context.skip();
  function velocity(horizontal: number, vertical: number, time: number): [number, number] {
    const amplitude = 0.25 * Math.sin((2 * Math.PI * time) / 10);
    const coordinate = 2 * horizontal;
    const warped = amplitude * coordinate * coordinate + (1 - 2 * amplitude) * coordinate;
    return [
      -0.13 * Math.sin(Math.PI * warped) * Math.cos(Math.PI * vertical),
      0.26 *
        Math.cos(Math.PI * warped) *
        Math.sin(Math.PI * vertical) *
        (2 * amplitude * coordinate + 1 - 2 * amplitude)
    ];
  }
  function makeSnapshot(time: number): ScientificVectorFieldInput {
    const width = 129;
    const eastward = new Float32Array(width * width);
    const northward = new Float32Array(width * width);
    for (let row = 0; row < width; row++) {
      for (let column = 0; column < width; column++) {
        const components = velocity(column / (width - 1), row / (width - 1), time);
        eastward[row * width + column] = components[0];
        northward[row * width + column] = components[1];
      }
    }
    return {
      dimensions: ['y', 'x'],
      shape: [width, width],
      eastward,
      northward,
      valid: new Uint8Array(width * width).fill(1)
    };
  }
  // Double precision, continuous analytic velocities, 2000 RK4 steps: independent of
  // the GPU's bilinear grid and linearly interpolated snapshots.
  let horizontal = 0.25;
  let vertical = 0.4;
  const referenceTimeStep = 1 / 2000;
  for (let index = 0; index < 2000; index++) {
    const time = index * referenceTimeStep;
    const first = velocity(horizontal, vertical, time);
    const second = velocity(
      horizontal + (first[0] * referenceTimeStep) / 2,
      vertical + (first[1] * referenceTimeStep) / 2,
      time + referenceTimeStep / 2
    );
    const third = velocity(
      horizontal + (second[0] * referenceTimeStep) / 2,
      vertical + (second[1] * referenceTimeStep) / 2,
      time + referenceTimeStep / 2
    );
    const fourth = velocity(
      horizontal + third[0] * referenceTimeStep,
      vertical + third[1] * referenceTimeStep,
      time + referenceTimeStep
    );
    horizontal += (referenceTimeStep * (first[0] + 2 * second[0] + 2 * third[0] + fourth[0])) / 6;
    vertical += (referenceTimeStep * (first[1] + 2 * second[1] + 2 * third[1] + fourth[1])) / 6;
  }
  const graph = new ScientificFlowGraph(device, {
    input: makeSnapshot(0),
    nextInput: makeSnapshot(0.125),
    timeRange: [0, 0.125],
    bounds: [0, 0, 1, 1],
    particleCount: 1,
    lifetime: 10
  });
  try {
    graph.output.write(new Float32Array([0.25, 0.4, 0, 3]));
    for (let interval = 0; interval < 8; interval++) {
      if (interval > 0) graph.setNextSnapshot(makeSnapshot((interval + 1) / 8), (interval + 1) / 8);
      graph.advance(0.125);
    }
    const particle = await readParticle(graph);
    expect(Math.hypot(particle[0] - horizontal, particle[1] - vertical)).toBeLessThan(0.0001);
    expect(particle[3]).toBe(3);
    expect(graph.time).toBe(1);
  } finally {
    graph.destroy();
  }
});

it('ScientificFlowGraph reaches the exact final snapshot after fifty GPU substeps', async context => {
  const device = await getTestDevice('webgpu');
  if (!device) return context.skip();
  const graph = new ScientificFlowGraph(device, {
    input: makeUniformField(0, 0),
    nextInput: makeUniformField(0),
    timeRange: [0, 50 / 30],
    bounds: [0, 0, 1, 1],
    particleCount: 1
  });
  try {
    graph.advance(50 / 30);
    const particle = await readParticle(graph);
    // Only the very last stage/spawn may ignore the expired snapshot's invalid mask.
    expect(particle[2]).toBe(0);
    expect(particle[3]).toBe(50);
  } finally {
    graph.destroy();
  }
});

for (const epoch of [0, 1700000000]) {
  it(`ScientificFlowGraph rotates after frame-sized steps at epoch ${epoch}`, async context => {
    const device = await getTestDevice('webgpu');
    if (!device) return context.skip();
    const graph = new ScientificFlowGraph(device, {
      input: makeUniformField(0),
      nextInput: makeUniformField(0.2),
      timeRange: [epoch, epoch + 0.25],
      bounds: [0, 0, 1, 1],
      particleCount: 1,
      lifetime: 10
    });
    try {
      graph.output.write(new Float32Array([0.2, 0.5, 0, 4]));
      for (let frame = 0; frame < 15; frame++) graph.advance(1 / 60);
      expect(graph.remainingTime).toBe(0);
      expect(graph.time).toBe(epoch + 0.25);
      expect((await readParticle(graph))[0]).toBeCloseTo(0.225, 6);
      graph.setNextSnapshot(makeUniformField(0.4), epoch + 0.5);
      // This remainder fits the demo's old 1e-10 heuristic but is still real motion.
      graph.advance(0.25 - 5e-11);
      expect(graph.remainingTime).toBeGreaterThan(0);
      expect(() => graph.setNextSnapshot(makeUniformField(0.6), epoch + 0.75)).toThrow();
      graph.advance(graph.remainingTime);
      expect(graph.remainingTime).toBe(0);
      expect(graph.time).toBe(epoch + 0.5);
      graph.setNextSnapshot(makeUniformField(0.6), epoch + 0.75);
      expect(graph.remainingTime).toBe(0.25);
      expect((await readParticle(graph))[0]).toBeCloseTo(0.3, 6);
    } finally {
      graph.destroy();
    }
  });
}
