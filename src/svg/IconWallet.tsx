import * as React from 'react';

function IconWallet(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>
      <g
        transform="translate(1 2)"
        stroke="currentColor"
        strokeWidth={1.5}
        fill="none"
        fillRule="evenodd"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 4.524v13.119c0 .724-.64 1.357-1.37 1.357H2.191c-.73 0-1.37-.633-1.37-1.357V5.79c0-.723.64-1.357 1.37-1.357H18.9c.457 0 1.643 0 1.917-.814" />
        <path d="M2.74 4.433V1.99c0-.723.547-1.176 1.277-1.085L19.63 2.443C20.91 2.714 21 3.8 21 3.8v.633" />
        <circle cx={4.2} cy={11.671} r={1} fill="currentColor" />
      </g>
    </svg>
  );
}

export default IconWallet;
