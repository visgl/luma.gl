// luma.gl, MIT license
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {webglDevice} from '@luma.gl/test-utils';
import {runTests} from './fp64-test-utils-transform';

// Failing test cases are ignored based on gpu and glslFunc, using ignoreFor field
// ignoreFor: [{gpu: ['glslFunc-1', 'glslFunc-2']}] => ignores for `'glslFunc-1' and 'glslFunc-2` when running on `gpu`
// Many of these tests fail on Apple GPUs with very large margins, see https://github.com/visgl/luma.gl/issues/1764.
const commonTestCases = [
  {a: 2, b: 2},
  {a: 0.1, b: 0.1, ignoreFor: {apple: ['sum_fp64', 'mul_fp64', 'div_fp64']}},
  {a: 3.0e-19, b: 3.3e13, ignoreFor: {apple: ['sum_fp64', 'sub_fp64']}},
  {a: 9.9e-40, b: 1.7e3, ignoreFor: {}},
  {a: 1.5e-36, b: 1.7e-16, ignoreFor: {}},
  {a: 9.4e-26, b: 51, ignoreFor: {}},
  {a: 6.7e-20, b: 0.93, ignoreFor: {apple: ['sum_fp64', 'sub_fp64']}},

  // mul_fp64: Large numbers once multipled, can't be represented by 32 bit precision and Math.fround() returns NAN
  // sqrt_fp64: Fail on INTEL with margin 3.906051071870294e-12
  {a: 2.4e3, b: 5.9e31, ignoreFor: {all: ['mul_fp64'], intel: ['sqrt_fp64'], apple: ['sum_fp64', 'sub_fp64']}},

  // div_fp64 fails on INTEL with margin 1.7318642528355118e-12
  // sqrt_fp64 fails on INTEL with margin 1.5518878351528786e-12
  {a: 1.4e9, b: 6.3e5, ignoreFor: {intel: ['div_fp64', 'sqrt_fp64'], apple: ['mul_fp64', 'div_fp64']}},

  // div fails on INTEL with margin 1.7886288892678105e-14
  // sqrt fails on INTEL with margin 2.5362810256331708e-12
  {a: 3.0e9, b: 4.3e-23, ignoreFor: {intel: ['div_fp64', 'sqrt_fp64'], apple: ['div_fp64']}},

  // div fail on INTEL with margin 1.137354350370519e-12
  {a: 1.7e-19, b: 2.7e-27, ignoreFor: {intel: ['div_fp64'], apple: ['div_fp64']}},

  // div_fp64 fails on INTEL with margin 2.7291999999999997e-12
  // sqrt_fp64 fails on INTEL with margin 3.501857471494295e-12
  {a: 0.3, b: 3.2e-16, ignoreFor: {intel: ['div_fp64', 'sqrt_fp64'], apple: ['div_fp64']}},

  // mul_fp64 : fails since result can't be represented by 32 bit floats
  // div_fp64 : fails on INTEL with margin 1.9999999999999994e-15
  // sqrt_fp64 : fails on INTEL with margin 1.832115697751484e-12
  {a: 4.1e30, b: 8.2e15, ignoreFor: {all: ['mul_fp64'], intel: ['div_fp64', 'sqrt_fp64'], apple: ['div_fp64']}},

  // Fails on INTEL, margin 3.752606081210107e-12
  {a: 6.2e3, b: 6.3e10, ignoreFor: {intel: ['sqrt_fp64'], apple: ['sum_fp64', 'mul_fp64', 'sub_fp64']}},
  // Fails on INTEL, margin 3.872578286363912e-13
  {a: 2.5e2, b: 5.1e-21, ignoreFor: {intel: ['sqrt_fp64'], apple: ['div_fp64']}},
  // Fails on INTEL, margin 1.5332142001740705e-12
  {a: 96, b: 1.7e4, ignoreFor: {intel: ['sqrt_fp64'], apple: ['div_fp64']}},
  // // Fail on INTEL, margin 1.593162047558726e-12
  {a: 0.27, b: 2.3e16, ignoreFor: {intel: ['sqrt_fp64'], apple: ['sum_fp64', 'mul_fp64', 'sub_fp64']}},
  // Fails on INTEL, margin 1.014956357028767e-12
  {a: 18, b: 9.1e-9, ignoreFor: {intel: ['sqrt_fp64'], apple: ['div_fp64']}}
];

// Filter all tests cases based on current gpu and glsFunc
function getTestCasesFor(glslFunc) {
  const debugInfo = webglDevice.info;
  const testCases = commonTestCases.filter((testCase) => {
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

test('fp64#sum_fp64', async (t) => {
  const glslFunc = 'sum_fp64';
  const testCases = getTestCasesFor(glslFunc);
  await runTests(webglDevice, {glslFunc, binary: true, op: (a, b) => a + b, testCases, t});
  t.end();
});

test('fp64#sub_fp64', async (t) => {
  const glslFunc = 'sub_fp64';
  const testCases = getTestCasesFor(glslFunc);
  await runTests(webglDevice, {glslFunc, binary: true, op: (a, b) => a - b, testCases, t});
  t.end();
});

test('fp64#mul_fp64', async (t) => {
  const glslFunc = 'mul_fp64';
  const testCases = getTestCasesFor(glslFunc);
  await runTests(webglDevice, {glslFunc, binary: true, op: (a, b) => a * b, limit: 128, testCases, t});
  t.end();
});

test('fp64#div_fp64', async (t) => {
  const glslFunc = 'div_fp64';
  const testCases = getTestCasesFor(glslFunc);
  await runTests(webglDevice, {glslFunc, binary: true, op: (a, b) => a / b, limit: 128, testCases, t});
  t.end();
});

test('fp64#sqrt_fp64', async (t) => {
  const glslFunc = 'sqrt_fp64';
  const testCases = getTestCasesFor(glslFunc);
  await runTests(webglDevice, {glslFunc, op: (a) => Math.sqrt(a), limit: 128, testCases, t});
  t.end();
});
