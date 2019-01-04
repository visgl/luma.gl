// This is the top-level "Layout" component that doesn't get unmounted between
// page loads. This component is wrapped around the react component returned by
// each page by 'gatsby-plugin-layout'

import React from 'react'
import Helmet from 'react-helmet'
import styled from 'styled-components'
import { StaticQuery, graphql } from 'gatsby'

import {WebsiteConfigProvider} from './website-config';

import SEO from '../common/SEO'

import TableOfContents from './table-of-contents'
import ExampleTableOfContents from './example-table-of-contents'
import Header from './header'
// TODO/ib - restore footer
// import Footer from './footer';

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

const HeaderContainer = styled.div`
  grid-column: 1 / 3;
  grid-row: 1 / 2;
  z-index: 2;
  @media screen and (max-width: 600px) {
    order: 1;
  }
`

const BodyContainerFull = styled.div`
  padding: ${props => props.theme.sitePadding};
  max-width: ${props => props.theme.contentWidthLaptop};
  margin: 0 auto;

  .contributors {
    max-width: 400px;
    margin: 100px auto 0;
  }
`
const BodyContainerToC = styled.div`
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

export default class Layout extends React.Component {

  renderTOC(config, tableOfContents) {
    const {pageContext} = this.props;

    switch (pageContext.toc) {
    case 'docs':
      return <TableOfContents chapters={tableOfContents.chapters} />;

    case 'examples':
      const {EXAMPLES} = config;

      const examplesTOC = [{
        title: 'Examples',
        entries: []
      }];

      for (const example of EXAMPLES) {
        const exampleEntry = Object.assign({
          entry: example.title
        }, example);
        examplesTOC[0].entries.push(exampleEntry);
      }

      return <ExampleTableOfContents chapters={examplesTOC} />;

    default:
      console.warn(`Unknown toc type ${pageContext.toc}`);
      break;
    }
  }

  renderBodyWithTOC(config, tableOfContents) {
    const {children} = this.props;

    return (
      <BodyGrid>
        <HeaderContainer>
          <Header config={config} />
        </HeaderContainer>

        <ToCContainer>
          { this.renderTOC(config, tableOfContents) }
        </ToCContainer>

        <BodyContainerToC>
          { children }
        </BodyContainerToC>

        { /* <Footer /> */ }

      </BodyGrid>
    );
  }

  renderBodyFull(config) {
    const {children} = this.props;

    return (
      <div>
        <HeaderContainer>
          <Header config={config} />
        </HeaderContainer>

        <BodyContainerFull>
          { children }
        </BodyContainerFull>

        {/* <Footer /> */}

      </div>
    );
  }

  render() {
    // Since gatsby's StaticQueries can't run in a plugin, we rely on the app website's
    // Layout wrapper component to query for us and pass in the data.
    const {pageContext, config, tableOfContents, allMarkdown} = this.props;

    return (
      <WebsiteConfigProvider value={{config, tableOfContents, allMarkdown}}>

        <div>
          { allMarkdown
            ? <SEO postEdges={allMarkdown} />
            : (
                <Helmet>
                  <title>{config.PROJECT_NAME}</title>
                </Helmet>
              )
          }
          { pageContext.toc
            ? this.renderBodyWithTOC(config, tableOfContents)
            : this.renderBodyFull(config)
          }
        </div>

      </WebsiteConfigProvider>
    )
  }
}
