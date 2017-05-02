/* global LumaGL */
/* eslint-disable max-statements */
const {createGLContext, AnimationLoop, IcoSphere, Model} = LumaGL;
const {GL, Program, Buffer, Geometry, Framebuffer} = LumaGL;
const {Mat4, Vec3, Matrix4, radians} = LumaGL;
const {getShadersFromHTML} = LumaGL.addons;

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

let fbo;
let pingpongFrameBuffers;
let quad;
let persistenceQuad;
let sphere;

new AnimationLoop()
.context(() => createGLContext({canvas: 'render-canvas'}))
.init(({gl, width, height}) => {
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
  gl.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, true);

  fbo = new Framebuffer(gl, {width, height});

  pingpongFrameBuffers = [
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
    const pos = new Vec3(
      Math.random() - 0.5,
      Math.random() - 0.5,
      Math.random() - 0.5
    );
    const a = Math.random() + 1.0;
    pos.$unit().$scale(a, a, a);
    const s = 1.25;
    pos.$scale(s, s, s);
    ePos.push(pos);

    const q = new Vec3(
      Math.random() - 0.5,
      Math.random() - 0.5,
      Math.random() - 0.5
    );
    const axis = pos.cross(q);
    axis.$unit();
    const rot = new Mat4();
    const theta = 4 / a * dt;
    rot.$rotateAxis(theta, axis);
    eRot.push(rot);
  }

  for (let i = 0; i < ELECTRON_COUNT; i++) {
    let pos = new Vec3(
      Math.random() - 0.5,
      Math.random() - 0.5,
      Math.random() - 0.5
    );
    pos = pos.unit().scale(0.5);
    nPos.push(pos);
  }
})
.frame(({gl, tick, width, height, aspect}) => {
  fbo.resize({width, height});
  pingpongFrameBuffers[0].resize({width, height});
  pingpongFrameBuffers[1].resize({width, height});

  const projection = Matrix4.perspective({fov: radians(75), aspect});
  const view = Matrix4.lookAt({eye: [0, 0, 4]});

  fbo.bind();
  gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

  // RENDER ELECTRONS TO FRAMEBUFFER

  for (let i = 0; i < ELECTRON_COUNT; i++) {
    ePos[i] = eRot[i].mulVec3(ePos[i]);
    const modelMatrix = new Mat4()
      .$translate(ePos[i][0], ePos[i][1], ePos[i][2])
      .$scale(0.06125, 0.06125, 0.06125);
    sphere.render({
      uModel: modelMatrix,
      uView: view,
      uProjection: projection,
      uColor: [0.0, 0.5, 1],
      uLighting: 0
    });
  }

  // RENDER CORE TO FRAMEBUFFER

  for (let i = 0; i < ELECTRON_COUNT; i++) {
    const modelMatrix = new Mat4()
      .$rotateXYZ(tick * 0.013, 0, 0)
      .$rotateXYZ(0, tick * 0.021, 0)
      .$translate(nPos[i][0], nPos[i][1], nPos[i][2])
      .$scale(0.25, 0.25, 0.25);
    sphere.render({
      uModel: modelMatrix,
      uView: view,
      uProjection: projection,
      uColor: [1, 0.25, 0.25],
      uLighting: 1
    });
  }
  fbo.unbind();

  const ppi = tick % 2;
  const currentFrameBuffer = pingpongFrameBuffers[ppi];
  const nextFrameBuffer = pingpongFrameBuffers[1 - ppi];

  // RENDER TO SCREEN

  gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

  currentFrameBuffer.bind();
  persistenceQuad.render({
    uScene: fbo.texture,
    uPersistence: nextFrameBuffer.texture,
    uRes: [width, height]
  });
  currentFrameBuffer.unbind();

  gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
  quad.render({
    uTexture: currentFrameBuffer.texture,
    uRes: [width, height]
  });
});
