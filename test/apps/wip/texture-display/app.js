/*
  Test app to verify a texture contents, takes a texture and maps each pixel to a grid cell.
*/

import {AnimationLoop, Model, Texture2D, Buffer, setParameters, Transform} from '@luma.gl/core';
import {_getHistoPyramid as getHistoPyramid} from '@luma.gl/gpgpu';
import GL from '@luma.gl/constants';

const INFO_HTML = `
Example to display a texture
`;

const VERTEX_SHADER = `\
attribute vec2 positions;
attribute vec2 offsets;
uniform vec2 windowSize;
uniform vec2 gridSize;

varying vec2 vTextureCoord;

void main(void) {
  // Map each vertex from (0,0):windowSize -> (-1, -1):(1,1)
  vec2 pos = ((positions + offsets) * (2., 2.) / (windowSize)) - (1., 1.);
  gl_Position = vec4(pos, 1.0, 1.0);

  // Position is in (-1, -1) to (1, 1) => texCord (0, 0) -> (1, 1)
  vTextureCoord = (positions + offsets) / windowSize;

  // Add 0.5 offset to coordinate (1/gridSize * 0.5)
  // vTextureCoord = vTextureCoord + (0.5 / gridSize);
}
`;

const FRAGMENT_SHADER = `\
#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTextureCoord;
uniform sampler2D uSampler;

void main(void) {
  vec4 textureColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
  gl_FragColor = vec4(textureColor.rgb, 1.0);
}
`;

// margin between grid cells
const MARGIN = 0.2;

function generateTriangleVerticesInRect(start, end) {
  const startX = start[0] + MARGIN;
  const startY = start[1] + MARGIN;
  const endX = end[0] - MARGIN;
  const endY = end[1] - MARGIN;

  return [endX, endY, startX, endY, endX, startY, startX, startY];
}

function generateOffsetsForGrid(windowSize, cellSize) {
  const offsets = [];
  for (let x = 0; x < windowSize[0]; x = x + cellSize[0]) {
    for (let y = 0; y < windowSize[1]; y = y + cellSize[1]) {
      offsets.push(x, y);
    }
  }
  return offsets;
}

function getTextureToDisplay(gl) {
  // const texWidth = 4;
  // const texHeight = 4;
  // const textureData = new Float32Array([
  //   3, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
  //   0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
  //   0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  3, 0, 0, 0,
  //   0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0
  // ]).map(x => x / 10);

  const texWidth = 60;
  const texHeight = 60;
  const pixelCount = texWidth * texHeight;
  const textureData = new Float32Array(pixelCount * 4);
  // for (let i = 0; i < pixelCount; i++) {
  //   // textureData[i * 4] = Math.random() / 50;
  //
  //   const channel = Math.random() * 3.0;
  //   if (channel > 2) {
  //     textureData[i * 4] = Math.random() / 20;
  //   } else if (channel > 1) {
  //     textureData[i * 4 + 1] = Math.random() / 20;
  //   } else {
  //     textureData[i * 4 + 2] = Math.random() / 20;
  //   }
  // }
  const midPixel = (texWidth * (texHeight / 2) + (texWidth / 2))* 4;

  const offset =  (texWidth / 4) * 4 - 32;
  const leftPixel = midPixel - offset;
  const rightPixel = midPixel + offset;
  textureData[leftPixel] = 1;
  textureData[rightPixel + 1] = 1;


  const texture = new Texture2D(gl, {
    data: textureData,
    format: GL.RGBA32F,
    type: GL.FLOAT,
    border: 0,
    mipmaps: false,
    parameters: {
      [GL.TEXTURE_MAG_FILTER]: GL.NEAREST,
      [GL.TEXTURE_MIN_FILTER]: GL.NEAREST
    },
    pixelStore: {
      [GL.UNPACK_FLIP_Y_WEBGL]: false
    },
    dataFormat: GL.RGBA,
    width: texWidth,
    height: texHeight
  });

  // const hpResults = getHistoPyramid(gl, {texture});
  // return hpResults.flatPyramidTexture;

  // return texture;
  return runKDE(gl, {texture});
}

function runKDE(gl, {texture}) {
  const vs = `\
#version 300 es
in vec4 inTexture;
out vec4 outTexture;

void main()
{
outTexture = inTexture;
gl_PointSize = 29.;
}
`;
  const fs_1 = `\
#version 300 es
in vec4 outTexture;
out vec4 transform_output;
void main()
{
  if (outTexture.r + outTexture.g + outTexture.b == 0.) {
    discard;
  }
  // transform_output.rg = (1.0 - gl_PointCoord) * (1.0 - gl_PointCoord) * 40.;
  //transform_output.rg = gl_PointCoord;
  transform_output.r = length(gl_PointCoord - vec2(0.5, 0.5));
  transform_output.ba = vec2(0., 1.);
}
`;

const fs = `\
#version 300 es
in vec4 outTexture;
out vec4 transform_output;
void main()
{
if (outTexture.r + outTexture.g + outTexture.b == 0.) {
  discard;
}
float dist = length(gl_PointCoord - vec2(0.5, 0.5));
if (dist > 0.5) {
  discard;
}
transform_output.rgb = outTexture.rgb * (0.5 - dist);
transform_output.a = 1.0;
}
`;

const {width, height} = texture;
const transform = new Transform(gl, {
  _sourceTextures: {
    inTexture: texture
  },
  _targetTexture: 'inTexture',
  _targetTextureVarying: 'outTexture',
  vs,
  fs,
  elementCount: width * height,
});

transform.run({
  parameters: {
    blend: true,
    depthTest: false,
    blendFunc: [GL.ONE, GL.ONE],
    blendEquation: GL.FUNC_ADD
  }
});
return transform._getTargetTexture();
}

const animationLoop = new AnimationLoop({
  debug: true,
  onInitialize({gl, canvas, aspect}) {
    setParameters(gl, {
      clearColor: [0, 0, 0, 1],
      clearDepth: [1],
      depthTest: true,
      depthFunc: gl.LEQUAL
    });

    const texture = getTextureToDisplay(gl);
    const texWidth = texture.width;
    const texHeight = texture.height;

    const cellSize = 3;
    const windowSize = [texWidth * cellSize, texHeight * cellSize];
    const gridSize = [texWidth, texHeight];

    const gridVertices = generateTriangleVerticesInRect([0, 0], [cellSize, cellSize]);
    const gridPositions = new Buffer(gl, {size: 2, data: new Float32Array(gridVertices)});

    const gridOffsetsData = generateOffsetsForGrid(windowSize, [cellSize, cellSize]);
    const gridOffsets = new Buffer(gl, {
      size: 2,
      data: new Float32Array(gridOffsetsData),
      instanced: 1
    });

    const girdTexRenderModel = new Model(gl, {
      id: 'GridTexture-Render- Model',
      vs: VERTEX_SHADER,
      fs: FRAGMENT_SHADER,
      attributes: {
        positions: gridPositions,
        offsets: gridOffsets
      },
      uniforms: {
        windowSize,
        cellSize,
        gridSize
      },
      isInstanced: 1,
      instanceCount: gridOffsetsData.length / 2,
      vertexCount: 4,
      drawMode: GL.TRIANGLE_STRIP
    });

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    girdTexRenderModel.draw({
      uniforms: {
        uSampler: texture
      },
      parameters: {
        blend: false
      }
    });
  }
});

animationLoop.getInfo = () => INFO_HTML;

export default animationLoop;

/* global window */
if (!window.website) {
  animationLoop.start();
}
