/* global window, document, LumaGL */
/* eslint-disable no-var, max-statements */

var createGLContext = LumaGL.createGLContext;
var Program = LumaGL.Program;
var Buffer = LumaGL.Buffer;
var Framebuffer = LumaGL.Framebuffer;
var Mat4 = LumaGL.Mat4;
var Vec3 = LumaGL.Vec3;

var Fx = LumaGL.Fx;
var getHTMLTemplate = LumaGL.addons.getHTMLTemplate;

/* global Noise */
var noise = new Noise();

var heightMemo = {};
function height(x, z) {
  if (heightMemo[[x, z]] === undefined) {
    heightMemo[[x, z]] =
      2 * noise.perlin2(x * 0.5, z * 0.5) +
      0.5 * noise.perlin2(x, z) + 0.25 * noise.perlin2(x * 2, z * 2);
  }
  return heightMemo[[x, z]];
}

var normalMemo = {};
function normal(x, z) {
  if (normalMemo[[x, z]] === undefined) {
    var dr = 0.0001;
    var y0 = height(x, z);
    var ydx = height(x + dr, z);
    var ydz = height(x, z + dr);
    var p0 = new Vec3(x, y0, z);
    var px = new Vec3(x + dr, ydx, z);
    var pz = new Vec3(x, ydz, z + dr);
    var p0px = px.sub(p0);
    var p0pz = pz.sub(p0);
    normalMemo[[x, z]] = p0pz.cross(p0px).unit();
  }
  return normalMemo[[x, z]];
}

function generateTerrain(size, resolution) {

  var positions = [];
  var normals = [];
  var colors = [];

  for (var i = 0; i < resolution; i++) {
    for (var j = 0; j < resolution; j++) {
      var x0 = size * (i + 0) / resolution - size / 2;
      var x1 = size * (i + 1) / resolution - size / 2;
      var x2 = size * (i + 1) / resolution - size / 2;
      var x3 = size * (i + 0) / resolution - size / 2;
      var z0 = size * (j + 0) / resolution - size / 2;
      var z1 = size * (j + 0) / resolution - size / 2;
      var z2 = size * (j + 1) / resolution - size / 2;
      var z3 = size * (j + 1) / resolution - size / 2;
      var y0 = height(x0, z0);
      var y1 = height(x1, z1);
      var y2 = height(x2, z2);
      var y3 = height(x3, z3);

      var n0 = normal(x0, z0);
      var n1 = normal(x1, z1);
      var n2 = normal(x2, z2);
      var n3 = normal(x3, z3);

      positions.push([
        x0,y0,z0, x2,y2,z2, x1,y1,z1,
        x0,y0,z0, x3,y3,z3, x2,y2,z2
      ]);
      normals.push([
        n0.x,n0.y,n0.z, n2.x,n2.y,n2.z, n1.x,n1.y,n1.z,
        n0.x,n0.y,n0.z, n3.x,n3.y,n3.z, n2.x,n2.y,n2.z
      ]);
    }
  }

  return {
    positions: positions,
    normals: normals,
    colors: colors
  };

}

window.onload = function() {
  var canvas = document.getElementById('render-canvas');

  var gl = createGLContext({canvas});

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0, 0, 0, 1);
  gl.enable(gl.CULL_FACE);
  gl.depthFunc(gl.LEQUAL);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE);

  var nLights = 64;
  var lights = [];
  var colors = [];
  var qq = 1;
  for (var i = 0; i < nLights; i++) {
    var color = null;
    if (i % 2 === 0) {
      color = [qq, qq, 0];
    } else {
      color = [0, qq, qq];
    }
    colors.push(color);
    lights.push({
      current: new Vec3(0, 0, 0),
      target: new Vec3(Math.random() * 6 - 3, 0, Math.random() * 6 - 3)
    });
  }

  var QUAD_POSITIONS = new Float32Array([
    -1, -1, 0,
    +1, -1, 0,
    +1, +1, 0,
    -1, -1, 0,
    +1, +1, 0,
    -1, +1, 0
  ]);

  const quadGeometry = new Geometry({
    attributes: {
      aPosition: new Buffer(gl).setData({
        data: new Float32Array(QUAD_POSITIONS),
        size: 3
      }),
      aColor: new Buffer(gl).setData({
        data: new Float32Array(colors),
        size: 3,
        instanced: 1
      }),
      aOffset: new Buffer(gl).setData({
        data: new Float32Array([0, 0, 0]),
        size: 3,
        instanced: 1
      })
    },
    vertexCount: QUAD_POSITIONS.length / 3,
    instanceCount: colors.length / 3
  });

  var terrainData = generateTerrain(16, 256);

  const terrainGeometry = new Geometry({
    attributes: {
      aPosition: new Buffer(gl).setData({
        data: new Float32Array(terrainData.positions),
        size: 3
      }),
      aNormal: new Buffer(gl).setData({
        data: new Float32Array(terrainData.normals),
        size: 3
      }),
      aColor: new Buffer(gl).setData({
        data: new Float32Array(terrainData.colors),
        size: 3
      })
    },
    vertexCount: terrainData.positions.length / 3
  });

  var pPosition = new Program(gl, {
    vs: getHTMLTemplate('position-vs'),
    fs: getHTMLTemplate('position-fs')
  });
  var pNormal = new Program(gl, {
    vs: getHTMLTemplate('normal-vs'),
    fs: getHTMLTemplate('normal-fs')
  });
  var pLights = new Program(gl, {
    vs: getHTMLTemplate('lights-vs'),
    fs: getHTMLTemplate('lights-fs')
  });

  var fbPosition = new Framebuffer(gl, {
    width: canvas.clientWidth,
    height: canvas.clientHeight,
    format: gl.RGBA,
    type: gl.FLOAT
  });
  var fbNormal = new Framebuffer(gl, {
    width: canvas.clientWidth,
    height: canvas.clientHeight,
    format: gl.RGBA,
    type: gl.FLOAT
  });
  // var fbColor = new Framebuffer(gl, {
  //   width: canvas.clientWidth,
  //   height: canvas.clientHeight,
  //   format: gl.RGBA,
  //   type: gl.FLOAT
  // });

  var view = new Mat4();
  var projection = new Mat4();

  var tick = 0;

  function render() {
    tick++;

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);

    view.lookAt(
      new Vec3(Math.cos(tick * 0.002) * 5, 5, Math.sin(tick * 0.002) * 5),
      new Vec3(0, 0, 0),
      new Vec3(0, 1, 0)
    );
    projection.perspective(60, canvas.width / canvas.height, 0.1, 100);

    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.disable(gl.BLEND);

    fbPosition.bind();
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    pPosition
      .use()
      .setUniforms({
        uView: view,
        uProjection: projection
      })
      .setBuffers(terrainBuffers);
    gl.drawArrays(gl.TRIANGLES, 0, terrainBuffersCount);

    fbNormal.bind();
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    pNormal
      .use()
      .setUniforms({
        uView: view,
        uProjection: projection
      })
      .setBuffers(terrainBuffers);
    gl.drawArrays(gl.TRIANGLES, 0, terrainBuffersCount);
    // pNormal.unsetBuffer(terrain.positions);
    // pNormal.unsetBuffer(terrain.normals);

    // Update the lights.
    var data = [];
    for (var i = 0; i < nLights; i++) {
      var light = lights[i];
      if (Math.random() < 0.01) {
        var r = Math.random() * 7;
        var phi = Math.random() * Math.PI * 2;
        light.target.x = Math.cos(phi) * r;
        light.target.z = Math.sin(phi) * r;
      }
      light.current =
        light.target.sub(light.current).scale(0.005).add(light.current);
      light.current.y = height(light.current.x, light.current.z) + 0.02;
      data.push(light.current.x, light.current.y, light.current.z);
    }
    // TODO - subData
    quadBuffers.aOffset.setData({
      data: new Float32Array(data)
    });

    gl.disable(gl.DEPTH_TEST);
    gl.depthMask(false);
    gl.enable(gl.BLEND);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    pLights
      .use()
      .setBuffers(quadBuffers)
      .setUniforms({
        uView: view,
        uProjection: projection,
        uPosition: fbPosition.texture,
        uNormal: fbNormal.texture,
        uRes: [canvas.width, canvas.height]
      });

    const ext = gl.getExtension('ANGLE_instanced_arrays');
    ext.drawArraysInstancedANGLE(gl.TRIANGLES, 0, 6, nLights);

    pLights.unsetBuffers();

    Fx.requestAnimationFrame(render);
  }

  render();
};
