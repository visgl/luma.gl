// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph, GraphVectorView, type GraphDataView} from '@luma.gl/gpgpu/gpu-core';
import type {GPUVectorFormat} from '@luma.gl/gpgpu/gpu-data';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {Proj4Projection} from '@math.gl/proj4';
import {planCRSProjection, planProjectionPipeline} from '@luma.gl/experimental/gpu-project/crs';
import {expect, it, vi, type TestContext} from 'vitest';
import {
  compileProjectionPlan,
  compileProjectionProgram,
  evaluateProjectionProgram,
  GPUProjectionProgram,
  invertProjectionProgram,
  type ProjectionProgram,
  type ProjectionInputFormat
} from '@luma.gl/experimental/gpu-project';
import {addGeospatialPass} from '../../src/geospatial/geospatial-utils';
import {
  geographicCRS,
  makeTransverseMercatorCRS,
  makeWebMercatorCRS
} from './projection-crs-fixtures';

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

for (const nativeCRS of [false, true]) {
  it(`chains double-single output through inverse operations and preserves zero validity (native CRS: ${nativeCRS})`, async context => {
    const device = await getWebGPUTestDevice();
    if (!device) {
      return;
    }
    skipSoftwareDevice(device, context);
    let definition: ProjectionProgram = {
      precision: 'double-single',
      operations: [
        {type: 'axis', order: [1, 0]},
        {type: 'unit', factor: 0.125},
        {type: 'affine', scale: [3, -2], offset: [100_000_000.125, -200_000_000.25]}
      ]
    };
    if (nativeCRS) {
      const source = makeTransverseMercatorCRS();
      const target = {
        ...source,
        conversion: {
          ...source.conversion,
          parameters: source.conversion.parameters.map(parameter => ({
            ...parameter,
            value:
              parameter.value +
              (parameter.id.code === 8806
                ? 100000000.125
                : parameter.id.code === 8807
                  ? -200000000.25
                  : 0)
          }))
        },
        coordinate_system: {
          ...source.coordinate_system,
          axis: [
            {...source.coordinate_system.axis[1], direction: 'south' as const},
            {...source.coordinate_system.axis[0], direction: 'west' as const}
          ]
        }
      };
      const result = planCRSProjection({
        from: source,
        to: target,
        enforceAxis: true,
        allowAdaptive: false
      });
      if (result.status !== 'ready') throw new Error(JSON.stringify(result.reasons));
      expect(result.strategy).toBe('native');
      definition = result.program;
    }
    const graph = new GPUCommandGraph(device);
    const sourceBuffer = device.createBuffer({
      data: new Uint32Array(Float64Array.of(0, 0, 1.00001, 2.00002, NaN, 0).buffer),
      usage: Buffer.STORAGE
    });
    const intermediateBuffer = device.createBuffer({
      byteLength: 48,
      usage: Buffer.STORAGE | Buffer.COPY_SRC
    });
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
    if (nativeCRS) {
      const intermediateResult = new Float32Array((await intermediateBuffer.readAsync()).buffer);
      expect(
        Math.abs(intermediateResult[4] + intermediateResult[5] - (200000000.25 - 2.00002))
      ).toBeLessThan(2e-6);
      expect(
        Math.abs(intermediateResult[6] + intermediateResult[7] + 100000000.125 + 1.00001)
      ).toBeLessThan(2e-6);
      expect(intermediateResult[5]).not.toBe(0);
      expect(intermediateResult[7]).not.toBe(0);
    }
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
}

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

for (const target of [
  'native',
  'EPSG:3857',
  'PROJJSON:3857',
  'analytic:3857',
  'PROJJSON:32610',
  'analytic:32610',
  '+proj=utm +zone=10 +datum=WGS84 +units=m'
] as const) {
  it(`executes a planned ${target} transformation with the declared arithmetic precision`, async context => {
    const device = await getWebGPUTestDevice();
    if (!device) {
      return;
    }
    skipSoftwareDevice(device, context);
    const analytic = target === 'analytic:3857' || target === 'analytic:32610';
    const explicitWebMercator = target === 'PROJJSON:3857' || target === 'analytic:3857';
    const explicitTransverseMercator = target === 'PROJJSON:32610' || target === 'analytic:32610';
    const planned =
      target === 'native'
        ? planProjectionPipeline({
            pipeline:
              '+proj=pipeline +step +proj=axisswap +order=-2,1 +step +proj=affine +s11=2 +s22=-3 +xoff=10000000 +yoff=20000000'
          })
        : planCRSProjection({
            from: explicitWebMercator || explicitTransverseMercator ? geographicCRS : 'EPSG:4326',
            to: explicitWebMercator
              ? makeWebMercatorCRS()
              : explicitTransverseMercator
                ? makeTransverseMercatorCRS()
                : target,
            projectionArithmetic: analytic ? 'float32' : 'double-single',
            bounds: [-122.5, 37.7, -122.3, 37.9],
            tolerance: 1e-5
          });
    if (planned.status !== 'ready') {
      throw new Error(JSON.stringify(planned.reasons));
    }
    expect(planned.compiled.metadata.arithmetic).toBe(analytic ? 'mixed' : 'double-single');
    if (analytic) expect(planned.strategy).toBe('native');
    const project =
      target === 'native'
        ? (coordinate: number[]) => [1e7 - 2 * coordinate[1], 2e7 - 3 * coordinate[0]]
        : new Proj4Projection({
            from: 'EPSG:4326',
            to: explicitWebMercator
              ? 'EPSG:3857'
              : explicitTransverseMercator
                ? 'EPSG:32610'
                : target
          }).project;
    const points = [
      [-122.4194001, 37.7749001],
      [-122.4194002, 37.7749002],
      [Infinity, 0]
    ];
    const graph = new GPUCommandGraph(device);
    const source = device.createBuffer({
      data: encodePositions('uint32x4', points),
      usage: Buffer.STORAGE
    });
    const output = device.createBuffer({byteLength: 48, usage: Buffer.STORAGE | Buffer.COPY_SRC});
    const validity = device.createBuffer({byteLength: 12, usage: Buffer.STORAGE | Buffer.COPY_SRC});
    const contributor = new GPUProjectionProgram({
      projection: planned.compiled,
      positions: importView(graph, 'planned-source', source, 'uint32x4', 3),
      output: importView(graph, 'planned-output', output, 'float32x4', 3),
      validity: importView(graph, 'planned-validity', validity, 'uint32', 3)
    });
    contributor.addToGraph(graph);
    const compiled = graph.compile();
    try {
      execute(device, compiled);
      const actual = new Float32Array((await output.readAsync()).buffer);
      expect(new Uint32Array((await validity.readAsync()).buffer)).toEqual(Uint32Array.of(1, 1, 0));
      for (let row = 0; row < 2; row++) {
        const expected = project(points[row]);
        for (let axis = 0; axis < 2; axis++) {
          const offset = row * 4 + axis * 2;
          expect(Math.abs(actual[offset] + actual[offset + 1] - expected[axis])).toBeLessThan(
            analytic ? 20 : 1e-5
          );
        }
      }
      // The default retains detail below the high limb. Native formulas make no such guarantee.
      if (!analytic) {
        expect(actual[0]).toBe(actual[4]);
        expect(actual[0] + actual[1]).not.toBe(actual[4] + actual[5]);
      } else if (explicitWebMercator) {
        expect(actual[0] + actual[1]).toBe(actual[4] + actual[5]);
      }
    } finally {
      compiled.destroy();
      contributor.destroy();
      source.destroy();
      output.destroy();
      validity.destroy();
    }
  });
}

for (const {inputFormat, transverse} of formats.flatMap(inputFormat =>
  [false, true].map(transverse => ({inputFormat, transverse}))
)) {
  for (const inverse of [false, true]) {
    it(`executes native ${transverse ? 'Transverse' : 'Web'} Mercator ${inverse ? 'inverse' : 'forward'} with ${inputFormat} identically inline and in a graph`, async context => {
      const device = await getWebGPUTestDevice();
      if (!device) return;
      skipSoftwareDevice(device, context);
      const radius = 6378137;
      const definition: ProjectionProgram = {
        precision: 'double-single',
        operations: [
          transverse
            ? {
                type: 'transverse-mercator',
                arithmetic: 'float32',
                semiMajorAxis: radius,
                semiMinorAxis: radius * (1 - 1 / 298.257223563),
                scaleFactor: 0.9996,
                latitudeOrigin: 0,
                inverse
              }
            : {type: 'web-mercator', arithmetic: 'float32', radius, inverse}
        ]
      };
      const projection = compileProjectionProgram(definition, {inputFormat});
      const domain = projection.metadata.stages[0].inputBounds!;
      const fractions = [
        -0.99999, -0.75, -0.01, -0.005, -1e-8, 0, 1e-8, 0.005, 0.01, 0.75, 0.99999
      ];
      const points = [
        ...fractions.map(fraction => {
          const point: readonly [number, number] = transverse
            ? [((11.8 * Math.PI) / 180) * fraction, ((84 * Math.PI) / 180) * fraction]
            : [domain[2] * fraction, domain[3] * fraction];
          return transverse && inverse
            ? [...evaluateProjectionProgram(invertProjectionProgram(definition), point).position]
            : [...point];
        }),
        [domain[2] + (inputFormat === 'float32x2' ? 1 : inverse ? 0.01 : 1e-8), 0],
        [0, domain[3] + (inputFormat === 'float32x2' ? 1 : inverse ? 0.01 : 1e-8)],
        ...(transverse && inverse
          ? [
              [1500000, 0],
              [0, 10000000]
            ]
          : []),
        [Infinity, 0],
        [0, NaN],
        [0, 0]
      ];
      const graph = new GPUCommandGraph(device);
      const buffers: Buffer[] = [];
      const makeView = <Format extends GPUVectorFormat>(
        id: string,
        format: Format,
        data: Float32Array | Uint32Array
      ) => {
        const buffer = device.createBuffer({data, usage: Buffer.STORAGE | Buffer.COPY_SRC});
        buffers.push(buffer);
        return importView(graph, id, buffer, format, points.length);
      };
      const input = makeView('analytic-input', inputFormat, encodePositions(inputFormat, points));
      const output = makeView('analytic-output', 'float32x4', new Float32Array(points.length * 4));
      const validity = makeView('analytic-validity', 'uint32', new Uint32Array(points.length));
      const mask = makeView(
        'analytic-mask',
        'uint32',
        Uint32Array.from(points, (_point, index) => (index === points.length - 1 ? 0 : 1))
      );
      const inlineOutput = makeView(
        'inline-output',
        'float32x4',
        new Float32Array(points.length * 4)
      );
      const inlineValidity = makeView('inline-validity', 'uint32', new Uint32Array(points.length));
      const parameterData = projection.packParameters();
      const parameterBuffer = device.createBuffer({data: parameterData, usage: Buffer.STORAGE});
      buffers.push(parameterBuffer);
      const parameters = importView(
        graph,
        'analytic-parameters',
        parameterBuffer,
        'uint32',
        parameterData.length
      );
      const contributor = new GPUProjectionProgram({
        projection,
        positions: input,
        output,
        validity,
        inputValidity: mask
      });
      contributor.addToGraph(graph);
      const shader = projection.getShader({namespace: 'analytic'});
      addGeospatialPass(graph, {
        id: 'inline-analytic',
        precise: true,
        dispatchLayout: {x: points.length, y: 1, z: 1},
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
@group(0) @binding(auto) var<storage, read_write> outputs: array<vec4f>;
@group(0) @binding(auto) var<storage, read_write> validity: array<u32>;
@compute @workgroup_size(1) fn main(@builtin(global_invocation_id) invocation: vec3u) {
  let result = ${shader.entryPoint}(inputs[invocation.x], mask[invocation.x]);
  outputs[invocation.x] = result.position;
  validity[invocation.x] = result.valid;
}`
      });
      const compiled = graph.compile();
      try {
        execute(device, compiled);
        const actual = new Float32Array((await buffers[1].readAsync()).buffer);
        const inline = new Float32Array((await buffers[4].readAsync()).buffer);
        expect(new Uint32Array(actual.buffer)).toEqual(new Uint32Array(inline.buffer));
        const expectedValidity = Uint32Array.from(points, (_point, index) =>
          index < fractions.length ? 1 : 0
        );
        expect(new Uint32Array((await buffers[2].readAsync()).buffer)).toEqual(expectedValidity);
        expect(new Uint32Array((await buffers[5].readAsync()).buffer)).toEqual(expectedValidity);
        for (let row = 0; row < fractions.length; row++) {
          const point = points[row].map(value =>
            inputFormat === 'float32x2' ? Math.fround(value) : value
          );
          const expected = evaluateProjectionProgram(definition, [point[0], point[1]]);
          expect(expected.valid).toBe(true);
          for (let axis = 0; axis < 2; axis++) {
            const offset = row * 4 + axis * 2;
            // Device-dependent transcendental rounding, not a portable global accuracy promise.
            expect(Math.abs(actual[offset] - expected.position[axis])).toBeLessThan(
              inverse ? 2e-6 : 20
            );
            expect(actual[offset + 1]).toBe(0);
            if (Math.abs(fractions[row]) <= 1e-8) {
              expect(Math.abs(actual[offset] - expected.position[axis])).toBeLessThan(
                inverse ? 1e-13 : 1e-7
              );
            }
          }
        }
        expect([...actual.slice(fractions.length * 4)]).toEqual(
          new Array((points.length - fractions.length) * 4).fill(0)
        );
      } finally {
        compiled.destroy();
        contributor.destroy();
        for (const buffer of buffers) buffer.destroy();
      }
    });
  }
}

it('reuses native forward/inverse GPU programs across all UTM zones and hemispheres', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  skipSoftwareDevice(device, context);
  const planZone = (zone: number, south: boolean) => {
    const result = planCRSProjection({
      from: geographicCRS,
      to: makeTransverseMercatorCRS(zone, south),
      projectionArithmetic: 'float32',
      allowAdaptive: false
    });
    if (result.status !== 'ready') throw new Error(JSON.stringify(result.reasons));
    return result;
  };
  const initial = planZone(1, false);
  const graph = new GPUCommandGraph(device);
  const rowCount = 7;
  const inputs = [0, 1].map(() =>
    device.createBuffer({byteLength: rowCount * 16, usage: Buffer.STORAGE | Buffer.COPY_DST})
  );
  const outputs = [0, 1].map(() =>
    device.createBuffer({byteLength: rowCount * 16, usage: Buffer.STORAGE | Buffer.COPY_SRC})
  );
  const validities = [0, 1].map(() =>
    device.createBuffer({byteLength: rowCount * 4, usage: Buffer.STORAGE | Buffer.COPY_SRC})
  );
  const contributors = [
    initial.compiled,
    compileProjectionProgram(invertProjectionProgram(initial.program), {inputFormat: 'uint32x4'})
  ].map((projection, index) => {
    const contributor = new GPUProjectionProgram({
      id: `utm-${index}`,
      projection,
      positions: importView(graph, `utm-input-${index}`, inputs[index], 'uint32x4', rowCount),
      output: importView(graph, `utm-output-${index}`, outputs[index], 'float32x4', rowCount),
      validity: importView(graph, `utm-validity-${index}`, validities[index], 'uint32', rowCount)
    });
    contributor.addToGraph(graph);
    return contributor;
  });
  const compiled = graph.compile();
  try {
    for (let zone = 1; zone <= 60; zone++) {
      for (const south of [false, true]) {
        const planned = planZone(zone, south);
        contributors[0].updateProjection(planned.compiled);
        contributors[1].updateProjection(
          compileProjectionProgram(invertProjectionProgram(planned.program), {
            inputFormat: 'uint32x4'
          })
        );
        const centralMeridian = zone * 6 - 183;
        const latitude = south ? -80 : 84;
        const positions = [
          [centralMeridian - 3, latitude],
          [centralMeridian, latitude],
          [centralMeridian + 3, latitude],
          [centralMeridian - 3, 0],
          [centralMeridian, 0],
          [centralMeridian + 3, 0],
          [centralMeridian + 0.001, south ? -45 : 45]
        ];
        const oracle = new Proj4Projection({
          from: 'EPSG:4326',
          to: `+proj=utm +zone=${zone} ${south ? '+south' : ''} +datum=WGS84 +units=m`
        });
        const projected = positions.map(position => oracle.project(position));
        inputs[0].write(encodePositions('uint32x4', positions));
        // Independent oracle coordinates, not our forward result, exercise the inverse.
        inputs[1].write(encodePositions('uint32x4', projected));
        execute(device, compiled);
        for (let direction = 0; direction < 2; direction++) {
          expect(new Uint32Array((await validities[direction].readAsync()).buffer)).toEqual(
            new Uint32Array(rowCount).fill(1)
          );
          const actual = new Float32Array((await outputs[direction].readAsync()).buffer);
          const expected = direction === 0 ? projected : positions;
          for (let row = 0; row < rowCount; row++) {
            for (let axis = 0; axis < 2; axis++) {
              const offset = row * 4 + axis * 2;
              expect(
                Math.abs(actual[offset] + actual[offset + 1] - expected[row][axis])
              ).toBeLessThan(direction === 0 ? 20 : 0.0001);
            }
          }
        }
      }
    }
  } finally {
    compiled.destroy();
    for (const contributor of contributors) contributor.destroy();
    for (const buffer of [...inputs, ...outputs, ...validities]) buffer.destroy();
  }
}, 60000);

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
