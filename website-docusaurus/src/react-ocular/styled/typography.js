import styled from 'styled-components';
import {Link} from 'gatsby';

export const A = styled.a`
  text-decoration: none;
  color: ${(props) => props.theme.colors.linkText};
  &:visited {
    color: ${(props) => props.theme.colors.linkVisited};
  }
  &:active {
    color: ${(props) => props.theme.colors.linkHover};
  }
  &:hover {
    color: ${(props) => props.theme.colors.linkHover};
  }
`;

export const GatsbyA = styled(Link)`
  text-decoration: none;
  color: ${(props) => props.theme.colors.linkText};
  &:visited {
    color: ${(props) => props.theme.colors.linkVisited};
  }
  &:active {
    color: ${(props) => props.theme.colors.linkHover};
  }
  &:hover {
    color: ${(props) => props.theme.colors.linkHover};
  }
`;

export const H1 = styled.h1`
  font: ${(props) => props.theme.typography.font800};
  letter-spacing: 0.02em;
  margin: 4px 0 24px;
`;

export const H2 = styled.h2`
  font: ${(props) => props.theme.typography.font700};
  margin: 24px 0 16px;
`;

export const H3 = styled.h3`
  font: ${(props) => props.theme.typography.font600};
`;

export const H4 = styled.h4`
  font: ${(props) => props.theme.typography.font500};
`;

export const H5 = styled.h5`
  font: ${(props) => props.theme.typography.font450};
`;

export const H6 = styled.h6`
  font: ${(props) => props.theme.typography.font350};
`;

export const P = styled.p`
  margin: '0 0 16px';
`;

export const List = styled.ul`
  margin: 0 0 12px;
`;

export const ListItem = styled.li`
  margin-bottom: 4px;
`;

export const MarkdownBody = styled.div`
  font: ${(props) => props.theme.typography.font300};
  padding: 36px;
  max-width: 692px;
`;

export const InlineCode = styled.code`
  background-color: ${(props) => props.theme.colors.mono200};
  border-radius: ${(props) => props.theme.sizing.scale100};
  padding: 0 5px;
  font-family: Consolas, Menlo, Monaco, 'Andale Mono WT', 'Andale Mono', 'Lucida Console',
    'Lucida Sans Typewriter', 'DejaVu Sans Mono', 'Bitstream Vera Sans Mono', 'Liberation Mono',
    'Nimbus Mono L', 'Courier New', Courier, monospace;
  font-size: 0.9em;
  margin: 1px 0;
  line-height: calc(1.5em / 0.9 - 2px);
  display: inline-block;
  vertical-align: top;
`;

export const CodeBlock = styled.code`
  font-family: Consolas, Menlo, Monaco, 'Andale Mono WT', 'Andale Mono', 'Lucida Console',
    'Lucida Sans Typewriter', 'DejaVu Sans Mono', 'Bitstream Vera Sans Mono', 'Liberation Mono',
    'Nimbus Mono L', 'Courier New', Courier, monospace;
  font-size: 0.9em;
  direction: ltr;
  text-align: left;
  white-space: pre;
  word-spacing: normal;
  word-break: normal;
  tab-size: 4;
  hyphens: none;
  background-color: ${(props) => props.theme.colors.mono200};
`;

export const Pre = styled.pre`
  font-size: 14px;
  background-color: ${(props) => props.theme.colors.mono200};
  padding: ${(props) => props.theme.sizing.scale200};
  overflow-x: auto;

  .token.comment,
  .token.prolog,
  .token.doctype,
  .token.cdata {
    color: slategray;
  }

  .token.punctuation {
    color: #999;
  }

  .token.namespace {
    opacity: 0.7;
  }

  .token.property,
  .token.tag,
  .token.boolean,
  .token.number,
  .token.constant,
  .token.symbol,
  .token.deleted {
    color: #905;
  }

  .token.selector,
  .token.attr-name,
  .token.string,
  .token.char,
  .token.builtin,
  .token.inserted {
    color: #690;
  }

  .token.operator,
  .token.entity,
  .token.url,
  .language-css .token.string,
  .style .token.string {
    color: #9a6e3a;
    background: hsla(0, 0%, 100%, 0.5);
  }

  .token.atrule,
  .token.attr-value,
  .token.keyword {
    color: #07a;
  }

  .token.function,
  .token.class-name {
    color: #dd4a68;
  }

  .token.regex,
  .token.important,
  .token.variable {
    color: #e90;
  }

  .token.important,
  .token.bold {
    font-weight: bold;
  }
  .token.italic {
    font-style: italic;
  }

  .token.entity {
    cursor: help;
  }
`;

export const Img = styled.img`
  max-width: 100%;
`;

export const BlockQuote = styled.blockquote`
  background-color: ${(props) => props.theme.colors.warning100};
  margin-inline-start: 0;
  margin-inline-end: 0;
  padding: ${(props) => props.theme.sizing.scale400} ${(props) => props.theme.sizing.scale600};
`;

export const Table = styled.table`
  border-collapse: collapse;
  border-spacing: 1px;
  width: 100%;
`;

export const TableHeaderCell = styled.th`
  padding: 4px;
  text-align: left;
  background: ${(props) => props.theme.colors.mono200};
  font-weight: bold;
  border: 1px solid ${(props) => props.theme.colors.mono400};
`;

export const TableBodyCell = styled.td`
  padding: 4px;
  text-align: left;
  border: 1px solid ${(props) => props.theme.colors.mono400};
`;
