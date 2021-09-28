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
} from 'antd';
import Icon, { SwapOutlined } from '@ant-design/icons';
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
import { SUPPORTED_BRIDGE, FIXED_DEFAULT_FEE } from '../../config/StaticConfig';
import { AnalyticsService } from '../../service/analytics/AnalyticsService';
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

const CronosBridgeForm = props => {
  const { currentAssetIdentifier, setCurrentAssetIdentifier, form } = props;

  const [session, setSession] = useRecoilState(sessionState);
  const walletAllAssets = useRecoilValue(walletAllAssetsState);
  const [currentAsset, setCurrentAsset] = useState<UserAsset | undefined>();
  const [availableBalance, setAvailableBalance] = useState('--');
  const [amount, setAmount] = useState('0');
  const [assetFieldDisabled, setAssetFieldDisabled] = useState(true);
  // const [updateLoading, setUpdateLoading] = useState(false);
  const didMountRef = useRef(false);
  const analyticsService = new AnalyticsService(session);

  const [t] = useTranslation();

  useEffect(() => {
    // setAvailableBalance(scaledBalance(currentAsset!));
    if (!didMountRef.current) {
      didMountRef.current = true;
      analyticsService.logPage('Bridge');
    }
  }, []);

  const assetIcon = asset => {
    const { icon_url, symbol } = asset;

    return icon_url ? (
      <img src={icon_url} alt="cronos" className="asset-icon" />
    ) : (
      <Avatar>{symbol[0].toUpperCase()}</Avatar>
    );
  };

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

  return (
    <>
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
            {SUPPORTED_BRIDGE.map(bridge => {
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
            {SUPPORTED_BRIDGE.map(bridge => {
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
            onChange={value => setAmount(value ? value.toString() : '0')}
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
      {currentAsset && new Big(amount).gt(0) ? (
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
              {new Big(amount)
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
    </>
  );
};

const FormBridge = () => {
  const [form] = Form.useForm();
  const [session, setSession] = useRecoilState(sessionState);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const [currentAssetIdentifier, setCurrentAssetIdentifier] = useState<string>();
  const [currentStep, setCurrentStep] = useState(0);
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

  useEffect(() => {
    const selectedIdentifier = walletAllAssets.find(
      asset => asset.identifier === session.activeAsset?.identifier,
    )?.identifier;
    setCurrentAssetIdentifier(selectedIdentifier || walletAllAssets[0].identifier);
  }, [form, walletAllAssets, setSession]);

  const onFinish = () => {
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
      <div className="site-layout-background bridge-content">
        <div className="container">
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
          <CronosBridgeForm
            form={form}
            currentAssetIdentifier={currentAssetIdentifier}
            setCurrentAssetIdentifier={setCurrentAssetIdentifier}
          />
          <Form.Item {...tailLayout} className="button">
            <Button type="primary" htmlType="submit" loading={isButtonLoading}>
              Transfer Asset
            </Button>
          </Form.Item>
        </div>
      </div>
    </Form>
  );
};

const BridgePage = () => {
  return (
    <Layout className="site-layout bridge-layout">
      <Content>
        <FormBridge />
      </Content>
    </Layout>
  );
};

export default BridgePage;
