import {GL} from '@luma.gl/constants';

export const CACHING_TEST_CASES = [
  {
    function: 'uniform1fv',
    arrayType: Float32Array,
    glType: GL.FLOAT,
    data1: 0,
    data2: 1
  },
  {
    function: 'uniform2fv',
    arrayType: Float32Array,
    glType: GL.FLOAT,
    data1: [0, 1],
    data2: [1, 1]
  },
  {
    function: 'uniform3fv',
    arrayType: Float32Array,
    glType: GL.FLOAT,
    data1: [0, 1, 2],
    data2: [1, 1, 2]
  },
  {
    function: 'uniform4fv',
    arrayType: Float32Array,
    glType: GL.FLOAT,
    data1: [0, 1, 2, 3],
    data2: [1, 1, 2, 3]
  },
  {
    function: 'uniform1iv',
    arrayType: Int32Array,
    glType: GL.INT,
    data1: 0,
    data2: 1
  },
  {
    function: 'uniform2iv',
    arrayType: Int32Array,
    glType: GL.INT,
    data1: [0, 1],
    data2: [1, 1]
  },
  {
    function: 'uniform3iv',
    arrayType: Int32Array,
    glType: GL.INT,
    data1: [0, 1, 2],
    data2: [1, 1, 2]
  },
  {
    function: 'uniform4iv',
    arrayType: Int32Array,
    glType: GL.INT,
    data1: [0, 1, 2, 3],
    data2: [1, 1, 2, 3]
  },
  {
    function: 'uniform1uiv',
    arrayType: Uint32Array,
    glType: GL.UNSIGNED_INT,
    data1: 0,
    data2: 1
  },
  {
    function: 'uniform2uiv',
    arrayType: Uint32Array,
    glType: GL.UNSIGNED_INT,
    data1: [0, 1],
    data2: [1, 1]
  },
  {
    function: 'uniform3uiv',
    arrayType: Uint32Array,
    glType: GL.UNSIGNED_INT,
    data1: [0, 1, 2],
    data2: [1, 1, 2]
  },
  {
    function: 'uniform4uiv',
    arrayType: Uint32Array,
    glType: GL.UNSIGNED_INT,
    data1: [0, 1, 2, 3],
    data2: [1, 1, 2, 3]
  },
  {
    function: 'uniformMatrix2fv',
    arrayType: Float32Array,
    glType: GL.FLOAT_MAT2,
    data1: [0, 1, 2, 3],
    data2: [1, 1, 2, 3]
  },
  {
    function: 'uniformMatrix3fv',
    arrayType: Float32Array,
    glType: GL.FLOAT_MAT3,
    data1: [0, 1, 2, 3, 4, 5, 6, 7, 8],
    data2: [1, 1, 2, 3, 4, 5, 6, 7, 8]
  },
  {
    function: 'uniformMatrix4fv',
    arrayType: Float32Array,
    glType: GL.FLOAT_MAT4,
    data1: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    data2: [1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
  },
  {
    function: 'uniform1i',
    arrayType: null,
    glType: GL.SAMPLER_2D,
    data1: 1,
    data2: 2
  },
  {
    function: 'uniform1i',
    arrayType: null,
    glType: GL.SAMPLER_CUBE,
    data1: 1,
    data2: 2
  }
];
