/*
import test from 'tape-promise/tape';
import {getWebGLTestDevices} from '@luma.gl/test-utils';
import {getShaderLayout} from '@luma.gl/webgl';

const TEST_CASES = [
  {
    title: 'Attributes and sampler uniform',
    vs: `\
    attribute vec3 positions;
    attribute vec2 texCoords;
  
    uniform mat4 uMVP;
    varying vec2 vUV;
  
    void main(void) {
      gl_Position = uMVP * vec4(positions, 1.0);
      vUV = texCoords;
    }
    `, 
    fs: `\
    precision highp float;
  
    uniform sampler2D uTexture;
    varying vec2 vUV;
  
    void main(void) {
      gl_FragColor = texture2D(uTexture, vec2(vUV.x, 1.0 - vUV.y));
    }
   `,
    expected: { 
      attributes: [ 
        { name: 'positions', location: 0, format: 'float32x3', stepMode: 'vertex' }, 
        { name: 'texCoords', location: 1, format: 'float32x2', stepMode: 'vertex' } 
      ], 
      bindings: [ 
        { type: 'texture', name: 'uTexture', location: 0, viewDimension: '2d', sampleType: 'float' } 
      ], 
      uniforms: [ 
        { location: {}, name: 'uTexture', size: 1, type: 35678, isArray: false, textureUnit: 0 },
        { location: {}, name: 'uMVP', size: 1, type: 35676, isArray: false }
      ]
    }
  },
  {
    title: 'varyings',
    skipWebgl1: true,
    varyings: ['vPosition', 'gl_Position'],
    vs: `
attribute vec3 positions;
uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
varying vec3 vPosition;

void main(void) {
  gl_Position = uPMatrix * uMVMatrix * vec4(positions, 1.0);
  vPosition = positions;
}
    `,
    fs: `
void main(void) {
  gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
}
    `,
    expected: { 
      attributes: [ 
        { name: 'positions', location: 0, format: 'float32x3', stepMode: 'vertex' } 
      ], 
      bindings: [], 
      uniforms: [ 
        { location: {}, name: 'uMVMatrix', size: 1, type: 35676, isArray: false }, 
        { location: {}, name: 'uPMatrix', size: 1, type: 35676, isArray: false }
      ],
      varyings: [ 
        { location: 0, name: 'vPosition', accessor: { type: 5126, size: 3 } }, 
        { location: 1, name: 'gl_Position', accessor: { type: 5126, size: 4 } } 
      ]
    }
  },
  {
    title: 'Uniform Buffer',
    skipWebgl1: true,
    vs: `#version 300 es
  uniform uniforms {
    mat4 modelViewProjectionMatrix;
  };
  
  layout(location=0) in vec3 position;
  layout(location=1) in vec2 uv;
  
  out vec2 fragUV;
  out vec4 fragPosition;
  
  void main() {
    gl_Position = modelViewProjectionMatrix * vec4(position, 1.0);
    fragUV = uv;
    fragPosition = vec4(position, 1.);
  }
      `,
    fs: `#version 300 es
  #define SHADER_NAME cube-fs
  precision highp float;
  in vec2 fragUV;
  in vec4 fragPosition;
  
  layout (location=0) out vec4 fragColor;
  
  void main() {
    fragColor = fragPosition;
  }
    `,
    expected: { 
      attributes: [ 
        { name: 'position', location: 0, format: 'float32x3', stepMode: 'vertex' }, 
        { name: 'uv', location: 1, format: 'float32x2', stepMode: 'vertex' } 
      ], 
      bindings: [ 
        { type: 'uniform', name: 'uniforms', location: 0, visibility: 0, minBindingSize: 64, 
          uniforms: [ 
            { name: 'modelViewProjectionMatrix', format: 'mat4x4<f32>', byteOffset: 0, byteStride: 0, arrayLength: 1 } 
          ] 
        }
      ]
      // attributes: [ 
      //   { name: 'position', location: 0, format: 'float32x3', stepMode: 'vertex' }, 
      //   { name: 'uv', location: 1, format: 'float32x2', stepMode: 'vertex' } 
      // ], 
      // bindings: [ 
      //   {
      //     type: 'uniform', name: 'uniforms', location: 0, visibility: 0, minBindingSize: 64, 
      //     uniforms: [ 
      //       { name: 'modelViewProjectionMatrix', format: 'mat4x4<f32>', byteOffset: 0, byteLength: 1, arrayLength: 1 } 
      //     ] 
      //   } 
      // ] 
    }
  }
];
*/

/** TODO - hard to make this work consistently across local env and CI
test.skip('WebGL#getShaderLayout#varyings', async (t) => {

  for (const tc of TEST_CASES) {
    for (const device of await getWebGLTestDevices()) {
      if (tc.skipWebgl1 && device.info.type === 'webgl') {
        continue;
      }
      const vs = device.createShader({stage: 'vertex', source: tc.vs});
      const fs = device.createShader({stage: 'fragment', source: tc.fs});

      const program = device.createRenderPipeline({vs, fs, varyings: tc.varyings});
      const shaderLayout = getShaderLayout(device.gl, program.handle);

      // headless gl has complex uniform location structs
      for (const uniform of shaderLayout.uniforms || []) {
        uniform.location = {};
      }

      t.deepEquals(shaderLayout, tc.expected, `${device.info.type}: ${tc.title}`);

      program.destroy();
      vs.destroy();
      fs.destroy();
    }
  }
  t.end();
});
 */