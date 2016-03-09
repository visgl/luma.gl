
window.webGLStart = function() {

  var createGLContext = LumaGL.createGLContext;
  var Program = LumaGL.Program;
  var Buffer = LumaGL.Buffer;
  var PerspectiveCamera = LumaGL.PerspectiveCamera;
  var TextureCube = LumaGL.TextureCube;
  var Cube = LumaGL.Cube;
  var Mat4 = LumaGL.Mat4;
  var Vec3 = LumaGL.Vec3;
  var Fx = LumaGL.Fx;

  var canvas = document.getElementById('render-canvas');

  var gl = createGLContext(canvas);

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0, 0, 0, 1);
  gl.clearDepth(1);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  var textures = genTextures(512);

  var cubemap = new TextureCube(gl, {
    minFilter: gl.LINEAR_MIPMAP_LINEAR,
    magFilter: gl.LINEAR,
    data: textures,
    flipY: true,
    generateMipmap: true
  });

  var cubeModel = new Cube();

  var cube = {
    vertices: new Buffer(gl, {
      attribute: 'aPosition',
      data: cubeModel.$vertices,
      size: 3
    }),
    indices: new Buffer(gl, {
      bufferType: gl.ELEMENT_ARRAY_BUFFER,
      data: cubeModel.$indices,
      size: 1
    })
  };

  var prismModel = new Cube();

  var prism = {
    vertices: new Buffer(gl, {
      attribute: 'aPosition',
      data: new Float32Array(prismModel.$vertices),
      size: 3
    }),
    normals: new Buffer(gl, {
      attribute: 'aNormal',
      data: new Float32Array(prismModel.$normals),
      size: 3
    }),
    indices: new Buffer(gl, {
      bufferType: gl.ELEMENT_ARRAY_BUFFER,
      data: prismModel.$indices,
      size: 1
    })
  };

  var programCube = Program.fromHTMLTemplates(gl, 'cube-vs', 'cube-fs');
  var programPrism = Program.fromHTMLTemplates(gl, 'prism-vs', 'prism-fs');

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  var tick = 0;

  function render() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    gl.viewport(0,0,canvas.width,canvas.height);
    var camera = new PerspectiveCamera({
      fov: 75,
      aspect: canvas.width/canvas.height,
    });
    camera.view.$translate(0, 0, -4);
    tick++;
    var model = new Mat4();
    model.$scale(5,5,5);
    programCube.use();
    programCube.setUniform('uTexture', cubemap.bind(0));
    programCube.setUniform('uModel', model);
    programCube.setUniform('uView', camera.view);
    programCube.setUniform('uProjection', camera.projection);
    programCube.setBuffer(cube.indices);
    programCube.setBuffer(cube.vertices);
    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);

    var reflection = parseFloat(document.getElementById('reflection').value);
    var refraction = parseFloat(document.getElementById('refraction').value);

    var model = new Mat4();
    model.$rotateXYZ(tick * 0.01, 0, 0);
    model.$rotateXYZ(0, tick * 0.013, 0);
    programPrism.use();
    programPrism.setUniform('uTexture', cubemap.bind(0));
    programPrism.setUniform('uModel', model);
    programPrism.setUniform('uView', camera.view);
    programPrism.setUniform('uProjection', camera.projection);
    programPrism.setUniform('uReflect', reflection);
    programPrism.setUniform('uRefract', refraction);
    programPrism.setBuffer(prism.vertices);
    programPrism.setBuffer(prism.normals);
    programPrism.setBuffer(prism.indices);
    gl.drawElements(gl.TRIANGLES, prismModel.$indicesLength, gl.UNSIGNED_SHORT, 0);

    Fx.requestAnimationFrame(render);
  }

  render();

  function genTextures (size) {
    var signs = ['pos', 'neg']
    var axes = ['x', 'y', 'z']
    var textures = {
      pos: {},
      neg: {}
    }
    for (var i = 0; i < signs.length; i++) {
      var sign = signs[i]
      for (var j = 0; j < axes.length; j++) {
        var axis = axes[j]
        var canvas = document.createElement('canvas')
        canvas.width = canvas.height = size
        var ctx = canvas.getContext('2d')
        if (axis === 'x' || axis === 'z') {
          ctx.translate(size, size)
          ctx.rotate(Math.PI)
        }
        var color = 'rgb(0,64,128)';
        ctx.fillStyle = color
        ctx.fillRect(0, 0, size, size)
        ctx.fillStyle = 'white'
        ctx.fillRect(8, 8, size - 16, size - 16)
        ctx.fillStyle = color;
        ctx.font = size / 4 + 'px serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(sign + '-' + axis, size / 2, size / 2)
        ctx.strokeStyle = color;
        ctx.strokeRect(0, 0, size, size)
        textures[sign][axis] = canvas
      }
    }
    return textures;
  }

};
