import Program from '../../src/program';
import {createGLContext, hasWebGL, hasExtension} from '../../src/webgl';
import test from 'tape';

test('WebGL#types', t => {
    t.ok(typeof Program === 'function');
    t.ok(typeof createGLContext === 'function');
    t.ok(typeof hasWebGL === 'function');
    t.ok(typeof hasExtension === 'function');
    t.end();
});

test('WebGL#headless', t => {
    t.throws(createGLContext);
    t.notOk(hasWebGL());
    t.notOk(hasExtension('not an extension'));
    t.end();
})
