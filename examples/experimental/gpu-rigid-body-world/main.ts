// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {luma, Buffer} from '@luma.gl/core';
import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {Model} from '@luma.gl/engine';
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {GPURigidBodyWorld} from '@luma.gl/gpgpu/gpu-physics';
import {PerspectiveCamera} from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {Matrix4} from '@math.gl/core';
import {GPUGraphDiagnostics} from '../../gpu-graph-diagnostics';
import {createRigidBodyPanel} from './info-box';
import {
  makeRigidBodyScene,
  getRigidBodySceneGravity,
  isRigidBodyScene,
  RIGID_BODY_SCENES
} from './scenes';

const status = document.querySelector<HTMLOutputElement>('#status')!;
const canvas = document.querySelector<HTMLCanvasElement>('#world')!;
const scene = document.querySelector<HTMLSelectElement>('#scene')!;
const solver = document.querySelector<HTMLSelectElement>('#solver')!;
const iterations = document.querySelector<HTMLSelectElement>('#iterations')!;
const autoPlay = document.querySelector<HTMLInputElement>('#auto-play')!;
const playbackStatus = document.querySelector<HTMLOutputElement>('#playback-status')!;
const diagnostics = new GPUGraphDiagnostics({traceTitle: 'GPU Graph Timeline'});
const panel = createRigidBodyPanel(diagnostics);
const controlsButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('button'));
try {
  let failure: Error | null = null;
  const device = await luma.createDevice({
    adapters: [webgpuAdapter],
    optionalFeatures: ['timestamp-query'],
    createCanvasContext: {canvas, autoResize: true},
    onError: error => {
      failure = error;
    }
  });
  const camera = new PerspectiveCamera(45, 1, 0.1, 200);
  camera.up.set(0, 0, 1);
  camera.position.set(11, -16, 12);
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 0, 2);
  controls.update();
  const cameraBuffer = device.createBuffer({
    id: 'rigid-body-camera',
    byteLength: 64,
    usage: Buffer.UNIFORM | Buffer.COPY_DST
  });
  async function createScene() {
    const sceneName = isRigidBodyScene(scene.value) ? scene.value : 'stack';
    const bodies = makeRigidBodyScene(sceneName);
    const world = new GPURigidBodyWorld({
      bodies,
      iterations: Number(iterations.value),
      solver: solver.value === 'ordered' ? 'ordered' : 'parallel',
      broadPhase: 'hierarchical-grid',
      gravity: getRigidBodySceneGravity(sceneName)
    });
    document.querySelector('#description')!.textContent = RIGID_BODY_SCENES[sceneName].description;
    const definition = new GPUCommandGraph(device);
    world.addToGraph(definition);
    const graph = await definition.compileAsync().catch(error => {
      world.destroy();
      throw error;
    });
    const meshVerticesData: number[] = [];
    let vertexCount = 16 * 12 * 6;
    const shapes = device.createBuffer({
      data: new Float32Array(
        bodies.flatMap(body => {
          const shape = body.shape ?? body.colliders?.[0]?.shape;
          if (!shape) throw new Error('This renderer requires centered shapes');
          if (shape.type === 'sphere') return [shape.radius, 0, 0, 0];
          if (shape.type === 'box') return [...shape.halfExtents, body.mass === 0 ? 2 : 1];
          if (shape.type === 'triangle-mesh' || shape.type === 'convex-hull') {
            const firstVertex = meshVerticesData.length / 4;
            for (const index of shape.geometry.indices) {
              const offset = index * 3;
              meshVerticesData.push(
                shape.geometry.positions[offset],
                shape.geometry.positions[offset + 1],
                shape.geometry.positions[offset + 2],
                0
              );
            }
            vertexCount = Math.max(vertexCount, shape.geometry.indices.length);
            return [firstVertex, shape.geometry.indices.length, body.mass === 0 ? 1 : 0, 3];
          }
          throw new Error('The lab renderer supports boxes, spheres and cooked mesh shapes');
        })
      ),
      usage: Buffer.STORAGE
    });
    const meshVertices = device.createBuffer({
      id: 'lab-mesh-vertices',
      data: new Float32Array(meshVerticesData.length ? meshVerticesData : [0, 0, 0, 0]),
      usage: Buffer.STORAGE
    });
    const model = new Model(device, {
      id: 'rigid-body-shapes',
      source: `
@group(0) @binding(0) var<uniform> matrix: mat4x4f;
@group(0) @binding(1) var<storage,read> positions: array<vec4f>;
@group(0) @binding(2) var<storage,read> orientations: array<vec4f>;
@group(0) @binding(3) var<storage,read> shapes: array<vec4f>;
@group(0) @binding(4) var<storage,read> sleepStates: array<vec4f>;
@group(0) @binding(5) var<storage,read> meshVertices: array<vec4f>;
struct Output {@builtin(position) position: vec4f, @location(0) normal: vec3f, @location(1) color: vec3f, @location(2) localNormal: vec3f, @location(3) @interpolate(flat) sphere: f32}
fn rotate(rotation: vec4f, vector: vec3f)->vec3f {return vector+2.0*cross(rotation.xyz,cross(rotation.xyz,vector)+rotation.w*vector);}
@vertex fn vertexMain(@builtin(vertex_index) vertex: u32,@builtin(instance_index) body: u32)->Output {
 let corners=array<vec2f,6>(vec2f(0,0),vec2f(1,0),vec2f(0,1),vec2f(0,1),vec2f(1,0),vec2f(1,1));
 let corner=corners[vertex%6u];var point=vec3f(0);var normal=vec3f(0);
 if(shapes[body].w==3.0) {
  if(vertex<u32(shapes[body].y)) {
   let first=u32(shapes[body].x)+(vertex/3u)*3u;
   point=meshVertices[u32(shapes[body].x)+vertex].xyz;
   normal=normalize(cross(meshVertices[first+1u].xyz-meshVertices[first].xyz,meshVertices[first+2u].xyz-meshVertices[first].xyz));
  } else {normal=vec3f(0,0,1);}
 } else if(shapes[body].w==0.0) {
  let tile=vertex/6u;let longitude=(f32(tile%16u)+corner.x)*6.2831853/16.0;let latitude=(f32(tile/16u)+corner.y)*3.14159265/12.0;
  normal=vec3f(cos(longitude)*sin(latitude),sin(longitude)*sin(latitude),cos(latitude));point=normal*shapes[body].x;
 } else {
  let face=(vertex/6u)%6u;let axis=face/2u;let direction=select(-1.0,1.0,face%2u==0u);normal[axis]=direction;point[axis]=direction;
  point[(axis+1u)%3u]=corner.x*2.0-1.0;point[(axis+2u)%3u]=corner.y*2.0-1.0;point*=shapes[body].xyz;
  // Remaining sphere tessellation vertices collapse for boxes.
  if(vertex>=36u) {point=vec3f(0);}
 }
 var output:Output;output.position=matrix*vec4f(positions[body].xyz+rotate(orientations[body],point),1);
 output.localNormal=normal;output.sphere=1.0-shapes[body].w;output.normal=rotate(orientations[body],normal);output.color=select(vec3f(0.28+0.45*fract(f32(body)*0.27),0.48+0.25*fract(f32(body)*0.39),0.42+0.25*fract(f32(body)*0.17)),vec3f(0.68,0.73,0.67),(shapes[body].w==2.0||(shapes[body].w==3.0&&shapes[body].z>0.5)));output.color=mix(output.color,vec3f(0.55),select(0.0,0.7,sleepStates[body].y>0.5));return output;
}
@fragment fn fragmentMain(input:Output)->@location(0) vec4f {let band=select(1.0,0.3,input.sphere>0.5&&abs(input.localNormal.z)<0.13);return vec4f(input.color*band*(0.35+0.65*max(0.0,dot(normalize(input.normal),normalize(vec3f(-0.5,-0.7,1))))),1);}
`,
      vertexCount,
      instanceCount: bodies.length,
      parameters: {depthWriteEnabled: true, depthCompare: 'less-equal', depthFormat: 'depth24plus'},
      bindings: {
        matrix: cameraBuffer,
        positions: world.positions!,
        orientations: world.orientations!,
        shapes,
        meshVertices,
        sleepStates: world.sleepStates!
      },
      shaderLayout: {
        attributes: [],
        bindings: [
          {name: 'matrix', group: 0, location: 0, type: 'uniform'},
          ...['positions', 'orientations', 'shapes', 'sleepStates', 'meshVertices'].map(
            (name, index) => ({
              name,
              group: 0,
              location: index + 1,
              type: 'read-only-storage' as const,
              visibility: 1
            })
          )
        ]
      }
    });
    return {
      world,
      graph,
      model,
      shapes,
      meshVertices,
      bodies,
      sceneName,
      capacity: world.getCapacityInfo()
    };
  }
  let resources = await createScene();
  let paused = false;
  let loading = false;
  let alive = true;
  let previous = performance.now();
  let accumulator = 0;
  let submitted: Promise<void> | null = null;
  let snapshot: Promise<void> | null = null;
  let pushing: Promise<void> | null = null;
  let rebuilding: Promise<typeof resources> | null = null;
  let lastSample = 0;
  let animation = 0;
  let elapsedSimulation = 0;
  let playbackStartedAt = 0;
  let quietSince: number | null = null;
  let advanceAt: number | null = null;
  let completionReason = '';
  const restartPlayback = () => {
    quietSince = advanceAt = null;
    completionReason = '';
    playbackStartedAt = elapsedSimulation;
    playbackStatus.value = autoPlay.checked ? 'Auto-play · waiting for the scene to settle' : '';
  };
  autoPlay.onchange = restartPlayback;
  const destroy = (target: typeof resources) => {
    target.model.destroy();
    target.graph.destroy();
    target.world.destroy();
    target.shapes.destroy();
    target.meshVertices.destroy();
  };
  async function reset() {
    if (loading || !alive) return;
    loading = true;
    restartPlayback();
    controlsButtons.forEach(button => {
      button.disabled = true;
    });
    scene.disabled = solver.disabled = iterations.disabled = true;
    try {
      await Promise.all([snapshot, pushing, submitted]);
      if (!alive) return;
      rebuilding = createScene();
      const replacement = await rebuilding;
      if (!alive) {
        destroy(replacement);
        return;
      }
      const changedScene = resources.sceneName !== replacement.sceneName;
      diagnostics.clear();
      destroy(resources);
      resources = replacement;
      if (changedScene)
        camera.position.set(
          resources.sceneName === 'mixed' ? 24 : 11,
          resources.sceneName === 'mixed' ? -30 : -16,
          resources.sceneName === 'mixed' ? 25 : 12
        );
      accumulator = 0;
      elapsedSimulation = 0;
      restartPlayback();
    } catch (error) {
      failure = error instanceof Error ? error : new Error(String(error));
    } finally {
      rebuilding = null;
      loading = false;
      controlsButtons.forEach(button => {
        button.disabled = false;
      });
      scene.disabled = solver.disabled = iterations.disabled = false;
    }
  }
  document.querySelector<HTMLButtonElement>('#reset')!.onclick = reset;
  scene.onchange = reset;
  solver.onchange = reset;
  iterations.onchange = reset;
  const pauseButton = document.querySelector<HTMLButtonElement>('#pause')!;
  pauseButton.onclick = () => {
    paused = !paused;
    restartPlayback();
    pauseButton.textContent = paused ? 'Resume' : 'Pause';
  };
  document.querySelector<HTMLButtonElement>('#push')!.onclick = () => {
    if (loading || !alive || pushing || resources.sceneName === 'impact') return;
    restartPlayback();
    const target = resources;
    pushing = target.world
      .readState()
      .then(states => {
        if (target !== resources || !alive) return;
        const position = states[1].position;
        target.world.applyImpulse(
          1,
          [3, 0, 0],
          [position[0], position[1] + 0.4, position[2] + 0.3]
        );
      })
      .catch(error => {
        failure = error;
      })
      .finally(() => {
        pushing = null;
      });
  };
  function frame(now: number) {
    if (!alive) return;
    if (failure) {
      status.value = failure.message;
      document.querySelector('#startup-error')!.textContent = failure.message;
      return;
    }
    panel.update();
    if (autoPlay.checked && advanceAt !== null && !paused && !loading) {
      playbackStatus.value = `${completionReason} · next scene in ${Math.max(0, Math.ceil((advanceAt - now) / 1000))} s`;
      if (now >= advanceAt) {
        scene.selectedIndex = (scene.selectedIndex + 1) % scene.options.length;
        void reset();
      }
    }
    if (submitted) {
      previous = now;
      animation = requestAnimationFrame(frame);
      return;
    }
    const elapsed = Math.min(0.05, (now - previous) / 1000);
    previous = now;
    if (!loading && !paused && advanceAt === null) {
      accumulator = Math.min(accumulator + elapsed, 4 / 120);
      const encoder = device.createCommandEncoder();
      while (accumulator >= 1 / 120) {
        diagnostics.encode(resources.graph, encoder, {parameters: undefined});
        accumulator -= 1 / 120;
        elapsedSimulation += 1 / 120;
      }
      device.submit(encoder.finish());
    }
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    controls.update();
    camera.updateMatrixWorld();
    const matrix = new Matrix4(camera.projectionMatrix.elements).multiplyRight(
      camera.matrixWorldInverse.elements
    );
    // Three uses OpenGL clip depth; map [-w,w] to WebGPU [0,w].
    const depth = new Matrix4([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.5, 0, 0, 0, 0.5, 1]);
    depth.multiplyRight(matrix);
    cameraBuffer.write(new Float32Array(depth));
    const pass = device.beginRenderPass({clearColor: [0.9, 0.92, 0.89, 1], clearDepth: 1});
    resources.model.draw(pass);
    pass.end();
    device.submit();
    const fence = device.createFence();
    submitted = fence.signaled
      .catch(error => {
        failure = error;
      })
      .finally(() => {
        fence.destroy();
        submitted = null;
      });
    if (!loading && !snapshot && now - lastSample > 500) {
      lastSample = now;
      const target = resources;
      const sampledSimulationTime = elapsedSimulation;
      snapshot = Promise.all([
        target.world.readSimulationDiagnostics(),
        autoPlay.checked ? target.world.readState() : Promise.resolve(null)
      ])
        .then(([counters, states]) => {
          if (!alive || target !== resources) return;
          if (autoPlay.checked && !counters.complete) {
            autoPlay.checked = false;
            restartPlayback();
            playbackStatus.value =
              'Auto-play stopped: incomplete simulation. Reset after correcting capacity.';
          } else if (
            autoPlay.checked &&
            states &&
            !paused &&
            !loading &&
            !pushing &&
            advanceAt === null
          ) {
            const quiet = states.every(
              (body, index) =>
                target.bodies[index].mass === 0 ||
                (Math.hypot(...body.velocity) < 0.04 && Math.hypot(...body.angularVelocity) < 0.04)
            );
            quietSince = quiet ? (quietSince ?? sampledSimulationTime) : null;
            const playbackDuration = sampledSimulationTime - playbackStartedAt;
            const settled =
              playbackDuration >= 3 &&
              quietSince !== null &&
              sampledSimulationTime - quietSince >= 1;
            const duration =
              target.sceneName === 'impact' ? 8 : target.sceneName === 'support' ? 12 : 20;
            if (settled || playbackDuration >= duration) {
              completionReason = settled ? 'Scene settled' : `${duration} s demonstration complete`;
              advanceAt = performance.now() + 2000;
            }
          }
          const memory = target.capacity;
          status.value = `${counters.complete ? '' : 'INCOMPLETE SIMULATION · '}${target.bodies.filter(body => body.mass !== 0).length} moving bodies · ${target.world.solver} solver\n${elapsedSimulation.toFixed(1)} s simulated · ${target.graph.stats.nodeOrder.length} graph nodes\n${counters.maximumCandidatePairs} peak candidate pairs · ${counters.maximumCandidateTests} peak candidate tests\n${counters.incompleteSteps} incomplete steps / ${counters.steps} total · ${(memory.ownedBufferBytes / 1048576).toFixed(2)} MiB world buffers`;
        })
        .catch(error => {
          failure = error;
        })
        .finally(() => {
          snapshot = null;
        });
    }
    animation = requestAnimationFrame(frame);
  }
  animation = requestAnimationFrame(frame);
  window.addEventListener(
    'pagehide',
    () => {
      alive = false;
      cancelAnimationFrame(animation);
      controls.dispose();
      void Promise.allSettled([snapshot, pushing, rebuilding, submitted]).then(() => {
        destroy(resources);
        panel.destroy();
        cameraBuffer.destroy();
        device.destroy();
      });
    },
    {once: true}
  );
} catch (error) {
  status.value = String(error);
  document.querySelector('#startup-error')!.textContent = String(error);
}
