import * as React from 'react';

function IconBookmarkFilled(props: any) {
  return <Icon attributes={{ ...props, fill: '#1199FA' }} stroke="none" />;
}

function IconBookmarkNormal(props) {
  return <Icon attributes={{ ...props }} stroke={props.stroke ? props.stroke : '#C9CFDD'} />;
}

function Icon(props: { attributes: any; stroke: string }) {
  const { attributes, stroke } = props;
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      xmlns="http://www.w3.org/2000/svg"
      {...attributes}
    >
      <path
        d="M3.75 3C3.75 2.30964 4.30964 1.75 5 1.75H11C11.6904 1.75 12.25 2.30964 12.25 3V12.81C12.25 13.0243 11.9982 13.1393 11.8363 12.999L9.14613 10.6675C8.48837 10.0974 7.51163 10.0974 6.85387 10.6675L4.16373 12.999C4.00184 13.1393 3.75 13.0243 3.75 12.81V3Z"
        stroke={stroke}
      />
    </svg>
  );
}

export { IconBookmarkFilled, IconBookmarkNormal };
