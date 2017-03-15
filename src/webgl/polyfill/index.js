import 'instanced-arrays';
import 'vertex-array-object';
import initializeDrawBuffers from 'draw-buffers';

export default function initPolyfill(gl) {
  initializeDrawBuffers(gl);
}
