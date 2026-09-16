// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph, GraphVectorView, type GraphDataView} from '@luma.gl/gpgpu/gpu-core';
import type {GPUVectorFormat} from '@luma.gl/gpgpu/gpu-data';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {expect, it, vi, type TestContext} from 'vitest';
import {
  compileProjectionPlan,
  compileProjectionProgram,
  GPUProjectionProgram,
  invertProjectionProgram,
  type ProjectionProgram,
  type ProjectionInputFormat
} from '@luma.gl/experimental/gpu-project';
import {addGeospatialPass} from '../../src/geospatial/geospatial-utils';

const formats: ProjectionInputFormat[] = ['float32x2', 'float32x4', 'uint32x4'];
for (const inputFormat of formats) {
  for (const precision of ['local-f32', 'double-single'] as const) {
    it(`composes ${inputFormat} to ${precision} identically inline and in a graph`, async context => {
      const device = await getWebGPUTestDevice();
      if (!device) {
        return;
      }
      skipSoftwareDevice(device, context);
      const plan = compileProjectionPlan({
        projection: position => [
          10_000_000 + position[0] * 2 + position[1] ** 2 * 0.001,
          20_000_000 + position[1] * 3
        ],
        bounds: [-4, -4, 4, 4],
        degree: 2,
        tolerance: 1e-6,
        precision: 'double-single'
      });
      const definition: ProjectionProgram = {
        precision,
        destinationOrigin: [20_000_000.125, -59_999_900],
        operations: [
          {type: 'axis', order: [1, 0]},
          {type: 'unit', factor: Math.PI / 180},
          {type: 'adaptive', plan},
          {type: 'affine', scale: [2, -3], offset: [0.125, 100]}
        ]
      };
      const projection = compileProjectionProgram(definition, {inputFormat});
      const points = [
        [0, 0],
        [37.123456, -122.123456],
        [Infinity, 0],
        [999, 999],
        [1, 2]
      ];
      const encoded = encodePositions(inputFormat, points);
      const outputWidth = precision === 'local-f32' ? 2 : 4;
      const outputFormat = precision === 'local-f32' ? 'float32x2' : 'float32x4';
      const graph = new GPUCommandGraph(device);
      const buffers: Buffer[] = [];
      const makeView = <Format extends GPUVectorFormat>(
        id: string,
        format: Format,
        data: Float32Array | Uint32Array
      ): GraphDataView<Format> => {
        const buffer = device.createBuffer({
          byteLength: 256 + data.byteLength,
          usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
        });
        buffer.write(data, 256);
        buffers.push(buffer);
        return importView(graph, id, buffer, format, points.length, 256);
      };
      const input = makeView('input', inputFormat, encoded);
      const output = makeView(
        'output',
        outputFormat,
        new Float32Array(points.length * outputWidth)
      );
      const validity = makeView('validity', 'uint32', new Uint32Array(points.length));
      const mask = makeView('mask', 'uint32', Uint32Array.of(1, 1, 1, 1, 0));
      const inlineOutput = makeView(
        'inline-output',
        outputFormat,
        new Float32Array(points.length * outputWidth)
      );
      const inlineValidity = makeView('inline-validity', 'uint32', new Uint32Array(points.length));
      const contributor = new GPUProjectionProgram({
        projection,
        positions: input,
        output,
        validity,
        inputValidity: mask
      });
      const submit = vi.spyOn(device, 'submit');
      contributor.addToGraph(graph);
      expect(submit).not.toHaveBeenCalled();
      const shader = projection.getShader({namespace: 'inline', parameterOffset: 64});
      const parameterData = projection.packParameters();
      const parameterBuffer = device.createBuffer({
        byteLength: 256 + parameterData.byteLength,
        usage: Buffer.STORAGE | Buffer.COPY_DST
      });
      parameterBuffer.write(parameterData, 256);
      buffers.push(parameterBuffer);
      const parameters = importView(
        graph,
        'inline-parameters',
        parameterBuffer,
        'uint32',
        64 + parameterData.length
      );
      addGeospatialPass(graph, {
        id: 'inline-consumer',
        precise: true,
        dispatchLayout: {x: 1, y: 1, z: 1},
        bindings: {
          [shader.bindingName]: parameters,
          inputs: input,
          mask,
          outputs: inlineOutput,
          validity: inlineValidity
        },
        resources: [
          {buffer: parameters, usage: 'storage-read'},
          {buffer: input, usage: 'storage-read'},
          {buffer: mask, usage: 'storage-read'},
          {buffer: inlineOutput, usage: 'storage-write'},
          {buffer: inlineValidity, usage: 'storage-write'}
        ],
        source: `${shader.source}
@group(0) @binding(auto) var<storage, read> inputs: array<${shader.inputType}>;
@group(0) @binding(auto) var<storage, read> mask: array<u32>;
@group(0) @binding(auto) var<storage, read_write> outputs: array<${shader.outputType}>;
@group(0) @binding(auto) var<storage, read_write> validity: array<u32>;
@compute @workgroup_size(1) fn main() {
  for (var index = 0u; index < 5u; index += 1u) {
    let result = ${shader.entryPoint}(inputs[index], mask[index]);
    outputs[index] = result.position;
    validity[index] = result.valid;
  }
}`
      });
      const compiled = graph.compile();
      expect(submit).not.toHaveBeenCalled();
      submit.mockRestore();
      execute(device, compiled);
      const actual = new Float32Array(
        (await buffers[1].readAsync(256, points.length * outputWidth * 4)).buffer
      );
      const inline = new Float32Array(
        (await buffers[4].readAsync(256, points.length * outputWidth * 4)).buffer
      );
      expect(new Uint32Array(actual.buffer)).toEqual(new Uint32Array(inline.buffer));
      expect(new Uint32Array((await buffers[2].readAsync(256, 20)).buffer)).toEqual(
        Uint32Array.of(1, 1, 0, 0, 0)
      );
      expect(new Uint32Array((await buffers[5].readAsync(256, 20)).buffer)).toEqual(
        Uint32Array.of(1, 1, 0, 0, 0)
      );
      for (let row = 0; row < 2; row++) {
        const x = inputFormat === 'float32x2' ? Math.fround(points[row][0]) : points[row][0];
        const y = inputFormat === 'float32x2' ? Math.fround(points[row][1]) : points[row][1];
        const longitude = (y * Math.PI) / 180;
        const latitude = (x * Math.PI) / 180;
        const expected = [
          (10_000_000 + longitude * 2 + latitude ** 2 * 0.001) * 2 + 0.125,
          (20_000_000 + latitude * 3) * -3 + 100
        ];
        const reconstructed =
          precision === 'double-single'
            ? [actual[row * 4] + actual[row * 4 + 1], actual[row * 4 + 2] + actual[row * 4 + 3]]
            : [actual[row * 2] + 20_000_000.125, actual[row * 2 + 1] - 59_999_900];
        for (let axis = 0; axis < 2; axis++) {
          expect(Math.abs(reconstructed[axis] - expected[axis])).toBeLessThan(3e-6);
        }
      }
      expect([...actual.slice(2 * outputWidth)]).toEqual(new Array(3 * outputWidth).fill(0));
      compiled.destroy();
      contributor.destroy();
      for (const buffer of buffers) {
        expect(buffer.destroyed).toBe(false);
        buffer.destroy();
      }
    });
  }
}

it('chains double-single output through inverse operations and preserves zero validity', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }
  skipSoftwareDevice(device, context);
  const definition: ProjectionProgram = {
    precision: 'double-single',
    operations: [
      {type: 'axis', order: [1, 0]},
      {type: 'unit', factor: 0.125},
      {type: 'affine', scale: [3, -2], offset: [100_000_000.125, -200_000_000.25]}
    ]
  };
  const graph = new GPUCommandGraph(device);
  const sourceBuffer = device.createBuffer({
    data: new Uint32Array(Float64Array.of(0, 0, 1.00001, 2.00002, NaN, 0).buffer),
    usage: Buffer.STORAGE
  });
  const intermediateBuffer = device.createBuffer({byteLength: 48, usage: Buffer.STORAGE});
  const outputBuffer = device.createBuffer({
    byteLength: 48,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
  const validityBuffer = device.createBuffer({
    byteLength: 12,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
  const outputValidityBuffer = device.createBuffer({
    byteLength: 12,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
  const intermediate = importView(graph, 'intermediate', intermediateBuffer, 'float32x4', 3);
  const validity = importView(graph, 'validity', validityBuffer, 'uint32', 3);
  const forward = new GPUProjectionProgram({
    id: 'forward',
    projection: compileProjectionProgram(definition, {inputFormat: 'uint32x4'}),
    positions: importView(graph, 'source', sourceBuffer, 'uint32x4', 3),
    output: intermediate,
    validity
  });
  const inverse = new GPUProjectionProgram({
    id: 'inverse',
    projection: compileProjectionProgram(invertProjectionProgram(definition), {
      inputFormat: 'float32x4'
    }),
    positions: intermediate,
    inputValidity: validity,
    output: importView(graph, 'output', outputBuffer, 'float32x4', 3),
    validity: importView(graph, 'output-validity', outputValidityBuffer, 'uint32', 3)
  });
  forward.addToGraph(graph);
  inverse.addToGraph(graph);
  const compiled = graph.compile();
  execute(device, compiled);
  const result = new Float32Array((await outputBuffer.readAsync()).buffer);
  expect(Math.abs(result[4] + result[5] - 1.00001)).toBeLessThan(2e-6);
  expect(Math.abs(result[6] + result[7] - 2.00002)).toBeLessThan(2e-6);
  expect(new Uint32Array((await outputValidityBuffer.readAsync()).buffer)).toEqual(
    Uint32Array.of(1, 1, 0)
  );
  expect([...result.slice(0, 4)]).toEqual([0, 0, 0, 0]);
  compiled.destroy();
  forward.destroy();
  inverse.destroy();
  for (const buffer of [
    sourceBuffer,
    intermediateBuffer,
    outputBuffer,
    validityBuffer,
    outputValidityBuffer
  ]) {
    buffer.destroy();
  }
});

it('updates parameters on the existing graph and preserves empty source chunks', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }
  skipSoftwareDevice(device, context);
  const makeProjection = (factor: number) =>
    compileProjectionProgram({precision: 'double-single', operations: [{type: 'unit', factor}]});
  const graph = new GPUCommandGraph(device);
  const sourceBuffer = device.createBuffer({
    data: Float32Array.of(1, 2, 3, 4),
    usage: Buffer.STORAGE
  });
  const outputBuffer = device.createBuffer({
    byteLength: 32,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
  const source = importView(graph, 'source', sourceBuffer, 'float32x2', 2);
  const output = importView(graph, 'output', outputBuffer, 'float32x4', 2);
  const inputs = new GraphVectorView({
    id: 'inputs',
    name: 'inputs',
    length: 2,
    valueLength: 4,
    stride: 2,
    byteStride: 8,
    rowByteLength: 8,
    format: 'float32x2',
    data: [graph.createDataView(source.buffer, {format: 'float32x2', length: 0}), source]
  });
  const outputs = new GraphVectorView({
    id: 'outputs',
    name: 'outputs',
    length: 2,
    valueLength: 8,
    stride: 4,
    byteStride: 16,
    rowByteLength: 16,
    format: 'float32x4',
    data: [graph.createDataView(output.buffer, {format: 'float32x4', length: 0}), output]
  });
  const contributor = new GPUProjectionProgram({
    projection: makeProjection(2),
    positions: inputs,
    output: outputs
  });
  contributor.addToGraph(graph);
  const compiled = graph.compile();
  execute(device, compiled);
  expect(new Float32Array((await outputBuffer.readAsync()).buffer)).toEqual(
    Float32Array.of(2, 0, 4, 0, 6, 0, 8, 0)
  );
  const submit = vi.spyOn(device, 'submit');
  contributor.updateProjection(makeProjection(3));
  expect(submit).not.toHaveBeenCalled();
  submit.mockRestore();
  expect(() =>
    contributor.updateProjection(
      compileProjectionProgram({precision: 'double-single', operations: []})
    )
  ).toThrow(/layout/);
  execute(device, compiled);
  expect(new Float32Array((await outputBuffer.readAsync()).buffer)).toEqual(
    Float32Array.of(3, 0, 6, 0, 9, 0, 12, 0)
  );
  compiled.destroy();
  contributor.destroy();
  contributor.destroy();
  expect(sourceBuffer.destroyed).toBe(false);
  expect(outputBuffer.destroyed).toBe(false);
  expect(() => contributor.updateProjection(makeProjection(4))).toThrow(/destroyed/);
  sourceBuffer.destroy();
  outputBuffer.destroy();
});

it('embeds two namespaced programs directly in a consumer computation', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }
  skipSoftwareDevice(device, context);
  const definition: ProjectionProgram = {
    precision: 'double-single',
    operations: [{type: 'affine', scale: [2, -4], offset: [10_000_000.125, -20_000_000.25]}]
  };
  const forward = compileProjectionProgram(definition);
  const inverse = compileProjectionProgram(invertProjectionProgram(definition), {
    inputFormat: 'float32x4'
  });
  const forwardShader = forward.getShader({namespace: 'forward'});
  const inverseShader = inverse.getShader({namespace: 'inverse'});
  const forwardBuffer = device.createBuffer({
    data: forward.packParameters(),
    usage: Buffer.STORAGE
  });
  const inverseBuffer = device.createBuffer({
    data: inverse.packParameters(),
    usage: Buffer.STORAGE
  });
  const output = device.createBuffer({byteLength: 16, usage: Buffer.STORAGE | Buffer.COPY_SRC});
  const computation = new Computation(device, {
    source: `${forwardShader.source}\n${inverseShader.source}
@group(0) @binding(auto) var<storage, read_write> output: array<vec4f>;
@compute @workgroup_size(1) fn main() {
  let projected = ${forwardShader.entryPoint}(vec2f(0.015625, -0.03125), 1u);
  let restored = ${inverseShader.entryPoint}(projected.position, projected.valid);
  output[0] = restored.position;
}`,
    modules: forwardShader.modules,
    defines: forwardShader.defines,
    shaderLayout: {
      bindings: [forwardShader.bindingName, inverseShader.bindingName, 'output'].map(
        (name, location) => ({name, location, group: 0, type: 'storage' as const})
      )
    }
  });
  computation.setBindings({
    [forwardShader.bindingName]: forwardBuffer,
    [inverseShader.bindingName]: inverseBuffer,
    output
  });
  const pass = device.beginComputePass({});
  computation.dispatch(pass, 1);
  pass.end();
  device.submit();
  expect(new Float32Array((await output.readAsync()).buffer)).toEqual(
    Float32Array.of(0.015625, 0, -0.03125, 0)
  );
  computation.destroy();
  forwardBuffer.destroy();
  inverseBuffer.destroy();
  output.destroy();
});

it('preserves raw binary64 origin subtraction through two adaptive stages', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }
  skipSoftwareDevice(device, context);
  const origin = 100_000_000;
  const firstPlan = compileProjectionPlan({
    projection: position => [position[0] - origin, position[1] - origin],
    bounds: [origin - 1, origin - 1, origin + 1, origin + 1],
    precision: 'double-single',
    degree: 1,
    tolerance: 1e-9
  });
  const secondPlan = compileProjectionPlan({
    projection: position => [position[0] * 2, position[1] * 3],
    bounds: [-2, -2, 2, 2],
    precision: 'double-single',
    degree: 1,
    tolerance: 1e-9
  });
  const projection = compileProjectionProgram(
    {
      precision: 'double-single',
      operations: [
        {type: 'adaptive', plan: firstPlan},
        {type: 'adaptive', plan: secondPlan}
      ]
    },
    {inputFormat: 'uint32x4'}
  );
  const graph = new GPUCommandGraph(device);
  const delta = 2 ** -26;
  const source = device.createBuffer({
    data: encodePositions('uint32x4', [[origin + delta, origin - delta]]),
    usage: Buffer.STORAGE
  });
  const output = device.createBuffer({byteLength: 16, usage: Buffer.STORAGE | Buffer.COPY_SRC});
  const contributor = new GPUProjectionProgram({
    projection,
    positions: importView(graph, 'source', source, 'uint32x4', 1),
    output: importView(graph, 'output', output, 'float32x4', 1)
  });
  contributor.addToGraph(graph);
  const compiled = graph.compile();
  execute(device, compiled);
  const result = new Float32Array((await output.readAsync()).buffer);
  expect(Math.abs(result[0] + result[1] - delta * 2)).toBeLessThan(1e-13);
  expect(Math.abs(result[2] + result[3] + delta * 3)).toBeLessThan(1e-13);
  compiled.destroy();
  contributor.destroy();
  source.destroy();
  output.destroy();
});

it('keeps double-single input bounds inside the exact binary64 domain', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }
  skipSoftwareDevice(device, context);
  const minimum = 1_209_248.0383019687;
  const maximum = minimum + 2;
  const plan = compileProjectionPlan({
    projection: position => [position[0] - minimum, position[1] - minimum],
    bounds: [minimum, minimum, maximum, maximum],
    precision: 'double-single',
    degree: 1,
    tolerance: 1e-7
  });
  const points = [
    minimum - 1e-8,
    minimum,
    minimum + 1e-8,
    maximum - 1e-8,
    maximum,
    maximum + 1e-8
  ].map(value => [value, value]);
  const encoded = encodePositions('float32x4', points);
  const expectedValidity = points.map((point, index) => {
    const represented = encoded[index * 4] + encoded[index * 4 + 1];
    return represented >= minimum && represented <= maximum ? 1 : 0;
  });
  const graph = new GPUCommandGraph(device);
  const source = device.createBuffer({data: encoded, usage: Buffer.STORAGE});
  const output = device.createBuffer({byteLength: points.length * 16, usage: Buffer.STORAGE});
  const validity = device.createBuffer({
    byteLength: points.length * 4,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
  const contributor = new GPUProjectionProgram({
    projection: compileProjectionProgram(
      {precision: 'double-single', operations: [{type: 'adaptive', plan}]},
      {inputFormat: 'float32x4'}
    ),
    positions: importView(graph, 'source', source, 'float32x4', points.length),
    output: importView(graph, 'output', output, 'float32x4', points.length),
    validity: importView(graph, 'validity', validity, 'uint32', points.length)
  });
  contributor.addToGraph(graph);
  const compiled = graph.compile();
  execute(device, compiled);
  expect(new Uint32Array((await validity.readAsync()).buffer)).toEqual(
    Uint32Array.from(expectedValidity)
  );
  compiled.destroy();
  contributor.destroy();
  source.destroy();
  output.destroy();
  validity.destroy();
});

function skipSoftwareDevice(device: Device, context: TestContext): void {
  // Like the P.1 projection tests, composed integer-fp64 shaders exceed SwiftShader's practical
  // compilation budget, even for the two-axis unit smoke test. CPU compiler tests run in CI;
  // hardware adapters run all numerical, inline/graph, and parameter-update checks.
  if (device.info.gpu === 'software' || device.info.gpuType === 'cpu' || device.info.fallback) {
    context.skip();
  }
}

function encodePositions(
  format: ProjectionInputFormat,
  points: number[][]
): Float32Array | Uint32Array {
  if (format === 'uint32x4') {
    return new Uint32Array(Float64Array.from(points.flat()).buffer);
  }
  if (format === 'float32x2') {
    return Float32Array.from(points.flat());
  }
  return Float32Array.from(
    points.flatMap(point =>
      point.flatMap(value => [
        Math.fround(value),
        Number.isFinite(value) ? value - Math.fround(value) : 0
      ])
    )
  );
}

function importView<Format extends GPUVectorFormat>(
  graph: GPUCommandGraph,
  id: string,
  buffer: Buffer,
  format: Format,
  length: number,
  byteOffset = 0
): GraphDataView<Format> {
  const handle = graph.importBuffer(
    {id, byteLength: buffer.byteLength, usage: buffer.usage},
    buffer
  );
  return graph.createDataView(handle, {format, length, byteOffset});
}

function execute(device: Device, compiled: ReturnType<GPUCommandGraph['compile']>): void {
  const encoder = device.createCommandEncoder();
  compiled.encode(encoder, {parameters: undefined});
  device.submit(encoder.finish());
}
