import test from 'tape-catch';
import {Sampler} from 'luma.gl';

import {fixture} from 'luma.gl/test/setup';

import {
  testSamplerParameters,
  SAMPLER_PARAMETERS,
  SAMPLER_PARAMETERS_WEBGL2
} from './sampler.utils';

test('WebGL2#Sampler setParameters', t => {
  const {gl2} = fixture;

  if (!Sampler.isSupported(gl2)) {
    t.comment('Sampler not available, skipping tests');
    t.end();
    return;
  }

  let sampler = new Sampler(gl2, {});
  t.ok(sampler instanceof Sampler, 'Sampler construction successful');

  testSamplerParameters({t, texture: sampler, parameters: SAMPLER_PARAMETERS});
  testSamplerParameters({t, texture: sampler, parameters: SAMPLER_PARAMETERS_WEBGL2});

  sampler = sampler.delete();
  t.ok(sampler instanceof Sampler, 'Sampler delete successful');

  t.end();
});
