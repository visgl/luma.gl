import test from 'blue-tape';
import {createGLContext, Program, Texture2D, Buffer}
  from '../../../src/headless';
import {loadImage} from '../../../src/io';

const DATA_URL = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAA
Bytg0kAAAAFElEQVQIW2P8z/D/PwMDAwMjjAEAQOwF/W1Dp54AAAAASUVORK5CYII=`;

test('WebGL#load-file', t => {
  return loadImage(DATA_URL);
});

test('WebGL#read-texture', t => {
  const gl = createGLContext({width: 2, height: 2, debug: true});

  const program = new Program(gl, {
    vs: `
    precision mediump float;
    attribute vec2 positions;
    varying vec2 uv;
    void main () {
      uv = 0.5 * (1.0 + positions);
      gl_Position = vec4(positions, 0.0, 1.0);
    }`,

    fs: `
    precision mediump float;
    uniform sampler2D texSampler;
    varying vec2 uv;
    void main () {
      gl_FragColor = texture2D(texSampler, uv);
    }`
  });
  t.ok(program instanceof Program, 'Program construction successful');

  const triangle = new Buffer(gl).setData({
    data: new Float32Array([
      -4, 4,
      4, 4,
      0, -4]),
    size: 2
  });
  t.ok(triangle instanceof Buffer, 'Buffer construction successful');

  return loadImage(DATA_URL)
  .then(image => {
    const texture = new Texture2D(gl, {pixels: image, generateMipmap: true});
    t.ok(texture instanceof Texture2D, 'Texture2D construction successful');

    program
      .use()
      .setBuffers({positions: triangle})
      .setUniforms({texSampler: texture});

    gl.drawArrays(gl.TRIANGLES, 0, 3);

    const pixels = new Uint8Array(2 * 2 * 4);
    gl.readPixels(0, 0, 2, 2, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    t.same(pixels, new Uint8Array([
      255, 0, 255, 255,
      255, 0, 255, 255,
      255, 0, 255, 255,
      255, 0, 255, 255
    ]), 'modified pixels ok');
  });
});
