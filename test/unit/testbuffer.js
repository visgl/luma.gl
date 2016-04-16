import Buffer from '../../src/webgl/buffer';
import createContext from 'gl';
import test from 'tape';

test('Buffer#types', t => {
  t.ok(typeof Buffer === 'function');
  t.end();
});

test('Buffer#constructor', t => {
  var gl = createContext(2, 2);
  var buffer = new Buffer(gl, {
    data: new Float32Array([1, 2, 3, 4])
  });
  buffer.bind();
  t.equals(gl.getBufferParameter(gl.ARRAY_BUFFER, gl.BUFFER_SIZE), 16);
  buffer.destroy();
  gl.destroy();
  t.end();
});
