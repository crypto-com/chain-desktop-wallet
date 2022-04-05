import React, { useEffect, useRef, useState } from 'react';
import './CronosBridgeForm.less';
import { Button, Checkbox, Form, InputNumber, Select } from 'antd';
import { SwapOutlined } from '@ant-design/icons';
import { useRecoilState, useRecoilValue } from 'recoil';
import Big from 'big.js';
import { useTranslation } from 'react-i18next';
import { AddressType } from '@crypto-org-chain/chain-jslib/lib/dist/utils/address';
import { sessionState, walletAllAssetsState } from '../../../recoil/atom';
import { scaledBalance, UserAsset, UserAssetType } from '../../../models/UserAsset';
import {
  middleEllipsis,
  getCronosTendermintAsset,
  getCronosEvmAsset,
  getChainName,
} from '../../../utils/utils';
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
import RowAmountOption from '../../../components/RowAmountOption/RowAmountOption';
import AddressBookInput from '../../../components/AddressBookInput/AddressBookInput';
import { useLedgerStatus } from '../../../hooks/useLedgerStatus';
import { ledgerNotification } from '../../../components/LedgerNotification/LedgerNotification';
import { LEDGER_WALLET_TYPE } from '../../../service/LedgerService';
import { AssetIcon, BridgeIcon } from '../../../components/AssetIcon';

const { Option } = Select;
const tailLayout = {
  // wrapperCol: { offset: 8, span: 16 },
};
const layout = {
  // labelCol: { span: 8 },
  // wrapperCol: { span: 16 },
};

const CronosBridgeForm = props => {
  const {
    form,
    formValues,
    setFormValues,
    bridgeConfigForm,
    isBridgeValid,
    setIsBridgeValid,
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
    onSwitchBridgeCallback,
  } = props;

  const [session, setSession] = useRecoilState(sessionState);
  const walletAllAssets = useRecoilValue(walletAllAssetsState);
  const [availableBalance, setAvailableBalance] = useState('--');
  const [sendingAmount, setSendingAmount] = useState('0');
  const [supportedBridges, setSupportedBridges] = useState<SupportedBridge[]>([]);
  const [bridgeSupportedAssets, setBridgeSupportedAssets] = useState<UserAsset[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const [isToAddressDisabled, setIsToAddressDisabled] = useState(true);
  const didMountRef = useRef(false);

  const analyticsService = new AnalyticsService(session);
  const bridgeService = new BridgeService(walletService.storageService);

  const croAsset = getCronosTendermintAsset(walletAllAssets);
  const cronosAsset = getCronosEvmAsset(walletAllAssets);

  const { isLedgerConnected } = useLedgerStatus({ asset: currentAsset });

  const { tendermintAddress, evmAddress } = formValues;

  const [t] = useTranslation();

  const customAddressValidator = TransactionUtils.addressValidator(
    session,
    toAsset,
    AddressType.USER,
  );

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
    setIsToAddressDisabled(true);

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
        form.setFieldsValue({
          toAddress: tendermintAddress,
        });
        setToAddress(tendermintAddress);
        setToAsset(croAsset);
        break;
      }
      case 'CRONOS': {
        form.setFieldsValue({
          toAddress: evmAddress,
        });
        setToAddress(evmAddress);
        setToAsset(cronosAsset);
        break;
      }
      default: {
        form.setFieldsValue({
          toAddress: tendermintAddress,
        });
        setToAddress(tendermintAddress);
      }
    }

    form.setFieldsValue({
      asset: undefined,
      amount: undefined,
      isCustomToAddress: false,
    });

    onSwitchBridgeCallback();
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
        form.setFieldsValue({
          toAddress: tendermintAddress,
        });
        setToAddress(tendermintAddress);
        setToAsset(croAsset);
        break;
      }
      case 'CRONOS': {
        form.setFieldsValue({
          toAddress: evmAddress,
        });
        setToAddress(evmAddress);
        setToAsset(cronosAsset);
        break;
      }
      default: {
        form.setFieldsValue({
          toAddress: tendermintAddress,
        });
        setToAddress(tendermintAddress);
      }
    }

    setIsToAddressDisabled(true);

    form.setFieldsValue({
      bridgeFrom: newBridgeFrom,
      bridgeTo: newBridgeTo,
      isCustomToAddress: false,
    });
    form.validateFields();

    onSwitchBridgeCallback();
  };

  const onSwitchAsset = async value => {
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

      const { bridgeFrom, bridgeTo, amount, isCustomToAddress } = form.getFieldsValue();
      if (bridgeFrom && bridgeTo && amount) {
        if (isCustomToAddress) {
          setIsToAddressDisabled(false);
        }
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
        const cro = getCronosTendermintAsset(assets);
        const cronos = getCronosEvmAsset(assets);
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
          toAddress: cronos?.address,
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
        if (session.wallet.walletType === LEDGER_WALLET_TYPE && !isLedgerConnected) {
          ledgerNotification(session.wallet, currentAsset!);
          return;
        }
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
                  <BridgeIcon bridgeValue={bridge.value} />
                  {`${getChainName(bridge.label, session.wallet.config)}`}
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
                  <BridgeIcon bridgeValue={bridge.value} />
                  {`${getChainName(bridge.label, session.wallet.config)}`}
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
                  <AssetIcon asset={asset} />
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
      <div className="row">
        <div className="ant-row ant-form-item" style={{ marginBottom: '8px' }}>
          {' '}
        </div>
        <RowAmountOption
          form={form}
          walletAsset={currentAsset}
          setSendingAmount={setSendingAmount}
          style={{ marginBottom: '8px' }}
        />
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
      <div className="row">
        <div className="ant-row ant-form-item">
          <Form.Item name="isCustomToAddress">
            <Checkbox
              checked={!isToAddressDisabled}
              onChange={e => {
                const values = form.getFieldsValue();
                form.setFieldsValue({
                  ...values,
                  isCustomToAddress: e.target.checked,
                });
                setIsToAddressDisabled(!isToAddressDisabled);
                if (!e.target.checked) {
                  const { bridgeTo } = values;

                  switch (bridgeTo) {
                    case 'CRYPTO_ORG': {
                      setToAddress(croAsset?.address);
                      form.setFieldsValue({
                        toAddress: croAsset?.address,
                      });
                      break;
                    }
                    case 'CRONOS': {
                      setToAddress(cronosAsset?.address);
                      form.setFieldsValue({
                        toAddress: cronosAsset?.address,
                      });
                      break;
                    }
                    default:
                  }
                } else {
                  setToAddress('');
                  form.setFieldsValue({
                    toAddress: '',
                  });
                  form.submit();
                }
              }}
              className="disclaimer"
            >
              {t('bridge.form.customAddress.message')}
            </Checkbox>
          </Form.Item>
        </div>
        <div className="ant-row ant-form-item">
          <Form.Item
            name="toAddress"
            // label="Destination Address"
            hasFeedback
            validateFirst
            rules={[
              {
                required: true,
                message: `${t('bridge.form.toAddressLabel')} ${t('general.required')}`,
              },
              customAddressValidator,
            ]}
            initialValue={toAddress}
          >
            {toAsset && (
              <AddressBookInput
                disabled={isToAddressDisabled}
                onChange={value => {
                  form.setFieldsValue({
                    toAddress: value,
                  });
                  setToAddress(value);
                }}
                initialValue={toAddress}
                isDefaultInput
                currentSession={session}
                userAsset={toAsset}
              />
            )}
          </Form.Item>
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
              <BridgeIcon bridgeValue={form.getFieldValue('bridgeTo')} />
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
