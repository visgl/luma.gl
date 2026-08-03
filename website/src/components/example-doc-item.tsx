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

  if (route.path === indexPath) {
    return (
      <div key="index">
        <Content />
      </div>
    );
  }

  return (
    <div className={styles.demoContainer} key="demo">
      <Content />
    </div>
  );
}
