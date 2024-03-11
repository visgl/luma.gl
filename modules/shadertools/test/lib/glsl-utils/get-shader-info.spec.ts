// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {getShaderInfo, glsl} from '@luma.gl/shadertools';

const SHADER_1 = glsl`\
uniform float floaty;
#define SHADER_NAME name-of-shader
main() {}
`;

const SHADER_2 = glsl`\
uniform float floaty;
#define SHADER name
main() {}
`;

const SHADER_3 = glsl`\
uniform float floaty;
#define  SHADER_NAME name-of-shader
main() {}
`;

const SHADER_4 = glsl`\
uniform float floaty;
#define  SHADER_NAME  name-of-shader
main() {}
`;

const SHADER_5 = glsl`\
uniform float floaty;
#define
SHADER_NAME name-of-shader
main() {}
`;

const SHADER_6 = glsl`\
uniform float floaty;
#define SHADER_NAME
name-of-shader
main() {}
`;
const SHADER_7 = glsl`\
uniform float floaty;
#define

SHADER_NAME name-of-shader
main() {}
`;

const SHADER_8 = glsl`\
uniform float floaty;
#define SHADER_NAME

name-of-shader
main() {}
`;

const SHADER1 = 'void main() {}';

const SHADER2 = '#version 100 void main() {}';

const SHADER3 = glsl`\
void main() {

}`;

const SHADER4 = glsl`\
#version 300 es
void main() {

}`;

const SHADER5 = `#version 300 es
void main() {

}`;

const SHADER6 = glsl`\
#version 100
void main() {

}`;

const SHADER7 = glsl`#version 300 es void main() {}`;

const versionTests = {
  [SHADER1]: 100,
  [SHADER2]: 100,
  [SHADER3]: 100,
  [SHADER4]: 300,
  [SHADER5]: 300,
  [SHADER6]: 100,
  [SHADER7]: 300
};

test('WebGL#getShaderInfo()', t => {
  t.equal(
    getShaderInfo(SHADER_1).name,
    'name-of-shader',
    'getShaderInfo().name extracted correct name'
  );

  t.equal(getShaderInfo(SHADER_2).name, 'unnamed', 'getShaderInfo().name extracted default name');

  t.equal(
    getShaderInfo(SHADER_3).name,
    'name-of-shader',
    'getShaderInfo().name extracted correct name'
  );

  t.equal(
    getShaderInfo(SHADER_4).name,
    'name-of-shader',
    'getShaderInfo().name extracted correct name'
  );

  t.equal(getShaderInfo(SHADER_5).name, 'unnamed', 'getShaderInfo().name extracted default name');

  t.equal(getShaderInfo(SHADER_6).name, 'unnamed', 'getShaderInfo().name extracted default name');

  t.equal(getShaderInfo(SHADER_7).name, 'unnamed', 'getShaderInfo().name extracted default name');

  t.equal(getShaderInfo(SHADER_8).name, 'unnamed', 'getShaderInfo().name extracted default name');

  for (const string in versionTests) {
    t.equal(getShaderInfo(string).version, versionTests[string], 'Version should match');
  }

  t.end();
});
