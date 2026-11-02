// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {luma, Buffer} from '@luma.gl/core';
import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {Model} from '@luma.gl/engine';
import {createPBRModel, shadow} from '@luma.gl/anari';
import {RigidBodyShadows, LAB_SPOTLIGHT} from './rigid-body-shadows';
import {makeRigidBodyVertexShader, rigidBodyPose} from './rigid-body-shaders';
import {createLabMaterial} from './lab-material';
import {DominoAudio} from './domino-audio';
import {GPUCommandGraph} from '@luma.gl/graph/gpu-core';
import {GPURigidBodyWorld} from '@luma.gl/graph/gpu-physics';
import {PerspectiveCamera} from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {Matrix4} from '@math.gl/core';
import {GPUGraphDiagnostics} from '../../gpu-graph-diagnostics';
import {makeMechanism} from './mechanisms';
import {WRECKING_BALL_PHYSICS, WRECKING_BALL_TIME_STEP} from './wrecking-ball';
import {CradleScene} from './cradle-scene';
import {createRigidBodyPanel} from './info-box';
import {
  makeRigidBodyScene,
  getRigidBodySceneGravity,
  isRigidBodyScene,
  RIGID_BODY_SCENES,
  DOMINO_PHYSICS
} from './scenes';

const status = document.querySelector<HTMLOutputElement>('#status')!;
const canvas = document.querySelector<HTMLCanvasElement>('#world')!;
const scene = document.querySelector<HTMLSelectElement>('#scene')!;
const initialScene =
  document.body.dataset.scene ?? new URLSearchParams(window.location.search).get('scene');
if (initialScene && isRigidBodyScene(initialScene)) scene.value = initialScene;
const isWreckingBallExample = document.body.dataset.scene === 'wreckingBall';
const solver = document.querySelector<HTMLSelectElement>('#solver')!;
const iterations = document.querySelector<HTMLSelectElement>('#iterations')!;
const dominoAudio = new DominoAudio();
const sound = document.querySelector<HTMLInputElement>('#sound')!;
sound.onchange = () => {
  dominoAudio.enabled = sound.checked;
  dominoAudio.unlock();
};
canvas.addEventListener('pointerdown', () => dominoAudio.unlock());
const autoPlay = document.querySelector<HTMLInputElement>('#auto-play')!;
const playbackStatus = document.querySelector<HTMLOutputElement>('#playback-status')!;
const diagnostics = new GPUGraphDiagnostics({traceTitle: 'GPU Graph Timeline'});
const panel = createRigidBodyPanel(
  diagnostics,
  isWreckingBallExample ? 'Wrecking Ball' : 'Rigid Body Lab',
  isWreckingBallExample ? 'GPU physics · 204 blocks and a heavy pendulum' : undefined
);
if (isWreckingBallExample) {
  scene.hidden = true;
  sound.closest('label')!.style.display = 'none';
  autoPlay.closest('label')!.style.display = 'none';
  document.querySelector<HTMLButtonElement>('#push')!.hidden = true;
  solver.disabled = true;
}
const controlsButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('button'));
try {
  let failure: Error | null = null;
  const device = await luma.createDevice({
    adapters: [webgpuAdapter],
    optionalFeatures: ['timestamp-query'],
    createCanvasContext: {
      canvas,
      autoResize: true,
      useDevicePixels: Math.max(2, window.devicePixelRatio)
    },
    onError: error => {
      failure = error;
    }
  });
  const camera = new PerspectiveCamera(45, 1, 0.1, 200);
  camera.up.set(0, 0, 1);
  if (scene.value === 'wreckingBall') camera.position.set(24, -30, 22);
  else camera.position.set(13, -19, 19);
  const controls = new OrbitControls(camera, canvas);
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.5;
  controls.addEventListener('start', () => {
    controls.autoRotate = false;
  });
  let lastOrbitTime = performance.now();
  controls.target.set(
    scene.value === 'wreckingBall' ? -2 : 0,
    0,
    scene.value === 'wreckingBall' ? 4 : 2
  );
  controls.update();
  const cameraBuffer = device.createBuffer({
    id: 'rigid-body-camera',
    byteLength: 64,
    usage: Buffer.UNIFORM | Buffer.COPY_DST
  });

  let previousSceneName: string | null = null;
  async function createScene() {
    const sceneName = isRigidBodyScene(scene.value) ? scene.value : 'stack';
    if (sceneName !== previousSceneName) {
      iterations.value = sceneName === 'cradle' ? '8' : sceneName === 'wreckingBall' ? '16' : '32';
      if (sceneName === 'dominoSpiral' || sceneName === 'wreckingBall') solver.value = 'parallel';
      previousSceneName = sceneName;
    }
    const mechanism = makeMechanism(sceneName);
    const bodies = mechanism?.bodies ?? makeRigidBodyScene(sceneName);
    if (mechanism && sceneName !== 'wreckingBall') solver.value = 'ordered';
    const world = new GPURigidBodyWorld({
      bodies,
      publicationBounds:
        sceneName === 'cradle'
          ? bodies.map(body => {
              const shape = body.shape!;
              if (shape.type !== 'sphere' && shape.type !== 'box')
                throw new Error('Cradle visual bounds require primitive geometry');
              const extent: [number, number, number] =
                shape.type === 'sphere'
                  ? [shape.radius, shape.radius, shape.radius]
                  : [...shape.halfExtents];
              return [[-extent[0], -extent[1], -extent[2]], extent] as const;
            })
          : undefined,
      joints: mechanism?.joints,
      ...(sceneName === 'dominoSpiral'
        ? {...DOMINO_PHYSICS, eventCapacity: 512, impactImpulseThreshold: 0.15}
        : {}),
      ...(sceneName === 'wreckingBall' ? WRECKING_BALL_PHYSICS : {}),
      failurePolicy: 'rollback',
      // Resolve the cradle's closely spaced elastic impacts before the next pair closes.
      timeStep:
        sceneName === 'cradle'
          ? 1 / 480
          : sceneName === 'wreckingBall'
            ? WRECKING_BALL_TIME_STEP
            : sceneName === 'dominoSpiral'
              ? 1 / 60
              : 1 / 120,
      ...(sceneName === 'cradle'
        ? {restitutionThreshold: 0.05, linearDamping: 0.08, angularDamping: 0.12}
        : {}),
      ...(sceneName === 'continuous' ? {continuous: {bodies: [0]}} : {}),
      iterations: Number(iterations.value),
      solver: solver.value === 'ordered' ? 'ordered' : 'parallel',
      broadPhase: sceneName === 'cradle' ? 'all-pairs' : 'hierarchical-grid',
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
    const longitudeSegments = sceneName === 'cradle' ? 64 : 16;
    const latitudeSegments = sceneName === 'cradle' ? 32 : 12;
    let vertexCount = sceneName === 'dominoSpiral' ? 36 : longitudeSegments * latitudeSegments * 6;
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
    const surface = sceneName === 'cradle' ? null : createLabMaterial(device, bodies, sceneName);
    const model =
      sceneName === 'cradle'
        ? null
        : createPBRModel(device, {
            id: 'rigid-body-shapes',
            material: surface!.material,
            defines: {
              HAS_NORMALS: true,
              HAS_TANGENTS: true,
              HAS_UV: true,
              HAS_UV_1: true,
              USE_LIGHTS: true,
              USE_IBL: true,
              USE_SCENE_ENVIRONMENT: true,
              USE_TEX_LOD: true,
              USE_SCENE_COLOR_MANAGEMENT: true
            },
            modules: [rigidBodyPose, shadow],
            source: `
${makeRigidBodyVertexShader(sceneName, bodies.length, longitudeSegments, latitudeSegments)}
fn grainHash(point:vec2f)->f32{return fract(sin(dot(point,vec2f(127.1,311.7)))*43758.5453);}
fn surfaceGrain(point:vec2f)->f32{
 let cell=floor(point);let fraction=fract(point);let weight=fraction*fraction*(3.0-2.0*fraction);
 return mix(mix(grainHash(cell),grainHash(cell+vec2f(1,0)),weight.x),mix(grainHash(cell+vec2f(0,1)),grainHash(cell+vec2f(1,1)),weight.x),weight.y);
}
@fragment fn fragmentMain(input:Output)->@location(0) vec4f {
 let band=select(1.0,0.3,input.sphere>0.5&&abs(input.localNormal.z)<0.13);
 var colorValue=input.color*band;

 ${
   sceneName === 'dominoSpiral' || sceneName === 'wreckingBall'
     ? `

 let distanceToPip=min(length(input.localPoint.yz-vec2f(0,0.38)),length(input.localPoint.yz+vec2f(0,0.38)));
 let edge=max(fwidth(distanceToPip),0.001);
 let grain=surfaceGrain((input.localPoint.xy+input.localPoint.z*vec2f(0.73,0.29))*75.0);
 var color=vec3f(0.20,0.23,0.24)*(0.94+grain*0.12);

 if(input.body>0u){
  color=vec3f(0.018,0.022,0.028)*(0.87+grain*0.26);

  if(abs(input.localNormal.x)>0.9){
   let pip=1.0-smoothstep(0.085-edge,0.085+edge,distanceToPip);
   let divider=(1.0-smoothstep(0.006,0.013,abs(input.localPoint.z)))*select(0.0,1.0,abs(input.localPoint.y)<0.27);
   color=mix(color,vec3f(0.85,0.83,0.77),max(pip,divider*0.65));
  }
 }
 ${
   sceneName === 'wreckingBall'
     ? `
 color=select(vec3f(0.40,0.23,0.11)*(0.85+grain*0.12+fract(f32(input.body)*0.618)*0.2),vec3f(0.17,0.20,0.22),input.body<6u);

 if(input.sphere>0.5){color=vec3f(0.60,0.66,0.72);}
 if(input.body==0u){color=vec3f(0.26,0.28,0.29)*(0.95+grain*0.1);}
 `
     : ''
 }
 colorValue=color;

 `
     : ''
 }
 let normal=normalize(input.normal);
 let reference=select(vec3f(0,0,1),vec3f(0,1,0),abs(normal.z)>0.9);
 let tangent=normalize(cross(reference,normal));
 fragmentInputs.pbr_vPosition=input.worldPosition;
 fragmentInputs.pbr_vNormal=normal;
 fragmentInputs.pbr_vTBN=mat3x3f(tangent,cross(normal,tangent),normal);
 fragmentInputs.pbr_vUV0=input.localPoint.xy;
 fragmentInputs.pbr_vUV1=vec2f((f32(input.body)+0.5)/${bodies.length}.0,0.5);
 let visibility=shadow_getSpotFactor(0,input.worldPosition,normal);
 return pbr_filterColorWithSpotShadows(vec4f(colorValue,1),vec4f(visibility,1,1,1));}
`,
            vertexCount:
              sceneName === 'wreckingBall' ? (bodies.length - 1) * 36 + vertexCount : vertexCount,
            instanceCount: sceneName === 'wreckingBall' ? 1 : bodies.length,
            parameters: {
              depthWriteEnabled: true,
              depthCompare: 'less-equal',
              depthFormat: 'depth24plus'
            },
            bindings: {
              positions: world.positions!,
              orientations: world.orientations!,
              shapes,
              meshVertices,
              sleepStates: world.sleepStates!
            }
          });
    if (model && surface)
      model.shaderInputs.setProps({
        lighting: {
          lights: [{type: 'ambient', color: [160, 190, 230], intensity: 0.15}, LAB_SPOTLIGHT]
        },
        ibl: {
          pbr_diffuseEnvSampler: surface.environment.diffuseTexture,
          pbr_specularEnvSampler: surface.environment.specularTexture,
          pbr_brdfLUT: surface.environment.brdfLUTTexture
        },
        pbrScene: {
          environmentIntensity: 0.7,
          environmentRotation: 0,
          environmentMipCount: surface.environment.specularTexture.mipLevels,
          toneMapMode: 1
        }
      });
    // Distance joints have no physical rods; thin cylinders visualize their centered attachments.
    const tethers = mechanism?.joints.filter(joint => joint.type === 'distance') ?? [];
    const tether =
      sceneName !== 'cradle' && tethers.length > 0
        ? new Model(device, {
            id: 'mechanism-tethers',
            source: `
@group(0) @binding(0) var<uniform> matrix: mat4x4f;
@group(0) @binding(1) var<storage,read> positions: array<vec4f>;
const endpoints = array<vec2u, ${tethers.length}>(${tethers.map(joint => `vec2u(${joint.first}u,${joint.second}u)`).join(',')});
@vertex fn vertexMain(@builtin(vertex_index) vertex: u32,@builtin(instance_index) tether: u32)->@builtin(position) vec4f {
 let corners=array<vec2f,6>(vec2f(0,0),vec2f(1,0),vec2f(0,1),vec2f(0,1),vec2f(1,0),vec2f(1,1));
 let corner=corners[vertex%6u];
 let first=positions[endpoints[tether].x].xyz;let second=positions[endpoints[tether].y].xyz;
 let direction=normalize(second-first);
 let reference=select(vec3f(0,0,1),vec3f(0,1,0),abs(direction.z)>0.9);
 let tangent=normalize(cross(direction,reference));let bitangent=cross(direction,tangent);
 let angle=(f32(vertex/6u)+corner.x)*6.2831853/8.0;
 let offset=0.025*(cos(angle)*tangent+sin(angle)*bitangent);
 return matrix*vec4f(mix(first,second,corner.y)+offset,1);
}
@fragment fn fragmentMain()->@location(0) vec4f {return vec4f(0.12,0.16,0.18,1);}
`,
            vertexCount: 8 * 6,
            instanceCount: tethers.length,
            parameters: {
              depthWriteEnabled: true,
              depthCompare: 'less-equal',
              depthFormat: 'depth24plus'
            },
            bindings: {matrix: cameraBuffer, positions: world.positions!},
            shaderLayout: {
              attributes: [],
              bindings: [
                {name: 'matrix', group: 0, location: 0, type: 'uniform'},
                {name: 'positions', group: 0, location: 1, type: 'read-only-storage', visibility: 1}
              ]
            }
          })
        : null;
    return {
      shadows:
        sceneName === 'cradle'
          ? null
          : new RigidBodyShadows(
              device,
              {
                positions: world.positions!,
                orientations: world.orientations!,
                shapes,
                sleepStates: world.sleepStates!,
                meshVertices
              },
              makeRigidBodyVertexShader(
                sceneName,
                bodies.length,
                longitudeSegments,
                latitudeSegments,
                true
              ),
              {
                vertexCount:
                  sceneName === 'wreckingBall'
                    ? (bodies.length - 2) * 36 + longitudeSegments * latitudeSegments * 6
                    : vertexCount,
                instanceCount: sceneName === 'wreckingBall' ? 1 : bodies.length
              }
            ),
      surface,
      cradle:
        sceneName === 'cradle'
          ? new CradleScene(
              device,
              world.positions!,
              world.orientations!,
              world.poseMatrices!,
              mechanism!.frame!
            )
          : null,
      world,
      graph,
      model,
      tether,
      shapes,
      meshVertices,
      bodies,
      sceneName,
      capacity: world.getCapacityInfo()
    };
  }
  let resources = await createScene();
  let paused = isWreckingBallExample;
  let loading = false;
  let alive = true;
  let previous = performance.now();
  let accumulator = 0;
  let submitted: Promise<void> | null = null;
  let snapshot: Promise<void> | null = null;
  let audioRead: Promise<void> | null = null;
  let lastAudioRead = 0;
  let pushing: Promise<void> | null = null;
  let rebuilding: Promise<typeof resources> | null = null;
  let lastSample = 0;
  let animation = 0;
  let elapsedSimulation = 0;
  let previousSampleSimulation = 0;
  let previousSampleWall = performance.now();
  let simulationRate = 0;
  const frameWorkSamples: number[] = [];
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
    target.shadows?.destroy();
    target.cradle?.destroy();
    target.tether?.destroy();
    target.model?.destroy();
    target.surface?.destroy();
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
      await Promise.all([snapshot, audioRead, pushing, submitted]);
      dominoAudio.reset();
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
      if (changedScene) {
        if (resources.sceneName === 'wreckingBall') {
          camera.position.set(24, -30, 22);
          controls.target.set(-2, 0, 4);
        } else {
          camera.position.set(
            resources.sceneName === 'mixed' ? 24 : 11,
            resources.sceneName === 'mixed' ? -30 : -16,
            resources.sceneName === 'mixed' ? 25 : resources.sceneName === 'dominoSpiral' ? 19 : 12
          );
          controls.target.set(0, 0, 2);
        }
      }
      if (isWreckingBallExample) {
        paused = true;
        document.querySelector<HTMLButtonElement>('#pause')!.textContent = 'Release ball';
      }
      accumulator = 0;
      elapsedSimulation = 0;
      frameWorkSamples.length = 0;
      previousSampleSimulation = 0;
      previousSampleWall = performance.now();
      restartPlayback();
    } catch (error) {
      failure = error instanceof Error ? error : new Error(String(error));
    } finally {
      rebuilding = null;
      loading = false;
      controlsButtons.forEach(button => {
        button.disabled = false;
      });
      scene.disabled = iterations.disabled = false;
      solver.disabled = isWreckingBallExample;
    }
  }
  document.querySelector<HTMLButtonElement>('#reset')!.onclick = reset;
  scene.onchange = reset;
  solver.onchange = reset;
  iterations.onchange = reset;
  const pauseButton = document.querySelector<HTMLButtonElement>('#pause')!;
  if (isWreckingBallExample) pauseButton.textContent = 'Release ball';
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
        const bodyIndex = target.bodies.findIndex(
          body => (body.mode ?? ((body.mass ?? 1) === 0 ? 'static' : 'dynamic')) === 'dynamic'
        );
        if (bodyIndex < 0) return;
        const position = states[bodyIndex].position;
        target.world.applyImpulse(
          bodyIndex,
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
    // Restart the cradle after two minutes of simulated motion. Pausing freezes
    // this clock, and auto-play retains control when cycling through scenarios.
    if (
      resources.sceneName === 'cradle' &&
      !autoPlay.checked &&
      !paused &&
      !loading &&
      elapsedSimulation >= 120
    ) {
      void reset();
    }
    if (submitted) {
      // Account for this elapsed time after the fence completes. The accumulator
      // cap below still bounds catch-up work without discarding every waiting frame.
      animation = requestAnimationFrame(frame);
      return;
    }
    const frameWorkStarted = performance.now();
    const measureFrame = !paused && !loading;
    const elapsed = Math.min(0.05, (now - previous) / 1000);
    previous = now;
    if (!loading && !paused && advanceAt === null) {
      accumulator = Math.min(
        accumulator + elapsed,
        resources.sceneName === 'dominoSpiral' || resources.sceneName === 'wreckingBall'
          ? 4 / 60
          : 4 / 120
      );
      const encoder = device.createCommandEncoder();
      while (accumulator >= resources.world.timeStep) {
        diagnostics.encode(resources.graph, encoder, {parameters: undefined});
        accumulator -= resources.world.timeStep;
        elapsedSimulation += resources.world.timeStep;
      }
      device.submit(encoder.finish());
    }
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    controls.update(Math.min(0.1, (now - lastOrbitTime) / 1000));
    lastOrbitTime = now;
    camera.updateMatrixWorld();
    const matrix = new Matrix4(camera.projectionMatrix.elements).multiplyRight(
      camera.matrixWorldInverse.elements
    );
    // Three uses OpenGL clip depth; map [-w,w] to WebGPU [0,w].
    const depth = new Matrix4([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.5, 0, 0, 0, 0.5, 1]);
    depth.multiplyRight(matrix);
    cameraBuffer.write(new Float32Array(depth));
    resources.model?.shaderInputs.setProps({
      rigidBodyPose: {matrix: depth},
      pbrProjection: {camera: camera.position.toArray()}
    });
    if (resources.cradle) {
      const projection = new Matrix4([
        1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.5, 0, 0, 0, 0.5, 1
      ]).multiplyRight(camera.projectionMatrix.elements);
      resources.cradle.draw(new Matrix4(camera.matrixWorldInverse.elements), projection, [
        camera.position.x,
        camera.position.y,
        camera.position.z
      ]);
    } else {
      if (resources.shadows) {
        const projection = new Matrix4([
          1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.5, 0, 0, 0, 0.5, 1
        ]).multiplyRight(camera.projectionMatrix.elements);
        resources.model!.shaderInputs.setProps({
          shadow: resources.shadows.render(
            new Matrix4(camera.matrixWorldInverse.elements),
            projection
          )
        });
      }
      const pass = device.beginRenderPass({clearColor: [0.9, 0.92, 0.89, 1], clearDepth: 1});
      resources.model?.draw(pass);
      resources.tether?.draw(pass);
      pass.end();
    }
    device.submit();
    const fence = device.createFence();
    submitted = fence.signaled
      .then(() => {
        if (measureFrame && resources.sceneName === 'wreckingBall') {
          frameWorkSamples.push(performance.now() - frameWorkStarted);
          if (frameWorkSamples.length > 180) frameWorkSamples.shift();
        }
      })
      .catch(error => {
        failure = error;
      })
      .finally(() => {
        fence.destroy();
        submitted = null;
      });
    if (
      !loading &&
      !audioRead &&
      dominoAudio.enabled &&
      resources.sceneName === 'dominoSpiral' &&
      now - lastAudioRead > 50
    ) {
      lastAudioRead = now;
      const target = resources;
      const generation = dominoAudio.generation;
      audioRead = target.world
        .readContactEvents()
        .then(batch => {
          if (alive && target === resources)
            dominoAudio.play(batch.events, target.world.timeStep, batch.step, generation);
        })
        .catch(() => {})
        .finally(() => {
          audioRead = null;
        });
    }
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
          simulationRate =
            (sampledSimulationTime - previousSampleSimulation) /
            Math.max(0.001, (now - previousSampleWall) / 1000);
          previousSampleSimulation = sampledSimulationTime;
          previousSampleWall = now;
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
              playbackDuration >= 10 &&
              quietSince !== null &&
              sampledSimulationTime - quietSince >= 3;
            const duration = 120;
            if (settled || playbackDuration >= duration) {
              completionReason = settled ? 'Scene settled' : `${duration} s demonstration complete`;
              advanceAt = performance.now() + 2000;
            }
          }
          const memory = target.capacity;
          const sortedWork = [...frameWorkSamples].sort((first, second) => first - second);
          const frameWork = sortedWork[Math.max(0, Math.ceil(sortedWork.length * 0.95) - 1)];
          const performanceSummary =
            target.sceneName === 'wreckingBall' && sortedWork.length >= 30
              ? `\n${frameWork.toFixed(1)} ms p95 frame work · ${Math.max(0, (1 - frameWork / (1000 / 60)) * 100).toFixed(0)}% margin at 60 fps`
              : '';

          status.value = `${counters.complete ? '' : 'INCOMPLETE SIMULATION · '}${target.bodies.filter(body => body.mass !== 0).length} moving bodies · ${target.world.solver} solver\n${elapsedSimulation.toFixed(1)} s simulated · ${(simulationRate * 100).toFixed(0)}% real time · ${target.graph.stats.nodeOrder.length} graph nodes\n${counters.maximumCandidatePairs} peak candidate pairs · ${counters.maximumCandidateTests} peak candidate tests\n${counters.incompleteSteps} incomplete steps / ${counters.steps} total · ${(memory.ownedBufferBytes / 1048576).toFixed(2)} MiB world buffers${performanceSummary}`;
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
      void Promise.allSettled([snapshot, audioRead, pushing, rebuilding, submitted]).then(() => {
        destroy(resources);
        panel.destroy();
        cameraBuffer.destroy();
        dominoAudio.destroy();
        device.destroy();
      });
    },
    {once: true}
  );
} catch (error) {
  status.value = String(error);
  document.querySelector('#startup-error')!.textContent = String(error);
}
