// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {ParquetSourceLoader} from '@loaders.gl/parquet/parquet-source-loader';
import {Buffer, type Device, type Framebuffer} from '@luma.gl/core';
import {AnimationLoopTemplate, Model} from '@luma.gl/engine';
import {
  GPUCommandGraph,
  type CompiledGPUCommandGraph,
  type GraphBufferHandle,
  type GraphDataView
} from '@luma.gl/gpgpu/gpu-core';
import {
  addGPUParquetEncodedPageBatchToGraph,
  createGPUParquetEncodedPageBatchInputBuffer,
  planGPUParquetEncodedPageBatch,
  type GPUParquetDecodedPage
} from '@luma.gl/gpgpu/gpu-parse';
import type {AnimationProps} from '@luma.gl/engine';
import {
  PARQUET_CONSTELLATION_COLUMNS,
  type ParquetConstellationColumn
} from './parquet-constellation-data';
import {PARQUET_CONSTELLATION_SHADER} from './parquet-constellation-shader';

export const title = 'GPU Parquet Constellation';
export const description =
  'Switch a multi-page Parquet galaxy between main-thread CPU decoding and graph-native GPU decoding.';

const ROW_COUNT = 600_000;
const PAGE_SIZE = 65_536;
const UINT32_BYTE_LENGTH = Uint32Array.BYTES_PER_ELEMENT;
const UNIFORM_BYTE_LENGTH = 8 * Float32Array.BYTES_PER_ELEMENT;
const PARQUET_URL = new URL('./data/constellation.parquet', import.meta.url);
const INFO_HTML = `<div data-parquet-panel style="display:grid;gap:12px;min-width:min(360px,80vw)">
  <div><strong>GPU Parquet Constellation</strong><p style="margin:6px 0 0;line-height:1.45">A real Parquet row group becomes an animated galaxy. Four FLOAT columns use <code>BYTE_STREAM_SPLIT</code>; one UINT32 column uses <code>DELTA_BINARY_PACKED</code>.</p></div>
  <div style="display:grid;gap:9px">
    <div><strong>${formatCount(ROW_COUNT)}</strong> rows · ${formatCount(PAGE_SIZE)} rows/page</div>
    <label>Decoder <select data-decode-mode><option value="gpu" selected>GPU command graph</option><option value="cpu">CPU on main thread</option></select></label>
    <button type="button" data-run-selected>Decode and display</button>
    <button type="button" data-compare>Compare CPU → GPU</button>
    <small>The old scene keeps animating during a switch. “Longest frame” exposes main-thread stalls as well as total preparation latency.</small>
  </div>
  <div><strong>Measurements</strong><div data-parquet-status style="margin-top:7px">Waiting for WebGPU…</div><div data-parquet-measurements style="margin-top:10px"></div></div>
</div>`;

type DecodeMode = 'cpu' | 'gpu';

type RenderParameters = {
  framebuffer: Framebuffer;
};

type PreparedScene = {
  buffers: Record<ParquetConstellationColumn, Buffer>;
  compiled: CompiledGPUCommandGraph<RenderParameters>;
  gpuDecoder?: {
    compiled: CompiledGPUCommandGraph<undefined>;
    inputBuffer: Buffer;
  };
  uploadByteLength: number;
  decodeGraphNodeCount: number;
  decodeExecutionMilliseconds: number;
};

type DecodeMeasurement = {
  elapsedMilliseconds: number;
  longestFrameMilliseconds: number;
  uploadByteLength: number;
  graphNodeCount: number;
  decodeExecutionMilliseconds: number;
  reusedGraphExecutionMilliseconds?: number;
};

export default class GPUParquetConstellationAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = INFO_HTML;
  static props = {createFramebuffer: true, debug: true};

  readonly device: Device;
  readonly model: Model;
  readonly uniformBuffer: Buffer;

  private scene: PreparedScene | null = null;
  private parquetBytes: ArrayBuffer | null = null;
  private selectedMode: DecodeMode = 'gpu';
  private fetchMilliseconds = 0;
  private preparationVersion = 0;
  private preparationActive = false;
  private preparationStartedAt = 0;
  private longestPreparationFrameMilliseconds = 0;
  private previousFrameTime = 0;
  private measurements: Partial<Record<DecodeMode, DecodeMeasurement>> = {};
  private statusElement: HTMLElement | null = null;
  private measurementsElement: HTMLElement | null = null;
  private panelElement: HTMLElement | null = null;
  private controls: HTMLSelectElement[] = [];
  private actionButtons: HTMLButtonElement[] = [];
  private cleanupControls: (() => void) | null = null;

  constructor({device}: AnimationProps) {
    super();
    if (device.type !== 'webgpu') {
      throw new Error('GPU Parquet Constellation requires WebGPU');
    }
    this.device = device;
    this.uniformBuffer = device.createBuffer({
      id: 'gpu-parquet-constellation-uniforms',
      byteLength: UNIFORM_BYTE_LENGTH,
      usage: Buffer.UNIFORM | Buffer.COPY_DST
    });
    this.model = new Model(device, {
      id: 'gpu-parquet-constellation-stars',
      source: PARQUET_CONSTELLATION_SHADER,
      topology: 'triangle-list',
      vertexCount: 6,
      isInstanced: true,
      instanceCount: ROW_COUNT,
      colorAttachmentFormats: [device.preferredColorFormat],
      shaderLayout: {
        attributes: [],
        bindings: [
          {name: 'positionX', type: 'read-only-storage', group: 0, location: 0},
          {name: 'positionY', type: 'read-only-storage', group: 0, location: 1},
          {name: 'radii', type: 'read-only-storage', group: 0, location: 2},
          {name: 'temperatures', type: 'read-only-storage', group: 0, location: 3},
          {name: 'sequences', type: 'read-only-storage', group: 0, location: 4},
          {name: 'uniforms', type: 'uniform', group: 0, location: 5}
        ]
      },
      parameters: {
        blend: true,
        blendColorOperation: 'add',
        blendColorSrcFactor: 'one',
        blendColorDstFactor: 'one',
        blendAlphaOperation: 'add',
        blendAlphaSrcFactor: 'one',
        blendAlphaDstFactor: 'one'
      }
    });
  }

  override async onInitialize(): Promise<void> {
    this.cleanupControls = this.bindControls(document);
    void this.loadDataset();
  }

  override onRender({device, time, aspect}: AnimationProps): void {
    const currentTime = performance.now();
    if (this.preparationActive && this.previousFrameTime > 0) {
      this.longestPreparationFrameMilliseconds = Math.max(
        this.longestPreparationFrameMilliseconds,
        currentTime - this.previousFrameTime
      );
    }
    this.previousFrameTime = currentTime;
    this.uniformBuffer.write(
      new Float32Array([time / 1000, aspect, 2.15, 1.8, this.getHorizontalOffset(), 0, 0, 0])
    );

    const scene = this.scene;
    if (!scene) {
      const renderPass = device.beginRenderPass({clearColor: [0.004, 0.006, 0.018, 1]});
      renderPass.end();
      return;
    }
    const framebuffer = device
      .getDefaultCanvasContext()
      .getCurrentFramebuffer({depthStencilFormat: false});
    scene.compiled.encode(device.commandEncoder, {parameters: {framebuffer}});
  }

  override onFinalize(): void {
    this.preparationVersion++;
    this.destroyScene();
    this.cleanupControls?.();
    this.cleanupControls = null;
    this.model.destroy();
    this.uniformBuffer.destroy();
  }

  private async loadDataset(): Promise<void> {
    const preparationVersion = ++this.preparationVersion;
    this.setControlsDisabled(true);
    this.setStatus(`Fetching ${formatCount(ROW_COUNT)} rows from the Parquet fixture…`);
    await nextAnimationFrame();
    const fetchStartedAt = performance.now();
    try {
      const response = await fetch(PARQUET_URL);
      if (!response.ok) throw new Error(`Could not fetch Parquet fixture (${response.status})`);
      const parquetBytes = await response.arrayBuffer();
      if (preparationVersion !== this.preparationVersion) return;
      this.parquetBytes = parquetBytes;
      this.fetchMilliseconds = performance.now() - fetchStartedAt;
      this.measurements = {};
      await this.prepareMode(this.selectedMode, preparationVersion);
    } catch (error) {
      if (preparationVersion === this.preparationVersion) {
        this.setStatus(getErrorMessage(error), true);
      }
    } finally {
      if (preparationVersion === this.preparationVersion) {
        this.setControlsDisabled(false);
      }
    }
  }

  private async selectMode(mode: DecodeMode): Promise<void> {
    if (!this.parquetBytes || this.preparationActive) return;
    this.selectedMode = mode;
    const preparationVersion = ++this.preparationVersion;
    this.setControlsDisabled(true);
    try {
      if (mode === 'gpu' && this.scene?.gpuDecoder) {
        await this.rerunGPUDecode(preparationVersion);
      } else {
        await this.prepareMode(mode, preparationVersion);
      }
    } catch (error) {
      if (preparationVersion === this.preparationVersion) {
        this.setStatus(getErrorMessage(error), true);
      }
    } finally {
      if (preparationVersion === this.preparationVersion) {
        this.setControlsDisabled(false);
      }
    }
  }

  private async compareModes(): Promise<void> {
    if (!this.parquetBytes || this.preparationActive) return;
    const preparationVersion = ++this.preparationVersion;
    this.setControlsDisabled(true);
    try {
      await this.prepareMode('cpu', preparationVersion);
      await waitForMilliseconds(250);
      if (preparationVersion !== this.preparationVersion) return;
      this.selectedMode = 'gpu';
      await this.prepareMode('gpu', preparationVersion);
      await this.rerunGPUDecode(preparationVersion);
    } catch (error) {
      if (preparationVersion === this.preparationVersion) {
        this.setStatus(getErrorMessage(error), true);
      }
    } finally {
      if (preparationVersion === this.preparationVersion) {
        this.setControlsDisabled(false);
      }
    }
  }

  private async prepareMode(mode: DecodeMode, preparationVersion: number): Promise<void> {
    const parquetBytes = this.parquetBytes;
    if (!parquetBytes) return;
    this.preparationActive = true;
    this.preparationStartedAt = performance.now();
    this.longestPreparationFrameMilliseconds = 0;
    this.setStatus(
      mode === 'gpu'
        ? 'Reading encoded pages, planning GPU decoders, and submitting the decode graph…'
        : 'Decoding Parquet values and constructing Arrow arrays on the main thread…'
    );
    await nextAnimationFrame();

    let nextScene: PreparedScene | null = null;
    try {
      nextScene =
        mode === 'gpu'
          ? await this.prepareGPUScene(parquetBytes)
          : await this.prepareCPUScene(parquetBytes);
      await nextAnimationFrame();
      if (preparationVersion !== this.preparationVersion) {
        destroyPreparedScene(nextScene);
        return;
      }
      const elapsedMilliseconds = performance.now() - this.preparationStartedAt;
      this.measurements[mode] = {
        elapsedMilliseconds,
        longestFrameMilliseconds: this.longestPreparationFrameMilliseconds,
        uploadByteLength: nextScene.uploadByteLength,
        graphNodeCount: nextScene.decodeGraphNodeCount,
        decodeExecutionMilliseconds: nextScene.decodeExecutionMilliseconds
      };
      this.destroyScene();
      this.scene = nextScene;
      nextScene = null;
      this.selectedMode = mode;
      this.setStatus(
        `${mode === 'gpu' ? 'GPU' : 'CPU'} decoded ${formatCount(ROW_COUNT)} rows; the same buffers now drive the animated render.`
      );
      this.updateMeasurements();
    } finally {
      if (nextScene) destroyPreparedScene(nextScene);
      this.preparationActive = false;
    }
  }

  private async prepareCPUScene(parquetBytes: ArrayBuffer): Promise<PreparedScene> {
    const decodeStartedAt = performance.now();
    const source = ParquetSourceLoader.createDataSource(new Blob([parquetBytes]), {
      core: {worker: false}
    });
    try {
      for await (const batch of source.read({columns: PARQUET_CONSTELLATION_COLUMNS})) {
        const decodeExecutionMilliseconds = performance.now() - decodeStartedAt;
        if (batch.length !== ROW_COUNT) {
          throw new Error(`CPU decoder returned ${batch.length} of ${ROW_COUNT} rows`);
        }
        const buffers = {
          positionX: this.createColumnBuffer(
            'cpu-position-x',
            getFloat32Column(batch.data, 'positionX')
          ),
          positionY: this.createColumnBuffer(
            'cpu-position-y',
            getFloat32Column(batch.data, 'positionY')
          ),
          radius: this.createColumnBuffer('cpu-radius', getFloat32Column(batch.data, 'radius')),
          temperature: this.createColumnBuffer(
            'cpu-temperature',
            getFloat32Column(batch.data, 'temperature')
          ),
          sequence: this.createColumnBuffer('cpu-sequence', getUint32Column(batch.data, 'sequence'))
        };
        try {
          return this.createPreparedScene(
            buffers,
            PARQUET_CONSTELLATION_COLUMNS.length * ROW_COUNT * UINT32_BYTE_LENGTH,
            0,
            decodeExecutionMilliseconds
          );
        } catch (error) {
          for (const buffer of Object.values(buffers)) buffer.destroy();
          throw error;
        }
      }
    } finally {
      await source.close();
    }
    throw new Error('CPU decoder returned no Parquet row group');
  }

  private async prepareGPUScene(parquetBytes: ArrayBuffer): Promise<PreparedScene> {
    const source = ParquetSourceLoader.createDataSource(new Blob([parquetBytes]), {});
    try {
      for await (const batch of source.readPages({
        columns: PARQUET_CONSTELLATION_COLUMNS,
        preserveCompression: ['SNAPPY', 'LZ4_RAW']
      })) {
        const plan = planGPUParquetEncodedPageBatch(batch);
        if (plan.cpuFallbackPageCount > 0) {
          throw new Error(`${plan.cpuFallbackPageCount} Parquet pages require CPU fallback`);
        }
        const buffers = Object.fromEntries(
          PARQUET_CONSTELLATION_COLUMNS.map(column => [
            column,
            this.device.createBuffer({
              id: `gpu-${column}`,
              byteLength: ROW_COUNT * UINT32_BYTE_LENGTH,
              usage: Buffer.STORAGE | Buffer.COPY_DST
            })
          ])
        ) as Record<ParquetConstellationColumn, Buffer>;
        let inputBuffer: Buffer | null = null;
        let compiledDecode: CompiledGPUCommandGraph<undefined> | null = null;
        try {
          const decodeGraph = new GPUCommandGraph<undefined>(this.device, {
            id: 'gpu-parquet-constellation-decode'
          });
          inputBuffer = createGPUParquetEncodedPageBatchInputBuffer(this.device, plan);
          const decoded = addGPUParquetEncodedPageBatchToGraph(decodeGraph, plan, inputBuffer);
          const destinationHandles = Object.fromEntries(
            PARQUET_CONSTELLATION_COLUMNS.map(column => [
              column,
              decodeGraph.importBuffer(
                {
                  id: `gpu-${column}-decoded`,
                  byteLength: buffers[column].byteLength,
                  usage: buffers[column].usage
                },
                buffers[column]
              )
            ])
          ) as Record<ParquetConstellationColumn, GraphBufferHandle>;
          this.addDecodedPageCopies(decodeGraph, batch.columns, decoded.pages, destinationHandles);
          compiledDecode = decodeGraph.compile();
          const decodeGraphNodeCount = compiledDecode.stats.nodeOrder.length;
          const decodeExecutionMilliseconds = await this.executeGPUDecode(compiledDecode);
          return this.createPreparedScene(
            buffers,
            plan.uploadData.byteLength,
            decodeGraphNodeCount,
            decodeExecutionMilliseconds,
            {compiled: compiledDecode, inputBuffer}
          );
        } catch (error) {
          compiledDecode?.destroy();
          inputBuffer?.destroy();
          for (const buffer of Object.values(buffers)) buffer.destroy();
          throw error;
        }
      }
    } finally {
      await source.close();
    }
    throw new Error('GPU page reader returned no Parquet row group');
  }

  private addDecodedPageCopies(
    graph: GPUCommandGraph<undefined>,
    sourceColumns: readonly {path: readonly string[]}[],
    pages: readonly (GPUParquetDecodedPage | {mode: 'cpu-fallback'})[],
    destinations: Record<ParquetConstellationColumn, GraphBufferHandle>
  ): void {
    const destinationByteOffsets = new Map<ParquetConstellationColumn, number>();
    for (const page of pages) {
      if (page.mode !== 'gpu') continue;
      const columnName = sourceColumns[page.plan.columnIndex]?.path[0];
      if (!isParquetConstellationColumn(columnName)) {
        throw new Error(`Unexpected Parquet column ${columnName ?? '<missing>'}`);
      }
      if (page.values.layout !== 'packed-bytes' && page.values.layout !== 'uint32') {
        throw new Error(`${columnName} did not decode to a fixed-width GPU buffer`);
      }
      const sourceView = page.values.values;
      const destinationByteOffset = destinationByteOffsets.get(columnName) ?? 0;
      this.addPageCopy(
        graph,
        sourceView,
        destinations[columnName],
        destinationByteOffset,
        page.values.byteLength,
        `${columnName}-${page.plan.pageOrdinal}`
      );
      destinationByteOffsets.set(columnName, destinationByteOffset + page.values.byteLength);
    }
    for (const columnName of PARQUET_CONSTELLATION_COLUMNS) {
      const copiedByteLength = destinationByteOffsets.get(columnName) ?? 0;
      const expectedByteLength = ROW_COUNT * UINT32_BYTE_LENGTH;
      if (copiedByteLength !== expectedByteLength) {
        throw new Error(
          `${columnName} decoded ${copiedByteLength} of ${expectedByteLength} expected bytes`
        );
      }
    }
  }

  private addPageCopy(
    graph: GPUCommandGraph<undefined>,
    source: GraphDataView<'uint32'>,
    destination: GraphBufferHandle,
    destinationByteOffset: number,
    byteLength: number,
    id: string
  ): void {
    graph.addCopyPass({
      id: `copy-${id}`,
      resources: [
        {buffer: source, usage: 'copy-source'},
        {buffer: destination, usage: 'copy-destination'}
      ],
      compile: () => ({
        encode: ({commandEncoder, getBuffer}) =>
          commandEncoder.copyBufferToBuffer({
            sourceBuffer: getBuffer(source),
            sourceOffset: source.byteOffset,
            destinationBuffer: getBuffer(destination),
            destinationOffset: destinationByteOffset,
            size: byteLength
          })
      })
    });
  }

  private createColumnBuffer(id: string, data: Float32Array | Uint32Array): Buffer {
    return this.device.createBuffer({id, data, usage: Buffer.STORAGE | Buffer.COPY_DST});
  }

  private createPreparedScene(
    buffers: Record<ParquetConstellationColumn, Buffer>,
    uploadByteLength: number,
    decodeGraphNodeCount: number,
    decodeExecutionMilliseconds: number,
    gpuDecoder?: PreparedScene['gpuDecoder']
  ): PreparedScene {
    const compiled = this.createRenderGraph(buffers);
    return {
      buffers,
      compiled,
      gpuDecoder,
      uploadByteLength,
      decodeGraphNodeCount,
      decodeExecutionMilliseconds
    };
  }

  private async rerunGPUDecode(preparationVersion: number): Promise<void> {
    const gpuDecoder = this.scene?.gpuDecoder;
    const measurement = this.measurements.gpu;
    if (!gpuDecoder || !measurement) return;
    this.preparationActive = true;
    this.preparationStartedAt = performance.now();
    this.longestPreparationFrameMilliseconds = 0;
    this.setStatus('Reusing the compiled GPU graph for another decode submission…');
    await nextAnimationFrame();
    try {
      const executionMilliseconds = await this.executeGPUDecode(gpuDecoder.compiled);
      await nextAnimationFrame();
      if (preparationVersion !== this.preparationVersion) return;
      measurement.reusedGraphExecutionMilliseconds = executionMilliseconds;
      this.setStatus(
        `GPU reused its compiled ${measurement.graphNodeCount}-node graph in ${executionMilliseconds.toFixed(1)} ms.`
      );
      this.updateMeasurements();
    } finally {
      this.preparationActive = false;
    }
  }

  private async executeGPUDecode(compiled: CompiledGPUCommandGraph<undefined>): Promise<number> {
    const decodeStartedAt = performance.now();
    const commandEncoder = this.device.createCommandEncoder({
      id: 'gpu-parquet-constellation-decode'
    });
    compiled.encode(commandEncoder, {parameters: undefined});
    this.device.submit(commandEncoder.finish());
    await waitForSubmittedWork(this.device);
    return performance.now() - decodeStartedAt;
  }

  private createRenderGraph(
    buffers: Record<ParquetConstellationColumn, Buffer>
  ): CompiledGPUCommandGraph<RenderParameters> {
    const graph = new GPUCommandGraph<RenderParameters>(this.device, {
      id: 'gpu-parquet-constellation-render'
    });
    const imports = Object.fromEntries(
      PARQUET_CONSTELLATION_COLUMNS.map(column => [
        column,
        graph.importBuffer(
          {
            id: `render-${column}`,
            byteLength: buffers[column].byteLength,
            usage: buffers[column].usage
          },
          buffers[column]
        )
      ])
    ) as Record<ParquetConstellationColumn, GraphBufferHandle>;
    const uniforms = graph.importBuffer(
      {
        id: 'constellation-uniforms',
        byteLength: this.uniformBuffer.byteLength,
        usage: this.uniformBuffer.usage
      },
      this.uniformBuffer
    );
    graph.addRenderPass({
      id: 'render-parquet-constellation',
      resources: [
        ...PARQUET_CONSTELLATION_COLUMNS.map(column => ({
          buffer: imports[column],
          usage: 'storage-read' as const
        })),
        {buffer: uniforms, usage: 'uniform'}
      ],
      compile: () => ({
        getRenderPassProps: ({parameters}) => ({
          framebuffer: parameters.framebuffer,
          clearColor: [0.004, 0.006, 0.018, 1]
        }),
        encode: ({renderPass, getBuffer}) => {
          renderPass.setPipeline(this.model.pipeline);
          renderPass.setVertexArray(this.model.vertexArray);
          renderPass.setBindings({
            positionX: getBuffer(imports.positionX),
            positionY: getBuffer(imports.positionY),
            radii: getBuffer(imports.radius),
            temperatures: getBuffer(imports.temperature),
            sequences: getBuffer(imports.sequence),
            uniforms: getBuffer(uniforms)
          });
          renderPass.draw({vertexCount: 6, instanceCount: ROW_COUNT});
        }
      })
    });
    return graph.compile();
  }

  private destroyScene(): void {
    if (!this.scene) return;
    destroyPreparedScene(this.scene);
    this.scene = null;
  }

  private bindControls(root: ParentNode): () => void {
    const modeSelect = root.querySelector<HTMLSelectElement>('[data-decode-mode]');
    const runButton = root.querySelector<HTMLButtonElement>('[data-run-selected]');
    const compareButton = root.querySelector<HTMLButtonElement>('[data-compare]');
    this.statusElement = root.querySelector('[data-parquet-status]');
    this.measurementsElement = root.querySelector('[data-parquet-measurements]');
    this.panelElement = root.querySelector('[data-parquet-panel]');
    if (!modeSelect || !runButton || !compareButton) return () => {};
    this.controls = [modeSelect];
    this.actionButtons = [runButton, compareButton];
    const onMode = (): void => {
      this.selectedMode = modeSelect.value as DecodeMode;
    };
    const onRun = (): void => void this.selectMode(modeSelect.value as DecodeMode);
    const onCompare = (): void => void this.compareModes();
    modeSelect.addEventListener('change', onMode);
    runButton.addEventListener('click', onRun);
    compareButton.addEventListener('click', onCompare);
    this.setControlsDisabled(this.preparationActive || !this.parquetBytes);
    this.updateMeasurements();
    return () => {
      modeSelect.removeEventListener('change', onMode);
      runButton.removeEventListener('click', onRun);
      compareButton.removeEventListener('click', onCompare);
      this.controls = [];
      this.actionButtons = [];
      this.statusElement = null;
      this.measurementsElement = null;
      this.panelElement = null;
    };
  }

  private getHorizontalOffset(): number {
    const canvas = this.device.getDefaultCanvasContext().canvas;
    const panel = this.panelElement;
    if (!(canvas instanceof HTMLCanvasElement) || !panel) return 0;
    const canvasBounds = canvas.getBoundingClientRect();
    const panelBounds = panel.getBoundingClientRect();
    const overlapsVertically =
      panelBounds.bottom > canvasBounds.top && panelBounds.top < canvasBounds.bottom;
    if (
      !overlapsVertically ||
      canvasBounds.width <= canvasBounds.height ||
      panelBounds.right <= canvasBounds.left
    ) {
      return 0;
    }
    const coveredWidth = Math.min(panelBounds.right, canvasBounds.right) - canvasBounds.left;
    const coveredFraction = coveredWidth / canvasBounds.width;
    return coveredFraction < 0.6 ? Math.max(0, coveredFraction) : 0;
  }

  private setControlsDisabled(disabled: boolean): void {
    for (const control of this.controls) control.disabled = disabled;
    for (const button of this.actionButtons) button.disabled = disabled;
  }

  private setStatus(message: string, error = false): void {
    if (!this.statusElement) return;
    this.statusElement.textContent = message;
    this.statusElement.style.color = error ? '#fb7185' : '';
  }

  private updateMeasurements(): void {
    const element = this.measurementsElement;
    if (!element) return;
    const cpuMeasurement = this.measurements.cpu;
    const gpuMeasurement = this.measurements.gpu;
    const formatMetric = (
      measurement: DecodeMeasurement | undefined,
      format: (value: DecodeMeasurement) => string
    ): string => (measurement ? format(measurement) : '—');
    element.innerHTML = `<div style="margin-bottom:9px">
      ${formatBytes(this.parquetBytes?.byteLength ?? 0)} fixture · ${this.fetchMilliseconds.toFixed(1)} ms fetch · ${formatCount(PAGE_SIZE)} rows/page
    </div>
    <table style="width:100%;border-collapse:collapse;text-align:right">
      <thead><tr><th style="text-align:left"></th><th>GPU</th><th>CPU</th></tr></thead>
      <tbody>
        <tr><th style="text-align:left;font-weight:normal">Preparation latency</th><td>${formatMetric(gpuMeasurement, value => `${value.elapsedMilliseconds.toFixed(1)} ms`)}</td><td>${formatMetric(cpuMeasurement, value => `${value.elapsedMilliseconds.toFixed(1)} ms`)}</td></tr>
        <tr><th style="text-align:left;font-weight:normal">First decode execution</th><td>${formatMetric(gpuMeasurement, value => `${value.decodeExecutionMilliseconds.toFixed(1)} ms`)}</td><td>${formatMetric(cpuMeasurement, value => `${value.decodeExecutionMilliseconds.toFixed(1)} ms`)}</td></tr>
        <tr><th style="text-align:left;font-weight:normal">Reused graph execution</th><td>${formatMetric(gpuMeasurement, value => (value.reusedGraphExecutionMilliseconds === undefined ? '—' : `${value.reusedGraphExecutionMilliseconds.toFixed(1)} ms`))}</td><td>n/a</td></tr>
        <tr><th style="text-align:left;font-weight:normal">Longest frame</th><td>${formatMetric(gpuMeasurement, value => `${value.longestFrameMilliseconds.toFixed(1)} ms`)}</td><td>${formatMetric(cpuMeasurement, value => `${value.longestFrameMilliseconds.toFixed(1)} ms`)}</td></tr>
        <tr><th style="text-align:left;font-weight:normal">GPU upload</th><td>${formatMetric(gpuMeasurement, value => formatBytes(value.uploadByteLength))}</td><td>${formatMetric(cpuMeasurement, value => formatBytes(value.uploadByteLength))}</td></tr>
        <tr><th style="text-align:left;font-weight:normal">Decode graph nodes</th><td>${formatMetric(gpuMeasurement, value => String(value.graphNodeCount))}</td><td>${formatMetric(cpuMeasurement, value => String(value.graphNodeCount))}</td></tr>
      </tbody>
    </table>
    <div style="margin-top:10px;font:11px/1.5 ui-monospace,monospace">4 × BYTE_STREAM_SPLIT FLOAT<br>1 × DELTA_BINARY_PACKED UINT32<br>DataPageV2 · uncompressed · dictionary off</div>`;
  }
}

function getFloat32Column(
  table: {getChild: (name: string) => {toArray: () => unknown} | null},
  columnName: string
): Float32Array {
  const values = table.getChild(columnName)?.toArray();
  if (!(values instanceof Float32Array)) {
    throw new Error(`${columnName} did not decode to Float32Array`);
  }
  return values;
}

function getUint32Column(
  table: {getChild: (name: string) => {toArray: () => unknown} | null},
  columnName: string
): Uint32Array {
  const values = table.getChild(columnName)?.toArray();
  if (!(values instanceof Uint32Array)) {
    throw new Error(`${columnName} did not decode to Uint32Array`);
  }
  return values;
}

function isParquetConstellationColumn(
  value: string | undefined
): value is ParquetConstellationColumn {
  return PARQUET_CONSTELLATION_COLUMNS.includes(value as ParquetConstellationColumn);
}

function destroyPreparedScene(scene: PreparedScene): void {
  scene.compiled.destroy();
  scene.gpuDecoder?.compiled.destroy();
  scene.gpuDecoder?.inputBuffer.destroy();
  for (const buffer of Object.values(scene.buffers)) buffer.destroy();
}

async function waitForSubmittedWork(device: Device): Promise<void> {
  const queue = (device.handle as {queue?: {onSubmittedWorkDone?: () => Promise<void>}} | undefined)
    ?.queue;
  if (!queue?.onSubmittedWorkDone) {
    throw new Error('WebGPU queue completion is unavailable');
  }
  await queue.onSubmittedWorkDone();
}

function nextAnimationFrame(): Promise<void> {
  return new Promise(resolve => requestAnimationFrame(() => resolve()));
}

function waitForMilliseconds(milliseconds: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

function formatCount(value: number): string {
  return value.toLocaleString();
}

function formatBytes(byteLength: number): string {
  if (byteLength < 1024) return `${byteLength} B`;
  if (byteLength < 1024 * 1024) return `${(byteLength / 1024).toFixed(1)} KiB`;
  return `${(byteLength / 1024 / 1024).toFixed(2)} MiB`;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
