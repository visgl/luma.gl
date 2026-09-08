// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph, type GraphDataView} from '@luma.gl/gpgpu/gpu-core';
import {
  GPURasterConnectedComponents,
  type GPURasterBufferBand,
  type GPURasterConnectivity
} from '@luma.gl/experimental/gpu-raster';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {expect, it} from 'vitest';

type ComponentFixture = {
  id: string;
  width: number;
  height: number;
  values: readonly number[];
  validity?: readonly number[];
  noDataValue?: number;
  connectivity?: GPURasterConnectivity;
  maximumIterations?: number;
};

type GuardedBuffer = {
  buffer: Buffer;
  length: number;
  prefixLength: number;
};

type ComponentExecution = {
  graph: GPUCommandGraph;
  compiled: ReturnType<GPUCommandGraph['compile']>;
  source: GuardedBuffer;
  sourceValidity?: GuardedBuffer;
  output: GuardedBuffer;
  outputValidity: GuardedBuffer;
  converged: GuardedBuffer;
  iterationCount: GuardedBuffer;
  owned: GuardedBuffer[];
};

const GUARD_VALUE = 4000000001;

it('GPURaster component roots distinguish valid background, independent nodata, and empty islands', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const fixtures: Array<{
    fixture: ComponentFixture;
    labels: number[];
    validity: number[];
    rounds: number;
  }> = [
    {
      fixture: {
        id: 'empty-observations',
        width: 3,
        height: 2,
        values: [0, 0, 0, 0, 0, 0],
        validity: [1, 0, 1, 1, 1, 0],
        maximumIterations: 12
      },
      labels: [0, 0, 0, 0, 0, 0],
      validity: [1, 0, 1, 1, 1, 0],
      rounds: 1
    },
    {
      fixture: {
        id: 'isolated-noncanonical-foreground',
        width: 5,
        height: 1,
        values: [0, 7, 0, 4294967294, 0],
        maximumIterations: 9
      },
      labels: [0, 2, 0, 4, 0],
      validity: [1, 1, 1, 1, 1],
      rounds: 1
    },
    {
      fixture: {
        id: 'exact-unsigned-nodata',
        width: 4,
        height: 1,
        values: [4294967295, 5, 0, 4294967295],
        validity: [1, 1, 1, 0],
        noDataValue: 4294967295,
        maximumIterations: 7
      },
      labels: [0, 2, 0, 0],
      validity: [0, 1, 1, 0],
      rounds: 1
    }
  ];

  for (const {fixture, labels, validity, rounds} of fixtures) {
    const execution = makeExecution(device, fixture);
    submitGraph(device, execution.compiled, `${fixture.id}-submit`);
    expect(
      await readLogical(execution.output),
      `${fixture.id} retains sparse one-based root identity and zero background`
    ).toEqual(labels);
    expect(
      await readLogical(execution.outputValidity),
      `${fixture.id} separates real zero observations from missing/nodata samples`
    ).toEqual(validity);
    expect((await readLogical(execution.converged))[0], `${fixture.id} converges`).toBe(1);
    expect(
      (await readLogical(execution.iterationCount))[0],
      `${fixture.id} publishes only active rounds after indirect no-work gating`
    ).toBe(rounds);
    await assertGuards(execution.output, `${fixture.id} output labels`);
    await assertGuards(execution.outputValidity, `${fixture.id} output validity`);
    destroyExecution(execution);
  }

  void 0;
});

it('GPURaster component rounds converge deterministically across winding workgroups and nodata barriers', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const width = 19;
  const height = 17;
  const values: number[] = [];
  const validity: number[] = [];
  for (let row = 0; row < height; row++) {
    for (let column = 0; column < width; column++) {
      const connected = row % 2 === 0 || column === (Math.floor(row / 2) % 2 === 0 ? width - 1 : 0);
      values.push(connected ? 9 : 0);
      validity.push(1);
    }
  }
  const barrierRow = 5;
  const barrierColumn = width - 1;
  validity[barrierRow * width + barrierColumn] = 0;
  const fixture: ComponentFixture = {
    id: 'winding-cross-workgroup-components',
    width,
    height,
    values,
    validity,
    connectivity: 4,
    maximumIterations: 32
  };
  const execution = makeExecution(device, fixture);
  submitGraph(device, execution.compiled, 'submit-winding-components');
  const expected = makeReferenceLabels(fixture);
  const labels = await readLogical(execution.output);

  expect(
    labels,
    'minimum-root atomic hooking and bounded path compression match a winding CPU flood fill'
  ).toEqual(expected.labels);
  expect(
    await readLogical(execution.outputValidity),
    'a missing connector prevents two physically adjacent snake regions from joining'
  ).toEqual(expected.validity);
  expect((await readLogical(execution.converged))[0], 'all bounded rounds converge').toBe(1);
  expect(
    Boolean((await readLogical(execution.iterationCount))[0]! <= 32),
    'actual convergence work never exceeds its explicit round budget'
  ).toBe(true);
  expect(
    new Set(labels.filter(label => label !== 0)).size,
    'one missing connector deterministically divides the long component in two'
  ).toBe(2);
  expect(
    labels[barrierRow * width + barrierColumn],
    'a nodata connector never publishes a foreground root'
  ).toBe(0);
  await assertGuards(execution.converged, 'caller-owned convergence state');
  await assertGuards(execution.iterationCount, 'caller-owned round count');
  destroyExecution(execution);
  void 0;
});

it('GPURaster insufficient rounds invalidate every pixel and graph reuse resets convergence exactly', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const insufficient = makeExecution(device, {
    id: 'insufficient-component-rounds',
    width: 3,
    height: 1,
    values: [1, 1, 0],
    validity: [1, 1, 1],
    maximumIterations: 1
  });
  submitGraph(device, insufficient.compiled, 'submit-insufficient-components');
  expect(
    await readLogical(insufficient.output),
    'partial union-find roots never escape when stabilization was not reached'
  ).toEqual([0, 0, 0]);
  expect(
    await readLogical(insufficient.outputValidity),
    'even valid background is withheld until the complete component result is safe'
  ).toEqual([0, 0, 0]);
  expect((await readLogical(insufficient.converged))[0], 'insufficient budget is explicit').toBe(0);
  expect((await readLogical(insufficient.iterationCount))[0], 'exactly one active round ran').toBe(
    1
  );
  await assertGuards(insufficient.output, 'invalidated sparse labels');
  await assertGuards(insufficient.outputValidity, 'invalidated observation validity');

  writeLogical(insufficient.source, [0, 0, 0]);
  submitGraph(device, insufficient.compiled, 'reencode-converged-empty-components');
  expect(
    await readLogical(insufficient.output),
    'reused graph publishes clean background after replacing the caller-owned source'
  ).toEqual([0, 0, 0]);
  expect(
    await readLogical(insufficient.outputValidity),
    're-encoding restores observation validity after an earlier nonconverged execution'
  ).toEqual([1, 1, 1]);
  expect((await readLogical(insufficient.converged))[0], 'graph reuse resets convergence').toBe(1);
  expect((await readLogical(insufficient.iterationCount))[0], 'active round counters reset').toBe(
    1
  );

  writeLogical(insufficient.source, [1, 1, 0]);
  submitGraph(device, insufficient.compiled, 'reencode-nonconverged-components');
  expect(
    (await readLogical(insufficient.converged))[0],
    'later difficult inputs cannot inherit a previous successful convergence flag'
  ).toBe(0);
  expect(
    await readLogical(insufficient.outputValidity),
    'later nonconvergence clears every previously valid output'
  ).toEqual([0, 0, 0]);
  destroyExecution(insufficient);

  const stabilized = makeExecution(device, {
    id: 'exact-component-stabilization',
    width: 2,
    height: 1,
    values: [7, 9],
    maximumIterations: 2
  });
  submitGraph(device, stabilized.compiled, 'submit-exact-component-stabilization');
  expect(
    await readLogical(stabilized.output),
    'one change round plus one clean stabilization round publishes the exact minimum root'
  ).toEqual([1, 1]);
  expect((await readLogical(stabilized.converged))[0], 'exact two-round budget succeeds').toBe(1);
  expect(
    (await readLogical(stabilized.iterationCount))[0],
    'stabilization contributes one actual active round'
  ).toBe(2);
  destroyExecution(stabilized);
  void 0;
});

function makeExecution(device: Device, fixture: ComponentFixture): ComponentExecution {
  const graph = new GPUCommandGraph(device, {id: fixture.id});
  const owned: GuardedBuffer[] = [];
  const pixelCount = fixture.width * fixture.height;
  const source = makeGuardedBuffer(device, owned, `${fixture.id}-source`, pixelCount, 2);
  writeLogical(source, fixture.values);
  const sourceValidity = fixture.validity
    ? makeGuardedBuffer(device, owned, `${fixture.id}-source-validity`, pixelCount, 3)
    : undefined;
  if (sourceValidity && fixture.validity) writeLogical(sourceValidity, fixture.validity);
  const output = makeGuardedBuffer(device, owned, `${fixture.id}-labels`, pixelCount, 1);
  const outputValidity = makeGuardedBuffer(
    device,
    owned,
    `${fixture.id}-output-validity`,
    pixelCount,
    2
  );
  const converged = makeGuardedBuffer(device, owned, `${fixture.id}-convergence`, 1, 3);
  const iterationCount = makeGuardedBuffer(device, owned, `${fixture.id}-rounds`, 1, 1);
  const input: GPURasterBufferBand<'uint32'> = {
    id: `${fixture.id}-foreground`,
    format: 'uint32',
    storage: {kind: 'buffer', values: importView(graph, source)},
    ...(sourceValidity ? {validity: importView(graph, sourceValidity)} : {}),
    ...(fixture.noDataValue !== undefined ? {noDataValue: fixture.noDataValue} : {})
  };

  new GPURasterConnectedComponents({
    id: fixture.id,
    width: fixture.width,
    height: fixture.height,
    input,
    output: importView(graph, output),
    outputValidity: importView(graph, outputValidity),
    converged: importView(graph, converged),
    iterationCount: importView(graph, iterationCount),
    ...(fixture.connectivity ? {connectivity: fixture.connectivity} : {}),
    ...(fixture.maximumIterations ? {maximumIterations: fixture.maximumIterations} : {})
  }).addToGraph(graph);
  const compiled = graph.compile();
  return {
    graph,
    compiled,
    source,
    sourceValidity,
    output,
    outputValidity,
    converged,
    iterationCount,
    owned
  };
}

function makeReferenceLabels(fixture: ComponentFixture): {labels: number[]; validity: number[]} {
  const labels = Array.from({length: fixture.values.length}, () => 0);
  const validity = fixture.values.map((value, index) =>
    Number((fixture.validity?.[index] ?? 1) !== 0 && value !== fixture.noDataValue)
  );
  const visited = new Set<number>();
  const offsets =
    fixture.connectivity === 8
      ? [
          [-1, -1],
          [0, -1],
          [1, -1],
          [-1, 0],
          [1, 0],
          [-1, 1],
          [0, 1],
          [1, 1]
        ]
      : [
          [0, -1],
          [-1, 0],
          [1, 0],
          [0, 1]
        ];
  for (let pixelIndex = 0; pixelIndex < fixture.values.length; pixelIndex++) {
    if (visited.has(pixelIndex) || !validity[pixelIndex] || fixture.values[pixelIndex] === 0) {
      continue;
    }
    const members: number[] = [];
    const pending = [pixelIndex];
    visited.add(pixelIndex);
    while (pending.length > 0) {
      const current = pending.pop()!;
      members.push(current);
      const column = current % fixture.width;
      const row = Math.floor(current / fixture.width);
      for (const [horizontalOffset, verticalOffset] of offsets) {
        const neighborColumn = column + horizontalOffset!;
        const neighborRow = row + verticalOffset!;
        if (
          neighborColumn < 0 ||
          neighborColumn >= fixture.width ||
          neighborRow < 0 ||
          neighborRow >= fixture.height
        ) {
          continue;
        }
        const neighborIndex = neighborRow * fixture.width + neighborColumn;
        if (
          visited.has(neighborIndex) ||
          !validity[neighborIndex] ||
          fixture.values[neighborIndex] === 0
        ) {
          continue;
        }
        visited.add(neighborIndex);
        pending.push(neighborIndex);
      }
    }
    const minimumRoot = Math.min(...members) + 1;
    for (const member of members) labels[member] = minimumRoot;
  }
  return {labels, validity};
}

function makeGuardedBuffer(
  device: Device,
  owned: GuardedBuffer[],
  id: string,
  length: number,
  prefixLength: number
): GuardedBuffer {
  const values = new Uint32Array(prefixLength + length + 1).fill(GUARD_VALUE);
  const entry = {
    buffer: device.createBuffer({
      id,
      data: values,
      usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
    }),
    length,
    prefixLength
  };
  owned.push(entry);
  return entry;
}

function importView(graph: GPUCommandGraph, entry: GuardedBuffer): GraphDataView<'uint32'> {
  const handle = graph.importBuffer(
    {id: entry.buffer.id, byteLength: entry.buffer.byteLength, usage: entry.buffer.usage},
    entry.buffer
  );
  return graph.createDataView(handle, {
    format: 'uint32',
    length: entry.length,
    byteOffset: entry.prefixLength * Uint32Array.BYTES_PER_ELEMENT
  });
}

function writeLogical(entry: GuardedBuffer, values: readonly number[]): void {
  const complete = new Uint32Array(entry.prefixLength + entry.length + 1).fill(GUARD_VALUE);
  complete.set(values, entry.prefixLength);
  entry.buffer.write(complete);
}

async function readGuarded(entry: GuardedBuffer): Promise<number[]> {
  const bytes = await entry.buffer.readAsync();
  return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4));
}

async function readLogical(entry: GuardedBuffer): Promise<number[]> {
  return (await readGuarded(entry)).slice(entry.prefixLength, entry.prefixLength + entry.length);
}

async function assertGuards(entry: GuardedBuffer, label: string): Promise<void> {
  const values = await readGuarded(entry);
  expect(
    values.slice(0, entry.prefixLength),
    `${label} preserves every offset-backed prefix guard`
  ).toEqual(Array.from({length: entry.prefixLength}, () => GUARD_VALUE));
  expect(values.at(-1), `${label} preserves its caller-owned suffix guard`).toBe(GUARD_VALUE);
}

function submitGraph(
  device: Device,
  compiled: ReturnType<GPUCommandGraph['compile']>,
  id: string
): void {
  const encoder = device.createCommandEncoder({id});
  compiled.encode(encoder, {parameters: undefined});
  device.submit(encoder.finish());
}

function destroyExecution(execution: ComponentExecution): void {
  execution.compiled.destroy();
  for (const {buffer} of execution.owned) {
    expect(
      Boolean(buffer.destroyed),
      'component graph destruction does not destroy borrowed storage'
    ).toBe(false);
    buffer.destroy();
  }
}
