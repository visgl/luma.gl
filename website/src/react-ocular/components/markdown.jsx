import React, {cloneElement} from 'react';
import {MDXRenderer} from 'gatsby-plugin-mdx';
import {MDXProvider} from '@mdx-js/react';

// note - these typographic elements are taken directly from baseui.
// we can consider customizing them by first importing in styled/index, then
// giving them special parameters

import {
  A,
  GatsbyA,
  CodeBlock,
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  InlineCode,
  P,
  List,
  ListItem,
  Pre,
  Img,
  BlockQuote,
  Table,
  TableHeaderCell,
  TableBodyCell
} from '../styled/typography';

import {parseLinks} from '../../utils/links-utils.js';

const CustomLinkWrapper = (path, relativeLinks, config) => {
  const CustomLink = ({href, ...props}) => {
    const updatedLink = parseLinks(href, path, relativeLinks, config);
    return updatedLink ? <GatsbyA to={updatedLink} {...props} /> : <A href={href} {...props} />;
  };
  return CustomLink;
};

const CustomPre = (props) => {
  // the point of this component is to distinguish styling of inline <code /> elements
  // with code blocks (ie <pre><code>...</code></pre>).

  const {children, ...otherProps} = props;
  return (
    <Pre {...otherProps}>
      {React.Children.map(children, (child) => {
        // this means a child of this <pre> element is a <code> element, or <code> element styled
        // by Styletron
        if (child.type === 'code' || child.type.displayName === 'Styled(code)') {
          return <CodeBlock {...child.props} />;
        }
        // else we just clone the element as is
        return React.cloneElement(child);
      })}
    </Pre>
  );
};

const API_REGEX = /^code-classlanguage-text(.*?)code/;
const CODE_REGEX = /code-classlanguage-text(.*?)code/g;

// Sanitize auto generated anchor ids
const CustomHeader = (ComponentType, id, props, anchors) => {
  if (!id) {
    return <ComponentType {...props} />;
  }

  if (API_REGEX.test(id)) {
    id = id.match(API_REGEX)[1];
  } else {
    id = id.replace(CODE_REGEX, ($0, $1) => $1);
  }
  // Make sure we don't have duplicate ids on this page
  if (anchors[id]) {
    let suffix = 1;
    while (anchors[`${id}-${suffix}`]) suffix++;
    id = `${id}-${suffix}`;
  }
  anchors[id] = true;

  const children = props.children.slice();
  const autolink = children[0];
  if (autolink.props && autolink.props.href) {
    children[0] = cloneElement(autolink, {key: 'anchor', href: `#${id}`});
  }
  return (
    <ComponentType {...props} id={id}>
      {children}
    </ComponentType>
  );
};

export default (props) => {
  const {relativeLinks, path, config} = props;
  // note - we can add many other custom components.

  const anchors = {};
  const HeaderWrapper = (ComponentType) => {
    return ({id, ...props}) => CustomHeader(ComponentType, id, props, anchors);
  };

  const components = {
    h1: H1,
    h2: HeaderWrapper(H2),
    h3: HeaderWrapper(H3),
    h4: HeaderWrapper(H4),
    h5: HeaderWrapper(H5),
    h6: HeaderWrapper(H6),
    p: P,
    ul: List,
    li: ListItem,
    pre: CustomPre,
    img: Img,
    code: InlineCode,
    table: Table,
    th: TableHeaderCell,
    td: TableBodyCell,
    blockquote: BlockQuote,
    a: relativeLinks ? CustomLinkWrapper(path, relativeLinks, config) : A
  };

  return (
    <MDXProvider components={components}>
      <MDXRenderer>{props.body}</MDXRenderer>
    </MDXProvider>
  );
};
