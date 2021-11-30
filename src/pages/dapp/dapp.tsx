import { Button } from 'antd';
import * as React from 'react';
import { useState } from 'react';
import DappBrowser from './browser/DappBrowser';
import { Dapp } from './types';

const DappList: Dapp[] = [
  {
    name: 'VVS Finance',
    description:
      'Your gateway to the decentralized finance movement. Take control of your finances and earn sparkly VVS rewards.',
    url: 'https://vvs.finance',
  },
  {
    name: 'Cronos Chimp Club',
    description: 'xxx',
    url: 'https://cronoschimp.club/',
  },
  {
    name: 'Beefy Finance',
    description: '',
    url: 'https://app.beefy.finance/#/cronos',
  },
];

const DappPage = () => {
  const [selectedDapp, setSelectedDapp] = useState<Dapp>();

  return (
    <div>
      {DappList.map(dapp => {
        return (
          <Button
            onClick={() => {
              setSelectedDapp(dapp);
            }}
          >
            {dapp.name}
          </Button>
        );
      })}
      {selectedDapp && <DappBrowser dapp={selectedDapp} />}
    </div>
  );
};

export default DappPage;
