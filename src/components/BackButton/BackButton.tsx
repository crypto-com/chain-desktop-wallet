import React from 'react';
import { useHistory } from 'react-router-dom';
import { LeftOutlined } from '@ant-design/icons';

import './BackButton.less';

const BackButton = () => {
  const history = useHistory();

  const backTo = () => {
    history.goBack();
  };

  return (
    <div className="back-button" onClick={backTo}>
      <LeftOutlined />
    </div>
  );
};

export default BackButton;
