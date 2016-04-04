var webGLStart = function() {

  var $id = function(d) { return document.getElementById(d); };

  var createGLContext = LumaGL.createGLContext;
  var loadTextures = LumaGL.loadTextures;
  var Program = LumaGL.Program;
  var PerspectiveCamera = LumaGL.PerspectiveCamera;
  var Scene = LumaGL.Scene;
  var Events = LumaGL.Events;
  var Fx = LumaGL.Fx;
  var Vec3 = LumaGL.Vec3;
  var Model = LumaGL.Model;
  var Cube = LumaGL.Cube;

  var canvas = document.getElementById('render-canvas');

  var gl = createGLContext(canvas);

  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.viewport(0, 0, +canvas.width, +canvas.height);

  var program = Program.fromDefaultShaders(gl);
  program.use();


  // rye TODO: there's a bug in merge that makes it require an object.
  var camera = new PerspectiveCamera({});

  var scene = new Scene(gl, program, camera, {
    lights: {
      points: {
        color: {
          r: 1, g: 1, b: 1
        },
        position: {
          x: 0, y: 0, z: 32
        }
      },
      ambient: {
        r: 0.25, g: 0.25, b: 0.25
      },
      enable: true
    },
    backgroundColor: {r: 0, g: 0, b: 0, a: 0}
  });

  var pick = {x: 0, y: 0};
  canvas.addEventListener('mousemove', function(e) {
    pick.x = e.offsetX;
    pick.y = e.offsetY;
  });

  vertices = [];
  normals = [];
  colors = [];

  var res = 128;

  function height(x, z) {
    var d = Math.sqrt(x * x + z * z);
    return 0.5 + (Math.sin(d * 24) + Math.cos((x + 8) * 12) + Math.tanh(z * 6)) * 0.125;
  }

  var s = 1/res;
  for (var i = 0; i < res; i++) {
    var x = s * (i - res/2);
    for (var k = 0; k < res; k++) {
      var z = s * (k - res/2);

      var h0 = height(x + 0, z + 0);
      var h1 = height(x + s, z + 0);
      var h2 = height(x + s, z + s);
      var h3 = height(x + 0, z + s);

      vertices.push.apply(vertices, [x + 0, h0, z + 0]);
      vertices.push.apply(vertices, [x + s, h1, z + 0]);
      vertices.push.apply(vertices, [x + s, h2, z + s]);
      vertices.push.apply(vertices, [x + 0, h0, z + 0]);
      vertices.push.apply(vertices, [x + s, h2, z + s]);
      vertices.push.apply(vertices, [x + 0, h3, z + s]);

      // quick-and-dirty forward difference normal approximation
      var n0 = [(h1 - h0)/s, 1.0, (h3 - h0)/s];
      var n1 = [(h0 - h1)/-s, 1.0, (h2 - h1)/s];
      var n2 = [(h1 - h2)/-s, 1.0, (h3 - h2)/-s];
      var n3 = [(h2 - h3)/s, 1.0, (h0 - h3)/-s];

      normals.push.apply(normals, n0);
      normals.push.apply(normals, n1);
      normals.push.apply(normals, n2);
      normals.push.apply(normals, n0);
      normals.push.apply(normals, n2);
      normals.push.apply(normals, n3);

      colors.push.apply(colors, [h0,h0,h0,1]);
      colors.push.apply(colors, [h1,h1,h1,1]);
      colors.push.apply(colors, [h2,h2,h2,1]);
      colors.push.apply(colors, [h0,h0,h0,1]);
      colors.push.apply(colors, [h2,h2,h2,1]);
      colors.push.apply(colors, [h3,h3,h3,1]);
    }
  }

  var heightmap = new Model({
    vertices: vertices,
    colors: colors,
    normals: normals,
    pickingColors: colors
  });

  scene.add(heightmap);

  function draw() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);

    camera.view.lookAt(new Vec3(0,1.5,0.75), new Vec3(0,0.5,0), new Vec3(0,1,0));
    camera.projection.perspective(60, canvas.width/canvas.height, 0.1, 1000);

    heightmap.rotation.y += 0.01;
    heightmap.update();

    var p = scene.pickCustom(pick.x, pick.y);
    div = document.getElementById('altitude');
    if (JSON.stringify(p) !== JSON.stringify([0,0,0,0])) {
      div.innerHTML = "altitude: " + p[0];
      div.style.top = pick.y + 'px';
      div.style.left = pick.x + 'px';
      div.style.display = 'block';
    } else {
      div.style.display = 'none';
    }

    program.use();
    scene.render();

    Fx.requestAnimationFrame(draw);
  }

  draw();

}
