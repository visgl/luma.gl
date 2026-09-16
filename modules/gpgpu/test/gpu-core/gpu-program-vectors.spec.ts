// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {Buffer} from '@luma.gl/core';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {GPUData} from '@luma.gl/gpgpu/gpu-data';
import {
  GPUProgram,
  GPUProgramCompiler,
  GPUProgramVectorMADD,
  GPUProgramDotProduct,
  GPUProgramScalarLiteral,
  GPUConditionalOperation
} from '@luma.gl/gpgpu/gpu-core';

for (const enabled of [0, 1]) {
  test(`program MADD and dot respect GPU predicate ${enabled} across chunk boundaries`, async () => {
    const device = await getWebGPUTestDevice();
    if (!device) return;
    const buffers: Buffer[] = [];
    const chunk = (values: number[]) => {
      const buffer = device.createBuffer({
        data: new Float32Array(values.length ? values : [0]),
        usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
      });
      buffers.push(buffer);
      return new GPUData({buffer, format: 'float32', length: values.length});
    };
    const inputData = [chunk([1, 2]), chunk([]), chunk([3, 4, 5])];
    const addendData = [chunk([10]), chunk([20, 30, 40, 50])];
    const outputData = [chunk([0, 0, 0]), chunk([0, 0])];
    const totalBuffer = device.createBuffer({
      byteLength: 4,
      usage: Buffer.COPY_DST | Buffer.COPY_SRC
    });
    buffers.push(totalBuffer);
    const program = new GPUProgram();
    const input = program.vector('input', 'float32', 5, {external: true});
    const addend = program.vector('addend', 'float32', 5, {external: true});
    const output = program.vector('output', 'float32', 5, {external: true});
    const scale = program.scalar('scale', 'float32');
    const total = program.scalar('total', 'float32');
    const active = program.scalar('active', 'uint32');
    program.add([
      new GPUProgramScalarLiteral({output: active, value: enabled}),
      new GPUProgramScalarLiteral({output: total, value: 37}),
      new GPUProgramScalarLiteral({output: scale, value: 2}),
      new GPUConditionalOperation({
        predicate: {id: 'enabled', source: 'gpu', value: active},
        body: [
          new GPUProgramVectorMADD({input, addend, output, scale}),
          new GPUProgramDotProduct({left: input, right: addend, output: total})
        ]
      })
    ]);
    const compilation = new GPUProgramCompiler(device).compile(program, {
      vectors: {input: inputData, addend: addendData, output: outputData}
    });
    const totalView = compilation.scalars.get('total')!.view;
    const destination = compilation.graph.importBuffer(
      {id: 'readback', byteLength: 4, usage: totalBuffer.usage},
      totalBuffer
    );
    compilation.graph.addCopyPass({
      id: 'copy-total',
      resources: [
        {buffer: totalView, usage: 'copy-source'},
        {buffer: destination, usage: 'copy-destination'}
      ],
      compile: () => ({
        encode: ({commandEncoder, getBuffer}) =>
          commandEncoder.copyBufferToBuffer({
            sourceBuffer: getBuffer(totalView),
            sourceOffset: totalView.byteOffset,
            destinationBuffer: getBuffer(destination),
            size: 4
          })
      })
    });
    const executable = compilation.graph.compile();
    try {
      // Repeated encoding must overwrite the previous dot result before accumulating later chunks.
      for (let iteration = 0; iteration < 2; iteration++) {
        const encoder = device.createCommandEncoder();
        executable.encode(encoder, {parameters: undefined});
        device.submit(encoder.finish());
        const results = await Promise.all(outputData.map(data => data.buffer.readAsync()));
        expect(
          results.flatMap(bytes =>
            Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4))
          )
        ).toEqual(enabled ? [12, 24, 36, 48, 60] : [0, 0, 0, 0, 0]);
        const bytes = await totalBuffer.readAsync();
        expect(new Float32Array(bytes.buffer, bytes.byteOffset, 1)[0]).toBe(enabled ? 550 : 37);
      }
    } finally {
      executable.destroy();
      for (const buffer of buffers) buffer.destroy();
    }
  });
}

for (const outputAlias of ['input', 'addend', 'both'] as const) {
  for (const chunked of [false, true]) {
    test(`program MADD executes in place for ${outputAlias} (${chunked ? 'split' : 'single'} chunks)`, async () => {
      const device = await getWebGPUTestDevice();
      if (!device) return;
      const buffers: Buffer[] = [];
      const chunks = (batches: number[][]) =>
        batches.map(values => {
          const buffer = device.createBuffer({
            data: new Float32Array(values.length ? values : [0]),
            usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
          });
          buffers.push(buffer);
          return new GPUData({buffer, format: 'float32', length: values.length});
        });
      const inputData = chunks(chunked ? [[1, 2], [], [3, 4, 5]] : [[1, 2, 3, 4, 5]]);
      const addendData = chunks(chunked ? [[10], [20, 30, 40, 50]] : [[10, 20, 30, 40, 50]]);
      const program = new GPUProgram();
      const input = program.vector('input', 'float32', 5, {external: true});
      const addend =
        outputAlias === 'both' ? input : program.vector('addend', 'float32', 5, {external: true});
      const output = outputAlias === 'addend' ? addend : input;
      const scale = program.scalar('scale', 'float32');
      program.add([
        new GPUProgramScalarLiteral({output: scale, value: 2}),
        new GPUProgramVectorMADD({input, addend, output, scale})
      ]);
      const compilation = new GPUProgramCompiler(device).compile(program, {
        vectors: {input: inputData, addend: addendData}
      });
      const executable = compilation.graph.compile();
      try {
        const encoder = device.createCommandEncoder();
        executable.encode(encoder, {parameters: undefined});
        device.submit(encoder.finish());
        const outputData = outputAlias === 'addend' ? addendData : inputData;
        const result: number[] = [];
        for (const data of outputData) {
          if (data.length) {
            const bytes = await data.buffer.readAsync();
            result.push(...new Float32Array(bytes.buffer, bytes.byteOffset, data.length));
          }
        }
        expect(result).toEqual(outputAlias === 'both' ? [3, 6, 9, 12, 15] : [12, 24, 36, 48, 60]);
      } finally {
        executable.destroy();
        for (const buffer of buffers) buffer.destroy();
      }
    });
  }
}
