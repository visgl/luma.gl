import type {SnapshotTestRunnerTestCase} from '@luma.gl/test-utils';
import {RenderLoop, AnimationLoop} from '@luma.gl/engine';
import {setPathPrefix} from '@luma.gl/api';

const RESOURCE_PATH = 'https://raw.githubusercontent.com/uber/luma.gl/master';

/** Prevent examples from start up immediately on import */
import './disable-example-startup';

// getting started
import helloTriangle from '../../examples/getting-started/hello-triangle/app';
import helloInstancing from '../../examples/getting-started/hello-instancing/app';
import shaderModules from '../../examples/getting-started/shader-modules/app';
import shaderHooks from '../../examples/getting-started/shader-hooks/app';
import transformFeedback from '../../examples/getting-started/transform-feedback/app';

// API
import animation from '../../examples/api/animation/app';
import texture3d from '../../examples/api/texture-3d/app';
// import programManagement from '../../examples/api/program-management/app';

// showcases
import instancing from '../../examples/showcase/instancing/app';
import persistence from '../../examples/showcase/persistence/app';
import wandering from '../../examples/showcase/wandering/app';

// webgl
import helloInstancingWebGL from '../../examples/webgl/hello-instancing-webgl/app';
import shaderModulesWebGL from '../../examples/webgl/shader-modules-webgl/app';

const examples = {
  // getting started
  helloTriangle,
  helloInstancing,
  shaderModules,
  shaderHooks,
  transformFeedback,

  // API
  animation,
  // texture3d,
  // programManagement,

  // showcases
  // instancing,
  persistence,
  wandering,

  // webgl - TODO - animation loop issue
  // helloInstancingWebGL,
  // shaderModulesWebGL,
};

function getTestCases(): SnapshotTestRunnerTestCase[] {
  const testCases: SnapshotTestRunnerTestCase[] = [];
  for (const [name, AppRenderLoop] of Object.entries(examples)) {
    // @ts-expect-error AnimationLoop vs RenderLoop 
    const animationLoop: AnimationLoop = RenderLoop.run 
      ? RenderLoop.run(AppRenderLoop as typeof RenderLoop) 
      // @ts-expect-error actually a an AnimationLoop
      : new AppRenderLoop({});
    testCases.push({
      name,
      onInitialize: (params) => {
        setPathPrefix(`${RESOURCE_PATH}/examples/lessons/${name.slice(-2)}/`);
        return animationLoop.onInitialize && animationLoop.onInitialize(params);
      },
      onRender: (params) => {
        // remove animation in the example
        params.tick = 0;
        const result = animationLoop.onRender && animationLoop.onRender(params);
        // @ts-expect-error
        if (result !== false) {
          params.done();
        }
      },
      onFinalize: animationLoop.onFinalize.bind(animationLoop),
      goldenImage: `./test/render/golden-images/${name}.png`
    });
  };
  return testCases;
}

export default getTestCases();
