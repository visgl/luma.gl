/* global LumaGL */
/* eslint-disable max-statements */
const {createGLContext, AnimationFrame, IcoSphere, Model} = LumaGL;
const {GL, Program, Buffer, Geometry, Framebuffer, Mat4, Vec3} = LumaGL;
const {PerspectiveCamera} = LumaGL;
const {getShadersFromHTML} = LumaGL.addons;

const ELECTRON_COUNT = 64;
const ePos = [];
const eRot = [];
const nPos = [];

let fbo;
let pingpongFrameBuffers;
let quad;
let persistenceQuad;
let sphere;

new AnimationFrame({gl: createGLContext()})
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
    program: new Program(gl,
      getShadersFromHTML({vs: 'quad-vs', fs: 'quad-fs'})
    ),
    geometry: quadGeometry
  });

  persistenceQuad = new Model({
    id: 'persistence-quad',
    program: new Program(gl,
      getShadersFromHTML({vs: 'quad-vs', fs: 'persistence-fs'})
    ),
    geometry: quadGeometry
  });

  sphere = new IcoSphere({
    id: 'electron',
    iterations: 4,
    program:
      new Program(gl, getShadersFromHTML({vs: 'sphere-vs', fs: 'sphere-fs'}))
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
  const camera = new PerspectiveCamera({fov: 75, aspect, near: 0.01, far: 100});
  camera.view.lookAt(new Vec3(0, 0, 4), new Vec3(0, 0, 0), new Vec3(0, 1, 0));

  fbo.bind();
  gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

  for (let i = 0; i < ELECTRON_COUNT; i++) {
    ePos[i] = eRot[i].mulVec3(ePos[i]);
    const modelMatrix = new Mat4()
      .$translate(ePos[i][0], ePos[i][1], ePos[i][2])
      .$scale(0.06125, 0.06125, 0.06125);
    sphere.render({
      uModel: modelMatrix,
      uView: camera.view,
      uProjection: camera.projection,
      uColor: [0.0, 0.5, 1],
      uLighting: 0
    });
  }

  for (let i = 0; i < ELECTRON_COUNT; i++) {
    const modelMatrix = new Mat4()
      .$rotateXYZ(tick * 0.013, 0, 0)
      .$rotateXYZ(0, tick * 0.021, 0)
      .$translate(nPos[i][0], nPos[i][1], nPos[i][2])
      .$scale(0.25, 0.25, 0.25);
    sphere.render({
      uModel: modelMatrix,
      uView: camera.view,
      uProjection: camera.projection,
      uColor: [1, 0.25, 0.25],
      uLighting: 1
    });
  }

  const ppi = tick % 2;
  const currentFrameBuffer = pingpongFrameBuffers[ppi];
  const nextFrameBuffer = pingpongFrameBuffers[1 - ppi];

  gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

  currentFrameBuffer.bind();
  persistenceQuad.render({
    uScene: fbo.texture,
    uPersistence: nextFrameBuffer.texture,
    uRes: [width, height]
  });
  // gl.drawArrays(gl.TRIANGLES, 0, 6);
  gl.bindFramebuffer(GL.FRAMEBUFFER, null);

  gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
  quad.render({
    uTexture: currentFrameBuffer.texture,
    uRes: [width, height]
  });
  // gl.drawArrays(gl.TRIANGLES, 0, 6);
});
