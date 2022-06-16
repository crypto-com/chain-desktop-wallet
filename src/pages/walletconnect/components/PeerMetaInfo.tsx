import * as React from 'react';
import { IClientMeta } from '@walletconnect/types';
import { useRecoilState } from 'recoil';
import { Layout } from 'antd';
import { Content, Footer, Header } from 'antd/lib/layout/layout';
import { useTranslation } from 'react-i18next';
import { walletConnectStateAtom } from '../../../service/walletconnect/store';

export const PeerMetaInfo = () => {
  const [t] = useTranslation();
  const [state, setState] = useRecoilState(walletConnectStateAtom);

  return (
    <>
      <img style={{ width: '100px' }} src={state.peerMeta?.icons[0]} />
      <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>
        {state.peerMeta?.name}
      </div>
    </>
  );
};
