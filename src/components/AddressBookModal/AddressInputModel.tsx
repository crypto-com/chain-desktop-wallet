import * as React from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Form, Input, message, Modal, Space, Table } from 'antd';
import { useState, useMemo, useCallback, useEffect } from 'react';
import _ from 'lodash';
import { AddressType } from '@crypto-org-chain/chain-jslib/lib/dist/utils/address';
import { AddressBookContact } from '../../models/AddressBook';
import { UserAsset } from '../../models/UserAsset';
import { Session } from '../../models/Session';
import { AddressBookService } from '../../service/AddressBookService';
import { TransactionUtils } from '../../utils/TransactionUtils';

interface IAddressInputModalProps {
  onAdd: { (contact: AddressBookContact): void };
  onCancel: { (): void };
  currentSession: Session;
  walletId: string;
  userAsset: UserAsset;
  addressBookService: AddressBookService;
}

const FormKeys = {
  label: 'label',
  address: 'address',
};

const AddressInputModal = (props: IAddressInputModalProps) => {
  const { onAdd, onCancel, userAsset, walletId, currentSession, addressBookService } = props;

  const [form] = Form.useForm();

  const asset = useMemo(() => {
    return userAsset.name;
  }, [userAsset]);

  const customAddressValidator = TransactionUtils.addressValidator(
    currentSession,
    userAsset,
    AddressType.USER,
  );

  const addressBookExistsValidator = async (rule, address: string) => {
    const isExist = await addressBookService.isAddressBookContactExisit(walletId, asset, address);

    if (isExist) {
      return Promise.reject(new Error());
    }

    return Promise.resolve();
  };

  return (
    <Modal title="Add Address" visible closable onCancel={onCancel} footer={null}>
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

          const contact = await addressBookService.addAddressBookContact({
            walletId,
            asset,
            label,
            address,
          });

          if (!contact) {
            message.error('Save failed');
            return;
          }

          onAdd(contact);
        }}
      >
        <Form.Item
          name={FormKeys.label}
          label="Label"
          hasFeedback
          validateFirst
          rules={[
            {
              required: true,
              type: 'string',
              message: 'Label is required',
            },
          ]}
        >
          <Input placeholder="Label" autoFocus />
        </Form.Item>
        <Form.Item
          name={FormKeys.address}
          label="Address"
          hasFeedback
          validateFirst
          rules={[
            { required: true, message: 'Address is required' },
            customAddressValidator,
            { validator: addressBookExistsValidator, message: 'Address already exists' },
          ]}
        >
          <Input placeholder="Address" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Add
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddressInputModal;
