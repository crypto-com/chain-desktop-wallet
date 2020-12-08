import React, { useState, useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { atom, useRecoilValue } from 'recoil';
import './backup.less';
import { Button, Checkbox } from 'antd';
import logo from '../../assets/logo-products-chain.svg';

const encryptedPhraseState = atom({
  key: 'encryptedPhrase',
  default: '',
});

function BackupPage() {
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [encryptedPhrase, setEncryptedPhrase] = useState('none');
  const phrase: string = useRecoilValue(encryptedPhraseState);
  const didMountRef = useRef(false);
  const history = useHistory();

  const handleOk = () => {
    history.push('/home');
  };

  const checkboxOnChange = e => {
    setIsButtonDisabled(!e.target.checked);
  };

  useEffect(() => {
    if (didMountRef.current) {
      if (phrase === '') {
        history.push('/create');
      }
    } else {
      setEncryptedPhrase(phrase);
      didMountRef.current = true;
    }
  }, [encryptedPhrase, history, phrase]);

  return (
    <main className="backup-page">
      <div className="header">
        <img src={logo} className="logo" alt="logo" />
      </div>
      <div className="container">
        <div>
          <div className="title">Backup Recovery Phrase</div>
          <div className="slogan">
            The recovery phrase will only be shown once, backup the 24-word phrase now and keep it
            safe. <br />
            You would need your recovery phrase to restore and access wallet.
          </div>
          <div>
            <div className="phrase-container">
              {phrase.split(' ').map((item, index) => {
                return (
                  <div className="phrase" key={index}>
                    <span>{index + 1}. </span>
                    {item}
                  </div>
                );
              })}
            </div>
            <div>
              <Checkbox onChange={checkboxOnChange}>
                I understand the recovery phrase will be only shown once
              </Checkbox>
            </div>
            <div>
              <Button key="submit" type="primary" disabled={isButtonDisabled} onClick={handleOk}>
                I have written down my recovery phrase
              </Button>
            </div>
          </div>
          {/* <FormCreate /> */}
        </div>
      </div>
    </main>
  );
}

export default BackupPage;
