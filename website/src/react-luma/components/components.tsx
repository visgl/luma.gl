import React, {type CSSProperties, type HTMLAttributes} from 'react';
import clsx from 'clsx';
import styles from './components.module.css';

type ButtonProps = HTMLAttributes<HTMLDivElement> & {
  width?: CSSProperties['width'];
};

export function Button({className, style, width, ...properties}: ButtonProps) {
  return (
    <div
      {...properties}
      className={clsx('button', styles.button, className)}
      style={{...style, width: width || style?.width || 'auto'}}
    />
  );
}
