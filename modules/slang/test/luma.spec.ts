// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Buffer} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {packSlangUniforms, transpileSlang} from '@luma.gl/slang';
import {
  getSlangBindingNames,
  getSlangShaderLayout,
  getSlangUniformBufferLayouts
} from '@luma.gl/slang/luma';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {UNIFORM_SHADER, UNIFORM_VALUES, UNIFORM_RESULTS} from './fixtures';

it('slang#luma compute executes with reflected layouts and packed nested uniforms', async () => {
  const device = await getWebGPUTestDevice('core');
  expect(device).not.toBeNull();
  const result = transpileSlang(UNIFORM_SHADER, {target: 'wgsl'});
  const uniformLayout = Object.values(getSlangUniformBufferLayouts(result))[0];
  const names = getSlangBindingNames(result);
  const uniform = device!.createBuffer({
    byteLength: uniformLayout.byteLength,
    usage: Buffer.UNIFORM | Buffer.COPY_DST
  });
  const output = device!.createBuffer({
    byteLength: UNIFORM_RESULTS.length * 4,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
  const computation = await Computation.createAsync(device!, {
    source: result.code,
    entryPoint: result.entryPoint,
    shaderLayout: getSlangShaderLayout(result)
  });
  try {
    uniform.write(packSlangUniforms(uniformLayout.layout, UNIFORM_VALUES));
    const storage = result.reflection.bindings.find(binding => binding.kind === 'storage')!;
    computation.setBindings({[uniformLayout.name]: uniform, [names[storage.name]]: output});
    const pass = device!.beginComputePass({});
    computation.dispatch(pass, 1);
    pass.end();
    device!.submit();
    const bytes = await output.readAsync();
    expect(
      Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4))
    ).toEqual(UNIFORM_RESULTS);
  } finally {
    computation.destroy();
    uniform.destroy();
    output.destroy();
  }
});
