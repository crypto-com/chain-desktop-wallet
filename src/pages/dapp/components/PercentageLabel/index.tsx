import * as React from 'react';

export const PercentageLabel = (props: { value: number | undefined }) => {
  const { value } = props;

  if (!value) {
    return <span>0%</span>;
  }

  const color = value < 0 ? '#D9475A' : '#20BCA4';

  const signedText = value < 0 ? '-' : '+';

  return (
    <span style={{ color }}>
      {signedText}
      {Math.abs(value).toFixed(2)}%
    </span>
  );
};
