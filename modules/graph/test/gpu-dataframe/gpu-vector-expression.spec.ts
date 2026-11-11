// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {GPUData, GPUVector} from '@luma.gl/graph/gpu-data';
import {GPURecordBatch, GPUTable} from '@luma.gl/graph/gpu-tables';
import {GPUCommandGraph} from '@luma.gl/graph/gpu-core';
import {
  GPUDataFrame,
  GPUExpression,
  vector,
  column,
  literal,
  cast,
  parameter,
  type GPUDataFrameQueryParameters
} from '@luma.gl/graph/gpu-dataframe';
import {expect, test} from 'vitest';

for (const width of [2, 3, 4] as const) {
  for (const componentType of ['float32', 'sint32', 'uint32'] as const) {
    test(`DataFrame executes packed ${componentType}x${width} with row validity`, async () => {
      const device = await getWebGPUTestDevice();
      if (!device) return;
      const format = `${componentType}x${width}` as const;
      const schema = {fields: [{name: 'position', format, nullable: true}], metadata: new Map()};
      const ArrayType =
        componentType === 'float32'
          ? Float32Array
          : componentType === 'sint32'
            ? Int32Array
            : Uint32Array;
      const chunks = [2, 0, 1].map(length => {
        const values = new ArrayType(Math.max(1, length * width) + 1);
        for (let index = 1; index < values.length; index++) values[index] = index;
        return new GPUData({
          buffer: device.createBuffer({
            data: values,
            usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST | Buffer.VERTEX
          }),
          format,
          length,
          byteOffset: 4,
          ownsBuffer: true
        });
      });
      const validity = new GPUVector({
        type: 'data',
        name: 'position-validity',
        format: 'uint32',
        ownsData: true,
        data: [new Uint32Array([1, 0]), new Uint32Array(1), new Uint32Array([1])].map(
          (values, index) =>
            new GPUData({
              buffer: device.createBuffer({
                data: values,
                usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
              }),
              format: 'uint32',
              length: chunks[index].length,
              ownsBuffer: true
            })
        )
      });
      const table = new GPUTable({
        schema,
        batches: chunks.map(
          chunk =>
            new GPURecordBatch({
              fields: schema.fields,
              gpuData: {position: chunk},
              ownsData: true,
              length: chunk.length
            })
        )
      });
      const frame = new GPUDataFrame({table, validity: {position: validity}, ownership: 'owned'});
      const increment = vector(
        format,
        Array.from({length: width}, () => cast(literal(2), componentType))
      );
      // Existing column references acquire their exact runtime type from the schema.
      const expression = new GPUExpression<readonly number[] | null>({
        kind: 'binary',
        operator: 'add',
        left: column('position').node,
        right: increment.node
      });
      const query = frame.withColumn('result', expression, {format}).select(['result']);
      const compiled = query.compile(new GPUCommandGraph<GPUDataFrameQueryParameters>(device));
      try {
        const encoder = device.createCommandEncoder();
        compiled.encode(encoder);
        device.submit(encoder.finish());
        expect(compiled.table.gpuVectors.result.byteStride).toBe(width * 4);
        expect(compiled.table.gpuVectors.result.data.map(chunk => chunk.length)).toEqual([2, 0, 1]);
        const result = compiled.table.gpuVectors.result.data[0];
        const bytes = await (result.buffer as Buffer).readAsync(0, width * 2 * 4);
        expect(
          Array.from(new ArrayType(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4))
        ).toEqual(Array.from({length: width * 2}, (_, index) => index + 3));
        const validityBytes = await (compiled.validity.result!.data[0].buffer as Buffer).readAsync(
          0,
          8
        );
        expect(
          Array.from(
            new Uint32Array(
              validityBytes.buffer,
              validityBytes.byteOffset,
              validityBytes.byteLength / 4
            )
          )
        ).toEqual([1, 0]);
      } finally {
        compiled.destroy();
        frame.destroy();
      }
    });
  }
}

test('DataFrame vector constructors propagate null parameters and saturating casts', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const schema = {fields: [{name: 'value', format: 'float32' as const}], metadata: new Map()};
  const chunk = new GPUData({
    buffer: device.createBuffer({
      data: new Float32Array([-2.7, 4.9, 1e20, NaN]),
      usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
    }),
    format: 'float32',
    length: 4,
    ownsBuffer: true
  });
  const table = new GPUTable({
    schema,
    batches: [
      new GPURecordBatch({
        fields: schema.fields,
        gpuData: {value: chunk},
        length: 4,
        ownsData: true
      })
    ]
  });
  const frame = new GPUDataFrame({table, ownership: 'owned'});
  const expression = cast(
    vector('float32x3', [column('value'), parameter('offset', 1), literal(3)]),
    'uint32x3'
  );
  const compiled = frame
    .withColumn('result', expression, {format: 'uint32x3'})
    .select(['result'])
    .compile(new GPUCommandGraph<GPUDataFrameQueryParameters>(device));
  try {
    let encoder = device.createCommandEncoder();
    compiled.encode(encoder);
    device.submit(encoder.finish());
    const bytes = await (compiled.table.gpuVectors.result.data[0].buffer as Buffer).readAsync(
      0,
      36
    );
    expect(
      Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4))
    ).toEqual([0, 1, 3, 4, 1, 3, 4294967295, 1, 3]);
    expect(Array.from(await readValidity(compiled.validity.result!))).toEqual([1, 1, 1, 0]);
    encoder = device.createCommandEncoder();
    compiled.encode(encoder, {offset: null});
    device.submit(encoder.finish());
    expect(Array.from(await readValidity(compiled.validity.result!))).toEqual([0, 0, 0, 0]);
  } finally {
    compiled.destroy();
    frame.destroy();
  }
});

async function readValidity(vector: GPUVector) {
  const bytes = await (vector.data[0].buffer as Buffer).readAsync(0, 16);
  return new Uint32Array(bytes.buffer, bytes.byteOffset, 4);
}
