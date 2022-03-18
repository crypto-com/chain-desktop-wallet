import * as React from 'react';
import { useState } from 'react';
import { Form, Input, InputNumber, message, Modal } from 'antd';
import { ethers } from 'ethers';
import { useTranslation } from 'react-i18next';
import { ChainConfig, ChainConfigFormData, ChainConfigFormKeys } from '../types';
import { useChainConfigs } from '../browser/useChainConfigs';

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
              const wantedChainConfig: ChainConfig = {
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
              message.success('Add success');
              dismiss();
            }}
          >
            <Form.Item
              label="Chain Name"
              name={ChainConfigFormKeys.chainName}
              hasFeedback
              validateFirst
              rules={[
                {
                  required: true,
                  type: 'string',
                  message: `chain Name ${t('general.required')}`,
                },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Chain ID"
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
                  message: `chain id exists`,
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
              label="Currency Symbol"
              name={ChainConfigFormKeys.symbol}
              hasFeedback
              validateFirst
              rules={[
                {
                  required: true,
                  type: 'string',
                  message: `Symbol ${t('general.required')}`,
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
              label="Block Explorer URL"
              name={ChainConfigFormKeys.explorerURL}
              hasFeedback
              validateFirst
              rules={[
                {
                  required: true,
                  type: 'url',
                  message: `Explorer URL ${t('general.required')}`,
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
