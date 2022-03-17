import * as React from 'react';
import { Button, Divider, Form, Input, List, Space, Table, Tag } from 'antd';
import { useEffect, useState } from 'react';
import { InfoCircleOutlined, PlusOutlined } from '@ant-design/icons';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { ethers } from 'ethers';
import { useForm } from 'antd/lib/form/Form';
import ConfirmModal from '../../../../components/ConfirmModal/ConfirmModal';
import { useChainConfigs } from '../../browser/useChainConfigs';
import { DappBrowserIPC } from '../../types';
import { DAppDefaultChainConfigs } from '../../../../utils/localStorage';

type ChainConfig = DappBrowserIPC.EthereumChainConfig;

const ChainConfigTab = () => {
  const {
    selectedChain,
    setSelectedChain,
    list: chainConfigs,
    add: addChainConfig,
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
        padding: '6px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Button
        icon={<PlusOutlined />}
        style={{
          boxShadow: 'none',
          justifySelf: 'flex-end',
          alignSelf: 'flex-end',
          border: 'none',
        }}
        onClick={() => {}}
      >
        Add New Chain
      </Button>
      <Divider
        style={{
          margin: '4px',
        }}
      />
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
          padding: '0 40px',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          paddingTop: '10px',
        }}
      >
        <List
          split={false}
          style={{
            width: '30%',
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
                        color: editingChainConfig.chainId === item.chainId ? '#000000' : '#AAAAAA',
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
        <Form layout="vertical" form={form} style={{ width: '40%' }}>
          <Form.Item
            label="Chain Name"
            initialValue={editingChainConfig.chainName}
            name="chain_name"
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
            initialValue={ethers.BigNumber.from(editingChainConfig.chainId).toString()}
            name="chain_id"
            hasFeedback
            validateFirst
            rules={[
              {
                required: true,
                type: 'number',
                message: `chain id ${t('general.required')}`,
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="RPC URL"
            initialValue={editingChainConfig.rpcUrls[0]}
            name="rpc_url"
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
            name="explorer_url"
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
            <Button
              type="primary"
              danger
              style={{ color: 'red', borderColor: 'red' }}
              onClick={() => {
                setDeletingConfig(editingChainConfig);
              }}
            >
              Remove
            </Button>
            <Button
              type="primary"
              danger
              onClick={() => {
                form.resetFields();
              }}
            >
              Reset
            </Button>
            <Button type="primary">Save</Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default ChainConfigTab;
