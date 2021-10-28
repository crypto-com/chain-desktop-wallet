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
}

const AddressBookInput = (props: IAddressBookInputProps) => {
  const { placeholder, asset, currentSession } = props;

  const [isModalVisible, setIsModalVisible] = useState(false);

  return (
    <>
      <Search
        placeholder={placeholder}
        enterButton={<ContactsOutlined />}
        onSearch={() => setIsModalVisible(true)}
      />
      {isModalVisible && (
        <AddressBookModal
          currentSession={currentSession}
          asset={asset}
          onClose={() => setIsModalVisible(false)}
        />
      )}
    </>
  );
};

export default AddressBookInput;
