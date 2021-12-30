# Instanced Transform

In this final tutorial, we'll pull together almost everything we've learned in past tutorials into a single scene: lighing, textures, geometry, shader modules, instancing and transform feedback. Whew! This will build on the [previous tutorial](/examples/getting-started/lighting), so it might be helpful to start with its source code.

We'll be drawing 4 instanced cubes, textured and lit in the same way as in the lighting tutorial, but with the animations updated by transform feedback.

The `Transform` class is the only addition we need for our imports:

```js
import {AnimationLoop, Model, Transform, CubeGeometry} from '@luma.gl/engine';
import {Buffer, Texture2D, clear, setParameters, isWebGL2} from '@luma.gl/webgl';
import {phongLighting} from '@luma.gl/shadertools';
import {Matrix4} from '@math.gl/core';
```

The vertex shader for our transform feedback is quite simple. It just increments a scalar rotation value on each run:

```js
const transformVs = `
  attribute float rotations;

  varying float vRotation;

  void main() {
    vRotation = rotations + 0.01;
  }
`;
```

In order to handle rotation updates in the transform feedback, we have to move construction of the rotation matrix into the vertex shader. We'll use an [axis-angle](https://en.wikipedia.org/wiki/Rotation_matrix#Rotation_matrix_from_axis_and_angle), passing the axis and rotation angle as instanced attributes (with the rotation angles being updated by transform feedback):

```js
const vs = `\
  attribute vec3 positions;
  attribute vec3 normals;
  attribute vec2 texCoords;
  attribute vec2 offsets;
  attribute vec3 axes;
  attribute float rotations;

  uniform mat4 uView;
  uniform mat4 uProjection;

  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec2 vUV;

  void main(void) {
    float s = sin(rotations);
    float c = cos(rotations);
    float t = 1.0 - c;
    float xt = axes.x * t;
    float yt = axes.y * t;
    float zt = axes.z * t;
    float xs = axes.x * s;
    float ys = axes.y * s;
    float zs = axes.z * s;

    mat3 rotationMat = mat3(
        axes.x * xt + c,
        axes.y * xt + zs,
        axes.z * xt - ys,
        axes.x * yt - zs,
        axes.y * yt + c,
        axes.z * yt + xs,
        axes.x * zt + ys,
        axes.y * zt - xs,
        axes.z * zt + c
    );

    vPosition = rotationMat * positions;
    vPosition.xy += offsets;
    vNormal = rotationMat * normals;
    vUV = texCoords;
    gl_Position = uProjection * uView * vec4(vPosition, 1.0);
  }
```

We also pass an `offsets` instanced attribute to position each cube.

Our fragment shader doesn't change at all:

```js
const fs = `\
  precision highp float;

  uniform sampler2D uTexture;
  uniform vec3 uEyePosition;

  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec2 vUV;

  void main(void) {
    vec3 materialColor = texture2D(uTexture, vec2(vUV.x, 1.0 - vUV.y)).rgb;
    vec3 surfaceColor = lighting_getLightColor(materialColor, uEyePosition, vPosition, normalize(vNormal));

    gl_FragColor = vec4(surfaceColor, 1.0);
  }
`;
```

Our `onInitialize` method will need several updates. First we create buffers for our instanced data:

```js
const offsetBuffer = device.createBuffer(new Float32Array([3, 3, -3, 3, 3, -3, -3, -3]));

const axisBufferData = new Float32Array(12);
for (let i = 0; i < 4; ++i) {
  const vi = i * 3;
  const x = Math.random();
  const y = Math.random();
  const z = Math.random();
  const l = Math.sqrt(x * x + y * y + z * z);

  axisBufferData[vi] = x / l;
  axisBufferData[vi + 1] = y / l;
  axisBufferData[vi + 2] = z / l;
}
const axisBuffer = device.createBuffer(axisBufferData);

const rotationBuffer = device.createBuffer(
  new Float32Array([
    Math.random() * Math.PI * 2,
    Math.random() * Math.PI * 2,
    Math.random() * Math.PI * 2,
    Math.random() * Math.PI * 2
  ])
);
```

The `offsetBuffer` sets positions so the cubes will be in a square formation. The `axisBuffer` looks more complicated, but its simply a set of 4 normalized vectors about which we'll rotate our cubes. Finally, the `rotationBuffer` simply starts with 4 random angles between 0 and 2&pi;.

The `Transform` is straightforward to set up, simply taking the `rotationBuffer` and our vertex shader as input:

```js
const transform = new Transform(device, {
  vs: transformVs,
  sourceBuffers: {
    rotations: rotationBuffer
  },
  feedbackMap: {
    rotations: 'vRotation'
  },
  elementCount: 4
});
```

And the `Model` needs to be updated to take the instanced attributes and `instanceCount`:

```js
const model = new Model(device, {
  vs,
  fs,
  geometry: new CubeGeometry(),
  attributes: {
    offsets: [offsetBuffer, {divisor: 1}],
    axes: [axisBuffer, {divisor: 1}],
    rotations: [rotationBuffer, {divisor: 1}]
  },
  uniforms: {
    uTexture: texture,
    uEyePosition: eyePosition,
    uView: viewMatrix
  },
  modules: [phongLighting],
  moduleSettings: {
    material: {
      specularColor: [255, 255, 255]
    },
    lights: [
      {
        type: 'ambient',
        color: [255, 255, 255]
      },
      {
        type: 'point',
        color: [255, 255, 255],
        position: [4, 8, 4]
      }
    ]
  },
  instanceCount: 4
});
```

Our `onRender` needs an update to perform the transform feedback and pass the transformed rotation buffer to the `Model`:

```js
  onRender({device, aspect, model, transform, projectionMatrix}) {
    projectionMatrix.perspective({fov: Math.PI / 3, aspect});

    transform.run();

    clear(device, {color: [0, 0, 0, 1], depth: true});
    model
      .setAttributes({rotations: [transform.getBuffer('vRotation'), {divisor: 1}]})
      .setUniforms({uProjection: projectionMatrix})
      .draw();

    transform.swap();
  }
```

If all went well, you should see 4 rotating cubes. This scene is significantly more complex than anything we've seen before, so take some time to play around with it and get to know the various parts. The live demo is available [here](/examples/getting-started/instanced-transform), and the full source code is listed below for reference:

```js
import {AnimationLoop, Model, Transform, CubeGeometry} from '@luma.gl/engine';
import {Buffer, Texture2D, clear, setParameters, isWebGL2} from '@luma.gl/webgl';
import {phongLighting} from '@luma.gl/shadertools';
import {Matrix4} from '@math.gl/core';

const transformVs = `
  attribute float rotations;

  varying float vRotation;

  void main() {
    vRotation = rotations + 0.01;
  }
`;

const vs = `\
  attribute vec3 positions;
  attribute vec3 normals;
  attribute vec2 texCoords;
  attribute vec2 offsets;
  attribute vec3 axes;
  attribute float rotations;

  uniform mat4 uView;
  uniform mat4 uProjection;

  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec2 vUV;

  void main(void) {
    float s = sin(rotations);
    float c = cos(rotations);
    float t = 1.0 - c;
    float xt = axes.x * t;
    float yt = axes.y * t;
    float zt = axes.z * t;
    float xs = axes.x * s;
    float ys = axes.y * s;
    float zs = axes.z * s;

    mat3 rotationMat = mat3(
        axes.x * xt + c,
        axes.y * xt + zs,
        axes.z * xt - ys,
        axes.x * yt - zs,
        axes.y * yt + c,
        axes.z * yt + xs,
        axes.x * zt + ys,
        axes.y * zt - xs,
        axes.z * zt + c
    );

    vPosition = rotationMat * positions;
    vPosition.xy += offsets;
    vNormal = rotationMat * normals;
    vUV = texCoords;
    gl_Position = uProjection * uView * vec4(vPosition, 1.0);
  }
`;

const fs = `\
  precision highp float;

  uniform sampler2D uTexture;
  uniform vec3 uEyePosition;

  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec2 vUV;

  void main(void) {
    vec3 materialColor = texture2D(uTexture, vec2(vUV.x, 1.0 - vUV.y)).rgb;
    vec3 surfaceColor = lighting_getLightColor(materialColor, uEyePosition, vPosition, normalize(vNormal));

    gl_FragColor = vec4(surfaceColor, 1.0);
  }
`;

const loop = new AnimationLoop({
  onInitialize({gl}) {
    setParameters(gl, {
      depthTest: true,
      depthFunc: gl.LEQUAL
    });

    const offsetBuffer = device.createBuffer(new Float32Array([3, 3, -3, 3, 3, -3, -3, -3]));

    const axisBufferData = new Float32Array(12);
    for (let i = 0; i < 4; ++i) {
      const vi = i * 3;
      const x = Math.random();
      const y = Math.random();
      const z = Math.random();
      const l = Math.sqrt(x * x + y * y + z * z);

      axisBufferData[vi] = x / l;
      axisBufferData[vi + 1] = y / l;
      axisBufferData[vi + 2] = z / l;
    }
    const axisBuffer = device.createBuffer(axisBufferData);

    const rotationBuffer = device.createBuffer(
      new Float32Array([
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      ])
    );

    const texture = device.createTexture({data: 'vis-logo.png'});

    const eyePosition = [0, 0, 10];
    const viewMatrix = new Matrix4().lookAt({eye: eyePosition});
    const projectionMatrix = new Matrix4();

    const transform = new Transform(device, {
      vs: transformVs,
      sourceBuffers: {
        rotations: rotationBuffer
      },
      feedbackMap: {
        rotations: 'vRotation'
      },
      elementCount: 4
    });

    const model = new Model(device, {
      vs,
      fs,
      geometry: new CubeGeometry(),
      attributes: {
        offsets: [offsetBuffer, {divisor: 1}],
        axes: [axisBuffer, {divisor: 1}],
        rotations: [rotationBuffer, {divisor: 1}]
      },
      uniforms: {
        uTexture: texture,
        uEyePosition: eyePosition,
        uView: viewMatrix
      },
      modules: [phongLighting],
      moduleSettings: {
        material: {
          specularColor: [255, 255, 255]
        },
        lights: [
          {
            type: 'ambient',
            color: [255, 255, 255]
          },
          {
            type: 'point',
            color: [255, 255, 255],
            position: [4, 8, 4]
          }
        ]
      },
      instanceCount: 4
    });

    return {
      model,
      transform,
      projectionMatrix
    };
  },

  onRender({device, aspect, model, transform, projectionMatrix}) {
    projectionMatrix.perspective({fov: Math.PI / 3, aspect});

    transform.run();

    clear(device, {color: [0, 0, 0, 1], depth: true});
    model
      .setAttributes({rotations: [transform.getBuffer('vRotation'), {divisor: 1}]})
      .setUniforms({uProjection: projectionMatrix})
      .draw();

    transform.swap();
  }
});

loop.start();
```
