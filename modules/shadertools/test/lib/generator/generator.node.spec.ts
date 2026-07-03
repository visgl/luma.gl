// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {registerCapitalizeTests} from './captialize.spec.shared';
import {registerGenerateShaderTests} from './generate-shader.spec.shared';

registerCapitalizeTests(test);
registerGenerateShaderTests(test);
