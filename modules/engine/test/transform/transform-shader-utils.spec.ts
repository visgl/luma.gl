import {glsl} from '@luma.gl/core';
import {updateForTextures} from '@luma.gl/webgl-legacy/transform/transform-shader-utils';
import {Texture2D} from '@luma.gl/webgl-legacy';
import test from 'tape-promise/tape';
import {fixture} from 'test/setup';

test('TransformShaderUtils#updateForTextures', (t) => {
  const VS = glsl`\
attribute vec4 inTexture;
attribute float scale;
varying vec4 output;
void main()
{
  output = scale * inTexture;
}`;

  const {gl} = fixture;
  const texture = new Texture2D(gl);
  const sourceTextureMap = {
    inTexture: texture
  };

  const results = updateForTextures({vs: VS, sourceTextureMap});
  const declInject = results.inject && results.inject['vs:#decl'];
  const mainStartInject = results.inject && results.inject['vs:#main-start'];
  t.ok(declInject, 'results should contain vs:#decl inject');
  t.ok(mainStartInject, 'results should contain vs:#main-start inject');

  t.ok(
    declInject.includes('uniform sampler2D transform_uSampler_inTexture'),
    'should contain sampler uniform for input texture'
  );
  t.ok(
    declInject.includes('uniform vec2 transform_uSize_inTexture'),
    'should contain size uniform for input texture'
  );
  t.ok(
    mainStartInject.includes(
      'vec4 inTexture = transform_getInput(transform_uSampler_inTexture, transform_uSize_inTexture).xyzw;'
    ),
    'should contain size uniform for input texture'
  );
  t.ok(!results.targetTextureType, 'should not contain targetTextureType');
  t.end();
});

test('TransformShaderUtils#updateForTextures (with target texture)', (t) => {
  const VS = glsl`\
attribute vec4 inTexture;
attribute float scale;
varying vec4 outTexture;
void main()
{
  output = scale * inTexture;
}`;

  const {gl} = fixture;
  const inTexture = new Texture2D(gl);
  const outTexture = new Texture2D(gl);
  const sourceTextureMap = {
    inTexture
  };

  const results = updateForTextures({
    vs: VS,
    sourceTextureMap,
    targetTextureVarying: 'outTexture',
    targetTexture: outTexture
  });
  const declInject = results.inject && results.inject['vs:#decl'];
  const mainStartInject = results.inject && results.inject['vs:#main-start'];
  t.ok(declInject, 'results should contain vs:#decl inject');
  t.ok(mainStartInject, 'results should contain vs:#main-start inject');

  t.ok(
    declInject.includes('uniform vec2 transform_uSize_outTexture'),
    'should contain sampler uniform for target texture'
  );
  t.ok(
    mainStartInject.includes(
      'vec2 transform_position = transform_getPos(transform_uSize_outTexture);'
    ),
    'should calculate transform_position'
  );
  t.ok(
    mainStartInject.includes('gl_Position = vec4(transform_position, 0, 1.);'),
    'should set gl_Position'
  );

  t.equal(results.targetTextureType, 'vec4', 'should return targetTextureType');
  t.end();
});
