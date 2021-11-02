import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Select, AutoComplete, Divider } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import AddressBookModal from '../AddressBookModal/AddressBookModal';
import { UserAsset } from '../../models/UserAsset';
import { Session } from '../../models/Session';
import { AddressBookService } from '../../service/AddressBookService';
import { walletService } from '../../service/WalletService';
import { AddressBookContact } from '../../models/AddressBook';

const { Option } = Select;

interface IAddressBookInputProps {
  userAsset: UserAsset;
  currentSession: Session;
  onChange: (value: string, addressBookContact?: AddressBookContact) => void;
}

const AddressBookInput = (props: IAddressBookInputProps) => {
  const { userAsset, currentSession, onChange } = props;

  const [isModalVisible, setIsModalVisible] = useState(false);

  const [value, setValue] = useState<string>();
  const [contacts, setContacts] = useState<AddressBookContact[]>([]);

  const walletId = currentSession.wallet.identifier;

  const asset = userAsset.name;

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
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <AutoComplete
        showSearch
        allowClear
        dropdownRender={menu => (
          <div>
            {menu}
            <Divider style={{ margin: '8px 0px' }} />
            <a
              style={{
                flex: 'none',
                padding: '0px 8px 8px 8px',
                display: 'block',
                cursor: 'pointer',
              }}
              onClick={() => {
                setIsModalVisible(true);
              }}
            >
              Manage Addresses
            </a>
          </div>
        )}
        showArrow={false}
        value={value}
        autoFocus
        filterOption={(inputValue, option) =>
          (option?.key as string)?.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
        }
        onChange={v => {
          setValue(v);

          addressBookService.retriveAddressBookContact(walletId, asset, v).then(contact => {
            onChange(v, contact);
          });
        }}
      >
        {contacts.map(contact => {
          return (
            <Option key={`${contact.label}${contact.address}`} value={contact.address}>
              <div>{contact.label}</div>
              <div style={{ color: '#626973', fontSize: '12px' }}>{contact.address}</div>
            </Option>
          );
        })}
      </AutoComplete>
      {isModalVisible && (
        <AddressBookModal
          onSelect={contact => {
            setValue(contact.address);
            onChange(contact.address, contact);
            setIsModalVisible(false);
          }}
          currentSession={currentSession}
          asset={userAsset}
          onClose={() => setIsModalVisible(false)}
        />
      )}
    </div>
  );
};

export default AddressBookInput;
