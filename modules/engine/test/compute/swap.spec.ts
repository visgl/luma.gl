import test from 'tape';
import {Swap} from '../../src/compute/swap';
import {webglDevice} from '@luma.gl/test-utils';

// TODO - these tests could run on NullDevice

test('Swap#constructor', t => {
  const current = webglDevice.createBuffer({byteLength: 1});
  const next = webglDevice.createBuffer({byteLength: 1});
  const swap = new Swap({current, next});

  t.equal(swap.current, current, 'should set the current resource correctly');
  t.equal(swap.next, next, 'should set the next resource correctly');

  t.end();
});

test('Swap#destroy', t => {
  const current = webglDevice.createBuffer({byteLength: 1});
  const next = webglDevice.createBuffer({byteLength: 1});
  const swap = new Swap({current, next});

  t.equal(swap.current.destroyed, false, 'should not yet have destroyed the current resource');
  t.equal(swap.next.destroyed, false, 'should not yet have destroyed the next resource');

  swap.destroy();

  t.equal(swap.current.destroyed, true, 'should destroy the current resource');
  t.equal(swap.next.destroyed, true, 'should destroy the next resource');

  t.end();
});

test('Swap#swap', t => {
  const current = webglDevice.createBuffer({byteLength: 1});
  const next = webglDevice.createBuffer({byteLength: 1});
  const swap = new Swap({current, next});

  swap.swap();

  t.equal(swap.current, next, 'should make the next resource the current resource');
  t.equal(swap.next, current, 'should reuse the current resource as the next resource');

  t.end();
});
