// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type Device, type RenderBundle} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {AnimationLoopTemplate, Computation, CubeGeometry, Model} from '@luma.gl/engine';
import {
  decodeGPUIndexPickInfo,
  DrawCommandBuffer,
  GPUCommandGraph,
  GPUCompaction,
  GPUIndexPickingTarget,
  INDEX_PICKING_READBACK_BYTE_LENGTH,
  type CompiledGPUCommandGraph
} from '@luma.gl/experimental';
import {Matrix4} from '@math.gl/core';
import {ColumnPanel, type Panel} from '@deck.gl-community/panels';
import {
  ExamplePanelManager,
  makeExamplePanelHostHtml,
  makeHtmlCustomPanel
} from '../../example-panels';
import {makeCullingInstances} from './culling-data';
import {
  CULLING_PICKING_SHADER,
  CULLING_RENDER_SHADER,
  getFrustumCullingShader
} from './culling-shaders';

export const title = 'GPU Frustum Culling';
export const description =
  'A command graph culls, compacts, and indirectly renders a large 3D instance field.';

const CAPACITY_OPTIONS = [50_000, 250_000, 1_000_000] as const;
const DEFAULT_CAPACITY = 250_000;
const UINT32_BYTE_LENGTH = Uint32Array.BYTES_PER_ELEMENT;
const UNIFORM_BYTE_LENGTH = 160;
const FIELD_CENTER: [number, number, number] = [0, 5, 0];
const FIELD_FAR_PLANE = 800;
const FIELD_NEAR_PLANE = 0.1;
const FIELD_FOV = Math.PI / 3;

type CullingGraphResources = {
  compiled: CompiledGPUCommandGraph<CullingGraphParameters>;
  pickingCompiled: CompiledGPUCommandGraph<PickingGraphParameters>;
  pickingReadbackId: string;
  pickingWidth: number;
  pickingHeight: number;
  drawCommands: DrawCommandBuffer;
  instances: Buffer;
  visibleIds: Buffer;
  perspectiveRenderBundle: RenderBundle;
  overviewRenderBundle: RenderBundle;
};

type Viewport = [number, number, number, number];

type CullingGraphParameters = {
  perspectiveViewport: Viewport;
  overviewViewport?: Viewport;
};

type PickingGraphParameters = {
  perspectiveViewport: Viewport;
  pixel: readonly [number, number];
};

export default class GPUFrustumCullingAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeExamplePanelHostHtml();
  static props = {createFramebuffer: true, debug: true};

  readonly device: Device;
  readonly model: Model;
  readonly pickingModel: Model;
  readonly uniformBuffer: Buffer;
  readonly overviewUniformBuffer: Buffer;
  readonly panels: ExamplePanelManager;

  private resources: CullingGraphResources | null = null;
  private capacity = DEFAULT_CAPACITY;
  private yaw = 0.72;
  private pitch = 0.34;
  private distance = 118;
  private autoOrbit = true;
  private cullingEnabled = true;
  private comparisonView = true;
  private dragging = false;
  private lastPointer: [number, number] = [0, 0];
  private sampledVisibleCount = 0;
  private countReadPending = false;
  private pickedObjectIndex: number | null = null;
  private pickReadPendingCount = 0;
  private frameIndex = 0;
  private encodeTimeMilliseconds = 0;
  private compileTimeMilliseconds = 0;
  private framesPerSecond = 0;
  private cpuFrameTimeMilliseconds = 0;
  private gpuFrameTimeMilliseconds = 0;
  private canvas: HTMLCanvasElement | null = null;

  private capacityElement: HTMLElement | null = null;
  private statsElement: HTMLElement | null = null;
  private nodesElement: HTMLElement | null = null;

  constructor({device}: AnimationProps) {
    super();
    if (device.type !== 'webgpu') {
      throw new Error('GPU Frustum Culling requires WebGPU');
    }
    this.device = device;
    this.uniformBuffer = device.createBuffer({
      id: 'gpu-frustum-culling-uniforms',
      byteLength: UNIFORM_BYTE_LENGTH,
      usage: Buffer.UNIFORM | Buffer.COPY_DST
    });
    this.overviewUniformBuffer = device.createBuffer({
      id: 'gpu-frustum-culling-overview-uniforms',
      byteLength: UNIFORM_BYTE_LENGTH,
      usage: Buffer.UNIFORM | Buffer.COPY_DST
    });
    this.model = new Model(device, {
      id: 'gpu-frustum-culling-model',
      source: CULLING_RENDER_SHADER,
      geometry: new CubeGeometry({id: 'gpu-frustum-culling-cube', indices: true}),
      colorAttachmentFormats: [device.preferredColorFormat],
      depthStencilAttachmentFormat: 'depth24plus',
      shaderLayout: {
        attributes: [
          {name: 'positions', location: 0, type: 'vec3<f32>'},
          {name: 'normals', location: 1, type: 'vec3<f32>'}
        ],
        bindings: [
          {name: 'instances', type: 'read-only-storage', group: 0, location: 0},
          {name: 'visibleIds', type: 'read-only-storage', group: 0, location: 1},
          {name: 'uniforms', type: 'uniform', group: 0, location: 2}
        ]
      },
      parameters: {
        cullMode: 'back',
        depthCompare: 'less-equal',
        depthWriteEnabled: true
      }
    });
    this.pickingModel = new Model(device, {
      id: 'gpu-frustum-culling-picking-model',
      source: CULLING_PICKING_SHADER,
      geometry: new CubeGeometry({id: 'gpu-frustum-culling-picking-cube', indices: true}),
      colorAttachmentFormats: ['rgba8unorm', 'rg32sint'],
      depthStencilAttachmentFormat: 'depth24plus',
      shaderLayout: {
        attributes: [
          {name: 'positions', location: 0, type: 'vec3<f32>'},
          {name: 'normals', location: 1, type: 'vec3<f32>'}
        ],
        bindings: [
          {name: 'instances', type: 'read-only-storage', group: 0, location: 0},
          {name: 'visibleIds', type: 'read-only-storage', group: 0, location: 1},
          {name: 'uniforms', type: 'uniform', group: 0, location: 2}
        ]
      },
      parameters: {
        cullMode: 'back',
        depthCompare: 'less-equal',
        depthWriteEnabled: true
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

  override onRender({
    animationLoop,
    device,
    time,
    width,
    height,
    _mousePosition
  }: AnimationProps): void {
    let resources = this.resources;
    if (!resources) {
      return;
    }
    const deviceSize = device.getDefaultCanvasContext().getDevicePixelSize();
    if (resources.pickingWidth !== deviceSize[0] || resources.pickingHeight !== deviceSize[1]) {
      this.rebuild(this.capacity);
      resources = this.resources;
      if (!resources) {
        return;
      }
    }
    if (this.autoOrbit) {
      this.yaw = 0.72 + time * 0.00008;
    }
    const viewports = getViewports(width, height, this.comparisonView);
    this.writeUniforms(viewports);
    const encodeStart = performance.now();
    resources.compiled.encode(device.commandEncoder, {parameters: viewports});
    if (_mousePosition && this.frameIndex % 4 === 0 && this.pickReadPendingCount < 2) {
      const pixel = this.getPickingPixel(_mousePosition as [number, number], resources);
      const readbackBuffer = device.createBuffer({
        id: `gpu-frustum-culling-pick-${this.frameIndex}`,
        byteLength: INDEX_PICKING_READBACK_BYTE_LENGTH,
        usage: Buffer.COPY_DST | Buffer.MAP_READ
      });
      resources.pickingCompiled.encode(device.commandEncoder, {
        parameters: {perspectiveViewport: viewports.perspectiveViewport, pixel},
        buffers: {[resources.pickingReadbackId]: readbackBuffer}
      });
      this.pickReadPendingCount++;
      queueMicrotask(() => void this.readPickingResult(readbackBuffer));
    }
    this.encodeTimeMilliseconds = performance.now() - encodeStart;
    this.framesPerSecond = animationLoop.frameRate.getSampleHz();
    this.cpuFrameTimeMilliseconds = animationLoop.cpuTime.getSampleAverageTime();
    this.gpuFrameTimeMilliseconds = animationLoop.gpuTime.getSampleAverageTime();
    this.frameIndex++;
    if (this.frameIndex % 60 === 0) {
      void this.sampleVisibleCount();
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
    this.pickingModel.destroy();
    this.model.destroy();
    this.uniformBuffer.destroy();
    this.overviewUniformBuffer.destroy();
  }

  private rebuild(capacity: number): void {
    const compileStart = performance.now();
    this.destroyResources();
    this.capacity = capacity;
    const instances = this.device.createBuffer({
      id: 'gpu-frustum-culling-instances',
      data: makeCullingInstances(capacity),
      usage: Buffer.STORAGE | Buffer.COPY_DST
    });
    const visibleIds = this.device.createBuffer({
      id: 'gpu-frustum-culling-visible-ids',
      byteLength: capacity * UINT32_BYTE_LENGTH,
      usage: Buffer.STORAGE | Buffer.COPY_SRC
    });
    const drawCommands = new DrawCommandBuffer(this.device, {
      id: 'gpu-frustum-culling-draw-command',
      type: 'draw-indexed',
      commands: [{indexCount: this.getIndexCount(), instanceCount: 0}]
    });
    const perspectiveRenderBundle = this.createRenderBundle(
      'gpu-frustum-culling-perspective-render-bundle',
      instances,
      visibleIds,
      drawCommands,
      this.uniformBuffer
    );
    const overviewRenderBundle = this.createRenderBundle(
      'gpu-frustum-culling-overview-render-bundle',
      instances,
      visibleIds,
      drawCommands,
      this.overviewUniformBuffer
    );
    const compiled = this.createGraph(
      capacity,
      instances,
      visibleIds,
      drawCommands,
      perspectiveRenderBundle,
      overviewRenderBundle
    );
    const deviceSize = this.device.getDefaultCanvasContext().getDevicePixelSize();
    const pickingWidth = Math.max(1, deviceSize[0]);
    const pickingHeight = Math.max(1, deviceSize[1]);
    const picking = this.createPickingGraph(
      pickingWidth,
      pickingHeight,
      instances,
      visibleIds,
      drawCommands
    );
    this.resources = {
      compiled,
      pickingCompiled: picking.compiled,
      pickingReadbackId: picking.readbackId,
      pickingWidth,
      pickingHeight,
      drawCommands,
      instances,
      visibleIds,
      perspectiveRenderBundle,
      overviewRenderBundle
    };
    this.sampledVisibleCount = 0;
    this.pickedObjectIndex = null;
    this.compileTimeMilliseconds = performance.now() - compileStart;
    this.updateInspector();
  }

  private createGraph(
    capacity: number,
    instancesBuffer: Buffer,
    visibleIdsBuffer: Buffer,
    drawCommands: DrawCommandBuffer,
    perspectiveRenderBundle: RenderBundle,
    overviewRenderBundle: RenderBundle
  ): CompiledGPUCommandGraph<CullingGraphParameters> {
    const graph = new GPUCommandGraph<CullingGraphParameters>(this.device, {
      id: 'gpu-frustum-culling-command-graph'
    });
    const instances = graph.importBuffer(
      {id: 'instances', byteLength: instancesBuffer.byteLength, usage: instancesBuffer.usage},
      instancesBuffer
    );
    const visibleIds = graph.importBuffer(
      {id: 'visible-ids', byteLength: visibleIdsBuffer.byteLength, usage: visibleIdsBuffer.usage},
      visibleIdsBuffer
    );
    const uniforms = graph.importBuffer(
      {id: 'uniforms', byteLength: this.uniformBuffer.byteLength, usage: this.uniformBuffer.usage},
      this.uniformBuffer
    );
    const overviewUniforms = graph.importBuffer(
      {
        id: 'overview-uniforms',
        byteLength: this.overviewUniformBuffer.byteLength,
        usage: this.overviewUniformBuffer.usage
      },
      this.overviewUniformBuffer
    );
    const drawCommandBuffer = graph.importBuffer(
      {
        id: 'draw-command',
        byteLength: drawCommands.buffer.byteLength,
        usage: drawCommands.buffer.usage
      },
      drawCommands.buffer
    );
    const flagsBuffer = graph.createTransientBuffer({
      id: 'visibility-flags',
      byteLength: capacity * UINT32_BYTE_LENGTH,
      usage: Buffer.STORAGE
    });
    const sourceIdsBuffer = graph.createTransientBuffer({
      id: 'source-ids',
      byteLength: capacity * UINT32_BYTE_LENGTH,
      usage: Buffer.STORAGE
    });
    const flags = graph.createBufferView(flagsBuffer, {format: 'uint32', length: capacity});
    const sourceIds = graph.createBufferView(sourceIdsBuffer, {format: 'uint32', length: capacity});
    const visibleIdView = graph.createBufferView(visibleIds, {
      format: 'uint32',
      length: capacity
    });
    const instanceCount = graph.createBufferView(drawCommandBuffer, {
      format: 'uint32',
      length: 1,
      byteOffset: drawCommands.getInstanceCountByteOffset(0)
    });

    graph.addComputePass({
      id: 'frustum-visibility',
      resources: [
        {buffer: instances, usage: 'storage-read'},
        {buffer: uniforms, usage: 'uniform'},
        {buffer: flags, usage: 'storage-write'},
        {buffer: sourceIds, usage: 'storage-write'}
      ],
      compile: ({device}) => {
        const computation = new Computation(device, {
          id: 'gpu-frustum-culling-visibility',
          source: getFrustumCullingShader(capacity),
          shaderLayout: {
            bindings: [
              {name: 'instances', type: 'storage', group: 0, location: 0},
              {name: 'uniforms', type: 'uniform', group: 0, location: 1},
              {name: 'flags', type: 'storage', group: 0, location: 2},
              {name: 'sourceIds', type: 'storage', group: 0, location: 3}
            ]
          }
        });
        return {
          encode: ({computePass, getBuffer}) => {
            computation.setBindings({
              instances: getBuffer(instances),
              uniforms: getBuffer(uniforms),
              flags: getBuffer(flags),
              sourceIds: getBuffer(sourceIds)
            });
            computation.dispatch(computePass, Math.ceil(capacity / 256));
          },
          destroy: () => computation.destroy()
        };
      }
    });

    new GPUCompaction({
      id: 'visible-instance-compaction',
      input: sourceIds,
      flags,
      output: visibleIdView,
      count: instanceCount
    }).addToGraph(graph);

    graph.addRenderPass({
      id: 'render-visible-instances',
      resources: [
        {buffer: instances, usage: 'storage-read'},
        {buffer: visibleIds, usage: 'storage-read'},
        {buffer: uniforms, usage: 'uniform'},
        {buffer: overviewUniforms, usage: 'uniform'},
        {buffer: drawCommandBuffer, usage: 'indirect'}
      ],
      compile: () => ({
        getRenderPassProps: () => ({
          id: 'gpu-frustum-culling-render-pass',
          clearColor: [0.008, 0.013, 0.025, 1],
          clearDepth: 1,
          clearStencil: false
        }),
        encode: ({parameters, renderPass}) => {
          renderPass.setParameters({viewport: parameters.perspectiveViewport});
          renderPass.executeBundles([perspectiveRenderBundle]);
          if (parameters.overviewViewport) {
            renderPass.setParameters({viewport: parameters.overviewViewport});
            renderPass.executeBundles([overviewRenderBundle]);
          }
        }
      })
    });

    return graph.compile();
  }

  private createPickingGraph(
    width: number,
    height: number,
    instancesBuffer: Buffer,
    visibleIdsBuffer: Buffer,
    drawCommands: DrawCommandBuffer
  ): {
    compiled: CompiledGPUCommandGraph<PickingGraphParameters>;
    readbackId: string;
  } {
    const graph = new GPUCommandGraph<PickingGraphParameters>(this.device, {
      id: 'gpu-frustum-culling-picking-graph'
    });
    const instances = graph.importBuffer(
      {
        id: 'picking-instances',
        byteLength: instancesBuffer.byteLength,
        usage: instancesBuffer.usage
      },
      instancesBuffer
    );
    const visibleIds = graph.importBuffer(
      {
        id: 'picking-visible-ids',
        byteLength: visibleIdsBuffer.byteLength,
        usage: visibleIdsBuffer.usage
      },
      visibleIdsBuffer
    );
    const uniforms = graph.importBuffer(
      {
        id: 'picking-uniforms',
        byteLength: this.uniformBuffer.byteLength,
        usage: this.uniformBuffer.usage
      },
      this.uniformBuffer
    );
    const drawCommandBuffer = graph.importBuffer(
      {
        id: 'picking-draw-command',
        byteLength: drawCommands.buffer.byteLength,
        usage: drawCommands.buffer.usage
      },
      drawCommands.buffer
    );
    const target = new GPUIndexPickingTarget(graph, {
      id: 'visible-instance-picking',
      width,
      height
    });
    graph.addRenderPass({
      id: 'render-visible-instance-picking',
      attachments: target.attachments,
      resources: [
        {buffer: instances, usage: 'storage-read'},
        {buffer: visibleIds, usage: 'storage-read'},
        {buffer: uniforms, usage: 'uniform'},
        {buffer: drawCommandBuffer, usage: 'indirect'}
      ],
      compile: () => ({
        getRenderPassProps: () => target.renderPassProps,
        encode: ({parameters, renderPass, getBuffer}) => {
          renderPass.setParameters({viewport: parameters.perspectiveViewport});
          renderPass.setPipeline(this.pickingModel.pipeline);
          renderPass.setVertexArray(this.pickingModel.vertexArray);
          renderPass.setBindings({
            instances: getBuffer(instances),
            visibleIds: getBuffer(visibleIds),
            uniforms: getBuffer(uniforms)
          });
          drawCommands.draw(renderPass, 0);
        }
      })
    });
    target.addReadbackPass({
      after: 'render-visible-instance-picking',
      getPixel: parameters => parameters.pixel
    });
    return {compiled: graph.compile(), readbackId: target.readback.id};
  }

  private createRenderBundle(
    id: string,
    instances: Buffer,
    visibleIds: Buffer,
    drawCommands: DrawCommandBuffer,
    uniforms: Buffer
  ): RenderBundle {
    const encoder = this.device.createRenderBundleEncoder({
      id,
      colorAttachmentFormats: [this.device.preferredColorFormat],
      depthStencilAttachmentFormat: 'depth24plus'
    });
    encoder.setPipeline(this.model.pipeline);
    encoder.setVertexArray(this.model.vertexArray);
    encoder.setBindings({instances, visibleIds, uniforms});
    drawCommands.draw(encoder, 0);
    return encoder.finish();
  }

  private getIndexCount(): number {
    const indexBuffer = this.model.vertexArray.indexBuffer;
    if (!indexBuffer) {
      throw new Error('GPU Frustum Culling requires indexed cube geometry');
    }
    return (
      this.model.indexCount ?? indexBuffer.byteLength / (indexBuffer.indexType === 'uint32' ? 4 : 2)
    );
  }

  private writeUniforms(parameters: CullingGraphParameters): void {
    const perspectiveAspect = getViewportAspect(parameters.perspectiveViewport);
    const cosinePitch = Math.cos(this.pitch);
    const eye: [number, number, number] = [
      FIELD_CENTER[0] + Math.sin(this.yaw) * cosinePitch * this.distance,
      FIELD_CENTER[1] + Math.sin(this.pitch) * this.distance,
      FIELD_CENTER[2] + Math.cos(this.yaw) * cosinePitch * this.distance
    ];
    const viewMatrix = new Matrix4().lookAt({eye, center: FIELD_CENTER, up: [0, 1, 0]});
    const projectionMatrix = new Matrix4().perspective({
      fovy: FIELD_FOV,
      aspect: perspectiveAspect,
      near: FIELD_NEAR_PLANE,
      far: FIELD_FAR_PLANE
    });
    this.writeCameraUniforms(
      this.uniformBuffer,
      viewMatrix,
      projectionMatrix,
      perspectiveAspect,
      this.cullingEnabled
    );

    const overviewAspect = getViewportAspect(
      parameters.overviewViewport ?? parameters.perspectiveViewport
    );
    const overviewHalfExtent = 250;
    const overviewHalfWidth =
      overviewAspect >= 1 ? overviewHalfExtent * overviewAspect : overviewHalfExtent;
    const overviewHalfHeight =
      overviewAspect >= 1 ? overviewHalfExtent : overviewHalfExtent / overviewAspect;
    const overviewViewMatrix = new Matrix4().lookAt({
      eye: [FIELD_CENTER[0], 520, FIELD_CENTER[2]],
      center: FIELD_CENTER,
      up: [0, 0, -1]
    });
    const overviewProjectionMatrix = new Matrix4().ortho({
      left: -overviewHalfWidth,
      right: overviewHalfWidth,
      bottom: -overviewHalfHeight,
      top: overviewHalfHeight,
      near: FIELD_NEAR_PLANE,
      far: 1000
    });
    this.writeCameraUniforms(
      this.overviewUniformBuffer,
      overviewViewMatrix,
      overviewProjectionMatrix,
      overviewAspect,
      false
    );
  }

  private writeCameraUniforms(
    buffer: Buffer,
    viewMatrix: Matrix4,
    projectionMatrix: Matrix4,
    aspect: number,
    cullingEnabled: boolean
  ): void {
    const viewProjectionMatrix = new Matrix4(projectionMatrix).multiplyRight(viewMatrix);
    const values = new Float32Array(UNIFORM_BYTE_LENGTH / Float32Array.BYTES_PER_ELEMENT);
    values.set(viewProjectionMatrix, 0);
    values.set(viewMatrix, 16);
    values.set(
      [
        Math.tan(FIELD_FOV / 2),
        aspect,
        FIELD_NEAR_PLANE,
        FIELD_FAR_PLANE,
        cullingEnabled ? 1 : 0,
        this.pickedObjectIndex === null ? 0 : this.pickedObjectIndex + 1,
        0,
        0
      ],
      32
    );
    buffer.write(values);
  }

  private async sampleVisibleCount(): Promise<void> {
    const resources = this.resources;
    if (!resources || this.countReadPending) {
      return;
    }
    this.countReadPending = true;
    try {
      const bytes = await resources.drawCommands.buffer.readAsync();
      const values = new Uint32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
      this.sampledVisibleCount = values[1] ?? 0;
      this.updateInspector();
    } finally {
      this.countReadPending = false;
    }
  }

  private getPickingPixel(
    mousePosition: [number, number],
    resources: CullingGraphResources
  ): readonly [number, number] {
    const devicePixels = this.device
      .getDefaultCanvasContext()
      .cssToDevicePixels(mousePosition, false);
    return [
      Math.max(0, Math.min(resources.pickingWidth - 1, devicePixels.x)),
      Math.max(0, Math.min(resources.pickingHeight - 1, devicePixels.y))
    ];
  }

  private async readPickingResult(readbackBuffer: Buffer): Promise<void> {
    try {
      const bytes = await readbackBuffer.readAsync(0, 8);
      this.pickedObjectIndex = decodeGPUIndexPickInfo(bytes).objectIndex;
      this.updateInspector();
    } finally {
      readbackBuffer.destroy();
      this.pickReadPendingCount--;
    }
  }

  private destroyResources(): void {
    if (!this.resources) {
      return;
    }
    this.resources.compiled.destroy();
    this.resources.pickingCompiled.destroy();
    this.resources.perspectiveRenderBundle.destroy();
    this.resources.overviewRenderBundle.destroy();
    this.resources.drawCommands.destroy();
    this.resources.instances.destroy();
    this.resources.visibleIds.destroy();
    this.resources = null;
  }

  private makePanel(): Panel {
    return new ColumnPanel({
      id: 'gpu-frustum-culling-panel',
      title: 'GPU Frustum Culling',
      panels: [
        makeHtmlCustomPanel({
          id: 'gpu-frustum-culling-overview',
          title: '',
          html: `<p style="margin:0;line-height:1.45">A command graph tests bounding spheres, stably compacts visible IDs, writes one indexed indirect command, and replays a fixed render bundle. A second graph renders those stable source IDs into transient integer picking attachments.</p>`
        }),
        makeHtmlCustomPanel({
          id: 'gpu-frustum-culling-controls',
          title: 'Controls',
          html: this.getControlsHtml(),
          onRender: root => this.bindPanelControls(root)
        }),
        makeHtmlCustomPanel({
          id: 'gpu-frustum-culling-stats',
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
      <label><input type="checkbox" data-culling checked> GPU frustum culling</label>
      <label><input type="checkbox" data-comparison checked> Perspective + overview</label>
      <label><input type="checkbox" data-auto-orbit checked> Auto-orbit camera</label>
      <button type="button" data-reset>Reset camera</button>
      <small>Move the pointer over the perspective view to pick and highlight a GPU-compacted source ID. Drag to orbit and use the wheel to zoom. The overview replays the same indirect draw.</small>
    </div>`;
  }

  private bindPanelControls(root: HTMLElement): () => void {
    const capacitySelect = root.querySelector('[data-capacity-select]') as HTMLSelectElement;
    const culling = root.querySelector('[data-culling]') as HTMLInputElement;
    const comparison = root.querySelector('[data-comparison]') as HTMLInputElement;
    const autoOrbit = root.querySelector('[data-auto-orbit]') as HTMLInputElement;
    const reset = root.querySelector('[data-reset]') as HTMLButtonElement;
    const onCapacity = (): void => this.rebuild(Number(capacitySelect.value));
    const onCulling = (): void => {
      this.cullingEnabled = culling.checked;
    };
    const onComparison = (): void => {
      this.comparisonView = comparison.checked;
      this.updateInspector();
    };
    const onAutoOrbit = (): void => {
      this.autoOrbit = autoOrbit.checked;
    };
    const onReset = (): void => {
      this.yaw = 0.72;
      this.pitch = 0.34;
      this.distance = 118;
      this.autoOrbit = true;
      autoOrbit.checked = true;
    };
    capacitySelect.addEventListener('change', onCapacity);
    culling.addEventListener('change', onCulling);
    comparison.addEventListener('change', onComparison);
    autoOrbit.addEventListener('change', onAutoOrbit);
    reset.addEventListener('click', onReset);
    return () => {
      capacitySelect.removeEventListener('change', onCapacity);
      culling.removeEventListener('change', onCulling);
      comparison.removeEventListener('change', onComparison);
      autoOrbit.removeEventListener('change', onAutoOrbit);
      reset.removeEventListener('click', onReset);
    };
  }

  private updateInspector(): void {
    const stats = this.resources?.compiled.stats;
    if (!stats) {
      return;
    }
    if (this.capacityElement) {
      this.capacityElement.innerHTML = `<strong>${formatCount(this.capacity)}</strong> instances · rebuilt in ${this.compileTimeMilliseconds.toFixed(1)} ms`;
    }
    if (this.statsElement) {
      const visiblePercentage = (this.sampledVisibleCount / this.capacity) * 100;
      this.statsElement.innerHTML = `<div style="display:grid;grid-template-columns:1fr auto;gap:4px 12px;margin-top:8px">
        <span>View</span><strong>${this.comparisonView ? 'perspective + overview' : 'perspective only'}</strong>
        <span>Frame rate</span><strong>${this.framesPerSecond.toFixed(1)} FPS</strong>
        <span>CPU frame</span><strong>${this.cpuFrameTimeMilliseconds.toFixed(2)} ms</strong>
        <span>GPU frame</span><strong>${formatGpuTime(this.device, this.gpuFrameTimeMilliseconds)}</strong>
        <span>Sampled visible</span><strong>${formatCount(this.sampledVisibleCount)} (${visiblePercentage.toFixed(1)}%)</strong>
        <span>Picked source ID</span><strong>${this.pickedObjectIndex ?? 'none'}</strong>
        <span>CPU graph encode</span><strong>${this.encodeTimeMilliseconds.toFixed(2)} ms</strong>
        <span>Logical scratch</span><strong>${formatBytes(stats.logicalTransientBytes)}</strong>
        <span>Physical scratch</span><strong>${formatBytes(stats.physicalTransientBytes)}</strong>
        <span>Transient reuse</span><strong>${stats.reusePercentage.toFixed(0)}%</strong>
        <span>Physical allocations</span><strong>${stats.physicalTransientBufferCount}/${stats.logicalTransientBufferCount}</strong>
        <span>Picking textures</span><strong>${this.resources?.pickingCompiled.stats.physicalTransientTextureCount}/${this.resources?.pickingCompiled.stats.logicalTransientTextureCount}</strong>
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
    this.autoOrbit = false;
    this.lastPointer = [event.clientX, event.clientY];
    this.canvas?.setPointerCapture(event.pointerId);
    if (this.canvas) {
      this.canvas.style.cursor = 'grabbing';
    }
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (!this.dragging) {
      return;
    }
    const deltaX = event.clientX - this.lastPointer[0];
    const deltaY = event.clientY - this.lastPointer[1];
    this.lastPointer = [event.clientX, event.clientY];
    this.yaw -= deltaX * 0.006;
    this.pitch = Math.max(-1.2, Math.min(1.2, this.pitch + deltaY * 0.006));
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    this.dragging = false;
    this.canvas?.releasePointerCapture(event.pointerId);
    if (this.canvas) {
      this.canvas.style.cursor = 'grab';
    }
  };

  private readonly handleWheel = (event: WheelEvent): void => {
    event.preventDefault();
    this.autoOrbit = false;
    this.distance = Math.max(18, Math.min(420, this.distance * Math.exp(event.deltaY * 0.001)));
  };
}

function formatCount(value: number): string {
  return new Intl.NumberFormat('en-US', {notation: 'compact', maximumFractionDigits: 1}).format(
    value
  );
}

function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KiB`;
  return `${(value / 1024 / 1024).toFixed(1)} MiB`;
}

function getViewports(
  width: number,
  height: number,
  comparisonView: boolean
): CullingGraphParameters {
  const safeWidth = Math.max(1, Math.floor(width));
  const safeHeight = Math.max(1, Math.floor(height));
  if (!comparisonView) {
    return {perspectiveViewport: [0, 0, safeWidth, safeHeight]};
  }
  if (safeWidth >= safeHeight) {
    const perspectiveWidth = Math.max(1, Math.floor(safeWidth / 2));
    return {
      perspectiveViewport: [0, 0, perspectiveWidth, safeHeight],
      overviewViewport: [perspectiveWidth, 0, Math.max(1, safeWidth - perspectiveWidth), safeHeight]
    };
  }
  const perspectiveHeight = Math.max(1, Math.floor(safeHeight / 2));
  return {
    perspectiveViewport: [0, 0, safeWidth, perspectiveHeight],
    overviewViewport: [0, perspectiveHeight, safeWidth, Math.max(1, safeHeight - perspectiveHeight)]
  };
}

function getViewportAspect(viewport: Viewport): number {
  return viewport[2] / Math.max(1, viewport[3]);
}

function formatGpuTime(device: Device, milliseconds: number): string {
  if (!device.features.has('timestamp-query')) {
    return 'unavailable';
  }
  return milliseconds > 0 ? `${milliseconds.toFixed(2)} ms` : 'warming up';
}
