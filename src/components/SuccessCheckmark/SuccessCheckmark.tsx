import React from 'react';
import './SuccessCheckmark.less';

const SuccessCheckmark = () => {
  return (
    <div className="f-modal-alert">
      <div className="f-modal-icon f-modal-success animate">
        <span className="f-modal-line f-modal-tip animateSuccessTip" />
        <span className="f-modal-line f-modal-long animateSuccessLong" />
        <div className="f-modal-placeholder" />
        <div className="f-modal-fix" />
      </div>
    </div>
  );
};

export default SuccessCheckmark;
