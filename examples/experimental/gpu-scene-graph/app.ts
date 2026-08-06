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
  GPUSceneDrawGeneration,
  GPUSceneResourceGroups,
  GPUVisibilityWorkflow,
  GPU_SCENE_INVALID_REFERENCE,
  makeGPUSceneFromCPUScene,
  type CompiledGPUCommandGraph,
  type GPUReadbackTicket,
  type GPUScene,
  type GraphDataView
} from '@luma.gl/experimental';
import {
  ExamplePanelManager,
  makeExamplePanelHostHtml,
  makeHtmlCustomPanel
} from '../../example-panels';
import {GPUCommandGraphInspectorPanel} from '../../gpu-command-graph-inspector-panel';
import {
  makeSceneGraphRoots,
  SCENE_GRAPH_CAPACITY,
  SCENE_GRAPH_GROUPS,
  SCENE_GRAPH_OBJECTS_PER_GROUP
} from './scene-graph-data';
import {
  getSceneGraphPickingShader,
  getSceneGraphVisibilityShader,
  SCENE_GRAPH_RENDER_SHADER
} from './scene-graph-shaders';

export const title = 'GPU Scene Graph Explorer';
export const description =
  'A conventional CPU scene hierarchy feeds generic GPU visibility, resource groups, picking, indirect drawing, and measurable mutation.';

const STORAGE_USAGE = Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST;
const VIEW_BYTE_LENGTH = 32;

type OwnedUint32 = {buffer: Buffer; view: GraphDataView<'uint32'>};

type SceneGraphResources = {
  compiled: CompiledGPUCommandGraph<void>;
  scene: GPUScene;
  commands: DrawCommandBuffer;
  bundle: RenderBundle;
  ownedBuffers: Buffer[];
  visibility: Buffer;
  visibleCount: Buffer;
  groupCounts: Buffer;
  pickRequest: Buffer;
  pickResult: Buffer;
};

/** Conventional CPU-hierarchy consumer of the same flat GPUScene contracts as trace applications. */
export default class GPUSceneGraphAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeExamplePanelHostHtml();
  static props = {createFramebuffer: true, debug: true};

  readonly device: Device;
  readonly graphInspector = new GPUCommandGraphInspector({maxSamples: 90});

  private readonly model: Model;
  private readonly viewUniforms: Buffer;
  private readonly readbackRing: GPUReadbackRing;
  private readonly panels: ExamplePanelManager;
  private resources: SceneGraphResources;
  private inspectorPanel: GPUCommandGraphInspectorPanel | null = null;
  private controls: HTMLElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private enabledGroups = (1 << SCENE_GRAPH_GROUPS.length) - 1;
  private selectedObjectId = GPU_SCENE_INVALID_REFERENCE;
  private pendingPick: readonly [number, number] | null = null;
  private viewBounds: [number, number, number, number] = [-1.1, -1.1, 1.1, 1.1];
  private frameIndex = 0;

  constructor({device}: AnimationProps) {
    super();
    if (device.type !== 'webgpu' || !device.features.has('indirect-first-instance')) {
      throw new Error('GPU Scene Graph Explorer requires indirect-first-instance');
    }
    this.device = device;
    this.viewUniforms = device.createBuffer({
      id: 'scene-graph-view',
      byteLength: VIEW_BYTE_LENGTH,
      usage: Buffer.UNIFORM | Buffer.COPY_DST
    });
    this.readbackRing = new GPUReadbackRing(device, {
      id: 'scene-graph-readback',
      byteLength: SCENE_GRAPH_GROUPS.length * Uint32Array.BYTES_PER_ELEMENT,
      slotCount: 3
    });
    this.model = new Model(device, {
      id: 'scene-graph-model',
      source: SCENE_GRAPH_RENDER_SHADER,
      topology: 'triangle-list',
      vertexCount: 6,
      colorAttachmentFormats: [device.preferredColorFormat],
      depthStencilAttachmentFormat: 'depth24plus',
      shaderLayout: {
        attributes: [],
        bindings: [
          {name: 'records', type: 'read-only-storage', group: 0, location: 0},
          {name: 'view', type: 'uniform', group: 0, location: 1}
        ]
      }
    });
    this.resources = this.createResources();
    this.panels = new ExamplePanelManager({
      panel: makeHtmlCustomPanel({
        id: 'scene-graph-controls',
        title: 'GPU Scene Graph Explorer',
        html: makeControls(),
        onRender: root => this.attachControls(root)
      })
    });
    this.panels.mount();
  }

  override async onInitialize({canvas}: AnimationProps): Promise<void> {
    if (canvas instanceof HTMLCanvasElement) {
      this.canvas = canvas;
      canvas.addEventListener('click', this.handleCanvasClick);
      canvas.addEventListener('wheel', this.handleWheel, {passive: false});
    }
  }

  override onRender({device}: AnimationProps): void {
    this.writeView();
    this.resources.pickResult.write(Uint32Array.of(GPU_SCENE_INVALID_REFERENCE));
    const request = new ArrayBuffer(16);
    if (this.pendingPick) {
      new Float32Array(request).set(this.pendingPick);
      new Uint32Array(request)[2] = 1;
    }
    this.resources.pickRequest.write(new Uint8Array(request));
    const encoding = this.resources.compiled.encode(device.commandEncoder, {parameters: undefined});
    this.graphInspector.recordEncoding(this.resources.compiled.id, encoding);
    if (this.pendingPick) {
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
    this.canvas?.removeEventListener('click', this.handleCanvasClick);
    this.canvas?.removeEventListener('wheel', this.handleWheel);
    this.panels.finalize();
    this.resources.compiled.destroy();
    this.resources.bundle.destroy();
    this.resources.commands.destroy();
    this.resources.scene.destroy();
    for (const buffer of this.resources.ownedBuffers) buffer.destroy();
    this.readbackRing.destroy();
    this.model.destroy();
    this.viewUniforms.destroy();
  }

  private createResources(): SceneGraphResources {
    const scene = makeGPUSceneFromCPUScene(this.device, {
      id: 'scene-graph',
      roots: makeSceneGraphRoots(),
      getChildren: node => node.children,
      getRecord: node => node.record ?? null,
      capacity: SCENE_GRAPH_CAPACITY
    });
    const graph = new GPUCommandGraph<void>(this.device, {id: 'scene-graph-command-graph'});
    const source = scene.importToGraph(graph);
    const view = graph.importBuffer(
      {id: 'view', byteLength: this.viewUniforms.byteLength, usage: this.viewUniforms.usage},
      this.viewUniforms
    );
    const commands = new DrawCommandBuffer(this.device, {
      id: 'scene-graph-draws',
      type: 'draw',
      commands: Array.from({length: SCENE_GRAPH_CAPACITY}, () => ({
        vertexCount: 6,
        instanceCount: 0
      }))
    });
    const commandViews = commands.importToGraph(graph);
    const ownedBuffers: Buffer[] = [];
    const makeUint32 = (identifier: string, length: number): OwnedUint32 => {
      const buffer = this.device.createBuffer({
        id: `scene-graph-${identifier}`,
        data: new Uint32Array(length),
        usage: STORAGE_USAGE
      });
      ownedBuffers.push(buffer);
      const handle = graph.importBuffer(
        {id: identifier, byteLength: buffer.byteLength, usage: buffer.usage},
        buffer
      );
      return {buffer, view: graph.createDataView(handle, {format: 'uint32', length})};
    };
    const visibility = makeUint32('visibility', SCENE_GRAPH_CAPACITY);
    const visibleRows = makeUint32('visible-rows', SCENE_GRAPH_CAPACITY);
    const visibleCount = makeUint32('visible-count', 1);
    const requiredCount = makeUint32('required-count', 1);
    const publishedCount = makeUint32('published-count', 1);
    const drawOverflow = makeUint32('draw-overflow', 1);
    const groupCounts = makeUint32('group-counts', SCENE_GRAPH_GROUPS.length);
    const groupOverflows = makeUint32('group-overflows', SCENE_GRAPH_GROUPS.length);
    const groupOverflow = makeUint32('group-overflow', 1);
    const pickRequest = makeUint32('pick-request', 4);
    const pickResult = makeUint32('pick-result', 1);

    graph.addComputePass({
      id: 'scene-graph-visibility',
      resources: [
        {buffer: source.records, usage: 'storage-read'},
        {buffer: view, usage: 'uniform'},
        {buffer: visibility.view, usage: 'storage-write'}
      ],
      compile: ({device}) => {
        const computation = new Computation(device, {
          id: 'scene-graph-visibility',
          source: getSceneGraphVisibilityShader(SCENE_GRAPH_CAPACITY),
          shaderLayout: {
            bindings: [
              {name: 'records', type: 'storage', group: 0, location: 0},
              {name: 'view', type: 'uniform', group: 0, location: 1},
              {name: 'visibility', type: 'storage', group: 0, location: 2}
            ]
          }
        });
        return {
          encode: ({computePass, getBuffer}) => {
            computation.setBindings({
              records: getBuffer(source.records),
              view: getBuffer(view),
              visibility: getBuffer(visibility.view)
            });
            computation.dispatch(computePass, Math.ceil(SCENE_GRAPH_CAPACITY / 256));
          },
          destroy: () => computation.destroy()
        };
      }
    });
    new GPUVisibilityWorkflow({
      id: 'scene-graph-visible-rows',
      predicates: [{kind: 'bounds', mask: visibility.view}],
      output: visibleRows.view,
      count: visibleCount.view
    }).addToGraph(graph);
    new GPUSceneDrawGeneration({
      id: 'scene-graph-draw-generation',
      scene: source,
      visibility: visibility.view,
      commands: commandViews,
      requiredCount: requiredCount.view,
      publishedCount: publishedCount.view,
      overflow: drawOverflow.view
    }).addToGraph(graph);
    new GPUSceneResourceGroups({
      id: 'scene-graph-resource-groups',
      scene: source,
      commands: commandViews,
      groups: SCENE_GRAPH_GROUPS.map((_, groupIndex) => ({
        id: groupIndex,
        firstCommand: groupIndex * SCENE_GRAPH_OBJECTS_PER_GROUP,
        commandCount: SCENE_GRAPH_OBJECTS_PER_GROUP,
        geometryId: 0
      })),
      counts: groupCounts.view,
      overflows: groupOverflows.view,
      overflow: groupOverflow.view
    }).addToGraph(graph);
    graph.addComputePass({
      id: 'scene-graph-picking',
      resources: [
        {buffer: source.records, usage: 'storage-read'},
        {buffer: visibility.view, usage: 'storage-read'},
        {buffer: pickRequest.view, usage: 'storage-read'},
        {buffer: pickResult.view, usage: 'storage-write'}
      ],
      compile: ({device}) => {
        const computation = new Computation(device, {
          id: 'scene-graph-picking',
          source: getSceneGraphPickingShader(SCENE_GRAPH_CAPACITY),
          shaderLayout: {
            bindings: [
              {name: 'records', type: 'storage', group: 0, location: 0},
              {name: 'visibility', type: 'storage', group: 0, location: 1},
              {name: 'request', type: 'storage', group: 0, location: 2},
              {name: 'result', type: 'storage', group: 0, location: 3}
            ]
          }
        });
        return {
          encode: ({computePass, getBuffer}) => {
            computation.setBindings({
              records: getBuffer(source.records),
              visibility: getBuffer(visibility.view),
              request: getBuffer(pickRequest.view),
              result: getBuffer(pickResult.view)
            });
            computation.dispatch(computePass, Math.ceil(SCENE_GRAPH_CAPACITY / 256));
          },
          destroy: () => computation.destroy()
        };
      }
    });

    const encoder = this.device.createRenderBundleEncoder({
      id: 'scene-graph-render-bundle',
      colorAttachmentFormats: [this.device.preferredColorFormat],
      depthStencilAttachmentFormat: 'depth24plus'
    });
    encoder.setPipeline(this.model.pipeline);
    encoder.setVertexArray(this.model.vertexArray);
    encoder.setBindings({records: scene.recordBuffer, view: this.viewUniforms});
    for (let commandIndex = 0; commandIndex < commands.capacity; commandIndex++) {
      commands.draw(encoder, commandIndex);
    }
    const bundle = encoder.finish();
    graph.addRenderPass({
      id: 'scene-graph-render',
      resources: [
        {buffer: source.records, usage: 'storage-read'},
        {buffer: view, usage: 'uniform'},
        {buffer: commandViews.buffer, usage: 'indirect'}
      ],
      compile: () => ({
        getRenderPassProps: () => ({
          id: 'scene-graph-render',
          clearColor: [0.012, 0.018, 0.035, 1],
          clearDepth: false,
          clearStencil: false
        }),
        encode: ({renderPass}) => renderPass.executeBundles([bundle])
      })
    });
    const compiled = graph.compile();
    this.graphInspector.registerGraph(compiled);
    return {
      compiled,
      scene,
      commands,
      bundle,
      ownedBuffers,
      visibility: visibility.buffer,
      visibleCount: visibleCount.buffer,
      groupCounts: groupCounts.buffer,
      pickRequest: pickRequest.buffer,
      pickResult: pickResult.buffer
    };
  }

  private writeView(): void {
    const data = new ArrayBuffer(VIEW_BYTE_LENGTH);
    new Float32Array(data).set(this.viewBounds);
    new Uint32Array(data).set([this.selectedObjectId, this.enabledGroups], 4);
    this.viewUniforms.write(new Uint8Array(data));
  }

  private attachControls(root: HTMLElement): () => void {
    this.controls = root;
    const host = root.querySelector<HTMLElement>('[data-scene-graph-inspector]')!;
    this.inspectorPanel = new GPUCommandGraphInspectorPanel(host, {
      graphLabels: {[this.resources.compiled.id]: 'Hierarchy → scene → visibility → draw'}
    });
    this.inspectorPanel.update(this.graphInspector.getSnapshot(), this.resources.compiled.id);
    root.addEventListener('change', this.handleControlChange);
    root.addEventListener('click', this.handleControlClick);
    return () => {
      root.removeEventListener('change', this.handleControlChange);
      root.removeEventListener('click', this.handleControlClick);
      this.inspectorPanel?.destroy();
      this.inspectorPanel = null;
      this.controls = null;
    };
  }

  private handleControlChange = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || target.dataset.group === undefined) return;
    const groupBit = 1 << Number(target.dataset.group);
    this.enabledGroups = target.checked
      ? this.enabledGroups | groupBit
      : this.enabledGroups & ~groupBit;
  };

  private handleControlClick = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) return;
    if (target.dataset.move !== undefined) this.moveSelection();
    if (target.dataset.remove !== undefined) this.removeSelection();
  };

  private handleCanvasClick = (event: MouseEvent): void => {
    const bounds = this.canvas?.getBoundingClientRect();
    if (!bounds?.width || !bounds.height) return;
    const [minimumX, minimumY, maximumX, maximumY] = this.viewBounds;
    this.pendingPick = [
      minimumX + ((event.clientX - bounds.left) / bounds.width) * (maximumX - minimumX),
      maximumY - ((event.clientY - bounds.top) / bounds.height) * (maximumY - minimumY)
    ];
  };

  private handleWheel = (event: WheelEvent): void => {
    event.preventDefault();
    const scale = Math.max(0.45, Math.min(1.6, 1 + event.deltaY * 0.001));
    this.viewBounds = [-1.1 * scale, -1.1 * scale, 1.1 * scale, 1.1 * scale];
  };

  private moveSelection(): void {
    if (this.selectedObjectId === GPU_SCENE_INVALID_REFERENCE) return;
    const slot = this.resources.scene.getRecordIndex(this.selectedObjectId);
    if (slot === undefined) return;
    const localIndex = slot % SCENE_GRAPH_OBJECTS_PER_GROUP;
    const groupIndex = Math.floor(slot / SCENE_GRAPH_OBJECTS_PER_GROUP);
    const centerX = -0.86 + (localIndex % 12) * 0.165;
    const centerY = -0.85 + (groupIndex * 4 + Math.floor(localIndex / 12)) * 0.164;
    const result = this.resources.scene.mutate({
      update: [
        {
          id: this.selectedObjectId,
          bounds: {
            minimum: [centerX - 0.052, centerY - 0.052, 0],
            maximum: [centerX + 0.052, centerY + 0.052, 1]
          }
        }
      ]
    });
    this.setMutationSummary(`${result.uploadedByteLength} bytes · ${result.writeCount} writes`);
  }

  private removeSelection(): void {
    if (this.selectedObjectId === GPU_SCENE_INVALID_REFERENCE) return;
    const result = this.resources.scene.mutate({remove: [this.selectedObjectId]});
    this.selectedObjectId = GPU_SCENE_INVALID_REFERENCE;
    this.setMutationSummary(`${result.uploadedByteLength} bytes · ${result.activeCount} active`);
    this.setSelectionSummary();
  }

  private async readSelection(ticket: GPUReadbackTicket): Promise<void> {
    try {
      const bytes = await ticket.read();
      const slot = new Uint32Array(bytes.buffer, bytes.byteOffset, 1)[0];
      this.selectedObjectId =
        slot === GPU_SCENE_INVALID_REFERENCE ? GPU_SCENE_INVALID_REFERENCE : 10_000 + slot * 3;
      this.setSelectionSummary();
    } catch {
      // Device loss releases the staging slot without applying stale selection.
    }
  }

  private async readGroupCounts(ticket: GPUReadbackTicket): Promise<void> {
    try {
      const bytes = await ticket.read();
      const counts = new Uint32Array(bytes.buffer, bytes.byteOffset, SCENE_GRAPH_GROUPS.length);
      const summary = this.controls?.querySelector<HTMLElement>('[data-scene-graph-groups]');
      if (summary) {
        summary.textContent = SCENE_GRAPH_GROUPS.map(
          (group, index) => `${group}: ${counts[index]}`
        ).join(' · ');
      }
    } catch {
      // Optional group diagnostics must not prevent scene rendering.
    }
  }

  private setSelectionSummary(): void {
    const element = this.controls?.querySelector<HTMLElement>('[data-scene-graph-selection]');
    if (element) {
      element.textContent =
        this.selectedObjectId === GPU_SCENE_INVALID_REFERENCE
          ? 'None'
          : `Object ${this.selectedObjectId}`;
    }
  }

  private setMutationSummary(value: string): void {
    const element = this.controls?.querySelector<HTMLElement>('[data-scene-graph-mutation]');
    if (element) element.textContent = value;
  }
}

function makeControls(): string {
  const groups = SCENE_GRAPH_GROUPS.map(
    (group, index) =>
      `<label><input type="checkbox" data-group="${index}" checked /> ${group}</label>`
  ).join('');
  return `<section data-scene-graph-panel style="display:grid;gap:10px;font-size:12px">
    <p>Application-owned hierarchy becomes one flat GPU scene. Click an object and scroll to zoom.</p>
    <div style="display:flex;gap:9px">${groups}</div>
    <div>Selection: <span data-scene-graph-selection>None</span></div>
    <div style="display:flex;gap:8px"><button data-move>Move selection</button><button data-remove>Remove selection</button></div>
    <div>Last CPU mutation: <span data-scene-graph-mutation>None</span></div>
    <div data-scene-graph-groups>Waiting for GPU group counts…</div>
    <div data-scene-graph-inspector></div>
  </section>`;
}
