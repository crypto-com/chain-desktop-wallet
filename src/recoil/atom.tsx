import { atom } from 'recoil';
import { DefaultWalletConfigs } from '../config/StaticConfig';
import { Session } from '../models/Session';
import { Wallet } from '../models/Wallet';
import { UserAsset } from '../models/UserAsset';

const wallet = new Wallet('', '', '', DefaultWalletConfigs.TestNetConfig, '');
const session = new Session(wallet, 'USD');
const asset: UserAsset = {
  identifier: '',
  symbol: 'CRO',
  mainnetSymbol: 'CRO',
  name: 'default',
  balance: '0',
  stakedBalance: '0',
  walletId: '0',
  icon_url: '',
  description: 'Default Asset',
  decimals: 1,
};

const walletIdentifierState = atom({
  key: 'walletIdentifier',
  default: '',
});

const sessionState = atom({
  key: 'session',
  default: session,
});

const walletAssetState = atom({
  key: 'walletAsset',
  default: asset,
});

export { walletIdentifierState, sessionState, walletAssetState };
