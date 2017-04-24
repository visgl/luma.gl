// Avoid generating a lot of big context divs
import {setContextDefaults} from '../src/webgl/context';
setContextDefaults({width: 1, height: 1});

// Imports tests for all modules that depend on webgl
import './experimental';
import './deprecated';
import '../src/io/test';
import './webgl';
