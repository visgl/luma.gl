// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {BoxPanelContainer, PanelManager} from '@deck.gl-community/panels';
import {GPUCommandGraphInspector, type CompiledGPUCommandGraph} from '@luma.gl/gpu-graph/gpu-core';
import {
  configurePanelHostElement,
  makeExampleTabbedPanel,
  makeHtmlCustomPanel
} from '../../example-panels';
import {GPUCommandGraphInspectorPanel} from '../../gpu-command-graph-inspector-panel';
import {applyExampleTheme} from '../../example-theme';

/** Standard standalone InfoBox; inspection uses existing encodings and sampled diagnostics. */
export function createPoolInfoBox(graph: CompiledGPUCommandGraph<void>) {
  const host = document.querySelector<HTMLElement>('#pool-info')!;
  const inspector = new GPUCommandGraphInspector({maxSamples: 90});
  const observation = inspector.observeGraph(graph);
  let inspectorPanel: GPUCommandGraphInspectorPanel | null = null;
  let lastUpdate = 0;
  let lastTiming = -Infinity;
  let timingRead: Promise<void> | null = null;
  let timingMessage = graph.device.features.has('timestamp-query')
    ? 'GPU timings are sampled while this tab is visible.'
    : 'GPU timestamp queries are unavailable; CPU encoding timings remain available.';
  let inspectorHost: HTMLElement | null = null;
  applyExampleTheme(host, 'light');
  const container = new BoxPanelContainer({
    id: 'pool-info-box',
    title: 'luma.gl · GPU Pool',
    placement: 'top-right',
    widthPx: 420,
    collapsible: true,
    defaultOpen: false,
    panel: makeExampleTabbedPanel({
      id: 'pool-info-tabs',
      theme: 'light',
      panels: [
        makeHtmlCustomPanel({
          id: 'pool-about',
          title: 'About',
          html: `<p>Free practice: pot any ball, in any order. A scratched cue ball returns after the shot.</p>
            <p>Move to aim. Hold Shoot to charge and release to shoot; Escape cancels. New Rack restores the table. Choose a practice setup to compare follow, draw and cushion spin.</p>
            <p>Physics stays on the GPU. Step-local triggers capture pockets; small snapshots check when balls settle. Cloth friction converts sliding to rolling, while cushions exchange spin and lose more rebound pace on harder impacts.</p>
            <p>Throw controls isolate linear and angular surface slip. These are experimental approximations, not measured billiards calibration. Shots are capped at 12 table units/s; exhausted collision budgets report discarded time.</p>`,
          onRender: root => configurePanelHostElement(root, 'light')
        }),
        makeHtmlCustomPanel({
          id: 'pool-graph',
          title: 'GPU graph inspector',
          html: '<p data-pool-timing-status></p><div data-pool-graph-inspector></div>',
          onRender: root => {
            configurePanelHostElement(root, 'light');
            inspectorHost = root;
            root.querySelector<HTMLElement>('[data-pool-timing-status]')!.textContent =
              timingMessage;
            inspectorPanel = new GPUCommandGraphInspectorPanel(
              root.querySelector<HTMLElement>('[data-pool-graph-inspector]')!,
              {
                graphLabels: {[graph.id]: 'Pool physics'},
                nodeLabels: Object.fromEntries(
                  graph.stats.nodeOrder.map(id => [id, formatPoolNodeLabel(id)])
                )
              }
            );
            inspectorPanel.update(inspector.getSnapshot(), graph.id);
            return () => {
              inspectorPanel?.destroy();
              inspectorPanel = null;
              inspectorHost = null;
            };
          }
        })
      ]
    })
  });
  const manager = new PanelManager({parentElement: host});
  manager.setProps({components: [container]});
  return {
    observation,
    sampleStep(now: number): boolean {
      if (
        !container.isOpen ||
        !inspectorHost?.getClientRects().length ||
        timingRead ||
        now - lastTiming < 500 ||
        !graph.device.features.has('timestamp-query')
      )
        return false;
      lastTiming = now;
      const querySet = graph.device.createQuerySet({
        type: 'timestamp',
        count: graph.stats.nodeOrder.length * 2
      });
      try {
        const encoder = graph.device.createCommandEncoder({timeProfilingQuerySet: querySet});
        const encoding = observation.encode(encoder, {
          parameters: undefined,
          coalesceComputePasses: false
        });
        graph.device.submit(encoder.finish());
        timingRead = observation
          .recordGPUTimings(encoding)
          .then(
            () => undefined,
            error => {
              timingMessage = `GPU timing read failed: ${String(error)}`;
            }
          )
          .finally(() => {
            querySet.destroy();
            timingRead = null;
          });
      } catch (error) {
        querySet.destroy();
        throw error;
      }
      return true;
    },
    update(now: number) {
      manager.onRedraw({viewports: [], layers: []});
      if (container.isOpen && inspectorPanel && now - lastUpdate >= 250) {
        lastUpdate = now;
        inspectorPanel.update(inspector.getSnapshot(), graph.id);
        inspectorHost!.querySelector<HTMLElement>('[data-pool-timing-status]')!.textContent =
          timingMessage;
      }
    },
    destroy() {
      manager.finalize();
      observation.detach();
      inspector.clear();
      return timingRead;
    }
  };
}

function formatPoolNodeLabel(id: string): string {
  const shortName = id.replace(/^gpu-sphere-world-step-\d+-/, '');
  const impact = /^impact-(\d+)-(.+)$/.exec(shortName);
  const operation = impact ? impact[2] : shortName;
  const label = operation.replaceAll('-', ' ');
  return (
    label.charAt(0).toUpperCase() +
    label.slice(1) +
    (impact ? ' · impact ' + (Number(impact[1]) + 1) : '')
  );
}
