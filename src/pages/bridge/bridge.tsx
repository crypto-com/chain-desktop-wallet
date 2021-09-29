import React, { useEffect, useRef, useState } from 'react';
import './bridge.less';
import 'antd/dist/antd.css';
import {
  Avatar,
  Button,
  Form,
  // Input,
  InputNumber,
  Layout,
  Select,
  Steps,
  Divider,
  Checkbox,
} from 'antd';
import Icon, { ArrowLeftOutlined, ArrowRightOutlined, SwapOutlined } from '@ant-design/icons';
import { useRecoilState, useRecoilValue } from 'recoil';
import Big from 'big.js';
import { useTranslation } from 'react-i18next';

import {
  // marketState,
  sessionState,
  walletAllAssetsState,
  // walletListState,
} from '../../recoil/atom';
import { walletService } from '../../service/WalletService';
// import { Session } from '../../models/Session';
import { UserAsset, scaledBalance } from '../../models/UserAsset';
import { middleEllipsis } from '../../utils/utils';
import { TransactionUtils } from '../../utils/TransactionUtils';
import {
  fromScientificNotation,
  getCurrentMinAssetAmount,
  getNormalScaleAmount,
} from '../../utils/NumberUtils';
import { SUPPORTED_BRIDGE, SupportedBridge, FIXED_DEFAULT_FEE } from '../../config/StaticConfig';
import { AnalyticsService } from '../../service/analytics/AnalyticsService';
import iconImgSvg from '../../assets/icon-cronos-blue.svg';
import IconHexagon from '../../svg/IconHexagon';

const { Content, Sider } = Layout;
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

const CronosBridgeForm = props => {
  const {
    form,
    setFormValues,
    assetIcon,
    currentAssetIdentifier,
    currentAsset,
    setCurrentAsset,
    setCurrentAssetIdentifier,
    setCurrentStep,
  } = props;

  const [session, setSession] = useRecoilState(sessionState);
  const walletAllAssets = useRecoilValue(walletAllAssetsState);
  const [availableBalance, setAvailableBalance] = useState('--');
  const [sendingAmount, setSendingAmount] = useState('0');
  const [assetFieldDisabled, setAssetFieldDisabled] = useState(true);
  const [supportedBridges, setSupportedBridges] = useState<SupportedBridge[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isButtonLoading, setIsButtonLoading] = useState(false);
  // const [updateLoading, setUpdateLoading] = useState(false);
  const didMountRef = useRef(false);
  const analyticsService = new AnalyticsService(session);

  const [t] = useTranslation();

  useEffect(() => {
    const initFieldValues = () => {
      const bridges: SupportedBridge[] = [];
      SUPPORTED_BRIDGE.forEach((item: SupportedBridge) => {
        bridges.push(item);
      });
      setSupportedBridges(bridges);

      const { bridgeFrom, bridgeTo, amount } = form.getFieldsValue();
      if (bridgeFrom && bridgeTo && amount) {
        setAvailableBalance(scaledBalance(currentAsset!));
        setAssetFieldDisabled(false);
        setSendingAmount(amount);
      }
    };

    if (!didMountRef.current) {
      didMountRef.current = true;
      initFieldValues();
      analyticsService.logPage('Bridge');
    }
  }, []);

  const onSwitchBridge = () => {
    setCurrentAsset(undefined);
    setCurrentAssetIdentifier(undefined);
    setAvailableBalance('--');
    form.setFieldsValue({
      asset: undefined,
      amount: undefined,
    });
  };

  const onBridgeExchange = () => {
    const { bridgeFrom, bridgeTo } = form.getFieldsValue();
    form.setFieldsValue({
      bridgeFrom: bridgeTo,
      bridgeTo: bridgeFrom,
    });
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

  const onFinish = values => {
    form.setFieldsValue({
      bridgeFrom: values.bridgeFrom,
      bridgeTo: values.bridgeTo,
      amount: values.amount,
    });
    setFormValues({
      ...form.getFieldsValue(),
    });
    setCurrentStep(1);
  };

  return (
    <Form
      {...layout}
      layout="vertical"
      form={form}
      name="control-hooks"
      requiredMark="optional"
      onFinish={onFinish}
    >
      <div className="row-bridge ant-double-height">
        <Form.Item
          name="bridgeFrom"
          label="From"
          rules={[
            {
              required: true,
              message: `From ${t('general.required')}`,
            },
          ]}
          style={{ textAlign: 'left' }}
        >
          <Select
            style={{ width: '300px', textAlign: 'left' }}
            onChange={() => {
              onSwitchBridge();
              form.setFieldsValue({
                bridgeTo: undefined,
              });
              setAssetFieldDisabled(true);
            }}
          >
            {supportedBridges.map(bridge => {
              return (
                <Option value={bridge.value} key={bridge.value}>
                  <img src={bridge.icon} alt={bridge.value} className="asset-icon" />
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
          label="To"
          rules={[
            {
              required: true,
              message: `To ${t('general.required')}`,
            },
            {
              validator: (_, value) => {
                if (form.getFieldValue('bridgeFrom') === value) {
                  setAssetFieldDisabled(true);
                  return Promise.reject(new Error('The two bridges cannot be the same'));
                }
                setAssetFieldDisabled(false);
                return Promise.resolve();
              },
            },
          ]}
          style={{ textAlign: 'right' }}
        >
          <Select style={{ width: '300px', textAlign: 'left' }} onChange={onSwitchBridge}>
            {supportedBridges.map(bridge => {
              return (
                <Option value={bridge.value} key={bridge.value}>
                  <img src={bridge.icon} alt={bridge.value} className="asset-icon" />
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
            placeholder="Asset"
            disabled={assetFieldDisabled}
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
          validateFirst
          rules={[
            {
              required: true,
              message: `Amount ${t('general.required')}`,
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
            placeholder="Amount"
            disabled={assetFieldDisabled}
            onChange={value => setSendingAmount(value ? value.toString() : '0')}
          />
        </Form.Item>
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
            <div>Fee: </div>
            <div>
              {getNormalScaleAmount(FIXED_DEFAULT_FEE, currentAsset!)} {currentAsset?.symbol}
            </div>
          </div>
          <div className="flex-row">
            <div>You will receieve: </div>
            <div>
              {new Big(sendingAmount)
                .sub(getNormalScaleAmount(FIXED_DEFAULT_FEE, currentAsset!))
                .toFixed(4)}{' '}
              {currentAsset?.symbol}
            </div>
          </div>
          <div className="flex-row">
            <div>To Address: </div>
            <div className="asset-icon">
              {assetIcon(session.activeAsset)}
              {middleEllipsis(session.wallet.address, 6)}
            </div>
          </div>
        </div>
      ) : (
        <></>
      )}

      <Form.Item {...tailLayout} className="button">
        <Button type="primary" htmlType="submit" loading={isButtonLoading}>
          Transfer Asset
        </Button>
      </Form.Item>
    </Form>
  );
};

const CronosBridge = () => {
  const [form] = Form.useForm();
  const [formValues, setFormValues] = useState({ amount: '0', bridgeFrom: '', bridgeTo: '' });
  const [session, setSession] = useRecoilState(sessionState);
  const [currentAssetIdentifier, setCurrentAssetIdentifier] = useState<string>();
  const [currentAsset, setCurrentAsset] = useState<UserAsset | undefined>();
  const [currentStep, setCurrentStep] = useState(0);
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [walletAllAssets, setWalletAllAssets] = useRecoilState(walletAllAssetsState);
  const stepDetail = [
    {
      step: 0,
      title: 'Cronos Bridge',
      description: 'The safe, fast and most secure way to transfer assets to and from Cronos.',
    },
    { step: 1, title: 'Confirmation', description: '' },
    { step: 2, title: 'Bridge Transaction', description: '' },
  ];

  const { amount, bridgeFrom, bridgeTo } = formValues;

  const assetIcon = asset => {
    const { icon_url, symbol } = asset;

    return icon_url ? (
      <img src={icon_url} alt="cronos" className="asset-icon" />
    ) : (
      <Avatar>{symbol[0].toUpperCase()}</Avatar>
    );
  };

  const renderStepContent = (step: number) => {
    const bridgeFromObj = SUPPORTED_BRIDGE.get(bridgeFrom);
    const bridgeToObj = SUPPORTED_BRIDGE.get(bridgeTo);

    switch (step) {
      case 0:
        return (
          <CronosBridgeForm
            form={form}
            setFormValues={setFormValues}
            assetIcon={assetIcon}
            currentAsset={currentAsset}
            setCurrentAsset={setCurrentAsset}
            currentAssetIdentifier={currentAssetIdentifier}
            setCurrentAssetIdentifier={setCurrentAssetIdentifier}
            setCurrentStep={setCurrentStep}
          />
        );
      case 1:
        return (
          <>
            <div className="confirmation-container">
              <div className="block">
                <div>Sending</div>
                <div className="title">
                  {amount} {currentAsset?.symbol}
                </div>
              </div>

              <Divider />
              <div className="block flex-row">
                <Layout>
                  <Sider width="50px">
                    <img src={bridgeFromObj?.icon} alt={bridgeFromObj?.value} />
                  </Sider>
                  <Content>
                    <div>From</div>
                    <div style={{ fontWeight: 'bold' }}>{bridgeFromObj?.label}</div>
                  </Content>
                </Layout>
                <ArrowRightOutlined style={{ fontSize: '24px', width: '50px' }} />
                <Layout>
                  <Sider width="50px">
                    <img src={bridgeToObj?.icon} alt={bridgeToObj?.value} />
                  </Sider>
                  <Content>
                    <div>To</div>
                    <div style={{ fontWeight: 'bold' }}>{bridgeToObj?.label}</div>
                  </Content>
                </Layout>
              </div>
              <Divider />
              <div className="block">
                <div className="flex-row">
                  <div>Fee: </div>
                  <div>
                    {getNormalScaleAmount(FIXED_DEFAULT_FEE, currentAsset!)} {currentAsset?.symbol}
                  </div>
                </div>
                <div className="flex-row">
                  <div>Destination: </div>
                  <div className="asset-icon">
                    {assetIcon(session.activeAsset)}
                    {middleEllipsis(session.wallet.address, 6)}
                  </div>
                </div>
              </div>
              <Divider />
              <div className="block">
                <div>Receiving</div>
                <div className="title">
                  ~
                  {new Big(amount)
                    .sub(getNormalScaleAmount(FIXED_DEFAULT_FEE, currentAsset!))
                    .toFixed(4)}{' '}
                  {currentAsset?.symbol}
                </div>
              </div>
            </div>
            <Checkbox
              checked={!isButtonDisabled}
              onChange={() => {
                setIsButtonDisabled(!isButtonDisabled);
              }}
            >
              By proceeding, I hereby acknowledge that I agree to the terms and conditions.
            </Checkbox>
            <Button
              key="submit"
              type="primary"
              // loading={isButtonLoading}
              onClick={() => setCurrentStep(2)}
              // hidden={isConfirmClearVisible}
              disabled={isButtonDisabled}
            >
              Confirm
            </Button>
          </>
        );
      default:
        return <></>;
    }
  };

  useEffect(() => {
    const selectedIdentifier = walletAllAssets.find(
      asset => asset.identifier === session.activeAsset?.identifier,
    )?.identifier;
    setCurrentAssetIdentifier(selectedIdentifier || walletAllAssets[0].identifier);
  }, [walletAllAssets, setSession]);

  return (
    <>
      {currentStep !== 0 ? (
        <div
          onClick={() => {
            setCurrentStep(currentStep - 1);
          }}
          style={{ textAlign: 'left', width: '50px', fontSize: '24px', cursor: 'pointer' }}
        >
          <ArrowLeftOutlined />
        </div>
      ) : (
        <></>
      )}
      {currentStep === 0 ? <img src={iconImgSvg} alt="cronos" /> : <></>}
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
  return (
    <Layout className="site-layout bridge-layout">
      <Content>
        <div className="site-layout-background bridge-content">
          <div className="container">
            <CronosBridge />
          </div>
        </div>
      </Content>
    </Layout>
  );
};

export default BridgePage;
