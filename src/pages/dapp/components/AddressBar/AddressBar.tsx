import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  LoadingOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { Button, Input, Spin } from 'antd';
import * as React from 'react';
import { IconBookmarkFilled, IconBookmarkNormal } from '../../../../svg/IconBookmark';
import './style.less';

interface IButtonStates {
  isLoading: boolean;

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
        icon={<ArrowLeftOutlined />}
        disabled={buttonStates.isBackButtonDisabled}
        onClick={buttonCallbacks.onBackButtonClick}
      />
      <Button
        type="link"
        icon={<ArrowRightOutlined />}
        disabled={buttonStates.isForwardButtonDisabled}
        onClick={buttonCallbacks.onForwardButtonClick}
      />
      {buttonStates.isLoading ? (
        <Spin className="spin" indicator={<LoadingOutlined style={{ fontSize: 16 }} spin />} />
      ) : (
        <Button
          type="link"
          icon={<ReloadOutlined />}
          disabled={buttonStates.isRefreshButtonDisabled}
          onClick={buttonCallbacks.onRefreshButtonClick}
        />
      )}
      <Input
        value={value}
        placeholder="Search DApps or type URL"
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
        className="bookmark-button"
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
