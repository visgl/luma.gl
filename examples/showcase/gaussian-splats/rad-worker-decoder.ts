// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {
  LocalGaussianSplatLoadersConfiguration,
  LocalGaussianSplatRADPage,
  LocalGaussianSplatRADPageDecodeContext,
  LocalGaussianSplatRADSplatEncoding
} from './local-loaders';

/** Bounded browser workers used to decode independently fetched Spark RAD pages. */
export type GaussianSplatRADWorkerDecoderOptions = {
  maxWorkers?: number;
};

type GaussianSplatRADWorkerRequest = {
  id: number;
  chunkIndex: number;
  bundleUrl: string;
  bytes: ArrayBuffer;
  splatEncoding?: LocalGaussianSplatRADSplatEncoding;
};

type GaussianSplatRADWorkerResponse =
  | {
      id: number;
      status: 'success';
      ipc: Uint8Array;
      shape?: string;
      loaderData: LocalGaussianSplatRADPage['loaderData'];
    }
  | {id: number; status: 'error'; name?: string; message: string};

type GaussianSplatRADWorkerJob = {
  id: number;
  context: LocalGaussianSplatRADPageDecodeContext;
  bytes: ArrayBuffer;
  resolve: (page: LocalGaussianSplatRADPage) => void;
  reject: (error: unknown) => void;
  removeAbortListener: () => void;
  slot?: GaussianSplatRADWorkerSlot;
  settled: boolean;
};

type GaussianSplatRADWorkerSlot = {
  worker: Worker;
  job?: GaussianSplatRADWorkerJob;
};

type GaussianSplatRADWorkerBundle = {
  tableFromIPC: (ipc: Uint8Array) => LocalGaussianSplatRADPage['data'];
};

const DEFAULT_GAUSSIAN_RAD_WORKER_COUNT = 2;

/** Standalone module worker imports the official published RAD parser in its own realm. */
export const GAUSSIAN_SPLAT_RAD_DECODER_WORKER_SOURCE = `
let loaderBundlePromise;

self.addEventListener('message', async event => {
  const request = event.data;
  try {
    loaderBundlePromise ||= import(request.bundleUrl);
    const loaderBundle = await loaderBundlePromise;
    const page = loaderBundle.parseRADChunk(request.bytes, {
      radChunk: {
        splatEncoding: request.splatEncoding,
        includeLoDTree: true,
        includeSphericalHarmonics: true
      }
    });
    const ipc = loaderBundle.tableToIPC(page.data);
    const loaderData = {...page.loaderData, chunkIndex: request.chunkIndex};
    const transfer = [ipc.buffer];
    for (const hierarchy of [loaderData.childCounts, loaderData.childStarts]) {
      if (hierarchy?.buffer instanceof ArrayBuffer && !transfer.includes(hierarchy.buffer)) {
        transfer.push(hierarchy.buffer);
      }
    }
    self.postMessage(
      {id: request.id, status: 'success', ipc, shape: page.shape, loaderData},
      transfer
    );
  } catch (error) {
    self.postMessage({
      id: request.id,
      status: 'error',
      name: error instanceof Error ? error.name : 'Error',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});
`;

/** Parses original RAD pages in real browser workers while preserving source-owned identities. */
export class GaussianSplatRADWorkerDecoder {
  readonly mode = 'worker';

  private readonly bundleUrl: string;
  private readonly maxWorkers: number;
  private readonly workerUrl: string;
  private readonly slots: GaussianSplatRADWorkerSlot[] = [];
  private readonly queue: GaussianSplatRADWorkerJob[] = [];
  private loaderBundlePromise?: Promise<GaussianSplatRADWorkerBundle>;
  private nextRequestId = 0;
  private completedDecodes = 0;
  private destroyed = false;

  constructor(bundleUrl: string, options: GaussianSplatRADWorkerDecoderOptions = {}) {
    this.bundleUrl = bundleUrl;
    this.maxWorkers = Math.max(
      1,
      Math.floor(options.maxWorkers ?? DEFAULT_GAUSSIAN_RAD_WORKER_COUNT)
    );
    this.workerUrl = URL.createObjectURL(
      new Blob([GAUSSIAN_SPLAT_RAD_DECODER_WORKER_SOURCE], {type: 'text/javascript'})
    );
    try {
      this.createWorkerSlot();
    } catch (error) {
      URL.revokeObjectURL(this.workerUrl);
      throw error;
    }
  }

  /** Number of currently live browser workers, including an idle reusable worker. */
  get workerCount(): number {
    return this.slots.length;
  }

  /** Number of successfully decoded original source pages. */
  get completedDecodeCount(): number {
    return this.completedDecodes;
  }

  /** Fetches original page bytes, then transfers parsing and hierarchy extraction to a worker. */
  async decodePage(
    context: LocalGaussianSplatRADPageDecodeContext
  ): Promise<LocalGaussianSplatRADPage> {
    if (this.destroyed) {
      throw makeGaussianSplatWorkerAbortError(context.signal);
    }
    context.signal.throwIfAborted();
    const bytes = await context.fetchChunkBytes();
    context.signal.throwIfAborted();
    if (this.destroyed) {
      throw makeGaussianSplatWorkerAbortError(context.signal);
    }

    return await new Promise<LocalGaussianSplatRADPage>((resolve, reject) => {
      const job: GaussianSplatRADWorkerJob = {
        id: this.nextRequestId++,
        context,
        bytes,
        resolve,
        reject,
        removeAbortListener: () => {},
        settled: false
      };
      const handleAbort = (): void => this.cancelWorkerJob(job);
      context.signal.addEventListener('abort', handleAbort, {once: true});
      job.removeAbortListener = () => context.signal.removeEventListener('abort', handleAbort);
      if (context.signal.aborted) {
        this.cancelWorkerJob(job);
        return;
      }
      this.queue.push(job);
      this.dispatchQueuedJobs();
    });
  }

  /** Cancels outstanding parsing, terminates owned workers, and releases the Blob module URL. */
  destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;
    for (const job of [...this.queue]) {
      this.cancelWorkerJob(job);
    }
    for (const slot of [...this.slots]) {
      if (slot.job) {
        this.cancelWorkerJob(slot.job);
      } else {
        this.removeWorkerSlot(slot);
      }
    }
    URL.revokeObjectURL(this.workerUrl);
  }

  private createWorkerSlot(): GaussianSplatRADWorkerSlot {
    const slot: GaussianSplatRADWorkerSlot = {
      worker: new Worker(this.workerUrl, {type: 'module', name: 'gaussian-rad-decoder'})
    };
    slot.worker.addEventListener(
      'message',
      (event: MessageEvent<GaussianSplatRADWorkerResponse>) => {
        void this.handleWorkerMessage(slot, event.data).catch(error => {
          const job = slot.job;
          if (job) {
            this.finishWorkerJob(job, error);
          }
        });
      }
    );
    slot.worker.addEventListener('error', event => {
      event.preventDefault();
      const error =
        event.error || new Error(event.message || 'RAD worker could not decode a page.');
      const job = slot.job;
      this.removeWorkerSlot(slot);
      if (job) {
        this.finishWorkerJob(job, error);
      } else {
        this.dispatchQueuedJobs();
      }
    });
    slot.worker.addEventListener('messageerror', () => {
      const job = slot.job;
      this.removeWorkerSlot(slot);
      if (job) {
        this.finishWorkerJob(job, new Error('RAD worker returned an unreadable page.'));
      }
    });
    this.slots.push(slot);
    return slot;
  }

  private dispatchQueuedJobs(): void {
    while (!this.destroyed && this.queue.length > 0) {
      let slot = this.slots.find(candidate => !candidate.job);
      if (!slot && this.slots.length < this.maxWorkers) {
        try {
          slot = this.createWorkerSlot();
        } catch (error) {
          const job = this.queue.shift();
          if (job) {
            this.finishWorkerJob(job, error);
          }
          continue;
        }
      }
      if (!slot) {
        return;
      }
      const job = this.queue.shift()!;
      if (job.context.signal.aborted) {
        this.cancelWorkerJob(job);
        continue;
      }
      slot.job = job;
      job.slot = slot;
      const request: GaussianSplatRADWorkerRequest = {
        id: job.id,
        chunkIndex: job.context.chunkIndex,
        bundleUrl: this.bundleUrl,
        bytes: job.bytes,
        ...(job.context.metadata.splatEncoding === undefined
          ? {}
          : {splatEncoding: job.context.metadata.splatEncoding})
      };
      try {
        slot.worker.postMessage(request, [job.bytes]);
      } catch (error) {
        this.removeWorkerSlot(slot);
        this.finishWorkerJob(job, error);
      }
    }
  }

  private async handleWorkerMessage(
    slot: GaussianSplatRADWorkerSlot,
    response: GaussianSplatRADWorkerResponse
  ): Promise<void> {
    const job = slot.job;
    if (!job || job.settled || response.id !== job.id) {
      return;
    }
    if (response.status === 'error') {
      const error = new Error(response.message);
      error.name = response.name || 'Error';
      this.finishWorkerJob(job, error);
      return;
    }

    const loaderBundle = await this.getLoaderBundle();
    if (job.settled || slot.job !== job) {
      return;
    }
    job.context.signal.throwIfAborted();
    const page: LocalGaussianSplatRADPage = {
      data: loaderBundle.tableFromIPC(response.ipc),
      ...(response.shape ? {shape: response.shape} : {}),
      loaderData: response.loaderData
    };
    this.completedDecodes++;
    this.finishWorkerJob(job, undefined, page);
  }

  private async getLoaderBundle(): Promise<GaussianSplatRADWorkerBundle> {
    this.loaderBundlePromise ||= import(
      /* webpackIgnore: true */ /* @vite-ignore */ this.bundleUrl
    );
    return await this.loaderBundlePromise;
  }

  private cancelWorkerJob(job: GaussianSplatRADWorkerJob): void {
    if (job.settled) {
      return;
    }
    const queueIndex = this.queue.indexOf(job);
    if (queueIndex >= 0) {
      this.queue.splice(queueIndex, 1);
    }
    if (job.slot) {
      this.removeWorkerSlot(job.slot);
    }
    this.finishWorkerJob(job, makeGaussianSplatWorkerAbortError(job.context.signal));
  }

  private finishWorkerJob(
    job: GaussianSplatRADWorkerJob,
    error?: unknown,
    page?: LocalGaussianSplatRADPage
  ): void {
    if (job.settled) {
      return;
    }
    job.settled = true;
    job.removeAbortListener();
    if (job.slot?.job === job) {
      job.slot.job = undefined;
    }
    if (page) {
      job.resolve(page);
    } else {
      job.reject(error);
    }
    this.dispatchQueuedJobs();
  }

  private removeWorkerSlot(slot: GaussianSplatRADWorkerSlot): void {
    const slotIndex = this.slots.indexOf(slot);
    if (slotIndex < 0) {
      return;
    }
    this.slots.splice(slotIndex, 1);
    slot.worker.terminate();
  }
}

/** Returns a genuine browser-worker decoder when the isolated published bundle supports it. */
export function createGaussianSplatRADWorkerDecoder(
  configuration: LocalGaussianSplatLoadersConfiguration,
  options: GaussianSplatRADWorkerDecoderOptions = {}
): GaussianSplatRADWorkerDecoder | undefined {
  if (
    configuration.loaderMode !== 'bundled' ||
    configuration.sourceFormat !== 'RAD' ||
    !configuration.loaderBundleUrl ||
    typeof window === 'undefined' ||
    typeof Worker === 'undefined' ||
    typeof Blob === 'undefined' ||
    typeof URL.createObjectURL !== 'function' ||
    typeof URL.revokeObjectURL !== 'function'
  ) {
    return undefined;
  }

  const bundleUrl = new URL(configuration.loaderBundleUrl, window.location.href);
  if (bundleUrl.origin !== window.location.origin) {
    return undefined;
  }

  try {
    return new GaussianSplatRADWorkerDecoder(bundleUrl.href, options);
  } catch {
    return undefined;
  }
}

function makeGaussianSplatWorkerAbortError(signal: AbortSignal): unknown {
  return signal.reason || new DOMException('RAD page decoding was canceled.', 'AbortError');
}
