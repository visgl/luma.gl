/* eslint-disable array-bracket-spacing, no-multi-spaces */
import GL from 'luma.gl/constants';
import {AnimationLoop, Program, Model, Geometry, IcoSphere, setParameters} from 'luma.gl';
import {Matrix4} from 'math.gl';

const INFO_HTML = `
<p>
  <a href="http://learningwebgl.com/blog/?p=239" target="_blank">
    A Bit of Movement
  </a>
<p>
The classic WebGL Lessons in luma.gl
`;

const FRAGMENT_SHADER = `\
precision highp float;

varying vec4 vColor;

void main(void) {
  gl_FragColor = vColor;
}
`;

const VERTEX_SHADER = `\
attribute vec3 positions;
attribute vec4 colors;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

varying vec4 vColor;

void main(void) {
  gl_Position = uPMatrix * uMVMatrix * vec4(positions, 1.0);
  vColor = colors;
}
`;


const SPHERE_VS = `\
attribute vec3 positions;
attribute vec3 normals;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

varying vec3 normal;

void main(void) {

  gl_Position = uPMatrix * uMVMatrix * vec4(positions, 1.0);
  normal = (uMVMatrix * vec4(normals, 1.0)).xyz;
}
`;

const SPHERE_FS = `\
precision highp float;

uniform vec3 uColor;
uniform bool uLighting;

varying vec3 normal;

void main(void) {
  float d = 1.0;
  if (uLighting) {
    vec3 l = normalize(vec3(10,5,2));
    d = dot(normal, l);
  }
  gl_FragColor = vec4(uColor * d, 1);
}
`;

const triangleGeometry = new Geometry({
  attributes: {
    positions: {size: 3, value: new Float32Array([0, 1, 0,  -1, -1, 0,  1, -1, 0])},
    colors: {size: 4, value: new Float32Array([1, 0, 0, 1,  0, 1, 0, 1,  0, 0, 1, 1])}
  }
});

const squareGeometry = new Geometry({
  drawMode: GL.TRIANGLE_STRIP,
  attributes: {
    positions: new Float32Array([1, 1, 0,  -1, 1, 0,  1, -1, 0,  -1, -1, 0]),
    colors: {
      size: 4,
      value: new Float32Array([
        0.5, 0.5, 1, 1,  0.5, 0.5, 1, 1,  0.5, 0.5, 1, 1,  0.5, 0.5, 1, 1
      ])
    }
  }
});

const animationLoop = new AnimationLoop({

  onInitialize({ gl }) {
    console.log(gl instanceof WebGL2RenderingContext);
    setParameters({
    //setParameters(gl, {
      clearColor: [0, 0, 0, 1],
      clearDepth: [1],
      depthTest: true,
      depthFunc: gl.LEQUAL
    });

    return {
      triangle: new Model(gl, {geometry: triangleGeometry, vs: VERTEX_SHADER, fs: FRAGMENT_SHADER}),
      square: new Model(gl, { geometry: squareGeometry, vs: VERTEX_SHADER, fs: FRAGMENT_SHADER }),
      sphere: new IcoSphere(gl, {
        id: 'electron',
        iterations: 6,
        program: new Program(gl, {vs: SPHERE_VS, fs: SPHERE_FS})
      })
    };
  },

  onRender(context) {
    const {gl, tick, aspect, triangle, square, sphere} = context;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const projection = new Matrix4().perspective({aspect});

    // Draw triangle
    triangle
      .setPosition([-1.5, 0, -7])
      .setRotation([0, tick * 0.01, 0])
      .updateMatrix()
      .draw({
        uniforms: {
          uMVMatrix: triangle.matrix,
          uPMatrix: projection
        }
      });

    // Draw Square
    square
      .setPosition([1.5, 0, -7])
      .setRotation([tick * 0.1, 0, 0])
      .updateMatrix()
      .draw({
        uniforms: {
          uMVMatrix: square.matrix,
          uPMatrix: projection
        }
      });

    for (let i = 0; i < 2; i++) {
      sphere
        .setPosition([1.5, i, -7])
        //.setRotation([tick * 0.1, 0, 0])
        .setScale([0.5, 0.5, 0.5])
        .updateMatrix()
        .draw({
          uniforms: {
            uMVMatrix: sphere.matrix,
            uPMatrix: projection,
            uColor: [1, 0.25, 0.25],
            uLighting: 1
          }
        });
      }
  }
});

animationLoop.getInfo = () => INFO_HTML;

export default animationLoop;

/* global window */
if (!window.website) {
  animationLoop.start({ canvas: "render-canvas" });
}
