import * as React from 'react';

function IconDApp(props) {
  return (
    <svg
      width={22}
      height={19}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 22 19"
      {...props}
    >
      <path
        clipRule="evenodd"
        d="M21 16.2c0 .4-.454.8-.91.8H1.91c-.455 0-.91-.4-.91-.8V1.8c0-.4.455-.8.91-.8h18.18c.456 0 .91.4.91.8v14.4z"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M1 4.2h20"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default IconDApp;
