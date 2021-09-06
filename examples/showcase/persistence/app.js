import {AnimationLoop, Model, Geometry, SphereGeometry} from '@luma.gl/engine';
import {clear, Framebuffer, Program} from '@luma.gl/webgl';
import {setParameters} from '@luma.gl/gltools';
import {Matrix4, Vector3, radians} from '@math.gl/core';
import {getRandom} from '../../utils';

const INFO_HTML = `
<p>
  Electron trails renderings persist across multiple frames.
<p>
  Uses multiple luma.gl <code>Framebuffer</code>s to hold previously rendered data between frames.
</p>
`;

const SCREEN_QUAD_VS = `\
attribute vec2 aPosition;

void main(void) {
  gl_Position = vec4(aPosition, 0, 1);
}
`;

const SCREEN_QUAD_FS = `\
precision highp float;

uniform sampler2D uTexture;
uniform vec2 uRes;

void main(void) {
  vec2 p = gl_FragCoord.xy/uRes.xy;
  gl_FragColor = texture2D(uTexture, p);
}
`;

const PERSISTENCE_FS = `\
precision highp float;

uniform sampler2D uScene;
uniform sampler2D uPersistence;
uniform vec2 uRes;

void main(void) {
  vec2 p = gl_FragCoord.xy / uRes.xy;
  vec4 cS = texture2D(uScene, p);
  vec4 cP = texture2D(uPersistence, p);
  gl_FragColor = mix(cS*4.0, cP, 0.9);
}
`;

const SPHERE_VS = `\
attribute vec3 positions;
attribute vec3 normals;

uniform mat4 uModelView;
uniform mat4 uProjection;

varying vec3 normal;

void main(void) {
  gl_Position = uProjection * uModelView * vec4(positions, 1.0);
  normal = vec3((uModelView * vec4(normals, 0.0)));
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
    vec3 l = normalize(vec3(1,1,2));
    d = dot(normal, l);
  }
  gl_FragColor = vec4(uColor * d, 1);
}
`;

const random = getRandom();

const ELECTRON_COUNT = 64;
const ePos = [];
const eRot = [];
const nPos = [];

let mainFramebuffer;
let pingpongFramebuffers;
let quad;
let persistenceQuad;
let sphere;

/* eslint-disable max-statements */
export default class AppAnimationLoop extends AnimationLoop {
  static getInfo() {
    return INFO_HTML;
  }

  onInitialize({gl, width, height}) {
    setParameters(gl, {
      clearColor: [0, 0, 0, 1],
      clearDepth: 1,
      depthTest: true,
      depthFunc: gl.LEQUAL,
      faceCulling: true,
      cullFace: gl.BACK
    });

    mainFramebuffer = new Framebuffer(gl, {width, height});

    pingpongFramebuffers = [
      new Framebuffer(gl, {width, height}),
      new Framebuffer(gl, {width, height})
    ];

    const QUAD_POSITIONS = [-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1];

    const quadGeometry = new Geometry({
      attributes: {
        aPosition: {
          value: new Float32Array(QUAD_POSITIONS),
          size: 2
        }
      },
      vertexCount: 6
    });

    quad = new Model(gl, {
      id: 'quad',
      program: new Program(gl, {vs: SCREEN_QUAD_VS, fs: SCREEN_QUAD_FS}),
      geometry: quadGeometry
    });

    persistenceQuad = new Model(gl, {
      id: 'persistence-quad',
      program: new Program(gl, {vs: SCREEN_QUAD_VS, fs: PERSISTENCE_FS}),
      geometry: quadGeometry
    });

    sphere = new Model(gl, {
      id: 'electron',
      geometry: new SphereGeometry({
        nlat: 20,
        nlong: 30 // To test that sphere generation is working properly.
      }),
      program: new Program(gl, {vs: SPHERE_VS, fs: SPHERE_FS})
    });

    const dt = 0.0125;

    for (let i = 0; i < ELECTRON_COUNT; i++) {
      // Place electron cloud at random positions
      const pos = new Vector3(random() - 0.5, random() - 0.5, random() - 0.5);

      // Push them out a bit
      const distanceFromCenter = random() + 1.0;
      pos.normalize().scale(distanceFromCenter);
      const s = 1.25;
      pos.scale(s);
      ePos.push(pos);

      // Get a random vector and cross
      const q = new Vector3(random() - 0.5, random() - 0.5, random() - 0.5);
      const axis = pos.clone().cross(q).normalize();

      const theta = (4 / distanceFromCenter) * dt;
      const rot = new Matrix4().rotateAxis(theta, axis);
      eRot.push(rot);
    }

    for (let i = 0; i < ELECTRON_COUNT; i++) {
      let pos = new Vector3(random() - 0.5, random() - 0.5, random() - 0.5);
      pos = pos.normalize().scale(0.5);
      nPos.push(pos);
    }
  }

  onRender({gl, tick, width, height, aspect}) {
    mainFramebuffer.resize({width, height});
    pingpongFramebuffers[0].resize({width, height});
    pingpongFramebuffers[1].resize({width, height});

    const projection = new Matrix4().perspective({fov: radians(75), aspect});
    const view = new Matrix4().lookAt({eye: [0, 0, 4]});

    clear(gl, {framebuffer: mainFramebuffer, color: [0, 0, 0, 1.0], depth: 1});

    // Render electrons to framebuffer
    for (let i = 0; i < ELECTRON_COUNT; i++) {
      ePos[i] = eRot[i].transformVector(ePos[i]);
      const modelMatrix = new Matrix4().translate(ePos[i]).scale([0.06125, 0.06125, 0.06125]);

      sphere.draw({
        framebuffer: mainFramebuffer,
        uniforms: {
          uModelView: view.clone().multiplyRight(modelMatrix),
          uView: view,
          uProjection: projection,
          uColor: [0.0, 0.5, 1],
          uLighting: 0
        }
      });
    }

    // Render core to framebuffer
    for (let i = 0; i < ELECTRON_COUNT; i++) {
      const modelMatrix = new Matrix4()
        .rotateXYZ([tick * 0.013, 0, 0])
        .rotateXYZ([0, tick * 0.021, 0])
        .translate(nPos[i]);

      const translation = [modelMatrix[12], modelMatrix[13], modelMatrix[14]];
      modelMatrix.identity().translate(translation).scale([0.25, 0.25, 0.25]);

      sphere.draw({
        framebuffer: mainFramebuffer,
        uniforms: {
          uModelView: view.clone().multiplyRight(modelMatrix),
          uProjection: projection,
          uColor: [1, 0.25, 0.25],
          uLighting: 1
        }
      });
    }

    const ppi = tick % 2;
    const currentFramebuffer = pingpongFramebuffers[ppi];
    const nextFramebuffer = pingpongFramebuffers[1 - ppi];

    // Accumulate in persistence buffer
    clear(gl, {framebuffer: currentFramebuffer, color: true, depth: true});
    persistenceQuad.draw({
      framebuffer: currentFramebuffer,
      uniforms: {
        uScene: mainFramebuffer.texture,
        uPersistence: nextFramebuffer.texture,
        uRes: [width, height]
      }
    });

    // Render to screen
    clear(gl, {color: true, depth: true});
    quad.draw({
      uniforms: {
        uTexture: currentFramebuffer.texture,
        uRes: [width, height]
      }
    });
  }
}

// @ts-ignore
if (typeof window !== 'undefined' && !window.website) {
  const animationLoop = new AppAnimationLoop();
  animationLoop.start();
}
