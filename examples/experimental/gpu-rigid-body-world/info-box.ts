// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {PanelManager} from '@deck.gl-community/panels';
import {
  configurePanelHostElement,
  makeExampleTabbedPanel,
  makeHtmlCustomPanel
} from '../../example-panels';
import {InfoBoxPanelContainer} from '../../example-info-box';
import {applyExampleTheme} from '../../example-theme';
import type {GPUGraphDiagnostics} from '../../gpu-graph-diagnostics';

export function createRigidBodyPanel(diagnostics: GPUGraphDiagnostics) {
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
      new InfoBoxPanelContainer({
        title: 'Rigid Body Lab',
        subtitle: 'GPU physics · mechanisms and contacts',
        websiteBaseUrl: '/',
        appearance: 'cinematic',
        panel: makeExampleTabbedPanel({
          id: 'lab-tabs',
          theme: 'dark',
          panels: [
            makeHtmlCustomPanel({
              id: 'lab-controls-panel',
              title: 'Settings',
              html: '',
              onRender: root => mount(controls, root)
            }),
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
