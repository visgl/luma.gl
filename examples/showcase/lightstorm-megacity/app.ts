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
  GPUIndexPickingTarget,
  GPUVisibilityWorkflow,
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
import {makeLightstormCity, type LightstormCityMetadata} from './lightstorm-data';
import {
  getLightstormVisibilityShader,
  LIGHTSTORM_PICKING_SHADER,
  LIGHTSTORM_RENDER_SHADER
} from './lightstorm-shaders';

export const title = 'Lightstorm Megacity';
export const description =
  'A million-record city filtered, culled, compacted, picked, and indirectly rendered on WebGPU.';

const CAPACITY_OPTIONS = [50_000, 250_000, 1_000_000] as const;
const DEFAULT_CAPACITY = 250_000;
const UINT32_BYTE_LENGTH = Uint32Array.BYTES_PER_ELEMENT;
const UNIFORM_BYTE_LENGTH = 176;
const NEAR_PLANE = 0.1;
const FIELD_OF_VIEW = Math.PI / 3.15;
const TRIANGLES_PER_INSTANCE = 12;

type LightstormDataLayer = 'all' | 'towers' | 'transit';

type CameraPose = {
  target: [number, number, number];
  yaw: number;
  pitch: number;
  distance: number;
  duration: number;
};

const GUIDED_CAMERA_POSES: readonly CameraPose[] = [
  {target: [0, 24, 0], yaw: 0.64, pitch: 0.16, distance: 220, duration: 8},
  {target: [92, 10, -54], yaw: 1.36, pitch: 0.06, distance: 82, duration: 6},
  {target: [-86, 17, 96], yaw: 2.72, pitch: 0.12, distance: 96, duration: 7},
  {target: [0, 31, 0], yaw: 4.05, pitch: 0.52, distance: 158, duration: 7},
  {target: [0, 6, 0], yaw: 5.42, pitch: 1.02, distance: 410, duration: 8}
];

type LightstormGraphResources = {
  compiled: CompiledGPUCommandGraph<LightstormGraphParameters>;
  pickingCompiled: CompiledGPUCommandGraph<LightstormPickingGraphParameters>;
  pickingReadbackIdentifier: string;
  pickingWidth: number;
  pickingHeight: number;
  drawCommands: DrawCommandBuffer;
  instances: Buffer;
  visibleIdentifiers: Buffer;
  perspectiveRenderBundle: RenderBundle;
  overviewRenderBundle: RenderBundle;
};

type Viewport = [number, number, number, number];

type LightstormGraphParameters = {
  perspectiveViewport: Viewport;
  overviewViewport?: Viewport;
};

type LightstormPickingGraphParameters = {
  perspectiveViewport: Viewport;
  pixel: readonly [number, number];
};

export default class LightstormMegacityAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeExamplePanelHostHtml();
  static props = {createFramebuffer: true, debug: true};

  readonly device: Device;
  readonly model: Model;
  readonly pickingModel: Model;
  readonly uniformBuffer: Buffer;
  readonly overviewUniformBuffer: Buffer;
  readonly panels: ExamplePanelManager;

  private resources: LightstormGraphResources | null = null;
  private cityMetadata: LightstormCityMetadata = {
    gridSize: 1,
    fieldHalfExtent: 1,
    towerCount: 0,
    transitCount: 0
  };
  private capacity = DEFAULT_CAPACITY;
  private dataLayer: LightstormDataLayer = 'all';
  private cameraTarget: [number, number, number] = [0, 20, 0];
  private yaw = 0.64;
  private pitch = 0.28;
  private distance = 300;
  private guidedCamera = true;
  private guidedCameraStartMilliseconds = 0;
  private currentTimeMilliseconds = 0;
  private currentCameraPose: CameraPose = GUIDED_CAMERA_POSES[0];
  private lightstormEnabled = true;
  private cullingEnabled = true;
  private comparisonView = false;
  private dragging = false;
  private pointerDirty = false;
  private lastPointer: [number, number] = [0, 0];
  private sampledVisibleCount = 0;
  private hasVisibilitySample = false;
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
  private guidedCameraElement: HTMLInputElement | null = null;

  constructor({
    device,
    lightstormCapacity = DEFAULT_CAPACITY
  }: AnimationProps & {lightstormCapacity?: number}) {
    super();
    if (device.type !== 'webgpu') {
      throw new Error('Lightstorm Megacity requires WebGPU');
    }
    this.device = device;
    this.uniformBuffer = device.createBuffer({
      id: 'lightstorm-megacity-uniforms',
      byteLength: UNIFORM_BYTE_LENGTH,
      usage: Buffer.UNIFORM | Buffer.COPY_DST
    });
    this.overviewUniformBuffer = device.createBuffer({
      id: 'lightstorm-megacity-overview-uniforms',
      byteLength: UNIFORM_BYTE_LENGTH,
      usage: Buffer.UNIFORM | Buffer.COPY_DST
    });
    this.model = new Model(device, {
      id: 'lightstorm-megacity-model',
      source: LIGHTSTORM_RENDER_SHADER,
      geometry: new CubeGeometry({id: 'lightstorm-megacity-cube', indices: true}),
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
      id: 'lightstorm-megacity-picking-model',
      source: LIGHTSTORM_PICKING_SHADER,
      geometry: new CubeGeometry({id: 'lightstorm-megacity-picking-cube', indices: true}),
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
    this.rebuild(lightstormCapacity);
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
    this.currentTimeMilliseconds = time;
    const deviceSize = device.getDefaultCanvasContext().getDevicePixelSize();
    if (resources.pickingWidth !== deviceSize[0] || resources.pickingHeight !== deviceSize[1]) {
      this.rebuild(this.capacity);
      resources = this.resources;
      if (!resources) {
        return;
      }
    }
    const viewports = getViewports(width, height, this.comparisonView);
    this.writeUniforms(viewports, time);
    const encodeStart = performance.now();
    resources.compiled.encode(device.commandEncoder, {parameters: viewports});
    if (
      !this.guidedCamera &&
      this.pointerDirty &&
      _mousePosition &&
      this.pickReadPendingCount < 1
    ) {
      const pixel = this.getPickingPixel(_mousePosition as [number, number], resources);
      const readbackBuffer = device.createBuffer({
        id: `lightstorm-megacity-pick-${this.frameIndex}`,
        byteLength: INDEX_PICKING_READBACK_BYTE_LENGTH,
        usage: Buffer.COPY_DST | Buffer.MAP_READ
      });
      resources.pickingCompiled.encode(device.commandEncoder, {
        parameters: {perspectiveViewport: viewports.perspectiveViewport, pixel},
        buffers: {[resources.pickingReadbackIdentifier]: readbackBuffer}
      });
      this.pointerDirty = false;
      this.pickReadPendingCount++;
      queueMicrotask(() => void this.readPickingResult(readbackBuffer));
    }
    this.encodeTimeMilliseconds = performance.now() - encodeStart;
    this.framesPerSecond = animationLoop.frameRate.getSampleHz();
    this.cpuFrameTimeMilliseconds = animationLoop.cpuTime.getSampleAverageTime();
    this.gpuFrameTimeMilliseconds = animationLoop.gpuTime.getSampleAverageTime();
    this.frameIndex++;
    if (this.frameIndex % 30 === 0) {
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
    const city = makeLightstormCity(capacity);
    this.cityMetadata = {
      gridSize: city.gridSize,
      fieldHalfExtent: city.fieldHalfExtent,
      towerCount: city.towerCount,
      transitCount: city.transitCount
    };
    const instances = this.device.createBuffer({
      id: 'lightstorm-megacity-instances',
      data: city.instances,
      usage: Buffer.STORAGE | Buffer.COPY_DST
    });
    const visibleIdentifiers = this.device.createBuffer({
      id: 'lightstorm-megacity-visible-identifiers',
      byteLength: capacity * UINT32_BYTE_LENGTH,
      usage: Buffer.STORAGE | Buffer.COPY_SRC
    });
    const drawCommands = new DrawCommandBuffer(this.device, {
      id: 'lightstorm-megacity-draw-command',
      type: 'draw-indexed',
      commands: [{indexCount: this.getIndexCount(), instanceCount: 0}]
    });
    const perspectiveRenderBundle = this.createRenderBundle(
      'lightstorm-megacity-perspective-render-bundle',
      instances,
      visibleIdentifiers,
      drawCommands,
      this.uniformBuffer
    );
    const overviewRenderBundle = this.createRenderBundle(
      'lightstorm-megacity-overview-render-bundle',
      instances,
      visibleIdentifiers,
      drawCommands,
      this.overviewUniformBuffer
    );
    const compiled = this.createGraph(
      capacity,
      instances,
      visibleIdentifiers,
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
      visibleIdentifiers,
      drawCommands
    );
    this.resources = {
      compiled,
      pickingCompiled: picking.compiled,
      pickingReadbackIdentifier: picking.readbackIdentifier,
      pickingWidth,
      pickingHeight,
      drawCommands,
      instances,
      visibleIdentifiers,
      perspectiveRenderBundle,
      overviewRenderBundle
    };
    this.sampledVisibleCount = 0;
    this.hasVisibilitySample = false;
    this.pickedObjectIndex = null;
    this.compileTimeMilliseconds = performance.now() - compileStart;
    this.updateInspector();
  }

  private createGraph(
    capacity: number,
    instancesBuffer: Buffer,
    visibleIdentifiersBuffer: Buffer,
    drawCommands: DrawCommandBuffer,
    perspectiveRenderBundle: RenderBundle,
    overviewRenderBundle: RenderBundle
  ): CompiledGPUCommandGraph<LightstormGraphParameters> {
    const graph = new GPUCommandGraph<LightstormGraphParameters>(this.device, {
      id: 'lightstorm-megacity-command-graph'
    });
    const instances = graph.importBuffer(
      {id: 'instances', byteLength: instancesBuffer.byteLength, usage: instancesBuffer.usage},
      instancesBuffer
    );
    const visibleIdentifiers = graph.importBuffer(
      {
        id: 'visible-identifiers',
        byteLength: visibleIdentifiersBuffer.byteLength,
        usage: visibleIdentifiersBuffer.usage
      },
      visibleIdentifiersBuffer
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
    const flags = graph.createDataView(flagsBuffer, {format: 'uint32', length: capacity});
    const visibleIdentifierView = graph.createDataView(visibleIdentifiers, {
      format: 'uint32',
      length: capacity
    });
    const instanceCount = graph.createDataView(drawCommandBuffer, {
      format: 'uint32',
      length: 1,
      byteOffset: drawCommands.getInstanceCountByteOffset(0)
    });

    graph.addComputePass({
      id: 'city-layer-and-frustum-visibility',
      resources: [
        {buffer: instances, usage: 'storage-read'},
        {buffer: uniforms, usage: 'uniform'},
        {buffer: flags, usage: 'storage-write'}
      ],
      compile: ({device}) => {
        const computation = new Computation(device, {
          id: 'lightstorm-megacity-visibility',
          source: getLightstormVisibilityShader(capacity),
          shaderLayout: {
            bindings: [
              {name: 'instances', type: 'storage', group: 0, location: 0},
              {name: 'uniforms', type: 'uniform', group: 0, location: 1},
              {name: 'flags', type: 'storage', group: 0, location: 2}
            ]
          }
        });
        return {
          encode: ({computePass, getBuffer}) => {
            computation.setBindings({
              instances: getBuffer(instances),
              uniforms: getBuffer(uniforms),
              flags: getBuffer(flags)
            });
            computation.dispatch(computePass, Math.ceil(capacity / 256));
          },
          destroy: () => computation.destroy()
        };
      }
    });

    new GPUVisibilityWorkflow({
      id: 'visible-city-records',
      predicates: [{kind: 'bounds', mask: flags}],
      output: visibleIdentifierView,
      count: instanceCount
    }).addToGraph(graph);

    graph.addRenderPass({
      id: 'render-visible-city',
      resources: [
        {buffer: instances, usage: 'storage-read'},
        {buffer: visibleIdentifiers, usage: 'storage-read'},
        {buffer: uniforms, usage: 'uniform'},
        {buffer: overviewUniforms, usage: 'uniform'},
        {buffer: drawCommandBuffer, usage: 'indirect'}
      ],
      compile: () => ({
        getRenderPassProps: () => ({
          id: 'lightstorm-megacity-render-pass',
          clearColor: [0.0015, 0.003, 0.012, 1],
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
    visibleIdentifiersBuffer: Buffer,
    drawCommands: DrawCommandBuffer
  ): {
    compiled: CompiledGPUCommandGraph<LightstormPickingGraphParameters>;
    readbackIdentifier: string;
  } {
    const graph = new GPUCommandGraph<LightstormPickingGraphParameters>(this.device, {
      id: 'lightstorm-megacity-picking-graph'
    });
    const instances = graph.importBuffer(
      {
        id: 'picking-instances',
        byteLength: instancesBuffer.byteLength,
        usage: instancesBuffer.usage
      },
      instancesBuffer
    );
    const visibleIdentifiers = graph.importBuffer(
      {
        id: 'picking-visible-identifiers',
        byteLength: visibleIdentifiersBuffer.byteLength,
        usage: visibleIdentifiersBuffer.usage
      },
      visibleIdentifiersBuffer
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
      id: 'lightstorm-visible-city-picking',
      width,
      height
    });
    graph.addRenderPass({
      id: 'render-visible-city-picking',
      attachments: target.attachments,
      resources: [
        {buffer: instances, usage: 'storage-read'},
        {buffer: visibleIdentifiers, usage: 'storage-read'},
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
            visibleIds: getBuffer(visibleIdentifiers),
            uniforms: getBuffer(uniforms)
          });
          drawCommands.draw(renderPass, 0);
        }
      })
    });
    target.addReadbackPass({
      after: 'render-visible-city-picking',
      getPixel: parameters => parameters.pixel
    });
    return {compiled: graph.compile(), readbackIdentifier: target.readback.id};
  }

  private createRenderBundle(
    identifier: string,
    instances: Buffer,
    visibleIdentifiers: Buffer,
    drawCommands: DrawCommandBuffer,
    uniforms: Buffer
  ): RenderBundle {
    const encoder = this.device.createRenderBundleEncoder({
      id: identifier,
      colorAttachmentFormats: [this.device.preferredColorFormat],
      depthStencilAttachmentFormat: 'depth24plus'
    });
    encoder.setPipeline(this.model.pipeline);
    encoder.setVertexArray(this.model.vertexArray);
    encoder.setBindings({instances, visibleIds: visibleIdentifiers, uniforms});
    drawCommands.draw(encoder, 0);
    return encoder.finish();
  }

  private getIndexCount(): number {
    const indexBuffer = this.model.vertexArray.indexBuffer;
    if (!indexBuffer) {
      throw new Error('Lightstorm Megacity requires indexed cube geometry');
    }
    return (
      this.model.indexCount ?? indexBuffer.byteLength / (indexBuffer.indexType === 'uint32' ? 4 : 2)
    );
  }

  private writeUniforms(parameters: LightstormGraphParameters, timeMilliseconds: number): void {
    const perspectiveAspect = getViewportAspect(parameters.perspectiveViewport);
    const cameraPose = this.guidedCamera
      ? getGuidedCameraPose((timeMilliseconds - this.guidedCameraStartMilliseconds) / 1000)
      : {
          target: this.cameraTarget,
          yaw: this.yaw,
          pitch: this.pitch,
          distance: this.distance,
          duration: 0
        };
    this.currentCameraPose = cameraPose;
    const cosinePitch = Math.cos(cameraPose.pitch);
    const eye: [number, number, number] = [
      cameraPose.target[0] + Math.sin(cameraPose.yaw) * cosinePitch * cameraPose.distance,
      cameraPose.target[1] + Math.sin(cameraPose.pitch) * cameraPose.distance,
      cameraPose.target[2] + Math.cos(cameraPose.yaw) * cosinePitch * cameraPose.distance
    ];
    const viewMatrix = new Matrix4().lookAt({eye, center: cameraPose.target, up: [0, 1, 0]});
    const farPlane = Math.max(1800, this.cityMetadata.fieldHalfExtent * 3.2);
    const projectionMatrix = new Matrix4().perspective({
      fovy: FIELD_OF_VIEW,
      aspect: perspectiveAspect,
      near: NEAR_PLANE,
      far: farPlane
    });
    this.writeCameraUniforms(
      this.uniformBuffer,
      viewMatrix,
      projectionMatrix,
      perspectiveAspect,
      farPlane,
      this.cullingEnabled,
      timeMilliseconds
    );

    const overviewAspect = getViewportAspect(
      parameters.overviewViewport ?? parameters.perspectiveViewport
    );
    const overviewHalfExtent = this.cityMetadata.fieldHalfExtent * 1.06;
    const overviewHalfWidth =
      overviewAspect >= 1 ? overviewHalfExtent * overviewAspect : overviewHalfExtent;
    const overviewHalfHeight =
      overviewAspect >= 1 ? overviewHalfExtent : overviewHalfExtent / overviewAspect;
    const overviewFarPlane = Math.max(2000, overviewHalfExtent * 4);
    const overviewViewMatrix = new Matrix4().lookAt({
      eye: [0, overviewHalfExtent * 1.6, 0],
      center: [0, 0, 0],
      up: [0, 0, -1]
    });
    const overviewProjectionMatrix = new Matrix4().ortho({
      left: -overviewHalfWidth,
      right: overviewHalfWidth,
      bottom: -overviewHalfHeight,
      top: overviewHalfHeight,
      near: NEAR_PLANE,
      far: overviewFarPlane
    });
    this.writeCameraUniforms(
      this.overviewUniformBuffer,
      overviewViewMatrix,
      overviewProjectionMatrix,
      overviewAspect,
      overviewFarPlane,
      false,
      timeMilliseconds
    );
  }

  private writeCameraUniforms(
    buffer: Buffer,
    viewMatrix: Matrix4,
    projectionMatrix: Matrix4,
    aspect: number,
    farPlane: number,
    cullingEnabled: boolean,
    timeMilliseconds: number
  ): void {
    const viewProjectionMatrix = new Matrix4(projectionMatrix).multiplyRight(viewMatrix);
    const values = new Float32Array(UNIFORM_BYTE_LENGTH / Float32Array.BYTES_PER_ELEMENT);
    values.set(viewProjectionMatrix, 0);
    values.set(viewMatrix, 16);
    values.set(
      [
        Math.tan(FIELD_OF_VIEW / 2),
        aspect,
        NEAR_PLANE,
        farPlane,
        cullingEnabled ? 1 : 0,
        this.pickedObjectIndex === null ? 0 : this.pickedObjectIndex + 1,
        getDataLayerMode(this.dataLayer),
        this.lightstormEnabled ? 1 : 0,
        timeMilliseconds / 1000,
        this.device.preferredColorFormat === 'rgba16float' ? 1 : 1.35,
        this.device.preferredColorFormat === 'rgba16float' ? 1 : 0,
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
      const values = new Uint32Array(
        bytes.buffer,
        bytes.byteOffset,
        bytes.byteLength / UINT32_BYTE_LENGTH
      );
      this.sampledVisibleCount = values[1] ?? 0;
      this.hasVisibilitySample = true;
      this.updateInspector();
    } finally {
      this.countReadPending = false;
    }
  }

  private getPickingPixel(
    mousePosition: [number, number],
    resources: LightstormGraphResources
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
    this.resources.visibleIdentifiers.destroy();
    this.resources = null;
  }

  private makePanel(): Panel {
    return new ColumnPanel({
      id: 'lightstorm-megacity-panel',
      title: 'Lightstorm Megacity',
      panels: [
        makeHtmlCustomPanel({
          id: 'lightstorm-megacity-overview',
          title: '',
          html: `<p style="margin:0;line-height:1.45"><strong>GPU resident · no per-frame instance upload.</strong> One command graph filters city layers, tests conservative tower bounds, stably compacts source IDs, writes an indexed indirect command, and replays a fixed render bundle. Extended HDR presentation is used when available.</p>`
        }),
        makeHtmlCustomPanel({
          id: 'lightstorm-megacity-controls',
          title: 'Mission control',
          html: this.getControlsHtml(),
          onRender: root => this.bindPanelControls(root)
        }),
        makeHtmlCustomPanel({
          id: 'lightstorm-megacity-stats',
          title: 'Lightstorm GPU pipeline',
          html: `<div data-capacity></div><div data-stats></div><div data-nodes style="margin-top:10px;font:11px/1.45 ui-monospace,monospace;max-height:220px;overflow:auto"></div>`,
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
      <label>City records <select data-capacity-select>${CAPACITY_OPTIONS.map(value => `<option value="${value}"${value === this.capacity ? ' selected' : ''}>${formatCount(value)}</option>`).join('')}</select></label>
      <label>Data layer <select data-layer-select>
        <option value="all">Towers + transit</option>
        <option value="towers">Towers only</option>
        <option value="transit">Transit energy grid</option>
      </select></label>
      <label><input type="checkbox" data-culling checked> GPU frustum culling</label>
      <label><input type="checkbox" data-lightstorm checked> Animated lightstorm</label>
      <label><input type="checkbox" data-guided-camera checked> Guided camera</label>
      <label><input type="checkbox" data-comparison> Tactical visibility proof</label>
      <button type="button" data-restart-tour>Restart cinematic tour</button>
      <small>Disable the guided camera or drag to explore. Scroll to zoom; move the pointer to pick a stable source record. The tactical view replays the perspective-visible subset from overhead.</small>
    </div>`;
  }

  private bindPanelControls(root: HTMLElement): () => void {
    const capacitySelect = root.querySelector('[data-capacity-select]') as HTMLSelectElement;
    const layerSelect = root.querySelector('[data-layer-select]') as HTMLSelectElement;
    const culling = root.querySelector('[data-culling]') as HTMLInputElement;
    const lightstorm = root.querySelector('[data-lightstorm]') as HTMLInputElement;
    const guidedCamera = root.querySelector('[data-guided-camera]') as HTMLInputElement;
    const comparison = root.querySelector('[data-comparison]') as HTMLInputElement;
    const restartTour = root.querySelector('[data-restart-tour]') as HTMLButtonElement;
    this.guidedCameraElement = guidedCamera;
    const onCapacity = (): void => this.rebuild(Number(capacitySelect.value));
    const onLayer = (): void => {
      this.dataLayer = layerSelect.value as LightstormDataLayer;
      this.hasVisibilitySample = false;
      this.pickedObjectIndex = null;
    };
    const onCulling = (): void => {
      this.cullingEnabled = culling.checked;
      this.hasVisibilitySample = false;
    };
    const onLightstorm = (): void => {
      this.lightstormEnabled = lightstorm.checked;
    };
    const onGuidedCamera = (): void => {
      if (guidedCamera.checked) {
        this.restartGuidedCamera();
      } else {
        this.switchToExplore();
      }
    };
    const onComparison = (): void => {
      this.comparisonView = comparison.checked;
      this.updateInspector();
    };
    const onRestartTour = (): void => this.restartGuidedCamera();
    capacitySelect.addEventListener('change', onCapacity);
    layerSelect.addEventListener('change', onLayer);
    culling.addEventListener('change', onCulling);
    lightstorm.addEventListener('change', onLightstorm);
    guidedCamera.addEventListener('change', onGuidedCamera);
    comparison.addEventListener('change', onComparison);
    restartTour.addEventListener('click', onRestartTour);
    return () => {
      capacitySelect.removeEventListener('change', onCapacity);
      layerSelect.removeEventListener('change', onLayer);
      culling.removeEventListener('change', onCulling);
      lightstorm.removeEventListener('change', onLightstorm);
      guidedCamera.removeEventListener('change', onGuidedCamera);
      comparison.removeEventListener('change', onComparison);
      restartTour.removeEventListener('click', onRestartTour);
      this.guidedCameraElement = null;
    };
  }

  private restartGuidedCamera(): void {
    this.guidedCamera = true;
    this.guidedCameraStartMilliseconds = this.currentTimeMilliseconds;
    this.pickedObjectIndex = null;
    if (this.guidedCameraElement) {
      this.guidedCameraElement.checked = true;
    }
  }

  private switchToExplore(): void {
    if (this.guidedCamera) {
      this.cameraTarget = [...this.currentCameraPose.target];
      this.yaw = this.currentCameraPose.yaw;
      this.pitch = this.currentCameraPose.pitch;
      this.distance = this.currentCameraPose.distance;
    }
    this.guidedCamera = false;
    if (this.guidedCameraElement) {
      this.guidedCameraElement.checked = false;
    }
  }

  private updateInspector(): void {
    const stats = this.resources?.compiled.stats;
    if (!stats) {
      return;
    }
    const eligibleCount = getEligibleCount(this.dataLayer, this.capacity, this.cityMetadata);
    const sampledVisibleCount = Math.min(this.sampledVisibleCount, eligibleCount);
    const culledCount = Math.max(0, eligibleCount - sampledVisibleCount);
    const visiblePercentage = eligibleCount > 0 ? (sampledVisibleCount / eligibleCount) * 100 : 0;
    const replayCount = this.comparisonView ? 2 : 1;
    const instanceBytes = this.capacity * 12 * Float32Array.BYTES_PER_ELEMENT;
    if (this.capacityElement) {
      this.capacityElement.innerHTML = `<strong>${formatCount(this.capacity)}</strong> GPU-resident records · ${formatBytes(instanceBytes)} · rebuilt in ${this.compileTimeMilliseconds.toFixed(1)} ms`;
    }
    if (this.statsElement) {
      const visibleLabel = this.hasVisibilitySample
        ? `${formatCount(sampledVisibleCount)} (${visiblePercentage.toFixed(1)}%)`
        : 'sampling…';
      const culledLabel = this.hasVisibilitySample ? formatCount(culledCount) : 'sampling…';
      const submittedTriangles = this.hasVisibilitySample
        ? formatCount(sampledVisibleCount * TRIANGLES_PER_INSTANCE * replayCount)
        : 'sampling…';
      this.statsElement.innerHTML = `<div style="display:grid;grid-template-columns:1fr auto;gap:4px 12px;margin-top:8px">
        <span>Camera</span><strong>${this.guidedCamera ? 'guided tour' : 'free explore'}</strong>
        <span>Layer source</span><strong>${formatCount(eligibleCount)}</strong>
        <span>Visible / submitted</span><strong>${visibleLabel}</strong>
        <span>GPU rejected</span><strong>${culledLabel}</strong>
        <span>Nominal triangles</span><strong>${formatCount(eligibleCount * TRIANGLES_PER_INSTANCE)}</strong>
        <span>Submitted triangles</span><strong>${submittedTriangles}</strong>
        <span>Indirect draws</span><strong>${replayCount}</strong>
        <span>Bundle replays</span><strong>${replayCount}</strong>
        <span>Presentation</span><strong>${this.device.preferredColorFormat === 'rgba16float' ? 'Display P3 extended HDR' : 'tone-mapped SDR'}</strong>
        <span>Frame rate</span><strong>${this.framesPerSecond.toFixed(1)} FPS</strong>
        <span>CPU frame</span><strong>${this.cpuFrameTimeMilliseconds.toFixed(2)} ms</strong>
        <span>GPU frame</span><strong>${formatGpuTime(this.device, this.gpuFrameTimeMilliseconds)}</strong>
        <span>Picked record</span><strong>${this.formatPickedRecord()}</strong>
        <span>CPU graph encode</span><strong>${this.encodeTimeMilliseconds.toFixed(2)} ms</strong>
        <span>Logical scratch</span><strong>${formatBytes(stats.logicalTransientBytes)}</strong>
        <span>Physical scratch</span><strong>${formatBytes(stats.physicalTransientBytes)}</strong>
        <span>Transient reuse</span><strong>${stats.reusePercentage.toFixed(0)}%</strong>
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

  private formatPickedRecord(): string {
    if (this.pickedObjectIndex === null) {
      return 'none';
    }
    const gridX = this.pickedObjectIndex % this.cityMetadata.gridSize;
    const gridZ = Math.floor(this.pickedObjectIndex / this.cityMetadata.gridSize);
    const recordKind = gridX % 12 <= 1 || gridZ % 12 <= 1 ? 'transit' : 'tower';
    return `#${this.pickedObjectIndex} · ${recordKind}`;
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    this.switchToExplore();
    this.dragging = true;
    this.lastPointer = [event.clientX, event.clientY];
    this.canvas?.setPointerCapture(event.pointerId);
    if (this.canvas) {
      this.canvas.style.cursor = 'grabbing';
    }
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    this.pointerDirty = true;
    if (!this.dragging) {
      return;
    }
    const deltaX = event.clientX - this.lastPointer[0];
    const deltaY = event.clientY - this.lastPointer[1];
    this.lastPointer = [event.clientX, event.clientY];
    if (event.shiftKey) {
      const panScale = this.distance * 0.0018;
      this.cameraTarget[0] -= Math.cos(this.yaw) * deltaX * panScale;
      this.cameraTarget[2] += Math.sin(this.yaw) * deltaX * panScale;
      this.cameraTarget[1] += deltaY * panScale;
    } else {
      this.yaw -= deltaX * 0.006;
      this.pitch = Math.max(-1.2, Math.min(1.35, this.pitch + deltaY * 0.006));
    }
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
    this.switchToExplore();
    const maximumDistance = Math.max(500, this.cityMetadata.fieldHalfExtent * 2.2);
    this.distance = Math.max(
      12,
      Math.min(maximumDistance, this.distance * Math.exp(event.deltaY * 0.001))
    );
  };
}

function getGuidedCameraPose(timeSeconds: number): CameraPose {
  const totalDuration = GUIDED_CAMERA_POSES.reduce(
    (duration, cameraPose) => duration + cameraPose.duration,
    0
  );
  let localTime = ((timeSeconds % totalDuration) + totalDuration) % totalDuration;
  for (let poseIndex = 0; poseIndex < GUIDED_CAMERA_POSES.length; poseIndex++) {
    const startPose = GUIDED_CAMERA_POSES[poseIndex];
    if (localTime <= startPose.duration) {
      const endPose = GUIDED_CAMERA_POSES[(poseIndex + 1) % GUIDED_CAMERA_POSES.length];
      const progress = smoothstep(localTime / startPose.duration);
      const yawDelta = getShortestAngleDelta(startPose.yaw, endPose.yaw);
      return {
        target: [
          mix(startPose.target[0], endPose.target[0], progress),
          mix(startPose.target[1], endPose.target[1], progress),
          mix(startPose.target[2], endPose.target[2], progress)
        ],
        yaw: startPose.yaw + yawDelta * progress,
        pitch: mix(startPose.pitch, endPose.pitch, progress),
        distance: mix(startPose.distance, endPose.distance, progress),
        duration: startPose.duration
      };
    }
    localTime -= startPose.duration;
  }
  return GUIDED_CAMERA_POSES[0];
}

function getShortestAngleDelta(start: number, end: number): number {
  return ((((end - start + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) - Math.PI;
}

function smoothstep(value: number): number {
  const clampedValue = Math.max(0, Math.min(1, value));
  return clampedValue * clampedValue * (3 - 2 * clampedValue);
}

function mix(start: number, end: number, amount: number): number {
  return start + (end - start) * amount;
}

function getDataLayerMode(dataLayer: LightstormDataLayer): number {
  if (dataLayer === 'towers') return 1;
  if (dataLayer === 'transit') return 2;
  return 0;
}

function getEligibleCount(
  dataLayer: LightstormDataLayer,
  capacity: number,
  metadata: LightstormCityMetadata
): number {
  if (dataLayer === 'towers') return metadata.towerCount;
  if (dataLayer === 'transit') return metadata.transitCount;
  return capacity;
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
): LightstormGraphParameters {
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
