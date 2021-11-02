import * as React from 'react';
import { Button, Form, Input, message, Modal } from 'antd';
import { useMemo } from 'react';
import _ from 'lodash';
import { AddressType } from '@crypto-org-chain/chain-jslib/lib/dist/utils/address';
import { AddressBookContact } from '../../models/AddressBook';
import { UserAsset } from '../../models/UserAsset';
import { Session } from '../../models/Session';
import { AddressBookService } from '../../service/AddressBookService';
import { TransactionUtils } from '../../utils/TransactionUtils';

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
  label: 'label',
  address: 'address',
};

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

  const chainName = userAsset.name;
  const assetSymbol = userAsset.symbol;

  const customAddressValidator = TransactionUtils.addressValidator(
    currentSession,
    userAsset,
    AddressType.USER,
  );

  const isEditing = !!contact;

  const title = isEditing ? 'Edit Address' : 'Add Address';

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
        <Form.Item
          name={FormKeys.label}
          label="Label"
          hasFeedback
          initialValue={contact?.label}
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
          initialValue={contact?.address}
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
            {isEditing ? 'Update' : 'Add'}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddressInputModal;
