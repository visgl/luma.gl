// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  getTraceDatasetTransferables,
  makeTraceDataset,
  type TraceDatasetData,
  type TraceDatasetGenerationPhase
} from './trace-data';

export type TraceDatasetWorkerRequest = {
  requestId: number;
  spanCapacity: number;
  dependencyCapacity: number;
};

export type TraceDatasetWorkerResponse =
  | {requestId: number; dataset: TraceDatasetData}
  | {requestId: number; progress: TraceDatasetGenerationPhase}
  | {requestId: number; error: string};

type TraceDatasetWorkerScope = {
  onmessage: ((event: MessageEvent<TraceDatasetWorkerRequest>) => void) | null;
  postMessage(message: TraceDatasetWorkerResponse, transfer?: Transferable[]): void;
};

const workerScope = globalThis as unknown as TraceDatasetWorkerScope;

workerScope.onmessage = event => {
  const {requestId, spanCapacity, dependencyCapacity} = event.data;
  try {
    const dataset = makeTraceDataset(spanCapacity, dependencyCapacity, progress => {
      workerScope.postMessage({requestId, progress});
    });
    workerScope.postMessage(
      {requestId, dataset},
      getTraceDatasetTransferables(dataset) as Transferable[]
    );
  } catch (error) {
    workerScope.postMessage({
      requestId,
      error: error instanceof Error ? error.message : String(error)
    });
  }
};
