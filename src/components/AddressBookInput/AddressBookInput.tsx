import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Select, AutoComplete, Divider, Input } from 'antd';
import { useRecoilState } from 'recoil';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UserAsset } from '../../models/UserAsset';
import { Session } from '../../models/Session';
import { AddressBookService } from '../../service/AddressBookService';
import { walletService } from '../../service/WalletService';
import { AddressBookContact } from '../../models/AddressBook';
import { navbarMenuSelectedKeyState } from '../../recoil/atom';

interface IAddressBookInputProps {
  userAsset: UserAsset;
  currentSession: Session;
  onChange: (value: string, addressBookContact?: AddressBookContact) => void;
  disabled?: boolean;
  initialValue?: string;
  isDefaultInput?: boolean;
}

const AddressBookInput = (props: IAddressBookInputProps) => {
  const {
    userAsset,
    currentSession,
    onChange,
    initialValue,
    disabled = false,
    isDefaultInput = false,
  } = props;

  const [, setNavbarSelectedKey] = useRecoilState(navbarMenuSelectedKeyState);
  const history = useHistory();
  const [t] = useTranslation();

  const [value, setValue] = useState<string>(initialValue ?? '');
  const [contacts, setContacts] = useState<AddressBookContact[]>([]);

  const walletId = currentSession.wallet.identifier;

  const chainName = userAsset.name;
  const assetSymbol = userAsset.symbol;

  const addressBookService = useMemo(() => {
    return new AddressBookService(walletService.storageService);
  }, [walletService]);

  const [currentContact, setCurrentContact] = useState<AddressBookContact>();

  const fetchContacts = useCallback(async () => {
    const fetchedContacts = await addressBookService.retrieveAddressBookContacts(
      walletId,
      chainName,
      assetSymbol,
    );
    setContacts([...fetchedContacts]);
  }, [walletId, chainName, assetSymbol, addressBookService]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <AutoComplete
        showSearch
        allowClear
        disabled={disabled}
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
                setNavbarSelectedKey('/settings');
                history.push('/settings/addressBook');
              }}
            >
              {t('settings.addressBook.manageAddress')}
            </a>
          </div>
        )}
        showArrow={false}
        value={initialValue ?? value}
        autoFocus
        options={contacts.map(contact => {
          return {
            key: `${contact.label}${contact.address}`,
            value: contact.address,
            label: (
              <>
                <div
                  style={{
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {contact.label}
                </div>
                <div style={{ color: '#626973', fontSize: '12px' }}>{contact.address}</div>
              </>
            ),
          };
        })}
        onSelect={(v: string) => {
          const selectedContact = contacts.find(contact => contact.address === v);
          setCurrentContact(selectedContact);
          setValue(v);
          onChange(v, selectedContact);
        }}
        filterOption={(inputValue, option) =>
          (option?.key as string)?.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
        }
        onChange={v => {
          setValue(v);

          addressBookService
            .retrieveAddressBookContact(walletId, chainName, assetSymbol, v)
            .then(contact => {
              onChange(v, contact);
              setCurrentContact(contact);
            });
        }}
      >
        {currentContact && !isDefaultInput ? (
          <Select
            mode="multiple"
            size="large"
            defaultValue={[currentContact.address]}
            value={[currentContact.address]}
            options={[{ value: currentContact.address }]}
            onInputKeyDown={e => {
              // prevent the default behavior of the select input if there is a contact selected
              if (e.key === 'Tab') {
                return;
              }

              e.preventDefault();
              e.stopPropagation();
              if (e.key === 'Backspace') {
                setCurrentContact(undefined);
                setValue('');
                onChange('', undefined);
              }
            }}
            dropdownStyle={{
              display: 'none',
            }}
            tagRender={() => {
              return (
                <div
                  style={{
                    maxWidth: '420px',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    alignItems: 'flex-start',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {currentContact.label}
                  </div>
                  <div style={{ color: '#626973', fontSize: '12px' }}>{currentContact.address}</div>
                </div>
              );
            }}
          />
        ) : (
          <Input disabled={disabled} value={initialValue ?? value} />
        )}
      </AutoComplete>
    </div>
  );
};

export default AddressBookInput;
