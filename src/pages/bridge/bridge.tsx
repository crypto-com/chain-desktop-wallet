import React, { useEffect, useRef, useState } from 'react';
import './bridge.less';
import 'antd/dist/antd.css';
import {
  Avatar,
  Button,
  // Checkbox,
  Form,
  // Input,
  InputNumber,
  Layout,
  message,
  Select,
  Steps,
} from 'antd';
import Icon, { SwapOutlined } from '@ant-design/icons';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { useTranslation } from 'react-i18next';

import {
  // marketState,
  sessionState,
  walletAllAssetsState,
  walletListState,
} from '../../recoil/atom';
import { walletService } from '../../service/WalletService';
import {
  //  EnableGeneralSettingsPropagation,
  SettingsDataUpdate,
} from '../../models/Wallet';
import { Session } from '../../models/Session';
// import { UserAsset } from '../../models/UserAsset';

import {
  FIXED_DEFAULT_FEE,
  FIXED_DEFAULT_GAS_LIMIT,
  WalletConfig,
} from '../../config/StaticConfig';
import { AnalyticsService } from '../../service/analytics/AnalyticsService';
import { UserAsset, UserAssetConfig } from '../../models/UserAsset';
import iconImgSvg from '../../assets/icon-cronos-blue.svg';
import IconHexagon from '../../svg/IconHexagon';

const { Content } = Layout;
const { Option } = Select;
const { Step } = Steps;
const layout = {
  // labelCol: { span: 8 },
  // wrapperCol: { span: 16 },
};
const tailLayout = {
  // wrapperCol: { offset: 8, span: 16 },
};
const customDot = () => <Icon component={IconHexagon} />;

function getAssetConfigFromWalletConfig(walletConfig: WalletConfig): UserAssetConfig {
  return {
    chainId: walletConfig.network.chainId,
    explorer: walletConfig.explorer,
    explorerUrl: walletConfig.explorerUrl,
    fee: { gasLimit: walletConfig.fee.gasLimit, networkFee: walletConfig.fee.networkFee },
    indexingUrl: walletConfig.indexingUrl,
    isLedgerSupportDisabled: false,
    isStakingDisabled: false,
    nodeUrl: walletConfig.nodeUrl,
  };
}

const GeneralSettingsForm = props => {
  const [session, setSession] = useRecoilState(sessionState);
  const walletAllAssets = useRecoilValue(walletAllAssetsState);
  // const [updateLoading, setUpdateLoading] = useState(false);
  const [enabledGeneralSettings, setEnabledGeneralSettings] = useState<boolean>(false);
  const didMountRef = useRef(false);
  const analyticsService = new AnalyticsService(session);

  const [t] = useTranslation();

  const { currentAssetIdentifier, setCurrentAssetIdentifier } = props;

  useEffect(() => {
    let unmounted = false;

    const SyncConfig = async () => {
      const enabledGeneralWalletsSettings: boolean = session.wallet.config.enableGeneralSettings;
      if (!unmounted) {
        setEnabledGeneralSettings(enabledGeneralWalletsSettings);
      }
    };

    if (!didMountRef.current) {
      SyncConfig();
      didMountRef.current = true;
      analyticsService.logPage('Settings');
    }

    return () => {
      unmounted = true;
    };
  }, [enabledGeneralSettings, setEnabledGeneralSettings]);

  // async function onEnableGeneralWalletConfig() {
  //   setUpdateLoading(true);
  //   const newState = !enabledGeneralSettings;
  //   setEnabledGeneralSettings(newState);

  //   const enableGeneralSettingsPropagation: EnableGeneralSettingsPropagation = {
  //     networkName: session.wallet.config.name,
  //     enabledGeneralSettings: newState,
  //   };

  //   await walletService.updateGeneralSettingsPropagation(enableGeneralSettingsPropagation);

  //   const updatedWallet = await walletService.findWalletByIdentifier(session.wallet.identifier);
  //   const newSession = new Session(updatedWallet);
  //   await walletService.setCurrentSession(newSession);

  //   setSession(newSession);
  //   message.success(
  //     `${t('settings.message.generalSettings1')} ${newState ? t('general.enabled') : t('general.disabled')
  //     }`,
  //   );
  //   setUpdateLoading(false);
  // }

  const assetIcon = asset => {
    const { icon_url, symbol } = asset;

    return icon_url ? (
      <img src={icon_url} alt="cronos" className="asset-icon" />
    ) : (
      <Avatar>{symbol[0].toUpperCase()}</Avatar>
    );
  };

  const onSwitchAsset = value => {
    setCurrentAssetIdentifier(value);
    const selectedAsset = walletAllAssets.find(asset => asset.identifier === value);
    setSession({
      ...session,
      activeAsset: selectedAsset,
    });
    walletService.setCurrentSession({
      ...session,
      activeAsset: selectedAsset,
    });
  };

  return (
    <>
      <img src={iconImgSvg} alt="cronos" />
      <div className="title">Cronos Bridge</div>
      <div className="description">
        The safe, fast and most secure way to transfer assets to and from Cronos.
      </div>
      <div className="progress-bar">
        <Steps progressDot={customDot} current={0}>
          <Step title="Details" />
          <Step title="Confirm" />
          <Step title="Bridge" />
        </Steps>
      </div>
      <div className="row-bridge ant-double-height">
        <Form.Item
          name="bridgeFrom"
          label="From"
          // hasFeedback
          rules={[
            {
              required: true,
              message: `${t('settings.form1.networkFee.label')} ${t('general.required')}`,
            },
          ]}
          style={{ textAlign: 'left' }}
        >
          <Select
            style={{ width: '300px', textAlign: 'left' }}
            onChange={onSwitchAsset}
            value={currentAssetIdentifier}
          >
            {walletAllAssets.map(asset => {
              return (
                <Option value={asset.identifier} key={asset.identifier}>
                  {assetIcon(asset)}
                  {`${asset.name} (${asset.symbol})`}
                </Option>
              );
            })}
          </Select>
        </Form.Item>
        <SwapOutlined style={{ color: '#1199fa', fontSize: '40px' }} />
        <Form.Item
          name="bridgeTo"
          label="To"
          // hasFeedback
          rules={[
            {
              required: true,
              message: `${t('settings.form1.gasLimit.label')} ${t('general.required')}`,
            },
          ]}
          style={{ textAlign: 'right' }}
        >
          <Select
            style={{ width: '300px', textAlign: 'left' }}
            onChange={onSwitchAsset}
            value={currentAssetIdentifier}
          >
            {walletAllAssets.map(asset => {
              return (
                <Option value={asset.identifier} key={asset.identifier}>
                  {assetIcon(asset)}
                  {`${asset.name} (${asset.symbol})`}
                </Option>
              );
            })}
          </Select>
        </Form.Item>
      </div>
      <div className="row">
        <Form.Item
          name="asset"
          // label="From"
          // hasFeedback
          rules={[
            {
              required: true,
              message: `${t('settings.form1.networkFee.label')} ${t('general.required')}`,
            },
          ]}
          style={{ textAlign: 'left' }}
        >
          <Select
            style={{ width: '300px', textAlign: 'left' }}
            onChange={onSwitchAsset}
            value={currentAssetIdentifier}
            placeholder="Asset"
          >
            {walletAllAssets.map(asset => {
              return (
                <Option value={asset.identifier} key={asset.identifier}>
                  {assetIcon(asset)}
                  {`${asset.name} (${asset.symbol})`}
                </Option>
              );
            })}
          </Select>
        </Form.Item>
        <Form.Item
          name="amount"
          // label="To"
          // hasFeedback
          rules={[
            {
              required: true,
              message: `${t('settings.form1.gasLimit.label')} ${t('general.required')}`,
            },
          ]}
        >
          <InputNumber placeholder="Amount" />
          <div className="available">
            <span>{t('general.available')}: </span>
            <div className="available-amount">
              {/* {availableBalance} {walletAsset?.symbol}{' '} */}
              --
            </div>
          </div>
        </Form.Item>
      </div>
      {/* <div className="item">
        <Checkbox
          checked={enabledGeneralSettings}
          onChange={onEnableGeneralWalletConfig}
          disabled={updateLoading}
        >
          {t('settings.form1.checkbox1.description1')} {session.wallet.config.name}{' '}
          {t('settings.form1.checkbox1.description2')}
        </Checkbox>
      </div> */}
    </>
  );
};

const FormSettings = () => {
  const [form] = Form.useForm();
  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const [currentAssetIdentifier, setCurrentAssetIdentifier] = useState<string>();
  const [session, setSession] = useRecoilState(sessionState);
  const [walletAllAssets, setWalletAllAssets] = useRecoilState(walletAllAssetsState);

  const defaultSettings: UserAssetConfig =
    session.activeAsset?.config || getAssetConfigFromWalletConfig(session.wallet.config);

  const setWalletList = useSetRecoilState(walletListState);

  const [t] = useTranslation();

  let networkFee = FIXED_DEFAULT_FEE;
  let gasLimit = FIXED_DEFAULT_GAS_LIMIT;

  useEffect(() => {
    const selectedIdentifier = walletAllAssets.find(
      asset => asset.identifier === session.activeAsset?.identifier,
    )?.identifier;
    setCurrentAssetIdentifier(selectedIdentifier || walletAllAssets[0].identifier);

    if (defaultSettings.fee !== undefined) {
      networkFee = defaultSettings.fee.networkFee;
    }
    if (defaultSettings.fee !== undefined) {
      gasLimit = defaultSettings.fee.gasLimit;
    }

    form.setFieldsValue({
      nodeUrl: defaultSettings.nodeUrl,
      chainId: defaultSettings.chainId,
      indexingUrl: defaultSettings.indexingUrl,
      networkFee,
      gasLimit,
    });
  }, [form, defaultSettings, walletAllAssets, setSession]);

  const onFinish = async values => {
    const defaultGasLimit =
      defaultSettings.fee !== undefined ? defaultSettings.fee.gasLimit : FIXED_DEFAULT_GAS_LIMIT;
    const defaultNetworkFee =
      defaultSettings.fee !== undefined ? defaultSettings.fee.networkFee : FIXED_DEFAULT_FEE;

    if (
      defaultSettings.nodeUrl === values.nodeUrl &&
      defaultSettings.indexingUrl === values.indexingUrl &&
      defaultSettings.chainId === values.chainId &&
      defaultGasLimit === values.gasLimit &&
      defaultNetworkFee === values.networkFee
    ) {
      // No value was updated, we stop here
      return;
    }

    setIsButtonLoading(true);
    const settingsDataUpdate: SettingsDataUpdate = {
      walletId: session.wallet.identifier,
      chainId: values.chainId,
      nodeUrl: values.nodeUrl,
      indexingUrl: values.indexingUrl,
      networkFee: String(values.networkFee),
      gasLimit: String(values.gasLimit),
      explorer: session.wallet.config.explorer,
    };

    // This wallet level settings update should only imply the primary asset.
    if (!session.activeAsset?.isSecondaryAsset) {
      await walletService.updateWalletNodeConfig(settingsDataUpdate);
    }

    const updatedWallet = await walletService.findWalletByIdentifier(session.wallet.identifier);

    // Save updated active asset settings.
    const previousAssetConfig = session.activeAsset?.config;
    const newlyUpdatedAsset: UserAsset = {
      ...session.activeAsset!,
      config: {
        ...previousAssetConfig!,
        explorer: settingsDataUpdate.explorer!,
        chainId: settingsDataUpdate.chainId!,
        fee: { gasLimit: settingsDataUpdate.gasLimit!, networkFee: settingsDataUpdate.networkFee! },
        indexingUrl: settingsDataUpdate.indexingUrl!,
        nodeUrl: settingsDataUpdate.nodeUrl!,
      },
    };

    await walletService.saveAssets([newlyUpdatedAsset]);
    setCurrentAssetIdentifier(newlyUpdatedAsset.identifier);

    const newSession = new Session(updatedWallet, newlyUpdatedAsset);
    setSession(newSession);

    await walletService.setCurrentSession(newSession);

    const allNewUpdatedWallets = await walletService.retrieveAllWallets();
    setWalletList(allNewUpdatedWallets);

    const allAssets = await walletService.retrieveCurrentWalletAssets(newSession);
    setWalletAllAssets(allAssets);

    setIsButtonLoading(false);
    message.success(
      `${t('settings.message.success1')} ${
        session.wallet.config.enableGeneralSettings
          ? `(${t('settings.message.success2')} ${session.wallet.config.name} ${t(
              'settings.message.success3',
            )})`
          : ''
      }`,
    );
  };

  // const onRestoreDefaults = () => {
  //   form.setFieldsValue({
  //     nodeUrl: defaultSettings.nodeUrl,
  //     chainId: defaultSettings.chainId,
  //     indexingUrl: defaultSettings.indexingUrl,
  //     networkFee:
  //       defaultSettings.fee && defaultSettings.fee.networkFee ? defaultSettings.fee.networkFee : '',
  //     gasLimit:
  //       defaultSettings.fee && defaultSettings.fee.gasLimit ? defaultSettings.fee.gasLimit : '',
  //   });
  // };

  return (
    <Form
      {...layout}
      layout="vertical"
      form={form}
      name="control-hooks"
      requiredMark="optional"
      onFinish={onFinish}
    >
      <div className="site-layout-background bridge-content">
        <div className="container">
          <GeneralSettingsForm
            currentAssetIdentifier={currentAssetIdentifier}
            setCurrentAssetIdentifier={setCurrentAssetIdentifier}
          />
          {/* <GeneralSettingsForm
            currentAssetIdentifier={currentAssetIdentifier}
            setCurrentAssetIdentifier={setCurrentAssetIdentifier}
          /> */}
          <Form.Item {...tailLayout} className="button">
            <Button type="primary" htmlType="submit" loading={isButtonLoading}>
              Transfer Asset
            </Button>
            {/* <Button type="link" htmlType="button" onClick={onRestoreDefaults}>
              {t('general.discard')}
            </Button> */}
          </Form.Item>
        </div>
      </div>
    </Form>
  );
};

const SettingsPage = () => {
  return (
    <Layout className="site-layout center-layout">
      <Content>
        <FormSettings />
      </Content>
    </Layout>
  );
};

export default SettingsPage;
