import plugin from 'dev-modules/babel-plugin-remove-glsl-comments';
import test from 'tape-catch';

const PATTERNS = ['*.glsl.js', 'some/path/**/*.js'];

const TEST_CASES = [
  {
    title: 'invalid filename',
    input: `
      function(a, b) {
        return a + b; // add a and b
      }
    `,
    filename: 'math.js',
    output: `
      function(a, b) {
        return a + b; // add a and b
      }
    `
  }, {
    title: 'inline comments',
    input: `
      function(a, b) {
        return a + b; // add a and b
      }
    `,
    filename: 'some/path/math.js',
    output: `
      function(a, b) {
        return a + b;
      }
    `
  }, {
    title: 'multiple inline comments',
    input: `
      // a function to add numbers
      function(a, b) {
        return a + b; // add a and b
      }
    `,
    filename: 'math.glsl.js',
    output: `
      function(a, b) {
        return a + b;
      }
    `
  }, {
    title: 'multiline block comments',
    input: `
      /**
      * a function to add numbers
      * @params a (number)
      * @params b (number)
      * @returns (number)
      */
      function(a, b) {
        return a + b; // add a and b
      }
    `,
    filename: 'math.glsl.js',
    output: `
      function(a, b) {
        return a + b;
      }
    `
  }
];

test('RemoveGLSLComments Babel Plugin', t => {

  const stringLiteralVisitor = plugin().visitor.StringLiteral;
  const opts = {patterns: PATTERNS};

  TEST_CASES.forEach(testCase => {
    const path = {node: {value: testCase.input}};
    const state = {file: {opts: {filename: testCase.filename}}, opts};
    stringLiteralVisitor(path, state);
    t.is(path.node.value, testCase.output, testCase.title);
  })

  t.end();
});
