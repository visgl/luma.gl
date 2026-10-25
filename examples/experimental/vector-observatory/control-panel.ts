// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {PanelManager, type Panel, type SettingsSchema} from '@deck.gl-community/panels';
import {InfoBoxPanelContainer} from '../../example-info-box';
import {
  configurePanelHostElement,
  ExampleSettingsPanelManager,
  makeExampleTabbedPanel,
  makeHtmlCustomPanel,
  renderExamplePanel
} from '../../example-panels';
import type {ScientificFlowTraceResult} from '@luma.gl/experimental';
import mainSource from './main.ts?raw';
import fieldsSource from './fields.ts?raw';
import {GPUGraphDiagnostics} from '../../gpu-graph-diagnostics';

export type ObservatorySettings = {
  field: 'gyre' | 'vortex' | 'jet';
  particleCount: number;
  integrator: 'rk2' | 'rk4' | 'rk45';
  tolerance: number;
  coloring: 'speed' | 'step' | 'status';
  timeScale: number;
  exposure: number;
  paused: boolean;
};

type Telemetry = {
  time: number;
  queuedTime: number;
  particleCount: number;
  integrator: string;
  framesPerSecond: number;
  traceResult?: ScientificFlowTraceResult;
};

/** Shared example chrome with state that survives tab switches and panel collapse. */
export class ObservatoryControlPanel {
  readonly diagnostics = new GPUGraphDiagnostics({traceTitle: 'Trace'});
  private readonly graphNotices = new Set<HTMLElement>();
  readonly settings: ObservatorySettings = {
    field: 'gyre',
    particleCount: 262144,
    integrator: 'rk4',
    tolerance: 1e-5,
    coloring: 'speed',
    timeScale: 1,
    exposure: 0.6,
    paused: false
  };
  private readonly manager: PanelManager;
  private readonly settingsPanel: ExampleSettingsPanelManager;
  private settingsHost: HTMLElement | null = null;
  private telemetryHost: HTMLElement | null = null;
  private telemetry: Telemetry | undefined;

  constructor(host: HTMLElement, onChange: (restart: boolean) => void, onReset: () => void) {
    this.settingsPanel = new ExampleSettingsPanelManager({
      id: 'observatory-settings',
      schema: this.makeSchema(),
      settings: this.settings,
      onSettingsChange: next => {
        const before = {...this.settings};
        if (next.field === 'gyre' || next.field === 'vortex' || next.field === 'jet')
          this.settings.field = next.field;
        if (next.integrator === 'rk2' || next.integrator === 'rk4' || next.integrator === 'rk45')
          this.settings.integrator = next.integrator;
        if (next.coloring === 'speed' || next.coloring === 'step' || next.coloring === 'status')
          this.settings.coloring = next.coloring;
        for (const name of ['particleCount', 'tolerance', 'timeScale', 'exposure'] as const) {
          if (typeof next[name] === 'number') this.settings[name] = next[name];
        }
        if (typeof next.paused === 'boolean') this.settings.paused = next.paused;
        this.settingsPanel.setSchemaAndSettings(this.makeSchema(), this.settings);
        if (this.settingsHost)
          renderExamplePanel(this.settingsHost, this.settingsPanel.makePanel());
        onChange(
          before.field !== this.settings.field ||
            before.particleCount !== this.settings.particleCount ||
            before.integrator !== this.settings.integrator ||
            before.tolerance !== this.settings.tolerance
        );
      }
    });
    this.manager = new PanelManager({parentElement: host});
    this.manager.setProps({
      components: [
        new InfoBoxPanelContainer({
          title: 'Vector Observatory',
          subtitle: 'Scientific GPU advection',
          directory: 'experimental',
          id: 'vector-observatory',
          websiteBaseUrl: '/',
          appearance: 'cinematic',
          panel: makeExampleTabbedPanel({
            id: 'observatory-tabs',
            theme: 'dark',
            panels: [
              makeHtmlCustomPanel({
                id: 'observatory-controls',
                title: 'Settings',
                html: '<div data-observatory-settings></div><p><button type="button" data-observatory-reset>Reseed particles</button></p>',
                onRender: root => {
                  configurePanelHostElement(root, 'cinematic');
                  this.settingsHost = root.querySelector<HTMLElement>(
                    '[data-observatory-settings]'
                  )!;
                  renderExamplePanel(this.settingsHost, this.settingsPanel.makePanel());
                  const reset = root.querySelector<HTMLButtonElement>('[data-observatory-reset]')!;
                  reset.addEventListener('click', onReset);
                  return () => {
                    reset.removeEventListener('click', onReset);
                    if (this.settingsHost) renderExamplePanel(this.settingsHost, null);
                    this.settingsHost = null;
                  };
                }
              }),
              makeHtmlCustomPanel({
                id: 'observatory-info',
                title: 'Info',
                html: `<p>Trace an evolving double gyre, a vortex pair, or a meandering jet. These are synthetic fields sampled on a 256 × 256 regular grid, not observations.</p>
              <p>The double gyre has a ten-second cycle with linearly interpolated snapshots every 0.25 seconds. Streaks connect GPU particle states; the clock reports simulated seconds.</p>
              <p>RK2 and RK4 continuously respawn particles. Adaptive RK45 follows one scientific release with stable identities and explicit stopping reasons. Reseed starts a new release; changing the field, particle count, integrator or tolerance also reseeds.</p>
              <p>RK45 tolerance controls estimated local integration error in field units, not total trajectory or interpolation error. Its bounded work can lag behind wall time; Diagnostics shows pending particles and queued time.</p>
              <p>Stopped markers: gray = expired, orange = outside domain, purple = missing data, red = tolerance or numerical failure. Active status coloring is green; step coloring runs from magenta (short) to green (long).</p>`
              }),
              makeHtmlCustomPanel({
                id: 'observatory-diagnostics',
                title: 'Diagnostics',
                html: '',
                onRender: root => {
                  this.telemetryHost = root;
                  this.renderTelemetry();
                  return () => {
                    this.telemetryHost = null;
                  };
                }
              }),
              this.makeGraphPanel(this.diagnostics.inspectorPanel.panel, 'Graph'),
              this.makeGraphPanel(this.diagnostics.tracePanel.panel, 'Trace'),
              makeHtmlCustomPanel({
                id: 'example-source',
                title: 'Source',
                html: '',
                onRender: root => {
                  for (const [name, source] of [
                    ['main.ts', mainSource],
                    ['fields.ts', fieldsSource]
                  ]) {
                    const heading = document.createElement('h3');
                    heading.textContent = name;
                    const code = document.createElement('pre');
                    code.className = 'observatory-source';
                    code.textContent = source;
                    root.append(heading, code);
                  }
                }
              })
            ]
          })
        })
      ]
    });
    this.redraw();
  }

  redraw(): void {
    this.manager.onRedraw({viewports: [], layers: []});
  }

  updateTelemetry(telemetry: Telemetry): void {
    this.telemetry = telemetry;
    this.renderTelemetry();
  }

  destroy(): void {
    this.manager.finalize();
    this.settingsPanel.finalize();
    this.diagnostics.clear();
  }

  resetGraphDiagnostics(): void {
    this.diagnostics.clear();
    for (const notice of this.graphNotices) this.updateGraphNotice(notice);
  }

  private updateGraphNotice(notice: HTMLElement): void {
    notice.textContent =
      this.settings.integrator === 'rk45'
        ? 'Live RK45 graph: reset counters, then bounded adaptive integration. Trace samples every 60 dispatches; copy nodes show CPU cost only. Counter readback and trail rendering are outside the graph.'
        : 'Live compiled advection graph. Timings are sampled every 60 encodings; trail rendering is submitted separately.';
  }

  private makeGraphPanel(panel: Panel, title: string): Panel {
    return makeHtmlCustomPanel({
      id: `observatory-${title.toLowerCase()}`,
      title,
      html: '<p data-graph-notice></p><div data-graph-panel></div>',
      onRender: root => {
        const notice = root.querySelector<HTMLElement>('[data-graph-notice]')!;
        const host = root.querySelector<HTMLElement>('[data-graph-panel]')!;
        this.graphNotices.add(notice);
        this.updateGraphNotice(notice);
        renderExamplePanel(host, panel);
        return () => {
          this.graphNotices.delete(notice);
          renderExamplePanel(host, null);
        };
      }
    });
  }

  private renderTelemetry(): void {
    if (!this.telemetryHost) return;
    const telemetry = this.telemetry;
    if (!telemetry) {
      this.telemetryHost.textContent = 'Initializing simulation…';
      return;
    }
    const result = telemetry.traceResult;
    const entries: [string, string][] = [
      ['Simulation time', `${telemetry.time.toFixed(2)} s`],
      ['Particles', telemetry.particleCount.toLocaleString()],
      ['Integrator', telemetry.integrator.toUpperCase()],
      ['Frame rate', `${telemetry.framesPerSecond} fps`],
      ['Queued time', `${telemetry.queuedTime.toFixed(2)} s`]
    ];
    if (result) {
      entries.push(
        [
          'Dispatch',
          `${result.dispatchIndex} · ${result.isContinuation ? 'continuation' : 'new horizon'}`
        ],
        ['Target time', `${result.targetTime.toFixed(2)} s`]
      );
      entries.push([
        'Compute time',
        result.gpuMilliseconds === undefined
          ? 'Timer unavailable'
          : `${result.gpuMilliseconds.toFixed(2)} ms`
      ]);
      for (const [label, value] of [
        ['Active', result.active],
        ['Pending', result.pending],
        ['Expired', result.expired],
        ['Outside domain', result.outsideDomain],
        ['Missing data', result.missingData],
        ['Tolerance failure', result.toleranceFailure],
        ['Numerical failure', result.numericalFailure],
        ['Accepted steps', result.acceptedSteps],
        ['Rejected steps', result.rejectedSteps]
      ] as const)
        entries.push([label, value.toLocaleString()]);
    }
    const list = document.createElement('dl');
    list.className = 'observatory-telemetry';
    for (const [label, value] of entries) {
      const term = document.createElement('dt');
      term.textContent = label;
      const description = document.createElement('dd');
      description.textContent = value;
      list.append(term, description);
    }
    const note = document.createElement('p');
    note.textContent = result
      ? 'Work counts describe the latest dispatch. GPU time excludes counter readback and rendering. Pending particles may be at different intermediate times.'
      : 'Frame rate measures the animation loop, not GPU compute time. Select RK45 for adaptive work and particle-state diagnostics.';
    this.telemetryHost.replaceChildren(list, note);
  }

  private makeSchema(): SettingsSchema {
    return {
      title: 'Settings',
      sections: [
        {
          id: 'simulation',
          name: '',
          settings: [
            {
              name: 'field',
              label: 'Vector field',
              type: 'select',
              persist: 'none',
              options: [
                {label: 'Evolving double gyre', value: 'gyre'},
                {label: 'Vortex pair', value: 'vortex'},
                {label: 'Meandering jet', value: 'jet'}
              ]
            },
            {
              name: 'particleCount',
              label: 'Particles',
              type: 'select',
              persist: 'none',
              options: [
                {label: '65,536', value: 65536},
                {label: '262,144', value: 262144},
                {label: '1,048,576', value: 1048576}
              ]
            },
            {
              name: 'integrator',
              label: 'Integration',
              type: 'select',
              persist: 'none',
              options: [
                {label: 'Runge–Kutta 4', value: 'rk4'},
                {label: 'Midpoint / RK2', value: 'rk2'},
                {label: 'Adaptive RK45', value: 'rk45'}
              ]
            },
            ...(this.settings.integrator === 'rk45'
              ? [
                  {
                    name: 'tolerance',
                    label: 'Local error tolerance',
                    type: 'select' as const,
                    persist: 'none' as const,
                    options: [
                      {label: '1e-3 · exploratory', value: 1e-3},
                      {label: '1e-5 · precise', value: 1e-5},
                      {label: '1e-7 · demanding', value: 1e-7}
                    ]
                  },
                  {
                    name: 'coloring',
                    label: 'Color by',
                    type: 'select' as const,
                    persist: 'none' as const,
                    options: [
                      {label: 'Speed', value: 'speed'},
                      {label: 'Accepted step size', value: 'step'},
                      {label: 'Particle status', value: 'status'}
                    ]
                  }
                ]
              : []),
            {
              name: 'timeScale',
              label: 'Time scale',
              type: 'number',
              persist: 'none',
              min: 0.1,
              max: 3,
              step: 0.1
            },
            {
              name: 'exposure',
              label: 'Exposure',
              type: 'number',
              persist: 'none',
              min: 0.15,
              max: 1.5,
              step: 0.05
            },
            {name: 'paused', label: 'Pause', type: 'boolean', persist: 'none'}
          ]
        }
      ]
    };
  }
}
