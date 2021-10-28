import * as React from 'react';
import { useState } from 'react';
import { Input } from 'antd';
import { ContactsOutlined } from '@ant-design/icons';
import AddressBookModal from '../AddressBookModal/AddressBookModal';
import { UserAsset } from '../../models/UserAsset';
import { Session } from '../../models/Session';

const { Search } = Input;

interface IAddressBookInputProps {
  placeholder: string;
  asset: UserAsset;
  currentSession: Session;
  onChange: (value) => void;
}

const AddressBookInput = (props: IAddressBookInputProps) => {
  const { placeholder, asset, currentSession, onChange } = props;

  const [isModalVisible, setIsModalVisible] = useState(false);

  const [value, setValue] = useState<string>();

  return (
    <>
      <Search
        placeholder={placeholder}
        value={value}
        autoFocus
        onChange={e => {
          setValue(e.target.value);
          onChange(e.target.value);
        }}
        enterButton={<ContactsOutlined />}
        onSearch={() => setIsModalVisible(true)}
      />
      {isModalVisible && (
        <AddressBookModal
          onSelect={contact => {
            setValue(contact.address);
            onChange(contact.address);
            setIsModalVisible(false);
          }}
          currentSession={currentSession}
          asset={asset}
          onClose={() => setIsModalVisible(false)}
        />
      )}
    </>
  );
};

export default AddressBookInput;
