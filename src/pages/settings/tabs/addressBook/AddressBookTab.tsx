import * as React from 'react';
import { Button, message, Space, Table, Tag } from 'antd';
import '../../settings.less';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { InfoCircleOutlined, PlusOutlined } from '@ant-design/icons';
import _ from 'lodash';
import { AddressBookService } from '../../../../service/AddressBookService';
import { walletService } from '../../../../service/WalletService';
import { AddressBookContact } from '../../../../models/AddressBook';
import { Session } from '../../../../models/Session';
import { sessionState } from '../../../../recoil/atom';
import AddAddressModal from '../../../../components/AddressBookModal/AddAddressModal';
import ConfirmModal from '../../../../components/ConfirmModal.tsx/ConfirmModal';

const AddressBookTab = () => {
  const [contacts, setContacts] = useState<AddressBookContact[]>([]);

  const [isAddModalShowing, setIsAddModalShowing] = useState(false);
  const [currentDeleteContact, setCurrentDeleteContact] = useState<AddressBookContact>();
  const [currentEditContact, setCurrentEditContact] = useState<AddressBookContact>();

  const session = useRecoilValue<Session>(sessionState);
  const walletId = session.wallet.identifier;

  const addressBookService = useMemo(() => {
    return new AddressBookService(walletService.storageService);
  }, [walletService]);

  const fetchContacts = useCallback(async () => {
    const fetchedContacts = await addressBookService.retrieveAllAddressBookContacts(walletId);
    setContacts([...fetchedContacts]);
  }, [walletId, addressBookService]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const AddressBookTableColumns = [
    {
      title: 'Asset',
      key: 'asset',
      render: (contact: AddressBookContact) => <div>{contact.assetSymbol}</div>,
    },
    {
      title: 'Network',
      key: 'network',
      render: (contact: AddressBookContact) => {
        return (
          <Tag
            style={{ border: 'none', padding: '5px 14px', marginLeft: '10px' }}
            color="processing"
          >
            {contact.chainName}
          </Tag>
        );
      },
    },
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
            <a
              onClick={async () => {
                setCurrentEditContact(contact);
                setIsAddModalShowing(true);
              }}
            >
              Edit
            </a>
            <a
              onClick={async () => {
                setCurrentDeleteContact(contact);
              }}
            >
              Remove
            </a>
          </Space>
        </div>
      ),
    },
  ];

  return (
    <div
      className="site-layout-background settings-content"
      style={{
        padding: '10px',
      }}
    >
      {currentDeleteContact && (
        <ConfirmModal
          visible
          onCancel={() => {
            setCurrentDeleteContact(undefined);
          }}
          onConfirm={async () => {
            setCurrentDeleteContact(undefined);
            const success = await addressBookService.removeAddressBookContact(
              currentDeleteContact.id,
            );
            if (success) {
              message.success('Address has been removed');
              await fetchContacts();
            } else {
              message.error('Remove address failed');
            }
          }}
          confirmText="Remove"
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
              Remove Address
            </div>
            <div style={{ fontSize: '14px', color: '#0B142688' }}>
              Are you sure you want to remove?
            </div>
          </div>
        </ConfirmModal>
      )}
      {isAddModalShowing && (
        <AddAddressModal
          addressBookService={addressBookService}
          contact={currentEditContact}
          onCancel={() => {
            setCurrentEditContact(undefined);
            setIsAddModalShowing(false);
            fetchContacts();
          }}
          onSave={() => {
            setCurrentEditContact(undefined);
            setIsAddModalShowing(false);
            fetchContacts();
          }}
          walletId={walletId}
          currentSession={session}
        />
      )}
      {!_.isEmpty(contacts) && (
        <Table
          style={{ width: '100%' }}
          showHeader={false}
          columns={AddressBookTableColumns}
          pagination={false}
          dataSource={contacts}
          rowKey={record => record.id}
        />
      )}
      <Button
        icon={<PlusOutlined />}
        style={{ boxShadow: 'none', border: 'none', padding: '10 0 0 0', margin: '0' }}
        onClick={() => {
          setIsAddModalShowing(true);
        }}
      >
        Add new address
      </Button>
    </div>
  );
};

export default AddressBookTab;
