// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {getWebGLTestDevice} from '@luma.gl/test-utils';

import {luma} from '@luma.gl/core';
import {PipelineFactory} from '@luma.gl/engine';
import {webgl2Adapter, type WebGLDevice} from '@luma.gl/webgl';

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

const transformVsSource = /* glsl */ `\
#version 300 es
in float inValue;
out float outValue;
out float otherValue;
void main()
{
  outValue = 2.0 * inValue;
  otherValue = 3.0 * inValue;
  gl_Position = vec4(inValue, 0.0, 0.0, 1.0);
}
`;

const transformFsSource = /* glsl */ `\
#version 300 es
precision highp float;
in float outValue;
out vec4 fragmentColor;
void main()
{
  fragmentColor = vec4(outValue, 0.0, 0.0, 1.0);
}
`;

const alternateVsSource = /* glsl */ `\
in vec4 positions;

void main(void) {
  gl_Position = positions + vec4(0.0, 0.0, 0.0, 0.0);
}
`;

function isProgramDestroyed(handle: WebGLProgram): boolean {
  return Boolean((handle as WebGLProgram & {destroyed?: boolean}).destroyed);
}

function getSharedRenderPipelineCount(
  webglDevice: Awaited<ReturnType<typeof getWebGLTestDevice>>
): number {
  return webglDevice.statsManager
    .getStats('GPU Resource Counts')
    .get('SharedRenderPipelines Active').count;
}

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
  t.ok(!pipeline2.destroyed, 'Pipeline remains cached after all references are released.');

  t.end();
});

test('PipelineFactory#caching with parameters', async t => {
  const webglDevice = await getWebGLTestDevice();
  if (!webglDevice.props._cachePipelines) {
    t.comment('Pipeline caching not enabled');
    t.end();
    return;
  }

  const pipelineFactory = new PipelineFactory(webglDevice);
  const initialSharedRenderPipelineCount = getSharedRenderPipelineCount(webglDevice);

  const vs = webglDevice.createShader({stage: 'vertex', source: vsSource});
  const fs = webglDevice.createShader({stage: 'fragment', source: fsSource});

  const paramsA = {cullMode: 'back'};
  const pipeline1 = pipelineFactory.createRenderPipeline({
    vs,
    fs,
    topology: 'triangle-list',
    parameters: paramsA
  });
  const pipeline2 = pipelineFactory.createRenderPipeline({
    vs,
    fs,
    topology: 'triangle-list',
    parameters: paramsA
  });
  t.isEqual(pipeline1, pipeline2, 'Caches identical pipelines');

  const paramsB = {cullMode: 'front'};
  const pipeline3 = pipelineFactory.createRenderPipeline({
    vs,
    fs,
    topology: 'triangle-list',
    parameters: paramsB
  });
  t.notEqual(pipeline1, pipeline3, 'Does not cache wrapper pipelines with different parameters');
  t.equal(
    pipeline1.sharedRenderPipeline,
    pipeline3.sharedRenderPipeline,
    'Reuses the shared WebGL render pipeline record'
  );
  t.equal(
    getSharedRenderPipelineCount(webglDevice),
    initialSharedRenderPipelineCount + 1,
    'Tracks one active shared render pipeline for compatible WebGL wrappers'
  );
  t.equal(pipeline1.handle, pipeline3.handle, 'Reuses the underlying WebGLProgram');

  pipelineFactory.release(pipeline1);
  pipelineFactory.release(pipeline2);
  t.notOk(
    isProgramDestroyed(pipeline3.handle),
    'Shared program remains alive while another wrapper uses it'
  );
  pipelineFactory.release(pipeline3);
  t.equal(
    getSharedRenderPipelineCount(webglDevice),
    initialSharedRenderPipelineCount + 1,
    'Shared render pipeline resource remains cached after release'
  );
  t.notOk(
    isProgramDestroyed(pipeline3.handle),
    'Shared program remains cached after the last wrapper is released'
  );
  t.notOk(
    pipeline3.sharedRenderPipeline?.destroyed,
    'Shared render pipeline resource remains cached after the last wrapper is released'
  );

  t.end();
});

test('PipelineFactory#caching with topology on webgl', async t => {
  const webglDevice = await getWebGLTestDevice();
  if (!webglDevice.props._cachePipelines) {
    t.comment('Pipeline caching not enabled');
    t.end();
    return;
  }

  const pipelineFactory = new PipelineFactory(webglDevice);

  const vs = webglDevice.createShader({stage: 'vertex', source: vsSource});
  const fs = webglDevice.createShader({stage: 'fragment', source: fsSource});

  const trianglePipeline = pipelineFactory.createRenderPipeline({
    vs,
    fs,
    topology: 'triangle-list'
  });
  const linePipeline = pipelineFactory.createRenderPipeline({
    vs,
    fs,
    topology: 'line-strip'
  });

  t.notEqual(
    trianglePipeline,
    linePipeline,
    'Does not cache wrapper pipelines with different topology'
  );
  t.equal(
    trianglePipeline.handle,
    linePipeline.handle,
    'Reuses the underlying WebGLProgram across topology variants'
  );

  pipelineFactory.release(trianglePipeline);
  pipelineFactory.release(linePipeline);

  t.end();
});

test('PipelineFactory#caching with bufferLayout on webgl', async t => {
  const webglDevice = await getWebGLTestDevice();
  if (!webglDevice.props._cachePipelines) {
    t.comment('Pipeline caching not enabled');
    t.end();
    return;
  }

  const pipelineFactory = new PipelineFactory(webglDevice);

  const vs = webglDevice.createShader({stage: 'vertex', source: vsSource});
  const fs = webglDevice.createShader({stage: 'fragment', source: fsSource});

  const trianglePipeline = pipelineFactory.createRenderPipeline({
    vs,
    fs,
    topology: 'triangle-list',
    bufferLayout: [{name: 'positions', format: 'float32x3'}]
  });
  const interleavedPipeline = pipelineFactory.createRenderPipeline({
    vs,
    fs,
    topology: 'triangle-list',
    bufferLayout: [{name: 'positions', format: 'float32x4'}]
  });

  t.notEqual(
    trianglePipeline,
    interleavedPipeline,
    'Does not cache wrapper pipelines with different buffer layouts'
  );
  t.equal(
    trianglePipeline.handle,
    interleavedPipeline.handle,
    'Reuses the underlying WebGLProgram across buffer layout variants'
  );

  pipelineFactory.release(trianglePipeline);
  pipelineFactory.release(interleavedPipeline);

  t.end();
});

test('PipelineFactory#shared WebGL program cache is keyed by shader identity', async t => {
  const webglDevice = await getWebGLTestDevice();
  if (!webglDevice.props._cachePipelines) {
    t.comment('Pipeline caching not enabled');
    t.end();
    return;
  }

  const pipelineFactory = new PipelineFactory(webglDevice);

  const vs1 = webglDevice.createShader({stage: 'vertex', source: vsSource});
  const vs2 = webglDevice.createShader({stage: 'vertex', source: alternateVsSource});
  const fs = webglDevice.createShader({stage: 'fragment', source: fsSource});

  const pipeline1 = pipelineFactory.createRenderPipeline({vs: vs1, fs, topology: 'triangle-list'});
  const pipeline2 = pipelineFactory.createRenderPipeline({vs: vs2, fs, topology: 'triangle-list'});

  t.notEqual(
    pipeline1.sharedRenderPipeline,
    pipeline2.sharedRenderPipeline,
    'Does not share WebGL programs across different shader sources'
  );
  t.notEqual(
    pipeline1.handle,
    pipeline2.handle,
    'Creates a distinct WebGLProgram when shaders differ'
  );

  pipelineFactory.release(pipeline1);
  pipelineFactory.release(pipeline2);

  t.end();
});

test('PipelineFactory#sharing can be disabled independently from wrapper caching', async t => {
  let webglDevice: WebGLDevice | null = null;
  try {
    webglDevice = (await luma.createDevice({
      id: 'webgl-test-device-no-sharing',
      type: 'webgl',
      adapters: [webgl2Adapter],
      createCanvasContext: {width: 1, height: 1},
      debug: true,
      _cachePipelines: true,
      _sharePipelines: false
    })) as WebGLDevice;

    const pipelineFactory = new PipelineFactory(webglDevice);
    const initialSharedRenderPipelineCount = getSharedRenderPipelineCount(webglDevice);

    const vs = webglDevice.createShader({stage: 'vertex', source: vsSource});
    const fs = webglDevice.createShader({stage: 'fragment', source: fsSource});

    const pipeline1 = pipelineFactory.createRenderPipeline({
      vs,
      fs,
      topology: 'triangle-list',
      parameters: {cullMode: 'back'}
    });
    const pipeline2 = pipelineFactory.createRenderPipeline({
      vs,
      fs,
      topology: 'triangle-list',
      parameters: {cullMode: 'front'}
    });

    t.notEqual(
      pipeline1,
      pipeline2,
      'Still creates distinct wrapper pipelines when parameters differ'
    );
    t.notEqual(
      pipeline1.sharedRenderPipeline,
      pipeline2.sharedRenderPipeline,
      'Creates distinct shared render pipeline resources when sharing is disabled'
    );
    t.equal(
      getSharedRenderPipelineCount(webglDevice),
      initialSharedRenderPipelineCount + 2,
      'Tracks separate shared render pipeline resources for each wrapper when sharing is disabled'
    );
    t.notEqual(
      pipeline1.handle,
      pipeline2.handle,
      'Does not share the underlying WebGLProgram when sharing is disabled'
    );

    pipelineFactory.release(pipeline1);
    pipelineFactory.release(pipeline2);
    t.equal(
      getSharedRenderPipelineCount(webglDevice),
      initialSharedRenderPipelineCount + 2,
      'Shared render pipeline resources remain cached after release'
    );
  } finally {
    webglDevice?.destroy();
  }

  t.end();
});

test('PipelineFactory#shared WebGL program cache is keyed by transform feedback varyings', async t => {
  const webglDevice = await getWebGLTestDevice();
  if (!webglDevice.props._cachePipelines) {
    t.comment('Pipeline caching not enabled');
    t.end();
    return;
  }

  const pipelineFactory = new PipelineFactory(webglDevice);

  const vs = webglDevice.createShader({stage: 'vertex', source: transformVsSource});
  const fs = webglDevice.createShader({stage: 'fragment', source: transformFsSource});

  const pipeline1 = pipelineFactory.createRenderPipeline({
    vs,
    fs,
    topology: 'point-list',
    varyings: ['outValue']
  } as any);
  const pipeline2 = pipelineFactory.createRenderPipeline({
    vs,
    fs,
    topology: 'point-list',
    varyings: ['otherValue']
  } as any);

  t.notEqual(
    pipeline1.sharedRenderPipeline,
    pipeline2.sharedRenderPipeline,
    'Does not share WebGL programs across different transform feedback varying sets'
  );
  t.notEqual(
    pipeline1.handle,
    pipeline2.handle,
    'Creates distinct WebGLPrograms when transform feedback varyings differ'
  );

  pipelineFactory.release(pipeline1);
  pipelineFactory.release(pipeline2);

  t.end();
});
