// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it, vi} from 'vitest';
import {WGSLShaderAssembler, type PlatformInfo} from '@luma.gl/shadertools';
import {assembleWGSLShader} from '../../../src/lib/shader-assembly/assemble-shaders';
import * as bindingDebug from '../../../src/lib/shader-assembly/wgsl-binding-debug';
import * as interfaceScan from '../../../src/lib/shader-assembly/wgsl-interface-scan';

const platformInfo: PlatformInfo = {
  type: 'webgpu',
  gpu: 'test-gpu',
  shaderLanguage: 'wgsl',
  shaderLanguageVersion: 300,
  features: new Set()
};
const source = `
@group(0) @binding(0) var<uniform> scale: f32;
@vertex
fn vertexMain(@location(0) position: vec3<f32>) -> @builtin(position) vec4<f32> {
  return vec4<f32>(position * scale, 1.0);
}
`;

it('WGSLShaderAssembler scans final metadata once, including eager metadata consumers', () => {
  const bindingScan = vi.spyOn(bindingDebug, 'getShaderBindingDebugRowsFromWGSL');
  const layoutScan = vi.spyOn(interfaceScan, 'scanWGSLInterface');
  try {
    const shader = new WGSLShaderAssembler().assembleWGSLShader({
      platformInfo,
      source: `#if ENABLE_SHADER\n${source}\n#endif`,
      defines: {ENABLE_SHADER: true},
      vertexEntryPoint: 'vertexMain'
    });
    // Model consumes both metadata fields immediately after assembly.
    const {bindingTable, shaderLayout} = shader;
    expect(bindingTable.find(binding => binding.name === 'scale')?.binding).toBe(0);
    expect(shaderLayout?.attributes).toHaveLength(1);
    expect(bindingScan).toHaveBeenCalledExactlyOnceWith(shader.source, shader.bindingAssignments);
    expect(layoutScan).toHaveBeenCalledExactlyOnceWith(shader.source, {
      vertexEntryPoint: 'vertexMain',
      scanVertexAttributes: undefined
    });
    expect(shader.source).not.toContain('#if');
    expect(Object.getOwnPropertyDescriptor(shader, 'bindingTable')?.get).toBeUndefined();
  } finally {
    bindingScan.mockRestore();
    layoutScan.mockRestore();
  }
});

it('assembleWGSLShader preserves eager metadata and vertex scanning options', () => {
  const shader = assembleWGSLShader({
    platformInfo,
    source,
    vertexEntryPoint: 'vertexMain',
    scanVertexAttributes: false
  });
  expect(shader.bindingTable).toEqual(
    bindingDebug.getShaderBindingDebugRowsFromWGSL(shader.source, shader.bindingAssignments)
  );
  expect(shader.shaderLayout).toEqual(
    interfaceScan.scanWGSLInterface(shader.source, {
      vertexEntryPoint: 'vertexMain',
      scanVertexAttributes: false
    })
  );
  expect(shader.shaderLayout?.attributes).toHaveLength(0);
  expect(Object.getOwnPropertyDescriptor(shader, 'bindingTable')?.get).toBeUndefined();
  expect(Object.getOwnPropertyDescriptor(shader, 'shaderLayout')?.get).toBeUndefined();
});
