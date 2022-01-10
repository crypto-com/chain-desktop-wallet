import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  ReloadOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { Button, Input } from 'antd';
import * as React from 'react';
import './style.less';

interface IAddressBarProps {
  isBackButtonDisabled: boolean;
}

const AddressBar = (props: IAddressBarProps) => {
  const { isBackButtonDisabled } = props;
  return (
    <div className="address-bar">
      <Button
        type="link"
        className="button"
        icon={<ArrowLeftOutlined />}
        disabled={isBackButtonDisabled}
      />
      <Button type="link" className="button" icon={<ArrowRightOutlined />} />
      <Button type="link" className="button" icon={<ReloadOutlined />} />
      <Input className="input" />
      <Button type="link" className="button" icon={<StarOutlined />} />
    </div>
  );
};

export default AddressBar;
