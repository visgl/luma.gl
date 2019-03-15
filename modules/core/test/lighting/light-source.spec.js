import {AmbientLight, DirectionalLight, PointLight} from '@luma.gl/core';
import test from 'tape-catch';

test('@luma.gl/core#AmbientLight', t => {
  const light = new AmbientLight();
  t.ok(light, 'Created a default AmbientLight');
  t.end();
});

test('@luma.gl/core#DirectionalLight', t => {
  const light = new DirectionalLight();
  t.ok(light, 'Created a default AmbientLight');
  t.end();
});

test('@luma.gl/core#PointLight', t => {
  const light = new PointLight();
  t.ok(light, 'Created a default AmbientLight');
  t.end();
});
