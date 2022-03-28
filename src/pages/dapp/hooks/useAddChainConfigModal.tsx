import * as React from 'react';
import { useState } from 'react';
import { Form, Input, InputNumber, message, Modal } from 'antd';
import { ethers } from 'ethers';
import { useTranslation } from 'react-i18next';
import { ChainConfigFormData, ChainConfigFormKeys } from '../types';
import { useChainConfigs } from '../browser/useChainConfigs';
import { EVMChainConfig } from '../../../models/Chain';

export const useAddChainConfigModal = () => {
  const [m, setM] = useState({
    destroy: () => {},
  });
  const [form] = Form.useForm();
  const [t] = useTranslation();

  const { add: addChainConfig, validate } = useChainConfigs();

  function showWithConfig() {
    const mm = Modal.info({
      title: '',
      icon: null,
      visible: true,
      okText: 'Add',
      cancelText: 'Cancel',
      onOk: () => {
        form.submit();
      },
      okCancel: true,
      content: (
        <div>
          <Form<ChainConfigFormData>
            layout="vertical"
            form={form}
            onFinish={fieldsValue => {
              const wantedChainConfig: EVMChainConfig = {
                chainId: ethers.BigNumber.from(fieldsValue.chainId).toHexString(),
                chainName: fieldsValue.chainName,
                rpcUrls: [fieldsValue.rpcURL],
                blockExplorerUrls: [fieldsValue.explorerURL],
                nativeCurrency: {
                  symbol: fieldsValue.symbol,
                  name: fieldsValue.symbol,
                  decimals: 18,
                },
              };

              addChainConfig(wantedChainConfig);
              message.success(t('dapp.chainConfig.saveSuccessfully'));
              dismiss();
            }}
          >
            <Form.Item
              label={t('dapp.chainConfig.chainName')}
              name={ChainConfigFormKeys.chainName}
              hasFeedback
              validateFirst
              rules={[
                {
                  required: true,
                  type: 'string',
                  message: `${t('dapp.chainConfig.chainName')} ${t('general.required')}`,
                },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label={t('dapp.chainConfig.chainID')}
              name={ChainConfigFormKeys.chainId}
              hasFeedback
              validateFirst
              rules={[
                {
                  validator: (r, v: number) => {
                    if (!v || !validate(ethers.BigNumber.from(v).toHexString())) {
                      return Promise.reject();
                    }

                    return Promise.resolve();
                  },
                  message: `${t('dapp.chainConfig.chainID')} ${t('dapp.chainConfig.exists')}`,
                },
                {
                  required: true,
                  type: 'number',
                },
              ]}
            >
              <InputNumber />
            </Form.Item>
            <Form.Item
              label={t('dapp.chainConfig.currencySymbol')}
              name={ChainConfigFormKeys.symbol}
              hasFeedback
              validateFirst
              rules={[
                {
                  required: true,
                  type: 'string',
                  message: `${t('dapp.chainConfig.currencySymbol')} ${t('general.required')}`,
                },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="RPC URL"
              name={ChainConfigFormKeys.rpcURL}
              hasFeedback
              validateFirst
              rules={[
                {
                  required: true,
                  type: 'url',
                  message: `RPC URL ${t('general.required')}`,
                },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label={t('dapp.chainConfig.blockExplorer')}
              name={ChainConfigFormKeys.explorerURL}
              hasFeedback
              validateFirst
              rules={[
                {
                  required: true,
                  type: 'url',
                  message: `${t('dapp.chainConfig.blockExplorer')} ${t('general.required')}`,
                },
              ]}
            >
              <Input />
            </Form.Item>
          </Form>
        </div>
      ),
    });
    setM(mm);
  }

  function dismiss() {
    m.destroy();
  }

  return {
    showWithConfig,
    dismiss,
  };
};
