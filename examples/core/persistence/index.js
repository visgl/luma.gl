/* global window, document, LumaGL */
/* eslint-disable no-var, max-statements, object-shorthand */
var createGLContext = LumaGL.createGLContext;
var getShadersFromHTML = LumaGL.addons.getShadersFromHTML;
var IcoSphere = LumaGL.IcoSphere;
var Model = LumaGL.Model;
var Program = LumaGL.Program;
var Buffer = LumaGL.Buffer;
var Geometry = LumaGL.Geometry;
var PerspectiveCamera = LumaGL.PerspectiveCamera;
var Framebuffer = LumaGL.Framebuffer;
var Mat4 = LumaGL.Mat4;
var Vec3 = LumaGL.Vec3;
var Fx = LumaGL.Fx;
var GL = LumaGL.GL;

var Renderer = LumaGL.addons.Renderer;

var ELECTRON_COUNT = 64;
var ePos = [];
var eRot = [];
var nPos = [];

var fbo;
var pingpongFrameBuffers;
var quad;
var persistenceQuad;
var sphere;

new Renderer()
.init(function init(context) {
  var gl = context.gl;
  var width = context.width;
  var height = context.height;

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

  fbo = new Framebuffer(gl, {
    width: width,
    height: height
  });

  pingpongFrameBuffers = [
    new Framebuffer(gl, {
      width: width,
      height: height
    }),
    new Framebuffer(gl, {
      width: width,
      height: height
    })
  ];

  var QUAD_POSITIONS = [
    -1, -1, 1, -1, 1, 1,
    -1, -1, 1, 1, -1, 1
  ];

  var quadGeometry = new Geometry({
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

  var dt = 0.0125;

  for (var i = 0; i < ELECTRON_COUNT; i++) {
    var pos = new Vec3(
      Math.random() - 0.5,
      Math.random() - 0.5,
      Math.random() - 0.5
    );
    var a = Math.random() + 1.0;
    pos.$unit().$scale(a, a, a);
    var s = 1.25;
    pos.$scale(s, s, s);
    ePos.push(pos);

    var q = new Vec3(
      Math.random() - 0.5,
      Math.random() - 0.5,
      Math.random() - 0.5
    );
    var axis = pos.cross(q);
    axis.$unit();
    var rot = new Mat4();
    var theta = 4 / a * dt;
    rot.$rotateAxis(theta, axis);
    eRot.push(rot);
  }

  for (var i = 0; i < ELECTRON_COUNT; i++) {
    var pos = new Vec3(
      Math.random() - 0.5,
      Math.random() - 0.5,
      Math.random() - 0.5
    );
    pos = pos.unit().scale(0.5);
    nPos.push(pos);
  }
})
.frame(function frame(context) {
  var gl = context.gl;
  var tick = context.tick;
  var width = context.width;
  var height = context.height;

  var camera = new PerspectiveCamera({
    fov: 75,
    aspect: width / height,
    near: 0.01,
    far: 100
  });
  camera.view.lookAt(new Vec3(0, 0, 4), new Vec3(0, 0, 0), new Vec3(0, 1, 0));

  var modelMatrix;

  fbo.bind();
  gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

  for (var i = 0; i < ELECTRON_COUNT; i++) {
    ePos[i] = eRot[i].mulVec3(ePos[i]);
    modelMatrix = new Mat4()
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

  for (var i = 0; i < ELECTRON_COUNT; i++) {
    modelMatrix = new Mat4()
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

  var ppi = tick % 2;
  var currentFrameBuffer = pingpongFrameBuffers[ppi];
  var nextFrameBuffer = pingpongFrameBuffers[1 - ppi];

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
