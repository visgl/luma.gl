// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {luma} from '@luma.gl/core';
import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {
  GPURigidBodyRecoveryRunner,
  type GPURigidBodyRecoveryResult,
  type GPURigidBodyState
} from '@luma.gl/gpu-graph/gpu-physics';
import {drawStressShape} from './draw-shape';
import {GPUGraphDiagnostics} from '../../gpu-graph-diagnostics';
import {createRigidBodyPanel} from '../gpu-rigid-body-world/info-box';
import {
  makeStressScene,
  getStressStepCount,
  isStressScene,
  STRESS_SCENES,
  type StressScene
} from './scenes';

const canvas = document.querySelector<HTMLCanvasElement>('#world')!;
const context = canvas.getContext('2d')!;
const select = document.querySelector<HTMLSelectElement>('#scene')!;
const solver = document.querySelector<HTMLSelectElement>('#solver')!;
const pairWork = document.querySelector<HTMLSelectElement>('#pair-work')!;
const runLimit = document.querySelector<HTMLSelectElement>('#run-limit')!;
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
const requestedScene = new URLSearchParams(location.search).get('scene') ?? '';
let selectedScene: StressScene = isStressScene(requestedScene) ? requestedScene : 'capacity';
select.value = selectedScene;
let activeScene: StressScene = selectedScene;
select.onchange = () => {
  if (isStressScene(select.value)) {
    selectedScene = select.value;
    if (selectedScene === 'sparseContacts') solver.value = 'parallel';
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
let stepCount = 0;
let quietSince: number | null = null;
let lastSolverWork: Awaited<ReturnType<GPURigidBodyRecoveryRunner['world']['readSolverWork']>> =
  null;
let trails: number[][][] = [];
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
  reset.disabled =
    select.disabled =
    solver.disabled =
    timestep.disabled =
    runLimit.disabled =
    pairWork.disabled =
      true;
  let replacement: GPURigidBodyRecoveryRunner | undefined;
  const nextScene = selectedScene;
  try {
    const nextConfiguration = makeStressScene(
      nextScene,
      solver.value === 'parallel' ? 'parallel' : 'ordered',
      Number(timestep.value)
    );
    nextConfiguration.props.compactContacts = pairWork.value === 'compact';
    const nextStepCount = getStressStepCount(
      nextConfiguration.props.timeStep!,
      Number(runLimit.value)
    );
    status.value = 'Compiling…';
    replacement = await GPURigidBodyRecoveryRunner.create(device, nextConfiguration.props, {
      maximumReplayTicks: nextStepCount
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
    stepCount = nextStepCount;
    lastSolverWork = null;
    diagnostics.clear();
    states = nextStates;
    samples = [];
    trails = [];
    quietSince = null;
    stopped = false;
    delete status.dataset.accepted;
    status.value = `READY · tick 0/${stepCount} · ${states.length} bodies${paused ? '\nPaused · Resume to advance' : ''}`;
    document.querySelector('#error')!.textContent = '';
    document.querySelector('#description')!.textContent = configuration.description;
  } catch (error) {
    fail(error);
  } finally {
    replacement?.destroy();
    busy = false;
    exportButton.disabled = false;
    reset.disabled =
      select.disabled =
      solver.disabled =
      timestep.disabled =
      runLimit.disabled =
      pairWork.disabled =
        false;
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
runLimit.onchange = restart;
pairWork.onchange = restart;
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
    solverWork: lastSolverWork,
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
  const depthFactor = activeScene === 'geometryOpenings' || activeScene === 'fastMesh' ? 0.45 : 0;
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
  for (const trail of trails) {
    if (!trail) continue;
    context.strokeStyle = '#dfb46f';
    context.lineWidth = ratio;
    context.beginPath();
    trail.forEach((point, index) => {
      const horizontal = origin[0] + (point[0] + depthFactor * point[1]) * scale,
        vertical = origin[1] - (point[2] + 0.7 * depthFactor * point[1]) * scale;
      if (index === 0) context.moveTo(horizontal, vertical);
      else context.lineTo(horizontal, vertical);
    });
    context.stroke();
  }
  for (const [index, state] of states.entries()) {
    const body = configuration.props.bodies[index],
      shape = body.shape;
    context.fillStyle = body.mode === 'static' ? '#576675' : state.sleeping ? '#8b9b9f' : '#64c9dd';
    context.save();
    const [rotationX, rotationY, rotationZ, rotationScalar] = state.orientation;
    const offset = body.centerOfMass ?? [0, 0, 0];
    const doubledCross = [
      2 * (rotationY * offset[2] - rotationZ * offset[1]),
      2 * (rotationZ * offset[0] - rotationX * offset[2]),
      2 * (rotationX * offset[1] - rotationY * offset[0])
    ];
    const offsetX =
      offset[0] +
      rotationScalar * doubledCross[0] +
      rotationY * doubledCross[2] -
      rotationZ * doubledCross[1];
    const offsetY =
      offset[1] +
      rotationScalar * doubledCross[1] +
      rotationZ * doubledCross[0] -
      rotationX * doubledCross[2];
    const offsetZ =
      offset[2] +
      rotationScalar * doubledCross[2] +
      rotationX * doubledCross[1] -
      rotationY * doubledCross[0];
    context.translate(
      origin[0] +
        (state.position[0] - offsetX + depthFactor * (state.position[1] - offsetY)) * scale,
      origin[1] -
        (state.position[2] - offsetZ + 0.7 * depthFactor * (state.position[1] - offsetY)) * scale
    );
    // Front diagnostic projection; boxes use their authored extents, not a 3D silhouette.
    if (shape?.type === 'sphere') {
      context.beginPath();
      context.arc(0, 0, shape.radius * scale, 0, 2 * Math.PI);
      context.fill();
    } else if (shape?.type === 'box' && depthFactor === 0) {
      const [horizontal, vertical, depth, scalar] = state.orientation;
      context.rotate(
        Math.atan2(
          2 * (scalar * vertical + horizontal * depth),
          1 - 2 * (horizontal * horizontal + vertical * vertical)
        )
      );
      context.fillRect(
        -shape.halfExtents[0] * scale,
        -shape.halfExtents[2] * scale,
        2 * shape.halfExtents[0] * scale,
        2 * shape.halfExtents[2] * scale
      );
    } else if (shape) {
      drawStressShape(context, shape, state.orientation, scale, depthFactor);
    }
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
    if (activeScene.startsWith('fast') || activeScene === 'continuous')
      for (const [index, state] of states.entries()) {
        if (configuration.props.bodies[index].mode === 'static') continue;
        if (!trails[index]) trails[index] = [];
        const trail = trails[index];
        trail.push([...state.position]);
        if (trail.length > 240) trail.shift();
      }
    lastSolverWork = await runner.world.readSolverWork();
    const sorted = samples
      .map(sample => sample.milliseconds)
      .sort((first, second) => first - second);
    const capacity = runner.world.getCapacityInfo();
    const time = runner.tick * runner.world.timeStep;
    status.dataset.accepted = String(result.accepted);
    const error =
      activeScene === 'ballistic'
        ? `\nVertical error: ${Math.abs(states[0].position[2] - (8 - 5 * time * time)).toFixed(5)}`
        : '';
    status.value = `${result.accepted ? 'ACCEPTED' : 'REJECTED'} · tick ${runner.tick}/${stepCount} · ${time.toFixed(2)} s\nRetries: ${samples.reduce((total, sample) => total + sample.result.retries, 0)} · replayed: ${samples.reduce((total, sample) => total + sample.result.replayedTicks, 0)} ticks\nPairs: ${capacity.maximumPairs} · buffers: ${(capacity.ownedBufferBytes / 1048576).toFixed(2)} MiB\nNodes: ${runner.graph.stats.nodeOrder.length} · peak candidates: ${result.diagnostics.maximumCandidatePairs}\nIncomplete CCD bodies: ${result.diagnostics.incompleteContinuousBodies}\nCompletion p50: ${sorted[Math.floor((sorted.length - 1) * 0.5)].toFixed(2)} ms\nCompletion p95: ${sorted[Math.floor((sorted.length - 1) * 0.95)].toFixed(2)} ms${lastSolverWork ? `\nPair workgroups/iteration: ${lastSolverWork.pairWorkgroups} / ${Math.ceil(capacity.maximumPairs / 64)} capacity${lastSolverWork.compacted ? ` · ${lastSolverWork.activeContacts} contacts` : ' · scan'}` : ''}${error}`;
    const quiet = states.every((state, index) => {
      const body = configuration.props.bodies[index];
      return (
        body.mode === 'static' ||
        (body.mass === 0 && body.mode !== 'dynamic') ||
        (Math.hypot(...state.velocity) < 0.04 && Math.hypot(...state.angularVelocity) < 0.04)
      );
    });
    quietSince = quiet ? (quietSince ?? time) : null;
    const settled = time >= 30 && quietSince !== null && time - quietSince >= 2;
    stopped = !result.accepted || settled || runner.tick >= stepCount;
    if (settled) status.value += '\nSettled · Reset to replay';
    else if (runner.tick >= stepCount)
      status.value += '\nRun limit reached · increase limit or Reset to replay';
  } catch (error) {
    fail(error);
  } finally {
    busy = false;
    exportButton.disabled = false;
    reset.disabled =
      select.disabled =
      solver.disabled =
      timestep.disabled =
      runLimit.disabled =
      pairWork.disabled =
        false;
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
