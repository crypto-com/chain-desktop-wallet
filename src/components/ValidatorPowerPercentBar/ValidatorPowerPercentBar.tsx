import React from 'react';
import { Tooltip, Progress, Typography } from 'antd';
import './ValidatorPowerPercentBar.less';

interface ValidatorPowerPercentBarProps {
  percentExcludeCurrent: number;
  percentIncludeCurrent: number;
}

const { Text } = Typography;
const ValidatorPowerPercentBar: React.FC<ValidatorPowerPercentBarProps> = props => {
  const { percentExcludeCurrent, percentIncludeCurrent } = props;
  const rounded = new Number(percentIncludeCurrent).toPrecision(4);
  const sub = new Number(percentIncludeCurrent - percentExcludeCurrent).toPrecision(4);
  const color = new Number(percentIncludeCurrent - percentExcludeCurrent) < 7 ? 'success' : 'danger';

  return (
    <Tooltip title={`${rounded}%`}>
      <div style={{ display: 'flex', minWidth: '150px' }}>
        <Text type={color} style={{ display: 'inline-block', marginRight: '8px' }}>{sub}%</Text>
        <Progress
          percent={percentIncludeCurrent}
          success={{ percent: percentExcludeCurrent }}
          showInfo={false}
          className="validator-power-percent-bar"
        />
      </div>
    </Tooltip>
  );
};

export default ValidatorPowerPercentBar;
