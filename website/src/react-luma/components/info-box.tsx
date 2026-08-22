import React, {CSSProperties, FC, useEffect, useRef, useState} from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import CodeBlock from '@theme/CodeBlock';
import {PanelContainer, type Panel, type PanelPlacement} from '@deck.gl-community/panels';
import {createRoot, type Root} from 'react-dom/client';
import {
  configurePanelHostElement,
  renderExamplePanel,
  type ExamplePanelAppearance
} from '../../../../examples/example-panels';
import {applyExampleTheme, EXAMPLE_THEME_TOKENS} from '../../../../examples/example-theme';

const GITHUB_TREE = 'https://github.com/visgl/luma.gl/tree/master';
const INFO_BOX_DEFAULT_WIDTH = 420;
const INFO_BOX_MIN_WIDTH = 280;
const INFO_BOX_MIN_HEIGHT = 160;
const INFO_BOX_VIEWPORT_RIGHT_MARGIN = 20;
const INFO_BOX_VIEWPORT_BOTTOM_MARGIN = 12;
const INFO_BOX_KEYBOARD_RESIZE_STEP = 10;
const INFO_BOX_LARGE_KEYBOARD_RESIZE_STEP = 30;
const INFO_BOX_BASE_STYLE: CSSProperties = {
  boxSizing: 'border-box',
  borderRadius: 'var(--luma-example-radius, 14px)',
  width: 420,
  minWidth: 0,
  maxWidth: '100%',
  overflow: 'hidden',
  padding: '13px 15px',
  zIndex: 10
};
const INFO_BOX_APPEARANCE_STYLES: Record<InfoBoxAppearance, CSSProperties> = {
  cinematic: {
    backdropFilter: `var(--luma-example-backdrop, ${EXAMPLE_THEME_TOKENS.cinematic.backdrop})`,
    background:
      'radial-gradient(ellipse at 12% 0%, rgba(56, 189, 248, 0.08), transparent 42%), linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(5, 12, 24, 0.91))',
    border: `1px solid var(--luma-example-border, ${EXAMPLE_THEME_TOKENS.cinematic.border})`,
    boxShadow: `var(--luma-example-shadow, ${EXAMPLE_THEME_TOKENS.cinematic.shadow})`,
    color: `var(--luma-example-text, ${EXAMPLE_THEME_TOKENS.cinematic.text})`,
    colorScheme: 'dark',
    WebkitBackdropFilter: `var(--luma-example-backdrop, ${EXAMPLE_THEME_TOKENS.cinematic.backdrop})`
  },
  light: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    border: `1px solid var(--luma-example-border, ${EXAMPLE_THEME_TOKENS.light.border})`,
    boxShadow: `var(--luma-example-shadow, ${EXAMPLE_THEME_TOKENS.light.shadow})`,
    color: `var(--luma-example-text, ${EXAMPLE_THEME_TOKENS.light.text})`,
    colorScheme: 'light'
  }
};
const INFO_BOX_CHROME_STYLE = `
[data-info-box-appearance] [data-luma-example-chrome-action] {
  transition: border-color 150ms ease, background-color 150ms ease, color 150ms ease;
}
[data-info-box-appearance] [data-luma-example-chrome-action]:hover,
[data-info-box-appearance] [data-luma-example-chrome-action]:focus-visible {
  border-color: var(--luma-example-accent) !important;
  color: var(--luma-example-accent) !important;
}
[data-info-box-appearance] [data-luma-example-chrome-action]:focus-visible {
  outline: 2px solid var(--luma-example-accent);
  outline-offset: 2px;
}
[data-luma-example-source] .theme-code-block,
[data-luma-example-source] .theme-code-block pre,
[data-luma-example-source] .theme-code-block code {
  background: var(--luma-example-surface) !important;
  color: var(--luma-example-text) !important;
}
[data-luma-example-source] .theme-code-block {
  margin: 0 !important;
  border: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
}
[data-luma-example-source] .theme-code-block pre {
  margin: 0 !important;
  padding: 14px !important;
}
[data-info-box-appearance='cinematic'] [data-luma-example-source] .token.comment {
  color: var(--luma-example-text-muted) !important;
}
@media (prefers-reduced-motion: reduce) {
  [data-info-box-appearance] [data-luma-example-chrome-action] {
    transition: none;
  }
}
`;

let isInfoBoxCollapsedByDefault = true;

export type ExampleInfoProps = {
  directory?: string;
  id?: string;
  sourceDirectory?: string;
  sourceFiles?: string[];
  sourcePath?: string;
  stackBlitz?: boolean;
  subtitle?: string;
  title?: string;
};

export type InfoBoxAppearance = Extract<ExamplePanelAppearance, 'cinematic' | 'light'>;

export type InfoBoxProps = React.PropsWithChildren<
  ExampleInfoProps & {
    html?: string;
    /** Visual treatment shared by the InfoBox chrome and its panel content. */
    appearance?: InfoBoxAppearance;
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

type InfoBoxSizeBounds = {
  minWidth: number;
  minHeight: number;
  maxWidth: number;
  maxHeight: number;
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
  const appearance = props.appearance ?? 'cinematic';
  const theme = EXAMPLE_THEME_TOKENS[appearance];
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
  const [infoBoxSizeBounds, setInfoBoxSizeBounds] = useState<InfoBoxSizeBounds | null>(null);
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
  const contentId = React.useId();
  const setInfoBoxElement = React.useCallback(
    (element: HTMLDivElement | null) => {
      infoBoxRef.current = element;
      if (element) {
        applyExampleTheme(element, appearance);
      }
    },
    [appearance]
  );
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

    configurePanelHostElement(panelHostElement, appearance);
    renderExamplePanel(panelHostElement, props.panel);
    return () => renderExamplePanel(panelHostElement, null);
  }, [appearance, props.panel]);

  useEffect(() => {
    const infoBoxElement = infoBoxRef.current;
    if (!infoBoxElement) {
      return;
    }

    const boundaryElement = getInfoBoxBoundaryElement(infoBoxElement);
    const updateSizeBounds = () => {
      const nextBounds = getInfoBoxSizeBounds(infoBoxElement);
      setInfoBoxSizeBounds(currentBounds =>
        areInfoBoxSizeBoundsEqual(currentBounds, nextBounds) ? currentBounds : nextBounds
      );
      setInfoBoxSize(currentSize =>
        currentSize ? clampInfoBoxSizeToBounds(currentSize, nextBounds) : currentSize
      );
    };

    updateSizeBounds();
    window.addEventListener('resize', updateSizeBounds);
    window.addEventListener('scroll', updateSizeBounds, {capture: true, passive: true});
    const resizeObserver =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(updateSizeBounds);
    if (boundaryElement) {
      resizeObserver?.observe(boundaryElement);
    }

    return () => {
      window.removeEventListener('resize', updateSizeBounds);
      window.removeEventListener('scroll', updateSizeBounds, true);
      resizeObserver?.disconnect();
    };
  }, [isCollapsed]);

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
    <p
      role="alert"
      style={{
        margin: 0,
        padding: '12px 14px',
        color: appearance === 'cinematic' ? '#fda4af' : '#be123c',
        fontSize: 12,
        lineHeight: 1.5
      }}
    >
      {currentSourceResult.error}
    </p>
  ) : (
    <CodeBlock language={getSourceLanguage(activeSourceFile?.path)}>
      {activeSourceFile?.source ?? '// Loading source…'}
    </CodeBlock>
  );

  return (
    <div
      ref={setInfoBoxElement}
      data-info-box-appearance={appearance}
      data-luma-info-box-collapsed={isCollapsed ? 'true' : 'false'}
      style={{
        ...INFO_BOX_BASE_STYLE,
        ...INFO_BOX_APPEARANCE_STYLES[appearance],
        ...props.style,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        width: infoBoxSize?.width ?? props.style?.width ?? INFO_BOX_DEFAULT_WIDTH,
        height: isCollapsed ? undefined : (infoBoxSize?.height ?? props.style?.height),
        maxWidth: infoBoxSizeBounds?.maxWidth ?? '100%',
        maxHeight: isCollapsed ? undefined : infoBoxSizeBounds?.maxHeight
      }}
    >
      <style>{INFO_BOX_CHROME_STYLE}</style>
      <div
        data-luma-example-info-header=""
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
          aria-expanded={!isCollapsed}
          aria-controls={contentId}
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
          {title ? (
            <span style={{display: 'flex', alignItems: 'center', gap: 8}}>
              <span
                aria-hidden="true"
                style={{
                  width: 7,
                  height: 7,
                  flex: '0 0 7px',
                  borderRadius: '50%',
                  background: `var(--luma-example-accent, ${theme.accent})`,
                  boxShadow: `0 0 12px var(--luma-example-accent, ${theme.accent})`
                }}
              />
              <h3
                data-luma-example-title=""
                style={{
                  color: 'inherit',
                  fontSize: 17,
                  fontWeight: 720,
                  letterSpacing: '-0.022em',
                  lineHeight: 1.3,
                  marginTop: 0,
                  marginBottom: 0
                }}
              >
                {title}
              </h3>
            </span>
          ) : null}
          {props.subtitle ? (
            <div
              data-luma-example-subtitle=""
              style={{
                color: `var(--luma-example-text-muted, ${theme.textMuted})`,
                fontSize: 12,
                lineHeight: 1.4,
                marginTop: 5,
                paddingLeft: title ? 15 : 0
              }}
            >
              {props.subtitle}
            </div>
          ) : null}
        </button>
        <div
          data-luma-example-chrome-actions=""
          style={{display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0}}
        >
          {sourceUrl ? (
            <a
              data-luma-example-chrome-action=""
              data-luma-example-source-link=""
              href={sourceUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                minHeight: 29,
                padding: '0 8px',
                border: `1px solid var(--luma-example-border, ${theme.border})`,
                borderRadius: 8,
                background: `var(--luma-example-surface-raised, ${theme.surfaceRaised})`,
                color: `var(--luma-example-text-muted, ${theme.textMuted})`,
                fontSize: 11,
                fontWeight: 650,
                textDecoration: 'none'
              }}
            >
              <svg aria-hidden="true" viewBox="0 0 16 16" width="13" height="13">
                <path
                  d="M8 1.5a6.5 6.5 0 0 0-2.06 12.67c.33.06.45-.14.45-.32v-1.13c-1.84.4-2.23-.79-2.23-.79-.3-.75-.73-.95-.73-.95-.6-.4.04-.4.04-.4.66.05 1 .68 1 .68.59 1 1.54.71 1.91.54.06-.43.23-.72.41-.89-1.46-.17-3-.72-3-3.24 0-.72.25-1.31.68-1.77-.07-.17-.3-.83.07-1.73 0 0 .56-.18 1.83.68a6.39 6.39 0 0 1 3.33 0c1.27-.86 1.83-.68 1.83-.68.36.9.13 1.56.06 1.73.43.46.69 1.05.69 1.77 0 2.53-1.54 3.07-3.01 3.23.24.21.45.62.45 1.25v1.85c0 .18.12.38.45.32A6.5 6.5 0 0 0 8 1.5Z"
                  fill="currentColor"
                />
              </svg>
              <span data-luma-example-source-label="">GitHub</span>
            </a>
          ) : null}
          <button
            data-luma-example-chrome-action=""
            data-luma-example-info-toggle=""
            type="button"
            aria-label={isCollapsed ? 'Expand info box' : 'Collapse info box'}
            aria-expanded={!isCollapsed}
            aria-controls={contentId}
            onClick={toggleCollapsed}
            style={{
              flexShrink: 0,
              border: `1px solid var(--luma-example-border, ${theme.border})`,
              background: `var(--luma-example-surface-raised, ${theme.surfaceRaised})`,
              borderRadius: 999,
              color: `var(--luma-example-text, ${theme.text})`,
              minWidth: 56,
              padding: '0 11px',
              height: 29,
              fontSize: 11,
              fontWeight: 650,
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
        id={contentId}
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
          <div
            role="tablist"
            aria-label="Example information"
            style={{
              display: 'flex',
              gap: 5,
              marginBottom: 12,
              paddingBottom: 11,
              borderBottom: `1px solid var(--luma-example-border, ${theme.border})`
            }}
          >
            {(['info', 'source'] as const).map(tab => (
              <button
                data-luma-example-chrome-action=""
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  border:
                    activeTab === tab
                      ? `1px solid var(--luma-example-accent, ${theme.accent})`
                      : `1px solid var(--luma-example-border, ${theme.border})`,
                  borderRadius: 7,
                  padding: '5px 10px',
                  background:
                    activeTab === tab
                      ? `color-mix(in srgb, var(--luma-example-accent, ${theme.accent}) 15%, var(--luma-example-surface-raised, ${theme.surfaceRaised}))`
                      : `var(--luma-example-surface-raised, ${theme.surfaceRaised})`,
                  color:
                    activeTab === tab
                      ? `var(--luma-example-accent, ${theme.accent})`
                      : `var(--luma-example-text-muted, ${theme.textMuted})`,
                  cursor: 'pointer',
                  fontSize: 11,
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
            data-luma-example-source=""
            hidden={activeTab !== 'source'}
            aria-hidden={activeTab !== 'source'}
            style={{
              border: `1px solid var(--luma-example-border, ${theme.border})`,
              borderRadius: 9,
              minWidth: 0,
              minHeight: 0,
              flex: '1 1 auto',
              maxWidth: '100%',
              overflow: 'auto',
              background: `var(--luma-example-surface, ${theme.surface})`,
              color: `var(--luma-example-text, ${theme.text})`,
              colorScheme: appearance === 'cinematic' ? 'dark' : 'light'
            }}
          >
            {currentSourceResult?.files && currentSourceResult.files.length > 0 ? (
              <div
                role="tablist"
                aria-label="Example source files"
                style={{
                  alignItems: 'center',
                  background: `var(--luma-example-surface-raised, ${theme.surfaceRaised})`,
                  borderBottom: `1px solid var(--luma-example-border, ${theme.border})`,
                  display: 'flex',
                  gap: 5,
                  overflowX: 'auto',
                  padding: '8px 9px'
                }}
              >
                {currentSourceResult.files.map(file => (
                  <button
                    data-luma-example-chrome-action=""
                    key={file.path}
                    type="button"
                    role="tab"
                    aria-selected={file.path === activeSourceFile?.path}
                    onClick={() => setActiveSourcePath(file.path)}
                    style={{
                      background:
                        file.path === activeSourceFile?.path
                          ? `var(--luma-example-surface, ${theme.surface})`
                          : 'transparent',
                      border:
                        file.path === activeSourceFile?.path
                          ? `1px solid var(--luma-example-accent, ${theme.accent})`
                          : `1px solid var(--luma-example-border, ${theme.border})`,
                      borderRadius: 6,
                      color:
                        file.path === activeSourceFile?.path
                          ? `var(--luma-example-text, ${theme.text})`
                          : `var(--luma-example-text-muted, ${theme.textMuted})`,
                      cursor: 'pointer',
                      fontSize: 11,
                      fontWeight: file.path === activeSourceFile?.path ? 700 : 500,
                      padding: '5px 8px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {file.path.split('/').at(-1)}
                  </button>
                ))}
                {props.stackBlitz ? (
                  <button
                    data-luma-example-chrome-action=""
                    type="button"
                    onClick={() =>
                      void openExampleInStackBlitz(title, currentSourceResult.files || [])
                    }
                    style={{
                      background: `color-mix(in srgb, var(--luma-example-accent, ${theme.accent}) 18%, var(--luma-example-surface, ${theme.surface}))`,
                      border: `1px solid var(--luma-example-accent, ${theme.accent})`,
                      borderRadius: 6,
                      color: `var(--luma-example-accent, ${theme.accent})`,
                      cursor: 'pointer',
                      fontSize: 11,
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
          data-luma-example-chrome-action=""
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
            border: `1px solid var(--luma-example-border, ${theme.border})`,
            borderRadius: 7,
            background: `var(--luma-example-surface-raised, ${theme.surfaceRaised})`,
            boxShadow: '0 4px 12px rgba(2, 6, 23, 0.18)',
            color: `var(--luma-example-text-muted, ${theme.textMuted})`,
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

function getInfoBoxBoundaryElement(infoBoxElement: HTMLElement): HTMLElement | null {
  return infoBoxElement.closest<HTMLElement>('[data-luma-example-page]');
}

function getInfoBoxSizeBounds(infoBoxElement: HTMLElement): InfoBoxSizeBounds {
  const rect = infoBoxElement.getBoundingClientRect();
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const boundaryRect = getInfoBoxBoundaryElement(infoBoxElement)?.getBoundingClientRect();
  const boundaryRight = Math.min(viewportWidth, boundaryRect?.right ?? viewportWidth);
  const boundaryBottom = Math.min(viewportHeight, boundaryRect?.bottom ?? viewportHeight);
  const maxWidth = Math.max(1, boundaryRight - rect.left - INFO_BOX_VIEWPORT_RIGHT_MARGIN);
  const maxHeight = Math.max(1, boundaryBottom - rect.top - INFO_BOX_VIEWPORT_BOTTOM_MARGIN);

  return {
    minWidth: Math.min(INFO_BOX_MIN_WIDTH, maxWidth),
    minHeight: Math.min(INFO_BOX_MIN_HEIGHT, maxHeight),
    maxWidth,
    maxHeight
  };
}

function clampInfoBoxSize(infoBoxElement: HTMLElement, width: number, height: number): InfoBoxSize {
  return clampInfoBoxSizeToBounds({width, height}, getInfoBoxSizeBounds(infoBoxElement));
}

function clampInfoBoxSizeToBounds(size: InfoBoxSize, bounds: InfoBoxSizeBounds): InfoBoxSize {
  const {minWidth, minHeight, maxWidth, maxHeight} = bounds;
  return {
    width: Math.min(maxWidth, Math.max(minWidth, size.width)),
    height: Math.min(maxHeight, Math.max(minHeight, size.height))
  };
}

function areInfoBoxSizeBoundsEqual(
  first: InfoBoxSizeBounds | null,
  second: InfoBoxSizeBounds
): boolean {
  return (
    first !== null &&
    first.minWidth === second.minWidth &&
    first.minHeight === second.minHeight &&
    first.maxWidth === second.maxWidth &&
    first.maxHeight === second.maxHeight
  );
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
