// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  applyPanelTheme,
  BoxPanelContainer,
  PanelManager,
  PANEL_THEME_SLEEK_DARK
} from '@deck.gl-community/panels';
import {
  configurePanelHostElement,
  makeExampleTabbedPanel,
  makeHtmlCustomPanel
} from '../../example-panels';
import {InfoBoxPanelContainer} from '../../example-info-box';
import {applyExampleTheme} from '../../example-theme';
import type {GPUGraphDiagnostics} from '../../gpu-graph-diagnostics';

export function createRigidBodyPanel(
  diagnostics: GPUGraphDiagnostics,
  title = 'Rigid Body Lab',
  subtitle = 'GPU physics · mechanisms and contacts'
) {
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
  const sweep = document.querySelector<HTMLElement>('#grasp-sweep');
  const actions = document.querySelector<HTMLElement>('#lab-actions');
  const content = document.querySelector<HTMLElement>('#lab-canvas');
  if (actions) applyPanelTheme(host, PANEL_THEME_SLEEK_DARK);
  const manager = new PanelManager({
    parentElement: host,
    ...(content ? {contentElement: content} : {})
  });
  const tabs = makeExampleTabbedPanel({
    id: 'lab-tabs',
    theme: 'dark',
    panels: [
      makeHtmlCustomPanel({
        id: 'lab-controls-panel',
        title: 'Settings',
        html: '',
        onRender: root => mount(controls, root)
      }),
      ...(sweep
        ? [
            makeHtmlCustomPanel({
              id: 'grasp-sweep-panel',
              title: 'Grasp Sweep',
              html: '',
              onRender: root => mount(sweep, root)
            })
          ]
        : []),
      makeHtmlCustomPanel({
        id: 'lab-details-panel',
        title: 'Info',
        html: '',
        onRender: root => mount(details, root)
      }),
      diagnostics.inspectorPanel.panel,
      diagnostics.tracePanel.panel
    ]
  });
  const shell = actions
    ? new BoxPanelContainer({
        id: 'gripper-box',
        title,
        placement: 'top-left',
        side: 'left',
        pinnable: true,
        defaultOpen: false,
        offsetPx: 12,
        widthPx: 340,
        panel: tabs,
        headerPanel: makeHtmlCustomPanel({
          id: 'lab-actions-panel',
          title: 'Gripper controls',
          html: '',
          onRender: root => mount(actions, root)
        })
      })
    : new InfoBoxPanelContainer({
        title,
        subtitle,
        websiteBaseUrl: '/',
        appearance: 'cinematic',
        panel: tabs
      });
  manager.setProps({components: [shell]});
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
      sweep?.remove();
    }
  };
}
