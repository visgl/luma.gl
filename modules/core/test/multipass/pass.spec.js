import {_Pass as Pass, Framebuffer} from '@luma.gl/core';
import {makeSpy} from '@probe.gl/test-utils';
import test from 'tape-catch';
import {fixture} from 'test/setup';

const CUSTOM_PROPS = {
  enabled: false,
  screen: true,
  swap: true
};

test('Pass#constructor', t => {
  const {gl} = fixture;
  const pass = new Pass(gl);
  t.ok(pass instanceof Pass, 'should construct Pass object');
  const {enabled, screen, swap} = pass.props;
  t.ok(enabled && !screen && !swap, 'should set default props');
  t.end();
});

test('Pass#constructor#customProps', t => {
  const {gl} = fixture;
  const pass = new Pass(gl, CUSTOM_PROPS);
  t.ok(pass instanceof Pass, 'should construct Pass object');
  for (const key in CUSTOM_PROPS) {
    t.equal(pass.props[key], CUSTOM_PROPS[key], `should set custom prop for ${key}`);
  }
  t.end();
});

test('Pass#constructor#setProps', t => {
  const {gl} = fixture;
  const pass = new Pass(gl);
  pass.setProps(CUSTOM_PROPS);
  for (const key in CUSTOM_PROPS) {
    t.equal(pass.props[key], CUSTOM_PROPS[key], `should set custom prop for ${key}`);
  }
  t.end();
});

test('Pass#constructor#render (disabled)', t => {
  const {gl} = fixture;
  const pass = new Pass(gl);
  const renderPassSpy = makeSpy(pass, '_renderPass');
  pass.setProps({enabled: false});
  pass.render();
  t.equal(renderPassSpy.callCount, 0, 'should skip rendering when disabled');
  renderPassSpy.restore();
  t.end();
});

test('Pass#constructor#render (screen)', t => {
  const {gl} = fixture;
  const pass = new Pass(gl);
  const renderPassSpy = makeSpy(pass, '_renderPass');
  let swapBuffersCalled = 0;
  const swapBuffers = () => {
    swapBuffersCalled++;
  };
  const renderState = {
    writeBuffer: new Framebuffer(gl),
    _swapFramebuffers: swapBuffers
  };
  pass.setProps({enabled: true, screen: true});
  pass.render(renderState);
  t.equal(renderPassSpy.callCount, 1, 'should skip rendering when disabled');
  t.equal(swapBuffersCalled, 0, 'should not call swap');
  renderPassSpy.restore();
  t.end();
});

test('Pass#constructor#render (swap)', t => {
  const {gl} = fixture;
  const pass = new Pass(gl);
  const renderPassSpy = makeSpy(pass, '_renderPass');
  let swapBuffersCalled = 0;
  const swapBuffers = () => {
    swapBuffersCalled++;
  };
  const renderState = {
    readBuffer: new Framebuffer(gl),
    writeBuffer: new Framebuffer(gl),
    _swapFramebuffers: swapBuffers
  };
  // const outBufferLogSpy = makeSpy(renderState.writeBuffer, 'log');
  pass.setProps({enabled: true, swap: true, debug: true});
  pass.render(renderState);
  t.equal(renderPassSpy.callCount, 1, 'should call _renderPass');
  // t.equal(outBufferLogSpy.callCount, 1, 'should log output buffer');
  t.equal(swapBuffersCalled, 1, 'should call swap');
  renderPassSpy.restore();
  // outBufferLogSpy.restore();
  t.end();
});
