// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

// Regression coverage for installLegacyDeckShaderAssemblerCompatibility(): deck.gl calls
// ShaderAssembler.getDefaultShaderAssembler() with no argument on every device init AND on
// every subsequent render/pick, so the patch must stay installed across repeated no-argument
// calls until the caller explicitly restores it. A prior version restored automatically after
// the first no-argument call, which crashed deck.gl website examples with
// "shadertools: assertion failed." on the very next render or pointer pick.

import assert from 'node:assert/strict';
import test from 'node:test';

function makeFakeShaderAssembler() {
  const glslAssembler = {language: 'glsl'};
  const wgslAssembler = {language: 'wgsl'};
  const calls = [];
  function getDefaultShaderAssembler(shaderLanguage) {
    calls.push(shaderLanguage);
    if (shaderLanguage === 'glsl') return glslAssembler;
    if (shaderLanguage === 'wgsl') return wgslAssembler;
    // Mirrors modules/shadertools/src/lib/shader-assembler.ts: strict assert on any other value.
    throw new Error('shadertools: assertion failed.');
  }
  const ShaderAssembler = {getDefaultShaderAssembler};
  return {ShaderAssembler, calls, glslAssembler, wgslAssembler, strictOriginal: getDefaultShaderAssembler};
}

async function loadModuleUnderTest(t, ShaderAssembler) {
  // Mocks are scoped to this test's own tracker, so each test gets an independent module mock
  // (node:test rejects re-mocking a specifier that a prior test's tracker never restored).
  t.mock.module('@luma.gl/shadertools', {namedExports: {ShaderAssembler}});
  t.mock.module('@luma.gl/webgl', {namedExports: {webgl2Adapter: {}}});
  t.mock.module('@luma.gl/webgpu', {namedExports: {webgpuAdapter: {}}});
  // Cache-bust so each test gets a fresh module instance bound to its own fake ShaderAssembler.
  return import(`./deck-example-device.ts?test=${Math.random()}`);
}

test('keeps the legacy patch installed across repeated no-argument calls', async t => {
  const {ShaderAssembler, calls} = makeFakeShaderAssembler();
  const {installLegacyDeckShaderAssemblerCompatibility} = await loadModuleUnderTest(t, ShaderAssembler);

  const device = {info: {shadingLanguage: 'wgsl'}};
  installLegacyDeckShaderAssemblerCompatibility(device);

  // deck.gl's own device-init call, plus one no-argument call per subsequent render/pick.
  for (let i = 0; i < 3; i++) {
    const assembler = ShaderAssembler.getDefaultShaderAssembler();
    assert.equal(assembler.language, 'wgsl');
  }
  assert.deepEqual(calls, ['wgsl', 'wgsl', 'wgsl']);
});

test('resolves the no-argument call from device.info.shadingLanguage', async t => {
  const {ShaderAssembler} = makeFakeShaderAssembler();
  const {installLegacyDeckShaderAssemblerCompatibility} = await loadModuleUnderTest(t, ShaderAssembler);

  installLegacyDeckShaderAssemblerCompatibility({info: {shadingLanguage: 'glsl'}});
  assert.equal(ShaderAssembler.getDefaultShaderAssembler().language, 'glsl');
});

test('routes explicit shading-language calls straight through regardless of patch state', async t => {
  const {ShaderAssembler, calls} = makeFakeShaderAssembler();
  const {installLegacyDeckShaderAssemblerCompatibility} = await loadModuleUnderTest(t, ShaderAssembler);

  installLegacyDeckShaderAssemblerCompatibility({info: {shadingLanguage: 'wgsl'}});
  assert.equal(ShaderAssembler.getDefaultShaderAssembler('glsl').language, 'glsl');
  assert.equal(ShaderAssembler.getDefaultShaderAssembler('wgsl').language, 'wgsl');
  assert.deepEqual(calls, ['glsl', 'wgsl']);
});

test('restore() puts back the strict original so a later no-argument call fails again', async t => {
  const {ShaderAssembler, strictOriginal} = makeFakeShaderAssembler();
  const {installLegacyDeckShaderAssemblerCompatibility} = await loadModuleUnderTest(t, ShaderAssembler);

  const restore = installLegacyDeckShaderAssemblerCompatibility({info: {shadingLanguage: 'wgsl'}});
  assert.notEqual(ShaderAssembler.getDefaultShaderAssembler, strictOriginal);

  restore();
  assert.equal(ShaderAssembler.getDefaultShaderAssembler, strictOriginal);
  assert.throws(() => ShaderAssembler.getDefaultShaderAssembler(), /shadertools: assertion failed/);
});

test('restore() is idempotent and safe to call more than once', async t => {
  const {ShaderAssembler, strictOriginal} = makeFakeShaderAssembler();
  const {installLegacyDeckShaderAssemblerCompatibility} = await loadModuleUnderTest(t, ShaderAssembler);

  const restore = installLegacyDeckShaderAssemblerCompatibility({info: {shadingLanguage: 'glsl'}});
  restore();
  restore();
  assert.equal(ShaderAssembler.getDefaultShaderAssembler, strictOriginal);
});

test('does not clobber a differently-installed patch when restored out of order', async t => {
  const {ShaderAssembler} = makeFakeShaderAssembler();
  const {installLegacyDeckShaderAssemblerCompatibility} = await loadModuleUnderTest(t, ShaderAssembler);

  const restoreFirst = installLegacyDeckShaderAssemblerCompatibility({
    info: {shadingLanguage: 'glsl'}
  });
  installLegacyDeckShaderAssemblerCompatibility({info: {shadingLanguage: 'wgsl'}});

  // The stale handle from the first install must not tear down the second (currently active) patch.
  restoreFirst();
  assert.equal(ShaderAssembler.getDefaultShaderAssembler().language, 'wgsl');
});
