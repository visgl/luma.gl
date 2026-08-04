// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {makeGPUVectorFromArrow} from '@luma.gl/arrow';
import {Buffer, luma, type Device} from '@luma.gl/core';
import {
  GPUBatchSort,
  GPUCommandGraph,
  GPUSort,
  type CompiledGPUCommandGraph,
  type GPUSortAlgorithm,
  type GPUSortDirection
} from '@luma.gl/experimental';
import {GPUData, GPUVector} from '@luma.gl/tables';
import {webgpuAdapter} from '@luma.gl/webgpu';
import * as arrow from 'apache-arrow';

const APP_ID = 'gpu-sort-app';
const STYLE_ID = 'gpu-sort-example-style';
const UINT32_BYTE_LENGTH = Uint32Array.BYTES_PER_ELEMENT;
const DATASET_LENGTHS = {small: 16, medium: 4096, large: 131_072} as const;

type ExampleResources = {
  compiled: CompiledGPUCommandGraph;
  inputKeys: GPUVector<'uint32'>;
  inputValues: GPUVector<'uint32'>;
  outputKeys: GPUVector<'uint32'>;
  outputValues: GPUVector<'uint32'>;
};

type ExampleElements = {
  algorithm: HTMLSelectElement;
  compileTime: HTMLElement;
  dataset: HTMLSelectElement;
  direction: HTMLSelectElement;
  inputSample: HTMLElement;
  layout: HTMLSelectElement;
  nodeCount: HTMLElement;
  outputSample: HTMLElement;
  resolvedAlgorithm: HTMLElement;
  reuse: HTMLElement;
  run: HTMLButtonElement;
  status: HTMLElement;
  validation: HTMLElement;
};

/** Cleanup handle returned by {@link initializeGPUSortExample}. */
export type GPUSortExampleHandle = {destroy: () => void};

/** Mounts the graph-native GPU sort example into `#gpu-sort-app`. */
export function initializeGPUSortExample(): GPUSortExampleHandle {
  const root = document.getElementById(APP_ID);
  if (!root) {
    throw new Error(`GPU sort example requires #${APP_ID}`);
  }
  ensureStyles();
  root.innerHTML = EXAMPLE_HTML;
  const example = new GPUSortExample(root);
  void example.initialize();
  return {destroy: () => example.destroy()};
}

class GPUSortExample {
  private readonly elements: ExampleElements;
  private device: Device | null = null;
  private destroyed = false;
  private resources: ExampleResources | null = null;
  private runVersion = 0;

  private readonly handleRun = (): void => void this.run();
  private readonly handleSettingChange = (): void => void this.run();

  constructor(root: HTMLElement) {
    this.elements = getElements(root);
    this.elements.run.addEventListener('click', this.handleRun);
    this.elements.algorithm.addEventListener('change', this.handleSettingChange);
    this.elements.direction.addEventListener('change', this.handleSettingChange);
    this.elements.dataset.addEventListener('change', this.handleSettingChange);
    this.elements.layout.addEventListener('change', this.handleSettingChange);
  }

  async initialize(): Promise<void> {
    this.setStatus('Requesting a WebGPU device...');
    try {
      const device = await luma.createDevice({
        type: 'webgpu',
        adapters: [webgpuAdapter]
      });
      if (this.destroyed) {
        device.destroy();
        return;
      }
      this.device = device;
      await this.run();
    } catch (error) {
      this.setStatus(getErrorMessage(error), true);
    }
  }

  destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;
    this.elements.run.removeEventListener('click', this.handleRun);
    this.elements.algorithm.removeEventListener('change', this.handleSettingChange);
    this.elements.direction.removeEventListener('change', this.handleSettingChange);
    this.elements.dataset.removeEventListener('change', this.handleSettingChange);
    this.elements.layout.removeEventListener('change', this.handleSettingChange);
    this.releaseResources();
    this.device?.destroy();
    this.device = null;
  }

  private async run(): Promise<void> {
    if (!this.device || this.destroyed) {
      return;
    }
    const runVersion = ++this.runVersion;
    this.elements.run.disabled = true;
    this.setStatus('Building Arrow columns and compiling the command graph...');
    const length = DATASET_LENGTHS[this.elements.dataset.value as keyof typeof DATASET_LENGTHS];
    const batchLengths = getBatchLengths(length, this.elements.layout.value === 'streamed');
    const algorithm = this.elements.algorithm.value as GPUSortAlgorithm;
    const direction = this.elements.direction.value as GPUSortDirection;
    const {keys, values} = makeDataset(length);
    let nextResources: ExampleResources | null = null;
    let inputKeys: GPUVector<'uint32'> | null = null;
    let inputValues: GPUVector<'uint32'> | null = null;
    let outputKeys: GPUVector<'uint32'> | null = null;
    let outputValues: GPUVector<'uint32'> | null = null;

    try {
      const arrowTable = new arrow.Table({
        key: makeUint32ArrowVector(keys, batchLengths),
        rowId: makeUint32ArrowVector(values, batchLengths)
      });
      const keyColumn = arrowTable.getChild('key');
      const valueColumn = arrowTable.getChild('rowId');
      if (!keyColumn || !valueColumn) {
        throw new Error('GPU sort example could not create Arrow key/value columns');
      }
      inputKeys = makeGPUVectorFromArrow(this.device, keyColumn, {
        name: 'sort-keys',
        format: 'uint32'
      });
      inputValues = makeGPUVectorFromArrow(this.device, valueColumn, {
        name: 'sort-row-ids',
        format: 'uint32'
      });
      outputKeys = makeOutputGPUVector(this.device, 'sorted-keys', batchLengths);
      outputValues = makeOutputGPUVector(this.device, 'sorted-row-ids', batchLengths);
      const graph = new GPUCommandGraph(this.device, {id: 'gpu-sort-example'});
      const keysImport = graph.importGPUVector('keys', inputKeys);
      const valuesImport = graph.importGPUVector('values', inputValues);
      const outputKeyImport = graph.importGPUVector('output-keys', outputKeys);
      const outputValueImport = graph.importGPUVector('output-values', outputValues);
      const sort =
        batchLengths.length === 1
          ? new GPUSort({
              keys: keysImport.data[0],
              values: valuesImport.data[0],
              outputKeys: outputKeyImport.data[0],
              outputValues: outputValueImport.data[0],
              algorithm,
              direction
            })
          : new GPUBatchSort({
              keys: keysImport,
              values: valuesImport,
              outputKeys: outputKeyImport,
              outputValues: outputValueImport,
              algorithm,
              direction
            });
      sort.addToGraph(graph);
      const compileStart = performance.now();
      const compiled = graph.compile();
      const compileTime = performance.now() - compileStart;
      nextResources = {compiled, inputKeys, inputValues, outputKeys, outputValues};

      const commandEncoder = this.device.createCommandEncoder({id: 'gpu-sort-example'});
      compiled.encode(commandEncoder, {parameters: undefined});
      this.device.submit(commandEncoder.finish());
      const [sortedKeys, sortedValues] = await Promise.all([
        readGPUVector(outputKeys),
        readGPUVector(outputValues)
      ]);
      if (this.destroyed || runVersion !== this.runVersion) {
        destroyResources(nextResources);
        return;
      }
      const valid = validateResult(keys, values, sortedKeys, sortedValues, batchLengths, direction);
      this.releaseResources();
      this.resources = nextResources;
      nextResources = null;
      this.elements.resolvedAlgorithm.textContent =
        sort instanceof GPUBatchSort
          ? summarizeAlgorithms(sort.resolvedAlgorithms)
          : sort.resolvedAlgorithm;
      this.elements.nodeCount.textContent = String(compiled.stats.nodeOrder.length);
      this.elements.reuse.textContent = `${compiled.stats.reusePercentage.toFixed(1)}%`;
      this.elements.compileTime.textContent = `${compileTime.toFixed(1)} ms`;
      this.elements.inputSample.textContent = formatSample(keys, values, batchLengths);
      this.elements.outputSample.textContent = formatSample(sortedKeys, sortedValues, batchLengths);
      this.elements.validation.textContent = valid
        ? `Stable order verified within ${batchLengths.length} ${batchLengths.length === 1 ? 'batch' : 'batches'}`
        : 'Mismatch';
      this.elements.validation.dataset['state'] = valid ? 'ready' : 'error';
      this.setStatus(
        `${length.toLocaleString()} rows across ${batchLengths.length} Arrow ${batchLengths.length === 1 ? 'batch' : 'batches'} encoded with explicit caller ownership.`
      );
    } catch (error) {
      if (nextResources) {
        destroyResources(nextResources);
      } else {
        inputKeys?.destroy();
        inputValues?.destroy();
        outputKeys?.destroy();
        outputValues?.destroy();
      }
      this.setStatus(getErrorMessage(error), true);
    } finally {
      if (!this.destroyed && runVersion === this.runVersion) {
        this.elements.run.disabled = false;
      }
    }
  }

  private releaseResources(): void {
    if (this.resources) {
      destroyResources(this.resources);
      this.resources = null;
    }
  }

  private setStatus(message: string, error = false): void {
    this.elements.status.textContent = message;
    this.elements.status.dataset['state'] = error ? 'error' : 'ready';
  }
}

function makeDataset(length: number): {keys: Uint32Array; values: Uint32Array} {
  let randomState = 0xdecafbad;
  const keys = Uint32Array.from({length}, (_, index) => {
    randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;
    return index % 13 === 0 ? 7 : randomState % Math.max(32, Math.floor(length / 3));
  });
  return {keys, values: Uint32Array.from({length}, (_, index) => index)};
}

function makeUint32ArrowVector(
  values: Uint32Array,
  chunkLengths: number[]
): arrow.Vector<arrow.Uint32> {
  const type = new arrow.Uint32();
  let rowOffset = 0;
  const data = chunkLengths.map(length => {
    const chunk = values.subarray(rowOffset, rowOffset + length);
    rowOffset += length;
    return new arrow.Data(type, 0, length, 0, {[arrow.BufferType.DATA]: chunk});
  });
  return new arrow.Vector(data);
}

function validateResult(
  keys: Uint32Array,
  values: Uint32Array,
  sortedKeys: Uint32Array,
  sortedValues: Uint32Array,
  batchLengths: number[],
  direction: GPUSortDirection
): boolean {
  let rowOffset = 0;
  for (const batchLength of batchLengths) {
    const expected = Array.from({length: batchLength}, (_, batchIndex) => {
      const index = rowOffset + batchIndex;
      return {key: keys[index], value: values[index], index};
    });
    expected.sort((left, right) => {
      const keyOrder = direction === 'ascending' ? left.key - right.key : right.key - left.key;
      return keyOrder || left.index - right.index;
    });
    if (
      !expected.every(
        (pair, batchIndex) =>
          pair.key === sortedKeys[rowOffset + batchIndex] &&
          pair.value === sortedValues[rowOffset + batchIndex]
      )
    ) {
      return false;
    }
    rowOffset += batchLength;
  }
  return true;
}

function formatSample(keys: Uint32Array, values: Uint32Array, batchLengths: number[]): string {
  const batches: string[] = [];
  let rowOffset = 0;
  let remaining = 24;
  for (const batchLength of batchLengths) {
    const count = Math.min(batchLength, remaining);
    batches.push(
      Array.from(
        {length: count},
        (_, batchIndex) => `${keys[rowOffset + batchIndex]}:${values[rowOffset + batchIndex]}`
      ).join('  ')
    );
    rowOffset += batchLength;
    remaining -= count;
    if (remaining === 0) break;
  }
  return `${batches.join('  │  ')}${keys.length > 24 ? '  …' : ''}`;
}

function getBatchLengths(length: number, streamed: boolean): number[] {
  if (!streamed) return [length];
  if (length <= 16) return [5, length - 5];
  if (length <= 4096) return [1024, length - 1024];
  return [32_768, 65_537, length - 98_305];
}

function makeOutputGPUVector(
  device: Device,
  name: string,
  chunkLengths: number[]
): GPUVector<'uint32'> {
  return new GPUVector({
    type: 'data',
    name,
    format: 'uint32',
    data: chunkLengths.map(
      (length, chunkIndex) =>
        new GPUData({
          buffer: device.createBuffer({
            id: `${name}-${chunkIndex}`,
            byteLength: Math.max(length, 1) * UINT32_BYTE_LENGTH,
            usage: Buffer.STORAGE | Buffer.COPY_SRC
          }),
          format: 'uint32',
          length,
          ownsBuffer: true
        })
    ),
    ownsData: true
  });
}

async function readGPUVector(vector: GPUVector<'uint32'>): Promise<Uint32Array> {
  const chunks = await Promise.all(
    vector.data.map(async chunk => {
      if (chunk.length === 0) return new Uint32Array(0);
      const bytes = await chunk.buffer.readAsync(
        chunk.byteOffset,
        chunk.length * UINT32_BYTE_LENGTH
      );
      return new Uint32Array(bytes.buffer, bytes.byteOffset, chunk.length).slice();
    })
  );
  const result = new Uint32Array(vector.length);
  let rowOffset = 0;
  for (const chunk of chunks) {
    result.set(chunk, rowOffset);
    rowOffset += chunk.length;
  }
  return result;
}

function summarizeAlgorithms(algorithms: readonly ('bitonic' | 'radix')[]): string {
  const bitonicCount = algorithms.filter(algorithm => algorithm === 'bitonic').length;
  const radixCount = algorithms.length - bitonicCount;
  return [
    bitonicCount > 0 ? `bitonic × ${bitonicCount}` : '',
    radixCount > 0 ? `radix × ${radixCount}` : ''
  ]
    .filter(Boolean)
    .join(' + ');
}

function destroyResources(resources: ExampleResources): void {
  resources.compiled.destroy();
  resources.inputKeys.destroy();
  resources.inputValues.destroy();
  resources.outputKeys.destroy();
  resources.outputValues.destroy();
}

function getElements(root: HTMLElement): ExampleElements {
  const get = <ElementType extends HTMLElement>(selector: string): ElementType => {
    const element = root.querySelector<ElementType>(selector);
    if (!element) {
      throw new Error(`GPU sort example is missing ${selector}`);
    }
    return element;
  };
  return {
    algorithm: get('[data-algorithm]'),
    compileTime: get('[data-compile-time]'),
    dataset: get('[data-dataset]'),
    direction: get('[data-direction]'),
    inputSample: get('[data-input-sample]'),
    layout: get('[data-layout]'),
    nodeCount: get('[data-node-count]'),
    outputSample: get('[data-output-sample]'),
    resolvedAlgorithm: get('[data-resolved-algorithm]'),
    reuse: get('[data-reuse]'),
    run: get('[data-run]'),
    status: get('[data-status]'),
    validation: get('[data-validation]')
  };
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) {
    return;
  }
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = EXAMPLE_CSS;
  document.head.appendChild(style);
}

const EXAMPLE_HTML = `
<main class="gpu-sort-example">
  <header>
    <p class="eyebrow">@luma.gl/experimental · GPUCommandGraph</p>
    <h1>Graph-native GPU sort</h1>
    <p>Stable paired uint32 sorting for one global domain or independent streaming batches.</p>
  </header>
  <section class="controls">
    <label>Dataset<select data-dataset><option value="small">16 rows</option><option value="medium">4,096 rows</option><option value="large">131,072 rows</option></select></label>
    <label>Storage<select data-layout><option value="packed">One packed batch</option><option value="streamed" selected>Preserved Arrow batches</option></select></label>
    <label>Algorithm<select data-algorithm><option value="auto">Auto</option><option value="bitonic">Bitonic</option><option value="radix">Radix</option></select></label>
    <label>Direction<select data-direction><option value="ascending">Ascending</option><option value="descending">Descending</option></select></label>
    <button data-run>Compile and run</button>
  </section>
  <p class="status" data-status>Initializing…</p>
  <section class="metrics">
    <article><span>Resolved per batch</span><strong data-resolved-algorithm>—</strong></article>
    <article><span>Graph nodes</span><strong data-node-count>—</strong></article>
    <article><span>Transient reuse</span><strong data-reuse>—</strong></article>
    <article><span>Compile time</span><strong data-compile-time>—</strong></article>
  </section>
  <section class="samples">
    <article><h2>Arrow input <small>key:rowId</small></h2><code data-input-sample>—</code></article>
    <article><h2>GPU output <small>key:rowId</small></h2><code data-output-sample>—</code><p data-validation>Awaiting result</p></article>
  </section>
</main>`;

const EXAMPLE_CSS = `
.gpu-sort-example{box-sizing:border-box;min-height:100%;padding:32px;color:#172033;background:radial-gradient(circle at 85% 0,#dce8ff,transparent 34%),#f7f9fc;font-family:Inter,ui-sans-serif,system-ui,sans-serif}.gpu-sort-example *{box-sizing:border-box}.gpu-sort-example header,.gpu-sort-example>section,.gpu-sort-example>.status{max-width:1120px;margin-left:auto;margin-right:auto}.gpu-sort-example h1{margin:4px 0 8px;font-size:clamp(30px,5vw,54px);letter-spacing:-.04em}.gpu-sort-example .eyebrow{margin:0;color:#315cc5;font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.controls{display:flex;flex-wrap:wrap;gap:12px;align-items:end;margin-top:26px;padding:18px;border:1px solid #cbd5e1;border-radius:16px;background:#fff;box-shadow:0 12px 35px #26355414}.controls label{display:grid;gap:6px;color:#526078;font-size:12px;font-weight:700}.controls select,.controls button{min-height:40px;padding:0 12px;border:1px solid #aebbd0;border-radius:9px;background:#fff;color:#172033;font:inherit}.controls button{border-color:#315cc5;background:#315cc5;color:#fff;cursor:pointer}.controls button:disabled{opacity:.55}.status{padding:12px 2px;color:#526078}.status[data-state=error],[data-validation][data-state=error]{color:#b42318}.metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.metrics article,.samples article{padding:18px;border:1px solid #d3dbe8;border-radius:14px;background:#fff}.metrics span{display:block;color:#667085;font-size:12px}.metrics strong{display:block;margin-top:8px;font-size:22px}.samples{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}.samples h2{margin:0 0 14px;font-size:17px}.samples small{color:#667085;font-weight:500}.samples code{display:block;min-height:100px;max-height:210px;overflow:auto;white-space:pre-wrap;overflow-wrap:anywhere;color:#244282;line-height:1.6}.samples p{margin:14px 0 0;color:#087443;font-weight:700}@media(max-width:760px){.gpu-sort-example{padding:20px}.metrics{grid-template-columns:1fr 1fr}.samples{grid-template-columns:1fr}}`;
