import React from 'react';
import {Link} from 'gatsby';
import {isMobile} from './body';

import styled from 'styled-components';

export const Header = styled.header`
  z-index: 1001;
  align-items: center;
  background-color: ${(props) => props.theme.colors.mono1000};
  color: ${(props) => props.theme.colors.mono100};
  display: flex;
  height: ${(props) => props.theme.sizing.scale1600};
  justify-content: space-between;
  padding: 0 36px;
  top: 0;
  left: 0;
  width: 100vw;
  user-select: none;
  white-space: nowrap;
  position: fixed;
  ${isMobile} {
    position: static;
  }
`;

export const HeaderContainer = styled.div`
  grid-column: 1/3;
  grid-row: 1/2;
  ${isMobile} {
    order: 1;
  }
`;

export const HeaderMenuBlock = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
`;

export const HeaderLogo = styled(Link)`
  font: ${(props) => props.theme.typography.font450};
  text-decoration: none;
  color: ${(props) => props.theme.colors.mono100};
  &:visited {
    color: ${(props) => props.theme.colors.mono100};
  }
  &:active {
    color: ${(props) => props.theme.colors.mono200};
  }
  &:hover {
    color: ${(props) => props.theme.colors.mono200};
  }
`;

export const HeaderLogoExternal = styled.a`
  font: ${(props) => props.theme.typography.font450};
  text-decoration: none;
  &:visited {
    color: ${(props) => props.theme.colors.mono100};
  }
  &:active {
    color: ${(props) => props.theme.colors.mono200};
  }
  &:hover {
    color: ${(props) => props.theme.colors.mono200};
  }
`;

export const HeaderMenu = styled.div`
  background: ${(props) => props.theme.colors.mono1000};
  display: flex;
  box-sizing: content-box;
  flex-direction: column;
  position: absolute;
  overflow: hidden;
  min-width: 180px;
  max-height: ${(props) => (props.$collapsed ? 0 : props.$nbItems * 48)}px;
  padding-bottom: ${(props) => (props.$collapsed ? 0 : props.theme.sizing.scale800)};
  top: ${(props) => props.theme.sizing.scale1600};
  left: ${(props) => props.theme.sizing.scale600};
  transition-property: max-height, padding-bottom;
  transition-duration: ${(props) => props.theme.animation.timing400};
  transition-timing-function: ${(props) => props.theme.animation.easeInOutCurve};
  z-index: 100;

  ${isMobile} {
    width: 100%;
    left: 0;
  }
`;

export const HeaderMenuBackground = styled.div`
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background: transparent;
  z-index: 1;

  ${isMobile} {
    background: rgba(0, 0, 0, 0.3);
  }
`;

export const HeaderMenuLink = styled.a`
  display: block;
  padding: ${(props) => props.theme.sizing.scale400} ${(props) => props.theme.sizing.scale1600};
  text-decoration: none;
  font: ${(props) => props.theme.typography.font300};

  ${isMobile} {
    font: ${(props) => props.theme.typography.font500};
  }
  &:visited {
    color: ${(props) => props.theme.colors.mono100};
  }
  &:active {
    color: ${(props) => props.theme.colors.mono200};
  }
  &:hover {
    color: ${(props) => props.theme.colors.mono200};
  }
`;

export const HeaderLinksBlock = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;

  ${isMobile} {
    display: block;
  }
`;

const StyledHamburgerMenu = styled.div`
  cursor: pointer;
  justify-content: space-between;
  display: flex;
  flex-direction: column;
  padding: 3px 1px 4px;
  margin-right: ${(props) => props.theme.sizing.scale600};
  height: ${(props) => props.theme.sizing.scale800};
  width: ${(props) => props.theme.sizing.scale800};
`;

const HamburgerBar = styled.div`
  background-color: ${(props) => props.theme.colors.mono100};
  height: 1px;
  width: 100%;
`;

export const HamburgerMenu = ({onClick}) => (
  <StyledHamburgerMenu onClick={onClick}>
    <HamburgerBar />
    <HamburgerBar />
    <HamburgerBar />
  </StyledHamburgerMenu>
);

export const HeaderLink = styled(Link)`
  color: ${(props) => props.theme.colors.mono100};
  text-decoration: none;
  &:visited {
    color: ${(props) => props.theme.colors.mono100};
  }
  &:active {
    color: ${(props) => props.theme.colors.mono200};
  }
  &:hover {
    color: ${(props) => props.theme.colors.mono200};
  }
`;

export const HeaderLinkExternal = styled.a`
  color: ${(props) => props.theme.colors.mono100};
  text-decoration: none;
  &:visited {
    color: ${(props) => props.theme.colors.mono100};
  }
  &:active {
    color: ${(props) => props.theme.colors.mono200};
  }
  &:hover {
    color: ${(props) => props.theme.colors.mono200};
  }
`;

export const HeaderLinkContainer = styled.div`
  font: ${(props) => props.theme.typography.font300};
  flex: 1 1 0;
  padding-left: ${(props) => props.theme.sizing.scale700};

  ${isMobile} {
    font: ${(props) => props.theme.typography.font500};
    padding: ${(props) => props.theme.sizing.scale400} ${(props) => props.theme.sizing.scale1000};
  }
`;

export const TocToggle = styled.div`
  color: ${(props) => props.theme.colors.mono100};
  cursor: pointer;
  line-height: ${(props) => props.theme.sizing.scale1600};
  user-select: none;
`;
