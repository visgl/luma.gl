// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {
  compileProjectionProgram,
  evaluateProjectionProgram,
  GPUProjectionProgram,
  type ProjectionProgram
} from '@luma.gl/experimental/gpu-project';
import {expect, it} from 'vitest';
import {
  addGeospatialPass,
  getGeospatialDispatchLayout,
  getGeospatialInvocationIndexSource
} from '../../src/geospatial/geospatial-utils';

for (const inputFormat of ['float32x2', 'float32x4', 'uint32x4'] as const) {
  it(`wraps ${inputFormat} with double-single seam checks, reusable parameters and inline/graph agreement`, async context => {
    const device = await getWebGPUTestDevice();
    if (!device) return;
    if (device.info.gpu === 'software' || device.info.gpuType === 'cpu' || device.info.fallback)
      context.skip();
    const makeProgram = (minimum: number, maximum: number): ProjectionProgram => ({
      precision: 'double-single',
      operations: [{type: 'longitude-wrap', interval: [minimum, maximum]}]
    });
    const initial = compileProjectionProgram(makeProgram(-180, 180), {inputFormat});
    const graph = new GPUCommandGraph(device);
    const fractions = [
      -1024.75,
      -1023.5,
      -1.1,
      -0.000001,
      0,
      2 ** -33,
      2 ** -31,
      0.000001,
      0.25,
      0.5,
      0.500000001,
      0.999999,
      1 - 2 ** -31,
      1 - 2 ** -33,
      1,
      1 + 2 ** -33,
      1 + 2 ** -31,
      1.000001,
      1024.5,
      1025.5,
      NaN,
      Infinity,
      0.5
    ];
    const rowCount = fractions.length;
    const buffers = [
      inputFormat === 'float32x2' ? rowCount * 8 : rowCount * 16,
      rowCount * 4,
      rowCount * 16,
      rowCount * 4,
      rowCount * 16,
      rowCount * 4,
      initial.packParameters().byteLength
    ].map(byteLength =>
      device.createBuffer({byteLength, usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST})
    );
    const handles = buffers.map((buffer, index) =>
      graph.importBuffer(
        {id: `wrap-${index}`, byteLength: buffer.byteLength, usage: buffer.usage},
        buffer
      )
    );
    const positions = graph.createDataView(handles[0], {format: inputFormat, length: rowCount});
    const mask = graph.createDataView(handles[1], {format: 'uint32', length: rowCount});
    const output = graph.createDataView(handles[2], {format: 'float32x4', length: rowCount});
    const validity = graph.createDataView(handles[3], {format: 'uint32', length: rowCount});
    const inline = graph.createDataView(handles[4], {format: 'float32x4', length: rowCount});
    const inlineValidity = graph.createDataView(handles[5], {format: 'uint32', length: rowCount});
    const parameters = graph.createDataView(handles[6], {
      format: 'uint32',
      length: initial.packParameters().length
    });
    const contributor = new GPUProjectionProgram({
      projection: initial,
      positions,
      inputValidity: mask,
      output,
      validity
    });
    contributor.addToGraph(graph);
    const shader = initial.getShader({namespace: 'wrapInline'});
    const dispatchLayout = getGeospatialDispatchLayout(
      rowCount,
      device.limits.maxComputeWorkgroupsPerDimension
    );
    addGeospatialPass(graph, {
      id: 'wrap-inline',
      dispatchLayout,
      precise: true,
      bindings: {
        [shader.bindingName]: parameters,
        positions,
        mask,
        output: inline,
        validity: inlineValidity
      },
      resources: [
        {buffer: parameters, usage: 'storage-read'},
        {buffer: positions, usage: 'storage-read'},
        {buffer: mask, usage: 'storage-read'},
        {buffer: inline, usage: 'storage-write'},
        {buffer: inlineValidity, usage: 'storage-write'}
      ],
      source: `${shader.source}
@group(0) @binding(auto) var<storage, read> positions: array<${shader.inputType}>;
@group(0) @binding(auto) var<storage, read> mask: array<u32>;
@group(0) @binding(auto) var<storage, read_write> output: array<vec4f>;
@group(0) @binding(auto) var<storage, read_write> validity: array<u32>;
@compute @workgroup_size(256) fn main(@builtin(workgroup_id) workgroupId: vec3u, @builtin(local_invocation_id) localId: vec3u) {
  ${getGeospatialInvocationIndexSource(dispatchLayout)}
  if (index >= ${rowCount}u) { return; }
  let result = ${shader.entryPoint}(positions[index], mask[index]);
  output[index] = result.position;
  validity[index] = result.valid;
}`
    });
    const compiled = graph.compile();
    try {
      buffers[1].write(
        Uint32Array.from(fractions, (_value, index) => Number(index !== rowCount - 1))
      );
      for (const [minimum, maximum] of [
        [-180, 180],
        [0, 360],
        [-Math.PI, Math.PI]
      ]) {
        const definition = makeProgram(minimum, maximum);
        const projection = compileProjectionProgram(definition, {inputFormat});
        contributor.updateProjection(projection);
        buffers[6].write(projection.packParameters());
        const period = maximum - minimum;
        const points = fractions.map(fraction => [minimum + fraction * period, 12345678.000001]);
        const flattened = points.flat();
        buffers[0].write(
          inputFormat === 'uint32x4'
            ? new Uint32Array(Float64Array.from(flattened).buffer)
            : inputFormat === 'float32x2'
              ? Float32Array.from(flattened)
              : Float32Array.from(
                  flattened.flatMap(value => [
                    Math.fround(value),
                    Number.isFinite(value) ? value - Math.fround(value) : 0
                  ])
                )
        );
        const encoder = device.createCommandEncoder();
        compiled.encode(encoder, {parameters: undefined});
        device.submit(encoder.finish());
        const actual = new Float32Array((await buffers[2].readAsync()).buffer);
        const actualValidity = new Uint32Array((await buffers[3].readAsync()).buffer);
        expect(new Uint32Array(actual.buffer)).toEqual(
          new Uint32Array((await buffers[4].readAsync()).buffer)
        );
        expect(actualValidity).toEqual(new Uint32Array((await buffers[5].readAsync()).buffer));
        for (let row = 0; row < rowCount; row++) {
          const source = points[row].map(value =>
            inputFormat === 'float32x2' ? Math.fround(value) : value
          );
          const expected = evaluateProjectionProgram(definition, [source[0], source[1]]);
          const valid = expected.valid && row !== rowCount - 1;
          expect(actualValidity[row]).toBe(Number(valid));
          if (valid) {
            expect(
              Math.abs(actual[row * 4] + actual[row * 4 + 1] - expected.position[0])
            ).toBeLessThan(period * 1e-10);
            expect(Math.abs(actual[row * 4 + 2] + actual[row * 4 + 3] - source[1])).toBeLessThan(
              1e-7
            );
          } else expect([...actual.slice(row * 4, row * 4 + 4)]).toEqual([0, 0, 0, 0]);
        }
      }
    } finally {
      compiled.destroy();
      contributor.destroy();
      for (const buffer of buffers) buffer.destroy();
    }
  });
}
