import React from 'react';
import {Home} from '@vis.gl/docusaurus-website/components';
import InstancingExample from '../templates/showcase/example-instancing';
import styled from 'styled-components';

if (typeof window !== 'undefined') {
  window.website = true;
}

const Bullet = styled.li`
  background: url(images/icon-high-precision.svg) no-repeat left top;
  list-style: none;
  max-width: 540px;
  padding: 8px 0 12px 42px;
  font: ${props => props.theme.typography.font300};
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
    return (
      <Home HeroExample={HeroExample} >
        <ContentContainer>
          <h2>High-performance toolkit for GPU-based data visualization.</h2>
          <ul>
            <Bullet>
              The core GPU framework behind the vis.gl suite of data visualization tools.
            </Bullet>
            <Bullet>
              Focused on high-performance big data visualization and compute.
            </Bullet>
            <Bullet>
              Supports latest Web GPU standards, including WebGPU. WebGL 2 and glTF.
            </Bullet>
            <Bullet>
              A Linux Foundation projection: open source and open governance.
            </Bullet>
            <Bullet>
              Used applications like <a href="https://deck.gl">deck.gl</a>, <a href="https://kepler.gl">kepler.gl</a>, and <a href="https://avs.auto">avs.auto</a>.
            </Bullet>
          </ul>
        </ContentContainer>
      </Home>
    );
  }
}
