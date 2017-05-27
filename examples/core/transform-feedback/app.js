/* global document, window,*/
/* eslint-disable no-console */
/* eslint max-statements: ["error", 100] */
import React, {PureComponent} from 'react';
import {render} from 'react-dom';

import {
  createGLContext, Buffer, Program, TransformFeedback, VertexArrayObject,
  Matrix4
} from '../../../src';

const POSITION_LOCATION = 0;
const COLOR_LOCATION = 1;

const VS_TRANSFORM_FEEDBACK = `#version 300 es
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

const FS_TRANSFORM_FEEDBACK = `#version 300 es
  precision highp float;
  precision highp int;

  in vec4 v_color;
  out vec4 color;

  void main() {
    color = v_color;
  }
`;

const VS_RENDERING = `#version 300 es
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

const FS_RENDERING = `#version 300 es
  precision highp float;
  precision highp int;

  in vec4 v_color;
  out vec4 color;

  void main() {
    color = v_color;
  }
`;

class Root extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      width: 0,
      height: 0
    };
  }

  componentWillMount() {
    window.addEventListener('resize', this.onResize.bind(this));
    this.onResize();
  }

  componentDidMount() {
    if (!this.canvas) {
      return;
    }

    const gl = createGLContext({canvas: this.canvas, webgl2: true});

    // ---- SETUP PROGRAMS ---- //
    const programTransformFeedback = new Program(gl, {
      vs: VS_TRANSFORM_FEEDBACK,
      fs: FS_TRANSFORM_FEEDBACK,
      // specify the array of output variables in the TF vertex shader
      varyings: ['gl_Position', 'v_color']
    });

    const programRendering = new Program(gl, {
      vs: VS_RENDERING,
      fs: FS_RENDERING
    });

    // ---- SETUP BUFFERS/VBOs ---- //
    const VERTEX_COUNT = 6;
    // a rectangle consist of two triangles
    const positions = new Float32Array([
      -1.0, -1.0, 0.0, 1.0,
      1.0, -1.0, 0.0, 1.0,
      1.0, 1.0, 0.0, 1.0,
      1.0, 1.0, 0.0, 1.0,
      -1.0, 1.0, 0.0, 1.0,
      -1.0, -1.0, 0.0, 1.0
    ]);

    const bufferVertex = new Buffer(gl).setData({data: positions});
    // only draw once, use STATIC_COPY for position and color
    const bufferPosition = new Buffer(gl).setData({
      bytes: positions.length * Float32Array.BYTES_PER_ELEMENT,
      usage: gl.STATIC_COPY,
      type: gl.FLOAT
    });
    const bufferColor = new Buffer(gl).setData({
      bytes: positions.length * Float32Array.BYTES_PER_ELEMENT,
      usage: gl.STATIC_COPY,
      type: gl.FLOAT
    });

    // ---- SETUP VAOs ---- //
    const vaoTransformFeedback = new VertexArrayObject(gl).bind();

    bufferVertex.bind();
    gl.enableVertexAttribArray(POSITION_LOCATION);
    gl.vertexAttribPointer(POSITION_LOCATION, 4, gl.FLOAT, false, 0, 0);
    bufferVertex.unbind();

    vaoTransformFeedback.unbind();

    const vaoRendering = new VertexArrayObject(gl).bind();

    bufferPosition.bind();
    gl.vertexAttribPointer(POSITION_LOCATION, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(POSITION_LOCATION);
    bufferPosition.unbind();

    bufferColor.bind();
    gl.vertexAttribPointer(COLOR_LOCATION, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(COLOR_LOCATION);
    bufferColor.unbind();

    vaoRendering.unbind();

    // ---- RENDERING ---- //
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const transformFeedback = new TransformFeedback(gl)
      .bindBuffer({index: 0, buffer: bufferPosition})
      .bindBuffer({index: 1, buffer: bufferColor});

    // first pass, offscreen, no rasterization, vertices processing only
    programTransformFeedback.use();
    const mvpLocation = programTransformFeedback.getUniformLocation('MVP');
    const mvp = new Matrix4().identity();
    gl.uniformMatrix4fv(mvpLocation, false, mvp);

    vaoTransformFeedback.bind();

    programTransformFeedback.draw(gl, {
      drawMode: gl.TRIANGLES,
      vertexCount: VERTEX_COUNT,
      transformFeedback
    });

    transformFeedback.unbindBuffer({index: 0});
    transformFeedback.unbindBuffer({index: 1});

    vaoTransformFeedback.unbind();

    // second pass, render to screen
    programRendering.use();
    vaoRendering.bind();
    // with the current API, it does not matter which program to use
    // as long as we do not pass in transformFeedback
    // it calls the same gl.draw* function
    programRendering.draw(gl, {
      drawMode: gl.TRIANGLES,
      vertexCount: VERTEX_COUNT
    });
    vaoRendering.unbind();

    // ---- CLEAN UP ---- //
    bufferVertex.delete();
    bufferPosition.delete();
    bufferColor.delete();

    transformFeedback.delete();

    programTransformFeedback.delete();
    programRendering.delete();

    vaoTransformFeedback.delete();
    vaoRendering.delete();
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.onResize.bind(this));
  }

  onResize() {
    const {innerWidth: width, innerHeight: height} = window;
    this.setState({width, height});
  }

  render() {
    const {width, height} = this.state;
    return width && height &&
      <canvas style={{width, height}}
        onMouseMove={this._onMouseMove} ref={canvas => {
          this.canvas = canvas;
        }}/>;
  }
}

const root = document.createElement('div');
document.body.appendChild(root);

render(<Root />, root);
