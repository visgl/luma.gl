var createGLContext = LumaGL.createGLContext;
var Program = LumaGL.Program;
var Buffer = LumaGL.Buffer;
var Framebuffer = LumaGL.Framebuffer;
var PerspectiveCamera = LumaGL.PerspectiveCamera;
var Mat4 = LumaGL.Mat4;
var Vec3 = LumaGL.Vec3;
var Fx = LumaGL.Fx;
var Texture2D = LumaGL.Texture2D;


var spriteImg = new Image();
var marbleImg = new Image();
spriteImg.onload = begin;
marbleImg.onload = begin;
spriteImg.src = 'sprite.png';
marbleImg.src = 'marble.png';

function dataTexture(gl, size, fill) {
  var temp = new Float32Array(size*size*4);
  for (var i = 0; i < size * size; i++) {
    f = fill();
    temp[i * 4 + 0] = f[0];
    temp[i * 4 + 1] = f[1];
    temp[i * 4 + 2] = f[2];
    temp[i * 4 + 3] = f[3];
  }
  return new Texture2D(gl, {
    width: size,
    height: size,
    format: gl.RGBA,
    type: gl.FLOAT,
    data: temp,
    flipY: false
  });
}


function begin() {

  if (!spriteImg.complete || !marbleImg.complete) {
    return;
  }

  var canvas = document.getElementById('render-canvas');

  var gl = createGLContext(canvas);

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.0,0.0,0.0, 0);
  gl.clearDepth(1);
  gl.enable(gl.CULL_FACE);
  gl.disable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);


  var dd = 4;
  fillPos = function() {
    return [
      dd * (Math.random() - 0.5),
      dd * (Math.random() - 0.5),
      dd * (Math.random() - 0.5),
      dd * (Math.random() - 0.5)
    ]
  }

  fillColor = function() {
    return [0,0,0,1];
  }

  var dataSize = 256;

  var tPosition = dataTexture(gl, dataSize, fillPos);
  var tSprite = new Texture2D(gl, {
    data: spriteImg
  });
  var tMarble = new Texture2D(gl, {
    data: marbleImg,
    wrapS: gl.REPEAT,
    wrapT: gl.REPEAT,
    magFilter: gl.LINEAR,
    minFilter: gl.LINEAR_MIPMAP_LINEAR,
    generateMipmap: true
  });


  var quadpos = [
    -1, -1, 0,   +1, -1, 0,   +1, +1, 0,
    -1, -1, 0,   +1, +1, 0,   -1, +1, 0
  ];

  var quad = new Buffer(gl, {
    attribute: 'aPosition',
    data: new Float32Array(quadpos),
    size: 3
  });

  var indexArray = new Float32Array(dataSize*dataSize);
  for (var i = 0; i < dataSize*dataSize; i++) {
    indexArray[i] = i;
  }

  var quaduv = [
    0, 0,  1, 0,  1, 1,
    0, 0,  1, 1,  0, 1
  ];

  var sprite = {
    vertices: new Buffer(gl, {
      attribute: 'aPosition',
      data: new Float32Array(quadpos),
      size: 3
    }),
    uvs: new Buffer(gl, {
      attribute: 'aUV',
      data: new Float32Array(quaduv),
      size: 2
    }),
    index: new Buffer(gl, {
      attribute: 'aIndex',
      data: indexArray,
      size: 1,
      instanced: 1
    }),
  };

  var plane = {
    vertices: new Buffer(gl, {
      attribute: 'aPosition',
      data: new Float32Array(quadpos),
      size: 3
    }),
    uvs: new Buffer(gl, {
      attribute: 'aUV',
      data: new Float32Array(quaduv),
      size: 2
    })
  };

  var pAccelerate = Program.fromHTMLTemplates(gl, 'quad-vs', 'accelerate-fs');
  var pIntegrate = Program.fromHTMLTemplates(gl, 'quad-vs', 'integrate-fs');
  var pScene = Program.fromHTMLTemplates(gl, 'scene-vs', 'scene-fs');
  var pPlane = Program.fromHTMLTemplates(gl, 'plane-vs', 'plane-fs');
  var pCopy = Program.fromHTMLTemplates(gl, 'quad-vs', 'copy-fs');

  function copy(src, opts) {
    opts = opts || {};
    opts.width = opts.width || 1;
    opts.height = opts.height || 1;
    pCopy.use();
    if (opts.dest) {
      opts.dest.bind();
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    gl.viewport(0, 0, opts.width, opts.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    pCopy.setUniform('uTexture', src.bind(0));
    pCopy.setBuffer(quad);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  fbPosition = [
    new Framebuffer(gl, {
      width: dataSize,
      height: dataSize,
      format: gl.RGBA,
      type: gl.FLOAT
    }),
    new Framebuffer(gl, {
      width: dataSize,
      height: dataSize,
      format: gl.RGBA,
      type: gl.FLOAT
    })
  ];

  copy(tPosition, {
    width: dataSize,
    height: dataSize,
    dest: fbPosition[0],
  });

  fbVelocity = [
    new Framebuffer(gl, {
      width: dataSize,
      height: dataSize,
      format: gl.RGBA,
      type: gl.FLOAT
    }),
    new Framebuffer(gl, {
      width: dataSize,
      height: dataSize,
      format: gl.RGBA,
      type: gl.FLOAT
    })
  ];

  fbVelocity[0].bind();
  gl.clear(gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT);
  fbVelocity[1].bind();
  gl.clear(gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT);

  var ppongIndex = 0;

  var ext = gl.getExtension('ANGLE_instanced_arrays');

  var view = new Mat4();
  var projection = new Mat4();

  var tick = 1;

  var color = [0.5, 0.05, 0.005];

  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  gl.viewport(0,0,canvas.width,canvas.height);

  function render() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    gl.viewport(0,0,canvas.width,canvas.height);

    tick++;

    var r = Math.sin(tick * 0.001) * 500 + 600;
    view.lookAt(
      new Vec3(Math.cos(tick * 0.002) * r, Math.sin(tick * 0.003) * 500 + 400, Math.sin(tick * 0.002) * r),
      new Vec3(0, 0, 0),
      new Vec3(0,1,0)
    );
    projection.perspective(60, canvas.width/canvas.height, 1, 10000);

    fbVelocitySrc = fbVelocity[ppongIndex];
    fbVelocityDst = fbVelocity[1 - ppongIndex];
    fbPositionSrc = fbPosition[ppongIndex];
    fbPositionDst = fbPosition[1 - ppongIndex];

    gl.viewport(0,0,dataSize,dataSize);

    fbVelocityDst.bind();
    gl.clear(gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT);
    pAccelerate.use();
    pAccelerate.setUniform('uSpeed', Math.sin(tick*0.005) * 8 + 8);
    pAccelerate.setUniform('uPosition', fbPositionSrc.texture.bind(0));
    pAccelerate.setUniform('uVelocity', fbVelocitySrc.texture.bind(1));
    pAccelerate.setUniform('uTime', tick * 0.25);
    pAccelerate.setBuffer(quad);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    fbPositionDst.bind();
    gl.clear(gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT);
    pIntegrate.use();
    pIntegrate.setUniform('uPosition', fbPositionSrc.texture.bind(0));
    pIntegrate.setUniform('uVelocity', fbVelocityDst.texture.bind(1));
    pIntegrate.setBuffer(quad);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0,0,canvas.width,canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var model = new Mat4();
    model.$translate(0, -200, 0);
    model.$rotateXYZ(-Math.PI/2,0,0);
    model.$scale(1000, 1000, 1);

    pPlane.use();
    pPlane.setBuffer(plane.vertices);
    pPlane.setBuffer(plane.uvs);
    pPlane.setUniform('uTexture', tMarble.bind(0));
    pPlane.setUniform('uModel', model);
    pPlane.setUniform('uView', view);
    pPlane.setUniform('uProjection', projection);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    pScene.use();
    pScene.setBuffer(sprite.vertices);
    pScene.setBuffer(sprite.uvs);
    pScene.setBuffer(sprite.index);
    pScene.setUniform('uReflect', true);
    pScene.setUniform('uColor', color);
    pScene.setUniform('uView', view);
    pScene.setUniform('uProjection', projection);
    pScene.setUniform('uPosition', fbPositionDst.texture.bind(1));
    pScene.setUniform('uSprite', tSprite.bind(2));
    pScene.setUniform('uDataSize', dataSize);
    ext.drawArraysInstancedANGLE(gl.TRIANGLES, 0, 6, dataSize*dataSize);

    pScene.use();
    pScene.setBuffer(sprite.vertices);
    pScene.setBuffer(sprite.uvs);
    pScene.setBuffer(sprite.index);
    pScene.setUniform('uReflect', false);
    pScene.setUniform('uColor', color);
    pScene.setUniform('uView', view);
    pScene.setUniform('uProjection', projection);
    pScene.setUniform('uPosition', fbPositionDst.texture.bind(1));
    pScene.setUniform('uSprite', tSprite.bind(2));
    pScene.setUniform('uDataSize', dataSize);
    ext.drawArraysInstancedANGLE(gl.TRIANGLES, 0, 6, dataSize*dataSize);

    ppongIndex = 1 - ppongIndex;

    requestAnimationFrame(render);
  }

  render();

};
