// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {registerParseShaderCompilerLogTests} from 'test/utils/parse-shader-compiler-log.spec.shared';
import {registerWebGLTopologyUtilsTests} from './webgl-topology-utils.spec.shared';

registerParseShaderCompilerLogTests(test);
registerWebGLTopologyUtilsTests(test);
