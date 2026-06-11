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

const BLOOM_UNIFORMS = {
  threshold: 0.55,
  intensity: 1.8,
  radius: 8
} as const;

type BloomState = Record<'threshold' | 'intensity' | 'radius', number>;
type ShaderPropType = NonNullable<typeof bloom.propTypes>[string];

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeExamplePanelHostHtml();

  device: Device;
  imageTexture: DynamicTexture;
  bloomValues: BloomState = {...BLOOM_UNIFORMS};
  readonly settingsPanel: ExampleSettingsPanelManager;
  readonly panels: ExamplePanelManager;
  shaderPassRenderer!: ShaderPassRenderer;

  constructor({device}: AnimationProps) {
    super();

    this.device = device;
    this.imageTexture = this.createImageTexture('bloom-scene.png');
    this.settingsPanel = new ExampleSettingsPanelManager({
      id: 'bloom-settings',
      schema: makeBloomSettingsSchema(),
      settings: this.bloomValues,
      onSettingsChange: this.handleSettingsChange
    });
    this.panels = new ExamplePanelManager({panel: this.makePanel()});
    this.panels.mount();
    this.setShaderPasses([this.getBloomPassPipeline()]);
  }

  onFinalize(): void {
    this.settingsPanel.finalize();
    this.panels.finalize();
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

  private makePanel(): Panel {
    return new ColumnPanel({
      id: 'bloom-controls',
      title: 'Controls',
      panels: [
        makeHtmlCustomPanel({
          id: 'bloom-description',
          title: '',
          html: '<p>Experimental bloom pipeline demo using extracted highlights, multi-stage blur targets, and final recomposition.</p>'
        }),
        this.settingsPanel.makePanel()
      ]
    });
  }

  private readonly handleSettingsChange = (
    settings: Record<string, unknown>,
    changedSettings?: SettingsChangeDescriptor[]
  ): void => {
    for (const propName of Object.keys(this.bloomValues) as (keyof BloomState)[]) {
      const nextValue = getChangedSetting(changedSettings, propName)?.nextValue;
      if (typeof nextValue === 'number') {
        this.bloomValues[propName] = nextValue;
      }
    }
    this.setShaderPasses([this.getBloomPassPipeline()]);
  };
}

export function makeBloomSettingsSchema(): SettingsSchema {
  return {
    title: 'Settings',
    sections: [
      {
        id: 'bloom',
        name: 'Bloom',
        initiallyCollapsed: false,
        settings: Object.entries(bloom.propTypes || {})
          .filter(([, propType]) => !propType.private && typeof propType.value === 'number')
          .map(([propName, propType]) => {
            const value = propType.value as number;
            const bounds = getControlBounds(value, propType);
            return {
              name: propName,
              label: formatControlLabel(propName),
              type: 'number' as const,
              persist: 'none' as const,
              min: bounds.min,
              max: bounds.max,
              step: bounds.step
            };
          })
      }
    ]
  };
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
