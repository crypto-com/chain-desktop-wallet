import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Form, Tooltip } from 'antd';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FIXED_DEFAULT_FEE, FIXED_DEFAULT_GAS_LIMIT } from '../../config/StaticConfig';
import { useCronosTendermintAsset } from '../../hooks/useCronosEvmAsset';
import { getNormalScaleAmount } from '../../utils/NumberUtils';
import { useCustomGasModalTendermint } from './CustomGasModalTendermint';


export const GasInfoTendermint = () => {

  const asset = useCronosTendermintAsset()
  const [readableGasFee, setReadableGasFee] = useState('')
  const [t] = useTranslation();

  const updateFee = (newNetworkFee: string) => {

    const amount = getNormalScaleAmount(newNetworkFee, asset!)

    setReadableGasFee(`${amount} ${asset!.symbol}`);
  }

  useEffect(() => {
    if (!asset) {
      return;
    }
    updateFee(asset.config?.fee?.networkFee ?? FIXED_DEFAULT_FEE);
  }, [asset]);

  return <>
    <div className="item">
      <div className="label">{t('estimate-network-fee')}</div>
      <div>{readableGasFee}</div>
    </div>
    <div className='item'>

      <div className="label">{t('estimate-time')}</div>
      <div>6s</div>
    </div>
  </>
}

const GasStep = (props: { isUsingCustomFee: boolean }) => {

  const [t] = useTranslation();
  if (props.isUsingCustomFee) {
    return <>
      <p style={{
        marginBottom: "0px",
      }}>Custom</p>
      <p style={{
        marginBottom: "0px",
        color: "#7B849B"
      }}>{`${t('estimate-time')}: 1~24 ${t('general.hours').toLowerCase()}`}</p>
    </>
  }

  return <>
    <p style={{
      marginBottom: "0px",
    }}>{t('general.walletType.normal')}</p>
    <p style={{
      marginBottom: "0px",
      color: "#7B849B"
    }}>{`${t('estimate-time')}: 6s`}</p>
  </>
}


const GasStepSelectTendermint = (props: {
  onChange?: (gasLimit: number, networkFee: number) => void,
}) => {

  const { onChange } = props;

  const [t] = useTranslation();
  const asset = useCronosTendermintAsset()

  const [networkFee, setNetworkFee] = useState(asset!.config?.fee?.networkFee ?? FIXED_DEFAULT_FEE);
  const [gasLimit, setGasLimit] = useState(asset!.config?.fee?.gasLimit ?? FIXED_DEFAULT_GAS_LIMIT);

  const [isUsingCustomFee, setIsUsingCustomFee] = useState(false);
  const { show, dismiss } = useCustomGasModalTendermint(asset!, networkFee, gasLimit);

  const [readableGasFee, setReadableGasFee] = useState('')

  const updateFee = (newNetworkFee: string) => {
    setIsUsingCustomFee(newNetworkFee !== FIXED_DEFAULT_FEE);
    const amount = getNormalScaleAmount(newNetworkFee, asset!)

    setReadableGasFee(`${amount} ${asset!.symbol}`);
  }

  useEffect(() => {
    if (!asset) {
      return;
    }
    updateFee(asset.config?.fee?.networkFee ?? FIXED_DEFAULT_FEE);
  }, [asset]);

  return <Form.Item label={
    <div style={{
      display: 'flex',
      alignItems: 'center',
      marginTop: '10px'
    }}>
      <div style={{ marginRight: 4 }}>
        {t('confirmation-speed')}
      </div>
      <Tooltip title={t('sending-crypto-on-blockchain-requires-confirmation')}>
        <ExclamationCircleOutlined style={{ color: '#1199fa' }} />
      </Tooltip>
    </div>}>
    <div style={{
      display: "flex",
      background: "#F7F7F7",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "14px",
    }}>
      <div style={{
        display: 'flex',
        flexDirection: "column",
        alignItems: 'flex-start',
      }}>
        <GasStep isUsingCustomFee={isUsingCustomFee} />
      </div>
      <p style={{
        marginBottom: "0px"
      }}>{readableGasFee}</p>
    </div>
    <a style={{ float: "right", marginTop: "4px" }} onClick={() => {
      show({
        onCancel: () => { },
        onSuccess: (newGasLimit, newGasFee) => {
          onChange?.(newGasLimit, newGasFee);
          dismiss();

          setGasLimit(newGasLimit.toString())
          setNetworkFee(newGasFee.toString())
          updateFee(newGasFee.toString());
        }
      })
    }}>{t('custom-options')}</a>
  </Form.Item>
}

export default GasStepSelectTendermint;
