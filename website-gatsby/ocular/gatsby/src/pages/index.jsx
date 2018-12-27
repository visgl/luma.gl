import React from 'react'
import Helmet from 'react-helmet'
import styled from 'styled-components'

import { graphql } from 'gatsby'

import SEO from '../components/common/SEO'
// import CtaButton from '../components/CtaButton'
// import Header from '../components/layout/navigation'
import Header from '../components/layout/header'
// import Footer from '../components/layout/footer';

import Home from '../components/home';

/* eslint no-undef: "off" */
export const query = graphql`
  query IndexQuery {
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
    allMarkdown: allMarkdownRemark(
      limit: 2000
    ) {
      edges {
        node {
          fields {
            slug
          }
          excerpt
          timeToRead
          frontmatter {
            title
            tags
            cover
          }
        }
      }
    }
  }
`;

const IndexHeadContainer = styled.div`
  background: ${props => props.theme.brand};
  padding: ${props => props.theme.sitePadding};
  text-align: center;
`

export default class Index extends React.Component {
  render() {
    const {data} = this.props;

    const {config} = data.site.siteMetadata;
    const allSEOMarkdown = data.allMarkdown.edges

    return (
      <div className="index-container">
        <Helmet title={config.siteTitle} />
        <SEO postEdges={allSEOMarkdown} />
        <main>
          <IndexHeadContainer>
            <Header data={data} />
          </IndexHeadContainer>
          <Home data={data} />
          { /*
          <BodyContainer>
          <Home data={this.props.data} />
          <CtaButton to={'docs/whats-new'}>See What&#8217;s New</CtaButton>
          </BodyContainer>
          */ }
          { /* <Footer /> */ }
        </main>
      </div>
    )
  }
}
