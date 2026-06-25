// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  AnimationLoopTemplate,
  AnimationProps,
  DynamicTexture,
  loadImageBitmap,
  ShaderPassRenderer
} from '@luma.gl/engine';
import {Device} from '@luma.gl/core';
import * as shaderModules from '@luma.gl/effects';
import type {ShaderPass} from '@luma.gl/shadertools';
import {
  ColumnPanel,
  type Panel,
  type SettingDescriptor,
  type SettingsChangeDescriptor,
  type SettingsSchema,
  type SettingsState
} from '@deck.gl-community/panels';
import {
  ExamplePanelManager,
  ExampleSettingsPanelManager,
  getChangedSetting,
  makeExamplePanelHostHtml,
  makeHtmlCustomPanel
} from '../../example-panels';

const SOURCE_IMAGE = 'image2.png';
const NO_EFFECT = 'No effect';

const nullEffect = {
  name: 'nullEffect',
  source: /* wgsl */ `
fn nullEffect_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  return textureSample(sourceTexture, sourceTextureSampler, texCoord);
}
`,
  fs: /* glsl */ `
vec4 nullEffect_sampleColor(sampler2D source, vec2 texSize, vec2 texCoord) {
  return texture(source, texCoord);
}
`,
  passes: [{sampler: true}]
} as const satisfies ShaderPass;

const VECTOR_COMPONENT_LABELS = ['X', 'Y', 'Z', 'W'] as const;

type EffectPropValue = number | number[];
export type EffectState = Record<string, EffectPropValue>;
type ShaderPropType = NonNullable<ShaderPass['propTypes']>[string];

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeExamplePanelHostHtml();

  device: Device;
  imageTexture: DynamicTexture;
  readonly settingsPanel: ExampleSettingsPanelManager;
  readonly panels: ExamplePanelManager;
  selectedEffectName = NO_EFFECT;
  effectValuesByName: Record<string, EffectState> = {};
  shaderPassMap: Record<string, ShaderPass>;
  shaderPassRenderer!: ShaderPassRenderer;

  constructor({device}: AnimationProps) {
    super();

    this.device = device;
    this.imageTexture = this.createImageTexture(SOURCE_IMAGE);
    this.shaderPassMap = getShaderPasses();
    this.effectValuesByName = getInitialEffectValues(this.shaderPassMap);
    this.settingsPanel = new ExampleSettingsPanelManager({
      id: 'postprocessing-settings',
      schema: makePostprocessingSettingsSchema(
        this.shaderPassMap,
        this.selectedEffectName,
        this.effectValuesByName
      ),
      settings: makePostprocessingSettingsState(this.selectedEffectName, this.effectValuesByName),
      onSettingsChange: this.handleSettingsChange
    });
    this.panels = new ExamplePanelManager({panel: this.makePanel()});
    this.panels.mount();
    this.applySelectedEffect(NO_EFFECT);
  }

  onFinalize(): void {
    this.settingsPanel.finalize();
    this.panels.finalize();
    this.imageTexture?.destroy();
    this.shaderPassRenderer?.destroy();
  }

  onRender(): void {
    this.shaderPassRenderer?.resize();
    this.shaderPassRenderer.renderToScreen({
      sourceTexture: this.imageTexture,
      uniforms: makePostprocessingUniforms(
        this.selectedEffectName,
        this.effectValuesByName,
        this.shaderPassMap
      )
    });
  }

  createImageTexture(imageSource: string): DynamicTexture {
    return new DynamicTexture(this.device, {
      data: loadImageBitmap(imageSource, {imageOrientation: 'flipY'})
    });
  }

  applySelectedEffect(passName: string): void {
    this.selectedEffectName = passName;
    this.setShaderPasses(this.getShaderPassesForSelection(passName));
    this.syncSettingsPanel();
  }

  setShaderPasses(shaderPasses: ShaderPass[]): void {
    this.shaderPassRenderer?.destroy();
    this.shaderPassRenderer = new ShaderPassRenderer(this.device, {shaderPasses});
  }

  getShaderPassesForSelection(passName: string): ShaderPass[] {
    if (passName === NO_EFFECT) {
      return [nullEffect];
    }

    const shaderPass = this.shaderPassMap[passName];
    if (!shaderPass) {
      return [nullEffect];
    }

    return [shaderPass];
  }

  updateEffectValue(effectName: string, propName: string, nextValue: EffectPropValue): void {
    const currentState = this.effectValuesByName[effectName] || {};
    this.effectValuesByName[effectName] = {
      ...currentState,
      [propName]: cloneEffectValue(nextValue)
    };
  }

  private makePanel(): Panel {
    return new ColumnPanel({
      id: 'postprocessing-controls',
      title: 'Controls',
      panels: [
        makeHtmlCustomPanel({
          id: 'postprocessing-description',
          title: '',
          html: makePostprocessingStatusHtml(this.selectedEffectName, this.shaderPassMap)
        }),
        this.settingsPanel.makePanel()
      ]
    });
  }

  private syncSettingsPanel(): void {
    this.settingsPanel.setSchemaAndSettings(
      makePostprocessingSettingsSchema(
        this.shaderPassMap,
        this.selectedEffectName,
        this.effectValuesByName
      ),
      makePostprocessingSettingsState(this.selectedEffectName, this.effectValuesByName)
    );
    this.panels.setPanel(this.makePanel());
  }

  private readonly handleSettingsChange = (
    settings: SettingsState,
    changedSettings?: SettingsChangeDescriptor[]
  ): void => {
    const effectName = getChangedSetting(changedSettings, 'effectName')?.nextValue;
    if (typeof effectName === 'string' && effectName !== this.selectedEffectName) {
      this.applySelectedEffect(effectName);
      return;
    }
    if (this.selectedEffectName === NO_EFFECT) {
      return;
    }
    const nextEffectState = unflattenEffectSettings(
      this.selectedEffectName,
      settings,
      this.effectValuesByName[this.selectedEffectName] || {}
    );
    this.effectValuesByName[this.selectedEffectName] = nextEffectState;
  };
}

function getShaderPasses(): Record<string, ShaderPass> {
  const passes: Record<string, ShaderPass> = {};
  Object.entries(shaderModules).forEach(([key, module]) => {
    if (key === 'bloom' || key === 'bloomShaderPassPipeline') {
      return;
    }

    if (isShaderPass(module) && !key.startsWith('_')) {
      passes[key] = module;
    }
  });

  return passes;
}

function getInitialEffectValues(
  shaderPassMap: Record<string, ShaderPass>
): Record<string, EffectState> {
  const initialValues: Record<string, EffectState> = {};
  for (const [passName, shaderPass] of Object.entries(shaderPassMap)) {
    initialValues[passName] = getDefaultEffectValues(shaderPass);
  }
  return initialValues;
}

function getDefaultEffectValues(shaderPass: ShaderPass): EffectState {
  const values: EffectState = {};
  for (const [propName, propType] of getControllableProps(shaderPass)) {
    const nextValue = cloneEffectValue(propType.value);
    if (nextValue !== undefined) {
      values[propName] = nextValue;
    }
  }
  return values;
}

function getControllableProps(shaderPass: ShaderPass): [string, ShaderPropType][] {
  return Object.entries(shaderPass.propTypes || {}).filter(
    ([, propType]) => !propType.private && propType.value !== undefined
  );
}

export function makePostprocessingSettingsState(
  selectedEffectName: string,
  effectValuesByName: Record<string, EffectState>
): SettingsState {
  return {
    effectName: selectedEffectName,
    ...flattenEffectSettings(selectedEffectName, effectValuesByName[selectedEffectName] || {})
  };
}

export function makePostprocessingUniforms(
  selectedEffectName: string,
  effectValuesByName: Record<string, EffectState>,
  shaderPassMap: Record<string, ShaderPass>
): Record<string, EffectState> | undefined {
  if (selectedEffectName === NO_EFFECT) {
    return undefined;
  }

  const shaderPass = shaderPassMap[selectedEffectName];
  if (!shaderPass) {
    return undefined;
  }

  return {
    [shaderPass.name]: effectValuesByName[selectedEffectName] || {}
  };
}

export function flattenEffectSettings(effectName: string, effectState: EffectState): SettingsState {
  const settings: SettingsState = {};
  for (const [propName, propValue] of Object.entries(effectState)) {
    if (typeof propValue === 'number') {
      settings[makeEffectSettingName(effectName, propName)] = propValue;
      continue;
    }
    for (const [index, componentValue] of propValue.entries()) {
      settings[makeEffectSettingName(effectName, propName, index)] = componentValue;
    }
  }
  return settings;
}

export function unflattenEffectSettings(
  effectName: string,
  settings: SettingsState,
  fallbackEffectState: EffectState
): EffectState {
  const effectState: EffectState = {};
  for (const [propName, propValue] of Object.entries(fallbackEffectState)) {
    if (typeof propValue === 'number') {
      const nextValue = settings[makeEffectSettingName(effectName, propName)];
      effectState[propName] = typeof nextValue === 'number' ? nextValue : propValue;
      continue;
    }
    effectState[propName] = propValue.map((componentValue, index) => {
      const nextValue = settings[makeEffectSettingName(effectName, propName, index)];
      return typeof nextValue === 'number' ? nextValue : componentValue;
    });
  }
  return effectState;
}

function makePostprocessingSettingsSchema(
  shaderPassMap: Record<string, ShaderPass>,
  selectedEffectName: string,
  effectValuesByName: Record<string, EffectState>
): SettingsSchema {
  const shaderPass =
    selectedEffectName === NO_EFFECT ? nullEffect : shaderPassMap[selectedEffectName] || nullEffect;
  const effectState = effectValuesByName[selectedEffectName] || {};
  return {
    title: 'Settings',
    sections: [
      {
        id: 'effect',
        name: 'Effect',
        initiallyCollapsed: false,
        settings: [
          {
            name: 'effectName',
            label: 'Effect',
            type: 'select',
            persist: 'none',
            options: [NO_EFFECT, ...Object.keys(shaderPassMap)]
          }
        ]
      },
      ...(getControllableProps(shaderPass).length > 0
        ? [
            {
              id: 'parameters',
              name: 'Parameters',
              initiallyCollapsed: false,
              settings: getEffectSettingDescriptors(selectedEffectName, effectState, shaderPass)
            }
          ]
        : [])
    ]
  };
}

function getEffectSettingDescriptors(
  effectName: string,
  effectState: EffectState,
  shaderPass: ShaderPass
): SettingDescriptor[] {
  return getControllableProps(shaderPass).flatMap(([propName, propType]) => {
    const propValue = effectState[propName];
    if (typeof propValue === 'number') {
      return [makeEffectNumberSetting(effectName, propName, propValue, propType)];
    }
    if (!Array.isArray(propValue)) {
      return [];
    }
    return propValue.map((componentValue, index) =>
      makeEffectNumberSetting(effectName, propName, componentValue, propType, index)
    );
  });
}

function makeEffectNumberSetting(
  effectName: string,
  propName: string,
  value: number,
  propType: ShaderPropType,
  componentIndex?: number
): SettingDescriptor {
  const bounds = getControlBounds(value, propType);
  const componentLabel =
    componentIndex === undefined
      ? ''
      : ` ${VECTOR_COMPONENT_LABELS[componentIndex] || `Value ${componentIndex + 1}`}`;
  return {
    name: makeEffectSettingName(effectName, propName, componentIndex),
    label: `${formatControlLabel(propName)}${componentLabel}`,
    type: 'number',
    persist: 'none',
    min: bounds.min,
    max: bounds.max,
    step: bounds.step
  };
}

function makeEffectSettingName(
  effectName: string,
  propName: string,
  componentIndex?: number
): string {
  return componentIndex === undefined
    ? `${effectName}__${propName}`
    : `${effectName}__${propName}__${componentIndex}`;
}

function makePostprocessingStatusHtml(
  selectedEffectName: string,
  shaderPassMap: Record<string, ShaderPass>
): string {
  const shaderPass =
    selectedEffectName === NO_EFFECT ? nullEffect : shaderPassMap[selectedEffectName] || nullEffect;
  const statusMessage =
    getControllableProps(shaderPass).length === 0
      ? selectedEffectName === NO_EFFECT
        ? 'Null effect passes the image through unchanged.'
        : 'This effect does not expose configurable parameters.'
      : 'Vector settings are exposed as scalar X/Y/Z/W settings.';
  return `\
  <p>This example demonstrates luma.gl's reusable postprocessing shader passes on a fixed source image.</p>
  <p>Many luma.gl effects were inspired by Evan Wallace's landmark <a href="http://github.com/evanw/webgl-filter/">glfx.js / WebGL Filter</a> application.</p>
  <p>${statusMessage}</p>
  `;
}

function isShaderPass(module: unknown): module is ShaderPass {
  return Boolean(module && typeof module === 'object' && 'passes' in module);
}

function cloneEffectValue(value: unknown): EffectPropValue | undefined {
  if (typeof value === 'number') {
    return value;
  }
  if (Array.isArray(value)) {
    return [...value] as number[];
  }
  return undefined;
}

function getControlBounds(
  value: number,
  propType: ShaderPropType
): {
  min: number;
  max: number;
  step: number;
} {
  const min =
    propType.min ?? propType.softMin ?? (value >= 0 && value <= 1 ? 0 : Math.min(value, 0));
  const max =
    propType.max ??
    propType.softMax ??
    (value >= 0 && value <= 1 ? 1 : Math.max(Math.abs(value) * 2, min + 1));
  const step =
    Number.isInteger(value) && Number.isInteger(min) && Number.isInteger(max)
      ? 1
      : Math.max(Number(((max - min) / 200).toFixed(4)), 0.001);

  return {min, max, step};
}

function formatControlLabel(propName: string): string {
  return propName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, firstCharacter => firstCharacter.toUpperCase());
}
