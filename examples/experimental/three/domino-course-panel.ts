// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {PanelManager} from '@deck.gl-community/panels';
import {InfoBoxPanelContainer} from '../../example-info-box';
import {
  configurePanelHostElement,
  makeExampleTabbedPanel,
  makeHtmlCustomPanel
} from '../../example-panels';
import {applyExampleTheme} from '../../example-theme';
import type {GPUGraphDiagnostics} from '../../gpu-graph-diagnostics';

export function createDominoCoursePanel(controls: HTMLElement, diagnostics: GPUGraphDiagnostics) {
  const host = document.querySelector<HTMLElement>('#info')!;
  applyExampleTheme(host, 'cinematic');
  const manager = new PanelManager({parentElement: host});
  manager.setProps({
    components: [
      new InfoBoxPanelContainer({
        title: 'Domino Junction',
        subtitle: 'GPU physics with Three.js',
        appearance: 'cinematic',
        websiteBaseUrl: '/',
        panel: makeExampleTabbedPanel({
          id: 'domino-course-tabs',
          theme: 'dark',
          panels: [
            makeHtmlCustomPanel({
              id: 'domino-course-settings',
              title: 'Settings',
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
            makeHtmlCustomPanel({
              id: 'domino-course-info',
              title: 'Info',
              html: '<p>The first tile starts two branches. Either branch can tip the wide gold receiver and start the finish.</p><p>luma.gl simulates contact and motion. Three.js renders the published GPU poses on the same WebGPU device. Drag to orbit or scroll to zoom.</p>',
              onRender: root => configurePanelHostElement(root, 'cinematic')
            }),
            diagnostics.inspectorPanel.panel,
            diagnostics.tracePanel.panel
          ]
        })
      })
    ]
  });
  manager.onRedraw({viewports: [], layers: []});
  return () => {
    manager.finalize();
    diagnostics.clear();
  };
}
