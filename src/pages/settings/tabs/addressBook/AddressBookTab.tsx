import * as React from 'react';
import { Button, message, Space, Table } from 'antd';
import '../../settings.less';
import { useTranslation } from 'react-i18next';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { PlusOutlined } from '@ant-design/icons';
import _ from 'lodash';
import { AddressBookService } from '../../../../service/AddressBookService';
import { walletService } from '../../../../service/WalletService';
import { AddressBookContact } from '../../../../models/AddressBook';
import { Session } from '../../../../models/Session';
import { sessionState } from '../../../../recoil/atom';
import AddressBookInput from '../../../../components/AddressBookInput/AddressBookInput';
import AddressInputModal from '../../../../components/AddressBookModal/AddressInputModel';

interface IAddressBookTabProps {}

const AddressBookTab = (props: IAddressBookTabProps) => {
  const [t] = useTranslation();
  const [contacts, setContacts] = useState<AddressBookContact[]>([]);

  const [isAddModalShowing, setIsAddModalShowing] = useState(false);
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
                const success = await addressBookService.removeAddressBookContact(contact.id);
                if (success) {
                  await fetchContacts();
                  message.success('Remove Success');
                } else {
                  message.error('Remove failed');
                }
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
      {isAddModalShowing && (
        <AddressInputModal
          addressBookService={addressBookService}
          onCancel={() => {
            setIsAddModalShowing(false);
          }}
          onSave={() => {
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
