import {expect, test} from 'vitest';
import { getWebGLTestDevice, getWebGPUTestDevice } from '@luma.gl/test-utils';
import { luma, PipelineFactory } from '@luma.gl/core';
import { webgl2Adapter, type WebGLDevice } from '@luma.gl/webgl';
const vsSource = /* glsl */`\
in vec4 positions;

void main(void) {
  gl_Position = positions;
}
`;
const fsSource = /* glsl */`\
precision highp float;

out vec4 fragColor;
void main(void) {
  fragColor = vec4(1.0, 1.0, 1.0, 1.0);
}
`;
const transformVsSource = /* glsl */`\
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
const transformFsSource = /* glsl */`\
#version 300 es
precision highp float;
in float outValue;
out vec4 fragmentColor;
void main()
{
  fragmentColor = vec4(outValue, 0.0, 0.0, 1.0);
}
`;
const alternateVsSource = /* glsl */`\
in vec4 positions;

void main(void) {
  gl_Position = positions + vec4(0.0, 0.0, 0.0, 0.0);
}
`;
const webgpuRenderSource = /* wgsl */`
@vertex fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4<f32> {
  var positions = array<vec2<f32>, 3>(
    vec2<f32>(0.0, 0.5),
    vec2<f32>(-0.5, -0.5),
    vec2<f32>(0.5, -0.5)
  );
  let position = positions[vertexIndex];
  return vec4<f32>(position, 0.0, 1.0);
}

@fragment fn fragmentMain() -> @location(0) vec4<f32> {
  return vec4<f32>(1.0, 1.0, 1.0, 1.0);
}

@vertex fn vertexAlternateMain(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4<f32> {
  return vertexMain(vertexIndex);
}

@fragment fn fragmentAlternateMain() -> @location(0) vec4<f32> {
  return fragmentMain();
}
`;
function isProgramDestroyed(handle: WebGLProgram): boolean {
  return Boolean((handle as WebGLProgram & {
    destroyed?: boolean;
  }).destroyed);
}
function getSharedRenderPipelineCount(webglDevice: Awaited<ReturnType<typeof getWebGLTestDevice>>): number {
  return webglDevice.statsManager.getStats('GPU Resource Counts').get('SharedRenderPipelines Active').count;
}
test('PipelineFactory#import', () => {
  expect(PipelineFactory !== undefined, 'PipelineFactory import successful').toBeTruthy();
});
test('PipelineFactory#getDefaultPipelineFactory', async () => {
  const webglDevice = await getWebGLTestDevice();
  const pm1 = PipelineFactory.getDefaultPipelineFactory(webglDevice);
  const pm2 = PipelineFactory.getDefaultPipelineFactory(webglDevice);
  expect(pm1 instanceof PipelineFactory, 'Default pipeline manager created').toBeTruthy();
  expect(pm1 === pm2, 'Default pipeline manager cached').toBeTruthy();
});
test('PipelineFactory#release', async () => {
  const webglDevice = await getWebGLTestDevice();
  if (!webglDevice.props._cachePipelines) {
    return;
  }
  const pipelineFactory = new PipelineFactory(webglDevice);
  const vs = webglDevice.createShader({
    stage: 'vertex',
    source: vsSource
  });
  const fs = webglDevice.createShader({
    stage: 'fragment',
    source: fsSource
  });
  const pipeline1 = pipelineFactory.createRenderPipeline({
    vs,
    fs,
    topology: 'triangle-list'
  });
  const pipeline2 = pipelineFactory.createRenderPipeline({
    vs,
    fs,
    topology: 'triangle-list'
  });
  pipelineFactory.release(pipeline1);
  expect(!pipeline1.destroyed, 'Pipeline not deleted when still referenced.').toBeTruthy();
  pipelineFactory.release(pipeline2);
  expect(!pipeline2.destroyed, 'Pipeline remains cached after all references are released.').toBeTruthy();
});
test('PipelineFactory#caching with parameters', async () => {
  const webglDevice = await getWebGLTestDevice();
  if (!webglDevice.props._cachePipelines) {
    return;
  }
  const pipelineFactory = new PipelineFactory(webglDevice);
  const initialSharedRenderPipelineCount = getSharedRenderPipelineCount(webglDevice);
  const vs = webglDevice.createShader({
    stage: 'vertex',
    source: vsSource
  });
  const fs = webglDevice.createShader({
    stage: 'fragment',
    source: fsSource
  });
  const paramsA = {
    cullMode: 'back'
  };
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
  expect(pipeline1, 'Caches identical pipelines').toBe(pipeline2);
  const paramsB = {
    cullMode: 'front'
  };
  const pipeline3 = pipelineFactory.createRenderPipeline({
    vs,
    fs,
    topology: 'triangle-list',
    parameters: paramsB
  });
  expect(pipeline1, 'Does not cache wrapper pipelines with different parameters').not.toBe(pipeline3);
  expect(pipeline1.sharedRenderPipeline, 'Reuses the shared WebGL render pipeline record').toBe(pipeline3.sharedRenderPipeline);
  expect(getSharedRenderPipelineCount(webglDevice), 'Tracks one active shared render pipeline for compatible WebGL wrappers').toBe(initialSharedRenderPipelineCount + 1);
  expect(pipeline1.handle, 'Reuses the underlying WebGLProgram').toBe(pipeline3.handle);
  pipelineFactory.release(pipeline1);
  pipelineFactory.release(pipeline2);
  expect(isProgramDestroyed(pipeline3.handle), 'Shared program remains alive while another wrapper uses it').toBeFalsy();
  pipelineFactory.release(pipeline3);
  expect(getSharedRenderPipelineCount(webglDevice), 'Shared render pipeline resource remains cached after release').toBe(initialSharedRenderPipelineCount + 1);
  expect(isProgramDestroyed(pipeline3.handle), 'Shared program remains cached after the last wrapper is released').toBeFalsy();
  expect(pipeline3.sharedRenderPipeline?.destroyed, 'Shared render pipeline resource remains cached after the last wrapper is released').toBeFalsy();
});
test('PipelineFactory#caching with topology on webgl', async () => {
  const webglDevice = await getWebGLTestDevice();
  if (!webglDevice.props._cachePipelines) {
    return;
  }
  const pipelineFactory = new PipelineFactory(webglDevice);
  const vs = webglDevice.createShader({
    stage: 'vertex',
    source: vsSource
  });
  const fs = webglDevice.createShader({
    stage: 'fragment',
    source: fsSource
  });
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
  expect(trianglePipeline, 'Does not cache wrapper pipelines with different topology').not.toBe(linePipeline);
  expect(trianglePipeline.handle, 'Reuses the underlying WebGLProgram across topology variants').toBe(linePipeline.handle);
  pipelineFactory.release(trianglePipeline);
  pipelineFactory.release(linePipeline);
});
test('PipelineFactory#caching with bufferLayout on webgl', async () => {
  const webglDevice = await getWebGLTestDevice();
  if (!webglDevice.props._cachePipelines) {
    return;
  }
  const pipelineFactory = new PipelineFactory(webglDevice);
  const vs = webglDevice.createShader({
    stage: 'vertex',
    source: vsSource
  });
  const fs = webglDevice.createShader({
    stage: 'fragment',
    source: fsSource
  });
  const trianglePipeline = pipelineFactory.createRenderPipeline({
    vs,
    fs,
    topology: 'triangle-list',
    bufferLayout: [{
      name: 'positions',
      format: 'float32x3'
    }]
  });
  const interleavedPipeline = pipelineFactory.createRenderPipeline({
    vs,
    fs,
    topology: 'triangle-list',
    bufferLayout: [{
      name: 'positions',
      format: 'float32x4'
    }]
  });
  expect(trianglePipeline, 'Does not cache wrapper pipelines with different buffer layouts').not.toBe(interleavedPipeline);
  expect(trianglePipeline.handle, 'Reuses the underlying WebGLProgram across buffer layout variants').toBe(interleavedPipeline.handle);
  pipelineFactory.release(trianglePipeline);
  pipelineFactory.release(interleavedPipeline);
});
test('PipelineFactory#caching with WebGPU attachment formats', async () => {
  const webgpuDevice = await getWebGPUTestDevice();
  if (!webgpuDevice) {
    return;
  }
  if (!webgpuDevice.props._cachePipelines) {
    return;
  }
  const pipelineFactory = new PipelineFactory(webgpuDevice);
  const shader = webgpuDevice.createShader({
    source: webgpuRenderSource
  });
  const preferredFormatsPipeline = pipelineFactory.createRenderPipeline({
    vs: shader,
    fs: shader,
    topology: 'triangle-list',
    parameters: {
      depthWriteEnabled: true
    }
  });
  const repeatedPreferredFormatsPipeline = pipelineFactory.createRenderPipeline({
    vs: shader,
    fs: shader,
    topology: 'triangle-list',
    parameters: {
      depthWriteEnabled: true
    }
  });
  const explicitFormatsPipeline = pipelineFactory.createRenderPipeline({
    vs: shader,
    fs: shader,
    topology: 'triangle-list',
    colorAttachmentFormats: ['rgba8unorm'],
    depthStencilAttachmentFormat: 'depth16unorm',
    parameters: {
      depthWriteEnabled: true
    }
  });
  const screenFormatsPipeline = pipelineFactory.createRenderPipeline({
    vs: shader,
    fs: shader,
    topology: 'triangle-list',
    vertexEntryPoint: 'vertexAlternateMain',
    fragmentEntryPoint: 'fragmentAlternateMain',
    colorAttachmentFormats: ['bgra8unorm'],
    depthStencilAttachmentFormat: 'depth24plus',
    parameters: {
      depthWriteEnabled: true
    }
  });
  expect(preferredFormatsPipeline, 'Caches identical WebGPU pipelines when effective attachment formats match').toBe(repeatedPreferredFormatsPipeline);
  expect(explicitFormatsPipeline, 'Does not cache WebGPU pipelines with different color and depth attachment formats').not.toBe(screenFormatsPipeline);
  expect(preferredFormatsPipeline, 'Does not reuse a pipeline when switching from preferred to explicit attachment formats').not.toBe(explicitFormatsPipeline);
  expect(explicitFormatsPipeline, 'Does not cache WebGPU pipelines with different entry points').not.toBe(screenFormatsPipeline);
  pipelineFactory.release(preferredFormatsPipeline);
  pipelineFactory.release(repeatedPreferredFormatsPipeline);
  pipelineFactory.release(explicitFormatsPipeline);
  pipelineFactory.release(screenFormatsPipeline);
  shader.destroy();
});
test('PipelineFactory#caching with shaderLayout on webgl', async () => {
  const webglDevice = await getWebGLTestDevice();
  if (!webglDevice.props._cachePipelines) {
    return;
  }
  const pipelineFactory = new PipelineFactory(webglDevice);
  const vs = webglDevice.createShader({
    stage: 'vertex',
    source: vsSource
  });
  const fs = webglDevice.createShader({
    stage: 'fragment',
    source: fsSource
  });
  const defaultPipeline = pipelineFactory.createRenderPipeline({
    vs,
    fs,
    topology: 'triangle-list'
  });
  const overrideLayoutPipeline = pipelineFactory.createRenderPipeline({
    vs,
    fs,
    topology: 'triangle-list',
    shaderLayout: {
      bindings: [],
      attributes: [{
        name: 'positions',
        location: 0,
        type: 'vec4<f32>',
        stepMode: 'instance'
      }]
    }
  });
  expect(defaultPipeline, 'Does not cache wrapper pipelines with different shader layout overrides').not.toBe(overrideLayoutPipeline);
  expect(defaultPipeline.handle, 'Reuses the underlying WebGLProgram across shader layout variants').toBe(overrideLayoutPipeline.handle);
  pipelineFactory.release(defaultPipeline);
  pipelineFactory.release(overrideLayoutPipeline);
});
test('PipelineFactory#shared WebGL program cache is keyed by shader identity', async () => {
  const webglDevice = await getWebGLTestDevice();
  if (!webglDevice.props._cachePipelines) {
    return;
  }
  const pipelineFactory = new PipelineFactory(webglDevice);
  const vs1 = webglDevice.createShader({
    stage: 'vertex',
    source: vsSource
  });
  const vs2 = webglDevice.createShader({
    stage: 'vertex',
    source: alternateVsSource
  });
  const fs = webglDevice.createShader({
    stage: 'fragment',
    source: fsSource
  });
  const pipeline1 = pipelineFactory.createRenderPipeline({
    vs: vs1,
    fs,
    topology: 'triangle-list'
  });
  const pipeline2 = pipelineFactory.createRenderPipeline({
    vs: vs2,
    fs,
    topology: 'triangle-list'
  });
  expect(pipeline1.sharedRenderPipeline, 'Does not share WebGL programs across different shader sources').not.toBe(pipeline2.sharedRenderPipeline);
  expect(pipeline1.handle, 'Creates a distinct WebGLProgram when shaders differ').not.toBe(pipeline2.handle);
  pipelineFactory.release(pipeline1);
  pipelineFactory.release(pipeline2);
});
test.skip('PipelineFactory#sharing can be disabled independently from wrapper caching', async () => {
  let webglDevice: WebGLDevice | null = null;
  try {
    webglDevice = (await luma.createDevice({
      id: 'webgl-test-device-no-sharing',
      type: 'webgl',
      adapters: [webgl2Adapter],
      createCanvasContext: {
        width: 1,
        height: 1
      },
      debug: true,
      _cachePipelines: true,
      _sharePipelines: false
    })) as WebGLDevice;
    const pipelineFactory = new PipelineFactory(webglDevice);
    const initialSharedRenderPipelineCount = getSharedRenderPipelineCount(webglDevice);
    const vs = webglDevice.createShader({
      stage: 'vertex',
      source: vsSource
    });
    const fs = webglDevice.createShader({
      stage: 'fragment',
      source: fsSource
    });
    const pipeline1 = pipelineFactory.createRenderPipeline({
      vs,
      fs,
      topology: 'triangle-list',
      parameters: {
        cullMode: 'back'
      }
    });
    const pipeline2 = pipelineFactory.createRenderPipeline({
      vs,
      fs,
      topology: 'triangle-list',
      parameters: {
        cullMode: 'front'
      }
    });
    expect(pipeline1, 'Still creates distinct wrapper pipelines when parameters differ').not.toBe(pipeline2);
    expect(pipeline1.sharedRenderPipeline, 'Creates distinct shared render pipeline resources when sharing is disabled').not.toBe(pipeline2.sharedRenderPipeline);
    expect(getSharedRenderPipelineCount(webglDevice), 'Tracks separate shared render pipeline resources for each wrapper when sharing is disabled').toBe(initialSharedRenderPipelineCount + 2);
    expect(pipeline1.handle, 'Does not share the underlying WebGLProgram when sharing is disabled').not.toBe(pipeline2.handle);
    pipelineFactory.release(pipeline1);
    pipelineFactory.release(pipeline2);
    expect(getSharedRenderPipelineCount(webglDevice), 'Shared render pipeline resources remain cached after release').toBe(initialSharedRenderPipelineCount + 2);
  } finally {
    webglDevice?.destroy();
  }
});
test('PipelineFactory#shared WebGL program cache is keyed by transform feedback varyings', async () => {
  const webglDevice = await getWebGLTestDevice();
  if (!webglDevice.props._cachePipelines) {
    return;
  }
  const pipelineFactory = new PipelineFactory(webglDevice);
  const vs = webglDevice.createShader({
    stage: 'vertex',
    source: transformVsSource
  });
  const fs = webglDevice.createShader({
    stage: 'fragment',
    source: transformFsSource
  });
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
  expect(pipeline1.sharedRenderPipeline, 'Does not share WebGL programs across different transform feedback varying sets').not.toBe(pipeline2.sharedRenderPipeline);
  expect(pipeline1.handle, 'Creates distinct WebGLPrograms when transform feedback varyings differ').not.toBe(pipeline2.handle);
  pipelineFactory.release(pipeline1);
  pipelineFactory.release(pipeline2);
});
