// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {BoxPanelContainer, ColumnPanel, PanelManager} from '@deck.gl-community/panels';
import {
  configurePanelHostElement,
  makeExampleTabbedPanel,
  makeHtmlCustomPanel
} from '../../example-panels';
import {applyExampleTheme} from '../../example-theme';
import type {GPUGraphDiagnostics} from '../../gpu-graph-diagnostics';

export function createSalvagePanel(diagnostics: GPUGraphDiagnostics) {
  const host = document.querySelector<HTMLElement>('#info')!;
  applyExampleTheme(host, 'cinematic');
  const controls = document.querySelector<HTMLElement>('#lab-controls')!;
  const details = document.querySelector<HTMLElement>('#lab-details')!;
  const mount = (content: HTMLElement, root: HTMLElement) => {
    configurePanelHostElement(root, 'cinematic');
    content.hidden = false;
    root.append(content);
    return () => {
      content.hidden = true;
      document.body.append(content);
    };
  };
  const manager = new PanelManager({parentElement: host});
  manager.setProps({
    components: [
      new BoxPanelContainer({
        id: 'space-salvage',
        title: 'luma.gl · Space Salvage',
        placement: 'top-left',
        widthPx: 360,
        collapsible: true,
        defaultOpen: false,
        panel: new ColumnPanel({
          id: 'lab-panel',
          panels: [
            makeHtmlCustomPanel({
              id: 'lab-controls-panel',
              title: '',
              html: '',
              onRender: root => mount(controls, root)
            }),
            makeExampleTabbedPanel({
              id: 'lab-tabs',
              theme: 'dark',
              panels: [
                makeHtmlCustomPanel({
                  id: 'lab-details-panel',
                  title: 'Info',
                  html: '',
                  onRender: root => mount(details, root)
                }),
                diagnostics.inspectorPanel.panel,
                diagnostics.tracePanel.panel
              ]
            })
          ]
        })
      })
    ]
  });
  return {
    update() {
      manager.onRedraw({viewports: [], layers: []});
    },
    destroy() {
      manager.finalize();
      diagnostics.clear();
      host.remove();
      controls.remove();
      details.remove();
    }
  };
}
