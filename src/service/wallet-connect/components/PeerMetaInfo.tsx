import * as React from 'react';
import { IClientMeta } from '@walletconnect/types';

interface PeerMetaInfoProps {
  peerMeta: IClientMeta;
}

export const PeerMetaInfo = ({ peerMeta }: PeerMetaInfoProps) => {
  return (
    <>
      <img style={{ width: '100px' }} src={peerMeta.icons[0]} />
      <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>
        {peerMeta.name}
      </div>
    </>
  );
};
