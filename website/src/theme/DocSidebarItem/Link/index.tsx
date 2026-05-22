import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import {ThemeClassNames} from '@docusaurus/theme-common';
import {isActiveSidebarItem} from '@docusaurus/plugin-content-docs/client';
import Link from '@docusaurus/Link';
import isInternalUrl from '@docusaurus/isInternalUrl';
import IconExternalLink from '@theme/Icon/ExternalLink';
import type {Props} from '@theme/DocSidebarItem/Link';

import styles from './styles.module.css';

function LinkLabel({label, arrowTypes}: {label: string; arrowTypes: string[]}): ReactNode {
  const title = arrowTypes.length > 0 ? `${label}: ${arrowTypes.join(', ')}` : label;
  return (
    <span title={title} className={styles.linkLabel}>
      <span className={styles.linkTitle}>{label}</span>
      {arrowTypes.length > 0 && (
        <span className={styles.linkArrowTypes}>
          {arrowTypes.map((arrowType) => (
            <code key={arrowType} className={styles.linkArrowType}>
              {arrowType}
            </code>
          ))}
        </span>
      )}
    </span>
  );
}

function getSidebarArrowTypes(item: Props['item']): string[] {
  const arrowTypes = item.customProps?.arrowTypes;
  return Array.isArray(arrowTypes) && arrowTypes.every((arrowType) => typeof arrowType === 'string')
    ? arrowTypes
    : [];
}

export default function DocSidebarItemLink({
  item,
  onItemClick,
  activePath,
  level,
  index,
  ...props
}: Props): ReactNode {
  const {href, label, className, autoAddBaseUrl} = item;
  const isActive = isActiveSidebarItem(item, activePath);
  const isInternalLink = isInternalUrl(href);
  return (
    <li
      className={clsx(
        ThemeClassNames.docs.docSidebarItemLink,
        ThemeClassNames.docs.docSidebarItemLinkLevel(level),
        'menu__list-item',
        className
      )}
      key={label}>
      <Link
        className={clsx('menu__link', !isInternalLink && styles.menuExternalLink, {
          'menu__link--active': isActive
        })}
        autoAddBaseUrl={autoAddBaseUrl}
        aria-current={isActive ? 'page' : undefined}
        to={href}
        {...(isInternalLink && {
          onClick: onItemClick ? () => onItemClick(item) : undefined
        })}
        {...props}>
        <LinkLabel label={label} arrowTypes={getSidebarArrowTypes(item)} />
        {!isInternalLink && <IconExternalLink />}
      </Link>
    </li>
  );
}
