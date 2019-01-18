import {
  getQualifierDetails,
  getPassthroughFS,
  typeToChannelSuffix,
  typeToChannelCount,
  convertToVec4
} from '../../src/utils/shader-utils';
import test from 'tape-catch';

test('shader-utils#getQualifierDetails', t => {
  const QUALIFIER_TEST_CASES = [
    {
      line: 'uniform vec2 size;',
      qualifiers: 'uniform',
      expected: {
        qualifier: 'uniform',
        type: 'vec2',
        name: 'size'
      }
    },
    {
      line: 'attribute vec4 input;',
      qualifiers: ['in'],
      expected: null
    },
    {
      line: 'attribute vec4 input;',
      qualifiers: ['attribute', 'in'],
      expected: {
        qualifier: 'attribute',
        type: 'vec4',
        name: 'input'
      }
    },
    {
      line: 'vec4 pos = vec3(in, 1.0); // some comments',
      qualifers: ['attribute', 'in'],
      expected: null
    }
  ];

  QUALIFIER_TEST_CASES.forEach(testCase => {
    const {line, qualifiers, expected} = testCase;
    const result = getQualifierDetails(line, qualifiers);
    t.deepEqual(
      result,
      expected,
      `getQualifierDetails should return valid values when line=${line}`
    );
  });
  t.end();
});

test('shader-utils#getPassthroughFS', t => {
  const PASSTHROUGH_TEST_CASES = [
    {
      version: 100,
      input: 'myInput',
      inputType: 'vec2',
      expected: `\
varying vec2 myInput;
void main() {
  gl_FragColor = vec4(myInput, 0.0, 1.0);
}`
    },
    {
      version: 300,
      input: 'myInput',
      inputType: 'float',
      output: 'myOutput',
      expected: `\
#version 300 es
in float myInput;
out vec4 myOutput;
void main() {
  myOutput = vec4(myInput, 0.0, 0.0, 1.0);
}`
    }
  ];

  PASSTHROUGH_TEST_CASES.forEach(testCase => {
    const {version, input, inputType, output, expected} = testCase;
    const result = getPassthroughFS({version, input, inputType, output});
    t.equal(
      result,
      expected,
      `Passthrough shader should match when version=${version} type=${inputType}`
    );
  });
  t.end();
});

test('shader-utils#typeToChannelSuffix', t => {
  t.equal(typeToChannelSuffix('float'), 'x', 'typeToChannelSuffix should return x for float');
  t.equal(typeToChannelSuffix('vec2'), 'xy', 'typeToChannelSuffix should return xy for vec2');
  t.equal(typeToChannelSuffix('vec3'), 'xyz', 'typeToChannelSuffix should return xyz for vec3');
  t.equal(typeToChannelSuffix('vec4'), 'xyzw', 'typeToChannelSuffix should return xyzw for vec4');
  t.end();
});

test('shader-utils#typeToChannelCount', t => {
  t.equal(typeToChannelCount('float'), 1, 'typeToChannelCount should return 1 for float');
  t.equal(typeToChannelCount('vec2'), 2, 'typeToChannelCount should return 2 for vec2');
  t.equal(typeToChannelCount('vec3'), 3, 'typeToChannelCount should return 3 for vec3');
  t.equal(typeToChannelCount('vec4'), 4, 'typeToChannelCount should return 4 for vec4');
  t.end();
});

test('shader-utils#convertToVec4', t => {
  t.equal(
    convertToVec4('one', 'float'),
    'vec4(one, 0.0, 0.0, 1.0)',
    'convertToVec4 should return right value for float'
  );
  t.equal(
    convertToVec4('one', 'vec2'),
    'vec4(one, 0.0, 1.0)',
    'convertToVec4 should return right value for vec2'
  );
  t.equal(
    convertToVec4('one', 'vec3'),
    'vec4(one, 1.0)',
    'convertToVec4 should return right value for vec3'
  );
  t.equal(convertToVec4('one', 'vec4'), 'one', 'convertToVec4 should return right value for vec4');
  t.end();
});
