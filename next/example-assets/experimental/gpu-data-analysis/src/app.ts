// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {makeArrowFixedSizeListVector, makeGPUVectorFromArrow} from '@luma.gl/arrow';
import {Buffer, luma, type Device} from '@luma.gl/core';
import {
  GPUCommandGraph,
  GPUGridAggregation,
  GPUGridBinning,
  GPUGroupAggregation,
  GPUHistogram,
  GPUReduction,
  GPUScan,
  type CompiledGPUCommandGraph
} from '@luma.gl/gpgpu/gpu-core';
import {
  column,
  GPUDataFrame,
  parameter,
  type CompiledGPUDataFrameQuery,
  type GPUDataFrameQueryParameters
} from '@luma.gl/experimental/gpu-dataframe';
import {type GPUVector} from '@luma.gl/gpgpu/gpu-data';
import {GPURecordBatch, GPUTable} from '@luma.gl/experimental/gpu-tables';
import {webgpuAdapter} from '@luma.gl/webgpu';
import * as arrow from 'apache-arrow';
import {GPU_DATA_ANALYSIS_STYLES, GPU_DATA_ANALYSIS_TEMPLATE} from './app-shell';
import {
  runGPUDataFrameBenchmark,
  type GPUDataFrameBenchmarkResult
} from './gpu-dataframe-benchmark';

const APP_ID = 'gpu-data-analysis-app';
const STYLE_ID = 'gpu-data-analysis-style';
const DATASET_LENGTHS = {small: 4096, medium: 65_537, large: 262_144} as const;
const IRREGULAR_HISTOGRAM_EDGES = [-2.5, -1.5, -0.75, -0.25, 0, 0.25, 0.75, 1.5, 2.5];
const GROUP_LABELS = ['Northwest', 'Northeast', 'Southwest', 'Southeast'];

type ExampleResources = {
  compiled: CompiledGPUCommandGraph;
  groupKeys: GPUVector<'uint32'>;
  selection: GPUVector<'uint32'>;
  values: GPUVector<'float32'>;
  positions: GPUVector<'float32x2'>;
  sourceValues: Float32Array;
  outputs: Buffer[];
};

type ExampleElements = {
  bins: HTMLSelectElement;
  compileTime: HTMLElement;
  dataset: HTMLSelectElement;
  grid: HTMLSelectElement;
  groupFilter: HTMLSelectElement;
  groups: HTMLElement;
  heatmap: HTMLElement;
  histogram: HTMLElement;
  gpuDataFrameAdjustment: HTMLInputElement;
  gpuDataFrameExecution: HTMLElement;
  gpuDataFrameExpression: HTMLElement;
  gpuDataFrameMultiplier: HTMLSelectElement;
  gpuDataFramePreview: HTMLElement;
  gpuDataFrameRate: HTMLElement;
  gpuDataFrameResult: HTMLElement;
  gpuDataFrameRun: HTMLButtonElement;
  gpuDataFrameSelected: HTMLElement;
  gpuDataFrameThreshold: HTMLInputElement;
  gpuDataFrameBenchmark: HTMLButtonElement;
  gpuDataFrameBenchmarkIterations: HTMLSelectElement;
  gpuDataFrameBenchmarkResults: HTMLElement;
  gpuDataFrameBenchmarkRows: HTMLSelectElement;
  gpuDataFrameBenchmarkStatus: HTMLElement;
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
  root.innerHTML = GPU_DATA_ANALYSIS_TEMPLATE;
  const example = new GPUDataAnalysisExample(root);
  void example.initialize();
  return {destroy: () => example.destroy()};
}

class GPUDataAnalysisExample {
  private readonly elements: ExampleElements;
  private device: Device | null = null;
  private resources: ExampleResources | null = null;
  private benchmarkController: AbortController | null = null;
  private readonly benchmarkHistory: GPUDataFrameBenchmarkResult[] = [];
  private destroyed = false;
  private hasRunGPUDataFrameDemo = false;
  private runVersion = 0;

  private readonly handleRun = (): void => void this.run();
  private readonly handleGPUDataFrameRun = (): void => void this.runGPUDataFrameDemo();
  private readonly handleGPUDataFrameInput = (): void => this.updateGPUDataFrameExpression();
  private readonly handleGPUDataFrameChange = (): void => {
    if (this.hasRunGPUDataFrameDemo) void this.runGPUDataFrameDemo();
  };
  private readonly handleGPUDataFrameBenchmark = (): void => void this.runBenchmark();

  constructor(root: HTMLElement) {
    this.elements = getElements(root);
    for (const element of [
      this.elements.run,
      this.elements.dataset,
      this.elements.bins,
      this.elements.grid,
      this.elements.groupFilter
    ]) {
      element.addEventListener('change', this.handleRun);
    }
    this.elements.run.addEventListener('click', this.handleRun);
    this.elements.gpuDataFrameRun.addEventListener('click', this.handleGPUDataFrameRun);
    for (const control of this.getGPUDataFrameControls()) {
      control.addEventListener('input', this.handleGPUDataFrameInput);
      control.addEventListener('change', this.handleGPUDataFrameChange);
    }
    this.updateGPUDataFrameExpression();
    this.elements.gpuDataFrameBenchmark.addEventListener('click', this.handleGPUDataFrameBenchmark);
  }

  async initialize(): Promise<void> {
    this.setStatus('Requesting a WebGPU device...');
    try {
      const device = await luma.createDevice({
        type: 'webgpu',
        featureLevel: 'max',
        adapters: [webgpuAdapter]
      });
      if (this.destroyed) {
        device.destroy();
        return;
      }
      this.device = device;
      await this.run();
      if (!this.destroyed) {
        this.elements.gpuDataFrameBenchmark.disabled = false;
      }
    } catch (error) {
      this.setStatus(getErrorMessage(error), true);
      this.elements.gpuDataFrameBenchmarkStatus.textContent =
        'WebGPU is unavailable on this device.';
    }
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.benchmarkController?.abort();
    this.elements.run.removeEventListener('click', this.handleRun);
    this.elements.gpuDataFrameRun.removeEventListener('click', this.handleGPUDataFrameRun);
    for (const control of this.getGPUDataFrameControls()) {
      control.removeEventListener('input', this.handleGPUDataFrameInput);
      control.removeEventListener('change', this.handleGPUDataFrameChange);
    }
    this.elements.gpuDataFrameBenchmark.removeEventListener(
      'click',
      this.handleGPUDataFrameBenchmark
    );
    for (const element of [
      this.elements.dataset,
      this.elements.bins,
      this.elements.grid,
      this.elements.groupFilter
    ]) {
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
    const irregularEdges =
      this.elements.bins.value === 'thresholds' ? IRREGULAR_HISTOGRAM_EDGES : undefined;
    const binCount = irregularEdges ? irregularEdges.length - 1 : Number(this.elements.bins.value);
    const gridWidth = Number(this.elements.grid.value);
    const {values, positions, groupKeys} = makeDataset(length);
    const selection = makeSelection(values, this.elements.groupFilter.value);
    let nextResources: ExampleResources | null = null;

    try {
      const arrowValues = arrow.makeVector({type: new arrow.Float32(), data: values});
      const arrowPositions = makeArrowFixedSizeListVector(new arrow.Float32(), 2, positions);
      const arrowGroupKeys = arrow.makeVector({type: new arrow.Uint32(), data: groupKeys});
      const arrowSelection = arrow.makeVector({type: new arrow.Uint32(), data: selection});
      const gpuValues = makeGPUVectorFromArrow(this.device, arrowValues, {
        name: 'analysis-values',
        format: 'float32'
      });
      const gpuPositions = makeGPUVectorFromArrow(this.device, arrowPositions, {
        name: 'analysis-positions',
        format: 'float32x2'
      });
      const gpuGroupKeys = makeGPUVectorFromArrow(this.device, arrowGroupKeys, {
        name: 'analysis-group-keys',
        format: 'uint32'
      });
      const gpuSelection = makeGPUVectorFromArrow(this.device, arrowSelection, {
        name: 'analysis-selection',
        format: 'uint32'
      });
      const extentBuffer = makeOutputBuffer(this.device, 'extent', 2);
      const histogramBuffer = makeOutputBuffer(this.device, 'histogram', binCount);
      const histogramEdgesBuffer = irregularEdges
        ? this.device.createBuffer({
            id: 'histogram-edges',
            data: Float32Array.from(irregularEdges),
            usage: Buffer.STORAGE | Buffer.COPY_DST
          })
        : null;
      const cumulativeHistogramBuffer = makeOutputBuffer(
        this.device,
        'cumulative-histogram',
        binCount
      );
      const gridBuffer = makeOutputBuffer(this.device, 'grid', gridWidth * gridWidth);
      const gridWeightSumsBuffer = makeOutputBuffer(
        this.device,
        'grid-weight-sums',
        gridWidth * gridWidth
      );
      const gridWeightMinimumsBuffer = makeOutputBuffer(
        this.device,
        'grid-weight-minimums',
        gridWidth * gridWidth
      );
      const gridWeightMaximumsBuffer = makeOutputBuffer(
        this.device,
        'grid-weight-maximums',
        gridWidth * gridWidth
      );
      const gridWeightMeansBuffer = makeOutputBuffer(
        this.device,
        'grid-weight-means',
        gridWidth * gridWidth
      );
      const gridSegmentFlagsBuffer = makeGridSegmentFlagsBuffer(this.device, gridWidth);
      const cumulativeGridBuffer = makeOutputBuffer(
        this.device,
        'cumulative-grid-rows',
        gridWidth * gridWidth
      );
      const groupCountsBuffer = makeOutputBuffer(this.device, 'group-counts', GROUP_LABELS.length);
      const groupMeansBuffer = makeOutputBuffer(this.device, 'group-means', GROUP_LABELS.length);
      const outputs = [
        extentBuffer,
        ...(histogramEdgesBuffer ? [histogramEdgesBuffer] : []),
        histogramBuffer,
        cumulativeHistogramBuffer,
        gridBuffer,
        gridWeightSumsBuffer,
        gridWeightMinimumsBuffer,
        gridWeightMaximumsBuffer,
        gridWeightMeansBuffer,
        gridSegmentFlagsBuffer,
        cumulativeGridBuffer,
        groupCountsBuffer,
        groupMeansBuffer
      ];
      const graph = new GPUCommandGraph(this.device, {id: 'gpu-data-analysis-example'});
      const valuesImport = graph.importGPUVector('values', gpuValues);
      const positionsImport = graph.importGPUVector('positions', gpuPositions);
      const groupKeysImport = graph.importGPUVector('group-keys', gpuGroupKeys);
      const selectionImport = graph.importGPUVector('selection', gpuSelection);
      const extent = importOutput(graph, extentBuffer, 'extent', 'float32', 2);
      const histogram = importOutput(graph, histogramBuffer, 'histogram', 'uint32', binCount);
      const histogramEdges =
        histogramEdgesBuffer && irregularEdges
          ? importOutput(
              graph,
              histogramEdgesBuffer,
              'histogram-edges',
              'float32',
              irregularEdges.length
            )
          : undefined;
      const cumulativeHistogram = importOutput(
        graph,
        cumulativeHistogramBuffer,
        'cumulative-histogram',
        'uint32',
        binCount
      );
      const grid = importOutput(graph, gridBuffer, 'grid', 'uint32', gridWidth * gridWidth);
      const gridWeightSums = importOutput(
        graph,
        gridWeightSumsBuffer,
        'grid-weight-sums',
        'float32',
        gridWidth * gridWidth
      );
      const gridWeightMinimums = importOutput(
        graph,
        gridWeightMinimumsBuffer,
        'grid-weight-minimums',
        'float32',
        gridWidth * gridWidth
      );
      const gridWeightMaximums = importOutput(
        graph,
        gridWeightMaximumsBuffer,
        'grid-weight-maximums',
        'float32',
        gridWidth * gridWidth
      );
      const gridWeightMeans = importOutput(
        graph,
        gridWeightMeansBuffer,
        'grid-weight-means',
        'float32',
        gridWidth * gridWidth
      );
      const gridSegmentFlags = importOutput(
        graph,
        gridSegmentFlagsBuffer,
        'grid-segment-flags',
        'uint32',
        gridWidth * gridWidth
      );
      const cumulativeGrid = importOutput(
        graph,
        cumulativeGridBuffer,
        'cumulative-grid-rows',
        'uint32',
        gridWidth * gridWidth
      );
      const groupCounts = importOutput(
        graph,
        groupCountsBuffer,
        'group-counts',
        'uint32',
        GROUP_LABELS.length
      );
      const groupMeans = importOutput(
        graph,
        groupMeansBuffer,
        'group-means',
        'float32',
        GROUP_LABELS.length
      );
      new GPUReduction({
        id: 'extent',
        input: valuesImport,
        output: extent,
        operation: 'extent'
      }).addToGraph(graph);
      new GPUHistogram({
        id: 'histogram',
        input: valuesImport,
        output: histogram,
        ...(histogramEdges ? {edges: histogramEdges} : {domain: extent})
      }).addToGraph(graph);
      new GPUScan({
        id: 'cumulative-histogram',
        input: histogram,
        output: cumulativeHistogram,
        mode: 'inclusive'
      }).addToGraph(graph);
      new GPUGridBinning({
        id: 'grid',
        positions: positionsImport,
        output: grid,
        gridSize: [gridWidth, gridWidth],
        bounds: [-1, -1, 1, 1]
      }).addToGraph(graph);
      new GPUGridAggregation({
        id: 'grid-weight-sums',
        positions: positionsImport,
        weights: valuesImport,
        output: gridWeightSums,
        gridSize: [gridWidth, gridWidth],
        bounds: [-1, -1, 1, 1]
      }).addToGraph(graph);
      new GPUGridAggregation({
        id: 'grid-weight-minimums',
        positions: positionsImport,
        weights: valuesImport,
        output: gridWeightMinimums,
        operation: 'min',
        gridSize: [gridWidth, gridWidth],
        bounds: [-1, -1, 1, 1]
      }).addToGraph(graph);
      new GPUGridAggregation({
        id: 'grid-weight-maximums',
        positions: positionsImport,
        weights: valuesImport,
        output: gridWeightMaximums,
        operation: 'max',
        gridSize: [gridWidth, gridWidth],
        bounds: [-1, -1, 1, 1]
      }).addToGraph(graph);
      new GPUGridAggregation({
        id: 'grid-weight-means',
        positions: positionsImport,
        weights: valuesImport,
        output: gridWeightMeans,
        operation: 'mean',
        gridSize: [gridWidth, gridWidth],
        bounds: [-1, -1, 1, 1]
      }).addToGraph(graph);
      new GPUScan({
        id: 'cumulative-grid-rows',
        input: grid,
        output: cumulativeGrid,
        mode: 'inclusive',
        segmentFlags: gridSegmentFlags
      }).addToGraph(graph);
      new GPUGroupAggregation({
        id: 'group-counts',
        keys: groupKeysImport,
        mask: selectionImport,
        output: groupCounts
      }).addToGraph(graph);
      new GPUGroupAggregation({
        id: 'group-means',
        keys: groupKeysImport,
        values: valuesImport,
        mask: selectionImport,
        output: groupMeans,
        operation: 'mean'
      }).addToGraph(graph);
      const compileStart = performance.now();
      const compiled = graph.compile();
      const compileTime = performance.now() - compileStart;
      nextResources = {
        compiled,
        values: gpuValues,
        positions: gpuPositions,
        groupKeys: gpuGroupKeys,
        selection: gpuSelection,
        sourceValues: values,
        outputs
      };

      const commandEncoder = this.device.createCommandEncoder({id: 'gpu-data-analysis-example'});
      compiled.encode(commandEncoder, {parameters: undefined});
      compiled.encode(commandEncoder, {parameters: undefined});
      this.device.submit(commandEncoder.finish());
      const [
        extentBytes,
        histogramBytes,
        cumulativeHistogramBytes,
        gridBytes,
        gridWeightSumsBytes,
        gridWeightMinimumsBytes,
        gridWeightMaximumsBytes,
        gridWeightMeansBytes,
        cumulativeGridBytes,
        groupCountsBytes,
        groupMeansBytes
      ] = await Promise.all(
        [
          extentBuffer,
          histogramBuffer,
          cumulativeHistogramBuffer,
          gridBuffer,
          gridWeightSumsBuffer,
          gridWeightMinimumsBuffer,
          gridWeightMaximumsBuffer,
          gridWeightMeansBuffer,
          cumulativeGridBuffer,
          groupCountsBuffer,
          groupMeansBuffer
        ].map(buffer => buffer.readAsync())
      );
      const gpuExtent = Array.from(new Float32Array(extentBytes.buffer, extentBytes.byteOffset, 2));
      const gpuHistogram = Array.from(
        new Uint32Array(histogramBytes.buffer, histogramBytes.byteOffset, binCount)
      );
      const gpuCumulativeHistogram = Array.from(
        new Uint32Array(
          cumulativeHistogramBytes.buffer,
          cumulativeHistogramBytes.byteOffset,
          binCount
        )
      );
      const gpuTotal = gpuCumulativeHistogram.at(-1) ?? 0;
      const gpuGrid = Array.from(
        new Uint32Array(gridBytes.buffer, gridBytes.byteOffset, gridWidth * gridWidth)
      );
      const gpuGridWeightSums = Array.from(
        new Float32Array(
          gridWeightSumsBytes.buffer,
          gridWeightSumsBytes.byteOffset,
          gridWidth * gridWidth
        )
      );
      const gpuGridWeightMinimums = Array.from(
        new Float32Array(
          gridWeightMinimumsBytes.buffer,
          gridWeightMinimumsBytes.byteOffset,
          gridWidth * gridWidth
        )
      );
      const gpuGridWeightMaximums = Array.from(
        new Float32Array(
          gridWeightMaximumsBytes.buffer,
          gridWeightMaximumsBytes.byteOffset,
          gridWidth * gridWidth
        )
      );
      const gpuGridWeightMeans = Array.from(
        new Float32Array(
          gridWeightMeansBytes.buffer,
          gridWeightMeansBytes.byteOffset,
          gridWidth * gridWidth
        )
      );
      const gpuCumulativeGrid = Array.from(
        new Uint32Array(
          cumulativeGridBytes.buffer,
          cumulativeGridBytes.byteOffset,
          gridWidth * gridWidth
        )
      );
      const gpuGroupCounts = Array.from(
        new Uint32Array(groupCountsBytes.buffer, groupCountsBytes.byteOffset, GROUP_LABELS.length)
      );
      const gpuGroupMeans = Array.from(
        new Float32Array(groupMeansBytes.buffer, groupMeansBytes.byteOffset, GROUP_LABELS.length)
      );
      if (this.destroyed || version !== this.runVersion) {
        destroyResources(nextResources);
        return;
      }
      const reference = analyzeOnCPU(
        values,
        positions,
        groupKeys,
        selection,
        binCount,
        gridWidth,
        irregularEdges
      );
      const valid =
        gpuExtent.every((value, index) => Math.abs(value - reference.extent[index]) < 1e-5) &&
        gpuHistogram.every((value, index) => value === reference.histogram[index]) &&
        gpuCumulativeHistogram.every(
          (value, index) => value === reference.cumulativeHistogram[index]
        ) &&
        gpuGrid.every((value, index) => value === reference.grid[index]) &&
        gpuGridWeightSums.every((value, index) =>
          approximatelyEqual(value, reference.gridWeightSums[index])
        ) &&
        gpuGridWeightMinimums.every((value, index) =>
          approximatelyEqual(value, reference.gridWeightMinimums[index])
        ) &&
        gpuGridWeightMaximums.every((value, index) =>
          approximatelyEqual(value, reference.gridWeightMaximums[index])
        ) &&
        gpuGridWeightMeans.every((value, index) =>
          approximatelyEqual(value, reference.gridWeightMeans[index])
        ) &&
        gpuCumulativeGrid.every((value, index) => value === reference.cumulativeGrid[index]) &&
        gpuGroupCounts.every((value, index) => value === reference.groupCounts[index]) &&
        gpuGroupMeans.every((value, index) =>
          approximatelyEqual(value, reference.groupMeans[index])
        ) &&
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
      renderHistogram(
        this.elements.histogram,
        gpuHistogram,
        gpuCumulativeHistogram,
        irregularEdges
      );
      renderGrid(
        this.elements.heatmap,
        gpuGrid,
        gpuGridWeightSums,
        gpuGridWeightMinimums,
        gpuGridWeightMaximums,
        gpuGridWeightMeans,
        gpuCumulativeGrid,
        gridWidth
      );
      renderGroups(this.elements.groups, gpuGroupCounts, gpuGroupMeans);
      const selectedCount = gpuGroupCounts.reduce((sum, count) => sum + count, 0);
      this.setStatus(
        `Extent [${gpuExtent.map(value => value.toFixed(3)).join(', ')}] · ${irregularEdges ? 'threshold' : 'uniform'} ${binCount}-bin histogram · ${selectedCount.toLocaleString()} grouped rows · ${gridWidth}×${gridWidth} cells`
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

  /** Runs an opt-in dataframe derivation directly over the existing Arrow-uploaded GPU columns. */
  private async runGPUDataFrameDemo(): Promise<void> {
    const device = this.device;
    const resources = this.resources;
    if (!device || !resources || this.destroyed) {
      this.elements.gpuDataFrameResult.textContent = 'Run the analysis graph first.';
      return;
    }

    const adjustment = Number(this.elements.gpuDataFrameAdjustment.value);
    const multiplier = Number(this.elements.gpuDataFrameMultiplier.value);
    const threshold = Number(this.elements.gpuDataFrameThreshold.value);
    if (![adjustment, multiplier, threshold].every(Number.isFinite)) {
      this.elements.gpuDataFrameResult.textContent = 'Every expression parameter must be finite.';
      return;
    }

    this.hasRunGPUDataFrameDemo = true;
    this.elements.gpuDataFrameRun.disabled = true;
    this.elements.gpuDataFrameResult.textContent = 'Compiling GPU-resident derived columns...';
    this.elements.gpuDataFrameResult.dataset.state = 'running';
    const executionStarted = performance.now();
    let frame: GPUDataFrame<{value: 'float32'; category: 'uint32'}> | undefined;
    let compiled:
      | CompiledGPUDataFrameQuery<{category: 'uint32'; adjustedValue: 'float32'}>
      | undefined;

    try {
      const batches = resources.values.data.map(
        (valueData, batchIndex) =>
          new GPURecordBatch<{value: 'float32'; category: 'uint32'}>({
            gpuData: {value: valueData, category: resources.groupKeys.data[batchIndex]}
          })
      );
      frame = new GPUDataFrame({table: new GPUTable({batches})});
      const query = frame
        .withColumn(
          'adjustedValue',
          column('value')
            .multiply(parameter('multiplier', multiplier))
            .add(parameter('adjustment', adjustment))
        )
        .filter(column('adjustedValue').greaterThan(parameter('threshold', threshold)))
        .select(['category', 'adjustedValue']);
      const graph = new GPUCommandGraph<GPUDataFrameQueryParameters>(device, {
        id: 'gpu-data-analysis-gpu-dataframe-derived-demo'
      });
      compiled = query.compile(graph);

      const commandEncoder = device.createCommandEncoder({id: 'gpu-dataframe-derived-demo'});
      compiled.encode(commandEncoder, {adjustment, multiplier, threshold});
      device.submit(commandEncoder.finish());

      const countData = compiled.selectedCounts.data[0];
      const derivedData = compiled.table.gpuVectors.adjustedValue.data[0];
      const countBuffer =
        countData.buffer instanceof Buffer ? countData.buffer : countData.buffer.buffer;
      const derivedBuffer =
        derivedData.buffer instanceof Buffer ? derivedData.buffer : derivedData.buffer.buffer;
      const sampleLength = Math.min(derivedData.length, 4);
      const [countBytes, sampleBytes] = await Promise.all([
        countBuffer.readAsync(countData.byteOffset, Uint32Array.BYTES_PER_ELEMENT),
        derivedBuffer.readAsync(
          derivedData.byteOffset,
          sampleLength * Float32Array.BYTES_PER_ELEMENT
        )
      ]);
      const selectedCount = new Uint32Array(countBytes.buffer, countBytes.byteOffset, 1)[0];
      const expectedCount = resources.sourceValues.reduce(
        (count, value) => count + Number(value * multiplier + adjustment > threshold),
        0
      );
      const sample = Array.from(
        new Float32Array(sampleBytes.buffer, sampleBytes.byteOffset, sampleLength),
        value => value.toFixed(2)
      );

      if (!this.destroyed && this.resources === resources) {
        const validation = selectedCount === expectedCount ? 'CPU verified' : 'GPU/CPU mismatch';
        const selectedPercentage = (selectedCount / resources.sourceValues.length) * 100;
        this.elements.gpuDataFrameSelected.textContent = selectedCount.toLocaleString();
        this.elements.gpuDataFrameRate.textContent = `${selectedPercentage.toFixed(1)}%`;
        this.elements.gpuDataFrameExecution.textContent = `${(
          performance.now() - executionStarted
        ).toFixed(1)} ms`;
        this.elements.gpuDataFramePreview.textContent = sample.join('   ');
        this.elements.gpuDataFrameResult.dataset.state =
          selectedCount === expectedCount ? 'verified' : 'error';
        this.elements.gpuDataFrameResult.textContent =
          `${selectedCount.toLocaleString()} selected rows · adjusted = value × ${multiplier} + ${adjustment} · ` +
          `first GPU values [${sample.join(', ')}] · ${validation}`;
      }
    } catch (error) {
      if (!this.destroyed) {
        this.elements.gpuDataFrameResult.textContent = getErrorMessage(error);
        this.elements.gpuDataFrameResult.dataset.state = 'error';
      }
    } finally {
      compiled?.destroy();
      frame?.destroy();
      if (!this.destroyed) this.elements.gpuDataFrameRun.disabled = false;
    }
  }

  /** Keeps the visible expression synchronized without allocating or dispatching GPU work. */
  private updateGPUDataFrameExpression(): void {
    this.elements.gpuDataFrameExpression.textContent =
      `value × ${this.elements.gpuDataFrameMultiplier.value} + ` +
      `${this.elements.gpuDataFrameAdjustment.value} > ${this.elements.gpuDataFrameThreshold.value}`;
  }

  /** Returns the three lightweight controls that parameterize the reusable dataframe plan. */
  private getGPUDataFrameControls(): (HTMLInputElement | HTMLSelectElement)[] {
    return [
      this.elements.gpuDataFrameMultiplier,
      this.elements.gpuDataFrameAdjustment,
      this.elements.gpuDataFrameThreshold
    ];
  }

  private setStatus(message: string, error = false): void {
    this.elements.status.textContent = message;
    this.elements.status.dataset.state = error ? 'error' : 'ok';
  }

  /** Executes optional, bounded CPU/GPU comparisons only after an explicit user request. */
  private async runBenchmark(): Promise<void> {
    if (!this.device || this.destroyed || this.benchmarkController) return;
    const controller = new AbortController();
    this.benchmarkController = controller;
    this.elements.gpuDataFrameBenchmark.disabled = true;
    this.elements.gpuDataFrameBenchmarkResults.dataset.state = 'running';
    this.elements.gpuDataFrameBenchmarkResults.dataset.validated = 'false';
    const rowCount = Number(this.elements.gpuDataFrameBenchmarkRows.value);
    const iterations = Number(this.elements.gpuDataFrameBenchmarkIterations.value);
    this.elements.gpuDataFrameBenchmarkStatus.textContent = `Preparing ${rowCount.toLocaleString()} nullable Arrow rows and ${iterations} measured samples...`;

    try {
      const result = await runGPUDataFrameBenchmark(this.device, {
        rowCount,
        iterations,
        warmupIterations: 1,
        signal: controller.signal
      });
      if (this.destroyed || controller.signal.aborted) return;
      this.benchmarkHistory.push(result);
      renderGPUDataFrameBenchmark(this.elements, result, this.benchmarkHistory);
    } catch (error) {
      if (this.destroyed || controller.signal.aborted) return;
      this.elements.gpuDataFrameBenchmarkResults.dataset.state = 'error';
      this.elements.gpuDataFrameBenchmarkStatus.textContent = getErrorMessage(error);
    } finally {
      if (this.benchmarkController === controller) {
        this.benchmarkController = null;
      }
      if (!this.destroyed) {
        this.elements.gpuDataFrameBenchmark.disabled = false;
      }
    }
  }
}

function makeDataset(length: number): {
  values: Float32Array;
  positions: Float32Array;
  groupKeys: Uint32Array;
} {
  let state = 0x5eed1234;
  const random = (): number => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
  const values = new Float32Array(length);
  const positions = new Float32Array(length * 2);
  const groupKeys = new Uint32Array(length);
  for (let index = 0; index < length; index++) {
    const x = random() * 2 - 1;
    const y = random() * 2 - 1;
    positions[index * 2] = x;
    positions[index * 2 + 1] = y;
    groupKeys[index] = (y < 0 ? 2 : 0) + (x >= 0 ? 1 : 0);
    values[index] = Math.fround(Math.sin(x * 4) + Math.cos(y * 6) + (random() - 0.5) * 0.35);
  }
  return {values, positions, groupKeys};
}

function makeSelection(values: Float32Array, filter: string): Uint32Array {
  return Uint32Array.from(values, value => {
    if (filter === 'positive') return Number(value >= 0);
    if (filter === 'negative') return Number(value < 0);
    return 1;
  });
}

function analyzeOnCPU(
  values: Float32Array,
  positions: Float32Array,
  groupKeys: Uint32Array,
  selection: Uint32Array,
  binCount: number,
  gridWidth: number,
  histogramEdges?: readonly number[]
): {
  extent: [number, number];
  histogram: number[];
  cumulativeHistogram: number[];
  grid: number[];
  gridWeightSums: number[];
  gridWeightMinimums: number[];
  gridWeightMaximums: number[];
  gridWeightMeans: number[];
  cumulativeGrid: number[];
  groupCounts: number[];
  groupMeans: number[];
} {
  let minimum = Number.POSITIVE_INFINITY;
  let maximum = Number.NEGATIVE_INFINITY;
  for (const value of values) {
    minimum = Math.min(minimum, value);
    maximum = Math.max(maximum, value);
  }
  const histogram = Array.from({length: binCount}, () => 0);
  for (const value of values) {
    if (histogramEdges) {
      if (value < histogramEdges[0] || value > histogramEdges[binCount]) continue;
      let lower = 0;
      let upper = binCount;
      while (lower < upper) {
        const middle = lower + Math.floor((upper - lower) / 2);
        if (value < histogramEdges[middle + 1]) upper = middle;
        else lower = middle + 1;
      }
      histogram[Math.min(lower, binCount - 1)]++;
    } else {
      const bin =
        value === maximum ? binCount - 1 : getFloat32Coordinate(value, minimum, maximum, binCount);
      histogram[bin]++;
    }
  }
  let histogramPrefix = 0;
  const cumulativeHistogram = histogram.map(count => (histogramPrefix += count));
  const grid = Array.from({length: gridWidth * gridWidth}, () => 0);
  const gridWeightSums = Array.from({length: gridWidth * gridWidth}, () => 0);
  const gridWeightMinimums = Array.from(
    {length: gridWidth * gridWidth},
    () => Number.POSITIVE_INFINITY
  );
  const gridWeightMaximums = Array.from(
    {length: gridWidth * gridWidth},
    () => Number.NEGATIVE_INFINITY
  );
  for (let index = 0; index < values.length; index++) {
    const x = positions[index * 2];
    const y = positions[index * 2 + 1];
    const column = getFloat32Coordinate(x, -1, 1, gridWidth);
    const row = getFloat32Coordinate(y, -1, 1, gridWidth);
    const cellIndex = row * gridWidth + column;
    grid[cellIndex]++;
    gridWeightSums[cellIndex] = Math.fround(gridWeightSums[cellIndex] + values[index]);
    gridWeightMinimums[cellIndex] = Math.min(gridWeightMinimums[cellIndex], values[index]);
    gridWeightMaximums[cellIndex] = Math.max(gridWeightMaximums[cellIndex], values[index]);
  }
  const gridWeightMeans = gridWeightSums.map((sum, index) =>
    grid[index] === 0 ? Number.NaN : Math.fround(sum / grid[index])
  );
  for (let index = 0; index < grid.length; index++) {
    if (grid[index] === 0) {
      gridWeightMinimums[index] = Number.NaN;
      gridWeightMaximums[index] = Number.NaN;
    }
  }
  let gridPrefix = 0;
  const cumulativeGrid = grid.map((count, index) => {
    if (index % gridWidth === 0) gridPrefix = 0;
    gridPrefix += count;
    return gridPrefix;
  });
  const groupCounts = Array.from({length: GROUP_LABELS.length}, () => 0);
  const groupSums = Array.from({length: GROUP_LABELS.length}, () => 0);
  for (let index = 0; index < groupKeys.length; index++) {
    if (selection[index] !== 0 && groupKeys[index] < groupCounts.length) {
      const groupIndex = groupKeys[index];
      groupCounts[groupIndex]++;
      groupSums[groupIndex] = Math.fround(groupSums[groupIndex] + values[index]);
    }
  }
  const groupMeans = groupSums.map((sum, index) =>
    groupCounts[index] === 0 ? Number.NaN : Math.fround(sum / groupCounts[index])
  );
  return {
    extent: [minimum, maximum],
    histogram,
    cumulativeHistogram,
    grid,
    gridWeightSums,
    gridWeightMinimums,
    gridWeightMaximums,
    gridWeightMeans,
    cumulativeGrid,
    groupCounts,
    groupMeans
  };
}

function approximatelyEqual(value: number, reference: number): boolean {
  if (Number.isNaN(value) || Number.isNaN(reference)) {
    return Number.isNaN(value) && Number.isNaN(reference);
  }
  if (value === reference) return true;
  return Math.abs(value - reference) <= Math.max(1e-4, Math.abs(reference) * 2e-4);
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

function makeGridSegmentFlagsBuffer(device: Device, gridWidth: number): Buffer {
  return device.createBuffer({
    id: 'grid-segment-flags',
    data: Uint32Array.from({length: gridWidth * gridWidth}, (_, index) =>
      Number(index % gridWidth === 0)
    ),
    usage: Buffer.STORAGE | Buffer.COPY_DST
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
  return graph.createDataView(handle, {format, length});
}

function renderHistogram(
  element: HTMLElement,
  counts: number[],
  cumulativeCounts: number[],
  edges?: readonly number[]
): void {
  const maximum = Math.max(...counts, 1);
  element.innerHTML = counts
    .map((count, index) => {
      const interval = edges
        ? ` · [${edges[index]}, ${edges[index + 1]}${index === counts.length - 1 ? ']' : ')'}`
        : '';
      return `<i style="height:${Math.max(2, (count / maximum) * 100)}%" title="${count} rows · ${cumulativeCounts[index]} cumulative${interval}"></i>`;
    })
    .join('');
}

function renderGrid(
  element: HTMLElement,
  counts: number[],
  weightSums: number[],
  weightMinimums: number[],
  weightMaximums: number[],
  weightMeans: number[],
  cumulativeCounts: number[],
  width: number
): void {
  const maximum = Math.max(...counts, 1);
  element.style.gridTemplateColumns = `repeat(${width},1fr)`;
  element.innerHTML = counts
    .map(
      (count, index) =>
        `<i style="opacity:${0.08 + (count / maximum) * 0.92}" title="${count} rows · sum ${formatStatistic(weightSums[index])} · mean ${formatStatistic(weightMeans[index])} · range [${formatStatistic(weightMinimums[index])}, ${formatStatistic(weightMaximums[index])}] · ${cumulativeCounts[index]} row cumulative"></i>`
    )
    .join('');
}

function renderGroups(element: HTMLElement, counts: number[], means: number[]): void {
  const maximum = Math.max(...counts, 1);
  element.innerHTML = counts
    .map(
      (count, index) =>
        `<div title="${count.toLocaleString()} selected rows · mean ${formatStatistic(means[index])}"><span>${GROUP_LABELS[index]}</span><i style="width:${(count / maximum) * 100}%"></i><strong>${count.toLocaleString()} · μ ${formatStatistic(means[index])}</strong></div>`
    )
    .join('');
}

function formatStatistic(value: number): string {
  return Number.isNaN(value) ? 'empty' : value.toFixed(3);
}

function destroyResources(resources: ExampleResources | null): void {
  if (!resources) return;
  resources.compiled.destroy();
  resources.values.destroy();
  resources.positions.destroy();
  resources.groupKeys.destroy();
  resources.selection.destroy();
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
    groupFilter: get('[data-group-filter]'),
    groups: get('[data-groups]'),
    heatmap: get('[data-heatmap]'),
    histogram: get('[data-histogram]'),
    gpuDataFrameAdjustment: get('[data-gpu-dataframe-adjustment]'),
    gpuDataFrameExecution: get('[data-gpu-dataframe-execution]'),
    gpuDataFrameExpression: get('[data-gpu-dataframe-expression]'),
    gpuDataFrameMultiplier: get('[data-gpu-dataframe-multiplier]'),
    gpuDataFramePreview: get('[data-gpu-dataframe-preview]'),
    gpuDataFrameRate: get('[data-gpu-dataframe-rate]'),
    gpuDataFrameResult: get('[data-gpu-dataframe-result]'),
    gpuDataFrameRun: get('[data-gpu-dataframe-run]'),
    gpuDataFrameSelected: get('[data-gpu-dataframe-selected]'),
    gpuDataFrameThreshold: get('[data-gpu-dataframe-threshold]'),
    gpuDataFrameBenchmark: get('[data-gpu-dataframe-benchmark]'),
    gpuDataFrameBenchmarkIterations: get('[data-gpu-dataframe-benchmark-iterations]'),
    gpuDataFrameBenchmarkResults: get('[data-gpu-dataframe-benchmark-phases]'),
    gpuDataFrameBenchmarkRows: get('[data-gpu-dataframe-benchmark-rows]'),
    gpuDataFrameBenchmarkStatus: get('[data-gpu-dataframe-benchmark-status]'),
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
  style.textContent = GPU_DATA_ANALYSIS_STYLES;
  document.head.appendChild(style);
}

/** Renders only bounded, independently fenced phase timings and explicit CPU-oracle validation. */
function renderGPUDataFrameBenchmark(
  elements: ExampleElements,
  result: GPUDataFrameBenchmarkResult,
  history: readonly GPUDataFrameBenchmarkResult[]
): void {
  const timingRows = [
    ['upload', 'Arrow upload', result.timings.uploadMilliseconds],
    ['compile', 'Graph compilation', result.timings.compileMilliseconds],
    ['index', 'Standalone hash-index build', result.timings.indexMilliseconds],
    ['execution', 'Fenced WebGPU execution', result.timings.executionMilliseconds],
    ['readback', 'Bounded result readback', result.timings.readbackMilliseconds],
    ['cpu', 'Equivalent CPU reference', result.timings.cpuMilliseconds]
  ] as const;
  const phaseTable = `<table><thead><tr><th scope="col">Phase</th><th scope="col">Milliseconds</th></tr></thead><tbody>${timingRows
    .map(
      ([phase, label, milliseconds]) =>
        `<tr data-gpu-dataframe-phase="${phase}"><th scope="row">${label}</th><td>${milliseconds.toFixed(2)}</td></tr>`
    )
    .join('')}</tbody></table>`;
  const workloadRows = Object.entries(result.workloads)
    .map(
      ([name, workload]) =>
        `<tr data-gpu-dataframe-workload="${name}"><th scope="row">${name}</th><td>${workload.cpuMilliseconds.toFixed(2)}</td><td>${workload.gpuMilliseconds.toFixed(2)}</td><td>${formatBenchmarkThroughput(workload.gpuRowsPerSecond)}</td><td>${workload.speedup.toFixed(2)}×</td></tr>`
    )
    .join('');
  const crossover = [...history]
    .sort((left, right) => left.rowCount - right.rowCount)
    .find(
      measurement => measurement.timings.cpuMilliseconds > measurement.timings.executionMilliseconds
    );
  const crossoverMessage = crossover
    ? `Measured end-to-end GPU crossover: ${crossover.rowCount.toLocaleString()} rows.`
    : 'No GPU crossover observed yet; compare larger datasets on this device.';
  elements.gpuDataFrameBenchmarkResults.innerHTML = `${phaseTable}
    <p class="workload-title">MEDIAN OPERATION COMPARISONS</p>
    <p class="workload-metadata">${result.measurement.warmupIterations} warmup · ${result.measurement.iterations} measured sample${result.measurement.iterations === 1 ? '' : 's'} · GPU durations include completion fences</p>
    <table class="workload-table"><thead><tr><th scope="col">Operation</th><th scope="col">CPU ms</th><th scope="col">GPU ms</th><th scope="col">GPU rows/s</th><th scope="col">GPU speedup</th></tr></thead><tbody>${workloadRows}</tbody></table>
    <p class="benchmark-crossover" data-gpu-dataframe-crossover>${crossoverMessage}</p>`;
  const validated = Object.values(result.validation).every(Boolean);
  elements.gpuDataFrameBenchmarkResults.dataset.state = validated ? 'ok' : 'error';
  elements.gpuDataFrameBenchmarkResults.dataset.validated = String(validated);
  elements.gpuDataFrameBenchmarkStatus.textContent = validated
    ? `${result.rowCount.toLocaleString()} Arrow rows · batches ${result.batchRowCounts.join(' / ')} · filter, grouping, sorting, and joins match the CPU reference · ${result.readbackBytes.toLocaleString()} summary bytes read`
    : 'GPU dataframe results did not match their equivalent CPU reference.';
}

function formatBenchmarkThroughput(rowsPerSecond: number): string {
  if (rowsPerSecond >= 1_000_000) return `${(rowsPerSecond / 1_000_000).toFixed(2)}M`;
  if (rowsPerSecond >= 1_000) return `${(rowsPerSecond / 1_000).toFixed(1)}K`;
  return rowsPerSecond.toFixed(0);
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
