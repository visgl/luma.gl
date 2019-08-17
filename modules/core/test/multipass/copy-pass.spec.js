import {_CopyPass as CopyPass, Framebuffer} from '@luma.gl/core';
import test from 'tape-catch';
import {fixture, getResourceCounts, getLeakedResources} from 'test/setup';

test('CopyPass#constructor', t => {
  const {gl} = fixture;
  let cp = new CopyPass(gl);
  t.ok(cp instanceof CopyPass, 'should construct CopyPass object');

  cp = null;
  cp = new CopyPass(gl, {swap: false});
  t.ok(cp instanceof CopyPass, 'should construct CopyPass object with props');
  t.end();
});

test('CopyPass#_renderPass', t => {
  const {gl} = fixture;
  const cp = new CopyPass(gl);
  t.doesNotThrow(() => cp._renderPass({inputBuffer: new Framebuffer(gl)}), 'render should work');
  t.end();
});

test('CopyPass#delete', t => {
  const {gl} = fixture;
  const startCounts = getResourceCounts();
  const cp = new CopyPass(gl);
  cp.delete();
  const endCounts = getResourceCounts();
  const leakedResources = getLeakedResources(startCounts, endCounts);
  t.ok(
    !leakedResources,
    `should delete all resources, ${!leakedResources ? '' : leakedResources.info}`
  );
  t.end();
});
