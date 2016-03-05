import 'babel-polyfill';

const glslify = require('glslify');
import * as LumaGL from '../../../src/index.js';

window.webGLStart = function() {

  var createGLContext = LumaGL.createGLContext;
  var Program = LumaGL.Program;
  var Buffer = LumaGL.Buffer;
  var Cube = LumaGL.Cube;
  var Mat4 = LumaGL.Mat4;
  var Vec3 = LumaGL.Vec3;
  var Fx = LumaGL.Fx;
  var Framebuffer = LumaGL.Framebuffer;

  var canvas = document.getElementById('render-canvas');

  var gl = createGLContext(canvas);

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  var fbShadow = new Framebuffer(gl, {
    width: 1024,
    height: 1024,
    // type: gl.FLOAT
  });

  var q = 1;
  var y = -3;
  var plane = [
    -q,y,q,   q,y,q,   q,y,-q,
    -q,y,q,   q,y,-q,  -q,y,-q
  ];

  var plane = {
    vertices: new Buffer(gl, {
      attribute: 'aPosition',
      data: new Float32Array(plane),
      size: 3
    })
  }

  var cubeModel = new Cube();

  var cube = {
    vertices: new Buffer(gl, {
      attribute: 'aPosition',
      data: new Float32Array(cubeModel.$vertices),
      size: 3
    }),
    normals: new Buffer(gl, {
      attribute: 'aNormal',
      data: new Float32Array(cubeModel.$normals),
      size: 3
    }),
    indices: new Buffer(gl, {
      bufferType: gl.ELEMENT_ARRAY_BUFFER,
      data: cubeModel.$indices,
      size: 1
    })
  };

  var programScene = new Program(gl, glslify('./scene.vs'), glslify('./scene.fs'));
  var programShadow = new Program(gl, glslify('./shadowmap.vs'), glslify('./shadowmap.fs'));

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  var tick = 0;

  var camView = new Mat4();
  var camProj = new Mat4();

  var sdwView = new Mat4();
  var sdwProj = new Mat4();

  var lightPos = new Vec3(0, 8, 0);

  function render() {
    tick++;
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    var model = new Mat4();
    model.$translate(0, 6, 0);
    model.$rotateXYZ(tick * 0.01, 0, 0);
    model.$rotateXYZ(0, tick * 0.013, 0);

    var m2 = new Mat4();
    m2 = m2.scale(2,2,2);
    m2 = m2.translate(0,0,0);
    m2.$rotateXYZ(0, 0, tick * 0.007);

    fbShadow.bind();
    gl.viewport(0,0,1024,1024);
    gl.clearColor(1, 1, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    sdwView.lookAt(lightPos, new Vec3(0,0,0), new Vec3(0,0,-1));
    sdwProj.ortho(-4, 4, 4, -4, 0, 64);
    programShadow.use();
    programShadow.setUniform('uModel', model);
    programShadow.setUniform('uView', sdwView);
    programShadow.setUniform('uProjection', sdwProj);
    programShadow.setUniform('uLightPosition', lightPos);
    programShadow.setBuffer(cube.vertices);
    programShadow.setBuffer(cube.indices);
    gl.drawElements(gl.TRIANGLES, cubeModel.$indicesLength, gl.UNSIGNED_SHORT, 0);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0,0,canvas.width,canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    camView.lookAt(new Vec3(0, 8, 8), new Vec3(0, 3, 0), new Vec3(0,1,0));
    camProj.perspective(75, canvas.width/canvas.height, 0.1, 100);
    programScene.use();
    programScene.setUniform('uModel', model);
    programScene.setUniform('uView', camView);
    programScene.setUniform('uProjection', camProj);
    programScene.setUniform('uShadowView', sdwView);
    programScene.setUniform('uShadowProj', sdwProj);
    programScene.setUniform('uShadowMap', fbShadow.texture.bind(0));
    programScene.setBuffer(cube.vertices);
    programScene.setBuffer(cube.normals);
    programScene.setBuffer(cube.indices);
    programScene.setUniform('uShadow', 0.0);
    gl.drawElements(gl.TRIANGLES, cubeModel.$indicesLength, gl.UNSIGNED_SHORT, 0);
    programScene.setUniform('uModel', m2);
    programScene.setUniform('uShadow', 1.0);
    gl.drawElements(gl.TRIANGLES, cubeModel.$indicesLength, gl.UNSIGNED_SHORT, 0);

    Fx.requestAnimationFrame(render);
  }

  render();

};
