// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {Buffer, Texture} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {
  GPUConstant,
  GPUTable,
  GPUTableModel,
  GPUVector,
  type GPUInputSchema
} from '@luma.gl/tables';

const CONSTANT_ATTRIBUTE_SHADER = /* wgsl */ `
struct VertexInputs {
  @builtin(vertex_index) vertexIndex : u32,
  @location(0) radius : f32,
  @location(1) color : vec4<f32>,
};

struct VertexOutputs {
  @builtin(position) position : vec4<f32>,
  @location(0) color : vec4<f32>,
};

@vertex
fn vertexMain(inputs : VertexInputs) -> VertexOutputs {
  var positions = array<vec2<f32>, 3>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>(3.0, -1.0),
    vec2<f32>(-1.0, 3.0)
  );
  var outputs : VertexOutputs;
  outputs.position = vec4<f32>(positions[inputs.vertexIndex], 0.0, 1.0);
  outputs.color = inputs.color * inputs.radius;
  return outputs;
}

@fragment
fn fragmentMain(inputs : VertexOutputs) -> @location(0) vec4<f32> {
  return inputs.color;
}
`;

const CONSTANT_STORAGE_SHADER = /* wgsl */ `
@group(0) @binding(auto) var<storage, read> radiusValues : array<f32>;
@group(0) @binding(auto) var<storage, read> colorValues : array<u32>;
@group(0) @binding(auto) var<storage, read> scaleValues : array<f32>;

struct VertexInputs {
  @builtin(vertex_index) vertexIndex : u32,
  @builtin(instance_index) instanceIndex : u32,
};

struct VertexOutputs {
  @builtin(position) position : vec4<f32>,
  @location(0) color : vec4<f32>,
};

@vertex
fn vertexMain(inputs : VertexInputs) -> VertexOutputs {
  var positions = array<vec2<f32>, 3>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>(3.0, -1.0),
    vec2<f32>(-1.0, 3.0)
  );
  let radius = radiusValues[gpuTable_getRowIndex(
    inputs.instanceIndex,
    gpuTableColumns.radiusValuesRowMultiplier
  )];
  let colorWord = colorValues[gpuTable_getRowIndex(
    inputs.instanceIndex,
    gpuTableColumns.colorValuesRowMultiplier
  )];
  let color = vec4<f32>(
    f32(colorWord & 0xffu),
    f32((colorWord >> 8u) & 0xffu),
    f32((colorWord >> 16u) & 0xffu),
    f32((colorWord >> 24u) & 0xffu)
  ) / 255.0;
  let scale = scaleValues[gpuTable_getRowIndex(
    inputs.instanceIndex,
    gpuTableColumns.scaleValuesRowMultiplier
  )];

  var outputs : VertexOutputs;
  outputs.position = vec4<f32>(positions[inputs.vertexIndex], 0.0, 1.0);
  outputs.color = color * radius * scale;
  return outputs;
}

@fragment
fn fragmentMain(inputs : VertexOutputs) -> @location(0) vec4<f32> {
  return inputs.color;
}
`;

test('WebGPU draws multiple instances from one zero-stride attribute value', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const constantData = new Uint8Array(8);
  new Float32Array(constantData.buffer, 0, 1)[0] = 1;
  constantData.set([0, 255, 0, 255], 4);
  const colorBuffer = device.createBuffer({
    usage: Buffer.VERTEX,
    data: constantData
  });
  const colorTexture = device.createTexture({
    width: 1,
    height: 1,
    format: 'rgba8unorm',
    usage: Texture.RENDER_ATTACHMENT | Texture.COPY_SRC
  });
  const framebuffer = device.createFramebuffer({
    width: 1,
    height: 1,
    colorAttachments: [colorTexture]
  });
  const model = new Model(device, {
    source: CONSTANT_ATTRIBUTE_SHADER,
    shaderLayout: {
      attributes: [
        {name: 'radius', location: 0, type: 'f32', stepMode: 'instance'},
        {name: 'color', location: 1, type: 'vec4<f32>', stepMode: 'instance'}
      ],
      bindings: []
    },
    bufferLayout: [
      {
        name: 'constants',
        byteStride: 0,
        stepMode: 'instance',
        attributes: [
          {attribute: 'radius', format: 'float32', byteOffset: 0},
          {attribute: 'color', format: 'unorm8x4', byteOffset: 4}
        ]
      }
    ],
    attributes: {constants: colorBuffer},
    vertexCount: 3,
    instanceCount: 4
  });

  const renderPass = device.beginRenderPass({framebuffer, clearColor: [0, 0, 0, 0]});
  t.ok(model.draw(renderPass), 'draw succeeds');
  renderPass.end();
  device.submit();

  t.deepEqual(
    Array.from(await readPixel(framebuffer.colorAttachments[0].texture)),
    [0, 255, 0, 255],
    'every instance reads the single green payload'
  );

  model.destroy();
  framebuffer.destroy();
  colorTexture.destroy();
  colorBuffer.destroy();
  t.end();
});

test('GPUTableModel draws all-constant WebGPU table columns', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const table = new GPUTable({
    columns: {
      radius: new GPUConstant({format: 'float32', value: new Float32Array([1])}),
      color: new GPUConstant({format: 'unorm8x4', value: new Uint8Array([0, 255, 0, 255])})
    },
    numRows: 4
  });
  const schema = [
    {
      columnName: 'radius',
      attributeName: 'radius',
      kind: 'scalars',
      required: false,
      formats: ['float32']
    },
    {
      columnName: 'color',
      attributeName: 'color',
      kind: 'colors',
      required: false,
      formats: ['unorm8x4']
    }
  ] as const satisfies GPUInputSchema;
  const shaderLayout = {
    attributes: [
      {name: 'radius', location: 0, type: 'f32', stepMode: 'instance'},
      {name: 'color', location: 1, type: 'vec4<f32>', stepMode: 'instance'}
    ],
    bindings: []
  } as const;
  const colorTexture = device.createTexture({
    width: 1,
    height: 1,
    format: 'rgba8unorm',
    usage: Texture.RENDER_ATTACHMENT | Texture.COPY_SRC
  });
  const framebuffer = device.createFramebuffer({
    width: 1,
    height: 1,
    colorAttachments: [colorTexture]
  });
  const model = new GPUTableModel(device, {
    source: CONSTANT_ATTRIBUTE_SHADER,
    shaderLayout,
    gpuInputSchema: schema,
    table,
    tableCount: 'instance',
    vertexCount: 3
  });

  const renderPass = device.beginRenderPass({framebuffer, clearColor: [0, 0, 0, 0]});
  t.ok(model.drawBatches(renderPass), 'table batch draw succeeds');
  renderPass.end();
  device.submit();
  t.deepEqual(
    Array.from(await readPixel(colorTexture)),
    [0, 255, 0, 255],
    'table constants render green'
  );

  model.destroy();
  framebuffer.destroy();
  colorTexture.destroy();
  table.destroy();
  t.end();
});

test('GPUTableModel draws one-row WebGPU storage constants', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const table = new GPUTable({
    columns: {
      radius: new GPUConstant({format: 'float32', value: new Float32Array([1])}),
      color: new GPUConstant({format: 'unorm8x4', value: new Uint8Array([0, 255, 0, 255])}),
      scale: new GPUVector({
        type: 'buffer',
        name: 'scale',
        buffer: device.createBuffer({
          usage: Buffer.STORAGE,
          data: new Float32Array([1, 1, 1, 1])
        }),
        format: 'float32',
        length: 4,
        ownsBuffer: true
      })
    }
  });
  const schema = [
    {
      columnName: 'radius',
      storageBindingName: 'radiusValues',
      kind: 'scalars',
      required: false,
      formats: ['float32']
    },
    {
      columnName: 'color',
      storageBindingName: 'colorValues',
      kind: 'colors',
      required: false,
      formats: ['unorm8x4']
    },
    {
      columnName: 'scale',
      storageBindingName: 'scaleValues',
      kind: 'scalars',
      required: true,
      formats: ['float32']
    }
  ] as const satisfies GPUInputSchema;
  const shaderLayout = {
    attributes: [],
    bindings: [
      {name: 'radiusValues', type: 'read-only-storage', group: 0, location: 0},
      {name: 'colorValues', type: 'read-only-storage', group: 0, location: 1},
      {name: 'scaleValues', type: 'read-only-storage', group: 0, location: 2}
    ]
  } as const;
  const colorTexture = device.createTexture({
    width: 1,
    height: 1,
    format: 'rgba8unorm',
    usage: Texture.RENDER_ATTACHMENT | Texture.COPY_SRC
  });
  const framebuffer = device.createFramebuffer({
    width: 1,
    height: 1,
    colorAttachments: [colorTexture]
  });
  const model = new GPUTableModel(device, {
    source: CONSTANT_STORAGE_SHADER,
    shaderLayout,
    gpuInputSchema: schema,
    table,
    tableCount: 'instance',
    vertexCount: 3
  });

  const renderPass = device.beginRenderPass({framebuffer, clearColor: [0, 0, 0, 0]});
  t.ok(model.drawBatches(renderPass), 'storage table batch draw succeeds');
  renderPass.end();
  device.submit();
  t.equal(model.tableBindingByteLength, 48, 'counts two aligned payload rows and one uniform');
  t.deepEqual(
    Array.from(await readPixel(colorTexture)),
    [0, 255, 0, 255],
    'storage constants render green'
  );

  model.destroy();
  framebuffer.destroy();
  colorTexture.destroy();
  table.destroy();
  t.end();
});

async function readPixel(texture: Texture): Promise<Uint8Array> {
  const layout = texture.computeMemoryLayout({width: 1, height: 1});
  const buffer = texture.device.createBuffer({
    byteLength: layout.byteLength,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });
  try {
    texture.readBuffer({width: 1, height: 1}, buffer);
    const arrayBufferView = await buffer.readAsync(0, layout.byteLength);
    return new Uint8Array(arrayBufferView.buffer, arrayBufferView.byteOffset, 4);
  } finally {
    buffer.destroy();
  }
}
