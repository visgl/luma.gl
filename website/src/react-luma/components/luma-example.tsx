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
import {StatsWidget} from '@probe.gl/stats-widget';
import type {Stat, Stats} from '@probe.gl/stats';
import {DeviceTabs} from './device-tabs';
import {
  clearActiveCpuHotspotProfilerDevice,
  setActiveCpuHotspotProfilerDevice
} from '../debug/luma-cpu-hotspot-profiler';

// import {VRDisplay} from '@luma.gl/experimental';
import {useStore} from '../store/device-store';

const GITHUB_TREE = 'https://github.com/visgl/luma.gl/tree/master';
let isInfoBoxCollapsedByDefault = true;

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
  position: 'relative',
  fontSize: '12px',
  color: '#fff',
  background: '#000',
  padding: '8px',
  opacity: 0.8,
  borderRadius: '8px',
  fontFamily: 'monospace'
};

const GPU_TIME_AND_MEMORY_STATS_FORMATTERS = {
  'Frame Rate': (stat: Stat) => `${stat.name}: ${Math.round(stat.getSampleHz())}fps`,
  'CPU Time': (stat: Stat) => `${stat.name}: ${stat.getSampleAverageTime().toFixed(2)}ms`,
  'GPU Time': (stat: Stat) => `${stat.name}: ${stat.getSampleAverageTime().toFixed(2)}ms`,
  'GPU Memory': 'memory',
  'Buffer Memory': 'memory',
  'Texture Memory': 'memory',
  'Referenced Buffer Memory': 'memory',
  'Referenced Texture Memory': 'memory',
  'Swap Chain Texture': 'memory'
} as const;

type StatFormatter = (stat: Stat) => string;
function getStatsTitle(stats: Stats): string {
  const title = stats.id;
  if (title === 'GPU Time and Memory') {
    return 'GPU Time & Memory';
  }
  return title;
}

function initializeGpuTimeAndMemoryStats() {
  return luma.stats.get('GPU Time and Memory');
}

function getAdapterLabel(device: Device | null): string {
  switch (device?.type) {
    case 'webgl':
      return 'WebGL 2';
    case 'webgpu':
      return 'WebGPU';
    default:
      return 'Unknown';
  }
}

function getGpuLabel(device: Device | null): string {
  return device?.info.gpu || 'unknown';
}

function getGpuTypeLabel(device: Device | null): string {
  return device?.info.gpuType || 'unknown';
}

function getGpuBackendLabel(device: Device | null): string {
  return device?.info.gpuBackend || 'unknown';
}

function getGpuTimeAndMemoryStatFormatters(
  device: Device | null
): Record<string, string | StatFormatter> {
  return {
    ...GPU_TIME_AND_MEMORY_STATS_FORMATTERS,
    Adapter: () => `Adapter: ${getAdapterLabel(device)}`,
    GPU: () => `GPU: ${getGpuLabel(device)}`,
    'GPU Type': () => `GPU Type: ${getGpuTypeLabel(device)}`,
    'GPU Backend': () => `GPU Backend: ${getGpuBackendLabel(device)}`
  };
}

function getDefaultCanvasColorTextureByteLength(device: Device): number {
  const canvasContext = device.canvasContext;
  if (!canvasContext) {
    return 0;
  }

  const [width, height] = canvasContext.getDrawingBufferSize();
  const formatInfo = device.getTextureFormatInfo(device.preferredColorFormat);
  return width * height * (formatInfo.bytesPerPixel || 0);
}

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
  panel?: boolean;
  showHeader?: boolean;
  showStats?: boolean;
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
  showStats?: boolean;
};

export const InfoBox: FC<InfoBoxProps> = (props: InfoBoxProps) => {
  const sourceUrl = getExampleSourceUrl(props);
  const title = getExampleTitle(props.id, props.title);
  const [isCollapsed, setIsCollapsed] = useState(() => isInfoBoxCollapsedByDefault);
  const maxInfoHeight = 400;
  const maxInfoContentHeight = 320;

  useEffect(() => {
    isInfoBoxCollapsedByDefault = isCollapsed;
  }, [isCollapsed]);

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
              minWidth: 56,
              padding: '0 12px',
              height: 28,
              fontSize: 14,
              lineHeight: 1,
              whiteSpace: 'nowrap',
              cursor: 'pointer'
            }}
          >
            {isCollapsed ? 'Info' : 'Hide'}
          </button>
        </div>
      </div>
      <div
        hidden={isCollapsed}
        aria-hidden={isCollapsed}
        style={{
          marginTop: isCollapsed ? 0 : 12,
          maxHeight: maxInfoContentHeight,
          overflowY: 'auto'
        }}
      >
        {props.html ? <div dangerouslySetInnerHTML={{__html: props.html}} /> : null}
        {props.children}
      </div>
    </div>
  );
};

export const ExamplePage: FC<ExamplePageProps> = (props: ExamplePageProps) => {
  return (
    <div
      className={props.className || 'luma-example-page'}
      style={{...EXAMPLE_CONTAINER_STYLE, ...props.style}}
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
        sourcePath={props.sourcePath}
        style={{pointerEvents: 'auto'}}
      >
        {props.children}
      </InfoBox>
      <DeviceTabs devices={props.devices} style={{flexShrink: 0, pointerEvents: 'auto'}} />
    </div>
  );
};

export function ReactExample<P>(props: ReactExampleProps<P>) {
  const Component = props.component;
  const statsPanelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (props.showStats === false || !statsPanelRef.current) {
      return;
    }

    const resourceCounts = luma.stats.get('GPU Resource Counts');
    const gpuTimeAndMemoryStats = initializeGpuTimeAndMemoryStats();
    statsPanelRef.current.replaceChildren();

    const statsWidgets = [
      new StatsWidget(gpuTimeAndMemoryStats, {
        title: getStatsTitle(gpuTimeAndMemoryStats),
        container: statsPanelRef.current,
        css: STAT_STYLES,
        formatters: getGpuTimeAndMemoryStatFormatters(null)
      }),
      new StatsWidget(resourceCounts, {
        title: getStatsTitle(resourceCounts),
        container: statsPanelRef.current,
        css: STAT_STYLES
      })
    ];

    for (const statsWidget of statsWidgets) {
      statsWidget.setCollapsed(true);
    }

    const updateStatsWidget = () => {
      for (const statsWidget of statsWidgets) {
        statsWidget.update();
      }
    };

    updateStatsWidget();
    const statsIntervalId = window.setInterval(updateStatsWidget, 250);

    return () => {
      window.clearInterval(statsIntervalId);
      for (const statsWidget of statsWidgets) {
        statsWidget.remove();
      }
      statsPanelRef.current?.replaceChildren();
    };
  }, [props.showStats]);

  return (
    <ExamplePage className={props.className} style={props.style}>
      {props.showStats !== false ? (
        <div
          ref={statsPanelRef}
          style={{
            position: 'absolute',
            right: '12px',
            bottom: '12px',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            maxHeight: 'calc(100% - 24px)',
            overflowY: 'auto',
            overflowX: 'hidden',
            alignItems: 'flex-end'
          }}
        />
      ) : null}
      <Component {...props.componentProps} />
    </ExamplePage>
  );
}

export const LumaExample: FC<LumaExampleProps> = (props: LumaExampleProps) => {
  let containerName = 'ssr';
  const showStats = props.showStats !== false && props.panel !== false;
  const showHeader = props.showHeader !== false && props.panel !== false;

  /** Each example maintains an animation loop */
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const usedCanvases = useRef(new WeakMap<HTMLCanvasElement>());
  const currentTask = useRef<Promise<void> | null>(null);
  const statsContainerRef = useRef<HTMLDivElement | null>(null);
  const statsPanelRef = useRef<HTMLDivElement | null>(null);
  const statsWidgetCollapsedState = useRef<Record<string, boolean>>({});

  /** Type type of the device (WebGL, WebGPU, ...) */
  const deviceType = useStore(store => store.deviceType);
  containerName = props.container || `luma-example-container-${deviceType}`;

  useEffect(() => {
    if (!canvas || !deviceType || usedCanvases.current.get(canvas)) return;

    usedCanvases.current.set(canvas, true);

    let animationLoop: AnimationLoop | null = null;
    let device: Device | null = null;
    let statsWidgets: StatsWidget[] = [];
    let statsIntervalId: number | null = null;
    let previousSwapChainTextureMemory = 0;
    const asyncCreateLoop = async () => {
      // canvas.style.width = '100%';
      // canvas.style.height = '100%';
      device = await luma.createDevice({
        adapters: [webgl2Adapter, webgpuAdapter],
        type: deviceType,
        debugGPUTime: true,
        createCanvasContext: {
          canvas,
          container: containerName
        }
      });
      setActiveCpuHotspotProfilerDevice(device);

      animationLoop = makeAnimationLoop(props.template as unknown as typeof AnimationLoopTemplate, {
        stats: luma.stats.get('GPU Time and Memory'),
        device,
        autoResizeViewport: true,
        autoResizeDrawingBuffer: true
      });
      animationLoop.frameRate.setSampleSize(1);

      if (showStats && statsPanelRef.current) {
        const resourceCounts = luma.stats.get('GPU Resource Counts');
        const gpuTimeAndMemoryStats = initializeGpuTimeAndMemoryStats();
        const swapChainTextureStat = gpuTimeAndMemoryStats.get('Swap Chain Texture');
        const gpuMemoryStat = gpuTimeAndMemoryStats.get('GPU Memory');
        statsPanelRef.current.replaceChildren();

        const updateSwapChainTextureMemory = (nextSwapChainTextureMemory: number) => {
          const delta = nextSwapChainTextureMemory - previousSwapChainTextureMemory;
          if (delta > 0) {
            swapChainTextureStat.addCount(delta);
            gpuMemoryStat.addCount(delta);
          } else if (delta < 0) {
            swapChainTextureStat.subtractCount(-delta);
            gpuMemoryStat.subtractCount(-delta);
          }
          previousSwapChainTextureMemory = nextSwapChainTextureMemory;
        };

        if (device) {
          updateSwapChainTextureMemory(getDefaultCanvasColorTextureByteLength(device));
        }

        statsWidgets = [
          new StatsWidget(gpuTimeAndMemoryStats, {
            title: getStatsTitle(gpuTimeAndMemoryStats),
            container: statsPanelRef.current,
            css: STAT_STYLES,
            formatters: getGpuTimeAndMemoryStatFormatters(device)
          }),
          new StatsWidget(resourceCounts, {
            title: getStatsTitle(resourceCounts),
            container: statsPanelRef.current,
            css: STAT_STYLES
          })
        ];
        for (const statsWidget of statsWidgets) {
          const collapsed = statsWidget.title
            ? statsWidgetCollapsedState.current[statsWidget.title]
            : undefined;
          statsWidget.setCollapsed(collapsed ?? true);
        }

        const updateStatsWidget = () => {
          if (device) {
            updateSwapChainTextureMemory(getDefaultCanvasColorTextureByteLength(device));
          }

          for (const statsWidget of statsWidgets) {
            statsWidget.update();
          }
        };

        updateStatsWidget();
        statsIntervalId = window.setInterval(updateStatsWidget, 250);
      }

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
          if (statsIntervalId !== null) {
            window.clearInterval(statsIntervalId);
            statsIntervalId = null;
          }
          if (previousSwapChainTextureMemory > 0) {
            const gpuTimeAndMemoryStats = luma.stats.get('GPU Time and Memory');
            gpuTimeAndMemoryStats
              .get('Swap Chain Texture')
              .subtractCount(previousSwapChainTextureMemory);
            gpuTimeAndMemoryStats.get('GPU Memory').subtractCount(previousSwapChainTextureMemory);
            previousSwapChainTextureMemory = 0;
          }
          for (const statsWidget of statsWidgets) {
            if (statsWidget.title) {
              statsWidgetCollapsedState.current[statsWidget.title] = statsWidget.collapsed;
            }
            statsWidget.remove();
          }
          statsPanelRef.current?.replaceChildren();
          statsWidgets = [];
          if (animationLoop) {
            animationLoop.destroy();
            animationLoop = null;
          }

          if (device) {
            clearActiveCpuHotspotProfilerDevice(device);
            device.destroy();
          }
        })
        .catch(error => {
          console.error(`unmounting ${deviceType} failed`, error);
        });
    };
  }, [deviceType, canvas, showStats]);

  // @ts-expect-error Intentionally accessing undeclared field info
  const info = props.template?.info;

  return (
    <ExamplePage
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
          sourcePath={props.sourcePath}
        >
          {info ? <div dangerouslySetInnerHTML={{__html: info}} /> : null}
        </ExampleHeader>
      ) : null}
      <div ref={statsContainerRef} style={{minHeight: 0, position: 'absolute', inset: 0}}>
        {showStats ? (
          <div
            ref={statsPanelRef}
            style={{
              position: 'absolute',
              right: '12px',
              bottom: '12px',
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              maxHeight: 'calc(100% - 24px)',
              overflowY: 'auto',
              overflowX: 'hidden',
              alignItems: 'flex-end'
            }}
          />
        ) : null}
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
