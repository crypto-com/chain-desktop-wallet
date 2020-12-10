import * as React from 'react';

function IconHome(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>
      <g
        stroke="currentColor"
        strokeWidth={1.5}
        fill="none"
        fillRule="evenodd"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M15.636 22h3.637c.454 0 .909-.455.909-.91V10.91m-16.364 0v10.18c0 .455.455.91.91.91h3.636" />
        <path d="M2 12.909L12 2l10 10.909M8.364 22v-6.364c0-.454.454-.909.909-.909h5.454c.455 0 .91.455.91.91V22" />
      </g>
    </svg>
  );
}

export default IconHome;
