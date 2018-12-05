import {AnimationLoop, Model, Texture2D, Buffer, setParameters, getHistoPyramid} from 'luma.gl';
import GL from 'luma.gl/constants';

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
  // gl_FragColor.r = 1.0;
}
`;
const MARGIN = 0.2; // pixels

function generateTriangleVerticesInRect(start, end) {
  const startX = start[0] + MARGIN;
  const startY = start[1] + MARGIN;
  const endX = end[0] - MARGIN;
  const endY = end[1] - MARGIN;

  // [1, 1,  -1, 1,  1, -1,  -1, -1];
  // [1, 1,  -1, 1,  1, -1,  -1, -1]
  return [endX, endY,  startX, endY,  endX, startY, startX, startY];
}

function generateOffsetsForGrid(windowSize, cellSize) {

  const offsets = [];
  for (let x = 0; x < windowSize[0]; x = x + cellSize[0]) {
    for (let y = 0; y < windowSize[1]; y = y + cellSize[1]) {
      // const newPoints = generateTriangleVerticesInRect([x, y], [x + cellSize[0], y + cellSize[1]]);
      offsets.push(x, y);
    }
  }
  return offsets;
}

function getTextureToDisplay(gl) {
  const texWidth = 32;
  const texHeight = 32;

  // const textureData = new Float32Array([
  //   1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
  //   0, 0, 0, 0,  2, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
  //   0, 0, 0, 0,  0, 0, 0, 0,  3, 0, 0, 0,  0, 0, 0, 0,
  //   0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  4, 0, 0, 0
  // ]).map(x => x / 10);

  const pixelCount = texWidth * texHeight;
  const textureData = new Float32Array(pixelCount * 4);
  for (let i = 0; i < pixelCount; i++) {
    textureData[i * 4] = Math.random() / 15;
  }

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
    dataFormat: GL.RGBA,
    width: texWidth,
    height: texHeight,
  });

  const hpResults = getHistoPyramid({gl, texture});
  // return hpResults.pyramidTextures[2]; // TODO- not working for 1X1, when updated shader to hard coded color
  return hpResults.flatPyramidTexture;
  // -here-
  // given hard coded color is working texture write is ok
  // texture sample must be bad. verify texture co-ordinate generation when rendering to 1 X 1 texture
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
    const gridOffsets = new Buffer(gl, {size: 2, data: new Float32Array(gridOffsetsData), instanced: 1});

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
      vertexCount: 4, // gridVertices.length / 2,
      drawMode: GL.TRIANGLE_STRIP // GL.LINE_STRIP // TRIANGLE_STRIP
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
