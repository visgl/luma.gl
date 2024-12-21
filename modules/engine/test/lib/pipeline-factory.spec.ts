// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {getWebGLTestDevice} from '@luma.gl/test-utils';

import {PipelineFactory} from '@luma.gl/engine';

// TODO - this doesn't test that parameters etc are properly cached

const vsSource = /* glsl */ `\
in vec4 positions;

void main(void) {
  gl_Position = positions;
}
`;
const fsSource = /* glsl */ `\
precision highp float;

out vec4 fragColor;
void main(void) {
  fragColor = vec4(1.0, 1.0, 1.0, 1.0);
}
`;

test('PipelineFactory#import', t => {
  t.ok(PipelineFactory !== undefined, 'PipelineFactory import successful');
  t.end();
});

test('PipelineFactory#getDefaultPipelineFactory', async t => {
  const webglDevice = await getWebGLTestDevice();

  const pm1 = PipelineFactory.getDefaultPipelineFactory(webglDevice);
  const pm2 = PipelineFactory.getDefaultPipelineFactory(webglDevice);

  t.ok(pm1 instanceof PipelineFactory, 'Default pipeline manager created');
  t.ok(pm1 === pm2, 'Default pipeline manager cached');

  t.end();
});

test('PipelineFactory#release', async t => {
  const webglDevice = await getWebGLTestDevice();
  if (!webglDevice.props._cachePipelines) {
    t.comment('Pipeline caching not enabled');
    t.end();
    return;
  }

  const pipelineFactory = new PipelineFactory(webglDevice);

  const vs = webglDevice.createShader({stage: 'vertex', source: vsSource});
  const fs = webglDevice.createShader({stage: 'fragment', source: fsSource});
  const pipeline1 = pipelineFactory.createRenderPipeline({vs, fs, topology: 'triangle-list'});
  const pipeline2 = pipelineFactory.createRenderPipeline({vs, fs, topology: 'triangle-list'});

  pipelineFactory.release(pipeline1);
  t.ok(!pipeline1.destroyed, 'Pipeline not deleted when still referenced.');

  pipelineFactory.release(pipeline2);
  t.ok(pipeline2.destroyed, 'Pipeline deleted when all references released.');

  t.end();
});
