import * as React from 'react';
import { Button, Form, InputNumber, Modal } from 'antd';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './style.less';
import { getRecoil, setRecoil } from 'recoil-nexus';
import numeral from 'numeral';
import { ethers } from 'ethers';
import { ValidateStatus } from 'antd/lib/form/FormItem';
import {
  allMarketState,
  sessionState,
  walletAllAssetsState,
  walletListState,
} from '../../recoil/atom';
import {
  EVM_MINIMUM_GAS_LIMIT,
  EVM_MINIMUM_GAS_PRICE,
  SUPPORTED_CURRENCY,
} from '../../config/StaticConfig';
import { getAssetAmountInFiat, UserAsset } from '../../models/UserAsset';
import { getNormalScaleAmount } from '../../utils/NumberUtils';
import { walletService } from '../../service/WalletService';
import { useCronosEvmAsset } from '../../hooks/useCronosEvmAsset';
import { Session } from '../../models/Session';
import { useAnalytics } from '../../hooks/useAnalytics';

const ModalBody = (props: {
  gasPrice: string;
  gasLimit: string;
  onSuccess: (gasLimit: string, gasPrice: string) => void;
}) => {
  const { gasPrice, gasLimit, onSuccess } = props;
  const [t] = useTranslation();

  const [form] = Form.useForm();

  const cronosEVMAsset = useCronosEvmAsset();

  const currentSession = getRecoil(sessionState);
  const allMarketData = getRecoil(allMarketState);
  const { analyticsService } = useAnalytics();
  const [validateStatus, setValidateStatus] = useState<ValidateStatus>('');

  const [readableNetworkFee, setReadableNetworkFee] = useState('');

  const assetMarketData = allMarketData.get(
    `${cronosEVMAsset?.mainnetSymbol}-${currentSession.currency}`,
  );
  const localFiatSymbol = SUPPORTED_CURRENCY.get(assetMarketData?.currency ?? 'USD')?.symbol ?? '';
  const [isUsingCustomGas, setIsUsingCustomGas] = useState(false);

  const setNetworkFee = (newGasPrice: string, newGasLimit: string) => {
    if (!cronosEVMAsset) {
      return;
    }

    if (newGasPrice !== EVM_MINIMUM_GAS_PRICE || newGasLimit !== EVM_MINIMUM_GAS_LIMIT) {
      setIsUsingCustomGas(true);
    } else {
      setIsUsingCustomGas(false);
    }

    const amountBigNumber = ethers.BigNumber.from(newGasLimit).mul(newGasPrice);

    if (ethers.BigNumber.from(cronosEVMAsset.balance.toString()).lte(amountBigNumber)) {
      setValidateStatus('error');
    } else {
      setValidateStatus('');
    }

    const amount = getNormalScaleAmount(amountBigNumber.toString(), cronosEVMAsset);

    if (!(cronosEVMAsset && localFiatSymbol && assetMarketData && assetMarketData.price)) {
      setReadableNetworkFee(`${amount} ${cronosEVMAsset.symbol}`);
      return;
    }
    const price = numeral(getAssetAmountInFiat(amount, assetMarketData)).format('0,0.00');

    if (price === '0.00') {
      setReadableNetworkFee(`${amount} ${cronosEVMAsset.symbol} (<${localFiatSymbol}0.01)`);
    } else {
      setReadableNetworkFee(`${amount} ${cronosEVMAsset.symbol} (~${localFiatSymbol}${price})`);
    }
  };

  useEffect(() => {
    if (!cronosEVMAsset) {
      return;
    }

    setNetworkFee(gasPrice, gasLimit);

    form.setFieldsValue({
      gasPrice,
      gasLimit,
    });
  }, [cronosEVMAsset, gasPrice, gasLimit]);

  if (!cronosEVMAsset) {
    return <React.Fragment />;
  }

  return (
    <div>
      <div
        style={{
          fontSize: '24px',
          marginBottom: '30px',
        }}
      >
        {t('custom-gas')}
      </div>
      <Form
        layout="vertical"
        form={form}
        onValuesChange={() => {
          const newGasPrice: string = form.getFieldValue('gasPrice');
          const newGasLimit: string = form.getFieldValue('gasLimit')
          const fieldsError = form.getFieldsError(['gasPrice', 'gasLimit'])
          if (fieldsError[0].errors.length > 0 || fieldsError[1].errors.length > 0 || !gasPrice || !gasLimit) {
            setReadableNetworkFee('-');
          } else {
            setNetworkFee(newGasPrice, newGasLimit);
          }
        }}
        onFinish={async values => {
          if (!cronosEVMAsset.config) {
            return;
          }

          const {
            gasLimit: newGasLimit,
            gasPrice: newGasPrice,
          }: { gasLimit: string; gasPrice: string } = values;

          if (gasLimit === newGasLimit.toString() && gasPrice === newGasPrice.toString()) {
            onSuccess(newGasLimit, newGasPrice);
            return;
          }

          const updatedWallet = await walletService.findWalletByIdentifier(
            currentSession.wallet.identifier,
          );

          const newlyUpdatedAsset = {
            ...cronosEVMAsset,
            config: {
              ...cronosEVMAsset.config,
              fee: { gasLimit: newGasLimit.toString(), networkFee: newGasPrice.toString() },
            },
          };

          await walletService.saveAssets([newlyUpdatedAsset as UserAsset]);

          const newSession = {
            ...currentSession,
            wallet: updatedWallet,
            activeAsset: newlyUpdatedAsset,
          };
          setRecoil(sessionState, newSession as Session);

          await walletService.setCurrentSession(newSession as Session);

          const allNewUpdatedWallets = await walletService.retrieveAllWallets();
          setRecoil(walletListState, [...allNewUpdatedWallets]);

          const allAssets = await walletService.retrieveCurrentWalletAssets(newSession as Session);
          setRecoil(walletAllAssetsState, [...allAssets]);

          onSuccess(newGasLimit, newGasPrice);

          analyticsService.logCustomizeGas(cronosEVMAsset.assetType ?? '');
        }}
      >
        <Form.Item
          name="gasPrice"
          label={`${t('gas-price')}(WEI)`}
          hasFeedback
          rules={[
            {
              required: true,
              message: `${t('settings.form1.networkFee.label')} ${t('general.required')}`,
            },
            {
              pattern: /^[1-9]+[0-9]*$/,
              message: t('general.invalidAmount')
            }
          ]}
        >
          <InputNumber stringMode precision={0} />
        </Form.Item>
        <Form.Item
          name="gasLimit"
          label={t('settings.form1.gasLimit.label')}
          rules={[
            {
              required: true,
              message: `${t('settings.form1.gasLimit.label')} ${t('general.required')}`,
            },
            {
              pattern: /^[1-9]+[0-9]*$/,
              message: t('general.invalidAmount')
            }
          ]}
        >
          <InputNumber stringMode precision={0} />
        </Form.Item>
        {
          validateStatus && <div style={{ color: 'red', marginTop: '-10px', marginBottom: '6px' }}>{t('dapp.requestConfirmation.error.insufficientBalance')}</div>
        }
        <div>
          <div style={{ color: '#7B849B' }}>{t('estimate-network-fee')}</div>
          <div>{readableNetworkFee}</div>
        </div>
        <div
          style={{
            marginTop: '20px',
          }}
        >
          <div style={{ color: '#7B849B' }}>{t('estimate-time')}</div>
          <div>{isUsingCustomGas ? `~1~24 ${t('general.hours').toLowerCase()}` : '6s'}</div>
        </div>
        <Form.Item
          style={{
            marginTop: '20px',
          }}
        >
          <Button
            type="primary"
            htmlType="submit"
            style={{ margin: '0 10px 0 0', width: '200px' }}
            disabled={!!validateStatus}
          >
            {t('general.save')}
          </Button>
          <Button
            danger
            type="link"
            htmlType="button"
            onClick={() => {
              form.setFieldsValue({
                gasPrice: EVM_MINIMUM_GAS_PRICE,
                gasLimit: EVM_MINIMUM_GAS_LIMIT,
              });
              setNetworkFee(EVM_MINIMUM_GAS_PRICE, EVM_MINIMUM_GAS_LIMIT);
            }}
          >
            {t('general.default')}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

const useCustomGasModalEVM = (asset: UserAsset, gasFee: string, gasLimit: string) => {
  let modalRef;

  const [isShowing, setIsShowing] = useState(false);

  function dismiss() {
    setIsShowing(false);
    modalRef?.destroy();
  }

  function show(props: {
    onCancel?: () => void;
    onSuccess: (gasLimit: string, gasFee: string) => void;
  }) {
    if (isShowing) {
      return;
    }
    const modal = Modal.info({
      visible: isShowing,
      icon: null,
      closable: true,
      width: 520,
      className: 'cro-gas-modal',
      onCancel: () => {
        modal.destroy();
        setIsShowing(false);
        props.onCancel?.();
      },
      cancelButtonProps: {
        hidden: true,
      },
      okButtonProps: {
        hidden: true,
      },
      style: {
        padding: '20px 20px 0 20px',
      },
      content: <ModalBody gasPrice={gasFee} gasLimit={gasLimit} onSuccess={props.onSuccess} />,
    });
    setIsShowing(true);
    modalRef = modal;
  }

  return {
    show,
    dismiss,
  };
};

export { useCustomGasModalEVM };
