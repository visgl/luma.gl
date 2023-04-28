import babel from '@babel/core';
import plugin from 'dev-modules/babel-plugin-remove-glsl-comments';
import test from 'tape-promise/tape';

const ES6_ENV = {
  targets: {chrome: '60'},
  modules: false
};

const EXAMPLE = `
/* block comment */
float add(float a, float b) {
  return a + b; // inline comment 1
}

/*
 * multiline block comment
 */
float sub(float a, float b) {
  // inline comment 2
  return a - b;
}
`;

const EXPECTED_OUTPUT = `
float add(float a, float b) {
  return a + b;
}
float sub(float a, float b) {
  return a - b;
}
`;

const STRING_LITERAL = `// JavaScript comment\n  const shader = '${EXAMPLE.replace(
  /\n/g,
  '\\n'
)}';`;
const TEMPLATE_LITERAL = `// JavaScript comment\n  const shader = \`${EXAMPLE}\`;`;
const RESULT_STRING = `// JavaScript comment\n  var shader = "${EXPECTED_OUTPUT.replace(
  /\n/g,
  '\\n'
)}";`;
const RESULT_TEMPLATE = `// JavaScript comment\n  var shader = \`${EXPECTED_OUTPUT}\`;`;

const COMPLEX_TEMPLATE_LITERAL = `
const shader = \`
  /* generated $\{new Date().toLocaleString()\} */
  float add(float a, float b) {
    return a + b; // inline comment
  }
  // ID $\{Math.random()\}\`;
`;

const COMPLEX_RESULT_STRING = `var shader = "
  /* generated ".concat(new Date().toLocaleString(), " */
  float add(float a, float b) {
    return a + b;
  }
  // ID ").concat(Math.random());`.replace(/\n/g, '\\n');

const COMPLEX_RESULT_TEMPLATE = COMPLEX_TEMPLATE_LITERAL.replace(' // inline comment', '');

const TEST_CASES = [
  {
    title: 'string literal (es5)',
    input: STRING_LITERAL,
    output: RESULT_STRING
  },
  {
    title: 'string literal (es6)',
    env: ES6_ENV,
    input: STRING_LITERAL,
    output: RESULT_STRING.replace('var ', 'const ')
  },
  {
    title: 'template literal (es5)',
    input: TEMPLATE_LITERAL,
    output: RESULT_STRING
  },
  {
    title: 'template literal (es6)',
    env: ES6_ENV,
    input: TEMPLATE_LITERAL,
    output: RESULT_TEMPLATE.replace('var ', 'const ')
  },
  {
    title: 'template literal complex (es5)',
    input: COMPLEX_TEMPLATE_LITERAL,
    output: COMPLEX_RESULT_STRING
  },
  {
    title: 'template literal complex (es6)',
    env: ES6_ENV,
    input: COMPLEX_TEMPLATE_LITERAL,
    output: COMPLEX_RESULT_TEMPLATE
  },
  {
    title: 'invalid filename',
    env: ES6_ENV,
    filename: 'math.js',
    patterns: ['*.glsl.js'],
    input: TEMPLATE_LITERAL,
    output: TEMPLATE_LITERAL
  }
];

// Remove whitespace before comparing
function clean(code) {
  return code.replace('"use strict";', '').replace(/\n\s+/g, '\n').trim();
}

// TODO - RESTORE
test.skip('RemoveGLSLComments Babel Plugin', (t) => {
  TEST_CASES.forEach((testCase) => {
    const {code} = babel.transform(testCase.input, {
      comments: true,
      presets: [['@babel/env', testCase.env]],
      plugins: [[plugin, {patterns: testCase.patterns}]],
      filename: testCase.filename || 'test.js',
      configFile: false
    });
    t.is(clean(code), clean(testCase.output), testCase.title);
  });

  t.end();
});
