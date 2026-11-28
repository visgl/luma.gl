// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {luma} from '@luma.gl/core';
import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {GPUCommandGraph} from '@luma.gl/graph/gpu-core';
import {GPUArticulationTree, GPURigidBodyWorld} from '@luma.gl/graph/gpu-physics';
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
const torque = numericSetting('torque', 32, 1, 64);
// Keep explicit trial links reproducible, including loads outside the usual practice range.
let mass = numericSetting('mass', torque < 16 ? 0.5 : 1, 0.25, 4);
const maximumBlockMass = Math.max(torque < 16 ? 0.75 : 3, mass);
const slider = document.querySelector<HTMLInputElement>('#block-mass');
const weight = document.querySelector<HTMLOutputElement>('#block-weight');
if (slider && weight) {
  slider.max = String(maximumBlockMass);
  slider.value = String(mass);
  weight.value = mass + ' kg';
}
const scenario = document.querySelector<HTMLSelectElement>('#grasp-scenario');
const binChoice = query.get('bin');
const targetChoice = ['left', 'center', 'right', 'obstructed', 'drop'].indexOf(binChoice ?? '');
const bin =
  targetChoice >= 0
    ? {
        target: targetChoice >= 3 ? 1 : targetChoice,
        obstructed: targetChoice === 3,
        drop: targetChoice === 4
      }
    : undefined;
if (scenario) {
  scenario.value = binChoice ?? 'single';
  scenario.onchange = () => {
    const url = new URL(location.href);
    url.searchParams.set('bin', scenario.value);
    location.href = url.href;
  };
}
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
  async function createSimulation() {
    const pick = gripper
      ? makeGripperTrial(reduced, friction, true, {
          mass,
          torque,
          bin,
          // Allow a low-force grip to carry the load without high lateral acceleration.
          carrySteps: !bin && torque < 16 && !query.has('replay') ? 360 : undefined
        })
      : undefined;
    const {world, bodies} = (pick ?? trial)!;
    const definition = new GPUCommandGraph(device);
    if (pick) pick.addToGraph(definition);
    else world.addToGraph(definition);
    const graph = await definition.compileAsync();
    const scene = new RobotArmScene(
      device,
      {poseMatrices: world.poseMatrices, count: reduced ? (bin ? 4 : 5) : bodies.length},
      reduced ? bodies : undefined,
      gripper,
      pick?.workcell,
      pick?.binWorld?.poseMatrices
    );
    const checkpointWorld = pick && (world instanceof GPURigidBodyWorld ? world : pick.binWorld);
    const checkpoint = checkpointWorld?.createGPUCheckpoint();
    checkpoint?.save();
    return {pick, world, graph, scene, checkpoint};
  }
  let {pick, world, graph, scene, checkpoint} = await createSimulation();
  const camera = new PerspectiveCamera(42, 1, 0.1, 200);
  camera.up.set(0, 0, 1);
  camera.position.fromArray(gripper ? [3.4, -3.6, 2.9] : [5, -8, 5]);
  const controls = new OrbitControls(camera, canvas);
  controls.target.fromArray(gripper ? [0.75, 0.45, 0.65] : [1.8, 0, 1.5]);
  controls.update();
  let phase = 0,
    phaseSteps = 0,
    cycling = false;
  const phaseNames = pick?.phaseNames ?? GRIPPER_PHASES;
  const selectPhase = (index: number) => {
    phase = index;
    phaseSteps = 0;
    pick?.command(index);
    const label = document.querySelector<HTMLOutputElement>('#phase');
    if (label) label.value = phaseNames[index];
  };
  let resetRequested = false;
  let requestedMass = mass;
  const cycle = document.querySelector<HTMLButtonElement>('#cycle');
  if (pick && cycle && slider && weight) {
    enableGraspSweep(device, document.querySelector<HTMLElement>('#grasp-sweep')!);
    cycle.onclick = () => {
      resetRequested = true;
      cycling = !cycling;
      cycle.textContent = cycling ? 'Stop cycle' : 'Run cycle';
    };
    slider.disabled = false;
    cycle.disabled = false;
    slider.oninput = () => {
      weight.value = slider.value + ' kg';
    };
    slider.onchange = () => {
      requestedMass = slider.valueAsNumber;
      const url = new URL(location.href);
      url.searchParams.set('mass', slider.value);
      history.replaceState(null, '', url);
      resetRequested = true;
      cycling = false;
      cycle.textContent = 'Run cycle';
    };
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
    if (resetRequested) {
      resetRequested = false;
      if (mass !== requestedMass) {
        mass = requestedMass;
        const previous = {pick, world, graph, scene};
        ({pick, world, graph, scene, checkpoint} = await createSimulation());
        previous.scene.destroy();
        previous.graph.destroy();
        previous.world.destroy();
        previous.pick?.binWorld?.destroy();
      } else {
        checkpoint?.restore();
        if (world instanceof GPUArticulationTree) world.reset();
      }
      selectPhase(0);
      last = now;
      accumulator = world.timeStep;
      lastReading = -Infinity;
    }
    accumulator = Math.min(accumulator + (now - last) / 1000, 4 * world.timeStep);
    last = now;
    if (cycling && pick && phaseSteps >= pick.travelSteps(phase) + 60) {
      if (phase < phaseNames.length - 1) selectPhase(phase + 1);
      else {
        cycling = false;
        if (cycle) cycle.textContent = 'Run again';
      }
    }
    while (accumulator >= world.timeStep) {
      if (pick && phaseSteps <= pick.travelSteps(phase) && phaseSteps % 4 === 0)
        pick.command(phase, phaseSteps);
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
      output.value = `Payload ${mass} kg · Grip cap ${torque} N·m · height ${positions[4 + (bin?.target ?? 0)][2].toFixed(3)} m`;
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
