// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it, vi} from 'vitest';
import {Computation} from '@luma.gl/engine';
import {WGSLShaderAssembler} from '@luma.gl/shaders';
import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';

const COMPUTE_SOURCE = '@compute @workgroup_size(1) fn main() {}';
const OWNED_MODULE = {
  name: 'ownedAssemblerMarker',
  source: 'const OWNED_ASSEMBLER_MARKER: u32 = 1u;'
};

it('Computation owns its default assembler and honors explicit injection', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    context.skip('WebGPU not available');
    return;
  }
  const assemblers: WGSLShaderAssembler[] = [];
  const assemble = WGSLShaderAssembler.prototype.assembleWGSLShader;
  const assembleSpy = vi
    .spyOn(WGSLShaderAssembler.prototype, 'assembleWGSLShader')
    .mockImplementation(function (this: WGSLShaderAssembler, props) {
      assemblers.push(this);
      return assemble.call(this, props);
    });
  const first = new Computation(device, {source: COMPUTE_SOURCE});
  assemblers[0].addDefaultModule(OWNED_MODULE);
  const second = new Computation(device, {source: COMPUTE_SOURCE});
  const shared = new Computation(device, {source: COMPUTE_SOURCE, shaderAssembler: assemblers[0]});
  try {
    expect(assemblers[1]).not.toBe(assemblers[0]);
    expect(second.source).not.toContain('OWNED_ASSEMBLER_MARKER');
    expect(shared.source).toContain('OWNED_ASSEMBLER_MARKER');
  } finally {
    assembleSpy.mockRestore();
    first.destroy();
    second.destroy();
    shared.destroy();
  }
});
