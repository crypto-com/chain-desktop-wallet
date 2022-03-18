import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import './bridge.less';
import 'antd/dist/antd.css';
import {
  Button,
  Form,
  InputNumber,
  Layout,
  Steps,
  Divider,
  // Checkbox,
  List,
  Card,
  Skeleton,
  Input,
  message,
  Spin,
  notification,
} from 'antd';
import Icon, {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  ExclamationCircleOutlined,
  LoadingOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { setRecoil } from 'recoil-nexus';
import Big from 'big.js';
import { useTranslation } from 'react-i18next';

import { AddressType } from '@crypto-org-chain/chain-jslib/lib/dist/utils/address';
import { Footer, Header } from 'antd/lib/layout/layout';
import {
  LedgerConnectedApp,
  ledgerIsConnectedState,
  pageLockState,
  sessionState,
  walletAllAssetsState,
} from '../../recoil/atom';
import { walletService } from '../../service/WalletService';

import { UserAsset } from '../../models/UserAsset';
import { BroadCastResult } from '../../models/Transaction';
import { renderExplorerUrl } from '../../models/Explorer';
import {
  getAssetBySymbolAndChain,
  getChainName,
  getCronosTendermintAsset,
  middleEllipsis,
} from '../../utils/utils';
import { TransactionUtils } from '../../utils/TransactionUtils';
import {
  adjustedTransactionAmount,
  fromScientificNotation,
  getBaseScaledAmount,
} from '../../utils/NumberUtils';
import { SUPPORTED_BRIDGE } from '../../config/StaticConfig';
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
import BridgeTransactionHistory from './components/BridgeTransactionHistory';
import CronosBridgeForm from './components/CronosBridgeForm';
import { secretStoreService } from '../../storage/SecretStoreService';
import { BridgeTransferRequest } from '../../service/TransactionRequestModels';
import IconTransferHistory from '../../svg/IconTransferHistory';
import { BridgeIcon, ICON_CRO_EVM } from '../../components/AssetIcon';

const { Content, Sider } = Layout;
const { Step } = Steps;
// const { TabPane } = Tabs;
// const { Text } = Typography;
// const { Meta } = Card;
const layout = {
  // labelCol: { span: 8 },
  // wrapperCol: { span: 16 },
};
const customDot = () => <Icon component={IconHexagon} />;

interface listDataSource {
  title: string;
  description: React.ReactNode;
  loading: boolean;
}

const CronosBridge = props => {
  const { setView, currentStep, setCurrentStep } = props;

  const session = useRecoilValue(sessionState);
  const walletAllAssets = useRecoilValue(walletAllAssetsState);
  const croAsset = getCronosTendermintAsset(walletAllAssets);

  const setPageLock = useSetRecoilState(pageLockState);
  const [form] = Form.useForm();
  const [formValues, setFormValues] = useState({
    amount: '0',
    bridgeFrom: '',
    bridgeTo: '',
    tendermintAddress: '',
    evmAddress: '',
    toAddress: '',
    isCustomToAddress: false,
  });
  const [bridgeConfigForm] = Form.useForm();
  const [isBridgeValid, setIsBridgeValid] = useState(false);
  const [isBridgeTransfering, setIsBridgeTransfering] = useState(false);

  const [currentAssetIdentifier, setCurrentAssetIdentifier] = useState<string>();
  const [currentAsset, setCurrentAsset] = useState<UserAsset | undefined>(croAsset);
  const [toAsset, setToAsset] = useState<UserAsset | undefined>();
  const [decryptedPhrase, setDecryptedPhrase] = useState('');
  const [broadcastResult, setBroadcastResult] = useState<BroadCastResult>({});
  const [toDestinationAddress, setToDestinationAddress] = useState('');
  const [bridgeTransferDirection, setBridgeTransferDirection] = useState<BridgeTransferDirection>(
    BridgeTransferDirection.NOT_SUPPORT,
  );
  const [bridgeTransferRequest, setBridgeTransferRequest] = useState<BridgeTransferRequest>({
    bridgeTransferDirection: BridgeTransferDirection.NOT_SUPPORT,
    tendermintAddress: '',
    evmAddress: '',
    toAddress: '',
    isCustomToAddress: false,
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
  // const [isButtonDisabled, setIsButtonDisabled] = useState(true);

  const [bridgeConfigs, setBridgeConfigs] = useState<BridgeConfig>();
  const [bridgeConfigFields, setBridgeConfigFields] = useState<string[]>([]);
  const [networkFee, setNetworkFee] = useState('0');

  const analyticsService = new AnalyticsService(session);

  const history = useHistory();

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

  const onWalletDecryptFinish = async (password: string) => {
    const { tendermintAddress, evmAddress, toAddress, isCustomToAddress } = formValues;
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
      toAddress,
      isCustomToAddress,
      amount,
      originAsset: currentAsset!,
      decryptedPhrase: phraseDecrypted,
      walletType: session.wallet.walletType, // normal, ledger
    };
    const txFee = await bridgeService.getBridgeTransactionFee(session, transferRequest);

    transferRequest = {
      ...transferRequest,
      amount: adjustedTransactionAmount(
        amount,
        currentAsset!,
        getBaseScaledAmount(txFee, currentAsset!),
      ),
    };

    setDecryptedPhrase(phraseDecrypted);
    setInputPasswordVisible(false);
    setNetworkFee(txFee);
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
      const { toAddress, isCustomToAddress } = form.getFieldsValue();
      let amount = form.getFieldValue('amount');
      amount = fromScientificNotation(amount).toString();

      let transferRequest = {
        bridgeTransferDirection,
        tendermintAddress,
        evmAddress,
        toAddress,
        isCustomToAddress,
        amount,
        originAsset: currentAsset!,
        decryptedPhrase,
        walletType: session.wallet.walletType, // normal, ledger
      };
      const txFee = await bridgeService.getBridgeTransactionFee(session, transferRequest);

      transferRequest = {
        ...transferRequest,
        amount: adjustedTransactionAmount(
          amount,
          currentAsset!,
          getBaseScaledAmount(txFee, currentAsset!),
        ),
      };

      setNetworkFee(txFee);
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
    let isBridgeTransferSuccess = false;
    let sendResult;
    let destinationResult;
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
            getBaseScaledAmount(networkFee, currentAsset!),
          ),
          symbol: currentAsset?.symbol,
        }),
        description: (
          <>
            <div>
              <span>
                {t('bridge.form.from')} {getChainName(bridgeFromObj?.label, session.wallet.config)}{' '}
                {t('bridge.form.to')} {getChainName(bridgeToObj?.label, session.wallet.config)}
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
        description: (
          <>
            {t('bridge.pendingTransferTimeout.description')}
            <Spin indicator={<LoadingOutlined style={{ fontSize: 12 }} spin />} />
          </>
        ),
        loading: false,
      }),
    );

    try {
      setCurrentStep(2);
      sendResult = await walletService.sendBridgeTransaction(bridgeTransferRequest);
      setBroadcastResult(sendResult);
      listDataSource.push({
        title: t('bridge.deposit.complete.title', {
          amount: adjustedTransactionAmount(
            amount,
            currentAsset!,
            getBaseScaledAmount(networkFee, currentAsset!),
          ),
          symbol: currentAsset?.symbol,
        }),
        description: (
          <>
            {t('bridge.deposit.transactionID')}:{' '}
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

      setBridgeConfirmationList(
        listDataSource.concat({
          title: '',
          description: <></>,
          loading: true,
        }),
      );

      isBridgeTransferSuccess = true;

      analyticsService.logTransactionEvent(
        sendResult.transactionHash as string,
        fromScientificNotation(
          adjustedTransactionAmount(
            formValues.amount,
            currentAsset!,
            getBaseScaledAmount(networkFee, currentAsset!),
          ),
        ),
        AnalyticsTxType.BridgeTransaction,
        AnalyticsActions.BridgeTransfer,
        AnalyticsCategory.Bridge,
      );
    } catch (e) {
      if (session.wallet.walletType === LEDGER_WALLET_TYPE) {
        listDataSource.push({
          title: '',
          description: (
            <>
              {t('bridge.ledgerSign.failed.title', {
                amount: adjustedTransactionAmount(
                  amount,
                  currentAsset!,
                  getBaseScaledAmount(networkFee, currentAsset!),
                ),
                symbol: currentAsset?.symbol,
              })}
              <br />-{' '}
              <a
                href="https://crypto.org/docs/wallets/ledger_desktop_wallet.html#ledger-connection-troubleshoot"
                target="_blank"
                rel="noreferrer"
              >
                {t('general.errorModalPopup.ledgerTroubleshoot')}
              </a>
            </>
          ),
          loading: false,
        });
      }
      listDataSource.push({
        title: t('bridge.deposit.failed.title', {
          amount: adjustedTransactionAmount(
            amount,
            currentAsset!,
            getBaseScaledAmount(networkFee, currentAsset!),
          ),
          symbol: currentAsset?.symbol,
        }),
        description: <>{t('bridge.deposit.failed.description')}</>,
        loading: false,
      });
      setBridgeConfirmationList(listDataSource);
      setBridgeTransferError(true);
      setIsBridgeTransfering(false);
      // eslint-disable-next-line no-console
      console.log('Failed in Bridge Transfer', e);
    }

    if (isBridgeTransferSuccess) {
      try {
        const callMaxCount = 3;
        const callTimeout = 6_000;
        const callInterval = 8_000;
        let callFailedCounts = 0;

        setTimeout(async () => {
          const myInterval = setInterval(async () => {
            destinationResult = await bridgeService.getBridgeTransactionByHash(
              sendResult.transactionHash!,
            );
            if (!destinationResult || !destinationResult.destinationTransactionId) {
              callFailedCounts++;
              if (callFailedCounts >= callMaxCount) {
                clearInterval(myInterval);
                listDataSource.push({
                  title: t('bridge.transferInitiated.title'),
                  description: <>{t('bridge.transferInitiated.description')}</>,
                  loading: false,
                });
                setBridgeConfirmationList(listDataSource);
                setIsBridgeTransfering(false);
                // eslint-disable-next-line no-console
                console.log(
                  `Failed in getting response from Bridge Transaction API for ${callMaxCount} times`,
                );
              }
            } else {
              clearInterval(myInterval);
              listDataSource.push({
                title: t('bridge.transferCompleted.title'),
                description: (
                  <>
                    {t('bridge.deposit.transactionID')}:{' '}
                    {destinationResult?.destinationChain.indexOf('Cronos') !== -1 ? (
                      middleEllipsis(destinationResult?.destinationTransactionId!, 6)
                    ) : (
                      <a
                        data-original={destinationResult?.destinationTransactionId}
                        target="_blank"
                        rel="noreferrer"
                        href={`${renderExplorerUrl(
                          getAssetBySymbolAndChain(
                            walletAllAssets,
                            destinationResult?.displayDenom,
                            destinationResult?.destinationChain.split(/[^A-Za-z]/)[0],
                          )?.config ?? session.wallet.config,
                          'tx',
                        )}/${destinationResult?.destinationTransactionId}`}
                      >
                        {middleEllipsis(destinationResult?.destinationTransactionId!, 6)}
                      </a>
                    )}
                  </>
                ),
                loading: false,
              });
              setBridgeConfirmationList(listDataSource);
              setIsBridgeTransfering(false);
            }
          }, callInterval);
        }, callTimeout);
      } catch (e) {
        listDataSource.push({
          title: t('bridge.transferInitiated.title'),
          description: <>{t('bridge.transferInitiated.description')}</>,
          loading: false,
        });
        setBridgeConfirmationList(listDataSource);
        setIsBridgeTransfering(false);
      }
    }
  };

  const renderStepContent = (step: number) => {
    const { amount, bridgeFrom, bridgeTo } = formValues;

    const bridgeFromObj = SUPPORTED_BRIDGE.get(bridgeFrom);
    const bridgeToObj = SUPPORTED_BRIDGE.get(bridgeTo);

    const onSwitchBridgeCallback = () => {
      setRecoil(ledgerIsConnectedState, LedgerConnectedApp.NOT_CONNECTED);
    };

    if (walletAllAssets.length < 2) {
      return (
        <div>
          <div className="item">{t('bridge.step0.message')}</div>
          <Button
            type="primary"
            onClick={() => {
              history.go(0);
            }}
            style={{
              width: '200px',
            }}
          >
            {t('general.restart')}
          </Button>
        </div>
      );
    }

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
              currentAsset={currentAsset}
              setCurrentAsset={setCurrentAsset}
              toAsset={toAsset}
              setToAsset={setToAsset}
              currentAssetIdentifier={currentAssetIdentifier}
              setCurrentAssetIdentifier={setCurrentAssetIdentifier}
              setCurrentStep={setCurrentStep}
              showPasswordInput={showPasswordInput}
              toAddress={toDestinationAddress}
              setToAddress={setToDestinationAddress}
              bridgeTransferDirection={bridgeTransferDirection}
              setBridgeTransferDirection={setBridgeTransferDirection}
              bridgeConfigs={bridgeConfigs}
              setBridgeConfigs={setBridgeConfigs}
              bridgeConfigFields={bridgeConfigFields}
              setBridgeConfigFields={setBridgeConfigFields}
              onSwitchBridgeCallback={onSwitchBridgeCallback}
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
                      <BridgeIcon bridgeValue={bridgeFromObj?.value} />
                    </Sider>
                    <Content>
                      <div>{t('bridge.form.from')}</div>
                      <div style={{ fontWeight: 'bold' }}>
                        {getChainName(bridgeFromObj?.label, session.wallet.config)}
                      </div>
                    </Content>
                  </Layout>
                  <ArrowRightOutlined style={{ fontSize: '24px', width: '50px' }} />
                  <Layout>
                    <Sider width="50px" className="bridge-to">
                      <BridgeIcon bridgeValue={bridgeToObj?.value} />
                    </Sider>
                    <Content>
                      <div>{t('bridge.form.to')}</div>
                      <div style={{ fontWeight: 'bold' }}>
                        {getChainName(bridgeToObj?.label, session.wallet.config)}
                      </div>
                    </Content>
                  </Layout>
                </div>
                <Divider />
                <div className="block">
                  <div className="flex-row">
                    <div>{t('bridge.form.networkFee')}</div>
                    <div>
                      ~{networkFee} {currentAsset?.symbol}
                    </div>
                  </div>
                  <div className="flex-row">
                    <div>{t('bridge.form.bridgeFee')}</div>
                    <div
                      style={{
                        color: '#20bca4',
                      }}
                    >
                      {t('general.waived')}
                    </div>
                  </div>
                  <div className="flex-row">
                    <div>{t('bridge.form.destination')}</div>
                    <div className="asset-icon">
                      <BridgeIcon bridgeValue={form.getFieldValue('bridgeTo')} />
                      {middleEllipsis(toDestinationAddress, 6)}
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
                        getBaseScaledAmount(networkFee, currentAsset!),
                      ),
                    )}{' '}
                    {toAsset?.symbol}
                  </div>
                  {Big(
                    fromScientificNotation(
                      adjustedTransactionAmount(
                        amount,
                        currentAsset!,
                        getBaseScaledAmount(networkFee, currentAsset!),
                      ),
                    ),
                  ).gt(0) ? (
                    <></>
                  ) : (
                    <Layout>
                      <Sider width="20px">
                        <ExclamationCircleOutlined style={{ color: '#f27474' }} />
                      </Sider>
                      <Content>{t('bridge.step1.notice1')}</Content>
                    </Layout>
                  )}
                </div>
              </div>
            </div>
            {/* <div className="item">
              <Checkbox
                checked={!isButtonDisabled}
                onChange={() => {
                  setIsButtonDisabled(!isButtonDisabled);
                }}
                className="disclaimer"
              >
                {t('bridge.form.disclaimer')}
              </Checkbox>
            </div> */}
            <div className="item">
              <Button
                key="submit"
                type="primary"
                onClick={onConfirmation}
                disabled={
                  // isButtonDisabled ||
                  !Big(
                    fromScientificNotation(
                      adjustedTransactionAmount(
                        amount,
                        currentAsset!,
                        getBaseScaledAmount(networkFee, currentAsset!),
                      ),
                    ),
                  ).gt(0)
                }
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
            {broadcastResult.transactionHash !== undefined && !isBridgeTransfering ? (
              <Button key="submit" type="primary">
                <a
                  onClick={() => {
                    setView('bridge-transfer-history-layout');
                    setCurrentStep(0);
                  }}
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

  const renderConfigBridgeDirection = () => {
    const { bridgeFrom, bridgeTo } = form.getFieldsValue();

    const bridgeFromObj = SUPPORTED_BRIDGE.get(bridgeFrom);
    const bridgeToObj = SUPPORTED_BRIDGE.get(bridgeTo);

    return (
      <div className="block flex-row">
        <Layout>
          <Sider width="50px" className="bridge-from">
            <BridgeIcon bridgeValue={bridgeFromObj?.value} />
          </Sider>
          <Content>
            <div style={{ fontWeight: 'bold' }}>
              {getChainName(bridgeFromObj?.label, session.wallet.config)}
            </div>
          </Content>
        </Layout>
        <ArrowRightOutlined style={{ fontSize: '24px', width: '50px' }} />
        <Layout>
          <Sider width="50px" className="bridge-to">
            <BridgeIcon bridgeValue={bridgeToObj?.value} />
          </Sider>
          <Content>
            <div style={{ fontWeight: 'bold' }}>
              {getChainName(bridgeToObj?.label, session.wallet.config)}
            </div>
          </Content>
        </Layout>
      </div>
    );
  };

  useEffect(() => {
    if (isBridgeTransfering) {
      setPageLock('bridge');
    } else {
      setPageLock('');
    }
  }, [isBridgeTransfering]);

  return (
    <>
      {currentStep === 1 || bridgeTransferError ? (
        <div
          onClick={() => {
            if (currentStep - 1 === 0) {
              setIsBridgeTransfering(false);
              notification.close('conditionalLinkNotificationKey');
            }
            setCurrentStep(currentStep - 1);
            // setIsButtonDisabled(true);
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
              {renderConfigBridgeDirection()}
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
                {/* {form.getFieldValue('bridgeFrom') === 'CRONOS' ? ( */}
                <Form.Item
                  name="bridgeIndexingUrl"
                  label={t('bridge.config.bridgeIndexingUrl.title')}
                  rules={[
                    {
                      required: true,
                      message: `${t('bridge.config.bridgeIndexingUrl.title')} ${t(
                        'general.required',
                      )}`,
                    },
                    {
                      type: 'url',
                      message: t('bridge.config.bridgeIndexingUrl.error1'),
                    },
                  ]}
                  style={{ textAlign: 'left' }}
                >
                  <Input />
                </Form.Item>
                {/* ) : (
                  <></>
                )} */}
                {bridgeConfigFields.includes('gasLimit') &&
                form.getFieldValue('bridgeFrom') === 'CRONOS' ? (
                  <Form.Item
                    name="gasLimit"
                    label={t('bridge.config.gasLimit.title')}
                    rules={[
                      {
                        required: true,
                        message: `${t('bridge.config.gasLimit.title')} ${t('general.required')}`,
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
            <img src={ICON_CRO_EVM} alt="cronos" />
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

const BridgePage = () => {
  const [view, setView] = useState('cronos-bridge');
  const [currentStep, setCurrentStep] = useState(0);

  const [t] = useTranslation();

  return (
    <Layout
      className={`site-layout ${
        view === 'cronos-bridge' ? 'bridge-layout' : 'bridge-transfer-history-layout'
      }`}
    >
      {view === 'cronos-bridge' ? (
        <Content>
          {currentStep === 0 ? (
            <div className="go-to-transfer-history">
              <a>
                <div onClick={() => setView('history')}>
                  <IconTransferHistory />
                  <span>{t('bridge.action.viewTransactionHistory')}</span>
                </div>
              </a>
            </div>
          ) : (
            <></>
          )}
          <div className="site-layout-background bridge-content">
            <div className="container">
              <CronosBridge
                setView={setView}
                currentStep={currentStep}
                setCurrentStep={setCurrentStep}
              />
            </div>
          </div>
        </Content>
      ) : (
        <>
          <Header className="site-layout-background">
            {t('bridge.transactionHistory.title')}
            <div className="go-to-cronos-bridge">
              <a>
                <div onClick={() => setView('cronos-bridge')}>
                  <img src={ICON_CRO_EVM} alt="cronos" style={{ height: '24px' }} />
                  <span>{t('bridge.action.backToCronosBridge')}</span>
                </div>
              </a>
            </div>
          </Header>
          <div className="header-description">{t('bridge.transactionHistory.description')}</div>
          <Content>
            <div className="site-layout-background bridge-transfer-history-content">
              <div className="container">
                <BridgeTransactionHistory />
              </div>
            </div>
          </Content>
          <Footer />
        </>
      )}
    </Layout>
  );
};

export default BridgePage;
