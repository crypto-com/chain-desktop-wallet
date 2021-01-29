import * as React from 'react';

function IconTick(props) {
  return (
    <svg width={40} height={40} fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx={20} cy={20} r={20} fill="currentColor" />
      <path
        d="M30 13.333L17.364 27.878 10 20.606"
        stroke="#fff"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default IconTick;
