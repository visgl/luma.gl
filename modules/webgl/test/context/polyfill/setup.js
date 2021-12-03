// Avoid generating a lot of big context divs
import {createTestContext} from '@luma.gl/test-utils';

export const fixture = {
  gl: createTestContext({webgl2: false, webgl1: true, throwOnError: true}),
  gl2: createTestContext({webgl2: true, webgl1: false})
};
