// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {Buffer, Texture} from '@luma.gl/core';
import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {
  makeGPUAnalyticsTableFromArrowTable,
  makeArrowTableFromGPUAnalyticsTable
} from '@luma.gl/graph/arrow';
import {
  GPUDataFrame,
  makeGPUExpressionFromPortableAST,
  type GPUDataFrameQueryParameters
} from '@luma.gl/graph/gpu-dataframe';
import {GPUCommandGraph} from '@luma.gl/graph/gpu-core';
import {GPUVectorModel} from '@luma.gl/engine';
import {parseSQLExpression} from '@math.gl/expressions/sql';
import {expect, test} from 'vitest';

test('renders a SQL-computed packed vec3 directly and reads it back as Arrow', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const input = arrow.tableFromArrays({
    x: new Float32Array([-1, 3, -1]),
    y: new Float32Array([-1, -1, 3]),
    z: new Float32Array([0.25, 0.25, 0.25])
  });
  const frame = new GPUDataFrame({
    ...makeGPUAnalyticsTableFromArrowTable(device, input),
    ownership: 'owned'
  });
  const expression = makeGPUExpressionFromPortableAST(parseSQLExpression('ARRAY[x,y,z]::REAL[3]'));
  const compiled = frame
    .withColumn('position', expression, {format: 'float32x3'})
    .select(['position'])
    .compile(new GPUCommandGraph<GPUDataFrameQueryParameters>(device));
  const model = new GPUVectorModel(device, {
    inferDrawCount: 'vertex',
    topology: 'triangle-list',
    source: `
struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) red: f32
};
@vertex fn vertexMain(@location(0) position: vec3f) -> VertexOutput {
  return VertexOutput(vec4f(position.xy, 0., 1.), position.z);
}
@fragment fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
  return vec4f(input.red, 0., 0., 1.);
}`,
    shaderLayout: {attributes: [{name: 'position', location: 0, type: 'vec3<f32>'}], bindings: []}
  });
  const texture = device.createTexture({
    width: 1,
    height: 1,
    format: 'rgba8unorm',
    usage: Texture.RENDER_ATTACHMENT | Texture.COPY_SRC
  });
  const framebuffer = device.createFramebuffer({width: 1, height: 1, colorAttachments: [texture]});
  const readback = device.createBuffer({
    byteLength: texture.computeMemoryLayout({width: 1, height: 1}).byteLength,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });
  try {
    const encoder = device.createCommandEncoder();
    compiled.encode(encoder);
    device.submit(encoder.finish());
    const position = compiled.table.gpuVectors['position'];
    expect(position.byteStride).toBe(12);
    model.setAttributeVectors({position});
    const renderPass = device.beginRenderPass({framebuffer, clearColor: [0, 0, 0, 0]});
    expect(model.draw(renderPass)).toBe(true);
    renderPass.end();
    device.submit();
    texture.readBuffer({width: 1, height: 1}, readback);
    expect(Array.from((await readback.readAsync()).subarray(0, 4))).toEqual([64, 0, 0, 255]);
    const result = await makeArrowTableFromGPUAnalyticsTable({
      table: compiled.table,
      validity: compiled.validity
    });
    expect(result.schema.fields[0].type).toBeInstanceOf(arrow.FixedSizeList);
    expect(Array.from(result.getChild('position')!.get(1))).toEqual([3, -1, 0.25]);
  } finally {
    readback.destroy();
    framebuffer.destroy();
    texture.destroy();
    model.destroy();
    compiled.destroy();
    frame.destroy();
  }
});
