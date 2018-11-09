import GL from 'luma.gl/constants';
import {AnimationLoop, Framebuffer, Cube, setParameters, clear, CubeGeometry, Model, Program, Texture2D, VertexArray, Buffer, loadTextures} from 'luma.gl';
import {Matrix4, radians} from 'math.gl';

/*
  Based on: https://github.com/tsherif/picogl.js/blob/master/examples/dof.html
  Origirnal algorithm: http://www.nutty.ca/?page_id=352&link=depth_of_field 
*/

const INFO_HTML = `
<p>
  <b>Depth of Field</b>.
<p>
Several instanced luma.gl <code>Cubes</code> rendered with a Depth of Field 
post-processing effect.
`;

const DOF_VERTEX = `\
#version 300 es
#define SHADER_NAME quad.vs

layout(location=0) in vec3 aPosition;

void main() {
    gl_Position = vec4(aPosition, 1.0);
}
`;

const DOF_FRAGMENT=`\
#version 300 es
precision highp float;
#define SHADER_NAME dof.fs

#define MAX_BLUR 20.0

uniform vec2  uDepthRange; 
uniform float uFocusDistance;
uniform float uBlurCoefficient;
uniform float uPPM;

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
`
const QUAD_VERTS = [1, 1, 0,  -1, 1, 0,  1, -1, 0,  -1, -1, 0]; // eslint-disable-line
const NUM_ROWS = 5;
const CUBES_PER_ROW = 20;
const NUM_CUBES = CUBES_PER_ROW * NUM_ROWS;
const NEAR = 0.1;
const FAR = 10.0;
const FOCAL_LENGTH = 2.0;
const FOCUS_DISTANCE = 3.0;
const MAGNIFICATION = FOCAL_LENGTH / Math.abs(FOCUS_DISTANCE - FOCAL_LENGTH);
const FSTOP = 2.8;
const BLUR_COEFFICIENT = FOCAL_LENGTH * MAGNIFICATION / FSTOP;

let texelOffset = new Float32Array(2);

class InstancedCube extends Cube {

  constructor(gl, props) {

    let count = props.count;
    let xforms = new Array(count);
    let matrices = new Float32Array(count * 16);
    let matrixBuffer = new Buffer(gl, matrices.byteLength);

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
  fragColor.rgb = texture(uTexture, vUV).rgb * (d + 0.1);
  fragColor.a = 1.0;
}
`;

    super(gl, Object.assign({}, props, {
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
    }));

    this.count = count;
    this.xforms = xforms;
    this.matrices = matrices;
    this.matrixBuffer = matrixBuffer;
  }

  updateMatrixBuffer() {
    this.matrixBuffer.setData(this.matrices);
  }
}

export const animationLoopOptions = {
  onInitialize: ({gl}) => {

    setParameters(gl, {
      depthTest: true,
      depthFunc: GL.LEQUAL
    });

    const PPM = Math.sqrt(gl.drawingBufferWidth * gl.drawingBufferWidth + gl.drawingBufferHeight * gl.drawingBufferHeight) / 35;   
    const projMat = new Matrix4();
    const viewMat = new Matrix4().lookAt({eye: [0, 0, 8]});

    ////////////////////////////
    // Create programs
    ////////////////////////////

    const dofProgram = new Program(gl, {
      id: "DOF_PROGRAM",
      vs: DOF_VERTEX,
      fs: DOF_FRAGMENT,
      uniforms: {
        uDepthRange: [NEAR, FAR],
        uFocusDistance: FOCUS_DISTANCE,
        uBlurCoefficient: BLUR_COEFFICIENT,
        uPPM: PPM
      },
    });


    ////////////////////////////////////////////////
    // Set up frambuffers. 
    ////////////////////////////////////////////////

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
    })

    // Postprocessing FBO doesn't need a depth attachment.
    const dofFramebuffer = new Framebuffer(gl, { width: gl.drawingBufferWidth, height: gl.drawingBufferHeight, depth: false});

    return loadTextures(gl, {
      urls: ['webgl-logo.png'],
      mipmaps: true,
      parameters: {
        [gl.TEXTURE_MAG_FILTER]: gl.LINEAR,
        [gl.TEXTURE_MIN_FILTER]: gl.LINEAR_MIPMAP_NEAREST
      }
    }).then((textures) => {

      ////////////////////////////////////////////
      // Set up instanced model to draw boxes.
      ////////////////////////////////////////////

      const instancedCubes = new InstancedCube(gl, {
        count: NUM_CUBES,
        uniforms: {
          uTexture: textures[0]
        }
      });

      let cubeI = 0;
      for (let j = 0; j < NUM_ROWS; ++j) {
          let rowOffset = (j - Math.floor(NUM_ROWS / 2));
          for (let i = 0; i < CUBES_PER_ROW; ++i) {
            let scale = [0.4, 0.4, 0.4];
            let rotate = [-Math.random() * Math.PI, 0, Math.random() * Math.PI];
            let translate = [-i + 2 - rowOffset, 0, -i + 2 + rowOffset];
            instancedCubes.xforms[cubeI] = {
              scale: scale,
              translate: translate,
              rotate: rotate,
              matrix: new Matrix4().translate(translate).rotateXYZ(rotate).scale(scale)
            };
              
            instancedCubes.matrices.set(instancedCubes.xforms[cubeI].matrix, cubeI * 16);
          ++cubeI;
          }
      }

      instancedCubes.updateMatrixBuffer();

      const quadVertexArray = new VertexArray(gl, {
        program: dofProgram,
        attributes: {
          aPosition: new Buffer(gl, new Float32Array(QUAD_VERTS))
        }
      });

      return {
        instancedCubes,
        sceneFramebuffer,
        dofFramebuffer,
        quadVertexArray,
        dofProgram
      };
    });
  },

  onRender: ({gl, tick, width, height, aspect, instancedCubes, sceneFramebuffer, dofFramebuffer, quadVertexArray, dofProgram}) => {

    sceneFramebuffer.resize(gl.drawingBufferWidth, gl.drawingBufferHeight);
    dofFramebuffer.resize(gl.drawingBufferWidth, gl.drawingBufferHeight);

    clear(gl, {color: [0, 0, 0, 1], depth: true, framebuffer: sceneFramebuffer});

    const camView = new Matrix4().lookAt({eye: [3, 1.5, 3], center: [0, 0, 0], up: [0, 1, 0]});
    const camProj = new Matrix4().perspective({fov: radians(75), aspect, near: NEAR, far: FAR});

    ////////////////////////////////////////
    // Update model matrix data and then
    // update the attribute buffer
    ////////////////////////////////////////

    for (let i = 0; i < NUM_CUBES; ++i) {
      let box = instancedCubes.xforms[i];
      box.rotate[0] += 0.01;
      box.rotate[1] += 0.02;
      box.matrix.identity().translate(box.translate).rotateXYZ(box.rotate).scale(box.scale);
      instancedCubes.matrices.set(box.matrix, i * 16);
    }

    instancedCubes.updateMatrixBuffer();

    ////////////////////////////////////
    // Draw boxes to main framebuffer
    ////////////////////////////////////

    instancedCubes.draw({
      uniforms: {
        uView: camView,
        uProjection: camProj
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
  }
};

const animationLoop = new AnimationLoop(animationLoopOptions);

animationLoop.getInfo = () => INFO_HTML;

export default animationLoop;

/* global window */
if (typeof window !== 'undefined' && !window.website) {
  animationLoop.start();
}
