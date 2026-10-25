// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {luma} from '@luma.gl/core';
import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {GPUGraphDiagnostics} from '../../gpu-graph-diagnostics';
import {createRigidBodyPanel} from '../gpu-rigid-body-world/info-box';
import {runBatchBenchmark} from './batch-benchmark';

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
let report: Awaited<ReturnType<typeof runBatchBenchmark>> | undefined;
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
    status.textContent = `Active worlds: ${report.activeWorlds}/${report.options.worlds}\nComplete: ${report.complete}\nBatch p50 / p95: ${report.latencyMilliseconds.p50.toFixed(2)} / ${report.latencyMilliseconds.p95.toFixed(2)} ms\nBody-steps/s: ${report.bodyStepsPerSecond?.toFixed(0) ?? 'incomplete'}\nResident: ${(report.afterReuse.residentBytes / 1048576).toFixed(1)} MiB\nSetup: ${report.setupMilliseconds.toFixed(0)} ms\nRecycle: ${report.reuseMilliseconds === null ? 'not retained' : `${report.reuseMilliseconds.toFixed(1)} ms`}\nReused slots: ${report.afterReuse.reusedSlots}\nLast-step active bodies: ${work?.activeBodies ?? 'unavailable'}\nVisited / journaled contacts: ${work?.visitedContacts ?? 'unavailable'} / ${work?.journaledContacts ?? 'unavailable'}\nTouched hash buckets: ${work?.touchedBuckets ?? 'unavailable'}\nSnapshot bytes: ${work ? work.bodySnapshotBytes + work.contactSnapshotBytes + work.allocatorSnapshotBytes : 'unavailable'}\n\nSeparate profiling sample:\n${breakdown}`;
    canvas.width = innerWidth * devicePixelRatio;
    canvas.height = innerHeight * devicePixelRatio;
    const context = canvas.getContext('2d')!;
    context.fillStyle = '#101820';
    context.fillRect(0, 0, canvas.width, canvas.height);
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

function getScenario(): 'sparse' | 'pile' | 'sleeping' | 'wake-storm' {
  const value = document.querySelector<HTMLSelectElement>('#scene')!.value;
  return value === 'pile' || value === 'sleeping' || value === 'wake-storm' ? value : 'sparse';
}
