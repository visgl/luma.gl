// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type CommandEncoder} from '@luma.gl/core';
import {getTestDevice} from '@luma.gl/core/test-utils';
import {encodeComputePipeline, type ComputePipelineDefinition} from '@luma.gl/graph/gpu-effects';
import {expect, it} from 'vitest';

it('prepares named bindings before a grouped pass and runs operations between passes', async () => {
  const device = await getTestDevice('null');
  if (!device) throw new Error('Expected a null device for this test.');
  const inputBuffer = device.createBuffer({byteLength: 4, usage: Buffer.STORAGE});
  const commands: string[] = [];
  const commandEncoder = {
    beginComputePass: ({id}: {id: string}) => {
      commands.push(id);
      return {end: () => commands.push('end')};
    }
  } as unknown as CommandEncoder;
  const definition = {
    name: 'pipeline',
    passes: [
      {
        kind: 'compute',
        name: 'group',
        dispatches: [
          {kernel: 'prepare', bindings: {input: 'input'}, workgroups: () => [1]},
          {
            kernel: 'compute',
            bindings: {input: 'input', output: 'optionalOutput'},
            workgroups: frame => [frame.count]
          }
        ]
      },
      {
        kind: 'operation',
        name: 'finish',
        encode: () => {
          commands.push('operation');
        }
      },
      {
        kind: 'operation',
        name: 'skip',
        when: () => false,
        encode: () => {
          throw new Error('A disabled operation must not be recorded.');
        }
      }
    ]
  } as const satisfies ComputePipelineDefinition<
    {input: Buffer; optionalOutput?: Buffer},
    'prepare' | 'compute',
    {count: number}
  >;

  try {
    encodeComputePipeline(definition, {
      commandEncoder,
      resources: {input: inputBuffer},
      frame: {count: 7},
      prepare: kernel => {
        commands.push(`prepare-${kernel}`);
      },
      dispatch: (kernel, _pass, bindings, [workgroupCount]) => {
        expect(bindings).toEqual({input: inputBuffer});
        commands.push(`${kernel}-${workgroupCount}`);
      }
    });

    expect(commands).toEqual([
      'prepare-prepare',
      'prepare-compute',
      'pipeline-group',
      'prepare-1',
      'compute-7',
      'end',
      'operation'
    ]);
  } finally {
    inputBuffer.destroy();
  }
});
