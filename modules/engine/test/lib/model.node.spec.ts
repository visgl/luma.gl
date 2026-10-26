// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it, vi} from 'vitest';
import type {ShaderValues} from '@luma.gl/core/shader-inputs';
import type {Device} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';
import {GLSLShaderAssembler, WGSLShaderAssembler, type ShaderAssembler} from '@luma.gl/shadertools';
import {NullDevice} from '@luma.gl/test-utils';

const WGSL_SOURCE = /* wgsl */ `\
@vertex
fn vertexMain() -> @builtin(position) vec4<f32> {
  return vec4<f32>(0.0, 0.0, 0.0, 1.0);
}

@fragment
fn fragmentMain() -> @location(0) vec4<f32> {
  return vec4<f32>(1.0);
}
`;

const GLSL_VERTEX_SOURCE = /* glsl */ `\
#version 300 es
void main() {
  gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
}
`;

const GLSL_FRAGMENT_SOURCE = /* glsl */ `\
#version 300 es
precision highp float;
out vec4 fragmentColor;
void main() {
  fragmentColor = vec4(1.0);
}
`;

class TrackingWGSLShaderAssembler extends WGSLShaderAssembler {
  assemblyCount = 0;

  override assembleWGSLShader(
    props: Parameters<WGSLShaderAssembler['assembleWGSLShader']>[0]
  ): ReturnType<WGSLShaderAssembler['assembleWGSLShader']> {
    this.assemblyCount++;
    return super.assembleWGSLShader(props);
  }
}

it('Model preserves explicitly supplied custom WGSL shader assemblers', () => {
  const device = makeWebGPUDevice();
  const shaderAssembler = new TrackingWGSLShaderAssembler();
  shaderAssembler.addDefaultModule({
    name: 'customWGSLModule',
    source: 'const CUSTOM_WGSL_MODULE_MARKER: f32 = 1.0;'
  });
  shaderAssembler.addShaderHook('vs:CUSTOM_WGSL_MODEL_HOOK(position: ptr<function, vec4<f32>>)');

  const model = new Model(device, {
    id: 'custom-wgsl-shader-assembler',
    source: WGSL_SOURCE,
    shaderAssembler,
    vertexCount: 1
  });

  try {
    expect(shaderAssembler.assemblyCount, 'the supplied custom assembler is used').toBe(1);
    expect(
      Boolean(model.source.includes('CUSTOM_WGSL_MODULE_MARKER')),
      'custom assembler default modules are preserved'
    ).toBe(true);
    expect(
      Boolean(model.source.includes('fn CUSTOM_WGSL_MODEL_HOOK(')),
      'custom assembler hooks are preserved'
    ).toBe(true);
  } finally {
    model.destroy();
    device.destroy();
  }

  void 0;
});

it('Model preserves legacy Deck assemblers for both shader languages', () => {
  const glslShaderAssembler = new GLSLShaderAssembler();
  const wgslShaderAssembler = new WGSLShaderAssembler();
  glslShaderAssembler.addDefaultModule({
    name: 'legacyGLSLModule',
    vs: 'const float LEGACY_GLSL_MODULE_MARKER = 1.0;'
  });
  glslShaderAssembler.addShaderHook('vs:LEGACY_DECK_HOOK(inout vec4 position)');
  wgslShaderAssembler.addDefaultModule({
    name: 'legacyWGSLModule',
    source: 'const LEGACY_WGSL_MODULE_MARKER: f32 = 1.0;'
  });
  wgslShaderAssembler.addShaderHook('vs:LEGACY_DECK_HOOK(position: ptr<function, vec4<f32>>)');

  // deck.gl 9.3.4 forwards an assembler with both methods but no shaderLanguage.
  const legacyShaderAssembler = {
    addDefaultModule: wgslShaderAssembler.addDefaultModule.bind(wgslShaderAssembler),
    removeDefaultModule: wgslShaderAssembler.removeDefaultModule.bind(wgslShaderAssembler),
    addShaderHook: wgslShaderAssembler.addShaderHook.bind(wgslShaderAssembler),
    assembleGLSLShaderPair: glslShaderAssembler.assembleGLSLShaderPair.bind(glslShaderAssembler),
    assembleWGSLShader: wgslShaderAssembler.assembleWGSLShader.bind(wgslShaderAssembler)
  };
  expect(
    Boolean('shaderLanguage' in legacyShaderAssembler),
    'the pinned Deck compatibility assembler has no language metadata'
  ).toBe(false);

  const webgpuDevice = makeWebGPUDevice();
  const wgslModel = new Model(webgpuDevice, {
    id: 'legacy-wgsl-shader-assembler',
    source: WGSL_SOURCE,
    shaderAssembler: legacyShaderAssembler as unknown as ShaderAssembler,
    vertexCount: 1
  });

  try {
    expect(
      Boolean(wgslModel.source.includes('LEGACY_WGSL_MODULE_MARKER')),
      'legacy WGSL assembler modules are preserved'
    ).toBe(true);
    expect(
      Boolean(wgslModel.source.includes('fn LEGACY_DECK_HOOK(')),
      'legacy WGSL assembler hooks are preserved'
    ).toBe(true);
  } finally {
    wgslModel.destroy();
    webgpuDevice.destroy();
  }

  const glslDevice = new NullDevice({});
  const glslModel = new Model(glslDevice, {
    id: 'legacy-glsl-shader-assembler',
    vs: GLSL_VERTEX_SOURCE,
    fs: GLSL_FRAGMENT_SOURCE,
    shaderAssembler: legacyShaderAssembler as unknown as ShaderAssembler,
    vertexCount: 1
  });

  try {
    expect(
      Boolean(glslModel.vs.includes('LEGACY_GLSL_MODULE_MARKER')),
      'legacy GLSL assembler modules are preserved'
    ).toBe(true);
    expect(
      Boolean(glslModel.vs.includes('void LEGACY_DECK_HOOK(')),
      'legacy GLSL assembler hooks are preserved'
    ).toBe(true);
  } finally {
    glslModel.destroy();
    glslDevice.destroy();
  }

  void 0;
});

it('Model preserves a legacy default shader assembler override for WebGPU', () => {
  const device = makeWebGPUDevice();
  const originalDefaultShaderAssembler = Model.defaultProps.shaderAssembler;
  const glslShaderAssembler = new GLSLShaderAssembler();
  const wgslShaderAssembler = new TrackingWGSLShaderAssembler();
  wgslShaderAssembler.addDefaultModule({
    name: 'legacyDefaultWGSLModule',
    source: 'const LEGACY_DEFAULT_WGSL_MODULE_MARKER: f32 = 1.0;'
  });
  wgslShaderAssembler.addShaderHook(
    'vs:LEGACY_DEFAULT_WGSL_HOOK(position: ptr<function, vec4<f32>>)'
  );

  const legacyDefaultShaderAssembler = {
    addDefaultModule: wgslShaderAssembler.addDefaultModule.bind(wgslShaderAssembler),
    removeDefaultModule: wgslShaderAssembler.removeDefaultModule.bind(wgslShaderAssembler),
    addShaderHook: wgslShaderAssembler.addShaderHook.bind(wgslShaderAssembler),
    assembleGLSLShaderPair: glslShaderAssembler.assembleGLSLShaderPair.bind(glslShaderAssembler),
    assembleWGSLShader: wgslShaderAssembler.assembleWGSLShader.bind(wgslShaderAssembler)
  };
  let model: Model | null = null;

  try {
    Model.defaultProps.shaderAssembler = legacyDefaultShaderAssembler as unknown as ShaderAssembler;
    model = new Model(device, {
      id: 'legacy-default-wgsl-shader-assembler',
      source: WGSL_SOURCE,
      vertexCount: 1
    });

    expect(
      wgslShaderAssembler.assemblyCount,
      'the configured legacy default is retained for WebGPU'
    ).toBe(1);
    expect(
      Boolean(model.source.includes('LEGACY_DEFAULT_WGSL_MODULE_MARKER')),
      'legacy default assembler modules are preserved'
    ).toBe(true);
    expect(
      Boolean(model.source.includes('fn LEGACY_DEFAULT_WGSL_HOOK(')),
      'legacy default assembler hooks are preserved'
    ).toBe(true);
  } finally {
    Model.defaultProps.shaderAssembler = originalDefaultShaderAssembler;
    try {
      model?.destroy();
    } finally {
      device.destroy();
    }
  }

  void 0;
});

it('Model accepts compatible WGSL assemblers from another module instance', () => {
  const device = makeWebGPUDevice();
  const sourceShaderAssembler = new WGSLShaderAssembler();
  sourceShaderAssembler.addDefaultModule({
    name: 'duplicateWGSLModule',
    source: 'const DUPLICATE_WGSL_MODULE_MARKER: f32 = 1.0;'
  });
  sourceShaderAssembler.addShaderHook(
    'vs:DUPLICATE_WGSL_MODEL_HOOK(position: ptr<function, vec4<f32>>)'
  );

  const duplicateShaderAssembler = {
    shaderLanguage: 'wgsl' as const,
    addDefaultModule: sourceShaderAssembler.addDefaultModule.bind(sourceShaderAssembler),
    removeDefaultModule: sourceShaderAssembler.removeDefaultModule.bind(sourceShaderAssembler),
    addShaderHook: sourceShaderAssembler.addShaderHook.bind(sourceShaderAssembler),
    assembleWGSLShader: sourceShaderAssembler.assembleWGSLShader.bind(sourceShaderAssembler)
  };
  expect(
    Boolean(duplicateShaderAssembler instanceof WGSLShaderAssembler),
    'the duplicate-copy assembler has a different constructor identity'
  ).toBe(false);

  const model = new Model(device, {
    id: 'duplicate-wgsl-shader-assembler',
    source: WGSL_SOURCE,
    shaderAssembler: duplicateShaderAssembler as unknown as ShaderAssembler,
    vertexCount: 1
  });

  try {
    expect(
      Boolean(model.source.includes('DUPLICATE_WGSL_MODULE_MARKER')),
      'duplicate-copy assembler default modules are preserved'
    ).toBe(true);
    expect(
      Boolean(model.source.includes('fn DUPLICATE_WGSL_MODEL_HOOK(')),
      'duplicate-copy assembler hooks are preserved'
    ).toBe(true);
  } finally {
    model.destroy();
    device.destroy();
  }

  void 0;
});

it('Model rejects an explicitly supplied assembler for the wrong shader language', () => {
  const webgpuDevice = makeWebGPUDevice();

  try {
    expect(
      () =>
        new Model(webgpuDevice, {
          id: 'wrong-wgsl-shader-assembler',
          source: WGSL_SOURCE,
          shaderAssembler: new GLSLShaderAssembler(),
          vertexCount: 1
        }),
      'WebGPU rejects an explicitly supplied GLSL assembler'
    ).toThrow();
  } finally {
    webgpuDevice.destroy();
  }

  const glslDevice = new NullDevice({});

  try {
    expect(
      () =>
        new Model(glslDevice, {
          id: 'wrong-glsl-shader-assembler',
          vs: GLSL_VERTEX_SOURCE,
          fs: GLSL_FRAGMENT_SOURCE,
          shaderAssembler: new WGSLShaderAssembler(),
          vertexCount: 1
        }),
      'GLSL rejects an explicitly supplied WGSL assembler'
    ).toThrow();
  } finally {
    glslDevice.destroy();
  }

  void 0;
});

function makeWebGPUDevice(): Device {
  const nullDevice = new NullDevice({});
  const webgpuDevice = Object.create(nullDevice) as Device;

  Object.defineProperties(webgpuDevice, {
    type: {value: 'webgpu'},
    info: {
      value: {
        ...nullDevice.info,
        type: 'webgpu',
        shadingLanguage: 'wgsl'
      }
    }
  });

  return webgpuDevice;
}

it('Model accepts borrowed ShaderValues independently of module management', () => {
  const device = makeWebGPUDevice();
  const firstTexture = device.createTexture({width: 1, height: 1});
  const secondTexture = device.createTexture({width: 1, height: 1});
  let scale = 2;
  let texture = firstTexture;
  const values: ShaderValues = {
    getUniformValues: () => ({settings: {scale}}),
    getBindingValues: () => ({image: texture})
  };
  const model = new Model(device, {
    source: WGSL_SOURCE,
    vertexCount: 1,
    modules: [{name: 'settings', uniformTypes: {scale: 'f32'}, defaultUniforms: {scale: 1}}],
    shaderValues: values
  });
  try {
    const upload = vi.spyOn(model._uniformStore, 'setUniforms');
    model.updateShaderInputs();
    expect(upload).toHaveBeenLastCalledWith({settings: {scale: 2}}, undefined);
    expect(model.bindings.image).toBe(firstTexture);
    expect(model.getShaderValues()).toBe(values);

    scale = 3;
    texture = secondTexture;
    model.updateShaderInputs();
    expect(upload).toHaveBeenLastCalledWith({settings: {scale: 3}}, undefined);
    expect(model.bindings.image).toBe(secondTexture);
    const packed = model._uniformStore.getUniformBufferData('settings');
    expect(
      new DataView(packed.buffer, packed.byteOffset, packed.byteLength).getFloat32(0, true)
    ).toBe(3);

    model.setShaderValues();
    model.shaderInputs.setProps({settings: {scale: 4}, bindings: {image: firstTexture}});
    model.updateShaderInputs();
    expect(model.getShaderValues()).toBe(model.shaderInputs);
    expect(upload).toHaveBeenLastCalledWith({settings: {scale: 4}}, undefined);
    expect(model.bindings.image).toBe(firstTexture);

    model.setShaderValues(values);
    model.updateShaderInputs();
    expect(model.bindings.image).toBe(secondTexture);
  } finally {
    model.destroy();
    expect(firstTexture.destroyed).toBe(false);
    expect(secondTexture.destroyed).toBe(false);
    firstTexture.destroy();
    secondTexture.destroy();
    device.destroy();
  }
});
