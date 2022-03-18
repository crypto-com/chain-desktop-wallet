import * as React from 'react';
import { Button, Form, Input, InputNumber, List, message } from 'antd';
import { useEffect, useState } from 'react';
import { InfoCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { ethers } from 'ethers';
import { useForm } from 'antd/lib/form/Form';
import ConfirmModal from '../../../../components/ConfirmModal/ConfirmModal';
import { useChainConfigs } from '../../browser/useChainConfigs';
import { DappBrowserIPC } from '../../types';
import { DAppDefaultChainConfigs, isChainDefaultConfig } from '../../../../utils/localStorage';
import { isHexEqual } from '../../../../utils/utils';

type ChainConfig = DappBrowserIPC.EthereumChainConfig;

const FormKeys = {
  chainId: 'chainId',
  chainName: 'chainName',
  rpcURL: 'rpcURL',
  explorerURL: 'explorerURL',
  symbol: 'symbol',
};

interface FormData {
  chainId: number;
  chainName: string;
  rpcURL: string;
  explorerURL: string;
  symbol: string;
}

const ChainConfigTab = () => {
  const {
    selectedChain,
    list: chainConfigs,
    updateList: updateChainConfigs,
    remove: removeChainConfig,
    validate,
  } = useChainConfigs();

  const [form] = useForm();

  const [t] = useTranslation();

  const [editingChainConfig, setEditingChainConfig] = useState<ChainConfig>(
    DAppDefaultChainConfigs[0],
  );
  const [deletingConfig, setDeletingConfig] = useState<ChainConfig>();

  useEffect(() => {
    form.resetFields();
  }, [editingChainConfig]);

  return (
    <div
      className="site-layout-background settings-content"
      style={{
        padding: '50px 20px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {deletingConfig && (
        <ConfirmModal
          visible
          onCancel={() => {
            setDeletingConfig(undefined);
          }}
          onConfirm={async () => {
            setDeletingConfig(undefined);
            removeChainConfig(deletingConfig.chainId);
            setEditingChainConfig(DAppDefaultChainConfigs[0]);
            message.success('Remove success');
          }}
          confirmText={t('settings.addressBook.remove')}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              paddingTop: '20px',
            }}
          >
            <InfoCircleOutlined style={{ color: '#f27474', fontSize: '70px' }} />
            <div style={{ fontSize: '24px', fontWeight: 500, marginTop: '15px' }}>
              Remove Chain Config
            </div>
            <div style={{ fontSize: '14px', color: '#0B142688' }}>
              {t('settings.addressBook.removeConfirm')}
            </div>
          </div>
        </ConfirmModal>
      )}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          paddingTop: '10px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '30%',
            alignItems: 'start',
          }}
        >
          <List
            split={false}
            style={{
              width: '100%',
            }}
            dataSource={chainConfigs}
            rowKey={record => record.chainId}
            renderItem={item => {
              return (
                <List.Item key={item.chainId}>
                  <List.Item.Meta
                    title={
                      <div
                        onClick={() => {
                          setEditingChainConfig(item);
                        }}
                        style={{
                          fontSize: '16px',
                          cursor: 'pointer',
                          color: isHexEqual(editingChainConfig.chainId, item.chainId)
                            ? '#000000'
                            : '#AAAAAA',
                        }}
                      >
                        {item.chainName}
                      </div>
                    }
                  />
                </List.Item>
              );
            }}
          />
          <Button
            icon={<PlusOutlined />}
            style={{
              boxShadow: 'none',
              border: 'none',
              margin: 0,
              padding: 0,
            }}
            onClick={() => {}}
          >
            Add New Chain
          </Button>
        </div>
        <Form<FormData>
          layout="vertical"
          form={form}
          style={{ width: '40%' }}
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

            const index = chainConfigs.findIndex(config =>
              isHexEqual(config.chainId, editingChainConfig.chainId),
            );

            const newChainConfigs = [...chainConfigs];

            newChainConfigs.splice(index, 1, wantedChainConfig);

            updateChainConfigs([...newChainConfigs]);
            setEditingChainConfig(wantedChainConfig);
            message.success('Save success');
          }}
        >
          <Form.Item
            label="Chain Name"
            initialValue={editingChainConfig.chainName}
            name={FormKeys.chainName}
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
            <Input disabled={isChainDefaultConfig(editingChainConfig.chainId)} />
          </Form.Item>
          <Form.Item
            label="Chain ID"
            initialValue={ethers.BigNumber.from(editingChainConfig.chainId).toNumber()}
            name={FormKeys.chainId}
            hasFeedback
            validateFirst
            rules={[
              {
                validator: (r, v: number) => {
                  if (v === parseInt(editingChainConfig.chainId, 16)) {
                    return Promise.resolve();
                  }

                  if (!validate(ethers.BigNumber.from(v).toHexString())) {
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
            <InputNumber disabled={isChainDefaultConfig(editingChainConfig.chainId)} />
          </Form.Item>
          <Form.Item
            label="Currency Symbol"
            initialValue={editingChainConfig.nativeCurrency.symbol}
            name={FormKeys.symbol}
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
            <Input disabled={isChainDefaultConfig(editingChainConfig.chainId)} />
          </Form.Item>
          <Form.Item
            label="RPC URL"
            initialValue={editingChainConfig.rpcUrls[0]}
            name={FormKeys.rpcURL}
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
            initialValue={editingChainConfig.blockExplorerUrls[0]}
            name={FormKeys.explorerURL}
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

          <Form.Item label=" ">
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
              <Button
                type="primary"
                danger
                disabled={
                  isChainDefaultConfig(editingChainConfig.chainId) ||
                  isHexEqual(selectedChain.chainId, editingChainConfig.chainId)
                }
                style={{ color: 'red', borderColor: 'red' }}
                onClick={() => {
                  setDeletingConfig(editingChainConfig);
                }}
              >
                Remove
              </Button>
              <div>
                <Button
                  type="primary"
                  danger
                  onClick={() => {
                    form.resetFields();
                    message.success('Reset success');
                  }}
                >
                  Reset
                </Button>
                <Button type="primary" htmlType="submit">
                  Save
                </Button>
              </div>
            </div>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default ChainConfigTab;
