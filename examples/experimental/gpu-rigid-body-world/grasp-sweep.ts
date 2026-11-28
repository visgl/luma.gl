// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {GPUCommandGraph} from '@luma.gl/graph/gpu-core';
import {DESTINATION_ANGLE, GRIPPER_PHASES, REACH, makeGripperTrial} from './gripper';

const stepsPerPhase = 180;
const stepsPerSubmission = 4;
const stepsPerTrial = GRIPPER_PHASES.length * stepsPerPhase;

export function enableGraspSweep(device: Device, root: HTMLElement) {
  const button = root.querySelector<HTMLButtonElement>('button')!;
  const status = root.querySelector<HTMLOutputElement>('output')!;
  const results = root.querySelector<HTMLElement>('.results')!;
  button.disabled = false;
  button.onclick = () => {
    button.disabled = true;
    results.replaceChildren();
    void runGraspSweep(device, status, results)
      .catch(error => {
        status.value = String(error);
      })
      .finally(() => {
        button.disabled = false;
      });
  };
}

async function runGraspSweep(device: Device, status: HTMLOutputElement, results: HTMLElement) {
  const definition = new GPUCommandGraph(device);
  const trials: {
    trial: ReturnType<typeof makeGripperTrial>;
    cell: HTMLTableCellElement;
    link: HTMLAnchorElement;
    heights: number[];
  }[] = [];
  try {
    for (const torque of [8, 32]) {
      const table = document.createElement('table');
      table.createCaption().textContent = `Grip cap ${torque} N·m`;
      const header = table.createTHead().insertRow();
      for (const text of ['Mass / μ', '0', '0.35', '0.9']) {
        const cell = document.createElement('th');
        cell.textContent = text;
        header.append(cell);
      }
      results.append(table);
      for (const mass of [0.5, 1, 3]) {
        const row = table.insertRow();
        const label = document.createElement('th');
        label.scope = 'row';
        label.textContent = mass + ' kg';
        row.append(label);
        for (const friction of [0, 0.35, 0.9]) {
          const cell = row.insertCell();
          const link = document.createElement('a');
          link.href =
            './gripper.html?' +
            new URLSearchParams({
              replay: '1',
              mass: String(mass),
              torque: String(torque),
              friction: String(friction)
            });
          link.title = 'Open this trial in 3D';
          link.textContent = 'Ready';
          cell.append(link);
          const trial = makeGripperTrial(true, friction, false, {
            id: 'grasp-' + trials.length,
            mass,
            torque
          });
          trials.push({trial, cell, link, heights: []});
          trial.world.addToGraph(definition);
        }
      }
    }
    status.value = 'Compiling GPU trials…';
    const graph = await definition.compileAsync();
    try {
      let elapsed = 0;
      for (let phase = 0; phase < GRIPPER_PHASES.length; phase++) {
        status.value = `${GRIPPER_PHASES[phase]} · ${trials.length} trials`;
        for (let step = 0; step < stepsPerPhase; step += stepsPerSubmission) {
          const start = performance.now();
          if (step <= 120) for (const {trial} of trials) trial.command(phase, step);
          const encoder = device.createCommandEncoder();
          for (let substep = 0; substep < stepsPerSubmission; substep++)
            graph.encode(encoder, {parameters: undefined});
          device.submit(encoder.finish());
          const fence = device.createFence();
          try {
            await fence.signaled;
          } finally {
            fence.destroy();
          }
          elapsed += performance.now() - start;
        }
        await Promise.all(
          trials.map(async entry => {
            const positions = await entry.trial.positions();
            const [x, y, height] = positions[4];
            entry.heights.push(height);
            if (phase < GRIPPER_PHASES.length - 1) {
              entry.link.textContent = height.toFixed(2) + ' m';
              return;
            }
            const diagnostics = await entry.trial.world.readSimulationDiagnostics();
            const distance = Math.hypot(
              x - REACH * Math.cos(DESTINATION_ANGLE),
              y - REACH * Math.sin(DESTINATION_ANGLE)
            );
            let result = 'placed';
            let label = 'Placed';
            if (
              !diagnostics.complete ||
              diagnostics.steps !== stepsPerTrial ||
              ![...entry.heights, distance].every(Number.isFinite)
            ) {
              result = 'incomplete';
              label = 'Incomplete';
            } else if (
              entry.heights[2] <= 0.58 ||
              entry.heights[3] <= 0.58 ||
              distance >= 0.25 ||
              Math.abs(height - 0.24) >= 0.06
            ) {
              result = 'missed';
              label = 'Missed bay';
              if (entry.heights[2] <= 0.58) label = 'No lift';
              else if (entry.heights[3] <= 0.58) label = 'Lost in carry';
            }
            entry.cell.dataset.result = result;
            entry.link.textContent = label;
            entry.link.title = `Lift ${entry.heights[2].toFixed(2)} m · Landing error ${distance.toFixed(2)} m · Open in 3D`;
          })
        );
      }
      status.value = `Completed · ${Math.round((trials.length * stepsPerTrial * 1000) / elapsed).toLocaleString()} world-steps/s`;
    } finally {
      graph.destroy();
    }
  } finally {
    for (const {trial} of trials) trial.world.destroy();
  }
}
