// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export type ExampleThemeAppearance = 'cinematic' | 'light';

export type ExampleThemeTokens = {
  surface: string;
  surfaceRaised: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  radius: string;
  shadow: string;
  backdrop: string;
};

/** Framework-independent visual tokens shared by example cards, panels, and overlays. */
export const EXAMPLE_THEME_TOKENS = {
  cinematic: {
    surface: 'rgb(8, 15, 27)',
    surfaceRaised: 'rgba(15, 23, 42, 0.72)',
    border: 'rgba(148, 163, 184, 0.24)',
    text: 'rgb(226, 232, 240)',
    textMuted: 'rgb(148, 163, 184)',
    accent: 'rgb(56, 189, 248)',
    radius: '14px',
    shadow: '0 22px 58px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.07)',
    backdrop: 'blur(18px) saturate(135%)'
  },
  light: {
    surface: 'rgb(255, 255, 255)',
    surfaceRaised: 'rgb(248, 250, 252)',
    border: 'rgba(15, 23, 42, 0.1)',
    text: 'rgb(17, 17, 17)',
    textMuted: 'rgb(89, 101, 121)',
    accent: 'rgb(20, 110, 245)',
    radius: '14px',
    shadow: '0 12px 32px rgba(0, 0, 0, 0.28)',
    backdrop: 'none'
  }
} as const satisfies Record<ExampleThemeAppearance, ExampleThemeTokens>;

/** Applies inheritable semantic custom properties without depending on a UI framework. */
export function applyExampleTheme(
  hostElement: HTMLElement,
  appearance: ExampleThemeAppearance
): void {
  const theme = EXAMPLE_THEME_TOKENS[appearance];

  hostElement.style.setProperty('--luma-example-surface', theme.surface);
  hostElement.style.setProperty('--luma-example-surface-raised', theme.surfaceRaised);
  hostElement.style.setProperty('--luma-example-border', theme.border);
  hostElement.style.setProperty('--luma-example-text', theme.text);
  hostElement.style.setProperty('--luma-example-text-muted', theme.textMuted);
  hostElement.style.setProperty('--luma-example-accent', theme.accent);
  hostElement.style.setProperty('--luma-example-radius', theme.radius);
  hostElement.style.setProperty('--luma-example-shadow', theme.shadow);
  hostElement.style.setProperty('--luma-example-backdrop', theme.backdrop);
}
