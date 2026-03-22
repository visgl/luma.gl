import {expect, test} from 'vitest';
import { getShaderInfo } from '@luma.gl/shadertools';
const SHADER_1 = /* glsl */`\
uniform float floaty;
#define SHADER_NAME name-of-shader
main() {}
`;
const SHADER_2 = /* glsl */`\
uniform float floaty;
#define SHADER name
main() {}
`;
const SHADER_3 = /* glsl */`\
uniform float floaty;
#define  SHADER_NAME name-of-shader
main() {}
`;
const SHADER_4 = /* glsl */`\
uniform float floaty;
#define  SHADER_NAME  name-of-shader
main() {}
`;
const SHADER_5 = /* glsl */`\
uniform float floaty;
#define
SHADER_NAME name-of-shader
main() {}
`;
const SHADER_6 = /* glsl */`\
uniform float floaty;
#define SHADER_NAME
name-of-shader
main() {}
`;
const SHADER_7 = /* glsl */`\
uniform float floaty;
#define

SHADER_NAME name-of-shader
main() {}
`;
const SHADER_8 = /* glsl */`\
uniform float floaty;
#define SHADER_NAME

name-of-shader
main() {}
`;
const SHADER1 = 'void main() {}';
const SHADER2 = '#version 100 void main() {}';
const SHADER3 = /* glsl */`\
void main() {

}`;
const SHADER4 = /* glsl */`\
#version 300 es
void main() {

}`;

// const SHADER5 = /* glsl */`\
// #version 300 es
// void main() {

// }`;

const SHADER6 = /* glsl */`\
#version 100
void main() {

}`;
const SHADER7 = /* glsl */`\
#version 300 es void main() {}`;
const versionTests = {
  [SHADER1]: 100,
  [SHADER2]: 100,
  [SHADER3]: 100,
  [SHADER4]: 300,
  // [SHADER5]: 300,
  [SHADER6]: 100,
  [SHADER7]: 300
};
test('WebGL#getShaderInfo()', () => {
  expect(getShaderInfo(SHADER_1).name, 'getShaderInfo().name extracted correct name').toBe('name-of-shader');
  expect(getShaderInfo(SHADER_2).name, 'getShaderInfo().name extracted default name').toBe('unnamed');
  expect(getShaderInfo(SHADER_3).name, 'getShaderInfo().name extracted correct name').toBe('name-of-shader');
  expect(getShaderInfo(SHADER_4).name, 'getShaderInfo().name extracted correct name').toBe('name-of-shader');
  expect(getShaderInfo(SHADER_5).name, 'getShaderInfo().name extracted default name').toBe('unnamed');
  expect(getShaderInfo(SHADER_6).name, 'getShaderInfo().name extracted default name').toBe('unnamed');
  expect(getShaderInfo(SHADER_7).name, 'getShaderInfo().name extracted default name').toBe('unnamed');
  expect(getShaderInfo(SHADER_8).name, 'getShaderInfo().name extracted default name').toBe('unnamed');
  for (const string in versionTests) {
    expect(getShaderInfo(string).version, 'Version should match').toBe(versionTests[string]);
  }
});
