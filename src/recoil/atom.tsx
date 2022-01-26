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

export type NavbarMenuKey =
  | '/home'
  | '/staking'
  | '/assets'
  | '/settings'
  | '/governance'
  | '/nft'
  | '/bridge'
  | '/dapp'
  | '/wallet'
  | '/restore'
  | '/create';

export type lockPageType = '' | 'bridge' | 'dapp';

const defaultAsset: UserAsset = {
  identifier: '',
  symbol: 'CRO',
  mainnetSymbol: 'CRO',
  name: 'default',
  balance: '0',
  stakedBalance: '0',
  unbondingBalance: '0',
  rewardsBalance: '0',
  walletId: '0',
  icon_url: '',
  description: 'Default Asset',
  decimals: 1,
};

export enum LedgerConnectedApp {
  CRYPTO_ORG = 'Crypto.org',
  ETHEREUM = 'Ethereum',
  NOT_CONNECTED = '',
}

const session = new Session(wallet, defaultAsset, 'USD');

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

const allMarketState = atom({
  key: 'allMarket',
  default: new Map<string, AssetMarketPrice>(),
});

const walletAssetState = atom({
  key: 'walletAsset',
  default: defaultAsset,
});

const walletAllAssetsState = atom({
  key: 'walletAllAssets',
  default: [defaultAsset],
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

const navbarMenuSelectedKeyState = atom<NavbarMenuKey>({
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

const ledgerIsConnectedState = atom<LedgerConnectedApp>({
  key: 'ledgerIsConnected',
  default: LedgerConnectedApp.NOT_CONNECTED,
});

const isBridgeTransferingState = atom<boolean>({
  key: 'bridgeTransfering',
  default: false,
});

const pageLockState = atom<lockPageType>({
  key: 'pageLock',
  default: '',
});

const fetchingDBState = atom<boolean>({
  key: 'fetchingDB',
  default: false,
});

const fetchingComponentState = atom<boolean>({
  key: 'fetchingComponent',
  default: false,
});

export {
  walletIdentifierState,
  sessionState,
  marketState,
  allMarketState,
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
  ledgerIsConnectedState,
  isBridgeTransferingState,
  pageLockState,
  fetchingDBState,
  fetchingComponentState,
};
