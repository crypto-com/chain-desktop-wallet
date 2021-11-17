import React from 'react';
import './RowAmountOption.less';
import Big from 'big.js';
import { Button, FormInstance } from 'antd';
import { scaledBalance, UserAsset } from '../../models/UserAsset';

interface RowAmountOptionProps {
  form: FormInstance;
  walletAsset: UserAsset;
  setSendingAmount?: (value: string) => void;
  style?;
}
const RowAmountOption: React.FC<RowAmountOptionProps> = props => {
  const { form, walletAsset, setSendingAmount, style } = props;

  const onAmountOption = value => {
    const optionAmount = Big(scaledBalance(walletAsset)).times(value);
    form.setFieldsValue({
      amount: Number(optionAmount.toNumber()),
    });
    if (setSendingAmount) {
      setSendingAmount(optionAmount.toString());
    }
  };

  return (
    <div className="ant-row ant-form-item row-amount-option" style={style}>
      <Button
        onClick={() => {
          onAmountOption(0.25);
        }}
      >
        25%
      </Button>
      <Button
        onClick={() => {
          onAmountOption(0.5);
        }}
      >
        50%
      </Button>
      <Button
        onClick={() => {
          onAmountOption(0.75);
        }}
      >
        75%
      </Button>
      <Button
        onClick={() => {
          onAmountOption(1);
        }}
      >
        ALL
      </Button>
    </div>
  );
};

export default RowAmountOption;
