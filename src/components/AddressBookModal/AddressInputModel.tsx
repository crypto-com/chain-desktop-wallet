import * as React from 'react';
import { Button, Form, Input, message, Modal, Select } from 'antd';
import { useMemo, useState } from 'react';
import _ from 'lodash';
import { AddressType } from '@crypto-org-chain/chain-jslib/lib/dist/utils/address';
import { useRecoilValue } from 'recoil';
import { AddressBookContact } from '../../models/AddressBook';
import { UserAsset, UserAssetType } from '../../models/UserAsset';
import { Session } from '../../models/Session';
import { AddressBookService } from '../../service/AddressBookService';
import { TransactionUtils } from '../../utils/TransactionUtils';
import { walletAllAssetsState } from '../../recoil/atom';

const { Option } = Select;

interface IAddressInputModalProps {
  onSave: { (contact: AddressBookContact): void };
  // Edit mode
  contact?: AddressBookContact;
  onCancel: { (): void };
  currentSession: Session;
  walletId: string;
  userAsset: UserAsset;
  addressBookService: AddressBookService;
}

const FormKeys = {
  network: 'network',
  asset: 'asset',
  label: 'label',
  address: 'address',
};

interface AddressBookNetwork {
  value: string;
  label: string;
  networkType: UserAssetType;
}

const SupportedNetworks: AddressBookNetwork[] = [
  { value: 'CRONOS', label: 'Cronos Chain', networkType: UserAssetType.EVM },
  { value: 'CRYPTO_ORG', label: 'Crypto.org Chain', networkType: UserAssetType.TENDERMINT },
];

const AddressInputModal = (props: IAddressInputModalProps) => {
  const {
    onSave,
    onCancel,
    userAsset,
    walletId,
    currentSession,
    addressBookService,
    contact,
  } = props;

  const [form] = Form.useForm();

  const [selectedNetworkValue, setSelectedNetworkValue] = useState<string>('');

  const allAssets = useRecoilValue(walletAllAssetsState);

  const chainName = userAsset.name;
  const assetSymbol = userAsset.symbol;

  const customAddressValidator = TransactionUtils.addressValidator(
    currentSession,
    userAsset,
    AddressType.USER,
  );

  const isEditing = !!contact;

  const title = isEditing ? 'Edit Address' : 'Add Address';

  const assets = useMemo(() => {
    const network = SupportedNetworks.find(n => n.value === selectedNetworkValue);
    if (!network) {
      return [];
    }
    return allAssets.filter(asset => asset.assetType === network.networkType);
  }, [selectedNetworkValue, allAssets]);

  const addressBookExistsValidator = async (rule, address: string) => {
    if (isEditing && contact && contact.address === address) {
      return Promise.resolve();
    }

    const isExist = await addressBookService.retriveAddressBookContact(
      walletId,
      chainName,
      assetSymbol,
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

          if (_.isEmpty(label) || _.isEmpty(address)) {
            return;
          }
          if (isEditing && contact) {
            const success = await addressBookService.editAddressBookContact(
              contact.id,
              label,
              address,
            );
            if (!success) {
              message.error('Update failed');
            }

            message.success('Update success');
            onSave(contact);
          } else {
            const contactCreated = await addressBookService.addAddressBookContact({
              walletId,
              chainName,
              assetSymbol,
              label,
              address,
            });

            if (!contactCreated) {
              message.error('Save failed');
              return;
            }

            onSave(contactCreated);
          }
        }}
      >
        <Form.Item name={FormKeys.network} label="Network">
          <Select
            value={selectedNetworkValue}
            onSelect={v => {
              setSelectedNetworkValue(v);
            }}
          >
            {SupportedNetworks.map(network => {
              return (
                <Option key={network.value} value={network.value}>
                  {network.label}
                </Option>
              );
            })}
          </Select>
        </Form.Item>
        <Form.Item name={FormKeys.asset} label="Asset">
          <Select onSelect={v => {}}>
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
          label="Address Name"
          hasFeedback
          initialValue={contact?.label}
          validateFirst
          rules={[
            {
              required: true,
              type: 'string',
              message: 'Address name is required',
            },
          ]}
        >
          <Input placeholder="Enter address name" />
        </Form.Item>
        <Form.Item
          name={FormKeys.address}
          label="Address"
          initialValue={contact?.address}
          hasFeedback
          validateFirst
          rules={[
            { required: true, message: 'Address is required' },
            customAddressValidator,
            { validator: addressBookExistsValidator, message: 'Address already exists' },
          ]}
        >
          <Input placeholder="Enter address" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            {isEditing ? 'Update' : 'Add Address'}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddressInputModal;
