// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {NullDevice} from '@luma.gl/test-utils';
import {GPUScanUint64, GraphVectorView} from '@luma.gl/gpgpu/gpu-core';
import {BatchConformanceFixture} from './batch-conformance-utils';

test('uint64 scan validates every chunk, capacities, ownership, and writable aliases', () => {
  const device = new NullDevice({});
  Object.defineProperty(device, 'type', {value: 'webgpu'});
  Object.defineProperty(device.limits, 'maxComputeWorkgroupsPerDimension', {value: 65535});
  const fixture = new BatchConformanceFixture(device);
  const foreign = new BatchConformanceFixture(device);
  try {
    const props = {
      inputLow: fixture.column('low', 'uint32', [1, 2, 3], [1, 0, 2]),
      inputHigh: fixture.column('high', 'uint32', [0, 0, 0], [2, 1]),
      outputLow: fixture.column('low-result', 'uint32', Array(5).fill(77), [2, 3]),
      outputHigh: fixture.output('high-result', 'uint32', 5)
    };
    const strided = fixture.column('strided', 'uint32', [1, 2, 3], [1, 2], {stride: 2});
    for (const name of ['inputLow', 'inputHigh', 'outputLow', 'outputHigh'] as const) {
      expect(() => new GPUScanUint64({...props, [name]: strided})).toThrow(/packed/);
      expect(() =>
        new GPUScanUint64({...props, [name]: foreign.output(name, 'uint32', 3)}).getCommandNodes(
          fixture.graph
        )
      ).toThrow(/target graph/);
    }
    const short = fixture.output('short', 'uint32', 2);
    for (const name of ['inputHigh', 'outputLow', 'outputHigh'] as const) {
      expect(() => new GPUScanUint64({...props, [name]: short})).toThrow(/inputs must match/);
    }
    for (const outputLow of [props.inputLow, props.inputHigh, props.outputHigh]) {
      expect(() => new GPUScanUint64({...props, outputLow})).toThrow(/separate buffers/);
    }
    expect(() => new GPUScanUint64({...props, outputHigh: props.inputLow})).toThrow(
      /separate buffers/
    );
    if (!('data' in props.outputLow)) throw new Error('Expected vector fixture');
    const duplicate = new GraphVectorView({
      ...props.outputLow,
      length: 4,
      valueLength: 4,
      data: [props.outputLow.data[0], props.outputLow.data[0]]
    });
    expect(() => new GPUScanUint64({...props, outputLow: duplicate})).toThrow(/must not overlap/);
    const spareForeign = new GraphVectorView({
      ...props.outputLow,
      length: 6,
      valueLength: 6,
      data: [...props.outputLow.data, foreign.output('spare', 'uint32', 1)]
    });
    expect(() =>
      new GPUScanUint64({...props, outputLow: spareForeign}).getCommandNodes(fixture.graph)
    ).toThrow(/target graph/);
    const allocate = vi.spyOn(fixture.graph, 'createTransientBuffer');
    const nodes = new GPUScanUint64(props).getCommandNodes(fixture.graph);
    expect(new Set(nodes.map(node => node.id)).size).toBe(nodes.length);
    // High-word scratch follows its two source chunks rather than a full-length allocation.
    const adjusted = allocate.mock.calls
      .map(([options]) => options)
      .filter(options => options.id?.includes('adjusted-high'));
    expect(adjusted.map(options => options.byteLength)).toEqual([8, 4]);
    allocate.mockRestore();
  } finally {
    fixture.destroy();
    foreign.destroy();
    device.destroy();
  }
});
