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

type LumaExampleProps = React.PropsWithChildren<{
  id?: string;
  template: Function;
  config: unknown;
  directory?: string;
  style?: CSSStyleDeclaration;
  container?: string;
}>;

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
      // canvas.style.width = '100%';
      // canvas.style.height = '100%';
      device = await luma.createDevice({
        adapters: [webgl2Adapter, webgpuAdapter],
        type: deviceType,
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

  // @ts-expect-error Intentionally accessing undeclared field info
  const info = props.template?.info;

  return (
    <div style={{position: 'relative'}}>
      <canvas key={deviceType} ref={setCanvas} style={{width: '100%', height: '100%'}} />
      <div
        style={{
          position: 'absolute',
          boxShadow: '5px 5px 4px grey',
          backgroundColor: '#F0F0F0F0',
          top: 20,
          right: 20,
          width: 200,
          height: 250,
          padding: 10
        }}
      >
        <h3>{capitalizeFirstLetters(props.id)}</h3>
        {info && <div dangerouslySetInnerHTML={{__html: info}} />}
        {props.children}
      </div>
    </div>
  );
};

function capitalizeFirstLetters(string) {
  const strings = string.split('-');
  return strings.map(capitalizeFirstLetter).join(' ');
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}