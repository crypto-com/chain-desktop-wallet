import WalletConnect from '@walletconnect/client';

export const connector = new WalletConnect({
  // Required
  uri:
    'wc:b2e54402-bdfb-4ae7-b133-589aa3e238c0@1?bridge=https%3A%2F%2Fy.bridge.walletconnect.org&key=55ba2fb331a9dd64aa24402abf52ffc734bdbad1b023bcc44accf0afd386442f',
  // Required
  clientMeta: {
    description: 'WalletConnect Developer App',
    url: 'https://walletconnect.org',
    icons: ['https://walletconnect.org/walletconnect-logo.png'],
    name: 'WalletConnect',
  },
});
