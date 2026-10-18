// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Buffer, type Device} from '@luma.gl/core';
import {Computation, ShaderInputs} from '@luma.gl/engine';
import {fp64, fp64arithmetic, fp64ify, WGSLShaderAssembler} from '@luma.gl/shadertools';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

const MODES: {name: string; defines: Record<string, boolean>}[] = [
  {
    name: 'hybrid',
    defines: {LUMA_FP64_INTEGER_ARITHMETIC: false, LUMA_FP64_HYBRID_ARITHMETIC: true}
  },
  {name: 'integer', defines: {LUMA_FP64_INTEGER_ARITHMETIC: true}}
];

const FUNCTIONS = [
  {
    name: 'radians',
    inputs: [-180, -122.42694203247, -1e-8, 0, 1e-8, 85.0511287798, 180],
    reference: (x: number) => (x * Math.PI) / 180
  },
  {name: 'exp', inputs: [-20, -1, -1e-8, 0, 1e-8, 1, 20], reference: Math.exp},
  {
    name: 'log',
    inputs: [
      2 ** -149,
      2 ** -126,
      1e-20,
      0.01,
      0.5,
      1 - 2 ** -40,
      1,
      1 + 2 ** -40,
      2,
      100,
      1e20,
      3.4028234663852886e38
    ],
    reference: Math.log
  },
  {
    name: 'sin',
    inputs: [-2 * Math.PI, -Math.PI / 2, -1e-8, 0, 1e-8, Math.PI / 4, Math.PI, 2 * Math.PI],
    reference: Math.sin
  },
  {
    name: 'cos',
    inputs: [-Math.PI, -Math.PI / 2, 0, Math.PI / 4, Math.PI / 2, Math.PI],
    reference: Math.cos
  },
  {
    name: 'tan',
    inputs: [-Math.PI, -1, -1e-8, 0, 1e-8, Math.PI / 4, 1, Math.PI / 2 - 1e-4],
    reference: Math.tan
  }
];

for (const mode of MODES) {
  for (const operation of FUNCTIONS) {
    it(`fp64 WGSL ${operation.name} (${mode.name})`, async ({skip}) => {
      const device = await getWebGPUTestDevice();
      if (!device || isSoftwareBackedDevice(device)) return skip();
      const values = await compute(
        device,
        operation.inputs,
        operation.inputs.length,
        `resultData[index] = ${operation.name}_fp64(inputData[index]);`,
        mode.defines
      );
      for (let index = 0; index < operation.inputs.length; index++) {
        const expected = operation.reference(operation.inputs[index]);
        // Near trigonometric roots the input split itself differs from binary64 by ~1e-15.
        const tolerance =
          operation.name === 'sin' || operation.name === 'cos' || operation.name === 'tan'
            ? Math.max(3e-14, Math.abs(expected) * 3e-11)
            : Math.max(1e-27, Math.abs(expected) * 3e-12);
        expect(
          Math.abs(values[index] - expected),
          `${operation.name}(${operation.inputs[index]}) = ${values[index]}, expected ${expected}`
        ).toBeLessThanOrEqual(tolerance);
      }
    }, 120000);
  }

  it(`fp64 WGSL Mercator retains latitude differences (${mode.name})`, async ({skip}) => {
    const device = await getWebGPUTestDevice();
    if (!device || isSoftwareBackedDevice(device)) return skip();
    const latitudes = [
      -85.0511287798, -45, -1e-8, 0, 1e-8, 37.75153705839, 37.75153706839, 85.0511287798, 89.99
    ];
    const values = await compute(
      device,
      latitudes,
      latitudes.length,
      `
      let angle = sum_fp64(PI_4_FP64, mul_fp64(radians_fp64(inputData[index]), vec2f(0.5, 0.0)));
      resultData[index] = log_fp64(tan_fp64(angle));`,
      mode.defines
    );
    for (let index = 0; index < latitudes.length; index++) {
      const expected = Math.log(Math.tan(Math.PI / 4 + (latitudes[index] * Math.PI) / 360));
      expect(
        Math.abs(values[index] - expected),
        `Mercator latitude ${latitudes[index]}`
      ).toBeLessThan(5e-10);
    }
    const expectedDelta =
      ((latitudes[6] - latitudes[5]) * Math.PI) / 180 / Math.cos((latitudes[5] * Math.PI) / 180);
    expect(Math.abs(values[6] - values[5] - expectedDelta)).toBeLessThan(1e-12);
    expect(values[6]).toBeGreaterThan(values[5]);
  }, 120000);

  it(`fp64 WGSL matrix ordering and cancellation (${mode.name})`, async ({skip}) => {
    const device = await getWebGPUTestDevice();
    if (!device || isSoftwareBackedDevice(device)) return skip();
    const matrix = [1, 0, 0, -10000000, 0, 2, 0, -20000000, 0, 0, 3, -30000000, 4, 5, 6, 1];
    const vector = [10000000.125, 10000000.25, 10000000.5, 1];
    const values = await compute(
      device,
      [...matrix, ...vector],
      8,
      `
      var matrix: array<vec2f, 16>;
      for (var i = 0u; i < 16u; i++) { matrix[i] = inputData[i]; }
      let vector = array<vec2f, 4>(inputData[16], inputData[17], inputData[18], inputData[19]);
      let transformed = mat4_vec4_mul_fp64(matrix, vector);
      let converted = vec4_fp64(vec4f(1.0, -2.0, 3.0, 1.0));
      for (var i = 0u; i < 4u; i++) {
        resultData[i] = transformed[i];
        resultData[i + 4u] = converted[i];
      }`,
      mode.defines,
      1
    );
    expect(values).toEqual([0.125, 0.5, 1.5, 150000005.75, 1, -2, 3, 1]);
  }, 120000);
}

it('fp64 WGSL logarithm domain', async ({skip}) => {
  const device = await getWebGPUTestDevice();
  if (!device || isSoftwareBackedDevice(device)) return skip();
  const values = await compute(
    device,
    [0, -1, NaN, Infinity],
    4,
    'resultData[index] = log_fp64(inputData[index]);',
    MODES[0].defines
  );
  expect(values.slice(0, 3).every(Number.isNaN)).toBe(true);
  expect(values[3]).toBe(Infinity);
}, 120000);

// Match the existing arithmetic specs: native fp64 helper expansion is prohibitively slow
// in software compute pipelines. Keep numerical coverage on hardware and validate WGSL
// module compilation on every adapter without creating a native compute pipeline.
function isSoftwareBackedDevice(device: Device): boolean {
  return (
    device.info.gpu === 'software' || device.info.gpuType === 'cpu' || Boolean(device.info.fallback)
  );
}

it('fp64 WGSL projection module compiles on every adapter', async ({skip}) => {
  const device = await getWebGPUTestDevice();
  if (!device) return skip();
  for (const mode of MODES) {
    const {source} = new WGSLShaderAssembler().assembleWGSLShader({
      platformInfo: {
        type: 'webgpu',
        gpu: device.info.gpu,
        shaderLanguage: 'wgsl',
        shaderLanguageVersion: 300,
        features: new Set()
      },
      source: '@compute @workgroup_size(1) fn main() {}',
      modules: [fp64],
      defines: mode.defines,
      shaderStage: 'compute'
    });
    const shader = device.createShader({stage: 'compute', source});
    try {
      const messages = await (
        shader as typeof shader & {
          getCompilationInfo: () => Promise<readonly {message: string; type: string}[]>;
        }
      ).getCompilationInfo();
      expect(
        messages.filter(message => message.type === 'error'),
        mode.name
      ).toEqual([]);
    } finally {
      shader.destroy();
    }
  }
}, 120000);

async function compute(
  device: Device,
  inputs: number[],
  outputLength: number,
  body: string,
  defines: Record<string, boolean>,
  invocationCount = inputs.length
): Promise<number[]> {
  const data = new Float32Array(inputs.length * 2);
  for (let index = 0; index < inputs.length; index++) {
    // fp64ify(Infinity) would produce a NaN low limb; non-finite test inputs use a zero low limb.
    if (Number.isFinite(inputs[index])) fp64ify(inputs[index], data, index * 2);
    else data.set([inputs[index], 0], index * 2);
  }
  const inputBuffer = device.createBuffer({data, usage: Buffer.STORAGE | Buffer.COPY_DST});
  const resultBuffer = device.createBuffer({
    byteLength: outputLength * 8,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
  let computation: Computation | undefined;
  try {
    computation = new Computation(device, {
      source: /* wgsl */ `
        @group(0) @binding(1) var<storage, read> inputData: array<vec2f>;
        @group(0) @binding(2) var<storage, read_write> resultData: array<vec2f>;
        @compute @workgroup_size(1) fn main(@builtin(global_invocation_id) invocation: vec3u) {
          // Keep the arithmetic uniform active in every kernel, including integer-only ones.
          // WebGPU automatic layouts otherwise omit it when a particular helper does not read it.
          if (fp64arithmetic.ONE != 1.0) { return; }
          let index = invocation.x;
          ${body}
        }`,
      modules: [fp64],
      defines,
      shaderInputs: new ShaderInputs({fp64arithmetic})
    });
    const compilation = await (
      computation.shader as typeof computation.shader & {
        getCompilationInfo: () => Promise<readonly {message: string; type: string}[]>;
      }
    ).getCompilationInfo();
    expect(compilation.filter(message => message.type === 'error')).toEqual([]);
    computation.setBindings({inputData: inputBuffer, resultData: resultBuffer});
    computation.updateShaderInputs();
    const pass = device.beginComputePass({});
    computation.dispatch(pass, invocationCount);
    pass.end();
    device.submit();
    const bytes = await resultBuffer.readAsync();
    const limbs = new Float32Array(bytes.buffer, bytes.byteOffset, outputLength * 2);
    return Array.from(
      {length: outputLength},
      (_, index) => limbs[index * 2] + limbs[index * 2 + 1]
    );
  } finally {
    computation?.destroy();
    inputBuffer.destroy();
    resultBuffer.destroy();
  }
}
