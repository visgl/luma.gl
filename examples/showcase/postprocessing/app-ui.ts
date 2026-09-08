// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {EFFECT_CATEGORY_ORDER, EFFECT_DETAILS, EFFECT_SHADER_PASSES} from './effect-catalog';
import type {EffectState} from './app';

export const DEFAULT_LOOK_NAME: LookName = 'Neon Bloom';

export type LookName =
  | 'Original'
  | 'Neon Bloom'
  | 'Chromatic Grade'
  | 'Graphic Ink'
  | 'Chromatic Print'
  | 'Dream Zoom'
  | 'Prism Lens';

export type LookDefinition = {
  kicker: string;
  description: string;
  accent: string;
  passNames: string[];
  values: Record<string, EffectState>;
};

export const FOCUSED_EFFECT_PREVIEW_VALUES: Record<string, EffectState> = {
  brightnessContrast: {brightness: 0.08, contrast: 0.28},
  hueSaturation: {hue: -0.08, saturation: 0.32},
  sepia: {amount: 0.7},
  toneMapping: {exposure: 1.8, maximumLuminance: 1},
  vibrance: {amount: 0.45},
  bloom: {radius: 9, threshold: 0.48, intensity: 1.85},
  gaussianBlur: {radius: 10},
  tiltShift: {
    start: [0.12, 0.36],
    end: [0.88, 0.64],
    blurRadius: 18,
    gradientRadius: 130
  },
  triangleBlur: {radius: 14},
  zoomBlur: {center: [0.5, 0.5], strength: 0.16},
  colorHalftone: {center: [0.5, 0.5], angle: 0.32, size: 5},
  dotScreen: {center: [0.5, 0.5], angle: 0.42, size: 5},
  edgeWork: {radius: 3},
  hexagonalPixelate: {center: [0.5, 0.5], scale: 12},
  ink: {strength: 0.36},
  bulgePinch: {center: [0.5, 0.5], radius: 240, strength: 0.45},
  magnify: {screenXY: [0.5, 0.5], radiusPixels: 150, zoom: 2},
  swirl: {center: [0.5, 0.5], radius: 300, angle: 1.05},
  denoise: {strength: 0.55},
  noise: {amount: 0.2},
  vignette: {radius: 0.7, amount: 0.45}
};

export const LOOK_DEFINITIONS: Record<LookName, LookDefinition> = {
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

export const LOOK_ORDER: LookName[] = [
  'Original',
  'Neon Bloom',
  'Chromatic Grade',
  'Graphic Ink',
  'Chromatic Print',
  'Dream Zoom',
  'Prism Lens'
];

export function makeLooksHtml(
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

export function makeEffectsStackHtml(
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

export function filterEffectsLibrary(rootElement: HTMLElement, searchQuery: string): void {
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

export function isCustomizedLook(selectedLookName: LookName, activePassNames: string[]): boolean {
  const presetPassNames = LOOK_DEFINITIONS[selectedLookName].passNames;
  return (
    presetPassNames.length !== activePassNames.length ||
    presetPassNames.some((passName, index) => passName !== activePassNames[index])
  );
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function makeAboutHtml(): string {
  return `
    <div style="padding:14px 15px;color:#cbd5e1;font:12px/1.55 Inter,ui-sans-serif,system-ui,sans-serif">
      <p style="margin:0 0 10px;color:#f8fafc;font-size:15px;font-weight:750">A live test chart, not a fixed photograph.</p>
      <p style="margin:0 0 10px">The first fullscreen pass generates a moving scene with fine lines, broad gradients, saturated edges, highlights, and low-contrast shadow detail. Those signals make blur, bloom, color, edge, print, and warp behavior legible at a glance.</p>
      <p style="margin:0 0 10px"><b style="color:#7dd3fc">Editable pipelines:</b> each Look starts with ordinary <code>ShaderPass</code> modules. Effects Stack exposes the complete portable image-effect library, and Controls adjusts the same typed properties an application can drive directly. Sample-heavy stacks use a controlled processing resolution to stay fluid on high-DPI displays.</p>
      <p style="margin:0"><b style="color:#7dd3fc">Portable by design:</b> the procedural source and every selected effect provide both WGSL and GLSL, so the visual language stays consistent across WebGPU and WebGL.</p>
    </div>`;
}

export function isLookName(value: string | undefined): value is LookName {
  return Boolean(value && value in LOOK_DEFINITIONS);
}

export function formatControlLabel(propName: string): string {
  return propName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, firstCharacter => firstCharacter.toUpperCase());
}
