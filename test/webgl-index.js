// Avoid generating a lot of big context divs
import {contextSetDefaultHeight} from '../src/webgl/context';
contextSetDefaultHeight({width: 1, height: 1});

import '../src/webgl/test';
import '../src/webgl2/test';
import '../src/core/test';

import '../src/deprecated/test';
import '../src/experimental/test';

import './import-webgl.spec.js';
