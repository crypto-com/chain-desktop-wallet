import React from 'react';
import { Tooltip, Progress } from 'antd';
import './ValidatorPowerPercentBar.less';

interface ValidatorPowerPercentBarProps {
  percentExcludeCurrent: number;
  percentIncludeCurrent: number;
}
const ValidatorPowerPercentBar: React.FC<ValidatorPowerPercentBarProps> = props => {
  const { percentExcludeCurrent, percentIncludeCurrent } = props;
  const rounded = new Number(percentIncludeCurrent).toPrecision(4);
  const sub = new Number(percentIncludeCurrent - percentExcludeCurrent).toPrecision(4);

  return (
    <Tooltip title={`${rounded}%`}>
      <div style={{ display: 'flex', minWidth: '150px' }}>
        <span style={{ display: 'inline-block', marginRight: '8px' }}>{sub}%</span>
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
