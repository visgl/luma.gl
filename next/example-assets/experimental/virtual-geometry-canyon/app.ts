// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, Texture, type Device} from '@luma.gl/core';
import {AnimationLoopTemplate, Geometry, Model, type AnimationProps} from '@luma.gl/engine';
import {
  DrawCommandBuffer,
  GPUCommandGraph,
  GPUVirtualGeometrySelection,
  type CompiledGPUCommandGraph
} from '@luma.gl/gpgpu/gpu-core';
import {Matrix4} from '@math.gl/core';
import {ColumnPanel, type Panel} from '@deck.gl-community/panels';
import {
  ExamplePanelManager,
  makeExamplePanelHostHtml,
  makeHtmlCustomPanel
} from '../../example-panels';
import {
  CANYON_CLUSTER_GRID_SEGMENTS,
  makeCanyonClusterMeshData,
  makeVirtualGeometryCanyonHierarchy,
  type VirtualGeometryCanyonHierarchy,
  type VirtualGeometryCanyonHierarchyOptions
} from './canyon-data';
import {
  CANYON_CAMERA_FAR_PLANE,
  CANYON_CAMERA_FIELD_OF_VIEW,
  CANYON_CAMERA_NEAR_PLANE,
  getCanyonFrustumPlanes,
  getCanyonGuidedCameraSample,
  getCanyonProjectionScale,
  getConstrainedCanyonCameraSample,
  makeCanyonCameraRoute,
  type CanyonCameraRoute,
  type CanyonCameraSample,
  type CanyonVector3
} from './canyon-camera';
import {
  CANYON_RENDER_SHADER,
  CANYON_SKY_SHADER,
  makeCanyonVisualizationOptions
} from './canyon-shaders';
import {CanyonWindAudio} from './canyon-wind';

export const title = 'Virtual Geometry Canyon';
export const description =
  'GPU-only hierarchical LOD selects and indirectly renders a 42-million-triangle procedural canyon.';

const UINT32_BYTE_LENGTH = Uint32Array.BYTES_PER_ELEMENT;
const CANYON_UNIFORM_BYTE_LENGTH = 144;
const DEFAULT_MAXIMUM_SCREEN_SPACE_ERROR = 3.25;
const MANUAL_PROGRESS_STEP = 0.012;

type CanyonGraphResources = {
  compiled: CompiledGPUCommandGraph<void>;
  selection: GPUVirtualGeometrySelection;
  frameColorId: string;
  frameDepthId: string;
  width: number;
  height: number;
};

type CanyonBuffers = {
  sphereBounds: Buffer;
  geometricErrors: Buffer;
  children: Buffer;
  clusterIds: Buffer;
  clusterMetadata: Buffer;
  frustumPlanes: Buffer;
  cameraPosition: Buffer;
  pixelProjectionScale: Buffer;
  maximumScreenSpaceError: Buffer;
  selectedClusterIds: Buffer;
  overflow: Buffer;
  uniforms: Buffer;
};

/** Optional reduced hierarchy used only by focused WebGPU smoke tests. */
export type VirtualGeometryCanyonExampleProps = AnimationProps & {
  hierarchyOptions?: VirtualGeometryCanyonHierarchyOptions;
};

/** GPU-driven virtualized terrain showcase with no render-loop readback. */
export default class VirtualGeometryCanyonAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeExamplePanelHostHtml();
  static props = {createFramebuffer: true, debug: true};

  readonly device: Device;
  readonly hierarchy: VirtualGeometryCanyonHierarchy;
  readonly terrainModel: Model;
  readonly skyModel: Model;
  readonly drawCommands: DrawCommandBuffer;
  readonly buffers: CanyonBuffers;
  readonly route: CanyonCameraRoute;
  readonly panels: ExamplePanelManager;

  private graphResources: CanyonGraphResources | null = null;
  private readonly windAudio = new CanyonWindAudio();
  private canvas: HTMLCanvasElement | null = null;
  private frameIndex = 0;
  private lastFrameTimeMilliseconds: number | null = null;
  private routeTimeSeconds = 0;
  private manualProgress = 0;
  private manualYawOffset = 0;
  private manualPitchOffset = 0;
  private manualMode = false;
  private paused = false;
  private debugLOD = false;
  private wireframe = false;
  private maximumScreenSpaceError = DEFAULT_MAXIMUM_SCREEN_SPACE_ERROR;
  private dragging = false;
  private lastPointer: [number, number] = [0, 0];
  private currentSample: CanyonCameraSample;
  private framesPerSecond = 0;
  private cpuFrameTimeMilliseconds = 0;
  private gpuFrameTimeMilliseconds = 0;
  private graphEncodeTimeMilliseconds = 0;
  private statsElement: HTMLElement | null = null;
  private statusElement: HTMLElement | null = null;
  private windStatusElement: HTMLElement | null = null;
  private windActivationButton: HTMLButtonElement | null = null;
  private debugLODInputElement: HTMLInputElement | null = null;
  private wireframeInputElement: HTMLInputElement | null = null;

  constructor({device, hierarchyOptions}: VirtualGeometryCanyonExampleProps) {
    super();
    if (device.type !== 'webgpu') {
      throw new Error('Virtual Geometry Canyon requires WebGPU');
    }
    this.device = device;
    this.hierarchy = makeVirtualGeometryCanyonHierarchy(hierarchyOptions);
    const mesh = makeCanyonClusterMeshData(
      hierarchyOptions?.clusterGridSegments ?? CANYON_CLUSTER_GRID_SEGMENTS
    );
    this.route = makeCanyonCameraRoute();
    this.currentSample = getCanyonGuidedCameraSample(this.route, 0);
    this.buffers = this.createBuffers();
    this.drawCommands = new DrawCommandBuffer(device, {
      id: 'virtual-geometry-canyon-draw-command',
      type: 'draw-indexed',
      commands: [{indexCount: mesh.indices.length, instanceCount: 0}]
    });
    this.terrainModel = new Model(device, {
      id: 'virtual-geometry-canyon-terrain',
      source: CANYON_RENDER_SHADER,
      geometry: new Geometry({
        id: 'virtual-geometry-canyon-shared-cluster-grid',
        topology: 'triangle-list',
        indices: {size: 1, value: mesh.indices},
        attributes: {
          localCoordinates: {size: 4, value: mesh.vertices}
        }
      }),
      colorAttachmentFormats: [device.preferredColorFormat],
      depthStencilAttachmentFormat: 'depth24plus',
      shaderLayout: {
        attributes: [{name: 'localCoordinates', location: 0, type: 'vec4<f32>'}],
        bindings: [
          {name: 'selectedClusterIds', type: 'read-only-storage', group: 0, location: 0},
          {name: 'clusterMetadata', type: 'read-only-storage', group: 0, location: 1},
          {name: 'clusterBounds', type: 'read-only-storage', group: 0, location: 2},
          {name: 'uniforms', type: 'uniform', group: 0, location: 3}
        ]
      },
      parameters: {
        cullMode: 'back',
        depthCompare: 'less-equal',
        depthWriteEnabled: true
      }
    });
    this.skyModel = new Model(device, {
      id: 'virtual-geometry-canyon-sky',
      source: CANYON_SKY_SHADER,
      topology: 'triangle-list',
      vertexCount: 3,
      colorAttachmentFormats: [device.preferredColorFormat],
      depthStencilAttachmentFormat: 'depth24plus',
      shaderLayout: {
        attributes: [],
        bindings: [{name: 'uniforms', type: 'uniform', group: 0, location: 3}]
      },
      parameters: {
        depthCompare: 'always',
        depthWriteEnabled: false
      }
    });
    this.panels = new ExamplePanelManager({panel: this.makePanel()});
    this.panels.mount();
  }

  override async onInitialize({canvas}: AnimationProps): Promise<void> {
    if (!(canvas instanceof HTMLCanvasElement)) {
      return;
    }
    this.canvas = canvas;
    canvas.style.cursor = 'grab';
    canvas.addEventListener('pointerdown', this.handlePointerDown);
    canvas.addEventListener('pointermove', this.handlePointerMove);
    canvas.addEventListener('pointerup', this.handlePointerUp);
    canvas.addEventListener('pointercancel', this.handlePointerUp);
    canvas.addEventListener('wheel', this.handleWheel, {passive: false});
    window.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    this.windAudio.setPageVisible(!document.hidden);
    this.mountWindActivationButton();
  }

  override onRender({animationLoop, device, time}: AnimationProps): void {
    const deviceSize = device.getDefaultCanvasContext().getDevicePixelSize();
    const width = Math.max(1, deviceSize[0]);
    const height = Math.max(1, deviceSize[1]);
    this.ensureGraph(width, height);
    const resources = this.graphResources;
    if (!resources) {
      return;
    }

    const previousTime = this.lastFrameTimeMilliseconds ?? time;
    const frameDeltaSeconds = Math.min(0.1, Math.max(0, (time - previousTime) / 1000));
    this.lastFrameTimeMilliseconds = time;
    if (!this.manualMode && !this.paused) {
      this.routeTimeSeconds += frameDeltaSeconds;
    }
    this.currentSample = this.manualMode
      ? getConstrainedCanyonCameraSample(
          this.route,
          this.manualProgress,
          this.manualYawOffset,
          this.manualPitchOffset
        )
      : getCanyonGuidedCameraSample(this.route, this.routeTimeSeconds);
    this.writeFrameState(this.currentSample, width, height, time / 1000);

    const frame = device
      .getDefaultCanvasContext()
      .getCurrentFramebuffer({depthStencilFormat: 'depth24plus'});
    const encoding = resources.compiled.encode(device.commandEncoder, {
      parameters: undefined,
      frameTextures: {
        [resources.frameColorId]: {
          texture: frame.colorAttachments[0].texture,
          frameId: this.frameIndex
        },
        [resources.frameDepthId]: {
          texture: frame.depthStencilAttachment!.texture,
          frameId: this.frameIndex
        }
      }
    });
    this.graphEncodeTimeMilliseconds = encoding.stats.cpuEncodeTimeMilliseconds;
    this.framesPerSecond = animationLoop.frameRate.getSampleHz();
    this.cpuFrameTimeMilliseconds = animationLoop.cpuTime.getSampleAverageTime();
    this.gpuFrameTimeMilliseconds = animationLoop.gpuTime.getSampleAverageTime();
    this.frameIndex++;
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
      window.removeEventListener('keydown', this.handleKeyDown);
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
    this.unmountWindActivationButton();
    this.windAudio.destroy();
    this.destroyGraph();
    this.panels.finalize();
    this.skyModel.destroy();
    this.terrainModel.destroy();
    this.drawCommands.destroy();
    for (const buffer of Object.values(this.buffers)) {
      buffer.destroy();
    }
  }

  private createBuffers(): CanyonBuffers {
    const storageData = (id: string, data: ArrayBufferView): Buffer =>
      this.device.createBuffer({id, data, usage: Buffer.STORAGE | Buffer.COPY_DST});
    return {
      sphereBounds: storageData('canyon-sphere-bounds', this.hierarchy.sphereBounds),
      geometricErrors: storageData('canyon-geometric-errors', this.hierarchy.geometricErrors),
      children: storageData('canyon-children', this.hierarchy.children),
      clusterIds: storageData('canyon-cluster-ids', this.hierarchy.clusterIds),
      clusterMetadata: storageData('canyon-cluster-metadata', this.hierarchy.clusterMetadata),
      frustumPlanes: this.device.createBuffer({
        id: 'canyon-frustum-planes',
        byteLength: 6 * 4 * Float32Array.BYTES_PER_ELEMENT,
        usage: Buffer.STORAGE | Buffer.COPY_DST
      }),
      cameraPosition: this.device.createBuffer({
        id: 'canyon-camera-position',
        byteLength: 3 * Float32Array.BYTES_PER_ELEMENT,
        usage: Buffer.STORAGE | Buffer.COPY_DST
      }),
      pixelProjectionScale: this.device.createBuffer({
        id: 'canyon-pixel-projection-scale',
        byteLength: Float32Array.BYTES_PER_ELEMENT,
        usage: Buffer.STORAGE | Buffer.COPY_DST
      }),
      maximumScreenSpaceError: this.device.createBuffer({
        id: 'canyon-maximum-screen-space-error',
        byteLength: Float32Array.BYTES_PER_ELEMENT,
        usage: Buffer.STORAGE | Buffer.COPY_DST
      }),
      selectedClusterIds: this.device.createBuffer({
        id: 'canyon-selected-cluster-ids',
        byteLength: this.hierarchy.leafClusterCount * UINT32_BYTE_LENGTH,
        usage: Buffer.STORAGE
      }),
      overflow: this.device.createBuffer({
        id: 'canyon-selection-overflow',
        byteLength: UINT32_BYTE_LENGTH,
        usage: Buffer.STORAGE
      }),
      uniforms: this.device.createBuffer({
        id: 'canyon-uniforms',
        byteLength: CANYON_UNIFORM_BYTE_LENGTH,
        usage: Buffer.UNIFORM | Buffer.COPY_DST
      })
    };
  }

  private ensureGraph(width: number, height: number): void {
    if (
      this.graphResources &&
      this.graphResources.width === width &&
      this.graphResources.height === height
    ) {
      return;
    }
    this.destroyGraph();
    const graph = new GPUCommandGraph<void>(this.device, {
      id: 'virtual-geometry-canyon-command-graph'
    });
    const importBuffer = (id: string, buffer: Buffer) =>
      graph.importBuffer({id, byteLength: buffer.byteLength, usage: buffer.usage}, buffer);
    const sphereBoundsBuffer = importBuffer('sphere-bounds', this.buffers.sphereBounds);
    const geometricErrorsBuffer = importBuffer('geometric-errors', this.buffers.geometricErrors);
    const childrenBuffer = importBuffer('children', this.buffers.children);
    const clusterIdsBuffer = importBuffer('cluster-ids', this.buffers.clusterIds);
    const clusterMetadataBuffer = importBuffer('cluster-metadata', this.buffers.clusterMetadata);
    const frustumPlanesBuffer = importBuffer('frustum-planes', this.buffers.frustumPlanes);
    const cameraPositionBuffer = importBuffer('camera-position', this.buffers.cameraPosition);
    const pixelProjectionScaleBuffer = importBuffer(
      'pixel-projection-scale',
      this.buffers.pixelProjectionScale
    );
    const maximumScreenSpaceErrorBuffer = importBuffer(
      'maximum-screen-space-error',
      this.buffers.maximumScreenSpaceError
    );
    const selectedClusterIdsBuffer = importBuffer(
      'selected-cluster-ids',
      this.buffers.selectedClusterIds
    );
    const overflowBuffer = importBuffer('selection-overflow', this.buffers.overflow);
    const uniformBuffer = importBuffer('uniforms', this.buffers.uniforms);
    const drawCommandBuffer = importBuffer('draw-command', this.drawCommands.buffer);

    const selection = new GPUVirtualGeometrySelection({
      id: 'canyon-lod-selection',
      hierarchy: {
        sphereBounds: graph.createDataView(sphereBoundsBuffer, {
          format: 'float32x4',
          length: this.hierarchy.nodeCount
        }),
        geometricErrors: graph.createDataView(geometricErrorsBuffer, {
          format: 'float32',
          length: this.hierarchy.nodeCount
        }),
        children: graph.createDataView(childrenBuffer, {
          format: 'uint32x2',
          length: this.hierarchy.nodeCount
        }),
        clusterIds: graph.createDataView(clusterIdsBuffer, {
          format: 'uint32',
          length: this.hierarchy.nodeCount
        }),
        levelOffsets: this.hierarchy.levelOffsets
      },
      view: {
        frustumPlanes: graph.createDataView(frustumPlanesBuffer, {
          format: 'float32x4',
          length: 6
        }),
        cameraPosition: graph.createDataView(cameraPositionBuffer, {
          format: 'float32x3',
          length: 1
        }),
        pixelProjectionScale: graph.createDataView(pixelProjectionScaleBuffer, {
          format: 'float32',
          length: 1
        }),
        maximumScreenSpaceError: graph.createDataView(maximumScreenSpaceErrorBuffer, {
          format: 'float32',
          length: 1
        })
      },
      output: graph.createDataView(selectedClusterIdsBuffer, {
        format: 'uint32',
        length: this.hierarchy.leafClusterCount
      }),
      count: graph.createDataView(drawCommandBuffer, {
        format: 'uint32',
        length: 1,
        byteOffset: this.drawCommands.getInstanceCountByteOffset(0)
      }),
      overflow: graph.createDataView(overflowBuffer, {format: 'uint32', length: 1})
    });
    selection.addToGraph(graph);

    const frameColor = graph.importFrameTexture({
      id: 'frame-color',
      format: this.device.preferredColorFormat,
      width,
      height,
      usage: Texture.RENDER
    });
    const frameDepth = graph.importFrameTexture({
      id: 'frame-depth',
      format: 'depth24plus',
      width,
      height,
      usage: Texture.RENDER
    });
    graph.addRenderPass({
      id: 'render-selected-canyon-clusters',
      attachments: {
        colorAttachments: [graph.createTextureView(frameColor)],
        depthStencilAttachment: graph.createTextureView(frameDepth)
      },
      resources: [
        {buffer: selectedClusterIdsBuffer, usage: 'storage-read'},
        {buffer: clusterMetadataBuffer, usage: 'storage-read'},
        {buffer: sphereBoundsBuffer, usage: 'storage-read'},
        {buffer: uniformBuffer, usage: 'uniform'},
        {buffer: drawCommandBuffer, usage: 'indirect'}
      ],
      compile: () => ({
        getRenderPassProps: () => ({
          id: 'virtual-geometry-canyon-render-pass',
          clearColor: [0.035, 0.065, 0.12, 1],
          clearDepth: 1,
          clearStencil: false
        }),
        encode: ({renderPass, getBuffer}) => {
          renderPass.setPipeline(this.skyModel.pipeline);
          renderPass.setVertexArray(this.skyModel.vertexArray);
          renderPass.setBindings({uniforms: getBuffer(uniformBuffer)});
          renderPass.draw({vertexCount: 3});

          renderPass.setPipeline(this.terrainModel.pipeline);
          renderPass.setVertexArray(this.terrainModel.vertexArray);
          renderPass.setBindings({
            selectedClusterIds: getBuffer(selectedClusterIdsBuffer),
            clusterMetadata: getBuffer(clusterMetadataBuffer),
            clusterBounds: getBuffer(sphereBoundsBuffer),
            uniforms: getBuffer(uniformBuffer)
          });
          this.drawCommands.draw(renderPass, 0);
        }
      })
    });
    this.graphResources = {
      compiled: graph.compile(),
      selection,
      frameColorId: frameColor.id,
      frameDepthId: frameDepth.id,
      width,
      height
    };
    this.updateInspector();
  }

  private destroyGraph(): void {
    if (!this.graphResources) {
      return;
    }
    this.graphResources.compiled.destroy();
    this.graphResources.selection.destroy();
    this.graphResources = null;
  }

  private writeFrameState(
    sample: CanyonCameraSample,
    width: number,
    height: number,
    timeSeconds: number
  ): void {
    const aspect = width / height;
    const viewMatrix = new Matrix4().lookAt({
      eye: sample.eye,
      center: sample.target,
      up: [0, 1, 0]
    });
    const projectionMatrix = new Matrix4().perspective({
      fovy: CANYON_CAMERA_FIELD_OF_VIEW,
      aspect,
      near: CANYON_CAMERA_NEAR_PLANE,
      far: CANYON_CAMERA_FAR_PLANE
    });
    const viewProjectionMatrix = new Matrix4(projectionMatrix).multiplyRight(viewMatrix);
    const {forward, right, up} = makeCameraBasis(sample.eye, sample.target);
    const projectionScale = getCanyonProjectionScale(height);
    const values = new Float32Array(CANYON_UNIFORM_BYTE_LENGTH / Float32Array.BYTES_PER_ELEMENT);
    values.set(viewProjectionMatrix, 0);
    values.set([...sample.eye, projectionScale], 16);
    values.set([...forward, aspect], 20);
    values.set([...right, Math.tan(CANYON_CAMERA_FIELD_OF_VIEW / 2)], 24);
    values.set([...up, this.maximumScreenSpaceError], 28);
    values.set(
      makeCanyonVisualizationOptions({
        timeSeconds,
        debugLOD: this.debugLOD,
        wireframe: this.wireframe,
        terrainHalfExtent: this.hierarchy.terrainHalfExtent
      }),
      32
    );
    this.buffers.uniforms.write(values);
    this.buffers.frustumPlanes.write(getCanyonFrustumPlanes(sample.eye, sample.target, aspect));
    this.buffers.cameraPosition.write(new Float32Array(sample.eye));
    this.buffers.pixelProjectionScale.write(new Float32Array([projectionScale]));
    this.buffers.maximumScreenSpaceError.write(new Float32Array([this.maximumScreenSpaceError]));
  }

  private makePanel(): Panel {
    return new ColumnPanel({
      id: 'virtual-geometry-canyon-panel',
      title: 'Virtual Geometry Canyon',
      panels: [
        makeHtmlCustomPanel({
          id: 'virtual-geometry-canyon-overview',
          title: '',
          html: `<p style="margin:0;line-height:1.45"><strong>87,376 hierarchy nodes. 42 million potential leaf triangles. One indirect draw.</strong> A WebGPU command graph selects a stable screen-error frontier, writes its instance count into the draw command, and renders shared procedural clusters without CPU geometry traversal or per-frame readback.</p>`
        }),
        makeHtmlCustomPanel({
          id: 'virtual-geometry-canyon-controls',
          title: 'Flight and LOD',
          html: this.getControlsHtml(),
          onRender: root => this.bindPanelControls(root)
        }),
        makeHtmlCustomPanel({
          id: 'virtual-geometry-canyon-inspector',
          title: 'GPU-resident inspector',
          html: `<div data-canyon-status></div><div data-canyon-stats style="margin-top:9px"></div>`,
          onRender: root => {
            this.statusElement = root.querySelector('[data-canyon-status]');
            this.statsElement = root.querySelector('[data-canyon-stats]');
            this.updateInspector();
            return () => {
              this.statusElement = null;
              this.statsElement = null;
            };
          }
        })
      ]
    });
  }

  private getControlsHtml(): string {
    return `<div style="display:grid;gap:9px">
      <label><input type="checkbox" data-cinematic checked> Guided canyon-to-rim flight</label>
      <label>Maximum screen error <input data-screen-error type="range" min="1" max="9" step="0.25" value="${this.maximumScreenSpaceError}"> <strong data-screen-error-value>${this.maximumScreenSpaceError.toFixed(2)} px</strong></label>
      <label><input type="checkbox" data-debug-lod> LOD levels + shared cluster grid</label>
      <label><input type="checkbox" data-wireframe> Triangle wireframe overlay</label>
      <label><input type="checkbox" data-wind-audio checked> Procedural desert wind</label>
      <small data-wind-status aria-live="polite"></small>
      <div style="display:flex;gap:7px"><button type="button" data-pause>Pause</button><button type="button" data-reset>Reset flight</button></div>
      <small>Drag to look without leaving the authored flight path; use the wheel or W/S to move along it. Arrow keys look around. C returns to the cinematic, L toggles LOD colors, F toggles triangle wireframe, Space pauses, and R resets.</small>
    </div>`;
  }

  private bindPanelControls(root: HTMLElement): () => void {
    const cinematic = root.querySelector('[data-cinematic]') as HTMLInputElement;
    const screenError = root.querySelector('[data-screen-error]') as HTMLInputElement;
    const screenErrorValue = root.querySelector('[data-screen-error-value]') as HTMLElement;
    const debugLOD = root.querySelector('[data-debug-lod]') as HTMLInputElement;
    const wireframe = root.querySelector('[data-wireframe]') as HTMLInputElement;
    const windAudio = root.querySelector('[data-wind-audio]') as HTMLInputElement;
    const windStatus = root.querySelector('[data-wind-status]') as HTMLElement;
    const pause = root.querySelector('[data-pause]') as HTMLButtonElement;
    const reset = root.querySelector('[data-reset]') as HTMLButtonElement;
    this.windStatusElement = windStatus;
    this.debugLODInputElement = debugLOD;
    this.wireframeInputElement = wireframe;
    debugLOD.checked = this.debugLOD;
    wireframe.checked = this.wireframe;
    windAudio.checked = this.windAudio.enabled;
    this.updateWindStatus();
    const onCinematic = (): void => {
      if (cinematic.checked) {
        this.manualMode = false;
        this.routeTimeSeconds = this.manualProgress * this.route.duration;
      } else {
        this.enterManualMode();
      }
      this.updateInspector();
    };
    const onScreenError = (): void => {
      this.maximumScreenSpaceError = Number(screenError.value);
      screenErrorValue.textContent = `${this.maximumScreenSpaceError.toFixed(2)} px`;
      this.updateInspector();
    };
    const onDebugLOD = (): void => {
      this.debugLOD = debugLOD.checked;
      this.updateInspector();
    };
    const onWireframe = (): void => {
      this.wireframe = wireframe.checked;
      this.updateInspector();
    };
    const onWindAudio = (): void => {
      this.windAudio.setEnabled(windAudio.checked);
      if (windAudio.checked) {
        this.activateWindAudio();
      }
      this.updateWindStatus();
    };
    const onPause = (): void => {
      this.paused = !this.paused;
      pause.textContent = this.paused ? 'Resume' : 'Pause';
      this.updateInspector();
    };
    const onReset = (): void => {
      this.resetFlight();
      cinematic.checked = true;
      debugLOD.checked = false;
      wireframe.checked = false;
      pause.textContent = 'Pause';
    };
    cinematic.addEventListener('change', onCinematic);
    screenError.addEventListener('input', onScreenError);
    debugLOD.addEventListener('change', onDebugLOD);
    wireframe.addEventListener('change', onWireframe);
    windAudio.addEventListener('change', onWindAudio);
    pause.addEventListener('click', onPause);
    reset.addEventListener('click', onReset);
    return () => {
      cinematic.removeEventListener('change', onCinematic);
      screenError.removeEventListener('input', onScreenError);
      debugLOD.removeEventListener('change', onDebugLOD);
      wireframe.removeEventListener('change', onWireframe);
      windAudio.removeEventListener('change', onWindAudio);
      pause.removeEventListener('click', onPause);
      reset.removeEventListener('click', onReset);
      this.windStatusElement = null;
      this.debugLODInputElement = null;
      this.wireframeInputElement = null;
    };
  }

  private updateInspector(): void {
    if (this.statusElement) {
      this.statusElement.innerHTML = `<strong>${this.manualMode ? 'Constrained manual track' : this.paused ? 'Cinematic paused' : 'Guided cinematic'}</strong><br><span style="opacity:.76">${escapeHtml(this.currentSample.shot)} · ${(this.currentSample.progress * 100).toFixed(0)}% route</span>`;
    }
    if (!this.statsElement) {
      return;
    }
    const graphStats = this.graphResources?.compiled.stats;
    this.statsElement.innerHTML = `<div style="display:grid;grid-template-columns:1fr auto;gap:4px 12px;font:11px/1.45 ui-monospace,monospace">
      <span>Potential leaf triangles</span><strong>${formatCount(this.hierarchy.potentialTriangleCount)}</strong>
      <span>Hierarchy nodes</span><strong>${formatCount(this.hierarchy.nodeCount)}</strong>
      <span>Leaf / selected-ID capacity</span><strong>${formatCount(this.hierarchy.leafClusterCount)}</strong>
      <span>Shared cluster mesh</span><strong>${formatCount(this.hierarchy.clusterTriangleCount)} triangles</strong>
      <span>Selected frontier</span><strong>GPU resident · no readback</strong>
      <span>Submission</span><strong>1 indexed indirect draw</strong>
      <span>Maximum screen error</span><strong>${this.maximumScreenSpaceError.toFixed(2)} px</strong>
      <span>LOD visualization</span><strong>${this.debugLOD ? 'levels + grid' : 'cinematic material'}</strong>
      <span>Triangle topology</span><strong>${this.wireframe ? 'wireframe + cluster borders' : 'shaded surface'}</strong>
      <span>Frame rate</span><strong>${this.framesPerSecond.toFixed(1)} FPS</strong>
      <span>CPU / GPU frame</span><strong>${this.cpuFrameTimeMilliseconds.toFixed(2)} / ${formatGpuTime(this.device, this.gpuFrameTimeMilliseconds)}</strong>
      <span>Graph CPU encode</span><strong>${this.graphEncodeTimeMilliseconds.toFixed(2)} ms</strong>
      <span>Graph passes</span><strong>${graphStats?.nodeOrder.length ?? 0}</strong>
      <span>Physical / logical scratch</span><strong>${formatBytes(graphStats?.physicalTransientBytes ?? 0)} / ${formatBytes(graphStats?.logicalTransientBytes ?? 0)}</strong>
    </div>`;
  }

  private enterManualMode(): void {
    if (!this.manualMode) {
      this.manualProgress = wrap(this.routeTimeSeconds, this.route.duration) / this.route.duration;
      this.manualMode = true;
    }
  }

  private activateWindAudio(): void {
    void this.windAudio.activate().then(
      () => this.updateWindStatus(),
      () => this.updateWindStatus()
    );
  }

  private updateWindStatus(): void {
    const windStatus = this.windAudio.status;
    if (this.windActivationButton) {
      this.windActivationButton.hidden = windStatus !== 'waiting';
    }
    if (!this.windStatusElement) {
      return;
    }
    const statusLabels = {
      waiting: 'Wind: click or press a key to enable.',
      ready: 'Wind: low desert bed · sparse whistles.',
      muted: 'Wind: muted.',
      unavailable: 'Wind: Web Audio is unavailable in this browser.'
    } as const;
    this.windStatusElement.textContent = statusLabels[windStatus];
  }

  private mountWindActivationButton(): void {
    if (this.windActivationButton || typeof document === 'undefined') {
      return;
    }
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Enable desert wind';
    button.setAttribute('aria-label', 'Enable procedural desert wind audio');
    button.style.cssText =
      'position:fixed;left:50%;bottom:24px;z-index:2147483647;transform:translateX(-50%);padding:10px 16px;border:1px solid rgba(255,196,116,.72);border-radius:999px;background:rgba(31,17,8,.88);color:#fff1d2;font:600 13px/1.2 system-ui,sans-serif;letter-spacing:.02em;box-shadow:0 0 24px rgba(226,126,55,.3);cursor:pointer;backdrop-filter:blur(8px)';
    button.addEventListener('click', this.handleWindActivationButton);
    document.body.appendChild(button);
    this.windActivationButton = button;
    this.updateWindStatus();
  }

  private unmountWindActivationButton(): void {
    this.windActivationButton?.removeEventListener('click', this.handleWindActivationButton);
    this.windActivationButton?.remove();
    this.windActivationButton = null;
  }

  private resetFlight(): void {
    this.routeTimeSeconds = 0;
    this.manualProgress = 0;
    this.manualYawOffset = 0;
    this.manualPitchOffset = 0;
    this.manualMode = false;
    this.paused = false;
    this.debugLOD = false;
    this.wireframe = false;
    if (this.debugLODInputElement) {
      this.debugLODInputElement.checked = false;
    }
    if (this.wireframeInputElement) {
      this.wireframeInputElement.checked = false;
    }
    this.updateInspector();
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (event.button !== 0 || !this.canvas) {
      return;
    }
    this.activateWindAudio();
    this.enterManualMode();
    this.dragging = true;
    this.lastPointer = [event.clientX, event.clientY];
    this.canvas.style.cursor = 'grabbing';
    this.canvas.setPointerCapture(event.pointerId);
    this.updateInspector();
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (!this.dragging) {
      return;
    }
    const deltaX = event.clientX - this.lastPointer[0];
    const deltaY = event.clientY - this.lastPointer[1];
    this.lastPointer = [event.clientX, event.clientY];
    this.manualYawOffset = clamp(this.manualYawOffset - deltaX * 0.0045, -0.82, 0.82);
    this.manualPitchOffset = clamp(this.manualPitchOffset + deltaY * 0.0036, -0.4, 0.4);
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    if (!this.dragging) {
      return;
    }
    this.dragging = false;
    if (this.canvas) {
      this.canvas.style.cursor = 'grab';
      if (this.canvas.hasPointerCapture(event.pointerId)) {
        this.canvas.releasePointerCapture(event.pointerId);
      }
    }
  };

  private readonly handleWheel = (event: WheelEvent): void => {
    event.preventDefault();
    this.enterManualMode();
    this.manualProgress = clamp(this.manualProgress + event.deltaY * 0.00016, 0, 0.999_999);
    this.updateInspector();
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    const target = event.target;
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.altKey ||
      event.shiftKey ||
      target instanceof HTMLInputElement ||
      target instanceof HTMLSelectElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLButtonElement ||
      target instanceof HTMLAnchorElement ||
      (target instanceof HTMLElement && target.isContentEditable)
    ) {
      return;
    }
    this.activateWindAudio();
    const key = event.key.toLowerCase();
    if (key === 'c') {
      this.manualMode = false;
      this.routeTimeSeconds = this.manualProgress * this.route.duration;
    } else if (key === 'l') {
      this.debugLOD = !this.debugLOD;
      if (this.debugLODInputElement) {
        this.debugLODInputElement.checked = this.debugLOD;
      }
    } else if (key === 'f') {
      this.wireframe = !this.wireframe;
      if (this.wireframeInputElement) {
        this.wireframeInputElement.checked = this.wireframe;
      }
    } else if (key === 'r') {
      this.resetFlight();
    } else if (key === ' ') {
      event.preventDefault();
      this.paused = !this.paused;
    } else if (key === 'w' || key === 's') {
      this.enterManualMode();
      this.manualProgress = clamp(
        this.manualProgress + (key === 'w' ? MANUAL_PROGRESS_STEP : -MANUAL_PROGRESS_STEP),
        0,
        0.999_999
      );
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      this.enterManualMode();
      this.manualYawOffset = clamp(
        this.manualYawOffset + (event.key === 'ArrowLeft' ? 0.055 : -0.055),
        -0.82,
        0.82
      );
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      this.enterManualMode();
      this.manualPitchOffset = clamp(
        this.manualPitchOffset + (event.key === 'ArrowUp' ? -0.045 : 0.045),
        -0.4,
        0.4
      );
    }
    this.updateInspector();
  };

  private readonly handleVisibilityChange = (): void => {
    this.windAudio.setPageVisible(!document.hidden);
    this.updateWindStatus();
  };

  private readonly handleWindActivationButton = (): void => {
    this.activateWindAudio();
  };
}

function makeCameraBasis(
  eye: CanyonVector3,
  target: CanyonVector3
): {forward: CanyonVector3; right: CanyonVector3; up: CanyonVector3} {
  const forward = normalize([target[0] - eye[0], target[1] - eye[1], target[2] - eye[2]]);
  const right = normalize([-forward[2], 0, forward[0]]);
  const up = normalize([
    right[1] * forward[2] - right[2] * forward[1],
    right[2] * forward[0] - right[0] * forward[2],
    right[0] * forward[1] - right[1] * forward[0]
  ]);
  return {forward, right, up};
}

function normalize(vector: CanyonVector3): CanyonVector3 {
  const length = Math.hypot(vector[0], vector[1], vector[2]);
  if (length < 1e-9) {
    throw new Error('Virtual Geometry Canyon camera vectors must have nonzero length');
  }
  return [vector[0] / length, vector[1] / length, vector[2] / length];
}

function formatCount(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatBytes(value: number): string {
  if (value >= 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)} MiB`;
  if (value >= 1024) return `${(value / 1024).toFixed(1)} KiB`;
  return `${value} B`;
}

function formatGpuTime(device: Device, value: number): string {
  return device.features.has('timestamp-query') ? `${value.toFixed(2)} ms` : 'timing unavailable';
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, character => {
    const replacements: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return replacements[character];
  });
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function wrap(value: number, range: number): number {
  return ((value % range) + range) % range;
}
