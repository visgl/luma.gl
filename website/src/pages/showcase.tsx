import React from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Layout from '@theme/Layout';
import styles from './showcase.module.css';

const CLIMATE_GLOBE_DEMO_URL = 'https://rokotyan.github.io/climate-globe/';
const CLIMATE_GLOBE_SOURCE_URL = 'https://github.com/rokotyan/climate-globe';
const NIKITA_ROKOTYAN_URL = 'https://github.com/rokotyan';
const LUMA_GL_REPOSITORY_URL = 'https://github.com/visgl/luma.gl';

export default function ShowcasePage(): React.JSX.Element {
  const climateGlobeImageUrl = useBaseUrl('/images/showcase-climate-globe.png');
  const gettingStartedUrl = useBaseUrl('/docs/getting-started');
  const examplesUrl = useBaseUrl('/examples');

  return (
    <Layout
      title="Showcase"
      description="Explore projects created by the luma.gl community."
    >
      <main className={styles.page}>
        <header className={styles.hero}>
          <div className={styles.heroContent}>
            <p className={styles.eyebrow}>Community showcase</p>
            <h1>Made with luma.gl</h1>
            <p className={styles.introduction}>
              Ambitious, beautiful, and unexpected projects from people turning GPU-level control
              into something worth sharing.
            </p>
            <div className={styles.heroActions}>
              <a className={styles.primaryAction} href={gettingStartedUrl}>
                Find your starting point <span aria-hidden="true">→</span>
              </a>
              <a className={styles.secondaryAction} href={examplesUrl}>
                Explore live examples
              </a>
            </div>
          </div>
        </header>

        <section className={styles.gallery} aria-labelledby="featured-projects">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.sectionNumber}>01</p>
              <h2 id="featured-projects">Featured project</h2>
            </div>
            <p>Rendering the atmosphere as a living record.</p>
          </div>

          <article className={styles.projectCard}>
            <a
              className={styles.projectImageLink}
              href={CLIMATE_GLOBE_DEMO_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="Open the Climate Globe live project"
            >
              <img
                className={styles.projectImage}
                src={climateGlobeImageUrl}
                alt="Climate Globe showing atmospheric carbon dioxide data on a glowing orange globe"
              />
              <span className={styles.imageAction} aria-hidden="true">
                View live project <span>↗</span>
              </span>
            </a>

            <div className={styles.projectDetails}>
              <div>
                <p className={styles.projectType}>Data visualization · WebGL2</p>
                <h3>Climate Globe</h3>
                <p className={styles.projectAuthor}>
                  By{' '}
                  <a href={NIKITA_ROKOTYAN_URL} target="_blank" rel="noreferrer">
                    Nikita Rokotyan
                  </a>
                </p>
              </div>

              <div className={styles.projectStory}>
                <p>
                  Twenty-three years of CO₂, methane, carbon monoxide, and near-surface
                  temperature become a globe that swells and reddens month by month.
                </p>
                <p>
                  The project places 280 months of NASA AIRS data in a texture atlas, then uses
                  the GPU to interpolate the record and reshape the globe in real time.
                </p>

                <ul className={styles.projectTags} aria-label="Project technologies">
                  <li>luma.gl</li>
                  <li>WebGL2</li>
                  <li>NASA AIRS</li>
                </ul>

                <div className={styles.projectActions}>
                  <a
                    className={styles.primaryAction}
                    href={CLIMATE_GLOBE_DEMO_URL}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Explore Climate Globe <span aria-hidden="true">↗</span>
                  </a>
                  <a
                    className={styles.secondaryAction}
                    href={CLIMATE_GLOBE_SOURCE_URL}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View source
                  </a>
                </div>
              </div>
            </div>
          </article>
        </section>

        <aside className={styles.contribute}>
          <p className={styles.eyebrow}>Your work belongs here</p>
          <div>
            <h2>Built something with luma.gl?</h2>
            <p>Open a pull request and help this showcase grow.</p>
          </div>
          <a href={LUMA_GL_REPOSITORY_URL} target="_blank" rel="noreferrer">
            Share your project <span aria-hidden="true">↗</span>
          </a>
        </aside>
      </main>
    </Layout>
  );
}
