// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {preprocess} from '@luma.gl/shadertools';
import {expect, it} from 'vitest';

const TEST_CASES = [
  {
    title: 'no defines',
    options: {defines: {}},
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
  },
  {
    title: 'define USE_NORMALS',
    options: {defines: {USE_NORMALS: true}},
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
  },
  {
    title: 'ifndef and else with comments',
    options: {defines: {USE_NORMALS: false}},
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
  },
  {
    title: 'nested conditionals',
    options: {defines: {USE_LIGHTING: true, USE_IBL: false}},
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
  },
  {
    title: '#if define expression',
    options: {defines: {USE_STORAGE: 1}},
    source: `\
#if USE_STORAGE
var storagePath = 1;
#else
var attributePath = 1;
#endif
`,
    result: `\
var storagePath = 1;
`
  },
  {
    title: '#if negated define expression',
    options: {defines: {USE_STORAGE: false}},
    source: `\
#if !USE_STORAGE
var attributePath = 1;
#endif
`,
    result: `\
var attributePath = 1;
`
  }
];

export function registerPreprocessorTests(): void {
  it('preprocess', () => {
    for (const testCase of TEST_CASES) {
      const result = preprocess(testCase.source, testCase.options);
      expect(result, testCase.title).toBe(testCase.result);
    }

    expect(() => preprocess('#else\nvalue\n#endif')).toThrow(/Encountered #else/);
    expect(() => preprocess('#ifdef USE_SHADOWS\nvalue')).toThrow(/Unterminated conditional block/);
    expect(() => preprocess('#if USE_A && USE_B\nvalue\n#endif')).toThrow(
      /Unsupported #if expression/
    );
  });
}
