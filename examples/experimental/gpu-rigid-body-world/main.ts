// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {luma, Buffer} from '@luma.gl/core';
import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {Model} from '@luma.gl/engine';
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {GPURigidBodyWorld, type GPURigidBody} from '@luma.gl/gpgpu/gpu-physics';
import {PerspectiveCamera} from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {Matrix4} from '@math.gl/core';

const status = document.querySelector<HTMLOutputElement>('#status')!;
const canvas = document.querySelector<HTMLCanvasElement>('#world')!;
const scene = document.querySelector<HTMLSelectElement>('#scene')!;
const controlsButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('button'));
try {
  let failure: Error | null = null;
  const device = await luma.createDevice({
    adapters: [webgpuAdapter],
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
    byteLength: 64,
    usage: Buffer.UNIFORM | Buffer.COPY_DST
  });
  function makeBodies(): GPURigidBody[] {
    const bodies: GPURigidBody[] = [
      {
        shape: {type: 'box', halfExtents: [8, 8, 0.5]},
        position: [0, 0, -0.5],
        mass: 0,
        friction: 0.7
      }
    ];
    if (scene.value === 'impact') {
      bodies.push({
        shape: {type: 'box', halfExtents: [0.8, 0.45, 0.6]},
        position: [0, 0, 0.6],
        mass: 3
      });
      bodies.push({
        shape: {type: 'sphere', radius: 0.35},
        position: [-4, 0.3, 0.7],
        velocity: [6, 0, 0],
        restitution: 0.5
      });
    } else {
      for (let tower = 0; tower < 3; tower++)
        for (let level = 0; level < 5; level++) {
          const angle = tower === 1 ? 0.25 : 0;
          bodies.push({
            shape: {type: 'box', halfExtents: [0.5, 0.5, 0.5]},
            position: [(tower - 1) * 2.5, 0, 0.5 + level * 1.01],
            orientation: [0, 0, Math.sin(angle / 2), Math.cos(angle / 2)],
            friction: 0.7,
            restitution: 0
          });
        }
      if (scene.value === 'mixed')
        for (let index = 0; index < 8; index++)
          bodies.push({
            shape: {type: 'sphere', radius: 0.4},
            position: [(index % 4) - 1.5, -2, 2 + Math.floor(index / 4)],
            restitution: 0.4
          });
    }
    return bodies;
  }
  async function createScene() {
    const bodies = makeBodies();
    const world = new GPURigidBodyWorld({bodies, iterations: 20});
    const definition = new GPUCommandGraph(device);
    world.addToGraph(definition);
    const graph = await definition.compileAsync().catch(error => {
      world.destroy();
      throw error;
    });
    const shapes = device.createBuffer({
      data: new Float32Array(
        bodies.flatMap(body =>
          body.shape.type === 'sphere'
            ? [body.shape.radius, 0, 0, 0]
            : [...body.shape.halfExtents, 1]
        )
      ),
      usage: Buffer.STORAGE
    });
    const model = new Model(device, {
      id: 'rigid-body-shapes',
      source: `
@group(0) @binding(0) var<uniform> matrix: mat4x4f;
@group(0) @binding(1) var<storage,read> positions: array<vec4f>;
@group(0) @binding(2) var<storage,read> orientations: array<vec4f>;
@group(0) @binding(3) var<storage,read> shapes: array<vec4f>;
struct Output {@builtin(position) position: vec4f, @location(0) normal: vec3f, @location(1) color: vec3f}
fn rotate(rotation: vec4f, vector: vec3f)->vec3f {return vector+2.0*cross(rotation.xyz,cross(rotation.xyz,vector)+rotation.w*vector);}
@vertex fn vertexMain(@builtin(vertex_index) vertex: u32,@builtin(instance_index) body: u32)->Output {
 let corners=array<vec2f,6>(vec2f(0,0),vec2f(1,0),vec2f(0,1),vec2f(0,1),vec2f(1,0),vec2f(1,1));
 let corner=corners[vertex%6u];var point=vec3f(0);var normal=vec3f(0);
 if(shapes[body].w==0.0) {
  let tile=vertex/6u;let longitude=(f32(tile%16u)+corner.x)*6.2831853/16.0;let latitude=(f32(tile/16u)+corner.y)*3.14159265/12.0;
  normal=vec3f(cos(longitude)*sin(latitude),sin(longitude)*sin(latitude),cos(latitude));point=normal*shapes[body].x;
 } else {
  let face=(vertex/6u)%6u;let axis=face/2u;let direction=select(-1.0,1.0,face%2u==0u);normal[axis]=direction;point[axis]=direction;
  point[(axis+1u)%3u]=corner.x*2.0-1.0;point[(axis+2u)%3u]=corner.y*2.0-1.0;point*=shapes[body].xyz;
  // Remaining sphere tessellation vertices collapse for boxes.
  if(vertex>=36u) {point=vec3f(0);}
 }
 var output:Output;output.position=matrix*vec4f(positions[body].xyz+rotate(orientations[body],point),1);
 output.normal=rotate(orientations[body],normal);output.color=select(vec3f(0.28+0.45*fract(f32(body)*0.27),0.48+0.25*fract(f32(body)*0.39),0.42+0.25*fract(f32(body)*0.17)),vec3f(0.68,0.73,0.67),body==0u);return output;
}
@fragment fn fragmentMain(input:Output)->@location(0) vec4f {return vec4f(input.color*(0.35+0.65*max(0.0,dot(normalize(input.normal),normalize(vec3f(-0.5,-0.7,1))))),1);}
`,
      vertexCount: 16 * 12 * 6,
      instanceCount: bodies.length,
      parameters: {depthWriteEnabled: true, depthCompare: 'less-equal', depthFormat: 'depth24plus'},
      bindings: {
        matrix: cameraBuffer,
        positions: world.positions!,
        orientations: world.orientations!,
        shapes
      },
      shaderLayout: {
        attributes: [],
        bindings: [
          {name: 'matrix', group: 0, location: 0, type: 'uniform'},
          ...['positions', 'orientations', 'shapes'].map((name, index) => ({
            name,
            group: 0,
            location: index + 1,
            type: 'read-only-storage' as const,
            visibility: 1
          }))
        ]
      }
    });
    return {world, graph, model, shapes, bodies};
  }
  let resources = await createScene();
  let paused = false;
  let loading = false;
  let alive = true;
  let previous = performance.now();
  let accumulator = 0;
  let snapshot: Promise<void> | null = null;
  let pushing: Promise<void> | null = null;
  let rebuilding: Promise<typeof resources> | null = null;
  let lastSample = 0;
  let animation = 0;
  let elapsedSimulation = 0;
  const destroy = (target: typeof resources) => {
    target.model.destroy();
    target.graph.destroy();
    target.world.destroy();
    target.shapes.destroy();
  };
  async function reset() {
    if (loading || !alive) return;
    loading = true;
    controlsButtons.forEach(button => {
      button.disabled = true;
    });
    scene.disabled = true;
    try {
      await Promise.all([snapshot, pushing]);
      if (!alive) return;
      rebuilding = createScene();
      const replacement = await rebuilding;
      if (!alive) {
        destroy(replacement);
        return;
      }
      destroy(resources);
      resources = replacement;
      accumulator = 0;
      elapsedSimulation = 0;
    } catch (error) {
      failure = error instanceof Error ? error : new Error(String(error));
    } finally {
      rebuilding = null;
      loading = false;
      controlsButtons.forEach(button => {
        button.disabled = false;
      });
      scene.disabled = false;
    }
  }
  document.querySelector<HTMLButtonElement>('#reset')!.onclick = reset;
  scene.onchange = reset;
  const pauseButton = document.querySelector<HTMLButtonElement>('#pause')!;
  pauseButton.onclick = () => {
    paused = !paused;
    pauseButton.textContent = paused ? 'Resume' : 'Pause';
  };
  document.querySelector<HTMLButtonElement>('#push')!.onclick = () => {
    if (loading || !alive || pushing) return;
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
      return;
    }
    const elapsed = Math.min(0.05, (now - previous) / 1000);
    previous = now;
    if (!loading && !paused) {
      accumulator = Math.min(accumulator + elapsed, 4 / 120);
      const encoder = device.createCommandEncoder();
      while (accumulator >= 1 / 120) {
        resources.graph.encode(encoder, {parameters: undefined});
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
    if (!loading && !snapshot && now - lastSample > 500) {
      lastSample = now;
      const target = resources;
      snapshot = target.world
        .readState()
        .then(states => {
          if (alive && target === resources)
            status.value = `${states.length - 1} dynamic bodies · ${states.filter(body => body.sleeping).length} sleeping\n${elapsedSimulation.toFixed(1)} s simulated · ${target.graph.stats.nodeOrder.length} GPU operations`;
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
      void Promise.allSettled([snapshot, pushing, rebuilding]).then(() => {
        destroy(resources);
        cameraBuffer.destroy();
        device.destroy();
      });
    },
    {once: true}
  );
} catch (error) {
  status.value = String(error);
}
