import * as React from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Form, Input, message, Modal, Space, Table } from 'antd';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { AddressType } from '@crypto-org-chain/chain-jslib/lib/dist/utils/address';
import _ from 'lodash';
import { AddressBookContact } from '../../models/AddressBook';
import { UserAsset } from '../../models/UserAsset';
import { TransactionUtils } from '../../utils/TransactionUtils';
import { Session } from '../../models/Session';
import { walletService } from '../../service/WalletService';
import { AddressBookService } from '../../service/AddressBookService';

interface IAddAddressModalProps {
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

const AddAddressModal = (props: IAddAddressModalProps) => {
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

    return !isExist;
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

interface IAddressBookModalProps {
  onClose: () => void;
  asset: UserAsset;
  currentSession: Session;
}

const AddressBookTableColumns = [
  {
    title: 'Address',
    key: 'address',
    render: (contact: AddressBookContact) => (
      <div>
        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{contact.label}</div>
        <div style={{ color: '#777777' }}>{contact.address}</div>
      </div>
    ),
  },
  {
    title: 'Action',
    key: 'action',
    render: (contact: AddressBookContact) => (
      <div style={{ display: 'flex' }}>
        <Space size="middle">
          <a>Edit</a>
          <a>Delete</a>
          <a>Select</a>
        </Space>
      </div>
    ),
  },
];

const AddressBookModal = (props: IAddressBookModalProps) => {
  const { onClose, asset: userAsset, currentSession } = props;

  const [isAddModalShowing, setIsAddModalShowing] = useState(false);
  const [contacts, setContacts] = useState<AddressBookContact[]>([]);

  const walletId = useMemo(() => {
    return currentSession.wallet.identifier;
  }, [currentSession]);

  const asset = useMemo(() => {
    return userAsset.name;
  }, [userAsset]);

  const addressBookService = useMemo(() => {
    return new AddressBookService(walletService.storageService);
  }, [walletService]);

  const fetchContacts = useCallback(async () => {
    const fetchedContacts = await addressBookService.retrieveAddressBookContacts(walletId, asset);
    setContacts([...fetchedContacts]);
  }, [walletId, asset]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  return (
    <>
      {isAddModalShowing && (
        <AddAddressModal
          currentSession={currentSession}
          walletId={walletId}
          addressBookService={addressBookService}
          userAsset={userAsset}
          onAdd={() => {
            fetchContacts();
          }}
          onCancel={() => {
            setIsAddModalShowing(false);
          }}
        />
      )}
      <Modal
        title="Address Book"
        visible
        width="700px"
        closable
        footer={[
          <Button
            key="add-address"
            onClick={() => {
              setIsAddModalShowing(true);
            }}
            icon={<PlusOutlined />}
          >
            Add Address
          </Button>,
        ]}
        onCancel={onClose}
      >
        {_.isEmpty(contacts) ? (
          'No Addresses'
        ) : (
          <Table
            columns={AddressBookTableColumns}
            pagination={{
              pageSize: 5,
            }}
            dataSource={contacts}
            rowKey={record => record.id}
          />
        )}
      </Modal>
    </>
  );
};

export default AddressBookModal;
