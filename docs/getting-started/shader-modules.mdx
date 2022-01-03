# Shader Modules

This tutorial will demonstrate how to use luma.gl shader modules to make reusable bits of functionality and dynamically insert them into your shaders. Most of this will be fairly similar to the [Hello Triangle](/docs/getting-started/hello-triangle) app.

We'll start by setting up our imports and defining our base vertex and fragment shaders:

```js
import {AnimationLoop, Model} from '@luma.gl/engine';
import {clear} from '@luma.gl/webgl';

const vs1 = `
  attribute vec2 position;

  void main() {
    gl_Position = vec4(position - vec2(0.5, 0.0), 0.0, 1.0);
  }
`;

const fs1 = `
  uniform vec3 hsvColor;

  void main() {
    gl_FragColor = vec4(color_hsv2rgb(hsvColor), 1.0);
  }
`;

const vs2 = `
  attribute vec2 position;

  void main() {
    gl_Position = vec4(position + vec2(0.5, 0.0), 0.0, 1.0);
  }
`;

const fs2 = `
  uniform vec3 hsvColor;

  void main() {
    gl_FragColor = vec4(color_hsv2rgb(hsvColor) - 0.3, 1.0);
  }
`;
```

We have two vertex and fragment shader pairs: one will move vertices to the left, the other moves vertices to the right. Both fragment shaders take an [HSV color](https://en.wikipedia.org/wiki/HSL_and_HSV) as input call a `color_hsv2rgb` to convert it to RGB. But `color_hsv2rgb` isn't defined anywhere, so these shaders will not compile as-is.

We define `color_hsv2rgb` in a shader module:

```js
// Taken from http://lolengine.net/blog/2013/07/27/rgb-to-hsv-in-glsl
const colorModule = {
  name: 'color',
  fs: `
    vec3 color_hsv2rgb(vec3 c) {
      vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
      vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
      vec3 rgb = c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
      return rgb;
    }
  `
};
```

Shader modules are simply JavaScript objects that contain at least a name and some shader code. They can be defined to inject code into the vertex shader, the fragment shader or both. Our `colorModule` defines the `color_hsv2rgb` function used by our fragment shaders. It converts the HSV value to RGB and returns it. We're applying a shader module best practice of prefixing our function with the module name (`color_`) to avoid name collisions.

In the `onInitialize` method of our `AnimationLoop`, we create two models with different vertex and fragment shader sources, but both including the our `colorModule`.

```js
  onInitialize({device}) {
    const positionBuffer = new Buffer(device, new Float32Array([
      -0.3, -0.5,
      0.3, -0.5,
      0.0, 0.5
    ]));

    const model1 = new Model(device, {
      vs: vs1,
      fs: fs1,
      modules: [colorModule],
      attributes: {
        position: positionBuffer
      },
      uniforms: {
        hsvColor: [0.7, 1.0, 1.0]
      },
      vertexCount: 3
    });

    const model2 = new Model(device, {
      vs: vs2,
      fs: fs2,
      modules: [colorModule],
      attributes: {
        position: positionBuffer
      },
      uniforms: {
        hsvColor: [1.0, 1.0, 1.0]
      },
      vertexCount: 3
    });

    return {model1, model2};
  }
```

In `onRender`, we simply draw both models:

```js
  onRender({device, model1, model2}) {
    clear(device, {color: [0, 0, 0, 1]});
    model1.draw();
    model2.draw();
  }
```

If all went well, a blue trangle and a red triangle should be drawn side-by-side on the canvas. See the live demo [here](/examples/getting-started/shader-modules).

Shader modules allowed us to define our HSL to RGB conversion function once and use it across multiple programs.

The entire application should look like the following:

```js
import {AnimationLoop, Model} from '@luma.gl/engine';
import {clear} from '@luma.gl/webgl';

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

// Taken from http://lolengine.net/blog/2013/07/27/rgb-to-hsv-in-glsl
const colorModule = {
  name: 'color',
  fs: `
    vec3 color_hsv2rgb(vec3 c) {
      vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
      vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
      return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }
  `
};

const loop = new AnimationLoop({
  onInitialize({device}) {
    const positionBuffer = new Buffer(device, new Float32Array([-0.3, -0.5, 0.3, -0.5, 0.0, 0.5]));

    const model1 = new Model(device, {
      vs: vs1,
      fs: fs1,
      modules: [colorModule],
      attributes: {
        position: positionBuffer
      },
      vertexCount: 3
    });

    const model2 = new Model(device, {
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

  onRender({device, model}) {
    clear(device, {color: [0, 0, 0, 1]});
    model1.draw();
    model2.draw();
  }
});

loop.start();
```
