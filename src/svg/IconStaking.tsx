import * as React from 'react';

function IconStaking(props) {
  return (
    <svg width={24} height={24} fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        clipRule="evenodd"
        d="M20 20.182c0 1-.8 1.818-1.778 1.818H5.778C4.8 22 4 21.182 4 20.182V11.09c0-1 .8-1.819 1.778-1.819h12.444c.978 0 1.778.819 1.778 1.819v9.09z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M7.556 9.273V6.545C7.556 4 9.51 2 12 2s4.445 2 4.445 4.545v2.728"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export default IconStaking;
