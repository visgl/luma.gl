import {AnimationLoop, IcoSphere, Model, clear} from 'luma.gl';
import {GL, Program, Geometry, Framebuffer} from 'luma.gl';
import {Matrix4, Vector3, radians} from 'luma.gl';

const SCREEN_QUAD_VS = `\
attribute vec2 aPosition;

void main(void) {
  gl_Position = vec4(aPosition, 0, 1);
}
`;

const SCREEN_QUAD_FS = `\
#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D uTexture;
uniform vec2 uRes;

void main(void) {
  vec2 p = gl_FragCoord.xy/uRes.xy;
  gl_FragColor = texture2D(uTexture, p);
}
`;

const PERSISTENCE_FS = `\
#ifdef GL_ES
precision highp float;
#endif

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

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;

varying vec3 normal;

void main(void) {
  gl_Position = uProjection * uView * uModel * vec4(positions, 1.0);
  normal = vec3(uModel * vec4(normals,1));
}
`;

const SPHERE_FS = `\
#ifdef GL_ES
precision highp float;
#endif

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
const animationLoop = new AnimationLoop({
  // .context(() => createGLContext({canvas: 'render-canvas'}))
  onInitialize: ({gl, width, height}) => {

    addControls();
    // setGLState(gl, {
    //   clearColor: [0, 0, 0, 0],
    //   clearDepth: 1,
    //   depthTest: true,
    //   depthFunc: GL.LEQUAL,
    //   cullFace: GL.BACK,
    //   unpackFlipYWebGL: true
    // });

    gl.clearColor(0, 0, 0, 0);
    gl.clearDepth(1);
    gl.enable(GL.DEPTH_TEST);
    gl.depthFunc(GL.LEQUAL);
    gl.enable(GL.CULL_FACE);
    gl.cullFace(GL.BACK);
    // gl.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, true);

    /*
    withParameters({
      clearColor: [0, 0, 0, 0],
      clearDepth: 1,
      enableDepthTest: true,
      depthFunc: GL.EQUAL,
      enableFaceCulling: true,
      cullFace: GL.BACK,
      pixelStore: {
        [GL.UNPACK_FLIP_Y_WEBGL]: true
      }
    });
    */

    mainFramebuffer = new Framebuffer(gl, {width, height});

    pingpongFramebuffers = [
      new Framebuffer(gl, {width, height}),
      new Framebuffer(gl, {width, height})
    ];

    const QUAD_POSITIONS = [
      -1, -1, 1, -1, 1, 1,
      -1, -1, 1, 1, -1, 1
    ];

    const quadGeometry = new Geometry({
      attributes: {
        aPosition: {
          value: new Float32Array(QUAD_POSITIONS),
          size: 2
        }
      },
      vertexCount: 6
    });

    quad = new Model({
      id: 'quad',
      program: new Program(gl, {vs: SCREEN_QUAD_VS, fs: SCREEN_QUAD_FS}),
      geometry: quadGeometry
    });

    persistenceQuad = new Model({
      id: 'persistence-quad',
      program: new Program(gl, {vs: SCREEN_QUAD_VS, fs: PERSISTENCE_FS}),
      geometry: quadGeometry
    });

    sphere = new IcoSphere({
      id: 'electron',
      iterations: 4,
      program: new Program(gl, {vs: SPHERE_VS, fs: SPHERE_FS})
    });

    const dt = 0.0125;

    for (let i = 0; i < ELECTRON_COUNT; i++) {
      // Place electron cloud at random positions
      const pos = new Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      );

      // Push them out a bit
      const distanceFromCenter = Math.random() + 1.0;
      pos.normalize().scale(distanceFromCenter);
      const s = 1.25;
      pos.scale(s);
      ePos.push(pos);

      // Get a random vector and cross
      const q = new Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
      const axis = pos.clone().cross(q).normalize();

      const theta = 4 / distanceFromCenter * dt;
      const rot = new Matrix4().rotateAxis(theta, axis);
      eRot.push(rot);
    }

    for (let i = 0; i < ELECTRON_COUNT; i++) {
      let pos = new Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      );
      pos = pos.normalize().scale(0.5);
      nPos.push(pos);
    }
  },
  onRender: ({gl, tick, width, height, aspect}) => {
    /*
    withParameters({
      clearColor: [0, 0, 0, 0],
      clearDepth: 1,
      // enableDepthTest: true,
      depthFunc: GL.EQUAL,
      // enableFaceCulling: true,
      cullFace: GL.BACK,
      pixelStore: {
        [GL.UNPACK_FLIP_Y_WEBGL]: true
      }
    }, () => {
    });
    */

    mainFramebuffer.resize({width, height});
    pingpongFramebuffers[0].resize({width, height});
    pingpongFramebuffers[1].resize({width, height});

    const projection = new Matrix4().perspective({fov: radians(75), aspect});
    const view = new Matrix4().lookAt({eye: [0, 0, 4]});

    mainFramebuffer.clear({color: [0, 0, 0, 0], depth: 1});

    // RENDER ELECTRONS TO FRAMEBUFFER
    for (let i = 0; i < ELECTRON_COUNT; i++) {
      ePos[i] = eRot[i].transformVector(ePos[i]);
      const modelMatrix = new Matrix4()
        .translate(ePos[i])
        .scale([0.06125, 0.06125, 0.06125]);

      sphere.draw({
        framebuffer: mainFramebuffer,
        uniforms: {
          uModel: modelMatrix,
          uView: view,
          uProjection: projection,
          uColor: [0.0, 0.5, 1],
          uLighting: 0
        }
      });
    }

    // RENDER CORE TO FRAMEBUFFER

    for (let i = 0; i < ELECTRON_COUNT; i++) {
      const modelMatrix = new Matrix4()
        .rotateXYZ([tick * 0.013, 0, 0])
        .rotateXYZ([0, tick * 0.021, 0])
        .translate(nPos[i])
        .scale([0.25, 0.25, 0.25]);
      sphere.draw({
        framebuffer: mainFramebuffer,
        uniforms: {
          uModel: modelMatrix,
          uView: view,
          uProjection: projection,
          uColor: [1, 0.25, 0.25],
          uLighting: 1
        }
      });
    }
    mainFramebuffer.unbind();

    const ppi = tick % 2;
    const currentFramebuffer = pingpongFramebuffers[ppi];
    const nextFramebuffer = pingpongFramebuffers[1 - ppi];

    // RENDER TO SCREEN

    gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
    persistenceQuad.draw({
      framebuffer: currentFramebuffer,
      uniforms: {
        uScene: mainFramebuffer.texture,
        uPersistence: nextFramebuffer.texture,
        uRes: [width, height]
      }
    });

    gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
    quad.render({
      uTexture: currentFramebuffer.texture,
      uRes: [width, height]
    });

    // gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
    // quad.render({
    //   uTexture: currentFramebuffer.texture,
    //   uRes: [width, height]
    // });
  }
});

function addControls() {
  const controlPanel = document.querySelector('.control-panel');
  if (controlPanel) {
    controlPanel.innerHTML = `
  <p>
  Electron trails renderings persist across multiple frames.
  <p>
  Uses multiple luma.gl <code>Framebuffer</code>s to hold previously rendered
  data between frames.
    `;
  }
}

export default animationLoop;
