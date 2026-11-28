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
import type {ScientificFlowTraceResult} from '@luma.gl/graph/experimental-simulation';
import mainSource from './main.ts?raw';
import fieldsSource from './fields.ts?raw';
import globeSource from './globe.ts?raw';
import {GPUGraphDiagnostics} from '../../gpu-graph-diagnostics';

export type ObservatorySettings = {
  field: 'gyre' | 'vortex' | 'jet' | 'weather' | 'spherical' | 'c-grid';
  rotateGlobe: boolean;
  particleCount: number;
  integrator: 'rk2' | 'rk4' | 'rk45';
  tolerance: number;
  /** Dense or compacted RK45 integration work. */
  scheduling: 'dense' | 'active' | 'persistent';
  /** Bounded number of RK45 dispatches per counter synchronization. */
  dispatchesPerReadback: number;
  coloring: 'speed' | 'step' | 'status';
  timeScale: number;
  exposure: number;
  streakWidth: number;
  trailPersistence: number;
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
    field: 'weather',
    rotateGlobe: true,
    particleCount: 65536,
    integrator: 'rk4',
    tolerance: 1e-5,
    scheduling: 'dense',
    dispatchesPerReadback: 1,
    coloring: 'speed',
    timeScale: 1,
    exposure: 0.85,
    streakWidth: 1.7,
    trailPersistence: 0.7,
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
        if (next.field === 'gfs') {
          window.location.href = './gfs.html';
          return;
        }
        const before = {...this.settings};
        if (
          next.field === 'gyre' ||
          next.field === 'vortex' ||
          next.field === 'jet' ||
          next.field === 'weather' ||
          next.field === 'spherical' ||
          next.field === 'c-grid'
        )
          this.settings.field = next.field;
        if (next.integrator === 'rk2' || next.integrator === 'rk4' || next.integrator === 'rk45')
          this.settings.integrator = next.integrator;
        if (
          next.scheduling === 'dense' ||
          next.scheduling === 'active' ||
          next.scheduling === 'persistent'
        )
          this.settings.scheduling = next.scheduling;
        if (next.coloring === 'speed' || next.coloring === 'step' || next.coloring === 'status')
          this.settings.coloring = next.coloring;
        for (const name of [
          'particleCount',
          'tolerance',
          'dispatchesPerReadback',
          'timeScale',
          'exposure',
          'streakWidth',
          'trailPersistence'
        ] as const) {
          if (typeof next[name] === 'number') this.settings[name] = next[name];
        }
        if (typeof next.rotateGlobe === 'boolean') this.settings.rotateGlobe = next.rotateGlobe;
        if (typeof next.paused === 'boolean') this.settings.paused = next.paused;
        this.settingsPanel.setSchemaAndSettings(this.makeSchema(), this.settings);
        if (this.settingsHost)
          renderExamplePanel(this.settingsHost, this.settingsPanel.makePanel());
        onChange(
          before.field !== this.settings.field ||
            before.particleCount !== this.settings.particleCount ||
            before.integrator !== this.settings.integrator ||
            before.tolerance !== this.settings.tolerance ||
            before.scheduling !== this.settings.scheduling ||
            before.dispatchesPerReadback !== this.settings.dispatchesPerReadback
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
                html: `<p>The weather globe shows synthetic jet streams, wind bands, drifting storms and polar vortices over Earth imagery. Drag horizontally to rotate and vertically to tilt toward either pole; disable Rotate globe to hold a view. The field evolves in illustrative seconds, not physical weather time. This is a 2D normalized flow projected onto a sphere, not a forecast or a spherical atmospheric solver. Longitude wraps continuously across the antimeridian. Latitude remains bounded.</p><p>The pole-crossing globe uses Cartesian unit-sphere RK2/RK4 or adaptive RK45 transport, equal-area seeds and a smooth evolving rotation field. Particle identities persist through the poles. Its bounded Cartesian history renders great-circle trails continuously through poles and the antimeridian, and reprojects while paused.</p><p>Trace an evolving double gyre, a vortex pair, or a meandering jet. These are synthetic fields sampled on a 256 × 256 regular grid, not observations. The C-grid gyre instead samples normal velocities on 32 × 32 cell faces, with a discrete streamfunction preserving cell flux balance and zero flow across the exterior faces.</p>
              <p>The double gyre has a ten-second cycle with linearly interpolated snapshots every 0.25 seconds. Streaks connect GPU particle states; the clock reports simulated seconds.</p>
              <p>Cartesian RK2 and RK4 continuously respawn particles; the spherical solvers preserve their release. Adaptive RK45 follows one scientific release with stable identities and explicit stopping reasons. Reseed starts a new release; changing the field, particle count, integrator or tolerance also reseeds.</p>
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
                    ['fields.ts', fieldsSource],
                    ['globe.ts', globeSource]
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
        ? 'Live RK45 graph: reset counters and integrate adaptively; Cartesian queue modes also show full scans or persistent survivor preparation. Trace samples every 60 dispatches; copy nodes show CPU cost only. Counter readback and trail rendering are outside the graph.'
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
        ['Rejected steps', result.rejectedSteps],
        ['Scheduled integration slots', result.scheduledParticles],
        ['Integration workgroups', result.integrationWorkgroups],
        ['Counter readback bytes', result.counterReadbackBytes]
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
      ? 'Work counts describe the latest batch. Scheduled slots exclude the full-slot queue scan; GPU time includes it, but excludes counter readback and rendering. Pending particles may be at different intermediate times.'
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
                {label: 'Weather globe · synthetic', value: 'weather'},
                {label: 'Pole-crossing globe · spherical', value: 'spherical'},
                {label: 'GFS Atlantic · archived model winds', value: 'gfs'},
                {label: 'Evolving double gyre', value: 'gyre'},
                {label: 'C-grid gyre · face velocities', value: 'c-grid'},
                {label: 'Vortex pair', value: 'vortex'},
                {label: 'Meandering jet', value: 'jet'}
              ]
            },
            ...(this.settings.field === 'weather' || this.settings.field === 'spherical'
              ? [
                  {
                    name: 'rotateGlobe',
                    label: 'Rotate globe',
                    type: 'boolean' as const,
                    persist: 'none' as const
                  }
                ]
              : []),
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
                    name: 'scheduling',
                    label: 'RK45 scheduling',
                    type: 'select' as const,
                    persist: 'none' as const,
                    options: [
                      {label: 'Dense · all slots', value: 'dense'},
                      ...(this.settings.field === 'spherical'
                        ? []
                        : [{label: 'Active · GPU queue', value: 'active'}]),
                      {label: 'Persistent · survivors', value: 'persistent'}
                    ]
                  },
                  {
                    name: 'dispatchesPerReadback',
                    label: 'Dispatches per readback',
                    type: 'select' as const,
                    persist: 'none' as const,
                    options: [
                      {label: '1 · interactive', value: 1},
                      {label: '4', value: 4},
                      {label: '16 · throughput', value: 16}
                    ]
                  },
                  ...(this.settings.field === 'spherical'
                    ? []
                    : [
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
                      ])
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
            {
              name: 'streakWidth',
              label: 'Streak width',
              type: 'number',
              persist: 'none',
              min: 0.7,
              max: 3,
              step: 0.1
            },
            {
              name: 'trailPersistence',
              label: 'Trail persistence (s)',
              type: 'number',
              persist: 'none',
              min: 0.2,
              max: 2,
              step: 0.1
            },
            {name: 'paused', label: 'Pause', type: 'boolean', persist: 'none'}
          ]
        }
      ]
    };
  }
}
