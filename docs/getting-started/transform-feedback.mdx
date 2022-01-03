# Transform Feedback

In this tutorial, we'll learn how to use [transform feedback](https://www.khronos.org/opengl/wiki/Transform_Feedback) using luma.gl's high-level API. Transform feedback allows us to capture vertex shader results from one pass and use them in subsequent passes. It is a powerful tool that can be used to set up massively parrallelized animations or data transformations. Note that transform feedback can only be used with WebGL 2.

In luma.gl, transform feedback is primarily exposed via the [Transform](/docs/api-reference/engine/transform) class, which simplifies usage by managing input and output buffers. We'll demonstrate its usage by setting up a simple animation that runs completely on the GPU.

To start, we'll modify our imports to include `Transform` from **@luma.gl/engine**:

```js
import {AnimationLoop, Transform, Model} from '@luma.gl/engine';
import {Buffer, clear} from '@luma.gl/webgl';
```

Then we'll define our shaders, which we'll write in GLSL ES 3.0 since we're using WebGL 2:

```js
const transformVs = `\
#version 300 es
#define SIN2 0.03489949
#define COS2 0.99939082

in vec2 position;

out vec2 vPosition;
void main() {
    mat2 rotation = mat2(
        COS2, SIN2,
        -SIN2, COS2
    );
    vPosition = rotation * position;
}
`;

const renderVs = `\
#version 300 es

in vec2 position;
in vec3 color;

out vec3 vColor;
void main() {
    vColor = color;
    gl_Position = vec4(position, 0.0, 1.0);
}
`;

const renderFs = `\
#version 300 es
precision highp float;

in vec3 vColor;

out vec4 fragColor;
void main() {
    fragColor = vec4(vColor, 1.0);
}
`;
```

Internally, we'll be using two separate programs, one for transform feedback and the other for rendering, so we define shaders for both. By default, the `Transform` class will skip rasterization and doesn't require a fragment shader since transform feedback is an operation on vertex data. We define a vertex shader for a transform feedback pass that simply rotates each vertex by 2 degrees in the xy-plane. The rendering vertex and fragment shaders are identical to the ones used in the [Hello Triangle](/docs/getting-started/hello-triangle) tutorial aside from being written in GLSL ES 3.0.

In `onInitialize`, we create our `Transform` instance:

```js
  onInitialize({device}) {
    const positionBuffer = device.createBuffer(new Float32Array([
      -0.5, -0.5,
      0.5, -0.5,
      0.0, 0.5
    ]));

    const transform = new Transform(device, {
      vs: transformVs,
      sourceBuffers: {
        position: positionBuffer
      },
      feedbackMap: {
        position: 'vPosition'
      },
      elementCount: 3
    });

    // More to come...

  }
```

We pass the vertex shader we defined, as well as the initial input buffer in the `sourceBuffers` property, which maps attribute names to buffers. The `feedbackMap` property maps input attributes to output varyings from the vertex shader. Internally it will create an output buffer of the same size as the input buffer into which transformed data will be written.

Finally, we create a model instance to perform the rendering:

```js
  onInitialize({device}) {
    // Transform setup...

    const colorBuffer = device.createBuffer(new Float32Array([
      1.0, 0.0, 0.0,
      0.0, 1.0, 0.0,
      0.0, 0.0, 1.0
    ]));

    const model = new Model(device, {
      vs: renderVs,
      fs: renderFs,
      attributes: {
        position: transform.getBuffer('vPosition'),
        color: colorBuffer
      },
      vertexCount: 3
    });

    return {transform, model};
  }
```

We set up the `Model` similarly to how we've done in other tutorials, with the exception that the `position` attribute is backed by the `vPosition` output buffer created by the `Transform`.

Our `onRender` involves a few additional steps compared to what we've seen before:

```js
  onRender({device, transform, model}) {
    transform.run();

    clear(device, {color: [0, 0, 0, 1]});
    model
      .setAttributes({
        position: transform.getBuffer('vPosition')
      })
      .draw();

    transform.swap();
  }
```

First, we run the transform feedback to write the rotated positions to the `vPosition` output buffer. We then bind the `Model`'s `position` attribute to the `vPosition` output buffer from the last transform pass and draw. Finally, we swap the input and output buffers in the transform so that the newly rotated positions will be used as input for the next pass, allowing the animation to continue.

If all went well, you should see a tri-color triangle rotating on the screen. A live demo is available [here](/examples/getting-started/transform-feedback), and the complete application is listed below for reference:

```js
import {AnimationLoop, Transform, Model} from '@luma.gl/engine';
import {Buffer, clear} from '@luma.gl/webgl';

const transformVs = `\
#version 300 es
#define SIN2 0.03489949
#define COS2 0.99939082

in vec2 position;

out vec2 vPosition;
void main() {
    mat2 rotation = mat2(
        COS2, SIN2,
        -SIN2, COS2
    );
    vPosition = rotation * position;
}
`;

const renderVs = `\
#version 300 es

in vec2 position;
in vec3 color;

out vec3 vColor;
void main() {
    vColor = color;
    gl_Position = vec4(position, 0.0, 1.0);
}
`;

const renderFs = `\
#version 300 es
precision highp float;

in vec3 vColor;

out vec4 fragColor;
void main() {
    fragColor = vec4(vColor, 1.0);
}
`;

const loop = new AnimationLoop({
  onInitialize({device}) {
    const positionBuffer = device.createBuffer(new Float32Array([-0.5, -0.5, 0.5, -0.5, 0.0, 0.5]));

    const transform = new Transform(device, {
      vs: transformVs,
      sourceBuffers: {
        position: positionBuffer
      },
      feedbackMap: {
        position: 'vPosition'
      },
      elementCount: 3
    });

    const colorBuffer = device.createBuffer(new Float32Array([1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0]));

    const model = new Model(device, {
      vs: renderVs,
      fs: renderFs,
      attributes: {
        position: transform.getBuffer('vPosition'),
        color: colorBuffer
      },
      vertexCount: 3
    });

    return {transform, model};
  },

  onRender({device, transform, model}) {
    transform.run();

    clear(device, {color: [0, 0, 0, 1]});
    model.setAttributes({position: transform.getBuffer('vPosition')}).draw();

    transform.swap();
  }
});

loop.start();
```
