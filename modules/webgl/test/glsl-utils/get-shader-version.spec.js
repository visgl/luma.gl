import test from 'tape-catch';
import getShaderVersion from '@luma.gl/webgl/glsl-utils/get-shader-version';

const SHADER1 = 'void main() {}';
const SHADER2 = '#version 100 void main() {}';
const SHADER3 = `\
void main() {

}`;
const SHADER4 = `\
#version 300 es
void main() {

}`;
const SHADER5 = `#version 300 es
void main() {

}`;
const SHADER6 = `\
#version 100
void main() {

}`;
const SHADER7 = '#version 300 es void main() {}';
const versionTests = {
  [SHADER1]: 100,
  [SHADER2]: 100,
  [SHADER3]: 100,
  [SHADER4]: 300,
  [SHADER5]: 300,
  [SHADER6]: 100,
  [SHADER7]: 300
};

test('Shader-utils#getShaderVersion', t => {
  for (const string in versionTests) {
    t.equal(getShaderVersion(string), versionTests[string], 'Version should match');
  }
  t.end();
});
