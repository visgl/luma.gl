// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import type {ShaderLayout} from '@luma.gl/core';
import {NullDevice} from '@luma.gl/test-utils';
import {
  getShaderBindingsFromGPUTable,
  GPURecordBatch,
  GPUTable,
  GPUVector,
  type GPUInputSchema
} from '@luma.gl/tables';

const GPU_INPUT_SCHEMA = [
  {
    columnName: 'positions',
    attributeName: 'positions',
    bindingName: 'positions',
    kind: 'positions',
    required: true,
    formats: ['float32x2']
  },
  {
    columnName: 'weights',
    bindingName: 'polygonWeights',
    kind: 'scalars',
    required: true,
    formats: ['float32']
  }
] as const satisfies GPUInputSchema;

const SHADER_LAYOUT = {
  attributes: [{name: 'positions', location: 0, type: 'vec2<f32>', stepMode: 'instance'}],
  bindings: [
    {
      name: 'polygonWeights',
      type: 'read-only-storage',
      group: 0,
      location: 0
    }
  ]
} satisfies ShaderLayout;

test('getShaderBindingsFromGPUTable resolves draw-ready buffers per preserved batch', t => {
  const device = new NullDevice({});
  const firstBatch = makeBatch(device, 2);
  const secondBatch = makeBatch(device, 3);
  const table = new GPUTable({
    batches: [firstBatch, secondBatch]
  });

  const shaderBindings = getShaderBindingsFromGPUTable(table, GPU_INPUT_SCHEMA, SHADER_LAYOUT);

  t.deepEqual(
    shaderBindings.bufferLayout.map(layout => layout.name),
    ['positions'],
    'returns only shader attribute layouts'
  );
  t.equal(shaderBindings.batches.length, 2, 'preserves table batch boundaries');
  t.deepEqual(
    shaderBindings.batches[0].attributeBuffers,
    [firstBatch.gpuData.positions.buffer],
    'orders attribute buffers like the returned layout'
  );
  t.equal(
    shaderBindings.batches[1].attributes.positions,
    secondBatch.gpuData.positions.buffer,
    'returns Model-ready named attributes for each batch'
  );
  t.deepEqual(
    shaderBindings.batches[0].bindings.polygonWeights,
    {
      buffer: firstBatch.gpuData.weights.buffer,
      offset: Float32Array.BYTES_PER_ELEMENT,
      size: firstBatch.gpuData.weights.valueLength * firstBatch.gpuData.weights.byteStride
    },
    'returns Model-ready storage binding ranges'
  );

  table.destroy();
  t.end();
});

test('getShaderBindingsFromGPUTable validates schema formats', t => {
  const device = new NullDevice({});
  const table = new GPUTable({
    vectors: {
      positions: makeVector(device, 'positions', 'float32x2', 2),
      weights: makeVector(device, 'weights', 'float32', 2)
    }
  });
  const incompatibleSchema = [
    {
      columnName: 'positions',
      attributeName: 'positions',
      kind: 'positions',
      required: true,
      formats: ['float32x3']
    }
  ] as const satisfies GPUInputSchema;
  t.throws(
    () => getShaderBindingsFromGPUTable(table, incompatibleSchema, SHADER_LAYOUT),
    /must be one of float32x3/,
    'rejects a table vector with an incompatible input format'
  );
  table.destroy();
  t.end();
});

test('getShaderBindingsFromGPUTable can bind one input as an attribute and storage', t => {
  const device = new NullDevice({});
  const table = new GPUTable({
    vectors: {
      positions: makeVector(device, 'positions', 'float32x2', 2)
    }
  });
  const sharedShaderLayout = {
    attributes: [{name: 'positions', location: 0, type: 'vec2<f32>'}],
    bindings: [
      {
        name: 'positions',
        type: 'read-only-storage',
        group: 0,
        location: 0
      }
    ]
  } satisfies ShaderLayout;

  const shaderBindings = getShaderBindingsFromGPUTable(
    table,
    GPU_INPUT_SCHEMA.slice(0, 1),
    sharedShaderLayout
  );
  t.equal(
    shaderBindings.batches[0].attributes.positions,
    table.batches[0].gpuData.positions.buffer,
    'returns the attribute resource'
  );
  t.deepEqual(
    shaderBindings.batches[0].bindings.positions,
    {
      buffer: table.batches[0].gpuData.positions.buffer,
      offset: 0,
      size:
        table.batches[0].gpuData.positions.valueLength *
        table.batches[0].gpuData.positions.byteStride
    },
    'returns the storage resource'
  );

  table.destroy();
  t.end();
});

function makeBatch(device: NullDevice, rowCount: number): GPURecordBatch {
  const positions = makeVector(device, 'positions', 'float32x2', rowCount);
  const weights = makeVector(
    device,
    'weights',
    'float32',
    rowCount,
    Float32Array.BYTES_PER_ELEMENT
  );
  return new GPURecordBatch({
    gpuData: {
      positions: positions.data[0],
      weights: weights.data[0]
    }
  });
}

function makeVector(
  device: NullDevice,
  name: string,
  format: 'float32' | 'float32x2',
  rowCount: number,
  byteOffset = 0
): GPUVector {
  const componentCount = format === 'float32x2' ? 2 : 1;
  return new GPUVector({
    type: 'buffer',
    name,
    buffer: device.createBuffer({
      data: new Float32Array(
        rowCount * componentCount + byteOffset / Float32Array.BYTES_PER_ELEMENT
      )
    }),
    format,
    length: rowCount,
    byteOffset,
    stride: componentCount,
    byteStride: Float32Array.BYTES_PER_ELEMENT * componentCount,
    ownsBuffer: true
  });
}
