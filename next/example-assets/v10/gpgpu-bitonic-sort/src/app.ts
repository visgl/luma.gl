// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {makeGPUVectorFromArrow} from '@luma.gl/arrow';
import {luma, type Device} from '@luma.gl/core';
import {BitonicArgsort} from '@luma.gl/gpgpu/webgpu';
import {getGPUVectorData, type GPUVector} from '@luma.gl/tables';
import {webgpuAdapter} from '@luma.gl/webgpu';
import * as arrow from 'apache-arrow';

const APP_ID = 'bitonic-argsort-app';
const APP_CLASS_NAME = 'bitonic-argsort-example';
const STYLE_ID = 'bitonic-argsort-example-style';
const INVALID_INDEX = 0xffffffff;
const ORIGINAL_SORT_KEYS = new Uint32Array([13, 3, 8, 3, 10, 1, 12, 6, 1, 15, 5, 10, 0, 7, 14, 4]);
const STEP_INTERVAL_MILLISECONDS = 360;

type BitonicArgsortArrowColumns = {
  sortKey: arrow.Uint32;
};

type BitonicArgsortArrowTable = arrow.Table<BitonicArgsortArrowColumns>;

type BitonicPass = {
  blockWidth: number;
  compareStride: number;
};

type BitonicPair = {
  ascending: boolean;
  leftPosition: number;
  leftRowIndex: number;
  rightPosition: number;
  rightRowIndex: number;
  swapped: boolean;
};

type BitonicArgsortExampleElements = {
  arrowRows: HTMLElement;
  currentPass: HTMLElement;
  gpuOutput: HTMLElement;
  gpuStatus: HTMLElement;
  inputVector: HTMLElement;
  outputVector: HTMLElement;
  pairList: HTMLElement;
  resetButton: HTMLButtonElement;
  runButton: HTMLButtonElement;
  sequence: HTMLElement;
  shuffleButton: HTMLButtonElement;
  sortedRows: HTMLElement;
  status: HTMLElement;
  stepButton: HTMLButtonElement;
};

/** Cleanup handle returned by {@link initializeBitonicArgsortExample}. */
export type BitonicArgsortExampleHandle = {
  /** Releases event handlers, GPU vectors, scratch buffers, and the example device. */
  destroy: () => void;
};

/**
 * Mounts the Arrow-backed BitonicArgsort teaching example into `#bitonic-argsort-app`.
 *
 * @returns Cleanup handle for the mounted example.
 * @throws If the required root element is missing.
 */
export function initializeBitonicArgsortExample(): BitonicArgsortExampleHandle {
  const root = document.getElementById(APP_ID);
  if (!root) {
    throw new Error(`Bitonic argsort example requires #${APP_ID}`);
  }

  ensureStyles();
  root.classList.add(APP_CLASS_NAME);
  root.innerHTML = BITONIC_ARGSORT_EXAMPLE_HTML;
  const example = new BitonicArgsortExample(root);
  void example.initialize();
  return {destroy: () => example.destroy()};
}

class BitonicArgsortExample {
  readonly root: HTMLElement;
  readonly elements: BitonicArgsortExampleElements;

  private arrowTable: BitonicArgsortArrowTable;
  private currentRowIndices: number[];
  private currentPassIndex = 0;
  private device: Device | null = null;
  private gpuRunVersion = 0;
  private gpuSortKeys: GPUVector<'uint32'> | null = null;
  private gpuSortedRowIndices: GPUVector<'uint32'> | null = null;
  private isDestroyed = false;
  private isRunning = false;
  private lastAnimationTimestamp = 0;
  private lastPairs: BitonicPair[] = [];
  private requestAnimationFrameId: number | null = null;
  private sortKeys: Uint32Array = ORIGINAL_SORT_KEYS.slice();
  private sorter: BitonicArgsort | null = null;
  private sortedRowIndices: number[] = [];

  private readonly passes = makeBitonicPasses(ORIGINAL_SORT_KEYS.length);
  private readonly handleReset = (): void => this.replaceSortKeys(ORIGINAL_SORT_KEYS.slice());
  private readonly handleRun = (): void => {
    if (this.currentPassIndex >= this.passes.length) {
      this.resetVisualization();
    }
    void this.refreshGPUResult();
    this.startAnimation();
  };
  private readonly handleShuffle = (): void => this.replaceSortKeys(shuffleSortKeys(this.sortKeys));
  private readonly handleStep = (): void => {
    this.stopAnimation();
    this.step();
  };

  constructor(root: HTMLElement) {
    this.root = root;
    this.elements = getExampleElements(root);
    this.arrowTable = makeArrowSortTable(this.sortKeys);
    this.currentRowIndices = makeInitialRowIndices(this.sortKeys.length);
    this.bindControls();
    this.render();
  }

  async initialize(): Promise<void> {
    this.setStatus('Requesting WebGPU device...');
    try {
      const device = await createWebGPUDevice();
      if (this.isDestroyed) {
        device.destroy();
        return;
      }

      this.device = device;
      this.sorter = new BitonicArgsort(device);
      this.setStatus('Uploading Arrow Uint32 keys to GPU storage...');
      await this.refreshGPUResult();
    } catch (error) {
      this.setStatus(getErrorMessage(error), true);
    }
  }

  destroy(): void {
    if (this.isDestroyed) {
      return;
    }

    this.isDestroyed = true;
    this.stopAnimation();
    this.elements.resetButton.removeEventListener('click', this.handleReset);
    this.elements.runButton.removeEventListener('click', this.handleRun);
    this.elements.shuffleButton.removeEventListener('click', this.handleShuffle);
    this.elements.stepButton.removeEventListener('click', this.handleStep);
    this.releaseGPUVectors();
    this.sorter?.destroy();
    this.sorter = null;
    this.device?.destroy();
    this.device = null;
  }

  private bindControls(): void {
    this.elements.resetButton.addEventListener('click', this.handleReset);
    this.elements.runButton.addEventListener('click', this.handleRun);
    this.elements.shuffleButton.addEventListener('click', this.handleShuffle);
    this.elements.stepButton.addEventListener('click', this.handleStep);
  }

  private replaceSortKeys(sortKeys: Uint32Array): void {
    this.stopAnimation();
    this.sortKeys = sortKeys;
    this.arrowTable = makeArrowSortTable(this.sortKeys);
    this.sortedRowIndices = [];
    this.resetVisualization();
    void this.refreshGPUResult();
  }

  private resetVisualization(): void {
    this.currentPassIndex = 0;
    this.currentRowIndices = makeInitialRowIndices(this.sortKeys.length);
    this.lastPairs = [];
    this.render();
  }

  private async refreshGPUResult(): Promise<void> {
    if (!this.device || !this.sorter) {
      this.render();
      return;
    }

    const gpuRunVersion = ++this.gpuRunVersion;
    this.elements.gpuStatus.textContent = 'Running BitonicArgsort.sortGPUVector()...';
    this.renderControls();

    let nextSortKeys: GPUVector<'uint32'> | null = null;
    let nextSortedRowIndices: GPUVector<'uint32'> | null = null;
    try {
      const sortKeyVector = getRequiredSortKeyVector(this.arrowTable);
      nextSortKeys = makeGPUVectorFromArrow(this.device, sortKeyVector, {
        name: 'sortKeys',
        format: 'uint32'
      });
      nextSortedRowIndices = this.sorter.sortGPUVector(nextSortKeys);
      const sortedRowIndices = await readUint32GPUVector(nextSortedRowIndices);
      if (this.isDestroyed || gpuRunVersion !== this.gpuRunVersion) {
        nextSortedRowIndices.destroy();
        nextSortKeys.destroy();
        return;
      }

      this.releaseGPUVectors();
      this.gpuSortKeys = nextSortKeys;
      this.gpuSortedRowIndices = nextSortedRowIndices;
      nextSortKeys = null;
      nextSortedRowIndices = null;
      this.sortedRowIndices = Array.from(sortedRowIndices);
      this.elements.gpuStatus.textContent =
        "GPU result materialized as GPUVector<'uint32'> row indices.";
      this.setStatus('Arrow Uint32 keys uploaded and argsorted on WebGPU.');
      this.render();
    } catch (error) {
      nextSortedRowIndices?.destroy();
      nextSortKeys?.destroy();
      this.elements.gpuStatus.textContent = getErrorMessage(error);
      this.setStatus(getErrorMessage(error), true);
    }
  }

  private releaseGPUVectors(): void {
    this.gpuSortedRowIndices?.destroy();
    this.gpuSortedRowIndices = null;
    this.gpuSortKeys?.destroy();
    this.gpuSortKeys = null;
  }

  private startAnimation(): void {
    if (this.isRunning || this.currentPassIndex >= this.passes.length) {
      return;
    }

    this.isRunning = true;
    this.lastAnimationTimestamp = 0;
    this.renderControls();
    this.requestAnimationFrameId = window.requestAnimationFrame(timestamp =>
      this.animate(timestamp)
    );
  }

  private animate(timestamp: number): void {
    if (!this.isRunning || this.isDestroyed) {
      return;
    }

    if (
      this.lastAnimationTimestamp === 0 ||
      timestamp - this.lastAnimationTimestamp >= STEP_INTERVAL_MILLISECONDS
    ) {
      this.step();
      this.lastAnimationTimestamp = timestamp;
    }

    if (this.isRunning) {
      this.requestAnimationFrameId = window.requestAnimationFrame(nextTimestamp =>
        this.animate(nextTimestamp)
      );
    }
  }

  private stopAnimation(): void {
    if (this.requestAnimationFrameId !== null) {
      window.cancelAnimationFrame(this.requestAnimationFrameId);
      this.requestAnimationFrameId = null;
    }
    this.isRunning = false;
    this.lastAnimationTimestamp = 0;
    this.renderControls();
  }

  private step(): void {
    const pass = this.passes[this.currentPassIndex];
    if (!pass) {
      this.stopAnimation();
      return;
    }

    const {nextRowIndices, pairs} = applyBitonicPass(this.sortKeys, this.currentRowIndices, pass);
    this.currentRowIndices = nextRowIndices;
    this.lastPairs = pairs;
    this.currentPassIndex++;
    if (this.currentPassIndex >= this.passes.length) {
      this.stopAnimation();
    }
    this.render();
  }

  private render(): void {
    this.elements.arrowRows.textContent = String(this.arrowTable.numRows);
    this.elements.inputVector.textContent = "GPUVector<'uint32'>";
    this.elements.outputVector.textContent = "GPUVector<'uint32'>";
    this.elements.currentPass.textContent = getPassLabel(
      this.currentPassIndex,
      this.passes,
      this.lastPairs.length > 0
    );
    this.elements.gpuOutput.textContent =
      this.sortedRowIndices.length === 0 ? 'Run pending' : `[${this.sortedRowIndices.join(', ')}]`;
    this.elements.sortedRows.textContent =
      this.sortedRowIndices.length === 0
        ? 'Run pending'
        : this.sortedRowIndices
            .map(rowIndex => `row ${rowIndex}: key ${this.sortKeys[rowIndex]}`)
            .join(' | ');
    renderSequence(this.elements.sequence, this.sortKeys, this.currentRowIndices, this.lastPairs);
    renderPairs(this.elements.pairList, this.sortKeys, this.lastPairs);
    this.renderControls();
  }

  private renderControls(): void {
    const hasDevice = Boolean(this.device && this.sorter);
    const hasRemainingPasses = this.currentPassIndex < this.passes.length;
    this.elements.runButton.disabled = !hasDevice || this.isRunning;
    this.elements.runButton.textContent = this.isRunning ? 'Running' : 'Run';
    this.elements.stepButton.disabled = !hasDevice || this.isRunning || !hasRemainingPasses;
    this.elements.shuffleButton.disabled = !hasDevice || this.isRunning;
    this.elements.resetButton.disabled = !hasDevice || this.isRunning;
  }

  private setStatus(message: string, isError = false): void {
    this.elements.status.textContent = message;
    this.elements.status.dataset['state'] = isError ? 'error' : 'ready';
  }
}

async function createWebGPUDevice(): Promise<Device> {
  return await luma.createDevice({
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
}

function getExampleElements(root: HTMLElement): BitonicArgsortExampleElements {
  return {
    arrowRows: getRequiredElement(root, '[data-arrow-rows]'),
    currentPass: getRequiredElement(root, '[data-current-pass]'),
    gpuOutput: getRequiredElement(root, '[data-gpu-output]'),
    gpuStatus: getRequiredElement(root, '[data-gpu-status]'),
    inputVector: getRequiredElement(root, '[data-input-vector]'),
    outputVector: getRequiredElement(root, '[data-output-vector]'),
    pairList: getRequiredElement(root, '[data-pair-list]'),
    resetButton: getRequiredElement(root, '[data-reset]'),
    runButton: getRequiredElement(root, '[data-run]'),
    sequence: getRequiredElement(root, '[data-sequence]'),
    shuffleButton: getRequiredElement(root, '[data-shuffle]'),
    sortedRows: getRequiredElement(root, '[data-sorted-rows]'),
    status: getRequiredElement(root, '[data-status]'),
    stepButton: getRequiredElement(root, '[data-step]')
  };
}

function getRequiredElement<T extends HTMLElement>(root: HTMLElement, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Bitonic argsort example is missing ${selector}`);
  }
  return element;
}

function makeArrowSortTable(sortKeys: Uint32Array): BitonicArgsortArrowTable {
  return new arrow.Table<BitonicArgsortArrowColumns>({
    sortKey: makeUint32Vector(sortKeys)
  });
}

function makeUint32Vector(values: Uint32Array): arrow.Vector<arrow.Uint32> {
  const type = new arrow.Uint32();
  const data = new arrow.Data(type, 0, values.length, 0, {[arrow.BufferType.DATA]: values});
  return new arrow.Vector([data]);
}

function getRequiredSortKeyVector(table: BitonicArgsortArrowTable): arrow.Vector<arrow.Uint32> {
  const vector = table.getChild('sortKey');
  if (
    !vector ||
    !arrow.DataType.isInt(vector.type) ||
    vector.type.isSigned ||
    vector.type.bitWidth !== 32
  ) {
    throw new Error('Bitonic argsort example requires an Arrow Uint32 sortKey column');
  }
  return vector as arrow.Vector<arrow.Uint32>;
}

async function readUint32GPUVector(vector: GPUVector<'uint32'>): Promise<Uint32Array> {
  if (vector.length === 0) {
    return new Uint32Array(0);
  }

  const data = getGPUVectorData(vector);
  const bytes = await data.buffer.readAsync(
    data.byteOffset,
    vector.length * Uint32Array.BYTES_PER_ELEMENT
  );
  return new Uint32Array(bytes.buffer, bytes.byteOffset, vector.length).slice();
}

function makeBitonicPasses(length: number): BitonicPass[] {
  const passes: BitonicPass[] = [];
  const paddedLength = getNextPowerOfTwo(length);
  for (let blockWidth = 2; blockWidth <= paddedLength; blockWidth *= 2) {
    for (let compareStride = blockWidth / 2; compareStride >= 1; compareStride /= 2) {
      passes.push({blockWidth, compareStride});
    }
  }
  return passes;
}

function applyBitonicPass(
  sortKeys: Uint32Array,
  currentRowIndices: number[],
  pass: BitonicPass
): {nextRowIndices: number[]; pairs: BitonicPair[]} {
  const nextRowIndices = currentRowIndices.slice();
  const pairs: BitonicPair[] = [];

  for (let leftPosition = 0; leftPosition < currentRowIndices.length; leftPosition++) {
    const rightPosition = leftPosition ^ pass.compareStride;
    if (rightPosition <= leftPosition) {
      continue;
    }

    const ascending = (leftPosition & pass.blockWidth) === 0;
    const leftRowIndex = currentRowIndices[leftPosition];
    const rightRowIndex = currentRowIndices[rightPosition];
    const swapped = ascending
      ? comesBefore(sortKeys, rightRowIndex, leftRowIndex)
      : comesBefore(sortKeys, leftRowIndex, rightRowIndex);
    if (swapped) {
      nextRowIndices[leftPosition] = rightRowIndex;
      nextRowIndices[rightPosition] = leftRowIndex;
    }
    pairs.push({ascending, leftPosition, leftRowIndex, rightPosition, rightRowIndex, swapped});
  }

  return {nextRowIndices, pairs};
}

function comesBefore(sortKeys: Uint32Array, leftRowIndex: number, rightRowIndex: number): boolean {
  const leftValid = isValidRowIndex(sortKeys, leftRowIndex);
  const rightValid = isValidRowIndex(sortKeys, rightRowIndex);
  if (leftValid !== rightValid) {
    return leftValid;
  }
  if (!leftValid) {
    return false;
  }

  const leftKey = sortKeys[leftRowIndex];
  const rightKey = sortKeys[rightRowIndex];
  return leftKey < rightKey || (leftKey === rightKey && leftRowIndex < rightRowIndex);
}

function isValidRowIndex(sortKeys: Uint32Array, rowIndex: number): boolean {
  return rowIndex !== INVALID_INDEX && rowIndex >= 0 && rowIndex < sortKeys.length;
}

function makeInitialRowIndices(length: number): number[] {
  const paddedLength = getNextPowerOfTwo(length);
  return Array.from({length: paddedLength}, (_, rowIndex) =>
    rowIndex < length ? rowIndex : INVALID_INDEX
  );
}

function getNextPowerOfTwo(length: number): number {
  let paddedLength = 1;
  while (paddedLength < Math.max(length, 1)) {
    paddedLength *= 2;
  }
  return paddedLength;
}

function shuffleSortKeys(sortKeys: Uint32Array): Uint32Array {
  const shuffledSortKeys = sortKeys.slice();
  for (let rowIndex = shuffledSortKeys.length - 1; rowIndex > 0; rowIndex--) {
    const swapIndex = Math.floor(Math.random() * (rowIndex + 1));
    [shuffledSortKeys[rowIndex], shuffledSortKeys[swapIndex]] = [
      shuffledSortKeys[swapIndex],
      shuffledSortKeys[rowIndex]
    ];
  }
  return shuffledSortKeys;
}

function getPassLabel(
  currentPassIndex: number,
  passes: BitonicPass[],
  hasCompletedPass: boolean
): string {
  if (currentPassIndex >= passes.length) {
    return `Complete (${passes.length}/${passes.length})`;
  }

  const passIndex = hasCompletedPass ? currentPassIndex - 1 : currentPassIndex;
  const pass = passes[passIndex];
  const passState = hasCompletedPass ? 'Completed' : 'Next';
  return `${passState} ${passIndex + 1}/${passes.length}: block ${pass.blockWidth}, stride ${pass.compareStride}`;
}

function renderSequence(
  sequence: HTMLElement,
  sortKeys: Uint32Array,
  rowIndices: number[],
  pairs: BitonicPair[]
): void {
  const highlightedPositions = new Set<number>();
  const swappedPositions = new Set<number>();
  for (const pair of pairs) {
    highlightedPositions.add(pair.leftPosition);
    highlightedPositions.add(pair.rightPosition);
    if (pair.swapped) {
      swappedPositions.add(pair.leftPosition);
      swappedPositions.add(pair.rightPosition);
    }
  }

  const maximumKey = sortKeys.reduce(
    (currentMaximumKey, sortKey) => Math.max(currentMaximumKey, sortKey),
    1
  );
  const fragment = document.createDocumentFragment();
  for (let position = 0; position < rowIndices.length; position++) {
    const rowIndex = rowIndices[position];
    const cell = document.createElement('div');
    cell.className = 'sort-cell';
    if (highlightedPositions.has(position)) {
      cell.classList.add('sort-cell--compared');
    }
    if (swappedPositions.has(position)) {
      cell.classList.add('sort-cell--swapped');
    }

    const key = isValidRowIndex(sortKeys, rowIndex) ? sortKeys[rowIndex] : 0;
    cell.style.setProperty('--bar-height', `${Math.max((key / maximumKey) * 100, 8)}%`);
    cell.appendChild(makeElement('div', 'sort-bar'));
    cell.appendChild(
      makeElement('strong', 'sort-key', isValidRowIndex(sortKeys, rowIndex) ? String(key) : '-')
    );
    cell.appendChild(
      makeElement(
        'span',
        'sort-row',
        isValidRowIndex(sortKeys, rowIndex) ? `row ${rowIndex}` : 'pad'
      )
    );
    fragment.appendChild(cell);
  }
  sequence.replaceChildren(fragment);
}

function renderPairs(pairList: HTMLElement, sortKeys: Uint32Array, pairs: BitonicPair[]): void {
  if (pairs.length === 0) {
    pairList.textContent = 'Step to expose compare/swap pairs.';
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const pair of pairs) {
    const direction = pair.ascending ? 'ascending' : 'descending';
    const action = pair.swapped ? 'swap' : 'keep';
    fragment.appendChild(
      makeElement(
        'div',
        `pair ${pair.swapped ? 'pair--swapped' : ''}`,
        `${pair.leftPosition} <-> ${pair.rightPosition} ${direction}: ${formatRowKey(sortKeys, pair.leftRowIndex)} / ${formatRowKey(sortKeys, pair.rightRowIndex)} ${action}`
      )
    );
  }
  pairList.replaceChildren(fragment);
}

function formatRowKey(sortKeys: Uint32Array, rowIndex: number): string {
  return isValidRowIndex(sortKeys, rowIndex)
    ? `row ${rowIndex} key ${sortKeys[rowIndex]}`
    : 'padding';
}

function makeElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  className: string,
  textContent?: string
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName);
  element.className = className;
  if (textContent !== undefined) {
    element.textContent = textContent;
  }
  return element;
}

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) {
    return;
  }

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = BITONIC_ARGSORT_EXAMPLE_STYLE;
  document.head.appendChild(style);
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Static markup for the BitonicArgsort teaching example. */
export const BITONIC_ARGSORT_EXAMPLE_HTML = `
  <header class="bitonic-header">
    <p class="bitonic-eyebrow">@luma.gl/gpgpu/webgpu</p>
    <h1>Bitonic argsort</h1>
    <p class="bitonic-subtitle">
      An Apache Arrow Uint32 sortKey column uploads to GPU storage, then BitonicArgsort returns stable source row indices as GPUVector&lt;'uint32'&gt;.
    </p>
  </header>

  <section class="metric-grid" aria-label="Bitonic argsort metadata">
    <div class="metric">
      <span>Arrow rows</span>
      <strong data-arrow-rows>-</strong>
    </div>
    <div class="metric">
      <span>Input vector</span>
      <strong data-input-vector>-</strong>
    </div>
    <div class="metric">
      <span>Output vector</span>
      <strong data-output-vector>-</strong>
    </div>
    <div class="metric">
      <span>Network pass</span>
      <strong data-current-pass>-</strong>
    </div>
  </section>

  <section class="toolbar" aria-label="Bitonic argsort controls">
    <button type="button" data-shuffle>Shuffle</button>
    <button type="button" data-step>Step</button>
    <button type="button" data-run>Run</button>
    <button type="button" data-reset>Reset</button>
    <p data-status>Preparing example...</p>
  </section>

  <section class="sort-stage" aria-label="Bitonic sort network visualization">
    <div class="stage-header">
      <h2>Current network state</h2>
      <p data-gpu-status>Waiting for WebGPU...</p>
    </div>
    <div class="sort-sequence" data-sequence></div>
    <div class="pair-list" data-pair-list></div>
  </section>

  <section class="output-grid" aria-label="Bitonic argsort output">
    <div class="output-panel">
      <h2>GPUVector output</h2>
      <code data-gpu-output>Run pending</code>
    </div>
    <div class="output-panel">
      <h2>Sorted rows</h2>
      <p data-sorted-rows>Run pending</p>
    </div>
  </section>
`;

/** Example-local styles for the BitonicArgsort teaching example. */
export const BITONIC_ARGSORT_EXAMPLE_STYLE = `
  .bitonic-argsort-example {
    box-sizing: border-box;
    min-height: 100%;
    padding: 22px;
    background: #f7f8fb;
    color: #16202f;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .bitonic-argsort-example * {
    box-sizing: border-box;
  }

  .bitonic-argsort-example h1,
  .bitonic-argsort-example h2,
  .bitonic-argsort-example p {
    margin: 0;
  }

  .bitonic-argsort-example .bitonic-header {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 7px;
    margin-bottom: 16px;
  }

  .bitonic-argsort-example .bitonic-eyebrow {
    color: #4b6b9b;
    font-size: 12px;
    font-weight: 720;
    text-transform: uppercase;
  }

  .bitonic-argsort-example h1 {
    font-size: 28px;
    line-height: 1.1;
  }

  .bitonic-argsort-example .bitonic-subtitle {
    max-width: 900px;
    color: #5b6678;
    font-size: 14px;
    line-height: 1.45;
  }

  .bitonic-argsort-example .metric-grid,
  .bitonic-argsort-example .output-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
  }

  .bitonic-argsort-example .metric,
  .bitonic-argsort-example .sort-stage,
  .bitonic-argsort-example .output-panel {
    border: 1px solid #d9dee8;
    border-radius: 8px;
    background: #fff;
  }

  .bitonic-argsort-example .metric {
    padding: 10px 12px;
  }

  .bitonic-argsort-example .metric span,
  .bitonic-argsort-example .stage-header p,
  .bitonic-argsort-example .toolbar p,
  .bitonic-argsort-example .sort-row,
  .bitonic-argsort-example .pair,
  .bitonic-argsort-example .output-panel p {
    color: #697386;
    font-size: 12px;
  }

  .bitonic-argsort-example .metric strong {
    display: block;
    margin-top: 3px;
    overflow-wrap: anywhere;
    font-size: 14px;
    font-variant-numeric: tabular-nums;
  }

  .bitonic-argsort-example .toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 14px 0;
  }

  .bitonic-argsort-example button {
    border: 1px solid #cfd6e2;
    border-radius: 8px;
    background: #fff;
    color: inherit;
    cursor: pointer;
    font: 600 13px/1.2 Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    padding: 9px 12px;
  }

  .bitonic-argsort-example button:hover:not(:disabled) {
    background: #eef4ff;
    border-color: #9db6df;
  }

  .bitonic-argsort-example button:disabled {
    color: #8b95a5;
    cursor: default;
  }

  .bitonic-argsort-example .toolbar p {
    min-width: 0;
    margin-left: 6px;
    line-height: 1.35;
  }

  .bitonic-argsort-example .toolbar p[data-state="error"] {
    color: #b42318;
  }

  .bitonic-argsort-example .sort-stage {
    padding: 14px;
  }

  .bitonic-argsort-example .stage-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }

  .bitonic-argsort-example h2 {
    font-size: 15px;
    line-height: 1.25;
  }

  .bitonic-argsort-example .sort-sequence {
    display: grid;
    grid-template-columns: repeat(16, minmax(0, 1fr));
    gap: 7px;
    align-items: end;
    min-height: 204px;
    padding: 10px;
    border: 1px solid #e4e8f0;
    border-radius: 8px;
    background: #fbfcfe;
  }

  .bitonic-argsort-example .sort-cell {
    display: grid;
    min-width: 0;
    min-height: 176px;
    align-content: end;
    gap: 5px;
    border: 1px solid #d7deea;
    border-radius: 8px;
    background: #fff;
    padding: 7px;
    transition: border-color 160ms ease, background 160ms ease, transform 160ms ease;
  }

  .bitonic-argsort-example .sort-cell--compared {
    border-color: #4f7ac6;
    background: #eef4ff;
  }

  .bitonic-argsort-example .sort-cell--swapped {
    border-color: #0f8a5f;
    background: #eaf8f1;
    transform: translateY(-4px);
  }

  .bitonic-argsort-example .sort-bar {
    height: var(--bar-height);
    min-height: 10px;
    border-radius: 6px 6px 3px 3px;
    background: linear-gradient(180deg, #5f8bd2 0%, #294c88 100%);
  }

  .bitonic-argsort-example .sort-key {
    font-size: 15px;
    font-variant-numeric: tabular-nums;
    line-height: 1;
  }

  .bitonic-argsort-example .sort-row {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .bitonic-argsort-example .pair-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 7px;
    margin-top: 12px;
  }

  .bitonic-argsort-example .pair {
    border: 1px solid #e4e8f0;
    border-radius: 7px;
    background: #fbfcfe;
    padding: 7px 8px;
    font-family: ui-monospace, "SFMono-Regular", Consolas, monospace;
    line-height: 1.35;
  }

  .bitonic-argsort-example .pair--swapped {
    border-color: #a7dfc7;
    background: #f0fbf6;
    color: #126346;
  }

  .bitonic-argsort-example .output-grid {
    grid-template-columns: minmax(0, 0.9fr) minmax(260px, 1.1fr);
    margin-top: 12px;
  }

  .bitonic-argsort-example .output-panel {
    min-width: 0;
    padding: 12px;
  }

  .bitonic-argsort-example .output-panel code,
  .bitonic-argsort-example .output-panel p {
    display: block;
    margin-top: 8px;
    overflow-wrap: anywhere;
    font-family: ui-monospace, "SFMono-Regular", Consolas, monospace;
    font-size: 12px;
    line-height: 1.5;
  }

  @media (max-width: 900px) {
    .bitonic-argsort-example {
      padding: 14px;
    }

    .bitonic-argsort-example .metric-grid,
    .bitonic-argsort-example .output-grid,
    .bitonic-argsort-example .pair-list {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .bitonic-argsort-example .toolbar,
    .bitonic-argsort-example .stage-header {
      align-items: stretch;
      flex-direction: column;
    }

    .bitonic-argsort-example .toolbar p {
      margin-left: 0;
    }

    .bitonic-argsort-example .sort-sequence {
      grid-template-columns: repeat(8, minmax(0, 1fr));
    }
  }

  @media (max-width: 560px) {
    .bitonic-argsort-example .metric-grid,
    .bitonic-argsort-example .output-grid,
    .bitonic-argsort-example .pair-list {
      grid-template-columns: minmax(0, 1fr);
    }

    .bitonic-argsort-example .sort-sequence {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }
`;
