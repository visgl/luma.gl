/*
  Based on: https://github.com/tsherif/picogl.js/blob/master/examples/dof.html
  Original algorithm: http://www.nutty.ca/?page_id=352&link=depth_of_field
*/

/* eslint-disable spaced-comment */
import GL from '@luma.gl/constants';
import {AnimationLoop, Model, CubeGeometry} from '@luma.gl/engine';
import {
  Framebuffer,
  clear,
  Program,
  Texture2D,
  VertexArray,
  UniformBufferLayout,
  Buffer
} from '@luma.gl/webgl';
import {setParameters, isWebGL2} from '@luma.gl/gltools';
import {Matrix4, radians} from '@math.gl/core';

const INFO_HTML = `
<p>
  <b>Depth of Field</b>.
<p>
Several instanced luma.gl <code>Cubes</code> rendered with a Depth of Field
post-processing effect.

<div>
  <label>Focal Length</label><input type="range" id="focal-length" min="0.1" max="10.0" step="0.1">
</div>
<div>
  <label>Focus Distance</label><input type="range" id="focus-distance" min="0.1" max="10.0" step="0.1">
</div>
<div>
  <label>F-Stop</label><input type="range" id="f-stop" min="0.1" max="10.0" step="0.1">
</div>

`;

const ALT_TEXT = "THIS DEMO REQUIRES WEBGL 2, BUT YOUR BROWSER DOESN'T SUPPORT IT";

const QUAD_VERTS = [1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0]; // eslint-disable-line
const NUM_ROWS = 5;
const CUBES_PER_ROW = 20;
const NUM_CUBES = CUBES_PER_ROW * NUM_ROWS;
const NEAR = 0.1;
const FAR = 30.0;

let focalLength = 2.0;
let focusDistance = 3.0;
let fStop = 2.8;
const texelOffset = new Float32Array(2);

class InstancedCube extends Model {
  constructor(gl, props) {
    const count = props.count;
    const xforms = new Array(count);
    const matrices = new Float32Array(count * 16);
    const matrixBuffer = new Buffer(gl, matrices.byteLength);

    const vs = `\
#version 300 es
#define SHADER_NAME scene.vs

in vec3 positions;
in vec3 normals;
in vec2 texCoords;
in vec4 modelMatCol1;
in vec4 modelMatCol2;
in vec4 modelMatCol3;
in vec4 modelMatCol4;

uniform mat4 uView;
uniform mat4 uProjection;
out vec3 vNormal;
out vec2 vUV;

void main(void) {
  mat4 modelMat = mat4(
    modelMatCol1,
    modelMatCol2,
    modelMatCol3,
    modelMatCol4
  );
  gl_Position = uProjection * uView * modelMat * vec4(positions, 1.0);
  vNormal = vec3(modelMat * vec4(normals, 0.0));
  vUV = texCoords;
}
`;
    const fs = `\
#version 300 es
precision highp float;
#define SHADER_NAME scene.fs

in vec3 vNormal;
in vec2 vUV;
uniform sampler2D uTexture;

out vec4 fragColor;
void main(void) {
  float d = clamp(dot(normalize(vNormal), normalize(vec3(1.0, 1.0, 0.2))), 0.0, 1.0);
  fragColor.rgb = texture(uTexture, vec2(vUV.x, 1.0 - vUV.y)).rgb * (d + 0.1);
  fragColor.a = 1.0;
}
`;

    super(
      gl,
      Object.assign({geometry: new CubeGeometry()}, props, {
        vs,
        fs,
        isInstanced: 1,
        instanceCount: count,
        uniforms: {
          uTexture: props.uniforms.uTexture
        },
        attributes: {
          // Attributes are limited to 4 components,
          // So we have to split the matrices across
          // 4 attributes. They're reconstructed in
          // the vertex shader.
          modelMatCol1: {
            buffer: matrixBuffer,
            size: 4,
            stride: 64,
            offset: 0,
            divisor: 1
          },
          modelMatCol2: {
            buffer: matrixBuffer,
            size: 4,
            stride: 64,
            offset: 16,
            divisor: 1
          },
          modelMatCol3: {
            buffer: matrixBuffer,
            size: 4,
            stride: 64,
            offset: 32,
            divisor: 1
          },
          modelMatCol4: {
            buffer: matrixBuffer,
            size: 4,
            stride: 64,
            offset: 48,
            divisor: 1
          }
        }
      })
    );

    this.count = count;
    this.xforms = xforms;
    this.matrices = matrices;
    this.matrixBuffer = matrixBuffer;
  }

  updateMatrixBuffer() {
    this.matrixBuffer.setData(this.matrices);
  }
}

const DOF_VERTEX = `\
#version 300 es
#define SHADER_NAME quad.vs

layout(location=0) in vec3 aPosition;

void main() {
    gl_Position = vec4(aPosition, 1.0);
}
`;

const DOF_FRAGMENT = `\
#version 300 es
precision highp float;
#define SHADER_NAME dof.fs

#define MAX_BLUR 20.0

uniform DOFUniforms {
  vec2  uDepthRange;
  float uFocusDistance;
  float uBlurCoefficient;
  float uPPM;
};

uniform vec2 uTexelOffset;

uniform sampler2D uColor;
uniform sampler2D uDepth;

out vec4 fragColor;

void main() {
    ivec2 fragCoord = ivec2(gl_FragCoord.xy);
    ivec2 resolution = textureSize(uColor, 0) - 1;

    // Convert to linear depth
    float ndc = 2.0 * texelFetch(uDepth, fragCoord, 0).r - 1.0;
    float depth = -(2.0 * uDepthRange.y * uDepthRange.x) / (ndc * (uDepthRange.y - uDepthRange.x) - uDepthRange.y - uDepthRange.x);
    float deltaDepth = abs(uFocusDistance - depth);

    // Blur more quickly in the foreground.
    float xdd = depth < uFocusDistance ? abs(uFocusDistance - deltaDepth) : abs(uFocusDistance + deltaDepth);
    float blurRadius = min(floor(uBlurCoefficient * (deltaDepth / xdd) * uPPM), MAX_BLUR);

    vec4 color = vec4(0.0);
    if (blurRadius > 1.0) {
        float halfBlur = blurRadius * 0.5;

        float count = 0.0;

        for (float i = 0.0; i <= MAX_BLUR; ++i) {
            if (i > blurRadius) {
                break;
            }

            // texelFetch outside texture gives vec4(0.0) (undefined in ES 3)
            ivec2 sampleCoord = clamp(fragCoord + ivec2(((i - halfBlur) * uTexelOffset)), ivec2(0), resolution);
            color += texelFetch(uColor, sampleCoord, 0);

            ++count;
        }

        color /= count;
    } else {
        color = texelFetch(uColor, fragCoord, 0);
    }

    fragColor = color;
}
`;

export default class AppAnimationLoop extends AnimationLoop {
  static getInfo() {
    return INFO_HTML;
  }

  onInitialize({gl}) {
    this.demoNotSupported = !isWebGL2(gl);
    if (this.demoNotSupported) {
      return {};
    }

    setParameters(gl, {
      depthTest: true,
      depthFunc: GL.LEQUAL
    });

    const projMat = new Matrix4();
    const viewMat = new Matrix4().lookAt({eye: [0, 0, 8]});

    ///////////////////////////////////////
    // Create postprocessing pass program.
    ///////////////////////////////////////

    const dofUniformsLayout = new UniformBufferLayout({
      uDepthRange: gl.FLOAT_VEC2,
      uFocusDistance: gl.FLOAT,
      uBlurCoefficient: gl.FLOAT,
      uPPM: gl.FLOAT
    }).setUniforms({
      uDepthRange: [NEAR, FAR]
    });

    const dofUniforms = new Buffer(gl, {
      target: GL.UNIFORM_BUFFER,
      data: dofUniformsLayout.getData(),
      accessor: {
        index: 0
      }
    });

    const dofProgram = new Program(gl, {
      id: 'DOF_PROGRAM',
      vs: DOF_VERTEX,
      fs: DOF_FRAGMENT
    });

    dofProgram.uniformBlockBinding(dofProgram.getUniformBlockIndex('DOFUniforms'), 0);

    //////////////////////
    // Set up frambuffers.
    //////////////////////

    // Need to ensure both color and depth targets can be sampled.
    const sceneFramebuffer = new Framebuffer(gl, {
      width: gl.drawingBufferWidth,
      height: gl.drawingBufferHeight,
      attachments: {
        [GL.COLOR_ATTACHMENT0]: new Texture2D(gl, {
          format: GL.RGBA,
          type: GL.UNSIGNED_BYTE,
          width: gl.drawingBufferWidth,
          height: gl.drawingBufferHeight,
          mipmaps: false,
          parameters: {
            [GL.TEXTURE_MIN_FILTER]: GL.LINEAR,
            [GL.TEXTURE_MAG_FILTER]: GL.LINEAR,
            [GL.TEXTURE_WRAP_S]: GL.CLAMP_TO_EDGE,
            [GL.TEXTURE_WRAP_T]: GL.CLAMP_TO_EDGE
          }
        }),
        [GL.DEPTH_ATTACHMENT]: new Texture2D(gl, {
          format: GL.DEPTH_COMPONENT16,
          type: GL.UNSIGNED_SHORT,
          dataFormat: GL.DEPTH_COMPONENT,
          width: gl.drawingBufferWidth,
          height: gl.drawingBufferHeight,
          mipmaps: false,
          parameters: {
            [GL.TEXTURE_MIN_FILTER]: GL.NEAREST,
            [GL.TEXTURE_MAG_FILTER]: GL.NEAREST,
            [GL.TEXTURE_WRAP_S]: GL.CLAMP_TO_EDGE,
            [GL.TEXTURE_WRAP_T]: GL.CLAMP_TO_EDGE
          }
        })
      }
    });

    // Postprocessing FBO doesn't need a depth attachment.
    const dofFramebuffer = new Framebuffer(gl, {
      width: gl.drawingBufferWidth,
      height: gl.drawingBufferHeight,
      depth: false
    });

    /////////////////////
    // Input handlers.
    /////////////////////

    const focalLengthInput = document.getElementById('focal-length');
    const focusDistanceInput = document.getElementById('focus-distance');
    const fStopInput = document.getElementById('f-stop');

    if (focalLengthInput) {
      // @ts-ignore
      focalLengthInput.value = focalLength;
      focalLengthInput.addEventListener('input', () => {
        // @ts-ignore
        focalLength = parseFloat(focalLengthInput.value);
      });

      // @ts-ignore
      focusDistanceInput.value = focusDistance;
      focusDistanceInput.addEventListener('input', () => {
        // @ts-ignore
        focusDistance = parseFloat(focusDistanceInput.value);
      });

      // @ts-ignore
      fStopInput.value = fStop;
      fStopInput.addEventListener('input', () => {
        // @ts-ignore
        fStop = parseFloat(fStopInput.value);
      });
    }

    const texture = new Texture2D(gl, {
      data: 'vis-logo.png',
      mipmaps: true,
      parameters: {
        [gl.TEXTURE_MAG_FILTER]: gl.LINEAR,
        [gl.TEXTURE_MIN_FILTER]: gl.LINEAR_MIPMAP_NEAREST
      }
    });

    /////////////////////////////////////////////////////
    // Create instanced model and initialize transform matrices.
    /////////////////////////////////////////////////////

    const instancedCubes = new InstancedCube(gl, {
      count: NUM_CUBES,
      uniforms: {
        uTexture: texture
      }
    });

    let cubeI = 0;
    for (let j = 0; j < NUM_ROWS; ++j) {
      const rowOffset = j - Math.floor(NUM_ROWS / 2);
      for (let i = 0; i < CUBES_PER_ROW; ++i) {
        const scale = [0.4, 0.4, 0.4];
        const rotate = [-Math.sin(i * 18.23) * Math.PI, 0, Math.cos(i * 11.27) * Math.PI];
        const translate = [-i + 2 - rowOffset, 0, -i + 2 + rowOffset];
        instancedCubes.xforms[cubeI] = {
          scale,
          translate,
          rotate,
          matrix: new Matrix4().translate(translate).rotateXYZ(rotate).scale(scale)
        };

        instancedCubes.matrices.set(instancedCubes.xforms[cubeI].matrix, cubeI * 16);
        ++cubeI;
      }
    }

    instancedCubes.updateMatrixBuffer();

    /////////////////////////////////////////////
    // Full-screen quad VAO for postprocessing
    // passes.
    /////////////////////////////////////////////

    const quadVertexArray = new VertexArray(gl, {
      program: dofProgram,
      attributes: {
        aPosition: new Buffer(gl, new Float32Array(QUAD_VERTS))
      }
    });

    return {
      projMat,
      viewMat,
      instancedCubes,
      sceneFramebuffer,
      dofFramebuffer,
      quadVertexArray,
      dofProgram,
      dofUniforms,
      dofUniformsLayout
    };
  }

  onRender({
    gl,
    tick,
    width,
    height,
    aspect,
    projMat,
    viewMat,
    instancedCubes,
    sceneFramebuffer,
    dofFramebuffer,
    quadVertexArray,
    dofProgram,
    dofUniforms,
    dofUniformsLayout
  }) {
    if (this.demoNotSupported) {
      return;
    }

    sceneFramebuffer.resize(gl.drawingBufferWidth, gl.drawingBufferHeight);
    dofFramebuffer.resize(gl.drawingBufferWidth, gl.drawingBufferHeight);

    const magnification = focalLength / Math.max(0.1, Math.abs(focusDistance - focalLength));
    const blurCoefficient = (focalLength * magnification) / fStop;
    const ppm =
      Math.sqrt(
        gl.drawingBufferWidth * gl.drawingBufferWidth +
          gl.drawingBufferHeight * gl.drawingBufferHeight
      ) / 35;

    clear(gl, {color: [0, 0, 0, 1], depth: true, framebuffer: sceneFramebuffer});

    projMat.perspective({fov: radians(75), aspect, near: NEAR, far: FAR});
    viewMat.lookAt({eye: [3, 1.5, 3], center: [0, 0, 0], up: [0, 1, 0]});

    ////////////////////////////////////////
    // Update model matrix data and then
    // update the attribute buffer.
    ////////////////////////////////////////

    for (let i = 0; i < NUM_CUBES; ++i) {
      const box = instancedCubes.xforms[i];
      box.rotate[0] += 0.01;
      box.rotate[1] += 0.02;
      box.matrix.identity().translate(box.translate).rotateXYZ(box.rotate).scale(box.scale);
      instancedCubes.matrices.set(box.matrix, i * 16);
    }

    instancedCubes.updateMatrixBuffer();

    ////////////////////////////////////
    // Draw cubes to scene framebuffer.
    ////////////////////////////////////

    instancedCubes.draw({
      uniforms: {
        uProjection: projMat,
        uView: viewMat
      },
      framebuffer: sceneFramebuffer
    });

    /////////////////
    // Apply DOF
    /////////////////

    // Horizontal DOF blur
    clear(gl, {color: [0, 0, 0, 1], framebuffer: dofFramebuffer});

    // texelOffset determines the direction of the blur
    texelOffset[0] = 1;
    texelOffset[1] = 0;

    dofUniformsLayout.setUniforms({
      uFocusDistance: focusDistance,
      uBlurCoefficient: blurCoefficient,
      uPPM: ppm
    });

    dofUniforms.setData(dofUniformsLayout.getData());

    dofUniforms.bind();

    dofProgram.setUniforms({
      uTexelOffset: texelOffset,
      uColor: sceneFramebuffer.color,
      uDepth: sceneFramebuffer.depth
    });

    dofProgram.draw({
      vertexArray: quadVertexArray,
      drawMode: gl.TRIANGLE_STRIP,
      vertexCount: 4,
      framebuffer: dofFramebuffer
    });

    // Vertical DOF blur
    clear(gl, {color: [0, 0, 0, 1]});

    texelOffset[0] = 0;
    texelOffset[1] = 1;

    dofProgram.setUniforms({
      uTexelOffset: texelOffset,
      uColor: sceneFramebuffer.color,
      uDepth: sceneFramebuffer.depth
    });

    dofProgram.draw({
      vertexArray: quadVertexArray,
      drawMode: gl.TRIANGLE_STRIP,
      vertexCount: 4
    });

    dofUniforms.unbind();
  }

  getAltText() {
    return ALT_TEXT;
  }
}

// @ts-ignore
if (typeof window !== 'undefined' && !window.website) {
  const animationLoop = new AppAnimationLoop();
  animationLoop.start();
}
