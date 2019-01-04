import React, {Component} from 'react'
import styled from 'styled-components'

import { graphql } from 'gatsby';

// import Layout, {ContextConsumerComponent} from '../components/layout'
import ExampleTableOfContents from '../components/layout/example-table-of-contents'

import DEMOS from '../../../../src/demos';

/* eslint no-undef: "off" */
export const query = graphql`
  query ExamplesQuery {
    site {
      siteMetadata {
        config {
          siteTitle,
          siteLogo,
          siteDescription,
          PROJECT_NAME,
          PROJECT_TYPE,
          HOME_HEADING,
          HOME_BULLETS {
            text
            desc
            img
          }
        }
      }
    }
  }
`;

/*
class Gallery extends Component {

  render() {
    // const {children, route: {path, pages}, isMenuOpen} = this.props;

    return (
      <div className="gallery-wrapper">
        { /* TODO - add thumbnails
        <div className={'flexbox-item flexbox-item--fill'}>
          { children }
        </div>
        * }
      </div>
    );
  }
}
*/

const BodyGrid = styled.div`
  height: 100vh;
  display: grid;
  grid-template-rows: 75px 1fr;
  grid-template-columns: 300px 1fr;

  @media screen and (max-width: 600px) {
    display: flex;
    flex-direction: column;
    height: inherit;
  }
`

const BodyContainer = styled.div`
  grid-column: 2 / 3;
  grid-row: 2 / 3;
  overflow: scroll;
  justify-self: center;
  width: 100%;
  padding: ${props => props.theme.sitePadding};
  @media screen and (max-width: 600px) {
    order: 2;
  }

  & > div {
    max-width: ${props => props.theme.contentWidthLaptop};
    margin: auto;
  }

  & > h1 {
    color: ${props => props.theme.accentDark};
  }
`

const ToCContainer = styled.div`
  grid-column: 1 / 2;
  grid-row: 2 / 3;
  background: ${props => props.theme.lightGrey};
  overflow: scroll;
  @media screen and (max-width: 600px) {
    order: 3;
    overflow: inherit;
  }
`

export default class Examples extends Component {
  render() {
    const {data, pageContext} = this.props;
    const {config} = data.site.siteMetadata;

    const examplesTable = [{
      title: 'Examples',
      entries: []
    }];

    for (const demoName in DEMOS) {
      const demo = DEMOS[demoName];

      examplesTable[0].entries.push(Object.assign({entry: demoName, title: demoName}, demo));
    }

    return (
      <BodyGrid>
        <ToCContainer>
          <ExampleTableOfContents chapters={examplesTable} />
        </ToCContainer>
        <BodyContainer>
          <main>
            { // Add example thumbnail gallery <Gallery />
            }
          </main>
        </BodyContainer>
      </BodyGrid>
    )
  }
}
