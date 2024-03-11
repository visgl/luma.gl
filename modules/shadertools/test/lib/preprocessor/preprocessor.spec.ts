// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {preprocess} from '@luma.gl/shadertools';

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
  }
];

test('preprocess', t => {
  for (const tc of TEST_CASES) {
    const result = preprocess(tc.source, tc.options);
    t.equal(result, tc.result, tc.title);
  }
  t.end();
});
