// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {registerDirlightTests} from './dirlight.spec.shared';
import {registerGouraudMaterialTests} from './gouraud-material.spec.shared';
import {registerLambertMaterialTests} from './lambert-material.spec.shared';
import {registerLightingTests} from './lights.spec.shared';
import {registerPhongMaterialTests} from './phong-material.spec.shared';

registerDirlightTests(test);
registerGouraudMaterialTests(test);
registerLambertMaterialTests(test);
registerLightingTests(test);
registerPhongMaterialTests(test);
