/* eslint-disable react/no-array-index-key */
// Copyright (c) 2018 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

import React from 'react';
import PropTypes from 'prop-types';
import GithubIcon from 'react-icons/lib/go/mark-github';

import {isInternalURL} from '../../utils/links-utils.js';
import {
  HamburgerMenu,
  Header as StyledHeader,
  HeaderLink,
  HeaderLinkExternal,
  HeaderLogo,
  HeaderLogoExternal,
  HeaderLinksBlock,
  HeaderLinkContainer,
  HeaderMenuBlock,
  HeaderMenu,
  HeaderMenuLink,
  HeaderMenuBackground,
  TocToggle
} from '../styled/header';

// import GithubStars from './github-stars.jsx';

export const propTypes = {
  config: PropTypes.object.isRequired
};

function GithubLink() {
  return (
    <>
      GitHub
      <GithubIcon style={{marginLeft: '0.5rem', display: 'inline'}} />
    </>
  );
}

function UniversalHeaderLink({to, href, label}) {
  const isInternal = href ? isInternalURL(href) : isInternalURL(to);

  if (isInternal) {
    return <HeaderLink to={to || href}>{label}</HeaderLink>;
  } else {
    return (
      <HeaderLinkExternal href={to || href} target="_blank">
        {label}
      </HeaderLinkExternal>
    );
  }
}

function UniversalLogoLink({to, label}) {
  const isInternal = isInternalURL(to);

  if (isInternal) {
    return <HeaderLogo to={to}>{label}</HeaderLogo>;
  } else {
    return (
      <HeaderLogoExternal href={to} target="_blank">
        {label}
      </HeaderLogoExternal>
    );
  }
}

/**
 * Generate all the links in the header.
 * @param  {Object} props Input props which includes site config.
 * @return {Array}  Array of link object ({label, to, href, classnames})
 */
export function generateHeaderLinks(props) {
  const {config = {}} = props;

  const exampleLink = config.EXAMPLES &&
    config.EXAMPLES.length > 0 && {label: 'Examples', to: '/examples'};

  const githubLink = config.PROJECT_TYPE === 'github' && {
    href: `https://github.com/${config.PROJECT_ORG}/${config.PROJECT_NAME}`,
    label: <GithubLink />
  };

  const links = [
    exampleLink,
    {label: 'Documentation', to: config.HOME_PATH ? '/' : '/docs'},
    {label: 'Search', to: '/search'}
  ];

  if (config.ADDITIONAL_LINKS && config.ADDITIONAL_LINKS.length > 0) {
    config.ADDITIONAL_LINKS.map((link) => ({
      ...link,
      label: link.name
    })).forEach((link) => {
      if (Number.isFinite(link.index)) {
        links.splice(link.index, 0, link);
      } else {
        links.push(link);
      }
    });
  }

  links.push(githubLink);

  return links.filter(Boolean);
}

const HeaderLinks = ({links}) => {
  return (
    <HeaderLinksBlock>
      {/* If the no examples marker, return without creating pages */}
      {links.map((link, index) => (
        <HeaderLinkContainer key={`link-${index}`}>
          <UniversalHeaderLink {...link} />
        </HeaderLinkContainer>
      ))}
      {/* this.renderStars() */}
    </HeaderLinksBlock>
  );
};

const ControlledHeader = ({
  links,
  config = {},
  toggleMenu,
  toggleToc,
  isTocOpen,
  isMenuOpen,
  isSmallScreen
}) => {
  const {PROJECT_NAME, PROJECTS = [], HEADER_LINK_URL = '/'} = config;

  const externalLinks = PROJECTS.map(({name, url}) => (
    <HeaderMenuLink key={`menulink-${name}`} href={url}>
      {name}
    </HeaderMenuLink>
  ));

  const onClickHamburger = (event) => {
    toggleMenu(!isMenuOpen);
    event.stopPropagation();
  };

  return isSmallScreen ? (
    <StyledHeader onClick={() => toggleMenu(false)}>
      <HeaderMenuBlock>
        <UniversalLogoLink to={HEADER_LINK_URL} label={PROJECT_NAME} />
        <HeaderMenu $collapsed={!isMenuOpen} $nbItems={links.length + 1}>
          <HeaderLinks links={links} />
        </HeaderMenu>
      </HeaderMenuBlock>

      {toggleToc && (
        <TocToggle
          onClick={() => {
            toggleMenu(false);
            toggleToc(!isTocOpen);
          }}
        >
          Table of Contents
        </TocToggle>
      )}

      <HamburgerMenu onClick={onClickHamburger} />

      {isMenuOpen && <HeaderMenuBackground />}
    </StyledHeader>
  ) : (
    <StyledHeader onClick={() => toggleMenu(false)}>
      <HeaderMenuBlock>
        <HamburgerMenu onClick={onClickHamburger} />
        <UniversalLogoLink to={HEADER_LINK_URL} label={PROJECT_NAME} />
        <HeaderMenu $collapsed={!isMenuOpen} $nbItems={PROJECTS.length}>
          {externalLinks}
        </HeaderMenu>
      </HeaderMenuBlock>

      <HeaderLinks links={links} />

      {isMenuOpen && <HeaderMenuBackground />}
    </StyledHeader>
  );
};

export default ControlledHeader;
