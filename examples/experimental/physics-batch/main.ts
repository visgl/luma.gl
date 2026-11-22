// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {luma} from '@luma.gl/core';
import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {GPUGraphDiagnostics} from '../../gpu-graph-diagnostics';
import {createRigidBodyPanel} from '../gpu-rigid-body-world/info-box';
import {runBatchBenchmark, type BatchBenchmarkScene} from './batch-benchmark';
import {runTerrainStreamingBenchmark} from './batch-terrain';
import {runEnsembleRecoveryStress, type RecoveryStep} from './batch-recovery';
import {runEventBurst} from './batch-events';
import {runCollisionScan} from './batch-casts';

const diagnostics = new GPUGraphDiagnostics();
const panel = createRigidBodyPanel(
  diagnostics,
  'Physics Batch Lab',
  'G10 · scale, streaming and throughput'
);
function updatePanel() {
  panel.update();
  requestAnimationFrame(updatePanel);
}
requestAnimationFrame(updatePanel);
const button = document.querySelector<HTMLButtonElement>('#run')!;
const exportButton = document.querySelector<HTMLButtonElement>('#export')!;
const status = document.querySelector<HTMLOutputElement>('#status')!;
const canvas = document.querySelector<HTMLCanvasElement>('#world')!;
/** Workload selector shared by validation and control visibility. */
const scenarioControl = document.querySelector<HTMLSelectElement>('#scene')!;
scenarioControl.add(new Option('Event burst', 'event-burst'));
/** Display only the controls that affect this workload. */
function updateScenarioControls(): void {
  /** The burst uses one fixed step and its own group and ring sizes. */
  const eventBurst = scenarioControl.value === 'event-burst';
  for (const label of document.querySelectorAll<HTMLLabelElement>('label[data-event-burst]'))
    label.hidden = !eventBurst;
  /** Recovery uses a fixed body fixture and schedules all healthy worlds. */
  const independentRecovery = scenarioControl.value === 'independent-recovery';
  /** The scan uses one world, so it only needs collider and sampling controls. */
  const scan = scenarioControl.value === 'collision-scan';
  for (const id of [
    'bodies',
    'pairs',
    'active',
    'worlds',
    'frames',
    'submission',
    'casts',
    'scan-radius'
  ]) {
    /** Hide the associated label and control together. */
    const label = document.querySelector(`#${id}`)?.closest('label');
    if (label) {
      if (id === 'casts' || id === 'scan-radius') label.hidden = !scan;
      else if (id === 'bodies') label.hidden = independentRecovery;
      else if (id === 'worlds' || id === 'frames' || id === 'submission') label.hidden = scan;
      else label.hidden = scan || independentRecovery;
      if (eventBurst) label.hidden = true;
    }
  }
  document.querySelector('#body-label')!.textContent = scan ? 'Colliders' : 'Bodies per world';
}
scenarioControl.addEventListener('change', updateScenarioControls);
updateScenarioControls();
let report:
  | Awaited<ReturnType<typeof runBatchBenchmark>>
  | Awaited<ReturnType<typeof runTerrainStreamingBenchmark>>
  | Awaited<ReturnType<typeof runEnsembleRecoveryStress>>
  | Awaited<ReturnType<typeof runEventBurst>>
  | Awaited<ReturnType<typeof runCollisionScan>>
  | undefined;
const device = await luma.createDevice({
  adapters: [webgpuAdapter],
  type: 'webgpu',
  optionalFeatures: ['timestamp-query']
});
const number = (id: string) => Number(document.querySelector<HTMLInputElement>(`#${id}`)!.value);
button.onclick = async () => {
  button.disabled = true;
  exportButton.disabled = true;
  diagnostics.clear();
  status.textContent = 'Allocating and compiling resident worlds…';
  try {
    /** Resolve the selected workload before compiling a graph. */
    const scenario = scenarioControl.value;
    if (scenario === 'collision-scan') {
      /** Keep the complete scan result available for export. */
      const scan = await runCollisionScan(device, {
        colliders: number('bodies'),
        casts: number('casts'),
        radius: number('scan-radius')
      });
      report = scan;
      status.textContent = `Complete: ${scan.complete}
Hits: ${scan.hitCount}/${scan.options.casts}
Matches scalar sample: ${scan.matchesScalar}
Full scan: ${scan.scanMilliseconds.toFixed(2)} ms
Matched ${scan.sampleCount}-cast sample
  Batched: ${scan.sampleBatchMilliseconds.toFixed(2)} ms
  Sequential: ${scan.sampleScalarMilliseconds.toFixed(2)} ms`;
      paintCollisionScan(scan);
      exportButton.disabled = false;
      return;
    }
    if (scenario === 'event-burst') {
      /** Run a bounded burst and retain the two event payloads for export. */
      const burst = await runEventBurst(
        device,
        number('event-groups'),
        number('event-capacity'),
        diagnostics
      );
      report = burst;
      canvas.width = innerWidth * devicePixelRatio;
      canvas.height = innerHeight * devicePixelRatio;
      status.textContent = `Complete: ${burst.complete}
Matches expected events: ${burst.matchesExpected}
Contact events retained / dropped: ${burst.contacts.events.length} / ${burst.contacts.dropped}
Trigger events retained / dropped: ${burst.triggers.events.length} / ${burst.triggers.dropped}
Full step: ${burst.stepMilliseconds.toFixed(2)} ms`;
      exportButton.disabled = false;
      return;
    }
    if (scenario === 'independent-recovery') {
      if (document.querySelector<HTMLSelectElement>('#submission')!.value !== 'ensemble')
        throw new Error('Independent recovery requires fused ensemble submission');
      /** Keep the timeline scale fixed for the duration of this run. */
      const frames = number('frames');
      /** Collect chart cells in attempted step order. */
      const timeline: (readonly RecoveryStep[])[] = [];
      /** Keep the completed workload report available for JSON export. */
      const recovery = await runEnsembleRecoveryStress(
        device,
        number('worlds'),
        frames,
        ({step, failedAt, healthyStepsWhileHeld, outcomes}) => {
          timeline.push(outcomes);
          if (step === frames || step % Math.max(1, Math.floor(frames / 120)) === 0)
            paintRecoveryTimeline(timeline, frames);
          status.textContent = `Step ${step}/${frames}
Failed instance: ${failedAt ? '2' : 'none'}
Healthy steps during quarantine: ${healthyStepsWhileHeld}`;
        },
        diagnostics
      );
      report = recovery;
      status.textContent = `Complete: ${recovery.complete}
Instance ${recovery.subject + 1} rejected step: ${recovery.failedAt ?? 'none'}
Reset before step: ${recovery.resetAt}
Steps each sibling accepted during quarantine: ${recovery.healthyStepsWhileHeld}
Steps the recovered instance accepted: ${recovery.recoveredSteps}
Fixed allocation and graph: ${recovery.fixedAllocation}`;
      exportButton.disabled = false;
      return;
    }
    if (scenario === 'streamed-terrain') {
      if (document.querySelector<HTMLSelectElement>('#submission')!.value !== 'ensemble')
        throw new Error('Streamed terrain requires fused ensemble submission');
      const terrain = await runTerrainStreamingBenchmark(
        device,
        {
          worlds: number('worlds'),
          bodies: number('bodies'),
          frames: number('frames'),
          activeFraction: number('active'),
          pairsPerBody: number('pairs')
        },
        frame => {
          status.textContent = `Frame ${frame}/${number('frames')}`;
        },
        diagnostics
      );
      report = terrain;
      status.textContent = `Complete: ${terrain.complete}
Simulation rejection: ${terrain.firstIncompleteFrame ?? 'none'}
Terrain sample error: ${terrain.sampledHeightError?.toExponential(2) ?? 'no hit'}
Enabled worlds: ${terrain.activeWorlds}/${terrain.options.worlds}
Last-step scheduled worlds: ${terrain.activity.at(-1)}
Streamed instance windows: ${terrain.streamedWindows}
Provider loads: ${terrain.providerLoads}
Terrain atlas: ${terrain.terrainAtlas.residentPages}/${terrain.terrainAtlas.capacityPages} pages for ${terrain.terrainAtlas.residentSlots} tiles
Terrain payload reserved: ${(terrain.terrainAtlas.reservedBytes / 1024).toFixed(1)} KiB (private: ${(terrain.terrainAtlas.privateSlotBytes / 1024).toFixed(1)} KiB)
Window staging and apply p95: ${terrain.streamP95.toFixed(2)} ms
Fused step p95: ${terrain.stepP95.toFixed(2)} ms
Fixed allocation: ${terrain.fixedAllocation}
Resident: ${(terrain.residentBytes / 1048576).toFixed(1)} MiB`;
      paintStreamedTerrain(terrain);
      exportButton.disabled = false;
      return;
    }
    report = await runBatchBenchmark(
      device,
      {
        worlds: number('worlds'),
        activeFraction: number('active'),
        bodies: number('bodies'),
        frames: number('frames'),
        warmup: 10,
        steps: 1,
        pairsPerBody: number('pairs'),
        scene: getScenario(),
        submission:
          document.querySelector<HTMLSelectElement>('#submission')!.value === 'ensemble'
            ? 'ensemble'
            : document.querySelector<HTMLSelectElement>('#submission')!.value === 'separate'
              ? 'separate'
              : 'batched'
      },
      frame => {
        status.textContent = `Frame ${frame}/${number('frames')}`;
      },
      diagnostics
    );
    const work = report.workSamples.at(-1);
    const breakdown = Object.entries(report.profile?.groups ?? {})
      .map(
        ([name, timing]) =>
          `${name}: CPU ${timing.cpuEncodeMilliseconds.toFixed(2)} ms / GPU ${timing.gpuMilliseconds?.toFixed(2) ?? 'unavailable'} ms`
      )
      .join('\n');
    status.textContent = `Active worlds: ${report.activeWorlds}/${report.options.worlds}\nComplete: ${report.complete}\nBatch p50 / p95: ${report.latencyMilliseconds.p50.toFixed(2)} / ${report.latencyMilliseconds.p95.toFixed(2)} ms\nBody-steps/s: ${report.bodyStepsPerSecond?.toFixed(0) ?? 'incomplete'}\nResident: ${(report.afterReuse.residentBytes / 1048576).toFixed(1)} MiB\nSetup: ${report.setupMilliseconds.toFixed(0)} ms\nRecycle: ${report.reuseMilliseconds === null ? 'not retained' : `${report.reuseMilliseconds.toFixed(1)} ms`}\nReused slots: ${report.afterReuse.reusedSlots}\nLast-step active bodies: ${work?.activeBodies ?? 'unavailable'}\nVisited / journaled contacts: ${work?.visitedContacts ?? 'unavailable'} / ${work?.journaledContacts ?? 'unavailable'}\nTouched hash buckets: ${work?.touchedBuckets ?? 'unavailable'}\nSnapshot bytes: ${work ? work.bodySnapshotBytes + work.contactSnapshotBytes + work.allocatorSnapshotBytes + work.vehicleSnapshotBytes : 'unavailable'}\n\nSeparate profiling sample:\n${breakdown}`;
    if (report.vehiclesPerWorld)
      status.textContent += `\nVehicle-steps/s: ${report.vehicleStepsPerSecond?.toFixed(0) ?? 'incomplete'}`;
    canvas.width = innerWidth * devicePixelRatio;
    canvas.height = innerHeight * devicePixelRatio;
    const context = canvas.getContext('2d')!;
    context.fillStyle = '#101820';
    context.fillRect(0, 0, canvas.width, canvas.height);
    if (report.vehiclesPerWorld) {
      const patchExtent = report.vehiclesPerWorld * 4;
      const scale = Math.min(canvas.width, canvas.height) / Math.max(40, patchExtent + 8);
      context.fillStyle = '#253742';
      context.fillRect(
        canvas.width / 2 - 100 * scale,
        canvas.height / 2 - (patchExtent * scale) / 2,
        200 * scale,
        patchExtent * scale
      );
      context.fillStyle = '#6a8795';
      context.fillRect(
        canvas.width / 2 - 1,
        canvas.height / 2 - (patchExtent * scale) / 2,
        2,
        patchExtent * scale
      );
      context.fillStyle = '#70bcdf';
      for (const state of report.states.slice(2)) {
        context.save();
        context.translate(
          canvas.width / 2 + state.position[0] * scale,
          canvas.height / 2 - state.position[1] * scale
        );
        const [orientationX, orientationY, orientationZ, orientationW] = state.orientation;
        context.rotate(
          -Math.atan2(
            2 * (orientationW * orientationZ + orientationX * orientationY),
            1 - 2 * (orientationY * orientationY + orientationZ * orientationZ)
          )
        );
        context.fillRect(-1.3 * scale, -0.65 * scale, 2.6 * scale, 1.3 * scale);
        context.restore();
      }
      exportButton.disabled = false;
      return;
    }
    const width = Math.ceil(Math.sqrt(number('bodies')));
    const scale = Math.min(canvas.width, canvas.height) / (width * 2 + 4);
    context.fillStyle = '#70bcdf';
    for (const state of report.states.slice(0, number('bodies'))) {
      context.beginPath();
      context.arc(
        canvas.width * 0.25 + state.position[0] * scale,
        canvas.height * 0.9 - state.position[1] * scale,
        scale / 2,
        0,
        2 * Math.PI
      );
      context.fill();
    }
    exportButton.disabled = false;
  } catch (error) {
    status.textContent = String(error);
  } finally {
    button.disabled = false;
  }
};
exportButton.onclick = () => {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(report, null, 2)], {type: 'application/json'})
  );
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'physics-batch-report.json';
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

/** Read the selected workload, falling back to sparse debris for an unknown selection. */
function getScenario(): BatchBenchmarkScene {
  const value = scenarioControl.value;
  return value === 'pile' ||
    value === 'sleeping' ||
    value === 'wake-storm' ||
    value === 'vehicle-fleet'
    ? value
    : 'sparse';
}

/** Draw the first instance's sampled terrain and spheres using the batch lab canvas. */
function paintStreamedTerrain(terrain: Awaited<ReturnType<typeof runTerrainStreamingBenchmark>>) {
  canvas.width = innerWidth * devicePixelRatio;
  canvas.height = innerHeight * devicePixelRatio;
  const context = canvas.getContext('2d')!;
  const scale = Math.min(canvas.width, canvas.height) / (terrain.extent * 2.4);
  context.fillStyle = '#101820';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.translate(canvas.width * 0.48, canvas.height / 2 - (terrain.extent * scale) / 2);
  const extent = terrain.extent * scale;
  context.fillStyle = '#31585a';
  context.fillRect(0, 0, extent, extent);
  context.fillStyle = '#254346';
  context.fillRect(extent, 0, extent, extent);
  context.fillStyle = '#a9dde7';
  for (const {position} of terrain.states) {
    context.beginPath();
    context.arc(position[0] * scale, position[1] * scale, scale * 0.5, 0, 2 * Math.PI);
    context.fill();
  }
}

/** Draw one swimlane per displayed instance and one cell per attempted step. */
function paintRecoveryTimeline(timeline: readonly (readonly RecoveryStep[])[], totalSteps: number) {
  /** Use device pixels to keep the chart and text sharp. */
  const canvasWidth = Math.round(innerWidth * devicePixelRatio);
  /** Match the full-height scene canvas in device pixels. */
  const canvasHeight = Math.round(innerHeight * devicePixelRatio);
  if (canvas.width !== canvasWidth) canvas.width = canvasWidth;
  if (canvas.height !== canvasHeight) canvas.height = canvasHeight;
  /** Draw alongside the same controls and graph as the other Batch Lab workloads. */
  const context = canvas.getContext('2d')!;
  /** All recorded steps have the same ensemble membership. */
  const instanceCount = timeline[0].length;
  /** Cap visible rows while reporting counters for every world. */
  const shown = Math.min(instanceCount, 12);
  /** Leave room for the settings panel at the left of the canvas. */
  const left = Math.min(canvas.width * 0.4, 410 * devicePixelRatio);
  /** Keep the last step away from the viewport edge. */
  const padding = 24 * devicePixelRatio;
  /** Reserve room above the swimlanes for the displayed world count. */
  const top = canvas.height * 0.25;
  /** Keep every visible swimlane and its legend within the viewport. */
  const rowHeight = Math.min(35 * devicePixelRatio, canvas.height / (shown + 5));
  /** Use one horizontal unit per attempted step. */
  const stepWidth = (canvas.width - left - padding) / totalSteps;
  /** Encode accepted, rejected, held and resumed steps consistently with the legend. */
  const colors: Record<RecoveryStep, string> = {
    accepted: '#37a9b0',
    rejected: '#ef795b',
    held: '#584951',
    recovered: '#9bc76d'
  };
  context.fillStyle = '#101820';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.font = `${12 * devicePixelRatio}px system-ui`;
  for (let instance = 0; instance < shown; instance++) {
    /** Place labels above an instance’s track to keep the step cells unobstructed. */
    const row = top + instance * rowHeight;
    context.fillStyle = '#253742';
    context.fillRect(left, row, canvas.width - left - padding, rowHeight * 0.72);
    context.fillStyle = '#dce8f0';
    context.fillText(`World ${instance + 1}`, left, row - 2 * devicePixelRatio);
    for (const [step, outcomes] of timeline.entries()) {
      context.fillStyle = colors[outcomes[instance]];
      context.fillRect(left + step * stepWidth, row, stepWidth, rowHeight * 0.72);
    }
  }
  /** Draw labels using the same outcome colors as the cells. */
  const legend = Object.entries(colors);
  for (const [index, [label, color]] of legend.entries()) {
    context.fillStyle = color;
    context.fillText(label, left + index * 76 * devicePixelRatio, top + (shown + 0.35) * rowHeight);
  }
  if (shown < instanceCount) {
    context.fillStyle = '#aabcc8';
    context.fillText(`Showing ${shown} of ${instanceCount} worlds`, left, top - rowHeight);
  }
}

/** Display nearest distances as a top-down scan, with clear pixels marking misses. */
function paintCollisionScan(scan: Awaited<ReturnType<typeof runCollisionScan>>) {
  canvas.width = innerWidth * devicePixelRatio;
  canvas.height = innerHeight * devicePixelRatio;
  /** Render the fixed sample grid at its actual resolution before magnifying it. */
  const image = new OffscreenCanvas(scan.width, scan.height);
  /** The staged image preserves one pixel per ordered query result. */
  const source = image.getContext('2d')!;
  /** Store one opaque color per sample, including unsampled pixels in the final row. */
  const pixels = source.createImageData(scan.width, scan.height);
  for (const [index, distance] of scan.distances.entries()) {
    /** Higher surfaces return sooner and appear brighter. */
    const brightness = distance === null ? 0 : Math.max(0, Math.min(1, (6 - distance) / 4));
    pixels.data.set(
      distance === null
        ? [18, 27, 35, 255]
        : [38 + brightness * 150, 113 + brightness * 112, 162 + brightness * 78, 255],
      index * 4
    );
  }
  source.putImageData(pixels, 0, 0);
  /** Center the scan in the plot area to the right of the workspace controls. */
  const context = canvas.getContext('2d')!;
  /** Leave space for the fixed settings column. */
  const left = Math.min(canvas.width * 0.42, 420 * devicePixelRatio);
  /** Keep a square plot inside the available viewport. */
  const size = Math.min(canvas.height * 0.8, canvas.width - left - 32 * devicePixelRatio);
  context.fillStyle = '#101820';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingEnabled = false;
  context.drawImage(image, left, (canvas.height - size) / 2, size, size);
}
