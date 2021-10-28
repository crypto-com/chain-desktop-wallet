import * as React from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Modal, Space, Table } from 'antd';
import { useState, useMemo, useCallback, useEffect } from 'react';
import _ from 'lodash';
import { AddressBookContact } from '../../models/AddressBook';
import { UserAsset } from '../../models/UserAsset';
import { Session } from '../../models/Session';
import { walletService } from '../../service/WalletService';
import { AddressBookService } from '../../service/AddressBookService';
import AddressInputModal from './AddressInputModel';

interface IAddressBookModalProps {
  onClose: () => void;
  onSelect: (contact: AddressBookContact) => void;
  asset: UserAsset;
  currentSession: Session;
}

const AddressBookModal = (props: IAddressBookModalProps) => {
  const { onClose, asset: userAsset, currentSession, onSelect } = props;

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
            <a onClick={() => {}}>Delete</a>
            <a
              onClick={() => {
                onSelect(contact);
              }}
            >
              Select
            </a>
          </Space>
        </div>
      ),
    },
  ];

  return (
    <>
      {isAddModalShowing && (
        <AddressInputModal
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
