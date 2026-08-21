import React, {useState, type CSSProperties} from 'react';
import styles from './example-card.module.css';

type ExampleCardBackend = 'webgpu' | 'webgl2';

export type ExampleCardProps = {
  backends: readonly ExampleCardBackend[];
  category: string;
  description: string;
  difficulty: string;
  highDynamicRange?: boolean;
  href?: string;
  imagePosition?: string;
  imageScale?: number;
  imageUrl: string;
  maturity?: string;
  title: string;
  topics?: readonly string[];
};

type CapabilityBadge = {
  label: string;
  tone: 'webgpu' | 'webgl' | 'hdr';
};

/** Shared cinematic poster card for website galleries and example collections. */
export function ExampleCard({
  backends,
  category,
  description,
  difficulty,
  highDynamicRange = false,
  href,
  imagePosition,
  imageScale = 1,
  imageUrl,
  maturity,
  title,
  topics = []
}: ExampleCardProps): React.JSX.Element {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const [constrainedImageUrl, setConstrainedImageUrl] = useState<string | null>(null);
  const hasImageError = failedImageUrl === imageUrl;
  const hasConstrainedImage = constrainedImageUrl === imageUrl;
  const capabilities = getCapabilityBadges(backends, highDynamicRange);
  const accentColor = getCardAccent(category, topics);
  const cardStyle = {
    '--luma-example-card-accent': accentColor,
    ...(imagePosition ? {'--luma-example-card-image-position': imagePosition} : {}),
    ...(imageScale === 1
      ? {}
      : {
          '--luma-example-card-image-scale': imageScale,
          '--luma-example-card-image-hover-scale': imageScale * 1.035
        })
  } as CSSProperties;
  const visibleTopics = [...new Set(topics)].slice(0, 2);

  return (
    <a className={styles.card} data-example-card="" href={href} style={cardStyle}>
      <div className={styles.poster} data-image-state={hasImageError ? 'fallback' : 'ready'}>
        <div className={styles.posterFallback} aria-hidden="true">
          <svg className={styles.fallbackMark} viewBox="0 0 88 88" fill="none">
            <path d="M44 7 76 25.5v37L44 81 12 62.5v-37L44 7Z" />
            <path d="m12 25.5 32 18.5 32-18.5M44 44v37" />
            <circle cx="44" cy="44" r="7" />
          </svg>
          <span className={styles.fallbackLabel}>{title}</span>
        </div>
        {!hasImageError ? (
          <>
            {hasConstrainedImage ? (
              <img
                className={styles.posterBackdrop}
                src={imageUrl}
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
              />
            ) : null}
            <img
              className={`${styles.posterImage}${hasConstrainedImage ? ` ${styles.posterPreserved}` : ''}`}
              src={imageUrl}
              alt=""
              width={1280}
              height={720}
              loading="lazy"
              decoding="async"
              onLoad={event => {
                const {naturalHeight, naturalWidth} = event.currentTarget;
                if (naturalHeight > 0 && naturalWidth / naturalHeight < 1.5) {
                  setConstrainedImageUrl(imageUrl);
                }
              }}
              onError={() => setFailedImageUrl(imageUrl)}
            />
          </>
        ) : null}
        <div className={styles.capabilities} aria-label="Example capabilities">
          {capabilities.map(capability => (
            <span
              className={`${styles.capability} ${styles[capability.tone]}`}
              key={capability.label}
            >
              {capability.label}
            </span>
          ))}
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.heading}>
          <span className={styles.category}>{category}</span>
          <svg className={styles.actionIcon} viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M6 14 14 6M7 6h7v7" />
          </svg>
        </div>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>

        <div className={styles.metadata} aria-label="Example details">
          <span className={styles.metadataBadge}>{formatCardLabel(difficulty)}</span>
          {visibleTopics.map(topic => (
            <span className={styles.metadataBadge} key={topic}>
              {formatCardLabel(topic)}
            </span>
          ))}
          {maturity === 'experimental' ? (
            <span className={`${styles.metadataBadge} ${styles.experimental}`}>Experimental</span>
          ) : null}
        </div>
      </div>
    </a>
  );
}

function getCapabilityBadges(
  backends: readonly ExampleCardBackend[],
  highDynamicRange: boolean
): CapabilityBadge[] {
  const badges: CapabilityBadge[] = backends.map(backend =>
    backend === 'webgpu' ? {label: 'WebGPU', tone: 'webgpu'} : {label: 'WebGL2', tone: 'webgl'}
  );

  if (highDynamicRange) {
    badges.push({label: 'HDR', tone: 'hdr'});
  }

  return badges;
}

function getCardAccent(category: string, topics: readonly string[]): string {
  if (category === 'WebGPU') return '#67e8f9';
  if (category === 'Compute and analytics' || category === 'Simulation and data') return '#a78bfa';
  if (category === 'Tutorials') return '#6ee7b7';
  if (category === 'Showcase') return '#c4b5fd';
  if (category.includes('Arrow') || category.includes('Data')) return '#93c5fd';
  if (topics.includes('effects')) return '#f9a8d4';
  if (topics.includes('simulation')) return '#fbbf24';
  return '#7dd3fc';
}

function formatCardLabel(value: string): string {
  const labels: Record<string, string> = {
    api: 'API',
    gpgpu: 'GPGPU',
    hdr: 'HDR'
  };

  return (
    labels[value.toLowerCase()] ||
    value
      .split('-')
      .map(segment => `${segment.charAt(0).toUpperCase()}${segment.slice(1)}`)
      .join(' ')
  );
}
