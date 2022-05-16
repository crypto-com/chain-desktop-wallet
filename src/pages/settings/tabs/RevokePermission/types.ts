import { Contract, ethers } from 'ethers';
import { Log } from '@ethersproject/abstract-provider';

export interface CRC20TokenData {
  contract: Contract;
  symbol: string;
  decimals: number;
  balance: string;
  approvals: Log[];
}

export interface TokenDataWithApproval {
  token: Omit<CRC20TokenData, 'approvals'>;
  approval: {
    spender: string;
    readableSpenderName: string;
    amount: ethers.BigNumber;
    riskExposure: string;
    tx: string;
  };
  rowSpan: number;
}
