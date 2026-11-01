// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {Buffer, type Device} from '@luma.gl/core';
import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {
  GPUGraph,
  GPUExpressionOperation,
  type GPUOperationLowering,
  type GPUOperation,
  type GPUOperationContract,
  type GPUGraphVector,
  type GPUGraphScalar
} from '@luma.gl/graph';
import {
  GPUGraphScalarOperation,
  GPUGraphVectorMADD,
  GPULoopOperation,
  GPUGraphScalarLiteral,
  GPUGraphDotProduct
} from '@luma.gl/graph/gpu-core';
import {GPUData, GPUVector} from '@luma.gl/graph/gpu-data';

class CustomCopy implements GPUOperation {
  readonly id = 'custom-copy';
  readonly type = 'custom-copy';
  readonly contract: GPUOperationContract;
  constructor(
    readonly input: GPUGraphVector<'uint32x2'>,
    readonly output: GPUGraphVector<'uint32x2'>
  ) {
    this.contract = {
      values: [
        {value: input, access: 'read'},
        {value: output, access: 'write', shape: {like: input}}
      ]
    };
  }
}
class CustomScalar implements GPUOperation {
  readonly id = 'custom-scalar';
  readonly type = 'custom-scalar';
  readonly contract: GPUOperationContract;
  constructor(
    readonly input: GPUGraphScalar<'float32'>,
    readonly output: GPUGraphScalar<'float32'>
  ) {
    this.contract = {
      values: [
        {value: input, access: 'read'},
        {value: output, access: 'write'}
      ]
    };
  }
}
function makeInput(device: Device, rows: number): GPUVector<'uint32x2'> {
  return new GPUVector({
    format: 'uint32x2',
    type: 'data',
    ownsData: true,
    data: [1, 0, rows - 1].map(
      length =>
        new GPUData({
          format: 'uint32x2',
          length,
          ownsBuffer: true,
          buffer: device.createBuffer({
            data: new Uint32Array(Math.max(1, length) * 2).fill(16777217),
            usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
          })
        })
    )
  });
}
async function readFloat(vector: GPUVector): Promise<number[]> {
  return (
    await Promise.all(
      vector.data.map(async chunk => {
        if (!chunk.length) return [];
        const data = await chunk.buffer.readAsync(chunk.byteOffset, chunk.length * 4);
        return Array.from(new Float32Array(data.buffer, data.byteOffset, chunk.length));
      })
    )
  ).flat();
}

test('fixed-count loop scalar producers execute before top-level consumers', async ({skip}) => {
  const device = await getWebGPUTestDevice();
  if (!device) return skip();
  const graph = new GPUGraph();
  const intermediate = graph.scalar('intermediate', 'float32');
  const output = graph.scalar('output', 'float32');
  graph.add([
    new GPULoopOperation({
      maximumIterations: 1,
      body: new GPUGraphScalarLiteral({output: intermediate, value: 7})
    }),
    new GPUGraphScalarOperation({operation: 'copy', left: intermediate, output})
  ]);
  const compiled = graph.compile(device, {outputs: ['output']});
  try {
    const result = await compiled.run({});
    try {
      expect(await readFloat(result.output)).toEqual([7]);
    } finally {
      result.output.destroy();
    }
  } finally {
    compiled.destroy();
  }
});

test('initialized execution vectors can be read before a later replacement', async ({skip}) => {
  const device = await getWebGPUTestDevice();
  if (!device) return skip();
  const graph = new GPUGraph();
  const state = graph.vector('state', 'float32');
  const intermediate = graph.vector('intermediate', 'float32');
  const addend = graph.vector('addend', 'float32');
  const scale = graph.scalar('scale', 'float32');
  graph.add([
    new GPUGraphVectorMADD({input: state, scale, addend, output: intermediate}),
    new GPUGraphVectorMADD({input: intermediate, scale, addend, output: state})
  ]);
  const makeVector = (value: number) =>
    new GPUVector({
      type: 'data',
      format: 'float32',
      ownsData: true,
      data: [
        new GPUData({
          format: 'float32',
          length: 1,
          ownsBuffer: true,
          buffer: device.createBuffer({
            data: new Float32Array([value]),
            usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
          })
        })
      ]
    });
  const stateVector = makeVector(3);
  const addendVector = makeVector(1);
  const replacement = makeVector(99);
  const compiled = graph.compile(device, {outputs: ['state']});
  try {
    await expect(compiled.run({scale: 2, addend: addendVector})).rejects.toThrow('binding state');
    await expect(
      compiled.run(
        {state: stateVector, scale: 2, addend: addendVector},
        {outputTargets: {state: replacement}}
      )
    ).rejects.toThrow('Output target replaces an earlier read: state');
    expect(await readFloat(stateVector)).toEqual([3]);
    expect(await readFloat(replacement)).toEqual([99]);
    const result = await compiled.run({state: stateVector, scale: 2, addend: addendVector});
    expect(result.state).toBe(stateVector);
    expect(await readFloat(result.state)).toEqual([15]);
  } finally {
    compiled.destroy();
    stateVector.destroy();
    addendVector.destroy();
    replacement.destroy();
  }
});

test('custom contracts allocate typed outputs and feed expressions alongside built-in lowerings', async ({
  skip
}) => {
  const device = await getWebGPUTestDevice();
  if (!device) return skip();
  const graph = new GPUGraph();
  const input = graph.vector('input', 'uint32x2');
  const copied = graph.vector('copied', 'uint32x2');
  const scale = graph.scalar('scale', 'float32');
  const computed = graph.scalar('computed', 'float32');
  graph.vector('result', 'float32');
  graph.add([
    new CustomCopy(input, copied),
    new CustomScalar(scale, computed),
    new GPUExpressionOperation({
      output: 'result',
      expression: 'select(equalAll(copied, input), computed, 0)'
    })
  ]);
  const copyLowering: GPUOperationLowering<void, CustomCopy> = {
    type: 'custom-copy',
    lower: (operation, context) => {
      const source = context.resolveVector(operation.input.id);
      const destination = context.resolveVector(operation.output.id);
      source.data.forEach((chunk, index) => {
        if (!chunk.length) return;
        const output = destination.data[index];
        context.graph.addCopyPass({
          id: `${operation.id}-${index}`,
          resources: [
            {buffer: chunk, usage: 'copy-source'},
            {buffer: output, usage: 'copy-destination'}
          ],
          compile: () => ({
            encode: ({commandEncoder, getBuffer}) =>
              commandEncoder.copyBufferToBuffer({
                sourceBuffer: getBuffer(chunk),
                sourceOffset: chunk.byteOffset,
                destinationBuffer: getBuffer(output),
                destinationOffset: output.byteOffset,
                size: chunk.length * 8
              })
          })
        });
      });
    }
  };
  const scalarLowering: GPUOperationLowering<void, CustomScalar> = {
    type: 'custom-scalar',
    lower: (operation, context) =>
      context.lower(
        new GPUGraphScalarOperation({
          id: `${operation.id}-copy`,
          operation: 'copy',
          left: operation.input,
          output: operation.output
        })
      )
  };
  const lowerings = [copyLowering, scalarLowering];
  const compiled = graph.compile(device, {lowerings, outputs: ['copied', 'computed', 'result']});
  try {
    for (const rows of [3, 1]) {
      const values = makeInput(device, rows);
      const target = rows === 1 ? makeInput(device, rows) : undefined;
      const submit = vi.spyOn(device, 'submit');
      try {
        const result = await compiled.run(
          {input: values, scale: rows},
          {outputTargets: target ? {copied: target} : undefined}
        );
        try {
          expect(submit).toHaveBeenCalledTimes(1);
          expect(result.copied.format).toBe('uint32x2');
          if (target) expect(result.copied).toBe(target);
          expect(result.copied.data.map(chunk => chunk.length)).toEqual([1, 0, rows - 1]);
          expect(await readFloat(result.computed)).toEqual([rows]);
          expect(await readFloat(result.result)).toEqual(Array(rows).fill(rows));
        } finally {
          Object.values(result).forEach(vector => {
            if (vector !== target) vector.destroy();
          });
        }
      } finally {
        submit.mockRestore();
        values.destroy();
        target?.destroy();
      }
    }
  } finally {
    compiled.destroy();
  }
});

test('existing dot-product algorithm exposes a scalar result through its contract', async ({
  skip
}) => {
  const device = await getWebGPUTestDevice();
  if (!device) return skip();
  const graph = new GPUGraph();
  const input = graph.vector('input', 'float32');
  const sum = graph.scalar('sum', 'float32');
  graph.scalar('result', 'float32');
  graph.add([
    new GPUGraphDotProduct({left: input, right: input, output: sum}),
    new GPUExpressionOperation({output: 'result', expression: 'sqrt(sum)'})
  ]);
  const compiled = graph.compile(device, {outputs: ['sum', 'result']});
  const values = new GPUVector({
    type: 'data',
    format: 'float32',
    ownsData: true,
    data: [3, 4].map(
      value =>
        new GPUData({
          format: 'float32',
          length: 1,
          ownsBuffer: true,
          buffer: device.createBuffer({
            data: new Float32Array([value]),
            usage: Buffer.STORAGE | Buffer.COPY_SRC
          })
        })
    )
  });
  try {
    const result = await compiled.run({input: values});
    try {
      expect(await readFloat(result.sum)).toEqual([25]);
      expect(await readFloat(result.result)).toEqual([5]);
    } finally {
      Object.values(result).forEach(vector => vector.destroy());
    }
  } finally {
    compiled.destroy();
    values.destroy();
  }
});
