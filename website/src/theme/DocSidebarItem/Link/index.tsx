import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import {ThemeClassNames} from '@docusaurus/theme-common';
import {isActiveSidebarItem} from '@docusaurus/plugin-content-docs/client';
import Link from '@docusaurus/Link';
import isInternalUrl from '@docusaurus/isInternalUrl';
import IconExternalLink from '@theme/Icon/ExternalLink';
import type {Props} from '@theme/DocSidebarItem/Link';

import styles from './styles.module.css';

type ExampleSidebarCapability = {
  label: 'WebGPU' | 'WebGL2' | 'HDR';
  tone: 'webgpu' | 'webgl' | 'hdr';
};

function LinkLabel({
  label,
  arrowTypes,
  exampleCapabilities
}: {
  label: string;
  arrowTypes: string[];
  exampleCapabilities: ExampleSidebarCapability[];
}): ReactNode {
  const details = [...arrowTypes, ...exampleCapabilities.map(capability => capability.label)];
  const title = details.length > 0 ? `${label}: ${details.join(', ')}` : label;
  return (
    <span title={title} className={styles.linkLabel}>
      <span className={styles.linkTitle}>{label}</span>
      {arrowTypes.length > 0 && (
        <span className={styles.linkArrowTypes}>
          {arrowTypes.map(arrowType => (
            <code key={arrowType} className={styles.linkArrowType}>
              {arrowType}
            </code>
          ))}
        </span>
      )}
      {exampleCapabilities.length > 0 && (
        <span className={styles.exampleCapabilities} aria-label="Example capabilities">
          {exampleCapabilities.map(capability => (
            <span
              className={`${styles.exampleCapability} ${styles[capability.tone]}`}
              key={capability.label}
            >
              {capability.label}
            </span>
          ))}
        </span>
      )}
    </span>
  );
}

function getSidebarArrowTypes(item: Props['item']): string[] {
  const arrowTypes = item.customProps?.arrowTypes;
  return Array.isArray(arrowTypes) && arrowTypes.every(arrowType => typeof arrowType === 'string')
    ? arrowTypes
    : [];
}

function isExampleSidebarLink(href: string): boolean {
  return /(?:^|\/)examples(?:\/|$)/.test(href.split(/[?#]/, 1)[0]);
}

function getExampleSidebarCapabilities(item: Props['item']): ExampleSidebarCapability[] {
  const capabilities: ExampleSidebarCapability[] = [];
  const backends = item.customProps?.backends;

  if (Array.isArray(backends) && backends.length === 1) {
    if (backends[0] === 'webgpu') {
      capabilities.push({label: 'WebGPU', tone: 'webgpu'});
    } else if (backends[0] === 'webgl2') {
      capabilities.push({label: 'WebGL2', tone: 'webgl'});
    }
  }

  if (item.customProps?.display === 'hdr-capable') {
    capabilities.push({label: 'HDR', tone: 'hdr'});
  }

  return capabilities;
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
  const isExampleLink = isInternalLink && isExampleSidebarLink(href);
  const exampleCapabilities = isExampleLink ? getExampleSidebarCapabilities(item) : [];
  return (
    <li
      className={clsx(
        ThemeClassNames.docs.docSidebarItemLink,
        ThemeClassNames.docs.docSidebarItemLinkLevel(level),
        'menu__list-item',
        className
      )}
      data-luma-example-sidebar-item={isExampleLink ? '' : undefined}
      key={label}
    >
      <Link
        className={clsx('menu__link', !isInternalLink && styles.menuExternalLink, {
          'menu__link--active': isActive
        })}
        data-luma-example-sidebar-link={isExampleLink ? '' : undefined}
        autoAddBaseUrl={autoAddBaseUrl}
        aria-current={isActive ? 'page' : undefined}
        to={href}
        {...(isInternalLink && {
          onClick: onItemClick ? () => onItemClick(item) : undefined
        })}
        {...props}
      >
        <LinkLabel
          label={label}
          arrowTypes={getSidebarArrowTypes(item)}
          exampleCapabilities={exampleCapabilities}
        />
        {!isInternalLink && <IconExternalLink />}
      </Link>
    </li>
  );
}
