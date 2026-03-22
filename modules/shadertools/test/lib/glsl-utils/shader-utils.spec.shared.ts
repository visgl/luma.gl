import {expect, test} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import { getQualifierDetails, getPassthroughFS, convertToVec4, typeToChannelSuffix, typeToChannelCount } from '@luma.gl/shadertools';
type ChannelCount = 1 | 2 | 3 | 4;
export function registerShaderUtilsTests(): void {
  test('shader-utils#getQualifierDetails', () => {
    const QUALIFIER_TEST_CASES = [{
      line: 'uniform vec2 size;',
      qualifiers: 'uniform',
      expected: {
        qualifier: 'uniform',
        type: 'vec2',
        name: 'size'
      }
    }, {
      line: 'attribute vec4 input;',
      qualifiers: ['in'],
      expected: null
    }, {
      line: 'attribute vec4 input;',
      qualifiers: ['attribute', 'in'],
      expected: {
        qualifier: 'attribute',
        type: 'vec4',
        name: 'input'
      }
    }, {
      line: 'vec4 pos = vec3(in, 1.0); // some comments',
      qualifiers: ['attribute', 'in'],
      expected: null
    }];
    QUALIFIER_TEST_CASES.forEach(testCase => {
      const result = getQualifierDetails(testCase.line, testCase.qualifiers);
      expect(result, `getQualifierDetails should return valid values when line=${testCase.line}`).toEqual(testCase.expected);
    });
  });
  test('shader-utils#getPassthroughFS', () => {
    const PASSTHROUGH_TEST_CASES = [{
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
    }, {
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
    }];
    PASSTHROUGH_TEST_CASES.forEach(testCase => {
      const result = getPassthroughFS({
        input: testCase.input,
        inputChannels: testCase.inputChannels,
        output: testCase.output
      });
      expect(result, `Passthrough shader should match when channels=${testCase.inputChannels}`).toBe(testCase.expected);
    });
    expect(getPassthroughFS().includes('transform_output'), 'default passthrough shader is returned without input').toBeTruthy();
    expect(() => getPassthroughFS({
      input: 'myInput'
    }), 'missing channels throw').toThrow(/inputChannels/);
  });
  test('shader-utils#typeToChannelSuffix', () => {
    expect(typeToChannelSuffix('float'), 'typeToChannelSuffix should return x for float').toBe('x');
    expect(typeToChannelSuffix('vec2'), 'typeToChannelSuffix should return xy for vec2').toBe('xy');
    expect(typeToChannelSuffix('vec3'), 'typeToChannelSuffix should return xyz for vec3').toBe('xyz');
    expect(typeToChannelSuffix('vec4'), 'typeToChannelSuffix should return xyzw for vec4').toBe('xyzw');
    expect(() => typeToChannelSuffix('mat4'), 'invalid suffix types throw').toThrow(/mat4/);
  });
  test('shader-utils#typeToChannelCount', () => {
    expect(typeToChannelCount('float'), 'typeToChannelCount should return 1 for float').toBe(1);
    expect(typeToChannelCount('vec2'), 'typeToChannelCount should return 2 for vec2').toBe(2);
    expect(typeToChannelCount('vec3'), 'typeToChannelCount should return 3 for vec3').toBe(3);
    expect(typeToChannelCount('vec4'), 'typeToChannelCount should return 4 for vec4').toBe(4);
    expect(() => typeToChannelCount('mat4'), 'invalid channel count types throw').toThrow(/mat4/);
  });
  test('shader-utils#convertToVec4', () => {
    expect(convertToVec4('one', 1), 'convertToVec4 should return right value for float').toBe('vec4(one, 0.0, 0.0, 1.0)');
    expect(convertToVec4('one', 2), 'convertToVec4 should return right value for vec2').toBe('vec4(one, 0.0, 1.0)');
    expect(convertToVec4('one', 3), 'convertToVec4 should return right value for vec3').toBe('vec4(one, 1.0)');
    expect(convertToVec4('one', 4), 'convertToVec4 should return right value for vec4').toBe('one');
    expect(() => convertToVec4('one', 5 as never), 'invalid channel counts throw').toThrow(/invalid channels/);
  });
}
