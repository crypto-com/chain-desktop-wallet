import * as React from 'react';
import { Button, Form, InputNumber, Modal } from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import "./style.less";
import { getRecoil } from 'recoil-nexus';
import numeral from 'numeral';
import { allMarketState, sessionState } from '../../recoil/atom';
import { FIXED_DEFAULT_FEE, FIXED_DEFAULT_GAS_LIMIT, SUPPORTED_CURRENCY } from '../../config/StaticConfig';
import { getAssetAmountInFiat, UserAsset } from '../../models/UserAsset';
import { getNormalScaleAmount } from "../../utils/NumberUtils"

const ModalBody = (props: { asset: UserAsset, onSuccess: () => void, onCancel: () => void }) => {
  const { asset, onSuccess, onCancel } = props;
  const [t] = useTranslation();

  const [form] = Form.useForm();

  const currentSession = getRecoil(sessionState);
  const allMarketData = getRecoil(allMarketState);

  const [readableNetworkFee, setReadableNetworkFee] = useState('');


  const assetMarketData = allMarketData.get(
    `${currentSession?.activeAsset?.mainnetSymbol}-${currentSession.currency}`,
  );
  const localFiatSymbol = SUPPORTED_CURRENCY.get(assetMarketData?.currency ?? 'USD')?.symbol ?? '';


  const setNetworkFee = (fee: number) => {
    const amount = getNormalScaleAmount(fee.toString(), asset)

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

    const networkFee = asset.config?.fee?.networkFee ?? FIXED_DEFAULT_FEE;
    const gasLimit = asset.config?.fee?.gasLimit ?? FIXED_DEFAULT_GAS_LIMIT;

    setNetworkFee(Number(networkFee));

    form.setFieldsValue({
      networkFee,
      gasLimit
    })

  }, [asset]);

  return <div>
    <div style={{
      fontSize: "24px",
      marginBottom: "30px"
    }}>Custom Gas</div>
    <Form layout="vertical" form={form} onValuesChange={(v) => {

      const networkFee = v?.networkFee;
      if (!networkFee) {
        setReadableNetworkFee("-");
      } else {
        setNetworkFee(networkFee);
      }

    }}>
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
        <InputNumber precision={0} min={1} onChange={(v) => {
          setNetworkFee(v)
        }} />
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
        <div style={{ color: "#7B849B" }}>Estimate Network Fee</div>
        <div>{readableNetworkFee}</div>
      </div>
      <div style={{
        marginTop: "20px"
      }}>
        <div style={{ color: "#7B849B" }}>Estimate Time</div>
        <div>6 s</div>
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

const useCustomCROGasModal = (asset: UserAsset) => {

  let modalRef;

  const [isShowing, setIsShowing] = useState(false)



  function dismiss() {
    setIsShowing(false)
    modalRef?.destroy()
  }

  function show(props: {
    onCancel?: () => void,
    onSuccess: () => void,
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
        padding: "20px 20px 0 20px"
      },
      content: <ModalBody asset={asset} onSuccess={props.onSuccess} onCancel={() => {
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

export { useCustomCROGasModal }
