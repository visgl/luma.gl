import GL from '@luma.gl/constants';
import {AnimationLoop, loadTextures, Model, Buffer, setParameters, Transform} from 'luma.gl';
import {Matrix4} from 'math.gl';
import {addEvents} from 'luma.gl/addons';

export const INFO_HTML = `
<p>
Texture processing using Transform API.
`;

const VERTEX_SHADER = `\
attribute vec3 positions;
attribute vec2 texCoords;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

varying vec2 vTextureCoord;
void main(void) {
  gl_Position = uPMatrix * uMVMatrix * vec4(positions, 1.0);
  vTextureCoord = texCoords;
}
`;

const FRAGMENT_SHADER = `\
precision highp float;

varying vec2 vTextureCoord;

uniform sampler2D uSampler;

void main(void) {
  gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
}
`;

const EDGE_SHADER_2 = `\
#version 300 es
in vec4 inTexture;
out vec4 outTexture;
uniform float factor;

void main()
{
  vec2 texCoord = transform_getTexCoord(transform_uSize_inTexture);
  vec2 pixelOffset = vec2(1., 1.) / transform_uSize_inTexture;

  mat3 kernelX = mat3(
    1., 0, -1.,
    2., 0., -2.,
    1., 0, -1
  );
  mat3 kernelY = mat3(
    1., 2., 1.,
    0, 0, 0,
    -1., -2., -1
  );
  mat3 kernel = mat3(
    -1., -1., -1.,
    -1., 8., -1.,
    -1., -1, -1
  );
  vec4 colorXY = vec4(0);
  vec4 colorX = vec4(0);
  vec4 colorY = vec4(0);
  for (int i = -1; i < 2; i++) {
    for (int j = -1; j < 2; j++) {
      vec2 coord = texCoord + vec2(i, j) * pixelOffset;
      vec4 color = texture(transform_uSampler_inTexture, coord);
      colorX = colorX + color * kernelX[i+1][j+1];
      colorY = colorY + color * kernelY[i+1][j+1];
      colorXY = colorXY + color * kernel[i+1][j+1];
    }
  }
  // vec4 filteredColor = colorY; // sqrt(colorX * colorX + colorY * colorY);
  vec4 filteredColor = sqrt(colorX * colorX + colorY * colorY);
  filteredColor.a = 1.0;
  outTexture = filteredColor;
}
`;

const keyCount = {value: 0};

/* eslint-disable no-multi-spaces */
const animationLoop = new AnimationLoop({
  onInitialize({canvas, gl}) {
    addKeyboardHandler(canvas);

    const SQUARE_VERTS =    [1, 1, 0,  -1, 1, 0,  1, -1, 0,  -1, -1, 0];
    const SQUARE_TEXCOORD = [1, 1,      0, 1,     1,  0,      0, 0];

    setParameters(gl, {
      clearColor: [0, 0, 0, 1],
      clearDepth: 1,
      depthTest: true,
      depthFunc: GL.LEQUAL,
      [GL.UNPACK_FLIP_Y_WEBGL]: true
    });

    return loadTextures(gl, {
      urls: ['v.png', 'nehe.gif', 'hills.jpeg', 'monolisa.jpeg'],
      parameters: {
        mipmaps: false
      }
    })
    .then(textures => ({
      square: new Model(gl, {
        vs: VERTEX_SHADER,
        fs: FRAGMENT_SHADER,
        attributes: {
          positions: new Buffer(gl, new Float32Array(SQUARE_VERTS)),
          texCoords: new Buffer(gl, new Float32Array(SQUARE_TEXCOORD))
        },
        uniforms: {uSampler: textures[0]},
        drawMode: gl.TRIANGLE_STRIP,
        vertexCount: 4
      }),
      textures,
      transform: new Transform(gl, {
        _sourceTextures: {
          inTexture: textures[0]
        },
        _targetTextureVarying: 'outTexture',
        _targetTexture: 'inTexture',
        vs: EDGE_SHADER_2,
        elementCount: textures[0].width * textures[0].height
      })
    }));
  },
  onRender({gl, canvas, tick, aspect, square, textures, transform}) {

    const textureIndex = keyCount.value % textures.length;

    transform.update({_sourceTextures: {inTexture: textures[textureIndex]}});

    gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
    const factor = (tick % 200) / 100 - 1.0;
    transform.run({
      uniforms: {factor}
    });
    const showEdges = (tick % 100) > 50;
    const updatedTexture = showEdges ? transform._getTargetTexture() : textures[textureIndex];
    square.render({
      uSampler: updatedTexture,
      uPMatrix: new Matrix4().perspective({aspect}),
      uMVMatrix: new Matrix4()
        .lookAt({eye: [0, 0, 0]})
        .translate([0, 0, -3])
    });
  }
});

animationLoop.getInfo = () => INFO_HTML;

function addKeyboardHandler(canvas) {
  addEvents(canvas, {
    onKeyDown(e) {
      keyCount.value++;
    }
  });
}

export default animationLoop;

/* global window */
if (!window.website) {
  animationLoop.start();
}
