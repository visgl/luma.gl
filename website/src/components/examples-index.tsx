import React from 'react';
// @ts-expect-error Internal Docusaurus API
import {useDocsSidebar} from '@docusaurus/plugin-content-docs/client';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styled from 'styled-components';

const isMobile = '@media screen and (min-width: 768px)';

type SidebarDocItem = {
  type?: string;
  label: string;
  href?: string;
  docId?: string;
};

type SidebarCategoryItem = {
  type: 'category';
  label: string;
  items: Array<SidebarDocItem | SidebarCategoryItem>;
};

type SidebarRoot = {
  label?: string;
  items: Array<SidebarDocItem | SidebarCategoryItem>;
};

type ExamplesIndexProps = {
  getThumbnail: (item: SidebarDocItem) => string;
};

const ExampleHeader = styled.div`
  font: bold 20px/28px var(--ifm-font-family-base);
  color: var(--ifm-color-gray-800);
  margin: 0 20px;
  border-bottom: 1px solid 20px;
  display: inline-block;
  padding: 20px 20px 4px 0;
`;

const MainExamples = styled.main`
  padding: 16px 0;
`;

const ExamplesGroup = styled.main`
  display: flex;
  flex-wrap: wrap;
  padding: 16px;
`;

const ExampleCard = styled.a`
  cursor: pointer;
  text-decoration: none;
  width: 50%;
  max-width: 240px;
  line-height: 0;
  outline: none;
  padding: 4px;
  position: relative;

  img {
    transition-property: filter;
    transition-duration: var(--ifm-transition-slow);
    transition-timing-function: var(--ifm-transition-timing-default);
  }

  &:hover {
    box-shadow: var(--ifm-global-shadow-md);
  }

  &:hover img {
    filter: contrast(0.2);
  }

  ${isMobile} {
    width: 33%;
    min-width: 200px;
  }

  @media screen and (max-width: 632px) {
    width: 50%;
  }
`;

const ExampleTitle = styled.div`
  position: absolute;
  display: flex;
  justify-content: center;
  flex-direction: column;
  color: var(--ifm-color-white);
  font-size: 1.5em;
  text-align: center;
  line-height: initial;
  width: 90%;
  height: 90%;
  top: 5%;
  left: 5%;
  border: solid 1px var(--ifm-color-white);
  opacity: 0;
  transition-property: opacity;
  transition-duration: var(--ifm-transition-slow);
  transition-timing-function: var(--ifm-transition-timing-default);

  &:hover {
    opacity: 1;
  }
`;

function getItemKey(item: SidebarDocItem | SidebarCategoryItem, parentKey: string): string {
  if (item.type === 'category') {
    return `${parentKey}/category:${item.label}`;
  }

  return `${parentKey}/doc:${item.href || item.docId || item.label}`;
}

function renderItem(item: SidebarDocItem, getThumbnail: (item: SidebarDocItem) => string) {
  const imageUrl = useBaseUrl(getThumbnail(item));
  const {label, href} = item;

  return (
    <ExampleCard key={href || item.docId || label} href={href}>
      <img width="100%" src={imageUrl} alt={label} />
      <ExampleTitle>
        <span>{label}</span>
      </ExampleTitle>
    </ExampleCard>
  );
}

function renderCategory(
  category: SidebarRoot | SidebarCategoryItem,
  getThumbnail: (item: SidebarDocItem) => string,
  parentKey = 'root'
) {
  const pages: SidebarDocItem[] = [];
  const categories: SidebarCategoryItem[] = [];

  for (const item of category.items) {
    if (item.type === 'category') {
      categories.push(item);
    } else if (item.docId !== 'index') {
      pages.push(item);
    }
  }

  return (
    <React.Fragment key={parentKey}>
      {category.label ? <ExampleHeader>{category.label}</ExampleHeader> : null}
      {pages.length > 0 ? (
        <ExamplesGroup>{pages.map(item => renderItem(item, getThumbnail))}</ExamplesGroup>
      ) : null}
      {categories.map(item =>
        renderCategory(item, getThumbnail, getItemKey(item, parentKey))
      )}
    </React.Fragment>
  );
}

export function ExamplesIndex({getThumbnail}: ExamplesIndexProps) {
  const sidebar = useDocsSidebar() as SidebarRoot;
  return <MainExamples>{renderCategory(sidebar, getThumbnail)}</MainExamples>;
}
