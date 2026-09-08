// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getArrowTextRenderModules} from '@luma.gl/arrow';
import {WGSLShaderAssembler, type PlatformInfo} from '@luma.gl/shadertools';
import {NullDevice} from '@luma.gl/test-utils';
import {
  configureArrowTextShaderAssembler,
  TEXT_DICTIONARY_STORAGE_WGSL_SHADER,
  TEXT_ROW_INDEXED_STORAGE_WGSL_SHADER,
  TEXT_STORAGE_INDEXED_WGSL_SHADER,
  WGSL_SHADER
} from '../../src/arrow/renderers/text/renderers/arrow-text-shaders';

const WEBGPU_PLATFORM_INFO: PlatformInfo = {
  type: 'webgpu',
  gpu: 'test-gpu',
  shaderLanguage: 'wgsl',
  shaderLanguageVersion: 300,
  features: new Set()
};

it('Arrow text storage WGSL shaders resolve application auto bindings', () => {
  const shaderAssembler = new WGSLShaderAssembler();
  const modules = getArrowTextRenderModules(new NullDevice({}));

  for (const [label, source] of [
    ['storage', TEXT_STORAGE_INDEXED_WGSL_SHADER],
    ['row-indexed storage', TEXT_ROW_INDEXED_STORAGE_WGSL_SHADER],
    ['dictionary storage', TEXT_DICTIONARY_STORAGE_WGSL_SHADER]
  ] as const) {
    const assembledShader = shaderAssembler.assembleWGSLShader({
      platformInfo: WEBGPU_PLATFORM_INFO,
      source,
      modules
    });
    expect(
      Boolean(assembledShader.source.includes('@binding(auto)')),
      `${label} shader has no unresolved auto bindings`
    ).toBe(false);
    expect(assembledShader.source, `${label} textViewport binding is materialized`).toMatch(
      /@group\(0\) @binding\(\d+\) var<uniform> textViewport/
    );
  }

  void 0;
});

it('Arrow attribute text WGSL exposes a vertex transform hook before returning', () => {
  const shaderAssembler = configureArrowTextShaderAssembler(new WGSLShaderAssembler(), 'wgsl');
  const assembledShader = shaderAssembler.assembleWGSLShader({
    platformInfo: WEBGPU_PLATFORM_INFO,
    source: WGSL_SHADER,
    modules: [
      ...getArrowTextRenderModules(new NullDevice({})),
      {
        name: 'textTransformTest',
        inject: {
          'vs:TEXT_ATTRIBUTE_VERTEX_TRANSFORM': '(*outputs).Position.x += 1.0;'
        }
      }
    ]
  });
  const injectionIndex = assembledShader.source.indexOf('(*outputs).Position.x += 1.0;');
  const returnIndex = assembledShader.source.indexOf('return outputs;', injectionIndex);

  expect(Boolean(injectionIndex >= 0), 'host vertex transform is assembled').toBe(true);
  expect(
    Boolean(returnIndex > injectionIndex),
    'host vertex transform executes before the vertex return'
  ).toBe(true);
  void 0;
});
