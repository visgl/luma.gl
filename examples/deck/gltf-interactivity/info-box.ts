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
import {INTERACTIVITY_SAMPLES} from './samples';
import '../../gltf/gltf-example-panel.css';

export function createInteractivityInfoBox() {
  const host = document.querySelector<HTMLElement>('#panels')!;
  applyExampleTheme(host, 'cinematic');
  host.dataset['theme'] = 'dark';
  host.classList.add('gltf-example-panel');
  const controls = document.querySelector<HTMLElement>('#interaction')!;
  const details = document.querySelector<HTMLElement>('#info-content')!;
  const caret =
    '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" role="presentation" focusable="false"><path d="m10 3-5 5 5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  controls.innerHTML = `<div class="gltf-example-toolbar">
<button id="previous" class="gltf-example-caret" aria-label="Previous sample" title="Previous sample">${caret}</button>
<select id="sample" aria-label="Sample">${INTERACTIVITY_SAMPLES.map(sample => `<option value="${sample.id}">${sample.title}</option>`).join('')}</select>
<button id="next" class="gltf-example-caret gltf-example-caret-next" aria-label="Next sample" title="Next sample">${caret}</button>
<button id="run">Run</button><button id="reset">Reset</button></div>
<output id="result" class="gltf-example-status" aria-live="polite">Loading asset…</output>`;
  const mountContent = (root: HTMLElement, content: HTMLElement) => {
    configurePanelHostElement(root, 'cinematic');
    content.hidden = false;
    root.append(content);
    return () => {
      content.hidden = true;
      document.body.append(content);
    };
  };
  const panel = new ColumnPanel({
    id: 'interactivity-panel',
    theme: 'dark',
    title: '',
    panels: [
      makeHtmlCustomPanel({
        id: 'interactivity-controls',
        title: '',
        html: '',
        onRender: root => mountContent(root, controls)
      }),
      makeExampleTabbedPanel({
        id: 'interactivity-tabs',
        title: '',
        theme: 'dark',
        panels: [
          makeHtmlCustomPanel({
            id: 'interactivity-info',
            title: 'Info',
            html: '',
            onRender: root => mountContent(root, details)
          }),
          makeHtmlCustomPanel({
            id: 'interactivity-graph',
            title: 'Behavior Graph',
            html: '',
            onRender: root => mountContent(root, graphContent)
          })
        ]
      })
    ]
  });
  const graphContent = document.createElement('section');
  graphContent.className = 'gltf-example-details';
  graphContent.hidden = true;
  document.body.append(graphContent);
  const container = new BoxPanelContainer({
    id: 'interactivity-info',
    title: 'luma.gl · glTF Interactivity',
    placement: 'top-left',
    widthPx: 420,
    collapsible: true,
    defaultOpen: false,
    panel
  });
  host.classList.add('gltf-example-panel');
  const manager = new PanelManager({parentElement: host});
  manager.setProps({components: [container]});
  return {
    redraw() {
      manager.onRedraw({viewports: [], layers: []});
    },
    setGraph(operations: readonly string[], sourceUrl: string) {
      graphContent.replaceChildren();
      const summary = document.createElement('p');
      summary.textContent = `${operations.length} authored behavior nodes · CPU interpreter`;
      graphContent.append(summary);
      const list = document.createElement('ol');
      list.style.cssText =
        'margin:0;padding-left:26px;max-height:240px;overflow:auto;font:10px/1.6 ui-monospace,monospace';
      for (const operation of operations) {
        const item = document.createElement('li');
        item.textContent = operation;
        list.append(item);
      }
      graphContent.append(list);
      const source = document.querySelector<HTMLAnchorElement>('#asset-source');
      if (source) source.href = sourceUrl;
    },
    destroy() {
      manager.finalize();
      graphContent.remove();
    }
  };
}
