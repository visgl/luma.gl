// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUData, type GPUVectorLike} from '@luma.gl/gpgpu/gpu-data';
import {
  GPUIncrementalExecution,
  GPUElementwise,
  GPUGroupAggregation,
  GPUHistogram,
  GPUReduction,
  GPUSort,
  createTransientView,
  type GPUCommandGraph,
  type GPUIncrementalBatch,
  type GraphDataView
} from '@luma.gl/gpgpu/gpu-core';

/** A borrowed source batch may itself contain multiple chunks with different boundaries. */
export type StreamingAnalyticsBatch = {
  values: GPUVectorLike<'uint32'>;
  groups: GPUVectorLike<'uint32'>;
  /** Stable caller-assigned row identities, unaffected by batch insertion or removal. */
  rowIds: GPUVectorLike<'uint32'>;
};

type AnalyticsPartial = {
  sum: GPUData<'uint32'>;
  histogram: GPUData<'uint32'>;
  groups: GPUData<'uint32'>;
  topValues: GPUData<'uint32'>;
  topRows: GPUData<'uint32'>;
};

/** Example composition: persistent summaries built entirely with existing GPU operations. */
export class StreamingAnalytics {
  readonly outputs: AnalyticsPartial;
  readonly execution: GPUIncrementalExecution<StreamingAnalyticsBatch, AnalyticsPartial>;
  topCount = 0;
  private domain: readonly [number, number] = [0, 100];
  private revision = 0;

  constructor(
    device: Device,
    readonly limit = 5
  ) {
    if (!Number.isSafeInteger(limit) || limit < 1) throw new Error('Invalid Top-K limit');
    const createOutput = (length: number): GPUData<'uint32'> =>
      new GPUData({
        buffer: device.createBuffer({
          byteLength: length * 4,
          usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
        }),
        format: 'uint32',
        length,
        ownsBuffer: true
      });
    this.outputs = {
      sum: createOutput(1),
      histogram: createOutput(10),
      groups: createOutput(4),
      topValues: createOutput(limit),
      topRows: createOutput(limit)
    };
    this.execution = new GPUIncrementalExecution(device, {
      id: 'streaming-analytics',
      createPartial: (batch, {graph, createData}) => {
        const values = graph.importGPUVector('values', batch.values);
        const groups = graph.importGPUVector('groups', batch.groups);
        const rowIds = graph.importGPUVector('row-ids', batch.rowIds);
        const partial = {
          sum: createData('uint32', 1),
          histogram: createData('uint32', 10),
          groups: createData('uint32', 4),
          topValues: createData('uint32', Math.min(limit, values.length)),
          topRows: createData('uint32', Math.min(limit, values.length))
        };
        graph.add([
          new GPUReduction({
            input: values,
            output: graph.importGPUData('sum', partial.sum),
            operation: 'sum'
          }),
          new GPUHistogram({
            input: values,
            output: graph.importGPUData('histogram', partial.histogram),
            domain: this.domain
          }),
          new GPUGroupAggregation({
            keys: groups,
            output: graph.importGPUData('counts', partial.groups)
          })
        ]);
        const sortedValues = createTransientView(graph, 'sorted-values', 'uint32', values.length);
        const sortedRows = createTransientView(graph, 'sorted-rows', 'uint32', values.length);
        graph.add(
          new GPUSort({
            keys: values,
            values: rowIds,
            outputKeys: sortedValues,
            outputValues: sortedRows,
            direction: 'descending'
          })
        );
        copyPrefix(
          graph,
          'cache-top-values',
          sortedValues,
          graph.importGPUData('top-values', partial.topValues)
        );
        copyPrefix(
          graph,
          'cache-top-rows',
          sortedRows,
          graph.importGPUData('top-rows', partial.topRows)
        );
        return partial;
      },
      merge: (partials, graph) => {
        const sums = importChunks(
          graph,
          'sums',
          partials.map(partial => partial.sum)
        );
        graph.add(
          new GPUReduction({
            input: sums,
            output: graph.importGPUData('sum', this.outputs.sum),
            operation: 'sum'
          })
        );
        mergeCounts(
          graph,
          'histogram',
          partials.map(partial => partial.histogram),
          this.outputs.histogram
        );
        mergeCounts(
          graph,
          'groups',
          partials.map(partial => partial.groups),
          this.outputs.groups
        );
        // Only candidate rows are sorted globally. Source vectors remain borrowed and unmodified.
        const candidates = importChunks(
          graph,
          'candidate-values',
          partials.map(partial => partial.topValues)
        );
        const candidateRows = importChunks(
          graph,
          'candidate-rows',
          partials.map(partial => partial.topRows)
        );
        const sortedValues = createTransientView(
          graph,
          'sorted-values',
          'uint32',
          candidates.length
        );
        const sortedRows = createTransientView(graph, 'sorted-rows', 'uint32', candidates.length);
        graph.add(
          new GPUSort({
            keys: candidates,
            values: candidateRows,
            outputKeys: sortedValues,
            outputValues: sortedRows,
            direction: 'descending'
          })
        );
        for (const [name, input, data] of [
          ['top-values', sortedValues, this.outputs.topValues],
          ['top-rows', sortedRows, this.outputs.topRows]
        ] as const) {
          const output = graph.importGPUData(name, data);
          clearCounts(graph, `clear-${name}`, output);
          copyPrefix(graph, `publish-${name}`, input, output);
        }
      }
    });
  }

  /** A domain change affects every histogram partial, so invalidate this composite query. */
  setDomain(domain: readonly [number, number]): void {
    if (!domain.every(Number.isFinite) || domain[0] >= domain[1]) throw new Error('Invalid domain');
    if (domain[0] === this.domain[0] && domain[1] === this.domain[1]) return;
    this.domain = [...domain];
    this.revision++;
  }

  update(batches: readonly GPUIncrementalBatch<StreamingAnalyticsBatch>[]) {
    const stats = this.execution.update(batches, this.revision);
    this.topCount = Math.min(
      this.limit,
      batches.reduce((length, batch) => length + batch.data.values.length, 0)
    );
    return stats;
  }

  destroy(): void {
    this.execution.destroy();
    for (const output of Object.values(this.outputs)) output.destroy();
  }
}

function importChunks(graph: GPUCommandGraph, id: string, data: readonly GPUData<'uint32'>[]) {
  return graph.importGPUVector(id, {
    format: 'uint32',
    data,
    length: data.reduce((length, chunk) => length + chunk.length, 0)
  });
}

function mergeCounts(
  graph: GPUCommandGraph,
  id: string,
  partials: readonly GPUData<'uint32'>[],
  outputData: GPUData<'uint32'>
): void {
  const output = graph.importGPUData(id, outputData);
  if (!partials.length) {
    clearCounts(graph, `clear-${id}`, output);
    return;
  }
  let accumulator = graph.importGPUData(`${id}-partial-0`, partials[0]);
  for (let index = 1; index < partials.length; index++) {
    const next =
      index === partials.length - 1
        ? output
        : createTransientView(graph, `${id}-merge-${index}`, 'uint32', output.length);
    graph.add(
      new GPUElementwise({
        id: `${id}-add-${index}`,
        input: accumulator,
        inputB: graph.importGPUData(`${id}-partial-${index}`, partials[index]),
        output: next,
        operation: 'add'
      })
    );
    accumulator = next;
  }
  if (partials.length === 1)
    graph.add(
      new GPUElementwise({id: `${id}-copy`, input: accumulator, output, operation: 'copy'})
    );
}

function clearCounts(graph: GPUCommandGraph, id: string, output: GraphDataView<'uint32'>): void {
  graph.add(
    new GPUHistogram({id, input: importChunks(graph, `${id}-empty`, []), output, domain: [0, 1]})
  );
}

function copyPrefix(
  graph: GPUCommandGraph,
  id: string,
  input: GraphDataView<'uint32'>,
  output: GraphDataView<'uint32'>
): void {
  const length = Math.min(input.length, output.length);
  if (!length) return;
  graph.add(
    new GPUElementwise({
      id,
      input: graph.createDataView(input.buffer, {
        format: 'uint32',
        length,
        byteOffset: input.byteOffset
      }),
      output: graph.createDataView(output.buffer, {
        format: 'uint32',
        length,
        byteOffset: output.byteOffset
      }),
      operation: 'copy'
    })
  );
}
