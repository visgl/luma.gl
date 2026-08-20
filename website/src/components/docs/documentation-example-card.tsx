import Link from '@docusaurus/Link';
import React, {type ReactNode} from 'react';

export type DocumentationExampleRow = {label: string; value: ReactNode};

export type DocumentationExampleCardProps = {
  label?: string;
  rows: readonly DocumentationExampleRow[];
  fullPageHref?: string;
  sourceHref?: string;
  inspectorHref?: string;
  inspectorLabel?: string;
  actions?: readonly {label: string; href: string}[];
};

/** Shared context and actions for embedded documentation examples. */
export function DocumentationExampleCard(props: DocumentationExampleCardProps): ReactNode {
  return (
    <aside className="gpu-example-card docs-example-card" aria-label={props.label ?? 'Example capabilities'}>
      <dl>
        {props.rows.map(row => (
          <div key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
      {props.fullPageHref || props.sourceHref || props.inspectorHref || props.actions?.length ? (
        <nav aria-label="Example actions">
          {props.fullPageHref ? <Link to={props.fullPageHref}>Open full page</Link> : null}
          {props.sourceHref ? <Link to={props.sourceHref}>View source</Link> : null}
          {props.inspectorHref ? (
            <Link to={props.inspectorHref}>{props.inspectorLabel ?? 'Open inspector'}</Link>
          ) : null}
          {props.actions?.map(action => (
            <Link key={action.label} to={action.href}>
              {action.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </aside>
  );
}
