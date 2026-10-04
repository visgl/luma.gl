// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {transpileSlang} from '@luma.gl/slang';
import {getWebGLTestDevice, getWebGPUTestDevice} from '@luma.gl/test-utils';
import reference from './reference.json';
import {EVERYDAY_SHADER, EVERYDAY_RESULTS, EVERYDAY_FUNCTIONS} from './everyday-fixtures';
import {FULLSCREEN_VERTEX} from './compute-textures-fixtures';

it.each([
  'typescript',
  'upstream'
] as const)('slang#%s WGSL executes everyday language against expected results', async compiler => {
  const device = (await getWebGPUTestDevice('core'))!;
  const compiled =
    compiler === 'typescript'
      ? transpileSlang(EVERYDAY_SHADER, {target: 'wgsl'})
      : {
          code: reference.fixtures.everyday.code,
          entryPoint: reference.fixtures.everyday.entryPoint
        };
  const module = device.handle.createShaderModule({code: compiled.code});
  expect(
    (await module.getCompilationInfo()).messages.filter(message => message.type === 'error'),
    compiled.code
  ).toEqual([]);
  const pipeline = await device.handle.createComputePipelineAsync({
    layout: 'auto',
    compute: {module, entryPoint: compiled.entryPoint}
  });
  const output = device.handle.createBuffer({
    size: EVERYDAY_RESULTS.length * 4,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
  });
  const readback = device.handle.createBuffer({
    size: EVERYDAY_RESULTS.length * 4,
    usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
  });
  try {
    const bindings = device.handle.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [{binding: 0, resource: {buffer: output}}]
    });
    const encoder = device.handle.createCommandEncoder();
    const pass = encoder.beginComputePass();
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindings);
    pass.dispatchWorkgroups(1);
    pass.end();
    encoder.copyBufferToBuffer(output, 0, readback, 0, EVERYDAY_RESULTS.length * 4);
    device.handle.queue.submit([encoder.finish()]);
    await readback.mapAsync(GPUMapMode.READ);
    expect(Array.from(new Float32Array(readback.getMappedRange()))).toEqual(EVERYDAY_RESULTS);
    readback.unmap();
  } finally {
    output.destroy();
    readback.destroy();
  }
});
it('slang#WebGL ES 300 executes switch fallthrough, do continuations, inferred locals and numeric/matrix operations', async () => {
  const device = await getWebGLTestDevice();
  const context = device.handle;
  const source = `${EVERYDAY_FUNCTIONS}${FULLSCREEN_VERTEX}
  [shader("fragment")] float4 fragmentMain() : SV_Target { let values=numeric(); let matrixValues=matrices(); return float4(control(0)/100.0,postTest()/100.0,(clauses(0)+values.z+matrixValues.w+conversions())/200.0,1); }`;
  const program = context.createProgram()!;
  const shaders: WebGLShader[] = [];
  const texture = context.createTexture()!;
  const framebuffer = context.createFramebuffer()!;
  try {
    for (const [entryPoint, stage] of [
      ['vertexMain', context.VERTEX_SHADER],
      ['fragmentMain', context.FRAGMENT_SHADER]
    ] as const) {
      const compiled = transpileSlang(source, {target: 'glsl', entryPoint});
      expect(compiled.code).toContain('#version 300 es');
      const shader = context.createShader(stage)!;
      shaders.push(shader);
      context.shaderSource(shader, compiled.code);
      context.compileShader(shader);
      expect(
        context.getShaderParameter(shader, context.COMPILE_STATUS),
        context.getShaderInfoLog(shader) || compiled.code
      ).toBe(true);
      context.attachShader(program, shader);
    }
    context.linkProgram(program);
    expect(
      context.getProgramParameter(program, context.LINK_STATUS),
      context.getProgramInfoLog(program) || ''
    ).toBe(true);
    context.useProgram(program);
    context.bindTexture(context.TEXTURE_2D, texture);
    context.texImage2D(
      context.TEXTURE_2D,
      0,
      context.RGBA8,
      1,
      1,
      0,
      context.RGBA,
      context.UNSIGNED_BYTE,
      null
    );
    context.bindFramebuffer(context.FRAMEBUFFER, framebuffer);
    context.framebufferTexture2D(
      context.FRAMEBUFFER,
      context.COLOR_ATTACHMENT0,
      context.TEXTURE_2D,
      texture,
      0
    );
    context.viewport(0, 0, 1, 1);
    context.disable(context.BLEND);
    context.disable(context.DEPTH_TEST);
    context.drawArrays(context.TRIANGLES, 0, 3);
    const pixels = new Uint8Array(4);
    context.readPixels(0, 0, 1, 1, context.RGBA, context.UNSIGNED_BYTE, pixels);
    for (const [index, value] of [79, 84, 215, 255].entries())
      expect(Math.abs(pixels[index] - value)).toBeLessThanOrEqual(1);
  } finally {
    context.bindFramebuffer(context.FRAMEBUFFER, null);
    context.useProgram(null);
    context.deleteFramebuffer(framebuffer);
    context.deleteTexture(texture);
    context.deleteProgram(program);
    shaders.forEach(shader => context.deleteShader(shader));
  }
});
