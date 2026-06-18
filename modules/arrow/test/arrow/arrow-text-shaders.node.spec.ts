// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {getArrowTextRenderModules} from '@luma.gl/arrow';
import {ShaderAssembler, type PlatformInfo} from '@luma.gl/shadertools';
import {NullDevice} from '@luma.gl/test-utils';
import {
  TEXT_DICTIONARY_STORAGE_WGSL_SHADER,
  TEXT_ROW_INDEXED_STORAGE_WGSL_SHADER,
  TEXT_STORAGE_INDEXED_WGSL_SHADER
} from '../../src/arrow/renderers/text/renderers/arrow-text-shaders';

const WEBGPU_PLATFORM_INFO: PlatformInfo = {
  type: 'webgpu',
  gpu: 'test-gpu',
  shaderLanguage: 'wgsl',
  shaderLanguageVersion: 300,
  features: new Set()
};

test('Arrow text storage WGSL shaders resolve application auto bindings', t => {
  const shaderAssembler = new ShaderAssembler();
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
    t.notOk(
      assembledShader.source.includes('@binding(auto)'),
      `${label} shader has no unresolved auto bindings`
    );
    t.match(
      assembledShader.source,
      /@group\(0\) @binding\(\d+\) var<uniform> textViewport/,
      `${label} textViewport binding is materialized`
    );
  }

  t.end();
});
