// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {BoxPanelContainer, PanelManager} from '@deck.gl-community/panels';
import {
  configurePanelHostElement,
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
  const container = new BoxPanelContainer({
    id: 'galaxy-info-box',
    title: 'Galactic Vortex',
    placement: 'top-left',
    widthPx: 420,
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
            return () => {
              controls.hidden = true;
              document.body.append(controls);
            };
          }
        }),
        diagnostics.inspectorPanel.panel,
        diagnostics.tracePanel.panel
      ]
    })
  });
  const manager = new PanelManager({parentElement: host});
  manager.setProps({components: [container]});
  manager.onRedraw({viewports: [], layers: []});
  return {
    update() {
      manager.onRedraw({viewports: [], layers: []});
    },
    destroy() {
      manager.finalize();
      diagnostics.clear();
      host.remove();
    }
  };
}
