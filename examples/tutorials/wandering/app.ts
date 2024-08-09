import {Buffer, Framebuffer} from '@luma.gl/core';
import {
  AnimationLoopTemplate,
  AnimationProps,
  Model,
  BufferTransform,
  makeRandomGenerator
} from '@luma.gl/engine';
import {picking} from '@luma.gl/shadertools';

// Ensure repeatable rendertests
const random = makeRandomGenerator();

// eslint-disable-next-line max-len
const INFO_HTML = `
<p>
  Instanced triangles animated on the GPU using a luma.gl <code>BufferTransform</code> object.

  This is a port of an example from
  <a href="https://github.com/WebGLSamples/WebGL2Samples/blob/master/samples/transform_feedback_instanced.html">
    WebGL2Samples
  </a>
`;

// Text to be displayed on environments when this demos is not supported.
const ALT_TEXT = "THIS DEMO REQUIRES WEBGL 2, BUT YOUR BROWSER DOESN'T SUPPORT IT";

const EMIT_VS = /* glsl */ `\
#version 300 es
#define OFFSET_LOCATION 0
#define ROTATION_LOCATION 1

#define M_2PI 6.28318530718

// We simulate the wandering of agents using transform feedback in this vertex shader
// The simulation goes like this:
// Assume there's a circle in front of the agent whose radius is WANDER_CIRCLE_R
// the origin of which has a offset to the agent's pivot point, which is WANDER_CIRCLE_OFFSET
// Each frame we pick a random point on this circle
// And the agent moves MOVE_DELTA toward this target point
// We also record the rotation facing this target point, so it will be the base rotation
// for our next frame, which means the WANDER_CIRCLE_OFFSET vector will be on this direction
// Thus we fake a smooth wandering behavior

#define MAP_HALF_LENGTH 1.01
#define WANDER_CIRCLE_R 0.01
#define WANDER_CIRCLE_OFFSET 0.04
#define MOVE_DELTA 0.001
precision highp float;
precision highp int;
uniform float u_time;
layout(location = OFFSET_LOCATION) in vec2 positions;
layout(location = ROTATION_LOCATION) in float rotations;
out vec2 v_offset;
out float v_rotation;

float rand(vec2 co)
{
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

void main()
{
    float theta = M_2PI * rand(vec2(u_time, rotations + positions.x + positions.y));
    float cos_r = cos(rotations);
    float sin_r = sin(rotations);
    mat2 rot = mat2(
        cos_r, sin_r,
        -sin_r, cos_r
    );

    vec2 p = WANDER_CIRCLE_R * vec2(cos(theta), sin(theta)) + vec2(WANDER_CIRCLE_OFFSET, 0.0);
    vec2 move = normalize(rot * p);
    v_rotation = atan(move.y, move.x);
    v_offset = positions + MOVE_DELTA * move;

    // wrapping at edges
    v_offset = vec2 (
        v_offset.x > MAP_HALF_LENGTH ? - MAP_HALF_LENGTH :
          ( v_offset.x < - MAP_HALF_LENGTH ? MAP_HALF_LENGTH : v_offset.x ) ,
        v_offset.y > MAP_HALF_LENGTH ? - MAP_HALF_LENGTH :
          ( v_offset.y < - MAP_HALF_LENGTH ? MAP_HALF_LENGTH : v_offset.y )
        );

    gl_Position = vec4(v_offset, 0.0, 1.0);
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
out vec4 color;
void main()
{
    color = vec4(vColor * ALPHA, ALPHA);
    color = picking_filterColor(color);
}
`;

const NUM_INSTANCES = 1000;
// const RED = new Uint8Array([255, 0, 0, 255]);
// const log = new Log({id: 'transform'}).enable();

// TODO PICKING TEMPORARILY DISABLED
// let pickPosition = [0, 0];

// function mousemove(e) {
//   pickPosition = [e.offsetX, e.offsetY];
// }

// function mouseleave(e) {
//   pickPosition = null;
// }

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = INFO_HTML;

  // Geometry of each object (a triangle)
  positionBuffer: Buffer;

  // Positions, rotations, colors and picking colors for each object
  instanceRotationBuffer: Buffer;
  instanceColorBuffer: Buffer;
  instancePositionBuffer: Buffer;
  instancePickingColorBuffer: Buffer;

  renderModel: Model;
  transform: BufferTransform;
  pickingFramebuffer: Framebuffer;

  // eslint-disable-next-line max-statements
  constructor({device, width, height}: AnimationProps) {
    super();

    if (device.type !== 'webgl') {
      throw new Error(ALT_TEXT);
    }
    // device.canvasContext.canvas.addEventListener('mousemove', mousemove);
    // device.canvasContext.canvas.addEventListener('mouseleave', mouseleave);

    // -- Initialize data
    const trianglePositions = new Float32Array([0.015, 0.0, -0.01, 0.01, -0.01, -0.01]);

    const instancePositions = new Float32Array(NUM_INSTANCES * 2);
    const instanceRotations = new Float32Array(NUM_INSTANCES);
    const instanceColors = new Float32Array(NUM_INSTANCES * 3);
    const pickingColors = new Uint8ClampedArray(NUM_INSTANCES * 2);

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
    this.instancePositionBuffer = device.createBuffer({data: instancePositions});
    this.instanceRotationBuffer = device.createBuffer({data: instanceRotations});
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
        instancePositions: this.instancePositionBuffer,
        instanceRotations: this.instanceRotationBuffer,
        instanceColors: this.instanceColorBuffer,
        instancePickingColors: this.instancePickingColorBuffer
      },
      parameters: {
        blend: true,
        blendFunc: 'src-alpha-one'
      }
    });

    this.transform = new BufferTransform(device, {
      vs: EMIT_VS,
      elementCount: NUM_INSTANCES,
      vertexCount: NUM_INSTANCES,
      sourceBuffers: {
        positions: this.instancePositionBuffer,
        rotations: this.instanceRotationBuffer
      },
      feedbackMap: {
        positions: 'v_offset',
        rotations: 'v_rotation'
      }
    });

    // this.pickingFramebuffer = device.createFramebuffer({width, height});
  }

  override onFinalize(): void {
    this.renderModel.destroy();
    this.transform.destroy();
  }

  override onRender({device, width, height, time}: AnimationProps): void {
    this.transform.model.setUniforms({u_time: time});
    this.transform.run({});

    this.transform.swap();

    this.instancePositionBuffer = this.transform.getBuffer('v_offset')!;
    this.instanceRotationBuffer = this.transform.getBuffer('v_rotation')!;

    // this.instancePositionBuffer.setAccessor({divisor: 1});
    // this.instanceRotationBuffer.setAccessor({divisor: 1});

    const renderPass = device.beginRenderPass({
      clearColor: [0, 0, 0, 1],
      clearDepth: 1,
    });
    
    this.renderModel.setAttributes({
      positions: this.instancePositionBuffer,
      rotations: this.instanceRotationBuffer
    });

    this.renderModel.draw(renderPass);

    // this.instancePositionBuffer.setAccessor({divisor: 0});
    // this.instanceRotationBuffer.setAccessor({divisor: 0});

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
