// Copyright (c) 2015 - 2018 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

import test from 'tape-catch';
import {fixture} from 'test/setup';
import {glGetDebugInfo} from '@luma.gl/core';
import {runTests} from './fp64-test-utils-transform';
const gl = fixture.gl2;

// Failing test cases are ignored based on gpu and glslFunc, using ignoreFor field
// ignoreFor: [{gpu: ['glslFunc-1', 'glslFunc-2']}] => ignores for `'glslFunc-1' and 'glslFunc-2` when running on `gpu`
const commonTestCases = [
  {a: 3.0e-19, b: 3.3e13},
  {a: 9.9e-40, b: 1.7e3},
  {a: 1.5e-36, b: 1.7e-16},
  {a: 9.4e-26, b: 51},
  {a: 6.7e-20, b: 0.93},

  // mul_fp64: Large numbers once multipled, can't be represented by 32 bit precision and Math.fround() returns NAN
  // sqrt_fp64: Fail on INTEL with margin 3.906051071870294e-12
  {a: 2.4e3, b: 5.9e31, ignoreFor: {all: ['mul_fp64'], intel: ['sqrt_fp64']}},

  // div_fp64 fails on INTEL with margin 1.7318642528355118e-12
  // sqrt_fp64 fails on INTEL with margin 1.5518878351528786e-12
  {a: 1.4e9, b: 6.3e5, ignoreFor: {intel: ['div_fp64', 'sqrt_fp64']}},

  // div fails on INTEL with margin 1.7886288892678105e-14
  // sqrt fails on INTEL with margin 2.5362810256331708e-12
  {a: 3.0e9, b: 4.3e-23, ignoreFor: {intel: ['div_fp64', 'sqrt_fp64']}},

  // div fail on INTEL with margin 1.137354350370519e-12
  {a: 1.7e-19, b: 2.7e-27, ignoreFor: {intel: ['div_fp64']}},

  // div_fp64 fails on INTEL with margin 2.7291999999999997e-12
  // sqrt_fp64 fails on INTEL with margin 3.501857471494295e-12
  {a: 0.3, b: 3.2e-16, ignoreFor: {intel: ['div_fp64', 'sqrt_fp64']}},

  // mul_fp64 : fails since result can't be represented by 32 bit floats
  // div_fp64 : fails on INTEL with margin 1.9999999999999994e-15
  // sqrt_fp64 : fails on INTEL with margin 1.832115697751484e-12
  {a: 4.1e30, b: 8.2e15, ignoreFor: {all: ['mul_fp64'], intel: ['div_fp64', 'sqrt_fp64']}},

  // Fails on INTEL, margin 3.752606081210107e-12
  {a: 6.2e3, b: 6.3e10, ignoreFor: {intel: ['sqrt_fp64']}},
  // Fails on INTEL, margin 3.872578286363912e-13
  {a: 2.5e2, b: 5.1e-21, ignoreFor: {intel: ['sqrt_fp64']}},
  // Fails on INTEL, margin 1.5332142001740705e-12
  {a: 96, b: 1.7e4, ignoreFor: {intel: ['sqrt_fp64']}},
  // // Fail on INTEL, margin 1.593162047558726e-12
  {a: 0.27, b: 2.3e16, ignoreFor: {intel: ['sqrt_fp64']}},
  // Fails on INTEL, margin 1.014956357028767e-12
  {a: 18, b: 9.1e-9, ignoreFor: {intel: ['sqrt_fp64']}}
];

// Filter all tests cases based on current gpu and glsFunc
function getTestCasesFor(glslFunc) {
  // Under node gl2 is not available
  if (!gl) {
    return [];
  }
  const debugInfo = glGetDebugInfo(gl);
  const testCases = commonTestCases.filter(testCase => {
    if (testCase.ignoreFor) {
      for (const gpu in testCase.ignoreFor) {
        if (
          (gpu === 'all' || debugInfo.vendor.toLowerCase().indexOf(gpu) >= 0) &&
          testCase.ignoreFor[gpu].includes(glslFunc)
        ) {
          return false;
        }
      }
    }
    return true;
  });
  return testCases;
}

test('fp64#sum_fp64', t => {
  const glslFunc = 'sum_fp64';
  const testCases = getTestCasesFor(glslFunc);
  runTests(gl, {glslFunc, binary: true, op: (a, b) => a + b, testCases, t});
});

test('fp64#sub_fp64', t => {
  const glslFunc = 'sub_fp64';
  const testCases = getTestCasesFor(glslFunc);
  runTests(gl, {glslFunc, binary: true, op: (a, b) => a - b, testCases, t});
});

test('fp64#mul_fp64', t => {
  const glslFunc = 'mul_fp64';
  const testCases = getTestCasesFor(glslFunc);
  runTests(gl, {glslFunc, binary: true, op: (a, b) => a * b, limit: 128, testCases, t});
});

test('fp64#div_fp64', t => {
  const glslFunc = 'div_fp64';
  const testCases = getTestCasesFor(glslFunc);
  runTests(gl, {glslFunc, binary: true, op: (a, b) => a / b, limit: 128, testCases, t});
});

test('fp64#sqrt_fp64', t => {
  const glslFunc = 'sqrt_fp64';
  const testCases = getTestCasesFor(glslFunc);
  runTests(gl, {glslFunc, op: a => Math.sqrt(a), limit: 128, testCases, t});
});
