/* global window, document, LumaGL */
/* eslint-disable no-var, max-statements */
window.webGLStart = function() {

  var createGLContext = LumaGL.createGLContext;
  var getShadersFromHTML = LumaGL.addons.getShadersFromHTML;
  var IcoSphere = LumaGL.IcoSphere;
  var Program = LumaGL.Program;
  var Buffer = LumaGL.Buffer;
  var PerspectiveCamera = LumaGL.PerspectiveCamera;
  var Framebuffer = LumaGL.Framebuffer;
  var Mat4 = LumaGL.Mat4;
  var Vec3 = LumaGL.Vec3;
  var Fx = LumaGL.Fx;

  var canvas = document.getElementById('render-canvas');
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  var gl = createGLContext(canvas);

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

  var pingpong = [
    new Framebuffer(gl, {
      width: canvas.width,
      height: canvas.height
    }),
    new Framebuffer(gl, {
      width: canvas.width,
      height: canvas.height
    })
  ];

  var quadPositions = [
    -1, -1,
     1, -1,
     1,  1,
    -1, -1,
     1,  1,
    -1,  1
  ];

  var quad = new Buffer(gl, {
    attribute: 'aPosition',
    data: new Float32Array(quadPositions),
    size: 2
  });

  var ppi = 0;

  var sphereModel = new IcoSphere({iterations: 4});

  var sphere = {
    vertices: new Buffer(gl, {
      attribute: 'aPosition',
      data: new Float32Array(sphereModel.$vertices),
      size: 3
    }),
    normals: new Buffer(gl, {
      attribute: 'aNormal',
      data: new Float32Array(sphereModel.$normals),
      size: 3
    }),
    indices: new Buffer(gl, {
      bufferType: gl.ELEMENT_ARRAY_BUFFER,
      data: sphereModel.$indices,
      size: 1
    })
  };

  var programQuad =
    new Program(gl, getShadersFromHTML({vs: 'quad-vs', fs: 'quad-fs'}));
  var programPersistence =
    new Program(gl, getShadersFromHTML({vs: 'quad-vs', fs: 'persistence-fs'}));
  var programSphere =
    new Program(gl, getShadersFromHTML({vs: 'sphere-vs', fs: 'sphere-fs'}));

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
    pos.$unit().$scale(a, a, a);
    var s = 1.25;
    pos.$scale(s, s, s);
    ePos.push(pos);
    var q =
      new Vec3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
    var axis = pos.cross(q);
    axis.$unit();
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

    fbo.bind()
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    for (var i = 0; i < count; i++) {
      ePos[i] = eRot[i].mulVec3(ePos[i]);
      var model = new Mat4();
      model.$translate(ePos[i][0], ePos[i][1], ePos[i][2]);
      model.$scale(0.06125,0.06125,0.06125);
      programSphere.use();
      programSphere.setUniform('uModel', model);
      programSphere.setUniform('uView', camera.view);
      programSphere.setUniform('uProjection', camera.projection);
      programSphere.setUniform('uColor', [0.0,0.5,1]);
      programSphere.setUniform('uLighting', false);
      programSphere.setBuffer(sphere.vertices);
      programSphere.setBuffer(sphere.normals);
      programSphere.setBuffer(sphere.indices);
      gl.drawElements(gl.TRIANGLES, sphereModel.$indicesLength, gl.UNSIGNED_SHORT, 0);
    }

    for (var i = 0; i < count; i++) {
      var model = new Mat4();
      model.$rotateXYZ(tick * 0.013,0,0);
      model.$rotateXYZ(0,tick * 0.021,0);
      model.$translate(nPos[i][0], nPos[i][1], nPos[i][2]);
      model.$scale(0.25,0.25,0.25);
      programSphere.use();
      programSphere.setUniform('uModel', model);
      programSphere.setUniform('uView', camera.view);
      programSphere.setUniform('uProjection', camera.projection);
      programSphere.setUniform('uColor', [1,0.25,0.25]);
      programSphere.setUniform('uLighting', true);
      programSphere.setBuffer(sphere.vertices);
      programSphere.setBuffer(sphere.normals);
      programSphere.setBuffer(sphere.indices);
      gl.drawElements(
        gl.TRIANGLES, sphereModel.$indicesLength, gl.UNSIGNED_SHORT, 0
      );
    }

    var current = pingpong[ppi];
    var next = pingpong[1 - ppi];

    programPersistence.use();
    programPersistence.setUniform('uScene', fbo.texture.bind(0));
    programPersistence.setUniform('uPersistence', next.texture.bind(1));
    programPersistence.setUniform('uRes', [canvas.width, canvas.height]);
    programPersistence.setBuffer(quad);
    current.bind();
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    programQuad.use();
    programQuad.setUniform('uTexture', current.texture.bind(0));
    programQuad.setUniform('uRes', [canvas.width, canvas.height]);
    programQuad.setBuffer(quad);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    Fx.requestAnimationFrame(render);

    ppi = 1 - ppi;
  }

  render();
};
