import {animationLoopOptions} from '../../core/shadowmap/app';
import {OffScreenAnimationLoop} from 'luma.gl';

export default OffScreenAnimationLoop.createWorker(animationLoopOptions);
