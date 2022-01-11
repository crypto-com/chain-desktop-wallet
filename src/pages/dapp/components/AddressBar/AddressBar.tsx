import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  ReloadOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { Button, Input } from 'antd';
import * as React from 'react';
import { useState } from 'react';
import './style.less';

interface IAddressBarProps {
  isBackButtonDisabled: boolean;
  onSearch: (value: string) => void;
}

const AddressBar = (props: IAddressBarProps) => {
  const { isBackButtonDisabled, onSearch } = props;

  const [value, setValue] = useState('');

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
      <Input
        value={value}
        onChange={e => {
          setValue(e.target.value);
        }}
        className="input"
        onKeyDown={e => {
          if (e.key === 'Enter') {
            onSearch(value);
          }
        }}
      />
      <Button type="link" className="button" icon={<StarOutlined />} />
    </div>
  );
};

export default AddressBar;
