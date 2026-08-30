// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {load} from '@loaders.gl/core';
import {GLTFLoader, type GLTFPostprocessed, postProcessGLTF} from '@loaders.gl/gltf';
import {Device, log, RenderPass} from '@luma.gl/core';
import {
  AnimationLoopTemplate,
  AnimationProps,
  type Model,
  ModelNode,
  OrbitControls
} from '@luma.gl/engine';
import {Light, LightingProps, type PBRMaterialUniforms} from '@luma.gl/shadertools';
import {
  createGLTFAnimatedCrowd,
  createScenegraphsFromGLTF,
  type GLTFAnimatedCrowd,
  type GLTFCrowdActorOptions,
  type GLTFScenegraphs,
  type PBREnvironment
} from '@luma.gl/gltf';
import {Matrix4} from '@math.gl/core';
import {GLTF_SAMPLE_ASSETS_MODEL_URL} from './gltf-reference-source';
import {
  GLTF_REFERENCE_EVIDENCE_SCHEMA,
  GLTF_REFERENCE_EVIDENCE_VERSION,
  getGLTFReferenceCaptureOptions,
  getGLTFReferenceDrawMetrics,
  getGLTFReferenceResourceMetrics,
  type GLTFReferenceCaptureOptions,
  type GLTFReferenceEvidence
} from './gltf-reference-evidence';
import {
  GLTFAnimationStudio,
  getGLTFStudioCameraState,
  type GLTFAnimationStudioState
} from './gltf-animation-studio';
import {GLTF_STUDIO_ASSETS, getGLTFStudioAsset} from './gltf-studio-assets';

/* eslint-disable camelcase */

const MODEL_DIRECTORY_URL = GLTF_SAMPLE_ASSETS_MODEL_URL;
const MODEL_LIST_URL = `${GLTF_SAMPLE_ASSETS_MODEL_URL}/model-index.json`;
const ROBOT_EXPRESSIVE_MODEL_URL = new URL(
  '../scene/public/gltf/RobotExpressive.glb',
  import.meta.url
).href;
const SIMPLE_SKIN_LOD_MODEL_URL = new URL(
  '../../../modules/gltf/test/data/SimpleSkinLOD.gltf',
  import.meta.url
).href;
const BUMP_MATERIAL_MODEL_URL = new URL(
  '../../../modules/gltf/test/data/BumpMaterial.gltf',
  import.meta.url
).href;
const LAST_GLTF_MODEL_STORAGE_KEY = 'last-gltf-model';
const GLTF_OPTIONS_STORAGE_KEY = 'showcase-gltf-options';
const GLTF_LOADING_STYLE_ID = 'gltf-loading-indicator-style';
export const GLTF_MODEL_INFO_ID = 'model-info';
export const GLTF_CROWD_INFO_ID = 'gltf-crowd-info';
export const GLTF_ANIMATION_INFO_ID = 'gltf-animation-info';
export const GLTF_CONTROL_PANEL_STYLE = 'display: grid; gap: 8px;';
export const GLTF_CONTROL_ROW_STYLE =
  'display: grid; grid-template-columns: 7rem minmax(0, 1fr); align-items: center; column-gap: 0.75rem;';
export const GLTF_SELECT_STYLE = 'width: 100%; min-width: 0;';
const MAX_CAMERA_TILT = 0.7;
const CAMERA_TILT_HEIGHT_FACTOR = 0.35;
const MAXIMUM_GLTF_CROWD_ACTORS = 100;
const ADDITIONAL_ANIMATED_GLTF_MODELS = new Set([
  'Fox',
  'MorphStressTest',
  'RobotExpressive',
  'SimpleMorph',
  'SimpleSkinLOD'
]);

const lightSources = {
  ambientLight: {
    color: [255, 133, 133],
    intensity: 1,
    type: 'ambient'
  },
  directionalLights: [
    {
      color: [222, 244, 255],
      direction: [1, -0.5, 0.5],
      intensity: 10,
      type: 'directional'
    }
  ],
  pointLights: [
    {
      color: [255, 222, 222],
      position: [3, 10, 0],
      intensity: 5,
      type: 'point'
    }
  ]
} as const satisfies LightingProps;

const INFO_HTML = `\
<p>
  Browse the Khronos sample asset catalog and inspect each model with luma.gl scene graph rendering.
</p>
<div id="model-options" style="${GLTF_CONTROL_PANEL_STYLE}">
  <div style="${GLTF_CONTROL_ROW_STYLE}">
    <label for="model-select" style="margin: 0;">Model</label>
    <div style="display: flex; align-items: center; gap: 0.5rem; min-width: 0;">
      <select id="model-select" style="flex: 1 1 auto; ${GLTF_SELECT_STYLE}"></select>
      <div id="loading-state" class="gltf-loading-indicator" hidden>
      <span class="gltf-loading-spinner" aria-hidden="true"></span>
      </div>
    </div>
  </div>
  <div><label><input type="checkbox" id="useModelLights" />Use Model Lights</label></div>
<div><label><input type="checkbox" id="cameraAnimation" />Camera Animation</label></div>
<div><label><input type="checkbox" id="gltfAnimation" />glTF Animation</label></div>
</div>
<div id="${GLTF_MODEL_INFO_ID}" style="margin-top: 12px; display: none;"></div>
<div id="${GLTF_ANIMATION_INFO_ID}" style="margin-top: 8px;" hidden></div>
<div id="${GLTF_CROWD_INFO_ID}" style="margin-top: 8px;" hidden></div>
<div id="model-light-indicator" style="margin-top: 8px;"></div>
<div id="error" style="color: #b00020; margin-top: 8px;"></div>
`;

type GLTFExtensionSupportMap = ReturnType<typeof createScenegraphsFromGLTF>['extensionSupport'];
type GLTFExtensionSupportInfo =
  GLTFExtensionSupportMap extends Map<string, infer SupportInfo> ? SupportInfo : never;
type GLTFExtensionSupportLevel = GLTFExtensionSupportInfo['supportLevel'];
export type GLTFCatalogModel = {
  hasGLBVariant?: boolean;
  label: string;
  name: string;
  summary?: string;
  description?: string;
  screenshot?: string;
  tags?: string[];
  variants?: Record<string, string>;
};

/** Identifies animated Khronos samples without fetching every model document. */
export function isAnimatedGLTFCatalogModel(
  model: Pick<GLTFCatalogModel, 'name' | 'screenshot'>
): boolean {
  return (
    ADDITIONAL_ANIMATED_GLTF_MODELS.has(model.name) ||
    /animat/i.test(model.name) ||
    /(?:\.gif(?:[?#]|$)|(?:^|[/._-])animated(?:[._-]|$))/i.test(model.screenshot || '')
  );
}

type GLTFModelMetadata = Pick<GLTFCatalogModel, 'summary' | 'description'>;

const GLTF_MODEL_METADATA_OVERRIDES: Record<string, GLTFModelMetadata> = {
  PotOfCoalsAnimationPointer: {
    description:
      'A non-reflective bumpy glass-like surface distorts the hot coals underneath, using KHR_animation_pointer to animate the heat refraction effect.'
  },
  RobotExpressive: {
    summary:
      'An expressive skinned robot with 14 named actions, facial expressions, and independently animated crowd playback.'
  },
  SimpleSkinLOD: {
    summary:
      'An animated, skinned character with three authored MSFT_lod mesh levels and screen-coverage thresholds.'
  }
};
const ROBOT_EXPRESSIVE_CATALOG_MODEL: GLTFCatalogModel = {
  label: 'Robot Expressive',
  name: 'RobotExpressive',
  ...GLTF_MODEL_METADATA_OVERRIDES['RobotExpressive'],
  variants: {'glTF-Binary': 'RobotExpressive.glb'}
};
const SIMPLE_SKIN_LOD_CATALOG_MODEL: GLTFCatalogModel = {
  label: 'Simple Skin LOD',
  name: 'SimpleSkinLOD',
  ...GLTF_MODEL_METADATA_OVERRIDES['SimpleSkinLOD'],
  variants: {glTF: 'SimpleSkinLOD.gltf'}
};
const BUMP_MATERIAL_CATALOG_MODEL: GLTFCatalogModel = {
  label: 'Bump Material',
  name: 'BumpMaterial',
  summary: 'A compact CC0 fixture for the experimental EXT_materials_bump extension.',
  variants: {glTF: 'BumpMaterial.gltf'}
};
export type GLTFModelReference = {
  name: string;
  variant?: string;
  fileName?: string;
};

declare global {
  interface Window {
    __lumaGLTFReferenceEvidence?: GLTFReferenceEvidence;
    __lumaGLTFReferenceError?: string;
    __lumaGLTFReferenceProgress?: {
      stage: string;
      updatedAt: string;
    };
  }
}

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = INFO_HTML;

  device: Device;
  orbitControls: OrbitControls;
  availableModels: GLTFCatalogModel[] = [];
  scenegraphsFromGLTF?: ReturnType<typeof createScenegraphsFromGLTF>;
  animatedCrowd?: GLTFAnimatedCrowd;
  readonly animationStudio = new GLTFAnimationStudio();
  activeScenegraphOptions: Parameters<typeof createScenegraphsFromGLTF>[2] = {};
  loadedGLTF?: GLTFPostprocessed;
  previousCrowdFrameTime?: number;
  crowdActionNames: string[] = [];
  levelOfDetailBias = 1;
  levelOfDetailVertexBudget = 0;
  modelLights: Light[] = [];
  selectedCameraIndex: number | null = null;
  center = [0, 0, 0];
  cameraHeight = 0;
  sceneRadius = 1;
  options: Record<string, boolean> = {
    autoLOD: false,
    useModelLights: true,
    cameraAnimation: true,
    gltfAnimation: true
  };
  isFinalized: boolean = false;
  gltfLoadGeneration: number = 0;
  cleanupCallbacks: Array<() => void> = [];
  modelMetadataCache = new Map<string, Promise<GLTFModelMetadata>>();
  readonly referenceCaptureOptions: GLTFReferenceCaptureOptions | undefined;
  referenceModelUrl = '';
  referenceLoadMetrics?: {
    loadMilliseconds: number;
    fetchAndPostprocessMilliseconds: number;
    scenegraphCreationMilliseconds: number;
  };
  referenceFrameCount = 0;
  referenceFrameCpuMilliseconds = 0;
  referenceInitialDrawCpuMilliseconds?: number;
  referenceRenderStage = '';

  constructor({device}: AnimationProps) {
    super();
    this.device = device;
    this.referenceCaptureOptions = getGLTFReferenceCaptureOptions(window.location.search);
    ensureLoadingIndicatorStyles();
    this.options = loadOptions(this.options);
    if (this.referenceCaptureOptions) {
      this.options = {
        ...this.options,
        autoLOD: false,
        useModelLights: false,
        cameraAnimation: false,
        gltfAnimation: false
      };
      delete window.__lumaGLTFReferenceEvidence;
      delete window.__lumaGLTFReferenceError;
      delete window.__lumaGLTFReferenceProgress;
      void this.device.lost.then(loss => {
        if (this.isFinalized || !this.referenceCaptureOptions) {
          return;
        }
        const message = `WebGPU device lost during glTF reference capture: ${loss.message}`;
        window.__lumaGLTFReferenceError = message;
        this.publishReferenceRenderStage('device-lost');
        log.error(message)();
      });
    }

    const canvas = this.device.getDefaultCanvasContext().canvas as HTMLCanvasElement;
    this.orbitControls = new OrbitControls(canvas, {
      distance: 1,
      minDistance: 0.05,
      maxDistance: 40,
      minPitch: -MAX_CAMERA_TILT,
      maxPitch: MAX_CAMERA_TILT,
      rotateSpeed: 0.0035,
      pitchSpeed: 0.01,
      zoomSpeed: 0.0015,
      autoRotate: this.options['cameraAnimation'],
      autoRotateSpeed: 1
    });
    this.cleanupCallbacks.push(() => this.orbitControls.destroy());

    const modelStorageKey = this.getModelStorageKey();
    if (!this.referenceCaptureOptions) {
      window.localStorage[modelStorageKey] ??= this.getDefaultModelName();
    }
    const initialModelName =
      this.referenceCaptureOptions?.modelName || window.localStorage[modelStorageKey];

    this.cleanupCallbacks.push(...setOptionsUI(this.options));

    const modelListPromise = this.referenceCaptureOptions
      ? Promise.resolve([getReferenceCaptureCatalogModel(this.referenceCaptureOptions)])
      : this.fetchModelList();
    modelListPromise
      .then(models => {
        if (this.isFinalized) {
          return;
        }
        this.availableModels = models;
        const currentModelName = models.some(model => model.name === initialModelName)
          ? initialModelName
          : models.find(model => model.name === this.getDefaultModelName())?.name ||
            models[0]?.name ||
            initialModelName;
        if (!this.referenceCaptureOptions) {
          window.localStorage[modelStorageKey] = currentModelName;
        }
        const cleanupModelMenu = this.initializeModelMenus(models, currentModelName);
        this.cleanupCallbacks.push(cleanupModelMenu);
        this.loadGLTF(
          this.referenceCaptureOptions
            ? {
                name: this.referenceCaptureOptions.modelName,
                variant: this.referenceCaptureOptions.variant,
                fileName: this.referenceCaptureOptions.fileName
              }
            : currentModelName
        );
      })
      .catch(error => {
        log.error(
          'Failed to fetch glTF sample catalog, falling back to speculative model loading',
          error
        )();
        if (this.isFinalized) {
          return;
        }
        this.loadGLTF(initialModelName);
      });
  }

  onFinalize() {
    this.isFinalized = true;
    this.gltfLoadGeneration++;
    delete window.__lumaGLTFReferenceEvidence;
    delete window.__lumaGLTFReferenceError;
    for (const cleanupCallback of this.cleanupCallbacks) {
      cleanupCallback();
    }
    this.cleanupCallbacks = [];
    this.animationStudio.detach();
    this.animatedCrowd?.destroy();
    this.animatedCrowd = undefined;
    this.crowdActionNames = [];
    destroyScenegraphs(this.scenegraphsFromGLTF);
    this.scenegraphsFromGLTF = undefined;
    this.loadedGLTF = undefined;
    this.modelLights = [];
    this.setViewerLoadingState(false);
    updateModelInfoBox();
    updateCrowdInfo();
    updateExtensionSupportTable();
  }

  getDefaultModelName(): string {
    return 'CesiumMan';
  }

  isReferenceCapture(): boolean {
    return Boolean(this.referenceCaptureOptions);
  }

  getModelStorageKey(): string {
    return LAST_GLTF_MODEL_STORAGE_KEY;
  }

  getClearColor(): [number, number, number, number] {
    return [0, 0, 0, 1];
  }

  async getImageBasedLightingEnvironment(): Promise<PBREnvironment | undefined> {
    return undefined;
  }

  initializeModelMenus(models: GLTFCatalogModel[], currentModelName: string): () => void {
    return setModelMenu(models, currentModelName, (modelName: string) => {
      this.loadGLTF(modelName);
      window.localStorage[this.getModelStorageKey()] = modelName;
    });
  }

  getDefaultCameraTilt(_modelReference: Required<GLTFModelReference>): number {
    return 0;
  }

  getPBRMaterialProps(): Partial<PBRMaterialUniforms> {
    return {};
  }

  isLoadStale(loadGeneration: number): boolean {
    return this.isFinalized || loadGeneration !== this.gltfLoadGeneration;
  }

  setViewerLoadingState(isLoading: boolean, message?: string): void {
    const canvas = this.device.getDefaultCanvasContext().canvas as HTMLCanvasElement;
    canvas.style.opacity = isLoading ? '0.1' : '1';
    setLoadingState(isLoading, message);
  }

  drawBackground(_renderPass: RenderPass): void {}

  /** Lets richer showcase surfaces refresh controls after an asset or crowd changes. */
  onScenegraphsChanged(_scenegraphs: GLTFScenegraphs): void {}

  /** Selects a source-authored camera, or restores the studio orbit camera with null. */
  selectCamera(cameraIndex: number | null): void {
    const cameraCount = this.scenegraphsFromGLTF?.cameras?.length || 0;
    this.selectedCameraIndex =
      cameraIndex === null || cameraIndex < 0 || cameraIndex >= cameraCount ? null : cameraIndex;
  }

  /** Returns the number of independently animated actors sharing the current asset. */
  getAnimationInstanceCount(): number {
    return this.animatedCrowd?.actorCount || 1;
  }

  /** Toggles actor-specific mesh detail without rebuilding the crowd or resetting animation. */
  setAutomaticLevelOfDetail(enabled: boolean): void {
    this.options['autoLOD'] = enabled;
    this.animatedCrowd?.setLODEnabled(enabled);
  }

  /** Increases or decreases authored/generated screen-coverage detail selection. */
  setLevelOfDetailBias(bias: number): void {
    this.levelOfDetailBias = clampNumber(bias, 0.25, 4);
    this.animatedCrowd?.setLODBias(this.levelOfDetailBias);
  }

  /** Limits submitted actor vertices without changing animation state; zero means unlimited. */
  setLevelOfDetailVertexBudget(vertexBudget: number): void {
    this.levelOfDetailVertexBudget = clampNumber(Math.round(vertexBudget), 0, 1_000_000);
    this.animatedCrowd?.setLODVertexBudget(this.levelOfDetailVertexBudget || undefined);
  }

  /** Places independently phased actors in one GPU-instanced draw per source primitive. */
  setAnimationInstanceCount(instanceCount: number): void {
    const actorCount = Math.max(1, Math.min(MAXIMUM_GLTF_CROWD_ACTORS, Math.floor(instanceCount)));
    if (!this.loadedGLTF || (!this.animatedCrowd && actorCount === 1)) {
      return;
    }

    if (!this.animatedCrowd) {
      if (this.scenegraphsFromGLTF?.extensionSupport.has('EXT_mesh_gpu_instancing')) {
        showError(new Error('GPU animated crowds cannot nest EXT_mesh_gpu_instancing.'));
        return;
      }

      const previousScenegraphs = this.scenegraphsFromGLTF;
      try {
        this.animatedCrowd = createGLTFAnimatedCrowd(this.device, this.loadedGLTF, {
          ...this.activeScenegraphOptions,
          capacity: MAXIMUM_GLTF_CROWD_ACTORS,
          gpuAnimation: {sampleRate: 30},
          lod: {
            enabled: this.options['autoLOD'],
            autoGenerate: true,
            ratios: [0.5, 0.25],
            ...(this.levelOfDetailVertexBudget > 0
              ? {vertexBudget: this.levelOfDetailVertexBudget}
              : {})
          }
        });
        this.animatedCrowd.setLODBias(this.levelOfDetailBias);
      } catch (error) {
        showError(error);
        return;
      }
      destroyScenegraphs(previousScenegraphs);
      this.scenegraphsFromGLTF = this.animatedCrowd.scenegraphs;
      this.modelLights = this.animatedCrowd.scenegraphs.lights;
      this.animationStudio.attach(this.animatedCrowd.scenegraphs);
      this.animationStudio.attachCrowd(this.animatedCrowd);
      this.previousCrowdFrameTime = undefined;
      showError();
    }

    const clipNames = getAnimationClipNames(this.animatedCrowd.scenegraphs);
    const preferredClips = ['Walking', 'Running', 'Dance', 'Wave', 'Idle'];
    const availableClips = preferredClips.filter(name => clipNames.includes(name));
    const playableClips = availableClips.length ? availableClips : clipNames;

    const actorOptions: GLTFCrowdActorOptions[] = [];
    const spacing = Math.max(this.sceneRadius * 2.5, 0.75);
    for (let actorIndex = this.animatedCrowd.actorCount; actorIndex < actorCount; actorIndex++) {
      const clip = playableClips.length
        ? playableClips[actorIndex % playableClips.length]
        : undefined;
      const angle = actorIndex * 2.39996322973;
      const radius = Math.sqrt(actorIndex) * spacing;
      actorOptions.push({
        id: `gltf-crowd-actor-${actorIndex}`,
        ...(clip ? {clip} : {}),
        phase: (actorIndex * 0.61803398875) % 1,
        speed: 0.8 + (actorIndex % 5) * 0.1,
        transform: new Matrix4().translate([Math.cos(angle) * radius, 0, Math.sin(angle) * radius])
      });
    }
    if (actorOptions.length) {
      this.animatedCrowd.addActors(actorOptions);
    }

    if (this.animatedCrowd.actorCount > actorCount) {
      this.animatedCrowd.removeActors(
        this.animatedCrowd.actors.slice(actorCount).map(actor => actor.id)
      );
    }

    this.animationStudio.attachCrowd(this.animatedCrowd);
    this.onScenegraphsChanged(this.animatedCrowd.scenegraphs);

    this.crowdActionNames = Array.from(
      new Set(
        this.animatedCrowd.actors
          .map(actor => actor.activeClip)
          .filter((name): name is string => Boolean(name))
      )
    );
    updateCrowdInfo(
      actorCount,
      this.animatedCrowd.lodStats.drawCount,
      this.crowdActionNames,
      this.options['autoLOD'] ? this.animatedCrowd.lodStats : undefined,
      this.animatedCrowd.animationStats
    );
  }

  onRender({aspect, device, time}: AnimationProps): void {
    const frameStartTime = performance.now();
    let animationCpuMilliseconds = 0;
    const renderPass = device.beginRenderPass({clearColor: this.getClearColor(), clearDepth: 1});
    this.drawBackground(renderPass);

    if (!this.scenegraphsFromGLTF?.scenes?.length) {
      renderPass.end();
      return;
    }

    this.publishReferenceRenderStage('model-frame-started');

    updateModelLightIndicator(this.modelLights, this.options['useModelLights']);
    this.orbitControls.setAutoRotate(this.options['cameraAnimation']);
    this.orbitControls.update(time);

    const actorCount = this.getAnimationInstanceCount();
    const actorSpacing = Math.max(this.sceneRadius * 2.5, 0.75);
    const crowdRadius =
      actorCount > 1
        ? Math.sqrt(actorCount - 1) * actorSpacing + this.sceneRadius
        : this.sceneRadius;
    const orbitDistance =
      this.orbitControls.distance *
      Math.max(1, crowdRadius / Math.max(this.sceneRadius, 0.001)) *
      (this.referenceCaptureOptions?.distanceMultiplier || 1);
    const far = Math.max(orbitDistance + crowdRadius * 2, 10);
    const near = Math.max(this.sceneRadius / 1000, 0.01);
    if (this.options['gltfAnimation'] && !this.animatedCrowd) {
      const animationStartTime = performance.now();
      this.animationStudio.setPlaying(true);
      this.animationStudio.update(time);
      animationCpuMilliseconds += performance.now() - animationStartTime;
    } else if (!this.animatedCrowd) {
      this.animationStudio.setPlaying(false);
    }

    const {
      projectionMatrix,
      viewMatrix,
      position: cameraPos
    } = this.getCameraState({
      aspect,
      far,
      near,
      orbitDistance,
      time
    });
    if (!this.referenceCaptureOptions) {
      updateAnimationStudioInfo(this.animationStudio.getState());
    }

    const pbrMaterialProps = this.getPBRMaterialProps();
    const hasPBRMaterialProps = Object.keys(pbrMaterialProps).length > 0;

    if (this.animatedCrowd) {
      const deltaSeconds =
        this.previousCrowdFrameTime === undefined
          ? 0
          : Math.min(Math.max(time - this.previousCrowdFrameTime, 0) / 1000, 0.1);
      this.previousCrowdFrameTime = time;
      const canvas = device.getDefaultCanvasContext().canvas as HTMLCanvasElement;
      const levelOfDetailView = this.options['autoLOD']
        ? {
            viewMatrix,
            projectionMatrix,
            viewportWidth: canvas.width,
            viewportHeight: canvas.height
          }
        : undefined;

      if (this.options['gltfAnimation']) {
        const animationStartTime = performance.now();
        this.animatedCrowd.update(deltaSeconds, levelOfDetailView);
        animationCpuMilliseconds += performance.now() - animationStartTime;
      } else if (levelOfDetailView) {
        this.animatedCrowd.setLODView(levelOfDetailView);
      }

      const modelMatrix = new Matrix4();
      const modelViewProjectionMatrix = new Matrix4(projectionMatrix).multiplyRight(viewMatrix);
      for (const model of this.animatedCrowd.models) {
        if (model.instanceCount === 0) {
          continue;
        }
        model.shaderInputs.setProps({
          lighting: this.getLightingProps(),
          pbrProjection: {
            camera: cameraPos,
            modelViewProjectionMatrix,
            modelMatrix,
            normalMatrix: modelMatrix
          }
        });
        if (hasPBRMaterialProps) {
          if (model.material?.ownsModule('pbrMaterial')) {
            model.material.setProps({pbrMaterial: pbrMaterialProps});
          } else {
            model.shaderInputs.setProps({pbrMaterial: pbrMaterialProps});
          }
        }
      }

      const drawCount = this.animatedCrowd.draw(renderPass);
      updateCrowdInfo(
        this.animatedCrowd.actorCount,
        drawCount,
        this.crowdActionNames,
        this.options['autoLOD'] ? this.animatedCrowd.lodStats : undefined,
        this.animatedCrowd.animationStats
      );
      renderPass.end();
      this.publishReferenceEvidence({
        animationCpuMilliseconds,
        cameraPosition: cameraPos,
        drawMetrics: {
          drawCount,
          submittedIndexReferences: this.animatedCrowd.lodStats.vertices,
          submittedVertexReferences: 0,
          triangleCount: this.animatedCrowd.lodStats.triangles
        },
        far,
        frameStartTime,
        near
      });
      return;
    }

    const drawnModels: Model[] = [];
    this.scenegraphsFromGLTF.scenes[0].traverse((node, {worldMatrix: modelMatrix}) => {
      const {model} = node as ModelNode;

      const modelViewProjectionMatrix = new Matrix4(projectionMatrix)
        .multiplyRight(viewMatrix)
        .multiplyRight(modelMatrix);

      model.shaderInputs.setProps({
        lighting: this.getLightingProps(),
        pbrProjection: {
          camera: cameraPos,
          modelViewProjectionMatrix,
          modelMatrix,
          normalMatrix: new Matrix4(modelMatrix).invert().transpose()
        },
        skin: {
          scenegraphsFromGLTF: this.scenegraphsFromGLTF
        }
      });

      if (hasPBRMaterialProps) {
        if (model.material?.ownsModule('pbrMaterial')) {
          model.material.setProps({pbrMaterial: pbrMaterialProps});
        } else {
          model.shaderInputs.setProps({pbrMaterial: pbrMaterialProps});
        }
      }

      this.publishReferenceRenderStage(`drawing-model:${model.id}`);
      if (model.draw(renderPass)) {
        drawnModels.push(model);
      }
      this.publishReferenceRenderStage(`drew-model:${model.id}`);
    });
    this.publishReferenceRenderStage('ending-render-pass');
    renderPass.end();
    this.publishReferenceRenderStage('render-pass-ended');
    this.publishReferenceEvidence({
      animationCpuMilliseconds,
      cameraPosition: cameraPos,
      drawMetrics: getGLTFReferenceDrawMetrics(drawnModels),
      far,
      frameStartTime,
      near
    });
    this.publishReferenceRenderStage('evidence-published');
  }

  private publishReferenceRenderStage(stage: string): void {
    if (
      !this.referenceCaptureOptions ||
      this.referenceFrameCount > 0 ||
      stage === this.referenceRenderStage
    ) {
      return;
    }
    this.referenceRenderStage = stage;
    window.__lumaGLTFReferenceProgress = {stage, updatedAt: new Date().toISOString()};
    log.log(0, `glTF reference render stage: ${stage}`)();
  }

  private publishReferenceEvidence(options: {
    animationCpuMilliseconds: number;
    cameraPosition: [number, number, number];
    drawMetrics: ReturnType<typeof getGLTFReferenceDrawMetrics>;
    far: number;
    frameStartTime: number;
    near: number;
  }): void {
    const captureOptions = this.referenceCaptureOptions;
    const loadMetrics = this.referenceLoadMetrics;
    if (!captureOptions || !loadMetrics || !this.scenegraphsFromGLTF || !this.referenceModelUrl) {
      return;
    }

    const frameCpuMilliseconds = performance.now() - options.frameStartTime;
    this.referenceFrameCount++;
    this.referenceFrameCpuMilliseconds += frameCpuMilliseconds;
    this.referenceInitialDrawCpuMilliseconds ??= frameCpuMilliseconds;

    const deviceInfo = this.device.info;
    window.__lumaGLTFReferenceEvidence = {
      schema: GLTF_REFERENCE_EVIDENCE_SCHEMA,
      version: GLTF_REFERENCE_EVIDENCE_VERSION,
      status: 'ready',
      model: {
        name: captureOptions.modelName,
        variant: captureOptions.variant,
        fileName: captureOptions.fileName,
        url: this.referenceModelUrl
      },
      renderer: {
        backend: this.device.type,
        vendor: deviceInfo.vendor,
        renderer: deviceInfo.renderer,
        version: deviceInfo.version,
        gpu: deviceInfo.gpu,
        gpuType: deviceInfo.gpuType,
        gpuBackend: deviceInfo.gpuBackend,
        featureLevel: deviceInfo.featureLevel,
        shadingLanguage: deviceInfo.shadingLanguage
      },
      camera: {
        yaw: captureOptions.yaw,
        pitch: captureOptions.pitch,
        distanceMultiplier: captureOptions.distanceMultiplier,
        position: options.cameraPosition,
        target: [this.center[0], this.center[1], this.center[2]],
        verticalFieldOfViewRadians: Math.PI / 3,
        near: options.near,
        far: options.far
      },
      rendering: {
        animation: captureOptions.studio ? 'fixed-studio-state' : 'disabled',
        automaticLevelOfDetail: 'disabled',
        environment: 'fixed-fallback-lights',
        exposure: 1,
        toneMapping: 'none',
        outputColorSpace: 'srgb'
      },
      ...(captureOptions.studio
        ? {
            studio: this.getReferenceStudioEvidence()
          }
        : {}),
      extensions: Array.from(this.scenegraphsFromGLTF.extensionSupport.values())
        .map(extension => ({
          extensionName: extension.extensionName,
          required: extension.required,
          supported: extension.supported,
          supportLevel: extension.supportLevel,
          standardStatus: extension.standardStatus
        }))
        .sort((leftExtension, rightExtension) =>
          leftExtension.extensionName.localeCompare(rightExtension.extensionName)
        ),
      metrics: {
        frameCount: this.referenceFrameCount,
        averageFrameCpuMilliseconds: this.referenceFrameCpuMilliseconds / this.referenceFrameCount,
        animationCpuMilliseconds: options.animationCpuMilliseconds,
        ...loadMetrics,
        initialDrawCpuMilliseconds: this.referenceInitialDrawCpuMilliseconds,
        shaderCompilationMilliseconds: null,
        shaderCompilationAvailability: 'not-exposed-by-device-api',
        gpuMemoryBytes: this.device.statsManager.getStats('GPU Time and Memory').get('GPU Memory')
          .count,
        resources: getGLTFReferenceResourceMetrics(this.referenceModelUrl),
        ...options.drawMetrics
      }
    };
  }

  async fetchModelList(): Promise<GLTFCatalogModel[]> {
    const response = await fetch(MODEL_LIST_URL);
    const models = (await response.json()) as GLTFCatalogModel[];
    const catalogModels = models.map(model => ({
      ...model,
      hasGLBVariant: Boolean(model.variants?.['glTF-Binary'])
    }));
    const catalogModelsByName = new Map(catalogModels.map(model => [model.name, model]));
    const studioModels = GLTF_STUDIO_ASSETS.map(asset => {
      const catalogModel = catalogModelsByName.get(asset.name);
      const assetVariant = asset.model.variant || 'glTF';
      const assetFileName = asset.model.fileName || `${asset.name}.gltf`;
      return {
        ...catalogModel,
        label: asset.label,
        name: asset.name,
        summary: asset.description,
        variants: {
          ...catalogModel?.variants,
          [assetVariant]: assetFileName
        },
        hasGLBVariant: assetVariant === 'glTF-Binary' || catalogModel?.hasGLBVariant
      };
    });
    const orderedModels = [
      ROBOT_EXPRESSIVE_CATALOG_MODEL,
      SIMPLE_SKIN_LOD_CATALOG_MODEL,
      BUMP_MATERIAL_CATALOG_MODEL,
      ...studioModels,
      ...catalogModels.filter(isAnimatedGLTFCatalogModel)
    ];
    return Array.from(new Map(orderedModels.map(model => [model.name, model])).values());
  }

  async loadGLTF(modelReference: string | GLTFModelReference) {
    const loadStartTime = performance.now();
    this.referenceModelUrl = '';
    this.referenceLoadMetrics = undefined;
    this.referenceFrameCount = 0;
    this.referenceFrameCpuMilliseconds = 0;
    this.referenceInitialDrawCpuMilliseconds = undefined;
    this.referenceRenderStage = '';
    delete window.__lumaGLTFReferenceEvidence;
    delete window.__lumaGLTFReferenceError;
    delete window.__lumaGLTFReferenceProgress;
    const loadGeneration = ++this.gltfLoadGeneration;
    const candidateModelReferences = getModelLoadCandidates(modelReference, this.availableModels);
    const primaryModelReference = candidateModelReferences[0];
    this.updateModelInfo(primaryModelReference, loadGeneration);
    const primaryModelUrl = getModelUrl(primaryModelReference);
    const {name, variant} = primaryModelReference;
    const modelDescription = getModelDescription(name, variant);
    const modelLabel = getModelLoadingLabel(modelDescription);

    try {
      log.log(0, `Starting glTF load: ${modelDescription}`, {
        modelUrl: primaryModelUrl
      })();
      this.setViewerLoadingState(true, modelLabel);
      showError();

      const imageBasedLightingEnvironmentPromise = this.getImageBasedLightingEnvironment();
      const {gltf, modelUrl, resolvedModelReference} =
        await loadPreferredGLTF(candidateModelReferences);
      const imageBasedLightingEnvironment = await imageBasedLightingEnvironmentPromise;
      log.log(
        0,
        `Fetched glTF asset: ${getModelDescription(resolvedModelReference.name, resolvedModelReference.variant)}`,
        {modelUrl}
      )();
      const processedGLTF = postProcessGLTF(gltf);
      const fetchAndPostprocessEndTime = performance.now();

      const scenegraphCreationStartTime = performance.now();
      const scenegraphOptions = {
        lights: true,
        imageBasedLightingEnvironment,
        pbrDebug: false,
        useTangents: true
      };
      const scenegraphsFromGLTF = createScenegraphsFromGLTF(
        this.device,
        processedGLTF,
        scenegraphOptions
      );
      const scenegraphCreationEndTime = performance.now();
      log.log(0, `Created glTF scenegraphs: ${modelDescription}`)();

      if (this.isLoadStale(loadGeneration)) {
        destroyScenegraphs(scenegraphsFromGLTF);
        return;
      }

      this.animatedCrowd?.destroy();
      this.animatedCrowd = undefined;
      this.crowdActionNames = [];
      destroyScenegraphs(this.scenegraphsFromGLTF);
      this.scenegraphsFromGLTF = scenegraphsFromGLTF;
      this.animationStudio.attach(scenegraphsFromGLTF);
      this.selectedCameraIndex = null;
      this.loadedGLTF = processedGLTF;
      this.activeScenegraphOptions = scenegraphOptions;
      this.previousCrowdFrameTime = undefined;
      this.modelLights = scenegraphsFromGLTF.lights;
      this.referenceModelUrl = modelUrl;
      this.referenceLoadMetrics = {
        loadMilliseconds: scenegraphCreationEndTime - loadStartTime,
        fetchAndPostprocessMilliseconds: fetchAndPostprocessEndTime - loadStartTime,
        scenegraphCreationMilliseconds: scenegraphCreationEndTime - scenegraphCreationStartTime
      };
      updateCrowdInfo();
      this.updateModelInfo(
        resolvedModelReference,
        loadGeneration,
        getAnimationClipNames(scenegraphsFromGLTF)
      );
      updateExtensionSupportTable(scenegraphsFromGLTF.extensionSupport);

      const activeSceneBounds =
        scenegraphsFromGLTF.sceneBounds[0] || scenegraphsFromGLTF.modelBounds;
      this.center = [...activeSceneBounds.center];
      this.sceneRadius = activeSceneBounds.radius;
      const orbitDistance = activeSceneBounds.recommendedOrbitDistance;
      this.cameraHeight = this.center[1] + this.sceneRadius * 0.35;
      this.orbitControls.setProps({
        target: [this.center[0], this.cameraHeight, this.center[2]],
        distance: orbitDistance,
        minDistance: Math.max(this.sceneRadius * 0.08, 0.025),
        maxDistance: Math.max(this.sceneRadius * 40, orbitDistance * 16),
        pitch: this.getDefaultCameraTilt(resolvedModelReference)
      });
      this.onScenegraphsChanged(scenegraphsFromGLTF);
      this.applyReferenceStudioState();
      if (this.referenceCaptureOptions?.studio) {
        const studioReadyTime = performance.now();
        this.referenceLoadMetrics = {
          loadMilliseconds: studioReadyTime - loadStartTime,
          fetchAndPostprocessMilliseconds: fetchAndPostprocessEndTime - loadStartTime,
          scenegraphCreationMilliseconds: studioReadyTime - scenegraphCreationStartTime
        };
      }

      showError();
    } catch (error) {
      if (this.isLoadStale(loadGeneration)) {
        return;
      }
      log.error(`Failed to load glTF model: ${modelDescription}`, error)();
      if (this.referenceCaptureOptions) {
        window.__lumaGLTFReferenceError = error instanceof Error ? error.message : String(error);
      }
      showError(error);
    } finally {
      if (!this.isLoadStale(loadGeneration)) {
        this.setViewerLoadingState(false);
      }
    }
  }

  private applyReferenceStudioState(): void {
    const studioOptions = this.referenceCaptureOptions?.studio;
    if (!studioOptions) {
      return;
    }

    if (studioOptions.actorCount > 1) {
      this.setAnimationInstanceCount(studioOptions.actorCount);
    }
    this.animationStudio.selectActor(studioOptions.selectedActorIndex);
    this.animationStudio.setCrossFadeDuration(0);
    if (studioOptions.clipName) {
      this.animationStudio.selectClip(studioOptions.clipName);
    }
    this.animationStudio.setSpeed(studioOptions.speed);
    this.animationStudio.setLoop(studioOptions.loop);
    this.animationStudio.seek(studioOptions.time);
    this.animationStudio.setPlaying(false);
    for (const actor of this.animatedCrowd?.actors || []) {
      actor.pause();
    }
    if (studioOptions.morphTarget) {
      const morphTarget = this.animationStudio
        .getState()
        .morphTargets.find(target => target.label === studioOptions.morphTarget);
      if (morphTarget) {
        this.animationStudio.setMorphWeight(morphTarget.identifier, studioOptions.morphWeight);
      }
    }
    if (studioOptions.variant) {
      this.animationStudio.selectVariant(studioOptions.variant);
    }
    this.selectCamera(studioOptions.cameraIndex);
  }

  private getReferenceStudioEvidence(): NonNullable<GLTFReferenceEvidence['studio']> {
    const state = this.animationStudio.getState();
    return {
      actorCount: state.actors.length,
      selectedActorIndex: state.selectedActorIndex,
      selectedClip: state.selectedClip,
      time: state.time,
      duration: state.duration,
      speed: state.speed,
      playing: state.playing,
      loop: state.loop,
      morphTargets: state.morphTargets.map(target => ({label: target.label, value: target.value})),
      selectedVariant: state.selectedVariant,
      skinCount: state.skinCount,
      jointCount: state.jointCount,
      cameraCount: state.cameraCount,
      selectedCameraIndex: this.selectedCameraIndex
    };
  }

  private getCameraState(options: {
    aspect: number;
    far: number;
    near: number;
    orbitDistance: number;
    time: number;
  }): {
    projectionMatrix: Matrix4;
    viewMatrix: Matrix4;
    position: [number, number, number];
  } {
    const authoredCameraState =
      this.selectedCameraIndex === null || !this.scenegraphsFromGLTF
        ? undefined
        : getGLTFStudioCameraState(this.scenegraphsFromGLTF, this.selectedCameraIndex, options);
    if (authoredCameraState) {
      return authoredCameraState;
    }

    const projectionMatrix = new Matrix4().perspective({
      fovy: Math.PI / 3,
      aspect: options.aspect,
      near: options.near,
      far: options.far
    });
    const referenceYaw = this.referenceCaptureOptions?.yaw;
    const referencePitch = this.referenceCaptureOptions?.pitch;
    let position: [number, number, number];
    if (referenceYaw !== undefined && referencePitch !== undefined) {
      const horizontalOrbitScale = Math.cos(referencePitch);
      position = [
        this.center[0] + options.orbitDistance * horizontalOrbitScale * Math.sin(referenceYaw),
        this.cameraHeight +
          options.orbitDistance * CAMERA_TILT_HEIGHT_FACTOR * Math.sin(referencePitch),
        this.center[2] + options.orbitDistance * horizontalOrbitScale * Math.cos(referenceYaw)
      ];
    } else {
      const orbitControlsCameraPosition = this.orbitControls.getEyePosition();
      const distanceScale =
        options.orbitDistance / Math.max(this.orbitControls.distance, Number.EPSILON);
      position = [
        this.center[0] + (orbitControlsCameraPosition[0] - this.center[0]) * distanceScale,
        this.cameraHeight +
          (orbitControlsCameraPosition[1] - this.cameraHeight) *
            CAMERA_TILT_HEIGHT_FACTOR *
            distanceScale,
        this.center[2] + (orbitControlsCameraPosition[2] - this.center[2]) * distanceScale
      ];
    }
    return {
      projectionMatrix,
      viewMatrix: new Matrix4().lookAt({eye: position, center: this.center}),
      position
    };
  }

  getLightingProps(): LightingProps {
    if (this.options['useModelLights'] && this.modelLights.length > 0) {
      return {lights: this.modelLights};
    }

    return lightSources;
  }

  private updateModelInfo(
    modelReference: Required<GLTFModelReference>,
    loadGeneration: number,
    actionNames: readonly string[] = []
  ): void {
    const catalogModel = this.availableModels.find(model => model.name === modelReference.name);
    updateModelInfoBox(catalogModel, modelReference, actionNames);
    if (this.referenceCaptureOptions) {
      return;
    }

    void this.fetchModelMetadata(modelReference.name).then(modelMetadata => {
      if (this.isLoadStale(loadGeneration)) {
        return;
      }

      const mutableCatalogModel = this.availableModels.find(
        model => model.name === modelReference.name
      );
      if (mutableCatalogModel) {
        Object.assign(mutableCatalogModel, modelMetadata);
        updateModelInfoBox(mutableCatalogModel, modelReference, actionNames);
        return;
      }

      updateModelInfoBox(
        {
          label: modelReference.name,
          name: modelReference.name,
          ...modelMetadata
        },
        modelReference,
        actionNames
      );
    });
  }

  private fetchModelMetadata(modelName: string): Promise<GLTFModelMetadata> {
    if (!this.modelMetadataCache.has(modelName)) {
      this.modelMetadataCache.set(modelName, loadModelMetadata(modelName));
    }

    return this.modelMetadataCache.get(modelName)!;
  }
}

function getReferenceCaptureCatalogModel(
  captureOptions: GLTFReferenceCaptureOptions
): GLTFCatalogModel {
  if (captureOptions.modelName === BUMP_MATERIAL_CATALOG_MODEL.name) {
    return BUMP_MATERIAL_CATALOG_MODEL;
  }

  return {
    label: captureOptions.modelName,
    name: captureOptions.modelName,
    hasGLBVariant: captureOptions.variant === 'glTF-Binary',
    variants: {[captureOptions.variant]: captureOptions.fileName}
  };
}

function setModelMenu(
  items: GLTFCatalogModel[],
  currentItem: string,
  onMenuItemSelected: (item: string) => void
): () => void {
  const modelSelector = document.getElementById('model-select') as HTMLSelectElement;
  if (!modelSelector) {
    return () => {};
  }

  modelSelector.replaceChildren();
  const changeHandler = (event: Event) => {
    const name = (event.target as HTMLSelectElement).value;
    onMenuItemSelected(name);
  };
  modelSelector.addEventListener('change', changeHandler);

  const options = items.map(item => {
    const option = document.createElement('option');
    option.value = item.name;
    option.textContent = item.label || item.name;
    return option;
  });

  modelSelector.append(...options);
  modelSelector.value = currentItem;

  return () => modelSelector.removeEventListener('change', changeHandler);
}

function normalizeModelReference(
  modelReference: string | GLTFModelReference
): Required<GLTFModelReference> {
  if (typeof modelReference === 'string') {
    return {
      fileName: `${modelReference}.gltf`,
      name: modelReference,
      variant: 'glTF'
    };
  }

  return {
    fileName: modelReference.fileName || `${modelReference.name}.gltf`,
    name: modelReference.name,
    variant: modelReference.variant || 'glTF'
  };
}

function getModelLoadCandidates(
  modelReference: string | GLTFModelReference,
  availableModels: GLTFCatalogModel[]
): Required<GLTFModelReference>[] {
  if (typeof modelReference === 'string') {
    const catalogModel = availableModels.find(model => model.name === modelReference);
    if (catalogModel) {
      return [getCatalogModelReference(catalogModel)];
    }

    return [
      {
        fileName: `${modelReference}.glb`,
        name: modelReference,
        variant: 'glTF-Binary'
      },
      {
        fileName: `${modelReference}.gltf`,
        name: modelReference,
        variant: 'glTF'
      }
    ];
  }

  return [normalizeModelReference(modelReference)];
}

function getCatalogModelReference(model: GLTFCatalogModel): Required<GLTFModelReference> {
  if (model.hasGLBVariant) {
    return {
      fileName: `${model.name}.glb`,
      name: model.name,
      variant: 'glTF-Binary'
    };
  }

  return {
    fileName: `${model.name}.gltf`,
    name: model.name,
    variant: 'glTF'
  };
}

async function loadPreferredGLTF(candidateModelReferences: Required<GLTFModelReference>[]) {
  let lastError: unknown;

  for (let index = 0; index < candidateModelReferences.length; index++) {
    const candidateModelReference = candidateModelReferences[index];
    const modelUrl = getModelUrl(candidateModelReference);

    try {
      const gltf = await load(modelUrl, GLTFLoader);
      return {
        gltf,
        modelUrl,
        resolvedModelReference: candidateModelReference
      };
    } catch (error) {
      lastError = error;
      if (index < candidateModelReferences.length - 1) {
        log.log(
          0,
          `Preferred glTF variant unavailable, trying fallback: ${candidateModelReference.name} (${candidateModelReference.variant})`,
          error
        )();
        continue;
      }
    }
  }

  throw lastError;
}

function getModelUrl(modelReference: Required<GLTFModelReference>): string {
  if (modelReference.name === 'RobotExpressive') {
    return ROBOT_EXPRESSIVE_MODEL_URL;
  }
  if (modelReference.name === 'SimpleSkinLOD') {
    return SIMPLE_SKIN_LOD_MODEL_URL;
  }
  if (modelReference.name === 'BumpMaterial') {
    return BUMP_MATERIAL_MODEL_URL;
  }

  return `${MODEL_DIRECTORY_URL}/${modelReference.name}/${modelReference.variant}/${modelReference.fileName}`;
}

function setOptionsUI(options: Record<string, boolean>): Array<() => void> {
  const cleanupCallbacks: Array<() => void> = [];
  for (const id of Object.keys(options)) {
    const checkbox = document.getElementById(id) as HTMLInputElement;
    if (checkbox) {
      checkbox.checked = options[id];
      const changeHandler = () => {
        options[id] = checkbox.checked;
        saveOptions(options);
      };
      checkbox.addEventListener('change', changeHandler);
      cleanupCallbacks.push(() => checkbox.removeEventListener('change', changeHandler));
    }
  }
  return cleanupCallbacks;
}

function loadOptions(defaultOptions: Record<string, boolean>): Record<string, boolean> {
  const savedOptions = window.localStorage[GLTF_OPTIONS_STORAGE_KEY];
  if (!savedOptions) {
    return {...defaultOptions};
  }

  try {
    const parsedOptions = JSON.parse(savedOptions) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(defaultOptions).map(([key, value]) => [key, parsedOptions[key] ?? value])
    ) as Record<string, boolean>;
  } catch {
    return {...defaultOptions};
  }
}

export function saveOptions(options: Record<string, boolean>) {
  window.localStorage[GLTF_OPTIONS_STORAGE_KEY] = JSON.stringify(options);
}

function ensureLoadingIndicatorStyles(): void {
  if (document.getElementById(GLTF_LOADING_STYLE_ID)) {
    return;
  }

  const style = document.createElement('style');
  style.id = GLTF_LOADING_STYLE_ID;
  style.textContent = `
    @keyframes gltfLoadingSpinnerRotation {
      to {
        transform: rotate(360deg);
      }
    }

    .gltf-loading-indicator {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 18px;
      height: 18px;
      color: #2a2a2a;
      flex: 0 0 auto;
    }

    .gltf-loading-indicator[hidden] {
      display: none !important;
    }

    .gltf-loading-spinner {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(0, 0, 0, 0.15);
      border-top-color: #0b63ce;
      border-radius: 999px;
      animation: gltfLoadingSpinnerRotation 0.8s linear infinite;
      flex: 0 0 auto;
    }
  `;
  document.head.append(style);
}

function getModelDescription(modelName: string, variant: string): string {
  return variant === 'glTF' ? modelName : `${modelName} (${variant})`;
}

function getModelLoadingLabel(modelDescription: string): string {
  return `Loading ${modelDescription}...`;
}

async function loadModelMetadata(modelName: string): Promise<GLTFModelMetadata> {
  if (modelName === 'RobotExpressive' || modelName === 'SimpleSkinLOD') {
    return GLTF_MODEL_METADATA_OVERRIDES[modelName] || {};
  }

  const readmeUrl = `${MODEL_DIRECTORY_URL}/${modelName}/README.md`;

  try {
    const response = await fetch(readmeUrl);
    if (!response.ok) {
      return GLTF_MODEL_METADATA_OVERRIDES[modelName] || {};
    }

    const markdown = await response.text();
    const summary = extractReadmeSection(markdown, 'Summary');
    const description = getFirstParagraph(extractReadmeSection(markdown, 'Description'));

    return {
      summary: summary || GLTF_MODEL_METADATA_OVERRIDES[modelName]?.summary,
      description: GLTF_MODEL_METADATA_OVERRIDES[modelName]?.description || description
    };
  } catch {
    return GLTF_MODEL_METADATA_OVERRIDES[modelName] || {};
  }
}

function extractReadmeSection(markdown: string, sectionName: string): string | undefined {
  const sectionMatch = new RegExp(
    `## ${escapeRegExp(sectionName)}\\s*\\n\\n([\\s\\S]*?)(?=\\n##\\s|$)`
  ).exec(markdown);
  if (!sectionMatch) {
    return undefined;
  }

  const normalizedSection = normalizeMarkdown(sectionMatch[1]);
  return normalizedSection || undefined;
}

function normalizeMarkdown(markdown: string): string {
  return markdown
    .replace(/!\[[^\]]*]\([^)]+\)\s*/g, '')
    .replace(/<br[^>]*\/?>.*$/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function getFirstParagraph(markdownSection: string | undefined): string | undefined {
  if (!markdownSection) {
    return undefined;
  }

  return markdownSection
    .split(/\n\s*\n/)
    .map(paragraph => paragraph.trim())
    .find(Boolean);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function setLoadingState(isLoading: boolean, message?: string): void {
  const loadingIndicator = document.getElementById('loading-state') as HTMLDivElement | null;

  if (loadingIndicator) {
    loadingIndicator.hidden = !isLoading;
    loadingIndicator.title = message || 'Loading model...';
    loadingIndicator.setAttribute('aria-label', message || 'Loading model...');
  }

  for (const controlId of ['model-select', 'extension-select']) {
    const control = document.getElementById(controlId) as HTMLInputElement | null;
    if (control) {
      control.disabled = isLoading;
    }
  }
}

function updateModelInfoBox(
  model?: Pick<GLTFCatalogModel, 'label' | 'name' | 'summary' | 'description'>,
  modelReference?: Required<GLTFModelReference>,
  actionNames: readonly string[] = []
): void {
  const container = document.getElementById(GLTF_MODEL_INFO_ID) as HTMLDivElement | null;
  if (!container) {
    return;
  }

  const summary = model?.summary?.trim();
  const description = model?.description?.trim();
  if (!model && !modelReference) {
    container.replaceChildren();
    container.style.display = 'none';
    return;
  }

  container.replaceChildren();
  container.style.display = summary || description || modelReference ? 'block' : 'none';

  const title = document.createElement('div');
  title.style.fontWeight = '600';
  title.style.marginBottom = '4px';
  title.textContent = model?.label || model?.name || modelReference?.name || '';
  container.append(title);

  if (modelReference?.variant) {
    const variant = document.createElement('div');
    variant.style.fontSize = '12px';
    variant.style.opacity = '0.7';
    variant.style.marginBottom = '6px';
    variant.textContent = modelReference.variant;
    container.append(variant);
  }

  if (actionNames.length) {
    const actions = document.createElement('div');
    actions.style.fontSize = '12px';
    actions.style.marginBottom = '6px';
    actions.textContent = `Actions: ${actionNames.join(' · ')}`;
    container.append(actions);
  }

  const studioAsset = getGLTFStudioAsset(modelReference?.name || model?.name || '');
  if (studioAsset?.features.length) {
    const features = document.createElement('div');
    features.style.fontSize = '12px';
    features.style.marginBottom = '6px';
    features.textContent = `Ledger features: ${studioAsset.features
      .map(
        feature => `${feature.extensionName} (${feature.standardStatus}; ${feature.supportLevel})`
      )
      .join(' · ')}`;
    container.append(features);
  }
  if (studioAsset) {
    const provenance = document.createElement('div');
    provenance.style.fontSize = '12px';
    provenance.style.marginBottom = '6px';
    provenance.textContent =
      `Provenance: ${studioAsset.source}@${studioAsset.sourceRevision} · ` +
      `${studioAsset.license} · ${studioAsset.licenseLocation}`;
    container.append(provenance);
  }

  if (summary) {
    const summaryParagraph = document.createElement('p');
    summaryParagraph.style.margin = '0 0 6px 0';
    summaryParagraph.textContent = summary;
    container.append(summaryParagraph);
  }

  if (description) {
    const descriptionParagraph = document.createElement('p');
    descriptionParagraph.style.margin = '0';
    descriptionParagraph.textContent = description;
    container.append(descriptionParagraph);
  }
}

function showError(error?: unknown) {
  const errorDiv = document.getElementById('error') as HTMLDivElement;
  if (!errorDiv) {
    return;
  }

  errorDiv.textContent = error ? `Error loading model: ${getErrorMessage(error)}` : '';
  errorDiv.style.display = error ? 'block' : 'none';
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function updateModelLightIndicator(modelLights: Light[], useModelLights: boolean) {
  const indicator = document.getElementById('model-light-indicator') as HTMLDivElement;
  if (!indicator) {
    return;
  }

  const summary = getModelLightSummary(modelLights);
  const activeSource =
    useModelLights && modelLights.length > 0 ? 'using model lights' : 'using fallback demo lights';
  indicator.textContent = `Model lights: ${summary}; ${activeSource}.`;
}

function getAnimationClipNames(
  scenegraphs: Pick<ReturnType<typeof createScenegraphsFromGLTF>, 'animations'>
): string[] {
  return Array.from(
    new Set(
      scenegraphs.animations
        .map(animation => animation.name)
        .filter((name): name is string => Boolean(name))
    )
  );
}

function updateAnimationStudioInfo(state: GLTFAnimationStudioState): void {
  const container = document.getElementById(GLTF_ANIMATION_INFO_ID) as HTMLDivElement | null;
  if (!container) {
    return;
  }

  container.hidden =
    state.clipNames.length === 0 &&
    state.morphTargets.length === 0 &&
    state.variants.length === 0 &&
    state.cameraCount === 0;
  const summary = formatGLTFAnimationStudioInfo(state);
  if (container.textContent !== summary) {
    container.textContent = summary;
  }
}

export function formatGLTFAnimationStudioInfo(state: GLTFAnimationStudioState): string {
  const actor = state.actors[state.selectedActorIndex];
  const playback = state.selectedClip
    ? `Actor ${state.selectedActorIndex + 1}/${Math.max(1, state.actors.length)} · ` +
      `${state.selectedClip} · ${state.time.toFixed(2)} / ${state.duration.toFixed(2)} s · ` +
      `${state.speed.toFixed(2)}× · ${state.playing ? 'playing' : 'paused'}`
    : 'No authored animation clips';
  const capabilities = [
    state.skinCount ? `${state.skinCount} skins / ${state.jointCount} joints` : undefined,
    state.morphTargets.length ? `${state.morphTargets.length} morph targets` : undefined,
    state.variants.length ? `${state.variants.length} material variants` : undefined,
    state.cameraCount ? `${state.cameraCount} authored cameras` : undefined,
    actor?.id && state.actors.length > 1 ? actor.id : undefined
  ].filter((value): value is string => Boolean(value));
  return capabilities.length ? `${playback} · ${capabilities.join(' · ')}` : playback;
}

function updateCrowdInfo(
  actorCount: number = 1,
  drawCount: number = 0,
  actionNames: readonly string[] = [],
  levelOfDetailStats?: GLTFAnimatedCrowd['lodStats'],
  animationStats?: GLTFAnimatedCrowd['animationStats']
): void {
  const container = document.getElementById(GLTF_CROWD_INFO_ID) as HTMLDivElement | null;
  if (!container) {
    return;
  }

  container.hidden = actorCount <= 1;
  const summary = formatGLTFCrowdInfo(
    actorCount,
    drawCount,
    actionNames,
    levelOfDetailStats,
    animationStats
  );
  if (container.textContent !== summary) {
    container.textContent = summary;
  }
}

/** Formats real actor, draw, and optional level-of-detail work for the Studio status readout. */
export function formatGLTFCrowdInfo(
  actorCount: number,
  drawCount: number,
  actionNames: readonly string[] = [],
  levelOfDetailStats?: GLTFAnimatedCrowd['lodStats'],
  animationStats?: GLTFAnimatedCrowd['animationStats']
): string {
  const actionSummary = actionNames.length
    ? ` · ${actionNames.length > 1 ? 'Mixed actions' : 'Action'}: ${actionNames.join(', ')}`
    : '';
  const activeLevels = levelOfDetailStats?.levels.filter(level => level.actors > 0) || [];
  const levelSummary = activeLevels.length
    ? activeLevels.map(level => `L${level.level}: ${level.actors.toLocaleString()}`).join(' · ')
    : 'No visible levels';
  const levelSource =
    levelOfDetailStats?.source === 'authored'
      ? 'Authored LOD'
      : levelOfDetailStats?.source === 'generated'
        ? 'Generated LOD'
        : 'Single-level geometry';
  const vertexBudgetSummary = levelOfDetailStats
    ? ` · Vertices: ${levelOfDetailStats.vertices.toLocaleString()}` +
      (levelOfDetailStats.vertexBudget
        ? ` / ${levelOfDetailStats.vertexBudget.toLocaleString()}` +
          ` · Demoted: ${levelOfDetailStats.demotedActors.toLocaleString()}` +
          (levelOfDetailStats.budgetSatisfied ? '' : ' · Budget exceeded')
        : '')
    : '';
  const levelOfDetailSummary = levelOfDetailStats
    ? ` · ${levelSource}` +
      ` · ${levelSummary} · Visible: ${levelOfDetailStats.visibleActors.toLocaleString()}` +
      ` · Culled: ${levelOfDetailStats.culledActors.toLocaleString()}` +
      ` · Triangles: ${levelOfDetailStats.triangles.toLocaleString()}` +
      vertexBudgetSummary
    : '';
  const animationSummary =
    animationStats?.mode === 'gpu'
      ? ` · GPU sampled: ${animationStats.frameCount.toLocaleString()} frames` +
        (animationStats.sampleRate ? ` @ ${animationStats.sampleRate} fps` : '') +
        (animationStats.morphGroupCount
          ? ` · Morph groups: ${animationStats.morphGroupCount.toLocaleString()}`
          : '')
      : '';
  return actorCount > 1
    ? `${actorCount.toLocaleString()} independently animated actors · ${drawCount} shared GPU draws${actionSummary}${animationSummary}${levelOfDetailSummary}`
    : '';
}

function updateExtensionSupportTable(extensionSupport?: GLTFExtensionSupportMap) {
  const container = document.getElementById('extension-support') as HTMLDivElement;
  if (!container) {
    return;
  }

  container.replaceChildren();

  const title = document.createElement('div');
  title.textContent = 'glTF extensions';
  title.style.fontWeight = '600';
  container.append(title);

  if (!extensionSupport?.size) {
    const emptyState = document.createElement('div');
    emptyState.style.marginTop = '6px';
    emptyState.textContent = 'No glTF extensions reported by this asset.';
    container.append(emptyState);
    return;
  }

  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.marginTop = '6px';
  table.style.borderCollapse = 'collapse';
  table.append(
    createTableRow([
      {text: 'Extension', header: true},
      {text: 'Built-in', header: true, align: 'center'},
      {text: 'Notes', header: true}
    ])
  );

  for (const supportInfo of extensionSupport.values()) {
    table.append(
      createTableRow([
        {text: supportInfo.extensionName, code: true},
        {
          text: supportInfo.supported ? '✓' : '✕',
          align: 'center',
          color: supportInfo.supported ? '#0b8457' : '#b00020',
          title: getSupportLevelLabel(supportInfo.supportLevel)
        },
        {text: supportInfo.comment}
      ])
    );
  }

  container.append(table);
}

function createTableRow(
  cells: Array<{
    text: string;
    header?: boolean;
    code?: boolean;
    align?: 'left' | 'center' | 'right';
    color?: string;
    title?: string;
  }>
): HTMLTableRowElement {
  const row = document.createElement('tr');

  for (const cellInfo of cells) {
    const cell = document.createElement(cellInfo.header ? 'th' : 'td');
    cell.style.borderTop = '1px solid #d7d7d7';
    cell.style.padding = '6px 4px';
    cell.style.textAlign = cellInfo.align || 'left';
    cell.style.verticalAlign = 'top';
    cell.title = cellInfo.title || '';

    if (cellInfo.color) {
      cell.style.color = cellInfo.color;
    }

    if (cellInfo.header) {
      cell.style.fontWeight = '600';
    }

    if (cellInfo.code) {
      const code = document.createElement('code');
      code.textContent = cellInfo.text;
      cell.append(code);
    } else {
      cell.textContent = cellInfo.text;
    }

    row.append(cell);
  }

  return row;
}

function getSupportLevelLabel(supportLevel: GLTFExtensionSupportLevel): string {
  switch (supportLevel) {
    case 'built-in':
      return 'Built-in support';

    case 'parsed-and-wired':
      return 'Parsed and wired only';

    case 'loader-only':
      return 'Loader-only support';

    default:
      return 'Not supported';
  }
}

function getModelLightSummary(modelLights: Light[]): string {
  if (modelLights.length === 0) {
    return 'none detected';
  }

  const lightCounts: Partial<Record<Light['type'], number>> = {};
  for (const light of modelLights) {
    lightCounts[light.type] = (lightCounts[light.type] ?? 0) + 1;
  }

  return Object.entries(lightCounts)
    .map(([lightType, count]) => `${count} ${lightType}`)
    .join(', ');
}

function clampNumber(value: number, minValue: number, maxValue: number): number {
  return Math.min(Math.max(value, minValue), maxValue);
}

function destroyScenegraphs(scenegraphsFromGLTF?: ReturnType<typeof createScenegraphsFromGLTF>) {
  scenegraphsFromGLTF?.destroy();
}
