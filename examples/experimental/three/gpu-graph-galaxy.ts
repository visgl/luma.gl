// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
//
// GPUCommandGraph -> borrowed GPU buffers -> upstream Three.js WebGPURenderer.
// Three 0.185.1 is intentionally pinned: the bridge uses private renderer hooks.
import {Buffer, luma, log} from '@luma.gl/core';
import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {ThreeBufferBridge, getThreeBufferBridgeSupport} from '@luma.gl/three/interop';
import {
  WebGPURenderer,
  Scene,
  PerspectiveCamera,
  Color,
  PlaneGeometry,
  InstancedBufferAttribute,
  RenderPipeline,
  RenderTarget,
  DepthTexture,
  CircleGeometry,
  DoubleSide,
  HalfFloatType,
  NoBlending,
  ACESFilmicToneMapping,
  InstancedBufferGeometry,
  Mesh,
  MeshBasicNodeMaterial,
  AdditiveBlending
} from 'three/webgpu';
import {
  attribute,
  cameraWorldMatrix,
  exp,
  positionLocal,
  screenUV,
  texture,
  uv,
  vec4
} from 'three/tsl';
import {GalaxyDepthOfField} from './galaxy-depth-of-field';
import {createGalaxyInfoBox} from './galaxy-info-box';
import {GPUGraphDiagnostics} from '../../gpu-graph-diagnostics';
import {bloom} from 'three/addons/tsl/display/BloomNode.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

const PARTICLE_COUNT = 98304;
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

  let population = particleIndex % 16u;
  let radialFraction = pow(getRandomValue(seed), 0.65);
  let radialDistance = (0.08 + 9.8 * radialFraction) * parameters.radius;
  let arm = f32(particleIndex % 3u) * 2.0943951;
  let filament = getRandomValue(seed + 6u);
  let strand = floor(filament * 4.0);
  let armVariation = sin(arm + 0.8);
  let orbitalAngle = parameters.time * (0.16 + 0.32 / (0.35 + radialFraction));
  // Correlated waves bend entire filaments; fine scatter breaks up their edges.
  let turbulence = sin(radialFraction * 23.0 + arm * 3.0 + parameters.time * 0.12) * 0.16
    + sin(radialFraction * 51.0 + filament * 5.0) * 0.035;
  var angle = arm + log(1.0 + radialFraction * 8.0) * (2.8 + armVariation * 0.2) + orbitalAngle + turbulence;
  let scatter = getRandomValue(seed + 1u) - 0.5;
  // Discrete braided ribbons leave dark channels between the luminous streams.
  angle += (strand - 1.5) * 0.105 + sin(radialFraction * 14.0 + strand * 1.7) * 0.07;
  angle += scatter * (0.055 + 0.14 * filament * filament);
  // Sculpt each arm around a raised centerline while retaining a thin underlying disk.
  // Coherent ridges and braided strands give the arms volume without scattering them apart.
  let armEnvelope = smoothstep(0.05, 0.25, radialFraction);
  let ridgePhase = radialFraction * 9.0 + arm + parameters.time * 0.12;
  let ridgeHeight = sin(ridgePhase) * (0.12 + radialFraction * (0.55 + 0.25 * armVariation)) * armEnvelope;
  let strandPhase = radialFraction * 12.0 + floor(filament * 4.0) * 1.5707963 + arm;
  let strandHeight = sin(strandPhase) * (0.04 + radialFraction * 0.24) * armEnvelope;
  let crossSection = getRandomValue(seed + 2u) * 6.2831853;
  let thickness = (0.035 + radialFraction * 0.24) * (1.0 - abs(scatter));
  let height = ridgeHeight + strandHeight + cos(crossSection) * thickness;
  position = vec3f(cos(angle) * radialDistance, height, sin(angle) * radialDistance);
  let gold = mix(vec3f(1.0, 0.16, 0.005), vec3f(1.0, 0.52, 0.07), getRandomValue(seed + 3u));
  let cyan = mix(vec3f(0.005, 0.18, 0.5), vec3f(0.04, 0.8, 1.0), getRandomValue(seed + 4u));
  // Warm and cool filaments overlap instead of forming uniform concentric color bands.
  let coolWeight = smoothstep(0.25, 0.8, radialFraction + sin(arm + strand * 0.7) * 0.23);
  starColor = mix(gold, cyan, coolWeight);
  // A brighter face and dimmer underside make the stream's rounded cross-section readable.
  let strandLight = 0.65 + 0.5 * (0.5 + 0.5 * cos(crossSection - 0.7));
  brightness = (0.38 + 3.2 * pow(getRandomValue(seed + 5u), 7.0)) * strandLight;
  if (population == 0u || population == 1u) {
    // Soft, oversized sprites trace translucent dust clouds above and below the stars.
    position.x += (getRandomValue(seed + 7u) - 0.5) * radialFraction * 1.2;
    position.z += (getRandomValue(seed + 8u) - 0.5) * radialFraction * 1.2;
    // Dust curls around the same arm centerline rather than forming a separate cloud.
    position.y += sin(strandPhase + crossSection * 0.35) * (0.1 + radialFraction * 0.3);
    brightness = 0.0015 + 0.003 * getRandomValue(seed + 5u);
  } else if (population == 2u) {
    // A loose foreground population supplies depth and a handful of defocused lights.
    angle = getRandomValue(seed + 1u) * 6.2831853 + parameters.time * 0.04;
    position = vec3f(cos(angle) * radialDistance * 1.2,
      (getRandomValue(seed + 2u) - 0.5) * 4.5, sin(angle) * radialDistance * 1.2);
    brightness = 0.018 + 0.07 * getRandomValue(seed + 5u);
  } else if (population == 3u || population == 4u) {
    // A compact, rotating, luminous bulge anchors the asymmetric spiral ribbons.
    let coreRadius = pow(getRandomValue(seed), 0.65) * 1.6 * parameters.radius;
    angle = coreRadius * 7.0 + f32(particleIndex % 2u) * 3.1415927
      + (getRandomValue(seed + 1u) - 0.5) * 0.18 + parameters.time * 0.7;
    position = vec3f(cos(angle) * coreRadius,
      (getRandomValue(seed + 2u) - 0.5) * coreRadius * 0.2, sin(angle) * coreRadius * 0.7);
    starColor = mix(vec3f(1.0, 0.38, 0.025), vec3f(1.0, 0.9, 0.52), getRandomValue(seed + 3u));
    brightness = 0.35 + 1.2 * getRandomValue(seed + 5u);
  } else if (population >= 5u && population <= 7u) {
    // A dim stellar disk connects the bright filaments into a substantial galaxy.
    // These stars fill the gaps without adding another layer of blurry bloom.
    angle += (getRandomValue(seed + 9u) - 0.5) * 2.4;
    position = vec3f(cos(angle) * radialDistance,
      (getRandomValue(seed + 2u) - 0.5) * (0.06 + radialFraction * 0.16),
      sin(angle) * radialDistance);
    brightness = 0.035 + 0.12 * getRandomValue(seed + 5u);
  }
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
  const diagnostics = new GPUGraphDiagnostics();
  const infoBox = createGalaxyInfoBox(diagnostics);
  const canvas = document.createElement('canvas');
  container.append(canvas);
  status.textContent = 'Requesting shared WebGPU device…';
  const device = await luma.createDevice({
    adapters: [webgpuAdapter],
    type: 'webgpu',
    optionalFeatures: ['timestamp-query'],
    createCanvasContext: {canvas: document.createElement('canvas'), autoResize: false}
  });
  const renderer = new WebGPURenderer({
    canvas,
    device: device.handle as GPUDevice,
    antialias: true
  });
  status.textContent = 'Initializing Three renderer…';
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
  status.textContent = 'Compiling galaxy animation…';
  const compiled = await graph.compileAsync();
  // Camera-facing quads with analytic falloff read as light, rather than solid polyhedra.
  const base = new PlaneGeometry(1, 1);
  const geometry = new InstancedBufferGeometry();
  geometry.index = base.index;
  geometry.setAttribute('position', base.getAttribute('position'));
  geometry.setAttribute('uv', base.getAttribute('uv'));
  const particleSizes = new Float32Array(PARTICLE_COUNT);
  for (let particleIndex = 0; particleIndex < PARTICLE_COUNT; particleIndex++) {
    const population = particleIndex % 16;
    const variation = ((particleIndex * 16807) % 65521) / 65521;
    particleSizes[particleIndex] =
      population < 2
        ? 0.7 + variation * 1.4
        : population === 2
          ? 0.08 + variation ** 8 * 0.9
          : population >= 5 && population <= 7
            ? 0.04 + variation * 0.09
            : 0.024 + variation ** 4 * 0.09;
  }
  geometry.setAttribute('instanceSize', new InstancedBufferAttribute(particleSizes, 1));
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
  const instanceSize = attribute<'float'>('instanceSize', 'float');
  const spritePosition = positionLocal.mul(instanceSize);
  material.positionNode = attribute<'vec3'>('instanceOffset', 'vec3').add(
    cameraWorldMatrix.mul(vec4(spritePosition, 0)).xyz
  );
  const squaredRadius = uv().sub(0.5).length().pow(2).mul(4);
  const spriteOpacity = exp(squaredRadius.mul(-5)).sub(Math.exp(-5)).max(0);
  material.opacityNode = spriteOpacity;
  material.colorNode = attribute<'vec3'>('instanceColor', 'vec3');
  const mesh = new Mesh(geometry, material);
  mesh.frustumCulled = false;
  const scene = new Scene();
  scene.background = new Color('#010409');
  scene.add(mesh);
  const camera = new PerspectiveCamera(50, 1, 0.01, 200);
  camera.position.set(0, 8.2, 19.2);
  camera.up.set(0.3, 1, 0);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  // Keep manual orbit/zoom, but drive the automatic camera in the galaxy's world-space plane.
  let cameraInteracting = false;
  let cameraResumeTime = 0;
  let cameraOrbitTime = 0;
  controls.addEventListener('start', () => {
    cameraInteracting = true;
  });
  controls.addEventListener('end', () => {
    cameraInteracting = false;
    cameraResumeTime = performance.now() + 6000;
  });
  const depthOfField = new GalaxyDepthOfField(device, renderer);
  const sceneTarget = new RenderTarget(1, 1, {type: HalfFloatType});
  sceneTarget.depthTexture = new DepthTexture(1, 1);
  // Capture nearest sharp star depth separately; luminous dust must not mask the whole disk.
  const depthMaterial = material.clone();
  depthMaterial.transparent = false;
  depthMaterial.blending = NoBlending;
  depthMaterial.colorWrite = false;
  depthMaterial.depthWrite = true;
  depthMaterial.alphaTest = 0.2;
  depthMaterial.opacityNode = spriteOpacity.mul(instanceSize.lessThan(0.25).select(1, 0));
  const depthScene = new Scene();
  const depthStars = new Mesh(geometry, depthMaterial);
  depthStars.frustumCulled = false;
  depthScene.add(depthStars);
  // The stellar disk supplies continuous depth between sparse additive star sprites.
  // Otherwise empty pixels read as the far plane and turn every filament into a blur edge.
  const diskGeometry = new CircleGeometry(10.1, 96);
  const diskMaterial = new MeshBasicNodeMaterial({
    colorWrite: false,
    depthWrite: true,
    side: DoubleSide
  });
  const depthDisk = new Mesh(diskGeometry, diskMaterial);
  depthDisk.rotation.x = -Math.PI / 2;
  // Keep the gap-filling depth proxy below the raised and recessed stellar streams.
  depthDisk.position.y = -1;
  depthScene.add(depthDisk);
  const renderPipeline = new RenderPipeline(renderer);
  const sceneColor = texture(depthOfField.output, screenUV);
  const glow = bloom(sceneColor, 0.45, 0.3, 1.1);
  renderPipeline.outputNode = sceneColor.add(glow);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const resize = () => {
    const width = container.clientWidth,
      height = container.clientHeight;
    renderer.setSize(width, height, false);
    sceneTarget.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', resize);
  resize();
  status.textContent = '98,304 instances · GPU graph → shared buffers → Three.js';
  let time = 0,
    previousTimestamp = performance.now(),
    running = true;
  const animate = (now: number) => {
    if (!running) return;
    const deltaTimeSeconds = Math.min((now - previousTimestamp) / 1000, 0.05);
    previousTimestamp = now;
    const paused = document.querySelector<HTMLInputElement>('#pause')!.checked;
    if (!paused)
      time += deltaTimeSeconds * Number(document.querySelector<HTMLInputElement>('#speed')!.value);
    parameterBuffer.write(
      new Float32Array([
        time,
        Number(document.querySelector<HTMLInputElement>('#radius')!.value),
        PARTICLE_COUNT,
        0
      ])
    );
    diagnostics.encode(compiled, device.commandEncoder, {parameters: undefined});
    device.submit(); // Same GPU queue; no readback, no intermediate upload.
    controls.update();
    if (!paused && !cameraInteracting && now >= cameraResumeTime) {
      cameraOrbitTime += deltaTimeSeconds;
      const offset = camera.position.clone().sub(controls.target);
      const distance = offset.length();
      // One revolution takes six minutes; an 80-second cycle moves from 35° to 8° above the disk.
      const azimuth = Math.atan2(offset.x, offset.z) + (deltaTimeSeconds * Math.PI) / 180;
      const targetElevation =
        ((21.5 + 13.5 * Math.cos((cameraOrbitTime * Math.PI) / 40)) * Math.PI) / 180;
      const currentElevation = Math.asin(Math.max(-1, Math.min(1, offset.y / distance)));
      // Ease back from a user's chosen elevation rather than snapping after interaction.
      const elevation =
        currentElevation +
        (targetElevation - currentElevation) * (1 - Math.exp(-deltaTimeSeconds * 0.5));
      const planarDistance = distance * Math.cos(elevation);
      camera.position.set(
        controls.target.x + Math.sin(azimuth) * planarDistance,
        controls.target.y + Math.sin(elevation) * distance,
        controls.target.z + Math.cos(azimuth) * planarDistance
      );
      camera.lookAt(controls.target);
    }
    renderer.setRenderTarget(sceneTarget);
    renderer.render(scene, camera);
    // Preserve additive color while filling only the depth attachment.
    renderer.autoClear = false;
    depthDisk.scale.setScalar(Number(document.querySelector<HTMLInputElement>('#radius')!.value));
    renderer.render(depthScene, camera);
    renderer.autoClear = true;
    renderer.setRenderTarget(null);
    depthOfField.render(
      sceneTarget.texture,
      sceneTarget.depthTexture!,
      camera.position.distanceTo(controls.target),
      Number(document.querySelector<HTMLInputElement>('#aperture')!.value),
      [camera.near, camera.far]
    );
    renderPipeline.render();
    infoBox.update();
    requestAnimationFrame(animate);
  };
  requestAnimationFrame(animate);
  window.addEventListener(
    'pagehide',
    () => {
      running = false;
      controls.dispose();
      infoBox.destroy();
      window.removeEventListener('resize', resize);
      renderPipeline.dispose();
      glow.dispose();
      sceneTarget.dispose();
      depthMaterial.dispose();
      diskGeometry.dispose();
      diskMaterial.dispose();
      depthOfField.dispose();
      base.dispose();
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
