import test from 'tape-catch';
import {createGLContext, Sampler} from 'luma.gl';

import {
  testSamplerParameters, SAMPLER_PARAMETERS, SAMPLER_PARAMETERS_WEBGL2
} from './sampler.utils';

const fixture = {
  gl: createGLContext({webgl2: true})
};

test('WebGL2#Sampler setParameters', t => {
  const {gl} = fixture;

  if (!Sampler.isSupported(gl)) {
    t.comment('Sampler not available, skipping tests');
    t.end();
    return;
  }

  let sampler = new Sampler(gl, {});
  t.ok(sampler instanceof Sampler, 'Sampler construction successful');

  testSamplerParameters({t, texture: sampler, parameters: SAMPLER_PARAMETERS});
  testSamplerParameters({t, texture: sampler, parameters: SAMPLER_PARAMETERS_WEBGL2});

  sampler = sampler.delete();
  t.ok(sampler instanceof Sampler, 'Sampler delete successful');

  t.end();
});
