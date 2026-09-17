// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {Buffer} from '@luma.gl/core';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {GPUData} from '@luma.gl/gpgpu/gpu-data';
import {createGPUConjugateGradientProgram, GPUProgramCompiler} from '@luma.gl/gpgpu/gpu-core';
import {GPUJacobiPCG} from '../../src/gpu-core/gpu-pcg';
import {BatchConformanceFixture} from './batch-conformance-utils';

for (const initial of [
  [0, 0],
  [0.5, 1],
  [1, 2]
]) {
  test(`Jacobi PCG solves chunked SPD with initial solution ${initial}`, async () => {
    const device = await getWebGPUTestDevice();
    if (!device) return;
    const fixture = new BatchConformanceFixture(device);
    // Duplicate entries on the first diagonal must sum, just as CSR SpMV does.
    const rowOffsets = fixture.column('offsets', 'uint32', [0, 3, 5], [1, 0, 2]);
    const columnIndices = fixture.column('columns', 'uint32', [0, 0, 1, 0, 1], [2, 3]);
    const values = fixture.column('values', 'float32', [2, 2, 1, 1, 3], [1, 4]);
    const rhs = fixture.column('rhs', 'float32', [6, 7], [1, 1]);
    const solution = fixture.column('solution', 'float32', initial, [0, 2]);
    const solver = new GPUJacobiPCG({
      rowOffsets,
      columnIndices,
      values,
      rhs,
      solution,
      columns: 2,
      iterations: 5,
      toleranceSquared: 1e-10
    });
    fixture.graph.add(solver);
    const result = solver.getResult();
    const initialNorm = fixture.capture('initial-norm', result.initialResidualSquared.view);
    const finalNorm = fixture.capture('final-norm', result.residualSquared.view);
    const breakdown = fixture.capture('breakdown', result.breakdown.view);
    const compiled = fixture.graph.compile();
    try {
      for (let run = 0; run < 2; run++) {
        const encoder = device.createCommandEncoder();
        compiled.encode(encoder, {parameters: undefined});
        device.submit(encoder.finish());
        const actual = await fixture.read(solution);
        expect(actual[0]).toBeCloseTo(1, 5);
        expect(actual[1]).toBeCloseTo(2, 5);
        const expectedInitial =
          run === 0
            ? (6 - 4 * initial[0] - initial[1]) ** 2 + (7 - initial[0] - 3 * initial[1]) ** 2
            : 0;
        expect((await fixture.read(initialNorm))[0]).toBeCloseTo(expectedInitial, 5);
        expect((await fixture.read(finalNorm))[0]).toBeLessThanOrEqual(1e-10);
        expect(await fixture.read(breakdown)).toEqual([0]);
      }
    } finally {
      compiled.destroy();
      expect(fixture.buffers.every(buffer => !buffer.destroyed)).toBe(true);
      fixture.destroy();
    }
  });
}

for (const diagonal of [0, -1]) {
  test(`Jacobi PCG reports unusable diagonal ${diagonal} without poisoning solution`, async () => {
    const device = await getWebGPUTestDevice();
    if (!device) return;
    const fixture = new BatchConformanceFixture(device);
    const rowOffsets = fixture.column('offsets', 'uint32', [0, 1], [2]);
    const columnIndices = fixture.column('columns', 'uint32', [0], [1]);
    const values = fixture.column('values', 'float32', [diagonal], [1]);
    const rhs = fixture.column('rhs', 'float32', [1], [1]);
    const solution = fixture.column('solution', 'float32', [0], [1]);
    const solver = new GPUJacobiPCG({
      rowOffsets,
      columnIndices,
      values,
      rhs,
      solution,
      columns: 1,
      iterations: 3
    });
    fixture.graph.add(solver);
    const breakdown = fixture.capture('breakdown', solver.getResult().breakdown.view);
    const compiled = fixture.graph.compile();
    try {
      const encoder = device.createCommandEncoder();
      compiled.encode(encoder, {parameters: undefined});
      device.submit(encoder.finish());
      expect(await fixture.read(solution)).toEqual([0]);
      expect(await fixture.read(breakdown)).toEqual([1]);
    } finally {
      compiled.destroy();
      fixture.destroy();
    }
  });
}

for (const initial of [
  [0, 0],
  [0.5, 1],
  [1, 2]
]) {
  test(`semantic CG solves independently chunked bindings from ${initial}`, async () => {
    const device = await getWebGPUTestDevice();
    if (!device) return;
    const buffers: Buffer[] = [];
    const chunk = (values: number[], format: 'float32' | 'uint32') => {
      const data = format === 'float32' ? new Float32Array(values) : new Uint32Array(values);
      const buffer = device.createBuffer({
        data,
        usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
      });
      buffers.push(buffer);
      return new GPUData({buffer, format, length: values.length});
    };
    const solver = createGPUConjugateGradientProgram({
      size: 2,
      nonZeros: 4,
      maxIterations: 5,
      toleranceSquared: 1e-10
    });
    const solution = [chunk(initial.slice(0, 1), 'float32'), chunk(initial.slice(1), 'float32')];
    const compilation = new GPUProgramCompiler(device).compile(solver.program, {
      vectors: {
        [solver.rowOffsets.id]: [chunk([0], 'uint32'), chunk([2, 4], 'uint32')],
        [solver.columnIndices.id]: [chunk([0, 1, 0], 'uint32'), chunk([1], 'uint32')],
        [solver.values.id]: [chunk([4, 1], 'float32'), chunk([1, 3], 'float32')],
        [solver.rhs.id]: chunk([6, 7], 'float32'),
        [solver.solution.id]: solution
      }
    });
    const compiled = compilation.graph.compile();
    try {
      for (let run = 0; run < 2; run++) {
        const encoder = device.createCommandEncoder();
        compiled.encode(encoder, {parameters: undefined});
        device.submit(encoder.finish());
        const actual = await Promise.all(
          solution.map(async data => {
            const bytes = await data.buffer.readAsync();
            return new Float32Array(bytes.buffer, bytes.byteOffset, 1)[0];
          })
        );
        expect(actual[0]).toBeCloseTo(1, 5);
        expect(actual[1]).toBeCloseTo(2, 5);
      }
    } finally {
      compiled.destroy();
      buffers.forEach(buffer => buffer.destroy());
    }
  });
}

test('semantic CG reports zero curvature and preserves finite state', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const buffers: Buffer[] = [];
  const data = (values: number[], format: 'float32' | 'uint32') => {
    const buffer = device.createBuffer({
      data: format === 'float32' ? new Float32Array(values) : new Uint32Array(values),
      usage: Buffer.STORAGE | Buffer.COPY_SRC
    });
    buffers.push(buffer);
    return new GPUData({buffer, format, length: values.length});
  };
  const solver = createGPUConjugateGradientProgram({
    size: 1,
    nonZeros: 1,
    maxIterations: 3,
    toleranceSquared: 1e-10
  });
  const solution = data([0], 'float32');
  const compilation = new GPUProgramCompiler(device).compile(solver.program, {
    vectors: {
      [solver.rowOffsets.id]: data([0, 1], 'uint32'),
      [solver.columnIndices.id]: data([0], 'uint32'),
      [solver.values.id]: data([0], 'float32'),
      [solver.rhs.id]: data([1], 'float32'),
      [solver.solution.id]: solution
    }
  });
  const diagnostics = device.createBuffer({
    byteLength: 8,
    usage: Buffer.COPY_SRC | Buffer.COPY_DST
  });
  buffers.push(diagnostics);
  const target = compilation.graph.importBuffer(
    {id: 'diagnostics', byteLength: 8, usage: diagnostics.usage},
    diagnostics
  );
  for (const [index, scalar] of [solver.residualSquared, solver.breakdown].entries()) {
    const view = compilation.scalars.get(scalar.id)!.view;
    compilation.graph.addCopyPass({
      id: `diagnostic-${index}`,
      resources: [
        {buffer: view, usage: 'copy-source'},
        {buffer: target, usage: 'copy-destination'}
      ],
      compile: () => ({
        encode: ({commandEncoder, getBuffer}) =>
          commandEncoder.copyBufferToBuffer({
            sourceBuffer: getBuffer(view),
            sourceOffset: view.byteOffset,
            destinationBuffer: getBuffer(target),
            destinationOffset: index * 4,
            size: 4
          })
      })
    });
  }
  const compiled = compilation.graph.compile();
  try {
    const encoder = device.createCommandEncoder();
    compiled.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    const bytes = await diagnostics.readAsync();
    const readback = new DataView(bytes.buffer, bytes.byteOffset);
    expect(readback.getFloat32(0, true)).toBe(1);
    expect(readback.getUint32(4, true)).toBe(1);
    const solutionBytes = await solution.buffer.readAsync();
    expect(new Float32Array(solutionBytes.buffer, solutionBytes.byteOffset, 1)[0]).toBe(0);
  } finally {
    compiled.destroy();
    buffers.forEach(buffer => buffer.destroy());
  }
});
