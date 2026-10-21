// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {luma} from '@luma.gl/core';
import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {GPURigidBodyWorld, type GPURigidBodyQueryHit} from '@luma.gl/gpgpu/gpu-physics';
import {GPUGraphDiagnostics} from '../../gpu-graph-diagnostics';
import {createSalvagePanel} from './info-box';
import {CARGO_IDS, DOCK, makeSalvageScene} from './scene';
import {makeSalvageRenderer} from './renderer';
import {createCollisionFeedback} from './feedback';

const canvas = document.querySelector<HTMLCanvasElement>('#world')!;
const status = document.querySelector<HTMLOutputElement>('#status')!;
const targetLabel = document.querySelector<HTMLElement>('#target')!;
const overlay = document.querySelector<HTMLElement>('#restart-overlay')!;
const keys = new Set<string>();
const feedback = createCollisionFeedback();
const diagnostics = new GPUGraphDiagnostics({traceTitle: 'GPU Graph Timeline'});
const panel = createSalvagePanel(diagnostics);
let aim: [number, number, number] = [0, 0, 0];
let beamHeld = false;
let resetRequested = false;
let paused = false;
let alive = true;
let animation = 0;
let extentX = 22;
let extentY = 14;
const releaseControls = () => {
  keys.clear();
  beamHeld = false;
};
window.addEventListener('blur', releaseControls);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) releaseControls();
});
window.addEventListener('keydown', event => {
  feedback.unlock();
  if (
    [
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'Space',
      'KeyW',
      'KeyA',
      'KeyS',
      'KeyD'
    ].includes(event.code)
  ) {
    event.preventDefault();
    keys.add(event.code);
  }
  if (event.code === 'KeyR') resetRequested = true;
});
window.addEventListener('keyup', event => keys.delete(event.code));
canvas.addEventListener('pointermove', event => {
  const bounds = canvas.getBoundingClientRect();
  aim = [
    (((event.clientX - bounds.left) / bounds.width) * 2 - 1) * extentX,
    (1 - ((event.clientY - bounds.top) / bounds.height) * 2) * extentY,
    0
  ];
});
canvas.addEventListener('pointerdown', event => {
  feedback.unlock();
  canvas.focus();
  canvas.setPointerCapture(event.pointerId);
  const bounds = canvas.getBoundingClientRect();
  aim = [
    (((event.clientX - bounds.left) / bounds.width) * 2 - 1) * extentX,
    (1 - ((event.clientY - bounds.top) / bounds.height) * 2) * extentY,
    0
  ];
  beamHeld = true;
});
canvas.addEventListener('pointerup', () => {
  beamHeld = false;
});
canvas.addEventListener('pointercancel', () => {
  beamHeld = false;
});
for (const button of document.querySelectorAll<HTMLButtonElement>('[data-key]')) {
  button.onpointerdown = event => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    keys.add(button.dataset.key!);
  };
  button.onpointerup = button.onpointercancel = () => keys.delete(button.dataset.key!);
}
document.querySelector<HTMLButtonElement>('#sound')!.onclick = event => {
  (event.currentTarget as HTMLButtonElement).textContent = feedback.toggleSound()
    ? 'Sound on'
    : 'Sound off';
};
document.querySelector<HTMLButtonElement>('#reset')!.onclick = () => {
  resetRequested = true;
};
document.querySelector<HTMLButtonElement>('#play-again')!.onclick = () => {
  resetRequested = true;
};
document.querySelector<HTMLButtonElement>('#pause')!.onclick = event => {
  paused = !paused;
  releaseControls();
  (event.currentTarget as HTMLButtonElement).textContent = paused ? 'Resume' : 'Pause';
};

try {
  let deviceError: Error | null = null;
  const device = await luma.createDevice({
    adapters: [webgpuAdapter],
    optionalFeatures: ['timestamp-query'],
    createCanvasContext: {canvas, autoResize: true},
    onError: error => {
      deviceError = error;
    }
  });
  async function createMission() {
    const bodies = makeSalvageScene();
    const world = new GPURigidBodyWorld({
      bodies: [
        ...bodies,
        {
          position: DOCK,
          mode: 'static',
          colliders: [{shape: {type: 'sphere', radius: 2}, isTrigger: true}]
        }
      ],
      failurePolicy: 'rollback',
      continuous: {bodies: [0]},
      triggers: [{colliders: [bodies.length], targets: CARGO_IDS}],
      gravity: [0, 0, 0],
      timeStep: 1 / 120,
      iterations: 24,
      solver: 'parallel',
      broadPhase: 'hierarchical-grid',
      eventCapacity: 1024,
      impactImpulseThreshold: 2,
      enableQueries: true,
      sleepAfter: 0
    });
    const definition = new GPUCommandGraph(device);
    world.addToGraph(definition);
    const graph = await definition.compileAsync();
    const renderer = makeSalvageRenderer(device, world, bodies);
    return {world, graph, renderer, states: await world.readState()};
  }
  let mission = await createMission();
  let recovered = new Set<number>();
  let hull = 100;
  let simulationTime = 0;
  let eventCount = 0;
  let queryCount = 0;
  let previous = performance.now();
  let accumulator = 0;
  let lastSample = 0;
  let selected: GPURigidBodyQueryHit | undefined;
  let finished = false;
  let frameInProgress = false;
  let disposed = false;
  const destroyMission = () => {
    mission.renderer.destroy();
    mission.graph.destroy();
    mission.world.destroy();
  };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    destroyMission();
    panel.destroy();
    feedback.destroy();
    device.destroy();
  };
  const endMission = (success: boolean) => {
    finished = true;
    beamHeld = false;
    overlay.hidden = false;
    document.querySelector('#result')!.textContent = success ? 'Cargo secured.' : 'Ship disabled.';
    document.querySelector('#result-detail')!.textContent = success
      ? `All five pods recovered in ${simulationTime.toFixed(1)} simulated seconds.`
      : 'Take it slower. Brake before impact and tow cargo gently.';
  };
  async function frame(now: number) {
    if (!alive) return;
    frameInProgress = true;
    try {
      if (deviceError) throw deviceError;
      if (resetRequested) {
        feedback.clear();
        destroyMission();
        diagnostics.clear();
        mission = await createMission();
        recovered = new Set();
        hull = 100;
        simulationTime = eventCount = queryCount = 0;
        selected = undefined;
        finished = false;
        paused = false;
        overlay.hidden = true;
        resetRequested = false;
        accumulator = 0;
        lastSample = 0;
        releaseControls();
        document.querySelector('#pause')!.textContent = 'Pause';
        previous = performance.now();
      }
      const elapsed = Math.min(0.05, Math.max(0, (now - previous) / 1000));
      previous = now;
      if (!paused && !finished && !document.hidden) {
        accumulator = Math.min(accumulator + elapsed, 4 / 120);
        const steps = Math.floor(accumulator * 120);
        const duration = steps / 120;
        const ship = mission.states[0];
        if (steps) {
          const horizontal =
            Number(keys.has('KeyD') || keys.has('ArrowRight')) -
            Number(keys.has('KeyA') || keys.has('ArrowLeft'));
          const vertical =
            Number(keys.has('KeyW') || keys.has('ArrowUp')) -
            Number(keys.has('KeyS') || keys.has('ArrowDown'));
          const strength = (18 * duration) / Math.max(1, Math.hypot(horizontal, vertical));
          if (horizontal || vertical)
            mission.world.applyImpulse(
              0,
              [horizontal * strength, vertical * strength, 0],
              ship.position
            );
          if (keys.has('Space'))
            mission.world.applyImpulse(
              0,
              [
                -ship.velocity[0] * Math.min(1, duration * 4) * 2,
                -ship.velocity[1] * Math.min(1, duration * 4) * 2,
                0
              ],
              ship.position
            );
          if (
            beamHeld &&
            selected &&
            selected.body > 0 &&
            selected.body < 15 &&
            !recovered.has(selected.body)
          ) {
            const target = mission.states[selected.body];
            const delta = [
              ship.position[0] - target.position[0],
              ship.position[1] - target.position[1]
            ];
            const distance = Math.hypot(...delta);
            // The ray query bounds surface distance; large targets can have centers beyond it.
            if (distance > 1.5) {
              const impulse = Math.min(10, distance * 2) * duration;
              mission.world.applyImpulse(
                selected.body,
                [(delta[0] / distance) * impulse, (delta[1] / distance) * impulse, 0],
                target.position
              );
              mission.world.applyImpulse(
                0,
                [(-delta[0] / distance) * impulse * 0.2, (-delta[1] / distance) * impulse * 0.2, 0],
                ship.position
              );
            }
          }
          const encoder = device.createCommandEncoder();
          for (let step = 0; step < steps; step++)
            diagnostics.encode(mission.graph, encoder, {parameters: undefined});
          device.submit(encoder.finish());
          accumulator -= duration;
          simulationTime += duration;
        }
        if (now - lastSample > 100) {
          lastSample = now;
          const [states, events, triggers] = await Promise.all([
            mission.world.readState(),
            mission.world.readContactEvents(),
            mission.world.readTriggerEvents()
          ]);
          mission.states = states;
          if (events.dropped || events.saturated || triggers.dropped || triggers.saturated)
            throw new Error('Collision event capacity exhausted. Restart the mission.');
          eventCount += events.events.length;
          for (const event of events.events) {
            feedback.impact(event, extentX, extentY);
            if (event.phase !== 'end' && event.bodies.includes(0) && event.normalImpulse > 3) {
              hull = Math.max(0, hull - (event.normalImpulse - 3) * 1.2);
            }
          }
          if (hull <= 0) endMission(false);
          const position = mission.states[0].position;
          const direction: [number, number, number] = [
            aim[0] - position[0],
            aim[1] - position[1],
            0
          ];
          selected =
            Math.hypot(...direction) > 0.001
              ? (
                  await mission.world.raycast({
                    origin: position,
                    direction,
                    maximumDistance: 12,
                    excludeBody: 0,
                    colliderIndices: Array.from(
                      {length: mission.world.colliderCount - 1},
                      (_, index) => index
                    )
                  })
                ).hits[0]
              : undefined;
          queryCount++;
          for (const hit of triggers.events) {
            if (hit.phase !== 'enter' || recovered.has(hit.body)) continue;
            recovered.add(hit.body);
            if (selected?.body === hit.body) selected = undefined;
            // Docked bodies are parked outside the arena; invalidate cached contacts after direct writes.
            mission.world.positions!.write(
              new Float32Array([100 + hit.body * 4, 100, 0]),
              hit.body * 16
            );
            mission.world.velocities!.write(new Float32Array([0, 0, 0]), hit.body * 16);
            mission.world.angularVelocities!.write(new Float32Array([0, 0, 0]), hit.body * 16);
            mission.world.wake();
          }
          const diagnosticsSnapshot = await mission.world.readSimulationDiagnostics();
          if (!diagnosticsSnapshot.complete)
            throw new Error('Incomplete GPU physics step. Restart the mission.');
          if (recovered.size === CARGO_IDS.length && !finished) endMission(true);
        }
      }
      const ship = mission.states[0];
      const beam = beamHeld && selected && !paused && !finished ? selected.point : null;
      ({extentX, extentY} = mission.renderer.draw(
        now / 1000,
        canvas.clientWidth / canvas.clientHeight,
        ship.position,
        aim,
        beam
      ));
      const fence = device.createFence();
      try {
        await fence.signaled;
      } finally {
        fence.destroy();
      }
      document.querySelector('#cargo-count')!.textContent =
        `${recovered.size} / ${CARGO_IDS.length}`;
      document.querySelector<HTMLElement>('#hull')!.textContent = `HULL ${Math.ceil(hull)}%`;
      document.querySelector('#navigation')!.textContent =
        `NAV ${ship.position[0].toFixed(1)} / ${ship.position[1].toFixed(1)}`;
      targetLabel.textContent = selected
        ? `${selected.body <= 5 ? 'CARGO POD' : selected.body < 15 ? 'DEBRIS' : 'BOUNDARY'} · ${selected.distance.toFixed(1)} m${beam ? ' · TRACTOR ACTIVE' : ''}`
        : 'SCANNER · NO TARGET';
      status.value = `${simulationTime.toFixed(1)} s simulated · ${mission.graph.stats.nodeOrder.length} graph nodes\n${eventCount} contact events · ${queryCount} GPU queries\n${Math.hypot(...ship.velocity).toFixed(1)} m/s · ${paused ? 'paused' : 'running'}`;
      panel.update();
      animation = requestAnimationFrame(time => {
        void frame(time);
      });
    } catch (error) {
      document.querySelector('#startup-error')!.textContent =
        error instanceof Error ? (error.stack ?? error.message) : String(error);
      releaseControls();
      paused = true;
      const waitForReset = (time: number) => {
        if (!alive) return;
        if (resetRequested && !deviceError) {
          document.querySelector('#startup-error')!.textContent = '';
          void frame(time);
        } else {
          animation = requestAnimationFrame(waitForReset);
        }
      };
      animation = requestAnimationFrame(waitForReset);
    } finally {
      frameInProgress = false;
      if (!alive) dispose();
    }
  }
  animation = requestAnimationFrame(time => {
    void frame(time);
  });
  window.addEventListener(
    'pagehide',
    () => {
      alive = false;
      cancelAnimationFrame(animation);
      releaseControls();
      if (!frameInProgress) dispose();
    },
    {once: true}
  );
} catch (error) {
  document.querySelector('#startup-error')!.textContent =
    error instanceof Error ? (error.stack ?? error.message) : String(error);
}
