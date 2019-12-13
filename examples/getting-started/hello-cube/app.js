import {AnimationLoop, Model, CubeGeometry} from '@luma.gl/engine';
import {Texture2D, clear} from '@luma.gl/webgl';
import {setParameters} from '@luma.gl/gltools';
import {phongLighting} from '@luma.gl/shadertools';
import {Matrix4} from 'math.gl';

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
uniform mat4 uView;
uniform mat4 uProjection;

varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUV;

void main(void) {
  gl_Position = uProjection * uView * uModel * vec4(positions, 1.0);
  vPosition = vec3(uModel * vec4(positions,1));
  vNormal = vec3(uModel * vec4(normals, 0));
  vUV = texCoords;
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
  vec3 color = lighting_getLightColor(materialColor, uEyePosition, vPosition, vNormal);

  gl_FragColor = vec4(color, 1.0);
}
`;

export default class AppAnimationLoop extends AnimationLoop {
  static getInfo() {
    return INFO_HTML;
  }

  onInitialize({gl, canvas, aspect}) {
    setParameters(gl, {
      depthTest: true,
      depthFunc: gl.LEQUAL
    });

    const texture = new Texture2D(gl, {
      data: 'vis-logo.png',
      mipmaps: true,
      parameters: {
        [gl.TEXTURE_MAG_FILTER]: gl.LINEAR,
        [gl.TEXTURE_MIN_FILTER]: gl.LINEAR_MIPMAP_NEAREST
      }
    });

    const eyePosition = [0, 0, 5];
    const viewMatrix = new Matrix4().lookAt({eye: eyePosition});
    const projectionMatrix = new Matrix4();
    const modelMatrix = new Matrix4();

    const model = new Model(gl, {
      vs,
      fs,
      geometry: new CubeGeometry(),
      uniforms: {
        uTexture: texture,
        uEyePosition: eyePosition,
        uView: viewMatrix
      },
      moduleSettings: {
        material: {
          specularColor: [255, 255, 255]
        },
        lights: [
          {
            type: 'ambient',
            color: [100, 100, 100]
          },
          {
            type: 'point',
            color: [255, 255, 255],
            position: [2.0, 2.0, 4.0]
          }
        ]
      },
      modules: [phongLighting]
    });

    return {
      model,
      projectionMatrix,
      modelMatrix
    };
  }

  onRender(animationProps) {
    const {gl, aspect, tick, model, projectionMatrix, modelMatrix} = animationProps;

    clear(gl, {color: [0, 0, 0, 1]});
    model.draw({
      uniforms: {
        uProjection: projectionMatrix.perspective({fov: Math.PI / 3, aspect}),
        uModel: modelMatrix
          .identity()
          .rotateX(tick * 0.01)
          .rotateY(tick * 0.013)
      }
    });
  }
}

/* global window */
if (typeof window !== 'undefined' && !window.website) {
  const animationLoop = new AppAnimationLoop();
  animationLoop.start();
}
