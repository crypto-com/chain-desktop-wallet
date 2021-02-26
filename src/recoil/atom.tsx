import { atom } from 'recoil';
import { DefaultWalletConfigs } from '../config/StaticConfig';
import { Session } from '../models/Session';
import { Wallet } from '../models/Wallet';
import { UserAsset } from '../models/UserAsset';
import { ValidatorModel } from '../models/Transaction';
import { NORMAL_WALLET_TYPE } from '../service/LedgerService';

const wallet = new Wallet(
  '',
  '',
  '',
  DefaultWalletConfigs.TestNetConfig,
  '',
  false,
  NORMAL_WALLET_TYPE,
);
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

const walletListState = atom({
  key: 'walletList',
  default: [wallet],
});

// Will hold the wallet seed temporarily and will be flushed after backup phase
const walletTempBackupState = atom<Wallet | null>({
  key: 'walletTempBackupSeed',
  default: null,
});

const validatorTopListState = atom<ValidatorModel[]>({
  key: 'validatorTopList',
  default: [],
});

const hasShownWarningOnWalletTypeState = atom<boolean>({
  key: 'hasShownWarningOnWalletTypeState',
  default: false,
});

export {
  walletIdentifierState,
  sessionState,
  walletAssetState,
  walletListState,
  walletTempBackupState,
  validatorTopListState,
  hasShownWarningOnWalletTypeState,
};
