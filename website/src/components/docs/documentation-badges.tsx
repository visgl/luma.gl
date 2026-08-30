import React, {type ReactNode} from 'react';
import clsx from 'clsx';

export type DocumentationBadgeTone = 'stable' | 'experimental' | 'webgpu' | 'version' | 'neutral';

/** Local, accessible replacement for remotely rendered documentation badges. */
export function DocumentationBadge({
  children,
  label,
  tone = 'neutral'
}: {
  children: ReactNode;
  label?: string;
  tone?: DocumentationBadgeTone;
}): ReactNode {
  return (
    <span
      className={clsx('docs-status-badge', `docs-status-badge--${tone}`)}
      aria-label={label}
      title={label}
    >
      {children}
    </span>
  );
}

/** Groups status and compatibility badges into one readable line. */
export function DocumentationBadges({children}: {children: ReactNode}): ReactNode {
  return <p className="docs-status-badges">{children}</p>;
}
