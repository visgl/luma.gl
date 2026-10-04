// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it, vi} from 'vitest';
import {Buffer, Texture} from '@luma.gl/core';
import {Computation, Model} from '@luma.gl/engine';
import {
  mapSlangDiagnostic,
  packSlangUniforms,
  transpileSlang,
  transpileSlangWGSL
} from '@luma.gl/slang';
import {
  getSlangBindingNames,
  getSlangShaderLayout,
  getSlangUniformBufferLayouts
} from '@luma.gl/slang/luma';
import {getWebGLTestDevice, getWebGPUTestDevice} from '@luma.gl/test-utils';
import {MODULE_COMPUTE, MODULE_OPTIONS, MODULE_RENDER, NATIVE_RESOURCES} from './modules-fixtures';

it.each([
  'webgl2',
  'webgpu'
] as const)('slang#typed structs, native calls and exported callbacks render on %s', async backend => {
  const device =
    backend === 'webgl2' ? await getWebGLTestDevice() : await getWebGPUTestDevice('core');
  expect(device).not.toBeNull();
  const vertex = transpileSlang(MODULE_RENDER, {
    ...MODULE_OPTIONS,
    target: 'glsl',
    entryPoint: 'vertexMain'
  });
  const fragment = transpileSlang(MODULE_RENDER, {
    ...MODULE_OPTIONS,
    target: 'glsl',
    entryPoint: 'fragmentMain'
  });
  const program = transpileSlangWGSL(MODULE_RENDER, MODULE_OPTIONS);
  const compiled = backend === 'webgl2' ? [vertex, fragment] : program;
  const uniform = getSlangUniformBufferLayouts(compiled).settings;
  const uniformBuffer = device!.createBuffer({
    byteLength: uniform.byteLength,
    usage: Buffer.UNIFORM | Buffer.COPY_DST
  });
  const texture = device!.createTexture({
    width: 1,
    height: 1,
    format: 'rgba8unorm',
    usage: Texture.RENDER | Texture.COPY_SRC
  });
  const framebuffer = device!.createFramebuffer({width: 1, height: 1, colorAttachments: [texture]});
  const readback = device!.createBuffer({
    byteLength: texture.computeMemoryLayout({width: 1, height: 1}).byteLength,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });
  const model = new Model(device!, {
    source: program.code,
    vs: vertex.code,
    fs: fragment.code,
    vertexEntryPoint: program.entryPoints.vertexMain.entryPoint,
    fragmentEntryPoint: program.entryPoints.fragmentMain.entryPoint,
    shaderLayout: getSlangShaderLayout(compiled),
    bindings: {[uniform.name]: uniformBuffer},
    vertexCount: 3,
    topology: 'triangle-list'
  });
  try {
    uniformBuffer.write(packSlangUniforms(uniform.layout, {scale: 1}));
    await vi.waitFor(() => {
      const pass = device!.beginRenderPass({framebuffer, clearColor: [0, 0, 0, 0]});
      const drawn = model.draw(pass);
      pass.end();
      device!.submit();
      expect(drawn).toBe(true);
    });
    texture.readBuffer({width: 1, height: 1}, readback);
    const pixels = new Uint8Array(await readback.readAsync());
    expect(Math.abs(pixels[0] - 191)).toBeLessThanOrEqual(1);
    expect(Array.from(pixels.subarray(1, 4))).toEqual([0, 0, 255]);
  } finally {
    model.destroy();
    uniformBuffer.destroy();
    readback.destroy();
    framebuffer.destroy();
    texture.destroy();
  }
});

it.each([
  'typed callbacks',
  'native-only resources'
])('slang#WebGPU executes %s with reflected bindings', async fixture => {
  const device = await getWebGPUTestDevice('core');
  expect(device).not.toBeNull();
  const nativeOnly = fixture === 'native-only resources';
  const compiled = transpileSlang(
    nativeOnly
      ? 'import resources; [shader("compute")] [numthreads(1,1,1)] void main() { writeNative(); }'
      : MODULE_COMPUTE,
    {...(nativeOnly ? NATIVE_RESOURCES : MODULE_OPTIONS), target: 'wgsl', omitUnusedResources: true}
  );
  const uniform = getSlangUniformBufferLayouts(compiled).settings;
  const uniformBuffer = device!.createBuffer({
    byteLength: uniform.byteLength,
    usage: Buffer.UNIFORM | Buffer.COPY_DST
  });
  const output = device!.createBuffer({byteLength: 4, usage: Buffer.STORAGE | Buffer.COPY_SRC});
  const computation = await Computation.createAsync(device!, {
    source: compiled.code,
    entryPoint: compiled.entryPoint,
    shaderLayout: getSlangShaderLayout(compiled)
  });
  try {
    uniformBuffer.write(packSlangUniforms(uniform.layout, {scale: 2}));
    const names = getSlangBindingNames(compiled);
    computation.setBindings({
      [uniform.name]: uniformBuffer,
      [names[nativeOnly ? 'values' : 'output']]: output
    });
    const pass = device!.beginComputePass({});
    computation.dispatch(pass, 1);
    pass.end();
    device!.submit();
    const bytes = await output.readAsync();
    expect(new Float32Array(bytes.buffer, bytes.byteOffset, 1)[0]).toBe(nativeOnly ? 2 : 1.25);
  } finally {
    computation.destroy();
    uniformBuffer.destroy();
    output.destroy();
  }
});

it('slang#maps a native WGSL compiler error back to its implementation line', async () => {
  const device = await getWebGPUTestDevice('core');
  expect(device).not.toBeNull();
  const compiled = transpileSlang(
    'import broken; [shader("compute")] [numthreads(1,1,1)] void main() { helper(); }',
    {
      target: 'wgsl',
      modules: {
        broken: {
          declarations: 'void helper();',
          wgsl: 'fn helper() {\n  let value = missingNativeValue;\n}'
        }
      }
    }
  );
  const information = await device!.handle
    .createShaderModule({code: compiled.code})
    .getCompilationInfo();
  const error = information.messages.find(message => message.type === 'error')!;
  expect(error).toBeDefined();
  expect(mapSlangDiagnostic(compiled.sourceMap, error.lineNum, error.message)).toMatchObject({
    sourceName: 'broken.wgsl',
    line: 2
  });
});
