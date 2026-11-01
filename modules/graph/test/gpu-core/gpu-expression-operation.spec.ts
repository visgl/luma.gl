// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {Buffer, type Device} from '@luma.gl/core';
import {getWebGLTestDevice, getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {GPUData, GPUVector} from '@luma.gl/graph/gpu-data';
import {GPUGraph, GPUExpressionOperation} from '@luma.gl/graph';
import {GPUGraphVectorMADD, GPUGraphDotProduct} from '@luma.gl/graph/gpu-core';
import {GPUSimpleGraph} from '@luma.gl/graph/gpu-simple-graph';

function makeVector(device: Device, values: number[][], prefixLength = 0): GPUVector<'float32'> {
  return new GPUVector({
    type: 'data',
    name: 'test',
    format: 'float32',
    ownsData: true,
    data: values.map(
      chunk =>
        new GPUData({
          buffer: device.createBuffer({
            data: new Float32Array([
              ...Array<number>(prefixLength).fill(99),
              ...(chunk.length ? chunk : [0])
            ]),
            usage: Buffer.STORAGE | Buffer.VERTEX | Buffer.COPY_SRC | Buffer.COPY_DST
          }),
          format: 'float32',
          length: chunk.length,
          byteOffset: prefixLength * 4,
          ownsBuffer: true
        })
    )
  });
}

async function readVector(vector: GPUVector): Promise<number[]> {
  const values = await Promise.all(
    vector.data.map(async chunk => {
      if (!chunk.length) return [];
      const bytes = await chunk.buffer.readAsync(chunk.byteOffset, chunk.length * 4);
      return Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, chunk.length));
    })
  );
  return values.flat();
}

for (const [backend, getDevice] of [
  ['webgl', getWebGLTestDevice],
  ['webgpu', getWebGPUTestDevice]
] as const) {
  for (const kind of ['simple', 'full'] as const) {
    if (backend === 'webgl' && kind === 'full') continue;
    test(`${kind} expression graph rebinds values and chunk lengths on ${backend}`, async () => {
      const device = await getDevice();
      if (!device) return;
      const graph = kind === 'simple' ? new GPUSimpleGraph() : new GPUGraph();
      graph.vector('positions', 'float32');
      graph.scalar('scale', 'float32');
      graph.vector('offset', 'float32');
      graph.vector('transformed', 'float32');
      graph.vector('output', 'float32');
      graph.add(
        new GPUExpressionOperation({
          output: 'transformed',
          expression: 'positions * scale + offset'
        })
      );
      graph.add(new GPUExpressionOperation({output: 'output', expression: '-transformed / 2 - 1'}));
      const compiled = graph.compile(device, {outputs: ['output']});
      const createShader = vi.spyOn(device, 'createShader');
      try {
        for (const chunks of [[[1, 2], [], [3]], [[4], [5, 6, 7]], [[]], []]) {
          const positions = makeVector(device, chunks, 1);
          const offset = makeVector(
            device,
            chunks.map(chunk => chunk.map(() => 10))
          );
          const target = makeVector(
            device,
            chunks.map(chunk => chunk.map(() => 0))
          );
          try {
            const outputs = await compiled.run(
              {positions, offset, scale: 2},
              {outputTargets: {output: target}}
            );
            expect(outputs.output).toBe(target);
            expect(outputs.output.data.map(chunk => chunk.length)).toEqual(
              chunks.map(chunk => chunk.length)
            );
            expect(await readVector(outputs.output)).toEqual(
              chunks.flat().map(value => -(value * 2 + 10) / 2 - 1)
            );
            expect(await readVector(positions)).toEqual(chunks.flat());
          } finally {
            positions.destroy();
            offset.destroy();
            target.destroy();
          }
        }
        if (kind === 'full') expect(createShader).not.toHaveBeenCalled();
      } finally {
        createShader.mockRestore();
        compiled.destroy();
      }
    });
  }
}

test('expression output feeds a full-graph WebGPU operation in the same submission', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const graph = new GPUGraph();
  const input = graph.vector('input', 'float32');
  const transformed = graph.vector('transformed', 'float32');
  const output = graph.vector('output', 'float32');
  const scale = graph.scalar('scale', 'float32');
  graph.add(new GPUExpressionOperation({output: 'transformed', expression: 'input * scale'}));
  graph.add(new GPUGraphVectorMADD({input: transformed, scale, addend: input, output}));
  const compiled = graph.compile(device, {outputs: ['output']});
  const source = makeVector(device, [[1, 2], [3]]);
  const destination = makeVector(device, [[0, 0], [0]]);
  const submit = vi.spyOn(device, 'submit');
  try {
    const result = await compiled.run({input: source, scale: 2, output: destination});
    expect(submit).toHaveBeenCalledTimes(1);
    expect(await readVector(result.output)).toEqual([5, 10, 15]);
  } finally {
    submit.mockRestore();
    compiled.destroy();
    source.destroy();
    destination.destroy();
  }
});

for (const kind of ['simple', 'full'] as const) {
  test(`${kind} expression binding failures preserve caller resources and allow another run`, async () => {
    const device = await getWebGPUTestDevice();
    if (!device) return;
    const graph = kind === 'simple' ? new GPUSimpleGraph() : new GPUGraph();
    graph.vector('input', 'float32', {length: 3});
    graph.vector('offset', 'float32');
    graph.scalar('scale', 'float32');
    graph.scalar('factor', 'float32');
    graph.vector('output', 'float32');
    graph.add(new GPUExpressionOperation({output: 'factor', expression: 'scale + 1'}));
    graph.add(
      new GPUExpressionOperation({output: 'output', expression: 'input * factor + offset'})
    );
    const compiled = graph.compile(device, {outputs: ['factor', 'output']});
    const input = makeVector(device, [[1], [2, 3]]);
    const wrongLength = makeVector(device, [[1, 2]]);
    const wrongChunks = makeVector(device, [[1, 2, 3]]);
    const offset = makeVector(device, [[10], [20, 30]]);
    try {
      await expect(compiled.run({input: wrongLength, scale: 2, offset})).rejects.toThrow();
      await expect(compiled.run({input, scale: 2, offset: wrongChunks})).rejects.toThrow('chunk');
      await expect(compiled.run({input, offset})).rejects.toThrow('Missing');
      await expect(
        compiled.run({input, offset, scale: 2}, {outputTargets: {output: input}})
      ).rejects.toThrow('alias');
      const result = await compiled.run({input, offset, scale: 2});
      compiled.destroy();
      try {
        expect(await readVector(result.factor)).toEqual([3]);
        expect(await readVector(result.output)).toEqual([13, 26, 39]);
        expect(await readVector(input)).toEqual([1, 2, 3]);
      } finally {
        result.factor.destroy();
        result.output.destroy();
      }
    } finally {
      compiled.destroy();
      input.destroy();
      offset.destroy();
      wrongLength.destroy();
      wrongChunks.destroy();
    }
  });
}

for (const kind of ['simple', 'full'] as const) {
  test(`${kind} expressions preserve negative zero`, async () => {
    const device = await getWebGPUTestDevice();
    if (!device) return;
    const graph = kind === 'simple' ? new GPUSimpleGraph() : new GPUGraph();
    graph.vector('input', 'float32');
    graph.vector('output', 'float32');
    graph.add(new GPUExpressionOperation({output: 'output', expression: '-input'}));
    const compiled = graph.compile(device);
    const input = makeVector(device, [[0, 1]]);
    try {
      const result = await compiled.run({input});
      try {
        expect(await readVector(result.output)).toEqual([-0, -1]);
      } finally {
        result.output.destroy();
      }
    } finally {
      input.destroy();
      compiled.destroy();
    }
  });
}

test('WebGL scalar output targets preserve prefix bytes and their requested offset', async () => {
  const device = await getWebGLTestDevice();
  const graph = new GPUSimpleGraph();
  graph.scalar('scale', 'float32');
  graph.scalar('output', 'float32');
  graph.add(new GPUExpressionOperation({output: 'output', expression: 'scale + 1'}));
  const compiled = graph.compile(device);
  const target = makeVector(device, [[0]], 3);
  try {
    const result = await compiled.run({scale: 2}, {outputTargets: {output: target}});
    expect(result.output).toBe(target);
    expect(await readVector(target)).toEqual([3]);
    const bytes = await target.data[0].buffer.readAsync();
    expect(Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, 4))).toEqual([
      99, 99, 99, 3
    ]);
  } finally {
    target.destroy();
    compiled.destroy();
  }
});

test('GPU-produced dot-product scalars feed expressions without dummy input bindings', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const graph = new GPUGraph();
  const input = graph.vector('input', 'float32');
  const total = graph.scalar('total', 'float32');
  graph.vector('output', 'float32');
  graph.add(new GPUGraphDotProduct({left: input, right: input, output: total}));
  graph.add(new GPUExpressionOperation({output: 'output', expression: 'input * total'}));
  const compiled = graph.compile(device, {outputs: ['total', 'output']});
  try {
    for (const chunks of [[[1, 2], [3]], [[2, 3]]]) {
      const source = makeVector(device, chunks);
      const submit = vi.spyOn(device, 'submit');
      try {
        const result = await compiled.run({input: source});
        expect(submit).toHaveBeenCalledTimes(1);
        const sum = chunks.flat().reduce((value, element) => value + element * element, 0);
        try {
          expect(await readVector(result.total)).toEqual([sum]);
          expect(await readVector(result.output)).toEqual(chunks.flat().map(value => value * sum));
        } finally {
          result.total.destroy();
          result.output.destroy();
        }
      } finally {
        submit.mockRestore();
        source.destroy();
      }
    }
  } finally {
    compiled.destroy();
  }
});

for (const fixed of [false, true]) {
  test(`full graph prepares ${fixed ? 'fixed' : 'dynamic'} internal vector outputs for expressions`, async () => {
    const device = await getWebGPUTestDevice();
    if (!device) return;
    const graph = new GPUGraph();
    const input = graph.vector('input', 'float32', fixed ? 3 : undefined);
    const scale = graph.scalar('scale', 'float32');
    const intermediate = graph.vector('intermediate', 'float32', fixed ? 3 : undefined);
    graph.vector('output', 'float32');
    graph.add(new GPUGraphVectorMADD({input, scale, addend: input, output: intermediate}));
    graph.add(new GPUExpressionOperation({output: 'output', expression: 'intermediate + 1'}));
    const compiled = graph.compile(device, {outputs: ['intermediate', 'output']});
    const source = makeVector(device, [[1, 2], [3]]);
    try {
      const result = await compiled.run({input: source, scale: 2});
      try {
        expect(await readVector(result.intermediate)).toEqual([3, 6, 9]);
        expect(await readVector(result.output)).toEqual([4, 7, 10]);
        expect(result.intermediate.data.map(chunk => chunk.length)).toEqual([2, 1]);
      } finally {
        result.intermediate.destroy();
        result.output.destroy();
      }
    } finally {
      source.destroy();
      compiled.destroy();
    }
  });
}

for (const kind of ['simple', 'full'] as const) {
  test(`${kind} rejects overlapping writable output chunks before submission`, async () => {
    const device = await getWebGPUTestDevice();
    if (!device) return;
    const graph = kind === 'simple' ? new GPUSimpleGraph() : new GPUGraph();
    graph.vector('input', 'float32');
    graph.vector('output', 'float32');
    graph.add(new GPUExpressionOperation({output: 'output', expression: 'input + 1'}));
    const compiled = graph.compile(device);
    const input = makeVector(device, [
      [1, 2],
      [3, 4]
    ]);
    const buffer = device.createBuffer({
      data: new Float32Array([-9, -9]),
      usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
    });
    const target = new GPUVector({
      type: 'data',
      name: 'overlap',
      format: 'float32',
      data: [
        new GPUData({buffer, format: 'float32', length: 2}),
        new GPUData({buffer, format: 'float32', length: 2})
      ]
    });
    const submit = vi.spyOn(device, 'submit');
    try {
      await expect(compiled.run({input}, {outputTargets: {output: target}})).rejects.toThrow(
        'overlapping'
      );
      expect(submit).not.toHaveBeenCalled();
      expect(await readVector(target)).toEqual([-9, -9, -9, -9]);
    } finally {
      submit.mockRestore();
      compiled.destroy();
      input.destroy();
      target.destroy();
      buffer.destroy();
    }
  });

  test(`${kind} accepts large float32 literals without integer-token overflow`, async () => {
    const device = await getWebGPUTestDevice();
    if (!device) return;
    const graph = kind === 'simple' ? new GPUSimpleGraph() : new GPUGraph();
    graph.vector('input', 'float32');
    graph.vector('output', 'float32');
    graph.add(
      new GPUExpressionOperation({output: 'output', expression: 'input + 100000000000000000000'})
    );
    const compiled = graph.compile(device);
    const input = makeVector(device, [[0, 1]]);
    try {
      const result = await compiled.run({input});
      try {
        expect(await readVector(result.output)).toEqual([Math.fround(1e20), Math.fround(1e20)]);
      } finally {
        result.output.destroy();
      }
    } finally {
      input.destroy();
      compiled.destroy();
    }
  });
}

test('full graph validates inferred MADD target shape before creating an encoder', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const graph = new GPUGraph();
  const input = graph.vector('input', 'float32');
  const output = graph.vector('output', 'float32');
  const scale = graph.scalar('scale', 'float32');
  graph.add(new GPUGraphVectorMADD({input, scale, addend: input, output}));
  const compiled = graph.compile(device, {outputs: ['output']});
  const source = makeVector(device, [[1, 2], [3]]);
  const createEncoder = vi.spyOn(device, 'createCommandEncoder');
  try {
    for (const chunks of [[[0], [0]], [[0, 0, 0]]]) {
      const target = makeVector(device, chunks);
      try {
        await expect(
          compiled.run({input: source, scale: 2}, {outputTargets: {output: target}})
        ).rejects.toThrow('Incompatible');
        expect(createEncoder).not.toHaveBeenCalled();
      } finally {
        target.destroy();
      }
    }
    const result = await compiled.run({input: source, scale: 2});
    try {
      expect(await readVector(result.output)).toEqual([3, 6, 9]);
    } finally {
      result.output.destroy();
    }
  } finally {
    createEncoder.mockRestore();
    source.destroy();
    compiled.destroy();
  }
});
