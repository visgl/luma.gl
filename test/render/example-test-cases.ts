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
// import texture3d from '../../examples/api/texture-3d/app';
// import programManagement from '../../examples/api/program-management/app';

// showcases
// import instancing from '../../examples/showcase/instancing/app';
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
  // helloInstancingWebGL
  // shaderModulesWebGL
};

/**
 * Wraps the imported RenderLoops from the examples into SnapshotTestRunner test cases
 * We don't start the loops but manually trigger their lifecycle methods
 * 
 * @returns a list of test cases for the SnapshotTestRunner
 */
function getTestCases(): SnapshotTestRunnerTestCase[] {
  const testCases: SnapshotTestRunnerTestCase[] = [];

  for (const [name, ExampleRenderLoop] of Object.entries(examples)) {
    let animationLoop: AnimationLoop | null = null;  
    testCases.push({
      name,

      // Construct the renderloop, but don't start it. Manually call its OnInitialize
      onInitialize: (params) => {
        setPathPrefix(`${RESOURCE_PATH}/examples/lessons/${name.slice(-2)}/`);
        animationLoop = RenderLoop.run(ExampleRenderLoop);
        return animationLoop.props?.onInitialize(params);
      },

      // Manually trigger an animationLoop onRender. Unless it returns false, we are done.
      onRender: (params) => {
        // override animation in the example so we get a well-defined time
        params.tick = 0;
        const result = animationLoop?.props?.onRender(params);
        if (result !== false) {
          params.done();
        }
      },

      // Make sure to let the RenderLoop clean up
      onFinalize: (params) => animationLoop?.props.onFinalize(params),

      // The target image
      goldenImage: `./test/render/golden-images/${name}.png`
    });
  };

  return testCases;
}

export default getTestCases();
