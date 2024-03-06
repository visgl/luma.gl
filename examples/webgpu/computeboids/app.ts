// Inspired by https://github.com/austinEng/webgpu-samples
// under MIT license, Copyright 2019 WebGPU Samples Contributors
// @ts-nocheck
/* eslint-disable no-console */

import updateSprites from './update-sprites.wgsl?raw'; // eslint-disable-line
import sprites from './sprites.wgsl?raw'; // eslint-disable-line
import {Buffer} from '@luma.gl/core';
// import { RenderPipelineParameters} from '@luma.gl/core';
import {Model, WebGPUDevice} from '@luma.gl/webgpu';
// import {Matrix4} from '@math.gl/core';

export const name = 'Compute Boids';
export const description =
  'A GPU compute particle simulation that mimics \
the flocking behavior of birds. A compute shader updates \
two ping-pong buffers which store particle data. The data \
is used to draw instanced particles.';

/** Provide both GLSL and WGSL shaders */
const SHADERS = {
  wgsl: {
    updateSprites,
    sprites
  }
};

const NUM_PARTICLES = 150;

export async function init(canvas: HTMLCanvasElement, language: 'glsl' | 'wgsl') {
  const device = await WebGPUDevice.create({canvas});

  const spriteShaderModule = device.createShader({stage: 'vertex', source: SHADERS.wgsl.sprites});

  const model = new Model(device, {
    id: 'computeboids',
    vs: spriteShaderModule,
    vertexEntryPoint: 'vert_main',
    fs: spriteShaderModule,
    fragmentEntryPoint: 'frag_main',
    shaderLayout: {
      attributes: [
        {name: 'instancePositions', location: 0, format: 'float32x2', stepMode: 'instance'},
        {name: 'instanceVelocities', location: 1, format: 'float32x2', stepMode: 'instance'},
        {name: 'vertexPositions', location: 2, format: 'float32x2'}
      ],
      bindings: []
    },
    bufferLayout: [
      {name: 'particles', attributes: [{name: 'instancePositions'}, {name: 'instanceVelocities'}]}
    ],
    // targets: [
    //   {
    //     format: presentationFormat,
    //   },
    // ],
    parameters: {
      // Enable depth testing so that the fragment closest to the camera
      // is rendered in front.
      depthWriteEnabled: true,
      depthCompare: 'less',
      depthFormat: 'depth24plus',

      // Backface culling since the cube is solid piece of geometry.
      // Faces pointing away from the camera will be occluded by faces
      // pointing toward the camera.
      cullMode: 'back'
    },
    topology: 'triangle-list',
    vertexCount: 6,
    instanceCount: NUM_PARTICLES
  });

  const cs = device.createShader({
    id: 'sprites',
    stage: 'compute',
    source: SHADERS.wgsl.updateSprites
  });
  const computePipeline = device.createComputePipeline({
    id: 'updateSprites',
    cs,
    csEntryPoint: 'main'
  });

  const vertexBufferData = new Float32Array([-0.01, -0.02, 0.01, -0.02, 0.0, 0.02]);
  const spriteVertexBuffer = device.createBuffer({id: 'boid-geometry', data: vertexBufferData});

  const simParams = {
    deltaT: 0.04,
    rule1Distance: 0.1,
    rule2Distance: 0.025,
    rule3Distance: 0.025,
    rule1Scale: 0.02,
    rule2Scale: 0.05,
    rule3Scale: 0.005
  };

  const simParamBufferSize = 7 * Float32Array.BYTES_PER_ELEMENT;
  const simParamBuffer = device.createBuffer({
    id: 'simParams',
    byteLength: simParamBufferSize,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });

  function updateSimParams() {
    simParamBuffer.write(
      new Float32Array([
        simParams.deltaT,
        simParams.rule1Distance,
        simParams.rule2Distance,
        simParams.rule3Distance,
        simParams.rule1Scale,
        simParams.rule2Scale,
        simParams.rule3Scale
      ])
    );
  }

  updateSimParams();

  // Object.keys(simParams).forEach((k) => {
  //   gui.add(simParams, k).onFinishChange(updateSimParams);
  // });

  const initialParticleData = new Float32Array(NUM_PARTICLES * 4);
  for (let i = 0; i < NUM_PARTICLES; ++i) {
    initialParticleData[4 * i + 0] = 2 * (Math.random() - 0.5);
    initialParticleData[4 * i + 1] = 2 * (Math.random() - 0.5);
    initialParticleData[4 * i + 2] = 2 * (Math.random() - 0.5) * 0.1;
    initialParticleData[4 * i + 3] = 2 * (Math.random() - 0.5) * 0.1;
  }

  const particleBuffers = [
    device.createBuffer({
      id: 'particles1',
      data: initialParticleData,
      usage: Buffer.VERTEX | Buffer.STORAGE | Buffer.COPY_SRC
    }),
    device.createBuffer({
      id: 'particles2',
      data: initialParticleData,
      usage: Buffer.VERTEX | Buffer.STORAGE
    })
  ];

  const particleBindings = [
    [simParamBuffer, particleBuffers[0], particleBuffers[1]],
    [simParamBuffer, particleBuffers[1], particleBuffers[0]]
  ];

  const arrayBuffer = await particleBuffers[0].readAsync();
  console.log(new Float32Array(arrayBuffer));

  let t = 0;
  async function frame() {
    const computePass = device.beginComputePass();
    computePass.setPipeline(computePipeline);
    computePass.setBindings(particleBindings[t % 2]);
    computePass.dispatch(Math.ceil(NUM_PARTICLES / 64));
    computePass.endPass();

    await new Promise(resolve => setTimeout(resolve, 1000));

    const arrayBuffer = await particleBuffers[0].readAsync();
    console.log(new Float32Array(arrayBuffer));

    const renderPass = device.beginRenderPass({clearColor: [0, 0, 0, 1]});
    model.setAttributes({
      particles: particleBuffers[(t + 1) % 2],
      vertexPositions: spriteVertexBuffer
    });
    model.draw(renderPass);
    renderPass.end();

    ++t;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

init(document.getElementById('canvas') as HTMLCanvasElement, 'wgsl');
