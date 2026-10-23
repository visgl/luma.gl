// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {AnimationLoopTemplate, Model, type AnimationProps} from '@luma.gl/engine';
import {GPUData, GPUVector, type GPUVectorFormat} from '@luma.gl/gpgpu/gpu-data';
import {
  GPUCommandGraph,
  GPUCommandGraphInspector,
  type CompiledGPUCommandGraph
} from '@luma.gl/graph/gpu-core';
import {GPUTimeSeries, GPUTimeSeriesEnvelope} from '@luma.gl/graph/gpu-timeseries';
import {GAP_END, GAP_START, INCIDENT_SAMPLE, SAMPLE_COUNT, SERIES, makeTelemetry} from './data';

import {
  ExamplePanelManager,
  makeExamplePanelHostHtml,
  makeExampleTabbedPanel,
  makeHtmlCustomPanel
} from '../../example-panels';
import {GPUCommandGraphDebugPanel} from '../../gpu-command-graph-debug-panel';

export const title = 'Signal Room';
export const description = 'Explore three million telemetry samples without losing the spikes.';
const BIN_COUNT = 1024;

export default class TimeSeriesExample extends AnimationLoopTemplate {
  static info = makeExamplePanelHostHtml();
  readonly graphInspector = new GPUCommandGraphInspector({maxSamples: 90});
  readonly graphDebugPanel = new GPUCommandGraphDebugPanel();
  readonly controls = document.createElement('div');
  readonly panels: ExamplePanelManager;
  readonly device: Device;
  readonly buffers: Buffer[] = [];
  readonly vectors: GPUVector[] = [];
  readonly models: Model[] = [];
  readonly compiled: CompiledGPUCommandGraph;
  readonly range: Buffer;
  readonly display: Buffer;
  readonly outputs: {values: Buffer; identifiers: Buffer; counts: Buffer}[] = [];
  readonly overlay: HTMLDivElement;
  readonly canvas: HTMLCanvasElement;
  private start = 0;
  private end = SAMPLE_COUNT;
  private dirty = true;
  private envelope = true;
  private pointerStart: number | null = null;
  private inspecting = false;
  private finalized = false;
  private timingPending = false;
  private readonly events = new AbortController();

  constructor({device}: AnimationProps) {
    super();
    this.device = device;
    const canvas = device.getDefaultCanvasContext().canvas;
    if (!(canvas instanceof HTMLCanvasElement))
      throw new Error('Signal Room requires a browser canvas');
    this.canvas = canvas;
    this.range = this.makeBuffer('visible-range', new Uint32Array([0, SAMPLE_COUNT]));
    this.display = this.makeBuffer('display-mode', new Uint32Array([1, 0, 0, 0]));
    const range = this.makeVector('visible-range', 'uint32x2', this.range, 1);
    const graph = new GPUCommandGraph(device);
    SERIES.forEach((series, channel) => {
      const samples = makeTelemetry(channel);
      // Real separate source batches: the reducer never combines or uploads them implicitly.
      const chunks = [
        samples.subarray(0, 350_000),
        samples.subarray(350_000, 700_000),
        samples.subarray(700_000)
      ];
      const data = chunks.map(
        (values, index) =>
          new GPUData<'float32'>({
            buffer: this.makeBuffer(`source-${channel}-${index}`, values),
            format: 'float32',
            length: values.length,
            ownsBuffer: false
          })
      );
      const values = new GPUVector<'float32'>({
        type: 'data',
        name: `channel-${channel}`,
        format: 'float32',
        data,
        ownsData: false
      });
      this.vectors.push(values);
      const summary = this.makeBuffer(`summary-${channel}`, new Float32Array(BIN_COUNT * 4));
      const identifiers = this.makeBuffer(`identifiers-${channel}`, new Uint32Array(BIN_COUNT * 4));
      const counts = this.makeBuffer(`counts-${channel}`, new Uint32Array(BIN_COUNT * 2));
      this.outputs.push({values: summary, identifiers, counts});
      new GPUTimeSeriesEnvelope({
        id: `telemetry-${channel}`,
        series: new GPUTimeSeries({values, interval: 0.1}),
        range,
        output: this.makeVector(`summary-${channel}`, 'float32x4', summary, BIN_COUNT),
        sourceIds: this.makeVector(`identifiers-${channel}`, 'uint32x4', identifiers, BIN_COUNT),
        counts: this.makeVector(`counts-${channel}`, 'uint32x2', counts, BIN_COUNT)
      }).addToGraph(graph);
      const model = new Model(device, {
        id: `telemetry-chart-${channel}`,
        source: makeChartShader(channel),
        topology: 'triangle-list',
        vertexCount: 6,
        instanceCount: BIN_COUNT,
        shaderLayout: {
          attributes: [],
          bindings: [
            {name: 'summary', type: 'read-only-storage', group: 0, location: 0},
            {name: 'counts', type: 'read-only-storage', group: 0, location: 1},
            {name: 'display', type: 'read-only-storage', group: 0, location: 2}
          ]
        },
        parameters: {depthWriteEnabled: false, depthCompare: 'always'}
      });
      model.setBindings({summary, counts, display: this.display});
      this.models.push(model);
    });
    this.compiled = graph.compile();
    this.overlay = document.createElement('div');
    this.overlay.className = 'signal-room';
    this.overlay.innerHTML = makeOverlay();
    this.canvas.parentElement?.append(this.overlay);
    this.graphInspector.registerGraph(this.compiled);
    this.controls.innerHTML = makeControls();
    const timingStatus = this.controls.querySelector('[data-timing-status]');
    if (timingStatus)
      timingStatus.textContent = device.features.has('timestamp-query')
        ? 'GPU timestamps are sampled when the visible range changes. Timings are in milliseconds.'
        : 'GPU timings unavailable: this device does not support timestamp queries.';
    this.panels = new ExamplePanelManager({
      panel: makeExampleTabbedPanel({
        id: 'signal-room-tabs',
        title: 'Signal Room',
        theme: 'dark',
        panels: [
          makeHtmlCustomPanel({
            id: 'signal-room-controls',
            title: 'Controls',
            html: '',
            onRender: root => {
              root.append(this.controls);
              return () => this.controls.remove();
            }
          }),
          this.graphDebugPanel.panel
        ]
      })
    });
    this.panels.mount();
    this.graphDebugPanel.update(this.graphInspector.getSnapshot(), this.compiled.id);
    const options = {signal: this.events.signal};
    this.controls.querySelector('[data-action="reset"]')?.addEventListener(
      'click',
      () => {
        this.setRange(0, SAMPLE_COUNT);
        this.setGuide(
          'Find the service incident',
          'These three signals cover 29 hours. Look for the aligned rise, then choose “1. Inspect incident”.'
        );
      },
      options
    );
    this.controls.querySelector('[data-action="incident"]')?.addEventListener(
      'click',
      () => {
        this.setRange(INCIDENT_SAMPLE - 12_007, INCIDENT_SAMPLE + 11_993);
        this.setGuide(
          'Three signals, one incident',
          'Responses slow down, jobs queue up and errors rise together. Choose “2. Hide peaks” to see what a sampled chart misses.'
        );
      },
      options
    );
    this.controls.querySelector('[data-action="gap"]')?.addEventListener(
      'click',
      () => {
        this.setRange(GAP_START - 20_000, GAP_END + 20_000);
        this.setGuide(
          'Missing data is not zero',
          'The shaded interval has no telemetry. Empty bins stay blank; amber marks contain both observations and missing samples.'
        );
      },
      options
    );
    const modeButton = this.controls.querySelector<HTMLButtonElement>('[data-action="mode"]');
    modeButton?.addEventListener(
      'click',
      () => {
        this.envelope = !this.envelope;
        this.display.write(new Uint32Array([Number(this.envelope), 0, 0, 0]));
        modeButton.textContent = this.envelope ? '2. Hide peaks' : '2. Restore peaks';
        this.setGuide(
          this.envelope ? 'Every peak is visible again' : 'Short spikes can disappear',
          this.envelope
            ? 'Each vertical mark spans the lowest to highest observed value in a time bin. Brief spikes survive even at full-history scale.'
            : 'This view keeps only the first observation in each time bin. It looks cleaner, but can hide brief spikes. Restore peaks to compare.'
        );
      },
      options
    );
    const zoomSlider = this.controls.querySelector<HTMLInputElement>('[data-control="zoom"]');
    zoomSlider?.addEventListener(
      'input',
      () => {
        const level = Number(zoomSlider.value);
        const width = Math.max(64, Math.round(SAMPLE_COUNT / 2 ** level));
        const center = (this.start + this.end) / 2;
        const start = Math.max(0, Math.min(SAMPLE_COUNT - width, Math.round(center - width / 2)));
        this.setRange(start, start + width);
      },
      options
    );
    const panSlider = this.controls.querySelector<HTMLInputElement>('[data-control="pan"]');
    panSlider?.addEventListener(
      'input',
      () => {
        const width = this.end - this.start;
        const start = Math.round((Number(panSlider.value) * (SAMPLE_COUNT - width)) / 1000);
        this.setRange(start, start + width);
      },
      options
    );
    this.canvas.addEventListener(
      'wheel',
      event => {
        event.preventDefault();
        const fraction = this.getFraction(event.clientX);
        const anchor = this.start + fraction * (this.end - this.start);
        const width = Math.max(
          64,
          Math.min(
            SAMPLE_COUNT,
            Math.round((this.end - this.start) * Math.exp(event.deltaY * 0.002))
          )
        );
        const start = Math.max(
          0,
          Math.min(SAMPLE_COUNT - width, Math.round(anchor - fraction * width))
        );
        this.setRange(start, start + width);
      },
      {...options, passive: false}
    );
    this.canvas.addEventListener(
      'pointerdown',
      event => {
        this.pointerStart = event.clientX;
        this.canvas.setPointerCapture(event.pointerId);
      },
      options
    );
    this.canvas.addEventListener(
      'pointerup',
      event => {
        if (this.pointerStart === null) return;
        const first = this.getFraction(this.pointerStart);
        const last = this.getFraction(event.clientX);
        if (Math.abs(this.pointerStart - event.clientX) > 6) {
          const width = this.end - this.start;
          this.setRange(
            this.start + Math.floor(Math.min(first, last) * width),
            this.start + Math.ceil(Math.max(first, last) * width)
          );
        } else {
          void this.inspect(event.clientX, event.clientY);
        }
        this.pointerStart = null;
      },
      options
    );
    this.canvas.addEventListener(
      'pointercancel',
      () => {
        this.pointerStart = null;
      },
      options
    );
    this.updateLabels();
  }

  override onRender({device}: AnimationProps): void {
    if (this.dirty) {
      this.encodeRange();
      this.dirty = false;
    }
    const renderPass = device.beginRenderPass({
      clearColor: [0.025, 0.042, 0.075, 1],
      clearDepth: 1
    });
    for (const model of this.models) model.draw(renderPass);
    renderPass.end();
  }

  private encodeRange(): void {
    const querySet =
      !this.timingPending && this.device.features.has('timestamp-query')
        ? this.device.createQuerySet({
            id: 'signal-room-timestamps',
            type: 'timestamp',
            count: this.compiled.stats.nodeOrder.length * 2
          })
        : undefined;
    const commandEncoder = querySet
      ? this.device.createCommandEncoder({timeProfilingQuerySet: querySet})
      : this.device.commandEncoder;
    const encoding = this.compiled.encode(commandEncoder, {parameters: undefined});
    this.graphInspector.recordEncoding(this.compiled.id, encoding);
    if (querySet) {
      // Submit before mapping timestamps; subsequent chart draws use the same ordered queue.
      this.device.submit(commandEncoder.finish());
      this.timingPending = true;
      void this.graphInspector.recordGPUTimings(this.compiled.id, encoding).finally(() => {
        querySet.destroy();
        this.timingPending = false;
        if (!this.finalized) {
          this.graphDebugPanel.update(this.graphInspector.getSnapshot(), this.compiled.id);
        }
      });
    }
    this.graphDebugPanel.update(this.graphInspector.getSnapshot(), this.compiled.id);
  }

  override onFinalize(): void {
    this.finalized = true;
    this.events.abort();
    this.panels.finalize();
    this.overlay.remove();
    this.compiled.destroy();
    for (const model of this.models) model.destroy();
    for (const vector of this.vectors) vector.destroy();
    for (const buffer of this.buffers) buffer.destroy();
  }

  private makeBuffer(id: string, data: Float32Array | Uint32Array): Buffer {
    const buffer = this.device.createBuffer({
      id,
      data,
      usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC
    });
    this.buffers.push(buffer);
    return buffer;
  }

  private makeVector<Format extends GPUVectorFormat>(
    name: string,
    format: Format,
    buffer: Buffer,
    length: number
  ): GPUVector<Format> {
    const vector = new GPUVector<Format>({
      type: 'buffer',
      name,
      format,
      buffer,
      length,
      ownsBuffer: false
    });
    this.vectors.push(vector);
    return vector;
  }

  private getFraction(clientX: number): number {
    const rectangle = this.canvas.getBoundingClientRect();
    return Math.max(
      0,
      Math.min(1, (clientX - rectangle.left - rectangle.width * 0.07) / (rectangle.width * 0.88))
    );
  }

  private setRange(start: number, end: number): void {
    this.start = Math.max(0, Math.min(SAMPLE_COUNT - 1, start));
    this.end = Math.max(this.start + 1, Math.min(SAMPLE_COUNT, end));
    this.range.write(new Uint32Array([this.start, this.end]));
    this.dirty = true;
    this.updateLabels();
  }

  private updateLabels(): void {
    const incident = this.overlay.querySelector<HTMLElement>('[data-incident]');
    const incidentFraction = (INCIDENT_SAMPLE - this.start) / (this.end - this.start);
    if (incident) {
      incident.hidden = incidentFraction < 0 || incidentFraction >= 1;
      incident.style.left = `${7 + 88 * incidentFraction}%`;
    }
    const gap = this.overlay.querySelector<HTMLElement>('[data-gap]');
    if (gap) {
      const first = Math.max(this.start, GAP_START);
      const last = Math.min(this.end, GAP_END);
      gap.hidden = last <= first;
      gap.style.left = `${7 + (88 * (first - this.start)) / (this.end - this.start)}%`;
      gap.style.width = `${(88 * Math.max(0, last - first)) / (this.end - this.start)}%`;
    }
    for (const tick of this.overlay.querySelectorAll<HTMLElement>('[data-tick]')) {
      tick.textContent = formatTime(
        this.start + ((this.end - this.start) * Number(tick.dataset['tick'])) / 4
      );
    }
    const label = this.overlay.querySelector('[data-range]');
    if (label)
      label.textContent = `${formatTime(this.start)} — ${formatTime(this.end)} · ${(this.end - this.start).toLocaleString()} samples / channel · ${(SAMPLE_COUNT / (this.end - this.start)).toFixed(1)}× zoom`;
    const width = this.end - this.start;
    const zoom = this.controls.querySelector<HTMLInputElement>('[data-control="zoom"]');
    if (zoom) zoom.value = String(Math.log2(SAMPLE_COUNT / width));
    const pan = this.controls.querySelector<HTMLInputElement>('[data-control="pan"]');
    if (pan) {
      pan.value = String((1000 * this.start) / Math.max(1, SAMPLE_COUNT - width));
      pan.disabled = width === SAMPLE_COUNT;
      pan.title = pan.disabled ? 'Zoom in to pan through history' : 'Move the visible time window';
    }
  }

  private setGuide(title: string, description: string): void {
    const heading = this.controls.querySelector('[data-guide-title]');
    const text = this.controls.querySelector('[data-guide-text]');
    if (heading) heading.textContent = title;
    if (text) text.textContent = description;
  }

  private async inspect(clientX: number, clientY: number): Promise<void> {
    if (this.inspecting || this.dirty) return;
    const rectangle = this.canvas.getBoundingClientRect();
    const channel = Math.floor(((clientY - rectangle.top) / rectangle.height - 0.22) / 0.22);
    if (channel < 0 || channel >= SERIES.length) return;
    const bucket = Math.min(BIN_COUNT - 1, Math.floor(this.getFraction(clientX) * BIN_COUNT));
    const output = this.outputs[channel];
    const version = `${this.start}:${this.end}`;
    this.inspecting = true;
    try {
      const [values, identifiers, counts] = await Promise.all([
        output.values.readAsync(bucket * 16, 16),
        output.identifiers.readAsync(bucket * 16, 16),
        output.counts.readAsync(bucket * 8, 8)
      ]);
      if (this.finalized || version !== `${this.start}:${this.end}`) return;
      const summary = new Float32Array(values.buffer, values.byteOffset, values.byteLength / 4);
      const sourceIds = new Uint32Array(
        identifiers.buffer,
        identifiers.byteOffset,
        identifiers.byteLength / 4
      );
      const population = new Uint32Array(counts.buffer, counts.byteOffset, counts.byteLength / 4);
      const label = this.overlay.querySelector('[data-inspector]');
      if (label)
        label.textContent = population[0]
          ? `${SERIES[channel].name}: ${summary[0].toFixed(2)}–${summary[1].toFixed(2)} ${SERIES[channel].unit} · peak at sample ${sourceIds[1].toLocaleString()} · ${population[0]} valid / ${population[1]} missing`
          : `No observations in this bin · ${population[1]} missing samples`;
    } catch {
      const label = this.overlay.querySelector('[data-inspector]');
      if (!this.finalized && label)
        label.textContent = 'Inspection unavailable. Try again after the next frame.';
    } finally {
      this.inspecting = false;
    }
  }
}

function formatTime(sample: number): string {
  const seconds = Math.floor(sample / 10);
  return `${String(Math.floor(seconds / 3600)).padStart(2, '0')}:${String(Math.floor(seconds / 60) % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function makeChartShader(channel: number): string {
  const series = SERIES[channel];
  return /* wgsl */ `
@group(0) @binding(0) var<storage, read> summary: array<vec4f>;
@group(0) @binding(1) var<storage, read> counts: array<vec2u>;
@group(0) @binding(2) var<storage, read> display: array<u32>;
struct VertexOutput { @builtin(position) position: vec4f, @location(0) color: vec4f }
@vertex fn vertexMain(@builtin(vertex_index) vertex: u32, @builtin(instance_index) bucket: u32) -> VertexOutput {
  let corners = array<vec2f, 6>(vec2f(0,0), vec2f(1,0), vec2f(0,1), vec2f(0,1), vec2f(1,0), vec2f(1,1));
  let corner = corners[vertex];
  let values = summary[bucket];
  let minimum = select(values.z, values.x, display[0] != 0u);
  let maximum = select(values.z, values.y, display[0] != 0u);
  let low = minimum / ${series.maximum}.0;
  let high = max(low + 0.008, maximum / ${series.maximum}.0);
  let x = -0.86 + 1.76 * (f32(bucket) + corner.x) / ${BIN_COUNT}.0;
  let y = ${0.56 - channel * 0.44} - 0.34 + 0.34 * mix(low, high, corner.y);
  let visible = counts[bucket].x > 0u;
  var result: VertexOutput;
  result.position = vec4f(select(3.0, x, visible), y, 0, 1);
  let tint = select(vec3f(${series.color.join(',')}), vec3f(0.95,0.78,0.35), counts[bucket].y > 0u);
  result.color = vec4f(tint, 1);
  return result;
}
@fragment fn fragmentMain(input: VertexOutput) -> @location(0) vec4f { return input.color; }
`;
}

function makeOverlay(): string {
  return `<style>
.signal-room{position:absolute;inset:0;color:#dbe6f4;font:12px/1.5 system-ui;pointer-events:none;padding:22px 7%;box-sizing:border-box}
.signal-room .guide{max-width:55%;font-size:12px;color:#9caec4}.signal-room .guide strong{display:block;font-size:14px;color:#f3f7ff;margin-bottom:4px}.signal-room .incident{position:absolute;top:24%;bottom:17%;border-left:1px dashed #8194a255}.signal-room .incident span{position:absolute;top:-15px;left:5px;white-space:nowrap;font-size:10px;color:#9bafc2}.signal-room .gap{position:absolute;top:24%;bottom:17%;background:#e9b75c0c;border-left:1px dashed #e9b75c66;border-right:1px dashed #e9b75c66}.signal-room .legend{position:absolute;left:7%;top:16%;color:#839bb3;font-size:10px}.signal-room .legend b{color:#60dce9;font-weight:normal}
.signal-room .time-axis{position:absolute;left:7%;right:5%;display:flex;justify-content:space-between;font-size:9px;color:#66809b;font-variant-numeric:tabular-nums}
.signal-room header{display:flex;align-items:start;justify-content:space-between;gap:12px}.signal-room h1{font-size:25px;letter-spacing:-1px;margin:0;color:#f3f7ff}.signal-room .eyebrow{color:#59d9ed;letter-spacing:2px;font-size:10px}.signal-room .badge{border:1px solid #2a4058;border-radius:20px;padding:5px 11px;color:#9caec4;font-size:11px}.signal-room .range{position:absolute;left:7%;bottom:48px;color:#9caec4;font-variant-numeric:tabular-nums}
.signal-room .chart-label{position:absolute;left:7%;right:5%;border-top:1px solid #233349;padding-top:5px;display:flex;justify-content:space-between}.signal-room .chart-label span{color:#71869f}.signal-room footer{position:absolute;left:7%;right:5%;bottom:12px}.signal-room .inspector{margin-top:5px;color:#9caec4;font-size:11px;min-height:16px}
@media(max-width:650px){.signal-room .guide{font-size:10px;max-width:50%}.signal-room .guide strong{font-size:11px}.signal-room .eyebrow{display:none}.signal-room .range{font-size:9px}.signal-room .legend{font-size:8px}.signal-room h1{font-size:20px}.signal-room .time-axis{font-size:8px}}
@media(max-height:500px){.signal-room{padding-top:8px}.signal-room h1{font-size:18px}.signal-room .badge,.signal-room .eyebrow{display:none}.signal-room footer{bottom:4px}.signal-room .inspector{display:none}}
</style>

<div class="range" data-range></div><div class="legend"><b>│</b> Vertical marks = lowest to highest value · blanks = missing data · synthetic observations</div><div class="incident" data-incident><span>Service incident</span></div><div class="gap" data-gap></div>
${SERIES.map((series, index) => `<div class="chart-label" style="top:${20 + index * 22}%;color:rgb(${series.color.map(value => value * 255).join(',')})"><strong>${series.name}</strong><span>0–${series.maximum} ${series.unit}</span></div>`).join('')}
${[0, 1, 2].map(channel => `<div class="time-axis" style="top:${39 + channel * 22}%">${[0, 1, 2, 3, 4].map(tick => `<span data-tick="${tick}"></span>`).join('')}</div>`).join('')}
<footer><div class="inspector" data-inspector>Drag to zoom · scroll to zoom at pointer · click a chart to inspect · amber bins contain missing samples</div></footer>`;
}

function makeControls(): string {
  return `<div class="control-card"><h2>Explore the signals</h2><div class="hint"><strong data-guide-title>Find the service incident</strong><br><span data-guide-text>These three signals cover 29 hours. Look for the aligned rise, then choose “1. Inspect incident”.</span></div><div class="controls" style="display:flex;flex-wrap:wrap;gap:6px;margin:10px 0"><button data-action="reset">Full history</button><button data-action="incident">1. Inspect incident</button><button data-action="mode">2. Hide peaks</button><button data-action="gap">3. Inspect missing data</button></div><div class="sliders"><label>Zoom<input data-control="zoom" type="range" min="0" max="14" step="0.05" value="0" aria-label="Zoom into history"></label><label>Pan<input data-control="pan" type="range" min="0" max="1000" value="0" aria-label="Pan through history"></label></div><p class="hint">Drag a chart or scroll to zoom. Click a chart to inspect its original samples. GPU Graph shows the reduction passes executed when the visible range changes.</p><p class="hint" data-timing-status></p></div>`;
}
