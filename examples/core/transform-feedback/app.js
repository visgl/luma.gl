/* global document, window,*/
/* eslint-disable no-console */
// /* global console */
import React, {PureComponent} from 'react';
import {render} from 'react-dom';

import {
  createGLContext, Buffer, Program, TransformFeedback, VertexArrayObject,
  Matrix4
} from 'luma.gl';

const BYTE_SIZE = Float32Array.BYTES_PER_ELEMENT;

const POSITION_LOCATION = 0;
const COLOR_LOCATION = 3;
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
    const programTransform = new Program(gl, {
      vs: VS_TRANSFORM,
      fs: FS_TRANSFORM
    });

    const programFeedback = new Program(gl, {
      vs: VS_FEEDBACK,
      fs: FS_FEEDBACK,
      varyings: VARYINGS
    });

    // const transformFeedback = new TransformFeedback(gl);

    // TODO remove, the following is already implemented in luma.gl
    // const transformFeedback = new TransformFeedback(gl).bind();
    // // TODO the followings -> luma.gl
    // transformFeedback.varyings(programTransform.handle, VARYINGS, gl.SEPARATE_ATTRIBS);
    // gl.linkProgram(programTransform.handle);

    // ---- SETUP BUFFERS ---- //
    const VERTEX_COUNT = 6;
    const positions = new Float32Array([
      -1.0, -1.0, 0.0, 1.0,
      1.0, -1.0, 0.0, 1.0,
      1.0, 1.0, 0.0, 1.0,
      1.0, 1.0, 0.0, 1.0,
      -1.0, 1.0, 0.0, 1.0,
      -1.0, -1.0, 0.0, 1.0
    ]);

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
    // const vaoTransform = new VertexArrayObject(gl).bind();
    const vaoTransform = new VertexArrayObject(gl);

    // TODO how to use setBuffers for copied data?

    buffers[VERTEX].bind();
    gl.enableVertexAttribArray(POSITION_LOCATION);
    gl.vertexAttribPointer(POSITION_LOCATION, 4, gl.FLOAT, false, 0, 0);
    buffers[VERTEX].unbind();

    vaoTransform.unbind();

    const vaoFeedback = new VertexArrayObject(gl).bind();

    // gl.bindBuffer(gl.ARRAY_BUFFER, bufferPosition);
    buffers[POSITION].bind();
    gl.vertexAttribPointer(POSITION_LOCATION, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(POSITION_LOCATION);
    buffers[POSITION].unbind();

    buffers[COLOR].bind();
    gl.vertexAttribPointer(COLOR_LOCATION, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(COLOR_LOCATION);
    buffers[COLOR].unbind();

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    vaoFeedback.unbind();

    // ---- RENDERING ---- //
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // first pass, offscreen, no rasterization, vertices processing only
    programTransform.use();
    const mvpLocation = programTransform.getUniformLocation('MVP');
    const mvp = (new Matrix4()).identity();
    gl.uniformMatrix4fv(mvpLocation, false, mvp);

    vaoTransform.bind();

    const transformFeedback = new TransformFeedback(gl);
    transformFeedback.bindBuffer({index: 0, buffer: buffers[POSITION]});
    transformFeedback.bindBuffer({index: 1, buffer: buffers[COLOR]});

    // buffers[POSITION].bind({target: gl.TRANSFORM_FEEDBACK_BUFFER, index: 0});
    // buffers[COLOR].bind({target: gl.TRANSFORM_FEEDBACK_BUFFER, index: 1});
    // buffers[POSITION].bindBase({target: gl.TRANSFORM_FEEDBACK_BUFFER, index: 0});
    // buffers[COLOR].bindBase({target: gl.TRANSFORM_FEEDBACK_BUFFER, index: 1});

    // gl.enable(gl.RASTERIZER_DISCARD);
    // transformFeedback.begin(gl.TRIANGLES);
    // gl.drawArrays(gl.TRIANGLES, 0, VERTEX_COUNT, 1);
    // transformFeedback.end();
    // gl.disable(gl.RASTERIZER_DISCARD);

    programTransform.draw(gl, {
      drawMode: gl.TRIANGLES,
      vertexCount: VERTEX_COUNT,
      transformFeedback
    });

    transformFeedback.unbind({index: 0});
    transformFeedback.unbind({index: 1});

    // buffers[COLOR].unbind({target: gl.TRANSFORM_FEEDBACK_BUFFER, index: 1});
    // buffers[POSITION].unbind({target: gl.TRANSFORM_FEEDBACK_BUFFER, index: 0});
    // buffers[COLOR].unbindBase({target: gl.TRANSFORM_FEEDBACK_BUFFER, index: 1});
    // buffers[POSITION].unbindBase({target: gl.TRANSFORM_FEEDBACK_BUFFER, index: 0});

    vaoTransform.unbind();

    // second pass, render to screen
    programFeedback.use();
    vaoFeedback.bind();
    // gl.drawArrays(gl.TRIANGLE_FAN, 0, VERTEX_COUNT, 1);
    programTransform.draw(gl, {
      drawMode: gl.TRIANGLES,
      vertexCount: VERTEX_COUNT
    });
    vaoFeedback.unbind();

    // ---- CLEAN UP ---- //
    transformFeedback.unbind();
    transformFeedback.delete();

    buffers[VERTEX].delete();
    buffers[POSITION].delete();
    buffers[COLOR].delete();

    programTransform.delete();
    programFeedback.delete();

    vaoTransform.delete();
    vaoFeedback.delete();
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
