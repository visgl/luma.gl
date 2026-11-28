// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {luma} from '@luma.gl/core';
import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {
  CubeGeometry,
  GroupNode,
  type ScenegraphNode,
  type ScenegraphTransformBinding
} from '@luma.gl/engine';
import {SceneMeshNode, SceneRenderer, type SceneMaterial} from '@luma.gl/anari';
import {GPUCommandGraph} from '@luma.gl/graph/gpu-core';
import {Matrix4} from '@math.gl/core/matrix';
import {PerspectiveCamera} from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GPUGraphDiagnostics} from '../../gpu-graph-diagnostics';
import {createRigidBodyPanel} from './info-box';
import {makeGantry, gantryTargets, GANTRY_STEP} from './gantry';

/** Presentation surface shared by the scene renderer and orbit controls. */
const canvas = document.querySelector<HTMLCanvasElement>('canvas')!;
/** Starts the next stage or resets the finished cycle. */
const cycle = document.querySelector<HTMLButtonElement>('#cycle')!;
/** Withdraws the left support while holding the beam. */
const release = document.querySelector<HTMLButtonElement>('#release')!;
/** Selects the lateral center of mass for the next trial. */
const ballast = document.querySelector<HTMLInputElement>('#ballast')!;
/** Selects the size of the dynamic stock inventory. */
const parts = document.querySelector<HTMLSelectElement>('#parts')!;
/** Displays the selected ballast offset in meters. */
const offset = document.querySelector<HTMLOutputElement>('#offset')!;
/** Reports contact reuse and spatial candidates. */
const reading = document.querySelector<HTMLOutputElement>('#reading')!;
/** Always-visible support forces in newtons. */
const loads = document.querySelector<HTMLOutputElement>('#loads')!;
/** Records the physics graph for the shared inspector and timeline. */
const diagnostics = new GPUGraphDiagnostics({});
/** Dockable controls and diagnostics for the gantry. */
const panel = createRigidBodyPanel(diagnostics, 'Two-arm gantry', 'Shared beam · 120 Hz');
/** Orbit camera using the same vertical axis as the simulation. */
const camera = new PerspectiveCamera(38, 1, 0.1, 80);
camera.up.set(0, 0, 1);
camera.position.set(4.3, 6.1, 4.2);
/** Trackpad and mouse navigation around the workcell. */
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0, 0.43);
controls.update();
/** Maps the camera projection into WebGPU clip depth. */
const depth = new Matrix4([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.5, 0, 0, 0, 0.5, 1]);
/** Shared unit cube for instanced workcell geometry. */
const cube = new CubeGeometry();
/** Create a shared metallic-roughness material. */
const finish = (
  id: string,
  color: [number, number, number, number],
  metallic: number
): SceneMaterial => ({
  id,
  uniforms: {baseColorFactor: color, metallicRoughnessValues: [metallic, 0.36]}
});
/** Workcell finishes shared by meshes of the same material. */
const deck = finish('slate', [0.2, 0.24, 0.26, 1], 0.14),
  silver = finish('aluminum', [0.75, 0.8, 0.82, 1], 0.48),
  graphite = finish('iron', [0.19, 0.21, 0.24, 1], 0.4),
  gold = finish('brass', [0.78, 0.46, 0.16, 1], 0.46),
  blue = finish('blue-enamel', [0.08, 0.26, 0.37, 1], 0.2);
/** Build the workcell and bind moving meshes to GPU pose matrices. */
function makeScene(trial: ReturnType<typeof makeGantry>, displacement: number) {
  const root = new GroupNode({id: 'gantry'}),
    partsNode = new GroupNode({id: 'parts'}),
    toolNode = new GroupNode({id: 'tools'});
  root.add(partsNode, toolNode);
  const worldBindings = new Map<ScenegraphNode, ScenegraphTransformBinding>(),
    tools = new Map<ScenegraphNode, ScenegraphTransformBinding>();
  /** Attach a scaled box to the scene and optionally bind it to a body or link. */
  function mesh(
    group: GroupNode,
    id: string,
    position: readonly number[],
    scale: readonly number[],
    material: SceneMaterial,
    index?: number
  ) {
    const matrix = new Matrix4().translate(position).scale(scale);
    const node = new SceneMeshNode({id, geometry: cube, material, matrix});
    group.add(node);
    if (index !== undefined)
      (group === toolNode ? tools : worldBindings).set(node, {
        matrixIndex: index,
        localMatrix: matrix
      });
  }
  for (const [bodyIndex, body] of trial.bodies.entries())
    if (body.shape?.type === 'box')
      mesh(
        partsNode,
        'body-' + bodyIndex,
        [0, 0, 0],
        body.shape.halfExtents,
        bodyIndex === 0
          ? silver
          : bodyIndex === 1
            ? deck
            : bodyIndex < trial.stockStart
              ? blue
              : graphite,
        bodyIndex
      );
  mesh(partsNode, 'ballast', [displacement * 2, 0, 0.115], [0.16, 0.154, 0.035], gold, 0);
  trial.roots.forEach((arm, stationIndex) => {
    const [baseX, baseY] = arm.base;
    mesh(root, 'mast-' + stationIndex, [baseX, baseY, 0.62], [0.066, 0.08, 0.62], graphite);
    mesh(root, 'base-' + stationIndex, [baseX, baseY, 0.045], [0.21, 0.19, 0.045], silver);
    mesh(
      toolNode,
      'carriage-' + stationIndex,
      [0, 0, 0],
      [0.12, 0.13, 0.13],
      blue,
      stationIndex * 2
    );
    mesh(
      toolNode,
      'rail-' + stationIndex,
      [0, 0.53, -0.092],
      [0.067, 0.57, 0.046],
      blue,
      stationIndex * 2
    );
    mesh(
      toolNode,
      'extension-' + stationIndex,
      [0, -0.3, -0.06],
      [0.044, 0.34, 0.035],
      silver,
      stationIndex * 2 + 1
    );
    mesh(
      toolNode,
      'fork-' + stationIndex,
      [0, 0, 0],
      [0.095, 0.21, 0.045],
      gold,
      stationIndex * 2 + 1
    );
  });
  partsNode.transformSource = {
    getFrame: () => ({
      matrices: trial.world.poseMatrices!,
      matrixCount: trial.bodies.length,
      revision: 0,
      bindings: worldBindings
    })
  };
  toolNode.transformSource = {
    getFrame: () => ({
      matrices: trial.tree!.poseMatrices!,
      matrixCount: 4,
      revision: 0,
      bindings: tools
    })
  };
  return root;
}

/** Create the WebGPU device and run the interactive gantry. */
async function run() {
  const device = await luma.createDevice({
    adapters: [webgpuAdapter],
    type: 'webgpu',
    createCanvasContext: {canvas, autoResize: true}
  });
  const renderer = new SceneRenderer(device);
  /** Compile a fresh trial from the current ballast and inventory controls. */
  async function create() {
    const displacement = ballast.valueAsNumber;
    const trial = makeGantry({
      parts: parts.value === '256' ? 256 : 64,
      ballast: displacement,
      publish: true
    });
    const definition = new GPUCommandGraph(device);
    trial.addToGraph(definition);
    const graph = await definition.compileAsync();
    const scene = makeScene(trial, displacement);
    return {trial, graph, scene};
  }
  let simulation = await create(),
    step = 0,
    mode: 'ready' | 'lift' | 'hold' | 'transfer' | 'released' | 'done' = 'ready';
  let rebuild = false,
    accumulator = 0,
    previous = performance.now(),
    lastReading = 0;
  let pending: Promise<void> | undefined;
  /** Queue a new trial at the next frame boundary. */
  function reset() {
    rebuild = true;
    cycle.disabled = true;
    release.disabled = true;
  }
  ballast.oninput = () => {
    offset.value = ballast.valueAsNumber.toFixed(2) + ' m';
  };
  ballast.onchange = parts.onchange = reset;
  cycle.disabled = false;
  cycle.onclick = () => {
    if (mode === 'ready') {
      mode = 'lift';
      cycle.disabled = true;
    } else if (mode === 'hold') {
      mode = 'transfer';
      release.disabled = true;
      cycle.disabled = true;
    } else reset();
  };
  release.onclick = () => {
    mode = 'released';
    release.disabled = true;
    cycle.disabled = false;
    cycle.textContent = 'Reset';
  };
  const spot = {
    type: 'spot',
    position: [-2, 3, 7],
    direction: [2, -3, -7],
    color: [1, 0.98, 0.9],
    intensity: 9,
    innerConeAngle: 0.45,
    outerConeAngle: 0.85
  } as const;
  /** Advance fixed physics ticks, render their published poses and sample support forces. */
  async function frame(now: number) {
    if (rebuild) {
      rebuild = false;
      await pending;
      const old = simulation;
      simulation = await create();
      old.graph.destroy();
      old.trial.destroy();
      old.scene.destroy();
      diagnostics.clear();
      step = 0;
      mode = 'ready';
      cycle.disabled = false;
      cycle.textContent = 'Lift beam';
      loads.value = '';
      previous = now;
      accumulator = 0;
    }
    accumulator = Math.min(4 * GANTRY_STEP, accumulator + (now - previous) / 1000);
    previous = now;
    while (accumulator >= GANTRY_STEP) {
      const {height, travel} = gantryTargets(step);
      if (step % 4 === 0 || mode === 'released')
        simulation.trial.command(height, travel, mode === 'released');
      const encoder = device.createCommandEncoder();
      diagnostics.encode(simulation.graph, encoder, {parameters: undefined});
      device.submit(encoder.finish());
      accumulator -= GANTRY_STEP;
      if (mode === 'lift' || mode === 'transfer') step++;
      if (mode === 'lift' && step === 192) {
        mode = 'hold';
        cycle.textContent = 'Transfer beam';
        cycle.disabled = false;
        release.disabled = false;
      }
      if (mode === 'transfer' && step === 512) {
        mode = 'done';
        cycle.textContent = 'Reset';
        cycle.disabled = false;
      }
    }
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    renderer.render({
      scene: simulation.scene,
      camera: {
        viewMatrix: new Matrix4(camera.matrixWorldInverse.elements),
        projectionMatrix: new Matrix4(depth).multiplyRight(camera.projectionMatrix.elements),
        near: 0.1,
        far: 80,
        clipDepth: 'zero-to-one',
        position: [camera.position.x, camera.position.y, camera.position.z]
      },
      lights: [{type: 'ambient', intensity: 0.7, color: [0.87, 0.92, 1]}, spot],
      background: [0.1, 0.13, 0.16, 1],
      spotShadows: {
        spotLights: [
          {
            position: spot.position,
            direction: spot.direction,
            outerConeAngle: spot.outerConeAngle,
            range: 16,
            normalBias: 0.006,
            sourceRadius: 0.04
          }
        ]
      }
    });
    device.submit();
    panel.update();
    if (!pending && now - lastReading > 300) {
      lastReading = now;
      pending = simulation.trial
        .tree!.readSimulationDiagnostics()
        .then(state => {
          const force = [0, 0];
          state.contactPairs?.forEach((pair, contactIndex) => {
            if (pair.body === 0)
              force[pair.collider] += state.contactImpulses![contactIndex][2] / GANTRY_STEP;
          });
          loads.value = 'L ' + force[0].toFixed(1) + ' N · R ' + force[1].toFixed(1) + ' N';
          reading.value = state.complete
            ? `${state.activeContacts} contact rows · ${state.reusedContacts} reused · ${state.candidatePairs} candidate pairs`
            : 'Contact solve stopped';
        })
        .catch(showError)
        .finally(() => {
          pending = undefined;
        });
    }
    const fence = device.createFence();
    try {
      await fence.signaled;
    } finally {
      fence.destroy();
    }
    requestAnimationFrame(tick);
  }
  /** Schedule the next frame and surface renderer or simulation errors. */
  const tick = (now: number) => void frame(now).catch(showError);
  requestAnimationFrame(tick);
}
/** Display startup and frame errors in the lab. */
function showError(error: unknown) {
  document.querySelector<HTMLOutputElement>('#error')!.value = String(error);
}
void run().catch(showError);
