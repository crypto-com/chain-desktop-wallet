import { ArrowLeftOutlined, ArrowRightOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Input } from 'antd';
import * as React from 'react';
import { IconBookmarkFilled, IconBookmarkNormal } from '../../../../svg/IconBookmark';
import './style.less';

interface IButtonStates {
  isBackButtonDisabled: boolean;

  isForwardButtonDisabled: boolean;

  isRefreshButtonDisabled: boolean;

  isBookmarkButtonDisabled: boolean;
  isBookmarkButtonHighlighted: boolean;
}

interface IAddressBarProps {
  buttonStates: IButtonStates;
  buttonCallbacks: {
    onBackButtonClick: () => void;
    onForwardButtonClick: () => void;
    onRefreshButtonClick: () => void;
    onBookmarkButtonClick: () => void;
  };
  value: string;
  onInputChange: (value: string) => void;
  onSearch: (value: string) => void;
}

const AddressBar = (props: IAddressBarProps) => {
  const { buttonStates, value, onSearch, onInputChange, buttonCallbacks } = props;

  return (
    <div className="address-bar">
      <Button
        type="link"
        className="button"
        icon={<ArrowLeftOutlined />}
        disabled={buttonStates.isBackButtonDisabled}
        onClick={buttonCallbacks.onBackButtonClick}
      />
      <Button
        type="link"
        className="button"
        icon={<ArrowRightOutlined />}
        disabled={buttonStates.isForwardButtonDisabled}
        onClick={buttonCallbacks.onForwardButtonClick}
      />
      <Button
        type="link"
        className="button"
        icon={<ReloadOutlined />}
        disabled={buttonStates.isRefreshButtonDisabled}
        onClick={buttonCallbacks.onRefreshButtonClick}
      />
      <Input
        value={value}
        onChange={e => {
          onInputChange(e.target.value);
        }}
        className="input"
        onKeyDown={e => {
          if (e.key === 'Enter') {
            onSearch(value);
          }
        }}
      />
      <Button
        type="link"
        className="button"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        icon={
          buttonStates.isBookmarkButtonHighlighted ? (
            <IconBookmarkFilled width="20" height="20" />
          ) : (
            <IconBookmarkNormal width="20" height="20" fill="none" stroke="rgb(93, 102, 123)" />
          )
        }
        disabled={buttonStates.isBookmarkButtonDisabled}
        onClick={buttonCallbacks.onBookmarkButtonClick}
      />
    </div>
  );
};

export default AddressBar;
