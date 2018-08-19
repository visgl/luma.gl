/* global Worker, URL */
import createWorker from 'webworkify';

// Cache result of webworkify
const cache = new Map();

function getWorkerURL(processor) {
  let workerURL = cache.get(processor);

  if (!workerURL) {
    const blob = createWorker(processor, {bare: true});
    workerURL = URL.createObjectURL(blob);
    cache.set(processor, workerURL);
  }

  return workerURL;
}

/**
 * Process binary data in a worker
 * @param processor {function | string} - worker function.
 * @returns a Promise creator
 */
export function processWithWorker(processor) {
  const workerURL = getWorkerURL(processor);

  return arrayBuffer =>
    new Promise((resolve, reject) => {
      const worker = new Worker(workerURL);
      worker.onmessage = message => resolve(message.data);
      worker.onerror = error => reject(error);
      worker.postMessage(arrayBuffer, [arrayBuffer]);
    });
}

function getTransferList(object, recursive = true, transfers = []) {
  if (!object) {
    // ignore
  } else if (object instanceof ArrayBuffer) {
    transfers.push(object);
  } else if (object.buffer && object.buffer instanceof ArrayBuffer) {
    // Typed array
    transfers.push(object.buffer);
  } else if (recursive && typeof object === 'object') {
    for (const key in object) {
      // Avoid perf hit - only go one level deep
      getTransferList(object[key], false, transfers);
    }
  }
  return transfers;
}

/**
 * A worker in the WorkerFarm
 */
class WorkerThread {
  constructor({url, metadata}) {
    this.worker = new Worker(url);
    this.isBusy = false;
    this.metadata = metadata;
  }

  process(data) {
    const {worker} = this;

    return new Promise((resolve, reject) => {
      worker.onmessage = e => {
        this.isBusy = false;
        resolve(e.data);
      };

      worker.onerror = err => {
        this.isBusy = false;
        reject(err);
      };

      this.isBusy = true;
      worker.postMessage(data, getTransferList(data));
    });
  }

  terminate() {
    this.worker.terminate();
    this.worker = null;
  }
}

/**
 * Process multiple data messages with a fleet of workers
 */
export class WorkerFarm {
  /**
   * @param processor {function | string} - worker function
   * @param maxConcurrency {number} - max count of workers
   */
  constructor({processor, maxConcurrency = 1, debug = () => {}}) {
    this.workerURL = getWorkerURL(processor);
    this.workers = [];
    this.queue = [];
    this.debug = debug;

    for (let i = 0; i < maxConcurrency; i++) {
      this.workers[i] = new WorkerThread({
        url: this.workerURL,
        metadata: {name: `${i}/${maxConcurrency}`}
      });
    }
  }

  destroy() {
    this.workers.forEach(worker => worker.terminate());
  }

  getAvailableWorker() {
    return this.workers.find(worker => !worker.isBusy);
  }

  next() {
    const {queue} = this;

    while (queue.length) {
      const worker = this.getAvailableWorker();
      if (!worker) {
        break;
      }
      const job = queue.shift();

      this.debug({
        message: 'processing',
        worker: worker.metadata.name,
        backlog: queue.length
      });

      worker
        .process(job.data)
        .then(job.onResult)
        .catch(job.onError)
        .then(() => this.next());
    }
  }

  process(data, onResult, onError) {
    this.queue.push({data, onResult, onError});
    this.next();
  }
}
