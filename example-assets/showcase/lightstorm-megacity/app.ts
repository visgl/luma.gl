// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device, type RenderBundle, type TextureFormatColor} from '@luma.gl/core';
import {
  createBloomShaderPassPipeline,
  createSSRShaderPassPipeline,
  toneMapping
} from '@luma.gl/effects';
import type {AnimationProps} from '@luma.gl/engine';
import {
  AnimationLoopTemplate,
  Computation,
  CubeGeometry,
  Model,
  OrbitControls,
  ShaderPassRenderer
} from '@luma.gl/engine';
import {
  decodeGPUIndexPickInfo,
  DrawCommandBuffer,
  GPUCommandGraph,
  GPUIndexPickingTarget,
  GPUVisibilityWorkflow,
  INDEX_PICKING_READBACK_BYTE_LENGTH,
  type CompiledGPUCommandGraph
} from '@luma.gl/gpgpu/gpu-core';
import {ClusteredLightGrid, GBuffer, makeDeferredPointLightBufferData} from '@luma.gl/experimental';
import {Matrix4, type NumberArray3} from '@math.gl/core';
import {ColumnPanel, type Panel} from '@deck.gl-community/panels';
import {
  ExamplePanelManager,
  makeExamplePanelHostHtml,
  makeHtmlCustomPanel
} from '../../example-panels';
import {
  getLightstormGuidedCameraSample,
  LIGHTSTORM_CAMERA_FIELD_OF_VIEW,
  makeLightstormGuidedCameraTour,
  type LightstormCameraSample,
  type LightstormGuidedCameraTour
} from './lightstorm-camera';
import {makeLightstormCity, type LightstormCityMetadata} from './lightstorm-data';
import {
  LIGHTSTORM_POINT_LIGHT_COUNT,
  makeLightstormLightMarkerBufferData,
  makeLightstormPointLights,
  makeLightstormViewPointLights,
  type LightstormPointLight
} from './lightstorm-lighting';
import {
  LIGHTSTORM_LIGHTNING_SEGMENT_COUNT,
  LIGHTSTORM_LIGHTNING_SEGMENT_WORD_COUNT,
  getLightstormLightningSkyPulse,
  makeLightstormLightningBolts,
  makeLightstormLightningBufferData,
  makeLightstormLightningSegments
} from './lightstorm-lightning';
import {LightstormThunderController} from './lightstorm-thunder';
import {
  createLightstormDeferredLightingShaderPassPipeline,
  getLightstormVisibilityShader,
  LIGHTSTORM_LIGHTNING_SHADER,
  LIGHTSTORM_LIGHT_MARKER_SHADER,
  LIGHTSTORM_PICKING_SHADER,
  LIGHTSTORM_RENDER_SHADER
} from './lightstorm-shaders';

export const title = 'Lightstorm Megacity';
export const description =
  'A million-record city culled, compacted, clustered, lit, and indirectly rendered on WebGPU.';

const CAPACITY_OPTIONS = [50_000, 250_000, 1_000_000] as const;
const DEFAULT_CAPACITY = 250_000;
const UINT32_BYTE_LENGTH = Uint32Array.BYTES_PER_ELEMENT;
const UNIFORM_BYTE_LENGTH = 240;
const NEAR_PLANE = 0.1;
const TRIANGLES_PER_INSTANCE = 12;
const DEFAULT_CAMERA_TARGET: [number, number, number] = [0, 20, 0];
const DEFAULT_CAMERA_YAW = 0.64;
const DEFAULT_CAMERA_PITCH = 0.28;
const DEFAULT_CAMERA_DISTANCE = 300;

type LightstormDataLayer = 'all' | 'towers' | 'transit';

type LightstormGraphResources = {
  compiled: CompiledGPUCommandGraph<LightstormGraphParameters>;
  pickingCompiled: CompiledGPUCommandGraph<LightstormPickingGraphParameters>;
  pickingReadbackIdentifier: string;
  pickingWidth: number;
  pickingHeight: number;
  drawCommands: DrawCommandBuffer;
  instances: Buffer;
  lightMarkers: Buffer;
  visibleIdentifiers: Buffer;
  sceneGBuffer: GBuffer;
  perspectiveRenderBundle: RenderBundle;
  overviewRenderBundle: RenderBundle;
};

type LightstormSceneColorFormat = 'rgba8unorm' | 'rgba16float';

type Viewport = [number, number, number, number];

type LightstormGraphParameters = {
  perspectiveViewport: Viewport;
  overviewViewport?: Viewport;
};

type LightstormPickingGraphParameters = {
  perspectiveViewport: Viewport;
  pixel: readonly [number, number];
};

type LightstormCameraState = {
  viewMatrix: Matrix4;
  projectionMatrix: Matrix4;
  inverseProjectionMatrix: Matrix4;
  viewProjectionMatrix: Matrix4;
  farPlane: number;
  lightningSkyPulse: number;
};

export default class LightstormMegacityAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeExamplePanelHostHtml();
  static props = {createFramebuffer: true, debug: true};

  readonly device: Device;
  readonly model: Model;
  readonly lightMarkerModel: Model;
  readonly lightningModel: Model;
  readonly pickingModel: Model;
  readonly sceneColorFormat: LightstormSceneColorFormat;
  readonly deferredLightingRenderer: ShaderPassRenderer;
  readonly postprocessingRenderer: ShaderPassRenderer;
  readonly pointLightBuffer: Buffer;
  readonly lightningBuffer: Buffer;
  readonly clusteredLightGrid: ClusteredLightGrid;
  readonly uniformBuffer: Buffer;
  readonly overviewUniformBuffer: Buffer;
  readonly panels: ExamplePanelManager;

  private resources: LightstormGraphResources | null = null;
  private readonly thunderAudio = new LightstormThunderController();
  private cityMetadata: LightstormCityMetadata = {
    gridSize: 1,
    fieldHalfExtent: 1,
    towerCount: 0,
    transitCount: 0
  };
  private capacity = DEFAULT_CAPACITY;
  private dataLayer: LightstormDataLayer = 'all';
  private guidedCamera = true;
  private guidedCameraStartMilliseconds: number | null = null;
  private currentTimeMilliseconds = 0;
  private guidedCameraTour!: LightstormGuidedCameraTour;
  private currentCameraPose: LightstormCameraSample = {
    eye: [0, 40, 120],
    target: [0, 20, 0],
    yaw: Math.PI,
    pitch: 0.16,
    distance: 121.66,
    duration: 0,
    shot: 'avenue establish'
  };
  private previousViewProjectionMatrix: Matrix4 | null = null;
  private pointLights: readonly LightstormPointLight[] = [];
  private activeClusteredLightCount = 0;
  private lightstormEnabled = true;
  private cullingEnabled = true;
  private comparisonView = false;
  private pointerDirty = false;
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
  private orbitControls: OrbitControls | null = null;

  private capacityElement: HTMLElement | null = null;
  private statsElement: HTMLElement | null = null;
  private nodesElement: HTMLElement | null = null;
  private guidedCameraElement: HTMLInputElement | null = null;
  private thunderStatusElement: HTMLElement | null = null;
  private thunderActivationButton: HTMLButtonElement | null = null;

  constructor({
    device,
    lightstormCapacity = DEFAULT_CAPACITY
  }: AnimationProps & {lightstormCapacity?: number}) {
    super();
    if (device.type !== 'webgpu') {
      throw new Error('Lightstorm Megacity requires WebGPU');
    }
    this.device = device;
    this.sceneColorFormat = getSceneColorFormat(device);
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
      colorAttachmentFormats: getSceneGBufferColorFormats(this.sceneColorFormat),
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
    this.lightMarkerModel = new Model(device, {
      id: 'lightstorm-megacity-light-marker-model',
      source: LIGHTSTORM_LIGHT_MARKER_SHADER,
      geometry: new CubeGeometry({id: 'lightstorm-megacity-light-marker-cube', indices: true}),
      instanceCount: LIGHTSTORM_POINT_LIGHT_COUNT * 2,
      colorAttachmentFormats: getSceneGBufferColorFormats(this.sceneColorFormat),
      depthStencilAttachmentFormat: 'depth24plus',
      shaderLayout: {
        attributes: [
          {name: 'positions', location: 0, type: 'vec3<f32>'},
          {name: 'normals', location: 1, type: 'vec3<f32>'}
        ],
        bindings: [
          {name: 'lightMarkers', type: 'read-only-storage', group: 0, location: 0},
          {name: 'uniforms', type: 'uniform', group: 0, location: 1}
        ]
      },
      parameters: {
        cullMode: 'back',
        depthCompare: 'less-equal',
        depthWriteEnabled: true
      }
    });
    this.lightningBuffer = device.createBuffer({
      id: 'lightstorm-megacity-lightning-segments',
      byteLength:
        LIGHTSTORM_LIGHTNING_SEGMENT_COUNT *
        LIGHTSTORM_LIGHTNING_SEGMENT_WORD_COUNT *
        Float32Array.BYTES_PER_ELEMENT,
      usage: Buffer.STORAGE | Buffer.COPY_DST
    });
    this.lightningModel = new Model(device, {
      id: 'lightstorm-megacity-lightning-model',
      source: LIGHTSTORM_LIGHTNING_SHADER,
      geometry: new CubeGeometry({id: 'lightstorm-megacity-lightning-cube', indices: true}),
      instanceCount: LIGHTSTORM_LIGHTNING_SEGMENT_COUNT,
      colorAttachmentFormats: getSceneGBufferColorFormats(this.sceneColorFormat),
      depthStencilAttachmentFormat: 'depth24plus',
      shaderLayout: {
        attributes: [
          {name: 'positions', location: 0, type: 'vec3<f32>'},
          {name: 'normals', location: 1, type: 'vec3<f32>'}
        ],
        bindings: [
          {name: 'lightningSegments', type: 'read-only-storage', group: 0, location: 0},
          {name: 'uniforms', type: 'uniform', group: 0, location: 1}
        ]
      },
      parameters: {
        cullMode: 'none',
        depthCompare: 'less-equal',
        depthWriteEnabled: false
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
    this.pointLightBuffer = device.createBuffer({
      id: 'lightstorm-megacity-point-lights',
      data: makeDeferredPointLightBufferData([], LIGHTSTORM_POINT_LIGHT_COUNT),
      usage: Buffer.STORAGE | Buffer.COPY_DST
    });
    this.clusteredLightGrid = new ClusteredLightGrid(device, {
      id: 'lightstorm-megacity-clustered-lights',
      maxLightCount: LIGHTSTORM_POINT_LIGHT_COUNT
    });
    this.deferredLightingRenderer = new ShaderPassRenderer(device, {
      shaderPasses: [
        createLightstormDeferredLightingShaderPassPipeline(this.sceneColorFormat),
        ...(this.sceneColorFormat === 'rgba16float'
          ? [createSSRShaderPassPipeline({resolutionScale: 0.5})]
          : [])
      ],
      colorFormat: this.sceneColorFormat
    });
    this.postprocessingRenderer = new ShaderPassRenderer(device, {
      shaderPasses: [
        createBloomShaderPassPipeline({colorFormat: this.sceneColorFormat}),
        toneMapping
      ],
      colorFormat: this.sceneColorFormat
    });
    this.panels = new ExamplePanelManager({panel: this.makePanel()});
    this.rebuild(lightstormCapacity);
    this.panels.mount();
  }

  override async onInitialize({canvas}: AnimationProps): Promise<void> {
    if (canvas instanceof HTMLCanvasElement) {
      this.canvas = canvas;
      canvas.addEventListener('pointerdown', this.handleThunderPointerDown, {capture: true});
      this.orbitControls = new OrbitControls(canvas, {
        target: DEFAULT_CAMERA_TARGET,
        yaw: DEFAULT_CAMERA_YAW,
        pitch: DEFAULT_CAMERA_PITCH,
        distance: DEFAULT_CAMERA_DISTANCE,
        minDistance: 12,
        maxDistance: Math.max(500, this.cityMetadata.fieldHalfExtent * 2.2),
        minPitch: -1.2,
        maxPitch: 1.35,
        pitchSpeed: -0.006,
        enablePan: true,
        panSpeed: 0.0018,
        onInteractionStart: () => this.switchToExplore()
      });
      canvas.addEventListener('pointermove', this.handlePointerMove);
    }
    window.addEventListener('keydown', this.handleThunderActivation, {capture: true});
    this.mountThunderActivationButton();
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
    this.orbitControls?.update(time);
    const deviceSize = device.getDefaultCanvasContext().getDevicePixelSize();
    if (resources.pickingWidth !== deviceSize[0] || resources.pickingHeight !== deviceSize[1]) {
      this.rebuild(this.capacity);
      resources = this.resources;
      if (!resources) {
        return;
      }
    }
    const viewports = getViewports(width, height, this.comparisonView);
    const cameraState = this.writeUniforms(viewports, time);
    const encodeStart = performance.now();
    if (!this.comparisonView) {
      const viewPointLights = makeLightstormViewPointLights(
        this.pointLights,
        cameraState.viewMatrix,
        time / 1000,
        this.lightstormEnabled
      );
      this.pointLightBuffer.write(
        makeDeferredPointLightBufferData(viewPointLights, LIGHTSTORM_POINT_LIGHT_COUNT)
      );
      this.clusteredLightGrid.encode(device.commandEncoder, {
        pointLights: this.pointLightBuffer,
        pointLightCount: viewPointLights.length,
        projectionMatrix: cameraState.projectionMatrix,
        nearPlane: NEAR_PLANE,
        farPlane: cameraState.farPlane
      });
      this.activeClusteredLightCount = viewPointLights.length;
    } else {
      this.activeClusteredLightCount = 0;
    }
    resources.compiled.encode(device.commandEncoder, {parameters: viewports});
    let postprocessingSource = resources.sceneGBuffer.colorTexture;
    if (!this.comparisonView) {
      const directionalLightDirectionView = normalizeVector3(
        cameraState.viewMatrix.transformAsVector([0.36, 0.82, 0.44]) as NumberArray3
      );
      const litTexture = this.deferredLightingRenderer.encodeToTexture(device.commandEncoder, {
        sourceTexture: resources.sceneGBuffer.colorTexture,
        bindings: {
          depthTexture: resources.sceneGBuffer.depthTexture,
          normalTexture: resources.sceneGBuffer.normalRoughnessTexture,
          velocityTexture: resources.sceneGBuffer.velocityTexture,
          baseColorMetallicTexture:
            resources.sceneGBuffer.getExtraColorTexture('baseColorMetallic'),
          emissiveOcclusionTexture:
            resources.sceneGBuffer.getExtraColorTexture('emissiveOcclusion'),
          pointLights: this.pointLightBuffer,
          ...this.clusteredLightGrid.getShaderPassBindings()
        },
        uniforms: {
          clusteredDeferredLighting: {
            inverseProjectionMatrix: cameraState.inverseProjectionMatrix,
            ambientColor: getLightstormAmbientColor(cameraState.lightningSkyPulse),
            directionalLightDirectionView,
            directionalLightColor: [1, 0.84, 0.68],
            directionalLightIntensity: 2.25,
            ...this.clusteredLightGrid.getShaderPassUniforms(NEAR_PLANE, cameraState.farPlane)
          },
          lightstormDeferredComposite: {
            inverseProjectionMatrix: cameraState.inverseProjectionMatrix,
            fogColor: getLightstormFogColor(cameraState.lightningSkyPulse)
          },
          ssrTrace: {
            projectionMatrix: cameraState.projectionMatrix,
            inverseProjectionMatrix: cameraState.inverseProjectionMatrix,
            intensity: 1.5,
            maxDistance: 36,
            thickness: 0.75,
            sampleCount: 72,
            maxRoughness: 0.6,
            frameIndex: this.frameIndex
          },
          ssrTemporal: {
            inverseProjectionMatrix: cameraState.inverseProjectionMatrix,
            historyWeight: 0.82
          },
          ssrSpatial: {
            inverseProjectionMatrix: cameraState.inverseProjectionMatrix,
            maxRadius: 4.5,
            depthSigma: 0.04
          },
          ssrComposite: {
            inverseProjectionMatrix: cameraState.inverseProjectionMatrix,
            strength: 0.8,
            depthSigma: 0.04
          }
        }
      });
      if (litTexture) {
        postprocessingSource = litTexture;
      }
    }
    this.postprocessingRenderer.encodeToScreen(device.commandEncoder, {
      sourceTexture: postprocessingSource,
      uniforms: {
        bloomExtract: {
          threshold: this.sceneColorFormat === 'rgba16float' ? 0.8 : 0.55
        },
        bloomBlur: {radius: 6},
        bloomComposite: {intensity: 0.55},
        toneMapping: {
          exposure: this.sceneColorFormat === 'rgba16float' ? 0.92 : 1,
          maximumLuminance: device.preferredColorFormat === 'rgba16float' ? 1.8 : 1
        }
      }
    });
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
      this.canvas.removeEventListener('pointerdown', this.handleThunderPointerDown, {
        capture: true
      });
      this.canvas.removeEventListener('pointermove', this.handlePointerMove);
    }
    this.orbitControls?.destroy();
    window.removeEventListener('keydown', this.handleThunderActivation, {capture: true});
    this.unmountThunderActivationButton();
    this.panels.finalize();
    this.thunderAudio.destroy();
    this.destroyResources();
    this.deferredLightingRenderer.destroy();
    this.postprocessingRenderer.destroy();
    this.clusteredLightGrid.destroy();
    this.pointLightBuffer.destroy();
    this.pickingModel.destroy();
    this.lightningModel.destroy();
    this.lightningBuffer.destroy();
    this.lightMarkerModel.destroy();
    this.model.destroy();
    this.uniformBuffer.destroy();
    this.overviewUniformBuffer.destroy();
  }

  private rebuild(capacity: number): void {
    const compileStart = performance.now();
    this.destroyResources();
    this.capacity = capacity;
    const city = makeLightstormCity(capacity);
    this.guidedCameraTour = makeLightstormGuidedCameraTour(city);
    this.cityMetadata = {
      gridSize: city.gridSize,
      fieldHalfExtent: city.fieldHalfExtent,
      towerCount: city.towerCount,
      transitCount: city.transitCount
    };
    this.orbitControls?.setProps({
      maxDistance: Math.max(500, this.cityMetadata.fieldHalfExtent * 2.2)
    });
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
    const deviceSize = this.device.getDefaultCanvasContext().getDevicePixelSize();
    const pickingWidth = Math.max(1, deviceSize[0]);
    const pickingHeight = Math.max(1, deviceSize[1]);
    const lightningBolts = makeLightstormLightningBolts(
      this.guidedCameraTour,
      pickingWidth / pickingHeight
    );
    this.lightningBuffer.write(
      makeLightstormLightningBufferData(makeLightstormLightningSegments(lightningBolts))
    );
    const sceneGBuffer = createSceneGBuffer(
      this.device,
      pickingWidth,
      pickingHeight,
      this.sceneColorFormat
    );
    this.deferredLightingRenderer.resize([pickingWidth, pickingHeight]);
    this.deferredLightingRenderer.resetHistory();
    this.postprocessingRenderer.resize([pickingWidth, pickingHeight]);
    this.pointLights = makeLightstormPointLights(
      LIGHTSTORM_POINT_LIGHT_COUNT,
      this.cityMetadata.gridSize
    );
    const lightMarkers = this.device.createBuffer({
      id: 'lightstorm-megacity-light-markers',
      data: makeLightstormLightMarkerBufferData(this.pointLights),
      usage: Buffer.STORAGE
    });
    this.lightMarkerModel.setInstanceCount(this.pointLights.length * 2);
    this.previousViewProjectionMatrix = null;
    this.activeClusteredLightCount = 0;
    const perspectiveRenderBundle = this.createRenderBundle(
      'lightstorm-megacity-perspective-render-bundle',
      instances,
      visibleIdentifiers,
      lightMarkers,
      this.lightningBuffer,
      drawCommands,
      this.uniformBuffer
    );
    const overviewRenderBundle = this.createRenderBundle(
      'lightstorm-megacity-overview-render-bundle',
      instances,
      visibleIdentifiers,
      lightMarkers,
      this.lightningBuffer,
      drawCommands,
      this.overviewUniformBuffer
    );
    const compiled = this.createGraph(
      capacity,
      instances,
      visibleIdentifiers,
      lightMarkers,
      this.lightningBuffer,
      drawCommands,
      perspectiveRenderBundle,
      overviewRenderBundle,
      sceneGBuffer
    );
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
      lightMarkers,
      visibleIdentifiers,
      sceneGBuffer,
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
    lightMarkersBuffer: Buffer,
    lightningBuffer: Buffer,
    drawCommands: DrawCommandBuffer,
    perspectiveRenderBundle: RenderBundle,
    overviewRenderBundle: RenderBundle,
    sceneGBuffer: GBuffer
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
    const lightMarkers = graph.importBuffer(
      {
        id: 'light-markers',
        byteLength: lightMarkersBuffer.byteLength,
        usage: lightMarkersBuffer.usage
      },
      lightMarkersBuffer
    );
    const lightningSegments = graph.importBuffer(
      {
        id: 'lightning-segments',
        byteLength: lightningBuffer.byteLength,
        usage: lightningBuffer.usage
      },
      lightningBuffer
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
    const sceneColorTexture = sceneGBuffer.colorTexture;
    const sceneColor = graph.importTexture(
      {
        id: 'scene-color',
        format: sceneColorTexture.format,
        width: sceneColorTexture.width,
        height: sceneColorTexture.height,
        usage: sceneColorTexture.props.usage
      },
      sceneColorTexture
    );
    const sceneNormalTexture = sceneGBuffer.normalRoughnessTexture;
    const sceneNormal = graph.importTexture(
      {
        id: 'scene-normal-roughness',
        format: sceneNormalTexture.format,
        width: sceneNormalTexture.width,
        height: sceneNormalTexture.height,
        usage: sceneNormalTexture.props.usage
      },
      sceneNormalTexture
    );
    const sceneVelocityTexture = sceneGBuffer.velocityTexture;
    const sceneVelocity = graph.importTexture(
      {
        id: 'scene-velocity',
        format: sceneVelocityTexture.format,
        width: sceneVelocityTexture.width,
        height: sceneVelocityTexture.height,
        usage: sceneVelocityTexture.props.usage
      },
      sceneVelocityTexture
    );
    const baseColorMetallicTexture = sceneGBuffer.getExtraColorTexture('baseColorMetallic');
    const baseColorMetallic = graph.importTexture(
      {
        id: 'scene-base-color-metallic',
        format: baseColorMetallicTexture.format,
        width: baseColorMetallicTexture.width,
        height: baseColorMetallicTexture.height,
        usage: baseColorMetallicTexture.props.usage
      },
      baseColorMetallicTexture
    );
    const emissiveOcclusionTexture = sceneGBuffer.getExtraColorTexture('emissiveOcclusion');
    const emissiveOcclusion = graph.importTexture(
      {
        id: 'scene-emissive-occlusion',
        format: emissiveOcclusionTexture.format,
        width: emissiveOcclusionTexture.width,
        height: emissiveOcclusionTexture.height,
        usage: emissiveOcclusionTexture.props.usage
      },
      emissiveOcclusionTexture
    );
    const sceneDepthTexture = sceneGBuffer.depthTexture;
    const sceneDepth = graph.importTexture(
      {
        id: 'scene-depth',
        format: sceneDepthTexture.format,
        width: sceneDepthTexture.width,
        height: sceneDepthTexture.height,
        usage: sceneDepthTexture.props.usage
      },
      sceneDepthTexture
    );
    const sceneColorView = graph.createTextureView(sceneColor);
    const sceneNormalView = graph.createTextureView(sceneNormal);
    const sceneVelocityView = graph.createTextureView(sceneVelocity);
    const baseColorMetallicView = graph.createTextureView(baseColorMetallic);
    const emissiveOcclusionView = graph.createTextureView(emissiveOcclusion);
    const sceneDepthView = graph.createTextureView(sceneDepth);
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
      attachments: {
        colorAttachments: [
          sceneColorView,
          sceneNormalView,
          sceneVelocityView,
          baseColorMetallicView,
          emissiveOcclusionView
        ],
        depthStencilAttachment: sceneDepthView
      },
      resources: [
        {buffer: instances, usage: 'storage-read'},
        {buffer: visibleIdentifiers, usage: 'storage-read'},
        {buffer: lightMarkers, usage: 'storage-read'},
        {buffer: lightningSegments, usage: 'storage-read'},
        {buffer: uniforms, usage: 'uniform'},
        {buffer: overviewUniforms, usage: 'uniform'},
        {buffer: drawCommandBuffer, usage: 'indirect'}
      ],
      compile: () => ({
        getRenderPassProps: () => ({
          id: 'lightstorm-megacity-render-pass',
          clearColors: [
            new Float32Array([0.0015, 0.003, 0.012, 1]),
            new Float32Array([0.5, 0.5, 1, 1]),
            new Float32Array([0, 0, 0, 0]),
            new Float32Array([0, 0, 0, 0]),
            new Uint32Array([0, 0, 0, 0])
          ],
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
    lightMarkers: Buffer,
    lightningSegments: Buffer,
    drawCommands: DrawCommandBuffer,
    uniforms: Buffer
  ): RenderBundle {
    const encoder = this.device.createRenderBundleEncoder({
      id: identifier,
      colorAttachmentFormats: getSceneGBufferColorFormats(this.sceneColorFormat),
      depthStencilAttachmentFormat: 'depth24plus'
    });
    encoder.setPipeline(this.model.pipeline);
    encoder.setVertexArray(this.model.vertexArray);
    encoder.setBindings({instances, visibleIds: visibleIdentifiers, uniforms});
    drawCommands.draw(encoder, 0);
    encoder.setPipeline(this.lightningModel.pipeline);
    encoder.setVertexArray(this.lightningModel.vertexArray);
    encoder.setBindings({lightningSegments, uniforms});
    encoder.draw({
      indexCount: this.getIndexCount(this.lightningModel),
      instanceCount: this.lightningModel.instanceCount
    });
    encoder.setPipeline(this.lightMarkerModel.pipeline);
    encoder.setVertexArray(this.lightMarkerModel.vertexArray);
    encoder.setBindings({lightMarkers, uniforms});
    encoder.draw({
      indexCount: this.getIndexCount(this.lightMarkerModel),
      instanceCount: this.lightMarkerModel.instanceCount
    });
    return encoder.finish();
  }

  private getIndexCount(model: Model = this.model): number {
    const indexBuffer = model.vertexArray.indexBuffer;
    if (!indexBuffer) {
      throw new Error('Lightstorm Megacity requires indexed cube geometry');
    }
    return (
      model.indexCount ?? indexBuffer.byteLength / (indexBuffer.indexType === 'uint32' ? 4 : 2)
    );
  }

  private writeUniforms(
    parameters: LightstormGraphParameters,
    timeMilliseconds: number
  ): LightstormCameraState {
    this.guidedCameraStartMilliseconds ??= timeMilliseconds;
    const guidedCameraTimeSeconds = (timeMilliseconds - this.guidedCameraStartMilliseconds) / 1000;
    const lightningTimeSeconds = this.guidedCamera
      ? guidedCameraTimeSeconds
      : timeMilliseconds / 1000;
    const lightningSkyPulse = getLightstormLightningSkyPulse(
      lightningTimeSeconds,
      this.lightstormEnabled
    );
    this.thunderAudio.update(lightningTimeSeconds, this.lightstormEnabled);
    const perspectiveAspect = getViewportAspect(parameters.perspectiveViewport);
    const controls = this.orbitControls;
    const cameraPose = this.guidedCamera
      ? getLightstormGuidedCameraSample(this.guidedCameraTour, guidedCameraTimeSeconds)
      : makeOrbitCameraSample(
          controls ? [...controls.props.target] : [...DEFAULT_CAMERA_TARGET],
          controls?.yaw ?? DEFAULT_CAMERA_YAW,
          controls?.pitch ?? DEFAULT_CAMERA_PITCH,
          controls?.distance ?? DEFAULT_CAMERA_DISTANCE
        );
    this.currentCameraPose = cameraPose;
    const eye = cameraPose.eye;
    const viewMatrix = new Matrix4().lookAt({eye, center: cameraPose.target, up: [0, 1, 0]});
    const farPlane = Math.max(1800, this.cityMetadata.fieldHalfExtent * 3.2);
    const projectionMatrix = new Matrix4().perspective({
      fovy: LIGHTSTORM_CAMERA_FIELD_OF_VIEW,
      aspect: perspectiveAspect,
      near: NEAR_PLANE,
      far: farPlane
    });
    const viewProjectionMatrix = new Matrix4(projectionMatrix).multiplyRight(viewMatrix);
    const previousViewProjectionMatrix = this.previousViewProjectionMatrix ?? viewProjectionMatrix;
    this.writeCameraUniforms(
      this.uniformBuffer,
      viewMatrix,
      viewProjectionMatrix,
      previousViewProjectionMatrix,
      perspectiveAspect,
      farPlane,
      this.cullingEnabled,
      timeMilliseconds,
      lightningTimeSeconds,
      lightningSkyPulse
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
    const overviewViewProjectionMatrix = new Matrix4(overviewProjectionMatrix).multiplyRight(
      overviewViewMatrix
    );
    this.writeCameraUniforms(
      this.overviewUniformBuffer,
      overviewViewMatrix,
      overviewViewProjectionMatrix,
      overviewViewProjectionMatrix,
      overviewAspect,
      overviewFarPlane,
      false,
      timeMilliseconds,
      lightningTimeSeconds,
      lightningSkyPulse
    );
    this.previousViewProjectionMatrix = new Matrix4(viewProjectionMatrix);
    return {
      viewMatrix,
      projectionMatrix,
      inverseProjectionMatrix: new Matrix4(projectionMatrix).invert(),
      viewProjectionMatrix,
      farPlane,
      lightningSkyPulse
    };
  }

  private writeCameraUniforms(
    buffer: Buffer,
    viewMatrix: Matrix4,
    viewProjectionMatrix: Matrix4,
    previousViewProjectionMatrix: Matrix4,
    aspect: number,
    farPlane: number,
    cullingEnabled: boolean,
    timeMilliseconds: number,
    lightningTimeSeconds: number,
    lightningSkyPulse: number
  ): void {
    const values = new Float32Array(UNIFORM_BYTE_LENGTH / Float32Array.BYTES_PER_ELEMENT);
    values.set(viewProjectionMatrix, 0);
    values.set(viewMatrix, 16);
    values.set(
      [
        Math.tan(LIGHTSTORM_CAMERA_FIELD_OF_VIEW / 2),
        aspect,
        NEAR_PLANE,
        farPlane,
        cullingEnabled ? 1 : 0,
        this.pickedObjectIndex === null ? 0 : this.pickedObjectIndex + 1,
        getDataLayerMode(this.dataLayer),
        this.lightstormEnabled ? 1 : 0,
        timeMilliseconds / 1000,
        1,
        lightningTimeSeconds,
        lightningSkyPulse
      ],
      32
    );
    values.set(previousViewProjectionMatrix, 44);
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
      const pickedObjectIndex = decodeGPUIndexPickInfo(bytes).objectIndex;
      if (pickedObjectIndex !== this.pickedObjectIndex) {
        this.deferredLightingRenderer.resetHistory();
      }
      this.pickedObjectIndex = pickedObjectIndex;
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
    this.resources.lightMarkers.destroy();
    this.resources.visibleIdentifiers.destroy();
    this.resources.sceneGBuffer.destroy();
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
          html: `<p style="margin:0;line-height:1.45"><strong>GPU resident · no per-frame instance upload.</strong> One command graph filters city layers, tests conservative tower bounds, stably compacts source IDs, writes an indexed indirect command, and replays a five-target render bundle with 128 emissive source markers. Cinematic mode bins those point lights into a GPU cluster grid before deferred lighting, temporally stabilized screen-space reflections, bloom, and ACES finish the frame on the same command encoder.</p>`
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
      <label><input type="checkbox" data-thunder-audio checked> Procedural thunder audio</label>
      <small data-thunder-status aria-live="polite"></small>
      <button type="button" data-test-thunder>Test thunderclap</button>
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
    const thunderAudio = root.querySelector('[data-thunder-audio]') as HTMLInputElement;
    const thunderStatus = root.querySelector('[data-thunder-status]') as HTMLElement;
    const testThunder = root.querySelector('[data-test-thunder]') as HTMLButtonElement;
    const guidedCamera = root.querySelector('[data-guided-camera]') as HTMLInputElement;
    const comparison = root.querySelector('[data-comparison]') as HTMLInputElement;
    const restartTour = root.querySelector('[data-restart-tour]') as HTMLButtonElement;
    this.guidedCameraElement = guidedCamera;
    this.thunderStatusElement = thunderStatus;
    thunderAudio.checked = this.thunderAudio.enabled;
    this.updateThunderStatus();
    const onCapacity = (): void => this.rebuild(Number(capacitySelect.value));
    const onLayer = (): void => {
      this.dataLayer = layerSelect.value as LightstormDataLayer;
      this.hasVisibilitySample = false;
      this.pickedObjectIndex = null;
      this.deferredLightingRenderer.resetHistory();
    };
    const onCulling = (): void => {
      this.cullingEnabled = culling.checked;
      this.hasVisibilitySample = false;
      this.deferredLightingRenderer.resetHistory();
    };
    const onLightstorm = (): void => {
      this.lightstormEnabled = lightstorm.checked;
      this.deferredLightingRenderer.resetHistory();
    };
    const onThunderAudio = (): void => {
      this.thunderAudio.setEnabled(thunderAudio.checked);
      if (thunderAudio.checked) {
        this.activateThunderAudio(true);
      }
      this.updateThunderStatus();
    };
    const onTestThunder = (): void => this.activateThunderAudio(false, true);
    const onGuidedCamera = (): void => {
      if (guidedCamera.checked) {
        this.restartGuidedCamera();
      } else {
        this.switchToExplore();
      }
    };
    const onComparison = (): void => {
      this.comparisonView = comparison.checked;
      this.previousViewProjectionMatrix = null;
      this.deferredLightingRenderer.resetHistory();
      this.updateInspector();
    };
    const onRestartTour = (): void => this.restartGuidedCamera();
    capacitySelect.addEventListener('change', onCapacity);
    layerSelect.addEventListener('change', onLayer);
    culling.addEventListener('change', onCulling);
    lightstorm.addEventListener('change', onLightstorm);
    thunderAudio.addEventListener('change', onThunderAudio);
    testThunder.addEventListener('click', onTestThunder);
    guidedCamera.addEventListener('change', onGuidedCamera);
    comparison.addEventListener('change', onComparison);
    restartTour.addEventListener('click', onRestartTour);
    return () => {
      capacitySelect.removeEventListener('change', onCapacity);
      layerSelect.removeEventListener('change', onLayer);
      culling.removeEventListener('change', onCulling);
      lightstorm.removeEventListener('change', onLightstorm);
      thunderAudio.removeEventListener('change', onThunderAudio);
      testThunder.removeEventListener('click', onTestThunder);
      guidedCamera.removeEventListener('change', onGuidedCamera);
      comparison.removeEventListener('change', onComparison);
      restartTour.removeEventListener('click', onRestartTour);
      this.guidedCameraElement = null;
      this.thunderStatusElement = null;
    };
  }

  private restartGuidedCamera(): void {
    this.guidedCamera = true;
    this.guidedCameraStartMilliseconds = this.currentTimeMilliseconds;
    this.pickedObjectIndex = null;
    this.previousViewProjectionMatrix = null;
    this.thunderAudio.reset();
    this.deferredLightingRenderer.resetHistory();
    if (this.guidedCameraElement) {
      this.guidedCameraElement.checked = true;
    }
  }

  private switchToExplore(): void {
    if (this.guidedCamera) {
      this.orbitControls?.setProps({
        target: this.currentCameraPose.target,
        yaw: this.currentCameraPose.yaw,
        pitch: this.currentCameraPose.pitch,
        distance: this.currentCameraPose.distance
      });
    }
    this.guidedCamera = false;
    this.previousViewProjectionMatrix = null;
    this.thunderAudio.reset();
    this.deferredLightingRenderer.resetHistory();
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
        ? formatCount(
            (sampledVisibleCount * TRIANGLES_PER_INSTANCE +
              (this.lightMarkerModel.instanceCount + this.lightningModel.instanceCount) *
                TRIANGLES_PER_INSTANCE) *
              replayCount
          )
        : 'sampling…';
      this.statsElement.innerHTML = `<div style="display:grid;grid-template-columns:1fr auto;gap:4px 12px;margin-top:8px">
        <span>Camera</span><strong>${this.guidedCamera ? this.currentCameraPose.shot : 'free explore'}</strong>
        <span>Layer source</span><strong>${formatCount(eligibleCount)}</strong>
        <span>Visible / submitted</span><strong>${visibleLabel}</strong>
        <span>GPU rejected</span><strong>${culledLabel}</strong>
        <span>Nominal triangles</span><strong>${formatCount(eligibleCount * TRIANGLES_PER_INSTANCE)}</strong>
        <span>Submitted triangles</span><strong>${submittedTriangles}</strong>
        <span>Indirect draws</span><strong>${replayCount}</strong>
        <span>Light marker draws</span><strong>${replayCount} · ${this.pointLights.length} emitters/replay</strong>
        <span>Bundle replays</span><strong>${replayCount}</strong>
        <span>Lighting</span><strong>${this.comparisonView ? 'forward tactical split' : `clustered deferred · ${this.activeClusteredLightCount} lights`}</strong>
        <span>G-buffer</span><strong>5 color targets · ${this.sceneColorFormat === 'rgba16float' ? 24 : 20} B/color sample · depth24plus</strong>
        <span>Reflections</span><strong>${this.comparisonView ? 'disabled in tactical mode' : this.sceneColorFormat === 'rgba16float' ? 'half-resolution temporal SSR · 72 samples' : 'requires filterable rgba16float'}</strong>
        <span>Post stack</span><strong>${this.sceneColorFormat === 'rgba16float' ? 'HDR floor composite · temporal SSR' : 'authored floor composite'} · multiscale bloom · ACES</strong>
        <span>Presentation</span><strong>${this.device.preferredColorFormat === 'rgba16float' ? 'Display P3 extended HDR' : 'filmic SDR'}</strong>
        <span>Frame rate</span><strong>${this.framesPerSecond.toFixed(1)} FPS</strong>
        <span>CPU frame</span><strong>${this.cpuFrameTimeMilliseconds.toFixed(2)} ms</strong>
        <span>GPU frame</span><strong>${formatGpuTime(this.device, this.gpuFrameTimeMilliseconds)}</strong>
        <span>Picked record</span><strong>${this.formatPickedRecord()}</strong>
        <span>CPU command encode</span><strong>${this.encodeTimeMilliseconds.toFixed(2)} ms</strong>
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

  private activateThunderAudio(restartTour = false, preview = false): void {
    void this.thunderAudio.activate().then(
      () => {
        if (this.thunderAudio.status === 'ready') {
          if (preview) {
            this.thunderAudio.preview();
          }
          if (restartTour) {
            this.restartGuidedCamera();
          }
        }
        this.updateThunderStatus();
      },
      () => this.updateThunderStatus()
    );
  }

  private updateThunderStatus(): void {
    const thunderStatus = this.thunderAudio.status;
    if (this.thunderActivationButton) {
      this.thunderActivationButton.hidden = thunderStatus !== 'waiting';
    }
    if (!this.thunderStatusElement) {
      return;
    }
    const statusLabels = {
      waiting: 'Thunder: click or press a key to arm audio.',
      ready: 'Thunder: armed · synchronized full-band clap and bass rumble.',
      muted: 'Thunder: muted.',
      unavailable: 'Thunder: Web Audio is unavailable in this browser.'
    } as const;
    this.thunderStatusElement.textContent = statusLabels[thunderStatus];
  }

  private mountThunderActivationButton(): void {
    if (this.thunderActivationButton || typeof document === 'undefined') {
      return;
    }
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Enable thunder + restart tour';
    button.setAttribute('aria-label', 'Enable thunder audio and restart the cinematic tour');
    button.style.cssText =
      'position:fixed;left:50%;bottom:24px;z-index:2147483647;transform:translateX(-50%);padding:10px 16px;border:1px solid rgba(125,220,255,.72);border-radius:999px;background:rgba(4,10,24,.88);color:#eafaff;font:600 13px/1.2 system-ui,sans-serif;letter-spacing:.02em;box-shadow:0 0 24px rgba(55,180,255,.36);cursor:pointer;backdrop-filter:blur(8px)';
    button.addEventListener('click', this.handleThunderActivationButton);
    document.body.appendChild(button);
    this.thunderActivationButton = button;
    this.updateThunderStatus();
  }

  private unmountThunderActivationButton(): void {
    this.thunderActivationButton?.removeEventListener('click', this.handleThunderActivationButton);
    this.thunderActivationButton?.remove();
    this.thunderActivationButton = null;
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

  private readonly handleThunderPointerDown = (event: PointerEvent): void => {
    if (this.thunderAudio.status === 'waiting') {
      // Unlock thunder with the first gesture without interrupting the guided camera tour.
      event.stopImmediatePropagation();
      this.activateThunderAudio(true);
    }
  };

  private readonly handleThunderActivation = (): void => {
    if (this.thunderAudio.status === 'waiting') {
      this.activateThunderAudio(true);
    }
  };

  private readonly handleThunderActivationButton = (): void => {
    this.activateThunderAudio(true);
  };

  private readonly handlePointerMove = (): void => {
    this.pointerDirty = true;
  };
}

function makeOrbitCameraSample(
  target: [number, number, number],
  yaw: number,
  pitch: number,
  distance: number
): LightstormCameraSample {
  const cosinePitch = Math.cos(pitch);
  return {
    eye: [
      target[0] + Math.sin(yaw) * cosinePitch * distance,
      target[1] + Math.sin(pitch) * distance,
      target[2] + Math.cos(yaw) * cosinePitch * distance
    ],
    target,
    yaw,
    pitch,
    distance,
    duration: 0,
    shot: 'free explore'
  };
}

function getDataLayerMode(dataLayer: LightstormDataLayer): number {
  if (dataLayer === 'towers') return 1;
  if (dataLayer === 'transit') return 2;
  return 0;
}

function getSceneColorFormat(device: Device): LightstormSceneColorFormat {
  const floatingPointCapabilities = device.getTextureFormatCapabilities('rgba16float');
  return floatingPointCapabilities.render && floatingPointCapabilities.filter
    ? 'rgba16float'
    : 'rgba8unorm';
}

function getLightstormAmbientColor(skyPulse: number): [number, number, number] {
  return [0.028 + 0.05 * skyPulse, 0.038 + 0.075 * skyPulse, 0.075 + 0.15 * skyPulse];
}

function getLightstormFogColor(skyPulse: number): [number, number, number] {
  return [0.008 + 0.1 * skyPulse, 0.018 + 0.16 * skyPulse, 0.055 + 0.34 * skyPulse];
}

function getSceneGBufferColorFormats(
  sceneColorFormat: LightstormSceneColorFormat
): TextureFormatColor[] {
  return [sceneColorFormat, 'rgba8unorm', 'rg16float', 'rgba8unorm', 'rgba8uint'];
}

function createSceneGBuffer(
  device: Device,
  width: number,
  height: number,
  sceneColorFormat: LightstormSceneColorFormat
): GBuffer {
  return new GBuffer(device, {
    id: 'lightstorm-megacity-scene',
    width,
    height,
    colorFormat: sceneColorFormat,
    normalRoughnessFormat: 'rgba8unorm',
    velocityFormat: 'rg16float',
    depthStencilFormat: 'depth24plus',
    extraColorAttachments: [
      {name: 'baseColorMetallic', format: 'rgba8unorm'},
      {name: 'emissiveOcclusion', format: 'rgba8uint'}
    ]
  });
}

function normalizeVector3(vector: NumberArray3): [number, number, number] {
  const length = Math.hypot(vector[0], vector[1], vector[2]);
  return length > 0 ? [vector[0] / length, vector[1] / length, vector[2] / length] : [0, 1, 0];
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
