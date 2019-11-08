# Hello Instancing (High-level)

In this tutorial, we'll work through how to do instanced drawing with luma.gl's high-level APIs. We'll also take this opportunity to introduce luma.gl shader modules. We'll begin with our [hello triangle](./hello-triangle.md) app and make some modifications. First let's create a shader module:
```js
import {AnimationLoop, Model} from '@luma.gl/engine';
import {Buffer, clear} from '@luma.gl/webgl';

const colorShaderModule = {
  name: 'color',
  vs: `
    varying vec3 color_vColor;

    void color_setColor(vec3 color) {
      color_vColor = color;
    }
  `,
  fs: `
    varying vec3 color_vColor;

    vec3 color_getColor() {
      return color_vColor;
    }
  `
};
```

A shader module is essentially just some GLSL code that will be inserted into our vertex and fragment shaders. They're usually used to define functions that implement generic functionality that can be reused in different programs. In this case, we're defining one to simply pass a color from the vertex shader to the fragment shader in a varying. This module also demonstrates a common convention in luma.gl to prefix function and variable names in a shader module with the name of the module to avoid name collisions.

Now let's update our vertex and fragment shaders to use the module functions:
```js
const vs = `
  attribute vec2 position;
  attribute vec3 color;

  void main() {
    color_setColor(color);
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fs = `
  void main() {
    gl_FragColor = vec4(color_getColor(), 1.0);
  }
`;
```

Now we update the `Model` to use the module:
```js
const model = new Model(gl, {
  vs,
  fs,
  modules: [colorShaderModule],
  attributes: {
    position: positionBuffer,
    color: colorBuffer
  },
  vertexCount: 3
});
```

If you rerun the app, it should render as it did before.

Now let's add some instancing to this scene! First we'll modify the position and color buffers we created before, and add an offset buffer to set the position of each instance:
```js
const positionBuffer = new Buffer(gl, new Float32Array([
  -0.2, -0.2,
  0.2, -0.2,
  0.0, 0.2
]));

const colorBuffer = new Buffer(gl, new Float32Array([
  1.0, 0.0, 0.0,
  0.0, 1.0, 0.0,
  0.0, 0.0, 1.0,
  1.0, 1.0, 0.0
]));

const offsetBuffer = new Buffer(gl, new Float32Array([
  0.5, 0.5,
  -0.5, 0.5,
  0.5,  -0.5,
  -0.5, -0.5
]));
```
For this scene, the positions are vertex attributes, while the colors and offsets are instance attributes.

Now add the offsets to the vertex shader:
```js
const vs = `
  attribute vec2 position;
  attribute vec3 color;
  attribute vec2 offset;

  void main() {
    color_setColor(color);
    gl_Position = vec4(position + offset, 0.0, 1.0);
  }
`;
```

Finally, we need to add the new buffer to the `Model`, and describe the parameters of the instanced draw:
```js
const model = new Model(gl, {
  vs,
  fs,
  modules: [colorShaderModule],
  attributes: {
    position: positionBuffer,
    color: [colorBuffer, {divisor: 1}],
    offset: [offsetBuffer, {divisor: 1}]
  },
  vertexCount: 3,
  instanceCount: 4
});
```
Note the new syntax used for the attributes. The second element in each array is an `accessor` that describes how the buffer should be traversed during a draw. luma.gl will try to infer these parameters from the data or the shader when possible, but when it can't (or when we want to override the inferred values), we have to provide an explicit accessor. We also provide the model with the number of instances we want to draw.

If all went well, running the app now should draw four triangles, each a different color. For reference the complete code is provided below:
```js
import {AnimationLoop, Model} from '@luma.gl/engine';
import {Buffer, clear} from '@luma.gl/webgl';

const colorShaderModule = {
  name: 'color',
  vs: `
    varying vec3 color_vColor;

    void color_setColor(vec3 color) {
      color_vColor = color;
    }
  `,
  fs: `
    varying vec3 color_vColor;

    vec3 color_getColor() {
      return color_vColor;
    }
  `
};

const loop = new AnimationLoop({
  onInitialize({gl}) {
    const positionBuffer = new Buffer(gl, new Float32Array([
      -0.2, -0.2,
      0.2, -0.2,
      0.0, 0.2
    ]));

    const colorBuffer = new Buffer(gl, new Float32Array([
      1.0, 0.0, 0.0,
      0.0, 1.0, 0.0,
      0.0, 0.0, 1.0,
      1.0, 1.0, 0.0
    ]));

    const offsetBuffer = new Buffer(gl, new Float32Array([
      0.5, 0.5,
      -0.5, 0.5,
      0.5,  -0.5,
      -0.5, -0.5
    ]));

    const model = new Model(gl, {
      vs: `
        attribute vec2 position;
        attribute vec3 color;
        attribute vec2 offset;

        void main() {
          color_setColor(color);
          gl_Position = vec4(position + offset, 0.0, 1.0);
        }
      `,
      fs: `
        void main() {
          gl_FragColor = vec4(color_getColor(), 1.0);
        }
      `,
      modules: [colorShaderModule],
      attributes: {
        position: positionBuffer,
        color: [colorBuffer, {divisor: 1}],
        offset: [offsetBuffer, {divisor: 1}]
      },
      vertexCount: 3,
      instanceCount: 4,
      instanced: true
    });

    return {model};
  },

  onRender({gl, model}) {
    clear(gl, {color: [0, 0, 0, 1]});
    model.draw();
  }
});

loop.start();

```
