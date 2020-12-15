import { atom } from 'recoil';
import { DefaultWalletConfigs } from '../config/StaticConfig';
import { Session } from '../models/Session';
import { Wallet } from '../models/Wallet';

const walletIdentifierState = atom({
  key: 'walletIdentifier',
  default: '',
});

const wallet = new Wallet('', '', '', DefaultWalletConfigs.TestNetConfig, '');

const session = new Session(wallet, 'USD');

const sessionState = atom({
  key: 'session',
  default: session,
});

export { walletIdentifierState, sessionState };
