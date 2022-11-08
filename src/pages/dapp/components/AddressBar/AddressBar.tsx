import * as React from 'react';
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CloseOutlined,
  LoadingOutlined,
  MoreOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { Button, Dropdown, Input, Menu, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import { IconBookmarkFilled, IconBookmarkNormal } from '../../../../svg/IconBookmark';
import ChainSelect from '../ChainSelect';
import './style.less';

type MoreButtonEventName = 'cleanCache'

interface IButtonStates {
  isLoading: boolean;

  isBackButtonDisabled: boolean;

  isForwardButtonDisabled: boolean;

  isRefreshButtonDisabled: boolean;

  isBookmarkButtonDisabled: boolean;
  isBookmarkButtonHighlighted: boolean;

  isExitButtonDisabled: boolean;

  isMoreButtonDisabled: boolean;
}

interface IAddressBarProps {
  buttonStates: IButtonStates;
  buttonCallbacks: {
    onBackButtonClick: () => void;
    onForwardButtonClick: () => void;
    onRefreshButtonClick: () => void;
    onBookmarkButtonClick: () => void;
    onExitButtonClick: () => void;
    onMoreButtonClick: (name: MoreButtonEventName, value: any) => void;
  };
  value: string;
  onInputChange: (value: string) => void;
  onSearch: (value: string) => void;
}

const AddressBar = (props: IAddressBarProps) => {
  const { buttonStates, value, onSearch, onInputChange, buttonCallbacks } = props;
  const [t] = useTranslation();

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
        placeholder={t('dapp.addressbar.placeholder')}
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
      <ChainSelect />
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
      <Button
        type="link"
        icon={<CloseOutlined />}
        disabled={buttonStates.isExitButtonDisabled}
        onClick={buttonCallbacks.onExitButtonClick}
      />
      <Dropdown
        disabled={buttonStates.isMoreButtonDisabled}
        overlay={(
          <Menu onClick={() => {
            buttonCallbacks.onMoreButtonClick('cleanCache', null);
          }}>
            <Menu.Item key="1">
              {t('dapp.clearCache')}
            </Menu.Item>
          </Menu>)}>
        <Button
          type="link"
          icon={<MoreOutlined />}
          disabled={buttonStates.isMoreButtonDisabled}
        />
      </Dropdown>
    </div>
  );
};

export default AddressBar;
