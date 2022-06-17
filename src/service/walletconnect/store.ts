import { atom } from 'recoil';
import { IClientMeta } from '@walletconnect/types';
import { Wallet } from 'ethers';
import WalletConnect from '@walletconnect/client';

export interface WalletConnectState {
  peerMeta: IClientMeta | null;
  connected: boolean;
  loading: boolean;
  fetchingPeerMeta: boolean;
  connector: WalletConnect | null;
  address: string;
}

export const DefaultState: WalletConnectState = {
  peerMeta: null,
  connected: false,
  loading: false,
  fetchingPeerMeta: false,
  connector: null,
  address: '',
};

export const walletConnectStateAtom = atom<WalletConnectState>({
  key: 'walletConnectStateAtom',
  default: DefaultState,
  dangerouslyAllowMutability: true,
});
