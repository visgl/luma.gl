import { graphql } from 'gatsby'

export const query = graphql`
  fragment SiteConfigFragment on Site {
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

  fragment MarkdownNodeFragment on MarkdownRemark {
    id
    fields {
      slug
      slugslug
    }
    frontmatter {
      title
    }
  }
`;
