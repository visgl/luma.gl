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
import {bloom, bloomShaderPassPipeline} from '@luma.gl/effects';
import type {ShaderPassPipeline} from '@luma.gl/shadertools';

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

const RANGE_STYLE = ['width: 100%', 'margin: 0', 'accent-color: #f59e0b'].join('; ');

type BloomState = Record<'threshold' | 'intensity' | 'radius', number>;
type ShaderPropType = NonNullable<typeof bloom.propTypes>[string];

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = `\
<div style="color: rgba(226, 232, 240, 0.96);">
  Experimental bloom pipeline demo using extracted highlights, multi-stage blur targets, and final recomposition.
</div>
<div style="${PANEL_STYLE}">
  <label style="${LABEL_STYLE}; margin-bottom: 0;">Bloom Settings</label>
  <div id="bloom-controls" style="${CONTROL_CARD_STYLE}"></div>
</div>
`;

  device: Device;
  imageTexture: DynamicTexture;
  bloomValues: BloomState = {...BLOOM_UNIFORMS};
  shaderPassRenderer!: ShaderPassRenderer;

  constructor({device}: AnimationProps) {
    super();

    this.device = device;
    this.imageTexture = this.createImageTexture('bloom-scene.png');
    this.setShaderPasses(this.getBloomPassPipeline());
    this.renderControls();
  }

  onFinalize(): void {
    this.imageTexture?.destroy();
    this.shaderPassRenderer?.destroy();
  }

  onRender(): void {
    this.shaderPassRenderer?.resize();
    this.shaderPassRenderer.renderToScreen({sourceTexture: this.imageTexture});
  }

  createImageTexture(imageSource: string): DynamicTexture {
    return new DynamicTexture(this.device, {
      data: loadImageBitmap(imageSource, {imageOrientation: 'flipY'})
    });
  }

  setShaderPasses(shaderPasses: ShaderPassPipeline[]): void {
    this.shaderPassRenderer?.destroy();
    this.shaderPassRenderer = new ShaderPassRenderer(this.device, {shaderPasses});
  }

  getBloomPassPipeline(): ShaderPassPipeline {
    return {
      ...bloomShaderPassPipeline,
      steps: bloomShaderPassPipeline.steps.map(step => {
        switch (step.shaderPass.name) {
          case 'bloomExtract':
            return {...step, uniforms: {...step.uniforms, threshold: this.bloomValues.threshold}};
          case 'bloomBlur':
            return {...step, uniforms: {...step.uniforms, radius: this.bloomValues.radius}};
          case 'bloomComposite':
            return {...step, uniforms: {...step.uniforms, intensity: this.bloomValues.intensity}};
          default:
            return step;
        }
      })
    };
  }

  renderControls(): void {
    const controls = document.getElementById('bloom-controls');
    if (!controls) {
      return;
    }

    controls.replaceChildren();

    for (const [propName, propType] of Object.entries(bloom.propTypes || {})) {
      if (propType.private || propType.value === undefined) {
        continue;
      }

      controls.appendChild(
        this.createNumberControl(
          propName as keyof BloomState,
          this.bloomValues[propName as keyof BloomState],
          propType
        )
      );
    }
  }

  createNumberControl(
    propName: keyof BloomState,
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
      this.bloomValues[propName] = nextValue;
      this.setShaderPasses(this.getBloomPassPipeline());
    });
    row.appendChild(input);

    return row;
  }
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
