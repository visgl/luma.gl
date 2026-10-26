// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {GPUVectorScalarMADD} from '../../src/gpu-core/gpu-elementwise-scalar';
import {GPUDotProductScalar} from '../../src/gpu-core/gpu-dot-product-scalar';
import {GPUScalarDispatchGate} from '../../src/gpu-core/gpu-scalar-dispatch-gate';
import {GPUScalarLiteral} from '../../src/gpu-core/gpu-scalar-literal';
import {createGPUScalar} from '../../src/gpu-core/gpu-scalar';
import {BatchConformanceFixture} from './batch-conformance-utils';

for (const profile of ['core', 'max'] as const) {
  test(`hierarchical dot uses bounded per-level gates (${profile})`, async () => {
    const device = await getWebGPUTestDevice(profile);
    if (!device) return;
    const fixture = new BatchConformanceFixture(device);
    const length = 65537;
    const values = Array.from({length}, (_, index) => (index % 7) - 3);
    const input = fixture.column('input', 'float32', values, [length], {atomic: true});
    const active = createGPUScalar(fixture.graph, 'active', 'uint32');
    const output = createGPUScalar(fixture.graph, 'dot', 'float32');
    const gate = new GPUScalarDispatchGate(fixture.graph, {
      id: 'dot-gate',
      active,
      workgroups: [1, 1, 1]
    });
    const limits = device.limits;
    const descriptor = Object.getOwnPropertyDescriptor(device, 'limits');
    Object.defineProperty(device, 'limits', {
      configurable: true,
      value: new Proxy(limits, {
        get(target, property) {
          return property === 'maxComputeWorkgroupsPerDimension'
            ? 8
            : Reflect.get(target, property, target);
        }
      })
    });
    try {
      fixture.graph.add([
        new GPUScalarLiteral({id: 'disable', output: active, value: 0}),
        new GPUScalarLiteral({id: 'sentinel', output, value: 37}),
        new GPUDotProductScalar({id: 'disabled-dot', left: input, right: input, output, gate})
      ]);
      const disabled = fixture.capture('disabled', output.view);
      fixture.graph.add([
        new GPUScalarLiteral({id: 'enable', output: active, value: 1}),
        new GPUDotProductScalar({id: 'enabled-dot', left: input, right: input, output, gate})
      ]);
      const enabled = fixture.capture('enabled', output.view);
      const compiled = fixture.graph.compile();
      try {
        for (let run = 0; run < 2; run++) {
          const encoder = device.createCommandEncoder();
          compiled.encode(encoder, {parameters: undefined});
          device.submit(encoder.finish());
          expect(await fixture.read(disabled)).toEqual([37]);
          expect(await fixture.read(enabled)).toEqual([
            values.reduce((sum, value) => sum + value * value, 0)
          ]);
        }
      } finally {
        compiled.destroy();
      }
    } finally {
      if (descriptor) Object.defineProperty(device, 'limits', descriptor);
      else Reflect.deleteProperty(device, 'limits');
      fixture.destroy();
    }
  });
}

test('explicit MADD gate covers every chunk with its own workgroup count', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const fixture = new BatchConformanceFixture(device);
  const length = 1025;
  const input = fixture.column('input', 'float32', Array(length).fill(2), [3, 0, 1022]);
  const output = fixture.column('output', 'float32', Array(length).fill(77), [0, 514, 511]);
  const active = createGPUScalar(fixture.graph, 'active', 'uint32');
  const scale = createGPUScalar(fixture.graph, 'scale', 'float32');
  const gate = new GPUScalarDispatchGate(fixture.graph, {
    id: 'gate',
    active,
    workgroups: [1, 1, 1]
  });
  fixture.graph.add([
    new GPUScalarLiteral({output: active, value: 1}),
    new GPUScalarLiteral({output: scale, value: 2}),
    new GPUVectorScalarMADD({id: 'enabled', input, addend: input, output, scale, gate}),
    new GPUScalarLiteral({id: 'disable', output: active, value: 0}),
    new GPUVectorScalarMADD({id: 'disabled', input: output, addend: output, output, scale, gate})
  ]);
  const compiled = fixture.graph.compile();
  try {
    const encoder = device.createCommandEncoder();
    compiled.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    expect(await fixture.read(output)).toEqual(Array(length).fill(6));
  } finally {
    compiled.destroy();
    fixture.destroy();
  }
});
