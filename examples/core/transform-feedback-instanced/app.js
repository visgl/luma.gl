/* global window,*/
/* eslint-disable no-console */

/* eslint-disable max-len */
// NOTE: This is a port of standard WebGL2 Example : https://github.com/WebGLSamples/WebGL2Samples/blob/master/samples/transform_feedback_instanced.html
// This example demonstrates how to use luma.gl TransformFeedback API.
/* eslint-disable max-len */

import {
  AnimationLoop, Buffer, Program, TransformFeedback, VertexArray,
  setParameters, Model, Geometry
} from 'luma.gl';

const OFFSET_LOCATION = 0;
const ROTATION_LOCATION = 1;
const POSITION_LOCATION = 2;
const COLOR_LOCATION = 3;
const VARYINGS = ['v_offset', 'v_rotation'];

const VS_EMIT = `#version 300 es
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
            v_offset.x > MAP_HALF_LENGTH ? - MAP_HALF_LENGTH : ( v_offset.x < - MAP_HALF_LENGTH ? MAP_HALF_LENGTH : v_offset.x ) ,
            v_offset.y > MAP_HALF_LENGTH ? - MAP_HALF_LENGTH : ( v_offset.y < - MAP_HALF_LENGTH ? MAP_HALF_LENGTH : v_offset.y )
            );

        gl_Position = vec4(v_offset, 0.0, 1.0);
    }
`;

const FS_EMIT = `#version 300 es
  precision highp float;
  precision highp int;

  void main()
  {
  }
`;

const VS_DRAW = `#version 300 es
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

      // -hack-
      // gl_Position = vec4(a_position, 0.0, 1.0);
      // v_color.xy = a_offset;
      // v_color.z = a_rotation;
}
`;

const FS_DRAW = `#version 300 es
  #define ALPHA 0.9

  precision highp float;
  precision highp int;

  in vec3 v_color;

  out vec4 color;

  void main()
  {
      color = vec4(v_color * ALPHA, ALPHA);
}
`;

const NUM_INSTANCES = 1000;
let currentSourceIdx = 0;

const animationLoop = new AnimationLoop({
  glOptions: {webgl2: true},
  // eslint-disable-next-line
  onInitialize({canvas, gl}) {

    const modelRender = new Model(gl, {
      id: 'Model-Render',
      program: new Program(gl, {
        vs: VS_DRAW,
        fs: FS_DRAW
      }),
      geometry: new Geometry({
        id: 'Model-Render-Geometry',
        drawMode: gl.TRIANGLE_FAN,
        vertexCount: 3
      }),
      isInstanced: true,
      instanceCount: NUM_INSTANCES,
      isIndexed: false
    });

    const modelTransform = new Model(gl, {
      id: 'Model-Transform',
      program: new Program(gl, {
        vs: VS_EMIT,
        fs: FS_EMIT,
        varyings: VARYINGS
      }),
      geometry: new Geometry({
        id: 'Model-Transform-Geometry',
        drawMode: gl.POINTS,
        vertexCount: NUM_INSTANCES
      }),
      isInstanced: false,
      isIndexed: false
    });

    // -- Initialize data
    const trianglePositions = new Float32Array([
      0.015, 0.0,
      -0.010, 0.010,
      -0.010, -0.010
    ]);

    const instanceOffsets = new Float32Array(NUM_INSTANCES * 2);
    const instanceRotations = new Float32Array(NUM_INSTANCES);
    const instanceColors = new Float32Array(NUM_INSTANCES * 3);

    for (let i = 0; i < NUM_INSTANCES; ++i) {
      const oi = i * 2;
      const ri = i;
      const ci = i * 3;

      instanceOffsets[oi] = Math.random() * 2.0 - 1.0;
      instanceOffsets[oi + 1] = Math.random() * 2.0 - 1.0;

      instanceRotations[ri] = Math.random() * 2 * Math.PI;

      instanceColors[ci] = Math.random();
      instanceColors[ci + 1] = Math.random();
      instanceColors[ci + 2] = Math.random();
    }

    // -- Init VertexArrays and TransformFeedback objects

    const vertexArrays = new Array(2);
    const transformVertexArrays = new Array(2);
    const transformFeedbacks = new Array(2);

    const positionBuffer = new Buffer(gl, {
      data: trianglePositions,
      size: 2,
      type: gl.FLOAT,
      normalized: false,
      stride: 0,
      offset: 0,
      instanced: 0,
      usage: gl.STATIC_DRAW
    });

    const colorBuffer = new Buffer(gl, {
      data: instanceColors,
      size: 3,
      type: gl.FLOAT,
      normalized: false,
      stride: 0,
      offset: 0,
      instanced: 1,
      usage: gl.STATIC_DRAW
    });

    for (let va = 0; va < vertexArrays.length; ++va) {
      const offsetBuffer = new Buffer(gl, {
        data: instanceOffsets,
        size: 2,
        type: gl.FLOAT,
        normalized: false,
        stride: 0,
        offset: 0,
        instanced: 1,
        usage: gl.STREAM_COPY
      });

      const rotationBuffer = new Buffer(gl, {
        data: instanceRotations,
        size: 1,
        type: gl.FLOAT,
        normalized: false,
        stride: 0,
        offset: 0,
        instanced: 1,
        usage: gl.STREAM_COPY
      });

      vertexArrays[va] = new VertexArray(gl, {
        buffers: {
          [COLOR_LOCATION]: {
            buffer: colorBuffer,
            size: 3,
            type: gl.FLOAT,
            normalized: false,
            stride: 0,
            offset: 0,
            instanced: 1
          },
          [OFFSET_LOCATION]: {
            buffer: offsetBuffer,
            size: 2,
            type: gl.FLOAT,
            normalized: false,
            stride: 0,
            offset: 0,
            instanced: 1
          },
          [ROTATION_LOCATION]: {
            buffer: rotationBuffer,
            size: 1,
            type: gl.FLOAT,
            normalized: false,
            stride: 0,
            offset: 0,
            instanced: 1
          },
          [POSITION_LOCATION]: {
            buffer: positionBuffer,
            size: 2,
            type: gl.FLOAT,
            normalized: false,
            stride: 0,
            offset: 0,
            instanced: 0
          }
        }
      });

      transformVertexArrays[va] = new VertexArray(gl, {
        buffers: {
          [OFFSET_LOCATION]: {
            buffer: offsetBuffer,
            size: 2,
            type: gl.FLOAT,
            normalized: false,
            stride: 0,
            offset: 0,
            instanced: 0
          },
          [ROTATION_LOCATION]: {
            buffer: rotationBuffer,
            size: 1,
            type: gl.FLOAT,
            normalized: false,
            stride: 0,
            offset: 0,
            instanced: 0
          }
        }
      });

      /* eslint-disable camelcase  */
      transformFeedbacks[va] = new TransformFeedback(gl, {
        buffers: {
          v_rotation: rotationBuffer,
          v_offset: offsetBuffer
        },
        varyingMap: modelTransform.program.varyingMap
      });
      /* eslint-enable camelcase  */
    }

    setParameters(gl, {
      clearColor: [0.0, 0.0, 0.0, 1.0],
      blend: true,
      blendFunc: [gl.SRC_ALPHA, gl.ONE]
    });

    return {
      vertexArrays,
      transformVertexArrays,
      transformFeedbacks,
      modelRender,
      modelTransform
    };
  },

  onRender({
    gl,
    tick,
    width,
    height,
    aspect,
    vertexArrays,
    transformVertexArrays,
    transformFeedbacks,
    modelRender,
    modelTransform
  }) {

    gl.viewport(0, 0, width, height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const destinationIdx = (currentSourceIdx + 1) % 2;

    modelTransform.draw({
      vertexArray: transformVertexArrays[currentSourceIdx],
      transformFeedback: transformFeedbacks[destinationIdx]
    });

    modelRender.draw({
      vertexArray: vertexArrays[currentSourceIdx]
    });

    currentSourceIdx = destinationIdx;
  },

  onFinalize({
    vertexArrays,
    transformVertexArrays,
    transformFeedbacks,
    modelRender,
    modelTransform
  }) {
    for (let i = 0; i < 2; i++) {
      vertexArrays[i].delete();
      transformVertexArrays[i].delete();
      transformFeedbacks[i].delete();
    }
    modelRender.delete();
    modelTransform.delete();
  }
});

animationLoop.getInfo = () => {
  return `
    <p></p>
  `;
};

export default animationLoop;

// expose on Window for standalone example
window.animationLoop = animationLoop; // eslint-disable-lie
