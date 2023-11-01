// luma.gl, MIT license
// Copyright (c) vis.gl contributors

/*
import test from 'tape-promise/tape';
import {RenderPipeline, Buffer, VertexArray} from '@luma.gl/webgl-legacy';

import {webgl1Device,getWebGLTestDevices} from '@luma.gl/test-utils';

const vs = `
attribute vec3 positions;
uniform mat4 uMVMatrix[2];
uniform mat4 uPMatrix;
varying vec3 vPosition;

void main(void) {
  gl_Position = uPMatrix * uMVMatrix[0] * vec4(positions, 1.0);
  vPosition = positions;
}
`;

const fs = `
void main(void) {
  gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
}
`;

const BUFFER_DATA = new Float32Array([0, 1, 0, -1, -1, 0, 1, -1, 0]);

test('WebGL#RenderPipeline construct/delete', (t) => {
  // @ts-expect-error
  t.throws(() => webgl1Device.createRenderPipeline( 'RenderPipeline throws on missing shader');

  const renderPipeline = webgl1Device.createRenderPipeline({vs, fs});
  t.ok(renderPipeline instanceof RenderPipeline, 'RenderPipeline construction successful');

  renderPipeline.destroy();
  t.ok(renderPipeline instanceof RenderPipeline, 'RenderPipeline delete successful');

  renderPipeline.destroy();
  t.ok(renderPipeline instanceof RenderPipeline, 'RenderPipeline repeated delete successful');

  t.end();
});

test('WebGL#RenderPipeline draw', (t) => {
  const renderPipeline = webgl1Device.createRenderPipeline({fs, vs});

  const vertexArray = webgl1Device.createVertexArray{renderPipeline});
  vertexArray.setAttributes({
    positions: new Buffer(gl, {data: BUFFER_DATA, accessor: {size: 3}}),
    unusedAttributeName: new Buffer(gl, {data: BUFFER_DATA, accessor: {size: 3}})
  });
  t.ok(vertexArray instanceof VertexArray, 'VertexArray set buffers successful');

  renderPipeline.draw({vertexArray, vertexCount: 3});
  t.ok(renderPipeline instanceof RenderPipeline, 'RenderPipeline draw successful');

  let didDraw = renderPipeline.draw({vertexArray, vertexCount: 3, parameters: {blend: true}});
  t.ok(renderPipeline instanceof RenderPipeline, 'RenderPipeline draw with parameters is successful');
  t.ok(didDraw, 'RenderPipeline draw successful');

  didDraw = renderPipeline.draw({vertexArray, vertexCount: 0});
  t.notOk(didDraw, 'RenderPipeline draw succesfully skipped');

  didDraw = renderPipeline.draw({vertexArray, vertexCount: 3, instanceCount: 0, isInstanced: true});
  t.notOk(didDraw, 'Instanced RenderPipeline draw succesfully skipped');

  t.end();
});

test('WebGL#RenderPipeline caching', (t) => {
  const renderPipeline = webgl1Device.createRenderPipeline({fs, vs});

  renderPipeline._isCached = true;
  renderPipeline.destroy();
  t.ok(!renderPipeline.destroyed, 'RenderPipeline should not be deleted');

  renderPipeline._isCached = false;
  renderPipeline.destroy();
  t.ok(renderPipeline.destroyed, 'RenderPipeline should be deleted');

  t.end();
});

test('WebGL#RenderPipeline uniform array', (t) => {
  const renderPipeline = webgl1Device.createRenderPipeline({vs, fs});

  t.ok(renderPipeline._uniformSetters.uMVMatrix, 'uniform array is ok');
  t.ok(renderPipeline._uniformSetters['uMVMatrix[0]'], 'uniform array is ok');
  t.ok(renderPipeline._uniformSetters['uMVMatrix[1]'], 'uniform array is ok');

  renderPipeline.destroy();
  t.end();
});
*/
