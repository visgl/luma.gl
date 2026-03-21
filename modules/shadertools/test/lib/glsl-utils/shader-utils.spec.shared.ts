// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  getQualifierDetails,
  getPassthroughFS,
  convertToVec4,
  typeToChannelSuffix,
  typeToChannelCount
} from '@luma.gl/shadertools';
import type {TapeTestFunction} from '@luma.gl/devtools-extensions/tape-test-utils';

type ChannelCount = 1 | 2 | 3 | 4;

export function registerShaderUtilsTests(test: TapeTestFunction): void {
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
        qualifiers: ['attribute', 'in'],
        expected: null
      }
    ];

    QUALIFIER_TEST_CASES.forEach(testCase => {
      const result = getQualifierDetails(testCase.line, testCase.qualifiers);
      t.deepEqual(
        result,
        testCase.expected,
        `getQualifierDetails should return valid values when line=${testCase.line}`
      );
    });
    t.end();
  });

  test('shader-utils#getPassthroughFS', t => {
    const PASSTHROUGH_TEST_CASES = [
      {
        input: 'myInput',
        inputChannels: 1 as ChannelCount,
        output: 'myOutput',
        expected: `\
#version 300 es
in float myInput;
out vec4 myOutput;
void main() {
  myOutput = vec4(myInput, 0.0, 0.0, 1.0);
}`
      },
      {
        input: 'myInput',
        inputChannels: 4 as ChannelCount,
        output: 'myOutput',
        expected: `\
#version 300 es
in vec4 myInput;
out vec4 myOutput;
void main() {
  myOutput = myInput;
}`
      }
    ];

    PASSTHROUGH_TEST_CASES.forEach(testCase => {
      const result = getPassthroughFS({
        input: testCase.input,
        inputChannels: testCase.inputChannels,
        output: testCase.output
      });
      t.equal(
        result,
        testCase.expected,
        `Passthrough shader should match when channels=${testCase.inputChannels}`
      );
    });

    t.ok(
      getPassthroughFS().includes('transform_output'),
      'default passthrough shader is returned without input'
    );
    t.throws(() => getPassthroughFS({input: 'myInput'}), /inputChannels/, 'missing channels throw');
    t.end();
  });

  test('shader-utils#typeToChannelSuffix', t => {
    t.equal(typeToChannelSuffix('float'), 'x', 'typeToChannelSuffix should return x for float');
    t.equal(typeToChannelSuffix('vec2'), 'xy', 'typeToChannelSuffix should return xy for vec2');
    t.equal(typeToChannelSuffix('vec3'), 'xyz', 'typeToChannelSuffix should return xyz for vec3');
    t.equal(typeToChannelSuffix('vec4'), 'xyzw', 'typeToChannelSuffix should return xyzw for vec4');
    t.throws(() => typeToChannelSuffix('mat4'), /mat4/, 'invalid suffix types throw');
    t.end();
  });

  test('shader-utils#typeToChannelCount', t => {
    t.equal(typeToChannelCount('float'), 1, 'typeToChannelCount should return 1 for float');
    t.equal(typeToChannelCount('vec2'), 2, 'typeToChannelCount should return 2 for vec2');
    t.equal(typeToChannelCount('vec3'), 3, 'typeToChannelCount should return 3 for vec3');
    t.equal(typeToChannelCount('vec4'), 4, 'typeToChannelCount should return 4 for vec4');
    t.throws(() => typeToChannelCount('mat4'), /mat4/, 'invalid channel count types throw');
    t.end();
  });

  test('shader-utils#convertToVec4', t => {
    t.equal(
      convertToVec4('one', 1),
      'vec4(one, 0.0, 0.0, 1.0)',
      'convertToVec4 should return right value for float'
    );
    t.equal(
      convertToVec4('one', 2),
      'vec4(one, 0.0, 1.0)',
      'convertToVec4 should return right value for vec2'
    );
    t.equal(
      convertToVec4('one', 3),
      'vec4(one, 1.0)',
      'convertToVec4 should return right value for vec3'
    );
    t.equal(convertToVec4('one', 4), 'one', 'convertToVec4 should return right value for vec4');
    t.throws(
      () => convertToVec4('one', 5 as never),
      /invalid channels/,
      'invalid channel counts throw'
    );
    t.end();
  });
}
