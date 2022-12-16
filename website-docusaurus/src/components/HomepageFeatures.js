import React from 'react';
import clsx from 'clsx';
import styles from './HomepageFeatures.module.css';

const FeatureList = [
  {
    title: 'Battle Tested',
    Svg: require('../../static/img/icon-high-precision.svg').default,
    description: (
      <>
        The core 3D rendering technology behind the vis.gl suite of data visualization tools,
        including deck.gl, kepler.gl, and avs.auto..
      </>
    ),
  },
  {
    title: 'Focus on What Matters',
    Svg: require('../../static/img/icon-high-precision.svg').default,
    description: (
      <>
        Provides simple abstractions for high-performance data
        visualization APIs like instanced rendering andGPU compute..
      </>
    ),
  },
  {
    title: 'Modern API',
    Svg: require('../../static/img/icon-high-precision.svg').default,
    description: (
      <>
        Work with a modern, WebGPU friendly API across WebGPU, WebGL 2 and WebGL 1.
      </>
    ),
  },
];

function Feature({Svg, title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} alt={title} />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
