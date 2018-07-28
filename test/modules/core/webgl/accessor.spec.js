import test from 'tape-catch';
import Accessor from 'luma.gl/webgl/accessor';

test('WebGL#Accessor', t => {
  t.ok(Accessor, 'Accessor import successful');

  const accessor = new Accessor({instanced: true});

  t.ok(accessor, 'Accessor construction successful');
  t.equals(accessor.divisor, 1, 'Accessor: opts.instanced translated to opts.divisor');

  // TODO - check various methods

  t.end();
});
