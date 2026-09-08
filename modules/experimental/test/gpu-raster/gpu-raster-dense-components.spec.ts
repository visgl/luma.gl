// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph, type GraphDataView} from '@luma.gl/gpgpu/gpu-core';
import {GPURasterDenseComponents} from '@luma.gl/experimental/gpu-raster';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {expect, it} from 'vitest';

type DenseFixture = {
  id: string;
  width: number;
  height: number;
  labels: readonly number[];
  validity: readonly number[];
  converged?: number;
  capacity?: number;
  includeRequiredCount?: boolean;
};

type GuardedBuffer = {
  buffer: Buffer;
  length: number;
  prefixLength: number;
};

type DenseExecution = {
  graph: GPUCommandGraph;
  compiled: ReturnType<GPUCommandGraph['compile']>;
  input: GuardedBuffer;
  inputValidity: GuardedBuffer;
  converged: GuardedBuffer;
  output: GuardedBuffer;
  outputValidity: GuardedBuffer;
  componentCount: GuardedBuffer;
  overflow: GuardedBuffer;
  requiredComponentCount?: GuardedBuffer;
  owned: GuardedBuffer[];
};

const GUARD_VALUE = 4000000001;

it('GPURaster dense representatives preserve real background and reject exact malformed unsigned roots', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const valid = makeExecution(device, {
    id: 'stable-dense-root-order',
    width: 3,
    height: 3,
    labels: [1, 1, 0, 4, 0, 4, 7, 0, 9],
    validity: [1, 1, 1, 1, 0, 1, 1, 1, 1]
  });
  submitGraph(device, valid.compiled, 'submit-stable-dense-root-order');
  expect(
    await readLogical(valid.output),
    'minimum sparse roots map to stable contiguous identifiers in row-major representative order'
  ).toEqual([1, 1, 0, 2, 0, 2, 3, 0, 4]);
  expect(
    await readLogical(valid.outputValidity),
    'valid zero background stays distinguishable from independently missing observations'
  ).toEqual([1, 1, 1, 1, 0, 1, 1, 1, 1]);
  expect(
    (await readLogical(valid.componentCount))[0],
    'exact root count fits default capacity'
  ).toBe(4);
  expect((await readLogical(valid.overflow))[0], 'full-capacity execution does not overflow').toBe(
    0
  );
  expect(
    (await readLogical(valid.requiredComponentCount!))[0],
    'optional unclamped total is exact'
  ).toBe(4);
  await assertAllGuards(valid, 'stable dense root order');
  destroyExecution(valid);

  const malformed = makeExecution(device, {
    id: 'malformed-exact-unsigned-roots',
    width: 8,
    height: 1,
    labels: [1, 4294967295, 4, 0, 5, 7, 7, 9],
    validity: [1, 1, 1, 1, 0, 1, 1, 1],
    includeRequiredCount: false
  });
  submitGraph(device, malformed.compiled, 'submit-malformed-exact-unsigned-roots');
  expect(
    await readLogical(malformed.output),
    'maximum uint32, out-of-range roots, and references to nonrepresentative slots fail closed'
  ).toEqual([1, 0, 0, 0, 0, 2, 2, 0]);
  expect(
    await readLogical(malformed.outputValidity),
    'invalid sparse references never alias an earlier prefix while genuine background remains valid'
  ).toEqual([1, 0, 0, 1, 0, 1, 1, 0]);
  expect((await readLogical(malformed.componentCount))[0], 'only valid canonical roots count').toBe(
    2
  );
  expect(
    (await readLogical(malformed.overflow))[0],
    'malformed observations do not inflate overflow'
  ).toBe(0);
  await assertAllGuards(malformed, 'malformed root validation');
  destroyExecution(malformed);
  void 0;
});

it('GPURaster hierarchical dense scans clamp maximal checkerboards at zero, partial, and full capacities', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const width = 17;
  const height = 17;
  const labels: number[] = [];
  const validity: number[] = [];
  for (let row = 0; row < height; row++) {
    for (let column = 0; column < width; column++) {
      const pixelIndex = row * width + column;
      labels.push((row + column) % 2 === 0 ? pixelIndex + 1 : 0);
      validity.push(pixelIndex === 0 || pixelIndex === 1 ? 0 : 1);
    }
  }
  const canonicalRoots = labels.filter((label, pixelIndex) =>
    Boolean(validity[pixelIndex] && label === pixelIndex + 1)
  );

  for (const capacity of [0, 3, canonicalRoots.length]) {
    const execution = makeExecution(device, {
      id: `hierarchical-dense-capacity-${capacity}`,
      width,
      height,
      labels,
      validity,
      capacity
    });
    submitGraph(device, execution.compiled, `submit-hierarchical-dense-capacity-${capacity}`);
    const expectedLabels: number[] = [];
    const expectedValidity: number[] = [];
    let requiredCount = 0;
    for (let pixelIndex = 0; pixelIndex < labels.length; pixelIndex++) {
      if (!validity[pixelIndex]) {
        expectedLabels.push(0);
        expectedValidity.push(0);
      } else if (labels[pixelIndex] === 0) {
        expectedLabels.push(0);
        expectedValidity.push(1);
      } else {
        requiredCount++;
        const accepted = requiredCount <= capacity;
        expectedLabels.push(accepted ? requiredCount : 0);
        expectedValidity.push(accepted ? 1 : 0);
      }
    }
    expect(
      await readLogical(execution.output),
      `capacity ${capacity} publishes only deterministic identifiers that fit compact output bounds`
    ).toEqual(expectedLabels);
    expect(
      await readLogical(execution.outputValidity),
      `capacity ${capacity} invalidates truncated foreground without hiding valid background`
    ).toEqual(expectedValidity);
    expect(
      (await readLogical(execution.componentCount))[0],
      `capacity ${capacity} publishes the bounded compact component count`
    ).toBe(Math.min(canonicalRoots.length, capacity));
    expect(
      (await readLogical(execution.overflow))[0],
      `capacity ${capacity} publishes explicit per-execution overflow`
    ).toBe(Number(canonicalRoots.length > capacity));
    expect(
      (await readLogical(execution.requiredComponentCount!))[0],
      `capacity ${capacity} preserves the unclamped exact root count across scan block boundaries`
    ).toBe(canonicalRoots.length);
    await assertAllGuards(execution, `hierarchical dense capacity ${capacity}`);
    destroyExecution(execution);
  }

  void 0;
});

it('GPURaster dense graph replay clears convergence failures and resets count, overflow, validity, and roots', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const execution = makeExecution(device, {
    id: 'replayed-dense-convergence',
    width: 6,
    height: 1,
    labels: [1, 0, 3, 3, 5, 0],
    validity: [1, 1, 1, 1, 1, 1],
    capacity: 2
  });
  submitGraph(device, execution.compiled, 'submit-initial-dense-overflow');
  expect(await readLogical(execution.output), 'initial labels are capacity-bounded').toEqual([
    1, 0, 2, 2, 0, 0
  ]);
  expect(
    await readLogical(execution.outputValidity),
    'only over-capacity foreground is withheld during successful convergence'
  ).toEqual([1, 1, 1, 1, 0, 1]);
  expect((await readLogical(execution.componentCount))[0], 'initial compact count is clamped').toBe(
    2
  );
  expect(
    (await readLogical(execution.overflow))[0],
    'initial execution flags capacity overflow'
  ).toBe(1);
  expect(
    (await readLogical(execution.requiredComponentCount!))[0],
    'initial exact total is retained'
  ).toBe(3);

  writeLogical(execution.converged, [0]);
  submitGraph(device, execution.compiled, 'reencode-unconverged-dense-components');
  expect(
    await readLogical(execution.output),
    'nonconvergence clears every previously published label'
  ).toEqual([0, 0, 0, 0, 0, 0]);
  expect(
    await readLogical(execution.outputValidity),
    'nonconvergence also withholds otherwise valid background'
  ).toEqual([0, 0, 0, 0, 0, 0]);
  expect(
    (await readLogical(execution.componentCount))[0],
    'nonconvergence clears the bounded count'
  ).toBe(0);
  expect((await readLogical(execution.overflow))[0], 'nonconvergence clears stale overflow').toBe(
    0
  );
  expect(
    (await readLogical(execution.requiredComponentCount!))[0],
    'nonconvergence clears the optional unclamped total'
  ).toBe(0);

  writeLogical(execution.input, [0, 2, 0, 4, 4, 0]);
  writeLogical(execution.inputValidity, [1, 1, 0, 1, 1, 1]);
  writeLogical(execution.converged, [1]);
  submitGraph(device, execution.compiled, 'reencode-recovered-dense-components');
  expect(
    await readLogical(execution.output),
    'replay rebuilds canonical representatives and ranks from the replacement source'
  ).toEqual([0, 1, 0, 2, 2, 0]);
  expect(
    await readLogical(execution.outputValidity),
    'recovery preserves new masks and genuine background'
  ).toEqual([1, 1, 0, 1, 1, 1]);
  expect(
    (await readLogical(execution.componentCount))[0],
    'recovery reports the replacement count'
  ).toBe(2);
  expect(
    (await readLogical(execution.overflow))[0],
    'overflow is per-execution and never sticky'
  ).toBe(0);
  expect(
    (await readLogical(execution.requiredComponentCount!))[0],
    'replacement exact totals never inherit prior roots'
  ).toBe(2);
  await assertAllGuards(execution, 'convergence-safe dense replay');
  destroyExecution(execution);
  void 0;
});

function makeExecution(device: Device, fixture: DenseFixture): DenseExecution {
  const graph = new GPUCommandGraph(device, {id: fixture.id});
  const owned: GuardedBuffer[] = [];
  const pixelCount = fixture.width * fixture.height;
  const input = makeGuardedBuffer(device, owned, `${fixture.id}-sparse`, pixelCount, 2);
  const inputValidity = makeGuardedBuffer(
    device,
    owned,
    `${fixture.id}-sparse-validity`,
    pixelCount,
    3
  );
  const converged = makeGuardedBuffer(device, owned, `${fixture.id}-converged`, 1, 2);
  const output = makeGuardedBuffer(device, owned, `${fixture.id}-dense`, pixelCount, 1);
  const outputValidity = makeGuardedBuffer(
    device,
    owned,
    `${fixture.id}-dense-validity`,
    pixelCount,
    3
  );
  const componentCount = makeGuardedBuffer(device, owned, `${fixture.id}-component-count`, 1, 1);
  const overflow = makeGuardedBuffer(device, owned, `${fixture.id}-overflow`, 1, 3);
  const requiredComponentCount =
    fixture.includeRequiredCount !== false
      ? makeGuardedBuffer(device, owned, `${fixture.id}-required-count`, 1, 2)
      : undefined;
  writeLogical(input, fixture.labels);
  writeLogical(inputValidity, fixture.validity);
  writeLogical(converged, [fixture.converged ?? 1]);

  new GPURasterDenseComponents({
    id: fixture.id,
    width: fixture.width,
    height: fixture.height,
    input: importView(graph, input),
    inputValidity: importView(graph, inputValidity),
    converged: importView(graph, converged),
    output: importView(graph, output),
    outputValidity: importView(graph, outputValidity),
    componentCount: importView(graph, componentCount),
    overflow: importView(graph, overflow),
    ...(requiredComponentCount
      ? {requiredComponentCount: importView(graph, requiredComponentCount)}
      : {}),
    ...(fixture.capacity !== undefined ? {capacity: fixture.capacity} : {})
  }).addToGraph(graph);

  return {
    graph,
    compiled: graph.compile(),
    input,
    inputValidity,
    converged,
    output,
    outputValidity,
    componentCount,
    overflow,
    requiredComponentCount,
    owned
  };
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

async function assertAllGuards(execution: DenseExecution, label: string): Promise<void> {
  for (const entry of execution.owned) {
    const values = await readGuarded(entry);
    expect(
      values.slice(0, entry.prefixLength),
      `${label}: ${entry.buffer.id} preserves its caller-owned offset prefix`
    ).toEqual(Array.from({length: entry.prefixLength}, () => GUARD_VALUE));
    expect(values.at(-1), `${label}: ${entry.buffer.id} preserves its caller-owned suffix`).toBe(
      GUARD_VALUE
    );
  }
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

function destroyExecution(execution: DenseExecution): void {
  execution.compiled.destroy();
  for (const {buffer} of execution.owned) {
    expect(
      Boolean(buffer.destroyed),
      'dense graph destruction never destroys borrowed GPU storage'
    ).toBe(false);
    buffer.destroy();
  }
}
