import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { atom, useRecoilState } from 'recoil';
import './backup.less';
import { Button, Checkbox } from 'antd';
import logo from '../../assets/logo-products-chain.svg';

const encryptedPhraseState = atom({
    key: 'encryptedPhrase',
    default: '',
});

function BackupPage() {
    const [isButtonDisabled, setIsButtonDisabled] = useState(true);

    const history = useHistory();
    const encryptedPhrase = useRecoilState(encryptedPhraseState) ?? '';

    const handleOk = () => {
        history.push('/home');
    };

    const checkboxOnChange = e => {
        setIsButtonDisabled(!e.target.checked);
    };

    return (
        <main className="backup-page">
            <div className="header">
                <img src={logo} className="logo" alt="logo" />
            </div>
            <div className="container">
                <div>
                    <div className="title">Backup Recovery Phrase</div>
                    {/* <div className="slogan">{encryptedPhrase.split(' ').map((item, index) => {
                return `${index + 1}. ${item} `;
              })}</div> */}
                    <div className="slogan">The recovery phrase will only be shown once, backup the 24-word phrase now and keep
              it safe. <br />You would need your recovery phrase to restore and access wallet.<br />{encryptedPhrase}</div>
                    <div>
                        <div className="phrase-container">
                            <div className="phrase"><span>1. </span>liar</div>
                            <div className="phrase"><span>2. </span>glory</div>
                            <div className="phrase"><span>3. </span>game</div>
                            <div className="phrase"><span>4. </span>liar</div>
                            <div className="phrase"><span>5. </span>glory</div>
                            <div className="phrase"><span>6. </span>game</div>
                            <div className="phrase"><span>7. </span>liar</div>
                            <div className="phrase"><span>8. </span>glory</div>
                            <div className="phrase"><span>9. </span>game</div>
                            <div className="phrase"><span>10. </span>liar</div>
                            <div className="phrase"><span>11. </span>glory</div>
                            <div className="phrase"><span>12. </span>game</div>
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
