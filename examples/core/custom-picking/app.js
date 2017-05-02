/* global document */
/* eslint-disable no-var, max-statements */
import {
  GL, createGLContext, AnimationLoop, Scene, Model, Program, Geometry,
  Matrix4, radians
} from 'luma.gl';

class HeightmapGeometry extends Geometry {
  constructor(opts) {
    super(opts);
    this._initialize();
  }

  _initialize() {
    var positions = [];
    var normals = [];
    var colors = [];

    function height(x, z) {
      var d = Math.sqrt(x * x + z * z);
      return 0.5 +
        (Math.sin(d * 24) + Math.cos((x + 8) * 12) + Math.tanh(z * 6)) * 0.125;
    }

    const res = 128;

    var s = 1 / res;
    for (var i = 0; i < res; i++) {
      var x = s * (i - res / 2);
      for (var k = 0; k < res; k++) {
        var z = s * (k - res / 2);

        var h0 = height(x + 0, z + 0);
        var h1 = height(x + s, z + 0);
        var h2 = height(x + s, z + s);
        var h3 = height(x + 0, z + s);

        positions.push(x + 0, h0, z + 0);
        positions.push(x + s, h1, z + 0);
        positions.push(x + s, h2, z + s);
        positions.push(x + 0, h0, z + 0);
        positions.push(x + s, h2, z + s);
        positions.push(x + 0, h3, z + s);

        // quick-and-dirty forward difference normal approximation
        var n0 = [(h1 - h0) / s, 1.0, (h3 - h0) / s];
        var n1 = [(h0 - h1) / -s, 1.0, (h2 - h1) / s];
        var n2 = [(h1 - h2) / -s, 1.0, (h3 - h2) / -s];
        var n3 = [(h2 - h3) / s, 1.0, (h0 - h3) / -s];

        normals.push(...n0);
        normals.push(...n1);
        normals.push(...n2);
        normals.push(...n0);
        normals.push(...n2);
        normals.push(...n3);

        colors.push(h0, h0, h0, 1);
        colors.push(h1, h1, h1, 1);
        colors.push(h2, h2, h2, 1);
        colors.push(h0, h0, h0, 1);
        colors.push(h2, h2, h2, 1);
        colors.push(h3, h3, h3, 1);
      }
    }

    this.setAttributes({
      positions: {size: 3, value: new Float32Array(positions)},
      normals: {size: 3, value: new Float32Array(normals)},
      colors: {size: 4, value: new Float32Array(colors)},
      pickingColors: {size: 4, value: new Float32Array(colors)},
      // Dummy to silence shader attribute 0 warnings
      texCoords: {size: 2, value: new Float32Array(positions)}
    });
    this.setVertexCount(positions.length / 3);
  }
}

var scene;
var pick = {x: 0, y: 0};
var heightmap;

new AnimationLoop({gl: createGLContext()})
.init(({gl}) => {
  gl.enable(GL.DEPTH_TEST);
  gl.depthFunc(GL.LEQUAL);

  scene = new Scene(gl, {
    lights: {
      points: {
        color: {r: 1, g: 1, b: 1},
        position: {x: 0, y: 0, z: 32}
      },
      ambient: {r: 0.25, g: 0.25, b: 0.25},
      enable: true
    },
    backgroundColor: {r: 0, g: 0, b: 0, a: 0}
  });

  gl.canvas.addEventListener('mousemove', function mousemove(e) {
    pick.x = e.offsetX;
    pick.y = e.offsetY;
  });

  heightmap = new Model({
    id: 'heightmap',
    program: new Program(gl),
    geometry: new HeightmapGeometry()
  });

  scene.add(heightmap);
})
.frame(({tick, aspect}) => {
  const projection = Matrix4.perspective({
    fov: radians(60), aspect, near: 0.1, far: 1000
  });

  const view = Matrix4.lookAt({eye: [0, 1.5, 0.75], center: [0, 0.5, 0]});
  const model = new Matrix4().clone(view).rotateY(tick * 0.01);

  const uniforms = {
    projectionMatrix: projection,
    viewMatrix: view,
    modelMatrix: model,
    hasPickingColors: true
  };

  scene.render(uniforms);

  var div = document.getElementById('altitude');
  const pickInfo = scene.pickModels({
    uniforms,
    x: pick.x,
    y: pick.y
  });

  if (pickInfo) {
    div.innerHTML = `altitude: ${pickInfo.color[0]}`;
    div.style.top = `${pick.y}px`;
    div.style.left = `${pick.x}px`;
    div.style.display = 'block';
  } else {
    div.style.display = 'none';
  }
});
