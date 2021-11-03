import * as React from 'react';
import { Button, Form, Input, message, Modal, Select } from 'antd';
import { useCallback, useMemo, useState } from 'react';
import _ from 'lodash';
import { AddressType } from '@crypto-org-chain/chain-jslib/lib/dist/utils/address';
import { useRecoilValue } from 'recoil';
import { AddressBookContact, SupportedNetworks } from '../../models/AddressBook';
import { UserAsset, UserAssetType } from '../../models/UserAsset';
import { Session } from '../../models/Session';
import { AddressBookService } from '../../service/AddressBookService';
import { TransactionUtils } from '../../utils/TransactionUtils';
import { walletAllAssetsState } from '../../recoil/atom';

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

  const [selectedNetworkValue, setSelectedNetworkValue] = useState<string>('');
  const [selectedAsset, setSelectedAsset] = useState<UserAsset>();

  const allAssets = useRecoilValue(walletAllAssetsState);

  const customAddressValidator = useMemo(() => {
    if (!selectedAsset) {
      return null;
    }
    return TransactionUtils.addressValidator(currentSession, selectedAsset, AddressType.USER);
  }, [selectedAsset]);

  const isEditing = !!contact;

  const title = isEditing ? 'Edit Address' : 'Add Address';

  const allAssetsFromNetwork = (networkValue: string) => {
    const network = SupportedNetworks.find(n => n.value === networkValue);
    if (!network) {
      return [];
    }
    return allAssets.filter(asset => asset.assetType === network.networkType);
  };

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
              chainName: form.getFieldValue(FormKeys.network),
              assetSymbol: form.getFieldValue(FormKeys.asset),
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
        <Form.Item
          name={FormKeys.network}
          label="Network"
          initialValue={contact?.chainName}
          rules={[
            {
              required: true,
              message: 'Network is required',
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
                <Option key={network.value} value={network.value}>
                  {network.label}
                </Option>
              );
            })}
          </Select>
        </Form.Item>
        <Form.Item
          name={FormKeys.asset}
          label="Asset"
          initialValue={contact?.assetSymbol}
          rules={[
            {
              required: true,
              message: 'Asset is required',
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
          dependencies={[FormKeys.asset, FormKeys.network]}
          hasFeedback
          validateFirst
          rules={_.compact([
            { required: true, message: 'Address is required' },
            customAddressValidator,
            { validator: addressBookExistsValidator, message: 'Address already exists' },
          ])}
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

export default AddAddressModal;
