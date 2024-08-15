import React, {FC, useEffect, useRef, useState} from 'react'; // eslint-disable-line
import {Device, luma} from '@luma.gl/core';
import {
  AnimationLoopTemplate,
  AnimationLoop,
  makeAnimationLoop,
  setPathPrefix
} from '@luma.gl/engine';
import {webgl2Adapter} from '@luma.gl/webgl';
import {webgpuAdapter} from '@luma.gl/webgpu';

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
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const usedCanvases = useRef(new WeakMap<HTMLCanvasElement>());
  const currentTask = useRef<Promise<void> | null>(null);

  /** Type type of the device (WebGL, WebGPU, ...) */
  const deviceType = useStore(store => store.deviceType);
  containerName = props.container || `luma-example-container-${deviceType}`;

  useEffect(() => {
    if (!canvas || usedCanvases.current.get(canvas)) return;

    usedCanvases.current.set(canvas, true);

    let animationLoop: AnimationLoop | null = null;
    let device: Device | null = null;
    const asyncCreateLoop = async () => {
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      device = await luma.createDevice({
        adapters: [webgl2Adapter, webgpuAdapter],
        type: deviceType,
        // @ts-expect-error
        createCanvasContext: {
          canvas,
          container: containerName
        }
      });

      animationLoop = makeAnimationLoop(props.template as unknown as typeof AnimationLoopTemplate, {
        device,
        autoResizeViewport: true,
        autoResizeDrawingBuffer: true
      });

      // Start the actual example
      animationLoop?.start();

      // Ensure the example can find its images
      // TODO - this only works for examples/tutorials
      const RAW_GITHUB = 'https://raw.githubusercontent.com/visgl/luma.gl/master';
      if (props.directory) {
        setPathPrefix(`${RAW_GITHUB}/examples/${props.directory}/${props.id}/`);
      } else {
        setPathPrefix(`${RAW_GITHUB}/website/static/images/`);
      }
    };

    currentTask.current = Promise.resolve(currentTask.current).then(() => {
      asyncCreateLoop().catch(error => {
        console.error(`start ${deviceType} failed`, error);
      });
    });

    return () => {
      currentTask.current = Promise.resolve(currentTask.current)
        .then(() => {
          if (animationLoop) {
            animationLoop.destroy();
            animationLoop = null;
          }

          if (device) {
            device.destroy();
          }
        })
        .catch(error => {
          console.error(`unmounting ${deviceType} failed`, error);
        });
    };
  }, [deviceType, canvas]);

  return <canvas key={deviceType} ref={setCanvas} />;
};
