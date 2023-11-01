// luma.gl, MIT license
// Copyright (c) vis.gl contributors

/* eslint-disable no-console, no-invalid-this */
import {Bench} from '@probe.gl/bench';

import shadersBench from './shaders.bench';
import uniformsBench from './uniforms.bench';
import arrayCopyBench from './array-copy.bench';
// import pipBench from './point-in-polygon.bench';
const suite = new Bench();

// add tests
uniformsBench(suite);
shadersBench(suite);
arrayCopyBench(suite);
// pipBench(suite);

// Run the suite
suite.run();
