// luma.gl, MIT license
// Copyright (c) vis.gl contributors

// import test from 'tape-promise/tape';
import {checkType} from '@luma.gl/test-utils';

import {dirlight, ShaderModule} from '@luma.gl/shadertools';

checkType<ShaderModule>(dirlight);
