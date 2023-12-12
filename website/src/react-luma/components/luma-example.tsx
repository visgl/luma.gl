import React, {FC, useEffect, useRef, useState, useCallback, forwardRef} from 'react'; // eslint-disable-line
import {isBrowser} from '@probe.gl/env';
import {Device, log, luma, setPathPrefix} from '@luma.gl/core';
import {AnimationLoopTemplate, AnimationLoop, AnimationProps, makeAnimationLoop} from '@luma.gl/engine';

// import StatsWidget from '@probe.gl/stats-widget';
// import {VRDisplay} from '@luma.gl/experimental';
// import {InfoPanel} from '../../ocular-docusaurus/react-ocular';
import {useStore} from '../store/device-store';

const GITHUB_TREE = 'https://github.com/visgl/luma.gl/tree/8.5-release';

// WORKAROUND FOR luma.gl VRDisplay
// if (!globalThis.navigator) {// eslint-disable-line
//   globalThis.navigator = {};// eslint-disable-line
// }

if (typeof window !== 'undefined') {
  // @ts-ignore
  window.website = true;
}

const STYLES = {
  EXAMPLE_NOT_SUPPPORTED: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh'
  }
};

const STAT_STYLES = {
  position: 'fixed',
  fontSize: '12px',
  zIndex: 10000,
  color: '#fff',
  background: '#000',
  padding: '8px',
  opacity: 0.8
};

const DEFAULT_ALT_TEXT = 'THIS EXAMPLE IS NOT SUPPORTED';

type LumaExampleProps = {
  id?: string;
  template: Function;
  config: unknown;
  directory?: string;
  style?: CSSStyleDeclaration;
  container?: string;
};

const defaultProps = {
  name: 'luma-example'
};

const state = {
  supported: true,
  error: null
};

export const LumaExample: FC<LumaExampleProps> = (props: LumaExampleProps) => {
  let containerName = 'ssr';

  /** Each example maintains an animation loop */
  const [animationLoop, setAnimationLoop] = useState<AnimationLoop | null>(null);

  /** Type type of the device (WebGL, WebGPU, ...) */
  const deviceType = useStore(store => store.deviceType);
  containerName = props.container || `luma-example-container-${deviceType}`;

  const callbackRef = useCallback((canvas: HTMLCanvasElement) => {
    if (canvas) {
      if (!animationLoop) {
        log.info(0, `creating luma device ${canvas.id}`); // , ref.current);
        canvas.style.width = '100%';
        canvas.style.height = '50%';
        const device = luma.createDevice({type: deviceType, canvas, container: containerName});

        let animationLoop: AnimationLoop | null = null;
        animationLoop = makeAnimationLoop(props.template as unknown as typeof AnimationLoopTemplate, {
          device,
          autoResizeViewport: true,
          autoResizeDrawingBuffer: true
        });

        // Start the actual example
        animationLoop?.start();
        setAnimationLoop(animationLoop);

        // Ensure the example can find its images
        // TODO - this only works for examples/tutorials
        const RAW_GITHUB = 'https://raw.githubusercontent.com/visgl/luma.gl/master';
        if (props.directory) {
          setPathPrefix(`${RAW_GITHUB}/examples/${props.directory}/${props.id}/`);
        } else {
          setPathPrefix(`${RAW_GITHUB}/website/static/images/`);
        }
      }

    } else {

      if (animationLoop) {
        console.error(`unmounting example ${props.id}`); // , ref.current);
        animationLoop?.stop();
        animationLoop?.destroy();
        setAnimationLoop(null);
        // animationLoop.device?.destroy();
      }
    }
  }, []);

  return <canvas ref={callbackRef} />;
}
