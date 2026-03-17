// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {AnimationLoopTemplate, AnimationProps, ModelNode} from '@luma.gl/engine';
import {Device} from '@luma.gl/core';
import {load} from '@loaders.gl/core';
import {Light, LightingProps} from '@luma.gl/shadertools';
import {createScenegraphsFromGLTF} from '@luma.gl/gltf';
import {GLTFLoader, postProcessGLTF} from '@loaders.gl/gltf';
import {Matrix4} from '@math.gl/core';

/* eslint-disable camelcase */

const MODEL_DIRECTORY_URL =
  'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models';
const MODEL_LIST_URL = `${MODEL_DIRECTORY_URL}/model-index.json`;
const LAST_GLTF_MODEL_STORAGE_KEY = 'last-gltf-model';
const GLTF_OPTIONS_STORAGE_KEY = 'hello-gltf-options';

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
<div id="model-options">
  <div>
    <label for="model-select">Model</label>
    <select id="model-select"></select>
  </div>
  <div><label><input type="checkbox" id="useModelLights" />Use Model Lights</label></div>
  <div><label><input type="checkbox" id="cameraAnimation" />Camera Animation</label></div>
  <div><label><input type="checkbox" id="gltfAnimation" />glTF Animation</label></div>
</div>
<div id="model-light-indicator" style="margin-top: 8px;"></div>
<div id="error" style="color: #b00020; margin-top: 8px;"></div>
`;

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = INFO_HTML;

  device: Device;
  scenegraphsFromGLTF?: ReturnType<typeof createScenegraphsFromGLTF>;
  modelLights: Light[] = [];
  center = [0, 0, 0];
  cameraPos = [0, 0, 0];
  mouseCameraTime = 0;
  options: Record<string, boolean> = {
    useModelLights: true,
    cameraAnimation: true,
    gltfAnimation: false
  };
  isFinalized: boolean = false;
  gltfLoadGeneration: number = 0;
  cleanupCallbacks: Array<() => void> = [];

  constructor({device}: AnimationProps) {
    super();
    this.device = device;
    this.options = loadOptions(this.options);

    const modelStorageKey = this.getModelStorageKey();
    window.localStorage[modelStorageKey] ??= this.getDefaultModelName();
    this.loadGLTF(window.localStorage[modelStorageKey]);

    this.cleanupCallbacks.push(...setOptionsUI(this.options));

    this.fetchModelList().then(models => {
      if (this.isFinalized) {
        return;
      }
      const currentModel = window.localStorage[modelStorageKey];
      const cleanupModelMenu = setModelMenu(
        models.map(model => model.name),
        currentModel,
        (modelName: string) => {
          this.loadGLTF(modelName);
          window.localStorage[modelStorageKey] = modelName;
        }
      );
      this.cleanupCallbacks.push(cleanupModelMenu);
    });

    const mouseMoveHandler = (event: Event) => {
      const mouseEvent = event as MouseEvent;
      if (mouseEvent.buttons) {
        this.mouseCameraTime -= mouseEvent.movementX * 3.5;
      }
    };
    const canvas = this.device.getDefaultCanvasContext().canvas;
    canvas.addEventListener('mousemove', mouseMoveHandler);
    this.cleanupCallbacks.push(() => canvas.removeEventListener('mousemove', mouseMoveHandler));
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
  }

  getDefaultModelName(): string {
    return 'CesiumMan';
  }

  getModelStorageKey(): string {
    return LAST_GLTF_MODEL_STORAGE_KEY;
  }

  onRender({aspect, device, time}: AnimationProps): void {
    if (!this.scenegraphsFromGLTF?.scenes?.length) {
      return;
    }

    updateModelLightIndicator(this.modelLights, this.options['useModelLights']);
    const renderPass = device.beginRenderPass({clearColor: [0, 0, 0, 1], clearDepth: 1});

    const far = 2 * this.cameraPos[0];
    const near = far / 1000;
    const projectionMatrix = new Matrix4().perspective({fovy: Math.PI / 3, aspect, near, far});
    const cameraTime = this.options['cameraAnimation'] ? time : this.mouseCameraTime;
    const cameraPos = [
      this.cameraPos[0] * Math.sin(0.001 * cameraTime),
      this.cameraPos[1],
      this.cameraPos[2] * Math.cos(0.001 * cameraTime)
    ];

    if (this.options['gltfAnimation']) {
      this.scenegraphsFromGLTF.animator?.setTime(time);
    }

    const viewMatrix = new Matrix4().lookAt({eye: cameraPos, center: this.center});

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
      model.draw(renderPass);
    });
    renderPass.end();
  }

  async fetchModelList(): Promise<{name: string}[]> {
    const response = await fetch(MODEL_LIST_URL);
    const models = await response.json();
    return models;
  }

  async loadGLTF(modelName: string) {
    const loadGeneration = ++this.gltfLoadGeneration;
    const canvas = this.device.getDefaultCanvasContext().canvas as HTMLCanvasElement;

    try {
      canvas.style.opacity = '0.1';

      const gltf = await load(
        `${MODEL_DIRECTORY_URL}/${modelName}/glTF/${modelName}.gltf`,
        GLTFLoader
      );
      const processedGLTF = postProcessGLTF(gltf);

      const scenegraphsFromGLTF = createScenegraphsFromGLTF(this.device, processedGLTF, {
        lights: true,
        imageBasedLightingEnvironment: undefined,
        pbrDebug: false,
        useTangents: true
      });

      if (this.isFinalized || loadGeneration !== this.gltfLoadGeneration) {
        destroyScenegraphs(scenegraphsFromGLTF);
        return;
      }

      destroyScenegraphs(this.scenegraphsFromGLTF);
      this.scenegraphsFromGLTF = scenegraphsFromGLTF;
      this.modelLights = scenegraphsFromGLTF.lights;

      const sceneBounds = scenegraphsFromGLTF.scenes[0]?.getBounds();
      const min = sceneBounds?.[0] ?? [-1, -1, -1];
      const max = sceneBounds?.[1] ?? [1, 1, 1];

      this.cameraPos = [2 * (max[0] + max[2]), max[1], 2 * (max[0] + max[2])];
      this.center = [0.5 * (min[0] + max[0]), 0.5 * (min[1] + max[1]), 0.5 * (min[2] + max[2])];

      canvas.style.opacity = '1';
      showError();
    } catch (error) {
      if (this.isFinalized || loadGeneration !== this.gltfLoadGeneration) {
        return;
      }
      canvas.style.opacity = '1';
      showError(error as Error);
    }
  }

  getLightingProps(): LightingProps {
    if (this.options['useModelLights'] && this.modelLights.length > 0) {
      return {lights: this.modelLights};
    }

    return lightSources;
  }
}

function setModelMenu(
  items: string[],
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
    option.value = item;
    option.textContent = item;
    return option;
  });

  modelSelector.append(...options);
  modelSelector.value = currentItem;

  return () => modelSelector.removeEventListener('change', changeHandler);
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

function showError(error?: Error) {
  const errorDiv = document.getElementById('error') as HTMLDivElement;
  if (!errorDiv) {
    return;
  }

  errorDiv.textContent = error ? `Error loading model: ${error.message}` : '';
  errorDiv.style.display = error ? 'block' : 'none';
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
