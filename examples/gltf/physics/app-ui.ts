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

const SAMPLE_DESCRIPTIONS: Record<string, string> = {
  AnimatedPlatform:
    '<p>Authored glTF translation animation owns the kinematic platform. Its scenegraph pose becomes a fixed-step physics target and pushes the dynamic box through contact.</p>',
  JointPendulum:
    '<p>A glTF joint uses two scenegraph attachment nodes. A radial linear limit holds the pendulum pivot and angular limits leave one swing axis free.</p>',
  DrivenHinge:
    '<p>A composed hinge constrains translation and two angular axes. A glTF animation changes the force-limited spring drive’s target angle. The shared animation runtime updates the GPU constraint before each physics step.</p>',
  TriggerVolume:
    '<p>The translucent box is a sensor. The moving box passes through without physical response; simulation-step enter and exit events are retained on the GPU.</p>',

  Materials_Restitution:
    '<h3>Restitution · bounce</h3><p>Watch the two balls fall onto the floor. Their materials have different restitution: the basketball rebounds strongly, while the bowling ball loses more energy on impact. Reset to compare their bounces from the same starting positions.</p>',
  Materials_Friction:
    '<h3>Friction · sliding</h3><p>The boxes rest on a slope with different friction materials. The slippery soap slides more readily; the high-friction box resists sliding. Reset to replay and compare their motion.</p>',
  Filtering:
    '<h3>Filtering · who collides?</h3><p>Blue collides with blue, green collides with green, and both collide with the striped ground. Blue and green deliberately pass through each other: this demonstrates collision filtering, not missing collisions.</p><p>The connected pair forms one rigid body, but its blue and green parts retain separate filters. One part can pass through an obstacle while the matching-color part catches on it. Reset to watch the fall again.</p>',
  MotionProperties:
    '<h3>Motion properties · mass and motion</h3><p>The bottom-heavy toy wobbles around its offset center of mass. Four balloons rise under reversed gravity and collide with the ceiling. The wheel can rotate around one axis but cannot translate; its original triangle geometry preserves the holes. The rounded box falls onto the cone without rotating because its inertia locks all rotation axes. Reset restores the starting scene and keeps your camera view.</p>'
};

export function showSampleDescription(sample: string): void {
  const element = document.getElementById('physics-description');
  if (element) element.innerHTML = SAMPLE_DESCRIPTIONS[sample] ?? '';
}

export function createPhysicsPanels(diagnostics: GPUGraphDiagnostics) {
  const controls = document.createElement('section');
  controls.className = 'physics-controls';
  controls.innerHTML = `
<div class="gltf-example-toolbar">
<button id="physics-previous" class="gltf-example-caret" data-physics-control aria-label="Previous sample" title="Previous sample">${CARET}</button>
<select id="physics-sample" data-physics-control aria-label="Sample">
<option value="MotionProperties">Motion properties</option>
<option value="Materials_Restitution">Restitution</option>
<option value="Materials_Friction">Friction</option>
<option value="AnimatedPlatform">Animated platform</option>
<option value="JointPendulum">Joint pendulum</option>
<option value="DrivenHinge">Driven hinge</option>
<option value="TriggerVolume">Trigger volume</option>
<option value="Filtering">Filtering</option>
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
<section id="physics-description" aria-live="polite"></section>
<p>Draft <code>KHR_physics_rigid_bodies</code> and <code>KHR_implicit_shapes</code>.
WebGPU simulation publishes body transforms directly to the scenegraph renderer.
Filtering preserves the authored per-collider systems, including its compound boxes.
Motion Properties uses analytic tapered primitives, convex hulls and the original nonconvex wheel triangles. Mesh pairs use bounded discrete surface contacts; deep initial containment and fast-motion tunneling remain unsupported.</p>
<div id="physics-behavior" role="status"></div>
<div id="error" role="status"></div>
<a href="https://github.com/eoineoineoin/glTF_Physics/tree/9dc61cb3474ff9a51f58d3592f79d5c9e572056a/samples" target="_blank" rel="noreferrer">Upstream samples ↗</a>`;
  controls.hidden = true;
  details.hidden = true;
  document.body.append(controls, details);
  showSampleDescription('MotionProperties');
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
