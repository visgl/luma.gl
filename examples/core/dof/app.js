import GL from 'luma.gl/constants';
import {AnimationLoop, Framebuffer, Cube, setParameters, clear, CubeGeometry, Model, Program, Texture2D, VertexArray, Buffer} from 'luma.gl';
import {Matrix4, radians} from 'math.gl';

const INFO_HTML = `
<p>
  Simple <b>shadow mapping</b>.
<p>
A luma.gl <code>Cube</code>, rendering into a shadowmap framebuffer
and then rendering onto the screen.
`;

const SCENE_FRAGMENT = `\
#version 300 es
precision highp float;
in vec3 normal;

out vec4 fragColor;
void main(void) {
  float d = clamp(dot(normalize(normal), normalize(vec3(1.0, 1.0, 0.2))), 0.0, 1.0);
  fragColor.rgb = vec3(0.1, 0.1, 1.0) * d + 0.1;
  fragColor.a = 1.0;
}
`;

const SCENE_VERTEX = `\
#version 300 es
#define SHADER_NAME scene.vs

layout(location=0) in vec3 positions;
layout(location=1) in vec3 normals;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;
out vec3 normal;

void main(void) {
  gl_Position = uProjection * uView * uModel * vec4(positions, 1.0);
  normal = vec3(uModel * vec4(normals, 0.0));
}
`;

const QUAD_VERTEX = `\
#version 300 es

layout(location=0) in vec4 aPosition;

void main() {
    gl_Position = aPosition;
}
`;

const DOF_FRAGMENT=`\
#version 300 es
precision highp float;

layout(std140, column_major) uniform;

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

const NUM_ROWS = 5;
const BOXES_PER_ROW = 5;
const NUM_BOXES = BOXES_PER_ROW * NUM_ROWS;
const NEAR = 0.1;
const FAR = 10.0;
const FOCAL_LENGTH = 1.0;
const FOCUS_DISTANCE = 2.0;
const MAGNIFICATION = FOCAL_LENGTH / Math.abs(FOCUS_DISTANCE - FOCAL_LENGTH);
const FSTOP = 2.8;
const BLUR_COEFFICIENT = FOCAL_LENGTH * MAGNIFICATION / FSTOP;

let texelOffset = new Float32Array(2);

export const animationLoopOptions = {
  onInitialize: ({gl}) => {

    let cubeGeo = new CubeGeometry();

    setParameters(gl, {
      depthTest: true,
      depthFunc: GL.LEQUAL
    });

    const QUAD_VERTS = [1, 1, 0,  -1, 1, 0,  1, -1, 0,  -1, -1, 0]; // eslint-disable-line
    const PPM = Math.sqrt(gl.drawingBufferWidth * gl.drawingBufferWidth + gl.drawingBufferHeight * gl.drawingBufferHeight) / 35;   

    const projMat = new Matrix4();
    const viewMat = new Matrix4().lookAt({eye: [0, 0, 8]});

    const sceneProgram = new Program(gl, {
      vs: SCENE_VERTEX,
      fs: SCENE_FRAGMENT
    });

    const dofProgram = new Program(gl, {
      vs: QUAD_VERTEX,
      fs: DOF_FRAGMENT,
      uniforms: {
        uDepthRange: [0.1, 30],
        uFocusDistance: FOCUS_DISTANCE,
        uBlurCoefficient: BLUR_COEFFICIENT,
        uPPM: PPM
      },
    });

    let boxes = new Array(NUM_BOXES);
    let boxI = 0;
    for (let j = 0; j < NUM_ROWS; ++j) {
        let rowOffset = (j - Math.floor(NUM_ROWS / 2));
        for (let i = 0; i < BOXES_PER_ROW; ++i) {
            boxes[boxI] = new Model(gl, { 
              geometry: cubeGeo, 
              program: sceneProgram,
            });
            boxes[boxI].setScale([0.4, 0.4, 0.4]);
            boxes[boxI].setRotation([-boxI / Math.PI, 0, boxI / Math.PI]);
            boxes[boxI].setPosition([-i + 2 - rowOffset, 0, -i + 2 + rowOffset]);
            boxes[boxI].updateMatrix();
            ++boxI;
        }
    }

    const quadVertexArray = new VertexArray(gl, {
      dofProgram,
      attributes: {
        positions: new Buffer(gl, new Float32Array(QUAD_VERTS))
      },

    });

    let mainFramebuffer = new Framebuffer(gl, {
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

    let dofFramebuffer = new Framebuffer(gl, { width: gl.drawingBufferWidth, height: gl.drawingBufferHeight, depth: false});

    return {
      boxes,
      mainFramebuffer,
      dofFramebuffer,
      quadVertexArray,
      dofProgram
    };
  },

  onRender: ({gl, tick, width, height, aspect, boxes, mainFramebuffer, dofFramebuffer, quadVertexArray, dofProgram}) => {

    clear(gl, {color: [0, 0, 0, 1], depth: true, framebuffer: mainFramebuffer});

    const camView = new Matrix4().lookAt({eye: [3, 1.5, 3], center: [0, 0, 0], up: [0, 1, 0]});
    const camProj = new Matrix4().perspective({fov: radians(75), aspect, near: 0.1, far: 30});

    for (let i = 0; i < NUM_BOXES; ++i) {
      let box = boxes[i];
      box.draw({
        uniforms: {
          uView: camView,
          uProjection: camProj,
          uModel: box.matrix
        },
        framebuffer: mainFramebuffer
      });
    }

    clear(gl, {color: [0, 0, 0, 1], framebuffer: dofFramebuffer});

    texelOffset[0] = 1;
    texelOffset[1] = 0;

    dofProgram.setUniforms({
        uTexelOffset: texelOffset,
        uColor: mainFramebuffer.color,
        uDepth: mainFramebuffer.depth
    });

    dofProgram.draw({
      vertexArray: quadVertexArray,
      
      drawMode: gl.TRIANGLE_STRIP,
      vertexCount: 4,
      framebuffer: dofFramebuffer
    });

    clear(gl, {color: [0, 0, 0, 1]});

    texelOffset[0] = 0;
    texelOffset[1] = 1;

    dofProgram.setUniforms({
        uTexelOffset: texelOffset,
        uColor: mainFramebuffer.color,
        uDepth: mainFramebuffer.depth
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
