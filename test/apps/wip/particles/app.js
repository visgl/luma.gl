/* eslint-disable */
/* global document */
import {
  GL,
  AnimationLoop,
  createGLContext,
  Program,
  Buffer,
  Framebuffer,
  Mat4,
  Vec3,
  Texture2D
} from '@luma.gl/core';

const SCENE_VERTEX = `\
precision highp float;

attribute vec3 aPosition;
attribute vec2 aUV;
attribute float aIndex;

uniform mat4 uView;
uniform mat4 uProjection;
uniform sampler2D uPosition;
uniform float uDataSize;
uniform bool uReflect;

varying vec2 uv;

void main(void) {
  mat4 v = uView;
  mat3 iview = mat3(
    v[0][0], v[1][0], v[2][0],
    v[0][1], v[1][1], v[2][1],
    v[0][2], v[1][2], v[2][2]
  );
  float y = floor(aIndex/uDataSize);
  float x = aIndex - (y * uDataSize);
  x = x / uDataSize;
  y = y / uDataSize;
  vec3 o = texture2D(uPosition, vec2(x,y)).rgb;
  if (uReflect) {
    o.y = -o.y - 400.0;
  }
  gl_Position = uProjection * uView * vec4(iview * aPosition * 2.0 + o, 1.0);
  uv = aUV;
}
`;

const SCENE_FRAGMENT = `\
precision highp float;

uniform sampler2D uSprite;
uniform bool uReflect;
uniform vec3 uColor;

varying vec2 uv;

void main(void) {
  float a = texture2D(uSprite, uv).a;
  vec3 q = uColor;
  if (uReflect) {
    q = mix(q, vec3(0.05, 0.05, 0.05), 0.5);
  }
  gl_FragColor = vec4(q,a);
}
`;

const PLANE_VERTEX = `\
attribute vec3 aPosition;
attribute vec2 aUV;

uniform mat4 uView;
uniform mat4 uProjection;
uniform mat4 uModel;

varying vec2 vUV;
varying vec2 vPos;

void main(void) {
  gl_Position = uProjection * uView * uModel * vec4(aPosition, 1);
  vPos = (uModel * vec4(aPosition, 1)).xz;
  vUV = aUV;
}
`;

const PLANE_FRAGMENT = `\
precision highp float;

uniform sampler2D uTexture;

varying vec2 vUV;
varying vec2 vPos;

void main(void) {
  vec3 c = texture2D(uTexture, vUV * 4.0).rgb;
  float q = min(pow(400.0/length(vPos), 12.0), 1.0);
  gl_FragColor = vec4(c*q,1);
}
`;

const QUAD_VERTEX = `\
attribute vec2 aPosition;

varying vec2 vPosition;

void main(void) {
  gl_Position = vec4(aPosition, 0, 1);
  vPosition = aPosition;
}
`;

const COPY_FRAGMENT = `\
precision highp float;

uniform sampler2D uTexture;

varying vec2 vPosition;

void main(void) {
  vec2 p = 0.5 * vPosition + 0.5;
  gl_FragColor = vec4(texture2D(uTexture, p).rgb, 1.0);
}
`;

const INTEGRATE_FRAGMENT = `\
precision highp float;

uniform sampler2D uPosition;
uniform sampler2D uVelocity;

varying vec2 vPosition;

void main(void) {
  vec2 p = 0.5 * vPosition + 0.5;
  vec3 position = texture2D(uPosition, p).rgb;
  vec3 velocity = texture2D(uVelocity, p).rgb * 0.1;
  gl_FragColor = vec4(position + velocity, 1);
}
`;

const ACCELERATE_FRAGMENT = `\
precision highp float;

uniform sampler2D uVelocity;
uniform sampler2D uPosition;
uniform float uTime;
uniform float uSpeed;

varying vec2 vPosition;

float snoise(vec4 v);

float sample(vec3 v, float t) {
  return snoise(vec4(v, t) * 0.02);
}

vec3 displace(vec3 v) {
  float x = sample(v + 11.0, uTime);
  float y = sample(v + 37.0, uTime);
  float z = sample(v + 79.0, uTime);
  return mix(vec3(x,y,z), -v/128.0, 0.125);
}

void main(void) {
  vec2 p = 0.5 * vPosition + 0.5;
  vec3 velocity = texture2D(uVelocity, p).xyz;
  vec3 position = texture2D(uPosition, p).xyz;
  vec3 new = velocity * 0.8 + normalize(displace(position)) * uSpeed;
  gl_FragColor = vec4(new, 1);
}

//
// Description : Array and textureless GLSL 2D/3D/4D simplex
//             noise functions.
//    Author : Ian McEwan, Ashima Arts.
// Maintainer : ijm
//   Lastmod : 20110822 (ijm)
//   License : Copyright (C) 2011 Ashima Arts. All rights reserved.
//             Distributed under the MIT License. See LICENSE file.
//             https://github.com/ashima/webgl-noise
//
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
float mod289(float x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
float permute(float x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float taylorInvSqrt(float r) { return 1.79284291400159 - 0.85373472095314 * r; }
vec4 grad4(float j, vec4 ip) {
  const vec4 ones = vec4(1.0, 1.0, 1.0, -1.0);
  vec4 p,s;
  p.xyz = floor( fract (vec3(j) * ip.xyz) * 7.0) * ip.z - 1.0;
  p.w = 1.5 - dot(abs(p.xyz), ones.xyz);
  s = vec4(lessThan(p, vec4(0.0)));
  p.xyz = p.xyz + (s.xyz*2.0 - 1.0) * s.www;
  return p;
}
#define F4 0.309016994374947451
float snoise(vec4 v) {
  const vec4  C = vec4( 0.138196601125011,
                        0.276393202250021,
                        0.414589803375032,
                       -0.447213595499958);
  vec4 i  = floor(v + dot(v, vec4(F4)) );
  vec4 x0 = v -   i + dot(i, C.xxxx);
  vec4 i0;
  vec3 isX = step( x0.yzw, x0.xxx );
  vec3 isYZ = step( x0.zww, x0.yyz );
  i0.x = isX.x + isX.y + isX.z;
  i0.yzw = 1.0 - isX;
  i0.y += isYZ.x + isYZ.y;
  i0.zw += 1.0 - isYZ.xy;
  i0.z += isYZ.z;
  i0.w += 1.0 - isYZ.z;
  vec4 i3 = clamp( i0, 0.0, 1.0 );
  vec4 i2 = clamp( i0-1.0, 0.0, 1.0 );
  vec4 i1 = clamp( i0-2.0, 0.0, 1.0 );
  vec4 x1 = x0 - i1 + C.xxxx;
  vec4 x2 = x0 - i2 + C.yyyy;
  vec4 x3 = x0 - i3 + C.zzzz;
  vec4 x4 = x0 + C.wwww;
  i = mod289(i);
  float j0 = permute( permute( permute( permute(i.w) + i.z) + i.y) + i.x);
  vec4 j1 = permute( permute( permute( permute (
             i.w + vec4(i1.w, i2.w, i3.w, 1.0 ))
           + i.z + vec4(i1.z, i2.z, i3.z, 1.0 ))
           + i.y + vec4(i1.y, i2.y, i3.y, 1.0 ))
           + i.x + vec4(i1.x, i2.x, i3.x, 1.0 ));
  vec4 ip = vec4(1.0/294.0, 1.0/49.0, 1.0/7.0, 0.0) ;
  vec4 p0 = grad4(j0,   ip);
  vec4 p1 = grad4(j1.x, ip);
  vec4 p2 = grad4(j1.y, ip);
  vec4 p3 = grad4(j1.z, ip);
  vec4 p4 = grad4(j1.w, ip);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  p4 *= taylorInvSqrt(dot(p4,p4));
  vec3 m0 = max(0.6 - vec3(dot(x0,x0), dot(x1,x1), dot(x2,x2)), 0.0);
  vec2 m1 = max(0.6 - vec2(dot(x3,x3), dot(x4,x4)            ), 0.0);
  m0 = m0 * m0;
  m1 = m1 * m1;
  return 49.0 * ( dot(m0*m0, vec3( dot( p0, x0 ), dot( p1, x1 ), dot( p2, x2 )))
                + dot(m1*m1, vec2( dot( p3, x3 ), dot( p4, x4 ) ) ) ) ;
}
`;

var spriteImg = new Image();
var marbleImg = new Image();
spriteImg.onload = begin;
marbleImg.onload = begin;
spriteImg.src = 'sprite.png';
marbleImg.src = 'marble.png';

function dataTexture(gl, size, fill) {
  var temp = new Float32Array(size * size * 4);
  for (var i = 0; i < size * size; i++) {
    const f = fill();
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
    pixelStore: {
      [GL.WEBGL_FLIP_Y]: false
    }
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
    mipmap: true,
    parameters: {
      [GL.WRAP_S]: GL.REPEAT,
      [GL.WRAP_T]: GL.REPEAT,
      [GL.MAG_FILTER]: GL.LINEAR,
      [GL.MIN_FILTER]: GL.LINEAR_MIPMAP_LINEAR
    }
  });

  var quadpos = [-1, -1, 0, +1, -1, 0, +1, +1, 0, -1, -1, 0, +1, +1, 0, -1, +1, 0];

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

  var quaduv = [0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1];

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
      divisor: 1
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
    vs: QUAD_VERTEX,
    fs: ACCELERATE_FRAGMENT
  });
  var pIntegrate = new Program(gl, {
    id: 'integrate',
    vs: QUAD_VERTEX,
    fs: INTEGRATE_FRAGMENT
  });
  var pScene = new Program(gl, {
    id: 'scene',
    vs: SCENE_VERTEX,
    fs: SCENE_FRAGMENT
  });
  var pPlane = new Program(gl, {
    id: 'plane',
    vs: PLANE_VERTEX,
    fs: PLANE_FRAGMENT
  });
  var pCopy = new Program(gl, {
    id: 'copy',
    vs: QUAD_VERTEX,
    fs: COPY_FRAGMENT
  });

  function copy(src, {width = 1, height = 1, dest = null}) {
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
    pAccelerate.setBuffers(quad).setUniforms({
      uSpeed: Math.sin(tick * 0.005) * 8 + 8,
      uPosition: fbPositionSrc.texture,
      uVelocity: fbVelocitySrc.texture,
      uTime: tick * 0.25
    });
    gl.drawArrays(GL.TRIANGLES, 0, 6);

    fbPositionDst.bind();
    gl.clear(GL.COLOR_BUFFER_BIT, GL.DEPTH_BUFFER_BIT);
    pIntegrate.setBuffers(quad).setUniforms({
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

    pPlane.setBuffers(plane).setUniforms({
      uTexture: tMarble,
      uModel: model,
      uView: view,
      uProjection: projection
    });
    gl.drawArrays(GL.TRIANGLES, 0, 6);

    pScene.setBuffers(sprite).setUniforms({
      uReflect: true,
      uColor: color,
      uView: view,
      uProjection: projection,
      uPosition: fbPositionDst.texture,
      uSprite: tSprite,
      uDataSize: dataSize
    });
    ext.drawArraysInstancedANGLE(GL.TRIANGLES, 0, 6, dataSize * dataSize);

    pScene.setBuffers(sprite).setUniforms({
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
