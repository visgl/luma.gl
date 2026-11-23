// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, luma} from '@luma.gl/core';
import {webgpuAdapter, WebGPUDevice} from '@luma.gl/core/webgpu';
import {GPUCommandGraph} from '@luma.gl/graph/gpu-core';
import {GPURigidBodyWorld} from '@luma.gl/graph/gpu-physics';
import {ThreeBufferBridge} from '@luma.gl/three/interop';
import {
  BoxGeometry,
  Color,
  DirectionalLight,
  HemisphereLight,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Mesh,
  MeshStandardMaterial,
  MeshStandardNodeMaterial,
  OrthographicCamera,
  Scene,
  WebGPURenderer
} from 'three/webgpu';
import {
  attribute,
  mat4,
  normalGeometry,
  positionLocal,
  transformNormalToView,
  vec4
} from 'three/tsl';
import {GPUGraphDiagnostics} from '../../gpu-graph-diagnostics';
import {createDominoCoursePanel} from './domino-course-panel';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {
  FLOOR_HALF_EXTENTS,
  makeDominoCourse,
  TILE_DEPTH,
  TILE_HEIGHT,
  TILE_WIDTH
} from './domino-course-layout';

const canvas = document.querySelector<HTMLCanvasElement>('#course')!;
const start = document.querySelector<HTMLButtonElement>('#start')!;
const reset = document.querySelector<HTMLButtonElement>('#reset')!;
const status = document.querySelector<HTMLOutputElement>('#status')!;
const TIME_STEP = 1 / 120;
const PLAYBACK_RATE = 1.35;
const PACK_POSES = `
@group(0) @binding(0) var<storage, read> matrices: array<mat4x4f>;
@group(0) @binding(1) var<storage, read_write> firstColumn: array<vec4f>;
@group(0) @binding(2) var<storage, read_write> secondColumn: array<vec4f>;
@group(0) @binding(3) var<storage, read_write> thirdColumn: array<vec4f>;
@group(0) @binding(4) var<storage, read_write> fourthColumn: array<vec4f>;
@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) invocation: vec3u) {
  let index = invocation.x;
  if (index >= arrayLength(&firstColumn)) { return; }
  let pose = matrices[index + 1u]; // The static table is body zero.
  firstColumn[index] = pose[0];
  secondColumn[index] = pose[1];
  thirdColumn[index] = pose[2];
  fourthColumn[index] = pose[3];
}`;

async function run() {
  const device = await luma.createDevice({
    type: 'webgpu',
    adapters: [webgpuAdapter],
    optionalFeatures: ['timestamp-query']
  });
  if (!(device instanceof WebGPUDevice)) throw new Error('Domino Junction requires WebGPU');
  const renderer = new WebGPURenderer({canvas, device: device.handle, antialias: true});
  await renderer.init();

  const course = makeDominoCourse();
  const world = new GPURigidBodyWorld({
    bodies: course.bodies,
    publishPoses: true,
    gravity: [0, -9.81, 0],
    timeStep: TIME_STEP,
    iterations: 16,
    maximumPairs: 1024,
    solver: 'parallel',
    broadPhase: 'hierarchical-grid',
    failurePolicy: 'rollback'
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  const diagnostics = new GPUGraphDiagnostics();
  const disposePanel = createDominoCoursePanel(
    document.querySelector<HTMLElement>('#course-controls')!,
    diagnostics
  );
  const checkpoint = world.createGPUCheckpoint();
  checkpoint.save();

  const bridge = new ThreeBufferBridge(device, renderer);
  const columns = Array.from({length: 4}, () =>
    device.createBuffer({
      byteLength: course.tiles.length * 16,
      usage: Buffer.VERTEX | Buffer.STORAGE
    })
  );
  const packShader = device.createShader({stage: 'compute', source: PACK_POSES});
  const packPipeline = device.createComputePipeline({
    shader: packShader,
    shaderLayout: {
      bindings: [
        {name: 'matrices', type: 'read-only-storage', group: 0, location: 0},
        {name: 'firstColumn', type: 'storage', group: 0, location: 1},
        {name: 'secondColumn', type: 'storage', group: 0, location: 2},
        {name: 'thirdColumn', type: 'storage', group: 0, location: 3},
        {name: 'fourthColumn', type: 'storage', group: 0, location: 4}
      ]
    }
  });
  const box = new BoxGeometry(TILE_WIDTH, TILE_HEIGHT, TILE_DEPTH);
  const geometry = new InstancedBufferGeometry();
  geometry.index = box.index;
  for (const name of ['position', 'normal']) geometry.setAttribute(name, box.getAttribute(name));
  geometry.instanceCount = course.tiles.length;
  for (const [index, column] of columns.entries())
    geometry.setAttribute(
      `poseColumn${index}`,
      bridge.createInstancedAttribute(column, 4, course.tiles.length)
    );

  const tint = new Float32Array(course.tiles.length * 3);
  const width = new Float32Array(course.tiles.length);
  for (const [index, tile] of course.tiles.entries()) {
    tint.set(new Color(tile.color).toArray(), index * 3);
    width[index] = tile.width / TILE_WIDTH;
  }
  geometry.setAttribute('tileTint', new InstancedBufferAttribute(tint, 3));
  geometry.setAttribute('tileWidth', new InstancedBufferAttribute(width, 1));
  const pose = mat4(
    attribute<'vec4'>('poseColumn0', 'vec4'),
    attribute<'vec4'>('poseColumn1', 'vec4'),
    attribute<'vec4'>('poseColumn2', 'vec4'),
    attribute<'vec4'>('poseColumn3', 'vec4')
  );
  const tileWidth = attribute<'float'>('tileWidth', 'float');
  const material = new MeshStandardNodeMaterial({roughness: 0.42, metalness: 0.12});
  material.colorNode = attribute<'vec3'>('tileTint', 'vec3');
  material.positionNode = pose.mul(vec4(positionLocal.x.mul(tileWidth), positionLocal.yz, 1)).xyz;
  // Tile poses are rigid rotations. Width only scales faces of axis-aligned box geometry.
  material.normalNode = transformNormalToView(pose.mul(vec4(normalGeometry, 0)).xyz).normalize();

  const scene = new Scene();
  scene.background = new Color('#111820');
  const tiles = new Mesh(geometry, material);
  tiles.frustumCulled = false;
  const floor = new Mesh(
    new BoxGeometry(
      FLOOR_HALF_EXTENTS[0] * 2,
      FLOOR_HALF_EXTENTS[1] * 2,
      FLOOR_HALF_EXTENTS[2] * 2
    ),
    new MeshStandardMaterial({color: '#233745', roughness: 0.9})
  );
  floor.position.y = -0.25;
  const key = new DirectionalLight('#fff4e7', 2);
  key.position.set(-5, 12, 7);
  scene.add(tiles, floor, key, new HemisphereLight('#e2f6ff', '#28252b', 1.2));

  const camera = new OrthographicCamera(-14, 14, 7, -7, 0.1, 100);
  camera.position.set(0, 23, 15);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.target.set(0, 0, 0);
  controls.minZoom = 0.6;
  controls.maxZoom = 3;
  const resize = () => {
    const aspect = canvas.clientWidth / Math.max(1, canvas.clientHeight);
    const halfWidth = Math.max(14.5, 13.5 * aspect);
    camera.left = -halfWidth;
    camera.right = halfWidth;
    camera.top = halfWidth / aspect;
    camera.bottom = -camera.top;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  };
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();

  let running = false;
  let elapsed = 0;
  let accumulator = 0;
  let previous: number | undefined;
  let copyPoses = true;
  start.disabled = false;
  reset.disabled = false;
  status.textContent = 'Ready';
  start.onclick = () => {
    world.applyImpulse(1, [0.95, 0, 0], [-11.2, TILE_HEIGHT * 0.9, 0]);
    start.disabled = true;
    running = true;
    status.textContent = 'Dominoes in motion';
  };
  reset.onclick = () => {
    checkpoint.restore();
    running = false;
    elapsed = 0;
    accumulator = 0;
    copyPoses = true;
    start.disabled = false;
    status.textContent = 'Ready';
  };
  renderer.setAnimationLoop(now => {
    const delta =
      previous === undefined
        ? 0
        : Math.min(((now - previous) / 1000) * PLAYBACK_RATE, 6 * TIME_STEP);
    previous = now;
    if (running) accumulator += delta;
    if (copyPoses || accumulator >= TIME_STEP) {
      const encoder = device.createCommandEncoder();
      while (accumulator >= TIME_STEP) {
        diagnostics.encode(graph, encoder, {parameters: undefined});
        accumulator -= TIME_STEP;
        elapsed += TIME_STEP;
      }
      // Pack the luma pose matrix columns into the vertex buffers borrowed by Three.js.
      const packPass = encoder.beginComputePass();
      packPass.setPipeline(packPipeline);
      packPass.setBindings({
        matrices: world.poseMatrices!,
        firstColumn: columns[0],
        secondColumn: columns[1],
        thirdColumn: columns[2],
        fourthColumn: columns[3]
      });
      packPass.dispatch(Math.ceil(course.tiles.length / 64));
      packPass.end();
      device.submit(encoder.finish());
      copyPoses = false;
    }
    if (elapsed >= 12) {
      running = false;
      accumulator = 0;
      status.textContent = 'Run complete';
    }
    controls.update();
    renderer.render(scene, camera);
  });

  window.addEventListener(
    'pagehide',
    event => {
      if (event.persisted) return;
      renderer.setAnimationLoop(null);
      observer.disconnect();
      disposePanel();
      controls.dispose();
      geometry.dispose();
      box.dispose();
      material.dispose();
      floor.geometry.dispose();
      floor.material.dispose();
      bridge.dispose();
      checkpoint.destroy();
      graph.destroy();
      world.destroy();
      packPipeline.destroy();
      packShader.destroy();
      for (const column of columns) column.destroy();
      renderer.dispose();
      device.destroy();
    },
    {once: true}
  );
}

void run().catch(error => {
  status.textContent = error instanceof Error ? error.message : String(error);
});
