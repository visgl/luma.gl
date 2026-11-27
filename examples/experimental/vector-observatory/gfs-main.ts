// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {luma} from '@luma.gl/core';
import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {PanelManager} from '@deck.gl-community/panels';
import {InfoBoxPanelContainer} from '../../example-info-box';
import {makeExampleTabbedPanel, makeHtmlCustomPanel} from '../../example-panels';
import {GPUGraphDiagnostics} from '../../gpu-graph-diagnostics';
import {GFS_DURATION, GFS_FIXTURE} from './gfs-data';
import {GFS_SWEEP, runGfsTrajectories, type GfsRun} from './gfs-run';
import {GfsView} from './gfs-view';
import earthUrl from '../../showcase/globe/earth.jpg';
import mapboxLicense from '../../../modules/graph/test/experimental/simulation/fixtures/MAPBOX-LICENSE.txt?raw';
import runSource from './gfs-run.ts?raw';
import './style.css';
import './gfs-style.css';

/** Required element from this example's static document. */
function element<ElementType extends HTMLElement>(identifier: string): ElementType {
  return document.querySelector<ElementType>('#' + identifier)!;
}
/** Download a user-requested local artifact and release its temporary URL. */
function download(name: string, contents: string, type: string): void {
  const url = URL.createObjectURL(new Blob([contents], {type}));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
/** Visible initialization/progress status, separate from physical model time. */
const status = element<HTMLOutputElement>('status');
try {
  const device = await luma.createDevice({
    adapters: [webgpuAdapter],
    optionalFeatures: ['timestamp-query']
  });
  const diagnostics = new GPUGraphDiagnostics({traceTitle: 'Trace'});
  const pageAbort = new AbortController();
  let benchmarkAbort: AbortController | undefined;
  let run: GfsRun | undefined;
  let currentJob: Promise<void> | undefined;
  let benchmarkHost: HTMLElement | undefined;
  let benchmarkRows: GfsRun['report'][] = [];
  let benchmarkStatus =
    'Run seven controlled variants, twice each after warmup. Four particles; six physical hours per run.';
  let progressHost: HTMLElement | undefined;
  let animationFrame = 0;
  let playing = true;
  let time = 0;
  let previous = performance.now();
  const timeline = element<HTMLInputElement>('gfs-timeline');
  const playback = element<HTMLButtonElement>('gfs-play');
  const speed = element<HTMLSelectElement>('gfs-speed');
  const exportCsv = element<HTMLButtonElement>('gfs-export');
  const image = new Image();
  image.src = earthUrl;
  await image.decode();
  const view = new GfsView(element<HTMLCanvasElement>('flow'), image);
  /** Render benchmark results as a real table with explicit measurement boundaries. */
  function renderBenchmark(): void {
    if (!benchmarkHost) return;
    benchmarkHost.replaceChildren();
    const note = document.createElement('p');
    note.textContent = benchmarkStatus;
    const button = document.createElement('button');
    button.textContent = benchmarkAbort ? 'Cancel sweep' : 'Run accuracy / cost sweep';
    button.disabled = !run;
    button.onclick = () => {
      if (benchmarkAbort) benchmarkAbort.abort();
      else currentJob = benchmark();
    };
    const table = document.createElement('table');
    table.className = 'gfs-results';
    const header = table.createTHead().insertRow();
    for (const title of ['Variant', 'Error (m)', 'GPU (ms)', 'Wall (ms)', 'Steps']) {
      const cell = document.createElement('th');
      cell.textContent = title;
      header.append(cell);
    }
    for (const report of benchmarkRows) {
      const row = table.insertRow();
      for (const value of [
        report.label,
        report.maximumErrorMetres.toFixed(2),
        report.gpuMilliseconds?.toFixed(2) ?? 'n/a',
        report.wallMilliseconds.toFixed(0),
        report.acceptedSteps.toLocaleString()
      ])
        row.insertCell().textContent = value;
    }
    const exportButton = document.createElement('button');
    exportButton.textContent = 'Export benchmark JSON';
    exportButton.disabled = benchmarkRows.length === 0 || Boolean(benchmarkAbort);
    exportButton.onclick = () =>
      download(
        'gfs-accuracy-cost.json',
        JSON.stringify(
          {
            fixture: {
              source: GFS_FIXTURE.sourceRepository,
              revision: GFS_FIXTURE.sourceRevision,
              dates: GFS_FIXTURE.snapshots.map(snapshot => snapshot.date)
            },
            device: device.info,
            timestampQueries: device.features.has('timestamp-query'),
            durationSeconds: GFS_DURATION,
            referenceRefinementMetres: GFS_FIXTURE.reference.maximumReferenceDifferenceMetres,
            measurement:
              'GPU compute only; wall includes allocation, compilation, counter synchronization, capture and final readback. Warmup discarded; two samples per variant. Coarse and frozen cases alter the field, so their error includes interpolation error.',
            samples: benchmarkRows
          },
          null,
          2
        ),
        'application/json'
      );
    const boundary = document.createElement('p');
    boundary.textContent =
      'GPU time excludes transfers and rendering. Wall time includes setup and explicit readback. Timings are device-dependent; four particles measure latency, not throughput. Coarse/frozen variants change the field. Error is measured only at matching hourly horizons.';
    benchmarkHost.append(note, button, table, exportButton, boundary);
  }
  /** Run controlled experiments serially; cancellation preserves the completed visual release. */
  async function benchmark(): Promise<void> {
    benchmarkAbort = new AbortController();
    benchmarkRows = [];
    benchmarkStatus = 'Warming up…';
    renderBenchmark();
    const signal = AbortSignal.any([pageAbort.signal, benchmarkAbort.signal]);
    try {
      const warmup = await runGfsTrajectories(device, GFS_SWEEP[0], undefined, signal);
      warmup.destroy();
      for (let repetition = 0; repetition < 2; repetition++) {
        // Reverse the second pass to reduce systematic ordering bias.
        const variants = repetition === 0 ? GFS_SWEEP : [...GFS_SWEEP].reverse();
        for (const variant of variants) {
          benchmarkStatus = `${variant.label} · sample ${repetition + 1}/2`;
          renderBenchmark();
          const sample = await runGfsTrajectories(device, variant, undefined, signal);
          benchmarkRows.push(sample.report);
          sample.destroy();
          renderBenchmark();
          await new Promise<void>(resolve => setTimeout(resolve, 0));
        }
      }
      benchmarkStatus = 'Complete · two samples per variant; warmup discarded.';
    } catch (error) {
      benchmarkStatus = signal.aborted
        ? 'Sweep cancelled; completed samples retained.'
        : `Sweep failed: ${String(error)}`;
    } finally {
      benchmarkAbort = undefined;
      renderBenchmark();
    }
  }
  const manager = new PanelManager({parentElement: element('observatory-panels')});
  manager.setProps({
    components: [
      new InfoBoxPanelContainer({
        title: 'GFS Atlantic',
        subtitle: 'Archived winds / GPU trajectory lab',
        directory: 'experimental',
        id: 'vector-observatory',
        websiteBaseUrl: '/',
        appearance: 'cinematic',
        panel: makeExampleTabbedPanel({
          id: 'gfs-tabs',
          theme: 'dark',
          panels: [
            makeHtmlCustomPanel({
              id: 'gfs-info',
              title: 'Info',
              html: `<p>Six hours of NOAA GFS 10 m model winds from 20 November 2016, decoded from the pinned Mapbox 8-bit archive. This is model data, not observations or a forecast service.</p><p>The arrows interpolate the two archived wind snapshots. Cyan trails are a 1,024-particle GPU release; four colored releases match the independent CPU reference. White dashes connect hourly reference points. The overview uses geographic coordinates; inset axes are magnified independently.</p><p>RK45 uses a 1 m local tolerance and 300 s maximum step. The GPU history retains 73 common horizons, every five minutes, before one explicit trajectory readback. Playback shows those retained states; it does not rerun the solver. Reported error compares only common hourly horizons.</p><p><a href="./index.html">Return to synthetic weather globe</a> · <a href="${GFS_FIXTURE.sourceRepository}/tree/${GFS_FIXTURE.sourceRevision}" target="_blank" rel="noreferrer">Pinned data source</a></p><details><summary>Data license</summary><pre data-gfs-license></pre></details>`,
              onRender: root => {
                root.querySelector<HTMLElement>('[data-gfs-license]')!.textContent = mapboxLicense;
              }
            }),
            makeHtmlCustomPanel({
              id: 'gfs-diagnostics',
              title: 'Diagnostics',
              html: '',
              onRender: root => {
                progressHost = root;
                root.textContent = run ? JSON.stringify(run.report, null, 2) : status.textContent;
                root.style.whiteSpace = 'pre-wrap';
                return () => {
                  progressHost = undefined;
                };
              }
            }),
            diagnostics.inspectorPanel.panel,
            diagnostics.tracePanel.panel,
            makeHtmlCustomPanel({
              id: 'gfs-benchmark',
              title: 'Accuracy / cost',
              html: '',
              onRender: root => {
                benchmarkHost = root;
                renderBenchmark();
                return () => {
                  benchmarkHost = undefined;
                };
              }
            }),
            makeHtmlCustomPanel({
              id: 'gfs-source',
              title: 'Source',
              html: '<pre class="observatory-source"></pre>',
              onRender: root => {
                root.querySelector('pre')!.textContent = runSource;
              }
            })
          ]
        })
      })
    ]
  });
  playback.onclick = () => {
    if (time >= GFS_DURATION) time = 0;
    playing = !playing;
    playback.textContent = playing ? 'Pause' : 'Play';
  };
  timeline.oninput = () => {
    time = Number(timeline.value);
    playing = false;
    playback.textContent = 'Play';
  };
  exportCsv.onclick = async () => {
    if (!run) return;
    exportCsv.disabled = true;
    try {
      const {makeGfsCsv} = await import('./gfs-export');
      download('gfs-atlantic-trajectories.csv', await makeGfsCsv(run.frames), 'text/csv');
    } catch (error) {
      status.textContent = `CSV export failed: ${String(error)}`;
    } finally {
      exportCsv.disabled = false;
    }
  };
  /** Animate presentation only; integration and readback have explicit boundaries. */
  function animate(now: number): void {
    if (pageAbort.signal.aborted) return;
    if (run && playing)
      time = Math.min(
        GFS_DURATION,
        time + Math.min(0.1, (now - previous) / 1000) * Number(speed.value)
      );
    if (time >= GFS_DURATION) {
      playing = false;
      playback.textContent = 'Replay';
    }
    previous = now;
    timeline.value = String(time);
    element('gfs-time').textContent = `${(time / 3600).toFixed(2)} / 6 h`;
    view.draw(run?.frames ?? [], time);
    manager.onRedraw({viewports: [], layers: []});
    animationFrame = requestAnimationFrame(animate);
  }
  animationFrame = requestAnimationFrame(animate);
  currentJob = (async () => {
    try {
      run = await runGfsTrajectories(
        device,
        {...GFS_SWEEP[0], side: 32, captureInterval: 300},
        (tracer, result) => {
          diagnostics.record(tracer.commandGraph, result.encoding);
          status.textContent = `Integrating archived winds · ${Math.round((result.targetTime / GFS_DURATION) * 100)}%`;
          if (progressHost) progressHost.textContent = status.textContent;
        },
        pageAbort.signal
      );
      status.textContent = `GPU RK45 · ${run.report.maximumErrorMetres.toFixed(2)} m maximum hourly reference error · 73 retained horizons`;
      if (progressHost) progressHost.textContent = JSON.stringify(run.report, null, 2);
      playback.disabled = false;
      timeline.disabled = false;
      exportCsv.disabled = false;
      renderBenchmark();
    } catch (error) {
      if (!pageAbort.signal.aborted) {
        status.textContent = `Integration failed: ${String(error)}`;
        playing = false;
      }
    }
  })();
  window.addEventListener(
    'pagehide',
    () => {
      pageAbort.abort();
      cancelAnimationFrame(animationFrame);
      void currentJob?.finally(() => {
        manager.finalize();
        diagnostics.clear();
        run?.destroy();
        device.destroy();
      });
    },
    {once: true}
  );
} catch (error) {
  const alert = element('error');
  alert.hidden = false;
  alert.textContent = `This example requires WebGPU. ${String(error)}`;
}
