// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {ColumnPanel, type Panel, type SettingsSchema} from '@deck.gl-community/panels';
import {
  ExampleSettingsPanelManager,
  makeExampleTabbedPanel,
  makeHtmlCustomPanel
} from '../../example-panels';

export const DEFAULT_DRAW_COUNT = 5000;
const DRAW_COUNT_OPTIONS = [1000, DEFAULT_DRAW_COUNT, 10000];
const DRAW_COUNT_OPTION_SET = new Set(DRAW_COUNT_OPTIONS);

export class RenderBundlesUI {
  readonly panel: Panel;
  private cpuTimeElement: HTMLElement | null = null;
  private drawCountElement: HTMLElement | null = null;
  private modeElement: HTMLElement | null = null;

  constructor(settingsPanel: ExampleSettingsPanelManager, drawCount: number) {
    const infoPanel = new ColumnPanel({
      id: 'api-render-bundles-info',
      title: 'Info',
      panels: [
        makeHtmlCustomPanel({
          id: 'api-render-bundles-description',
          title: '',
          html: `\
          <p>This scene intentionally issues thousands of individual draws. Render bundles record those WebGPU commands once, so per-frame CPU work is mostly the camera buffer update and bundle replay.</p>
          `
        }),
        makeHtmlCustomPanel({
          id: 'api-render-bundles-stats',
          title: 'Frame Stats',
          html: `\
          <style>
            .render-bundle-stats {
              display: grid;
              gap: 8px;
            }
            .render-bundle-stat {
              display: flex;
              justify-content: space-between;
              gap: 16px;
              font-variant-numeric: tabular-nums;
            }
            .render-bundle-stat strong {
              font-weight: 700;
            }
          </style>
          <div class="render-bundle-stats">
            <div class="render-bundle-stat"><span>CPU Time</span><strong data-cpu-time>0.00 ms</strong></div>
            <div class="render-bundle-stat"><span>Draw Calls</span><strong data-draw-count>${formatDrawCount(drawCount)}</strong></div>
            <div class="render-bundle-stat"><span>Mode</span><strong data-mode>Render bundle</strong></div>
          </div>
          `,
          onRender: rootElement => {
            this.cpuTimeElement = rootElement.querySelector('[data-cpu-time]');
            this.drawCountElement = rootElement.querySelector('[data-draw-count]');
            this.modeElement = rootElement.querySelector('[data-mode]');
            return () => {
              this.cpuTimeElement = null;
              this.drawCountElement = null;
              this.modeElement = null;
            };
          }
        })
      ]
    });
    this.panel = makeExampleTabbedPanel({
      id: 'api-render-bundles-controls',
      title: 'Render Bundles',
      panels: [infoPanel, settingsPanel.makePanel()]
    });
  }

  updateStats(cpuTimeMilliseconds: number, drawCount: number, useRenderBundles: boolean): void {
    if (this.cpuTimeElement) {
      this.cpuTimeElement.textContent = `${cpuTimeMilliseconds.toFixed(2)} ms`;
    }
    if (this.drawCountElement) {
      this.drawCountElement.textContent = formatDrawCount(drawCount);
    }
    if (this.modeElement) {
      this.modeElement.textContent = useRenderBundles ? 'Render bundle' : 'Replay draws';
    }
  }
}

export function makeRenderBundlesSettingsSchema(): SettingsSchema {
  return {
    title: 'Settings',
    sections: [
      {
        id: 'render-bundles',
        name: 'Render',
        initiallyCollapsed: false,
        settings: [
          {
            name: 'useRenderBundles',
            label: 'Use Render Bundles',
            type: 'boolean',
            persist: 'none'
          },
          {
            name: 'drawCount',
            label: 'Draw Calls',
            type: 'select',
            persist: 'none',
            options: DRAW_COUNT_OPTIONS.map(drawCount => ({
              label: formatDrawCount(drawCount),
              value: drawCount
            }))
          }
        ]
      }
    ]
  };
}

export function isRenderBundleDrawCount(drawCount: number): boolean {
  return DRAW_COUNT_OPTION_SET.has(drawCount);
}

function formatDrawCount(drawCount: number): string {
  return `${drawCount.toLocaleString()} individual draws`;
}
