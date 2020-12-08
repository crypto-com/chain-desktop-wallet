import React from 'react';
import './ErrorXmark.less';

const ErrorXmark = () => {
  return (
    <div className="f-modal-alert">
      <div className="f-modal-icon f-modal-error animate">
        <span className="f-modal-x-mark">
          <span className="f-modal-line f-modal-left animateXLeft" />
          <span className="f-modal-line f-modal-right animateXRight" />
        </span>
        <div className="f-modal-placeholder" />
        <div className="f-modal-fix" />
      </div>
    </div>
  );
};

export default ErrorXmark;
