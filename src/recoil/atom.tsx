import { atom } from 'recoil';
import { DefaultWalletConfigs } from '../config/StaticConfig';
import { Session } from '../models/Session';
import { Wallet } from '../models/Wallet';
import { UserAsset, AssetMarketPrice } from '../models/UserAsset';
import { ValidatorModel, NftModel } from '../models/Transaction';
import { NORMAL_WALLET_TYPE } from '../service/LedgerService';

const wallet = new Wallet(
  '',
  '',
  '',
  DefaultWalletConfigs.TestNetConfig,
  '',
  false,
  NORMAL_WALLET_TYPE,
  0, // addressIndex default
);
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

const session = new Session(wallet, asset, 'USD');

const market: AssetMarketPrice = {
  assetSymbol: 'CRO',
  currency: 'USD',
  dailyChange: '+0.00',
  price: '0.000',
};

const walletIdentifierState = atom({
  key: 'walletIdentifier',
  default: '',
});

const sessionState = atom({
  key: 'session',
  default: session,
});

const marketState = atom({
  key: 'market',
  default: market,
});

const walletAssetState = atom({
  key: 'walletAsset',
  default: asset,
});

const walletAllAssetsState = atom({
  key: 'walletAllAssets',
  default: [asset],
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

const validatorListState = atom<ValidatorModel[] | null>({
  key: 'validatorList',
  default: null,
});

const nftListState = atom<NftModel[] | undefined>({
  key: 'nftList',
  default: undefined,
});

const isIbcVisibleState = atom<boolean>({
  key: 'isIbcVisible',
  default: false,
});

const navbarMenuSelectedKeyState = atom<string>({
  key: 'navbarMenuSelectedKey',
  default: '/home',
});

const hasShownWarningOnWalletTypeState = atom<boolean>({
  key: 'hasShownWarningOnWalletTypeState',
  default: false,
});

const ledgerIsExpertModeState = atom<boolean>({
  key: 'ledgerExpertMode',
  default: false,
});

const fetchingDBState = atom<boolean>({
  key: 'fetchingDB',
  default: false,
});

export {
  walletIdentifierState,
  sessionState,
  marketState,
  walletAssetState,
  walletAllAssetsState,
  walletListState,
  walletTempBackupState,
  validatorListState,
  nftListState,
  isIbcVisibleState,
  navbarMenuSelectedKeyState,
  hasShownWarningOnWalletTypeState,
  ledgerIsExpertModeState,
  fetchingDBState,
};
