import React, {memo, useEffect, useId, useRef, useState} from 'react';

import {
  createBuffersDemo,
  createComputeDemo,
  createInstancingDemo,
  createPipelinesDemo,
  createTexturesDemo,
  GPUConceptDemoController
} from './gpu-concept-demos';

type GPUCardProps = {
  accentColor: string;
  accentColorSecondary: string;
  createDemoController: (canvas: HTMLCanvasElement) => GPUConceptDemoController;
  description: string;
  detail: string;
  layoutVariant?: 'standard' | 'wide';
  title: string;
};

type ConceptDefinition = GPUCardProps & {
  id: string;
};

function getInitializationError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unable to start this demo.';
}

function useHoverSupport(): boolean {
  const [supportsHover, setSupportsHover] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return undefined;
    }

    const mediaQueryList = window.matchMedia('(hover: hover) and (pointer: fine)');
    const updateHoverSupport = (): void => setSupportsHover(mediaQueryList.matches);

    updateHoverSupport();

    if ('addEventListener' in mediaQueryList) {
      mediaQueryList.addEventListener('change', updateHoverSupport);

      return () => {
        mediaQueryList.removeEventListener('change', updateHoverSupport);
      };
    }

    mediaQueryList.addListener(updateHoverSupport);

    return () => {
      mediaQueryList.removeListener(updateHoverSupport);
    };
  }, []);

  return supportsHover;
}

export const GPUCard = memo(function GPUCard(props: GPUCardProps) {
  const {
    accentColor,
    accentColorSecondary,
    createDemoController,
    description,
    detail,
    layoutVariant = 'standard',
    title
  } = props;
  const cardReference = useRef<HTMLDivElement | null>(null);
  const canvasReference = useRef<HTMLCanvasElement | null>(null);
  const demoControllerReference = useRef<GPUConceptDemoController | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isInViewport, setIsInViewport] = useState(true);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const supportsHover = useHoverSupport();
  const cardBodyId = useId();

  useEffect(() => {
    const cardElement = cardReference.current;

    if (!cardElement || typeof IntersectionObserver === 'undefined') {
      return undefined;
    }

    const intersectionObserver = new IntersectionObserver(
      entries => {
        const nextEntry = entries[0];
        setIsInViewport(Boolean(nextEntry?.isIntersecting));
      },
      {threshold: 0.35}
    );

    intersectionObserver.observe(cardElement);

    return () => {
      intersectionObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasReference.current;

    if (!canvas) {
      return undefined;
    }

    const shouldAnimate = isExpanded && isInViewport;

    if (!shouldAnimate) {
      demoControllerReference.current?.stopAnimation();
      return undefined;
    }

    if (!demoControllerReference.current) {
      try {
        demoControllerReference.current = createDemoController(canvas);
        setInitializationError(null);
      } catch (error: unknown) {
        setInitializationError(getInitializationError(error));
        return undefined;
      }
    }

    demoControllerReference.current.startAnimation();

    return () => {
      demoControllerReference.current?.stopAnimation();
    };
  }, [createDemoController, isExpanded, isInViewport]);

  useEffect(() => {
    return () => {
      demoControllerReference.current?.destroyResources();
      demoControllerReference.current = null;
    };
  }, []);

  const toggleExpandedState = (): void => {
    setIsExpanded(currentExpandedState => !currentExpandedState);
  };

  const handleClick = (): void => {
    if (!supportsHover) {
      toggleExpandedState();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleExpandedState();
    }

    if (event.key === 'Escape') {
      setIsExpanded(false);
    }
  };

  const cardClassName = `gpuConceptCard${isExpanded ? ' gpuConceptCardExpanded' : ''}${
    layoutVariant === 'wide' ? ' gpuConceptCardWide' : ''
  }`;
  const cardStyle = {
    '--gpu-accent': accentColor,
    '--gpu-accent-secondary': accentColorSecondary
  } as React.CSSProperties;

  return (
    <div
      ref={cardReference}
      aria-controls={cardBodyId}
      aria-expanded={isExpanded}
      className={cardClassName}
      onBlur={() => {
        if (supportsHover) {
          setIsExpanded(false);
        }
      }}
      onClick={handleClick}
      onFocus={() => {
        if (supportsHover) {
          setIsExpanded(true);
        }
      }}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => {
        if (supportsHover) {
          setIsExpanded(true);
        }
      }}
      onMouseLeave={() => {
        if (supportsHover) {
          setIsExpanded(false);
        }
      }}
      role="button"
      style={cardStyle}
      tabIndex={0}
    >
      <div className="gpuConceptCardHeader">
        <span className="gpuConceptEyebrowSmall">GPU Concept</span>
        <h3>{title}</h3>
      </div>
      <p className="gpuConceptDescription">{description}</p>

      <div aria-hidden={!isExpanded} className="gpuConceptCanvasRegion" id={cardBodyId}>
        <div className="gpuConceptCanvasShell">
          <p className="gpuConceptDetail">{detail}</p>
          <canvas
            className="gpuConceptCanvas"
            height={80}
            ref={canvasReference}
            width={240}
          />
          {initializationError ? (
            <p className="gpuConceptStatusMessage">{initializationError}</p>
          ) : (
            <p className="gpuConceptStatusMessage">
              {supportsHover ? 'Hover keeps the loop running.' : 'Tap again to pause the loop.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
});

const conceptDefinitions: ConceptDefinition[] = [
  {
    accentColor: '#53a9ff',
    accentColorSecondary: '#7f66ff',
    createDemoController: createBuffersDemo,
    description: 'Store binary memory on the GPU.',
    detail: 'Attributes in a buffer drive a field of animated particles.',
    id: 'buffers',
    title: 'Buffers'
  },
  {
    accentColor: '#4ac8ff',
    accentColorSecondary: '#8d62ff',
    createDemoController: createTexturesDemo,
    description: 'Store 2D arrays of pixels or values in the GPU.',
    detail: 'A tiled texture shifts sampling coordinates to create motion.',
    id: 'textures',
    title: 'Textures'
  },
  {
    accentColor: '#7086ff',
    accentColorSecondary: '#b65cff',
    createDemoController: createPipelinesDemo,
    description: 'Shader programs that execute on the GPU.',
    detail: 'Two offscreen passes transform color before final presentation.',
    id: 'pipelines',
    title: 'Pipelines'
  },
  {
    accentColor: '#66a7ff',
    accentColorSecondary: '#9a63ff',
    createDemoController: createComputeDemo,
    description: 'Pure computations that do not render on the GPU.',
    detail: 'Parallel particle updates read like a compact compute workload.',
    id: 'compute',
    layoutVariant: 'wide',
    title: 'Compute'
  },
  {
    accentColor: '#52d7ff',
    accentColorSecondary: '#7f7dff',
    createDemoController: createInstancingDemo,
    description: 'Render millions of geometries in a single draw call.',
    detail: 'One geometry definition fans out into many animated instances.',
    id: 'instancing',
    layoutVariant: 'wide',
    title: 'Instancing'
  }
];

export function GPUConceptGrid() {
  return (
    <section className="gpuConceptSection">
      <div className="gpuConceptSectionHeader">
        <span className="gpuConceptEyebrow">GPU Concepts</span>
        <h2>Hover or tap to open a live GPU sketch.</h2>
        <p>
          Each card initializes its own tiny WebGL pipeline only while it is expanded and visible,
          keeping the homepage light until you interact with it.
        </p>
      </div>

      <div className="gpuConceptGrid">
        {conceptDefinitions.map(conceptDefinition => (
          <GPUCard
            key={conceptDefinition.id}
            accentColor={conceptDefinition.accentColor}
            accentColorSecondary={conceptDefinition.accentColorSecondary}
            createDemoController={conceptDefinition.createDemoController}
            description={conceptDefinition.description}
            detail={conceptDefinition.detail}
            layoutVariant={conceptDefinition.layoutVariant}
            title={conceptDefinition.title}
          />
        ))}
      </div>
    </section>
  );
}
