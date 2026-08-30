import React, {type ReactNode} from 'react';
import clsx from 'clsx';

export type DocumentationCalloutKind = 'cost' | 'mistake' | 'ownership' | 'compatibility';

const CALLOUT_LABELS: Record<DocumentationCalloutKind, string> = {
  cost: 'Cost',
  mistake: 'Common mistake',
  ownership: 'Ownership',
  compatibility: 'Compatibility'
};

/** A consistent practical-contract callout for guides and API references. */
export function DocumentationCallout({
  children,
  kind,
  title = CALLOUT_LABELS[kind]
}: {
  children: ReactNode;
  kind: DocumentationCalloutKind;
  title?: string;
}): ReactNode {
  return (
    <aside className={clsx('docs-contract-callout', `docs-contract-callout--${kind}`)}>
      <strong>{title}</strong>
      <div>{children}</div>
    </aside>
  );
}
