/* global window, document, LumaGL */
/* eslint-disable no-var, max-statements */
var createGLContext = LumaGL.createGLContext;
var getShadersFromHTML = LumaGL.addons.getShadersFromHTML;
var IcoSphere = LumaGL.IcoSphere;
var Model = LumaGL.Model;
var Program = LumaGL.Program;
var Buffer = LumaGL.Buffer;
var Geometry = LumaGL.Geometry;
var PerspectiveCamera = LumaGL.PerspectiveCamera;
var Framebuffer = LumaGL.FBO;
var Mat4 = LumaGL.Mat4;
var Vec3 = LumaGL.Vec3;
var Fx = LumaGL.Fx;

window.webGLStart = function() {

  var canvas = document.getElementById('render-canvas');
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  var gl = createGLContext({canvas});

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0, 0, 0, 0);
  gl.clearDepth(1);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.BACK);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  var fbo = new Framebuffer(gl, {
    width: canvas.width,
    height: canvas.height
  });

  var pingpongFrameBuffers = [
    new Framebuffer(gl, {
      width: canvas.width,
      height: canvas.height
    }),
    new Framebuffer(gl, {
      width: canvas.width,
      height: canvas.height
    })
  ];

  var QUAD_POSITIONS = [
    -1, -1,
     1, -1,
     1,  1,
    -1, -1,
     1,  1,
    -1,  1
  ];

  var quad = new Model({
    program:
      new Program(gl, getShadersFromHTML({vs: 'quad-vs', fs: 'quad-fs'})),
    geometry: new Geometry({
      positions: {
        value: new Float32Array(QUAD_POSITIONS),
        size: 2
      }
    })
  });
  var ppi = 0;

  var sphere = new IcoSphere({
    iterations: 4,
    program:
      new Program(gl, getShadersFromHTML({vs: 'sphere-vs', fs: 'sphere-fs'}))
  });

  var persistenceProgram =
    new Program(gl, getShadersFromHTML({vs: 'quad-vs', fs: 'persistence-fs'}));
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  var camera = new PerspectiveCamera({
    fov: 75,
    aspect: canvas.width / canvas.height,
    near: 0.01,
    far: 100
  });
  camera.view.lookAt(new Vec3(0, 0, 4), new Vec3(0, 0, 0), new Vec3(0, 1, 0));

  var tick = 0;
  var dt = 0.0125;

  var count = 64;
  var ePos = [];
  var eRot = [];
  for (var i = 0; i < count; i++) {
    var pos =
      new Vec3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
    var a = Math.random() + 1.0;
    pos.normalize().$scale(a, a, a);
    var s = 1.25;
    pos.$scale(s, s, s);
    ePos.push(pos);
    var q =
      new Vec3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
    var axis = pos.cross(q);
    axis.normalize();
    var rot = new Mat4();
    var theta = 4 / a * dt;
    rot.$rotateAxis(theta, axis);
    eRot.push(rot);
  }

  var nPos = [];
  for (var i = 0; i < count; i++) {
    var pos =
      new Vec3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
    pos = pos.unit().scale(0.5);
    nPos.push(pos);
  }

  function render() {
    tick++;

    var modelMatrix;

    fbo.bind();
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    for (var i = 0; i < count; i++) {
      ePos[i] = eRot[i].mulVec3(ePos[i]);
      modelMatrix = new Mat4();
      modelMatrix.$translate(ePos[i][0], ePos[i][1], ePos[i][2]);
      modelMatrix.$scale(0.06125, 0.06125, 0.06125);
      sphere
        .setUniforms({
          uModel: modelMatrix,
          uView: camera.view,
          uProjection: camera.projection,
          uColor: [0.0, 0.5, 1],
          uLighting: 0
        });

      gl.drawElements(
        gl.TRIANGLES, sphere.$indicesLength, gl.UNSIGNED_SHORT, 0
      );
    }

    for (var i = 0; i < count; i++) {
      modelMatrix = new Mat4();
      modelMatrix.$rotateXYZ(tick * 0.013, 0, 0);
      modelMatrix.$rotateXYZ(0, tick * 0.021, 0);
      modelMatrix.$translate(nPos[i][0], nPos[i][1], nPos[i][2]);
      modelMatrix.$scale(0.25, 0.25, 0.25);
      sphere
        .setUniforms({
          uModel: modelMatrix,
          uView: camera.view,
          uProjection: camera.projection,
          uColor: [1, 0.25, 0.25],
          uLighting: 1
        });
      gl.drawElements(
        gl.TRIANGLES, sphere.$indicesLength, gl.UNSIGNED_SHORT, 0
      );
    }

    var currentFrameBuffer = pingpongFrameBuffers[ppi];
    var nextFrameBuffer = pingpongFrameBuffers[1 - ppi];

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    persistenceProgram
      .use()
      .setUniforms({
        uScene: fbo.texture.bind(0),
        uPersistence: nextFrameBuffer.texture.bind(1),
        uRes: [canvas.width, canvas.height]
      })
      .setBuffers(quad);
    currentFrameBuffer.bind();
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    quad
      .use()
      .setUniforms({
        uTexture: currentFrameBuffer.texture.bind(0),
        uRes: [canvas.width, canvas.height]
      })
      .setBuffers(quad);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    Fx.requestAnimationFrame(render);

    ppi = 1 - ppi;
  }

  render();
};
