// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {luma, Buffer, type Parameters, type ShaderLayout} from '@luma.gl/core';
import {Model, Computation} from '@luma.gl/engine';
import {webgpuAdapter} from '@luma.gl/webgpu';
import {Matrix4} from '@math.gl/core';
import {PerspectiveCamera, Vector3, Quaternion} from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
function getElement<ElementType extends HTMLElement = HTMLElement>(selector: string): ElementType {
  // All controls are declared by this example's index.html before the entry script runs.
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
    createCanvasContext: {canvas: 'spheres', autoResize: true}
  });
  const count = 64;
  const positions = device.createBuffer({
    byteLength: count * 16,
    usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC
  });
  const velocities = device.createBuffer({
    byteLength: count * 16,
    usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC
  });
  const camera = device.createBuffer({
    byteLength: 96,
    usage: Buffer.UNIFORM | Buffer.COPY_DST
  });
  function reset() {
    const positionData = new Float32Array(count * 4);
    const velocityData = new Float32Array(count * 4);
    for (let index = 0; index < count; index++) {
      positionData.set(
        [
          ((index % 8) - 3.5) * 1.2,
          (Math.floor(index / 8) - 3.5) * 1.2,
          3 + (index % 11) * 0.65,
          0.38
        ],
        index * 4
      );
      velocityData.set([0, 0, 0, 1], index * 4);
    }
    positions.write(positionData);
    velocities.write(velocityData);
  }
  reset();
  const temporaryPositions = device.createBuffer({
    byteLength: count * 16,
    usage: Buffer.STORAGE
  });
  const temporaryVelocities = device.createBuffer({
    byteLength: count * 16,
    usage: Buffer.STORAGE
  });
  const platform = device.createBuffer({
    byteLength: 64,
    usage: Buffer.UNIFORM | Buffer.COPY_DST
  });
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
  const initialDirection = orbitCamera.position.clone().sub(controls.target).normalize();
  const gravityRotation = new Quaternion().setFromUnitVectors(
    initialDirection,
    new Vector3(0, 0, 1)
  );
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
    platform.write(
      new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, gravity.x, gravity.y, gravity.z, 0])
    );
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
  const platformDeclaration = `struct Platform { right:vec4f, forward:vec4f, normal:vec4f, gravity:vec4f }; @group(0) @binding(4) var<uniform> platform:Platform;`;
  const simulationBindings: ShaderLayout['bindings'] = [
    {
      name: 'inputPositions',
      type: 'read-only-storage',
      group: 0,
      location: 0
    },
    {
      name: 'inputVelocities',
      type: 'read-only-storage',
      group: 0,
      location: 1
    },
    {name: 'outputPositions', type: 'storage', group: 0, location: 2},
    {name: 'outputVelocities', type: 'storage', group: 0, location: 3},
    {name: 'platform', type: 'uniform', group: 0, location: 4}
  ];
  const stateDeclaration =
    platformDeclaration +
    `
@group(0) @binding(0) var<storage,read> inputPositions:array<vec4f>;
@group(0) @binding(1) var<storage,read> inputVelocities:array<vec4f>;
@group(0) @binding(2) var<storage,read_write> outputPositions:array<vec4f>;
@group(0) @binding(3) var<storage,read_write> outputVelocities:array<vec4f>;
`;
  const integrate = new Computation(device, {
    id: 'sphere-integrate',
    shaderLayout: {bindings: simulationBindings},
    source:
      stateDeclaration +
      `
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) invocation:vec3u){
 let index=invocation.x;if(index>=64u){return;}
 let sphere=inputPositions[index];var velocity=inputVelocities[index].xyz+platform.gravity.xyz/120.0;
 // Coulomb floor friction opposes tangential motion and holds shallow slopes at rest.
 let normal=platform.normal.xyz;let height=dot(sphere.xyz,normal);
 if(abs(dot(sphere.xyz,platform.right.xyz))<6 && abs(dot(sphere.xyz,platform.forward.xyz))<6 && height>=0 && height<=sphere.w+0.01){
  let tangent=velocity-normal*dot(velocity,normal);let speed=length(tangent);
  let frictionStep=0.2*max(-dot(platform.gravity.xyz,normal),0.0)/120.0;
  if(speed>0.000001){velocity-=tangent*min(1.0,frictionStep/speed);}
 }
 outputVelocities[index]=vec4f(velocity,1);outputPositions[index]=vec4f(sphere.xyz+velocity/120.0,sphere.w);
}`
  });
  const collide = new Computation(device, {
    id: 'sphere-contacts',
    shaderLayout: {bindings: simulationBindings},
    source:
      stateDeclaration +
      `
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) invocation:vec3u){
 let index=invocation.x;if(index>=64u){return;}
 let sphere=inputPositions[index];var point=sphere.xyz;var velocity=inputVelocities[index].xyz;
 var correction=vec3f(0);var impulse=vec3f(0);
 for(var other=0u;other<64u;other++){
  if(other==index){continue;}
  let neighbor=inputPositions[other];let delta=sphere.xyz-neighbor.xyz;let distance=length(delta);let diameter=sphere.w+neighbor.w;
  if(distance<diameter && distance>0.00001){
   let normal=delta/distance;correction+=normal*max(diameter-distance-0.001,0.0)*0.5;
   let closing=dot(inputVelocities[index].xyz-inputVelocities[other].xyz,normal);
   if(closing<0){impulse-=normal*closing*0.84;}
  }
 }
 point+=correction;velocity+=impulse;
 let normal=platform.normal.xyz;
 if(abs(dot(point,platform.right.xyz))<6 && abs(dot(point,platform.forward.xyz))<6){
  let height=dot(point,normal);
  // Only the upper surface catches a sphere; fallen spheres cannot teleport back.
  if(height<sphere.w && height> -sphere.w*2){
   point+=normal*(sphere.w-height);let closing=dot(velocity,normal);
   if(closing<0){velocity-=normal*closing*1.62;velocity*=0.997;}
  }
 }
 outputPositions[index]=vec4f(point,sphere.w);outputVelocities[index]=vec4f(velocity,1);
}`
  });
  function dispatch(
    computation: Computation,
    inputPositions: Buffer,
    inputVelocities: Buffer,
    outputPositions: Buffer,
    outputVelocities: Buffer
  ) {
    computation.setBindings({
      inputPositions,
      inputVelocities,
      outputPositions,
      outputVelocities,
      platform
    });
    const pass = device.beginComputePass({});
    computation.dispatch(pass, 1);
    pass.end();
  }
  function step() {
    dispatch(integrate, positions, velocities, temporaryPositions, temporaryVelocities);
    dispatch(collide, temporaryPositions, temporaryVelocities, positions, velocities);
    dispatch(collide, positions, velocities, temporaryPositions, temporaryVelocities);
    dispatch(collide, temporaryPositions, temporaryVelocities, positions, velocities);
  }
  // Check the actual GPU contact pass with isolated, deterministic cases.
  const checkPositions = new Float32Array(count * 4);
  const checkVelocities = new Float32Array(count * 4);
  for (let index = 0; index < count; index++) {
    checkPositions.set([100 + index * 3, 100, 20, 0.38], index * 4);
    checkVelocities[index * 4 + 3] = 1;
  }
  checkPositions.set([-0.3, 0, 20, 0.38], 0);
  checkPositions.set([0.3, 0, 20, 0.38], 4);
  checkVelocities.set([1, 0, 0, 1], 0);
  checkVelocities.set([-1, 0, 0, 1], 4);
  checkPositions.set([7, 0, 0.1, 0.38], 8);
  checkVelocities.set([0, 0, -2, 1], 8);
  checkPositions.set([0, 0, 0.1, 0.38], 12);
  checkVelocities.set([0, 0, -2, 1], 12);
  positions.write(checkPositions);
  velocities.write(checkVelocities);
  dispatch(collide, positions, velocities, temporaryPositions, temporaryVelocities);
  device.submit();
  // Copy the results through the writable state buffers for portable readback.
  dispatch(collide, temporaryPositions, temporaryVelocities, positions, velocities);
  device.submit();
  const checkedPositions = new Float32Array((await positions.readAsync()).buffer);
  const checkedVelocities = new Float32Array((await velocities.readAsync()).buffer);
  if (
    !(
      checkedPositions[4] - checkedPositions[0] > 0.75 &&
      checkedVelocities[0] < 0 &&
      checkedVelocities[4] > 0
    )
  )
    throw new Error('Sphere collision check failed');
  if (!(Math.abs(checkedPositions[10] - 0.1) < 0.001 && checkedVelocities[10] < 0))
    throw new Error('Platform edge check failed');
  if (!(Math.abs(checkedPositions[14] - 0.38) < 0.001 && checkedVelocities[14] > 0))
    throw new Error('Floor bounce check failed');
  // Grounded low-speed bodies stop; airborne bodies retain lateral velocity.
  checkPositions.set([3, 3, 0.38, 0.38], 16);
  checkVelocities.set([0.01, 0, 0, 1], 16);
  checkPositions.set([3, 3, 20, 0.38], 20);
  checkVelocities.set([0.01, 0, 0, 1], 20);
  checkPositions.set([-3, 3, 0.38, 0.38], 24);
  checkVelocities.set([1, 0, 0, 1], 24);
  positions.write(checkPositions);
  velocities.write(checkVelocities);
  dispatch(integrate, positions, velocities, temporaryPositions, temporaryVelocities);
  dispatch(collide, temporaryPositions, temporaryVelocities, positions, velocities);
  device.submit();
  const frictionVelocities = new Float32Array((await velocities.readAsync()).buffer);
  if (
    !(
      Math.abs(frictionVelocities[16]) < 0.000001 &&
      Math.abs(frictionVelocities[20] - 0.01) < 0.000001 &&
      frictionVelocities[24] > 0.98 &&
      frictionVelocities[24] < 0.99
    )
  ) {
    throw new Error('Ground friction check failed');
  }
  reset();
  const shared = `struct Camera { matrix: mat4x4f, right: vec4f, up: vec4f }; @group(0) @binding(0) var<uniform> camera: Camera;`;
  const sphereSource =
    shared +
    `
@group(0) @binding(1) var<storage,read> positions:array<vec4f>;
struct Output { @builtin(position) position:vec4f, @location(0) uv:vec2f, @location(1) color:vec3f };
@vertex fn vertexMain(@builtin(vertex_index) vertexIndex:u32,@builtin(instance_index) instanceIndex:u32)->Output {
 let corners=array<vec2f,6>(vec2f(-1,-1),vec2f(1,-1),vec2f(-1,1),vec2f(-1,1),vec2f(1,-1),vec2f(1,1));
 let corner=corners[vertexIndex];let sphere=positions[instanceIndex];
 var output:Output;
 output.position=camera.matrix*vec4f(sphere.xyz+sphere.w*(camera.right.xyz*corner.x+camera.up.xyz*corner.y),1);
 output.uv=corner;output.color=vec3f(0.25+0.65*fract(f32(instanceIndex)*0.173),0.52+0.3*fract(f32(instanceIndex)*0.37),0.9);
 return output;
}
@fragment fn fragmentMain(input:Output)->@location(0)vec4f {
 let squared=dot(input.uv,input.uv);if(squared>1){discard;}
 let normal=vec3f(input.uv,sqrt(1-squared));
 let light=0.23+0.77*max(dot(normal,normalize(vec3f(-0.5,0.65,1))),0);
 return vec4f(input.color*light,1);
}`;
  const floorSource =
    shared +
    platformDeclaration +
    `
struct Output { @builtin(position) position:vec4f, @location(0) point:vec2f };
@vertex fn vertexMain(@builtin(vertex_index) vertexIndex:u32)->Output {
 let corners=array<vec2f,6>(vec2f(-6,-6),vec2f(6,-6),vec2f(-6,6),vec2f(-6,6),vec2f(6,-6),vec2f(6,6));
 var output:Output;output.point=corners[vertexIndex];output.position=camera.matrix*vec4f(platform.right.xyz*output.point.x+platform.forward.xyz*output.point.y,1);return output;
}
@fragment fn fragmentMain(input:Output)->@location(0)vec4f {
 let line=min(abs(fract(input.point.x+0.5)-0.5),abs(fract(input.point.y+0.5)-0.5));
 return vec4f(select(vec3f(0.16,0.22,0.29),vec3f(0.3,0.39,0.46),line<0.025),1);
}`;
  const parameters: Parameters = {
    depthWriteEnabled: true,
    depthCompare: 'less-equal',
    depthFormat: 'depth24plus'
  };
  const spheres = new Model(device, {
    id: 'sphere-billboards',
    source: sphereSource,
    vertexCount: 6,
    instanceCount: count,
    parameters,
    bindings: {camera, positions},
    shaderLayout: {
      attributes: [],
      bindings: [
        {name: 'camera', type: 'uniform', group: 0, location: 0},
        {
          name: 'positions',
          type: 'read-only-storage',
          group: 0,
          location: 1,
          visibility: 1
        }
      ]
    }
  });
  const floor = new Model(device, {
    id: 'floor-grid',
    source: floorSource,
    vertexCount: 6,
    parameters,
    bindings: {camera, platform},
    shaderLayout: {
      attributes: [],
      bindings: [
        {name: 'camera', type: 'uniform', group: 0, location: 0},
        {
          name: 'platform',
          type: 'uniform',
          group: 0,
          location: 4,
          visibility: 1
        }
      ]
    }
  });
  let paused = false;
  let previous = performance.now();
  let accumulator = 0;
  let frames = 0;
  getElement('#pause').onclick = () => {
    paused = !paused;
    getElement('#pause').textContent = paused ? 'Resume' : 'Pause';
  };
  getElement('#reset').onclick = () => {
    reset();
    accumulator = 0;
  };
  let speed = 1.5;
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
  status.value = `${count} spheres · GPU collisions · 120 Hz`;
  function frame(now: number) {
    try {
      if (gpuError) throw gpuError;
      const elapsed = Math.min((now - previous) / 1000, 0.1);
      previous = now;
      updatePlatform();
      if (!paused) {
        accumulator += elapsed * speed;
        let steps = 0;
        while (accumulator >= 1 / 120 && steps < 36) {
          step();
          accumulator -= 1 / 120;
          steps++;
        }
        if (steps) device.submit();
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
          far: 100
        })
        .multiplyRight(view);
      const cameraData = new Float32Array(24);
      cameraData.set(matrix);
      cameraData.set([view[0], view[4], view[8], 0], 16);
      cameraData.set([view[1], view[5], view[9], 0], 20);
      camera.write(cameraData);
      const pass = device.beginRenderPass({
        clearColor: [0.04, 0.065, 0.1, 1],
        clearDepth: 1
      });
      floor.draw(pass);
      spheres.draw(pass);
      pass.end();
      device.submit();
      frames++;
      if (frames % 60 === 0)
        status.value = `${count} spheres · WebGPU · ${paused ? 'Paused' : speed.toFixed(1) + '× speed · sphere collisions · checks passed'}`;
      requestAnimationFrame(frame);
    } catch (error) {
      status.value = String(error);
    }
  }
  requestAnimationFrame(frame);
} catch (error) {
  status.value = String(error);
}
