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
import {EFFECT_DETAILS, EFFECT_SHADER_PASSES} from './effect-catalog';
import {kineticScenePass} from './kinetic-scene-pass';
import {
  DEFAULT_LOOK_NAME,
  LookName,
  LookDefinition,
  FOCUSED_EFFECT_PREVIEW_VALUES,
  LOOK_DEFINITIONS,
  makeLooksHtml,
  makeEffectsStackHtml,
  filterEffectsLibrary,
  makeAboutHtml,
  isLookName,
  formatControlLabel
} from './app-ui';

const NO_EFFECT = 'No effect';
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

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeExamplePanelHostHtml();
  static initialEffectName?: string;

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
    const initialEffectName = (this.constructor as typeof AppAnimationLoopTemplate)
      .initialEffectName;
    this.activePassNames = getInitialPostprocessingPassNames(initialEffectName);
    if (initialEffectName && this.activePassNames[0] === initialEffectName) {
      this.effectValuesByName[initialEffectName] = {
        ...this.effectValuesByName[initialEffectName],
        ...cloneEffectState(FOCUSED_EFFECT_PREVIEW_VALUES[initialEffectName] || {})
      };
    }

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

/** Opens documentation embeds on one actual effect without changing the gallery default. */
export function getInitialPostprocessingPassNames(effectName?: string): string[] {
  if (effectName && Object.hasOwn(EFFECT_SHADER_PASSES, effectName)) {
    return [effectName];
  }

  return [...LOOK_DEFINITIONS[DEFAULT_LOOK_NAME].passNames];
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
