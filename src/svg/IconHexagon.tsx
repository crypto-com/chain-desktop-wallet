import * as React from 'react';

function IconHexagon(props) {
  return (
    <>
      {props.children}
      <svg width={17} height={19} fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M8.5 0l-8 4.597v9.195l8 4.597 8-4.597V4.597L8.5 0z" fill="currentColor" />
      </svg>
    </>
  );
}

export default IconHexagon;
