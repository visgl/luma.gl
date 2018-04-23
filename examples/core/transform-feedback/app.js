import {
  AnimationLoop, Buffer, Program, TransformFeedback, VertexArray, setParameters
} from 'luma.gl';
import {Matrix4} from 'math.gl';

const INFO_HTML = `
<p>
Gradient calculated on the GPU using <code>Transform Feedback</code>.
</p>
`;

const FLOAT_SIZE = Float32Array.BYTES_PER_ELEMENT;

const POSITION_LOCATION = 0;
const COLOR_LOCATION = 1;
const VARYINGS = ['gl_Position', 'v_color'];

const VS_TRANSFORM = `#version 300 es
  precision highp float;
  precision highp int;

  layout(location = ${POSITION_LOCATION}) in vec4 position;
  uniform mat4 MVP;

  out vec4 v_color;

  void main() {
    gl_Position = MVP * position;
    v_color = vec4(clamp(vec2(position), 0.0, 1.0), 0.0, 1.0);
  }
`;

const FS_TRANSFORM = `#version 300 es
  precision highp float;
  precision highp int;

  in vec4 v_color;
  out vec4 color;

  void main() {
    color = v_color;
  }
`;

const VS_FEEDBACK = `#version 300 es
  precision highp float;
  precision highp int;

  layout(location = ${POSITION_LOCATION}) in vec4 position;
  layout(location = ${COLOR_LOCATION}) in vec4 color;

  out vec4 v_color;
  void main() {
    gl_Position = position;
    v_color = color;
  }
`;

const FS_FEEDBACK = `#version 300 es
  precision highp float;
  precision highp int;

  in vec4 v_color;
  out vec4 color;

  void main() {
    color = v_color;
  }
`;

const VERTEX_COUNT = 6;

const POSITIONS = [
  -1.0, -1.0, 0.0, 1.0,
  1.0, -1.0, 0.0, 1.0,
  1.0, 1.0, 0.0, 1.0,
  1.0, 1.0, 0.0, 1.0,
  -1.0, 1.0, 0.0, 1.0,
  -1.0, -1.0, 0.0, 1.0
];

const animationLoop = new AnimationLoop({
  glOptions: {
    webgl2: true,
    debug: true
  },
  // eslint-disable-next-line
  onInitialize({canvas, gl}) {
    // ---- SETUP BUFFERS ---- //
    const bytes = POSITIONS.length * FLOAT_SIZE;
    const buffers = {
      vertex: new Buffer(gl, {data: new Float32Array(POSITIONS)}),
      position: new Buffer(gl, {bytes, type: gl.FLOAT, usage: gl.STATIC_COPY}),
      color: new Buffer(gl, {bytes, type: gl.FLOAT, usage: gl.STATIC_COPY})
    };

    // first pass, offscreen, no rasterization, vertices processing only
    const transformProgram = new Program(gl, {
      vs: VS_TRANSFORM, fs: FS_TRANSFORM, varyings: VARYINGS
    });

    const transformVertexArray = new VertexArray(gl, {
      buffers: {
        [POSITION_LOCATION]: {buffer: buffers.vertex, size: 4}
      }
    });

    const transformFeedback = new TransformFeedback(gl, {
      buffers: {
        0: buffers.position,
        1: buffers.color
      }
    });

    const renderProgram = new Program(gl, {vs: VS_FEEDBACK, fs: FS_FEEDBACK});

    transformProgram.draw({
      drawMode: gl.TRIANGLES,
      vertexCount: VERTEX_COUNT,
      vertexArray: transformVertexArray,
      transformFeedback,
      uniforms: {
        MVP: new Matrix4().identity()
      },
      parameters: {
        [gl.RASTERIZER_DISCARD]: true
      }
    });

    // second pass, render to screen
    setParameters(gl, {
      clearColor: [0.0, 0.0, 0.0, 1.0]
    });
    gl.clear(gl.COLOR_BUFFER_BIT);

    const renderVertexArray = new VertexArray(gl, {
      buffers: {
        [POSITION_LOCATION]: {buffer: buffers.position, size: 4},
        [COLOR_LOCATION]: {buffer: buffers.color, size: 4}
      }
    });

    renderProgram.draw({
      drawMode: gl.TRIANGLE_FAN,
      vertexCount: VERTEX_COUNT,
      vertexArray: renderVertexArray
    });

    return false; // Don't start animation loop
  },

  onFinalize({
    buffers, transformProgram, transformVertexArray, transformFeedback,
    renderProgram, renderVertexArray
  }) {
    transformFeedback.delete();
    transformVertexArray.delete();
    transformProgram.delete();

    renderVertexArray.delete();
    renderProgram.delete();

    buffers.forEach(buffer => buffer.delete());
  }
});

animationLoop.getInfo = () => INFO_HTML;

export default animationLoop;

/* global window */
if (!window.website) {
  animationLoop.start();
}
