import React from 'react'
import Helmet from 'react-helmet'
import styled from 'styled-components'

import { graphql } from 'gatsby'

import SEO from '../components/common/SEO'
import SiteHeader from '../components/layout/header'
import ExampleTableOfContents from '../components/layout/example-table-of-contents'

import DemoRunner from '../../../../src/demo-runner';
import DEMOS from '../../../../src/demos';

/* eslint no-undef: "off" */
export const query = graphql`
  query ExampleBySlug($slug: String!) {
    exampleBySlug: markdownRemark(fields: { slug: { eq: $slug } }) {
      html
      timeToRead
      excerpt
      frontmatter {
        title
        cover
        date
        category
        tags
      }
    }
    tableOfContents: docsJson {
      chapters {
        title
        level
        chapters {
          title
          level
          entries {
            id
            childMarkdownRemark {
              id
              frontmatter {
                title
              }
              fields {
                slug
              }
            }
          }
        }
        entries {
          id
          childMarkdownRemark {
            id
            frontmatter {
              title
            }
            fields {
              slug
            }
          }
        }
      }
    }
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

        entries {
          entry {
            id
            childMarkdownRemark {
              fields {
                slug
              }
              frontmatter {
                title
              }
            }
          }
        }
        chapters {
          title
          entries {
            entry {
              id
              childMarkdownRemark {
                fields {
                  slug
                }
                frontmatter {
                  title
                }
              }
            }
          }
          chapters {
            title
            entries {
              entry {
                id
                childMarkdownRemark {
                  fields {
                    slug
                  }
                  frontmatter {
                    title
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`
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

const HeaderContainer = styled.div`
  grid-column: 1 / 3;
  grid-row: 1 / 2;
  z-index: 2;
  @media screen and (max-width: 600px) {
    order: 1;
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

export default class ExampleTemplate extends React.Component {
  render() {
    const {data, pathContext, location} = this.props;
    const {config} = data.site.siteMetadata;

    const { slug } = pathContext

    /*
    const docNode = data.exampleBySlug
    const doc = docNode.frontmatter
    if (!doc.id) {
      doc.id = slug
    }
    if (!doc.id) {
      doc.category_id = config.postDefaultCategoryID
    }
    */

    // const {tableOfContents} = data;

    const tableOfContents = [{
      title: 'Examples',
      entries: []
    }];

    for (const demoName in DEMOS) {
      const demo = DEMOS[demoName];

      tableOfContents[0].entries.push(Object.assign({entry: demoName, title: demoName}, demo));
    }

    console.log(tableOfContents);

    return (
      <div>
        <Helmet>
          <title>{`${slug} | ${config.siteTitle}`}</title>
        </Helmet>
        { /* <SEO postPath={slug} postNode={docNode} postSEO /> */ }
        <BodyGrid>
          <HeaderContainer>
            <SiteHeader data={data} location={location} />
          </HeaderContainer>
          <ToCContainer>
            <ExampleTableOfContents chapters={tableOfContents} />
          </ToCContainer>
          <BodyContainer>
            <div>
              <DemoRunner demo={DEMOS[slug].demo} sourceLink={DEMOS[slug].path} />
              { /*  <div dangerouslySetInnerHTML={{ __html: docNode.html }} /> */ }
            </div>
          </BodyContainer>
        </BodyGrid>
      </div>
    )
  }
}
