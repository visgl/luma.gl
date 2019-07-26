import {_AnimationLoopProxy as AnimationLoopProxy} from '@luma.gl/core';

const worker = new Worker('./worker.js');

const animationLoop = new AnimationLoopProxy(worker);

animationLoop.start();