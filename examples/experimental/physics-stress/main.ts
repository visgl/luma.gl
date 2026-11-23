// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {luma} from '@luma.gl/core';
import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {
  GPURigidBodyRecoveryRunner,
  type GPURigidBodyRecoveryResult,
  type GPURigidBodyState
} from '@luma.gl/graph/gpu-physics';
import {StressSceneView} from './scene-view';
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
let view: StressSceneView | undefined;
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
let selectedScene: StressScene = isStressScene(requestedScene) ? requestedScene : 'matchedDense';
select.value = selectedScene;
if (selectedScene === 'matchedDense' || selectedScene === 'matchedLoaded') solver.value = 'block';
let activeScene: StressScene = selectedScene;
select.onchange = () => {
  if (isStressScene(select.value)) {
    selectedScene = select.value;
    if (selectedScene === 'sparseContacts' || selectedScene === 'sleepingIslands')
      solver.value = 'parallel';
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
let runGeneration = 0;
let stepCount = 0;
let quietSince: number | null = null;
let lastSolverWork: Awaited<ReturnType<GPURigidBodyRecoveryRunner['world']['readSolverWork']>> =
  null;
let lastContinuousWork: Awaited<
  ReturnType<GPURigidBodyRecoveryRunner['world']['readContinuousWork']>
> = null;
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
  if (nextScene === 'matchedChain') solver.value = 'ordered';
  try {
    const nextConfiguration = makeStressScene(
      nextScene,
      solver.value === 'ordered' ? 'ordered' : 'parallel',
      Number(timestep.value)
    );
    nextConfiguration.props.parallelContactSolver = solver.value === 'block' ? 'block' : 'scalar';
    nextConfiguration.props.publishPoses = true;
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
    view?.setWorld(runner.world, configuration.props, nextScene !== activeScene);
    activeScene = nextScene;
    stepCount = nextStepCount;
    status.dataset.generation = String(++runGeneration);
    status.dataset.scene = activeScene;
    lastSolverWork = null;
    lastContinuousWork = null;
    diagnostics.clear();
    states = nextStates;
    samples = [];
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
    continuousWork: lastContinuousWork,
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
async function advance() {
  if (!runner || busy || paused || stopped || disposed) return;
  busy = true;
  exportButton.disabled = true;
  try {
    const start = performance.now();
    const wakeInterval = Math.round(4 / runner.world.timeStep);
    const wakeIsland =
      activeScene === 'sleepingIslands' && runner.tick > 0 && runner.tick % wakeInterval === 0;
    const result = await runner.advance(
      wakeIsland ? [{type: 'impulse', body: 0, impulse: [0.1, 0, 0]}] : []
    );
    const milliseconds = performance.now() - start;
    if (disposed) return;
    samples.push({milliseconds, result});
    if (runner.encoding) diagnostics.record(runner.graph, runner.encoding);
    view?.updateWorld(runner.world);
    states = await runner.world.readState();
    lastContinuousWork = await runner.world.readContinuousWork();
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
    status.value = `${result.accepted ? 'ACCEPTED' : 'REJECTED'} · tick ${runner.tick}/${stepCount} · ${time.toFixed(2)} s\nRetries: ${samples.reduce((total, sample) => total + sample.result.retries, 0)} · replayed: ${samples.reduce((total, sample) => total + sample.result.replayedTicks, 0)} ticks\nPairs: ${capacity.maximumPairs} · buffers: ${(capacity.ownedBufferBytes / 1048576).toFixed(2)} MiB\nNodes: ${runner.graph.stats.nodeOrder.length} · peak candidates: ${result.diagnostics.maximumCandidatePairs}\nIncomplete CCD bodies: ${result.diagnostics.incompleteContinuousBodies}\nCompletion p50: ${sorted[Math.floor((sorted.length - 1) * 0.5)].toFixed(2)} ms\nCompletion p95: ${sorted[Math.floor((sorted.length - 1) * 0.95)].toFixed(2)} ms${lastSolverWork ? `\nPair workgroups/iteration: ${lastSolverWork.pairWorkgroups} / ${Math.ceil(capacity.maximumPairs / 64)} capacity${lastSolverWork.compacted ? ` · ${lastSolverWork.awakeContacts}/${lastSolverWork.activeContacts} awake contacts · ${lastSolverWork.awakeBodies} awake bodies (${lastSolverWork.bodyWorkgroups} body groups)` : ' · scan'}` : ''}${lastContinuousWork ? `\nSwept queue peak: ${lastContinuousWork.peakCandidates} / ${lastContinuousWork.candidateCapacity} · ${lastContinuousWork.peakCandidateWorkgroups} workgroups · ${lastContinuousWork.impacts} impacts\nSpatial tests peak: ${lastContinuousWork.peakSpatialTests} · ${lastContinuousWork.rounds} rounds` : ''}${error}`;
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
  device = await luma.createDevice({
    adapters: [webgpuAdapter],
    createCanvasContext: {canvas, autoResize: true, useDevicePixels: true},
    onError: fail
  });
  view = new StressSceneView(device, canvas);
  await restart();
  function frame() {
    if (disposed) return;
    panel.update();
    view?.draw();
    void advance();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  window.addEventListener(
    'pagehide',
    () => {
      disposed = true;
      panel.destroy();
      view?.destroy();
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
