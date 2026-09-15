// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {GPUReduction, GPUHistogram, GPUGroupAggregation, GPUScan} from '@luma.gl/gpgpu/gpu-core';
import {GPUVectorScalarMADD} from '../../src/gpu-core/gpu-elementwise-scalar';
import {GPUDotProductScalar} from '../../src/gpu-core/gpu-dot-product-scalar';
import {createGPUScalar} from '../../src/gpu-core/gpu-scalar';
import {GPUScalarLiteral} from '../../src/gpu-core/gpu-scalar-literal';
import {BATCH_PARTITIONS, BatchConformanceFixture} from './batch-conformance-utils';

for (const partition of BATCH_PARTITIONS) {
  for (const empty of [false, true]) {
    test(`aggregate batch contract: ${partition.name}, ${empty ? 'empty' : 'selected'} rows`, async () => {
      const device = await getWebGPUTestDevice();
      if (!device) return;
      const fixture = new BatchConformanceFixture(device);
      const {graph} = fixture;
      const lengths = empty ? partition.input.map(() => 0) : partition.input;
      const pairedLengths = empty ? partition.paired.map(() => 0) : partition.paired;
      const input = fixture.column('input', 'float32', empty ? [] : [1, 2, 3, 4, 5, 6], lengths, {
        atomic: 'atomic' in partition && partition.atomic
      });
      const mask = fixture.column('mask', 'uint32', empty ? [] : [1, 0, 2, 1, 0, 1], pairedLengths);
      const keys = fixture.column('keys', 'uint32', empty ? [] : [0, 1, 0, 1, 0, 1], lengths);
      const results: {view: ReturnType<typeof fixture.output>; expected: number[]}[] = [];
      for (const operation of ['sum', 'min', 'max', 'extent'] as const) {
        const output = fixture.output(operation, 'float32', operation === 'extent' ? 2 : 1);
        graph.add(new GPUReduction({id: operation, input, mask, output, operation}));
        results.push({
          view: output,
          expected: empty
            ? operation === 'extent'
              ? [0, 0]
              : [0]
            : {sum: [14], min: [1], max: [6], extent: [1, 6]}[operation]
        });
      }
      for (const irregular of [false, true]) {
        const output = fixture.output(`histogram-${irregular}`, 'uint32', 3);
        graph.add(
          new GPUHistogram({
            id: `histogram-${irregular}`,
            input,
            mask,
            output,
            ...(irregular ? {edges: [0, 2, 4, 6]} : {domain: [0, 6]})
          })
        );
        results.push({view: output, expected: empty ? [0, 0, 0] : [1, 1, 2]});
      }
      for (const operation of ['count', 'sum', 'min', 'max', 'mean'] as const) {
        if (operation === 'count') {
          const output = fixture.output('group-count', 'uint32', 3);
          graph.add(new GPUGroupAggregation({id: 'group-count', keys, mask, output, operation}));
          results.push({view: output, expected: empty ? [0, 0, 0] : [2, 2, 0]});
        } else {
          const output = fixture.output(`group-${operation}`, 'float32', 3);
          // Values have independent boundaries from both keys and selection.
          const values = fixture.column(
            `values-${operation}`,
            'float32',
            empty ? [] : [1, 2, 3, 4, 5, 6],
            pairedLengths
          );
          graph.add(
            new GPUGroupAggregation({
              id: `group-${operation}`,
              keys,
              values,
              mask,
              output,
              operation
            })
          );
          results.push({
            view: output,
            expected: empty
              ? operation === 'sum'
                ? [0, 0, 0]
                : [NaN, NaN, NaN]
              : {sum: [4, 10, 0], min: [1, 4, NaN], max: [3, 6, NaN], mean: [2, 5, NaN]}[operation]
          });
        }
      }
      const executable = graph.compile();
      try {
        for (let iteration = 0; iteration < 2; iteration++) {
          const encoder = device.createCommandEncoder();
          executable.encode(encoder, {parameters: undefined});
          device.submit(encoder.finish());
          for (const {view, expected} of results)
            expect(await fixture.read(view)).toEqual(expected);
        }
      } finally {
        executable.destroy();
        fixture.destroy();
      }
    });
  }
}

for (const partition of [
  ...BATCH_PARTITIONS.slice(0, 4),
  {name: 'segment head at boundary', input: [3, 3]}
]) {
  for (const mode of ['exclusive', 'inclusive'] as const) {
    test(`scan carry contract: ${partition.name}, ${mode}`, async () => {
      const device = await getWebGPUTestDevice();
      if (!device) return;
      const fixture = new BatchConformanceFixture(device);
      const options = {atomic: 'atomic' in partition && partition.atomic};
      const input = fixture.column('input', 'uint32', [1, 2, 3, 4, 5, 6], partition.input, options);
      const flags = fixture.column('flags', 'uint32', [0, 0, 0, 1, 0, 1], partition.input, options);
      const output = fixture.column(
        'output',
        'uint32',
        [77, 77, 77, 77, 77, 77],
        partition.input,
        options
      );
      const segmented = fixture.column(
        'segmented',
        'uint32',
        [77, 77, 77, 77, 77, 77],
        partition.input,
        options
      );
      fixture.graph.add([
        new GPUScan({id: 'scan', input, output, mode}),
        new GPUScan({id: 'segmented', input, output: segmented, mode, segmentFlags: flags})
      ]);
      const executable = fixture.graph.compile();
      try {
        for (let iteration = 0; iteration < 2; iteration++) {
          const encoder = device.createCommandEncoder();
          executable.encode(encoder, {parameters: undefined});
          device.submit(encoder.finish());
          expect(await fixture.read(output)).toEqual(
            mode === 'inclusive' ? [1, 3, 6, 10, 15, 21] : [0, 1, 3, 6, 10, 15]
          );
          expect(await fixture.read(segmented)).toEqual(
            mode === 'inclusive' ? [1, 3, 6, 4, 9, 6] : [0, 1, 3, 0, 4, 0]
          );
        }
      } finally {
        executable.destroy();
        fixture.destroy();
      }
    });
  }
}

for (const partition of BATCH_PARTITIONS) {
  for (const empty of [false, true]) {
    test(`MADD/dot batch contract: ${partition.name}, ${empty ? 'empty' : 'nonempty'}`, async () => {
      const device = await getWebGPUTestDevice();
      if (!device) return;
      const fixture = new BatchConformanceFixture(device);
      const {graph} = fixture;
      const lengths = empty ? partition.input.map(() => 0) : partition.input;
      const pairedLengths = empty ? partition.paired.map(() => 0) : partition.paired;
      const left = fixture.column('left', 'float32', empty ? [] : [1, 2, 3, 4, 5, 6], lengths, {
        atomic: 'atomic' in partition && partition.atomic
      });
      const right = fixture.column(
        'right',
        'float32',
        empty ? [] : [2, 3, 4, 5, 6, 7],
        pairedLengths
      );
      const output = fixture.column(
        'output',
        'float32',
        empty ? [] : [77, 77, 77, 77, 77, 77],
        empty ? [0] : [3, 3]
      );
      const scale = createGPUScalar(graph, 'scale', 'float32');
      const total = createGPUScalar(graph, 'total', 'float32');
      graph.add([
        new GPUScalarLiteral({output: scale, value: 2}),
        new GPUVectorScalarMADD({input: left, addend: right, output, scale}),
        new GPUDotProductScalar({left, right, output: total})
      ]);
      const readback = fixture.capture('total-readback', total.view);
      const executable = graph.compile();
      try {
        for (let iteration = 0; iteration < 2; iteration++) {
          const encoder = device.createCommandEncoder();
          executable.encode(encoder, {parameters: undefined});
          device.submit(encoder.finish());
          expect(await fixture.read(output)).toEqual(empty ? [] : [4, 7, 10, 13, 16, 19]);
          expect((await fixture.read(readback))[0]).toBeCloseTo(empty ? 0 : 112, 5);
        }
      } finally {
        executable.destroy();
        fixture.destroy();
      }
    });
  }
}

test('aligned histogram and group statistics preserve strided source columns', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const fixture = new BatchConformanceFixture(device);
  const values = fixture.column('values', 'float32', [1, 2, 3, 4, 5, 6], [2, 4], {
    stride: 3,
    atomic: false
  });
  const keys = fixture.column('keys', 'uint32', [0, 1, 0, 1, 0, 1], [1, 3, 2], {stride: 2});
  const mask = fixture.column('mask', 'uint32', [1, 0, 1, 1, 0, 1], [0, 3, 3]);
  const histogram = fixture.output('histogram', 'uint32', 3);
  const sums = fixture.output('sums', 'float32', 2);
  fixture.graph.add([
    new GPUHistogram({input: values, mask, output: histogram, domain: [0, 6]}),
    new GPUGroupAggregation({keys, values, mask, output: sums, operation: 'sum'})
  ]);
  const executable = fixture.graph.compile();
  try {
    const encoder = device.createCommandEncoder();
    executable.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    expect(await fixture.read(histogram)).toEqual([1, 1, 2]);
    expect(await fixture.read(sums)).toEqual([4, 10]);
  } finally {
    executable.destroy();
    fixture.destroy();
  }
});
