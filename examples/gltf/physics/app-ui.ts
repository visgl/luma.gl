// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {ColumnPanel} from '@deck.gl-community/panels';
import {
  ExamplePanelManager,
  configurePanelHostElement,
  makeExamplePanelHostHtml,
  makeExampleTabbedPanel,
  makeHtmlCustomPanel
} from '../../example-panels';
import type {GPUGraphDiagnostics} from '../../gpu-graph-diagnostics';
import '../gltf-example-panel.css';

export const INFO_HTML = makeExamplePanelHostHtml();

const CARET =
  '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" role="presentation" focusable="false"><path d="m10 3-5 5 5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

export function createPhysicsPanels(diagnostics: GPUGraphDiagnostics) {
  const controls = document.createElement('section');
  controls.className = 'physics-controls';
  controls.innerHTML = `
<div class="gltf-example-toolbar">
<button id="physics-previous" class="gltf-example-caret" data-physics-control aria-label="Previous sample" title="Previous sample">${CARET}</button>
<select id="physics-sample" data-physics-control aria-label="Sample">
<option value="Materials_Restitution">Restitution</option>
<option value="Materials_Friction">Friction</option>
<option value="Filtering">Filtering · preview</option>
<option value="MotionProperties">Motion properties · preview</option>
</select>
<button id="physics-next" class="gltf-example-caret gltf-example-caret-next" data-physics-control aria-label="Next sample" title="Next sample">${CARET}</button>
<button id="physics-pause" data-physics-control>Pause</button>
<button id="physics-reset" data-physics-control>Reset</button>
</div>
<div id="physics-status" role="status">Loading sample…</div>`;
  const details = document.createElement('section');
  details.className = 'gltf-example-details';
  details.innerHTML = `
<p>Drag to orbit · Scroll to zoom · Reset to replay.</p>
<p>Draft <code>KHR_physics_rigid_bodies</code> and <code>KHR_implicit_shapes</code>.
WebGPU simulation uses a small CPU pose bridge to the glTF renderer.
Filtering and Motion Properties are static previews until their collider types are supported.</p>
<div id="error" role="status"></div>
<a href="https://github.com/eoineoineoin/glTF_Physics/tree/9dc61cb3474ff9a51f58d3592f79d5c9e572056a/samples" target="_blank" rel="noreferrer">Upstream samples ↗</a>`;
  controls.hidden = true;
  details.hidden = true;
  document.body.append(controls, details);
  const mountContent = (root: HTMLElement, content: HTMLElement) => {
    configurePanelHostElement(root, 'cinematic');
    content.hidden = false;
    root.append(content);
    return () => {
      content.hidden = true;
      document.body.append(content);
    };
  };
  const manager = new ExamplePanelManager({
    panel: new ColumnPanel({
      id: 'physics-panel',
      panels: [
        makeHtmlCustomPanel({
          id: 'physics-controls',
          title: '',
          html: '',
          onRender: root => mountContent(root, controls)
        }),
        makeExampleTabbedPanel({
          id: 'physics-tabs',
          title: '',
          theme: 'dark',
          panels: [
            makeHtmlCustomPanel({
              id: 'physics-details',
              title: 'Info',
              html: '',
              onRender: root => mountContent(root, details)
            }),
            diagnostics.inspectorPanel.panel,
            diagnostics.tracePanel.panel
          ]
        })
      ]
    })
  });
  document.querySelector('#example-panel-host')?.classList.add('gltf-example-panel');
  manager.mount();
  return {
    finalize() {
      manager.finalize();
      controls.remove();
      details.remove();
      diagnostics.clear();
    }
  };
}

export function showError(error?: unknown): void {
  const element = document.getElementById('error');
  if (element) element.textContent = error ? String(error) : '';
}
