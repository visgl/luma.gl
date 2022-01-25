import test from 'tape-promise/tape';
import {getWebGLTestDevices, webgl1TestDevice, webgl2TestDevice} from '@luma.gl/test-utils';
import {fixture} from 'test/setup';
import GL from '@luma.gl/constants';
import {getShaderLayout} from '@luma.gl/webgl';

const TEST_CASES = [
  // {
  //   title: 'Attribute and matrix uniforms',
  //   vs: `\
  //   attribute vec3 positions;
  //   uniform mat4 uMVMatrix;
  //   uniform mat4 uPMatrix;
  //   void main(void) {
  //     gl_Position = uPMatrix * uMVMatrix * vec4(positions, 1.0);
  //   }
  //   `,
  //   fs: `\
  //   void main(void) {
  //     gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
  //   }
  //   `,
  //   expected: {
  //     attributes: [
  //       {name: 'positions'}
  //     ],
  //     uniforms: [

  //     ]
  //   }
  // },
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
        {name: 'positions'}
      ],
      uniforms: [

      ]
    }
  },
  {
    title: 'varyings',
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
expected: {}
  }
];

test.only('WebGL#getShaderLayout#varyings', async (t) => {

  for (const device of await getWebGLTestDevices()) {
    for (const tc of TEST_CASES) {
      const vs = device.createShader({stage: 'vertex', source: tc.vs});
      const fs = device.createShader({stage: 'fragment', source: tc.fs});
      const program = device.createRenderPipeline({vs, fs});
      const shaderLayout = getShaderLayout(device.gl, program.handle);

      t.deepEquals(shaderLayout, tc.expected);

      program.destroy();
      vs.destroy();
      fs.destroy();
    }
  }
  t.end();
});

/*
test.skip('WebGL#getShaderLayout#varyings', (t) => {
  const {gl2} = fixture;
  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  const program = webgl2TestDevice.createRenderPipeline({fs, vs, varyings: ['vPosition', 'gl_Position']});

  const bindings = getShaderLayout(gl2, program.handle);

  t.equals(bindings.varyings[0].name, 'vPosition');
  t.equals(bindings.varyings[1].name, 'gl_Position');
  t.end();
});

test.skip('WebGL2#getShaderLayout#varyings', (t) => {
  const {gl2} = fixture;
  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  const program = webgl2TestDevice.createRenderPipeline({fs, vs, varyings: ['vPosition', 'gl_Position']});

  const bindings = getShaderLayout(gl2, program.handle);

  t.equals(bindings.varyings[0].name, 'vPosition');
  t.equals(bindings.varyings[1].name, 'gl_Position');
  t.end();
});

test.skip('WebGL2#getShaderLayout#varyings', (t) => {
  const {gl2} = fixture;
  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  let program = new Program(gl2, {fs, vs, varyings: ['vPosition', 'gl_Position']});

  // @ts-ignore
  let varyingMap = program.configuration.varyingInfosByName;
  t.equals(varyingMap.vPosition.location, 0);
  t.equals(varyingMap.gl_Position.location, 1);

  program = new Program(gl2, {
    fs,
    vs,
    varyings: ['vPosition', 'gl_Position'],
    bufferMode: GL.INTERLEAVED_ATTRIBS
  });
  // @ts-ignore
  varyingMap = program.configuration.varyingInfosByName;
  t.equals(varyingMap.vPosition.location, 0);
  t.equals(varyingMap.gl_Position.location, 1);
  t.end();
});
*/
