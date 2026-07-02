import React, {CSSProperties, FC, useEffect, useRef, useState} from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import CodeBlock from '@theme/CodeBlock';
import {PanelContainer, type Panel, type PanelPlacement} from '@deck.gl-community/panels';
import {createRoot, type Root} from 'react-dom/client';
import {
  configurePanelHostElement,
  renderExamplePanel
} from '../../../../examples/example-panels';

const GITHUB_TREE = 'https://github.com/visgl/luma.gl/tree/master';
const INFO_BOX_DEFAULT_WIDTH = 420;
const INFO_BOX_MIN_WIDTH = 280;
const INFO_BOX_MIN_HEIGHT = 160;
const INFO_BOX_VIEWPORT_RIGHT_MARGIN = 20;
const INFO_BOX_VIEWPORT_BOTTOM_MARGIN = 12;
const INFO_BOX_KEYBOARD_RESIZE_STEP = 10;
const INFO_BOX_LARGE_KEYBOARD_RESIZE_STEP = 30;
const INFO_BOX_STYLE: CSSProperties = {
  boxSizing: 'border-box',
  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.28)',
  backgroundColor: 'rgba(255, 255, 255, 0.96)',
  borderRadius: 12,
  color: '#111',
  width: 420,
  minWidth: 0,
  maxWidth: 'calc(100vw - 40px)',
  overflow: 'hidden',
  padding: '10px 16px',
  zIndex: 10
};

let isInfoBoxCollapsedByDefault = true;

export type ExampleInfoProps = {
  directory?: string;
  id?: string;
  sourceDirectory?: string;
  sourceFiles?: string[];
  sourcePath?: string;
  stackBlitz?: boolean;
  title?: string;
};

export type InfoBoxProps = React.PropsWithChildren<
  ExampleInfoProps & {
    html?: string;
    panel?: Panel;
    style?: CSSProperties;
  }
>;

type InfoBoxViewProps = InfoBoxProps & {
  websiteBaseUrl: string;
};

type InfoBoxSize = {
  width: number;
  height: number;
};

type InfoBoxResizeState = {
  pointerId: number;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
};

type ExampleSourceFile = {
  path: string;
  source: string;
};

/** Panel-framework mount for the website InfoBox chrome and panel content. */
export class InfoBoxPanelContainer extends PanelContainer {
  className = 'luma-info-box-panel-container';
  placement: PanelPlacement = 'top-left';
  private infoBoxProps: InfoBoxViewProps;
  private hostElement: HTMLElement | null = null;
  private reactRoot: Root | null = null;

  constructor(props: InfoBoxViewProps) {
    super({panel: props.panel, placement: 'top-left'});
    this.infoBoxProps = props;
  }

  setInfoBoxProps(props: InfoBoxViewProps): void {
    this.infoBoxProps = props;
    this.setProps({panel: props.panel});
  }

  renderReact(): React.ReactElement {
    return <InfoBoxView {...this.infoBoxProps} />;
  }

  override onRenderHTML(rootElement: HTMLElement): void {
    if (this.hostElement !== rootElement) {
      this.reactRoot?.unmount();
      this.hostElement = rootElement;
      this.reactRoot = createRoot(rootElement);
    }
    this.reactRoot?.render(this.renderReact());
  }

  override onRemove(): void {
    this.reactRoot?.unmount();
    this.reactRoot = null;
    this.hostElement = null;
  }
}

/** React adapter that mounts the panel-backed InfoBox into Docusaurus content. */
export const InfoBox: FC<InfoBoxProps> = (props: InfoBoxProps) => {
  const {siteConfig} = useDocusaurusContext();
  const websiteBaseUrl = siteConfig.baseUrl.endsWith('/')
    ? siteConfig.baseUrl
    : `${siteConfig.baseUrl}/`;
  const containerRef = useRef<InfoBoxPanelContainer | null>(null);
  const infoBoxProps = {...props, websiteBaseUrl};

  containerRef.current ||= new InfoBoxPanelContainer(infoBoxProps);
  containerRef.current.setInfoBoxProps(infoBoxProps);
  return containerRef.current.renderReact();
};

function InfoBoxView(props: InfoBoxViewProps) {
  const sourceUrl = getExampleSourceUrl(props);
  const sourcePaths = React.useMemo(
    () => getExampleSourcePaths(props),
    [props.directory, props.id, props.sourceDirectory, props.sourceFiles, props.sourcePath]
  );
  const sourcePathsKey = sourcePaths.join('|');
  const title = getExampleTitle(props.id, props.title);
  const [isCollapsed, setIsCollapsed] = useState(() => isInfoBoxCollapsedByDefault);
  const [activeTab, setActiveTab] = useState<'info' | 'source'>('info');
  const [activeSourcePath, setActiveSourcePath] = useState('');
  const [infoBoxSize, setInfoBoxSize] = useState<InfoBoxSize | null>(null);
  const [sourceResult, setSourceResult] = useState<{
    key: string;
    files?: ExampleSourceFile[];
    error?: string;
  } | null>(null);
  const infoBoxRef = useRef<HTMLDivElement | null>(null);
  const infoContentRef = useRef<HTMLDivElement | null>(null);
  const panelHostRef = useRef<HTMLDivElement | null>(null);
  const resizeStateRef = useRef<InfoBoxResizeState | null>(null);
  const [hasPanelTabs, setHasPanelTabs] = useState(false);
  const toggleCollapsed = () => setIsCollapsed(value => !value);
  const currentSourceResult = sourceResult?.key === sourcePathsKey ? sourceResult : null;

  useEffect(() => {
    isInfoBoxCollapsedByDefault = isCollapsed;
  }, [isCollapsed]);

  useEffect(() => {
    if (activeTab !== 'source' || sourcePaths.length === 0 || currentSourceResult) {
      return;
    }

    const abortController = new AbortController();
    void fetchExampleSources(props.websiteBaseUrl, sourcePaths, abortController.signal)
      .then(files => {
        setSourceResult({key: sourcePathsKey, files});
        setActiveSourcePath(files[0]?.path || '');
      })
      .catch(error => {
        if (!abortController.signal.aborted) {
          setSourceResult({
            key: sourcePathsKey,
            error: error instanceof Error ? error.message : 'Unable to load source code.'
          });
        }
      });

    return () => abortController.abort();
  }, [activeTab, currentSourceResult, props.websiteBaseUrl, sourcePaths, sourcePathsKey]);

  useEffect(() => {
    const infoContentElement = infoContentRef.current;
    if (!infoContentElement || sourcePaths.length === 0) {
      setHasPanelTabs(false);
      return;
    }

    const updateHasPanelTabs = () => {
      setHasPanelTabs(Boolean(infoContentElement.querySelector('[data-panel-tabs]')));
    };

    updateHasPanelTabs();
    const observer = new MutationObserver(updateHasPanelTabs);
    observer.observe(infoContentElement, {childList: true, subtree: true});
    return () => observer.disconnect();
  }, [sourcePaths.length]);

  useEffect(() => {
    const panelHostElement = panelHostRef.current;
    if (!panelHostElement || !props.panel) {
      return;
    }

    configurePanelHostElement(panelHostElement);
    renderExamplePanel(panelHostElement, props.panel);
    return () => renderExamplePanel(panelHostElement, null);
  }, [props.panel]);

  const handleResizePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    const infoBoxElement = infoBoxRef.current;
    if (!infoBoxElement) {
      return;
    }

    const rect = infoBoxElement.getBoundingClientRect();
    resizeStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: rect.width,
      startHeight: rect.height
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  const handleResizePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const infoBoxElement = infoBoxRef.current;
    const resizeState = resizeStateRef.current;
    if (!infoBoxElement || !resizeState || resizeState.pointerId !== event.pointerId) {
      return;
    }

    setInfoBoxSize(
      clampInfoBoxSize(
        infoBoxElement,
        resizeState.startWidth + event.clientX - resizeState.startX,
        resizeState.startHeight + event.clientY - resizeState.startY
      )
    );
  };

  const finishResize = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (resizeStateRef.current?.pointerId !== event.pointerId) {
      return;
    }

    resizeStateRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleResizeKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const infoBoxElement = infoBoxRef.current;
    if (!infoBoxElement) {
      return;
    }

    const resizeStep = event.shiftKey
      ? INFO_BOX_LARGE_KEYBOARD_RESIZE_STEP
      : INFO_BOX_KEYBOARD_RESIZE_STEP;
    const widthDelta =
      event.key === 'ArrowLeft' ? -resizeStep : event.key === 'ArrowRight' ? resizeStep : 0;
    const heightDelta =
      event.key === 'ArrowUp' ? -resizeStep : event.key === 'ArrowDown' ? resizeStep : 0;
    if (widthDelta === 0 && heightDelta === 0) {
      return;
    }

    const rect = infoBoxElement.getBoundingClientRect();
    setInfoBoxSize(currentSize =>
      clampInfoBoxSize(
        infoBoxElement,
        (currentSize?.width ?? rect.width) + widthDelta,
        (currentSize?.height ?? rect.height) + heightDelta
      )
    );
    event.preventDefault();
  };

  const activeSourceFile =
    currentSourceResult?.files?.find(file => file.path === activeSourcePath) ||
    currentSourceResult?.files?.[0];
  const sourceContent = currentSourceResult?.error ? (
    <p style={{margin: 0, color: '#b00020'}}>{currentSourceResult.error}</p>
  ) : (
    <CodeBlock language={getSourceLanguage(activeSourceFile?.path)}>
      {activeSourceFile?.source ?? '// Loading source…'}
    </CodeBlock>
  );

  return (
    <div
      ref={infoBoxRef}
      style={{
        ...INFO_BOX_STYLE,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        width: infoBoxSize?.width ?? INFO_BOX_DEFAULT_WIDTH,
        height: isCollapsed ? undefined : infoBoxSize?.height,
        maxHeight: isCollapsed ? undefined : 'calc(100vh - var(--ifm-navbar-height) - 24px)',
        ...props.style
      }}
    >
      <div style={{display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12}}>
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
              GitHub
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
          minWidth: 0,
          minHeight: 0,
          flex: '1 1 auto',
          display: isCollapsed ? 'none' : 'flex',
          flexDirection: 'column',
          overflowY: 'auto'
        }}
      >
        {sourcePaths.length > 0 && !hasPanelTabs ? (
          <div role="tablist" aria-label="Example information" style={{display: 'flex', gap: 4, marginBottom: 12}}>
            {(['info', 'source'] as const).map(tab => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  padding: '4px 9px',
                  background: activeTab === tab ? '#e2e8f0' : '#fff',
                  color: '#0f172a',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: activeTab === tab ? 700 : 500
                }}
              >
                {tab === 'info' ? 'Info' : 'Source'}
              </button>
            ))}
          </div>
        ) : null}
        <div
          ref={infoContentRef}
          hidden={!hasPanelTabs && activeTab !== 'info'}
          aria-hidden={!hasPanelTabs && activeTab !== 'info'}
          style={{minWidth: 0, minHeight: 0, flex: '1 1 auto', overflow: 'auto'}}
        >
          {props.html ? <div dangerouslySetInnerHTML={{__html: props.html}} /> : null}
          {props.children}
          {props.panel ? <div ref={panelHostRef} /> : null}
        </div>
        {sourcePaths.length > 0 && !hasPanelTabs ? (
          <div
            hidden={activeTab !== 'source'}
            aria-hidden={activeTab !== 'source'}
            style={{
              minWidth: 0,
              minHeight: 0,
              flex: '1 1 auto',
              maxWidth: '100%',
              overflow: 'auto',
              background: '#f6f8fa'
            }}
          >
            {currentSourceResult?.files && currentSourceResult.files.length > 0 ? (
              <div
                role="tablist"
                aria-label="Example source files"
                style={{
                  alignItems: 'center',
                  background: '#eef2f6',
                  display: 'flex',
                  gap: 4,
                  overflowX: 'auto',
                  padding: '8px'
                }}
              >
                {currentSourceResult.files.map(file => (
                  <button
                    key={file.path}
                    type="button"
                    role="tab"
                    aria-selected={file.path === activeSourceFile?.path}
                    onClick={() => setActiveSourcePath(file.path)}
                    style={{
                      background: file.path === activeSourceFile?.path ? '#fff' : 'transparent',
                      border: '1px solid #cbd5e1',
                      borderRadius: 5,
                      color: '#0f172a',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: file.path === activeSourceFile?.path ? 700 : 500,
                      padding: '4px 8px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {file.path.split('/').at(-1)}
                  </button>
                ))}
                {props.stackBlitz ? (
                  <button
                    type="button"
                    onClick={() => void openExampleInStackBlitz(title, currentSourceResult.files || [])}
                    style={{
                      background: '#146ef5',
                      border: 0,
                      borderRadius: 5,
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 700,
                      marginLeft: 'auto',
                      padding: '5px 9px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Edit in StackBlitz
                  </button>
                ) : null}
              </div>
            ) : null}
            {sourceContent}
          </div>
        ) : null}
      </div>
      {!isCollapsed ? (
        <button
          type="button"
          aria-label="Resize info box"
          title="Resize info box"
          onPointerDown={handleResizePointerDown}
          onPointerMove={handleResizePointerMove}
          onPointerUp={finishResize}
          onPointerCancel={finishResize}
          onKeyDown={handleResizeKeyDown}
          style={{
            position: 'absolute',
            right: 6,
            bottom: 6,
            zIndex: 100,
            display: 'grid',
            placeItems: 'center',
            width: 28,
            height: 28,
            padding: 0,
            border: '1px solid #94a3b8',
            borderRadius: 6,
            background: '#e2e8f0',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.18)',
            color: '#334155',
            cursor: 'nwse-resize',
            fontSize: 19,
            lineHeight: 1,
            touchAction: 'none',
            userSelect: 'none'
          }}
        >
          <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16">
            <path
              d="M4 14L14 4M9 14L14 9M13 14L14 13"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="1.75"
            />
          </svg>
        </button>
      ) : null}
    </div>
  );
}

function getInfoBoxSizeBounds(infoBoxElement: HTMLElement): {
  minWidth: number;
  minHeight: number;
  maxWidth: number;
  maxHeight: number;
} {
  const rect = infoBoxElement.getBoundingClientRect();
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const maxWidth = Math.max(1, viewportWidth - rect.left - INFO_BOX_VIEWPORT_RIGHT_MARGIN);
  const maxHeight = Math.max(1, viewportHeight - rect.top - INFO_BOX_VIEWPORT_BOTTOM_MARGIN);

  return {
    minWidth: Math.min(INFO_BOX_MIN_WIDTH, maxWidth),
    minHeight: Math.min(INFO_BOX_MIN_HEIGHT, maxHeight),
    maxWidth,
    maxHeight
  };
}

function clampInfoBoxSize(infoBoxElement: HTMLElement, width: number, height: number): InfoBoxSize {
  const {minWidth, minHeight, maxWidth, maxHeight} = getInfoBoxSizeBounds(infoBoxElement);
  return {
    width: Math.min(maxWidth, Math.max(minWidth, width)),
    height: Math.min(maxHeight, Math.max(minHeight, height))
  };
}

function getExampleSourceUrl(props: ExampleInfoProps): string | null {
  if (props.sourcePath) {
    return `${GITHUB_TREE}/${props.sourcePath}`;
  }
  if (props.id && (props.sourceDirectory || props.directory)) {
    const sourceDirectory = props.sourceDirectory || props.directory;
    return `${GITHUB_TREE}/examples/${sourceDirectory}/${props.id}`;
  }
  return null;
}

function getExampleSourcePaths(props: ExampleInfoProps): string[] {
  if (props.sourceFiles && props.sourceFiles.length > 0) {
    const sourceRoot = getExampleSourceRoot(props);
    return sourceRoot ? props.sourceFiles.map(file => `${sourceRoot}/${file}`) : props.sourceFiles;
  }

  if (props.sourcePath) {
    const sourcePath = props.sourcePath.replace(/^\/?examples\//, '').replace(/^\//, '');
    if (/\.(?:[cm]?[jt]sx?)$/.test(sourcePath)) {
      return [sourcePath];
    }
    return [
      `${sourcePath}/app.ts`,
      `${sourcePath}/app.tsx`,
      `${sourcePath}/index.html`,
      `${sourcePath}/package.json`
    ];
  }

  if (props.id && (props.sourceDirectory || props.directory)) {
    const sourceDirectory = props.sourceDirectory || props.directory;
    return [
      `${sourceDirectory}/${props.id}/app.ts`,
      `${sourceDirectory}/${props.id}/app.tsx`,
      `${sourceDirectory}/${props.id}/index.html`,
      `${sourceDirectory}/${props.id}/package.json`
    ];
  }

  return [];
}

function getExampleSourceRoot(props: ExampleInfoProps): string | null {
  if (props.sourcePath) {
    return props.sourcePath.replace(/^\/?examples\//, '').replace(/^\//, '');
  }
  if (props.id && (props.sourceDirectory || props.directory)) {
    return `${props.sourceDirectory || props.directory}/${props.id}`;
  }
  return null;
}

async function fetchExampleSources(
  websiteBaseUrl: string,
  sourcePaths: readonly string[],
  signal: AbortSignal
): Promise<ExampleSourceFile[]> {
  const sourceFiles: ExampleSourceFile[] = [];
  for (const sourcePath of sourcePaths) {
    const response = await fetch(`${websiteBaseUrl}example-assets/${sourcePath}`, {signal});
    if (response.ok) {
      sourceFiles.push({path: sourcePath, source: await response.text()});
    }
  }

  if (sourceFiles.length === 0) {
    throw new Error('Unable to load source code.');
  }
  return sourceFiles;
}

function getSourceLanguage(path?: string): string {
  if (path?.endsWith('.tsx')) return 'tsx';
  if (path?.endsWith('.html')) return 'html';
  if (path?.endsWith('.json')) return 'json';
  return 'typescript';
}

async function openExampleInStackBlitz(
  title: string,
  sourceFiles: ExampleSourceFile[]
): Promise<void> {
  const {default: sdk} = await import('@stackblitz/sdk');
  const files = Object.fromEntries(
    sourceFiles.map(file => [file.path.split('/').at(-1) || file.path, file.source])
  );
  await sdk.openProject(
    {
      title: `luma.gl: ${title}`,
      description: 'Runnable luma.gl example from the official documentation.',
      template: 'node',
      files
    },
    {
      newWindow: true,
      openFile: files['app.tsx'] ? 'app.tsx' : 'app.ts',
      startScript: 'start'
    }
  );
}

function getExampleTitle(id?: string, title?: string): string {
  if (title) {
    return title;
  }
  if (id) {
    return id.split('-').map(capitalizeFirstLetter).join(' ');
  }
  return '';
}

function capitalizeFirstLetter(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
