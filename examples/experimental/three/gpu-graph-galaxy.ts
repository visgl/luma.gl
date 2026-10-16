// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
//
// GPUCommandGraph -> borrowed GPU buffers -> upstream Three.js WebGPURenderer.
// Three 0.185.1 is intentionally pinned: the bridge uses private renderer hooks.
import {Buffer, luma, log} from '@luma.gl/core';
import {webgpuAdapter} from '@luma.gl/webgpu';
import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {ThreeBufferBridge, getThreeBufferBridgeSupport} from '@luma.gl/three/interop';
import {
  WebGPURenderer,
  Scene,
  PerspectiveCamera,
  Color,
  IcosahedronGeometry,
  InstancedBufferGeometry,
  Mesh,
  MeshBasicNodeMaterial,
  AdditiveBlending
} from 'three/webgpu';
import {attribute, positionLocal} from 'three/tsl';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

const PARTICLE_COUNT = 65536;
const PARTICLE_ANIMATION_SHADER = `
struct SimulationParameters { time: f32, radius: f32, count: f32, padding: f32 };
@group(0) @binding(0) var<storage, read_write> offsets: array<f32>;
@group(0) @binding(1) var<storage, read_write> colors: array<f32>;
@group(0) @binding(2) var<uniform> parameters: SimulationParameters;

// Integer hashing avoids correlated bands from large floating-point sine arguments.
fn getRandomValue(seed: u32) -> f32 {
  var value = seed + 0x9e3779b9u;
  value = (value ^ (value >> 16u)) * 0x85ebca6bu;
  value = (value ^ (value >> 13u)) * 0xc2b2ae35u;
  value = value ^ (value >> 16u);
  return f32(value & 0x00ffffffu) / 16777216.0;
}

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) invocationId: vec3u) {
  let particleIndex = invocationId.x;
  if (particleIndex >= u32(parameters.count)) { return; }
  let seed = particleIndex * 16u;
  var position: vec3f;
  var starColor: vec3f;
  var brightness: f32;

  // A quarter of the stars form a thick ellipsoidal bulge, rather than a flat disk.
  if (particleIndex % 4u == 0u) {
    let bulgeRadius = 2.4 * pow(getRandomValue(seed), 0.75) * parameters.radius;
    let azimuth = getRandomValue(seed + 1u) * 6.2831853 + parameters.time * 0.12;
    let verticalDirection = getRandomValue(seed + 2u) * 2.0 - 1.0;
    let planarDirection = sqrt(max(0.0, 1.0 - verticalDirection * verticalDirection));
    position = vec3f(
      cos(azimuth) * planarDirection,
      verticalDirection * 0.72,
      sin(azimuth) * planarDirection
    ) * bulgeRadius;
    starColor = mix(vec3f(1.0, 0.035, 0.008), vec3f(1.0, 0.18, 0.035), getRandomValue(seed + 3u));
    brightness = 0.04 + 0.28 * pow(getRandomValue(seed + 4u), 4.0);
  } else {
    let radialFraction = sqrt(getRandomValue(seed));
    let spiralArmAngle = f32(particleIndex % 5u) * 1.25663706;
    let angularJitter = (getRandomValue(seed + 1u) - 0.5) * (0.2 + radialFraction * 0.65);
    let rotationAngle = spiralArmAngle + radialFraction * 15.0
      + parameters.time * (0.2 + 0.6 / (0.3 + radialFraction)) + angularJitter;
    let radialDistance = (0.25 + 9.0 * radialFraction) * parameters.radius;
    let verticalSpread = 0.06 + radialFraction * radialFraction * 0.4;
    position = vec3f(
      cos(rotationAngle) * radialDistance,
      (getRandomValue(seed + 2u) - 0.5) * verticalSpread + sin(rotationAngle * 2.0) * 0.06,
      sin(rotationAngle) * radialDistance
    );
    let coreWeight = 1.0 - smoothstep(0.1, 0.5, radialFraction);
    starColor = mix(vec3f(0.32, 0.5, 1.0), vec3f(1.0, 0.2, 0.045), coreWeight);
    brightness = 0.025 + 0.22 * pow(getRandomValue(seed + 3u), 3.0);
  }
  // A range of luminosities keeps additive blending from washing the warm core white.
  let color = starColor * brightness;
  offsets[particleIndex * 3u] = position.x;
  offsets[particleIndex * 3u + 1u] = position.y;
  offsets[particleIndex * 3u + 2u] = position.z;
  colors[particleIndex * 3u] = color.r;
  colors[particleIndex * 3u + 1u] = color.g;
  colors[particleIndex * 3u + 2u] = color.b;
}`;

async function main() {
  if (!navigator.gpu) throw new Error('This showcase requires WebGPU.');
  const container = document.querySelector<HTMLElement>('#viewport')!;
  const status = document.querySelector<HTMLElement>('#status')!;
  const canvas = document.createElement('canvas');
  container.append(canvas);
  const device = await luma.createDevice({adapters: [webgpuAdapter], type: 'webgpu'});
  const renderer = new WebGPURenderer({
    canvas,
    device: device.handle as GPUDevice,
    antialias: true
  });
  await renderer.init();
  const support = getThreeBufferBridgeSupport(device, renderer);
  if (!support.supported) throw new Error(support.reason);
  const bridge = new ThreeBufferBridge(device, renderer);
  // vec4 layout avoids alignment ambiguity in storage; Three consumes xyz with stride 16.
  // The bridge currently supports packed Float32 attributes, so use vec3 arrays instead.
  const positions = device.createBuffer({
    id: 'galaxy-positions',
    byteLength: PARTICLE_COUNT * 12,
    usage: Buffer.STORAGE | Buffer.VERTEX
  });
  const colors = device.createBuffer({
    id: 'galaxy-colors',
    byteLength: PARTICLE_COUNT * 12,
    usage: Buffer.STORAGE | Buffer.VERTEX
  });
  const parameterBuffer = device.createBuffer({
    id: 'galaxy-params',
    byteLength: 16,
    usage: Buffer.UNIFORM | Buffer.COPY_DST
  });
  const graph = new GPUCommandGraph(device, {id: 'galaxy-animation'});
  const positionHandle = graph.importBuffer(
    {id: 'positions', byteLength: positions.byteLength, usage: positions.usage},
    positions
  );
  const colorHandle = graph.importBuffer(
    {id: 'colors', byteLength: colors.byteLength, usage: colors.usage},
    colors
  );
  const parameterHandle = graph.importBuffer(
    {id: 'params', byteLength: parameterBuffer.byteLength, usage: parameterBuffer.usage},
    parameterBuffer
  );
  graph.addComputePass({
    id: 'animate-and-color',
    resources: [
      {buffer: positionHandle, usage: 'storage-write'},
      {buffer: colorHandle, usage: 'storage-write'},
      {buffer: parameterHandle, usage: 'uniform'}
    ],
    compile: ({device}) => {
      const computation = new Computation(device, {
        id: 'galaxy-kernel',
        source: PARTICLE_ANIMATION_SHADER,
        shaderLayout: {
          bindings: [
            {name: 'offsets', type: 'storage', group: 0, location: 0},
            {name: 'colors', type: 'storage', group: 0, location: 1},
            {name: 'parameters', type: 'uniform', group: 0, location: 2}
          ]
        }
      });
      return {
        encode: ({computePass, getBuffer}) => {
          computation.setBindings({
            offsets: getBuffer(positionHandle),
            colors: getBuffer(colorHandle),
            parameters: getBuffer(parameterHandle)
          });
          computation.dispatch(computePass, PARTICLE_COUNT / 256);
        },
        destroy: () => computation.destroy()
      };
    }
  });
  const compiled = await graph.compileAsync();
  const base = new IcosahedronGeometry(0.035, 0);
  const geometry = new InstancedBufferGeometry();
  geometry.index = base.index;
  geometry.setAttribute('position', base.getAttribute('position'));
  geometry.instanceCount = PARTICLE_COUNT;
  geometry.setAttribute(
    'instanceOffset',
    bridge.createInstancedAttribute(positions, 3, PARTICLE_COUNT)
  );
  geometry.setAttribute(
    'instanceColor',
    bridge.createInstancedAttribute(colors, 3, PARTICLE_COUNT)
  );
  const material = new MeshBasicNodeMaterial({
    color: '#ffffff',
    transparent: true,
    opacity: 0.85,
    blending: AdditiveBlending,
    depthWrite: false
  });
  material.positionNode = positionLocal.add(attribute<'vec3'>('instanceOffset', 'vec3'));
  material.colorNode = attribute<'vec3'>('instanceColor', 'vec3');
  const mesh = new Mesh(geometry, material);
  mesh.frustumCulled = false;
  const scene = new Scene();
  scene.background = new Color('#02030b');
  scene.add(mesh);
  const camera = new PerspectiveCamera(55, 1, 0.01, 200);
  camera.position.set(0, 12, 21);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.25;
  const resize = () => {
    const width = container.clientWidth,
      height = container.clientHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', resize);
  resize();
  status.textContent = '65,536 instances · GPU graph → shared buffers → Three.js';
  let time = 0,
    previousTimestamp = performance.now(),
    running = true;
  const animate = (now: number) => {
    if (!running) return;
    const deltaTimeSeconds = Math.min((now - previousTimestamp) / 1000, 0.05);
    previousTimestamp = now;
    if (!document.querySelector<HTMLInputElement>('#pause')!.checked)
      time += deltaTimeSeconds * Number(document.querySelector<HTMLInputElement>('#speed')!.value);
    parameterBuffer.write(
      new Float32Array([
        time,
        Number(document.querySelector<HTMLInputElement>('#radius')!.value),
        PARTICLE_COUNT,
        0
      ])
    );
    compiled.encode(device.commandEncoder, {parameters: undefined});
    device.submit(); // Same GPU queue; no readback, no intermediate upload.
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  };
  requestAnimationFrame(animate);
  window.addEventListener(
    'pagehide',
    () => {
      running = false;
      controls.dispose();
      geometry.dispose();
      material.dispose();
      bridge.dispose();
      compiled.destroy();
      parameterBuffer.destroy();
      positions.destroy();
      colors.destroy();
      renderer.dispose();
      device.destroy();
    },
    {once: true}
  );
}
main().catch(error => {
  document.querySelector<HTMLElement>('#status')!.textContent = String(error);
  log.error(error instanceof Error ? error.message : String(error))();
});
