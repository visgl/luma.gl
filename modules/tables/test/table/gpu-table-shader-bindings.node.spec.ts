// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import type {ShaderLayout} from '@luma.gl/core';
import {NullDevice} from '@luma.gl/test-utils';
import {
  getGPUInputAttributeNames,
  GPUConstant,
  GPUData,
  GPURecordBatch,
  GPUTable,
  GPUTableShaderBindings,
  GPUVector,
  type GPUInputSchema
} from '@luma.gl/tables';

const GPU_INPUT_SCHEMA = [
  {
    columnName: 'positions',
    attributeName: 'positions',
    storageBindingName: 'positions',
    kind: 'positions',
    required: true,
    formats: ['float32x2']
  },
  {
    columnName: 'weights',
    storageBindingName: 'polygonWeights',
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

test('GPUTableShaderBindings resolves draw-ready buffers per preserved batch', t => {
  const device = new NullDevice({});
  const firstBatch = makeBatch(device, 2);
  const secondBatch = makeBatch(device, 3);
  const table = new GPUTable({
    batches: [firstBatch, secondBatch]
  });

  const shaderBindings = new GPUTableShaderBindings(device, {
    table,
    gpuInputSchema: GPU_INPUT_SCHEMA,
    shaderLayout: SHADER_LAYOUT
  });

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

  shaderBindings.destroy();
  table.destroy();
  t.end();
});

test('GPUTableShaderBindings validates schema formats', t => {
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
    () =>
      new GPUTableShaderBindings(device, {
        table,
        gpuInputSchema: incompatibleSchema,
        shaderLayout: SHADER_LAYOUT
      }),
    /must be one of float32x3/,
    'rejects a table vector with an incompatible input format'
  );
  table.destroy();
  t.end();
});

test('GPUTableShaderBindings can bind one input as an attribute and storage', t => {
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

  const shaderBindings = new GPUTableShaderBindings(device, {
    table,
    gpuInputSchema: GPU_INPUT_SCHEMA.slice(0, 1),
    shaderLayout: sharedShaderLayout
  });
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

  shaderBindings.destroy();
  table.destroy();
  t.end();
});

test('GPUTableShaderBindings maps one composite input to attributes or storage', t => {
  const device = new NullDevice({});
  const matrix = makeMatrixVector(device, 2);
  const table = new GPUTable({vectors: {matrix}});
  const schema = [
    {
      columnName: 'matrix',
      attributeNames: ['matrixColumn3', 'matrixColumn1', 'matrixColumn0', 'matrixColumn2'],
      storageBindingName: 'matrix',
      kind: 'matrices',
      required: true,
      formats: ['float32x4']
    }
  ] as const satisfies GPUInputSchema;
  const attributeShaderLayout = {
    attributes: [
      {name: 'matrixColumn0', location: 0, type: 'vec4<f32>', stepMode: 'instance'},
      {name: 'matrixColumn1', location: 1, type: 'vec4<f32>', stepMode: 'instance'},
      {name: 'matrixColumn2', location: 2, type: 'vec4<f32>', stepMode: 'instance'},
      {name: 'matrixColumn3', location: 3, type: 'vec4<f32>', stepMode: 'instance'}
    ],
    bindings: []
  } as const satisfies ShaderLayout;
  const attributeBindings = new GPUTableShaderBindings(device, {
    table,
    gpuInputSchema: schema,
    shaderLayout: attributeShaderLayout
  });

  t.equal(attributeBindings.bufferLayout.length, 1, 'binds one physical matrix buffer');
  t.deepEqual(
    attributeBindings.bufferLayout[0],
    {
      name: 'matrix',
      stepMode: 'instance',
      byteStride: 64,
      attributes: [
        {attribute: 'matrixColumn0', format: 'float32x4', byteOffset: 0},
        {attribute: 'matrixColumn1', format: 'float32x4', byteOffset: 16},
        {attribute: 'matrixColumn2', format: 'float32x4', byteOffset: 32},
        {attribute: 'matrixColumn3', format: 'float32x4', byteOffset: 48}
      ]
    },
    'orders projected attributes by shader location'
  );
  t.deepEqual(
    attributeBindings.batches[0].attributeBuffers,
    [matrix.data[0].buffer],
    'binds the shared physical buffer once'
  );

  const storageBindings = new GPUTableShaderBindings(device, {
    table,
    gpuInputSchema: schema,
    shaderLayout: {
      attributes: [],
      bindings: [{name: 'matrix', type: 'read-only-storage', group: 0, location: 0}]
    }
  });
  t.equal(storageBindings.bufferLayout.length, 0, 'omits inactive attribute projections');
  t.deepEqual(
    storageBindings.batches[0].bindings.matrix,
    {buffer: matrix.data[0].buffer, offset: 0, size: 128},
    'binds the same column as storage'
  );

  attributeBindings.destroy();
  storageBindings.destroy();
  table.destroy();
  t.end();
});

test('composite GPU input validation rejects malformed declarations and constants', t => {
  const validInput = {
    columnName: 'matrix',
    attributeNames: ['matrixColumn0', 'matrixColumn1'],
    kind: 'matrices',
    required: true,
    formats: ['float32x4']
  } as const satisfies GPUInputSchema[number];
  t.deepEqual(
    getGPUInputAttributeNames(validInput),
    ['matrixColumn0', 'matrixColumn1'],
    'returns composite attribute names'
  );
  t.deepEqual(
    getGPUInputAttributeNames({
      ...validInput,
      attributeName: 'matrixColumn0'
    } as unknown as GPUInputSchema[number]),
    ['matrixColumn0', 'matrixColumn1'],
    'prefers composite names in unchecked JavaScript input'
  );
  t.throws(
    () =>
      getGPUInputAttributeNames({
        ...validInput,
        attributeNames: ['matrixColumn0']
      } as unknown as GPUInputSchema[number]),
    'rejects a singular name in the composite field'
  );
  t.throws(
    () =>
      getGPUInputAttributeNames({
        ...validInput,
        attributeNames: ['matrixColumn0', 'matrixColumn0']
      }),
    'rejects duplicate composite mappings'
  );

  const device = new NullDevice({});
  const table = new GPUTable({
    columns: {
      matrix: new GPUConstant({format: 'float32x4', value: new Float32Array(4)})
    },
    numRows: 2
  });
  t.throws(
    () =>
      new GPUTableShaderBindings(device, {
        table,
        gpuInputSchema: [{...validInput, required: false}],
        shaderLayout: {
          attributes: [
            {name: 'matrixColumn0', location: 0, type: 'vec4<f32>'},
            {name: 'matrixColumn1', location: 1, type: 'vec4<f32>'}
          ],
          bindings: []
        }
      }),
    'rejects composite constant attributes'
  );
  t.throws(
    () =>
      new GPUTableShaderBindings(device, {
        table,
        gpuInputSchema: [{...validInput, required: false, storageBindingName: 'matrixStorage'}],
        shaderLayout: {
          attributes: [],
          bindings: [
            {
              name: 'matrixStorage',
              type: 'read-only-storage',
              group: 0,
              location: 0
            }
          ]
        }
      }),
    'rejects composite constants when only their storage binding is active'
  );
  table.destroy();
  t.end();
});

test('composite GPU inputs require matching table attribute views', t => {
  const device = new NullDevice({});
  const shaderLayout = {
    attributes: [
      {name: 'matrixColumn0', location: 0, type: 'vec4<f32>'},
      {name: 'matrixColumn1', location: 1, type: 'vec4<f32>'}
    ],
    bindings: []
  } as const satisfies ShaderLayout;
  const schema = [
    {
      columnName: 'matrix',
      attributeNames: ['matrixColumn0', 'matrixColumn1'],
      kind: 'matrices',
      required: true,
      formats: ['float32x4']
    }
  ] as const satisfies GPUInputSchema;
  const packedTable = new GPUTable({
    vectors: {matrix: makeVector(device, 'matrix', 'float32x4', 2)}
  });
  t.throws(
    () =>
      new GPUTableShaderBindings(device, {
        table: packedTable,
        gpuInputSchema: schema,
        shaderLayout
      }),
    'rejects a composite input backed by a flat layout'
  );
  packedTable.destroy();

  const matrixTable = new GPUTable({vectors: {matrix: makeMatrixVector(device, 2)}});
  const missingViewSchema = [
    {...schema[0], attributeNames: ['matrixColumn0', 'missingMatrixColumn']}
  ] as const satisfies GPUInputSchema;
  t.throws(
    () =>
      new GPUTableShaderBindings(device, {
        table: matrixTable,
        gpuInputSchema: missingViewSchema,
        shaderLayout: {
          attributes: [
            shaderLayout.attributes[0],
            {name: 'missingMatrixColumn', location: 1, type: 'vec4<f32>'}
          ],
          bindings: []
        }
      }),
    'rejects a composite name missing from the table layout'
  );
  matrixTable.destroy();
  t.end();
});

test('GPUTableShaderBindings prepares zero-stride attribute and one-row storage constants', t => {
  const device = new NullDevice({});
  const colors = new GPUConstant({
    format: 'unorm8x4',
    value: new Uint8Array([10, 20, 30, 40])
  });
  const weights = new GPUConstant({format: 'float32', value: new Float32Array([2])});
  const table = new GPUTable({columns: {colors, weights}, numRows: 5});
  const schema = [
    {
      columnName: 'colors',
      attributeName: 'colors',
      kind: 'colors',
      required: false,
      formats: ['unorm8x4']
    },
    {
      columnName: 'weights',
      storageBindingName: 'weights',
      kind: 'scalars',
      required: false,
      formats: ['float32']
    }
  ] as const satisfies GPUInputSchema;
  const shaderLayout = {
    attributes: [{name: 'colors', location: 0, type: 'vec4<f32>', stepMode: 'instance'}],
    bindings: [{name: 'weights', type: 'read-only-storage', group: 0, location: 0}]
  } satisfies ShaderLayout;
  const shaderBindings = new GPUTableShaderBindings(device, {
    table,
    gpuInputSchema: schema,
    shaderLayout
  });

  t.equal(shaderBindings.bufferLayout[0].byteStride, 0, 'preserves explicit zero stride');
  t.equal(shaderBindings.batches.length, 1, 'retains the data-less logical batch');
  t.ok(shaderBindings.batches[0].bindings.weights, 'binds a one-row storage buffer');
  t.ok(shaderBindings.batches[0].bindings.gpuTableColumns, 'binds row multipliers');
  t.match(
    shaderBindings.shaderModule?.source ?? '',
    /weightsRowMultiplier/,
    'generates the named storage multiplier'
  );
  t.ok(shaderBindings.ownedByteLength >= 12, 'accounts for owned constant resources');

  shaderBindings.destroy();
  table.destroy();
  t.end();
});

test('GPUTableShaderBindings rejects constants for required inputs', t => {
  const device = new NullDevice({});
  const positions = new GPUConstant({format: 'float32x2', value: new Float32Array([0, 0])});
  const table = new GPUTable({columns: {positions}, numRows: 2});
  t.throws(
    () =>
      new GPUTableShaderBindings(device, {
        table,
        gpuInputSchema: GPU_INPUT_SCHEMA.slice(0, 1),
        shaderLayout: SHADER_LAYOUT
      }),
    /required inputs cannot be constant/,
    'required schema declarations stay varying'
  );
  table.destroy();
  t.end();
});

test('GPUTableShaderBindings reuses compatible owned buffers and destroys them', t => {
  const device = new NullDevice({});
  const schema = [
    {
      columnName: 'colors',
      attributeName: 'colors',
      kind: 'colors',
      required: false,
      formats: ['unorm8x4']
    }
  ] as const satisfies GPUInputSchema;
  const shaderLayout = {
    attributes: [{name: 'colors', location: 0, type: 'vec4<f32>', stepMode: 'instance'}],
    bindings: []
  } satisfies ShaderLayout;
  const firstTable = new GPUTable({
    columns: {
      colors: new GPUConstant({format: 'unorm8x4', value: new Uint8Array([1, 2, 3, 4])})
    },
    numRows: 2
  });
  const secondTable = new GPUTable({
    columns: {
      colors: new GPUConstant({format: 'unorm8x4', value: new Uint8Array([5, 6, 7, 8])})
    },
    numRows: 3
  });
  const shaderBindings = new GPUTableShaderBindings(device, {
    table: firstTable,
    gpuInputSchema: schema,
    shaderLayout
  });
  const firstBuffer = shaderBindings.batches[0].attributeBuffers[0];

  shaderBindings.updateBindings(secondTable);
  t.equal(shaderBindings.batches[0].attributeBuffers[0], firstBuffer, 'reuses equal-size buffers');
  shaderBindings.destroy();
  t.ok(firstBuffer.destroyed, 'destroy releases the reused owned buffer');
  t.throws(
    () => shaderBindings.updateBindings(firstTable),
    /has been destroyed/,
    'destroyed bindings cannot be updated'
  );
  firstTable.destroy();
  secondTable.destroy();
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

function makeMatrixVector(device: NullDevice, rowCount: number): GPUVector<'float32x4'> {
  const data = new GPUData({
    buffer: device.createBuffer({data: new Float32Array(rowCount * 16)}),
    format: 'float32x4',
    length: rowCount,
    stride: 16,
    byteStride: 64,
    rowByteLength: 64,
    ownsBuffer: true
  });
  return new GPUVector({
    type: 'data',
    name: 'matrix',
    format: 'float32x4',
    data: [data],
    stride: 16,
    byteStride: 64,
    rowByteLength: 64,
    bufferLayout: {
      name: 'matrix',
      stepMode: 'instance',
      byteStride: 64,
      attributes: [
        {attribute: 'matrixColumn0', format: 'float32x4', byteOffset: 0},
        {attribute: 'matrixColumn1', format: 'float32x4', byteOffset: 16},
        {attribute: 'matrixColumn2', format: 'float32x4', byteOffset: 32},
        {attribute: 'matrixColumn3', format: 'float32x4', byteOffset: 48}
      ]
    },
    ownsData: true
  });
}
