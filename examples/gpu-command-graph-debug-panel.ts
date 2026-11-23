// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUCommandGraphInspectorSnapshot} from '@luma.gl/graph/gpu-core';
import {makeHtmlCustomPanel} from './example-panels';
import {
  GPUCommandGraphInspectorPanel,
  type GPUCommandGraphInspectorPanelProps
} from './gpu-command-graph-inspector-panel';

/** Reusable tab adapter that retains the latest snapshot while its content is unmounted. */
export class GPUCommandGraphDebugPanel {
  readonly panel;
  private renderer: GPUCommandGraphInspectorPanel | null = null;
  private snapshot: GPUCommandGraphInspectorSnapshot = {graphs: []};
  private preferredGraphId: string | undefined;

  constructor(props: GPUCommandGraphInspectorPanelProps & {id?: string; title?: string} = {}) {
    this.panel = makeHtmlCustomPanel({
      id: props.id ?? 'gpu-command-graph-debug',
      title: props.title ?? 'GPU Graph',
      html: '<p class="hint">Compiled nodes, memory, and recorded timings. GPU timings appear when supplied by the application.</p><div data-graph-debug-host></div>',
      onRender: root => {
        const host = root.querySelector<HTMLElement>('[data-graph-debug-host]')!;
        const renderer = new GPUCommandGraphInspectorPanel(host, props);
        this.renderer = renderer;
        renderer.update(this.snapshot, this.preferredGraphId);
        return () => {
          renderer.destroy();
          if (this.renderer === renderer) this.renderer = null;
        };
      }
    });
  }

  update(snapshot: GPUCommandGraphInspectorSnapshot, preferredGraphId?: string): void {
    this.snapshot = snapshot;
    this.preferredGraphId = preferredGraphId;
    this.renderer?.update(snapshot, preferredGraphId);
  }
}
