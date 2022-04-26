import * as React from 'react';
import { Button, Form, InputNumber, Modal } from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import "./style.less";
import { getRecoil } from 'recoil-nexus';
import numeral from 'numeral';
import BigNumber from 'bignumber.js';
import { allMarketState, sessionState } from '../../recoil/atom';
import { SUPPORTED_CURRENCY } from '../../config/StaticConfig';
import { getAssetAmountInFiat, UserAsset } from '../../models/UserAsset';
import { getNormalScaleAmount } from "../../utils/NumberUtils"
import { useCronosEvmAsset } from '../../hooks/useCronosEvmAsset';

const ModalBody = (props: {
  asset: UserAsset,
  gasPrice: BigNumber,
  gasLimit: BigNumber,
  onSuccess: (gasLimit: BigNumber, gasPrice: BigNumber) => void,
  onCancel: () => void
}) => {
  const { asset, gasPrice, gasLimit, onSuccess, onCancel } = props;
  const [t] = useTranslation();

  const [form] = Form.useForm();

  const cronosEVMAsset = useCronosEvmAsset()

  const currentSession = getRecoil(sessionState);
  const allMarketData = getRecoil(allMarketState);

  const [readableNetworkFee, setReadableNetworkFee] = useState('');

  const assetMarketData = allMarketData.get(
    `${currentSession?.activeAsset?.mainnetSymbol}-${currentSession.currency}`,
  );
  const localFiatSymbol = SUPPORTED_CURRENCY.get(assetMarketData?.currency ?? 'USD')?.symbol ?? '';


  const setNetworkFee = (newGasPrice: BigNumber, newGasLimit: BigNumber) => {


    const amountBigNumber = newGasLimit.times(newGasPrice)

    const amount = getNormalScaleAmount(amountBigNumber.toString(), asset)

    if (!(asset && localFiatSymbol && assetMarketData && assetMarketData.price)) {
      setReadableNetworkFee(`${amount} ${asset.symbol}`);
      return;
    }
    const price = numeral(
      getAssetAmountInFiat(amount, assetMarketData),
    ).format('0,0.00')

    if (price === "0.00") {
      setReadableNetworkFee(`${amount} ${asset.symbol} (<${localFiatSymbol}0.01)`)
    } else {
      setReadableNetworkFee(`${amount} ${asset.symbol} (~${localFiatSymbol}${price})`)
    }
  }

  useEffect(() => {
    if (!asset) {
      return;
    }

    setNetworkFee(gasPrice, gasLimit);

    form.setFieldsValue({
      gasPrice,
      gasLimit
    })

  }, [asset, gasPrice, gasLimit]);

  if (!cronosEVMAsset) {
    return <React.Fragment />
  }

  return <div>
    <div style={{
      fontSize: "24px",
      marginBottom: "30px"
    }}>{t('custom-gas')}</div>
    <Form layout="vertical" form={form} onValuesChange={(v) => {

      const newGasPrice = new BigNumber(v?.gasPrice ?? gasPrice);
      const newGasLimit = new BigNumber(v?.gasLimit ?? gasLimit);
      if (!gasPrice || !gasLimit) {
        setReadableNetworkFee("-");
      } else {
        setNetworkFee(newGasPrice, newGasLimit);
      }

    }}
      onFinish={async (values) => {

        if (!asset.config) {
          return;
        }

        const { gasLimit: newGasLimit, gasPrice: newGasPrice }: { gasLimit: number, gasPrice: number } = values;

        if (
          gasLimit.toString() === newGasLimit.toString() &&
          gasPrice.toString() === newGasPrice.toString()
        ) {
          return;
        }

        onSuccess(new BigNumber(newGasLimit), new BigNumber(newGasPrice));
      }}>
      <Form.Item
        name="gasPrice"
        label={`${t('gas-price')}(WEI)`}
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
      <div>
        <div style={{ color: "#7B849B" }}>{t('estimate-network-fee')}</div>
        <div>{readableNetworkFee}</div>
      </div>
      <div style={{
        marginTop: "20px"
      }}>
        <div style={{ color: "#7B849B" }}>{t('estimate-time')}</div>
        <div>6s</div>
      </div>
      <Form.Item style={{
        marginTop: "20px"
      }}>
        <Button type="primary" htmlType="submit" style={{ margin: "0 10px 0 0", width: "200px" }}>
          {t('general.save')}
        </Button>
        <Button type="link" htmlType="button" onClick={() => { onCancel() }}>
          {t('general.cancel')}
        </Button>
      </Form.Item>
    </Form>
  </div>
}

const useCustomGasModalEVMDApp = (asset: UserAsset, gasPrice: BigNumber, gasLimit: BigNumber) => {

  let modalRef;

  const [isShowing, setIsShowing] = useState(false)


  function dismiss() {
    setIsShowing(false)
    modalRef?.destroy()
  }

  function show(props: {
    onCancel?: () => void,
    onSuccess: (gasLimit: BigNumber, gasFee: BigNumber) => void,
  }) {

    if (isShowing) {
      return
    }
    const modal = Modal.info({
      visible: isShowing,
      icon: null,
      closable: true,
      width: 520,
      className: "cro-gas-modal",
      onCancel: () => {
        modal.destroy()
        setIsShowing(false)
        props.onCancel?.();
      },
      cancelButtonProps: {
        hidden: true,
      },
      okButtonProps: {
        hidden: true
      },
      style: {
        padding: '20px 20px 0 20px'
      },
      content: <ModalBody asset={asset} gasPrice={gasPrice} gasLimit={gasLimit} onSuccess={props.onSuccess} onCancel={() => {
        dismiss();
        props.onCancel?.()
      }} />
    })
    setIsShowing(true)
    modalRef = modal
  }

  return {
    show,
    dismiss,
  }
}

export { useCustomGasModalEVMDApp }
