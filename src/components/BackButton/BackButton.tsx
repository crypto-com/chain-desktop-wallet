import React from 'react';
import { useHistory } from 'react-router-dom';
import { ArrowLeftOutlined } from '@ant-design/icons';

import './BackButton.less';

const BackButton = () => {
  const history = useHistory();

  const backTo = () => {
    history.goBack();
  };

  return (
    <div className="back-button" onClick={backTo}>
      <ArrowLeftOutlined />
    </div>
  );
};

export default BackButton;
