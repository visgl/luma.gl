import getShaderName from '@luma.gl/webgl/glsl-utils/get-shader-name';
import test from 'tape-catch';

const SHADER_1 = `\
uniform float floaty;
#define SHADER_NAME name-of-shader
main() {}
`;

const SHADER_2 = `\
uniform float floaty;
#define SHADER name
main() {}
`;

test('WebGL#getShaderName', t => {
  t.equal(getShaderName(SHADER_1), 'name-of-shader', 'getShaderName extracted correct name');
  t.equal(getShaderName(SHADER_2), 'unnamed', 'getShaderName extracted default name');
  t.end();
});
