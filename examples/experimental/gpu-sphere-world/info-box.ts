// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {BoxPanelContainer, PanelManager} from '@deck.gl-community/panels';
import {GPUCommandGraphInspector, type CompiledGPUCommandGraph} from '@luma.gl/graph/gpu-core';
import {
  configurePanelHostElement,
  makeExampleTabbedPanel,
  makeHtmlCustomPanel
} from '../../example-panels';
import {GPUCommandGraphInspectorPanel} from '../../gpu-command-graph-inspector-panel';
import {applyExampleTheme} from '../../example-theme';

/** Keep controls mounted while hidden; inspection reuses the example's existing timing samples. */
export function createSphereInfoBox(
  initialGraph: CompiledGPUCommandGraph<void>,
  scaleDemo: boolean,
  table: HTMLElement
) {
  const content = document.querySelector<HTMLElement>('aside')!;
  content.id = 'sphere-controls';
  content.hidden = true;
  const host = document.createElement('div');
  host.id = 'sphere-info';
  host.dataset.infoBoxAppearance = 'cinematic';
  const style = document.createElement('style');
  style.textContent = `
    #sphere-info {position:fixed;inset:16px;z-index:20;pointer-events:none}
    #sphere-controls {position:static;width:auto;padding:0;border:0;background:transparent;border-radius:0}
    #sphere-controls h1 {display:none}
    #sphere-controls :is(p,label,output) {color:var(--luma-example-text)}
    #sphere-controls :is(button,select) {
      background:var(--luma-example-surface-raised);
      color:var(--luma-example-text);
      border:1px solid var(--luma-example-border);
    }
    #sphere-info .deck-widget-box > section {
      --menu-background:var(--luma-example-surface);
      --menu-border:1px solid var(--luma-example-border);
      --menu-text:var(--luma-example-text);
      --menu-shadow:var(--luma-example-shadow);
      --button-text:var(--luma-example-text);
      --button-icon-idle:var(--luma-example-text-muted);
      max-height:min(520px, calc(100dvh - 32px)) !important;
    }
    #sphere-info [data-gpu-command-graph-inspector] .graph-inspector-nodes{max-height:300px}
  `;
  document.head.append(style);
  document.body.append(host);
  applyExampleTheme(host, 'cinematic');
  const inspector = new GPUCommandGraphInspector({maxSamples: 90});
  let graph = initialGraph;
  let observation = inspector.observeGraph(graph);
  let inspectorPanel: GPUCommandGraphInspectorPanel | null = null;
  let inspectorRoot: HTMLElement | null = null;
  let lastUpdate = 0;
  const renderInspector = () => {
    if (!inspectorRoot) return;
    inspectorPanel?.destroy();
    inspectorPanel = new GPUCommandGraphInspectorPanel(inspectorRoot, {
      inspector,
      graphLabels: {[graph.id]: 'Sphere physics'},
      nodeLabels: Object.fromEntries(
        graph.stats.nodeOrder.map(id => [
          id,
          id.replace(/^gpu-sphere-world-step-\d+-/, '').replaceAll('-', ' ')
        ])
      )
    });
    inspectorPanel.update(inspector.getSnapshot(), graph.id);
  };
  const container = new BoxPanelContainer({
    id: 'sphere-info-box',
    title: scaleDemo ? 'luma.gl · Sphere Scale' : 'luma.gl · Sphere World',
    placement: 'top-left',
    widthPx: 362,
    collapsible: true,
    defaultOpen: false,
    panel: makeExampleTabbedPanel({
      id: 'sphere-info-tabs',
      theme: 'dark',
      panels: [
        makeHtmlCustomPanel({
          id: 'sphere-controls-panel',
          title: 'Controls',
          html: '',
          onRender: root => {
            configurePanelHostElement(root, 'cinematic');
            content.hidden = false;
            root.append(content);
            return () => {
              content.hidden = true;
              document.body.append(content);
            };
          }
        }),
        makeHtmlCustomPanel({
          id: 'sphere-table-panel',
          title: 'Table',
          html: '',
          onRender: root => {
            configurePanelHostElement(root, 'cinematic');
            root.append(table);
            return () => table.remove();
          }
        }),
        makeHtmlCustomPanel({
          id: 'sphere-graph-panel',
          title: 'GPU Graph',
          html: `<p>Live graph nodes, CPU encoding and GPU timings. Timing samples reuse the existing diagnostics readback; rendering reads simulation buffers directly.</p><div data-sphere-graph></div>`,
          onRender: root => {
            configurePanelHostElement(root, 'cinematic');
            inspectorRoot = root.querySelector<HTMLElement>('[data-sphere-graph]')!;
            renderInspector();
            return () => {
              inspectorPanel?.destroy();
              inspectorPanel = null;
              inspectorRoot = null;
            };
          }
        })
      ]
    })
  });
  const manager = new PanelManager({parentElement: host});
  manager.setProps({components: [container]});
  return {
    get observation() {
      return observation;
    },
    setGraph(next: CompiledGPUCommandGraph<void>) {
      observation.detach();
      graph = next;
      observation = inspector.observeGraph(graph);
      renderInspector();
    },
    update(now: number) {
      manager.onRedraw({viewports: [], layers: []});
      if (container.isOpen && inspectorPanel && now - lastUpdate > 250) {
        lastUpdate = now;
        inspectorPanel.update(inspector.getSnapshot(), graph.id);
      }
    },
    destroy() {
      manager.finalize();
      observation.detach();
      inspector.clear();
      host.remove();
      style.remove();
      content.hidden = false;
    }
  };
}
