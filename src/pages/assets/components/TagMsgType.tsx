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

  const msgTypePath = msgTypeName.split('.');
  const msgType = msgTypePath[msgTypePath.length - 1];

  let text = msgType ? msgType.toString() : '';
  let color = 'processing';

  switch (msgType) {
    case 'MsgSend':
      text = 'Send';
      color = 'processing';
      break;
    case 'MsgWithdrawDelegatorReward':
      text = 'Withdraw Reward';
      color = 'success';
      break;
    case 'MsgDelegate':
      text = 'Delegate';
      color = 'warning';
      break;
    case 'MsgUndelegate':
      text = 'Undelegate';
      color = 'warning';
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
