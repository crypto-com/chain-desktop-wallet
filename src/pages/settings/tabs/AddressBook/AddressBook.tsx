import * as React from 'react';
import { Button, message, Space, Table, Tag } from 'antd';
import '../../settings.less';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { InfoCircleOutlined, PlusOutlined } from '@ant-design/icons';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { AddressBookService } from '../../../../service/AddressBookService';
import { walletService } from '../../../../service/WalletService';
import { AddressBookContact } from '../../../../models/AddressBook';
import { Session } from '../../../../models/Session';
import { sessionState } from '../../../../recoil/atom';
import AddAddressModal from '../../../../components/AddressBookModal/AddAddressModal';
import ConfirmModal from '../../../../components/ConfirmModal/ConfirmModal';
import { getChainName } from '../../../../utils/utils';

const AddressBook = () => {
  const [contacts, setContacts] = useState<AddressBookContact[]>([]);

  const [isAddModalShowing, setIsAddModalShowing] = useState(false);
  const [currentDeleteContact, setCurrentDeleteContact] = useState<AddressBookContact>();
  const [currentEditContact, setCurrentEditContact] = useState<AddressBookContact>();

  const session = useRecoilValue<Session>(sessionState);
  const walletId = session.wallet.identifier;
  const [t] = useTranslation();

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
      key: 'asset',
      width: '70px',
      render: (contact: AddressBookContact) => <div>{contact.assetSymbol}</div>,
    },
    {
      key: 'network',
      width: '180px',
      render: (contact: AddressBookContact) => {
        return (
          <Tag
            style={{ border: 'none', padding: '5px 14px', marginLeft: '10px' }}
            color="processing"
          >
            {getChainName(contact.chainName, session.wallet.config)}
          </Tag>
        );
      },
    },
    {
      key: 'address',
      ellipsis: true,
      render: (contact: AddressBookContact) => (
        <div
          style={{
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              fontWeight: 'bold',
              fontSize: '14px',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
            }}
          >
            {contact.label}
          </div>
          <div style={{ color: '#777777' }}>{contact.address}</div>
          <div style={{ color: '#777777' }}>{contact.memo?.length > 0 ? contact.memo : '--'}</div>
        </div>
      ),
    },
    {
      key: 'action',
      width: '150px',
      render: (contact: AddressBookContact) => (
        <div style={{ display: 'flex' }}>
          <Space size="middle">
            <a
              onClick={async () => {
                setCurrentEditContact(contact);
                setIsAddModalShowing(true);
              }}
            >
              {t('settings.addressBook.edit')}
            </a>
            <a
              onClick={async () => {
                setCurrentDeleteContact(contact);
              }}
            >
              {t('settings.addressBook.remove')}
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
              message.success(t('settings.addressBook.hasBeenRemoved'));
              await fetchContacts();
            } else {
              message.error(t('settings.addressBook.message.removeFailed'));
            }
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
              {t('settings.addressBook.removeAddress')}
            </div>
            <div style={{ fontSize: '14px', color: '#0B142688' }}>
              {t('settings.addressBook.removeConfirm')}
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
        {t('settings.addressBook.addNewAddress')}
      </Button>
    </div>
  );
};

export default AddressBook;
