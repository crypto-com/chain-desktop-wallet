import React from 'react';
import { useHistory } from 'react-router-dom';
import { ArrowLeftOutlined } from '@ant-design/icons';

import './BackButton.less';

interface BackButtonProps {
  backTo?: string;
}

const BackButton: React.FC<BackButtonProps> = props => {
  const history = useHistory();

  const backTo = () => {
    if (props.backTo) {
      history.push(props.backTo);
    } else {
      history.goBack();
    }
  };

  return (
    <div className="back-button" onClick={backTo}>
      <ArrowLeftOutlined />
    </div>
  );
};

export default BackButton;
