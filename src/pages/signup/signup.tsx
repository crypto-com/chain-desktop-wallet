import React from 'react';
import './signup.less';
import logo from '../../assets/logo-products-chain.svg';
import PasswordFormContainer from '../../components/PasswordForm/PasswordFormContainer';

const SignUpPage = () => {
  const handlePasswordSubmitted = async (password: string) => {
    // TODO: store app password
    // eslint-disable-next-line no-console
    console.log(password);
  };
  const handlePasswordCancelled = () => {};
  return (
    <main className="signup-page">
      <div className="header">
        <img src={logo} className="logo" alt="logo" />
      </div>
      <div className="container">
        <PasswordFormContainer
          title="Create App Password"
          description="Before creating a new wallet, please create your app password. It will be used to encrypt your wallet seeds."
          visible
          confirmPassword
          okButtonText="Create Account"
          successText="You have successfully created your app password"
          successButtonText="Next"
          onValidatePassword={async (password: string) => {
            // TODO
            // eslint-disable-next-line no-console
            console.log(password);
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
