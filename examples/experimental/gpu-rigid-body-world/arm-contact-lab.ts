// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {luma} from '@luma.gl/core';
import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {GPUCommandGraph} from '@luma.gl/graph/gpu-core';
import {Matrix4} from '@math.gl/core/matrix';
import {PerspectiveCamera} from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GPUGraphDiagnostics} from '../../gpu-graph-diagnostics';
import {createRigidBodyPanel} from './info-box';
import {makeArmContactTrial} from './robot-arm-contact';
import {makeGripperTrial, GRIPPER_PHASES} from './gripper';
import {enableGraspSweep} from './grasp-sweep';
import {RobotArmScene} from './robot-arm-scene';

const gripper = document.body.dataset.lab === 'gripper';
const query = new URLSearchParams(location.search);
function numericSetting(name: string, fallback: number, minimum: number, maximum: number) {
  const raw = query.get(name);
  const value = raw === null ? fallback : Number(raw);
  return Number.isFinite(value) && value >= minimum && value <= maximum ? value : fallback;
}
const friction = numericSetting('friction', 0.9, 0, 1);
const mass = numericSetting('mass', 1, 0.25, 4);
const torque = numericSetting('torque', 32, 1, 64);
const backend = document.querySelector<HTMLSelectElement>('#backend')!;
const reduced = new URLSearchParams(location.search).get('solver') !== 'ordered';
backend.value = reduced ? 'tree' : 'ordered';
backend.onchange = () => {
  const url = new URL(location.href);
  url.searchParams.set('solver', backend.value);
  location.href = url.href;
};
const output = document.querySelector<HTMLOutputElement>('#reading')!;
const canvas = document.querySelector<HTMLCanvasElement>('#world')!;
const diagnostics = new GPUGraphDiagnostics({traceTitle: 'GPU Graph Timeline'});
const panel = createRigidBodyPanel(
  diagnostics,
  gripper ? 'Pick and place' : 'Robot arm',
  gripper ? 'Two-finger gripper · 120 Hz' : '3 kg work-stop comparison'
);
try {
  const device = await luma.createDevice({
    adapters: [webgpuAdapter],
    type: 'webgpu',
    createCanvasContext: {canvas, autoResize: true}
  });
  const trial = gripper ? undefined : makeArmContactTrial(reduced, true);
  const pick = gripper ? makeGripperTrial(reduced, friction, true, {mass, torque}) : undefined;
  const {world, bodies} = (pick ?? trial)!;
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  const scene = new RobotArmScene(
    device,
    {poseMatrices: world.poseMatrices, count: reduced ? 5 : bodies.length},
    reduced ? bodies : undefined,
    gripper
  );
  const camera = new PerspectiveCamera(42, 1, 0.1, 200);
  camera.up.set(0, 0, 1);
  camera.position.fromArray(gripper ? [3.4, -3.6, 2.9] : [5, -8, 5]);
  const controls = new OrbitControls(camera, canvas);
  controls.target.fromArray(gripper ? [0.75, 0.45, 0.65] : [1.8, 0, 1.5]);
  controls.update();
  let phase = 0,
    phaseSteps = 0,
    cycling = false;
  const selectPhase = (index: number) => {
    phase = index;
    phaseSteps = 0;
    pick?.command(index);
    const label = document.querySelector<HTMLOutputElement>('#phase');
    if (label) label.value = GRIPPER_PHASES[index];
    const advance = document.querySelector<HTMLButtonElement>('#advance');
    if (advance) {
      advance.textContent = index < 5 ? 'Next · ' + GRIPPER_PHASES[index + 1] : 'Complete';
      advance.disabled = index === GRIPPER_PHASES.length - 1;
      document.querySelector<HTMLButtonElement>('#cycle')!.disabled = advance.disabled;
    }
  };
  if (pick) {
    enableGraspSweep(device, document.querySelector<HTMLElement>('#grasp-sweep')!);
    const advance = document.querySelector<HTMLButtonElement>('#advance')!;
    advance.onclick = () => {
      cycling = false;
      selectPhase(Math.min(phase + 1, 5));
    };
    document.querySelector<HTMLButtonElement>('#cycle')!.onclick = () => {
      cycling = true;
    };
    document.querySelector<HTMLButtonElement>('#reset')!.onclick = () => location.reload();
    const grip = document.querySelector<HTMLSelectElement>('#friction')!;
    if (!Array.from(grip.options).some(option => Number(option.value) === friction))
      grip.add(new Option(String(friction), String(friction)));
    grip.value = String(friction);
    grip.onchange = () => {
      const url = new URL(location.href);
      url.searchParams.set('friction', grip.value);
      location.href = url.href;
    };
    selectPhase(0);
  } else if (trial) {
    document.querySelector<HTMLButtonElement>('#press')!.onclick = () => trial.command(true);
    document.querySelector<HTMLButtonElement>('#lift')!.onclick = () => trial.command(false);
    trial.command(true);
  }
  let last = performance.now(),
    accumulator = world.timeStep,
    lastReading = 0;
  const frame = async (now: number) => {
    accumulator = Math.min(accumulator + (now - last) / 1000, 4 * world.timeStep);
    last = now;
    if (cycling && phaseSteps >= 180) {
      if (phase < 5) selectPhase(phase + 1);
      else cycling = false;
    }
    while (accumulator >= world.timeStep) {
      if (pick && phaseSteps <= 120 && phaseSteps % 4 === 0) pick.command(phase, phaseSteps);
      const encoder = device.createCommandEncoder();
      diagnostics.encode(graph, encoder, {parameters: undefined});
      device.submit(encoder.finish());
      accumulator -= world.timeStep;
      phaseSteps++;
    }
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    const projection = new Matrix4([
      1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.5, 0, 0, 0, 0.5, 1
    ]).multiplyRight(camera.projectionMatrix.elements);
    scene.draw(new Matrix4(camera.matrixWorldInverse.elements), projection, [
      camera.position.x,
      camera.position.y,
      camera.position.z
    ]);
    device.submit();
    panel.update();
    if (now - lastReading > 250 && pick) {
      const positions = await pick.positions();
      output.value = `Payload ${mass} kg · Grip cap ${torque} N·m · height ${positions[4][2].toFixed(3)} m`;
      lastReading = now;
    } else if (now - lastReading > 250 && trial) {
      const [height, status] = await Promise.all([
        trial.payloadHeight(),
        world.readSimulationDiagnostics()
      ]);
      if (!status.complete) throw new Error('Physics step failed');
      output.value = `Payload ${height.toFixed(3)} m · Stop clearance ${(height - trial.seatHeight).toFixed(3)} m`;
      if ('normalForce' in status) output.value += ` · ${Number(status.normalForce).toFixed(1)} N`;
      lastReading = now;
    }
    const fence = device.createFence();
    try {
      await fence.signaled;
    } finally {
      fence.destroy();
    }
    requestAnimationFrame(tick);
  };
  const tick = (now: number) => {
    void frame(now).catch(error => {
      output.value = String(error);
    });
  };
  requestAnimationFrame(tick);
} catch (error) {
  output.value = String(error);
}
