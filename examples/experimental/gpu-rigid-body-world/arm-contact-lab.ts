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
import {RobotArmScene} from './robot-arm-scene';

const backend = document.querySelector<HTMLSelectElement>('#backend')!;
const reduced = new URLSearchParams(location.search).get('solver') !== 'ordered';
backend.value = reduced ? 'tree' : 'ordered';
backend.onchange = () => {
  location.search = '?solver=' + backend.value;
};
const output = document.querySelector<HTMLOutputElement>('#reading')!;
const canvas = document.querySelector<HTMLCanvasElement>('#world')!;
const diagnostics = new GPUGraphDiagnostics({traceTitle: 'GPU Graph Timeline'});
const panel = createRigidBodyPanel(diagnostics, 'Robot arm', '3 kg work-stop comparison');
try {
  const device = await luma.createDevice({
    adapters: [webgpuAdapter],
    type: 'webgpu',
    createCanvasContext: {canvas, autoResize: true}
  });
  const trial = makeArmContactTrial(reduced, true);
  const {world} = trial;
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  const scene = new RobotArmScene(
    device,
    {poseMatrices: world.poseMatrices, count: reduced ? 5 : 8},
    reduced ? trial.bodies : undefined
  );
  const camera = new PerspectiveCamera(42, 1, 0.1, 200);
  camera.up.set(0, 0, 1);
  camera.position.set(5, -8, 5);
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(1.8, 0, 1.5);
  controls.update();
  document.querySelector<HTMLButtonElement>('#press')!.onclick = () => trial.command(true);
  document.querySelector<HTMLButtonElement>('#lift')!.onclick = () => trial.command(false);
  trial.command(true);
  let last = performance.now(),
    accumulator = world.timeStep,
    lastReading = 0;
  const frame = async (now: number) => {
    accumulator = Math.min(accumulator + (now - last) / 1000, 4 * world.timeStep);
    last = now;
    const encoder = device.createCommandEncoder();
    while (accumulator >= world.timeStep) {
      diagnostics.encode(graph, encoder, {parameters: undefined});
      accumulator -= world.timeStep;
    }
    device.submit(encoder.finish());
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
    panel.update();
    if (now - lastReading > 250) {
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
