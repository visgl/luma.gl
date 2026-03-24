// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {AnimationLoopTemplate, AnimationProps, ModelNode} from '@luma.gl/engine';
import {Color, Device, RenderPass, log} from '@luma.gl/core';
import {load} from '@loaders.gl/core';
import {Light, LightingProps, type PBRMaterialUniforms} from '@luma.gl/shadertools';
import {createScenegraphsFromGLTF, type PBREnvironment} from '@luma.gl/gltf';
import {GLTFLoader, postProcessGLTF} from '@loaders.gl/gltf';
import {Matrix4} from '@math.gl/core';

/* eslint-disable camelcase */

const MODEL_DIRECTORY_URL =
  'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models';
const MODEL_LIST_URL = `${MODEL_DIRECTORY_URL}/model-index.json`;
const LAST_GLTF_MODEL_STORAGE_KEY = 'last-gltf-model';
const GLTF_OPTIONS_STORAGE_KEY = 'showcase-gltf-options';
const GLTF_LOADING_STYLE_ID = 'gltf-loading-indicator-style';
export const GLTF_MODEL_INFO_ID = 'model-info';
export const GLTF_CONTROL_PANEL_STYLE = 'display: grid; gap: 8px;';
export const GLTF_CONTROL_ROW_STYLE =
  'display: grid; grid-template-columns: 7rem minmax(0, 1fr); align-items: center; column-gap: 0.75rem;';
export const GLTF_SELECT_STYLE = 'width: 100%; min-width: 0;';
const MAX_CAMERA_TILT = 0.7;
const CAMERA_TILT_HEIGHT_FACTOR = 0.35;

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
type GLTFModelMetadata = Pick<GLTFCatalogModel, 'summary' | 'description'>;

const GLTF_MODEL_METADATA_OVERRIDES: Record<string, GLTFModelMetadata> = {
  PotOfCoalsAnimationPointer: {
    description:
      'A non-reflective bumpy glass-like surface distorts the hot coals underneath, using KHR_animation_pointer to animate the heat refraction effect.'
  }
};
export type GLTFModelReference = {
  name: string;
  variant?: string;
  fileName?: string;
};

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = INFO_HTML;

  device: Device;
  availableModels: GLTFCatalogModel[] = [];
  scenegraphsFromGLTF?: ReturnType<typeof createScenegraphsFromGLTF>;
  modelLights: Light[] = [];
  center = [0, 0, 0];
  cameraHeight = 0;
  cameraOrbitDistance = 1;
  minCameraOrbitDistance = 0.05;
  maxCameraOrbitDistance = 40;
  sceneRadius = 1;
  mouseCameraTime = 0;
  mouseCameraTilt = 0;
  options: Record<string, boolean> = {
    useModelLights: true,
    cameraAnimation: true,
    gltfAnimation: true
  };
  isFinalized: boolean = false;
  gltfLoadGeneration: number = 0;
  cleanupCallbacks: Array<() => void> = [];
  modelMetadataCache = new Map<string, Promise<GLTFModelMetadata>>();

  constructor({device}: AnimationProps) {
    super();
    this.device = device;
    ensureLoadingIndicatorStyles();
    this.options = loadOptions(this.options);

    const modelStorageKey = this.getModelStorageKey();
    window.localStorage[modelStorageKey] ??= this.getDefaultModelName();
    const initialModelName = window.localStorage[modelStorageKey];

    this.cleanupCallbacks.push(...setOptionsUI(this.options));

    this.fetchModelList()
      .then(models => {
        if (this.isFinalized) {
          return;
        }
        this.availableModels = models;
        const cleanupModelMenu = this.initializeModelMenus(models, initialModelName);
        this.cleanupCallbacks.push(cleanupModelMenu);
        this.loadGLTF(initialModelName);
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

    const mouseMoveHandler = (event: Event) => {
      const mouseEvent = event as MouseEvent;
      if (mouseEvent.buttons) {
        this.mouseCameraTime -= mouseEvent.movementX * 3.5;
        this.mouseCameraTilt = clampNumber(
          this.mouseCameraTilt - mouseEvent.movementY * 0.01,
          -MAX_CAMERA_TILT,
          MAX_CAMERA_TILT
        );
      }
    };
    const canvas = this.device.getDefaultCanvasContext().canvas;
    canvas.addEventListener('mousemove', mouseMoveHandler);
    this.cleanupCallbacks.push(() => canvas.removeEventListener('mousemove', mouseMoveHandler));

    const mouseWheelHandler = (event: Event) => {
      const wheelEvent = event as WheelEvent;
      wheelEvent.preventDefault();
      const zoomFactor = Math.exp(clampNumber(wheelEvent.deltaY, -240, 240) * 0.0015);
      this.cameraOrbitDistance = clampNumber(
        this.cameraOrbitDistance * zoomFactor,
        this.minCameraOrbitDistance,
        this.maxCameraOrbitDistance
      );
    };
    canvas.addEventListener('wheel', mouseWheelHandler, {passive: false});
    this.cleanupCallbacks.push(() =>
      canvas.removeEventListener('wheel', mouseWheelHandler as EventListener)
    );
  }

  onFinalize() {
    this.isFinalized = true;
    this.gltfLoadGeneration++;
    for (const cleanupCallback of this.cleanupCallbacks) {
      cleanupCallback();
    }
    this.cleanupCallbacks = [];
    destroyScenegraphs(this.scenegraphsFromGLTF);
    this.scenegraphsFromGLTF = undefined;
    this.modelLights = [];
    this.setViewerLoadingState(false);
    updateModelInfoBox();
    updateExtensionSupportTable();
  }

  getDefaultModelName(): string {
    return 'CesiumMan';
  }

  getModelStorageKey(): string {
    return LAST_GLTF_MODEL_STORAGE_KEY;
  }

  getClearColor(): Color {
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

  onRender({aspect, device, time}: AnimationProps): void {
    const renderPass = device.beginRenderPass({clearColor: this.getClearColor(), clearDepth: 1});
    this.drawBackground(renderPass);

    if (!this.scenegraphsFromGLTF?.scenes?.length) {
      renderPass.end();
      return;
    }

    updateModelLightIndicator(this.modelLights, this.options['useModelLights']);

    const orbitDistance = this.cameraOrbitDistance;
    const far = Math.max(orbitDistance + this.sceneRadius * 8, 10);
    const near = Math.max(this.sceneRadius / 1000, 0.01);
    const projectionMatrix = new Matrix4().perspective({fovy: Math.PI / 3, aspect, near, far});
    const cameraTime = this.options['cameraAnimation'] ? time : this.mouseCameraTime;
    const orbitAngle = 0.001 * cameraTime;
    const horizontalOrbitScale = Math.cos(this.mouseCameraTilt);
    const verticalOrbitOffset =
      orbitDistance * CAMERA_TILT_HEIGHT_FACTOR * Math.sin(this.mouseCameraTilt);
    const cameraPos = [
      orbitDistance * horizontalOrbitScale * Math.sin(orbitAngle),
      this.cameraHeight + verticalOrbitOffset,
      orbitDistance * horizontalOrbitScale * Math.cos(orbitAngle)
    ];

    if (this.options['gltfAnimation']) {
      this.scenegraphsFromGLTF.animator?.setTime(time);
    }

    const viewMatrix = new Matrix4().lookAt({eye: cameraPos, center: this.center});

    const pbrMaterialProps = this.getPBRMaterialProps();
    const hasPBRMaterialProps = Object.keys(pbrMaterialProps).length > 0;

    this.scenegraphsFromGLTF.scenes[0].traverse((node, {worldMatrix: modelMatrix}) => {
      const {model} = node as ModelNode;

      const modelViewProjectionMatrix = new Matrix4(projectionMatrix)
        .multiplyRight(viewMatrix)
        .multiplyRight(modelMatrix);

      const sceneShaderInputProps: Record<string, unknown> = {
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
      };

      if (hasPBRMaterialProps) {
        if (model.material?.ownsModule('pbrMaterial')) {
          model.material.setProps({pbrMaterial: pbrMaterialProps});
        } else {
          sceneShaderInputProps.pbrMaterial = pbrMaterialProps;
        }
      }

      model.shaderInputs.setProps(sceneShaderInputProps);
      model.draw(renderPass);
    });
    renderPass.end();
  }

  async fetchModelList(): Promise<GLTFCatalogModel[]> {
    const response = await fetch(MODEL_LIST_URL);
    const models = (await response.json()) as GLTFCatalogModel[];
    return models.map(model => ({
      ...model,
      hasGLBVariant: Boolean(model.variants?.['glTF-Binary'])
    }));
  }

  async loadGLTF(modelReference: string | GLTFModelReference) {
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

      const scenegraphsFromGLTF = createScenegraphsFromGLTF(this.device, processedGLTF, {
        lights: true,
        imageBasedLightingEnvironment,
        pbrDebug: false,
        useTangents: true
      });
      log.log(0, `Created glTF scenegraphs: ${modelDescription}`)();

      if (this.isLoadStale(loadGeneration)) {
        destroyScenegraphs(scenegraphsFromGLTF);
        return;
      }

      destroyScenegraphs(this.scenegraphsFromGLTF);
      this.scenegraphsFromGLTF = scenegraphsFromGLTF;
      this.modelLights = scenegraphsFromGLTF.lights;
      this.updateModelInfo(resolvedModelReference, loadGeneration);
      updateExtensionSupportTable(scenegraphsFromGLTF.extensionSupport);

      const activeSceneBounds =
        scenegraphsFromGLTF.sceneBounds[0] || scenegraphsFromGLTF.modelBounds;
      this.center = [...activeSceneBounds.center];
      this.sceneRadius = activeSceneBounds.radius;
      const orbitDistance = activeSceneBounds.recommendedOrbitDistance;
      this.cameraHeight = this.center[1] + this.sceneRadius * 0.35;
      this.minCameraOrbitDistance = Math.max(this.sceneRadius * 0.08, 0.025);
      this.maxCameraOrbitDistance = Math.max(this.sceneRadius * 40, orbitDistance * 16);
      this.cameraOrbitDistance = clampNumber(
        orbitDistance,
        this.minCameraOrbitDistance,
        this.maxCameraOrbitDistance
      );
      this.mouseCameraTilt = clampNumber(
        this.getDefaultCameraTilt(resolvedModelReference),
        -MAX_CAMERA_TILT,
        MAX_CAMERA_TILT
      );

      showError();
    } catch (error) {
      if (this.isLoadStale(loadGeneration)) {
        return;
      }
      log.error(`Failed to load glTF model: ${modelDescription}`, error)();
      showError(error);
    } finally {
      if (!this.isLoadStale(loadGeneration)) {
        this.setViewerLoadingState(false);
      }
    }
  }

  getLightingProps(): LightingProps {
    if (this.options['useModelLights'] && this.modelLights.length > 0) {
      return {lights: this.modelLights};
    }

    return lightSources;
  }

  private updateModelInfo(
    modelReference: Required<GLTFModelReference>,
    loadGeneration: number
  ): void {
    const catalogModel = this.availableModels.find(model => model.name === modelReference.name);
    updateModelInfoBox(catalogModel, modelReference);

    void this.fetchModelMetadata(modelReference.name).then(modelMetadata => {
      if (this.isLoadStale(loadGeneration)) {
        return;
      }

      const mutableCatalogModel = this.availableModels.find(
        model => model.name === modelReference.name
      );
      if (mutableCatalogModel) {
        Object.assign(mutableCatalogModel, modelMetadata);
        updateModelInfoBox(mutableCatalogModel, modelReference);
        return;
      }

      updateModelInfoBox(
        {
          label: modelReference.name,
          name: modelReference.name,
          ...modelMetadata
        },
        modelReference
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

function saveOptions(options: Record<string, boolean>) {
  window.localStorage[GLTF_OPTIONS_STORAGE_KEY] = JSON.stringify(options);
}

function clampNumber(value: number, minValue: number, maxValue: number): number {
  return Math.min(maxValue, Math.max(minValue, value));
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
  modelReference?: Required<GLTFModelReference>
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

function destroyScenegraphs(scenegraphsFromGLTF?: ReturnType<typeof createScenegraphsFromGLTF>) {
  for (const scene of scenegraphsFromGLTF?.scenes || []) {
    scene.traverse(node => {
      const model = (node as Partial<ModelNode>).model;
      model?.destroy();
    });
  }
}
