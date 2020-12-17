import React from 'react';
import './signup.less';
import { useHistory } from 'react-router-dom';
import logo from '../../assets/logo-products-chain.svg';
import PasswordFormContainer from '../../components/PasswordForm/PasswordFormContainer';
import { cryptographer } from '../../crypto/Cryptographer';
import { secretStoreService } from '../../storage/SecretStoreService';

const SignUpPage = () => {
  const history = useHistory();

  const handlePasswordSubmitted = async (password: string) => {
    const salt = cryptographer.generateSalt();
    const hashResult = cryptographer.computeHash(password, salt);
    await secretStoreService.savePassword({ hash: hashResult });
    history.push('/welcome');
  };
  const handlePasswordCancelled = () => {};
  return (
    <main className="signup-page">
      <div className="header">
        <img src={logo} className="logo" alt="logo" />
      </div>
      <div className="container">
        <PasswordFormContainer
          title="Create Application Password"
          description="Before creating a new wallet, please create your application password. It will be used to encrypt your wallet seeds."
          visible
          confirmPassword
          okButtonText="Create Password"
          successText="You have successfully created your application password"
          successButtonText="Next"
          onValidatePassword={async () => {
            return {
              valid: true,
            };
          }}
          onSuccess={handlePasswordSubmitted}
          onCancel={handlePasswordCancelled}
        />
      </div>
    </main>
  );
};

export default SignUpPage;
