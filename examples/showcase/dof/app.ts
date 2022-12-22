/*
  Based on: https://github.com/tsherif/picogl.js/blob/master/examples/dof.html
  Original algorithm: http://www.nutty.ca/?page_id=352&link=depth_of_field
*/
// @ts-nocheck

import {glsl} from '@luma.gl/api';
import {makeAnimationLoop, AnimationLoopTemplate, AnimationProps, Model, CubeGeometry} from '@luma.gl/engine';
import {
  GL,
  Framebuffer,
  clear,
  Program,
  VertexArray,
  UniformBufferLayout,
  Buffer,
} from '@luma.gl/webgl-legacy';
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

const vs = glsl`\
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

const fs = glsl`\
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

class InstancedCube extends Model {
  count: number;
  xforms: any[];
  matrices: Float32Array;
  matrixBuffer: Buffer;

  constructor(gl, props) {
    const count = props.count;
    const xforms = new Array(count);
    const matrices = new Float32Array(count * 16);
    const matrixBuffer = new Buffer(gl, matrices.byteLength);

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

const DOF_VERTEX = glsl`\
#version 300 es
#define SHADER_NAME quad.vs

layout(location=0) in vec3 aPosition;

void main() {
    gl_Position = vec4(aPosition, 1.0);
}
`;

const DOF_FRAGMENT = glsl`\
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

let focalLength = 2.0;
let focusDistance = 3.0;
let fStop = 2.8;
const texelOffset = new Float32Array(2);

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = INFO_HTML;

  projMat = new Matrix4();
  viewMat = new Matrix4().lookAt({eye: [0, 0, 8]});

  instancedCubeTransforms = [];
  instancedCubes: InstancedCube;
  sceneFramebuffer: Framebuffer;
  dofFramebuffer: Framebuffer;
  quadVertexArray: VertexArray;
  dofProgram: Program;
  dofUniforms: Buffer;
  dofUniformsLayout: UniformBufferLayout;

  constructor({device}: AnimationProps) {
    super();
    if (!device.features.has('webgl2')) {
      throw new Error(ALT_TEXT);
    }

    // Create postprocessing pass program.

    this.dofUniformsLayout = new UniformBufferLayout({
      uDepthRange: GL.FLOAT_VEC2,
      uFocusDistance: GL.FLOAT,
      uBlurCoefficient: GL.FLOAT,
      uPPM: GL.FLOAT
    }).setUniforms({
      uDepthRange: [NEAR, FAR]
    });

    this.dofUniforms = device.createBuffer({
      target: GL.UNIFORM_BUFFER,
      data: this.dofUniformsLayout.getData(),
      accessor: {
        index: 0
      }
    });

    this.dofProgram = new Program(device, {
      id: 'DOF_PROGRAM',
      vs: DOF_VERTEX,
      fs: DOF_FRAGMENT,
      parameters: {
        depthWriteEnabled: true,
        depthCompare: 'less-equal'
      }
    });

    this.dofProgram.uniformBlockBinding(this.dofProgram.getUniformBlockIndex('DOFUniforms'), 0);

    // Set up frambuffers.

    // Need to ensure both color and depth targets can be sampled.
    this.sceneFramebuffer = new Framebuffer(device, {
      width: gl.drawingBufferWidth,
      height: gl.drawingBufferHeight,
      attachments: {
        [GL.COLOR_ATTACHMENT0]: device.createTexture({
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
        [GL.DEPTH_ATTACHMENT]: device.createTexture({
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
    this.dofFramebuffer = new Framebuffer(device, {
      width: gl.drawingBufferWidth,
      height: gl.drawingBufferHeight,
      depth: false
    });

    // Input handlers.

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

    const texture = device.createTexture({
      data: 'vis-logo.png',
      mipmaps: true,
      parameters: {
        [GL.TEXTURE_MAG_FILTER]: GL.LINEAR,
        [GL.TEXTURE_MIN_FILTER]: GL.LINEAR_MIPMAP_NEAREST
      }
    });

    // Create instanced model and initialize transform matrices.

    this.instancedCubes = new InstancedCube(device, {
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
        this.instancedCubeTransforms[cubeI] = {
          scale,
          translate,
          rotate,
          matrix: new Matrix4().translate(translate).rotateXYZ(rotate).scale(scale)
        };

        this.instancedCubes.matrices.set(this.instancedCubeTransforms[cubeI].matrix, cubeI * 16);
        ++cubeI;
      }
    }

    this.instancedCubes.updateMatrixBuffer();

    // Full-screen quad VAO for postprocessing
    // passes.

    this.quadVertexArray = new VertexArray(device, {
      program: this.dofProgram,
      attributes: {
        aPosition: device.createBuffer(new Float32Array(QUAD_VERTS))
      }
    });
  }

  override onRender({
    device,
    tick,
    width,
    height,
    aspect,
  }: AnimationProps) {
    const {gl} = device;
    // TODO
    this.sceneFramebuffer.resize(gl.drawingBufferWidth, gl.drawingBufferHeight);
    this.dofFramebuffer.resize(gl.drawingBufferWidth, gl.drawingBufferHeight);

    const magnification = focalLength / Math.max(0.1, Math.abs(focusDistance - focalLength));
    const blurCoefficient = (focalLength * magnification) / fStop;
    const ppm =
      Math.sqrt(
        gl.drawingBufferWidth * gl.drawingBufferWidth +
          gl.drawingBufferHeight * gl.drawingBufferHeight
      ) / 35;

    clear(gl, {color: [0, 0, 0, 1], depth: true, framebuffer: this.sceneFramebuffer});

    this.projMat.perspective({fov: radians(75), aspect, near: NEAR, far: FAR});
    this.viewMat.lookAt({eye: [3, 1.5, 3], center: [0, 0, 0], up: [0, 1, 0]});

    // Update model matrix data and then
    // update the attribute buffer./

    for (let i = 0; i < NUM_CUBES; ++i) {
      const box = this.instancedCubeTransforms[i];
      box.rotate[0] += 0.01;
      box.rotate[1] += 0.02;
      box.matrix.identity().translate(box.translate).rotateXYZ(box.rotate).scale(box.scale);
      this.instancedCubes.matrices.set(box.matrix, i * 16);
    }

    this.instancedCubes.updateMatrixBuffer();

    // Draw cubes to scene framebuffer.

    this.instancedCubes.draw({
      uniforms: {
        uProjection: this.projMat,
        uView: this.viewMat
      },
      framebuffer: this.sceneFramebuffer
    });

    // Apply DOF

    // Horizontal DOF blur
    clear(device, {color: [0, 0, 0, 1], framebuffer: this.dofFramebuffer});

    // texelOffset determines the direction of the blur
    texelOffset[0] = 1;
    texelOffset[1] = 0;

    this.dofUniformsLayout.setUniforms({
      uFocusDistance: focusDistance,
      uBlurCoefficient: blurCoefficient,
      uPPM: ppm
    });

    this.dofUniforms.setData(this.dofUniformsLayout.getData());

    this.dofUniforms.bind();

    this.dofProgram.setUniforms({
      uTexelOffset: texelOffset,
      uColor: this.sceneFramebuffer.color,
      uDepth: this.sceneFramebuffer.depth
    });

    this.dofProgram.draw({
      vertexArray: this.quadVertexArray,
      drawMode: gl.TRIANGLE_STRIP,
      vertexCount: 4,
      framebuffer: this.dofFramebuffer
    });

    // Vertical DOF blur
    clear(device, {color: [0, 0, 0, 1]});

    texelOffset[0] = 0;
    texelOffset[1] = 1;

    this.dofProgram.setUniforms({
      uTexelOffset: texelOffset,
      uColor: this.sceneFramebuffer.color,
      uDepth: this.sceneFramebuffer.depth
    });

    this.dofProgram.draw({
      vertexArray: this.quadVertexArray,
      drawMode: GL.TRIANGLE_STRIP,
      vertexCount: 4
    });

    this.dofUniforms.unbind();
  }
}

// @ts-ignore
if (typeof window !== 'undefined' && !window.website) {
  makeAnimationLoop(AppAnimationLoopTemplate).start();
}
