import React, {CSSProperties, FC, useEffect, useRef, useState} from 'react'; // eslint-disable-line
import {Device, luma} from '@luma.gl/core';
import {AnimationLoopTemplate, AnimationLoop, makeAnimationLoop, setPathPrefix} from '@luma.gl/engine';
import {StatsWidget} from '@probe.gl/stats-widget';
import type {Stat, Stats} from '@probe.gl/stats';
import {DeviceTabs} from './device-tabs';
import {
  clearActiveCpuHotspotProfilerDevice,
  setActiveCpuHotspotProfilerDevice
} from '../debug/luma-cpu-hotspot-profiler';

// import {VRDisplay} from '@luma.gl/experimental';
import {getCanvasContainer, useStore} from '../store/device-store';

const GITHUB_TREE = 'https://github.com/visgl/luma.gl/tree/master';
let isInfoBoxCollapsedByDefault = true;
const statsWidgetCollapsedStateByTitle: Record<string, boolean> = {};

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
type FrameRateController = {
  formatFrameRate: StatFormatter;
  start: () => void;
  stop: () => void;
  update: () => void;
};

const FRAME_RATE_SAMPLE_COUNT = 60;

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

function getStatsWidgetCollapsedState(statsWidget: StatsWidget): boolean {
  return statsWidget.title ? (statsWidgetCollapsedStateByTitle[statsWidget.title] ?? true) : true;
}

function storeStatsWidgetCollapsedState(statsWidget: StatsWidget): void {
  if (statsWidget.title) {
    statsWidgetCollapsedStateByTitle[statsWidget.title] = statsWidget.collapsed;
  }
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
  device: Device | null,
  frameRateFormatter?: StatFormatter
): Record<string, string | StatFormatter> {
  return {
    'Frame Rate':
      frameRateFormatter || ((stat: Stat) => `${stat.name}: ${Math.round(stat.count)}fps`),
    ...GPU_TIME_AND_MEMORY_STATS_FORMATTERS,
    Adapter: () => `Adapter: ${getAdapterLabel(device)}`,
    GPU: () => `GPU: ${getGpuLabel(device)}`,
    'GPU Type': () => `GPU Type: ${getGpuTypeLabel(device)}`,
    'GPU Backend': () => `GPU Backend: ${getGpuBackendLabel(device)}`
  };
}

function createFrameRateController(stats: Stats): FrameRateController {
  const frameRateStat = stats.get('Frame Rate');
  const cpuTimeStat = stats.get('CPU Time');
  const gpuTimeStat = stats.get('GPU Time');
  const frameDurations: number[] = [];
  let frameDurationTotal = 0;
  let previousFrameTimestamp = 0;
  let currentFrameRate = 0;
  let animationFrameId: number | null = null;

  const reset = () => {
    frameDurations.length = 0;
    frameDurationTotal = 0;
    previousFrameTimestamp = 0;
    currentFrameRate = 0;
    frameRateStat.reset();
  };

  const getAverageFrameDuration = () =>
    frameDurations.length > 0 ? frameDurationTotal / frameDurations.length : 0;

  const getStatDuration = (stat: Stat) => {
    const sampleAverageTime = stat.getSampleAverageTime();
    if (sampleAverageTime > 0) {
      return sampleAverageTime;
    }

    return stat.getAverageTime();
  };

  const updateFrameRateStat = () => {
    const estimatedFrameDuration = Math.max(
      getAverageFrameDuration(),
      getStatDuration(cpuTimeStat),
      getStatDuration(gpuTimeStat)
    );
    currentFrameRate = estimatedFrameDuration > 0 ? 1000 / estimatedFrameDuration : 0;
    frameRateStat.count = currentFrameRate;
    frameRateStat.lastTiming = estimatedFrameDuration;
    frameRateStat.lastSampleTime = estimatedFrameDuration;
    frameRateStat.lastSampleCount = currentFrameRate;
  };

  const trackFrame = (timestamp: number) => {
    if (previousFrameTimestamp > 0) {
      const frameDuration = timestamp - previousFrameTimestamp;
      if (frameDuration > 0) {
        frameDurations.push(frameDuration);
        frameDurationTotal += frameDuration;
        if (frameDurations.length > FRAME_RATE_SAMPLE_COUNT) {
          frameDurationTotal -= frameDurations.shift() || 0;
        }
      }
    }

    previousFrameTimestamp = timestamp;
    animationFrameId = window.requestAnimationFrame(trackFrame);
  };

  return {
    formatFrameRate: stat =>
      `${stat.name}: ${currentFrameRate.toFixed(currentFrameRate >= 10 ? 0 : 1)}fps`,
    start: () => {
      reset();
      animationFrameId = window.requestAnimationFrame(trackFrame);
    },
    stop: () => {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      reset();
    },
    update: updateFrameRateStat
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
  const toggleCollapsed = () => setIsCollapsed(value => !value);

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
        <button
          type="button"
          aria-label={isCollapsed ? 'Expand info box' : 'Collapse info box'}
          onClick={toggleCollapsed}
          style={{
            minWidth: 0,
            flex: '1 1 auto',
            padding: 0,
            border: 'none',
            background: 'transparent',
            textAlign: 'left',
            cursor: 'pointer',
            color: 'inherit'
          }}
        >
          {title ? <h3 style={{marginTop: 0, marginBottom: 0}}>{title}</h3> : null}
        </button>
        <div style={{display: 'flex', alignItems: 'center', gap: 24, flexShrink: 0}}>
          {sourceUrl ? (
            <a href={sourceUrl} target="_blank" rel="noreferrer">
              Source code
            </a>
          ) : null}
          <button
            type="button"
            aria-label={isCollapsed ? 'Expand info box' : 'Collapse info box'}
            onClick={toggleCollapsed}
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
    const frameRateController = createFrameRateController(gpuTimeAndMemoryStats);
    statsPanelRef.current.replaceChildren();
    frameRateController.start();

    const statsWidgets = [
      new StatsWidget(gpuTimeAndMemoryStats, {
        title: getStatsTitle(gpuTimeAndMemoryStats),
        container: statsPanelRef.current,
        css: STAT_STYLES,
        formatters: getGpuTimeAndMemoryStatFormatters(null, frameRateController.formatFrameRate)
      }),
      new StatsWidget(resourceCounts, {
        title: getStatsTitle(resourceCounts),
        container: statsPanelRef.current,
        css: STAT_STYLES
      })
    ];

    for (const statsWidget of statsWidgets) {
      statsWidget.setCollapsed(getStatsWidgetCollapsedState(statsWidget));
    }

    const updateStatsWidget = () => {
      frameRateController.update();
      for (const statsWidget of statsWidgets) {
        statsWidget.update();
      }
    };

    updateStatsWidget();
    const statsIntervalId = window.setInterval(updateStatsWidget, 250);

    return () => {
      window.clearInterval(statsIntervalId);
      frameRateController.stop();
      for (const statsWidget of statsWidgets) {
        storeStatsWidgetCollapsedState(statsWidget);
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
  const showStats = props.showStats !== false && props.panel !== false;
  const showHeader = props.showHeader !== false && props.panel !== false;

  /** Each example maintains an animation loop */
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const currentTask = useRef<Promise<void> | null>(null);
  const statsContainerRef = useRef<HTMLDivElement | null>(null);
  const statsPanelRef = useRef<HTMLDivElement | null>(null);

  /** Type type of the device (WebGL, WebGPU, ...) */
  const deviceType = useStore(store => store.deviceType);
  const device = useStore(store => store.device);

  useEffect(() => {
    if (!canvasContainerRef.current || !deviceType || !device) {
      return;
    }

    let animationLoop: AnimationLoop | null = null;
    let statsWidgets: StatsWidget[] = [];
    let statsIntervalId: number | null = null;
    let previousSwapChainTextureMemory = 0;
    const defaultCanvasContext = device.getDefaultCanvasContext();
    const deviceCanvas = defaultCanvasContext.canvas;
    let frameRateController: FrameRateController | null = null;
    const asyncCreateLoop = async () => {
      if (!(deviceCanvas instanceof HTMLCanvasElement)) {
        throw new Error('Website examples require the shared device canvas to be an HTMLCanvasElement');
      }

      deviceCanvas.style.display = EXAMPLE_CANVAS_STYLE.display;
      deviceCanvas.style.width = EXAMPLE_CANVAS_STYLE.width;
      deviceCanvas.style.height = EXAMPLE_CANVAS_STYLE.height;
      canvasContainerRef.current?.replaceChildren(deviceCanvas);
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
        frameRateController = createFrameRateController(gpuTimeAndMemoryStats);
        statsPanelRef.current.replaceChildren();
        frameRateController.start();

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
            formatters: getGpuTimeAndMemoryStatFormatters(
              device,
              frameRateController.formatFrameRate
            )
          }),
          new StatsWidget(resourceCounts, {
            title: getStatsTitle(resourceCounts),
            container: statsPanelRef.current,
            css: STAT_STYLES
          })
        ];
        for (const statsWidget of statsWidgets) {
          statsWidget.setCollapsed(getStatsWidgetCollapsedState(statsWidget));
        }

        const updateStatsWidget = () => {
          if (device) {
            updateSwapChainTextureMemory(getDefaultCanvasColorTextureByteLength(device));
          }

          frameRateController?.update();

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
          frameRateController?.stop();
          frameRateController = null;
          if (previousSwapChainTextureMemory > 0) {
            const gpuTimeAndMemoryStats = luma.stats.get('GPU Time and Memory');
            gpuTimeAndMemoryStats
              .get('Swap Chain Texture')
              .subtractCount(previousSwapChainTextureMemory);
            gpuTimeAndMemoryStats.get('GPU Memory').subtractCount(previousSwapChainTextureMemory);
            previousSwapChainTextureMemory = 0;
          }
          for (const statsWidget of statsWidgets) {
            storeStatsWidgetCollapsedState(statsWidget);
            statsWidget.remove();
          }
          statsPanelRef.current?.replaceChildren();
          statsWidgets = [];
          if (animationLoop) {
            animationLoop.destroy();
            animationLoop = null;
          }

          clearActiveCpuHotspotProfilerDevice(device);
          canvasContainerRef.current?.replaceChildren();
          getCanvasContainer().appendChild(deviceCanvas);
        })
        .catch(error => {
          console.error(`unmounting ${deviceType} failed`, error);
        });
    };
  }, [deviceType, device, showStats, props.template, props.directory, props.id]);

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
        <div key={deviceType} ref={canvasContainerRef} style={EXAMPLE_CANVAS_STYLE} />
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
