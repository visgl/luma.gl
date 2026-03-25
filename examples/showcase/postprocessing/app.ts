// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  AnimationLoopTemplate,
  AnimationProps,
  GroupNode,
  DynamicTexture,
  loadImageBitmap,
  ShaderPassRenderer
} from '@luma.gl/engine';
import {Device} from '@luma.gl/core';
import * as shaderModules from '@luma.gl/effects';
import {ShaderPass} from '@luma.gl/shadertools';

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

const BLOOM_UNIFORMS = {
  threshold: 0.55,
  intensity: 1.8,
  radius: 8
} as const;

const PANEL_STYLE = [
  'margin-top: 16px',
  'padding: 16px',
  'border: 1px solid rgba(148, 163, 184, 0.28)',
  'border-radius: 18px',
  'background: linear-gradient(180deg, rgba(15, 23, 42, 0.94) 0%, rgba(2, 6, 23, 0.96) 100%)',
  'box-shadow: 0 18px 44px rgba(0, 0, 0, 0.38)'
].join('; ');

const LABEL_STYLE = [
  'display: block',
  'margin-bottom: 8px',
  'font-size: 11px',
  'font-weight: 700',
  'letter-spacing: 0.08em',
  'text-transform: uppercase',
  'color: rgba(148, 163, 184, 0.92)'
].join('; ');

const SELECT_STYLE = [
  'display: block',
  'width: 100%',
  'margin: 0',
  'padding: 10px 42px 10px 14px',
  'border: 1px solid rgba(148, 163, 184, 0.35)',
  'border-radius: 12px',
  'background: rgba(15, 23, 42, 0.92)',
  'color: #f8fafc',
  'font-size: 15px',
  'font-weight: 500',
  'line-height: 1.2',
  'appearance: none',
  '-webkit-appearance: none',
  'box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04)'
].join('; ');

const CARET_STYLE = [
  'position: absolute',
  'right: 14px',
  'top: 50%',
  'width: 9px',
  'height: 9px',
  'border-right: 2px solid rgba(226, 232, 240, 0.85)',
  'border-bottom: 2px solid rgba(226, 232, 240, 0.85)',
  'transform: translateY(-65%) rotate(45deg)',
  'pointer-events: none'
].join('; ');

const CONTROL_SECTION_STYLE = [
  'margin-top: 14px',
  'padding-top: 14px',
  'border-top: 1px solid rgba(148, 163, 184, 0.18)'
].join('; ');

const CONTROL_CARD_STYLE = ['display: grid', 'gap: 10px', 'margin-top: 10px'].join('; ');

const CONTROL_ROW_STYLE = [
  'display: grid',
  'gap: 6px',
  'padding: 10px 12px',
  'border: 1px solid rgba(148, 163, 184, 0.18)',
  'border-radius: 12px',
  'background: rgba(15, 23, 42, 0.56)'
].join('; ');

const CONTROL_LABEL_ROW_STYLE = [
  'display: flex',
  'align-items: center',
  'justify-content: space-between',
  'gap: 12px',
  'font-size: 12px',
  'font-weight: 600',
  'color: rgba(226, 232, 240, 0.94)'
].join('; ');

const CONTROL_HINT_STYLE = [
  'font-size: 12px',
  'line-height: 1.45',
  'color: rgba(148, 163, 184, 0.88)'
].join('; ');

const RANGE_STYLE = ['width: 100%', 'margin: 0', 'accent-color: #38bdf8'].join('; ');

const VECTOR_COMPONENT_LABELS = ['X', 'Y', 'Z', 'W'] as const;

const IMAGE_OPTIONS = {
  'Bloom Study': 'bloom-scene.png',
  'Vis Logo': 'image2.png',
  Helmet: 'image.jpg'
} as const;

type ImageOptionName = keyof typeof IMAGE_OPTIONS;
type EffectPropValue = number | number[];
type EffectState = Record<string, EffectPropValue>;
type ShaderPropType = NonNullable<ShaderPass['propTypes']>[string];

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = `\
<div style="color: rgba(226, 232, 240, 0.96);">
  This example demonstrates how to use luma.gl's postprocessing utilities to apply shader effects to an image.
  <br>
  Many luma.gl effects were inspired by Evan Wallace's landmark <a href="http://github.com/evanw/webgl-filter/" style="color: #7dd3fc;">glfx.js / WebGL Filter</a> application.
</div>
<div style="${PANEL_STYLE}">
  <label for="postprocessing-image-selector" style="${LABEL_STYLE}">Image</label>
  <div style="position: relative;">
    <select id="postprocessing-image-selector" style="${SELECT_STYLE}"></select>
    <span aria-hidden="true" style="${CARET_STYLE}"></span>
  </div>
  <label for="postprocessing-selector" style="${LABEL_STYLE}; margin-top: 14px;">Effect</label>
  <div style="position: relative;">
    <select id="postprocessing-selector" style="${SELECT_STYLE}"></select>
    <span aria-hidden="true" style="${CARET_STYLE}"></span>
  </div>
  <div style="${CONTROL_SECTION_STYLE}">
    <label style="${LABEL_STYLE}; margin-bottom: 0;">Settings</label>
    <div id="postprocessing-controls" style="${CONTROL_CARD_STYLE}"></div>
  </div>
</div>
`;

  device: Device;
  scenes: GroupNode[] = [];
  center = [0, 0, 0];
  vantage = [0, 0, 0];
  time: number = 0;

  shaderPassMap: Record<string, ShaderPass>;
  imageTexture: DynamicTexture;
  effectSelector: HTMLSelectElement | null = null;
  imageSelector: HTMLSelectElement | null = null;
  selectedEffectName = 'bloom';
  effectValuesByName: Record<string, EffectState> = {};

  shaderPassRenderer!: ShaderPassRenderer;
  shaderPasses!: ShaderPass[];

  constructor({device}: AnimationProps) {
    super();

    this.device = device;
    this.imageTexture = this.createImageTexture(IMAGE_OPTIONS['Bloom Study']);

    this.shaderPassMap = getShaderPasses();
    this.effectValuesByName = getInitialEffectValues(this.shaderPassMap);
    this.applySelectedEffect('bloom');

    const imageOptionNames = Object.keys(IMAGE_OPTIONS);
    this.imageSelector = initializeSelector(
      'postprocessing-image-selector',
      imageOptionNames,
      imageName => this.setImageSource(imageName as ImageOptionName),
      'Bloom Study'
    );

    const NO_EFFECT = 'No effect';
    const shaderPassNames = [NO_EFFECT, ...Object.keys(this.shaderPassMap)];
    this.effectSelector = initializeSelector(
      'postprocessing-selector',
      shaderPassNames,
      passName => this.applySelectedEffect(passName),
      'bloom'
    );
    this.renderEffectControls();
  }

  onFinalize() {
    this.imageTexture?.destroy();
    this.shaderPassRenderer?.destroy();
  }

  onRender({device}: AnimationProps): void {
    this.shaderPassRenderer?.resize();
    // Run the shader passes and generate an output texture
    /* const outputTexture = */ this.shaderPassRenderer.renderToScreen({
      sourceTexture: this.imageTexture
    });
  }

  setShaderPasses(shaderPasses: ShaderPass[]) {
    // this.shaderPasses = shaderPasses;
    this.shaderPassRenderer?.destroy();
    this.shaderPassRenderer = new ShaderPassRenderer(this.device, {
      shaderPasses
    });
  }

  createImageTexture(imageSource: string): DynamicTexture {
    return new DynamicTexture(this.device, {
      data: loadImageBitmap(imageSource, {imageOrientation: 'flipY'})
    });
  }

  setImageSource(imageName: ImageOptionName) {
    const previousTexture = this.imageTexture;
    this.imageTexture = this.createImageTexture(IMAGE_OPTIONS[imageName]);
    previousTexture?.destroy();
  }

  applySelectedEffect(passName: string) {
    this.selectedEffectName = passName;
    this.setShaderPasses(this.getShaderPassesForSelection(passName));
    this.renderEffectControls();
  }

  getShaderPassesForSelection(passName: string): ShaderPass[] {
    if (passName === 'No effect') {
      return [nullEffect];
    }

    const shaderPass = this.shaderPassMap[passName];
    if (!shaderPass) {
      return [];
    }

    return [{...shaderPass, uniforms: this.effectValuesByName[passName] || {}}];
  }

  renderEffectControls() {
    const controls = document.getElementById('postprocessing-controls');
    if (!controls) {
      return;
    }

    controls.replaceChildren();

    const shaderPass =
      this.selectedEffectName === 'No effect'
        ? nullEffect
        : this.shaderPassMap[this.selectedEffectName] || nullEffect;
    const propEntries = getControllableProps(shaderPass);

    if (propEntries.length === 0) {
      const message = document.createElement('div');
      message.style.cssText = CONTROL_ROW_STYLE;
      message.textContent =
        this.selectedEffectName === 'No effect'
          ? 'Null effect passes the image through unchanged.'
          : 'This effect does not expose configurable parameters.';
      controls.appendChild(message);
      return;
    }

    const effectState = this.effectValuesByName[this.selectedEffectName] || {};
    for (const [propName, propType] of propEntries) {
      const currentValue = cloneEffectValue(effectState[propName]);
      if (typeof currentValue === 'number') {
        controls.appendChild(
          this.createNumberControl(this.selectedEffectName, propName, currentValue, propType)
        );
        continue;
      }

      if (Array.isArray(currentValue)) {
        controls.appendChild(
          this.createVectorControl(this.selectedEffectName, propName, currentValue, propType)
        );
      }
    }
  }

  createNumberControl(
    effectName: string,
    propName: string,
    currentValue: number,
    propType: ShaderPropType
  ): HTMLDivElement {
    const bounds = getControlBounds(currentValue, propType);
    const row = document.createElement('div');
    row.style.cssText = CONTROL_ROW_STYLE;

    const header = document.createElement('div');
    header.style.cssText = CONTROL_LABEL_ROW_STYLE;

    const label = document.createElement('span');
    label.textContent = formatControlLabel(propName);
    header.appendChild(label);

    const valueLabel = document.createElement('span');
    valueLabel.textContent = formatControlValue(currentValue);
    header.appendChild(valueLabel);
    row.appendChild(header);

    const input = document.createElement('input');
    input.type = 'range';
    input.min = String(bounds.min);
    input.max = String(bounds.max);
    input.step = String(bounds.step);
    input.value = String(currentValue);
    input.style.cssText = RANGE_STYLE;
    input.addEventListener('input', event => {
      const nextValue = Number((event.target as HTMLInputElement).value);
      valueLabel.textContent = formatControlValue(nextValue);
      this.updateEffectValue(effectName, propName, nextValue);
    });
    row.appendChild(input);

    return row;
  }

  createVectorControl(
    effectName: string,
    propName: string,
    currentValue: number[],
    propType: ShaderPropType
  ): HTMLDivElement {
    const row = document.createElement('div');
    row.style.cssText = CONTROL_ROW_STYLE;

    const title = document.createElement('div');
    title.style.cssText = CONTROL_LABEL_ROW_STYLE;
    title.textContent = formatControlLabel(propName);
    row.appendChild(title);

    currentValue.forEach((componentValue, index) => {
      const bounds = getControlBounds(componentValue, propType);
      const componentRow = document.createElement('div');
      componentRow.style.cssText = CONTROL_ROW_STYLE;

      const header = document.createElement('div');
      header.style.cssText = CONTROL_LABEL_ROW_STYLE;

      const label = document.createElement('span');
      label.textContent = VECTOR_COMPONENT_LABELS[index] || `Value ${index + 1}`;
      header.appendChild(label);

      const valueLabel = document.createElement('span');
      valueLabel.textContent = formatControlValue(componentValue);
      header.appendChild(valueLabel);
      componentRow.appendChild(header);

      const input = document.createElement('input');
      input.type = 'range';
      input.min = String(bounds.min);
      input.max = String(bounds.max);
      input.step = String(bounds.step);
      input.value = String(componentValue);
      input.style.cssText = RANGE_STYLE;
      input.addEventListener('input', event => {
        const nextValue = Number((event.target as HTMLInputElement).value);
        valueLabel.textContent = formatControlValue(nextValue);
        const nextVector = [...(this.effectValuesByName[effectName]?.[propName] as number[])] || [
          ...currentValue
        ];
        nextVector[index] = nextValue;
        this.updateEffectValue(effectName, propName, nextVector);
      });
      componentRow.appendChild(input);

      row.appendChild(componentRow);
    });

    const hint = document.createElement('div');
    hint.style.cssText = CONTROL_HINT_STYLE;
    hint.textContent =
      'Vector controls are normalized to the source image unless noted by the effect.';
    row.appendChild(hint);

    return row;
  }

  updateEffectValue(effectName: string, propName: string, nextValue: EffectPropValue) {
    const currentState = this.effectValuesByName[effectName] || {};
    this.effectValuesByName[effectName] = {
      ...currentState,
      [propName]: cloneEffectValue(nextValue)
    };

    if (this.selectedEffectName === effectName) {
      this.setShaderPasses(this.getShaderPassesForSelection(effectName));
    }
  }
}

// Extract list of postprocessing-capable shader modules from the wildcard import
function getShaderPasses(): Record<string, ShaderPass> {
  const passes: Record<string, ShaderPass> = {};
  Object.entries(shaderModules).forEach(([key, module]) => {
    if (module.passes && !key.startsWith('_')) {
      passes[key] = module as ShaderPass;
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
  initialValues.bloom = {
    ...initialValues.bloom,
    ...BLOOM_UNIFORMS
  };
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

function formatControlValue(value: number): string {
  return Math.abs(value) >= 100 ? value.toFixed(0) : value.toFixed(3).replace(/\.?0+$/, '');
}

/** Initialize an existing HTML selector for the shader passes */
function initializeSelector(
  id: string,
  array: string[],
  onChange: (key: string) => void,
  initialValue?: string
): HTMLSelectElement | null {
  const selectList = document.getElementById(id) as HTMLSelectElement | null;
  if (!selectList) {
    return null;
  }

  selectList.replaceChildren();

  // Create and append the options
  for (const key of array) {
    const option = document.createElement('option');
    option.value = key;
    option.text = key;
    option.id = key;
    option.selected = key === initialValue;
    selectList.appendChild(option);
  }

  selectList?.addEventListener('change', e => onChange((e.target as HTMLSelectElement).value));

  return selectList;
}
