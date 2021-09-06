import test from 'tape-promise/tape';
import GL from '@luma.gl/constants';
import {Renderbuffer, getKey} from '@luma.gl/webgl';

import RENDERBUFFER_FORMATS from '@luma.gl/webgl/classes/renderbuffer-formats';

import {fixture} from 'test/setup';

// const WEBGL1_FORMATS = [GL.RGB, GL.RGBA, GL.LUMINANCE_ALPHA, GL.LUMINANCE, GL.ALPHA];

test('WebGL#Renderbuffer construct/delete', (t) => {
  const {gl} = fixture;

  t.throws(
    // @ts-ignore
    () => new Renderbuffer(),
    /.*WebGLRenderingContext.*/,
    'Renderbuffer throws on missing gl context'
  );

  const renderbuffer = new Renderbuffer(gl, {format: GL.DEPTH_COMPONENT16, width: 1, height: 1});
  t.ok(renderbuffer instanceof Renderbuffer, 'Renderbuffer construction successful');

  renderbuffer.delete();
  t.ok(renderbuffer instanceof Renderbuffer, 'Renderbuffer delete successful');

  renderbuffer.delete();
  t.ok(renderbuffer instanceof Renderbuffer, 'Renderbuffer repeated delete successful');

  t.end();
});

test('WebGL#Renderbuffer format creation', (t) => {
  const {gl} = fixture;

  for (const formatName in RENDERBUFFER_FORMATS) {
    const format = Number(formatName);
    if (Renderbuffer.isSupported(gl, {format})) {
      const renderbuffer = new Renderbuffer(gl, {format});
      t.equals(
        renderbuffer.format,
        format,
        `Renderbuffer(${getKey(gl, format)}) created with correct format`
      );
      renderbuffer.delete();
    }
  }

  t.end();
});

test('WebGL2#Renderbuffer format creation', (t) => {
  const {gl2} = fixture;

  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  for (const format_ in RENDERBUFFER_FORMATS) {
    const format = Number(format_);
    if (Renderbuffer.isSupported(gl2, {format})) {
      const renderbuffer = new Renderbuffer(gl2, {format});
      t.equals(
        renderbuffer.format,
        format,
        `Renderbuffer(${getKey(gl2, format)}) created with correct format`
      );
      renderbuffer.delete();
    }
  }

  t.end();
});
