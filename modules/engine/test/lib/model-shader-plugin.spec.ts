// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Model} from '@luma.gl/engine';
import {getWebGLTestDevice, getWebGPUTestDevice} from '@luma.gl/core/test-utils';

const DUMMY_WGSL = /* WGSL */ `
@vertex fn vertexMain() -> @builtin(position) vec4<f32> {
  return vec4<f32>(0.0, 0.0, 0.0, 1.0);
}

@fragment fn fragmentMain(@builtin(position) coord_in: vec4<f32>) -> @location(0) vec4<f32> {
  return vec4<f32>(coord_in.x, coord_in.y, 0.0, 1.0);
}
`;

const DUMMY_VS = `#version 300 es
  void main() { gl_Position = vec4(1.0); }
`;

const DUMMY_FS = `#version 300 es
  precision highp float;
  out vec4 fragColor;
  void main() { fragColor = vec4(1.0); }
`;

for (const backend of ['webgl', 'webgpu'] as const) {
  it(`Model#plugins and legacy declarations compile together on ${backend}`, async () => {
    const device = backend === 'webgl' ? await getWebGLTestDevice() : await getWebGPUTestDevice();
    if (!device) return;
    const wgsl = device.type === 'webgpu';
    const model = await Model.createAsync(device, {
      id: 'mixed-plugin-declarations',
      vs: DUMMY_VS,
      fs: DUMMY_FS.replace('vec4(1.0)', 'vec4(legacyValue())'),
      source: DUMMY_WGSL.replace(
        'vec4<f32>(coord_in.x, coord_in.y, 0.0, 1.0)',
        'vec4<f32>(legacyValue())'
      ),
      plugins: [
        {
          name: 'declaration-provider',
          injections: [
            {
              target: 'fs:#decl',
              glsl: 'float pluginValue() { return 1.0; }',
              wgsl: 'fn pluginValue() -> f32 { return 1.0; }'
            }
          ]
        }
      ],
      inject: {
        'fs:#decl': wgsl
          ? 'fn legacyValue() -> f32 { return pluginValue(); }'
          : 'float legacyValue() { return pluginValue(); }'
      }
    });
    try {
      const source = wgsl ? model.source : model.fs;
      expect(source).toContain('pluginValue');
      expect(source).toContain('legacyValue');
    } finally {
      model.destroy();
    }
  });
}

it.each([
  false,
  true
])('Model#plugin varyings compile with direct fragment inputs (integer=%s)', async integer => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  device.handle.pushErrorScope('validation');
  const model = await Model.createAsync(device, {
    id: 'direct-fragment-plugin-varyings',
    source: `
struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec4<f32>,
};
@vertex fn vertexMain(@builtin(vertex_index) index: u32) -> VertexOutput {
  return VertexOutput(vec4<f32>(f32(index), 0.0, 0.0, 1.0), vec4<f32>(1.0));
}
@fragment fn fragmentMain(@location(0) color: vec4<f32>, @builtin(front_facing) front: bool) -> @location(0) vec4<f32> {
  return color * f32(pluginValue);
}`,
    plugins: [
      {
        name: 'direct-fragment-varying',
        defines: {PLUGIN_VALUE: 1},
        varyings: {pluginValue: {type: integer ? 'u32' : 'f32'}},
        injections: [
          {
            target: 'vs:#main-start',
            wgsl: `
#if PLUGIN_VALUE == 1
pluginValue = ${integer ? 'u32' : 'f32'}(1);
#else
pluginValue = ${integer ? 'u32' : 'f32'}(0);
#endif
`
          }
        ]
      }
    ]
  });
  try {
    expect(model.source).toContain('@location(1)');
    expect(await device.handle.popErrorScope()).toBeNull();
  } finally {
    model.destroy();
  }
});
