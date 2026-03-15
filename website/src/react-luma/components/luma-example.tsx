import React, {CSSProperties, FC, useEffect, useRef, useState} from 'react'; // eslint-disable-line
import {Device, luma} from '@luma.gl/core';
import {
  AnimationLoopTemplate,
  AnimationLoop,
  makeAnimationLoop,
  setPathPrefix
} from '@luma.gl/engine';
import {webgl2Adapter} from '@luma.gl/webgl';
import {webgpuAdapter} from '@luma.gl/webgpu';
import {DeviceTabs} from './device-tabs';

// import StatsWidget from '@probe.gl/stats-widget';
// import {VRDisplay} from '@luma.gl/experimental';
import {useStore} from '../store/device-store';

const GITHUB_TREE = 'https://github.com/visgl/luma.gl/tree/master';

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
  title?: string;
  template: Function;
  config: unknown;
  directory?: string;
  sourceDirectory?: string;
  sourcePath?: string;
  style?: CSSProperties;
  container?: string;
}>;

const defaultProps = {
  name: 'luma-example'
};

const state = {
  supported: true,
  error: null
};

const EXAMPLE_CONTAINER_STYLE: CSSProperties = {
  position: 'relative',
  width: '100%',
  height: 'calc(100vh - var(--ifm-navbar-height) - 6rem)',
  minHeight: 'calc(100vh - var(--ifm-navbar-height) - 6rem)'
};

const EXAMPLE_CANVAS_STYLE: CSSProperties = {
  display: 'block',
  width: '100%',
  height: '100%'
};

const EXAMPLE_HEADER_STYLE: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 20,
  padding: '12px 20px'
};

const EXAMPLE_INFO_STYLE: CSSProperties = {
  boxSizing: 'border-box',
  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.28)',
  backgroundColor: 'rgba(255, 255, 255, 0.96)',
  borderRadius: 12,
  color: '#111',
  width: 420,
  maxWidth: 'min(420px, 100%)',
  overflow: 'hidden',
  padding: '10px 16px',
  zIndex: 10
};

type ExampleInfoProps = {
  directory?: string;
  id?: string;
  sourceDirectory?: string;
  sourcePath?: string;
  title?: string;
};

type InfoBoxProps = React.PropsWithChildren<
  ExampleInfoProps & {
    html?: string;
    style?: CSSProperties;
  }
>;

type ExamplePageProps = React.PropsWithChildren<{
  className?: string;
  style?: CSSProperties;
}>;

type ExampleHeaderProps = React.PropsWithChildren<
  ExampleInfoProps & {
    devices?: ('webgl2' | 'webgpu')[];
    style?: CSSProperties;
  }
>;

type ReactExampleProps<P> = {
  component: React.ComponentType<P>;
  componentProps: P;
  className?: string;
  style?: CSSProperties;
};

export const InfoBox: FC<InfoBoxProps> = (props: InfoBoxProps) => {
  const sourceUrl = getExampleSourceUrl(props);
  const title = getExampleTitle(props.id, props.title);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const maxInfoHeight = 400;
  const maxInfoContentHeight = 320;

  return (
    <div
      style={{
        ...EXAMPLE_INFO_STYLE,
        display: 'flex',
        flexDirection: 'column',
        maxHeight: isCollapsed ? undefined : maxInfoHeight,
        ...props.style
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12
        }}
      >
        <div style={{minWidth: 0}}>
          {title ? <h3 style={{marginTop: 0, marginBottom: 0}}>{title}</h3> : null}
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 24, flexShrink: 0}}>
          {sourceUrl ? (
            <a href={sourceUrl} target="_blank" rel="noreferrer">
              Source code
            </a>
          ) : null}
          <button
            type="button"
            aria-label={isCollapsed ? 'Expand info box' : 'Collapse info box'}
            onClick={() => setIsCollapsed(value => !value)}
            style={{
              flexShrink: 0,
              border: '1px solid #d0d7de',
              background: '#fff',
              borderRadius: 999,
              width: 28,
              height: 28,
              fontSize: 14,
              lineHeight: 1,
              cursor: 'pointer'
            }}
          >
            {isCollapsed ? '▾' : '▴'}
          </button>
        </div>
      </div>
      {!isCollapsed ? (
        <div
          style={{
            marginTop: 12,
            maxHeight: maxInfoContentHeight,
            overflowY: 'auto'
          }}
        >
          {props.html ? <div dangerouslySetInnerHTML={{__html: props.html}} /> : null}
          {props.children}
        </div>
      ) : null}
    </div>
  );
};

export const ExamplePage: FC<ExamplePageProps> = (props: ExamplePageProps) => {
  return (
    <div className={props.className || 'luma-example-page'} style={{...EXAMPLE_CONTAINER_STYLE, ...props.style}}>
      {props.children}
    </div>
  );
};

export const ExampleHeader: FC<ExampleHeaderProps> = (props: ExampleHeaderProps) => {
  return (
    <div style={{...EXAMPLE_HEADER_STYLE, ...props.style}}>
      <InfoBox
        id={props.id}
        title={props.title}
        directory={props.directory}
        sourceDirectory={props.sourceDirectory}
        sourcePath={props.sourcePath}
      >
        {props.children}
      </InfoBox>
      <DeviceTabs devices={props.devices} style={{flexShrink: 0}} />
    </div>
  );
};

export function ReactExample<P>(props: ReactExampleProps<P>) {
  const Component = props.component;

  return (
    <ExamplePage className={props.className} style={props.style}>
      <Component {...props.componentProps} />
    </ExamplePage>
  );
}

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
    if (!canvas || !deviceType || usedCanvases.current.get(canvas)) return;

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
    <ExamplePage
      style={{
        display: 'grid',
        gridTemplateRows: 'auto minmax(0, 1fr)',
        ...props.style
      }}
    >
      <ExampleHeader
        id={props.id}
        title={props.title}
        directory={props.directory}
        sourceDirectory={props.sourceDirectory}
        sourcePath={props.sourcePath}
      >
        {info ? <div dangerouslySetInnerHTML={{__html: info}} /> : null}
      </ExampleHeader>
      <div style={{minHeight: 0}}>
        <canvas key={deviceType} ref={setCanvas} style={EXAMPLE_CANVAS_STYLE} />
      </div>
      {props.children}
    </ExamplePage>
  );
};

function getExampleSourceUrl(props: {
  directory?: string;
  id?: string;
  sourceDirectory?: string;
  sourcePath?: string;
}): string | null {
  if (props.sourcePath) {
    return `${GITHUB_TREE}/${props.sourcePath}`;
  }
  if (props.id && (props.sourceDirectory || props.directory)) {
    const sourceDirectory = props.sourceDirectory || props.directory;
    return `${GITHUB_TREE}/examples/${sourceDirectory}/${props.id}`;
  }
  return null;
}

function getExampleTitle(id?: string, title?: string): string {
  if (title) {
    return title;
  }
  if (id) {
    return capitalizeFirstLetters(id);
  }
  return '';
}

function capitalizeFirstLetters(string: string) {
  const strings = string.split('-');
  return strings.map(capitalizeFirstLetter).join(' ');
}

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
