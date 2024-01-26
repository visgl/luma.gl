import test from 'tape-promise/tape';
import {webglDevice} from '@luma.gl/test-utils';

import {glsl} from '@luma.gl/core';
import {PipelineFactory} from '@luma.gl/engine';


// TODO - this doesn't test that parameters etc are properly cached

const vs = glsl`\
attribute vec4 positions;

void main(void) {
  gl_Position = positions;
}
`;
const fs = glsl`\
precision highp float;

void main(void) {
  gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
}
`;

test('PipelineFactory#import', (t) => {
  t.ok(PipelineFactory !== undefined, 'PipelineFactory import successful');
  t.end();
});

test('PipelineFactory#getDefaultPipelineFactory', (t) => {
  const pm1 = PipelineFactory.getDefaultPipelineFactory(webglDevice);
  const pm2 = PipelineFactory.getDefaultPipelineFactory(webglDevice);

  t.ok(pm1 instanceof PipelineFactory, 'Default pipeline manager created');
  t.ok(pm1 === pm2, 'Default pipeline manager cached');

  t.end();
});

test('PipelineFactory#release', (t) => {
  const pipelineFactory = new PipelineFactory(webglDevice);

  const pipeline1 = pipelineFactory.createRenderPipeline({vs, fs, topology: 'triangle-list'});
  const pipeline2 = pipelineFactory.createRenderPipeline({vs, fs, topology: 'triangle-list'});

  pipelineFactory.release(pipeline1);
  t.ok(!pipeline1.destroyed, 'Pipeline not deleted when still referenced.');

  pipelineFactory.release(pipeline2);
  t.ok(pipeline2.destroyed, 'Pipeline deleted when all references released.');

  t.end();
});
