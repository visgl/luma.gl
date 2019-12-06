# Shader Modules

This tutorial will demonstrate how to use luma.gl shader modules to make reusable bits of functionality and dynamically insert them into your shaders. Most of this will be fairly similar to the [Hello Triangle](/docs/get-started/hello-triangle.md) app.

We'll start by setting up our imports and defining our base vertex and fragment shaders:
```js
import {AnimationLoop, Model} from '@luma.gl/engine';
import {Buffer, clear} from '@luma.gl/webgl';

const vs1 = `
  attribute vec2 position;

  void main() {
    gl_Position = vec4(position - vec2(0.5, 0.0), 0.0, 1.0);
  }
`;

const fs1 = `
  void main() {
    gl_FragColor = color_getColor();
  }
`;

const vs2 = `
  attribute vec2 position;

  void main() {
    gl_Position = vec4(position + vec2(0.5, 0.0), 0.0, 1.0);
  }
`;

const fs2 = `
  void main() {
    gl_FragColor = color_getColor() - 0.3;
  }
`;
```

We have two vertex and fragment shader pairs: one will move vertices to the left, the other moves vertices to the right. Both fragment shaders call a `color_getColor` function to set the final fragment color, but `color_getColor` isn't defined anywhere, so these shaders will not compile as-is.

We define `color_getColor` in a shader module:
```js
const colorModule = {
  name: "color",
  fs: `
    vec4 color_getColor() {
      return vec4(1.0, 0.0, 0.0, 1.0);
    }
  `
};
```

Shader modules are simply JavaScript objects that contain at least a name and some shader code. They can be defined to inject code into the vertex shader, the fragment shader or both. Our `colorModule` defines the `color_getColor` function used by our fragment shaders. It simply returns the color red. We're applying a shader module best practice of prefixing our function with the module name (`color_`) to avoid name collisions.

In the `onInitialize` method of our `AnimationLoop`, we create two models with different vertex and fragment shader sources, but both including the our `colorModule`.

```js
  onInitialize({gl}) {
    const positionBuffer = new Buffer(gl, new Float32Array([
      -0.3, -0.5,
      0.3, -0.5,
      0.0, 0.5
    ]));

    const model1 = new Model(gl, {
      vs: vs1,
      fs: fs1,
      modules: [colorModule],
      attributes: {
        position: positionBuffer
      },
      vertexCount: 3
    });

    const model2 = new Model(gl, {
      vs: vs2,
      fs: fs2,
      modules: [colorModule],
      attributes: {
        position: positionBuffer
      },
      vertexCount: 3
    });

    return {model1, model2};
  }
```

In `onRender`, we simply draw both models:

```js
  onRender({gl, model1, model2}) {
    clear(gl, {color: [0, 0, 0, 1]});
    model1.draw();
    model2.draw();
  }
```
If all went well, two red triangles should be drawn side-by-side on the canvas, one slightly lighter than the other. See the live demo [here](/examples/getting-started/shader-modules).

Shader modules allowed us to reuse the same functionality (in this case, simply setting the base color of a fragment) across multiple programs.

The entire application should look like the following:
```js
import {AnimationLoop, Model} from '@luma.gl/engine';
import {Buffer, clear} from '@luma.gl/webgl';

const vs1 = `
  attribute vec2 position;

  void main() {
    gl_Position = vec4(position - vec2(0.5, 0.0), 0.0, 1.0);
  }
`;

const fs1 = `
  void main() {
    gl_FragColor = color_getColor();
  }
`;

const vs2 = `
  attribute vec2 position;

  void main() {
    gl_Position = vec4(position + vec2(0.5, 0.0), 0.0, 1.0);
  }
`;

const fs2 = `
  void main() {
    gl_FragColor = color_getColor() - 0.3;
  }
`;

const colorModule = {
  name: "color",
  fs: `
    vec4 color_getColor() {
      return vec4(1.0, 0.0, 0.0, 1.0);
    }
  `
};

const loop = new AnimationLoop({
  onInitialize({gl}) {
    const positionBuffer = new Buffer(gl, new Float32Array([
      -0.3, -0.5,
      0.3, -0.5,
      0.0, 0.5
    ]));

    const model1 = new Model(gl, {
      vs: vs1,
      fs: fs1,
      modules: [colorModule],
      attributes: {
        position: positionBuffer
      },
      vertexCount: 3
    });

    const model2 = new Model(gl, {
      vs: vs2,
      fs: fs2,
      modules: [colorModule],
      attributes: {
        position: positionBuffer
      },
      vertexCount: 3
    });

    return {model1, model2};
  },

  onRender({gl, model}) {
    clear(gl, {color: [0, 0, 0, 1]});
    model1.draw();
    model2.draw();
  }
});

loop.start();
```

