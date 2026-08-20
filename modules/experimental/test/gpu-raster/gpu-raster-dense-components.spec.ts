// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph, type GraphDataView} from '@luma.gl/experimental';
import {GPURasterDenseComponents} from '@luma.gl/experimental/gpu-raster';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import test, {type Test} from '../../../../test/utils/vitest-tape';

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

test('GPURaster dense representatives preserve real background and reject exact malformed unsigned roots', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
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
  testCase.deepEqual(
    await readLogical(valid.output),
    [1, 1, 0, 2, 0, 2, 3, 0, 4],
    'minimum sparse roots map to stable contiguous identifiers in row-major representative order'
  );
  testCase.deepEqual(
    await readLogical(valid.outputValidity),
    [1, 1, 1, 1, 0, 1, 1, 1, 1],
    'valid zero background stays distinguishable from independently missing observations'
  );
  testCase.equal(
    (await readLogical(valid.componentCount))[0],
    4,
    'exact root count fits default capacity'
  );
  testCase.equal(
    (await readLogical(valid.overflow))[0],
    0,
    'full-capacity execution does not overflow'
  );
  testCase.equal(
    (await readLogical(valid.requiredComponentCount!))[0],
    4,
    'optional unclamped total is exact'
  );
  await assertAllGuards(testCase, valid, 'stable dense root order');
  destroyExecution(testCase, valid);

  const malformed = makeExecution(device, {
    id: 'malformed-exact-unsigned-roots',
    width: 8,
    height: 1,
    labels: [1, 4294967295, 4, 0, 5, 7, 7, 9],
    validity: [1, 1, 1, 1, 0, 1, 1, 1],
    includeRequiredCount: false
  });
  submitGraph(device, malformed.compiled, 'submit-malformed-exact-unsigned-roots');
  testCase.deepEqual(
    await readLogical(malformed.output),
    [1, 0, 0, 0, 0, 2, 2, 0],
    'maximum uint32, out-of-range roots, and references to nonrepresentative slots fail closed'
  );
  testCase.deepEqual(
    await readLogical(malformed.outputValidity),
    [1, 0, 0, 1, 0, 1, 1, 0],
    'invalid sparse references never alias an earlier prefix while genuine background remains valid'
  );
  testCase.equal(
    (await readLogical(malformed.componentCount))[0],
    2,
    'only valid canonical roots count'
  );
  testCase.equal(
    (await readLogical(malformed.overflow))[0],
    0,
    'malformed observations do not inflate overflow'
  );
  await assertAllGuards(testCase, malformed, 'malformed root validation');
  destroyExecution(testCase, malformed);
  testCase.end();
});

test('GPURaster hierarchical dense scans clamp maximal checkerboards at zero, partial, and full capacities', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
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
    testCase.deepEqual(
      await readLogical(execution.output),
      expectedLabels,
      `capacity ${capacity} publishes only deterministic identifiers that fit compact output bounds`
    );
    testCase.deepEqual(
      await readLogical(execution.outputValidity),
      expectedValidity,
      `capacity ${capacity} invalidates truncated foreground without hiding valid background`
    );
    testCase.equal(
      (await readLogical(execution.componentCount))[0],
      Math.min(canonicalRoots.length, capacity),
      `capacity ${capacity} publishes the bounded compact component count`
    );
    testCase.equal(
      (await readLogical(execution.overflow))[0],
      Number(canonicalRoots.length > capacity),
      `capacity ${capacity} publishes explicit per-execution overflow`
    );
    testCase.equal(
      (await readLogical(execution.requiredComponentCount!))[0],
      canonicalRoots.length,
      `capacity ${capacity} preserves the unclamped exact root count across scan block boundaries`
    );
    await assertAllGuards(testCase, execution, `hierarchical dense capacity ${capacity}`);
    destroyExecution(testCase, execution);
  }

  testCase.end();
});

test('GPURaster dense graph replay clears convergence failures and resets count, overflow, validity, and roots', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
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
  testCase.deepEqual(
    await readLogical(execution.output),
    [1, 0, 2, 2, 0, 0],
    'initial labels are capacity-bounded'
  );
  testCase.deepEqual(
    await readLogical(execution.outputValidity),
    [1, 1, 1, 1, 0, 1],
    'only over-capacity foreground is withheld during successful convergence'
  );
  testCase.equal(
    (await readLogical(execution.componentCount))[0],
    2,
    'initial compact count is clamped'
  );
  testCase.equal(
    (await readLogical(execution.overflow))[0],
    1,
    'initial execution flags capacity overflow'
  );
  testCase.equal(
    (await readLogical(execution.requiredComponentCount!))[0],
    3,
    'initial exact total is retained'
  );

  writeLogical(execution.converged, [0]);
  submitGraph(device, execution.compiled, 'reencode-unconverged-dense-components');
  testCase.deepEqual(
    await readLogical(execution.output),
    [0, 0, 0, 0, 0, 0],
    'nonconvergence clears every previously published label'
  );
  testCase.deepEqual(
    await readLogical(execution.outputValidity),
    [0, 0, 0, 0, 0, 0],
    'nonconvergence also withholds otherwise valid background'
  );
  testCase.equal(
    (await readLogical(execution.componentCount))[0],
    0,
    'nonconvergence clears the bounded count'
  );
  testCase.equal(
    (await readLogical(execution.overflow))[0],
    0,
    'nonconvergence clears stale overflow'
  );
  testCase.equal(
    (await readLogical(execution.requiredComponentCount!))[0],
    0,
    'nonconvergence clears the optional unclamped total'
  );

  writeLogical(execution.input, [0, 2, 0, 4, 4, 0]);
  writeLogical(execution.inputValidity, [1, 1, 0, 1, 1, 1]);
  writeLogical(execution.converged, [1]);
  submitGraph(device, execution.compiled, 'reencode-recovered-dense-components');
  testCase.deepEqual(
    await readLogical(execution.output),
    [0, 1, 0, 2, 2, 0],
    'replay rebuilds canonical representatives and ranks from the replacement source'
  );
  testCase.deepEqual(
    await readLogical(execution.outputValidity),
    [1, 1, 0, 1, 1, 1],
    'recovery preserves new masks and genuine background'
  );
  testCase.equal(
    (await readLogical(execution.componentCount))[0],
    2,
    'recovery reports the replacement count'
  );
  testCase.equal(
    (await readLogical(execution.overflow))[0],
    0,
    'overflow is per-execution and never sticky'
  );
  testCase.equal(
    (await readLogical(execution.requiredComponentCount!))[0],
    2,
    'replacement exact totals never inherit prior roots'
  );
  await assertAllGuards(testCase, execution, 'convergence-safe dense replay');
  destroyExecution(testCase, execution);
  testCase.end();
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

async function assertAllGuards(
  testCase: Test,
  execution: DenseExecution,
  label: string
): Promise<void> {
  for (const entry of execution.owned) {
    const values = await readGuarded(entry);
    testCase.deepEqual(
      values.slice(0, entry.prefixLength),
      Array.from({length: entry.prefixLength}, () => GUARD_VALUE),
      `${label}: ${entry.buffer.id} preserves its caller-owned offset prefix`
    );
    testCase.equal(
      values.at(-1),
      GUARD_VALUE,
      `${label}: ${entry.buffer.id} preserves its caller-owned suffix`
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

function destroyExecution(testCase: Test, execution: DenseExecution): void {
  execution.compiled.destroy();
  for (const {buffer} of execution.owned) {
    testCase.notOk(buffer.destroyed, 'dense graph destruction never destroys borrowed GPU storage');
    buffer.destroy();
  }
}
