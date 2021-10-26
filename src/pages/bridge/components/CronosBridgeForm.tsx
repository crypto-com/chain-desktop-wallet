import React, { useEffect, useRef, useState } from 'react';
import './CronosBridgeForm.less';
import { Button, Form, InputNumber, Select } from 'antd';
import { SwapOutlined } from '@ant-design/icons';
import { useRecoilState, useRecoilValue } from 'recoil';
import Big from 'big.js';
import { useTranslation } from 'react-i18next';
import { sessionState, walletAllAssetsState } from '../../../recoil/atom';
import { scaledBalance, UserAsset, UserAssetType } from '../../../models/UserAsset';
import { middleEllipsis, getCryptoOrgAsset, getCronosAsset } from '../../../utils/utils';
import { fromScientificNotation, getCurrentMinAssetAmount } from '../../../utils/NumberUtils';
import {
  SUPPORTED_BRIDGE,
  SupportedBridge,
  SUPPORTED_BRIDGES_ASSETS,
} from '../../../config/StaticConfig';
import { AnalyticsService } from '../../../service/analytics/AnalyticsService';
import { BridgeService } from '../../../service/bridge/BridgeService';
import { walletService } from '../../../service/WalletService';
import { BridgeTransferDirection } from '../../../service/bridge/BridgeConfig';
import { TransactionUtils } from '../../../utils/TransactionUtils';
import iconCronosSvg from '../../../assets/icon-cronos-blue.svg';
import iconCroSvg from '../../../assets/icon-cro.svg';

const { Option } = Select;
const tailLayout = {
  // wrapperCol: { offset: 8, span: 16 },
};
const layout = {
  // labelCol: { span: 8 },
  // wrapperCol: { span: 16 },
};

const bridgeIcon = (bridgeValue: string | undefined) => {
  let icon = iconCroSvg;

  switch (bridgeValue) {
    case 'CRYPTO_ORG':
      icon = iconCroSvg;
      break;
    case 'CRONOS':
      icon = iconCronosSvg;
      break;
    default:
      break;
  }

  return <img src={icon} alt={bridgeValue} className="asset-icon" />;
};

const CronosBridgeForm = props => {
  const {
    form,
    formValues,
    setFormValues,
    bridgeConfigForm,
    isBridgeValid,
    setIsBridgeValid,
    assetIcon,
    currentAssetIdentifier,
    currentAsset,
    setCurrentAsset,
    toAsset,
    setToAsset,
    setCurrentAssetIdentifier,
    showPasswordInput,
    toAddress,
    setToAddress,
    setBridgeTransferDirection,
    setBridgeConfigs,
    setBridgeConfigFields,
  } = props;

  const [session, setSession] = useRecoilState(sessionState);
  const walletAllAssets = useRecoilValue(walletAllAssetsState);
  const [availableBalance, setAvailableBalance] = useState('--');
  const [sendingAmount, setSendingAmount] = useState('0');
  const [supportedBridges, setSupportedBridges] = useState<SupportedBridge[]>([]);
  const [bridgeSupportedAssets, setBridgeSupportedAssets] = useState<UserAsset[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const didMountRef = useRef(false);

  const analyticsService = new AnalyticsService(session);
  const bridgeService = new BridgeService(walletService.storageService);

  const croAsset = getCryptoOrgAsset(walletAllAssets);
  const cronosAsset = getCronosAsset(walletAllAssets);

  const { tendermintAddress, evmAddress } = formValues;

  const [t] = useTranslation();

  const getBridgeSupportedAssetList = (assetType: UserAssetType) => {
    return walletAllAssets.filter(asset => {
      return (
        SUPPORTED_BRIDGES_ASSETS.includes(asset.mainnetSymbol.toUpperCase()) &&
        asset.assetType === assetType
      );
    });
  };

  const onSwitchBridge = async () => {
    const { bridgeFrom, bridgeTo } = form.getFieldsValue();

    setCurrentAsset(undefined);
    setCurrentAssetIdentifier(undefined);
    setAvailableBalance('--');
    form.setFieldsValue({
      asset: undefined,
      amount: undefined,
    });

    switch (bridgeFrom) {
      case 'CRYPTO_ORG': {
        setBridgeSupportedAssets(getBridgeSupportedAssetList(UserAssetType.TENDERMINT));
        setCurrentAsset(croAsset);
        setCurrentAssetIdentifier(croAsset?.identifier);
        setAvailableBalance(scaledBalance(croAsset!));
        form.setFieldsValue({
          asset: croAsset?.identifier,
        });
        break;
      }
      case 'CRONOS': {
        setBridgeSupportedAssets(getBridgeSupportedAssetList(UserAssetType.EVM));
        setCurrentAsset(cronosAsset);
        setCurrentAssetIdentifier(cronosAsset?.identifier);
        setAvailableBalance(scaledBalance(cronosAsset!));
        form.setFieldsValue({
          asset: cronosAsset?.identifier,
        });
        break;
      }
      default:
    }

    switch (bridgeTo) {
      case 'CRYPTO_ORG': {
        setToAddress(tendermintAddress);
        setToAsset(croAsset);
        break;
      }
      case 'CRONOS': {
        setToAddress(evmAddress);
        setToAsset(cronosAsset);
        break;
      }
      default: {
        setToAddress(tendermintAddress);
      }
    }
  };

  const onBridgeExchange = () => {
    const { bridgeFrom, bridgeTo } = form.getFieldsValue();

    const newBridgeFrom = bridgeTo;
    const newBridgeTo = bridgeFrom;

    switch (newBridgeFrom) {
      case 'CRYPTO_ORG': {
        setBridgeSupportedAssets(getBridgeSupportedAssetList(UserAssetType.TENDERMINT));
        setCurrentAsset(croAsset);
        setCurrentAssetIdentifier(croAsset?.identifier);
        setAvailableBalance(scaledBalance(croAsset!));
        form.setFieldsValue({
          asset: croAsset?.identifier,
        });
        break;
      }
      case 'CRONOS': {
        setBridgeSupportedAssets(getBridgeSupportedAssetList(UserAssetType.EVM));
        setCurrentAsset(cronosAsset);
        setCurrentAssetIdentifier(cronosAsset?.identifier);
        setAvailableBalance(scaledBalance(cronosAsset!));
        form.setFieldsValue({
          asset: cronosAsset?.identifier,
        });
        break;
      }
      default:
    }

    switch (newBridgeTo) {
      case 'CRYPTO_ORG': {
        setToAddress(tendermintAddress);
        setToAsset(croAsset);
        break;
      }
      case 'CRONOS': {
        setToAddress(evmAddress);
        setToAsset(cronosAsset);
        break;
      }
      default: {
        setToAddress(tendermintAddress);
      }
    }

    form.setFieldsValue({
      bridgeFrom: newBridgeFrom,
      bridgeTo: newBridgeTo,
    });
    form.validateFields();
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
    setCurrentAsset(selectedAsset);
    setAvailableBalance(scaledBalance(selectedAsset!));
  };

  const onAmountOption = value => {
    const optionAmount = Big(availableBalance).times(value);
    form.setFieldsValue({
      amount: Number(optionAmount.toNumber()),
    });
  };

  const currentMinAssetAmount = getCurrentMinAssetAmount(currentAsset!);
  const maximumSendAmount = availableBalance;
  const customAmountValidator = TransactionUtils.validTransactionAmountValidator();
  const customMaxValidator = TransactionUtils.maxValidator(
    maximumSendAmount,
    t('send.formSend.amount.error1'),
  );
  const customMinValidator = TransactionUtils.minValidator(
    fromScientificNotation(currentMinAssetAmount),
    `${t('send.formSend.amount.error2')} ${fromScientificNotation(currentMinAssetAmount)} ${
      currentAsset?.symbol
    }`,
  );

  useEffect(() => {
    const initFieldValues = async () => {
      const bridges: SupportedBridge[] = [];
      SUPPORTED_BRIDGE.forEach((item: SupportedBridge) => {
        bridges.push(item);
      });
      setSupportedBridges(bridges);

      const { bridgeFrom, bridgeTo, amount } = form.getFieldsValue();
      if (bridgeFrom && bridgeTo && amount) {
        setAvailableBalance(scaledBalance(currentAsset!));
        setIsBridgeValid(true);
        setSendingAmount(amount);
        switch (bridgeFrom) {
          case 'CRYPTO_ORG': {
            setBridgeSupportedAssets(getBridgeSupportedAssetList(UserAssetType.TENDERMINT));
            break;
          }
          case 'CRONOS': {
            setBridgeSupportedAssets(getBridgeSupportedAssetList(UserAssetType.EVM));
            break;
          }
          default:
        }
      } else {
        // Default bridgeFrom set to CRYPTO_ORG
        const defaultBridgeTransferDirection = BridgeTransferDirection.CRYPTO_ORG_TO_CRONOS;

        const currentSession = await walletService.retrieveCurrentSession();
        const assets = await walletService.retrieveCurrentWalletAssets(currentSession);
        const cro = getCryptoOrgAsset(assets);
        const cronos = getCronosAsset(assets);
        const config = await bridgeService.retrieveBridgeConfig(defaultBridgeTransferDirection);

        setBridgeSupportedAssets([cro!]);
        setCurrentAsset(cro);
        setCurrentAssetIdentifier(cro?.identifier);
        setToAddress(cronos?.address);
        setToAsset(cronos);
        setAvailableBalance(scaledBalance(cro!));

        setBridgeTransferDirection(defaultBridgeTransferDirection);
        setBridgeConfigs(config);
        bridgeConfigForm.setFieldsValue(config);
        setBridgeConfigFields(Object.keys(config));

        form.setFieldsValue({
          asset: cro?.identifier,
        });
        setFormValues({
          tendermintAddress: cro?.address,
          evmAddress: cronos?.address,
        });

        setIsBridgeValid(true);
      }
    };

    if (!didMountRef.current) {
      didMountRef.current = true;
      initFieldValues();
      analyticsService.logPage('Bridge');
    }
  }, []);

  return (
    <Form
      {...layout}
      layout="vertical"
      form={form}
      name="control-hooks"
      requiredMark="optional"
      onFinish={() => {
        showPasswordInput();
      }}
    >
      <div className="row-bridge ant-double-height">
        <Form.Item
          name="bridgeFrom"
          label={t('bridge.form.from')}
          rules={[
            {
              required: true,
              message: `${t('bridge.form.from')} ${t('general.required')}`,
            },
          ]}
          style={{ textAlign: 'left' }}
          initialValue="CRYPTO_ORG"
        >
          <Select
            style={{ width: '300px', textAlign: 'left' }}
            onChange={() => {
              onSwitchBridge();
              form.setFieldsValue({
                bridgeTo: undefined,
              });
              setIsBridgeValid(false);
            }}
          >
            {supportedBridges.map(bridge => {
              return (
                <Option value={bridge.value} key={bridge.value}>
                  {bridgeIcon(bridge.value)}
                  {`${bridge.label}`}
                </Option>
              );
            })}
          </Select>
        </Form.Item>
        <SwapOutlined
          style={{ color: '#1199fa', fontSize: '40px', cursor: 'pointer' }}
          onClick={onBridgeExchange}
        />
        <Form.Item
          name="bridgeTo"
          label={t('bridge.form.to')}
          validateFirst
          rules={[
            {
              required: true,
              message: `${t('bridge.form.to')} ${t('general.required')}`,
            },
            {
              validator: (_, value) => {
                if (form.getFieldValue('bridgeFrom') === value) {
                  setIsBridgeValid(false);
                  return Promise.reject(new Error(t('bridge.form.errorSameChain')));
                }
                setIsBridgeValid(true);
                return Promise.resolve();
              },
            },
            {
              validator: async () => {
                const { bridgeFrom, bridgeTo } = form.getFieldValue();

                switch (`${bridgeFrom}_TO_${bridgeTo}`) {
                  case BridgeTransferDirection.CRYPTO_ORG_TO_CRONOS: {
                    setBridgeTransferDirection(BridgeTransferDirection.CRYPTO_ORG_TO_CRONOS);
                    setIsBridgeValid(true);

                    const config = await bridgeService.retrieveBridgeConfig(
                      BridgeTransferDirection.CRYPTO_ORG_TO_CRONOS,
                    );
                    setBridgeConfigs(config);
                    bridgeConfigForm.setFieldsValue(config);
                    setBridgeConfigFields(Object.keys(config));
                    return Promise.resolve();
                  }
                  case BridgeTransferDirection.CRONOS_TO_CRYPTO_ORG: {
                    setBridgeTransferDirection(BridgeTransferDirection.CRONOS_TO_CRYPTO_ORG);
                    setIsBridgeValid(true);

                    const config = await bridgeService.retrieveBridgeConfig(
                      BridgeTransferDirection.CRONOS_TO_CRYPTO_ORG,
                    );
                    setBridgeConfigs(config);
                    bridgeConfigForm.setFieldsValue(config);
                    setBridgeConfigFields(Object.keys(config));
                    return Promise.resolve();
                  }
                  default: {
                    setBridgeTransferDirection(BridgeTransferDirection.NOT_SUPPORT);
                    setIsBridgeValid(false);

                    const config = await bridgeService.retrieveBridgeConfig(
                      BridgeTransferDirection.NOT_SUPPORT,
                    );
                    setBridgeConfigs(config);
                    return Promise.reject(new Error(t('bridge.form.errorBridgeNotSupported')));
                  }
                }
              },
            },
          ]}
          style={{ textAlign: 'right' }}
          initialValue="CRONOS"
        >
          <Select style={{ width: '300px', textAlign: 'left' }} onChange={onSwitchBridge}>
            {supportedBridges.map(bridge => {
              return (
                <Option value={bridge.value} key={bridge.value}>
                  {bridgeIcon(bridge.value)}
                  {`${bridge.label}`}
                </Option>
              );
            })}
          </Select>
        </Form.Item>
      </div>
      <div className="row">
        <Form.Item
          name="asset"
          rules={[
            {
              required: true,
              message: `Asset ${t('general.required')}`,
            },
          ]}
          style={{ textAlign: 'left' }}
        >
          <Select
            style={{ width: '300px', textAlign: 'left' }}
            onChange={onSwitchAsset}
            value={currentAssetIdentifier}
            placeholder={t('assets.title')}
            disabled={!isBridgeValid}
          >
            {bridgeSupportedAssets.map(asset => {
              return (
                <Option value={asset.identifier} key={asset.identifier}>
                  {assetIcon(asset)}
                  {`${asset.symbol}`}
                </Option>
              );
            })}
          </Select>
        </Form.Item>
        <Form.Item
          name="amount"
          validateFirst
          rules={[
            {
              required: true,
              message: `${t('bridge.form.amount')} ${t('general.required')}`,
            },
            {
              pattern: /[^0]+/,
              message: `${t('send.formSend.amount.label')} ${t('general.cannot0')}`,
            },
            customAmountValidator,
            customMaxValidator,
            customMinValidator,
          ]}
        >
          <InputNumber
            placeholder={t('bridge.form.amount')}
            disabled={!isBridgeValid}
            onChange={value => setSendingAmount(value ? value.toString() : '0')}
          />
        </Form.Item>
      </div>
      <div className="row row-amount-option">
        <div className="ant-row ant-form-item"> </div>
        <div className="ant-row ant-form-item">
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
      </div>
      <div className="row">
        <div className="ant-row ant-form-item"> </div>
        <div className="available ant-row ant-form-item">
          <span>{t('general.available')}: </span>
          <div className="available-amount">
            {availableBalance} {currentAsset?.symbol}{' '}
          </div>
        </div>
      </div>
      {currentAsset && new Big(sendingAmount).gt(0) ? (
        <div className="review-container">
          <div className="flex-row">
            <div>{t('bridge.form.willReceive')}</div>
            <div>
              {new Big(sendingAmount).toFixed(4)} {toAsset?.symbol}
            </div>
          </div>
          <div className="flex-row">
            <div>{t('bridge.form.toAddress')}</div>
            <div className="asset-icon">
              {bridgeIcon(form.getFieldValue('bridgeTo'))}
              {middleEllipsis(toAddress, 6)}
            </div>
          </div>
        </div>
      ) : (
        <></>
      )}

      <Form.Item {...tailLayout} className="button">
        <Button type="primary" htmlType="submit" loading={isButtonLoading}>
          {t('bridge.form.transfer')}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default CronosBridgeForm;
