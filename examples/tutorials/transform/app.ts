// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, Framebuffer} from '@luma.gl/core';
import {
  AnimationLoopTemplate,
  AnimationProps,
  Model,
  BufferTransform,
  Swap,
  makeRandomGenerator
} from '@luma.gl/engine';
import {picking} from '@luma.gl/shadertools';

// Ensure repeatable rendertests
const random = makeRandomGenerator();

// We simulate the wandering of agents using transform feedback in this vertex shader
// The simulation goes like this:
// Assume there's a circle in front of the agent whose radius is WANDER_CIRCLE_R
// the origin of which has a offset to the agent's pivot point, which is WANDER_CIRCLE_OFFSET
// Each frame we pick a random point on this circle
// And the agent moves MOVE_DELTA toward this target point
// We also record the rotation facing this target point, so it will be the base rotation
// for our next frame, which means the WANDER_CIRCLE_OFFSET vector will be on this direction
// Thus we fake a smooth wandering behavior

const COMPUTE_VS = /* glsl */ `\
#version 300 es
#define OFFSET_LOCATION 0
#define ROTATION_LOCATION 1

#define M_2PI 6.28318530718

#define MAP_HALF_LENGTH 1.01
#define WANDER_CIRCLE_R 0.01
#define WANDER_CIRCLE_OFFSET 0.04
#define MOVE_DELTA 0.001
precision highp float;
precision highp int;

uniform appUniforms{
  float time;
} app;

layout(location = OFFSET_LOCATION) in vec2 oldPositions;
layout(location = ROTATION_LOCATION) in float oldRotations;

out vec2 newOffsets;
out float newRotations;

float rand(vec2 co)
{
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

void main()
{
    float theta = M_2PI * rand(vec2(app.time, oldRotations + oldPositions.x + oldPositions.y));
    float cos_r = cos(oldRotations);
    float sin_r = sin(oldRotations);
    mat2 rot = mat2(
        cos_r, sin_r,
        -sin_r, cos_r
    );

    vec2 p = WANDER_CIRCLE_R * vec2(cos(theta), sin(theta)) + vec2(WANDER_CIRCLE_OFFSET, 0.0);
    
    vec2 move = normalize(rot * p);
    newRotations = atan(move.y, move.x);
    newOffsets = oldPositions + MOVE_DELTA * move;

    // wrapping at edges
    newOffsets = vec2 (
        newOffsets.x > MAP_HALF_LENGTH ? - MAP_HALF_LENGTH :
          ( newOffsets.x < - MAP_HALF_LENGTH ? MAP_HALF_LENGTH : newOffsets.x ) ,
        newOffsets.y > MAP_HALF_LENGTH ? - MAP_HALF_LENGTH :
          ( newOffsets.y < - MAP_HALF_LENGTH ? MAP_HALF_LENGTH : newOffsets.y )
        );

    gl_Position = vec4(newOffsets, 0.0, 1.0);
}
`;

const DRAW_VS = /* glsl */ `\
#version 300 es
#define OFFSET_LOCATION 0
#define ROTATION_LOCATION 1
#define POSITION_LOCATION 2
#define COLOR_LOCATION 3
precision highp float;
precision highp int;
layout(location = POSITION_LOCATION) in vec2 positions;
layout(location = ROTATION_LOCATION) in float instanceRotations;
layout(location = OFFSET_LOCATION) in vec2 instancePositions;
layout(location = COLOR_LOCATION) in vec3 instanceColors;
in vec2 instancePickingColors;
out vec3 vColor;
void main()
{
    vColor = instanceColors;

    float cos_r = cos(instanceRotations);
    float sin_r = sin(instanceRotations);
    mat2 rot = mat2(
        cos_r, sin_r,
        -sin_r, cos_r
    );
    gl_Position = vec4(rot * positions + instancePositions, 0.0, 1.0);
    picking_setPickingColor(vec3(0., instancePickingColors));
}
`;

const DRAW_FS = /* glsl */ `\
#version 300 es
#define ALPHA 0.9
precision highp float;
precision highp int;
in vec3 vColor;
out vec4 fragColor;
void main()
{
    fragColor = vec4(vColor * ALPHA, ALPHA);
    fragColor = picking_filterColor(fragColor);
}
`;

const NUM_INSTANCES = 1000;

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = `
<p>
  Instanced triangles animated on the GPU using a luma.gl <code>BufferTransform</code> object.

  This is a port of an example from
  <a href="https://github.com/WebGLSamples/WebGL2Samples/blob/master/samples/transform_feedback_instanced.html">
    WebGL2Samples
  </a>
`;

  // Geometry of each object (a triangle)
  positionBuffer: Buffer;

  // Positions, rotations, colors and picking colors for each object
  instancePositionBuffers: Swap<Buffer>;
  instanceRotationBuffers: Swap<Buffer>;

  instanceColorBuffer: Buffer;
  instancePickingColorBuffer: Buffer;

  renderModel: Model;
  transform: BufferTransform;
  pickingFramebuffer: Framebuffer;

  // eslint-disable-next-line max-statements
  constructor({device, width, height, animationLoop}: AnimationProps) {
    super();

    if (device.type !== 'webgl') {
      animationLoop.setError(new Error('This demo is only implemented for WebGL2'));
      return;
    }

    // -- Initialize data
    const trianglePositions = new Float32Array([0.015, 0.0, -0.01, 0.01, -0.01, -0.01]);

    const instancePositions = new Float32Array(NUM_INSTANCES * 2);
    const instanceRotations = new Float32Array(NUM_INSTANCES);
    const instanceColors = new Float32Array(NUM_INSTANCES * 3);
    const pickingColors = new Float32Array(NUM_INSTANCES * 2);

    for (let i = 0; i < NUM_INSTANCES; ++i) {
      instancePositions[i * 2] = random() * 2.0 - 1.0;
      instancePositions[i * 2 + 1] = random() * 2.0 - 1.0;
      instanceRotations[i] = random() * 2 * Math.PI;

      const randValue = random();
      if (randValue > 0.5) {
        instanceColors[i * 3 + 1] = 1.0;
        instanceColors[i * 3 + 2] = 1.0;
      } else {
        instanceColors[i * 3] = 1.0;
        instanceColors[i * 3 + 2] = 1.0;
      }

      pickingColors[i * 2] = Math.floor(i / 255);
      pickingColors[i * 2 + 1] = i - 255 * pickingColors[i * 2];
    }

    this.positionBuffer = device.createBuffer({data: trianglePositions});
    this.instanceColorBuffer = device.createBuffer({data: instanceColors});
    this.instancePositionBuffers = new Swap({
      current: device.createBuffer({data: instancePositions}),
      next: device.createBuffer({data: instancePositions})
    });
    this.instanceRotationBuffers = new Swap({
      current: device.createBuffer({data: instanceRotations}),
      next: device.createBuffer({data: instanceRotations})
    });
    this.instancePickingColorBuffer = device.createBuffer({data: pickingColors});

    this.renderModel = new Model(device, {
      id: 'RenderModel',
      vs: DRAW_VS,
      fs: DRAW_FS,
      modules: [picking],
      topology: 'triangle-list',
      vertexCount: 3,
      isInstanced: true,
      instanceCount: NUM_INSTANCES,
      attributes: {
        positions: this.positionBuffer,
        instanceColors: this.instanceColorBuffer,
        instancePickingColors: this.instancePickingColorBuffer
      },
      bufferLayout: [
        {name: 'positions', format: 'float32x2'},
        {name: 'instancePositions', format: 'float32x2'},
        {name: 'instanceRotations', format: 'float32'},
        {name: 'instanceColors', format: 'float32x3'},
        {name: 'instancePickingColors', format: 'float32x2'}
      ]
    });

    this.transform = new BufferTransform(device, {
      vs: COMPUTE_VS,
      vertexCount: NUM_INSTANCES,
      // elementCount: NUM_INSTANCES,
      bufferLayout: [
        {name: 'oldPositions', format: 'float32x2'},
        {name: 'oldRotations', format: 'float32'}
      ],
      outputs: ['newOffsets', 'newRotations']
    });

    // picking
    // device.getDefaultCanvasContext().canvas.addEventListener('mousemove', mousemove);
    // device.getDefaultCanvasContext().canvas.addEventListener('mouseleave', mouseleave);
    // this.pickingFramebuffer = device.createFramebuffer({width, height});
  }

  override onFinalize(): void {
    this.renderModel.destroy();
    this.transform.destroy();
  }

  override onRender({device, width, height, time}: AnimationProps): void {
    this.transform.model.shaderInputs.setProps({app: {time}});
    this.transform.run({
      inputBuffers: {
        oldPositions: this.instancePositionBuffers.current,
        oldRotations: this.instanceRotationBuffers.current
      },
      outputBuffers: {
        newOffsets: this.instancePositionBuffers.next,
        newRotations: this.instanceRotationBuffers.next
      }
    });

    this.instancePositionBuffers.swap();
    this.instanceRotationBuffers.swap();

    this.renderModel.setAttributes({
      instancePositions: this.instancePositionBuffers.current,
      instanceRotations: this.instanceRotationBuffers.current
    });

    const renderPass = device.beginRenderPass({
      clearColor: [0, 0, 0, 1],
      clearDepth: 1
    });

    this.renderModel.draw(renderPass);

    // if (pickPosition) {
    //   // use the center pixel location in device pixel range
    //   const devicePixels = cssToDevicePixels(gl, pickPosition);
    //   const deviceX = devicePixels.x + Math.floor(devicePixels.width / 2);
    //   const deviceY = devicePixels.y + Math.floor(devicePixels.height / 2);
    //   this.pickingFramebuffer.resize({width, height});
    //   pickInstance(gl, deviceX, deviceY, this.renderModel, this.pickingFramebuffer);
    // }
  }
}

/*
function pickInstance(gl, pickX, pickY, model, framebuffer) {
  if (framebuffer) {
    framebuffer.clear({color: true, depth: true});
  }
  // Render picking colors
  model.setUniforms({picking_uActive: 1});
  model.draw({framebuffer});
  model.setUniforms({picking_uActive: 0});

  const color = readPixelsToArray(framebuffer, {
    sourceX: pickX,
    sourceY: pickY,
    sourceWidth: 1,
    sourceHeight: 1,
    sourceFormat: GL.RGBA,
    sourceType: GL.UNSIGNED_BYTE
  });

  if (color[0] + color[1] + color[2] > 0) {
    model.updateModuleSettings({
      pickingSelectedColor: color,
      pickingHighlightColor: RED
    });
  } else {
    model.updateModuleSettings({
      pickingSelectedColor: null
    });
  }
}
*/
