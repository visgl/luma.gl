import {glsl} from '@luma.gl/shadertools';

type TranspilationTestCase = {
  title: string;
  stage: 'vertex' | 'fragment';
  GLSL_300: string;
  GLSL_300_TRANSPILED: string;
  GLSL_100: string;
  GLSL_100_MINIFIED?: string;
};

/**
 *
 */
export const TRANSPILATION_TEST_CASES: TranspilationTestCase[] = [
  {
    title: 'Vertex: textureCube, texture, texture*Lod, texture*LodEXT',
    stage: 'vertex',

    // 300 version should use 'textureCube()'' instead of 'texture()'
    GLSL_300: glsl`\
#version 300 es

in vec4 positions;
in vec4 texCoords[2];
uniform sampler2D sampler;
uniform samplerCube sCube;
out vec4 vColor;
out vec4 vTexCoords[2];

void f(out float a, in float b) {}

void main(void) {
  gl_Position = positions;
  vec4 texColor = texture(sampler, texCoord);
  vec4 texCubeColor = textureCube(sCube, cubeCoord);
  vec4 texLod = texture2DLodEXT(sampler, texCoord, 1.0);
  vec4 texCubeLod = textureCubeLodEXT(sCube, cubeCoord, 1.0);
  texLod = texture2DLod(sampler, texCoord, 1.0);
  texCubeLod = textureCubeLod(sCube, cubeCoord, 1.0);
  vColor = vec4(1., 0., 0., 1.);
  vTexCoords[0] = texCoords[0];
  vTexCoords[1] = texCoords[1];
}
`,

    // transpiled 300 version should have correct `texure()` syntax
    GLSL_300_TRANSPILED: glsl`\
#version 300 es

in vec4 positions;
in vec4 texCoords[2];
uniform sampler2D sampler;
uniform samplerCube sCube;
out vec4 vColor;
out vec4 vTexCoords[2];

void f(out float a, in float b) {}

void main(void) {
  gl_Position = positions;
  vec4 texColor = texture(sampler, texCoord);
  vec4 texCubeColor = texture(sCube, cubeCoord);
  vec4 texLod = textureLod(sampler, texCoord, 1.0);
  vec4 texCubeLod = textureLod(sCube, cubeCoord, 1.0);
  texLod = textureLod(sampler, texCoord, 1.0);
  texCubeLod = textureLod(sCube, cubeCoord, 1.0);
  vColor = vec4(1., 0., 0., 1.);
  vTexCoords[0] = texCoords[0];
  vTexCoords[1] = texCoords[1];
}
`,

    GLSL_100: glsl`\
#version 100

attribute vec4 positions;
attribute vec4 texCoords[2];
uniform sampler2D sampler;
uniform samplerCube sCube;
varying vec4 vColor;
varying vec4 vTexCoords[2];

void f(out float a, in float b) {}

void main(void) {
  gl_Position = positions;
  vec4 texColor = texture2D(sampler, texCoord);
  vec4 texCubeColor = textureCube(sCube, cubeCoord);
  vec4 texLod = texture2DLodEXT(sampler, texCoord, 1.0);
  vec4 texCubeLod = textureCubeLodEXT(sCube, cubeCoord, 1.0);
  texLod = texture2DLodEXT(sampler, texCoord, 1.0);
  texCubeLod = textureCubeLodEXT(sCube, cubeCoord, 1.0);
  vColor = vec4(1., 0., 0., 1.);
  vTexCoords[0] = texCoords[0];
  vTexCoords[1] = texCoords[1];
}
`
  },
  {
    title: 'Fragment: textureCube, texture, texture*Lod, texture*LodEXT',
    stage: 'fragment',

    // 300 version should use 'textureCube()'' instead of 'texture()'
    GLSL_300: glsl`\
#version 300 es

precision highp float;

uniform sampler2D sampler;
uniform samplerCube sCube;
in vec4 vColor;

void f(out float a, in float b) {}

out vec4 fragmentColor;
void main(void) {
  vec4 texColor = texture(sampler, texCoord);
  vec4 texCubeColor = textureCube(sCube, cubeCoord);
  vec4 texLod = texture2DLod(sampler, texCoord, 1.0);
  vec4 texCubeLod = textureCubeLod(sCube, cubeCoord, 1.0);
  texLod = texture2DLodEXT(sampler, texCoord, 1.0);
  texCubeLod = textureCubeLodEXT(sCube, cubeCoord, 1.0);
  fragmentColor = vColor;
}
`,

    // transpiled 300 version should have correct `texure()` syntax
    GLSL_300_TRANSPILED: glsl`\
#version 300 es

precision highp float;

uniform sampler2D sampler;
uniform samplerCube sCube;
in vec4 vColor;

void f(out float a, in float b) {}

out vec4 fragmentColor;
void main(void) {
  vec4 texColor = texture(sampler, texCoord);
  vec4 texCubeColor = texture(sCube, cubeCoord);
  vec4 texLod = textureLod(sampler, texCoord, 1.0);
  vec4 texCubeLod = textureLod(sCube, cubeCoord, 1.0);
  texLod = textureLod(sampler, texCoord, 1.0);
  texCubeLod = textureLod(sCube, cubeCoord, 1.0);
  fragmentColor = vColor;
}
`,

    GLSL_100: glsl`\
#version 100

precision highp float;

uniform sampler2D sampler;
uniform samplerCube sCube;
varying vec4 vColor;

void f(out float a, in float b) {}

void main(void) {
  vec4 texColor = texture2D(sampler, texCoord);
  vec4 texCubeColor = textureCube(sCube, cubeCoord);
  vec4 texLod = texture2DLodEXT(sampler, texCoord, 1.0);
  vec4 texCubeLod = textureCubeLodEXT(sCube, cubeCoord, 1.0);
  texLod = texture2DLodEXT(sampler, texCoord, 1.0);
  texCubeLod = textureCubeLodEXT(sCube, cubeCoord, 1.0);
  gl_FragColor = vColor;
}
`
  }
];

export const COMPILATION_TEST_CASES = [
  {
    title: 'textureCube',
    VS_300_VALID: glsl`\
#version 300 es

in vec4 positions;
uniform sampler2D sampler;
uniform samplerCube sCube;
out vec4 vColor;

void f(out float a, in float b) {}

void main(void) {
  gl_Position = positions;
  vec4 texColor = texture(sampler, vec2(1.0));
  vec4 texCubeColor = textureCube(sCube, vec3(1.0));
  vColor = vec4(1., 0., 0., 1.);
}
`,

    FS_300_VALID: glsl`\
#version 300 es

precision highp float;

out vec4 fragmentColor;
uniform sampler2D sampler;
uniform samplerCube sCube;
in vec4 vColor;

void f(out float a, in float b) {}

void main(void) {
  vec4 texColor = texture(sampler, vec2(1.0));
  vec4 texCubeColor = textureCube(sCube, vec3(1.0));
  fragmentColor = vColor;
}
`
  }
];
