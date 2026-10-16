// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {luma, Buffer, type Parameters} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';
import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {Matrix4} from '@math.gl/core';
import {GPUCommandGraph, type CompiledGPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {GPUSphereWorld, decodeGPUSphereWorldDiagnostics} from '@luma.gl/gpgpu/gpu-physics';
import {PerspectiveCamera, Vector3, Quaternion} from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {
  advanceSphereClock,
  createSphereBenchmark,
  recordSphereBenchmarkSample,
  type SphereBenchmark
} from './benchmark';

function getElement<ElementType extends HTMLElement = HTMLElement>(selector: string): ElementType {
  // index.html declares every control before loading this entry module.
  return document.querySelector<ElementType>(selector)!;
}
const status = getElement<HTMLOutputElement>('#status');
try {
  let gpuError: Error | null = null;
  const device = await luma.createDevice({
    onError: error => {
      gpuError = error;
    },
    adapters: [webgpuAdapter],
    optionalFeatures: ['timestamp-query'],
    createCanvasContext: {canvas: 'spheres', autoResize: true}
  });
  getElement('#adapter-info').textContent =
    `${device.info.vendor} · ${device.info.gpuArchitecture} · ${device.info.featureLevel}`;
  const camera = device.createBuffer({byteLength: 96, usage: Buffer.UNIFORM | Buffer.COPY_DST});
  type Resources = {
    scene: string;
    count: number;
    halfExtent: number;
    positions: Buffer;
    velocities: Buffer;
    orientations: Buffer;
    world: GPUSphereWorld;
    graph: CompiledGPUCommandGraph<void>;
  };
  function resetSpheres(target: Resources): void {
    const positionData = new Float32Array(target.count * 4);
    const velocityData = new Float32Array(target.count * 4);
    const orientationData = new Float32Array(target.count * 4);
    const scene = target.scene;
    const layerCount =
      scene === 'pile'
        ? Math.ceil(Math.cbrt(target.count))
        : scene === 'rack'
          ? 1
          : target.count >= 1024
            ? 4
            : 1;
    const columns = Math.ceil(Math.sqrt(target.count / layerCount));
    const spacing = scene === 'pile' ? 0.65 : 0.84;
    for (let index = 0; index < target.count; index++) {
      const layer = Math.floor(index / (columns * columns));
      const radius = 0.32 + (index % 4) * 0.02;
      positionData.set(
        [
          ((index % columns) - (columns - 1) / 2) * spacing,
          ((Math.floor(index / columns) % columns) - (columns - 1) / 2) * spacing,
          scene === 'rack' ? radius : 2 + layer * spacing + (index % 7) * 0.08,
          radius
        ],
        index * 4
      );
      velocityData[index * 4 + 3] = 1;
      // Vary initial band axes so neighboring spheres are visually distinguishable.
      const angle = index * 0.37;
      orientationData.set([Math.sin(angle / 2), 0, 0, Math.cos(angle / 2)], index * 4);
    }
    target.positions.write(positionData);
    target.velocities.write(velocityData);
    target.orientations.write(orientationData);
    target.world.angularVelocities!.write(new Float32Array(target.count * 4));
    target.world.sleepStates!.write(new Float32Array(target.count * 4));
  }
  async function createResources(count: number): Promise<Resources> {
    const createBuffer = () =>
      device.createBuffer({
        byteLength: count * 16,
        usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
      });
    const positions = createBuffer();
    const velocities = createBuffer();
    const orientations = createBuffer();
    const scene = getElement<HTMLSelectElement>('#scene').value;
    const layerCount =
      scene === 'pile' ? Math.ceil(Math.cbrt(count)) : scene === 'rack' ? 1 : count >= 1024 ? 4 : 1;
    const columns = Math.ceil(Math.sqrt(count / layerCount));
    const halfExtent = Math.max(6, columns * 0.44 + 1);
    const definition = new GPUCommandGraph<void>(device);
    const world = new GPUSphereWorld({
      count,
      positions,
      velocities,
      orientations,
      maximumRadius: 0.4,
      maximumContacts: 32,
      maximumCandidateTests: 512,
      iterations: 8,
      restitution: 0.62,
      staticFriction: 0.5,
      dynamicFriction: 0.35,
      rollingResistance: 0.08,
      plane: {halfExtents: [halfExtent, halfExtent]}
    });
    world.addToGraph(definition);
    try {
      const graph = await definition.compileAsync();
      const result = {scene, count, halfExtent, positions, velocities, orientations, world, graph};
      resetSpheres(result);
      return result;
    } catch (error) {
      world.destroy();
      positions.destroy();
      velocities.destroy();
      orientations.destroy();
      throw error;
    }
  }
  function destroyResources(target: Resources): void {
    target.graph.destroy();
    target.world.destroy();
    target.positions.destroy();
    target.velocities.destroy();
    target.orientations.destroy();
  }
  let resources = await createResources(64);
  function restoreSceneControls(): void {
    getElement<HTMLSelectElement>('#scene').value = resources.scene;
    getElement<HTMLSelectElement>('#body-count').value = String(resources.count);
    getElement<HTMLSelectElement>('#scene').disabled = false;
    getElement<HTMLSelectElement>('#body-count').disabled = false;
  }
  const orbitCamera = new PerspectiveCamera(45, 1, 0.1, 100);
  orbitCamera.up.set(0, 0, 1);
  orbitCamera.position.set(0, -22, 26);
  const controls = new OrbitControls(orbitCamera, getElement('#spheres'));
  controls.target.set(0, 0, 2);
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.rotateSpeed = 0.25;
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;
  controls.update();
  let initialDirection = orbitCamera.position.clone().sub(controls.target).normalize();
  let gravityRotation = new Quaternion().setFromUnitVectors(initialDirection, new Vector3(0, 0, 1));
  const initialPolar = controls.getPolarAngle();
  const initialAzimuth = controls.getAzimuthalAngle();
  controls.minPolarAngle = Math.max(0.1, initialPolar - 0.6);
  controls.maxPolarAngle = Math.min(Math.PI / 2 - 0.1, initialPolar + 0.6);
  controls.minAzimuthAngle = initialAzimuth - 0.7;
  controls.maxAzimuthAngle = initialAzimuth + 0.7;
  controls.saveState();
  let dragging = false;
  controls.addEventListener('start', () => {
    dragging = true;
  });
  controls.addEventListener('end', () => {
    dragging = false;
  });
  function levelView() {
    // Flush the accumulated damping before restoring the saved level pose.
    controls.enableDamping = false;
    controls.update();
    controls.reset();
    controls.enableDamping = true;
  }
  function updatePlatform() {
    controls.update();
    let direction = orbitCamera.position.clone().sub(controls.target).normalize();
    let angle = direction.angleTo(initialDirection);
    if (
      !dragging &&
      getElement<HTMLInputElement>('#snap').checked &&
      angle > 0.00001 &&
      angle < (3 * Math.PI) / 180
    ) {
      levelView();
      direction.copy(initialDirection);
      angle = 0;
    }
    const gravity = direction.applyQuaternion(gravityRotation).multiplyScalar(-9.81);
    resources.world.update({gravity: [gravity.x, gravity.y, gravity.z]});
    getElement('#tilt-value').textContent = Math.round((angle * 180) / Math.PI) + '°';
    const angleDegrees = (angle * 180) / Math.PI;
    const isLevel = angleDegrees < 0.5;
    const bubbleHorizontal = -gravity.x;
    const bubbleVertical = gravity.y;
    const bubbleDistance = Math.hypot(bubbleHorizontal, bubbleVertical);
    const bubbleScale = Math.min(
      32 / (9.81 * Math.sin(Math.PI / 4)),
      32 / Math.max(bubbleDistance, 0.001)
    );
    getElement('#level-bubble').style.transform =
      `translate(${bubbleHorizontal * bubbleScale}px, ${bubbleVertical * bubbleScale}px)`;
    getElement('#level-indicator').dataset.level = String(isLevel);
    getElement('#level-state').textContent =
      `${isLevel ? 'Level' : 'Tilted'} · ${angleDegrees.toFixed(1)}°`;
    getElement('#level-dial').setAttribute(
      'aria-label',
      isLevel
        ? 'Bubble centered: platform level'
        : `Platform tilted ${angleDegrees.toFixed(1)} degrees; bubble points uphill`
    );
  }

  updatePlatform();
  const shared = `struct Camera {matrix: mat4x4f, right: vec4f, up: vec4f}; @group(0) @binding(0) var<uniform> camera: Camera;`;
  const sphereSource =
    shared +
    `
@group(0) @binding(1) var<storage, read> positions: array<vec4f>;
@group(0) @binding(2) var<storage, read> orientations: array<vec4f>;
struct VertexOutput {
 @builtin(position) position: vec4f,
 @location(0) corner: vec2f,
 @location(1) color: vec3f,
 @location(2) @interpolate(flat) orientation: vec4f,
 @location(3) @interpolate(flat) sphere: vec4f,
};
@vertex fn vertexMain(@builtin(vertex_index) vertexIndex: u32, @builtin(instance_index) instanceIndex: u32) -> VertexOutput {
 let corners = array<vec2f, 6>(vec2f(-1,-1),vec2f(1,-1),vec2f(-1,1),vec2f(-1,1),vec2f(1,-1),vec2f(1,1));
 let corner = corners[vertexIndex]; let sphere = positions[instanceIndex];
 var output: VertexOutput;
 output.position = camera.matrix * vec4f(sphere.xyz + sphere.w * (camera.right.xyz * corner.x + camera.up.xyz * corner.y), 1);
 output.corner = corner; output.sphere = sphere; output.orientation = orientations[instanceIndex];
 output.color = vec3f(0.45 + 0.35 * fract(f32(instanceIndex) * 0.173), 0.65 + 0.25 * fract(f32(instanceIndex) * 0.37), 0.95);
 return output;
}
struct FragmentOutput {@location(0) color: vec4f, @builtin(frag_depth) depth: f32};
@fragment fn fragmentMain(input: VertexOutput) -> FragmentOutput {
 let squared = dot(input.corner, input.corner); if (squared > 1) {discard;}
 let cameraNormal = vec3f(input.corner, sqrt(max(0.0, 1.0 - squared)));
 let normal = camera.right.xyz * cameraNormal.x + camera.up.xyz * cameraNormal.y + cross(camera.right.xyz, camera.up.xyz) * cameraNormal.z;
 let conjugate = -input.orientation.xyz;
 let localNormal = normal + 2.0 * cross(conjugate, cross(conjugate, normal) + input.orientation.w * normal);
 // One great-circle band, anchored to the simulated body rather than the camera.
 let bandDistance = abs(localNormal.z);
 let edgeWidth = max(fwidth(bandDistance), 0.003);
 let band = 1.0 - smoothstep(0.13 - edgeWidth, 0.13 + edgeWidth, bandDistance);
 let base = mix(input.color, vec3f(0.025, 0.055, 0.085), band);
 let light = 0.25 + 0.75 * max(dot(normal, normalize(vec3f(-0.4, -0.5, 1))), 0);
 let surface = camera.matrix * vec4f(input.sphere.xyz + normal * input.sphere.w, 1);
 var output: FragmentOutput; output.color = vec4f(base * light, 1); output.depth = surface.z / surface.w;
 return output;
}`;
  const floorSource =
    shared +
    `
struct VertexOutput {@builtin(position) position: vec4f, @location(0) point: vec2f};
@vertex fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
 let corners = array<vec2f,6>(vec2f(-1,-1),vec2f(1,-1),vec2f(-1,1),vec2f(-1,1),vec2f(1,-1),vec2f(1,1));
 var output: VertexOutput; output.point = corners[vertexIndex] * camera.right.w;
 output.position = camera.matrix * vec4f(output.point, 0, 1); return output;
}
@fragment fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
 let line = min(abs(fract(input.point.x + 0.5) - 0.5), abs(fract(input.point.y + 0.5) - 0.5));
 return vec4f(select(vec3f(0.16,0.22,0.29), vec3f(0.3,0.39,0.46), line < 0.025), 1);
}`;
  const parameters: Parameters = {
    depthWriteEnabled: true,
    depthCompare: 'less-equal',
    depthFormat: 'depth24plus'
  };
  const spheres = new Model(device, {
    id: 'rotating-spheres',
    source: sphereSource,
    vertexCount: 6,
    instanceCount: resources.count,
    parameters,
    bindings: {camera, positions: resources.positions, orientations: resources.orientations},
    shaderLayout: {
      attributes: [],
      bindings: [
        {name: 'camera', type: 'uniform', group: 0, location: 0},
        {name: 'positions', type: 'read-only-storage', group: 0, location: 1, visibility: 1},
        {name: 'orientations', type: 'read-only-storage', group: 0, location: 2, visibility: 1}
      ]
    }
  });
  const floor = new Model(device, {
    id: 'floor-grid',
    source: floorSource,
    vertexCount: 6,
    parameters,
    bindings: {camera},
    shaderLayout: {
      attributes: [],
      bindings: [{name: 'camera', type: 'uniform', group: 0, location: 0}]
    }
  });
  let paused = false;
  let loading = false;
  let previous = performance.now();
  let accumulator = 0;
  let speed = 1.5;
  let sampling = false;
  let lastSample = 0;
  let lastFrame = performance.now();
  let frameMilliseconds = 0;
  let encodeMilliseconds = 0;
  let samplingPromise: Promise<void> = Promise.resolve();
  let benchmark: SphereBenchmark | undefined;
  let lastReport: object | undefined;
  const percentile = (values: number[], fraction: number): number => {
    const sorted = [...values].sort((first, second) => first - second);
    return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))] ?? 0;
  };
  function resetView(): void {
    orbitCamera.position.set(0, -resources.halfExtent * 3.6, resources.halfExtent * 4.3 + 2);
    controls.target.set(0, 0, 2);
    controls.update();
    controls.saveState();
    initialDirection = orbitCamera.position.clone().sub(controls.target).normalize();
    gravityRotation = new Quaternion().setFromUnitVectors(initialDirection, new Vector3(0, 0, 1));
    levelView();
    updatePlatform();
  }
  getElement('#pause').onclick = () => {
    paused = !paused;
    getElement('#pause').textContent = paused ? 'Resume' : 'Pause';
  };
  getElement('#reset').onclick = () => {
    resetSpheres(resources);
    accumulator = 0;
  };
  getElement('#speed').oninput = () => {
    speed = Number(getElement<HTMLInputElement>('#speed').value);
    getElement('#speed-value').textContent = speed.toFixed(1) + '×';
  };
  getElement('#sensitivity').oninput = () => {
    controls.rotateSpeed = Number(getElement<HTMLInputElement>('#sensitivity').value);
    getElement('#sensitivity-value').textContent = controls.rotateSpeed.toFixed(2);
  };
  getElement('#level').onclick = levelView;
  getElement('#spheres').addEventListener('dblclick', levelView);
  getElement('#scene').onchange = () =>
    getElement('#body-count').dispatchEvent(new Event('change'));
  getElement('#body-count').onchange = async () => {
    if (loading || benchmark) return;
    loading = true;
    getElement<HTMLSelectElement>('#scene').disabled = true;
    getElement<HTMLSelectElement>('#body-count').disabled = true;
    status.value = 'Compiling sphere world…';
    try {
      const next = await createResources(
        Number(getElement<HTMLSelectElement>('#body-count').value)
      );
      await samplingPromise;
      const old = resources;
      resources = next;
      spheres.setBindings({positions: next.positions, orientations: next.orientations});
      spheres.setInstanceCount(next.count);
      destroyResources(old);
      resetView();
      accumulator = 0;
    } catch (error) {
      status.value = String(error);
    } finally {
      restoreSceneControls();
      loading = false;
    }
  };
  getElement('#benchmark').onclick = () => {
    if (loading || benchmark) return;
    resetView();
    resetSpheres(resources);
    accumulator = 0;
    paused = false;
    getElement('#pause').textContent = 'Pause';
    controls.enabled = false;
    for (const identifier of ['body-count', 'scene', 'reset', 'pause', 'benchmark'])
      getElement<HTMLButtonElement>('#' + identifier).disabled = true;
    benchmark = createSphereBenchmark();
    lastReport = undefined;
    getElement<HTMLButtonElement>('#download-report').disabled = true;
  };
  getElement('#download-report').onclick = () => {
    if (!lastReport) return;
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(lastReport, null, 2)], {type: 'application/json'})
    );
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'sphere-world-benchmark.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };
  resetView();
  function renderFrame(now: number): void {
    try {
      if (gpuError) throw gpuError;
      frameMilliseconds = now - lastFrame;
      lastFrame = now;
      const elapsed = Math.min((now - previous) / 1000, 0.1);
      previous = now;
      updatePlatform();
      encodeMilliseconds = 0;
      if (!paused && !loading && !benchmark?.finishing) {
        const clock = advanceSphereClock(accumulator, elapsed, speed, Boolean(benchmark));
        const steps = clock.steps;
        accumulator = clock.accumulator;
        for (let step = 0; step < steps; step++) {
          const sample = step === 0 && now - lastSample >= 500 && !sampling;
          const querySet =
            sample && device.features.has('timestamp-query')
              ? device.createQuerySet({
                  type: 'timestamp',
                  count: resources.graph.stats.nodeOrder.length * 2
                })
              : null;
          const encoder = device.createCommandEncoder({timeProfilingQuerySet: querySet});
          const encoding = resources.graph.encode(encoder, {
            parameters: undefined,
            coalesceComputePasses: !querySet
          });
          encodeMilliseconds += encoding.stats.cpuEncodeTimeMilliseconds;
          device.submit(encoder.finish());
          if (sample) {
            lastSample = now;
            sampling = true;
            const target = resources;
            const submittedBenchmark = benchmark;
            const measured = submittedBenchmark?.warmup === 0;
            samplingPromise = (async () => {
              try {
                const diagnostics = decodeGPUSphereWorldDiagnostics(
                  new Uint32Array((await target.world.diagnostics!.readAsync()).buffer)
                );
                const timing = querySet ? await encoding.readTimings() : undefined;
                recordSphereBenchmarkSample(
                  submittedBenchmark,
                  benchmark,
                  measured,
                  diagnostics,
                  timing?.gpuTimeMilliseconds
                );
                const memory =
                  target.graph.stats.physicalTransientResourceBytes + target.count * 80 + 144;
                getElement('#metrics').textContent =
                  `${(1000 / Math.max(frameMilliseconds, 1)).toFixed(0)} fps · frame ${frameMilliseconds.toFixed(1)} ms · encode ${encodeMilliseconds.toFixed(2)} ms · GPU ${timing?.gpuTimeMilliseconds?.toFixed(2) ?? 'unavailable'} ms\n${diagnostics.contacts} contacts · ${diagnostics.candidateTests} candidates\n${diagnostics.exhaustedCandidateBodies} candidate budgets exhausted · ${diagnostics.sleepingBodies} sleeping · ${diagnostics.droppedContacts} dropped · ${diagnostics.invalidBodies} invalid\nPhysics buffers ${(memory / 1048576).toFixed(2)} MiB`;
                status.value =
                  diagnostics.droppedContacts ||
                  diagnostics.invalidBodies ||
                  diagnostics.exhaustedCandidateBodies ||
                  diagnostics.exhaustedImpactSteps
                    ? 'Capacity exceeded: inspect dropped/invalid counters'
                    : `${target.count.toLocaleString()} spheres · grid broad phase · WebGPU`;
              } finally {
                querySet?.destroy();
                sampling = false;
              }
            })().catch(error => {
              if (submittedBenchmark && submittedBenchmark === benchmark)
                submittedBenchmark.samplingErrors++;
              status.value = String(error);
            });
          }
        }
      }
      if (benchmark && !benchmark.finishing) {
        if (benchmark.warmup > 0) benchmark.warmup--;
        else {
          benchmark.frames.push(frameMilliseconds);
          benchmark.encoding.push(encodeMilliseconds);
        }
        getElement('#benchmark-status').textContent =
          `Benchmark ${benchmark.frames.length}/300 frames`;
        if (benchmark.frames.length >= 300) {
          benchmark.finishing = true;
          const completedBenchmark = benchmark;
          // Finish after the last in-flight readback so its timing and validity reach the report.
          void samplingPromise.then(() => {
            if (benchmark !== completedBenchmark) return;
            lastReport = {
              bodyCount: resources.count,
              date: new Date().toISOString(),
              adapter: device.info,
              timeStep: resources.world.timeStep,
              iterations: resources.world.iterations,
              maximumContacts: resources.world.maximumContacts,
              frameMedianMilliseconds: percentile(completedBenchmark.frames, 0.5),
              frameP95Milliseconds: percentile(completedBenchmark.frames, 0.95),
              encodeMedianMilliseconds: percentile(completedBenchmark.encoding, 0.5),
              gpuMedianMilliseconds: completedBenchmark.gpu.length
                ? percentile(completedBenchmark.gpu, 0.5)
                : null,
              scenario: resources.scene,
              maximumCandidateTests: resources.world.maximumCandidateTests,
              maximumExhaustedCandidateBodies: completedBenchmark.maximumExhaustedCandidateBodies,
              diagnosticSamples: completedBenchmark.diagnosticSamples,
              maximumDroppedContacts: completedBenchmark.maximumDroppedContacts,
              maximumInvalidBodies: completedBenchmark.maximumInvalidBodies,
              samplingErrors: completedBenchmark.samplingErrors,
              valid:
                completedBenchmark.maximumExhaustedCandidateBodies === 0 &&
                completedBenchmark.diagnosticSamples > 0 &&
                completedBenchmark.maximumDroppedContacts === 0 &&
                completedBenchmark.maximumInvalidBodies === 0 &&
                completedBenchmark.samplingErrors === 0,
              diagnosticCoverage:
                'Sampled during warmup and measurement; not an every-step guarantee.',
              notes:
                '30 warmup + 300 frames; one fixed simulation step per frame; frame duration includes display pacing.'
            };
            getElement('#benchmark-status').textContent =
              `${completedBenchmark.maximumExhaustedCandidateBodies || completedBenchmark.maximumDroppedContacts || completedBenchmark.maximumInvalidBodies || completedBenchmark.samplingErrors || !completedBenchmark.diagnosticSamples ? 'INVALID · ' : ''}300 frames · frame median ${percentile(completedBenchmark.frames, 0.5).toFixed(1)} ms · p95 ${percentile(completedBenchmark.frames, 0.95).toFixed(1)} ms · encode median ${percentile(completedBenchmark.encoding, 0.5).toFixed(2)} ms · GPU median ${completedBenchmark.gpu.length ? percentile(completedBenchmark.gpu, 0.5).toFixed(2) : 'unavailable'} ms`;
            getElement<HTMLButtonElement>('#download-report').disabled = false;
            benchmark = undefined;
            controls.enabled = true;
            for (const identifier of ['body-count', 'scene', 'reset', 'pause', 'benchmark'])
              getElement<HTMLButtonElement>('#' + identifier).disabled = false;
            accumulator = 0;
            previous = performance.now();
          });
        }
      }
      const view = new Matrix4().lookAt({
        eye: orbitCamera.position.toArray(),
        center: controls.target.toArray(),
        up: [0, 0, 1]
      });
      const matrix = new Matrix4()
        .perspective({
          fovy: Math.PI / 4,
          aspect: device.canvasContext!.getAspect(),
          near: 0.1,
          far: 1000
        })
        .multiplyRight(view);
      const cameraData = new Float32Array(24);
      cameraData.set(matrix);
      cameraData.set([view[0], view[4], view[8], resources.halfExtent], 16);
      cameraData.set([view[1], view[5], view[9], 0], 20);
      camera.write(cameraData);
      const pass = device.beginRenderPass({clearColor: [0.04, 0.065, 0.1, 1], clearDepth: 1});
      floor.draw(pass);
      spheres.draw(pass);
      pass.end();
      device.submit();
      requestAnimationFrame(renderFrame);
    } catch (error) {
      status.value = String(error);
    }
  }
  restoreSceneControls();
  requestAnimationFrame(renderFrame);
  window.addEventListener(
    'pagehide',
    () => {
      void samplingPromise.finally(() => {
        destroyResources(resources);
        camera.destroy();
        spheres.destroy();
        floor.destroy();
        controls.dispose();
        device.destroy();
      });
    },
    {once: true}
  );
} catch (error) {
  status.value = String(error);
}
