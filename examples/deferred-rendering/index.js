var createGLContext = LumaGL.createGLContext;
var Program = LumaGL.Program;
var Buffer = LumaGL.Buffer;
var Framebuffer = LumaGL.Framebuffer;
var Mat4 = LumaGL.Mat4;
var Vec3 = LumaGL.Vec3;
var Fx = LumaGL.Fx;
var Texture2D = LumaGL.Texture2D;

var noise = new Noise();

var heightMemo = {};
function height(x, z) {
  if (heightMemo[[x,z]] === undefined) {
    heightMemo[[x,z]] = 2 * noise.perlin2(x*0.5, z*0.5) + 0.5 * noise.perlin2(x,z) + 0.25 * noise.perlin2(x*2,z*2);
  }
  return heightMemo[[x,z]];
}

var normalMemo = {};
function normal(x, z) {
  if (normalMemo[[x,z]] === undefined) {
    var dr = 0.0001;
    var y0 = height(x, z);
    var ydx = height(x + dr, z);
    var ydz = height(x, z + dr);
    var p0 = new Vec3(x, y0, z);
    var px = new Vec3(x + dr, ydx, z);
    var pz = new Vec3(x, ydz, z + dr);
    p0px = px.sub(p0);
    p0pz = pz.sub(p0);
    normalMemo[[x,z]] = p0pz.cross(p0px).unit();
  }
  return normalMemo[[x,z]];
}

function generateTerrain(size, resolution) {

  var positions = [];
  var normals = [];
  var colors = [];

  for (var i = 0; i < resolution; i++) {
    for (var j = 0; j < resolution; j++) {
      var x0 = size * (i + 0) / resolution - size/2;
      var x1 = size * (i + 1) / resolution - size/2;
      var x2 = size * (i + 1) / resolution - size/2;
      var x3 = size * (i + 0) / resolution - size/2;
      var z0 = size * (j + 0) / resolution - size/2;
      var z1 = size * (j + 0) / resolution - size/2;
      var z2 = size * (j + 1) / resolution - size/2;
      var z3 = size * (j + 1) / resolution - size/2;
      var y0 = height(x0, z0);
      var y1 = height(x1, z1);
      var y2 = height(x2, z2);
      var y3 = height(x3, z3);

      var n0 = normal(x0,z0);
      var n1 = normal(x1,z1);
      var n2 = normal(x2,z2);
      var n3 = normal(x3,z3);

      positions.push.apply(positions, [x0,y0,z0, x2,y2,z2, x1,y1,z1, x0,y0,z0, x3,y3,z3, x2,y2,z2]);
      normals.push.apply(normals, [n0.x,n0.y,n0.z, n2.x,n2.y,n2.z, n1.x,n1.y,n1.z, n0.x,n0.y,n0.z, n3.x,n3.y,n3.z, n2.x,n2.y,n2.z]);
    }
  }

  return {
    position: positions,
    normal: normals,
    color: colors
  };

}


window.onload = function() {

  var canvas = document.getElementById('render-canvas');

  var gl = createGLContext(canvas);

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0,0,0, 1);
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
      color = [qq,qq,0];
    } else {
      color = [0,qq,qq];
    }
    colors.push.apply(colors, color);
    lights.push({
      current: new Vec3(0,0,0),
      target: new Vec3(Math.random() * 6 - 3, 0, Math.random() * 6 - 3)
    });
  }

  var quadPosition = [
    -1, -1, 0,   +1, -1, 0,   +1, +1, 0,
    -1, -1, 0,   +1, +1, 0,   -1, +1, 0
  ];

  var quad = {
    position: new Buffer(gl, {
      attribute: 'aPosition',
      data: new Float32Array(quadPosition),
      size: 3
    }),
    color: new Buffer(gl, {
      attribute: 'aColor',
      data: new Float32Array(colors),
      size: 3,
      instanced: 1
    }),
    offset: new Buffer(gl, {
      attribute: 'aOffset',
      data: new Float32Array([0,0,0]),
      size: 3,
      instanced: 1
    })
  };

  var terrainData = generateTerrain(16, 256);

  var terrain = {
    position: new Buffer(gl, {
      attribute: 'aPosition',
      data: new Float32Array(terrainData.position),
      size: 3
    }),
    normal: new Buffer(gl, {
      attribute: 'aNormal',
      data: new Float32Array(terrainData.normal),
      size: 3
    }),
    color: new Buffer(gl, {
      attribute: 'aColor',
      data: new Float32Array(terrainData.color),
      size: 3
    }),
    count: terrainData.position.length/3
  }

  var pPosition = Program.fromHTMLTemplates(gl, 'position-vs', 'position-fs');
  var pNormal = Program.fromHTMLTemplates(gl, 'normal-vs', 'normal-fs');
  var pLights = Program.fromHTMLTemplates(gl, 'lights-vs', 'lights-fs');

  fbPosition = new Framebuffer(gl, {
    width: canvas.clientWidth,
    height: canvas.clientHeight,
    format: gl.RGBA,
    type: gl.FLOAT
  });
  fbNormal = new Framebuffer(gl, {
    width: canvas.clientWidth,
    height: canvas.clientHeight,
    format: gl.RGBA,
    type: gl.FLOAT
  });
  fbColor = new Framebuffer(gl, {
    width: canvas.clientWidth,
    height: canvas.clientHeight,
    format: gl.RGBA,
    type: gl.FLOAT
  });

  var view = new Mat4();
  var projection = new Mat4();

  const ext = gl.getExtension('ANGLE_instanced_arrays');

  var tick = 0;

  function render() {
    tick++;

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    gl.viewport(0,0,canvas.width,canvas.height);

    view.lookAt(new Vec3(Math.cos(tick * 0.002) * 5, 5, Math.sin(tick * 0.002) * 5), new Vec3(0, 0, 0), new Vec3(0, 1 ,0));
    projection.perspective(60, canvas.width/canvas.height, 0.1, 100);

    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.disable(gl.BLEND);

    fbPosition.bind();
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    pPosition.use();
    pPosition.setUniform('uView', view);
    pPosition.setUniform('uProjection', projection);
    pPosition.setBuffer(terrain.position);
    gl.drawArrays(gl.TRIANGLES, 0, terrain.count);
    pPosition.unsetBuffer(terrain.position);

    fbNormal.bind();
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    pNormal.use();
    pNormal.setUniform('uView', view);
    pNormal.setUniform('uProjection', projection);
    pNormal.setBuffer(terrain.position);
    pNormal.setBuffer(terrain.normal);
    gl.drawArrays(gl.TRIANGLES, 0, terrain.count);
    pNormal.unsetBuffer(terrain.position);
    pNormal.unsetBuffer(terrain.normal);

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
      light.current = light.target.sub(light.current).scale(0.005).add(light.current);
      light.current.y = height(light.current.x, light.current.z) + 0.02;
      data.push.apply(data, [light.current.x,light.current.y,light.current.z]);
    }
    quad.offset.update({
      data: new Float32Array(data)
    })

    gl.disable(gl.DEPTH_TEST);
    gl.depthMask(false);
    gl.enable(gl.BLEND);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    pLights.use();
    pLights.setUniform('uView', view);
    pLights.setUniform('uProjection', projection);
    pLights.setUniform('uPosition', fbPosition.texture.bind(0));
    pLights.setUniform('uNormal', fbNormal.texture.bind(1));
    pLights.setUniform('uRes', [canvas.width, canvas.height]);
    pLights.setBuffer(quad.position);
    pLights.setBuffer(quad.offset);
    pLights.setBuffer(quad.color);
    ext.drawArraysInstancedANGLE(gl.TRIANGLES, 0, 6, nLights);
    pLights.unsetBuffer(quad.position);
    pLights.unsetBuffer(quad.offset);
    pLights.unsetBuffer(quad.color);

    requestAnimationFrame(render);
  }

  render();

};
