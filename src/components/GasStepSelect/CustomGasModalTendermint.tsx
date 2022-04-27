import * as React from 'react';
import { Button, Form, InputNumber, Modal } from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import "./style.less";
import { getRecoil, setRecoil } from 'recoil-nexus';
import numeral from 'numeral';
import { ethers } from 'ethers';
import { ValidateStatus } from 'antd/lib/form/FormItem';
import { allMarketState, sessionState, walletAllAssetsState, walletListState } from '../../recoil/atom';
import { FIXED_DEFAULT_FEE, FIXED_DEFAULT_GAS_LIMIT, SUPPORTED_CURRENCY } from '../../config/StaticConfig';
import { getAssetAmountInFiat, UserAsset } from '../../models/UserAsset';
import { getNormalScaleAmount } from "../../utils/NumberUtils"
import { walletService } from '../../service/WalletService';
import { useCronosTendermintAsset } from '../../hooks/useCronosEvmAsset';
import { Session } from '../../models/Session';
import { useAnalytics } from '../../hooks/useAnalytics';

const ModalBody = (props: {
  asset: UserAsset,
  gasFee: string,
  gasLimit: string,
  onSuccess: (gasLimit: number, networkFee: number) => void,
  onCancel: () => void
}) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { asset, gasFee, gasLimit, onSuccess, onCancel } = props;

  const [t] = useTranslation();

  const [form] = Form.useForm();

  const croTendermintAsset = useCronosTendermintAsset()
  const [validateStatus, setValidateStatus] = useState<ValidateStatus>('');
  const currentSession = getRecoil(sessionState);
  const allMarketData = getRecoil(allMarketState);

  const [readableNetworkFee, setReadableNetworkFee] = useState('');

  const assetMarketData = allMarketData.get(
    `${currentSession?.activeAsset?.mainnetSymbol}-${currentSession.currency}`,
  );
  const localFiatSymbol = SUPPORTED_CURRENCY.get(assetMarketData?.currency ?? 'USD')?.symbol ?? '';
  const { analyticsService } = useAnalytics();

  const setNetworkFee = (fee: number) => {
    const amount = getNormalScaleAmount(fee.toString(), asset)

    if (ethers.BigNumber.from(asset.balance).lte(fee)) {
      setValidateStatus('error')
    } else {
      setValidateStatus('');
    }

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

    setNetworkFee(Number(gasFee));

    form.setFieldsValue({
      networkFee: gasFee,
      gasLimit
    })

  }, [asset, gasFee, gasLimit]);

  if (!croTendermintAsset) {
    return <React.Fragment />
  }

  return <div>
    <div style={{
      fontSize: "24px",
      marginBottom: "30px"
    }}>{t('custom-gas')}</div>
    <Form layout="vertical" form={form} onValuesChange={(v) => {

      const networkFee = v?.networkFee ?? gasFee;
      if (!networkFee) {
        setReadableNetworkFee("-");
      } else {
        setNetworkFee(networkFee);
      }

    }}
      onFinish={async (values) => {

        if (!asset.config) {
          return;
        }

        const { gasLimit: newGasLimit, networkFee: newNetworkFee }: { gasLimit: number, networkFee: number } = values;

        if (
          gasLimit === newGasLimit.toString() &&
          gasFee === newNetworkFee.toString()
        ) {
          onSuccess(newGasLimit, newNetworkFee);
          return;
        }

        const updatedWallet = await walletService.findWalletByIdentifier(currentSession.wallet.identifier);

        const newlyUpdatedAsset = {
          ...croTendermintAsset,
          config: {
            ...croTendermintAsset.config,
            fee: { gasLimit: newGasLimit.toString(), networkFee: newNetworkFee.toString() },
          },
        };

        await walletService.saveAssets([newlyUpdatedAsset as UserAsset]);

        const newSession = {
          ...currentSession,
          wallet: updatedWallet,
          activeAsset: newlyUpdatedAsset,
        };
        setRecoil(sessionState, newSession as Session)

        await walletService.setCurrentSession(newSession as Session);

        const allNewUpdatedWallets = await walletService.retrieveAllWallets();
        setRecoil(walletListState, [...allNewUpdatedWallets])

        const allAssets = await walletService.retrieveCurrentWalletAssets(newSession as Session);
        setRecoil(walletAllAssetsState, [...allAssets])

        onSuccess(newGasLimit, newNetworkFee);
        analyticsService.logCustomizeGas(asset.assetType ?? "")
      }}>
      <Form.Item
        name="networkFee"
        label={`${t('settings.form1.networkFee.label')}(baseCRO)`}
        hasFeedback
        validateStatus={validateStatus}
        help={validateStatus ? t('dapp.requestConfirmation.error.insufficientBalance') : ""}
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
        validateStatus={validateStatus}
        help={validateStatus ? t('dapp.requestConfirmation.error.insufficientBalance') : ""}
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
        <Button type="primary" htmlType="submit" style={{ margin: "0 10px 0 0", width: "200px" }} disabled={!!validateStatus}>
          {t('general.save')}
        </Button>
        <Button danger type="link" htmlType='button' onClick={() => {
          form.setFieldsValue({
            networkFee: FIXED_DEFAULT_FEE,
            gasLimit: FIXED_DEFAULT_GAS_LIMIT
          })
          setNetworkFee(Number(FIXED_DEFAULT_FEE))
        }}>{t("general.default")}</Button>
      </Form.Item>
    </Form>
  </div>
}

const useCustomGasModalTendermint = (asset: UserAsset, gasFee: string, gasLimit: string) => {

  let modalRef;

  const [isShowing, setIsShowing] = useState(false)


  function dismiss() {
    setIsShowing(false)
    modalRef?.destroy()
  }

  function show(props: {
    onCancel?: () => void,
    onSuccess: (gasLimit: number, gasFee: number) => void,
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
      content: <ModalBody asset={asset} gasFee={gasFee} gasLimit={gasLimit} onSuccess={props.onSuccess} onCancel={() => {
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

export { useCustomGasModalTendermint }
