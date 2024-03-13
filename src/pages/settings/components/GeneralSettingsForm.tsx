import React, { useEffect, useMemo, useRef, useState } from 'react';
import '../settings.less';
import 'antd/dist/antd.css';
import { Button, Checkbox, Divider, Form, Input, InputNumber, message, Select } from 'antd';
import { useRecoilState, useRecoilValue } from 'recoil';
import { useTranslation } from 'react-i18next';
import _ from 'lodash';
import { sessionState, walletAllAssetsState } from '../../../recoil/atom';
import { walletService } from '../../../service/WalletService';
import { EnableGeneralSettingsPropagation } from '../../../models/Wallet';

import { AnalyticsService } from '../../../service/analytics/AnalyticsService';
import { checkIfTestnet, getChainName } from '../../../utils/utils';
import { AssetIcon } from '../../../components/AssetIcon';
import { UserAssetType } from '../../../models/UserAsset';
import { SupportedChainName } from '../../../config/StaticConfig';

const { Option } = Select;

export const GeneralSettingsForm = props => {
  const [session, setSession] = useRecoilState(sessionState);
  const walletAllAssets = useRecoilValue(walletAllAssetsState);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [enabledGeneralSettings, setEnabledGeneralSettings] = useState<boolean>(false);
  const didMountRef = useRef(false);
  const analyticsService = new AnalyticsService(session);

  const isTestnet = checkIfTestnet(session.wallet.config.network);

  const [t] = useTranslation();

  const { currentAssetIdentifier, setCurrentAssetIdentifier } = props;

  // only configure native assets
  const configurableAssets = useMemo(() => {
    return walletAllAssets.filter(asset => {
      return _.size(asset.contractAddress) < 1;
    })
      // Prioritize CRO assets over other assets
      .sort((a, b) => {
        if (a.mainnetSymbol === 'CRO') {
          if (b.mainnetSymbol === 'CRO' && b.assetType === UserAssetType.TENDERMINT) {
            return 1;
          }
          return -1;
        }
        return 1;
      });
  }, [walletAllAssets]);

  const onSwitchAsset = value => {
    setCurrentAssetIdentifier(value);
    const selectedAsset = configurableAssets.find(asset => asset.identifier === value);
    setSession({
      ...session,
      activeAsset: selectedAsset,
    });
    walletService.setCurrentSession({
      ...session,
      activeAsset: selectedAsset,
    });
  };

  useEffect(() => {
    if (
      session.activeAsset?.identifier &&
      session.activeAsset?.identifier !== currentAssetIdentifier
    ) {
      onSwitchAsset(session.activeAsset?.identifier);
    }
  }, [session]);

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

  async function onEnableGeneralWalletConfig() {
    setUpdateLoading(true);
    const newState = !enabledGeneralSettings;
    setEnabledGeneralSettings(newState);

    const enableGeneralSettingsPropagation: EnableGeneralSettingsPropagation = {
      networkName: session.wallet.config.name,
      enabledGeneralSettings: newState,
    };

    await walletService.updateGeneralSettingsPropagation(enableGeneralSettingsPropagation);

    const updatedWallet = await walletService.findWalletByIdentifier(session.wallet.identifier);
    const newSession = {
      ...session,
      wallet: updatedWallet,
    };
    await walletService.setCurrentSession(newSession);
    setSession(newSession);

    message.success(
      `${t('settings.message.generalSettings1')} ${newState ? t('general.enabled') : t('general.disabled')
      }`,
    );
    setUpdateLoading(false);
  }

  function onApplyTestnetCroeseid4() {
    props.form.setFieldsValue({
      nodeUrl: 'https://rpc-testnet-croeseid-4.cronos-pos.org',
      clientUrl: 'https://rpc-testnet-croeseid-4.cronos-pos.org',
      proxyUrl: 'https://rest-testnet-croeseid-4.cronos-pos.org',
      indexingUrl: 'https://cronos-pos.org/explorer/croeseid4/api/v1/',
      chainId: 'testnet-croeseid-4'
    });
  }

  function onApplyTestnetCroeseid5() {
    props.form.setFieldsValue({
      nodeUrl: 'https://rpc-c5.cronos-pos.org',
      clientUrl: 'https://rpc-c5.cronos-pos.org',
      proxyUrl: 'https://rest-c5.cronos-pos.org',
      indexingUrl: 'https://cronos-pos.org/explorer/croeseid5/api/v1/',
      chainId: 'testnet-croeseid-5'
    });
  }

  return (
    <>
      <div className="title">{t('settings.form1.assetIdentifier.label')}</div>
      <div className="description">{t('settings.form1.assetIdentifier.description')}</div>
      <Select style={{ width: 300 }} onChange={onSwitchAsset} value={currentAssetIdentifier}>
        {configurableAssets.map(asset => {
          return (
            <Option value={asset.identifier} key={asset.identifier}>
              <AssetIcon asset={asset} />
              {`${getChainName(asset.name, session.wallet.config)} (${asset.symbol})`}
            </Option>
          );
        })}
      </Select>
      {(session.activeAsset?.assetType === UserAssetType.TENDERMINT && session.activeAsset?.name === SupportedChainName.CRONOS_TENDERMINT && isTestnet) && <>
        <Button type="link" style={{ width: '140px', marginRight: '10px' }} onClick={onApplyTestnetCroeseid4}>Croeseid 4</Button>
        <Button type="link" style={{ width: '140px' }} onClick={onApplyTestnetCroeseid5}>Croeseid 5</Button>
      </>}
      <Divider />
      <Form.Item
        name="nodeUrl"
        label={t('settings.form1.nodeUrl.label')}
        hasFeedback
        rules={[
          {
            required: true,
            message: `${t('settings.form1.nodeUrl.label')} ${t('general.required')}`,
          },
          {
            type: 'url',
            message: t('settings.form1.nodeUrl.error1'),
          },
        ]}
      >
        <Input />
      </Form.Item>
      {(session.activeAsset?.assetType === UserAssetType.TENDERMINT) && 
        <>
          <Form.Item
            name="clientUrl"
            label={t('create.formCustomConfig.clientUrl.label')}
            hasFeedback
            rules={[
              {
                required: true,
                message: `${t('create.formCustomConfig.clientUrl.label')} ${t('general.required')}`,
              },
              {
                type: 'url',
                message: t('create.formCustomConfig.clientUrl.error1'),
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="proxyUrl"
            label={t('create.formCustomConfig.proxyUrl.label')}
            hasFeedback
            rules={[
              {
                required: true,
                message: `${t('create.formCustomConfig.proxyUrl.label')} ${t('general.required')}`,
              },
              {
                type: 'url',
                message: t('create.formCustomConfig.proxyUrl.error1'),
              },
            ]}
          >
            <Input />
          </Form.Item>
        </>}
      <Form.Item
        name="indexingUrl"
        label={t('settings.form1.indexingUrl.label')}
        hasFeedback
        rules={[
          {
            required: true,
            message: `${t('settings.form1.indexingUrl.label')} ${t('general.required')}`,
          },
          {
            type: 'url',
            message: t('settings.form1.indexingUrl.error1'),
          },
        ]}
      >
        <Input placeholder={t('settings.form1.indexingUrl.label')} />
      </Form.Item>
      <Form.Item
        name="chainId"
        label={t('settings.form1.chainId.label')}
        hasFeedback
        rules={[
          {
            required: true,
            message: `${t('settings.form1.chainId.label')} ${t('general.required')}`,
          },
        ]}
      >
        <Input />
      </Form.Item>
      <div className="row">
        <Form.Item
          name="networkFee"
          label={t('settings.form1.networkFee.label')}
          hasFeedback
          rules={[
            {
              required: true,
              message: `${t('settings.form1.networkFee.label')} ${t('general.required')}`,
            },
          ]}
        >
          <InputNumber precision={0} min={1} />
        </Form.Item>
        <Form.Item
          name="gasLimit"
          label={t('settings.form1.gasLimit.label')}
          hasFeedback
          rules={[
            {
              required: true,
              message: `${t('settings.form1.gasLimit.label')} ${t('general.required')}`,
            },
          ]}
        >
          <InputNumber precision={0} min={1} />
        </Form.Item>
      </div>
      <div className="item">
        <Checkbox
          checked={enabledGeneralSettings}
          onChange={onEnableGeneralWalletConfig}
          disabled={updateLoading}
        >
          {t('settings.form1.checkbox1.description1')} {session.wallet.config.name}{' '}
          {t('settings.form1.checkbox1.description2')}
        </Checkbox>
      </div>
    </>
  );
};
