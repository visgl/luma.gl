// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {makeGPUVectorFromArrow} from '@luma.gl/arrow';
import {Buffer, luma, type Device} from '@luma.gl/core';
import {
  GPUCommandGraph,
  GPUSort,
  type CompiledGPUCommandGraph,
  type GPUSortAlgorithm,
  type GPUSortDirection
} from '@luma.gl/experimental';
import type {GPUVector} from '@luma.gl/tables';
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
  outputKeys: Buffer;
  outputValues: Buffer;
};

type ExampleElements = {
  algorithm: HTMLSelectElement;
  compileTime: HTMLElement;
  dataset: HTMLSelectElement;
  direction: HTMLSelectElement;
  inputSample: HTMLElement;
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
  }

  async initialize(): Promise<void> {
    this.setStatus('Requesting a WebGPU device...');
    try {
      const device = await luma.createDevice({
        type: 'webgpu',
        adapters: [webgpuAdapter],
        createCanvasContext:
          typeof OffscreenCanvas === 'undefined'
            ? true
            : {
                canvas: new OffscreenCanvas(1, 1),
                width: 1,
                height: 1,
                autoResize: false,
                useDevicePixels: false
              }
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
    const algorithm = this.elements.algorithm.value as GPUSortAlgorithm;
    const direction = this.elements.direction.value as GPUSortDirection;
    const {keys, values} = makeDataset(length);
    let nextResources: ExampleResources | null = null;
    let inputKeys: GPUVector<'uint32'> | null = null;
    let inputValues: GPUVector<'uint32'> | null = null;
    let outputKeys: Buffer | null = null;
    let outputValues: Buffer | null = null;

    try {
      const arrowTable = new arrow.Table({
        key: makeUint32ArrowVector(keys),
        rowId: makeUint32ArrowVector(values)
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
      const byteLength = Math.max(length, 1) * UINT32_BYTE_LENGTH;
      outputKeys = this.device.createBuffer({
        id: 'sorted-keys',
        byteLength,
        usage: Buffer.STORAGE | Buffer.COPY_SRC
      });
      outputValues = this.device.createBuffer({
        id: 'sorted-row-ids',
        byteLength,
        usage: Buffer.STORAGE | Buffer.COPY_SRC
      });
      const graph = new GPUCommandGraph(this.device, {id: 'gpu-sort-example'});
      const keyView = graph.importGPUVector('keys', inputKeys);
      const valueView = graph.importGPUVector('values', inputValues);
      const outputKeyHandle = graph.importBuffer(
        {id: 'output-keys', byteLength, usage: outputKeys.usage},
        outputKeys
      );
      const outputValueHandle = graph.importBuffer(
        {id: 'output-values', byteLength, usage: outputValues.usage},
        outputValues
      );
      const sort = new GPUSort({
        keys: keyView,
        values: valueView,
        outputKeys: graph.createBufferView(outputKeyHandle, {format: 'uint32', length}),
        outputValues: graph.createBufferView(outputValueHandle, {format: 'uint32', length}),
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
      const [keyBytes, valueBytes] = await Promise.all([
        outputKeys.readAsync(0, length * UINT32_BYTE_LENGTH),
        outputValues.readAsync(0, length * UINT32_BYTE_LENGTH)
      ]);
      const sortedKeys = new Uint32Array(keyBytes.buffer, keyBytes.byteOffset, length).slice();
      const sortedValues = new Uint32Array(
        valueBytes.buffer,
        valueBytes.byteOffset,
        length
      ).slice();
      if (this.destroyed || runVersion !== this.runVersion) {
        destroyResources(nextResources);
        return;
      }
      const valid = validateResult(keys, values, sortedKeys, sortedValues, direction);
      this.releaseResources();
      this.resources = nextResources;
      nextResources = null;
      this.elements.resolvedAlgorithm.textContent = sort.resolvedAlgorithm;
      this.elements.nodeCount.textContent = String(compiled.stats.nodeOrder.length);
      this.elements.reuse.textContent = `${compiled.stats.reusePercentage.toFixed(1)}%`;
      this.elements.compileTime.textContent = `${compileTime.toFixed(1)} ms`;
      this.elements.inputSample.textContent = formatSample(keys, values);
      this.elements.outputSample.textContent = formatSample(sortedKeys, sortedValues);
      this.elements.validation.textContent = valid ? 'Stable key/value order verified' : 'Mismatch';
      this.elements.validation.dataset['state'] = valid ? 'ready' : 'error';
      this.setStatus(
        `${length.toLocaleString()} rows encoded and submitted with explicit caller ownership.`
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

function makeUint32ArrowVector(values: Uint32Array): arrow.Vector<arrow.Uint32> {
  const type = new arrow.Uint32();
  const data = new arrow.Data(type, 0, values.length, 0, {[arrow.BufferType.DATA]: values});
  return new arrow.Vector([data]);
}

function validateResult(
  keys: Uint32Array,
  values: Uint32Array,
  sortedKeys: Uint32Array,
  sortedValues: Uint32Array,
  direction: GPUSortDirection
): boolean {
  const expected = Array.from(keys, (key, index) => ({key, value: values[index], index}));
  expected.sort((left, right) => {
    const keyOrder = direction === 'ascending' ? left.key - right.key : right.key - left.key;
    return keyOrder || left.index - right.index;
  });
  return expected.every(
    (pair, index) => pair.key === sortedKeys[index] && pair.value === sortedValues[index]
  );
}

function formatSample(keys: Uint32Array, values: Uint32Array): string {
  const count = Math.min(keys.length, 24);
  const sample = Array.from({length: count}, (_, index) => `${keys[index]}:${values[index]}`);
  return `${sample.join('  ')}${keys.length > count ? '  …' : ''}`;
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
    <p>Stable paired uint32 sorting with bitonic and binary LSD radix implementations.</p>
  </header>
  <section class="controls">
    <label>Dataset<select data-dataset><option value="small">16 rows</option><option value="medium">4,096 rows</option><option value="large">131,072 rows</option></select></label>
    <label>Algorithm<select data-algorithm><option value="auto">Auto</option><option value="bitonic">Bitonic</option><option value="radix">Radix</option></select></label>
    <label>Direction<select data-direction><option value="ascending">Ascending</option><option value="descending">Descending</option></select></label>
    <button data-run>Compile and run</button>
  </section>
  <p class="status" data-status>Initializing…</p>
  <section class="metrics">
    <article><span>Resolved algorithm</span><strong data-resolved-algorithm>—</strong></article>
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
