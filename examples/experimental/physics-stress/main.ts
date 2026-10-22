// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {luma} from '@luma.gl/core';
import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {
  GPURigidBodyRecoveryRunner,
  type GPURigidBodyRecoveryResult,
  type GPURigidBodyState
} from '@luma.gl/gpgpu/gpu-physics';
import {GPUGraphDiagnostics} from '../../gpu-graph-diagnostics';
import {createRigidBodyPanel} from '../gpu-rigid-body-world/info-box';
import {makeStressScene, isStressScene, STRESS_SCENES, type StressScene} from './scenes';

const canvas = document.querySelector<HTMLCanvasElement>('#world')!;
const context = canvas.getContext('2d')!;
const select = document.querySelector<HTMLSelectElement>('#scene')!;
const solver = document.querySelector<HTMLSelectElement>('#solver')!;
const timestep = document.querySelector<HTMLSelectElement>('#timestep')!;
const status = document.querySelector<HTMLOutputElement>('#status')!;
const pause = document.querySelector<HTMLButtonElement>('#pause')!;
const reset = document.querySelector<HTMLButtonElement>('#reset')!;
const exportButton = document.querySelector<HTMLButtonElement>('#export')!;
const diagnostics = new GPUGraphDiagnostics();
const panel = createRigidBodyPanel(
  diagnostics,
  'Physics Stress Lab',
  'GPU physics · recovery and qualification'
);
for (const [value, title] of Object.entries(STRESS_SCENES)) select.add(new Option(title, value));
let selectedScene: StressScene = 'capacity';
let activeScene: StressScene = 'capacity';
select.onchange = () => {
  if (isStressScene(select.value)) {
    selectedScene = select.value;
    void restart();
  }
};
let runner: GPURigidBodyRecoveryRunner | undefined;
let configuration = makeStressScene(selectedScene, 'ordered', Number(timestep.value));
let paused = false;
let busy = false;
let restartRequested = false;
let stopped = false;
let disposed = false;
let states: GPURigidBodyState[] = [];
let samples: {milliseconds: number; result: GPURigidBodyRecoveryResult}[] = [];
let device: Awaited<ReturnType<typeof luma.createDevice>>;
function fail(error: unknown) {
  stopped = true;
  document.querySelector('#error')!.textContent = String(error);
}
async function restart() {
  if (disposed) return;
  if (busy) {
    restartRequested = true;
    return;
  }
  restartRequested = false;
  busy = true;
  exportButton.disabled = true;
  reset.disabled = select.disabled = solver.disabled = timestep.disabled = true;
  let replacement: GPURigidBodyRecoveryRunner | undefined;
  const nextScene = selectedScene;
  try {
    const nextConfiguration = makeStressScene(
      nextScene,
      solver.value === 'parallel' ? 'parallel' : 'ordered',
      Number(timestep.value)
    );
    status.value = 'Compiling…';
    replacement = await GPURigidBodyRecoveryRunner.create(device, nextConfiguration.props, {
      maximumReplayTicks: 240
    });
    if (disposed) return;
    const nextStates = await replacement.world.readState();
    if (disposed) return;
    // Publish poses and their authored bodies together, after all asynchronous work.
    runner?.destroy();
    runner = replacement;
    replacement = undefined;
    configuration = nextConfiguration;
    activeScene = nextScene;
    diagnostics.clear();
    states = nextStates;
    samples = [];
    stopped = false;
    status.value = `READY · tick 0/240 · ${states.length} bodies${paused ? '\nPaused · Resume to advance' : ''}`;
    document.querySelector('#error')!.textContent = '';
    document.querySelector('#description')!.textContent = configuration.description;
  } catch (error) {
    fail(error);
  } finally {
    replacement?.destroy();
    busy = false;
    exportButton.disabled = false;
    reset.disabled = select.disabled = solver.disabled = timestep.disabled = false;
    if (disposed) {
      runner?.destroy();
      device.destroy();
    } else if (restartRequested) {
      void restart();
    }
  }
}
reset.onclick = restart;
solver.onchange = restart;
timestep.onchange = restart;
pause.onclick = () => {
  paused = !paused;
  pause.textContent = paused ? 'Resume' : 'Pause';
};
exportButton.onclick = () => {
  if (!runner) return;
  const report = {
    version: 1,
    scene: activeScene,
    adapter: device.info,
    configuration: configuration.props,
    capacity: runner.world.getCapacityInfo(),
    samples,
    finalState: states,
    notes: [
      'Wall time includes completion/readback; recovery includes compilation/replay.',
      'Diagnostic visualization reads poses on the CPU. Not a GPU-only rendering benchmark.',
      'A completed run does not qualify general shape, mass-ratio or CCD support.'
    ]
  };
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(report, null, 2)], {type: 'application/json'})
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = `physics-${activeScene}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
function draw() {
  const ratio = window.devicePixelRatio;
  const width = Math.round(canvas.clientWidth * ratio),
    height = Math.round(canvas.clientHeight * ratio);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  context.clearRect(0, 0, width, height);
  const minimumHeight =
    activeScene === 'ballistic' ? Math.min(0, (states[0]?.position[2] ?? 0) - 1) : 0;
  const scale = Math.min(width / 19, height / (12 - minimumHeight));
  const origin = [width * 0.55, height * 0.85 + minimumHeight * scale];
  context.strokeStyle = '#344452';
  context.lineWidth = ratio;
  for (let level = 0; level <= 9; level++) {
    context.beginPath();
    context.moveTo(0, origin[1] - level * scale);
    context.lineTo(width, origin[1] - level * scale);
    context.stroke();
  }
  for (const [index, state] of states.entries()) {
    const body = configuration.props.bodies[index],
      shape = body.shape;
    context.fillStyle = body.mode === 'static' ? '#576675' : state.sleeping ? '#8b9b9f' : '#64c9dd';
    context.save();
    context.translate(origin[0] + state.position[0] * scale, origin[1] - state.position[2] * scale);
    // Front diagnostic projection; boxes use their authored extents, not a 3D silhouette.
    if (shape?.type === 'sphere') {
      context.beginPath();
      context.arc(0, 0, shape.radius * scale, 0, 2 * Math.PI);
      context.fill();
    } else if (shape?.type === 'box')
      context.fillRect(
        -shape.halfExtents[0] * scale,
        -shape.halfExtents[2] * scale,
        2 * shape.halfExtents[0] * scale,
        2 * shape.halfExtents[2] * scale
      );
    context.restore();
  }
  if (activeScene === 'ballistic' && runner) {
    const time = runner.tick * runner.world.timeStep;
    context.strokeStyle = '#ffcd78';
    context.lineWidth = 2 * ratio;
    context.beginPath();
    context.arc(
      origin[0] + (-3 + 2 * time) * scale,
      origin[1] - (8 - 5 * time * time) * scale,
      0.3 * scale,
      0,
      2 * Math.PI
    );
    context.stroke();
  }
}
async function advance() {
  if (!runner || busy || paused || stopped || disposed) return;
  busy = true;
  exportButton.disabled = true;
  try {
    const start = performance.now();
    const result = await runner.advance();
    const milliseconds = performance.now() - start;
    if (disposed) return;
    samples.push({milliseconds, result});
    if (runner.encoding) diagnostics.record(runner.graph, runner.encoding);
    states = await runner.world.readState();
    const sorted = samples
      .map(sample => sample.milliseconds)
      .sort((first, second) => first - second);
    const capacity = runner.world.getCapacityInfo();
    const time = runner.tick * runner.world.timeStep;
    const error =
      activeScene === 'ballistic'
        ? `\nVertical error: ${Math.abs(states[0].position[2] - (8 - 5 * time * time)).toFixed(5)}`
        : '';
    status.value = `${result.accepted ? 'ACCEPTED' : 'REJECTED'} · tick ${runner.tick}/240 · ${time.toFixed(2)} s\nRetries: ${samples.reduce((total, sample) => total + sample.result.retries, 0)} · replayed: ${samples.reduce((total, sample) => total + sample.result.replayedTicks, 0)} ticks\nPairs: ${capacity.maximumPairs} · buffers: ${(capacity.ownedBufferBytes / 1048576).toFixed(2)} MiB\nNodes: ${runner.graph.stats.nodeOrder.length} · peak candidates: ${result.diagnostics.maximumCandidatePairs}\nCompletion p50: ${sorted[Math.floor((sorted.length - 1) * 0.5)].toFixed(2)} ms\nCompletion p95: ${sorted[Math.floor((sorted.length - 1) * 0.95)].toFixed(2)} ms${error}`;
    stopped = !result.accepted || runner.tick === 240;
  } catch (error) {
    fail(error);
  } finally {
    busy = false;
    exportButton.disabled = false;
    reset.disabled = select.disabled = solver.disabled = timestep.disabled = false;
    if (disposed) {
      runner?.destroy();
      device.destroy();
    } else if (restartRequested) {
      void restart();
    }
  }
}
try {
  device = await luma.createDevice({adapters: [webgpuAdapter], onError: fail});
  await restart();
  function frame() {
    if (disposed) return;
    panel.update();
    draw();
    void advance();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  window.addEventListener(
    'pagehide',
    () => {
      disposed = true;
      panel.destroy();
      if (!busy) {
        runner?.destroy();
        device.destroy();
      }
    },
    {once: true}
  );
} catch (error) {
  fail(error);
}
