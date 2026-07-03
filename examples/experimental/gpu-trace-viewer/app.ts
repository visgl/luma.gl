// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type Device, type RenderBundle} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {AnimationLoopTemplate, Computation, Model} from '@luma.gl/engine';
import {
  DrawCommandBuffer,
  GPUCommandGraph,
  GPUCompaction,
  type CompiledGPUCommandGraph
} from '@luma.gl/experimental';
import {ColumnPanel, type Panel} from '@deck.gl-community/panels';
import {
  ExamplePanelManager,
  makeExamplePanelHostHtml,
  makeHtmlCustomPanel
} from '../../example-panels';
import {makeTraceGroups, TRACE_DURATION, TRACE_GROUPS, TRACE_LANE_COUNT} from './trace-data';
import {getVisibilityShader, TRACE_RENDER_SHADER} from './trace-shaders';

export const title = 'GPU Command Graph Trace Viewer';
export const description =
  'Millions of trace spans filtered, compacted, and drawn indirectly without per-span CPU work.';

const CAPACITY_OPTIONS = [250_000, 1_000_000, 4_000_000] as const;
const DEFAULT_CAPACITY = 1_000_000;
const UINT32_BYTE_LENGTH = Uint32Array.BYTES_PER_ELEMENT;

type TraceViewParameters = {
  timeMin: number;
  timeMax: number;
  laneMin: number;
  laneMax: number;
};

type TraceGroupResources = {
  name: (typeof TRACE_GROUPS)[number];
  count: number;
  spans: Buffer;
  visibleIds: Buffer;
};

type TraceGraphResources = {
  compiled: CompiledGPUCommandGraph<TraceViewParameters>;
  drawCommands: DrawCommandBuffer;
  groups: TraceGroupResources[];
  renderBundle: RenderBundle;
};

export default class GPUTraceViewerAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeExamplePanelHostHtml();
  static props = {createFramebuffer: true, debug: true};

  readonly device: Device;
  readonly model: Model;
  readonly viewUniformBuffer: Buffer;
  readonly panels: ExamplePanelManager;

  private resources: TraceGraphResources | null = null;
  private capacity = DEFAULT_CAPACITY;
  private enabledMask = 0b111;
  private autoScroll = true;
  private view: TraceViewParameters = {timeMin: 0, timeMax: 150, laneMin: 0, laneMax: 72};
  private dragging = false;
  private lastPointer: [number, number] = [0, 0];
  private encodeTimeMilliseconds = 0;
  private compileCount = 0;
  private compileTimeMilliseconds = 0;
  private sampledVisibleCounts = [0, 0, 0];
  private countReadPending = false;
  private frameIndex = 0;
  private canvas: HTMLCanvasElement | null = null;

  private statsElement: HTMLElement | null = null;
  private nodesElement: HTMLElement | null = null;
  private capacityElement: HTMLElement | null = null;

  constructor({device}: AnimationProps) {
    super();
    if (device.type !== 'webgpu') {
      throw new Error('GPU Command Graph Trace Viewer requires WebGPU');
    }
    this.device = device;
    this.viewUniformBuffer = device.createBuffer({
      id: 'gpu-trace-view-uniforms',
      byteLength: 32,
      usage: Buffer.UNIFORM | Buffer.COPY_DST
    });
    this.model = new Model(device, {
      id: 'gpu-trace-span-model',
      source: TRACE_RENDER_SHADER,
      topology: 'triangle-list',
      vertexCount: 6,
      colorAttachmentFormats: [device.preferredColorFormat],
      depthStencilAttachmentFormat: 'depth24plus',
      shaderLayout: {
        attributes: [],
        bindings: [
          {name: 'spans', type: 'read-only-storage', group: 0, location: 0},
          {name: 'visibleIds', type: 'read-only-storage', group: 0, location: 1},
          {name: 'viewUniforms', type: 'uniform', group: 0, location: 2}
        ]
      },
      parameters: {
        blend: true,
        blendColorOperation: 'add',
        blendColorSrcFactor: 'src-alpha',
        blendColorDstFactor: 'one-minus-src-alpha',
        blendAlphaOperation: 'add',
        blendAlphaSrcFactor: 'one',
        blendAlphaDstFactor: 'one-minus-src-alpha'
      }
    });
    this.panels = new ExamplePanelManager({panel: this.makePanel()});
    this.rebuild(DEFAULT_CAPACITY);
    this.panels.mount();
  }

  override async onInitialize({canvas}: AnimationProps): Promise<void> {
    if (canvas instanceof HTMLCanvasElement) {
      this.canvas = canvas;
      canvas.style.cursor = 'grab';
      canvas.addEventListener('pointerdown', this.handlePointerDown);
      canvas.addEventListener('pointermove', this.handlePointerMove);
      canvas.addEventListener('pointerup', this.handlePointerUp);
      canvas.addEventListener('pointercancel', this.handlePointerUp);
      canvas.addEventListener('wheel', this.handleWheel, {passive: false});
    }
  }

  override onRender({device, time, width, height}: AnimationProps): void {
    const resources = this.resources;
    if (!resources) {
      return;
    }
    if (this.autoScroll) {
      const windowSize = this.view.timeMax - this.view.timeMin;
      this.view.timeMin = ((time * 0.025) % (TRACE_DURATION + windowSize)) - windowSize;
      this.view.timeMax = this.view.timeMin + windowSize;
    }
    this.writeViewUniforms(width, height);
    const encodeStart = performance.now();
    resources.compiled.encode(device.commandEncoder, {parameters: this.view});
    this.encodeTimeMilliseconds = performance.now() - encodeStart;
    this.frameIndex++;
    if (this.frameIndex % 60 === 0) {
      void this.sampleVisibleCounts();
    }
    if (this.frameIndex % 10 === 0) {
      this.updateInspector();
    }
  }

  override onFinalize(): void {
    if (this.canvas) {
      this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
      this.canvas.removeEventListener('pointermove', this.handlePointerMove);
      this.canvas.removeEventListener('pointerup', this.handlePointerUp);
      this.canvas.removeEventListener('pointercancel', this.handlePointerUp);
      this.canvas.removeEventListener('wheel', this.handleWheel);
    }
    this.panels.finalize();
    this.destroyResources();
    this.model.destroy();
    this.viewUniformBuffer.destroy();
  }

  private rebuild(capacity: number): void {
    const started = performance.now();
    this.destroyResources();
    this.capacity = capacity;
    const groups = makeTraceGroups(capacity).map(group => ({
      name: group.name,
      count: group.count,
      spans: this.device.createBuffer({
        id: `gpu-trace-${group.name}-spans`,
        data: group.data,
        usage: Buffer.STORAGE | Buffer.COPY_DST
      }),
      visibleIds: this.device.createBuffer({
        id: `gpu-trace-${group.name}-visible-ids`,
        byteLength: group.count * UINT32_BYTE_LENGTH,
        usage: Buffer.STORAGE | Buffer.COPY_SRC
      })
    }));
    const drawCommands = new DrawCommandBuffer(this.device, {
      id: 'gpu-trace-draw-commands',
      type: 'draw',
      commands: groups.map(() => ({vertexCount: 6, instanceCount: 0}))
    });
    const renderBundle = this.createRenderBundle(groups, drawCommands);
    const compiled = this.createGraph(groups, drawCommands, renderBundle);
    this.resources = {compiled, drawCommands, groups, renderBundle};
    this.compileCount++;
    this.compileTimeMilliseconds = performance.now() - started;
    this.sampledVisibleCounts = [0, 0, 0];
    this.updateInspector();
  }

  private createGraph(
    groups: TraceGroupResources[],
    drawCommands: DrawCommandBuffer,
    renderBundle: RenderBundle
  ): CompiledGPUCommandGraph<TraceViewParameters> {
    const graph = new GPUCommandGraph<TraceViewParameters>(this.device, {
      id: 'gpu-trace-command-graph'
    });
    const viewUniforms = graph.importBuffer(
      {
        id: 'view-uniforms',
        byteLength: this.viewUniformBuffer.byteLength,
        usage: this.viewUniformBuffer.usage
      },
      this.viewUniformBuffer
    );
    const drawCommandHandle = graph.importBuffer(
      {
        id: 'draw-commands',
        byteLength: drawCommands.buffer.byteLength,
        usage: drawCommands.buffer.usage
      },
      drawCommands.buffer
    );
    const renderResources: Array<{
      buffer: ReturnType<GPUCommandGraph<TraceViewParameters>['importBuffer']>;
      usage: 'storage-read';
    }> = [];

    groups.forEach((group, groupIndex) => {
      const spans = graph.importBuffer(
        {id: `${group.name}-spans`, byteLength: group.spans.byteLength, usage: group.spans.usage},
        group.spans
      );
      const visibleIds = graph.importBuffer(
        {
          id: `${group.name}-visible-ids`,
          byteLength: group.visibleIds.byteLength,
          usage: group.visibleIds.usage
        },
        group.visibleIds
      );
      renderResources.push({buffer: spans, usage: 'storage-read'});
      renderResources.push({buffer: visibleIds, usage: 'storage-read'});
      const flagsBuffer = graph.createTransientBuffer({
        id: `${group.name}-flags`,
        byteLength: group.count * UINT32_BYTE_LENGTH,
        usage: Buffer.STORAGE
      });
      const sourceIdsBuffer = graph.createTransientBuffer({
        id: `${group.name}-source-ids`,
        byteLength: group.count * UINT32_BYTE_LENGTH,
        usage: Buffer.STORAGE
      });
      const flags = graph.createDataView(flagsBuffer, {format: 'uint32', length: group.count});
      const sourceIds = graph.createDataView(sourceIdsBuffer, {
        format: 'uint32',
        length: group.count
      });
      const visibleIdView = graph.createDataView(visibleIds, {
        format: 'uint32',
        length: group.count
      });
      const count = graph.createDataView(drawCommandHandle, {
        format: 'uint32',
        length: 1,
        byteOffset: drawCommands.getInstanceCountByteOffset(groupIndex)
      });
      const visibilityId = `${group.name}-visibility`;
      graph.addComputePass({
        id: visibilityId,
        resources: [
          {buffer: spans, usage: 'storage-read'},
          {buffer: viewUniforms, usage: 'uniform'},
          {buffer: flags, usage: 'storage-write'},
          {buffer: sourceIds, usage: 'storage-write'}
        ],
        compile: ({device}) => {
          const computation = new Computation(device, {
            id: visibilityId,
            source: getVisibilityShader(group.count, groupIndex),
            shaderLayout: {
              bindings: [
                {name: 'spans', type: 'storage', group: 0, location: 0},
                {name: 'viewUniforms', type: 'uniform', group: 0, location: 1},
                {name: 'flags', type: 'storage', group: 0, location: 2},
                {name: 'sourceIds', type: 'storage', group: 0, location: 3}
              ]
            }
          });
          return {
            encode: ({computePass, getBuffer}) => {
              computation.setBindings({
                spans: getBuffer(spans),
                viewUniforms: getBuffer(viewUniforms),
                flags: getBuffer(flags),
                sourceIds: getBuffer(sourceIds)
              });
              computation.dispatch(computePass, Math.ceil(group.count / 256));
            },
            destroy: () => computation.destroy()
          };
        }
      });
      new GPUCompaction({
        id: `${group.name}-compaction`,
        input: sourceIds,
        flags,
        output: visibleIdView,
        count
      }).addToGraph(graph);
    });

    graph.addRenderPass({
      id: 'render-visible-spans',
      resources: [
        ...renderResources,
        {buffer: viewUniforms, usage: 'uniform'},
        {buffer: drawCommandHandle, usage: 'indirect'}
      ],
      compile: () => ({
        getRenderPassProps: () => ({
          id: 'gpu-trace-render-pass',
          clearColor: [0.012, 0.018, 0.035, 1],
          clearDepth: false,
          clearStencil: false
        }),
        encode: ({renderPass}) => renderPass.executeBundles([renderBundle])
      })
    });
    return graph.compile();
  }

  private createRenderBundle(
    groups: TraceGroupResources[],
    drawCommands: DrawCommandBuffer
  ): RenderBundle {
    const encoder = this.device.createRenderBundleEncoder({
      id: 'gpu-trace-render-bundle',
      colorAttachmentFormats: [this.device.preferredColorFormat],
      depthStencilAttachmentFormat: 'depth24plus'
    });
    encoder.setPipeline(this.model.pipeline);
    encoder.setVertexArray(this.model.vertexArray);
    groups.forEach((group, groupIndex) => {
      encoder.setBindings({
        spans: group.spans,
        visibleIds: group.visibleIds,
        viewUniforms: this.viewUniformBuffer
      });
      drawCommands.draw(encoder, groupIndex);
    });
    return encoder.finish();
  }

  private writeViewUniforms(width: number, height: number): void {
    const data = new ArrayBuffer(32);
    const floats = new Float32Array(data);
    const uints = new Uint32Array(data);
    floats[0] = this.view.timeMin;
    floats[1] = this.view.timeMax;
    floats[2] = this.view.laneMin;
    floats[3] = this.view.laneMax;
    uints[4] = this.enabledMask;
    floats[5] = width;
    floats[6] = height;
    this.viewUniformBuffer.write(data);
  }

  private async sampleVisibleCounts(): Promise<void> {
    const resources = this.resources;
    if (!resources || this.countReadPending) {
      return;
    }
    this.countReadPending = true;
    try {
      const bytes = await resources.drawCommands.buffer.readAsync();
      const values = new Uint32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
      this.sampledVisibleCounts = resources.groups.map((_, index) => values[index * 4 + 1] ?? 0);
      this.updateInspector();
    } finally {
      this.countReadPending = false;
    }
  }

  private destroyResources(): void {
    if (!this.resources) {
      return;
    }
    this.resources.compiled.destroy();
    this.resources.renderBundle.destroy();
    this.resources.drawCommands.destroy();
    for (const group of this.resources.groups) {
      group.spans.destroy();
      group.visibleIds.destroy();
    }
    this.resources = null;
  }

  private makePanel(): Panel {
    return new ColumnPanel({
      id: 'gpu-trace-viewer-panel',
      title: 'GPU Command Graph',
      panels: [
        makeHtmlCustomPanel({
          id: 'gpu-trace-overview',
          title: '',
          html: `<p style="margin:0;line-height:1.45">A fixed command graph filters millions of spans, scans visibility flags, compacts source IDs, writes indirect instance counts, and replays three stable draw commands.</p>`
        }),
        makeHtmlCustomPanel({
          id: 'gpu-trace-controls',
          title: 'Controls',
          html: this.getControlsHtml(),
          onRender: root => this.bindPanelControls(root)
        }),
        makeHtmlCustomPanel({
          id: 'gpu-trace-stats',
          title: 'Live graph inspector',
          html: `<div data-capacity></div><div data-stats></div><div data-nodes style="margin-top:10px;font:11px/1.45 ui-monospace,monospace;max-height:260px;overflow:auto"></div>`,
          onRender: root => {
            this.capacityElement = root.querySelector('[data-capacity]');
            this.statsElement = root.querySelector('[data-stats]');
            this.nodesElement = root.querySelector('[data-nodes]');
            this.updateInspector();
            return () => {
              this.capacityElement = null;
              this.statsElement = null;
              this.nodesElement = null;
            };
          }
        })
      ]
    });
  }

  private getControlsHtml(): string {
    return `<div style="display:grid;gap:10px">
      <label>Capacity <select data-capacity-select>${CAPACITY_OPTIONS.map(value => `<option value="${value}"${value === this.capacity ? ' selected' : ''}>${formatCount(value)}</option>`).join('')}</select></label>
      ${TRACE_GROUPS.map((name, index) => `<label><input type="checkbox" data-group="${index}" checked> ${name}</label>`).join('')}
      <label><input type="checkbox" data-auto-scroll checked> Auto-scroll time window</label>
      <button type="button" data-reset>Reset view</button>
      <small>Drag the canvas to pan. Use the wheel to zoom around the cursor.</small>
    </div>`;
  }

  private bindPanelControls(root: HTMLElement): () => void {
    const capacitySelect = root.querySelector('[data-capacity-select]') as HTMLSelectElement;
    const autoScroll = root.querySelector('[data-auto-scroll]') as HTMLInputElement;
    const reset = root.querySelector('[data-reset]') as HTMLButtonElement;
    const groupInputs = Array.from(root.querySelectorAll<HTMLInputElement>('[data-group]'));
    const onCapacity = (): void => this.rebuild(Number(capacitySelect.value));
    const onAutoScroll = (): void => {
      this.autoScroll = autoScroll.checked;
    };
    const onReset = (): void => {
      this.view = {timeMin: 0, timeMax: 150, laneMin: 0, laneMax: 72};
      this.autoScroll = false;
      autoScroll.checked = false;
    };
    const onGroups = (): void => {
      this.enabledMask = groupInputs.reduce(
        (mask, input) => mask | (input.checked ? 1 << Number(input.dataset.group) : 0),
        0
      );
    };
    capacitySelect.addEventListener('change', onCapacity);
    autoScroll.addEventListener('change', onAutoScroll);
    reset.addEventListener('click', onReset);
    groupInputs.forEach(input => input.addEventListener('change', onGroups));
    return () => {
      capacitySelect.removeEventListener('change', onCapacity);
      autoScroll.removeEventListener('change', onAutoScroll);
      reset.removeEventListener('click', onReset);
      groupInputs.forEach(input => input.removeEventListener('change', onGroups));
    };
  }

  private updateInspector(): void {
    const stats = this.resources?.compiled.stats;
    if (!stats) {
      return;
    }
    if (this.capacityElement) {
      this.capacityElement.innerHTML = `<strong>${formatCount(this.capacity)}</strong> total spans · graph compile #${this.compileCount} (${this.compileTimeMilliseconds.toFixed(1)} ms)`;
    }
    if (this.statsElement) {
      const visible = this.sampledVisibleCounts.reduce((sum, count) => sum + count, 0);
      this.statsElement.innerHTML = `<div style="display:grid;grid-template-columns:1fr auto;gap:4px 12px;margin-top:8px">
        <span>Sampled visible</span><strong>${formatCount(visible)}</strong>
        <span>CPU encode</span><strong>${this.encodeTimeMilliseconds.toFixed(2)} ms</strong>
        <span>Logical scratch</span><strong>${formatBytes(stats.logicalTransientBytes)}</strong>
        <span>Physical scratch</span><strong>${formatBytes(stats.physicalTransientBytes)}</strong>
        <span>Transient reuse</span><strong>${stats.reusePercentage.toFixed(0)}%</strong>
        <span>Physical allocations</span><strong>${stats.physicalTransientBufferCount}/${stats.logicalTransientBufferCount}</strong>
      </div>`;
    }
    if (this.nodesElement) {
      this.nodesElement.innerHTML = stats.nodeOrder
        .map(
          (node, index) =>
            `<div><span style="opacity:.55">${String(index + 1).padStart(2, '0')}</span> ${node}</div>`
        )
        .join('');
    }
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    this.dragging = true;
    this.autoScroll = false;
    this.lastPointer = [event.clientX, event.clientY];
    this.canvas?.setPointerCapture(event.pointerId);
    if (this.canvas) this.canvas.style.cursor = 'grabbing';
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (!this.dragging || !this.canvas) return;
    const [lastX, lastY] = this.lastPointer;
    const rect = this.canvas.getBoundingClientRect();
    const timeRange = this.view.timeMax - this.view.timeMin;
    const laneRange = this.view.laneMax - this.view.laneMin;
    const timeDelta = ((event.clientX - lastX) / rect.width) * timeRange;
    const laneDelta = ((event.clientY - lastY) / rect.height) * laneRange;
    this.view.timeMin -= timeDelta;
    this.view.timeMax -= timeDelta;
    this.view.laneMin = clamp(this.view.laneMin + laneDelta, 0, TRACE_LANE_COUNT - laneRange);
    this.view.laneMax = this.view.laneMin + laneRange;
    this.lastPointer = [event.clientX, event.clientY];
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    this.dragging = false;
    this.canvas?.releasePointerCapture(event.pointerId);
    if (this.canvas) this.canvas.style.cursor = 'grab';
  };

  private readonly handleWheel = (event: WheelEvent): void => {
    if (!this.canvas) return;
    event.preventDefault();
    this.autoScroll = false;
    const rect = this.canvas.getBoundingClientRect();
    const fraction = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const oldRange = this.view.timeMax - this.view.timeMin;
    const newRange = clamp(oldRange * Math.exp(event.deltaY * 0.0015), 0.5, TRACE_DURATION * 1.5);
    const anchor = this.view.timeMin + oldRange * fraction;
    this.view.timeMin = anchor - newRange * fraction;
    this.view.timeMax = this.view.timeMin + newRange;
  };
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function formatCount(value: number): string {
  return value.toLocaleString('en-US');
}

function formatBytes(value: number): string {
  return value >= 1024 * 1024
    ? `${(value / (1024 * 1024)).toFixed(1)} MiB`
    : `${(value / 1024).toFixed(1)} KiB`;
}
