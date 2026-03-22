import {expect, test} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import { preprocess } from '@luma.gl/shadertools';
const TEST_CASES = [{
  title: 'no defines',
  options: {
    defines: {}
  },
  source: `\
layout(location = 0) in vec4 position;
#ifdef USE_NORMALS
layout(location = 1) in vec3 normals;
#endif
layout(location = 3) in vec2 texCoords;
`,
  result: `\
layout(location = 0) in vec4 position;
layout(location = 3) in vec2 texCoords;
`
}, {
  title: 'define USE_NORMALS',
  options: {
    defines: {
      USE_NORMALS: true
    }
  },
  source: `\
layout(location = 0) in vec4 position;
#ifdef USE_NORMALS
layout(location = 1) in vec3 normals;
#endif
layout(location = 3) in vec2 texCoords;
`,
  result: `\
layout(location = 0) in vec4 position;
layout(location = 1) in vec3 normals;
layout(location = 3) in vec2 texCoords;
`
}, {
  title: 'ifndef and else with comments',
  options: {
    defines: {
      USE_NORMALS: false
    }
  },
  source: `\
#ifndef USE_NORMALS // fallback
layout(location = 1) in vec3 generatedNormals;
#else // defined
layout(location = 1) in vec3 normals;
#endif // USE_NORMALS
`,
  result: `\
layout(location = 1) in vec3 generatedNormals;
`
}, {
  title: 'nested conditionals',
  options: {
    defines: {
      USE_LIGHTING: true,
      USE_IBL: false
    }
  },
  source: `\
#ifdef USE_LIGHTING
var direct = 1;
#ifdef USE_IBL
var ibl = 1;
#else
var ibl = 0;
#endif
#endif
`,
  result: `\
var direct = 1;
var ibl = 0;
`
}];
export function registerPreprocessorTests(): void {
  test('preprocess', () => {
    for (const testCase of TEST_CASES) {
      const result = preprocess(testCase.source, testCase.options);
      expect(result, testCase.title).toBe(testCase.result);
    }
    expect(() => preprocess('#else\nvalue\n#endif'), 'orphaned #else throws').toThrow(/Encountered #else/);
    expect(() => preprocess('#ifdef USE_SHADOWS\nvalue'), 'unterminated conditionals throw').toThrow(/Unterminated conditional block/);
  });
}
