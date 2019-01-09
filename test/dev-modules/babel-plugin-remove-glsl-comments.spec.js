import babel from '@babel/core';
import plugin from 'dev-modules/babel-plugin-remove-glsl-comments';
import test from 'tape-catch';

const ES6_ENV = {
  targets: {chrome: '60'},
  modules: false
};

const STRING_LITERAL = `
// JavaScript comment
const shader = '\\n  /* block comment */\\n  float add(float a, float b) {\\n    return a + b; // inline comment 1\\n  }\\n\\n  /*\\n   * multiline block comment\\n   */\\n  float sub(float a, float b) {\\n    // inline comment 2\\n    return a - b;\\n  }\\n';
`;

const TEMPLATE_LITERAL = `
// JavaScript comment
const shader = \`
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
\`;
`

const EXPECTED_OUTPUT = `
  float add(float a, float b) {
    return a + b;
  }
  float sub(float a, float b) {
    return a - b;
  }
`;

const TEMPLATE_LITERAL_COMPLEX = `
const shader = \`
  /* generated $\{new Date().toLocaleString()\} */
  float add(float a, float b) {
    return a + b; // inline comment 1
  }
  // ID $\{Math.random()\}
\`;
`;

const TEST_CASES = [
  {
    title: 'string literal (es5)',
    input: STRING_LITERAL,
    output: `
      // JavaScript comment
      var shader = "${EXPECTED_OUTPUT.replace(/\n/g, '\\n')}";
    `
  },
  {
    title: 'string literal (es6)',
    env: ES6_ENV,
    input: STRING_LITERAL,
    output: `
      // JavaScript comment
      const shader = "${EXPECTED_OUTPUT.replace(/\n/g, '\\n')}";`
  },
  {
    title: 'template literal (es5)',
    input: TEMPLATE_LITERAL,
    output: `
      // JavaScript comment
      var shader = "${EXPECTED_OUTPUT.replace(/\n/g, '\\n')}";
    `
  },
  {
    title: 'template literal (es6)',
    env: ES6_ENV,
    input: TEMPLATE_LITERAL,
    output: `
      // JavaScript comment
      const shader = \`${EXPECTED_OUTPUT}\`;`
  },
  {
    title: 'template literal complex (es5)',
    input: TEMPLATE_LITERAL_COMPLEX,
    output: `var shader = "
  /* generated ".concat(new Date().toLocaleString(), " */
  float add(float a, float b) {
    return a + b;
  }
  // ID ").concat(Math.random(), "
");`.replace(/\n/g, '\\n')
  },
  {
    title: 'template literal complex (es6)',
    env: ES6_ENV,
    input: TEMPLATE_LITERAL_COMPLEX,
    output: `const shader = \`
  /* generated $\{new Date().toLocaleString()\} */
  float add(float a, float b) {
    return a + b;
  }
  // ID $\{Math.random()\}
\`;`
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

/* eslint-disable */
test('RemoveGLSLComments Babel Plugin', t => {

  TEST_CASES.forEach(testCase => {
    const {code} = babel.transform(testCase.input, {
      presets: [['@babel/env', testCase.env]],
      plugins: [[plugin, {patterns: testCase.patterns}]],
      filename: testCase.filename || 'test.js'
    });
    t.is(clean(code), clean(testCase.output), testCase.title);
  });

  t.end();
});
