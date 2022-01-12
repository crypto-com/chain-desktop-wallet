import React from 'react';
import 'antd/dist/antd.css';
import './TransactionDetail.less';
import { Tag } from 'antd';
import { MsgTypeName } from '../../../models/Transaction';

interface TagMsgTypeProps {
  msgTypeName: MsgTypeName;
}

const TagMsgType: React.FC<TagMsgTypeProps> = props => {
  const { msgTypeName } = props;

  let text = msgTypeName.toString();
  let color = 'blue';

  switch (msgTypeName) {
    case 'MsgSend':
      text = 'Send';
      color = 'blue';
      break;
    case 'MsgWithdrawDelegatorReward':
      text = 'Withdraw Reward';
      color = 'green';
      break;
    case 'MsgDelegate':
      text = 'Delegate';
      color = 'gold';
      break;
    case 'MsgUndelegate':
      text = 'Undelegate';
      color = 'gold';
      break;
    default:
      break;
  }

  return (
    <Tag style={{ border: 'none', padding: '5px 14px' }} color={color}>
      {text}
    </Tag>
  );
};

export default TagMsgType;
