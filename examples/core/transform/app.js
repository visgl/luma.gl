/* eslint-disable camelcase */
/* global window */
import {AnimationLoop, Buffer, Model, pickModels, picking} from 'luma.gl';
import {Transform} from 'luma.gl';

const RED = new Uint8Array([255, 0, 0, 255]);

/* eslint-disable max-len */
const INFO_HTML = `
<p>
  Instanced triangles animated on the GPU using a luma.gl <code>Transform</code> object.

  This is a port of an example from
  <a href="https://github.com/WebGLSamples/WebGL2Samples/blob/master/samples/transform_feedback_instanced.html">
    WebGL2Samples
  </a>
`;
/* eslint-enable max-len */

const EMIT_VS = `\
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
layout(location = OFFSET_LOCATION) in vec2 a_offset;
layout(location = ROTATION_LOCATION) in float a_rotation;
out vec2 v_offset;
out float v_rotation;

float rand(vec2 co)
{
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

void main()
{
    float theta = M_2PI * rand(vec2(u_time, a_rotation + a_offset.x + a_offset.y));
    float cos_r = cos(a_rotation);
    float sin_r = sin(a_rotation);
    mat2 rot = mat2(
        cos_r, sin_r,
        -sin_r, cos_r
    );

    vec2 p = WANDER_CIRCLE_R * vec2(cos(theta), sin(theta)) + vec2(WANDER_CIRCLE_OFFSET, 0.0);
    vec2 move = normalize(rot * p);
    v_rotation = atan(move.y, move.x);
    v_offset = a_offset + MOVE_DELTA * move;

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

const DRAW_VS = `\
#version 300 es
#define OFFSET_LOCATION 0
#define ROTATION_LOCATION 1
#define POSITION_LOCATION 2
#define COLOR_LOCATION 3
precision highp float;
precision highp int;
layout(location = POSITION_LOCATION) in vec2 a_position;
layout(location = ROTATION_LOCATION) in float a_rotation;
layout(location = OFFSET_LOCATION) in vec2 a_offset;
layout(location = COLOR_LOCATION) in vec3 a_color;
in vec2 instancePickingColors;
out vec3 v_color;
void main()
{
    v_color = a_color;

    float cos_r = cos(a_rotation);
    float sin_r = sin(a_rotation);
    mat2 rot = mat2(
        cos_r, sin_r,
        -sin_r, cos_r
    );
    gl_Position = vec4(rot * a_position + a_offset, 0.0, 1.0);
    picking_setPickingColor(vec3(0., instancePickingColors));
}
`;

const DRAW_FS = `\
#version 300 es
#define ALPHA 0.9
precision highp float;
precision highp int;
in vec3 v_color;
out vec4 color;
void main()
{
    color = vec4(v_color * ALPHA, ALPHA);
    color = picking_filterColor(color);
}
`;

const NUM_INSTANCES = 1000;

let pickPosition = [0, 0];
function mousemove(e) {
  pickPosition = [e.offsetX, e.offsetY];
}
function mouseleave(e) {
  pickPosition = null;
}

const animationLoop = new AnimationLoop({
  glOptions: {
    webgl2: true,
    webgl1: false,
    debug: true
  },

  createFramebuffer: true,

  /* eslint-disable max-statements */
  onInitialize({canvas, gl}) {
    gl.canvas.addEventListener('mousemove', mousemove);
    gl.canvas.addEventListener('mouseleave', mouseleave);

    // -- Initialize data
    const trianglePositions = new Float32Array([
      0.015, 0.0,
      -0.010, 0.010,
      -0.010, -0.010
    ]);

    const instanceOffsets = new Float32Array(NUM_INSTANCES * 2);
    const instanceRotations = new Float32Array(NUM_INSTANCES);
    const instanceColors = new Float32Array(NUM_INSTANCES * 3);
    const pickingColors = new Uint8ClampedArray(NUM_INSTANCES * 2);

    for (let i = 0; i < NUM_INSTANCES; ++i) {
      instanceOffsets[i * 2] = Math.random() * 2.0 - 1.0;
      instanceOffsets[i * 2 + 1] = Math.random() * 2.0 - 1.0;

      instanceRotations[i] = Math.random() * 2 * Math.PI;

      const randValue = Math.random();
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

    const positionBuffer = new Buffer(gl, {data: trianglePositions});
    const colorBuffer = new Buffer(gl, {data: instanceColors, instanced: 1});
    const offsetBuffer = new Buffer(gl, {data: instanceOffsets});
    const rotationBuffer = new Buffer(gl, {data: instanceRotations});

    const renderModel = new Model(gl, {
      id: 'RenderModel',
      vs: DRAW_VS,
      fs: DRAW_FS,
      drawMode: gl.TRIANGLE_FAN,
      vertexCount: 3,
      isInstanced: true,
      instanceCount: NUM_INSTANCES,
      attributes: {
        a_position: positionBuffer,
        a_color: colorBuffer,
        a_offset: offsetBuffer,
        a_rotation: rotationBuffer,
        instancePickingColors: {value: pickingColors, size: 2, instanced: 1}
      },
      modules: [picking]
    });

    const transform = new Transform(gl, {
      vs: EMIT_VS,
      elementCount: NUM_INSTANCES,
      sourceBuffers: {
        a_offset: offsetBuffer,
        a_rotation: rotationBuffer
      },
      feedbackMap: {
        a_offset: 'v_offset',
        a_rotation: 'v_rotation'
      }
    });

    return {
      positionBuffer,
      rotationBuffer,
      colorBuffer,
      offsetBuffer,
      renderModel,
      transform
    };
  },
  /* eslint-enable max-statements */

  onRender({
    gl,
    width,
    height,
    renderModel,
    positionBuffer,
    colorBuffer,
    transform,
    framebuffer,
    useDevicePixels,
    time
  }) {

    transform.run({
      uniforms: {
        u_time: time
      }
    });

    transform.swapBuffers();

    const offsetBuffer = transform.getBuffer('v_offset');
    const rotationBuffer = transform.getBuffer('v_rotation');

    offsetBuffer.updateAccessor({instanced: 1});
    rotationBuffer.updateAccessor({instanced: 1});

    renderModel.clear({color: [0.0, 0.0, 0.0, 1.0], depth: true});
    renderModel.draw({
      attributes: {
        a_offset: offsetBuffer,
        a_rotation: rotationBuffer
      },
      parameters: {
        blend: true,
        blendFunc: [gl.SRC_ALPHA, gl.ONE]
      }
    });

    offsetBuffer.updateAccessor({instanced: 0});
    rotationBuffer.updateAccessor({instanced: 0});

    const pickInfo = pickPosition && pickModels(gl, {
      models: [renderModel],
      position: pickPosition,
      useDevicePixels,
      framebuffer
    });

    const pickingSelectedColor = (pickInfo && pickInfo.color) || null;

    renderModel.updateModuleSettings({
      pickingSelectedColor,
      pickingHighlightColor: RED
    });

  },

  onFinalize({renderModel, transform}) {
    renderModel.delete();
    transform.delete();
  }
});

animationLoop.getInfo = () => INFO_HTML;

export default animationLoop;

/* global window */
if (!window.website) {
  animationLoop.start();
}
