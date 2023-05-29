/* eslint-disable react/no-did-update-set-state */
// This is the top-level "Layout" component that doesn't get unmounted between
// page loads. This component is wrapped around the react component returned by
// each page by 'gatsby-plugin-layout'

import React from 'react';
import Helmet from 'react-helmet';
import MediaQuery from 'react-responsive';
import {ThemeProvider, createGlobalStyle} from 'styled-components';
import {withPrefix} from 'gatsby';

import {WebsiteConfigProvider} from '../components/website-config';
import SEO from '../components/SEO';
import TableOfContents from '../components/table-of-contents';
import Header from '../components/header';
import DocsHeader from '../components/docs-header';

import defaultTheme from '../default-theme';
import createTheme from '../styled/create-theme';

import {BodyContainerFull, BodyContainerToC, Body} from '../styled/body';

import {HeaderContainer} from '../styled/header';
import {TocContainer} from '../styled/toc';

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    overflow-x: hidden;
    -webkit-text-size-adjust: 100%;
  }
  * {
    box-sizing: border-box;
  }
`;

// TODO/ib - restore footer
// import Footer from './footer';

function ResponsiveHeader(props) {
  const HeaderComponent = props.isDocHeader ? DocsHeader : Header;
  return (
    <div>
      <MediaQuery maxWidth={768}>
        <HeaderComponent {...props} isSmallScreen />
      </MediaQuery>
      <MediaQuery minWidth={769}>
        <HeaderComponent {...props} />
      </MediaQuery>
    </div>
  );
}

export default class Layout extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isMenuOpen: false,
      isTocOpen: false
    };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.pageContext.slug !== this.props.pageContext.slug) {
      this.setState({isTocOpen: false, isMenuOpen: false});
    }
  }

  getTheme() {
    const {config} = this.props;
    const primitives = Object.assign({}, defaultTheme);
    if (config.THEME_OVERRIDES) {
      Object.assign(primitives, JSON.parse(config.THEME_OVERRIDES));
    }

    return createTheme(primitives);
  }

  toggleMenu(on) {
    this.setState({isMenuOpen: on});
  }

  toggleToc(on) {
    this.setState({isTocOpen: on});
  }

  renderBodyWithTOC(config, tableOfContents) {
    const {children} = this.props;
    const {isMenuOpen, isTocOpen} = this.state;
    // first div is to avoid the BodyGrid div className to be overwritten
    return (
      <Body>
        <HeaderContainer>
          <ResponsiveHeader
            config={config}
            isMenuOpen={isMenuOpen}
            isTocOpen={isTocOpen}
            toggleToc={this.toggleToc.bind(this)}
            toggleMenu={this.toggleMenu.bind(this)}
            isDocHeader
          />
        </HeaderContainer>
        <TocContainer $isTocOpen={isTocOpen}>{this.renderTOC(tableOfContents)}</TocContainer>

        <BodyContainerToC>{React.cloneElement(children, {config: config})}</BodyContainerToC>
        {/* <Footer /> */}
      </Body>
    );
  }

  renderBodyFull(config) {
    const {children} = this.props;
    const {isMenuOpen} = this.state;
    return (
      <Body>
        <HeaderContainer>
          <ResponsiveHeader
            config={config}
            isMenuOpen={isMenuOpen}
            toggleMenu={this.toggleMenu.bind(this)}
          />
        </HeaderContainer>

        <BodyContainerFull>{React.cloneElement(children, {config: config})}</BodyContainerFull>

        {/* <Footer /> */}
      </Body>
    );
  }

  renderTOC(tableOfContents) {
    const {pageContext} = this.props;
    let toc;
    if (pageContext.toc === 'docs') {
      toc = tableOfContents.chapters;
    } else {
      toc = pageContext.toc;
    }
    if (!Array.isArray(toc)) {
      throw new Error(`Unknown toc type ${pageContext.toc}`);
    }

    return <TableOfContents chapters={toc} slug={pageContext.slug} />;
  }

  render() {
    // Since gatsby's StaticQueries can't run in a plugin, we rely on the app website's
    // Layout wrapper component to query for us and pass in the data.
    const {pageContext, config, tableOfContents, path} = this.props;

    const theme = this.getTheme();
    let title = config.PROJECT_NAME;
    if (pageContext.title) {
      title = `${pageContext.title} | ${title}`;
    }

    return (
      <WebsiteConfigProvider value={{config, theme, tableOfContents}}>
        <GlobalStyle />
        <ThemeProvider theme={theme}>
          <div>
            <SEO path={path} pageContext={pageContext} config={config} />
            <Helmet>
              <title>{title}</title>
              {config.STYLESHEETS.map((url, i) => {
                return <link key={i} rel="stylesheet" href={withPrefix(url)} type="text/css" />;
              })}
              <link rel="icon" type="img/ico" href="favicon.ico" />
            </Helmet>
            {pageContext.toc
              ? this.renderBodyWithTOC(config, tableOfContents)
              : this.renderBodyFull(config)}
          </div>
        </ThemeProvider>
      </WebsiteConfigProvider>
    );
  }
}
