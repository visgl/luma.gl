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
  scaleDemo: boolean
) {
  const content = document.querySelector<HTMLElement>('aside')!;
  content.id = 'sphere-controls';
  content.hidden = true;
  const host = document.createElement('div');
  host.id = 'sphere-info';
  host.dataset.infoBoxAppearance = 'light';
  const style = document.createElement('style');
  style.textContent = `
    #sphere-info {position:fixed;inset:16px;z-index:20;pointer-events:none}
    #sphere-controls {position:static;width:auto;padding:0;border:0;background:transparent;border-radius:0}
    #sphere-controls h1 {display:none}
    #sphere-info [data-gpu-command-graph-inspector] :is(.graph-inspector-picker,.graph-inspector-memory,.graph-inspector-empty,.graph-inspector-counter,.graph-inspector-node,.graph-inspector-metric){color:#435c53;font-size:10px}
    #sphere-info [data-gpu-command-graph-inspector] :is(strong,.graph-inspector-node i){color:#233d37;font-size:10px}
    #sphere-info [data-gpu-command-graph-inspector] .graph-inspector-metric{background:#edf1e9;border-color:#cbd3c5}
    #sphere-info [data-gpu-command-graph-inspector] :is(.graph-inspector-counter,.graph-inspector-node){border-bottom-color:#dce3d9}
    #sphere-info [data-gpu-command-graph-inspector] .graph-inspector-node::after{background:#f8f7f2;color:#233d37;font-size:10px}
    #sphere-info [data-gpu-command-graph-inspector] .graph-inspector-nodes{max-height:300px}
  `;
  document.head.append(style);
  document.body.append(host);
  applyExampleTheme(host, 'light');
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
    widthPx: 420,
    collapsible: true,
    defaultOpen: false,
    panel: makeExampleTabbedPanel({
      id: 'sphere-info-tabs',
      theme: 'light',
      panels: [
        makeHtmlCustomPanel({
          id: 'sphere-controls-panel',
          title: 'Controls',
          html: '',
          onRender: root => {
            configurePanelHostElement(root, 'light');
            content.hidden = false;
            root.append(content);
            return () => {
              content.hidden = true;
              document.body.append(content);
            };
          }
        }),
        makeHtmlCustomPanel({
          id: 'sphere-graph-panel',
          title: 'GPU Graph',
          html: `<p>Live graph nodes, CPU encoding and GPU timings. Timing samples reuse the existing diagnostics readback; rendering reads simulation buffers directly.</p><div data-sphere-graph></div>`,
          onRender: root => {
            configurePanelHostElement(root, 'light');
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
