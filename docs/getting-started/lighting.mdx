# Lighting

This tutorial will expand on the [previous one](/examples/getting-started/hello-cube), but we'll add some lighting to enhance the feeling of 3D in the scene. To accomplish this, we'll use one of **luma.gl**'s built-in shader modules for the first time.

To start, we'll add the `phongLighting` module from **@luma.gl/shadertools** to our imports:

```js
import {AnimationLoop, Model, CubeGeometry} from '@luma.gl/engine';
import {Texture2D, clear, setParameters} from '@luma.gl/webgl';
import {phongLighting} from '@luma.gl/shadertools';
import {Matrix4} from '@math.gl/core';
```

The `phongLighting` shader module adds functions to our fragment shader to facilitate lighting calculations.

We'll modify our shaders to perform our lighting calculations in the following ways:

- We'll input the surface `normals` as an attribute.
- We'll pass the world positions and normals to the fragment shader in `varying`s
- We'll call `lighting_getLightColor`, which will be added to our fragment shader by the `phongLighting` module, to calculate the final fragment color.

```js
const vs = `\
  attribute vec3 positions;
  attribute vec3 normals;
  attribute vec2 texCoords;

  uniform mat4 uModel;
  uniform mat4 uMVP;

  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec2 vUV;

  void main(void) {
    vPosition = (uModel * vec4(positions, 1.0)).xyz;
    vNormal = mat3(uModel) * normals;
    vUV = texCoords;
    gl_Position = uMVP * vec4(positions, 1.0);
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
```

Our `onInitialize` method needs a few significant updates:

```js
  onInitialize({device}) {
    setParameters(device, {
      depthTest: true,
      depthFunc: gl.LEQUAL
    });

    const texture = device.createTexture({data: 'vis-logo.png'});

    const eyePosition = [0, 0, 5];
    const modelMatrix = new Matrix4();
    const viewMatrix = new Matrix4().lookAt({eye: eyePosition});
    const mvpMatrix = new Matrix4();

    const model = new Model(device, {
      vs,
      fs,
      geometry: new CubeGeometry(),
      uniforms: {
        uTexture: texture,
        uEyePosition: eyePosition
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
            position: [1, 2, 1]
          }
        ]
      }
    });

    return {
      model,
      modelMatrix,
      viewMatrix,
      mvpMatrix
    };
  }
```

We're splitting the model matrix out on its own so we can use it in our shaders to transform the positions and normals for the lighting calculations. The biggest change, however, is the `moduleSettings` parameter we're passing to our `Model` constructor. `moduleSettings` are passed on to shader modules to help them set up uniforms. In this case, we're passing some material and light properties that `phongLighting` uses to perform its lighting calculations in `lighting_getLightColor`.

Our `onRender` doesn't change much except to set up the model matrix separately from the MVP matrix and pass it as a uniform:

```js
  onRender({device, aspect, tick, model, mvpMatrix, viewMatrix}) {
    modelMatrix
      .identity()
      .rotateX(tick * 0.01)
      .rotateY(tick * 0.013);

    mvpMatrix
      .perspective({fov: Math.PI / 3, aspect})
      .multiplyRight(viewMatrix)
      .multiplyRight(modelMatrix);

    clear(device, {color: [0, 0, 0, 1], depth: true});

    model.setUniforms({uMVP: mvpMatrix, uModel: modelMatrix}).draw();
  }
```

If all went well, you should see a scene almost identical to the one from the [previous tutorial](/examples/getting-started/hello-cube) but with some white light reflecting off the cube. The live demo is available [here](/examples/getting-started/lighting), and the full source code is listed below for reference:

```js
import {AnimationLoop, Model, CubeGeometry} from '@luma.gl/engine';
import {Texture2D, clear, setParameters} from '@luma.gl/webgl';
import {phongLighting} from '@luma.gl/shadertools';
import {Matrix4} from '@math.gl/core';

const vs = `\
  attribute vec3 positions;
  attribute vec3 normals;
  attribute vec2 texCoords;

  uniform mat4 uModel;
  uniform mat4 uMVP;

  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec2 vUV;

  void main(void) {
    vPosition = (uModel * vec4(positions, 1.0)).xyz;
    vNormal = mat3(uModel) * normals;
    vUV = texCoords;
    gl_Position = uMVP * vec4(positions, 1.0);
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
  onInitialize({device}) {
    setParameters(device, {
      depthTest: true,
      depthFunc: gl.LEQUAL
    });

    const texture = device.createTexture({data: 'vis-logo.png'});

    const eyePosition = [0, 0, 5];
    const modelMatrix = new Matrix4();
    const viewMatrix = new Matrix4().lookAt({eye: eyePosition});
    const mvpMatrix = new Matrix4();

    const model = new Model(device, {
      vs,
      fs,
      geometry: new CubeGeometry(),
      uniforms: {
        uTexture: texture,
        uEyePosition: eyePosition
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
            position: [1, 2, 1]
          }
        ]
      }
    });

    return {
      model,
      modelMatrix,
      viewMatrix,
      mvpMatrix
    };
  },

  onRender({device, aspect, tick, model, mvpMatrix, viewMatrix}) {
    modelMatrix
      .identity()
      .rotateX(tick * 0.01)
      .rotateY(tick * 0.013);

    mvpMatrix
      .perspective({fov: Math.PI / 3, aspect})
      .multiplyRight(viewMatrix)
      .multiplyRight(modelMatrix);

    clear(device, {color: [0, 0, 0, 1], depth: true});

    model.setUniforms({uMVP: mvpMatrix, uModel: modelMatrix}).draw();
  }
});

loop.start();
```
