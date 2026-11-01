// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {WGSLShaderAssembler, pbrMaterial, type PlatformInfo} from '@luma.gl/shaders';
import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';

const platform: PlatformInfo = {
  type: 'webgpu',
  shaderLanguage: 'wgsl',
  shaderLanguageVersion: 300,
  gpu: 'test',
  features: new Set()
};
const source = /* wgsl */ `
@vertex fn vertexMain(@builtin(vertex_index) index: u32) -> @builtin(position) vec4f { return vec4f(f32(index), 0.0, 0.0, 1.0); }
@fragment fn fragmentMain(@builtin(position) position: vec4f) -> @location(0) vec4f {
  fragmentInputs.pbr_vPosition = position.xyz;
  fragmentInputs.pbr_vNormal = vec3f(0.0, 0.0, 1.0);
  fragmentInputs.pbr_vUV0 = position.xy;
  fragmentInputs.pbr_vUV1 = position.xy;
  return pbr_filterColor(vec4f(1.0));
}`;

test('area lighting compiles core and layered PBR quadrature on WebGPU', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  for (const extended of [false, true]) {
    const assembled = new WGSLShaderAssembler().assembleWGSLShader({
      platformInfo: platform,
      source,
      modules: [pbrMaterial],
      defines: {HAS_NORMALS: true, USE_LIGHTS: true, USE_MATERIAL_EXTENSIONS: extended}
    }).source;
    const shader = device.createShader({id: 'area-lighting-compile', source: assembled});
    try {
      const errors = (await shader.getCompilationInfo()).filter(
        message => message.type === 'error'
      );
      expect(errors.map(message => message.message)).toEqual([]);
    } finally {
      shader.destroy();
    }
  }
});
