// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {RenderPass, log} from '@luma.gl/core';
import {type AnimationLoopMode, AnimationProps, ClipSpace} from '@luma.gl/engine';
import {loadPBREnvironment, type PBREnvironment} from '@luma.gl/gltf';
import {type LightingProps} from '@luma.gl/shadertools';
import {
  ColumnPanel,
  type Panel,
  type SettingsChangeDescriptor,
  type SettingsSchema
} from '@deck.gl-community/panels';
import {
  ExamplePanelManager,
  ExampleSettingsPanelManager,
  getChangedSetting,
  makeExamplePanelHostHtml,
  makeHtmlCustomPanel
} from '../../example-panels';
import GLTFCatalogApp, {
  GLTF_ANIMATION_INFO_ID,
  GLTF_CROWD_INFO_ID,
  GLTF_MODEL_INFO_ID,
  saveOptions,
  type GLTFCatalogModel,
  type GLTFModelReference
} from './gltf-catalog-app';
import {GLTF_EXTENSION_DEMOS, type GLTFExtensionDemo} from './gltf-extension-demos';
import {GLTF_STUDIO_DEFAULT_VARIANT, type GLTFAnimationStudioState} from './gltf-animation-studio';
import {GLTF_STUDIO_ASSETS, getGLTFStudioAsset} from './gltf-studio-assets';

const PBR_ENVIRONMENT_BASE_URL =
  'https://raw.githubusercontent.com/uber-common/deck.gl-data/master/luma.gl/examples/gltf';
const SHOWCASE_EXTENSION_STORAGE_KEY = 'showcase-gltf-extension-filter';
const ALL_EXTENSIONS_FILTER = 'all';
const STUDIO_ASSETS_FILTER = 'studio';
const LOADING_MODEL_VALUE = 'loading-models';
const NO_ANIMATION_CLIP = '__no-animation__';
const ORBIT_CAMERA = '__orbit-camera__';
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

const GLTF_DESCRIPTION_HTML = `\
<p>Explore animated glTF characters, skeletal rigs, and expressive motion.</p>
<div id="loading-state" class="gltf-loading-indicator" hidden>
  <span class="gltf-loading-spinner" aria-hidden="true"></span>
</div>
<p style="margin-top: 8px;">Drag to orbit. Use the mouse wheel or trackpad to zoom.</p>
<div id="${GLTF_MODEL_INFO_ID}" style="margin-top: 12px; display: none;"></div>
<div id="${GLTF_ANIMATION_INFO_ID}" style="margin-top: 8px;" hidden></div>
<div id="${GLTF_CROWD_INFO_ID}" style="margin-top: 8px;" hidden></div>
<div id="model-light-indicator" style="margin-top: 8px;"></div>
<div id="extension-support" style="margin-top: 12px;"></div>
<div id="error" style="color: #b00020; margin-top: 8px;"></div>
`;

export default class AppAnimationLoopTemplate extends GLTFCatalogApp {
  static override info = makeExamplePanelHostHtml();
  backgroundModel: ClipSpace;
  readonly settingsPanel: ExampleSettingsPanelManager;
  readonly panels: ExamplePanelManager;
  extensionDemos: GLTFExtensionDemo[] = [];
  modelOptions: ShowcaseModelMenuOption[] = [];
  extensionName = STUDIO_ASSETS_FILTER;
  selectedModelValue = '';
  imageBasedLightingEnvironment?: PBREnvironment;
  imageBasedLightingEnvironmentPromise?: Promise<PBREnvironment | undefined>;

  constructor(animationProps: AnimationProps) {
    super(animationProps);
    const {device} = animationProps;
    this.settingsPanel = new ExampleSettingsPanelManager({
      id: 'gltf-settings',
      schema: makeGltfSettingsSchema([], [], this.extensionName),
      settings: this.getSettingsState(),
      onSettingsChange: this.handleSettingsChange
    });
    this.panels = new ExamplePanelManager({panel: this.makePanel()});
    this.panels.mount();

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

  override getDefaultModelName(): string {
    return 'RobotExpressive';
  }

  override getModelStorageKey(): string {
    return 'showcase-last-gltf-model-v3';
  }

  override getClearColor(): [number, number, number, number] {
    return [0.53, 0.52, 0.49, 1];
  }

  override initializeModelMenus(models: GLTFCatalogModel[], currentModelName: string): () => void {
    this.extensionDemos = getAvailableExtensionDemos(models);
    const activeExtensionNames = new Set(
      this.extensionDemos.map(extensionDemo => extensionDemo.extensionName)
    );
    const storedExtension = window.localStorage[SHOWCASE_EXTENSION_STORAGE_KEY];
    this.extensionName = this.isReferenceCapture()
      ? ALL_EXTENSIONS_FILTER
      : storedExtension === STUDIO_ASSETS_FILTER || activeExtensionNames.has(storedExtension)
        ? storedExtension
        : STUDIO_ASSETS_FILTER;
    this.modelOptions = getModelOptionsForExtension(
      this.extensionName,
      getAllModelOptions(models),
      this.extensionDemos
    );
    const selectedModelOption = getInitialModelOption(this.modelOptions, currentModelName);
    this.selectedModelValue = encodeModelOption(selectedModelOption);
    this.syncSettingsPanel();
    if (
      this.extensionName !== ALL_EXTENSIONS_FILTER &&
      this.extensionName !== STUDIO_ASSETS_FILTER
    ) {
      this.loadModelOption(selectedModelOption);
    }
    return () => {};
  }

  override drawBackground(renderPass: RenderPass): void {
    this.backgroundModel.draw(renderPass);
  }

  override async getImageBasedLightingEnvironment(): Promise<PBREnvironment | undefined> {
    if (this.isReferenceCapture()) {
      return undefined;
    }
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
      scaleIBLAmbient: [1.8, 1.5] as const
    };
  }

  override onScenegraphsChanged(): void {
    this.syncSettingsPanel();
  }

  override onFinalize(): void {
    this.settingsPanel.finalize();
    this.panels.finalize();
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

  private makePanel(): Panel {
    return new ColumnPanel({
      id: 'gltf-controls',
      title: 'Controls',
      panels: [
        makeHtmlCustomPanel({
          id: 'gltf-description',
          title: 'Description',
          html: GLTF_DESCRIPTION_HTML
        }),
        this.settingsPanel.makePanel()
      ]
    });
  }

  private getSettingsState(): GltfSettingsState {
    const animationState = this.animationStudio.getState();
    const morphValues = Object.fromEntries(
      animationState.morphTargets.map(target => [
        makeMorphSettingName(target.identifier),
        target.value
      ])
    );
    return {
      extensionName: this.extensionName,
      modelValue: this.selectedModelValue || LOADING_MODEL_VALUE,
      instanceCount: this.getAnimationInstanceCount(),
      animationActor: String(animationState.selectedActorIndex),
      animationClip: animationState.selectedClip || NO_ANIMATION_CLIP,
      animationSpeed: animationState.speed,
      animationCrossFade: animationState.crossFadeDuration,
      animationTime: animationState.time,
      animationLoop: animationState.loop,
      materialVariant: animationState.selectedVariant,
      cameraSelection:
        this.selectedCameraIndex === null ? ORBIT_CAMERA : String(this.selectedCameraIndex),
      autoLOD: this.options['autoLOD'],
      detailBias: this.levelOfDetailBias,
      vertexBudget: this.levelOfDetailVertexBudget,
      useModelLights: this.options['useModelLights'],
      cameraAnimation: this.options['cameraAnimation'],
      gltfAnimation: this.options['gltfAnimation'],
      ...morphValues
    };
  }

  private syncSettingsPanel(): void {
    this.settingsPanel.setSchemaAndSettings(
      makeGltfSettingsSchema(
        this.extensionDemos,
        this.modelOptions,
        this.extensionName,
        this.animationStudio.getState(),
        this.scenegraphsFromGLTF?.cameras || []
      ),
      this.getSettingsState()
    );
    this.panels.setPanel(this.makePanel());
  }

  private readonly handleSettingsChange = (
    _settings: Record<string, unknown>,
    changedSettings?: SettingsChangeDescriptor[]
  ): void => {
    const extensionName = getChangedSetting(changedSettings, 'extensionName')?.nextValue;
    if (typeof extensionName === 'string') {
      this.selectExtension(extensionName);
      return;
    }
    const modelValue = getChangedSetting(changedSettings, 'modelValue')?.nextValue;
    if (typeof modelValue === 'string') {
      this.selectModel(modelValue);
      return;
    }
    const animationActor = getChangedSetting(changedSettings, 'animationActor')?.nextValue;
    if (typeof animationActor === 'string') {
      this.animationStudio.selectActor(Number(animationActor));
      this.syncSettingsPanel();
      return;
    }
    const animationClip = getChangedSetting(changedSettings, 'animationClip')?.nextValue;
    if (typeof animationClip === 'string' && animationClip !== NO_ANIMATION_CLIP) {
      this.animationStudio.selectClip(animationClip);
      this.syncSettingsPanel();
      return;
    }
    const animationSpeed = getChangedSetting(changedSettings, 'animationSpeed')?.nextValue;
    if (typeof animationSpeed === 'number') {
      this.animationStudio.setSpeed(animationSpeed);
      return;
    }
    const animationCrossFade = getChangedSetting(changedSettings, 'animationCrossFade')?.nextValue;
    if (typeof animationCrossFade === 'number') {
      this.animationStudio.setCrossFadeDuration(animationCrossFade);
      return;
    }
    const animationTime = getChangedSetting(changedSettings, 'animationTime')?.nextValue;
    if (typeof animationTime === 'number') {
      this.animationStudio.seek(animationTime);
      return;
    }
    const animationLoop = getChangedSetting(changedSettings, 'animationLoop')?.nextValue;
    if (animationLoop === 'repeat' || animationLoop === 'ping-pong' || animationLoop === 'once') {
      this.animationStudio.setLoop(animationLoop);
      return;
    }
    const instanceCount = getChangedSetting(changedSettings, 'instanceCount')?.nextValue;
    if (typeof instanceCount === 'number') {
      this.setAnimationInstanceCount(instanceCount);
      return;
    }
    const materialVariant = getChangedSetting(changedSettings, 'materialVariant')?.nextValue;
    if (typeof materialVariant === 'string') {
      this.animationStudio.selectVariant(materialVariant);
      return;
    }
    const cameraSelection = getChangedSetting(changedSettings, 'cameraSelection')?.nextValue;
    if (typeof cameraSelection === 'string') {
      this.selectCamera(cameraSelection === ORBIT_CAMERA ? null : Number(cameraSelection));
      return;
    }
    for (const morphTarget of this.animationStudio.getState().morphTargets) {
      const morphValue = getChangedSetting(
        changedSettings,
        makeMorphSettingName(morphTarget.identifier)
      )?.nextValue;
      if (typeof morphValue === 'number') {
        this.animationStudio.setMorphWeight(morphTarget.identifier, morphValue);
        return;
      }
    }
    const automaticLevelOfDetail = getChangedSetting(changedSettings, 'autoLOD')?.nextValue;
    if (typeof automaticLevelOfDetail === 'boolean') {
      this.setAutomaticLevelOfDetail(automaticLevelOfDetail);
      saveOptions(this.options);
      return;
    }
    const detailBias = getChangedSetting(changedSettings, 'detailBias')?.nextValue;
    if (typeof detailBias === 'number') {
      this.setLevelOfDetailBias(detailBias);
      return;
    }
    const vertexBudget = getChangedSetting(changedSettings, 'vertexBudget')?.nextValue;
    if (typeof vertexBudget === 'number') {
      this.setLevelOfDetailVertexBudget(vertexBudget);
      return;
    }
    const gltfAnimation = getChangedSetting(changedSettings, 'gltfAnimation')?.nextValue;
    if (typeof gltfAnimation === 'boolean') {
      this.options['gltfAnimation'] = gltfAnimation;
      this.animationStudio.setPlaying(gltfAnimation);
      for (const actor of this.animatedCrowd?.actors || []) {
        if (gltfAnimation) {
          actor.play();
        } else {
          actor.pause();
        }
      }
      saveOptions(this.options);
      return;
    }
    for (const optionName of ['useModelLights', 'cameraAnimation'] as const) {
      const nextValue = getChangedSetting(changedSettings, optionName)?.nextValue;
      if (typeof nextValue === 'boolean') {
        this.options[optionName] = nextValue;
        saveOptions(this.options);
      }
    }
  };

  private selectExtension(extensionName: string): void {
    this.extensionName = isGltfExtensionName(extensionName, this.extensionDemos)
      ? extensionName
      : ALL_EXTENSIONS_FILTER;
    window.localStorage[SHOWCASE_EXTENSION_STORAGE_KEY] = this.extensionName;
    this.modelOptions = getModelOptionsForExtension(
      this.extensionName,
      getAllModelOptions(this.availableModels),
      this.extensionDemos
    );
    const selectedModelOption = this.modelOptions[0];
    if (!selectedModelOption) {
      this.selectedModelValue = '';
      this.syncSettingsPanel();
      return;
    }
    this.selectedModelValue = encodeModelOption(selectedModelOption);
    this.syncSettingsPanel();
    this.loadModelOption(selectedModelOption);
  }

  private selectModel(modelValue: string): void {
    if (modelValue === LOADING_MODEL_VALUE) {
      return;
    }
    const selectedModelOption =
      this.modelOptions.find(modelOption => encodeModelOption(modelOption) === modelValue) ||
      this.modelOptions[0];
    if (!selectedModelOption) {
      return;
    }
    this.selectedModelValue = encodeModelOption(selectedModelOption);
    this.syncSettingsPanel();
    this.loadModelOption(selectedModelOption);
  }

  private loadModelOption(modelOption: ShowcaseModelMenuOption): void {
    this.loadGLTF(modelOption);
    window.localStorage[this.getModelStorageKey()] = modelOption.name;
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

export type ShowcaseModelMenuOption = GLTFModelReference & {
  label: string;
};

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

function getAllModelOptions(models: GLTFCatalogModel[]): ShowcaseModelMenuOption[] {
  return models.map(model => {
    const studioAsset = getGLTFStudioAsset(model.name);
    return {
      ...(studioAsset?.model || {name: model.name}),
      label: studioAsset?.label || model.label || model.name
    };
  });
}

function getModelOptionsForExtension(
  extensionName: string,
  allModels: ShowcaseModelMenuOption[],
  extensionDemos: GLTFExtensionDemo[]
): ShowcaseModelMenuOption[] {
  if (extensionName === STUDIO_ASSETS_FILTER) {
    const availableNames = new Set(allModels.map(model => model.name));
    return GLTF_STUDIO_ASSETS.filter(asset => availableNames.has(asset.name)).map(asset => ({
      ...asset.model,
      label: asset.label
    }));
  }
  if (extensionName === ALL_EXTENSIONS_FILTER) {
    return allModels;
  }

  return (
    extensionDemos.find(extensionDemo => extensionDemo.extensionName === extensionName)?.models ||
    allModels
  );
}

function encodeModelOption(modelOption: GLTFModelReference): string {
  return `${modelOption.name}|${modelOption.variant || 'glTF'}|${modelOption.fileName || ''}`;
}

type GltfSettingsState = {
  extensionName: string;
  modelValue: string;
  instanceCount: number;
  animationActor: string;
  animationClip: string;
  animationSpeed: number;
  animationCrossFade: number;
  animationTime: number;
  animationLoop: AnimationLoopMode;
  materialVariant: string;
  cameraSelection: string;
  autoLOD: boolean;
  detailBias: number;
  vertexBudget: number;
  useModelLights: boolean;
  cameraAnimation: boolean;
  gltfAnimation: boolean;
  [settingName: string]: boolean | number | string;
};

export function makeGltfSettingsSchema(
  extensionDemos: GLTFExtensionDemo[] = [],
  modelOptions: ShowcaseModelMenuOption[] = [],
  extensionName = STUDIO_ASSETS_FILTER,
  animationState?: GLTFAnimationStudioState,
  cameras: readonly {name?: string}[] = []
): SettingsSchema {
  const clipOptions = animationState?.clipNames.length
    ? animationState.clipNames.map(name => ({label: name, value: name}))
    : [{label: 'No animation clips', value: NO_ANIMATION_CLIP}];
  const actorOptions = animationState?.actors.length
    ? animationState.actors.map(actor => ({
        label: `Actor ${actor.index + 1} · ${actor.clip || 'No clip'}`,
        value: String(actor.index)
      }))
    : [{label: 'Actor 1', value: '0'}];
  return {
    title: 'Settings',
    sections: [
      {
        id: 'models',
        name: 'Models',
        initiallyCollapsed: false,
        settings: [
          {
            name: 'extensionName',
            label: 'Extension',
            type: 'select',
            persist: 'none',
            options: [
              {label: 'Animation Studio', value: STUDIO_ASSETS_FILTER},
              {label: 'All Extensions', value: ALL_EXTENSIONS_FILTER},
              ...extensionDemos.map(extensionDemo => ({
                label: extensionDemo.extensionName,
                value: extensionDemo.extensionName
              }))
            ],
            defaultValue: extensionName
          },
          {
            name: 'modelValue',
            label: 'Model',
            type: 'select',
            persist: 'none',
            options:
              modelOptions.length > 0
                ? modelOptions.map(modelOption => ({
                    label: modelOption.label,
                    value: encodeModelOption(modelOption)
                  }))
                : [{label: 'Loading models...', value: LOADING_MODEL_VALUE}]
          }
        ]
      },
      {
        id: 'animation',
        name: 'Animation Studio',
        initiallyCollapsed: false,
        settings: [
          {
            name: 'gltfAnimation',
            label: 'Play Animation',
            type: 'boolean',
            persist: 'none'
          },
          {
            name: 'instanceCount',
            label: 'Independent Characters',
            type: 'number',
            persist: 'none',
            min: 1,
            max: 100,
            step: 1,
            sliderDebounceMs: 120
          },
          {
            name: 'animationActor',
            label: 'Selected Actor',
            type: 'select',
            options: actorOptions,
            persist: 'none'
          },
          {
            name: 'animationClip',
            label: 'Animation Clip',
            type: 'select',
            options: clipOptions,
            persist: 'none'
          },
          {
            name: 'animationSpeed',
            label: 'Playback Speed',
            type: 'number',
            min: 0,
            max: 4,
            step: 0.05,
            persist: 'none'
          },
          {
            name: 'animationCrossFade',
            label: 'Crossfade Seconds',
            type: 'number',
            min: 0,
            max: 2,
            step: 0.05,
            persist: 'none'
          },
          {
            name: 'animationTime',
            label: 'Animation Time',
            type: 'number',
            min: 0,
            max: Math.max(animationState?.duration || 0, 0.01),
            step: 0.01,
            persist: 'none'
          },
          {
            name: 'animationLoop',
            label: 'Loop Mode',
            type: 'select',
            options: [
              {label: 'Repeat', value: 'repeat'},
              {label: 'Ping-pong', value: 'ping-pong'},
              {label: 'Play once', value: 'once'}
            ],
            persist: 'none'
          }
        ]
      },
      {
        id: 'morph-targets',
        name: 'Facial Expressions',
        initiallyCollapsed: false,
        settings: (animationState?.morphTargets || []).map(target => ({
          name: makeMorphSettingName(target.identifier),
          label: target.label,
          type: 'number',
          min: 0,
          max: 1,
          step: 0.01,
          persist: 'none'
        }))
      },
      {
        id: 'materials-cameras',
        name: 'Materials and Cameras',
        initiallyCollapsed: false,
        settings: [
          {
            name: 'materialVariant',
            label: 'Material Variant',
            type: 'select',
            options: [
              {label: 'Original materials', value: GLTF_STUDIO_DEFAULT_VARIANT},
              ...(animationState?.variants || []).map(name => ({label: name, value: name}))
            ],
            persist: 'none'
          },
          {
            name: 'cameraSelection',
            label: 'Authored Camera',
            type: 'select',
            options: [
              {label: 'Studio orbit camera', value: ORBIT_CAMERA},
              ...cameras.map((camera, index) => ({
                label: camera.name || `Source camera ${index + 1}`,
                value: String(index)
              }))
            ],
            persist: 'none'
          },
          {
            name: 'useModelLights',
            label: 'Use Model Lights',
            type: 'boolean',
            persist: 'none'
          },
          {
            name: 'cameraAnimation',
            label: 'Orbit Animation',
            type: 'boolean',
            persist: 'none'
          }
        ]
      },
      {
        id: 'level-of-detail',
        name: 'Level of Detail',
        initiallyCollapsed: false,
        settings: [
          {
            name: 'autoLOD',
            label: 'Auto LOD',
            type: 'boolean',
            persist: 'none'
          },
          {
            name: 'detailBias',
            label: 'Detail Bias',
            type: 'number',
            persist: 'none',
            min: 0.25,
            max: 4,
            step: 0.25,
            sliderDebounceMs: 120
          },
          {
            name: 'vertexBudget',
            label: 'Vertex Budget',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 1_000_000,
            step: 100,
            sliderDebounceMs: 120
          }
        ]
      }
    ]
  };
}

function isGltfExtensionName(extensionName: string, extensionDemos: GLTFExtensionDemo[]): boolean {
  return (
    extensionName === STUDIO_ASSETS_FILTER ||
    extensionName === ALL_EXTENSIONS_FILTER ||
    extensionDemos.some(extensionDemo => extensionDemo.extensionName === extensionName)
  );
}

function makeMorphSettingName(identifier: string): string {
  return `morph__${identifier.replace(':', '__')}`;
}
