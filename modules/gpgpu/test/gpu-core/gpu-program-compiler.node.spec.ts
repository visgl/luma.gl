// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  GPUConditionalOperation,
  GPULoopOperation,
  GPUProgram,
  GPUProgramCompiler,
  GPUProgramScalarLiteral,
  GPUProgramVectorMADD
} from '@luma.gl/gpgpu/gpu-core';
import {NullDevice} from '@luma.gl/test-utils';
import {describe, expect, test} from 'vitest';

describe('GPUProgramCompiler command lowering', () => {
  test('lowers nested runtime predicates without conditioning compiler support nodes', () => {
    const device = createWebGPUDevice('nested-predicate-program-device');
    const program = new GPUProgram({id: 'nested-predicate-program'});
    const outerPredicate = program.scalar('outer-predicate', 'uint32');
    const innerPredicate = program.scalar('inner-predicate', 'uint32');
    const output = program.scalar('output', 'float32');

    program.add([
      new GPUProgramScalarLiteral({output: outerPredicate, value: 1}),
      new GPUProgramScalarLiteral({output: innerPredicate, value: 1}),
      new GPUConditionalOperation({
        id: 'outer-condition',
        predicate: {id: 'outer-active', source: 'gpu', value: outerPredicate},
        body: new GPUConditionalOperation({
          id: 'inner-condition',
          predicate: {id: 'inner-active', source: 'gpu', value: innerPredicate},
          body: new GPUProgramScalarLiteral({id: 'conditional-write', output, value: 2})
        })
      })
    ]);

    try {
      const compilation = new GPUProgramCompiler(device).compile(program);
      expect(compilation.lowering.nodes.map(node => node.nodeId)).toContain('conditional-write');
    } finally {
      device.destroy();
    }
  });

  test('gives repeated unrolled command nodes unique identifiers', () => {
    const device = createWebGPUDevice('unrolled-program-device');
    const program = new GPUProgram({id: 'unrolled-program'});
    const output = program.scalar('output', 'float32');
    program.add(
      new GPULoopOperation({
        id: 'bounded-loop',
        maximumIterations: 3,
        body: new GPUProgramScalarLiteral({id: 'loop-write', output, value: 1})
      })
    );

    try {
      const compilation = new GPUProgramCompiler(device).compile(program);
      expect(compilation.lowering.nodes.map(node => node.nodeId)).toEqual([
        'loop-write',
        'loop-write-iteration-1',
        'loop-write-iteration-2'
      ]);
    } finally {
      device.destroy();
    }
  });

  test('emits no dispatch declaration for an empty vector operation', () => {
    const device = createWebGPUDevice('empty-vector-program-device');
    const program = new GPUProgram({id: 'empty-vector-program'});
    const input = program.vector('input', 'float32', 0);
    const addend = program.vector('addend', 'float32', 0);
    const output = program.vector('output', 'float32', 0);
    const scale = program.scalar('scale', 'float32');
    program.add(new GPUProgramVectorMADD({input, scale, addend, output}));

    try {
      const compilation = new GPUProgramCompiler(device).compile(program);
      expect(compilation.lowering.nodes).toHaveLength(0);
    } finally {
      device.destroy();
    }
  });
});

function createWebGPUDevice(id: string): NullDevice {
  const device = new NullDevice({id});
  Object.defineProperty(device, 'type', {value: 'webgpu'});
  return device;
}
