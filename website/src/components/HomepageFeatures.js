import React from 'react';
import clsx from 'clsx';
import styles from './HomepageFeatures.module.css';

const FeatureList = [
  {
    title: 'The Right Stuff',
    Svg: require('../../static/img/icon-high-precision.svg').default,
    description: (
      <>
        Focused on high-performance data processing, e.g. instanced rendering and GPU compute.
      </>
    ),
  },
  {
    title: 'Battle Tested',
    Svg: require('../../static/img/icon-high-precision.svg').default,
    description: (
      <>
        The core 3D rendering technology behind tools such as
        deck.gl, kepler.gl, and avs.auto.
      </>
    ),
  },
  {
    title: 'Modern, Portable API',
    Svg: require('../../static/img/icon-high-precision.svg').default,
    description: (
      <>
        A clean TypeScript and WebGPU friendly GPU API that works across WebGPU, WebGL 2 and WebGL.
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
