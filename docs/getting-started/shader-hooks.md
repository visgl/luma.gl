# Shader Hooks

In the [previous tutorial](/docs/getting-started/shader-hooks), we used shader modules to insert re-usable functions into the shaders that use them. In this tutorial, we'll focus on another feature of shader modules: the ability to modify the behavior of shaders that use them via **shader hooks**. A shader hook is simply a function inserted into a vertex or fragment shader. By default, these functions will be no-ops, but they define entry points into which shader modules can inject code. For high-level API usage, shader hooks are exposed via [ProgramManagers](/docs/api-reference/engine/program-manager) (we'll look at low-level shader hooks later):

```js
const pm = new ProgramManager(device);
pm.addShaderHook('vs:MY_SHADER_HOOK(inout vec4 position)');

const vs = `
  attribute vec4 pos;

  void main() {
    gl_Position = pos;
    MY_SHADER_HOOK(gl_Position);
  }
`;
```

Shader modules can then inject code into the hook via their `inject` property:

```js
const myModule = {
  name: 'myModule',
  inject: 'position.x -= 0.1;'
};
```

We'll use these features to create a modified version of the previous tutorial, using shader hooks and modules to modify the behavior of a single set of vertex and fragment shaders.

We'll start by setting up our imports and defining our base vertex and fragment shaders:

```js
import {AnimationLoop, Model, ProgramManager} from '@luma.gl/engine';

import {AnimationLoop, Model, ProgramManager} from '@luma.gl/engine';
import {clear} from '@luma.gl/webgl';

const vs = `
  attribute vec2 position;

  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
    OFFSET_POSITION(gl_Position);
  }
`;

const fs = `
  uniform vec3 color;

  void main() {
    gl_FragColor = vec4(color, 1.0);
  }
`;
```

Here we have a shader hook function, `OFFSET_POSITION`, called in our vertex shader. Next we'll create two shader modules that insert code into the shader hook:

```js
const offsetLeftModule = {
  name: 'offsetLeft',
  inject: {
    'vs:OFFSET_POSITION': 'position.x -= 0.5;'
  }
};

const offsetRightModule = {
  name: 'offsetRight',
  inject: {
    'vs:OFFSET_POSITION': 'position.x += 0.5;'
  }
};
```

These shader modules inject code into the shader hook that will modify the x-coordinate of the position passed in. The `inject` property maps shader hook names to the code to be injected into them. The `vs` prefix indicates that this is a vertex shader hook.

The `onInitialize` method of our `AnimationLoop` will be somewhat different from the previous example. To create a shader hook, we need access to a `ProgramManager` instance:

```js
  onInitialize({device}) {
    const programManager = new ProgramManager(device);
    programManager.addShaderHook('vs:OFFSET_POSITION(inout vec4 position)');

    // ...
  }
```

The shader hook definition is the function signature with a prefix indicating whether it is intended for the vertex shader (`vs`) or fragment shader (`fs`). Shader hooks are always `void` funtions so they must return values to the caller via `out` or `inout` argurments. The rest of `onInitialize` is similar to what we've seen before with the exception of using the new shader modules and the `ProgramManager` to create our `Model`s:

```js
  onInitialize({gl}) {
    const programManager = new ProgramManager(device);
    programManager.addShaderHook('vs:OFFSET_POSITION(inout vec4 position)');

    const positionBuffer = device.createBuffer(new Float32Array([
      -0.3, -0.5,
      0.3, -0.5,
      0.0, 0.5
    ]));

    const model1 = new Model(device, {
      vs,
      fs,
      programManager,
      modules: [offsetLeftModule],
      attributes: {
        position: positionBuffer
      },
      uniforms: {
        color: [1.0, 0.0, 0.0]
      },
      vertexCount: 3
    });

    const model2 = new Model(device, {
      vs,
      fs,
      programManager,
      modules: [offsetRightModule],
      attributes: {
        position: positionBuffer
      },
      uniforms: {
        color: [0.0, 0.0, 1.0]
      },
      vertexCount: 3
    });

    return {model1, model2};
  }
```

The `onRender` method is the same as before. If all went well, a blue trangle and a red triangle should be drawn side-by-side on the canvas. The code injected by the modules into the shader hook is what offsets each triangle to the left or right. See the live demo [here](/examples/getting-started/shader-hooks).

Shader hooks allowed us to define our vertex and fragment shaders once and modify their behavior based on the shader module included.

The entire application should look like the following:

```js
import {AnimationLoop, Model, ProgramManager} from '@luma.gl/engine';
import {clear} from '@luma.gl/webgl';

const vs = `
  attribute vec2 position;

  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
    OFFSET_POSITION(gl_Position);
  }
`;

const fs = `
  uniform vec3 color;

  void main() {
    gl_FragColor = vec4(color, 1.0);
  }
`;

const offsetLeftModule = {
  name: 'offsetLeft',
  inject: {
    'vs:OFFSET_POSITION': 'position.x -= 0.5;'
  }
};

const offsetRightModule = {
  name: 'offsetRight',
  inject: {
    'vs:OFFSET_POSITION': 'position.x += 0.5;'
  }
};

const loop = new AnimationLoop({
  onInitialize({device}) {
    const programManager = new ProgramManager(device);
    programManager.addShaderHook('vs:OFFSET_POSITION(inout vec4 position)');

    const positionBuffer = device.createBuffer(new Float32Array([-0.3, -0.5, 0.3, -0.5, 0.0, 0.5]));

    const model1 = new Model(device, {
      vs,
      fs,
      programManager,
      modules: [offsetLeftModule],
      attributes: {
        position: positionBuffer
      },
      uniforms: {
        color: [1.0, 0.0, 0.0]
      },
      vertexCount: 3
    });

    const model2 = new Model(device, {
      vs,
      fs,
      programManager,
      modules: [offsetRightModule],
      attributes: {
        position: positionBuffer
      },
      uniforms: {
        color: [0.0, 0.0, 1.0]
      },
      vertexCount: 3
    });

    return {model1, model2};
  },

  onRender({device, model}) {
    clear(gl, {color: [0, 0, 0, 1]});
    model1.draw();
    model2.draw();
  }
});

loop.start();
```
