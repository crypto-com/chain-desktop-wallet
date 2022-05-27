import * as React from 'react';
import { Button, Form, InputNumber, Modal } from 'antd';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './style.less';
import { getRecoil } from 'recoil-nexus';
import numeral from 'numeral';
import BigNumber from 'bignumber.js';
import { ValidateStatus } from 'antd/lib/form/FormItem';
import { allMarketState, sessionState } from '../../recoil/atom';
import {
  EVM_MINIMUM_GAS_LIMIT,
  EVM_MINIMUM_GAS_PRICE,
  SUPPORTED_CURRENCY,
} from '../../config/StaticConfig';
import { getAssetAmountInFiat, UserAsset } from '../../models/UserAsset';
import { getNormalScaleAmount } from '../../utils/NumberUtils';
import { useCronosEvmAsset } from '../../hooks/useCronosEvmAsset';
import { useAnalytics } from '../../hooks/useAnalytics';

const ModalBody = (props: {
  asset: UserAsset;
  gasPrice: BigNumber;
  gasLimit: BigNumber;
  onSuccess: (gasLimit: BigNumber, gasPrice: BigNumber) => void;
  onCancel: () => void;
}) => {
  const { asset, gasPrice, gasLimit, onSuccess, onCancel } = props;
  const [t] = useTranslation();

  const [form] = Form.useForm();

  const cronosEVMAsset = useCronosEvmAsset();
  const { analyticsService } = useAnalytics();
  const currentSession = getRecoil(sessionState);
  const allMarketData = getRecoil(allMarketState);
  const [validateStatus, setValidateStatus] = useState<ValidateStatus>('');
  const [readableNetworkFee, setReadableNetworkFee] = useState('');
  const [isUsingCustomGas, setIsUsingCustomGas] = useState(false);

  const assetMarketData = allMarketData.get(
    `${currentSession?.activeAsset?.mainnetSymbol}-${currentSession.currency}`,
  );
  const localFiatSymbol = SUPPORTED_CURRENCY.get(assetMarketData?.currency ?? 'USD')?.symbol ?? '';

  const setNetworkFee = (newGasPrice: BigNumber, newGasLimit: BigNumber) => {
    if (!cronosEVMAsset) {
      return;
    }

    if (
      newGasPrice.toString() !== EVM_MINIMUM_GAS_PRICE ||
      newGasLimit.toString() !== EVM_MINIMUM_GAS_LIMIT
    ) {
      setIsUsingCustomGas(true);
    } else {
      setIsUsingCustomGas(false);
    }

    const amountBigNumber = newGasLimit.times(newGasPrice);

    const amount = getNormalScaleAmount(amountBigNumber.toString(), asset);

    if (new BigNumber(cronosEVMAsset.balance).lte(amountBigNumber)) {
      setValidateStatus('error');
    } else {
      setValidateStatus('');
    }

    if (!(asset && localFiatSymbol && assetMarketData && assetMarketData.price)) {
      setReadableNetworkFee(`${amount} ${asset.symbol}`);
      return;
    }
    const price = numeral(getAssetAmountInFiat(amount, assetMarketData)).format('0,0.00');

    if (price === '0.00') {
      setReadableNetworkFee(`${amount} ${asset.symbol} (<${localFiatSymbol}0.01)`);
    } else {
      setReadableNetworkFee(`${amount} ${asset.symbol} (~${localFiatSymbol}${price})`);
    }
  };

  useEffect(() => {
    if (!asset) {
      return;
    }

    setNetworkFee(gasPrice, gasLimit);

    form.setFieldsValue({
      gasPrice,
      gasLimit,
    });
  }, [asset, gasPrice, gasLimit]);

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
            setNetworkFee(new BigNumber(newGasPrice), new BigNumber(newGasLimit));
          }
        }}
        onFinish={async values => {
          if (!asset.config) {
            return;
          }

          const {
            gasLimit: newGasLimit,
            gasPrice: newGasPrice,
          }: { gasLimit: string; gasPrice: string } = values;

          if (gasLimit.toString() === newGasLimit && gasPrice.toString() === newGasPrice) {
            onSuccess(new BigNumber(newGasLimit), new BigNumber(newGasPrice));
            return;
          }

          onSuccess(new BigNumber(newGasLimit), new BigNumber(newGasPrice));
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
          <InputNumber precision={0} stringMode />
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
            {
              pattern: /^[1-9]+[0-9]*$/,
              message: t('general.invalidAmount')
            }
          ]}
        >
          <InputNumber precision={0} stringMode />
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
            type="link"
            htmlType="button"
            onClick={() => {
              onCancel();
            }}
          >
            {t('general.cancel')}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

const useCustomGasModalEVMDApp = (asset: UserAsset, gasPrice: BigNumber, gasLimit: BigNumber) => {
  let modalRef;

  const [isShowing, setIsShowing] = useState(false);

  function dismiss() {
    setIsShowing(false);
    modalRef?.destroy();
  }

  function show(props: {
    onCancel?: () => void;
    onSuccess: (gasLimit: BigNumber, gasFee: BigNumber) => void;
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
      content: (
        <ModalBody
          asset={asset}
          gasPrice={gasPrice}
          gasLimit={gasLimit}
          onSuccess={props.onSuccess}
          onCancel={() => {
            dismiss();
            props.onCancel?.();
          }}
        />
      ),
    });
    setIsShowing(true);
    modalRef = modal;
  }

  return {
    show,
    dismiss,
  };
};

export { useCustomGasModalEVMDApp };
