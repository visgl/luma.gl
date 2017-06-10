import trackContext from '../../src/webgl-utils/track-context';
// import {trackContext, TEST_EXPORTS} from '../../src/webgl///';
import test from 'tape-catch';

import {fixture} from '../setup';

test('WebGL#trackContext', t => {
  const {gl, gl2} = fixture;

  t.ok(typeof trackContext === 'function', 'trackContext defined');

  const extensions = trackContext(gl);
  t.ok(extensions, 'extensions were returned');

  if (gl2) {
    const extensions2 = trackContext(gl2);
    t.ok(extensions2, 'extensions were returned');
  }

  t.end();
});
