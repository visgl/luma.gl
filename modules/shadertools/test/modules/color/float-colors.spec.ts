// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
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
  ShaderAssembler,
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

test('floatColors#defaultUniforms', t => {
  t.deepEqual(floatColors.defaultUniforms, {useByteColors: true}, 'default floatColors uniforms');
  t.deepEqual(getShaderModuleUniforms(floatColors, {}), {}, 'empty props return no overrides');
  t.end();
});

test('colors#defaultUniforms', t => {
  t.deepEqual(colors.defaultUniforms, {useByteColors: true}, 'default colors uniforms');
  t.deepEqual(getShaderModuleUniforms(colors, {}), {}, 'empty props return no overrides');
  t.end();
});

test('storageColors#defaultUniforms', t => {
  t.deepEqual(
    storageColors.defaultUniforms,
    {
      format: STORAGE_COLOR_FORMAT.RGBA8UNORM,
      wordStride: 1,
      wordOffset: 0,
      _padding: 0
    },
    'default storage colors uniforms'
  );

  t.deepEqual(
    storageColors.getUniforms({format: 'rgba16float', byteStride: 16, byteOffset: 4}),
    {
      format: STORAGE_COLOR_FORMAT.RGBA16FLOAT,
      wordStride: 4,
      wordOffset: 1,
      _padding: 0
    },
    'storage colors props resolve to packed word uniforms'
  );

  t.throws(
    () => storageColors.getUniforms({format: 'rgba16float', byteStride: 4}),
    /at least 8/,
    'short half-float stride is rejected'
  );
  t.throws(
    () => storageColors.getUniforms({byteOffset: 2}),
    /4-byte aligned/,
    'unaligned offset is rejected'
  );
  t.end();
});

test('floatColors#cpuNormalizationHelpers', t => {
  t.deepEqual(
    normalizeByteColor3([255, 128, 64], true),
    [1, 128 / 255, 64 / 255],
    'byte colors normalize to floats'
  );
  t.deepEqual(
    normalizeByteColor3([4, 2, 1], false),
    [4, 2, 1],
    'float and HDR colors pass through'
  );
  t.deepEqual(
    normalizeByteColor4([255, 128, 64, 255], true),
    [1, 128 / 255, 64 / 255, 1],
    'byte rgba normalizes'
  );
  t.deepEqual(
    normalizeByteColor4([1, 0.5, 0.25], false),
    [1, 0.5, 0.25, 1],
    'float rgb adds opaque alpha'
  );
  t.end();
});

test('colors#assembledGLSLContract', t => {
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

  t.ok(
    assembledShader.vs.includes('colorsUniforms'),
    'colors uniforms assembled into vertex shader'
  );
  t.ok(
    assembledShader.fs.includes('vec4 colors_premultiplyAlpha'),
    'colors helpers assembled into fragment shader'
  );
  t.ok(
    assembledShader.fs.includes('vec4 colors_premultiply_alpha'),
    'colors helper aliases assembled for compatibility'
  );
  t.end();
});

test('floatColors#assembledGLSLContract', t => {
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

  t.ok(
    assembledShader.vs.includes('floatColorsUniforms'),
    'floatColors uniforms assembled into vertex shader'
  );
  t.ok(
    assembledShader.fs.includes('vec4 floatColors_premultiplyAlpha'),
    'floatColors helpers assembled into fragment shader'
  );
  t.end();
});

test('storageColors#assembledWGSLContract', t => {
  const shaderAssembler = new ShaderAssembler();
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

  t.ok(baseColorsShader.source.includes('struct colorsUniforms'), 'base colors WGSL assembles');
  t.notOk(
    baseColorsShader.source.includes('storageColorsBuffer'),
    'base colors WGSL does not include storage color bindings'
  );
  t.notOk(
    baseColorsShader.bindingTable.some(binding => binding.name === 'storageColorsBuffer'),
    'base colors binding table does not require storage color buffer'
  );
  t.ok(
    storageColorsShader.bindingTable.some(
      binding => binding.name === 'storageColorsBuffer' && binding.kind === 'read-only-storage'
    ),
    'storage colors binding table includes read-only color storage buffer'
  );
  t.ok(
    storageColorsShader.bindingTable.some(
      binding => binding.name === 'storageColors' && binding.kind === 'uniform'
    ),
    'storage colors binding table includes storage color uniforms'
  );
  t.notOk(
    storageColorsShader.bindingTable.some(binding => binding.name === 'colors'),
    'storage colors does not bind unused semantic color uniforms'
  );
  t.equal(
    countSourceOccurrences(legacyStorageColorsShader.source, 'fn floatColors_normalize('),
    1,
    'legacy floatColors can assemble alongside storageColors without duplicate helper aliases'
  );
  t.end();
});

test('storageColors#WGSL readColor smoke', async t => {
  const webgpuDevice = await getWebGPUTestDevice();
  if (!webgpuDevice) {
    t.comment('WebGPU unavailable, skipping storageColors WGSL smoke test');
    t.end();
    return;
  }

  await runStorageColorsReadCase(t, webgpuDevice, {
    label: 'rgba8unorm',
    format: 'rgba8unorm',
    inputWords: new Uint32Array([packRgba8Unorm(255, 128, 0, 255), packRgba8Unorm(64, 32, 16, 8)]),
    expectedRows: [
      [1, 128 / 255, 0, 1],
      [64 / 255, 32 / 255, 16 / 255, 8 / 255]
    ]
  });

  await runStorageColorsReadCase(t, webgpuDevice, {
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
  await runStorageColorsReadCase(t, webgpuDevice, {
    label: 'rgba32float',
    format: 'rgba32float',
    inputWords: new Uint32Array(rgba32FloatValues.buffer),
    expectedRows: [
      [1.25, -0.5, 2, 0.25],
      [3.5, 0, 0.125, 1]
    ]
  });

  t.end();
});

async function runStorageColorsReadCase(
  t: {deepEqual: (actual: unknown, expected: unknown, message?: string) => void},
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
    t.deepEqual(
      getRoundedColorRows(resultValues, storageColorCase.expectedRows.length),
      storageColorCase.expectedRows.map(roundColorRow),
      `${storageColorCase.label} colors read through WGSL storage helper`
    );
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
