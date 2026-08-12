// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device, type RenderBundle} from '@luma.gl/core';
import {AnimationLoopTemplate, Computation, Model, type AnimationProps} from '@luma.gl/engine';
import {
  DrawCommandBuffer,
  GPUCommandGraph,
  GPUCommandGraphInspector,
  GPUReadbackRing,
  GPUSceneResourceGroups,
  type CompiledGPUCommandGraph,
  type GPUReadbackTicket,
  type GraphDataView
} from '@luma.gl/experimental';
import {
  GPUTraceInteraction,
  GPUTraceScene,
  getGPUTracePickingShader
} from '@luma.gl/experimental/lutrace';
import {
  ExamplePanelManager,
  makeExamplePanelHostHtml,
  makeHtmlCustomPanel
} from '../../example-panels';
import {GPUCommandGraphInspectorPanel} from '../../gpu-command-graph-inspector-panel';
import {
  makeTraceDataset,
  TRACE_DURATION_FILTER_MAXIMUM,
  TRACE_ERROR_SPAN_FLAG,
  TRACE_EXPANDED_STATE,
  TRACE_GROUPS,
  TRACE_INVALID_SPAN_INDEX,
  TRACE_LANE_COUNT,
  TRACE_LANES_PER_THREAD,
  TRACE_PROCESS_COUNT,
  TRACE_RUNTIME_SPAN_FLAG,
  TRACE_THREAD_COUNT,
  TRACE_THREADS_PER_PROCESS
} from '../gpu-trace-viewer/trace-data';
import {
  getTracePanelStyleMarkup,
  getTracePipelineMarkup,
  getTraceScanScatterMarkup
} from '../gpu-trace-viewer/trace-panel';
import {TRACE_SCENE_RENDER_SHADER} from './trace-scene-shaders';

export const title = 'GPU Scene Trace Explorer';
export const description =
  'Canonical GPU trace scenes with reusable interaction policies, resource groups, stable indirect draws, and GPU picking.';

const STORAGE_USAGE = Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST;
const UINT32_BYTE_LENGTH = Uint32Array.BYTES_PER_ELEMENT;
const DEFAULT_SPAN_COUNT = 768;
const MAXIMUM_FOCUS_DEPTH = 4;
const MAXIMUM_INITIAL_TIME_WINDOW = 150;
const INITIAL_TIME_WINDOW_FRACTION = 0.5;

type OwnedView<Format extends 'uint32' | 'float32'> = {
  buffer: Buffer;
  view: GraphDataView<Format>;
};

type SceneTraceResources = {
  compiled: CompiledGPUCommandGraph<void>;
  trace: GPUTraceScene;
  commands: DrawCommandBuffer;
  renderBundle: RenderBundle;
  buffers: Buffer[];
  timeWindow: Buffer;
  policy: Buffer;
  processStates: Buffer;
  threadStates: Buffer;
  selectedSpans: Buffer;
  selectedCount: Buffer;
  focusDepth: Buffer;
  visibleCount: Buffer;
  groupCounts: Buffer;
  pickRequest: Buffer;
  pickResult: Buffer;
};

/** Bounded, independently registered consumer proving canonical trace and generic scene composition. */
export default class GPUTraceSceneAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeExamplePanelHostHtml();
  static props = {createFramebuffer: true, debug: true};

  readonly device: Device;
  readonly graphInspector = new GPUCommandGraphInspector({maxSamples: 90});

  private readonly model: Model;
  private readonly viewUniforms: Buffer;
  private readonly readbackRing: GPUReadbackRing;
  private readonly panels: ExamplePanelManager;
  private readonly processExpansion = new Uint32Array(TRACE_PROCESS_COUNT).fill(
    TRACE_EXPANDED_STATE
  );
  private readonly threadExpansion = new Uint32Array(TRACE_THREAD_COUNT).fill(TRACE_EXPANDED_STATE);
  private resources: SceneTraceResources;
  private inspectorPanel: GPUCommandGraphInspectorPanel | null = null;
  private controls: HTMLElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private traceDuration = 240;
  private timeMinimum = 0;
  private timeMaximum = 240;
  private minimumDuration = 0;
  private focusEnabled = false;
  private errorsOnly = false;
  private hideRuntime = false;
  private selectedSpan = TRACE_INVALID_SPAN_INDEX;
  private pendingPick: {time: number; lane: number} | null = null;
  private frameIndex = 0;

  constructor({
    device,
    traceCapacity = DEFAULT_SPAN_COUNT
  }: AnimationProps & {traceCapacity?: number}) {
    super();
    if (device.type !== 'webgpu') throw new Error('GPU Scene Trace Explorer requires WebGPU');
    if (!device.features.has('indirect-first-instance')) {
      throw new Error('GPU Scene Trace Explorer requires indirect-first-instance');
    }
    this.device = device;
    this.viewUniforms = device.createBuffer({
      id: 'scene-trace-view',
      byteLength: 32,
      usage: Buffer.UNIFORM | Buffer.COPY_DST
    });
    this.readbackRing = new GPUReadbackRing(device, {
      id: 'scene-trace-readback',
      byteLength: Math.max(TRACE_GROUPS.length * UINT32_BYTE_LENGTH, UINT32_BYTE_LENGTH),
      slotCount: 3
    });
    this.model = new Model(device, {
      id: 'scene-trace-spans',
      source: TRACE_SCENE_RENDER_SHADER,
      topology: 'triangle-list',
      vertexCount: 6,
      colorAttachmentFormats: [device.preferredColorFormat],
      depthStencilAttachmentFormat: 'depth24plus',
      shaderLayout: {
        attributes: [],
        bindings: [
          {name: 'sceneRecords', type: 'read-only-storage', group: 0, location: 0},
          {name: 'spans', type: 'read-only-storage', group: 0, location: 1},
          {name: 'threadOffsets', type: 'read-only-storage', group: 0, location: 2},
          {name: 'view', type: 'uniform', group: 0, location: 3}
        ]
      }
    });
    this.resources = this.createResources(traceCapacity);
    this.panels = new ExamplePanelManager({
      panel: makeHtmlCustomPanel({
        id: 'scene-trace-controls',
        title: 'GPU Scene Trace Explorer',
        html: makeControlMarkup({
          traceStats: this.resources.trace.stats,
          graphNodeCount: this.resources.compiled.stats.nodeOrder.length,
          traceDuration: this.traceDuration
        }),
        onRender: root => this.attachControls(root)
      })
    });
    this.panels.mount();
  }

  override async onInitialize({canvas}: AnimationProps): Promise<void> {
    if (canvas instanceof HTMLCanvasElement) {
      this.canvas = canvas;
      canvas.addEventListener('click', this.handleClick);
      canvas.addEventListener('wheel', this.handleWheel, {passive: false});
    }
  }

  override onRender({device}: AnimationProps): void {
    this.writeControls();
    this.resources.pickResult.write(Uint32Array.of(TRACE_INVALID_SPAN_INDEX));
    const pick = this.pendingPick;
    const request = new ArrayBuffer(16);
    const requestFloats = new Float32Array(request);
    const requestWords = new Uint32Array(request);
    if (pick) {
      requestFloats[0] = pick.time;
      requestFloats[1] = pick.lane;
      requestWords[2] = 1;
    }
    this.resources.pickRequest.write(new Uint8Array(request));

    const encoding = this.resources.compiled.encode(device.commandEncoder, {parameters: undefined});
    this.graphInspector.recordEncoding(this.resources.compiled.id, encoding);
    if (pick) {
      const ticket = this.readbackRing.tryAcquire();
      if (ticket) {
        this.pendingPick = null;
        ticket.copyFrom(device.commandEncoder, this.resources.pickResult, {byteLength: 4});
        queueMicrotask(() => void this.readSelection(ticket));
      }
    }
    if (this.frameIndex++ % 30 === 0) {
      const ticket = this.readbackRing.tryAcquire();
      if (ticket) {
        ticket.copyFrom(device.commandEncoder, this.resources.groupCounts);
        queueMicrotask(() => void this.readGroupCounts(ticket));
      }
      this.inspectorPanel?.update(this.graphInspector.getSnapshot(), this.resources.compiled.id);
    }
  }

  override onFinalize(): void {
    this.canvas?.removeEventListener('click', this.handleClick);
    this.canvas?.removeEventListener('wheel', this.handleWheel);
    this.panels.finalize();
    this.resources.compiled.destroy();
    this.resources.renderBundle.destroy();
    this.resources.commands.destroy();
    this.resources.trace.destroy();
    for (const buffer of this.resources.buffers) buffer.destroy();
    this.readbackRing.destroy();
    this.model.destroy();
    this.viewUniforms.destroy();
  }

  private createResources(capacity: number): SceneTraceResources {
    const dataset = makeTraceDataset(capacity);
    // GPUTraceScene owns dense span-indexed adjacency. The viewer dataset's adjacency is sparse
    // and carries an explicit node table for much larger traces, so it is not interchangeable.
    this.traceDuration = dataset.duration;
    this.timeMinimum = 0;
    this.timeMaximum = Math.min(
      MAXIMUM_INITIAL_TIME_WINDOW,
      dataset.duration * INITIAL_TIME_WINDOW_FRACTION
    );
    const trace = new GPUTraceScene(this.device, {
      id: 'scene-trace',
      spans: dataset.spans,
      parents: dataset.parentSpans,
      links: dataset.dependencies,
      partitions: dataset.groups.map(group => ({
        firstSpan: group.firstSpanIndex,
        spanCount: group.count,
        groupId: group.groupIndex
      })),
      processCount: dataset.processCount,
      threadCount: dataset.threadCount,
      geometryId: 0
    });
    const graph = new GPUCommandGraph<void>(this.device, {id: 'scene-trace-command-graph'});
    const source = trace.importToGraph(graph);
    const commands = new DrawCommandBuffer(this.device, {
      id: 'scene-trace-draws',
      type: 'draw',
      commands: Array.from({length: capacity}, () => ({vertexCount: 6, instanceCount: 0}))
    });
    const commandViews = commands.importToGraph(graph);
    const buffers: Buffer[] = [];
    const makeUint32 = (identifier: string, values: Uint32Array): OwnedView<'uint32'> =>
      makeOwnedView(this.device, graph, buffers, identifier, values, 'uint32');
    const timeWindow = makeOwnedView(
      this.device,
      graph,
      buffers,
      'time-window',
      Float32Array.of(this.timeMinimum, this.timeMaximum, 0),
      'float32'
    );
    const policy = makeUint32('policy', new Uint32Array(3));
    const processStates = makeUint32('process-states', this.processExpansion);
    const threadStates = makeUint32('thread-states', this.threadExpansion);
    const selectedSpans = makeUint32('selected-spans', new Uint32Array(1));
    const selectedCount = makeUint32('selected-count', new Uint32Array(1));
    const focusDepth = makeUint32('focus-depth', Uint32Array.of(2));
    const threadHeights = makeUint32('thread-heights', new Uint32Array(TRACE_THREAD_COUNT));
    const threadOffsets = makeUint32('thread-offsets', new Uint32Array(TRACE_THREAD_COUNT));
    const reachedSpans = makeUint32('reached-spans', new Uint32Array(capacity));
    const visibleMask = makeUint32('visible-mask', new Uint32Array(capacity));
    const visibleSpans = makeUint32('visible-spans', new Uint32Array(capacity));
    const visibleCount = makeUint32('visible-count', new Uint32Array(1));
    const projectedAncestors = makeUint32('projected-ancestors', new Uint32Array(capacity));
    const requiredCount = makeUint32('required-count', new Uint32Array(1));
    const publishedCount = makeUint32('published-count', new Uint32Array(1));
    const drawOverflow = makeUint32('draw-overflow', new Uint32Array(1));

    new GPUTraceInteraction({
      id: 'scene-trace-interaction',
      trace: source,
      timeWindow: timeWindow.view,
      policy: policy.view,
      processStates: processStates.view,
      threadStates: threadStates.view,
      selectedSpans: selectedSpans.view,
      selectedCount: selectedCount.view,
      focusDepth: focusDepth.view,
      threadHeights: threadHeights.view,
      threadOffsets: threadOffsets.view,
      reachedSpans: reachedSpans.view,
      visibleMask: visibleMask.view,
      visibleSpans: visibleSpans.view,
      visibleCount: visibleCount.view,
      projectedAncestors: projectedAncestors.view,
      draw: {
        commands: commandViews,
        requiredCount: requiredCount.view,
        publishedCount: publishedCount.view,
        overflow: drawOverflow.view
      },
      threadsPerProcess: TRACE_THREADS_PER_PROCESS,
      lanesPerThread: TRACE_LANES_PER_THREAD,
      maxFocusDepth: MAXIMUM_FOCUS_DEPTH
    }).addToGraph(graph);

    const groupCounts = makeUint32('group-counts', new Uint32Array(dataset.groups.length));
    const groupOverflows = makeUint32('group-overflows', new Uint32Array(dataset.groups.length));
    const groupOverflow = makeUint32('group-overflow', new Uint32Array(1));
    new GPUSceneResourceGroups({
      id: 'scene-trace-resource-groups',
      scene: source.scene,
      commands: commandViews,
      groups: dataset.groups.map(group => ({
        id: group.groupIndex,
        firstCommand: group.firstSpanIndex,
        commandCount: group.count,
        geometryId: 0
      })),
      counts: groupCounts.view,
      overflows: groupOverflows.view,
      overflow: groupOverflow.view
    }).addToGraph(graph);

    const pickRequest = makeUint32('pick-request', new Uint32Array(4));
    const pickResult = makeUint32('pick-result', Uint32Array.of(TRACE_INVALID_SPAN_INDEX));
    graph.addComputePass({
      id: 'scene-trace-picking',
      resources: [
        {buffer: source.spans, usage: 'storage-read'},
        {buffer: threadOffsets.view, usage: 'storage-read'},
        {buffer: visibleMask.view, usage: 'storage-read'},
        {buffer: pickRequest.view, usage: 'storage-read'},
        {buffer: pickResult.view, usage: 'storage-write'}
      ],
      compile: ({device}) => {
        const computation = new Computation(device, {
          id: 'scene-trace-picking',
          source: getGPUTracePickingShader(capacity, TRACE_LANES_PER_THREAD),
          shaderLayout: {
            bindings: [
              {name: 'spans', type: 'storage', group: 0, location: 0},
              {name: 'threadOffsets', type: 'storage', group: 0, location: 1},
              {name: 'visibleMask', type: 'storage', group: 0, location: 2},
              {name: 'request', type: 'storage', group: 0, location: 3},
              {name: 'result', type: 'storage', group: 0, location: 4}
            ]
          }
        });
        return {
          encode: ({computePass, getBuffer}) => {
            computation.setBindings({
              spans: getBuffer(source.spans),
              threadOffsets: getBuffer(threadOffsets.view),
              visibleMask: getBuffer(visibleMask.view),
              request: getBuffer(pickRequest.view),
              result: getBuffer(pickResult.view)
            });
            computation.dispatch(computePass, Math.ceil(capacity / 256));
          },
          destroy: () => computation.destroy()
        };
      }
    });

    const renderBundle = this.createRenderBundle(trace, commands, threadOffsets.buffer);
    const viewHandle = graph.importBuffer(
      {
        id: 'view-uniforms',
        byteLength: this.viewUniforms.byteLength,
        usage: this.viewUniforms.usage
      },
      this.viewUniforms
    );
    graph.addRenderPass({
      id: 'scene-trace-render',
      resources: [
        {buffer: source.scene.records, usage: 'storage-read'},
        {buffer: source.spans, usage: 'storage-read'},
        {buffer: threadOffsets.view, usage: 'storage-read'},
        {buffer: viewHandle, usage: 'uniform'},
        {buffer: commandViews.buffer, usage: 'indirect'}
      ],
      compile: () => ({
        getRenderPassProps: () => ({
          id: 'scene-trace-render',
          clearColor: [0.012, 0.018, 0.035, 1],
          clearDepth: false,
          clearStencil: false
        }),
        encode: ({renderPass}) => renderPass.executeBundles([renderBundle])
      })
    });
    const compiled = graph.compile();
    this.graphInspector.registerGraph(compiled);
    return {
      compiled,
      trace,
      commands,
      renderBundle,
      buffers,
      timeWindow: timeWindow.buffer,
      policy: policy.buffer,
      processStates: processStates.buffer,
      threadStates: threadStates.buffer,
      selectedSpans: selectedSpans.buffer,
      selectedCount: selectedCount.buffer,
      focusDepth: focusDepth.buffer,
      visibleCount: visibleCount.buffer,
      groupCounts: groupCounts.buffer,
      pickRequest: pickRequest.buffer,
      pickResult: pickResult.buffer
    };
  }

  private createRenderBundle(
    trace: GPUTraceScene,
    commands: DrawCommandBuffer,
    offsets: Buffer
  ): RenderBundle {
    const encoder = this.device.createRenderBundleEncoder({
      id: 'scene-trace-render-bundle',
      colorAttachmentFormats: [this.device.preferredColorFormat],
      depthStencilAttachmentFormat: 'depth24plus'
    });
    encoder.setPipeline(this.model.pipeline);
    encoder.setVertexArray(this.model.vertexArray);
    encoder.setBindings({
      sceneRecords: trace.scene.recordBuffer,
      spans: trace.buffers.spans,
      threadOffsets: offsets,
      view: this.viewUniforms
    });
    for (let commandIndex = 0; commandIndex < commands.capacity; commandIndex++) {
      commands.draw(encoder, commandIndex);
    }
    return encoder.finish();
  }

  private writeControls(): void {
    this.resources.timeWindow.write(
      Float32Array.of(this.timeMinimum, this.timeMaximum, this.minimumDuration)
    );
    this.resources.policy.write(
      Uint32Array.of(
        this.errorsOnly ? TRACE_ERROR_SPAN_FLAG : 0,
        this.hideRuntime ? TRACE_RUNTIME_SPAN_FLAG : 0,
        Number(this.focusEnabled)
      )
    );
    const values = new ArrayBuffer(32);
    new Float32Array(values).set([this.timeMinimum, this.timeMaximum, 0, TRACE_LANE_COUNT]);
    new Uint32Array(values)[4] = this.selectedSpan;
    this.viewUniforms.write(new Uint8Array(values));
  }

  private attachControls(root: HTMLElement): () => void {
    this.controls = root;
    const inspectorHost = root.querySelector<HTMLElement>('[data-scene-trace-inspector]')!;
    this.inspectorPanel = new GPUCommandGraphInspectorPanel(inspectorHost, {
      graphLabels: {[this.resources.compiled.id]: 'Scene interaction + picking + draw'}
    });
    this.inspectorPanel.update(this.graphInspector.getSnapshot(), this.resources.compiled.id);
    root.addEventListener('change', this.handleControlChange);
    root.addEventListener('input', this.handleControlChange);
    return () => {
      root.removeEventListener('change', this.handleControlChange);
      root.removeEventListener('input', this.handleControlChange);
      this.inspectorPanel?.destroy();
      this.inspectorPanel = null;
      this.controls = null;
    };
  }

  private handleControlChange = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (target.dataset.process !== undefined) {
      this.processExpansion[Number(target.dataset.process)] = Number(target.checked);
      this.resources.processStates.write(this.processExpansion);
    } else if (target.dataset.thread !== undefined) {
      this.threadExpansion[Number(target.dataset.thread)] = Number(target.checked);
      this.resources.threadStates.write(this.threadExpansion);
    } else if (target.dataset.errorsOnly !== undefined) {
      this.errorsOnly = target.checked;
    } else if (target.dataset.hideRuntime !== undefined) {
      this.hideRuntime = target.checked;
    } else if (target.dataset.focus !== undefined) {
      this.focusEnabled = target.checked;
    } else if (target.dataset.depth !== undefined) {
      this.resources.focusDepth.write(Uint32Array.of(Number(target.value)));
      const value = this.controls?.querySelector<HTMLElement>('[data-scene-trace-depth-value]');
      if (value) value.textContent = target.value;
    } else if (target.dataset.minimumDuration !== undefined) {
      this.minimumDuration = Number(target.value);
      const value = this.controls?.querySelector<HTMLElement>('[data-scene-trace-duration-value]');
      if (value) value.textContent = `${target.value} ms`;
    }
  };

  private handleClick = (event: MouseEvent): void => {
    const bounds = this.canvas?.getBoundingClientRect();
    if (!bounds?.width || !bounds.height) return;
    this.pendingPick = {
      time:
        this.timeMinimum +
        ((event.clientX - bounds.left) / bounds.width) * (this.timeMaximum - this.timeMinimum),
      lane: ((event.clientY - bounds.top) / bounds.height) * TRACE_LANE_COUNT
    };
  };

  private handleWheel = (event: WheelEvent): void => {
    event.preventDefault();
    const range = this.timeMaximum - this.timeMinimum;
    const delta = event.deltaY * range * 0.001;
    this.timeMinimum = Math.max(0, Math.min(this.traceDuration - range, this.timeMinimum + delta));
    this.timeMaximum = this.timeMinimum + range;
  };

  private async readSelection(ticket: GPUReadbackTicket): Promise<void> {
    try {
      const bytes = await ticket.read();
      this.selectedSpan = new Uint32Array(bytes.buffer, bytes.byteOffset, 1)[0];
      this.resources.selectedSpans.write(Uint32Array.of(this.selectedSpan));
      this.resources.selectedCount.write(
        Uint32Array.of(Number(this.selectedSpan !== TRACE_INVALID_SPAN_INDEX))
      );
      const selection = this.controls?.querySelector<HTMLElement>('[data-scene-trace-selection]');
      if (selection)
        selection.textContent =
          this.selectedSpan === TRACE_INVALID_SPAN_INDEX ? 'None' : `Span ${this.selectedSpan}`;
    } catch {
      // Device loss releases the staging slot without applying an obsolete selection.
    }
  }

  private async readGroupCounts(ticket: GPUReadbackTicket): Promise<void> {
    try {
      const bytes = await ticket.read();
      const counts = new Uint32Array(bytes.buffer, bytes.byteOffset, TRACE_GROUPS.length);
      for (let index = 0; index < TRACE_GROUPS.length; index++) {
        const value = this.controls?.querySelector<HTMLElement>(
          `[data-scene-trace-group="${index}"]`
        );
        if (value) value.textContent = formatSceneCount(counts[index]);
      }
    } catch {
      // Optional diagnostics must not disrupt rendering on cancellation or device loss.
    }
  }
}

function makeOwnedView<Format extends 'uint32' | 'float32'>(
  device: Device,
  graph: GPUCommandGraph<void>,
  ownedBuffers: Buffer[],
  identifier: string,
  values: Format extends 'float32' ? Float32Array : Uint32Array,
  format: Format
): OwnedView<Format> {
  const buffer = device.createBuffer({
    id: `scene-trace-${identifier}`,
    data: values,
    usage: STORAGE_USAGE
  });
  ownedBuffers.push(buffer);
  const handle = graph.importBuffer(
    {id: identifier, byteLength: buffer.byteLength, usage: buffer.usage},
    buffer
  );
  return {buffer, view: graph.createDataView(handle, {format, length: values.length})};
}

function makeControlMarkup({
  traceStats,
  graphNodeCount,
  traceDuration
}: {
  traceStats: GPUTraceScene['stats'];
  graphNodeCount: number;
  traceDuration: number;
}): string {
  const processes = Array.from(
    {length: TRACE_PROCESS_COUNT},
    (_, index) =>
      `<label><input type="checkbox" data-process="${index}" checked /> P${index}</label>`
  ).join(' ');
  const threads = Array.from(
    {length: TRACE_THREADS_PER_PROCESS},
    (_, index) =>
      `<label><input type="checkbox" data-thread="${index}" checked /> T${index}</label>`
  ).join(' ');
  const groupCards = TRACE_GROUPS.map(
    (group, index) => `<article class="trace-metric-card">
      <span class="trace-metric-label">${group}</span>
      <strong class="trace-metric-value" data-scene-trace-group="${index}">—</strong>
      <span class="trace-metric-detail">visible spans</span>
    </article>`
  ).join('');
  return `<section data-scene-trace-panel data-trace-dashboard>
    ${getTracePanelStyleMarkup()}
    <div class="trace-hero">
      <span class="trace-eyebrow">Canonical GPU trace scene</span>
      <strong>Reusable interaction graph + stable indirect draws</strong>
      <p>Scroll to pan. Click a span to select it, then enable dependency focus.</p>
    </div>
    <div class="trace-metric-grid">
      ${makeSceneMetricCard('Trace spans', formatSceneCount(traceStats.spanCount), `${traceDuration.toFixed(0)} ms timeline`)}
      ${makeSceneMetricCard('Dependencies', formatSceneCount(traceStats.linkCount), `${traceStats.partitionCount} resource groups`)}
      ${makeSceneMetricCard('Graph passes', formatSceneCount(graphNodeCount), 'compiled once')}
      ${makeSceneMetricCard('GPU footprint', formatSceneBytes(traceStats.totalByteLength), 'canonical + topology + scene')}
    </div>
    <section class="trace-section">
      <div class="trace-section-header"><span class="trace-section-title">Interaction policy</span><span class="trace-section-note">GPU-resident controls</span></div>
      <div class="trace-check-grid">
        <label><input type="checkbox" data-errors-only /> Errors only</label>
        <label><input type="checkbox" data-hide-runtime /> Hide runtime</label>
        <label><input type="checkbox" data-focus /> Focus linked spans</label>
      </div>
      <div class="trace-control-grid" style="margin-top:7px">
        <label>Dependency hops <span class="trace-section-note" data-scene-trace-depth-value>2</span><input type="range" min="0" max="${MAXIMUM_FOCUS_DEPTH}" value="2" data-depth /></label>
        <label>Minimum duration <span class="trace-section-note" data-scene-trace-duration-value>0.00 ms</span><input type="range" min="0" max="${TRACE_DURATION_FILTER_MAXIMUM}" step="0.01" value="0" data-minimum-duration /></label>
      </div>
    </section>
    <section class="trace-section">
      <div class="trace-section-header"><span class="trace-section-title">Hierarchy layout</span><span class="trace-section-note">expand / collapse</span></div>
      <div class="trace-check-row">${processes}</div>
      <div class="trace-context-line"><span>Process 0 threads</span></div>
      <div class="trace-check-row">${threads}</div>
    </section>
    <div class="trace-selection">Selection: <strong data-scene-trace-selection>None</strong></div>
    <section class="trace-section" data-scene-trace-groups>
      <div class="trace-section-header"><span class="trace-section-title">Visible resource groups</span><span class="trace-section-note">sampled GPU output</span></div>
      <div class="trace-metric-grid">${groupCards}</div>
    </section>
    ${getTracePipelineMarkup()}
    ${getTraceScanScatterMarkup()}
    <section class="trace-section">
      <div class="trace-section-header"><span class="trace-section-title">Command graph</span><span class="trace-section-note">CPU / GPU telemetry</span></div>
      <div data-scene-trace-inspector></div>
    </section>
  </section>`;
}

function makeSceneMetricCard(label: string, value: string, detail: string): string {
  return `<article class="trace-metric-card">
    <span class="trace-metric-label">${label}</span>
    <strong class="trace-metric-value">${value}</strong>
    <span class="trace-metric-detail">${detail}</span>
  </article>`;
}

function formatSceneCount(value: number): string {
  return value.toLocaleString('en-US');
}

function formatSceneBytes(value: number): string {
  return value >= 1024 * 1024
    ? `${(value / (1024 * 1024)).toFixed(1)} MiB`
    : `${(value / 1024).toFixed(1)} KiB`;
}
