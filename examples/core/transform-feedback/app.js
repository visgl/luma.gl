/* eslint-disable camelcase */
import {AnimationLoop, Buffer, Model, isWebGL2, log} from '@luma.gl/core';

const INFO_HTML = `
<p>
Gradient calculated on the GPU using <code>Transform Feedback</code>.
</p>
`;
// Text to be displayed on environments when this demos is not supported.
const ALT_TEXT = 'THIS DEMO REQUIRES WEBLG2, BUT YOUR BRWOSER DOESN\'T SUPPORT IT';

const FLOAT_SIZE = Float32Array.BYTES_PER_ELEMENT;

const POSITION_LOCATION = 0;
const COLOR_LOCATION = 1;
const VARYINGS = ['gl_Position', 'v_color'];

const VS_TRANSFORM = `\
#version 300 es
layout(location = ${POSITION_LOCATION}) in vec4 position;

out vec4 v_color;

void main() {
  gl_Position = position;
  v_color = vec4(clamp(vec2(position), 0.0, 1.0), 0.0, 1.0);
}
`;

const FS_TRANSFORM = `\
#version 300 es
precision highp float;
void main() {}
`;

const VS_RENDER = `\
#version 300 es
layout(location = ${POSITION_LOCATION}) in vec4 position;
layout(location = ${COLOR_LOCATION}) in vec4 color;

out vec4 v_color;

void main() {
  gl_Position = position;
  v_color = color;
}
`;

const FS_RENDER = `\
#version 300 es
precision highp float;

in vec4 v_color;
out vec4 fragColor;

void main() {
  fragColor = v_color;
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

let isDemoSupported = true;

const animationLoop = new AnimationLoop({
  glOptions: {
    webgl2: true,
    webgl1: false
  },

  // eslint-disable-next-line
  onInitialize({canvas, gl}) {
    isDemoSupported = isWebGL2(gl);
    if (!isDemoSupported) {
      log.error(ALT_TEXT)();
      return {};
    }
    // ---- SETUP BUFFERS ---- //
    const byteLength = POSITIONS.length * FLOAT_SIZE;
    const buffers = {
      vertex: new Buffer(gl, {data: new Float32Array(POSITIONS)}),
      position: new Buffer(gl, {byteLength, usage: gl.STATIC_COPY, accessor: {type: gl.FLOAT}}),
      color: new Buffer(gl, {byteLength, usage: gl.STATIC_COPY, accessor: {type: gl.FLOAT}})
    };

    // first pass, offscreen, no rasterization, vertices processing only
    const transformModel = new Model(gl, {
      vs: VS_TRANSFORM,
      fs: FS_TRANSFORM,
      varyings: VARYINGS,
      drawMode: gl.TRIANGLES,
      vertexCount: VERTEX_COUNT,
      attributes: {
        [POSITION_LOCATION]: buffers.vertex
      },
      _feedbackBuffers: {
        gl_Position: buffers.position,
        v_color: buffers.color
      }
    });

    const renderModel = new Model(gl, {
      vs: VS_RENDER,
      fs: FS_RENDER,
      drawMode: gl.TRIANGLES,
      vertexCount: 6,
      attributes: {
        [POSITION_LOCATION]: buffers.position,
        [COLOR_LOCATION]: buffers.color
      }
    });

    return {
      transformModel,
      renderModel
    };
  },

  onRender({gl, time, renderModel, transformModel}) {
    if (!isDemoSupported) {
      return;
    }
    transformModel.transform({unbindModels: [renderModel]});

    // second pass, render to screen
    renderModel.clear({color: [0.0, 0.0, 0.0, 1.0]});
    renderModel.draw();
  }
});

animationLoop.getInfo = () => INFO_HTML;
animationLoop.isSupported = () => {
  return isDemoSupported;
}
animationLoop.getAltText = () => {
  return ALT_TEXT;
}

export default animationLoop;

/* global window */
if (typeof window !== 'undefined' && !window.website) {
  animationLoop.start();
}
