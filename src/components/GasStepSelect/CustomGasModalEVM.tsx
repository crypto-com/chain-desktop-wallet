import * as React from 'react';
import { Button, Form, InputNumber, Modal } from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import "./style.less";
import { getRecoil, setRecoil } from 'recoil-nexus';
import numeral from 'numeral';
import { ethers } from 'ethers';
import { allMarketState, sessionState, walletAllAssetsState, walletListState } from '../../recoil/atom';
import { SUPPORTED_CURRENCY } from '../../config/StaticConfig';
import { getAssetAmountInFiat, UserAsset } from '../../models/UserAsset';
import { getNormalScaleAmount } from "../../utils/NumberUtils"
import { walletService } from '../../service/WalletService';

const ModalBody = (props: {
  asset: UserAsset,
  gasPrice: string,
  gasLimit: string,
  onSuccess: (gasLimit: number, gasPrice: number) => void,
  onCancel: () => void
}) => {
  const { asset, gasPrice, gasLimit, onSuccess, onCancel } = props;
  const [t] = useTranslation();

  const [form] = Form.useForm();

  const currentSession = getRecoil(sessionState);
  const allMarketData = getRecoil(allMarketState);

  const [readableNetworkFee, setReadableNetworkFee] = useState('');

  const assetMarketData = allMarketData.get(
    `${currentSession?.activeAsset?.mainnetSymbol}-${currentSession.currency}`,
  );
  const localFiatSymbol = SUPPORTED_CURRENCY.get(assetMarketData?.currency ?? 'USD')?.symbol ?? '';


  const setNetworkFee = (newGasPrice: string, newGasLimit: string) => {


    const amountBigNumber = ethers.BigNumber.from(newGasLimit).mul(ethers.BigNumber.from(newGasPrice))

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

  return <div>
    <div style={{
      fontSize: "24px",
      marginBottom: "30px"
    }}>Custom Gas</div>
    <Form layout="vertical" form={form} onValuesChange={(v) => {

      const newGasPrice = v?.gasPrice ?? gasPrice;
      const newGasLimit = v?.gasLimit ?? gasLimit;
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
          gasLimit === newGasLimit.toString() &&
          gasPrice === newGasPrice.toString()
        ) {
          return;
        }

        const updatedWallet = await walletService.findWalletByIdentifier(currentSession.wallet.identifier);

        const newlyUpdatedAsset: UserAsset = {
          ...currentSession.activeAsset!,
          config: {
            ...asset.config,
            fee: { gasLimit: newGasLimit.toString(), networkFee: newGasPrice.toString() },
          },
        };

        await walletService.saveAssets([newlyUpdatedAsset]);

        const newSession = {
          ...currentSession,
          wallet: updatedWallet,
          activeAsset: newlyUpdatedAsset,
        };
        setRecoil(sessionState, newSession)

        await walletService.setCurrentSession(newSession);

        const allNewUpdatedWallets = await walletService.retrieveAllWallets();
        setRecoil(walletListState, [...allNewUpdatedWallets])

        const allAssets = await walletService.retrieveCurrentWalletAssets(newSession);
        setRecoil(walletAllAssetsState, [...allAssets])

        onSuccess(newGasLimit, newGasPrice);
      }}>
      <Form.Item
        name="gasPrice"
        label="Gas Price(WEI)"
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

const useCustomGasModalEVM = (asset: UserAsset, gasFee: string, gasLimit: string) => {

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
        padding: "20px 20px 0 20px"
      },
      content: <ModalBody asset={asset} gasPrice={gasFee} gasLimit={gasLimit} onSuccess={props.onSuccess} onCancel={() => {
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

export { useCustomGasModalEVM }
