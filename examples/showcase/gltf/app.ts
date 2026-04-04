// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {RenderPass, log} from '@luma.gl/core';
import {AnimationProps, ClipSpace} from '@luma.gl/engine';
import {loadPBREnvironment, type PBREnvironment} from '@luma.gl/gltf';
import {type LightingProps} from '@luma.gl/shadertools';
import GLTFCatalogApp, {
  GLTF_CONTROL_PANEL_STYLE,
  GLTF_CONTROL_ROW_STYLE,
  GLTF_MODEL_INFO_ID,
  GLTF_SELECT_STYLE,
  type GLTFCatalogModel,
  type GLTFModelReference
} from './gltf-catalog-app';
import {GLTF_EXTENSION_DEMOS, type GLTFExtensionDemo} from './gltf-extension-demos';

const PBR_ENVIRONMENT_BASE_URL =
  'https://raw.githubusercontent.com/uber-common/deck.gl-data/master/luma.gl/examples/gltf';
const SHOWCASE_EXTENSION_STORAGE_KEY = 'showcase-gltf-extension-filter';
const ALL_EXTENSIONS_FILTER = 'all';
const CUBE_FACE_TO_DIRECTION = ['right', 'left', 'top', 'bottom', 'front', 'back'] as const;
const SHOWCASE_FALLBACK_LIGHTING = {
  ambientLight: {
    color: [255, 255, 255],
    intensity: 0.32,
    type: 'ambient'
  },
  directionalLights: [
    {
      color: [255, 255, 255],
      direction: [0.45, -0.8, 0.4],
      intensity: 1.1,
      type: 'directional'
    },
    {
      color: [255, 255, 255],
      direction: [-0.35, -0.4, -0.6],
      intensity: 0.4,
      type: 'directional'
    }
  ]
} as const satisfies LightingProps;

const BACKGROUND_SHADER_WGSL = /* wgsl */ `\
@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4<f32> {
  let topColor = vec3<f32>(0.60, 0.60, 0.58);
  let bottomColor = vec3<f32>(0.45, 0.44, 0.41);
  let verticalMix = smoothstep(1.0, 0.0, inputs.uv.y);
  let gradientColor = mix(topColor, bottomColor, verticalMix);
  let centeredPosition = inputs.uv - vec2<f32>(0.5, 0.4);
  let radialLift = 0.02 * exp(-6.0 * dot(centeredPosition, centeredPosition));

  return vec4<f32>(gradientColor + vec3<f32>(radialLift), 1.0);
}
`;

const BACKGROUND_SHADER_GLSL = /* glsl */ `\
#version 300 es
precision highp float;

in vec2 uv;
out vec4 fragColor;

void main(void) {
  vec3 topColor = vec3(0.60, 0.60, 0.58);
  vec3 bottomColor = vec3(0.45, 0.44, 0.41);
  float verticalMix = smoothstep(1.0, 0.0, uv.y);
  vec3 gradientColor = mix(topColor, bottomColor, verticalMix);
  vec2 centeredPosition = uv - vec2(0.5, 0.4);
  float radialLift = 0.02 * exp(-6.0 * dot(centeredPosition, centeredPosition));

  fragColor = vec4(gradientColor + vec3(radialLift), 1.0);
}
`;

const INFO_HTML = `\
<p>
  Browse production-quality glTF sample assets with interactive camera and animation controls.
</p>
<div id="model-options" style="${GLTF_CONTROL_PANEL_STYLE}">
  <div style="${GLTF_CONTROL_ROW_STYLE}">
    <label for="extension-select" style="margin: 0;">Extension</label>
    <select id="extension-select" style="${GLTF_SELECT_STYLE}"></select>
  </div>
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
<p style="margin-top: 8px;">Drag to orbit. Use the mouse wheel or trackpad to zoom.</p>
<div id="${GLTF_MODEL_INFO_ID}" style="margin-top: 12px; display: none;"></div>
<div id="model-light-indicator" style="margin-top: 8px;"></div>
<div id="extension-support" style="margin-top: 12px;"></div>
<div id="error" style="color: #b00020; margin-top: 8px;"></div>
`;

export default class AppAnimationLoopTemplate extends GLTFCatalogApp {
  static info = INFO_HTML;
  backgroundModel: ClipSpace;
  imageBasedLightingEnvironment?: PBREnvironment;
  imageBasedLightingEnvironmentPromise?: Promise<PBREnvironment | undefined>;

  constructor({device}: AnimationProps) {
    super({device});

    this.backgroundModel = new ClipSpace(device, {
      id: 'gltf-showcase-background',
      source: BACKGROUND_SHADER_WGSL,
      fs: BACKGROUND_SHADER_GLSL,
      parameters: {
        depthWriteEnabled: false,
        depthCompare: 'always'
      }
    });

    const canvas = this.device.getDefaultCanvasContext().canvas as HTMLCanvasElement;
    canvas.style.background = 'linear-gradient(180deg, #9b9b97 0%, #6f6d64 100%)';
  }

  getDefaultModelName(): string {
    return 'DamagedHelmet';
  }

  getModelStorageKey(): string {
    return 'showcase-last-gltf-model-v2';
  }

  getClearColor(): [number, number, number, number] {
    return [0.53, 0.52, 0.49, 1];
  }

  override initializeModelMenus(models: GLTFCatalogModel[], currentModelName: string): () => void {
    return initializeShowcaseModelMenus({
      app: this,
      currentModelName,
      models
    });
  }

  drawBackground(renderPass: RenderPass): void {
    this.backgroundModel.draw(renderPass);
  }

  async getImageBasedLightingEnvironment(): Promise<PBREnvironment | undefined> {
    if (this.imageBasedLightingEnvironment) {
      return this.imageBasedLightingEnvironment;
    }

    if (!this.imageBasedLightingEnvironmentPromise) {
      this.imageBasedLightingEnvironmentPromise = this.loadImageBasedLightingEnvironment();
    }

    return this.imageBasedLightingEnvironmentPromise;
  }

  override getLightingProps(): LightingProps {
    if (this.options['useModelLights'] && this.modelLights.length > 0) {
      return {lights: this.modelLights};
    }

    return SHOWCASE_FALLBACK_LIGHTING;
  }

  override getPBRMaterialProps() {
    if (!this.imageBasedLightingEnvironment) {
      return {};
    }

    return {
      scaleIBLAmbient: [1.8, 1.5]
    };
  }

  override onFinalize(): void {
    super.onFinalize();
    this.backgroundModel.destroy();
    destroyImageBasedLightingEnvironment(this.imageBasedLightingEnvironment);
    this.imageBasedLightingEnvironment = undefined;
    this.imageBasedLightingEnvironmentPromise = undefined;
  }

  private async loadImageBasedLightingEnvironment(): Promise<PBREnvironment | undefined> {
    try {
      log.log(0, 'Loading showcase PBR environment')();
      const imageBasedLightingEnvironment = loadPBREnvironment(this.device, {
        brdfLutUrl: `${PBR_ENVIRONMENT_BASE_URL}/brdfLUT.png`,
        getTexUrl: (type, face, mipLevel) =>
          `${PBR_ENVIRONMENT_BASE_URL}/papermill/${type}/${type}_${CUBE_FACE_TO_DIRECTION[face]}_${mipLevel}.jpg`,
        specularMipLevels: 10
      });

      await Promise.all([
        imageBasedLightingEnvironment.brdfLutTexture.ready,
        imageBasedLightingEnvironment.diffuseEnvSampler.ready,
        imageBasedLightingEnvironment.specularEnvSampler.ready
      ]);
      log.log(0, 'Showcase PBR environment ready')();

      if (this.isFinalized) {
        destroyImageBasedLightingEnvironment(imageBasedLightingEnvironment);
        return undefined;
      }

      this.imageBasedLightingEnvironment = imageBasedLightingEnvironment;
      return imageBasedLightingEnvironment;
    } catch (error) {
      log.error('Failed to load showcase PBR environment', error)();
      this.imageBasedLightingEnvironmentPromise = undefined;
      return undefined;
    }
  }
}

function destroyImageBasedLightingEnvironment(
  imageBasedLightingEnvironment: PBREnvironment | undefined
): void {
  if (!imageBasedLightingEnvironment) {
    return;
  }

  imageBasedLightingEnvironment.brdfLutTexture.destroy();
  imageBasedLightingEnvironment.diffuseEnvSampler.destroy();
  imageBasedLightingEnvironment.specularEnvSampler.destroy();
}

type ShowcaseModelMenuOption = GLTFModelReference & {
  label: string;
};

function initializeShowcaseModelMenus({
  app,
  currentModelName,
  models
}: {
  app: AppAnimationLoopTemplate;
  currentModelName: string;
  models: GLTFCatalogModel[];
}): () => void {
  const extensionSelector = document.getElementById('extension-select') as HTMLSelectElement;
  const modelSelector = document.getElementById('model-select') as HTMLSelectElement;
  if (!extensionSelector || !modelSelector) {
    return () => {};
  }

  const extensionDemos = getAvailableExtensionDemos(models);
  const activeExtensionNames = new Set(extensionDemos.map(demo => demo.extensionName));
  const storedExtension = window.localStorage[SHOWCASE_EXTENSION_STORAGE_KEY];
  const currentExtension = activeExtensionNames.has(storedExtension)
    ? storedExtension
    : ALL_EXTENSIONS_FILTER;
  const allModels = models.map(model => ({
    label: model.label || model.name,
    name: model.name
  }));

  extensionSelector.replaceChildren();
  extensionSelector.append(
    createSelectOption(ALL_EXTENSIONS_FILTER, 'All Extensions'),
    ...extensionDemos.map(demo => createSelectOption(demo.extensionName, demo.extensionName))
  );
  extensionSelector.value = currentExtension;

  let modelOptions = getModelOptionsForExtension(currentExtension, allModels, extensionDemos);
  let selectedModelOption = getInitialModelOption(modelOptions, currentModelName);
  updateModelSelector(modelSelector, modelOptions, selectedModelOption);

  if (currentExtension !== ALL_EXTENSIONS_FILTER) {
    app.loadGLTF(selectedModelOption);
    window.localStorage[app.getModelStorageKey()] = selectedModelOption.name;
  }

  const extensionChangeHandler = () => {
    const extensionName = extensionSelector.value;
    window.localStorage[SHOWCASE_EXTENSION_STORAGE_KEY] = extensionName;
    modelOptions = getModelOptionsForExtension(extensionName, allModels, extensionDemos);
    selectedModelOption = modelOptions[0];
    updateModelSelector(modelSelector, modelOptions, selectedModelOption);
    app.loadGLTF(selectedModelOption);
    window.localStorage[app.getModelStorageKey()] = selectedModelOption.name;
  };

  const modelChangeHandler = () => {
    const nextModelOption =
      modelOptions.find(modelOption => encodeModelOption(modelOption) === modelSelector.value) ||
      modelOptions[0];
    selectedModelOption = nextModelOption;
    app.loadGLTF(nextModelOption);
    window.localStorage[app.getModelStorageKey()] = nextModelOption.name;
  };

  extensionSelector.addEventListener('change', extensionChangeHandler);
  modelSelector.addEventListener('change', modelChangeHandler);

  return () => {
    extensionSelector.removeEventListener('change', extensionChangeHandler);
    modelSelector.removeEventListener('change', modelChangeHandler);
  };
}

function getAvailableExtensionDemos(models: GLTFCatalogModel[]): GLTFExtensionDemo[] {
  const modelsByName = new Map(models.map(model => [model.name, model]));

  return GLTF_EXTENSION_DEMOS.map(extensionDemo => ({
    extensionName: extensionDemo.extensionName,
    models: extensionDemo.models.filter(modelOption => {
      const catalogModel = modelsByName.get(modelOption.name);
      if (!catalogModel) {
        return false;
      }

      if (!modelOption.variant) {
        return true;
      }

      return Boolean(catalogModel.variants?.[modelOption.variant]);
    })
  })).filter(extensionDemo => extensionDemo.models.length > 0);
}

function getInitialModelOption(
  modelOptions: ShowcaseModelMenuOption[],
  currentModelName: string
): ShowcaseModelMenuOption {
  return modelOptions.find(modelOption => modelOption.name === currentModelName) || modelOptions[0];
}

function getModelOptionsForExtension(
  extensionName: string,
  allModels: ShowcaseModelMenuOption[],
  extensionDemos: GLTFExtensionDemo[]
): ShowcaseModelMenuOption[] {
  if (extensionName === ALL_EXTENSIONS_FILTER) {
    return allModels;
  }

  return (
    extensionDemos.find(extensionDemo => extensionDemo.extensionName === extensionName)?.models ||
    allModels
  );
}

function updateModelSelector(
  modelSelector: HTMLSelectElement,
  modelOptions: ShowcaseModelMenuOption[],
  selectedModelOption: ShowcaseModelMenuOption
): void {
  modelSelector.replaceChildren(
    ...modelOptions.map(modelOption =>
      createSelectOption(encodeModelOption(modelOption), modelOption.label)
    )
  );
  modelSelector.value = encodeModelOption(selectedModelOption);
}

function createSelectOption(value: string, label: string): HTMLOptionElement {
  const option = document.createElement('option');
  option.value = value;
  option.textContent = label;
  return option;
}

function encodeModelOption(modelOption: GLTFModelReference): string {
  return `${modelOption.name}|${modelOption.variant || 'glTF'}|${modelOption.fileName || ''}`;
}
