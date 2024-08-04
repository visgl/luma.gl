// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {SnapshotTestRunnerTestCase} from '@luma.gl/test-utils';
import {AnimationLoopTemplate, AnimationProps,setPathPrefix} from '@luma.gl/engine';

const RESOURCE_PATH = 'https://raw.githubusercontent.com/uber/luma.gl/master';

/** Prevent examples from start up immediately on import */
import './disable-example-startup';

// getting started
import helloTriangle from '../../examples/tutorials/hello-triangle/app';
import helloInstancing from '../../examples/tutorials/hello-instancing/app';
import shaderModules from '../../examples/tutorials/shader-modules/app';
import shaderHooks from '../../examples/tutorials/shader-hooks/app';
// import transformFeedback from '../../examples/tutorials/transform-feedback/app';

// API
// import animation from '../../examples/api/animation/app';
// import texture3d from '../../examples/api/texture-3d/app';
// import programManagement from '../../examples/api/program-management/app';

// showcases
// import instancing from '../../examples/showcase/instancing/app';
// import persistence from '../../examples/showcase/persistence/app';
// import wandering from '../../examples/showcase/wandering/app';

// webgl
// import helloInstancingWebGL from '../../examples/webgl/hello-instancing-webgl/app';
// import shaderModulesWebGL from '../../examples/webgl/shader-modules-webgl/app';

const examples = {
  // getting started
  helloTriangle,
  helloInstancing,
  shaderModules,
  shaderHooks
  // transformFeedback,

  // API
  // animation,
  // texture3d,
  // programManagement,

  // showcases
  // instancing,
  // persistence,
  // wandering,

  // webgl - TODO - animation loop issue
  // helloInstancingWebGL
  // shaderModulesWebGL
};

/**
 * Wraps the imported AnimationLoopTemplates from the examples into SnapshotTestRunner test cases
 * We don't start the loops but manually trigger their lifecycle methods
 *
 * @returns a list of test cases for the SnapshotTestRunner
 */
function getTestCases(): SnapshotTestRunnerTestCase[] {
  const testCases: SnapshotTestRunnerTestCase[] = [];

  for (const [name, ExampleAnimationLoopTemplate] of Object.entries(examples)) {
    let animationLoopTemplate: AnimationLoopTemplate | null = null;
    testCases.push({
      name,

      // Construct the renderloop, but don't start it. Manually call its OnInitialize
      // @ts-ignore
      onInitialize: (props: AnimationProps) => {
        setPathPrefix(`${RESOURCE_PATH}/examples/lessons/${name.slice(-2)}/`);
        // @ts-ignore TODO - ib added this to solve module resolution mess
        animationLoopTemplate = new ExampleAnimationLoopTemplate(props);
      },

      // Manually trigger an animationLoop onRender. Unless it returns false, we are done.
      onRender: (props: AnimationProps & {done}) => {
        // override animation in the example so we get a well-defined time
        props.tick = 0;
        const result = animationLoopTemplate?.onRender(props);
        if (result !== false) {
          props.done();
        }
      },

      // Make sure to let the AnimationLoopTemplate clean up
      onFinalize: (props: AnimationProps) => animationLoopTemplate?.onFinalize(props),

      // The target image
      goldenImage: `./test/render/golden-images/${name}.png`
    });
  }

  return testCases;
}

export default getTestCases();
