import React, {CSSProperties, FC, useEffect, useRef, useState} from 'react'; // eslint-disable-line
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {Device, luma} from '@luma.gl/core';
import {AnimationLoopTemplate, AnimationLoop, makeAnimationLoop, setPathPrefix} from '@luma.gl/engine';
import {DeviceTabs, type DeviceTabSelection} from './device-tabs';
import {ExampleStats} from './example-stats';
import {InfoBox, type ExampleInfoProps} from './info-box';
import {
  clearActiveCpuHotspotProfilerDevice,
  setActiveCpuHotspotProfilerDevice
} from '../debug/luma-cpu-hotspot-profiler';
import {logError} from '../utils/error-utils';

// import {VRDisplay} from '@luma.gl/experimental';
import {
  createDevice,
  createPresentationDevice,
  getCanvasContainer,
  getPreferredAvailableDeviceType,
  type DeviceType,
  useStore
} from '../store/device-store';

let currentLumaExampleTask: Promise<void> = Promise.resolve();

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

export type ExampleDisplayProps = {
  className?: string;
  embedded?: boolean;
  embeddedHeight?: CSSProperties['height'];
  style?: CSSProperties;
};

export type LumaExampleProps = React.PropsWithChildren<
  ExampleDisplayProps & {
  id?: string;
  title?: string;
  template: Function;
  config: unknown;
  directory?: string;
  sourceDirectory?: string;
  sourceFiles?: string[];
  sourcePath?: string;
  stackBlitz?: boolean;
  container?: string;
  panel?: boolean;
  showHeader?: boolean;
  showStats?: boolean;
  devices?: DeviceTabSelection[];
  templateInfoPlacement?: 'header' | 'page';
  headerControls?: React.ReactNode;
  }
>;

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
  height: 'calc(100vh - var(--ifm-navbar-height))',
  minHeight: 'calc(100vh - var(--ifm-navbar-height))'
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
  padding: '12px 20px',
  position: 'absolute',
  top: 0,
  right: 0,
  left: 0,
  zIndex: 20,
  pointerEvents: 'none'
};

export type ExamplePageProps = React.PropsWithChildren<ExampleDisplayProps>;

type ExampleHeaderProps = React.PropsWithChildren<
  ExampleInfoProps & {
    devices?: DeviceTabSelection[];
    style?: CSSProperties;
  }
>;

type ReactExampleProps<P> = {
  component: React.ComponentType<P>;
  componentProps: P;
  showStats?: boolean;
} & ExampleDisplayProps;

export const ExamplePage: FC<ExamplePageProps> = (props: ExamplePageProps) => {
  const embeddedHeight = props.embeddedHeight ?? 560;
  const embeddedStyle: CSSProperties | undefined = props.embedded
    ? {
        height: embeddedHeight,
        minHeight: embeddedHeight === 'auto' ? 0 : embeddedHeight
      }
    : undefined;

  return (
    <div
      className={
        props.className || (props.embedded ? 'docs-embedded-example' : 'luma-example-page')
      }
      style={{...EXAMPLE_CONTAINER_STYLE, ...embeddedStyle, ...props.style}}
    >
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
        sourceFiles={props.sourceFiles}
        sourcePath={props.sourcePath}
        stackBlitz={props.stackBlitz}
        style={{pointerEvents: 'auto'}}
      >
        {props.children}
      </InfoBox>
      <DeviceTabs
        devices={props.devices}
        style={{flexShrink: 1, maxWidth: '100%', overflowX: 'auto', pointerEvents: 'auto'}}
      />
    </div>
  );
};

export function ReactExample<P>(props: ReactExampleProps<P>) {
  const Component = props.component;

  return (
    <ExamplePage
      className={props.className}
      embedded={props.embedded}
      embeddedHeight={props.embeddedHeight}
      style={props.style}
    >
      {props.showStats !== false ? <ExampleStats /> : null}
      <Component {...props.componentProps} />
    </ExamplePage>
  );
}

export const LumaExample: FC<LumaExampleProps> = (props: LumaExampleProps) => {
  const showStats = props.showStats !== false && props.panel !== false;
  const showHeader = props.showHeader !== false && props.panel !== false;
  const {siteConfig} = useDocusaurusContext();
  const websiteBaseUrl = siteConfig.baseUrl.endsWith('/') ? siteConfig.baseUrl : `${siteConfig.baseUrl}/`;

  /** Each example maintains an animation loop */
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);

  /** Type type of the device (WebGL, WebGPU, ...) */
  const deviceType = useStore(store => store.deviceType);
  const device = useStore(store => store.device);
  const [effectiveDeviceType, setEffectiveDeviceType] = useState<DeviceType | undefined>();
  const [effectiveDevice, setEffectiveDevice] = useState<Device | undefined>();
  const requestedDeviceTypesKey = getRequestedDeviceTypes(props.devices)?.join('|') || '';

  useEffect(() => {
    let isCancelled = false;
    const requestedDeviceTypes = getRequestedDeviceTypes(props.devices);

    const selectEffectiveDevice = async () => {
      if (!deviceType || !device) {
        if (!isCancelled) {
          setEffectiveDeviceType(undefined);
          setEffectiveDevice(undefined);
        }
        return;
      }

      if (!requestedDeviceTypes || requestedDeviceTypes.includes(deviceType)) {
        if (!isCancelled) {
          setEffectiveDeviceType(deviceType);
          setEffectiveDevice(device);
        }
        return;
      }

      const fallbackDeviceType = await getPreferredAvailableDeviceType(requestedDeviceTypes);
      if (!fallbackDeviceType) {
        if (!isCancelled) {
          setEffectiveDeviceType(deviceType);
          setEffectiveDevice(device);
        }
        return;
      }

      const fallbackDevice = await createDevice(fallbackDeviceType);
      await createPresentationDevice(fallbackDeviceType);
      if (!isCancelled) {
        setEffectiveDeviceType(fallbackDeviceType);
        setEffectiveDevice(fallbackDevice);
      }
    };

    void selectEffectiveDevice();

    return () => {
      isCancelled = true;
    };
  }, [deviceType, device, requestedDeviceTypesKey]);

  useEffect(() => {
    if (!canvasContainerRef.current || !effectiveDeviceType || !effectiveDevice) {
      return;
    }

    let isCancelled = false;
    let animationLoop: AnimationLoop | null = null;
    const defaultCanvasContext = effectiveDevice.getDefaultCanvasContext();
    const deviceCanvas = defaultCanvasContext.canvas;
    const asyncCreateLoop = async () => {
      // Ensure the example can find its locally served assets before example construction starts.
      if (props.directory) {
        setPathPrefix(`${websiteBaseUrl}example-assets/${props.directory}/${props.id}/`);
      } else {
        setPathPrefix(`${websiteBaseUrl}images/`);
      }

      if (!(deviceCanvas instanceof HTMLCanvasElement)) {
        throw new Error('Website examples require the shared device canvas to be an HTMLCanvasElement');
      }

      deviceCanvas.style.display = EXAMPLE_CANVAS_STYLE.display;
      deviceCanvas.style.width = EXAMPLE_CANVAS_STYLE.width;
      deviceCanvas.style.height = EXAMPLE_CANVAS_STYLE.height;
      canvasContainerRef.current?.replaceChildren(deviceCanvas);
      setActiveCpuHotspotProfilerDevice(effectiveDevice);

      animationLoop = makeAnimationLoop(props.template as unknown as typeof AnimationLoopTemplate, {
        stats: luma.stats.get('GPU Time and Memory'),
        device: effectiveDevice,
        autoResizeViewport: true,
        autoResizeDrawingBuffer: true
      });
      animationLoop.frameRate.setSampleSize(1);

      if (animationLoop) {
        await animationLoop.start();
      }
    };

    currentLumaExampleTask = currentLumaExampleTask
      .then(() => {
        if (isCancelled) {
          return;
        }

        return asyncCreateLoop();
      })
      .catch(error => {
        if (!isCancelled) {
          logError(`Example startup failed for ${effectiveDeviceType}`, error);
        }
      });

    return () => {
      isCancelled = true;

      currentLumaExampleTask = currentLumaExampleTask
        .then(() => {
          if (animationLoop) {
            if (!effectiveDevice.isLost) {
              effectiveDevice.submit();
            }
            animationLoop.destroy();
            animationLoop = null;
          }

          clearActiveCpuHotspotProfilerDevice(effectiveDevice);
          canvasContainerRef.current?.replaceChildren();
          getCanvasContainer().appendChild(deviceCanvas);
        })
        .catch(error => {
          logError(`Example cleanup failed for ${effectiveDeviceType}`, error);
        });
    };
  }, [
    effectiveDeviceType,
    effectiveDevice,
    props.template,
    props.directory,
    props.id,
    websiteBaseUrl,
    requestedDeviceTypesKey
  ]);

  // @ts-expect-error Intentionally accessing undeclared field info
  const info = props.template?.info;

  return (
    <ExamplePage
      className={props.className}
      embedded={props.embedded}
      embeddedHeight={props.embeddedHeight}
      style={{
        overflow: 'hidden',
        ...props.style
      }}
    >
      {showHeader ? (
        <ExampleHeader
          id={props.id}
          title={props.title}
          directory={props.directory}
          sourceDirectory={props.sourceDirectory}
          sourceFiles={props.sourceFiles}
          sourcePath={props.sourcePath}
          stackBlitz={props.stackBlitz}
          devices={props.devices}
        >
          {info && props.templateInfoPlacement !== 'page' ? (
            <div dangerouslySetInnerHTML={{__html: info}} />
          ) : null}
          {props.headerControls}
        </ExampleHeader>
      ) : null}
      {info && props.templateInfoPlacement === 'page' ? (
        <div
          style={{height: '100%', minHeight: 0, position: 'relative', zIndex: 1}}
          dangerouslySetInnerHTML={{__html: info}}
        />
      ) : null}
      <div style={{minHeight: 0, position: 'absolute', inset: 0}}>
        {showStats ? (
          <ExampleStats device={effectiveDevice} trackSwapChainTextureMemory />
        ) : null}
        <div
          key={effectiveDeviceType || deviceType}
          ref={canvasContainerRef}
          style={{
            ...EXAMPLE_CANVAS_STYLE,
            pointerEvents: props.templateInfoPlacement === 'page' ? 'none' : undefined
          }}
        />
      </div>
    </ExamplePage>
  );
};

function getRequestedDeviceTypes(
  devices?: DeviceTabSelection[]
): DeviceType[] | undefined {
  if (!devices) {
    return undefined;
  }

  const requestedDeviceTypes: DeviceType[] = [];
  for (const device of devices) {
    const mappedDeviceTypes =
      device === 'webgpu'
        ? (['webgpu-core', 'webgpu-max', 'webgpu-compatibility'] as const)
        : device === 'webgl2'
          ? (['webgl'] as const)
          : ([device] as const);

    for (const deviceType of mappedDeviceTypes) {
      if (!requestedDeviceTypes.includes(deviceType)) {
        requestedDeviceTypes.push(deviceType);
      }
    }
  }

  return requestedDeviceTypes;
}
