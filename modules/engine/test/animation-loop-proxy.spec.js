import {AnimationLoop} from '@luma.gl/core';
import {_AnimationLoopProxy as AnimationLoopProxy} from '@luma.gl/engine';
import test from 'tape-catch';
import {fixture} from 'test/setup';

function getMockCanvas() {
  return {
    getContext: () => fixture.gl
  };
}

test('core#AnimationLoopProxy.createWorker', t => {
  const mockWorkerContext = {};

  const animationLoop = new AnimationLoop();

  const getWorker = AnimationLoopProxy.createWorker(animationLoop);
  t.ok(typeof getWorker === 'function', 'createWorker returns function');

  getWorker(mockWorkerContext);
  t.ok(typeof mockWorkerContext.onmessage === 'function', 'worker is initialized');

  t.end();
});

test('core#AnimationLoopProxy#events', t => {
  // create mock worker context
  const outboundMessages = [];
  const mockWorkerContext = {
    postMessage: data => outboundMessages.push(data)
  };

  // create mock canvas
  const mockCanvas = getMockCanvas();
  const clickCalled = [];
  const onClick = evt => clickCalled.push(evt);

  const animationLoop = new AnimationLoop();

  AnimationLoopProxy.createWorker(animationLoop)(mockWorkerContext);

  mockWorkerContext.onmessage({
    data: {
      command: 'start',
      opts: {canvas: mockCanvas}
    }
  });

  mockCanvas.addEventListener('click', onClick);
  t.deepEqual(
    outboundMessages.pop(),
    {command: 'addEventListener', type: 'click'},
    'notifies main thread'
  );

  mockWorkerContext.onmessage({
    data: {
      command: 'event',
      type: 'click',
      event: {id: 1}
    }
  });
  t.deepEqual(clickCalled, [{id: 1}], 'event is handled');

  mockWorkerContext.onmessage({
    data: {
      command: 'event',
      type: 'hover',
      event: {id: 2}
    }
  });
  t.deepEqual(clickCalled, [{id: 1}], 'event is not handled');

  mockCanvas.removeEventListener('click', onClick);
  t.deepEqual(
    outboundMessages.pop(),
    {command: 'removeEventListener', type: 'click'},
    'notifies main thread'
  );

  mockWorkerContext.onmessage({
    data: {
      command: 'event',
      type: 'hover',
      event: {id: 3}
    }
  });
  t.deepEqual(clickCalled, [{id: 1}], 'event is not handled');

  mockWorkerContext.onmessage({
    data: {
      command: 'resize',
      width: 100,
      height: 100
    }
  });
  t.is(mockCanvas.width, 100, 'canvas size is updated');

  mockWorkerContext.onmessage({
    data: {
      command: 'stop'
    }
  });

  t.end();
});
