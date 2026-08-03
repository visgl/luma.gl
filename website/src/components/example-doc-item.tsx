import React from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './example-doc-item.module.css';

type ExampleDocItemProps = {
  content: React.ComponentType;
  route: {
    path: string;
  };
};

export default function ExampleDocItem({content: Content, route}: ExampleDocItemProps) {
  const indexPath = useBaseUrl('/examples');
  const isExamplesIndex = normalizeExampleRoute(route.path) === normalizeExampleRoute(indexPath);

  if (isExamplesIndex) {
    return (
      <div className={styles.catalogContainer} data-luma-example-route="catalog" key="index">
        <Content />
      </div>
    );
  }

  return (
    <div className={styles.demoContainer} data-luma-example-route="demo" key="demo">
      <Content />
    </div>
  );
}

function normalizeExampleRoute(routePath: string): string {
  return routePath.split(/[?#]/, 1)[0].replace(/\/+$/, '') || '/';
}
