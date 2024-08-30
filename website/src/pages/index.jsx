import React from 'react';
import Layout from '@theme/Layout';
import {Home} from '@vis.gl/docusaurus-website/components';
import {InstancingExample} from '../examples';
import styled from 'styled-components';

if (typeof window !== 'undefined') {
  window.website = true;
}

const Bullet = styled.li`
  background: url(img/icon-high-precision.svg) no-repeat left top;
  list-style: none;
  max-width: 540px;
  margin-top: 8px;
  padding: 0 0 12px 56px;
  font: 16px;
`;

const ContentContainer = styled.div`
  padding: 64px;

  @media screen and (max-width: 768px) {
    padding: 48px;
  }
`;

const HeroExample = () => <InstancingExample panel={false} />

export default class IndexPage extends React.Component {
  render() {
    return <Layout title="Home" description="luma.gl">
      <main>
        <Home HeroExample={HeroExample} getStartedLink="./docs/developer-guide/installing" theme="dark" />
        <ContentContainer>
          <h2>High-performance toolkit for GPU-based data visualization.</h2>
          <ul>
            <Bullet>
            Focused on high-performance data processing, e.g. instanced rendering and GPU compute.
            </Bullet>
            <Bullet>
            The core 3D rendering technology behind tools such as
            deck.gl, kepler.gl, and avs.auto.
            </Bullet>
            <Bullet>
            A clean TypeScript and WebGPU friendly GPU API that works across WebGPU and WebGL 2.
            </Bullet>
          </ul>
        </ContentContainer>
      </main>
    </Layout>;
  }
}
