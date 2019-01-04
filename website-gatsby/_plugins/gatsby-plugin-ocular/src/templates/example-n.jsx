import React from 'react'
import styled from 'styled-components'
import { graphql } from 'gatsby'

import ExampleTableOfContents from '../components/layout/example-table-of-contents'

import {getReactComponent} from '../gatsby-config/component-registry';

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
        category
        tags
      }
    }
  }
`;

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
    const {pathContext} = this.props;
    const {slug} = pathContext;

    // Get app website's demo runner
    const DemoRunner = getReactComponent('DemoRunner');
    const DEMOS = getReactComponent('DEMOS');

    const demo = DEMOS[slug];
    if (!demo) {
      console.warn(`No demo found: ${slug}`);
    }

    console.log(demo);

    return (
      <main>
        { demo && <DemoRunner demo={demo.demo} sourceLink={demo.path} /> }
      </main>
    )
  }
}
