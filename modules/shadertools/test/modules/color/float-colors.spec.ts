// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Buffer} from '@luma.gl/core';
import {Computation, ShaderInputs} from '@luma.gl/engine';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {
  assembleGLSLShaderPair,
  colors,
  floatColors,
  getShaderModuleUniforms,
  normalizeByteColor3,
  normalizeByteColor4,
  WGSLShaderAssembler,
  STORAGE_COLOR_DEFAULT_BYTE_STRIDES,
  STORAGE_COLOR_FORMAT,
  storageColors,
  toHalfFloat,
  type PlatformInfo
} from '@luma.gl/shadertools';
import type {StorageColorFormat, StorageColorsProps} from '@luma.gl/shadertools';

const GLSL_PLATFORM_INFO: PlatformInfo = {
  type: 'webgl',
  gpu: 'test-gpu',
  shaderLanguage: 'glsl',
  shaderLanguageVersion: 300,
  features: new Set()
};

const WGSL_PLATFORM_INFO: PlatformInfo = {
  type: 'webgpu',
  gpu: 'test-gpu',
  shaderLanguage: 'wgsl',
  shaderLanguageVersion: 300,
  features: new Set()
};

const WGSL_COMPUTE_APP = /* wgsl */ `\
@compute @workgroup_size(1)
fn computeMain() {
}
`;

it('floatColors#defaultUniforms', () => {
  expect(floatColors.defaultUniforms, 'default floatColors uniforms').toEqual({
    useByteColors: true
  });
  expect(getShaderModuleUniforms(floatColors, {}), 'empty props return no overrides').toEqual({});
  void 0;
});

it('colors#defaultUniforms', () => {
  expect(colors.defaultUniforms, 'default colors uniforms').toEqual({useByteColors: true});
  expect(getShaderModuleUniforms(colors, {}), 'empty props return no overrides').toEqual({});
  void 0;
});

it('storageColors#defaultUniforms', () => {
  expect(storageColors.defaultUniforms, 'default storage colors uniforms').toEqual({
    format: STORAGE_COLOR_FORMAT.RGBA8UNORM,
    wordStride: 1,
    wordOffset: 0,
    _padding: 0
  });

  expect(
    storageColors.getUniforms({format: 'rgba16float', byteStride: 16, byteOffset: 4}),
    'storage colors props resolve to packed word uniforms'
  ).toEqual({
    format: STORAGE_COLOR_FORMAT.RGBA16FLOAT,
    wordStride: 4,
    wordOffset: 1,
    _padding: 0
  });

  expect(
    () => storageColors.getUniforms({format: 'rgba16float', byteStride: 4}),
    'short half-float stride is rejected'
  ).toThrow(/at least 8/);
  expect(() => storageColors.getUniforms({byteOffset: 2}), 'unaligned offset is rejected').toThrow(
    /4-byte aligned/
  );
  void 0;
});

it('floatColors#cpuNormalizationHelpers', () => {
  expect(normalizeByteColor3([255, 128, 64], true), 'byte colors normalize to floats').toEqual([
    1,
    128 / 255,
    64 / 255
  ]);
  expect(normalizeByteColor3([4, 2, 1], false), 'float and HDR colors pass through').toEqual([
    4, 2, 1
  ]);
  expect(normalizeByteColor4([255, 128, 64, 255], true), 'byte rgba normalizes').toEqual([
    1,
    128 / 255,
    64 / 255,
    1
  ]);
  expect(normalizeByteColor4([1, 0.5, 0.25], false), 'float rgb adds opaque alpha').toEqual([
    1, 0.5, 0.25, 1
  ]);
  void 0;
});

it('colors#assembledGLSLContract', () => {
  const assembledShader = assembleGLSLShaderPair({
    platformInfo: GLSL_PLATFORM_INFO,
    vs: `\
#version 300 es
in vec4 positions;
void main(void) {
  gl_Position = positions;
}
`,
    fs: `\
#version 300 es
precision highp float;
out vec4 fragmentColor;
void main(void) {
  fragmentColor = colors_premultiply_alpha(colors_normalize(vec4(255.0, 0.0, 0.0, 255.0)));
}
`,
    modules: [colors]
  });

  expect(
    Boolean(assembledShader.vs.includes('colorsUniforms')),
    'colors uniforms assembled into vertex shader'
  ).toBe(true);
  expect(
    Boolean(assembledShader.fs.includes('vec4 colors_premultiplyAlpha')),
    'colors helpers assembled into fragment shader'
  ).toBe(true);
  expect(
    Boolean(assembledShader.fs.includes('vec4 colors_premultiply_alpha')),
    'colors helper aliases assembled for compatibility'
  ).toBe(true);
  void 0;
});

it('floatColors#assembledGLSLContract', () => {
  const assembledShader = assembleGLSLShaderPair({
    platformInfo: GLSL_PLATFORM_INFO,
    vs: `\
#version 300 es
in vec4 positions;
void main(void) {
  gl_Position = positions;
}
`,
    fs: `\
#version 300 es
precision highp float;
out vec4 fragmentColor;
void main(void) {
  fragmentColor = floatColors_premultiplyAlpha(floatColors_normalize(vec4(255.0, 0.0, 0.0, 255.0)));
}
`,
    modules: [floatColors]
  });

  expect(
    Boolean(assembledShader.vs.includes('floatColorsUniforms')),
    'floatColors uniforms assembled into vertex shader'
  ).toBe(true);
  expect(
    Boolean(assembledShader.fs.includes('vec4 floatColors_premultiplyAlpha')),
    'floatColors helpers assembled into fragment shader'
  ).toBe(true);
  void 0;
});

it('storageColors#assembledWGSLContract', () => {
  const shaderAssembler = new WGSLShaderAssembler();
  const baseColorsShader = shaderAssembler.assembleWGSLShader({
    platformInfo: WGSL_PLATFORM_INFO,
    source: WGSL_COMPUTE_APP,
    modules: [colors]
  });
  const storageColorsShader = shaderAssembler.assembleWGSLShader({
    platformInfo: WGSL_PLATFORM_INFO,
    source: WGSL_COMPUTE_APP,
    modules: [storageColors]
  });
  const legacyStorageColorsShader = shaderAssembler.assembleWGSLShader({
    platformInfo: WGSL_PLATFORM_INFO,
    source: WGSL_COMPUTE_APP,
    modules: [floatColors, storageColors]
  });

  expect(
    Boolean(baseColorsShader.source.includes('struct colorsUniforms')),
    'base colors WGSL assembles'
  ).toBe(true);
  expect(
    Boolean(baseColorsShader.source.includes('storageColorsBuffer')),
    'base colors WGSL does not include storage color bindings'
  ).toBe(false);
  expect(
    Boolean(baseColorsShader.bindingTable.some(binding => binding.name === 'storageColorsBuffer')),
    'base colors binding table does not require storage color buffer'
  ).toBe(false);
  expect(
    Boolean(
      storageColorsShader.bindingTable.some(
        binding => binding.name === 'storageColorsBuffer' && binding.kind === 'read-only-storage'
      )
    ),
    'storage colors binding table includes read-only color storage buffer'
  ).toBe(true);
  expect(
    Boolean(
      storageColorsShader.bindingTable.some(
        binding => binding.name === 'storageColors' && binding.kind === 'uniform'
      )
    ),
    'storage colors binding table includes storage color uniforms'
  ).toBe(true);
  expect(
    Boolean(storageColorsShader.bindingTable.some(binding => binding.name === 'colors')),
    'storage colors does not bind unused semantic color uniforms'
  ).toBe(false);
  expect(
    countSourceOccurrences(legacyStorageColorsShader.source, 'fn floatColors_normalize('),
    'legacy floatColors can assemble alongside storageColors without duplicate helper aliases'
  ).toBe(1);
  void 0;
});

it('storageColors#WGSL readColor smoke', async () => {
  const webgpuDevice = await getWebGPUTestDevice();
  if (!webgpuDevice) {
    void 0;
    void 0;
    return;
  }

  await runStorageColorsReadCase(webgpuDevice, {
    label: 'rgba8unorm',
    format: 'rgba8unorm',
    inputWords: new Uint32Array([packRgba8Unorm(255, 128, 0, 255), packRgba8Unorm(64, 32, 16, 8)]),
    expectedRows: [
      [1, 128 / 255, 0, 1],
      [64 / 255, 32 / 255, 16 / 255, 8 / 255]
    ]
  });

  await runStorageColorsReadCase(webgpuDevice, {
    label: 'rgba16float',
    format: 'rgba16float',
    inputWords: new Uint32Array([
      packHalf2x16(1, 0.5),
      packHalf2x16(0.25, 0),
      packHalf2x16(0.125, 0.75),
      packHalf2x16(0.875, 1)
    ]),
    expectedRows: [
      [1, 0.5, 0.25, 0],
      [0.125, 0.75, 0.875, 1]
    ]
  });

  const rgba32FloatValues = new Float32Array([1.25, -0.5, 2, 0.25, 3.5, 0, 0.125, 1]);
  await runStorageColorsReadCase(webgpuDevice, {
    label: 'rgba32float',
    format: 'rgba32float',
    inputWords: new Uint32Array(rgba32FloatValues.buffer),
    expectedRows: [
      [1.25, -0.5, 2, 0.25],
      [3.5, 0, 0.125, 1]
    ]
  });

  void 0;
});

async function runStorageColorsReadCase(
  webgpuDevice: Awaited<ReturnType<typeof getWebGPUTestDevice>>,
  storageColorCase: {
    expectedRows: number[][];
    format: StorageColorFormat;
    inputWords: Uint32Array;
    label: string;
  }
): Promise<void> {
  if (!webgpuDevice) {
    return;
  }

  const shaderInputs = new ShaderInputs<{storageColors: StorageColorsProps}>({storageColors});
  shaderInputs.setProps({
    storageColors: {
      format: storageColorCase.format,
      byteStride: STORAGE_COLOR_DEFAULT_BYTE_STRIDES[storageColorCase.format]
    }
  });

  const inputBuffer = webgpuDevice.createBuffer({
    data: storageColorCase.inputWords,
    usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
  });
  const resultBuffer = webgpuDevice.createBuffer({
    byteLength: storageColorCase.expectedRows.length * 4 * Float32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
  });
  const computation = new Computation(webgpuDevice, {
    id: `storage-colors-${storageColorCase.label}`,
    source: buildStorageColorsReadSource(storageColorCase.expectedRows.length),
    modules: [storageColors],
    shaderInputs
  });

  try {
    computation.setBindings({
      storageColorsBuffer: inputBuffer,
      resultData: resultBuffer
    });
    computation.updateShaderInputs();
    const computePass = webgpuDevice.beginComputePass({});
    computation.dispatch(computePass, storageColorCase.expectedRows.length);
    computePass.end();
    webgpuDevice.submit();

    const resultBytes = await resultBuffer.readAsync();
    const resultValues = new Float32Array(
      resultBytes.buffer,
      resultBytes.byteOffset,
      resultBytes.byteLength / Float32Array.BYTES_PER_ELEMENT
    );
    expect(
      getRoundedColorRows(resultValues, storageColorCase.expectedRows.length),
      `${storageColorCase.label} colors read through WGSL storage helper`
    ).toEqual(storageColorCase.expectedRows.map(roundColorRow));
  } finally {
    computation.destroy();
    inputBuffer.destroy();
    resultBuffer.destroy();
  }
}

function buildStorageColorsReadSource(rowCount: number): string {
  return /* wgsl */ `\
@group(0) @binding(9) var<storage, read_write> resultData : array<vec4<f32>>;

@compute @workgroup_size(1)
fn computeMain(@builtin(global_invocation_id) globalInvocationId : vec3<u32>) {
  let rowIndex = globalInvocationId.x;
  if (rowIndex >= ${rowCount}u) {
    return;
  }
  resultData[rowIndex] = storageColors_readColor(rowIndex);
}
`;
}

function packRgba8Unorm(red: number, green: number, blue: number, alpha: number): number {
  return (red | (green << 8) | (blue << 16) | (alpha << 24)) >>> 0;
}

function packHalf2x16(first: number, second: number): number {
  return (toHalfFloat(first) | (toHalfFloat(second) << 16)) >>> 0;
}

function getRoundedColorRows(values: Float32Array, rowCount: number): number[][] {
  const rows: number[][] = [];
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    rows.push(roundColorRow(Array.from(values.slice(rowIndex * 4, rowIndex * 4 + 4))));
  }
  return rows;
}

function roundColorRow(row: number[]): number[] {
  return row.map(value => Math.round(value * 10000) / 10000);
}

function countSourceOccurrences(source: string, searchValue: string): number {
  return source.split(searchValue).length - 1;
}
