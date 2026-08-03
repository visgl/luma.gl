import React from 'react';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {InstancingExample} from '../examples';
import styles from './index.module.css';

if (typeof window !== 'undefined') {
  window.website = true;
}

export default function IndexPage() {
  const {siteConfig} = useDocusaurusContext();

  return (
    <Layout title="Home" description="luma.gl">
      <main>
        <section className={styles.banner}>
          <div className={styles.heroExampleContainer}>
            <InstancingExample panel={false} />
          </div>
          <div className={styles.bannerContainer}>
            <h1 className={styles.projectName}>{siteConfig.title}</h1>
            <p>{siteConfig.tagline}</p>
            <a className={styles.getStartedLink} href="./docs/developer-guide/installing">
              GET STARTED
            </a>
          </div>
        </section>
        <div className={styles.contentContainer}>
          <h2>High-performance toolkit for GPU-based data visualization.</h2>
          <ul>
            <li className={styles.bullet}>
              Focused on high-performance data processing, e.g. instanced rendering and GPU compute.
            </li>
            <li className={styles.bullet}>
              The core 3D rendering technology behind tools such as deck.gl, kepler.gl, and
              avs.auto.
            </li>
            <li className={styles.bullet}>
              A clean TypeScript and WebGPU friendly GPU API that works across WebGPU and WebGL 2.
            </li>
          </ul>
        </div>
      </main>
    </Layout>
  );
}
