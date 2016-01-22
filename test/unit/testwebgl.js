import Program from '../../src/program';
import {createGLContext} from '../../src/webgl';
import test from 'tape';

test('WebGL#types', t => {
    t.ok(typeof Program === 'function');
    t.ok(typeof createGLContext === 'function');
    t.end();
});
