// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device, Texture} from '@luma.gl/core';
import {AnimationLoopTemplate, ShaderPassRenderer, type AnimationProps} from '@luma.gl/engine';
import type {ShaderPass} from '@luma.gl/shadertools';
import type {
  Panel,
  SettingDescriptor,
  SettingsChangeDescriptor,
  SettingsSchema,
  SettingsState
} from '@deck.gl-community/panels';
import {
  ExamplePanelManager,
  ExampleSettingsPanelManager,
  getChangedSetting,
  makeExamplePanelHostHtml,
  makeExampleTabbedPanel,
  makeHtmlCustomPanel
} from '../../example-panels';
import {EFFECT_CATEGORY_ORDER, EFFECT_DETAILS, EFFECT_SHADER_PASSES} from './effect-catalog';
import {kineticScenePass} from './kinetic-scene-pass';

const NO_EFFECT = 'No effect';
const DEFAULT_LOOK_NAME: LookName = 'Neon Bloom';
const VECTOR_COMPONENT_LABELS = ['X', 'Y', 'Z', 'W'] as const;
const SAMPLE_HEAVY_EFFECT_NAMES = new Set([
  'denoise',
  'edgeWork',
  'gaussianBlur',
  'ink',
  'tiltShift',
  'triangleBlur',
  'zoomBlur'
]);

type EffectPropValue = number | number[];
export type EffectState = Record<string, EffectPropValue>;
type ShaderPropType = {
  value: unknown;
  min?: number;
  max?: number;
  softMin?: number;
  softMax?: number;
  private?: boolean;
};

type LookName =
  | 'Original'
  | 'Neon Bloom'
  | 'Chromatic Grade'
  | 'Graphic Ink'
  | 'Chromatic Print'
  | 'Dream Zoom'
  | 'Prism Lens';

type LookDefinition = {
  kicker: string;
  description: string;
  accent: string;
  passNames: string[];
  values: Record<string, EffectState>;
};

const LOOK_DEFINITIONS: Record<LookName, LookDefinition> = {
  Original: {
    kicker: 'Reference',
    description: 'The animated calibration scene with no image processing.',
    accent: 'linear-gradient(135deg, #38bdf8, #1e293b 55%, #f472b6)',
    passNames: [],
    values: {}
  },
  'Neon Bloom': {
    kicker: 'Light + Finish',
    description: 'Selective glow and a restrained vignette for luminous depth.',
    accent: 'linear-gradient(135deg, #22d3ee, #6366f1 50%, #f472b6)',
    passNames: ['bloom', 'vignette'],
    values: {
      bloom: {radius: 9, threshold: 0.48, intensity: 1.85},
      vignette: {radius: 0.72, amount: 0.3}
    }
  },
  'Chromatic Grade': {
    kicker: 'Color Pipeline',
    description: 'A cool hue rotation, selective vibrance, and cinematic contrast.',
    accent: 'linear-gradient(135deg, #34d399, #0891b2 48%, #818cf8)',
    passNames: ['hueSaturation', 'vibrance', 'brightnessContrast'],
    values: {
      hueSaturation: {hue: -0.06, saturation: 0.3},
      vibrance: {amount: 0.42},
      brightnessContrast: {brightness: -0.03, contrast: 0.18}
    }
  },
  'Graphic Ink': {
    kicker: 'Edge Stylization',
    description: 'Punchy tonal separation with fine illustrated edge work.',
    accent: 'linear-gradient(135deg, #f8fafc, #64748b 45%, #0f172a)',
    passNames: ['brightnessContrast', 'ink'],
    values: {
      brightnessContrast: {brightness: 0.04, contrast: 0.28},
      ink: {strength: 0.36}
    }
  },
  'Chromatic Print': {
    kicker: 'Print Simulation',
    description: 'Animated RGB geometry resolved through an offset halftone screen.',
    accent: 'linear-gradient(135deg, #f43f5e, #facc15 48%, #22d3ee)',
    passNames: ['colorHalftone', 'vibrance'],
    values: {
      colorHalftone: {center: [0.5, 0.5], angle: 0.32, size: 5.5},
      vibrance: {amount: 0.38}
    }
  },
  'Dream Zoom': {
    kicker: 'Motion Optics',
    description: 'A gentle radial pull that preserves the center calibration target.',
    accent: 'linear-gradient(135deg, #a78bfa, #ec4899 52%, #fb7185)',
    passNames: ['zoomBlur', 'vignette'],
    values: {
      zoomBlur: {center: [0.5, 0.5], strength: 0.12},
      vignette: {radius: 0.68, amount: 0.38}
    }
  },
  'Prism Lens': {
    kicker: 'Pixel Warp',
    description: 'A broad optical swirl followed by highlight recovery.',
    accent: 'linear-gradient(135deg, #60a5fa, #c084fc 48%, #f0abfc)',
    passNames: ['swirl', 'bloom'],
    values: {
      swirl: {center: [0.5, 0.5], radius: 360, angle: 0.75},
      bloom: {radius: 5, threshold: 0.64, intensity: 1.2}
    }
  }
};

const LOOK_ORDER: LookName[] = [
  'Original',
  'Neon Bloom',
  'Chromatic Grade',
  'Graphic Ink',
  'Chromatic Print',
  'Dream Zoom',
  'Prism Lens'
];

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeExamplePanelHostHtml();

  readonly device: Device;
  readonly sourceTexture: Texture;
  readonly shaderPassMap: Record<string, ShaderPass>;
  readonly settingsPanel: ExampleSettingsPanelManager;
  readonly panels: ExamplePanelManager;
  readonly originalShaderPassRenderer: ShaderPassRenderer;
  effectValuesByName: Record<string, EffectState>;
  shaderPassRenderer!: ShaderPassRenderer;
  selectedLookName: LookName = DEFAULT_LOOK_NAME;
  activePassNames: string[] = [];
  motionEnabled = true;
  motionSpeed = 0.72;
  sceneEnergy = 1;
  sceneTime = 0;
  previousFrameTime = 0;
  comparisonOriginal = false;
  effectSearchQuery = '';

  constructor({device}: AnimationProps) {
    super();

    this.device = device;
    this.sourceTexture = device.createTexture({
      id: 'effects-image-processing-seed',
      data: new Uint8Array([2, 4, 12, 255]),
      width: 1,
      height: 1,
      format: 'rgba8unorm'
    });
    this.shaderPassMap = getShaderPasses();
    this.effectValuesByName = getInitialEffectValues(this.shaderPassMap);
    this.applyLookValues(LOOK_DEFINITIONS[this.selectedLookName]);
    this.activePassNames = [...LOOK_DEFINITIONS[this.selectedLookName].passNames];

    this.settingsPanel = new ExampleSettingsPanelManager({
      id: 'postprocessing-tune',
      label: 'Controls',
      sectionPresentation: 'accordion',
      schema: this.makeTuneSettingsSchema(),
      settings: this.makeTuneSettingsState(),
      onSettingsChange: this.handleSettingsChange
    });
    this.panels = new ExamplePanelManager({panel: this.makePanel()});
    this.panels.mount();
    this.originalShaderPassRenderer = new ShaderPassRenderer(this.device, {
      shaderPasses: [kineticScenePass]
    });
    this.setShaderPasses(this.getActiveShaderPasses());
  }

  onFinalize(): void {
    this.settingsPanel.finalize();
    this.panels.finalize();
    this.sourceTexture.destroy();
    this.shaderPassRenderer?.destroy();
    this.originalShaderPassRenderer.destroy();
  }

  onRender({time}: AnimationProps): void {
    if (this.previousFrameTime > 0 && this.motionEnabled) {
      const elapsedSeconds = Math.min(Math.max((time - this.previousFrameTime) / 1000, 0), 0.05);
      this.sceneTime += elapsedSeconds * this.motionSpeed;
    }
    this.previousFrameTime = time;

    const [drawingBufferWidth, drawingBufferHeight] = this.device
      .getCanvasContext()
      .getDrawingBufferSize();
    const resolutionScale = getEffectResolutionScale(this.activePassNames);
    this.shaderPassRenderer.resize([
      Math.max(Math.round(drawingBufferWidth * resolutionScale), 1),
      Math.max(Math.round(drawingBufferHeight * resolutionScale), 1)
    ]);
    this.originalShaderPassRenderer.resize([drawingBufferWidth, drawingBufferHeight]);
    const activeRenderer = this.comparisonOriginal
      ? this.originalShaderPassRenderer
      : this.shaderPassRenderer;
    activeRenderer.renderToScreen({
      sourceTexture: this.sourceTexture,
      uniforms: this.makeActiveUniforms()
    });
  }

  applyLook(lookName: LookName, restoreFocus = false): void {
    const look = LOOK_DEFINITIONS[lookName];
    this.selectedLookName = lookName;
    this.activePassNames = [...look.passNames];
    this.applyLookValues(look);
    this.comparisonOriginal = false;
    this.setShaderPasses(this.getActiveShaderPasses());
    this.syncPanels(restoreFocus ? `[data-look-name="${lookName}"]` : undefined);
  }

  setEffectEnabled(passName: string, enabled: boolean): void {
    if (!this.shaderPassMap[passName]) {
      return;
    }

    const nextPassNames = updateEffectPassNames(this.activePassNames, passName, enabled);
    this.setActivePassNames(
      nextPassNames,
      `[data-effect-library-item][data-effect-name="${passName}"]`
    );
  }

  moveEffect(passName: string, direction: -1 | 1): void {
    const nextPassNames = reorderEffectPassNames(this.activePassNames, passName, direction);
    const focusAction = direction < 0 ? 'move-up' : 'move-down';
    this.setActivePassNames(
      nextPassNames,
      `[data-effect-action="${focusAction}"][data-effect-name="${passName}"]`
    );
  }

  setComparisonOriginal(showOriginal: boolean): void {
    if (this.activePassNames.length === 0) {
      this.comparisonOriginal = false;
      return;
    }
    if (showOriginal === this.comparisonOriginal) {
      return;
    }
    this.comparisonOriginal = showOriginal;
  }

  setShaderPasses(shaderPasses: ShaderPass[]): void {
    this.shaderPassRenderer?.destroy();
    this.shaderPassRenderer = new ShaderPassRenderer(this.device, {shaderPasses});
  }

  private setActivePassNames(nextPassNames: string[], focusSelector?: string): void {
    if (nextPassNames === this.activePassNames) {
      return;
    }

    this.activePassNames = nextPassNames;
    if (this.activePassNames.length === 0) {
      this.comparisonOriginal = false;
    }
    this.setShaderPasses(this.getActiveShaderPasses());
    this.syncPanels(focusSelector);
  }

  private getActiveShaderPasses(): ShaderPass[] {
    const effectPasses = this.activePassNames
      .map(passName => this.shaderPassMap[passName])
      .filter((shaderPass): shaderPass is ShaderPass => Boolean(shaderPass));
    return [kineticScenePass, ...effectPasses];
  }

  private makeActiveUniforms(): Record<string, EffectState> {
    const uniforms: Record<string, EffectState> = {
      [kineticScenePass.name]: {
        time: this.sceneTime,
        energy: this.sceneEnergy
      }
    };
    for (const passName of this.activePassNames) {
      const shaderPass = this.shaderPassMap[passName];
      if (shaderPass) {
        uniforms[shaderPass.name] = this.effectValuesByName[passName] || {};
      }
    }
    return uniforms;
  }

  private applyLookValues(look: LookDefinition): void {
    for (const passName of look.passNames) {
      const defaultValues = getDefaultEffectValues(this.shaderPassMap[passName]);
      const presetValues = look.values[passName] || {};
      this.effectValuesByName[passName] = {
        ...defaultValues,
        ...cloneEffectState(presetValues)
      };
    }
  }

  private makeTuneSettingsState(): SettingsState {
    const settings: SettingsState = {
      motionEnabled: this.motionEnabled,
      motionSpeed: this.motionSpeed,
      sceneEnergy: this.sceneEnergy
    };
    for (const passName of this.activePassNames) {
      Object.assign(
        settings,
        flattenEffectSettings(passName, this.effectValuesByName[passName] || {})
      );
    }
    return settings;
  }

  private makeTuneSettingsSchema(): SettingsSchema {
    return {
      title: 'Controls',
      sections: [
        {
          id: 'source-motion',
          name: 'Animated Source',
          description: 'Control the procedural calibration scene before processing.',
          initiallyCollapsed: false,
          settings: [
            {
              name: 'motionEnabled',
              label: 'Motion',
              type: 'boolean',
              persist: 'none'
            },
            {
              name: 'motionSpeed',
              label: 'Motion Speed',
              type: 'number',
              persist: 'none',
              min: 0.15,
              max: 1.6,
              step: 0.05
            },
            {
              name: 'sceneEnergy',
              label: 'Scene Energy',
              type: 'number',
              persist: 'none',
              min: 0.5,
              max: 1.35,
              step: 0.01
            }
          ]
        },
        ...this.activePassNames.flatMap((passName, index) => {
          const shaderPass = this.shaderPassMap[passName];
          if (!shaderPass) {
            return [];
          }
          const details = EFFECT_DETAILS[passName];
          return [
            {
              id: `effect-${passName}`,
              name: details?.label || formatControlLabel(passName),
              description: details?.description,
              initiallyCollapsed: index > 0,
              settings: getEffectSettingDescriptors(
                passName,
                this.effectValuesByName[passName] || {},
                shaderPass
              )
            }
          ];
        })
      ]
    };
  }

  private makePanel(): Panel {
    return makeExampleTabbedPanel({
      id: 'postprocessing-tabs',
      title: 'Effects: Image Processing',
      tabListLayout: 'scroll',
      panels: [
        makeHtmlCustomPanel({
          id: 'postprocessing-looks',
          title: 'Looks',
          html: makeLooksHtml(this.selectedLookName, this.comparisonOriginal, this.activePassNames),
          onRender: rootElement => this.bindLooksPanel(rootElement)
        }),
        makeHtmlCustomPanel({
          id: 'postprocessing-stack',
          title: 'Effects Stack',
          html: makeEffectsStackHtml(
            this.activePassNames,
            this.selectedLookName,
            this.effectSearchQuery
          ),
          onRender: rootElement => this.bindEffectsStackPanel(rootElement)
        }),
        this.settingsPanel.makePanel(),
        makeHtmlCustomPanel({
          id: 'postprocessing-about',
          title: 'About',
          html: makeAboutHtml()
        })
      ]
    });
  }

  private bindLooksPanel(rootElement: HTMLElement): () => void {
    const handleClick = (event: Event): void => {
      if (!(event.target instanceof Element)) {
        return;
      }
      const lookButton = event.target.closest<HTMLElement>('[data-look-name]');
      const lookName = lookButton?.dataset.lookName;
      if (isLookName(lookName)) {
        this.applyLook(lookName, true);
        return;
      }
      if (event.target.closest('[data-open-effects-stack]')) {
        this.openPanelTab('Effects Stack');
        return;
      }
      const comparisonButton = event.target.closest<HTMLButtonElement>('[data-original-compare]');
      if (comparisonButton && !comparisonButton.disabled) {
        this.setComparisonOriginal(!this.comparisonOriginal);
        comparisonButton.setAttribute('aria-pressed', String(this.comparisonOriginal));
      }
    };

    rootElement.addEventListener('click', handleClick);

    return () => {
      rootElement.removeEventListener('click', handleClick);
    };
  }

  private bindEffectsStackPanel(rootElement: HTMLElement): () => void {
    const handleClick = (event: Event): void => {
      if (!(event.target instanceof Element)) {
        return;
      }

      const actionButton = event.target.closest<HTMLButtonElement>('[data-effect-action]');
      const passName = actionButton?.dataset.effectName;
      if (!passName || !this.shaderPassMap[passName]) {
        return;
      }

      switch (actionButton?.dataset.effectAction) {
        case 'add':
          this.setEffectEnabled(passName, true);
          break;
        case 'remove':
          this.setEffectEnabled(passName, false);
          break;
        case 'move-up':
          this.moveEffect(passName, -1);
          break;
        case 'move-down':
          this.moveEffect(passName, 1);
          break;
        default:
          break;
      }
    };

    const handleInput = (event: Event): void => {
      if (
        !(event.target instanceof HTMLInputElement) ||
        !event.target.hasAttribute('data-effect-search')
      ) {
        return;
      }
      this.effectSearchQuery = event.target.value;
      filterEffectsLibrary(rootElement, this.effectSearchQuery);
    };

    rootElement.addEventListener('click', handleClick);
    rootElement.addEventListener('input', handleInput);
    filterEffectsLibrary(rootElement, this.effectSearchQuery);

    return () => {
      rootElement.removeEventListener('click', handleClick);
      rootElement.removeEventListener('input', handleInput);
    };
  }

  private openPanelTab(panelTitle: string): void {
    const tabButtons = document.querySelectorAll<HTMLButtonElement>('[data-panel-tabs] > button');
    const panelTab = Array.from(tabButtons).find(
      tabButton => tabButton.textContent?.trim() === panelTitle
    );
    if (!panelTab) {
      return;
    }

    panelTab.dispatchEvent(new Event('pointerdown', {bubbles: true, cancelable: true}));
    panelTab.focus();
  }

  private syncPanels(focusSelector?: string): void {
    this.settingsPanel.setSchemaAndSettings(
      this.makeTuneSettingsSchema(),
      this.makeTuneSettingsState()
    );
    this.panels.setPanel(this.makePanel());
    if (focusSelector && typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        const focusTarget = document.querySelector<HTMLButtonElement>(focusSelector);
        if (focusTarget && !focusTarget.disabled) {
          focusTarget.focus();
        }
      });
    }
  }

  private readonly handleSettingsChange = (
    settings: SettingsState,
    changedSettings?: SettingsChangeDescriptor[]
  ): void => {
    const motionEnabled = getChangedSetting(changedSettings, 'motionEnabled')?.nextValue;
    const motionSpeed = getChangedSetting(changedSettings, 'motionSpeed')?.nextValue;
    const sceneEnergy = getChangedSetting(changedSettings, 'sceneEnergy')?.nextValue;
    if (typeof motionEnabled === 'boolean') {
      this.motionEnabled = motionEnabled;
    }
    if (typeof motionSpeed === 'number') {
      this.motionSpeed = motionSpeed;
    }
    if (typeof sceneEnergy === 'number') {
      this.sceneEnergy = sceneEnergy;
    }
    for (const passName of this.activePassNames) {
      this.effectValuesByName[passName] = unflattenEffectSettings(
        passName,
        settings,
        this.effectValuesByName[passName] || {}
      );
    }
  };
}

function getShaderPasses(): Record<string, ShaderPass> {
  return {...EFFECT_SHADER_PASSES};
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

function getDefaultEffectValues(shaderPass?: ShaderPass): EffectState {
  const values: EffectState = {};
  if (!shaderPass) {
    return values;
  }
  for (const [propName, propType] of getControllableProps(shaderPass)) {
    const nextValue = cloneEffectValue(propType.value);
    if (nextValue !== undefined) {
      values[propName] = nextValue;
    }
  }
  return values;
}

function getControllableProps(shaderPass: ShaderPass): [string, ShaderPropType][] {
  const controllableProps: [string, ShaderPropType][] = [];
  for (const [propName, propType] of Object.entries(shaderPass.propTypes || {})) {
    const normalizedPropType = typeof propType === 'number' ? {value: propType} : propType;
    if (!normalizedPropType.private && normalizedPropType.value !== undefined) {
      controllableProps.push([propName, normalizedPropType as ShaderPropType]);
    }
  }
  return controllableProps;
}

/** Derives adaptive render resolution from the effects that are actually active. */
export function getEffectResolutionScale(activePassNames: readonly string[]): number {
  if (activePassNames.includes('zoomBlur')) {
    return 0.65;
  }

  return activePassNames.some(passName => SAMPLE_HEAVY_EFFECT_NAMES.has(passName)) ? 0.75 : 1;
}

/** Adds or removes one effect while preserving an ordered, duplicate-free stack. */
export function updateEffectPassNames(
  activePassNames: string[],
  passName: string,
  enabled: boolean
): string[] {
  const passIndex = activePassNames.indexOf(passName);
  if (enabled) {
    return passIndex < 0 ? [...activePassNames, passName] : activePassNames;
  }

  return passIndex < 0
    ? activePassNames
    : activePassNames.filter(activePassName => activePassName !== passName);
}

/** Moves one effect by a single position without mutating the existing stack. */
export function reorderEffectPassNames(
  activePassNames: string[],
  passName: string,
  direction: -1 | 1
): string[] {
  const currentIndex = activePassNames.indexOf(passName);
  const nextIndex = currentIndex + direction;
  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= activePassNames.length) {
    return activePassNames;
  }

  const nextPassNames = [...activePassNames];
  [nextPassNames[currentIndex], nextPassNames[nextIndex]] = [
    nextPassNames[nextIndex],
    nextPassNames[currentIndex]
  ];
  return nextPassNames;
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

function makeLooksHtml(
  selectedLookName: LookName,
  comparisonOriginal: boolean,
  activePassNames: string[]
): string {
  const hasEffects = activePassNames.length > 0;
  const customizedLook = isCustomizedLook(selectedLookName, activePassNames);
  const cards = LOOK_ORDER.map(lookName => {
    const look = LOOK_DEFINITIONS[lookName];
    const isSelected = lookName === selectedLookName;
    const passLabel =
      look.passNames.length === 0
        ? 'Source only'
        : `${look.passNames.length} ${look.passNames.length === 1 ? 'pass' : 'passes'}`;
    return `
      <button class="effects-look-card" type="button" data-look-name="${lookName}" aria-pressed="${isSelected}">
        <span class="effects-look-swatch" style="background:${look.accent}"></span>
        <span class="effects-look-copy">
          <span class="effects-look-kicker">${look.kicker} · ${passLabel}</span>
          <span class="effects-look-title">${lookName}</span>
          <span class="effects-look-description">${look.description}</span>
        </span>
        <span class="effects-look-check" aria-hidden="true">✓</span>
      </button>`;
  }).join('');

  return `
    <style>
      .effects-lab { container-type: inline-size; color: #e2e8f0; font: 13px/1.45 Inter, ui-sans-serif, system-ui, sans-serif; }
      .effects-lab * { box-sizing: border-box; }
      .effects-lab-header { padding: 15px 15px 12px; border-bottom: 1px solid rgba(148, 163, 184, .16); background: radial-gradient(circle at 12% 0%, rgba(56, 189, 248, .13), transparent 42%); }
      .effects-lab-kicker { margin: 0 0 4px; color: #67e8f9; font-size: 10px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
      .effects-lab-title { margin: 0; color: #f8fafc; font-size: 17px; font-weight: 750; letter-spacing: -.02em; }
      .effects-lab-intro { margin: 5px 0 0; color: #94a3b8; font-size: 12px; }
      .effects-lab-chips { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 10px; }
      .effects-lab-chip { padding: 3px 7px; border: 1px solid rgba(125, 211, 252, .18); border-radius: 999px; background: rgba(14, 116, 144, .1); color: #bae6fd; font-size: 10px; font-weight: 650; }
      .effects-look-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; padding: 10px; }
      .effects-look-card { position: relative; display: flex; min-width: 0; min-height: 112px; margin: 0; padding: 0; overflow: hidden; border: 1px solid rgba(148, 163, 184, .16); border-radius: 10px; background: rgba(15, 23, 42, .62); color: inherit; text-align: left; cursor: pointer; transition: transform 120ms ease, border-color 120ms ease, background 120ms ease; }
      .effects-look-card:hover { transform: translateY(-1px); border-color: rgba(125, 211, 252, .46); background: rgba(30, 41, 59, .78); }
      .effects-look-card[aria-pressed='true'] { border-color: rgba(103, 232, 249, .68); background: linear-gradient(145deg, rgba(8, 47, 73, .7), rgba(30, 41, 59, .82)); box-shadow: inset 0 0 0 1px rgba(103, 232, 249, .12), 0 8px 22px rgba(2, 8, 23, .22); }
      .effects-look-swatch { flex: 0 0 7px; align-self: stretch; opacity: .9; }
      .effects-look-copy { display: flex; min-width: 0; flex-direction: column; padding: 10px 9px 10px 10px; }
      .effects-look-kicker { color: #7dd3fc; font-size: 9px; font-weight: 800; letter-spacing: .07em; text-transform: uppercase; }
      .effects-look-title { margin-top: 2px; color: #f8fafc; font-size: 12px; font-weight: 750; }
      .effects-look-description { margin-top: 4px; color: #94a3b8; font-size: 10.5px; line-height: 1.35; }
      .effects-look-check { position: absolute; top: 7px; right: 7px; display: none; color: #67e8f9; font-size: 11px; font-weight: 900; }
      .effects-look-card[aria-pressed='true'] .effects-look-check { display: block; }
      .effects-lab-actions { display: flex; flex-wrap: wrap; gap: 7px; padding: 0 10px 11px; }
      .effects-action { min-height: 35px; margin: 0; padding: 7px 9px; border: 1px solid rgba(148, 163, 184, .2); border-radius: 8px; background: rgba(15, 23, 42, .72); color: #cbd5e1; font: 650 11px/1.2 Inter, ui-sans-serif, system-ui, sans-serif; cursor: pointer; }
      .effects-action:hover, .effects-action:focus-visible { border-color: rgba(125, 211, 252, .55); color: #f8fafc; outline: none; }
      .effects-action[aria-pressed='true'] { border-color: #67e8f9; background: rgba(8, 145, 178, .22); color: #ecfeff; }
      .effects-action:disabled { cursor: not-allowed; opacity: .42; }
      .effects-action-primary { border-color: rgba(103, 232, 249, .4); background: rgba(8, 47, 73, .7); color: #cffafe; }
      .effects-look-customized { border-color: rgba(251, 191, 36, .3); background: rgba(120, 53, 15, .24); color: #fde68a; }
      .effects-lab-hint { margin: 0; padding: 0 12px 13px; color: #64748b; font-size: 10px; text-align: center; }
      @container (max-width: 330px) { .effects-look-grid { grid-template-columns: 1fr; } }
    </style>
    <div class="effects-lab">
      <header class="effects-lab-header">
        <p class="effects-lab-kicker">Realtime image laboratory</p>
        <h3 class="effects-lab-title">Kinetic Color Lab</h3>
        <p class="effects-lab-intro">Start with a look, customize its effect stack, and adjust every live uniform.</p>
        <div class="effects-lab-chips"><span class="effects-lab-chip">${Object.keys(EFFECT_SHADER_PASSES).length} image effects</span><span class="effects-lab-chip">WebGL + WebGPU</span>${customizedLook ? '<span class="effects-lab-chip effects-look-customized">Customized stack</span>' : ''}</div>
      </header>
      <div class="effects-look-grid">${cards}</div>
      <div class="effects-lab-actions">
        <button class="effects-action effects-action-primary" type="button" data-open-effects-stack>Customize this look</button>
        <button class="effects-action" type="button" data-original-compare aria-pressed="${comparisonOriginal}" ${hasEffects ? '' : 'disabled'}>Original preview</button>
      </div>
      <p class="effects-lab-hint">Effects Stack adds or reorders passes. Controls adjusts their live settings.</p>
    </div>`;
}

function makeEffectsStackHtml(
  activePassNames: string[],
  selectedLookName: LookName,
  effectSearchQuery: string
): string {
  const customizedLook = isCustomizedLook(selectedLookName, activePassNames);
  const effectCount = Object.keys(EFFECT_SHADER_PASSES).length;
  const activeRows = activePassNames
    .map((passName, index) => {
      const details = EFFECT_DETAILS[passName];
      const effectLabel = details?.label || formatControlLabel(passName);
      return `
        <li class="effects-stack-step">
          <span class="effects-stack-step-number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
          <span class="effects-stack-step-copy">
            <span class="effects-stack-step-title">${escapeHtml(effectLabel)}</span>
            <span class="effects-stack-step-category">${escapeHtml(details?.category || 'Image effect')}</span>
          </span>
          <span class="effects-stack-step-actions">
            <button class="effects-stack-icon-button" type="button" data-effect-action="move-up" data-effect-name="${passName}" aria-label="Move ${escapeHtml(effectLabel)} earlier" ${index === 0 ? 'disabled' : ''}>↑</button>
            <button class="effects-stack-icon-button" type="button" data-effect-action="move-down" data-effect-name="${passName}" aria-label="Move ${escapeHtml(effectLabel)} later" ${index === activePassNames.length - 1 ? 'disabled' : ''}>↓</button>
            <button class="effects-stack-icon-button effects-stack-remove" type="button" data-effect-action="remove" data-effect-name="${passName}" aria-label="Remove ${escapeHtml(effectLabel)}">×</button>
          </span>
        </li>`;
    })
    .join('');

  const libraryGroups = EFFECT_CATEGORY_ORDER.map(category => {
    const categoryPassNames = Object.keys(EFFECT_SHADER_PASSES).filter(
      passName => EFFECT_DETAILS[passName]?.category === category
    );
    const categoryRows = categoryPassNames
      .map(passName => {
        const details = EFFECT_DETAILS[passName];
        const active = activePassNames.includes(passName);
        const action = active ? 'remove' : 'add';
        const actionLabel = active ? 'Remove' : 'Add';
        const searchText = `${details.label} ${details.category} ${details.description}`;
        return `
          <button class="effects-library-item" type="button" data-effect-library-item data-effect-action="${action}" data-effect-name="${passName}" data-effect-search-text="${escapeHtml(searchText.toLowerCase())}" aria-label="${actionLabel} ${escapeHtml(details.label)}" aria-pressed="${active}">
            <span class="effects-library-copy">
              <span class="effects-library-title">${escapeHtml(details.label)}</span>
              <span class="effects-library-description">${escapeHtml(details.description)}</span>
            </span>
            <span class="effects-library-action" aria-hidden="true">${active ? '✓' : '+'}</span>
          </button>`;
      })
      .join('');

    return `
      <section class="effects-library-group" data-effect-category-group>
        <h4 class="effects-library-group-title">${escapeHtml(category)} <span>${categoryPassNames.length}</span></h4>
        <div class="effects-library-list">${categoryRows}</div>
      </section>`;
  }).join('');

  return `
    <style>
      .effects-stack { container-type: inline-size; color: #e2e8f0; font: 12px/1.45 Inter, ui-sans-serif, system-ui, sans-serif; }
      .effects-stack * { box-sizing: border-box; }
      .effects-stack [hidden] { display: none !important; }
      .effects-stack-header { padding: 15px 15px 12px; border-bottom: 1px solid rgba(148, 163, 184, .16); background: radial-gradient(circle at 12% 0%, rgba(56, 189, 248, .13), transparent 46%); }
      .effects-stack-kicker { margin: 0 0 4px; color: #67e8f9; font-size: 10px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
      .effects-stack-title { margin: 0; color: #f8fafc; font-size: 17px; font-weight: 750; letter-spacing: -.02em; }
      .effects-stack-intro { margin: 5px 0 0; color: #94a3b8; font-size: 11px; }
      .effects-stack-origin { display: inline-flex; margin-top: 9px; padding: 3px 8px; border: 1px solid rgba(125, 211, 252, .18); border-radius: 999px; background: rgba(14, 116, 144, .1); color: #bae6fd; font-size: 10px; font-weight: 650; }
      .effects-stack-origin-custom { border-color: rgba(251, 191, 36, .3); background: rgba(120, 53, 15, .22); color: #fde68a; }
      .effects-stack-section { padding: 12px 12px 0; }
      .effects-stack-section-heading { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 9px; }
      .effects-stack-section-title { margin: 0; color: #f8fafc; font-size: 11px; font-weight: 750; letter-spacing: .04em; text-transform: uppercase; }
      .effects-stack-count { color: #7dd3fc; font-size: 10px; font-weight: 700; }
      .effects-stack-source { display: flex; align-items: center; gap: 8px; min-height: 33px; padding: 7px 9px; border: 1px solid rgba(56, 189, 248, .24); border-radius: 8px; background: rgba(8, 47, 73, .48); color: #bae6fd; font-size: 10px; font-weight: 650; }
      .effects-stack-source-dot { width: 7px; height: 7px; flex: 0 0 7px; border-radius: 50%; background: #67e8f9; box-shadow: 0 0 10px rgba(103, 232, 249, .7); }
      .effects-stack-list { display: grid; gap: 6px; margin: 7px 0 0; padding: 0; list-style: none; }
      .effects-stack-step { display: flex; align-items: center; min-height: 49px; gap: 8px; padding: 7px; border: 1px solid rgba(148, 163, 184, .17); border-radius: 8px; background: rgba(15, 23, 42, .66); }
      .effects-stack-step-number { width: 20px; color: #64748b; font-size: 10px; font-weight: 800; text-align: center; }
      .effects-stack-step-copy { display: flex; min-width: 0; flex: 1 1 auto; flex-direction: column; }
      .effects-stack-step-title { overflow: hidden; color: #f8fafc; font-size: 11px; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
      .effects-stack-step-category { overflow: hidden; color: #94a3b8; font-size: 9px; text-overflow: ellipsis; white-space: nowrap; }
      .effects-stack-step-actions { display: flex; flex: 0 0 auto; gap: 4px; }
      .effects-stack-icon-button { display: inline-flex; width: 26px; height: 26px; align-items: center; justify-content: center; margin: 0; padding: 0; border: 1px solid rgba(148, 163, 184, .2); border-radius: 6px; background: rgba(30, 41, 59, .68); color: #cbd5e1; font-size: 14px; cursor: pointer; }
      .effects-stack-icon-button:hover, .effects-stack-icon-button:focus-visible { border-color: rgba(125, 211, 252, .58); color: #f8fafc; outline: none; }
      .effects-stack-icon-button:disabled { cursor: not-allowed; opacity: .32; }
      .effects-stack-remove:hover, .effects-stack-remove:focus-visible { border-color: rgba(251, 113, 133, .62); color: #fecdd3; }
      .effects-stack-empty { margin: 9px 0 0; padding: 12px; border: 1px dashed rgba(148, 163, 184, .24); border-radius: 8px; color: #94a3b8; font-size: 10px; text-align: center; }
      .effects-library { margin-top: 16px; padding-bottom: 13px; }
      .effects-library-search { display: block; width: 100%; min-height: 37px; margin: 0 0 9px; padding: 8px 10px; border: 1px solid rgba(148, 163, 184, .24); border-radius: 8px; background: rgba(15, 23, 42, .7); color: #f8fafc; font: 11px/1.2 Inter, ui-sans-serif, system-ui, sans-serif; }
      .effects-library-search::placeholder { color: #64748b; }
      .effects-library-search:focus { border-color: rgba(125, 211, 252, .62); outline: none; }
      .effects-library-group { margin-top: 12px; }
      .effects-library-group-title { display: flex; align-items: center; justify-content: space-between; margin: 0 0 6px; color: #cbd5e1; font-size: 10px; font-weight: 750; letter-spacing: .04em; text-transform: uppercase; }
      .effects-library-group-title span { color: #64748b; font-size: 9px; }
      .effects-library-list { display: grid; gap: 5px; }
      .effects-library-item { display: flex; width: 100%; align-items: center; justify-content: space-between; gap: 8px; min-height: 49px; margin: 0; padding: 8px 9px; border: 1px solid rgba(148, 163, 184, .14); border-radius: 8px; background: rgba(15, 23, 42, .55); color: inherit; text-align: left; cursor: pointer; }
      .effects-library-item:hover, .effects-library-item:focus-visible { border-color: rgba(125, 211, 252, .48); background: rgba(30, 41, 59, .72); outline: none; }
      .effects-library-item[aria-pressed='true'] { border-color: rgba(103, 232, 249, .45); background: rgba(8, 47, 73, .58); }
      .effects-library-copy { display: flex; min-width: 0; flex: 1 1 auto; flex-direction: column; gap: 2px; }
      .effects-library-title { color: #f8fafc; font-size: 10px; font-weight: 700; }
      .effects-library-description { color: #94a3b8; font-size: 9px; line-height: 1.35; }
      .effects-library-action { display: inline-flex; width: 22px; height: 22px; flex: 0 0 22px; align-items: center; justify-content: center; border: 1px solid rgba(148, 163, 184, .25); border-radius: 6px; color: #7dd3fc; font-size: 15px; }
      .effects-library-item[aria-pressed='true'] .effects-library-action { border-color: rgba(103, 232, 249, .42); background: rgba(8, 145, 178, .22); color: #67e8f9; }
      .effects-library-no-results { margin: 10px 0 0; color: #94a3b8; font-size: 10px; text-align: center; }
      @container (max-width: 300px) { .effects-stack-step { gap: 5px; padding: 6px; } .effects-stack-step-number { width: 16px; } .effects-stack-icon-button { width: 24px; height: 24px; } }
    </style>
    <section class="effects-stack">
      <header class="effects-stack-header">
        <p class="effects-stack-kicker">Build your own pipeline</p>
        <h3 class="effects-stack-title">Effect Composer</h3>
        <p class="effects-stack-intro">Add any image effect, reorder the live stack, and fine-tune each pass under Controls.</p>
        <span class="effects-stack-origin${customizedLook ? ' effects-stack-origin-custom' : ''}">${escapeHtml(selectedLookName)}${customizedLook ? ' · customized' : ' preset'}</span>
      </header>
      <section class="effects-stack-section" aria-label="Active effect stack">
        <div class="effects-stack-section-heading">
          <h4 class="effects-stack-section-title">Active pipeline</h4>
          <span class="effects-stack-count" aria-live="polite">${activePassNames.length} ${activePassNames.length === 1 ? 'pass' : 'passes'}</span>
        </div>
        <div class="effects-stack-source"><span class="effects-stack-source-dot" aria-hidden="true"></span>Animated source · always on</div>
        ${activeRows ? `<ol class="effects-stack-list">${activeRows}</ol>` : '<p class="effects-stack-empty">No effects yet. Add any module from the library below.</p>'}
      </section>
      <section class="effects-stack-section effects-library" aria-label="Available image effects">
        <div class="effects-stack-section-heading">
          <h4 class="effects-stack-section-title">Effect library</h4>
          <span class="effects-stack-count" data-effect-result-count>${effectCount} effects</span>
        </div>
        <input class="effects-library-search" type="search" data-effect-search aria-label="Search available effects" placeholder="Search ${effectCount} effects" value="${escapeHtml(effectSearchQuery)}" />
        ${libraryGroups}
        <p class="effects-library-no-results" data-effect-no-results hidden>No matching effects. Try a different search.</p>
      </section>
    </section>`;
}

function filterEffectsLibrary(rootElement: HTMLElement, searchQuery: string): void {
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const libraryItems = rootElement.querySelectorAll<HTMLElement>('[data-effect-library-item]');
  let visibleEffectCount = 0;

  for (const libraryItem of libraryItems) {
    const searchText = libraryItem.dataset.effectSearchText || '';
    const visible = !normalizedSearchQuery || searchText.includes(normalizedSearchQuery);
    libraryItem.hidden = !visible;
    if (visible) {
      visibleEffectCount++;
    }
  }

  const categoryGroups = rootElement.querySelectorAll<HTMLElement>('[data-effect-category-group]');
  for (const categoryGroup of categoryGroups) {
    categoryGroup.hidden = !categoryGroup.querySelector('[data-effect-library-item]:not([hidden])');
  }

  const resultCount = rootElement.querySelector<HTMLElement>('[data-effect-result-count]');
  if (resultCount) {
    resultCount.textContent = `${visibleEffectCount} ${visibleEffectCount === 1 ? 'effect' : 'effects'}`;
  }
  const emptyState = rootElement.querySelector<HTMLElement>('[data-effect-no-results]');
  if (emptyState) {
    emptyState.hidden = visibleEffectCount > 0;
  }
}

function isCustomizedLook(selectedLookName: LookName, activePassNames: string[]): boolean {
  const presetPassNames = LOOK_DEFINITIONS[selectedLookName].passNames;
  return (
    presetPassNames.length !== activePassNames.length ||
    presetPassNames.some((passName, index) => passName !== activePassNames[index])
  );
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function makeAboutHtml(): string {
  return `
    <div style="padding:14px 15px;color:#cbd5e1;font:12px/1.55 Inter,ui-sans-serif,system-ui,sans-serif">
      <p style="margin:0 0 10px;color:#f8fafc;font-size:15px;font-weight:750">A live test chart, not a fixed photograph.</p>
      <p style="margin:0 0 10px">The first fullscreen pass generates a moving scene with fine lines, broad gradients, saturated edges, highlights, and low-contrast shadow detail. Those signals make blur, bloom, color, edge, print, and warp behavior legible at a glance.</p>
      <p style="margin:0 0 10px"><b style="color:#7dd3fc">Editable pipelines:</b> each Look starts with ordinary <code>ShaderPass</code> modules. Effects Stack exposes the complete portable image-effect library, and Controls adjusts the same typed properties an application can drive directly. Sample-heavy stacks use a controlled processing resolution to stay fluid on high-DPI displays.</p>
      <p style="margin:0"><b style="color:#7dd3fc">Portable by design:</b> the procedural source and every selected effect provide both WGSL and GLSL, so the visual language stays consistent across WebGPU and WebGL.</p>
    </div>`;
}

function isLookName(value: string | undefined): value is LookName {
  return Boolean(value && value in LOOK_DEFINITIONS);
}

function cloneEffectState(effectState: EffectState): EffectState {
  return Object.fromEntries(
    Object.entries(effectState).map(([propName, propValue]) => [
      propName,
      typeof propValue === 'number' ? propValue : [...propValue]
    ])
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
