/* global document, window,*/
/* eslint-disable no-console */
import React, {PureComponent} from 'react';
import {render} from 'react-dom';

const POSITION_LOCATION = 0;
const COLOR_LOCATION = 3;
const BYTE_SIZE = Float32Array.BYTES_PER_ELEMENT;

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

    const gl = this.canvas.getContext('webgl2', {antialias: true});
    if (!gl) {
      console.log('WebGL2 is not available.')
      return;
    }

    // init programs
    const programTransform = createProgram(gl, VS_TRANSFORM, FS_TRANSFORM);
    const varyings = ['gl_Position', 'v_color'];
    gl.transformFeedbackVaryings(programTransform, varyings, gl.SEPARATE_ATTRIBS);
    gl.linkProgram(programTransform);

    const programFeedback = createProgram(gl, VS_FEEDBACK, FS_FEEDBACK);
    gl.linkProgram(programFeedback);

    // init buffers
    const VERTEX_COUNT = 6;
    const positions = new Float32Array([
      -1.0, -1.0, 0.0, 1.0,
      1.0, -1.0, 0.0, 1.0,
      1.0, 1.0, 0.0, 1.0,
      1.0, 1.0, 0.0, 1.0,
      -1.0, 1.0, 0.0, 1.0,
      -1.0, -1.0, 0.0, 1.0
    ]);

<<<<<<< HEAD
    const bufferVertex = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferVertex);
    // initialize and create the buffer object's data store
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
=======
    const VERTEX = 0;
    const POSITION = 1;
    const COLOR = 2;

    const buffers = [
      // VERTEX
      new Buffer(gl).setData({data: positions}),
      // POSITION
      new Buffer(gl).setData({
        bytes: positions.length * BYTE_SIZE,
        usage: gl.STATIC_COPY,
        type: gl.FLOAT
      }),
      // COLOR
      new Buffer(gl).setData({
        bytes: positions.length * BYTE_SIZE,
        usage: gl.STATIC_COPY,
        type: gl.FLOAT
      })
    ];

    // ---- SETUP VERTEX ARRAYS ---- //
    const vaoTransform = new VertexArrayObject(gl).bind();

    // TODO how to use setBuffers for copied data?

    buffers[VERTEX].bind();
    gl.enableVertexAttribArray(POSITION_LOCATION);
    gl.vertexAttribPointer(POSITION_LOCATION, 4, gl.FLOAT, false, 0, 0);
    buffers[VERTEX].unbind();
>>>>>>> some cleanup before rebase

    const bufferPosition = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferPosition);
    gl.bufferData(gl.ARRAY_BUFFER, positions.length * BYTE_SIZE, gl.STATIC_COPY);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    const bufferColor = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferColor);
    gl.bufferData(gl.ARRAY_BUFFER, positions.length * BYTE_SIZE, gl.STATIC_COPY);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    // init vertex array
    const vaoTransform = gl.createVertexArray();
    gl.bindVertexArray(vaoTransform);
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferVertex);
    gl.vertexAttribPointer(POSITION_LOCATION, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(POSITION_LOCATION);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);

    const vaoFeedback = gl.createVertexArray();
    gl.bindVertexArray(vaoFeedback);
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferPosition);
    gl.vertexAttribPointer(POSITION_LOCATION, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(POSITION_LOCATION);

    gl.bindBuffer(gl.ARRAY_BUFFER, bufferColor);
    gl.vertexAttribPointer(COLOR_LOCATION, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(COLOR_LOCATION);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);

    // init transform-feedback
    const transformFeedback = gl.createTransformFeedback();

    // render
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // first pass, offscreen, no rasterization, vertices processing only
    gl.enable(gl.RASTERIZER_DISCARD);
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, transformFeedback);

    gl.useProgram(programTransform);
    const matrix = new Float32Array([
      1.0, 0.0, 0.0, 0.0,
      0.0, 1.0, 0.0, 0.0,
      0.0, 0.0, 1.0, 0.0,
      0.0, 0.0, 0.0, 1.0
    ]);

    const mvpLocation = gl.getUniformLocation(programTransform, 'MVP');
    gl.uniformMatrix4fv(mvpLocation, false, matrix);

    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, bufferPosition);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 1, bufferColor);
    gl.bindVertexArray(vaoTransform);

    gl.beginTransformFeedback(gl.TRIANGLES);
    // gl.drawArraysInstanced(mode, first, count, instanceCount);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, VERTEX_COUNT, 1);
    gl.endTransformFeedback();

    gl.disable(gl.RASTERIZER_DISCARD);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 1, null);

    // second pass, render to screen
    gl.useProgram(programFeedback);
    gl.bindVertexArray(vaoFeedback);
    gl.drawArraysInstanced(gl.TRIANGLE_FAN, 0, VERTEX_COUNT, 1);
    gl.bindVertexArray(null);

    // clean up
    gl.deleteTransformFeedback(transformFeedback);
    gl.deleteBuffer(bufferVertex);
    gl.deleteBuffer(bufferPosition);
    gl.deleteBuffer(bufferColor);
    gl.deleteProgram(programTransform);
    gl.deleteProgram(programFeedback);
    gl.deleteVertexArray(vaoTransform);
    gl.deleteVertexArray(vaoFeedback);
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
<<<<<<< HEAD
    return width && height && <canvas ref={canvas => {
      this.canvas = canvas;
    }}
      style={{width, height}} onMouseMove={this._onMouseMove}/>;
=======
    return width && height && <canvas style={{width, height}}
      onMouseMove={this._onMouseMove} ref={canvas => {
        this.canvas = canvas;
      }}/>;
>>>>>>> some cleanup before rebase
  }
}

const root = document.createElement('div');
document.body.appendChild(root);

render(<Root />, root);
