import React, { useEffect, useRef, useState } from 'react';
import './bridge.less';
import 'antd/dist/antd.css';
import {
  Avatar,
  Button,
  Form,
  InputNumber,
  Layout,
  Select,
  Steps,
  Divider,
  Checkbox,
  List,
  Card,
  Skeleton,
  Table,
  Typography,
  Tag,
  Input,
  message,
} from 'antd';
import Icon, {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  SettingOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import Big from 'big.js';
import { useTranslation } from 'react-i18next';

import { AddressType } from '@crypto-org-chain/chain-jslib/lib/dist/utils/address';
import { isBridgeTransferingState, sessionState, walletAllAssetsState } from '../../recoil/atom';
import { walletService } from '../../service/WalletService';

import { UserAsset, scaledBalance, UserAssetType } from '../../models/UserAsset';
import { BroadCastResult, TransactionDirection, TransactionStatus } from '../../models/Transaction';
import { renderExplorerUrl } from '../../models/Explorer';
import { middleEllipsis } from '../../utils/utils';
import { TransactionUtils } from '../../utils/TransactionUtils';
import {
  adjustedTransactionAmount,
  fromScientificNotation,
  getBaseScaledAmount,
  getCurrentMinAssetAmount,
} from '../../utils/NumberUtils';
import {
  SUPPORTED_BRIDGE,
  SupportedBridge,
  SUPPORTED_BRIDGES_ASSETS,
} from '../../config/StaticConfig';
import iconCronosSvg from '../../assets/icon-cronos-blue.svg';
import iconCroSvg from '../../assets/icon-cro.svg';
import IconHexagon from '../../svg/IconHexagon';
// import IconTransferHistory from '../../svg/IconTransferHistory';
import { LEDGER_WALLET_TYPE } from '../../service/LedgerService';
import {
  BridgeTransferDirection,
  BridgeNetworkConfigType,
  DefaultTestnetBridgeConfigs,
  DefaultMainnetBridgeConfigs,
  BridgeConfig,
} from '../../service/bridge/BridgeConfig';
import { BridgeService } from '../../service/bridge/BridgeService';
import {
  AnalyticsActions,
  AnalyticsCategory,
  AnalyticsService,
  AnalyticsTxType,
} from '../../service/analytics/AnalyticsService';
import PasswordFormModal from '../../components/PasswordForm/PasswordFormModal';
import ModalPopup from '../../components/ModalPopup/ModalPopup';
import { secretStoreService } from '../../storage/SecretStoreService';
import { BridgeTransferRequest } from '../../service/TransactionRequestModels';
import IconTransferHistory from '../../svg/IconTransferHistory';

const { Content, Sider } = Layout;
const { Option } = Select;
const { Step } = Steps;
// const { TabPane } = Tabs;
const { Text } = Typography;
// const { Meta } = Card;
const layout = {
  // labelCol: { span: 8 },
  // wrapperCol: { span: 16 },
};
const tailLayout = {
  // wrapperCol: { offset: 8, span: 16 },
};
const customDot = () => <Icon component={IconHexagon} />;

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

interface listDataSource {
  title: string;
  description: React.ReactNode;
  loading: boolean;
}

function getCryptoOrgAsset(walletAllAssets: UserAsset[]) {
  return walletAllAssets.find(asset => {
    return (
      asset.mainnetSymbol.toUpperCase() === 'CRO' &&
      asset.name.includes('Crypto.org') && // lgtm [js/incomplete-url-substring-sanitization]
      asset.assetType === UserAssetType.TENDERMINT
    );
  });
}

function getCronosAsset(walletAllAssets: UserAsset[]) {
  return walletAllAssets.find(asset => {
    return (
      asset.mainnetSymbol.toUpperCase() === 'CRO' &&
      asset.name.includes('Cronos') &&
      asset.assetType === UserAssetType.EVM
    );
  });
}

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
                  {`${asset.name} (${asset.symbol})`}
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

const CronosBridge = () => {
  const session = useRecoilValue(sessionState);
  const setIsBridgeTransfering = useSetRecoilState(isBridgeTransferingState);
  const [form] = Form.useForm();
  const [formValues, setFormValues] = useState({
    amount: '0',
    bridgeFrom: '',
    bridgeTo: '',
    tendermintAddress: '',
    evmAddress: '',
  });
  const [bridgeConfigForm] = Form.useForm();
  const [isBridgeValid, setIsBridgeValid] = useState(false);

  const [currentAssetIdentifier, setCurrentAssetIdentifier] = useState<string>();
  const [currentAsset, setCurrentAsset] = useState<UserAsset | undefined>();
  const [toAsset, setToAsset] = useState<UserAsset | undefined>();
  const [currentStep, setCurrentStep] = useState(0);
  const [decryptedPhrase, setDecryptedPhrase] = useState('');
  const [broadcastResult, setBroadcastResult] = useState<BroadCastResult>({});
  const [toAddress, setToAddress] = useState('');
  const [bridgeTransferDirection, setBridgeTransferDirection] = useState<BridgeTransferDirection>(
    BridgeTransferDirection.NOT_SUPPORT,
  );
  const [bridgeTransferRequest, setBridgeTransferRequest] = useState<BridgeTransferRequest>({
    bridgeTransferDirection: BridgeTransferDirection.NOT_SUPPORT,
    tendermintAddress: '',
    evmAddress: '',
    originAsset: currentAsset!,
    amount: '0',
    decryptedPhrase: '',
    walletType: 'normal', // normal, ledger
  });
  const [bridgeConfirmationList, setBridgeConfirmationList] = useState<listDataSource[]>([]);
  const [bridgeTransferError, setBridgeTransferError] = useState(false);
  const [inputPasswordVisible, setInputPasswordVisible] = useState(false);
  const [isBridgeSettingsFormVisible, setIsBridgeSettingsFormVisible] = useState(false);
  // eslint-disable-next-line
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);

  const [bridgeConfigs, setBridgeConfigs] = useState<BridgeConfig>();
  const [bridgeConfigFields, setBridgeConfigFields] = useState<string[]>([]);
  const [bridgeFee, setBridgeFee] = useState('0');

  const analyticsService = new AnalyticsService(session);

  const [t] = useTranslation();

  const bridgeService = new BridgeService(walletService.storageService);
  const isTestnet = bridgeService.checkIfTestnet(session.wallet.config.network);
  const defaultConfig = isTestnet ? DefaultTestnetBridgeConfigs : DefaultMainnetBridgeConfigs;

  const customEvmAddressValidator = TransactionUtils.addressValidator(
    session,
    currentAsset!,
    AddressType.USER,
  );

  const stepDetail = [
    {
      step: 0,
      title: t('bridge.step0.title'),
      description: t('bridge.step0.description'),
    },
    { step: 1, title: t('bridge.step1.title'), description: '' },
    { step: 2, title: t('bridge.step2.title'), description: '' },
  ];

  const assetIcon = asset => {
    const { icon_url, symbol } = asset;

    if (asset.mainnetSymbol === 'CRO') {
      if (asset.assetType === UserAssetType.TENDERMINT) {
        return <img src={iconCroSvg} alt="cronos" className="asset-icon" />;
      }
      if (asset.assetType === UserAssetType.EVM) {
        return <img src={iconCronosSvg} alt="cronos" className="asset-icon" />;
      }
    }

    return icon_url ? (
      <img src={icon_url} alt="cronos" className="asset-icon" />
    ) : (
      <Avatar>{symbol[0].toUpperCase()}</Avatar>
    );
  };

  const onWalletDecryptFinish = async (password: string) => {
    const { tendermintAddress, evmAddress } = formValues;
    let { amount } = formValues;
    amount = fromScientificNotation(amount).toString();

    setFormValues({
      ...formValues,
      ...form.getFieldsValue(),
    });

    const phraseDecrypted = await secretStoreService.decryptPhrase(
      password,
      session.wallet.identifier,
    );

    let transferRequest = {
      bridgeTransferDirection,
      tendermintAddress,
      evmAddress,
      amount,
      originAsset: currentAsset!,
      decryptedPhrase: phraseDecrypted,
      walletType: session.wallet.walletType, // normal, ledger
    };
    const fee = await bridgeService.getBridgeTransactionFee(session, transferRequest);

    transferRequest = {
      ...transferRequest,
      amount: adjustedTransactionAmount(
        amount,
        currentAsset!,
        getBaseScaledAmount(fee, currentAsset!),
      ),
    };

    setDecryptedPhrase(phraseDecrypted);
    setInputPasswordVisible(false);
    setBridgeFee(fee);
    setBridgeTransferRequest(transferRequest);
    setCurrentStep(1);
    setIsBridgeTransfering(true);
  };

  const showPasswordInput = async () => {
    setFormValues({
      ...formValues,
      ...form.getFieldsValue(),
    });

    if (decryptedPhrase || session.wallet.walletType === LEDGER_WALLET_TYPE) {
      const { tendermintAddress, evmAddress } = formValues;
      let amount = form.getFieldValue('amount');
      amount = fromScientificNotation(amount).toString();

      let transferRequest = {
        bridgeTransferDirection,
        tendermintAddress,
        evmAddress,
        amount,
        originAsset: currentAsset!,
        decryptedPhrase,
        walletType: session.wallet.walletType, // normal, ledger
      };
      const fee = await bridgeService.getBridgeTransactionFee(session, transferRequest);

      transferRequest = {
        ...transferRequest,
        amount: adjustedTransactionAmount(
          amount,
          currentAsset!,
          getBaseScaledAmount(fee, currentAsset!),
        ),
      };

      setBridgeFee(fee);
      setBridgeTransferRequest(transferRequest);
      setCurrentStep(1);
      setIsBridgeTransfering(true);
    } else {
      setInputPasswordVisible(true);
    }
  };

  const onConfirmation = async () => {
    const { bridgeFrom, bridgeTo } = formValues;
    let { amount } = formValues;
    amount = fromScientificNotation(amount);

    const bridgeFromObj = SUPPORTED_BRIDGE.get(bridgeFrom);
    const bridgeToObj = SUPPORTED_BRIDGE.get(bridgeTo);

    let app = 'Crypto.org App';

    switch (bridgeFromObj?.value) {
      case 'CRYPTO_ORG':
        app = 'Crypto.org App';
        break;
      case 'CRONOS':
        app = 'Ethereum App';
        break;
      default:
    }

    const listDataSource = [
      {
        title: t('bridge.pendingTransfer.title', {
          amount: adjustedTransactionAmount(
            amount,
            currentAsset!,
            getBaseScaledAmount(bridgeFee, currentAsset!),
          ),
          symbol: currentAsset?.symbol,
        }),
        description: (
          <>
            <div>
              <span>
                {t('bridge.form.from')} {bridgeFromObj?.label} {t('bridge.form.to')}{' '}
                {bridgeToObj?.label}
              </span>
            </div>
            {session.wallet.walletType === LEDGER_WALLET_TYPE ? (
              <div>
                {t('bridge.pendingTransfer.ledger.description', {
                  app,
                })}
              </div>
            ) : (
              <></>
            )}
          </>
        ),
        loading: false,
      },
    ];
    setBridgeConfirmationList(
      listDataSource.concat({
        title: '',
        description: <></>,
        loading: true,
      }),
    );

    try {
      setCurrentStep(2);

      const sendResult = await walletService.sendBridgeTransaction(bridgeTransferRequest);
      setBroadcastResult(sendResult);
      listDataSource.push({
        title: t('bridge.deposit.complete.title', {
          amount: adjustedTransactionAmount(
            amount,
            currentAsset!,
            getBaseScaledAmount(bridgeFee, currentAsset!),
          ),
          symbol: currentAsset?.symbol,
        }),
        description: (
          <>
            {t('bridge.deposit.transactionID')}
            <a
              data-original={sendResult.transactionHash}
              target="_blank"
              rel="noreferrer"
              href={`${renderExplorerUrl(currentAsset?.config ?? session.wallet.config, 'tx')}/${
                sendResult.transactionHash
              }`}
            >
              {middleEllipsis(sendResult.transactionHash!, 6)}
            </a>
          </>
        ),
        loading: false,
      });
      listDataSource.push({
        title: t('bridge.transferInitiated.title'),
        description: <>{t('bridge.transferInitiated.description')}</>,
        loading: false,
      });
      setBridgeConfirmationList(listDataSource);

      analyticsService.logTransactionEvent(
        sendResult.transactionHash as string,
        fromScientificNotation(
          adjustedTransactionAmount(
            formValues.amount,
            currentAsset!,
            getBaseScaledAmount(bridgeFee, currentAsset!),
          ),
        ),
        AnalyticsTxType.BridgeTransaction,
        AnalyticsActions.BridgeTransfer,
        AnalyticsCategory.Bridge,
      );
    } catch (e) {
      if (session.wallet.walletType === LEDGER_WALLET_TYPE) {
        listDataSource.push({
          title: t('bridge.ledgerSign.failed.title', {
            amount: adjustedTransactionAmount(
              amount,
              currentAsset!,
              getBaseScaledAmount(bridgeFee, currentAsset!),
            ),
            symbol: currentAsset?.symbol,
          }),
          description: <></>,
          loading: false,
        });
      }
      listDataSource.push({
        title: t('bridge.deposit.failed.title', {
          amount: adjustedTransactionAmount(
            amount,
            currentAsset!,
            getBaseScaledAmount(bridgeFee, currentAsset!),
          ),
          symbol: currentAsset?.symbol,
        }),
        description: <>{t('bridge.deposit.failed.description')}</>,
        loading: false,
      });
      setBridgeConfirmationList(listDataSource);
      setBridgeTransferError(true);
      // eslint-disable-next-line no-console
      console.log('Failed in Bridge Transfer', e);
    }
    setIsBridgeTransfering(false);
  };

  const renderStepContent = (step: number) => {
    const { amount, bridgeFrom, bridgeTo } = formValues;

    const bridgeFromObj = SUPPORTED_BRIDGE.get(bridgeFrom);
    const bridgeToObj = SUPPORTED_BRIDGE.get(bridgeTo);

    switch (step) {
      case 0:
        return (
          <>
            <CronosBridgeForm
              form={form}
              formValues={formValues}
              setFormValues={setFormValues}
              bridgeConfigForm={bridgeConfigForm}
              isBridgeValid={isBridgeValid}
              setIsBridgeValid={setIsBridgeValid}
              assetIcon={assetIcon}
              currentAsset={currentAsset}
              setCurrentAsset={setCurrentAsset}
              toAsset={toAsset}
              setToAsset={setToAsset}
              currentAssetIdentifier={currentAssetIdentifier}
              setCurrentAssetIdentifier={setCurrentAssetIdentifier}
              setCurrentStep={setCurrentStep}
              showPasswordInput={showPasswordInput}
              toAddress={toAddress}
              setToAddress={setToAddress}
              bridgeTransferDirection={bridgeTransferDirection}
              setBridgeTransferDirection={setBridgeTransferDirection}
              bridgeConfigs={bridgeConfigs}
              setBridgeConfigs={setBridgeConfigs}
              bridgeConfigFields={bridgeConfigFields}
              setBridgeConfigFields={setBridgeConfigFields}
            />
            <PasswordFormModal
              description={t('general.passwordFormModal.description')}
              okButtonText={t('general.passwordFormModal.okButton')}
              onCancel={() => {
                setInputPasswordVisible(false);
              }}
              onSuccess={onWalletDecryptFinish}
              onValidatePassword={async (password: string) => {
                const isValid = await secretStoreService.checkIfPasswordIsValid(password);
                return {
                  valid: isValid,
                  errMsg: !isValid ? t('general.passwordFormModal.error') : '',
                };
              }}
              successText={t('general.passwordFormModal.success')}
              title={t('general.passwordFormModal.title')}
              visible={inputPasswordVisible}
              successButtonText={t('general.continue')}
              confirmPassword={false}
            />
          </>
        );
      case 1:
        return (
          <div className="confirmation-container">
            <div className="item">
              <div className="detail">
                <div className="block">
                  <div>{t('nft.modal3.label1')}</div>
                  <div className="title">
                    {fromScientificNotation(amount)} {currentAsset?.symbol}
                  </div>
                </div>
                <Divider />
                <div className="block flex-row">
                  <Layout>
                    <Sider width="50px" className="bridge-from">
                      {bridgeIcon(bridgeFromObj?.value)}
                    </Sider>
                    <Content>
                      <div>{t('bridge.form.from')}</div>
                      <div style={{ fontWeight: 'bold' }}>{bridgeFromObj?.label}</div>
                    </Content>
                  </Layout>
                  <ArrowRightOutlined style={{ fontSize: '24px', width: '50px' }} />
                  <Layout>
                    <Sider width="50px" className="bridge-to">
                      {bridgeIcon(bridgeToObj?.value)}
                    </Sider>
                    <Content>
                      <div>{t('bridge.form.to')}</div>
                      <div style={{ fontWeight: 'bold' }}>{bridgeToObj?.label}</div>
                    </Content>
                  </Layout>
                </div>
                <Divider />
                <div className="block">
                  <div className="flex-row">
                    <div>{t('bridge.form.fee')}</div>
                    <div>
                      ~{bridgeFee} {currentAsset?.symbol}
                    </div>
                  </div>
                  <div className="flex-row">
                    <div>{t('bridge.form.destination')}</div>
                    <div className="asset-icon">
                      {bridgeIcon(form.getFieldValue('bridgeTo'))}
                      {middleEllipsis(toAddress, 6)}
                    </div>
                  </div>
                </div>
                <Divider />
                <div className="block">
                  <div>{t('bridge.form.receiving')}</div>
                  <div className="title">
                    ~
                    {fromScientificNotation(
                      adjustedTransactionAmount(
                        amount,
                        currentAsset!,
                        getBaseScaledAmount(bridgeFee, currentAsset!),
                      ),
                    )}{' '}
                    {toAsset?.symbol}
                  </div>
                </div>
              </div>
            </div>
            <div className="item">
              <Checkbox
                checked={!isButtonDisabled}
                onChange={() => {
                  setIsButtonDisabled(!isButtonDisabled);
                }}
                className="disclaimer"
              >
                {t('bridge.form.disclaimer')}
              </Checkbox>
            </div>
            <div className="item">
              <Button
                key="submit"
                type="primary"
                onClick={onConfirmation}
                disabled={isButtonDisabled}
              >
                {t('general.confirm')}
              </Button>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="bridge-container">
            <List
              grid={{ gutter: 3, column: 1 }}
              dataSource={bridgeConfirmationList}
              renderItem={(item, idx) => (
                <List.Item>
                  <Card>
                    <Skeleton title={false} loading={item.loading} active>
                      <List.Item.Meta
                        avatar={
                          <Icon
                            component={() => {
                              return (
                                <>
                                  <IconHexagon
                                    style={{
                                      color: '#1199fa',
                                      display: 'flex',
                                      justifyContent: 'center',
                                      alignItems: 'center',
                                    }}
                                  >
                                    <span
                                      style={{
                                        color: '#FFF',
                                        position: 'absolute',
                                        left: '4px',
                                        top: '2px',
                                      }}
                                    >
                                      {idx + 1}
                                    </span>
                                  </IconHexagon>
                                </>
                              );
                            }}
                            style={{ position: 'relative' }}
                          />
                        }
                        title={item.title}
                        description={item.description}
                        style={{ textAlign: 'left' }}
                      />
                    </Skeleton>
                  </Card>
                </List.Item>
              )}
            />
            {broadcastResult.transactionHash !== undefined ? (
              <Button key="submit" type="primary">
                <a
                  data-original={broadcastResult.transactionHash}
                  target="_blank"
                  rel="noreferrer"
                  href={`${renderExplorerUrl(
                    currentAsset?.config ?? session.wallet.config,
                    'tx',
                  )}/${broadcastResult.transactionHash}`}
                >
                  {t('bridge.action.viewTransaction')}
                </a>
              </Button>
            ) : (
              <></>
            )}
          </div>
        );
      default:
        return <></>;
    }
  };

  const onBridgeConfigUpdate = () => {
    let updateConfig = bridgeConfigForm.getFieldsValue();
    updateConfig = {
      ...updateConfig,
      bridgeDirectionType: bridgeTransferDirection,
      bridgeNetworkConfigType: isTestnet
        ? BridgeNetworkConfigType.TESTNET_BRIDGE
        : BridgeNetworkConfigType.MAINNET_BRIDGE,
    };

    bridgeService.updateBridgeConfiguration(updateConfig);
    message.success({
      key: 'bridgeUpdate',
      content: t('bridge.config.notification'),
    });
  };

  const onBridgeConfigDefault = () => {
    bridgeConfigForm.setFieldsValue(defaultConfig[bridgeTransferDirection]);
  };

  return (
    <>
      {currentStep === 1 || bridgeTransferError ? (
        <div
          onClick={() => {
            if (currentStep - 1 === 0) {
              setIsBridgeTransfering(false);
            }
            setCurrentStep(currentStep - 1);
            setIsButtonDisabled(true);
            setBridgeTransferError(false);
          }}
          style={{ textAlign: 'left', width: '50px', fontSize: '24px', cursor: 'pointer' }}
        >
          <ArrowLeftOutlined />
        </div>
      ) : (
        <></>
      )}
      {currentStep === 0 ? (
        <>
          <div style={{ textAlign: 'right' }}>
            <Button
              icon={<SettingOutlined style={{ fontSize: '20px' }} />}
              style={{
                textAlign: 'right',
                width: '20px',
                border: 'none',
                background: 'transparent',
              }}
              onClick={() => {
                setIsBridgeSettingsFormVisible(true);
              }}
              disabled={!isBridgeValid}
            />
            <ModalPopup
              className="bridge-config-modal"
              isModalVisible={isBridgeSettingsFormVisible}
              handleCancel={() => {
                setIsBridgeSettingsFormVisible(false);
              }}
              handleOk={onBridgeConfigUpdate}
              footer={[]}
              okText={t('general.save')}
              forceRender
            >
              <Form
                {...layout}
                layout="vertical"
                form={bridgeConfigForm}
                name="control-hooks"
                requiredMark="optional"
                onFinish={onBridgeConfigUpdate}
              >
                {bridgeConfigFields.includes('prefix') &&
                bridgeTransferDirection !== BridgeTransferDirection.CRONOS_TO_CRYPTO_ORG ? (
                  <Form.Item
                    name="prefix"
                    label={t('bridge.config.prefix.title')}
                    rules={[
                      {
                        required: true,
                        message: `${t('bridge.config.prefix.title')} ${t('general.required')}`,
                      },
                      {
                        pattern: isTestnet ? /^[a-z]{4}$/ : /^[a-z]{3}$/,
                        message: t('bridge.config.prefix.validation', {
                          number: isTestnet ? '4' : '3',
                        }),
                      },
                    ]}
                    style={{ textAlign: 'left' }}
                  >
                    <Input />
                  </Form.Item>
                ) : (
                  <></>
                )}
                {bridgeConfigFields.includes('cronosBridgeContractAddress') &&
                bridgeConfigs?.cronosBridgeContractAddress !== '' ? (
                  <Form.Item
                    name="cronosBridgeContractAddress"
                    label={t('bridge.config.address.title')}
                    rules={[
                      {
                        required: true,
                        message: `${t('bridge.config.address.validation')} ${t(
                          'general.required',
                        )}`,
                      },
                      customEvmAddressValidator,
                    ]}
                    style={{ textAlign: 'left' }}
                  >
                    <Input />
                  </Form.Item>
                ) : (
                  <></>
                )}
                {bridgeConfigFields.includes('bridgeChannel') ? (
                  <Form.Item
                    name="bridgeChannel"
                    label={t('bridge.config.channel.title')}
                    rules={[
                      {
                        required: true,
                        message: `${t('bridge.config.channel.title')} ${t('general.required')}`,
                      },
                    ]}
                    style={{ textAlign: 'left' }}
                  >
                    <Input />
                  </Form.Item>
                ) : (
                  <></>
                )}
                {bridgeConfigFields.includes('bridgePort') ? (
                  <Form.Item
                    name="bridgePort"
                    label={t('bridge.config.port.title')}
                    rules={[
                      {
                        required: true,
                        message: `${t('bridge.config.port.title')} ${t('general.required')}`,
                      },
                    ]}
                    style={{ textAlign: 'left' }}
                  >
                    <Input />
                  </Form.Item>
                ) : (
                  <></>
                )}
                {bridgeConfigFields.includes('gasLimit') &&
                form.getFieldValue('bridgeFrom') === 'CRONOS' ? (
                  <Form.Item
                    name="gasLimit"
                    label="Gas Limit"
                    rules={[
                      {
                        required: true,
                        message: `${t('bridge.config.port.title')} ${t('general.required')}`,
                      },
                    ]}
                    style={{ textAlign: 'left' }}
                  >
                    <InputNumber />
                  </Form.Item>
                ) : (
                  <></>
                )}
                <Form.Item>
                  <Button key="submit" type="primary" htmlType="submit" loading={confirmLoading}>
                    {t('general.save')}
                  </Button>
                  <Button
                    key="back"
                    type="link"
                    loading={confirmLoading}
                    onClick={onBridgeConfigDefault}
                  >
                    {t('general.default')}
                  </Button>
                </Form.Item>
              </Form>
            </ModalPopup>
          </div>
          <div>
            <img src={iconCronosSvg} alt="cronos" />
          </div>
        </>
      ) : (
        <></>
      )}
      <div className="title">{stepDetail[currentStep].title}</div>
      <div className="description">{stepDetail[currentStep].description}</div>
      <div className="progress-bar">
        <Steps progressDot={customDot} current={currentStep}>
          <Step title="Details" />
          <Step title="Confirm" />
          <Step title="Bridge" />
        </Steps>
      </div>

      {renderStepContent(currentStep)}
    </>
  );
};

// eslint-disable-next-line
const CronosHistory = () => {
  const session = useRecoilValue(sessionState);

  const [t] = useTranslation();

  interface TransferTabularData {
    key: string;
    transactionHash: string;
    recipientAddress: string;
    amount: string;
    time: string;
    direction: TransactionDirection;
    status: TransactionStatus;
  }

  const HistoryColumns = [
    {
      title: t('bridge.transactionHistory.table.transactionHash'),
      dataIndex: 'transactionHash',
      key: 'transactionHash',
      render: text => (
        <a
          data-original={text}
          target="_blank"
          rel="noreferrer"
          href={`${renderExplorerUrl(
            session.activeAsset?.config ?? session.wallet.config,
            'tx',
          )}/${text}`}
        >
          {middleEllipsis(text, 12)}
        </a>
      ),
    },
    {
      title: t('bridge.transactionHistory.table.amount'),
      dataIndex: 'amount',
      key: 'amount',
      render: (text, record: TransferTabularData) => {
        const color = record.direction === TransactionDirection.OUTGOING ? 'danger' : 'success';
        const sign = record.direction === TransactionDirection.OUTGOING ? '-' : '+';
        return (
          <Text type={color}>
            {sign}
            {text}
          </Text>
        );
      },
    },
    {
      title: t('bridge.transactionHistory.table.fromAddress'),
      dataIndex: 'fromAddress',
      key: 'fromAddress',
      render: text => (
        <a
          data-original={text}
          target="_blank"
          rel="noreferrer"
          href={`${renderExplorerUrl(
            session.activeAsset?.config ?? session.wallet.config,
            'address',
          )}/${text}`}
        >
          {middleEllipsis(text, 12)}
        </a>
      ),
    },
    {
      title: t('bridge.transactionHistory.table.toAddress'),
      dataIndex: 'toAddress',
      key: 'toAddress',
      render: text => (
        <a
          data-original={text}
          target="_blank"
          rel="noreferrer"
          href={`${renderExplorerUrl(
            session.activeAsset?.config ?? session.wallet.config,
            'address',
          )}/${text}`}
        >
          {middleEllipsis(text, 12)}
        </a>
      ),
    },
    {
      title: t('bridge.transactionHistory.table.time'),
      dataIndex: 'time',
      key: 'time',
    },
    {
      title: t('bridge.transactionHistory.table.status'),
      dataIndex: 'status',
      key: 'status',
      render: (text, record: TransferTabularData) => {
        // const color = record.direction === TransactionDirection.OUTGOING ? 'danger' : 'success';
        // const sign = record.direction === TransactionDirection.OUTGOING ? '-' : '+';
        let statusColor;
        if (record.status === TransactionStatus.SUCCESS) {
          statusColor = 'success';
        } else if (record.status === TransactionStatus.FAILED) {
          statusColor = 'error';
        } else {
          statusColor = 'processing';
        }

        return (
          <Tag style={{ border: 'none', padding: '5px 14px' }} color={statusColor}>
            {record.status.toString()}
          </Tag>
        );
      },
    },
  ];

  // TO-DO
  const allBridgeHistory = [];

  // const bridgeService = new BridgeService(walletService.storageService);

  useEffect(() => {
    const fetchBridgeHistory = async () => {
      // await bridgeService.fetchAndSaveBridgeTxs('0x85e0280712AaBDD0884732141B048b3B6fdE405B');
      // const transactionHistory = await bridgeService.retrieveCurrentWalletBridgeTransactions();
      // console.log(transactionHistory)
    };
    fetchBridgeHistory();
  }, []);

  return (
    <>
      <Table
        columns={HistoryColumns}
        dataSource={allBridgeHistory}
        className="transfer-table"
        rowKey={record => record.key}
      />
    </>
  );
};

const BridgePage = () => {
  const [view, setView] = useState('cronos-bridge');

  const [t] = useTranslation();

  return (
    <Layout className="site-layout bridge-layout">
      <Content>
        {view === 'cronos-bridge' ? (
          <>
            <div className="go-to-transfer-history">
              <a>
                <div onClick={() => setView('history')}>
                  <IconTransferHistory />
                  <span>{t('bridge.action.viewTransactionHistory')}</span>
                </div>
              </a>
            </div>
            <div className="site-layout-background bridge-content">
              <div className="container">
                <CronosBridge />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="go-to-transfer-history">
              <a>
                <div onClick={() => setView('cronos-bridge')}>
                  <img src={iconCronosSvg} alt="cronos" style={{ height: '24px' }} />
                  <span>{t('bridge.action.backToCronosBridge')}</span>
                </div>
              </a>
            </div>
            <div className="site-layout-background bridge-content">
              <div className="container">
                <CronosHistory />
              </div>
            </div>
          </>
        )}
      </Content>
    </Layout>
  );
};

export default BridgePage;
