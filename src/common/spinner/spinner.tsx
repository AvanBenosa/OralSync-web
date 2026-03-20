import React from 'react';
import styles from './spinner.module.scss';

export const SpinnerFullPage: React.FC = () => {
  const blockClasses = Array.from({ length: 9 }, (_, index) => styles[`loader_block_${index + 1}`]);

  return (
    <div className={ styles.rootFullPage }>
      <div className={ styles.loader }>
        { blockClasses.map((className, index) => (
          <span key={ index } className={ className }></span>
        )) }
      </div>
    </div>
  );
}
