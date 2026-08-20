import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

/** One local documentation navigation destination. */
export type DocumentationTab<Identifier extends string = string> = {
  id: Identifier;
  label: string;
  href: string;
};

/** A deliberately small set of peer documentation pages. */
export type DocumentationTabGroup<Identifier extends string = string> = {
  label: string;
  tabs: readonly DocumentationTab<Identifier>[];
};

/**
 * Renders focused peer navigation for documentation pages.
 *
 * The sidebar remains the complete hierarchy. These links should contain only the
 * three to seven pages that are most useful beside the current page.
 */
export function DocsPageTabs<Identifier extends string>({
  active,
  group
}: {
  active: Identifier;
  group: DocumentationTabGroup<Identifier>;
}): ReactNode {
  return (
    <nav className="docs-page-tabs" aria-label={group.label}>
      {group.tabs.map(tab => (
        <Link
          key={tab.id}
          className={
            tab.id === active
              ? 'docs-page-tabs__tab docs-page-tabs__tab--active'
              : 'docs-page-tabs__tab'
          }
          to={tab.href}
          aria-current={tab.id === active ? 'page' : undefined}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
