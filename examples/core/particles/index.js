/* global document, LumaGL */
/* eslint-disable no-var, max-statements */
var GL = LumaGL.GL;
var createGLContext = LumaGL.createGLContext;
var Program = LumaGL.Program;
var Buffer = LumaGL.Buffer;
var Framebuffer = LumaGL.Framebuffer;
var Mat4 = LumaGL.Mat4;
var Vec3 = LumaGL.Vec3;
var Texture2D = LumaGL.Texture2D;

var getHTMLTemplate = LumaGL.addons.getHTMLTemplate;

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
    format: GL.RGBA,
    type: GL.FLOAT,
    data: temp,
    flipY: false
  });
}

function begin() {

  if (!spriteImg.complete || !marbleImg.complete) {
    return;
  }

  var canvas = document.getElementById('render-canvas');

  var gl = createGLContext({canvas});

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0, 0, 0, 0);
  gl.clearDepth(1);
  gl.enable(GL.CULL_FACE);
  gl.disable(GL.DEPTH_TEST);
  gl.depthFunc(GL.LEQUAL);
  gl.enable(GL.BLEND);
  gl.blendFunc(GL.SRC_ALPHA, gl.ONE);

  var dd = 4;
  function fillPos() {
    return [
      dd * (Math.random() - 0.5),
      dd * (Math.random() - 0.5),
      dd * (Math.random() - 0.5),
      dd * (Math.random() - 0.5)
    ];
  }

  var dataSize = 256;

  var tPosition = dataTexture(gl, dataSize, fillPos);
  var tSprite = new Texture2D(gl, {
    data: spriteImg
  });
  var tMarble = new Texture2D(gl, {
    data: marbleImg,
    wrapS: GL.REPEAT,
    wrapT: GL.REPEAT,
    magFilter: GL.LINEAR,
    minFilter: GL.LINEAR_MIPMAP_LINEAR,
    generateMipmap: true
  });

  var quadpos = [
    -1, -1, 0, +1, -1, 0, +1, +1, 0,
    -1, -1, 0, +1, +1, 0, -1, +1, 0
  ];

  var quad = {
    aPosition: new Buffer(gl).setData({
      data: new Float32Array(quadpos),
      size: 3
    })
  };

  var indexArray = new Float32Array(dataSize * dataSize);
  for (var i = 0; i < dataSize * dataSize; i++) {
    indexArray[i] = i;
  }

  var quaduv = [
    0, 0, 1, 0, 1, 1,
    0, 0, 1, 1, 0, 1
  ];

  var sprite = {
    aPosition: new Buffer(gl).setData({
      data: new Float32Array(quadpos),
      size: 3
    }),
    aUV: new Buffer(gl).setData({
      data: new Float32Array(quaduv),
      size: 2
    }),
    aIndex: new Buffer(gl).setData({
      attribute: '',
      data: indexArray,
      size: 1,
      instanced: 1
    })
  };

  var plane = {
    aPosition: new Buffer(gl).setData({
      data: new Float32Array(quadpos),
      size: 3
    }),
    aUV: new Buffer(gl).setData({
      data: new Float32Array(quaduv),
      size: 2
    })
  };

  var pAccelerate = new Program(gl, {
    id: 'accelerate',
    vs: getHTMLTemplate('quad-vs'),
    fs: getHTMLTemplate('accelerate-fs')
  });
  var pIntegrate = new Program(gl, {
    id: 'integrate',
    vs: getHTMLTemplate('quad-vs'),
    fs: getHTMLTemplate('integrate-fs')
  });
  var pScene = new Program(gl, {
    id: 'scene',
    vs: getHTMLTemplate('scene-vs'),
    fs: getHTMLTemplate('scene-fs')
  });
  var pPlane = new Program(gl, {
    id: 'plane',
    vs: getHTMLTemplate('plane-vs'),
    fs: getHTMLTemplate('plane-fs')
  });
  var pCopy = new Program(gl, {
    id: 'copy',
    vs: getHTMLTemplate('quad-vs'),
    fs: getHTMLTemplate('copy-fs')
  });

  function copy(src, {width = 1, height = 1, dest = null}) {
    pCopy.use();
    if (dest) {
      dest.bind();
    } else {
      gl.bindFramebuffer(GL.FRAMEBUFFER, null);
    }
    gl.viewport(0, 0, width, height);
    gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
    pCopy
      .setBuffers(quad)
      .setUniforms({uTexture: src})
      .render();
//      .drawArrays(GL.TRIANGLES, 0, 6);
  }

  const fbPosition = [
    new Framebuffer(gl, {
      width: dataSize,
      height: dataSize,
      format: GL.RGBA,
      type: GL.FLOAT
    }),
    new Framebuffer(gl, {
      width: dataSize,
      height: dataSize,
      format: GL.RGBA,
      type: GL.FLOAT
    })
  ];

  copy(tPosition, {
    width: dataSize,
    height: dataSize,
    dest: fbPosition[0]
  });

  const fbVelocity = [
    new Framebuffer(gl, {
      width: dataSize,
      height: dataSize,
      format: GL.RGBA,
      type: GL.FLOAT
    }),
    new Framebuffer(gl, {
      width: dataSize,
      height: dataSize,
      format: GL.RGBA,
      type: GL.FLOAT
    })
  ];

  fbVelocity[0].bind();
  gl.clear(GL.COLOR_BUFFER_BIT, GL.DEPTH_BUFFER_BIT);
  fbVelocity[1].bind();
  gl.clear(GL.COLOR_BUFFER_BIT, GL.DEPTH_BUFFER_BIT);

  var ppongIndex = 0;

  var ext = gl.getExtension('ANGLE_instanced_arrays');

  var view = new Mat4();
  var projection = new Mat4();

  var tick = 1;

  var color = [0.5, 0.05, 0.005];

  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  gl.viewport(0, 0, canvas.width, canvas.height);

  function render() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);

    tick++;

    var r = Math.sin(tick * 0.001) * 500 + 600;
    view.lookAt(
      new Vec3(
        Math.cos(tick * 0.002) * r,
        Math.sin(tick * 0.003) * 500 + 400,
        Math.sin(tick * 0.002) * r
      ),
      new Vec3(0, 0, 0),
      new Vec3(0, 1, 0)
    );
    projection.perspective(60, canvas.width / canvas.height, 1, 10000);

    const fbVelocitySrc = fbVelocity[ppongIndex];
    const fbVelocityDst = fbVelocity[1 - ppongIndex];
    const fbPositionSrc = fbPosition[ppongIndex];
    const fbPositionDst = fbPosition[1 - ppongIndex];

    gl.viewport(0, 0, dataSize, dataSize);

    fbVelocityDst.bind();
    gl.clear(GL.COLOR_BUFFER_BIT, GL.DEPTH_BUFFER_BIT);
    pAccelerate
      .use()
      .setBuffers(quad)
      .setUniforms({
        uSpeed: Math.sin(tick * 0.005) * 8 + 8,
        uPosition: fbPositionSrc.texture,
        uVelocity: fbVelocitySrc.texture,
        uTime: tick * 0.25
      });
    gl.drawArrays(GL.TRIANGLES, 0, 6);

    fbPositionDst.bind();
    gl.clear(GL.COLOR_BUFFER_BIT, GL.DEPTH_BUFFER_BIT);
    pIntegrate
      .use()
      .setBuffers(quad)
      .setUniforms({
        uPosition: fbPositionSrc.texture,
        uVelocity: fbVelocityDst.texture
      });
    gl.drawArrays(GL.TRIANGLES, 0, 6);

    gl.bindFramebuffer(GL.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

    var model = new Mat4();
    model.$translate(0, -200, 0);
    model.$rotateXYZ(-Math.PI / 2, 0, 0);
    model.$scale(1000, 1000, 1);

    pPlane
      .use()
      .setBuffers(plane)
      .setUniforms({
        uTexture: tMarble,
        uModel: model,
        uView: view,
        uProjection: projection
      });
    gl.drawArrays(GL.TRIANGLES, 0, 6);

    pScene
      .use()
      .setBuffers(sprite)
      .setUniforms({
        uReflect: true,
        uColor: color,
        uView: view,
        uProjection: projection,
        uPosition: fbPositionDst.texture,
        uSprite: tSprite,
        uDataSize: dataSize
      });
    ext.drawArraysInstancedANGLE(GL.TRIANGLES, 0, 6, dataSize * dataSize);

    pScene
      .use()
      .setBuffers(sprite)
      .setUniforms({
        uReflect: false,
        uColor: color,
        uView: view,
        uProjection: projection,
        uPosition: fbPositionDst.texture,
        uSprite: tSprite,
        uDataSize: dataSize
      });
    ext.drawArraysInstancedANGLE(GL.TRIANGLES, 0, 6, dataSize * dataSize);

    ppongIndex = 1 - ppongIndex;

    requestAnimationFrame(render);
  }

  render();
}
