import {AnimationLoop, Model, CubeGeometry} from '@luma.gl/engine';
import {Texture2D, clear} from '@luma.gl/webgl';
import {setParameters} from '@luma.gl/gltools';
import {phongLighting} from '@luma.gl/shadertools';
import {Matrix4} from '@math.gl/core';

const INFO_HTML = `
<p>
Drawing a phong-shaded cube
</p>
`;

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

export default class AppAnimationLoop extends AnimationLoop {
  static getInfo() {
    return INFO_HTML;
  }

  onInitialize({gl}) {
    setParameters(gl, {
      depthTest: true,
      depthFunc: gl.LEQUAL
    });

    const texture = new Texture2D(gl, {
      data: 'vis-logo.png'
    });

    const eyePosition = [0, 0, 5];
    const modelMatrix = new Matrix4();
    const viewMatrix = new Matrix4().lookAt({eye: eyePosition});
    const mvpMatrix = new Matrix4();

    const model = new Model(gl, {
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

  onRender({gl, aspect, tick, model, mvpMatrix, viewMatrix, modelMatrix}) {
    modelMatrix
      .identity()
      .rotateX(tick * 0.01)
      .rotateY(tick * 0.013);

    mvpMatrix
      .perspective({fov: Math.PI / 3, aspect})
      .multiplyRight(viewMatrix)
      .multiplyRight(modelMatrix);

    clear(gl, {color: [0, 0, 0, 1], depth: true});

    model.setUniforms({uMVP: mvpMatrix, uModel: modelMatrix}).draw();
  }

  onFinalize({model}) {
    model.delete();
  }
}

// @ts-ignore
if (typeof window !== 'undefined' && !window.website) {
  const animationLoop = new AppAnimationLoop();
  animationLoop.start();
}
