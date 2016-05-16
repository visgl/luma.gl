import test from 'tape';
import io from '../../io'

/* global document */
import {WebGLRenderingContext} from '../../src/webgl/webgl-types';

import createContext from 'gl';
import {Program, Texture2D, Buffer} from '../../src/webgl';

const DATA_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVQIW2P8z/D/PwMDAwMjjAEAQOwF/W1Dp54AAAAASUVORK5CYII='

test('WebGL#read-texture', t => {
  const gl = createContext(2, 2);

  const program = new Program(gl, {
    vs: `
    precision mediump float;
    attribute vec2 position;
    varying vec2 uv;
    void main () {
      uv = 0.5 * (1.0 + position);
      gl_Position = vec4(position, 0.0, 1.0);
    }`,

    fs: `
    precision mediump float;
    uniform sampler2D tex;
    varying vec2 uv;
    void main () {
      gl_FragColor = texture2D(tex, uv);
    }`
  });
  t.ok(program instanceof Program, 'Program construction successful');


  var triangle = new Buffer(gl, {
    attribute: 'position',
    data: new Float32Array([
      -4, 4,
      4, 4,
      0, -4]),
    size: 2
  });
  t.ok(triangle instanceof Buffer, 'Buffer construction successful');

  io.loadImage(DATA_URL)
    .then((image) => {
      const texture = new Texture2D(gl, image);
      t.ok(texture instanceof Texture2D, 'Texture2D construction successful');
      texture.bind()

      program.use();
      program
        .setBuffer(triangle)
        .setUniforms({
          tex: 0
        });

      gl.drawArrays(gl.TRIANGLES, 0, 3);

      const pixels = new Uint8Array(2 * 2 * 4);
      gl.readPixels(0, 0, 2, 2, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      t.same(pixels, new Uint8Array([
        255, 0, 255, 255,
        255, 0, 255, 255,
        255, 0, 255, 255,
        255, 0, 255, 255
      ]), 'pixels ok');

      t.end();
    });
});
