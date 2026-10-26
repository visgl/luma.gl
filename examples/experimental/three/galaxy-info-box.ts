// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import galaxySource from './gpu-graph-galaxy.ts?raw';
import {BoxPanelContainer, PanelManager} from '@deck.gl-community/panels';
import {
  configurePanelHostElement,
  ExampleSettingsPanelManager,
  renderExamplePanel,
  makeExampleTabbedPanel,
  makeHtmlCustomPanel
} from '../../example-panels';
import {applyExampleTheme} from '../../example-theme';
import type {GPUGraphDiagnostics} from '../../gpu-graph-diagnostics';

/** Standard example chrome; keep controls alive when the diagnostics tabs are selected. */
export function createGalaxyInfoBox(diagnostics: GPUGraphDiagnostics) {
  const controls = document.querySelector<HTMLElement>('#hud')!;
  const host = document.querySelector<HTMLElement>('#galaxy-info')!;
  applyExampleTheme(host, 'cinematic');
  const settings = {speed: 1, aperture: 0.2, paused: false};
  let settingsHost: HTMLElement | null = null;
  const settingsPanel = new ExampleSettingsPanelManager({
    id: 'galaxy-settings',
    label: 'Controls',
    schema: {
      title: 'Controls',
      sections: [
        {
          id: 'animation',
          name: '',
          settings: [
            {
              name: 'speed',
              label: 'Speed',
              type: 'number',
              min: 0,
              max: 3,
              step: 0.05,
              persist: 'none'
            },
            {
              name: 'aperture',
              label: 'Aperture',
              type: 'number',
              min: 0,
              max: 1.5,
              step: 0.05,
              persist: 'none'
            },
            {name: 'paused', label: 'Pause', type: 'boolean', persist: 'none'}
          ]
        }
      ]
    },
    settings,
    onSettingsChange: nextSettings => {
      if (typeof nextSettings['speed'] === 'number') settings.speed = nextSettings['speed'];
      if (typeof nextSettings['aperture'] === 'number')
        settings.aperture = nextSettings['aperture'];
      if (typeof nextSettings['paused'] === 'boolean') settings.paused = nextSettings['paused'];
      if (settingsHost) renderExamplePanel(settingsHost, settingsPanel.makePanel());
    }
  });
  const container = new BoxPanelContainer({
    id: 'galaxy-info-box',
    title: 'Galactic Vortex',
    placement: 'top-left',
    widthPx: 340,
    collapsible: true,
    defaultOpen: true,
    panel: makeExampleTabbedPanel({
      id: 'galaxy-info-tabs',
      theme: 'dark',
      panels: [
        makeHtmlCustomPanel({
          id: 'galaxy-controls',
          title: 'Controls',
          html: '',
          onRender: root => {
            configurePanelHostElement(root, 'cinematic');
            controls.hidden = false;
            root.append(controls);
            settingsHost = document.createElement('div');
            configurePanelHostElement(settingsHost, 'cinematic');
            root.append(settingsHost);
            renderExamplePanel(settingsHost, settingsPanel.makePanel());
            return () => {
              if (settingsHost) {
                renderExamplePanel(settingsHost, null);
                settingsHost.remove();
                settingsHost = null;
              }
              controls.hidden = true;
              document.body.append(controls);
            };
          }
        }),
        makeHtmlCustomPanel({
          id: 'galaxy-info',
          title: 'Info',
          html: '<h3>GPU architecture</h3><p>A luma GPU graph calculates star positions and colors in buffers shared with Three.js, without per-frame geometry readback or upload. Graph and Trace show the animation pass; Three rendering and postprocessing are submitted separately.</p>',
          onRender: root => configurePanelHostElement(root, 'cinematic')
        }),
        diagnostics.inspectorPanel.panel,
        diagnostics.tracePanel.panel,
        makeHtmlCustomPanel({
          id: 'example-source',
          title: 'Source',
          html: '',
          onRender: root => {
            configurePanelHostElement(root, 'cinematic');
            const source = document.createElement('pre');
            source.style.cssText =
              'margin:0;max-height:60vh;overflow:auto;font:11px/1.5 monospace;white-space:pre-wrap;overflow-wrap:anywhere';
            source.textContent = galaxySource;
            root.append(source);
            return () => source.remove();
          }
        })
      ]
    })
  });
  const manager = new PanelManager({parentElement: host});
  manager.setProps({components: [container]});
  manager.onRedraw({viewports: [], layers: []});
  return {
    settings,
    update() {
      manager.onRedraw({viewports: [], layers: []});
    },
    destroy() {
      manager.finalize();
      settingsPanel.finalize();
      diagnostics.clear();
      host.remove();
    }
  };
}
