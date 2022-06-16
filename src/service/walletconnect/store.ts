import { atom } from 'recoil';
import { IClientMeta } from '@walletconnect/types';
import { Wallet } from 'ethers';
import WalletConnect from '@walletconnect/client';

interface WalletConnectState {
  peerMeta: IClientMeta | null;
  connected: boolean;
  loading: boolean;
  fetchingPeerMeta: boolean;
  connector: WalletConnect | null;
}

export const DefaultState: WalletConnectState = {
  peerMeta: null,
  connected: false,
  loading: false,
  fetchingPeerMeta: false,
  connector: null,
};

export const walletConnectStateAtom = atom<WalletConnectState>({
  key: 'walletConnectStateAtom',
  default: DefaultState,
  dangerouslyAllowMutability: true,
});
