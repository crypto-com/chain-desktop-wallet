import * as React from 'react';
import { Button, Form, Input, message, Modal, Select } from 'antd';
import { useMemo, useState } from 'react';
import _ from 'lodash';
import { AddressType } from '@crypto-org-chain/chain-jslib/lib/dist/utils/address';
import { useRecoilValue } from 'recoil';
import { useTranslation } from 'react-i18next';
import { AddressBookContact, SupportedNetworks } from '../../models/AddressBook';
import { UserAsset } from '../../models/UserAsset';
import { Session } from '../../models/Session';
import { AddressBookService } from '../../service/AddressBookService';
import { TransactionUtils } from '../../utils/TransactionUtils';
import { walletAllAssetsState } from '../../recoil/atom';
import { getChainName } from '../../utils/utils';

const { Option } = Select;

interface IAddAddressModalProps {
  onSave: { (contact: AddressBookContact): void };
  // Edit mode
  contact?: AddressBookContact;
  onCancel: { (): void };
  currentSession: Session;
  walletId: string;
  // userAsset: UserAsset;
  addressBookService: AddressBookService;
}

const FormKeys = {
  network: 'network',
  asset: 'asset',
  label: 'label',
  address: 'address',
  memo: 'memo',
};

const AddAddressModal = (props: IAddAddressModalProps) => {
  const {
    onSave,
    onCancel,
    // userAsset,
    walletId,
    currentSession,
    addressBookService,
    contact,
  } = props;

  const [form] = Form.useForm();
  const [t] = useTranslation();

  const [selectedNetworkValue, setSelectedNetworkValue] = useState<string>('');
  const [selectedAsset, setSelectedAsset] = useState<UserAsset>();
  const allAssets = useRecoilValue(walletAllAssetsState);

  const isEditing = !!contact;

  const allAssetsFromNetwork = (networkValue: string) => {
    const network = SupportedNetworks.find(n => n.label === networkValue);
    if (!network) {
      return [];
    }
    return allAssets.filter(asset => asset.assetType === network.networkType);
  };

  React.useEffect(() => {
    if (!isEditing || !contact) {
      return;
    }
    const network = contact.chainName;
    setSelectedNetworkValue(network);
    const assetList = allAssetsFromNetwork(network);
    const asset = assetList?.find(a => a.symbol === contact?.assetSymbol);
    if (asset) {
      setSelectedAsset(asset);
    }
  }, [isEditing]);

  const customAddressValidator = useMemo(() => {
    if (!selectedAsset) {
      return null;
    }
    return TransactionUtils.addressValidator(currentSession, selectedAsset, AddressType.USER);
  }, [selectedAsset]);

  const title = isEditing
    ? t('settings.addressBook.editAddress')
    : t('settings.addressBook.addAddress');

  const assets = useMemo(() => {
    return allAssetsFromNetwork(selectedNetworkValue);
  }, [selectedNetworkValue, allAssets]);

  const addressBookExistsValidator = async (rule, address: string) => {
    if (isEditing && contact && contact.address === address) {
      return Promise.resolve();
    }

    const isExist = await addressBookService.retrieveAddressBookContact(
      walletId,
      form.getFieldValue(FormKeys.network),
      form.getFieldValue(FormKeys.asset),
      address,
    );

    if (isExist) {
      return Promise.reject(new Error());
    }

    return Promise.resolve();
  };

  return (
    <Modal title={title} visible closable onCancel={onCancel} footer={null}>
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={async () => {
          const label: string = form.getFieldValue(FormKeys.label);
          const address: string = form.getFieldValue(FormKeys.address);
          const network: string = form.getFieldValue(FormKeys.network);
          const assetSymbol: string = form.getFieldValue(FormKeys.asset);
          const memo: string = form.getFieldValue(FormKeys.memo);

          const validateFiles = [label, address, network, assetSymbol];

          if (_.compact(validateFiles).length !== validateFiles.length) {
            return;
          }

          if (isEditing && contact) {
            const success = await addressBookService.editAddressBookContact(
              contact.id,
              network,
              assetSymbol,
              label,
              address,
              memo,
            );
            if (!success) {
              message.error(t('settings.addressBook.message.updateFailed'));
            }
            message.success(t('settings.addressBook.message.addressUpdated'));
            onSave(contact);
          } else {
            const contactCreated = await addressBookService.addAddressBookContact({
              walletId,
              chainName: network,
              assetSymbol,
              label,
              address,
              memo,
            });

            if (!contactCreated) {
              message.error(t('settings.addressBook.message.addFailed'));
              return;
            }

            message.success(t('settings.addressBook.message.addressAdded'));
            onSave(contactCreated);
          }
        }}
      >
        <Form.Item
          name={FormKeys.network}
          label={t('create.formCreate.network.label')}
          initialValue={contact?.chainName}
          rules={[
            {
              required: true,
              message: `${t('create.formCreate.network.label')} ${t('general.required')}`,
            },
          ]}
        >
          <Select
            value={selectedNetworkValue}
            onSelect={v => {
              setSelectedNetworkValue(v);
              // auto select first asset
              const assetList = allAssetsFromNetwork(v);
              if (!_.isEmpty(assetList)) {
                setSelectedAsset(assetList[0]);
                const asset = assetList[0].symbol;
                form.setFieldsValue({
                  asset,
                });
              }
            }}
          >
            {SupportedNetworks.map(network => {
              return (
                <Option key={network.label} value={network.label}>
                  {getChainName(network.label, currentSession.wallet.config)}
                </Option>
              );
            })}
          </Select>
        </Form.Item>
        <Form.Item
          name={FormKeys.asset}
          label={t('settings.form1.assetIdentifier.label')}
          initialValue={contact?.assetSymbol}
          rules={[
            {
              required: true,
              message: `${t('settings.form1.assetIdentifier.label')} ${t('general.required')}`,
            },
          ]}
        >
          <Select>
            {assets.map(asset => {
              return (
                <Option key={asset.symbol} value={asset.symbol}>
                  {asset.symbol}
                </Option>
              );
            })}
          </Select>
        </Form.Item>
        <Form.Item
          name={FormKeys.label}
          label={t('settings.addressBook.form.addressName')}
          hasFeedback
          initialValue={contact?.label}
          validateFirst
          rules={[
            {
              required: true,
              type: 'string',
              message: `${t('settings.addressBook.form.addressName')} ${t('general.required')}`,
            },
          ]}
        >
          <Input placeholder={t('settings.addressBook.form.enterAddressName')} />
        </Form.Item>
        <Form.Item
          name={FormKeys.address}
          label={t('wallet.table1.address')}
          initialValue={contact?.address}
          dependencies={[FormKeys.asset, FormKeys.network]}
          hasFeedback
          validateFirst
          rules={_.compact([
            { required: true, message: `${t('wallet.table1.address')} ${t('general.required')}` },
            customAddressValidator,
            {
              validator: addressBookExistsValidator,
              message: t('settings.addressBook.form.alreadExists'),
            },
          ])}
        >
          <Input placeholder={t('settings.addressBook.form.enterAddress')} />
        </Form.Item>
        <Form.Item
          name={FormKeys.memo}
          label={t('send.modal1.label5')}
          initialValue={contact?.memo}
          hasFeedback
        >
          <Input />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" style={{ marginLeft: '0' }}>
            {isEditing
              ? t('settings.addressBook.form.update')
              : t('settings.addressBook.addAddress')}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddAddressModal;
