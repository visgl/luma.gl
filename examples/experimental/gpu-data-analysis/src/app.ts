// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {makeArrowFixedSizeListVector, makeGPUVectorFromArrow} from '@luma.gl/arrow';
import {Buffer, luma, type Device} from '@luma.gl/core';
import {
  GPUCommandGraph,
  GPUGridBinning,
  GPUHistogram,
  GPUReduction,
  type CompiledGPUCommandGraph
} from '@luma.gl/experimental';
import type {GPUVector} from '@luma.gl/tables';
import {webgpuAdapter} from '@luma.gl/webgpu';
import * as arrow from 'apache-arrow';

const APP_ID = 'gpu-data-analysis-app';
const STYLE_ID = 'gpu-data-analysis-style';
const DATASET_LENGTHS = {small: 4096, medium: 65_537, large: 262_144} as const;

type ExampleResources = {
  compiled: CompiledGPUCommandGraph;
  values: GPUVector<'float32'>;
  positions: GPUVector<'float32x2'>;
  outputs: Buffer[];
};

type ExampleElements = {
  bins: HTMLSelectElement;
  compileTime: HTMLElement;
  dataset: HTMLSelectElement;
  grid: HTMLSelectElement;
  heatmap: HTMLElement;
  histogram: HTMLElement;
  nodes: HTMLElement;
  reuse: HTMLElement;
  run: HTMLButtonElement;
  status: HTMLElement;
  validation: HTMLElement;
};

/** Cleanup handle returned by {@link initializeGPUDataAnalysisExample}. */
export type GPUDataAnalysisExampleHandle = {destroy: () => void};

/** Mounts the graph-native GPU data-analysis example into `#gpu-data-analysis-app`. */
export function initializeGPUDataAnalysisExample(): GPUDataAnalysisExampleHandle {
  const root = document.getElementById(APP_ID);
  if (!root) throw new Error(`GPU data-analysis example requires #${APP_ID}`);
  ensureStyles();
  root.innerHTML = EXAMPLE_HTML;
  const example = new GPUDataAnalysisExample(root);
  void example.initialize();
  return {destroy: () => example.destroy()};
}

class GPUDataAnalysisExample {
  private readonly elements: ExampleElements;
  private device: Device | null = null;
  private resources: ExampleResources | null = null;
  private destroyed = false;
  private runVersion = 0;

  private readonly handleRun = (): void => void this.run();

  constructor(root: HTMLElement) {
    this.elements = getElements(root);
    for (const element of [
      this.elements.run,
      this.elements.dataset,
      this.elements.bins,
      this.elements.grid
    ]) {
      element.addEventListener('change', this.handleRun);
    }
    this.elements.run.addEventListener('click', this.handleRun);
  }

  async initialize(): Promise<void> {
    this.setStatus('Requesting a WebGPU device...');
    try {
      this.device = await luma.createDevice({
        type: 'webgpu',
        adapters: [webgpuAdapter],
        createCanvasContext: true
      });
      await this.run();
    } catch (error) {
      this.setStatus(getErrorMessage(error), true);
    }
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.elements.run.removeEventListener('click', this.handleRun);
    for (const element of [this.elements.dataset, this.elements.bins, this.elements.grid]) {
      element.removeEventListener('change', this.handleRun);
    }
    this.releaseResources();
    this.device?.destroy();
    this.device = null;
  }

  private async run(): Promise<void> {
    if (!this.device || this.destroyed) return;
    const version = ++this.runVersion;
    this.elements.run.disabled = true;
    this.setStatus('Uploading Arrow columns and compiling the graph...');
    const length = DATASET_LENGTHS[this.elements.dataset.value as keyof typeof DATASET_LENGTHS];
    const binCount = Number(this.elements.bins.value);
    const gridWidth = Number(this.elements.grid.value);
    const {values, positions} = makeDataset(length);
    let nextResources: ExampleResources | null = null;

    try {
      const arrowValues = arrow.makeVector({type: new arrow.Float32(), data: values});
      const arrowPositions = makeArrowFixedSizeListVector(new arrow.Float32(), 2, positions);
      const gpuValues = makeGPUVectorFromArrow(this.device, arrowValues, {
        name: 'analysis-values',
        format: 'float32'
      });
      const gpuPositions = makeGPUVectorFromArrow(this.device, arrowPositions, {
        name: 'analysis-positions',
        format: 'float32x2'
      });
      const extentBuffer = makeOutputBuffer(this.device, 'extent', 2);
      const histogramBuffer = makeOutputBuffer(this.device, 'histogram', binCount);
      const totalBuffer = makeOutputBuffer(this.device, 'histogram-total', 1);
      const gridBuffer = makeOutputBuffer(this.device, 'grid', gridWidth * gridWidth);
      const outputs = [extentBuffer, histogramBuffer, totalBuffer, gridBuffer];
      const graph = new GPUCommandGraph(this.device, {id: 'gpu-data-analysis-example'});
      const valuesView = graph.importGPUVector('values', gpuValues);
      const positionsView = graph.importGPUVector('positions', gpuPositions);
      const extent = importOutput(graph, extentBuffer, 'extent', 'float32', 2);
      const histogram = importOutput(graph, histogramBuffer, 'histogram', 'uint32', binCount);
      const total = importOutput(graph, totalBuffer, 'total', 'uint32', 1);
      const grid = importOutput(graph, gridBuffer, 'grid', 'uint32', gridWidth * gridWidth);
      new GPUReduction({
        id: 'extent',
        input: valuesView,
        output: extent,
        operation: 'extent'
      }).addToGraph(graph);
      new GPUHistogram({
        id: 'histogram',
        input: valuesView,
        output: histogram,
        domain: extent
      }).addToGraph(graph);
      new GPUReduction({
        id: 'histogram-total',
        input: histogram,
        output: total,
        operation: 'sum'
      }).addToGraph(graph);
      new GPUGridBinning({
        id: 'grid',
        positions: positionsView,
        output: grid,
        gridSize: [gridWidth, gridWidth],
        bounds: [-1, -1, 1, 1]
      }).addToGraph(graph);
      const compileStart = performance.now();
      const compiled = graph.compile();
      const compileTime = performance.now() - compileStart;
      nextResources = {compiled, values: gpuValues, positions: gpuPositions, outputs};

      const commandEncoder = this.device.createCommandEncoder({id: 'gpu-data-analysis-example'});
      compiled.encode(commandEncoder, {parameters: undefined});
      compiled.encode(commandEncoder, {parameters: undefined});
      this.device.submit(commandEncoder.finish());
      const [extentBytes, histogramBytes, totalBytes, gridBytes] = await Promise.all(
        outputs.map(buffer => buffer.readAsync())
      );
      const gpuExtent = Array.from(new Float32Array(extentBytes.buffer, extentBytes.byteOffset, 2));
      const gpuHistogram = Array.from(
        new Uint32Array(histogramBytes.buffer, histogramBytes.byteOffset, binCount)
      );
      const gpuTotal = new Uint32Array(totalBytes.buffer, totalBytes.byteOffset, 1)[0];
      const gpuGrid = Array.from(
        new Uint32Array(gridBytes.buffer, gridBytes.byteOffset, gridWidth * gridWidth)
      );
      if (this.destroyed || version !== this.runVersion) {
        destroyResources(nextResources);
        return;
      }
      const reference = analyzeOnCPU(values, positions, binCount, gridWidth);
      const valid =
        gpuExtent.every((value, index) => Math.abs(value - reference.extent[index]) < 1e-5) &&
        gpuHistogram.every((value, index) => value === reference.histogram[index]) &&
        gpuGrid.every((value, index) => value === reference.grid[index]) &&
        gpuTotal === length;
      this.releaseResources();
      this.resources = nextResources;
      nextResources = null;
      this.elements.nodes.textContent = String(compiled.stats.nodeOrder.length);
      this.elements.reuse.textContent = `${compiled.stats.reusePercentage.toFixed(1)}%`;
      this.elements.compileTime.textContent = `${compileTime.toFixed(1)} ms`;
      this.elements.validation.textContent = valid
        ? `${gpuTotal.toLocaleString()} rows verified after two encodings`
        : 'GPU/CPU mismatch';
      this.elements.validation.dataset.state = valid ? 'ok' : 'error';
      renderHistogram(this.elements.histogram, gpuHistogram);
      renderGrid(this.elements.heatmap, gpuGrid, gridWidth);
      this.setStatus(
        `Extent [${gpuExtent.map(value => value.toFixed(3)).join(', ')}] · ${binCount} bins · ${gridWidth}×${gridWidth} cells`
      );
    } catch (error) {
      destroyResources(nextResources);
      this.setStatus(getErrorMessage(error), true);
    } finally {
      if (!this.destroyed && version === this.runVersion) this.elements.run.disabled = false;
    }
  }

  private releaseResources(): void {
    destroyResources(this.resources);
    this.resources = null;
  }

  private setStatus(message: string, error = false): void {
    this.elements.status.textContent = message;
    this.elements.status.dataset.state = error ? 'error' : 'ok';
  }
}

function makeDataset(length: number): {values: Float32Array; positions: Float32Array} {
  let state = 0x5eed1234;
  const random = (): number => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
  const values = new Float32Array(length);
  const positions = new Float32Array(length * 2);
  for (let index = 0; index < length; index++) {
    const x = random() * 2 - 1;
    const y = random() * 2 - 1;
    positions[index * 2] = x;
    positions[index * 2 + 1] = y;
    values[index] = Math.fround(Math.sin(x * 4) + Math.cos(y * 6) + (random() - 0.5) * 0.35);
  }
  return {values, positions};
}

function analyzeOnCPU(
  values: Float32Array,
  positions: Float32Array,
  binCount: number,
  gridWidth: number
): {extent: [number, number]; histogram: number[]; grid: number[]} {
  let minimum = Number.POSITIVE_INFINITY;
  let maximum = Number.NEGATIVE_INFINITY;
  for (const value of values) {
    minimum = Math.min(minimum, value);
    maximum = Math.max(maximum, value);
  }
  const histogram = Array.from({length: binCount}, () => 0);
  for (const value of values) {
    const bin =
      value === maximum ? binCount - 1 : getFloat32Coordinate(value, minimum, maximum, binCount);
    histogram[bin]++;
  }
  const grid = Array.from({length: gridWidth * gridWidth}, () => 0);
  for (let index = 0; index < values.length; index++) {
    const x = positions[index * 2];
    const y = positions[index * 2 + 1];
    const column = getFloat32Coordinate(x, -1, 1, gridWidth);
    const row = getFloat32Coordinate(y, -1, 1, gridWidth);
    grid[row * gridWidth + column]++;
  }
  return {extent: [minimum, maximum], histogram, grid};
}

function getFloat32Coordinate(
  value: number,
  minimum: number,
  maximum: number,
  size: number
): number {
  if (value === maximum) return size - 1;
  const numerator = Math.fround(Math.fround(value) - Math.fround(minimum));
  const denominator = Math.fround(Math.fround(maximum) - Math.fround(minimum));
  const ratio = Math.fround(numerator / denominator);
  return Math.min(Math.floor(Math.fround(ratio * Math.fround(size))), size - 1);
}

function makeOutputBuffer(device: Device, id: string, length: number): Buffer {
  return device.createBuffer({
    id,
    byteLength: Math.max(length, 1) * 4,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
}

function importOutput<T extends 'float32' | 'uint32'>(
  graph: GPUCommandGraph,
  buffer: Buffer,
  id: string,
  format: T,
  length: number
) {
  const handle = graph.importBuffer(
    {id, byteLength: buffer.byteLength, usage: buffer.usage},
    buffer
  );
  return graph.createBufferView(handle, {format, length});
}

function renderHistogram(element: HTMLElement, counts: number[]): void {
  const maximum = Math.max(...counts, 1);
  element.innerHTML = counts
    .map(
      count => `<i style="height:${Math.max(2, (count / maximum) * 100)}%" title="${count}"></i>`
    )
    .join('');
}

function renderGrid(element: HTMLElement, counts: number[], width: number): void {
  const maximum = Math.max(...counts, 1);
  element.style.gridTemplateColumns = `repeat(${width},1fr)`;
  element.innerHTML = counts
    .map(count => `<i style="opacity:${0.08 + (count / maximum) * 0.92}" title="${count}"></i>`)
    .join('');
}

function destroyResources(resources: ExampleResources | null): void {
  if (!resources) return;
  resources.compiled.destroy();
  resources.values.destroy();
  resources.positions.destroy();
  for (const output of resources.outputs) output.destroy();
}

function getElements(root: HTMLElement): ExampleElements {
  const get = <T extends HTMLElement>(selector: string): T => {
    const element = root.querySelector<T>(selector);
    if (!element) throw new Error(`Missing GPU data-analysis element ${selector}`);
    return element;
  };
  return {
    bins: get('[data-bins]'),
    compileTime: get('[data-compile-time]'),
    dataset: get('[data-dataset]'),
    grid: get('[data-grid]'),
    heatmap: get('[data-heatmap]'),
    histogram: get('[data-histogram]'),
    nodes: get('[data-nodes]'),
    reuse: get('[data-reuse]'),
    run: get('[data-run]'),
    status: get('[data-status]'),
    validation: get('[data-validation]')
  };
}

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = STYLES;
  document.head.appendChild(style);
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

const EXAMPLE_HTML = `<main class="analysis-example"><header><p>EXPERIMENTAL · WEBGPU</p><h1>Command-graph data analysis</h1><span>Extent → histogram → count reduction, composed with spatial grid binning.</span></header><section class="controls"><label>Dataset<select data-dataset><option value="small">4K rows</option><option value="medium" selected>65K rows</option><option value="large">262K rows</option></select></label><label>Histogram bins<select data-bins><option>16</option><option selected>64</option><option>300</option></select></label><label>Grid<select data-grid><option>8</option><option selected>16</option><option>17</option></select></label><button data-run>Run graph</button></section><p class="status" data-status></p><section class="metrics"><article><span>Nodes</span><strong data-nodes>—</strong></article><article><span>Compile</span><strong data-compile-time>—</strong></article><article><span>Transient reuse</span><strong data-reuse>—</strong></article><article><span>Validation</span><strong data-validation>—</strong></article></section><section class="visuals"><article><h2>Histogram</h2><div class="histogram" data-histogram></div></article><article><h2>Grid heatmap</h2><div class="heatmap" data-heatmap></div></article></section></main>`;

const STYLES = `.analysis-example{min-height:100%;box-sizing:border-box;padding:30px;color:#172033;background:radial-gradient(circle at 90% 0,#d9f4ea,transparent 35%),#f6f8fb;font-family:Inter,ui-sans-serif,system-ui}.analysis-example *{box-sizing:border-box}.analysis-example>header,.analysis-example>section,.analysis-example>.status{max-width:1120px;margin-left:auto;margin-right:auto}.analysis-example header p{margin:0;color:#08745b;font-size:12px;font-weight:800;letter-spacing:.13em}.analysis-example h1{margin:5px 0;font-size:clamp(30px,5vw,52px);letter-spacing:-.04em}.analysis-example header span{color:#5d687b}.controls{display:flex;flex-wrap:wrap;gap:12px;align-items:end;margin-top:24px;padding:16px;border:1px solid #ccd6df;border-radius:15px;background:#fff}.controls label{display:grid;gap:5px;color:#596579;font-size:12px;font-weight:700}.controls select,.controls button{height:40px;padding:0 12px;border:1px solid #aebdcc;border-radius:8px;background:#fff;color:#172033}.controls button{background:#08745b;color:#fff;border-color:#08745b;font-weight:700}.status{padding:10px 2px;color:#596579}.status[data-state=error],[data-validation][data-state=error]{color:#b42318}.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.metrics article,.visuals article{padding:16px;border:1px solid #d5dde6;border-radius:14px;background:#fff;box-shadow:0 10px 30px #25324a0a}.metrics span{display:block;color:#667085;font-size:12px}.metrics strong{display:block;margin-top:7px;font-size:18px}.visuals{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}.visuals h2{margin:0 0 12px;font-size:16px}.histogram{height:250px;display:flex;align-items:end;gap:2px;border-bottom:1px solid #b8c3cf}.histogram i{display:block;flex:1;min-width:1px;background:#2da98a;border-radius:2px 2px 0 0}.heatmap{height:250px;aspect-ratio:1;display:grid;gap:1px;margin:auto;background:#e8edf1}.heatmap i{display:block;background:#315cc5}@media(max-width:760px){.analysis-example{padding:18px}.metrics{grid-template-columns:1fr 1fr}.visuals{grid-template-columns:1fr}}`;
